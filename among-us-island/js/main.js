// Main entry point with Demo Mode

let game = null;

document.addEventListener('DOMContentLoaded', () => {
    // UI Event Handlers
    const startBtn = document.getElementById('start-btn');
    const demoBtn = document.getElementById('demo-btn');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const closeHowToBtn = document.getElementById('close-how-to');
    
    startBtn.addEventListener('click', () => startGame(false));
    
    if (demoBtn) {
        demoBtn.addEventListener('click', () => startGame(true));
    }
    
    howToPlayBtn.addEventListener('click', () => {
        document.getElementById('how-to-play').classList.remove('hidden');
    });
    
    closeHowToBtn.addEventListener('click', () => {
        document.getElementById('how-to-play').classList.add('hidden');
    });
    
    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (typeof musicManager !== 'undefined') {
                musicManager.setVolume(volume);
            }
        });
    }
    
    // Keyboard shortcut to start
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !game) {
            startGame(false);
        }
    });
    
    // Initialize audio on first user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
});

function initAudio() {
    if (typeof musicManager !== 'undefined') {
        musicManager.init();
    }
}

function startGame(demoMode = false) {
    if (game) return;
    
    const playerName = document.getElementById('player-name').value || 'Guest';
    const playerCount = parseInt(document.getElementById('player-count').value) || 8;
    const impostorCount = parseInt(document.getElementById('impostor-count').value) || 2;
    
    game = new AmongUsGame();
    game.init({
        playerName,
        playerCount,
        impostorCount,
        demoMode: demoMode
    });
}

// Prevent context menu on mobile
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#game-container') || e.target.closest('#joystick-zone')) {
        e.preventDefault();
    }
});

// Handle resize
window.addEventListener('resize', () => {
    if (game && game.game) {
        game.game.scale.resize(
            Math.min(1400, window.innerWidth),
            Math.min(900, window.innerHeight)
        );
    }
});

// Debug info
console.log(`
🏝️ Among Us: Island Edition v3.0
================================
A satirical parody game with Demo Mode!

Controls:
- WASD/Arrows: Move
- E: Use/Task/Vent
- Q: Kill (Impostor)
- R: Report body
- ESC: Exit demo mode

Features:
- Demo/Attract Mode
- Auto-moving AI characters
- Background music
- Enhanced map with corridors
- Smooth animations

Made for the hackathon.
`);
