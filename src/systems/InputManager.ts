// InputManager — desktop keyboard + mobile touch input
// See PancakeDad_GDD_v02_Browser.md sections 3.2, 3.3

import Phaser from 'phaser';
import { InputAction } from '../types/game';
import { TouchControls } from '../ui/hud/TouchControls';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private actionKeys!: { R: Phaser.Input.Keyboard.Key; ESC: Phaser.Input.Keyboard.Key };

  private touchControls: TouchControls | null = null;
  private isMobile: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = !scene.sys.game.device.os.desktop;

    this.setupKeyboard();
    if (this.isMobile) {
      this.touchControls = new TouchControls(scene);
    }
  }

  getActiveActions(): Set<InputAction> {
    if (this.isMobile && this.touchControls) {
      return this.touchControls.getActiveActions();
    }
    return this.getKeyboardActions();
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  getTouchControls(): TouchControls | null {
    return this.touchControls;
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
}
