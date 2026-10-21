import { DIFFICULTY_LABEL, type Difficulty } from '../lib/sudoku/types.ts';
import { Sheet } from './Sheet.tsx';
import { LayoutGrid, ListChecks, RotateCcw } from 'lucide-react';

export interface GameMenuSheetProps {
  difficulty: Difficulty;
  busy: boolean;
  onNewPuzzle(): void;
  onChooseDifficulties(): void;
  onRestart(): void;
  onClose(): void;
}

/** The "New game" menu that opens from the gameplay toolbar. */
export function GameMenuSheet(p: GameMenuSheetProps) {
  const label = DIFFICULTY_LABEL[p.difficulty];
  return (
    <Sheet label="New game" onClose={p.onClose} className="menu-sheet">
      <h2>New game</h2>
      <button
        type="button"
        className="button button--secondary menu-sheet__item"
        disabled={p.busy}
        onClick={p.onNewPuzzle}
      >
        <RotateCcw className="icon" />
        {`New ${label} puzzle`}
      </button>
      <button
        type="button"
        className="button button--secondary menu-sheet__item"
        disabled={p.busy}
        onClick={p.onChooseDifficulties}
      >
        <ListChecks className="icon" />
        Choose difficulties
      </button>
      <button
        type="button"
        className="button button--secondary menu-sheet__item"
        onClick={p.onRestart}
      >
        <LayoutGrid className="icon" />
        Restart this puzzle
      </button>
    </Sheet>
  );
}
