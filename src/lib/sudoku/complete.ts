import { UNITS } from './core.ts';

export const COL_UNITS_START = 9;
export const BOX_UNITS_START = 18;
export const UNIT_COUNT = UNITS.length;

export type UnitKind = 'row' | 'col' | 'box';

/**
 * Which of the 27 units (9 rows, 9 columns, 9 boxes) are completely filled.
 *
 * A unit counts as complete once all nine of its cells hold a digit and none
 * of them is wrong, so a row with a mistake in it stays unfinished.
 */
export function computeCompletedUnits(
  values: ArrayLike<number>,
  wrong: ArrayLike<number>,
): boolean[] {
  const done = new Array<boolean>(UNIT_COUNT).fill(false);
  for (let u = 0; u < UNIT_COUNT; u++) {
    let complete = true;
    for (const cell of UNITS[u]) {
      if (!values[cell] || wrong[cell]) {
        complete = false;
        break;
      }
    }
    done[u] = complete;
  }
  return done;
}

export function unitKind(unit: number): UnitKind {
  if (unit < COL_UNITS_START) return 'row';
  if (unit < BOX_UNITS_START) return 'col';
  return 'box';
}

/**
 * Where a unit sits on the board, as fractions of the board size.
 *
 * Used to place the sweep that plays when the unit is finished.
 */
export function unitBox(unit: number): { left: number; top: number; width: number; height: number } {
  const kind = unitKind(unit);
  if (kind === 'row') {
    return { left: 0, top: unit / 9, width: 1, height: 1 / 9 };
  }
  if (kind === 'col') {
    return { left: (unit - COL_UNITS_START) / 9, top: 0, width: 1 / 9, height: 1 };
  }
  const box = unit - BOX_UNITS_START;
  return { left: (box % 3) / 3, top: Math.floor(box / 3) / 3, width: 1 / 3, height: 1 / 3 };
}
