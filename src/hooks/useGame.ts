import { useCallback, useEffect, useRef, useState } from 'react';
import { bit, boxOf, colOf, rowOf } from '../lib/sudoku/core.ts';
import { sounds } from '../lib/audio/sounds';
import type { Difficulty } from '../lib/sudoku/types.ts';
import { emptyCell, readGame, writeGame, type CellState, type HistoryEntry } from '../state/game.ts';

export interface UseGameOptions {
  soundEffects: boolean;
  autoRemoveNotes: boolean;
}

export interface GameApi {
  puzzle: number[];
  solution: number[];
  cells: CellState[];
  selected: number;
  mistakes: number;
  elapsedSeconds: number;
  notesMode: boolean;
  solved: boolean;
  difficulty: Difficulty;
  canUndo: boolean;
  selectCell(cell: number): void;
  placeDigit(digit: number): void;
  eraseCell(): void;
  toggleNotes(): void;
  fillCandidates(): void;
  undo(): void;
  restart(): void;
  start(puzzle: number[], solution: number[], difficulty: Difficulty): void;
}

function cellWithValue(value: number): CellState {
  return { ...emptyCell(), value };
}

/**
 * The whole game state in one hook: board, notes, mistakes, timer, undo stack
 * and the active-digit highlight.
 */
export function useGame(options: UseGameOptions): GameApi {
  const { soundEffects, autoRemoveNotes } = options;
  const saved = useRef(readGame()).current;

  const [puzzle, setPuzzle] = useState<number[]>(saved?.puzzle ?? Array(81).fill(0));
  const [solution, setSolution] = useState<number[]>(saved?.solution ?? Array(81).fill(0));
  const [cells, setCells] = useState<CellState[]>(
    saved?.cells ?? Array.from({ length: 81 }, emptyCell),
  );
  const [selected, setSelected] = useState(saved?.selected ?? -1);
  const [mistakes, setMistakes] = useState(saved?.mistakes ?? 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(saved?.elapsedSeconds ?? 0);
  const [notesMode, setNotesMode] = useState(saved?.notesMode ?? false);
  const [history, setHistory] = useState<HistoryEntry[]>(saved?.history ?? []);
  const solved = solution.some(Boolean) && cells.every((cell, i) => cell.value === solution[i]);
  const [difficulty, setDifficulty] = useState<Difficulty>(saved?.difficulty ?? 'easy');

  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const puzzleRef = useRef(puzzle);
  puzzleRef.current = puzzle;

  const play = useCallback(
    (key: keyof typeof sounds) => {
      if (soundEffects) sounds[key]();
    },
    [soundEffects],
  );

  // Persist the game so a reload resumes exactly where the player left off.
  useEffect(() => {
    if (!solution.some(Boolean)) return;
    writeGame({
      difficulty,
      puzzle,
      solution,
      cells,
      selected,
      mistakes,
      elapsedSeconds,
      notesMode,
      history,
      savedAt: Date.now(),
    });
  }, [difficulty, puzzle, solution, cells, selected, mistakes, elapsedSeconds, notesMode, history]);

  // The clock runs while a puzzle is in play.
  const running = solution.some(Boolean) && !solved;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const push = useCallback(
    (
      cell: number,
      before: CellState,
      after: CellState,
      mistake: boolean,
      clearedNotes?: [cell: number, notes: number][],
    ) => {
      const entry: HistoryEntry = { cell, before: { ...before }, after: { ...after }, mistake };
      if (clearedNotes?.length) entry.clearedNotes = clearedNotes;
      setHistory((h) => [...h, entry]);
    },
    [],
  );

  const selectCell = useCallback((cell: number) => {
    setSelected(cell);
  }, []);

  /** Peers of a cell: same row, column or box. */
  const peersOf = useCallback((cell: number): number[] => {
    const out: number[] = [];
    const r = rowOf(cell);
    const c = colOf(cell);
    const b = boxOf(cell);
    for (let i = 0; i < 81; i++) {
      if (i === cell) continue;
      if (rowOf(i) === r || colOf(i) === c || boxOf(i) === b) out.push(i);
    }
    return out;
  }, []);

  const placeDigit = useCallback(
    (digit: number) => {
      if (selected < 0) return;
      const current = cellsRef.current[selected];
      // Givens and correct entries are locked; a wrong entry stays editable.
      if (puzzleRef.current[selected] || (current.value && !current.wrong)) {
        play('locked');
        return;
      }

      if (notesMode) {
        const after = { ...current, notes: current.notes ^ bit(digit) };
        setCells((c) => c.map((v, i) => (i === selected ? after : v)));
        push(selected, current, after, false);
        play('note');
        return;
      }

      const wrong = digit !== solution[selected];
      const after: CellState = { value: digit, user: true, wrong, notes: 0 };
      const next = cellsRef.current.map((c) => ({ ...c }));
      next[selected] = after;

      let cleared: [cell: number, notes: number][] | undefined;
      if (autoRemoveNotes) {
        const m = bit(digit);
        for (const peer of peersOf(selected)) {
          if (next[peer].notes & m) {
            (cleared ??= []).push([peer, next[peer].notes]);
            next[peer].notes &= ~m;
          }
        }
      }

      setCells(next);
      push(selected, current, after, wrong, cleared);
      if (wrong) {
        setMistakes((m) => m + 1);
        play('mistake');
      } else {
        play('place');
      }

      if (next.every((c, i) => c.value === solution[i])) {
        play('solved');
      }
    },
    [autoRemoveNotes, notesMode, peersOf, play, push, selected, solution],
  );

  const eraseCell = useCallback(() => {
    if (selected < 0) return;
    const current = cellsRef.current[selected];
    if (puzzleRef.current[selected] || (current.value && !current.wrong)) {
        play('locked');
      return;
    }
    if (current.value === 0 && current.notes === 0) return;
    const after = emptyCell();
    setCells((c) => c.map((v, i) => (i === selected ? after : v)));
    push(selected, current, after, false);
    play('erase');
  }, [play, push, selected]);

  const toggleNotes = useCallback(() => setNotesMode((n) => !n), []);

  /**
   * Writes the legal candidates into every empty cell in one go.
   *
   * Candidates are computed from the givens and the correct values on the
   * board, so a wrong digit that is still in a cell cannot spoil the notes.
   */
  const fillCandidates = useCallback(() => {
    const board = cellsRef.current;
    const truth = new Int8Array(81);
    for (let i = 0; i < 81; i++) {
      const cell = board[i];
      if (puzzleRef.current[i]) truth[i] = puzzleRef.current[i];
      else if (cell.value && !cell.wrong) truth[i] = cell.value;
    }
    const rowMask = new Uint16Array(9);
    const colMask = new Uint16Array(9);
    const boxMask = new Uint16Array(9);
    for (let i = 0; i < 81; i++) {
      const v = truth[i];
      if (!v) continue;
      const m = bit(v);
      rowMask[rowOf(i)] |= m;
      colMask[colOf(i)] |= m;
      boxMask[boxOf(i)] |= m;
    }
    const changes: [cell: number, before: CellState][] = [];
      setCells(
        board.map((cell, i) => {
        if (cell.value) return cell;
        const mask = 0x1ff & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
          if (mask !== cell.notes) changes.push([i, { ...cell }]);
          return { ...cell, notes: mask };
        }),
      );
    if (changes.length) {
      const entry: HistoryEntry = {
        cell: -1,
        before: emptyCell(),
        after: emptyCell(),
        mistake: false,
        bulk: changes,
      };
      setHistory((h) => [...h, entry]);
    }
    play('note');
  }, [play]);

  const undo = useCallback(() => {
    const entry = history[history.length - 1];
    if (!entry) return;
    setCells((c) =>
      c.map((v, i) => {
        if (i === entry.cell) return entry.before;
        const bulk = entry.bulk?.find(([cell]) => cell === i);
        if (bulk) return bulk[1];
          const cleared = entry.clearedNotes?.find(([cell]) => cell === i);
          return cleared ? { ...v, notes: cleared[1] } : v;
      }),
    );
    setHistory((h) => h.slice(0, -1));
    if (entry.mistake) setMistakes((m) => Math.max(0, m - 1));
    play('undo');
  }, [history, play]);

  const restart = useCallback(() => {
    setCells(puzzleRef.current.map((v) => (v ? cellWithValue(v) : emptyCell())));
    setMistakes(0);
    setElapsedSeconds(0);
    setHistory([]);
    setSelected(-1);
  }, []);

  const start = useCallback((newPuzzle: number[], newSolution: number[], newDifficulty: Difficulty) => {
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setDifficulty(newDifficulty);
    setCells(newPuzzle.map((v) => (v ? cellWithValue(v) : emptyCell())));
    setSelected(-1);
    setMistakes(0);
    setElapsedSeconds(0);
    setHistory([]);
  }, []);

  return {
    puzzle,
    solution,
    cells,
    selected,
    mistakes,
    elapsedSeconds,
    notesMode,
    solved,
    difficulty,
    canUndo: history.length > 0,
    selectCell,
    placeDigit,
    eraseCell,
    toggleNotes,
    fillCandidates,
    undo,
    restart,
    start,
  };
}
