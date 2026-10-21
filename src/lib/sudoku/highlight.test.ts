import { describe, expect, it } from 'vitest';
import { bit } from './core.ts';
import {
  activeDigitFor,
  computeHighlights,
  computeNoteConflicts,
  computeValueConflicts,
} from './highlight.ts';

const parse = (s: string): Int8Array =>
  Int8Array.from(s, (c) => (c === '.' ? 0 : Number(c)));

const EASY = parse('530070000600195000098000060800060003400803001700020006060000280000419005000080079');

describe('activeDigitFor', () => {
  it('returns the digit of the selected cell', () => {
    expect(activeDigitFor(EASY, 0)).toBe(5);
    expect(activeDigitFor(EASY, 13)).toBe(9);
  });

  it('returns null for an empty cell', () => {
    expect(activeDigitFor(EASY, 2)).toBeNull();
  });

  it('returns null for an out-of-range selection', () => {
    expect(activeDigitFor(EASY, -1)).toBeNull();
    expect(activeDigitFor(EASY, 81)).toBeNull();
  });
});

describe('computeHighlights', () => {
  it('marks the 20 peers of the selected cell', () => {
    const map = computeHighlights(EASY, 40, null);
    const peers = map.kinds.filter((k) => k !== 'none').length;
    expect(peers).toBe(20);
    expect(map.kinds[40]).toBe('none');
  });

  it('marks every cell holding the active digit as same', () => {
    const map = computeHighlights(EASY, 0, 5);
    const fives = [];
    for (let i = 0; i < 81; i++) if (EASY[i] === 5) fives.push(i);
    expect(map.sameDigitCells).toEqual(fives);
    for (const i of fives) {
      expect(['same', 'same-peer', 'same-line']).toContain(map.kinds[i]);
    }
  });

  it('marks same-digit peers of the selection as same-peer', () => {
    // Givens never clash, so same-peer only appears with player entries:
    // two 7s in row 0, both visible from the selection in row 0.
    const values = new Int8Array(81);
    values[0] = 7;
    values[8] = 7;
    values[40] = 7; // same digit, not a peer of cell 1
    const map = computeHighlights(values, 1, 7);
    expect(map.kinds[0]).toBe('same-peer');
    expect(map.kinds[8]).toBe('same-peer');
    expect(map.kinds[40]).toBe('same');
  });

  it('marks cells on the same row or column as a same-digit cell', () => {
    const map = computeHighlights(EASY, 30, 5);
    expect(map.sameDigitRows).toContain(1);
    expect(map.sameDigitCols).toContain(0);
    const onLine = map.kinds.filter((k) => k === 'same-line').length;
    expect(onLine).toBeGreaterThan(0);
  });

  it('marks the box a same-digit cell sits in', () => {
    // Two player 7s: cell 0 (box 0) and cell 40 (box 4). Selecting cell 1
    // focuses 7; the rest of box 4 lights up even though it shares no row
    // or column with cell 0 outside box 4's own.
    const values = new Int8Array(81);
    values[0] = 7;
    values[40] = 7;
    const map = computeHighlights(values, 1, 7);
    expect(map.sameDigitBoxes).toEqual([0, 4]);
    // Cells in box 4 that share no row or column with a 7 get 'same-box'.
    expect(map.kinds[30]).toBe('same-box');
    expect(map.kinds[50]).toBe('same-box');
    // A cell in the box on a shared row still reads as 'same-line'.
    expect(map.kinds[39]).toBe('same-line');
    // The same-digit cell itself is 'same' or stronger.
    expect(map.kinds[40]).toBe('same');
    // Box 0's non-peer cells stay unmarked: they are only peers through the
    // selection's box, which already shows via 'peer'... cell 1's box peers
    // are 'peer', so nothing in box 0 is 'same-box'.
    for (const i of [2, 9, 10, 11, 18, 19, 20]) {
      expect(map.kinds[i]).not.toBe('same-box');
    }
  });

  it('gives an empty selection and no digit an empty map', () => {
    const map = computeHighlights(EASY, -1, null);
    expect(map.kinds.every((k) => k === 'none')).toBe(true);
    expect(map.sameDigitCells).toEqual([]);
  });
});

describe('computeValueConflicts', () => {
  it('flags only the wrong entry when a duplicate pair clashes', () => {
    const values = new Int8Array(81);
    const givens = new Int8Array(81);
    const wrong = new Uint8Array(81);
    values[0] = 7;
    values[8] = 7; // same row, same digit
    wrong[8] = 1; // cell 8 is the wrong entry, cell 0 is correct
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask[0]).toBe(0);
    expect(mask[8]).toBe(1);
  });

  it('flags both entries when both duplicates are wrong', () => {
    const values = new Int8Array(81);
    const givens = new Int8Array(81);
    const wrong = new Uint8Array(81);
    values[0] = 7;
    values[8] = 7;
    wrong[0] = 1;
    wrong[8] = 1;
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask[0]).toBe(1);
    expect(mask[8]).toBe(1);
  });

  it('never flags a given', () => {
    const values = Int8Array.from(EASY);
    const givens = Int8Array.from(EASY); // every filled cell is a given
    const wrong = new Uint8Array(81).fill(1); // even flagged wrong, givens stay clean
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask.every((v) => v === 0)).toBe(true);
  });

  it('flags only the wrong player entry that clashes with a given', () => {
    const values = new Int8Array(81);
    const givens = new Int8Array(81);
    const wrong = new Uint8Array(81);
    givens[0] = 5;
    values[0] = 5;
    values[8] = 5; // player entry in row 0 clashes with the given
    wrong[8] = 1;
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask[0]).toBe(0);
    expect(mask[8]).toBe(1);
  });

  it('does not flag a correct entry even when it duplicates', () => {
    const values = new Int8Array(81);
    const givens = new Int8Array(81);
    const wrong = new Uint8Array(81);
    values[0] = 3;
    values[8] = 3; // duplicate in row 0, but only cell 8 is wrong
    wrong[8] = 1;
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask[0]).toBe(0);
  });

  it('ignores different digits in the same unit', () => {
    const values = new Int8Array(81);
    const givens = new Int8Array(81);
    const wrong = new Uint8Array(81).fill(1);
    values[0] = 1;
    values[8] = 2;
    const mask = computeValueConflicts(values, givens, wrong);
    expect(mask.every((v) => v === 0)).toBe(true);
  });
});

describe('computeNoteConflicts', () => {
  it('marks a note digit already placed in a peer', () => {
    const conflicts = computeNoteConflicts(EASY);
    // Cell 2 is empty; digit 5 is already in its row (cell 0) -> bit(5) set.
    expect(conflicts[2] & bit(5)).toBe(bit(5));
    // Digit 1 is nowhere on the board -> no conflict for it.
    expect(conflicts[2] & bit(1)).toBe(0);
  });

  it('empty board has no conflicts', () => {
    const conflicts = computeNoteConflicts(new Int8Array(81));
    expect(conflicts.every((v) => v === 0)).toBe(true);
  });
});
