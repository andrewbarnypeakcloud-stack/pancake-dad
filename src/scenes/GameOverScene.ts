// GameOverScene — score display, Dad Bucks, restart/menu buttons
// See PancakeDad_GDD_v02_Browser.md section 3.1
// Integration task: P4-05

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';
import { ECONOMY_CONFIG, DEFAULT_PROGRESSION } from '../types/content';
import { DEFAULT_AUDIO_SETTINGS } from '../types/audio';
import type { SaveData } from '../types/platform';
import { AudioManager } from '../audio/AudioManager';
import { PersistenceManager } from '../utils/PersistenceManager';

interface GameOverData {
  score: number;
  comboMax?: number;
  tricksLanded?: number;
  dadBucksEarned?: number;
}

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private comboMax: number = 0;
  private tricksLanded: number = 0;
  private dadBucksEarned: number = 0;

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  init(data: GameOverData): void {
    this.finalScore = data.score ?? 0;
    this.comboMax = data.comboMax ?? 0;
    this.tricksLanded = data.tricksLanded ?? 0;
    this.dadBucksEarned = data.dadBucksEarned ?? Phaser.Math.FloorTo(this.finalScore / ECONOMY_CONFIG.SCORE_DIVISOR);
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const highScore: number = this.registry.get('highScore') ?? 0;
    const isNewHigh = this.finalScore >= highScore && this.finalScore > 0;

    // Background
    this.cameras.main.setBackgroundColor('#FFF8E7');

    // P4-05: Save game state after run
    this.saveGameState();

    // Game Over title
    const title = this.add.text(width / 2, height * 0.12, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#f5a623',
      stroke: '#3D2B1F',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);

    // Title entrance animation
    title.setScale(0);
    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Score label
    this.add.text(width / 2, height * 0.24, 'FINAL SCORE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#7A6B5D',
    }).setOrigin(0.5, 0.5);

    // Score with count-up animation
    const scoreText = this.add.text(width / 2, height * 0.32, '0', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '52px',
      color: '#3D2B1F',
    }).setOrigin(0.5, 0.5);

    const scoreCounter = { value: 0 };
    this.tweens.add({
      targets: scoreCounter,
      value: this.finalScore,
      duration: 1200,
      ease: 'Quad.easeOut',
      delay: 300,
      onUpdate: () => {
        scoreText.setText(Phaser.Math.FloorTo(scoreCounter.value).toLocaleString());
      },
    });

    // High score
    if (isNewHigh) {
      const newHighText = this.add.text(width / 2, height * 0.40, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '24px',
        color: '#f5a623',
      }).setOrigin(0.5, 0.5);

      this.tweens.add({
        targets: newHighText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(width / 2, height * 0.40, `HIGH SCORE: ${highScore.toLocaleString()}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#7A6B5D',
      }).setOrigin(0.5, 0.5);
    }

    // Score breakdown
    const breakdownY = height * 0.48;
    const items = [
      { label: 'Tricks Landed', value: `${this.tricksLanded}` },
      { label: 'Max Combo', value: `x${this.comboMax}` },
      { label: 'Dad Bucks Earned', value: `${this.dadBucksEarned} DB`, color: '#f5a623' },
    ];

    items.forEach((item, index) => {
      const y = breakdownY + index * 28;
      this.add.text(width / 2 - 100, y, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#7A6B5D',
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 + 100, y, item.value, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '16px',
        color: item.color ?? '#3D2B1F',
      }).setOrigin(1, 0.5);
    });

    // Buttons
    const btnY = height * 0.68;
    const audioManager = this.registry.get('audioManager') as AudioManager | undefined;

    // Play Again
    const restartBtn = this.add.rectangle(width / 2 - 100, btnY, 180, 50, 0xf5a623);
    restartBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 100, btnY, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#3D2B1F',
    }).setOrigin(0.5, 0.5);

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0xffb84d));
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0xf5a623));
    restartBtn.on('pointerdown', () => {
      audioManager?.playSFX('menu_click');
      this.scene.start(SCENE_KEYS.GAME);
    });

    // Menu
    const menuBtn = this.add.rectangle(width / 2 + 100, btnY, 180, 50, 0x8B6B4A);
    menuBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 100, btnY, 'MENU', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0xA6845E));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x8B6B4A));
    menuBtn.on('pointerdown', () => {
      audioManager?.playSFX('menu_click');
      this.scene.start(SCENE_KEYS.MENU);
    });

    // Controls hint — platform-aware
    const isMobile = !this.sys.game.device.os.desktop;
    const restartHint = isMobile
      ? 'Tap PLAY AGAIN to restart'
      : 'Press R to restart';
    this.add.text(width / 2, height * 0.85, restartHint, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#7A6B5D',
    }).setOrigin(0.5, 0.5);

    // Keyboard restart
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });
  }

  /** Persist the current game state after run end */
  private saveGameState(): void {
    const persistence = this.registry.get('persistence') as PersistenceManager | undefined;
    if (!persistence) return;

    const audioManager = this.registry.get('audioManager') as AudioManager | undefined;

    const saveData: SaveData = {
      version: 1,
      progression: {
        unlockedDads: this.registry.get('unlockedDads') ?? DEFAULT_PROGRESSION.unlockedDads,
        equippedDad: this.registry.get('equippedDad') ?? DEFAULT_PROGRESSION.equippedDad,
        equippedPan: this.registry.get('equippedPan') ?? DEFAULT_PROGRESSION.equippedPan,
        equippedSlippers: this.registry.get('equippedSlippers') ?? DEFAULT_PROGRESSION.equippedSlippers,
        purchasedItems: this.registry.get('purchasedItems') ?? DEFAULT_PROGRESSION.purchasedItems,
        dadBucks: this.registry.get('dadBucks') ?? 0,
        highScores: { global: this.registry.get('highScore') ?? 0 },
        challengesCompleted: this.registry.get('challengesCompleted') ?? [],
        totalRunsPlayed: this.registry.get('totalRunsPlayed') ?? 0,
      },
      settings: audioManager?.getSettings() ?? { ...DEFAULT_AUDIO_SETTINGS },
      lastSaved: Date.now(),
    };

    persistence.save(saveData);
  }
}
