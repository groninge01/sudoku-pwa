import { generatePuzzle } from '../lib/sudoku/generator.ts';
import type { Difficulty } from '../lib/sudoku/types.ts';

export interface GenerateRequest {
  id: number;
  difficulty: Difficulty;
  seed: number;
}

export type GenerateResponse =
  | { id: number; type: 'progress'; attempt: number; bestTier: number; bestClues: number }
  | { id: number; type: 'done'; puzzle: number[]; solution: number[]; tier: number; attempts: number }
  | { id: number; type: 'error'; message: string };

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { id, difficulty, seed } = event.data;
  try {
    const puzzle = generatePuzzle({
      difficulty,
      seed,
      budgetMs: 120000,
      onProgress: (info) => {
        const message: GenerateResponse = { id, type: 'progress', ...info };
        self.postMessage(message);
      },
    });
    const done: GenerateResponse = {
      id,
      type: 'done',
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      tier: puzzle.tier,
      attempts: puzzle.attempts,
    };
    self.postMessage(done);
  } catch (error) {
    const failure: GenerateResponse = { id, type: 'error', message: (error as Error).message };
    self.postMessage(failure);
  }
};
