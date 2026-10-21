import { countSolutions, solveUnique } from '../src/lib/sudoku/core.ts';
import { generatePuzzle, clueCount } from '../src/lib/sudoku/generator.ts';
import { ratePuzzle } from '../src/lib/sudoku/solver.ts';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../src/lib/sudoku/types.ts';

let failures = 0;
for (const difficulty of DIFFICULTIES) {
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    const p = generatePuzzle({ difficulty, seed: 1000 + i * 37 + difficulty.length, budgetMs: 30000 });
    const ms = Date.now() - t0;
    const clues = clueCount(p.puzzle);
    const sols = countSolutions(p.puzzle, 3);
    const truth = solveUnique(p.puzzle);
    const solutionMatches = truth ? p.solution.every((v, idx) => v === truth[idx]) : false;
    const rated = ratePuzzle(p.puzzle);
    const ok = p.tier === rated && rated >= 1 && sols === 1 && solutionMatches;
    if (!ok) failures++;
    console.log(
      `${ok ? 'OK  ' : 'FAIL'} ${DIFFICULTY_LABEL[difficulty].padEnd(8)} tier=${p.tier} rated=${rated} clues=${String(clues).padStart(2)} sols=${sols} solMatch=${solutionMatches} ${ms}ms`,
    );
  }
}
console.log(failures === 0 ? 'ALL PUZZLES VALID' : `${failures} FAILURES`);
