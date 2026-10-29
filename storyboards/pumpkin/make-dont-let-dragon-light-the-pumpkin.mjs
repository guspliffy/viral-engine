// DON'T LET DRAGON LIGHT THE PUMPKIN (eight trend tests #06, 29 Oct 2026), built from the clip template.
// node storyboards/pumpkin/make-dont-let-dragon-light-the-pumpkin.mjs -> storyboards/pumpkin/dont-let-dragon-light-the-pumpkin.json
//
// THE BRIEF (06-dont-look-back/ENGINE-PROMPT.md: wordless, slow-motion run from a pumpkin-helmet sneeze), cut 2 after
// Jonny's notes on cut 1 (29 Oct 16:56, 16:58): "about 10-11 sec", "let the dragon actually chase reaper and phoenix
// rather than just standing still", "more action", "let the dragon spit fire a couple of times ... the action should be real".
//   Joke:        Dragon wears a carved pumpkin as a helmet; when its eyes glow his friends know what's coming and run.
//                He chases them down the hall and blasts fire after them twice; they dodge the first in slow motion
//                and dive out of the door ahead of the second.
//   Consequence: they make it out onto the porch (one soot spot on Reaper's hood), Dragon bursts out after them, they
//                jump; he lifts the pumpkin off his sheepish face, they stare. Then its eyes light up again and they run.
//
//   1 0.00-0.50  close at the far end: the pumpkin's eyes light up, Dragon's cheeks puff in its grin      (fwip)
//   2 0.50-1.00  reaction close-up: Reaper's eyes widen; Phoenix turns from the pumpkin to the exit
//   3 1.00-1.60  wide from the porch: they bolt toward us, and Dragon runs after them                    (steps)
//   4 1.60-2.50  slow-motion run toward the camera, Dragon chasing behind, the glow swelling             (hero music)
//   5 2.50-3.60  slow motion: he plants, ah.. CHOO, the first blast down the middle, they split from it  (fwoomp)
//   6 3.60-4.90  normal speed: they sprint for the door, he runs, plants and blasts again; they dive out
//                of the door as the fire fills it behind them                                           (fwoomp)
//   7 4.90-6.20  on the porch, panting; Dragon charges up the hall through the smoke and out behind them; they jump
//   8 6.20-10.2  he lifts the pumpkin off his sheepish face, they stare; its eyes light up again, they run (dum, fwip)
//
// Blocking (x right, z toward the camera, y up; set-hallway.js HALLWAY): the hall runs from its far wall (z -6.0) to the
// front doorway (z 0); the porch is z 0..3.4. Every camera looks into the house from the porch side, so Phoenix stays
// on screen left, Reaper on screen right, Dragon in the middle behind them. Each blast is its own plume, set where
// Dragon stands when he plants for it: the first stops short of the runners between their lanes, the second at the door.
// Slow motion: shots 4-5 are acted slowly (one `run` per runner whose speed and footfalls drop to about a fifth);
// Dragon's chase and the first blast move at the same pace.
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { PUMPKIN } from "../../engine/page/props-pumpkin.js";

const c = clip(), { A, sfx } = c;
const END = 11.0;

// ---------------------------------------------------------------- places
const DRA0 = [0, -5.25], DRA_END = [0, 0.3];              // Dragon at the far end; at last just out of the door
const PHX0 = [-0.42, -2.8], REA0 = [0.74, -3.3];           // the two friends, Reaper a step behind
const SPLIT = 0.84;                                       // in the slow motion they split to the hall's sides
const PHX_END = [-0.86, 1.6], REA_END = [0.86, 1.4];   // wide apart: Dragon stands between and behind them      // on the porch, either side of the doormat
const HELM = [0, 0.78, -0.02];                              // the helmet's centre in Dragon's body frame (worn)
const H_DRA = 0.96, LEG = 0.14;                           // lookdev/dragon-crisp body height, potato.js LEG_H
const LANT = [0, r3(-PUMPKIN.r * PUMPKIN.squashY * Math.cos(PUMPKIN.open)), 1.1];   // on the deck, rim down (body frame)
const AT_CAM = [0, 0];

// ---------------------------------------------------------------- runs: a path from a speed profile (m/s by time)
const sm = (u) => u * u * (3 - 2 * u);
const ramp = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * ((t - t0) / (t1 - t0)); } return keys.at(-1)[1]; };
// integrate z from t0 at the given speeds, then ease into the stop at zEnd over `brake` seconds; x(t, z) says the lane
function runPath(t0, z0, zEnd, speeds, x, brake = 0.42) {
  const pts = []; let z = z0, t = t0;
  for (; z < zEnd - 0.5 && t < END; t += 0.05) { pts.push([t, z]); z += ramp(t, speeds) * 0.05; }
  const tStop = t, zStop = z;
  for (let k = 1; k <= 8; k++) { const u = k / 8; pts.push([tStop + u * brake, zStop + (zEnd - zStop) * (1 - (1 - u) * (1 - u))]); }
  return pts.map(([t, z]) => [r3(t), r3(x(t, z)), r3(z)]);
}
// footfalls per second by time: about 3.2 at a run, 0.8 in the slow motion (long planted strides)
const RATE_FRIENDS = [[0, 1.6], [0.3, 3.2], [0.55, 3.2], [0.66, 0.8], [2.55, 0.8], [2.7, 3.4], [3.6, 3.2], [4.0, 1.2]];
function run(who, pts, rate, delay = 0, { stride = 2.1, bob = 0.035 } = {}) {
  const t0 = r3(pts[0][0] + delay), rel = pts.map(([t, x, z]) => [r3(t - pts[0][0]), x, z]);
  A(t0, who, "run", { pts: rel, rate, stride, bob, dur: rel.at(-1)[0] });
  return { t0, t1: r3(t0 + rel.at(-1)[0]), rate, at: (t) => { const p = pts.find((q) => q[0] + delay >= t) || pts.at(-1); return p; } };
}
// arms pump with the footfalls (the same phase the legs use): forward and up, back and down, the other arm opposite
function pump(who, R, { FWD = { o: [0.04, 0.5, 0.26] }, BACK = { o: [0.1, 0.28, -0.14] }, rest = true, until = R.t1 } = {}) {
  const RATE = R.rate;
  const phase = (T) => { let ph = 0; for (let i = 0; i < RATE.length && T > RATE[i][0]; i++) { const a = RATE[i], b = RATE[i + 1], u = Math.min(T, b ? b[0] : T) - a[0]; ph += u * a[1] + (b ? ((b[1] - a[1]) * u * u) / (2 * (b[0] - a[0])) : 0); } return ph; };
  let k = 0;
  for (let t = R.t0; t < until - 0.1; t += 0.02) {
    const ph = phase(t - R.t0);
    if (ph >= k * 0.5) {
      const dur = Math.max(0.12, Math.min(0.55, 0.5 / (RATE.find((r, i) => !RATE[i + 1] || RATE[i + 1][0] > t - R.t0)[1]) * 1.1));
      c.arm(t, who, k % 2 ? "R" : "L", FWD, dur, "inOut"); c.arm(t, who, k % 2 ? "L" : "R", BACK, dur, "inOut");
      k++;
    }
  }
  if (rest) { c.arm(R.t1 - 0.1, who, "R", "rest", 0.35); c.arm(R.t1 - 0.1, who, "L", "rest", 0.35); }
}

// the friends: a quick start at 1.0, slow motion 1.65-3.55 (a fifth), a sprint for the door at normal speed
const FRIENDS = [[1.0, 0], [1.35, 1.6], [1.55, 1.6], [1.66, 0.35], [3.55, 0.35], [3.7, 2.7]];
// lanes: they split to the hall's sides in the slow motion (1.6-2.6, clear of the first blast), keep them out of the
// door, then ease in to their spots on the porch
const lane = (x0, xMid, xEnd, zEnd) => (t, z) => z > 0.4 ? xMid + (xEnd - xMid) * sm(Math.min(1, (z - 0.4) / (zEnd - 0.4)))
  : x0 + (xMid - x0) * sm(Math.min(1, Math.max(0, (t - 1.6) / 1.0)));
// when each friend crosses the threshold (the dive)
const crossAt = (pts, delay = 0) => r3(pts.find((q) => q[2] >= -0.35)[0] + delay);
const PP = runPath(1.0, PHX0[1], PHX_END[1], FRIENDS, lane(PHX0[0], -SPLIT, PHX_END[0], PHX_END[1]));
const RP = runPath(1.0, REA0[1], REA_END[1], FRIENDS, lane(REA0[0], SPLIT, REA_END[0], REA_END[1]));
const P = run("phx", PP, RATE_FRIENDS), R = run("rea", RP, RATE_FRIENDS, 0.06);
const DIVE_P = crossAt(PP), DIVE_R = crossAt(RP, 0.06);

// Dragon: after them at 1.12 in the same slow motion, a plant for the first blast (2.5); a run at normal speed from 3.55
// and a second plant for the blast at the door (4.15); then a charge up the hall and out onto the porch behind them
const D1 = runPath(1.12, DRA0[1], -4.2, [[1.12, 0], [1.45, 1.5], [1.6, 1.5], [1.7, 0.32], [2.3, 0.32]], () => 0, 0.8);
const Z1 = D1.at(-1)[2];
const DR1 = run("dra", D1, [[0, 1.6], [0.3, 3.2], [0.48, 3.2], [0.58, 0.8], [1.2, 0.8], [1.5, 0.4]], 0, { stride: 1.8, bob: 0.03 });
const D2 = runPath(3.42, Z1, -2.7, [[3.42, 0], [3.62, 3.0]], () => 0, 0.25);
const Z2 = D2.at(-1)[2];
const DR2 = run("dra", D2, [[0, 2.4], [0.2, 3.4]], 0, { stride: 2.0, bob: 0.035 });
const D3 = runPath(4.85, Z2, DRA_END[1], [[4.85, 0], [5.1, 2.9]], () => 0, 0.3);
const DR3 = run("dra", D3, [[0, 2.4], [0.25, 3.4]], 0, { stride: 2.0, bob: 0.035 });
const MOUTH_Y = r3(HELM[1] + PUMPKIN.mouthAt[1]), mouthZ = (z) => r3(z + PUMPKIN.mouthAt[2] + 0.02);
// the second blast reaches just out of the doorway, licking at their backs as they dive out
const LEN2 = r3(0.55 - mouthZ(Z2));

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 60, expr: "kind", follow: 0.25, seed: 1.7 },
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: -10, expr: "kind", follow: 0.25, seed: 3.3 },
  { id: "dra", character: "lookdev/dragon-crisp", at: DRA0, face: 0, expr: "focused", follow: 0, seed: 4.1, signature: false },
];
const props = [
  { id: "helmet", kind: "pumpkinhelm", wear: "dra", x: HELM[0], y: HELM[1], z: HELM[2], glow: 0 },
  { id: "plume", kind: "fireplume", x: 0, y: MOUTH_Y, z: mouthZ(Z1), length: 2.3, width: 0.8, balls: 32 },
  { id: "plume2", kind: "fireplume", x: 0, y: MOUTH_Y, z: mouthZ(Z2), length: LEN2, width: 0.8, balls: 32 },
  { id: "lantern", kind: "pumpkinhelm", x: 0, y: LANT[1], z: r3(DRA_END[1] + LANT[2]), glow: 0, scale: 0 },
  { id: "breath", kind: "breath", mouth: "dra", target: "lantern", at: [0, 0.45, -0.1] },
  { id: "soot", kind: "soot", wear: "rea", x: 0.25, y: 0.8, z: 0.3, rot: 25, tip: -22, size: 0.12, scale: 0 },
];

// ---------------------------------------------------------------- shot 1: the pumpkin lights up (0-0.5)
A(0, "dra", "wings", { to: 1, dur: 0.01 });
for (const w of ["phx", "rea"]) A(0, w, "grip", { side: "both", shape: "open", dur: 0.01 });
A(0, "dra", "expr", { expr: "focused", set: { pucker: 0.5, open: 0.05 }, dur: 0.01 });
c.prop(0.04, "helmet", { glow: 1 }, 0.25, "out");                      // the eyes light up from inside
sfx(0.03, "ai/ignite", { gain: 0.9, reason: "the pumpkin's carved eyes catch light from inside (0.04-0.3): a small fwip" });
A(0.1, "dra", "squash", { amount: -0.1, dur: 0.5 });                 // his cheeks puff, he swells with the breath
A(0.1, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.0 }, dur: 0.3 });
sfx(0.12, "gasp", { gain: 0.35, reason: "Dragon draws a breath in behind the grin (0.1-0.45)" });
c.prop(0.25, "helmet", { on: 0.25 }, 0.5);
c.cap(0, 1.6, "Never let Dragon light the pumpkin.", 250, false, { kinetic: false });

// ---------------------------------------------------------------- shot 2: they notice (0.5-1.0)
A(0, "phx", "look", { to: [0, 0.1], dur: 0.01, blink: false });
A(0, "rea", "look", { to: [-0.35, 0.05], dur: 0.01, blink: false });
act.blinksAt(c, "phx", [5.4]); act.blinksAt(c, "rea", [5.5]); act.blinksAt(c, "dra", []);
A(0.52, "rea", "expr", { expr: "shocked", set: { open: 0.12, curve: -0.2, eye: 1.25 }, dur: 0.12 });   // his eyes go wide
A(0.52, "rea", "face", { lid: 0, brow: 0.35, dur: 0.12 });
A(0.56, "phx", "look", { to: AT_CAM, dur: 0.12, blink: false });     // Phoenix's eyes lead the turn to the door
A(0.55, "phx", "turn", { to: 0, dur: 0.3, ease: "inOut" });
A(0.62, "phx", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.2 }, dur: 0.15 });
A(0.8, "rea", "look", { to: AT_CAM, dur: 0.12, blink: false });
A(0.86, "rea", "turn", { to: 0, dur: 0.15 });

// ---------------------------------------------------------------- shots 3-5: the run and the chase
A(0.98, "phx", "pitch", { to: 9, dur: 0.25 }); A(1.04, "rea", "pitch", { to: 8, dur: 0.25 });     // lean into the run
pump("phx", P, { until: r3(DIVE_P - 0.02) }); pump("rea", R, { until: r3(DIVE_R - 0.02) });
A(P.t0, "phx", "grip", { side: "both", shape: "fist", dur: 0.2 }); A(R.t0, "rea", "grip", { side: "both", shape: "fist", dur: 0.2 });
A(P.t1, "phx", "grip", { side: "both", shape: "open", dur: 0.3 }); A(R.t1, "rea", "grip", { side: "both", shape: "open", dur: 0.3 });
A(1.55, "phx", "expr", { expr: "focused", set: { open: 0.15, curve: -0.25 }, dur: 0.25 }); A(1.55, "phx", "face", { lid: 0.2, brow: -0.15, dur: 0.25 });
A(1.55, "rea", "expr", { expr: "focused", set: { open: 0.05, curve: -0.2 }, dur: 0.25 }); A(1.55, "rea", "face", { lid: 0.25, brow: -0.1, dur: 0.25 });
// Reaper slides his eyes back over his shoulder as the fire comes (face kept serious)
A(2.85, "rea", "look", { to: [-0.6, 0], dur: 0.12, blink: false }); A(3.3, "rea", "look", { to: AT_CAM, dur: 0.12, blink: false });
A(2.85, "phx", "look", { to: [0.6, 0], dur: 0.12, blink: false }); A(3.3, "phx", "look", { to: AT_CAM, dur: 0.12, blink: false });
// both lean away from the fire as it passes between them
A(2.85, "phx", "lean", { to: 12, dur: 0.2, ease: "out" }); A(3.15, "phx", "lean", { to: 0, dur: 0.3, ease: "inOut" });
A(2.85, "rea", "lean", { to: -12, dur: 0.2, ease: "out" }); A(3.15, "rea", "lean", { to: 0, dur: 0.3, ease: "inOut" });
// Dragon gives chase: eyes on them first, a lean, the arms pumping low (clear of the shell above)
act.eyesLead(c, 1.12, "dra", [0, 0]);
A(1.1, "dra", "pitch", { to: 10, dur: 0.25 });
const LOW = { FWD: { o: [0.06, 0.32, 0.24] }, BACK: { o: [0.1, 0.18, -0.14] } };
pump("dra", DR1, LOW);
A(1.1, "dra", "grip", { side: "both", shape: "fist", dur: 0.2 });
// the fire builds inside the pumpkin while he runs: the orange light swells behind them
c.prop(1.6, "helmet", { on: 1 }, 0.8, "inOut");
A(1.6, "dra", "squash", { amount: -0.12, dur: 0.9 });
// BLAST 1 (slow motion): he plants (2.3-2.6), rears back: ah... CHOO; one plume down the middle, between their lanes
A(2.3, "dra", "pitch", { to: -6, dur: 0.3, ease: "out" });
A(2.5, "dra", "pitch", { to: -14, dur: 0.3, ease: "inOut" });
A(2.5, "dra", "expr", { expr: "focused", set: { pucker: 0.4, open: 0.35, eye: 0.6 }, dur: 0.2 });
sfx(2.45, "gasp", { gain: 0.6, reason: "ah... (Dragon plants and rears back for the first blast, 2.5-2.8)" });
A(2.8, "dra", "pitch", { to: 14, dur: 0.18, ease: "out" });
A(2.8, "dra", "squash", { amount: 0.12, dur: 0.3 });
A(2.8, "dra", "expr", { expr: "focused", set: { pucker: 0, open: 0.6, eye: 0.15 }, dur: 0.08 });
c.prop(2.83, "plume", { on: 1 }, 0.05, "out");
c.prop(2.83, "plume", { len: 1 }, 0.8, "out");
sfx(2.8, "blow", { gain: 0.6, dur: 0.35, reason: "CHOO: the burst of breath that throws the fire" });
sfx(2.76, "ai/flare", { gain: 1.6, reason: "the first blast leaves the pumpkin's grin (2.83): a big fwoomp" });
sfx(2.88, "whoosh", { gain: 0.8, reason: "the plume rolls down the hall between them (2.83-3.6)" });
c.at(2.83, { fx: "shake", amp: 0.035, dur: 0.45 });
c.prop(3.0, "helmet", { on: 0.5, glow: 0.8 }, 0.4);
A(3.2, "dra", "pitch", { to: 4, dur: 0.3, ease: "inOut" });
c.prop(3.3, "plume", { fade: 1 }, 0.3, "inOut");   // gone before he runs on: its smoke would hide the chase
// BLAST 2 (normal speed): he runs on, plants at the door's end of the hall and blasts again; they dive out of the door
act.eyesLead(c, 3.42, "dra", [0, 0]);
A(3.38, "dra", "pitch", { to: 12, dur: 0.2 });
pump("dra", DR2, { ...LOW, rest: false });
A(3.42, "dra", "expr", { expr: "focused", set: { open: 0.2, eye: 1.0, pucker: 0 }, dur: 0.15 });
A(DR2.t1 - 0.2, "dra", "pitch", { to: -12, dur: 0.22, ease: "out" });
A(DR2.t1 - 0.05, "dra", "expr", { expr: "focused", set: { pucker: 0.4, open: 0.3, eye: 0.6 }, dur: 0.12 });
const B2 = r3(DR2.t1 + 0.12);
A(B2 - 0.04, "dra", "pitch", { to: 14, dur: 0.14, ease: "out" });
A(B2 - 0.04, "dra", "squash", { amount: 0.12, dur: 0.25 });
A(B2 - 0.04, "dra", "expr", { expr: "focused", set: { pucker: 0, open: 0.6, eye: 0.15 }, dur: 0.06 });
c.prop(B2, "plume2", { on: 1 }, 0.04, "out");
c.prop(B2, "plume2", { len: 1 }, 0.4, "out");
sfx(B2 - 0.04, "ai/flare", { gain: 1.4, reason: "the second blast fills the hall to the door (B2): fwoomp" });
c.at(B2, { fx: "shake", amp: 0.03, dur: 0.35 });
c.prop(r3(B2 + 0.45), "plume2", { fade: 1 }, 0.8, "inOut");
// the dive: each friend leaps through the doorway, arms out in front, ahead of the fire
for (const [w, t] of [["phx", DIVE_P], ["rea", DIVE_R]]) {
  A(r3(t - 0.12), w, "hop", { height: 0.28, dur: 0.42 });
  for (const s of ["L", "R"]) c.arm(r3(t - 0.12), w, s, { o: [0.06, 0.62, 0.3] }, 0.12);
}
c.prop(r3(B2 + 0.38), "soot", { scale: 1 }, 0.15, "out");                  // the tip of the blast catches his hood on the way out

// ---------------------------------------------------------------- shots 6-7: on the porch, Dragon charges out after them
A(P.t1 - 0.25, "phx", "pitch", { to: -4, dur: 0.3, ease: "out" }); A(P.t1 + 0.1, "phx", "pitch", { to: 10, dur: 0.35, ease: "settle" });
A(R.t1 - 0.25, "rea", "pitch", { to: -4, dur: 0.3, ease: "out" }); A(R.t1 + 0.1, "rea", "pitch", { to: 10, dur: 0.35, ease: "settle" });
A(P.t1 - 0.1, "phx", "squash", { amount: 0.08, dur: 0.25 }); A(R.t1 - 0.1, "rea", "squash", { amount: 0.08, dur: 0.25 });
A(P.t1 - 0.2, "phx", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.1, curve: -0.1 }, dur: 0.2 });
A(R.t1 - 0.2, "rea", "expr", { expr: "deadpan", set: { open: 0.15, eye: 1.05 }, dur: 0.2 });
// panting, relieved, eyes to us
for (const [w, t0] of [["phx", P.t1 + 0.15], ["rea", R.t1 + 0.2]]) for (let k = 0; k < 2; k++) A(t0 + k * 0.4, w, "squash", { amount: -0.08, dur: 0.38 });
A(P.t1 + 0.4, "phx", "expr", { expr: "kind", set: { open: 0.15, curve: 0.2, eye: 1.0 }, dur: 0.3 });
A(R.t1 + 0.45, "rea", "face", { lid: 0.3, brow: 0, dur: 0.3 });
// Dragon after them: a lean, pumping arms, through the smoke, out of the door and a skid on the porch
act.eyesLead(c, DR3.t0, "dra", [0, 0]);
A(DR3.t0 - 0.03, "dra", "pitch", { to: 12, dur: 0.25 });
A(DR3.t0, "dra", "expr", { expr: "focused", set: { open: 0.2, eye: 1.0, pucker: 0 }, dur: 0.2 });
c.prop(DR3.t0, "helmet", { on: 0.2, glow: 0.4 }, 0.6);
pump("dra", DR3, { ...LOW, rest: false });
A(DR3.t1 - 0.2, "dra", "pitch", { to: -8, dur: 0.25, ease: "out" }); A(DR3.t1 + 0.05, "dra", "pitch", { to: 0, dur: 0.3, ease: "settle" });
A(DR3.t1 - 0.05, "dra", "squash", { amount: 0.1, dur: 0.25 });
// they hear him burst out behind them and jump
const JUMP = r3(DR3.t1 - 0.35);
// a startle, not a hop: no automatic hop/land sounds (quiet), a gasp instead
A(JUMP, "phx", "hop", { height: 0.22, dur: 0.38, quiet: true }); A(JUMP + 0.03, "rea", "hop", { height: 0.18, dur: 0.38, quiet: true });
sfx(JUMP + 0.02, "gasp", { gain: 0.45, reason: "both of them gasp as Dragon bursts out of the door behind them" });
A(JUMP, "phx", "pitch", { to: 0, dur: 0.15 }); A(JUMP, "rea", "pitch", { to: 0, dur: 0.15 });
A(JUMP, "phx", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.3 }, dur: 0.1 }); A(JUMP, "phx", "face", { lid: 0, brow: 0.4, dur: 0.1 });
A(JUMP + 0.03, "rea", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.25 }, dur: 0.1 }); A(JUMP + 0.03, "rea", "face", { lid: 0, brow: 0.35, dur: 0.1 });
for (const s of ["L", "R"]) { c.arm(JUMP, "phx", s, "up", 0.15); c.arm(JUMP + 0.03, "rea", s, "up", 0.15); }
for (const s of ["L", "R"]) { c.arm(JUMP + 0.5, "phx", s, "rest", 0.35); c.arm(JUMP + 0.53, "rea", s, "rest", 0.35); }

// ---------------------------------------------------------------- shot 8: the pumpkin comes off, then lights up again
// both hands come up to the shell's sides (just outside it, under its bulge), close on it, and carry it up off his head
const side = (s, up) => ({ x: [s * 0.67, r3((HELM[1] - 0.18 - LEG + up) / H_DRA), 0.05] });
const LIFT = r3(DR3.t1 + 0.35);
A(LIFT - 0.27, "dra", "arm", { side: "R", pose: side(-1, -0.04), dur: 0.27, ease: "settle" });
A(LIFT - 0.27, "dra", "arm", { side: "L", pose: side(1, -0.04), dur: 0.27, ease: "settle" });
A(LIFT - 0.02, "dra", "grip", { side: "both", shape: "hold", dur: 0.12 });
sfx(LIFT, "grab", { gain: 0.35, reason: "his gloves close on the pumpkin's sides" });
c.prop(LIFT + 0.12, "helmet", { y: r3(HELM[1] + 0.42), tip: -14 }, 0.45, "inOut");
A(LIFT + 0.12, "dra", "arm", { side: "R", pose: side(-1, 0.38), dur: 0.45, ease: "inOut" });
A(LIFT + 0.12, "dra", "arm", { side: "L", pose: side(1, 0.38), dur: 0.45, ease: "inOut" });
A(LIFT + 0.35, "dra", "expr", { expr: "kind", set: { curve: 0.55, open: 0.0, eye: 0.9, tilt: 0.35 }, dur: 0.3 });   // a sheepish grin
A(LIFT + 0.4, "dra", "face", { brow: 0.3, dur: 0.3 });
A(LIFT + 0.45, "dra", "look", { to: AT_CAM, dur: 0.2, blink: false });
sfx(LIFT + 0.55, "plunk", { gain: 0.22, reason: "the dry 'dum' as his sheepish face is revealed" });
// the pumpkin is just a pumpkin now: its glow goes out as it comes off
c.prop(LIFT + 0.12, "helmet", { glow: 0, on: 0 }, 0.45, "inOut");
// the friends, dead flat (the soot on Reaper's hood)
const STARE = r3(LIFT + 0.95);   // after the single on Dragon, back on the wide
A(STARE, "phx", "expr", { expr: "deadpan", dur: 0.3 }); A(STARE, "phx", "face", { lid: 0.45, brow: 0, dur: 0.3 });
A(STARE + 0.1, "rea", "expr", { expr: "deadpan", dur: 0.3 }); A(STARE + 0.1, "rea", "face", { lid: 0.5, brow: 0, dur: 0.3 });
// THE RESOLUTION: a pumpkin bigger than he is can't be set down at arm's length, so he swings it forward off his head
// and lets it plonk onto the deck in front of him; they hop back from it. Then one careful little puff, and it lights
// the way a jack-o'-lantern should. All three admire it.
const SWING = r3(STARE + 0.45), APEX = r3(SWING + 0.22), LAND = r3(APEX + 0.3);
const hand = (s, Y, Z) => ({ x: [s * 0.67, r3((Y - 0.22 - LEG) / H_DRA), r3(Z + 0.07)] });
A(SWING - 0.15, "dra", "look", { to: [0, -0.5], dur: 0.15, blink: false });   // his eyes go to the spot first
A(SWING - 0.1, "dra", "expr", { expr: "focused", set: { curve: 0.2, open: 0.05, eye: 1.0 }, dur: 0.25 });
A(SWING - 0.1, "dra", "face", { brow: 0.2, lid: 0.1, dur: 0.25 });
const zAt = (t) => r3(HELM[2] + (LANT[2] - HELM[2]) * ((t - SWING) / (LAND - SWING)));
c.prop(SWING, "helmet", { z: LANT[2], tip: 0 }, r3(LAND - SWING), "linear");
c.prop(SWING, "helmet", { y: r3(HELM[1] + 0.52) }, r3(APEX - SWING), "out");
c.prop(APEX, "helmet", { y: LANT[1] }, r3(LAND - APEX), "in");
for (const s of ["R", "L"]) {
  A(SWING, "dra", "arm", { side: s, pose: hand(s === "R" ? -1 : 1, HELM[1] + 0.52, zAt(APEX)), dur: r3(APEX - SWING), ease: "linear" });
  c.arm(r3(APEX + 0.02), "dra", s, { o: [0.08, 0.55, 0.32] }, 0.18);
  c.arm(r3(LAND + 0.05), "dra", s, "rest", 0.4);
}
A(APEX, "dra", "grip", { side: "both", shape: "open", dur: 0.1 });
sfx(SWING, "whoosh", { gain: 0.3, reason: "the pumpkin swings forward off his head (SWING-LAND)" });
sfx(LAND, "thud", { gain: 0.7, reason: "the pumpkin plonks down onto the porch deck" });
c.prop(LAND, "helmet", { squash: 0.08 }, 0.05, "out"); c.prop(r3(LAND + 0.05), "helmet", { squash: 0 }, 0.3, "settle");
c.at(LAND, { fx: "shake", amp: 0.012, dur: 0.2 });
A(r3(LAND - 0.1), "dra", "still", { dur: 0.6, idle: 0 });   // dead still while the pumpkin on the deck still rides on him
// then it stays on the deck by itself: the worn pumpkin hands over to a loose one in exactly its place, between two frames
const SWAP = r3(Math.round((LAND + 0.4) * 30) / 30 + 0.002);
c.prop(SWAP, "helmet", { scale: 0 }, 0.01); c.prop(SWAP, "lantern", { scale: 1 }, 0.01);
// they hop back from it as it comes at them, then watch it, wary
for (const [w, to, d] of [["phx", [-1.05, 2.3], 0], ["rea", [1.05, 2.2], 0.04]]) {
  A(r3(SWING + 0.1 + d), w, "look", { to: [0, 0.3], dur: 0.1, blink: false });
  A(r3(SWING + 0.12 + d), w, "expr", { expr: "shocked", set: { open: 0.25, eye: 1.25 }, dur: 0.12 });
  A(r3(SWING + 0.12 + d), w, "face", { lid: 0, brow: 0.35, dur: 0.12 });
  A(r3(SWING + 0.15 + d), w, "hop", { height: 0.12, dur: 0.32, quiet: true });
  A(r3(SWING + 0.15 + d), w, "move", { to, dur: 0.32, steps: 0 });
  for (const s of ["L", "R"]) { c.arm(r3(SWING + 0.15 + d), w, s, "up", 0.15); c.arm(r3(LAND + 0.15 + d), w, s, "rest", 0.4); }
  A(r3(LAND + 0.2 + d), w, "look", { to: [0, -0.45], dur: 0.15, blink: false });
  A(r3(LAND + 0.25 + d), w, "expr", { expr: "focused", set: { open: 0.05, curve: -0.1 }, dur: 0.3 });
  A(r3(LAND + 0.25 + d), w, "face", { lid: 0.3, brow: -0.1, dur: 0.3 });
}
// the careful puff: he's shorter than the pumpkin, so a few wing beats lift him over it; eyes on it, a small breath in,
// a thin lick of fire down onto it, and it lights from inside. He stays up there, proud (on the deck it would hide his eyes)
const FLY = r3(SWAP + 0.05), PUFF = r3(FLY + 0.5), LIT = r3(PUFF + 0.18);
A(r3(FLY - 0.1), "dra", "look", { to: [0, -0.45], dur: 0.15, blink: false });
A(FLY, "dra", "fly", { to: { y: 0.55 }, dur: 0.4, ease: "inOut" });
A(r3(FLY + 0.4), "dra", "hover", { dur: r3(END - FLY - 0.4) });
// his wing beats placed by hand (the automatic ones jumped 20 dB out of the mix): a few strong ones to lift, then soft
for (let t = FLY, k = 0; t < END - 0.1; t += k < 3 ? 0.13 : 0.22, k++) sfx(r3(t), "wing-flap", { gain: k < 3 ? 0.3 : 0.15, reason: "Dragon's wings beat as he lifts and hovers over the pumpkin" });
A(r3(PUFF - 0.3), "dra", "pitch", { to: 16, dur: 0.25, ease: "inOut" }); A(r3(PUFF + 0.3), "dra", "pitch", { to: 0, dur: 0.25, ease: "inOut" });
A(r3(PUFF - 0.35), "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0, eye: 0.7, curve: 0 }, dur: 0.25 });
A(r3(PUFF - 0.35), "dra", "face", { lid: 0.25, brow: -0.15, dur: 0.25 });
sfx(r3(PUFF - 0.3), "gasp", { gain: 0.2, reason: "a small careful breath in" });
c.prop(PUFF, "breath", { on: 1, fire: 0.45, len: 1 }, 0.15, "out");
c.prop(r3(PUFF + 0.3), "breath", { on: 0, len: 0, fire: 0 }, 0.15);
sfx(PUFF, "blow", { gain: 0.25, dur: 0.3, reason: "the careful little puff (a thin lick of fire)" });
c.prop(LIT, "lantern", { glow: 1, on: 0.65 }, 0.35, "out");
sfx(r3(LIT - 0.01), "ai/ignite", { gain: 0.8, reason: "the pumpkin lights from inside the way it should: the same fwip as frame 0" });
for (const w of ["phx", "rea"]) { A(r3(FLY + 0.1), w, "look", { to: [0, 0.1], dur: 0.15, blink: false }); A(r3(LIT - 0.05), w, "look", { to: [0, -0.45], dur: 0.12, blink: false }); }
// all three admire it: Dragon proud, Phoenix delighted, even Reaper's mouth gives a little
const ADMIRE = r3(LIT + 0.3);
A(ADMIRE, "dra", "expr", { expr: "kind", set: { curve: 0.6, open: 0.1, eye: 1.0, tilt: 0 }, dur: 0.3 }); A(ADMIRE, "dra", "face", { lid: 0, brow: 0.25, dur: 0.3 });
A(r3(ADMIRE + 0.5), "dra", "look", { to: AT_CAM, dur: 0.2, blink: false });
A(ADMIRE, "phx", "expr", { expr: "delighted", dur: 0.3 }); A(ADMIRE, "phx", "face", { lid: 0, brow: 0.3, dur: 0.3 });
A(r3(ADMIRE + 0.15), "phx", "hop", { height: 0.1, dur: 0.3 });
A(r3(ADMIRE + 0.35), "rea", "expr", { expr: "kind", set: { curve: 0.3, open: 0, eye: 0.9 }, dur: 0.35 }); A(r3(ADMIRE + 0.35), "rea", "face", { lid: 0.3, brow: 0.1, dur: 0.35 });

// ---------------------------------------------------------------- shots
const ZP = (t) => P.at(t)[2];
const beats = c.beats([
  // a wide lens close to him: the camera has to stay between Dragon and his friends
  ["1 the pumpkin lights", 0, frame([0, 0.72, DRA0[1]], { az: 0, el: 4, h: 1.75, fov: 60, push: 0.08, dur: 0.5 }), "hook"],
  ["2 they notice", 0.5, { pos: [0.02, 0.85, 0.4], look: [0.02, 0.7, -3.0], fov: 40 }, "reaction"],
  ["3 they bolt, he chases", 1.0, { pos: [0, 1.85, 4.6], look: [0, 0.5, -3.6], fov: 44 }, "reveal"],
  ["4 slow motion", 1.6, { pos: [0, 0.55, r3(ZP(1.6) + 3.6)], look: [0, 0.8, r3(ZP(1.6) - 1.8)], fov: 50, to: { pos: [0, 0.55, r3(ZP(2.5) + 3.8)], look: [0, 0.8, r3(ZP(2.5) - 1.8)] }, dur: 0.9, ease: "linear" }],
  ["5 the first blast", 2.5, { pos: [0.25, 1.5, 4.2], look: [0.1, 0.7, -3.6], fov: 50, to: { pos: [0.25, 1.45, 3.9] }, dur: 1.1, ease: "linear" }, "payoff"],
  // low from the porch: the doorway blast and the charge tower over us; then up and back for the jump (no cut)
  ["6 the second blast", 3.6, { pos: [0, 0.45, 5.6], look: [0, 0.9, -0.8], fov: 46, to: { pos: [0, 1.3, 6.0], look: [0, 0.85, 0.0] }, dur: 2.0, ease: "inOut" }],
  ["7 the pumpkin comes off", r3(LIFT + 0.2), { pos: [0, 1.45, 3.0], look: [0, 1.0, 0.3], fov: 48 }, "reaction"],
  ["8 they stare", r3(STARE - 0.1), { pos: [0, 1.65, 5.8], look: [0, 1.0, 0.6], fov: 46 }, "reaction"],
  // high and wide over the deck: the lit pumpkin between all three faces (from lower, it hides Dragon's mouth and the puff)
  ["9 he lights it right", LAND, { pos: [0.7, 4.5, 8.2], look: [0.1, 0.95, 1.7], fov: 50, to: { pos: [0.6, 4.1, 7.5], look: [0.1, 0.95, 1.7] }, dur: r3(END - LAND), ease: "inOut" }, "reaction"],
], END);

write(import.meta.url, {
  id: "dont-let-dragon-light-the-pumpkin",
  title: "Don't Let Dragon Light the Pumpkin",
  idea: "Eight trend tests #06 (Pray For Me slow-motion run): Dragon's pumpkin helmet lights up and he chases his friends down the hall, blasting fire after them",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  set: { type: "hallway", light: "golden", key: [4.2, 4.0, 2.6], wallZ: -30, shadowSize: 8, seed: 6 },
  // the hero music under the slow-motion chase, cut when the action goes back to normal speed
  music: { file: "ai/hero-bed/hero-bed-02.ogg", from: 1.0, until: 3.6, gain: 0.55 },
  sound: { sfx: 0.7, ambience: 0.25, signature: { payoff: false } },
  hook: { show: ["dra", "helmet"], hint: 0.1, what: "a jack-o'-lantern's eyes light up and the potato under it puffs his cheeks" },
  creative: { length: [10, 20] },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "dra", with: "helmet", from: 0, to: END, reason: "Dragon wears the pumpkin over his head; it hides his eyes until he lifts it off (the brief)" },
  ],
  notes: "Generated by storyboards/pumpkin/make-dont-let-dragon-light-the-pumpkin.mjs.",
});
