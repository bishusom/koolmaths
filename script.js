const config = {
    baby: {
        operations: ['+'],
        maxNumber: 5,
        time: 60,
        emoji: '👶',
        complexChance: 0,
        correctPoints: 10,
        wrongPenalty: 0,
        equationChance: 0
    },
    toddler: {
        operations: ['+', '-'],
        maxNumber: 10,
        time: 60,
        emoji: '🚼',
        complexChance: 0,
        correctPoints: 15,
        wrongPenalty: 2,
        equationChance: 0
    },
    kid: {
        operations: ['BODMAS'],
        maxNumber: 50,
        time: 90,
        complexChance: 1,
        correctPoints: 20,
        wrongPenalty: 5,
        emoji: '🧒',
        maxAttempts: 10,
        fallbackChance: 0.1,
        patterns: [
            '(a ± b) × c',
            'a × (b ± c)',
            'a + b × c',
            'a ÷ b + c',
            '(a + b) ÷ c',
            'a - b × c',
            'a × b + c × d',
            'a ÷ (b + c)'
        ]
    },
    genius: {
        operations: ['eq', '²', '√', '()'],
        maxNumber: 100,
        time: 75,
        emoji: '🧠',
        complexChance: 0.8,
        correctPoints: 25,
        wrongPenalty: 10,
        equationChance: 0.7,
        maxAttempts: 15
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
let isMuted = false;
let isPaused = false;
let remainingTime = 0;
let problemHistory = [];

const elements = {
    startBtn: document.getElementById('startBtn'),
    gameContainer: document.querySelector('.game-container'),
    levelBtns: document.querySelectorAll('.level-btn'),
    scoreElement: document.getElementById('score'),
    timerElement: document.getElementById('timer'),
    problemElement: document.getElementById('problem'),
    answersContainer: document.getElementById('answers'),
    feedbackElement: document.getElementById('feedback'),
    gameOverScreen: document.querySelector('.game-over'),
    finalScore: document.getElementById('finalScore'),
    maxScore: document.getElementById('maxScore'),
    performanceMessage: document.getElementById('performanceMessage'),
    correctSound: document.getElementById('correctSound'),
    wrongSound: document.getElementById('wrongSound'),
    tickSound: document.getElementById('tickSound'),
    gameOverSound: document.getElementById('gameOverSound')
};
const muteBtn = document.getElementById('muteBtn');
const pauseBtn = document.getElementById('pauseBtn');
const MAX_HISTORY = 10; // Remember last 10 questions

if(localStorage.getItem('muteState') === 'true') {
    toggleMute(true);
}

// Event Listeners
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => setLevel(btn.dataset.level));
});

document.getElementById('startBtn').addEventListener('click', startGame);

muteBtn.addEventListener('click', () => toggleMute());

pauseBtn.addEventListener('click', togglePause);

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('muteState', isMuted);
    
    // Update button appearance
    const icon = muteBtn.querySelector('.icon');
    icon.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', isMuted);
    
    // Force-stop all active sounds when muting
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
      // Show pause overlay
      const overlay = document.createElement('div');
      overlay.className = 'pause-overlay';
      overlay.textContent = 'PAUSED';
      document.body.appendChild(overlay);
      
      // Store remaining time and clear timer
      remainingTime = timeLeft;
      clearInterval(timerInterval);
      
      // Disable answer buttons
      document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
      });
    } else {
      // Remove overlay
      document.querySelector('.pause-overlay')?.remove();
      
      // Restart timer
      timeLeft = remainingTime;
      timerInterval = setInterval(updateTimer, 1000);
      
      // Re-enable answers
      document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = false;
      });
    }
}

function playSound(sound) {
    if(!isMuted && sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
}

function stopSound(sound) {
    if(!isMuted && sound) {
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

function startGame() {
    // Reset critical values
    totalQuestions = 0;
    correctAnswers = 0;
    currentProblem = null;
    isPaused = false;
    remainingTime = 0;
    pauseBtn.classList.remove('paused');
    document.querySelector('.pause-overlay')?.remove();
    document.body.classList.add('game-active');
    elements.startBtn.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    elements.gameOverScreen.classList.add('hidden');
    
    score = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    timeLeft = config[currentLevel].time;
    gameActive = true;
    
    elements.scoreElement.textContent = score;
    elements.timerElement.textContent = timeLeft;
    
    generateProblem();
    timerInterval = setInterval(updateTimer, 1000);
    elements.feedbackElement.classList.add('hidden')
    elements.feedbackElement.classList.remove('visible');
}


// Updated problem generation with safeguards
function generateProblem() {
    const params = config[currentLevel];
    let newProblem;
    let attempts = 0;
    
    do {
        attempts++;
        if(currentLevel === 'kid') {
            generateBodmasProblem(params);
            }
        else if(currentLevel === 'genius') {
                Math.random() < params.equationChance ? 
                    generateEquationProblem() : 
                    generateGeniusProblem();
            }        
        else if(Math.random() < params.complexChance) {
                generateBasicProblem(params);
            }
        else {
                generateBasicProblem(params);
            } 
        newProblem = currentProblem.problemText;
        // Allow duplicates after 5 attempts to prevent infinite loops
        if(attempts > 5) break;
    } while(problemHistory.includes(newProblem));
    
    problemHistory.push(newProblem);
    
    // Keep history buffer manageable
    if(problemHistory.length > MAX_HISTORY) {
        problemHistory.shift();
    }
    totalQuestions++;
    showAnswers();
}

function generateBasicProblem(params) {
    const operator = params.operations[Math.floor(Math.random() * params.operations.length)];
    let num1, num2, problemText, correctAnswer;

    switch(operator) {
        case '+':
            num1 = randomNumber(params.maxNumber);
            num2 = randomNumber(params.maxNumber);
            correctAnswer = num1 + num2;
            break;
        case '-':
            num1 = randomNumber(params.maxNumber);
            num2 = randomNumber(num1);
            correctAnswer = num1 - num2;
            break;
        case '×':
            num1 = randomNumber(10);
            num2 = randomNumber(10);
            correctAnswer = num1 * num2;
            break;
        case '÷':
            num2 = randomNumber(12, 1);
            correctAnswer = randomNumber(12);
            num1 = num2 * correctAnswer;
            break;
        case '²':
            num1 = randomNumber(15);
            correctAnswer = num1 ** 2;
            problemText = `${num1}² = ?`;
            break;
        case '√':
            num1 = randomNumber(15) ** 2;
            correctAnswer = Math.sqrt(num1);
            problemText = `√${num1} = ?`;
            break;
    }

    problemText = problemText || `${num1} ${operator} ${num2} = ?`;
    currentProblem = { problemText, correctAnswer };
    elements.problemElement.textContent = problemText;
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
        problem: `Solve for x: ${a}x + ${b} = ${c}`,
        answer: x // Always integer
    };
}

function generateParenthesisEquation() {
    const x = randomNumber(20, 1); // Solution (1-20)
    const a = randomNumber(10, 1); // Coefficient (1-10)
    const d = randomNumber(15, 1); // Offset (1-15)
    const e = a * (x - d); // Calculate RHS
    
    return {
        problem: `Solve for x: ${a}(x - ${d}) = ${e}`,
        answer: x // Always integer
    };
}

function generateAdvancedLinearEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(12, 2);
    const c = randomNumber(12, 2);
    const b = randomNumber(30, 1);
    const d = (a - c) * x + b;

    return {
        problem: `Solve for x: ${a}x + ${b} = ${c}x + ${d}`,
        answer: x
    };
}

function generateSquareEquation() {
    const x = randomNumber(15, 1);
    const coefficient = randomNumber(9, 2);
    const rhs = coefficient * (x ** 2);
    
    return {
        problem: `Solve for x: ${coefficient}x² = ${rhs}`,
        answer: x
    };
}

function generateSqrtEquation() {
    const x = randomNumber(10, 1) ** 2; // Ensures perfect square
    const coefficient = randomNumber(8, 2);
    const rhs = coefficient * Math.sqrt(x);

    return {
        problem: `Solve for x: ${coefficient}√x = ${rhs}`,
        answer: x
    };
}

function generateFractionEquation() {
    const x = randomNumber(20, 1);
    const denominator = randomNumber(10, 2);
    const numerator = randomNumber(40, 10);
    const rhs = numerator / denominator;
    
    return {
        problem: `Solve for x: (${numerator} + x)/${denominator} = ${rhs}`,
        answer: (rhs * denominator) - numerator
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

// ================== BODMAS PROBLEMS (kid Level) ==================
function generateBodmasProblem(params) {
    let safeAttempts = 0;
    let valid = false;
    
    while(!valid && safeAttempts < params.maxAttempts) {
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
                valid = true;
            }
        } catch {
            if(safeAttempts >= params.maxAttempts/2) {
                currentProblem = generateFallbackProblem();
                valid = true;
            }
        }
    }
    
    // Fallback if all attempts fail
    if(!valid) {
        currentProblem = generateFallbackProblem();
    }
}

// ================== GENIUS LEVEL PROBLEMS ==================
function generateGeniusProblem() {
    let safeAttempts = 0;
    let valid = false;
    
    while(!valid && safeAttempts < 5) {
        safeAttempts++;
        const problem = geniusProblemTypes[Math.floor(Math.random() * geniusProblemTypes.length)]();
        
        if(problem && validateAnswer(problem.answer)) {
            currentProblem = problem;
            valid = true;
        }
    }
    
    if(!valid) {
        currentProblem = generateFallbackProblem();
    }
}

const geniusProblemTypes = [
    () => ({
        problem: `${randomNumber(12)}² + ${randomNumber(15)} = ?`,
        answer: randomNumber(12)**2 + randomNumber(15)
    }),
    () => {
        const num = randomNumber(15)**2;
        return {
            problem: `√${num} × ${randomNumber(10)} = ?`,
            answer: Math.sqrt(num) * randomNumber(10)
        };
    },
    () => ({
        problem: `(${randomNumber(20,5)} + ${randomNumber(15,5)}) × ${randomNumber(10,2)} - ${randomNumber(20)} = ?`,
        answer: (randomNumber(20,5) + randomNumber(15,5)) * randomNumber(10,2) - randomNumber(20)
    })
];

// New safeguard functions
function generateSafeNumbers(pattern, params) {
    const numbers = {
        a: randomNumber(15, 2),
        b: randomNumber(15, 2),
        c: randomNumber(12, 2),
        d: randomNumber(12, 2)
    };

    // Ensure division safety
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

    // Negative result protection
    if(pattern.includes('-')) {
        numbers.a = Math.max(numbers.a, numbers.b + 1);
    }

    return numbers;
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

function generateBasicAnswers(correct) {
    const answers = [correct];
    while(answers.length < 4) {
        let wrong;
        const offset = Math.floor(Math.random() * 5) + 1;
        switch(Math.floor(Math.random() * 3)) {
            case 0: wrong = correct + offset; break;
            case 1: wrong = correct - offset; break;
            case 2: wrong = Math.round(correct * (0.8 + Math.random() * 0.4)); break;
        }
        wrong = Math.max(1, wrong);
        if(!answers.includes(wrong)) answers.push(wrong);
    }
    return answers.sort(() => Math.random() - 0.5);
}

function generateAlgebraAnswers(correct) {
    const answers = [correct];
    let attempts = 0;
    
    while(answers.length < 4 && attempts < 10) {
        attempts++;
        const wrong = this.generateWrongAnswer(correct);
        if(wrong !== correct && !answers.includes(wrong)) {
            answers.push(wrong);
        }
    }
    
    // Fallback mechanism
    while(answers.length < 4) {
        answers.push(correct + answers.length);
    }
    
    return answers.sort(() => Math.random() - 0.5);
}

function showAnswers() {
    elements.answersContainer.innerHTML = '';
    
    // Safety check
    if(!currentProblem || !currentProblem.problemText) {
        currentProblem = generateFallbackProblem();
    }

    const isAlgebra = currentProblem.problemText.includes('x');
    const answers = isAlgebra ? 
        generateAlgebraAnswers(currentProblem.correctAnswer) :
        generateBasicAnswers(currentProblem.correctAnswer);
    
    // Display problem text
    elements.problemElement.textContent = currentProblem.problemText;
    
    // Create answer buttons
    answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.onclick = () => checkAnswer(answer);
        elements.answersContainer.appendChild(button);
    });
}

function generateWrongAnswer(correct) {
    const mistakeType = Math.floor(Math.random() * 4);
    switch(mistakeType) {
        case 0: return correct + randomNumber(5, 1);
        case 1: return Math.max(1, correct - randomNumber(5, 1));
        case 2: return Math.round(correct * 0.8);
        default: return Math.round(correct * 1.2);
    }
}

function checkAnswer(selected) {
    if (!gameActive || isPaused) return; // Add pause check
    elements.feedbackElement.classList.remove('hidden')
    elements.feedbackElement.classList.add('visible');
    
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        if(Number(btn.textContent) === currentProblem.correctAnswer) {
            btn.classList.add('correct');
        } else {
            btn.classList.add('wrong');
        }
    });

    if(selected === currentProblem.correctAnswer) {
        playSound(elements.correctSound);
        score += config[currentLevel].correctPoints;
        correctAnswers++;
        //elements.feedbackElement.textContent = "🎉 <strong>Correct! 🎉 answer was </strong>"+ currentProblem.correctAnswer;
        elements.feedbackElement.innerHTML = "🎉 <strong>Correct!</strong> 🎉";
    } else {
        playSound(elements.wrongSound);
        score = Math.max(0, score - config[currentLevel].wrongPenalty);
        //elements.feedbackElement.textContent = "❌ Wrong! ❌Correct answer was "+ currentProblem.correctAnswer;
        elements.feedbackElement.innerHTML = `❌ <strong>Wrong!</strong> ❌Correct answer was ${currentProblem.correctAnswer}`;
    }

    elements.scoreElement.textContent = score;
    
    setTimeout(() => {
        if(gameActive) generateProblem();
    }, 1500);

    setTimeout(() => {
        elements.feedbackElement.classList.remove('visible');
    }, 1500);

}

function updateTimer() {
    if(!isPaused) {
        if(timeLeft > 0) {
            timeLeft--;
            elements.timerElement.textContent = timeLeft;
            if(timeLeft <= 10) {
                elements.tickSound.currentTime = 0;
                //elements.tickSound.play();
                playSound(elements.tickSound);  
            }
        } else if(timeLeft <= 0) {
            endGame();
        }
    }    
}

function endGame() {
    stopSound(elements.tickSound);
    gameActive = false;
    clearInterval(timerInterval);
    
    // Always show game over screen
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    
    // Handle zero-questions case
    const safeTotal = totalQuestions || 1; // Prevent division by zero
    const percentage = Math.round((correctAnswers / safeTotal) * 100);
    
    // Default message for no questions
    const messages = {
        90: "Math Wizard! 🧙♂️",
        75: "Brilliant! 🤩",
        50: "Good Effort! 😊",
        25: "Keep Trying! 💪",
        0: "You'll Get Better! 🐣"
    };
    
    const performance = totalQuestions === 0 ? 0 : 
        Object.keys(messages).reverse().find(threshold => percentage >= threshold);
    
    elements.performanceMessage.textContent = messages[performance];
    
    // Update scores safely
    elements.finalScore.textContent = score;
    elements.maxScore.textContent = totalQuestions * config[currentLevel].correctPoints || 0;
    
    // Add error handling for sound
    try {
        playSound(elements.gameOverSound);
    } catch (e) {
        console.log('Game over sound error:', e);
    }
}

/* function endGame() {
    stopSound(elements.tickSound);
    playSound(elements.gameOverSound);
    gameActive = false;
    document.body.classList.remove('game-active');
    document.body.classList.add('game-over-visible');
    clearInterval(timerInterval);
    timerInterval = null;
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const messages = {
        90: "Math Wizard! 🧙♂️",
        75: "Brilliant! 🤩",
        50: "Good Effort! 😊",
        25: "Keep Trying! 💪",
        0: "You'll Get Better! 🐣"
    };
    
    const performance = Object.keys(messages).reverse().find(threshold => percentage >= threshold);
    
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    elements.finalScore.textContent = score;
    elements.maxScore.textContent = totalQuestions * config[currentLevel].correctPoints;
    elements.performanceMessage.textContent = messages[performance];
    document.getElementById('currentLevelEmoji').textContent = '';
}*/

// ================== HELPER FUNCTIONS ==================
function buildExpression(pattern, numbers) {
    let expr = pattern
        .replace(/a/g, numbers.a)
        .replace(/b/g, numbers.b)
        .replace(/c/g, numbers.c)
        .replace(/d/g, numbers.d)
        .replace(/±/g, Math.random() > 0.5 ? '+' : '-');
    return expr.replace(/×/g, '*').replace(/÷/g, '/');
}

function calculateAnswer(expr) {
    try {
        return eval(expr);
    } catch {
        return null;
    }
}

function formatExpression(expr) {
    return expr
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/(\d+)/g, m => parseInt(m).toLocaleString()) + ' = ?';
}

function generateSafeNumbers(pattern) {
    const numbers = {
        a: randomNumber(15, 2),
        b: randomNumber(15, 2),
        c: randomNumber(12, 2),
        d: randomNumber(12, 2)
    };

    if(pattern.includes('÷')) {
        numbers.b = numbers.b || 1;
        numbers.a = numbers.b * randomNumber(10, 2);
    }
    if(pattern.includes('-')) {
        numbers.a = Math.max(numbers.a, numbers.b + 1);
    }
    return numbers;
}

function validateAnswer(answer) {
    return Number.isInteger(answer) && answer > 0 && answer <= 1000;
}

function randomNumber(max, min = 1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
