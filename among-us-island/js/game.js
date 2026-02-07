// Main Game Class

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
    }
    
    init(config) {
        this.playerCount = config.playerCount || 8;
        this.impostorCount = config.impostorCount || 2;
        this.playerName = config.playerName || 'Guest';
        
        this.walkableGrid = createWalkableGrid();
        
        // Initialize Phaser
        const gameConfig = {
            type: Phaser.AUTO,
            width: Math.min(1200, window.innerWidth),
            height: Math.min(800, window.innerHeight),
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
        
        // Setup UI
        this.setupUI();
        
        // Start game
        this.startGame();
    }
    
    createMap() {
        const graphics = this.scene.add.graphics();
        
        // Draw ocean background
        graphics.fillStyle(0x1a5276, 1);
        graphics.fillRect(-500, -500, MAP_CONFIG.width + 1000, MAP_CONFIG.height + 1000);
        
        // Draw island shape (rough ellipse)
        graphics.fillStyle(0x2d5a27, 1);
        graphics.fillEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, MAP_CONFIG.width * 0.9, MAP_CONFIG.height * 0.9);
        
        // Draw beach
        graphics.lineStyle(30, 0xf4d03f, 0.6);
        graphics.strokeEllipse(MAP_CONFIG.width / 2, MAP_CONFIG.height / 2, MAP_CONFIG.width * 0.88, MAP_CONFIG.height * 0.88);
        
        // Draw rooms
        Object.values(ROOMS).forEach(room => {
            // Room floor
            graphics.fillStyle(room.color, 1);
            graphics.fillRoundedRect(room.x, room.y, room.width, room.height, 10);
            
            // Room border
            graphics.lineStyle(3, 0x333333, 1);
            graphics.strokeRoundedRect(room.x, room.y, room.width, room.height, 10);
            
            // Special patterns
            if (room.pattern === 'stripes') {
                // Temple gold stripes
                graphics.fillStyle(0xffd700, 1);
                for (let i = 0; i < room.height; i += 20) {
                    if ((i / 20) % 2 === 0) {
                        graphics.fillRect(room.x + 5, room.y + i, room.width - 10, 10);
                    }
                }
            }
            
            // Room label
            const text = this.scene.add.text(
                room.x + room.width / 2,
                room.y + 15,
                room.name,
                { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }
            );
            text.setOrigin(0.5, 0);
            text.setAlpha(0.7);
        });
        
        // Draw task locations
        TASK_LOCATIONS.forEach(task => {
            graphics.fillStyle(0xffff00, 0.8);
            graphics.fillCircle(task.x, task.y, 15);
            graphics.lineStyle(2, 0x000000, 1);
            graphics.strokeCircle(task.x, task.y, 15);
            
            // Task icon
            const icon = this.scene.add.text(task.x, task.y, '!', {
                fontSize: '16px',
                color: '#000000',
                fontStyle: 'bold'
            });
            icon.setOrigin(0.5);
        });
        
        // Draw vents
        VENTS.forEach(vent => {
            graphics.fillStyle(0x333333, 1);
            graphics.fillRect(vent.x - 25, vent.y - 15, 50, 30);
            graphics.lineStyle(2, 0x666666, 1);
            graphics.strokeRect(vent.x - 25, vent.y - 15, 50, 30);
            
            // Vent grate pattern
            for (let i = -20; i <= 20; i += 10) {
                graphics.lineStyle(2, 0x555555, 1);
                graphics.lineBetween(vent.x + i, vent.y - 12, vent.x + i, vent.y + 12);
            }
        });
        
        // Draw emergency button
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 30);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, 30);
        
        const buttonText = this.scene.add.text(EMERGENCY_BUTTON.x, EMERGENCY_BUTTON.y, '🚨', {
            fontSize: '24px'
        });
        buttonText.setOrigin(0.5);
        
        // Draw sabotage fix locations
        Object.entries(SABOTAGE_TARGETS).forEach(([type, loc]) => {
            graphics.fillStyle(0xff4757, 0.5);
            graphics.fillCircle(loc.x, loc.y, 20);
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
                isPlayer: char.isPlayer || false,
                isImpostor: char.isImpostor || false,
                isDead: false,
                x: spawn.x + (Math.random() - 0.5) * 40,
                y: spawn.y + (Math.random() - 0.5) * 40,
                sprite: null,
                nameText: null,
                tasks: [],
                vx: 0,
                vy: 0,
                inVent: false
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
        
        // Bean body
        graphics.fillStyle(player.color, 1);
        graphics.fillEllipse(0, 5, 30, 40);
        
        // Visor
        graphics.fillStyle(0x8ecae6, 1);
        graphics.fillEllipse(10, -5, 18, 12);
        
        // Backpack
        graphics.fillStyle(player.color, 1);
        graphics.fillRoundedRect(-20, -5, 10, 25, 3);
        
        // Create texture from graphics
        const key = `player_${player.id}`;
        graphics.generateTexture(key, 50, 60);
        graphics.destroy();
        
        // Create sprite
        player.sprite = this.scene.add.sprite(player.x, player.y, key);
        player.sprite.setOrigin(0.5, 0.7);
        player.sprite.setDepth(10);
        
        // Name text
        player.nameText = this.scene.add.text(player.x, player.y + 35, player.name, {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        player.nameText.setOrigin(0.5);
        player.nameText.setDepth(11);
    }
    
    setupCamera() {
        this.scene.cameras.main.setBounds(0, 0, MAP_CONFIG.width, MAP_CONFIG.height);
        
        if (this.localPlayer) {
            this.scene.cameras.main.startFollow(this.localPlayer.sprite, true, 0.1, 0.1);
        }
    }
    
    setupInput() {
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
        
        // Show role reveal
        this.showRoleReveal();
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
    
    updateTaskList() {
        if (!this.localPlayer) return;
        
        this.taskList.innerHTML = '';
        this.localPlayer.tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.name;
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
        
        this.updateLocalPlayer();
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
            this.localPlayer.nameText.y = newY + 35;
            
            // Flip sprite based on direction
            if (dx !== 0) {
                this.localPlayer.sprite.setFlipX(dx < 0);
            }
        }
    }
    
    updateUI() {
        // Update task progress bar
        const progress = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
        this.taskBar.style.width = progress + '%';
        
        // Update action buttons visibility
        this.updateActionButtons();
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
        if (!this.localPlayer.isImpostor) return;
        if (Date.now() - this.lastKillTime < this.killCooldown * 1000) return;
        
        const target = this.getKillTarget();
        if (target) {
            this.killPlayer(this.localPlayer, target);
            this.lastKillTime = Date.now();
        }
    }
    
    handleReportAction() {
        const body = this.getNearbyBody();
        if (body) {
            this.reportBody(this.localPlayer, body);
        }
    }
    
    handleVentAction() {
        if (!this.localPlayer.isImpostor) return;
        
        if (this.localPlayer.inVent) {
            // Exit vent
            this.localPlayer.inVent = false;
            this.localPlayer.sprite.setVisible(true);
            this.localPlayer.nameText.setVisible(true);
        } else {
            const vent = this.getNearbyVent();
            if (vent) {
                // Enter vent
                this.localPlayer.inVent = true;
                this.localPlayer.sprite.setVisible(false);
                this.localPlayer.nameText.setVisible(false);
                
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
                <div style="display: flex; gap: 15px; justify-content: center; margin: 20px 0;">
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
                    this.localPlayer.nameText.y = targetVent.y + 35;
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
        
        // Create body sprite
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(victim.color, 1);
        graphics.fillEllipse(0, 0, 30, 20);
        const key = `body_${victim.id}`;
        graphics.generateTexture(key, 40, 30);
        graphics.destroy();
        
        body.sprite = this.scene.add.sprite(victim.x, victim.y, key);
        body.sprite.setDepth(5);
        
        // Bone sprite
        const bone = this.scene.add.text(victim.x + 15, victim.y - 5, '🦴', { fontSize: '16px' });
        bone.setDepth(6);
        
        this.deadBodies.push(body);
        
        // Kill animation
        if (killer.id === this.localPlayer.id) {
            // Teleport killer to victim position
            killer.x = victim.x;
            killer.y = victim.y;
            killer.sprite.x = victim.x;
            killer.sprite.y = victim.y;
            killer.nameText.x = victim.x;
            killer.nameText.y = victim.y + 35;
        }
    }
    
    reportBody(reporter, body) {
        this.startMeeting('body', reporter, body);
    }
    
    callEmergencyMeeting() {
        this.canCallMeeting = false;
        this.startMeeting('emergency', this.localPlayer, null);
    }
    
    startMeeting(type, caller, body) {
        this.gameState = 'meeting';
        this.aiController.stop();
        
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
            player.nameText.y = spawn.y + 35;
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
            
            if (!player.isDead && !this.localPlayer.isDead) {
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
        if (this.localPlayer.isDead) return;
        
        const finalVote = vote || this.selectedVote || 'skip';
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
        
        if (tie || !ejected || votes === 0) {
            ejectedChar.style.display = 'none';
            ejectionText.textContent = 'No one was ejected. (Skipped)';
        } else {
            ejectedChar.style.display = 'block';
            ejectedChar.style.backgroundColor = hexToCSS(ejected.color);
            ejectedChar.style.width = '80px';
            ejectedChar.style.height = '100px';
            ejectedChar.style.borderRadius = '50% 50% 50% 50%';
            
            // Eject the player
            ejected.isDead = true;
            ejected.sprite.setVisible(false);
            ejected.nameText.setVisible(false);
            
            // Reveal role
            const wasImpostor = ejected.isImpostor;
            const impostorCount = this.players.filter(p => p.isImpostor && !p.isDead).length;
            
            ejectionText.innerHTML = `
                <strong>${ejected.name}</strong> was ejected.<br>
                <span style="color: ${wasImpostor ? '#ff4757' : '#2ed573'}">
                    ${wasImpostor ? 'They were An Impostor.' : 'They were not An Impostor.'}
                </span><br>
                <span style="font-size: 0.8em; color: #888;">
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
            bot.nameText.y = newY + 35;
            
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
        bot.nameText.y = targetVent.y + 35;
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
        if (fixLoc) {
            const dx = fixLoc.x - this.localPlayer.x;
            const dy = fixLoc.y - this.localPlayer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50 && (this.keys['KeyE'] || this.keys['Space'])) {
                this.fixSabotage();
            }
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
        
        const gameOverScreen = document.getElementById('game-over-screen');
        const title = document.getElementById('game-over-title');
        const text = document.getElementById('game-over-text');
        const roles = document.getElementById('game-over-roles');
        
        const playerWon = (winner === 'impostor' && this.localPlayer.isImpostor) ||
                         (winner === 'crewmate' && !this.localPlayer.isImpostor);
        
        title.textContent = playerWon ? 'VICTORY' : 'DEFEAT';
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
        gameOverScreen.classList.remove('hidden');
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            location.reload();
        });
    }
}
