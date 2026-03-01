// ScoreDisplay — top-left score counter with scale-pop animation on increase
// See PancakeDad_GDD_v02_Browser.md section 7.2

import Phaser from 'phaser';
import { GameEvent, ComboState } from '../../types/game';
import { UI_TEXT_STYLES } from '../../types/ui';
import { ResponsiveLayout } from '../ResponsiveLayout';

/** HUD element displaying the player's current score.
 *  Listens to SCORE_UPDATE and COMBO_UPDATE events. */
export class ScoreDisplay extends Phaser.GameObjects.Container {
  private scoreText: Phaser.GameObjects.Text;
  private layout: ResponsiveLayout;
  private currentScore: number = 0;
  private popTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.layout = new ResponsiveLayout(scene);

    // Create score text
    this.scoreText = scene.add.text(0, 0, 'SCORE: 0', UI_TEXT_STYLES.HUD_SCORE);
    this.add(this.scoreText);

    // Position using responsive layout
    const hudConfig = this.layout.getHUDConfig();
    this.layout.applyAnchor(this, hudConfig.scorePosition);
    this.scoreText.setOrigin(0, 0);

    // Set high depth so HUD renders above game objects
    this.setDepth(100);
    this.setScrollFactor(0);

    // Add to scene
    scene.add.existing(this);

    // Listen to events
    this.bindEvents();
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.SCORE_UPDATE, this.onScoreUpdate, this);
    this.scene.events.on(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);

    // Clean up on scene shutdown
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onScoreUpdate(newScore: number): void {
    this.updateScore(newScore);
  }

  private onComboUpdate(state: ComboState): void {
    const displayScore = state.bankedScore + state.totalScore;
    this.updateScore(displayScore);
  }

  private updateScore(newScore: number): void {
    if (newScore === this.currentScore) return;

    const increased = newScore > this.currentScore;
    this.currentScore = newScore;
    this.scoreText.setText(`SCORE: ${this.formatScore(newScore)}`);

    if (increased) {
      this.playScalePop();
    }
  }

  private playScalePop(): void {
    // Kill existing tween if running
    if (this.popTween) {
      this.popTween.stop();
    }

    // Reset scale before animating
    this.setScale(1);

    this.popTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 80,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  private formatScore(score: number): string {
    return score.toLocaleString();
  }

  destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.events.off(GameEvent.SCORE_UPDATE, this.onScoreUpdate, this);
      this.scene.events.off(GameEvent.COMBO_UPDATE, this.onComboUpdate, this);
    }
    if (this.popTween) {
      this.popTween.stop();
    }
    super.destroy(fromScene);
  }
}
