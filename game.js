// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let animationFrameId;
const gravity = 0.5;
const friction = 0.98;
let obstacles = [];
let gameSpeed = 4;
const keys = {
    right: false,
    left: false,
    up: false
};

// Ball object
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = {
            x: 0,
            y: 1
        };
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.draw();
        this.velocity.y += gravity;
        this.velocity.x *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Collision detection with the floor
        if (this.y + this.radius + this.velocity.y >= canvas.height) {
            this.velocity.y = -this.velocity.y * friction;
        }
    }
}

// Obstacle class
class Obstacle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.draw();
        this.x -= gameSpeed;
    }
}

// Handle key events
window.addEventListener('keydown', function (e) {
    switch (e.key) {
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowUp':
            keys.up = true;
            break;
    }
});

window.addEventListener('keyup', function (e) {
    switch (e.key) {
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowUp':
            keys.up = false;
            break;
    }
});

// Game functions
function spawnObstacles() {
    const size = randomIntFromRange(20, 70);
    const type = Math.random() > 0.5 ? 'top' : 'bottom';
    const y = type === 'top' ? 0 : canvas.height - size;
    obstacles.push(new Obstacle(canvas.width + size, y, size, size, 'red'));
    if (obstacles.length > 20) {
        obstacles.shift();
    }
}

function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(obstacle => obstacle.update());

    // Ball controls
    if (keys.right && ball.velocity.x < 5) {
        ball.velocity.x++;
    } else if (keys.left && ball.velocity.x > -5) {
        ball.velocity.x--;
    }

    if (keys.up && ball.y > canvas.height * 0.1) {
        ball.velocity.y -= 10;
    }

    ball.update();
    animationFrameId = requestAnimationFrame(animate);

    // Spawn new obstacles
    if (animationFrameId % 60 === 0) {
        spawnObstacles();
    }
}

// Start the game
const ball = new Ball(50, canvas.height / 2, 30, 'blue');
animate();
