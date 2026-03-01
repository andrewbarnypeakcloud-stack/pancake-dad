// TouchControls — virtual on-screen buttons for mobile gameplay
// Replaces broken gesture-based input with reliable button-based controls
// See PancakeDad_GDD_v02_Browser.md section 3.3

import Phaser from 'phaser';
import { InputAction } from '../../types/game';
import { UI_COLORS } from '../../types/ui';

const BUTTON_IDLE_ALPHA = 0.3;
const BUTTON_ACTIVE_ALPHA = 0.55;
const DPAD_RADIUS = 36;
const JUMP_RADIUS = 44;
const ACTION_RADIUS = 30;
const PAUSE_SIZE = 36;
const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Arial Black, Arial, sans-serif',
  fontSize: '14px',
  color: '#ffffff',
};

export class TouchControls extends Phaser.GameObjects.Container {
  private activeActions: Set<InputAction> = new Set();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Enable multi-touch (Phaser defaults to 1 pointer)
    scene.input.addPointer(2);

    const { width, height } = scene.cameras.main;

    this.createDpad(width, height);
    this.createJumpButton(width, height);
    this.createGrabButton(width, height);
    this.createManualButton(width, height);
    this.createPauseButton(width, height);

    this.setDepth(200);
    this.setScrollFactor(0);
    scene.add.existing(this);

    // Clean up on scene shutdown
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  getActiveActions(): Set<InputAction> {
    const actions = new Set(this.activeActions);

    // Mirror keyboard behavior: move + jump = spin
    if (actions.has(InputAction.JUMP)) {
      if (actions.has(InputAction.MOVE_LEFT)) {
        actions.add(InputAction.SPIN_LEFT);
      }
      if (actions.has(InputAction.MOVE_RIGHT)) {
        actions.add(InputAction.SPIN_RIGHT);
      }
    }

    return actions;
  }

  show(): void {
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }

  // --- Button creation ---

  private createDpad(_width: number, height: number): void {
    const baseY = height - 70;
    const leftX = 70;
    const rightX = leftX + DPAD_RADIUS * 2 + 20;

    this.createHoldButton(leftX, baseY, DPAD_RADIUS, '<', InputAction.MOVE_LEFT);
    this.createHoldButton(rightX, baseY, DPAD_RADIUS, '>', InputAction.MOVE_RIGHT);
  }

  private createJumpButton(width: number, height: number): void {
    const x = width - 90;
    const y = height - 90;

    this.createTapButton(x, y, JUMP_RADIUS, 'JUMP', InputAction.JUMP, UI_COLORS.PRIMARY);
  }

  private createGrabButton(width: number, height: number): void {
    const x = width - 180;
    const y = height - 70;

    this.createHoldButton(x, y, ACTION_RADIUS, 'GRAB', InputAction.GRAB, UI_COLORS.COMBO_FIRE);
  }

  private createManualButton(width: number, height: number): void {
    const x = width - 180;
    const y = height - 140;

    this.createHoldButton(x, y, ACTION_RADIUS, 'MAN', InputAction.MANUAL, UI_COLORS.SUCCESS);
  }

  private createPauseButton(width: number, _height: number): void {
    const x = width - 30;
    const y = 30;

    const btn = this.scene.add.rectangle(x, y, PAUSE_SIZE, PAUSE_SIZE, 0xffffff, BUTTON_IDLE_ALPHA);
    btn.setInteractive();
    btn.setScrollFactor(0);
    this.add(btn);

    const label = this.scene.add.text(x, y, '||', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    label.setAlpha(BUTTON_IDLE_ALPHA + 0.2);
    this.add(label);

    // Pause goes through scene event, not InputAction (avoids toggle-every-frame)
    btn.on('pointerdown', () => {
      btn.setAlpha(BUTTON_ACTIVE_ALPHA);
      label.setAlpha(BUTTON_ACTIVE_ALPHA + 0.2);
      this.scene.events.emit('touch:pause');
    });
    btn.on('pointerup', () => {
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      label.setAlpha(BUTTON_IDLE_ALPHA + 0.2);
    });
    btn.on('pointerout', () => {
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      label.setAlpha(BUTTON_IDLE_ALPHA + 0.2);
    });
  }

  /** Hold button: action active while finger is down, clears on release */
  private createHoldButton(
    x: number, y: number, radius: number,
    label: string, action: InputAction, tint?: number
  ): Phaser.GameObjects.Arc {
    const color = tint ?? 0xffffff;
    const btn = this.scene.add.circle(x, y, radius, color, BUTTON_IDLE_ALPHA);
    btn.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
    btn.setScrollFactor(0);
    this.add(btn);

    const text = this.scene.add.text(x, y, label, LABEL_STYLE).setOrigin(0.5, 0.5).setScrollFactor(0);
    text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    this.add(text);

    btn.on('pointerdown', () => {
      this.activeActions.add(action);
      btn.setAlpha(BUTTON_ACTIVE_ALPHA);
      text.setAlpha(BUTTON_ACTIVE_ALPHA + 0.3);
    });
    btn.on('pointerup', () => {
      this.activeActions.delete(action);
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    });
    btn.on('pointerout', () => {
      this.activeActions.delete(action);
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    });

    return btn;
  }

  /** Tap button: action fires on press, auto-clears after a duration */
  private createTapButton(
    x: number, y: number, radius: number,
    label: string, action: InputAction, tint?: number
  ): Phaser.GameObjects.Arc {
    const color = tint ?? 0xffffff;
    const btn = this.scene.add.circle(x, y, radius, color, BUTTON_IDLE_ALPHA);
    btn.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
    btn.setScrollFactor(0);
    this.add(btn);

    const text = this.scene.add.text(x, y, label, LABEL_STYLE).setOrigin(0.5, 0.5).setScrollFactor(0);
    text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    this.add(text);

    btn.on('pointerdown', () => {
      this.activeActions.add(action);
      btn.setAlpha(BUTTON_ACTIVE_ALPHA);
      text.setAlpha(BUTTON_ACTIVE_ALPHA + 0.3);
    });
    btn.on('pointerup', () => {
      this.activeActions.delete(action);
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    });
    btn.on('pointerout', () => {
      this.activeActions.delete(action);
      btn.setAlpha(BUTTON_IDLE_ALPHA);
      text.setAlpha(BUTTON_IDLE_ALPHA + 0.3);
    });

    return btn;
  }
}
