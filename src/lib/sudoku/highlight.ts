import { UNITS, bit, boxOf, colOf, rowOf } from './core.ts';

export type HighlightKind = 'none' | 'peer' | 'same' | 'same-peer' | 'same-line' | 'same-box';

export interface HighlightMap {
  /** One entry per cell. */
  kinds: HighlightKind[];
  /** Cells that hold the active digit. */
  sameDigitCells: number[];
  /** Rows, columns and boxes that contain a cell with the active digit. */
  sameDigitRows: number[];
  sameDigitCols: number[];
  sameDigitBoxes: number[];
}

/**
 * The digit the board is currently focused on.
 *
 * It is always derived from the selected cell, never remembered separately:
 * a cell that holds a digit focuses that digit, an empty cell focuses
 * nothing. That keeps the highlight in step with the board after every
 * entry, erase, undo and reload.
 */
export function activeDigitFor(values: ArrayLike<number>, selected: number): number | null {
  if (selected < 0 || selected >= values.length) return null;
  const value = values[selected];
  return value || null;
}

/**
 * Filled cells that clash with another filled cell.
 *
 * Two filled cells that share a row, column or box and hold the same digit
 * cannot both be right. Only the player's own entries are flagged: a given
 * is by definition correct, so the clash belongs to the entry next to it.
 */
export function computeValueConflicts(
  values: ArrayLike<number>,
  givens: ArrayLike<number>,
): Uint8Array {
  const mask = new Uint8Array(81);
  for (const unit of UNITS) {
    for (const cell of unit) {
      const digit = values[cell];
      if (!digit || givens[cell]) continue;
      for (const other of unit) {
        if (other !== cell && values[other] === digit) {
          mask[cell] = 1;
          break;
        }
      }
    }
  }
  return mask;
}

/**
 * Builds the highlight map for the current selection.
 *
 * The selected cell lights its own row, column and box. When a digit is
 * active, every cell holding that digit is marked, and the rows, columns
 * and boxes those cells sit in are marked as well, so the connections are
 * visible.
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
  const sameDigitBoxes: number[] = [];

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
      const b = boxOf(cell);
      if (!sameDigitRows.includes(r)) sameDigitRows.push(r);
      if (!sameDigitCols.includes(c)) sameDigitCols.push(c);
      if (!sameDigitBoxes.includes(b)) sameDigitBoxes.push(b);
    }
  }

  for (let i = 0; i < 81; i++) {
    const isPeer = peerCells.has(i);
    const isSame = sameDigitCells.includes(i);
    const onSameLine = sameDigitRows.includes(rowOf(i)) || sameDigitCols.includes(colOf(i));
    const inSameBox = sameDigitBoxes.includes(boxOf(i));
    if (isSame) kinds[i] = isPeer ? 'same-peer' : 'same';
    else if (isPeer) kinds[i] = 'peer';
    else if (onSameLine) kinds[i] = 'same-line';
    else if (inSameBox) kinds[i] = 'same-box';
  }

  return { kinds, sameDigitCells, sameDigitRows, sameDigitCols, sameDigitBoxes };
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
