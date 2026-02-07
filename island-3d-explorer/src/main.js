import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    moveSpeed: 800, // VERY fast movement for easy exploration
    lookSpeed: 0.002,
    interactionDistance: 15,
    gravity: -30,
    jumpHeight: 12,
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
    inInterior: null, // Track which building interior player is in
    phoneRinging: false,
    phoneFound: false,
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
let terrainMesh = null; // For ground collision
let interiorScenes = {}; // Store interior scene objects
let exteriorObjects = []; // Store exterior objects to hide/show
let phoneAudioContext = null;
let phoneOscillator = null;

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
// BUILDING INTERIORS DATA
// ============================================

const INTERIOR_DATA = {
    temple: {
        name: 'The Temple',
        size: { w: 40, h: 20, d: 40 },
        color: 0x1a1a2e,
        rooms: [
            { name: 'Main Chamber', offset: { x: 0, z: 0 }, size: { w: 30, h: 18, d: 30 } },
            { name: 'Underground Passage', offset: { x: 0, z: -20 }, size: { w: 10, h: 8, d: 15 } },
        ],
        objects: [
            { type: 'altar', position: { x: 0, y: 0, z: -10 } },
            { type: 'statue', position: { x: -10, y: 0, z: 5 } },
            { type: 'statue', position: { x: 10, y: 0, z: 5 } },
            { type: 'candles', position: { x: -8, y: 0, z: -8 } },
            { type: 'candles', position: { x: 8, y: 0, z: -8 } },
            { type: 'phone', position: { x: 12, y: 1, z: 10 }, isEasterEgg: true },
        ],
        evidence: {
            id: 'ritual_notes',
            name: 'Ritual Notes',
            position: { x: -5, y: 1, z: -12 },
            content: `Handwritten notes on ceremonial procedures:
            
"The ceremony begins at midnight.
All participants must wear the robes.
No recording devices permitted.
What happens here stays here.
The owl watches. The owl knows."

Several pages are torn out.`,
        },
    },
    main_mansion: {
        name: 'Main Residence',
        size: { w: 80, h: 15, d: 60 },
        color: 0x2a2a2a,
        rooms: [
            { name: 'Grand Foyer', offset: { x: 0, z: 20 }, size: { w: 40, h: 12, d: 20 } },
            { name: 'Living Room', offset: { x: -25, z: 0 }, size: { w: 30, h: 12, d: 25 } },
            { name: 'Office', offset: { x: 25, z: 0 }, size: { w: 25, h: 12, d: 20 } },
            { name: 'Dining Hall', offset: { x: 0, z: -15 }, size: { w: 35, h: 12, d: 20 } },
        ],
        objects: [
            { type: 'desk', position: { x: 25, y: 0, z: -5 } },
            { type: 'couch', position: { x: -25, y: 0, z: 5 } },
            { type: 'painting', position: { x: -30, y: 5, z: 0 } },
            { type: 'table', position: { x: 0, y: 0, z: -15 } },
            { type: 'safe', position: { x: 30, y: 0, z: -8 } },
        ],
        evidence: {
            id: 'client_ledger',
            name: 'Client Ledger',
            position: { x: 28, y: 1, z: -3 },
            content: `Financial ledger with coded entries:

"DP-001: Services rendered - $500,000
 HW-042: Annual contribution - $2,000,000
 PR-017: Special arrangement - $750,000
 GV-008: Campaign support - $1,500,000"
 
Note at bottom: "All clients vetted. 
Full discretion guaranteed. 
No paper trail."`,
        },
    },
    guest_house_1: {
        name: 'Guest Villa A',
        size: { w: 35, h: 12, d: 30 },
        color: 0x3a3a3a,
        rooms: [
            { name: 'Suite', offset: { x: 0, z: 0 }, size: { w: 30, h: 10, d: 25 } },
        ],
        objects: [
            { type: 'bed', position: { x: 0, y: 0, z: -8 } },
            { type: 'nightstand', position: { x: -8, y: 0, z: -8 } },
            { type: 'wardrobe', position: { x: 10, y: 0, z: -10 } },
        ],
        evidence: null,
    },
    guest_house_2: {
        name: 'Guest Villa B',
        size: { w: 30, h: 12, d: 25 },
        color: 0x3a3a3a,
        rooms: [
            { name: 'Suite', offset: { x: 0, z: 0 }, size: { w: 25, h: 10, d: 20 } },
        ],
        objects: [
            { type: 'bed', position: { x: 0, y: 0, z: -5 } },
            { type: 'desk', position: { x: -8, y: 0, z: 5 } },
        ],
        evidence: null,
    },
};

// ============================================
// PHONE EASTER EGG AUDIO
// ============================================

class PhoneRinger {
    constructor() {
        this.audioContext = null;
        this.isRinging = false;
        this.oscillators = [];
        this.gainNode = null;
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0;
            this.gainNode.connect(this.audioContext.destination);
        } catch(e) {
            console.log('Phone audio not available');
        }
    }
    
    startRinging() {
        if (!this.audioContext || this.isRinging) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isRinging = true;
        this.ring();
    }
    
    ring() {
        if (!this.isRinging) return;
        
        // Classic phone ring - two tones
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const ringGain = this.audioContext.createGain();
        
        osc1.frequency.value = 440; // A4
        osc2.frequency.value = 480; // Slightly higher
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        ringGain.gain.value = 0.15;
        
        osc1.connect(ringGain);
        osc2.connect(ringGain);
        ringGain.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        
        // Ring pattern: ring-ring, pause, ring-ring
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
        
        // Second ring
        const osc3 = this.audioContext.createOscillator();
        const osc4 = this.audioContext.createOscillator();
        const ringGain2 = this.audioContext.createGain();
        
        osc3.frequency.value = 440;
        osc4.frequency.value = 480;
        osc3.type = 'sine';
        osc4.type = 'sine';
        ringGain2.gain.value = 0.15;
        
        osc3.connect(ringGain2);
        osc4.connect(ringGain2);
        ringGain2.connect(this.audioContext.destination);
        
        osc3.start(now + 0.5);
        osc4.start(now + 0.5);
        osc3.stop(now + 0.9);
        osc4.stop(now + 0.9);
        
        // Schedule next ring cycle
        setTimeout(() => {
            if (this.isRinging) this.ring();
        }, 3000);
    }
    
    stopRinging() {
        this.isRinging = false;
    }
    
    playAnswerSound() {
        if (!this.audioContext) return;
        
        // Creepy voice-like sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 150;
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gain.gain.value = 0.1;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        
        // "Jeff's calling" effect - warbling
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.3);
        osc.frequency.linearRampToValueAtTime(120, now + 0.6);
        osc.frequency.linearRampToValueAtTime(180, now + 1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        
        osc.start(now);
        osc.stop(now + 1.5);
    }
}

const phoneRinger = new PhoneRinger();

// ============================================
// AUDIO SYSTEM
// ============================================

class AmbientAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.oscillators = [];
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    start() {
        if (!this.audioContext || this.isPlaying) return;
        
        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create layered ambient sounds
        
        // Ocean waves - low rumble
        this.createOceanSound();
        
        // Wind
        this.createWindSound();
        
        // Occasional bird calls
        this.scheduleBirdCalls();
        
        this.isPlaying = true;
    }
    
    createOceanSound() {
        // Create noise buffer for ocean
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        // Filter to create ocean sound
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 400;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.3;
        
        // LFO for wave motion
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.1; // Very slow
        lfoGain.gain.value = 0.1;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        
        whiteNoise.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        whiteNoise.start();
        
        this.oscillators.push(whiteNoise, lfo);
    }
    
    createWindSound() {
        // Higher pitched noise for wind
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const windNoise = this.audioContext.createBufferSource();
        windNoise.buffer = noiseBuffer;
        windNoise.loop = true;
        
        const bandpass = this.audioContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 800;
        bandpass.Q.value = 0.5;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        
        // LFO for gusts
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        
        windNoise.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);
        windNoise.start();
        
        this.oscillators.push(windNoise, lfo);
    }
    
    scheduleBirdCalls() {
        const scheduleBird = () => {
            if (!this.isPlaying) return;
            
            // Random bird chirp
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 800 + Math.random() * 400;
            
            gain.gain.value = 0;
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
            
            // Schedule next bird call
            setTimeout(scheduleBird, 5000 + Math.random() * 15000);
        };
        
        setTimeout(scheduleBird, 3000);
    }
    
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }
    
    stop() {
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
    }
}

const ambientAudio = new AmbientAudio();

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
    // Start player on the beach near the dock, looking toward the island
    camera.position.set(150, playerHeight + 5, 50);
    camera.lookAt(0, playerHeight, 0); // Look toward the island center
    
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
    createBuildingInteriors();
    setupMinimap();
    
    // Init phone easter egg
    phoneRinger.init();
    
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
    
    // Create beach ring (flat, no bevel)
    const beachGeometry = new THREE.ExtrudeGeometry(islandShape, {
        depth: 1,
        bevelEnabled: false  // No bevel = flat beach
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
    exteriorObjects.push(beach);
    
    // Create SOLID FLAT WALKABLE GROUND for the entire island
    const groundGeometry = new THREE.PlaneGeometry(500, 400, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d5c3d,
        roughness: 0.85,
        metalness: 0
    });
    
    // Keep ground FLAT - no vertex displacement
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i); // Y in 2D becomes Z in 3D
        
        // Check if inside island bounds (rough)
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 220) {
            positions.setZ(i, 3);  // FLAT constant height
        } else {
            positions.setZ(i, -5); // Below water
        }
    }
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    exteriorObjects.push(ground);
    terrainMesh = ground;
    
    // Create main terrain as a FLAT elevated surface (no dome!)
    const terrainGeometry = new THREE.ExtrudeGeometry(islandShape, {
        depth: 1,  // Very thin - just a flat surface
        bevelEnabled: false  // No bevel = no bulge
    });
    
    const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x3d5c3d,
        roughness: 0.85,
        metalness: 0
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = 2;  // Flat at ground level
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);
    exteriorObjects.push(terrain);
    
    // NO hills - keep terrain completely flat and walkable
}

// ============================================
// TERRAIN HEIGHT
// ============================================

function getTerrainHeight(x, z) {
    // FLAT terrain - completely walkable everywhere
    // Just a constant ground level for easy exploration
    
    let height = 3; // Flat ground level above sea
    
    // No hills, no complex terrain - everything is flat and walkable
    
    return height;  // Always return flat constant
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
    exteriorObjects.push(building);
    
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
    exteriorObjects.push(roof);
    
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
        exteriorObjects.push(win);
        
        const winBack = win.clone();
        winBack.position.z = -data.size.d / 2 - 0.1;
        group.add(winBack);
        exteriorObjects.push(winBack);
    }
    
    // Door - make it a door zone for entering
    const doorGeometry = new THREE.BoxGeometry(4, 6, 1);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.6,
        metalness: 0,
        emissive: 0x221100,
        emissiveIntensity: 0.2
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 3, data.size.d / 2 + 0.5);
    door.userData = {
        type: 'door',
        buildingId: data.id,
        buildingName: data.name,
    };
    group.add(door);
    interactables.push(door);
}

// ============================================
// BUILDING INTERIORS
// ============================================

function createBuildingInteriors() {
    Object.keys(INTERIOR_DATA).forEach(buildingId => {
        const data = INTERIOR_DATA[buildingId];
        const interiorGroup = new THREE.Group();
        interiorGroup.visible = false;
        interiorGroup.userData.buildingId = buildingId;
        
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(data.size.w, data.size.d);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: buildingId === 'temple' ? 0x1a1a2e : 0x4a3a2a,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.1;
        floor.receiveShadow = true;
        interiorGroup.add(floor);
        
        // Create walls
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        
        // Four walls
        const wallHeight = data.size.h;
        
        // Front wall with door opening
        const frontWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(data.size.w / 2 - 3, wallHeight, 0.5),
            wallMaterial
        );
        frontWallLeft.position.set(-data.size.w / 4 - 1.5, wallHeight / 2, data.size.d / 2);
        interiorGroup.add(frontWallLeft);
        
        const frontWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(data.size.w / 2 - 3, wallHeight, 0.5),
            wallMaterial
        );
        frontWallRight.position.set(data.size.w / 4 + 1.5, wallHeight / 2, data.size.d / 2);
        interiorGroup.add(frontWallRight);
        
        // Door frame above
        const doorTop = new THREE.Mesh(
            new THREE.BoxGeometry(6, wallHeight - 7, 0.5),
            wallMaterial
        );
        doorTop.position.set(0, wallHeight - (wallHeight - 7) / 2, data.size.d / 2);
        interiorGroup.add(doorTop);
        
        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(data.size.w, wallHeight, 0.5),
            wallMaterial
        );
        backWall.position.set(0, wallHeight / 2, -data.size.d / 2);
        interiorGroup.add(backWall);
        
        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, wallHeight, data.size.d),
            wallMaterial
        );
        leftWall.position.set(-data.size.w / 2, wallHeight / 2, 0);
        interiorGroup.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, wallHeight, data.size.d),
            wallMaterial
        );
        rightWall.position.set(data.size.w / 2, wallHeight / 2, 0);
        interiorGroup.add(rightWall);
        
        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(data.size.w, data.size.d),
            new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = wallHeight;
        interiorGroup.add(ceiling);
        
        // Add interior objects
        data.objects.forEach(obj => {
            createInteriorObject(interiorGroup, obj, buildingId);
        });
        
        // Add interior evidence
        if (data.evidence) {
            createInteriorEvidence(interiorGroup, data.evidence);
        }
        
        // Exit door zone
        const exitZone = new THREE.Mesh(
            new THREE.BoxGeometry(5, 7, 2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        exitZone.position.set(0, 3.5, data.size.d / 2 + 1);
        exitZone.userData = {
            type: 'exit',
            buildingId: buildingId,
        };
        interiorGroup.add(exitZone);
        interactables.push(exitZone);
        
        // Interior lighting
        const interiorLight = new THREE.PointLight(
            buildingId === 'temple' ? 0xff6600 : 0xffffee,
            1,
            50
        );
        interiorLight.position.set(0, wallHeight - 2, 0);
        interiorLight.castShadow = true;
        interiorGroup.add(interiorLight);
        
        // Extra lights for temple
        if (buildingId === 'temple') {
            const candleLight1 = new THREE.PointLight(0xff4400, 0.5, 20);
            candleLight1.position.set(-8, 3, -8);
            interiorGroup.add(candleLight1);
            
            const candleLight2 = new THREE.PointLight(0xff4400, 0.5, 20);
            candleLight2.position.set(8, 3, -8);
            interiorGroup.add(candleLight2);
        }
        
        interiorScenes[buildingId] = interiorGroup;
        scene.add(interiorGroup);
    });
}

function createInteriorObject(group, objData, buildingId) {
    let mesh;
    
    switch (objData.type) {
        case 'altar':
            // Stone altar
            const altarGeo = new THREE.BoxGeometry(8, 3, 4);
            const altarMat = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.7
            });
            mesh = new THREE.Mesh(altarGeo, altarMat);
            mesh.position.set(objData.position.x, 1.5, objData.position.z);
            
            // Cloth on top
            const cloth = new THREE.Mesh(
                new THREE.BoxGeometry(9, 0.2, 5),
                new THREE.MeshStandardMaterial({ color: 0x880000 })
            );
            cloth.position.y = 1.6;
            mesh.add(cloth);
            break;
            
        case 'statue':
            // Owl-like statue
            const statueGeo = new THREE.ConeGeometry(1.5, 6, 4);
            const statueMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                roughness: 0.3,
                metalness: 0.7
            });
            mesh = new THREE.Mesh(statueGeo, statueMat);
            mesh.position.set(objData.position.x, 3, objData.position.z);
            break;
            
        case 'candles':
            // Candle cluster
            const candleGroup = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const candle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.1, 1 + Math.random()),
                    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
                );
                candle.position.set(
                    (Math.random() - 0.5) * 1.5,
                    0.5,
                    (Math.random() - 0.5) * 1.5
                );
                candleGroup.add(candle);
                
                // Flame
                const flame = new THREE.Mesh(
                    new THREE.ConeGeometry(0.08, 0.3, 8),
                    new THREE.MeshBasicMaterial({ color: 0xff6600 })
                );
                flame.position.y = candle.position.y + 0.6;
                flame.position.x = candle.position.x;
                flame.position.z = candle.position.z;
                candleGroup.add(flame);
            }
            candleGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = candleGroup;
            break;
            
        case 'phone':
            // Ringing phone - Easter egg!
            const phoneGeo = new THREE.BoxGeometry(0.8, 0.3, 0.4);
            const phoneMat = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.5
            });
            mesh = new THREE.Mesh(phoneGeo, phoneMat);
            mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
            mesh.userData = {
                type: 'phone',
                isEasterEgg: true,
                name: 'Ringing Phone',
            };
            interactables.push(mesh);
            
            // Add glow
            const phoneGlow = new THREE.Mesh(
                new THREE.SphereGeometry(1, 16, 12),
                new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.2
                })
            );
            mesh.add(phoneGlow);
            break;
            
        case 'desk':
            const deskGeo = new THREE.BoxGeometry(5, 2.5, 3);
            const deskMat = new THREE.MeshStandardMaterial({
                color: 0x5c4033,
                roughness: 0.6
            });
            mesh = new THREE.Mesh(deskGeo, deskMat);
            mesh.position.set(objData.position.x, 1.25, objData.position.z);
            break;
            
        case 'couch':
            const couchGroup = new THREE.Group();
            const couchBase = new THREE.Mesh(
                new THREE.BoxGeometry(6, 1.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x4a2020 })
            );
            couchBase.position.y = 0.75;
            couchGroup.add(couchBase);
            
            const couchBack = new THREE.Mesh(
                new THREE.BoxGeometry(6, 2, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x4a2020 })
            );
            couchBack.position.set(0, 1.5, -1.25);
            couchGroup.add(couchBack);
            
            couchGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = couchGroup;
            break;
            
        case 'painting':
            const frameGeo = new THREE.BoxGeometry(4, 3, 0.2);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            mesh = new THREE.Mesh(frameGeo, frameMat);
            
            const canvas = new THREE.Mesh(
                new THREE.BoxGeometry(3.5, 2.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x2a4a2a })
            );
            canvas.position.z = 0.1;
            mesh.add(canvas);
            
            mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
            break;
            
        case 'table':
            const tableGeo = new THREE.BoxGeometry(10, 0.3, 4);
            const tableMat = new THREE.MeshStandardMaterial({
                color: 0x5c4033,
                roughness: 0.5
            });
            mesh = new THREE.Mesh(tableGeo, tableMat);
            mesh.position.set(objData.position.x, 2.5, objData.position.z);
            
            // Table legs
            for (let x = -1; x <= 1; x += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    const leg = new THREE.Mesh(
                        new THREE.BoxGeometry(0.3, 2.5, 0.3),
                        tableMat
                    );
                    leg.position.set(x * 4.5, -1.25, z * 1.5);
                    mesh.add(leg);
                }
            }
            break;
            
        case 'safe':
            const safeGeo = new THREE.BoxGeometry(2, 3, 2);
            const safeMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.4,
                metalness: 0.6
            });
            mesh = new THREE.Mesh(safeGeo, safeMat);
            mesh.position.set(objData.position.x, 1.5, objData.position.z);
            break;
            
        case 'bed':
            const bedGroup = new THREE.Group();
            const bedFrame = new THREE.Mesh(
                new THREE.BoxGeometry(6, 1, 8),
                new THREE.MeshStandardMaterial({ color: 0x5c4033 })
            );
            bedFrame.position.y = 0.5;
            bedGroup.add(bedFrame);
            
            const mattress = new THREE.Mesh(
                new THREE.BoxGeometry(5.5, 0.5, 7.5),
                new THREE.MeshStandardMaterial({ color: 0xeeeeee })
            );
            mattress.position.y = 1.25;
            bedGroup.add(mattress);
            
            const pillow = new THREE.Mesh(
                new THREE.BoxGeometry(4, 0.3, 1.5),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            pillow.position.set(0, 1.6, -2.5);
            bedGroup.add(pillow);
            
            bedGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = bedGroup;
            break;
            
        case 'nightstand':
            const nsGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
            const nsMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
            mesh = new THREE.Mesh(nsGeo, nsMat);
            mesh.position.set(objData.position.x, 1, objData.position.z);
            break;
            
        case 'wardrobe':
            const wardrobeGeo = new THREE.BoxGeometry(4, 7, 2);
            const wardrobeMat = new THREE.MeshStandardMaterial({ color: 0x4a3520 });
            mesh = new THREE.Mesh(wardrobeGeo, wardrobeMat);
            mesh.position.set(objData.position.x, 3.5, objData.position.z);
            break;
            
        default:
            return;
    }
    
    if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
}

function createInteriorEvidence(group, evidence) {
    const evidenceGroup = new THREE.Group();
    evidenceGroup.position.set(evidence.position.x, evidence.position.y, evidence.position.z);
    
    const docGeometry = new THREE.BoxGeometry(1.5, 0.1, 2);
    const docMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5dc,
        roughness: 0.5,
        emissive: 0xffff00,
        emissiveIntensity: 0.4
    });
    const doc = new THREE.Mesh(docGeometry, docMaterial);
    doc.castShadow = true;
    evidenceGroup.add(doc);
    
    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    evidenceGroup.add(glow);
    
    evidenceGroup.userData = {
        type: 'evidence',
        id: evidence.id,
        name: evidence.name,
        content: evidence.content,
        found: false,
    };
    
    interactables.push(evidenceGroup);
    group.add(evidenceGroup);
}

function enterBuilding(buildingId) {
    const interior = interiorScenes[buildingId];
    if (!interior) {
        showBuildingInfo({ 
            name: 'Building', 
            description: 'This building cannot be entered.' 
        });
        return;
    }
    
    // Find the building's exterior position
    const building = ISLAND_LAYOUT.buildings.find(b => b.id === buildingId);
    if (!building) return;
    
    gameState.inInterior = buildingId;
    
    // Hide exterior objects (water, sky, vegetation would still be visible but we're inside)
    // Position interior at origin for simplicity
    interior.position.set(0, 0, 0);
    interior.visible = true;
    
    // Move player to interior entrance
    camera.position.set(0, playerHeight, INTERIOR_DATA[buildingId].size.d / 2 - 5);
    camera.lookAt(0, playerHeight, 0);
    
    // Hide water and sky (we're inside)
    if (water) water.visible = false;
    
    // Update location
    gameState.currentLocation = INTERIOR_DATA[buildingId].name + ' - Interior';
    document.getElementById('location').textContent = `Location: ${gameState.currentLocation}`;
    
    // Start phone ringing if in temple
    if (buildingId === 'temple' && !gameState.phoneFound) {
        setTimeout(() => {
            if (gameState.inInterior === 'temple') {
                phoneRinger.startRinging();
                gameState.phoneRinging = true;
            }
        }, 3000);
    }
}

function exitBuilding() {
    if (!gameState.inInterior) return;
    
    const buildingId = gameState.inInterior;
    const building = ISLAND_LAYOUT.buildings.find(b => b.id === buildingId);
    
    // Hide interior
    if (interiorScenes[buildingId]) {
        interiorScenes[buildingId].visible = false;
    }
    
    // Show exterior
    if (water) water.visible = true;
    
    // Stop phone if ringing
    if (gameState.phoneRinging) {
        phoneRinger.stopRinging();
        gameState.phoneRinging = false;
    }
    
    // Move player outside the building
    if (building) {
        camera.position.set(
            building.position.x,
            playerHeight,
            building.position.z + (building.size?.d || 20) / 2 + 10
        );
    }
    
    gameState.inInterior = null;
    updateLocation();
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
    
    // Clear with ocean color
    minimapCtx.fillStyle = '#1a3d5a';
    minimapCtx.fillRect(0, 0, 150, 150);
    
    const scale = 0.25;
    const offsetX = 75;
    const offsetZ = 75;
    
    // Draw island shape (simplified)
    minimapCtx.fillStyle = '#2d5a2d';
    minimapCtx.beginPath();
    minimapCtx.ellipse(offsetX - 20, offsetZ, 60, 45, 0.2, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw paths
    minimapCtx.strokeStyle = '#c2b280';
    minimapCtx.lineWidth = 1;
    ISLAND_LAYOUT.paths.forEach(path => {
        minimapCtx.beginPath();
        minimapCtx.moveTo(path.from.x * scale + offsetX, path.from.z * scale + offsetZ);
        minimapCtx.lineTo(path.to.x * scale + offsetX, path.to.z * scale + offsetZ);
        minimapCtx.stroke();
    });
    
    // Draw buildings
    ISLAND_LAYOUT.buildings.forEach(b => {
        const x = b.position.x * scale + offsetX;
        const z = b.position.z * scale + offsetZ;
        const w = (b.size.w || 10) * scale;
        const h = (b.size.d || 10) * scale;
        
        // Highlight enterable buildings
        if (INTERIOR_DATA[b.id]) {
            minimapCtx.fillStyle = '#aa8855';
        } else {
            minimapCtx.fillStyle = '#666';
        }
        
        // Temple gets special color
        if (b.id === 'temple') {
            minimapCtx.fillStyle = '#4488ff';
        }
        
        minimapCtx.fillRect(x - w/2, z - h/2, w, h);
    });
    
    // Draw evidence locations (not found)
    minimapCtx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    EVIDENCE_DATA.forEach(e => {
        if (!gameState.evidenceCollected.find(c => c.id === e.id)) {
            const x = e.position.x * scale + offsetX;
            const z = e.position.z * scale + offsetZ;
            minimapCtx.beginPath();
            minimapCtx.arc(x, z, 2, 0, Math.PI * 2);
            minimapCtx.fill();
        }
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
    
    // Show "INTERIOR" text if inside building
    if (gameState.inInterior) {
        minimapCtx.fillStyle = '#fff';
        minimapCtx.font = '10px monospace';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('INTERIOR', 75, 145);
    }
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
    
    // Start ambient audio
    ambientAudio.init();
    ambientAudio.start();
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
        // Skip objects not relevant to current location (interior vs exterior)
        if (gameState.inInterior) {
            // In interior - only check interior objects
            const parent = obj.parent;
            if (parent && parent.userData && parent.userData.buildingId === gameState.inInterior) {
                obj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.parentInteractable = obj;
                        meshes.push(child);
                    }
                });
            }
            // Also check the object itself
            if (obj.userData && (obj.userData.type === 'exit' || obj.userData.type === 'phone' || obj.userData.type === 'evidence')) {
                if (obj instanceof THREE.Mesh) {
                    obj.userData.parentInteractable = obj;
                    meshes.push(obj);
                }
                obj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.parentInteractable = obj;
                        meshes.push(child);
                    }
                });
            }
        } else {
            // Exterior - check all non-interior objects
            if (obj.userData && obj.userData.type !== 'exit') {
                obj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.parentInteractable = obj;
                        meshes.push(child);
                    }
                });
            }
        }
    });
    
    const intersects = raycaster.intersectObjects(meshes);
    
    const prompt = document.getElementById('interaction-prompt');
    const crosshair = document.getElementById('crosshair');
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        const parent = hit.object.userData.parentInteractable || hit.object;
        
        if (parent && parent.userData && hit.distance < CONFIG.interactionDistance) {
            gameState.canInteract = parent;
            
            let promptText = 'Press E to interact';
            if (parent.userData.type === 'door') {
                promptText = `Press E to enter ${parent.userData.buildingName}`;
            } else if (parent.userData.type === 'exit') {
                promptText = 'Press E to exit building';
            } else if (parent.userData.type === 'phone') {
                promptText = 'Press E to answer phone';
            } else if (parent.userData.name) {
                promptText = `Press E to interact with ${parent.userData.name}`;
            }
            
            prompt.textContent = promptText;
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
        case 'door':
            enterBuilding(data.buildingId);
            break;
        case 'exit':
            exitBuilding();
            break;
        case 'phone':
            answerPhone();
            break;
    }
}

function answerPhone() {
    if (gameState.phoneFound) return;
    
    gameState.phoneFound = true;
    phoneRinger.stopRinging();
    gameState.phoneRinging = false;
    
    // Play creepy answer sound
    phoneRinger.playAnswerSound();
    
    // Show evidence popup with the easter egg message
    const popup = document.getElementById('evidence-popup');
    const title = document.getElementById('evidence-title');
    const content = document.getElementById('evidence-content');
    
    title.textContent = "📞 INCOMING CALL";
    content.innerHTML = `<span style="color: #c41e3a; font-weight: bold;">JEFF'S CALLING...</span>

*static*

"Hello? Is anyone there?"

*garbled voice*

"...they can't keep hiding forever..."
"...the list... they're all on the list..."

*click*

<span style="color: #666; font-style: italic;">The line goes dead.</span>

<span style="color: #ffd700;">🏆 EASTER EGG FOUND: "Jeff's Calling"</span>`;
    
    popup.classList.add('visible');
    controls.unlock();
    
    // Add to evidence
    gameState.evidenceCollected.push({
        id: 'jeffs_call',
        name: '📞 Jeff\'s Call Recording',
        content: 'A disturbing phone call... someone was trying to reach out.'
    });
    updateInventory();
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
        
        // Ground collision - different for interior vs exterior
        if (gameState.inInterior) {
            // Interior bounds
            const interior = INTERIOR_DATA[gameState.inInterior];
            if (interior) {
                const halfW = interior.size.w / 2 - 2;
                const halfD = interior.size.d / 2 - 2;
                
                camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
                camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
            }
            
            // Interior floor
            if (camera.position.y < playerHeight) {
                velocity.y = 0;
                camera.position.y = playerHeight;
                canJump = true;
            }
        } else {
            // Exterior - terrain height based on position
            const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
            const groundLevel = terrainHeight + playerHeight;
            
            if (camera.position.y < groundLevel) {
                velocity.y = 0;
                camera.position.y = groundLevel;
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
