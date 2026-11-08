// Pebble bends the lake, revision 2 (Jonny 8 Nov 2026, movement review package
// /mnt/project-files/pebble-waterbending-report-and-references-2026-11-08.zip: "replace that with a coherent settle ->
// gather -> draw -> redirect -> flow -> return phrase"). The baseline it replaces (commit 19c770f, CMU tai chi with long
// mirrored arms, a water column on a fixed base by the rock, a 45 degree turn to us for the line) is recorded in
// /mnt/project-files/videos/pebble/lake-02/baseline/BASELINE.md.
//
//   node storyboards/pebble/make-pebble-lake.mjs                 the clip
//   STAGE=0 node storyboards/pebble/make-pebble-lake.mjs         body only (no water)
//   STAGE=1 ...                                                  body + a thin wire along the water's intended path
//   STAGE=2 ...                                                  body + simple one-tone water (no drops, no splash)
//   WATER_ONLY=1 ...                                             the water alone (he is hidden)
//
// THE BRIEF (Jonny's earlier ones still hold: he faces the water first, every water move follows a visible hand move,
// the hands never come in closer to his chest than the draw-in, moving background, about 15 s)
//   Joke:        none: a calm clip. Pebble draws a ribbon of water out of the lake with slow, grounded tai chi hands,
//                leads it round in front of him and puts it back, saying one line.
//   Wants:       Pebble wants to move with the water, not force it.
//   Consequence: the water answers every gesture a moment later; its tail still follows where the leader has been.
//   Ending:      the ribbon pours back into the lake with a small splash, his hands settle after it, a small smile.
//   Callback:    the clip opens on the lake still and his hands low, and ends on the same still lake and low hands.
//
// The phrase (the review's 16 s timing table, tuned): settle 0-1, gather 1-3.2, draw 3.2-5.4, redirect 5.4-8.2,
// flow 8.2-12.2 (the line, with a short glance to us, the body keeps working), return 12.2-14.8, settle 14.8-16.
// Lead hand: his RIGHT (the near hand, up and forward; it draws the water's path in the picture plane). Support hand:
// his LEFT (the far hand, lower and further in; it follows a smaller related curve and moves into the space the lead
// hand leaves). Stage 1 had the lead on the far hand: from a three-quarter front view it hid behind his body.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { clip, write } from "../lib/clip.mjs";
import { play } from "../lib/moves/index.mjs";
import * as peb from "./pebble-acting.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, "../..");
const STAGE = Number(process.env.STAGE ?? 5);
// the template's house picks (Jonny's decisions to 8 Nov); feet planted all through (no steps, no pivots)
const FOCUS = false, LOOK = "sheet", FACES = "strong";
const MOTION = { feet: 2, overlap: true, timing: true, solve: true, feetTune: { body: 0, lean: 0, tip: 0 } };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const PHYSICS = true, LIGHTING = 2, HATCH = { boil: 0.25 };
const LIFE = "auto";
const LINES = { sub: true, blink: false, pos: 280 };

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see } = c;
const W = "peb", END = 16.0, KEY = 1 / 15;

// ---------------------------------------------------------------- places (lake-shore env; x right, z toward us)
// He stands on the bank a little left of centre, three-quarter to us, turned toward the water's working space (70: his face and both hands read; qa/framing.mjs wants 78 degrees or less) (the water he works is
// in front of him and to his left, over the lake). The source and the landing are in open water well beyond the
// shoreline and to the right of the foreground rock on screen (baseline: the source sat on the rock).
const AT = [0.05, -0.25], HEAD = 60;   // 60 (was 70): turned a little more to us so the far (support) hand shows in front of his belly
const cast = [{ id: W, character: "pebble/pebble", at: AT, face: HEAD, expr: "kind", follow: 0.3, seed: 1.3, span: 0 }];
// the water's path is laid out round x 0.66 and fitted into the frame: x pulled in 30 % toward his front and shifted with
// him (the painting allows no wider camera: qa/env.mjs)
// and (stage 2: the ribbon read small that far out) brought 0.3 m nearer while it works in the air (3.6-13.2 s)
const near = (t) => { const k = (u) => Math.max(0, Math.min(1, u)), e = (u) => k(u) * k(u) * (3 - 2 * k(u)); return 0.3 * e((t - 3.6) / 1.4) * (1 - e((t - 12.4) / 0.9)); };
const FIT = ([t, x, y, z]) => [t, 0.78 + (x - 0.66) * 0.7, y, z + near(t)];
const SRC = FIT([0, 1.35, 0, -2.2]).filter((_, i) => i === 1 || i === 3), LAND = FIT([0, 1.32, 0, -2.42]).filter((_, i) => i === 1 || i === 3);

// ---------------------------------------------------------------- curves: smooth through their keys (a cardinal spline
// with velocity carried through every key, so there is no stop at a key), periodic over the clip for the loop
function spline(K, t, period = END) {
  const n = K.length, key = (i) => { const k = ((i % n) + n) % n, w = Math.floor(i / n); return [K[k][0] + w * period, K[k].slice(1)]; };
  let i = 0; while (i < n - 1 && K[i + 1][0] <= t) i++;
  if (t < K[0][0]) i = -1;
  const [t0, p0] = key(i - 1), [t1, p1] = key(i), [t2, p2] = key(i + 1), [t3, p3] = key(i + 2);
  const h = t2 - t1, u = (t - t1) / h, u2 = u * u, u3 = u2 * u;
  return p1.map((v, j) => {
    const m1 = ((p2[j] - p0[j]) / (t2 - t0)) * h, m2 = ((p3[j] - p1[j]) / (t3 - t1)) * h;
    return (2 * u3 - 3 * u2 + 1) * v + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[j] + (u3 - u2) * m2;
  });
}
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------- the hands, in his own (unscaled) body space:
// [x out to that hand's side, y up from the ground, z forward], metres before his 1.5 scale. Keys at the phrase's beats.
// A hand leads the water's matching change by about 0.12 s (the review: water 2-4 frames after the hand).
const HAND = {
  // lead: his right, the near hand. From behind and low at his hip it scoops forward and up (30 cm of arc, 0.9-3 s),
  // draws back high (never in closer than the draw-in at 3.8 s), sweeps forward-high (the redirect), dips and rises
  // with the flow loop a beat ahead of the water through the line, then sweeps forward and down ahead of the dive,
  // its palm on the landing as the water goes in, and back to his hip. Fable review A: the two hands stacked on the
  // vest read as a clasp; from this camera only the lead's height and its gap from the parked support hand show.
  // Fable review B: the hand stays at or under his shoulder (0.5: it sat over his lower face at 0.6, the silhouette
  // was lost) and spends the draw on reaching forward; the gather starts at 0.5 s, the sweep under "Move with it."
  // starts at 10.5 s, and the hand lowers palm down ahead of the return (13.6 s)
  R: [[0.0, 0.33, 0.28, 0.07], [0.5, 0.31, 0.26, 0.02], [1.6, 0.3, 0.42, 0.24], [2.7, 0.27, 0.5, 0.31], [3.4, 0.25, 0.5, 0.18],
    [4.1, 0.25, 0.4, 0.22], [4.8, 0.27, 0.41, 0.29], [5.5, 0.28, 0.45, 0.33], [6.2, 0.27, 0.42, 0.33], [6.9, 0.26, 0.37, 0.33],
    [7.6, 0.25, 0.39, 0.32], [8.3, 0.25, 0.46, 0.3], [9.1, 0.26, 0.47, 0.29], [9.8, 0.27, 0.42, 0.27], [10.5, 0.27, 0.4, 0.3],
    [11.1, 0.25, 0.39, 0.32], [11.7, 0.26, 0.42, 0.32], [12.3, 0.28, 0.48, 0.33], [12.9, 0.3, 0.42, 0.33], [13.4, 0.32, 0.33, 0.29],
    [14.1, 0.33, 0.3, 0.18], [14.9, 0.33, 0.29, 0.1]],
  // support: his left, the far hand. Jonny 8 Nov: parked by the hip it was hidden behind his body all clip ("there is no
  // second arm"). It now comes forward under the lead, in front of his lower belly where the camera sees it, a hand
  // lower than the lead (holding the ball upright, never level with it: review A's stacked-hands clasp), and drifts
  // with the lead half a beat late. While he faces us on the line it is the hand on the water's side, so it lifts the sweep
  // (10.6-12.2 s) and the lead stays lower
  // Jonny 8 Nov (v3): "the second arm isn't doing much movement". Tai chi's support hand answers the lead instead of
  // waiting: it presses down palm-down as the lead scoops up (0.6-2.2 s), pushes forward and rises as the lead draws
  // back (2.7-4 s), sinks as the water comes to the lead (4.6-5.3 s), sweeps the other way, in toward his middle and
  // up, as the lead sends the water out (5.5-7.6 s), lifts the sweep while he faces us (10-12.3 s) and presses the water
  // home with the lead (12.9-13.4 s). Never level with the lead, never nearer his chest than the draw-in
  // Jonny 8 Nov (v4): "the second hand still doesn't do much". Low in front of the belly it moved, but the near arm
  // covered most of it. Like tai chi's cloud hands the two hands now trade heights: the support rises to chest height
  // while the lead sinks (the draw, 3.2-4.6 s, and the redirect, 6.2-7.6 s) and they pass each other, so the far hand
  // shows above the near arm; it lifts the sweep while he faces us
  L: [[0.0, 0.33, 0.28, 0.07], [0.6, 0.31, 0.29, 0.12], [1.3, 0.24, 0.27, 0.24], [2.2, 0.2, 0.3, 0.3], [3.2, 0.18, 0.4, 0.3],
    [4.0, 0.18, 0.5, 0.28], [4.6, 0.2, 0.46, 0.3], [5.3, 0.22, 0.3, 0.3], [6.2, 0.18, 0.42, 0.3], [6.9, 0.17, 0.5, 0.29],
    [7.6, 0.2, 0.47, 0.3], [8.3, 0.22, 0.36, 0.29], [9.4, 0.2, 0.34, 0.3], [10.0, 0.16, 0.3, 0.32], [10.6, 0.16, 0.4, 0.31],
    [11.1, 0.18, 0.48, 0.3], [11.7, 0.22, 0.5, 0.29], [12.3, 0.24, 0.42, 0.3], [12.9, 0.2, 0.34, 0.3], [13.4, 0.22, 0.26, 0.26],
    [14.0, 0.28, 0.28, 0.16], [14.9, 0.33, 0.285, 0.08]],
};
// the hands' shapes: the lead cups palm up under the rising water, opens as it draws, then guides palm down and forward
// (it never closes; a glove facing the water, not a fist); the support stays open and loose
const GRIPS_AT = [[0.0, "R", "relaxed", 0], [0.0, "L", "relaxed", 0], [0.35, "R", "cup", 0.6], [0.6, "L", "open", 0.6], [3.1, "R", "open", 0.5],
  [5.3, "R", "hover", 0.6], [14.1, "R", "open", 0.5], [14.7, "R", "relaxed", 0.6], [14.8, "L", "relaxed", 0.6]];
for (const [t, side, shape, dur] of GRIPS_AT) A(t, W, "grip", { side, shape, dur });
// his arm, from characters/pebble/pebble.json and the turnaround sheet (shoulder to wrist about 0.45 m at his 1.5 scale) (limbs.shoulder 0.42 on a 0.5 x 0.52 x 0.46 body, legs 0.14):
// the shoulder and a fixed arm length; a hand target never goes further than the arm reaches, and the elbow takes up
// the rest (the arm is a curve shoulder -> elbow guide -> hand: the guide is set so the curve keeps the arm's length,
// soft elbows that fold as the hand comes in). The review's "long rigid arms" were the arm stretched to a far target.
const BODY = { H: 0.5, rx: 0.26, rz: 0.23, leg: 0.14 }, SH = [0.23, 0.49, 0.04], ARM = 0.3, REACH = 0.95 * ARM;
// the support hand keeps a soft elbow (0.9 of the arm): near full reach the drawn elbow had no bend to keep and jumped
function arm(P, reach = REACH) {
  let [x, y, z] = P;
  // outside the body (its ellipsoid plus a glove's clearance), pushed out round it at the hand's height
  const cy = BODY.leg + BODY.H / 2, a = BODY.rx + 0.075, b = BODY.H / 2 + 0.075, cz = BODY.rz + 0.075;
  const k = (x / a) ** 2 + (z / cz) ** 2, room = 1 - ((y - cy) / b) ** 2;
  if (room > 0 && k < room) { const s = Math.sqrt(room / k); x *= s; z *= s; }
  // never further from the shoulder than the arm reaches
  let v = [x - SH[0], y - SH[1], z - SH[2]], d = Math.hypot(...v);
  if (d > reach) { v = v.map((q) => (q * reach) / d); d = reach; [x, y, z] = [SH[0] + v[0], SH[1] + v[1], SH[2] + v[2]]; }
  // the bend that keeps the curve's length: a quadratic's length ~ d + 8 s^2 / (3 d), s half the guide's offset
  const s = Math.sqrt(Math.max(0, (3 * d * (ARM - d)) / 8)), out = Math.min(0.2, Math.max(0.02, Math.sqrt(Math.max(0, (2 * s) ** 2 - 0.06 ** 2))));
  return { o: [r3(x - BODY.rx), r3((y - BODY.leg) / BODY.H), r3(z)], elbow: r3(out), margin: 1.05, d };
}

// ---------------------------------------------------------------- the body: weight, turn, settle (world metres and
// degrees). Small supported shifts: toward the water to gather, back as he draws, a modest turn to his left with the
// redirect and back through the flow, a settle forward as the water goes home. Shell and torso are one body: it turns
// and tips as a whole (no twist inside the shell). The feet stay planted; the shifts stay inside the stance.
const BODYK = {
  //    t     fwd    left   yaw   pitch  lean  crouch
  k: [[0.0, 0.0, 0.0, 0, 0, 0, 0.0], [0.5, 0.012, 0.0, 0, 1.5, 0, 0.28], [1.8, 0.03, -0.004, -2, 3.5, -1, 0.2], [3.0, 0.025, 0.0, -1, 2.5, 0, 0.24],
    [4.3, -0.018, 0.004, 1, -1.5, 0.5, 0.3], [5.4, -0.02, 0.006, 2, -2, 1, 0.26], [6.6, 0.006, 0.012, 9, 1, 2, 0.2], [7.7, 0.012, 0.014, 13, 1.5, 2, 0.22], [8.3, 0.01, 0.012, 0, 1.2, 1.8, 0.23],
    // Jonny 8 Nov (v2): he talks to us like in v1: the whole body turns toward the camera through the line (about 20
    // degrees after BK.turn: the eyes reach the lens from there; the planted gait takes one small pivot step into the
    // turn and one back out), the eyes on us, the hands keep the water going
    [8.9, 0.008, 0.01, -30, 1, 1.5, 0.24], [9.6, -0.008, 0.002, -44, -0.5, 0.5, 0.26], [10.5, -0.012, -0.004, -45, -1, -0.5, 0.24], [11.5, 0.004, 0.004, -40, 1, 0.5, 0.2],
    [12.3, 0.012, 0.006, -15, 2, 0.8, 0.24],
    [13.6, 0.026, 0.008, 6, 3.5, 1, 0.3], [14.5, 0.02, 0.004, 3, 2.5, 0.5, 0.26], [15.3, 0.004, 0.0, 0, 0.5, 0, 0.08]],
};
const N = Math.round(END * 30) + 1;
const mv = { name: "pebble-lake-phrase", fps: 30, len: END, human: { hipHalf: 0.11 }, path: [], yaw: [], pitch: [], lean: [], drop: [], head: [], hand: { R: [], L: [] }, feet: { R: [], L: [] } };
// the planted gait re-homes a foot (a step) once it would be 3 cm or 20 degrees off under the moving body
// (timeline.js GAIT trig): the root's own travel and turn stay under that (x 0.45: 1.4 cm, 6 degrees), and the weight
// shift reads mostly as the body tipping over the feet (pitch and lean x 1.5) and the legs bending
const BK = { move: 0.45, turn: 0.45, tip: 1.5 };
for (let i = 0; i < N; i++) {
  const [f, l, yaw, pitch, lean, crouch] = spline(BODYK.k, i / 30);
  mv.path.push([f * BK.move, l * BK.move]); mv.yaw.push(yaw * BK.turn); mv.pitch.push(pitch * BK.tip); mv.lean.push(lean * BK.tip); mv.drop.push(crouch); mv.head.push([0, 0]);
}
// scale 1: the path is in metres; pitch, lean, crouch as written; hands and eyes are keyed below
play(c, 0, W, mv, { from: AT, heading: HEAD, char: "pebble/pebble", range: [0, END - 0.1], dur: END - 0.1, scale: 1, pitch: 1, pitchMax: 8, lean: 1, crouch: 1, hands: false, eyes: false, feet: true });

// the hands every 1/15 s along their curves (linear between: the curve itself is smooth)
const reachLog = { L: 0, R: 0 };
for (let t = 0; t <= END - 0.1 + 1e-6; t += KEY) {
  for (const sd of ["L", "R"]) {
    const P = arm(spline(HAND[sd], t), sd === "L" ? 0.9 * ARM : REACH); reachLog[sd] = Math.max(reachLog[sd], P.d);
    A(r3(t), W, "arm", { side: sd, pose: { o: P.o, elbow: P.elbow, margin: P.margin }, dur: t === 0 ? 0 : KEY, ease: "linear", lead: false });
  }
}

// ---------------------------------------------------------------- the water's leader (world metres, seconds): under the
// surface at the source, up as a curved tongue (gather), drawn in toward him on a C (draw: the neck pinches off as the
// tail climbs out), swept out to his left (redirect: the leader turns first, the tail still on the old line), back round
// in a soft reversing loop through the line (flow), down into the lake (return). Clear of his hands, face and shell.
// Fable review B: the gather breaks the surface at 1.0 s (a dome from 0.45 s), the leader never stalls (the ribbon
// bunched into a blob where it slowed at 5 and 10.5 s): one continuous figure of eight through the draw, the redirect
// and the flow, laid across the frame (up and down, left and right) rather than toward and away from the camera, where
// a loop folds onto itself on screen; it passes just beyond the lead hand's fingertips at 5.4 s, at palm height and
// clear of his face on screen, before it is sent out; the sweep rises
// under "Move with it." and the return pours in at 13.6 s
const LEAD = [[0.0, 1.35, -0.35, -2.2], [0.45, 1.35, -0.2, -2.2], [1.0, 1.33, -0.02, -2.15], [1.6, 1.18, 0.3, -1.95],
  [2.3, 1.0, 0.55, -1.75], [2.9, 0.92, 0.76, -1.58], [3.6, 0.84, 0.86, -1.2], [4.2, 0.74, 0.84, -0.95], [4.8, 0.58, 0.78, -0.62],
  [5.4, 0.7, 0.72, -0.1], [5.9, 0.92, 0.84, -0.3], [6.4, 1.2, 0.98, -0.6], [6.9, 1.45, 1.08, -0.9],
  [7.4, 1.6, 1.1, -1.2], [7.9, 1.58, 0.95, -1.45], [8.4, 1.4, 0.78, -1.5], [9.0, 1.05, 0.64, -1.35], [9.6, 0.75, 0.68, -1.15],
  [10.1, 0.7, 0.84, -1.0], [10.6, 0.92, 1.0, -0.95], [11.1, 1.25, 1.08, -1.05], [11.6, 1.52, 1.0, -1.3], [12.1, 1.62, 0.84, -1.65],
  [12.6, 1.55, 0.62, -2.0], [13.1, 1.42, 0.36, -2.3],
  [13.6, 1.34, 0.05, -2.42], [13.85, 1.32, -0.12, -2.43], [15.0, 1.3, -0.4, -2.45], [16.0, 1.29, -0.5, -2.45]].map(FIT);
// the leader is a plain (non-periodic) track: it starts and ends under the lake
const leadAt = (t) => { const K = LEAD; if (t <= K[0][0]) return K[0].slice(1); if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] <= t) i++;
  const P = (j) => K[Math.max(0, Math.min(K.length - 1, j))], [t0, ...p0] = P(i - 1), [t1, ...p1] = P(i), [t2, ...p2] = P(i + 1), [t3, ...p3] = P(i + 2);
  const h = t2 - t1, u = (t - t1) / h, u2 = u * u, u3 = u2 * u;
  return p1.map((v, j) => { const m1 = i === 0 ? 0 : ((p2[j] - p0[j]) / (t2 - t0)) * h, m2 = i + 2 >= K.length ? 0 : ((p3[j] - p1[j]) / (t3 - t1)) * h;
    return (2 * u3 - 3 * u2 + 1) * v + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[j] + (u3 - u2) * m2; }); };
const track = []; for (let i = 0; i <= END * 30; i++) { const t = i / 30, p = leadAt(t); track.push([r3(t), r3(p[0]), r3(p[1]), r3(p[2])]); }
// tail: 2.6 s of the leader's past (stage 2: 1.9 s read as a short tadpole) (a finite ribbon); it shortens as the water pours home, so the tail catches up and
// follows the leader in instead of hanging on
// (Fable review A: a short tail first, so the neck pinches off at about 3 s as the hand draws back instead of
// hanging by a thread to 3.9 s; the return lands at 13.4 s so its ripples and the splash drops' rings have faded before the loop's seam)
// (Fable review B: longer from 5 s so the ribbon stays a ribbon; it pours in whole by 14.4 s)
const TAIL = [[0, 1.0], [1.9, 1.0], [2.7, 1.7], [4.0, 2.6], [5.0, 3.4], [12.3, 3.4], [13.5, 2.0], [14.4, 0.8]];
const props = [];
if (STAGE >= 1) {
  const one = STAGE === 2 ? { colors: { deep: "#6fb6cc", mid: "#8ccbdc", light: "#8ccbdc", foam: "#8ccbdc" } } : {};
  const stream = STAGE === 1 ? { path: track, mode: "ribbon", tail: TAIL, r: 0.012, v0: 0.6, drops: 0, splash: 0, seed: 1 }
    : { path: track, mode: "ribbon", tail: TAIL, r: 0.13, taper: 0.45, v0: 0.4, drops: STAGE === 2 ? 0 : 5, dropsTo: 13.6, splash: STAGE === 2 ? 0 : 12, seed: 1 };
  // the surface answering before the water lifts (end of the settle)
  // (Fable review B: bigger and earlier, a second one as it breaks the surface, so the first second reads on a phone)
  const rings = STAGE >= 3 ? [[0.35, SRC[0], SRC[1], 0.7, 1], [0.85, SRC[0], SRC[1], 0.6, 1]] : [];
  props.push({ id: "water", kind: "waterbend", x: 0, y: 0, z: 0, rot: 0, level: 0, wet: [[-3, -12, 3, -1.0]], rings, light: STAGE === 1 ? 0 : 2.4, ...one, streams: [stream],
    staged: "water: the bent water out of the painted lake, it rests on nothing" });
}

// ---------------------------------------------------------------- the eyes: on the water's leader all through, a little
// ahead of it (the eyes lead the hands, the hands lead the water); one short glance to us on the line while the body and
// hands keep the flow going; a smile to us as the lake settles
const EYE = 1.24;
function lookAtWater(t) {
  const [x, y, z] = leadAt(Math.min(t + 0.25, END)), yaw = spline(BODYK.k, t)[2] * BK.turn, h = ((HEAD + yaw) * Math.PI) / 180;
  const F = [Math.sin(h), Math.cos(h)], L = [Math.cos(h), -Math.sin(h)], dx = x - AT[0], dz = z - AT[1];
  const fw = dx * F[0] + dz * F[1], lf = dx * L[0] + dz * L[1], az = (Math.atan2(lf, fw) * 180) / Math.PI, el = (Math.atan2(Math.max(y, 0) - EYE, Math.hypot(fw, lf)) * 180) / Math.PI;
  return [r3(Math.max(-0.9, Math.min(0.9, az / 40))), r3(Math.max(-0.8, Math.min(0.8, el / 40)))];
}
const GLANCE = [8.6, 12.0], SMILE = 15.2;
A(0, W, "look", { to: [-0.6, 0], dur: 0, blink: false });                       // frame 0: the look the clip ends on
A(0.15, W, "look", { to: [0.5, -0.4], dur: 0.35, blink: false });                // to the lake where the water will come
for (let t = 0.6; t < END; t += 0.2) {
  if (t >= GLANCE[0] && t < GLANCE[1]) continue;
  if (t >= SMILE) break;
  A(r3(t), W, "look", { to: lookAtWater(t), dur: 0.2, ease: "linear", blink: false });
}
// to us through the whole line (Jonny 8 Nov: like v1), following his own turn so the eyes stay on the lens
const CAMP = [0.3, 1.5, 4.4];
function lookAt([x, y, z], t) {
  const yaw = spline(BODYK.k, t)[2] * BK.turn, h = ((HEAD + yaw) * Math.PI) / 180;
  const F = [Math.sin(h), Math.cos(h)], L = [Math.cos(h), -Math.sin(h)], dx = x - AT[0], dz = z - AT[1];
  const fw = dx * F[0] + dz * F[1], lf = dx * L[0] + dz * L[1], az = (Math.atan2(lf, fw) * 180) / Math.PI, el = (Math.atan2(y - EYE, Math.hypot(fw, lf)) * 180) / Math.PI;
  return [r3(Math.max(-0.9, Math.min(0.9, az / 40))), r3(Math.max(-0.8, Math.min(0.8, el / 40)))];
}
A(GLANCE[0], W, "look", { to: lookAt(CAMP, GLANCE[0] + 0.3), dur: 0.3, blink: false });
for (let t = GLANCE[0] + 0.4; t < GLANCE[1]; t += 0.2) A(r3(t), W, "look", { to: lookAt(CAMP, t), dur: 0.2, ease: "linear", blink: false });
A(SMILE, W, "look", { to: [-0.6, 0], dur: 0.45, blink: false });
A(15.3, W, "expr", { expr: "kind", set: { curve: 0.7 }, dur: 0.4 });
A(0, W, "expr", { expr: "kind", set: { curve: 0.7 }, dur: 0 });
A(0.3, W, "expr", { expr: "kind", dur: peb.SLOW });

// evidence pass: WATER_ONLY=1 hides him, so the water's own motion can be judged without the body
if (process.env.WATER_ONLY) A(0, W, "hide");

// ---------------------------------------------------------------- the line (our own words, as delivered)
A(0, W, "noblink");
A(8.3, W, "face", { lid: peb.LID, dur: 0.3 });
c.macro(8.4, W, "say", { line: "Never push. Move with it.", tone: "calm", pos: 280 });

// ---------------------------------------------------------------- sound: each named sound on what the water does
if (STAGE >= 4 || STAGE === 0) {
  sfx(0.35, "bubbling", { gain: 0.1, dur: 0.7, reason: "the lake stirs where the water is about to lift" });
  sfx(1.0, "bubbling", { gain: 0.3, dur: 1.7, reason: "the tongue of water draws up out of the lake" });
  sfx(13.6, "splash", { gain: 0.8, reason: "the water's leader goes back into the lake: a small splash" });
  sfx(14.1, "ai/drip", { gain: 0.4, reason: "the splash's drops falling back in" });
}

if (STAGE >= 1) see(1.0, 3.0, [`${W}.face`, W, "water"], "the water lifts out of the open lake as his lead hand scoops");
see(8.4, 12.2, [`${W}.face`], "his line while the water keeps flowing");

// ---------------------------------------------------------------- one locked camera (lake-shore range: qa/env.mjs --range):
// the widest the painting allows (pulling back shows the painted floor's edge); he stands further in and to the right
// so his feet, shell and garden are in, with room over the lake for the whole water path and its landing
const CAM = process.env.CAM ? JSON.parse(process.env.CAM) : { pos: [0.3, 1.5, 4.4], look: [0.45, 0.85, -0.3], fov: 42 };
const beats = c.beats([
  ["settle and gather", 0, CAM, "hook"],
  ["draw", 3.0, CAM],
  ["redirect", 5.4, CAM, "reveal"],
  ["the line", 8.4, CAM, "payoff"],
  ["home", 12.2, CAM],
], END);

const id = "pebble-lake";
write(import.meta.url, {
  id, title: "Pebble bends the lake",
  idea: "Pebble draws a ribbon of water out of the lake with slow tai chi hands, leads it round and puts it back, with one line about life",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true,
  ...(MOTION && { motion: MOTION }), ...(RIG && { rig: RIG }), ...(PHYSICS && { physics: true }),
  creative: { length: [8, 20] },
  set: { type: "env", env: "lake-shore", shade: "soft", aperture: FOCUS ? 0.045 : 0, focus: false, lighting: LIGHTING, hatch: HATCH, life: LIFE },
  music: { pool: "calm-landscape", ...peb.MIX.music },
  sound: { ...peb.MIX.sound, surface: "grass" },
  hook: { show: STAGE >= 1 ? [W, "water"] : [W], hint: 1.0, what: "the lake rises to his hand" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  notes: `Generated by storyboards/pebble/make-pebble-lake.mjs (stage ${STAGE}). Lead hand right (near), support left (far); arm reach ${r3(reachLog.L)} / ${r3(reachLog.R)} of ${ARM} (unscaled m).`,
});
if (process.env.STAGE_OUT) fs.copyFileSync(path.join(HERE, "pebble-lake.json"), process.env.STAGE_OUT);
