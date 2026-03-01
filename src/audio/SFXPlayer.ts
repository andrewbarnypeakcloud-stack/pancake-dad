// SFXPlayer — plays sound effects with pitch variation, sprite support, and pooling
// See .claude/agents/audio-engineer.md for SFX specifications
// See PancakeDad_GDD_v02_Browser.md section 7.4

import { Howl } from 'howler';
import { SFXEntry, PlaySFXOptions, PitchVariation } from '../types';

/** Maximum number of concurrent Howl instances per SFX key (sound pooling) */
const MAX_POOL_SIZE = 5;

/** Minimum playback rate allowed by Howler.js */
const MIN_RATE = 0.5;

/** Maximum playback rate allowed by Howler.js */
const MAX_RATE = 4.0;

/**
 * SFXPlayer handles sound effect playback with:
 * - Pitch variation (randomized within a configured range)
 * - Audio sprite support for bundled sounds
 * - Sound pooling to prevent excessive overlapping
 */
export class SFXPlayer {
  private readonly howls: Map<string, Howl> = new Map();
  private readonly entries: Map<string, SFXEntry> = new Map();
  private readonly activeSounds: Map<string, number[]> = new Map();
  private sfxVolume: number = 0.8;
  private masterVolume: number = 1.0;

  /**
   * Register all SFX entries and create Howl instances.
   * Called once during AudioManager initialization.
   */
  loadEntries(sfxEntries: Record<string, SFXEntry>): void {
    for (const [key, entry] of Object.entries(sfxEntries)) {
      this.entries.set(key, entry);

      const spriteDefinitions: Record<string, [number, number]> | undefined =
        entry.sprite
          ? this.convertSpriteMap(entry.sprite)
          : undefined;

      const howl = new Howl({
        src: [...entry.src],
        volume: this.computeVolume(entry.volume),
        preload: true,
        pool: MAX_POOL_SIZE,
        sprite: spriteDefinitions,
        onend: (soundId: number) => {
          this.removeFromActive(key, soundId);
        },
      });

      this.howls.set(key, howl);
      this.activeSounds.set(key, []);
    }
  }

  /**
   * Play a sound effect by key.
   * Applies pitch variation (either from entry config or override).
   * Enforces sound pooling to prevent overlapping.
   */
  play(key: string, options?: PlaySFXOptions): number | null {
    const howl = this.howls.get(key);
    const entry = this.entries.get(key);

    if (!howl || !entry) {
      return null;
    }

    // Sound pooling: limit concurrent instances per key
    const activeIds = this.activeSounds.get(key);
    if (activeIds && activeIds.length >= MAX_POOL_SIZE) {
      // Stop the oldest sound to make room
      const oldestId = activeIds.shift();
      if (oldestId !== undefined) {
        howl.stop(oldestId);
      }
    }

    // Compute volume with overrides
    const volume = options?.volume !== undefined
      ? this.clampVolume(options.volume * this.sfxVolume * this.masterVolume)
      : this.computeVolume(entry.volume);

    howl.volume(volume);

    // Play (with optional sprite name)
    const soundId = options?.sprite
      ? howl.play(options.sprite)
      : howl.play();

    // Apply pitch variation
    const pitch = this.resolvePitch(options?.pitch, entry.pitchVariation);
    if (pitch !== 1.0) {
      howl.rate(pitch, soundId);
    }

    // Track active sounds
    if (activeIds) {
      activeIds.push(soundId);
    }

    return soundId;
  }

  /**
   * Play a trick SFX with pitch variation based on spin speed.
   * Higher spin speed = higher pitch (GDD 7.4: pitch varies with spin speed).
   */
  playTrickSFX(spinSpeed: number): number | null {
    // Map spin speed to pitch: slow spin = 0.8, fast spin = 1.3
    const pitch = clamp(0.8 + (spinSpeed * 0.1), MIN_RATE, MAX_RATE);
    return this.play('flip_whoosh', { pitch });
  }

  /**
   * Play combo ding with pitch that rises with multiplier.
   * GDD spec: C, D, E, F, G, A, B for x1-x7+ (semitone steps).
   */
  playComboDing(multiplier: number): number | null {
    // Map multiplier 1-7+ to semitone offsets: each semitone is 2^(1/12) ratio
    const semitones = clamp(multiplier - 1, 0, 6);
    const pitch = Math.pow(2, semitones / 12);
    return this.play('combo_ding', { pitch });
  }

  /** Stop all active sounds for a given key */
  stop(key: string): void {
    const howl = this.howls.get(key);
    if (howl) {
      howl.stop();
    }
    const activeIds = this.activeSounds.get(key);
    if (activeIds) {
      activeIds.length = 0;
    }
  }

  /** Stop all playing SFX */
  stopAll(): void {
    for (const [key, howl] of this.howls) {
      howl.stop();
      const activeIds = this.activeSounds.get(key);
      if (activeIds) {
        activeIds.length = 0;
      }
    }
  }

  /** Update the SFX volume multiplier (0-1) */
  setSFXVolume(volume: number): void {
    this.sfxVolume = clamp(volume, 0, 1);
    this.updateAllVolumes();
  }

  /** Update the master volume multiplier (0-1) */
  setMasterVolume(volume: number): void {
    this.masterVolume = clamp(volume, 0, 1);
    this.updateAllVolumes();
  }

  /** Mute or unmute all SFX */
  mute(muted: boolean): void {
    for (const howl of this.howls.values()) {
      howl.mute(muted);
    }
  }

  /** Unload all Howl instances to free memory */
  destroy(): void {
    for (const howl of this.howls.values()) {
      howl.unload();
    }
    this.howls.clear();
    this.entries.clear();
    this.activeSounds.clear();
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /** Resolve the final pitch rate from an explicit override or entry's variation range */
  private resolvePitch(
    override: number | undefined,
    variation: PitchVariation | undefined,
  ): number {
    if (override !== undefined) {
      return clamp(override, MIN_RATE, MAX_RATE);
    }
    if (variation) {
      const randomPitch = variation.min + Math.random() * (variation.max - variation.min);
      return clamp(randomPitch, MIN_RATE, MAX_RATE);
    }
    return 1.0;
  }

  /** Compute effective volume = entry volume * sfx volume * master volume */
  private computeVolume(entryVolume: number): number {
    return this.clampVolume(entryVolume * this.sfxVolume * this.masterVolume);
  }

  /** Clamp a volume value to [0, 1] */
  private clampVolume(value: number): number {
    return clamp(value, 0, 1);
  }

  /** Update volumes on all loaded Howl instances */
  private updateAllVolumes(): void {
    for (const [key, howl] of this.howls) {
      const entry = this.entries.get(key);
      if (entry) {
        howl.volume(this.computeVolume(entry.volume));
      }
    }
  }

  /** Remove a sound ID from the active tracking list */
  private removeFromActive(key: string, soundId: number): void {
    const activeIds = this.activeSounds.get(key);
    if (activeIds) {
      const index = activeIds.indexOf(soundId);
      if (index !== -1) {
        activeIds.splice(index, 1);
      }
    }
  }

  /** Convert our AudioSpriteMap format to Howler's SoundSpriteDefinitions */
  private convertSpriteMap(
    spriteMap: Record<string, { start: number; duration: number }>,
  ): Record<string, [number, number]> {
    const result: Record<string, [number, number]> = {};
    for (const [name, def] of Object.entries(spriteMap)) {
      result[name] = [def.start, def.duration];
    }
    return result;
  }
}

/** Utility: clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
