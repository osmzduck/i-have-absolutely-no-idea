// Get the game container element
const gameContainer = document.getElementById("game-container");

// Create the game world
const world = {
    width: 800,
    height: 600,
    tiles: [],
    ball: {}
};

// Create the ball
world.ball = {
    x: world.width / 2,
    y: world.height / 2,
    radius: 15,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    mass: 1
};

// Create the map
const map = document.createElementNS("http://www.w3.org/2000/svg", "svg");
map.setAttribute("viewBox", `0 0 ${world.width} ${world.height}`);
map.setAttribute("preserveAspectRatio", "xMinYMin meet");
gameContainer.appendChild(map);

// Add map tiles
for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        const tile = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tile.setAttribute("x", i * 80);
        tile.setAttribute("y", j * 80);
        tile.setAttribute("width", 80);
        tile.setAttribute("height", 80);
        tile.setAttribute("fill", `hsl(${i * 30}, 80%, 50%)`);
        map.appendChild(tile);
    }
}

// Add event listener for ball movement
document.addEventListener("mousemove", (event) => {
    const targetX = event.clientX + window.scrollX;
    const targetY = event.clientY + window.scrollY;
    world.ball.x = targetX;
    world.ball.y = targetY;
});

// Update and render the game world
function update() {
    // Update ball position
    world.ball.x += world.ball.velocityX;
    world.ball.y += world.ball.velocityY;

    // Boundary checking
    if (world.ball.x + world.ball.radius > world.width) {
        world.ball.x = world.width - world.ball.radius;
        world.ball.velocityX = -world.ball.velocityX;
    } else if (world.ball.x - world.ball.radius < 0) {
        world.ball.x = world.ball.radius;
        world.ball.velocityX = -world.ball.velocityX;
    }
    if (world.ball.y + world.ball.radius > world.height) {
        world.ball.y = world.height - world.ball.radius;
        world.ball.velocityY = -world.ball.velocityY;
    } else if (world.ball.y - world.ball.radius < 0) {
        world.ball.y = world.ball.radius;
        world.ball.velocityY = -world.ball.velocityY;
    }

    // Update ball velocity
    world.ball.velocityX += world.ball.accelerationX;
    world.ball.velocityY += world.ball.accelerationY;

    // Render the game world
    map.setAttribute("transform", `translate(${world.ball.x - world.width / 2}, ${world.ball.y - world.height / 2})`);
}

// Main game loop
setInterval(update, 1000 / 60);

// Handle ball collision with map tiles
function checkCollision() {
    for (let i = 0; i < world.tiles.length; i++) {
        const tile = world.tiles[i];
        const distance = Math.sqrt(Math.pow(world.ball.x - tile.x, 2) + Math.pow(world.ball.y - tile.y, 2));
        if (distance < world.ball.radius + tile.radius) {
            world.ball.velocityX = -world.ball.velocityX;
            world.ball.velocityY = -world.ball.velocityY;
        }
    }
}

// Check for collisions every frame
setInterval(checkCollision, 1000 / 60);
