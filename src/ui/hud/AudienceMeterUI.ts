// AudienceMeterUI — right-edge vertical bar, 4 visual stages with color transitions
// See PancakeDad_GDD_v02_Browser.md section 3.6

import Phaser from 'phaser';
import { GameEvent, AudienceStage } from '../../types/game';
import { AUDIENCE_STAGE_COLORS, AUDIENCE_STAGE_LABELS, UI_COLORS } from '../../types/ui';
import { ResponsiveLayout } from '../ResponsiveLayout';

/** Bar dimensions */
const BAR_WIDTH = 24;
const BAR_HEIGHT = 200;
const LABEL_OFFSET_Y = -16;

/** HUD element displaying the audience excitement meter as a vertical bar.
 *  Shows 4 visual stages: Watching, Clapping, Excited, Hysteria.
 *  Listens to AUDIENCE_STAGE_CHANGE event. */
export class AudienceMeterUI extends Phaser.GameObjects.Container {
  private barBackground: Phaser.GameObjects.Rectangle;
  private barFill: Phaser.GameObjects.Rectangle;
  private stageLabel: Phaser.GameObjects.Text;
  private titleLabel: Phaser.GameObjects.Text;
  private layout: ResponsiveLayout;
  private currentStage: AudienceStage = AudienceStage.WATCHING;
  private fillTween: Phaser.Tweens.Tween | null = null;
  private stagePulseTween: Phaser.Tweens.Tween | null = null;

  // Stage fill targets (0-1 representing how full the bar should appear per stage)
  private static readonly STAGE_FILL: Record<AudienceStage, number> = {
    [AudienceStage.WATCHING]: 0.1,
    [AudienceStage.CLAPPING]: 0.35,
    [AudienceStage.EXCITED]: 0.65,
    [AudienceStage.HYSTERIA]: 1.0,
  };

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.layout = new ResponsiveLayout(scene);

    // Title label "AUDIENCE"
    this.titleLabel = scene.add.text(0, LABEL_OFFSET_Y, 'CROWD', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '12px',
      color: '#cccccc',
    });
    this.titleLabel.setOrigin(0.5, 1);
    this.add(this.titleLabel);

    // Bar background
    this.barBackground = scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, UI_COLORS.SPECIAL_EMPTY);
    this.barBackground.setOrigin(0.5, 0);
    this.add(this.barBackground);

    // Bar fill — grows from bottom up by positioning and scaling
    this.barFill = scene.add.rectangle(
      0,
      BAR_HEIGHT,
      BAR_WIDTH - 4,
      0,
      AUDIENCE_STAGE_COLORS[AudienceStage.WATCHING]
    );
    this.barFill.setOrigin(0.5, 1);
    this.add(this.barFill);

    // Stage label below bar
    this.stageLabel = scene.add.text(0, BAR_HEIGHT + 8, 'WATCHING', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#888888',
    });
    this.stageLabel.setOrigin(0.5, 0);
    this.add(this.stageLabel);

    // Draw stage threshold markers
    this.drawStageMarkers(scene);

    // Position using responsive layout
    const hudConfig = this.layout.getHUDConfig();
    this.layout.applyAnchor(this, hudConfig.audienceMeterPosition);

    // Set high depth and fix to camera
    this.setDepth(100);
    this.setScrollFactor(0);

    // Add to scene
    scene.add.existing(this);

    // Listen to events
    this.bindEvents();

    // Set initial fill
    this.setFillForStage(AudienceStage.WATCHING, false);
  }

  private drawStageMarkers(scene: Phaser.Scene): void {
    // Draw horizontal lines at each stage threshold
    const thresholds = [0.25, 0.5, 0.8];
    for (const threshold of thresholds) {
      const y = BAR_HEIGHT * (1 - threshold);
      const marker = scene.add.rectangle(0, y, BAR_WIDTH + 4, 1, 0x666666);
      marker.setOrigin(0.5, 0.5);
      this.add(marker);
    }
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.AUDIENCE_STAGE_CHANGE, this.onStageChange, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onStageChange(stage: AudienceStage): void {
    const previousStage = this.currentStage;
    this.currentStage = stage;

    // Update label
    this.stageLabel.setText(AUDIENCE_STAGE_LABELS[stage]);

    // Animate fill and color
    this.setFillForStage(stage, true);

    // Pulse on stage up (not on decay)
    const stageOrder = [
      AudienceStage.WATCHING,
      AudienceStage.CLAPPING,
      AudienceStage.EXCITED,
      AudienceStage.HYSTERIA,
    ];
    if (stageOrder.indexOf(stage) > stageOrder.indexOf(previousStage)) {
      this.playStageUpPulse();
    }

    // Special Hysteria effect
    if (stage === AudienceStage.HYSTERIA) {
      this.activateHysteria();
    } else {
      this.stopHysteriaPulse();
    }
  }

  private setFillForStage(stage: AudienceStage, animate: boolean): void {
    const targetFill = AudienceMeterUI.STAGE_FILL[stage];
    const targetHeight = BAR_HEIGHT * targetFill;
    const targetColor = AUDIENCE_STAGE_COLORS[stage];

    this.barFill.setFillStyle(targetColor);
    this.stageLabel.setColor(`#${targetColor.toString(16).padStart(6, '0')}`);

    if (animate) {
      if (this.fillTween) {
        this.fillTween.stop();
      }
      this.fillTween = this.scene.tweens.add({
        targets: this.barFill,
        height: targetHeight,
        duration: 400,
        ease: 'Quad.easeOut',
      });
    } else {
      this.barFill.height = targetHeight;
    }
  }

  private playStageUpPulse(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.05,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  private activateHysteria(): void {
    this.stagePulseTween = this.scene.tweens.add({
      targets: this.barFill,
      alpha: 0.7,
      duration: 250,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private stopHysteriaPulse(): void {
    if (this.stagePulseTween) {
      this.stagePulseTween.stop();
      this.stagePulseTween = null;
      this.barFill.setAlpha(1);
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.events.off(GameEvent.AUDIENCE_STAGE_CHANGE, this.onStageChange, this);
      if (this.fillTween) {
        this.fillTween.stop();
      }
      this.stopHysteriaPulse();
    }
    super.destroy(fromScene);
  }
}
