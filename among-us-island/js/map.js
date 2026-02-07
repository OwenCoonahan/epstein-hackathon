// Island Map Configuration - Enhanced with Hallways and Corridors
// Layout inspired by Little St. James Island structure

const MAP_CONFIG = {
    width: 2800,
    height: 2200,
    tileSize: 40,
    backgroundColor: 0x1a472a // Island green/jungle
};

// Room definitions with connected hallways
const ROOMS = {
    // ===== MAIN MANSION COMPLEX =====
    mainHall: {
        id: 'mainHall',
        name: 'Main Hall',
        x: 1200, y: 800,
        width: 400, height: 300,
        color: 0x4a3728,
        hasEmergencyButton: true,
        decoration: 'chandelier'
    },
    masterSuite: {
        id: 'masterSuite',
        name: 'Master Suite',
        x: 700, y: 700,
        width: 300, height: 280,
        color: 0x5a4738,
        decoration: 'bed'
    },
    guestVilla1: {
        id: 'guestVilla1',
        name: 'Guest Villa A',
        x: 1800, y: 650,
        width: 280, height: 250,
        color: 0x5a4738,
        decoration: 'bed'
    },
    guestVilla2: {
        id: 'guestVilla2',
        name: 'Guest Villa B',
        x: 1800, y: 1000,
        width: 280, height: 250,
        color: 0x5a4738,
        decoration: 'bed'
    },
    kitchen: {
        id: 'kitchen',
        name: 'Kitchen',
        x: 700, y: 1100,
        width: 280, height: 220,
        color: 0x6a5748,
        decoration: 'kitchen'
    },
    diningRoom: {
        id: 'diningRoom',
        name: 'Dining Room',
        x: 1100, y: 1200,
        width: 350, height: 220,
        color: 0x5a4738,
        decoration: 'table'
    },
    
    // ===== TEMPLE (ICONIC BLUE STRIPED) =====
    temple: {
        id: 'temple',
        name: 'Temple',
        x: 200, y: 300,
        width: 280, height: 280,
        color: 0x4169e1,
        pattern: 'stripes',
        decoration: 'temple'
    },
    
    // ===== OUTDOOR AREAS =====
    poolArea: {
        id: 'poolArea',
        name: 'Infinity Pool',
        x: 1200, y: 1550,
        width: 450, height: 280,
        color: 0x00bfff,
        isOutdoor: true,
        decoration: 'pool'
    },
    beach: {
        id: 'beach',
        name: 'Private Beach',
        x: 150, y: 1600,
        width: 400, height: 200,
        color: 0xf4d03f,
        isOutdoor: true,
        decoration: 'beach'
    },
    tennisCourt: {
        id: 'tennisCourt',
        name: 'Tennis Court',
        x: 2200, y: 400,
        width: 320, height: 220,
        color: 0x228b22,
        isOutdoor: true,
        decoration: 'tennis'
    },
    helipad: {
        id: 'helipad',
        name: 'Helipad',
        x: 2300, y: 1000,
        width: 250, height: 250,
        color: 0x555555,
        isOutdoor: true,
        decoration: 'helipad'
    },
    dock: {
        id: 'dock',
        name: 'Dock',
        x: 100, y: 1200,
        width: 200, height: 300,
        color: 0x8b7355,
        isOutdoor: true,
        decoration: 'dock'
    },
    
    // ===== UNDERGROUND/SECURE AREAS =====
    basement: {
        id: 'basement',
        name: 'Basement',
        x: 900, y: 350,
        width: 320, height: 220,
        color: 0x2a2a2a,
        decoration: 'boxes'
    },
    serverRoom: {
        id: 'serverRoom',
        name: 'Server Room',
        x: 2000, y: 1400,
        width: 220, height: 180,
        color: 0x1a1a3a,
        decoration: 'servers'
    },
    securityOffice: {
        id: 'securityOffice',
        name: 'Security Office',
        x: 1650, y: 1350,
        width: 220, height: 180,
        color: 0x3a3a3a,
        decoration: 'cameras'
    },
    
    // ===== HALLWAYS AND CORRIDORS =====
    hallway_main_west: {
        id: 'hallway_main_west',
        name: 'West Corridor',
        x: 1000, y: 850,
        width: 200, height: 80,
        color: 0x3a2a1a,
        isHallway: true
    },
    hallway_main_east: {
        id: 'hallway_main_east',
        name: 'East Corridor',
        x: 1600, y: 850,
        width: 200, height: 80,
        color: 0x3a2a1a,
        isHallway: true
    },
    hallway_main_south: {
        id: 'hallway_main_south',
        name: 'South Corridor',
        x: 1350, y: 1100,
        width: 100, height: 100,
        color: 0x3a2a1a,
        isHallway: true
    },
    hallway_main_north: {
        id: 'hallway_main_north',
        name: 'North Corridor',
        x: 1350, y: 650,
        width: 100, height: 150,
        color: 0x3a2a1a,
        isHallway: true
    },
    hallway_kitchen: {
        id: 'hallway_kitchen',
        name: 'Kitchen Passage',
        x: 980, y: 1100,
        width: 120, height: 80,
        color: 0x3a2a1a,
        isHallway: true
    },
    hallway_guest_connect: {
        id: 'hallway_guest_connect',
        name: 'Guest Wing Hall',
        x: 1800, y: 900,
        width: 80, height: 100,
        color: 0x3a2a1a,
        isHallway: true
    },
    
    // ===== JUNGLE PATHS =====
    junglePath_temple: {
        id: 'junglePath_temple',
        name: 'Temple Path',
        x: 480, y: 400,
        width: 220, height: 100,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_dock: {
        id: 'junglePath_dock',
        name: 'Dock Path',
        x: 300, y: 900,
        width: 100, height: 300,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_beach: {
        id: 'junglePath_beach',
        name: 'Beach Path',
        x: 400, y: 1400,
        width: 200, height: 100,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_pool: {
        id: 'junglePath_pool',
        name: 'Pool Path',
        x: 750, y: 1450,
        width: 150, height: 150,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_east: {
        id: 'junglePath_east',
        name: 'East Trail',
        x: 2100, y: 650,
        width: 100, height: 350,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_helipad: {
        id: 'junglePath_helipad',
        name: 'Helipad Path',
        x: 2200, y: 1000,
        width: 100, height: 200,
        color: 0x2a5a2a,
        isPath: true
    },
    junglePath_server: {
        id: 'junglePath_server',
        name: 'Service Path',
        x: 1870, y: 1350,
        width: 130, height: 80,
        color: 0x2a5a2a,
        isPath: true
    }
};

// Vent connections (for impostor travel)
const VENTS = [
    { id: 'vent1', x: 750, y: 850, room: 'masterSuite', connections: ['vent2', 'vent3'] },
    { id: 'vent2', x: 1850, y: 750, room: 'guestVilla1', connections: ['vent1', 'vent4'] },
    { id: 'vent3', x: 750, y: 1200, room: 'kitchen', connections: ['vent1', 'vent5'] },
    { id: 'vent4', x: 2050, y: 1450, room: 'serverRoom', connections: ['vent2', 'vent6'] },
    { id: 'vent5', x: 1350, y: 1650, room: 'poolArea', connections: ['vent3', 'vent6'] },
    { id: 'vent6', x: 300, y: 450, room: 'temple', connections: ['vent4', 'vent5'] },
    { id: 'vent7', x: 1700, y: 1400, room: 'securityOffice', connections: ['vent2', 'vent4'] },
    { id: 'vent8', x: 950, y: 450, room: 'basement', connections: ['vent1', 'vent6'] }
];

// Task locations with funny names
const TASK_LOCATIONS = [
    { id: 'task_wires1', room: 'mainHall', x: 1300, y: 850, taskType: 'wires', name: 'Fix Wiring' },
    { id: 'task_wires2', room: 'serverRoom', x: 2100, y: 1480, taskType: 'wires', name: 'Fix Wiring' },
    { id: 'task_reactor', room: 'basement', x: 1000, y: 450, taskType: 'reactor', name: 'Start Reactor' },
    { id: 'task_download1', room: 'securityOffice', x: 1750, y: 1420, taskType: 'download', name: 'Download Data' },
    { id: 'task_download2', room: 'temple', x: 320, y: 450, taskType: 'upload', name: 'Upload Data' },
    { id: 'task_swipe', room: 'mainHall', x: 1500, y: 950, taskType: 'swipe', name: 'Swipe Card' },
    { id: 'task_fuel1', room: 'helipad', x: 2420, y: 1120, taskType: 'fuel', name: 'Fuel Helicopter' },
    { id: 'task_trash', room: 'kitchen', x: 850, y: 1220, taskType: 'trash', name: 'Empty Garbage' },
    { id: 'task_asteroids', room: 'dock', x: 180, y: 1350, taskType: 'asteroids', name: 'Clear Debris' },
    { id: 'task_medscan', room: 'guestVilla1', x: 1950, y: 780, taskType: 'medscan', name: 'Submit Scan' },
    { id: 'task_leaves', room: 'poolArea', x: 1400, y: 1700, taskType: 'leaves', name: 'Clean Pool' },
    { id: 'task_align', room: 'tennisCourt', x: 2350, y: 500, taskType: 'align', name: 'Align Equipment' },
    { id: 'task_prime', room: 'masterSuite', x: 850, y: 850, taskType: 'prime', name: 'Prime Shields' },
    { id: 'task_calibrate', room: 'diningRoom', x: 1250, y: 1300, taskType: 'calibrate', name: 'Calibrate Systems' },
    { id: 'task_keys', room: 'securityOffice', x: 1700, y: 1480, taskType: 'keys', name: 'Insert Keys' },
    { id: 'task_beach', room: 'beach', x: 300, y: 1700, taskType: 'leaves', name: 'Clean Pool' },
    { id: 'task_villa', room: 'guestVilla2', x: 1950, y: 1100, taskType: 'prime', name: 'Prime Shields' }
];

// Sabotage locations
const SABOTAGE_TARGETS = {
    lights: { room: 'serverRoom', x: 2080, y: 1500 },
    comms: { room: 'securityOffice', x: 1720, y: 1450 },
    reactor: { room: 'basement', x: 950, y: 420 },
    o2: { room: 'mainHall', x: 1350, y: 900 }
};

// Door connections between rooms (for pathfinding)
const DOORS = [
    // Main hall connections
    { from: 'mainHall', to: 'hallway_main_west', x: 1200, y: 890 },
    { from: 'hallway_main_west', to: 'masterSuite', x: 1000, y: 890 },
    { from: 'mainHall', to: 'hallway_main_east', x: 1600, y: 890 },
    { from: 'hallway_main_east', to: 'guestVilla1', x: 1800, y: 890 },
    { from: 'mainHall', to: 'hallway_main_south', x: 1400, y: 1100 },
    { from: 'hallway_main_south', to: 'diningRoom', x: 1400, y: 1200 },
    { from: 'mainHall', to: 'hallway_main_north', x: 1400, y: 800 },
    { from: 'hallway_main_north', to: 'basement', x: 1100, y: 570 },
    
    // Kitchen connections
    { from: 'masterSuite', to: 'kitchen', x: 800, y: 980 },
    { from: 'kitchen', to: 'hallway_kitchen', x: 980, y: 1200 },
    { from: 'hallway_kitchen', to: 'diningRoom', x: 1100, y: 1300 },
    
    // Guest villa connections
    { from: 'guestVilla1', to: 'hallway_guest_connect', x: 1840, y: 900 },
    { from: 'hallway_guest_connect', to: 'guestVilla2', x: 1840, y: 1000 },
    { from: 'guestVilla2', to: 'junglePath_server', x: 1900, y: 1250 },
    { from: 'junglePath_server', to: 'securityOffice', x: 1870, y: 1400 },
    { from: 'securityOffice', to: 'serverRoom', x: 1870, y: 1450 },
    
    // Pool connections
    { from: 'diningRoom', to: 'poolArea', x: 1300, y: 1420 },
    { from: 'poolArea', to: 'junglePath_pool', x: 1200, y: 1650 },
    
    // Temple and dock connections
    { from: 'temple', to: 'junglePath_temple', x: 480, y: 450 },
    { from: 'junglePath_temple', to: 'junglePath_dock', x: 400, y: 700 },
    { from: 'junglePath_dock', to: 'dock', x: 300, y: 1200 },
    { from: 'dock', to: 'beach', x: 300, y: 1500 },
    { from: 'beach', to: 'junglePath_beach', x: 400, y: 1500 },
    { from: 'junglePath_beach', to: 'junglePath_pool', x: 600, y: 1500 },
    { from: 'junglePath_pool', to: 'kitchen', x: 800, y: 1320 },
    
    // East side connections
    { from: 'guestVilla1', to: 'junglePath_east', x: 2080, y: 780 },
    { from: 'junglePath_east', to: 'tennisCourt', x: 2200, y: 620 },
    { from: 'junglePath_east', to: 'junglePath_helipad', x: 2200, y: 1000 },
    { from: 'junglePath_helipad', to: 'helipad', x: 2300, y: 1100 },
    { from: 'serverRoom', to: 'junglePath_helipad', x: 2200, y: 1400 }
];

// Spawn points in main hall
const SPAWN_POINTS = [
    { x: 1300, y: 900, room: 'mainHall' },
    { x: 1400, y: 950, room: 'mainHall' },
    { x: 1350, y: 1000, room: 'mainHall' },
    { x: 1250, y: 950, room: 'mainHall' },
    { x: 1200, y: 900, room: 'mainHall' },
    { x: 1450, y: 900, room: 'mainHall' },
    { x: 1500, y: 950, room: 'mainHall' },
    { x: 1350, y: 850, room: 'mainHall' },
    { x: 1300, y: 1050, room: 'mainHall' },
    { x: 1400, y: 1050, room: 'mainHall' }
];

// Emergency button location
const EMERGENCY_BUTTON = {
    x: 1400,
    y: 950,
    room: 'mainHall',
    radius: 50
};

// Pathfinding graph for AI movement
const PATHFINDING_NODES = {};
const PATHFINDING_EDGES = [];

// Build pathfinding graph from rooms
function buildPathfindingGraph() {
    // Create nodes at center of each room
    Object.entries(ROOMS).forEach(([id, room]) => {
        PATHFINDING_NODES[id] = {
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
            room: room
        };
    });
    
    // Create edges from door connections
    DOORS.forEach(door => {
        PATHFINDING_EDGES.push({
            from: door.from,
            to: door.to,
            weight: calculateDistance(PATHFINDING_NODES[door.from], PATHFINDING_NODES[door.to])
        });
    });
}

function calculateDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// A* pathfinding
function findPath(startRoom, endRoom) {
    if (!PATHFINDING_NODES[startRoom] || !PATHFINDING_NODES[endRoom]) {
        return null;
    }
    
    const openSet = [startRoom];
    const cameFrom = {};
    const gScore = { [startRoom]: 0 };
    const fScore = { [startRoom]: heuristic(startRoom, endRoom) };
    
    while (openSet.length > 0) {
        // Get node with lowest fScore
        let current = openSet[0];
        let lowestF = fScore[current];
        
        openSet.forEach(node => {
            if (fScore[node] < lowestF) {
                lowestF = fScore[node];
                current = node;
            }
        });
        
        if (current === endRoom) {
            return reconstructPath(cameFrom, current);
        }
        
        openSet.splice(openSet.indexOf(current), 1);
        
        // Get neighbors
        const neighbors = getNeighbors(current);
        
        neighbors.forEach(neighbor => {
            const tentativeG = gScore[current] + getEdgeWeight(current, neighbor);
            
            if (tentativeG < (gScore[neighbor] || Infinity)) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeG;
                fScore[neighbor] = tentativeG + heuristic(neighbor, endRoom);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        });
    }
    
    return null; // No path found
}

function heuristic(a, b) {
    return calculateDistance(PATHFINDING_NODES[a], PATHFINDING_NODES[b]);
}

function getNeighbors(nodeId) {
    const neighbors = [];
    
    PATHFINDING_EDGES.forEach(edge => {
        if (edge.from === nodeId) {
            neighbors.push(edge.to);
        } else if (edge.to === nodeId) {
            neighbors.push(edge.from);
        }
    });
    
    return neighbors;
}

function getEdgeWeight(from, to) {
    const edge = PATHFINDING_EDGES.find(e => 
        (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    return edge ? edge.weight : Infinity;
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    
    while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
    }
    
    return path;
}

// Get random room for wandering
function getRandomRoom(excludeHallways = false) {
    const rooms = Object.entries(ROOMS).filter(([id, room]) => {
        if (excludeHallways && (room.isHallway || room.isPath)) return false;
        return true;
    });
    
    return rooms[Math.floor(Math.random() * rooms.length)];
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
        
        // Make a walkable corridor
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
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

// Initialize pathfinding on load
buildPathfindingGraph();
