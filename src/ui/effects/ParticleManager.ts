// ParticleManager — flip trail, landing sparkle, drop splat, on-fire flames
// See PancakeDad_GDD_v02_Browser.md section 7.1 (visual style)

import Phaser from 'phaser';
import { GameEvent } from '../../types/game';
import { ParticleConfig } from '../../types/ui';

/** Predefined particle configurations for game effects */
const PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  flipTrail: {
    texture: 'particle',
    speed: { min: 20, max: 60 },
    lifespan: 400,
    scale: { start: 1.0, end: 0.2 },
    quantity: 2,
    tint: 0xdaa520,
    alpha: { start: 0.8, end: 0 },
    gravityY: -20,
  },
  landingSparkle: {
    texture: 'particle',
    speed: { min: 80, max: 160 },
    lifespan: 300,
    scale: { start: 1.2, end: 0 },
    quantity: 12,
    tint: 0xffee88,
    alpha: { start: 1, end: 0 },
    angle: { min: 220, max: 320 },
  },
  dropSplat: {
    texture: 'particle',
    speed: { min: 40, max: 100 },
    lifespan: 500,
    scale: { start: 1.0, end: 0.3 },
    quantity: 8,
    tint: 0x888888,
    alpha: { start: 0.9, end: 0 },
    gravityY: 200,
  },
  onFireFlames: {
    texture: 'particle',
    speed: { min: 30, max: 80 },
    lifespan: 350,
    scale: { start: 1.5, end: 0.3 },
    quantity: 3,
    tint: 0xff4400,
    alpha: { start: 0.9, end: 0 },
    angle: { min: 250, max: 290 },
    gravityY: -100,
  },
  signatureBurst: {
    texture: 'particle',
    speed: { min: 100, max: 250 },
    lifespan: 600,
    scale: { start: 2.0, end: 0 },
    quantity: 24,
    tint: 0xf5a623,
    alpha: { start: 1, end: 0 },
  },
};

/** Manages all particle effects in the game.
 *  Provides methods for triggering specific effects at given positions.
 *  Listens to game events to automatically trigger appropriate effects. */
export class ParticleManager {
  private scene: Phaser.Scene;
  private flameEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private flipTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.scene.events.on(GameEvent.PANCAKE_CAUGHT, this.onPancakeCaught, this);
    this.scene.events.on(GameEvent.PANCAKE_DROPPED, this.onPancakeDropped, this);
    this.scene.events.on(GameEvent.PANCAKE_FLIPPED, this.onPancakeFlipped, this);
    this.scene.events.on(GameEvent.ON_FIRE_START, this.onFireStart, this);
    this.scene.events.on(GameEvent.ON_FIRE_END, this.onFireEnd, this);
    this.scene.events.on(GameEvent.TRICK_COMPLETE, this.onTrickComplete, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Emit a flip trail at the given position (follows the pancake arc) */
  emitFlipTrail(x: number, y: number): void {
    this.emitBurst('flipTrail', x, y);
  }

  /** Emit a landing sparkle burst at the pan position */
  emitLandingSparkle(x: number, y: number): void {
    this.emitBurst('landingSparkle', x, y);
  }

  /** Emit a drop splat at the floor position */
  emitDropSplat(x: number, y: number): void {
    this.emitBurst('dropSplat', x, y);
  }

  /** Emit a signature trick burst */
  emitSignatureBurst(x: number, y: number): void {
    this.emitBurst('signatureBurst', x, y);
  }

  /** Start continuous flame particles around a game object */
  startFlames(target: Phaser.GameObjects.Components.Transform): void {
    this.stopFlames();

    const config = PARTICLE_CONFIGS.onFireFlames;
    this.flameEmitter = this.scene.add.particles(0, 0, config.texture, {
      speed: config.speed,
      lifespan: config.lifespan,
      scale: config.scale,
      quantity: config.quantity,
      tint: config.tint,
      alpha: config.alpha,
      angle: config.angle,
      gravityY: config.gravityY,
      follow: target as unknown as Phaser.Types.Math.Vector2Like,
      frequency: 50,
    });
    this.flameEmitter.setDepth(90);
  }

  /** Stop continuous flame particles */
  stopFlames(): void {
    if (this.flameEmitter) {
      this.flameEmitter.stop();
      // Let existing particles die off, then destroy
      this.scene.time.delayedCall(500, () => {
        if (this.flameEmitter) {
          this.flameEmitter.destroy();
          this.flameEmitter = null;
        }
      });
    }
  }

  /** Start a continuous flip trail that follows a target */
  startFlipTrail(target: Phaser.GameObjects.Components.Transform): void {
    this.stopFlipTrail();

    const config = PARTICLE_CONFIGS.flipTrail;
    this.flipTrailEmitter = this.scene.add.particles(0, 0, config.texture, {
      speed: config.speed,
      lifespan: config.lifespan,
      scale: config.scale,
      quantity: config.quantity,
      tint: config.tint,
      alpha: config.alpha,
      gravityY: config.gravityY,
      follow: target as unknown as Phaser.Types.Math.Vector2Like,
      frequency: 30,
    });
    this.flipTrailEmitter.setDepth(85);
  }

  /** Stop the continuous flip trail */
  stopFlipTrail(): void {
    if (this.flipTrailEmitter) {
      this.flipTrailEmitter.stop();
      this.scene.time.delayedCall(500, () => {
        if (this.flipTrailEmitter) {
          this.flipTrailEmitter.destroy();
          this.flipTrailEmitter = null;
        }
      });
    }
  }

  /** Emit a one-shot burst of particles at a position */
  private emitBurst(configKey: string, x: number, y: number): void {
    const config = PARTICLE_CONFIGS[configKey];
    if (!config) return;

    const emitter = this.scene.add.particles(x, y, config.texture, {
      speed: config.speed,
      lifespan: config.lifespan,
      scale: config.scale,
      quantity: config.quantity,
      tint: config.tint,
      alpha: config.alpha,
      angle: config.angle,
      gravityY: config.gravityY,
      emitting: false,
    });
    emitter.setDepth(95);

    // Explode particles and clean up after lifespan
    emitter.explode(config.quantity, 0, 0);

    this.scene.time.delayedCall(config.lifespan + 100, () => {
      emitter.destroy();
    });
  }

  // ── Event handlers ──

  private onPancakeCaught(): void {
    // Use center of camera as fallback — in real usage, the event would carry position
    const { width, height } = this.scene.cameras.main;
    this.emitLandingSparkle(width * 0.3, height - 120);
  }

  private onPancakeDropped(): void {
    const { width, height } = this.scene.cameras.main;
    this.emitDropSplat(width * 0.3, height - 40);
  }

  private onPancakeFlipped(data?: { x: number; y: number }): void {
    if (data) {
      this.emitFlipTrail(data.x, data.y);
    }
  }

  private onFireStart(): void {
    // Flames will be attached to the Dad entity by the GameScene
    // This handler is here for any additional global fire effects
  }

  private onFireEnd(): void {
    this.stopFlames();
  }

  private onTrickComplete(data?: { isSignature?: boolean; x?: number; y?: number }): void {
    if (data?.isSignature && data.x !== undefined && data.y !== undefined) {
      this.emitSignatureBurst(data.x, data.y);
    }
  }

  destroy(): void {
    if (this.scene) {
      this.scene.events.off(GameEvent.PANCAKE_CAUGHT, this.onPancakeCaught, this);
      this.scene.events.off(GameEvent.PANCAKE_DROPPED, this.onPancakeDropped, this);
      this.scene.events.off(GameEvent.PANCAKE_FLIPPED, this.onPancakeFlipped, this);
      this.scene.events.off(GameEvent.ON_FIRE_START, this.onFireStart, this);
      this.scene.events.off(GameEvent.ON_FIRE_END, this.onFireEnd, this);
      this.scene.events.off(GameEvent.TRICK_COMPLETE, this.onTrickComplete, this);
      this.stopFlames();
      this.stopFlipTrail();
    }
  }
}
