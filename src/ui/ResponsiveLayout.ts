// ResponsiveLayout — converts ResponsiveAnchor to pixel positions
// See PancakeDad_GDD_v02_Browser.md section 8.3

import Phaser from 'phaser';
import {
  ResponsiveAnchor,
  ResolvedPosition,
  HUDConfig,
  DEFAULT_HUD_CONFIG,
  MOBILE_HUD_CONFIG,
} from '../types/ui';

/** Aspect ratio threshold: below this value we consider the layout portrait (mobile) */
const PORTRAIT_ASPECT_THRESHOLD = 1.0;

/** Utility class that resolves ResponsiveAnchors to pixel positions based on current camera size.
 *  Works for both 16:9 desktop and 9:16 mobile layouts. */
export class ResponsiveLayout {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Resolve a single ResponsiveAnchor to a pixel position */
  resolve(anchor: ResponsiveAnchor): ResolvedPosition {
    const { width, height } = this.getCanvasSize();

    return {
      x: anchor.anchorX * width + anchor.offsetX,
      y: anchor.anchorY * height + anchor.offsetY,
      originX: anchor.originX ?? 0,
      originY: anchor.originY ?? 0,
    };
  }

  /** Apply a ResponsiveAnchor position to a Phaser GameObject.
   *  Sets origin if the object supports it (e.g. Sprite, Text — but not Container). */
  applyAnchor(
    gameObject: Phaser.GameObjects.Components.Transform,
    anchor: ResponsiveAnchor
  ): void {
    const pos = this.resolve(anchor);
    gameObject.setPosition(pos.x, pos.y);
    const obj = gameObject as unknown as { setOrigin?: (x: number, y: number) => void };
    if (typeof obj.setOrigin === 'function') {
      obj.setOrigin(pos.originX, pos.originY);
    }
  }

  /** Get the appropriate HUD config based on current aspect ratio */
  getHUDConfig(): HUDConfig {
    return this.isPortrait() ? MOBILE_HUD_CONFIG : DEFAULT_HUD_CONFIG;
  }

  /** Check if the current aspect ratio is portrait (mobile) */
  isPortrait(): boolean {
    const { width, height } = this.getCanvasSize();
    return (width / height) < PORTRAIT_ASPECT_THRESHOLD;
  }

  /** Get the current camera/canvas dimensions */
  getCanvasSize(): { width: number; height: number } {
    const camera = this.scene.cameras.main;
    return {
      width: camera.width,
      height: camera.height,
    };
  }

  /** Scale a pixel value relative to a reference width (1280px baseline).
   *  Useful for scaling font sizes and element dimensions. */
  scaleValue(baseValue: number, referenceWidth: number = 1280): number {
    const { width } = this.getCanvasSize();
    return Phaser.Math.FloorTo(baseValue * (width / referenceWidth));
  }

  /** Create a responsive text style by scaling the font size */
  scaleTextStyle(
    style: Phaser.Types.GameObjects.Text.TextStyle,
    referenceWidth: number = 1280
  ): Phaser.Types.GameObjects.Text.TextStyle {
    const fontSize = style.fontSize;
    if (typeof fontSize === 'string') {
      const numericSize = parseInt(fontSize, 10);
      if (!isNaN(numericSize)) {
        const scaledSize = this.scaleValue(numericSize, referenceWidth);
        return { ...style, fontSize: `${scaledSize}px` };
      }
    }
    return style;
  }
}
