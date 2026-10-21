import type { CellState } from '../state/game.ts';
import type { HighlightMap } from '../lib/sudoku/highlight.ts';

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
  solved: boolean;
  onSelect(cell: number): void;
}

export function Board({ cells, puzzle, selected, highlight, noteConflicts, highlightConflicts, activeDigit, solved, onSelect }: BoardProps) {
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
    </div>
  );
}
