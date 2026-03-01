// SlowMotionOverlay — time scale reduction + dark vignette for signature tricks
// See PancakeDad_GDD_v02_Browser.md section 3.4 (signature tricks, 1.5s slow-mo)

import Phaser from 'phaser';
import { UI_COLORS } from '../../types/ui';

/** Default slow-motion parameters from GDD */
const DEFAULT_SLOWMO_DURATION = 1500;
const DEFAULT_TIME_SCALE = 0.3;
const VIGNETTE_ALPHA = 0.4;
const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 300;

/** SlowMotionOverlay — renders a dark vignette and reduces time scale
 *  for signature trick cinematics. Duration is kept brief (1.5s) to avoid
 *  interrupting browser game flow (GDD 3.4). */
export class SlowMotionOverlay {
  private scene: Phaser.Scene;
  private vignetteOverlay: Phaser.GameObjects.Graphics | null = null;
  private isActive: boolean = false;
  private restoreTimeoutId: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Activate slow-motion with vignette overlay.
   *  @param duration - Duration of slow-mo effect in real-time ms. Default 1500ms (GDD spec).
   *  @param timeScale - Time scale factor (0-1). Default 0.3 (30% speed). */
  activate(
    duration: number = DEFAULT_SLOWMO_DURATION,
    timeScale: number = DEFAULT_TIME_SCALE
  ): void {
    if (this.isActive) return;
    this.isActive = true;

    // Create vignette overlay
    this.createVignette();

    // Apply time scale reduction
    this.scene.time.timeScale = timeScale;
    this.scene.physics.world.timeScale = 1 / timeScale;

    // Schedule deactivation after real-time duration
    // Since time.delayedCall uses game time which is now slowed,
    // we calculate the game-time equivalent
    this.restoreTimeoutId = this.scene.time.delayedCall(
      duration * timeScale,
      () => this.deactivate()
    );
  }

  /** Deactivate slow-motion and remove vignette */
  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Cancel pending timeout if manually deactivated
    if (this.restoreTimeoutId) {
      this.restoreTimeoutId.destroy();
      this.restoreTimeoutId = null;
    }

    // Restore time scale
    this.scene.time.timeScale = 1;
    this.scene.physics.world.timeScale = 1;

    // Fade out and destroy vignette
    if (this.vignetteOverlay) {
      this.scene.tweens.add({
        targets: this.vignetteOverlay,
        alpha: 0,
        duration: FADE_OUT_DURATION,
        onComplete: () => {
          if (this.vignetteOverlay) {
            this.vignetteOverlay.destroy();
            this.vignetteOverlay = null;
          }
        },
      });
    }
  }

  /** Check if slow-motion is currently active */
  getIsActive(): boolean {
    return this.isActive;
  }

  private createVignette(): void {
    const { width, height } = this.scene.cameras.main;

    this.vignetteOverlay = this.scene.add.graphics();
    this.vignetteOverlay.setDepth(150);
    this.vignetteOverlay.setScrollFactor(0);

    // Draw a radial vignette — dark edges, clear center
    // Outer rectangle (dark)
    this.vignetteOverlay.fillStyle(UI_COLORS.OVERLAY_DIM, VIGNETTE_ALPHA);
    this.vignetteOverlay.fillRect(0, 0, width, height);

    // Clear center with a gradient-like effect using concentric ellipses
    // Since Graphics doesn't support true gradients, we approximate with
    // multiple semi-transparent ellipses that "punch out" the center
    const centerX = width / 2;
    const centerY = height / 2;
    const steps = 8;

    for (let i = steps; i > 0; i--) {
      const ratio = i / steps;
      const alpha = VIGNETTE_ALPHA * (1 - ratio);
      this.vignetteOverlay.fillStyle(UI_COLORS.OVERLAY_DIM, alpha);
      this.vignetteOverlay.fillEllipse(
        centerX,
        centerY,
        width * 0.6 * ratio,
        height * 0.6 * ratio
      );
    }

    // Start transparent and fade in
    this.vignetteOverlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.vignetteOverlay,
      alpha: 1,
      duration: FADE_IN_DURATION,
    });
  }

  /** Clean up on scene shutdown */
  destroy(): void {
    this.deactivate();
    if (this.vignetteOverlay) {
      this.vignetteOverlay.destroy();
      this.vignetteOverlay = null;
    }
  }
}
