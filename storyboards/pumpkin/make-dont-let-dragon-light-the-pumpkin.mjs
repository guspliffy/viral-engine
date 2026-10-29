// DON'T LET DRAGON LIGHT THE PUMPKIN (eight trend tests #06, 29 Oct 2026), built from the clip template.
// node storyboards/pumpkin/make-dont-let-dragon-light-the-pumpkin.mjs -> storyboards/pumpkin/dont-let-dragon-light-the-pumpkin.json
//
// THE BRIEF (06-dont-look-back/ENGINE-PROMPT.md: 14.00 s, 420 frames, eight shots, wordless, no loop)
//   Joke:        Dragon wears a carved pumpkin as a helmet; when its eyes start to glow, his friends know exactly what
//                is coming and run, in heroic slow motion, from the sneeze of fire it sends down the hall.
//   Wants:       Phoenix and Reaper want to get out of the house before Dragon sneezes.
//   Consequence: they make it out onto the porch unharmed (one tiny soot spot on Reaper's hood) and try to look calm.
//   Ending:      Dragon comes to the doorway and lifts the pumpkin off his own sheepish face; his friends stare. Held,
//                no reset to the start (the brief: end on the reaction, loopability is secondary).
//
//   1 0.00-0.60  close at the far end: the pumpkin's eyes light up orange, Dragon's cheeks puff in its     (fwip)
//                grin, a copper wing tip at the side
//   2 0.60-1.20  reaction close-up: Reaper's eyes widen; Phoenix turns from the pumpkin to the open exit  (quiet beat)
//   3 1.20-2.00  wide from the porch through the open door: the two start running toward us; Dragon     (steps)
//                at the far end. All three readable
//   4 2.00-4.20  short slow-motion run: planted steps, the hood dragging, the crest bouncing, serious     (wooom, hero music)
//                faces. Orange light swelling behind them
//   5 4.20-7.00  Dragon sneezes ONE contained plume of fire down the empty middle of the hall, behind    (ah.. CHOO: fwoomp)
//                them; they keep ahead and reach the threshold (the same slow motion for both)
//   6 7.00-10.0  normal speed: they cross the threshold, stop on the porch; the fire stays in the hall   (porch steps)
//                and dies down; Dragon starts walking up the hall
//   7 10.0-12.0  reaction two-shot: both look back, trying to seem calm; a tiny soot spot on Reaper's   (sigh)
//                hood, faces clean
//   8 12.0-14.0  Dragon in the doorway lifts the pumpkin off with both hands, a sheepish grin; his        (dry note)
//                friends stare at him. Held to the end
//
// Blocking (x right, z toward the camera, y up; set-hallway.js HALLWAY): the hall runs from its far wall (z -6.0) to the
// front doorway (z 0, 2.1 m wide, both leaves open inward against the side walls); the porch is z 0..3.4. Every camera
// looks into the house from the porch side, so Phoenix stays on screen left, Reaper on screen right, Dragon at the far
// end in the middle, and the run always comes toward us.
// Props: one pumpkin helmet, worn by Dragon (stage.js `wear`) from frame 0 until his own hands lift it at 12.6; one
// plume of fire, leaving the pumpkin's grin at the sneeze and running down the middle of the hall, never as far as the
// runners; one soot spot on Reaper's hood, there from the threshold on.
// Slow motion: the engine has no time stretch, so shots 4-5 are acted slowly (Cookie Rescue): one `run` action per
// runner whose speed and footfalls drop to about a fifth at 2.0 and come back at 7.0; Dragon's sneeze and the fire
// move at the same slow pace.
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { PUMPKIN } from "../../engine/page/props-pumpkin.js";

const c = clip(), { A, sfx } = c;
const END = 14.0;

// ---------------------------------------------------------------- places
const DRA0 = [0, -5.25], DRA_DOOR = [0, -0.42];          // Dragon at the far end; later in the doorway, just inside
const PHX0 = [-0.42, -2.8], REA0 = [0.74, -3.3];           // the two friends, on their way out, Reaper a step behind
const SPLIT = 0.84;                                       // in the slow motion they split to the hall's sides
const PHX_END = [-0.68, 1.6], REA_END = [0.7, 1.35];     // on the porch, either side of the doormat
const HELM = [0, 0.78, -0.02];                              // the helmet's centre in Dragon's body frame (worn)
const H_DRA = 0.96, LEG = 0.14;                           // lookdev/dragon-crisp body height, potato.js LEG_H
const MOUTH_Z = r3(DRA0[1] + PUMPKIN.mouthAt[2] + 0.02), MOUTH_Y = r3(HELM[1] + PUMPKIN.mouthAt[1]);

// eye targets (face look space: + right on screen, + up)
const AT_CAM = [0, 0], AT_BACK_L = [0.95, 0.1], AT_BACK_R = [-0.95, 0.1];

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 150, expr: "kind", follow: 0.25, seed: 1.7 },
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: -10, expr: "kind", follow: 0.25, seed: 3.3 },
  { id: "dra", character: "lookdev/dragon-crisp", at: DRA0, face: 0, expr: "focused", follow: 0, seed: 4.1, signature: false },
];
const props = [
  { id: "helmet", kind: "pumpkinhelm", wear: "dra", x: HELM[0], y: HELM[1], z: HELM[2], glow: 0 },
  { id: "plume", kind: "fireplume", x: 0, y: MOUTH_Y, z: MOUTH_Z, length: 2.5, width: 0.9, balls: 34 },
  { id: "soot", kind: "soot", wear: "rea", x: 0.25, y: 0.8, z: 0.3, rot: 25, tip: -22, size: 0.12, scale: 0 },
];

// ---------------------------------------------------------------- the run: one path per runner, speed in m/s by time
// normal speed from 1.28 (a quick start), slow motion 2.0-6.95 (a fifth), normal again from 7.0, a stop on the porch
function runPath(z0, x0, xMid, xEnd, zEnd) {
  const speed = (t) => t < 1.28 ? 0 : t < 1.85 ? 1.4 * ((t - 1.28) / 0.57) : t < 2.0 ? 1.4 : t < 2.12 ? 1.4 - (1.4 - 0.31) * ((t - 2.0) / 0.12)
    : t < 6.95 ? 0.31 : t < 7.08 ? 0.31 + (2.5 - 0.31) * ((t - 6.95) / 0.13) : 2.5;
  // integrate z, then ease into the stop at zEnd (the last 0.4 s slow down evenly)
  const pts = []; let z = z0, t = 1.28;
  for (; z < zEnd - 0.5 && t < 9; t += 0.05) { pts.push([t, z]); z += speed(t) * 0.05; }
  const tStop = t, zStop = z;
  for (let k = 1; k <= 8; k++) { const u = k / 8; pts.push([tStop + u * 0.42, zStop + (zEnd - zStop) * (1 - (1 - u) * (1 - u))]); }
  // x: they split apart to the hall's sides early in the slow motion (2.0-3.4: the middle is left empty for the fire), keep
  // their side through the door, then ease in to their spot on the porch
  const sm = (u) => u * u * (3 - 2 * u);
  return pts.map(([t, z]) => [r3(t), r3(z > 0.1 ? xMid + (xEnd - xMid) * sm(Math.min(1, (z - 0.1) / (zEnd - 0.1))) : x0 + (xMid - x0) * sm(Math.min(1, Math.max(0, (t - 2.0) / 1.4)))), r3(z)]);
}
// the footfalls: about 3.2 steps a second at a run, 0.8 in the slow motion (long planted strides)
const RATE = [[0, 1.6], [0.5, 3.2], [0.72, 3.2], [0.86, 0.8], [5.65, 0.8], [5.82, 3.2], [6.6, 3.0], [7.0, 1.2]];
function run(who, z0, x0, xMid, end, delay = 0) {
  const pts = runPath(z0, x0, xMid, end[0], end[1]), t0 = pts[0][0] + delay;
  const rel = pts.map(([t, x, z]) => [r3(t - pts[0][0]), x, z]);
  A(t0, who, "run", { pts: rel, rate: RATE, stride: 2.1, bob: 0.035, dur: rel.at(-1)[0] });
  return { t0, t1: r3(t0 + rel.at(-1)[0]), zAt: (t) => { const p = pts.find((q) => q[0] + delay >= t) || pts.at(-1); return p[2]; } };
}
// arms pump with the footfalls (the same phase the legs use): forward and up, back and down, the other arm opposite
function pump(who, t0, t1) {
  // phase at time t from RATE (as timeline.js integrates it)
  const phase = (T) => { let ph = 0; for (let i = 0; i < RATE.length && T > RATE[i][0]; i++) { const a = RATE[i], b = RATE[i + 1], u = Math.min(T, b ? b[0] : T) - a[0]; ph += u * a[1] + (b ? ((b[1] - a[1]) * u * u) / (2 * (b[0] - a[0])) : 0); } return ph; };
  const FWD = { o: [0.04, 0.5, 0.26] }, BACK = { o: [0.1, 0.28, -0.14] };
  let k = 0;
  for (let t = t0; t < t1 - 0.1; t += 0.02) {
    const ph = phase(t - t0);
    if (ph >= k * 0.5) {
      const dur = Math.max(0.12, Math.min(0.55, 0.5 / (RATE.find((r, i) => !RATE[i + 1] || RATE[i + 1][0] > t - t0)[1]) * 0.9));
      c.arm(t, who, k % 2 ? "R" : "L", FWD, dur, "inOut"); c.arm(t, who, k % 2 ? "L" : "R", BACK, dur, "inOut");
      k++;
    }
  }
  c.arm(t1 - 0.1, who, "R", "rest", 0.35); c.arm(t1 - 0.1, who, "L", "rest", 0.35);
}

// ---------------------------------------------------------------- frame 0: the pumpkin lights up (shot 1)
A(0, "dra", "wings", { to: 1, dur: 0.01 });                     // the copper wing tips show either side of the pumpkin
for (const w of ["phx", "rea"]) A(0, w, "grip", { side: "both", shape: "open", dur: 0.01 });
A(0, "dra", "expr", { expr: "focused", set: { pucker: 0.5, open: 0.05 }, dur: 0.01 });
c.prop(0.06, "helmet", { glow: 1 }, 0.3, "out");                      // the eyes light up from inside
sfx(0.05, "ai/ignite", { gain: 0.9, reason: "the pumpkin's carved eyes catch light from inside (0.06-0.36): a small fwip" });
A(0.12, "dra", "squash", { amount: -0.1, dur: 0.6 });                // his cheeks puff, he swells with the breath
A(0.12, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.0 }, dur: 0.35 });
sfx(0.14, "gasp", { gain: 0.35, reason: "Dragon draws a breath in behind the grin (0.12-0.5)" });
c.prop(0.3, "helmet", { on: 0.25 }, 0.6);
c.cap(0, 2.0, "Never let Dragon light the pumpkin.", 250, false, { kinetic: false });

// ---------------------------------------------------------------- shot 2: they notice (0.6-1.2)
A(0, "phx", "look", { to: [0, 0.1], dur: 0.01, blink: false });
A(0, "rea", "look", { to: [-0.35, 0.05], dur: 0.01, blink: false });
act.blinksAt(c, "phx", [9.2]); act.blinksAt(c, "rea", [9.5]); act.blinksAt(c, "dra", []);
A(0.62, "rea", "expr", { expr: "shocked", set: { open: 0.12, curve: -0.2, eye: 1.25 }, dur: 0.12 });   // his eyes go wide
A(0.62, "rea", "face", { lid: 0, brow: 0.35, dur: 0.12 });
A(0.62, "rea", "still", { dur: 0.6, idle: 0.04 });
A(0.66, "phx", "look", { to: AT_CAM, dur: 0.12, blink: false });     // Phoenix's eyes lead the turn to the door
A(0.68, "phx", "turn", { to: 0, dur: 0.48, ease: "inOut" });   // not faster: a 0.3 s turn popped a wing for a frame
A(0.72, "phx", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.2 }, dur: 0.15 });
A(0.95, "rea", "look", { to: AT_CAM, dur: 0.12, blink: false });

// ---------------------------------------------------------------- shots 3-6: the run
const P = run("phx", PHX0[1], PHX0[0], -SPLIT, PHX_END), R = run("rea", REA0[1], REA0[0], SPLIT, REA_END, 0.06);
A(1.24, "phx", "pitch", { to: 9, dur: 0.25 }); A(1.3, "rea", "pitch", { to: 8, dur: 0.25 });      // lean into the run
A(1.15, "rea", "turn", { to: 0, dur: 0.15 });
pump("phx", P.t0, P.t1); pump("rea", R.t0, R.t1);
// fists while they run, open hands after (a fist or a holding glove at rest reads as a thumbs-up or a point)
A(P.t0, "phx", "grip", { side: "both", shape: "fist", dur: 0.2 }); A(R.t0, "rea", "grip", { side: "both", shape: "fist", dur: 0.2 });
A(P.t1, "phx", "grip", { side: "both", shape: "open", dur: 0.3 }); A(R.t1, "rea", "grip", { side: "both", shape: "open", dur: 0.3 });
// serious slow-motion faces (the trend's dead-serious run), a hard focus, mouths set
A(1.95, "phx", "expr", { expr: "focused", set: { open: 0.15, curve: -0.25 }, dur: 0.25 }); A(1.95, "phx", "face", { lid: 0.2, brow: -0.15, dur: 0.25 });
A(1.95, "rea", "expr", { expr: "focused", set: { open: 0.05, curve: -0.2 }, dur: 0.25 }); A(1.95, "rea", "face", { lid: 0.25, brow: -0.1, dur: 0.25 });
// mid slow motion Reaper slides his eyes to Phoenix and back (face kept serious)
A(3.3, "rea", "look", { to: [-0.6, 0], dur: 0.15, blink: false }); A(3.75, "rea", "look", { to: AT_CAM, dur: 0.15, blink: false });
// the fire builds inside the pumpkin while they run: the orange light swells behind them
c.prop(2.0, "helmet", { on: 1 }, 1.0, "inOut");
A(2.0, "dra", "squash", { amount: -0.14, dur: 2.2 });
// shot 5: ah... ah... CHOO (slow): he rears back, then throws the sneeze forward; one plume down the middle
A(4.2, "dra", "pitch", { to: -12, dur: 0.45, ease: "inOut" });
A(4.2, "dra", "expr", { expr: "focused", set: { pucker: 0.4, open: 0.35, eye: 0.6 }, dur: 0.3 });
sfx(4.22, "gasp", { gain: 0.5, reason: "ah... (Dragon rears back for the sneeze, 4.2-4.65)" });
sfx(4.45, "gasp", { gain: 0.6, reason: "...ah... (the second, bigger breath in)" });
A(4.66, "dra", "pitch", { to: 14, dur: 0.22, ease: "out" });
A(4.66, "dra", "squash", { amount: 0.12, dur: 0.3 });
A(4.66, "dra", "expr", { expr: "focused", set: { pucker: 0, open: 0.6, eye: 0.15 }, dur: 0.08 });
c.prop(4.7, "plume", { on: 1 }, 0.05, "out");
c.prop(4.7, "plume", { len: 1 }, 1.05, "out");
sfx(4.66, "blow", { gain: 0.6, dur: 0.35, reason: "CHOO: the burst of breath that throws the fire" });
sfx(4.62, "ai/flare", { gain: 1.6, reason: "the fire leaves the pumpkin's grin (4.7): a big fwoomp" });
sfx(4.75, "whoosh", { gain: 0.8, reason: "the plume rolls down the hall (4.7-5.75)" });
c.at(4.7, { fx: "shake", amp: 0.035, dur: 0.6 });
c.prop(4.9, "helmet", { on: 0.35, glow: 0.7 }, 0.6);
A(5.2, "dra", "pitch", { to: 0, dur: 0.8, ease: "inOut" });
A(5.3, "dra", "expr", { expr: "kind", set: { open: 0.1, curve: 0.1, eye: 0.85 }, dur: 0.6 });
// the fire holds a moment behind them, then dies down inside the hall (rising, cooling to smoke)
c.prop(6.0, "plume", { fade: 1 }, 1.4, "inOut");
c.prop(6.4, "helmet", { on: 0, glow: 0.25 }, 1.4);
c.prop(6.95, "soot", { scale: 1 }, 0.25, "out");                       // a spark caught his hood on the way out

// ---------------------------------------------------------------- shot 6: out onto the porch, stop (7.0-10.0)
A(P.t1 - 0.25, "phx", "pitch", { to: -4, dur: 0.3, ease: "out" }); A(P.t1 + 0.1, "phx", "pitch", { to: 12, dur: 0.4, ease: "settle" });
A(R.t1 - 0.25, "rea", "pitch", { to: -4, dur: 0.3, ease: "out" }); A(R.t1 + 0.1, "rea", "pitch", { to: 12, dur: 0.4, ease: "settle" });
A(P.t1 - 0.1, "phx", "squash", { amount: 0.08, dur: 0.25 }); A(R.t1 - 0.1, "rea", "squash", { amount: 0.08, dur: 0.25 });
A(7.2, "phx", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.1, curve: -0.1 }, dur: 0.2 });
A(7.2, "rea", "expr", { expr: "deadpan", set: { open: 0.15, eye: 1.05 }, dur: 0.2 });
// bent over, panting hard (about 2.5 breaths a second), eyes to us
for (const [w, t0] of [["phx", 8.2], ["rea", 8.3]]) for (let k = 0; k < 3; k++) A(t0 + k * 0.4, w, "squash", { amount: -0.08, dur: 0.38 });
A(8.2, "phx", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.05, curve: -0.05 }, dur: 0.3 });
A(8.3, "rea", "face", { lid: 0.3, brow: 0, dur: 0.3 });
// ...then both snap upright together, as if nothing happened (the composure gag)
A(9.45, "phx", "pitch", { to: 0, dur: 0.25, ease: "settle" }); A(9.45, "rea", "pitch", { to: 0, dur: 0.25, ease: "settle" });
A(9.45, "phx", "lean", { to: -4, dur: 0.25, ease: "settle" }); A(9.45, "rea", "lean", { to: 4, dur: 0.25, ease: "settle" });
A(9.45, "phx", "squash", { amount: 0.06, dur: 0.25 }); A(9.45, "rea", "squash", { amount: 0.06, dur: 0.25 });
A(9.5, "phx", "expr", { expr: "kind", set: { open: 0.0, curve: 0.15, eye: 1.0 }, dur: 0.25 }); A(9.5, "phx", "face", { press: 0.4, dur: 0.25 });
A(9.5, "rea", "expr", { expr: "deadpan", set: { open: 0.0 }, dur: 0.25 }); A(9.5, "rea", "face", { lid: 0.42, brow: 0, dur: 0.25 });
// Dragon walks up the hall to the door (seen small through the doorway)
act.eyesLead(c, 8.2, "dra", [0, 0]);
A(8.2, "dra", "move", { to: DRA_DOOR, dur: 3.6, steps: 2.4, ease: "inOut" });

// ---------------------------------------------------------------- shot 7: both look back, trying to seem calm (10-12)
A(10.0, "phx", "look", { to: AT_BACK_L, dur: 0.15, blink: false }); A(10.05, "phx", "turn", { to: 100, dur: 0.3, ease: "settle" });
A(10.05, "rea", "look", { to: AT_BACK_R, dur: 0.15, blink: false }); A(10.1, "rea", "turn", { to: -100, dur: 0.3, ease: "settle" });
// ...and back round to each other, trying to look calm
A(10.35, "phx", "look", { to: AT_BACK_L, dur: 0.15, blink: false }); A(10.4, "phx", "turn", { to: 62, dur: 0.35, ease: "settle" });
A(10.4, "rea", "look", { to: AT_BACK_R, dur: 0.15, blink: false }); A(10.45, "rea", "turn", { to: -42, dur: 0.35, ease: "settle" });   // less: the hood hides a face turned further
A(10.55, "phx", "expr", { expr: "kind", set: { curve: 0.35, open: 0.0, eye: 0.95 }, dur: 0.3 });   // a too-casual little smile
A(10.55, "phx", "face", { lid: 0.3, press: 0.4, dur: 0.3 });
A(10.6, "rea", "expr", { expr: "deadpan", set: { curve: 0.12 }, dur: 0.3 });
A(10.8, "phx", "still", { dur: 0.9, idle: 0.05 }); A(10.85, "rea", "still", { dur: 0.85, idle: 0.05 });
sfx(10.7, "ai-package/flat-exhale", { gain: 0.35, reason: "a calm-looking breath out (both of them, 10.7)" });
// they turn fully to the doorway as Dragon arrives in it
A(11.75, "phx", "turn", { to: 130, dur: 0.35 }); A(11.75, "rea", "turn", { to: -130, dur: 0.35 });
A(11.75, "phx", "look", { to: AT_CAM, dur: 0.2, blink: false }); A(11.75, "rea", "look", { to: AT_CAM, dur: 0.2, blink: false });
A(12.0, "phx", "expr", { expr: "deadpan", dur: 0.3 }); A(12.0, "rea", "expr", { expr: "deadpan", dur: 0.3 });

// ---------------------------------------------------------------- shot 8: Dragon lifts the pumpkin off (12-14)
// both hands come up to the shell's sides, close on it, and carry it up and back off his head
// (just outside the shell, under its bulge: the shell is 0.58 m out at 0.18 m below its middle)
const side = (s, up) => ({ x: [s * 0.67, r3((HELM[1] - 0.18 - LEG + up) / H_DRA), 0.05] });
A(11.95, "dra", "arm", { side: "R", pose: side(-1, -0.04), dur: 0.27, ease: "settle" });
A(11.95, "dra", "arm", { side: "L", pose: side(1, -0.04), dur: 0.27, ease: "settle" });
A(12.2, "dra", "grip", { side: "both", shape: "hold", dur: 0.12 });
sfx(12.22, "grab", { gain: 0.35, reason: "his gloves close on the pumpkin's sides" });
c.prop(12.35, "helmet", { y: r3(HELM[1] + 0.42), tip: -14 }, 0.5, "inOut");
A(12.35, "dra", "arm", { side: "R", pose: side(-1, 0.38), dur: 0.5, ease: "inOut" });
A(12.35, "dra", "arm", { side: "L", pose: side(1, 0.38), dur: 0.5, ease: "inOut" });
A(12.6, "dra", "expr", { expr: "kind", set: { curve: 0.55, open: 0.0, eye: 0.9, tilt: 0.35 }, dur: 0.3 });   // a sheepish grin
A(12.65, "dra", "face", { brow: 0.3, dur: 0.3 });
A(12.7, "dra", "look", { to: [0.35, 0.05], dur: 0.2, blink: false });
A(12.9, "dra", "still", { dur: 1.1, idle: 0.05 });
sfx(12.85, "plunk", { gain: 0.22, reason: "the dry 'dum' as his sheepish face is revealed" });
A(13.0, "phx", "still", { dur: 1.0, idle: 0.04 }); A(13.0, "rea", "still", { dur: 1.0, idle: 0.04 });

// ---------------------------------------------------------------- shots
const ZP = (t) => P.zAt(t);
const beats = c.beats([
  // a wide lens close to him: the camera has to stay between Dragon and his friends (Reaper is at z -3.4)
  ["1 the pumpkin lights", 0, frame([0, 0.72, DRA0[1]], { az: 0, el: 4, h: 1.75, fov: 60, push: 0.08, dur: 0.6 }), "hook"],
  ["2 they notice", 0.6, { pos: [0.02, 0.85, 0.4], look: [0.02, 0.7, -3.0], fov: 40 }, "reaction"],
  ["3 the hall", 1.2, { pos: [0, 1.85, 4.6], look: [0, 0.5, -3.6], fov: 44 }, "reveal"],
  ["4 slow motion", 2.0, { pos: [0, 0.5, r3(ZP(2.0) + 3.4)], look: [0, 0.85, r3(ZP(2.0) - 1.5)], fov: 48, to: { pos: [0, 0.5, r3(ZP(4.2) + 4.0)], look: [0, 0.85, r3(ZP(4.2) - 1.5)] }, dur: 2.2, ease: "linear" }],
  ["5 the sneeze", 4.2, { pos: [0, 1.45, 4.4], look: [0, 0.7, -3.6], fov: 46, to: { pos: [0, 1.4, 3.9] }, dur: 2.8, ease: "linear" }, "payoff"],
  ["6 out on the porch", 7.0, { pos: [0, 1.0, 5.8], look: [0, 0.75, -0.6], fov: 46 }],
  ["7 calm", 10.0, { pos: [0, 0.88, 6.1], look: [0, 0.75, 1.45], fov: 50, to: { pos: [0, 0.88, 5.9] }, dur: 2.0, ease: "linear" }, "reaction"],
  ["8 the pumpkin comes off", 12.0, { pos: [0, 1.75, 4.5], look: [0, 1.55, -0.4], fov: 42 }, "reaction"],
], END);

write(import.meta.url, {
  id: "dont-let-dragon-light-the-pumpkin",
  title: "Don't Let Dragon Light the Pumpkin",
  idea: "Eight trend tests #06 (Pray For Me slow-motion run): Dragon's pumpkin helmet lights up, his friends run in slow motion from the fire he sneezes",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  set: { type: "hallway", light: "golden", key: [4.2, 4.0, 2.6], wallZ: -30, shadowSize: 8, seed: 6 },
  // the hero music under the slow-motion run, cut when they hit normal speed at the threshold
  music: { file: "ai/hero-bed/hero-bed-02.ogg", from: 2.0, until: 7.0, gain: 0.55 },
  sound: { sfx: 0.7, ambience: 0.25, signature: { payoff: false } },
  hook: { show: ["dra", "helmet"], hint: 0.1, what: "a jack-o'-lantern's eyes light up and the potato under it puffs his cheeks" },
  creative: { length: [12, 20] },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "dra", with: "helmet", from: 0, to: END, reason: "Dragon wears the pumpkin over his head; it hides his eyes until he lifts it off (the brief)" },
  ],
  notes: "Generated by storyboards/pumpkin/make-dont-let-dragon-light-the-pumpkin.mjs.",
});
