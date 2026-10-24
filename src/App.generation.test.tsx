// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { writeGame } from './state/game';

const generate = vi.hoisted(() => vi.fn());
vi.mock('./hooks/usePuzzleGenerator', () => ({ usePuzzleGenerator: () => ({ generate }) }));
vi.mock('./hooks/useTheme', () => ({ useTheme: () => ({}) }));
const puzzle = Array.from('530070000600195000098000060800060003400803001700020006060000280000419005000080079', Number);
const solution = Array.from('534678912672195348198342567859761423426853791713924856961537284287419635345286179', Number);
beforeEach(() => { localStorage.clear(); generate.mockReset(); });
afterEach(cleanup);

it('offers a retry after generation fails instead of silently changing difficulty', async () => {
  generate.mockRejectedValueOnce(new Error('Puzzle generation timed out')).mockResolvedValueOnce({ puzzle, solution });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Start puzzle' }));
  const dialog = await screen.findByRole('dialog', { name: "Couldn't create this puzzle" });
  expect(dialog.textContent).toContain('Easy');
  expect(document.querySelector('.busy-overlay')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('grid', { name: 'Sudoku board' });
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate).toHaveBeenNthCalledWith(1, 'easy');
  expect(generate).toHaveBeenNthCalledWith(2, 'easy');
});

it('preserves the current board when replacing it fails', async () => {
  const cells = puzzle.map(value => ({ value, user: false, wrong: false, notes: 0 }));
  writeGame({ difficulty: 'easy', puzzle, solution, cells, selected: -1, mistakes: 0, elapsedSeconds: 123, notesMode: false, history: [], savedAt: Date.now() });
  generate.mockRejectedValueOnce(new Error('Puzzle generation timed out'));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'New game' }));
  fireEvent.click(screen.getByRole('button', { name: 'New Easy puzzle' }));
  await screen.findByRole('dialog', { name: "Couldn't create this puzzle" });
  expect(JSON.parse(localStorage.getItem('sudoku:game')!).cells).toEqual(cells);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getAllByRole('gridcell')).toHaveLength(81);
});
