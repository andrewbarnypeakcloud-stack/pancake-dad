// Platform entity — static collidable surface (ground hurdle or elevated platform)
// Ground hurdles award points when jumped over; elevated platforms can be stood on

import Phaser from 'phaser';

const HURDLE_COLOR = 0x8b7355;
const ELEVATED_COLOR = 0xa0926b;

export class Platform extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private cleared: boolean = false;
  private elevated: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, isElevated: boolean) {
    super(scene, x, y, width, height, isElevated ? ELEVATED_COLOR : HURDLE_COLOR);
    this.elevated = isElevated;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.body.setSize(width, height);
    this.setDepth(4);
  }

  isElevated(): boolean {
    return this.elevated;
  }

  markCleared(): void {
    this.cleared = true;
  }

  resetCleared(): void {
    this.cleared = false;
  }

  isCleared(): boolean {
    return this.cleared;
  }
}
