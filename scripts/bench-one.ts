import { countSolutions, solveUnique } from '../src/lib/sudoku/core.ts';
import { ratePuzzle, solveCapped } from '../src/lib/sudoku/solver.ts';
import { generatePuzzle, clueCount } from '../src/lib/sudoku/generator.ts';

const difficulty = (process.argv[2] ?? 'easy') as any;
const t0 = Date.now();
const p = generatePuzzle({ difficulty, seed: 424242, budgetMs: 20000 });
const ms = Date.now() - t0;
console.log(`${difficulty} tier=${p.tier} clues=${clueCount(p.puzzle)} attempts=${p.attempts} ${ms}ms sols=${countSolutions(p.puzzle, 3)} rated=${ratePuzzle(p.puzzle)}`);
