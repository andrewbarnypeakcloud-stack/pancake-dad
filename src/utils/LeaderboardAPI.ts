// LeaderboardAPI — stub Supabase client with localStorage fallback and offline queue
// Owned by Platform/DevOps Engineer
// See .claude/agents/platform-devops.md — Leaderboard section

import type { LeaderboardEntry } from '../types/platform';

/** localStorage key for the local leaderboard fallback */
const LOCAL_LEADERBOARD_KEY = 'pancakeDad_leaderboard';

/** localStorage key for the offline submission queue */
const OFFLINE_QUEUE_KEY = 'pancakeDad_leaderboardQueue';

/** Maximum entries stored in the local leaderboard */
const MAX_LOCAL_ENTRIES = 100;

/**
 * LeaderboardAPI manages score submission and retrieval.
 *
 * In the current stub phase (pre-Supabase), all data is stored in localStorage.
 * When Supabase is configured, the API will submit scores remotely and fall back
 * to the offline queue on network failure.
 *
 * Offline queue: failed submissions are persisted to localStorage and retried
 * on the next call to submitScore() or an explicit flushQueue().
 */
export class LeaderboardAPI {
  // TODO: Replace with actual Supabase client once backend is provisioned.
  // private supabase: SupabaseClient | null = null;

  /**
   * Submit a score to the leaderboard.
   * Currently writes to localStorage. Once Supabase is live, this will
   * attempt a remote insert and queue on failure.
   */
  async submitScore(entry: LeaderboardEntry): Promise<void> {
    try {
      // Flush any previously queued entries first
      await this.flushQueue();

      // For now, write directly to local storage
      this.writeToLocal(entry);
    } catch {
      // Queue the entry for later retry
      this.enqueue(entry);
    }
  }

  /**
   * Retrieve the top scores, optionally filtered by levelId.
   * @param limit Maximum number of entries to return.
   * @param levelId If provided, filter to this level only.
   */
  async getTopScores(limit: number, levelId?: string): Promise<LeaderboardEntry[]> {
    const entries = this.readLocal();

    const filtered = levelId !== undefined
      ? entries.filter((e) => e.levelId === levelId)
      : entries;

    // Sort descending by score
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, limit);
  }

  /**
   * Attempt to flush the offline queue.
   * In the stub implementation this simply moves queued entries to the local board.
   * With Supabase, each entry would be retried as a remote insert.
   */
  async flushQueue(): Promise<void> {
    const queue = this.readQueue();
    if (queue.length === 0) {
      return;
    }

    for (const entry of queue) {
      this.writeToLocal(entry);
    }

    // Clear the queue after successful flush
    this.clearQueue();
  }

  /**
   * Check whether the leaderboard backend is reachable.
   * Stub always returns false (no Supabase configured yet).
   */
  isAvailable(): boolean {
    // TODO: Ping Supabase health endpoint when configured
    return false;
  }

  // ──────────────────────────────────────────────
  // Local storage helpers
  // ──────────────────────────────────────────────

  private readLocal(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (raw === null) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as LeaderboardEntry[];
    } catch {
      return [];
    }
  }

  private writeToLocal(entry: LeaderboardEntry): void {
    const entries = this.readLocal();
    entries.push(entry);

    // Sort descending and cap at MAX_LOCAL_ENTRIES
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES);

    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(trimmed));
  }

  // ──────────────────────────────────────────────
  // Offline queue helpers
  // ──────────────────────────────────────────────

  private readQueue(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw === null) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as LeaderboardEntry[];
    } catch {
      return [];
    }
  }

  private enqueue(entry: LeaderboardEntry): void {
    const queue = this.readQueue();
    queue.push(entry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  private clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}
