/** Grid helpers shared by the solver, the generator and the UI. */

export const ALL = 0x1ff;

const POPCOUNT = new Uint8Array(512);
for (let m = 1; m < 512; m++) POPCOUNT[m] = POPCOUNT[m >> 1] + (m & 1);

export const popcount = (mask: number): number => POPCOUNT[mask & 0x1ff];

export const rowOf = (i: number): number => (i / 9) | 0;
export const colOf = (i: number): number => i % 9;
export const boxOf = (i: number): number => (((i / 9) | 0) / 3 | 0) * 3 + (((i % 9) / 3) | 0);

export const bit = (digit: number): number => 1 << (digit - 1);

export const ROW_UNITS: number[][] = [];
export const COL_UNITS: number[][] = [];
export const BOX_UNITS: number[][] = [];

for (let r = 0; r < 9; r++) ROW_UNITS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) COL_UNITS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) {
  const br = ((b / 3) | 0) * 3;
  const bc = (b % 3) * 3;
  const unit: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) unit.push((br + r) * 9 + bc + c);
  BOX_UNITS.push(unit);
}

export const UNITS: number[][] = [...ROW_UNITS, ...COL_UNITS, ...BOX_UNITS];

export const CELL_UNITS: number[][] = [];
export const PEERS: number[][] = [];

for (let i = 0; i < 81; i++) {
  CELL_UNITS.push([rowOf(i), 9 + colOf(i), 18 + boxOf(i)]);
  const set = new Set<number>();
  for (const u of CELL_UNITS[i]) for (const cell of UNITS[u]) if (cell !== i) set.add(cell);
  PEERS.push([...set]);
}

export function computeCandidates(values: ArrayLike<number>): Uint16Array {
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
  const cand = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    if (values[i]) {
      cand[i] = 0;
      continue;
    }
    cand[i] = ALL & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
  }
  return cand;
}

/** Digits still legal for a cell, given the digits currently on the board. */
export function legalCandidates(values: ArrayLike<number>, cell: number): number {
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (!v || i === cell) continue;
    const m = bit(v);
    rowMask[rowOf(i)] |= m;
    colMask[colOf(i)] |= m;
    boxMask[boxOf(i)] |= m;
  }
  const mask = ALL & ~(rowMask[rowOf(cell)] | colMask[colOf(cell)] | boxMask[boxOf(cell)]);
  return mask;
}

export function isComplete(values: ArrayLike<number>): boolean {
  for (let i = 0; i < 81; i++) if (!values[i]) return false;
  return true;
}

/** Counts solutions up to `limit`; used for the uniqueness check while digging. */
export function countSolutions(puzzle: ArrayLike<number>, limit = 2): number {
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);
  const empties: number[] = [];

  for (let i = 0; i < 81; i++) {
    const v = puzzle[i];
    if (!v) {
      empties.push(i);
      continue;
    }
    const m = bit(v);
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if ((rowMask[r] | colMask[c] | boxMask[b]) & m) return 0;
    rowMask[r] |= m;
    colMask[c] |= m;
    boxMask[b] |= m;
  }

  let count = 0;
  const grid = new Int8Array(81);

  const recurse = (k: number): void => {
    if (count >= limit) return;
    if (k === empties.length) {
      count++;
      return;
    }
    let bestIdx = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let j = k; j < empties.length; j++) {
      const i = empties[j];
      const mask = ALL & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
      const c = popcount(mask);
      if (c === 0) return;
      if (c < bestCount) {
        bestCount = c;
        bestIdx = j;
        bestMask = mask;
        if (c === 1) break;
      }
    }
    if (bestIdx < 0) return;
    const i = empties[bestIdx];
    const tmp = empties[k];
    empties[k] = empties[bestIdx];
    empties[bestIdx] = tmp;

    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    for (let d = 1; d <= 9; d++) {
      const m = bit(d);
      if (!(bestMask & m)) continue;
      rowMask[r] |= m;
      colMask[c] |= m;
      boxMask[b] |= m;
      grid[i] = d;
      recurse(k + 1);
      grid[i] = 0;
      rowMask[r] &= ~m;
      colMask[c] &= ~m;
      boxMask[b] &= ~m;
      if (count >= limit) break;
    }
    const tmp2 = empties[k];
    empties[k] = empties[bestIdx];
    empties[bestIdx] = tmp2;
  };

  recurse(0);
  return count;
}

/** Returns the unique solution of a puzzle, or null when it has none. */
export function solveUnique(puzzle: ArrayLike<number>): Int8Array | null {
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);
  const empties: number[] = [];

  for (let i = 0; i < 81; i++) {
    const v = puzzle[i];
    if (!v) {
      empties.push(i);
      continue;
    }
    const m = bit(v);
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if ((rowMask[r] | colMask[c] | boxMask[b]) & m) return null;
    rowMask[r] |= m;
    colMask[c] |= m;
    boxMask[b] |= m;
  }

  const grid = new Int8Array(81);
  for (let i = 0; i < 81; i++) grid[i] = puzzle[i] ? puzzle[i] : 0;

  const recurse = (k: number): boolean => {
    if (k === empties.length) return true;
    let bestIdx = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let j = k; j < empties.length; j++) {
      const i = empties[j];
      const mask = ALL & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
      const c = popcount(mask);
      if (c === 0) return false;
      if (c < bestCount) {
        bestCount = c;
        bestIdx = j;
        bestMask = mask;
        if (c === 1) break;
      }
    }
    if (bestIdx < 0) return false;
    const i = empties[bestIdx];
    const tmp = empties[k];
    empties[k] = empties[bestIdx];
    empties[bestIdx] = tmp;

    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    for (let d = 1; d <= 9; d++) {
      const m = bit(d);
      if (!(bestMask & m)) continue;
      rowMask[r] |= m;
      colMask[c] |= m;
      boxMask[b] |= m;
      grid[i] = d;
      if (recurse(k + 1)) {
        const t2 = empties[k];
        empties[k] = empties[bestIdx];
        empties[bestIdx] = t2;
        return true;
      }
      grid[i] = 0;
      rowMask[r] &= ~m;
      colMask[c] &= ~m;
      boxMask[b] &= ~m;
    }
    const t3 = empties[k];
    empties[k] = empties[bestIdx];
    empties[bestIdx] = t3;
    return false;
  };

  return recurse(0) ? grid : null;
}
