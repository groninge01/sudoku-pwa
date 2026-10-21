import { computeCandidates, countSolutions, solveUnique } from '../src/lib/sudoku/core.ts';

function rand(n: number): number { return Math.floor(Math.random() * n); }

// replicate contradicts
function contradicts(values: Int8Array, cand: Uint16Array, cell: number, digit: number, trace: boolean): boolean {
  const ALL = 0x1ff;
  const bit = (d: number) => 1 << (d - 1);
  const rowOf = (i: number) => (i / 9) | 0;
  const colOf = (i: number) => i % 9;
  const boxOf = (i: number) => (((i / 9) | 0) / 3 | 0) * 3 + (((i % 9) / 3) | 0);
  const UNITS: number[][] = [];
  for (let r = 0; r < 9; r++) UNITS.push(Array.from({length:9},(_,c)=>r*9+c));
  for (let c = 0; c < 9; c++) UNITS.push(Array.from({length:9},(_,r)=>r*9+c));
  for (let b = 0; b < 9; b++) { const br=((b/3)|0)*3, bc=(b%3)*3; const u=[]; for(let r=0;r<3;r++)for(let c=0;c<3;c++)u.push((br+r)*9+bc+c); UNITS.push(u); }

  const rowMask = new Uint16Array(9), colMask = new Uint16Array(9), boxMask = new Uint16Array(9);
  for (let i = 0; i < 81; i++) { const v = values[i]; if (!v) continue; const m = bit(v); rowMask[rowOf(i)] |= m; colMask[colOf(i)] |= m; boxMask[boxOf(i)] |= m; }
  const assumed = bit(digit);
  rowMask[rowOf(cell)] |= assumed; colMask[colOf(cell)] |= assumed; boxMask[boxOf(cell)] |= assumed;
  const filled = new Uint8Array(81);
  filled[cell] = 1;

  for (let step = 0; step < 81; step++) {
    let progressed = false;
    for (let i = 0; i < 81; i++) {
      if (filled[i]) continue;
      if (values[i]) { filled[i] = 1; continue; }   // <-- givens must be skipped
      const mask = ALL & ~(rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]);
      if (mask === 0) { if (trace) console.log('contradiction at cell', i); return true; }
      if (popcount(mask) === 1) {
        filled[i] = 1; rowMask[rowOf(i)] |= mask; colMask[colOf(i)] |= mask; boxMask[boxOf(i)] |= mask; progressed = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        let spot = -1, count = 0;
        for (const u of unit) {
          if (filled[u]) continue;
          if (rowMask[rowOf(u)] & m || colMask[colOf(u)] & m || boxMask[boxOf(u)] & m) continue;
          spot = u; if (++count > 1) break;
        }
        if (count === 1) {
          if (!(cand[spot] & m)) { if (trace) console.log('BUG: hidden single spot', spot, 'digit', d, 'cand has?', !!(cand[spot] & m)); return true; }
          filled[spot] = 1; rowMask[rowOf(spot)] |= m; colMask[colOf(spot)] |= m; boxMask[boxOf(spot)] |= m; progressed = true;
        }
      }
    }
    if (!progressed) return false;
  }
  return false;
}
function popcount(m: number) { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; }

for (let k = 0; k < 20000 && true; k++) {
  const full = new Int8Array(81);
  const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = (pos/9)|0, c = pos%9, b = (((pos/9)|0)/3|0)*3 + (((pos%9)/3)|0);
    for (let d = 1; d <= 9; d++) { const m = 1<<(d-1); if ((rm[r]|cm[c]|bm[b]) & m) continue; full[pos]=d; rm[r]|=m; cm[c]|=m; bm[b]|=m; if (fill(pos+1)) return true; full[pos]=0; rm[r]&=~m; cm[c]&=~m; bm[b]&=~m; }
    return false;
  };
  fill(0);
  const p = Array.from(full);
  const cells = Array.from({length:81},(_,i)=>i);
  for (let i = cells.length-1; i>0; i--) { const j = rand(i+1); [cells[i],cells[j]]=[cells[j],cells[i]]; }
  const givens = 20 + rand(12);
  for (let i = 0; i < 81-givens; i++) p[cells[i]] = 0;
  if (countSolutions(p,2) !== 1) continue;
  const sol = solveUnique(p)!;
  const values = new Int8Array(81); for (let i=0;i<81;i++) values[i]=p[i];
  const cand = computeCandidates(values);
  for (let cell = 0; cell < 81; cell++) {
    if (values[cell]) continue;
    for (let d = 1; d <= 9; d++) {
      if (!(cand[cell] & (1<<(d-1)))) continue;
      const bad = contradicts(values, cand, cell, d, true);
      if (bad && sol[cell] === d) {
        console.log('FALSE CONTRADICTION cell', cell, 'digit', d);
        console.log('puzzle:'); for (let r=0;r<9;r++) console.log(p.slice(r*9,r*9+9).map(v=>v||'.').join(' '));
        process.exit(0);
      }
    }
  }
}
console.log('no false contradiction found in this sample');
