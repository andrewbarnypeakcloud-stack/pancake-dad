// CharacterSelect — 5 dad portraits, stats preview, lock/unlock states
// See PancakeDad_GDD_v02_Browser.md section 4

import Phaser from 'phaser';
import { SCENE_KEYS } from '../../types/game';
import { UI_COLORS, UI_TEXT_STYLES, CharacterPortraitState } from '../../types/ui';

/** Dad definition for the character select screen.
 *  In production this would come from src/data/ loaded JSON. */
interface DadSelectInfo {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly stats: {
    readonly speed: number;
    readonly spin: number;
    readonly precision: number;
    readonly airTime: number;
    readonly power: number;
  };
  readonly signatureTrick: string;
  readonly unlockCondition: string;
  readonly isUnlocked: boolean;
  readonly portraitColor: number;
}

/** Placeholder dad roster — matches GDD section 4 */
const DAD_ROSTER: DadSelectInfo[] = [
  {
    id: 'gary',
    name: 'GARY',
    archetype: 'The Classic Dad',
    stats: { speed: 3, spin: 3, precision: 3, airTime: 3, power: 3 },
    signatureTrick: 'Perfect Flip',
    unlockCondition: 'Default',
    isUnlocked: true,
    portraitColor: 0x4a90d9,
  },
  {
    id: 'tomasz',
    name: 'TOMASZ',
    archetype: 'The Energetic Dad',
    stats: { speed: 5, spin: 4, precision: 2, airTime: 2, power: 2 },
    signatureTrick: 'Double Pirouette Catch',
    unlockCondition: 'Score 30,000 in one run',
    isUnlocked: false,
    portraitColor: 0xe74c3c,
  },
  {
    id: 'kenji',
    name: 'KENJI',
    archetype: 'The Precise Dad',
    stats: { speed: 2, spin: 2, precision: 5, airTime: 3, power: 3 },
    signatureTrick: 'Iron Pan Zero-Splash',
    unlockCondition: 'Complete 3 challenges',
    isUnlocked: false,
    portraitColor: 0x27ae60,
  },
  {
    id: 'marcus',
    name: 'MARCUS',
    archetype: 'The Showman',
    stats: { speed: 2, spin: 3, precision: 2, airTime: 5, power: 4 },
    signatureTrick: 'The Smokestack 900',
    unlockCondition: 'Score 75,000 in one run',
    isUnlocked: false,
    portraitColor: 0xf5a623,
  },
  {
    id: 'pawel',
    name: 'PAWEL',
    archetype: 'The Slipper King',
    stats: { speed: 3, spin: 5, precision: 3, airTime: 2, power: 2 },
    signatureTrick: 'Full Kitchen Lap Blind Catch',
    unlockCondition: 'Equip max slipper upgrade',
    isUnlocked: false,
    portraitColor: 0x9b59b6,
  },
];

/** Portrait card dimensions */
const PORTRAIT_WIDTH = 100;
const PORTRAIT_HEIGHT = 120;
const PORTRAIT_GAP = 20;
const STAT_BAR_WIDTH = 120;
const STAT_BAR_HEIGHT = 10;

/** Character select screen — shows 5 dad portraits with stats and lock states.
 *  Placeholder rectangles for portraits (real sprites come from art pipeline). */
export class CharacterSelect extends Phaser.GameObjects.Container {
  private portraits: Phaser.GameObjects.Container[] = [];
  private statsPanel: Phaser.GameObjects.Container;
  private selectedDadId: string = 'gary';
  private selectButton: Phaser.GameObjects.Rectangle;
  private selectButtonText: Phaser.GameObjects.Text;
  private backButton: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const { width, height } = scene.cameras.main;

    // ── Title ──
    const title = scene.add.text(width / 2, height * 0.08, 'CHOOSE YOUR DAD', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5, 0.5);
    this.add(title);

    // ── Portraits Row ──
    const totalPortraitWidth = DAD_ROSTER.length * PORTRAIT_WIDTH + (DAD_ROSTER.length - 1) * PORTRAIT_GAP;
    const startX = (width - totalPortraitWidth) / 2 + PORTRAIT_WIDTH / 2;

    DAD_ROSTER.forEach((dad, index) => {
      const x = startX + index * (PORTRAIT_WIDTH + PORTRAIT_GAP);
      const y = height * 0.28;
      const portrait = this.createPortrait(scene, x, y, dad);
      this.portraits.push(portrait);
      this.add(portrait);
    });

    // ── Stats Panel ──
    this.statsPanel = scene.add.container(width / 2, height * 0.58);
    this.add(this.statsPanel);
    this.updateStatsPanel(DAD_ROSTER[0]);

    // ── Select Button ──
    this.selectButton = scene.add.rectangle(width / 2, height * 0.85, 200, 50, UI_COLORS.PRIMARY);
    this.selectButton.setInteractive({ useHandCursor: true });
    this.add(this.selectButton);

    this.selectButtonText = scene.add.text(width / 2, height * 0.85, 'SELECT', UI_TEXT_STYLES.BUTTON);
    this.selectButtonText.setOrigin(0.5, 0.5);
    this.add(this.selectButtonText);

    this.selectButton.on('pointerover', () => this.selectButton.setFillStyle(UI_COLORS.PRIMARY_HOVER));
    this.selectButton.on('pointerout', () => this.selectButton.setFillStyle(UI_COLORS.PRIMARY));
    this.selectButton.on('pointerdown', () => this.onSelectClicked());

    // ── Back Button ──
    this.backButton = scene.add.rectangle(80, height * 0.08, 120, 36, UI_COLORS.SECONDARY);
    this.backButton.setInteractive({ useHandCursor: true });
    this.add(this.backButton);

    const backText = scene.add.text(80, height * 0.08, 'BACK', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    backText.setOrigin(0.5, 0.5);
    this.add(backText);

    this.backButton.on('pointerover', () => this.backButton.setFillStyle(UI_COLORS.SECONDARY_HOVER));
    this.backButton.on('pointerout', () => this.backButton.setFillStyle(UI_COLORS.SECONDARY));
    this.backButton.on('pointerdown', () => {
      scene.scene.start(SCENE_KEYS.MENU);
    });

    // Set depth
    this.setDepth(50);

    // Add to scene
    scene.add.existing(this);
  }

  private createPortrait(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dad: DadSelectInfo
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const state: CharacterPortraitState = dad.isUnlocked
      ? (dad.id === this.selectedDadId ? 'selected' : 'available')
      : 'locked';

    // Portrait background rectangle (placeholder for real sprite)
    const bgColor = dad.isUnlocked ? dad.portraitColor : 0x333333;
    const bg = scene.add.rectangle(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, bgColor);
    bg.setStrokeStyle(3, state === 'selected' ? UI_COLORS.PRIMARY : 0x666666);
    container.add(bg);

    // Dad initial letter (placeholder for portrait sprite)
    const initial = scene.add.text(0, -10, dad.name.charAt(0), {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '36px',
      color: dad.isUnlocked ? '#ffffff' : '#555555',
    });
    initial.setOrigin(0.5, 0.5);
    container.add(initial);

    // Name label below portrait
    const nameText = scene.add.text(0, PORTRAIT_HEIGHT / 2 + 10, dad.name, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '13px',
      color: dad.isUnlocked ? '#ffffff' : '#666666',
    });
    nameText.setOrigin(0.5, 0);
    container.add(nameText);

    // Archetype label
    const archetypeText = scene.add.text(0, PORTRAIT_HEIGHT / 2 + 28, dad.archetype, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#999999',
    });
    archetypeText.setOrigin(0.5, 0);
    container.add(archetypeText);

    // Lock icon overlay
    if (!dad.isUnlocked) {
      const lockOverlay = scene.add.rectangle(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, 0x000000, 0.5);
      container.add(lockOverlay);

      const lockIcon = scene.add.text(0, 0, 'LOCKED', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '12px',
        color: '#ff4444',
      });
      lockIcon.setOrigin(0.5, 0.5);
      container.add(lockIcon);
    }

    // Make interactive if unlocked
    if (dad.isUnlocked) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        if (dad.id !== this.selectedDadId) {
          bg.setStrokeStyle(3, UI_COLORS.PRIMARY_HOVER);
        }
      });
      bg.on('pointerout', () => {
        if (dad.id !== this.selectedDadId) {
          bg.setStrokeStyle(3, 0x666666);
        }
      });
      bg.on('pointerdown', () => {
        this.selectDad(dad);
      });
    }

    // Store dad ID on the container for lookup
    container.setData('dadId', dad.id);

    return container;
  }

  private selectDad(dad: DadSelectInfo): void {
    this.selectedDadId = dad.id;

    // Update portrait borders
    this.portraits.forEach((portrait) => {
      const dadId = portrait.getData('dadId') as string;
      const bg = portrait.getAt(0) as Phaser.GameObjects.Rectangle;
      if (dadId === dad.id) {
        bg.setStrokeStyle(3, UI_COLORS.PRIMARY);
      } else {
        bg.setStrokeStyle(3, 0x666666);
      }
    });

    // Scale-pop the selected portrait
    const selectedPortrait = this.portraits.find(
      (p) => p.getData('dadId') === dad.id
    );
    if (selectedPortrait) {
      this.scene.tweens.add({
        targets: selectedPortrait,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut',
        yoyo: true,
      });
    }

    // Update stats panel
    this.updateStatsPanel(dad);
  }

  private updateStatsPanel(dad: DadSelectInfo): void {
    // Clear existing children
    this.statsPanel.removeAll(true);

    const statNames: Array<{ key: keyof typeof dad.stats; label: string }> = [
      { key: 'speed', label: 'SPEED' },
      { key: 'spin', label: 'SPIN' },
      { key: 'precision', label: 'PRECISION' },
      { key: 'airTime', label: 'AIR TIME' },
      { key: 'power', label: 'POWER' },
    ];

    // Stats title
    const panelTitle = this.scene.add.text(0, -20, `${dad.name} - ${dad.archetype}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    panelTitle.setOrigin(0.5, 0.5);
    this.statsPanel.add(panelTitle);

    // Stat bars
    statNames.forEach((stat, index) => {
      const y = 10 + index * 26;
      const value = dad.stats[stat.key];

      // Stat label
      const label = this.scene.add.text(-STAT_BAR_WIDTH - 10, y, stat.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#aaaaaa',
      });
      label.setOrigin(1, 0.5);
      this.statsPanel.add(label);

      // Stat bar background
      const barBg = this.scene.add.rectangle(0, y, STAT_BAR_WIDTH, STAT_BAR_HEIGHT, 0x333333);
      barBg.setOrigin(0, 0.5);
      this.statsPanel.add(barBg);

      // Stat bar fill (max 5)
      const fillWidth = (value / 5) * STAT_BAR_WIDTH;
      const barFill = this.scene.add.rectangle(0, y, fillWidth, STAT_BAR_HEIGHT, UI_COLORS.PRIMARY);
      barFill.setOrigin(0, 0.5);
      this.statsPanel.add(barFill);

      // Value text
      const valueText = this.scene.add.text(STAT_BAR_WIDTH + 8, y, `${value}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#ffffff',
      });
      valueText.setOrigin(0, 0.5);
      this.statsPanel.add(valueText);
    });

    // Signature trick
    const sigY = 10 + statNames.length * 26 + 16;
    const sigLabel = this.scene.add.text(0, sigY, `Signature: ${dad.signatureTrick}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#f5a623',
      fontStyle: 'italic',
    });
    sigLabel.setOrigin(0.5, 0);
    this.statsPanel.add(sigLabel);

    // Unlock condition (if locked)
    if (!dad.isUnlocked) {
      const unlockLabel = this.scene.add.text(0, sigY + 24, `Unlock: ${dad.unlockCondition}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#ff6666',
      });
      unlockLabel.setOrigin(0.5, 0);
      this.statsPanel.add(unlockLabel);
    }
  }

  private onSelectClicked(): void {
    const selectedDad = DAD_ROSTER.find((d) => d.id === this.selectedDadId);
    if (!selectedDad || !selectedDad.isUnlocked) return;

    // Store selection in registry for GameScene to read
    this.scene.registry.set('selectedDad', this.selectedDadId);

    // Transition to game
    this.scene.cameras.main.fadeOut(200, 0, 0, 0);
    this.scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.scene.start(SCENE_KEYS.GAME);
      }
    );
  }
}
