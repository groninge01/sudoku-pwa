import { Eraser, Grid3x3, Pencil, Plus, RotateCcw, Undo2 } from 'lucide-react';

export interface ToolbarProps {
  notesMode: boolean;
  onToggleNotes(): void;
  onFillCandidates(): void;
  onErase(): void;
  onUndo(): void;
  onRestart(): void;
  onNewGame(): void;
  canUndo: boolean;
  disabled: boolean;
}

export function Toolbar(p: ToolbarProps) {
  return (
    <div className="toolbar">
      <button aria-label="Undo" disabled={!p.canUndo || p.disabled} onClick={p.onUndo}>
        <Undo2 className="icon" />
      </button>
      <button aria-label="Erase" disabled={p.disabled} onClick={p.onErase}>
        <Eraser className="icon" />
      </button>
      <button aria-label="Notes" aria-pressed={p.notesMode} disabled={p.disabled} onClick={p.onToggleNotes}>
        <Pencil className="icon" />
      </button>
      <button aria-label="Fill candidates" disabled={p.disabled} onClick={p.onFillCandidates}>
        <Grid3x3 className="icon" />
      </button>
      <button aria-label="Restart this puzzle" disabled={p.disabled} onClick={p.onRestart}>
        <RotateCcw className="icon" />
      </button>
      <button aria-label="New game" disabled={p.disabled} onClick={p.onNewGame}>
        <Plus className="icon" />
      </button>
    </div>
  );
}
