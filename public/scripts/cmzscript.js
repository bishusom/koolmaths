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
        operations: ['+', '-'],
        maxNumber: 30,
        time: 90,
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
        operations: ['BODMAS', '÷', '×','²'],
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

// [Keep all existing variables]
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
let currentLevel = localStorage.getItem('lastLevel') || 'kinder';
let lastSelectedLevel = currentLevel;

const elements = {
    tagLine: document.querySelector('.tagline'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    startBtn: document.getElementById('startBtn'), // ADDED BACK - was missing
    euPrivacy: document.getElementById('eu-privacy'),
    gameContainer: document.querySelector('.game-container'),
    levelSelector: document.querySelector('.level-selector'),
    levelBtns: document.querySelectorAll('.level-btn'),
    mathResources: document.querySelector('.math-resources'),
    aboutSection: document.querySelector('.about-section'),
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
    homeBtn: document.getElementById('HomeBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    correctSound: document.getElementById('correctSound'),
    wrongSound: document.getElementById('wrongSound'),
    tickSound: document.getElementById('tickSound'),
    bonusSound: document.getElementById('bonusSound'),
    gameOverSound: document.getElementById('gameOverSound'),
    currentLevelEmoji: document.getElementById('currentLevelEmoji'),
    currentLevelName: document.getElementById('currentLevelName'), // ADDED BACK - was missing
    performanceMeter: document.createElement('div'),
    performanceBar: document.createElement('div'),
    feedbackForm: document.getElementById('feedbackForm'),
    cancelFeedback: document.getElementById('cancelFeedback'),
    closeFeedbackBtn: document.getElementById('closeFeedbackBtn'),
    formContent: document.querySelector('.form-content'),
    feedbackSuccess: document.querySelector('.feedback-success'),
    // Ad elements
    leftAd: document.getElementById('leftAdContainer'),
    rightAd: document.getElementById('rightAdContainer'),
    bottomAd: document.getElementById('bottomAdContainer')
};

// Initialize
elements.muteBtn.style.display = 'none';
elements.pauseBtn.style.display = 'none';

const MAX_HISTORY = 10;
const GA_TRACKING_ID = 'G-SHMYVQ4TGH'; // ADDED BACK - was missing
elements.performanceMeter.className = 'performance-meter';
elements.performanceBar.className = 'performance-bar';
elements.performanceMeter.appendChild(elements.performanceBar);
const maxScoreDisplay = document.createElement('div');
maxScoreDisplay.className = 'max-score-display';
elements.performanceMeter.appendChild(maxScoreDisplay);
document.querySelector('.container').prepend(elements.performanceMeter);

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const storedLevel = localStorage.getItem('lastLevel');
    if (storedLevel) {
        setLevel(storedLevel);
    }
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    elements.themeToggleBtn.querySelector('.icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    // Initialize ad visibility
    showAds();
});

// Level button click - FIXED: Keep double-click functionality
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => setLevel(btn.dataset.level));
    // Add double-click handler - WAS MISSING
    btn.addEventListener('dblclick', () => {
        setLevel(btn.dataset.level);
        startGame();
    });
});

// Event Listeners - FIXED: Add back startBtn listener
elements.startBtn?.addEventListener('click', startGame);
elements.muteBtn.addEventListener('click', () => toggleMute());
elements.pauseBtn.addEventListener('click', togglePause);

// Replace the homeBtn event listener with this:
if (elements.homeBtn) {
    elements.homeBtn.addEventListener('click', () => {
        elements.gameOverScreen.classList.add('hidden');
        elements.tagLine.classList.remove('hidden');
        elements.levelSelector.classList.remove('hidden');
        elements.startBtn?.classList.remove('hidden');
        elements.euPrivacy.classList.remove('hidden');
        elements.gameContainer.classList.add('hidden');
        elements.mathResources.classList.remove('hidden'); 
        elements.aboutSection.classList.remove('hidden');
        
        // Show ads when returning to menu 
        document.body.classList.remove('game-active');
        showAds();
        
        elements.muteBtn.style.display = 'none';
        elements.pauseBtn.style.display = 'none';
        elements.themeToggleBtn.style.display = 'flex';
        
        score = 0;
        timeLeft = 0;
        problemHistory = [];
        elements.scoreElement.textContent = "0";
        elements.timerElement.textContent = "0";
        
        setLevel(lastSelectedLevel);
        toggleMute(localStorage.getItem('muteState') === 'true');
        
        elements.performanceBar.style.width = "0%";
        elements.performanceBar.style.background = 'linear-gradient(90deg, #ff7675, #fdcb6e)';
        
        // Stop any active game
        gameActive = false;
        clearInterval(timerInterval);
        clearTimeout(pendingTimeout);
    });
}

elements.playAgainBtn.addEventListener('click', () => {
    elements.gameOverScreen.classList.add('hidden');
    elements.tagLine.classList.remove('hidden');
    elements.levelSelector.classList.remove('hidden');
    elements.startBtn?.classList.remove('hidden'); // FIXED: Add optional chaining
    elements.euPrivacy.classList.remove('hidden');
    elements.gameContainer.classList.add('hidden');
    elements.mathResources.classList.remove('hidden');
    elements.aboutSection.classList.remove('hidden');
    
    // Show ads when returning to menu
    document.body.classList.remove('game-active');
    showAds();
    
    elements.muteBtn.style.display = 'none';
    elements.pauseBtn.style.display = 'none';
    elements.themeToggleBtn.style.display = 'flex';

    score = 0;
    timeLeft = 0;
    problemHistory = [];
    elements.scoreElement.textContent = "0";
    elements.timerElement.textContent = "0";
    
    setLevel(lastSelectedLevel);
    toggleMute(localStorage.getItem('muteState') === 'true');
    
    elements.performanceBar.style.width = "0%";
    elements.performanceBar.style.background = 'linear-gradient(90deg, #ff7675, #fdcb6e)';
});

elements.cancelFeedback.addEventListener('click', () => {
    elements.feedbackForm.classList.add('hidden');
});

elements.closeFeedbackBtn?.addEventListener('click', () => {
    elements.feedbackForm.classList.add('hidden');
    elements.formContent.classList.remove('hidden');
    elements.feedbackSuccess.classList.remove('visible');
});

document.getElementById('feedbackLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    showFeedbackForm();
})

document.querySelector('form[name="feedback"]').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
    })
    .then(() => {
        // Show success message and hide form
        elements.formContent.classList.add('hidden');
        elements.feedbackSuccess.classList.add('visible');
        form.reset();
    })
    .catch(error => {
        alert('There was an error submitting your feedback. Please try again.');
        console.error(error);
    });
});

// Add this function to show the feedback form
function showFeedbackForm() {    
    elements.feedbackForm.classList.remove('hidden');
    elements.feedbackForm.scrollIntoView({ behavior: 'smooth' });
    
    // Track feedback form view
    trackEvent('Engagement', 'Feedback Form Viewed', 'From Link', 0);
}

// Add this function to track events
function trackEvent(category, action, label, value) {
    if (typeof gtag === 'function') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    }
}

function toggleMute(forceState) {
    if(typeof forceState === 'boolean') {
        isMuted = forceState;
    } else {
        isMuted = !isMuted;
    }
    
    // Persist state
    localStorage.setItem('muteState', isMuted);
    
    // Update UI - FIXED: Add proper icon toggle
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

function toggleTheme() {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDarkMode ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    elements.themeToggleBtn.querySelector('.icon').textContent = isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('theme', newTheme);   
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
    lastSelectedLevel = level;
    localStorage.setItem('lastLevel', level); // Store in localStorage
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
            generateQuadraticEquation,  // Added new generator
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
    if (currentLevel === 'genius') {
        const x = randomNumber(15, 1);
        const a = randomNumber(9, 2);
        const b = randomNumber(20, 1);
        const c = a * x * x + b * x;
        return {
            problemText: `${a}x² + ${b}x = ${c}`,
            correctAnswer: x
        };
    } else {
        const x = randomNumber(15, 1);
        const coefficient = randomNumber(9, 2);
        return {
            problemText: `${coefficient}x² = ${coefficient * x ** 2}`,
            correctAnswer: x
        };
    }
}

function generateComplexEquation() {
    const x = randomNumber(20, 1);
    const a = randomNumber(12, 2);
    const c = randomNumber(12, 2);
    const d = randomNumber(10, 1);
    const b = (a - c) * x + a * d;
    
    return {
        problemText: `Solve for x: ${a}(x + ${d}) = ${c}x + ${b}`,
        correctAnswer: x
    };
}

// New quadratic equation generator for genius
function generateQuadraticEquation() {
    const a = -randomNumber(5, 1); // Generates -1 to -5
    const root = -a; // Positive root
    const b = 2 * a;
    const c = a * a;
    return {
        problemText: `Solve for x: x² + ${b}x + ${c} = 0`,
        correctAnswer: root
    };
}

function generateSqrtEquation() {
    if (currentLevel === 'secondary') {
        const base = randomNumber(20, 2);
        return {
            problemText: `√${base ** 2} = ?`,
            correctAnswer: base
        };
    } else {
        const c = randomNumber(5, 2); // 2-5
        const x = randomNumber(10, 1); // 1-10
        const a = randomNumber(3, 1); // 1-3
        const b = c**2 - a * x;
        return {
            problemText: `√(${a}x + ${b}) = ${c}`,
            correctAnswer: x
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
    const correct = currentProblem.correctAnswer;
    const lastDigitCorrect = correct % 10;

    while(answers.length < 4) {
        let wrong;
        
        if(['secondary', 'genius'].includes(currentLevel)) {
            // Special handling for advanced levels
            let attempts = 0;
            do {
                // Generate base wrong answer with larger variance
                wrong = correct + randomNumber(40, -30);
                attempts++;
                
                // Force different last digit after 3 attempts
                if(attempts > 3 && wrong % 10 === lastDigitCorrect) {
                    wrong += randomNumber(9, 1); // Adjust last digit
                }
            } while(
                wrong <= 0 || 
                wrong === correct || 
                answers.includes(wrong) || 
                (wrong % 10 === lastDigitCorrect && attempts <= 10)
            );
        } else {
            // Original logic for other levels
            wrong = correct + randomNumber(3, -2);
            if(wrong <= 0) wrong = correct + 2;
        }

        if(!answers.includes(wrong)) answers.push(wrong);
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
    
    // Hide ads during game
    document.body.classList.add('game-active');
    hideAds();
    
    elements.currentLevelEmoji.textContent = config[currentLevel].emoji;
    // FIXED: Add back the commented line for level buttons
    //document.querySelectorAll('.level-btn').forEach(btn => btn.hidden = true);
    elements.levelSelector.classList.add('hidden');
    elements.startBtn?.classList.add('hidden'); // FIXED: Add optional chaining
    elements.gameContainer.classList.remove('hidden');
    elements.tagLine.classList.add('hidden');
    elements.euPrivacy.classList.add('hidden');
    elements.mathResources.classList.add('hidden');
    elements.aboutSection.classList.add('hidden');

    trackEvent('Gameplay', 'Game Started', config[currentLevel].name, 0);

    // Show the control buttons - FIXED: Add back this comment
    elements.muteBtn.style.display = 'flex';
    elements.pauseBtn.style.display = 'flex';
    elements.themeToggleBtn.style.display = 'none';
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
    elements.performanceBar.style.width = "0%";
    elements.performanceBar.style.background = 'linear-gradient(90deg, #ff7675, #fdcb6e)';
    
    // Reset max score display to base value
    const baseMaxScores = {
        kinder: 200,
        primary1: 300,
        primary2: 600,
        secondary: 800,
        genius: 1000
    };
    document.querySelector('.max-score-display').textContent = baseMaxScores[currentLevel];
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
 
    // Show ads when game ends
    document.body.classList.remove('game-active');
    showAds();
    
    localStorage.removeItem(`maxScoreIncrease_${currentLevel}`);
    
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    elements.tagLine.classList.remove('hidden');
    elements.euPrivacy.classList.remove('hidden');
    playSound(elements.gameOverSound);
    elements.pauseBtn.disabled = true;

    const finalScore = score + Math.floor(timeLeft * 0.7); // FIXED: Add back comment
    const totalAnswered = totalQuestions;
    trackEvent('Gameplay', 'Game Completed', config[currentLevel].name, finalScore);

    const performanceCriteria = [
        { 
            message: "🏆 Math Megastar! 🧠", 
            minScore: 300, 
            minAnswered: 15 
        },
        { 
            message: "🔥 Brilliant Grinder! ⏳", 
            minScore: 200, 
            minAnswered: 10 
        },
        { 
            message: "📚 Steady Achiever! ✨", 
            minScore: 100, 
            minAnswered: 5 
        },
        { 
            message: "🌱 Keep Growing! 🌿", 
            minScore: 0, 
            minAnswered: 0 
        }
    ];

    const earnedTier = performanceCriteria.find(tier => 
        finalScore >= tier.minScore && 
        totalAnswered >= tier.minAnswered
    ) || performanceCriteria[3];

    elements.performanceMessage.textContent = earnedTier.message;
    elements.finalScore.textContent = finalScore;
}

function checkAnswer(selected) {
    if (!gameActive || isPaused) return;
    clearTimeout(pendingTimeout);

    const isCorrect = selected === currentProblem.correctAnswer;
    const levelConfig = config[currentLevel];
    let pointsEarned = 0;
    let bonusMessage = '';

    // Create performance change element
    const performanceChange = document.createElement('div');
    performanceChange.className = 'performance-change';

    // Get current max scores
    const baseMaxScores = {
        kinder: 200,
        primary1: 300,
        primary2: 600,
        secondary: 800,
        genius: 1000
    };
    
    // Check if we need to increase max score
    let currentMaxScore = baseMaxScores[currentLevel];
    const storedMaxIncrease = localStorage.getItem(`maxScoreIncrease_${currentLevel}`) || 0;
    currentMaxScore += parseInt(storedMaxIncrease);
    
    // Update max score display
    document.querySelector('.max-score-display').textContent = currentMaxScore;

    if(isCorrect) {
        currentStreak++;
        pointsEarned = levelConfig.basePoints;
        
        if(currentStreak >= levelConfig.streakBonus) {
            const bonus = Math.round(levelConfig.basePoints * levelConfig.speedBonusMultiplier);
            pointsEarned += bonus;
            bonusMessage = `<div class="streak-feedback">🔥 ${currentStreak} ✅ In-A-Row! +${bonus} bonus</div>`;
            
            // Show bonus animation
            performanceChange.textContent = `+${bonus}!`;
            performanceChange.style.color = '#fdcb6e';
            elements.performanceBar.appendChild(performanceChange);
        }
        
        score += pointsEarned;
        correctAnswers++;
        playSound(elements.correctSound);
        
        // Show base points animation
        performanceChange.textContent = `+${levelConfig.basePoints}`;
        performanceChange.style.color = '#00b894';
        elements.performanceBar.appendChild(performanceChange);

        // Check if player reached max score
        if (score >= currentMaxScore && timeLeft > 10) {
            // Increase max score by 200
            const newMaxIncrease = parseInt(storedMaxIncrease) + 200;
            localStorage.setItem(`maxScoreIncrease_${currentLevel}`, newMaxIncrease.toString());
            
            // Show special message
            const maxScoreReached = document.createElement('div');
            maxScoreReached.className = 'performance-change';
            maxScoreReached.textContent = 'MAX+200!';
            maxScoreReached.style.color = '#00b894';
            maxScoreReached.style.fontWeight = 'bold';
            maxScoreReached.style.animation = 'floatUp 1.5s ease-out forwards';
            elements.performanceBar.appendChild(maxScoreReached);

            // Show bonus round message
            showBonusRoundMessage();
            
            // Play special sound if available
            playSound(elements.bonusSound); 
            
            // Update display immediately
            document.querySelector('.max-score-display').textContent = currentMaxScore + 200;
        }
    } else {
        currentStreak = 0;
        const penalty = levelConfig.wrongPenalty;
        score = Math.max(0, score - penalty);
        playSound(elements.wrongSound);
        
        // Show penalty animation
        performanceChange.textContent = `-${penalty}`;
        performanceChange.style.color = '#ff7675';
        elements.performanceBar.appendChild(performanceChange);
    }

    // Get updated max score in case it changed
    const updatedMaxScore = baseMaxScores[currentLevel] + (parseInt(localStorage.getItem(`maxScoreIncrease_${currentLevel}`)) || 0);
    const percentage = Math.min(100, (score / updatedMaxScore) * 100);
    elements.performanceBar.style.width = `${percentage}%`;
    
    // Change color based on performance
    if (percentage > 75) {
        elements.performanceBar.style.background = 'linear-gradient(90deg, #00b894, #55efc4)';
    } else if (percentage > 50) {
        elements.performanceBar.style.background = 'linear-gradient(90deg, #fdcb6e, #ffeaa7)';
    } else if (percentage > 25) {
        elements.performanceBar.style.background = 'linear-gradient(90deg, #fab1a0, #ff7675)';
    } else {
        elements.performanceBar.style.background = 'linear-gradient(90deg, #ff7675, #d63031)';
    }

    // ENHANCED VISUAL FEEDBACK FOR ANSWERS
    document.querySelectorAll('.answer-btn').forEach(btn => {
        const btnValue = Number(btn.textContent);
        btn.disabled = true;
        
        // Remove any existing classes
        btn.classList.remove('correct', 'wrong', 'neutral');
        
        if (isCorrect) {
            // If answer is correct: correct answer in green, others greyed out
            if (btnValue === currentProblem.correctAnswer) {
                btn.classList.add('correct');
                btn.innerHTML = `${btn.textContent} ✓`;
            } else {
                btn.classList.add('neutral');
                btn.style.opacity = '0.6';
            }
        } else {
            // If answer is wrong: selected wrong answer in red, correct answer in green, others greyed out
            if (btnValue === selected) {
                btn.classList.add('wrong');
                btn.innerHTML = `${btn.textContent} ✗`;
            } else if (btnValue === currentProblem.correctAnswer) {
                btn.classList.add('correct');
                btn.innerHTML = `${btn.textContent} ✓`;
            } else {
                btn.classList.add('neutral');
                btn.style.opacity = '0.6';
            }
        }
    });

    elements.scoreElement.textContent = score;
    elements.feedbackElement.classList.remove('wrong');
    elements.feedbackElement.classList.add('visible', isCorrect ? 'correct' : 'wrong');
    elements.feedbackElement.innerHTML = isCorrect 
        ? `<div>🎉 Correct! 🎉 +${pointsEarned}</div>${bonusMessage}`
        : `<div>❌ Wrong! ❌ -${levelConfig.wrongPenalty}</div>
           <div class="correct-answer">Correct: ${currentProblem.correctAnswer}</div>`;

    pendingTimeout = setTimeout(() => {
        if(gameActive) {
            generateProblem();
            elements.feedbackElement.classList.remove('visible');
            
            // Reset button styles for next question
            document.querySelectorAll('.answer-btn').forEach(btn => {
                btn.classList.remove('correct', 'wrong', 'neutral');
                btn.style.opacity = '1';
                btn.innerHTML = btn.textContent; // Remove checkmarks/crosses
            });
        }
    }, 2000); // Increased timeout to allow better visual feedback
}

function generateFallbackProblem() {
    console.log(currentLevel);
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

function showBonusRoundMessage() {
    // Pause the game
    const wasPaused = isPaused;
    if (!isPaused) {
        togglePause();
    }

    const bonusMessage = document.createElement('div');
    bonusMessage.className = 'bonus-round-message';
    bonusMessage.innerHTML = `
        <div class="bonus-round-content">
            <div class="bonus-round-title">🌟 BONUS ROUND! 🌟</div>
            <div class="bonus-round-text">Max Score Increased by 200!</div>
            <div class="bonus-round-emoji">🔥⚡🎯</div>
        </div>
    `;
    document.body.appendChild(bonusMessage);
    
    // Remove after animation
    setTimeout(() => {
        bonusMessage.classList.add('fade-out');
        setTimeout(() => {
            bonusMessage.remove();
            // Restore previous pause state only if we were the ones who paused it
            if (!wasPaused && isPaused) {
                togglePause();
            }
        }, 1000);
    }, 3000);
}

document.getElementById('open-cookie-settings')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('consent-modal').classList.remove('hidden');
});

// Add this to the DOMContentLoaded section in cmzscript.min.js
document.addEventListener('DOMContentLoaded', function() {
    const consentBanner = document.getElementById('consent-banner');
    const consentModal = document.getElementById('consent-modal');
    const acceptAllBtn = document.getElementById('accept-all');
    const settingsBtn = document.getElementById('settings-btn');
    const rejectAllBtn = document.getElementById('reject-all');
    const saveBtn = document.getElementById('save-preferences');
    const closeBtn = document.getElementById('modal-close');
    const consentForm = document.getElementById('consent-form');
  
    // Check if consent was already given - FIXED: Check localStorage properly
    const existingConsent = localStorage.getItem('cookieConsent');
    if (!existingConsent) {
      setTimeout(() => {
        consentBanner?.classList.remove('hidden');
      }, 1000);
    }
  
    // Button handlers with null checks
    acceptAllBtn?.addEventListener('click', () => {
      setConsent({ necessary: true, analytics: true, marketing: true });
      consentBanner?.classList.add('hidden');
    });
  
    settingsBtn?.addEventListener('click', () => {
      consentModal?.classList.remove('hidden');
    });
  
    rejectAllBtn?.addEventListener('click', () => {
      setConsent({ necessary: true, analytics: false, marketing: false });
      consentBanner?.classList.add('hidden');
    });
  
    saveBtn?.addEventListener('click', () => {
      const formData = new FormData(consentForm);
      const consent = {
        necessary: true, // Always true
        analytics: formData.get('analytics') === 'on',
        marketing: formData.get('marketing') === 'on'
      };
      setConsent(consent);
      consentModal?.classList.add('hidden');
      consentBanner?.classList.add('hidden');
    });
  
    closeBtn?.addEventListener('click', () => {
      consentModal?.classList.add('hidden');
    });
  
    function setConsent(consent) {
      localStorage.setItem('cookieConsent', JSON.stringify(consent));
      console.log('Consent set:', consent);
      
      // Implement your cookie setting logic here
      if (consent.analytics) {
        loadAnalytics();
      }
    }
  
    function loadAnalytics() {
        console.log('Loading analytics...');
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-SHMYVQ4TGH');
    }
});

function hideAds() {
    if (elements.leftAd) elements.leftAd.style.display = 'none';
    if (elements.rightAd) elements.rightAd.style.display = 'none';
    if (elements.bottomAd) elements.bottomAd.style.display = 'none';
}

function showAds() {
    const leftAdClosed = localStorage.getItem('leftAdClosed');
    const rightAdClosed = localStorage.getItem('rightAdClosed');
    const bottomAdClosed = localStorage.getItem('bottomAdClosed');
    
    // Desktop ads (768px and above)
    if (window.innerWidth > 768) {
        // Show vertical side ads on desktop
        if (!leftAdClosed && elements.leftAd) {
            elements.leftAd.style.display = 'block';
            refreshAd('left');
        }
        if (!rightAdClosed && elements.rightAd) {
            elements.rightAd.style.display = 'block';
            refreshAd('right');
        }
        // Hide bottom ad on desktop
        if (elements.bottomAd) {
            elements.bottomAd.style.display = 'none';
        }
    } else {
        // Mobile devices - show bottom ad only
        if (!bottomAdClosed && elements.bottomAd) {
            elements.bottomAd.style.display = 'block';
            refreshAd('bottom');
        }
        // Hide side ads on mobile
        if (elements.leftAd) {
            elements.leftAd.style.display = 'none';
        }
        if (elements.rightAd) {
            elements.rightAd.style.display = 'none';
        }
    }
}

function refreshAd(position) {
    setTimeout(() => {
        if (typeof adsbygoogle !== 'undefined') {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (error) {
                console.log(`Ad refresh error (${position}):`, error);
            }
        }
    }, 100);
}

// Ad close button handlers
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close-ad-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const adType = this.getAttribute('data-ad');
            const adContainer = document.getElementById(`${adType}AdContainer`);
            
            if (adContainer) {
                adContainer.style.display = 'none';
                localStorage.setItem(`${adType}AdClosed`, 'true');
                
                if (typeof gtag === 'function') {
                    gtag('event', 'ad_closed', {
                        'event_category': 'ad_interaction',
                        'ad_position': adType
                    });
                }
            }
        });
    });
    
    // Handle window resize to adjust ads
    window.addEventListener('resize', function() {
        if (!document.body.classList.contains('game-active')) {
            showAds();
        }
    });
    
    // Reset ad preferences after 24 hours
    setTimeout(() => {
        localStorage.removeItem('leftAdClosed');
        localStorage.removeItem('rightAdClosed');
        localStorage.removeItem('bottomAdClosed');
        if (!document.body.classList.contains('game-active')) {
            showAds();
        }
    }, 24 * 60 * 60 * 1000);
});

// Cookie consent functionality
document.addEventListener('DOMContentLoaded', function() {
    const consentBanner = document.getElementById('consent-banner');
    const consentModal = document.getElementById('consent-modal');
    const acceptAllBtn = document.getElementById('accept-all');
    const settingsBtn = document.getElementById('settings-btn');
    const rejectAllBtn = document.getElementById('reject-all');
    const saveBtn = document.getElementById('save-preferences');
    const closeBtn = document.getElementById('modal-close');
    const consentForm = document.getElementById('consent-form');
  
    // Check if consent was already given
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => {
            if (consentBanner) consentBanner.classList.remove('hidden');
        }, 1000);
    }
  
    // Button handlers with null checks
    if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', () => {
            setConsent({ necessary: true, analytics: true, marketing: true });
            if (consentBanner) consentBanner.classList.add('hidden');
        });
    }
  
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (consentModal) consentModal.classList.remove('hidden');
        });
    }
  
    if (rejectAllBtn) {
        rejectAllBtn.addEventListener('click', () => {
            setConsent({ necessary: true, analytics: false, marketing: false });
            if (consentBanner) consentBanner.classList.add('hidden');
        });
    }
  
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const formData = new FormData(consentForm);
            const consent = {
                necessary: true, // Always true
                analytics: formData.get('analytics') === 'on',
                marketing: formData.get('marketing') === 'on'
            };
            setConsent(consent);
            if (consentModal) consentModal.classList.add('hidden');
            if (consentBanner) consentBanner.classList.add('hidden');
        });
    }
  
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (consentModal) consentModal.classList.add('hidden');
        });
    }
  
    function setConsent(consent) {
        localStorage.setItem('cookieConsent', JSON.stringify(consent));
        console.log('Consent set:', consent);
        
        // Implement your cookie setting logic here
        if (consent.analytics) {
            loadAnalytics();
        }
    }
  
    function loadAnalytics() {
        console.log('Loading analytics...');
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-SHMYVQ4TGH');
    }
});