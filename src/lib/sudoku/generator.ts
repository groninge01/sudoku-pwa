import { bit, boxOf, colOf, countSolutions, rowOf, solveUnique } from './core.ts';
import { mulberry32, shuffle } from './rng.ts';
import { ratePuzzle } from './solver.ts';
import { type Difficulty, type Puzzle } from './types.ts';

/**
 * Difficulty bands.
 *
 * The grade is the technique tier the puzzle needs:
 *  1 singles · 2 pairs and locked candidates · 3 triples and quads ·
 *  4 x-wing and swordfish · 5 unique rectangle and xy-wing ·
 *  6 forcing chains.
 */
const TARGETS: Record<Difficulty, { tier: number; minClues: number; maxClues: number }> = {
  easy: { tier: 1, minClues: 30, maxClues: 45 },
  medium: { tier: 2, minClues: 27, maxClues: 38 },
  hard: { tier: 3, minClues: 25, maxClues: 33 },
  expert: { tier: 4, minClues: 23, maxClues: 30 },
  master: { tier: 5, minClues: 21, maxClues: 28 },
  extreme: { tier: 6, minClues: 19, maxClues: 26 },
};

/** A complete, valid grid built by randomized backtracking. */
function randomGrid(rng: () => number): Int8Array {
  const grid = new Int8Array(81);
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);

  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = rowOf(pos);
    const c = colOf(pos);
    const b = boxOf(pos);
    for (const d of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
      const m = bit(d);
      if ((rowMask[r] | colMask[c] | boxMask[b]) & m) continue;
      grid[pos] = d;
      rowMask[r] |= m;
      colMask[c] |= m;
      boxMask[b] |= m;
      if (fill(pos + 1)) return true;
      grid[pos] = 0;
      rowMask[r] &= ~m;
      colMask[c] &= ~m;
      boxMask[b] &= ~m;
    }
    return false;
  };

  fill(0);
  return grid;
}

/** Applies a symmetry so puzzles do not all share the same structure. */
function symmetrize(grid: Int8Array, rng: () => number): Int8Array {
  const mode = Math.floor(rng() * 6);
  const out = Int8Array.from(grid);
  const swap = (a: number, b: number) => {
    const t = out[a];
    out[a] = out[b];
    out[b] = t;
  };
  const perm = () => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rng);

  if (mode === 0) {
    for (let r = 0; r < 9; r++) for (let c = r + 1; c < 9; c++) swap(r * 9 + c, c * 9 + r);
  } else if (mode === 1) {
    const copy = Int8Array.from(out);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) out[r * 9 + c] = copy[(8 - c) * 9 + r];
  } else if (mode === 2) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) out[r * 9 + c] = grid[(8 - r) * 9 + (8 - c)];
  } else if (mode === 3) {
    const rows = perm();
    for (let band = 0; band < 3; band++) {
      for (let c = 0; c < 9; c++) {
        swap(band * 9 + c, rows[band * 3] * 9 + c);
        swap(band * 9 + c, rows[band * 3 + 1] * 9 + c);
        swap(band * 9 + c, rows[band * 3 + 2] * 9 + c);
      }
    }
  } else if (mode === 4) {
    const cols = perm();
    for (let stack = 0; stack < 3; stack++) {
      for (let r = 0; r < 9; r++) {
        swap(r * 9 + stack * 3, r * 9 + cols[stack * 3]);
        swap(r * 9 + stack * 3, r * 9 + cols[stack * 3 + 1]);
        swap(r * 9 + stack * 3, r * 9 + cols[stack * 3 + 2]);
      }
    }
  } else {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) swap(r * 9 + c, r * 9 + (8 - c));
  }
  return out;
}

/** Relabels the digits so the same layout does not always show 1..9 in order. */
function relabel(grid: Int8Array, rng: () => number): Int8Array {
  const map = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const out = new Int8Array(81);
  for (let i = 0; i < 81; i++) out[i] = grid[i] ? map[grid[i] - 1] : 0;
  return out;
}

export function clueCount(puzzle: ArrayLike<number>): number {
  let n = 0;
  for (let i = 0; i < 81; i++) if (puzzle[i]) n++;
  return n;
}

export interface GenerateOptions {
  difficulty: Difficulty;
  seed?: number;
  /** Milliseconds budget for the search. */
  budgetMs?: number;
  onProgress?: (info: { attempt: number; bestTier: number; bestClues: number }) => void;
}

export class GenerationTimeout extends Error {
  constructor() {
    super('Puzzle generation timed out');
    this.name = 'GenerationTimeout';
  }
}

/**
 * Generates a puzzle graded to the requested difficulty.
 *
 * Every candidate is graded with the supported logical techniques. Only a
 * uniquely solvable snapshot matching both the requested tier and clue band
 * is returned. Exhausting the budget throws rather than mislabelling a fallback.
 */
export function generatePuzzle(options: GenerateOptions): Puzzle {
  const { difficulty, seed = (Math.random() * 0xffffffff) >>> 0, budgetMs = 60000, onProgress } = options;
  const target = TARGETS[difficulty];
  const rng = mulberry32(seed);
  const started = Date.now();

  let attempt = 0;
  let best: Puzzle | null = null;
  let bestClues = Number.POSITIVE_INFINITY;

  while (Date.now() - started < budgetMs) {
    attempt++;
    const full = relabel(symmetrize(randomGrid(rng), rng), rng);
    const puzzle = Array.from(full);
    let snapshot: number[] | null = null;
    let snapshotClues = 0;

    const order = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
    for (const cell of order) {
      if (!puzzle[cell]) continue;
      const backup = puzzle[cell];
      puzzle[cell] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[cell] = backup;
        continue;
      }
      const clues = clueCount(puzzle);
      const tier = ratePuzzle(puzzle);
      if (tier === target.tier && clues >= target.minClues && clues <= target.maxClues) {
        if (!snapshot || clues < snapshotClues) {
          snapshot = [...puzzle];
          snapshotClues = clues;
        }
      }
      if (clues < target.minClues) {
        puzzle[cell] = backup;
        break;
      }
    }

    const source = snapshot ?? puzzle;
    const clues = clueCount(source);
    const tier = ratePuzzle(source);
    if (tier === target.tier && clues >= target.minClues && clues <= target.maxClues) {
      const solution = solveUnique(source);
      if (solution) {
        return { puzzle: source, solution: Array.from(solution), difficulty, attempts: attempt, tier };
      }
    }

    if (!best || tier > best.tier || (tier === best.tier && clues < bestClues)) {
      const solution = solveUnique(source);
      if (solution) {
        best = { puzzle: source, solution: Array.from(solution), difficulty, attempts: attempt, tier };
        bestClues = clues;
      }
    }
    onProgress?.({ attempt, bestTier: best?.tier ?? 0, bestClues });
  }

  throw new GenerationTimeout();
}
