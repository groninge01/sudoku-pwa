import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, readSettings, resolveTheme, writeSettings } from './settings.ts';

beforeEach(() => {
  const map = new Map<string, string>();
  // @ts-expect-error test double for localStorage
  globalThis.localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
});

describe('readSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored partials over the defaults', () => {
    writeSettings({ ...DEFAULT_SETTINGS, soundEffects: false });
    const settings = readSettings();
    expect(settings.soundEffects).toBe(false);
    expect(settings.theme).toBe('system');
  });

  it('ignores corrupt data', () => {
    localStorage.setItem('sudoku:settings', 'nope');
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('resolveTheme', () => {
  it('honours an explicit preference', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('falls back to dark when the system preference cannot be read', () => {
    // In the test environment there is no matchMedia.
    expect(resolveTheme('system')).toBe('dark');
  });
});
