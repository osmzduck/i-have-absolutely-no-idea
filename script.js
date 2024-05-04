// Get DOM elements
const world = document.getElementById('world');
const player = document.getElementById('player');
const scoreValue = document.getElementById('score-value');
const timerValue = document.getElementById('timer-value');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('game-over');

// Game variables
let gameStarted = false;
let score = 0;
let timer = 0;
let gameLoop;

// Player variables
let playerSpeed = 5;
let playerJumpHeight = 15;
let playerGravity = 0.8;
let playerVelocityY = 0;
let playerGrounded = false;

// Obstacle variables
let obstacles = [];
let obstacleCount = 20;

// Collectible variables
let collectibles = [];
let collectibleCount = 10;

// Goal variables
let goal;

// Initialize game
function init() {
    // Reset game variables
    score = 0;
    timer = 0;
    scoreValue.textContent = score;
    timerValue.textContent = timer;

    // Reset player position
    player.style.transform = 'translate3d(0, 0, 15px)';
    playerVelocityY = 0;
    playerGrounded = false;

    // Generate obstacles
    obstacles = [];
    for (let i = 0; i < obstacleCount; i++) {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        obstacle.style.transform = `translate3d(${Math.random() * 750}px, ${Math.random() * 550}px, 25px)`;
        world.appendChild(obstacle);
        obstacles.push(obstacle);
    }

    // Generate collectibles
    collectibles = [];
    for (let i = 0; i < collectibleCount; i++) {
        const collectible = document.createElement('div');
        collectible.classList.add('collectible');
        collectible.style.transform = `translate3d(${Math.random() * 750}px, ${Math.random() * 550}px, 10px)`;
        world.appendChild(collectible);
        collectibles.push(collectible);
    }

    // Generate goal
    goal = document.createElement('div');
    goal.id = 'goal';
    goal.style.transform = `translate3d(${Math.random() * 700}px, ${Math.random() * 500}px, 30px)`;
    world.appendChild(goal);
}



// Update game
function updateGame() {
    // Update timer
    timer += 1 / 60;
    timerValue.textContent = timer.toFixed(2);

    // Update player position based on gravity
    playerVelocityY += playerGravity;
    const playerTransform = player.style.transform.match(/translate3d\((.+)px, (.+)px, (.+)px\)/);
    const playerX = parseFloat(playerTransform[1]);
    const playerY = parseFloat(playerTransform[2]);
    const playerZ = parseFloat(playerTransform[3]);
    player.style.transform = `translate3d(${playerX}px, ${playerY + playerVelocityY}px, ${playerZ}px)`;

    // Check player collision with ground
    if (playerY + playerVelocityY > 570) {
        player.style.transform = `translate3d(${playerX}px, 570px, ${playerZ}px)`;
        playerVelocityY = 0;
        playerGrounded = true;
    }

    // Check player collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const obstacleTransform = obstacle.style.transform.match(/translate3d\((.+)px, (.+)px, (.+)px\)/);
        const obstacleX = parseFloat(obstacleTransform[1]);
        const obstacleY = parseFloat(obstacleTransform[2]);
        const obstacleZ = parseFloat(obstacleTransform[3]);

        if (
            playerX < obstacleX + 50 &&
            playerX + 30 > obstacleX &&
            playerY < obstacleY + 50 &&
            playerY + 30 > obstacleY &&
            playerZ < obstacleZ + 25 &&
            playerZ + 15 > obstacleZ
        ) {
            endGame();
            break;
        }
    }

    // Check player collision with collectibles
    for (let i = 0; i < collectibles.length; i++) {
        const collectible = collectibles[i];
        const collectibleTransform = collectible.style.transform.match(/translate3d\((.+)px, (.+)px, (.+)px\)/);
        const collectibleX = parseFloat(collectibleTransform[1]);
        const collectibleY = parseFloat(collectibleTransform[2]);
        const collectibleZ = parseFloat(collectibleTransform[3]);

        if (
            playerX < collectibleX + 20 &&
            playerX + 30 > collectibleX &&
            playerY < collectibleY + 20 &&
            playerY + 30 > collectibleY &&
            playerZ < collectibleZ + 10 &&
            playerZ + 15 > collectibleZ
        ) {
            collectible.remove();
            collectibles.splice(i, 1);
            score++;
            scoreValue.textContent = score;
            break;
        }
    }

    // Check player collision with goal
    const goalTransform = goal.style.transform.match(/translate3d\((.+)px, (.+)px, (.+)px\)/);
    const goalX = parseFloat(goalTransform[1]);
    const goalY = parseFloat(goalTransform[2]);
    const goalZ = parseFloat(goalTransform[3]);

    if (
        playerX < goalX + 60 &&
        playerX + 30 > goalX &&
        playerY < goalY + 60 &&
        playerY + 30 > goalY &&
        playerZ < goalZ + 30 &&
        playerZ + 15 > goalZ
    ) {
        endGame(true);
    }
}

// End game
function endGame(win = false) {
    gameStarted = false;
    clearInterval(gameLoop);

    if (win) {
        finalScore.textContent = score;
        gameOver.style.display = 'flex';
    } else {
        finalScore.textContent = score;
        gameOver.style.display = 'flex';
    }
}

// Restart game
function restartGame() {
    gameOver.style.display = 'none';
    menu.style.display = 'flex';

    // Clear obstacles, collectibles, and goal
    obstacles.forEach(obstacle => obstacle.remove());
    collectibles.forEach(collectible => collectible.remove());
    goal.remove();
}

// Event listeners
document.addEventListener('keydown', event => {
return;
    switch (event.key) {
        case 'ArrowLeft':
            player.style.transform = `translate3d(${parseFloat(player.style.transform.match(/translate3d\((.+)px/)[1]) - playerSpeed}px, ${player.style.transform.match(/translate3d\(.+px, (.+)px/)[1]}, 15px)`;
            break;
        case 'ArrowRight':
            player.style.transform = `translate3d(${parseFloat(player.style.transform.match(/translate3d\((.+)px/)[1]) + playerSpeed}px, ${player.style.transform.match(/translate3d\(.+px, (.+)px/)[1]}, 15px)`;
            break;
        case 'ArrowUp':
            if (playerGrounded) {
                playerVelocityY = -playerJumpHeight;
                playerGrounded = false;
            }
            break;
    }
});
restartBtn.addEventListener('click', restartGame);
