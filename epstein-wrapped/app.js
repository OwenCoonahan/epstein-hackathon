/**
 * EPSTEIN WRAPPED 2025
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
        
        // Preload audio
        this.setupAudio();
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
        
        tapLeft.addEventListener('click', () => this.prevSlide());
        tapRight.addEventListener('click', () => this.nextSlide());
        
        // Touch swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
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
            }
        });
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
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
        }, 500);
    }
    
    animateSlideContent(slide) {
        // Animate counter numbers
        const counters = slide.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            this.animateCounter(counter);
        });
        
        // Re-trigger CSS animations for items with animation delays
        const animatedItems = slide.querySelectorAll('[style*="--delay"]');
        animatedItems.forEach(item => {
            item.style.animation = 'none';
            item.offsetHeight; // Force reflow
            item.style.animation = '';
        });
    }
    
    animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const duration = 2000;
        const start = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
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
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }
    
    setupAudio() {
        this.bgMusic = document.getElementById('bgMusic');
        if (this.bgMusic) {
            this.bgMusic.volume = 0.3;
        }
    }
    
    enableAudio() {
        if (this.bgMusic && !this.audioEnabled) {
            this.bgMusic.play().catch(() => {
                // Audio autoplay blocked - that's okay
                console.log('Audio autoplay blocked');
            });
            this.audioEnabled = true;
        }
    }
    
    async share() {
        const shareData = {
            title: 'Epstein Wrapped 2025',
            text: 'The year in review nobody asked for. See Jeffrey\'s stats from the flight logs...',
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                this.copyToClipboard(window.location.href);
            }
        } else {
            this.copyToClipboard(window.location.href);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show copied notification
            const btn = document.getElementById('shareBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Link Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
    
    restart() {
        this.goToSlide(0, 'backward');
    }
}

// Data for the experience (sourced from public records)
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
        { name: "Little St. James, USVI", trips: 173 },
        { name: "Teterboro, NJ", trips: 152 },
        { name: "Palm Beach, FL", trips: 139 },
        { name: "Paris, France", trips: 52 },
        { name: "London, UK", trips: 38 }
    ],
    island: {
        name: "Little St. James",
        size: "71.5 acres",
        purchased: 1998,
        price: "$8M",
        nickname: "Pedophile Island"
    },
    frequentFlyers: [
        { name: "Ghislaine Maxwell", role: "Co-conspirator", flights: 352 },
        { name: "Sarah Kellen", role: "Assistant", flights: 181 },
        { name: "Nadia Marcinkova", role: "Personal pilot", flights: 127 },
        { name: "Emmy Tayler", role: "Assistant", flights: 87 }
    ],
    celebrities: [
        { name: "Bill Clinton", detail: "26+ flights documented" },
        { name: "Prince Andrew", detail: "Multiple visits, photographed" },
        { name: "Alan Dershowitz", detail: "Named in court documents" },
        { name: "Kevin Spacey", detail: "Africa trip 2002" },
        { name: "Les Wexner", detail: "$46M townhouse gift" },
        { name: "Chris Tucker", detail: "Africa trip 2002" }
    ],
    finances: {
        netWorth: "$577M",
        manhattanMansion: "$56M",
        wexnerGift: "$46M+",
        source: "Unknown/disputed"
    },
    timeline: [
        { year: 2005, event: "Investigation begins" },
        { year: 2008, event: "Pleads guilty to state charges" },
        { year: 2008, event: "13 months county jail (work release)" },
        { year: 2019, event: "Arrested on federal charges" },
        { year: 2019, event: "Found dead in cell (August 10)" }
    ],
    blackBook: {
        names: 1971,
        pages: 221
    },
    victims: {
        identified: "~200"
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.epsteinWrapped = new EpsteinWrapped();
});

// Service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
