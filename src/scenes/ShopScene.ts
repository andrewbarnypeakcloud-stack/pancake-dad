// ShopScene — thin wrapper that hosts the ShopScreen UI container
// See PancakeDad_GDD_v02_Browser.md section 5

import Phaser from 'phaser';
import { SCENE_KEYS } from '../types/game';
import { ShopScreen } from '../ui/menus/ShopScreen';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.SHOP });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#FFF8E7');
    new ShopScreen(this);
  }
}
