import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    moveSpeed: 50,
    lookSpeed: 0.002,
    interactionDistance: 15,
    gravity: -30,
    jumpHeight: 10,
    dayDuration: 300, // seconds for full day cycle
    startTime: 0.6, // Start at late afternoon (0-1)
};

// ============================================
// GAME STATE
// ============================================

const gameState = {
    isPlaying: false,
    isPaused: false,
    time: CONFIG.startTime,
    evidenceCollected: [],
    npcsSpoken: [],
    currentLocation: 'Beach - South Shore',
    inDialogue: false,
    currentDialogue: null,
    dialogueIndex: 0,
    canInteract: null,
};

// ============================================
// THREE.JS SETUP
// ============================================

let scene, camera, renderer, controls;
let water, sky, sun;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let playerHeight = 8;
let canJump = true;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let interactables = [];
let npcs = [];
let minimapCtx;

// ============================================
// ISLAND LAYOUT DATA
// Based on aerial imagery of Little St. James
// ============================================

const ISLAND_LAYOUT = {
    // Island is roughly boomerang/crescent shaped, about 70 acres
    // We'll scale to roughly 500x300 units
    terrain: {
        width: 500,
        height: 300,
        maxElevation: 40,
    },
    buildings: [
        {
            id: 'temple',
            name: 'The Temple',
            position: { x: -180, z: -80 },
            size: { w: 20, h: 25, d: 20 },
            color: 0xd4af37, // Gold/cream base
            description: 'The infamous blue and white striped temple structure.',
            hasInterior: true,
        },
        {
            id: 'main_mansion',
            name: 'Main Residence',
            position: { x: 50, z: 0 },
            size: { w: 60, h: 15, d: 40 },
            color: 0xf5f5dc,
            description: 'The main residential complex.',
            hasInterior: true,
        },
        {
            id: 'guest_house_1',
            name: 'Guest Villa A',
            position: { x: 120, z: 60 },
            size: { w: 25, h: 10, d: 20 },
            color: 0xfaf0e6,
            description: 'One of several guest accommodations.',
        },
        {
            id: 'guest_house_2',
            name: 'Guest Villa B',
            position: { x: 150, z: 20 },
            size: { w: 20, h: 10, d: 15 },
            color: 0xfaf0e6,
            description: 'Another guest building.',
        },
        {
            id: 'staff_quarters',
            name: 'Staff Quarters',
            position: { x: -50, z: 80 },
            size: { w: 30, h: 8, d: 20 },
            color: 0xe8e8e8,
            description: 'Housing for island staff.',
        },
        {
            id: 'sundial',
            name: 'Sundial Plaza',
            position: { x: 0, z: -60 },
            size: { w: 30, h: 3, d: 30 },
            color: 0xcccccc,
            description: 'A large decorative sundial structure.',
            isFlat: true,
        },
        {
            id: 'helipad',
            name: 'Helipad',
            position: { x: 180, z: -40 },
            size: { w: 25, h: 0.5, d: 25 },
            color: 0x333333,
            description: 'The island\'s helicopter landing pad.',
            isFlat: true,
        },
        {
            id: 'pool_house',
            name: 'Pool House',
            position: { x: 80, z: -30 },
            size: { w: 15, h: 6, d: 10 },
            color: 0xffffff,
            description: 'Pool facilities.',
        },
        {
            id: 'guardhouse',
            name: 'Security Station',
            position: { x: 200, z: 0 },
            size: { w: 10, h: 6, d: 8 },
            color: 0xd3d3d3,
            description: 'Security monitoring station.',
        },
    ],
    paths: [
        { from: { x: 50, z: 0 }, to: { x: -180, z: -80 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 120, z: 60 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 0, z: -60 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 180, z: -40 }, width: 4 },
        { from: { x: 0, z: -60 }, to: { x: -180, z: -80 }, width: 3 },
    ],
    vegetation: {
        palmCount: 150,
        bushCount: 200,
    },
};

// ============================================
// NPC DATA
// ============================================

const NPC_DATA = [
    {
        id: 'groundskeeper',
        name: 'Former Groundskeeper',
        position: { x: -30, z: 50 },
        color: 0x4a7c59,
        dialogue: [
            "You're not supposed to be here, you know.",
            "I worked the grounds for three years. Saw things... strange things.",
            "The temple? Off limits to most staff. Only certain people went up there.",
            "Private jets coming in at all hours. Boats in the middle of the night.",
            "I signed an NDA. But what good is silence when you can't sleep at night?",
            "Look around if you must. But be careful what you find.",
        ],
    },
    {
        id: 'journalist',
        name: 'Investigative Journalist',
        position: { x: 100, z: -50 },
        color: 0x2c3e50,
        dialogue: [
            "Finally, someone else digging into this.",
            "I've been tracking flight logs for months. The patterns are... disturbing.",
            "Powerful people. Very powerful. Some names would shock you.",
            "The security here was intense. Cameras everywhere, except certain rooms.",
            "Check the staff quarters. There's evidence of a surveillance system.",
            "Be careful. People who ask too many questions tend to have accidents.",
        ],
    },
    {
        id: 'witness',
        name: 'Anonymous Witness',
        position: { x: -150, z: -40 },
        color: 0x7f8c8d,
        dialogue: [
            "I can't tell you my name. Please understand.",
            "I was brought here when I was young. Too young.",
            "The temple... it wasn't for worship. Not any god I know.",
            "There were others. Many others. Some I never saw leave.",
            "The blue and white stripes - I see them in my nightmares still.",
            "Document everything. The world needs to know what happened here.",
        ],
    },
    {
        id: 'security',
        name: 'Ex-Security Personnel',
        position: { x: 190, z: 10 },
        color: 0x34495e,
        dialogue: [
            "State your business.",
            "...Fine. I don't work for them anymore anyway.",
            "We were paid well to see nothing. Hear nothing.",
            "Guest lists were burned after every visit. No records.",
            "But I kept notes. Hidden them somewhere on the island.",
            "Near the sundial. Under the third stone. If you're brave enough.",
        ],
    },
    {
        id: 'dockworker',
        name: 'Former Dock Worker',
        position: { x: 220, z: 80 },
        color: 0x8b4513,
        dialogue: [
            "The boats came at odd hours. Real odd.",
            "Luxury yachts, mostly. Sometimes cargo containers.",
            "What was in them? We weren't allowed to ask.",
            "Saw some faces though. Famous faces. Politicians. Actors.",
            "They'd go straight to the main house. Never stayed at the dock long.",
            "The manifests were always 'supplies.' Every single time. Just 'supplies.'",
        ],
    },
];

// ============================================
// EVIDENCE DATA
// ============================================

const EVIDENCE_DATA = [
    {
        id: 'flight_log',
        name: 'Flight Log Fragment',
        position: { x: 175, z: -35 },
        content: `PARTIAL FLIGHT LOG - PRIVATE AIRCRAFT
Date: [REDACTED]
Origin: Teterboro, NJ
Destination: STT (St. Thomas) → Little St. James
Passengers: 
- [NAME REDACTED] + 3 guests
- Special cargo manifest attached
Note: Ground transport arranged. No customs.`,
        found: false,
    },
    {
        id: 'security_note',
        name: 'Security Protocol',
        position: { x: 5, z: -65 },
        content: `SECURITY DIRECTIVE #47
All cameras in Zone B to be disabled during 
VIP visits. Recording prohibited.
Guest phones to be collected upon arrival.
Staff restricted to designated areas only.
Violation = immediate termination.
Remember: You saw nothing. You know nothing.`,
        found: false,
    },
    {
        id: 'temple_key',
        name: 'Temple Keycard',
        position: { x: -175, z: -75 },
        content: `Electronic keycard with gold trim.
Access Level: PRIVATE
Last Used: [CORRUPTED DATA]
The back has strange symbols etched into it.
Whatever rituals happened in the temple,
this granted access to them.`,
        found: false,
    },
    {
        id: 'guest_list',
        name: 'Partial Guest Registry',
        position: { x: 55, z: 5 },
        content: `GUEST REGISTRY - FRAGMENT
Page appears burned at edges.
Visible entries:
- March: "The Prince" + delegation
- April: "Hollywood Friend" + 2
- May: "The Professor" + students
- June: [BURNED]
- July: "The Governor" + aide
Names deliberately coded.`,
        found: false,
    },
    {
        id: 'construction_order',
        name: 'Construction Order',
        position: { x: -185, z: -85 },
        content: `PRIVATE CONSTRUCTION - URGENT
Temple structure modifications:
- Underground level expansion
- Soundproofing all chambers  
- Remove all windows below ground
- Install steel reinforced doors
- Separate HVAC system
Contractor note: "Client insists on 
complete discretion. Premium paid."`,
        found: false,
    },
    {
        id: 'photo_fragment',
        name: 'Torn Photograph',
        position: { x: 125, z: 55 },
        content: `A torn photograph showing partial faces.
Several well-dressed individuals at what 
appears to be a party. Crystal glasses,
expensive watches visible.
One face is circled in red marker.
Someone wrote on the back:
"They all knew. They all participated."`,
        found: false,
    },
    {
        id: 'medical_supplies',
        name: 'Medical Supply Invoice',
        position: { x: -45, z: 75 },
        content: `MEDICAL SUPPLIES - RUSH ORDER
Destination: Little St. James Island
- Sedatives (industrial quantity)
- First aid supplies
- [REDACTED] medication
- Pregnancy tests (bulk)
- Morning after medication (bulk)
Billing: Personal account. NO RECORDS.`,
        found: false,
    },
    {
        id: 'staff_diary',
        name: 'Staff Member\'s Diary',
        position: { x: -55, z: 85 },
        content: `Personal diary entry:
"I can't do this anymore. The things I've 
seen... the screaming at night... the young 
faces... I signed an NDA but my conscience 
won't let me forget.

Tomorrow I'm taking photos. Evidence.
They can't silence everyone forever.

God forgive me for staying this long."

The remaining pages are blank.`,
        found: false,
    },
];

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(200, playerHeight + 10, 100);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Controls
    controls = new PointerLockControls(camera, document.body);
    
    // Setup scene elements
    createSky();
    createWater();
    createIsland();
    createBuildings();
    createVegetation();
    createPaths();
    createNPCs();
    createEvidence();
    createLighting();
    setupMinimap();
    
    // Event listeners
    setupEventListeners();
    
    // Show start button when loaded
    setTimeout(() => {
        document.getElementById('start-btn').style.display = 'block';
    }, 2000);
    
    // Start render loop
    animate();
}

// ============================================
// SKY & ATMOSPHERE
// ============================================

function createSky() {
    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    sun = new THREE.Vector3();
    
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    updateSun();
}

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - (gameState.time * 180 - 90));
    const theta = THREE.MathUtils.degToRad(180);
    
    sun.setFromSphericalCoords(1, phi, theta);
    
    sky.material.uniforms['sunPosition'].value.copy(sun);
    
    if (water) {
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    }
    
    // Update fog color based on time
    const dayColor = new THREE.Color(0x87ceeb);
    const sunsetColor = new THREE.Color(0xff7f50);
    const nightColor = new THREE.Color(0x1a1a2e);
    
    let fogColor;
    if (gameState.time < 0.25) {
        // Night to dawn
        fogColor = nightColor.clone().lerp(dayColor, gameState.time * 4);
    } else if (gameState.time < 0.75) {
        // Day
        fogColor = dayColor;
    } else if (gameState.time < 0.85) {
        // Sunset
        const t = (gameState.time - 0.75) * 10;
        fogColor = dayColor.clone().lerp(sunsetColor, t);
    } else {
        // Dusk to night
        const t = (gameState.time - 0.85) * 6.67;
        fogColor = sunsetColor.clone().lerp(nightColor, t);
    }
    
    scene.fog.color.copy(fogColor);
    scene.background.copy(fogColor);
}

// ============================================
// WATER
// ============================================

function createWater() {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load(
            'https://threejs.org/examples/textures/waternormals.jpg',
            function(texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    });
    
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);
}

// ============================================
// ISLAND TERRAIN
// ============================================

function createIsland() {
    // Create the main island shape - crescent/boomerang
    const islandShape = new THREE.Shape();
    
    // Outer perimeter
    islandShape.moveTo(-200, -120);
    islandShape.bezierCurveTo(-250, -50, -220, 50, -150, 100);
    islandShape.bezierCurveTo(-50, 130, 100, 120, 180, 80);
    islandShape.bezierCurveTo(250, 40, 260, -20, 230, -60);
    islandShape.bezierCurveTo(200, -100, 100, -110, 0, -100);
    islandShape.bezierCurveTo(-100, -90, -150, -110, -200, -120);
    
    // Create beach ring (slightly larger, flat)
    const beachGeometry = new THREE.ExtrudeGeometry(islandShape, {
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 30,
        bevelSize: 20,
        bevelSegments: 3
    });
    
    const beachMaterial = new THREE.MeshStandardMaterial({
        color: 0xf4e4c1,
        roughness: 0.9,
        metalness: 0
    });
    
    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.rotation.x = -Math.PI / 2;
    beach.position.y = -1;
    beach.receiveShadow = true;
    scene.add(beach);
    
    // Create main terrain (elevated center)
    const terrainGeometry = new THREE.ExtrudeGeometry(islandShape, {
        depth: 15,
        bevelEnabled: true,
        bevelThickness: 5,
        bevelSize: -15,
        bevelSegments: 2
    });
    
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d5c3d,
        roughness: 0.85,
        metalness: 0
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = 0;
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);
    
    // Add some terrain variation with hills
    const hillPositions = [
        { x: -180, z: -80, height: 25, radius: 40 }, // Temple hill
        { x: 50, z: 0, height: 10, radius: 60 },     // Main mansion area
        { x: -80, z: 40, height: 15, radius: 35 },   // Secondary hill
        { x: 150, z: 30, height: 8, radius: 30 },    // East area
    ];
    
    hillPositions.forEach(hill => {
        const hillGeometry = new THREE.ConeGeometry(hill.radius, hill.height, 16);
        const hillMesh = new THREE.Mesh(hillGeometry, terrainMaterial.clone());
        hillMesh.material.color.setHex(0x2d4c2d);
        hillMesh.position.set(hill.x, hill.height / 2, hill.z);
        hillMesh.receiveShadow = true;
        hillMesh.castShadow = true;
        scene.add(hillMesh);
    });
}

// ============================================
// BUILDINGS
// ============================================

function createBuildings() {
    ISLAND_LAYOUT.buildings.forEach(building => {
        const group = new THREE.Group();
        group.position.set(building.position.x, 0, building.position.z);
        
        if (building.id === 'temple') {
            createTemple(group, building);
        } else if (building.id === 'sundial') {
            createSundial(group, building);
        } else if (building.id === 'helipad') {
            createHelipad(group, building);
        } else {
            createGenericBuilding(group, building);
        }
        
        // Make building interactable
        group.userData = {
            type: 'building',
            id: building.id,
            name: building.name,
            description: building.description,
        };
        
        interactables.push(group);
        scene.add(group);
    });
}

function createTemple(group, data) {
    // The iconic blue and white striped temple
    const baseHeight = 25;
    
    // Main structure - square base
    const baseGeometry = new THREE.BoxGeometry(data.size.w, baseHeight, data.size.d);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5dc, // Cream base
        roughness: 0.7,
        metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = baseHeight / 2 + 25; // On the hill
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Blue and white stripes
    const stripeCount = 6;
    const stripeHeight = baseHeight / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        const stripeGeometry = new THREE.BoxGeometry(data.size.w + 0.2, stripeHeight, data.size.d + 0.2);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x1e90ff : 0xffffff, // Alternating blue and white
            roughness: 0.5,
            metalness: 0.2
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.y = baseHeight / 2 + 25 - baseHeight/2 + stripeHeight/2 + i * stripeHeight;
        group.add(stripe);
    }
    
    // Golden dome on top
    const domeGeometry = new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = baseHeight + 25;
    dome.castShadow = true;
    group.add(dome);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(4, 8, 0.5);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.6,
        metalness: 0.3
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 29, data.size.d / 2 + 0.2);
    group.add(door);
    
    // Owl statues flanking entrance
    const owlGeometry = new THREE.ConeGeometry(2, 5, 4);
    const owlMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.4,
        metalness: 0.6
    });
    
    [-1, 1].forEach(side => {
        const owl = new THREE.Mesh(owlGeometry, owlMaterial);
        owl.position.set(side * 7, 27, data.size.d / 2 + 3);
        owl.castShadow = true;
        group.add(owl);
    });
}

function createSundial(group, data) {
    // Circular base
    const baseGeometry = new THREE.CylinderGeometry(15, 15, 2, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4d4d4,
        roughness: 0.7,
        metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    base.receiveShadow = true;
    group.add(base);
    
    // Compass rose pattern
    const roseGeometry = new THREE.RingGeometry(5, 14, 32);
    const roseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.6,
        side: THREE.DoubleSide
    });
    const rose = new THREE.Mesh(roseGeometry, roseMaterial);
    rose.rotation.x = -Math.PI / 2;
    rose.position.y = 2.1;
    group.add(rose);
    
    // Central gnomon
    const gnomonGeometry = new THREE.ConeGeometry(1, 10, 4);
    const gnomonMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.5
    });
    const gnomon = new THREE.Mesh(gnomonGeometry, gnomonMaterial);
    gnomon.position.y = 7;
    gnomon.castShadow = true;
    group.add(gnomon);
}

function createHelipad(group, data) {
    // Circular pad
    const padGeometry = new THREE.CylinderGeometry(12, 12, 0.5, 32);
    const padMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.1
    });
    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.y = 0.25;
    pad.receiveShadow = true;
    group.add(pad);
    
    // H marking
    const hGeometry = new THREE.BoxGeometry(8, 0.1, 2);
    const hMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7
    });
    
    const h1 = new THREE.Mesh(hGeometry, hMaterial);
    h1.position.set(-3, 0.6, 0);
    h1.rotation.y = Math.PI / 2;
    group.add(h1);
    
    const h2 = new THREE.Mesh(hGeometry, hMaterial);
    h2.position.set(3, 0.6, 0);
    h2.rotation.y = Math.PI / 2;
    group.add(h2);
    
    const h3 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 2), hMaterial);
    h3.position.set(0, 0.6, 0);
    group.add(h3);
}

function createGenericBuilding(group, data) {
    // Main structure
    const buildingGeometry = new THREE.BoxGeometry(data.size.w, data.size.h, data.size.d);
    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.8,
        metalness: 0
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = data.size.h / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);
    
    // Roof
    const roofGeometry = new THREE.BoxGeometry(data.size.w + 2, 1, data.size.d + 2);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = data.size.h + 0.5;
    roof.castShadow = true;
    group.add(roof);
    
    // Windows
    const windowGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    
    const windowCount = Math.floor(data.size.w / 8);
    for (let i = 0; i < windowCount; i++) {
        const win = new THREE.Mesh(windowGeometry, windowMaterial);
        win.position.set(
            -data.size.w/2 + 4 + i * 8,
            data.size.h / 2,
            data.size.d / 2 + 0.1
        );
        group.add(win);
        
        const winBack = win.clone();
        winBack.position.z = -data.size.d / 2 - 0.1;
        group.add(winBack);
    }
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(3, 5, 0.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.6,
        metalness: 0
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2.5, data.size.d / 2 + 0.1);
    group.add(door);
}

// ============================================
// VEGETATION
// ============================================

function createVegetation() {
    // Palm trees
    const palmPositions = [];
    for (let i = 0; i < ISLAND_LAYOUT.vegetation.palmCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 150;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        // Check if position is valid (not on buildings)
        let valid = true;
        ISLAND_LAYOUT.buildings.forEach(b => {
            const dx = x - b.position.x;
            const dz = z - b.position.z;
            if (Math.sqrt(dx*dx + dz*dz) < 30) valid = false;
        });
        
        if (valid) {
            palmPositions.push({ x, z });
        }
    }
    
    palmPositions.forEach(pos => {
        createPalmTree(pos.x, pos.z);
    });
    
    // Bushes
    for (let i = 0; i < ISLAND_LAYOUT.vegetation.bushCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 180;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        createBush(x, z);
    }
}

function createPalmTree(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    // Trunk
    const trunkHeight = 8 + Math.random() * 8;
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    group.add(trunk);
    
    // Fronds
    const frondMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 7; i++) {
        const frondGeometry = new THREE.PlaneGeometry(1, 6);
        const frond = new THREE.Mesh(frondGeometry, frondMaterial);
        frond.position.y = trunkHeight;
        frond.rotation.x = -Math.PI / 4;
        frond.rotation.y = (i / 7) * Math.PI * 2;
        frond.position.x = Math.cos(frond.rotation.y) * 0.5;
        frond.position.z = Math.sin(frond.rotation.y) * 0.5;
        frond.castShadow = true;
        group.add(frond);
    }
    
    scene.add(group);
}

function createBush(x, z) {
    const bushGeometry = new THREE.SphereGeometry(1 + Math.random(), 8, 6);
    const bushMaterial = new THREE.MeshStandardMaterial({
        color: 0x2e8b2e,
        roughness: 0.9
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, 0.5, z);
    bush.scale.y = 0.7;
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
}

// ============================================
// PATHS
// ============================================

function createPaths() {
    const pathMaterial = new THREE.MeshStandardMaterial({
        color: 0xc2b280,
        roughness: 0.9,
        metalness: 0
    });
    
    ISLAND_LAYOUT.paths.forEach(path => {
        const dx = path.to.x - path.from.x;
        const dz = path.to.z - path.from.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        
        const pathGeometry = new THREE.BoxGeometry(path.width, 0.2, length);
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.position.set(
            (path.from.x + path.to.x) / 2,
            0.1,
            (path.from.z + path.to.z) / 2
        );
        pathMesh.rotation.y = angle;
        pathMesh.receiveShadow = true;
        scene.add(pathMesh);
    });
}

// ============================================
// NPCs
// ============================================

function createNPCs() {
    NPC_DATA.forEach(npcData => {
        const group = new THREE.Group();
        group.position.set(npcData.position.x, 0, npcData.position.z);
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(1.5, 4, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: npcData.color,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 4;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(1.2, 16, 12);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xdeb887,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 7.5;
        head.castShadow = true;
        group.add(head);
        
        // Indicator above head
        const indicatorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = 10;
        indicator.userData.isIndicator = true;
        group.add(indicator);
        
        group.userData = {
            type: 'npc',
            id: npcData.id,
            name: npcData.name,
            dialogue: npcData.dialogue,
            dialogueIndex: 0,
        };
        
        npcs.push(group);
        interactables.push(group);
        scene.add(group);
    });
}

// ============================================
// EVIDENCE
// ============================================

function createEvidence() {
    EVIDENCE_DATA.forEach(evidence => {
        const group = new THREE.Group();
        group.position.set(evidence.position.x, 1, evidence.position.z);
        
        // Glowing document/object
        const docGeometry = new THREE.BoxGeometry(1.5, 0.1, 2);
        const docMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,
            roughness: 0.5,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        const doc = new THREE.Mesh(docGeometry, docMaterial);
        doc.castShadow = true;
        group.add(doc);
        
        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        group.userData = {
            type: 'evidence',
            id: evidence.id,
            name: evidence.name,
            content: evidence.content,
            found: false,
        };
        
        interactables.push(group);
        scene.add(group);
    });
}

// ============================================
// LIGHTING
// ============================================

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Directional sun light
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);
    
    // Hemisphere light for sky bounce
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.4);
    scene.add(hemiLight);
}

// ============================================
// MINIMAP
// ============================================

function setupMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    canvas.width = 150;
    canvas.height = 150;
    minimapCtx = canvas.getContext('2d');
}

function updateMinimap() {
    if (!minimapCtx) return;
    
    minimapCtx.fillStyle = '#1a3d1a';
    minimapCtx.fillRect(0, 0, 150, 150);
    
    const scale = 0.25;
    const offsetX = 75;
    const offsetZ = 75;
    
    // Draw buildings
    minimapCtx.fillStyle = '#888';
    ISLAND_LAYOUT.buildings.forEach(b => {
        const x = b.position.x * scale + offsetX;
        const z = b.position.z * scale + offsetZ;
        const w = (b.size.w || 10) * scale;
        const h = (b.size.d || 10) * scale;
        minimapCtx.fillRect(x - w/2, z - h/2, w, h);
    });
    
    // Draw NPCs
    minimapCtx.fillStyle = '#0f0';
    npcs.forEach(npc => {
        const x = npc.position.x * scale + offsetX;
        const z = npc.position.z * scale + offsetZ;
        minimapCtx.beginPath();
        minimapCtx.arc(x, z, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    });
    
    // Draw player
    minimapCtx.fillStyle = '#fff';
    const px = camera.position.x * scale + offsetX;
    const pz = camera.position.z * scale + offsetZ;
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, 4, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw player direction
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    minimapCtx.strokeStyle = '#fff';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, pz);
    minimapCtx.lineTo(px + dir.x * 10, pz + dir.z * 10);
    minimapCtx.stroke();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // Pointer lock
    document.addEventListener('click', () => {
        if (gameState.isPlaying && !gameState.inDialogue) {
            controls.lock();
        }
    });
    
    controls.addEventListener('lock', () => {
        gameState.isPaused = false;
    });
    
    controls.addEventListener('unlock', () => {
        if (gameState.isPlaying) {
            gameState.isPaused = true;
        }
    });
    
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Mobile controls
    setupMobileControls();
}

function startGame() {
    document.getElementById('loading-screen').classList.add('hidden');
    gameState.isPlaying = true;
    controls.lock();
}

function onKeyDown(event) {
    if (!gameState.isPlaying) return;
    
    if (gameState.inDialogue) {
        if (event.code === 'Space' || event.code === 'Enter') {
            advanceDialogue();
        }
        return;
    }
    
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = CONFIG.jumpHeight;
                canJump = false;
            }
            break;
        case 'KeyE':
            interact();
            break;
        case 'Escape':
            closeEvidence();
            break;
        case 'Tab':
            event.preventDefault();
            toggleInventory();
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupMobileControls() {
    const joystickMove = document.getElementById('joystick-move');
    const joystickLook = document.getElementById('joystick-look');
    const mobileInteract = document.getElementById('mobile-interact');
    
    let moveTouch = null;
    let lookTouch = null;
    
    joystickMove.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveTouch = e.touches[0];
    });
    
    joystickMove.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (moveTouch) {
            const touch = e.touches[0];
            const rect = joystickMove.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = (touch.clientX - centerX) / 50;
            const dz = (touch.clientY - centerY) / 50;
            
            moveForward = dz < -0.3;
            moveBackward = dz > 0.3;
            moveLeft = dx < -0.3;
            moveRight = dx > 0.3;
        }
    });
    
    joystickMove.addEventListener('touchend', () => {
        moveTouch = null;
        moveForward = moveBackward = moveLeft = moveRight = false;
    });
    
    mobileInteract.addEventListener('touchstart', (e) => {
        e.preventDefault();
        interact();
    });
}

// ============================================
// INTERACTION SYSTEM
// ============================================

function checkInteractions() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const meshes = [];
    interactables.forEach(obj => {
        obj.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.userData.parentInteractable = obj;
                meshes.push(child);
            }
        });
    });
    
    const intersects = raycaster.intersectObjects(meshes);
    
    const prompt = document.getElementById('interaction-prompt');
    const crosshair = document.getElementById('crosshair');
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        const parent = hit.object.userData.parentInteractable;
        
        if (parent && hit.distance < CONFIG.interactionDistance) {
            gameState.canInteract = parent;
            prompt.textContent = `Press E to interact with ${parent.userData.name}`;
            prompt.classList.add('visible');
            crosshair.classList.add('interact');
            return;
        }
    }
    
    gameState.canInteract = null;
    prompt.classList.remove('visible');
    crosshair.classList.remove('interact');
}

function interact() {
    if (!gameState.canInteract) return;
    
    const obj = gameState.canInteract;
    const data = obj.userData;
    
    switch (data.type) {
        case 'npc':
            startDialogue(data);
            break;
        case 'evidence':
            collectEvidence(obj, data);
            break;
        case 'building':
            showBuildingInfo(data);
            break;
    }
}

function startDialogue(npcData) {
    gameState.inDialogue = true;
    gameState.currentDialogue = npcData;
    gameState.dialogueIndex = 0;
    
    const dialogueBox = document.getElementById('dialogue-box');
    const speaker = document.getElementById('dialogue-speaker');
    const text = document.getElementById('dialogue-text');
    
    speaker.textContent = npcData.name;
    text.textContent = npcData.dialogue[0];
    dialogueBox.classList.add('visible');
    
    controls.unlock();
}

function advanceDialogue() {
    if (!gameState.currentDialogue) return;
    
    gameState.dialogueIndex++;
    
    if (gameState.dialogueIndex >= gameState.currentDialogue.dialogue.length) {
        endDialogue();
        return;
    }
    
    const text = document.getElementById('dialogue-text');
    text.textContent = gameState.currentDialogue.dialogue[gameState.dialogueIndex];
}

function endDialogue() {
    gameState.inDialogue = false;
    
    if (!gameState.npcsSpoken.includes(gameState.currentDialogue.id)) {
        gameState.npcsSpoken.push(gameState.currentDialogue.id);
    }
    
    gameState.currentDialogue = null;
    gameState.dialogueIndex = 0;
    
    document.getElementById('dialogue-box').classList.remove('visible');
    controls.lock();
}

function collectEvidence(obj, data) {
    if (data.found) return;
    
    data.found = true;
    obj.visible = false;
    
    gameState.evidenceCollected.push({
        id: data.id,
        name: data.name,
        content: data.content
    });
    
    showEvidence(data);
    updateInventory();
}

function showEvidence(data) {
    const popup = document.getElementById('evidence-popup');
    const title = document.getElementById('evidence-title');
    const content = document.getElementById('evidence-content');
    
    title.textContent = data.name;
    content.textContent = data.content;
    popup.classList.add('visible');
    
    controls.unlock();
}

function closeEvidence() {
    document.getElementById('evidence-popup').classList.remove('visible');
    if (!gameState.inDialogue) {
        controls.lock();
    }
}

function showBuildingInfo(data) {
    const popup = document.getElementById('evidence-popup');
    const title = document.getElementById('evidence-title');
    const content = document.getElementById('evidence-content');
    
    title.textContent = data.name;
    content.textContent = data.description;
    popup.classList.add('visible');
    
    controls.unlock();
}

function updateInventory() {
    const list = document.getElementById('evidence-list');
    list.innerHTML = '';
    
    gameState.evidenceCollected.forEach(evidence => {
        const li = document.createElement('li');
        li.textContent = `• ${evidence.name}`;
        list.appendChild(li);
    });
}

function toggleInventory() {
    // Could expand this to show full inventory details
}

// ============================================
// LOCATION DETECTION
// ============================================

function updateLocation() {
    const pos = camera.position;
    let closestBuilding = null;
    let closestDist = Infinity;
    
    ISLAND_LAYOUT.buildings.forEach(b => {
        const dx = pos.x - b.position.x;
        const dz = pos.z - b.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < closestDist && dist < 50) {
            closestDist = dist;
            closestBuilding = b;
        }
    });
    
    if (closestBuilding) {
        gameState.currentLocation = closestBuilding.name;
    } else {
        // Determine area by position
        const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (dist > 200) {
            gameState.currentLocation = 'Beach';
        } else if (pos.x < -100) {
            gameState.currentLocation = 'West Ridge';
        } else if (pos.x > 100) {
            gameState.currentLocation = 'East Shore';
        } else {
            gameState.currentLocation = 'Central Grounds';
        }
    }
    
    document.getElementById('location').textContent = `Location: ${gameState.currentLocation}`;
}

// ============================================
// ANIMATION LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.isPlaying || gameState.isPaused) {
        renderer.render(scene, camera);
        return;
    }
    
    const delta = Math.min(clock.getDelta(), 0.1);
    
    // Update time of day
    gameState.time += delta / CONFIG.dayDuration;
    if (gameState.time > 1) gameState.time = 0;
    updateSun();
    
    // Update time display
    const hours = Math.floor(gameState.time * 24);
    const mins = Math.floor((gameState.time * 24 - hours) * 60);
    document.getElementById('time').textContent = 
        `Time: ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    // Water animation
    if (water) {
        water.material.uniforms['time'].value += delta * 0.5;
    }
    
    // Player movement
    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y += CONFIG.gravity * delta;
        
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * CONFIG.moveSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * CONFIG.moveSpeed * delta;
        
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        camera.position.y += velocity.y * delta;
        
        // Ground collision
        if (camera.position.y < playerHeight) {
            velocity.y = 0;
            camera.position.y = playerHeight;
            canJump = true;
        }
        
        // Keep player on island (rough bounds)
        const maxDist = 250;
        const dist = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
        if (dist > maxDist) {
            const angle = Math.atan2(camera.position.z, camera.position.x);
            camera.position.x = Math.cos(angle) * maxDist;
            camera.position.z = Math.sin(angle) * maxDist;
        }
        
        checkInteractions();
        updateLocation();
    }
    
    // Animate NPC indicators
    const time = Date.now() * 0.002;
    npcs.forEach(npc => {
        npc.traverse(child => {
            if (child.userData.isIndicator) {
                child.position.y = 10 + Math.sin(time) * 0.3;
            }
        });
        
        // Make NPCs face player
        const dx = camera.position.x - npc.position.x;
        const dz = camera.position.z - npc.position.z;
        npc.rotation.y = Math.atan2(dx, dz);
    });
    
    updateMinimap();
    renderer.render(scene, camera);
}

// ============================================
// START
// ============================================

init();
