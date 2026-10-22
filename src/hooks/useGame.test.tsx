// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { bit } from '../lib/sudoku/core.ts';
import { useGame } from './useGame.ts';

const parse = (s: string): number[] =>
  Array.from(s, (c) => (c === '.' ? 0 : Number(c)));

const PUZZLE = parse('530070000600195000098000060800060003400803001700020006060000280000419005000080079');
const SOLUTION = parse('534678912672195348198342567859761423426853791713924856961537284287419635345286179');

const setup = (autoRemoveNotes = true) =>
  renderHook(() => useGame({ soundEffects: false, autoRemoveNotes }));

beforeEach(() => {
  localStorage.clear();
});

const start = (result: { current: ReturnType<typeof useGame> }) => {
  act(() => result.current.start(PUZZLE, SOLUTION, 'easy'));
};

describe('start', () => {
  it('lays out the givens and clears play state', () => {
    const { result } = setup();
    start(result);
    expect(result.current.cells[0].value).toBe(5);
    expect(result.current.cells[0].user).toBe(false);
    expect(result.current.mistakes).toBe(0);
    expect(result.current.solved).toBe(false);
    expect(result.current.canUndo).toBe(false);
  });
});

describe('placeDigit', () => {
  it('marks a correct entry as a user value', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(SOLUTION[2]));
    expect(result.current.cells[2]).toEqual({ value: SOLUTION[2], user: true, wrong: false, notes: 0 });
    expect(result.current.mistakes).toBe(0);
  });

  it('counts a wrong entry as a mistake without ending the game', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[2])!;
    act(() => result.current.placeDigit(wrongDigit));
    expect(result.current.cells[2].wrong).toBe(true);
    expect(result.current.mistakes).toBe(1);
    expect(result.current.solved).toBe(false);
    // mistakes are unlimited — a second one still counts
    act(() => result.current.placeDigit(SOLUTION[2]));
    expect(result.current.mistakes).toBe(1);
    act(() => result.current.selectCell(3));
    const wrongAgain = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[3])!;
    act(() => result.current.placeDigit(wrongAgain));
    expect(result.current.mistakes).toBe(2);
  });

  it('does nothing on a given', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(0));
    act(() => result.current.placeDigit(9));
    expect(result.current.cells[0].value).toBe(5);
  });

  it('locks a correct entry so it cannot be overwritten', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(SOLUTION[2]));
    const digit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[2])!;
    act(() => result.current.placeDigit(digit));
    expect(result.current.cells[2].value).toBe(SOLUTION[2]);
    expect(result.current.cells[2].wrong).toBe(false);
    expect(result.current.mistakes).toBe(0);
    expect(result.current.canUndo).toBe(true); // only the first placement is on the stack
  });

  it('still lets a wrong entry be overwritten', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[2])!;
    act(() => result.current.placeDigit(wrongDigit));
    act(() => result.current.placeDigit(SOLUTION[2]));
    expect(result.current.cells[2].value).toBe(SOLUTION[2]);
    expect(result.current.cells[2].wrong).toBe(false);
  });

  it('does nothing with no selection', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.placeDigit(1));
    expect(result.current.cells.every((c) => !c.user)).toBe(true);
  });
});

describe('notes', () => {
  it('toggles a candidate while notes mode is on', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.toggleNotes());
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(4));
    expect(result.current.cells[2].notes & bit(4)).toBe(bit(4));
    act(() => result.current.placeDigit(4));
    expect(result.current.cells[2].notes & bit(4)).toBe(0);
  });

  it('auto-removes the placed digit from peer notes', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.toggleNotes());
    act(() => result.current.selectCell(3)); // empty cell, row peer of cell 2
    act(() => result.current.placeDigit(4)); // note 4 in cell 3
    expect(result.current.cells[3].notes & bit(4)).toBe(bit(4));
    act(() => result.current.toggleNotes());
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(4));
    expect(result.current.cells[3].notes & bit(4)).toBe(0);
  });
});

describe('undo', () => {
  it('restores the cell and decrements the mistake count', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[2])!;
    act(() => result.current.placeDigit(wrongDigit));
    expect(result.current.mistakes).toBe(1);
    act(() => result.current.undo());
    expect(result.current.cells[2].value).toBe(0);
    expect(result.current.mistakes).toBe(0);
    expect(result.current.canUndo).toBe(false);
  });

  it('restores notes the placement auto-cleared in peer cells', () => {
    const { result } = setup();
    start(result);
    // A note of digit 1 sits in cell 3, a row peer of cell 2.
    act(() => result.current.toggleNotes());
    act(() => result.current.selectCell(3));
    act(() => result.current.placeDigit(1));
    expect(result.current.cells[3].notes & bit(1)).toBe(bit(1));
    act(() => result.current.toggleNotes());
    // A wrong placement of 1 in cell 2 still auto-clears the note.
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(1));
    expect(result.current.cells[2].wrong).toBe(true);
    expect(result.current.cells[3].notes & bit(1)).toBe(0);
    act(() => result.current.undo());
    expect(result.current.cells[2].value).toBe(0);
    expect(result.current.cells[3].notes & bit(1)).toBe(bit(1));
  });
});

describe('eraseCell', () => {
  it('clears a wrong user entry', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => d !== SOLUTION[2])!;
    act(() => result.current.placeDigit(wrongDigit));
    act(() => result.current.eraseCell());
      expect(result.current.cells[2].value).toBe(0);
  });

  it('keeps a correct entry locked against erasing', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(SOLUTION[2]));
    act(() => result.current.eraseCell());
    expect(result.current.cells[2].value).toBe(SOLUTION[2]);
  });
});

describe('fillCandidates', () => {
  it('fills every empty cell with its legal candidates', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.fillCandidates());
    expect(result.current.cells[2].notes).toBe(bit(1) | bit(2) | bit(4));
    for (let i = 0; i < 81; i++) {
      if (PUZZLE[i]) expect(result.current.cells[i].notes).toBe(0);
    }
  });

  it('is undone as a single bulk move', () => {
    const { result } = setup();
    start(result);
    // Give one cell a note so undo restores it too.
    act(() => result.current.toggleNotes());
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(3));
    const before = result.current.cells[2].notes;
    expect(before & bit(3)).toBe(bit(3));
    act(() => result.current.fillCandidates());
    expect(result.current.cells[2].notes).toBe(bit(1) | bit(2) | bit(4));
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.cells[2].notes).toBe(before);
    expect(result.current.cells.every((c, i) => PUZZLE[i] || c.notes === 0 || i === 2)).toBe(true);
  });
});

describe('restart', () => {
  it('resets the board to the givens', () => {
    const { result } = setup();
    start(result);
    act(() => result.current.selectCell(2));
    act(() => result.current.placeDigit(SOLUTION[2]));
    act(() => result.current.restart());
    expect(result.current.cells[2].value).toBe(0);
    expect(result.current.mistakes).toBe(0);
  });
});

describe('solved', () => {
  it('is set once every cell matches the solution', () => {
    const { result } = setup();
    start(result);
    for (let i = 0; i < 81; i++) {
      if (!PUZZLE[i]) {
        act(() => result.current.selectCell(i));
        act(() => result.current.placeDigit(SOLUTION[i]));
      }
    }
    expect(result.current.solved).toBe(true);
  });
});

describe('persistence', () => {
  it('saves the game so a reload can resume', () => {
    const { result } = setup();
    start(result);
    const raw = localStorage.getItem('sudoku:game');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.cells).toHaveLength(81);
    expect(saved.solution).toEqual(SOLUTION);
  });
});
