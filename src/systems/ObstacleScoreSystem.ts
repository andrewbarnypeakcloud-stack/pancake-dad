// ObstacleScoreSystem — detects when dad jumps over ground hurdles and awards points
// Clearing obstacles while spinning (doing flips) awards bonus points

import Phaser from 'phaser';
import { GameEvent, PlayerState } from '../types/game';
import { Dad } from '../entities/Dad';
import { Platform } from '../entities/Platform';

const BASE_OBSTACLE_SCORE = 150;
const FLIP_BONUS_MULTIPLIER = 2;

export class ObstacleScoreSystem {
  private scene: Phaser.Scene;
  private dad: Dad;
  private platforms: Platform[];

  constructor(scene: Phaser.Scene, dad: Dad, platforms: Platform[]) {
    this.scene = scene;
    this.dad = dad;
    this.platforms = platforms;

    // Reset cleared flags when dad lands
    scene.events.on('dad:landed', () => {
      for (const platform of this.platforms) {
        platform.resetCleared();
      }
    });
  }

  update(): void {
    if (!this.dad.isAirborne()) return;

    const dadBounds = this.dad.getBounds();

    for (const platform of this.platforms) {
      // Only track ground hurdles, not elevated platforms
      if (platform.isElevated()) continue;
      if (platform.isCleared()) continue;

      const platBounds = platform.getBounds();

      // Check horizontal overlap (dad is passing over the hurdle)
      const horizontalOverlap =
        dadBounds.right > platBounds.left &&
        dadBounds.left < platBounds.right;

      // Check dad is above the hurdle top
      const abovePlatform = dadBounds.bottom < platBounds.top;

      if (horizontalOverlap && abovePlatform) {
        platform.markCleared();

        const isFlipping = this.dad.getState() === PlayerState.SPINNING;
        const score = isFlipping
          ? BASE_OBSTACLE_SCORE * FLIP_BONUS_MULTIPLIER
          : BASE_OBSTACLE_SCORE;

        this.scene.events.emit(GameEvent.OBSTACLE_CLEARED, {
          score,
          isFlipBonus: isFlipping,
        });
      }
    }
  }
}
