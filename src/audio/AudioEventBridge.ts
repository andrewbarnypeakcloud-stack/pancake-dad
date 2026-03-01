// AudioEventBridge — subscribes to GameEvents and routes them to audio playback
// See .claude/agents/audio-engineer.md for event mapping specification
// See PancakeDad_GDD_v02_Browser.md sections 7.3, 7.4
//
// The bridge pattern keeps audio fully decoupled from game logic.
// Game Engineer emits events; Audio Engineer listens and responds.

import {
  GameEvent,
  AudienceStage,
  TrickResult,
  ComboState,
  AUDIENCE_STAGE_SFX,
} from '../types';
import { AudioManager } from './AudioManager';

/**
 * AudioEventBridge connects Phaser scene events to the AudioManager.
 * It subscribes to relevant GameEvent emissions and triggers the
 * appropriate SFX or music actions.
 *
 * Usage (in a Phaser Scene):
 *   const bridge = new AudioEventBridge(this, audioManager);
 *   // bridge auto-subscribes to all GameEvents
 *   // call bridge.destroy() on scene shutdown
 */
export class AudioEventBridge {
  private readonly scene: Phaser.Scene;
  private readonly audioManager: AudioManager;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;

    this.bindEvents();
  }

  /** Subscribe to all relevant GameEvents on the scene event emitter */
  private bindEvents(): void {
    const events = this.scene.events;

    // ── Pancake events ──

    events.on(GameEvent.PANCAKE_FLIPPED, this.onPancakeFlipped, this);
    events.on(GameEvent.PANCAKE_CAUGHT, this.onPancakeCaught, this);
    events.on(GameEvent.PANCAKE_DROPPED, this.onPancakeDropped, this);

    // ── Trick events ──

    events.on(GameEvent.TRICK_COMPLETE, this.onTrickComplete, this);

    // ── Combo events ──

    events.on(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);
    events.on(GameEvent.COMBO_BREAK, this.onComboBreak, this);

    // ── On Fire state ──

    events.on(GameEvent.ON_FIRE_START, this.onFireStart, this);

    // ── Audience meter ──

    events.on(GameEvent.AUDIENCE_STAGE_CHANGE, this.onAudienceStageChange, this);

    // ── Special meter ──

    events.on(GameEvent.SPECIAL_METER_FULL, this.onSpecialMeterFull, this);

    // ── Run lifecycle ──

    events.on(GameEvent.RUN_START, this.onRunStart, this);
    events.on(GameEvent.RUN_END, this.onRunEnd, this);
    events.on(GameEvent.RUN_PAUSED, this.onRunPaused, this);
    events.on(GameEvent.RUN_RESUMED, this.onRunResumed, this);

    // ── Level events ──

    events.on(GameEvent.LEVEL_LOADED, this.onLevelLoaded, this);

    // ── Cleanup on scene shutdown ──

    events.once('shutdown', this.destroy, this);
    events.once('destroy', this.destroy, this);
  }

  // ──────────────────────────────────────────────
  // Event handlers
  // ──────────────────────────────────────────────

  /** PANCAKE_FLIPPED -> flip_whoosh (with pitch variation) */
  private onPancakeFlipped(): void {
    this.audioManager.playSFX('flip_whoosh');
  }

  /** PANCAKE_CAUGHT -> sizzle_pop */
  private onPancakeCaught(): void {
    this.audioManager.playSFX('sizzle_pop');
  }

  /** PANCAKE_DROPPED -> sad_trombone */
  private onPancakeDropped(): void {
    this.audioManager.playSFX('sad_trombone');
  }

  /**
   * TRICK_COMPLETE -> play trick SFX with pitch based on trick result.
   * The TrickResult carries trick metadata used for pitch variation.
   */
  private onTrickComplete(result: TrickResult): void {
    // Use the trick's base score as a rough proxy for spin speed/complexity
    // Higher score tricks get higher pitch variation
    const complexityFactor = result.trick.baseScore / 100;
    this.audioManager.playTrickSFX(complexityFactor);
  }

  /** COMBO_UPDATE -> combo ding with rising pitch per multiplier */
  private onComboUpdate(state: ComboState): void {
    this.audioManager.playComboDing(state.multiplier);
  }

  /** COMBO_BREAK -> sad_trombone */
  private onComboBreak(): void {
    this.audioManager.playSFX('combo_break');
  }

  /** ON_FIRE_START -> fire_ignite + crowd cheer */
  private onFireStart(): void {
    this.audioManager.playSFX('fire_ignite');
    this.audioManager.playSFX('crowd_cheer');
  }

  /** AUDIENCE_STAGE_CHANGE -> appropriate crowd sound based on stage */
  private onAudienceStageChange(stage: AudienceStage): void {
    const sfxKey = AUDIENCE_STAGE_SFX[stage];
    if (sfxKey) {
      this.audioManager.playSFX(sfxKey);
    }
  }

  /** SPECIAL_METER_FULL -> signature_sting / special_ready */
  private onSpecialMeterFull(): void {
    this.audioManager.playSFX('special_ready');
  }

  /** RUN_START -> level music is already started by LEVEL_LOADED; nothing extra needed */
  private onRunStart(): void {
    // Music already playing from LEVEL_LOADED.
    // This handler exists for potential future SFX (e.g., a starting bell).
  }

  /** RUN_END -> fade out music */
  private onRunEnd(): void {
    this.audioManager.stopMusic(2000);
  }

  /** RUN_PAUSED -> pause music */
  private onRunPaused(): void {
    this.audioManager.pauseMusic();
  }

  /** RUN_RESUMED -> resume music */
  private onRunResumed(): void {
    this.audioManager.resumeMusic();
  }

  /**
   * LEVEL_LOADED -> start the level's music track.
   * Expects the event data to include the level ID string.
   */
  private onLevelLoaded(levelId: string): void {
    this.audioManager.playLevelMusic(levelId);
  }

  // ──────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────

  /** Remove all event subscriptions */
  destroy(): void {
    const events = this.scene.events;

    events.off(GameEvent.PANCAKE_FLIPPED, this.onPancakeFlipped, this);
    events.off(GameEvent.PANCAKE_CAUGHT, this.onPancakeCaught, this);
    events.off(GameEvent.PANCAKE_DROPPED, this.onPancakeDropped, this);
    events.off(GameEvent.TRICK_COMPLETE, this.onTrickComplete, this);
    events.off(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);
    events.off(GameEvent.COMBO_BREAK, this.onComboBreak, this);
    events.off(GameEvent.ON_FIRE_START, this.onFireStart, this);
    events.off(GameEvent.AUDIENCE_STAGE_CHANGE, this.onAudienceStageChange, this);
    events.off(GameEvent.SPECIAL_METER_FULL, this.onSpecialMeterFull, this);
    events.off(GameEvent.RUN_START, this.onRunStart, this);
    events.off(GameEvent.RUN_END, this.onRunEnd, this);
    events.off(GameEvent.RUN_PAUSED, this.onRunPaused, this);
    events.off(GameEvent.RUN_RESUMED, this.onRunResumed, this);
    events.off(GameEvent.LEVEL_LOADED, this.onLevelLoaded, this);
  }
}
