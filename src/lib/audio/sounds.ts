/**
 * Small synthesized sound effects. No audio files ship with the app, so the
 * whole app stays offline-friendly and tiny.
 */

type Ctx = AudioContext & { __sudokuGain?: GainNode };

let ctx: Ctx | null = null;
let master: GainNode | null = null;

function ensureContext(): Ctx | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor() as Ctx;
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType, gainValue = 1, delay = 0): void {
  const context = ensureContext();
  if (!context || !master) return;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainValue, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration: number, gainValue = 0.6): void {
  const context = ensureContext();
  if (!context || !master) return;
  const frames = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(master);
  source.start();
}

export const sounds = {
  /** Digit placed in a cell. */
  place(): void {
    tone(520, 0.08, 'triangle', 0.5);
  },
  /** Pencil mark toggled. */
  note(): void {
    tone(880, 0.05, 'sine', 0.3);
  },
  /** Wrong digit. */
  mistake(): void {
    tone(150, 0.22, 'sawtooth', 0.4);
    noise(0.12, 0.25);
  },
  /** Cell cleared. */
  erase(): void {
    noise(0.08, 0.3);
  },
  /** Undo. */
  undo(): void {
    tone(330, 0.09, 'sine', 0.35);
  },
  /** Board solved. */
  solved(): void {
    tone(523.25, 0.22, 'triangle', 0.5);
    tone(659.25, 0.22, 'triangle', 0.5, 0.11);
    tone(783.99, 0.32, 'triangle', 0.55, 0.22);
  },
  /** Hint revealed. */
  hint(): void {
    tone(740, 0.1, 'sine', 0.4);
    tone(988, 0.12, 'sine', 0.35, 0.06);
  },
};
