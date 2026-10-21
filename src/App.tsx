import { useCallback, useMemo, useRef, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { NewGameScreen } from './components/NewGameScreen';
import { useGame } from './hooks/useGame';
import { usePuzzleGenerator } from './hooks/usePuzzleGenerator';
import { useTheme } from './hooks/useTheme';
import {
  activeDigitFor,
  computeHighlights,
  computeNoteConflicts,
  computeValueConflicts,
} from './lib/sudoku/highlight.ts';
import { computeCompletedUnits } from './lib/sudoku/complete.ts';
import type { Difficulty } from './lib/sudoku/types.ts';
import { readGame } from './state/game.ts';
import {
  readDifficulties,
  readSettings,
  writeDifficulties,
  writeSettings,
  type Settings,
  type ThemePreference,
} from './state/settings.ts';

type Screen = 'menu' | 'game';

export default function App() {
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [difficulties, setDifficulties] = useState<Difficulty[]>(
    () => readDifficulties<Difficulty>() as Difficulty[],
  );
  const [screen, setScreen] = useState<Screen>(() => (readGame() ? 'game' : 'menu'));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const game = useGame({ soundEffects: settings.soundEffects, autoRemoveNotes: settings.autoRemoveNotes });
  useTheme(settings.theme);

  const { generate } = usePuzzleGenerator();

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    writeSettings(next);
  }, []);

  const toggleDifficulty = useCallback((d: Difficulty) => {
    setDifficulties((current) => {
      const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
      writeDifficulties(next);
      return next;
    });
  }, []);

  // Generate a puzzle, then replace the game. busyRef blocks a second tap
  // fired before React has rendered the disabled button.
  const launch = useCallback(
    async (levels: Difficulty[]) => {
      if (!levels.length || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      const level = levels[Math.floor(Math.random() * levels.length)];
      try {
        const result = await generate(level);
        game.start(result.puzzle, result.solution, level);
        setScreen('game');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [game, generate],
  );

  const startPuzzle = useCallback(() => launch(difficulties), [launch, difficulties]);
  const playAnother = useCallback(() => launch([game.difficulty]), [launch, game.difficulty]);

  const values = useMemo(() => game.cells.map((c) => c.value), [game.cells]);

  // The focused digit always follows the selected cell.
  const activeDigit = useMemo(() => activeDigitFor(values, game.selected), [values, game.selected]);

  const highlight = useMemo(
    () => computeHighlights(values, game.selected, activeDigit),
    [values, game.selected, activeDigit],
  );

  // Pencil marks that clash with a digit already on the board.
  const noteConflicts = useMemo(() => computeNoteConflicts(values), [values]);

  // Wrong entries that repeat a digit already placed in their row, column or
  // box. The matching correct entry is never flagged.
  const valueConflicts = useMemo(
    () =>
      computeValueConflicts(
        values,
        game.puzzle,
        game.cells.map((c) => (c.wrong ? 1 : 0)),
      ),
    [values, game.puzzle, game.cells],
  );

  // Rows, columns and boxes that are completely and correctly filled.
  const completedUnits = useMemo(
    () => computeCompletedUnits(values, game.cells.map((c) => (c.wrong ? 1 : 0))),
    [values, game.cells],
  );

  // Remaining copies of each digit. Wrong entries do not count, so a digit
  // is only "complete" once all nine of its correct placements are on the board.
  const counts = useMemo(() => {
    const out: Record<number, number> = {};
    for (let d = 1; d <= 9; d++) {
      out[d] = 9 - game.cells.filter((c) => c.value === d && !c.wrong).length;
    }
    return out;
  }, [game.cells]);

  const cycleTheme = useCallback(() => {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    updateSettings({ ...settings, theme: next });
  }, [settings, updateSettings]);

  const busyOverlay = busy ? (
    <div className="busy-overlay" role="status" aria-label="Creating puzzle">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">Creating puzzle…</span>
    </div>
  ) : null;

  if (screen === 'menu') {
    return (
      <>
        <NewGameScreen
          difficulties={difficulties}
          onToggleDifficulty={toggleDifficulty}
          onStart={() => void startPuzzle()}
          busy={busy}
        />
        {busyOverlay}
      </>
    );
  }

  return (
    <>
    <GameScreen
      cells={game.cells}
      puzzle={game.puzzle}
      selected={game.selected}
      highlight={highlight}
      noteConflicts={noteConflicts}
      activeDigit={activeDigit}
      valueConflicts={valueConflicts}
      completedUnits={completedUnits}
      solved={game.solved}
      difficulty={game.difficulty}
      difficulties={difficulties}
      elapsedSeconds={game.elapsedSeconds}
      mistakes={game.mistakes}
      notesMode={game.notesMode}
      canUndo={game.canUndo}
      counts={counts}
      settings={settings}
      busy={busy}
      onSelect={game.selectCell}
      onDigit={game.placeDigit}
      onErase={game.eraseCell}
      onToggleNotes={game.toggleNotes}
      onFillCandidates={game.fillCandidates}
      onUndo={game.undo}
      onRestart={game.restart}
      onStartPuzzle={startPuzzle}
      onPlayAnother={playAnother}
      onToggleDifficulty={toggleDifficulty}
      onCycleTheme={cycleTheme}
      onChangeSettings={updateSettings}
    />
      {busyOverlay}
    </>
  );
}
