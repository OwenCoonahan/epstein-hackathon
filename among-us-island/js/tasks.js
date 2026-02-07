// Task Mini-games System

class TaskManager {
    constructor(game) {
        this.game = game;
        this.taskScreen = document.getElementById('task-screen');
        this.taskTitle = document.getElementById('task-title');
        this.taskContent = document.getElementById('task-content');
        this.closeBtn = document.getElementById('close-task');
        
        this.currentTask = null;
        this.taskState = {};
        
        this.closeBtn.addEventListener('click', () => this.closeTask());
    }
    
    openTask(task) {
        this.currentTask = task;
        this.taskTitle.textContent = task.name;
        this.taskContent.innerHTML = '';
        
        // Generate appropriate mini-game
        switch (task.taskType) {
            case 'wires':
                this.createWiresTask();
                break;
            case 'swipe':
                this.createSwipeTask();
                break;
            case 'download':
            case 'upload':
                this.createDownloadTask(task.taskType);
                break;
            case 'reactor':
                this.createReactorTask();
                break;
            case 'fuel':
                this.createFuelTask();
                break;
            case 'trash':
                this.createTrashTask();
                break;
            case 'asteroids':
                this.createAsteroidsTask();
                break;
            case 'medscan':
                this.createMedscanTask();
                break;
            case 'leaves':
            case 'align':
                this.createSliderTask();
                break;
            case 'prime':
                this.createPrimeTask();
                break;
            case 'calibrate':
                this.createCalibrateTask();
                break;
            case 'keys':
                this.createKeysTask();
                break;
            default:
                this.createSimpleTask();
        }
        
        this.taskScreen.classList.remove('hidden');
    }
    
    closeTask() {
        this.taskScreen.classList.add('hidden');
        this.currentTask = null;
        this.taskState = {};
    }
    
    completeTask() {
        if (this.currentTask) {
            this.game.completeTask(this.currentTask.id);
            
            // Show completion animation
            this.taskContent.innerHTML = '<div style="color: #2ed573; font-size: 3em;">✓</div><p style="color: #2ed573;">Task Complete!</p>';
            
            setTimeout(() => this.closeTask(), 1000);
        }
    }
    
    // Wire connecting task
    createWiresTask() {
        const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff'];
        const shuffledRight = [...colors].sort(() => Math.random() - 0.5);
        
        this.taskState = {
            connections: {},
            required: 4,
            selectedLeft: null
        };
        
        const container = document.createElement('div');
        container.className = 'wires-container';
        
        const leftCol = document.createElement('div');
        leftCol.className = 'wire-column';
        
        const rightCol = document.createElement('div');
        rightCol.className = 'wire-column';
        
        colors.forEach((color, i) => {
            const leftNode = document.createElement('div');
            leftNode.className = 'wire-node';
            leftNode.style.backgroundColor = color;
            leftNode.dataset.color = color;
            leftNode.dataset.side = 'left';
            leftNode.dataset.index = i;
            leftNode.addEventListener('click', (e) => this.handleWireClick(e, 'left'));
            leftCol.appendChild(leftNode);
            
            const rightNode = document.createElement('div');
            rightNode.className = 'wire-node';
            rightNode.style.backgroundColor = shuffledRight[i];
            rightNode.dataset.color = shuffledRight[i];
            rightNode.dataset.side = 'right';
            rightNode.dataset.index = i;
            rightNode.addEventListener('click', (e) => this.handleWireClick(e, 'right'));
            rightCol.appendChild(rightNode);
        });
        
        container.appendChild(leftCol);
        container.appendChild(rightCol);
        this.taskContent.appendChild(container);
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Connect matching colors';
        this.taskContent.appendChild(instruction);
    }
    
    handleWireClick(e, side) {
        const node = e.target;
        const color = node.dataset.color;
        
        if (side === 'left') {
            // Select left node
            document.querySelectorAll('.wire-node').forEach(n => n.classList.remove('selected'));
            node.classList.add('selected');
            this.taskState.selectedLeft = color;
        } else if (this.taskState.selectedLeft) {
            // Connect to right node
            if (this.taskState.selectedLeft === color && !this.taskState.connections[color]) {
                this.taskState.connections[color] = true;
                
                // Mark as connected
                document.querySelectorAll(`.wire-node[data-color="${color}"]`).forEach(n => {
                    n.classList.add('connected');
                    n.classList.remove('selected');
                });
                
                this.taskState.selectedLeft = null;
                
                // Check completion
                if (Object.keys(this.taskState.connections).length >= this.taskState.required) {
                    setTimeout(() => this.completeTask(), 500);
                }
            }
        }
    }
    
    // Card swipe task
    createSwipeTask() {
        const container = document.createElement('div');
        container.style.cssText = 'width: 300px; height: 100px; background: #333; border-radius: 10px; position: relative; overflow: hidden;';
        
        const card = document.createElement('div');
        card.style.cssText = 'width: 80px; height: 60px; background: linear-gradient(135deg, #ffd700, #ffa500); border-radius: 5px; position: absolute; top: 20px; left: 10px; cursor: grab;';
        card.textContent = '💳';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.fontSize = '2em';
        
        let isDragging = false;
        let startX = 0;
        let startTime = 0;
        
        const handleStart = (e) => {
            isDragging = true;
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startTime = Date.now();
            card.style.cursor = 'grabbing';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const diff = currentX - startX;
            const newLeft = Math.max(10, Math.min(210, 10 + diff));
            card.style.left = newLeft + 'px';
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            card.style.cursor = 'grab';
            
            const currentLeft = parseInt(card.style.left);
            const duration = Date.now() - startTime;
            
            // Check if swipe was successful (right speed)
            if (currentLeft >= 200 && duration > 300 && duration < 1500) {
                this.completeTask();
            } else {
                // Reset card
                card.style.left = '10px';
                const feedback = document.createElement('p');
                feedback.style.color = duration < 300 ? '#ff4757' : '#ffa502';
                feedback.textContent = duration < 300 ? 'Too fast!' : (currentLeft < 200 ? 'Swipe further!' : 'Too slow!');
                feedback.style.marginTop = '10px';
                
                const existing = this.taskContent.querySelector('p:last-child');
                if (existing && existing.textContent !== 'Swipe card at moderate speed') {
                    existing.remove();
                }
                this.taskContent.appendChild(feedback);
            }
        };
        
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('touchstart', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        
        container.appendChild(card);
        this.taskContent.appendChild(container);
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Swipe card at moderate speed';
        this.taskContent.appendChild(instruction);
    }
    
    // Download/Upload progress task
    createDownloadTask(type) {
        const container = document.createElement('div');
        container.style.cssText = 'width: 100%; text-align: center;';
        
        const icon = document.createElement('div');
        icon.style.fontSize = '4em';
        icon.textContent = type === 'download' ? '📥' : '📤';
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = 'width: 250px; height: 30px; background: #333; border-radius: 15px; overflow: hidden; margin: 20px auto;';
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #4a9eff, #7f8cff); width: 0%; transition: width 0.1s;';
        progressBar.appendChild(progressFill);
        
        const percentText = document.createElement('p');
        percentText.style.color = '#4a9eff';
        percentText.style.fontSize = '1.5em';
        percentText.textContent = '0%';
        
        container.appendChild(icon);
        container.appendChild(progressBar);
        container.appendChild(percentText);
        this.taskContent.appendChild(container);
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => this.completeTask(), 500);
            }
            progressFill.style.width = progress + '%';
            percentText.textContent = Math.floor(progress) + '%';
        }, 100);
    }
    
    // Simon-says reactor task
    createReactorTask() {
        const sequence = [];
        const playerSequence = [];
        let showingSequence = false;
        
        for (let i = 0; i < 5; i++) {
            sequence.push(Math.floor(Math.random() * 9) + 1);
        }
        
        const display = document.createElement('div');
        display.className = 'keypad-display';
        display.textContent = '-----';
        
        const keypad = document.createElement('div');
        keypad.className = 'keypad-container';
        
        const buttons = [];
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'keypad-btn';
            btn.textContent = i;
            btn.dataset.num = i;
            btn.addEventListener('click', () => {
                if (showingSequence) return;
                
                playerSequence.push(i);
                btn.style.background = '#4a9eff';
                setTimeout(() => btn.style.background = '', 200);
                
                // Check sequence
                const currentIndex = playerSequence.length - 1;
                if (playerSequence[currentIndex] !== sequence[currentIndex]) {
                    // Wrong!
                    display.textContent = 'ERROR';
                    display.style.color = '#ff4757';
                    playerSequence.length = 0;
                    setTimeout(() => {
                        display.style.color = '#0f0';
                        showSequence();
                    }, 1000);
                } else if (playerSequence.length === sequence.length) {
                    // Complete!
                    display.textContent = 'OK';
                    setTimeout(() => this.completeTask(), 500);
                } else {
                    display.textContent = '*'.repeat(playerSequence.length) + '-'.repeat(5 - playerSequence.length);
                }
            });
            keypad.appendChild(btn);
            buttons.push(btn);
        }
        
        this.taskContent.appendChild(display);
        this.taskContent.appendChild(keypad);
        
        const showSequence = () => {
            showingSequence = true;
            display.textContent = 'WATCH';
            
            let i = 0;
            const showNext = () => {
                if (i < sequence.length) {
                    const btn = buttons[sequence[i] - 1];
                    btn.style.background = '#2ed573';
                    setTimeout(() => {
                        btn.style.background = '';
                        i++;
                        setTimeout(showNext, 300);
                    }, 500);
                } else {
                    showingSequence = false;
                    display.textContent = '-----';
                }
            };
            setTimeout(showNext, 500);
        };
        
        showSequence();
    }
    
    // Fuel gauge task
    createFuelTask() {
        const container = document.createElement('div');
        container.style.cssText = 'text-align: center;';
        
        const gauge = document.createElement('div');
        gauge.style.cssText = 'width: 60px; height: 200px; background: #333; border-radius: 10px; margin: 0 auto 20px; position: relative; overflow: hidden;';
        
        const fuel = document.createElement('div');
        fuel.style.cssText = 'position: absolute; bottom: 0; width: 100%; background: linear-gradient(to top, #ff4757, #ffa502, #2ed573); height: 0%;';
        gauge.appendChild(fuel);
        
        const target = document.createElement('div');
        target.style.cssText = 'position: absolute; left: -10px; right: -10px; height: 3px; background: #fff; top: 20%;';
        gauge.appendChild(target);
        
        let filling = false;
        
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = 'HOLD TO FILL';
        
        let fillLevel = 0;
        let fillInterval;
        
        const startFill = () => {
            filling = true;
            fillInterval = setInterval(() => {
                fillLevel = Math.min(100, fillLevel + 2);
                fuel.style.height = fillLevel + '%';
            }, 50);
        };
        
        const stopFill = () => {
            filling = false;
            clearInterval(fillInterval);
            
            // Check if in target zone (75-85%)
            if (fillLevel >= 75 && fillLevel <= 85) {
                this.completeTask();
            } else {
                fillLevel = 0;
                fuel.style.height = '0%';
            }
        };
        
        btn.addEventListener('mousedown', startFill);
        btn.addEventListener('touchstart', startFill);
        btn.addEventListener('mouseup', stopFill);
        btn.addEventListener('touchend', stopFill);
        btn.addEventListener('mouseleave', stopFill);
        
        container.appendChild(gauge);
        container.appendChild(btn);
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Fill to the line (75-85%)';
        container.appendChild(instruction);
        
        this.taskContent.appendChild(container);
    }
    
    // Simple lever task
    createTrashTask() {
        const container = document.createElement('div');
        container.style.cssText = 'text-align: center;';
        
        const lever = document.createElement('div');
        lever.style.cssText = 'width: 60px; height: 150px; background: #333; border-radius: 10px; margin: 0 auto 20px; position: relative; cursor: pointer;';
        
        const handle = document.createElement('div');
        handle.style.cssText = 'width: 80px; height: 30px; background: #ff4757; border-radius: 5px; position: absolute; top: 10px; left: -10px; transition: top 0.3s;';
        lever.appendChild(handle);
        
        let pulled = false;
        
        lever.addEventListener('click', () => {
            if (!pulled) {
                handle.style.top = '110px';
                pulled = true;
                setTimeout(() => this.completeTask(), 500);
            }
        });
        
        container.appendChild(lever);
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Pull the lever';
        container.appendChild(instruction);
        
        this.taskContent.appendChild(container);
    }
    
    // Click asteroids task
    createAsteroidsTask() {
        const container = document.createElement('div');
        container.style.cssText = 'width: 300px; height: 200px; background: #0a0a2a; border-radius: 10px; position: relative; overflow: hidden;';
        
        let destroyed = 0;
        const required = 10;
        
        const counter = document.createElement('p');
        counter.style.cssText = 'position: absolute; top: 5px; right: 10px; color: #4a9eff;';
        counter.textContent = `0/${required}`;
        container.appendChild(counter);
        
        const spawnAsteroid = () => {
            if (destroyed >= required) return;
            
            const asteroid = document.createElement('div');
            asteroid.style.cssText = `
                position: absolute;
                width: ${20 + Math.random() * 20}px;
                height: ${20 + Math.random() * 20}px;
                background: #555;
                border-radius: 50%;
                cursor: crosshair;
                top: ${Math.random() * 150}px;
                left: -30px;
            `;
            
            asteroid.addEventListener('click', () => {
                asteroid.remove();
                destroyed++;
                counter.textContent = `${destroyed}/${required}`;
                
                if (destroyed >= required) {
                    setTimeout(() => this.completeTask(), 500);
                }
            });
            
            container.appendChild(asteroid);
            
            // Animate across screen
            let pos = -30;
            const moveInterval = setInterval(() => {
                pos += 3;
                asteroid.style.left = pos + 'px';
                
                if (pos > 310) {
                    asteroid.remove();
                    clearInterval(moveInterval);
                }
            }, 50);
        };
        
        // Spawn asteroids
        const spawnInterval = setInterval(() => {
            if (destroyed >= required) {
                clearInterval(spawnInterval);
                return;
            }
            spawnAsteroid();
        }, 500);
        
        this.taskContent.appendChild(container);
    }
    
    // Med scan (just wait)
    createMedscanTask() {
        const container = document.createElement('div');
        container.style.cssText = 'text-align: center;';
        
        const scanner = document.createElement('div');
        scanner.style.cssText = 'width: 150px; height: 200px; background: linear-gradient(to bottom, #1a1a3a, #0f0f23); border: 3px solid #4a9eff; border-radius: 10px; margin: 0 auto 20px; position: relative; overflow: hidden;';
        
        const scanLine = document.createElement('div');
        scanLine.style.cssText = 'width: 100%; height: 3px; background: #2ed573; position: absolute; top: 0; animation: scan 2s linear infinite;';
        scanner.appendChild(scanLine);
        
        const style = document.createElement('style');
        style.textContent = '@keyframes scan { 0% { top: 0; } 50% { top: calc(100% - 3px); } 100% { top: 0; } }';
        document.head.appendChild(style);
        
        const status = document.createElement('p');
        status.style.color = '#4a9eff';
        status.textContent = 'Scanning...';
        
        container.appendChild(scanner);
        container.appendChild(status);
        this.taskContent.appendChild(container);
        
        setTimeout(() => {
            status.textContent = 'ID Confirmed';
            status.style.color = '#2ed573';
            setTimeout(() => this.completeTask(), 500);
        }, 3000);
    }
    
    // Slider alignment task
    createSliderTask() {
        const container = document.createElement('div');
        container.className = 'slider-task';
        
        const target = 50 + Math.floor(Math.random() * 40);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = 0;
        
        const display = document.createElement('div');
        display.className = 'slider-target';
        display.textContent = `Target: ${target} | Current: 0`;
        
        slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            display.textContent = `Target: ${target} | Current: ${val}`;
            
            if (Math.abs(val - target) <= 3) {
                display.style.color = '#2ed573';
            } else {
                display.style.color = '#4a9eff';
            }
        });
        
        slider.addEventListener('change', () => {
            const val = parseInt(slider.value);
            if (Math.abs(val - target) <= 3) {
                this.completeTask();
            }
        });
        
        container.appendChild(slider);
        container.appendChild(display);
        this.taskContent.appendChild(container);
    }
    
    // Shield prime (click in order)
    createPrimeTask() {
        const container = document.createElement('div');
        container.style.cssText = 'display: grid; grid-template-columns: repeat(3, 60px); gap: 10px; justify-content: center;';
        
        const order = [1, 2, 3, 4, 5, 6];
        const shuffled = [...order].sort(() => Math.random() - 0.5);
        let currentTarget = 1;
        
        shuffled.forEach((num) => {
            const btn = document.createElement('button');
            btn.className = 'keypad-btn';
            btn.textContent = num;
            btn.addEventListener('click', () => {
                if (num === currentTarget) {
                    btn.style.background = '#2ed573';
                    btn.disabled = true;
                    currentTarget++;
                    
                    if (currentTarget > 6) {
                        setTimeout(() => this.completeTask(), 500);
                    }
                } else {
                    // Flash red
                    btn.style.background = '#ff4757';
                    setTimeout(() => btn.style.background = '', 300);
                }
            });
            container.appendChild(btn);
        });
        
        this.taskContent.appendChild(container);
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Click in order: 1, 2, 3, 4, 5, 6';
        this.taskContent.appendChild(instruction);
    }
    
    // Calibrate timing task
    createCalibrateTask() {
        const container = document.createElement('div');
        container.style.cssText = 'text-align: center;';
        
        let calibrated = 0;
        const required = 3;
        
        const createCalibrator = () => {
            const bar = document.createElement('div');
            bar.style.cssText = 'width: 200px; height: 30px; background: #333; border-radius: 5px; margin: 10px auto; position: relative; overflow: hidden;';
            
            const target = document.createElement('div');
            target.style.cssText = 'position: absolute; width: 30px; height: 100%; background: rgba(46, 213, 115, 0.3); right: 10px;';
            bar.appendChild(target);
            
            const needle = document.createElement('div');
            needle.style.cssText = 'position: absolute; width: 5px; height: 100%; background: #ff4757; left: 0;';
            bar.appendChild(needle);
            
            let pos = 0;
            let direction = 1;
            let active = true;
            
            const moveNeedle = () => {
                if (!active) return;
                
                pos += direction * 3;
                if (pos >= 195 || pos <= 0) direction *= -1;
                needle.style.left = pos + 'px';
                requestAnimationFrame(moveNeedle);
            };
            moveNeedle();
            
            bar.addEventListener('click', () => {
                if (!active) return;
                
                // Check if in target zone (160-190)
                if (pos >= 160 && pos <= 190) {
                    active = false;
                    needle.style.background = '#2ed573';
                    calibrated++;
                    
                    if (calibrated >= required) {
                        setTimeout(() => this.completeTask(), 500);
                    }
                } else {
                    needle.style.background = '#ffa502';
                    setTimeout(() => needle.style.background = '#ff4757', 200);
                }
            });
            
            return bar;
        };
        
        for (let i = 0; i < required; i++) {
            container.appendChild(createCalibrator());
        }
        
        const instruction = document.createElement('p');
        instruction.style.color = '#888';
        instruction.textContent = 'Click when the bar is in the green zone';
        container.appendChild(instruction);
        
        this.taskContent.appendChild(container);
    }
    
    // Insert keys task
    createKeysTask() {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 20px; justify-content: center; align-items: center;';
        
        const keyhole = document.createElement('div');
        keyhole.style.cssText = 'width: 100px; height: 100px; background: #333; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 3em;';
        keyhole.textContent = '🔒';
        
        const key = document.createElement('div');
        key.style.cssText = 'font-size: 3em; cursor: grab; user-select: none;';
        key.textContent = '🔑';
        key.draggable = true;
        
        key.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text', 'key');
        });
        
        keyhole.addEventListener('dragover', (e) => e.preventDefault());
        keyhole.addEventListener('drop', (e) => {
            e.preventDefault();
            keyhole.textContent = '🔓';
            keyhole.style.background = '#2ed573';
            key.style.display = 'none';
            setTimeout(() => this.completeTask(), 500);
        });
        
        // Touch support
        key.addEventListener('click', () => {
            keyhole.textContent = '🔓';
            keyhole.style.background = '#2ed573';
            key.style.display = 'none';
            setTimeout(() => this.completeTask(), 500);
        });
        
        container.appendChild(key);
        container.appendChild(keyhole);
        this.taskContent.appendChild(container);
    }
    
    // Fallback simple task
    createSimpleTask() {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = 'Complete Task';
        btn.addEventListener('click', () => this.completeTask());
        this.taskContent.appendChild(btn);
    }
}
