// Platform and infrastructure types — owned by Platform/DevOps Engineer
// See .claude/agents/platform-devops.md for full specification

import type { ProgressionState } from './content';
import type { AudioSettings } from './audio';

// ──────────────────────────────────────────────
// Save data (GDD Section 2.4)
// ──────────────────────────────────────────────

/** Versioned save data persisted to localStorage */
export interface SaveData {
  readonly version: number;
  readonly progression: ProgressionState;
  readonly settings: AudioSettings;
  readonly lastSaved: number;
}

// ──────────────────────────────────────────────
// Leaderboard (GDD Section 2.1 — Supabase)
// ──────────────────────────────────────────────

/** A single leaderboard entry */
export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  readonly dadId: string;
  readonly levelId: string;
  readonly timestamp: number;
  readonly comboMax: number;
}

// ──────────────────────────────────────────────
// Deep linking (GDD Section 8.4)
// ──────────────────────────────────────────────

/** Parsed parameters from URL hash deep link */
export interface DeepLinkParams {
  readonly level?: string;
  readonly dad?: string;
  readonly challenge?: string;
}

// ──────────────────────────────────────────────
// Build configuration
// ──────────────────────────────────────────────

/** Build-time configuration exposed to the client */
export interface BuildConfig {
  readonly version: string;
  readonly environment: 'development' | 'production' | 'test';
  readonly supabaseUrl?: string;
  readonly supabaseAnonKey?: string;
}

// ──────────────────────────────────────────────
// Migration function signature
// ──────────────────────────────────────────────

/** A migration function that transforms save data from version N to version N+1 */
export type SaveMigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;
