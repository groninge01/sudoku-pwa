# Sudoku

A clean, offline-first sudoku game. No ads, no rewards, no lives, no game-over screen.

Mistakes are counted and shown, but they never end the run. Everything — puzzle
generation, solving, sound — happens locally in the browser. Install it once and it
works with the network off.

> **Why this exists:** [sudoku.com](https://sudoku.com) is a great solver wrapped in
> a slot machine. This is the solver, without the slot machine.

## Features

- **Six graded difficulties** — from naked singles to forcing chains. Every puzzle is
  generated to need exactly one tier of deduction, so "Hard" means the same thing
  on every device.
- **Unique solutions, guaranteed** — the generator never ships a puzzle with more
  than one answer.
- **Pencil notes** with automatic conflict marking: a note turns red as soon as the
  digit it names appears in the same row, column, or box.
- **Undo** for every move, unlimited.
- **Auto-remove notes** when you place a digit (can be turned off).
- **Keyboard play** — `1`–`9` place, `Backspace` erase, `n` notes mode,
  `u` undo, arrow keys move the selection.
- **Resumes where you left off** — board, notes, timer, and undo stack are persisted
  to `localStorage`.
- **Light / dark / system theme**, cycling from the header. The dark palette matches
  the look of [sudokudark.com](https://sudokudark.com).
- **Synthesized sound effects** — generated with WebAudio, so no audio files ship
  and the app stays tiny.
- **Installable PWA** — manifest, icons, and a service worker that precaches the
  whole app for offline use.

## Getting started

```bash
npm install
npm run dev        # dev server on http://localhost:5173
```

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

Requires Node 20+ (Node 24 recommended — the `scripts/` helpers below run `.ts`
files directly).

## How the difficulty tiers work

A tier is the hardest deduction technique needed to finish a puzzle. The solver
always prefers the cheapest technique that makes progress, so the highest tier
that fires is exactly the puzzle's minimum tier.

| Tier | Difficulty | Technique needed |
| ----: | ---------- | ---------------- |
| 1 | Easy | naked single, hidden single |
| 2 | Medium | naked pair, hidden pair, locked candidates |
| 3 | Hard | naked triple, hidden triple, locked quad |
| 4 | Expert | x-wing, swordfish |
| 5 | Master | unique rectangle, xy-wing |
| 6 | Extreme | forcing chains |

Generation works by digging clues out of a full grid one at a time. Because a
puzzle's tier never falls as clues are removed, the generator knows the tier of
every intermediate state — the moment the puzzle reaches the requested tier it is
captured, with a clue-count band per difficulty:

| Difficulty | Tier | Clues |
| ---------- | ---: | ----- |
| Easy | 1 | 30–45 |
| Medium | 2 | 27–38 |
| Hard | 3 | 25–33 |
| Expert | 4 | 23–30 |
| Master | 5 | 21–28 |
| Extreme | 6 | 19–26 |

Generation runs in a Web Worker so the UI stays responsive, and reports progress
while it searches.

## Project layout

```
src/
  lib/sudoku/
    core.ts        board geometry, candidate masks, backtracking solver
    techniques.ts  deduction techniques, grouped by tier
    solver.ts      tier-capped solver, puzzle rating, hints
    generator.ts   clue digging and difficulty targeting
    highlight.ts   peer / same-digit highlighting, note conflicts
    rng.ts         seeded PRNG (mulberry32)
  components/      board, number pad, toolbar, header, settings
  hooks/           game state, timer, theme, puzzle generation
  state/           persistence, settings
  lib/audio/       synthesized sound effects
  worker/          puzzle generation worker
scripts/           one-off dev tools (see below)
```

## Dev scripts

These are not wired into npm scripts — run them with `node`:

```bash
node scripts/verify-techniques.ts   # checks every technique is sound
node scripts/verify-generator.ts    # checks generated puzzles are unique and on-tier
node scripts/bench-generate.ts      # generation time and attempts per difficulty
node scripts/tier-dist.ts           # tier/clue distribution over random puzzles
```

`verify-techniques.ts` is the important one: it proves each technique only ever
produces sound placements and candidate removals — a placement is sound when the
puzzle with that digit still has exactly one solution, and a removal is sound
when the digit is not the cell's true value.

## Design notes

**Mistakes never end the game.** A wrong digit is marked red, the mistake counter
increments, and you keep going. There is no max-mistakes limit and no loss state.

**Note conflicts include wrong placements.** A wrong digit still occupies its
cell, so a note repeating that digit in the same unit is genuinely unusable and
turns red. The alternative — only treating correct placements as blockers —
misses real conflicts while the board still holds an error.

**The number pad never highlights the active digit.** Selecting a digit from the
pad does not paint it; the board does all the highlighting.

## Tech

React 19 + TypeScript + Vite 8, with `vite-plugin-pwa` for the service worker.
No UI framework, no state library, no runtime dependencies beyond React. All
styling is plain CSS with custom properties for theming.

## License

MIT
