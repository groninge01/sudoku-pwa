import { countSolutions } from '../src/lib/sudoku/core.ts';
import { solveCapped } from '../src/lib/sudoku/solver.ts';
import { mulberry32, shuffle } from '../src/lib/sudoku/rng.ts';

function randomGrid(rng: () => number): Int8Array {
  const grid = new Int8Array(81);
  const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = (pos / 9) | 0, c = pos % 9, b = (((pos / 9) | 0) / 3 | 0) * 3 + (((pos % 9) / 3) 	| 0);
    for (const d of shuffle([1,2,3,4,5,6,7,8,9], rng)) {
      const m = 1 << (d - 1);
      if ((rm[r] | cm[c] | bm[b]) & m) continue;
      grid[pos] = d; rm[r] |= m; cm[c] |= m; bm[b] |= m;
      if (fill(pos + 1)) return true;
      grid[pos] = 0; rm[r] &= ~m; cm[c] &= ~m; bm[b] &= ~m;
    }
    return false;
  };
  fill(0);
  return grid;
}

const rng = mulberry32(Number(process.argv[2] ?? 5));
for (let round = 0; round < 5; round++) {
  const full = randomGrid(rng);
  const puzzle = Array.from(full);
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  const t0 = Date.now();
  const tierTrace: number[] = [];
  for (const cell of order) {
    if (!puzzle[cell]) continue;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) !== 1) { puzzle[cell] = backup; continue; }
    const r = solveCapped(puzzle, 5);
    tierTrace.push(r.tier);
  }
  const clues = puzzle.filter(Boolean).length;
  const final = solveCapped(puzzle, 5);
  console.log(`round=${round} clues=${clues} finalTier=${final.solved ? final.tier : 6} solved=${final.solved} ms=${Date.now()-t0} tiers=[${tierTrace.join(',')}]`);
}
