// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useGame } from './useGame';

beforeEach(() => localStorage.clear());
it('restores gameplay after the app is closed and reopened', () => {
  const puzzle = Array.from('530070000600195000098000060800060003400803001700020006060000280000419005000080079', Number);
  const solution = Array.from('534678912672195348198342567859761423426853791713924856961537284287419635345286179', Number);
  const first = renderHook(() => useGame({ soundEffects: false, autoRemoveNotes: true }));
  act(() => first.result.current.start(puzzle, solution, 'expert'));
  act(() => first.result.current.selectCell(2));
  act(() => first.result.current.placeDigit(solution[2]));
  const cells = first.result.current.cells;
  first.unmount();
  const reopened = renderHook(() => useGame({ soundEffects: false, autoRemoveNotes: true }));
  expect(reopened.result.current.cells).toEqual(cells);
  expect(reopened.result.current.selected).toBe(2);
  expect(reopened.result.current.difficulty).toBe('expert');
  expect(reopened.result.current.canUndo).toBe(true);
});
