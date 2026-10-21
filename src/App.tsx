import { useCallback, useMemo, useState } from 'react';
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
import { DIFFICULTY_LABEL, type Difficulty } from './lib/sudoku/types.ts';
import { clearGame, readGame } from './state/game.ts';
import { readSettings, writeSettings, type Settings, type ThemePreference } from './state/settings.ts';

type Screen = 'menu' | 'game';

export default function App() {
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [screen, setScreen] = useState<Screen>(() => (readGame() ? 'game' : 'menu'));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const game = useGame({ soundEffects: settings.soundEffects, autoRemoveNotes: settings.autoRemoveNotes });
  useTheme(settings.theme);

  const onProgress = useCallback((text: string) => setProgress(text), []);
  const { generate } = usePuzzleGenerator(onProgress);

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    writeSettings(next);
  }, []);

  const launch = useCallback(
    async (level: Difficulty) => {
      setBusy(true);
      setProgress('Generating a puzzle…');
      try {
        const result = await generate(level);
        game.start(result.puzzle, result.solution, level);
        setDifficulty(level);
        setScreen('game');
      } finally {
        setBusy(false);
        setProgress('');
      }
    },
    [game, generate],
  );

  const values = useMemo(() => game.cells.map((c) => c.value), [game.cells]);

  // The focused digit always follows the selected cell.
  const activeDigit = useMemo(() => activeDigitFor(values, game.selected), [values, game.selected]);

  const highlight = useMemo(
    () => computeHighlights(values, game.selected, activeDigit),
    [values, game.selected, activeDigit],
  );

  // Pencil marks that clash with a digit already on the board.
  const noteConflicts = useMemo(() => computeNoteConflicts(values), [values]);

  // Filled cells that repeat a digit already placed in their row, column or box.
  const valueConflicts = useMemo(
    () => computeValueConflicts(values, game.puzzle),
    [values, game.puzzle],
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

  if (screen === 'menu') {
    return (
      <NewGameScreen
        difficulty={difficulty}
        onChangeDifficulty={setDifficulty}
        onStart={() => void launch(difficulty)}
        busy={busy}
        progress={progress}
      />
    );
  }

  return (
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
      difficulty={DIFFICULTY_LABEL[game.difficulty]}
      elapsedSeconds={game.elapsedSeconds}
      mistakes={game.mistakes}
      notesMode={game.notesMode}
      canUndo={game.canUndo}
      counts={counts}
      settings={settings}
      onSelect={game.selectCell}
      onDigit={game.placeDigit}
      onErase={game.eraseCell}
      onToggleNotes={game.toggleNotes}
      onFillCandidates={game.fillCandidates}
      onUndo={game.undo}
      onRestart={game.restart}
      onNewGame={() => {
        clearGame();
        setScreen('menu');
      }}
      onNewPuzzle={() => void launch(game.difficulty)}
      onSameDifficulty={() => void launch(game.difficulty)}
      onCycleTheme={cycleTheme}
      onOpenSettings={() => undefined}
      onChangeSettings={updateSettings}
    />
  );
}
