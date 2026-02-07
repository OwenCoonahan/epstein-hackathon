/**
 * EPSTEIN WRAPPED V3 — Documentary Style
 * Clean, minimal, auto-playing music
 */

class EpsteinWrapped {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.totalSlides = 0;
        this.isAnimating = false;
        this.hasStarted = false;
        this.audioContext = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.volume = 0.3;
        
        this.init();
    }
    
    init() {
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        
        this.setupEventListeners();
        this.setupKeyboard();
        this.preloadImages();
        this.updateProgress();
    }
    
    setupEventListeners() {
        // Tap zones
        document.getElementById('tapLeft')?.addEventListener('click', () => this.prevSlide());
        document.getElementById('tapRight')?.addEventListener('click', () => this.nextSlide());
        
        // Touch swipe
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].screenX;
            const endY = e.changedTouches[0].screenY;
            const diffX = startX - endX;
            const diffY = Math.abs(startY - endY);
            
            if (Math.abs(diffX) > 50 && diffY < 100) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        }, { passive: true });
        
        // Volume controls
        document.getElementById('volumeBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });
        
        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Share and restart
        document.getElementById('shareBtn')?.addEventListener('click', () => this.share());
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restart());
        
        // First interaction starts audio
        document.addEventListener('click', () => this.startAudioOnFirstInteraction(), { once: true });
        document.addEventListener('touchstart', () => this.startAudioOnFirstInteraction(), { once: true });
    }
    
    setupKeyboard() {
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
                    this.toggleMute();
                    break;
            }
        });
    }
    
    startAudioOnFirstInteraction() {
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.initAudio();
        }
    }
    
    // ========================================
    // WEB AUDIO API - IRONICALLY UPBEAT MUSIC
    // ========================================
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.isPlaying = true;
            this.playMusic();
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    playMusic() {
        if (!this.audioContext || !this.isPlaying) return;
        
        // Happy ukulele-style melody - ironically upbeat
        const bpm = 120;
        const beatLength = 60 / bpm;
        
        // Major key, happy progression (C - G - Am - F)
        const chordProgression = [
            { notes: [261.63, 329.63, 392.00], duration: 2 }, // C major
            { notes: [196.00, 246.94, 293.66], duration: 2 }, // G major
            { notes: [220.00, 261.63, 329.63], duration: 2 }, // A minor
            { notes: [174.61, 220.00, 261.63], duration: 2 }, // F major
        ];
        
        // Melody notes (happy, bouncy)
        const melody = [
            { freq: 523.25, dur: 0.25 }, // C5
            { freq: 587.33, dur: 0.25 }, // D5
            { freq: 659.25, dur: 0.5 },  // E5
            { freq: 523.25, dur: 0.25 }, // C5
            { freq: 659.25, dur: 0.5 },  // E5
            { freq: 784.00, dur: 0.5 },  // G5
            { freq: 659.25, dur: 0.25 }, // E5
            { freq: 587.33, dur: 0.25 }, // D5
            { freq: 523.25, dur: 0.5 },  // C5
            { freq: 392.00, dur: 0.25 }, // G4
            { freq: 440.00, dur: 0.25 }, // A4
            { freq: 493.88, dur: 0.5 },  // B4
            { freq: 523.25, dur: 1.0 },  // C5
        ];
        
        let time = this.audioContext.currentTime;
        const loopDuration = 8; // 8 seconds per loop
        
        // Play chord progression
        chordProgression.forEach((chord, i) => {
            const chordTime = time + (i * 2 * beatLength);
            this.playChord(chord.notes, chordTime, chord.duration * beatLength);
        });
        
        // Play melody on top
        let melodyTime = time;
        melody.forEach((note) => {
            this.playNote(note.freq, melodyTime, note.dur * beatLength, 'sine', 0.15);
            melodyTime += note.dur * beatLength;
        });
        
        // Schedule next loop
        setTimeout(() => {
            if (this.isPlaying) {
                this.playMusic();
            }
        }, loopDuration * 1000);
    }
    
    playChord(frequencies, startTime, duration) {
        frequencies.forEach(freq => {
            this.playNote(freq, startTime, duration, 'triangle', 0.08);
        });
    }
    
    playNote(frequency, startTime, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext || !this.gainNode) return;
        
        const osc = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        // ADSR envelope
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        noteGain.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.1);
        noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.connect(noteGain);
        noteGain.connect(this.gainNode);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
    }
    
    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
        
        const control = document.getElementById('volumeControl');
        if (value === 0) {
            control?.classList.add('muted');
        } else {
            control?.classList.remove('muted');
        }
    }
    
    toggleMute() {
        const slider = document.getElementById('volumeSlider');
        const control = document.getElementById('volumeControl');
        
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
            if (slider) slider.value = 0;
            control?.classList.add('muted');
        } else {
            const newVol = this.previousVolume || 0.3;
            this.setVolume(newVol);
            if (slider) slider.value = newVol * 100;
            control?.classList.remove('muted');
        }
    }
    
    // ========================================
    // SLIDE NAVIGATION
    // ========================================
    
    nextSlide() {
        if (this.isAnimating) return;
        
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.initAudio();
        }
        
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.isAnimating = true;
        
        const current = this.slides[this.currentSlide];
        const next = this.slides[index];
        
        current.classList.add('exiting');
        next.classList.add('active');
        
        setTimeout(() => {
            current.classList.remove('active', 'exiting');
            this.currentSlide = index;
            this.updateProgress();
            this.animateSlideContent(next);
            this.isAnimating = false;
        }, 500);
    }
    
    updateProgress() {
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        const fill = document.getElementById('progressFill');
        if (fill) {
            fill.style.width = `${progress}%`;
        }
    }
    
    animateSlideContent(slide) {
        // Animate counters
        slide.querySelectorAll('[data-count]').forEach(el => {
            this.animateCounter(el);
        });
        
        // Reset CSS animations
        slide.querySelectorAll('.dest-row, .associate-card, .death-fact').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // Force reflow
            el.style.animation = '';
        });
    }
    
    animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const duration = 2000;
        const start = performance.now();
        
        const update = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(target * eased);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        requestAnimationFrame(update);
    }
    
    // ========================================
    // UTILITIES
    // ========================================
    
    preloadImages() {
        const urls = [
            'https://upload.wikimedia.org/wikipedia/commons/9/9a/Jeffrey_Epstein_mug_shot.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/2/20/Little_St_James_Island.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/0/0f/N908JE_Boeing_727-31_Epstein.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/b/b1/9_East_71st_Street.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/e/e3/Ghislaine_Maxwell_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/d/d3/Bill_Clinton.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/9/9f/Prince_Andrew_August_2014_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/a/a8/Bill_Gates_2017_%28cropped%29.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/4/47/MCC_New_York_from_Brooklyn_Bridge.jpg'
        ];
        
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
    
    async share() {
        const data = {
            title: 'Epstein Wrapped 2024',
            text: '1,036 flights. 1,000+ victims. 1 conviction. The year in review.',
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(data);
            } catch (e) {
                if (e.name !== 'AbortError') {
                    this.copyLink();
                }
            }
        } else {
            this.copyLink();
        }
    }
    
    copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const btn = document.getElementById('shareBtn');
            if (btn) {
                btn.textContent = 'Copied';
                setTimeout(() => {
                    btn.textContent = 'Share';
                }, 2000);
            }
        });
    }
    
    restart() {
        this.goToSlide(0);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.epsteinWrapped = new EpsteinWrapped();
});
