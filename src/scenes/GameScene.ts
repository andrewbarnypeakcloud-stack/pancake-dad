// GameScene — main 90-second gameplay scene with full system integration
// See PancakeDad_GDD_v02_Browser.md section 3.1
// Integration tasks: P4-02, P4-03, P4-04, P4-05

import Phaser from 'phaser';
import { SCENE_KEYS, GameEvent, GAME_CONFIG, ComboState, AudienceStage, DadPhysicsProfile, TrickResult } from '../types/game';
import { ECONOMY_CONFIG, DEFAULT_PROGRESSION } from '../types/content';
import type { SaveData } from '../types/platform';
import { DEFAULT_AUDIO_SETTINGS } from '../types/audio';
import { Dad, DEFAULT_PHYSICS } from '../entities/Dad';
import { Pancake } from '../entities/Pancake';
import { Pan } from '../entities/Pan';
import { Hazard } from '../entities/Hazard';
import { InputManager } from '../systems/InputManager';
import { TrickSystem } from '../systems/TrickSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { SpecialMeterSystem } from '../systems/SpecialMeterSystem';
import { AudienceMeterSystem } from '../systems/AudienceMeterSystem';
import { ChallengeTracker } from '../systems/ChallengeTracker';
import { DataLoader } from '../data/DataLoader';
import { AudioManager } from '../audio/AudioManager';
import { AudioEventBridge } from '../audio/AudioEventBridge';
import { PersistenceManager } from '../utils/PersistenceManager';
import { AutoSaveManager } from '../utils/AutoSaveManager';

// HUD components (P4-03)
import { ScoreDisplay } from '../ui/hud/ScoreDisplay';
import { TimerDisplay } from '../ui/hud/TimerDisplay';
import { ComboDisplay } from '../ui/hud/ComboDisplay';
import { AudienceMeterUI } from '../ui/hud/AudienceMeterUI';
import { SpecialMeterUI } from '../ui/hud/SpecialMeterUI';
import { PauseMenu } from '../ui/menus/PauseMenu';
import { ParticleManager } from '../ui/effects/ParticleManager';
import { ScreenEffects } from '../ui/effects/ScreenEffects';

export class GameScene extends Phaser.Scene {
  private dad!: Dad;
  private pancake!: Pancake;
  private pan!: Pan;
  private inputManager!: InputManager;
  private trickSystem!: TrickSystem;
  private comboSystem!: ComboSystem;
  private specialMeterSystem!: SpecialMeterSystem;
  private audienceMeterSystem!: AudienceMeterSystem;

  private timeRemaining: number = GAME_CONFIG.RUN_DURATION_SECONDS;
  private timerEvent!: Phaser.Time.TimerEvent;
  private score: number = 0;
  private isPaused: boolean = false;
  private tricksLanded: number = 0;
  private maxCombo: number = 0;

  // HUD components (event-driven, stored for lifecycle management)
  private pauseMenu!: PauseMenu;
  private particleManager!: ParticleManager;
  private screenEffects!: ScreenEffects;

  // Floor
  private floor!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.score = 0;
    this.timeRemaining = GAME_CONFIG.RUN_DURATION_SECONDS;
    this.isPaused = false;
    this.tricksLanded = 0;
    this.maxCombo = 0;

    // Read selected level and dad from registry
    const selectedLevel = (this.registry.get('selectedLevel') as string) ?? 'the-apartment';
    const equippedDadId = (this.registry.get('equippedDad') as string) ?? 'gary';
    const equippedPanId = (this.registry.get('equippedPan') as string) ?? 'non-stick-starter';
    const equippedSlippersId = (this.registry.get('equippedSlippers') as string) ?? 'terry-cloth-classic';

    // Level background — use voxel-generated bg texture
    const bgKey = `bg-${selectedLevel.replace('the-', '')}`;
    if (this.textures.exists(bgKey)) {
      this.add.image(width / 2, height / 2, bgKey);
    } else {
      this.cameras.main.setBackgroundColor('#f5e6d0');
    }

    // Floor tile
    if (this.textures.exists('floor-tile')) {
      this.add.image(width / 2, height - 40, 'floor-tile');
    } else {
      this.add.rectangle(width / 2, height - 40, width, 80, 0x8b7355);
    }
    this.floor = this.add.rectangle(width / 2, height - 40, width, 80, 0x000000, 0);
    this.physics.add.existing(this.floor, true);

    // Create entities — apply equipped dad's physics profile
    this.dad = new Dad(this, width * 0.3, height - 120);
    const dataLoader = DataLoader.getInstance(this);
    const dadDef = dataLoader.getDad(equippedDadId);
    if (dadDef) {
      const resolvedProfile: DadPhysicsProfile = {
        speed: DEFAULT_PHYSICS.speed * dadDef.stats.speed,
        jumpForce: DEFAULT_PHYSICS.jumpForce * dadDef.stats.jumpForce,
        spinRate: DEFAULT_PHYSICS.spinRate * dadDef.stats.spinRate,
        airTime: DEFAULT_PHYSICS.airTime * dadDef.stats.airTime,
        gravityScale: DEFAULT_PHYSICS.gravityScale * dadDef.stats.gravityScale,
      };
      this.dad.setPhysicsProfile(resolvedProfile);
      const dadTextureKey = `dad-${equippedDadId}`;
      if (this.textures.exists(dadTextureKey)) {
        this.dad.setTexture(dadTextureKey);
      }
    }

    this.pan = new Pan(this, this.dad);
    this.pancake = new Pancake(this, width * 0.3, height - 160);

    // Apply equipment effects
    const panItem = dataLoader.getShopItem(equippedPanId);
    if (panItem?.effect?.['catchRadius']) {
      this.pan.setCatchRadius(30 * (1 + panItem.effect['catchRadius']));
    }
    const slipperItem = dataLoader.getShopItem(equippedSlippersId);

    // Physics collisions
    this.physics.add.collider(this.dad, this.floor as unknown as Phaser.GameObjects.GameObject);
    this.physics.add.collider(this.pancake, this.floor as unknown as Phaser.GameObjects.GameObject, () => {
      this.pancake.onHitFloor();
      // Reset pancake to dad's current position after delay
      this.time.delayedCall(500, () => {
        this.pancake.resetToPan(this.pan.x, this.pan.y - 10);
      });
    });

    // Spawn hazard based on level definition
    const levelDef = dataLoader.getLevel(selectedLevel);
    if (levelDef?.hazard) {
      const hazard = new Hazard(this, width * 0.7, height - 90, levelDef.hazard);
      hazard.setPatrolBounds(width * 0.4, width * 0.9);
      this.physics.add.overlap(
        this.dad,
        hazard as unknown as Phaser.GameObjects.GameObject,
        () => hazard.onDadOverlap(this.dad)
      );
    }

    // Create systems
    this.inputManager = new InputManager(this);
    this.trickSystem = new TrickSystem(this, this.dad, this.pancake);
    this.comboSystem = new ComboSystem(this);
    this.specialMeterSystem = new SpecialMeterSystem(this);
    this.audienceMeterSystem = new AudienceMeterSystem(this);
    this.comboSystem.setAudienceMeterSystem(this.audienceMeterSystem);

    // Apply slipper fill rate bonus
    if (slipperItem?.effect?.['specialFillRate']) {
      this.specialMeterSystem.setFillRate(1 + slipperItem.effect['specialFillRate']);
    }

    // Wire signature trick for equipped dad
    if (dadDef) {
      const sigTrickContent = dataLoader.getSignatureTrick(equippedDadId);
      if (sigTrickContent) {
        const sigTrick: import('../types/game').TrickDefinition = {
          id: sigTrickContent.id,
          name: sigTrickContent.name,
          inputs: sigTrickContent.input.actions,
          baseScore: sigTrickContent.baseScore,
          description: sigTrickContent.description,
          animationKey: `trick_${sigTrickContent.id}`,
          isSignature: true,
          requiresSpecialMeter: true,
        };
        this.trickSystem.setSignatureTrick(sigTrick, this.specialMeterSystem);
      }
    }

    // Wire challenge tracker
    new ChallengeTracker(this);

    // P4-03: Create HUD components (they self-wire via GameEvent listeners)
    new ScoreDisplay(this);
    new TimerDisplay(this);
    new ComboDisplay(this);
    new AudienceMeterUI(this);
    new SpecialMeterUI(this);
    this.pauseMenu = new PauseMenu(this);
    this.particleManager = new ParticleManager(this);
    this.screenEffects = new ScreenEffects(this);

    // P4-04: Wire AudioEventBridge
    const audioManager = this.registry.get('audioManager') as AudioManager | undefined;
    if (audioManager) {
      new AudioEventBridge(this, audioManager);
      // Start level music using selected level's music key
      const musicLevel = levelDef?.musicKey ?? 'apartment';
      this.events.emit(GameEvent.LEVEL_LOADED, musicLevel);
    }

    // P4-05: Wire auto-save
    const persistence = this.registry.get('persistence') as PersistenceManager | undefined;
    if (persistence) {
      new AutoSaveManager(this, persistence, () => this.buildSaveData());
    }

    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });

    // Wire events
    this.wireEvents();

    // Tab focus handling (P1-21)
    this.setupTabFocusHandling();

    // Pause key (desktop)
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    // Pause button (mobile touch)
    this.events.on('touch:pause', () => this.togglePause());

    // Emit run start
    this.events.emit(GameEvent.RUN_START);

    // Show first-play instructions overlay on mobile
    if (this.inputManager.isMobileDevice()) {
      this.showMobileInstructions();
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    const actions = this.inputManager.getActiveActions();
    this.dad.handleInput(actions, delta);
    this.pan.update();

    // Keep pancake on pan when caught
    if (this.pancake.isCaught()) {
      this.pancake.setPosition(this.pan.x, this.pan.y - 10);
    }

    this.pancake.update(time, delta);
    this.trickSystem.update(actions, delta);
    this.audienceMeterSystem.update(delta);

    // Check pancake catch/drop
    this.checkPancakeCatch();
  }

  private wireEvents(): void {
    this.events.on(GameEvent.TRICK_COMPLETE, (result: TrickResult) => {
      this.comboSystem.onTrickComplete(result.score);
      this.specialMeterSystem.onTrickComplete();
      this.audienceMeterSystem.onTrickComplete();
      this.tricksLanded++;

      // Screen effects for signature tricks
      if (result.trick.isSignature) {
        this.screenEffects.signatureTrickEffect();
      }
    });

    this.events.on(GameEvent.COMBO_UPDATE, (state: ComboState) => {
      this.score = state.bankedScore + state.totalScore;
      this.events.emit(GameEvent.SCORE_UPDATE, this.score);

      if (state.chain > this.maxCombo) {
        this.maxCombo = state.chain;
      }

      // Combo screen shake scales with chain
      if (state.chain > 1) {
        this.screenEffects.comboShake(state.chain);
      }
    });

    this.events.on(GameEvent.COMBO_BREAK, () => {
      this.screenEffects.dropShake();
    });

    this.events.on(GameEvent.PANCAKE_DROPPED, () => {
      this.comboSystem.onPancakeDropped();
    });

    this.events.on(GameEvent.PANCAKE_CAUGHT, () => {
      this.screenEffects.perfectCatchEffect();
    });

    this.events.on(GameEvent.AUDIENCE_STAGE_CHANGE, (_stage: AudienceStage) => {
      // AudienceMeterUI handles its own display via events
    });

    this.events.on(GameEvent.ON_FIRE_START, () => {
      this.particleManager.startFlames(this.dad);
    });

    this.events.on(GameEvent.ON_FIRE_END, () => {
      this.particleManager.stopFlames();
    });

    // Pause/resume from PauseMenu
    this.events.on(GameEvent.RUN_RESUMED, () => {
      this.isPaused = false;
      this.timerEvent.paused = false;
      this.physics.resume();
    });
  }

  private onTimerTick(): void {
    this.timeRemaining--;
    this.events.emit(GameEvent.RUN_TIMER_TICK, this.timeRemaining);

    if (this.timeRemaining <= 0) {
      this.endRun();
    }
  }

  private checkPancakeCatch(): void {
    if (!this.pancake.isAirborne()) return;

    const panBounds = this.pan.getCatchZone();
    const pancakeBounds = this.pancake.getPancakeBounds();

    if (Phaser.Geom.Rectangle.Overlaps(panBounds, pancakeBounds) && this.pancake.isFalling()) {
      this.pancake.onCaught();
      this.comboSystem.onPancakeCaught();
      this.events.emit(GameEvent.PANCAKE_CAUGHT);
    }
  }

  private endRun(): void {
    this.timerEvent.destroy();
    this.comboSystem.bankCombo();
    const finalScore = this.score;

    // Update high score
    const currentHigh: number = this.registry.get('highScore') ?? 0;
    if (finalScore > currentHigh) {
      this.registry.set('highScore', finalScore);
    }

    // Calculate Dad Bucks
    const dadBucksEarned = Phaser.Math.FloorTo(finalScore / ECONOMY_CONFIG.SCORE_DIVISOR);
    const currentBucks: number = this.registry.get('dadBucks') ?? 0;
    this.registry.set('dadBucks', currentBucks + dadBucksEarned);

    // Increment total runs
    const totalRuns: number = this.registry.get('totalRunsPlayed') ?? 0;
    this.registry.set('totalRunsPlayed', totalRuns + 1);

    this.events.emit(GameEvent.RUN_END, { score: finalScore });
    this.events.emit(GameEvent.DAD_BUCKS_EARNED, dadBucksEarned);

    this.scene.start(SCENE_KEYS.GAME_OVER, {
      score: finalScore,
      comboMax: this.maxCombo,
      tricksLanded: this.tricksLanded,
      dadBucksEarned,
    });
  }

  private showMobileInstructions(): void {
    const hasSeenTutorial = localStorage.getItem('pancakeDad_seenMobileTutorial');
    if (hasSeenTutorial) return;

    // Pause the game while instructions are shown
    this.isPaused = true;
    this.timerEvent.paused = true;
    this.physics.pause();
    this.inputManager.getTouchControls()?.hide();

    const { width, height } = this.cameras.main;

    const overlay = this.add.container(0, 0);
    overlay.setDepth(250);
    overlay.setScrollFactor(0);

    // Dim background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
    bg.setInteractive();
    overlay.add(bg);

    // Title
    const title = this.add.text(width / 2, height * 0.1, 'HOW TO PLAY', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#f5a623',
      stroke: '#3D2B1F',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    overlay.add(title);

    // Instructions
    const instructions = [
      { icon: '< >', text: 'ARROWS  \u2014  Move left / right' },
      { icon: 'JUMP', text: 'TAP  \u2014  Jump & flip pancake' },
      { icon: 'GRAB', text: 'HOLD in air  \u2014  Grab trick (+style)' },
      { icon: 'MAN', text: 'HOLD on ground  \u2014  Manual (extend combo)' },
      { icon: '||', text: 'TOP-RIGHT  \u2014  Pause game' },
    ];

    const startY = height * 0.25;
    const lineSpacing = 50;
    instructions.forEach((item, index) => {
      const y = startY + index * lineSpacing;

      // Icon badge
      const badge = this.add.rectangle(width * 0.3, y, 70, 34, 0xf5a623, 0.8)
        .setScrollFactor(0);
      overlay.add(badge);

      const iconText = this.add.text(width * 0.3, y, item.icon, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '14px',
        color: '#3D2B1F',
      }).setOrigin(0.5, 0.5).setScrollFactor(0);
      overlay.add(iconText);

      // Description
      const desc = this.add.text(width * 0.55, y, item.text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0, 0.5).setScrollFactor(0);
      overlay.add(desc);
    });

    // Tip
    const tip = this.add.text(width / 2, height * 0.72, 'TIP: Hold MOVE + JUMP together to SPIN!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f5a623',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    overlay.add(tip);

    // Dismiss prompt
    const tapPrompt = this.add.text(width / 2, height * 0.88, 'TAP ANYWHERE TO START', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    overlay.add(tapPrompt);

    this.tweens.add({
      targets: tapPrompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Dismiss on tap
    bg.on('pointerdown', () => {
      overlay.destroy();
      this.inputManager.getTouchControls()?.show();
      this.isPaused = false;
      this.timerEvent.paused = false;
      this.physics.resume();
      localStorage.setItem('pancakeDad_seenMobileTutorial', '1');
    });
  }

  private togglePause(): void {
    const touchControls = this.inputManager.getTouchControls();
    if (this.isPaused) {
      this.pauseMenu.hide();
      touchControls?.show();
      this.isPaused = false;
      this.timerEvent.paused = false;
      this.physics.resume();
      this.events.emit(GameEvent.RUN_RESUMED);
    } else {
      this.isPaused = true;
      this.timerEvent.paused = true;
      this.physics.pause();
      touchControls?.hide();
      this.pauseMenu.show();
      this.events.emit(GameEvent.RUN_PAUSED);
    }
  }

  private setupTabFocusHandling(): void {
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      if (!this.isPaused) {
        this.isPaused = true;
        this.timerEvent.paused = true;
        this.physics.pause();
        this.pauseMenu.show();
        this.events.emit(GameEvent.RUN_PAUSED);
      }
    });

    this.game.events.on(Phaser.Core.Events.FOCUS, () => {
      // Don't auto-resume — let the player click Resume in PauseMenu
    });
  }

  /** Build a SaveData snapshot from current registry state (for auto-save) */
  private buildSaveData(): SaveData {
    const audioManager = this.registry.get('audioManager') as AudioManager | undefined;

    return {
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
  }
}
