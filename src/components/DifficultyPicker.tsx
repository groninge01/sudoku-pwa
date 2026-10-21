import type { Difficulty } from '../lib/sudoku/types.ts';
import { DIFFICULTIES, DIFFICULTY_DESCRIPTION, DIFFICULTY_LABEL } from '../lib/sudoku/types.ts';

export interface DifficultyPickerProps {
  selected: Difficulty[];
  onToggle(d: Difficulty): void;
  disabled?: boolean;
}

/** The six difficulty cards in a two-column grid; several may be picked. */
export function DifficultyPicker({ selected, onToggle, disabled }: DifficultyPickerProps) {
  return (
    <div className="difficulty-grid" role="group" aria-label="Difficulties">
      {DIFFICULTIES.map((d) => (
        <button
          type="button"
          key={d}
          className={`difficulty-card${selected.includes(d) ? ' is-active' : ''}`}
          aria-pressed={selected.includes(d)}
          disabled={disabled}
          onClick={() => onToggle(d)}
        >
          <strong>{DIFFICULTY_LABEL[d]}</strong>
          <small>{DIFFICULTY_DESCRIPTION[d]}</small>
        </button>
      ))}
    </div>
  );
}
