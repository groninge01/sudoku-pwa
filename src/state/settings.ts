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

/** Difficulty cards the player picked last time, oldest selection order kept. */
export function readDifficulties<T>(): T[] {
  return loadState<T[]>(DIFFICULTY_KEY, []);
}

export function writeDifficulties<T>(difficulties: T[]): void {
  saveState(DIFFICULTY_KEY, difficulties);
}

export function resolveTheme(preference: ThemePreference): ThemeMode {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
