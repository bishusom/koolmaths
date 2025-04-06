const config = {
    kinder: {
        name: "Kindergarten Questers 🐛➡🦋",
        operations: ['+'],
        maxNumber: 10,
        time: 90,
        emoji: '📚',
        correctPoints: 10,
        wrongPenalty: 0,
        speedBonusThreshold: 3,
        speedBonusMultiplier: 1.5,
        streakBonus: 3,
        basePoints: 10,
        penaltyMultiplier: 1.2
    },
    primary1: {
        name: "Grade 1-3 Number Ninjas 🥷✨",
        operations: ['+', '-', '×'],
        maxNumber: 30,
        time: 120,
        emoji: '🎒',
        correctPoints: 15,
        wrongPenalty: 2,
        speedBonusThreshold: 3,
        speedBonusMultiplier: 1.7,
        streakBonus: 3,
        basePoints: 15,
        penaltyMultiplier: 1.3
    },
    primary2: {
        name: "Grade 4-6 Math Mavericks 🤠🔢",
        operations: ['BODMAS', '÷', '²'],
        maxNumber: 100,
        time: 120,
        emoji: '🧮',
        correctPoints: 20,
        wrongPenalty: 5,
        maxAttempts: 15,
        patterns: [
            '(a ± b) × (c ± d)',
            'a × (b ± c) ÷ d',
            '(a + b) × c - d',
            'a ÷ (b ± c)',
            '(a × b) + (c × d)',
            'a - (b × c) ÷ d',
            '(a + b) ÷ (c - d)',
            'a² ± b × c'
        ],
        speedBonusThreshold: 5,
        speedBonusMultiplier: 2.5,
        streakBonus: 4,
        basePoints: 25,
        penaltyMultiplier: 1.6
    },
    secondary: {
        name: "Grade 7-8 Algebra Avengers 🦸♂️📐",
        operations: ['eq', '√', '()'],
        maxNumber: 150,
        time: 120,
        emoji: '⚡',
        correctPoints: 25,
        wrongPenalty: 10,
        maxAttempts: 15,
        speedBonusThreshold: 5,
        speedBonusMultiplier: 2.5,
        streakBonus: 3,
        basePoints: 25,
        penaltyMultiplier: 1.5
    },
    genius: {
        name: "Math Megastars 🌟🧠",
        operations: ['eq', '²', '√', '()', 'π'],
        maxNumber: 200,
        time: 120,
        emoji: '🎇',
        correctPoints: 30,
        wrongPenalty: 15,
        equationChance: 0.7,
        maxAttempts: 20,
        speedBonusThreshold: 5,
        speedBonusMultiplier: 3,
        streakBonus: 5,
        basePoints: 30,
        penaltyMultiplier: 2
    }
};

let currentLevel = 'kinder';
let score = 0;
let timeLeft = 0;
let gameActive = false;
let currentProblem = null;
let timerInterval = null;
let totalQuestions = 0;
let correctAnswers = 0;
let currentStreak = 0;
let remainingTime = 0;
let problemHistory = [];
let pendingTimeout = null;
let isPaused = false;
let isMuted = localStorage.getItem('muteState') === 'true';


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
    currentLevelEmoji: document.getElementById('currentLevelEmoji'),
    currentLevelName: document.getElementById('currentLevelName')
};

const MAX_HISTORY = 10;

// Event Listeners
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => setLevel(btn.dataset.level));
    // Add double-click handler
    btn.addEventListener('dblclick', () => {
        setLevel(btn.dataset.level);
        startGame();
    });
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
    
    // Persist state
    localStorage.setItem('muteState', isMuted);
    
    // Update UI
    const icon = elements.muteBtn.querySelector('.icon');
    icon.textContent = isMuted ? '🔇' : '🔊';
    elements.muteBtn.classList.toggle('muted', isMuted);

    // Pause all sounds if muted
    if(isMuted) {
        Object.values(elements).forEach(element => {
            if(element instanceof HTMLAudioElement) {
                element.pause();
                element.currentTime = 0;
            }
        });
    }
}

// Set initial state on page load
toggleMute(isMuted);

function togglePause() {
    isPaused = !isPaused;
    elements.pauseBtn.classList.toggle('paused', isPaused);

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
            if (currentLevel === 'primary2') generateBodmasProblem(params);
            else if (currentLevel === 'secondary' || currentLevel === 'genius') generateAdvancedProblem(params);
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
    let emojiVisual = ''
    currentProblem = {};

    switch(currentLevel) {
        case 'kinder':
            num1 = randomNumber(5); // 1-5
            num2 = randomNumber(10 - num1); // 1-5 (total ≤ 10)
            emojiVisual = createEmojiVisual(num1, num2);
            console.log(emojiVisual)
            break;
        case 'primary1':
            if(operator === '-') {
                num1 = randomNumber(params.maxNumber, 10);
                num2 = randomNumber(num1, 1);
            } else {
                num1 = randomNumber(params.maxNumber, 5);
                num2 = randomNumber(params.maxNumber, 5);
            }
            break;
            
        default:
            num1 = randomNumber(params.maxNumber);
            num2 = randomNumber(params.maxNumber);
    }

    switch(operator) {
        case '+': 
            correctAnswer = num1 + num2;
            break;
        case '-': 
            correctAnswer = num1 - num2;
            break;
        case '×': 
            correctAnswer = num1 * num2;
            break;
        case '÷':
            num2 = randomNumber(12, 1);
            correctAnswer = randomNumber(12);
            num1 = num2 * correctAnswer;
            break;
    }

    currentProblem = { 
        problemText: `${num1} ${operator} ${num2} = ?`,
        correctAnswer,
        emojiVisual
    };
}

function generateAdvancedProblem(params) {
    const generators = {
        secondary: [
            generateLinearEquation,
            generateParenthesisEquation,
            generateSquareEquation
        ],
        genius: [
            generateComplexEquation,
            generateSquareEquation,
            generateSqrtEquation,
            generateFractionEquation,
            generateAlgebraicExpression
        ]
    };
    
    let safeAttempts = 0;
    while(safeAttempts < 10) {
        const generator = generators[currentLevel][Math.floor(Math.random() * generators[currentLevel].length)];
        const problem = generator();
        
        if(problem && validateAnswer(problem.correctAnswer)) {
            currentProblem = problem;
            return;
        }
        safeAttempts++;
    }
    currentProblem = generateFallbackProblem();
}

// Advanced problem generators
function generateLinearEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(12, 2);
    const b = randomNumber(30, 1);
    const c = a * x + b;
    
    return {
        problemText: `Solve for x: ${a}x + ${b} = ${c}`,
        correctAnswer: x
    };
}

function generateParenthesisEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(10, 2); // Changed from (10,1) to (10,2)
    const d = randomNumber(15, 1);
    const e = a * (x - d);
    
    return {
        problemText: `Solve for x: ${a}(x - ${d}) = ${e}`,
        correctAnswer: x
    };
}

function generateSquareEquation() {
    const x = randomNumber(15, 1);
    const coefficient = randomNumber(9, 2);
    return {
        problemText: `${coefficient}x² = ${coefficient * x ** 2}`,
        correctAnswer: x
    };
}

function generateComplexEquation() {
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
    if (currentLevel == 'secondary') {
        const base = randomNumber(20, 2);
        return {
            problemText: `√${base ** 2} = ?`,
            correctAnswer: base
        };
    } else {    
        const terms = [
            `${randomInt(2, 5)}x`, 
            `${randomInt(1, 4)}y`, 
            `-(${randomInt(1, 3)}x - ${randomInt(1, 3)}y)`, 
            `${randomInt(2, 4)}*${randomInt(2, 5)}z`
        ];
        
        // Combine terms into a complex expression
        const innerExpression = shuffle(terms).join(' + '); // e.g., "3x + 2y - (x - 4y)"
        
        return {
            question: `√[(${innerExpression})²]`,
            answer: `|${simplifyExpression(innerExpression)}|`, // Use a simplification library or custom logic
        };
    }    
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

function generateAlgebraicExpression() {
    const a = randomNumber(20, 5);
    const b = randomNumber(15, 5);
    const c = randomNumber(10, 2);
    const d = randomNumber(20);
    return {
        problemText: `(${a} + ${b}) × ${c} - ${d} = ?`,
        correctAnswer: (a + b) * c - d
    };
}

function generateBodmasProblem(params) {
    let safeAttempts = 0;
    while(safeAttempts < params.maxAttempts) {
        safeAttempts++;
        try {
            const pattern = params.patterns[Math.floor(Math.random() * params.patterns.length)];
            const numbers = generateSafeNumbers(pattern);
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
    currentProblem = generateFallbackProblem();
}

function showAnswers() {
    elements.answersContainer.innerHTML = '';
    if(!currentProblem) currentProblem = generateFallbackProblem();

    const answers = [currentProblem.correctAnswer];
    while(answers.length < 4) {
        const wrong = currentProblem.correctAnswer + randomNumber(3, -2);
        if(wrong > 0 && !answers.includes(wrong)) answers.push(wrong);
    }
    
    if(currentLevel === 'kinder') {
        elements.problemElement.innerHTML = `
            ${currentProblem.problemText}
            <div class="emoji-visual">
                ${currentProblem.emojiVisual}
            </div>    
            `;
    } else {
        elements.problemElement.textContent = currentProblem.problemText;
    }

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

    if(isCorrect) {
        currentStreak++;
        pointsEarned = levelConfig.basePoints;
        
        if(currentStreak >= levelConfig.streakBonus) {
            const bonus = Math.round(levelConfig.basePoints * levelConfig.speedBonusMultiplier);
            pointsEarned += bonus;
            bonusMessage = `<div class="streak-feedback">🔥 ${currentStreak} ✅ In-A-Row! +${bonus} bonus</div>`;
        }
        
        score += pointsEarned;
        correctAnswers++;
        playSound(elements.correctSound);
    } else {
        currentStreak = 0;
        score = Math.max(0, score - levelConfig.wrongPenalty);
        playSound(elements.wrongSound);
    }

    elements.scoreElement.textContent = score;
    elements.feedbackElement.classList.remove('wrong');
    elements.feedbackElement.classList.add('visible', isCorrect ? 'correct' : 'wrong');
    elements.feedbackElement.innerHTML = isCorrect 
        ? `<div>🎉 Correct! 🎉 +${pointsEarned}</div>${bonusMessage}`
        : `<div>❌ Wrong! ❌ -${levelConfig.wrongPenalty}</div>
           <div class="correct-answer">Correct: ${currentProblem.correctAnswer}</div>`;

    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.add(Number(btn.textContent) === currentProblem.correctAnswer ? 'correct' : 'wrong');
    });

    pendingTimeout = setTimeout(() => {
        if(gameActive) {
            generateProblem();
            elements.feedbackElement.classList.remove('visible');
        }
    }, 1500);
}

function generateFallbackProblem() {
    if (currentLevel === 'kinder') {
        const num1 = randomNumber(5); // 1-5
        const num2 = randomNumber(10 - num1); // Ensures sum ≤ 10
        return {
            problemText: `${num1} + ${num2} = ?`,
            correctAnswer: num1 + num2,
            emojiVisual: createEmojiVisual(num1, num2)
        };
    } else if (currentLevel === 'primary1') {
        const num1 = randomNumber(30, 1);
        const num2 = randomNumber(30, 1);
        return {
            problemText: `${num1} + ${num2} = ?`,
            correctAnswer: num1 + num2
        };
    } else {
        // Existing multiplication fallback for other levels
        const a = randomNumber(99, 19);
        const b = randomNumber(11, 19);
        return {
            problemText: `${a} × ${b} = ?`,
            correctAnswer: a * b
        };
    }
}

function generateSafeNumbers(pattern) {
    const numbers = {
        a: randomNumber(15, 2),
        b: randomNumber(15, 2),
        c: randomNumber(12, 2),
        d: randomNumber(12, 2)
    };

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

    if(pattern.includes('-')) {
        numbers.a = Math.max(numbers.a, numbers.b + 1);
    }

    return numbers;
}

function buildExpression(pattern, numbers) {
    let expr = pattern.replace(/±/g, Math.random() > 0.5 ? '+' : '-');
    expr = expr.replace(/[abcd]/g, m => numbers[m]);
    return expr.replace(/×/g, '*').replace(/÷/g, '/');
}

function formatExpression(expr) {
    let formatted = expr.replace(/\*/g, '×').replace(/\//g, '÷')
                       .replace(/\d+/g, match => parseInt(match).toLocaleString())
                       .replace(/Math\.sqrt\((\d+)\)/g, '√$1');
    return formatted + ' = ?';
}

function calculateAnswer(expr) {
    try { return eval(expr); } 
    catch { return null; }
}

function validateAnswer(answer) {
    return Number.isInteger(answer) && answer > 0;
}

function randomNumber(max, min = 1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEmojiVisual(num1,num2) {
    const emojis = ['🍎', '🌸', '🚗', '🦆', '⚽', '🍦'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return emoji.repeat(num1)+' + '+emoji.repeat(num2);
}
