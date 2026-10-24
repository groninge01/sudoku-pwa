import { afterEach, expect, it, vi } from 'vitest';
import { countSolutions } from './core';
import { GenerationTimeout, clueCount, generatePuzzle } from './generator';
import { ratePuzzle, solveCapped, solvableWithin } from './solver';
import { DIFFICULTIES } from './types';
afterEach(() => vi.restoreAllMocks());

it('never labels an off-tier fallback as the requested level when time runs out', () => {
  let ticks = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => ticks++ < 2 ? 0 : 1000);
  expect(() => generatePuzzle({ difficulty: 'expert', seed: 1, budgetMs: 500 })).toThrow(GenerationTimeout);
});

it.each(DIFFICULTIES)('generates %s at exactly the requested supported tier', difficulty => {
  const expected = DIFFICULTIES.indexOf(difficulty) + 1;
  const [min, max] = [[30, 45], [27, 38], [25, 33], [23, 30], [21, 28], [19, 26]][expected - 1];
  const p = generatePuzzle({ difficulty, seed: 42, budgetMs: 60000 });
  expect(p.difficulty).toBe(difficulty);
  expect(p.tier).toBe(expected);
  expect(ratePuzzle(p.puzzle)).toBe(expected);
  expect(solvableWithin(p.puzzle, expected - 1)).toBe(false);
  const logical = solveCapped(p.puzzle, expected);
  expect(logical.solved).toBe(true);
  expect(Array.from(logical.values)).toEqual(p.solution);
  expect(countSolutions(p.puzzle, 2)).toBe(1);
  expect(clueCount(p.puzzle)).toBeGreaterThanOrEqual(min);
  expect(clueCount(p.puzzle)).toBeLessThanOrEqual(max);
}, 90000);
