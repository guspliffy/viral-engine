// spin-tracks.js: the global tracks of fact what-if 03 "Earth spins faster" (21 Nov 2026), one place for every props
// file (DESIGN.md section 0, B1, B3, C5, F2). Pure functions of the clip time t (seconds); no random, no clock.
// Owned by the director. Builders import, never change it: report a wrong number instead.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const P = (t, a, b) => clamp((t - a) / (b - a));
export const S = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
const fract = (x) => x - Math.floor(x);
// linear through [[t, v], ...] keys, held at both ends
export function keys(t, K) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, va] = K[i - 1], [b, vb] = K[i]; return va + (vb - va) * (t - a) / (b - a); }
  return K[K.length - 1][1];
}

export const spin = (t) => 2 + 0.3 * t;                                   // s, the chip
export const weight = (t) => Math.max(0, 1 - 0.0035 * spin(t) ** 2);      // w, weight left at the equator
export const phi = (t) => 0.16 * t + 0.012 * t * t;                       // film days gone (rate 0.08 s turns a second)
export const psi = (t) => 0.22 + phi(t);
export const alphaDeg = (t) => 360 * psi(t);                              // wheel angle
export const isDay = (t) => fract(psi(t)) < 0.5;
// flicker depth A: 1 up to 7.7x, .50 at 10x, .22 at 13x, .12 from 17x
export const flicker = (t) => { const s = spin(t); return keys(s, [[7.7, 1], [10, 0.5], [13, 0.22], [17, 0.12]]); };

// B1: a body at wheel radius rho (deg) and wheel angle a (deg): az = rho cos a, el = rho sin a (az + = right)
export function wheel(rho, aDeg) { const r = aDeg * Math.PI / 180; return { az: rho * Math.cos(r), el: rho * Math.sin(r) }; }
export const sunRho = (t) => (t >= 31.0 ? 24 : 15);
export const sunAt = (t) => wheel(sunRho(t), alphaDeg(t));
export const moonAt = (t) => wheel(19, alphaDeg(t) + 180);

// B3: night weight at azimuth a (deg). A terminator sweeps right -> left (az_T = 30 - 60 u) over .22 of a film day
// centred on every set (fract(psi) = .5) and rise (fract(psi) = 0).
export function night(t, aDeg = 0) {
  const f = fract(psi(t)), W = 0.22;
  const dSet = f - 0.5, dRise = f > 0.5 ? f - 1 : f;          // signed distance in film days to the set / rise
  if (Math.abs(dSet) < W / 2) { const u = (dSet + W / 2) / W, azT = 30 - 60 * u; return S((aDeg - azT) / 7 + 0.5); }
  if (Math.abs(dRise) < W / 2) { const u = (dRise + W / 2) / W, azT = 30 - 60 * u; return 1 - S((aDeg - azT) / 7 + 0.5); }
  return f < 0.5 ? 0 : 1;
}

// C5: sea level (metres, world Q) and the 0..1 param; keys from the table
const SEA = [[0, 0.045], [2.2, 0.097], [5.0, 0.149], [7.0, 0.188], [9.0, 0.221], [15.0, 0.357], [19.0, 0.438], [26.7, 0.616],
  [31.0, 0.759], [36.7, 0.979], [43.3, 0.989], [46.7, 0.998], [50.0, 1]];
export const sea = (t) => keys(t, SEA);
export const seaY = (t) => -330 + 308.36 * sea(t);

export const storm = (t) => keys(t, [[10.9, 0], [11.5, 1], [15.0, 1], [15.5, 0]]);
// F2: rain fall speed (+ down, m/s) and wind (m/s); share of drops shown
export const rainV = (t) => keys(t, [[44.4, 5.5], [45.5, 3.6], [46.7, 1.5], [47.6, 0], [50.0, 0], [50.5, -0.5], [51.5, -2.0], [53, -4.2], [55, -6.5], [60, -9]]);
export const windX = (t) => keys(t, [[43.3, -9], [46.0, -6], [46.7, -1.2], [47.6, 0], [50, 0], [52, -0.8], [55, -1.5]]);
export const rainShare = (t) => P(t, 44.4, 45.4);
// closed-form drop travel since 44.4 s (metres, + down), for "a drop's place is the integral" (F2): trapezoid sum of rainV
export function rainFallen(t) {
  const K = [[44.4, 5.5], [45.5, 3.6], [46.7, 1.5], [47.6, 0], [50.0, 0], [50.5, -0.5], [51.5, -2.0], [53, -4.2], [55, -6.5], [60, -9]];
  if (t <= K[0][0]) return 0; let d = 0;
  for (let i = 1; i < K.length; i++) { const [a, va] = K[i - 1], [b, vb] = K[i]; if (t <= b) { const v = va + (vb - va) * (t - a) / (b - a); return d + (va + v) / 2 * (t - a); } d += (va + vb) / 2 * (b - a); }
  return d + K[K.length - 1][1] * (t - K[K.length - 1][0]);
}
export function windDrift(t) {
  const K = [[43.3, -9], [46.0, -6], [46.7, -1.2], [47.6, 0], [50, 0], [52, -0.8], [55, -1.5]];
  if (t <= K[0][0]) return 0; let d = 0;
  for (let i = 1; i < K.length; i++) { const [a, va] = K[i - 1], [b, vb] = K[i]; if (t <= b) { const v = va + (vb - va) * (t - a) / (b - a); return d + (va + v) / 2 * (t - a); } d += (va + vb) / 2 * (b - a); }
  return d + K[K.length - 1][1] * (t - K[K.length - 1][0]);
}

export const lift = (t) => P(t, 50, 60);
export const alt = (t) => P(t, 55, 60);
export const peel = (t) => P(t, 60, 66);
export const squash = (t) => P(t, 64.5, 73.3);
export const cracks = (t) => P(t, 66, 72);
export const DISC_CUT = 73.3;   // H5: the model swap to the flat disc happens on this cut
