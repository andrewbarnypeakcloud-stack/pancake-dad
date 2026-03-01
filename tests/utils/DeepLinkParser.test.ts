import { describe, it, expect } from 'vitest';
import { DeepLinkParser } from '../../src/utils/DeepLinkParser';

describe('DeepLinkParser', () => {
  const parser = new DeepLinkParser();

  // ── parse() ──

  describe('parse()', () => {
    it('should parse a full hash with all parameters', () => {
      const result = parser.parse('#level=apartment&dad=gary&challenge=highscore');
      expect(result).toEqual({
        level: 'apartment',
        dad: 'gary',
        challenge: 'highscore',
      });
    });

    it('should parse a hash with only level and dad', () => {
      const result = parser.parse('#level=suburban-home&dad=kenji');
      expect(result).toEqual({
        level: 'suburban-home',
        dad: 'kenji',
        challenge: undefined,
      });
    });

    it('should parse a hash with only level', () => {
      const result = parser.parse('#level=competition');
      expect(result).toEqual({
        level: 'competition',
        dad: undefined,
        challenge: undefined,
      });
    });

    it('should parse a hash with only dad', () => {
      const result = parser.parse('#dad=marcus');
      expect(result).toEqual({
        level: undefined,
        dad: 'marcus',
        challenge: undefined,
      });
    });

    it('should parse a hash with only challenge', () => {
      const result = parser.parse('#challenge=speed');
      expect(result).toEqual({
        level: undefined,
        dad: undefined,
        challenge: 'speed',
      });
    });

    it('should return empty params for an empty hash', () => {
      const result = parser.parse('');
      expect(result).toEqual({
        level: undefined,
        dad: undefined,
        challenge: undefined,
      });
    });

    it('should return empty params for a bare #', () => {
      const result = parser.parse('#');
      expect(result).toEqual({
        level: undefined,
        dad: undefined,
        challenge: undefined,
      });
    });

    it('should ignore unrecognized keys', () => {
      const result = parser.parse('#level=apartment&foo=bar&dad=gary');
      expect(result.level).toBe('apartment');
      expect(result.dad).toBe('gary');
      // foo should not appear
      expect((result as Record<string, unknown>)['foo']).toBeUndefined();
    });

    it('should handle URI-encoded values', () => {
      const result = parser.parse('#level=open%20plan&dad=gary');
      expect(result.level).toBe('open plan');
    });

    it('should handle URI-encoded keys', () => {
      const result = parser.parse('#%6Cevel=apartment');
      // 'level' URI-encoded is '%6Cevel' — after decoding it becomes 'level'
      expect(result.level).toBe('apartment');
    });

    it('should ignore keys with empty values', () => {
      const result = parser.parse('#level=&dad=gary');
      expect(result.level).toBeUndefined();
      expect(result.dad).toBe('gary');
    });

    it('should ignore pairs without an = sign', () => {
      const result = parser.parse('#level=apartment&dangary&challenge=highscore');
      expect(result.level).toBe('apartment');
      expect(result.dad).toBeUndefined();
      expect(result.challenge).toBe('highscore');
    });

    it('should handle values that contain = signs', () => {
      // Only the first = is the delimiter; rest is part of the value
      const result = parser.parse('#level=apartment=deluxe');
      expect(result.level).toBe('apartment=deluxe');
    });

    it('should handle duplicate keys by keeping the last value', () => {
      const result = parser.parse('#level=apartment&level=competition');
      // The parsing loop overwrites, so last value wins
      expect(result.level).toBe('competition');
    });

    it('should trim whitespace from keys and values', () => {
      const result = parser.parse('#level=%20apartment%20&dad=%20gary%20');
      expect(result.level).toBe('apartment');
      expect(result.dad).toBe('gary');
    });

    it('should handle hash without # prefix', () => {
      // The parser strips a leading # if present, so passing without # should also work
      const result = parser.parse('level=apartment&dad=gary');
      expect(result.level).toBe('apartment');
      expect(result.dad).toBe('gary');
    });

    it('should default to window.location.hash when no argument is provided', () => {
      // In the test environment (node), window may not exist, so hash defaults to ''
      const result = parser.parse();
      expect(result).toEqual({
        level: undefined,
        dad: undefined,
        challenge: undefined,
      });
    });

    it('should handle multiple & separators with empty segments', () => {
      const result = parser.parse('#level=apartment&&dad=gary&&&challenge=speed');
      expect(result.level).toBe('apartment');
      // Empty segments have no '=' so they are skipped
      expect(result.dad).toBe('gary');
      expect(result.challenge).toBe('speed');
    });
  });

  // ── generate() ──

  describe('generate()', () => {
    it('should generate a hash with all parameters', () => {
      const hash = parser.generate({ level: 'apartment', dad: 'gary', challenge: 'highscore' });
      expect(hash).toBe('#level=apartment&dad=gary&challenge=highscore');
    });

    it('should generate a hash with only some parameters', () => {
      const hash = parser.generate({ level: 'competition', dad: 'marcus' });
      expect(hash).toBe('#level=competition&dad=marcus');
    });

    it('should generate a hash with only level', () => {
      const hash = parser.generate({ level: 'apartment' });
      expect(hash).toBe('#level=apartment');
    });

    it('should generate a hash with only dad', () => {
      const hash = parser.generate({ dad: 'kenji' });
      expect(hash).toBe('#dad=kenji');
    });

    it('should generate a hash with only challenge', () => {
      const hash = parser.generate({ challenge: 'speed' });
      expect(hash).toBe('#challenge=speed');
    });

    it('should return empty string for empty params', () => {
      const hash = parser.generate({});
      expect(hash).toBe('');
    });

    it('should return empty string when all params are undefined', () => {
      const hash = parser.generate({ level: undefined, dad: undefined, challenge: undefined });
      expect(hash).toBe('');
    });

    it('should skip empty string values', () => {
      const hash = parser.generate({ level: '', dad: 'gary' });
      expect(hash).toBe('#dad=gary');
    });

    it('should encode special characters', () => {
      const hash = parser.generate({ level: 'open plan' });
      expect(hash).toBe('#level=open%20plan');
    });

    it('should encode ampersands in values', () => {
      const hash = parser.generate({ level: 'cook&serve' });
      expect(hash).toBe('#level=cook%26serve');
    });

    it('should encode hash signs in values', () => {
      const hash = parser.generate({ level: 'level#1' });
      expect(hash).toBe('#level=level%231');
    });

    it('should encode equals signs in values', () => {
      const hash = parser.generate({ level: 'a=b' });
      expect(hash).toBe('#level=a%3Db');
    });

    it('should maintain parameter order: level, dad, challenge', () => {
      // Even though object keys in JS are not strictly ordered,
      // the generate method builds parts in a fixed order
      const hash = parser.generate({ challenge: 'speed', level: 'apartment', dad: 'gary' });
      expect(hash).toBe('#level=apartment&dad=gary&challenge=speed');
    });
  });

  // ── round-trip ──

  describe('round-trip', () => {
    it('should parse what it generates (all params)', () => {
      const original = { level: 'apartment', dad: 'kenji', challenge: 'speed' };
      const hash = parser.generate(original);
      const parsed = parser.parse(hash);
      expect(parsed).toEqual(original);
    });

    it('should parse what it generates (partial params)', () => {
      const original = { level: 'suburban-home', dad: 'gary' };
      const hash = parser.generate(original);
      const parsed = parser.parse(hash);
      expect(parsed.level).toBe('suburban-home');
      expect(parsed.dad).toBe('gary');
      expect(parsed.challenge).toBeUndefined();
    });

    it('should parse what it generates (single param)', () => {
      const original = { dad: 'marcus' };
      const hash = parser.generate(original);
      const parsed = parser.parse(hash);
      expect(parsed.dad).toBe('marcus');
    });

    it('should round-trip URI-encoded values', () => {
      const original = { level: 'open plan kitchen', dad: 'gary', challenge: 'high score' };
      const hash = parser.generate(original);
      const parsed = parser.parse(hash);
      expect(parsed).toEqual(original);
    });

    it('should produce empty results for empty params round-trip', () => {
      const hash = parser.generate({});
      const parsed = parser.parse(hash);
      expect(parsed).toEqual({
        level: undefined,
        dad: undefined,
        challenge: undefined,
      });
    });
  });
});
