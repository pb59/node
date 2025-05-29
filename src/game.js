// This file contains the main game logic, including the game loop, event handling, and rendering of the game elements such as the car and track.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Add at the top:
const skyColor = "#87ceeb";
const mountainColor = "#b0a160";
const treeColor = "#228B22";
let trees = [
    { x: 180, y: 100 }, { x: 520, y: 300 }, { x: 150, y: 400 }, { x: 550, y: 50 }
];

// Draw road background
ctx.fillStyle = '#444';
ctx.fillRect(200, 0, 300, 600); // Road in the center (wider)

// Draw lane markings
ctx.strokeStyle = '#fff';
ctx.lineWidth = 4;
ctx.setLineDash([20, 20]); // Dashed line

ctx.beginPath();
ctx.moveTo(350, 0); // Center lane marking (middle of 200 + 300)
ctx.lineTo(350, 600);
ctx.stroke();

ctx.setLineDash([]); // Reset dash

// Lane marking animation variables
let laneOffset = 0;
const laneMarkingHeight = 40;
const laneMarkingGap = 40;

class Car {
    constructor(x, y, imagePath, width = 60, height = 100) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imagePath;
        this.speed = 5;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    move(keys) {
        if (keys) {
            if (keys['ArrowLeft'] && this.x > 200) {
                this.x -= this.speed;
            }
            if (keys['ArrowRight'] && this.x < 200 + 300 - this.width) {
                this.x += this.speed;
            }
            if (keys['ArrowUp'] && this.y > 0) {
                this.y -= this.speed;
            }
            if (keys['ArrowDown'] && this.y < canvas.height - this.height) {
                this.y += this.speed;
            }
        }
    }
}

let playerCar;
let aiCars = [];
let keys = {};
let gameInterval;

function init() {
    playerCar = new Car(canvas.width / 2 - 20, canvas.height - 90, 'png/cars/sports_red.png', 40, 70);
    aiCars = [
        new Car(250, -105, 'png/cars/sports_green.png', 40, 70),
        new Car(400, -245, 'png/cars/sports_yellow.png', 40, 70),
        new Car(300, -385, 'png/cars/sedan_blue.png', 40, 70)
    ];

    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    gameInterval = setInterval(gameLoop, 1000 / 60);
}

function isColliding(carA, carB) {
    return (
        carA.x < carB.x + carB.width &&
        carA.x + carA.width > carB.x &&
        carA.y < carB.y + carB.height &&
        carA.y + carA.height > carB.y
    );
}

function getRandomLaneX() {
    // Three lanes: left, center, right
    const laneWidth = 80;
    const left = 220;
    const center = 310;
    const right = 400;
    const lanes = [left, center, right];
    return lanes[Math.floor(Math.random() * lanes.length)];
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw mountains (simple polygons)
    ctx.fillStyle = mountainColor;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(100, 200);
    ctx.lineTo(200, 300);
    ctx.lineTo(300, 180);
    ctx.lineTo(400, 300);
    ctx.lineTo(500, 220);
    ctx.lineTo(600, 300);
    ctx.lineTo(700, 250);
    ctx.lineTo(700, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    // Draw grass
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, 0, 200, canvas.height);
    ctx.fillRect(500, 0, 200, canvas.height);

    // Draw barriers
    ctx.fillStyle = "#888";
    ctx.fillRect(200, 0, 10, canvas.height);
    ctx.fillRect(490, 0, 10, canvas.height);

    // Animate lane markings
    laneOffset += 5;
    if (laneOffset > laneMarkingHeight + laneMarkingGap) {
        laneOffset = 0;
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    // Draw dashed center lane markings
    for (let y = -laneMarkingHeight + laneOffset; y < 600; y += laneMarkingHeight + laneMarkingGap) {
        ctx.beginPath();
        ctx.moveTo(350, y);
        ctx.lineTo(350, y + laneMarkingHeight);
        ctx.stroke();
    }

    // Move and draw player car
    playerCar.move(keys);
    playerCar.draw(ctx);

    // Move and draw AI cars
    aiCars.forEach(car => {
        car.y += 5; // AI car speed
        if (car.y > canvas.height) {
            car.y = -car.height;
            car.x = getRandomLaneX();
        }
        car.draw(ctx);
    });

    // Animate and draw trees
    trees.forEach(tree => {
        tree.y += 2; // Move trees down
        if (tree.y > canvas.height) tree.y = -50; // Loop to top
        ctx.fillStyle = treeColor;
        ctx.fillRect(tree.x, tree.y, 20, 40);
        ctx.beginPath();
        ctx.arc(tree.x + 10, tree.y, 15, 0, Math.PI * 2);
        ctx.fill();
    });

    // Collision detection
    for (let aiCar of aiCars) {
        if (isColliding(playerCar, aiCar)) {
            clearInterval(gameInterval);
            ctx.font = "48px Arial";
            ctx.fillStyle = "yellow";
            ctx.fillText("Collision!", 260, 300);
            return;
        }
    }
}

window.onload = init;