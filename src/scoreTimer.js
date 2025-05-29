export class ScoreTimer {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.timer = 0;
        // Score at top-right corner
        this.scoreText = this.scene.add.text(
            scene.sys.game.config.width - 30, // x position (right edge)
            20,                               // y position
            'Score: 0',
            { fontSize: '28px', fill: '#fff' }
        ).setOrigin(1, 0).setDepth(10); // Align right
        this.timerText = this.scene.add.text(
            20, 20, 'Time: 0', { fontSize: '28px', fill: '#fff' }
        ).setDepth(10);
        this.active = true;
    }

    addScore(points) {
        if (!this.active) return;
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
    }

    updateTimer(delta) {
        if (!this.active) return;
        this.timer += delta / 1000;
        this.timerText.setText('Time: ' + Math.floor(this.timer));
    }

    stop() {
        this.active = false;
    }
}