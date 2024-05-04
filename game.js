// Get the canvas element
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    dx: 0,
    dy: 0
};

// Handle keyboard events
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

function keyDownHandler(e) {
    if (e.key === 'ArrowRight') {
        ball.dx = ball.speed;
    } else if (e.key === 'ArrowLeft') {
        ball.dx = -ball.speed;
    } else if (e.key === 'ArrowUp') {
        ball.dy = -ball.speed;
    } else if (e.key === 'ArrowDown') {
        ball.dy = ball.speed;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        ball.dx = 0;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        ball.dy = 0;
    }
}

// Update game objects
function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision detection with canvas boundaries
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
