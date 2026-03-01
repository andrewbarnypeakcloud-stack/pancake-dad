// AudioManifest — declares all SFX and music entries for Pancake Dad
// See PancakeDad_GDD_v02_Browser.md sections 7.3, 7.4
// See .claude/agents/audio-engineer.md for SFX/music specifications

import { AudioManifest, SFXEntry, MusicEntry } from '../types';

// ──────────────────────────────────────────────
// SFX entries
// ──────────────────────────────────────────────

const SFX_ENTRIES: Record<string, SFXEntry> = {
  flip_whoosh: {
    key: 'flip_whoosh',
    src: ['assets/audio/sfx/flip-whoosh.mp3', 'assets/audio/sfx/flip-whoosh.ogg'],
    volume: 0.7,
    pitchVariation: { min: 0.8, max: 1.3 },
  },
  sizzle_pop: {
    key: 'sizzle_pop',
    src: ['assets/audio/sfx/sizzle-pop.mp3', 'assets/audio/sfx/sizzle-pop.ogg'],
    volume: 0.6,
    pitchVariation: { min: 0.95, max: 1.05 },
  },
  crowd_murmur: {
    key: 'crowd_murmur',
    src: ['assets/audio/sfx/crowd-murmur.mp3', 'assets/audio/sfx/crowd-murmur.ogg'],
    volume: 0.3,
  },
  crowd_clap: {
    key: 'crowd_clap',
    src: ['assets/audio/sfx/crowd-clap.mp3', 'assets/audio/sfx/crowd-clap.ogg'],
    volume: 0.5,
  },
  crowd_cheer: {
    key: 'crowd_cheer',
    src: ['assets/audio/sfx/crowd-cheer.mp3', 'assets/audio/sfx/crowd-cheer.ogg'],
    volume: 0.6,
  },
  crowd_hysteria: {
    key: 'crowd_hysteria',
    src: ['assets/audio/sfx/crowd-hysteria.mp3', 'assets/audio/sfx/crowd-hysteria.ogg'],
    volume: 0.7,
  },
  slipper_scuff: {
    key: 'slipper_scuff',
    src: ['assets/audio/sfx/slipper-scuff.mp3', 'assets/audio/sfx/slipper-scuff.ogg'],
    volume: 0.25,
    pitchVariation: { min: 0.9, max: 1.1 },
  },
  sad_trombone: {
    key: 'sad_trombone',
    src: ['assets/audio/sfx/sad-trombone.mp3', 'assets/audio/sfx/sad-trombone.ogg'],
    volume: 0.6,
  },
  signature_sting: {
    key: 'signature_sting',
    src: ['assets/audio/sfx/signature-sting.mp3', 'assets/audio/sfx/signature-sting.ogg'],
    volume: 0.8,
  },
  combo_ding: {
    key: 'combo_ding',
    src: ['assets/audio/sfx/combo-ding.mp3', 'assets/audio/sfx/combo-ding.ogg'],
    volume: 0.5,
    pitchVariation: { min: 0.8, max: 1.6 },
  },
  combo_break: {
    key: 'combo_break',
    src: ['assets/audio/sfx/combo-break.mp3', 'assets/audio/sfx/combo-break.ogg'],
    volume: 0.6,
  },
  fire_ignite: {
    key: 'fire_ignite',
    src: ['assets/audio/sfx/fire-ignite.mp3', 'assets/audio/sfx/fire-ignite.ogg'],
    volume: 0.7,
  },
  special_ready: {
    key: 'special_ready',
    src: ['assets/audio/sfx/special-ready.mp3', 'assets/audio/sfx/special-ready.ogg'],
    volume: 0.7,
  },
  menu_click: {
    key: 'menu_click',
    src: ['assets/audio/sfx/menu-click.mp3', 'assets/audio/sfx/menu-click.ogg'],
    volume: 0.4,
  },
  purchase_ding: {
    key: 'purchase_ding',
    src: ['assets/audio/sfx/purchase-ding.mp3', 'assets/audio/sfx/purchase-ding.ogg'],
    volume: 0.5,
  },
  unlock_fanfare: {
    key: 'unlock_fanfare',
    src: ['assets/audio/sfx/unlock-fanfare.mp3', 'assets/audio/sfx/unlock-fanfare.ogg'],
    volume: 0.7,
  },
} as const;

// ──────────────────────────────────────────────
// Music entries — one per level + menu theme
// ──────────────────────────────────────────────

const MUSIC_ENTRIES: Record<string, MusicEntry> = {
  menu_theme: {
    key: 'menu_theme',
    src: ['assets/audio/music/menu-theme.mp3', 'assets/audio/music/menu-theme.ogg'],
    volume: 0.5,
    loop: true,
  },
  level_apartment: {
    key: 'level_apartment',
    src: ['assets/audio/music/level-apartment.mp3', 'assets/audio/music/level-apartment.ogg'],
    volume: 0.4,
    loop: true,
    levelId: 'apartment',
    bpm: 90,
  },
  level_suburban: {
    key: 'level_suburban',
    src: ['assets/audio/music/level-suburban.mp3', 'assets/audio/music/level-suburban.ogg'],
    volume: 0.4,
    loop: true,
    levelId: 'suburban',
    bpm: 120,
  },
  level_openplan: {
    key: 'level_openplan',
    src: ['assets/audio/music/level-openplan.mp3', 'assets/audio/music/level-openplan.ogg'],
    volume: 0.4,
    loop: true,
    levelId: 'openplan',
    bpm: 130,
  },
  level_holiday: {
    key: 'level_holiday',
    src: ['assets/audio/music/level-holiday.mp3', 'assets/audio/music/level-holiday.ogg'],
    volume: 0.4,
    loop: true,
    levelId: 'holiday',
    bpm: 140,
  },
  level_competition: {
    key: 'level_competition',
    src: ['assets/audio/music/level-competition.mp3', 'assets/audio/music/level-competition.ogg'],
    volume: 0.45,
    loop: true,
    levelId: 'competition',
    bpm: 150,
  },
} as const;

// ──────────────────────────────────────────────
// Combined manifest
// ──────────────────────────────────────────────

/** Complete audio manifest for the game — all SFX and music entries */
export const AUDIO_MANIFEST: AudioManifest = {
  sfx: SFX_ENTRIES,
  music: MUSIC_ENTRIES,
};
