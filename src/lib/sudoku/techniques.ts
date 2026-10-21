import { BOX_UNITS, COL_UNITS, ROW_UNITS, UNITS, bit, boxOf, colOf, popcount, rowOf } from './core.ts';

export interface Deduction {
  cell: number;
  digit: number;
  kind: 'place' | 'remove';
}

export interface Ctx {
  values: Int8Array;
  cand: Uint16Array;
}

export interface Technique {
  name: string;
  tier: number;
  find(ctx: Ctx): Deduction[] | null;
}

const digitsOf = (mask: number): number[] => {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
  return out;
};

const place = (cell: number, digit: number): Deduction[] => [{ cell, digit, kind: 'place' }];
const remove = (cell: number, digit: number): Deduction[] => [{ cell, digit, kind: 'remove' }];

/* ------------------------------------------------------------------ tier 1 */

const nakedSingle: Technique = {
  name: 'naked single',
  tier: 1,
  find({ values, cand }) {
    for (let i = 0; i < 81; i++) {
      if (values[i] || popcount(cand[i]) !== 1) continue;
      return place(i, digitsOf(cand[i])[0]);
    }
    return null;
  },
};

const hiddenSingle: Technique = {
  name: 'hidden single',
  tier: 1,
  find({ values, cand }) {
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        let spot = -1;
        let count = 0;
        for (const cell of unit) {
          if (values[cell] || !(cand[cell] & m)) continue;
          spot = cell;
          if (++count > 1) break;
        }
        if (count === 1) return place(spot, d);
      }
    }
    return null;
  },
};

/* ------------------------------------------------------------------ tier 2 */

const nakedPair: Technique = {
  name: 'naked pair',
  tier: 2,
  find({ values, cand }) {
    for (const unit of UNITS) {
      const pairCells: number[] = [];
      for (const cell of unit) if (!values[cell] && popcount(cand[cell]) === 2) pairCells.push(cell);
      for (let a = 0; a < pairCells.length; a++) {
        for (let b = a + 1; b < pairCells.length; b++) {
          const ca = pairCells[a];
          const cb = pairCells[b];
          if (cand[ca] !== cand[cb]) continue;
          const mask = cand[ca];
          const out: Deduction[] = [];
          for (const cell of unit) {
            if (cell === ca || cell === cb || values[cell]) continue;
            for (const d of digitsOf(mask)) {
              if (cand[cell] & bit(d)) out.push({ cell, digit: d, kind: 'remove' });
            }
          }
          if (out.length) return out;
        }
      }
    }
    return null;
  },
};

const hiddenPair: Technique = {
  name: 'hidden pair',
  tier: 2,
  find({ values, cand }) {
    for (const unit of UNITS) {
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          const mask = bit(d1) | bit(d2);
          const cells: number[] = [];
          let union = 0;
          for (const cell of unit) {
            if (values[cell]) continue;
            const c = cand[cell];
            if (c === 0 || c & ~mask) continue;
            cells.push(cell);
            union |= c;
          }
          if (cells.length === 2 && union === mask) {
            const out: Deduction[] = [];
            for (const cell of cells) {
              for (let d = 1; d <= 9; d++) {
                if (!(mask & bit(d)) && cand[cell] & bit(d)) out.push({ cell, digit: d, kind: 'remove' });
              }
            }
            if (out.length) return out;
          }
        }
      }
    }
    return null;
  },
};

const lockedCandidates: Technique = {
  name: 'locked candidates',
  tier: 2,
  find({ values, cand }) {
    for (const box of BOX_UNITS) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        const spots = box.filter((cell) => !values[cell] && cand[cell] & m);
        if (spots.length < 2) continue;
        const rows = new Set(spots.map(rowOf));
        const cols = new Set(spots.map(colOf));
        if (rows.size === 1) {
          const r = [...rows][0];
          const out: Deduction[] = [];
          for (const cell of ROW_UNITS[r]) {
            if (box.includes(cell) || values[cell] || !(cand[cell] & m)) continue;
            out.push({ cell, digit: d, kind: 'remove' });
          }
          if (out.length) return out;
        }
        if (cols.size === 1) {
          const c = [...cols][0];
          const out: Deduction[] = [];
          for (const cell of COL_UNITS[c]) {
            if (box.includes(cell) || values[cell] || !(cand[cell] & m)) continue;
            out.push({ cell, digit: d, kind: 'remove' });
          }
          if (out.length) return out;
        }
      }
    }
    for (const unit of [...ROW_UNITS, ...COL_UNITS]) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        const spots = unit.filter((cell) => !values[cell] && cand[cell] & m);
        if (spots.length < 2) continue;
        const boxes = new Set(spots.map(boxOf));
        if (boxes.size !== 1) continue;
        const b = [...boxes][0];
        const out: Deduction[] = [];
        for (const cell of BOX_UNITS[b]) {
          if (unit.includes(cell) || values[cell] || !(cand[cell] & m)) continue;
          out.push({ cell, digit: d, kind: 'remove' });
        }
        if (out.length) return out;
      }
    }
    return null;
  },
};

/* ------------------------------------------------------------------ tier 3 */

function nakedSubset(size: number): Technique {
  return {
    name: `naked ${size === 3 ? 'triple' : 'quad'}`,
    tier: 3,
    find({ values, cand }) {
      for (const unit of UNITS) {
        const cells: number[] = [];
        for (const cell of unit) {
          if (values[cell]) continue;
          const n = popcount(cand[cell]);
          if (n >= 2 && n <= size) cells.push(cell);
        }
        for (const combo of combinations(cells.length, size)) {
          let union = 0;
          for (const idx of combo) union |= cand[cells[idx]];
          if (popcount(union) !== size) continue;
          const chosen = combo.map((idx) => cells[idx]);
          const out: Deduction[] = [];
          for (const cell of unit) {
            if (chosen.includes(cell) || values[cell]) continue;
            for (const d of digitsOf(union)) {
              if (cand[cell] & bit(d)) out.push({ cell, digit: d, kind: 'remove' });
            }
          }
          if (out.length) return out;
        }
      }
      return null;
    },
  };
}

function hiddenSubset(size: number): Technique {
  return {
    name: `hidden ${size === 3 ? 'triple' : 'quad'}`,
    tier: 3,
    find({ values, cand }) {
      for (const unit of UNITS) {
        for (const digits of digitCombos(size)) {
          let mask = 0;
          for (const d of digits) mask |= bit(d);
          const cells: number[] = [];
          let union = 0;
          for (const cell of unit) {
            if (values[cell]) continue;
            const c = cand[cell];
            if (c === 0 || c & ~mask) continue;
            cells.push(cell);
            union |= c;
          }
          if (cells.length !== size || union !== mask) continue;
          const out: Deduction[] = [];
          for (const cell of cells) {
            for (let d = 1; d <= 9; d++) {
              if (!(mask & bit(d)) && cand[cell] & bit(d)) out.push({ cell, digit: d, kind: 'remove' });
            }
          }
          if (out.length) return out;
        }
      }
      return null;
    },
  };
}

const nakedTriple = nakedSubset(3);
const nakedQuad = nakedSubset(4);
const hiddenTriple = hiddenSubset(3);
const hiddenQuad = hiddenSubset(4);

/* ------------------------------------------------------------------ tier 4 */

const xWing: Technique = {
  name: 'x-wing',
  tier: 4,
  find({ values, cand }) {
    for (let d = 1; d <= 9; d++) {
      const m = bit(d);
      // rows a and b: the digit must sit in exactly the same two columns
      for (let a = 0; a < 9; a++) {
        const colsA = candidateCols(ROW_UNITS[a], values, cand, m);
        if (colsA.length !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          const colsB = candidateCols(ROW_UNITS[b], values, cand, m);
          if (colsB.length !== 2) continue;
          if (colsA[0] !== colsB[0] || colsA[1] !== colsB[1]) continue;
          const out: Deduction[] = [];
          for (const row of ROW_UNITS) {
            if (row === ROW_UNITS[a] || row === ROW_UNITS[b]) continue;
            for (const c of colsA) {
              const cell = row[c];
              if (values[cell] || !(cand[cell] & m)) continue;
              out.push({ cell, digit: d, kind: 'remove' });
            }
          }
          if (out.length) return out;
        }
      }
      // columns a and b: the digit must sit in exactly the same two rows
      for (let a = 0; a < 9; a++) {
        const rowsA = candidateRows(COL_UNITS[a], values, cand, m);
        if (rowsA.length !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          const rowsB = candidateRows(COL_UNITS[b], values, cand, m);
          if (rowsB.length !== 2) continue;
          if (rowsA[0] !== rowsB[0] || rowsA[1] !== rowsB[1]) continue;
          const out: Deduction[] = [];
          for (const col of COL_UNITS) {
            if (col === COL_UNITS[a] || col === COL_UNITS[b]) continue;
            for (const r of rowsA) {
              const cell = col[r];
              if (values[cell] || !(cand[cell] & m)) continue;
              out.push({ cell, digit: d, kind: 'remove' });
            }
          }
          if (out.length) return out;
        }
      }
    }
    return null;
  },
};

const swordfish: Technique = {
  name: 'swordfish',
  tier: 4,
  find({ values, cand }) {
    for (let d = 1; d <= 9; d++) {
      const m = bit(d);
      for (const trio of rowTriples()) {
        const sets = trio.map((row) => candidateCols(row, values, cand, m));
        if (sets.some((s) => s.length !== 3)) continue;
        if (!sameSet(sets[0], sets[1]) || !sameSet(sets[0], sets[2])) continue;
        const cols = sets[0];
        const out: Deduction[] = [];
        for (const row of ROW_UNITS) {
          if (trio.includes(row)) continue;
          for (const c of cols) {
            const cell = row[c];
            if (values[cell] || !(cand[cell] & m)) continue;
            out.push({ cell, digit: d, kind: 'remove' });
          }
        }
        if (out.length) return out;
      }
      for (const trio of colTriples()) {
        const sets = trio.map((col) => candidateRows(col, values, cand, m));
        if (sets.some((s) => s.length !== 3)) continue;
        if (!sameSet(sets[0], sets[1]) || !sameSet(sets[0], sets[2])) continue;
        const rows = sets[0];
        const out: Deduction[] = [];
        for (const col of COL_UNITS) {
          if (trio.includes(col)) continue;
          for (const r of rows) {
            const cell = col[r];
            if (values[cell] || !(cand[cell] & m)) continue;
            out.push({ cell, digit: d, kind: 'remove' });
          }
        }
        if (out.length) return out;
      }
    }
    return null;
  },
};

/* ------------------------------------------------------------------ tier 5 */

/**
 * Unique rectangle.
 *
 * Four cells in a 2x2 rectangle inside one box, limited to a pair of digits
 * {d1, d2}, with the pair appearing nowhere else in the two rows and the two
 * columns. One of the four corners must take a digit it cannot hold, so the
 * digit can be removed from that corner.
 */
const uniqueRectangle: Technique = {
  name: 'unique rectangle',
  tier: 5,
  find({ values, cand }) {
    for (const box of BOX_UNITS) {
      for (let r1 = 0; r1 < 3; r1++) {
        for (let r2 = r1 + 1; r2 < 3; r2++) {
          for (let c1 = 0; c1 < 3; c1++) {
            for (let c2 = c1 + 1; c2 < 3; c2++) {
              const corners = [box[r1 * 3 + c1], box[r1 * 3 + c2], box[r2 * 3 + c1], box[r2 * 3 + c2]];
              if (corners.some((cell) => values[cell])) continue;
              for (let d1 = 1; d1 <= 9; d1++) {
                for (let d2 = d1 + 1; d2 <= 9; d2++) {
                  const mask = bit(d1) | bit(d2);
                  if (corners.some((cell) => cand[cell] & ~mask)) continue;
                  let outside = false;
                  for (const r of [r1, r2]) {
                    for (let c = 0; c < 9; c++) {
                      const cell = r * 9 + c;
                      if (corners.includes(cell)) continue;
                      if (cand[cell] & mask) outside = true;
                    }
                  }
                  for (const c of [c1, c2]) {
                    for (let r = 0; r < 9; r++) {
                      const cell = r * 9 + c;
                      if (corners.includes(cell)) continue;
                      if (cand[cell] & mask) outside = true;
                    }
                  }
                  if (outside) continue;
                  for (const cell of corners) {
                    const has1 = (cand[cell] & bit(d1)) !== 0;
                    const has2 = (cand[cell] & bit(d2)) !== 0;
                    if (has1 && !has2) return remove(cell, d2);
                    if (has2 && !has1) return remove(cell, d1);
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};

/**
 * XY-Wing.
 *
 * The pivot holds {x, y}. One wing holds {x, z} and shares a unit with the
 * pivot, the other wing holds {y, z} and shares a unit with the pivot. If
 * the pivot is x the first wing must be z; if the pivot is y the second wing
 * must be z. Either way a cell that sees both wings cannot hold z.
 */
const xyWing: Technique = {
  name: 'xy-wing',
  tier: 5,
  find({ values, cand }) {
    const bivalue: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (!values[i] && popcount(cand[i]) === 2) bivalue.push(i);
    }
    for (const pivot of bivalue) {
      const [x, y] = digitsOf(cand[pivot]);
      for (const wingX of bivalue) {
        if (wingX === pivot) continue;
        const wingDigits = digitsOf(cand[wingX]);
        if (!wingDigits.includes(x) || wingDigits.includes(y)) continue;
        const z = wingDigits.find((d) => d !== x)!;
        for (const wingY of bivalue) {
          if (wingY === pivot || wingY === wingX) continue;
          if (cand[wingY] !== (bit(y) | bit(z))) continue;
          if (!sharesUnit(pivot, wingX) || !sharesUnit(pivot, wingY)) continue;
          for (let target = 0; target < 81; target++) {
            if (target === pivot || target === wingX || target === wingY || values[target]) continue;
            if (!(cand[target] & bit(z))) continue;
            if (!sees(target, wingX) || !sees(target, wingY)) continue;
            return remove(target, z);
          }
        }
      }
    }
    return null;
  },
};

/**
 * Forcing chain.
 *
 * Assume a digit in a cell and propagate singles. If the assumption leads to
 * a cell with no candidates, the assumption was wrong and the digit can be
 * removed. This is the last resort before guessing, and it is what makes the
 * hardest puzzles solvable without trial and error.
 */
const forcingChain: Technique = {
  name: 'forcing chain',
  tier: 6,
  find({ values, cand }) {
    for (let cell = 0; cell < 81; cell++) {
      if (values[cell]) continue;
      const mask = cand[cell];
      if (mask === 0) continue;
      for (const d of digitsOf(mask)) {
        if (contradicts(values, cand, cell, d)) return remove(cell, d);
      }
    }
    return null;
  },
};

/** Assumes `cell` holds `digit` and propagates singles; true when it breaks. */
function contradicts(values: Int8Array, cand: Uint16Array, cell: number, digit: number): boolean {
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
  const assumed = bit(digit);
  rowMask[rowOf(cell)] |= assumed;
  colMask[colOf(cell)] |= assumed;
  boxMask[boxOf(cell)] |= assumed;

  const filled = new Uint8Array(81);
  filled[cell] = 1;

  for (let step = 0; step < 81; step++) {
    let progressed = false;
    for (let i = 0; i < 81; i++) {
      if (filled[i]) continue;
      if (values[i]) {
        // a given is already placed; its own digit is not a contradiction
        filled[i] = 1;
        continue;
      }
      const mask = 0x1ff & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
      if (mask === 0) return true;
      if (popcount(mask) === 1) {
        filled[i] = 1;
        rowMask[rowOf(i)] |= mask;
        colMask[colOf(i)] |= mask;
        boxMask[boxOf(i)] |= mask;
        progressed = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        let spot = -1;
        let count = 0;
        for (const u of unit) {
          if (filled[u]) continue;
          if (rowMask[rowOf(u)] & m || colMask[colOf(u)] & m || boxMask[boxOf(u)] & m) continue;
          spot = u;
          if (++count > 1) break;
        }
        if (count === 1) {
          if (!(cand[spot] & m)) return false;
          filled[spot] = 1;
          rowMask[rowOf(spot)] |= m;
          colMask[colOf(spot)] |= m;
          boxMask[boxOf(spot)] |= m;
          progressed = true;
        }
      }
    }
    if (!progressed) return false;
  }
  return false;
}

/* -------------------------------------------------------------- utilities */

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b);
}

function sharesUnit(a: number, b: number): boolean {
  return rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b);
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const idx: number[] = [];
  const walk = (start: number) => {
    if (idx.length === k) {
      out.push([...idx]);
      return;
    }
    for (let i = start; i < n; i++) {
      idx.push(i);
      walk(i + 1);
      idx.pop();
    }
  };
  walk(0);
  return out;
}

function digitCombos(k: number): number[][] {
  const out: number[][] = [];
  const idx: number[] = [];
  const walk = (start: number) => {
    if (idx.length === k) {
      out.push([...idx]);
      return;
    }
    for (let i = start; i <= 9 - (k - idx.length); i++) {
      idx.push(i);
      walk(i + 1);
      idx.pop();
    }
  };
  walk(1);
  return out;
}

function candidateCols(unit: number[], values: Int8Array, cand: Uint16Array, m: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) {
    const cell = unit[c];
    if (!values[cell] && cand[cell] & m) out.push(c);
  }
  return out;
}

function candidateRows(unit: number[], values: Int8Array, cand: Uint16Array, m: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < 9; r++) {
    const cell = unit[r];
    if (!values[cell] && cand[cell] & m) out.push(r);
  }
  return out;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function rowTriples(): number[][][] {
  const out: number[][][] = [];
  for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) out.push([ROW_UNITS[a], ROW_UNITS[b], ROW_UNITS[c]]);
  return out;
}

function colTriples(): number[][][] {
  const out: number[][][] = [];
  for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) out.push([COL_UNITS[a], COL_UNITS[b], COL_UNITS[c]]);
  return out;
}

export const TECHNIQUES: Technique[] = [
  nakedSingle,
  hiddenSingle,
  nakedPair,
  hiddenPair,
  lockedCandidates,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
  hiddenQuad,
  xWing,
  swordfish,
  uniqueRectangle,
  xyWing,
  forcingChain,
];

export const TIER_TECHNIQUES: Technique[][] = (() => {
  const tiers: Technique[][] = [];
  for (const t of TECHNIQUES) {
    (tiers[t.tier - 1] ??= []).push(t);
  }
  return tiers;
})();
