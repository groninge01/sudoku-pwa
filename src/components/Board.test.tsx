// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Board } from './Board';
import { computeHighlights } from '../lib/sudoku/highlight';
import { emptyCell } from '../state/game';
afterEach(cleanup);
it('highlights correct filled cells in other boxes without lighting their empty neighbours', () => {
  const cells = Array.from({ length: 81 }, emptyCell);
  cells[0] = { value: 5, user: false, wrong: false, notes: 0 };
  cells[40] = { value: 7, user: true, wrong: false, notes: 0 };
  cells[50] = { value: 8, user: true, wrong: true, notes: 0 };
  const puzzle = cells.map((c, i) => i === 0 ? c.value : 0);
  const draw = (activeDigit: number | null) => <Board cells={cells} puzzle={puzzle} selected={0} highlight={computeHighlights(cells.map(c => c.value), 0, activeDigit)} noteConflicts={new Uint16Array(81)} highlightConflicts activeDigit={activeDigit} valueConflicts={new Uint8Array(81)} completedUnits={Array(27).fill(false)} solved={false} onSelect={() => {}} />;
  const { container, rerender } = render(draw(5));
  const at = (i: number) => container.querySelectorAll('.cell')[i];
  expect(at(40).classList.contains('cell--same-line')).toBe(true);
  expect(at(41).classList.contains('cell--same-line')).toBe(false);
  expect(at(50).classList.contains('cell--same-line')).toBe(false);
  rerender(draw(null));
  expect(at(40).classList.contains('cell--same-line')).toBe(false);
});
