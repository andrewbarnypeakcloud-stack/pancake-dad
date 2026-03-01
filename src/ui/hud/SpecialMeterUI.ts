// SpecialMeterUI — top-right horizontal bar, glow/pulse when full
// See PancakeDad_GDD_v02_Browser.md section 3.7

import Phaser from 'phaser';
import { GameEvent } from '../../types/game';
import { UI_COLORS } from '../../types/ui';
import { ResponsiveLayout } from '../ResponsiveLayout';

/** Bar dimensions */
const BAR_WIDTH = 160;
const BAR_HEIGHT = 16;

/** HUD element displaying the special meter as a horizontal bar.
 *  Glows and pulses when full. Listens to SPECIAL_METER_UPDATE and SPECIAL_METER_FULL. */
export class SpecialMeterUI extends Phaser.GameObjects.Container {
  private barBackground: Phaser.GameObjects.Rectangle;
  private barFill: Phaser.GameObjects.Rectangle;
  private barBorder: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private fullLabel: Phaser.GameObjects.Text;
  private layout: ResponsiveLayout;
  private fillTween: Phaser.Tweens.Tween | null = null;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private isFull: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.layout = new ResponsiveLayout(scene);

    // Label "SPECIAL"
    this.label = scene.add.text(0, -14, 'SPECIAL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#cccccc',
    });
    this.label.setOrigin(0.5, 1);
    this.add(this.label);

    // Bar border
    this.barBorder = scene.add.rectangle(0, 0, BAR_WIDTH + 4, BAR_HEIGHT + 4, 0x666666);
    this.barBorder.setOrigin(0.5, 0);
    this.add(this.barBorder);

    // Bar background
    this.barBackground = scene.add.rectangle(0, 2, BAR_WIDTH, BAR_HEIGHT, UI_COLORS.SPECIAL_EMPTY);
    this.barBackground.setOrigin(0.5, 0);
    this.add(this.barBackground);

    // Bar fill — grows from left to right
    this.barFill = scene.add.rectangle(
      -BAR_WIDTH / 2,
      2,
      0,
      BAR_HEIGHT,
      UI_COLORS.PRIMARY
    );
    this.barFill.setOrigin(0, 0);
    this.add(this.barFill);

    // "READY!" label — shown when full
    this.fullLabel = scene.add.text(0, BAR_HEIGHT + 6, 'READY!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '12px',
      color: '#00ff88',
    });
    this.fullLabel.setOrigin(0.5, 0);
    this.fullLabel.setAlpha(0);
    this.add(this.fullLabel);

    // Position using responsive layout
    const hudConfig = this.layout.getHUDConfig();
    this.layout.applyAnchor(this, hudConfig.specialMeterPosition);

    // Set high depth and fix to camera
    this.setDepth(100);
    this.setScrollFactor(0);

    // Add to scene
    scene.add.existing(this);

    // Listen to events
    this.bindEvents();
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.SPECIAL_METER_UPDATE, this.onMeterUpdate, this);
    this.scene.events.on(GameEvent.SPECIAL_METER_FULL, this.onMeterFull, this);
    this.scene.events.on(GameEvent.SPECIAL_METER_DRAIN, this.onMeterDrain, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onMeterUpdate(data: { value: number; max: number; isFull: boolean }): void {
    const fillPercent = Phaser.Math.Clamp(data.value / data.max, 0, 1);
    const targetWidth = BAR_WIDTH * fillPercent;

    if (this.fillTween) {
      this.fillTween.stop();
    }

    this.fillTween = this.scene.tweens.add({
      targets: this.barFill,
      width: targetWidth,
      duration: 150,
      ease: 'Quad.easeOut',
    });

    // Update bar color based on fill level
    if (data.isFull) {
      this.barFill.setFillStyle(UI_COLORS.SPECIAL_FULL);
    } else if (fillPercent > 0.7) {
      this.barFill.setFillStyle(0x88dd44);
    } else if (fillPercent > 0.4) {
      this.barFill.setFillStyle(UI_COLORS.PRIMARY);
    } else {
      this.barFill.setFillStyle(0xddaa33);
    }

    // If meter dropped below full, deactivate glow
    if (!data.isFull && this.isFull) {
      this.deactivateGlow();
    }
  }

  private onMeterFull(): void {
    this.isFull = true;
    this.barFill.setFillStyle(UI_COLORS.SPECIAL_FULL);
    this.fullLabel.setAlpha(1);
    this.activateGlow();
  }

  private onMeterDrain(): void {
    this.deactivateGlow();
  }

  private activateGlow(): void {
    // Pulse the border to indicate full state
    this.barBorder.setFillStyle(UI_COLORS.SPECIAL_FULL);

    this.glowTween = this.scene.tweens.add({
      targets: this.barBorder,
      alpha: 0.5,
      duration: 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Also pulse the "READY!" text
    this.scene.tweens.add({
      targets: this.fullLabel,
      alpha: 0.4,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private deactivateGlow(): void {
    this.isFull = false;
    this.fullLabel.setAlpha(0);
    this.barBorder.setFillStyle(0x666666);
    this.barBorder.setAlpha(1);

    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = null;
    }

    // Stop all tweens on fullLabel
    this.scene.tweens.killTweensOf(this.fullLabel);
  }

  destroy(fromScene?: boolean): void {
    this.scene.events.off(GameEvent.SPECIAL_METER_UPDATE, this.onMeterUpdate, this);
    this.scene.events.off(GameEvent.SPECIAL_METER_FULL, this.onMeterFull, this);
    this.scene.events.off(GameEvent.SPECIAL_METER_DRAIN, this.onMeterDrain, this);
    if (this.fillTween) {
      this.fillTween.stop();
    }
    this.deactivateGlow();
    super.destroy(fromScene);
  }
}
