import { useEffect, useRef, useState } from 'react';
import type { CellState } from '../state/game.ts';
import type { HighlightMap } from '../lib/sudoku/highlight.ts';
import { unitBox, unitKind } from '../lib/sudoku/complete.ts';

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

const CELEBRATION_MS = 1500;

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

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    },
    [],
  );

  return (
    <div className={`board${solved ? ' board--solved' : ''}`} role="grid" aria-label="Sudoku board">
      {cells.map((cell, i) => {
        const given = puzzle[i] !== 0;
        const kind = highlight.kinds[i];
        const isSame = activeDigit !== null && cell.value === activeDigit;
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
          valueConflicts[i] && highlightConflicts && 'cell--conflict',
          solved && 'cell--solved',
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
            style={{ ['--order' as string]: i }}
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
      <div className="board-celebrations" aria-hidden="true">
        {celebrating.map((unit) => {
          const box = unitBox(unit);
          return (
            <span
              key={unit}
              className={`celebrate celebrate--${unitKind(unit)}`}
              style={{
                left: `${box.left * 100}%`,
                top: `${box.top * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
