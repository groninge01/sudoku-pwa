import { countSolutions } from '../src/lib/sudoku/core.ts';
import { ratePuzzle } from '../src/lib/sudoku/solver.ts';
import { mulberry32, shuffle } from '../src/lib/sudoku/rng.ts';

function randomGrid(rng: () => number): Int8Array {
  const grid = new Int8Array(81);
  const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = (pos / 9) | 0, c = pos % 9, b = (((pos / 9) | 0) / 3 | 0) * 3 + (((pos % 9) / 3) | 0);
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
const hist = new Map<number, number>();
const clueHist = new Map<number, number>();
const N = Number(process.argv[3] ?? 60);
const t0 = Date.now();
for (let round = 0; round < N; round++) {
  const full = randomGrid(rng);
  const puzzle = Array.from(full);
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  for (const cell of order) {
    if (!puzzle[cell]) continue;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) !== 1) { puzzle[cell] = backup; continue; }
  }
  const clues = puzzle.filter(Boolean).length;
  const tier = ratePuzzle(puzzle);
  hist.set(tier, (hist.get(tier) ?? 0) + 1);
  clueHist.set(clues, (clueHist.get(clues) ?? 0) + 1);
}
console.log('tier distribution:', [...hist.entries()].sort((a,b)=>a[0]-b[0]).map(([t,c])=>`t${t}:${c}`).join(' '));
console.log('clue distribution:', [...clueHist.entries()].sort((a,b)=>a[0]-b[0]).map(([c,n])=>`${c}:${n}`).join(' '));
console.log(`N=${N} total ${Date.now()-t0}ms (${((Date.now()-t0)/N).toFixed(0)}ms each)`);
