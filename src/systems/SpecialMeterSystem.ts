// SpecialMeterSystem — fills on tricks, drains on drop, enables signature tricks
// See PancakeDad_GDD_v02_Browser.md section 3.7

import Phaser from 'phaser';
import { GameEvent } from '../types/game';

const METER_MAX = 100;
const FILL_PER_TRICK = 15;
const DRAIN_ON_DROP = 30;

export class SpecialMeterSystem {
  private scene: Phaser.Scene;
  private meter: number = 0;
  private isFull: boolean = false;
  private fillRate: number = 1.0; // multiplier for upgrades

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.events.on(GameEvent.PANCAKE_DROPPED, () => {
      this.drain(DRAIN_ON_DROP);
    });
  }

  onTrickComplete(): void {
    this.fill(FILL_PER_TRICK * this.fillRate);
  }

  fill(amount: number): void {
    const wasFull = this.isFull;
    this.meter = Phaser.Math.Clamp(this.meter + amount, 0, METER_MAX);
    this.isFull = this.meter >= METER_MAX;

    this.scene.events.emit(GameEvent.SPECIAL_METER_UPDATE, {
      value: this.meter,
      max: METER_MAX,
      isFull: this.isFull,
    });

    if (this.isFull && !wasFull) {
      this.scene.events.emit(GameEvent.SPECIAL_METER_FULL);
    }
  }

  drain(amount: number): void {
    const wasFull = this.isFull;
    this.meter = Phaser.Math.Clamp(this.meter - amount, 0, METER_MAX);
    this.isFull = this.meter >= METER_MAX;

    if (wasFull && !this.isFull) {
      this.scene.events.emit(GameEvent.SPECIAL_METER_DRAIN);
    }

    this.scene.events.emit(GameEvent.SPECIAL_METER_UPDATE, {
      value: this.meter,
      max: METER_MAX,
      isFull: this.isFull,
    });
  }

  getMeter(): number {
    return this.meter;
  }

  getIsFull(): boolean {
    return this.isFull;
  }

  /** Consume the full meter (used when signature trick fires) */
  consume(): void {
    if (!this.isFull) return;
    this.drain(METER_MAX);
  }

  setFillRate(rate: number): void {
    this.fillRate = rate;
  }
}
