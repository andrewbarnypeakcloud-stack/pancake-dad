// ComboDisplay — center screen combo chain + multiplier, pulses at x5+ On Fire
// See PancakeDad_GDD_v02_Browser.md section 3.5

import Phaser from 'phaser';
import { GameEvent, ComboState } from '../../types/game';
import { UI_TEXT_STYLES } from '../../types/ui';
import { ResponsiveLayout } from '../ResponsiveLayout';

/** HUD element displaying the active combo chain and multiplier.
 *  Scales with chain level. Pulses in red at x5+ "On Fire" state.
 *  Listens to COMBO_UPDATE and COMBO_BREAK events. */
export class ComboDisplay extends Phaser.GameObjects.Container {
  private multiplierText: Phaser.GameObjects.Text;
  private chainText: Phaser.GameObjects.Text;
  private onFireText: Phaser.GameObjects.Text;
  private layout: ResponsiveLayout;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private popTween: Phaser.Tweens.Tween | null = null;
  private isOnFire: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.layout = new ResponsiveLayout(scene);

    // Multiplier text — large, center
    this.multiplierText = scene.add.text(0, 0, '', UI_TEXT_STYLES.HUD_COMBO);
    this.multiplierText.setOrigin(0.5, 0.5);
    this.add(this.multiplierText);

    // Chain count text — smaller, below multiplier
    this.chainText = scene.add.text(0, 36, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#cccccc',
    });
    this.chainText.setOrigin(0.5, 0);
    this.add(this.chainText);

    // On Fire indicator — below chain text
    this.onFireText = scene.add.text(0, 60, 'ON FIRE!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#e74c3c',
    });
    this.onFireText.setOrigin(0.5, 0);
    this.onFireText.setAlpha(0);
    this.add(this.onFireText);

    // Position using responsive layout
    const hudConfig = this.layout.getHUDConfig();
    this.layout.applyAnchor(this, hudConfig.comboPosition);

    // Set high depth and fix to camera
    this.setDepth(100);
    this.setScrollFactor(0);

    // Start hidden
    this.setAlpha(0);

    // Add to scene
    scene.add.existing(this);

    // Listen to events
    this.bindEvents();
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);
    this.scene.events.on(GameEvent.COMBO_BREAK, this.onComboBreak, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onComboUpdate(state: ComboState): void {
    if (state.chain <= 0) {
      // No active combo — hide the display
      this.setAlpha(0);
      this.stopPulse();
      this.isOnFire = false;
      return;
    }

    // Show the display
    this.setAlpha(1);

    // Update multiplier text
    this.multiplierText.setText(`x${state.multiplier}`);

    // Update chain text
    this.chainText.setText(`${state.chain} chain | ${state.totalScore.toLocaleString()} pts`);

    // Scale the display based on chain level
    const scaleBoost = Phaser.Math.Clamp(1 + (state.chain - 1) * 0.05, 1, 1.5);
    this.setScale(scaleBoost);

    // Handle On Fire state
    if (state.onFire && !this.isOnFire) {
      this.activateOnFire();
    } else if (!state.onFire && this.isOnFire) {
      this.deactivateOnFire();
    }

    // Pop animation on each combo update
    this.playPop();
  }

  private onComboBreak(): void {
    // Flash "DROPPED!" briefly
    this.setAlpha(1);
    this.multiplierText.setText('DROPPED!');
    this.multiplierText.setColor('#e74c3c');
    this.chainText.setText('');
    this.onFireText.setAlpha(0);
    this.stopPulse();
    this.isOnFire = false;

    // Shake the container
    this.scene.tweens.add({
      targets: this,
      x: this.x + 8,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Fade out after shake
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 600,
          delay: 400,
          onComplete: () => {
            this.multiplierText.setColor(UI_TEXT_STYLES.HUD_COMBO.color);
          },
        });
      },
    });
  }

  private activateOnFire(): void {
    this.isOnFire = true;
    this.multiplierText.setColor('#e74c3c');
    this.onFireText.setAlpha(1);

    // Start pulsing
    this.pulseTween = this.scene.tweens.add({
      targets: [this.multiplierText, this.onFireText],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private deactivateOnFire(): void {
    this.isOnFire = false;
    this.multiplierText.setColor(UI_TEXT_STYLES.HUD_COMBO.color);
    this.onFireText.setAlpha(0);
    this.stopPulse();
  }

  private stopPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
      this.multiplierText.setScale(1);
      this.onFireText.setScale(1);
    }
  }

  private playPop(): void {
    if (this.popTween) {
      this.popTween.stop();
    }

    // Quick scale pop on the multiplier text
    this.multiplierText.setScale(1.2);
    this.popTween = this.scene.tweens.add({
      targets: this.multiplierText,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  destroy(fromScene?: boolean): void {
    this.scene.events.off(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);
    this.scene.events.off(GameEvent.COMBO_BREAK, this.onComboBreak, this);
    this.stopPulse();
    if (this.popTween) {
      this.popTween.stop();
    }
    super.destroy(fromScene);
  }
}
