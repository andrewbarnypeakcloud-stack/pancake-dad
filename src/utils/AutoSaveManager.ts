// AutoSaveManager — wires game events to PersistenceManager.save()
// Owned by Platform/DevOps Engineer
// See .claude/agents/platform-devops.md — Save Triggers section

import { GameEvent } from '../types/game';
import type { SaveData } from '../types/platform';
import { PersistenceManager } from './PersistenceManager';

/** Minimum interval between auto-saves in milliseconds (debounce). */
const SAVE_DEBOUNCE_MS = 1000;

/**
 * AutoSaveManager subscribes to Phaser events and triggers persistence.
 *
 * Events that trigger a save:
 *  - GameEvent.RUN_END — save progression after each run
 *  - GameEvent.DAD_BUCKS_EARNED — save after shop purchases / economy changes
 *  - GameEvent.SCORE_UPDATE — save high-score updates
 *
 * A 1-second debounce prevents rapid sequential writes.
 */
export class AutoSaveManager {
  private readonly persistence: PersistenceManager;
  private readonly getSaveData: () => SaveData;
  private lastSaveTime = 0;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param scene         Any Phaser.Scene whose event bus should be subscribed to.
   *                      In practice this is the global game.events or the active scene.
   * @param persistence   PersistenceManager instance to delegate writes to.
   * @param getSaveData   Callback that assembles the current SaveData snapshot.
   */
  constructor(
    scene: Phaser.Scene,
    persistence: PersistenceManager,
    getSaveData: () => SaveData,
  ) {
    this.persistence = persistence;
    this.getSaveData = getSaveData;

    this.bindEvents(scene);
  }

  /** Subscribe to relevant game events on the given scene. */
  private bindEvents(scene: Phaser.Scene): void {
    const events = scene.events;

    events.on(GameEvent.RUN_END, this.requestSave, this);
    events.on(GameEvent.DAD_BUCKS_EARNED, this.requestSave, this);
    events.on(GameEvent.SCORE_UPDATE, this.requestSave, this);

    // Clean up listeners when the scene shuts down
    events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.off(GameEvent.RUN_END, this.requestSave, this);
      events.off(GameEvent.DAD_BUCKS_EARNED, this.requestSave, this);
      events.off(GameEvent.SCORE_UPDATE, this.requestSave, this);
      this.cancelPending();
    });
  }

  /**
   * Request an auto-save. Debounced to avoid rapid writes.
   * If a save happened less than SAVE_DEBOUNCE_MS ago, the save is deferred.
   */
  private requestSave(): void {
    const now = Date.now();
    const elapsed = now - this.lastSaveTime;

    if (elapsed >= SAVE_DEBOUNCE_MS) {
      this.doSave();
    } else if (this.pendingTimeout === null) {
      const delay = SAVE_DEBOUNCE_MS - elapsed;
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = null;
        this.doSave();
      }, delay);
    }
  }

  /** Execute the actual save. */
  private doSave(): void {
    this.lastSaveTime = Date.now();
    const data = this.getSaveData();
    this.persistence.save(data);
  }

  /** Cancel any pending deferred save. */
  private cancelPending(): void {
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }
}
