import { useCallback, useMemo, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { NewGameScreen } from './components/NewGameScreen';
import { useGame } from './hooks/useGame';
import { usePuzzleGenerator } from './hooks/usePuzzleGenerator';
import { useTheme } from './hooks/useTheme';
import { computeHighlights, computeNoteConflicts } from './lib/sudoku/highlight.ts';
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

  const highlight = useMemo(
    () => computeHighlights(values, game.selected, game.sameDigit),
    [values, game.selected, game.sameDigit],
  );

  // Pencil marks that clash with a digit already on the board.
  const noteConflicts = useMemo(() => computeNoteConflicts(values), [values]);

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
      sameDigit={game.sameDigit}
      solved={game.solved}
      difficulty={DIFFICULTY_LABEL[game.difficulty]}
      elapsedSeconds={game.elapsedSeconds}
      mistakes={game.mistakes}
      notesMode={game.notesMode}
      canUndo={game.canUndo}
      counts={counts}
      settings={settings}
      onSelect={(cell) => {
        game.selectCell(cell);
        if (game.cells[cell]?.value) game.setSameDigit(game.cells[cell]!.value);
      }}
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
