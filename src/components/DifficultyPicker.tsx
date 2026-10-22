import type { Difficulty } from '../lib/sudoku/types.ts';
import { DIFFICULTIES, DIFFICULTY_DESCRIPTION, DIFFICULTY_LABEL } from '../lib/sudoku/types.ts';

export interface DifficultyPickerProps {
  selected: Difficulty;
  onSelect(d: Difficulty): void;
  disabled?: boolean;
}

/** The six difficulty cards in a two-column grid; exactly one is picked. */
export function DifficultyPicker({ selected, onSelect, disabled }: DifficultyPickerProps) {
  return (
    <div className="difficulty-grid" role="radiogroup" aria-label="Difficulties">
      {DIFFICULTIES.map((d) => (
        <button
          type="button"
          role="radio"
          key={d}
          className={`difficulty-card${selected === d ? ' is-active' : ''}`}
          aria-checked={selected === d}
          disabled={disabled}
          onClick={() => onSelect(d)}
        >
          <strong>{DIFFICULTY_LABEL[d]}</strong>
          <small>{DIFFICULTY_DESCRIPTION[d]}</small>
        </button>
      ))}
    </div>
  );
}
