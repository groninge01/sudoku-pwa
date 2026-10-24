import { countSolutions } from '../src/lib/sudoku/core.ts';
import { generatePuzzle, clueCount } from '../src/lib/sudoku/generator.ts';
import { ratePuzzle, solveCapped, solvableWithin } from '../src/lib/sudoku/solver.ts';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../src/lib/sudoku/types.ts';

const bounds = [[30, 45], [27, 38], [25, 33], [23, 30], [21, 28], [19, 26]];
let failures = 0;
for (const [index, difficulty] of DIFFICULTIES.entries()) {
  const expectedTier = index + 1;
  const [min, max] = bounds[index];
  for (let i = 0; i < 3; i++) {
    const seed = 1000 + i * 37 + difficulty.length;
    const t0 = Date.now();
    try {
      const p = generatePuzzle({ difficulty, seed, budgetMs: 30000 });
      const clues = clueCount(p.puzzle);
      const sols = countSolutions(p.puzzle, 2);
      const rated = ratePuzzle(p.puzzle);
      const logical = solveCapped(p.puzzle, expectedTier);
      const solutionMatches = logical.solved && p.solution.every((v, idx) => v === logical.values[idx]);
      const needsTier = !solvableWithin(p.puzzle, expectedTier - 1);
      const ok = p.difficulty === difficulty && p.tier === expectedTier && rated === expectedTier &&
        clues >= min && clues <= max && sols === 1 && solutionMatches && needsTier;
      if (!ok) failures++;
      console.log(
        `${ok ? 'OK  ' : 'FAIL'} ${DIFFICULTY_LABEL[difficulty].padEnd(8)} seed=${seed} expected=${expectedTier} tier=${p.tier} rated=${rated} clues=${clues} unique=${sols === 1} logicalSolution=${solutionMatches} needsTier=${needsTier} ${Date.now() - t0}ms`,
      );
    } catch (error) {
      failures++;
      console.error(`FAIL ${difficulty} seed=${seed}: ${(error as Error).message}`);
    }
  }
}
console.log(failures === 0 ? 'ALL DIFFICULTY CHECKS PASSED' : `${failures} FAILURES`);
if (failures) process.exitCode = 1;
