// Enhanced AI Bot System with Auto-Movement and Demo Mode

class AIController {
    constructor(game) {
        this.game = game;
        this.botStates = new Map();
        this.updateInterval = null;
        this.demoMode = false;
        this.demoMeetingTimer = 0;
        this.demoKillTimer = 0;
        this.lastDemoEvent = 0;
    }
    
    initialize(bots) {
        bots.forEach(bot => {
            this.botStates.set(bot.id, {
                state: 'idle',
                target: null,
                targetRoom: null,
                path: [],
                pathIndex: 0,
                waypoint: null,
                waitTime: 0,
                taskIndex: 0,
                suspicion: new Map(),
                lastKillTime: 0,
                ventCooldown: 0,
                animationPhase: 0,
                lastMoveDirection: { x: 0, y: 0 },
                pauseAtTaskTime: 0,
                walkSpeed: 2.5 + Math.random() * 1,
                personality: this.generatePersonality()
            });
        });
    }
    
    generatePersonality() {
        return {
            wanderProbability: 0.3 + Math.random() * 0.4,
            taskFocus: 0.4 + Math.random() * 0.5,
            suspicion: 0.2 + Math.random() * 0.6,
            aggression: 0.3 + Math.random() * 0.5, // For impostors
            ventUsage: 0.2 + Math.random() * 0.4    // For impostors
        };
    }
    
    setDemoMode(enabled) {
        this.demoMode = enabled;
        if (enabled) {
            this.demoMeetingTimer = 30000 + Math.random() * 30000; // 30-60 seconds
            this.demoKillTimer = 15000 + Math.random() * 20000;    // 15-35 seconds
        }
    }
    
    start() {
        this.updateInterval = setInterval(() => this.update(), 50); // 20 FPS for AI
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    update() {
        if (this.game.gameState !== 'playing') return;
        
        // Update all bots (including player in demo mode)
        this.game.players.forEach(player => {
            if (player.isDead) return;
            
            // In demo mode, control the player too
            if (player.isPlayer && !this.demoMode) return;
            
            const state = this.botStates.get(player.id);
            if (!state) {
                // Initialize state for player in demo mode
                if (player.isPlayer && this.demoMode) {
                    this.botStates.set(player.id, {
                        state: 'idle',
                        target: null,
                        targetRoom: null,
                        path: [],
                        pathIndex: 0,
                        waypoint: null,
                        waitTime: 0,
                        taskIndex: 0,
                        suspicion: new Map(),
                        lastKillTime: 0,
                        ventCooldown: 0,
                        animationPhase: 0,
                        lastMoveDirection: { x: 0, y: 0 },
                        pauseAtTaskTime: 0,
                        walkSpeed: 2.5,
                        personality: this.generatePersonality()
                    });
                }
                return;
            }
            
            // Update animation phase
            state.animationPhase = (state.animationPhase + 0.1) % (Math.PI * 2);
            
            if (player.isImpostor) {
                this.updateImpostorAI(player, state);
            } else {
                this.updateCrewmateAI(player, state);
            }
        });
        
        // Demo mode events
        if (this.demoMode) {
            this.updateDemoMode();
        }
        
        // Update music suspense level
        if (typeof musicManager !== 'undefined') {
            const aliveImpostors = this.game.players.filter(p => p.isImpostor && !p.isDead).length;
            const totalPlayers = this.game.players.filter(p => !p.isDead).length;
            const killsHappened = this.game.deadBodies.length;
            
            const suspense = Math.min(1, (killsHappened * 0.2) + (1 - totalPlayers / this.game.playerCount) * 0.3);
            musicManager.setSuspenseLevel(suspense);
        }
    }
    
    updateDemoMode() {
        const now = Date.now();
        
        // Demo kill timer
        this.demoKillTimer -= 50;
        if (this.demoKillTimer <= 0) {
            this.triggerDemoKill();
            this.demoKillTimer = 20000 + Math.random() * 25000;
        }
        
        // Demo meeting timer
        this.demoMeetingTimer -= 50;
        if (this.demoMeetingTimer <= 0 && this.game.deadBodies.length > 0) {
            this.triggerDemoMeeting();
            this.demoMeetingTimer = 40000 + Math.random() * 30000;
        }
    }
    
    triggerDemoKill() {
        const impostors = this.game.players.filter(p => p.isImpostor && !p.isDead);
        const crewmates = this.game.players.filter(p => !p.isImpostor && !p.isDead);
        
        if (impostors.length === 0 || crewmates.length === 0) return;
        
        // Pick random impostor and nearby crewmate
        const impostor = impostors[Math.floor(Math.random() * impostors.length)];
        
        // Find isolated crewmate
        let target = null;
        let bestScore = -1;
        
        crewmates.forEach(c => {
            const dist = this.getDistance(impostor, c);
            const nearbyPlayers = this.game.players.filter(p => 
                p.id !== impostor.id && p.id !== c.id && !p.isDead &&
                this.getDistance(p, c) < 200
            ).length;
            
            const score = (500 - dist) - (nearbyPlayers * 100);
            
            if (score > bestScore && dist < 400) {
                bestScore = score;
                target = c;
            }
        });
        
        if (target && bestScore > 0) {
            // Move impostor close and kill
            const state = this.botStates.get(impostor.id);
            if (state) {
                state.state = 'hunting';
                state.target = target;
            }
        }
    }
    
    triggerDemoMeeting() {
        const body = this.game.deadBodies[0];
        if (!body) return;
        
        // Find closest alive player to report
        const alivePlayers = this.game.players.filter(p => !p.isDead);
        let closest = null;
        let closestDist = Infinity;
        
        alivePlayers.forEach(p => {
            const dist = Math.sqrt(
                Math.pow(p.x - body.x, 2) + Math.pow(p.y - body.y, 2)
            );
            if (dist < closestDist) {
                closestDist = dist;
                closest = p;
            }
        });
        
        if (closest) {
            // Move them to body and report
            const state = this.botStates.get(closest.id);
            if (state) {
                state.state = 'moving_to_body';
                state.target = { x: body.x, y: body.y };
                state.bodyToReport = body;
            }
        }
    }
    
    updateCrewmateAI(bot, state) {
        // Reduce wait time
        if (state.waitTime > 0) {
            state.waitTime -= 50;
            // Small idle animation
            this.applyIdleAnimation(bot, state);
            return;
        }
        
        switch (state.state) {
            case 'idle':
                // Decide what to do based on personality
                if (Math.random() < state.personality.taskFocus && this.hasIncompleteTasks(bot)) {
                    this.pickNextTask(bot, state);
                } else {
                    this.startWandering(bot, state);
                }
                break;
                
            case 'wandering':
                this.updateWandering(bot, state);
                break;
                
            case 'moving':
            case 'moving_to_task':
                this.updateMovement(bot, state);
                break;
                
            case 'doing_task':
                this.doTask(bot, state);
                break;
                
            case 'moving_to_body':
                this.moveToBody(bot, state);
                break;
                
            case 'reporting':
                this.reportBody(bot, state);
                break;
        }
        
        // Check for bodies
        if (state.state !== 'reporting' && state.state !== 'moving_to_body') {
            const nearbyBody = this.findNearbyBody(bot);
            if (nearbyBody) {
                state.state = 'reporting';
                state.target = nearbyBody;
            }
        }
    }
    
    updateImpostorAI(bot, state) {
        // Reduce cooldowns
        if (state.waitTime > 0) {
            state.waitTime -= 50;
            this.applyIdleAnimation(bot, state);
        }
        state.ventCooldown = Math.max(0, state.ventCooldown - 50);
        
        const killOnCooldown = Date.now() - state.lastKillTime < this.game.killCooldown * 1000;
        
        switch (state.state) {
            case 'idle':
                // Decide what to do
                if (!killOnCooldown && Math.random() < state.personality.aggression * 0.5) {
                    const target = this.findKillTarget(bot);
                    if (target) {
                        state.state = 'hunting';
                        state.target = target;
                        return;
                    }
                }
                
                // Fake tasks or wander
                if (Math.random() < 0.5) {
                    this.pickFakeTask(bot, state);
                } else {
                    this.startWandering(bot, state);
                }
                break;
                
            case 'hunting':
                this.huntTarget(bot, state);
                break;
                
            case 'wandering':
                this.updateWandering(bot, state);
                
                // Opportunistic kill check
                if (!killOnCooldown) {
                    const target = this.findKillTarget(bot);
                    if (target && this.getDistance(bot, target) < this.game.killRange) {
                        if (!this.areOtherPlayersNearby(bot, target)) {
                            this.performKill(bot, target, state);
                        }
                    }
                }
                break;
                
            case 'moving':
            case 'moving_to_task':
                this.updateMovement(bot, state);
                break;
                
            case 'faking_task':
                state.waitTime = 2000 + Math.random() * 3000;
                state.state = 'idle';
                break;
                
            case 'venting':
                this.useVent(bot, state);
                break;
        }
        
        // Random vent usage
        if (state.state === 'idle' && state.ventCooldown <= 0 && 
            Math.random() < state.personality.ventUsage * 0.01) {
            const nearbyVent = this.findNearbyVent(bot);
            if (nearbyVent && !this.areOtherPlayersNearby(bot)) {
                state.state = 'venting';
                state.target = nearbyVent;
            }
        }
    }
    
    // Enhanced wandering with pathfinding
    startWandering(bot, state) {
        // Pick a random room to wander to
        const [targetRoomId, targetRoom] = getRandomRoom(true);
        
        // Get current room
        const currentRoom = getRoomAtPosition(bot.x, bot.y);
        const currentRoomId = currentRoom ? currentRoom.id : null;
        
        if (currentRoomId && currentRoomId !== targetRoomId) {
            // Use pathfinding
            const path = findPath(currentRoomId, targetRoomId);
            
            if (path && path.length > 1) {
                state.path = path;
                state.pathIndex = 1;
                state.state = 'wandering';
                state.targetRoom = targetRoomId;
                this.setWaypointFromPath(bot, state);
            } else {
                // Direct wander
                state.waypoint = {
                    x: targetRoom.x + Math.random() * targetRoom.width,
                    y: targetRoom.y + Math.random() * targetRoom.height
                };
                state.state = 'wandering';
            }
        } else {
            // Wander within current room
            if (currentRoom) {
                state.waypoint = {
                    x: currentRoom.x + 20 + Math.random() * (currentRoom.width - 40),
                    y: currentRoom.y + 20 + Math.random() * (currentRoom.height - 40)
                };
            } else {
                // Fallback to random position
                state.waypoint = {
                    x: bot.x + (Math.random() - 0.5) * 200,
                    y: bot.y + (Math.random() - 0.5) * 200
                };
            }
            state.state = 'wandering';
        }
    }
    
    setWaypointFromPath(bot, state) {
        if (state.pathIndex < state.path.length) {
            const roomId = state.path[state.pathIndex];
            const node = PATHFINDING_NODES[roomId];
            
            if (node) {
                // Add some randomness to waypoint within room
                const room = node.room;
                state.waypoint = {
                    x: room.x + 20 + Math.random() * (room.width - 40),
                    y: room.y + 20 + Math.random() * (room.height - 40)
                };
            }
        }
    }
    
    updateWandering(bot, state) {
        if (!state.waypoint) {
            state.state = 'idle';
            state.waitTime = 500 + Math.random() * 1000;
            return;
        }
        
        const dx = state.waypoint.x - bot.x;
        const dy = state.waypoint.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
            // Reached waypoint
            if (state.path && state.pathIndex < state.path.length - 1) {
                // Continue to next waypoint
                state.pathIndex++;
                this.setWaypointFromPath(bot, state);
                
                // Small pause at room transitions
                if (Math.random() < 0.3) {
                    state.waitTime = 300 + Math.random() * 500;
                }
            } else {
                // Reached destination
                state.state = 'idle';
                state.waitTime = 1000 + Math.random() * 2000;
                state.path = null;
            }
            return;
        }
        
        // Move towards waypoint with smooth movement
        const speed = state.walkSpeed;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
        state.lastMoveDirection = { x: vx, y: vy };
    }
    
    updateMovement(bot, state) {
        if (!state.waypoint && !state.target) {
            state.state = 'idle';
            return;
        }
        
        const target = state.waypoint || state.target;
        const dx = target.x - bot.x;
        const dy = target.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
            // Reached target
            if (state.path && state.pathIndex < state.path.length - 1) {
                state.pathIndex++;
                this.setWaypointFromPath(bot, state);
            } else if (state.state === 'moving_to_task') {
                state.state = 'doing_task';
            } else {
                state.state = 'idle';
                state.waitTime = 500;
            }
            return;
        }
        
        const speed = state.walkSpeed;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
        state.lastMoveDirection = { x: vx, y: vy };
    }
    
    moveToBody(bot, state) {
        if (!state.target) {
            state.state = 'idle';
            return;
        }
        
        const dx = state.target.x - bot.x;
        const dy = state.target.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
            // Close enough to report
            if (state.bodyToReport) {
                this.game.reportBody(bot, state.bodyToReport);
            }
            state.state = 'idle';
            return;
        }
        
        const speed = state.walkSpeed * 1.2; // Walk faster to body
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
    }
    
    hasIncompleteTasks(bot) {
        return bot.tasks.some(t => !t.completed && !t.fake);
    }
    
    pickNextTask(bot, state) {
        const tasks = bot.tasks.filter(t => !t.completed && !t.fake);
        if (tasks.length === 0) {
            this.startWandering(bot, state);
            return;
        }
        
        // Pick closest incomplete task
        let closestTask = null;
        let closestDist = Infinity;
        
        tasks.forEach(task => {
            const taskLocation = TASK_LOCATIONS.find(t => t.id === task.id);
            if (taskLocation) {
                const dist = this.getDistance(bot, taskLocation);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestTask = { ...task, ...taskLocation };
                }
            }
        });
        
        if (closestTask) {
            // Find path to task room
            const currentRoom = getRoomAtPosition(bot.x, bot.y);
            const taskRoom = getRoomAtPosition(closestTask.x, closestTask.y);
            
            if (currentRoom && taskRoom && currentRoom.id !== taskRoom.id) {
                const path = findPath(currentRoom.id, taskRoom.id);
                if (path) {
                    state.path = path;
                    state.pathIndex = 1;
                    this.setWaypointFromPath(bot, state);
                }
            }
            
            state.target = { x: closestTask.x, y: closestTask.y };
            state.currentTask = closestTask;
            state.state = 'moving_to_task';
        } else {
            this.startWandering(bot, state);
        }
    }
    
    pickFakeTask(bot, state) {
        const taskLocation = TASK_LOCATIONS[Math.floor(Math.random() * TASK_LOCATIONS.length)];
        state.target = { x: taskLocation.x, y: taskLocation.y };
        state.state = 'moving';
        state.afterMove = 'faking_task';
    }
    
    doTask(bot, state) {
        // Simulate doing task
        state.waitTime = 2500 + Math.random() * 2500;
        
        if (state.currentTask && !state.currentTask.fake) {
            state.currentTask.completed = true;
            this.game.onBotTaskComplete(bot, state.currentTask);
            state.currentTask = null;
            
            // Play sound
            if (typeof musicManager !== 'undefined') {
                musicManager.playTaskCompleteSound();
            }
        }
        
        state.state = 'idle';
    }
    
    huntTarget(bot, state) {
        if (!state.target || state.target.isDead) {
            state.state = 'idle';
            return;
        }
        
        const dx = state.target.x - bot.x;
        const dy = state.target.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if can kill
        if (dist < this.game.killRange) {
            const killOnCooldown = Date.now() - state.lastKillTime < this.game.killCooldown * 1000;
            
            if (!killOnCooldown && !this.areOtherPlayersNearby(bot, state.target)) {
                this.performKill(bot, state.target, state);
                return;
            }
        }
        
        // Move towards target
        const speed = state.walkSpeed + 0.5;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
        state.lastMoveDirection = { x: vx, y: vy };
        
        // Give up if chase is too long or others nearby
        if (this.areOtherPlayersNearby(bot, state.target)) {
            state.state = 'idle';
            state.waitTime = 1000;
        }
    }
    
    performKill(bot, target, state) {
        this.game.killPlayer(bot, target);
        state.lastKillTime = Date.now();
        state.state = 'idle';
        state.waitTime = 1000;
        
        // Play kill sound
        if (typeof musicManager !== 'undefined') {
            musicManager.playKillSound();
        }
        
        // Maybe vent away
        if (Math.random() < state.personality.ventUsage) {
            const nearbyVent = this.findNearbyVent(bot);
            if (nearbyVent) {
                state.state = 'venting';
                state.target = nearbyVent;
            }
        }
    }
    
    applyIdleAnimation(bot, state) {
        // Small breathing/idle animation
        const breathOffset = Math.sin(state.animationPhase) * 0.3;
        // This could affect sprite scale or position slightly
    }
    
    findKillTarget(bot) {
        const candidates = this.game.players.filter(p => 
            !p.isDead && 
            !p.isImpostor && 
            p.id !== bot.id
        );
        
        if (candidates.length === 0) return null;
        
        // Prefer isolated targets
        const isolated = candidates.filter(c => !this.areOtherPlayersNearby(c));
        const pool = isolated.length > 0 ? isolated : candidates;
        
        // Pick closest
        let closest = null;
        let closestDist = Infinity;
        
        pool.forEach(c => {
            const dist = this.getDistance(bot, c);
            
            if (dist < closestDist && dist < 500) {
                closest = c;
                closestDist = dist;
            }
        });
        
        return closest;
    }
    
    areOtherPlayersNearby(bot, exclude = null) {
        return this.game.players.some(p => {
            if (p.id === bot.id || p.isDead) return false;
            if (exclude && p.id === exclude.id) return false;
            
            const dist = this.getDistance(bot, p);
            return dist < 250;
        });
    }
    
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    findNearbyBody(bot) {
        const bodies = this.game.deadBodies || [];
        
        for (const body of bodies) {
            const dist = this.getDistance(bot, body);
            if (dist < 200) {
                return body;
            }
        }
        
        return null;
    }
    
    reportBody(bot, state) {
        if (state.target) {
            this.game.reportBody(bot, state.target);
            
            // Play report sound
            if (typeof musicManager !== 'undefined') {
                musicManager.playReportSound();
            }
        }
        state.state = 'idle';
        state.target = null;
    }
    
    findNearbyVent(bot) {
        for (const vent of VENTS) {
            const dx = vent.x - bot.x;
            const dy = vent.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
                return vent;
            }
        }
        return null;
    }
    
    useVent(bot, state) {
        if (!state.target || !state.target.connections) {
            state.state = 'idle';
            return;
        }
        
        // Play vent sound
        if (typeof musicManager !== 'undefined') {
            musicManager.playVentSound();
        }
        
        // Pick random connected vent
        const targetVentId = state.target.connections[
            Math.floor(Math.random() * state.target.connections.length)
        ];
        const targetVent = VENTS.find(v => v.id === targetVentId);
        
        if (targetVent) {
            this.game.ventPlayer(bot, targetVent);
            state.ventCooldown = 15000;
        }
        
        state.state = 'idle';
        state.waitTime = 1000;
    }
    
    // Voting AI
    getVote(bot) {
        const state = this.botStates.get(bot.id);
        const alivePlayers = this.game.players.filter(p => !p.isDead);
        
        if (bot.isImpostor) {
            // Impostors vote randomly for non-impostors or skip
            const nonImpostors = alivePlayers.filter(p => !p.isImpostor);
            
            if (Math.random() < 0.25) {
                return 'skip';
            }
            
            if (nonImpostors.length > 0) {
                return nonImpostors[Math.floor(Math.random() * nonImpostors.length)].id;
            }
            return 'skip';
        }
        
        // Crewmates vote based on suspicion
        const candidates = alivePlayers.filter(p => p.id !== bot.id);
        
        if (Math.random() < 0.15) {
            return 'skip';
        }
        
        // Bias towards actual impostors (simulates good detective work sometimes)
        const personality = state ? state.personality : { suspicion: 0.4 };
        
        const weights = candidates.map(c => {
            let weight = 1;
            if (c.isImpostor && Math.random() < personality.suspicion) weight = 3;
            return { player: c, weight };
        });
        
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const w of weights) {
            random -= w.weight;
            if (random <= 0) {
                return w.player.id;
            }
        }
        
        return candidates[0]?.id || 'skip';
    }
}
