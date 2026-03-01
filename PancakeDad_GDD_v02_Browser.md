# PANCAKE DAD
### Game Design Document
**Version 0.2 | Browser Edition**

> *"Tony Hawk, but dads making pancakes — in your browser"*

---

## 1. Game Overview

### 1.1 Concept
Pancake Dad is an arcade trick-score browser game inspired by Tony Hawk's Pro Skater. Players control dads competing for the highest score by chaining stylish pancake-flipping tricks in the kitchen. The game runs entirely in the browser with no download, no install — just open and play.

### 1.2 Core Fantasy
You are a Dad. It is Saturday morning. Your family is watching from the doorway. This is your moment. And it runs at 60fps in Chrome.

### 1.3 Platform
- Primary: Desktop web browser (Chrome, Firefox, Safari, Edge)
- Secondary: Mobile web browser (iOS Safari, Android Chrome) — touch controls
- No app store. No download. URL-first distribution.

### 1.4 Session Design — Browser First
Browser games demand short, repeatable sessions. Players may arrive from a link, play for 5 minutes, and leave — or get hooked and chase leaderboard scores for an hour. The game must be immediately playable with zero friction: no account required to start, progress saves to browser storage automatically.

- Target session length: 3–10 minutes
- A full run is 90 seconds (reduced from 2 min for snappier browser pacing)
- Main menu to first gameplay in under 10 seconds
- No mandatory tutorial — controls shown as on-screen overlay on first run only

### 1.5 Target Audience
- Fans of Tony Hawk's Pro Skater and arcade score-chasers
- Casual browser gamers — office lunch break, quick link share
- Ages 12+ — accessible humor, family-safe content

### 1.6 Genre & Tone
Arcade / Trick Score game. Tone is comedic and wholesome. The game celebrates the earnest, slightly ridiculous dedication of dads who take Saturday breakfast very seriously. Visually punchy enough to communicate fun from a thumbnail or social share screenshot.

---

## 2. Technical Stack

### 2.1 Rendering & Engine
The game uses a 2.5D side-view perspective rendered with WebGL via Phaser 3. This choice is deliberate: Phaser 3 is a mature, well-documented browser game framework that compiles to a single JavaScript bundle, supports both WebGL and Canvas fallback, and handles mobile touch input natively.

| Layer | Technology | Reason |
|---|---|---|
| Game Engine | Phaser 3 (v3.60+) | Mature browser framework, WebGL + Canvas fallback, active community |
| Language | TypeScript | Type safety, better tooling, scales with team size |
| Build Tool | Vite | Fast HMR in dev, optimized production bundle, native TS support |
| Physics | Phaser Arcade Physics | Lightweight, sufficient for 2.5D kitchen movement and pancake arcs |
| Rendering | WebGL (Canvas fallback) | 60fps target on modern browsers; Canvas for older mobile |
| Audio | Howler.js | Reliable cross-browser audio with sprite support and mobile unlock handling |
| Persistence | localStorage + optional backend | Save progress and scores locally; leaderboard needs lightweight API |
| Leaderboard API | Supabase (PostgreSQL) or simple REST | Serverless-friendly, easy to self-host, free tier viable for launch |
| Hosting | Vercel / Netlify / Cloudflare Pages | CDN-served static bundle, fast global load, free tier at launch |

### 2.2 Why Not 3D in Browser?
Full 3D (Three.js / Babylon.js / Unity WebGL export) was considered and rejected for the following reasons: Unity WebGL exports are large (5MB+ bundle, long initial load), Three.js requires a custom engine layer that duplicates what Phaser gives for free, and 3D assets require significantly more art production time. The 2.5D Phaser approach delivers faster load time, a tighter art pipeline, and better mobile performance — all critical for a browser-first product.

> ⚠️ **Bundle size target:** under 2MB gzipped. Initial load under 3 seconds on a standard connection. Asset streaming for level-specific audio after core game loads.

### 2.3 Asset Pipeline

| Asset Type | Format | Notes |
|---|---|---|
| Sprites / Characters | PNG spritesheets (TexturePacker) | Power-of-2 atlases for GPU efficiency |
| Backgrounds | PNG layers (parallax) | 2–3 depth layers per kitchen level |
| Audio | MP3 + OGG dual format | Howler.js handles browser codec differences automatically |
| Fonts | Bitmap fonts (Phaser BitmapText) | Avoids layout shift and FOUT; fast render in WebGL context |
| Data / Config | JSON | Trick definitions, Dad stats, level configs loaded as Phaser assets |

### 2.4 Save & Persistence
All progress saves automatically to localStorage with no account required. This includes Dad Bucks balance, unlocked Dads, unlocked equipment, per-level high scores, and challenge completion flags. An optional account/login system (OAuth via Supabase) can be added post-launch to enable cross-device sync and global leaderboards.

> ⚠️ localStorage limit is ~5MB per origin — well within bounds for this game's save data. JSON only, no binary blobs.

---

## 3. Core Gameplay

### 3.1 Game Loop
Each run takes place in a kitchen arena. The player has 90 seconds to score as many points as possible. Points are earned by chaining tricks while keeping the pancake airborne. The pancake must land successfully in the pan to bank the combo score — drop it and the multiplier resets. Runs are short and immediately restartable.

### 3.2 Controls — Desktop

| Input | Action |
|---|---|
| A / D or Left / Right | Move Dad left and right |
| W or Up / Spacebar | Jump |
| A / D during jump | Spin direction (builds combo multiplier) |
| J (hold during jump) | Grab trick — hold for style bonus |
| K | Manual balance — extends combo on ground |
| R | Restart run instantly |

> ⚠️ Controls are intentionally simplified. Browser games benefit from minimal key bindings — one hand on WASD, one action button. Mouse input is not used during gameplay to avoid accidental tab focus loss.

### 3.3 Controls — Mobile / Touch

| Touch Zone | Action |
|---|---|
| Left half of screen tap | Move left |
| Right half of screen tap | Move right |
| Swipe up (anywhere) | Jump |
| Swipe left / right during jump | Spin |
| Hold anywhere during jump | Grab trick |
| Double tap | Restart run |

> ⚠️ Touch controls are a secondary experience. The game is designed desktop-first. Scores are tracked separately on a mobile leaderboard.

### 3.4 Trick System
Tricks are performed in the air and scored on successful pancake catch. Each trick has a base score. Chaining tricks without dropping the pancake multiplies total score. All tricks are performable with the simplified browser control scheme.

#### Basic Tricks

| Trick Name | Input | Base Score | Description |
|---|---|---|---|
| The Classic | Jump only | 100 | Simple clean flip, perfect landing |
| The 360 Dad | Jump + full spin | 300 | Full rotation in slippers |
| The Grab | Jump + hold J | 250 | Clutches spatula mid-air |
| The Knee Flip | Crouch + Jump | 200 | Flips pancake off the knee |
| The Blind Flip | Jump + backward spin | 400 | Back turned, no-look catch |
| The Double Stack | Jump + Grab + full spin | 600 | Two pancakes at once |

#### Signature Tricks
Each Dad has one signature trick unlocked through progression. Requires a full Special Meter. Triggers a 1.5-second slow-motion cinematic sequence (implemented as a Phaser tween timeline with camera zoom) — kept brief to avoid interrupting browser game flow.

### 3.5 Combo & Multiplier System
- Each chained trick adds to the combo: x1, x2, x3... capped at x10
- Dropping the pancake resets multiplier to zero
- Successfully landing banks the full combo score
- Slipper Style bonus: passive multiplier for rotating in upgraded slippers
- **"On Fire" state:** 5+ combo chain activates a visual burn effect and +50% base score bonus

### 3.6 Audience Meter
The family audience reacts in real time. Four stages: Watching → Clapping → Excited → Hysteria. Reaching Hysteria triggers a x2 "Dad of the Year" multiplier for the final 20 seconds. The meter decays slowly if no tricks are performed — keeping pressure on the player throughout the run.

### 3.7 Special Meter
Fills as tricks are performed. When full, all tricks grant double points. Signature tricks require a full meter. Meter drains on pancake drop — punishing wasted specials and rewarding careful timing.

---

## 4. Dad Roster

| Dad | Archetype | Stat Strength | Signature Trick | Unlock Condition |
|---|---|---|---|---|
| Gary | The Classic Dad | Balanced — starter | Perfect Flip (360, eyes closed) | Default unlock |
| Tomasz | The Energetic Dad | Speed + Spin bonus | Double Pirouette Catch | Score 30,000 in one run |
| Kenji | The Precise Dad | Precision + Style multiplier | Iron Pan Zero-Splash Rotation | Complete 3 challenges |
| Marcus | The Showman | Air time + Power | The Smokestack 900 | Score 75,000 in one run |
| Pawel | The Slipper King | Slipper Style bonus x3 | Full Kitchen Lap Blind Catch | Equip max slipper upgrade |

---

## 5. Upgrades & Progression

### 5.1 Dad Bucks
Earned through run scores and challenge completion. Saved to localStorage. Spent in the in-game shop between runs. Cannot be purchased — earned through gameplay only.

### 5.2 Pan Upgrades

| Pan | Effect | Cost |
|---|---|---|
| Non-stick Starter | Default — no bonus | Free |
| Cast Iron Pro | +15% catch radius | 500 DB |
| Carbon Steel Racer | +10% flip speed | 800 DB |
| Titanium Competition | +20% catch radius and flip speed | 2000 DB |
| The Heirloom | +Style points on every trick | Challenge unlock |

### 5.3 Slipper Upgrades

| Slipper | Effect | Cost |
|---|---|---|
| Terry Cloth Classic | Default — no bonus | Free |
| Rubber Sole Grip | Better landing stability | 400 DB |
| Velvet Spinners | +Spin speed, high Slipper Style bonus | 900 DB |
| The Memory Foam 3000 | +20% Special Meter fill rate | 1800 DB |

---

## 6. Levels & Arenas

### 6.1 Level Structure for Browser
Levels are loaded asynchronously in the background after the first kitchen loads. The player can start playing immediately — subsequent levels and their assets stream in while the first run is in progress. This ensures zero wait time on first visit.

> ⚠️ Each level is a self-contained Phaser Scene. Levels are unlocked sequentially and cached in browser memory after first load — revisiting is instant.

### 6.2 Level Roster

| Level | Setting | Hazard | Visual Style |
|---|---|---|---|
| The Apartment | Tight 1-bed kitchen | Cat on the counter | Warm yellow, cramped, cozy |
| The Suburban Home | Classic family kitchen | Toddler underfoot | Suburban pastels, big windows |
| The Open Plan | Modern large kitchen | Dog begging at feet | Clean whites, marble surfaces |
| Holiday Morning | Christmas chaos | Kids everywhere | Warm reds, fairy lights, snow outside |
| The Competition | TV cooking show set | Live studio crowd | Bright studio lighting, score ticker |

---

## 7. Art & Audio Direction

### 7.1 Visual Style
2.5D side-view. Stylized flat-shaded characters with expressive animation. Warm Saturday morning color palettes. Backgrounds use 2–3 parallax layers for depth without 3D overhead. Character sprites are designed to read clearly at small sizes — important for mobile browsers. All animations use spritesheet atlases for fast GPU texture uploads.

### 7.2 UI Design
Arcade-style HUD: score counter top-left, timer top-center, combo multiplier prominent in center, Audience Meter as a vertical bar on the right edge. UI elements use Phaser BitmapText for performance. The HUD is designed to work at both 16:9 desktop and 9:16 mobile aspect ratios via Phaser's Scale Manager.

### 7.3 Soundtrack
Upbeat guitar-driven dad rock. Each level has its own looping track. Audio files are split: UI sounds load with the initial bundle, music streams per level. Howler.js manages the audio context unlock required on mobile browsers (user must interact before audio plays — handled on the title screen tap/click).

### 7.4 Sound Effects
- Pancake flip: satisfying whoosh with pitch variation per spin speed
- Perfect landing: crisp sizzle-pop
- Audience meter stages: crowd murmur builds to full applause
- Slipper shuffle: soft scuff on ground movement
- Signature trick: unique musical sting per Dad
- Pancake drop: short sad trombone, Dad heartbreak face

---

## 8. Browser-Specific Considerations

### 8.1 Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Initial bundle load | < 3 seconds (standard connection) | Gzipped bundle < 2MB |
| Time to first gameplay | < 10 seconds | No loading screen after first visit (cached) |
| Frame rate | 60fps desktop, 30fps+ mobile | Phaser physics scaled to delta time |
| Memory footprint | < 150MB RAM | Unload off-screen level assets between scenes |
| Audio latency | < 50ms SFX response | Howler.js audio sprite for trick SFX |

### 8.2 Tab & Focus Handling
The game pauses automatically when the browser tab loses focus (Phaser visibility change event). Audio mutes on blur and resumes on focus. This prevents the game from running and dying while the player is in another tab — a common frustration in browser games.

### 8.3 Responsive Layout
The game canvas scales to fill the available browser window using Phaser's Scale Manager in FIT mode. Minimum supported resolution is 320x480 (small mobile). Maximum canvas size is capped at 1920x1080. All UI elements use relative positioning against the canvas bounds — no fixed pixel positions.

### 8.4 Shareability
Each run generates a shareable result card (Canvas API screenshot of the score + Dad + kitchen background) with a one-click share button. On mobile, this uses the Web Share API. On desktop, the image is offered as a download. The game URL is the only link needed — no app store, no account.

> ⚠️ URL structure: `pancakedad.game/#level=1&dad=gary` — allows linking directly to a specific level for social sharing or challenge links.

---

## 9. Monetization
Pancake Dad is free to play in the browser. Two optional monetization paths to evaluate post-launch:

| Model | Description | Pros / Cons |
|---|---|---|
| Cosmetic DLC (one-time) | Pay once to unlock bonus Dad skins, pan skins, kitchen themes | + No pay-to-win, good goodwill / - Requires payment integration |
| Remove Ads (one-time) | Free version shows a non-intrusive banner between runs; one-time payment removes it | + Low friction entry / - Banner may hurt UX if poorly placed |
| Tip Jar / Donation | Optional voluntary support link on results screen | + Zero friction, no paywall / - Very low conversion |

No mechanics, Dads, or upgrades are locked behind payment. Dad Bucks are earned through gameplay only. The full game is playable for free.

---

## 10. Open Questions & Next Steps

| Question | Status | Priority |
|---|---|---|
| Global leaderboard backend — Supabase vs simple REST? | TBD | High |
| Mobile touch controls — swipe vs virtual buttons? | Swipe preferred, needs playtest | High |
| Phaser 3 vs alternative (PixiJS + custom)? | Phaser 3 recommended, confirm with dev | High |
| Share card — Canvas API or server-side render? | Canvas API preferred (no server cost) | Medium |
| Account system for cross-device progress? | Post-launch feature | Low |
| PWA / Add to Home Screen support? | Nice to have — manifest.json needed | Low |
| Local co-op in browser (shared keyboard)? | Under consideration | Low |

---

*Pancake Dad — GDD v0.2 Browser Edition | Confidential Draft*
