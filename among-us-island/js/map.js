// Island Map Configuration
// Layout inspired by Little St. James Island structure

const MAP_CONFIG = {
    width: 2400,
    height: 1800,
    tileSize: 40,
    backgroundColor: 0x1a472a // Island green/jungle
};

// Room definitions
const ROOMS = {
    // Main mansion
    mainHall: {
        id: 'mainHall',
        name: 'Main Hall',
        x: 1000, y: 600,
        width: 400, height: 300,
        color: 0x4a3728,
        hasEmergencyButton: true
    },
    masterSuite: {
        id: 'masterSuite',
        name: 'Master Suite',
        x: 600, y: 500,
        width: 300, height: 250,
        color: 0x5a4738
    },
    guestWing: {
        id: 'guestWing',
        name: 'Guest Wing',
        x: 1500, y: 500,
        width: 300, height: 250,
        color: 0x5a4738
    },
    kitchen: {
        id: 'kitchen',
        name: 'Kitchen',
        x: 600, y: 850,
        width: 250, height: 200,
        color: 0x6a5748
    },
    diningRoom: {
        id: 'diningRoom',
        name: 'Dining Room',
        x: 950, y: 950,
        width: 300, height: 200,
        color: 0x5a4738
    },
    
    // Temple structure (the infamous blue-striped building)
    temple: {
        id: 'temple',
        name: 'Temple',
        x: 200, y: 200,
        width: 250, height: 250,
        color: 0x4169e1, // Blue with gold stripes
        pattern: 'stripes'
    },
    
    // Outdoor areas
    poolArea: {
        id: 'poolArea',
        name: 'Pool Area',
        x: 1100, y: 1200,
        width: 400, height: 250,
        color: 0x00bfff,
        isOutdoor: true
    },
    tennisCourt: {
        id: 'tennisCourt',
        name: 'Tennis Court',
        x: 1800, y: 300,
        width: 300, height: 200,
        color: 0x228b22,
        isOutdoor: true
    },
    helipad: {
        id: 'helipad',
        name: 'Helipad',
        x: 1900, y: 800,
        width: 200, height: 200,
        color: 0x555555,
        isOutdoor: true
    },
    dock: {
        id: 'dock',
        name: 'Dock',
        x: 100, y: 1400,
        width: 300, height: 150,
        color: 0x8b7355,
        isOutdoor: true
    },
    
    // Underground/hidden areas
    basement: {
        id: 'basement',
        name: 'Basement',
        x: 800, y: 200,
        width: 300, height: 200,
        color: 0x2a2a2a
    },
    serverRoom: {
        id: 'serverRoom',
        name: 'Server Room',
        x: 1600, y: 1000,
        width: 200, height: 150,
        color: 0x1a1a3a
    },
    securityOffice: {
        id: 'securityOffice',
        name: 'Security Office',
        x: 1400, y: 850,
        width: 200, height: 150,
        color: 0x3a3a3a
    },
    
    // Jungle paths (walkable areas)
    junglePath1: {
        id: 'junglePath1',
        name: 'Jungle Path',
        x: 500, y: 1100,
        width: 150, height: 400,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath2: {
        id: 'junglePath2',
        name: 'Jungle Path',
        x: 1700, y: 550,
        width: 150, height: 400,
        color: 0x2a5a2a,
        isPath: true
    }
};

// Vent connections (for impostor travel)
const VENTS = [
    { id: 'vent1', x: 650, y: 550, room: 'masterSuite', connections: ['vent2', 'vent3'] },
    { id: 'vent2', x: 1550, y: 550, room: 'guestWing', connections: ['vent1', 'vent4'] },
    { id: 'vent3', x: 700, y: 900, room: 'kitchen', connections: ['vent1', 'vent5'] },
    { id: 'vent4', x: 1650, y: 1050, room: 'serverRoom', connections: ['vent2', 'vent6'] },
    { id: 'vent5', x: 1150, y: 1250, room: 'poolArea', connections: ['vent3', 'vent6'] },
    { id: 'vent6', x: 250, y: 300, room: 'temple', connections: ['vent4', 'vent5'] }
];

// Task locations
const TASK_LOCATIONS = [
    { id: 'task_wires1', room: 'mainHall', x: 1100, y: 650, taskType: 'wires', name: 'Fix Wiring' },
    { id: 'task_wires2', room: 'serverRoom', x: 1650, y: 1050, taskType: 'wires', name: 'Fix Wiring' },
    { id: 'task_reactor', room: 'basement', x: 900, y: 280, taskType: 'reactor', name: 'Start Reactor' },
    { id: 'task_download1', room: 'securityOffice', x: 1480, y: 900, taskType: 'download', name: 'Download Data' },
    { id: 'task_download2', room: 'temple', x: 280, y: 300, taskType: 'upload', name: 'Upload Data' },
    { id: 'task_swipe', room: 'mainHall', x: 1300, y: 700, taskType: 'swipe', name: 'Swipe Card' },
    { id: 'task_fuel1', room: 'helipad', x: 1980, y: 880, taskType: 'fuel', name: 'Fuel Helicopter' },
    { id: 'task_trash', room: 'kitchen', x: 700, y: 950, taskType: 'trash', name: 'Empty Garbage' },
    { id: 'task_asteroids', room: 'dock', x: 200, y: 1450, taskType: 'asteroids', name: 'Clear Debris' },
    { id: 'task_medscan', room: 'guestWing', x: 1600, y: 600, taskType: 'medscan', name: 'Submit Scan' },
    { id: 'task_leaves', room: 'poolArea', x: 1250, y: 1350, taskType: 'leaves', name: 'Clean Pool' },
    { id: 'task_align', room: 'tennisCourt', x: 1900, y: 380, taskType: 'align', name: 'Align Equipment' },
    { id: 'task_prime', room: 'masterSuite', x: 700, y: 600, taskType: 'prime', name: 'Prime Shields' },
    { id: 'task_calibrate', room: 'diningRoom', x: 1050, y: 1020, taskType: 'calibrate', name: 'Calibrate Systems' },
    { id: 'task_keys', room: 'securityOffice', x: 1500, y: 950, taskType: 'keys', name: 'Insert Keys' }
];

// Sabotage locations
const SABOTAGE_TARGETS = {
    lights: { room: 'serverRoom', x: 1700, y: 1080 },
    comms: { room: 'securityOffice', x: 1450, y: 920 },
    reactor: { room: 'basement', x: 850, y: 250 },
    o2: { room: 'mainHall', x: 1150, y: 700 }
};

// Door connections between rooms
const DOORS = [
    { from: 'mainHall', to: 'masterSuite', x: 900, y: 700 },
    { from: 'mainHall', to: 'guestWing', x: 1400, y: 700 },
    { from: 'mainHall', to: 'diningRoom', x: 1150, y: 900 },
    { from: 'masterSuite', to: 'kitchen', x: 750, y: 750 },
    { from: 'kitchen', to: 'diningRoom', x: 850, y: 950 },
    { from: 'guestWing', to: 'securityOffice', x: 1500, y: 750 },
    { from: 'securityOffice', to: 'serverRoom', x: 1500, y: 1000 },
    { from: 'diningRoom', to: 'poolArea', x: 1100, y: 1150 },
    { from: 'mainHall', to: 'basement', x: 1000, y: 500 },
    { from: 'temple', to: 'junglePath1', x: 350, y: 450 },
    { from: 'junglePath1', to: 'dock', x: 300, y: 1400 },
    { from: 'junglePath1', to: 'kitchen', x: 550, y: 950 },
    { from: 'guestWing', to: 'tennisCourt', x: 1700, y: 400 },
    { from: 'helipad', to: 'junglePath2', x: 1850, y: 700 },
    { from: 'junglePath2', to: 'serverRoom', x: 1700, y: 1000 },
    { from: 'poolArea', to: 'junglePath1', x: 650, y: 1300 }
];

// Spawn points
const SPAWN_POINTS = [
    { x: 1100, y: 700, room: 'mainHall' },
    { x: 1200, y: 750, room: 'mainHall' },
    { x: 1150, y: 800, room: 'mainHall' },
    { x: 1050, y: 750, room: 'mainHall' },
    { x: 1000, y: 700, room: 'mainHall' },
    { x: 1250, y: 700, room: 'mainHall' },
    { x: 1300, y: 750, room: 'mainHall' },
    { x: 1150, y: 650, room: 'mainHall' },
    { x: 1100, y: 850, room: 'mainHall' },
    { x: 1200, y: 850, room: 'mainHall' }
];

// Emergency button location
const EMERGENCY_BUTTON = {
    x: 1200,
    y: 750,
    room: 'mainHall',
    radius: 50
};

// Create walkable area grid
function createWalkableGrid() {
    const grid = [];
    const gridWidth = Math.ceil(MAP_CONFIG.width / MAP_CONFIG.tileSize);
    const gridHeight = Math.ceil(MAP_CONFIG.height / MAP_CONFIG.tileSize);
    
    // Initialize all as non-walkable
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = [];
        for (let x = 0; x < gridWidth; x++) {
            grid[y][x] = 0;
        }
    }
    
    // Mark rooms as walkable
    Object.values(ROOMS).forEach(room => {
        const startX = Math.floor(room.x / MAP_CONFIG.tileSize);
        const startY = Math.floor(room.y / MAP_CONFIG.tileSize);
        const endX = Math.ceil((room.x + room.width) / MAP_CONFIG.tileSize);
        const endY = Math.ceil((room.y + room.height) / MAP_CONFIG.tileSize);
        
        for (let y = startY; y < endY && y < gridHeight; y++) {
            for (let x = startX; x < endX && x < gridWidth; x++) {
                if (y >= 0 && x >= 0) {
                    grid[y][x] = 1;
                }
            }
        }
    });
    
    // Add door connections as walkable
    DOORS.forEach(door => {
        const tileX = Math.floor(door.x / MAP_CONFIG.tileSize);
        const tileY = Math.floor(door.y / MAP_CONFIG.tileSize);
        
        // Make a small walkable corridor
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = tileX + dx;
                const ny = tileY + dy;
                if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
                    grid[ny][nx] = 1;
                }
            }
        }
    });
    
    return grid;
}

// Get room at position
function getRoomAtPosition(x, y) {
    for (const [key, room] of Object.entries(ROOMS)) {
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return room;
        }
    }
    return null;
}

// Check if position is walkable
function isWalkable(x, y, walkableGrid) {
    const tileX = Math.floor(x / MAP_CONFIG.tileSize);
    const tileY = Math.floor(y / MAP_CONFIG.tileSize);
    
    if (tileY < 0 || tileY >= walkableGrid.length ||
        tileX < 0 || tileX >= walkableGrid[0].length) {
        return false;
    }
    
    return walkableGrid[tileY][tileX] === 1;
}
