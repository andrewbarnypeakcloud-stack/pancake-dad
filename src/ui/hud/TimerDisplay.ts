// TimerDisplay — top-center 90s countdown, flashes red at <10s
// See PancakeDad_GDD_v02_Browser.md section 3.1

import Phaser from 'phaser';
import { GameEvent, GAME_CONFIG } from '../../types/game';
import { UI_TEXT_STYLES } from '../../types/ui';
import { ResponsiveLayout } from '../ResponsiveLayout';

/** Warning threshold in seconds — timer flashes red below this */
const WARNING_THRESHOLD = 10;

/** HUD element displaying the run countdown timer.
 *  Listens to RUN_TIMER_TICK event. Flashes red when below 10 seconds. */
export class TimerDisplay extends Phaser.GameObjects.Container {
  private timerText: Phaser.GameObjects.Text;
  private layout: ResponsiveLayout;
  private flashTween: Phaser.Tweens.Tween | null = null;
  private isWarning: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.layout = new ResponsiveLayout(scene);

    // Create timer text
    this.timerText = scene.add.text(
      0,
      0,
      this.formatTime(GAME_CONFIG.RUN_DURATION_SECONDS),
      UI_TEXT_STYLES.HUD_TIMER
    );
    this.add(this.timerText);

    // Position using responsive layout
    const hudConfig = this.layout.getHUDConfig();
    this.layout.applyAnchor(this, hudConfig.timerPosition);
    this.timerText.setOrigin(0.5, 0);

    // Set high depth and fix to camera
    this.setDepth(100);
    this.setScrollFactor(0);

    // Add to scene
    scene.add.existing(this);

    // Listen to events
    this.bindEvents();
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.RUN_TIMER_TICK, this.onTimerTick, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onTimerTick(secondsRemaining: number): void {
    this.timerText.setText(this.formatTime(secondsRemaining));

    if (secondsRemaining <= WARNING_THRESHOLD && !this.isWarning) {
      this.isWarning = true;
      this.startWarningFlash();
    }

    if (secondsRemaining <= 0) {
      this.stopWarningFlash();
      this.timerText.setColor('#e74c3c');
    }
  }

  private startWarningFlash(): void {
    this.timerText.setColor('#e74c3c');

    this.flashTween = this.scene.tweens.add({
      targets: this.timerText,
      alpha: 0.3,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private stopWarningFlash(): void {
    if (this.flashTween) {
      this.flashTween.stop();
      this.flashTween = null;
    }
    this.timerText.setAlpha(1);
  }

  private formatTime(seconds: number): string {
    const mins = Phaser.Math.FloorTo(seconds / 60);
    const secs = seconds % 60;
    const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mins}:${paddedSecs}`;
  }

  destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.events.off(GameEvent.RUN_TIMER_TICK, this.onTimerTick, this);
      this.stopWarningFlash();
    }
    super.destroy(fromScene);
  }
}
