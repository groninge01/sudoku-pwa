import { DIFFICULTIES, type Difficulty } from '../lib/sudoku/types.ts';
import { loadState, saveState } from './storage.ts';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  soundEffects: boolean;
  showTimer: boolean;
  highlightConflicts: boolean;
  autoRemoveNotes: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  soundEffects: true,
  showTimer: true,
  highlightConflicts: true,
  autoRemoveNotes: true,
};

const KEY = 'settings';

export function readSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...loadState<Partial<Settings>>(KEY, {}) };
}

export function writeSettings(settings: Settings): void {
  saveState(KEY, settings);
}

const DIFFICULTY_KEY = 'difficulties';

/** The difficulty the player picked last time; migrates the old multi-pick list. */
export function readDifficulty(): Difficulty | null {
  const stored = loadState<Difficulty | Difficulty[] | null>(DIFFICULTY_KEY, null);
  const first = Array.isArray(stored) ? stored[0] : stored;
  return DIFFICULTIES.includes(first as Difficulty) ? (first as Difficulty) : null;
}

export function writeDifficulty(difficulty: Difficulty): void {
  saveState(DIFFICULTY_KEY, difficulty);
}

export function resolveTheme(preference: ThemePreference): ThemeMode {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
