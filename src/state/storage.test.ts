import { beforeEach, describe, expect, it } from 'vitest';
import { clearState, loadState, saveState } from './storage.ts';

class FakeStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

beforeEach(() => {
  // @ts-expect-error test double for localStorage
  globalThis.localStorage = new FakeStorage();
});

describe('storage', () => {
  it('round-trips a value under the sudoku: prefix', () => {
    saveState('thing', { a: 1, b: [2, 3] });
    expect(localStorage.getItem('sudoku:thing')).toBe(JSON.stringify({ a: 1, b: [2, 3] }));
    expect(loadState('thing', null)).toEqual({ a: 1, b: [2, 3] });
  });

  it('returns the fallback when the key is absent', () => {
    expect(loadState('missing', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when the stored JSON is corrupt', () => {
    localStorage.setItem('sudoku:bad', '{not json');
    expect(loadState('bad', 42)).toBe(42);
  });

  it('clearState removes the value', () => {
    saveState('x', 1);
    clearState('x');
    expect(loadState('x', 'gone')).toBe('gone');
  });

  it('does not throw when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    // @ts-expect-error test double for localStorage
    globalThis.localStorage = broken;
    expect(loadState('k', 'fb')).toBe('fb');
    expect(() => saveState('k', 1)).not.toThrow();
    expect(() => clearState('k')).not.toThrow();
  });
});
