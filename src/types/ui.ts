// UI component types — owned by UI/UX Artist
// See .claude/agents/ui-ux-artist.md for full specification
// See PancakeDad_GDD_v02_Browser.md section 7.2

import { AudienceStage } from './game';

// ──────────────────────────────────────────────
// Responsive layout
// ──────────────────────────────────────────────

/** Anchor point for positioning UI elements relative to screen dimensions.
 *  anchorX/anchorY are 0-1 percentage; offsets are pixel adjustments from the anchor. */
export interface ResponsiveAnchor {
  readonly anchorX: number; // 0-1 percentage of screen width
  readonly anchorY: number; // 0-1 percentage of screen height
  readonly offsetX: number; // pixel offset from anchor
  readonly offsetY: number; // pixel offset from anchor
  readonly originX?: number; // Phaser origin 0-1 (default 0)
  readonly originY?: number; // Phaser origin 0-1 (default 0)
}

/** Resolved pixel position from a ResponsiveAnchor */
export interface ResolvedPosition {
  readonly x: number;
  readonly y: number;
  readonly originX: number;
  readonly originY: number;
}

// ──────────────────────────────────────────────
// HUD configuration
// ──────────────────────────────────────────────

/** Top-level HUD layout configuration — all positions use ResponsiveAnchor */
export interface HUDConfig {
  readonly scorePosition: ResponsiveAnchor;
  readonly timerPosition: ResponsiveAnchor;
  readonly comboPosition: ResponsiveAnchor;
  readonly audienceMeterPosition: ResponsiveAnchor;
  readonly specialMeterPosition: ResponsiveAnchor;
}

/** Default HUD layout for 16:9 desktop landscape */
export const DEFAULT_HUD_CONFIG: HUDConfig = {
  scorePosition: { anchorX: 0, anchorY: 0, offsetX: 16, offsetY: 16, originX: 0, originY: 0 },
  timerPosition: { anchorX: 0.5, anchorY: 0, offsetX: 0, offsetY: 16, originX: 0.5, originY: 0 },
  comboPosition: { anchorX: 0.5, anchorY: 0.35, offsetX: 0, offsetY: 0, originX: 0.5, originY: 0.5 },
  audienceMeterPosition: { anchorX: 1, anchorY: 0.15, offsetX: -40, offsetY: 0, originX: 1, originY: 0 },
  specialMeterPosition: { anchorX: 0.75, anchorY: 0, offsetX: 0, offsetY: 16, originX: 0.5, originY: 0 },
} as const;

/** Mobile HUD layout for 9:16 portrait */
export const MOBILE_HUD_CONFIG: HUDConfig = {
  scorePosition: { anchorX: 0, anchorY: 0, offsetX: 8, offsetY: 8, originX: 0, originY: 0 },
  timerPosition: { anchorX: 0.5, anchorY: 0, offsetX: 0, offsetY: 8, originX: 0.5, originY: 0 },
  comboPosition: { anchorX: 0.5, anchorY: 0.25, offsetX: 0, offsetY: 0, originX: 0.5, originY: 0.5 },
  audienceMeterPosition: { anchorX: 1, anchorY: 0.1, offsetX: -28, offsetY: 0, originX: 1, originY: 0 },
  specialMeterPosition: { anchorX: 0.5, anchorY: 0.06, offsetX: 0, offsetY: 0, originX: 0.5, originY: 0 },
} as const;

// ──────────────────────────────────────────────
// Animation definitions
// ──────────────────────────────────────────────

/** Tween-based animation definition for UI elements */
export interface AnimationDefinition {
  readonly duration: number;     // milliseconds
  readonly ease: string;         // Phaser ease name e.g. 'Back.easeOut'
  readonly scaleX?: number;      // target scaleX
  readonly scaleY?: number;      // target scaleY
  readonly alpha?: number;       // target alpha
  readonly repeat?: number;      // repeat count (-1 for infinite)
  readonly yoyo?: boolean;       // whether to yoyo
  readonly delay?: number;       // delay before start in ms
}

// ──────────────────────────────────────────────
// Particle configuration
// ──────────────────────────────────────────────

/** Configuration for a particle emitter effect */
export interface ParticleConfig {
  readonly texture: string;
  readonly speed: { readonly min: number; readonly max: number };
  readonly lifespan: number;
  readonly scale: { readonly start: number; readonly end: number };
  readonly quantity: number;
  readonly tint?: number;
  readonly alpha?: { readonly start: number; readonly end: number };
  readonly blendMode?: string;
  readonly gravityY?: number;
  readonly angle?: { readonly min: number; readonly max: number };
  readonly emitZone?: { readonly type: string; readonly source: unknown };
}

// ──────────────────────────────────────────────
// Menu transition
// ──────────────────────────────────────────────

/** Menu screen transition definition */
export interface MenuTransition {
  readonly type: 'fade' | 'slide' | 'instant';
  readonly duration: number;
}

// ──────────────────────────────────────────────
// Share card
// ──────────────────────────────────────────────

/** Data required to render a share card image */
export interface ShareCardData {
  readonly score: number;
  readonly dadName: string;
  readonly levelName: string;
  readonly comboMax: number;
  readonly isHighScore: boolean;
  readonly tricksLanded?: number;
  readonly dadBucksEarned?: number;
  readonly timestamp?: number;
}

// ──────────────────────────────────────────────
// Visual feedback (interface for other agents)
// ──────────────────────────────────────────────

/** Interface for triggering visual effects — used by Game Engineer */
export interface VisualFeedback {
  screenShake: (intensity: number, duration: number) => void;
  flash: (color: number, duration: number) => void;
  slowMotion: (duration: number, timeScale: number) => void;
}

// ──────────────────────────────────────────────
// Audience meter visual stages
// ──────────────────────────────────────────────

/** Color mappings for audience meter stages */
export const AUDIENCE_STAGE_COLORS: Record<AudienceStage, number> = {
  [AudienceStage.WATCHING]: 0x888888,
  [AudienceStage.CLAPPING]: 0x4a90d9,
  [AudienceStage.EXCITED]: 0xf5a623,
  [AudienceStage.HYSTERIA]: 0xe74c3c,
} as const;

/** Labels for audience meter stages */
export const AUDIENCE_STAGE_LABELS: Record<AudienceStage, string> = {
  [AudienceStage.WATCHING]: 'WATCHING',
  [AudienceStage.CLAPPING]: 'CLAPPING',
  [AudienceStage.EXCITED]: 'EXCITED!',
  [AudienceStage.HYSTERIA]: 'HYSTERIA!!',
} as const;

// ──────────────────────────────────────────────
// UI color constants
// ──────────────────────────────────────────────

export const UI_COLORS = {
  PRIMARY: 0xf5a623,
  PRIMARY_HOVER: 0xffb84d,
  SECONDARY: 0x8B6B4A,
  SECONDARY_HOVER: 0xA6845E,
  BACKGROUND_DARK: 0x3D2B1F,
  TEXT_LIGHT: 0xffffff,
  TEXT_DARK: 0x3D2B1F,
  TEXT_MUTED: 0x7A6B5D,
  DANGER: 0xe74c3c,
  SUCCESS: 0x27ae60,
  COMBO_NORMAL: 0xf5a623,
  COMBO_FIRE: 0xe74c3c,
  SPECIAL_FULL: 0x00ff88,
  SPECIAL_EMPTY: 0x333333,
  OVERLAY_DIM: 0x000000,
} as const;

/** Text style presets for common UI text */
export const UI_TEXT_STYLES = {
  TITLE: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '64px',
    color: '#f5a623',
    stroke: '#3D2B1F',
    strokeThickness: 6,
  },
  HEADING: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '36px',
    color: '#3D2B1F',
  },
  BODY: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    color: '#5C4A3A',
  },
  BUTTON: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '24px',
    color: '#3D2B1F',
  },
  HUD_SCORE: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '28px',
    color: '#3D2B1F',
  },
  HUD_TIMER: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '28px',
    color: '#3D2B1F',
  },
  HUD_COMBO: {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '48px',
    color: '#f5a623',
  },
  MUTED: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    color: '#7A6B5D',
  },
} as const;

// ──────────────────────────────────────────────
// Shop / character select UI types
// ──────────────────────────────────────────────

/** Visual state of a shop item button */
export type ShopItemState = 'locked' | 'available' | 'owned' | 'equipped';

/** Visual state of a character select portrait */
export type CharacterPortraitState = 'locked' | 'available' | 'selected';

/** Tab identifier for the shop screen */
export type ShopTab = 'pans' | 'slippers';
