# Epstein Wrapped 2025 — V2 Unhinged Edition

A Spotify Wrapped-style interactive experience based on public court documents, flight logs, and DOJ releases. Dark satirical content that exposes the absurdity of how many powerful people were connected to Epstein and how few faced consequences.

## ⚠️ Content Warning
This project contains references to child exploitation, trafficking, and abuse. It's satire meant to highlight systemic failures, not to minimize victims' experiences.

## 🔥 V2 New Features

### 1. Dark Stats (The Uncomfortable Stuff)
- **Youngest victim ages** from court documents (14 documented, 12 alleged)
- **Average victim age range** (14-16) from FBI investigation
- **Recruitment pyramid scheme** breakdown ($200-300 per "massage", $200 bonus to recruit friends)
- **FBI confirmed minor count** (36+ victims in "Operation Leap Year")
- All sourced from DOJ releases, Palm Beach Police affidavits, and Miami Herald investigation

### 2. Photos of Associates
Real public domain/Wikimedia Commons photos of:
- **Ghislaine Maxwell** (convicted)
- **Bill Clinton** (26+ flights)
- **Donald Trump** ("terrific guy" quote)
- **Prince Andrew** (£12M settlement)
- **Bill Gates** (post-conviction meetings)
- **Alan Dershowitz** (named in docs)
- **Kevin Spacey** (Africa trip)
- **Les Wexner** ($46M+ townhouse gift)

### 3. Background Music
- **Ironically upbeat/goofy music** for dark comedic contrast
- Auto-plays on first tap
- Fallback to Web Audio API generated happy tune if MP3 not found
- Toggle button in top-right corner

### 4. Extra Stats
- **Purchases**: Both islands ($30.5M total), Manhattan mansion ($56M), Zorro Ranch (7,500 acres)
- **Finances**: $1.9B in wire transfers, 4% effective tax rate
- **The "Suicide"**: 2025 CCTV footage found modified, 3 minutes missing
- **Black Book**: 1,971 names, 221 pages

### 5. Funnier/Unhinged Elements
- "Your Personality Type: Didn't Kill Himself"
- "Your Aura: Blackmail Energy ✨"
- Personality traits: "Networking enthusiast", "Island collector", "Amateur videographer"
- "Some of them are reading this right now 👋"
- Police quote about victims all telling the same story

### 6. Polish
- Smoother CSS animations with cubic-bezier easing
- Better slide transitions with scale effects
- Shimmer effect on gold text
- Staggered card animations
- Glitch effect on "Epstein didn't kill himself"
- Aura glow pulse animation

## 📁 Project Structure

```
epstein-wrapped/
├── index.html      # Main HTML with 19 slides
├── styles.css      # Enhanced Spotify-style CSS
├── app.js          # Interactive logic + Web Audio fallback
├── data.js         # All sourced data with citations
├── audio/
│   ├── README.md   # Instructions for adding music
│   └── happy-ukulele.mp3  # (optional) Royalty-free track
└── README.md       # This file
```

## 🎵 Adding Music

See `audio/README.md` for instructions on adding royalty-free happy ukulele music for maximum ironic effect. Without the MP3, the app falls back to a generated cheerful melody.

## 📊 Data Sources

All data is from publicly available sources:
- Court documents (PACER, CourtListener)
- FOIA-released flight logs (Gawker 2015 release)
- DOJ press releases and indictments (SDNY 2019)
- Miami Herald investigation (Julie K. Brown)
- Wikipedia (compiled from court documents)
- Palm Beach Police affidavits (2005-2006)
- Victim compensation fund records
- Property records (USVI, NYC, FL)

## 🚀 Usage

```bash
# Serve locally
npx serve .

# Or with Python
python -m http.server 8000

# Or just open index.html in a browser
```

## 📱 Controls

- **Tap/Click right side** → Next slide
- **Tap/Click left side** → Previous slide
- **Swipe left** → Next slide
- **Swipe right** → Previous slide
- **Arrow keys** → Navigate
- **Space** → Next slide
- **M key** → Toggle music
- **🔊 button** → Toggle music

## 🎨 Slide Overview

1. **Intro** - "Your 2025 Wrapped... but make it criminal"
2. **Flight Count** - 1,036 documented flights
3. **The Plane** - "Lolita Express" Boeing 727
4. **Top Destinations** - Including "Pedophile Island"
5. **Dark Stats** - Victim ages, youngest documented
6. **Recruitment** - Pyramid scheme breakdown
7. **Island Stats** - Little St. James details
8. **Collaborators Intro** - "The part everyone's waiting for"
9. **Inner Circle** - Maxwell, Kellen, Marcinkova with photos
10. **Celebrity Photos 1** - Clinton, Trump, Andrew, Gates
11. **Celebrity Photos 2** - Dershowitz, Spacey, Wexner
12. **Personality Type** - "Didn't Kill Himself"
13. **Your Aura** - "Blackmail Energy"
14. **Finances** - $577M net worth, unknown source
15. **The "Suicide"** - Suspicious circumstances
16. **Black Book** - 1,971 names
17. **Victims** - 1,000+ total, $121M compensation
18. **Final Stats** - Summary
19. **Share** - Share button

## 📜 License

This is satire based on public records. All images are from Wikimedia Commons (public domain or CC licensed). Created for awareness, not entertainment.

---

*"This 'Wrapped' is satire, but the crimes were real. The survivors deserve justice, not just memes."*
