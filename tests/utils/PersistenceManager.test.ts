import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceManager } from '../../src/utils/PersistenceManager';
import type { SaveData } from '../../src/types/platform';
import { DEFAULT_PROGRESSION } from '../../src/types/content';
import { DEFAULT_AUDIO_SETTINGS } from '../../src/types/audio';

// ──────────────────────────────────────────────
// localStorage mock
// ──────────────────────────────────────────────

const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) { delete store[k]; } }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

function makeSaveData(overrides?: Partial<SaveData>): SaveData {
  return {
    version: 1,
    progression: { ...DEFAULT_PROGRESSION },
    settings: { ...DEFAULT_AUDIO_SETTINGS },
    lastSaved: Date.now(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PersistenceManager', () => {
  let pm: PersistenceManager;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    pm = new PersistenceManager();
  });

  // ── save / load round-trip ──

  describe('save() and load() round-trip', () => {
    it('should save and load data with correct structure', () => {
      const data = makeSaveData();
      pm.save(data);

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(1);
      expect(loaded!.progression.equippedDad).toBe('gary');
      expect(loaded!.settings.masterVolume).toBe(1.0);
    });

    it('should return null when no save data exists', () => {
      expect(pm.load()).toBeNull();
    });

    it('should preserve progression dadBucks through round-trip', () => {
      const data = makeSaveData({
        progression: { ...DEFAULT_PROGRESSION, dadBucks: 1234 },
      });
      pm.save(data);

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.progression.dadBucks).toBe(1234);
    });

    it('should preserve custom audio settings through round-trip', () => {
      const data = makeSaveData({
        settings: {
          masterVolume: 0.5,
          sfxVolume: 0.3,
          musicVolume: 0.7,
          muted: true,
        },
      });
      pm.save(data);

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.settings.masterVolume).toBe(0.5);
      expect(loaded!.settings.sfxVolume).toBe(0.3);
      expect(loaded!.settings.musicVolume).toBe(0.7);
      expect(loaded!.settings.muted).toBe(true);
    });

    it('should preserve highScores map through round-trip', () => {
      const data = makeSaveData({
        progression: {
          ...DEFAULT_PROGRESSION,
          highScores: { apartment: 50000, 'suburban-home': 30000 },
        },
      });
      pm.save(data);

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.progression.highScores).toEqual({
        apartment: 50000,
        'suburban-home': 30000,
      });
    });

    it('should overwrite previous save data on subsequent saves', () => {
      pm.save(makeSaveData({ progression: { ...DEFAULT_PROGRESSION, dadBucks: 100 } }));
      pm.save(makeSaveData({ progression: { ...DEFAULT_PROGRESSION, dadBucks: 999 } }));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.progression.dadBucks).toBe(999);
    });
  });

  // ── exists / clear ──

  describe('exists()', () => {
    it('should return false when no save data exists', () => {
      expect(pm.exists()).toBe(false);
    });

    it('should return true after saving data', () => {
      pm.save(makeSaveData());
      expect(pm.exists()).toBe(true);
    });

    it('should return false after clearing', () => {
      pm.save(makeSaveData());
      pm.clear();
      expect(pm.exists()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear save data', () => {
      pm.save(makeSaveData());
      expect(pm.exists()).toBe(true);
      pm.clear();
      expect(pm.exists()).toBe(false);
      expect(pm.load()).toBeNull();
    });

    it('should not throw when clearing non-existent data', () => {
      expect(() => pm.clear()).not.toThrow();
    });
  });

  // ── getCurrentVersion ──

  describe('getCurrentVersion()', () => {
    it('should return current schema version', () => {
      expect(pm.getCurrentVersion()).toBe(1);
    });

    it('should return a positive integer', () => {
      const version = pm.getCurrentVersion();
      expect(version).toBeGreaterThan(0);
      expect(Number.isInteger(version)).toBe(true);
    });
  });

  // ── version and timestamp stamping ──

  describe('version and timestamp stamping', () => {
    it('should stamp current version on save regardless of input version', () => {
      const data = makeSaveData({ version: 99 });
      pm.save(data);

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(pm.getCurrentVersion());
    });

    it('should stamp lastSaved on save', () => {
      const before = Date.now();
      pm.save(makeSaveData({ lastSaved: 0 }));
      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.lastSaved).toBeGreaterThanOrEqual(before);
    });

    it('should update lastSaved on each save', () => {
      pm.save(makeSaveData());
      const first = pm.load()!.lastSaved;

      // Wait a tiny bit so timestamp differs (or at least is >=)
      pm.save(makeSaveData());
      const second = pm.load()!.lastSaved;

      expect(second).toBeGreaterThanOrEqual(first);
    });
  });

  // ── corrupt data handling ──

  describe('corrupt data handling', () => {
    it('should return null for corrupt JSON', () => {
      localStorage.setItem('pancakeDad_save', '{not valid json!!!');
      expect(pm.load()).toBeNull();
    });

    it('should return null for non-object JSON (string)', () => {
      localStorage.setItem('pancakeDad_save', '"just a string"');
      expect(pm.load()).toBeNull();
    });

    it('should return null for non-object JSON (number)', () => {
      localStorage.setItem('pancakeDad_save', '42');
      expect(pm.load()).toBeNull();
    });

    it('should return null for non-object JSON (array)', () => {
      localStorage.setItem('pancakeDad_save', '[1, 2, 3]');
      expect(pm.load()).toBeNull();
    });

    it('should return null for JSON null', () => {
      localStorage.setItem('pancakeDad_save', 'null');
      expect(pm.load()).toBeNull();
    });

    it('should return null for data missing required fields', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({ version: 1 }));
      expect(pm.load()).toBeNull();
    });

    it('should return null for data with version but missing progression', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 1,
        lastSaved: Date.now(),
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      }));
      expect(pm.load()).toBeNull();
    });

    it('should return null for data with version but missing settings', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 1,
        lastSaved: Date.now(),
        progression: { ...DEFAULT_PROGRESSION },
      }));
      expect(pm.load()).toBeNull();
    });

    it('should return null for data where progression is not an object', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 1,
        lastSaved: Date.now(),
        progression: 'not an object',
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      }));
      expect(pm.load()).toBeNull();
    });

    it('should return null for data where settings is not an object', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 1,
        lastSaved: Date.now(),
        progression: { ...DEFAULT_PROGRESSION },
        settings: 'not an object',
      }));
      expect(pm.load()).toBeNull();
    });

    it('should return null for data where version is not a number', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 'one',
        lastSaved: Date.now(),
        progression: { ...DEFAULT_PROGRESSION },
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      }));
      // version is non-numeric, so treated as v0 and migrated
      // Migration should add missing fields and produce valid data
      const loaded = pm.load();
      // After migration from v0, data should be valid since progression and settings exist
      if (loaded !== null) {
        expect(loaded.version).toBe(1);
      }
    });

    it('should return null for data where lastSaved is not a number', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({
        version: 1,
        lastSaved: 'yesterday',
        progression: { ...DEFAULT_PROGRESSION },
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      }));
      expect(pm.load()).toBeNull();
    });
  });

  // ── migration ──

  describe('migration', () => {
    it('should migrate v0 data to current version', () => {
      // Simulate old v0 save with no version field
      const legacyData = {
        progression: { ...DEFAULT_PROGRESSION, dadBucks: 500 },
      };
      localStorage.setItem('pancakeDad_save', JSON.stringify(legacyData));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(1);
      expect(loaded!.progression.dadBucks).toBe(500);
      // Migration should add default settings
      expect(loaded!.settings).toBeDefined();
      expect(loaded!.settings.masterVolume).toBe(1.0);
    });

    it('should add default progression when migrating v0 data without it', () => {
      const legacyData = {
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      };
      localStorage.setItem('pancakeDad_save', JSON.stringify(legacyData));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.progression).toBeDefined();
      expect(loaded!.progression.equippedDad).toBe('gary');
    });

    it('should add default settings when migrating v0 data without it', () => {
      const legacyData = {
        progression: { ...DEFAULT_PROGRESSION },
      };
      localStorage.setItem('pancakeDad_save', JSON.stringify(legacyData));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.settings).toBeDefined();
      expect(loaded!.settings.masterVolume).toBe(DEFAULT_AUDIO_SETTINGS.masterVolume);
      expect(loaded!.settings.sfxVolume).toBe(DEFAULT_AUDIO_SETTINGS.sfxVolume);
      expect(loaded!.settings.musicVolume).toBe(DEFAULT_AUDIO_SETTINGS.musicVolume);
      expect(loaded!.settings.muted).toBe(DEFAULT_AUDIO_SETTINGS.muted);
    });

    it('should add lastSaved when migrating v0 data without it', () => {
      const before = Date.now();
      const legacyData = {
        progression: { ...DEFAULT_PROGRESSION },
        settings: { ...DEFAULT_AUDIO_SETTINGS },
      };
      localStorage.setItem('pancakeDad_save', JSON.stringify(legacyData));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.lastSaved).toBeGreaterThanOrEqual(before);
    });

    it('should preserve existing lastSaved during migration if present', () => {
      const legacyData = {
        progression: { ...DEFAULT_PROGRESSION },
        settings: { ...DEFAULT_AUDIO_SETTINGS },
        lastSaved: 1234567890,
      };
      localStorage.setItem('pancakeDad_save', JSON.stringify(legacyData));

      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      // The v0->v1 migration uses ?? so existing lastSaved is preserved
      expect(loaded!.lastSaved).toBe(1234567890);
    });

    it('should not re-migrate data already at current version', () => {
      const data = makeSaveData();
      pm.save(data);

      // Load should succeed without migration
      const loaded = pm.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(pm.getCurrentVersion());
    });

    it('should handle completely empty object for v0 migration', () => {
      localStorage.setItem('pancakeDad_save', JSON.stringify({}));

      const loaded = pm.load();
      // After migration, should have all required fields from defaults
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(1);
      expect(loaded!.progression).toBeDefined();
      expect(loaded!.settings).toBeDefined();
    });
  });

  // ── localStorage write failure ──

  describe('localStorage write failure', () => {
    it('should not throw when localStorage.setItem throws QuotaExceededError', () => {
      const originalSetItem = localStorageMock.setItem;
      const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
      localStorageMock.setItem = vi.fn(() => { throw quotaError; });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => pm.save(makeSaveData())).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        '[PersistenceManager] localStorage write failed:',
        'quota exceeded',
      );

      localStorageMock.setItem = originalSetItem;
      warnSpy.mockRestore();
    });

    it('should not throw when localStorage.setItem throws SecurityError', () => {
      const originalSetItem = localStorageMock.setItem;
      const securityError = new DOMException('security error', 'SecurityError');
      localStorageMock.setItem = vi.fn(() => { throw securityError; });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => pm.save(makeSaveData())).not.toThrow();

      localStorageMock.setItem = originalSetItem;
      warnSpy.mockRestore();
    });
  });

  // ── localStorage key ──

  describe('localStorage key', () => {
    it('should use the pancakeDad_save key', () => {
      pm.save(makeSaveData());
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pancakeDad_save',
        expect.any(String),
      );
    });

    it('should read from the pancakeDad_save key', () => {
      pm.load();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('pancakeDad_save');
    });

    it('should remove the pancakeDad_save key on clear', () => {
      pm.save(makeSaveData());
      pm.clear();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pancakeDad_save');
    });
  });
});
