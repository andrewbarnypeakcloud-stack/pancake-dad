// BootScene — asset preloader, DataLoader, AudioManager, persistence init
// See PancakeDad_GDD_v02_Browser.md section 1.4
// Integration tasks: P4-01, P4-04, P4-05, P4-06

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';
import { DataLoader } from '../data/DataLoader';
import { AudioManager } from '../audio/AudioManager';
import { AUDIO_MANIFEST } from '../audio/AudioManifest';
import { PersistenceManager } from '../utils/PersistenceManager';
import { DeepLinkParser } from '../utils/DeepLinkParser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    this.createLoadingBar();
  }

  create(): void {
    this.generatePlaceholderTextures();

    // P4-01: Register DataLoader singleton — validates all JSON content
    DataLoader.register(this);

    // P4-04: Init AudioManager singleton with manifest
    const audioManager = new AudioManager();
    const persistence = new PersistenceManager();
    const savedData = persistence.load();

    audioManager.init(AUDIO_MANIFEST, savedData?.settings);
    this.registry.set('audioManager', audioManager);

    // P4-05: Register PersistenceManager and load saved state
    this.registry.set('persistence', persistence);

    if (savedData) {
      this.registry.set('highScore', savedData.progression.highScores['global'] ?? 0);
      this.registry.set('dadBucks', savedData.progression.dadBucks);
      this.registry.set('equippedDad', savedData.progression.equippedDad);
      this.registry.set('equippedPan', savedData.progression.equippedPan);
      this.registry.set('equippedSlippers', savedData.progression.equippedSlippers);
      this.registry.set('unlockedDads', savedData.progression.unlockedDads);
      this.registry.set('purchasedItems', savedData.progression.purchasedItems);
      this.registry.set('challengesCompleted', savedData.progression.challengesCompleted);
      this.registry.set('totalRunsPlayed', savedData.progression.totalRunsPlayed);
    } else {
      // Set defaults for a new player
      this.registry.set('highScore', 0);
      this.registry.set('dadBucks', 0);
      this.registry.set('equippedDad', 'gary');
      this.registry.set('equippedPan', 'non-stick-starter');
      this.registry.set('equippedSlippers', 'terry-cloth-classic');
      this.registry.set('unlockedDads', ['gary']);
      this.registry.set('purchasedItems', ['non-stick-starter', 'terry-cloth-classic']);
      this.registry.set('challengesCompleted', []);
      this.registry.set('totalRunsPlayed', 0);
    }

    // P4-06: Parse deep links from URL hash
    const deepLinks = new DeepLinkParser();
    const params = deepLinks.parse();
    this.registry.set('deepLinkParams', params);

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
