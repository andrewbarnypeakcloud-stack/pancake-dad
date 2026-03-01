// CharacterSelectScene — thin wrapper that hosts the CharacterSelect UI container
// See PancakeDad_GDD_v02_Browser.md section 4

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';
import { CharacterSelect } from '../ui/menus/CharacterSelect';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.CHARACTER_SELECT });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#FFF8E7');
    new CharacterSelect(this);
  }
}
