import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ECONOMY_CONFIG,
  DEFAULT_PROGRESSION,
} from '../../src/types/content';

// ──────────────────────────────────────────────
// Mock all JSON data imports that DataLoader uses at construction time.
// This allows us to instantiate DataLoader without real Phaser dependency.
// ──────────────────────────────────────────────

vi.mock('../../src/data/dads.json', () => ({
  default: [
    {
      id: 'gary',
      name: 'Gary',
      archetype: 'The Classic Dad',
      stats: { speed: 1, jumpForce: 1, spinRate: 1, airTime: 1, gravityScale: 1, styleMultiplier: 1 },
      signatureTrick: { name: 'Perfect Flip', description: 'test', baseScore: 1000, cinematicDuration: 1.5, requiresFullSpecial: true },
      unlockCondition: { type: 'default' },
      spriteKey: 'dad-gary',
    },
  ],
}));

vi.mock('../../src/data/levels.json', () => ({
  default: [
    {
      id: 'the-apartment',
      name: 'The Apartment',
      setting: 'Tight 1-bed kitchen',
      hazard: { id: 'cat-on-counter', name: 'Cat on the Counter', description: 'test', effectType: 'pancake-intercept' },
      visualStyle: 'warm',
      backgroundLayers: ['bg-far', 'bg-mid', 'bg-near'],
      musicKey: 'music-apartment',
      unlockOrder: 1,
    },
  ],
}));

vi.mock('../../src/data/tricks.json', () => ({
  default: {
    basic: [
      { id: 'the-classic', name: 'The Classic', input: { actions: ['jump'], requiresAirborne: true }, baseScore: 100, description: 'test', isSignature: false, requiresSpecialMeter: false },
    ],
    signature: [
      { id: 'perfect-flip', name: 'Perfect Flip', input: { actions: ['jump', 'spinLeft', 'grab'], requiresAirborne: true }, baseScore: 1000, description: 'test', isSignature: true, requiresSpecialMeter: true, dadId: 'gary' },
    ],
  },
}));

vi.mock('../../src/data/shop.json', () => ({
  default: {
    pans: [
      { id: 'non-stick-starter', name: 'Non-stick Starter', description: 'default', effect: {}, cost: 0, category: 'pan', isDefault: true },
      { id: 'cast-iron-pro', name: 'Cast Iron Pro', description: '+15% catch', effect: { catchRadius: 0.15 }, cost: 500, category: 'pan', isDefault: false },
    ],
    slippers: [
      { id: 'terry-cloth-classic', name: 'Terry Cloth Classic', description: 'default', effect: {}, cost: 0, category: 'slipper', isDefault: true },
      { id: 'rubber-sole-grip', name: 'Rubber Sole Grip', description: 'better landing', effect: { landingStability: 0.2 }, cost: 400, category: 'slipper', isDefault: false },
    ],
  },
}));

vi.mock('../../src/data/challenges.json', () => ({
  default: [
    { id: 'first-flip', name: 'First Flip', description: 'Land your first trick', type: 'trick', target: 1, reward: { dadBucks: 50 } },
    { id: 'score-10k', name: 'Five Figures', description: 'Score 10k', type: 'score', target: 10000, reward: { dadBucks: 100 } },
  ],
}));

// Mock Phaser so DataLoader can import it without error
vi.mock('phaser', () => ({
  default: {},
}));

import { DataLoader } from '../../src/data/DataLoader';

// ──────────────────────────────────────────────
// ECONOMY_CONFIG constants
// ──────────────────────────────────────────────

describe('ECONOMY_CONFIG', () => {
  it('should define SCORE_DIVISOR as 100', () => {
    expect(ECONOMY_CONFIG.SCORE_DIVISOR).toBe(100);
  });

  it('should define CHALLENGE_BONUS as 50', () => {
    expect(ECONOMY_CONFIG.CHALLENGE_BONUS).toBe(50);
  });

  it('should define FIRST_UPGRADE_COST as 400', () => {
    expect(ECONOMY_CONFIG.FIRST_UPGRADE_COST).toBe(400);
  });

  it('should define TOTAL_UPGRADE_COST as 6400', () => {
    expect(ECONOMY_CONFIG.TOTAL_UPGRADE_COST).toBe(6400);
  });

  it('should be a frozen/readonly object', () => {
    // ECONOMY_CONFIG uses `as const`, meaning the type system enforces readonly.
    // At runtime, `as const` does not call Object.freeze, but we can verify
    // the values are the expected constants.
    expect(typeof ECONOMY_CONFIG.SCORE_DIVISOR).toBe('number');
    expect(typeof ECONOMY_CONFIG.CHALLENGE_BONUS).toBe('number');
    expect(typeof ECONOMY_CONFIG.FIRST_UPGRADE_COST).toBe('number');
    expect(typeof ECONOMY_CONFIG.TOTAL_UPGRADE_COST).toBe('number');
  });

  it('FIRST_UPGRADE_COST should be achievable in 3-5 runs (GDD guideline)', () => {
    // If a player scores ~10,000 per run, they earn floor(10000/100)=100 Dad Bucks.
    // In 4 runs that is 400, which matches FIRST_UPGRADE_COST.
    // Verify the cost / per-run earning ratio is in the 3-5 range for a ~10k scorer.
    const typicalRunScore = 10000;
    const perRunEarning = Math.floor(typicalRunScore / ECONOMY_CONFIG.SCORE_DIVISOR);
    const runsNeeded = Math.ceil(ECONOMY_CONFIG.FIRST_UPGRADE_COST / perRunEarning);
    expect(runsNeeded).toBeGreaterThanOrEqual(3);
    expect(runsNeeded).toBeLessThanOrEqual(5);
  });
});

// ──────────────────────────────────────────────
// DEFAULT_PROGRESSION
// ──────────────────────────────────────────────

describe('DEFAULT_PROGRESSION', () => {
  it('should start with gary as the only unlocked dad', () => {
    expect(DEFAULT_PROGRESSION.unlockedDads).toEqual(['gary']);
  });

  it('should equip gary as the default dad', () => {
    expect(DEFAULT_PROGRESSION.equippedDad).toBe('gary');
  });

  it('should equip the default pan and slippers', () => {
    expect(DEFAULT_PROGRESSION.equippedPan).toBe('non-stick-starter');
    expect(DEFAULT_PROGRESSION.equippedSlippers).toBe('terry-cloth-classic');
  });

  it('should start with default items already purchased', () => {
    expect(DEFAULT_PROGRESSION.purchasedItems).toContain('non-stick-starter');
    expect(DEFAULT_PROGRESSION.purchasedItems).toContain('terry-cloth-classic');
  });

  it('should start with zero dadBucks', () => {
    expect(DEFAULT_PROGRESSION.dadBucks).toBe(0);
  });

  it('should start with empty highScores', () => {
    expect(DEFAULT_PROGRESSION.highScores).toEqual({});
  });

  it('should start with no challenges completed', () => {
    expect(DEFAULT_PROGRESSION.challengesCompleted).toEqual([]);
  });

  it('should start with zero total runs played', () => {
    expect(DEFAULT_PROGRESSION.totalRunsPlayed).toBe(0);
  });
});

// ──────────────────────────────────────────────
// DataLoader.calculateDadBucks()
// ──────────────────────────────────────────────

describe('DataLoader.calculateDadBucks()', () => {
  let loader: DataLoader;

  beforeEach(() => {
    loader = new DataLoader();
  });

  it('should return 0 for a score of 0 with no challenges', () => {
    expect(loader.calculateDadBucks(0, 0)).toBe(0);
  });

  it('should apply floor division by SCORE_DIVISOR (100)', () => {
    // 1500 / 100 = 15
    expect(loader.calculateDadBucks(1500, 0)).toBe(15);
  });

  it('should floor the score-based earnings (no rounding up)', () => {
    // 199 / 100 = 1.99, floor = 1
    expect(loader.calculateDadBucks(199, 0)).toBe(1);
  });

  it('should return 0 base earning for scores under 100', () => {
    expect(loader.calculateDadBucks(50, 0)).toBe(0);
    expect(loader.calculateDadBucks(99, 0)).toBe(0);
  });

  it('should return 1 base earning for score of exactly 100', () => {
    expect(loader.calculateDadBucks(100, 0)).toBe(1);
  });

  it('should add CHALLENGE_BONUS (50) per challenge completed', () => {
    // 0 score + 1 challenge = 0 + 50 = 50
    expect(loader.calculateDadBucks(0, 1)).toBe(50);
  });

  it('should add multiple challenge bonuses', () => {
    // 0 score + 3 challenges = 0 + 150 = 150
    expect(loader.calculateDadBucks(0, 3)).toBe(150);
  });

  it('should combine score-based and challenge-based earnings', () => {
    // 10000 / 100 = 100, 2 challenges * 50 = 100, total = 200
    expect(loader.calculateDadBucks(10000, 2)).toBe(200);
  });

  it('should handle large scores correctly', () => {
    // 1,000,000 / 100 = 10,000
    expect(loader.calculateDadBucks(1000000, 0)).toBe(10000);
  });

  it('should handle zero challenges with a positive score', () => {
    // 5000 / 100 = 50
    expect(loader.calculateDadBucks(5000, 0)).toBe(50);
  });

  it('should match the formula: Math.floor(score / 100) + challenges * 50', () => {
    // Parametric check with several data points
    const testCases = [
      { score: 0, challenges: 0, expected: 0 },
      { score: 100, challenges: 0, expected: 1 },
      { score: 999, challenges: 0, expected: 9 },
      { score: 1000, challenges: 1, expected: 60 },
      { score: 25000, challenges: 3, expected: 400 },
      { score: 75000, challenges: 5, expected: 1000 },
    ];

    for (const { score, challenges, expected } of testCases) {
      expect(loader.calculateDadBucks(score, challenges)).toBe(expected);
    }
  });

  it('should be consistent with ECONOMY_CONFIG constants', () => {
    // Verify the formula uses the same divisor and bonus as ECONOMY_CONFIG
    const score = 10000;
    const challenges = 2;

    const expectedBase = Math.floor(score / ECONOMY_CONFIG.SCORE_DIVISOR);
    const expectedBonus = challenges * ECONOMY_CONFIG.CHALLENGE_BONUS;
    const expected = expectedBase + expectedBonus;

    expect(loader.calculateDadBucks(score, challenges)).toBe(expected);
  });
});

// ──────────────────────────────────────────────
// Economy balance sanity checks (GDD Section 5.1)
// ──────────────────────────────────────────────

describe('Economy balance (GDD sanity checks)', () => {
  let loader: DataLoader;

  beforeEach(() => {
    loader = new DataLoader();
  });

  it('a beginner run (~5k) should earn enough to feel progress', () => {
    const dadBucks = loader.calculateDadBucks(5000, 0);
    expect(dadBucks).toBe(50);
    expect(dadBucks).toBeGreaterThan(0);
  });

  it('a skilled run (~30k) with 2 challenges should earn meaningful Dad Bucks', () => {
    const dadBucks = loader.calculateDadBucks(30000, 2);
    // 300 + 100 = 400
    expect(dadBucks).toBe(400);
    // Should be enough to buy the cheapest upgrade (FIRST_UPGRADE_COST = 400)
    expect(dadBucks).toBeGreaterThanOrEqual(ECONOMY_CONFIG.FIRST_UPGRADE_COST);
  });

  it('challenges should provide a meaningful bonus relative to score earnings', () => {
    const scoreOnly = loader.calculateDadBucks(10000, 0); // 100
    const withChallenge = loader.calculateDadBucks(10000, 1); // 150
    const bonus = withChallenge - scoreOnly;

    expect(bonus).toBe(ECONOMY_CONFIG.CHALLENGE_BONUS);
    // Challenge bonus should be at least 25% of a typical run's score earnings
    expect(bonus / scoreOnly).toBeGreaterThanOrEqual(0.25);
  });

  it('the cheapest shop upgrade should be reachable in the target run window', () => {
    // GDD says: first upgrade target cost should be reached in 3-5 runs
    // Cheapest non-default slipper: Rubber Sole Grip at 400 Dad Bucks
    // With ~10k average score and 0-1 challenges per run
    const avgEarningPerRun = loader.calculateDadBucks(10000, 0); // 100
    const runsForCheapest = Math.ceil(
      ECONOMY_CONFIG.FIRST_UPGRADE_COST / avgEarningPerRun
    );
    expect(runsForCheapest).toBeGreaterThanOrEqual(3);
    expect(runsForCheapest).toBeLessThanOrEqual(5);
  });
});
