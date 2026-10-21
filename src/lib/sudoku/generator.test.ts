import { describe, expect, it } from 'vitest';
import { countSolutions } from './core.ts';
import { GenerationTimeout, clueCount, generatePuzzle } from './generator.ts';
import { ratePuzzle } from './solver.ts';

const EASY_TARGET = { minClues: 30, maxClues: 45, tier: 1 };

describe('generatePuzzle', () => {
  it('is deterministic for a seed', () => {
    const a = generatePuzzle({ difficulty: 'easy', seed: 42 });
    const b = generatePuzzle({ difficulty: 'easy', seed: 42 });
    expect(a.puzzle).toEqual(b.puzzle);
    expect(a.solution).toEqual(b.solution);
    expect(a.tier).toBe(b.tier);
  });

  it('produces a puzzle with a unique solution that matches the givens', () => {
    const { puzzle, solution } = generatePuzzle({ difficulty: 'easy', seed: 42 });
    expect(countSolutions(puzzle, 2)).toBe(1);
    for (let i = 0; i < 81; i++) {
      if (puzzle[i]) expect(puzzle[i]).toBe(solution[i]);
      expect(solution[i]).toBeGreaterThanOrEqual(1);
      expect(solution[i]).toBeLessThanOrEqual(9);
    }
  });

  it('hits the difficulty band for easy', () => {
    const { puzzle, tier } = generatePuzzle({ difficulty: 'easy', seed: 42 });
    const clues = clueCount(puzzle);
    expect(tier).toBe(EASY_TARGET.tier);
    expect(ratePuzzle(puzzle)).toBe(EASY_TARGET.tier);
    expect(clues).toBeGreaterThanOrEqual(EASY_TARGET.minClues);
    expect(clues).toBeLessThanOrEqual(EASY_TARGET.maxClues);
  });

  it('hits the difficulty band for medium', () => {
    const { puzzle, tier } = generatePuzzle({ difficulty: 'medium', seed: 7 });
    const clues = clueCount(puzzle);
    expect(tier).toBe(2);
    expect(clues).toBeGreaterThanOrEqual(27);
    expect(clues).toBeLessThanOrEqual(38);
  }, 120000);

  it('throws GenerationTimeout when the budget is exhausted', () => {
    // With no time to run even one attempt there is nothing to return.
    expect(() => generatePuzzle({ difficulty: 'extreme', seed: 1, budgetMs: 0 })).toThrow(
      GenerationTimeout,
    );
  });

  it('different seeds give different puzzles', () => {
    const a = generatePuzzle({ difficulty: 'easy', seed: 1 });
    const b = generatePuzzle({ difficulty: 'easy', seed: 2 });
    expect(a.puzzle).not.toEqual(b.puzzle);
  });
});
