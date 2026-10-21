import { useEffect, useMemo, useRef, useState } from 'react';
import type { CellState } from '../state/game.ts';
import type { HighlightMap } from '../lib/sudoku/highlight.ts';
import type { Settings } from '../state/settings.ts';
import { DIFFICULTY_LABEL, type Difficulty } from '../lib/sudoku/types.ts';
import { Board } from './Board';
import { NumberPad } from './NumberPad';
import { Toolbar } from './Toolbar';
import { Header } from './Header';
import { ResultBar } from './ResultBar';
import { SettingsSheet } from './SettingsSheet';
import { Sheet } from './Sheet.tsx';
import { DifficultyPicker } from './DifficultyPicker.tsx';
import { GameMenuSheet } from './GameMenuSheet.tsx';
import { ConfirmSheet } from './ConfirmSheet.tsx';

type Overlay = 'none' | 'settings' | 'menu' | 'difficulties' | 'confirm-restart' | 'confirm-replace';

export interface GameScreenProps {
  cells: CellState[];
  puzzle: number[];
  selected: number;
  highlight: HighlightMap;
  /** Pencil digits that are already placed in the cell's row, column or box. */
  noteConflicts: Uint16Array;
  /** The digit the board is focused on, or null when the selection is empty. */
  activeDigit: number | null;
  /** Filled cells that repeat a digit already placed in their row, column or box. */
  valueConflicts: Uint8Array;
  /** Which of the 27 units are completely and correctly filled. */
  completedUnits: boolean[];
  solved: boolean;
  difficulty: Difficulty;
  /** The difficulties currently picked for random puzzle generation. */
  difficulties: Difficulty[];
  elapsedSeconds: number;
  mistakes: number;
  notesMode: boolean;
  canUndo: boolean;
  counts: Record<number, number>;
  settings: Settings;
  /** True while a puzzle is being generated. */
  busy: boolean;
  progress: string;
  onSelect(cell: number): void;
  onDigit(d: number): void;
  onErase(): void;
  onToggleNotes(): void;
  onFillCandidates(): void;
  onUndo(): void;
  onRestart(): void;
  /** Generate a puzzle from the selected difficulties. */
  onStartPuzzle(): Promise<void>;
  /** Generate another puzzle at the current difficulty. */
  onPlayAnother(): Promise<void>;
  onToggleDifficulty(d: Difficulty): void;
  onCycleTheme(): void;
  onChangeSettings(s: Settings): void;
}

export function GameScreen(p: GameScreenProps) {
  const [overlay, setOverlay] = useState<Overlay>('none');
  const confirmOrigin = useRef<Overlay>('none');
  const pendingAction = useRef<(() => Promise<void>) | null>(null);

  /** Entries or notes the player would lose by replacing or restarting. */
  const hasProgress = useMemo(
    () => !p.solved && p.cells.some((c) => c.user || c.notes !== 0),
    [p.solved, p.cells],
  );

  const startPuzzle = async () => {
    await p.onStartPuzzle();
    setOverlay('none');
  };
  const playAnother = async () => {
    await p.onPlayAnother();
    setOverlay('none');
  };
  const restartNow = async () => {
    p.onRestart();
    setOverlay('none');
  };

  /** Ask before discarding progress, then run the action back on its sheet. */
  const guarded = (kind: 'restart' | 'replace', action: () => Promise<void>) => {
    if (!hasProgress) {
      void action();
      return;
    }
    pendingAction.current = action;
    confirmOrigin.current = overlay === 'difficulties' ? 'difficulties' : 'menu';
    setOverlay(kind === 'restart' ? 'confirm-restart' : 'confirm-replace');
  };

  const confirmPending = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setOverlay(confirmOrigin.current);
    if (action) void action();
  };

  const cancelConfirm = () => {
    pendingAction.current = null;
    setOverlay(confirmOrigin.current);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (overlay !== 'none') return;
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
  }, [p, overlay]);

  const confirming = overlay === 'confirm-restart' || overlay === 'confirm-replace';

  return (
    <main className="game-screen">
      <Header
        difficulty={DIFFICULTY_LABEL[p.difficulty]}
        elapsedSeconds={p.elapsedSeconds}
        mistakes={p.mistakes}
        showTimer={p.settings.showTimer}
        theme={p.settings.theme}
        onCycleTheme={p.onCycleTheme}
        onOpenSettings={() => setOverlay('settings')}
      />
      <div className="game-board-area">
        <Board
          cells={p.cells}
          puzzle={p.puzzle}
          selected={p.selected}
          highlight={p.highlight}
          noteConflicts={p.noteConflicts}
          highlightConflicts={p.settings.highlightConflicts}
          activeDigit={p.activeDigit}
          valueConflicts={p.valueConflicts}
          completedUnits={p.completedUnits}
          solved={p.solved}
          onSelect={p.onSelect}
        />
      </div>
      <div className="game-footer">
        {!p.solved && (
          <Toolbar
            notesMode={p.notesMode}
            onToggleNotes={p.onToggleNotes}
            onFillCandidates={p.onFillCandidates}
            onErase={p.onErase}
            onUndo={p.onUndo}
            onRestart={() => guarded('restart', restartNow)}
            onNewGame={() => setOverlay('menu')}
            canUndo={p.canUndo}
            disabled={p.busy}
          />
        )}
        {p.solved ? (
          <ResultBar
            elapsedSeconds={p.elapsedSeconds}
            mistakes={p.mistakes}
            difficulty={p.difficulty}
            busy={p.busy}
            onPlayAnother={() => void playAnother()}
            onChooseDifficulties={() => setOverlay('difficulties')}
          />
        ) : (
          <NumberPad counts={p.counts} notesMode={p.notesMode} onDigit={p.onDigit} />
        )}
      </div>

      {overlay === 'settings' && (
        <SettingsSheet
          settings={p.settings}
          onChange={p.onChangeSettings}
          onClose={() => setOverlay('none')}
        />
      )}

      {overlay === 'menu' && (
        <GameMenuSheet
          difficulty={p.difficulty}
          busy={p.busy}
          onNewPuzzle={() => guarded('replace', playAnother)}
          onChooseDifficulties={() => setOverlay('difficulties')}
          onRestart={() => guarded('restart', restartNow)}
          onClose={() => setOverlay('none')}
        />
      )}

      {overlay === 'difficulties' && (
        <Sheet
          label="Choose difficulties"
          onClose={() => setOverlay('none')}
          className="difficulty-sheet"
        >
          <h2>Choose difficulties</h2>
          <p className="sheet__hint">Select one or more difficulties.</p>
          <DifficultyPicker
            selected={p.difficulties}
            onToggle={p.onToggleDifficulty}
            disabled={p.busy}
          />
          <button
            type="button"
            className="button button--primary button--block"
            disabled={!p.difficulties.length || p.busy}
            onClick={() => guarded('replace', startPuzzle)}
          >
            {p.busy ? 'Creating puzzle…' : 'Start puzzle'}
          </button>
          {p.busy && p.progress ? <p className="sheet__progress">{p.progress}</p> : null}
        </Sheet>
      )}

      {confirming && (
        <ConfirmSheet
          title={overlay === 'confirm-restart' ? 'Restart this puzzle?' : 'Start a new puzzle?'}
          body={
            overlay === 'confirm-restart'
              ? 'Your entries and notes will be cleared.'
              : 'Your current puzzle will be replaced.'
          }
          confirmLabel={overlay === 'confirm-restart' ? 'Restart' : 'Start new puzzle'}
          onConfirm={confirmPending}
          onClose={cancelConfirm}
        />
      )}
    </main>
  );
}
