// Pancake Dad — Game entry point
// See PancakeDad_GDD_v02_Browser.md section 2.1

import Phaser from 'phaser';
import { GAME_CONFIG } from './types/game';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: import.meta.env.DEV,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: GAME_CONFIG.CANVAS_MIN_WIDTH,
      height: GAME_CONFIG.CANVAS_MIN_HEIGHT,
    },
    max: {
      width: GAME_CONFIG.CANVAS_MAX_WIDTH,
      height: GAME_CONFIG.CANVAS_MAX_HEIGHT,
    },
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, ShopScene, GameScene, GameOverScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  fps: {
    target: GAME_CONFIG.TARGET_FPS,
    forceSetTimeOut: false,
  },
};

export const game = new Phaser.Game(config);
