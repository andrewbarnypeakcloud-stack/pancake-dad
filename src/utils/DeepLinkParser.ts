// DeepLinkParser — URL hash parser and generator for deep links
// Owned by Platform/DevOps Engineer
// See GDD Section 8.4, .claude/agents/platform-devops.md — URL Deep-Linking

import type { DeepLinkParams } from '../types/platform';

/** Recognized deep-link parameter keys */
const VALID_KEYS: ReadonlySet<string> = new Set(['level', 'dad', 'challenge']);

/**
 * DeepLinkParser handles URL hash-based deep linking.
 *
 * URL format: `https://pancakedad.game/#level=apartment&dad=gary&challenge=highscore`
 *
 * Methods:
 *  - parse()     — read the current window.location.hash into typed params
 *  - generate()  — build a hash string from DeepLinkParams (for share URLs)
 */
export class DeepLinkParser {
  /**
   * Parse the current URL hash into DeepLinkParams.
   * Unrecognized keys are ignored. Empty/missing values become undefined.
   *
   * @param hash Optional override for testing — defaults to window.location.hash.
   */
  parse(hash?: string): DeepLinkParams {
    const rawHash = hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
    return parseHash(rawHash);
  }

  /**
   * Generate a shareable URL hash string from DeepLinkParams.
   * Only includes keys that have non-empty values.
   *
   * @returns A hash string like `#level=apartment&dad=gary` (without the base URL).
   */
  generate(params: DeepLinkParams): string {
    const parts: string[] = [];

    if (params.level !== undefined && params.level !== '') {
      parts.push(`level=${encodeURIComponent(params.level)}`);
    }
    if (params.dad !== undefined && params.dad !== '') {
      parts.push(`dad=${encodeURIComponent(params.dad)}`);
    }
    if (params.challenge !== undefined && params.challenge !== '') {
      parts.push(`challenge=${encodeURIComponent(params.challenge)}`);
    }

    return parts.length > 0 ? `#${parts.join('&')}` : '';
  }
}

// ──────────────────────────────────────────────
// Pure parsing helper
// ──────────────────────────────────────────────

/**
 * Parse a hash string like `#level=apartment&dad=gary` into DeepLinkParams.
 * Returns an object with only recognized, non-empty values.
 */
function parseHash(hash: string): DeepLinkParams {
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  if (stripped === '') {
    return { level: undefined, dad: undefined, challenge: undefined };
  }

  const params: Record<string, string> = {};

  for (const pair of stripped.split('&')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = decodeURIComponent(pair.slice(0, eqIndex)).trim();
    const value = decodeURIComponent(pair.slice(eqIndex + 1)).trim();

    if (VALID_KEYS.has(key) && value !== '') {
      params[key] = value;
    }
  }

  const result: DeepLinkParams = {
    level: params['level'],
    dad: params['dad'],
    challenge: params['challenge'],
  };

  return result;
}
