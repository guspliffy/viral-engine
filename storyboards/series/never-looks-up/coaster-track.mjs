// The roller coaster's track for Never Looks Up 07 (8 Nov 2026): one centreline, sampled densely, used by BOTH the
// coastertrack prop (engine/page/props-coaster.js: spec.pts) and the car's rig keys (engine/page/vehicle.js), so the
// car can never leave the rails. Plain math, no three.js.
//
// World (8 Nov, from Jonny's board): ONE straight run along +z at x 0 on a hilltop, in the board's order, so nothing the
// shots skip costs story time. The hill's brink is on the -x side (set "hilltop"), the fair far below past it.
//   lift    straight up a 20 deg slope
//   crest   a round top (panel 01), then the DROP (56 deg, panel 02) and its pull-out near the grass
//   hump    the airtime hill (panel 03: a parabola the car flies over weightless)
//   loop    a big vertical loop in the y-z plane (panels 04, 05), entered heading +z; it shifts 1.6 m to +x on the way
//           round so the exit runs beside the entry; its top is high enough that the car crawls over it upside down
//   final   out of the loop low past the photo post (panel 06) onto a level brake run to the exit kiosk (panel 08)
// Each sample: { p: [x, y, z], u: [ux, uy, uz] (the track's up), s: metres along the track }.
const D2R = Math.PI / 180;
const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), sub = (a, b) => a.map((v, i) => v - b[i]);
const len = (a) => Math.hypot(...a), norm = (a) => { const l = len(a) || 1; return a.map((v) => v / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// a Catmull-Rom (centripetal) curve through 3D points, sampled every `step` metres
function catmull(P, step = 0.1) {
  const out = [];
  const Q = [add(P[0], sub(P[0], P[1])), ...P, add(P.at(-1), sub(P.at(-1), P.at(-2)))];
  for (let i = 1; i < Q.length - 2; i++) {
    const [p0, p1, p2, p3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]];
    const t01 = len(sub(p1, p0)) ** 0.5, t12 = len(sub(p2, p1)) ** 0.5, t23 = len(sub(p3, p2)) ** 0.5;
    const m1 = sub(p2, p1).map((v, k) => v + t12 * ((p1[k] - p0[k]) / t01 - (p2[k] - p0[k]) / (t01 + t12)));
    const m2 = sub(p2, p1).map((v, k) => v + t12 * ((p3[k] - p2[k]) / t23 - (p3[k] - p1[k]) / (t12 + t23)));
    const n = Math.max(2, Math.ceil(len(sub(p2, p1)) / step));
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const u = j / n, h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
      out.push([0, 1, 2].map((k) => h00 * p1[k] + h10 * m1[k] + h01 * p2[k] + h11 * m2[k]));
    }
  }
  return out;
}

// straight pieces and arcs in the vertical plane x = start[0], heading +z: ["line", metres] or ["arc", radius, to slope
// in degrees (+ up)], sampled every `step` metres
function turtle(start, ops, step = 0.1) {
  let [x, y, z] = start, th = 0; const out = [[x, y, z]];
  for (const [kind, a, b] of ops) {
    if (kind === "line") { const n = Math.max(1, Math.round(a / step)); for (let i = 0; i < n; i++) { z += Math.cos(th) * a / n; y += Math.sin(th) * a / n; out.push([x, y, z]); } continue; }
    const to = b * D2R, L = Math.abs(to - th) * a, n = Math.max(2, Math.round(L / step)), d = (to - th) / n;
    for (let i = 0; i < n; i++) { const m = th + d / 2; z += Math.cos(m) * a * Math.abs(d); y += Math.sin(m) * a * Math.abs(d); th += d; out.push([x, y, z]); }
  }
  return out;
}

// the track's up at each point: the world's up made square to the track, banked by `bank(i)` degrees (to the car's
// right is +); in a vertical piece (the loop) the caller gives the up itself
function ups(pts, bank = () => 0) {
  return pts.map((p, i) => {
    const T = norm(sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
    const U0 = norm(sub([0, 1, 0], T.map((v) => v * T[1]))), R = cross(T, U0), b = bank(i) * D2R;
    return norm(add(U0.map((v) => v * Math.cos(b)), R, Math.sin(b)));
  });
}

export const LOOP = { R: 4.5, rise: 1.08, shift: 2.4 };   // shift: the way out runs beside the way in, a car width and a wing clear of it
export function buildTrack({ z0 = -64 } = {}) {
  const pieces = [];
  // lift + crest + drop + pull-out + airtime hump + run-in, in the plane x = 0, heading +z: a "turtle" of straight pieces
  // and circular arcs in (z, y), so the slope never kinks (a kink is a jolt the riders would show)
  const prof = turtle([0, 1.3, z0], [
    ["line", 3], ["arc", 9, 20], ["line", 27], ["arc", 6, -56], ["line", 5.6], ["arc", 7, 26], ["line", 0.6],
    ["arc", 15, -26], ["line", 0.6], ["arc", 9, 0], ["line", 5],
  ]);
  pieces.push({ name: "profile", pts: prof, up: ups(prof) });
  // the loop: a slightly tall circle in the y-z plane, entered at its bottom heading +z, the track's up toward its middle
  const e = prof.at(-1), { R: LR, rise, shift } = LOOP, LC = [0, e[1] + LR * rise, e[2]], loop = [], lu = [];
  for (let a = 1.5; a <= 360; a += 1.5) {
    const r = a * D2R, k = a / 360;
    const p = [shift * (k * k * (3 - 2 * k)), LC[1] - LR * rise * Math.cos(r), LC[2] + LR * Math.sin(r) * (1 - 0.06 * Math.sin(r * 0.5))];
    loop.push(p); lu.push(norm(sub([p[0], LC[1], LC[2]], p)));
  }
  pieces.push({ name: "loop", pts: loop, up: lu });
  // out of the loop at x = shift, heading +z, straight past the photo post and onto the level brake run
  const fin = turtle([shift, e[1], e[2]], [["line", 34]]).slice(1);
  pieces.push({ name: "final", pts: fin, up: ups(fin) });

  const samples = []; let s = 0, prev = null;
  for (const P of pieces) P.pts.forEach((p, i) => { if (prev) s += len(sub(p, prev)); samples.push({ p, u: P.up[i], s, piece: P.name }); prev = p; });
  samples.forEach((q, i) => { q.f = norm(sub(samples[Math.min(samples.length - 1, i + 1)].p, samples[Math.max(0, i - 1)].p)); });   // central differences
  return samples;
}

// the point at arc length s (linear between samples): position, forward, up
export function trackAt(T, s) {
  s = Math.max(0, Math.min(T.at(-1).s, s));
  let lo = 0, hi = T.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m].s <= s) lo = m; else hi = m; }
  const a = T[lo], b = T[hi], k = (s - a.s) / ((b.s - a.s) || 1);
  const p = a.p.map((v, i) => v + (b.p[i] - v) * k), f = norm(a.f.map((v, i) => v + (b.f[i] - v) * k)), u0 = norm(a.u.map((v, i) => v + (b.u[i] - v) * k));
  const u = norm(sub(u0, f.map((v) => v * dot(u0, f))));
  return { p, f, u, piece: a.piece };
}

// yaw / pitch / roll (degrees, vehicle.js Euler YXZ: forward = (sin y cos p, -sin p, cos y cos p)) for a forward and up,
// kept continuous with `prev` (through the vertical parts of the loop the yaw would flip 180: the other solution is
// taken instead, and pitch and roll unwrap)
export function eulerFor(f, u, prev) {
  const sols = [];
  for (const flip of [0, 1]) {
    let y = Math.atan2(f[0], f[2]), p = -Math.asin(Math.max(-1, Math.min(1, f[1])));
    if (Math.hypot(f[0], f[2]) < 1e-3 && prev) y = prev.yaw * D2R;
    if (flip) { y += Math.PI; p = Math.PI - p; }
    const cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p);
    const right0 = [cy, 0, -sy], up0 = [sy * sp, cp, cy * sp];   // Ry*Rx applied to x and y
    const r = Math.atan2(-dot(u, right0), dot(u, up0));
    sols.push([y, p, r].map((v) => v / D2R));
  }
  const near = (v, w) => { while (v - w > 180) v -= 360; while (v - w < -180) v += 360; return v; };
  if (!prev) return { yaw: sols[0][0], pitch: sols[0][1], roll: sols[0][2] };
  const cand = sols.map(([y, p, r]) => { const Y = near(y, prev.yaw), P = near(p, prev.pitch), Rr = near(r, prev.roll); return { yaw: Y, pitch: P, roll: Rr, cost: Math.abs(Y - prev.yaw) + Math.abs(P - prev.pitch) + Math.abs(Rr - prev.roll) }; });
  cand.sort((a, b) => a.cost - b.cost);
  const { cost, ...best } = cand[0]; return best;
}

// the car's speed along the track (m/s) from energy (v^2 = v0^2 + 2 g (h0 - h)) less a little friction, with the lift
// pulling it at `lift` m/s until the crest; `stall` slows it to a crawl over the loop's top (the comic hang) by taking
// energy away there and giving it back after (the brief's cartoon stall, nothing breaks)
export function speedProfile(T, { lift = 2.2, crestS = null, v0 = 1.2, friction = 0.012, stall = null } = {}) {
  const g = 9.81, top = crestS ?? T.reduce((b, q) => (q.s < 40 && q.p[1] > b.p[1] ? q : b), T[0]).s;
  const h0 = T.find((q) => q.s >= top).p[1];
  return (s) => {
    if (s <= top) return lift;
    const h = trackAt(T, s).p[1];
    let e = v0 * v0 + 2 * g * (h0 - h) - 2 * g * friction * (s - top);
    if (stall) { const { at, width, keep } = stall, d = (s - at) / width; e -= (1 - keep) * e * Math.exp(-d * d); }
    return Math.max(0.35, Math.sqrt(Math.max(0, e)));
  };
}
