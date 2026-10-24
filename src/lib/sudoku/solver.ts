import { ALL, bit, boxOf, colOf, computeCandidates, popcount, rowOf, solveUnique } from './core.ts';
import { TIER_TECHNIQUES, type Ctx, type Deduction } from './techniques.ts';

/** Supported logical deductions occupy tiers 1..6; tier 7 needs further search. */
export const MAX_DEDUCTION_TIER = 6;
export const TRIAL_TIER = 7;

export interface SolveResult {
  solved: boolean;
  values: Int8Array;
  /** Highest tier that fired while solving. */
  tier: number;
  steps: number;
}

export interface Hint {
  cell: number;
  digit: number;
  kind: 'place' | 'remove';
  technique: string;
  tier: number;
}

/** Applies one deduction to the working state. */
function apply(values: Int8Array, cand: Uint16Array, d: Deduction): void {
  if (d.kind === 'place') {
    values[d.cell] = d.digit;
    cand[d.cell] = 0;
    const m = bit(d.digit);
    for (let i = 0; i < 81; i++) {
      if (i === d.cell) continue;
      if (rowOf(i) === rowOf(d.cell) || colOf(i) === colOf(d.cell) || boxOf(i) === boxOf(d.cell)) cand[i] &= ~m;
    }
  } else {
    cand[d.cell] &= ~bit(d.digit);
  }
}

/**
 * Solves the puzzle with only techniques up to `maxTier`.
 *
 * Techniques are tried in ascending tier order and a lower tier always wins
 * over a higher one, so the highest tier that fires is exactly the tier the
 * puzzle needs from that ceiling.
 */
export function solveCapped(puzzle: ArrayLike<number>, maxTier: number): SolveResult {
  const values = new Int8Array(81);
  for (let i = 0; i < 81; i++) values[i] = puzzle[i] ?? 0;
  const cand = computeCandidates(values);
  const ctx: Ctx = { values, cand };

  let tier = 0;
  let steps = 0;

  // Every effective deduction removes at least one candidate bit, so the
  // search is bounded. Deductions that would not change the board are
  // skipped, which keeps a misfiring technique from looping forever.
  for (let guard = 0; guard < 1000; guard++) {
    let applied = false;
    for (let t = 1; t <= maxTier && !applied; t++) {
      for (const technique of TIER_TECHNIQUES[t - 1] ?? []) {
        const found = technique.find(ctx);
        if (!found || found.length === 0) continue;
        const effective = found.filter((d) =>
          d.kind === 'place' ? values[d.cell] === 0 : (cand[d.cell] & bit(d.digit)) !== 0,
        );
        if (effective.length === 0) continue;
        for (const d of effective) {
          apply(values, cand, d);
          steps++;
        }
        if (t > tier) tier = t;
        applied = true;
        break;
      }
    }
    if (!applied) break;
  }

  let solved = true;
  for (let i = 0; i < 81; i++) {
    if (!values[i]) {
      solved = false;
      break;
    }
  }

  return { solved, values, tier, steps };
}

/** True when the puzzle can be solved using only techniques up to `tier`. */
export function solvableWithin(puzzle: ArrayLike<number>, tier: number): boolean {
  if (tier <= 0) {
    for (let i = 0; i < 81; i++) if (!puzzle[i]) return false;
    return true;
  }
  return solveCapped(puzzle, tier).solved;
}

/**
 * Rates the puzzle against this solver's supported techniques.
 *
 * Lower-tier deductions always run first. The highest tier used is the minimum
 * ceiling for this deterministic solver, not a universal human difficulty score.
 */
export function ratePuzzle(puzzle: ArrayLike<number>): number {
  const result = solveCapped(puzzle, MAX_DEDUCTION_TIER);
  return result.solved ? result.tier : TRIAL_TIER;
}

/** Next logical step, used by the hint button. */
export function nextHint(puzzle: ArrayLike<number>): Hint | null {
  const values = new Int8Array(81);
  for (let i = 0; i < 81; i++) values[i] = puzzle[i] ?? 0;
  const cand = computeCandidates(values);
  const ctx: Ctx = { values, cand };

  for (let t = 1; t <= MAX_DEDUCTION_TIER; t++) {
    for (const technique of TIER_TECHNIQUES[t - 1] ?? []) {
      const found = technique.find(ctx);
      if (!found || found.length === 0) continue;
      const d = found[0];
      return { cell: d.cell, digit: d.digit, kind: d.kind, technique: technique.name, tier: t };
    }
  }
  return null;
}

/** Digits still legal for a cell, taking the current board into account. */
export function candidatesFor(values: ArrayLike<number>, cell: number): number[] {
  const out: number[] = [];
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
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
  return out;
}

export { popcount, solveUnique };
