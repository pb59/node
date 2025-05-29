function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export { randomBetween, detectCollision, clamp };