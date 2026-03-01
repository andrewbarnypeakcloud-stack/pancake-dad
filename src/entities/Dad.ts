// Dad entity — player character with movement, jump, and physics
// See PancakeDad_GDD_v02_Browser.md sections 3.2, 4

import Phaser from 'phaser';
import { InputAction, DadPhysicsProfile } from '../types/game';

const DEFAULT_PHYSICS: DadPhysicsProfile = {
  speed: 300,
  jumpForce: 500,
  spinRate: 360,
  airTime: 1.0,
  gravityScale: 1.0,
};

export class Dad extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private physics: DadPhysicsProfile;
  private isGrounded: boolean = true;
  private rotation_: number = 0;
  private isGrabbing: boolean = false;
  private isInManual: boolean = false;
  private facingRight: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, profile?: DadPhysicsProfile) {
    super(scene, x, y, 'dad');
    this.physics = profile ?? DEFAULT_PHYSICS;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);
    this.body.setSize(40, 60);
    this.body.setOffset(4, 4);
    this.body.setGravityY(800 * (this.physics.gravityScale - 1));
    this.setDepth(10);
  }

  handleInput(actions: Set<InputAction>, delta: number): void {
    const speed = this.physics.speed;
    const wasGrounded = this.isGrounded;
    this.isGrounded = this.body.blocked.down || this.body.touching.down;

    // Movement
    if (actions.has(InputAction.MOVE_LEFT)) {
      this.body.setVelocityX(-speed);
      this.facingRight = false;
      this.setFlipX(true);
    } else if (actions.has(InputAction.MOVE_RIGHT)) {
      this.body.setVelocityX(speed);
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.body.setVelocityX(0);
    }

    // Jump
    if (actions.has(InputAction.JUMP) && this.isGrounded) {
      this.body.setVelocityY(-this.physics.jumpForce);
      this.isGrounded = false;
    }

    // Spin (in air only)
    if (!this.isGrounded) {
      const spinDelta = (this.physics.spinRate * delta) / 1000;
      if (actions.has(InputAction.SPIN_LEFT)) {
        this.rotation_ -= spinDelta;
        this.setAngle(this.rotation_);
      } else if (actions.has(InputAction.SPIN_RIGHT)) {
        this.rotation_ += spinDelta;
        this.setAngle(this.rotation_);
      }
    }

    // Reset rotation on land
    if (this.isGrounded && !wasGrounded) {
      this.rotation_ = 0;
      this.setAngle(0);
      this.scene.events.emit('dad:landed');
    }

    // Grab
    this.isGrabbing = !this.isGrounded && actions.has(InputAction.GRAB);

    // Manual
    this.isInManual = this.isGrounded && actions.has(InputAction.MANUAL);

    // Restart
    if (actions.has(InputAction.RESTART)) {
      this.scene.scene.restart();
    }
  }

  isAirborne(): boolean {
    return !this.isGrounded;
  }

  getIsGrabbing(): boolean {
    return this.isGrabbing;
  }

  getIsInManual(): boolean {
    return this.isInManual;
  }

  getRotationDegrees(): number {
    return this.rotation_;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }

  setPhysicsProfile(profile: DadPhysicsProfile): void {
    this.physics = profile;
    this.body.setGravityY(800 * (profile.gravityScale - 1));
  }
}
