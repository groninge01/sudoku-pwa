import { beforeEach, describe, expect, it } from 'vitest';
import { clearGame, emptyCell, readGame, writeGame, type SavedGame } from './game.ts';

const map = new Map<string, string>();
beforeEach(() => {
  map.clear();
  // @ts-expect-error test double for localStorage
  globalThis.localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
});

const game = (): SavedGame => ({
  difficulty: 'easy',
  puzzle: Array(81).fill(0),
  solution: Array(81).fill(1),
  cells: Array.from({ length: 81 }, emptyCell),
  selected: -1,
  mistakes: 0,
  elapsedSeconds: 0,
  notesMode: false,
  history: [],
  savedAt: Date.now(),
});

describe('game persistence', () => {
  it('returns null when no game is saved', () => {
    expect(readGame()).toBeNull();
  });

  it('round-trips a saved game', () => {
    const g = game();
    g.cells[0] = { value: 4, user: true, wrong: false, notes: 0 };
    g.cells[1].notes = 0b101;
    writeGame(g);
    const loaded = readGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.cells[0]).toEqual({ value: 4, user: true, wrong: false, notes: 0 });
    expect(loaded!.cells[1].notes).toBe(0b101);
    expect(loaded!.difficulty).toBe('easy');
  });

  it('rejects a saved blob with the wrong cell count', () => {
    const bad = { ...game(), cells: [] };
    map.set('sudoku:game', JSON.stringify(bad));
    expect(readGame()).toBeNull();
  });

  it('rejects a saved blob that is not a game', () => {
    map.set('sudoku:game', JSON.stringify({ hello: 'world' }));
    expect(readGame()).toBeNull();
    map.set('sudoku:game', JSON.stringify(5));
    expect(readGame()).toBeNull();
  });

  it('clearGame removes the saved game', () => {
    writeGame(game());
    clearGame();
    expect(readGame()).toBeNull();
  });
});
