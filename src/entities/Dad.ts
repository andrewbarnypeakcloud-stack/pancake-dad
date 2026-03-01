// Dad entity — player character with state machine, movement, jump, and physics
// See PancakeDad_GDD_v02_Browser.md sections 3.2, 4

import Phaser from 'phaser';
import { InputAction, DadPhysicsProfile, PlayerState } from '../types/game';

export const DEFAULT_PHYSICS: DadPhysicsProfile = {
  speed: 250,
  jumpForce: 450,
  spinRate: 360,
  airTime: 1.0,
  gravityScale: 0.85,
};

const LANDED_DURATION_MS = 100;
const STUNNED_DURATION_MS = 500;

export class Dad extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private physics: DadPhysicsProfile;
  private currentState: PlayerState = PlayerState.IDLE;
  private stateTimer: number = 0;
  private rotation_: number = 0;
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
    const grounded = this.body.blocked.down || this.body.touching.down;

    // Advance state timer
    this.stateTimer += delta;

    // STUNNED: ignore all input
    if (this.currentState === PlayerState.STUNNED) {
      this.body.setVelocityX(0);
      if (this.stateTimer >= STUNNED_DURATION_MS) {
        this.transitionTo(PlayerState.IDLE);
      }
      return;
    }

    // LANDED: short recovery, exit immediately on move or jump
    if (this.currentState === PlayerState.LANDED) {
      const hasInput = actions.has(InputAction.MOVE_LEFT) ||
        actions.has(InputAction.MOVE_RIGHT) ||
        actions.has(InputAction.JUMP);
      if (hasInput || this.stateTimer >= LANDED_DURATION_MS) {
        this.transitionTo(PlayerState.IDLE);
        // Fall through to process the input this frame
      } else {
        this.body.setVelocityX(0);
        return;
      }
    }

    // Detect landing transition from any airborne state
    const wasAirborne = this.isAirborne();
    if (wasAirborne && grounded) {
      this.rotation_ = 0;
      this.setAngle(0);
      this.scene.events.emit('dad:landed');
      this.transitionTo(PlayerState.LANDED);
      this.body.setVelocityX(0);
      return;
    }

    // Ground states
    if (grounded) {
      // Jump
      if (actions.has(InputAction.JUMP)) {
        this.body.setVelocityY(-this.physics.jumpForce);
        this.transitionTo(PlayerState.JUMPING);
      }
      // Horizontal movement
      else if (actions.has(InputAction.MOVE_LEFT)) {
        this.body.setVelocityX(-speed);
        this.facingRight = false;
        this.setFlipX(true);
        if (this.currentState !== PlayerState.RUNNING) {
          this.transitionTo(PlayerState.RUNNING);
        }
      } else if (actions.has(InputAction.MOVE_RIGHT)) {
        this.body.setVelocityX(speed);
        this.facingRight = true;
        this.setFlipX(false);
        if (this.currentState !== PlayerState.RUNNING) {
          this.transitionTo(PlayerState.RUNNING);
        }
      }
      // Idle
      else {
        this.body.setVelocityX(0);
        if (this.currentState !== PlayerState.IDLE) {
          this.transitionTo(PlayerState.IDLE);
        }
      }
    }
    // Air states
    else {
      // Horizontal air control
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

      // Spin
      const spinDelta = (this.physics.spinRate * delta) / 1000;
      if (actions.has(InputAction.SPIN_LEFT)) {
        this.rotation_ -= spinDelta;
        this.setAngle(this.rotation_);
        if (this.currentState !== PlayerState.SPINNING) {
          this.transitionTo(PlayerState.SPINNING);
        }
      } else if (actions.has(InputAction.SPIN_RIGHT)) {
        this.rotation_ += spinDelta;
        this.setAngle(this.rotation_);
        if (this.currentState !== PlayerState.SPINNING) {
          this.transitionTo(PlayerState.SPINNING);
        }
      }
      // Falling vs Jumping
      else if (this.body.velocity.y > 0) {
        if (this.currentState !== PlayerState.FALLING) {
          this.transitionTo(PlayerState.FALLING);
        }
      } else if (this.currentState !== PlayerState.JUMPING) {
        // Still ascending, stay in jumping if not already
        if (this.currentState !== PlayerState.SPINNING) {
          this.transitionTo(PlayerState.JUMPING);
        }
      }
    }

    // Restart
    if (actions.has(InputAction.RESTART)) {
      this.scene.scene.restart();
    }
  }

  private transitionTo(newState: PlayerState): void {
    this.currentState = newState;
    this.stateTimer = 0;
  }

  // --- Public API (backward-compatible) ---

  isAirborne(): boolean {
    return this.currentState === PlayerState.JUMPING ||
      this.currentState === PlayerState.FALLING ||
      this.currentState === PlayerState.SPINNING;
  }

  getRotationDegrees(): number {
    return this.rotation_;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }

  getState(): PlayerState {
    return this.currentState;
  }

  stun(): void {
    this.transitionTo(PlayerState.STUNNED);
    this.body.setVelocityX(0);
  }

  setPhysicsProfile(profile: DadPhysicsProfile): void {
    this.physics = profile;
    this.body.setGravityY(800 * (profile.gravityScale - 1));
  }
}
