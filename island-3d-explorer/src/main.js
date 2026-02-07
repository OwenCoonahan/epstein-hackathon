import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    moveSpeed: 2500, // EXTREMELY fast movement - walking only, but FAST
    lookSpeed: 0.002,
    interactionDistance: 20,
    gravity: -50,
    jumpHeight: 15,
    dayDuration: 600, // seconds for full day cycle
    startTime: 0.65, // Start at late afternoon (0-1) - more ominous
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
    inInterior: null,
    phoneRinging: false,
    phoneFound: false,
    discoveredSecrets: [],
    tensionLevel: 0, // Increases as player finds more stuff
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
let terrainMesh = null;
let interiorScenes = {};
let exteriorObjects = [];

// ============================================
// WEB SPEECH API - VOICE SYSTEM
// ============================================

class VoiceSystem {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.isReady = false;
        this.speaking = false;
        
        // Wait for voices to load
        if (this.synth) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
                this.isReady = true;
            };
            // Try immediate load too
            this.voices = this.synth.getVoices();
            if (this.voices.length > 0) this.isReady = true;
        }
    }
    
    speak(text, options = {}) {
        if (!this.synth || !this.isReady) {
            console.log("Voice not ready, text:", text);
            return;
        }
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice settings
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.9;
        
        // Try to find a matching voice
        if (options.voiceType) {
            const voice = this.findVoice(options.voiceType);
            if (voice) utterance.voice = voice;
        }
        
        this.speaking = true;
        utterance.onend = () => {
            this.speaking = false;
        };
        
        this.synth.speak(utterance);
    }
    
    findVoice(type) {
        // Try to find appropriate voice
        const voices = this.voices;
        
        switch(type) {
            case 'male-deep':
                return voices.find(v => v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Google UK English Male')) || voices[0];
            case 'male-smooth':
                return voices.find(v => v.name.includes('Fred') || v.name.includes('Tom')) || voices[0];
            case 'male-british':
                return voices.find(v => v.name.includes('Daniel') || v.name.includes('UK')) || voices[0];
            case 'male-robotic':
                return voices.find(v => v.name.includes('Zarvox') || v.name.includes('Whisper')) || voices[0];
            case 'female':
                return voices.find(v => v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen')) || voices[0];
            case 'female-young':
                return voices.find(v => v.name.includes('Samantha') || v.name.includes('Princess')) || voices[0];
            case 'female-british':
                return voices.find(v => v.name.includes('Kate') || v.name.includes('Serena') || (v.name.includes('UK') && v.name.includes('Female'))) || voices[0];
            default:
                return voices[0];
        }
    }
    
    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.speaking = false;
        }
    }
}

const voiceSystem = new VoiceSystem();

// ============================================
// ISLAND LAYOUT DATA
// ============================================

const ISLAND_LAYOUT = {
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
            color: 0xd4af37,
            description: 'The infamous blue and white striped temple structure. What horrors happened inside?',
            hasInterior: true,
        },
        {
            id: 'main_mansion',
            name: 'Main Residence',
            position: { x: 50, z: 0 },
            size: { w: 60, h: 15, d: 40 },
            color: 0xf5f5dc,
            description: 'The main residential complex. Parties happened here.',
            hasInterior: true,
        },
        {
            id: 'guest_house_1',
            name: 'Guest Villa A - "The Massage Suite"',
            position: { x: 120, z: 60 },
            size: { w: 25, h: 10, d: 20 },
            color: 0xfaf0e6,
            description: 'One of several guest accommodations. Why are all the windows blacked out?',
            hasInterior: true,
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
            description: 'Housing for island staff. They saw everything.',
        },
        {
            id: 'sundial',
            name: 'Sundial Plaza',
            position: { x: 0, z: -60 },
            size: { w: 30, h: 3, d: 30 },
            color: 0xcccccc,
            description: 'A large decorative sundial structure. Rumors of ceremonies here.',
            isFlat: true,
        },
        {
            id: 'helipad',
            name: 'Helipad',
            position: { x: 180, z: -40 },
            size: { w: 25, h: 0.5, d: 25 },
            color: 0x333333,
            description: 'The island\'s helicopter landing pad. The Lolita Express landed here.',
            isFlat: true,
        },
        {
            id: 'pool_house',
            name: 'Pool House',
            position: { x: 80, z: -30 },
            size: { w: 15, h: 6, d: 10 },
            color: 0xffffff,
            description: 'Pool facilities. Security cameras covered every angle.',
        },
        {
            id: 'guardhouse',
            name: 'Security Station',
            position: { x: 200, z: 0 },
            size: { w: 10, h: 6, d: 8 },
            color: 0xd3d3d3,
            description: 'Security monitoring station. Thousands of hours of footage... all "lost".',
        },
        {
            id: 'medical_building',
            name: 'Medical Facility',
            position: { x: -100, z: 50 },
            size: { w: 20, h: 8, d: 15 },
            color: 0xffffff,
            description: 'A suspiciously well-equipped medical facility for a private island...',
        },
    ],
    paths: [
        { from: { x: 50, z: 0 }, to: { x: -180, z: -80 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 120, z: 60 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 0, z: -60 }, width: 4 },
        { from: { x: 50, z: 0 }, to: { x: 180, z: -40 }, width: 4 },
        { from: { x: 0, z: -60 }, to: { x: -180, z: -80 }, width: 3 },
        { from: { x: 50, z: 0 }, to: { x: -100, z: 50 }, width: 3 },
    ],
    vegetation: {
        palmCount: 300, // MORE TREES
        bushCount: 400, // MORE BUSHES
    },
};

// ============================================
// FAMOUS CHARACTER NPC DATA
// ============================================

const FAMOUS_NPCS = [
    {
        id: 'bill_clinton',
        name: 'Bill Clinton',
        category: 'vip',
        appearance: { suit: 0x1a1a3a, skin: 0xdeb887, hair: 0x888888 },
        voiceSettings: { voiceType: 'male-deep', rate: 0.9, pitch: 0.9 },
        dialogues: [
            "I did not have... relations... with anyone on this island.",
            "I was only here for the philanthropic work. The foundation stuff.",
            "Look, I barely knew the guy. Maybe 4 or 5 times.",
            "Those flight logs? The 26 trips? That's... that's out of context.",
            "You should really talk to my lawyers about this.",
            "*nervous laugh* The Secret Service was with me the whole time...",
        ],
    },
    {
        id: 'donald_trump',
        name: 'Donald Trump',
        category: 'vip',
        appearance: { suit: 0x1a1a4a, skin: 0xffaa77, hair: 0xffdd44 },
        voiceSettings: { voiceType: 'male-deep', rate: 1.1, pitch: 0.85 },
        dialogues: [
            "Terrific guy. I've known Jeff 15 years. Tremendous guy.",
            "He likes beautiful women as much as I do. Many on the younger side.",
            "Look, I kicked him out of Mar-a-Lago. Okay? I kicked him out.",
            "I barely knew him. Hardly knew him at all. Very few pictures together.",
            "The fake news media won't tell you I was the one who helped the FBI.",
            "Ask the other guys. They were here much more than me. Believe me.",
        ],
    },
    {
        id: 'prince_andrew',
        name: 'Prince Andrew',
        category: 'vip',
        appearance: { suit: 0x2a2a5a, skin: 0xffccaa, hair: 0x553322 },
        voiceSettings: { voiceType: 'male-british', rate: 0.95, pitch: 1.0 },
        dialogues: [
            "I don't recall ever meeting that woman. I have no recollection.",
            "I was at a Pizza Express in Woking that day. Very memorable.",
            "I can't sweat. It's a medical condition from the Falklands War.",
            "I came here to end the friendship. That's all. To tell him off.",
            "The photograph? That's clearly been doctored. Look at the hand.",
            "My judgement was... impaired. I let the side down.",
        ],
    },
    {
        id: 'bill_gates',
        name: 'Bill Gates',
        category: 'vip',
        appearance: { suit: 0x3a3a4a, skin: 0xdeb887, hair: 0x443322 },
        voiceSettings: { voiceType: 'male-smooth', rate: 1.0, pitch: 1.1 },
        dialogues: [
            "I met with him for philanthropy. The Foundation work.",
            "Many meetings. At his house in New York. About... charity.",
            "The flights? I had my own planes. The logs are incorrect.",
            "Melinda didn't... approve of the relationship. That's been reported.",
            "Look, in retrospect, spending time with him was a mistake.",
            "I thought he could help connect me with people. For giving.",
        ],
    },
    {
        id: 'kevin_spacey',
        name: 'Kevin Spacey',
        category: 'vip',
        appearance: { suit: 0x2a2a2a, skin: 0xdeb887, hair: 0x332211 },
        voiceSettings: { voiceType: 'male-deep', rate: 0.95, pitch: 0.95 },
        dialogues: [
            "*stares intensely* I'm a very good actor, you know.",
            "Africa trip? That was for a charity. Clinton Foundation event.",
            "Whatever you think happened... let me be Frank with you...",
            "I've chosen to live my life as a... *trails off*",
            "The masks we wear... sometimes they're all we have left.",
            "Do you know who I am? Do you really want to do this?",
        ],
    },
    {
        id: 'alan_dershowitz',
        name: 'Alan Dershowitz',
        category: 'vip',
        appearance: { suit: 0x4a4a4a, skin: 0xdeb887, hair: 0xaaaaaa },
        voiceSettings: { voiceType: 'male-deep', rate: 1.15, pitch: 1.0 },
        dialogues: [
            "I kept my underwear on! At all times! Can I make that any clearer?",
            "I got a massage. By an OLD Russian woman. I have the receipts.",
            "This is defamation. I will sue everyone who says otherwise.",
            "I was there for legal consultation. Attorney-client privilege.",
            "Jeffrey was a brilliant mind. We discussed law and mathematics.",
            "The girls? What girls? I saw no girls. Only legal adults.",
        ],
    },
    {
        id: 'stephen_hawking',
        name: 'Stephen Hawking',
        category: 'vip',
        appearance: { suit: 0x2a2a2a, skin: 0xccbbaa, hair: 0x888888 },
        voiceSettings: { voiceType: 'male-robotic', rate: 0.8, pitch: 0.5 },
        dialogues: [
            "The physics of this situation are... concerning.",
            "I was here for a scientific conference. The Caribbean is nice.",
            "Black holes aren't the only things that trap people, it seems.",
            "Time moves differently here. Hours become days become secrets.",
            "The universe keeps many secrets. This island keeps more.",
            "I calculate a 97.3% probability this will all come out eventually.",
        ],
    },
    {
        id: 'ghislaine_maxwell',
        name: 'Ghislaine Maxwell',
        category: 'staff',
        appearance: { suit: 0x880022, skin: 0xdeb887, hair: 0x222222 },
        voiceSettings: { voiceType: 'female-british', rate: 1.0, pitch: 1.1 },
        dialogues: [
            "Welcome to the island, darling. Let me show you around.",
            "The girls? They're just... friends. Employees. Masseuses.",
            "Jeffrey and I have a special relationship. Professional.",
            "Would you like to meet some of our guests? Very important people.",
            "Everything here is completely above board. Ask anyone.",
            "You seem tense. Perhaps you'd like a... massage?",
        ],
    },
    {
        id: 'les_wexner',
        name: 'Les Wexner',
        category: 'vip',
        appearance: { suit: 0x3a3a3a, skin: 0xdeb887, hair: 0x999999 },
        voiceSettings: { voiceType: 'male-deep', rate: 0.9, pitch: 0.9 },
        dialogues: [
            "Jeffrey was my financial advisor. That's all.",
            "The power of attorney? A business arrangement. Standard stuff.",
            "Victoria's Secret has nothing to do with any of this.",
            "I'm a victim here too. He stole from me.",
            "The mansion in New York? I gave it to him. As a gift.",
            "I had no idea. No idea at all. I'm shocked. Shocked.",
        ],
    },
    {
        id: 'jean_luc_brunel',
        name: 'Jean-Luc Brunel',
        category: 'staff',
        appearance: { suit: 0x4a3a3a, skin: 0xdeb887, hair: 0x444444 },
        voiceSettings: { voiceType: 'male-deep', rate: 1.0, pitch: 0.95 },
        dialogues: [
            "I am a modeling agent. The best in the business.",
            "The girls come to me. I don't recruit them. They dream of this.",
            "Jeffrey? He helped fund my agency. MC2. Very legitimate.",
            "Paris, New York, Tel Aviv... we have offices everywhere.",
            "Young talent needs... development. Mentorship. Guidance.",
            "*looks around nervously* I cannot say more. Not here.",
        ],
    },
    {
        id: 'naomi_campbell',
        name: 'Naomi Campbell',
        category: 'vip',
        appearance: { suit: 0x990066, skin: 0x8b4513, hair: 0x111111 },
        voiceSettings: { voiceType: 'female', rate: 1.1, pitch: 1.0 },
        dialogues: [
            "I came for a dinner party. That's it. I left immediately.",
            "I don't know what goes on here. I was invited as a guest.",
            "The modelling industry is... complicated. You wouldn't understand.",
            "I've thrown phones at people for less intrusive questions.",
            "My schedule is packed. I can't remember every event.",
            "*glares* Next question.",
        ],
    },
    {
        id: 'chris_tucker',
        name: 'Chris Tucker',
        category: 'vip',
        appearance: { suit: 0x663399, skin: 0x8b4513, hair: 0x111111 },
        voiceSettings: { voiceType: 'male-deep', rate: 1.3, pitch: 1.2 },
        dialogues: [
            "Man, I was just on the plane for the Africa trip! That's it!",
            "Clinton invited me. Charity work! Helping kids in Africa!",
            "I didn't know nothin' about what else was going on. Nothing!",
            "Rush Hour money ain't THAT good to be involved in this mess!",
            "Do you UNDERSTAND the words that are coming out of my mouth?!",
            "*nervous laughter* This ain't funny though... this is serious...",
        ],
    },
];

// Young women, guards, staff, pilots
const OTHER_NPCS = [
    {
        id: 'young_woman_1',
        name: 'Young Woman',
        category: 'victim',
        appearance: { suit: 0xffcccc, skin: 0xffeedd, hair: 0x663322 },
        voiceSettings: { voiceType: 'female-young', rate: 0.9, pitch: 1.3 },
        dialogues: [
            "Mr. Epstein said I could be a model...",
            "I'm just here for a job interview. For the modeling agency.",
            "I was told there would be other girls my age here...",
            "*looks down* I can't talk about it. I signed something.",
            "They promised to pay for my college... my family needed help...",
            "Please... don't tell anyone you saw me here...",
        ],
    },
    {
        id: 'young_woman_2',
        name: 'Young Woman',
        category: 'victim',
        appearance: { suit: 0xaaddff, skin: 0xffeedd, hair: 0xffdd88 },
        voiceSettings: { voiceType: 'female-young', rate: 0.85, pitch: 1.35 },
        dialogues: [
            "Ghislaine told me to wear this... I'm only 16...",
            "The massages aren't... what I expected...",
            "I want to go home but they took my passport...",
            "*crying* They said no one would believe me anyway...",
            "There are cameras everywhere. They're always recording...",
            "Please help me... please...",
        ],
    },
    {
        id: 'young_woman_3',
        name: 'Young Woman',
        category: 'victim',
        appearance: { suit: 0xffddaa, skin: 0xdeb887, hair: 0x332211 },
        voiceSettings: { voiceType: 'female-young', rate: 0.9, pitch: 1.25 },
        dialogues: [
            "I recruited three of my friends. For the money.",
            "He likes them young. Fresh. That's what Ghislaine said.",
            "Victoria's Secret wanted to scout me... supposedly...",
            "The rich men... they come and go. We're not supposed to look at their faces.",
            "I know things. Names. Dates. It's all in my diary.",
            "If I talk... they'll make me disappear like the others.",
        ],
    },
    {
        id: 'security_guard_1',
        name: 'Security Guard',
        category: 'staff',
        appearance: { suit: 0x222222, skin: 0xdeb887, hair: 0x111111 },
        voiceSettings: { voiceType: 'male-deep', rate: 0.8, pitch: 0.7 },
        dialogues: [
            "You're not supposed to be in this area.",
            "I see nothing. I hear nothing. That's how I keep this job.",
            "The cameras? They run 24/7. But the tapes... they get 'lost'.",
            "Big names come through here. Faces you'd recognize.",
            "My NDA is worth more than your life. Literally.",
            "Move along. Nothing to see here.",
        ],
    },
    {
        id: 'security_guard_2',
        name: 'Security Guard',
        category: 'staff',
        appearance: { suit: 0x222222, skin: 0x8b4513, hair: 0x111111 },
        voiceSettings: { voiceType: 'male-deep', rate: 0.85, pitch: 0.75 },
        dialogues: [
            "State your business.",
            "The boss pays well. Real well. I don't ask questions.",
            "Young girls arrive by boat. Mostly from Florida.",
            "If you're smart, you'll leave this island and forget you were here.",
            "I've seen princes. Presidents. Movie stars. All of them.",
            "What happens on the island stays on the island. Forever.",
        ],
    },
    {
        id: 'pilot',
        name: 'Pilot - Lolita Express',
        category: 'staff',
        appearance: { suit: 0x1a3a5a, skin: 0xdeb887, hair: 0x554433 },
        voiceSettings: { voiceType: 'male-smooth', rate: 1.0, pitch: 1.0 },
        dialogues: [
            "Just flew in from Teterboro. Big group today.",
            "The flight logs? Yeah, they're accurate. Mostly.",
            "Famous names? I can't say. But... yes. Very famous.",
            "The young passengers? They were always 'assistants' or 'masseuses'.",
            "Sometimes we'd fly circles to burn time. Wait for... privacy.",
            "I kept my own records. Just in case. Insurance, you know?",
        ],
    },
    {
        id: 'chef',
        name: 'Island Chef',
        category: 'staff',
        appearance: { suit: 0xffffff, skin: 0xdeb887, hair: 0x443322 },
        voiceSettings: { voiceType: 'male-smooth', rate: 1.0, pitch: 1.05 },
        dialogues: [
            "I cook for the guests. That's all. Just cooking.",
            "The dinner parties... strange guests. Strange requests.",
            "Children's portions? Yes, sometimes. For the... young staff.",
            "The basement kitchen? It's off limits even to me.",
            "Ghislaine runs everything. She decides the menus.",
            "I've seen enough. But I have a family. I stay quiet.",
        ],
    },
    {
        id: 'housekeeper',
        name: 'Housekeeper',
        category: 'staff',
        appearance: { suit: 0x666699, skin: 0xdeb887, hair: 0x332211 },
        voiceSettings: { voiceType: 'female', rate: 0.9, pitch: 1.0 },
        dialogues: [
            "I clean the rooms. I don't ask about the stains.",
            "So many young girls... always new faces...",
            "The massage tables need... special cleaning. Every day.",
            "Mr. Epstein's bedroom has three locks. From the inside.",
            "I found pills once. Wrong pills for a man his age.",
            "Please, I need this job. I won't say anything else.",
        ],
    },
];

// ============================================
// NPC AI & PATHFINDING
// ============================================

class NPCController {
    constructor(npcData, position) {
        this.data = npcData;
        this.mesh = null;
        this.targetPosition = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3(position.x, 0, position.z);
        this.state = 'idle'; // idle, walking, talking
        this.stateTimer = 0;
        this.walkSpeed = 8 + Math.random() * 5;
        this.idleTime = 3 + Math.random() * 5;
        this.hasTalked = false;
        
        this.createMesh();
        this.pickNewTarget();
    }
    
    createMesh() {
        const group = new THREE.Group();
        group.position.copy(this.currentPosition);
        
        const data = this.data;
        const appearance = data.appearance;
        
        // Body - suit/dress
        const bodyGeometry = new THREE.CapsuleGeometry(1.2, 3.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: appearance.suit,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 3.5;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(1.0, 16, 12);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: appearance.skin,
            roughness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 6.5;
        head.castShadow = true;
        group.add(head);
        
        // Hair
        const hairGeometry = new THREE.SphereGeometry(1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: appearance.hair,
            roughness: 0.9
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 6.7;
        hair.rotation.x = -0.2;
        group.add(hair);
        
        // Face features
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 6.6, 0.85);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 6.6, 0.85);
        group.add(rightEye);
        
        // Mouth (line)
        const mouthGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.1);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x993333 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 6.2, 0.9);
        group.add(mouth);
        
        // Name tag floating above
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = data.category === 'victim' ? '#ff6666' : 
                        data.category === 'vip' ? '#ffdd00' : '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.name, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const label = new THREE.Sprite(labelMaterial);
        label.position.y = 9;
        label.scale.set(6, 1.5, 1);
        group.add(label);
        
        // Interaction indicator
        const indicatorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const indicatorColor = data.category === 'victim' ? 0xff0000 : 
                              data.category === 'vip' ? 0xffff00 : 0x00ff00;
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: indicatorColor });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = 10;
        indicator.userData.isIndicator = true;
        group.add(indicator);
        
        group.userData = {
            type: 'npc',
            id: data.id,
            name: data.name,
            dialogue: data.dialogues,
            voiceSettings: data.voiceSettings,
            dialogueIndex: 0,
            category: data.category,
            controller: this,
        };
        
        this.mesh = group;
        scene.add(group);
        npcs.push(group);
        interactables.push(group);
    }
    
    pickNewTarget() {
        // Pick random location on the island
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 150;
        this.targetPosition.set(
            Math.cos(angle) * dist,
            0,
            Math.sin(angle) * dist
        );
    }
    
    update(delta, playerPos) {
        if (!this.mesh) return;
        
        this.stateTimer -= delta;
        
        // Face player if close
        const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        const distToPlayer = toPlayer.length();
        
        if (distToPlayer < 30) {
            // Face player
            const angle = Math.atan2(toPlayer.x, toPlayer.z);
            this.mesh.rotation.y = angle;
            
            if (this.state === 'walking') {
                this.state = 'idle';
                this.stateTimer = 2;
            }
            return;
        }
        
        switch (this.state) {
            case 'idle':
                if (this.stateTimer <= 0) {
                    this.state = 'walking';
                    this.pickNewTarget();
                    this.stateTimer = 10 + Math.random() * 10;
                }
                break;
                
            case 'walking':
                const toTarget = new THREE.Vector3().subVectors(this.targetPosition, this.mesh.position);
                toTarget.y = 0;
                const dist = toTarget.length();
                
                if (dist < 3 || this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = this.idleTime;
                } else {
                    toTarget.normalize();
                    const moveAmount = this.walkSpeed * delta;
                    this.mesh.position.x += toTarget.x * moveAmount;
                    this.mesh.position.z += toTarget.z * moveAmount;
                    
                    // Face movement direction
                    const angle = Math.atan2(toTarget.x, toTarget.z);
                    this.mesh.rotation.y = angle;
                    
                    // Bobbing animation while walking
                    this.mesh.position.y = Math.sin(Date.now() * 0.01) * 0.3;
                }
                break;
        }
    }
}

let npcControllers = [];

// ============================================
// EVIDENCE DATA
// ============================================

const EVIDENCE_DATA = [
    {
        id: 'flight_log',
        name: 'Flight Log Fragment',
        position: { x: 175, z: -35 },
        content: `PARTIAL FLIGHT LOG - N908JE "LOLITA EXPRESS"
Date: [REDACTED]
Route: Teterboro → St. Thomas → Little St. James

PASSENGERS:
- [42ND PRESIDENT] + 3 unnamed females
- [BRITISH ROYAL] + personal assistant  
- [HOLLYWOOD A-LISTER] - noted "kept separate"

Crew Notes: "Additional passengers boarded in St. Thomas. 
Ages verified: N/A - per standing order."

Ground transport arranged. Customs cleared remotely.`,
        found: false,
    },
    {
        id: 'security_note',
        name: 'Security Protocol',
        position: { x: 5, z: -65 },
        content: `SECURITY DIRECTIVE #47 - EYES ONLY

CAMERA PROTOCOL:
- Zone A (public areas): 24/7 recording, retained 90 days
- Zone B (guest rooms): RECORD ALL, retain indefinitely  
- Zone C (Temple/basement): Master system only

VIP VISIT PROTOCOL:
1. All phones collected at dock
2. Staff confined to quarters
3. Guest phones provided (monitored)
4. NO PHOTOGRAPHY - violators terminated

Remember: Everything is recorded. Everything.
This is your insurance policy. And ours.`,
        found: false,
    },
    {
        id: 'temple_key',
        name: 'Temple Keycard',
        position: { x: -175, z: -75 },
        content: `Electronic keycard with gold owl emblem.
Access Level: INNER CIRCLE ONLY

Last Accessed: [DATA CORRUPTED]
Users Logged: JE, GM, [REDACTED], [REDACTED]

Strange symbols etched on reverse:
An owl with spread wings above 13 stars.

Note found with card:
"Midnight ceremonies - robes required.
What happens in the Temple stays buried
beneath the Temple."`,
        found: false,
    },
    {
        id: 'guest_list',
        name: 'Coded Guest Registry',
        position: { x: 55, z: 5 },
        content: `GUEST REGISTRY - DESTROY AFTER READING
Code names for deniability:

"Old Faithful" - comes monthly, likes them YOUNG
"The Prince" - requires discretion, British press
"Hollywood" - multiple entries, brings friends
"The Professor" - academic cover, recruits from campus
"The Governor" - political aspirations, easily controlled
"Mr. Underwear" - keeps clothes on, calls it massage

Each entry includes:
- Dates of visit
- "Companions" requested (age, type)
- Blackmail value rating (1-10)

Page deliberately burned at edges.`,
        found: false,
    },
    {
        id: 'construction_order',
        name: 'Underground Construction Order',
        position: { x: -185, z: -85 },
        content: `PRIVATE CONSTRUCTION - EXTREME DISCRETION

Temple Structure Modifications:
□ Underground level expansion - 3 floors
□ Soundproof ALL chambers - studio grade
□ Remove all windows below ground level
□ Steel reinforced doors - keypad + biometric
□ Separate HVAC - no shared air with surface
□ Medical-grade drainage system (WHY?)
□ Emergency tunnel to dock - 200 meters

Contractor note: "Client offered $2M bonus for 
absolute silence. All workers flown in from 
overseas. No local contractors permitted."

File marked: NEVER TO BE DISCOVERED`,
        found: false,
    },
    {
        id: 'photo_fragment',
        name: 'Torn Photograph - Damning',
        position: { x: 125, z: 55 },
        content: `A torn photograph - partial faces visible.

Setting: Lavish party, crystal chandeliers.
Subjects: Three men in tuxedos, champagne glasses.
         One face CIRCLED IN RED - a current world leader.
         Young woman in background - looks underage.

Back of photo, handwritten:
"April 2005 - They all knew. They all participated.
These are the good ones. The worse ones are in the safe.
Insurance policy #47"

The circled face is unmistakable.
This person is still in power.`,
        found: false,
    },
    {
        id: 'medical_supplies',
        name: 'Medical Supply Invoice - Disturbing',
        position: { x: -95, z: 55 },
        content: `MEDICAL SUPPLIES - PRIORITY SHIPMENT
Destination: LSJ Private Medical Facility

ORDER MANIFEST:
- Sedatives/tranquilizers: BULK QUANTITY
- Plan B medication: 200 units
- Pregnancy tests: 500 units  
- STI testing kits: 300 units
- "Morning after" supplies: ONGOING MONTHLY
- [REDACTED - COURT SEALED]
- Syringes, various sizes: 1000 units

Special Note: "All billing to personal account.
No insurance claims. No records. Destroy invoice."

Delivered to: Dr. [REDACTED]
Frequency: WEEKLY`,
        found: false,
    },
    {
        id: 'staff_diary',
        name: 'Housekeeper\'s Hidden Diary',
        position: { x: -55, z: 85 },
        content: `Found in floorboards - water damaged:

March 14: New girls arrived today. Three of them.
One was crying. Ghislaine took them to the main house.
They looked so young. Too young.

March 21: Cleaned the temple after "the ceremony."
Candle wax everywhere. And... stains. I didn't ask.
The smell was wrong. Like fear.

March 28: I saw [MAJOR CELEBRITY] with two girls.
They couldn't have been more than 15. He saw me see him.
Now he pays me $5000/month to forget.

April 2: I can't do this anymore. I'm keeping this diary.
If something happens to me, find this. Tell the world.
God forgive me for staying so long.

[Remaining pages torn out]`,
        found: false,
    },
    {
        id: 'blackmail_list',
        name: 'The Blackmail Files Index',
        position: { x: 200, z: 5 },
        content: `MASTER INDEX - INSURANCE POLICY

VIDEO RECORDINGS:
Cabinet A: Political Figures (23 tapes)
Cabinet B: Entertainment (47 tapes)  
Cabinet C: Business/Finance (31 tapes)
Cabinet D: Royalty/Aristocracy (12 tapes)
Cabinet E: Academic/Scientific (8 tapes)

PHOTOGRAPH ARCHIVE:
Vault 1: Compromising positions
Vault 2: Underage proof
Vault 3: Witness documentation

AUDIO RECORDINGS:
Safe 4: Phone calls (transcribed)
Safe 5: Room recordings
Safe 6: Confessions (some coerced)

Note: Copies stored at:
- NYC residence safe
- Paris apartment
- New Mexico ranch
- Offshore digital backup

"Everyone is compromised. Everyone is controlled."`,
        found: false,
    },
];

// ============================================
// CREEPY ATMOSPHERE ELEMENTS
// ============================================

const CREEPY_ELEMENTS = [
    { type: 'camera', positions: [
        { x: 50, z: 5, rotation: 0 },
        { x: 60, z: -5, rotation: Math.PI/2 },
        { x: 40, z: 0, rotation: -Math.PI/2 },
        { x: -180, z: -75, rotation: 0 },
        { x: -180, z: -85, rotation: Math.PI },
        { x: 120, z: 55, rotation: Math.PI/4 },
        { x: 80, z: -25, rotation: 0 },
        { x: 200, z: 5, rotation: Math.PI/2 },
        { x: -50, z: 75, rotation: 0 },
        { x: -100, z: 45, rotation: Math.PI/4 },
    ]},
    { type: 'locked_door', positions: [
        { x: 45, z: -15, label: 'PRIVATE - NO ENTRY' },
        { x: -183, z: -80, label: 'INNER SANCTUM' },
        { x: -100, z: 52, label: 'MEDICAL - STAFF ONLY' },
    ]},
    { type: 'basement_entrance', positions: [
        { x: 52, z: 3 },
        { x: -178, z: -82 },
    ]},
    { type: 'filing_cabinet', positions: [
        { x: 55, z: -10 },
        { x: 195, z: 5 },
    ]},
    { type: 'massage_table', positions: [
        { x: 122, z: 62 },
        { x: 118, z: 58 },
    ]},
    { type: 'painting_with_eyes', positions: [
        { x: 48, z: 8, facing: 'south' },
        { x: -175, z: -78 },
    ]},
    { type: 'child_furniture', positions: [
        { x: 125, z: 65 },
        { x: -48, z: 82 },
    ]},
    { type: 'safe', positions: [
        { x: 58, z: -8 },
        { x: 202, z: 2 },
    ]},
];

function createCreepyElements() {
    // Security Cameras
    CREEPY_ELEMENTS[0].positions.forEach(pos => {
        const cameraGroup = new THREE.Group();
        cameraGroup.position.set(pos.x, 8, pos.z);
        
        // Camera body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.8, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
        );
        cameraGroup.add(body);
        
        // Lens
        const lens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
        );
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.8;
        cameraGroup.add(lens);
        
        // Recording light (blinking)
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        light.position.set(0.3, 0.3, 0.7);
        light.userData.isRecordingLight = true;
        cameraGroup.add(light);
        
        cameraGroup.rotation.y = pos.rotation || 0;
        scene.add(cameraGroup);
    });
    
    // Locked doors
    CREEPY_ELEMENTS[1].positions.forEach(pos => {
        const doorGroup = new THREE.Group();
        doorGroup.position.set(pos.x, 0, pos.z);
        
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(4, 7, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x331111, metalness: 0.3 })
        );
        door.position.y = 3.5;
        doorGroup.add(door);
        
        // Heavy locks
        for (let i = 0; i < 3; i++) {
            const lock = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 })
            );
            lock.position.set(1.5, 2 + i * 1.5, 0.4);
            doorGroup.add(lock);
        }
        
        // Warning sign
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pos.label || 'RESTRICTED', 64, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.75),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        sign.position.set(0, 5.5, 0.3);
        doorGroup.add(sign);
        
        scene.add(doorGroup);
    });
    
    // Basement entrances
    CREEPY_ELEMENTS[2].positions.forEach(pos => {
        const hatch = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
        );
        hatch.position.set(pos.x, 0.2, pos.z);
        scene.add(hatch);
        
        // Handle
        const handle = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.1, 8, 16),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 })
        );
        handle.position.set(pos.x, 0.5, pos.z);
        handle.rotation.x = -Math.PI / 2;
        scene.add(handle);
    });
    
    // Filing cabinets (blackmail storage)
    CREEPY_ELEMENTS[3].positions.forEach(pos => {
        const cabinet = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 })
        );
        cabinet.position.set(pos.x, 2.5, pos.z);
        scene.add(cabinet);
        
        // Drawer handles
        for (let i = 0; i < 4; i++) {
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.1, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            handle.position.set(pos.x, 1 + i * 1.2, pos.z + 0.8);
            scene.add(handle);
        }
        
        // Label
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.4),
            new THREE.MeshBasicMaterial({ color: 0xffffcc })
        );
        label.position.set(pos.x, 4.5, pos.z + 0.76);
        scene.add(label);
    });
    
    // Massage tables
    CREEPY_ELEMENTS[4].positions.forEach(pos => {
        const tableGroup = new THREE.Group();
        tableGroup.position.set(pos.x, 0, pos.z);
        
        // Table top
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.2, 6),
            new THREE.MeshStandardMaterial({ color: 0xeeeeee })
        );
        top.position.y = 2;
        tableGroup.add(top);
        
        // Legs
        for (let x = -0.8; x <= 0.8; x += 1.6) {
            for (let z = -2.5; z <= 2.5; z += 5) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
                    new THREE.MeshStandardMaterial({ color: 0x888888 })
                );
                leg.position.set(x, 1, z);
                tableGroup.add(leg);
            }
        }
        
        // Face hole
        const hole = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
        );
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(0, 2.11, 2.5);
        tableGroup.add(hole);
        
        scene.add(tableGroup);
    });
    
    // Paintings with eyes that follow (owl-themed)
    CREEPY_ELEMENTS[5].positions.forEach(pos => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        frame.position.set(pos.x, 6, pos.z);
        scene.add(frame);
        
        // Dark canvas
        const canvas = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 4.5, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        canvas.position.set(pos.x, 6, pos.z + 0.2);
        scene.add(canvas);
        
        // Glowing eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        leftEye.position.set(pos.x - 0.5, 6.5, pos.z + 0.35);
        leftEye.userData.isFollowingEye = true;
        leftEye.userData.baseX = pos.x - 0.5;
        scene.add(leftEye);
        
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        rightEye.position.set(pos.x + 0.5, 6.5, pos.z + 0.35);
        rightEye.userData.isFollowingEye = true;
        rightEye.userData.baseX = pos.x + 0.5;
        scene.add(rightEye);
    });
    
    // Child-sized furniture (disturbing)
    CREEPY_ELEMENTS[6].positions.forEach(pos => {
        // Small bed
        const bed = new THREE.Group();
        
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: 0xffcccc })
        );
        frame.position.y = 0.8;
        bed.add(frame);
        
        const mattress = new THREE.Mesh(
            new THREE.BoxGeometry(2.3, 0.2, 3.8),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        mattress.position.y = 1;
        bed.add(mattress);
        
        // Teddy bear
        const bear = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        bear.position.set(0.8, 1.3, -1.5);
        bed.add(bear);
        
        bed.position.set(pos.x, 0, pos.z);
        scene.add(bed);
    });
    
    // Safes
    CREEPY_ELEMENTS[7].positions.forEach(pos => {
        const safe = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 3, 2),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 })
        );
        safe.position.set(pos.x, 1.5, pos.z);
        scene.add(safe);
        
        // Dial
        const dial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
            new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 })
        );
        dial.rotation.x = Math.PI / 2;
        dial.position.set(pos.x + 0.5, 1.8, pos.z + 1.05);
        scene.add(dial);
        
        // Handle
        const handleBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 })
        );
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(pos.x - 0.5, 1.5, pos.z + 1.05);
        scene.add(handleBar);
    });
}

// ============================================
// BUILDING INTERIORS DATA - CREEPIER
// ============================================

const INTERIOR_DATA = {
    temple: {
        name: 'The Temple - Interior',
        size: { w: 40, h: 25, d: 40 },
        color: 0x0a0a15,
        description: 'Strange symbols cover the walls. The air feels heavy.',
        objects: [
            { type: 'altar', position: { x: 0, y: 0, z: -12 } },
            { type: 'owl_statue', position: { x: -12, y: 0, z: 5 } },
            { type: 'owl_statue', position: { x: 12, y: 0, z: 5 } },
            { type: 'candles', position: { x: -10, y: 0, z: -10 } },
            { type: 'candles', position: { x: 10, y: 0, z: -10 } },
            { type: 'mattress_pile', position: { x: -8, y: 0, z: 8 } },
            { type: 'camera', position: { x: 15, y: 12, z: 15 } },
            { type: 'camera', position: { x: -15, y: 12, z: 15 } },
            { type: 'camera', position: { x: 0, y: 12, z: -15 } },
            { type: 'strange_symbols', position: { x: 0, y: 8, z: -18 } },
            { type: 'tunnel_entrance', position: { x: 0, y: 0, z: -18 } },
            { type: 'phone', position: { x: 14, y: 1, z: 12 }, isEasterEgg: true },
            { type: 'robes', position: { x: -15, y: 0, z: -5 } },
        ],
        evidence: {
            id: 'ritual_notes',
            name: 'Ritual Ceremony Notes',
            position: { x: -5, y: 2.5, z: -12 },
            content: `CEREMONY PROTOCOL - INNER CIRCLE ONLY

Midnight gatherings. Full moon preferred.
All participants wear the robes. Masks mandatory.

Order of events:
1. Procession from main house
2. Offering presented (age requirement: under 18)
3. The owl presides
4. Cameras roll - for posterity
5. What happens here NEVER leaves

Attendee list for last ceremony:
- [HEAD OF STATE]
- [BRITISH ROYAL]
- [TECH BILLIONAIRE]
- [HOLLYWOOD LEGEND]

Note: "The children must never speak of this.
They have been promised... consequences."`,
        },
    },
    main_mansion: {
        name: 'Main Residence',
        size: { w: 80, h: 15, d: 60 },
        color: 0x2a2a2a,
        objects: [
            { type: 'desk', position: { x: 25, y: 0, z: -5 } },
            { type: 'couch', position: { x: -25, y: 0, z: 5 } },
            { type: 'painting', position: { x: -35, y: 6, z: 0 } },
            { type: 'table', position: { x: 0, y: 0, z: -15 } },
            { type: 'safe', position: { x: 35, y: 0, z: -10 } },
            { type: 'camera', position: { x: 30, y: 10, z: 20 } },
            { type: 'camera', position: { x: -30, y: 10, z: 20 } },
            { type: 'monitor_wall', position: { x: 35, y: 3, z: 0 } },
        ],
        evidence: {
            id: 'client_ledger',
            name: 'Client Ledger - Payments',
            position: { x: 28, y: 2.5, z: -3 },
            content: `FINANCIAL LEDGER - CONFIDENTIAL

Services Rendered:
"DP-001" - Monthly retainer: $500,000
  Note: "Special preferences accommodated"
  
"HW-042" - Annual contribution: $2,000,000
  Note: "Recruiting assistance provided"
  
"PR-017" - Discretionary fund: $750,000
  Note: "Legal defense contribution"
  
"GV-008" - Campaign support: $1,500,000
  Note: "Future favors expected"

BLACKMAIL INSURANCE VALUES:
DP-001: Estimated $50 million
HW-042: Estimated $100 million (tech company stake)
PR-017: Crown estate protection - priceless
GV-008: Political capital - ongoing

"All clients compromised. All clients controlled."`,
        },
    },
    guest_house_1: {
        name: 'Guest Villa A - The Massage Suite',
        size: { w: 35, h: 12, d: 30 },
        color: 0x3a2a2a,
        objects: [
            { type: 'massage_table', position: { x: 0, y: 0, z: 0 } },
            { type: 'massage_table', position: { x: 8, y: 0, z: 0 } },
            { type: 'camera', position: { x: 12, y: 8, z: 10 } },
            { type: 'camera', position: { x: -12, y: 8, z: 10 } },
            { type: 'camera', position: { x: 0, y: 8, z: -12 } },
            { type: 'oil_bottles', position: { x: -10, y: 1, z: -8 } },
            { type: 'locked_cabinet', position: { x: 12, y: 0, z: -10 } },
        ],
        evidence: {
            id: 'massage_schedule',
            name: 'Massage Appointment Book',
            position: { x: -8, y: 1, z: 8 },
            content: `APPOINTMENT SCHEDULE - VILLA A

March 15:
- 10am: [TECH CEO] - Swedish, 2 girls
- 2pm: [SENATOR] - Deep tissue, "young hands preferred"
- 8pm: [ROYAL GUEST] - Private session, no staff

March 16:
- 11am: [ACTOR] - Full service, 3 masseuses
- 4pm: [FINANCE GUY] - As usual
- 9pm: BLOCKED - Ghislaine personal booking

Notes:
"All girls must be briefed on 'happy endings'"
"Ages verified: DO NOT VERIFY"
"Cameras active in all rooms"
"Client satisfaction = our insurance"`,
        },
    },
};

// ============================================
// AUDIO SYSTEM - CREEPIER
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
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.createOceanSound();
        this.createWindSound();
        this.createCreepyAmbience();
        this.scheduleRandomSounds();
        
        this.isPlaying = true;
    }
    
    createOceanSound() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 400;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.2;
        
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 0.08;
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
        gain.gain.value = 0.04;
        
        windNoise.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);
        windNoise.start();
        
        this.oscillators.push(windNoise);
    }
    
    createCreepyAmbience() {
        // Low drone
        const drone = this.audioContext.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 55; // Low A
        
        const droneGain = this.audioContext.createGain();
        droneGain.gain.value = 0.03;
        
        // Slow LFO for unsettling modulation
        const droneLfo = this.audioContext.createOscillator();
        droneLfo.frequency.value = 0.05;
        const droneLfoGain = this.audioContext.createGain();
        droneLfoGain.gain.value = 5;
        droneLfo.connect(droneLfoGain);
        droneLfoGain.connect(drone.frequency);
        droneLfo.start();
        
        drone.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone.start();
        
        this.oscillators.push(drone, droneLfo);
    }
    
    scheduleRandomSounds() {
        const scheduleNext = () => {
            if (!this.isPlaying) return;
            
            const soundType = Math.random();
            
            if (soundType < 0.3) {
                // Distant scream/cry
                this.playDistantScream();
            } else if (soundType < 0.5) {
                // Door closing
                this.playDoorSound();
            } else if (soundType < 0.7) {
                // Creepy whisper
                this.playWhisper();
            } else {
                // Bird call (innocent contrast)
                this.playBirdCall();
            }
            
            // Random interval: 10-40 seconds
            setTimeout(scheduleNext, 10000 + Math.random() * 30000);
        };
        
        setTimeout(scheduleNext, 5000);
    }
    
    playDistantScream() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;
        
        const now = this.audioContext.currentTime;
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
        osc.frequency.linearRampToValueAtTime(400, now + 0.8);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1);
    }
    
    playDoorSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 100;
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    playWhisper() {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.015;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playBirdCall() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        const now = this.audioContext.currentTime;
        
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(1800, now + 0.1);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
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
// PHONE EASTER EGG
// ============================================

class PhoneRinger {
    constructor() {
        this.audioContext = null;
        this.isRinging = false;
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const ringGain = this.audioContext.createGain();
        
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        osc1.type = 'sine';
        osc2.type = 'sine';
        ringGain.gain.value = 0.1;
        
        osc1.connect(ringGain);
        osc2.connect(ringGain);
        ringGain.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
        
        const osc3 = this.audioContext.createOscillator();
        const osc4 = this.audioContext.createOscillator();
        const ringGain2 = this.audioContext.createGain();
        
        osc3.frequency.value = 440;
        osc4.frequency.value = 480;
        osc3.type = 'sine';
        osc4.type = 'sine';
        ringGain2.gain.value = 0.1;
        
        osc3.connect(ringGain2);
        osc4.connect(ringGain2);
        ringGain2.connect(this.audioContext.destination);
        
        osc3.start(now + 0.5);
        osc4.start(now + 0.5);
        osc3.stop(now + 0.9);
        osc4.stop(now + 0.9);
        
        setTimeout(() => {
            if (this.isRinging) this.ring();
        }, 3000);
    }
    
    stopRinging() {
        this.isRinging = false;
    }
}

const phoneRinger = new PhoneRinger();

// ============================================
// INITIALIZATION
// ============================================

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.0025); // More fog for atmosphere
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(180, playerHeight + 5, 80);
    camera.lookAt(0, playerHeight, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    controls = new PointerLockControls(camera, document.body);
    
    // Setup scene
    createSky();
    createWater();
    createIsland();
    createBuildings();
    createVegetation();
    createPaths();
    createEvidence();
    createCreepyElements();
    createLighting();
    createBuildingInteriors();
    spawnAllNPCs();
    setupMinimap();
    
    phoneRinger.init();
    
    setupEventListeners();
    
    // Show start button
    setTimeout(() => {
        document.getElementById('start-btn').style.display = 'block';
    }, 2000);
    
    animate();
}

// ============================================
// SPAWN ALL NPCs
// ============================================

function spawnAllNPCs() {
    // Famous NPCs - spread around important locations
    const famousPositions = [
        { x: 60, z: 20 },   // Near mansion
        { x: 40, z: -10 },  // Near mansion
        { x: 100, z: 50 },  // Near guest house
        { x: 130, z: 30 },  // Near guest houses
        { x: 75, z: -20 },  // Near pool
        { x: 180, z: -30 }, // Near helipad
        { x: -150, z: -60 }, // Near temple
        { x: -170, z: -70 }, // Near temple
        { x: 0, z: -50 },   // Near sundial
        { x: -80, z: 60 },  // Near staff quarters
        { x: 170, z: -45 }, // Near helipad
        { x: 30, z: 40 },   // Central
    ];
    
    FAMOUS_NPCS.forEach((npcData, i) => {
        const pos = famousPositions[i] || { x: Math.random() * 200 - 100, z: Math.random() * 200 - 100 };
        npcControllers.push(new NPCController(npcData, pos));
    });
    
    // Other NPCs
    const otherPositions = [
        { x: 80, z: 10 },
        { x: 55, z: 25 },
        { x: 110, z: 65 },
        { x: 190, z: 5 },
        { x: 195, z: -5 },
        { x: 175, z: -35 },
        { x: -45, z: 78 },
        { x: -55, z: 82 },
    ];
    
    OTHER_NPCS.forEach((npcData, i) => {
        const pos = otherPositions[i] || { x: Math.random() * 200 - 100, z: Math.random() * 150 - 75 };
        npcControllers.push(new NPCController(npcData, pos));
    });
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
    skyUniforms['turbidity'].value = 15;
    skyUniforms['rayleigh'].value = 3;
    skyUniforms['mieCoefficient'].value = 0.01;
    skyUniforms['mieDirectionalG'].value = 0.85;
    
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
    
    const dayColor = new THREE.Color(0x87ceeb);
    const sunsetColor = new THREE.Color(0xff5533);
    const nightColor = new THREE.Color(0x0a0a1a);
    
    let fogColor;
    if (gameState.time < 0.25) {
        fogColor = nightColor.clone().lerp(dayColor, gameState.time * 4);
    } else if (gameState.time < 0.7) {
        fogColor = dayColor;
    } else if (gameState.time < 0.85) {
        const t = (gameState.time - 0.7) * 6.67;
        fogColor = dayColor.clone().lerp(sunsetColor, t);
    } else {
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
    // Beach ring
    const beachGeometry = new THREE.CircleGeometry(280, 64);
    const beachMaterial = new THREE.MeshStandardMaterial({
        color: 0xf4e4c1,
        roughness: 0.9,
        metalness: 0
    });
    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.rotation.x = -Math.PI / 2;
    beach.position.y = 1;
    beach.receiveShadow = true;
    scene.add(beach);
    
    // Main grass
    const grassGeometry = new THREE.CircleGeometry(250, 64);
    const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d4a2d,
        roughness: 0.85,
        metalness: 0
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 2;
    grass.receiveShadow = true;
    scene.add(grass);
    terrainMesh = grass;
}

function getTerrainHeight(x, z) {
    return 3;
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
    const baseHeight = 25;
    
    const baseGeometry = new THREE.BoxGeometry(data.size.w, baseHeight, data.size.d);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5dc,
        roughness: 0.7,
        metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = baseHeight / 2 + 5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Stripes
    const stripeCount = 6;
    const stripeHeight = baseHeight / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        const stripeGeometry = new THREE.BoxGeometry(data.size.w + 0.2, stripeHeight, data.size.d + 0.2);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x1e90ff : 0xffffff,
            roughness: 0.5,
            metalness: 0.2
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.y = baseHeight / 2 + 5 - baseHeight/2 + stripeHeight/2 + i * stripeHeight;
        group.add(stripe);
    }
    
    // Dome
    const domeGeometry = new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = baseHeight + 5;
    dome.castShadow = true;
    group.add(dome);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(4, 8, 0.5);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x330000,
        roughness: 0.6,
        metalness: 0.3
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 9, data.size.d / 2 + 0.2);
    door.userData = {
        type: 'door',
        buildingId: data.id,
        buildingName: data.name,
    };
    group.add(door);
    interactables.push(door);
    
    // Owl statues
    const owlGeometry = new THREE.ConeGeometry(2, 5, 4);
    const owlMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.4,
        metalness: 0.6
    });
    
    [-1, 1].forEach(side => {
        const owl = new THREE.Mesh(owlGeometry, owlMaterial);
        owl.position.set(side * 7, 7, data.size.d / 2 + 3);
        owl.castShadow = true;
        group.add(owl);
    });
}

function createSundial(group, data) {
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
    const hMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    
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
        color: 0x222222, // Dark/blacked out
        roughness: 0.1,
        metalness: 0.8
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
    }
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(4, 6, 1);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a1810,
        roughness: 0.6,
        metalness: 0
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
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(data.size.w, data.size.d);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: buildingId === 'temple' ? 0x0a0a15 : 0x3a2a1a,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.1;
        floor.receiveShadow = true;
        interiorGroup.add(floor);
        
        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        
        const wallHeight = data.size.h;
        
        // Walls with door opening
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
        
        const doorTop = new THREE.Mesh(
            new THREE.BoxGeometry(6, wallHeight - 7, 0.5),
            wallMaterial
        );
        doorTop.position.set(0, wallHeight - (wallHeight - 7) / 2, data.size.d / 2);
        interiorGroup.add(doorTop);
        
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(data.size.w, wallHeight, 0.5),
            wallMaterial
        );
        backWall.position.set(0, wallHeight / 2, -data.size.d / 2);
        interiorGroup.add(backWall);
        
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, wallHeight, data.size.d),
            wallMaterial
        );
        leftWall.position.set(-data.size.w / 2, wallHeight / 2, 0);
        interiorGroup.add(leftWall);
        
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, wallHeight, data.size.d),
            wallMaterial
        );
        rightWall.position.set(data.size.w / 2, wallHeight / 2, 0);
        interiorGroup.add(rightWall);
        
        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(data.size.w, data.size.d),
            new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = wallHeight;
        interiorGroup.add(ceiling);
        
        // Interior objects
        data.objects.forEach(obj => {
            createInteriorObject(interiorGroup, obj, buildingId);
        });
        
        // Interior evidence
        if (data.evidence) {
            createInteriorEvidence(interiorGroup, data.evidence);
        }
        
        // Exit zone
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
        const lightColor = buildingId === 'temple' ? 0xff3300 : 0xffffdd;
        const interiorLight = new THREE.PointLight(lightColor, 1, 60);
        interiorLight.position.set(0, wallHeight - 2, 0);
        interiorLight.castShadow = true;
        interiorGroup.add(interiorLight);
        
        if (buildingId === 'temple') {
            // Extra creepy red lights
            const redLight1 = new THREE.PointLight(0xff0000, 0.5, 30);
            redLight1.position.set(-10, 5, -10);
            interiorGroup.add(redLight1);
            
            const redLight2 = new THREE.PointLight(0xff0000, 0.5, 30);
            redLight2.position.set(10, 5, -10);
            interiorGroup.add(redLight2);
        }
        
        interiorScenes[buildingId] = interiorGroup;
        scene.add(interiorGroup);
    });
}

function createInteriorObject(group, objData, buildingId) {
    let mesh;
    
    switch (objData.type) {
        case 'altar':
            const altarGroup = new THREE.Group();
            const altarGeo = new THREE.BoxGeometry(10, 4, 5);
            const altarMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
            const altarMesh = new THREE.Mesh(altarGeo, altarMat);
            altarMesh.position.y = 2;
            altarGroup.add(altarMesh);
            
            // Red cloth
            const cloth = new THREE.Mesh(
                new THREE.BoxGeometry(11, 0.2, 6),
                new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0.7 })
            );
            cloth.position.y = 4.1;
            altarGroup.add(cloth);
            
            altarGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = altarGroup;
            break;
            
        case 'owl_statue':
            const owlGroup = new THREE.Group();
            
            // Body
            const owlBody = new THREE.Mesh(
                new THREE.ConeGeometry(2, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.3 })
            );
            owlBody.position.y = 4;
            owlGroup.add(owlBody);
            
            // Eyes (glowing)
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), eyeMat);
            leftEye.position.set(-0.5, 6, 1);
            owlGroup.add(leftEye);
            
            const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), eyeMat);
            rightEye.position.set(0.5, 6, 1);
            owlGroup.add(rightEye);
            
            owlGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = owlGroup;
            break;
            
        case 'candles':
            const candleGroup = new THREE.Group();
            for (let i = 0; i < 7; i++) {
                const candle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.15, 1.5 + Math.random() * 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
                );
                candle.position.set(
                    (Math.random() - 0.5) * 2,
                    0.75,
                    (Math.random() - 0.5) * 2
                );
                candleGroup.add(candle);
                
                const flame = new THREE.Mesh(
                    new THREE.ConeGeometry(0.1, 0.4, 8),
                    new THREE.MeshBasicMaterial({ color: 0xff6600 })
                );
                flame.position.y = candle.position.y + 0.9;
                flame.position.x = candle.position.x;
                flame.position.z = candle.position.z;
                candleGroup.add(flame);
            }
            candleGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = candleGroup;
            break;
            
        case 'mattress_pile':
            const mattressGroup = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const mattress = new THREE.Mesh(
                    new THREE.BoxGeometry(5 - i * 0.5, 0.3, 7),
                    new THREE.MeshStandardMaterial({ 
                        color: 0xcccccc,
                        roughness: 0.9
                    })
                );
                mattress.position.y = 0.15 + i * 0.35;
                mattress.rotation.y = (Math.random() - 0.5) * 0.3;
                mattressGroup.add(mattress);
            }
            mattressGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = mattressGroup;
            break;
            
        case 'camera':
            const camGroup = new THREE.Group();
            const camBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.6, 1),
                new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
            );
            camGroup.add(camBody);
            
            const camLens = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            camLens.rotation.x = Math.PI / 2;
            camLens.position.z = 0.6;
            camGroup.add(camLens);
            
            const recLight = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            recLight.position.set(0.3, 0.2, 0.5);
            camGroup.add(recLight);
            
            camGroup.position.set(objData.position.x, objData.position.y || 10, objData.position.z);
            mesh = camGroup;
            break;
            
        case 'strange_symbols':
            // Occult-looking symbols on wall
            const symbolsGroup = new THREE.Group();
            
            // Pentagram-ish shape
            const pentMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * 3,
                    Math.sin(angle) * 3,
                    0
                ));
            }
            const pentGeo = new THREE.BufferGeometry().setFromPoints(points);
            const pent = new THREE.Line(pentGeo, pentMat);
            symbolsGroup.add(pent);
            
            // Circle around it
            const circleMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const circlePoints = [];
            for (let i = 0; i <= 32; i++) {
                const angle = (i / 32) * Math.PI * 2;
                circlePoints.push(new THREE.Vector3(
                    Math.cos(angle) * 4,
                    Math.sin(angle) * 4,
                    0
                ));
            }
            const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
            const circle = new THREE.Line(circleGeo, circleMat);
            symbolsGroup.add(circle);
            
            symbolsGroup.position.set(objData.position.x, objData.position.y || 8, objData.position.z);
            mesh = symbolsGroup;
            break;
            
        case 'tunnel_entrance':
            const tunnelGroup = new THREE.Group();
            
            // Dark opening
            const opening = new THREE.Mesh(
                new THREE.PlaneGeometry(6, 8),
                new THREE.MeshBasicMaterial({ color: 0x000000 })
            );
            opening.position.y = 4;
            tunnelGroup.add(opening);
            
            // Frame
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
            const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), frameMat);
            leftFrame.position.set(-3, 4, 0.3);
            tunnelGroup.add(leftFrame);
            
            const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), frameMat);
            rightFrame.position.set(3, 4, 0.3);
            tunnelGroup.add(rightFrame);
            
            tunnelGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = tunnelGroup;
            break;
            
        case 'phone':
            const phoneGeo = new THREE.BoxGeometry(0.8, 0.3, 0.4);
            const phoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
            mesh = new THREE.Mesh(phoneGeo, phoneMat);
            mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
            mesh.userData = {
                type: 'phone',
                isEasterEgg: true,
                name: 'Ringing Phone',
            };
            interactables.push(mesh);
            
            const phoneGlow = new THREE.Mesh(
                new THREE.SphereGeometry(1, 16, 12),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 })
            );
            mesh.add(phoneGlow);
            break;
            
        case 'robes':
            const robeGroup = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const robe = new THREE.Mesh(
                    new THREE.ConeGeometry(0.8, 5, 8),
                    new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.9 })
                );
                robe.position.set(i * 1.5 - 3, 2.5, 0);
                robeGroup.add(robe);
            }
            robeGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = robeGroup;
            break;
            
        case 'desk':
            const deskGeo = new THREE.BoxGeometry(5, 2.5, 3);
            const deskMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 });
            mesh = new THREE.Mesh(deskGeo, deskMat);
            mesh.position.set(objData.position.x, 1.25, objData.position.z);
            break;
            
        case 'couch':
            const couchGroup = new THREE.Group();
            const couchBase = new THREE.Mesh(
                new THREE.BoxGeometry(6, 1.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x3a2020 })
            );
            couchBase.position.y = 0.75;
            couchGroup.add(couchBase);
            
            const couchBack = new THREE.Mesh(
                new THREE.BoxGeometry(6, 2, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x3a2020 })
            );
            couchBack.position.set(0, 1.5, -1.25);
            couchGroup.add(couchBack);
            
            couchGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = couchGroup;
            break;
            
        case 'painting':
            const paintingGroup = new THREE.Group();
            const frame = new THREE.Mesh(
                new THREE.BoxGeometry(4, 5, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x8b4513 })
            );
            paintingGroup.add(frame);
            
            // Dark canvas
            const paintCanvas = new THREE.Mesh(
                new THREE.BoxGeometry(3.5, 4.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
            );
            paintCanvas.position.z = 0.1;
            paintingGroup.add(paintCanvas);
            
            // Glowing eyes in painting
            const paintEyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const paintLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), paintEyeMat);
            paintLeftEye.position.set(-0.4, 0.5, 0.2);
            paintingGroup.add(paintLeftEye);
            
            const paintRightEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), paintEyeMat);
            paintRightEye.position.set(0.4, 0.5, 0.2);
            paintingGroup.add(paintRightEye);
            
            paintingGroup.position.set(objData.position.x, objData.position.y || 5, objData.position.z);
            mesh = paintingGroup;
            break;
            
        case 'table':
            const tableGeo = new THREE.BoxGeometry(10, 0.3, 4);
            const tableMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.5 });
            mesh = new THREE.Mesh(tableGeo, tableMat);
            mesh.position.set(objData.position.x, 2.5, objData.position.z);
            
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
            const safeGeo = new THREE.BoxGeometry(2.5, 3, 2);
            const safeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.7 });
            mesh = new THREE.Mesh(safeGeo, safeMat);
            mesh.position.set(objData.position.x, 1.5, objData.position.z);
            break;
            
        case 'monitor_wall':
            const monitorWall = new THREE.Group();
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 2; y++) {
                    const monitor = new THREE.Mesh(
                        new THREE.BoxGeometry(3, 2, 0.3),
                        new THREE.MeshStandardMaterial({ color: 0x111111 })
                    );
                    monitor.position.set(x * 3.5 - 3.5, y * 2.5, 0);
                    monitorWall.add(monitor);
                    
                    // Screen (static)
                    const screen = new THREE.Mesh(
                        new THREE.BoxGeometry(2.7, 1.7, 0.1),
                        new THREE.MeshBasicMaterial({ color: 0x003300 })
                    );
                    screen.position.z = 0.2;
                    monitor.add(screen);
                }
            }
            monitorWall.position.set(objData.position.x, objData.position.y || 4, objData.position.z);
            mesh = monitorWall;
            break;
            
        case 'massage_table':
            const mtGroup = new THREE.Group();
            const mtTop = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.2, 6),
                new THREE.MeshStandardMaterial({ color: 0xeeeeee })
            );
            mtTop.position.y = 2;
            mtGroup.add(mtTop);
            
            for (let x = -0.8; x <= 0.8; x += 1.6) {
                for (let z = -2.5; z <= 2.5; z += 5) {
                    const leg = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
                        new THREE.MeshStandardMaterial({ color: 0x888888 })
                    );
                    leg.position.set(x, 1, z);
                    mtGroup.add(leg);
                }
            }
            
            mtGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = mtGroup;
            break;
            
        case 'oil_bottles':
            const oilGroup = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const bottle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
                    new THREE.MeshStandardMaterial({ color: 0x553300, transparent: true, opacity: 0.7 })
                );
                bottle.position.set(i * 0.5 - 1, 0.4, 0);
                oilGroup.add(bottle);
            }
            oilGroup.position.set(objData.position.x, objData.position.y || 0, objData.position.z);
            mesh = oilGroup;
            break;
            
        case 'locked_cabinet':
            const cabGroup = new THREE.Group();
            const cabinet = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 5, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 })
            );
            cabinet.position.y = 2.5;
            cabGroup.add(cabinet);
            
            // Heavy lock
            const lock = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
            );
            lock.position.set(0.8, 2.5, 0.8);
            cabGroup.add(lock);
            
            cabGroup.position.set(objData.position.x, 0, objData.position.z);
            mesh = cabGroup;
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
        emissiveIntensity: 0.5
    });
    const doc = new THREE.Mesh(docGeometry, docMaterial);
    doc.castShadow = true;
    evidenceGroup.add(doc);
    
    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.25
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
        const building = ISLAND_LAYOUT.buildings.find(b => b.id === buildingId);
        showBuildingInfo({ 
            name: building?.name || 'Building', 
            description: building?.description || 'This building cannot be entered.' 
        });
        return;
    }
    
    const building = ISLAND_LAYOUT.buildings.find(b => b.id === buildingId);
    if (!building) return;
    
    gameState.inInterior = buildingId;
    
    interior.position.set(0, 0, 0);
    interior.visible = true;
    
    camera.position.set(0, playerHeight, INTERIOR_DATA[buildingId].size.d / 2 - 5);
    camera.lookAt(0, playerHeight, 0);
    
    if (water) water.visible = false;
    
    gameState.currentLocation = INTERIOR_DATA[buildingId].name;
    document.getElementById('location').textContent = `Location: ${gameState.currentLocation}`;
    
    // Phone easter egg in temple
    if (buildingId === 'temple' && !gameState.phoneFound) {
        setTimeout(() => {
            if (gameState.inInterior === 'temple') {
                phoneRinger.startRinging();
                gameState.phoneRinging = true;
            }
        }, 3000);
    }
    
    // Update tension
    gameState.tensionLevel = Math.min(10, gameState.tensionLevel + 1);
}

function exitBuilding() {
    if (!gameState.inInterior) return;
    
    const buildingId = gameState.inInterior;
    const building = ISLAND_LAYOUT.buildings.find(b => b.id === buildingId);
    
    if (interiorScenes[buildingId]) {
        interiorScenes[buildingId].visible = false;
    }
    
    if (water) water.visible = true;
    
    if (gameState.phoneRinging) {
        phoneRinger.stopRinging();
        gameState.phoneRinging = false;
    }
    
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
    const palmPositions = [];
    for (let i = 0; i < ISLAND_LAYOUT.vegetation.palmCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 180;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        let valid = true;
        ISLAND_LAYOUT.buildings.forEach(b => {
            const dx = x - b.position.x;
            const dz = z - b.position.z;
            if (Math.sqrt(dx*dx + dz*dz) < 25) valid = false;
        });
        
        if (valid) {
            palmPositions.push({ x, z });
        }
    }
    
    palmPositions.forEach(pos => {
        createPalmTree(pos.x, pos.z);
    });
    
    for (let i = 0; i < ISLAND_LAYOUT.vegetation.bushCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 200;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        createBush(x, z);
    }
}

function createPalmTree(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    const trunkHeight = 10 + Math.random() * 10;
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b5344,
        roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    group.add(trunk);
    
    const frondMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a5a1a,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 9; i++) {
        const frondGeometry = new THREE.PlaneGeometry(1.2, 7);
        const frond = new THREE.Mesh(frondGeometry, frondMaterial);
        frond.position.y = trunkHeight;
        frond.rotation.x = -Math.PI / 4 - Math.random() * 0.2;
        frond.rotation.y = (i / 9) * Math.PI * 2;
        frond.position.x = Math.cos(frond.rotation.y) * 0.5;
        frond.position.z = Math.sin(frond.rotation.y) * 0.5;
        frond.castShadow = true;
        group.add(frond);
    }
    
    scene.add(group);
}

function createBush(x, z) {
    const size = 0.8 + Math.random() * 1.2;
    const bushGeometry = new THREE.SphereGeometry(size, 8, 6);
    const bushMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a4a1a,
        roughness: 0.9
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, size * 0.4, z);
    bush.scale.y = 0.6;
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
// EVIDENCE
// ============================================

function createEvidence() {
    EVIDENCE_DATA.forEach(evidence => {
        const group = new THREE.Group();
        group.position.set(evidence.position.x, 1, evidence.position.z);
        
        const docGeometry = new THREE.BoxGeometry(1.5, 0.1, 2);
        const docMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,
            roughness: 0.5,
            emissive: 0xffff00,
            emissiveIntensity: 0.4
        });
        const doc = new THREE.Mesh(docGeometry, docMaterial);
        doc.castShadow = true;
        group.add(doc);
        
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2
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
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
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
    
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.3);
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
    
    minimapCtx.fillStyle = '#1a3d5a';
    minimapCtx.fillRect(0, 0, 150, 150);
    
    const scale = 0.25;
    const offsetX = 75;
    const offsetZ = 75;
    
    minimapCtx.fillStyle = '#2d5a2d';
    minimapCtx.beginPath();
    minimapCtx.ellipse(offsetX - 20, offsetZ, 60, 50, 0.2, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Paths
    minimapCtx.strokeStyle = '#c2b280';
    minimapCtx.lineWidth = 1;
    ISLAND_LAYOUT.paths.forEach(path => {
        minimapCtx.beginPath();
        minimapCtx.moveTo(path.from.x * scale + offsetX, path.from.z * scale + offsetZ);
        minimapCtx.lineTo(path.to.x * scale + offsetX, path.to.z * scale + offsetZ);
        minimapCtx.stroke();
    });
    
    // Buildings
    ISLAND_LAYOUT.buildings.forEach(b => {
        const x = b.position.x * scale + offsetX;
        const z = b.position.z * scale + offsetZ;
        const w = (b.size.w || 10) * scale;
        const h = (b.size.d || 10) * scale;
        
        if (INTERIOR_DATA[b.id]) {
            minimapCtx.fillStyle = '#aa8855';
        } else {
            minimapCtx.fillStyle = '#666';
        }
        
        if (b.id === 'temple') {
            minimapCtx.fillStyle = '#4488ff';
        }
        
        minimapCtx.fillRect(x - w/2, z - h/2, w, h);
    });
    
    // Evidence
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
    
    // NPCs
    npcs.forEach(npc => {
        const cat = npc.userData.category;
        if (cat === 'victim') {
            minimapCtx.fillStyle = '#ff6666';
        } else if (cat === 'vip') {
            minimapCtx.fillStyle = '#ffff00';
        } else {
            minimapCtx.fillStyle = '#00ff00';
        }
        const x = npc.position.x * scale + offsetX;
        const z = npc.position.z * scale + offsetZ;
        minimapCtx.beginPath();
        minimapCtx.arc(x, z, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    });
    
    // Player
    minimapCtx.fillStyle = '#fff';
    const px = camera.position.x * scale + offsetX;
    const pz = camera.position.z * scale + offsetZ;
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, 4, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Player direction
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    minimapCtx.strokeStyle = '#fff';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, pz);
    minimapCtx.lineTo(px + dir.x * 10, pz + dir.z * 10);
    minimapCtx.stroke();
    
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
    document.getElementById('start-btn').addEventListener('click', startGame);
    
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
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
    setupMobileControls();
}

function startGame() {
    document.getElementById('loading-screen').classList.add('hidden');
    gameState.isPlaying = true;
    controls.lock();
    
    ambientAudio.init();
    ambientAudio.start();
    
    // Show intro message
    showMessage("Welcome to Little St. James Island. Explore, find evidence, talk to people.");
}

function showMessage(text, duration = 3000) {
    const prompt = document.getElementById('interaction-prompt');
    prompt.textContent = text;
    prompt.classList.add('visible');
    setTimeout(() => {
        prompt.classList.remove('visible');
    }, duration);
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
            // WALKING ONLY - no flying, just jump
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
    const mobileInteract = document.getElementById('mobile-interact');
    
    let moveTouch = null;
    
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
        if (gameState.inInterior) {
            const parent = obj.parent;
            if (parent && parent.userData && parent.userData.buildingId === gameState.inInterior) {
                obj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.parentInteractable = obj;
                        meshes.push(child);
                    }
                });
            }
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
                promptText = '📞 Press E to answer phone';
            } else if (parent.userData.type === 'npc') {
                promptText = `Press E to talk to ${parent.userData.name}`;
            } else if (parent.userData.type === 'evidence') {
                promptText = `Press E to examine ${parent.userData.name}`;
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
    
    // Speak the creepy message
    voiceSystem.speak("Hello? Is anyone there? They can't keep hiding forever... the list... they're all on the list...", {
        voiceType: 'male-deep',
        rate: 0.8,
        pitch: 0.6
    });
    
    const popup = document.getElementById('evidence-popup');
    const title = document.getElementById('evidence-title');
    const content = document.getElementById('evidence-content');
    
    title.textContent = "📞 INCOMING CALL";
    content.innerHTML = `<span style="color: #c41e3a; font-weight: bold;">UNKNOWN CALLER...</span>

*static*

"Hello? Is anyone there?"

*garbled voice*

"...they can't keep hiding forever..."
"...the list... they're all on the list..."
"...the tapes... find the tapes..."

*click*

<span style="color: #666; font-style: italic;">The line goes dead.</span>

<span style="color: #ffd700;">🏆 EASTER EGG FOUND: "The Call"</span>`;
    
    popup.classList.add('visible');
    controls.unlock();
    
    gameState.evidenceCollected.push({
        id: 'mysterious_call',
        name: '📞 Mysterious Phone Call',
        content: 'A disturbing phone call from an unknown source. Someone knows the truth.'
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
    const dialogueText = npcData.dialogue[0];
    text.textContent = dialogueText;
    dialogueBox.classList.add('visible');
    
    // SPEAK with voice!
    if (npcData.voiceSettings) {
        voiceSystem.speak(dialogueText, npcData.voiceSettings);
    }
    
    controls.unlock();
}

function advanceDialogue() {
    if (!gameState.currentDialogue) return;
    
    gameState.dialogueIndex++;
    
    if (gameState.dialogueIndex >= gameState.currentDialogue.dialogue.length) {
        endDialogue();
        return;
    }
    
    const dialogueText = gameState.currentDialogue.dialogue[gameState.dialogueIndex];
    const text = document.getElementById('dialogue-text');
    text.textContent = dialogueText;
    
    // SPEAK the next line!
    if (gameState.currentDialogue.voiceSettings) {
        voiceSystem.speak(dialogueText, gameState.currentDialogue.voiceSettings);
    }
}

function endDialogue() {
    gameState.inDialogue = false;
    
    if (!gameState.npcsSpoken.includes(gameState.currentDialogue.id)) {
        gameState.npcsSpoken.push(gameState.currentDialogue.id);
    }
    
    voiceSystem.stop();
    
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
    
    // Increase tension
    gameState.tensionLevel = Math.min(10, gameState.tensionLevel + 1);
    
    showEvidence(data);
    updateInventory();
}

function showEvidence(data) {
    const popup = document.getElementById('evidence-popup');
    const title = document.getElementById('evidence-title');
    const content = document.getElementById('evidence-content');
    
    title.textContent = '🔍 ' + data.name;
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
    
    title.textContent = '🏛️ ' + data.name;
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
    // Could expand for full details
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
        const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (dist > 220) {
            gameState.currentLocation = 'Beach';
        } else if (pos.x < -100) {
            gameState.currentLocation = 'West Ridge - Temple Area';
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
    if (water && water.visible) {
        water.material.uniforms['time'].value += delta * 0.5;
    }
    
    // WALKING ONLY movement (no flying!)
    if (controls.isLocked) {
        const speed = CONFIG.moveSpeed;
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y += CONFIG.gravity * delta;
        
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
        
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        camera.position.y += velocity.y * delta;
        
        // Ground collision
        if (gameState.inInterior) {
            const interior = INTERIOR_DATA[gameState.inInterior];
            if (interior) {
                const halfW = interior.size.w / 2 - 2;
                const halfD = interior.size.d / 2 - 2;
                
                camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
                camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
            }
            
            if (camera.position.y < playerHeight) {
                velocity.y = 0;
                camera.position.y = playerHeight;
                canJump = true;
            }
        } else {
            const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
            const groundLevel = terrainHeight + playerHeight;
            
            if (camera.position.y < groundLevel) {
                velocity.y = 0;
                camera.position.y = groundLevel;
                canJump = true;
            }
            
            // Keep player on island
            const maxDist = 280;
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
    
    // Update NPC controllers (walking AI)
    const playerPos = camera.position.clone();
    npcControllers.forEach(ctrl => {
        ctrl.update(delta, playerPos);
    });
    
    // Animate NPC indicators (floating)
    const time = Date.now() * 0.003;
    npcs.forEach(npc => {
        npc.traverse(child => {
            if (child.userData.isIndicator) {
                child.position.y = 10 + Math.sin(time + npc.position.x) * 0.4;
            }
        });
    });
    
    // Animate camera recording lights (blinking)
    scene.traverse(obj => {
        if (obj.userData && obj.userData.isRecordingLight) {
            obj.visible = Math.sin(time * 5) > 0;
        }
    });
    
    // Update following eyes in paintings
    scene.traverse(obj => {
        if (obj.userData && obj.userData.isFollowingEye) {
            const baseX = obj.userData.baseX;
            const toPlayer = new THREE.Vector3(
                camera.position.x - obj.position.x,
                0,
                camera.position.z - obj.position.z
            ).normalize();
            obj.position.x = baseX + toPlayer.x * 0.1;
        }
    });
    
    updateMinimap();
    renderer.render(scene, camera);
}

// ============================================
// START
// ============================================

init();