import { beforeEach, describe, expect, it } from 'vitest';
import { EntropicCompression } from '../utils/EntropicCompression';

// jsdom provides btoa/atob globally

describe('EntropicCompression', () => {
  let ec: EntropicCompression;

  beforeEach(() => {
    ec = new EntropicCompression();
  });

  // ─── compress / decompress ─────────────────────────────────────────────────

  describe('compress', () => {
    it('returns a non-empty string', () => {
      expect(ec.compress('Hello world')).toBeTruthy();
    });

    it('returns a valid base64 string', () => {
      const compressed = ec.compress('Hello');
      expect(() => atob(compressed)).not.toThrow();
    });

    it('compresses empty string', () => {
      const compressed = ec.compress('');
      expect(typeof compressed).toBe('string');
    });

    it('two equal inputs produce same output', () => {
      expect(ec.compress('AAAA')).toBe(ec.compress('AAAA'));
    });
  });

  describe('decompress', () => {
    it('decompresses high-entropy data back to original', () => {
      // High-entropy data goes through the "|" path and is preserved
      const original = 'ABCD';
      const compressed = ec.compress(original);
      const result = ec.decompress(compressed);
      expect(result).toBe(original);
    });

    it('decompresses low-entropy data back to original (lossless)', () => {
      // Low-entropy data goes through the "§" resonant path
      const original = 'AAAA';
      const compressed = ec.compress(original);
      const result = ec.decompress(compressed);
      expect(result).toBe(original);
    });

    it('decompresses mixed data without throwing', () => {
      const compressed = ec.compress('Hello world test data');
      expect(() => ec.decompress(compressed)).not.toThrow();
    });

    it('decompress(compress(x)) returns a string', () => {
      const compressed = ec.compress('any data here 1234');
      const result = ec.decompress(compressed);
      expect(typeof result).toBe('string');
    });

    it('lossless round-trip for the default innovation test data', () => {
      const original = 'AAAAAABBBBBBCCCCCCDDDDDD';
      const compressed = ec.compress(original);
      const result = ec.decompress(compressed);
      expect(result).toBe(original);
    });
  });

  // ─── comparePerformance ────────────────────────────────────────────────────

  describe('comparePerformance', () => {
    it('returns a number', () => {
      const ratio = EntropicCompression.comparePerformance('Hello', 'Hi');
      expect(typeof ratio).toBe('number');
    });

    it('same length → 100%', () => {
      expect(EntropicCompression.comparePerformance('ABCD', 'EFGH')).toBeCloseTo(100, 2);
    });

    it('half-length compressed → 50%', () => {
      expect(EntropicCompression.comparePerformance('ABCDEFGH', 'ABCD')).toBeCloseTo(50, 2);
    });

    it('returns a finite number (parseFloat strips trailing zeros)', () => {
      const ratio = EntropicCompression.comparePerformance('ABCDE', 'AB');
      expect(Number.isFinite(ratio)).toBe(true);
      expect(ratio).toBeGreaterThan(0);
    });
  });
});
