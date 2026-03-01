// ChallengeTracker — monitors game events during a run and completes challenges
// See PancakeDad_GDD_v02_Browser.md section 5

import Phaser from 'phaser';
import { GameEvent, ComboState } from '../types/game';
import type { ChallengeDefinition } from '../types/content';
import { DataLoader } from '../data/DataLoader';

/** Map level IDs to their corresponding challenge IDs */
const LEVEL_CHALLENGE_MAP: Record<string, string> = {
  'the-apartment': 'complete-apartment',
  'the-suburban-home': 'complete-suburban',
  'the-open-plan': 'complete-openplan',
  'holiday-morning': 'complete-holiday',
  'the-competition': 'complete-competition',
};

/**
 * Runtime system that listens to game events during a run and checks
 * whether any active (incomplete) challenges have been met.
 *
 * On completion, awards Dad Bucks via registry and emits DAD_BUCKS_EARNED.
 * Cleans up all event listeners when the scene shuts down.
 */
export class ChallengeTracker {
  private readonly scene: Phaser.Scene;
  private readonly activeChallenges: ChallengeDefinition[];

  // Tracking counters for the current run
  private currentScore: number = 0;
  private maxCombo: number = 0;
  private tricksLanded: number = 0;
  private readonly currentLevel: string;
  private completedLevelChallengeCount: number = 0;

  // Bound listener references for cleanup
  private readonly onScoreUpdate: (score: number) => void;
  private readonly onComboUpdate: (state: ComboState) => void;
  private readonly onTrickComplete: () => void;
  private readonly onShutdown: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Read current level from registry
    this.currentLevel = (scene.registry.get('currentLevel') as string) ?? 'the-apartment';

    // Load all challenges and filter out already-completed ones
    const dataLoader = DataLoader.getInstance(scene);
    const allChallenges = dataLoader.getAllChallenges();
    const completedIds: string[] =
      scene.registry.get('challengesCompleted') ?? [];
    const completedSet = new Set(completedIds);

    // Count how many level challenges are already completed
    const levelChallengeIds = new Set(Object.values(LEVEL_CHALLENGE_MAP));
    this.completedLevelChallengeCount = completedIds.filter(
      (id) => levelChallengeIds.has(id)
    ).length;

    this.activeChallenges = allChallenges
      .filter((c) => !completedSet.has(c.id))
      .map((c) => ({ ...c }));

    // Bind listeners so they can be removed on shutdown
    this.onScoreUpdate = this.handleScoreUpdate.bind(this);
    this.onComboUpdate = this.handleComboUpdate.bind(this);
    this.onTrickComplete = this.handleTrickComplete.bind(this);
    this.onShutdown = this.destroy.bind(this);

    // Subscribe to game events
    scene.events.on(GameEvent.SCORE_UPDATE, this.onScoreUpdate);
    scene.events.on(GameEvent.COMBO_UPDATE, this.onComboUpdate);
    scene.events.on(GameEvent.TRICK_COMPLETE, this.onTrickComplete);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown);
  }

  private handleScoreUpdate(score: number): void {
    this.currentScore = score;
    this.checkChallenges('score');
    this.checkChallenges('level');
  }

  private handleComboUpdate(state: ComboState): void {
    if (state.chain > this.maxCombo) {
      this.maxCombo = state.chain;
    }
    this.checkChallenges('combo');
  }

  private handleTrickComplete(): void {
    this.tricksLanded++;
    this.checkChallenges('trick');
  }

  /**
   * Check all active challenges of the given type and complete any
   * whose target has been met during this run.
   */
  private checkChallenges(type: ChallengeDefinition['type']): void {
    // Iterate in reverse so we can splice completed entries safely
    for (let i = this.activeChallenges.length - 1; i >= 0; i--) {
      const challenge = this.activeChallenges[i];

      if (challenge.type !== type) {
        continue;
      }

      // Level challenges only apply to the current level
      if (type === 'level') {
        const expectedChallengeId = LEVEL_CHALLENGE_MAP[this.currentLevel];
        if (challenge.id !== expectedChallengeId) {
          continue;
        }
      }

      const currentValue = this.getValueForType(challenge.type);
      if (currentValue >= challenge.target) {
        // Track level challenge completions for misc type
        const isLevelChallenge = challenge.type === 'level';
        this.completeChallenge(challenge);
        this.activeChallenges.splice(i, 1);

        // When a level challenge completes, increment counter and re-check misc
        if (isLevelChallenge) {
          this.completedLevelChallengeCount++;
          this.checkChallenges('misc');
        }
      }
    }
  }

  /**
   * Returns the current tracked value for the given challenge type.
   */
  private getValueForType(type: ChallengeDefinition['type']): number {
    switch (type) {
      case 'score':
        return this.currentScore;
      case 'combo':
        return this.maxCombo;
      case 'trick':
        return this.tricksLanded;
      case 'level':
        return this.currentScore;
      case 'misc':
        return this.completedLevelChallengeCount;
      default:
        return 0;
    }
  }

  /**
   * Mark a challenge as completed: persist to registry and award Dad Bucks.
   */
  private completeChallenge(challenge: ChallengeDefinition): void {
    // Update completed challenges in registry
    const completedIds: string[] =
      this.scene.registry.get('challengesCompleted') ?? [];
    completedIds.push(challenge.id);
    this.scene.registry.set('challengesCompleted', completedIds);

    // Award Dad Bucks
    const reward = challenge.reward.dadBucks;
    const currentBucks: number = this.scene.registry.get('dadBucks') ?? 0;
    this.scene.registry.set('dadBucks', currentBucks + reward);

    // Emit event so UI/audio/platform systems can react
    this.scene.events.emit(GameEvent.DAD_BUCKS_EARNED, reward);
  }

  /** Returns the number of challenges still active (incomplete) this run */
  getActiveChallengeCount(): number {
    return this.activeChallenges.length;
  }

  /** Returns a snapshot of all active challenges */
  getActiveChallenges(): ReadonlyArray<ChallengeDefinition> {
    return [...this.activeChallenges];
  }

  /** Remove all event listeners. Called automatically on scene SHUTDOWN. */
  private destroy(): void {
    this.scene.events.off(GameEvent.SCORE_UPDATE, this.onScoreUpdate);
    this.scene.events.off(GameEvent.COMBO_UPDATE, this.onComboUpdate);
    this.scene.events.off(GameEvent.TRICK_COMPLETE, this.onTrickComplete);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown);
  }
}
