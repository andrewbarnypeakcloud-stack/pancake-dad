// AudienceMeterSystem — 4 stages with decay, Hysteria x2 bonus
// See PancakeDad_GDD_v02_Browser.md section 3.6

import Phaser from 'phaser';
import { GameEvent, AudienceStage, GAME_CONFIG } from '../types/game';

const STAGE_THRESHOLDS = {
  [AudienceStage.WATCHING]: 0,
  [AudienceStage.CLAPPING]: 25,
  [AudienceStage.EXCITED]: 50,
  [AudienceStage.HYSTERIA]: 80,
} as const;

const METER_MAX = 100;
const FILL_PER_TRICK = 12;
const DECAY_PER_SECOND = 1.2;

export class AudienceMeterSystem {
  private scene: Phaser.Scene;
  private meter: number = 0;
  private currentStage: AudienceStage = AudienceStage.WATCHING;
  private hysteriaActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.events.on(GameEvent.PANCAKE_DROPPED, () => {
      this.meter = Phaser.Math.Clamp(this.meter - 10, 0, METER_MAX);
      this.updateStage();
    });
  }

  onTrickComplete(): void {
    this.meter = Phaser.Math.Clamp(this.meter + FILL_PER_TRICK, 0, METER_MAX);
    this.updateStage();
  }

  update(delta: number): void {
    // Decay over time
    const decay = (DECAY_PER_SECOND * delta) / 1000;
    this.meter = Phaser.Math.Clamp(this.meter - decay, 0, METER_MAX);
    this.updateStage();
  }

  getStage(): AudienceStage {
    return this.currentStage;
  }

  getMeter(): number {
    return this.meter;
  }

  isHysteriaActive(): boolean {
    return this.hysteriaActive;
  }

  getMultiplier(): number {
    return this.hysteriaActive ? GAME_CONFIG.HYSTERIA_MULTIPLIER : 1;
  }

  private updateStage(): void {
    let newStage = AudienceStage.WATCHING;

    if (this.meter >= STAGE_THRESHOLDS[AudienceStage.HYSTERIA]) {
      newStage = AudienceStage.HYSTERIA;
    } else if (this.meter >= STAGE_THRESHOLDS[AudienceStage.EXCITED]) {
      newStage = AudienceStage.EXCITED;
    } else if (this.meter >= STAGE_THRESHOLDS[AudienceStage.CLAPPING]) {
      newStage = AudienceStage.CLAPPING;
    }

    if (newStage !== this.currentStage) {
      this.currentStage = newStage;
      this.hysteriaActive = newStage === AudienceStage.HYSTERIA;
      this.scene.events.emit(GameEvent.AUDIENCE_STAGE_CHANGE, this.currentStage);
    }
  }
}
