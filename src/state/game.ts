import type { Difficulty } from '../lib/sudoku/types.ts';
import { loadState, saveState } from './storage.ts';

export interface CellState {
  /** 0 = empty. */
  value: number;
  /** True when the value was placed by the player. */
  user: boolean;
  /** True when the value does not match the solution. */
  wrong: boolean;
  /** Pencil marks, bit 0 is digit 1. */
  notes: number;
}

export interface SavedGame {
  difficulty: Difficulty;
  puzzle: number[];
  solution: number[];
  cells: CellState[];
  selected: number;
  mistakes: number;
  elapsedSeconds: number;
  notesMode: boolean;
  history: HistoryEntry[];
  savedAt: number;
}

export interface HistoryEntry {
  cell: number;
  before: CellState;
  after: CellState;
  /** True when the move counted as a mistake. */
  mistake: boolean;
  /**
   * Notes the move auto-cleared in peer cells, as [cell, notesBefore] pairs.
   * Older saves do not carry this; undo treats a missing list as empty.
   */
  clearedNotes?: [cell: number, notes: number][];
  /**
   * Bulk moves like "fill all notes" store the before-state of every cell
   * they touched as [cell, before] pairs; one undo restores them all.
   */
  bulk?: [cell: number, before: CellState][];
}

const KEY = 'game';

export function emptyCell(): CellState {
  return { value: 0, user: false, wrong: false, notes: 0 };
}

export function readGame(): SavedGame | null {
  const game = loadState<SavedGame | null>(KEY, null);
  if (!game || !Array.isArray(game.cells) || game.cells.length !== 81) return null;
  return game;
}

export function writeGame(game: SavedGame): void {
  saveState(KEY, game);
}

export function clearGame(): void {
  saveState(KEY, null);
}
