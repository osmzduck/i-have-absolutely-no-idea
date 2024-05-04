// Game variables
let gameWorld;
let playerBall;
let obstacles = [];
let collectibles = [];
let goal;
let score = 0;
let level = 1;
let timer = 0;
let gameLoop;

// Screen elements
let startScreen;
let levelCompleteScreen;
let gameOverScreen;

// Game initialization
function initGame() {
  gameWorld = document.getElementById('game-world');
  playerBall = document.getElementById('player-ball');
  goal = document.getElementById('goal');
  startScreen = document.getElementById('start-screen');
  levelCompleteScreen = document.getElementById('level-complete-screen');
  gameOverScreen = document.getElementById('game-over-screen');

  // Event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('next-level-button').addEventListener('click', nextLevel);
  document.getElementById('restart-button').addEventListener('click', restartGame);

  // Initialize game elements
  initObstacles();
  initCollectibles();
  initPlayerBall();
}

// Initialize obstacles
function initObstacles() {
  const obstacleCount = 5 + level * 2;
  obstacles = [];

  for (let i = 0; i < obstacleCount; i++) {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.style.width = `${getRandomNumber(50, 100)}px`;
    obstacle.style.height = `${getRandomNumber(50, 100)}px`;
    obstacle.style.top = `${getRandomNumber(0, gameWorld.clientHeight - 100)}px`;
    obstacle.style.left = `${getRandomNumber(0, gameWorld.clientWidth - 100)}px`;
    gameWorld.appendChild(obstacle);
    obstacles.push(obstacle);
  }
}

// Initialize collectibles
function initCollectibles() {
  const collectibleCount = 3 + level;
  collectibles = [];

  for (let i = 0; i < collectibleCount; i++) {
    const collectible = document.createElement('div');
    collectible.classList.add('collectible');
    collectible.style.top = `${getRandomNumber(0, gameWorld.clientHeight - 20)}px`;
    collectible.style.left = `${getRandomNumber(0, gameWorld.clientWidth - 20)}px`;
    gameWorld.appendChild(collectible);
    collectibles.push(collectible);
  }
}

// Initialize player ball
function initPlayerBall() {
  playerBall.style.top = '50%';
  playerBall.style.left = '50px';
}

// Start the game
function startGame() {
  startScreen.classList.remove('active');
  startGameLoop();
}

// Start the game loop
function startGameLoop() {
  gameLoop = setInterval(updateGame, 16);
}

// Update the game state
function updateGame() {
  movePlayerBall();
  checkCollisions();
  updateTimer();
}

// Move the player ball
function movePlayerBall() {
  const playerBallRect = playerBall.getBoundingClientRect();

  if (keys.ArrowUp && playerBallRect.top > 0) {
    playerBall.style.top = `${playerBallRect.top - 5}px`;
  }
  if (keys.ArrowDown && playerBallRect.bottom < gameWorld.clientHeight) {
    playerBall.style.top = `${playerBallRect.top + 5}px`;
  }
  if (keys.ArrowLeft && playerBallRect.left > 0) {
    playerBall.style.left = `${playerBallRect.left - 5}px`;
  }
  if (keys.ArrowRight && playerBallRect.right < gameWorld.clientWidth) {
    playerBall.style.left = `${playerBallRect.left + 5}px`;
  }
}

// Check collisions
function checkCollisions() {
  const playerBallRect = playerBall.getBoundingClientRect();

  // Check collision with obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obstacleRect = obstacles[i].getBoundingClientRect();
    if (
      playerBallRect.left < obstacleRect.right &&
      playerBallRect.right > obstacleRect.left &&
      playerBallRect.top < obstacleRect.bottom &&
      playerBallRect.bottom > obstacleRect.top
    ) {
      gameOver();
      return;
    }
  }

  // Check collision with collectibles
  for (let i = 0; i < collectibles.length; i++) {
    const collectibleRect = collectibles[i].getBoundingClientRect();
    if (
      playerBallRect.left < collectibleRect.right &&
      playerBallRect.right > collectibleRect.left &&
      playerBallRect.top < collectibleRect.bottom &&
      playerBallRect.bottom > collectibleRect.top
    ) {
      collectibles[i].remove();
      collectibles.splice(i, 1);
      score += 10;
      updateScore();
    }
  }

  // Check collision with goal
  const goalRect = goal.getBoundingClientRect();
  if (
    playerBallRect.left < goalRect.right &&
    playerBallRect.right > goalRect.left &&
    playerBallRect.top < goalRect.bottom &&
    playerBallRect.bottom > goalRect.top
  ) {
    levelComplete();
  }
}

// Update the timer
function updateTimer() {
  timer++;
  const minutes = Math.floor(timer / 3600);
  const seconds = Math.floor((timer % 3600) / 60);
  const milliseconds = timer % 60;
  document.getElementById('timer-value').textContent = `${minutes}:${padZero(seconds)}:${padZero(milliseconds)}`;
}

// Update the score
function updateScore() {
  document.getElementById('score-value').textContent = score;
}

// Level complete
function levelComplete() {
  clearInterval(gameLoop);
  levelCompleteScreen.classList.add('active');
  document.getElementById('level-time').textContent = formatTime(timer);
  level++;
  document.getElementById('level-value').textContent = level;
}

// Next level
function nextLevel() {
  levelCompleteScreen.classList.remove('active');
  resetGame();
  startGame();
}

// Game over
function gameOver() {
  clearInterval(gameLoop);
  gameOverScreen.classList.add('active');
  document.getElementById('final-score').textContent = score;
}

// Restart the game
function restartGame() {
  gameOverScreen.classList.remove('active');
  resetGame();
  startScreen.classList.add('active');
}

// Reset the game state
function resetGame() {
  score = 0;
  timer = 0;
  updateScore();
  updateTimer();
  gameWorld.innerHTML = '';
  gameWorld.appendChild(playerBall);
  gameWorld.appendChild(goal);
  initObstacles();
  initCollectibles();
  initPlayerBall();
}

// Keyboard event handlers
let keys = {};

function handleKeyDown(event) {
  keys[event.code] = true;
}

function handleKeyUp(event) {
  keys[event.code] = false;
}

// Utility functions
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padZero(number) {
  return number.toString().padStart(2, '0');
}

function formatTime(time) {
  const minutes = Math.floor(time / 3600);
  const seconds = Math.floor((time % 3600) / 60);
  const milliseconds = time % 60;
  return `${minutes}:${padZero(seconds)}:${padZero(milliseconds)}`;
}

// Initialize the game
initGame();
