// Main Game Class - Enhanced with Demo Mode and Visual Polish

class AmongUsGame {
    constructor() {
        this.game = null;
        this.scene = null;
        this.players = [];
        this.localPlayer = null;
        this.deadBodies = [];
        this.walkableGrid = null;
        
        // Game settings
        this.playerCount = 8;
        this.impostorCount = 2;
        this.killCooldown = 25;
        this.killRange = 80;
        this.visionRange = 300;
        this.votingTime = 30;
        this.discussionTime = 15;
        
        // Game state
        this.gameState = 'waiting'; // waiting, playing, meeting, voting, gameover
        this.taskProgress = 0;
        this.totalTasks = 0;
        this.completedTasks = 0;
        this.sabotageActive = null;
        this.sabotageTimer = 0;
        this.demoMode = false;
        
        // Cooldowns
        this.lastKillTime = 0;
        this.canCallMeeting = true;
        
        // Managers
        this.taskManager = null;
        this.aiController = null;
        
        // UI elements
        this.taskBar = document.getElementById('task-progress');
        this.taskList = document.getElementById('task-items');
        this.votingGrid = document.getElementById('voting-grid');
        
        // Input
        this.keys = {};
        this.joystick = { active: false, dx: 0, dy: 0 };
        
        // Animation
        this.animationFrame = 0;
        this.playerSprites = new Map();
        
        // Graphics layers
        this.decorationGraphics = null;
        this.atmosphereGraphics = null;
    }
    
    init(config) {
        this.playerCount = config.playerCount || 8;
        this.impostorCount = config.impostorCount || 2;
        this.playerName = config.playerName || 'Guest';
        this.demoMode = config.demoMode || false;
        
        this.walkableGrid = createWalkableGrid();
        
        // Initialize music
        if (typeof musicManager !== 'undefined') {
            musicManager.init();
        }
        
        // Initialize Phaser
        const gameConfig = {
            type: Phaser.AUTO,
            width: Math.min(1400, window.innerWidth),
            height: Math.min(900, window.innerHeight),
            parent: 'game-container',
            backgroundColor: MAP_CONFIG.backgroundColor,
            scene: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };
        
        this.game = new Phaser.Game(gameConfig);
    }
    
    preload() {
        // We'll create graphics procedurally instead of loading assets
    }
    
    create() {
        this.scene = this.game.scene.scenes[0];
        
        // Create map
        this.createMap();
        
        // Create players
        this.createPlayers();
        
        // Setup camera
        this.setupCamera();
        
        // Setup input
        this.setupInput();
        
        // Initialize managers
        this.taskManager = new TaskManager(this);
        this.aiController = new AIController(this);
        this.aiController.initialize(this.players.filter(p => !p.isPlayer));
        
        // Setup demo mode if enabled
        if (this.demoMode) {
            this.aiController.setDemoMode(true);
            // Initialize state for player in demo mode
            this.aiController.initialize([this.localPlayer]);
        }
        
        // Setup UI
        this.setupUI();
        
        // Start game
        this.startGame();
        
        // Start music
        if (typeof musicManager !== 'undefined') {
            musicManager.start();
        }
    }
    
    createMap() {
        const graphics = this.scene.add.graphics();
        
        // Draw deep ocean background with animated waves
        this.drawOcean(graphics);
        
        // Draw island base
        this.drawIsland(graphics);
        
        // Draw rooms
        Object.values(ROOMS).forEach(room => {
            this.drawRoom(graphics, room);
        });
        
        // Draw connections between rooms (paths)
        this.drawPaths(graphics);
        
        // Draw decorations
        this.drawDecorations();
        
        // Draw task locations
        this.drawTaskLocations(graphics);
        
        // Draw vents
        this.drawVents(graphics);
        
        // Draw emergency button
        this.drawEmergencyButton(graphics);
        
        // Draw sabotage fix locations
        this.drawSabotageLocations(graphics);
    }
    
    drawOcean(graphics) {
        // Deep ocean background
        graphics.fillStyle(0x0d3b66, 1);
        graphics.fillRect(-500, -500, MAP_CONFIG.width + 1000, MAP_CONFIG.height + 1000);
        
        // Ocean waves/lighter areas
        graphics.fillStyle(0x1a5276, 0.5);
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * MAP_CONFIG.width;
            const y = Math.random() * MAP_CONFIG.height;
            graphics.fillEllipse(x, y, 80 + Math.random() * 200, 30 + Math.random() * 80);
        }
        
        // Add some foam near shore
        graphics.fillStyle(0xffffff, 0.2);
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = MAP_CONFIG.width * 0.46 + Math.random() * 50;
            const x = MAP_CONFIG.width / 2 + Math.cos(angle) * dist;
            const y = MAP_CONFIG.height / 2 + Math.sin(angle) * dist * 0.8;
            graphics.fillEllipse(x, y, 60 + Math.random() * 80, 20 + Math.random() * 30);
        }
    }
    
    drawIsland(graphics) {
        // Island dark green border
        graphics.fillStyle(0x1e4620, 1);
        graphics.fillEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, 
            MAP_CONFIG.width * 0.92, MAP_CONFIG.height * 0.92);
        
        // Main island green
        graphics.fillStyle(0x2d5a27, 1);
        graphics.fillEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, 
            MAP_CONFIG.width * 0.88, MAP_CONFIG.height * 0.88);
        
        // Beach ring
        graphics.lineStyle(45, 0xf4d03f, 0.7);
        graphics.strokeEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, 
            MAP_CONFIG.width * 0.86, MAP_CONFIG.height * 0.86);
        
        // Water edge
        graphics.lineStyle(15, 0x00bfff, 0.4);
        graphics.strokeEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, 
            MAP_CONFIG.width * 0.88, MAP_CONFIG.height * 0.88);
    }
    
    drawRoom(graphics, room) {
        // Room shadow
        graphics.fillStyle(0x000000, 0.25);
        graphics.fillRoundedRect(room.x + 6, room.y + 6, room.width, room.height, 15);
        
        // Room floor base
        graphics.fillStyle(room.color, 1);
        graphics.fillRoundedRect(room.x, room.y, room.width, room.height, 15);
        
        // Hallways get different treatment
        if (room.isHallway) {
            // Floor pattern for hallways
            graphics.fillStyle(0x2a1a0a, 0.3);
            for (let i = 0; i < room.width; i += 40) {
                graphics.fillRect(room.x + i, room.y, 2, room.height);
            }
        } else if (room.isPath) {
            // Dirt path texture
            graphics.fillStyle(0x4a3a2a, 0.4);
            for (let i = 0; i < 8; i++) {
                const rx = room.x + Math.random() * room.width;
                const ry = room.y + Math.random() * room.height;
                graphics.fillCircle(rx, ry, 8 + Math.random() * 15);
            }
        } else {
            // Light gradient on top
            graphics.fillStyle(0xffffff, 0.08);
            graphics.fillRoundedRect(room.x, room.y, room.width, room.height / 2.5, 
                {tl: 15, tr: 15, bl: 0, br: 0});
        }
        
        // Special patterns
        if (room.pattern === 'stripes') {
            // Temple gold stripes
            graphics.fillStyle(0xffd700, 1);
            for (let i = 0; i < room.height; i += 30) {
                if ((i / 30) % 2 === 0) {
                    graphics.fillRect(room.x + 10, room.y + i, room.width - 20, 15);
                }
            }
            // Temple dome
            graphics.fillStyle(0xffd700, 1);
            graphics.fillEllipse(room.x + room.width/2, room.y - 20, room.width * 0.7, 60);
            // Temple door
            graphics.fillStyle(0x8b4513, 1);
            graphics.fillRoundedRect(room.x + room.width/2 - 30, room.y + room.height - 70, 60, 70, 
                {tl: 30, tr: 30, bl: 0, br: 0});
        }
        
        // Room border
        graphics.lineStyle(4, 0x222222, 0.9);
        graphics.strokeRoundedRect(room.x, room.y, room.width, room.height, 15);
        
        // Room decorations
        this.addRoomDecoration(graphics, room);
        
        // Room label
        if (!room.isHallway && !room.isPath) {
            const text = this.scene.add.text(
                room.x + room.width / 2,
                room.y + 20,
                room.name,
                { 
                    fontSize: '14px', 
                    color: '#ffffff', 
                    fontFamily: 'Arial Black, sans-serif',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            );
            text.setOrigin(0.5, 0);
            text.setDepth(3);
        }
    }
    
    addRoomDecoration(graphics, room) {
        // Room-specific decorations based on decoration type
        const decoration = room.decoration;
        if (!decoration) return;
        
        const cx = room.x + room.width / 2;
        const cy = room.y + room.height / 2;
        
        switch (decoration) {
            case 'chandelier':
                // Chandelier hanging from ceiling
                graphics.fillStyle(0xffd700, 0.8);
                graphics.fillCircle(cx, cy - 20, 25);
                graphics.fillStyle(0xffffaa, 0.5);
                graphics.fillCircle(cx, cy - 20, 35);
                break;
                
            case 'bed':
                // Bed
                graphics.fillStyle(0xf5f5dc, 1);
                graphics.fillRoundedRect(cx - 40, cy + 20, 80, 50, 8);
                graphics.fillStyle(0x8b4513, 1);
                graphics.fillRect(cx - 45, cy + 10, 90, 15);
                break;
                
            case 'kitchen':
                // Kitchen counter
                graphics.fillStyle(0x808080, 1);
                graphics.fillRect(room.x + 20, room.y + 50, room.width - 40, 20);
                // Stove
                graphics.fillStyle(0x333333, 1);
                graphics.fillRect(room.x + 30, room.y + 80, 60, 50);
                break;
                
            case 'table':
                // Dining table
                graphics.fillStyle(0x8b4513, 1);
                graphics.fillEllipse(cx, cy + 20, 120, 60);
                // Chairs
                graphics.fillStyle(0x654321, 1);
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const chairX = cx + Math.cos(angle) * 70;
                    const chairY = cy + 20 + Math.sin(angle) * 40;
                    graphics.fillCircle(chairX, chairY, 12);
                }
                break;
                
            case 'pool':
                // Pool water
                graphics.fillStyle(0x00bfff, 0.9);
                graphics.fillRoundedRect(room.x + 30, room.y + 40, room.width - 60, room.height - 80, 20);
                // Pool edge
                graphics.lineStyle(8, 0xffffff, 0.8);
                graphics.strokeRoundedRect(room.x + 30, room.y + 40, room.width - 60, room.height - 80, 20);
                // Pool ladder
                graphics.fillStyle(0xc0c0c0, 1);
                graphics.fillRect(room.x + room.width - 50, room.y + 60, 15, 40);
                break;
                
            case 'beach':
                // Beach umbrellas
                graphics.fillStyle(0xff4444, 0.9);
                graphics.fillEllipse(cx - 60, cy, 50, 30);
                graphics.fillStyle(0x4444ff, 0.9);
                graphics.fillEllipse(cx + 60, cy, 50, 30);
                // Umbrella poles
                graphics.fillStyle(0x8b4513, 1);
                graphics.fillRect(cx - 62, cy + 15, 4, 30);
                graphics.fillRect(cx + 58, cy + 15, 4, 30);
                break;
                
            case 'tennis':
                // Tennis net
                graphics.fillStyle(0xffffff, 0.8);
                graphics.fillRect(cx - 2, room.y + 30, 4, room.height - 60);
                // Court lines
                graphics.lineStyle(3, 0xffffff, 0.9);
                graphics.strokeRect(room.x + 20, room.y + 30, room.width - 40, room.height - 60);
                break;
                
            case 'helipad':
                // Helipad H
                graphics.fillStyle(0xffff00, 1);
                graphics.lineStyle(8, 0xffff00, 1);
                graphics.strokeCircle(cx, cy, 60);
                // H
                const fontSize = 60;
                const hText = this.scene.add.text(cx, cy, 'H', {
                    fontSize: fontSize + 'px',
                    color: '#ffff00',
                    fontStyle: 'bold'
                });
                hText.setOrigin(0.5);
                hText.setDepth(2);
                break;
                
            case 'dock':
                // Wooden planks
                graphics.fillStyle(0x8b4513, 1);
                for (let i = 0; i < room.height; i += 30) {
                    graphics.fillRect(room.x + 10, room.y + i, room.width - 20, 25);
                }
                // Ropes
                graphics.lineStyle(4, 0xdaa520, 1);
                graphics.lineBetween(room.x + 20, room.y + 20, room.x + 20, room.y + 80);
                break;
                
            case 'servers':
                // Server racks
                graphics.fillStyle(0x1a1a1a, 1);
                for (let i = 0; i < 3; i++) {
                    graphics.fillRect(room.x + 20 + i * 60, room.y + 40, 50, room.height - 80);
                    // Blinking lights
                    graphics.fillStyle(0x00ff00, 0.8);
                    graphics.fillCircle(room.x + 30 + i * 60, room.y + 60, 4);
                    graphics.fillCircle(room.x + 30 + i * 60, room.y + 80, 4);
                }
                break;
                
            case 'cameras':
                // Security monitors
                graphics.fillStyle(0x1a1a1a, 1);
                graphics.fillRect(cx - 70, room.y + 30, 140, 80);
                // Screen glow
                graphics.fillStyle(0x4a9eff, 0.6);
                graphics.fillRect(cx - 60, room.y + 40, 120, 60);
                break;
                
            case 'boxes':
                // Storage boxes
                graphics.fillStyle(0x8b7355, 1);
                graphics.fillRect(room.x + 30, room.y + 50, 50, 40);
                graphics.fillRect(room.x + 90, room.y + 60, 40, 30);
                graphics.fillRect(room.x + 140, room.y + 45, 55, 45);
                break;
                
            case 'temple':
                // Mysterious altar
                graphics.fillStyle(0x333333, 1);
                graphics.fillRect(cx - 30, cy + 30, 60, 40);
                graphics.fillStyle(0xffd700, 0.8);
                graphics.fillCircle(cx, cy + 20, 15);
                break;
        }
        
        // Add emoji decoration
        const emojis = {
            'mainHall': '🏛️',
            'masterSuite': '🛏️',
            'guestVilla1': '🚪',
            'guestVilla2': '🚪',
            'kitchen': '🍳',
            'diningRoom': '🍽️',
            'temple': '⛩️',
            'poolArea': '🏊',
            'beach': '🏖️',
            'tennisCourt': '🎾',
            'helipad': '🚁',
            'dock': '⚓',
            'basement': '🔒',
            'serverRoom': '💻',
            'securityOffice': '📹'
        };
        
        const emoji = emojis[room.id];
        if (emoji && !room.isHallway && !room.isPath) {
            const deco = this.scene.add.text(
                room.x + room.width - 35,
                room.y + room.height - 35,
                emoji,
                { fontSize: '28px' }
            );
            deco.setAlpha(0.7);
            deco.setDepth(2);
        }
    }
    
    drawPaths(graphics) {
        // Draw visual connections between rooms
        DOORS.forEach(door => {
            const room1 = ROOMS[door.from];
            const room2 = ROOMS[door.to];
            
            if (room1 && room2) {
                const x1 = room1.x + room1.width / 2;
                const y1 = room1.y + room1.height / 2;
                const x2 = room2.x + room2.width / 2;
                const y2 = room2.y + room2.height / 2;
                
                // Only draw path indicators for jungle paths
                if (room1.isPath || room2.isPath) {
                    graphics.lineStyle(4, 0x3a5a3a, 0.5);
                    graphics.lineBetween(x1, y1, x2, y2);
                }
            }
        });
    }
    
    drawDecorations() {
        // Palm trees around the island
        const palmPositions = [
            {x: 150, y: 700}, {x: 200, y: 1500}, {x: 450, y: 500},
            {x: 2400, y: 600}, {x: 2500, y: 1300}, {x: 2100, y: 1700},
            {x: 700, y: 1800}, {x: 350, y: 1100}, {x: 2300, y: 800},
            {x: 550, y: 350}, {x: 1800, y: 200}, {x: 2200, y: 1500},
            {x: 100, y: 1700}, {x: 2600, y: 1100}
        ];
        
        const graphics = this.scene.add.graphics();
        
        palmPositions.forEach(pos => {
            this.drawPalmTree(graphics, pos.x, pos.y);
        });
        
        // Add rocks near beach
        const rockPositions = [
            {x: 250, y: 1750}, {x: 400, y: 1680}, {x: 500, y: 1720}
        ];
        
        rockPositions.forEach(pos => {
            this.drawRock(graphics, pos.x, pos.y);
        });
    }
    
    drawPalmTree(graphics, x, y) {
        // Tree trunk
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillRect(x - 6, y - 50, 12, 60);
        
        // Trunk texture
        graphics.lineStyle(2, 0x654321, 0.5);
        for (let i = -45; i < 5; i += 10) {
            graphics.lineBetween(x - 6, y + i, x + 6, y + i);
        }
        
        // Palm fronds
        graphics.fillStyle(0x228b22, 1);
        // Left fronds
        graphics.fillEllipse(x - 30, y - 60, 35, 14);
        graphics.fillEllipse(x - 25, y - 72, 28, 12);
        // Right fronds
        graphics.fillEllipse(x + 30, y - 60, 35, 14);
        graphics.fillEllipse(x + 25, y - 72, 28, 12);
        // Top fronds
        graphics.fillEllipse(x, y - 85, 24, 18);
        graphics.fillEllipse(x - 12, y - 68, 26, 12);
        graphics.fillEllipse(x + 12, y - 68, 26, 12);
        
        // Darker frond details
        graphics.fillStyle(0x1a6b1a, 0.6);
        graphics.fillEllipse(x - 28, y - 58, 20, 8);
        graphics.fillEllipse(x + 28, y - 58, 20, 8);
        
        // Coconuts
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillCircle(x - 6, y - 52, 6);
        graphics.fillCircle(x + 6, y - 55, 6);
        graphics.fillCircle(x, y - 48, 5);
    }
    
    drawRock(graphics, x, y) {
        graphics.fillStyle(0x696969, 1);
        graphics.fillEllipse(x, y, 30 + Math.random() * 20, 15 + Math.random() * 10);
        graphics.fillStyle(0x888888, 0.5);
        graphics.fillEllipse(x - 5, y - 3, 15, 8);
    }
    
    drawTaskLocations(graphics) {
        TASK_LOCATIONS.forEach(task => {
            // Outer glow
            graphics.fillStyle(0xffff00, 0.25);
            graphics.fillCircle(task.x, task.y, 28);
            
            // Main circle
            graphics.fillStyle(0xffff00, 0.9);
            graphics.fillCircle(task.x, task.y, 18);
            
            // Inner highlight
            graphics.fillStyle(0xffffaa, 0.9);
            graphics.fillCircle(task.x - 4, task.y - 4, 9);
            
            // Border
            graphics.lineStyle(3, 0xcc9900, 1);
            graphics.strokeCircle(task.x, task.y, 18);
            
            // Task icon
            const icon = this.scene.add.text(task.x, task.y, '!', {
                fontSize: '20px',
                color: '#000000',
                fontStyle: 'bold',
                fontFamily: 'Arial Black'
            });
            icon.setOrigin(0.5);
            icon.setDepth(2);
        });
    }
    
    drawVents(graphics) {
        VENTS.forEach(vent => {
            // Vent shadow
            graphics.fillStyle(0x000000, 0.4);
            graphics.fillRoundedRect(vent.x - 30, vent.y - 12, 60, 36, 6);
            
            // Vent body
            graphics.fillStyle(0x2a2a2a, 1);
            graphics.fillRoundedRect(vent.x - 32, vent.y - 16, 64, 36, 8);
            
            // Vent inner
            graphics.fillStyle(0x0a0a0a, 1);
            graphics.fillRoundedRect(vent.x - 28, vent.y - 12, 56, 28, 5);
            
            // Vent grate pattern
            graphics.lineStyle(4, 0x444444, 1);
            for (let i = -20; i <= 20; i += 10) {
                graphics.lineBetween(vent.x + i, vent.y - 10, vent.x + i, vent.y + 12);
            }
            
            // Vent border
            graphics.lineStyle(2, 0x555555, 1);
            graphics.strokeRoundedRect(vent.x - 32, vent.y - 16, 64, 36, 8);
        });
    }
    
    drawEmergencyButton(graphics) {
        // Button glow
        graphics.fillStyle(0xff0000, 0.3);
        graphics.fillCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 45);
        
        // Button base
        graphics.fillStyle(0x333333, 1);
        graphics.fillCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 38);
        
        // Button
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 32);
        
        // Button highlight
        graphics.fillStyle(0xff6666, 0.6);
        graphics.fillEllipse(EMERGENCY_BUTTON.x - 8, EMERGENCY_BUTTON.y - 8, 18, 12);
        
        // Button border
        graphics.lineStyle(4, 0xffffff, 1);
        graphics.strokeCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 32);
        
        // Button label
        const buttonText = this.scene.add.text(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, '🚨', {
            fontSize: '28px'
        });
        buttonText.setOrigin(0.5);
        buttonText.setDepth(3);
    }
    
    drawSabotageLocations(graphics) {
        Object.entries(SABOTAGE_TARGETS).forEach(([type, loc]) => {
            graphics.fillStyle(0xff4757, 0.4);
            graphics.fillCircle(loc.x, loc.y, 22);
            graphics.lineStyle(2, 0xff4757, 0.6);
            graphics.strokeCircle(loc.x, loc.y, 22);
        });
    }
    
    createPlayers() {
        // Select characters
        const characters = selectCharacters(this.playerCount, this.playerName);
        
        // Assign roles
        const shuffled = [...characters];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // First N are impostors
        for (let i = 0; i < this.impostorCount; i++) {
            shuffled[i].isImpostor = true;
        }
        
        // Create player objects
        shuffled.forEach((char, index) => {
            const spawn = SPAWN_POINTS[index % SPAWN_POINTS.length];
            
            const player = {
                id: char.id,
                name: char.name,
                color: char.color,
                bio: char.bio,
                features: char.features || {},
                isPlayer: char.isPlayer || false,
                isImpostor: char.isImpostor || false,
                isDead: false,
                x: spawn.x + (Math.random() - 0.5) * 50,
                y: spawn.y + (Math.random() - 0.5) * 50,
                sprite: null,
                nameText: null,
                tasks: [],
                vx: 0,
                vy: 0,
                inVent: false,
                walkFrame: 0
            };
            
            // Assign tasks
            if (!player.isImpostor) {
                const taskPool = [...TASK_LOCATIONS];
                const numTasks = 4 + Math.floor(Math.random() * 3);
                for (let i = 0; i < numTasks && taskPool.length > 0; i++) {
                    const idx = Math.floor(Math.random() * taskPool.length);
                    const task = taskPool.splice(idx, 1)[0];
                    player.tasks.push({
                        id: task.id,
                        name: task.name,
                        taskType: task.taskType,
                        x: task.x,
                        y: task.y,
                        completed: false
                    });
                }
                this.totalTasks += player.tasks.length;
            } else {
                // Impostors get fake tasks for appearance
                const taskPool = [...TASK_LOCATIONS];
                for (let i = 0; i < 5 && taskPool.length > 0; i++) {
                    const idx = Math.floor(Math.random() * taskPool.length);
                    const task = taskPool.splice(idx, 1)[0];
                    player.tasks.push({
                        id: task.id,
                        name: task.name,
                        taskType: task.taskType,
                        x: task.x,
                        y: task.y,
                        completed: false,
                        fake: true
                    });
                }
            }
            
            // Create sprite
            this.createPlayerSprite(player);
            
            this.players.push(player);
            
            if (player.isPlayer) {
                this.localPlayer = player;
            }
        });
    }
    
    createPlayerSprite(player) {
        const graphics = this.scene.add.graphics();
        
        // Use the enhanced character drawing from characters.js
        drawCharacterSprite(graphics, player, 1);
        
        // Create texture from graphics
        const key = `player_${player.id}_${Date.now()}`;
        graphics.generateTexture(key, 70, 90);
        graphics.destroy();
        
        // Create sprite
        player.sprite = this.scene.add.sprite(player.x, player.y, key);
        player.sprite.setOrigin(0.5, 0.7);
        player.sprite.setDepth(10);
        
        // Store texture key for recreation
        this.playerSprites.set(player.id, key);
        
        // Name text with character-specific styling
        const nameStyle = {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        };
        
        player.nameText = this.scene.add.text(player.x, player.y + 42, player.name, nameStyle);
        player.nameText.setOrigin(0.5);
        player.nameText.setDepth(11);
    }
    
    setupCamera() {
        this.scene.cameras.main.setBounds(0, 0, MAP_CONFIG.width, MAP_CONFIG.height);
        
        if (this.localPlayer && !this.demoMode) {
            this.scene.cameras.main.startFollow(this.localPlayer.sprite, true, 0.08, 0.08);
        } else if (this.demoMode) {
            // In demo mode, follow a random player or pan around
            this.scene.cameras.main.startFollow(this.localPlayer.sprite, true, 0.05, 0.05);
        }
    }
    
    setupInput() {
        if (this.demoMode) {
            // Limited input in demo mode
            this.scene.input.keyboard.on('keydown', (event) => {
                if (event.code === 'Escape') {
                    this.exitDemoMode();
                }
            });
            return;
        }
        
        // Keyboard
        this.scene.input.keyboard.on('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyPress(event.code);
        });
        
        this.scene.input.keyboard.on('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mobile joystick
        this.setupMobileControls();
    }
    
    exitDemoMode() {
        this.demoMode = false;
        this.aiController.setDemoMode(false);
        
        // Re-setup camera to follow player
        this.scene.cameras.main.startFollow(this.localPlayer.sprite, true, 0.08, 0.08);
        
        // Re-setup input
        this.setupInput();
        
        // Show message
        this.showMessage('Demo mode disabled - You are now in control!', '#2ed573');
    }
    
    setupMobileControls() {
        const joystickZone = document.getElementById('joystick-zone');
        if (!joystickZone) return;
        
        let startX, startY;
        
        const handleStart = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystickZone.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            this.joystick.active = true;
        };
        
        const handleMove = (e) => {
            if (!this.joystick.active) return;
            
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 50;
            
            if (dist > maxDist) {
                this.joystick.dx = (dx / dist) * maxDist;
                this.joystick.dy = (dy / dist) * maxDist;
            } else {
                this.joystick.dx = dx;
                this.joystick.dy = dy;
            }
        };
        
        const handleEnd = () => {
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
        };
        
        joystickZone.addEventListener('touchstart', handleStart);
        joystickZone.addEventListener('touchmove', handleMove);
        joystickZone.addEventListener('touchend', handleEnd);
        joystickZone.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    handleKeyPress(code) {
        if (this.gameState !== 'playing') return;
        if (this.localPlayer.isDead) return;
        if (this.demoMode) return;
        
        switch (code) {
            case 'KeyE':
                this.handleUseAction();
                break;
            case 'KeyQ':
                if (this.localPlayer.isImpostor) {
                    this.handleKillAction();
                }
                break;
            case 'KeyR':
                this.handleReportAction();
                break;
        }
    }
    
    setupUI() {
        // Hide start screen
        document.getElementById('start-screen').classList.add('hidden');
        
        // Show HUD
        document.getElementById('game-hud').classList.remove('hidden');
        
        // Setup action buttons
        document.getElementById('use-btn').addEventListener('click', () => this.handleUseAction());
        document.getElementById('report-btn').addEventListener('click', () => this.handleReportAction());
        document.getElementById('kill-btn').addEventListener('click', () => this.handleKillAction());
        document.getElementById('vent-btn').addEventListener('click', () => this.handleVentAction());
        document.getElementById('sabotage-btn').addEventListener('click', () => this.openSabotageMenu());
        document.getElementById('skip-vote-btn').addEventListener('click', () => this.castVote('skip'));
        document.getElementById('close-sabotage').addEventListener('click', () => this.closeSabotageMenu());
        
        // Task list toggle
        document.getElementById('task-list-toggle').addEventListener('click', () => {
            document.getElementById('task-list').classList.toggle('hidden');
        });
        
        // Sabotage options
        document.querySelectorAll('.sabotage-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.triggerSabotage(btn.dataset.sabotage);
                this.closeSabotageMenu();
            });
        });
        
        // Update task list
        this.updateTaskList();
        
        // Show/hide impostor buttons
        if (!this.localPlayer.isImpostor) {
            document.querySelectorAll('.impostor-only').forEach(el => el.style.display = 'none');
        }
        
        // Show role reveal (skip in demo mode for cleaner look)
        if (!this.demoMode) {
            this.showRoleReveal();
        }
        
        // Demo mode indicator
        if (this.demoMode) {
            const demoIndicator = document.createElement('div');
            demoIndicator.id = 'demo-indicator';
            demoIndicator.innerHTML = '🎬 DEMO MODE<br><small>Press ESC to take control</small>';
            demoIndicator.style.cssText = `
                position: fixed;
                top: 60px;
                right: 20px;
                background: rgba(255, 71, 87, 0.9);
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                font-weight: bold;
                z-index: 1000;
                text-align: center;
            `;
            document.body.appendChild(demoIndicator);
        }
    }
    
    showRoleReveal() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.zIndex = '1001';
        
        const panel = document.createElement('div');
        panel.className = 'panel';
        
        if (this.localPlayer.isImpostor) {
            panel.innerHTML = `
                <h1 style="color: #ff4757;">IMPOSTOR</h1>
                <p style="color: #ccc; margin: 20px 0;">Eliminate the crewmates without getting caught.</p>
                <p style="color: #888;">Fellow Impostor(s):</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                    ${this.players.filter(p => p.isImpostor && p.id !== this.localPlayer.id)
                        .map(p => `<span style="color: ${hexToCSS(p.color)}; font-weight: bold;">${p.name}</span>`)
                        .join('')}
                </div>
            `;
        } else {
            panel.innerHTML = `
                <h1 style="color: #2ed573;">CREWMATE</h1>
                <p style="color: #ccc; margin: 20px 0;">Complete your tasks and find the impostor(s).</p>
                <p style="color: #888;">There are ${this.impostorCount} impostor(s) among us.</p>
            `;
        }
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }
    
    showMessage(text, color = '#ffffff') {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.2em;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 3s forwards;
        `;
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
    
    updateTaskList() {
        if (!this.localPlayer) return;
        
        this.taskList.innerHTML = '';
        this.localPlayer.tasks.forEach(task => {
            const li = document.createElement('li');
            // Use funny task name if available
            const funnyName = FUNNY_TASK_NAMES && FUNNY_TASK_NAMES[task.name] ? FUNNY_TASK_NAMES[task.name] : task.name;
            li.textContent = funnyName;
            if (task.completed) li.classList.add('completed');
            this.taskList.appendChild(li);
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.aiController.start();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update animation frame
        this.animationFrame++;
        
        // Update local player (only if not in demo mode)
        if (!this.demoMode) {
            this.updateLocalPlayer();
        }
        
        // Update all player sprites
        this.updatePlayerSprites();
        
        this.updateUI();
        this.checkGameEnd();
        this.updateSabotage();
    }
    
    updateLocalPlayer() {
        if (!this.localPlayer || this.localPlayer.isDead) return;
        if (this.localPlayer.inVent) return;
        
        let dx = 0, dy = 0;
        const speed = 4;
        
        // Keyboard input
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
        
        // Joystick input
        if (this.joystick.active) {
            dx = this.joystick.dx / 50;
            dy = this.joystick.dy / 50;
        }
        
        // Normalize
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 0) {
            dx = (dx / mag) * speed;
            dy = (dy / mag) * speed;
        }
        
        // Apply movement
        const newX = this.localPlayer.x + dx;
        const newY = this.localPlayer.y + dy;
        
        if (isWalkable(newX, newY, this.walkableGrid)) {
            this.localPlayer.x = newX;
            this.localPlayer.y = newY;
            this.localPlayer.sprite.x = newX;
            this.localPlayer.sprite.y = newY;
            this.localPlayer.nameText.x = newX;
            this.localPlayer.nameText.y = newY + 42;
            
            // Walking animation
            if (mag > 0) {
                this.localPlayer.walkFrame = (this.localPlayer.walkFrame + 0.2) % (Math.PI * 2);
                const bobAmount = Math.sin(this.localPlayer.walkFrame) * 2;
                this.localPlayer.sprite.y = newY + bobAmount;
            }
            
            // Flip sprite based on direction
            if (dx !== 0) {
                this.localPlayer.sprite.setFlipX(dx < 0);
            }
        }
    }
    
    updatePlayerSprites() {
        // Update all player positions and animations
        this.players.forEach(player => {
            if (player.isDead) return;
            if (player.inVent) return;
            
            // Sync sprite position
            player.sprite.x = player.x;
            player.sprite.y = player.y;
            player.nameText.x = player.x;
            player.nameText.y = player.y + 42;
            
            // Idle animation for non-moving players
            if (!player.isPlayer || this.demoMode) {
                const idleOffset = Math.sin(this.animationFrame * 0.05 + player.id.charCodeAt(0)) * 1;
                player.sprite.y = player.y + idleOffset;
            }
        });
    }
    
    updateUI() {
        // Update task progress bar
        const progress = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
        this.taskBar.style.width = progress + '%';
        
        // Update action buttons visibility
        if (!this.demoMode) {
            this.updateActionButtons();
        }
    }
    
    updateActionButtons() {
        const useBtn = document.getElementById('use-btn');
        const reportBtn = document.getElementById('report-btn');
        const killBtn = document.getElementById('kill-btn');
        const ventBtn = document.getElementById('vent-btn');
        
        // Check for nearby task
        const nearbyTask = this.getNearbyTask();
        const nearbyEmergency = this.isNearEmergencyButton();
        useBtn.classList.toggle('hidden', !nearbyTask && !nearbyEmergency);
        useBtn.textContent = nearbyTask ? 'USE (E)' : (nearbyEmergency ? 'MEETING (E)' : 'USE (E)');
        
        // Check for nearby body
        const nearbyBody = this.getNearbyBody();
        reportBtn.classList.toggle('hidden', !nearbyBody);
        
        if (this.localPlayer.isImpostor) {
            // Check for kill target
            const killTarget = this.getKillTarget();
            const killOnCooldown = Date.now() - this.lastKillTime < this.killCooldown * 1000;
            killBtn.classList.toggle('hidden', !killTarget);
            killBtn.disabled = killOnCooldown;
            if (killOnCooldown) {
                const remaining = Math.ceil((this.killCooldown * 1000 - (Date.now() - this.lastKillTime)) / 1000);
                killBtn.textContent = `KILL (${remaining}s)`;
            } else {
                killBtn.textContent = 'KILL (Q)';
            }
            
            // Check for nearby vent
            const nearbyVent = this.getNearbyVent();
            ventBtn.classList.toggle('hidden', !nearbyVent && !this.localPlayer.inVent);
            ventBtn.textContent = this.localPlayer.inVent ? 'EXIT VENT (E)' : 'VENT (E)';
        }
    }
    
    getNearbyTask() {
        if (!this.localPlayer) return null;
        
        for (const task of this.localPlayer.tasks) {
            if (task.completed) continue;
            
            const dx = task.x - this.localPlayer.x;
            const dy = task.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                const location = TASK_LOCATIONS.find(t => t.id === task.id);
                return { ...task, ...location };
            }
        }
        
        return null;
    }
    
    isNearEmergencyButton() {
        if (!this.localPlayer) return false;
        
        const dx = EMERGENCY_BUTTON.x - this.localPlayer.x;
        const dy = EMERGENCY_BUTTON.y - this.localPlayer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < EMERGENCY_BUTTON.radius && this.canCallMeeting;
    }
    
    getNearbyBody() {
        for (const body of this.deadBodies) {
            const dx = body.x - this.localPlayer.x;
            const dy = body.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 80) {
                return body;
            }
        }
        return null;
    }
    
    getKillTarget() {
        if (!this.localPlayer || !this.localPlayer.isImpostor) return null;
        
        for (const player of this.players) {
            if (player.id === this.localPlayer.id) continue;
            if (player.isDead || player.isImpostor) continue;
            
            const dx = player.x - this.localPlayer.x;
            const dy = player.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.killRange) {
                return player;
            }
        }
        
        return null;
    }
    
    getNearbyVent() {
        for (const vent of VENTS) {
            const dx = vent.x - this.localPlayer.x;
            const dy = vent.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 60) {
                return vent;
            }
        }
        return null;
    }
    
    handleUseAction() {
        if (this.demoMode) return;
        
        if (this.localPlayer.inVent) {
            this.handleVentAction();
            return;
        }
        
        const nearbyTask = this.getNearbyTask();
        if (nearbyTask && !nearbyTask.fake) {
            this.taskManager.openTask(nearbyTask);
            return;
        }
        
        if (this.isNearEmergencyButton()) {
            this.callEmergencyMeeting();
            return;
        }
        
        const nearbyVent = this.getNearbyVent();
        if (nearbyVent && this.localPlayer.isImpostor) {
            this.handleVentAction();
        }
    }
    
    handleKillAction() {
        if (this.demoMode) return;
        if (!this.localPlayer.isImpostor) return;
        if (Date.now() - this.lastKillTime < this.killCooldown * 1000) return;
        
        const target = this.getKillTarget();
        if (target) {
            this.killPlayer(this.localPlayer, target);
            this.lastKillTime = Date.now();
        }
    }
    
    handleReportAction() {
        if (this.demoMode) return;
        
        const body = this.getNearbyBody();
        if (body) {
            this.reportBody(this.localPlayer, body);
        }
    }
    
    handleVentAction() {
        if (this.demoMode) return;
        if (!this.localPlayer.isImpostor) return;
        
        if (this.localPlayer.inVent) {
            // Exit vent
            this.localPlayer.inVent = false;
            this.localPlayer.sprite.setVisible(true);
            this.localPlayer.nameText.setVisible(true);
            
            if (typeof musicManager !== 'undefined') {
                musicManager.playVentSound();
            }
        } else {
            const vent = this.getNearbyVent();
            if (vent) {
                // Enter vent
                this.localPlayer.inVent = true;
                this.localPlayer.sprite.setVisible(false);
                this.localPlayer.nameText.setVisible(false);
                
                if (typeof musicManager !== 'undefined') {
                    musicManager.playVentSound();
                }
                
                // Show vent options
                this.showVentMenu(vent);
            }
        }
    }
    
    showVentMenu(currentVent) {
        const menu = document.createElement('div');
        menu.className = 'overlay';
        menu.id = 'vent-menu';
        menu.innerHTML = `
            <div class="panel">
                <h3>🕳️ VENTS</h3>
                <div style="display: flex; gap: 15px; justify-content: center; margin: 20px 0; flex-wrap: wrap;">
                    ${currentVent.connections.map(ventId => {
                        const vent = VENTS.find(v => v.id === ventId);
                        const room = ROOMS[vent.room];
                        return `<button class="btn-secondary vent-option" data-vent="${ventId}">${room ? room.name : 'Unknown'}</button>`;
                    }).join('')}
                </div>
                <button class="btn-secondary" id="exit-vent-menu">STAY HERE</button>
            </div>
        `;
        document.body.appendChild(menu);
        
        menu.querySelectorAll('.vent-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetVent = VENTS.find(v => v.id === btn.dataset.vent);
                if (targetVent) {
                    this.localPlayer.x = targetVent.x;
                    this.localPlayer.y = targetVent.y;
                    this.localPlayer.sprite.x = targetVent.x;
                    this.localPlayer.sprite.y = targetVent.y;
                    this.localPlayer.nameText.x = targetVent.x;
                    this.localPlayer.nameText.y = targetVent.y + 42;
                    
                    if (typeof musicManager !== 'undefined') {
                        musicManager.playVentSound();
                    }
                }
                menu.remove();
            });
        });
        
        document.getElementById('exit-vent-menu').addEventListener('click', () => {
            this.localPlayer.inVent = false;
            this.localPlayer.sprite.setVisible(true);
            this.localPlayer.nameText.setVisible(true);
            menu.remove();
        });
    }
    
    killPlayer(killer, victim) {
        victim.isDead = true;
        victim.sprite.setTint(0x333333);
        victim.sprite.setAlpha(0);
        victim.nameText.setAlpha(0);
        
        // Create dead body
        const body = {
            playerId: victim.id,
            name: victim.name,
            color: victim.color,
            x: victim.x,
            y: victim.y,
            sprite: null
        };
        
        // Create proper Among Us style dead body sprite
        const graphics = this.scene.add.graphics();
        drawDeadBody(graphics, victim, 1);
        const key = `body_${victim.id}_${Date.now()}`;
        graphics.generateTexture(key, 60, 40);
        graphics.destroy();
        
        body.sprite = this.scene.add.sprite(victim.x, victim.y, key);
        body.sprite.setDepth(5);
        
        this.deadBodies.push(body);
        
        // Play kill sound
        if (typeof musicManager !== 'undefined') {
            musicManager.playKillSound();
        }
        
        // Show kill message if player did the kill (or in demo mode)
        if (killer.id === this.localPlayer.id || this.demoMode) {
            // Teleport killer to victim position
            killer.x = victim.x;
            killer.y = victim.y;
            killer.sprite.x = victim.x;
            killer.sprite.y = victim.y;
            killer.nameText.x = victim.x;
            killer.nameText.y = victim.y + 42;
            
            // Show kill message briefly
            const killMsg = getKillMessage(killer, victim);
            this.showKillMessage(killMsg);
        }
        
        // Kill flash effect
        if (this.localPlayer.id === killer.id || this.localPlayer.id === victim.id) {
            this.scene.cameras.main.flash(200, 255, 0, 0, true);
        }
    }
    
    showKillMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'kill-message';
        msgDiv.textContent = message;
        msgDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 1.2em;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2.5s forwards;
            text-shadow: 1px 1px 2px black;
        `;
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2500);
    }
    
    reportBody(reporter, body) {
        if (typeof musicManager !== 'undefined') {
            musicManager.playReportSound();
        }
        this.startMeeting('body', reporter, body);
    }
    
    callEmergencyMeeting() {
        this.canCallMeeting = false;
        if (typeof musicManager !== 'undefined') {
            musicManager.playMeetingStart();
        }
        this.startMeeting('emergency', this.localPlayer, null);
    }
    
    startMeeting(type, caller, body) {
        this.gameState = 'meeting';
        this.aiController.stop();
        
        if (typeof musicManager !== 'undefined') {
            musicManager.playMeetingStart();
        }
        
        // Clear dead bodies
        this.deadBodies.forEach(b => {
            if (b.sprite) b.sprite.destroy();
        });
        this.deadBodies = [];
        
        // Teleport all players back to spawn
        this.players.forEach((player, index) => {
            if (player.isDead) return;
            
            const spawn = SPAWN_POINTS[index % SPAWN_POINTS.length];
            player.x = spawn.x;
            player.y = spawn.y;
            player.sprite.x = spawn.x;
            player.sprite.y = spawn.y;
            player.nameText.x = spawn.x;
            player.nameText.y = spawn.y + 42;
            player.sprite.setVisible(true);
            player.nameText.setVisible(true);
            player.inVent = false;
        });
        
        // Show meeting screen
        const meetingScreen = document.getElementById('meeting-screen');
        const meetingTitle = document.getElementById('meeting-title');
        const meetingSubtitle = document.getElementById('meeting-subtitle');
        
        if (type === 'body') {
            meetingTitle.textContent = '☠️ DEAD BODY REPORTED';
            meetingSubtitle.textContent = `${caller.name} found ${body.name}'s body!`;
        } else {
            meetingTitle.textContent = '🚨 EMERGENCY MEETING';
            meetingSubtitle.textContent = `${caller.name} called an emergency meeting!`;
        }
        
        // Create voting cards
        this.createVotingCards();
        
        meetingScreen.classList.remove('hidden');
        
        // Start voting timer
        this.startVotingTimer();
        
        // In demo mode, auto-vote
        if (this.demoMode) {
            setTimeout(() => this.castVote('auto'), 3000 + Math.random() * 5000);
        }
    }
    
    createVotingCards() {
        this.votingGrid.innerHTML = '';
        this.votes = {};
        this.voteCounts = {};
        
        this.players.forEach(player => {
            this.voteCounts[player.id] = 0;
            
            const card = document.createElement('div');
            card.className = 'vote-card' + (player.isDead ? ' dead' : '');
            card.dataset.playerId = player.id;
            
            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            avatar.style.backgroundColor = hexToCSS(player.color);
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;
            
            const voteCount = document.createElement('div');
            voteCount.className = 'vote-count';
            voteCount.textContent = '';
            voteCount.id = `votes-${player.id}`;
            
            card.appendChild(avatar);
            card.appendChild(name);
            card.appendChild(voteCount);
            
            if (!player.isDead && !this.localPlayer.isDead && !this.demoMode) {
                card.addEventListener('click', () => this.selectVote(player.id));
            }
            
            this.votingGrid.appendChild(card);
        });
    }
    
    selectVote(playerId) {
        if (this.localPlayer.isDead) return;
        
        // Remove previous selection
        document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
        
        // Select this card
        const card = document.querySelector(`.vote-card[data-player-id="${playerId}"]`);
        if (card && !card.classList.contains('dead')) {
            card.classList.add('selected');
            this.selectedVote = playerId;
        }
    }
    
    castVote(vote) {
        if (this.localPlayer.isDead && vote !== 'auto') return;
        
        // In demo mode or auto, determine vote automatically
        let finalVote;
        if (vote === 'auto' || this.demoMode) {
            const alive = this.players.filter(p => !p.isDead);
            if (Math.random() < 0.2) {
                finalVote = 'skip';
            } else {
                finalVote = alive[Math.floor(Math.random() * alive.length)].id;
            }
        } else {
            finalVote = vote || this.selectedVote || 'skip';
        }
        
        this.votes[this.localPlayer.id] = finalVote;
        
        // Bots vote
        this.players.forEach(player => {
            if (player.isPlayer || player.isDead) return;
            
            const botVote = this.aiController.getVote(player);
            this.votes[player.id] = botVote;
            
            if (botVote !== 'skip') {
                this.voteCounts[botVote] = (this.voteCounts[botVote] || 0) + 1;
            }
        });
        
        // Add player's vote
        if (finalVote !== 'skip') {
            this.voteCounts[finalVote] = (this.voteCounts[finalVote] || 0) + 1;
        }
        
        // Show vote counts
        Object.entries(this.voteCounts).forEach(([id, count]) => {
            const voteEl = document.getElementById(`votes-${id}`);
            if (voteEl && count > 0) {
                voteEl.textContent = `${count} vote${count > 1 ? 's' : ''}`;
            }
        });
        
        // Disable voting
        document.querySelectorAll('.vote-card').forEach(c => {
            c.style.pointerEvents = 'none';
        });
        document.getElementById('skip-vote-btn').disabled = true;
        
        // Process results after delay
        setTimeout(() => this.processVoteResults(), 3000);
    }
    
    startVotingTimer() {
        let timeLeft = this.votingTime;
        const timerEl = document.getElementById('vote-timer');
        const castEl = document.getElementById('votes-cast');
        
        this.voteTimerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `Voting ends in: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.voteTimerInterval);
                if (!this.votes[this.localPlayer.id]) {
                    this.castVote('skip');
                }
            }
        }, 1000);
    }
    
    processVoteResults() {
        clearInterval(this.voteTimerInterval);
        
        if (typeof musicManager !== 'undefined') {
            musicManager.playMeetingEnd();
        }
        
        // Find player with most votes
        let maxVotes = 0;
        let ejected = null;
        let tie = false;
        
        Object.entries(this.voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                ejected = this.players.find(p => p.id === id);
                tie = false;
            } else if (count === maxVotes && count > 0) {
                tie = true;
            }
        });
        
        // Hide meeting screen
        document.getElementById('meeting-screen').classList.add('hidden');
        
        // Show ejection
        this.showEjection(ejected, tie, maxVotes);
    }
    
    showEjection(ejected, tie, votes) {
        const ejectionScreen = document.getElementById('ejection-screen');
        const ejectedChar = document.getElementById('ejected-character');
        const ejectionText = document.getElementById('ejection-text');
        
        if (typeof musicManager !== 'undefined') {
            musicManager.playEjectSound();
        }
        
        if (tie || !ejected || votes === 0) {
            ejectedChar.style.display = 'none';
            ejectionText.innerHTML = `
                <span style="font-size: 1.5em;">🤷</span><br>
                No one was ejected.<br>
                <span style="color: #888; font-size: 0.8em;">
                    (Everyone was too busy pointing fingers)
                </span>
            `;
        } else {
            ejectedChar.style.display = 'block';
            ejectedChar.style.backgroundColor = hexToCSS(ejected.color);
            ejectedChar.style.width = '80px';
            ejectedChar.style.height = '100px';
            ejectedChar.style.borderRadius = '50% 50% 40% 40%';
            
            // Eject the player
            ejected.isDead = true;
            ejected.sprite.setVisible(false);
            ejected.nameText.setVisible(false);
            
            // Reveal role
            const wasImpostor = ejected.isImpostor;
            const impostorCount = this.players.filter(p => p.isImpostor && !p.isDead).length;
            
            // Get custom ejection message
            const customMsg = getEjectionMessage(ejected, wasImpostor);
            
            ejectionText.innerHTML = `
                <strong style="font-size: 1.3em;">${customMsg}</strong><br><br>
                <span style="color: ${wasImpostor ? '#ff4757' : '#2ed573'}; font-size: 1.2em;">
                    ${wasImpostor ? '🔴 They were An Impostor.' : '🟢 They were not An Impostor.'}
                </span><br>
                <span style="font-size: 0.9em; color: #888; margin-top: 10px; display: block;">
                    ${impostorCount} Impostor${impostorCount !== 1 ? 's' : ''} remain${impostorCount === 1 ? 's' : ''}.
                </span>
            `;
        }
        
        ejectionScreen.classList.remove('hidden');
        
        setTimeout(() => {
            ejectionScreen.classList.add('hidden');
            this.resumeGame();
        }, 5000);
    }
    
    resumeGame() {
        if (!this.checkGameEnd()) {
            this.gameState = 'playing';
            this.aiController.start();
        }
    }
    
    completeTask(taskId) {
        const task = this.localPlayer.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            task.completed = true;
            this.completedTasks++;
            this.updateTaskList();
            
            if (typeof musicManager !== 'undefined') {
                musicManager.playTaskCompleteSound();
            }
        }
    }
    
    onBotTaskComplete(bot, task) {
        this.completedTasks++;
    }
    
    moveBot(bot, vx, vy) {
        const newX = bot.x + vx;
        const newY = bot.y + vy;
        
        if (isWalkable(newX, newY, this.walkableGrid)) {
            bot.x = newX;
            bot.y = newY;
            bot.sprite.x = newX;
            bot.sprite.y = newY;
            bot.nameText.x = newX;
            bot.nameText.y = newY + 42;
            
            // Walking animation
            bot.walkFrame = (bot.walkFrame + 0.15) % (Math.PI * 2);
            const bobAmount = Math.sin(bot.walkFrame) * 2;
            bot.sprite.y = newY + bobAmount;
            
            if (vx !== 0) {
                bot.sprite.setFlipX(vx < 0);
            }
        }
    }
    
    ventPlayer(bot, targetVent) {
        bot.x = targetVent.x;
        bot.y = targetVent.y;
        bot.sprite.x = targetVent.x;
        bot.sprite.y = targetVent.y;
        bot.nameText.x = targetVent.x;
        bot.nameText.y = targetVent.y + 42;
    }
    
    openSabotageMenu() {
        if (!this.localPlayer.isImpostor) return;
        document.getElementById('sabotage-menu').classList.remove('hidden');
    }
    
    closeSabotageMenu() {
        document.getElementById('sabotage-menu').classList.add('hidden');
    }
    
    triggerSabotage(type) {
        this.sabotageActive = type;
        
        if (type === 'lights') {
            this.sabotageTimer = 45;
            // Reduce vision
            const overlay = document.createElement('div');
            overlay.id = 'vision-overlay';
            overlay.className = 'active';
            document.body.appendChild(overlay);
        } else if (type === 'reactor' || type === 'o2') {
            this.sabotageTimer = 30;
        } else if (type === 'comms') {
            this.sabotageTimer = 60;
            // Disable task list
            document.getElementById('task-list').style.display = 'none';
        }
        
        // Show alert
        const alert = document.createElement('div');
        alert.className = 'sabotage-alert';
        alert.id = 'sabotage-alert';
        alert.textContent = `⚠️ ${type.toUpperCase()} SABOTAGED - Fix in ${this.sabotageTimer}s!`;
        document.body.appendChild(alert);
    }
    
    updateSabotage() {
        if (!this.sabotageActive) return;
        
        this.sabotageTimer -= 1/60; // Assuming 60fps
        
        const alert = document.getElementById('sabotage-alert');
        if (alert) {
            alert.textContent = `⚠️ ${this.sabotageActive.toUpperCase()} SABOTAGED - Fix in ${Math.ceil(this.sabotageTimer)}s!`;
        }
        
        // Check if near fix location
        const fixLoc = SABOTAGE_TARGETS[this.sabotageActive];
        if (fixLoc && !this.demoMode) {
            const dx = fixLoc.x - this.localPlayer.x;
            const dy = fixLoc.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50 && (this.keys['KeyE'] || this.keys['Space'])) {
                this.fixSabotage();
            }
        }
        
        // Auto-fix in demo mode
        if (this.demoMode && this.sabotageTimer < 10) {
            this.fixSabotage();
        }
        
        // Critical sabotage timeout
        if ((this.sabotageActive === 'reactor' || this.sabotageActive === 'o2') && this.sabotageTimer <= 0) {
            this.endGame('impostor', 'Critical systems failure!');
        }
    }
    
    fixSabotage() {
        // Remove effects
        const overlay = document.getElementById('vision-overlay');
        if (overlay) overlay.remove();
        
        const alert = document.getElementById('sabotage-alert');
        if (alert) alert.remove();
        
        document.getElementById('task-list').style.display = '';
        
        this.sabotageActive = null;
        this.sabotageTimer = 0;
    }
    
    checkGameEnd() {
        const aliveCrewmates = this.players.filter(p => !p.isImpostor && !p.isDead).length;
        const aliveImpostors = this.players.filter(p => p.isImpostor && !p.isDead).length;
        
        // Impostors win if equal or more than crewmates
        if (aliveImpostors >= aliveCrewmates) {
            this.endGame('impostor', 'Impostors eliminated all crewmates!');
            return true;
        }
        
        // Crewmates win if all impostors ejected
        if (aliveImpostors === 0) {
            this.endGame('crewmate', 'All impostors have been ejected!');
            return true;
        }
        
        // Crewmates win if all tasks complete
        if (this.completedTasks >= this.totalTasks && this.totalTasks > 0) {
            this.endGame('crewmate', 'All tasks completed!');
            return true;
        }
        
        return false;
    }
    
    endGame(winner, reason) {
        this.gameState = 'gameover';
        this.aiController.stop();
        
        if (typeof musicManager !== 'undefined') {
            musicManager.playVictory(winner === 'impostor');
        }
        
        const gameOverScreen = document.getElementById('game-over-screen');
        const title = document.getElementById('game-over-title');
        const text = document.getElementById('game-over-text');
        const roles = document.getElementById('game-over-roles');
        
        const playerWon = (winner === 'impostor' && this.localPlayer.isImpostor) ||
                         (winner === 'crewmate' && !this.localPlayer.isImpostor);
        
        title.textContent = this.demoMode ? (winner === 'crewmate' ? 'CREWMATES WIN' : 'IMPOSTORS WIN') : (playerWon ? 'VICTORY' : 'DEFEAT');
        title.className = winner === 'crewmate' ? 'crewmate-win' : 'impostor-win';
        
        text.textContent = reason;
        
        // Show all roles
        roles.innerHTML = '';
        this.players.forEach(player => {
            const reveal = document.createElement('div');
            reveal.className = 'role-reveal';
            reveal.innerHTML = `
                <div class="role-avatar" style="background-color: ${hexToCSS(player.color)}"></div>
                <div>
                    <div class="role-name">${player.name}</div>
                    <div class="role-type ${player.isImpostor ? 'impostor' : 'crewmate'}">
                        ${player.isImpostor ? 'Impostor' : 'Crewmate'}
                    </div>
                </div>
            `;
            roles.appendChild(reveal);
        });
        
        document.getElementById('game-hud').classList.add('hidden');
        
        // Remove demo indicator
        const demoIndicator = document.getElementById('demo-indicator');
        if (demoIndicator) demoIndicator.remove();
        
        gameOverScreen.classList.remove('hidden');
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            location.reload();
        });
    }
}
