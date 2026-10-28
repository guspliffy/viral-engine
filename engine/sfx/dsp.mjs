// Small DSP helpers shared by the code-made sounds (audio.mjs), the signature sounds (signature.mjs) and the rooms
// (rooms.mjs). Mono Float32Arrays at 44.1 kHz.
export const SR = 44100;
export const TAU = Math.PI * 2;

export function biquad(type, f, q) {
  const w = TAU * f / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
  let b0, b1, b2, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = al; b1 = 0; b2 = -al; } // band-pass, constant peak gain
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
export function run(fl, x) { const y = fl.b0 * x + fl.b1 * fl.x1 + fl.b2 * fl.x2 - fl.a1 * fl.y1 - fl.a2 * fl.y2; fl.x2 = fl.x1; fl.x1 = x; fl.y2 = fl.y1; fl.y1 = y; return y; }
// a filter moved to a new frequency, keeping its state (for sweeps)
export const retune = (fl, type, f, q) => Object.assign(fl, biquad(type, f, q), { x1: fl.x1, x2: fl.x2, y1: fl.y1, y2: fl.y2 });
export const env = (t, a, d, total) => (t < 0 || t > total ? 0 : t < a ? t / a : Math.exp(-(t - a) / d));
export const buf = (sec) => new Float32Array(Math.max(1, Math.ceil(sec * SR)));
export function normalise(x, peak) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; }
