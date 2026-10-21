import type { Difficulty } from '../lib/sudoku/types.ts';
import { DIFFICULTIES, DIFFICULTY_DESCRIPTION, DIFFICULTY_LABEL } from '../lib/sudoku/types.ts';
import { Play } from 'lucide-react';

export interface NewGameScreenProps {
  difficulty: Difficulty;
  onChangeDifficulty(d: Difficulty): void;
  onStart(): void;
  busy: boolean;
  progress: string;
}

export function NewGameScreen(p: NewGameScreenProps) {
  return (
    <main className="new-game">
      <h1>Sudoku</h1>
      {DIFFICULTIES.map((d) => (
        <button
          className={p.difficulty === d ? 'is-active' : ''}
          key={d}
          aria-pressed={p.difficulty === d}
          onClick={() => p.onChangeDifficulty(d)}
        >
          <strong>{DIFFICULTY_LABEL[d]}</strong>
          <small>{DIFFICULTY_DESCRIPTION[d]}</small>
        </button>
      ))}
      {p.busy ? <p>{p.progress}</p> : <button onClick={p.onStart}><Play className="icon" />Play</button>}
    </main>
  );
}
