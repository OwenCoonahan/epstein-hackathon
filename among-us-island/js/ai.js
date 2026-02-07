// AI Bot System

class AIController {
    constructor(game) {
        this.game = game;
        this.botStates = new Map();
        this.updateInterval = null;
    }
    
    initialize(bots) {
        bots.forEach(bot => {
            this.botStates.set(bot.id, {
                state: 'idle',
                target: null,
                path: [],
                waitTime: 0,
                taskIndex: 0,
                suspicion: new Map(),
                lastKillTime: 0,
                ventCooldown: 0
            });
        });
    }
    
    start() {
        this.updateInterval = setInterval(() => this.update(), 100);
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    update() {
        if (this.game.gameState !== 'playing') return;
        
        this.game.players.forEach(player => {
            if (player.isPlayer || player.isDead) return;
            
            const state = this.botStates.get(player.id);
            if (!state) return;
            
            if (player.isImpostor) {
                this.updateImpostorAI(player, state);
            } else {
                this.updateCrewmateAI(player, state);
            }
        });
    }
    
    updateCrewmateAI(bot, state) {
        // Reduce wait time
        if (state.waitTime > 0) {
            state.waitTime -= 100;
            return;
        }
        
        switch (state.state) {
            case 'idle':
                this.pickNextTask(bot, state);
                break;
                
            case 'moving':
                this.moveToTarget(bot, state);
                break;
                
            case 'doing_task':
                this.doTask(bot, state);
                break;
                
            case 'reporting':
                this.reportBody(bot, state);
                break;
        }
        
        // Check for bodies
        if (state.state !== 'reporting') {
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
            state.waitTime -= 100;
        }
        state.ventCooldown = Math.max(0, state.ventCooldown - 100);
        
        const killOnCooldown = Date.now() - state.lastKillTime < this.game.killCooldown * 1000;
        
        switch (state.state) {
            case 'idle':
                // Decide what to do
                if (!killOnCooldown && Math.random() < 0.3) {
                    // Look for kill target
                    const target = this.findKillTarget(bot);
                    if (target) {
                        state.state = 'hunting';
                        state.target = target;
                        return;
                    }
                }
                
                // Fake tasks or wander
                if (Math.random() < 0.6) {
                    this.pickFakeTask(bot, state);
                } else {
                    this.wander(bot, state);
                }
                break;
                
            case 'hunting':
                this.huntTarget(bot, state);
                break;
                
            case 'moving':
                this.moveToTarget(bot, state);
                break;
                
            case 'faking_task':
                state.waitTime = 2000 + Math.random() * 3000;
                state.state = 'idle';
                break;
                
            case 'venting':
                this.useVent(bot, state);
                break;
        }
        
        // Random chance to use vent
        if (state.state === 'idle' && state.ventCooldown <= 0 && Math.random() < 0.02) {
            const nearbyVent = this.findNearbyVent(bot);
            if (nearbyVent && !this.areOtherPlayersNearby(bot)) {
                state.state = 'venting';
                state.target = nearbyVent;
            }
        }
    }
    
    pickNextTask(bot, state) {
        const tasks = bot.tasks.filter(t => !t.completed);
        if (tasks.length === 0) {
            this.wander(bot, state);
            return;
        }
        
        const task = tasks[state.taskIndex % tasks.length];
        state.taskIndex++;
        
        const taskLocation = TASK_LOCATIONS.find(t => t.id === task.id);
        if (taskLocation) {
            state.target = { x: taskLocation.x, y: taskLocation.y };
            state.currentTask = task;
            state.state = 'moving';
        }
    }
    
    pickFakeTask(bot, state) {
        const taskLocation = TASK_LOCATIONS[Math.floor(Math.random() * TASK_LOCATIONS.length)];
        state.target = { x: taskLocation.x, y: taskLocation.y };
        state.state = 'moving';
        state.afterMove = 'faking_task';
    }
    
    wander(bot, state) {
        // Pick a random room to walk to
        const rooms = Object.values(ROOMS);
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        state.target = {
            x: room.x + Math.random() * room.width,
            y: room.y + Math.random() * room.height
        };
        state.state = 'moving';
        state.afterMove = 'idle';
    }
    
    moveToTarget(bot, state) {
        if (!state.target) {
            state.state = 'idle';
            return;
        }
        
        const dx = state.target.x - bot.x;
        const dy = state.target.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
            // Reached target
            if (state.afterMove) {
                state.state = state.afterMove;
                state.afterMove = null;
            } else if (state.currentTask) {
                state.state = 'doing_task';
            } else {
                state.state = 'idle';
                state.waitTime = 500;
            }
            return;
        }
        
        // Move towards target
        const speed = bot.isImpostor && state.state === 'hunting' ? 3.5 : 3;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
    }
    
    doTask(bot, state) {
        // Simulate doing task
        state.waitTime = 3000 + Math.random() * 2000;
        
        if (state.currentTask) {
            state.currentTask.completed = true;
            this.game.onBotTaskComplete(bot, state.currentTask);
            state.currentTask = null;
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
                this.game.killPlayer(bot, state.target);
                state.lastKillTime = Date.now();
                state.state = 'idle';
                state.waitTime = 1000;
                
                // Maybe vent away
                if (Math.random() < 0.5) {
                    const nearbyVent = this.findNearbyVent(bot);
                    if (nearbyVent) {
                        state.state = 'venting';
                        state.target = nearbyVent;
                    }
                }
                return;
            }
        }
        
        // Move towards target
        const speed = 3.5;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.game.moveBot(bot, vx, vy);
        
        // Give up if chase is too long or others nearby
        if (this.areOtherPlayersNearby(bot, state.target)) {
            state.state = 'idle';
        }
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
            const dx = c.x - bot.x;
            const dy = c.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist && dist < 400) {
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
            
            const dx = p.x - bot.x;
            const dy = p.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            return dist < 200;
        });
    }
    
    findNearbyBody(bot) {
        const bodies = this.game.deadBodies || [];
        
        for (const body of bodies) {
            const dx = body.x - bot.x;
            const dy = body.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                return body;
            }
        }
        
        return null;
    }
    
    reportBody(bot, state) {
        if (state.target) {
            this.game.reportBody(bot, state.target);
        }
        state.state = 'idle';
        state.target = null;
    }
    
    findNearbyVent(bot) {
        for (const vent of VENTS) {
            const dx = vent.x - bot.x;
            const dy = vent.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 80) {
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
        
        // Pick random connected vent
        const targetVentId = state.target.connections[
            Math.floor(Math.random() * state.target.connections.length)
        ];
        const targetVent = VENTS.find(v => v.id === targetVentId);
        
        if (targetVent) {
            // Teleport to vent
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
            
            if (Math.random() < 0.3) {
                return 'skip';
            }
            
            if (nonImpostors.length > 0) {
                return nonImpostors[Math.floor(Math.random() * nonImpostors.length)].id;
            }
            return 'skip';
        }
        
        // Crewmates vote based on suspicion
        // If a body was reported, vote for players who were nearby
        // Otherwise vote somewhat randomly with slight bias against impostors
        
        const candidates = alivePlayers.filter(p => p.id !== bot.id);
        
        if (Math.random() < 0.2) {
            return 'skip';
        }
        
        // Slight bias towards actual impostors (simulates good detective work sometimes)
        const weights = candidates.map(c => {
            let weight = 1;
            if (c.isImpostor && Math.random() < 0.4) weight = 3;
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
