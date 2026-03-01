// VoxelTextureGenerator — procedural pixel-art/voxel texture generator
// Generates ALL game textures at runtime using Phaser's Graphics API.
// Voxel grid base resolution: 4px per voxel unit (chunky Crossy Road aesthetic).
// See PancakeDad_GDD_v02_Browser.md section 7.1 (visual style).

import Phaser from 'phaser';

// ── Palette color constants (hex numbers, not strings) ──────────────────────

const COL = {
  // Shared skin / neutral
  SKIN:        0xf5c6a0,
  SKIN_DARK:   0xe8a87c,
  SKIN_SHADOW: 0xc98a5e,
  WHITE:       0xffffff,
  BLACK:       0x111111,
  EYE:         0x1a1a2e,
  TEETH:       0xfff8f0,
  MUSTACHE:    0x4a3728,

  // Dad shirt colours
  GARY_SHIRT:   0x4a90d9,
  TOMASZ_SHIRT: 0xe74c3c,
  KENJI_SHIRT:  0x27ae60,
  MARCUS_SHIRT: 0xf5a623,
  PAWEL_SHIRT:  0x9b59b6,

  // Hair
  BROWN_HAIR:  0x6b3a2a,
  BLACK_HAIR:  0x1a1a2e,
  AFRO_HAIR:   0x4a3020,
  BLOND_HAIR:  0xe8d44d,

  // Pants / shoes / accessories
  PANTS:       0x2d4a7a,
  PANTS_DARK:  0x1e3355,
  SLIPPER:     0x8bc34a,
  SLIPPER_ALT: 0xffc107,
  GLASSES:     0x2c3e50,
  HEADBAND:    0xffd700,
  GOLD_CHAIN:  0xffd700,
  SCARF:       0xffe4e1,
  SCARF_PINK:  0xffb6c1,

  // Items
  PANCAKE_MID:  0xdaa520,
  PANCAKE_EDGE: 0xb8860b,
  PANCAKE_HIGH: 0xf0c040,
  PAN_BODY:     0x555555,
  PAN_SHEEN:    0x888888,
  PAN_SHADOW:   0x333333,
  HANDLE:       0x8b4513,
  HANDLE_DARK:  0x6b3410,

  // Backgrounds
  BG_APARTMENT_WALL:   0xf5e6d0,
  BG_APARTMENT_FLOOR:  0xd4a96a,
  BG_APARTMENT_TILE:   0xe8d4b0,
  BG_SUBURBAN_WALL:    0xe8f0fe,
  BG_SUBURBAN_FLOOR:   0xc8b89a,
  BG_SUBURBAN_TILE:    0xddd0bc,
  BG_OPEN_WALL:        0xf8f8f8,
  BG_OPEN_FLOOR:       0xe0e0e0,
  BG_OPEN_TILE:        0xfafafa,
  BG_HOLIDAY_WALL:     0xcc2222,
  BG_HOLIDAY_FLOOR:    0x8b4513,
  BG_HOLIDAY_SNOW:     0xe8f4fd,
  BG_COMP_WALL:        0x2a2a3e,
  BG_COMP_FLOOR:       0x1a1a2e,
  BG_COMP_SPOT:        0xfffde0,

  // Shared bg elements
  CABINET:     0xc8a882,
  CABINET_DARK:0xa08060,
  WINDOW_SKY:  0x87ceeb,
  WINDOW_FRAME:0x8b4513,
  COUNTER:     0xd4b896,
  COUNTER_DARK:0xb89870,

  // Particles
  SPARK_YELLOW: 0xffee44,
  SPARK_WHITE:  0xffffff,
  FLAME_ORANGE: 0xff6600,
  FLAME_RED:    0xff2200,
  SPLAT_YELLOW: 0xf5de8a,

  // Buttons
  BTN_PRIMARY:      0xf5a623,
  BTN_PRIMARY_DARK: 0xc47e10,
  BTN_PRIMARY_LIGHT:0xffcc55,
  BTN_SECONDARY:      0x555555,
  BTN_SECONDARY_DARK: 0x333333,
  BTN_SECONDARY_LIGHT:0x888888,

  // Hazards
  CAT_ORANGE:   0xe07820,
  CAT_LIGHT:    0xf0a050,
  TOY_RED:      0xe74c3c,
  TOY_BLUE:     0x3498db,
  TOY_YELLOW:   0xf1c40f,
  PUDDLE:       0xa0c8f0,
  PUDDLE_DARK:  0x7aadde,
  CABLE_DARK:   0x2c2c2c,
  CABLE_MID:    0x555555,
  ORNAMENT_RED: 0xe74c3c,
  ORNAMENT_GOLD:0xf0c040,

  // Floor tile
  TILE_LIGHT:  0xf0e8d8,
  TILE_DARK:   0xe0d0bc,
  TILE_GROUT:  0xc4b09a,
} as const;

// ── Colour index → palette lookup for dad pixel maps ───────────────────────

// Index meanings used in all dad pixel maps:
//   0 = transparent
//   1 = skin
//   2 = shirt
//   3 = hair
//   4 = pants
//   5 = slipper
//   6 = eye
//   7 = accent (mustache / glasses / headband / chain / scarf / etc.)
//   8 = skin shadow (jaw/neck shading)
//   9 = shirt highlight

type DadPalette = Record<number, number>;

function makeDadPalette(
  shirt: number,
  hair: number,
  slipper: number,
  accent: number,
  shirtHighlight: number,
): DadPalette {
  return {
    1: COL.SKIN,
    2: shirt,
    3: hair,
    4: COL.PANTS,
    5: slipper,
    6: COL.EYE,
    7: accent,
    8: COL.SKIN_SHADOW,
    9: shirtHighlight,
  };
}

// ── Dad pixel maps — 12 wide × 16 tall ─────────────────────────────────────
// Row 0 = top of sprite (head top), row 15 = bottom (feet).
// Each dad is distinct: different hair, shirt, accessories.

// Gary — classic balanced dad.
// Blue shirt, brown hair, thick mustache below nose.
const MAP_GARY: number[][] = [
  [0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0], // hair top
  [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0], // hair
  [0, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 0], // hair / face start
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // face brow
  [0, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0], // eyes
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // nose area
  [0, 1, 7, 7, 7, 1, 1, 7, 7, 7, 1, 0], // mustache
  [0, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 0], // jaw / chin
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0], // collar / shirt top
  [2, 2, 9, 2, 2, 2, 2, 2, 2, 9, 2, 2], // shirt body
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt body
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt lower
  [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], // pants top
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // pants legs gap
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0], // slippers
];

// Tomasz — athletic dad. Red shirt, black spiky hair, gold headband.
const MAP_TOMASZ: number[][] = [
  [0, 0, 3, 3, 7, 3, 3, 7, 3, 3, 0, 0], // spiky hair / headband row
  [0, 3, 3, 3, 7, 7, 7, 7, 3, 3, 3, 0], // headband band across
  [0, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 0], // hair sides / face
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // face brow
  [0, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0], // eyes
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // nose
  [0, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 0], // mouth — small grin dots
  [0, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 0], // jaw
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0], // collar / shirt
  [2, 2, 9, 9, 2, 2, 2, 2, 9, 9, 2, 2], // athletic stripes
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt lower
  [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], // pants
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0], // slippers
];

// Kenji — precise dad. Green polo, neat black hair, thick glasses frames.
const MAP_KENJI: number[][] = [
  [0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0], // neat flat-top hair
  [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0], // hair
  [0, 0, 3, 3, 1, 1, 1, 1, 3, 3, 0, 0], // hair sides face
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // brow
  [0, 1, 7, 6, 7, 1, 1, 7, 6, 7, 1, 0], // glasses frames + eyes
  [0, 1, 7, 1, 7, 1, 1, 7, 1, 7, 1, 0], // glasses lower rim
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // nose / mouth
  [0, 8, 1, 1, 1, 6, 6, 1, 1, 1, 8, 0], // smile dots, jaw shading
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0], // polo collar
  [2, 2, 9, 2, 2, 2, 2, 2, 2, 9, 2, 2], // polo body
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt lower
  [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], // pants
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0], // slippers
];

// Marcus — showman dad. Orange Hawaiian shirt, brown afro, gold chain accent.
const MAP_MARCUS: number[][] = [
  [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0], // afro top
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0], // afro wide
  [3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3], // afro sides / face
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // brow
  [0, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0], // eyes
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // nose
  [0, 1, 1, 1, 6, 1, 1, 6, 1, 1, 1, 0], // wide grin
  [0, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 0], // jaw
  [0, 2, 2, 7, 7, 7, 7, 7, 7, 2, 2, 0], // shirt collar + gold chain
  [2, 2, 9, 2, 7, 2, 2, 7, 2, 9, 2, 2], // shirt + chain links
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt lower
  [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], // pants
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0], // slippers
];

// Pawel — stylish dad. Purple shirt, blond hair, fluffy scarf accent rows.
const MAP_PAWEL: number[][] = [
  [0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0], // blond hair top
  [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0], // hair
  [0, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 0], // hair sides / face
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // brow
  [0, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0], // eyes
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // nose
  [0, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 0], // smile
  [0, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 0], // jaw
  [0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0], // scarf top row (pink/cream)
  [0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0], // scarf second row (fluffy)
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // shirt body
  [2, 2, 9, 2, 2, 2, 2, 2, 2, 9, 2, 2], // shirt lower
  [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], // pants
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 0], // legs
  [0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0], // slippers
];

// ── Main class ──────────────────────────────────────────────────────────────

export class VoxelTextureGenerator {
  private scene: Phaser.Scene;

  // Voxel unit size in pixels — 4px per voxel = chunky pixel art.
  private static readonly VOXEL = 4;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Generate every texture the game needs. Call once in BootScene.create(). */
  generateAll(): void {
    this.generateDads();
    this.generateItems();
    this.generateParticles();
    this.generateBackgrounds();
    this.generateButtons();
    this.generateHazards();
    this.generateFloor();
  }

  // ── Pixel-map helper ────────────────────────────────────────────────────

  /** Draw a 2-D colour-index map onto a Graphics object using solid rectangles.
   *  Index 0 is transparent (skipped). Each occupied voxel is pixelSize × pixelSize. */
  private drawPixelMap(
    gfx: Phaser.GameObjects.Graphics,
    map: number[][],
    palette: DadPalette,
    pixelSize: number,
    offsetX = 0,
    offsetY = 0,
  ): void {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const colorIndex = map[row][col];
        if (colorIndex === 0) continue;
        const color = palette[colorIndex];
        if (color === undefined) continue;
        gfx.fillStyle(color);
        gfx.fillRect(
          offsetX + col * pixelSize,
          offsetY + row * pixelSize,
          pixelSize,
          pixelSize,
        );
      }
    }
  }

  /** Convenience: create a Graphics, draw, generate texture, destroy Graphics.
   *  The caller supplies a draw callback that receives the fresh Graphics. */
  private makeTexture(
    key: string,
    width: number,
    height: number,
    draw: (gfx: Phaser.GameObjects.Graphics) => void,
  ): void {
    const gfx = this.scene.add.graphics();
    draw(gfx);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }

  // ── Dad generation ──────────────────────────────────────────────────────

  private generateDads(): void {
    const V = VoxelTextureGenerator.VOXEL;
    const W = 12 * V; // 48
    const H = 16 * V; // 64

    // Gary — balanced, blue shirt, brown hair, mustache
    this.makeTexture('dad-gary', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.GARY_SHIRT,
        COL.BROWN_HAIR,
        COL.SLIPPER,
        COL.MUSTACHE,
        0x6aacf0,
      );
      this.drawPixelMap(gfx, MAP_GARY, palette, V);
    });

    // Tomasz — athletic, red shirt, black spiky hair, gold headband
    this.makeTexture('dad-tomasz', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.TOMASZ_SHIRT,
        COL.BLACK_HAIR,
        COL.SLIPPER_ALT,
        COL.HEADBAND,
        0xff7070,
      );
      this.drawPixelMap(gfx, MAP_TOMASZ, palette, V);
    });

    // Kenji — precise, green polo, black hair, glasses
    this.makeTexture('dad-kenji', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.KENJI_SHIRT,
        COL.BLACK_HAIR,
        COL.SLIPPER,
        COL.GLASSES,
        0x48d080,
      );
      this.drawPixelMap(gfx, MAP_KENJI, palette, V);
    });

    // Marcus — showman, orange Hawaiian shirt, brown afro, gold chain
    this.makeTexture('dad-marcus', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.MARCUS_SHIRT,
        COL.AFRO_HAIR,
        COL.SLIPPER_ALT,
        COL.GOLD_CHAIN,
        0xffc060,
      );
      this.drawPixelMap(gfx, MAP_MARCUS, palette, V);
    });

    // Pawel — stylish, purple shirt, blond hair, scarf
    this.makeTexture('dad-pawel', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.PAWEL_SHIRT,
        COL.BLOND_HAIR,
        COL.SLIPPER,
        COL.SCARF_PINK,
        0xbb80e8,
      );
      this.drawPixelMap(gfx, MAP_PAWEL, palette, V);
    });

    // Default 'dad' alias — copy gary by re-drawing it under the 'dad' key
    this.makeTexture('dad', W, H, (gfx) => {
      const palette = makeDadPalette(
        COL.GARY_SHIRT,
        COL.BROWN_HAIR,
        COL.SLIPPER,
        COL.MUSTACHE,
        0x6aacf0,
      );
      this.drawPixelMap(gfx, MAP_GARY, palette, V);
    });
  }

  // ── Item generation ─────────────────────────────────────────────────────

  private generateItems(): void {
    this.generatePancake();
    this.generatePan();
  }

  /** Pancake — 32×12 golden-brown disc with edge darkening and centre highlight. */
  private generatePancake(): void {
    this.makeTexture('pancake', 32, 12, (gfx) => {
      // Outer edge (darkest)
      gfx.fillStyle(COL.PANCAKE_EDGE);
      gfx.fillEllipse(16, 6, 32, 12);

      // Main body (golden)
      gfx.fillStyle(COL.PANCAKE_MID);
      gfx.fillEllipse(16, 6, 28, 9);

      // Centre highlight strip
      gfx.fillStyle(COL.PANCAKE_HIGH);
      gfx.fillEllipse(16, 5, 18, 5);

      // Single bright specular fleck
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(11, 3, 3, 2);
    });
  }

  /** Pan — 56×20 isometric-ish top view with body, rim, and wooden handle.
   *  Drawn as: handle on right, dark body, lighter rim sheen on left edge. */
  private generatePan(): void {
    this.makeTexture('pan', 56, 20, (gfx) => {
      // Shadow / depth underside
      gfx.fillStyle(COL.PAN_SHADOW);
      gfx.fillRoundedRect(2, 6, 40, 14, 4);

      // Pan body top face
      gfx.fillStyle(COL.PAN_BODY);
      gfx.fillRoundedRect(0, 3, 40, 13, 4);

      // Left-edge sheen (isometric highlight)
      gfx.fillStyle(COL.PAN_SHEEN);
      gfx.fillRect(2, 5, 4, 9);

      // Interior cooking surface (slightly lighter)
      gfx.fillStyle(0x444444);
      gfx.fillEllipse(18, 9, 28, 8);

      // Handle — dark wood rod
      gfx.fillStyle(COL.HANDLE_DARK);
      gfx.fillRect(40, 7, 16, 6);

      // Handle highlight (top grain line)
      gfx.fillStyle(COL.HANDLE);
      gfx.fillRect(40, 7, 16, 3);

      // Handle end cap
      gfx.fillStyle(COL.HANDLE_DARK);
      gfx.fillRect(52, 6, 4, 8);
    });
  }

  // ── Particle textures ───────────────────────────────────────────────────

  private generateParticles(): void {
    // Generic spark — white centre fading to yellow edges
    this.makeTexture('particle', 8, 8, (gfx) => {
      gfx.fillStyle(COL.SPARK_YELLOW);
      gfx.fillRect(0, 0, 8, 8);
      gfx.fillStyle(COL.SPARK_WHITE);
      gfx.fillRect(2, 2, 4, 4);
      // Bright core
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(3, 3, 2, 2);
    });

    // Flame particle — orange/red diamond shape
    this.makeTexture('particle-flame', 8, 8, (gfx) => {
      // Red outer
      gfx.fillStyle(COL.FLAME_RED);
      gfx.fillRect(3, 0, 2, 2);
      gfx.fillRect(1, 2, 6, 2);
      gfx.fillRect(0, 4, 8, 2);
      gfx.fillRect(1, 6, 6, 2);
      // Orange inner
      gfx.fillStyle(COL.FLAME_ORANGE);
      gfx.fillRect(2, 2, 4, 4);
      // Bright yellow core tip
      gfx.fillStyle(COL.SPARK_YELLOW);
      gfx.fillRect(3, 3, 2, 2);
    });

    // Splat particle — yellow pancake-batter blob with irregular edges
    this.makeTexture('particle-splat', 8, 8, (gfx) => {
      gfx.fillStyle(COL.SPLAT_YELLOW);
      // Main blob
      gfx.fillRect(1, 2, 6, 4);
      gfx.fillRect(2, 1, 4, 6);
      // Drip extensions (batter runs)
      gfx.fillRect(0, 3, 2, 2);
      gfx.fillRect(6, 3, 2, 2);
      gfx.fillRect(3, 0, 2, 2);
      // Slightly lighter centre
      gfx.fillStyle(0xffe9a0);
      gfx.fillRect(3, 3, 2, 2);
    });
  }

  // ── Background generation ───────────────────────────────────────────────

  private generateBackgrounds(): void {
    this.generateBgApartment();
    this.generateBgSuburban();
    this.generateBgOpenPlan();
    this.generateBgHoliday();
    this.generateBgCompetition();
  }

  /** Draw shared background structure (wall + ceiling strip + counter bank).
   *  Returns the Y positions used so callers can overlay their details. */
  private drawKitchenBase(
    gfx: Phaser.GameObjects.Graphics,
    wallColor: number,
    _floorColor: number,
    tileColor: number,
    ceilingColor: number,
    counterColor: number,
    counterDark: number,
  ): { ceilingH: number; counterY: number; floorY: number } {
    const W = 1280;
    const H = 720;
    const ceilingH = 32;
    const counterY = H - 240;
    const floorY = H - 80;

    // Ceiling strip
    gfx.fillStyle(ceilingColor);
    gfx.fillRect(0, 0, W, ceilingH);

    // Wall
    gfx.fillStyle(wallColor);
    gfx.fillRect(0, ceilingH, W, counterY - ceilingH);

    // Counter / cabinet bank
    gfx.fillStyle(counterDark);
    gfx.fillRect(0, counterY, W, 16); // counter top shadow
    gfx.fillStyle(counterColor);
    gfx.fillRect(0, counterY + 16, W, H - counterY - 16 - (H - floorY));

    // Floor tiles
    gfx.fillStyle(tileColor);
    gfx.fillRect(0, floorY, W, H - floorY);
    // Tile grout lines horizontal
    gfx.fillStyle(COL.TILE_GROUT);
    for (let ty = floorY + 40; ty < H; ty += 40) {
      gfx.fillRect(0, ty, W, 2);
    }
    // Tile grout lines vertical
    for (let tx = 40; tx < W; tx += 40) {
      gfx.fillRect(tx, floorY, 2, H - floorY);
    }

    return { ceilingH, counterY, floorY };
  }

  /** Draw a simple blocky window at (wx, wy) with width ww, height wh. */
  private drawWindow(
    gfx: Phaser.GameObjects.Graphics,
    wx: number,
    wy: number,
    ww: number,
    wh: number,
    skyColor: number,
    frameColor: number,
  ): void {
    // Frame border
    const FRAME = 6;
    gfx.fillStyle(frameColor);
    gfx.fillRect(wx, wy, ww, wh);
    // Sky / glass
    gfx.fillStyle(skyColor);
    gfx.fillRect(wx + FRAME, wy + FRAME, ww - FRAME * 2, wh - FRAME * 2);
    // Cross dividers
    gfx.fillStyle(frameColor);
    gfx.fillRect(wx + ww / 2 - 3, wy + FRAME, 6, wh - FRAME * 2);
    gfx.fillRect(wx + FRAME, wy + wh / 2 - 3, ww - FRAME * 2, 6);
  }

  /** Draw cabinet door panels in a bank. */
  private drawCabinetDoors(
    gfx: Phaser.GameObjects.Graphics,
    startX: number,
    startY: number,
    doorW: number,
    doorH: number,
    count: number,
    bodyColor: number,
    darkColor: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const dx = startX + i * (doorW + 4);
      gfx.fillStyle(bodyColor);
      gfx.fillRect(dx, startY, doorW, doorH);
      // Inset panel
      gfx.fillStyle(darkColor);
      gfx.fillRect(dx + 4, startY + 4, doorW - 8, doorH - 8);
      gfx.fillStyle(bodyColor);
      gfx.fillRect(dx + 6, startY + 6, doorW - 12, doorH - 12);
      // Tiny handle dot
      gfx.fillStyle(0x888888);
      gfx.fillRect(dx + doorW - 10, startY + doorH / 2 - 2, 4, 4);
    }
  }

  private generateBgApartment(): void {
    this.makeTexture('bg-apartment', 1280, 720, (gfx) => {
      const { ceilingH, counterY } = this.drawKitchenBase(
        gfx,
        COL.BG_APARTMENT_WALL,
        COL.BG_APARTMENT_FLOOR,
        COL.BG_APARTMENT_TILE,
        0xe8d0b0,
        COL.CABINET,
        COL.CABINET_DARK,
      );

      // Small cozy window centre (positioned between left and right cabinet banks)
      this.drawWindow(gfx, 460, ceilingH + 60, 200, 160, 0xb0d8f0, COL.WINDOW_FRAME);
      // Hint of curtains
      gfx.fillStyle(0xd4a0a0);
      gfx.fillRect(460, ceilingH + 60, 20, 160);
      gfx.fillRect(640, ceilingH + 60, 20, 160);

      // Upper cabinets left
      this.drawCabinetDoors(gfx, 20, ceilingH + 20, 80, 100, 3, COL.CABINET, COL.CABINET_DARK);
      // Upper cabinets right
      this.drawCabinetDoors(gfx, 900, ceilingH + 20, 80, 100, 4, COL.CABINET, COL.CABINET_DARK);

      // Counter lower cabinet doors
      this.drawCabinetDoors(gfx, 20, counterY + 20, 80, 140, 5, COL.CABINET, COL.CABINET_DARK);
      this.drawCabinetDoors(gfx, 700, counterY + 20, 80, 140, 6, COL.CABINET, COL.CABINET_DARK);

      // Counter top surface line
      gfx.fillStyle(0xf0e0c8);
      gfx.fillRect(0, counterY, 1280, 10);
    });
  }

  private generateBgSuburban(): void {
    this.makeTexture('bg-suburban', 1280, 720, (gfx) => {
      const { ceilingH, counterY, floorY } = this.drawKitchenBase(
        gfx,
        COL.BG_SUBURBAN_WALL,
        COL.BG_SUBURBAN_FLOOR,
        COL.BG_SUBURBAN_TILE,
        0xd8e8fe,
        0xd4c0a8,
        0xb8a490,
      );

      // Big picture window centre — suburban family kitchen
      this.drawWindow(gfx, 440, ceilingH + 40, 400, 200, COL.WINDOW_SKY, 0x7a5430);
      // Trees visible through window
      gfx.fillStyle(0x4a8040);
      gfx.fillRect(490, ceilingH + 120, 30, 100);
      gfx.fillStyle(0x2a6020);
      gfx.fillEllipse(505, ceilingH + 100, 60, 70);

      // Island counter in scene centre
      gfx.fillStyle(0xc0a888);
      gfx.fillRect(380, floorY - 80, 520, 80);
      gfx.fillStyle(0xe8d4b8);
      gfx.fillRect(380, floorY - 84, 520, 8);

      // Upper cabinets
      this.drawCabinetDoors(gfx, 20, ceilingH + 20, 80, 100, 2, 0xd4c0a8, 0xb8a490);
      this.drawCabinetDoors(gfx, 1000, ceilingH + 20, 80, 100, 3, 0xd4c0a8, 0xb8a490);
      // Lower base cabinets
      this.drawCabinetDoors(gfx, 20, counterY + 16, 80, 140, 4, 0xd4c0a8, 0xb8a490);
      this.drawCabinetDoors(gfx, 800, counterY + 16, 80, 140, 5, 0xd4c0a8, 0xb8a490);

      // Counter top
      gfx.fillStyle(0xf0e8d8);
      gfx.fillRect(0, counterY, 1280, 10);
    });
  }

  private generateBgOpenPlan(): void {
    this.makeTexture('bg-open-plan', 1280, 720, (gfx) => {
      const { ceilingH, counterY, floorY } = this.drawKitchenBase(
        gfx,
        COL.BG_OPEN_WALL,
        COL.BG_OPEN_FLOOR,
        COL.BG_OPEN_TILE,
        0xf0f0f0,
        0xe8e8e8,
        0xd8d8d8,
      );

      // Floor — white marble with thin grey veins
      gfx.fillStyle(0xfafafa);
      gfx.fillRect(0, floorY, 1280, 720 - floorY);
      gfx.fillStyle(0xe0e0e0);
      for (let vx = 0; vx < 1280; vx += 80) {
        gfx.fillRect(vx, floorY, 1, 720 - floorY); // vertical vein
      }
      gfx.fillStyle(0xdddddd);
      gfx.fillRect(0, floorY, 1280, 2);

      // Large floor-to-ceiling windows right wall
      gfx.fillStyle(0xd0e8f8);
      gfx.fillRect(900, ceilingH, 360, counterY - ceilingH);
      // Window frame
      gfx.fillStyle(0xcccccc);
      gfx.fillRect(900, ceilingH, 6, counterY - ceilingH);
      gfx.fillRect(1080, ceilingH, 6, counterY - ceilingH);
      gfx.fillRect(1254, ceilingH, 6, counterY - ceilingH);
      gfx.fillRect(900, (ceilingH + counterY) / 2, 360, 4);

      // Pendant lights hanging from ceiling
      for (let px = 320; px < 800; px += 160) {
        gfx.fillStyle(0xcccccc);
        gfx.fillRect(px - 1, ceilingH, 2, 60); // cord
        gfx.fillStyle(0xffffcc);
        gfx.fillEllipse(px, ceilingH + 70, 28, 20); // shade
        gfx.fillStyle(COL.SPARK_YELLOW);
        gfx.fillEllipse(px, ceilingH + 68, 10, 10); // bulb glow
      }

      // Sleek white cabinets — handleless
      this.drawCabinetDoors(gfx, 20, ceilingH + 20, 90, 100, 3, 0xf8f8f8, 0xe8e8e8);
      this.drawCabinetDoors(gfx, 20, counterY + 16, 90, 140, 4, 0xf8f8f8, 0xe8e8e8);

      // Marble counter top
      gfx.fillStyle(0xf5f5f5);
      gfx.fillRect(0, counterY, 900, 12);
      // Marble vein on counter
      gfx.fillStyle(0xe0e0e0);
      gfx.fillRect(100, counterY, 200, 2);
      gfx.fillRect(400, counterY, 150, 2);
    });
  }

  private generateBgHoliday(): void {
    this.makeTexture('bg-holiday', 1280, 720, (gfx) => {
      const { ceilingH, counterY } = this.drawKitchenBase(
        gfx,
        COL.BG_HOLIDAY_WALL,
        COL.BG_HOLIDAY_FLOOR,
        0x8b6010,
        0xaa1111,
        0xcc5522,
        0xaa3300,
      );

      // Snow outside window
      this.drawWindow(gfx, 300, ceilingH + 50, 240, 180, COL.BG_HOLIDAY_SNOW, 0x663300);
      // Snow drifts on window sill
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(300, ceilingH + 210, 240, 20);

      // Christmas tree in right corner
      const treeX = 1000;
      const treeY = counterY - 220;
      gfx.fillStyle(0x115500);
      gfx.fillTriangle(treeX, treeY, treeX - 80, treeY + 220, treeX + 80, treeY + 220);
      gfx.fillStyle(0x228822);
      gfx.fillTriangle(treeX, treeY + 40, treeX - 60, treeY + 180, treeX + 60, treeY + 180);
      // Trunk
      gfx.fillStyle(0x8b4513);
      gfx.fillRect(treeX - 10, treeY + 210, 20, 30);
      // Baubles on tree
      const baubleColors = [0xe74c3c, 0xf0c040, 0x3498db, 0xe74c3c, 0xf0c040];
      const baublePositions = [
        [treeX - 30, treeY + 90], [treeX + 20, treeY + 120],
        [treeX - 10, treeY + 60], [treeX + 40, treeY + 160],
        [treeX - 40, treeY + 150],
      ];
      baublePositions.forEach(([bx, by], i) => {
        gfx.fillStyle(baubleColors[i]);
        gfx.fillEllipse(bx, by, 12, 12);
      });
      // Star on top
      gfx.fillStyle(COL.HEADBAND);
      gfx.fillRect(treeX - 6, treeY - 10, 12, 12);

      // Fairy lights along ceiling
      const lightColors = [0xe74c3c, 0xf0c040, 0x27ae60, 0x3498db, 0xe74c3c];
      for (let li = 0; li < 32; li++) {
        gfx.fillStyle(0x444444);
        gfx.fillRect(li * 40 + 10, ceilingH + 2, 30, 2); // wire
        gfx.fillStyle(lightColors[li % lightColors.length]);
        gfx.fillEllipse(li * 40 + 20, ceilingH + 12, 10, 14); // bulb
      }

      // Green wreath on left wall
      gfx.fillStyle(0x228822);
      gfx.fillEllipse(80, ceilingH + 120, 80, 80);
      gfx.fillStyle(COL.BG_HOLIDAY_WALL);
      gfx.fillEllipse(80, ceilingH + 120, 40, 40);
      gfx.fillStyle(0xe74c3c);
      gfx.fillEllipse(80, ceilingH + 85, 12, 12); // bow

      // Festive cabinet doors
      this.drawCabinetDoors(gfx, 20, counterY + 16, 80, 140, 3, 0xcc5522, 0xaa3300);
      this.drawCabinetDoors(gfx, 700, counterY + 16, 80, 140, 4, 0xcc5522, 0xaa3300);
    });
  }

  private generateBgCompetition(): void {
    this.makeTexture('bg-competition', 1280, 720, (gfx) => {
      // Dark TV studio — deep navy background
      gfx.fillStyle(COL.BG_COMP_WALL);
      gfx.fillRect(0, 0, 1280, 720);

      const ceilingH = 32;
      const counterY = 480;
      const floorY = 640;

      // Ceiling rig / lighting grid
      gfx.fillStyle(0x1e1e30);
      gfx.fillRect(0, 0, 1280, ceilingH + 24);
      // Horizontal truss bars
      gfx.fillStyle(0x444466);
      gfx.fillRect(0, ceilingH, 1280, 8);
      gfx.fillRect(0, ceilingH + 16, 1280, 4);
      // Vertical truss struts
      for (let tx = 0; tx < 1280; tx += 80) {
        gfx.fillStyle(0x444466);
        gfx.fillRect(tx, ceilingH, 4, 28);
      }

      // Spotlights (warm cones pointing at stage)
      const spotPositions = [200, 440, 640, 840, 1080];
      spotPositions.forEach((sx) => {
        // Cone of light (triangle approximated by filled tri)
        gfx.fillStyle(0x332800);
        gfx.fillTriangle(sx, ceilingH + 28, sx - 80, floorY, sx + 80, floorY);
        // Brighter inner cone
        gfx.fillStyle(0x554010);
        gfx.fillTriangle(sx, ceilingH + 28, sx - 40, floorY - 80, sx + 40, floorY - 80);
        // Spotlight housing
        gfx.fillStyle(0x888888);
        gfx.fillRect(sx - 10, ceilingH + 16, 20, 16);
        // Lens
        gfx.fillStyle(COL.BG_COMP_SPOT);
        gfx.fillEllipse(sx, ceilingH + 32, 16, 10);
      });

      // Stage floor
      gfx.fillStyle(0x22223a);
      gfx.fillRect(0, floorY, 1280, 720 - floorY);
      // Stage floor highlight lines (glossy)
      gfx.fillStyle(0x33334e);
      for (let fy = floorY + 20; fy < 720; fy += 20) {
        gfx.fillRect(0, fy, 1280, 1);
      }

      // Counter/bench area — competition kitchen bench
      gfx.fillStyle(0x1a1a30);
      gfx.fillRect(0, counterY, 1280, floorY - counterY);
      // Bench surface (glossy dark grey)
      gfx.fillStyle(0x303050);
      gfx.fillRect(0, counterY, 1280, 12);

      // Camera silhouettes flanking the stage
      const drawCamera = (cx: number, cy: number, flip: boolean): void => {
        const dir = flip ? -1 : 1;
        // Tripod legs
        gfx.fillStyle(0x333333);
        gfx.fillRect(cx - 2, cy + 30, 4, 80);            // centre leg
        gfx.fillRect(cx + dir * 20, cy + 60, 4, 50);     // outer leg
        gfx.fillRect(cx - dir * 20, cy + 60, 4, 50);     // inner leg
        // Camera body
        gfx.fillStyle(0x444444);
        gfx.fillRect(cx - 20, cy, 40, 30);
        // Lens
        gfx.fillStyle(0x111111);
        gfx.fillEllipse(cx + dir * 18, cy + 15, 18, 18);
        gfx.fillStyle(0x333399);
        gfx.fillEllipse(cx + dir * 18, cy + 15, 10, 10);
        // Red recording light
        gfx.fillStyle(0xff0000);
        gfx.fillRect(cx - 16, cy + 4, 6, 6);
      };
      drawCamera(80, counterY - 120, false);
      drawCamera(1200, counterY - 120, true);

      // Audience silhouettes at far back (simple rows of oval heads)
      gfx.fillStyle(0x18182a);
      for (let ai = 0; ai < 30; ai++) {
        const ax = 40 + ai * 42;
        gfx.fillEllipse(ax, ceilingH + 80, 22, 28); // head
        gfx.fillRect(ax - 12, ceilingH + 92, 24, 30); // shoulders
      }

      // Scoreboard / TV monitor (top centre)
      gfx.fillStyle(0x111122);
      gfx.fillRect(520, ceilingH + 40, 240, 100);
      gfx.fillStyle(0x222244);
      gfx.fillRect(524, ceilingH + 44, 232, 92);
      gfx.fillStyle(COL.SPARK_YELLOW);
      gfx.fillRect(544, ceilingH + 54, 80, 12); // score bar
      gfx.fillRect(544, ceilingH + 74, 60, 8);  // label bar
    });
  }

  // ── Button generation ───────────────────────────────────────────────────

  private generateButtons(): void {
    this.generateButton('btn-primary', COL.BTN_PRIMARY, COL.BTN_PRIMARY_LIGHT, COL.BTN_PRIMARY_DARK);
    this.generateButton('btn-secondary', COL.BTN_SECONDARY, COL.BTN_SECONDARY_LIGHT, COL.BTN_SECONDARY_DARK);
  }

  /** Beveled 3D-style button at 200×60. */
  private generateButton(key: string, base: number, light: number, dark: number): void {
    this.makeTexture(key, 200, 60, (gfx) => {
      const BEVEL = 6;
      const R = 8; // corner radius

      // Bottom/right shadow face (3D depth)
      gfx.fillStyle(dark);
      gfx.fillRoundedRect(BEVEL, BEVEL, 200 - BEVEL, 60 - BEVEL, R);

      // Main face
      gfx.fillStyle(base);
      gfx.fillRoundedRect(0, 0, 200 - BEVEL, 60 - BEVEL, R);

      // Top-left highlight bevel
      gfx.fillStyle(light);
      gfx.fillRoundedRect(0, 0, 200 - BEVEL, BEVEL, { tl: R, tr: R, bl: 0, br: 0 });
      gfx.fillRoundedRect(0, 0, BEVEL, 60 - BEVEL, { tl: R, tr: 0, bl: R, br: 0 });
    });
  }

  // ── Hazard textures ─────────────────────────────────────────────────────

  private generateHazards(): void {
    this.generateHazardCat();
    this.generateHazardToys();
    this.generateHazardPuddle();
    this.generateHazardDecorations();
    this.generateHazardCables();
  }

  /** Cat — 32×24, cute orange tabby silhouette sitting. */
  private generateHazardCat(): void {
    this.makeTexture('hazard-cat', 32, 24, (gfx) => {
      // Body — rounded blob
      gfx.fillStyle(COL.CAT_ORANGE);
      gfx.fillEllipse(16, 16, 24, 16);

      // Head — circle on top-left of body
      gfx.fillEllipse(12, 8, 18, 16);

      // Ear triangles
      gfx.fillTriangle(6, 4, 2, -2, 10, 2);
      gfx.fillTriangle(18, 4, 14, -2, 22, 2);

      // Lighter chest / muzzle
      gfx.fillStyle(COL.CAT_LIGHT);
      gfx.fillEllipse(12, 10, 10, 8);

      // Eyes
      gfx.fillStyle(COL.EYE);
      gfx.fillRect(8, 5, 3, 3);
      gfx.fillRect(14, 5, 3, 3);

      // Tail arc (right side)
      gfx.fillStyle(COL.CAT_ORANGE);
      gfx.fillRect(24, 12, 6, 4);
      gfx.fillRect(28, 8, 4, 6);

      // Nose
      gfx.fillStyle(0xff9999);
      gfx.fillRect(11, 9, 2, 2);
    });
  }

  /** Scattered toy blocks — 32×16. */
  private generateHazardToys(): void {
    this.makeTexture('hazard-toys', 32, 16, (gfx) => {
      // Block 1 — red cube left
      gfx.fillStyle(COL.TOY_RED);
      gfx.fillRect(0, 4, 12, 12);
      gfx.fillStyle(0xf56060);
      gfx.fillRect(0, 4, 12, 3); // top sheen
      gfx.fillStyle(0xaa2222);
      gfx.fillRect(0, 12, 12, 4); // front shadow
      // Letter 'A' dot
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(4, 7, 4, 5);

      // Block 2 — blue cube middle
      gfx.fillStyle(COL.TOY_BLUE);
      gfx.fillRect(14, 6, 10, 10);
      gfx.fillStyle(0x60aaee);
      gfx.fillRect(14, 6, 10, 3);
      gfx.fillStyle(0x1a6aa8);
      gfx.fillRect(14, 13, 10, 3);
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(18, 9, 3, 4);

      // Block 3 — yellow cube right (tipped on side)
      gfx.fillStyle(COL.TOY_YELLOW);
      gfx.fillRect(26, 8, 6, 8);
      gfx.fillStyle(0xffe060);
      gfx.fillRect(26, 8, 6, 2);
    });
  }

  /** Water puddle — 40×12, oval spill with lighter highlight. */
  private generateHazardPuddle(): void {
    this.makeTexture('hazard-puddle', 40, 12, (gfx) => {
      // Outer edge (darker)
      gfx.fillStyle(COL.PUDDLE_DARK);
      gfx.fillEllipse(20, 6, 40, 12);
      // Main puddle body
      gfx.fillStyle(COL.PUDDLE);
      gfx.fillEllipse(20, 6, 36, 9);
      // Specular highlight
      gfx.fillStyle(0xd0eeff);
      gfx.fillEllipse(14, 4, 12, 5);
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(12, 3, 4, 2);
    });
  }

  /** Christmas ornament on floor — 32×20, red bauble with gold cap and string. */
  private generateHazardDecorations(): void {
    this.makeTexture('hazard-decorations', 32, 20, (gfx) => {
      // String
      gfx.fillStyle(COL.CABLE_MID);
      gfx.fillRect(15, 0, 2, 4);

      // Gold cap
      gfx.fillStyle(COL.ORNAMENT_GOLD);
      gfx.fillRect(12, 4, 8, 4);

      // Bauble body
      gfx.fillStyle(COL.ORNAMENT_RED);
      gfx.fillEllipse(16, 13, 24, 18);

      // Sheen
      gfx.fillStyle(0xff7070);
      gfx.fillEllipse(12, 9, 8, 7);
      gfx.fillStyle(COL.WHITE);
      gfx.fillRect(10, 8, 3, 3);

      // Gold stripe band
      gfx.fillStyle(COL.ORNAMENT_GOLD);
      gfx.fillRect(5, 13, 22, 3);
    });
  }

  /** Tangled camera cables — 40×8, chunky wavy lines. */
  private generateHazardCables(): void {
    this.makeTexture('hazard-cables', 40, 8, (gfx) => {
      // Cable 1 — dark thick
      gfx.fillStyle(COL.CABLE_DARK);
      gfx.fillRect(0, 1, 40, 3);
      // Cable 2 — mid grey, offset wave
      gfx.fillStyle(COL.CABLE_MID);
      gfx.fillRect(0, 4, 16, 3);
      gfx.fillRect(14, 2, 6, 4); // cross-over bump
      gfx.fillRect(18, 4, 22, 3);
      // Connector plug end
      gfx.fillStyle(0x888888);
      gfx.fillRect(36, 2, 4, 6);
      gfx.fillStyle(0xcccccc);
      gfx.fillRect(37, 3, 2, 4);
    });
  }

  // ── Floor tile ──────────────────────────────────────────────────────────

  /** Kitchen tile floor strip — 1280×80.
   *  Warm cream tiles with grout lines, subtle shading on left edge. */
  private generateFloor(): void {
    this.makeTexture('floor-tile', 1280, 80, (gfx) => {
      const TILE_W = 80;
      const TILE_H = 40;
      const GROUT = 3;

      // Base fill
      gfx.fillStyle(COL.TILE_LIGHT);
      gfx.fillRect(0, 0, 1280, 80);

      // Alternating tile shading (checkerboard subtle)
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 1280 / TILE_W; col++) {
          const isEven = (row + col) % 2 === 0;
          gfx.fillStyle(isEven ? COL.TILE_LIGHT : COL.TILE_DARK);
          gfx.fillRect(
            col * TILE_W + GROUT,
            row * TILE_H + GROUT,
            TILE_W - GROUT * 2,
            TILE_H - GROUT * 2,
          );
        }
      }

      // Grout lines — horizontal
      gfx.fillStyle(COL.TILE_GROUT);
      gfx.fillRect(0, 0, 1280, GROUT);
      gfx.fillRect(0, TILE_H, 1280, GROUT);
      gfx.fillRect(0, TILE_H * 2 - GROUT, 1280, GROUT);

      // Grout lines — vertical
      for (let vx = 0; vx < 1280; vx += TILE_W) {
        gfx.fillRect(vx, 0, GROUT, 80);
      }

      // Top-edge shadow strip (where floor meets wall)
      gfx.fillStyle(0xb0a090);
      gfx.fillRect(0, 0, 1280, 4);

      // Left shading stripe (adds faint depth)
      gfx.fillStyle(0xc8b8a8);
      gfx.fillRect(0, 0, 6, 80);
    });
  }
}
