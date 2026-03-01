// MenuScene — main menu with play button
// See PancakeDad_GDD_v02_Browser.md section 1.4

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'PANCAKE DAD', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '64px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.35, 'Saturday Morning. Your Moment.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cccccc',
      fontStyle: 'italic',
    });
    subtitle.setOrigin(0.5, 0.5);

    // Play button
    const playBtn = this.add.rectangle(width / 2, height * 0.55, 200, 60, 0xf5a623);
    playBtn.setInteractive({ useHandCursor: true });
    const playText = this.add.text(width / 2, height * 0.55, 'PLAY', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '28px',
      color: '#1a1a2e',
    });
    playText.setOrigin(0.5, 0.5);

    playBtn.on('pointerover', () => playBtn.setFillStyle(0xffb84d));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0xf5a623));
    playBtn.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });

    // High score display
    const highScore = this.registry.get('highScore') ?? 0;
    const highScoreText = this.add.text(width / 2, height * 0.72, `HIGH SCORE: ${highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#888888',
    });
    highScoreText.setOrigin(0.5, 0.5);

    // Controls hint
    const controlsText = this.add.text(width / 2, height * 0.88, 'WASD to move | SPACE to jump | J grab | K manual', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    controlsText.setOrigin(0.5, 0.5);
  }
}
