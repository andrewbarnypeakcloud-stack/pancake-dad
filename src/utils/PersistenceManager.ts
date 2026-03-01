// PersistenceManager — localStorage save/load with versioned schema and migration
// Owned by Platform/DevOps Engineer
// See GDD Section 2.4, .claude/agents/platform-devops.md

import type { SaveData, SaveMigrationFn } from '../types/platform';
import { DEFAULT_PROGRESSION } from '../types/content';
import { DEFAULT_AUDIO_SETTINGS } from '../types/audio';

/** Current schema version — bump when SaveData shape changes */
const CURRENT_VERSION = 1;

/** localStorage key for save data */
const STORAGE_KEY = 'pancakeDad_save';

/**
 * Ordered migration chain. Each entry migrates from version N to N+1.
 * Index 0 = migration from v0 to v1, index 1 = v1 to v2, etc.
 *
 * When adding a new migration:
 *   1. Append a new function to this array.
 *   2. Bump CURRENT_VERSION by 1.
 */
const MIGRATIONS: SaveMigrationFn[] = [
  // v0 -> v1: initial schema — adds settings and lastSaved if missing
  (data: Record<string, unknown>): Record<string, unknown> => ({
    ...data,
    version: 1,
    progression: data['progression'] ?? { ...DEFAULT_PROGRESSION },
    settings: data['settings'] ?? { ...DEFAULT_AUDIO_SETTINGS },
    lastSaved: data['lastSaved'] ?? Date.now(),
  }),
];

/**
 * PersistenceManager handles all localStorage save/load operations.
 *
 * - Writes versioned JSON to localStorage under the `pancakeDad_save` key
 * - On load, detects version mismatches and applies sequential migrations
 * - Handles corrupt data and JSON parse errors gracefully (returns null)
 */
export class PersistenceManager {
  /**
   * Persist save data to localStorage.
   * Stamps the current schema version and timestamp before writing.
   */
  save(data: SaveData): void {
    const stamped: SaveData = {
      ...data,
      version: CURRENT_VERSION,
      lastSaved: Date.now(),
    };

    try {
      const json = JSON.stringify(stamped);
      localStorage.setItem(STORAGE_KEY, json);
    } catch (error: unknown) {
      // QuotaExceededError or SecurityError — log but do not crash
      if (error instanceof DOMException) {
        console.warn('[PersistenceManager] localStorage write failed:', error.message);
      }
    }
  }

  /**
   * Load save data from localStorage.
   *
   * Returns null if:
   *  - No save data exists
   *  - JSON is corrupt / unparseable
   *  - Data fails structural validation after migration
   */
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) {
        return null;
      }

      const version = typeof parsed['version'] === 'number' ? parsed['version'] : 0;

      let migrated: Record<string, unknown> = parsed;
      if (version < CURRENT_VERSION) {
        migrated = this.migrate(parsed, version);
      }

      if (!isValidSaveData(migrated)) {
        return null;
      }

      return migrated as unknown as SaveData;
    } catch {
      // JSON.parse failure or unexpected error
      console.warn('[PersistenceManager] Failed to load save data — returning null');
      return null;
    }
  }

  /** Remove all save data from localStorage. */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Check whether save data exists in localStorage. */
  exists(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /** Return the current schema version. */
  getCurrentVersion(): number {
    return CURRENT_VERSION;
  }

  /**
   * Apply sequential migrations from `fromVersion` to CURRENT_VERSION.
   * Each migration transforms the data object one version forward.
   */
  private migrate(data: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
    let current = { ...data };

    for (let v = fromVersion; v < CURRENT_VERSION; v++) {
      const migrationFn = MIGRATIONS[v];
      if (migrationFn === undefined) {
        console.warn(`[PersistenceManager] Missing migration for v${v} -> v${v + 1}`);
        break;
      }
      current = migrationFn(current);
    }

    return current;
  }
}

// ──────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────

/** Type guard: value is a non-null plain object */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural check that a record contains the required SaveData fields */
function isValidSaveData(data: Record<string, unknown>): boolean {
  return (
    typeof data['version'] === 'number' &&
    typeof data['lastSaved'] === 'number' &&
    isRecord(data['progression']) &&
    isRecord(data['settings'])
  );
}
