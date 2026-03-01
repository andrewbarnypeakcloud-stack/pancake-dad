// MenuScene — main menu with play/shop buttons, deep-link handling
// See PancakeDad_GDD_v02_Browser.md section 1.4
// Integration tasks: P4-06

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';
import type { DeepLinkParams } from '../types/platform';
import { AudioManager } from '../audio/AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // P4-06: Check for deep-link params — auto-navigate if present
    const deepLinkParams = this.registry.get('deepLinkParams') as DeepLinkParams | undefined;
    if (deepLinkParams?.level || deepLinkParams?.dad) {
      // Store selected dad if specified
      if (deepLinkParams.dad) {
        this.registry.set('equippedDad', deepLinkParams.dad);
      }
      // Clear deep-link so it doesn't trigger again
      this.registry.set('deepLinkParams', { level: undefined, dad: undefined, challenge: undefined });
      this.scene.start(SCENE_KEYS.GAME);
      return;
    }

    // Start menu music
    const audioManager = this.registry.get('audioManager') as AudioManager | undefined;
    if (audioManager) {
      audioManager.playMusic('menu_theme');
    }

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'PANCAKE DAD', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // Title entrance animation
    title.setScale(0);
    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.35, 'Saturday Morning. Your Moment.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cccccc',
      fontStyle: 'italic',
    });
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 300,
    });

    // Play button
    const playBtn = this.add.rectangle(width / 2, height * 0.55, 200, 60, 0xf5a623);
    playBtn.setInteractive({ useHandCursor: true });
    const playText = this.add.text(width / 2, height * 0.55, 'PLAY', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '28px',
      color: '#1a1a2e',
    });
    playText.setOrigin(0.5, 0.5);

    playBtn.on('pointerover', () => {
      playBtn.setFillStyle(0xffb84d);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    playBtn.on('pointerout', () => {
      playBtn.setFillStyle(0xf5a623);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    playBtn.on('pointerdown', () => {
      audioManager?.playSFX('menu_click');
      this.cameras.main.fadeOut(300, 26, 26, 46);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        audioManager?.stopMusic(500);
        this.scene.start(SCENE_KEYS.GAME);
      });
    });

    // High score display
    const highScore: number = this.registry.get('highScore') ?? 0;
    const highScoreText = this.add.text(width / 2, height * 0.68, `HIGH SCORE: ${highScore.toLocaleString()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#888888',
    });
    highScoreText.setOrigin(0.5, 0.5);

    // Dad Bucks display
    const dadBucks: number = this.registry.get('dadBucks') ?? 0;
    if (dadBucks > 0) {
      const bucksText = this.add.text(width / 2, height * 0.74, `DAD BUCKS: ${dadBucks} DB`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#f5a623',
      });
      bucksText.setOrigin(0.5, 0.5);
    }

    // Controls hint
    const controlsText = this.add.text(width / 2, height * 0.88, 'WASD to move | SPACE to jump | J grab | K manual | ESC pause', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    controlsText.setOrigin(0.5, 0.5);

    // Keyboard shortcut: Enter or Space to play
    this.input.keyboard?.on('keydown-ENTER', () => {
      playBtn.emit('pointerdown');
    });
  }
}
