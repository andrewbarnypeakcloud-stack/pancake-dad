// GameOverScene — score display and restart/menu buttons
// See PancakeDad_GDD_v02_Browser.md section 3.1

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  init(data: { score: number }): void {
    this.finalScore = data.score ?? 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const highScore = this.registry.get('highScore') ?? 0;
    const isNewHigh = this.finalScore >= highScore && this.finalScore > 0;

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Game Over title
    this.add.text(width / 2, height * 0.15, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);

    // Score
    this.add.text(width / 2, height * 0.32, `SCORE: ${this.finalScore}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    // High score
    if (isNewHigh) {
      this.add.text(width / 2, height * 0.42, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '24px',
        color: '#f5a623',
      }).setOrigin(0.5, 0.5);
    } else {
      this.add.text(width / 2, height * 0.42, `HIGH SCORE: ${highScore}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#888888',
      }).setOrigin(0.5, 0.5);
    }

    // Dad Bucks earned (placeholder formula: score / 10)
    const dadBucks = Phaser.Math.FloorTo(this.finalScore / 10);
    this.add.text(width / 2, height * 0.52, `DAD BUCKS EARNED: ${dadBucks} DB`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#f5a623',
    }).setOrigin(0.5, 0.5);

    // Restart button
    const restartBtn = this.add.rectangle(width / 2 - 110, height * 0.68, 180, 50, 0xf5a623);
    restartBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 110, height * 0.68, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#1a1a2e',
    }).setOrigin(0.5, 0.5);

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0xffb84d));
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0xf5a623));
    restartBtn.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });

    // Menu button
    const menuBtn = this.add.rectangle(width / 2 + 110, height * 0.68, 180, 50, 0x555555);
    menuBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 110, height * 0.68, 'MENU', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x777777));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x555555));
    menuBtn.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });

    // Controls hint
    this.add.text(width / 2, height * 0.85, 'Press R to restart', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5, 0.5);

    // Keyboard restart
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });
  }
}
