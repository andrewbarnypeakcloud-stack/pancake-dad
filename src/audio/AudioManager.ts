// AudioManager — Howler.js singleton wrapper for all audio in Pancake Dad
// See .claude/agents/audio-engineer.md for architecture specification
// See PancakeDad_GDD_v02_Browser.md sections 7.3, 7.4, 8.1, 8.2
//
// Responsibilities:
// - Master, SFX, and music volume controls
// - Delegates to SFXPlayer and MusicPlayer
// - Mobile audio context unlock (P2C-07)
// - Tab blur/focus muting (P2C-08)

import { Howler } from 'howler';
import {
  AudioManifest,
  AudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  PlaySFXOptions,
  CrossfadeOptions,
} from '../types';
import { SFXPlayer } from './SFXPlayer';
import { MusicPlayer } from './MusicPlayer';

/**
 * AudioManager is the singleton entry point for all audio in the game.
 * It wraps Howler.js and delegates to SFXPlayer and MusicPlayer.
 *
 * Usage:
 *   const audioManager = new AudioManager();
 *   audioManager.init(AUDIO_MANIFEST);
 *   audioManager.playSFX('flip_whoosh');
 *   audioManager.playLevelMusic('apartment');
 *
 * Register in Phaser registry for scene access:
 *   this.registry.set('audioManager', audioManager);
 */
export class AudioManager {
  private readonly sfxPlayer: SFXPlayer;
  private readonly musicPlayer: MusicPlayer;
  private settings: AudioSettings;
  private initialized: boolean = false;
  private audioUnlocked: boolean = false;

  /** Stored volumes before blur muting, for restoration on focus */
  private preBlurMuted: boolean = false;

  /** Bound event handlers for cleanup */
  private readonly boundOnBlur: () => void;
  private readonly boundOnFocus: () => void;
  private readonly boundUnlockHandler: () => void;

  constructor() {
    this.sfxPlayer = new SFXPlayer();
    this.musicPlayer = new MusicPlayer();
    this.settings = { ...DEFAULT_AUDIO_SETTINGS };

    // Bind handlers for proper cleanup
    this.boundOnBlur = this.onBlur.bind(this);
    this.boundOnFocus = this.onFocus.bind(this);
    this.boundUnlockHandler = this.handleMobileUnlock.bind(this);
  }

  // ──────────────────────────────────────────────
  // Initialization
  // ──────────────────────────────────────────────

  /**
   * Initialize the audio system by loading the manifest and setting up
   * mobile unlock + tab visibility handlers.
   */
  init(manifest: AudioManifest, savedSettings?: AudioSettings): void {
    if (this.initialized) {
      return;
    }

    // Apply saved settings if provided (from localStorage via Platform/DevOps)
    if (savedSettings) {
      this.settings = { ...savedSettings };
    }

    // Apply master volume to Howler global
    Howler.volume(this.settings.masterVolume);

    // Load SFX and music entries
    this.sfxPlayer.setMasterVolume(this.settings.masterVolume);
    this.sfxPlayer.setSFXVolume(this.settings.sfxVolume);
    this.sfxPlayer.loadEntries(manifest.sfx);

    this.musicPlayer.setMasterVolume(this.settings.masterVolume);
    this.musicPlayer.setMusicVolume(this.settings.musicVolume);
    this.musicPlayer.loadEntries(manifest.music);

    // Apply mute state
    if (this.settings.muted) {
      Howler.mute(true);
    }

    // Setup mobile audio unlock (P2C-07)
    this.setupMobileAudioUnlock();

    // Setup tab blur/focus muting (P2C-08)
    this.setupVisibilityHandlers();

    this.initialized = true;
  }

  // ──────────────────────────────────────────────
  // SFX playback
  // ──────────────────────────────────────────────

  /** Play a sound effect by key */
  playSFX(key: string, options?: PlaySFXOptions): void {
    this.sfxPlayer.play(key, options);
  }

  /** Play the pancake flip SFX with pitch variation based on spin speed */
  playTrickSFX(spinSpeed: number): void {
    this.sfxPlayer.playTrickSFX(spinSpeed);
  }

  /** Play combo ding with pitch rising per multiplier (GDD: C through B for x1-x7+) */
  playComboDing(multiplier: number): void {
    this.sfxPlayer.playComboDing(multiplier);
  }

  /** Stop a specific SFX */
  stopSFX(key: string): void {
    this.sfxPlayer.stop(key);
  }

  /** Stop all playing SFX */
  stopAllSFX(): void {
    this.sfxPlayer.stopAll();
  }

  // ──────────────────────────────────────────────
  // Music playback
  // ──────────────────────────────────────────────

  /** Play a music track by key, crossfading from current */
  playMusic(key: string, options?: Partial<CrossfadeOptions>): void {
    this.musicPlayer.play(key, options);
  }

  /** Play the music track for a specific level ID */
  playLevelMusic(levelId: string, options?: Partial<CrossfadeOptions>): void {
    this.musicPlayer.playForLevel(levelId, options);
  }

  /** Stop music with optional fade out */
  stopMusic(fadeOutMs?: number): void {
    this.musicPlayer.stop(fadeOutMs);
  }

  /** Pause current music */
  pauseMusic(): void {
    this.musicPlayer.pause();
  }

  /** Resume paused music */
  resumeMusic(): void {
    this.musicPlayer.resume();
  }

  // ──────────────────────────────────────────────
  // Volume controls
  // ──────────────────────────────────────────────

  /** Set master volume (0-1). Affects all audio. */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = clamp(volume, 0, 1);
    Howler.volume(this.settings.masterVolume);
    this.sfxPlayer.setMasterVolume(this.settings.masterVolume);
    this.musicPlayer.setMasterVolume(this.settings.masterVolume);
  }

  /** Set SFX volume (0-1) */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = clamp(volume, 0, 1);
    this.sfxPlayer.setSFXVolume(this.settings.sfxVolume);
  }

  /** Set music volume (0-1) */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = clamp(volume, 0, 1);
    this.musicPlayer.setMusicVolume(this.settings.musicVolume);
  }

  /** Toggle global mute on/off */
  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    Howler.mute(this.settings.muted);
  }

  /** Set mute state explicitly */
  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    Howler.mute(muted);
  }

  /** Get current audio settings (for persistence by Platform/DevOps) */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Apply a full AudioSettings object (e.g., loaded from localStorage) */
  applySettings(newSettings: AudioSettings): void {
    this.setMasterVolume(newSettings.masterVolume);
    this.setSFXVolume(newSettings.sfxVolume);
    this.setMusicVolume(newSettings.musicVolume);
    this.setMuted(newSettings.muted);
  }

  // ──────────────────────────────────────────────
  // Mobile audio unlock (P2C-07)
  // ──────────────────────────────────────────────

  /**
   * Setup listeners for mobile audio context unlock.
   * iOS Safari and Android Chrome require a user interaction before audio plays.
   * Howler.js has built-in auto-unlock, but we add an explicit handler as backup.
   */
  private setupMobileAudioUnlock(): void {
    // Check if audio context is already running
    if (Howler.ctx && Howler.ctx.state === 'running') {
      this.audioUnlocked = true;
      return;
    }

    // Listen for first user interaction to unlock audio
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    for (const eventName of interactionEvents) {
      document.addEventListener(eventName, this.boundUnlockHandler, { once: false, passive: true });
    }
  }

  /** Handle the first user interaction to unlock audio context */
  private handleMobileUnlock(): void {
    if (this.audioUnlocked) {
      return;
    }

    // Resume suspended audio context
    if (Howler.ctx && Howler.ctx.state !== 'running') {
      Howler.ctx.resume().then(() => {
        this.audioUnlocked = true;
        this.removeMobileUnlockListeners();
      }).catch(() => {
        // Retry on next interaction — do not remove listeners
      });
    } else {
      this.audioUnlocked = true;
      this.removeMobileUnlockListeners();
    }
  }

  /** Remove mobile unlock event listeners after successful unlock */
  private removeMobileUnlockListeners(): void {
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    for (const eventName of interactionEvents) {
      document.removeEventListener(eventName, this.boundUnlockHandler);
    }
  }

  /** Whether the audio context has been unlocked */
  isAudioUnlocked(): boolean {
    return this.audioUnlocked;
  }

  // ──────────────────────────────────────────────
  // Tab blur/focus muting (P2C-08)
  // ──────────────────────────────────────────────

  /**
   * Setup document visibility change listener.
   * Mutes all audio when tab loses focus, restores on focus.
   * See GDD section 8.2.
   */
  private setupVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onBlur();
      } else {
        this.onFocus();
      }
    });

    // Also listen for window blur/focus as a fallback
    window.addEventListener('blur', this.boundOnBlur);
    window.addEventListener('focus', this.boundOnFocus);
  }

  /** Called when the tab/window loses focus — mute everything */
  onBlur(): void {
    // Store the current mute state so we can restore it
    this.preBlurMuted = this.settings.muted;
    Howler.mute(true);
  }

  /** Called when the tab/window regains focus — restore audio */
  onFocus(): void {
    // Only unmute if the user hadn't manually muted before blur
    if (!this.preBlurMuted) {
      Howler.mute(false);
    }
  }

  // ──────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────

  /** Destroy all audio resources and remove event listeners */
  destroy(): void {
    this.sfxPlayer.destroy();
    this.musicPlayer.destroy();
    this.removeMobileUnlockListeners();

    window.removeEventListener('blur', this.boundOnBlur);
    window.removeEventListener('focus', this.boundOnFocus);

    this.initialized = false;
  }
}

/** Utility: clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
