import { describe, expect, it } from 'vitest';
import { mulberry32, randomSeed, shuffle } from './rng.ts';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('yields numbers in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds diverge', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe('randomSeed', () => {
  it('returns a 32-bit unsigned integer', () => {
    const seed = randomSeed();
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(seed)).toBe(true);
  });
});

describe('shuffle', () => {
  it('keeps the same elements', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const out = shuffle([...items], mulberry32(1));
    expect(out.slice().sort((a, b) => a - b)).toEqual(items);
  });

  it('is deterministic for a seed', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], mulberry32(99));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], mulberry32(99));
    expect(a).toEqual(b);
  });

  it('shuffles in place and returns the same array', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, mulberry32(3));
    expect(out).toBe(items);
  });

  it('actually permutes a large enough input', () => {
    const items = Array.from({ length: 9 }, (_, i) => i + 1);
    const out = shuffle([...items], mulberry32(5));
    expect(out).not.toEqual(items);
  });
});
