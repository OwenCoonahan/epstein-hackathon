// Minimal Among Us Game - Stable Version

class AmongUsGame {
    constructor() {
        this.game = null;
        this.players = [];
        this.localPlayer = null;
    }
    
    createAmongUsCharacter(scene, x, y, color, name) {
        const g = scene.add.graphics();
        
        // Body (bean shape)
        g.fillStyle(color, 1);
        g.fillRoundedRect(x - 18, y - 25, 36, 50, 16);
        
        // Backpack
        g.fillStyle(color, 1);
        g.fillRoundedRect(x + 14, y - 15, 10, 30, 5);
        
        // Visor (glass)
        g.fillStyle(0x9ecfff, 1);
        g.fillRoundedRect(x - 14, y - 20, 24, 16, 6);
        
        // Visor shine
        g.fillStyle(0xffffff, 0.4);
        g.fillRoundedRect(x - 12, y - 18, 8, 6, 3);
        
        // Legs
        g.fillStyle(color, 1);
        g.fillRoundedRect(x - 14, y + 20, 12, 12, 4);
        g.fillRoundedRect(x + 2, y + 20, 12, 12, 4);
        
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(x, y + 38, 40, 10);
        
        // Name tag
        scene.add.text(x, y + 50, name, { 
            fontSize: '12px', 
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        return g;
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
        
        // Draw Among Us style rooms
        const graphics = scene.add.graphics();
        
        // Room backgrounds with borders
        const rooms = [
            { x: 350, y: 200, w: 400, h: 280, name: 'Main Hall', color: 0x2d2d44 },
            { x: 50, y: 200, w: 280, h: 200, name: 'Kitchen', color: 0x3d3d54 },
            { x: 770, y: 200, w: 280, h: 200, name: 'Temple', color: 0x4a3d6a },
            { x: 50, y: 450, w: 200, h: 150, name: 'Storage', color: 0x3d4d3d },
            { x: 850, y: 450, w: 200, h: 150, name: 'Security', color: 0x4d3d3d },
            { x: 400, y: 520, w: 300, h: 120, name: 'Dock', color: 0x2d3d4d }
        ];
        
        rooms.forEach(room => {
            // Room shadow
            graphics.fillStyle(0x000000, 0.3);
            graphics.fillRect(room.x + 5, room.y + 5, room.w, room.h);
            
            // Room fill
            graphics.fillStyle(room.color, 1);
            graphics.fillRect(room.x, room.y, room.w, room.h);
            
            // Room border
            graphics.lineStyle(3, 0x555577, 1);
            graphics.strokeRect(room.x, room.y, room.w, room.h);
            
            // Room name
            scene.add.text(room.x + room.w/2, room.y + 20, room.name, { 
                fontSize: '16px', 
                fill: '#666',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });
        
        // Corridors connecting rooms
        graphics.fillStyle(0x252535, 1);
        graphics.fillRect(330, 280, 30, 80);  // Kitchen to Main
        graphics.fillRect(740, 280, 40, 80);  // Main to Temple
        graphics.fillRect(550, 470, 40, 60);  // Main to Dock
        
        // Create player with Among Us style
        this.localPlayer = {
            x: 550,
            y: 350,
            sprite: this.createAmongUsCharacter(scene, 550, 350, CHARACTERS[0].color, this.playerName)
        };
        
        // Create other characters
        const positions = [
            {x: 480, y: 300}, {x: 620, y: 300}, {x: 450, y: 400}, {x: 650, y: 400},
            {x: 200, y: 320}, {x: 850, y: 320}, {x: 250, y: 380}
        ];
        
        for (let i = 1; i < 8 && i < CHARACTERS.length; i++) {
            const char = CHARACTERS[i];
            const pos = positions[i-1];
            this.createAmongUsCharacter(scene, pos.x, pos.y, char.color, char.name);
        }
        
        // Instructions
        scene.add.text(600, 50, 'WASD to move | Among Us: Island Edition', { fontSize: '16px', fill: '#666' }).setOrigin(0.5);
        
        // Setup keys
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
        
        // Hide start screen
        document.getElementById('start-screen').classList.add('hidden');
    }
    
    update() {
        if (!this.localPlayer || !this.localPlayer.sprite) return;
        
        const speed = 4;
        let dx = 0, dy = 0;
        
        if (this.keys.W.isDown) dy -= speed;
        if (this.keys.S.isDown) dy += speed;
        if (this.keys.A.isDown) dx -= speed;
        if (this.keys.D.isDown) dx += speed;
        
        // Keep in bounds
        const newX = Math.max(50, Math.min(1150, this.localPlayer.x + dx));
        const newY = Math.max(100, Math.min(700, this.localPlayer.y + dy));
        
        // Move the graphics
        this.localPlayer.sprite.x += (newX - this.localPlayer.x);
        this.localPlayer.sprite.y += (newY - this.localPlayer.y);
        
        this.localPlayer.x = newX;
        this.localPlayer.y = newY;
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
