// Pan entity — catch zone with configurable radius
// See PancakeDad_GDD_v02_Browser.md section 5.2

import Phaser from 'phaser';
import { Dad } from './Dad';

const DEFAULT_CATCH_RADIUS = 40;

export class Pan extends Phaser.GameObjects.Sprite {
  private dad: Dad;
  private catchRadius: number;
  private offsetX: number = 36;
  private offsetY: number = -28;

  constructor(scene: Phaser.Scene, dad: Dad, catchRadius?: number) {
    super(scene, dad.x + 36, dad.y - 28, 'pan');
    this.dad = dad;
    this.catchRadius = catchRadius ?? DEFAULT_CATCH_RADIUS;

    scene.add.existing(this);
    this.setDepth(9);
  }

  update(): void {
    // Follow dad, flip side based on facing direction
    const xOff = this.dad.isFacingRight() ? this.offsetX : -this.offsetX;
    this.setPosition(this.dad.x + xOff, this.dad.y + this.offsetY);
    this.setFlipX(!this.dad.isFacingRight());
  }

  getCatchZone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.catchRadius,
      this.y - this.catchRadius / 2,
      this.catchRadius * 2,
      this.catchRadius
    );
  }

  setCatchRadius(radius: number): void {
    this.catchRadius = radius;
  }

  getCatchRadius(): number {
    return this.catchRadius;
  }
}
