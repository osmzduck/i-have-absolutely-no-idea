// Game variables
let canvas;
let ctx;
let ball;
let obstacles = [];
let coins = [];
let goal;
let level = 1;
let score = 0;
let timeRemaining = 60;
let gameInterval;
let timerInterval;

// Game constants
const BALL_RADIUS = 10;
const BALL_SPEED = 5;
const OBSTACLE_SIZE = 30;
const COIN_RADIUS = 5;
const GOAL_SIZE = 50;
const LEVEL_COMPLETE_BONUS = 100;

// Game elements
const gameMenu = document.getElementById('game-menu');
const startButton = document.getElementById('start-button');
const instructionsButton = document.getElementById('instructions-button');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsButton = document.getElementById('close-instructions');
const levelInfo = document.getElementById('current-level');
const timerDisplay = document.getElementById('time-remaining');
const scoreDisplay = document.getElementById('current-score');
const levelCompleteModal = document.getElementById('level-complete-modal');
const nextLevelButton = document.getElementById('next-level-button');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS,
        speed: BALL_SPEED,
        dx: 0,
        dy: 0
    };

    startButton.addEventListener('click', startGame);
    instructionsButton.addEventListener('click', showInstructions);
    closeInstructionsButton.addEventListener('click', closeInstructions);
    nextLevelButton.addEventListener('click', nextLevel);
    restartButton.addEventListener('click', restartGame);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Start the game
function startGame() {
    gameMenu.classList.add('hidden');
    resetGame();
    gameLoop();
    startTimer();
}

// Reset the game
function resetGame() {
    level = 1;
    score = 0;
    timeRemaining = 60;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0;
    ball.dy = 0;
    obstacles = [];
    coins = [];
    goal = null;
    generateLevel();
}

// Generate a new level
function generateLevel() {
    levelInfo.textContent = level;

    // Generate obstacles
    for (let i = 0; i < level * 5; i++) {
        const obstacle = {
            x: Math.random() * (canvas.width - OBSTACLE_SIZE),
            y: Math.random() * (canvas.height - OBSTACLE_SIZE),
            width: OBSTACLE_SIZE,
            height: OBSTACLE_SIZE
        };
        obstacles.push(obstacle);
    }

    // Generate coins
    for (let i = 0; i < level * 3; i++) {
        const coin = {
            x: Math.random() * (canvas.width - COIN_RADIUS * 2) + COIN_RADIUS,
            y: Math.random() * (canvas.height - COIN_RADIUS * 2) + COIN_RADIUS,
            radius: COIN_RADIUS
        };
        coins.push(coin);
    }

    // Generate goal
    goal = {
        x: Math.random() * (canvas.width - GOAL_SIZE),
        y: Math.random() * (canvas.height - GOAL_SIZE),
        width: GOAL_SIZE,
        height: GOAL_SIZE
    };
}

// Game loop
function gameLoop() {
    update();
    render();

    gameInterval = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Move the ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Check for collision with walls
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
        ball.dx *= -1;
    }
    if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) {
        ball.dy *= -1;
    }

    // Check for collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        if (
            ball.x + ball.radius > obstacle.x &&
            ball.x - ball.radius < obstacle.x + obstacle.width &&
            ball.y + ball.radius > obstacle.y &&
            ball.y - ball.radius < obstacle.y + obstacle.height
        ) {
            gameOver();
            return;
        }
    }

    // Check for collision with coins
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        if (
            Math.sqrt(
                (ball.x - coin.x) ** 2 + (ball.y - coin.y) ** 2
            ) < ball.radius + coin.radius
        ) {
            coins.splice(i, 1);
            score += 10;
            scoreDisplay.textContent = score;
        }
    }

    // Check for collision with goal
    if (
        ball.x + ball.radius > goal.x &&
        ball.x - ball.radius < goal.x + goal.width &&
        ball.y + ball.radius > goal.y &&
        ball.y - ball.radius < goal.y + goal.height
    ) {
        levelComplete();
    }
}

// Render the game
function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    ctx.closePath();

    // Draw obstacles
    ctx.fillStyle = '#0000ff';
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Draw coins
    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // Draw goal
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
}

// Handle key down event
function handleKeyDown(event) {
    switch (event.keyCode) {
        case 37: // Left arrow
        case 65: // A key
            ball.dx = -ball.speed;
            break;
        case 38: // Up arrow
        case 87: // W key
            ball.dy = -ball.speed;
            break;
        case 39: // Right arrow
        case 68: // D key
            ball.dx = ball.speed;
            break;
        case 40: // Down arrow
        case 83: // S key
            ball.dy = ball.speed;
            break;
    }
}

// Handle key up event
function handleKeyUp(event) {
    switch (event.keyCode) {
        case 37: // Left arrow
        case 65: // A key
        case 39: // Right arrow
        case 68: // D key
            ball.dx = 0;
            break;
        case 38: // Up arrow
        case 87: // W key
        case 40: // Down arrow
        case 83: // S key
            ball.dy = 0;
            break;
    }
}

// Show instructions modal
function showInstructions() {
    instructionsModal.classList.remove('hidden');
}

// Close instructions modal
function closeInstructions() {
    instructionsModal.classList.add('hidden');
}

// Start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = timeRemaining;

        if (timeRemaining <= 0) {
            gameOver();
        }
    }, 1000);
}

// Level complete
function levelComplete() {
    cancelAnimationFrame(gameInterval);
    clearInterval(timerInterval);
    score += LEVEL_COMPLETE_BONUS + timeRemaining;
    scoreDisplay.textContent = score;
    levelCompleteModal.classList.remove('hidden');
}

// Next level
function nextLevel() {
    levelCompleteModal.classList.add('hidden');
    level++;
    timeRemaining = 60;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0;
    ball.dy = 0;
    obstacles = [];
    coins = [];
    generateLevel();
    gameLoop();
    startTimer();
}

// Game over
function gameOver() {
    cancelAnimationFrame(gameInterval);
    clearInterval(timerInterval);
    finalScoreDisplay.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// Restart the game
function restartGame() {
    gameOverModal.classList.add('hidden');
    resetGame();
    gameLoop();
    startTimer();
}

// Start the game when the page loads
window.addEventListener('load', init);
