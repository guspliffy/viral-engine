// The bent water's head track, worked out from where the bender's hands were really drawn (the layout's final world
// positions, render.mjs --layout), so every change in the water starts from a hand move a moment earlier (the house's
// world-logic rule). Used by the Pebble water clips (engine/page/props-water.js "waterbend"; prompt and study in
// /mnt/project-files/videos/pebble/waterbend-01/).
//
//   import { handsTrack, bendPath } from "../../tools/water/bend-path.mjs";
//   const H = handsTrack(layout, "peb");                    // [[t, x, y, z], ...] the hands' midpoint, metres
//   const path = bendPath(H, { from: [0, -0.25, 0.9], rise: [1.0, 2.2], back: [9.0, 10.4], amp: [3, 2.4, 2], lag: 0.14 });
//
// The water's head = where it rose from + the hands' travel since the rise began, times amp (the water's path is about
// three times the hand's: short arms, big water), plus `sway` (a slow side-to-side so a column is never a ruler line),
// followed by a critically damped spring (lag s: the water's weight). Before `rise` it waits under the surface; over
// `rise` it comes up out of `source` (default `from`); over `back` it pours back down there and under.
import fs from "node:fs";

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };

// the midpoint of both hands per layout frame, in metres (null frames dropped)
export function handsTrack(layout, id) {
  const L = typeof layout === "string" ? JSON.parse(fs.readFileSync(layout, "utf8")) : layout, fps = L.fps || 30, out = [];
  (L.contacts || []).forEach((r, i) => {
    const a = (r.actors || []).find((x) => x.id === id), w = a?.w; if (!w?.hR || !w?.hL) return;
    out.push([r.t ?? i / fps, ...[0, 1, 2].map((j) => (w.hR[j] + w.hL[j]) / 2000)]);
  });
  return out;
}
const sample = (T, t) => {
  if (t <= T[0][0]) return T[0].slice(1);
  const L = T[T.length - 1]; if (t >= L[0]) return L.slice(1);
  let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m][0] <= t) lo = m; else hi = m; }
  const a = T[lo], b = T[hi], k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
  return [1, 2, 3].map((j) => a[j] + (b[j] - a[j]) * k);
};

// Catmull-Rom through [[t, x, y, z], ...] (held at both ends)
export function keyPath(K, t) {
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] < t) i++;
  const P = (j) => K[Math.max(0, Math.min(K.length - 1, j))], a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
  const u = (t - b[0]) / (c[0] - b[0]), u2 = u * u, u3 = u2 * u;
  return [1, 2, 3].map((j) => 0.5 * (2 * b[j] + (-a[j] + c[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * u2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * u3));
}

// `keys` instead of rise/back: a choreographed head path [[t, x, y, z], ...] timed just after the hand moves that cause
// each change (it starts and ends under the source), plus the hands' small moves round their own 1 s average times amp
export function keyedPath(H, o) {
  const { keys, amp = [0.8, 0.8, 0.8], lag = 0.2, sway = 0.05, swayHz = 0.35, dt = 1 / 60 } = o;
  const avg = (t) => { const s = [0, 0, 0]; for (let k = -5; k <= 5; k++) sample(H, t + k * 0.1).forEach((v, j) => (s[j] += v / 11)); return s; };
  const t0 = keys[0][0], t1 = keys[keys.length - 1][0];
  const target = (t) => {
    const b = keyPath(keys, t), h = sample(H, t), m = avg(t), on = smooth((t - t0) / 0.8) * smooth((t1 - t) / 0.8);
    const s = sway * on * Math.sin(2 * Math.PI * swayHz * (t - t0));
    return [b[0] + on * amp[0] * (h[0] - m[0]) + s, b[1] + on * amp[1] * (h[1] - m[1]), b[2] + on * amp[2] * (h[2] - m[2])];
  };
  const w = 1 / Math.max(0.02, lag); let x = target(t0), v = [0, 0, 0];
  const out = [];
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    const g = target(t);
    for (let j = 0; j < 3; j++) { const a = w * w * (g[j] - x[j]) - 2 * w * v[j]; v[j] += a * dt; x[j] += v[j] * dt; }
    if (Math.round((t - t0) / dt) % 2 === 0) out.push([Math.round(t * 1000) / 1000, ...x.map((q) => Math.round(q * 10000) / 10000)]);
  }
  return out;
}

export function bendPath(H, o) {
  const { from, rise, back, amp = [3, 2.4, 2], lag = 0.14, sway = 0.07, swayHz = 0.35, dt = 1 / 60, depth = 0.3, lift = 0.35, source = from } = o;
  const t0 = rise[0] - 0.2, t1 = back[1] + 0.2, h0 = sample(H, rise[0]);
  // the target: under the surface, rising out of it, following the hands, pouring back down
  const target = (t) => {
    const h = sample(H, t), up = smooth((t - rise[0]) / (rise[1] - rise[0])), down = smooth((t - back[0]) / (back[1] - back[0]));
    const s = sway * Math.sin(2 * Math.PI * swayHz * (t - rise[0]));
    const follow = [from[0] + amp[0] * (h[0] - h0[0]) + s, from[1] + lift + amp[1] * (h[1] - h0[1]), from[2] + amp[2] * (h[2] - h0[2])];
    // it comes straight up out of the source first (a bulge, then a column), then leans over to follow the hands, and
    // goes back the same way: height leads, the sideways move follows
    const under = [source[0], source[1] - depth, source[2]], k = up * (1 - down), kh = smooth(Math.min(1, k * 1.6)), ks = smooth(Math.max(0, k * 1.6 - 0.6));
    return [under[0] + (follow[0] - under[0]) * ks, under[1] + (follow[1] - under[1]) * kh, under[2] + (follow[2] - under[2]) * ks];
  };
  // a critically damped spring (the water's weight): x'' = w^2 (target - x) - 2 w x'
  const w = 1 / Math.max(0.02, lag); let x = target(t0), v = [0, 0, 0];
  const out = [];
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    const g = target(t);
    for (let j = 0; j < 3; j++) { const a = w * w * (g[j] - x[j]) - 2 * w * v[j]; v[j] += a * dt; x[j] += v[j] * dt; }
    if (Math.round((t - t0) / dt) % 2 === 0) out.push([Math.round(t * 1000) / 1000, ...x.map((q) => Math.round(q * 10000) / 10000)]);
  }
  return out;
}
