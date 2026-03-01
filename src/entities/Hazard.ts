// Hazard entity — patrols a floor section and knocks pancake loose on overlap
// See PancakeDad_GDD_v02_Browser.md section 6

import Phaser from 'phaser';
import { GameEvent } from '../types/game';
import type { HazardDefinition } from '../types/content';
import type { Dad } from './Dad';

/** Map hazard definition IDs to VoxelTextureGenerator texture keys */
const HAZARD_TEXTURE_MAP: Record<string, string> = {
  'cat-on-counter': 'hazard-cat',
  'toddler-underfoot': 'hazard-toys',
  'dog-begging': 'hazard-puddle',
  'kids-everywhere': 'hazard-decorations',
  'live-studio-crowd': 'hazard-cables',
};

/** Patrol speed in pixels per second */
const PATROL_SPEED = 50;

/** Cooldown between consecutive hits in milliseconds */
const HIT_COOLDOWN_MS = 1500;

/** Duration of the red tint flash in milliseconds */
const TINT_DURATION_MS = 200;

export class Hazard extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly hazardDef: HazardDefinition;
  private patrolMin: number;
  private patrolMax: number;
  private movingRight: boolean = true;
  private lastHitTime: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    hazardDef: HazardDefinition
  ) {
    super(scene, x, y, HAZARD_TEXTURE_MAP[hazardDef.id] ?? `hazard-${hazardDef.id}`);
    this.hazardDef = hazardDef;

    // Default patrol bounds centered on spawn position
    this.patrolMin = x - 100;
    this.patrolMax = x + 100;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body setup for overlap detection
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    this.body.setSize(32, 32);
    this.setDepth(5);

    // Start moving right
    this.body.setVelocityX(PATROL_SPEED);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Patrol logic: reverse direction at bounds
    if (this.movingRight && this.x >= this.patrolMax) {
      this.movingRight = false;
      this.body.setVelocityX(-PATROL_SPEED);
      this.setFlipX(true);
    } else if (!this.movingRight && this.x <= this.patrolMin) {
      this.movingRight = true;
      this.body.setVelocityX(PATROL_SPEED);
      this.setFlipX(false);
    }
  }

  /**
   * Set the horizontal patrol boundaries.
   * The hazard will move back and forth between min and max.
   */
  setPatrolBounds(min: number, max: number): void {
    this.patrolMin = min;
    this.patrolMax = max;

    // Clamp current position inside new bounds
    if (this.x < this.patrolMin) {
      this.setX(this.patrolMin);
      this.movingRight = true;
      this.body.setVelocityX(PATROL_SPEED);
    } else if (this.x > this.patrolMax) {
      this.setX(this.patrolMax);
      this.movingRight = false;
      this.body.setVelocityX(-PATROL_SPEED);
    }
  }

  /**
   * Called when the hazard overlaps with the Dad entity.
   * Knocks the pancake loose and applies a brief red tint stun indicator.
   * Respects a 1.5-second cooldown to prevent rapid repeated hits.
   */
  onDadOverlap(dad: Dad): void {
    const now = this.scene.time.now;

    // Enforce cooldown
    if (now - this.lastHitTime < HIT_COOLDOWN_MS) {
      return;
    }
    this.lastHitTime = now;

    // Emit pancake drop event
    this.scene.events.emit(GameEvent.PANCAKE_DROPPED);

    // Flash the dad red to indicate a hit
    dad.setTint(0xff0000);
    this.scene.time.delayedCall(TINT_DURATION_MS, () => {
      dad.clearTint();
    });
  }

  /** Returns the hazard definition this entity was created from */
  getDefinition(): HazardDefinition {
    return this.hazardDef;
  }
}
