// GameScene — main 90-second gameplay scene
// See PancakeDad_GDD_v02_Browser.md section 3.1

import Phaser from 'phaser';
import { SCENE_KEYS, GameEvent, GAME_CONFIG, ComboState, AudienceStage } from '../types/game';
import { Dad } from '../entities/Dad';
import { Pancake } from '../entities/Pancake';
import { Pan } from '../entities/Pan';
import { InputManager } from '../systems/InputManager';
import { TrickSystem } from '../systems/TrickSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { SpecialMeterSystem } from '../systems/SpecialMeterSystem';
import { AudienceMeterSystem } from '../systems/AudienceMeterSystem';

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

  // HUD text references (placeholder — will be replaced by UI agent's HUD components)
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private meterText!: Phaser.GameObjects.Text;

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

    // Kitchen background
    this.cameras.main.setBackgroundColor('#f5e6d0');

    // Floor
    this.floor = this.add.rectangle(width / 2, height - 40, width, 80, 0x8b7355);
    this.physics.add.existing(this.floor, true); // static body

    // Create entities
    this.dad = new Dad(this, width * 0.3, height - 120);
    this.pan = new Pan(this, this.dad);
    this.pancake = new Pancake(this, width * 0.3, height - 160);

    // Physics collisions
    this.physics.add.collider(this.dad, this.floor as unknown as Phaser.GameObjects.GameObject);
    this.physics.add.collider(this.pancake, this.floor as unknown as Phaser.GameObjects.GameObject, () => {
      this.pancake.onHitFloor();
    });

    // Create systems
    this.inputManager = new InputManager(this);
    this.trickSystem = new TrickSystem(this, this.dad, this.pancake);
    this.comboSystem = new ComboSystem(this);
    this.specialMeterSystem = new SpecialMeterSystem(this);
    this.audienceMeterSystem = new AudienceMeterSystem(this);

    // Placeholder HUD
    this.createPlaceholderHUD();

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

    // Emit run start
    this.events.emit(GameEvent.RUN_START);
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    const actions = this.inputManager.getActiveActions();
    this.dad.handleInput(actions, delta);
    this.pancake.update(time, delta);
    this.pan.update();
    this.trickSystem.update(actions, delta);
    this.audienceMeterSystem.update(delta);

    // Check pancake catch/drop
    this.checkPancakeCatch();
  }

  private createPlaceholderHUD(): void {
    const { width } = this.cameras.main;

    this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#1a1a2e',
    }).setScrollFactor(0).setDepth(100);

    this.timerText = this.add.text(width / 2, 16, `TIME: ${this.timeRemaining}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#1a1a2e',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.comboText = this.add.text(width / 2, 80, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '36px',
      color: '#e74c3c',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);

    this.meterText = this.add.text(width - 16, 16, 'AUDIENCE: Watching', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#1a1a2e',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  private wireEvents(): void {
    this.events.on(GameEvent.TRICK_COMPLETE, (result: { score: number }) => {
      this.comboSystem.onTrickComplete(result.score);
      this.specialMeterSystem.onTrickComplete();
      this.audienceMeterSystem.onTrickComplete();
    });

    this.events.on(GameEvent.COMBO_UPDATE, (state: ComboState) => {
      this.score = state.bankedScore + state.totalScore;
      this.scoreText.setText(`SCORE: ${this.score}`);
      if (state.chain > 0) {
        this.comboText.setText(`x${state.multiplier} COMBO (${state.chain} chain)`);
        this.comboText.setAlpha(1);
      }
    });

    this.events.on(GameEvent.COMBO_BREAK, () => {
      this.comboText.setText('DROPPED!');
      this.time.delayedCall(1000, () => this.comboText.setAlpha(0));
    });

    this.events.on(GameEvent.PANCAKE_CAUGHT, () => {
      this.comboText.setText('CAUGHT!');
      this.time.delayedCall(800, () => this.comboText.setAlpha(0));
    });

    this.events.on(GameEvent.AUDIENCE_STAGE_CHANGE, (stage: AudienceStage) => {
      this.meterText.setText(`AUDIENCE: ${stage}`);
    });

    this.events.on(GameEvent.SCORE_UPDATE, (newScore: number) => {
      this.score = newScore;
      this.scoreText.setText(`SCORE: ${this.score}`);
    });
  }

  private onTimerTick(): void {
    this.timeRemaining--;
    this.timerText.setText(`TIME: ${this.timeRemaining}`);

    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#e74c3c');
    }

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
    const currentHigh = this.registry.get('highScore') ?? 0;
    if (finalScore > currentHigh) {
      this.registry.set('highScore', finalScore);
    }

    this.events.emit(GameEvent.RUN_END, { score: finalScore });
    this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore });
  }

  private setupTabFocusHandling(): void {
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      if (!this.isPaused) {
        this.isPaused = true;
        this.timerEvent.paused = true;
        this.physics.pause();
        this.events.emit(GameEvent.RUN_PAUSED);
      }
    });

    this.game.events.on(Phaser.Core.Events.FOCUS, () => {
      if (this.isPaused) {
        this.isPaused = false;
        this.timerEvent.paused = false;
        this.physics.resume();
        this.events.emit(GameEvent.RUN_RESUMED);
      }
    });
  }
}
