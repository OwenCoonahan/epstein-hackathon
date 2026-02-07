// Among Us Style Background Music System using Web Audio API

class MusicManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.volume = 0.3;
        this.scheduledNotes = [];
        this.currentPattern = 0;
        this.tempo = 80; // BPM
        this.nextNoteTime = 0;
        this.timerID = null;
        
        // Music state
        this.suspenseLevel = 0; // 0-1, increases during gameplay
        this.isMeeting = false;
        this.isGameOver = false;
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create effects
            this.setupEffects();
            
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            return false;
        }
    }
    
    setupEffects() {
        // Reverb for atmosphere
        this.convolver = this.audioContext.createConvolver();
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.3;
        
        // Create impulse response for reverb
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.convolver.buffer = impulse;
        this.convolver.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
        
        // Filter for muffled sounds
        this.lowpassFilter = this.audioContext.createBiquadFilter();
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.value = 2000;
        this.lowpassFilter.connect(this.masterGain);
    }
    
    start() {
        if (this.isPlaying) return;
        
        if (!this.audioContext) {
            if (!this.init()) return;
        }
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }
    
    stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
        }
    }
    
    setSuspenseLevel(level) {
        this.suspenseLevel = Math.max(0, Math.min(1, level));
    }
    
    // Main scheduler loop
    scheduler() {
        if (!this.isPlaying) return;
        
        // Schedule notes ahead of time
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.advanceTime();
        }
        
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }
    
    advanceTime() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat / 4; // 16th notes
        this.currentPattern = (this.currentPattern + 1) % 64;
    }
    
    scheduleNote(time) {
        if (this.isMeeting) {
            this.playMeetingMusic(time);
        } else if (this.isGameOver) {
            this.playGameOverMusic(time);
        } else {
            this.playAmbientMusic(time);
        }
    }
    
    // Ambient/gameplay music
    playAmbientMusic(time) {
        const beat = this.currentPattern % 16;
        const measure = Math.floor(this.currentPattern / 16) % 4;
        
        // Deep bass drone (Among Us style)
        if (beat === 0 && measure === 0) {
            this.playDrone(time, 55, 4); // Low A
        }
        
        // Suspense heartbeat-like pulse
        if (beat % 8 === 0) {
            const freq = this.suspenseLevel > 0.5 ? 82.41 : 73.42; // E2 or D2
            this.playBass(time, freq, 0.15);
        }
        
        // High tension notes
        if (this.suspenseLevel > 0.3 && beat % 4 === 2) {
            const tensionNotes = [329.63, 349.23, 369.99, 392.00]; // E4-G4 range
            const note = tensionNotes[measure % tensionNotes.length];
            this.playPad(time, note * (1 + this.suspenseLevel * 0.1), 0.3, 0.05);
        }
        
        // Eerie high whistle (random, sparse)
        if (Math.random() < 0.02 && this.suspenseLevel > 0.2) {
            const highNote = 800 + Math.random() * 400;
            this.playWhisper(time, highNote, 1.5);
        }
        
        // Rhythmic tension pulse
        if (this.suspenseLevel > 0.6 && beat % 2 === 0) {
            this.playPulse(time, 110, 0.1);
        }
        
        // Random ambient sounds
        if (Math.random() < 0.01) {
            this.playAmbientSound(time);
        }
    }
    
    // Meeting music - more urgent
    playMeetingMusic(time) {
        const beat = this.currentPattern % 16;
        
        // Urgent bass
        if (beat % 4 === 0) {
            this.playBass(time, 98, 0.2); // G2
        }
        
        // Alert tones
        if (beat % 8 === 0) {
            this.playAlert(time, 440);
            setTimeout(() => this.playAlert(time + 0.15, 523.25), 150);
        }
        
        // Tension strings
        if (beat % 2 === 0) {
            this.playPad(time, 220 + (beat * 10), 0.25, 0.08);
        }
    }
    
    // Victory/defeat music
    playGameOverMusic(time) {
        const beat = this.currentPattern % 32;
        
        if (beat === 0) {
            // Final chord
            this.playChord(time, [130.81, 164.81, 196.00, 261.63], 2); // C major
        }
    }
    
    // Sound generators
    playDrone(time, freq, duration) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.5);
        gain.gain.linearRampToValueAtTime(0.15, time + duration - 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        osc.connect(gain);
        gain.connect(this.lowpassFilter);
        gain.connect(this.convolver);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    playBass(time, freq, duration) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.connect(gain);
        gain.connect(this.lowpassFilter);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    playPad(time, freq, duration, volume = 0.1) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.002; // Slight detune for thickness
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.05);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.convolver);
        gain.connect(this.masterGain);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
    }
    
    playWhisper(time, freq, duration) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.frequency.linearRampToValueAtTime(freq * 0.8, time + duration);
        
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 10;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.03, time + 0.2);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.convolver);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    playPulse(time, freq, duration) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.lowpassFilter);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    playAlert(time, freq) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.1);
    }
    
    playChord(time, freqs, duration) {
        freqs.forEach((freq, i) => {
            this.playPad(time + i * 0.05, freq, duration, 0.08);
        });
    }
    
    playAmbientSound(time) {
        // Random creepy ambient sound
        const sounds = [
            () => this.playWhisper(time, 600 + Math.random() * 200, 2),
            () => this.playDrone(time, 40 + Math.random() * 20, 1),
            () => {
                // Distant footsteps
                for (let i = 0; i < 3; i++) {
                    this.playPulse(time + i * 0.3, 100 + Math.random() * 50, 0.05);
                }
            }
        ];
        
        sounds[Math.floor(Math.random() * sounds.length)]();
    }
    
    // Sound effects
    playKillSound() {
        if (!this.audioContext) return;
        
        const time = this.audioContext.currentTime;
        
        // Stab sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.3);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.3);
        
        // White noise burst
        this.playNoiseHit(time, 0.15);
    }
    
    playReportSound() {
        if (!this.audioContext) return;
        
        const time = this.audioContext.currentTime;
        
        // Alarm sound
        for (let i = 0; i < 3; i++) {
            this.playAlert(time + i * 0.15, 880);
            this.playAlert(time + i * 0.15 + 0.075, 660);
        }
    }
    
    playVentSound() {
        if (!this.audioContext) return;
        
        const time = this.audioContext.currentTime;
        
        // Whoosh sound
        const noise = this.createNoise();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.4);
        filter.Q.value = 2;
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(time);
        noise.stop(time + 0.4);
    }
    
    playEjectSound() {
        if (!this.audioContext) return;
        
        const time = this.audioContext.currentTime;
        
        // Airlock sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 2);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0, time + 2);
        
        osc.connect(gain);
        gain.connect(this.convolver);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 2);
        
        // Add whoosh
        this.playNoiseHit(time, 1);
    }
    
    playTaskCompleteSound() {
        if (!this.audioContext) return;
        
        const time = this.audioContext.currentTime;
        
        // Happy ding
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.15, time + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(time + i * 0.1);
            osc.stop(time + i * 0.1 + 0.3);
        });
    }
    
    playMeetingStart() {
        if (!this.audioContext) return;
        
        this.isMeeting = true;
        const time = this.audioContext.currentTime;
        
        // Emergency alarm
        for (let i = 0; i < 6; i++) {
            this.playAlert(time + i * 0.2, i % 2 === 0 ? 880 : 660);
        }
    }
    
    playMeetingEnd() {
        this.isMeeting = false;
    }
    
    playVictory(isImpostorWin) {
        if (!this.audioContext) return;
        
        this.isGameOver = true;
        const time = this.audioContext.currentTime;
        
        if (isImpostorWin) {
            // Ominous chord
            this.playChord(time, [98, 123.47, 146.83, 174.61], 3); // Dark minor
        } else {
            // Happy chord
            this.playChord(time, [130.81, 164.81, 196.00, 261.63], 3); // C major
        }
    }
    
    playNoiseHit(time, duration) {
        const noise = this.createNoise();
        const gain = this.audioContext.createGain();
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        noise.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(time);
        noise.stop(time + duration);
    }
    
    createNoise() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        return noise;
    }
}

// Global music manager instance
const musicManager = new MusicManager();
