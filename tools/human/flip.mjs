// An authored clip: a tucked front flip, built on a real recorded jump (assets/mocap/jump.json, CMU 143_06): the
// person's own crouch, arm swing and take-off, then a ballistic flight (the pelvis on a true parabola under g, 0.72 s
// in the air) turning one full circle forward round the body's middle, fast in the tuck and slow at the open, then the
// recorded landing and its absorb. Pure and deterministic.
//   node tools/human/flip.mjs   -> assets/mocap/flip.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const J = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/mocap/jump.json"), "utf8"));
const fps = J.fps;
// quaternions [x, y, z, w]
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qax = (ax, a) => { const s = Math.sin(a / 2), l = Math.hypot(...ax); return [ax[0] / l * s, ax[1] / l * s, ax[2] / l * s, Math.cos(a / 2)]; };
const qslerp = (a, b, t) => {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], bb = b; if (d < 0) { d = -d; bb = b.map((v) => -v); }
  if (d > 0.9995) { const o = a.map((v, i) => v + (bb[i] - v) * t), l = Math.hypot(...o); return o.map((v) => v / l); }
  const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s; return a.map((v, i) => v * wa + bb[i] * wb);
};
const qrot = (q, v) => { const p = qmul(qmul(q, [...v, 0]), [-q[0], -q[1], -q[2], q[3]]); return [p[0], p[1], p[2]]; };
const qfromTo = (a, b) => { const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; const q = [c[0], c[1], c[2], 1 + d], l = Math.hypot(...q); return q.map((v) => v / l); };
const frame = (u) => { const f = Math.min(J.root.length - 1, Math.max(0, u * fps)), i = Math.min(J.root.length - 2, Math.floor(f)), k = f - i; const out = { root: J.root[i].map((v, j) => v + (J.root[i + 1][j] - v) * k), q: {} }; for (const b of J.bones) out.q[b] = qslerp(J.q[b].slice(4 * i, 4 * i + 4), J.q[b].slice(4 * i + 4, 4 * i + 8), k); return out; };

const PRE = [1.08, 1.42], FLY = 0.72, LAND = [1.68, 2.3];   // jump.json seconds: crouch + take-off, landing + settle
const A = frame(PRE[1]), Bf = frame(LAND[0]);
const fwd = (() => { const f = qrot(A.q.root, [0, 0, 1]); const l = Math.hypot(f[0], f[2]); return [f[0] / l, 0, f[2] / l]; })();
const lat = [fwd[2], 0, -fwd[0]];   // up x forward: turning about it by + tips the head forward
const TRAVEL = 0.55;                // metres forward in the air
// the tuck (local turns, parent space of the T pose)
const T = {
  lfemur: qmul(qax([1, 0, 0], -1.95), qax([0, 0, 1], -0.3)), rfemur: qmul(qax([1, 0, 0], -1.95), qax([0, 0, 1], 0.3)),
  ltibia: qax([1, 0, 0], 2.2), rtibia: qax([1, 0, 0], 2.2), lfoot: qax([1, 0, 0], 0.45), rfoot: qax([1, 0, 0], 0.45),
  lowerback: qax([1, 0, 0], 0.4), upperback: qax([1, 0, 0], 0.32), thorax: qax([1, 0, 0], 0.22), lowerneck: qax([1, 0, 0], 0.25), upperneck: qax([1, 0, 0], 0.15), head: qax([1, 0, 0], 0.15),
  lhumerus: qfromTo([1, 0, 0], [0.22, -0.45, 0.87]), rhumerus: qfromTo([-1, 0, 0], [-0.22, -0.45, 0.87]),
  lradius: qax([0, 1, 0], -0.5), rradius: qax([0, 1, 0], 0.5),
};
const out = { root: [], q: Object.fromEntries(J.bones.map((b) => [b, []])) };
const push = (F) => { out.root.push(F.root.map((v) => Math.round(v * 1e4) / 1e4)); for (const b of J.bones) out.q[b].push(...F.q[b].map((v) => Math.round(v * 1e4) / 1e4)); };
const smoothstep = (x) => x * x * (3 - 2 * x);
// 1) the recorded crouch and take-off
for (let u = PRE[0]; u < PRE[1] - 1e-6; u += 1 / fps) push(frame(u));
// 2) the flight
const y0 = A.root[1], y1 = Bf.root[1], n = Math.round(FLY * fps), g = 9.81, vy = (y1 - y0) / FLY + (g * FLY) / 2;
// the landing pose is the recorded one, placed where the flight ends
const landOff = [A.root[0] + fwd[0] * TRAVEL - Bf.root[0], 0, A.root[2] + fwd[2] * TRAVEL - Bf.root[2]];
for (let i = 0; i < n; i++) {
  const t = i / fps, s = t / FLY;
  const base = { root: null, q: {} };
  for (const b of J.bones) base.q[b] = qslerp(A.q[b], Bf.q[b], smoothstep(s));
  const w = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.55);   // into the tuck and out of it again before the floor
  for (const b in T) base.q[b] = qslerp(base.q[b], T[b], w);
  // one full turn forward, fast in the tuck: the angle runs on the tuck's own speed
  const th = 2 * Math.PI * (s - Math.sin(2 * Math.PI * s) / (2 * Math.PI) * 0.85);
  const spin = qax(lat, th);
  // the body turns about its middle (12 cm over the pelvis in its own frame); that middle flies the parabola
  const mid = [A.root[0] + fwd[0] * TRAVEL * s, y0 + vy * t - (g * t * t) / 2 + 0.12, A.root[2] + fwd[2] * TRAVEL * s];
  base.q.root = qmul(spin, base.q.root);
  const off = qrot(base.q.root, [0, -0.12, 0]);
  base.root = [mid[0] + off[0], mid[1] + off[1], mid[2] + off[2]];
  push(base);
}
// 3) the recorded landing, moved to where the flight came down
for (let u = LAND[0]; u <= LAND[1] + 1e-6; u += 1 / fps) { const F = frame(u); F.root = [F.root[0] + landOff[0], F.root[1], F.root[2] + landOff[2]]; push(F); }
const N = out.root.length;
fs.writeFileSync(path.join(ROOT, "assets/mocap/flip.json"), JSON.stringify({ name: "flip", source: "authored on CMU 143_06 (jump): recorded take-off and landing, ballistic tucked flight",
  credit: J.credit, fps, len: Math.round(((N - 1) / fps) * 1e4) / 1e4, lens: J.lens, bones: J.bones, root: out.root, q: out.q }));
console.log(`flip.json: ${N} frames, ${((N - 1) / fps).toFixed(2)} s (take-off at ${(PRE[1] - PRE[0]).toFixed(2)} s, lands at ${(PRE[1] - PRE[0] + FLY).toFixed(2)} s)`);
