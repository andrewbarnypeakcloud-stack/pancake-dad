// ShopScreen — pan/slipper tabs, buy/equip states, Dad Bucks balance
// See PancakeDad_GDD_v02_Browser.md sections 5.2, 5.3

import Phaser from 'phaser';
import { SCENE_KEYS } from '../../types/game';
import { UI_COLORS, ShopTab, ShopItemState } from '../../types/ui';

/** Shop item definition — in production loaded from src/data/ JSON */
interface ShopItemInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effect: string;
  readonly cost: number;
  readonly tab: ShopTab;
}

/** Placeholder shop items matching GDD sections 5.2 and 5.3 */
const SHOP_ITEMS: ShopItemInfo[] = [
  // Pans
  { id: 'pan_starter', name: 'Non-stick Starter', description: 'Your trusty first pan', effect: 'No bonus', cost: 0, tab: 'pans' },
  { id: 'pan_castiron', name: 'Cast Iron Pro', description: 'Heavy but reliable', effect: '+15% catch radius', cost: 500, tab: 'pans' },
  { id: 'pan_carbon', name: 'Carbon Steel Racer', description: 'Light and responsive', effect: '+10% flip speed', cost: 800, tab: 'pans' },
  { id: 'pan_titanium', name: 'Titanium Competition', description: 'Professional grade', effect: '+20% catch + speed', cost: 2000, tab: 'pans' },
  { id: 'pan_heirloom', name: 'The Heirloom', description: 'Grandma would be proud', effect: '+Style on every trick', cost: -1, tab: 'pans' },
  // Slippers
  { id: 'slip_terry', name: 'Terry Cloth Classic', description: 'Standard dad issue', effect: 'No bonus', cost: 0, tab: 'slippers' },
  { id: 'slip_rubber', name: 'Rubber Sole Grip', description: 'No more sliding', effect: 'Better landing stability', cost: 400, tab: 'slippers' },
  { id: 'slip_velvet', name: 'Velvet Spinners', description: 'Smooth as silk', effect: '+Spin speed, style bonus', cost: 900, tab: 'slippers' },
  { id: 'slip_memory', name: 'Memory Foam 3000', description: 'Cloud walking tech', effect: '+20% Special fill rate', cost: 1800, tab: 'slippers' },
];

/** Item card dimensions */
const CARD_WIDTH = 240;
const CARD_HEIGHT = 110;
const CARD_GAP = 16;
const CARDS_PER_ROW = 3;

/** Shop screen — two tabs for pans and slippers with buy/equip states. */
export class ShopScreen extends Phaser.GameObjects.Container {
  private activeTab: ShopTab = 'pans';
  private itemCardsContainer: Phaser.GameObjects.Container;
  private balanceText: Phaser.GameObjects.Text;
  private panTabButton: Phaser.GameObjects.Rectangle;
  private panTabText: Phaser.GameObjects.Text;
  private slipperTabButton: Phaser.GameObjects.Rectangle;
  private slipperTabText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const { width, height } = scene.cameras.main;

    // ── Title ──
    const title = scene.add.text(width / 2, height * 0.06, 'SHOP', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '36px',
      color: '#f5a623',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5, 0.5);
    this.add(title);

    // ── Dad Bucks Balance ──
    const dadBucks = scene.registry.get('dadBucks') ?? 0;
    this.balanceText = scene.add.text(width - 20, height * 0.06, `${dadBucks} DB`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#f5a623',
    });
    this.balanceText.setOrigin(1, 0.5);
    this.add(this.balanceText);

    // ── Tabs ──
    const tabY = height * 0.14;

    this.panTabButton = scene.add.rectangle(width / 2 - 80, tabY, 140, 36, UI_COLORS.PRIMARY);
    this.panTabButton.setInteractive({ useHandCursor: true });
    this.add(this.panTabButton);

    this.panTabText = scene.add.text(width / 2 - 80, tabY, 'PANS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#1a1a2e',
    });
    this.panTabText.setOrigin(0.5, 0.5);
    this.add(this.panTabText);

    this.slipperTabButton = scene.add.rectangle(width / 2 + 80, tabY, 140, 36, UI_COLORS.SECONDARY);
    this.slipperTabButton.setInteractive({ useHandCursor: true });
    this.add(this.slipperTabButton);

    this.slipperTabText = scene.add.text(width / 2 + 80, tabY, 'SLIPPERS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    this.slipperTabText.setOrigin(0.5, 0.5);
    this.add(this.slipperTabText);

    this.panTabButton.on('pointerdown', () => this.switchTab('pans'));
    this.slipperTabButton.on('pointerdown', () => this.switchTab('slippers'));

    // ── Item Cards Container ──
    this.itemCardsContainer = scene.add.container(0, 0);
    this.add(this.itemCardsContainer);

    // ── Back Button ──
    const backBtn = scene.add.rectangle(80, height * 0.06, 120, 36, UI_COLORS.SECONDARY);
    backBtn.setInteractive({ useHandCursor: true });
    this.add(backBtn);

    const backText = scene.add.text(80, height * 0.06, 'BACK', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    backText.setOrigin(0.5, 0.5);
    this.add(backText);

    backBtn.on('pointerover', () => backBtn.setFillStyle(UI_COLORS.SECONDARY_HOVER));
    backBtn.on('pointerout', () => backBtn.setFillStyle(UI_COLORS.SECONDARY));
    backBtn.on('pointerdown', () => {
      scene.scene.start(SCENE_KEYS.MENU);
    });

    // Set depth and add to scene
    this.setDepth(50);
    scene.add.existing(this);

    // Render initial tab
    this.renderItems();
  }

  private switchTab(tab: ShopTab): void {
    this.activeTab = tab;

    if (tab === 'pans') {
      this.panTabButton.setFillStyle(UI_COLORS.PRIMARY);
      this.panTabText.setColor('#1a1a2e');
      this.slipperTabButton.setFillStyle(UI_COLORS.SECONDARY);
      this.slipperTabText.setColor('#ffffff');
    } else {
      this.slipperTabButton.setFillStyle(UI_COLORS.PRIMARY);
      this.slipperTabText.setColor('#1a1a2e');
      this.panTabButton.setFillStyle(UI_COLORS.SECONDARY);
      this.panTabText.setColor('#ffffff');
    }

    this.renderItems();
  }

  private renderItems(): void {
    this.itemCardsContainer.removeAll(true);

    const { width, height } = this.scene.cameras.main;
    const items = SHOP_ITEMS.filter((item) => item.tab === this.activeTab);

    const totalWidth = CARDS_PER_ROW * CARD_WIDTH + (CARDS_PER_ROW - 1) * CARD_GAP;
    const startX = (width - totalWidth) / 2 + CARD_WIDTH / 2;
    const startY = height * 0.24;

    items.forEach((item, index) => {
      const col = index % CARDS_PER_ROW;
      const row = Phaser.Math.FloorTo(index / CARDS_PER_ROW);
      const x = startX + col * (CARD_WIDTH + CARD_GAP);
      const y = startY + row * (CARD_HEIGHT + CARD_GAP);

      const card = this.createItemCard(item, x, y);
      this.itemCardsContainer.add(card);
    });
  }

  private createItemCard(item: ShopItemInfo, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const state = this.getItemState(item);

    // Card background
    const bgColor = state === 'equipped' ? 0x2a4a2a : 0x222233;
    const bg = this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, bgColor);
    bg.setStrokeStyle(2, state === 'equipped' ? UI_COLORS.SUCCESS : 0x444466);
    container.add(bg);

    // Item name
    const nameText = this.scene.add.text(-CARD_WIDTH / 2 + 12, -CARD_HEIGHT / 2 + 10, item.name, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      color: state === 'locked' ? '#666666' : '#ffffff',
    });
    nameText.setOrigin(0, 0);
    container.add(nameText);

    // Description
    const descText = this.scene.add.text(-CARD_WIDTH / 2 + 12, -CARD_HEIGHT / 2 + 30, item.description, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#999999',
    });
    descText.setOrigin(0, 0);
    container.add(descText);

    // Effect
    const effectText = this.scene.add.text(-CARD_WIDTH / 2 + 12, -CARD_HEIGHT / 2 + 48, item.effect, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#88ccff',
    });
    effectText.setOrigin(0, 0);
    container.add(effectText);

    // Action button / status
    const buttonY = CARD_HEIGHT / 2 - 20;

    if (state === 'equipped') {
      const equippedText = this.scene.add.text(0, buttonY, 'EQUIPPED', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '12px',
        color: '#27ae60',
      });
      equippedText.setOrigin(0.5, 0.5);
      container.add(equippedText);
    } else if (state === 'owned') {
      const equipBtn = this.scene.add.rectangle(0, buttonY, 80, 26, UI_COLORS.SUCCESS);
      equipBtn.setInteractive({ useHandCursor: true });
      container.add(equipBtn);

      const equipText = this.scene.add.text(0, buttonY, 'EQUIP', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
      });
      equipText.setOrigin(0.5, 0.5);
      container.add(equipText);

      equipBtn.on('pointerdown', () => this.onEquip(item));
    } else if (state === 'available') {
      const costDisplay = item.cost > 0 ? `BUY - ${item.cost} DB` : 'FREE';
      const buyBtn = this.scene.add.rectangle(0, buttonY, 100, 26, UI_COLORS.PRIMARY);
      buyBtn.setInteractive({ useHandCursor: true });
      container.add(buyBtn);

      const buyText = this.scene.add.text(0, buttonY, costDisplay, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '11px',
        color: '#1a1a2e',
      });
      buyText.setOrigin(0.5, 0.5);
      container.add(buyText);

      buyBtn.on('pointerover', () => buyBtn.setFillStyle(UI_COLORS.PRIMARY_HOVER));
      buyBtn.on('pointerout', () => buyBtn.setFillStyle(UI_COLORS.PRIMARY));
      buyBtn.on('pointerdown', () => this.onBuy(item));
    } else {
      // Locked
      const lockText = this.scene.add.text(0, buttonY, 'CHALLENGE UNLOCK', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#ff6666',
      });
      lockText.setOrigin(0.5, 0.5);
      container.add(lockText);
    }

    return container;
  }

  private getItemState(item: ShopItemInfo): ShopItemState {
    // Check registry for owned/equipped state
    const ownedItems: string[] = this.scene.registry.get('ownedItems') ?? ['pan_starter', 'slip_terry'];
    const equippedPan: string = this.scene.registry.get('equippedPan') ?? 'pan_starter';
    const equippedSlipper: string = this.scene.registry.get('equippedSlipper') ?? 'slip_terry';

    if (item.id === equippedPan || item.id === equippedSlipper) {
      return 'equipped';
    }
    if (ownedItems.includes(item.id)) {
      return 'owned';
    }
    if (item.cost < 0) {
      return 'locked'; // Challenge unlock items
    }
    return 'available';
  }

  private onBuy(item: ShopItemInfo): void {
    const dadBucks: number = this.scene.registry.get('dadBucks') ?? 0;
    if (dadBucks < item.cost) return; // Not enough funds

    // Deduct cost
    this.scene.registry.set('dadBucks', dadBucks - item.cost);
    this.balanceText.setText(`${dadBucks - item.cost} DB`);

    // Add to owned items
    const ownedItems: string[] = this.scene.registry.get('ownedItems') ?? ['pan_starter', 'slip_terry'];
    ownedItems.push(item.id);
    this.scene.registry.set('ownedItems', ownedItems);

    // Refresh display
    this.renderItems();

    // Purchase pop effect on balance
    this.scene.tweens.add({
      targets: this.balanceText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  private onEquip(item: ShopItemInfo): void {
    if (item.tab === 'pans') {
      this.scene.registry.set('equippedPan', item.id);
    } else {
      this.scene.registry.set('equippedSlipper', item.id);
    }

    // Refresh display
    this.renderItems();
  }
}
