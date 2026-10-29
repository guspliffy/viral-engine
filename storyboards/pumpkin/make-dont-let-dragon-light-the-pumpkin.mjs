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
const END = 10.2;

// ---------------------------------------------------------------- places
const DRA0 = [0, -5.25], DRA_END = [0, 0.3];              // Dragon at the far end; at last just out of the door
const PHX0 = [-0.42, -2.8], REA0 = [0.74, -3.3];           // the two friends, Reaper a step behind
const SPLIT = 0.84;                                       // in the slow motion they split to the hall's sides
const PHX_END = [-0.86, 1.6], REA_END = [0.86, 1.4];   // wide apart: Dragon stands between and behind them      // on the porch, either side of the doormat
const HELM = [0, 0.78, -0.02];                              // the helmet's centre in Dragon's body frame (worn)
const H_DRA = 0.96, LEG = 0.14;                           // lookdev/dragon-crisp body height, potato.js LEG_H
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
const D2 = runPath(3.55, Z1, -2.7, [[3.55, 0], [3.75, 3.0]], () => 0, 0.25);
const Z2 = D2.at(-1)[2];
const DR2 = run("dra", D2, [[0, 2.4], [0.2, 3.4]], 0, { stride: 2.0, bob: 0.035 });
const D3 = runPath(4.85, Z2, DRA_END[1], [[4.85, 0], [5.1, 2.9]], () => 0, 0.3);
const DR3 = run("dra", D3, [[0, 2.4], [0.25, 3.4]], 0, { stride: 2.0, bob: 0.035 });
const MOUTH_Y = r3(HELM[1] + PUMPKIN.mouthAt[1]), mouthZ = (z) => r3(z + PUMPKIN.mouthAt[2] + 0.02);
// the second blast stops at the doorway, behind them as they dive out
const LEN2 = r3(-0.15 - mouthZ(Z2));

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 150, expr: "kind", follow: 0.25, seed: 1.7 },
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: -10, expr: "kind", follow: 0.25, seed: 3.3 },
  { id: "dra", character: "lookdev/dragon-crisp", at: DRA0, face: 0, expr: "focused", follow: 0, seed: 4.1, signature: false },
];
const props = [
  { id: "helmet", kind: "pumpkinhelm", wear: "dra", x: HELM[0], y: HELM[1], z: HELM[2], glow: 0 },
  { id: "plume", kind: "fireplume", x: 0, y: MOUTH_Y, z: mouthZ(Z1), length: 2.3, width: 0.8, balls: 32 },
  { id: "plume2", kind: "fireplume", x: 0, y: MOUTH_Y, z: mouthZ(Z2), length: LEN2, width: 0.7, balls: 30 },
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
A(0.58, "phx", "turn", { to: 0, dur: 0.45, ease: "inOut" });          // not faster: a 0.3 s turn pops a wing for a frame
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
c.prop(3.6, "plume", { fade: 1 }, 0.6, "inOut");   // short: a longer fade shows a purple smoke stage
// BLAST 2 (normal speed): he runs on, plants at the door's end of the hall and blasts again; they dive out of the door
act.eyesLead(c, 3.55, "dra", [0, 0]);
A(3.5, "dra", "pitch", { to: 12, dur: 0.2 });
pump("dra", DR2, { ...LOW, rest: false });
A(3.55, "dra", "expr", { expr: "focused", set: { open: 0.2, eye: 1.0, pucker: 0 }, dur: 0.15 });
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
c.prop(r3(DIVE_R + 0.05), "soot", { scale: 1 }, 0.2, "out");                // a spark catches his hood on the way out

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
A(JUMP, "phx", "hop", { height: 0.22, dur: 0.38 }); A(JUMP + 0.03, "rea", "hop", { height: 0.18, dur: 0.38 });
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
// the friends turn their faces to us, dead flat (the soot on Reaper's hood)
const STARE = r3(LIFT + 0.75);
A(STARE, "phx", "expr", { expr: "deadpan", dur: 0.3 }); A(STARE, "phx", "face", { lid: 0.45, brow: 0, dur: 0.3 });
A(STARE + 0.1, "rea", "expr", { expr: "deadpan", dur: 0.3 }); A(STARE + 0.1, "rea", "face", { lid: 0.5, brow: 0, dur: 0.3 });
A(STARE + 0.1, "phx", "still", { dur: 1.0, idle: 0.03 }); A(STARE + 0.2, "rea", "still", { dur: 0.9, idle: 0.03 });
// ...and the pumpkin's eyes light up again above his head: his eyes go up to it, theirs go wide, they run for it
const AGAIN = r3(STARE + 1.25);
c.prop(AGAIN, "helmet", { glow: 1, on: 0.4 }, 0.2, "out");
sfx(AGAIN - 0.01, "ai/ignite", { gain: 0.9, reason: "the pumpkin's eyes light up again over his head: the same small fwip" });
A(AGAIN + 0.12, "dra", "look", { to: [0, 0.9], dur: 0.15, blink: false });
A(AGAIN + 0.2, "dra", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.2 }, dur: 0.15 });
A(AGAIN + 0.15, "phx", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.3 }, dur: 0.12 }); A(AGAIN + 0.15, "phx", "face", { lid: 0, brow: 0.4, dur: 0.12 });
A(AGAIN + 0.18, "rea", "expr", { expr: "shocked", set: { open: 0.12, eye: 1.25 }, dur: 0.12 }); A(AGAIN + 0.18, "rea", "face", { lid: 0, brow: 0.35, dur: 0.12 });
const FLEE = r3(AGAIN + 0.5);
A(FLEE - 0.08, "phx", "look", { to: [-0.8, 0], dur: 0.1, blink: false }); A(FLEE, "phx", "turn", { to: -90, dur: 0.22 });
A(FLEE - 0.05, "rea", "look", { to: [0.8, 0], dur: 0.1, blink: false }); A(FLEE + 0.03, "rea", "turn", { to: 90, dur: 0.22 });
A(FLEE + 0.12, "phx", "move", { to: [-3.1, 1.7], dur: 0.6, steps: 3.5, ease: "in" });
A(FLEE + 0.15, "rea", "move", { to: [3.1, 1.5], dur: 0.6, steps: 3.5, ease: "in" });
A(FLEE + 0.1, "phx", "pitch", { to: 10, dur: 0.15 }); A(FLEE + 0.13, "rea", "pitch", { to: 10, dur: 0.15 });
for (const w of ["phx", "rea"]) A(FLEE + 0.1, w, "grip", { side: "both", shape: "fist", dur: 0.1 });
sfx(FLEE + 0.12, "whoosh", { gain: 0.5, reason: "the two of them zip off either side of the frame" });

// ---------------------------------------------------------------- shots
const ZP = (t) => P.at(t)[2];
const beats = c.beats([
  // a wide lens close to him: the camera has to stay between Dragon and his friends
  ["1 the pumpkin lights", 0, frame([0, 0.72, DRA0[1]], { az: 0, el: 4, h: 1.75, fov: 60, push: 0.08, dur: 0.5 }), "hook"],
  ["2 they notice", 0.5, { pos: [0.02, 0.85, 0.4], look: [0.02, 0.7, -3.0], fov: 40 }, "reaction"],
  ["3 they bolt, he chases", 1.0, { pos: [0, 1.85, 4.6], look: [0, 0.5, -3.6], fov: 44 }, "reveal"],
  ["4 slow motion", 1.6, { pos: [0, 0.55, r3(ZP(1.6) + 3.6)], look: [0, 0.8, r3(ZP(1.6) - 1.8)], fov: 50, to: { pos: [0, 0.55, r3(ZP(2.5) + 3.8)], look: [0, 0.8, r3(ZP(2.5) - 1.8)] }, dur: 0.9, ease: "linear" }],
  ["5 the first blast", 2.5, { pos: [0, 1.5, 4.0], look: [0, 0.7, -3.6], fov: 46, to: { pos: [0, 1.45, 3.7] }, dur: 1.1, ease: "linear" }, "payoff"],
  ["6 the second blast", 3.6, { pos: [0, 1.0, 5.9], look: [0, 0.75, -0.8], fov: 46 }],
  ["7 he charges out", 4.9, { pos: [0, 1.3, 6.0], look: [0, 0.85, 0.0], fov: 46 }],
  ["8 the pumpkin comes off", r3(LIFT - 0.3), { pos: [0, 1.65, 5.8], look: [0, 1.0, 0.6], fov: 46 }, "reaction"],   // high: his face shows over theirs
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
