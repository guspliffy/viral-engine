// Fire duel v2 (Jonny, 7 Nov 2026 19:22, on v1: "no character should lay down at the end. rather let him surrender in
// another way or let him run away. the fist fight is not that nice the characters should rather keep distance also
// there should be defense move redirecting the fire into another direction or catching and using it to
// counterstrike. the fight should like a epic anime figh a bit over dramatic with closeup scenes and epic attack and
// characters sliding back while defending attacks. research anime fights and apply the style").
//
// The same two people as v1 (human/vrm-test-01 dark hair, rust hoodie = A; human/vrm-test-02 silver hair, teal top = B),
// now about four metres apart all fight long, every exchange ranged:
//   - a guard that takes a blast skids back on planted feet with a dust trail (segment "slide", human-perform.js);
//   - a redirect: A turns his waist like a tai chi "roll back" (CMU 12_04) and the stream that hits his palm follows
//     the hand round and flies off into the sky;
//   - a catch and counter: A gathers B's biggest blast into a fireball between his palms ("hold the ball", CMU 12_04),
//     turns with it and punches it back, bigger;
//   - anime grammar: an extreme close-up of the eyes before each big attack, a shout on the attack (cast "faces"),
//     speed lines, impact frames, hit-stops, a shock close-up with a dun-dun;
//   - the end: B's guard is blown back, his fire sputters out, he throws his hands up and runs for it; nobody lies down.
//   node tools/human/make-fight-02.mjs        -> storyboards/human/fight/fight-02.json
// Fire sources are measured like v1: DIAG=A / DIAG=B layout passes, tools/human/firebend-src.mjs <log>
// storyboards/human/fight/fight-02.src.<A|B>.json, then this again.
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const LEG = 0.845, R = (v, n = 3) => +(+v).toFixed(n), D2R = Math.PI / 180, FPS = 30;
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const OUT = "storyboards/human/fight", ID = "fight-02";

// where the two stand: A left, B right, on a line `line` degrees off the frame's width (positive: A nearer the
// camera), `half` metres from the middle each. Ranged: 2 m each way (v1 stood them 1.6-1.7 m apart)
const spotOf = (sh, who) => { const d = sh.half ?? 2.0, a = (sh.line ?? 30) * D2R, sx = who === "A" ? -1 : 1;
  return [sx * d * Math.cos(a), -sx * d * Math.sin(a)]; };

const ANGRY = { angry: 0.85 }, SHOUT = { angry: 1, aa: 0.75 }, SHOCK = { Surprised: 1, aa: 0.35 }, SCARED = { Surprised: 0.8, sad: 0.5, aa: 0.5 }, SMIRK = { angry: 0.45, happy: 0.35 };

// the shots. Per fighter: the take, its rate, the moment it is turned to face the other (ref) by "strike" (the limb's
// line), "body" (the hips), "away" (the hips turned from him: running away) or "travel"; slide: { at, dur, d } (story
// seconds into the shot, metres straight away from the other fighter). fire: as v1, plus
//   into: "palm:R" | "ball": the stream is aimed at the other fighter's palm (or the ball between his palms) on every
//        frame and ends there (he takes it in his hands);
//   exit: true: the stream leaves along the source's own sweep (a redirect: the fire follows the hand round);
//   limb "LR": the point between both palms (a ball held in two hands).
const SHOTS = [
  // 1. frame 0: B's lunge punch has already thrown a jet across the gap; A's raised guard takes it and he skids back
  { name: "open", line: -76, back: 1.2, lead: "B",
    B: { clip: "c135_09", from: 2.45, to: 3.2, ref: 2.6, aim: "strike", limb: "R" },
    A: { clip: "c76_04", from: 1.05, ref: 1.5, aim: "body", slide: { at: 0.12, dur: 0.5, d: 0.85 } },
    face: { B: SHOUT, A: ANGRY },
    fire: [{ who: "B", limb: "R", at: -0.3, to: 0.12, kind: "hold", speed: 1, size: 0.06, rate: 70, life: 0.28, lift: 0.4, silent: true },
      { who: "B", limb: "R", from: 2.45, to: 2.95, pre: 0.14, kind: "jet", speed: 15, drag: 1.4, dur: 0.3, size: 0.13, life: 0.55, grow: 1.5, at: "opp", splash: 0.2 }],
    cam: { az: 0, el: 4, fov: 46 } },
  // 2. extreme close-up: A's eyes over his smoking guard
  { name: "glareA", focus: "A", line: -78, lead: "A", len: 0.38,
    A: { clip: "c76_04", from: 2.0, to: 2.4, rate: 0.8, ref: 2.1, aim: "body" },
    B: { clip: "c135_09", from: 3.15, ref: 3.2, aim: "body" },
    face: { A: ANGRY },
    cam: { close: "A", az: -8, fov: 16 } },
  // 3. A answers: a fast roundhouse throws a crescent of fire across the gap; B's knife-hand block takes it, skidding
  { name: "crescent", line: 65, back: 1.2, lead: "A",
    A: { clip: "c135_07", from: 0.5, to: 1.55, rate: 1.4, ref: 0.95, aim: "strike", limb: "RF" },
    B: { clip: "c135_10", from: 4.75, ref: 5.1, aim: "body", slide: { at: 0.55, dur: 0.45, d: 0.6 } },
    face: { A: SHOUT, B: ANGRY },
    fire: [{ who: "A", limb: "RF", from: 0.75, to: 1.15, kind: "arc", speed: 22, drag: 1.4, at: "opp", splash: 0.2, size: 0.15, grow: 1.4, rate: 260, life: 0.55, minY: 0.75 }],
    cam: { az: 0, el: 4, fov: 46 } },
  // 4. close-up: B sinks into his stance and both his fists catch fire (the power-up)
  { name: "chargeB", focus: "B", line: 84, lead: "B",
    B: { clip: "c135_11", from: 0.3, to: 0.95, ref: 0.6, aim: "body" },
    A: { clip: "c135_07", from: 1.55, ref: 1.6, aim: "body" },
    face: { B: SHOUT },
    fire: [{ who: "B", limb: "L", at: 0.08, to: 0.65, kind: "hold", speed: 1, size: 0.045, rate: 90, life: 0.3, lift: 0.4 },
      { who: "B", limb: "R", at: 0.14, to: 0.65, kind: "hold", speed: 1, size: 0.045, rate: 90, life: 0.3, lift: 0.4 }],
    lines: true,
    cam: { close: "B", az: 0, fov: 24, fit: 1.1, hands: true } },
  // 5-6. B's side kick pours a jet at A; A meets it with his palm and turns his waist (tai chi "roll back"): the
  // stream follows the hand round and flies off over his shoulder into the sky
  { name: "kickB", line: -65, back: 1.0, lead: "B",
    B: { clip: "c135_11", from: 1.25, to: 2.25, rate: 1.3, ref: 1.9, aim: "strike", limb: "RF" },
    A: { clip: "c12_04", from: 0.6, rate: 2.6, ref: 1.4, aim: "body" },
    face: { B: SHOUT, A: ANGRY },
    fire: [{ who: "B", limb: "RF", from: 1.65, to: 2.25, kind: "jet", speed: 15, drag: 1.4, size: 0.12, dur: 0.6, life: 0.5, grow: 1.3, into: "palm:R", splash: 0.02, peak: "hold" }],
    cam: { az: 0, el: 4, fov: 46 } },
  { name: "redirect", open: ["A"], focus: "A", line: -15, back: 0.6, lead: "A",
    A: { clip: "c12_04", from: 1.7, to: 3.9, rate: 2.6, ref: 1.7, aim: "body", slide: { at: 0.02, dur: 0.3, d: 0.25 } },
    B: { clip: "c135_11", from: 2.25, rate: 0.35, ref: 2.25, aim: "strike", limb: "RF" },
    face: { A: ANGRY, B: ANGRY },
    fire: [{ who: "B", limb: "RF", at: 0, to: 0.55, pre: 0.26, kind: "jet", speed: 15, drag: 1.4, size: 0.12, life: 0.5, grow: 1.3, into: "palm:R", splash: 0.02, taper: 0.15, cont: true },
      { who: "A", limb: "R", at: 0.02, to: 0.75, kind: "jet", speed: 11, drag: 1.2, size: 0.12, life: 0.75, grow: 1.8, exit: true, taper: 0.2 }],
    cam: { on: "A", az: 0, el: 4, fov: 34, fit: 1.25 } },
  // 7. B can't believe it: eyes wide (dun-dun)
  { name: "shockB", focus: "B", line: 84, lead: "B", len: 0.6,
    B: { clip: "c135_11", from: 2.3, to: 2.6, rate: 0.5, ref: 2.4, aim: "body" },
    A: { clip: "c12_04", from: 4.4, ref: 4.5, aim: "body" },
    face: { B: SHOCK },
    cam: { close: "B", az: 0, fov: 15, fit: 1.3 } },
  // 8. B goes all in: a roar and his biggest blast, both streams of fire pouring from the punch
  { name: "allin", line: -65, back: 1.4, lead: "B",
    B: { clip: "c135_09", from: 6.15, to: 7.0, ref: 6.7, aim: "strike", limb: "R" },
    A: { clip: "c12_04", from: 12.3, rate: 2.2, ref: 12.6, aim: "body" },
    face: { B: SHOUT, A: ANGRY },
    fire: [{ who: "B", limb: "R", from: 6.15, to: 7.0, kind: "jet", speed: 15, drag: 1.3, size: 0.24, grow: 1.7, rate: 320, dur: 0.6, spread: 0.17, life: 0.55, into: "ball", splash: 0.02, peak: "hold" }],
    lines: true,
    cam: { az: 0, el: 4, fov: 46 } },
  // 9. A catches it: the stream winds into a ball of fire between his palms that grows as he turns with it
  { name: "catch", open: ["A"], focus: "A", line: -30, back: 0.4, lead: "A",
    A: { clip: "c12_04", from: 12.6, to: 15.0, rate: 2.2, ref: 12.8, aim: "body", slide: { at: 0.02, dur: 0.35, d: 0.3 } },
    B: { clip: "c135_09", from: 7.0, rate: 0.4, ref: 7.0, aim: "strike", limb: "R" },
    face: { A: ANGRY, B: SHOUT },
    fire: [{ who: "B", limb: "R", at: 0, to: 0.45, pre: 0.24, cont: true, kind: "jet", speed: 15, drag: 1.3, size: 0.2, grow: 1.4, rate: 300, life: 0.55, spread: 0.15, into: "ball", splash: 0.02, taper: 0.2 },
      { who: "A", limb: "LR", at: 0.04, to: 1.09, kind: "burst", speed: 0.5, size: 0.06, sizeTo: 0.2, grow: 0.9, rate: 260, life: 0.25, drag: 4, lift: 0.3 }],
    cam: { on: "A", az: 0, el: 4, fov: 30, fit: 1.35 } },
  // 10. and punches it back, twice the size: impact frame, flash, hit-stop as it lands on B's guard
  { name: "return", focus: "A", line: -30, back: 0.4, lead: "A", len: 0.47,
    A: { clip: "c135_09", from: 6.2, to: 7.0, ref: 6.7, aim: "strike", limb: "R" },
    B: { clip: "c135_10", from: 3.4, ref: 3.6, aim: "body" },
    face: { A: SHOUT, B: SHOCK },
    fire: [{ who: "A", limb: "R", at: 0, to: 0.12, kind: "burst", speed: 0.5, size: 0.2, grow: 0.9, rate: 260, life: 0.22, drag: 4, lift: 0.3, silent: true },
      { who: "A", limb: "R", from: 6.4, to: 7.0, kind: "jet", speed: 17, drag: 1.3, size: 0.19, grow: 1.8, rate: 300, dur: 0.4, spread: 0.15, life: 0.6, at: "opp", splash: 0.45 }],
    lines: true,
    cam: { on: "A", az: 0, el: 4, fov: 24, fit: 1.0 } },
  // 11. B's guard is blown back the longest skid of the fight; his fists smoke out
  { name: "blown", focus: "B", line: 55, back: 0.4, lead: "B", len: 0.78,
    B: { clip: "c76_04", from: 1.3, rate: 0.7, ref: 1.5, aim: "body", slide: { at: 0.0, dur: 0.65, d: 1.5 } },
    A: { clip: "c135_09", from: 6.95, rate: 0.4, ref: 6.95, aim: "strike", limb: "R" },
    fire: [{ who: "A", limb: "R", at: 0, to: 0.22, pre: 0.3, cont: true, kind: "jet", speed: 17, drag: 1.3, size: 0.19, grow: 1.8, rate: 300, spread: 0.15, into: "chest", splash: 0.15, taper: 0.12, brk: true }],
    face: { B: SHOCK, A: ANGRY },
    cam: { on: "B", az: 0, el: 4, fov: 36, fit: 1.25 } },
  // 12. close: he looks at the gap, throws both hands up: he gives up
  { name: "giveup", open: ["B"], focus: "B", line: 78, lead: "B",
    B: { clip: "c143_25", from: 0.56, to: 0.71, rate: 0.22, ref: 0.6, aim: "body" },
    A: { clip: "c135_09", from: 7.4, ref: 7.5, aim: "body" },
    face: { B: SCARED },
    cam: { close: "B", az: 4, fov: 24, fit: 1.0, hands: true } },
  // 13. and runs for it, away into the valley
  { name: "flee", open: ["B"], line: 66, len: 1.05, back: 1.0, lead: "B",
    B: { clip: "c143_03", from: 1.2, to: 1.98, rate: 1.25, ref: 1.6, aim: "away", run: [0.12, -1] },
    A: { clip: "c135_09", from: 7.5, rate: 0.6, ref: 7.6, aim: "body" },
    then: { B: { clip: "c16_35", from: 0.1, rate: 1.25 } },
    face: { B: SCARED, A: SMIRK },
    cam: { on: "B", az: 0, el: 4, fov: 40, fit: 1.1 } },
];

// one take as a perform segment, turned and placed so that at clip second `ref` it faces `to` from `at`
const lineOf = (W, limb) => {
  const side = limb[0].toLowerCase();
  const end = limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, base = limb.length === 1 ? W[`${side}humerus`].start : W[`${side}femur`].start;
  return end.clone().sub(base);
};
const bodyFwd = (W) => new THREE.Vector3(0, 0, 1).applyQuaternion(W.root.q);
function segFor(P, at, to, t0) {
  load(P.clip); const rate = P.rate ?? 1;
  const base = { at: R(t0), clip: P.clip, from: P.from, to: P.to, speed: rate, blend: 0 };
  const probe = new Performance([{ ...base, at: 0, heading: 0, place: [0, 0] }], clips, [], LEG);
  const tl = (P.ref - P.from) / rate, W = worldPose(probe.at(tl));
  let f = P.aim === "strike" ? lineOf(W, P.limb) : P.aim === "travel" ? probe.at(tl).pos.clone().sub(probe.at(0).pos) : bodyFwd(W); f.y = 0;
  if (P.aim === "away") f.negate();
  // (run: the way he runs off, world x and z, instead of straight away from the other fighter: into the valley, so
  // the camera that can only pan 10 degrees keeps him)
  const want = P.run ? Math.atan2(-P.run[0], -P.run[1]) : Math.atan2(to[0] - at[0], to[1] - at[1]), have = Math.atan2(f.x, f.z);
  const heading = R((want - have) / D2R, 2);
  const turned = new Performance([{ ...base, at: 0, heading, place: [0, 0] }], clips, [], LEG);
  const r = turned.at(tl).pos;
  const seg = { ...base, heading, place: [R(at[0] - r.x, 4), R(at[1] - r.z, 4)] };
  // the skid: straight away from the other fighter
  if (P.slide) { const away = new THREE.Vector2(at[0] - to[0], at[1] - to[1]).normalize(), u0 = P.from + P.slide.at * rate;
    seg.slide = [R(u0, 4), R(u0 + P.slide.dur * rate, 4), R(away.x * P.slide.d, 4), R(away.y * P.slide.d, 4)]; }
  return seg;
}

// the timeline: a shot lasts its lead's take (or `len`); the other fighter's take runs as long
const list = { A: [], B: [] };
let t = 0;
for (const sh of SHOTS) {
  const lead = sh[sh.lead], len = R(sh.len ?? (lead.to - lead.from) / (lead.rate ?? 1));
  for (const who of ["A", "B"]) {
    const P = sh[who]; P.to ??= R(P.from + len * (P.rate ?? 1), 3);
    const me = spotOf(sh, who), opp = spotOf(sh, who === "A" ? "B" : "A");
    list[who].push(segFor(P, me, opp, t));
  }
  sh.t0 = t; sh.t1 = R(t + len); sh.len = len; t = sh.t1;
}
// a follow-on take (the run after the start-to-run) blends on from where the first leaves off, keeping its heading
for (const [i, sh] of SHOTS.entries()) if (sh.then) for (const who of Object.keys(sh.then)) {
  const T2 = sh.then[who]; load(T2.clip); const segs = list[who], k = segs.findIndex((g) => g.at === R(sh.t0));
  const first = segs[k], dur1 = (first.to - first.from) / (first.speed ?? 1), at = R(sh.t0 + dur1);
  if (at < sh.t1 - 0.05) {
    segs.splice(k + 1, 0, { at, clip: T2.clip, from: T2.from, to: R(T2.from + (sh.t1 - at) * (T2.rate ?? 1), 3), speed: T2.rate ?? 1, blend: 0.18, _then: true });
  }
}
const END = R(t);
// each shot centred on the camera's line (x = 0) and pushed back by `back`; a close-up centres its one fighter
{ const P0 = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
  SHOTS.forEach((sh) => {
    const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
    for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) for (const who of sh.focus ? [sh.focus] : ["A", "B"]) { const p = P0[who].at(s2).pos; lo[0] = Math.min(lo[0], p.x); hi[0] = Math.max(hi[0], p.x); lo[1] = Math.min(lo[1], p.z); hi[1] = Math.max(hi[1], p.z); }
    const dx = -(lo[0] + hi[0]) / 2, dz = -(lo[1] + hi[1]) / 2 - (sh.back ?? (sh.focus ? -1.2 : 0.8));
    for (const who of ["A", "B"]) for (const g of list[who]) if (g.at >= sh.t0 - 1e-6 && g.at < sh.t1 - 1e-6) {
      if (g._then) continue;   // (a follow-on blends from where the first take is: it has no place of its own)
      g.place = [R(g.place[0] + dx, 4), R(g.place[1] + dz, 4)];
    }
  }); }
for (const w of ["A", "B"]) for (const g of list[w]) delete g._then;
const perf = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
const poseAt = (who, s) => worldPose(perf[who].at(Math.min(s, END - 1e-4)));
const T = (sh, who, u) => R(sh.t0 + (u - sh[who].from) / (sh[who].rate ?? 1), 4);

// measured palms and feet (per fighter), else the recording's
const MEAS = {};
for (const w of ["A", "B"]) { const f = `${OUT}/${ID}.src.${w}.json`; MEAS[w] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; }
const near = (arr, s) => { if (!arr?.length) return null; let i = arr.findIndex((q) => q.t >= s); if (i <= 0) return arr[Math.max(0, i)]; const a = arr[i - 1], b = arr[i], k = (s - a.t) / Math.max(1e-6, b.t - a.t); return { t: s, p: a.p.map((v, j) => v + (b.p[j] - v) * k) }; };
const palmAt = (who, side, s) => { const m = near(MEAS[who]?.[side.toUpperCase()], s); return m ? new THREE.Vector3(...m.p) : palmWorld(poseAt(who, s), side); };
const ballAt = (who, s) => palmAt(who, "l", s).add(palmAt(who, "r", s)).multiplyScalar(0.5);
const chest = (who, s) => { const W = poseAt(who, s); return W.thorax ? W.thorax.end.clone() : W.root.start.clone().add(new THREE.Vector3(0, 0.35, 0)); };
function source(who, limb, s) {
  const W = poseAt(who, s);
  let p, d;
  if (limb === "LR") { p = ballAt(who, s); d = bodyFwd(W).setY(0).normalize(); }
  else if (limb.length === 1) { const side = limb.toLowerCase(), palm = palmWorld(W, side), el = W[`${side}radius`].start; d = palm.clone().sub(el).normalize(); p = palmAt(who, side, s).addScaledVector(d, 0.05); }
  else { const side = limb[0].toLowerCase(), ball = W[`${side}foot`].end, hip = W[`${side}femur`].start; d = ball.clone().sub(hip).normalize(); p = ball.clone();
    const m = near(MEAS[who]?.[limb], s); if (m) p = new THREE.Vector3(...m.p); }
  return [R(s, 4), R(p.x), R(p.y), R(p.z), R(d.x), R(d.y), R(d.z)];
}
const reachOf = (who, limb, s) => { const W = poseAt(who, s), l = lineOf(W, limb), side = limb[0].toLowerCase();
  return { d: l.length(), end: limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, line: l }; };
const target = (who, spec, s) => spec === "ball" ? ballAt(who, s) : spec === "chest" ? chest(who, s) : palmAt(who, spec.split(":")[1].toLowerCase(), s);

const blasts = [], marks = { brk: null, silent: new Set(), arrive: [] };
for (const sh of SHOTS) for (const f of sh.fire || []) {
  const { who, limb, from, to, dur, minY, level, at: _a, peak, brk, silent, into, exit, cont, cutAt, pre, ...rest } = f;
  const opp = who === "A" ? "B" : "A", timed = f.kind === "hold" || f.kind === "burst" || cont || exit;
  let a, b, line = null;
  // (timed: at and to are story seconds into the shot; else from and to are the take's seconds the limb may pour in,
  // and the fire is born at 90 % of its fullest stretch there)
  if (timed) { a = R(Math.max(0, sh.t0 + _a) - (pre ?? 0), 4); b = R(Math.min(sh.t1, sh.t0 + to), 4); }
  else {
    const w0 = T(sh, who, from), w1 = T(sh, who, to); let pk = w0, pd = 0;
    for (let s2 = w0; s2 <= w1; s2 += 1 / 120) { const r = reachOf(who, limb, s2); if (r.d > pd && (minY == null || r.end.y >= minY)) { pd = r.d; pk = s2; } }
    a = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).d < 0.9 * pd) break; a = s2; }
    if (f.kind === "arc") { a = pk; b = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; a = s2; } for (let s2 = pk; s2 <= w1; s2 += 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; b = s2; } }
    else {
      // (peak "hold": a held strike keeps pouring for all of dur, it doesn't stop as the limb comes back)
      b = Math.min(w1, sh.t1, a + (dur ?? 0.22)); if (peak !== "hold") for (let s2 = pk; s2 <= b; s2 += 1 / 120) if (reachOf(who, limb, s2).d < 0.7 * pd) { b = s2; break; }
      if (f.kind === "jet") { line = reachOf(who, limb, pk).line; if (level != null) line.y *= level; line.normalize(); }
    }
    a = R(a - (pre ?? 0), 4); b = R(b, 4);
  }
  const aimAt = into ?? null;
  const src = [];
  let prev = null;
  for (let s2 = a; s2 <= b + 1e-6; s2 += 1 / 60) {
    const sp = pre ? Math.max(s2, sh.t0 + 1e-4) : s2, q = source(who, limb, sp); q[0] = R(s2, 4);
    if (aimAt) { const tp = target(opp, aimAt, Math.max(sp, s2 + 0.12)), dv = tp.sub(new THREE.Vector3(q[1], q[2], q[3])).normalize(); q.splice(4, 3, R(dv.x), R(dv.y), R(dv.z)); }
    else if (exit) {
      // the redirect: the fire leaves along the hand's own sweep (its velocity over the next 0.1 s), lifted a little
      const p1 = source(who, limb, s2 + 0.1), v = new THREE.Vector3(p1[1] - q[1], p1[2] - q[2], p1[3] - q[3]);
      if (v.length() < 0.02) v.copy(prev ?? new THREE.Vector3(0, 1, 0)); v.normalize(); v.y += 0.35; v.normalize(); prev = v.clone();
      q.splice(4, 3, R(v.x), R(v.y), R(v.z));
    }
    else if (line) q.splice(4, 3, R(line.x), R(line.y), R(line.z));
    else if (f.kind === "arc" && _a === "opp") { const dv = chest(opp, s2 + 0.3).sub(new THREE.Vector3(q[1], q[2], q[3])).normalize(); q.splice(4, 3, R(dv.x), R(dv.y), R(dv.z)); }
    if (minY == null || q[2] >= minY * 0.9) src.push(q);
  }
  if (!src.length) { console.warn("no fire for", sh.name, who, limb); continue; }
  // reach: ends on the other fighter's guard ("opp"), or in his hands (to: palm or ball)
  let reach;
  const sm = (a + b) / 2, qm = source(who, limb, sm), pm = new THREE.Vector3(qm[1], qm[2], qm[3]);
  if (_a === "opp") reach = Math.max(0.2, pm.distanceTo(chest(opp, sm)) - 0.3);
  if (aimAt) reach = Math.max(0.2, pm.distanceTo(target(opp, aimAt, sm)) - (aimAt === "chest" ? 0.3 : 0.04));
  // (the flames' life fitted to the arrival: a caught stream dies in the palm; a blocked one splashes for a moment.
  // Flames that outlive the arrival pile up at the reach and swell into big red shards over the guard)
  if (reach != null) { const v = (rest.speed ?? 7) * (f.kind === "arc" ? 0.5 : 1), k = rest.drag ?? 3, x = Math.min(0.95, reach * k / v), ta = -Math.log(1 - x) / k;
    rest.life = R(Math.max(0.12, ta * (into && into !== "chest" ? 0.95 : 1.1)), 3); }
  if (pre) rest.show = R(Math.max(0, sh.t0), 4);
  blasts.push({ at: src[0][0], end: src[src.length - 1][0], cut: R(cutAt ?? sh.t1, 4), src, ...(reach != null ? { reach: R(reach) } : {}), ...rest });
  // (when the stream arrives at the far end: speed with drag, travel = v (1 - e^-kt) / k)
  if (reach != null) { const v = (rest.speed ?? 7) * (f.kind === "arc" ? 0.5 : 1), k = rest.drag ?? 3, x = reach * k / v; marks.arrive.push({ sh: sh.name, who, at: R(src[0][0] + (x < 1 ? -Math.log(1 - x) / k : 0.3), 3), B: blasts.at(-1) }); }
  if (silent) marks.silent.add(blasts.at(-1));
  if (brk) marks.brk = blasts.at(-1);
}
// the return blast lands on B's guard: a burst on his guard
{ const sh = SHOTS.find((s) => s.name === "return"), ar = marks.arrive.find((m) => m.B === marks.brk);
  if (ar) { ar.at = R(Math.ceil(SHOTS.find((x) => x.name === "blown").t0 * FPS - 1e-6) / FPS, 4);   // (on the cut to B's guard: its first frame)
    const c = chest("B", ar.at).add(new THREE.Vector3(0, 0.05, 0));
    blasts.push({ at: ar.at, end: R(ar.at + 0.2, 4), cut: R(SHOTS.find((s) => s.name === "blown").t1, 4), kind: "burst", speed: 3.5, size: 0.12, rate: 220, life: 0.25, drag: 3, lift: 1.2,
      src: [[ar.at, R(c.x), R(c.y), R(c.z), 0, 0, 1], [R(ar.at + 0.2, 4), R(c.x), R(c.y), R(c.z), 0, 0, 1]] });
    marks.hit = ar.at; } }

// the cameras: still, one per shot. A wide holds both fighters all shot long; a close-up ("close": who) holds that
// fighter's head and shoulders (and his hands when "hands"), through a long lens from further off, the way the
// painting allows (pan and tilt about 10 degrees, camera z <= 4.7)
const beats = SHOTS.map((sh) => {
  const c = sh.cam, pts = [], up = new THREE.Vector3(0, 1, 0);
  for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) for (const who of c.close ? [c.close] : c.on ? [c.on, ...(c.with ? [c.with] : [])] : ["A", "B"]) {
    const W = poseAt(who, s2);
    if (c.close) { pts.push(W.head.end.clone().addScaledVector(up, 0.1), W.thorax.end.clone().addScaledVector(up, -0.12), W.lclavicle.end.clone(), W.rclavicle.end.clone());
      if (c.hands) pts.push(palmWorld(W, "l"), palmWorld(W, "r")); }
    else if (who === c.with) pts.push(W.head.end.clone().addScaledVector(up, 0.1), palmWorld(W, "r"));
    else pts.push(W.head.end.clone().addScaledVector(up, 0.12), palmWorld(W, "l"), palmWorld(W, "r"), W.root.start.clone(), W.lfoot.end.clone(), W.rfoot.end.clone());
  }
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().multiplyScalar(-1);
  for (const p of pts) { lo.min(p); hi.max(p); }
  const ctr = lo.clone().add(hi).multiplyScalar(0.5), az = (c.az ?? 0) * D2R, el = (c.el ?? 4) * D2R;
  const back = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const fw = back.clone().negate(), rt = fw.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), upv = rt.clone().cross(fw);
  const tv = Math.tan(c.fov * Math.PI / 360), th = tv * 9 / 16, fit = c.fit ?? 1.08;
  let D = 1.2;
  for (const p of pts) { const v = p.clone().sub(ctr), x = Math.abs(v.dot(rt)), y = Math.abs(v.dot(upv)), z = v.dot(back); D = Math.max(D, z + (x * fit) / th, z + (y * fit) / tv); }
  D = Math.min(D, (4.7 - ctr.z) / Math.max(0.2, back.z));
  const pos = ctr.clone().addScaledVector(back, D); pos.x = Math.max(-0.45, Math.min(0.45, pos.x)); pos.y = c.y ?? (c.close ? ctr.y - 0.1 : 0.8);
  const cam = new THREE.PerspectiveCamera(c.fov, 9 / 16, 0.05, 100), look = ctr.clone();
  let fov = c.fov;
  for (let k = 0; k < 4; k++) {
    cam.fov = fov; cam.position.copy(pos); cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const m = Math.max((x1 - x0) / 2, (y1 - y0) / 2) * fit, dz = look.clone().project(cam).z;
    look.copy(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, dz).unproject(cam));
    { const v = look.clone().sub(pos), h = Math.hypot(v.x, v.z), yaw = Math.atan2(v.x, -v.z), pit = Math.atan2(v.y, h);
      const y2 = Math.max(-8.5 * D2R, Math.min(8.5 * D2R, yaw)), p2 = Math.max(-6 * D2R, Math.min(6 * D2R, pit)), L = v.length();
      look.copy(pos).add(new THREE.Vector3(Math.sin(y2) * Math.cos(p2), Math.sin(p2), -Math.cos(y2) * Math.cos(p2)).multiplyScalar(L)); }
    fov = Math.max(c.fov * 0.85, Math.min(c.fov, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * m) * 180 / Math.PI));
  }
  return { name: sh.name, at: R(sh.t0), len: R(sh.len), kind: sh.name === "blown" ? "payoff" : undefined,
    shot: { pos: [R(pos.x), R(pos.y), R(pos.z)], look: [R(look.x), R(look.y), R(look.z)], fov: R(fov, 1) }, do: [] };
});

// sound and effects
const shotAt = (s) => beats.find((b) => s >= b.at - 1e-6 && s < b.at + b.len) ?? beats[beats.length - 1];
const put = (s, item) => { const b = shotAt(s); b.do.push({ ...(item.sfx && !item.reason ? { reason: "the fire is born on this frame" } : {}), ...item, at: R(Math.max(0, s - b.at)) }); };
const fx = [], hitStop = [], fr = (s) => R(Math.round(s * FPS) / FPS);
for (const B of blasts) {
  if (marks.silent.has(B)) continue;
  const b = shotAt(B.at);
  if (B.kind === "hold") { put(B.at, { sfx: "ai/ignite", gain: 0.9, reason: "his fists catch fire" }); continue; }
  if (B.kind === "burst") continue;
  if (B.kind === "arc") { put(B.at - 0.12, { sfx: "whoosh", dur: 0.4, gain: 0.85, reason: "the kicking leg swings through" }); put(B.at, { sfx: "ai/flare", gain: 0.9 }); continue; }
  put(B.at - 0.02, { sfx: "flamejet", gain: b.name === "allin" || b.name === "return" ? 1.0 : 0.75 });
}
// a skid: the guard is driven back over the dirt (a gritty rumble the length of the slide) and dust kicks up off both
// feet along it
for (const sh of SHOTS) for (const who of ["A", "B"]) {
  const P = sh[who]; if (!P.slide) continue;
  const s0 = sh.t0 + P.slide.at, s1 = s0 + P.slide.dur;
  put(s0, { sfx: "tyres", dur: R(P.slide.dur), gain: 0.35 + 0.15 * Math.min(1, P.slide.d), reason: `${who}'s feet skid back over the dirt` });
  for (let k = 0; k < 3; k++) { const s2 = s0 + (s1 - s0) * k / 3, W = poseAt(who, s2);
    for (const side of ["l", "r"]) { const f = W[`${side}foot`].end; fx.push({ do: "poof", at: R(s2, 3), pos: [R(f.x), 0.02, R(f.z)], dur: 0.5, color: "#d8c2a2", puffs: 6, sparks: 0, size: 0.18 + 0.08 * Math.min(1.5, P.slide.d), lift: 0.05, sound: false }); } }
}
// each arrival on a guard: a small shake (the big ones get their own)
for (const m of marks.arrive) if (m.B !== marks.brk && m.sh !== "redirect" && m.sh !== "catch") put(m.at, { fx: "shake", dur: 0.18, amp: 0.022 });
// power-up close-ups: speed lines rushing in on the face
for (const sh of SHOTS) if (sh.lines) { const b = beats.find((x) => x.name === sh.name); fx.push({ do: "speedlines", at: R(b.at), dur: R(b.len), alpha: 0.55, count: 90, inner: 520, color: "#2a160f" }); }
// the shock close-up: dun-dun
{ const b = beats.find((x) => x.name === "shockB"); put(b.at, { sfx: "ai/dundun", gain: 0.8, reason: "B's eyes go wide: his fire was thrown away" }); }
// the breath before the roar, and the catch: a slow airy swell as the ball grows
{ const b = beats.find((x) => x.name === "chargeB"); put(b.at + 0.02, { sfx: "gasp", gain: 0.8, reason: "he breathes in as he sinks into the stance" }); }
{ const b = beats.find((x) => x.name === "catch"); put(b.at + 0.12, { sfx: "sizzle", dur: R(b.len - 0.15), gain: 1.5, reason: "the fireball hisses between his palms" }); put(b.at + 0.1, { sfx: "rumble", dur: R(b.len + 0.2), gain: 0.85, reason: "the ball swells" }); }
// the payoff: the returned blast lands on B's guard: a 2-frame flash, hard shake, 3-frame hit-stop, a boom
{ const h = fr(marks.hit);
  { const bw = beats.find((x) => x.name === "blown"); bw.do.push({ fx: "flash", at: 0, dur: R(h - bw.at + 0.07), peak: 0.35, sound: false }); }
  put(h, { fx: "shake", dur: 0.4, amp: 0.05 });
  put(h, { sfx: "impact", gain: 1.0, reason: "the returned fireball slams into B's guard" });
  put(h, { sfx: "kenney/impact-punch-heavy", gain: 0.7, reason: "the hit's punch on a phone speaker" });
  put(h, { sfx: "firework", gain: 0.95, reason: "the fireball bursts on his guard: the crack a phone speaker plays" });
  hitStop.push({ at: h, frames: 3 }); }
// the give-up: a small smoke puff off each of B's fists as the fire goes out; then he flees
{ const b = beats.find((x) => x.name === "blown"), s2 = b.at + 0.55, W = poseAt("B", s2);
  for (const side of ["l", "r"]) { const p = palmWorld(W, side); fx.push({ do: "poof", at: R(s2, 3), pos: [R(p.x), R(p.y), R(p.z)], dur: 0.8, color: "#6b625c", puffs: 5, sparks: 0, size: 0.18, lift: 0.25, sound: false }); }
  put(s2, { sfx: "sizzle", dur: 0.5, gain: 0.7, reason: "his fists' fire goes out in smoke" });
  const g = beats.find((x) => x.name === "giveup"); put(g.at + 0.15, { sfx: "gasp", gain: 0.9, reason: "he throws his hands up" });
  const fl = beats.find((x) => x.name === "flee"); put(fl.at + 0.05, { sfx: "whoosh", dur: 0.35, gain: 0.5, reason: "he spins round and bolts" }); }

// faces: each shot's face per fighter, keyed at its start (eased in over 0.2 s)
const faces = { A: [], B: [] };
for (const sh of SHOTS) for (const who of ["A", "B"]) if (sh.face?.[who]) faces[who].push([R(sh.t0), sh.face[who]]);

// fingers: fists to fight, open palms to turn and catch fire (tai chi) and to give up
const hands = { A: [[0, 0.95, 0.95]], B: [[0, 0.95, 0.95]] };
for (const who of ["A", "B"]) {
  const spans = []; for (const sh of SHOTS) if (sh.open?.includes(who)) { const l = spans.at(-1); if (l && Math.abs(l[1] - sh.t0) < 1e-6) l[1] = sh.t1; else spans.push([sh.t0, sh.t1]); }
  for (const [a, b] of spans) hands[who].push([R(a - 0.12), 0.95, 0.95], [R(a + 0.05), 0.2, 0.2], ...(b < END - 0.01 ? [[R(b - 0.05), 0.2, 0.2], [R(b + 0.1), 0.95, 0.95]] : []));
}
const cast = (id, who, look) => ({ id, character: look, at: list[who][0].place, face: ANGRY, faces: faces[who], seed: who === "A" ? 1.3 : 2.1, perform: list[who],
  fingers: hands[who], diagPalms: process.env.DIAG === who, diagFeet: process.env.DIAG === who });
const vis = beats.map((b) => { const sh = SHOTS.find((s) => s.name === b.name); const see = sh.cam.close ? [`${sh.cam.close.toLowerCase()}.face`] : sh.cam.on ? [sh.cam.on.toLowerCase()] : ["a", "b"];
  return { from: R(b.at + 0.08), to: R(b.at + b.len - 0.04), see, why: sh.cam.close ? `the close-up on ${sh.cam.close}'s face` : sh.cam.on ? `${sh.cam.on} in the ${b.name} shot` : `both fighters in the ${b.name} shot` }; });
const sb = {
  id: ID,
  title: "Fire duel 2",
  idea: "Two anime firebenders fight at range in a volcano valley at sunset: blasts skid each other's guards back, one turns a stream away into the sky, catches the other's biggest blast in his hands and throws it back, and the loser throws his hands up and runs",
  fps: FPS, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  // (the whole frame sharp, Jonny 4 Nov; a skid starting on a cut smeared one frame into a pop)
  motionBlur: false,
  set: { type: "env", env: "fern-valley-campfire", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  music: { file: "ai/epic/epic-02.ogg", lowCut: 150, gain: 0.4 },
  sound: { sfx: 0.6, ambience: 0.34, surface: "dirt", room: "open", guard: true },
  creative: { notes: false },
  cast: [cast("a", "A", "human/vrm-test-01"), cast("b", "B", "human/vrm-test-02")],
  props: [{ id: "fire", kind: "firebend", x: 0, y: 0, z: 0, rot: 0, blasts, light: 18, staged: "fire: light, it rests on nothing" }],
  beats,
  fx,
  hitStop,
  visible: vis,
  // the skids are meant: the feet ride the body back over the dirt
  allowClip: SHOTS.flatMap((sh) => ["A", "B"].filter((w) => sh[w].slide).map((w) => ({ who: [w === "A" ? "a" : "b"], from: R(sh.t0 + sh[w].slide.at), to: R(sh.t0 + sh[w].slide.at + sh[w].slide.dur + 0.1), checks: ["foot-slide"], reason: "the guard is blasted back and skids over the dirt on planted feet (anime defence: the slide shows the hit's force)" }))),
  captions: [],
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217).",
  notes: "Generated by tools/human/make-fight-02.mjs.",
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/${ID}.json`, JSON.stringify(sb, null, 1));
console.log("END", END, SHOTS.map((s) => `${s.name} ${R(s.t0, 2)}`).join("  "), "blasts", blasts.length, Object.values(MEAS).some(Boolean) ? "(measured)" : "(recorded)");
console.log("arrive", marks.arrive.map((m) => `${m.sh}:${m.who}@${m.at}`).join(" "), "hit", marks.hit);
