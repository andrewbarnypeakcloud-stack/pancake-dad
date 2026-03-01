// Core game types — owned by Game Engineer
// See PancakeDad_GDD_v02_Browser.md sections 3.4, 3.5, 3.6, 3.7

/** All game events — the communication backbone between systems.
 *  Other agents subscribe to these via Phaser's event emitter. */
export enum GameEvent {
  // Trick events
  TRICK_START = 'trick:start',
  TRICK_COMPLETE = 'trick:complete',
  TRICK_FAIL = 'trick:fail',

  // Combo events
  COMBO_UPDATE = 'combo:update',
  COMBO_BREAK = 'combo:break',

  // Meter events
  AUDIENCE_STAGE_CHANGE = 'audience:stageChange',
  SPECIAL_METER_UPDATE = 'special:update',
  SPECIAL_METER_FULL = 'special:full',
  SPECIAL_METER_DRAIN = 'special:drain',

  // On Fire state
  ON_FIRE_START = 'onFire:start',
  ON_FIRE_END = 'onFire:end',

  // Run lifecycle
  RUN_START = 'run:start',
  RUN_END = 'run:end',
  RUN_TIMER_TICK = 'run:timerTick',
  RUN_PAUSED = 'run:paused',
  RUN_RESUMED = 'run:resumed',

  // Economy
  DAD_BUCKS_EARNED = 'economy:dadBucksEarned',

  // Level
  LEVEL_LOADED = 'level:loaded',

  // Pancake
  PANCAKE_CAUGHT = 'pancake:caught',
  PANCAKE_DROPPED = 'pancake:dropped',
  PANCAKE_FLIPPED = 'pancake:flipped',

  // Score
  SCORE_UPDATE = 'score:update',
}

/** Player input actions — union of all possible inputs */
export enum InputAction {
  MOVE_LEFT = 'moveLeft',
  MOVE_RIGHT = 'moveRight',
  JUMP = 'jump',
  SPIN_LEFT = 'spinLeft',
  SPIN_RIGHT = 'spinRight',
  GRAB = 'grab',
  MANUAL = 'manual',
  RESTART = 'restart',
  PAUSE = 'pause',
}

/** Definition of a single trick — loaded from tricks.json */
export interface TrickDefinition {
  readonly id: string;
  readonly name: string;
  readonly inputs: InputAction[];
  readonly baseScore: number;
  readonly description: string;
  readonly animationKey: string;
  readonly isSignature: boolean;
  readonly requiresSpecialMeter: boolean;
}

/** Result of a performed trick */
export interface TrickResult {
  readonly trick: TrickDefinition;
  readonly score: number;
  readonly multiplier: number;
  readonly isPerfect: boolean;
}

/** Current combo chain state */
export interface ComboState {
  chain: number;
  multiplier: number;
  totalScore: number;
  onFire: boolean;
  bankedScore: number;
}

/** Physics profile for a dad character */
export interface DadPhysicsProfile {
  readonly speed: number;
  readonly jumpForce: number;
  readonly spinRate: number;
  readonly airTime: number;
  readonly gravityScale: number;
}

/** Audience meter stages (GDD 3.6) */
export enum AudienceStage {
  WATCHING = 'watching',
  CLAPPING = 'clapping',
  EXCITED = 'excited',
  HYSTERIA = 'hysteria',
}

/** Scene keys used for Phaser scene registration */
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  SHOP: 'ShopScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
} as const;

/** Game configuration constants */
export const GAME_CONFIG = {
  RUN_DURATION_SECONDS: 90,
  MAX_COMBO_MULTIPLIER: 10,
  ON_FIRE_THRESHOLD: 5,
  ON_FIRE_BONUS: 0.5,
  HYSTERIA_MULTIPLIER: 2,
  HYSTERIA_WINDOW_SECONDS: 20,
  CANVAS_MIN_WIDTH: 320,
  CANVAS_MIN_HEIGHT: 480,
  CANVAS_MAX_WIDTH: 1920,
  CANVAS_MAX_HEIGHT: 1080,
  TARGET_FPS: 60,
} as const;
