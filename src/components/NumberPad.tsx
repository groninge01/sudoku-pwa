export interface NumberPadProps {
  /** Remaining copies of each digit. 0 means the digit is fully placed. */
  counts: Record<number, number>;
  notesMode: boolean;
  onDigit(d: number): void;
}

export function NumberPad({ counts, notesMode, onDigit }: NumberPadProps) {
  return (
    <div className={`number-pad${notesMode ? ' number-pad--notes' : ''}`}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => {
        const done = (counts[d] ?? 0) <= 0;
        return (
          <button
            type="button"
            key={d}
            className="pad-digit"
            disabled={done}
            aria-label={done ? `${d}, all placed` : `${d}`}
            onClick={() => onDigit(d)}
          >
            {d}
          </button>
        );
      })}
      </div>
  );
}
