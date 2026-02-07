# Epstein Wrapped 2025

A satirical, Spotify Wrapped-style interactive experience based on publicly available court documents, flight logs, and news reports about Jeffrey Epstein.

![Preview](preview.png)

## 🎯 What This Is

A dark humor parody of Spotify's annual "Wrapped" feature, presenting documented statistics from the Epstein case in the familiar card-based, mobile-first format.

**This is satire with a purpose:** While the format is comedic, the underlying data comes from real court documents and represents real crimes with real victims.

## 🚀 Running Locally

```bash
# Simple static server
cd epstein-wrapped
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`

## 📱 Features

- **Mobile-first design** (portrait mode optimized)
- **Spotify Wrapped-style animations** (slide transitions, counter animations, reveal effects)
- **Tap/swipe navigation** with keyboard support
- **Progress dots** showing position
- **Shareable** via Web Share API
- **Sinister color palette** (dark purples, black, gold)

## 📊 Data Sources

All statistics are derived from publicly available sources:

### Flight Logs
- **Source:** Court-released flight logs from Epstein's pilots
- **Coverage:** 1997-2005 (partial records)
- **Document:** Obtained via FOIA requests and court proceedings
- **Reference:** [Gawker 2015 release](https://gawker.com/flight-logs-put-clinton-dershowitz-on-pedophile-billionaires-sex-jet-1681039971), [Court Document 1032](https://www.courtlistener.com/docket/4355835/giuffre-v-maxwell/)

### Little St. James Island
- **Source:** USVI property records, court filings
- **Size:** 71.5 acres (confirmed via property records)
- **Purchase:** 1998 for approximately $8M

### Financial Information
- **Net Worth:** Various estimates, primarily from court filings and journalism
- **Manhattan Mansion:** 9 E 71st St, valued ~$56M
- **Wexner connection:** Documented in New York Times investigation

### Black Book
- **Source:** Leaked contact book obtained by Gawker (2015)
- **Pages:** 221 pages of names and contact information
- **Names:** Approximately 1,971 entries

### Celebrity Flight Records
- **Bill Clinton:** Confirmed 26+ flights in released logs
- **Prince Andrew:** Confirmed via photographs, testimony
- **Others:** Various levels of documentation in flight logs

### Legal Timeline
- **2005:** Palm Beach Police investigation begins
- **2008:** Controversial plea deal with federal prosecutors
- **2019:** Re-arrested by SDNY, died in custody August 10

### Victim Count
- **Source:** Court proceedings, victim compensation fund
- **Estimate:** ~200 victims identified through various legal proceedings

## ⚠️ Important Disclaimers

1. **Presence ≠ Knowledge:** Being in flight logs or the black book does not imply knowledge of or participation in crimes.

2. **Satire with purpose:** This project uses humor to maintain public attention on an important case where many powerful people avoided accountability.

3. **Real victims:** Behind the memes are real survivors. The project includes a slide acknowledging this and linking to RAINN.org.

## 🎵 Audio

Place a background music file at `audio/bg-music.mp3`. Suggestions:
- Royalty-free dark ambient
- Comedic instrumental
- Something appropriately ominous

Audio is optional and will gracefully fail if not present.

## 🛠️ Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- CSS animations (no JS animation libraries)
- Web Share API for native sharing
- Touch/swipe gesture support

## 📁 Structure

```
epstein-wrapped/
├── index.html      # Main HTML with all slides
├── styles.css      # Spotify Wrapped-style CSS
├── app.js          # Navigation and animations
├── audio/          # Background music (add your own)
│   └── bg-music.mp3
└── README.md       # This file
```

## 📖 Further Reading

- [Miami Herald: Perversion of Justice](https://www.miamiherald.com/topics/jeffrey-epstein)
- [Court Documents (PACER)](https://www.courtlistener.com/docket/4355835/giuffre-v-maxwell/)
- [Netflix: Jeffrey Epstein: Filthy Rich](https://www.netflix.com/title/80224905)

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve.

## ⚖️ Legal

This is a satirical/educational project using publicly available information. All data cited comes from court documents, journalistic investigations, or FOIA-released records.

---

*"Those who cannot remember the past are condemned to repeat it."* — George Santayana
