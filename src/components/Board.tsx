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
  sameDigit: number | null;
  solved: boolean;
  onSelect(cell: number): void;
}

export function Board({ cells, puzzle, selected, highlight, noteConflicts, highlightConflicts, sameDigit, solved, onSelect }: BoardProps) {
  return (
    <div className={`board${solved ? ' board--solved' : ''}`} role="grid" aria-label="Sudoku board">
      {cells.map((cell, i) => {
        const given = puzzle[i] !== 0;
        const kind = highlight.kinds[i];
        const isSame = sameDigit !== null && cell.value === sameDigit;
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
                  return (
                    <span key={n} className={conflict ? 'pencil-conflict' : undefined}>
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
