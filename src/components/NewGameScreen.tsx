import type { Difficulty } from '../lib/sudoku/types.ts';
import { DifficultyPicker } from './DifficultyPicker.tsx';

export interface NewGameScreenProps {
  difficulty: Difficulty;
  onSelectDifficulty(d: Difficulty): void;
  onStart(): void;
  busy: boolean;
}

export function NewGameScreen(p: NewGameScreenProps) {
  return (
    <main className="new-game">
      <h1>Sudoku</h1>
      <p className="new-game__hint">Select a difficulty.</p>
      <DifficultyPicker selected={p.difficulty} onSelect={p.onSelectDifficulty} disabled={p.busy} />
      <button
        type="button"
        className="button button--primary button--block"
        disabled={p.busy}
        onClick={p.onStart}
      >
        Start puzzle
      </button>
    </main>
  );
}
