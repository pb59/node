import { ScoreTimer } from './scoreTimer.js';

const config = {
    type: Phaser.AUTO,
    width: 700,
    height: 600,
    backgroundColor: "#87ceeb", // Sky blue fallback
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload,
        create,
        update
    }
};

let player;
let cursors;
let aiCars = [];
let scoreTimer;

let gamePaused = true;
let userInfo = null;
let mathCorrect = false;

function preload() {
    // --- Updated car sprites ---
    this.load.image('playerCar', 'src/png/cars/redcar.png'); // Updated to redcar
    //this.load.image('playerCar', 'src/png/cars/bus.png');   
    this.load.image('aiCar1', 'src/png/cars/sports_green.png');
    this.load.image('aiCar2', 'src/png/cars/sports_yellow.png');
    this.load.image('aiCar3', 'src/png/cars/sedan_blue.png');
    this.load.audio('bgMusic', 'src/png/audio/background.mp3');
}

function create() {
    // --- Sky Gradient (draw first) ---
    for (let i = 0; i < 10; i++) {
        this.add.rectangle(
            350, 30 + i * 60, 700, 60,
            Phaser.Display.Color.GetColor(135 - i * 5, 206 - i * 10, 235 - i * 15)
        ).setDepth(-20);
    }

    // --- Mountains (draw after sky, before grass/road) ---
    const mountain = this.add.graphics();
    mountain.fillStyle(0xc2b280, 1); // lighter brown
    mountain.beginPath();
    mountain.moveTo(0, 350);
    mountain.lineTo(80, 220);
    mountain.lineTo(180, 320);
    mountain.lineTo(260, 200);
    mountain.lineTo(350, 320);
    mountain.lineTo(440, 180);
    mountain.lineTo(540, 320);
    mountain.lineTo(620, 220);
    mountain.lineTo(700, 350);
    mountain.lineTo(700, 600);
    mountain.lineTo(0, 600);
    mountain.closePath();
    mountain.fillPath();
    mountain.setDepth(-19);

    // --- Sun (draw after mountains) ---
    this.sunGraphics = this.add.graphics();
    this.sunGraphics.fillStyle(0xFFD700, 1);
    this.sunGraphics.fillCircle(600, 80, 40);

    // --- Clouds (array of cloud objects) ---
    this.clouds = [
        { x: 100, y: 60, speed: 0.5 },
        { x: 300, y: 100, speed: 0.3 },
        { x: 500, y: 50, speed: 0.4 }
    ];
    this.cloudGraphics = this.add.graphics();

    // --- Grass (draw only below the mountains) ---
    this.add.rectangle(100, 475, 200, 250, 0x228B22).setDepth(-18);
    this.add.rectangle(600, 475, 200, 250, 0x228B22).setDepth(-18);

    // --- Road with subtle gradient ---
    const road = this.add.graphics();
    for (let i = 0; i < 10; i++) {
        road.fillStyle(Phaser.Display.Color.GetColor(68 + i * 10, 68 + i * 10, 68 + i * 10), 1);
        road.fillRect(200 + i * 15, 0, 15, 600);
        road.fillRect(500 - i * 15, 0, 15, 600);
    }
    road.fillStyle(0x444444, 1);
    road.fillRect(200, 0, 300, 600);
    road.setDepth(-17);

    // --- Road barriers ---
    this.add.rectangle(200, 300, 10, 600, 0x888888).setDepth(-16);
    this.add.rectangle(490, 300, 10, 600, 0x888888).setDepth(-16);

    // --- Lane markings and tree array for animation ---
    this.laneOffset = 0;
    this.laneGraphics = this.add.graphics();
    this.trees = [
        { x: 150, y: 100 },
        { x: 550, y: 200 },
        { x: 180, y: 400 },
        { x: 520, y: 50 },
        { x: 300, y: 250 }
    ];

    // --- Player and AI cars ---
    player = this.physics.add.sprite(350, 500, 'playerCar').setScale(0.03);
    // Make the player's physics body even smaller for tighter collision
    player.body.setSize(player.width * 0.6, player.height * 0.6);
    player.body.setOffset(player.width * 0.2, player.height * 0.2);

    aiCars = [
        this.physics.add.sprite(250, -100, 'aiCar1').setScale(0.7),
        this.physics.add.sprite(450, -300, 'aiCar2').setScale(0.7),
        this.physics.add.sprite(350, -500, 'aiCar3').setScale(0.7)
    ];

    // Make AI cars' physics bodies even smaller for tighter collision
    aiCars.forEach(aiCar => {
        aiCar.body.setSize(aiCar.width * 0.6, aiCar.height * 0.6);
        aiCar.body.setOffset(aiCar.width * 0.2, aiCar.height * 0.2);
    });

    cursors = this.input.keyboard.createCursorKeys();

    scoreTimer = new ScoreTimer(this);

    // Update collision to stop timer/score
    aiCars.forEach(aiCar => {
        this.physics.add.overlap(player, aiCar, () => {
            this.add.text(200, 300, 'Collision!', { fontSize: '48px', fill: '#ff0' });
            this.scene.pause();
            scoreTimer.stop();
        });
    });

    // --- Background Music ---
    this.sound.add('bgMusic').setLoop(true).play();

    // --- UI Buttons ---
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const stopBtn = document.getElementById('stopBtn');

    // Start with game paused and only start button visible
    this.scene.pause();
    startBtn.style.display = '';
    restartBtn.style.display = 'none';
    stopBtn.style.display = 'none';

    startBtn.onclick = () => {
        if (!mathCorrect) return; // Prevent starting if math not passed
        gamePaused = false;
        this.scene.resume();
        if (scoreTimer) scoreTimer.active = true; // <-- Add this
        startBtn.style.display = 'none';
        restartBtn.style.display = '';
        stopBtn.style.display = '';
    };

    restartBtn.onclick = () => {
        this.scene.restart();
        gamePaused = false;
        // scoreTimer will be re-initialized in create()
        startBtn.style.display = 'none';
        restartBtn.style.display = '';
        stopBtn.style.display = '';
    };

    stopBtn.onclick = () => {
        gamePaused = true;
        this.scene.pause();
        if (scoreTimer) scoreTimer.stop();
        startBtn.style.display = '';
        restartBtn.style.display = '';
        stopBtn.style.display = 'none';
    };
}

// Example function to call Groq LLM from your frontend
function askGroq(promptText) {
    fetch('http://localhost:3000/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: promptText }]
        })
    })
    .then(res => res.json())
    .then(data => {
        // Do something with the response, e.g. show in game
        console.log(data.choices[0].message.content);
        // You can display it in your game UI as needed
    });
}

// Example usage (call this from a button or event)
askGroq("Give me a racing tip!");

function checkMathWithLLM(question, userAnswer) {
    fetch('http://localhost:3000/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
                { role: 'user', content: `Is the answer to "${question}" equal to ${userAnswer}? Reply only "yes" or "no".` }
            ]
        })
    })
    .then(res => res.json())
    .then(data => {
        const reply = data.choices[0].message.content.trim().toLowerCase();
        if (reply.startsWith('yes')) {
            // Allow game to start
        } else {
            // Show error, let user try again
        }
    });
}

function update() {
    if (gamePaused) return;

    // --- Animate and draw clouds ---
    this.cloudGraphics.clear();
    this.cloudGraphics.fillStyle(0xffffff, 1);
    this.clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > 750) cloud.x = -50;
        // Draw cloud as three circles
        this.cloudGraphics.fillCircle(cloud.x, cloud.y, 22);
        this.cloudGraphics.fillCircle(cloud.x + 20, cloud.y + 8, 18);
        this.cloudGraphics.fillCircle(cloud.x - 20, cloud.y + 8, 16);
    });

    // --- Animate lane markings ---
    this.laneOffset = (this.laneOffset + 5) % 80;
    this.laneGraphics.clear();
    this.laneGraphics.lineStyle(6, 0xffffff, 1);
    for (let y = -40 + this.laneOffset; y < 600; y += 80) {
        this.laneGraphics.strokeLineShape(new Phaser.Geom.Line(350, y, 350, y + 40));
    }

    // --- Animate and draw trees ---
    this.trees.forEach(tree => {
        tree.y += 2;
        if (tree.y > 600) tree.y = -60;
        // Trunk
        this.laneGraphics.fillStyle(0x8B5A2B, 1);
        this.laneGraphics.fillRect(tree.x + 7, tree.y + 30, 6, 20);
        // Leaves
        this.laneGraphics.fillStyle(0x228B22, 1);
        this.laneGraphics.fillCircle(tree.x + 10, tree.y + 30, 18);
    });

    // --- Car movement and AI ---
    player.setVelocity(0);
    if (cursors.left.isDown && player.x > 220) player.x -= 5;
    if (cursors.right.isDown && player.x < 480) player.x += 5;
    if (cursors.up.isDown && player.y > 0) player.y -= 5;
    if (cursors.down.isDown && player.y < 600 - player.height * 0.7) player.y += 5;

    // Update timer
    if (scoreTimer) scoreTimer.updateTimer(this.game.loop.delta);

    // Example: When an AI car is avoided, add score
    aiCars.forEach(aiCar => {
        aiCar.y += 5;
        if (aiCar.y > 650) {
            aiCar.y = -100;
            aiCar.x = Phaser.Math.Between(250, 450);
            if (scoreTimer) scoreTimer.addScore(10);
        }
    });
}

const game = new Phaser.Game(config);

window.addEventListener('DOMContentLoaded', () => {
    const userOverlay = document.getElementById('userFormOverlay');
    const userForm = document.getElementById('userForm');
    const mathOverlay = document.getElementById('mathChallengeOverlay');
    const mathForm = document.getElementById('mathForm');
    const mathQuestion = document.getElementById('mathQuestion');
    const mathAnswer = document.getElementById('mathAnswer');
    const mathError = document.getElementById('mathError');
    const startBtn = document.getElementById('startBtn');

    let currentQuestion = "";

    userForm.onsubmit = function(e) {
        e.preventDefault();
        userInfo = {
            name: document.getElementById('userName').value,
            age: parseInt(document.getElementById('userAge').value, 10)
        };
        userOverlay.style.display = 'none';

        // Ask LLM to generate a math question
        fetch('http://localhost:3000/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'user', content: `Generate a very easy math question for a child of age ${userInfo.age}. Only give the question, not the answer.` }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                currentQuestion = data.choices[0].message.content.trim();
                mathQuestion.textContent = currentQuestion;
                mathAnswer.value = '';
                mathError.style.display = 'none';
                mathOverlay.style.display = 'flex';
            } else if (data.error) {
                let errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                mathQuestion.textContent = "Error: " + errorMsg;
                mathOverlay.style.display = 'flex';
                console.error("Groq API error:", errorMsg);
            } else {
                mathQuestion.textContent = "Sorry, could not load a question.";
                mathOverlay.style.display = 'flex';
                console.error("Unexpected Groq API response:", data);
            }
        })
        .catch(err => {
            mathQuestion.textContent = "Sorry, could not load a question.";
            mathOverlay.style.display = 'flex';
            console.error("LLM error:", err);
        });
    };

    mathForm.onsubmit = function(e) {
        e.preventDefault();
        // Ask LLM to check the answer
        fetch('http://localhost:3000/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'user', content: `Is the answer to "${currentQuestion}" equal to ${mathAnswer.value}? Reply only "yes" or "no".` }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            const reply = data.choices[0].message.content.trim().toLowerCase();
            if (reply.startsWith('yes')) {
                mathOverlay.style.display = 'none';
                mathCorrect = true;
                startBtn.disabled = false;
            } else {
                mathError.style.display = 'block';
            }
        })
        .catch(err => {
            mathError.textContent = "Could not check answer.";
            mathError.style.display = 'block';
            console.error("LLM error:", err);
        });
    };

    // Disable start button until math is passed
    startBtn.disabled = true;
});