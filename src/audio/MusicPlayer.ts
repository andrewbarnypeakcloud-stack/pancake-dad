// MusicPlayer — per-level loop playback with crossfade support
// See .claude/agents/audio-engineer.md for music specifications
// See PancakeDad_GDD_v02_Browser.md section 7.3

import { Howl } from 'howler';
import { MusicEntry, DEFAULT_CROSSFADE_MS, CrossfadeOptions } from '../types';

/**
 * MusicPlayer manages background music playback:
 * - Per-level looping tracks
 * - Crossfade between tracks when switching levels
 * - Stop, pause, resume with fade support
 * - Volume control integrated with master volume
 */
export class MusicPlayer {
  private readonly howls: Map<string, Howl> = new Map();
  private readonly entries: Map<string, MusicEntry> = new Map();
  private currentKey: string | null = null;
  private currentSoundId: number | null = null;
  private musicVolume: number = 0.6;
  private masterVolume: number = 1.0;
  private paused: boolean = false;

  /**
   * Register all music entries and create Howl instances.
   * Music uses HTML5 Audio for streaming — avoids downloading entire files before playback.
   */
  loadEntries(musicEntries: Record<string, MusicEntry>): void {
    for (const [key, entry] of Object.entries(musicEntries)) {
      this.entries.set(key, entry);

      const howl = new Howl({
        src: [...entry.src],
        volume: this.computeVolume(entry.volume),
        loop: entry.loop,
        html5: true, // Stream music files rather than fully downloading
        preload: false, // Load on demand to save bandwidth
      });

      this.howls.set(key, howl);
    }
  }

  /**
   * Play a music track by key.
   * If another track is playing, crossfade from old to new.
   */
  play(key: string, options?: Partial<CrossfadeOptions>): void {
    const newHowl = this.howls.get(key);
    const newEntry = this.entries.get(key);

    if (!newHowl || !newEntry) {
      return;
    }

    // Already playing this track — do nothing
    if (this.currentKey === key && this.currentSoundId !== null && newHowl.playing(this.currentSoundId)) {
      return;
    }

    const fadeOutMs = options?.fadeOutMs ?? DEFAULT_CROSSFADE_MS;
    const fadeInMs = options?.fadeInMs ?? DEFAULT_CROSSFADE_MS;

    // Crossfade: fade out old track
    if (this.currentKey !== null && this.currentKey !== key) {
      this.fadeOutCurrent(fadeOutMs);
    }

    // Load if not yet loaded
    if (newHowl.state() === 'unloaded') {
      newHowl.load();
    }

    this.paused = false;

    // Set volume and start playback
    const targetVolume = this.computeVolume(newEntry.volume);
    newHowl.volume(0);
    this.currentSoundId = newHowl.play();
    this.currentKey = key;

    // Fade in
    newHowl.fade(0, targetVolume, fadeInMs, this.currentSoundId);
  }

  /**
   * Play the music track associated with a level ID.
   * Searches entries for the matching levelId.
   */
  playForLevel(levelId: string, options?: Partial<CrossfadeOptions>): void {
    for (const [key, entry] of this.entries) {
      if (entry.levelId === levelId) {
        this.play(key, options);
        return;
      }
    }
  }

  /** Stop the current music track with an optional fade-out */
  stop(fadeOutMs?: number): void {
    if (this.currentKey === null) {
      return;
    }

    const howl = this.howls.get(this.currentKey);
    if (!howl) {
      this.currentKey = null;
      this.currentSoundId = null;
      return;
    }

    if (fadeOutMs !== undefined && fadeOutMs > 0 && this.currentSoundId !== null) {
      const currentVolume = howl.volume() as number;
      howl.fade(currentVolume, 0, fadeOutMs, this.currentSoundId);
      const soundId = this.currentSoundId;
      howl.once('fade', () => {
        howl.stop(soundId);
      }, soundId);
    } else {
      howl.stop();
    }

    this.currentKey = null;
    this.currentSoundId = null;
    this.paused = false;
  }

  /** Pause the current music track */
  pause(): void {
    if (this.currentKey === null || this.currentSoundId === null) {
      return;
    }

    const howl = this.howls.get(this.currentKey);
    if (howl) {
      howl.pause(this.currentSoundId);
      this.paused = true;
    }
  }

  /** Resume the current music track after pause */
  resume(): void {
    if (this.currentKey === null || this.currentSoundId === null || !this.paused) {
      return;
    }

    const howl = this.howls.get(this.currentKey);
    if (howl) {
      howl.play(this.currentSoundId);
      this.paused = false;
    }
  }

  /** Whether music is currently paused */
  isPaused(): boolean {
    return this.paused;
  }

  /** Whether any music track is currently playing */
  isPlaying(): boolean {
    if (this.currentKey === null || this.currentSoundId === null) {
      return false;
    }
    const howl = this.howls.get(this.currentKey);
    return howl !== undefined && howl.playing(this.currentSoundId);
  }

  /** Get the currently playing track key, or null */
  getCurrentKey(): string | null {
    return this.currentKey;
  }

  /** Update the music volume multiplier (0-1) */
  setMusicVolume(volume: number): void {
    this.musicVolume = clamp(volume, 0, 1);
    this.updateCurrentVolume();
  }

  /** Update the master volume multiplier (0-1) */
  setMasterVolume(volume: number): void {
    this.masterVolume = clamp(volume, 0, 1);
    this.updateCurrentVolume();
  }

  /** Mute or unmute all music */
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
    this.currentKey = null;
    this.currentSoundId = null;
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /** Fade out and stop the currently playing track */
  private fadeOutCurrent(fadeOutMs: number): void {
    if (this.currentKey === null) {
      return;
    }

    const oldHowl = this.howls.get(this.currentKey);
    if (!oldHowl) {
      return;
    }

    const oldSoundId = this.currentSoundId;
    if (oldSoundId !== null) {
      const currentVolume = oldHowl.volume() as number;
      oldHowl.fade(currentVolume, 0, fadeOutMs, oldSoundId);
      oldHowl.once('fade', () => {
        oldHowl.stop(oldSoundId);
      }, oldSoundId);
    } else {
      oldHowl.stop();
    }
  }

  /** Compute effective volume = entry volume * music volume * master volume */
  private computeVolume(entryVolume: number): number {
    return clamp(entryVolume * this.musicVolume * this.masterVolume, 0, 1);
  }

  /** Update the volume of the currently playing track */
  private updateCurrentVolume(): void {
    if (this.currentKey === null || this.currentSoundId === null) {
      return;
    }

    const howl = this.howls.get(this.currentKey);
    const entry = this.entries.get(this.currentKey);

    if (howl && entry) {
      howl.volume(this.computeVolume(entry.volume), this.currentSoundId);
    }
  }
}

/** Utility: clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
