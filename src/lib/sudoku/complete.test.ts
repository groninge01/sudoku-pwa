import { describe, expect, it } from 'vitest';
import { computeCompletedUnits, unitBox, unitKind } from './complete.ts';

const parse = (s: string): Int8Array =>
  Int8Array.from(s, (c) => (c === '.' ? 0 : Number(c)));

const SOLUTION = parse(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);

const closeTo = (a: number, b: number) => expect(a).toBeCloseTo(b, 5);

describe('computeCompletedUnits', () => {
  it('returns 27 false flags for a mostly empty board', () => {
    const done = computeCompletedUnits(new Int8Array(81), new Int8Array(81));
    expect(done).toHaveLength(27);
    expect(done.every((d) => !d)).toBe(true);
  });

  it('marks every unit complete on a finished grid', () => {
    const done = computeCompletedUnits(SOLUTION, new Int8Array(81));
    expect(done.every((d) => d)).toBe(true);
  });

  it('marks only the finished row', () => {
    const values = new Int8Array(81);
    for (let c = 0; c < 9; c++) values[c] = SOLUTION[c];
    const done = computeCompletedUnits(values, new Int8Array(81));
    expect(done[0]).toBe(true);
    // Columns still have 8 empty cells each; the three top boxes are open too.
    for (let u = 1; u < 27; u++) expect(done[u]).toBe(false);
  });

  it('marks a finished column', () => {
    const values = new Int8Array(81);
    for (let r = 0; r < 9; r++) values[r * 9] = SOLUTION[r * 9];
    const done = computeCompletedUnits(values, new Int8Array(81));
    expect(done[9]).toBe(true);
    for (let u = 0; u < 27; u++) if (u !== 9) expect(done[u]).toBe(false);
  });

  it('marks a finished box', () => {
    const values = new Int8Array(81);
    const boxCells = [0, 1, 2, 9, 10, 11, 18, 19, 20];
    for (const i of boxCells) values[i] = SOLUTION[i];
    const done = computeCompletedUnits(values, new Int8Array(81));
    expect(done[18]).toBe(true);
    for (let u = 0; u < 27; u++) if (u !== 18) expect(done[u]).toBe(false);
  });

  it('a wrong cell keeps its units unfinished', () => {
    const values = Int8Array.from(SOLUTION);
    const wrong = new Int8Array(81);
    wrong[40] = 1;
    const done = computeCompletedUnits(values, wrong);
    expect(done[4]).toBe(false); // row 4
    expect(done[13]).toBe(false); // column 4
    expect(done[22]).toBe(false); // box 4
    expect(done[0]).toBe(true);
  });
});

describe('unitKind', () => {
  it('classifies rows, columns and boxes', () => {
    expect(unitKind(0)).toBe('row');
    expect(unitKind(8)).toBe('row');
    expect(unitKind(9)).toBe('col');
    expect(unitKind(17)).toBe('col');
    expect(unitKind(18)).toBe('box');
    expect(unitKind(26)).toBe('box');
  });
});

describe('unitBox', () => {
  it('places a row on its band', () => {
    const b = unitBox(4);
    closeTo(b.left, 0);
    closeTo(b.top, 4 / 9);
    closeTo(b.width, 1);
    closeTo(b.height, 1 / 9);
  });

  it('places a column on its stack', () => {
    const b = unitBox(13); // col 4
    closeTo(b.left, 4 / 9);
    closeTo(b.top, 0);
    closeTo(b.width, 1 / 9);
    closeTo(b.height, 1);
  });

  it('places a box on its ninth of the board', () => {
    const b = unitBox(22); // box 4 -> br 1, bc 1
    closeTo(b.left, 1 / 3);
    closeTo(b.top, 1 / 3);
    closeTo(b.width, 1 / 3);
    closeTo(b.height, 1 / 3);
  });
});
