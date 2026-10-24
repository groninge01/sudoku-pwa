// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGame } from './useGame';

const puzzle = Array.from('530070000600195000098000060800060003400803001700020006060000280000419005000080079', Number);
const solution = Array.from('534678912672195348198342567859761423426853791713924856961537284287419635345286179', Number);
const open = () => renderHook(() => useGame({ soundEffects: false, autoRemoveNotes: true }));
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('keeps a completed game complete and its timer stopped after reopening', () => {
  const first = open();
  act(() => first.result.current.start(puzzle, solution, 'easy'));
  act(() => vi.advanceTimersByTime(4000));
  for (let i = 0; i < 81; i++) {
    if (puzzle[i]) continue;
    act(() => first.result.current.selectCell(i));
    act(() => first.result.current.placeDigit(solution[i]));
  }
  expect(first.result.current.solved).toBe(true);
  expect(first.result.current.elapsedSeconds).toBe(4);
  act(() => vi.advanceTimersByTime(5000));
  expect(first.result.current.elapsedSeconds).toBe(4);
  first.unmount();
  const reopened = open();
  expect(reopened.result.current.solved).toBe(true);
  act(() => vi.advanceTimersByTime(10000));
  expect(reopened.result.current.elapsedSeconds).toBe(4);
  act(() => reopened.result.current.restart());
  expect(reopened.result.current.solved).toBe(false);
  act(() => vi.advanceTimersByTime(1000));
  expect(reopened.result.current.elapsedSeconds).toBe(1);
});

it('does not treat a fresh empty game as complete', () => {
  const game = open();
  expect(game.result.current.solved).toBe(false);
  act(() => vi.advanceTimersByTime(5000));
  expect(game.result.current.elapsedSeconds).toBe(0);
});
