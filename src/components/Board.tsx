import { useEffect, useRef, useState } from 'react';
import type { CellState } from '../state/game.ts';
import type { HighlightMap } from '../lib/sudoku/highlight.ts';
import { UNITS } from '../lib/sudoku/core.ts';
import { unitKind } from '../lib/sudoku/complete.ts';

export interface BoardProps {
  cells: CellState[];
  puzzle: number[];
  selected: number;
  highlight: HighlightMap;
  /** Pencil digits that are already placed in the cell's row, column or box. */
  noteConflicts: Uint16Array;
  highlightConflicts: boolean;
  /** The digit the board is focused on, or null when the selection is empty. */
  activeDigit: number | null;
  /** Filled cells that repeat a digit already placed in their row, column or box. */
  valueConflicts: Uint8Array;
  /** Which of the 27 units are completely and correctly filled. */
  completedUnits: boolean[];
  solved: boolean;
  onSelect(cell: number): void;
}

/** Outlives the longest sweep: 150 ms lead-in + 8 cells * 75 ms stagger + 520 ms. */
const CELEBRATION_MS = 1400;

/** Outlives the grid wave: 150 ms + 16 * 75 ms of diagonal stagger + 520 ms, plus slack. */
const SOLVED_SWEEP_MS = 2000;

/** Position of a cell on the sweep axis of a unit. */
function sweepIndex(unit: number, cell: number): number {
  const kind = unitKind(unit);
  const row = Math.floor(cell / 9);
  const col = cell % 9;
  // Rows run left to right, columns top to bottom,
  // boxes diagonally from the top left corner.
  if (kind === 'row') return col;
  if (kind === 'col') return row;
  return (row % 3) + (col % 3);
}

export function Board({
  cells,
  puzzle,
  selected,
  highlight,
  noteConflicts,
  highlightConflicts,
  activeDigit,
  valueConflicts,
  completedUnits,
  solved,
  onSelect,
}: BoardProps) {
  const signature = completedUnits.map((done) => (done ? '1' : '0')).join('');
  const previous = useRef(completedUnits);
  const timers = useRef<number[]>([]);
  const [celebrating, setCelebrating] = useState<number[]>([]);

  // A unit that just got finished plays its sweep. Units that were already
  // complete when the board mounted stay quiet.
  useEffect(() => {
    const newly: number[] = [];
    for (let i = 0; i < completedUnits.length; i++) {
      if (completedUnits[i] && !previous.current[i]) newly.push(i);
    }
    previous.current = completedUnits;
    if (!newly.length) return;
    setCelebrating((current) => [...current, ...newly]);
    const timer = window.setTimeout(() => {
      setCelebrating((current) => current.filter((unit) => !newly.includes(unit)));
    }, CELEBRATION_MS);
    timers.current.push(timer);
  }, [signature]);

  // The same light runs over the whole board diagonally when the puzzle is
  // finished. A game that loads already solved stays quiet.
  const wasSolved = useRef(solved);
  const [solvedSweep, setSolvedSweep] = useState(false);

  useEffect(() => {
    const justSolved = solved && !wasSolved.current;
    wasSolved.current = solved;
    if (!justSolved) return;
    setSolvedSweep(true);
    const timer = window.setTimeout(() => setSolvedSweep(false), SOLVED_SWEEP_MS);
    timers.current.push(timer);
  }, [solved]);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    },
    [],
  );

  // --sweep tells each cell where it sits on the light's path; undefined
  // means the cell is not part of a just-completed unit.
  const sweepOf = (i: number): number | undefined => {
    // The solved wave overrides any unit sweep still running.
    if (solvedSweep) return Math.floor(i / 9) + (i % 9);
    for (const unit of celebrating) {
      if (UNITS[unit].includes(i)) return sweepIndex(unit, i);
    }
    return undefined;
  };

  return (
    <div className="board" role="grid" aria-label="Sudoku board">
      {cells.map((cell, i) => {
        const given = puzzle[i] !== 0;
        const kind = highlight.kinds[i];
        const isSame = activeDigit !== null && cell.value === activeDigit;
        const sweep = sweepOf(i);
        const classes = [
          'cell',
          given && 'cell--given',
          cell.user && 'cell--user',
          cell.wrong && 'cell--wrong',
          i === selected && 'cell--selected',
          kind === 'peer' && 'cell--peer',
          (kind === 'same' || isSame) && 'cell--same',
          kind === 'same-peer' && 'cell--same-peer',
          kind === 'same-line' && 'cell--same-line',
          kind === 'same-box' && 'cell--same-line',
          valueConflicts[i] && highlightConflicts && 'cell--conflict',
          sweep !== undefined && 'cell--sweep',
          (i % 9 === 2 || i % 9 === 5) && 'cell--box-end',
          (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) && 'cell--row-end',
        ]
          .filter(Boolean)
          .join(' ');

        const value = cell.value || puzzle[i];
        const notes = cell.notes
          ? Array.from({ length: 9 }, (_, n) => (cell.notes & (1 << n) ? n + 1 : null)).filter(Boolean)
          : [];
        const content = value
          ? String(value)
          : notes.length
            ? ` candidates ${notes.join(', ')}`
            : ' empty';

        return (
          <button
            type="button"
            role="gridcell"
            aria-label={`Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1},${content}`}
            className={classes}
            style={{ ['--sweep' as string]: sweep ?? 0 }}
            key={i}
            onClick={() => onSelect(i)}
          >
            {value ? (
              value
            ) : notes.length ? (
              <span className="pencil-grid">
                {Array.from({ length: 9 }, (_, n) => {
                  const set = (cell.notes & (1 << n)) !== 0;
                  const conflict = set && highlightConflicts && (noteConflicts[i] & (1 << n)) !== 0;
                  const focused = set && activeDigit !== null && n + 1 === activeDigit;
                  const cls = [conflict && 'pencil-conflict', focused && 'pencil-focus']
                    .filter(Boolean)
                    .join(' ') || undefined;
                  return (
                    <span key={n} className={cls}>
                      {set ? n + 1 : ''}
                    </span>
                  );
                })}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
