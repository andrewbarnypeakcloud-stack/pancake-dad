// GameOverScreen — score breakdown, Dad Bucks earned, share/restart/menu
// See PancakeDad_GDD_v02_Browser.md section 8.4

import Phaser from 'phaser';
import { SCENE_KEYS } from '../../types/game';
import { UI_COLORS, UI_TEXT_STYLES, ShareCardData } from '../../types/ui';
import { ShareCardRenderer } from '../sharecard/ShareCardRenderer';

/** Data passed to the GameOverScreen from the GameScene */
export interface GameOverData {
  readonly score: number;
  readonly comboMax?: number;
  readonly tricksLanded?: number;
  readonly dadName?: string;
  readonly levelName?: string;
}

/** Game over screen — shows score breakdown, Dad Bucks earned,
 *  and share/restart/menu buttons. New high score celebration if applicable. */
export class GameOverScreen extends Phaser.GameObjects.Container {
  private finalScore: number;
  private isNewHigh: boolean;
  private dadBucksEarned: number;
  private gameOverData: GameOverData;

  constructor(scene: Phaser.Scene, gameOverData: GameOverData) {
    super(scene, 0, 0);

    this.gameOverData = gameOverData;
    const data = gameOverData;
    this.finalScore = data.score;
    const highScore = scene.registry.get('highScore') ?? 0;
    this.isNewHigh = this.finalScore >= highScore && this.finalScore > 0;
    this.dadBucksEarned = Phaser.Math.FloorTo(this.finalScore / 10);

    const { width, height } = scene.cameras.main;

    // ── "GAME OVER" Title ──
    const title = scene.add.text(width / 2, height * 0.1, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5, 0.5);
    this.add(title);

    // Title entrance
    title.setScale(0);
    scene.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // ── Score Display ──
    const scoreLabel = scene.add.text(width / 2, height * 0.22, 'FINAL SCORE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#888888',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    this.add(scoreLabel);

    const scoreText = scene.add.text(width / 2, height * 0.30, `${this.finalScore.toLocaleString()}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '52px',
      color: '#ffffff',
    });
    scoreText.setOrigin(0.5, 0.5);
    this.add(scoreText);

    // Animate score counting up
    const scoreCounter = { value: 0 };
    scene.tweens.add({
      targets: scoreCounter,
      value: this.finalScore,
      duration: 1200,
      ease: 'Quad.easeOut',
      delay: 300,
      onUpdate: () => {
        scoreText.setText(`${Phaser.Math.FloorTo(scoreCounter.value).toLocaleString()}`);
      },
    });

    // ── New High Score ──
    if (this.isNewHigh) {
      const newHighText = scene.add.text(width / 2, height * 0.38, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '24px',
        color: '#f5a623',
      });
      newHighText.setOrigin(0.5, 0.5);
      this.add(newHighText);

      // Pulsing new high score
      scene.tweens.add({
        targets: newHighText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    } else {
      const highScoreText = scene.add.text(width / 2, height * 0.38, `HIGH SCORE: ${highScore.toLocaleString()}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#888888',
      });
      highScoreText.setOrigin(0.5, 0.5);
      this.add(highScoreText);
    }

    // ── Score Breakdown ──
    const breakdownY = height * 0.46;
    const breakdownItems = [
      { label: 'Tricks Landed', value: `${data.tricksLanded ?? '--'}` },
      { label: 'Max Combo', value: `x${data.comboMax ?? '--'}` },
      { label: 'Dad Bucks Earned', value: `${this.dadBucksEarned} DB`, color: '#f5a623' },
    ];

    breakdownItems.forEach((item, index) => {
      const y = breakdownY + index * 28;
      const label = scene.add.text(width / 2 - 100, y, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#aaaaaa',
      });
      label.setOrigin(0, 0.5);
      this.add(label);

      const value = scene.add.text(width / 2 + 100, y, item.value, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '16px',
        color: item.color ?? '#ffffff',
      });
      value.setOrigin(1, 0.5);
      this.add(value);
    });

    // ── Buttons Row ──
    const btnY = height * 0.68;
    const btnSpacing = 140;

    // Share button
    const shareBtn = this.createButton(
      scene, width / 2 - btnSpacing, btnY, 120, 44,
      'SHARE', UI_COLORS.SUCCESS, '#ffffff'
    );
    shareBtn.button.on('pointerdown', () => this.onShare());

    // Restart button
    const restartBtn = this.createButton(
      scene, width / 2, btnY, 120, 44,
      'PLAY AGAIN', UI_COLORS.PRIMARY, '#1a1a2e'
    );
    restartBtn.button.on('pointerdown', () => this.onRestart());

    // Menu button
    const menuBtn = this.createButton(
      scene, width / 2 + btnSpacing, btnY, 120, 44,
      'MENU', UI_COLORS.SECONDARY, '#ffffff'
    );
    menuBtn.button.on('pointerdown', () => this.onMenu());

    // ── Keyboard shortcut hint ──
    const hintText = scene.add.text(width / 2, height * 0.85, 'Press R to restart', UI_TEXT_STYLES.MUTED);
    hintText.setOrigin(0.5, 0.5);
    this.add(hintText);

    // Keyboard restart
    scene.input.keyboard?.on('keydown-R', () => this.onRestart());

    // Credit Dad Bucks to balance
    const currentBucks: number = scene.registry.get('dadBucks') ?? 0;
    scene.registry.set('dadBucks', currentBucks + this.dadBucksEarned);

    // Set depth and add to scene
    this.setDepth(50);
    scene.add.existing(this);
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    textColor: string
  ): { button: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const button = scene.add.rectangle(x, y, w, h, color);
    button.setInteractive({ useHandCursor: true });
    this.add(button);

    const text = scene.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: textColor,
    });
    text.setOrigin(0.5, 0.5);
    this.add(text);

    const hoverColor = Phaser.Display.Color.ValueToColor(color).brighten(20).color;
    button.on('pointerover', () => {
      button.setFillStyle(hoverColor);
      scene.tweens.add({
        targets: [button, text],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 80,
      });
    });
    button.on('pointerout', () => {
      button.setFillStyle(color);
      scene.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 80,
      });
    });

    return { button, text };
  }

  private onShare(): void {
    const shareData: ShareCardData = {
      score: this.finalScore,
      dadName: this.gameOverData.dadName ?? 'Gary',
      levelName: this.gameOverData.levelName ?? 'The Apartment',
      comboMax: this.gameOverData.comboMax ?? 0,
      isHighScore: this.isNewHigh,
      tricksLanded: this.gameOverData.tricksLanded,
      dadBucksEarned: this.dadBucksEarned,
      timestamp: Date.now(),
    };

    const renderer = new ShareCardRenderer(this.scene);
    renderer.renderAndShare(shareData);
  }

  private onRestart(): void {
    this.scene.scene.start(SCENE_KEYS.GAME);
  }

  private onMenu(): void {
    this.scene.scene.start(SCENE_KEYS.MENU);
  }
}
