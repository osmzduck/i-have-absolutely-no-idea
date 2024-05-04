const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const levelInfo = document.getElementById('level-number');
const scoreInfo = document.getElementById('score');
const timerInfo = document.getElementById('timer');
const levelCompleteModal = document.getElementById('level-complete-modal');
const gameOverModal = document.getElementById('game-over-modal');
const nextLevelBtn = document.getElementById('next-level-btn');
const retryBtn = document.getElementById('retry-btn');

let gameLoop;
let currentLevel = 1;
let score = 0;
let timeRemaining = 60;
let timerInterval;

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    color: '#fff'
};

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function moveBall() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
}

function handleBallCollision() {
    // Ball collision with walls
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.velocityX = -ball.velocityX;
    }
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
    }

    // Ball collision with obstacles
    for (const obstacle of levels[currentLevel - 1].obstacles) {
        if (
            ball.x + ball.radius > obstacle.x &&
            ball.x - ball.radius < obstacle.x + obstacle.width &&
            ball.y + ball.radius > obstacle.y &&
            ball.y - ball.radius < obstacle.y + obstacle.height
        ) {
            // Collision detected, handle accordingly (e.g., reverse velocity, decrease score)
            ball.velocityX = -ball.velocityX;
            ball.velocityY = -ball.velocityY;
            score -= 10;
            updateScore();
        }
    }

    // Ball collision with goal
    const goal = levels[currentLevel - 1].goal;
    if (
        ball.x + ball.radius > goal.x &&
        ball.x - ball.radius < goal.x + goal.width &&
        ball.y + ball.radius > goal.y &&
        ball.y - ball.radius < goal.y + goal.height
    ) {
        // Level completed, show level complete modal
        showLevelCompleteModal();
    }
}

function updateScore() {
    scoreInfo.textContent = score;
}

function updateTimer() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerInfo.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimer();

        if (timeRemaining === 0) {
            // Time's up, show game over modal
            showGameOverModal();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timeRemaining = 60;
    updateTimer();
}

function showLevelCompleteModal() {
    levelCompleteModal.style.display = 'block';
    pauseGame();
}

function hideLevelCompleteModal() {
    levelCompleteModal.style.display = 'none';
}

function showGameOverModal() {
    gameOverModal.style.display = 'block';
    pauseGame();
}

function hideGameOverModal() {
    gameOverModal.style.display = 'none';
}

function loadLevel() {
    levelInfo.textContent = currentLevel;
    score = 0;
    updateScore();
    resetTimer();
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = 0;
    ball.velocityY = 0;
}

function drawLevel() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    for (const obstacle of levels[currentLevel - 1].obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Draw goal
    const goal = levels[currentLevel - 1].goal;
    ctx.fillStyle = goal.color;
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

    // Draw ball
    drawBall();
}

function updateGame() {
    moveBall();
    handleBallCollision();
    drawLevel();
}

function pauseGame() {
    clearInterval(gameLoop);
    clearInterval(timerInterval);
}

function startGame() {
    loadLevel();
    startTimer();
    gameLoop = setInterval(updateGame, 1000 / 60);
}

function resetGame() {
    currentLevel = 1;
    score = 0;
    loadLevel();
    startTimer();
    resumeGame();
}

function resumeGame() {
    gameLoop = setInterval(updateGame, 1000 / 60);
    startTimer();
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > levels.length) {
        // Game completed, show game complete message or restart from level 1
        currentLevel = 1;
    }
    loadLevel();
    hideLevelCompleteModal();
    resumeGame();
}

// Event listeners
document.addEventListener('keydown', (event) => {
    switch (event.keyCode) {
        case 37: // Left arrow
            ball.velocityX = -ball.speed;
            break;
        case 38: // Up arrow
            ball.velocityY = -ball.speed;
            break;
        case 39: // Right arrow
            ball.velocityX = ball.speed;
            break;
        case 40: // Down arrow
            ball.velocityY = ball.speed;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.keyCode) {
        case 37: // Left arrow
        case 39: // Right arrow
            ball.velocityX = 0;
            break;
        case 38: // Up arrow
        case 40: // Down arrow
            ball.velocityY = 0;
            break;
    }
});

nextLevelBtn.addEventListener('click', nextLevel);
retryBtn.addEventListener('click', resetGame);

// Start the game
startGame();
