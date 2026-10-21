export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
  extreme: 'Extreme',
};

/** What the player has to use to solve the puzzle. */
export const DIFFICULTY_DESCRIPTION: Record<Difficulty, string> = {
  easy: 'Only naked and hidden singles',
  medium: 'Adds pairs and locked candidates',
  hard: 'Adds triples and quads',
  expert: 'Adds x-wing and swordfish',
  master: 'Adds unique rectangle and xy-wing',
  extreme: 'Adds forcing chains',
};

export interface Puzzle {
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty;
  attempts: number;
  tier: number;
}
