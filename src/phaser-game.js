import { ScoreTimer } from './scoreTimer.js';
import { startIQQuizLLM } from './iqQuiz.js';
import { startEQQuizLLM } from './eqQuiz.js';
import { startSkillQuizLLM } from './skillQuiz.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#87ceeb",
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload,
        create,
        update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

let player;
let cursors;
let aiCars = [];
let scoreTimer;
let bgMusic; // Add this at the top with other globals

let gamePaused = true;
let userInfo = null;
let mathCorrect = false;
let level = 1;
let levelText;
let aiCarBaseSpeed = 5;
const LEVEL_UP_SCORE = 100;
let nextLevelScore = LEVEL_UP_SCORE;

function preload() {
    this.load.image('playerCar', 'src/png/cars/redcar.png');
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
    mountain.fillStyle(0xc2b280, 1);
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
    this.add.rectangle(500, 300, 10, 600, 0x888888).setDepth(-16);

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
    player.body.setSize(player.width * 0.6, player.height * 0.6);
    player.body.setOffset(player.width * 0.2, player.height * 0.2);

    aiCars = [
        this.physics.add.sprite(250, -100, 'aiCar1').setScale(0.7),
        this.physics.add.sprite(450, -300, 'aiCar2').setScale(0.7),
        this.physics.add.sprite(350, -500, 'aiCar3').setScale(0.7)
    ];

    aiCars.forEach(aiCar => {
        aiCar.body.setSize(aiCar.width * 0.6, aiCar.height * 0.6);
        aiCar.body.setOffset(aiCar.width * 0.2, aiCar.height * 0.2);
    });

    cursors = this.input.keyboard.createCursorKeys();

    scoreTimer = new ScoreTimer(this);

    // Level display
    //levelText = this.add.text(350, 20, 'Level: 1', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5, 0).setDepth(10);
    levelText = this.add.text(350, 20, `Level: ${level}`, { fontSize: '28px', fill: '#fff' }).setOrigin(0.5, 0).setDepth(10);

    
    aiCars.forEach(aiCar => {
        this.physics.add.overlap(player, aiCar, () => {
            // On collision, reduce a life and reset player position
            if (typeof player.lives === 'undefined') player.lives = 3;
            player.lives -= 1;

            // Show remaining lives
            this.add.text(200, 300, `Collision! Lives left: ${player.lives}`, { fontSize: '36px', fill: '#ff0' }).setDepth(30);

            if (player.lives > 0) {
                // Reset player position and pause briefly
                player.x = 350;
                player.y = 500;
                this.scene.pause();
                scoreTimer.stop();
                setTimeout(() => {
                    this.scene.resume();
                    scoreTimer.active = true;
                }, 1200);
            } else {
                // Game over if no lives left
                this.add.text(200, 350, 'Game Over!', { fontSize: '48px', fill: '#f00' }).setDepth(31);
                this.scene.pause();
                scoreTimer.stop();
            }
        });
    });

    // Fix: Stop and destroy previous bgMusic if it exists
    if (bgMusic) {
        bgMusic.stop();
        bgMusic.destroy();
    }
    bgMusic = this.sound.add('bgMusic', { loop: true });
    bgMusic.play();

    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const stopBtn = document.getElementById('stopBtn');
    const iqNextBtn = document.getElementById('iqNextBtn');

    this.scene.pause();
    startBtn.style.display = '';
    restartBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    iqNextBtn.style.display = 'none';

    startBtn.onclick = () => {
        if (!mathCorrect) return;
        gamePaused = false;
        this.scene.resume();
        if (scoreTimer) scoreTimer.active = true;
        startBtn.style.display = 'none';
        restartBtn.style.display = '';
        stopBtn.style.display = '';
        if (bgMusic) {
            bgMusic.play();
        }
    };

    restartBtn.onclick = () => {
        if (bgMusic) {
            bgMusic.stop();
            bgMusic.destroy();
        }
        this.scene.restart();
        gamePaused = false;
        startBtn.style.display = 'none';
        restartBtn.style.display = '';
        stopBtn.style.display = '';
        // REMOVE the setTimeout that re-creates bgMusic here!
    };

    stopBtn.onclick = () => {
        gamePaused = true;
        this.scene.pause();
        if (scoreTimer) scoreTimer.stop();
        startBtn.style.display = '';
        restartBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        if (bgMusic) {
            bgMusic.stop();
        }
    };

    // Touch controls for mobile
    this.input.addPointer(2); // Allow multi-touch

    this.input.on('pointerdown', pointer => {
        if (pointer.x < this.cameras.main.width / 2) {
            player.moveLeft = true;
        } else {
            player.moveRight = true;
        }
    });

    this.input.on('pointerup', pointer => {
        player.moveLeft = false;
        player.moveRight = false;
    });

    this.input.on('pointermove', pointer => {
        if (pointer.isDown) {
            if (pointer.x < this.cameras.main.width / 2) {
                player.moveLeft = true;
                player.moveRight = false;
            } else {
                player.moveRight = true;
                player.moveLeft = false;
            }
        }
    });
}

function askGroq(promptText) {
    fetch('/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: promptText }]
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.choices[0].message.content);
    });
}

function checkMathWithLLM(question, userAnswer) {
    fetch('/groq', {
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

function levelUp(scene) {
    level++;
    aiCarBaseSpeed += 2;
    if (levelText) levelText.setText('Level: ' + level);

    const msg = scene.add.text(350, 300, 'Level Up!', { fontSize: '48px', fill: '#0f0' })
        .setOrigin(0.5)
        .setDepth(20)
        .setAlpha(1);

    scene.time.delayedCall(1500, function() {
        msg.destroy();

        if (level === 2) {
            // Only IQ quiz at level 2
            gamePaused = true;
            scene.scene.pause();
            if (scoreTimer) scoreTimer.stop();
            setTimeout(() => {
                alert("🎉 Congratulations! As the Wagmice Manager, you completed Level 1!\n\nGet ready for the next challenge!");
                startIQQuizLLM({
                    userInfo,
                    scene,
                    onComplete: (score, total) => {
                        alert(`IQ Quiz complete! You scored ${score}/${total}. Ready for the next challenge!`);
                        gamePaused = false;
                        scene.scene.restart(); // Restart from current level
                        if (scoreTimer) scoreTimer.active = true;
                    }
                });
            }, 300);
        }

        // EQ quiz at level 3 (i.e., after completing level 2)
        if (level === 3) {
            gamePaused = true;
            scene.scene.pause();
            if (scoreTimer) scoreTimer.stop();
            setTimeout(() => {
                alert("🎉 Amazing! You completed Level 2!\n\nNow, let's see how emotionally smart you are with a quick EQ test.");
                startEQQuizLLM({
                    userInfo,
                    scene,
                    onComplete: (eqScore, eqTotal) => {
                        alert(`EQ Quiz complete! You scored ${eqScore}/${eqTotal}. You're ready to race again!`);
                        gamePaused = false;
                        scene.scene.restart(); // Restart from current level
                        if (scoreTimer) scoreTimer.active = true;
                    }
                });
            }, 300);
        }

        // Skill set LLM quiz at level 4
        if (level === 4) {
            gamePaused = true;
            scene.scene.pause();
            if (scoreTimer) scoreTimer.stop();
            setTimeout(() => {
                alert(`🚀 Incredible! You completed Level 3!

Now, let's test your skills in "${userInfo.skill}" with 5 LLM-generated questions!

Remember, $WGM isn't just a meme — it's a movement. Play, earn, and join the WAGMICE family. 🚗💨

Want to buy? Check out Pump.fun, Raydium, or Jupiter. Need help? Hop into our Telegram: https://t.me/WagmicePortal

Follow us on X: @Wagmice (https://x.com/Wagmice)
Official Website: https://pb59.github.io/WagmiceToken/

Now, let’s race!`);
                startSkillQuizLLM({
                    userInfo,
                    scene,
                    onComplete: (skillScore, skillTotal) => {
                        alert(`Skill Quiz complete! You scored ${skillScore}/${skillTotal}. You're a true Wagmice pro!`);

                        // Show Wagmice Champ Certificate and end the game
                        setTimeout(() => {
                            // Stop game loop and hide controls
                            if (bgMusic) {
                                bgMusic.stop();
                            }
                            document.getElementById('controls').style.display = 'none';

                            document.body.innerHTML = `
                                <div id="wagmice-certificate" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#222;color:#fff;">
                                    <h1 style="font-size:2.5em;margin-bottom:0.5em;">🏆 Wagmice Champ Certificate 🏆</h1>
                                    <p style="font-size:1.3em;">Congratulations, <b>${userInfo.name}</b>!</p>
                                    <p style="font-size:1.1em;">You completed all challenges and proved your skills in <b>${userInfo.skill}</b>!</p>
                                    <p style="margin:1.5em 0;">You are now a certified <b>Wagmice Champion</b>.<br>Share your achievement with the world!</p>
                                    <button id="downloadCertBtn" style="margin:1em 0;padding:0.5em 1.5em;font-size:1em;">Download Certificate</button>
                                    <div style="margin:1em 0;">
                                        <a id="shareOnXBtn"
                                            href="https://twitter.com/intent/tweet?text=I%20am%20a%20Wagmice%20Champion!%20🐭🚗💨%20@Wagmice%20https://pb59.github.io/WagmiceToken/"
                                            target="_blank"
                                            style="margin-right:1em;color:#1da1f2;">Share on X</a>
                                        <a id="shareOnFbBtn"
                                            href="https://www.facebook.com/sharer/sharer.php?u=https://pb59.github.io/WagmiceToken/"
                                            target="_blank"
                                            style="margin-right:1em;color:#4267B2;">Share on Facebook</a>
                                        <a id="shareOnLinkedInBtn"
                                            href="https://www.linkedin.com/sharing/share-offsite/?url=https://pb59.github.io/WagmiceToken/"
                                            target="_blank"
                                            style="color:#0077b5;">Share on LinkedIn</a>
                                    </div>
                                    <a href="https://pb59.github.io/WagmiceToken/" target="_blank" style="color:#ffd700;font-size:1.1em;margin-top:1em;">Visit Official Website</a>
                                    <p style="margin-top:2em;font-size:1.2em;">🐭🚗💨</p>
                                </div>
                            `;
                        }, 500);
                    }
                });
            }, 300);
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
        this.cloudGraphics.fillCircle(cloud.x, cloud.y, 22);
        this.cloudGraphics.fillCircle(cloud.x + 20, cloud.y + 8, 18);
        this.cloudGraphics.fillCircle(cloud.x - 20, cloud.y + 8, 16);
    });

    this.laneOffset = (this.laneOffset + 5) % 80;
    this.laneGraphics.clear();
    this.laneGraphics.lineStyle(6, 0xffffff, 1);
    for (let y = -40 + this.laneOffset; y < 600; y += 80) {
        this.laneGraphics.strokeLineShape(new Phaser.Geom.Line(350, y, 350, y + 40));
    }

    this.trees.forEach(tree => {
        tree.y += 2;
        if (tree.y > 600) tree.y = -60;
        this.laneGraphics.fillStyle(0x8B5A2B, 1);
        this.laneGraphics.fillRect(tree.x + 7, tree.y + 30, 6, 20);
        this.laneGraphics.fillStyle(0x228B22, 1);
        this.laneGraphics.fillCircle(tree.x + 10, tree.y + 30, 18);
    });

    player.setVelocity(0);
    if ((cursors.left.isDown || player.moveLeft) && player.x > 220) player.x -= 5;
    if ((cursors.right.isDown || player.moveRight) && player.x < 480) player.x += 5;
    if (cursors.up.isDown && player.y > 0) player.y -= 5;
    if (cursors.down.isDown && player.y < 600 - player.height * 0.7) player.y += 5;

    if (scoreTimer) scoreTimer.updateTimer(this.game.loop.delta);

    if (scoreTimer && scoreTimer.score >= nextLevelScore) {
        levelUp(this);
        nextLevelScore += LEVEL_UP_SCORE;
    }

    aiCars.forEach(aiCar => {
        aiCar.y += aiCarBaseSpeed;
        if (aiCar.y > 650) {
            aiCar.y = -100;
            aiCar.x = Phaser.Math.Between(250, 450);
            if (scoreTimer) scoreTimer.addScore(10);
        }
    });
}

const game = new Phaser.Game(config);

window.addEventListener('DOMContentLoaded', () => {
    alert("Welcome to the WAGMICE 2D Car Racing Game!\n\nBefore you start, please enter your name and age to join the WAGMICE revolution 🐭🚗💨");

    const userOverlay = document.getElementById('userFormOverlay');
    const userForm = document.getElementById('userForm');
    const mathOverlay = document.getElementById('mathChallengeOverlay');
    const mathForm = document.getElementById('mathForm');
    const mathQuestion = document.getElementById('mathQuestion');
    const mathAnswer = document.getElementById('mathAnswer');
    const mathError = document.getElementById('mathError');
    const startBtn = document.getElementById('startBtn');
    const iqNextBtn = document.getElementById('iqNextBtn');

    let mathQuestions = [];
    let currentMathIndex = 0;
    let mathScore = 0;

    userForm.onsubmit = function(e) {
        e.preventDefault();
        userInfo = {
            name: document.getElementById('userName').value,
            age: parseInt(document.getElementById('userAge').value, 10),
            skill: document.getElementById('userSkill').value,
            expertise: parseInt(document.getElementById('userExpertise').value, 10)
        };
        userOverlay.style.display = 'none';
        showWagmiceMessage(userInfo.name, userInfo.age);

        mathQuestion.textContent = "Loading questions from GitHub Copilot...";
        mathAnswer.value = '';
        mathError.style.display = 'none';
        mathOverlay.style.display = 'flex';

        fetch('/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'user', content: `Give me exactly 5 simple math questions suitable for a person aged ${userInfo.age}. Output ONLY the questions as a numbered list, no introduction, no explanations, no answers, no extra text.` }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            const lines = data.choices[0].message.content.trim().split('\n').filter(l => l.trim());
            mathQuestions = lines.map(l => l.replace(/^\d+\.\s*/, '').trim());
            currentMathIndex = 0;
            mathScore = 0;
            showNextMathQuestion();
        })
        .catch(err => {
            mathQuestions = ["What is 2 + 2?", "What is 5 - 3?", "What is 10 / 2?", "What is 3 x 3?", "What is 7 + 1?"];
            currentMathIndex = 0;
            mathScore = 0;
            showNextMathQuestion();
            console.error("LLM error:", err);
        });
    };

    function showNextMathQuestion() {
        if (currentMathIndex < mathQuestions.length) {
            mathQuestion.textContent = mathQuestions[currentMathIndex] + " (Generated by GitHub Copilot)";
            mathAnswer.value = '';
            mathError.style.display = 'none';
            mathOverlay.style.display = 'flex';
        } else {
            mathOverlay.style.display = 'none';
            showMathAppreciation();
            startBtn.disabled = false;
            mathCorrect = true;
        }
    }

    mathForm.onsubmit = function(e) {
        e.preventDefault();
        fetch('/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'user', content: `You are GitHub Copilot. Is the answer to "${mathQuestions[currentMathIndex]}" equal to ${mathAnswer.value}? Reply only "yes" or "no".` }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            const reply = data.choices[0].message.content.trim().toLowerCase();
            if (reply.startsWith('yes')) {
                mathScore += 1;
            }
            currentMathIndex += 1;
            showNextMathQuestion();
        })
        .catch(err => {
            mathError.textContent = "Could not check answer (GitHub Copilot error).";
            mathError.style.display = 'block';
            console.error("LLM error:", err);
        });
    };

    function showMathAppreciation() {
        let msg = `You got ${mathScore}/5 correct! `;
        if (mathScore === 5) {
            msg += userInfo.age < 12
                ? "Genius for your age! 🚀"
                : userInfo.age < 18
                    ? "Brilliant work! You're racing ahead! 🏁"
                    : "Math master! You're ready for the big leagues. 🚗💨";
        } else if (mathScore >= 3) {
            msg += userInfo.age < 12
                ? "Great job! You're super smart for your age!"
                : userInfo.age < 18
                    ? "Nice! You're quick and clever."
                    : "Solid work! You're ready to race!";
        } else {
            msg += userInfo.age < 12
                ? "Keep practicing, future math star!"
                : userInfo.age < 18
                    ? "Don't worry, you'll get even better with practice!"
                    : "Keep at it! Every racer improves with time.";
        }
        alert(msg + `\n\nRemember, $WGM isn't just a meme — it's a movement. Play, earn, and join the WAGMICE family. 🚗💨

Want to buy? Check out Pump.fun, Raydium, or Jupiter. Need help? Hop into our Telegram: https://t.me/WagmicePortal

Follow us on X: @Wagmice (https://x.com/Wagmice)

Now, let’s race!`);
    }

    function getPronoun(name) {
        const lower = name.trim().toLowerCase();
        if (lower.endsWith('a') || lower.endsWith('i') || lower.endsWith('e')) return 'she';
        return 'he';
    }

    function showWagmiceMessage(name, age) {
        const pronoun = getPronoun(name);
        const msg = `Hey ${name}! At age ${age}, ${pronoun} is just the right kind of sharp to join the WAGMICE revolution 🐭🚀.

Before you dive into the world of $WGM on Solana, let's see how quick your mind is with a few IQ warm-ups. Remember: in crypto and in life, brains beat hype every time!

Ready? Let's go!`;
        alert(msg);
    }

    if (window.game) {
        window.game.destroy(true);
    }

    // Load html2canvas if not already loaded
    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        script.onload = attachDownloadHandler;
        document.body.appendChild(script);
    } else {
        attachDownloadHandler();
    }

    function attachDownloadHandler() {
        document.getElementById('downloadCertBtn').onclick = function() {
            html2canvas(document.getElementById('wagmice-certificate')).then(canvas => {
                const link = document.createElement('a');
                link.download = 'wagmice-certificate.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        };
    }
});

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }, 200);
});