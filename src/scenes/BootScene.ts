// BootScene — asset preloader with loading bar
// See PancakeDad_GDD_v02_Browser.md section 1.4

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    this.createLoadingBar();
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start(SCENE_KEYS.MENU);
  }

  private createLoadingBar(): void {
    const { width, height } = this.cameras.main;
    const barWidth = width * 0.6;
    const barHeight = 24;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bgBar = this.add.rectangle(width / 2, barY, barWidth, barHeight, 0x333333);
    bgBar.setOrigin(0.5, 0.5);

    const progressBar = this.add.rectangle(barX, barY, 0, barHeight, 0xf5a623);
    progressBar.setOrigin(0, 0.5);

    const loadingText = this.add.text(width / 2, barY - 40, 'LOADING...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = barWidth * value;
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      bgBar.destroy();
      loadingText.destroy();
    });
  }

  private generatePlaceholderTextures(): void {
    // Dad placeholder — 48x64 colored rectangle
    const dadGfx = this.add.graphics();
    dadGfx.fillStyle(0x4a90d9);
    dadGfx.fillRect(0, 0, 48, 64);
    dadGfx.fillStyle(0xf5c6a0);
    dadGfx.fillCircle(24, 12, 12);
    dadGfx.fillStyle(0x8b4513);
    dadGfx.fillRect(4, 56, 16, 8);
    dadGfx.fillRect(28, 56, 16, 8);
    dadGfx.generateTexture('dad', 48, 64);
    dadGfx.destroy();

    // Pancake placeholder — 32x8 oval
    const pancakeGfx = this.add.graphics();
    pancakeGfx.fillStyle(0xdaa520);
    pancakeGfx.fillEllipse(16, 4, 32, 8);
    pancakeGfx.generateTexture('pancake', 32, 8);
    pancakeGfx.destroy();

    // Pan placeholder — 56x16
    const panGfx = this.add.graphics();
    panGfx.fillStyle(0x555555);
    panGfx.fillRoundedRect(0, 0, 40, 12, 4);
    panGfx.fillStyle(0x8b4513);
    panGfx.fillRect(40, 3, 16, 6);
    panGfx.generateTexture('pan', 56, 16);
    panGfx.destroy();

    // Particle placeholder — small square
    const particleGfx = this.add.graphics();
    particleGfx.fillStyle(0xffffff);
    particleGfx.fillRect(0, 0, 4, 4);
    particleGfx.generateTexture('particle', 4, 4);
    particleGfx.destroy();
  }
}
