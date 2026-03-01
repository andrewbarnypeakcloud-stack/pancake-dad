// InputManager — desktop keyboard + mobile touch input
// See PancakeDad_GDD_v02_Browser.md sections 3.2, 3.3

import Phaser from 'phaser';
import { InputAction } from '../types/game';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private actionKeys!: { J: Phaser.Input.Keyboard.Key; K: Phaser.Input.Keyboard.Key; R: Phaser.Input.Keyboard.Key; ESC: Phaser.Input.Keyboard.Key };

  // Mobile touch state
  private touchActions: Set<InputAction> = new Set();
  private isMobile: boolean;
  private swipeStartY: number = 0;
  private swipeStartX: number = 0;
  private swipeStartTime: number = 0;
  private lastTapTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = !scene.sys.game.device.os.desktop;

    this.setupKeyboard();
    if (this.isMobile) {
      this.setupTouch();
    }
  }

  getActiveActions(): Set<InputAction> {
    if (this.isMobile) {
      return new Set(this.touchActions);
    }
    return this.getKeyboardActions();
  }

  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.actionKeys = {
      J: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      K: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      R: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      ESC: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  private getKeyboardActions(): Set<InputAction> {
    const actions = new Set<InputAction>();

    // Movement
    if (this.cursors.left?.isDown || this.wasd.A.isDown) {
      actions.add(InputAction.MOVE_LEFT);
    }
    if (this.cursors.right?.isDown || this.wasd.D.isDown) {
      actions.add(InputAction.MOVE_RIGHT);
    }

    // Jump
    if (this.cursors.up?.isDown || this.wasd.W.isDown || this.cursors.space?.isDown) {
      actions.add(InputAction.JUMP);
    }

    // Spin (A/D during jump maps to spin when also pressing jump)
    if (this.cursors.up?.isDown || this.wasd.W.isDown || this.cursors.space?.isDown) {
      if (this.cursors.left?.isDown || this.wasd.A.isDown) {
        actions.add(InputAction.SPIN_LEFT);
      }
      if (this.cursors.right?.isDown || this.wasd.D.isDown) {
        actions.add(InputAction.SPIN_RIGHT);
      }
    }

    // Grab
    if (this.actionKeys.J.isDown) {
      actions.add(InputAction.GRAB);
    }

    // Manual
    if (this.actionKeys.K.isDown) {
      actions.add(InputAction.MANUAL);
    }

    // Restart
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.R)) {
      actions.add(InputAction.RESTART);
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.actionKeys.ESC)) {
      actions.add(InputAction.PAUSE);
    }

    return actions;
  }

  private setupTouch(): void {
    const { width } = this.scene.cameras.main;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = pointer.time;

      // Double tap detection for restart
      if (pointer.time - this.lastTapTime < 300) {
        this.touchActions.add(InputAction.RESTART);
      }
      this.lastTapTime = pointer.time;

      // Left/right half movement
      if (pointer.x < width / 2) {
        this.touchActions.add(InputAction.MOVE_LEFT);
      } else {
        this.touchActions.add(InputAction.MOVE_RIGHT);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      // Hold detection for grab
      if (pointer.time - this.swipeStartTime > 200) {
        this.touchActions.add(InputAction.GRAB);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - this.swipeStartX;
      const dy = pointer.y - this.swipeStartY;
      const dt = pointer.time - this.swipeStartTime;

      // Swipe detection
      if (dt < 300) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDy > 50 && dy < 0) {
          // Swipe up → jump
          this.touchActions.add(InputAction.JUMP);
          this.scene.time.delayedCall(100, () => this.touchActions.delete(InputAction.JUMP));
        } else if (absDx > 50) {
          // Swipe left/right → spin
          if (dx < 0) {
            this.touchActions.add(InputAction.SPIN_LEFT);
            this.scene.time.delayedCall(100, () => this.touchActions.delete(InputAction.SPIN_LEFT));
          } else {
            this.touchActions.add(InputAction.SPIN_RIGHT);
            this.scene.time.delayedCall(100, () => this.touchActions.delete(InputAction.SPIN_RIGHT));
          }
        }
      }

      // Clear movement and grab
      this.touchActions.delete(InputAction.MOVE_LEFT);
      this.touchActions.delete(InputAction.MOVE_RIGHT);
      this.touchActions.delete(InputAction.GRAB);
      this.touchActions.delete(InputAction.RESTART);
    });
  }
}
