// MainMenu — logo text, play/shop buttons, high score display
// See PancakeDad_GDD_v02_Browser.md section 1.4
// Uses Phaser GameObjects only (no DOM)

import Phaser from 'phaser';
import { SCENE_KEYS } from '../../types/game';
import { UI_TEXT_STYLES, UI_COLORS } from '../../types/ui';

/** Scene key constants for menu navigation */
const CHARACTER_SELECT_KEY = 'CharacterSelectScene';
const SHOP_KEY = 'ShopScene';

/** Main menu UI — renders logo, play/shop buttons, and high score.
 *  Designed to reach first gameplay in under 10 seconds (GDD 1.4). */
export class MainMenu extends Phaser.GameObjects.Container {
  private titleText: Phaser.GameObjects.Text;
  private subtitleText: Phaser.GameObjects.Text;
  private playButton: Phaser.GameObjects.Rectangle;
  private playButtonText: Phaser.GameObjects.Text;
  private shopButton: Phaser.GameObjects.Rectangle;
  private shopButtonText: Phaser.GameObjects.Text;
  private highScoreText: Phaser.GameObjects.Text;
  private controlsHint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const { width, height } = scene.cameras.main;

    // ── Title ──
    this.titleText = scene.add.text(width / 2, height * 0.2, 'PANCAKE DAD', UI_TEXT_STYLES.TITLE);
    this.titleText.setOrigin(0.5, 0.5);
    this.add(this.titleText);

    // Title entrance animation
    this.titleText.setScale(0);
    scene.tweens.add({
      targets: this.titleText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // ── Subtitle ──
    this.subtitleText = scene.add.text(
      width / 2,
      height * 0.3,
      'Saturday Morning. Your Moment.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#cccccc',
        fontStyle: 'italic',
      }
    );
    this.subtitleText.setOrigin(0.5, 0.5);
    this.subtitleText.setAlpha(0);
    scene.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      duration: 400,
      delay: 400,
    });
    this.add(this.subtitleText);

    // ── Play Button ──
    this.playButton = scene.add.rectangle(width / 2, height * 0.5, 220, 60, UI_COLORS.PRIMARY);
    this.playButton.setInteractive({ useHandCursor: true });
    this.add(this.playButton);

    this.playButtonText = scene.add.text(width / 2, height * 0.5, 'PLAY', UI_TEXT_STYLES.BUTTON);
    this.playButtonText.setOrigin(0.5, 0.5);
    this.add(this.playButtonText);

    this.playButton.on('pointerover', () => {
      this.playButton.setFillStyle(UI_COLORS.PRIMARY_HOVER);
      scene.tweens.add({
        targets: [this.playButton, this.playButtonText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Quad.easeOut',
      });
    });
    this.playButton.on('pointerout', () => {
      this.playButton.setFillStyle(UI_COLORS.PRIMARY);
      scene.tweens.add({
        targets: [this.playButton, this.playButtonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Quad.easeOut',
      });
    });
    this.playButton.on('pointerdown', () => {
      this.onPlayClicked();
    });

    // ── Shop Button ──
    this.shopButton = scene.add.rectangle(width / 2, height * 0.62, 180, 50, UI_COLORS.SECONDARY);
    this.shopButton.setInteractive({ useHandCursor: true });
    this.add(this.shopButton);

    this.shopButtonText = scene.add.text(width / 2, height * 0.62, 'SHOP', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.shopButtonText.setOrigin(0.5, 0.5);
    this.add(this.shopButtonText);

    this.shopButton.on('pointerover', () => {
      this.shopButton.setFillStyle(UI_COLORS.SECONDARY_HOVER);
    });
    this.shopButton.on('pointerout', () => {
      this.shopButton.setFillStyle(UI_COLORS.SECONDARY);
    });
    this.shopButton.on('pointerdown', () => {
      this.onShopClicked();
    });

    // ── High Score Display ──
    const highScore = scene.registry.get('highScore') ?? 0;
    this.highScoreText = scene.add.text(
      width / 2,
      height * 0.76,
      `HIGH SCORE: ${highScore.toLocaleString()}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#888888',
      }
    );
    this.highScoreText.setOrigin(0.5, 0.5);
    this.add(this.highScoreText);

    // ── Controls Hint (platform-aware) ──
    const isMobile = !scene.sys.game.device.os.desktop;
    const controlsMessage = isMobile
      ? 'Tap buttons to move & jump | Hold GRAB in air for tricks'
      : 'WASD to move | SPACE to jump | J grab | K manual';
    this.controlsHint = scene.add.text(
      width / 2,
      height * 0.9,
      controlsMessage,
      UI_TEXT_STYLES.MUTED
    );
    this.controlsHint.setOrigin(0.5, 0.5);
    this.add(this.controlsHint);

    // Set depth
    this.setDepth(50);

    // Add to scene
    scene.add.existing(this);
  }

  private onPlayClicked(): void {
    // Transition with quick fade
    this.scene.cameras.main.fadeOut(200, 0, 0, 0);
    this.scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // Try CharacterSelect first, fall back to GameScene
        if (this.scene.scene.get(CHARACTER_SELECT_KEY)) {
          this.scene.scene.start(CHARACTER_SELECT_KEY);
        } else {
          this.scene.scene.start(SCENE_KEYS.GAME);
        }
      }
    );
  }

  private onShopClicked(): void {
    this.scene.cameras.main.fadeOut(200, 0, 0, 0);
    this.scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (this.scene.scene.get(SHOP_KEY)) {
          this.scene.scene.start(SHOP_KEY);
        }
      }
    );
  }
}
