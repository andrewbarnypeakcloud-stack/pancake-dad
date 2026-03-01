// ScreenEffects — configurable screen shake and flash effects
// See PancakeDad_GDD_v02_Browser.md section 7.2

import Phaser from 'phaser';
import { VisualFeedback } from '../../types/ui';

/** Default shake intensity values */
const DEFAULT_SHAKE_INTENSITY = 0.005;
const DEFAULT_SHAKE_DURATION = 200;

/** Default flash values */
const DEFAULT_FLASH_COLOR = 0xffffff;
const DEFAULT_FLASH_DURATION = 100;

/** Provides screen shake and flash effects.
 *  Implements the VisualFeedback interface so other systems can trigger effects. */
export class ScreenEffects implements VisualFeedback {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Shake the camera with configurable intensity and duration.
   *  @param intensity - Shake intensity as a fraction of camera dimensions (0-1). Default 0.005.
   *  @param duration - Shake duration in milliseconds. Default 200. */
  screenShake(intensity: number = DEFAULT_SHAKE_INTENSITY, duration: number = DEFAULT_SHAKE_DURATION): void {
    const camera = this.scene.cameras.main;
    if (!camera) return;

    // Avoid stacking shakes — reset if already shaking
    camera.shake(duration, intensity);
  }

  /** Flash the screen with a color overlay.
   *  @param color - Flash color (hex number). Default white (0xffffff).
   *  @param duration - Flash duration in milliseconds. Default 100. */
  flash(color: number = DEFAULT_FLASH_COLOR, duration: number = DEFAULT_FLASH_DURATION): void {
    const camera = this.scene.cameras.main;
    if (!camera) return;

    // Decompose hex color to RGB
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    camera.flash(duration, r, g, b);
  }

  /** Trigger slow motion by adjusting Phaser's time scale.
   *  This delegates to SlowMotionOverlay for the full visual treatment.
   *  @param duration - Slow-mo duration in milliseconds.
   *  @param timeScale - Time scale during slow-mo (0-1, where 0.3 = 30% speed). */
  slowMotion(duration: number, timeScale: number): void {
    // Adjust physics and scene time scale
    this.scene.time.timeScale = timeScale;
    this.scene.physics.world.timeScale = 1 / timeScale;

    // Restore after duration (accounting for slowed time)
    this.scene.time.delayedCall(duration * timeScale, () => {
      this.scene.time.timeScale = 1;
      this.scene.physics.world.timeScale = 1;
    });
  }

  /** Combo shake — lighter shake for combo milestones */
  comboShake(comboLevel: number): void {
    const intensity = Phaser.Math.Clamp(0.002 * comboLevel, 0.002, 0.015);
    const duration = Phaser.Math.Clamp(100 + comboLevel * 20, 100, 400);
    this.screenShake(intensity, duration);
  }

  /** Drop shake — short but noticeable shake on pancake drop */
  dropShake(): void {
    this.screenShake(0.008, 150);
    this.flash(0xe74c3c, 80); // Red flash
  }

  /** Perfect catch effect — white flash + light shake */
  perfectCatchEffect(): void {
    this.flash(0xffffff, 60);
    this.screenShake(0.003, 100);
  }

  /** Signature trick effect — strong flash + shake */
  signatureTrickEffect(): void {
    this.flash(0xf5a623, 150);
    this.screenShake(0.012, 300);
  }
}
