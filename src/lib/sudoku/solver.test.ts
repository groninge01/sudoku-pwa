import { describe, expect, it } from 'vitest';
import {
  TRIAL_TIER,
  candidatesFor,
  nextHint,
  ratePuzzle,
  solvableWithin,
  solveCapped,
} from './solver.ts';

const parse = (s: string): Int8Array =>
  Int8Array.from(s, (c) => (c === '.' ? 0 : Number(c)));

const EASY = parse('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
const EASY_SOLUTION = parse('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
// Generated with the project's generator (difficulty medium, seed 7): tier 2.
const MEDIUM = parse('.6..78.5....6..7..1.4..3...2....5..47.....3.5.....628..3..8....6..9..51..57...8..');
// Arto Inkala's 2010 "escargot" — needs guessing, so the solver reports the trial tier.
const ESCARGOT = parse('100007090030020008009600500005300900010080002600004000300000010040000007007000300');

describe('solveCapped', () => {
  it('solves an easy puzzle with only tier 1 techniques', () => {
    const result = solveCapped(EASY, 1);
    expect(result.solved).toBe(true);
    expect(result.tier).toBe(1);
    expect(result.steps).toBeGreaterThan(0);
    expect(Array.from(result.values).join('')).toBe(Array.from(EASY_SOLUTION).join(''));
  });

  it('fails on a harder puzzle when the cap is too low, and solves when raised', () => {
    expect(solveCapped(MEDIUM, 1).solved).toBe(false);
    expect(solveCapped(MEDIUM, 2).solved).toBe(true);
  });

  it('never finishes an unsolvable puzzle', () => {
    const result = solveCapped(new Int8Array(81), 6);
    expect(result.solved).toBe(false);
  });
});

describe('solvableWithin', () => {
  it('tier 0 is only satisfied by a full grid', () => {
    expect(solvableWithin(EASY_SOLUTION, 0)).toBe(true);
    expect(solvableWithin(EASY, 0)).toBe(false);
  });

  it('matches the rated tier', () => {
    expect(solvableWithin(EASY, 1)).toBe(true);
    expect(solvableWithin(MEDIUM, 1)).toBe(false);
    expect(solvableWithin(MEDIUM, 2)).toBe(true);
  });
});

describe('ratePuzzle', () => {
  it('rates an easy puzzle tier 1', () => {
    expect(ratePuzzle(EASY)).toBe(1);
  });

  it('rates the generated medium puzzle tier 2', () => {
    expect(ratePuzzle(MEDIUM)).toBe(2);
  });

  it('reports the trial tier when deductions are not enough', () => {
    expect(ratePuzzle(ESCARGOT)).toBe(TRIAL_TIER);
  });
});

describe('nextHint', () => {
  it('returns a placement that agrees with the unique solution', () => {
    const hint = nextHint(EASY);
    expect(hint).not.toBeNull();
    expect(hint!.kind).toBe('place');
    expect(EASY_SOLUTION[hint!.cell]).toBe(hint!.digit);
    expect(hint!.tier).toBe(1);
    expect(hint!.technique).toBeTruthy();
  });

  it('returns null on a finished grid', () => {
    expect(nextHint(EASY_SOLUTION)).toBeNull();
  });
});

describe('candidatesFor', () => {
  it('lists the digits that do not clash with the board', () => {
    expect(candidatesFor(EASY, 2)).toEqual([1, 2, 4]);
  });

  it('returns every digit on an empty board', () => {
    expect(candidatesFor(new Int8Array(81), 40)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('returns nothing when every digit is taken in a unit', () => {
    const board = new Int8Array(81);
    // Fill row 0 except cell 2 with digits 1..8 so cell 2 keeps only 9.
    const row = [1, 2, 0, 3, 4, 5, 6, 7, 8];
    for (let c = 0; c < 9; c++) board[c] = row[c];
    expect(candidatesFor(board, 2)).toEqual([9]);
    // Fill the rest of its column and box with 9 so nothing is left.
    for (let r = 1; r < 9; r++) board[r * 9 + 2] = 9;
    board[9] = 9;
    board[10] = 9;
    board[19] = 9;
    board[20] = 9;
    expect(candidatesFor(board, 2)).toEqual([]);
  });
});
