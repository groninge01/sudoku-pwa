import { describe, expect, it } from 'vitest';
import {
  ALL,
  CELL_UNITS,
  PEERS,
  UNITS,
  bit,
  boxOf,
  colOf,
  computeCandidates,
  countSolutions,
  isComplete,
  legalCandidates,
  popcount,
  rowOf,
  solveUnique,
} from './core.ts';

const parse = (s: string): Int8Array =>
  Int8Array.from(s, (c) => (c === '.' ? 0 : Number(c)));

const EASY = parse('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
const EASY_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

describe('unit geometry', () => {
  it('maps every cell to the right row, column and box', () => {
    expect(rowOf(0)).toBe(0);
    expect(rowOf(80)).toBe(8);
    expect(colOf(0)).toBe(0);
    expect(colOf(80)).toBe(8);
    expect(boxOf(0)).toBe(0);
    expect(boxOf(4)).toBe(1);
    expect(boxOf(40)).toBe(4);
    expect(boxOf(80)).toBe(8);
  });

  it('gives every cell 20 peers across its row, column and box', () => {
    for (let i = 0; i < 81; i++) {
      expect(PEERS[i]).toHaveLength(20);
      expect(PEERS[i]).not.toContain(i);
      expect(CELL_UNITS[i]).toHaveLength(3);
    }
  });

  it('covers all 81 cells in the 27 units without overlap', () => {
    expect(UNITS).toHaveLength(27);
    for (const unit of UNITS) expect(unit).toHaveLength(9);
    for (let i = 0; i < 81; i++) {
      const units = UNITS.filter((u) => u.includes(i));
      expect(units).toHaveLength(3);
    }
  });
});

describe('bit helpers', () => {
  it('maps digits to single-bit masks', () => {
    expect(bit(1)).toBe(1);
    expect(bit(9)).toBe(256);
    expect(ALL).toBe(0x1ff);
  });

  it('counts bits', () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(ALL)).toBe(9);
    expect(popcount(bit(1) | bit(5) | bit(9))).toBe(3);
  });
});

describe('computeCandidates', () => {
  it('marks filled cells with no candidates', () => {
    const cand = computeCandidates(EASY);
    for (let i = 0; i < 81; i++) {
      if (EASY[i]) expect(cand[i]).toBe(0);
      else expect(cand[i]).toBeGreaterThan(0);
    }
  });

  it('excludes digits already in the row, column or box', () => {
    const cand = computeCandidates(EASY);
    // Cell 2: row holds {3,5,7}, column holds {8}, box holds {3,5,6,8,9}.
    // That leaves exactly {1,2,4}.
    expect(cand[2]).toBe(bit(1) | bit(2) | bit(4));
  });

  it('gives an empty board full candidates everywhere', () => {
    const cand = computeCandidates(new Int8Array(81));
    for (let i = 0; i < 81; i++) expect(cand[i]).toBe(ALL);
  });
});

describe('legalCandidates', () => {
  it('ignores the cell itself', () => {
    const board = new Int8Array(81);
    board[0] = 5;
    const mask = legalCandidates(board, 0);
    expect(mask & bit(5)).toBe(bit(5));
  });

  it('matches computeCandidates on empty cells', () => {
    const cand = computeCandidates(EASY);
    for (let i = 0; i < 81; i++) {
      if (!EASY[i]) expect(legalCandidates(EASY, i)).toBe(cand[i]);
    }
  });
});

describe('isComplete', () => {
  it('is true only when every cell holds a digit', () => {
    expect(isComplete(EASY)).toBe(false);
    expect(isComplete(parse(EASY_SOLUTION))).toBe(true);
  });
});

describe('countSolutions', () => {
  it('counts the unique solution of a valid puzzle', () => {
    expect(countSolutions(EASY, 2)).toBe(1);
  });

  it('stops at the limit', () => {
    const open = new Int8Array(81);
    expect(countSolutions(open, 2)).toBe(2);
  });

  it('returns 0 for a contradiction', () => {
    const bad = new Int8Array(81);
    bad[0] = 5;
    bad[1] = 5; // two 5s in row 0
    expect(countSolutions(bad, 2)).toBe(0);
  });
});

describe('solveUnique', () => {
  it('finds the solution of a uniquely solvable puzzle', () => {
    const solution = solveUnique(EASY);
    expect(Array.from(solution ?? []).join('')).toBe(EASY_SOLUTION);
  });

  it('returns null for a direct contradiction', () => {
    const bad = parse('110000000000000000000000000000000000000000000000000000000000000000000000000000000');
    expect(solveUnique(bad)).toBeNull();
  });

  it('returns null when a cell is left with no candidates', () => {
    // Row 0 already has 1,2,3 — the first box fills 4..9 across its other rows,
    // so cell 2 sits in a row, column and box that together cover every digit.
    const dead = parse('120000000' + '000456000' + '000789000' + '.'.repeat(54));
    expect(countSolutions(dead, 2)).toBe(0);
    expect(solveUnique(dead)).toBeNull();
  });
});
