// PauseMenu — overlay with resume/restart/quit, volume slider
// See PancakeDad_GDD_v02_Browser.md section 8.2

import Phaser from 'phaser';
import { GameEvent, SCENE_KEYS } from '../../types/game';
import { UI_COLORS, UI_TEXT_STYLES } from '../../types/ui';

/** Pause menu overlay — dims background, provides resume/restart/quit buttons
 *  and a volume slider. Shown when game is paused. */
export class PauseMenu extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private resumeButton: Phaser.GameObjects.Rectangle;
  private restartButton: Phaser.GameObjects.Rectangle;
  private quitButton: Phaser.GameObjects.Rectangle;
  private volumeSliderBg: Phaser.GameObjects.Rectangle;
  private volumeSliderFill: Phaser.GameObjects.Rectangle;
  private volumeSliderHandle: Phaser.GameObjects.Arc;
  private volumeLabel: Phaser.GameObjects.Text;
  private currentVolume: number = 0.8;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const { width, height } = scene.cameras.main;

    // ── Dim overlay ──
    this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, UI_COLORS.OVERLAY_DIM, 0.6);
    this.overlay.setInteractive(); // Block clicks through to game
    this.add(this.overlay);

    // ── Panel background ──
    const panelWidth = 340;
    const panelHeight = 360;
    this.panel = scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x3D2B1F);
    this.panel.setStrokeStyle(3, UI_COLORS.PRIMARY);
    this.add(this.panel);

    // ── Title ──
    const title = scene.add.text(width / 2, height / 2 - 140, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#f5a623',
    });
    title.setOrigin(0.5, 0.5);
    this.add(title);

    // ── Resume Button ──
    const resumeY = height / 2 - 70;
    this.resumeButton = scene.add.rectangle(width / 2, resumeY, 200, 48, UI_COLORS.PRIMARY);
    this.resumeButton.setInteractive({ useHandCursor: true });
    this.add(this.resumeButton);

    const resumeText = scene.add.text(width / 2, resumeY, 'RESUME', UI_TEXT_STYLES.BUTTON);
    resumeText.setOrigin(0.5, 0.5);
    this.add(resumeText);

    this.resumeButton.on('pointerover', () => this.resumeButton.setFillStyle(UI_COLORS.PRIMARY_HOVER));
    this.resumeButton.on('pointerout', () => this.resumeButton.setFillStyle(UI_COLORS.PRIMARY));
    this.resumeButton.on('pointerdown', () => this.onResume());

    // ── Restart Button ──
    const restartY = height / 2 - 10;
    this.restartButton = scene.add.rectangle(width / 2, restartY, 200, 48, UI_COLORS.SECONDARY);
    this.restartButton.setInteractive({ useHandCursor: true });
    this.add(this.restartButton);

    const restartText = scene.add.text(width / 2, restartY, 'RESTART', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });
    restartText.setOrigin(0.5, 0.5);
    this.add(restartText);

    this.restartButton.on('pointerover', () => this.restartButton.setFillStyle(UI_COLORS.SECONDARY_HOVER));
    this.restartButton.on('pointerout', () => this.restartButton.setFillStyle(UI_COLORS.SECONDARY));
    this.restartButton.on('pointerdown', () => this.onRestart());

    // ── Quit Button ──
    const quitY = height / 2 + 50;
    this.quitButton = scene.add.rectangle(width / 2, quitY, 200, 48, UI_COLORS.DANGER);
    this.quitButton.setInteractive({ useHandCursor: true });
    this.add(this.quitButton);

    const quitText = scene.add.text(width / 2, quitY, 'QUIT TO MENU', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    quitText.setOrigin(0.5, 0.5);
    this.add(quitText);

    this.quitButton.on('pointerover', () => this.quitButton.setFillStyle(0xff6666));
    this.quitButton.on('pointerout', () => this.quitButton.setFillStyle(UI_COLORS.DANGER));
    this.quitButton.on('pointerdown', () => this.onQuit());

    // ── Volume Slider ──
    const sliderY = height / 2 + 120;
    const sliderWidth = 180;

    this.volumeLabel = scene.add.text(width / 2, sliderY - 20, `VOLUME: ${Phaser.Math.FloorTo(this.currentVolume * 100)}%`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#cccccc',
    });
    this.volumeLabel.setOrigin(0.5, 0.5);
    this.add(this.volumeLabel);

    this.volumeSliderBg = scene.add.rectangle(width / 2, sliderY, sliderWidth, 8, 0x444444);
    this.add(this.volumeSliderBg);

    this.volumeSliderFill = scene.add.rectangle(
      width / 2 - sliderWidth / 2,
      sliderY,
      sliderWidth * this.currentVolume,
      8,
      UI_COLORS.PRIMARY
    );
    this.volumeSliderFill.setOrigin(0, 0.5);
    this.add(this.volumeSliderFill);

    const handleX = width / 2 - sliderWidth / 2 + sliderWidth * this.currentVolume;
    this.volumeSliderHandle = scene.add.circle(handleX, sliderY, 10, UI_COLORS.PRIMARY) as Phaser.GameObjects.Arc;
    this.volumeSliderHandle.setInteractive({ useHandCursor: true, draggable: true });
    this.add(this.volumeSliderHandle);

    // Drag handler for volume slider
    scene.input.on('drag', (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
      dragX: number
    ) => {
      if (gameObject !== this.volumeSliderHandle) return;

      const minX = width / 2 - sliderWidth / 2;
      const maxX = width / 2 + sliderWidth / 2;
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

      this.volumeSliderHandle.setPosition(clampedX, sliderY);
      this.currentVolume = (clampedX - minX) / sliderWidth;
      this.volumeSliderFill.width = sliderWidth * this.currentVolume;
      this.volumeLabel.setText(`VOLUME: ${Phaser.Math.FloorTo(this.currentVolume * 100)}%`);

      // Store in registry for audio system
      scene.registry.set('masterVolume', this.currentVolume);
    });

    // ── Start hidden ──
    this.setVisible(false);
    this.setDepth(200);
    this.setScrollFactor(0);

    scene.add.existing(this);
  }

  show(): void {
    this.setVisible(true);

    // Fade in overlay
    this.overlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.6,
      duration: 150,
    });

    // Scale in panel
    this.panel.setScale(0.8);
    this.scene.tweens.add({
      targets: this.panel,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  private onResume(): void {
    this.hide();
    this.scene.events.emit(GameEvent.RUN_RESUMED);
  }

  private onRestart(): void {
    this.hide();
    this.scene.scene.restart();
  }

  private onQuit(): void {
    this.hide();
    this.scene.scene.start(SCENE_KEYS.MENU);
  }
}
