// DataLoader — loads and validates all JSON config at boot time
// Singleton registered in Phaser registry for cross-scene access
// See .claude/agents/content-designer.md: DataLoader Requirements

import Phaser from 'phaser';
import type {
  DadDefinition,
  LevelDefinition,
  TrickContentDefinition,
  ShopItem,
  ChallengeDefinition,
} from '../types/content';

import dadsData from './dads.json';
import levelsData from './levels.json';
import tricksData from './tricks.json';
import shopData from './shop.json';
import challengesData from './challenges.json';

/** Registry key used to store/retrieve the DataLoader singleton */
export const DATA_LOADER_KEY = 'dataLoader';

/**
 * Central data store that loads, validates, and exposes all game content JSON.
 * Register once during BootScene and retrieve from any scene via:
 *   `this.registry.get(DATA_LOADER_KEY) as DataLoader`
 */
export class DataLoader {
  private readonly dads: ReadonlyMap<string, DadDefinition>;
  private readonly levels: ReadonlyMap<string, LevelDefinition>;
  private readonly basicTricks: ReadonlyArray<TrickContentDefinition>;
  private readonly signatureTricks: ReadonlyMap<string, TrickContentDefinition>;
  private readonly allTricks: ReadonlyArray<TrickContentDefinition>;
  private readonly shopItems: ReadonlyMap<string, ShopItem>;
  private readonly challenges: ReadonlyMap<string, ChallengeDefinition>;

  constructor() {
    this.dads = this.loadDads();
    this.levels = this.loadLevels();

    const tricks = this.loadTricks();
    this.basicTricks = tricks.basic;
    this.signatureTricks = tricks.signature;
    this.allTricks = [...tricks.basic, ...Array.from(tricks.signature.values())];

    this.shopItems = this.loadShop();
    this.challenges = this.loadChallenges();

    this.validate();
  }

  // ──────────────────────────────────────────────
  // Dad getters
  // ──────────────────────────────────────────────

  getDad(id: string): DadDefinition | undefined {
    return this.dads.get(id);
  }

  getAllDads(): ReadonlyArray<DadDefinition> {
    return Array.from(this.dads.values());
  }

  getDefaultDad(): DadDefinition {
    const gary = this.dads.get('gary');
    if (!gary) {
      throw new Error('DataLoader: default dad "gary" not found in dads.json');
    }
    return gary;
  }

  // ──────────────────────────────────────────────
  // Level getters
  // ──────────────────────────────────────────────

  getLevel(id: string): LevelDefinition | undefined {
    return this.levels.get(id);
  }

  getAllLevels(): ReadonlyArray<LevelDefinition> {
    return Array.from(this.levels.values()).sort(
      (a, b) => a.unlockOrder - b.unlockOrder
    );
  }

  getLevelByOrder(order: number): LevelDefinition | undefined {
    return this.getAllLevels().find((level) => level.unlockOrder === order);
  }

  // ──────────────────────────────────────────────
  // Trick getters
  // ──────────────────────────────────────────────

  getBasicTricks(): ReadonlyArray<TrickContentDefinition> {
    return this.basicTricks;
  }

  getSignatureTrick(dadId: string): TrickContentDefinition | undefined {
    return this.signatureTricks.get(dadId);
  }

  getAllTricks(): ReadonlyArray<TrickContentDefinition> {
    return this.allTricks;
  }

  // ──────────────────────────────────────────────
  // Shop getters
  // ──────────────────────────────────────────────

  getShopItem(id: string): ShopItem | undefined {
    return this.shopItems.get(id);
  }

  getShopItems(category: 'pan' | 'slipper'): ReadonlyArray<ShopItem> {
    return Array.from(this.shopItems.values()).filter(
      (item) => item.category === category
    );
  }

  getAllShopItems(): ReadonlyArray<ShopItem> {
    return Array.from(this.shopItems.values());
  }

  // ──────────────────────────────────────────────
  // Challenge getters
  // ──────────────────────────────────────────────

  getChallenge(id: string): ChallengeDefinition | undefined {
    return this.challenges.get(id);
  }

  getAllChallenges(): ReadonlyArray<ChallengeDefinition> {
    return Array.from(this.challenges.values());
  }

  getChallengesByType(
    type: ChallengeDefinition['type']
  ): ReadonlyArray<ChallengeDefinition> {
    return Array.from(this.challenges.values()).filter(
      (c) => c.type === type
    );
  }

  // ──────────────────────────────────────────────
  // Economy helpers (GDD 5.1)
  // ──────────────────────────────────────────────

  /**
   * Calculate Dad Bucks earned from a run score.
   * Formula: Math.floor(score / 100) + challenge bonuses
   * See .claude/agents/content-designer.md: Economy Balance Guidelines
   */
  calculateDadBucks(
    runScore: number,
    challengesCompletedThisRun: number
  ): number {
    const baseEarning = Math.floor(runScore / 100);
    const challengeBonus = challengesCompletedThisRun * 50;
    return baseEarning + challengeBonus;
  }

  // ──────────────────────────────────────────────
  // Static registration helper
  // ──────────────────────────────────────────────

  /**
   * Create a DataLoader singleton and register it in the Phaser game registry.
   * Call this once during BootScene.create().
   */
  static register(scene: Phaser.Scene): DataLoader {
    const existing = scene.registry.get(DATA_LOADER_KEY) as
      | DataLoader
      | undefined;
    if (existing) {
      return existing;
    }

    const loader = new DataLoader();
    scene.registry.set(DATA_LOADER_KEY, loader);
    return loader;
  }

  /**
   * Retrieve the DataLoader singleton from any scene.
   */
  static getInstance(scene: Phaser.Scene): DataLoader {
    const loader = scene.registry.get(DATA_LOADER_KEY) as
      | DataLoader
      | undefined;
    if (!loader) {
      throw new Error(
        'DataLoader not registered. Call DataLoader.register(scene) in BootScene first.'
      );
    }
    return loader;
  }

  // ──────────────────────────────────────────────
  // Private loaders
  // ──────────────────────────────────────────────

  private loadDads(): ReadonlyMap<string, DadDefinition> {
    const map = new Map<string, DadDefinition>();
    for (const raw of dadsData) {
      const dad = raw as DadDefinition;
      if (!dad.id || !dad.name || !dad.stats || !dad.signatureTrick) {
        throw new Error(
          `DataLoader: invalid dad entry — missing required fields: ${JSON.stringify(raw)}`
        );
      }
      map.set(dad.id, dad);
    }
    return map;
  }

  private loadLevels(): ReadonlyMap<string, LevelDefinition> {
    const map = new Map<string, LevelDefinition>();
    for (const raw of levelsData) {
      const level = raw as LevelDefinition;
      if (
        !level.id ||
        !level.name ||
        !level.hazard ||
        !level.backgroundLayers ||
        level.unlockOrder === undefined
      ) {
        throw new Error(
          `DataLoader: invalid level entry — missing required fields: ${JSON.stringify(raw)}`
        );
      }
      map.set(level.id, level);
    }
    return map;
  }

  private loadTricks(): {
    basic: ReadonlyArray<TrickContentDefinition>;
    signature: ReadonlyMap<string, TrickContentDefinition>;
  } {
    const raw = tricksData as {
      basic: TrickContentDefinition[];
      signature: (TrickContentDefinition & { dadId: string })[];
    };

    for (const trick of raw.basic) {
      if (!trick.id || !trick.name || trick.baseScore === undefined) {
        throw new Error(
          `DataLoader: invalid basic trick — missing required fields: ${JSON.stringify(trick)}`
        );
      }
    }

    const signatureMap = new Map<string, TrickContentDefinition>();
    for (const trick of raw.signature) {
      if (!trick.id || !trick.name || !trick.dadId) {
        throw new Error(
          `DataLoader: invalid signature trick — missing required fields: ${JSON.stringify(trick)}`
        );
      }
      signatureMap.set(trick.dadId, trick);
    }

    return { basic: raw.basic, signature: signatureMap };
  }

  private loadShop(): ReadonlyMap<string, ShopItem> {
    const map = new Map<string, ShopItem>();
    const raw = shopData as { pans: ShopItem[]; slippers: ShopItem[] };

    for (const item of [...raw.pans, ...raw.slippers]) {
      if (!item.id || !item.name || !item.category) {
        throw new Error(
          `DataLoader: invalid shop item — missing required fields: ${JSON.stringify(item)}`
        );
      }
      map.set(item.id, item);
    }

    return map;
  }

  private loadChallenges(): ReadonlyMap<string, ChallengeDefinition> {
    const map = new Map<string, ChallengeDefinition>();
    for (const raw of challengesData as ChallengeDefinition[]) {
      if (!raw.id || !raw.name || !raw.type || raw.target === undefined) {
        throw new Error(
          `DataLoader: invalid challenge — missing required fields: ${JSON.stringify(raw)}`
        );
      }
      map.set(raw.id, raw);
    }
    return map;
  }

  // ──────────────────────────────────────────────
  // Cross-file validation
  // ──────────────────────────────────────────────

  private validate(): void {
    // Every dad's signature trick must exist in tricks.json
    for (const dad of this.dads.values()) {
      const sigTrick = this.signatureTricks.get(dad.id);
      if (!sigTrick) {
        console.warn(
          `DataLoader: dad "${dad.id}" has no matching signature trick in tricks.json`
        );
      }
    }

    // Every signature trick must reference a valid dad
    for (const [dadId] of this.signatureTricks) {
      if (!this.dads.has(dadId)) {
        console.warn(
          `DataLoader: signature trick references unknown dad "${dadId}"`
        );
      }
    }

    // Equipment unlock conditions must reference existing shop items
    for (const dad of this.dads.values()) {
      if (
        dad.unlockCondition.type === 'equipment' &&
        !this.shopItems.has(dad.unlockCondition.itemId)
      ) {
        console.warn(
          `DataLoader: dad "${dad.id}" unlock references unknown shop item "${dad.unlockCondition.itemId}"`
        );
      }
    }

    // Challenge reward unlockItemIds must reference existing shop items
    for (const challenge of this.challenges.values()) {
      if (
        challenge.reward.unlockItemId &&
        !this.shopItems.has(challenge.reward.unlockItemId)
      ) {
        console.warn(
          `DataLoader: challenge "${challenge.id}" reward references unknown shop item "${challenge.reward.unlockItemId}"`
        );
      }
    }

    // Verify at least one default dad exists
    const defaultDads = Array.from(this.dads.values()).filter(
      (d) => d.unlockCondition.type === 'default'
    );
    if (defaultDads.length === 0) {
      throw new Error('DataLoader: no default dad found — at least one dad must have unlockCondition.type === "default"');
    }

    // Verify shop has default items
    const defaultPans = Array.from(this.shopItems.values()).filter(
      (i) => i.category === 'pan' && i.isDefault
    );
    const defaultSlippers = Array.from(this.shopItems.values()).filter(
      (i) => i.category === 'slipper' && i.isDefault
    );
    if (defaultPans.length === 0) {
      throw new Error('DataLoader: no default pan found in shop.json');
    }
    if (defaultSlippers.length === 0) {
      throw new Error('DataLoader: no default slipper found in shop.json');
    }
  }
}
