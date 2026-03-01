// Content data types — owned by Content Designer
// See .claude/agents/content-designer.md for full specification
// See PancakeDad_GDD_v02_Browser.md sections 3.4, 4, 5, 6

import { InputAction } from './game';

// ──────────────────────────────────────────────
// Dad types (GDD Section 4)
// ──────────────────────────────────────────────

/** Core physics and gameplay stats for a dad character */
export interface DadStats {
  readonly speed: number;
  readonly jumpForce: number;
  readonly spinRate: number;
  readonly airTime: number;
  readonly gravityScale: number;
  readonly styleMultiplier: number;
}

/** Unlock condition — discriminated union */
export type UnlockCondition =
  | { readonly type: 'default' }
  | { readonly type: 'score'; readonly threshold: number }
  | { readonly type: 'challenges'; readonly count: number }
  | { readonly type: 'equipment'; readonly itemId: string };

/** Signature trick attached to a specific dad (GDD 3.4) */
export interface SignatureTrickDefinition {
  readonly name: string;
  readonly description: string;
  readonly baseScore: number;
  readonly cinematicDuration: number;
  readonly requiresFullSpecial: boolean;
}

/** Full definition of a playable dad character */
export interface DadDefinition {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly stats: DadStats;
  readonly signatureTrick: SignatureTrickDefinition;
  readonly unlockCondition: UnlockCondition;
  readonly spriteKey: string;
}

// ──────────────────────────────────────────────
// Level types (GDD Section 6)
// ──────────────────────────────────────────────

/** Hazard present in a level */
export interface HazardDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effectType: string;
}

/** Full definition of a kitchen level / arena */
export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  readonly setting: string;
  readonly hazard: HazardDefinition;
  readonly visualStyle: string;
  readonly backgroundLayers: string[];
  readonly musicKey: string;
  readonly unlockOrder: number;
}

// ──────────────────────────────────────────────
// Trick types (GDD Section 3.4)
// ──────────────────────────────────────────────

/** Input combination required to perform a trick */
export interface TrickInput {
  readonly actions: InputAction[];
  readonly holdDuration?: number;
  readonly requiresAirborne: boolean;
}

/** Content-side trick definition (complements game.ts TrickDefinition) */
export interface TrickContentDefinition {
  readonly id: string;
  readonly name: string;
  readonly input: TrickInput;
  readonly baseScore: number;
  readonly description: string;
  readonly isSignature: boolean;
  readonly requiresSpecialMeter: boolean;
  readonly dadId?: string;
}

// ──────────────────────────────────────────────
// Shop types (GDD Section 5)
// ──────────────────────────────────────────────

/** A single shop item (pan or slipper upgrade) */
export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effect: Record<string, number>;
  readonly cost: number;
  readonly category: 'pan' | 'slipper';
  readonly isDefault: boolean;
}

// ──────────────────────────────────────────────
// Challenge types
// ──────────────────────────────────────────────

/** A completable in-game challenge */
export interface ChallengeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'score' | 'trick' | 'combo' | 'level' | 'misc';
  readonly target: number;
  readonly reward: ChallengeReward;
}

/** Reward granted on challenge completion */
export interface ChallengeReward {
  readonly dadBucks: number;
  readonly unlockItemId?: string;
}

// ──────────────────────────────────────────────
// Progression / save state (GDD Section 5.1)
// ──────────────────────────────────────────────

/** Complete player progression state — serialized to localStorage */
export interface ProgressionState {
  unlockedDads: string[];
  equippedDad: string;
  equippedPan: string;
  equippedSlippers: string;
  purchasedItems: string[];
  dadBucks: number;
  highScores: Record<string, number>;
  challengesCompleted: string[];
  totalRunsPlayed: number;
}

// ──────────────────────────────────────────────
// Economy constants (GDD Section 5.1)
// ──────────────────────────────────────────────

/** Dad Bucks economy configuration */
export const ECONOMY_CONFIG = {
  /** Dad Bucks earned per run: Math.floor(score / SCORE_DIVISOR) */
  SCORE_DIVISOR: 100,
  /** Bonus Dad Bucks per challenge completed during a run */
  CHALLENGE_BONUS: 50,
  /** First upgrade target cost — player should reach in 3-5 runs */
  FIRST_UPGRADE_COST: 400,
  /** Total cost of all upgrades */
  TOTAL_UPGRADE_COST: 6400,
} as const;

/** Default progression state for a new player */
export const DEFAULT_PROGRESSION: Readonly<ProgressionState> = {
  unlockedDads: ['gary'],
  equippedDad: 'gary',
  equippedPan: 'non-stick-starter',
  equippedSlippers: 'terry-cloth-classic',
  purchasedItems: ['non-stick-starter', 'terry-cloth-classic'],
  dadBucks: 0,
  highScores: {},
  challengesCompleted: [],
  totalRunsPlayed: 0,
};
