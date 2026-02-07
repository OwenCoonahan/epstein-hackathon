/**
 * EPSTEIN WRAPPED 2025 - V2 UNHINGED EDITION
 * Interactive Spotify Wrapped-style experience
 */

class EpsteinWrapped {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.slides = [];
        this.isAnimating = false;
        this.hasStarted = false;
        this.audioEnabled = false;
        this.audioMuted = false;
        
        this.init();
    }
    
    init() {
        // Get all slides
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        
        // Create progress dots
        this.createProgressDots();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard navigation
        this.setupKeyboardNav();
        
        // Create ambient particles
        this.createParticles();
        
        // Setup audio
        this.setupAudio();
        
        // Preload images
        this.preloadImages();
    }
    
    createProgressDots() {
        const dotsContainer = document.querySelector('.progress-dots');
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot' + (i === 0 ? ' active' : '');
            dotsContainer.appendChild(dot);
        }
    }
    
    updateProgressDots() {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index === this.currentSlide) {
                dot.classList.add('active');
            } else if (index < this.currentSlide) {
                dot.classList.add('completed');
            }
        });
    }
    
    setupEventListeners() {
        // Tap zones
        const tapLeft = document.querySelector('.tap-left');
        const tapRight = document.querySelector('.tap-right');
        
        if (tapLeft) tapLeft.addEventListener('click', () => this.prevSlide());
        if (tapRight) tapRight.addEventListener('click', () => this.nextSlide());
        
        // Navigation arrows
        const navPrev = document.getElementById('navPrev');
        const navNext = document.getElementById('navNext');
        if (navPrev) navPrev.addEventListener('click', () => this.prevSlide());
        if (navNext) navNext.addEventListener('click', () => this.nextSlide());
        
        // Touch swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
        }, { passive: true });
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.share());
        }
        
        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }
        
        // Audio toggle
        const audioToggle = document.getElementById('audioToggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleAudio();
            });
        }
    }
    
    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'm':
                case 'M':
                    this.toggleAudio();
                    break;
            }
        });
    }
    
    handleSwipe(startX, endX, startY, endY) {
        const horizontalThreshold = 50;
        const verticalThreshold = 100;
        const diffX = startX - endX;
        const diffY = Math.abs(startY - endY);
        
        // Only trigger if horizontal swipe is significant and vertical is minimal
        if (Math.abs(diffX) > horizontalThreshold && diffY < verticalThreshold) {
            if (diffX > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    nextSlide() {
        if (this.isAnimating) return;
        
        // Start experience on first tap
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.enableAudio();
        }
        
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1, 'forward');
        }
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1, 'backward');
        }
    }
    
    goToSlide(index, direction = 'forward') {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.isAnimating = true;
        
        const currentSlide = this.slides[this.currentSlide];
        const nextSlide = this.slides[index];
        
        // Set exit/enter animations
        if (direction === 'forward') {
            currentSlide.classList.add('exit-left');
            nextSlide.classList.add('enter-right');
        } else {
            currentSlide.classList.add('exit-right');
            nextSlide.classList.add('enter-left');
        }
        
        nextSlide.classList.add('active');
        
        // Clean up after animation
        setTimeout(() => {
            currentSlide.classList.remove('active', 'exit-left', 'exit-right');
            nextSlide.classList.remove('enter-right', 'enter-left');
            
            this.currentSlide = index;
            this.updateProgressDots();
            this.animateSlideContent(nextSlide);
            this.isAnimating = false;
        }, 600);
    }
    
    animateSlideContent(slide) {
        // Animate counter numbers
        const counters = slide.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            this.animateCounter(counter);
        });
        
        // Re-trigger CSS animations
        const animatedItems = slide.querySelectorAll('[style*="--delay"]');
        animatedItems.forEach(item => {
            item.style.animation = 'none';
            item.offsetHeight; // Force reflow
            item.style.animation = '';
        });
        
        // Animate cards with staggered delay
        const cards = slide.querySelectorAll('.celeb-card, .final-stat');
        cards.forEach((card, i) => {
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animationDelay = `${0.1 + i * 0.05}s`;
            card.style.animation = '';
        });
    }
    
    animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const duration = 2000;
        const start = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function - ease out quart
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(target * easeOutQuart);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        document.body.appendChild(particlesContainer);
        
        // Create floating particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (8 + Math.random() * 12) + 's';
            particlesContainer.appendChild(particle);
        }
    }
    
    setupAudio() {
        this.bgMusic = document.getElementById('bgMusic');
        
        // Set up audio toggle button state
        const audioToggle = document.getElementById('audioToggle');
        
        if (this.bgMusic) {
            this.bgMusic.volume = 0.25;
            
            // Handle audio load errors - fallback to generated music
            this.bgMusic.addEventListener('error', () => {
                console.log('MP3 not found - using generated happy music');
                this.setupGeneratedMusic();
            });
            
            // Check if source exists
            this.bgMusic.addEventListener('loadeddata', () => {
                console.log('Background music loaded');
            });
        } else {
            this.setupGeneratedMusic();
        }
    }
    
    // Fallback: Generate ironic happy music using Web Audio API
    setupGeneratedMusic() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isGeneratedMusic = true;
        
        // Simple cheerful melody using oscillators
        this.melodyNotes = [
            { freq: 523.25, dur: 0.2 },  // C5
            { freq: 587.33, dur: 0.2 },  // D5
            { freq: 659.25, dur: 0.2 },  // E5
            { freq: 523.25, dur: 0.2 },  // C5
            { freq: 659.25, dur: 0.3 },  // E5
            { freq: 659.25, dur: 0.3 },  // E5
            { freq: 587.33, dur: 0.2 },  // D5
            { freq: 587.33, dur: 0.2 },  // D5
            { freq: 523.25, dur: 0.2 },  // C5
            { freq: 587.33, dur: 0.2 },  // D5
            { freq: 659.25, dur: 0.4 },  // E5
            { freq: 784.00, dur: 0.4 },  // G5
            { freq: 659.25, dur: 0.4 },  // E5
        ];
        this.melodyIndex = 0;
        this.melodyInterval = null;
    }
    
    playGeneratedNote() {
        if (!this.audioContext || this.audioMuted) return;
        
        const note = this.melodyNotes[this.melodyIndex];
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.dur);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + note.dur + 0.1);
        
        this.melodyIndex = (this.melodyIndex + 1) % this.melodyNotes.length;
    }
    
    startGeneratedMusic() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.melodyInterval = setInterval(() => this.playGeneratedNote(), 300);
    }
    
    stopGeneratedMusic() {
        if (this.melodyInterval) {
            clearInterval(this.melodyInterval);
            this.melodyInterval = null;
        }
    }
    
    enableAudio() {
        if (this.isGeneratedMusic) {
            // Use generated music
            if (!this.audioEnabled) {
                this.startGeneratedMusic();
                this.audioEnabled = true;
                this.updateAudioToggle();
            }
        } else if (this.bgMusic && !this.audioEnabled) {
            this.bgMusic.play().then(() => {
                this.audioEnabled = true;
                this.updateAudioToggle();
            }).catch((error) => {
                console.log('Audio autoplay blocked:', error);
                // Try to play on next user interaction
                document.addEventListener('click', () => {
                    if (!this.audioEnabled && !this.audioMuted) {
                        this.bgMusic.play().then(() => {
                            this.audioEnabled = true;
                            this.updateAudioToggle();
                        }).catch(() => {});
                    }
                }, { once: true });
            });
        }
    }
    
    toggleAudio() {
        this.audioMuted = !this.audioMuted;
        
        if (this.isGeneratedMusic) {
            if (this.audioMuted) {
                this.stopGeneratedMusic();
            } else {
                this.startGeneratedMusic();
            }
        } else if (this.bgMusic) {
            if (this.audioMuted) {
                this.bgMusic.pause();
            } else {
                this.bgMusic.play().catch(() => {});
            }
        }
        
        this.updateAudioToggle();
    }
    
    updateAudioToggle() {
        const audioToggle = document.getElementById('audioToggle');
        if (audioToggle) {
            if (this.audioMuted) {
                audioToggle.classList.add('muted');
            } else {
                audioToggle.classList.remove('muted');
            }
        }
    }
    
    preloadImages() {
        // Preload celebrity photos
        const imageUrls = [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ghislaine_Maxwell_%28cropped%29.jpg/440px-Ghislaine_Maxwell_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bill_Clinton.jpg/440px-Bill_Clinton.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/440px-Donald_Trump_official_portrait.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Prince_Andrew_August_2014_%28cropped%29.jpg/440px-Prince_Andrew_August_2014_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/440px-Bill_Gates_2017_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Alan_Dershowitz_2009.jpg/440px-Alan_Dershowitz_2009.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Kevin_Spacey%2C_May_2013.jpg/440px-Kevin_Spacey%2C_May_2013.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Les_Wexner.jpg/440px-Les_Wexner.jpg'
        ];
        
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
    
    async share() {
        const shareData = {
            title: 'Epstein Wrapped 2025',
            text: 'The year in review nobody asked for. 1,036 flights. 1,971 contacts. 0 accountability. See the stats from the flight logs...',
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.copyToClipboard(window.location.href);
                }
            }
        } else {
            this.copyToClipboard(window.location.href);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('shareBtn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Link Copied! 📋';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }
    
    restart() {
        // Reset to beginning with smooth animation
        this.goToSlide(0, 'backward');
    }
}

// Slide-specific data from DATA_SOURCES (defined in data.js)
const epsteinData = {
    flights: {
        total: 1036,
        dateRange: "1997-2005",
        planes: [
            { model: "Boeing 727-31", tail: "N908JE", nickname: "Lolita Express" },
            { model: "Gulfstream II", tail: "N120JE" }
        ]
    },
    destinations: [
        { name: "Little St. James, USVI", trips: 173, nickname: "Pedophile Island" },
        { name: "Teterboro, NJ", trips: 152 },
        { name: "Palm Beach, FL", trips: 139 },
        { name: "Paris, France", trips: 52 },
        { name: "London, UK", trips: 38 }
    ],
    islands: {
        littleStJames: { size: "71.5 acres", purchased: 1998, price: "$8M" },
        greatStJames: { size: "165 acres", purchased: 2016, price: "$22.5M" }
    },
    darkStats: {
        totalVictims: "1,000+",
        youngestDocumented: 14,
        youngestAlleged: 12,
        averageAge: "14-16",
        fbiConfirmed: "36+",
        recruitmentMethod: "Pyramid scheme - $200-300 per massage, $200 bonus to recruit a friend"
    },
    frequentFlyers: [
        { name: "Ghislaine Maxwell", role: "Co-conspirator (convicted)", flights: 352 },
        { name: "Sarah Kellen", role: "Scheduler (never charged)", flights: 181 },
        { name: "Nadia Marcinkova", role: "Personal pilot", flights: 127 },
        { name: "Emmy Tayler", role: "Assistant", flights: 87 }
    ],
    celebrities: [
        { name: "Bill Clinton", detail: "26+ flights documented" },
        { name: "Donald Trump", detail: "Called him 'terrific guy'" },
        { name: "Prince Andrew", detail: "£12M settlement" },
        { name: "Bill Gates", detail: "Met post-conviction" },
        { name: "Alan Dershowitz", detail: "Named in court documents" },
        { name: "Kevin Spacey", detail: "2002 Africa trip" },
        { name: "Les Wexner", detail: "$46M+ townhouse gift" }
    ],
    finances: {
        netWorth: "$577M",
        wexnerFees: "$200M+",
        wireTransfers: "$1.9B",
        taxRate: "4%",
        actualJob: "¯\\_(ツ)_/¯"
    },
    death: {
        cameras: "Malfunctioned (both)",
        guards: "Asleep (charged with lying)",
        suicideWatch: "Removed 6 days prior",
        hyoidBone: "Broken (strangulation sign)",
        footage2025: "3 minutes missing"
    },
    blackBook: {
        names: 1971,
        pages: 221
    },
    compensation: {
        distributed: "$121M+",
        claims: "225+"
    },
    personality: {
        type: "Didn't Kill Himself",
        aura: "Blackmail Energy ✨",
        traits: ["Networking enthusiast", "Island collector", "Tax optimization expert", "Amateur videographer"]
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.epsteinWrapped = new EpsteinWrapped();
});

// Haptic feedback for mobile if available
function vibrate(duration = 10) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Add haptic to slide changes
document.addEventListener('click', () => vibrate(5));
