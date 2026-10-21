import { bit, boxOf, colOf, rowOf } from './core.ts';

export type HighlightKind = 'none' | 'peer' | 'same' | 'same-peer' | 'same-line';

export interface HighlightMap {
  /** One entry per cell. */
  kinds: HighlightKind[];
  /** Cells that hold the active digit. */
  sameDigitCells: number[];
  /** Rows and columns that contain a cell with the active digit. */
  sameDigitRows: number[];
  sameDigitCols: number[];
}

/**
 * Builds the highlight map for the current selection.
 *
 * The selected cell lights its own row, column and box. When a digit is
 * active, every cell holding that digit is marked, and the rows and columns
 * those cells sit in are marked as well, so the connections are visible.
 */
export function computeHighlights(
  values: ArrayLike<number>,
  selected: number,
  activeDigit: number | null,
): HighlightMap {
  const kinds: HighlightKind[] = new Array(81).fill('none');
  const sameDigitCells: number[] = [];
  const sameDigitRows: number[] = [];
  const sameDigitCols: number[] = [];

  const peerCells = new Set<number>();
  if (selected >= 0) {
    const r = rowOf(selected);
    const c = colOf(selected);
    const b = boxOf(selected);
    for (let i = 0; i < 81; i++) {
      if (i === selected) continue;
      if (rowOf(i) === r || colOf(i) === c || boxOf(i) === b) peerCells.add(i);
    }
  }

  if (activeDigit !== null) {
    for (let i = 0; i < 81; i++) {
      if (values[i] === activeDigit) sameDigitCells.push(i);
    }
    for (const cell of sameDigitCells) {
      const r = rowOf(cell);
      const c = colOf(cell);
      if (!sameDigitRows.includes(r)) sameDigitRows.push(r);
      if (!sameDigitCols.includes(c)) sameDigitCols.push(c);
    }
  }

  for (let i = 0; i < 81; i++) {
    const isPeer = peerCells.has(i);
    const isSame = sameDigitCells.includes(i);
    const onSameLine = sameDigitRows.includes(rowOf(i)) || sameDigitCols.includes(colOf(i));
    if (isSame) kinds[i] = isPeer ? 'same-peer' : 'same';
    else if (isPeer) kinds[i] = 'peer';
    else if (onSameLine) kinds[i] = 'same-line';
  }

  return { kinds, sameDigitCells, sameDigitRows, sameDigitCols };
}


/**
 * Pencil digits that are already on the board in the cell's row, column or box.
 *
 * One bitmask per cell; bit 0 is digit 1. A cell that holds a value has no
 * notes, so the mask only ever describes digits that conflict with its marks.
 * Every placement counts, wrong ones included: the digit occupies the cell,
 * so no other cell in that unit can hold it.
 */
export function computeNoteConflicts(values: ArrayLike<number>): Uint16Array {
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (!v) continue;
    const m = bit(v);
    rowMask[rowOf(i)] |= m;
    colMask[colOf(i)] |= m;
    boxMask[boxOf(i)] |= m;
  }
  const conflicts = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    conflicts[i] = rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)];
  }
  return conflicts;
}
