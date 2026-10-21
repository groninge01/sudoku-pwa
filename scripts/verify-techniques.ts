import { computeCandidates, countSolutions, solveUnique } from '../src/lib/sudoku/core.ts';
import { TIER_TECHNIQUES, type Ctx } from '../src/lib/sudoku/techniques.ts';

/**
 * Soundness rules for a uniquely solvable puzzle:
 *  - place(d at c) is sound when the puzzle with c=d still has exactly one solution.
 *  - remove(d from c) is sound when d is not the true value of c. Removing the
 *    true value would make the cell unsolvable.
 */
function isSound(puzzle: number[], solution: Int8Array, cell: number, digit: number, kind: 'place' | 'remove'): boolean {
  if (kind === 'place') {
    if (puzzle[cell] !== 0) return false;
    const copy = [...puzzle];
    copy[cell] = digit;
    return countSolutions(copy, 2) === 1;
  }
  if (solution[cell] === digit) return false;
  return true;
}

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

const puzzles: number[][] = [];
for (let k = 0; k < 4000; k++) {
  const full = new Int8Array(81);
  const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = (pos / 9) | 0, c = pos % 9, b = (((pos / 9) | 0) / 3 | 0) * 3 + (((pos % 9) / 3) | 0);
    for (let d = 1; d <= 9; d++) {
      const m = 1 << (d - 1);
      if ((rm[r] | cm[c] | bm[b]) & m) continue;
      full[pos] = d; rm[r] |= m; cm[c] |= m; bm[b] |= m;
      if (fill(pos + 1)) return true;
      full[pos] = 0; rm[r] &= ~m; cm[c] &= ~m; bm[b] &= ~m;
    }
    return false;
  };
  fill(0);
  const p = Array.from(full);
  const cells = Array.from({ length: 81 }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) { const j = rand(i + 1); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const givens = 22 + rand(16);
  for (let i = 0; i < 81 - givens; i++) p[cells[i]] = 0;
  if (countSolutions(p, 2) === 1) puzzles.push(p);
}

const stats = new Map<string, { fired: number; unsound: number; examples: string[] }>();
for (const puzzle of puzzles) {
  const solution = solveUnique(puzzle);
  if (!solution) continue;
  const values = new Int8Array(81);
  for (let i = 0; i < 81; i++) values[i] = puzzle[i];
  const cand = computeCandidates(values);
  const ctx: Ctx = { values, cand };
  for (const tier of TIER_TECHNIQUES) {
    for (const technique of tier) {
      const found = technique.find(ctx);
      if (!found || found.length === 0) continue;
      const entry = stats.get(technique.name) ?? { fired: 0, unsound: 0, examples: [] };
      entry.fired++;
      for (const d of found) {
        if (!isSound(puzzle, solution, d.cell, d.digit, d.kind)) {
          entry.unsound++;
          if (entry.examples.length < 3) entry.examples.push(`cell=${d.cell} digit=${d.digit} kind=${d.kind} truth=${solution[d.cell]}`);
        }
      }
      stats.set(technique.name, entry);
    }
  }
}

let bad = 0;
for (const [name, s] of [...stats.entries()].sort()) {
  const flag = s.unsound > 0 ? ' <-- UNSOUND' : '';
  if (s.unsound > 0) bad++;
  console.log(`${name.padEnd(20)} fired=${String(s.fired).padStart(5)} unsound=${s.unsound}${flag} ${s.examples.join(' | ')}`);
}
console.log(bad === 0 ? 'ALL TECHNIQUES SOUND' : `${bad} UNSOUND TECHNIQUES`);
