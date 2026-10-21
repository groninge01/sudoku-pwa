import { countSolutions, solveUnique } from '../src/lib/sudoku/core.ts';
import { ratePuzzle, solveCapped } from '../src/lib/sudoku/solver.ts';
import { mulberry32, shuffle } from '../src/lib/sudoku/rng.ts';

const rng = mulberry32(7);
const full = new Int8Array(81);
// random full grid via backtracking on random grid
const { generatePuzzle } = await import('../src/lib/sudoku/generator.ts');

for (let round = 0; round < 6; round++) {
  const p = generatePuzzle({ difficulty: 'easy', seed: 1000 + round, budgetMs: 20000 });
  const clues = p.puzzle.filter(Boolean).length;
  const t0 = Date.now();
  const tier = ratePuzzle(p.puzzle);
  const ms = Date.now() - t0;
  const capped = solveCapped(p.puzzle, 5);
  const truth = solveUnique(p.puzzle);
  const same = truth && capped.values.every((v, i) => v === truth[i]);
  console.log(`clues=${clues} tier=${tier} cappedTier=${capped.tier} steps=${capped.steps} ${ms}ms solutions=${countSolutions(p.puzzle, 3)} match=${same}`);
}
