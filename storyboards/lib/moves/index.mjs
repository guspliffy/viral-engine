// The move library (quality plan item 16): named moves recorded from real people (tools/mocap/retarget.mjs writes
// them here as <name>.json), played on a potato through the actions the rig already has. Nothing runs at render
// time: a move becomes ordinary storyboard actions, keyed every `key` seconds with linear eases, so a frame stays a
// lookup and renders the same every time.
//
//   import { play } from "./moves/index.mjs";
//   play(c, 1.0, "phx", "sneak", { from: [-0.7, 0], heading: "right", char: "duo/phoenix" });
//
// Retarget by intent (never joint angles):
//   path   the pelvis path, scaled to a potato's stride (`scale`, 0.27: a person's 1.5 m sneak step is a potato's 40 cm)
//   turn   the body's facing; pitch and lean from the torso (`pitch` gain 0.6, capped at `pitchMax` degrees: a round
//          body tipped 45° reads as falling over); crouch from how far the pelvis sinks (`crouch` gain)
//   arms   each hand from its own shoulder in arm lengths, times a potato's reach, kept outside the round body
//   eyes   the head's turn and nod against the torso become a look (40° = the edge of the eye)
//   feet   the recorded steps (lift, touch down, where) scaled the same way; lift height `lift` (0.5 of a person's)
// Time: `dur` stretches the whole move to that many seconds, `warp: [[move s, clip s], ...]` (from the move's start,
// piecewise linear) puts its beats where the story wants them (motion warping). `range: [a, b]` plays part of it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, "../../..");
const LEG_H = 0.14;   // engine/page/potato.js
const YAW = { camera: 0, front: 0, right: 90, left: -90, back: 180 };
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const cache = new Map();
export function load(name) {
  if (!cache.has(name)) cache.set(name, JSON.parse(fs.readFileSync(path.join(HERE, `${name}.json`), "utf8")));
  return cache.get(name);
}
function dims(char) {
  const d = char ? JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${char}.json`), "utf8")) : {};
  const B = d.body || { height: 1, width: 0.84, depth: 0.72 };
  return { H: B.height, rx: B.width / 2, rz: B.depth / 2 };
}
// a value of a per-frame track at move time u (linear between frames)
const sample = (arr, fps, u) => {
  const f = clamp(u * fps, 0, arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), r = f - i;
  const a = arr[i], b = arr[i + 1];
  return Array.isArray(a) ? a.map((v, k) => v + (b[k] - v) * r) : a + (b - a) * r;
};
// the potato's hand target (its own space: faces +z, right hand at -x) for a hand vector in arm lengths
function handO(v, side, D, reach) {
  const sx = side === "R" ? -1 : 1, cy = LEG_H + D.H / 2;
  let x = sx * (D.rx * 0.92 + v[0] * reach), y = LEG_H + D.H * 0.56 + v[1] * reach, z = v[2] * reach;
  // keep the glove outside the body (a hand hanging by a person's hip would be inside a potato): push it out
  // round the body at its height
  const m = 0.075, a = D.rx + m, b = D.H / 2 + m, c = D.rz + m, k = (x / a) ** 2 + (z / c) ** 2, room = 1 - ((y - cy) / b) ** 2;
  if (room > 0 && k < room) { const s = Math.sqrt(room / Math.max(1e-6, k)); x *= s; z *= s; if (Math.abs(x) < 1e-3) x = sx * 1e-3; }
  return [r3(sx * x - D.rx), r3((y - LEG_H) / D.H), r3(z)];
}

export function play(c, t, who, name, o = {}) {
  const mv = typeof name === "string" ? load(name) : name;
  const { from = [0, 0], heading = 0, scale = 0.27, lift = 0.5, pitch: pg = 0.6, pitchMax = 26, lean: lg = 1, crouch: cg = 5,
    reach = 0.46, look = 40, key = 1 / 15, char, range = [0, mv.len], hands = true, eyes = true, feet = true } = o;
  const D = dims(char), H0 = (typeof heading === "string" ? YAW[heading] : heading) * (Math.PI / 180);
  const T = [Math.sin(H0), Math.cos(H0)], L = [Math.cos(H0), -Math.sin(H0)];   // travel and its left, world x/z
  // time: move seconds (from range[0]) -> clip seconds
  const span = range[1] - range[0], dur = o.dur ?? span;
  const W = o.warp || [[0, 0], [span, dur]];
  const clipT = (u) => { let k = 0; while (k < W.length - 2 && W[k + 1][0] < u) k++; const [a0, b0] = W[k], [a1, b1] = W[k + 1]; return t + b0 + ((u - a0) * (b1 - b0)) / (a1 - a0); };
  const moveU = (s) => { let k = 0; while (k < W.length - 2 && W[k + 1][1] < s) k++; const [a0, b0] = W[k], [a1, b1] = W[k + 1]; return a0 + ((s - b0) * (a1 - a0)) / (b1 - b0); };
  const p0 = sample(mv.path, mv.fps, range[0]);
  const world = (f, l) => [r3(from[0] + scale * ((f - p0[0]) * T[0] + (l - p0[1]) * L[0])), r3(from[1] + scale * ((f - p0[0]) * T[1] + (l - p0[1]) * L[1]))];
  const n = Math.round(dur / key), pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i * key, u = range[0] + moveU(s), at = t + s, k = i === 0 ? 0 : key;
    const p = sample(mv.path, mv.fps, u);
    pts.push([r3(s), ...world(p[0], p[1])]);
    c.A(at, who, "turn", { to: r3((H0 * 180) / Math.PI + sample(mv.yaw, mv.fps, u)), dur: k, ease: "linear" });
    c.A(at, who, "pitch", { to: r3(clamp(pg * sample(mv.pitch, mv.fps, u), -pitchMax, pitchMax)), dur: k, ease: "linear" });
    c.A(at, who, "lean", { to: r3(lg * sample(mv.lean, mv.fps, u)), dur: k, ease: "linear" });
    c.A(at, who, "crouch", { to: r3(clamp(cg * sample(mv.drop, mv.fps, u), -0.5, 1.2)), dur: k, ease: "linear" });
    if (hands) for (const sd of ["R", "L"]) c.A(at, who, "arm", { side: sd, pose: { o: handO(sample(mv.hand[sd], mv.fps, u), sd, D, reach * D.H) }, dur: k, ease: "linear", lead: false });
    if (eyes) { const h = sample(mv.head, mv.fps, u); c.A(at, who, "look", { to: [r3(clamp(h[0] / look, -0.9, 0.9)), r3(clamp(h[1] / look, -0.8, 0.8))], dur: k, ease: "linear", blink: false }); }
  }
  // the body's path as one run (the legs never stop between keys); stride 1 is a walk
  c.A(t, who, "run", { pts, stride: 1, rate: [[0, 1.6]], dur: r3(dur) });
  if (feet) {
    // the steps, scaled like the path; a foot's distance from the path's centre line keeps the potato's own stance
    const ev = {};
    for (const sd of ["R", "L"]) {
      const sgn = sd === "L" ? 1 : -1;
      ev[sd] = (mv.feet[sd] || []).filter((e) => e.t0 >= range[0] && e.t1 <= range[1]).map((e) => {
        const pc = sample(mv.path, mv.fps, e.t1), dl = e.p1[1] - pc[1] - sgn * mv.human.hipHalf;
        const w = world(e.p1[0], pc[1]);
        const side = sgn * 0.13 + scale * dl, fwd = 0.04;   // timeline.js GAIT.hx, hz: the foot's home under the body
        const yaw = H0 + (sample(mv.yaw, mv.fps, e.t1) * Math.PI) / 180;
        return { t0: r3(clipT(e.t0 - range[0])), t1: r3(clipT(e.t1 - range[0])), p1: [r3(w[0] + side * L[0] + fwd * T[0]), r3(w[1] + side * L[1] + fwd * T[1])], h: r3(lift * e.h), a1: r3(yaw) };
      });
    }
    c.A(t, who, "feet", { ev, move: mv.name });
  }
  return { end: t + dur, last: pts[pts.length - 1] };
}
