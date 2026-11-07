// An epic fight between two anime people (Jonny, 7 Nov 2026 16:36: "now create a epic fighting scene between two
// characters just make the hair and the clothes in a different color to differentiate the characters"). The same CC0
// VRoid body twice: human/vrm-test-01 (dark hair, rust hoodie) and human/vrm-test-02 (silver hair, teal top). A fire
// duel, building on the firebending clip (tools/human/make-firebend.mjs, props-fire.js): every strike is a real CMU
// recording (karate 135, boxing 143_23, a jump kick 90_05, a knock-down fall 90_18), each take turned to face the
// other fighter on its strike and placed where that fighter stands; blocks catch the fire (it splashes on the guard),
// the two last blasts meet in the middle, and the winner's pushes through.
//   node tools/human/make-fight.mjs        -> storyboards/human/fight/fight-01.json
// Fire sources are measured on the drawn bodies when storyboards/human/fight/fight-01.src.<A|B>.json exist
// (a layout pass per fighter with DIAG=A or DIAG=B, then tools/human/firebend-src.mjs <log> <that file>), else taken
// from the recordings.
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const LEG = 0.845, R = (v, n = 3) => +(+v).toFixed(n), D2R = Math.PI / 180;
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const OUT = "storyboards/human/fight";

// where the two stand in a shot (world x, z): A on the left, B on the right, on a line `line` degrees off the frame's
// width (0: side by side, the camera square to the line; positive: A nearer the camera, negative: B nearer, so we see
// A's face), `half` metres from the middle each (a close exchange stands them nearer). The painted set only lets the camera pan about 10 degrees, so the angle
// between shots comes from turning this line, not the camera (as in the firebending clip: turn the take, not the
// camera). A stays left of B in every shot, so no cut crosses the line.
const HALF = { far: 0.85, near: 0.8 };
const spotOf = (sh, who, near) => { const d = near ? HALF.near : sh.half ?? HALF[sh.spots], a = (sh.line ?? 30) * D2R, sx = who === "A" ? -1 : 1;
  return [sx * d * Math.cos(a), -sx * d * Math.sin(a)]; };

// the shots. Per fighter: the take (clip, seconds in the clip file), its rate, and the moment (ref, clip seconds) it is
// turned to face the other fighter on: "strike" aims the limb's line at them, "body" the hips. fire: who, which limb,
// the clip-seconds window it may pour in (the fire is born at 90 % of the fullest stretch there), kind and look;
// at: "opp" gives the stream a reach that ends on the other fighter (it splashes on his guard)
const SHOTS = [
  // 1. frame 0 mid-action: A's lunge punch is already throwing fire; B's knife-hand block catches it and it splashes
  { name: "clash", line: 58, spots: "far", lead: "A",
    A: { clip: "c135_09", from: 2.38, to: 3.0, ref: 2.6, aim: "strike", limb: "R" },
    B: { clip: "c135_10", from: 3.38, ref: 3.6, aim: "body" },
    // (a flame already in his fist on frame 0, so the very first frame is fire)
    fire: [{ who: "A", limb: "R", at: -0.3, to: 0.15, kind: "hold", speed: 1, size: 0.055, rate: 70, life: 0.28, lift: 0.4, silent: true },
      { who: "A", limb: "R", from: 2.38, to: 2.95, kind: "jet", speed: 9, dur: 0.24, size: 0.16, at: "opp", splash: 0.3 }],
    cam: { az: 3, el: 4, fov: 40 } },
  // 2. B answers with a roundhouse; its crescent rakes across A's block
  { name: "counter", line: -60, half: 1.1, spots: "far", lead: "B",
    B: { clip: "c135_07", from: 0.5, to: 1.55, rate: 1.2, ref: 0.95, aim: "strike", limb: "RF" },
    A: { clip: "c135_10", from: 4.75, ref: 5.1, aim: "body" },
    fire: [{ who: "B", limb: "RF", from: 0.75, to: 1.15, kind: "arc", speed: 3.5, size: 0.2, rate: 300, life: 0.3, minY: 0.75 }],
    cam: { az: -4, el: 4, fov: 46, fit: 1.0 } },
  // 3-4. in close: they trade jabs, a lick of fire off every fist that dies short of the other's guard; over A's
  // shoulder, then over B's onto A's face (Fable review A: the angry face was never shown big)
  { name: "exchange", line: 50, spots: "near", lead: "A",
    A: { clip: "c143_23", from: 0.35, to: 1.0, ref: 0.55, aim: "strike", limb: "L" },
    B: { clip: "c143_23", from: 0.65, ref: 1.15, aim: "strike", limb: "R" },
    fire: [{ who: "A", limb: "L", from: 0.45, to: 0.75, kind: "jet", speed: 2, dur: 0.1, size: 0.1, rate: 140, life: 0.1 },
      { who: "B", limb: "R", from: 1.05, to: 1.3, kind: "jet", speed: 2, dur: 0.1, size: 0.1, rate: 140, life: 0.1 }],
    cam: { az: 0, el: 3, fov: 40 } },
  { name: "exchange2", line: -50, spots: "near", lead: "A",
    A: { clip: "c143_23", from: 1.0, to: 1.95, ref: 1.15, aim: "strike", limb: "R" },
    B: { clip: "c143_23", from: 1.3, ref: 1.9, aim: "strike", limb: "L" },
    fire: [{ who: "A", limb: "R", from: 1.05, to: 1.35, kind: "jet", speed: 2, dur: 0.1, size: 0.1, rate: 140, life: 0.1 },
      { who: "B", limb: "L", from: 1.75, to: 2.05, kind: "jet", speed: 2, dur: 0.1, size: 0.1, rate: 140, life: 0.1 },
      { who: "A", limb: "L", from: 1.75, to: 1.95, kind: "jet", speed: 2.2, dur: 0.1, size: 0.12, rate: 160, life: 0.12, flash: true }],
    cam: { az: 0, el: 3, fov: 40, fit: 0.92 } },
  // 5. B steps out and side-kicks a jet across the gap; A takes it on his guard
  { name: "sidekick", line: 66, spots: "far", lead: "B",
    B: { clip: "c135_11", from: 1.25, to: 2.4, rate: 1.2, ref: 1.9, aim: "strike", limb: "RF" },
    A: { clip: "c135_10", from: 6.3, ref: 6.6, aim: "body" },
    fire: [{ who: "B", limb: "RF", from: 1.65, to: 2.2, kind: "jet", speed: 9, size: 0.13, dur: 0.22, life: 0.35, at: "opp", splash: 0.2 }],
    cam: { az: -3, el: 4, fov: 46 } },
  // 6. A leaps into a spinning jump kick: a ring of fire; B blocks
  { name: "jumpkick", line: -50, spots: "far", lead: "A",
    A: { clip: "c90_05", from: 1.75, to: 2.65, ref: 2.65, aim: "travel", near: true },
    B: { clip: "c135_10", from: 7.75, ref: 8.1, aim: "body" },
    fire: [{ who: "A", limb: "LF", from: 1.9, to: 2.5, kind: "arc", speed: 3.5, size: 0.3, rate: 300, life: 0.45, minY: 0.8 }],
    cam: { az: 3, el: 6, fov: 40 } },
  // 7. they square off: both sink into a horse stance and light both fists (the breath before the last blast)
  { name: "breath", line: 30, spots: "far", lead: "A",
    A: { clip: "c135_11", from: 0.0, to: 1.3, ref: 0.9, aim: "body" },
    B: { clip: "c135_11", from: 0.0, ref: 0.9, aim: "body" },
    fire: [{ who: "A", limb: "L", at: 0.5, to: 1.3, kind: "hold", speed: 1, size: 0.05, rate: 70, life: 0.28, lift: 0.4 },
      { who: "A", limb: "R", at: 0.55, to: 1.3, kind: "hold", speed: 1, size: 0.05, rate: 70, life: 0.28, lift: 0.4 },
      { who: "B", limb: "L", at: 0.6, to: 1.3, kind: "hold", speed: 1, size: 0.05, rate: 70, life: 0.28, lift: 0.4 },
      { who: "B", limb: "R", at: 0.65, to: 1.3, kind: "hold", speed: 1, size: 0.05, rate: 70, life: 0.28, lift: 0.4 }],
    cam: { az: 0, el: 3, fov: 40 } },
  // 8. both blast at once: the two streams meet in the middle, then the meeting point is pushed toward B (his stream
  // gives ground), and A's breaks through to him (Fable review A: show who is winning before the break)
  { name: "beams", line: -12, half: 1.2, back: 2.6, spots: "far", lead: "A", payoff: true,
    A: { clip: "c135_09", from: 6.0, to: 7.35, ref: 6.7, aim: "strike", limb: "R" },
    B: { clip: "c135_09", from: 4.1, ref: 4.8, aim: "strike", limb: "L" },
    fire: [{ who: "A", limb: "R", from: 6.15, to: 6.95, kind: "jet", speed: 8, size: 0.13, grow: 1.8, rate: 240, dur: 0.42, spread: 0.12, level: 0.2, at: "mid", splash: 0.4 },
      { who: "B", limb: "L", from: 4.25, to: 5.0, kind: "jet", speed: 8, size: 0.13, grow: 1.8, rate: 240, dur: 0.42, spread: 0.12, level: 0.2, at: "mid", splash: 0.4 },
      { who: "A", limb: "R", from: 6.75, to: 7.0, kind: "jet", speed: 8, size: 0.14, grow: 1.8, rate: 240, dur: 0.23, spread: 0.12, level: 0.2, at: "mid", meet: 0.68, splash: 0.4, peak: "start", silent: true },
      { who: "B", limb: "L", from: 4.85, to: 5.1, kind: "jet", speed: 8, size: 0.12, grow: 1.8, rate: 220, dur: 0.23, spread: 0.12, level: 0.2, at: "mid", meet: 0.32, splash: 0.4, taper: 0.15, peak: "start", silent: true },
      { who: "A", limb: "R", from: 6.98, to: 7.35, kind: "jet", speed: 10, size: 0.17, grow: 2, rate: 260, dur: 0.37, life: 0.6, spread: 0.16, level: 0.2, at: "opp", splash: 0.35, taper: 0.15, peak: "start", brk: true }],
    cam: { az: 0, el: 4, fov: 42 } },
  // 9. B is thrown back flat, away from A along the stream; A holds the punch and both his fists light again (the
  // breath shot's flames, answered), held for half a second
  { name: "down", line: 45, half: 0.8, back: 1.8, spots: "far", lead: "A",
    A: { clip: "c135_09", from: 7.3, to: 7.975, rate: 0.5, ref: 7.4, aim: "strike", limb: "R" },
    B: { clip: "c90_18", from: 0.55, to: 1.4, ref: 0.6, aim: "body" },
    fire: [{ who: "A", limb: "L", at: 0.6, to: 1.35, kind: "hold", speed: 1, size: 0.065, rate: 80, life: 0.3, lift: 0.4 },
      { who: "A", limb: "R", at: 0.65, to: 1.35, kind: "hold", speed: 1, size: 0.065, rate: 80, life: 0.3, lift: 0.4 }],
    cam: { az: 4, el: 5, fov: 38, fit: 1.2 } },
];

// one take as a perform segment, turned and placed so that at clip second `ref` it faces `to` from `at`
const lineOf = (W, limb) => {
  const side = limb[0].toLowerCase();
  const end = limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, base = limb.length === 1 ? W[`${side}humerus`].start : W[`${side}femur`].start;
  return end.clone().sub(base);
};
const bodyFwd = (W) => new THREE.Vector3(0, 0, 1).applyQuaternion(W.root.q);   // the hips' forward (the recordings face +z)
function segFor(P, at, to, t0) {
  load(P.clip); const rate = P.rate ?? 1;
  const base = { at: R(t0), clip: P.clip, from: P.from, to: P.to, speed: rate, blend: 0 };
  const probe = new Performance([{ ...base, at: 0, heading: 0, place: [0, 0] }], clips, [], LEG);
  const tl = (P.ref - P.from) / rate, W = worldPose(probe.at(tl));
  // the strike's line (or the hips' forward): turn the take so it points at the other fighter
  // travel: the way the whole take moves (a leap lands toward the other fighter)
  let f = P.aim === "strike" ? lineOf(W, P.limb) : P.aim === "travel" ? probe.at(tl).pos.clone().sub(probe.at(0).pos) : bodyFwd(W); f.y = 0;
  const want = Math.atan2(to[0] - at[0], to[1] - at[1]), have = Math.atan2(f.x, f.z);
  const heading = R((want - have) / D2R, 2);
  const turned = new Performance([{ ...base, at: 0, heading, place: [0, 0] }], clips, [], LEG);
  const r = turned.at(tl).pos;
  return { ...base, heading, place: [R(at[0] - r.x, 4), R(at[1] - r.z, 4)] };
}

// the timeline: each shot's length is its lead's take; the other fighter's take runs as long
const list = { A: [], B: [] };
let t = 0;
for (const sh of SHOTS) {
  const lead = sh[sh.lead], len = R((lead.to - lead.from) / (lead.rate ?? 1));
  for (const who of ["A", "B"]) {
    const P = sh[who]; P.to ??= R(P.from + len * (P.rate ?? 1), 3);
    const me = spotOf(sh, who, P.near), opp = spotOf(sh, who === "A" ? "B" : "A");
    list[who].push(segFor(P, me, opp, t));
  }
  sh.t0 = t; sh.t1 = R(t + len); sh.len = len; t = sh.t1;
}
const END = R(t);
// each shot centred on the camera's line (x = 0, z = 0 the middle of what it holds): the camera can't pan to find them
{ const P0 = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
  SHOTS.forEach((sh, i) => {
    const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
    for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) for (const who of ["A", "B"]) { const p = P0[who].at(s2).pos; lo[0] = Math.min(lo[0], p.x); hi[0] = Math.max(hi[0], p.x); lo[1] = Math.min(lo[1], p.z); hi[1] = Math.max(hi[1], p.z); }
    // (back: the pair stands that much further from the camera, so a wide two-shot holds them both at the lens the
    // painting allows)
    const dx = -(lo[0] + hi[0]) / 2, dz = -(lo[1] + hi[1]) / 2 - (sh.back ?? (sh.spots === "far" ? 0.6 : 0));
    for (const who of ["A", "B"]) { const g = list[who][i]; g.place = [R(g.place[0] + dx, 4), R(g.place[1] + dz, 4)]; }
  }); }
const perf = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
const poseAt = (who, s) => worldPose(perf[who].at(Math.min(s, END - 1e-4)));
const T = (sh, who, u) => R(sh.t0 + (u - sh[who].from) / (sh[who].rate ?? 1), 4);

// measured fists and feet (per fighter), else the recording's
const MEAS = {};
for (const w of ["A", "B"]) { const f = `${OUT}/fight-01.src.${w}.json`; MEAS[w] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; }
const near = (arr, s) => { if (!arr?.length) return null; let i = arr.findIndex((q) => q.t >= s); if (i <= 0) return arr[Math.max(0, i)]; const a = arr[i - 1], b = arr[i], k = (s - a.t) / Math.max(1e-6, b.t - a.t); return { t: s, p: a.p.map((v, j) => v + (b.p[j] - v) * k) }; };
function source(who, limb, s) {
  const W = poseAt(who, s), side = limb[0].toLowerCase();
  let p, d;
  if (limb.length === 1) { const palm = palmWorld(W, side), el = W[`${side}radius`].start; d = palm.clone().sub(el).normalize(); p = palm.clone().addScaledVector(d, 0.05);
    const m = near(MEAS[who]?.[limb], s); if (m) p = new THREE.Vector3(...m.p).addScaledVector(d, 0.05); }
  else { const ball = W[`${side}foot`].end, hip = W[`${side}femur`].start; d = ball.clone().sub(hip).normalize(); p = ball.clone();
    const m = near(MEAS[who]?.[limb], s); if (m) p = new THREE.Vector3(...m.p); }
  return [R(s, 4), R(p.x), R(p.y), R(p.z), R(d.x), R(d.y), R(d.z)];
}
const reachOf = (who, limb, s) => { const W = poseAt(who, s), l = lineOf(W, limb), side = limb[0].toLowerCase();
  return { d: l.length(), end: limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, line: l }; };
const chest = (who, s) => { const W = poseAt(who, s); return W.thorax ? W.thorax.end.clone() : W.root.start.clone().add(new THREE.Vector3(0, 0.35, 0)); };

const blasts = [], marks = { flash: [], brk: null, silent: new Set() };
for (const sh of SHOTS) for (const f of sh.fire || []) {
  const { who, limb, from, to, at: holdAt, dur, minY, level, at: _a, push, peak, meet, flash, brk, silent, ...rest } = f;
  const opp = who === "A" ? "B" : "A";
  let a, b, line = null;
  if (f.kind === "hold") { a = R(sh.t0 + holdAt, 4); b = R(Math.min(sh.t1, sh.t0 + to), 4); }   // (a hold: story seconds into the shot)
  else {
    const w0 = T(sh, who, from), w1 = T(sh, who, to); let pk = w0, pd = 0;
    for (let s2 = w0; s2 <= w1; s2 += 1 / 120) { const r = reachOf(who, limb, s2); if (r.d > pd && (minY == null || r.end.y >= minY)) { pd = r.d; pk = s2; } }
    a = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).d < 0.9 * pd) break; a = s2; }
    if (peak === "start") { a = w0; pk = w0; pd = reachOf(who, limb, w0).d; }
    if (f.kind === "arc") { a = pk; b = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; a = s2; } for (let s2 = pk; s2 <= w1; s2 += 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; b = s2; } }
    else {
      b = Math.min(w1, a + (dur ?? 0.22)); for (let s2 = pk; s2 <= b; s2 += 1 / 120) if (reachOf(who, limb, s2).d < 0.7 * pd) { b = s2; break; }
      if (f.kind === "jet") { line = reachOf(who, limb, pk).line; if (level != null) line.y *= level; line.normalize(); }
    }
    a = R(a, 4); b = R(b, 4);
  }
  const src = [];
  for (let s2 = a; s2 <= b + 1e-6; s2 += 1 / 60) { const q = source(who, limb, s2); if (line) q.splice(4, 3, R(line.x), R(line.y), R(line.z)); if (minY == null || q[2] >= minY * 0.9) src.push(q); }
  if (!src.length) { console.warn("no fire for", sh.name, who, limb); continue; }
  // reach: the stream splashes where it meets the other fighter's guard ("opp", 0.3 m short of his chest) or the
  // middle between them ("mid": two streams meeting); push moves that meeting point on toward the other
  let reach;
  if (_a === "opp" || _a === "mid") {
    const s0 = src[0], p0 = new THREE.Vector3(s0[1], s0[2], s0[3]), c = chest(opp, a), dist = p0.distanceTo(c);
    // (mid: half way to the other fighter's nearer fist, where his own stream leaves)
    // (measured half way through the pour: both are still closing in when the streams start)
    const sm = (a + b) / 2, q = source(who, limb, sm), pm = new THREE.Vector3(q[1], q[2], q[3]), W = poseAt(opp, sm);
    const fist = Math.min(pm.distanceTo(palmWorld(W, "l")), pm.distanceTo(palmWorld(W, "r")));
    reach = _a === "opp" ? Math.max(0.2, dist - 0.3) : fist * (meet ?? 0.5) + (push ?? 0);
  }
  blasts.push({ at: src[0][0], end: src[src.length - 1][0], cut: R(sh.t1, 4), src, ...(reach != null ? { reach: R(reach) } : {}), ...rest });
  if (flash) marks.flash.push(src[0][0]);
  if (silent) marks.silent.add(blasts[blasts.length - 1]);
  if (brk) marks.brk = src[0][0];
}
// the hit that throws B down: a burst on his chest as he is flung back
for (const sh of SHOTS) if (sh.name === "down") {
  const s0 = sh.t0 + 0.03, c = chest("B", s0);
  blasts.push({ at: R(s0, 4), end: R(s0 + 0.25, 4), cut: R(sh.t1, 4), kind: "burst", speed: 2.5, size: 0.08, rate: 140, life: 0.15, drag: 3, lift: 1.5,
    src: [[R(s0, 4), R(c.x), R(c.y), R(c.z), 0, 0, 1], [R(s0 + 0.25, 4), R(c.x), R(c.y), R(c.z), 0, 0, 1]] });
}

// the cameras: still, one per shot, low (at the hips: the fighters stand against the sky), aimed at the middle of
// everything the shot must hold (both fighters, all shot long, and the near part of the fire), then the lens fitted
const beats = SHOTS.map((sh) => {
  const c = sh.cam, pts = [];
  for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) for (const who of ["A", "B"]) {
    const W = poseAt(who, s2);
    pts.push(W.head.end.clone().add(new THREE.Vector3(0, 0.12, 0)), palmWorld(W, "l"), palmWorld(W, "r"), W.root.start.clone(), W.lfoot.end.clone(), W.rfoot.end.clone());
  }
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().multiplyScalar(-1);
  for (const p of pts) { lo.min(p); hi.max(p); }
  const ctr = lo.clone().add(hi).multiplyScalar(0.5), az = c.az * D2R, el = c.el * D2R;
  const back = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const fw = back.clone().negate(), rt = fw.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
  const tv = Math.tan(c.fov * Math.PI / 360), th = tv * 9 / 16, fit = c.fit ?? 1.08;
  let D = 1.5;
  for (const p of pts) { const v = p.clone().sub(ctr), x = Math.abs(v.dot(rt)), y = Math.abs(v.dot(up)), z = v.dot(back); D = Math.max(D, z + (x * fit) / th, z + (y * fit) / tv); }
  D = Math.min(D, (4.7 - ctr.z) / Math.max(0.2, back.z));
  const pos = ctr.clone().addScaledVector(back, D); pos.x = Math.max(-0.45, Math.min(0.45, pos.x)); pos.y = c.y ?? 0.8;
  const cam = new THREE.PerspectiveCamera(c.fov, 9 / 16, 0.05, 100), look = ctr.clone();
  let fov = c.fov;
  for (let k = 0; k < 4; k++) {
    cam.fov = fov; cam.position.copy(pos); cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const m = Math.max((x1 - x0) / 2, (y1 - y0) / 2) * fit, dz = look.clone().project(cam).z;
    look.copy(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, dz).unproject(cam));
    // the painting's pan and tilt limits (qa/env.mjs --range: about 10 degrees each way)
    { const v = look.clone().sub(pos), h = Math.hypot(v.x, v.z), yaw = Math.atan2(v.x, -v.z), pit = Math.atan2(v.y, h);
      const y2 = Math.max(-8.5 * D2R, Math.min(8.5 * D2R, yaw)), p2 = Math.max(-6 * D2R, Math.min(6 * D2R, pit)), L = v.length();
      look.copy(pos).add(new THREE.Vector3(Math.sin(y2) * Math.cos(p2), Math.sin(p2), -Math.cos(y2) * Math.cos(p2)).multiplyScalar(L)); }
    fov = Math.max(c.fov * 0.85, Math.min(c.fov, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * m) * 180 / Math.PI));
  }
  return { name: sh.name, at: R(sh.t0), len: R(sh.len), kind: sh.payoff ? "payoff" : undefined,
    shot: { pos: [R(pos.x), R(pos.y), R(pos.z)], look: [R(look.x), R(look.y), R(look.z)], fov: R(fov * (c.push ?? 1), 1) }, do: [] };
});

// the sound: a fwoosh on every jet (louder as the fight builds), a swish and a fwump on the kicks, small fwumps on the
// jabs, a thud as each block takes the fire, the inhale and the fists lighting before the beams, the two beams' roar and
// a low rumble as they push, and the fall's heavy thud
const shotAt = (s) => beats.find((b) => s >= b.at - 1e-6 && s < b.at + b.len) ?? beats[beats.length - 1];
const put = (s, item) => { const b = shotAt(s); b.do.push({ ...(item.sfx ? { reason: item.reason ?? "the fire is born on this frame" } : {}), ...item, at: R(Math.max(0, s - b.at)) }); };
const hitStop = [];
for (const B of blasts) {
  const b = shotAt(B.at);
  if (marks.silent.has(B)) continue;
  if (B.kind === "hold") { put(B.at, { sfx: "ai/ignite", gain: b.name === "down" ? 1.5 : 1.1 }); continue; }
  if (B.kind === "burst") continue;
  if (B.kind === "arc") { put(B.at - 0.12, { sfx: "whoosh", dur: 0.4, gain: 0.5 }); put(B.at, { sfx: "ai/flare", gain: 0.9 }); continue; }
  if (B.size <= 0.12) { put(B.at, { sfx: "ai/flare", gain: 0.6 }); continue; }
  put(B.at - 0.02, { sfx: "flamejet", gain: b.name === "beams" ? 0.95 : 0.7 });
}
// a 2-frame flash on the last jab: the button into the side kick
for (const s2 of marks.flash) put(s2, { fx: "flash", dur: 0.07, peak: 0.8, sound: false });
{ const br = beats.find((b) => b.name === "breath"); put(br.at + 0.15, { sfx: "gasp", gain: 1.0, reason: "they breathe in as they sink into the stance" });
  const holds = blasts.filter((B) => B.kind === "hold" && shotAt(B.at) === br); if (holds.length) put(holds[0].at + 0.05, { sfx: "sizzle", dur: R(br.at + br.len - holds[0].at - 0.05), gain: 1.0, reason: "the held flames hiss" }); }
// the beams: a rumble and a light shake while the streams push, then the break: a second roar, a hard shake, a
// 2-frame flash and a 3-frame hit-stop on the frame A's fire breaks through
{ const bm = beats.find((b) => b.name === "beams"), js = blasts.filter((B) => shotAt(B.at) === bm && B.kind === "jet" && !marks.silent.has(B) && B.at < marks.brk);
  const meet = Math.max(...js.map((B) => B.at)) + 0.15, brk = marks.brk;
  put(meet, { sfx: "rumble", dur: R(brk - meet + 0.3), gain: 0.55, reason: "the two streams push against each other" });
  put(meet, { fx: "shake", dur: R(brk - meet), amp: 0.02 });
  put(brk, { fx: "shake", dur: 0.35, amp: 0.045 });
  put(brk, { fx: "flash", dur: 0.07, peak: 0.8, sound: false });
  put(brk + 0.02, { sfx: "flamejet", gain: 1.0, reason: "A's fire breaks through B's" });
  hitStop.push({ at: R(Math.round(brk * 30) / 30), frames: 3 }); }
{ const dn = beats.find((b) => b.name === "down");
  put(dn.at + 0.03, { fx: "shake", dur: 0.2, amp: 0.03 });
  // the body lands flat on its back: the hips' lowest moment
  let low = dn.at, ly = 9; for (let s2 = dn.at; s2 < dn.at + dn.len; s2 += 1 / 60) { const y = poseAt("B", s2).root.start.y; if (y < ly - 0.005) { ly = y; low = s2; } }
  put(low, { sfx: "thud", gain: 1.0, reason: "B lands flat on his back" });
  put(low, { sfx: "kenney/impact-punch-heavy", gain: 0.8, reason: "B lands flat on his back (the meaty layer a phone speaker plays)" }); }

const cast = (id, who, look) => ({ id, character: look, at: list[who][0].place, face: { angry: 0.85 }, seed: who === "A" ? 1.3 : 2.1, perform: list[who],
  fingers: [[0, 0.95, 0.95]], diagPalms: process.env.DIAG === who, diagFeet: process.env.DIAG === who });
const sb = {
  id: "fight-01",
  title: "Fire duel",
  idea: "Two anime people fight a fire duel in a volcano valley at sunset: punches, kicks and blocks that throw and catch fire, a jab exchange up close, a jump kick, both breathe in and blast at once, the streams meet, and the dark-haired one's fire breaks through and throws the silver-haired one flat",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  set: { type: "env", env: "fern-valley-campfire", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  music: { file: "ai/epic/epic-02.ogg", lowCut: 150, gain: 0.4 },
  sound: { sfx: 0.6, ambience: 0.34, surface: "dirt", room: "open", guard: true },
  creative: { notes: false },
  cast: [cast("a", "A", "human/vrm-test-01"), cast("b", "B", "human/vrm-test-02")],
  props: [{ id: "fire", kind: "firebend", x: 0, y: 0, z: 0, rot: 0, blasts, light: 18, staged: "fire: light, it rests on nothing" }],
  beats,
  hitStop,
  // what each beat must show: both fighters in every shot; B's face as he blocks the first blast, A's as he breathes in
  // and as he stands over B at the end
  visible: [{ from: 0.2, to: 0.8, see: ["a", "b", "b.face"], why: "the first blast and the guard that catches it" },
    ...beats.filter((b) => b.name !== "clash").map((b) => ({ from: R(b.at + 0.1), to: R(b.at + b.len - 0.05), see: ["a", "b"], why: `both fighters in the ${b.name} shot` })),
    { from: R(beats[5].at + 0.4), to: R(beats[5].at + beats[5].len - 0.1), see: ["a.face"], why: "he breathes in and lights his fists" },
    { from: R(END - 0.5), to: R(END - 0.05), see: ["a.face", "b"], why: "the winner stands over the fallen one" }],
  captions: [],
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217).",
  notes: "Generated by tools/human/make-fight.mjs.",
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/fight-01.json`, JSON.stringify(sb, null, 1));
console.log("END", END, SHOTS.map((s) => `${s.name} ${R(s.t0, 2)}`).join("  "), "blasts", blasts.length, Object.values(MEAS).some(Boolean) ? "(measured)" : "(recorded)");
