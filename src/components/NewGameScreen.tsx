import type { Difficulty } from '../lib/sudoku/types.ts';
import { DifficultyPicker } from './DifficultyPicker.tsx';

export interface NewGameScreenProps {
  difficulties: Difficulty[];
  onToggleDifficulty(d: Difficulty): void;
  onStart(): void;
  busy: boolean;
  progress: string;
}

export function NewGameScreen(p: NewGameScreenProps) {
  return (
    <main className="new-game">
      <h1>Sudoku</h1>
      <p className="new-game__hint">Select one or more difficulties.</p>
      <DifficultyPicker selected={p.difficulties} onToggle={p.onToggleDifficulty} disabled={p.busy} />
      <button
        type="button"
        className="button button--primary button--block"
        disabled={!p.difficulties.length || p.busy}
        onClick={p.onStart}
      >
        {p.busy ? 'Creating puzzle…' : 'Start puzzle'}
      </button>
      {p.busy && p.progress ? <p className="new-game__progress">{p.progress}</p> : null}
    </main>
  );
}
