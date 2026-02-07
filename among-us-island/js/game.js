// Minimal Among Us Game - Stable Version

class AmongUsGame {
    constructor() {
        this.game = null;
        this.players = [];
        this.localPlayer = null;
    }
    
    init(config) {
        const gameConfig = {
            type: Phaser.AUTO,
            width: Math.min(1200, window.innerWidth),
            height: Math.min(800, window.innerHeight),
            parent: 'game-container',
            backgroundColor: 0x1a1a2e,
            scene: {
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        };
        
        this.game = new Phaser.Game(gameConfig);
        this.playerName = config.playerName || 'Guest';
    }
    
    create() {
        const scene = this.game.scene.scenes[0];
        
        // Draw simple rooms
        const graphics = scene.add.graphics();
        
        // Main Hall
        graphics.fillStyle(0x2d2d44, 1);
        graphics.fillRect(400, 250, 300, 200);
        scene.add.text(550, 340, 'Main Hall', { fontSize: '20px', fill: '#888' }).setOrigin(0.5);
        
        // Kitchen
        graphics.fillStyle(0x3d3d54, 1);
        graphics.fillRect(100, 250, 250, 180);
        scene.add.text(225, 340, 'Kitchen', { fontSize: '18px', fill: '#888' }).setOrigin(0.5);
        
        // Temple
        graphics.fillStyle(0x4a3d6a, 1);
        graphics.fillRect(750, 250, 250, 180);
        scene.add.text(875, 340, 'Temple', { fontSize: '18px', fill: '#888' }).setOrigin(0.5);
        
        // Create player
        this.localPlayer = {
            x: 550,
            y: 350,
            sprite: scene.add.circle(550, 350, 20, CHARACTERS[0].color)
        };
        
        // Add name
        scene.add.text(550, 385, this.playerName, { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
        
        // Create other characters
        const positions = [
            {x: 480, y: 320}, {x: 620, y: 320}, {x: 500, y: 380}, {x: 600, y: 380},
            {x: 200, y: 320}, {x: 850, y: 320}
        ];
        
        for (let i = 1; i < 7 && i < CHARACTERS.length; i++) {
            const char = CHARACTERS[i];
            const pos = positions[i-1];
            scene.add.circle(pos.x, pos.y, 18, char.color);
            scene.add.text(pos.x, pos.y + 30, char.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        }
        
        // Instructions
        scene.add.text(600, 50, 'WASD to move | Among Us: Island Edition', { fontSize: '16px', fill: '#666' }).setOrigin(0.5);
        
        // Setup keys
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
        
        // Hide start screen
        document.getElementById('start-screen').classList.add('hidden');
    }
    
    update() {
        if (!this.localPlayer) return;
        
        const speed = 3;
        let dx = 0, dy = 0;
        
        if (this.keys.W.isDown) dy -= speed;
        if (this.keys.S.isDown) dy += speed;
        if (this.keys.A.isDown) dx -= speed;
        if (this.keys.D.isDown) dx += speed;
        
        this.localPlayer.x += dx;
        this.localPlayer.y += dy;
        this.localPlayer.sprite.x = this.localPlayer.x;
        this.localPlayer.sprite.y = this.localPlayer.y;
    }
}

let game = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!game) {
            game = new AmongUsGame();
            game.init({
                playerName: document.getElementById('player-name').value || 'Guest'
            });
        }
    });
});
