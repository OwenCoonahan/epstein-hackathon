// Main entry point

let game = null;

document.addEventListener('DOMContentLoaded', () => {
    // UI Event Handlers
    const startBtn = document.getElementById('start-btn');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const closeHowToBtn = document.getElementById('close-how-to');
    
    startBtn.addEventListener('click', startGame);
    
    howToPlayBtn.addEventListener('click', () => {
        document.getElementById('how-to-play').classList.remove('hidden');
    });
    
    closeHowToBtn.addEventListener('click', () => {
        document.getElementById('how-to-play').classList.add('hidden');
    });
    
    // Keyboard shortcut to start
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !game) {
            startGame();
        }
    });
});

function startGame() {
    if (game) return;
    
    const playerName = document.getElementById('player-name').value || 'Guest';
    const playerCount = parseInt(document.getElementById('player-count').value) || 8;
    const impostorCount = parseInt(document.getElementById('impostor-count').value) || 2;
    
    game = new AmongUsGame();
    game.init({
        playerName,
        playerCount,
        impostorCount
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
            Math.min(1200, window.innerWidth),
            Math.min(800, window.innerHeight)
        );
    }
});

// Debug info
console.log(`
🏝️ Among Us: Island Edition
============================
A satirical parody game.

Controls:
- WASD/Arrows: Move
- E: Use/Task/Vent
- Q: Kill (Impostor)
- R: Report body

Made for the hackathon.
`);
