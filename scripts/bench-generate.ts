import { generatePuzzle } from '../src/lib/sudoku/generator.ts';
import { ratePuzzle } from '../src/lib/sudoku/solver.ts';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../src/lib/sudoku/types.ts';

for (const difficulty of DIFFICULTIES) {
  const t0 = Date.now();
  try {
    const p = generatePuzzle({ difficulty, seed: 12345 + difficulty.length, budgetMs: 30000 });
    const ms = Date.now() - t0;
    const clues = p.puzzle.filter(Boolean).length;
    console.log(
      `${DIFFICULTY_LABEL[difficulty].padEnd(8)} tier=${p.tier} clues=${String(clues).padStart(2)} attempts=${String(p.attempts).padStart(4)} ${ms}ms rate=${ratePuzzle(p.puzzle)}`,
    );
  } catch (e) {
    console.log(`${DIFFICULTY_LABEL[difficulty].padEnd(8)} FAILED after ${Date.now() - t0}ms: ${(e as Error).message}`);
  }
}
