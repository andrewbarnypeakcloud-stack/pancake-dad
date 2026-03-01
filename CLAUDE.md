# Pancake Dad

Tony Hawk's Pro Skater, but dads making pancakes — a browser arcade trick-score game.

- **Full game design:** see `PancakeDad_GDD_v02_Browser.md`
- **Status:** Greenfield — scaffolding phase

## Tech Stack

| Component | Technology |
|-----------|------------|
| Game Engine | Phaser 3 (v3.60+), WebGL + Canvas fallback |
| Language | TypeScript (strict mode) |
| Build | Vite |
| Physics | Phaser Arcade Physics |
| Audio | Howler.js |
| Persistence | localStorage (game saves), Supabase (leaderboard) |
| Hosting | Vercel / Netlify / Cloudflare Pages |

**Targets:** < 2 MB gzipped bundle, < 3 s initial load, 60 fps desktop / 30 fps+ mobile, < 150 MB RAM.

## Directory Structure

```
src/
├── main.ts              # Phaser Game entry point
├── scenes/              # Phaser Scene classes (one file per scene)
├── systems/             # Game systems (TrickSystem, ComboSystem, InputManager, etc.)
├── entities/            # Game objects (Dad, Pancake, Pan, Hazard)
├── ui/                  # HUD, menus, overlays (Phaser GameObjects, not DOM)
│   ├── hud/             # In-game displays (score, timer, combo, meters)
│   ├── menus/           # Main menu, pause, shop, character select, game over
│   ├── effects/         # Screen shake, particles, flash, slow-mo overlay
│   └── sharecard/       # Canvas screenshot + Web Share API
├── audio/               # Howler.js wrapper, SFX player, music player
├── data/                # JSON config loaders (dads, levels, tricks, shop)
├── types/               # Shared TypeScript interfaces (the contract layer)
└── utils/               # Pure utility functions
assets/                  # Sprites, audio (sfx + music), fonts, data JSON
tests/                   # Test files mirroring src/ structure
```

## Coding Standards

- **Naming:** PascalCase for classes, camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **Exports:** Named exports only (no default exports) for tree-shaking
- **Files:** One class per file, filename matches class name (e.g. `TrickSystem.ts`)
- **Scenes:** Extend `Phaser.Scene`, register with string key matching class name
- **Data:** All game config values in `src/data/` JSON files — never hardcoded in logic
- **Types:** No `any` — use `unknown` with type guards if truly unknown
- **Math:** Prefer `Phaser.Math` utilities over raw `Math.*`
- **Pattern:** Composition over inheritance for game entities

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server with HMR
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm test             # Run test suite
```

## Agent Coordination

### Ownership Boundaries

| Agent | Owns | Types File |
|-------|------|-----------|
| **Game Engineer** | `src/main.ts`, `src/scenes/`, `src/systems/`, `src/entities/`, `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` | `src/types/game.ts` |
| **Content Designer** | `src/data/`, `assets/data/` | `src/types/content.ts` |
| **UI/UX Artist** | `src/ui/`, `assets/sprites/`, `assets/fonts/` | `src/types/ui.ts` |
| **Audio Engineer** | `src/audio/`, `assets/audio/` | `src/types/audio.ts` |
| **Platform/DevOps** | `src/utils/`, `tests/`, CI/CD, deploy configs, `public/` | `src/types/platform.ts` |

### Rules

1. **Shared contracts live in `src/types/`.** Never define interfaces inline — import from `src/types/index.ts`.
2. **Before creating a new interface,** check `src/types/` for an existing one.
3. **To add a missing type,** put it in the appropriate domain file and re-export from `src/types/index.ts`.
4. **Do not modify files outside your ownership.** Define an interface in `src/types/` and let the owning agent implement it.
5. **Runtime communication** uses Phaser's event system (`this.events.emit()` / `this.events.on()`) with event names from the `GameEvent` enum in `src/types/game.ts`.

### Build Order

```
Phase 1: Game Engineer          → scaffolds engine, physics, scenes, input, types
Phase 2: Content Designer  ┐
         UI/UX Artist      ├──→ work in parallel on non-overlapping files
         Audio Engineer    ┘
Phase 3: Platform/DevOps        → persistence, leaderboard, build optimization, CI/CD
```

### GDD Reference

- The full GDD is at `PancakeDad_GDD_v02_Browser.md` — agents should reference it for specs.
- Do NOT duplicate GDD content in code comments; reference section names instead.
- If the GDD and code disagree, raise the conflict — do not silently override either.
