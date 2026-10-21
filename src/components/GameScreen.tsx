import { useEffect, useState } from 'react';
import type { CellState } from '../state/game.ts';
import type { HighlightMap } from '../lib/sudoku/highlight.ts';
import type { Settings } from '../state/settings.ts';
import { Board } from './Board';
import { NumberPad } from './NumberPad';
import { Toolbar } from './Toolbar';
import { Header } from './Header';
import { ResultBar } from './ResultBar';
import { SettingsSheet } from './SettingsSheet';

export interface GameScreenProps {
  cells: CellState[];
  puzzle: number[];
  selected: number;
  highlight: HighlightMap;
  /** Pencil digits that are already placed in the cell's row, column or box. */
  noteConflicts: Uint16Array;
  sameDigit: number | null;
  solved: boolean;
  difficulty: string;
  elapsedSeconds: number;
  mistakes: number;
  notesMode: boolean;
  canUndo: boolean;
  counts: Record<number, number>;
  settings: Settings;
  onSelect(cell: number): void;
  onDigit(d: number): void;
  onErase(): void;
  onToggleNotes(): void;
  onFillCandidates(): void;
  onUndo(): void;
  onRestart(): void;
  onNewGame(): void;
  onNewPuzzle(): void;
  onSameDifficulty(): void;
  onCycleTheme(): void;
  onOpenSettings(): void;
  onChangeSettings(s: Settings): void;
}

export function GameScreen(p: GameScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;

      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        p.onDigit(Number(event.key));
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        p.onErase();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'n') {
        p.onToggleNotes();
        return;
      }
      if (key === 'u') {
        p.onUndo();
        return;
      }
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const delta =
          event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -9 : 9;
        const next = p.selected < 0 ? 0 : p.selected + delta;
        p.onSelect(Math.max(0, Math.min(80, next)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p]);

  return (
    <main className="game-screen">
      <Header
        difficulty={p.difficulty}
        elapsedSeconds={p.elapsedSeconds}
        mistakes={p.mistakes}
        showTimer={p.settings.showTimer}
        theme={p.settings.theme}
        onCycleTheme={p.onCycleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <Board
        cells={p.cells}
        puzzle={p.puzzle}
        selected={p.selected}
        highlight={p.highlight}
        noteConflicts={p.noteConflicts}
        highlightConflicts={p.settings.highlightConflicts}
        sameDigit={p.sameDigit}
        solved={p.solved}
        onSelect={p.onSelect}
      />
      <Toolbar
        notesMode={p.notesMode}
        onToggleNotes={p.onToggleNotes}
        onFillCandidates={p.onFillCandidates}
        onErase={p.onErase}
        onUndo={p.onUndo}
        onRestart={p.onRestart}
        canUndo={p.canUndo}
        disabled={p.solved}
      />
      {p.solved ? (
        <ResultBar
          elapsedSeconds={p.elapsedSeconds}
          mistakes={p.mistakes}
          onNewPuzzle={p.onNewPuzzle}
          onSameDifficulty={p.onSameDifficulty}
        />
      ) : (
        <NumberPad
          counts={p.counts}
          notesMode={p.notesMode}
          onDigit={p.onDigit}
          onErase={p.onErase}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          settings={p.settings}
          onChange={p.onChangeSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
