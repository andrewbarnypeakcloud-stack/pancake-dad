// Audio system types — owned by Audio Engineer
// See .claude/agents/audio-engineer.md for full specification
// See PancakeDad_GDD_v02_Browser.md sections 7.3, 7.4

import { GameEvent, AudienceStage } from './game';

// ──────────────────────────────────────────────
// Audio sprite definitions
// ──────────────────────────────────────────────

/** Maps sprite names to their start time and duration within an audio sprite atlas */
export interface AudioSpriteMap {
  readonly [spriteName: string]: {
    readonly start: number;
    readonly duration: number;
  };
}

// ──────────────────────────────────────────────
// SFX and Music entry types
// ──────────────────────────────────────────────

/** Pitch variation range for SFX (randomized within range on each play) */
export interface PitchVariation {
  readonly min: number;
  readonly max: number;
}

/** Definition of a single sound effect asset */
export interface SFXEntry {
  readonly key: string;
  readonly src: string[];
  readonly volume: number;
  readonly pitchVariation?: PitchVariation;
  readonly sprite?: AudioSpriteMap;
}

/** Definition of a single music track asset */
export interface MusicEntry {
  readonly key: string;
  readonly src: string[];
  readonly volume: number;
  readonly loop: boolean;
  readonly levelId?: string;
  readonly bpm?: number;
}

// ──────────────────────────────────────────────
// Audio manifest
// ──────────────────────────────────────────────

/** Complete manifest of all audio assets in the game */
export interface AudioManifest {
  readonly sfx: Record<string, SFXEntry>;
  readonly music: Record<string, MusicEntry>;
}

// ──────────────────────────────────────────────
// Audio event mapping
// ──────────────────────────────────────────────

/** Audio action types that can be triggered by game events */
export type AudioActionType = 'sfx' | 'music_start' | 'music_stop';

/** A single audio action to perform in response to a game event */
export interface AudioAction {
  readonly type: AudioActionType;
  readonly key: string;
  readonly pitchOverride?: number;
  readonly volumeOverride?: number;
}

/** Maps GameEvent enum values to the audio actions they should trigger */
export type AudioEventMap = Partial<Record<GameEvent, AudioAction | AudioAction[]>>;

/** Maps audience stages to crowd SFX keys */
export const AUDIENCE_STAGE_SFX: Record<AudienceStage, string> = {
  [AudienceStage.WATCHING]: 'crowd_murmur',
  [AudienceStage.CLAPPING]: 'crowd_clap',
  [AudienceStage.EXCITED]: 'crowd_cheer',
  [AudienceStage.HYSTERIA]: 'crowd_hysteria',
} as const;

// ──────────────────────────────────────────────
// Audio settings (persisted by Platform/DevOps)
// ──────────────────────────────────────────────

/** User-configurable audio settings — serialized to localStorage */
export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

/** Default audio settings for a new player */
export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = {
  masterVolume: 1.0,
  sfxVolume: 0.8,
  musicVolume: 0.6,
  muted: false,
} as const;

// ──────────────────────────────────────────────
// SFX playback options
// ──────────────────────────────────────────────

/** Options for playing a sound effect */
export interface PlaySFXOptions {
  readonly pitch?: number;
  readonly volume?: number;
  readonly sprite?: string;
}

/** Options for crossfading between music tracks */
export interface CrossfadeOptions {
  readonly fadeOutMs: number;
  readonly fadeInMs: number;
}

/** Default crossfade duration */
export const DEFAULT_CROSSFADE_MS = 1500;
