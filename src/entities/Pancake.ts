// Pancake entity — arc trajectory, catch/drop detection
// See PancakeDad_GDD_v02_Browser.md section 3.1, 3.4

import Phaser from 'phaser';
import { GameEvent } from '../types/game';

export class Pancake extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private airborne: boolean = false;
  private caught: boolean = true;
  private falling: boolean = false;
  private spinSpeed: number = 0;
  private ownerX: number;
  private ownerY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pancake');
    this.ownerX = x;
    this.ownerY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);
    this.body.setSize(28, 6);
    this.body.setAllowGravity(false);
    this.setDepth(11);

    // Start on the pan
    this.resetToPan(x, y - 40);
  }

  update(_time: number, _delta: number): void {
    if (this.airborne) {
      // Rotate while airborne
      this.angle += this.spinSpeed;

      // Track if falling
      this.falling = this.body.velocity.y > 0;
    }
  }

  flip(velocityX: number, velocityY: number, spin: number): void {
    if (this.airborne) return;

    this.airborne = true;
    this.caught = false;
    this.falling = false;
    this.spinSpeed = spin;

    this.body.setAllowGravity(true);
    this.body.setVelocity(velocityX, velocityY);

    this.scene.events.emit(GameEvent.PANCAKE_FLIPPED);
  }

  onCaught(): void {
    this.airborne = false;
    this.caught = true;
    this.falling = false;
    this.spinSpeed = 0;
    this.angle = 0;

    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
  }

  onHitFloor(): void {
    if (!this.airborne) return;

    this.airborne = false;
    this.caught = false;
    this.falling = false;
    this.spinSpeed = 0;

    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);

    this.scene.events.emit(GameEvent.PANCAKE_DROPPED);

    // Reset back to pan after a delay
    this.scene.time.delayedCall(500, () => {
      this.resetToPan(this.ownerX, this.ownerY - 40);
    });
  }

  resetToPan(x: number, y: number): void {
    this.setPosition(x, y);
    this.angle = 0;
    this.airborne = false;
    this.caught = true;
    this.falling = false;
    this.spinSpeed = 0;
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
  }

  isAirborne(): boolean {
    return this.airborne;
  }

  isCaught(): boolean {
    return this.caught;
  }

  isFalling(): boolean {
    return this.falling;
  }

  getPancakeBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.body.halfWidth,
      this.y - this.body.halfHeight,
      this.body.width,
      this.body.height
    );
  }
}
