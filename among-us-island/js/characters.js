// Character roster based on public records (flight logs, court documents)
// All names from publicly available documents

const CHARACTERS = [
    // Primary characters - well documented in flight logs and court records
    {
        id: 'ghislaine',
        name: 'G. Maxwell',
        color: 0x8B008B, // Dark magenta
        bio: 'The Socialite',
        priority: 1
    },
    {
        id: 'prince',
        name: 'Andrew',
        color: 0x4169E1, // Royal blue
        bio: 'The Royal',
        priority: 1
    },
    {
        id: 'dershowitz',
        name: 'A. Dersh',
        color: 0x8B4513, // Brown
        bio: 'The Lawyer',
        priority: 1
    },
    {
        id: 'clinton',
        name: 'W. Clinton',
        color: 0x1E90FF, // Dodger blue
        bio: 'The President',
        priority: 1
    },
    {
        id: 'trump',
        name: 'D. Trump',
        color: 0xFF8C00, // Dark orange
        bio: 'The Mogul',
        priority: 1
    },
    {
        id: 'gates',
        name: 'B. Gates',
        color: 0x00CED1, // Dark turquoise
        bio: 'The Techie',
        priority: 2
    },
    {
        id: 'spacey',
        name: 'K. Spacey',
        color: 0x708090, // Slate gray
        bio: 'The Actor',
        priority: 2
    },
    {
        id: 'naomi',
        name: 'N. Campbell',
        color: 0xFF1493, // Deep pink
        bio: 'The Model',
        priority: 2
    },
    {
        id: 'wexner',
        name: 'L. Wexner',
        color: 0x800080, // Purple
        bio: 'The Retail King',
        priority: 2
    },
    {
        id: 'brunel',
        name: 'J. Brunel',
        color: 0x2F4F4F, // Dark slate gray
        bio: 'The Scout',
        priority: 2
    },
    {
        id: 'kellen',
        name: 'S. Kellen',
        color: 0xDC143C, // Crimson
        bio: 'The Scheduler',
        priority: 3
    },
    {
        id: 'marcinkova',
        name: 'N. Marcinkova',
        color: 0xFF69B4, // Hot pink
        bio: 'The Pilot',
        priority: 3
    },
    {
        id: 'black',
        name: 'L. Black',
        color: 0x000000, // Black
        bio: 'The Financier',
        priority: 3
    },
    {
        id: 'dubin',
        name: 'G. Dubin',
        color: 0x228B22, // Forest green
        bio: 'The Doctor',
        priority: 3
    },
    {
        id: 'visitor',
        name: 'Visitor',
        color: 0x696969, // Dim gray
        bio: 'The Unknown',
        priority: 4
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
