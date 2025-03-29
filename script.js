const config = {
    baby: {
        operations: ['+'],
        maxNumber: 5,
        time: 60,
        emoji: '👶',
        correctPoints: 10,
        wrongPenalty: 0,
        speedBonusThreshold: 3,
        speedBonusMultiplier: 1.5,
        streakBonus: 3,
        basePoints: 10,
        penaltyMultiplier: 1.2
    },
    toddler: {
        operations: ['+', '-'],
        maxNumber: 20,
        time: 60,
        emoji: '🚼',
        correctPoints: 15,
        wrongPenalty: 2,
        speedBonusThreshold: 3,
        speedBonusMultiplier: 1.7,
        streakBonus: 3,
        basePoints: 15,
        penaltyMultiplier: 1.3
    },
    kid: {
        operations: ['BODMAS'],
        maxNumber: 100, // Increased from 50
        time: 90, // Reduced from 90 seconds
        emoji: '🧒',
        correctPoints: 20,
        wrongPenalty: 10, // Increased from 5
        maxAttempts: 15, // Increased from 10
        patterns: [
            '(a ± b) × (c ± d)', // New nested operations
            'a × (b ± c) ÷ d', // Added division complexity
            '(a + b) × c - d', // Multi-step operations
            'a ÷ (b ± c)', // More challenging division
            '(a × b) + (c × d)', // Larger multiplications
            'a - (b × c) ÷ d', // Complex subtraction
            '(a + b) ÷ (c - d)', // Combined operations
            'a² ± b × c' // Introduced squares
        ],
        speedBonusThreshold: 5, // Increased from 4
        speedBonusMultiplier: 2.5, // Increased from 2
        streakBonus: 4, // Increased from 3
        basePoints: 25, // Increased from 20
        penaltyMultiplier: 1.6 // Increased from 1.4
    },
    genius: {
        operations: ['eq', '²', '√', '()'],
        maxNumber: 100,
        time: 75,
        emoji: '🧠',
        correctPoints: 25,
        wrongPenalty: 10,
        equationChance: 0.7,
        maxAttempts: 15,
        speedBonusThreshold: 5,
        speedBonusMultiplier: 2.5,
        streakBonus: 3,
        basePoints: 25,
        penaltyMultiplier: 1.5
    }
};

let currentLevel = 'baby';
let score = 0;
let timeLeft = 0;
let gameActive = false;
let currentProblem = null;
let timerInterval = null;
let totalQuestions = 0;
let correctAnswers = 0;
let currentStreak = 0;
let isMuted = false;
let isPaused = false;
let remainingTime = 0;
let problemHistory = [];
let pendingTimeout = null;

const elements = {
    startBtn: document.getElementById('startBtn'),
    gameContainer: document.querySelector('.game-container'),
    levelBtns: document.querySelectorAll('.level-btn'),
    muteBtn: document.getElementById('muteBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    scoreElement: document.getElementById('score'),
    timerElement: document.getElementById('timer'),
    problemElement: document.getElementById('problem'),
    answersContainer: document.getElementById('answers'),
    feedbackElement: document.getElementById('answerFeedback'),
    gameOverScreen: document.querySelector('.game-over'),
    finalScore: document.getElementById('finalScore'),
    performanceMessage: document.getElementById('performanceMessage'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    correctSound: document.getElementById('correctSound'),
    wrongSound: document.getElementById('wrongSound'),
    tickSound: document.getElementById('tickSound'),
    gameOverSound: document.getElementById('gameOverSound'),
    currentLevelEmoji: document.getElementById('currentLevelEmoji')
};

const MAX_HISTORY = 10;

// Event Listeners
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => setLevel(btn.dataset.level));
});

elements.startBtn.addEventListener('click', startGame);
elements.muteBtn.addEventListener('click', () => toggleMute());
elements.pauseBtn.addEventListener('click', togglePause);

elements.playAgainBtn.addEventListener('click', () => {
    elements.gameOverScreen.classList.add('hidden');
    document.querySelectorAll('.level-btn').forEach(btn => btn.hidden = false);
    elements.startBtn.classList.remove('hidden');
    elements.gameContainer.classList.add('hidden');
    
    score = 0;
    timeLeft = 0;
    problemHistory = [];
    elements.scoreElement.textContent = "0";
    elements.timerElement.textContent = "0";
    toggleMute(localStorage.getItem('muteState') === 'true');
});

function toggleMute(forceState) {
    if(typeof forceState === 'boolean') {
        isMuted = forceState;
    } else {
        isMuted = !isMuted;
    }
    
    localStorage.setItem('muteState', isMuted);
    const icon = elements.muteBtn.querySelector('.icon');
    icon.textContent = isMuted ? '🔇' : '🔊';
    elements.muteBtn.classList.toggle('muted', isMuted);

    if(isMuted) {
        Object.values(elements).forEach(element => {
            if(element instanceof HTMLAudioElement) {
                element.pause();
                element.currentTime = 0;
            }
        });
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.classList.toggle('paused', isPaused);

    if(isPaused) {
        stopSound(elements.tickSound);
        const overlay = document.createElement('div');
        overlay.className = 'pause-overlay';
        overlay.textContent = 'PAUSED';
        document.body.appendChild(overlay);
        remainingTime = timeLeft;
        clearInterval(timerInterval);
        document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
    } else {
        document.querySelector('.pause-overlay')?.remove();
        timeLeft = remainingTime;
        timerInterval = setInterval(updateTimer, 1000);
        document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = false);
        if(timeLeft <= 10) playSound(elements.tickSound);
    }
}

function playSound(sound) {
    if(!isMuted && sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

function stopSound(sound) {
    if(sound) {
        sound.pause();
        sound.currentTime = 0;
    }
}

function setLevel(level) {
    currentLevel = level;
    elements.levelBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
    });
}

function generateProblem() {
    const params = config[currentLevel];
    let newProblem;
    let attempts = 0;
    
    do {
        attempts++;
        try {
            if (currentLevel === 'kid') generateBodmasProblem(params);
            else if (currentLevel === 'genius') generateGeniusProblem();
            else generateBasicProblem(params);
            
            newProblem = currentProblem.problemText;
        } catch (error) {
            currentProblem = generateFallbackProblem();
            break;
        }
        if (attempts > 5) break;
    } while(problemHistory.includes(newProblem));
    
    problemHistory.push(newProblem);
    if(problemHistory.length > MAX_HISTORY) problemHistory.shift();
    
    totalQuestions++;
    showAnswers();
}

function generateBasicProblem(params) {
    let operator = params.operations[Math.floor(Math.random() * params.operations.length)];
    let num1, num2, correctAnswer;

    if (currentLevel === 'toddler') {
        // Enforce at least one number ≥ 10
        if (operator === '+') {
            num1 = randomNumber(params.maxNumber, 10); // 10-20
            num2 = randomNumber(params.maxNumber, 1);  // 1-20 (at least num1 ≥10)
        } else { // Subtraction
            num1 = randomNumber(params.maxNumber, 10); // 10-20
            num2 = randomNumber(num1, 1); // 1-num1 (ensures non-negative)
        }
    } else { // For other levels (baby)
        num1 = randomNumber(params.maxNumber);
        num2 = randomNumber(operator === '-' ? num1 : params.maxNumber);
    }

    // Rest of the code remains the same...
    switch(operator) {
        case '+': correctAnswer = num1 + num2; break;
        case '-': correctAnswer = num1 - num2; break;
        case '×': correctAnswer = num1 * num2; break;
        case '÷':
            num2 = randomNumber(12, 1);
            correctAnswer = randomNumber(12);
            num1 = num2 * correctAnswer;
            break;
    }

    currentProblem = { 
        problemText: `${num1} ${operator} ${num2} = ?`,
        correctAnswer 
    };
    elements.problemElement.textContent = currentProblem.problemText;
}

function generateAdvancedLinearEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(12, 2);
    const c = randomNumber(12, 2);
    const b = randomNumber(30, 1);
    const d = (a - c) * x + b;

    return {
        problemText: `Solve for x: ${a}x + ${b} = ${c}x + ${d}`,
        correctAnswer: x
    };
}

function generateSqrtEquation() {
    const difficulty = {
        easy: { maxBase: 15 },
        medium: { maxBase: 25 },
        hard: { maxBase: 40 }
    };

    const tier = Math.random() > 0.7 ? 'hard' : Math.random() > 0.4 ? 'medium' : 'easy';
    const { maxBase } = difficulty[tier];
    const base = randomNumber(maxBase, 2);
    
    return {
        problemText: `√${base ** 2} = ?`,
        correctAnswer: base
    };
}

// ================== INTEGER-SAFE EQUATION GENERATORS ==================
function generateLinearEquation() {
    const x = randomNumber(15, 1); // Solution (1-15)
    const a = randomNumber(12, 1); // Coefficient (1-12)
    const b = randomNumber(30, 1); // Constant (1-30)
    console.log(x)
    console.log(a)
    console.log(b)
    const c = a * x + b; // Calculate RHS
    
    return {
        problemText: `Solve for x: ${a}x + ${b} = ${c}`,
        correctAnswer: x // Always integer
    };
}

function generateParenthesisEquation() {
    const x = randomNumber(20, 1); // Solution (1-20)
    const a = randomNumber(10, 1); // Coefficient (1-10)
    const d = randomNumber(15, 1); // Offset (1-15)
    const e = a * (x - d); // Calculate RHS
    
    return {
        problemText: `Solve for x: ${a}(x - ${d}) = ${e}`,
        correctAnswer: x // Always integer
    };
}

function generateAdvancedLinearEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(12, 2);
    const c = randomNumber(12, 2);
    const b = randomNumber(30, 1);
    const d = (a - c) * x + b;

    return {
        problemText: `Solve for x: ${a}x + ${b} = ${c}x + ${d}`,
        correctAnswer: x
    };
}

function generateSquareEquation() {
    const x = randomNumber(15, 1);
    const coefficient = randomNumber(9, 2);
    const rhs = coefficient * (x ** 2);
    
    return {
        problemText: `Solve for x: ${coefficient}x² = ${rhs}`,
        correctAnswer: x
    };
}

function generateSqrtEquation() {
    const difficulty = {
        easy: { maxBase: 15, coefficient: 1 },
        medium: { maxBase: 25, coefficient: randomNumber(5, 2) },
        hard: { 
            maxBase: 40,
            coefficient: randomNumber(8, 3),
            offset: randomNumber(12, 1),
            operation: Math.random() > 0.5 ? '+' : '-'
        }
    };

    const tier = Math.random() > 0.7 ? 'hard' : Math.random() > 0.4 ? 'medium' : 'easy';
    const { maxBase, coefficient, offset, operation } = difficulty[tier];
    
    // Ensure perfect square for clean answers
    const base = randomNumber(maxBase, 2);
    const x = base ** 2;
    
    let problem, answer;
    
    switch(tier) {
        case 'easy':
            problem = `√${x} = ?`;
            answer = base;
            break;
            
        case 'medium':
            problem = `${coefficient}√${x} = ?`;
            answer = coefficient * base;
            break;
            
        case 'hard':
            const modifiedX = operation === '+' ? x + offset : x - offset;
            problem = `√${modifiedX} ${operation} ${offset} = ${base}`;
            answer = coefficient * base;
            problem = `Solve for x: ${coefficient}√x ${operation} ${offset} = ${base}`;
            answer = ((base / coefficient) ** 2) + (operation === '+' ? -offset : offset);
            break;
    }

    return {
        problemText: problem,
        correctAnswer: answer
    };
}

function generateFractionEquation() {
    const x = randomNumber(20, 1);
    const denominator = randomNumber(10, 2);
    const numerator = randomNumber(40, 10);
    const rhs = numerator / denominator;
    
    return {
        problemText: `Solve for x: (${numerator} + x)/${denominator} = ${rhs}`,
        correctAnswer: (rhs * denominator) - numerator
    };
}

// ================== UPDATED EQUATION HANDLER ==================
function generateEquationProblem() {
    const generators = [
        generateAdvancedLinearEquation,
        generateSquareEquation,
        generateSqrtEquation,
        generateFractionEquation,
        generateParenthesisEquation
    ];
    
    let safeAttempts = 0;
    while(safeAttempts < 10) {
        const equation = generators[Math.floor(Math.random() * generators.length)]();
        if(equation && validateAnswer(equation.answer)) {
            currentProblem = {
                problemText: equation.problem,
                correctAnswer: equation.answer
            };
            return;
        }
        safeAttempts++;
    }
    currentProblem = generateFallbackProblem();
}

function generateBodmasProblem(params) {
    let safeAttempts = 0;
    while(safeAttempts < params.maxAttempts) {
        safeAttempts++;
        try {
            const pattern = params.patterns[Math.floor(Math.random() * params.patterns.length)];
            const numbers = generateSafeNumbers(pattern);
            // Add 25% chance for double-digit divisors in division problems
            if(pattern.includes('÷')) {
                numbers.d = randomNumber(25, 10);
                numbers.c = randomNumber(20, 5);
            }
            const expr = buildExpression(pattern, numbers);
            const answer = calculateAnswer(expr);

            if(validateAnswer(answer)) {
                currentProblem = {
                    problemText: formatExpression(expr),
                    correctAnswer: answer
                };
                return;
            }
        } catch (error) {
            console.error('BODMAS generation error:', error);
        }
    }
    // Fallback problem
    currentProblem = {
        problemText: `(${randomNumber(20)} + ${randomNumber(15)}) × ${randomNumber(10)} = ?`,
        correctAnswer: (randomNumber(20) + randomNumber(15)) * randomNumber(10) // Fixed syntax
    };
}

// ================== GENIUS LEVEL PROBLEMS ==================

function generateGeniusProblem() {
    let safeAttempts = 0;
    let valid = false;
    
    while (!valid && safeAttempts < 5) {
        safeAttempts++;
        const problemGenerator = geniusProblemTypes[Math.floor(Math.random() * geniusProblemTypes.length)];
        const problem = problemGenerator(); // Generate problem with variables
        
        if (problem && validateAnswer(problem.correctAnswer)) {
            currentProblem = problem; // Assign the full problem object
            valid = true;
        }
    }
    
    if (!valid) {
        currentProblem = generateFallbackProblem();
    }
}

const geniusProblemTypes = [
    // Existing arithmetic problems
    () => {
        const a = randomNumber(20, 5);
        const b = randomNumber(15, 5);
        const c = randomNumber(10, 2);
        const d = randomNumber(20);
        return {
            problemText: `(${a} + ${b}) × ${c} - ${d} = ?`,
            correctAnswer: (a + b) * c - d
        };
    },
    // Algebra/equation generators
    generateAdvancedLinearEquation,
    generateParenthesisEquation,
    generateSquareEquation,
    generateSqrtEquation,
    generateFractionEquation
];

function showAnswers() {
    elements.answersContainer.innerHTML = '';
    if(!currentProblem) currentProblem = generateFallbackProblem();

    const answers = [currentProblem.correctAnswer];
    while(answers.length < 4) {
        const wrong = currentProblem.correctAnswer + randomNumber(3, -2);
        if(wrong > 0 && !answers.includes(wrong)) answers.push(wrong);
    }
    
    elements.problemElement.textContent = currentProblem.problemText;
    answers.sort(() => Math.random() - 0.5).forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.onclick = () => checkAnswer(answer);
        elements.answersContainer.appendChild(button);
    });
}

function startGame() {
    clearInterval(timerInterval);
    clearTimeout(pendingTimeout);
    elements.currentLevelEmoji.textContent = config[currentLevel].emoji;
    document.querySelectorAll('.level-btn').forEach(btn => btn.hidden = true);
    elements.startBtn.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    
    // Enable pause button when game starts
    elements.pauseBtn.disabled = false;
    
    gameActive = true;
    isPaused = false;
    resetState();
    generateProblem();
    timerInterval = setInterval(updateTimer, 1000);
}

function resetState() {
    score = 0;
    timeLeft = config[currentLevel].time;
    totalQuestions = 0;
    correctAnswers = 0;
    currentStreak = 0;
    problemHistory = [];
    currentProblem = null;

    elements.pauseBtn.disabled = false;
    elements.scoreElement.textContent = "0";
    elements.timerElement.textContent = timeLeft;
    elements.feedbackElement.classList.remove('visible');
}

function updateTimer() {
    if(isPaused) return;
    
    timeLeft--;
    elements.timerElement.textContent = timeLeft;
    
    if(timeLeft <= 10) {
        playSound(elements.tickSound);
        if(timeLeft <= 0) endGame();
    }
}

function endGame() {
    gameActive = false;
    stopSound(elements.tickSound);
    clearInterval(timerInterval);
    clearTimeout(pendingTimeout);
    
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    playSound(elements.gameOverSound);
    elements.pauseBtn.disabled = true;

    const percentage = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
    const messages = {
        90: "Math Wizard! 🧙♂️", 75: "Brilliant! 🤩",
        50: "Good Effort! 😊", 25: "Keep Trying! 💪",
        0: "You'll Get Better! 🐣"
    };
    
    elements.performanceMessage.textContent = messages[Object.keys(messages).reverse().find(threshold => percentage >= threshold)];
    elements.finalScore.textContent = score;
}

function checkAnswer(selected) {
    if (!gameActive || isPaused) return;
    clearTimeout(pendingTimeout);

    const isCorrect = selected === currentProblem.correctAnswer;
    const levelConfig = config[currentLevel];
    let pointsEarned = 0;
    let bonusMessage = '';

    // Update streak and calculate points
    if(isCorrect) {
        currentStreak++;
        pointsEarned = levelConfig.basePoints;
        
        // Apply streak bonus
        if(currentStreak >= levelConfig.streakBonus) {
            const bonus = Math.round(
                levelConfig.basePoints * 
                levelConfig.speedBonusMultiplier
            );
            pointsEarned += bonus;
            bonusMessage = `<div class="streak-feedback">🔥 ${currentStreak}-in-a-row! +${bonus} bonus</div>`;
        }
        
        score += pointsEarned;
        correctAnswers++;
        playSound(elements.correctSound);
    } else {
        currentStreak = 0; // Reset streak
        score = Math.max(0, score - levelConfig.wrongPenalty);
        playSound(elements.wrongSound);
    }

    // Update UI elements
    elements.scoreElement.textContent = score;
    elements.feedbackElement.classList.remove('wrong');
    elements.feedbackElement.classList.add('visible', isCorrect ? 'correct' : 'wrong');
    elements.feedbackElement.innerHTML = isCorrect 
        ? `<div>🎉 Correct! 🎉 +${pointsEarned}</div>${bonusMessage}`
        : `<div>❌ Wrong! ❌ -${levelConfig.wrongPenalty}</div>
           <div class="correct-answer">Correct: ${currentProblem.correctAnswer}</div>`;

    // Disable buttons and show states
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
        const isCorrectButton = Number(btn.textContent) === currentProblem.correctAnswer;
        btn.classList.add(isCorrectButton ? 'correct' : 'wrong');
    });

    // Prepare next question
    pendingTimeout = setTimeout(() => {
        if(gameActive) {
            generateProblem();
            elements.feedbackElement.classList.remove('visible');
        }
    }, 1500);
}

function generateFallbackProblem(params) {
    console.log('Using fallback problem');
    // Simple guaranteed problem
    const a = randomNumber(99, 19);
    const b = randomNumber(11, 19);
    return {
        problemText: `${a} × ${b} = ?`,
        correctAnswer: a * b
    };
}

function generateSafeNumbers(pattern) {
    const numbers = {
        a: randomNumber(15, 2),
        b: randomNumber(15, 2),
        c: randomNumber(12, 2),
        d: randomNumber(12, 2)
    };

    // Handle division safety
    if(pattern.includes('÷')) {
        if(pattern.includes('(b + c)')) {
            numbers.c = randomNumber(5, 1);
            numbers.a = (numbers.b + numbers.c) * randomNumber(5, 1);
        }
        if(pattern.includes('÷ b')) {
            numbers.b = randomNumber(10, 2);
            numbers.a = numbers.b * randomNumber(10, 2);
        }
    }

    // Prevent negative results for subtraction
    if(pattern.includes('-')) {
        numbers.a = Math.max(numbers.a, numbers.b + 1);
    }

    return numbers;
}

function buildExpression(pattern, numbers) {
    // Replace ± first before other replacements
    let expr = pattern.replace(/±/g, Math.random() > 0.5 ? '+' : '-');
    expr = expr.replace(/[abcd]/g, m => numbers[m]);
    return expr.replace(/×/g, '*').replace(/÷/g, '/');
}

function formatExpression(expr) {
    // First convert * to × and / to ÷
    let formatted = expr.replace(/\*/g, '×').replace(/\//g, '÷');
    
    // Add thousand separators to numbers
    formatted = formatted.replace(/\d+/g, match => {
        return parseInt(match).toLocaleString();
    });
    
    // Format square root symbols
    formatted = formatted.replace(/Math\.sqrt\((\d+)\)/g, '√$1');
    
    return formatted + ' = ?';
}

function calculateAnswer(expr) {
    try { return eval(expr); } catch { return null; }
}

function validateAnswer(answer) {
    return Number.isInteger(answer) && answer > 0;
}

function randomNumber(max, min = 1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}