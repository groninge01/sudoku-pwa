import { describe, expect, it } from 'vitest';
import { ALL, bit } from './core';
import { TECHNIQUES, type Ctx } from './techniques';

const find = (name: string, ctx: Ctx) => TECHNIQUES.find(t => t.name === name)!.find(ctx);
const mask = (...digits: number[]) => digits.reduce((m, d) => m | bit(d), 0);
const empty = (): Ctx => ({ values: new Int8Array(81), cand: new Uint16Array(81).fill(ALL) });
const transpose = (ctx: Ctx): Ctx => ({ values: Int8Array.from(ctx.values, (_, i) => ctx.values[(i % 9) * 9 + Math.floor(i / 9)]), cand: Uint16Array.from(ctx.cand, (_, i) => ctx.cand[(i % 9) * 9 + Math.floor(i / 9)]) });

describe('hidden subsets', () => {
  it.each([
    ['hidden pair', [mask(1, 2, 4), mask(1, 2, 5)], 2],
    ['hidden triple', [mask(1, 2, 4), mask(2, 3, 5), mask(1, 3, 6)], 3],
    ['hidden quad', [mask(1, 2, 5), mask(2, 3, 6), mask(3, 4, 7), mask(4, 1, 8)], 4],
  ] as const)('%s removes extra candidates from the cells containing its digits', (name, candidates, size) => {
    const ctx = empty();
    const selected = (1 << size) - 1;
    for (let i = size; i < 9; i++) ctx.cand[i] &= ~selected;
    candidates.forEach((m, i) => { ctx.cand[i] = m; });
    const found = find(name, ctx);
    expect(found).not.toBeNull();
    for (const d of found!) {
      expect(d.kind).toBe('remove');
      expect(d.cell).toBeLessThan(size);
      expect(d.digit).toBeGreaterThan(size);
      expect(ctx.cand[d.cell] & bit(d.digit)).not.toBe(0);
    }
    expect(found).toHaveLength(size);
    expect(find(name, transpose(ctx))).toHaveLength(size);
  });

  it('does not report a pair when its digits also occur in a third cell', () => {
    const ctx = empty();
    ctx.cand[0] = mask(1, 2, 4);
    ctx.cand[1] = mask(1, 2, 5);
    expect(find('hidden pair', ctx)).toBeNull();
  });

  it('does not report a subset containing a digit with no possible position', () => {
    const ctx = empty();
    for (let i = 0; i < 9; i++) ctx.cand[i] &= ~mask(1, 2);
    ctx.cand[0] |= bit(1); ctx.cand[1] |= bit(1);
    expect(find('hidden pair', ctx)).toBeNull();
  });
});

describe('swordfish', () => {
  const fish = (columns: number[][]): Ctx => {
    const ctx = empty();
    [0, 3, 6].forEach((r, i) => {
      for (let c = 0; c < 9; c++) ctx.cand[r * 9 + c] &= ~bit(1);
      columns[i].forEach(c => { ctx.cand[r * 9 + c] |= bit(1); });
    });
    return ctx;
  };
  it.each([
    [[0, 1], [1, 2], [0, 2]],
    [[0, 1], [0, 1, 2], [0, 2]],
    [[0, 1, 2], [0, 1, 2], [0, 1, 2]],
  ])('accepts a union of three columns with two or three spots per row (%j)', (...columns) => {
    const ctx = fish(columns);
    const found = find('swordfish', ctx)!;
    expect(found).toContainEqual({ cell: 72, digit: 1, kind: 'remove' });
    expect(found.every(d => ![0, 3, 6].includes(Math.floor(d.cell / 9)))).toBe(true);
    expect(find('swordfish', transpose(ctx))).toContainEqual({ cell: 8, digit: 1, kind: 'remove' });
  });
  it('rejects a pattern spread across four columns', () => {
    expect(find('swordfish', fish([[0, 1], [1, 2], [0, 3]]))).toBeNull();
  });
});

describe('unique rectangle type 1', () => {
  it.each([0, 3, 9, 12])('removes the deadly pair from roof cell %i', roof => {
    const ctx = empty();
    for (const cell of [0, 3, 9, 12]) ctx.cand[cell] = mask(1, 2);
    ctx.cand[roof] |= bit(3);
    expect(find('unique rectangle', ctx)).toEqual([
      { cell: roof, digit: 1, kind: 'remove' },
      { cell: roof, digit: 2, kind: 'remove' },
    ]);
    expect(find('unique rectangle', transpose(ctx))).toHaveLength(2);
  });
  it.each([[0, 1, 9, 10], [0, 3, 27, 30]])('rejects rectangles occupying one or four boxes (%j)', (...corners) => {
    const ctx = empty();
    for (const cell of corners) ctx.cand[cell] = mask(1, 2);
    ctx.cand[corners[3]] |= bit(3);
    expect(find('unique rectangle', ctx)).toBeNull();
  });
  it('does not remove absent candidates from a four-bivalue rectangle', () => {
    const ctx = empty();
    for (const cell of [0, 3, 9, 12]) ctx.cand[cell] = mask(1, 2);
    expect(find('unique rectangle', ctx)).toBeNull();
  });
});
