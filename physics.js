function applyPhysics(ball, obstacles) {
    // Apply gravity
    const gravity = 0.5;
    ball.velocityY += gravity;

    // Apply friction
    const friction = 0.98;
    ball.velocityX *= friction;
    ball.velocityY *= friction;

    // Handle collision with walls
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.velocityX = -ball.velocityX * 0.8; // Reduce velocity on collision with walls
    }
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY * 0.8; // Reduce velocity on collision with walls
    }

    // Handle collision with obstacles
    for (const obstacle of obstacles) {
        if (isColliding(ball, obstacle)) {
            resolveCollision(ball, obstacle);
        }
    }

    // Update ball position based on velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
}

function isColliding(ball, obstacle) {
    const distX = Math.abs(ball.x - obstacle.x - obstacle.width / 2);
    const distY = Math.abs(ball.y - obstacle.y - obstacle.height / 2);

    if (distX > (obstacle.width / 2 + ball.radius)) {
        return false;
    }
    if (distY > (obstacle.height / 2 + ball.radius)) {
        return false;
    }

    if (distX <= (obstacle.width / 2)) {
        return true;
    }
    if (distY <= (obstacle.height / 2)) {
        return true;
    }

    const dx = distX - obstacle.width / 2;
    const dy = distY - obstacle.height / 2;
    return (dx * dx + dy * dy <= (ball.radius * ball.radius));
}

function resolveCollision(ball, obstacle) {
    const deltaX = ball.x - (obstacle.x + obstacle.width / 2);
    const deltaY = ball.y - (obstacle.y + obstacle.height / 2);
    const intersectX = Math.abs(deltaX) - (obstacle.width / 2 + ball.radius);
    const intersectY = Math.abs(deltaY) - (obstacle.height / 2 + ball.radius);

    if (intersectX < 0 && intersectY < 0) {
        if (Math.abs(intersectX) < Math.abs(intersectY)) {
            if (deltaX > 0) {
                ball.x += intersectX;
                ball.velocityX = -ball.velocityX * 0.8; // Reduce velocity on collision
            } else {
                ball.x -= intersectX;
                ball.velocityX = -ball.velocityX * 0.8; // Reduce velocity on collision
            }
        } else {
            if (deltaY > 0) {
                ball.y += intersectY;
                ball.velocityY = -ball.velocityY * 0.8; // Reduce velocity on collision
            } else {
                ball.y -= intersectY;
                ball.velocityY = -ball.velocityY * 0.8; // Reduce velocity on collision
            }
        }
    }
}
