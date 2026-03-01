// ComboSystem — chain multiplier, on-fire state, bank on catch
// See PancakeDad_GDD_v02_Browser.md section 3.5

import Phaser from 'phaser';
import { GameEvent, ComboState, GAME_CONFIG } from '../types/game';

export class ComboSystem {
  private scene: Phaser.Scene;
  private state: ComboState;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = this.createFreshState();
  }

  onTrickComplete(trickScore: number): void {
    this.state.chain++;
    this.state.multiplier = Phaser.Math.Clamp(
      this.state.chain,
      1,
      GAME_CONFIG.MAX_COMBO_MULTIPLIER
    );

    // On Fire bonus at threshold
    const wasOnFire = this.state.onFire;
    this.state.onFire = this.state.chain >= GAME_CONFIG.ON_FIRE_THRESHOLD;

    const onFireBonus = this.state.onFire ? GAME_CONFIG.ON_FIRE_BONUS : 0;
    const scoreWithMultiplier = Phaser.Math.FloorTo(
      trickScore * this.state.multiplier * (1 + onFireBonus)
    );

    this.state.totalScore += scoreWithMultiplier;

    if (this.state.onFire && !wasOnFire) {
      this.scene.events.emit(GameEvent.ON_FIRE_START);
    }

    this.scene.events.emit(GameEvent.COMBO_UPDATE, { ...this.state });
  }

  onPancakeCaught(): void {
    this.bankCombo();
    this.scene.events.emit(GameEvent.PANCAKE_CAUGHT);
  }

  onPancakeDropped(): void {
    if (this.state.onFire) {
      this.scene.events.emit(GameEvent.ON_FIRE_END);
    }
    this.state.chain = 0;
    this.state.multiplier = 1;
    this.state.totalScore = 0;
    this.state.onFire = false;

    this.scene.events.emit(GameEvent.COMBO_BREAK);
    this.scene.events.emit(GameEvent.COMBO_UPDATE, { ...this.state });
  }

  bankCombo(): void {
    this.state.bankedScore += this.state.totalScore;
    this.state.totalScore = 0;
    this.state.chain = 0;
    this.state.multiplier = 1;

    if (this.state.onFire) {
      this.state.onFire = false;
      this.scene.events.emit(GameEvent.ON_FIRE_END);
    }

    this.scene.events.emit(GameEvent.SCORE_UPDATE, this.state.bankedScore);
    this.scene.events.emit(GameEvent.COMBO_UPDATE, { ...this.state });
  }

  getState(): ComboState {
    return { ...this.state };
  }

  private createFreshState(): ComboState {
    return {
      chain: 0,
      multiplier: 1,
      totalScore: 0,
      onFire: false,
      bankedScore: 0,
    };
  }
}
