# Pancake Dad — Project Backlog

> Generated from `PancakeDad_GDD_v02_Browser.md`. Each task references the relevant GDD section.

## Status Key

| Symbol | Meaning |
|--------|---------|
| `TODO` | Not started |
| `IN PROGRESS` | Actively being worked on |
| `DONE` | Complete and verified |

---

## Phase 1: Foundation

**Agent:** `@game-engineer`
**Prereqs:** None — this phase must complete before any other phase begins.

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P1-01 | Init npm project | Create `package.json` with Phaser 3 (v3.60+), Howler.js, TypeScript, Vite as dependencies | DONE | — | 2.1 |
| P1-02 | TypeScript config | Create `tsconfig.json` with strict mode, ES2020 target, module resolution for Vite | DONE | P1-01 | 2.1 |
| P1-03 | Vite config | Create `vite.config.ts` — dev server, HMR, production build to `dist/` | DONE | P1-01 | 2.1 |
| P1-04 | HTML entry | Create `index.html` with canvas mount point, viewport meta, no-script fallback | DONE | P1-03 | 2.1 |
| P1-05 | Define core types | Populate `src/types/game.ts` — GameEvent enum, TrickDefinition, TrickResult, ComboState, DadPhysicsProfile, InputAction, GameConfig | DONE | P1-02 | 3.4, 3.5 |
| P1-06 | Game bootstrap | Create `src/main.ts` — Phaser.Game config with Scale Manager FIT, Arcade Physics, WebGL+Canvas fallback, scene registration | DONE | P1-04, P1-05 | 2.1, 8.3 |
| P1-07 | BootScene | `src/scenes/BootScene.ts` — asset preloader with loading bar, transitions to MenuScene | DONE | P1-06 | 1.4 |
| P1-08 | MenuScene | `src/scenes/MenuScene.ts` — placeholder scene with Play button, transitions to GameScene | DONE | P1-06 | 1.4 |
| P1-09 | GameScene | `src/scenes/GameScene.ts` — main 90-second gameplay scene skeleton with timer, spawns Dad + Pancake + Pan | DONE | P1-06 | 3.1 |
| P1-10 | GameOverScene | `src/scenes/GameOverScene.ts` — score display, restart button, menu button | DONE | P1-06 | 3.1 |
| P1-11 | Scene flow | Wire Boot→Menu→Game→GameOver→Menu transitions with Phaser scene manager | DONE | P1-07, P1-08, P1-09, P1-10 | 1.4 |
| P1-12 | Dad entity | `src/entities/Dad.ts` — sprite with left/right movement, jump, land, Arcade Physics body, animation state machine | DONE | P1-09, P1-05 | 3.2, 4 |
| P1-13 | Pancake entity | `src/entities/Pancake.ts` — arc trajectory on flip, catch/drop detection, visual rotation | DONE | P1-09, P1-05 | 3.1, 3.4 |
| P1-14 | Pan entity | `src/entities/Pan.ts` — catch zone with configurable radius, held by Dad, visual feedback on catch | DONE | P1-09, P1-05 | 5.2 |
| P1-15 | InputManager (desktop) | `src/systems/InputManager.ts` — keyboard bindings: WASD/arrows for movement, W/Space for jump, J for grab, K for manual, R for restart | DONE | P1-09 | 3.2 |
| P1-16 | InputManager (mobile) | Extend InputManager with touch zones: left/right tap, swipe up jump, swipe spin, hold grab, double-tap restart | DONE | P1-15 | 3.3 |
| P1-17 | TrickSystem | `src/systems/TrickSystem.ts` — detect input combos during airtime, produce TrickResult, emit GameEvent.TRICK_PERFORMED | DONE | P1-12, P1-13, P1-15, P1-05 | 3.4 |
| P1-18 | ComboSystem | `src/systems/ComboSystem.ts` — chain multiplier x1-x10, "On Fire" at x5 (+50% base), reset on drop, bank on catch | DONE | P1-17, P1-05 | 3.5 |
| P1-19 | SpecialMeterSystem | `src/systems/SpecialMeterSystem.ts` — fills on tricks, drains on drop, enables signature tricks when full, double points when full | DONE | P1-17, P1-05 | 3.7 |
| P1-20 | AudienceMeterSystem | `src/systems/AudienceMeterSystem.ts` — 4 stages (Watching→Clapping→Excited→Hysteria), decay over time, Hysteria x2 bonus in final 20s | DONE | P1-17, P1-05 | 3.6 |
| P1-21 | Tab focus handling | Pause game on `visibilitychange` / blur, resume on focus; prevent background running | DONE | P1-09 | 8.2 |

---

## Phase 2A: Content

**Agent:** `@content-designer`
**Prereqs:** P1-05 (core types defined)
**Parallel with:** Phase 2B, Phase 2C

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P2A-01 | Define content types | Populate `src/types/content.ts` — DadDefinition, DadStats, LevelDefinition, HazardDefinition, ShopItem, ProgressionState, UnlockCondition | DONE | P1-05 | 4, 5, 6 |
| P2A-02 | dads.json | `src/data/dads.json` — 5 dads with full stats, archetype, signature trick, unlock condition | DONE | P2A-01 | 4 |
| P2A-03 | tricks.json | `src/data/tricks.json` — 6 basic tricks + 5 signature tricks with inputs, base scores, descriptions | DONE | P2A-01 | 3.4 |
| P2A-04 | levels.json | `src/data/levels.json` — 5 levels with setting, hazard type, visual style, background layers, music key | DONE | P2A-01 | 6 |
| P2A-05 | shop.json | `src/data/shop.json` — 5 pan upgrades + 4 slipper upgrades with effects and costs | DONE | P2A-01 | 5.2, 5.3 |
| P2A-06 | challenges.json | `src/data/challenges.json` — challenge definitions with unlock conditions and rewards | DONE | P2A-01 | 5.1 |
| P2A-07 | DataLoader class | `src/data/DataLoader.ts` — loads and validates all JSON at boot, registers as singleton via Phaser registry | DONE | P2A-02, P2A-03, P2A-04, P2A-05, P2A-06 | 2.3 |
| P2A-08 | Economy balancing | Verify Dad Bucks formula: 3-5 runs to afford first upgrade, signature tricks viable by run 10 | DONE | P2A-07 | 5.1 |

---

## Phase 2B: UI/UX

**Agent:** `@ui-ux-artist`
**Prereqs:** P1-05 (GameEvent), P1-09 (GameScene)
**Parallel with:** Phase 2A, Phase 2C

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P2B-01 | Define UI types | Populate `src/types/ui.ts` — HUDConfig, ResponsiveAnchor, AnimationDefinition, ParticleConfig, ShareCardData | DONE | P1-05 | 7.2 |
| P2B-02 | Responsive layout system | Anchor-based positioning utility for 16:9 ↔ 9:16 responsive scaling using Phaser Scale Manager | DONE | P2B-01, P1-06 | 8.3 |
| P2B-03 | ScoreDisplay | `src/ui/hud/ScoreDisplay.ts` — top-left, BitmapText, scale-pop animation on score increase | DONE | P2B-02 | 7.2 |
| P2B-04 | TimerDisplay | `src/ui/hud/TimerDisplay.ts` — top-center, 90s countdown, flashes red at <10s | DONE | P2B-02 | 7.2 |
| P2B-05 | ComboDisplay | `src/ui/hud/ComboDisplay.ts` — center screen, scales with chain level, pulses at x5+ "On Fire" | DONE | P2B-02 | 3.5, 7.2 |
| P2B-06 | AudienceMeter UI | `src/ui/hud/AudienceMeterUI.ts` — right-edge vertical bar, 4 visual stages with color/label transitions | DONE | P2B-02 | 3.6, 7.2 |
| P2B-07 | SpecialMeter UI | `src/ui/hud/SpecialMeterUI.ts` — top-right horizontal bar, glow effect when full | DONE | P2B-02 | 3.7, 7.2 |
| P2B-08 | MainMenu | `src/ui/menus/MainMenu.ts` — logo, play button, shop button, high score display | DONE | P2B-02 | 1.4 |
| P2B-09 | CharacterSelect | `src/ui/menus/CharacterSelect.ts` — 5 dad portraits with stats preview, lock/unlock states | DONE | P2B-02, P2A-01 | 4 |
| P2B-10 | ShopScreen | `src/ui/menus/ShopScreen.ts` — pan/slipper tabs, buy/equip states, Dad Bucks balance display | DONE | P2B-02, P2A-01 | 5 |
| P2B-11 | PauseMenu | `src/ui/menus/PauseMenu.ts` — overlay with resume/restart/quit buttons, volume sliders | DONE | P2B-02 | 8.2 |
| P2B-12 | GameOverScreen | `src/ui/menus/GameOverScreen.ts` — score breakdown, Dad Bucks earned, share/restart/menu buttons | DONE | P2B-02 | 8.4 |
| P2B-13 | ParticleManager | `src/ui/effects/ParticleManager.ts` — flip trail, landing sparkle, drop splat, on-fire flames | DONE | P2B-01 | 7.1 |
| P2B-14 | ScreenShake + FlashEffect | `src/ui/effects/ScreenEffects.ts` — configurable shake intensity/duration, flash on signature trick | DONE | P2B-01 | 7.1 |
| P2B-15 | SlowMotionOverlay | `src/ui/effects/SlowMotionOverlay.ts` — time scale reduction + vignette overlay for signature tricks | DONE | P2B-01 | 3.4 |
| P2B-16 | ShareCardRenderer | `src/ui/sharecard/ShareCardRenderer.ts` — Canvas API screenshot, Web Share API (mobile), download fallback (desktop) | DONE | P2B-12 | 8.4 |

---

## Phase 2C: Audio

**Agent:** `@audio-engineer`
**Prereqs:** P1-05 (GameEvent)
**Parallel with:** Phase 2A, Phase 2B

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P2C-01 | Define audio types | Populate `src/types/audio.ts` — AudioManifest, SFXEntry, MusicEntry, AudioEvent, AudioSettings | DONE | P1-05 | 7.3, 7.4 |
| P2C-02 | AudioManager | `src/audio/AudioManager.ts` — Howler.js singleton wrapper, init, master/SFX/music volume controls | DONE | P2C-01 | 7.3 |
| P2C-03 | SFXPlayer | `src/audio/SFXPlayer.ts` — play SFX with pitch variation, audio sprite support, pooling | DONE | P2C-02 | 7.4 |
| P2C-04 | MusicPlayer | `src/audio/MusicPlayer.ts` — per-level loop playback, crossfade between levels | DONE | P2C-02 | 7.3 |
| P2C-05 | AudioManifest | `src/audio/AudioManifest.ts` — declare all SFX and music assets (MP3+OGG dual format paths) | DONE | P2C-01 | 2.3 |
| P2C-06 | AudioEventBridge | `src/audio/AudioEventBridge.ts` — subscribe to GameEvents, route to appropriate SFX/music calls | DONE | P2C-03, P2C-04 | 7.4 |
| P2C-07 | Mobile audio unlock | Handle Howler.ctx.resume() on first user interaction (tap/click on title screen) | DONE | P2C-02 | 7.3 |
| P2C-08 | Tab blur/focus muting | Store volume levels, mute all audio on blur, restore on focus | DONE | P2C-02, P1-21 | 8.2 |
| P2C-09 | Placeholder audio assets | Generate or document required sound files: flip whoosh, sizzle-pop, crowd stages, slipper scuff, trombone, signature stings | DONE | P2C-05 | 7.4 |

---

## Phase 3: Platform

**Agent:** `@platform-devops`
**Prereqs:** Phase 1 complete, P2A-01 (content types)

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P3-01 | Define platform types | Populate `src/types/platform.ts` — SaveData, LeaderboardEntry, DeepLinkParams, BuildConfig | DONE | P1-05, P2A-01 | 2.4, 8.4 |
| P3-02 | PersistenceManager | `src/utils/PersistenceManager.ts` — localStorage save/load with versioned JSON schema | DONE | P3-01 | 2.4 |
| P3-03 | Save migration system | Version-based migration chain (v0→v1→v2...) for forward-compatible save data | DONE | P3-02 | 2.4 |
| P3-04 | Auto-save wiring | `src/utils/AutoSaveManager.ts` — Listen to GameEvent.RUN_END, shop purchases, settings changes — trigger save | DONE | P3-02 | 2.4 |
| P3-05 | LeaderboardAPI | `src/utils/LeaderboardAPI.ts` — Supabase client, submit/retrieve scores, offline queue fallback | DONE | P3-01 | 2.4 |
| P3-06 | DeepLinkParser | `src/utils/DeepLinkParser.ts` — parse `#level=X&dad=Y` from URL hash, generate shareable URLs | DONE | P3-01 | 8.4 |
| P3-07 | Vite production optimization | Code splitting: separate Phaser, Howler, Supabase chunks; terser minification; gzip target <2MB | DONE | P1-03 | 8.1 |
| P3-08 | Vitest setup | Test infrastructure: `vitest.config.ts`, test helpers, mock utilities | DONE | P1-02 | — |
| P3-09 | Unit tests | Tests for: PersistenceManager save/load/migration, DeepLinkParser parse/generate, economy formulas | DONE | P3-02, P3-06 | — |
| P3-10 | CI/CD pipeline | `.github/workflows/ci.yml` — lint, type-check, test, build, bundle size check (<2MB) | DONE | P3-08 | 8.1 |
| P3-11 | Deployment config | `vercel.json` with SPA fallback, cache headers | DONE | P3-07 | 2.1 |
| P3-12 | PWA manifest | `public/manifest.json` with icons, theme color, display standalone | DONE | P1-04 | 10 |

---

## Phase 4: Integration

**Agent:** All agents collaborate
**Prereqs:** Phases 1, 2A, 2B, 2C, 3 substantially complete

| ID | Task | Description | Status | Depends On | GDD Ref |
|----|------|-------------|--------|------------|---------|
| P4-01 | Wire DataLoader into BootScene | Load all JSON in BootScene, register DataLoader in Phaser registry for all scenes to access | DONE | P2A-07, P1-07 | 2.3 |
| P4-02 | Wire content into game systems | TrickSystem reads tricks.json, Dad entity reads dads.json, GameScene reads levels.json | DONE | P4-01, P1-17, P1-12 | 3, 4, 6 |
| P4-03 | Wire HUD to GameEvent listeners | ScoreDisplay, TimerDisplay, ComboDisplay, meters all update via event subscriptions | DONE | P2B-03…P2B-07, P1-18, P1-19, P1-20 | 7.2 |
| P4-04 | Wire AudioEventBridge to GameScene | All game events trigger correct SFX and music transitions | DONE | P2C-06, P1-09 | 7.3, 7.4 |
| P4-05 | Wire persistence to game flow | Auto-save on run end, load save data on boot, shop purchases persist | DONE | P3-04, P1-09 | 2.4 |
| P4-06 | Wire deep-links to scene navigation | URL hash params skip to correct level/dad selection on load | DONE | P3-06, P1-11 | 8.4 |
| P4-07 | Performance validation | Verify: 60fps desktop, 30fps+ mobile, <2MB gzipped bundle, <3s initial load, <150MB RAM | DONE | All | 8.1 |
| P4-08 | Cross-browser + mobile testing | Test on Chrome, Firefox, Safari, Edge (desktop) + iOS Safari, Android Chrome (mobile) | TODO | P4-07 | 1.3 |

---

## GDD Coverage Matrix

| GDD Section | Covered By Tasks |
|-------------|-----------------|
| 1. Game Overview | P1-06, P1-08, P1-09, P1-11 |
| 2. Technical Stack | P1-01…P1-04, P2C-02, P3-07 |
| 3. Core Gameplay | P1-09, P1-12…P1-20, P2A-03 |
| 4. Dad Roster | P1-05, P2A-01, P2A-02, P2B-09 |
| 5. Upgrades & Progression | P2A-05, P2A-06, P2A-08, P2B-10 |
| 6. Levels & Arenas | P2A-04, P4-02 |
| 7. Art & Audio Direction | P2B-01…P2B-16, P2C-01…P2C-09 |
| 8. Browser Considerations | P1-21, P2B-02, P3-06, P3-07, P4-07, P4-08 |
| 9. Monetization | (Post-launch — no tasks needed for MVP) |
| 10. Open Questions | P3-05, P3-12, P2B-16 |

---

## Summary

| Phase | Total | Done | Remaining |
|-------|-------|------|-----------|
| Phase 1: Foundation | 21 | 21 | 0 |
| Phase 2A: Content | 8 | 8 | 0 |
| Phase 2B: UI/UX | 16 | 16 | 0 |
| Phase 2C: Audio | 9 | 9 | 0 |
| Phase 3: Platform | 12 | 12 | 0 |
| Phase 4: Integration | 8 | 7 | 1 |
| **Total** | **74** | **73** | **1** |
