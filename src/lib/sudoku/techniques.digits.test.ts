import { expect, it } from 'vitest';
import { ALL, bit } from './core';
import { TECHNIQUES } from './techniques';
const mask = (...digits: number[]) => digits.reduce((m, d) => m | bit(d), 0);
it.each([
  ['hidden pair', [8, 9], [mask(8, 9, 1), mask(8, 9, 2)]],
  ['hidden triple', [7, 8, 9], [mask(7, 8, 1), mask(8, 9, 2), mask(7, 9, 3)]],
  ['hidden quad', [6, 7, 8, 9], [mask(6, 7, 1), mask(7, 8, 2), mask(8, 9, 3), mask(9, 6, 4)]],
] as const)('%s includes digit 9 in its search', (name, digits, candidates) => {
  const cand = new Uint16Array(81).fill(ALL);
  for (let i = digits.length; i < 9; i++) cand[i] &= ~mask(...digits);
  candidates.forEach((m, i) => { cand[i] = m; });
  expect(TECHNIQUES.find(t => t.name === name)!.find({ values: new Int8Array(81), cand })).toHaveLength(digits.length);
});
