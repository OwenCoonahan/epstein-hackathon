# 🏝️ Among Us: Island Edition

A satirical web-based social deduction game inspired by Among Us, themed around a certain infamous private island.

**⚠️ DISCLAIMER:** This is a satirical parody for educational and comedic purposes. All character names are derived from publicly available documents (flight logs, court records). This game makes no claims about the guilt or innocence of any individual.

## 🎮 Play Now

Simply open `index.html` in any modern web browser. No installation required!

```bash
# Option 1: Open directly
open index.html

# Option 2: Run a local server (recommended for best experience)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## 🕹️ Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move | WASD / Arrow Keys | Touch Joystick |
| Use/Task | E | USE Button |
| Kill (Impostor) | Q | KILL Button |
| Report Body | R | REPORT Button |
| Vent (Impostor) | E on vent | VENT Button |

## 📋 Game Rules

### Crewmates
- Complete all tasks to win
- Find and report dead bodies
- Call emergency meetings when suspicious
- Vote out impostors during meetings

### Impostors
- Eliminate crewmates without getting caught
- Use vents to travel between rooms
- Sabotage island systems
- Blend in and deceive

### Victory Conditions
- **Crewmates win** if all impostors are ejected OR all tasks are completed
- **Impostors win** if they equal/outnumber crewmates OR critical sabotage isn't fixed

## 🗺️ Map: Little St. James

The island features multiple rooms and outdoor areas:

### Indoor Locations
- **Main Hall** - Central meeting point with emergency button
- **Master Suite** - Private quarters
- **Guest Wing** - Visitor accommodations
- **Kitchen** - Food preparation area
- **Dining Room** - Formal dining
- **Temple** - The infamous blue-striped structure
- **Basement** - Underground area with reactor
- **Server Room** - Communications hub
- **Security Office** - Surveillance center

### Outdoor Areas
- **Pool Area** - Recreation spot
- **Tennis Court** - Sports facility
- **Helipad** - Helicopter landing
- **Dock** - Boat access
- **Jungle Paths** - Connecting walkways

### Vents (Impostor Only)
Vents connect distant rooms for quick escape:
- Master Suite ↔ Guest Wing ↔ Kitchen
- Server Room ↔ Pool Area ↔ Temple

## 👥 Character Roster

Characters are drawn from publicly documented individuals in flight logs and court records:

| Character | Nickname | Color |
|-----------|----------|-------|
| G. Maxwell | The Socialite | Magenta |
| Andrew | The Royal | Royal Blue |
| A. Dersh | The Lawyer | Brown |
| W. Clinton | The President | Dodger Blue |
| D. Trump | The Mogul | Orange |
| B. Gates | The Techie | Turquoise |
| K. Spacey | The Actor | Slate Gray |
| N. Campbell | The Model | Pink |
| L. Wexner | The Retail King | Purple |
| J. Brunel | The Scout | Dark Gray |

## 🔧 Technical Stack

- **Engine:** Phaser 3.60 (2D WebGL/Canvas game engine)
- **Language:** Vanilla JavaScript (ES6+)
- **Styling:** Pure CSS with flexbox/grid
- **Graphics:** Procedurally generated (no external assets)
- **AI:** Custom bot AI with pathfinding and decision-making

## 📁 Project Structure

```
among-us-island/
├── index.html          # Main HTML entry point
├── README.md           # This file
├── css/
│   └── style.css       # All styling
├── js/
│   ├── main.js         # Entry point & UI handlers
│   ├── game.js         # Main game class & logic
│   ├── characters.js   # Character definitions
│   ├── map.js          # Map layout & rooms
│   ├── tasks.js        # Task mini-games
│   └── ai.js           # Bot AI controller
└── assets/             # (unused - graphics are procedural)
```

## 🎯 Features

### Implemented
- ✅ Full Among Us gameplay loop
- ✅ 14 unique task mini-games (wires, card swipe, download, reactor, etc.)
- ✅ AI bots with realistic behavior
- ✅ Impostor mechanics (kill, vent, sabotage)
- ✅ Emergency meetings and voting
- ✅ 4 sabotage types (Lights, Comms, Reactor, O2)
- ✅ Mobile-friendly touch controls
- ✅ Role reveal and game over screens

### Mini-Games
1. **Wires** - Connect matching colored wires
2. **Card Swipe** - Swipe at the right speed
3. **Download/Upload** - Wait for data transfer
4. **Reactor** - Simon-says pattern matching
5. **Fuel** - Fill to target level
6. **Trash** - Pull the lever
7. **Asteroids** - Click moving targets
8. **Med Scan** - Wait for scan completion
9. **Slider** - Align to target value
10. **Prime Shields** - Click numbers in order
11. **Calibrate** - Timing-based calibration
12. **Keys** - Drag key to lock

## 🛠️ Development

### Running Locally
```bash
# Clone/download the project
cd among-us-island

# Start a local server (any of these work)
python3 -m http.server 8000
npx serve
php -S localhost:8000
```

### Customization
- Edit `characters.js` to modify the character roster
- Edit `map.js` to change room layouts and vent connections
- Edit `tasks.js` to add new mini-games
- Edit `style.css` for visual customization

## 📜 Legal

This is a **parody/satirical work** protected under fair use. It:
- Makes no accusations of criminal activity
- Uses only publicly documented information
- Is intended for commentary and humor
- Is not affiliated with Innersloth or Among Us

## 🙏 Credits

- Original Among Us by **Innersloth**
- Phaser game engine by **Photon Storm**
- Character names from **public court documents and flight logs**

---

*"Emergency meeting! I saw someone vent in the temple..."* 🏝️
