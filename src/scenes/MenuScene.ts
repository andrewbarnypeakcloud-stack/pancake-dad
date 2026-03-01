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
    this.cameras.main.setBackgroundColor('#FFF8E7');

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'PANCAKE DAD', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px',
      color: '#f5a623',
      stroke: '#3D2B1F',
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
      color: '#5C4A3A',
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
      color: '#3D2B1F',
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
      this.cameras.main.fadeOut(300, 61, 43, 31);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        audioManager?.stopMusic(500);
        this.scene.start(SCENE_KEYS.GAME);
      });
    });

    // Characters button
    const charsBtn = this.add.rectangle(width / 2, height * 0.65, 200, 50, 0x8B6B4A);
    charsBtn.setInteractive({ useHandCursor: true });
    const charsText = this.add.text(width / 2, height * 0.65, 'CHARACTERS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    });
    charsText.setOrigin(0.5, 0.5);

    charsBtn.on('pointerover', () => {
      charsBtn.setFillStyle(0xA6845E);
      this.tweens.add({ targets: [charsBtn, charsText], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    charsBtn.on('pointerout', () => {
      charsBtn.setFillStyle(0x8B6B4A);
      this.tweens.add({ targets: [charsBtn, charsText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    charsBtn.on('pointerdown', () => {
      audioManager?.playSFX('menu_click');
      this.scene.start(SCENE_KEYS.CHARACTER_SELECT);
    });

    // Shop button
    const shopBtn = this.add.rectangle(width / 2, height * 0.75, 200, 50, 0x8B6B4A);
    shopBtn.setInteractive({ useHandCursor: true });
    const shopText = this.add.text(width / 2, height * 0.75, 'SHOP', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    });
    shopText.setOrigin(0.5, 0.5);

    shopBtn.on('pointerover', () => {
      shopBtn.setFillStyle(0xA6845E);
      this.tweens.add({ targets: [shopBtn, shopText], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    shopBtn.on('pointerout', () => {
      shopBtn.setFillStyle(0x8B6B4A);
      this.tweens.add({ targets: [shopBtn, shopText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    shopBtn.on('pointerdown', () => {
      audioManager?.playSFX('menu_click');
      this.scene.start(SCENE_KEYS.SHOP);
    });

    // High score display
    const highScore: number = this.registry.get('highScore') ?? 0;
    const highScoreText = this.add.text(width / 2, height * 0.85, `HIGH SCORE: ${highScore.toLocaleString()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#7A6B5D',
    });
    highScoreText.setOrigin(0.5, 0.5);

    // Dad Bucks display
    const dadBucks: number = this.registry.get('dadBucks') ?? 0;
    if (dadBucks > 0) {
      const bucksText = this.add.text(width / 2, height * 0.89, `DAD BUCKS: ${dadBucks} DB`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#f5a623',
      });
      bucksText.setOrigin(0.5, 0.5);
    }

    // Controls hint — platform-aware
    const isMobile = !this.sys.game.device.os.desktop;
    const controlsMessage = isMobile
      ? 'Tap buttons to move & jump | Hold GRAB in air for tricks'
      : 'WASD to move | SPACE to jump | J grab | K manual | ESC pause';
    const controlsText = this.add.text(width / 2, height * 0.95, controlsMessage, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#7A6B5D',
    });
    controlsText.setOrigin(0.5, 0.5);

    // Keyboard shortcuts: Enter or Space to play
    this.input.keyboard?.on('keydown-ENTER', () => {
      playBtn.emit('pointerdown');
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      playBtn.emit('pointerdown');
    });
  }
}
