import { formatTime } from './Header';
import { DIFFICULTY_LABEL, type Difficulty } from '../lib/sudoku/types.ts';

export interface ResultBarProps {
  elapsedSeconds: number;
  mistakes: number;
  difficulty: Difficulty;
  busy: boolean;
  onPlayAnother(): void;
  onChooseDifficulties(): void;
}

/** Compact card shown in the bottom controls area once the puzzle is done. */
export function ResultBar(p: ResultBarProps) {
  const label = DIFFICULTY_LABEL[p.difficulty];
  return (
    <div className="result-card">
      <h2>Puzzle complete</h2>
      <p className="result-card__stats">
        {formatTime(p.elapsedSeconds)} · {p.mistakes} {p.mistakes === 1 ? 'mistake' : 'mistakes'}
      </p>
      <button
        type="button"
        className="button button--primary button--block"
        disabled={p.busy}
        onClick={p.onPlayAnother}
      >
        {`Play another ${label}`}
      </button>
      <button
        type="button"
        className="button button--secondary button--block"
        disabled={p.busy}
        onClick={p.onChooseDifficulties}
      >
        Choose difficulties
      </button>
    </div>
  );
}
