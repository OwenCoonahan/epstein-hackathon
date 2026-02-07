// Character roster based on public records (flight logs, court documents)
// All names from publicly available documents

const CHARACTERS = [
    // Primary characters - well documented in flight logs and court records
    {
        id: 'ghislaine',
        name: 'G. Maxwell',
        color: 0x8B008B, // Dark magenta
        bio: 'The Socialite',
        priority: 1,
        // Black hair in bun, pearls, red lips
        features: {
            hair: 'bun',
            hairColor: '#1a1a1a',
            accessory: 'pearls',
            lips: true,
            lipColor: '#cc0000'
        }
    },
    {
        id: 'prince',
        name: 'Andrew',
        color: 0x4169E1, // Royal blue
        bio: 'The Royal',
        priority: 1,
        // Crown, no sweat glands
        features: {
            hat: 'crown',
            hatColor: '#ffd700',
            badge: '👑'
        }
    },
    {
        id: 'dershowitz',
        name: 'A. Dersh',
        color: 0x8B4513, // Brown
        bio: 'The Lawyer',
        priority: 1,
        // Glasses, briefcase, balding
        features: {
            glasses: true,
            glassesColor: '#333333',
            hair: 'balding',
            hairColor: '#888888',
            accessory: 'briefcase'
        }
    },
    {
        id: 'clinton',
        name: 'W. Clinton',
        color: 0x1E90FF, // Dodger blue
        bio: 'The President',
        priority: 1,
        // Gray/white hair, big smile, saxophone
        features: {
            hair: 'wavy',
            hairColor: '#cccccc',
            smile: 'big',
            accessory: 'sax'
        }
    },
    {
        id: 'trump',
        name: 'D. Trump',
        color: 0xFF8C00, // Dark orange
        bio: 'The Mogul',
        priority: 1,
        // Orange skin, yellow hair swoop, red tie
        features: {
            hair: 'swoop',
            hairColor: '#ffcc00',
            skin: '#ffaa66',
            accessory: 'redtie'
        }
    },
    {
        id: 'gates',
        name: 'B. Gates',
        color: 0x00CED1, // Dark turquoise
        bio: 'The Techie',
        priority: 2,
        // Glasses, nerdy hair
        features: {
            glasses: true,
            glassesColor: '#333333',
            hair: 'parted',
            hairColor: '#4a3728'
        }
    },
    {
        id: 'spacey',
        name: 'K. Spacey',
        color: 0x708090, // Slate gray
        bio: 'The Actor',
        priority: 2,
        // Receding hair, smirk
        features: {
            hair: 'receding',
            hairColor: '#555555',
            smirk: true
        }
    },
    {
        id: 'naomi',
        name: 'N. Campbell',
        color: 0xFF1493, // Deep pink
        bio: 'The Model',
        priority: 2,
        // Long dark hair, glamorous
        features: {
            hair: 'long',
            hairColor: '#1a1a1a',
            lips: true,
            lipColor: '#ff69b4'
        }
    },
    {
        id: 'wexner',
        name: 'L. Wexner',
        color: 0x800080, // Purple
        bio: 'The Retail King',
        priority: 2,
        // Bald, suit
        features: {
            hair: 'bald',
            glasses: true,
            glassesColor: '#444444'
        }
    },
    {
        id: 'brunel',
        name: 'J. Brunel',
        color: 0x2F4F4F, // Dark slate gray
        bio: 'The Scout',
        priority: 2,
        // French, fashion look
        features: {
            hair: 'slicked',
            hairColor: '#333333',
            scarf: true
        }
    },
    {
        id: 'epstein',
        name: 'J. Epstein',
        color: 0x000033, // Very dark blue
        bio: 'The Host',
        priority: 0, // Should appear frequently
        // Egg head, creepy smile
        features: {
            hair: 'egghead',
            hairColor: '#333333',
            smile: 'creepy'
        }
    },
    {
        id: 'kellen',
        name: 'S. Kellen',
        color: 0xDC143C, // Crimson
        bio: 'The Scheduler',
        priority: 3,
        features: {
            hair: 'ponytail',
            hairColor: '#8B4513',
            clipboard: true
        }
    },
    {
        id: 'marcinkova',
        name: 'N. Marcinkova',
        color: 0xFF69B4, // Hot pink
        bio: 'The Pilot',
        priority: 3,
        features: {
            hair: 'short',
            hairColor: '#daa520',
            hat: 'pilot',
            hatColor: '#1a1a3a'
        }
    },
    {
        id: 'black',
        name: 'L. Black',
        color: 0x1a1a1a, // Black
        bio: 'The Financier',
        priority: 3,
        features: {
            hair: 'neat',
            hairColor: '#888888',
            glasses: true,
            glassesColor: '#222222'
        }
    },
    {
        id: 'dubin',
        name: 'G. Dubin',
        color: 0x228B22, // Forest green
        bio: 'The Doctor',
        priority: 3,
        features: {
            hair: 'curly',
            hairColor: '#4a3728',
            accessory: 'stethoscope'
        }
    },
    {
        id: 'visitor',
        name: 'Visitor',
        color: 0x696969, // Dim gray
        bio: 'The Unknown',
        priority: 4,
        features: {
            hair: 'generic',
            hairColor: '#666666'
        }
    }
];

// Character selection for game based on player count
function selectCharacters(count, playerName) {
    // Sort by priority and pick top characters
    const available = [...CHARACTERS].sort((a, b) => a.priority - b.priority);
    const selected = available.slice(0, count);
    
    // Replace first character with player's custom name if provided
    if (playerName && playerName.trim()) {
        selected[0] = {
            ...selected[0],
            name: playerName.substring(0, 12),
            isPlayer: true
        };
    } else {
        selected[0].isPlayer = true;
    }
    
    // Shuffle for random role assignment
    return shuffleArray(selected);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Get contrasting text color
function getContrastColor(hexColor) {
    const r = (hexColor >> 16) & 255;
    const g = (hexColor >> 8) & 255;
    const b = hexColor & 255;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 0x000000 : 0xFFFFFF;
}

// Convert hex to CSS color
function hexToCSS(hexColor) {
    return '#' + hexColor.toString(16).padStart(6, '0');
}

// Draw Among Us style character with distinctive features
function drawCharacterSprite(graphics, player, scale = 1) {
    const features = player.features || {};
    const skinColor = features.skin ? parseInt(features.skin.replace('#', ''), 16) : player.color;
    
    // Scale factor for the bean
    const s = scale;
    
    // Offset to center the character in the texture
    const ox = 35;
    const oy = 45;
    
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(ox, oy + 25 * s, 28 * s, 8 * s);
    
    // Backpack (draw first so it's behind)
    graphics.fillStyle(skinColor, 1);
    graphics.fillRoundedRect(ox - 22 * s, oy - 8 * s, 12 * s, 30 * s, 4 * s);
    graphics.fillStyle(darkenColor(skinColor, 0.15), 1);
    graphics.fillRoundedRect(ox - 24 * s, oy - 6 * s, 4 * s, 26 * s, 2 * s);
    
    // Bean body - Among Us style
    graphics.fillStyle(skinColor, 1);
    graphics.fillEllipse(ox, oy + 5 * s, 32 * s, 44 * s);
    
    // Darker shade on left for 3D effect
    graphics.fillStyle(darkenColor(skinColor, 0.2), 1);
    graphics.fillEllipse(ox - 12 * s, oy + 5 * s, 8 * s, 36 * s);
    
    // Visor (the iconic Among Us visor)
    graphics.fillStyle(0x8ecae6, 1);
    graphics.fillEllipse(ox + 8 * s, oy - 5 * s, 20 * s, 14 * s);
    // Visor shine
    graphics.fillStyle(0xc8e8f4, 0.7);
    graphics.fillEllipse(ox + 12 * s, oy - 9 * s, 8 * s, 6 * s);
    
    // Draw character-specific features
    drawCharacterFeatures(graphics, player, s, ox, oy);
    
    // Outline
    graphics.lineStyle(2 * s, darkenColor(skinColor, 0.4), 1);
    graphics.strokeEllipse(ox, oy + 5 * s, 32 * s, 44 * s);
}

function drawCharacterFeatures(graphics, player, s) {
    const features = player.features || {};
    
    // Hair styles
    if (features.hair) {
        const hairColor = features.hairColor ? parseInt(features.hairColor.replace('#', ''), 16) : 0x333333;
        graphics.fillStyle(hairColor, 1);
        
        switch (features.hair) {
            case 'swoop': // Trump style
                // Big swooping hair
                graphics.fillStyle(0xffcc00, 1);
                graphics.beginPath();
                graphics.moveTo(-15 * s, -25 * s);
                graphics.bezierCurveTo(-5 * s, -40 * s, 20 * s, -35 * s, 25 * s, -20 * s);
                graphics.bezierCurveTo(20 * s, -25 * s, 0 * s, -30 * s, -15 * s, -25 * s);
                graphics.closePath();
                graphics.fillPath();
                // Hair flip
                graphics.fillEllipse(20 * s, -22 * s, 12 * s, 8 * s);
                break;
                
            case 'wavy': // Clinton style - gray wavy
                graphics.fillStyle(0xcccccc, 1);
                graphics.fillEllipse(0 * s, -24 * s, 20 * s, 10 * s);
                graphics.fillEllipse(-8 * s, -22 * s, 8 * s, 8 * s);
                graphics.fillEllipse(8 * s, -22 * s, 8 * s, 8 * s);
                break;
                
            case 'bun': // Maxwell style
                graphics.fillStyle(hairColor, 1);
                graphics.fillCircle(-5 * s, -28 * s, 10 * s);
                graphics.fillEllipse(0 * s, -22 * s, 18 * s, 8 * s);
                break;
                
            case 'balding': // Dershowitz
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(-10 * s, -18 * s, 8 * s, 10 * s);
                graphics.fillEllipse(10 * s, -18 * s, 8 * s, 10 * s);
                break;
                
            case 'parted': // Gates style
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 18 * s, 8 * s);
                // Part line
                graphics.lineStyle(1 * s, 0x000000, 0.5);
                graphics.lineBetween(0 * s, -30 * s, 0 * s, -20 * s);
                break;
                
            case 'receding': // Spacey
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(-8 * s, -20 * s, 10 * s, 8 * s);
                graphics.fillEllipse(8 * s, -20 * s, 10 * s, 8 * s);
                break;
                
            case 'long': // Naomi
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -20 * s, 22 * s, 12 * s);
                graphics.fillEllipse(-14 * s, 0 * s, 6 * s, 25 * s);
                graphics.fillEllipse(14 * s, 0 * s, 6 * s, 25 * s);
                break;
                
            case 'bald':
                // Just the shiny head
                graphics.fillStyle(0xffeedd, 0.3);
                graphics.fillEllipse(0 * s, -22 * s, 12 * s, 8 * s);
                break;
                
            case 'slicked': // Brunel
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 20 * s, 8 * s);
                graphics.lineStyle(1 * s, 0x000000, 0.3);
                for (let i = -8; i <= 8; i += 4) {
                    graphics.lineBetween(i * s, -30 * s, (i + 5) * s, -18 * s);
                }
                break;
                
            case 'egghead': // Epstein
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(-10 * s, -18 * s, 6 * s, 8 * s);
                graphics.fillEllipse(10 * s, -18 * s, 6 * s, 8 * s);
                break;
                
            case 'ponytail':
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 18 * s, 8 * s);
                graphics.fillEllipse(-18 * s, -15 * s, 6 * s, 15 * s);
                break;
                
            case 'short':
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 18 * s, 6 * s);
                break;
                
            case 'neat':
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 18 * s, 8 * s);
                break;
                
            case 'curly':
                graphics.fillStyle(hairColor, 1);
                for (let i = -10; i <= 10; i += 5) {
                    graphics.fillCircle(i * s, -24 * s, 5 * s);
                }
                break;
                
            default:
                graphics.fillStyle(hairColor, 1);
                graphics.fillEllipse(0 * s, -24 * s, 16 * s, 8 * s);
        }
    }
    
    // Hats
    if (features.hat) {
        const hatColor = features.hatColor ? parseInt(features.hatColor.replace('#', ''), 16) : 0xffd700;
        
        switch (features.hat) {
            case 'crown':
                graphics.fillStyle(hatColor, 1);
                graphics.fillRect(-12 * s, -35 * s, 24 * s, 12 * s);
                // Crown points
                graphics.fillTriangle(-12 * s, -35 * s, -8 * s, -35 * s, -10 * s, -42 * s);
                graphics.fillTriangle(-4 * s, -35 * s, 4 * s, -35 * s, 0 * s, -45 * s);
                graphics.fillTriangle(8 * s, -35 * s, 12 * s, -35 * s, 10 * s, -42 * s);
                // Jewels
                graphics.fillStyle(0xff0000, 1);
                graphics.fillCircle(0 * s, -32 * s, 3 * s);
                graphics.fillStyle(0x0000ff, 1);
                graphics.fillCircle(-8 * s, -32 * s, 2 * s);
                graphics.fillCircle(8 * s, -32 * s, 2 * s);
                break;
                
            case 'pilot':
                graphics.fillStyle(hatColor, 1);
                graphics.fillRoundedRect(-14 * s, -34 * s, 28 * s, 10 * s, 3 * s);
                graphics.fillStyle(0xffd700, 1);
                graphics.fillRect(-4 * s, -36 * s, 8 * s, 4 * s);
                break;
        }
    }
    
    // Glasses
    if (features.glasses) {
        const glassesColor = features.glassesColor ? parseInt(features.glassesColor.replace('#', ''), 16) : 0x333333;
        graphics.lineStyle(2 * s, glassesColor, 1);
        graphics.strokeCircle(4 * s, -8 * s, 8 * s);
        graphics.strokeCircle(18 * s, -8 * s, 8 * s);
        graphics.lineBetween(12 * s, -8 * s, 10 * s, -8 * s);
        // Arms
        graphics.lineBetween(-4 * s, -8 * s, -10 * s, -6 * s);
    }
    
    // Lips
    if (features.lips) {
        const lipColor = features.lipColor ? parseInt(features.lipColor.replace('#', ''), 16) : 0xcc0000;
        graphics.fillStyle(lipColor, 1);
        graphics.fillEllipse(8 * s, 5 * s, 8 * s, 3 * s);
    }
    
    // Smile types
    if (features.smile === 'big') {
        // Clinton big smile
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(8 * s, 5 * s, 10 * s, 6 * s);
        graphics.fillStyle(0xff6666, 1);
        graphics.fillEllipse(8 * s, 8 * s, 6 * s, 3 * s);
    } else if (features.smile === 'creepy') {
        graphics.lineStyle(2 * s, 0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(2 * s, 5 * s);
        graphics.bezierCurveTo(6 * s, 10 * s, 14 * s, 10 * s, 18 * s, 5 * s);
        graphics.strokePath();
    } else if (features.smirk) {
        graphics.lineStyle(2 * s, 0x333333, 1);
        graphics.lineBetween(4 * s, 5 * s, 14 * s, 3 * s);
    }
    
    // Accessories
    if (features.accessory) {
        switch (features.accessory) {
            case 'pearls':
                graphics.fillStyle(0xffffff, 1);
                for (let i = -8; i <= 8; i += 4) {
                    graphics.fillCircle(i * s, 18 * s, 3 * s);
                }
                break;
                
            case 'redtie':
                graphics.fillStyle(0xff0000, 1);
                graphics.fillTriangle(-4 * s, 15 * s, 4 * s, 15 * s, 0 * s, 35 * s);
                graphics.fillRect(-3 * s, 12 * s, 6 * s, 6 * s);
                break;
                
            case 'sax':
                // Small saxophone icon
                graphics.fillStyle(0xffd700, 1);
                graphics.fillEllipse(22 * s, 15 * s, 6 * s, 10 * s);
                graphics.fillRect(20 * s, 5 * s, 4 * s, 12 * s);
                break;
                
            case 'briefcase':
                graphics.fillStyle(0x4a3728, 1);
                graphics.fillRoundedRect(18 * s, 20 * s, 14 * s, 10 * s, 2 * s);
                graphics.fillStyle(0xffd700, 1);
                graphics.fillRect(22 * s, 19 * s, 6 * s, 2 * s);
                break;
                
            case 'stethoscope':
                graphics.lineStyle(2 * s, 0x333333, 1);
                graphics.strokeCircle(0 * s, 25 * s, 5 * s);
                graphics.lineBetween(-5 * s, 22 * s, -8 * s, 10 * s);
                graphics.lineBetween(5 * s, 22 * s, 8 * s, 10 * s);
                break;
        }
    }
    
    // Scarf
    if (features.scarf) {
        graphics.fillStyle(0xff4444, 1);
        graphics.fillRect(-12 * s, 12 * s, 24 * s, 8 * s);
        graphics.fillRect(8 * s, 18 * s, 8 * s, 15 * s);
    }
}

// Helper function to darken a color
function darkenColor(color, amount) {
    const r = Math.max(0, ((color >> 16) & 255) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 255) * (1 - amount));
    const b = Math.max(0, (color & 255) * (1 - amount));
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

// Create dead body sprite
function drawDeadBody(graphics, player, scale = 1) {
    const s = scale;
    const color = player.color;
    
    // Half body (cut in half Among Us style)
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(0 * s, 0 * s, 25 * s, 18 * s);
    
    // Bone sticking out
    graphics.fillStyle(0xffffff, 1);
    graphics.fillEllipse(12 * s, -5 * s, 8 * s, 4 * s);
    graphics.fillEllipse(18 * s, -8 * s, 5 * s, 3 * s);
    graphics.fillEllipse(18 * s, -2 * s, 5 * s, 3 * s);
    
    // Blood pool
    graphics.fillStyle(0x8b0000, 0.7);
    graphics.fillEllipse(5 * s, 5 * s, 20 * s, 10 * s);
}

// Funny task names for the island theme
const FUNNY_TASK_NAMES = {
    'Fix Wiring': 'Fix Hidden Cameras',
    'Download Data': 'Delete Browser History',
    'Upload Data': 'Upload "Art Collection"',
    'Swipe Card': 'Swipe Black Card',
    'Start Reactor': 'Start Evidence Shredder',
    'Empty Garbage': 'Dispose of Documents',
    'Clear Debris': 'Clear Flight Manifests',
    'Submit Scan': 'Submit DNA Sample',
    'Clean Pool': 'Clean Infinity Pool',
    'Align Equipment': 'Align Tennis Ball Machine',
    'Prime Shields': 'Activate Perimeter Security',
    'Calibrate Systems': 'Calibrate Wine Cellar',
    'Insert Keys': 'Access Safe Deposit Box',
    'Fuel Helicopter': 'Fuel the Lolita Express'
};

// Kill messages based on killer character
const KILL_MESSAGES = {
    'ghislaine': [
        "invited {victim} for a private tour",
        "introduced {victim} to the wrong people",
        "scheduled {victim}'s final appointment"
    ],
    'prince': [
        "had a non-sweaty encounter with {victim}",
        "claimed to be at Pizza Express while {victim} disappeared",
        "had royal guards escort {victim} away"
    ],
    'dershowitz': [
        "legally eliminated {victim}",
        "argued {victim} out of existence",
        "filed a motion against {victim}'s life"
    ],
    'clinton': [
        "did not have relations with {victim}",
        "played saxophone at {victim}'s funeral",
        "gave {victim} the Arkansas treatment"
    ],
    'trump': [
        "fired {victim}",
        "built a wall around {victim}",
        "grabbed {victim}'s attention permanently"
    ],
    'gates': [
        "blue-screened {victim}",
        "Ctrl+Alt+Deleted {victim}",
        "patched {victim} out of existence"
    ],
    'spacey': [
        "gave {victim} a Hollywood ending",
        "method acted {victim} to death",
        "let the bodies hit the floor with {victim}"
    ],
    'epstein': [
        "{victim} didn't kill themselves... or did they?",
        "hung out with {victim} one last time",
        "{victim} had an accident with a bedsheet"
    ],
    'default': [
        "eliminated {victim}",
        "took care of {victim}",
        "{victim} won't be talking anymore"
    ]
};

function getKillMessage(killer, victim) {
    const messages = KILL_MESSAGES[killer.id] || KILL_MESSAGES['default'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return message.replace('{victim}', victim.name);
}

// Ejection messages
const EJECTION_MESSAGES = {
    'prince': [
        "was yeeted back to Buckingham Palace",
        "claimed diplomatic immunity (denied)",
        "is going to have a Pizza Express alibi"
    ],
    'clinton': [
        "did not inhale... the airlock",
        "depends on what your definition of 'ejected' is",
        "played saxophone one last time"
    ],
    'trump': [
        "was ejected. Bigly. The biggest ejection ever.",
        "called it fake news as they floated away",
        "promised to sue the crewmates"
    ],
    'dershowitz': [
        "objected to their ejection (overruled)",
        "is already working on an appeal",
        "kept their underwear on during ejection"
    ],
    'ghislaine': [
        "won't be scheduling any more appointments",
        "is going to a different kind of island",
        "is no longer a socialite"
    ],
    'gates': [
        "experienced a fatal exception",
        "has been uninstalled",
        "should have updated Windows"
    ],
    'spacey': [
        "took their final bow",
        "method acted their way out the airlock",
        "broke character permanently"
    ],
    'epstein': [
        "definitely didn't eject themselves",
        "was found... floating",
        "had an accident with the airlock"
    ],
    'default': [
        "was ejected",
        "floated into space",
        "is no longer among us"
    ]
};

function getEjectionMessage(player, wasImpostor) {
    const messages = EJECTION_MESSAGES[player.id] || EJECTION_MESSAGES['default'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return `${player.name} ${message}`;
}
