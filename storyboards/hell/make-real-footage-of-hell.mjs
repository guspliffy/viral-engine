// REAL FOOTAGE OF HELL (Jonny's brief, 30 Oct 2026; /mnt/project-files/ENGINE-PROMPT.md), built from the clip template.
// node storyboards/hell/make-real-footage-of-hell.mjs -> storyboards/hell/real-footage-of-hell.json
//
// THE BRIEF (exactly 8 s, first-person handheld camera at potato eye height; the viewer is the camera operator)
//   Joke:        the camera follows Reaper into what looks like hell; it is a giant deep fryer.
//   Wants:       Reaper wants the camera to see it; the camera wants to know what the glow and the shadows are.
//   Consequence: the crispy potato in the basket is delighted: a serene smile and a thumbs-up.
//   Ending:      the frightened camera flees, Reaper with it (a hard cut at 8.00, no loop).
//
//   1 0.00-2.00  FOLLOW ME: running down the red tunnel, Reaper jogs backwards waving us on, turns and runs; a pipe
//                spits fire beside him, he flinches and keeps going, the camera dips                 (steps, fwoosh)
//   2 2.00-2.80  STEAM: a close-up of a jet of fire from a pipe (Jonny, 30 Oct: fire, not steam)        (fwoosh)
//   3 2.80-4.00  SHADOWS: big potato-shaped shadows bobbing on the wall ahead through steam            (bubbling)
//   4 4.00-6.00  THE FRYER: wide from the tunnel mouth: the vat, bubbling oil, bobbing potatoes, flames under it,
//                the basket down in the oil on its chain; Reaper at the railing for scale              (roar)
//   5 6.00-7.40  HE LOVES IT: closer on the same basket; it rises, dripping; the crispy potato inside smiles at the
//                lens and gives a thumbs-up; the camera nearly still                    (music out, drips, chime)
//   6 7.40-8.00  NOPE: the camera drops to waist height, whips round to the tunnel and runs; Reaper's boots and hem
//                lead us out                                                          (sting, gasp, running steps)
//
// Departures from Jonny's text (ENGINE-PROMPT.md marks the first four as allowed changes): the caption "real footage
// of hell" is on screen 0-2 s; a music bed (a string-and-choir swell) runs 0-6 s and a panic sting lands at 7.4; the
// last shot is not motion blurred (Jonny 30 Oct: "motion blur is not needed"), so the boots and hem stay readable.
//
// Blocking (x right, z toward the start of the tunnel, y up; set-furnace.js FURNACE; Jonny's six-panel storyboard):
// the tunnel runs from its exit (z 13) to the mouth (z -5), then on as a raised walkway along the chamber's left side;
// the long vat stands beside it (x 0.6-3.3), the basket hangs at its far end. The camera runs toward -z down the
// tunnel and onto the walkway; Reaper runs ahead and stops at REA_SPOT; the camera walks on past him for the basket,
// so when it whips round he is ahead of it on the way out.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { FURNACE as F } from "../../engine/page/set-furnace.js";

const c = clip(), { A, sfx } = c;
const END = 8.0;
const EYE = 0.72;                                        // potato eye height (lookdev/reaper-crisp: LEG_H + 0.56 * 1.04)
const V = F.vat, BK = F.basket;

// ---------------------------------------------------------------- places
const REA0 = [0.32, 1.95], REA_SPOT = [-0.62, -7.2];   // he stops on the walkway beside the vat (panel 4)
const SUB_Y = r3(V.oil - 1.45), UP_Y = r3(V.oil + 0.25);  // the basket's floor: deep in the oil, and raised clear of it
const SPUD_YAW = -44, BASKET_ROT = -54;                  // the crispy potato faces the shot-5 camera; the basket's bail runs across the screen

// ---------------------------------------------------------------- Reaper's run (one `run` action, so the legs never stop)
const sm = (u) => u * u * (3 - 2 * u);
const ramp = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * ((t - t0) / (t1 - t0)); } return keys.at(-1)[1]; };
function runPath(t0, z0, zEnd, speeds, x, brake) {
  const pts = []; let z = z0, t = t0;
  for (; z > zEnd + 0.55 && t < END; t += 0.05) { pts.push([t, z]); z -= ramp(t, speeds) * 0.05; }
  const tStop = t, zStop = z;
  for (let k = 1; k <= 8; k++) { const u = k / 8; pts.push([tStop + u * brake, zStop + (zEnd - zStop) * (1 - (1 - u) * (1 - u))]); }
  return pts.map(([t, z]) => [r3(t), r3(x(t, z)), r3(z)]);
}
// he jogs backwards facing us (0-1.0), then turns and runs: a sidestep away from the vent at 1.45, then over to the
// left half once past z -2.6 and out along the bridge
const lane = (t, z) => 0.35 + 0.27 * sm(Math.min(1, Math.max(0, (t - 1.45) / 0.3))) + (REA_SPOT[0] - 0.62) * sm(Math.min(1, Math.max(0, (-2.4 - z) / 2.2)));
const BACKPEDAL = [[0, REA0[0], REA0[1]], [0.5, 0.33, 1.45], [1.0, 0.35, 0.95]];
const FWD = runPath(1.0, 0.95, REA_SPOT[1], [[1.0, 1.6], [1.2, 3.2], [3.8, 3.2]], lane, 0.55);
const PATH = [...BACKPEDAL.slice(0, -1), ...FWD];
const RATE = [[0, 2.6], [0.9, 2.4], [1.05, 3.6], [3.6, 3.6], [3.95, 1.6]];
const RUN = { t0: 0, t1: PATH.at(-1)[0], rate: RATE };
A(0, "rea", "run", { pts: PATH, rate: RATE, stride: 1.6, bob: 0.03, dur: RUN.t1 });
const reaAt = (t) => PATH.find((p) => p[0] >= t) || PATH.at(-1);

const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: 8, expr: "shocked", follow: 0.25, seed: 3.3, arms: { R: { o: [0.1, 0.62, 0.34] } } },
  { id: "spud", character: "hell/crispy-spud", at: [BK.x, BK.z], y: SUB_Y, face: SPUD_YAW, expr: "kind", follow: 0, seed: 5.2, signature: false },
];
const props = [
  { id: "oil", kind: "fryoil", x: V.x, y: V.oil, z: V.z, w: r3(V.w - 0.2), d: r3(V.d - 0.2) },
  // the flames roar in the burner's windows under the vat (they never come out of the oil): the walkway side, the front
  { id: "flames", kind: "burnerflames", x: r3(V.x - V.w / 2 - 0.08), y: r3(F.floor + 0.06), z: V.z, rot: -90, w: 0.44, h: 0.3, at: F.windows.map((z) => [r3(z - V.z), 0]) },
  { id: "flames2", kind: "burnerflames", x: V.x, y: r3(F.floor + 0.06), z: r3(V.z + V.d / 2 + 0.08), w: 0.44, h: 0.3, xs: F.frontWindows.map((x) => r3(x - V.x)) },
  { id: "basket", kind: "fryerbasket", x: BK.x, y: SUB_Y, z: BK.z, rot: BASKET_ROT, w: 1.3, d: 1.05, h: 0.45, bail: 1.62, top: r3(F.gantry.y - 0.36), oil: V.oil,
    // French fries in the basket with him (Jonny, 30 Oct): leaning on the side walls, clear of the bail posts, and a row at the back
    fries: [[-0.57, 0.3, 0, 0.1, 0.55], [-0.56, -0.25, -10, 0.1, 0.6], [0.57, 0.3, 0, -0.1, 0.55], [0.56, -0.24, 12, -0.1, 0.5], [-0.05, -0.42, 90, -0.3, 0.55], [0.2, -0.42, 80, -0.22, 0.5], [-0.28, -0.43, 100, -0.26, 0.48]] },
  { id: "spud1", kind: "bobspud", x: 1.25, y: r3(V.oil + 0.04), z: -6.6, r: 0.3, seed: 1 },
  { id: "spud2", kind: "bobspud", x: 2.6, y: r3(V.oil + 0.03), z: -7.0, r: 0.34, seed: 2 },
  { id: "spud3", kind: "bobspud", x: 1.6, y: r3(V.oil + 0.02), z: -8.1, r: 0.28, seed: 3, amp: 0.04 },
  { id: "spud4", kind: "bobspud", x: 2.75, y: r3(V.oil + 0.03), z: -8.5, r: 0.31, seed: 4 },
  { id: "spud5", kind: "bobspud", x: 1.1, y: r3(V.oil + 0.03), z: -10.5, r: 0.27, seed: 5, amp: 0.045 },
  // fries floating in the oil among the potatoes
  { id: "fries", kind: "fryfloat", x: V.x, y: V.oil, z: V.z, at: [[-0.55, 1.35, 30], [0.2, 0.9, -50], [0.45, 2.1, 80], [-0.75, -0.2, 10], [0.95, -0.3, -20], [-0.9, -2.3, 60], [0.05, 0.1, 110]] },
  // the tunnel's pipes spit fire (Jonny, 30 Oct: "there should come fire out of these pipes")
  { id: "vent1", kind: "steamjet", fire: true, x: r3(F.vents.shot1[0] + 0.28), y: F.vents.shot1[1], z: F.vents.shot1[2], len: 1.0, width: 0.22 },
  { id: "vent2", kind: "steamjet", fire: true, x: r3(F.vents.shot2[0] + 0.28), y: F.vents.shot2[1], z: F.vents.shot2[2], len: 1.1, width: 0.26, puffs: 22 },
  { id: "shadows", kind: "spudshadows", x: r3(F.half - 0.05), y: 1.5, z: -4.1, rot: -90, w: 3.0, h: 1.5, hot: 0 },
  { id: "vathaze", kind: "steamhaze", x: V.x, y: r3(V.oil + 0.3), z: r3(V.z - 0.8), w: 2.2, d: 3.4, r: 0.8, a: 0.1, n: 5 },
];

// ---------------------------------------------------------------- 1 FOLLOW ME (0-2.0)
c.cap(0, 2.0, "real footage of hell", 250, false, { kinetic: false });
// jogging backwards, he waves us on twice: the hand out toward us, then up and back over his shoulder (the way to go)
const NEAR = { o: [0.1, 0.62, 0.34] }, OVER = { o: [0.3, 0.98, 0.1] };
A(0, "rea", "grip", { side: "L", shape: "relaxed", dur: 0.01 }); A(0, "rea", "grip", { side: "R", shape: "flat", dur: 0.01 });
A(0, "rea", "look", { to: [0, 0.02], dur: 0.01, blink: false });
A(0, "rea", "face", { lid: 0.1, brow: 0.45, dur: 0.01 });   // worried (panel 1): brows up, mouth open in a frown
A(0, "rea", "expr", { expr: "shocked", set: { open: 0.14, curve: -0.25, eye: 1.08 }, dur: 0.01 });
c.arm(0, "rea", "R", NEAR, 0.01);
c.arm(0.06, "rea", "R", OVER, 0.24, "inOut"); c.arm(0.34, "rea", "R", NEAR, 0.2, "inOut");
c.arm(0.56, "rea", "R", OVER, 0.24, "inOut"); c.arm(0.82, "rea", "R", "rest", 0.25, "inOut");
A(0.82, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(0.3, "rea", "squash", { amount: 0.05, dur: 0.25 });   // an urgent little bounce on the second wave
// he turns and runs (eyes first), arms pumping
A(0.86, "rea", "look", { to: [0.5, 0], dur: 0.1, blink: false });
A(0.88, "rea", "turn", { to: 180, dur: 0.3, ease: "inOut" });
A(1.0, "rea", "pitch", { to: 9, dur: 0.25 });
A(0.95, "rea", "grip", { side: "both", shape: "fist", dur: 0.3 });
act.pump(c, "rea", { ...RUN, t0: 1.05 }, { until: 4.05 });
// the pipe beside him spits fire: he flinches (a hop and a lean away from it) and keeps running
const VENT = 1.42;
c.prop(VENT, "vent1", { jet: 1 }, 0.06, "out"); c.prop(r3(VENT + 0.5), "vent1", { jet: 0.25 }, 0.4); c.prop(r3(VENT + 1.0), "vent1", { jet: 0 }, 0.3);
sfx(r3(VENT - 0.02), "flamejet", { gain: 0.6, dur: 0.7, pan: -0.5, reason: "the pipe on the left spits a jet of fire beside Reaper (1.42): fwoosh" });
A(r3(VENT + 0.04), "rea", "hop", { height: 0.1, dur: 0.34 });
A(r3(VENT + 0.04), "rea", "lean", { to: 14, dur: 0.12, ease: "out" }); A(r3(VENT + 0.3), "rea", "lean", { to: 0, dur: 0.3, ease: "inOut" });
sfx(r3(VENT + 0.08), "gasp", { gain: 0.35, reason: "the camera operator's startled breath as the vent fires (the camera dips)" });

// ---------------------------------------------------------------- 2 STEAM (2.0-2.8)
c.prop(2.05, "vent2", { jet: 1 }, 0.05, "out"); c.prop(2.55, "vent2", { jet: 0.55 }, 0.25); c.prop(2.85, "vent2", { jet: 0 }, 0.3);
sfx(2.03, "flamejet", { gain: 0.85, dur: 0.8, reason: "the fire jet bursts from the pipe in the close-up (2.05): fwoosh" });

// ---------------------------------------------------------------- 3 SHADOWS (2.8-4.0)
sfx(2.8, "bubbling", { gain: 0.45, dur: 1.25, reason: "off screen ahead: the oil bubbling, growing louder as the shadows bob on the wall" });

// ---------------------------------------------------------------- 4 THE FRYER (4.0-6.0)
sfx(4.0, "bubbling", { gain: 1.0, dur: 2.0, reason: "the giant fryer's oil bubbling (the reveal)" });
sfx(4.0, "ai/flare", { gain: 0.5, reason: "the burner flames roar under the vat as it is revealed (4.0)" });
// on the walkway Reaper turns to the vat, shocked (panel 4), then back to us (see?), then to the vat again
A(r3(RUN.t1 - 0.15), "rea", "pitch", { to: 0, dur: 0.3, ease: "settle" });
A(3.98, "rea", "look", { to: [0.4, -0.1], dur: 0.12, blink: false });
A(4.02, "rea", "turn", { to: 115, dur: 0.3, ease: "settle" });
A(4.1, "rea", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2, curve: -0.2 }, dur: 0.15 }); A(4.1, "rea", "face", { lid: 0, brow: 0.5, dur: 0.15 });
act.emote(c, 4.3, "rea", "!", { dur: 0.8 });
A(4.75, "rea", "still", { dur: 0.45, idle: 0.08 });
A(5.15, "rea", "look", { to: [-0.3, 0.02], dur: 0.12, blink: false });
A(5.2, "rea", "turn", { to: -8, dur: 0.35, ease: "settle" });
A(5.25, "rea", "expr", { expr: "shocked", set: { open: 0.12, eye: 1.1, curve: -0.25 }, dur: 0.2 });
// the basket's chain lurches up (5.7) and a sprout pokes out of the oil: Reaper's eyes snap to it, so the eye is on the basket when we cut to it
A(5.65, "rea", "look", { to: [0.55, -0.25], dur: 0.08, blink: false });
A(5.72, "rea", "lean", { to: -8, dur: 0.15, ease: "out" });
c.prop(5.7, "basket", { y: r3(V.oil - 0.95) }, 0.2, "out");   // the chain lurches up: his sprout breaks the surface
act.blinksAt(c, "rea", [3.3]);

// ---------------------------------------------------------------- 5 HE LOVES IT (6.0-7.4)
// the basket rises straight up out of the oil (6.0-6.6), dripping; the crispy potato inside rides it
A(0, "spud", "ride", { prop: "basket", off: [0, 0.02, 0], yaw: SPUD_YAW - BASKET_ROT, dur: 0 });
c.prop(6.0, "basket", { y: UP_Y }, 0.6, "inOut");
c.prop(6.0, "basket", { spill: 1 }, 0.05);
c.prop(6.9, "basket", { spill: 0.45 }, 0.5);
A(0, "spud", "look", { to: [0, 0], dur: 0.01, blink: false });
A(0, "spud", "face", { lid: 0.32, dur: 0.01 });
A(0, "spud", "expr", { expr: "kind", set: { curve: 0.5, open: 0, eye: 0.95 }, dur: 0.01 });
act.blinksAt(c, "spud", []);
A(6.55, "spud", "squash", { amount: 0.06, dur: 0.22 });      // the basket stops: a little settle
// the thumbs-up: the arm comes up in front, the fist closes with the thumb straight up, above the rim
// thumbs-up beside his face as the basket stops (panel 5): the fist out to his right, clear of his body, locked in the
// basket's frame (the camera looks along the basket's +z) with the knuckles toward us and a little out and the palm
// turned in, so the thumb points straight up in silhouette whatever the forearm does
const THUMB = { prop: "basket", grip: [-0.3, 0.78, 0.38], frame: { y: [-0.5, 0, 0.87], z: [0.87, 0, 0.5] } };
A(6.42, "spud", "look", { to: [0.03, 0.04], dur: 0.1, blink: false });   // eyes first: a tiny glance at us before the thumb
A(6.5, "spud", "grip", { side: "R", shape: "thumb", dur: 0.2 });
c.arm(6.55, "spud", "R", THUMB, 0.22, "settle");
A(6.45, "spud", "expr", { expr: "kind", set: { curve: 0.9, open: 0, eye: 0.9, tilt: 0.1 }, dur: 0.25 });
A(6.45, "spud", "face", { lid: 0.5, dur: 0.25 });
A(6.62, "spud", "still", { dur: 0.75, idle: 0.04 });
sfx(6.62, "ding", { gain: 0.32, reason: "one tiny cheerful chime as the thumbs-up lands (6.6)" });
for (const [t, g] of [[6.66, 0.18], [6.83, 0.15], [6.98, 0.17], [7.12, 0.13], [7.27, 0.15]]) sfx(t, "ai/drip", { gain: g, reason: "oil drips from the raised basket back into the vat" });

// ---------------------------------------------------------------- 6 NOPE (7.4-8.0)
// Reaper (behind the camera, off screen) turns and flees with it; after the whip he runs ahead of us, his boots and
// hem leading us out (panel 6)
const FLEE = 6.95, FLEE_PTS = [[0, REA_SPOT[0], REA_SPOT[1]], [0.2, -0.6, -6.7], [0.4, -0.58, -6.0], [0.62, -0.56, -5.2], [0.82, -0.55, -4.4], [1.03, -0.55, -3.6]];
A(r3(FLEE - 0.06), "rea", "look", { to: [0, 0], dur: 0.08, blink: false });
A(FLEE, "rea", "turn", { to: 0, dur: 0.15, ease: "inOut" });
A(FLEE, "rea", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.2 }, dur: 0.12 });
A(r3(FLEE + 0.02), "rea", "run", { pts: FLEE_PTS, rate: [[0, 3.0], [0.15, 3.8]], stride: 2.0, bob: 0.035, dur: 1.03 });
A(r3(FLEE + 0.02), "rea", "pitch", { to: -12, dur: 0.15 });
act.pump(c, "rea", { t0: r3(FLEE + 0.02), t1: r3(FLEE + 1.03), rate: [[0, 3.0], [0.15, 3.8]] }, { rest: false, until: 7.98 });
sfx(7.4, "sting", { gain: 0.5, reason: "the panic sting as the camera flees (7.4)" });
sfx(7.41, "gasp", { gain: 0.5, reason: "the camera operator's short startled breath" });
sfx(7.42, "whoosh", { gain: 0.45, reason: "the whip pan back toward the tunnel (7.4-7.6)" });
// the operator's own running steps (Reaper's steps are automatic from his run)
for (let k = 0; k < 6; k++) sfx(r3(0.08 + k * 0.31), "step-concrete", { gain: 0.32, reason: "the camera operator's running steps (first-person shot)" });
for (let k = 0; k < 3; k++) sfx(r3(7.62 + k * 0.12), "step-concrete", { gain: 0.38, reason: "the camera operator's running steps as it flees" });

// ---------------------------------------------------------------- shots: [name, start, camera, kind?]
// the first-person camera: `hand` makes it handheld (timeline.js cameraState): footfall rate, bob, sway, roll (deg)
const RUNNING = { rate: 3.2, bob: 0.035, sway: 0.03, roll: 2.2, tilt: -1.2 };
const beats = c.beats([
  ["1 follow me", 0, { pos: [0.08, EYE, 4.6], look: [0.12, 0.82, -2.3], fov: 60, to: { pos: [0.08, EYE, 1.1], look: [0.1, 0.8, -5.8] }, dur: 2.0, ease: "linear",
    hand: { ...RUNNING, dips: [[1.46, 0.07, 0.32]] } }, "hook"],
  ["2 steam", 2.0, { pos: [-0.46, 0.98, -1.25], look: [-1.0, 1.08, -2.32], fov: 52, to: { pos: [-0.5, 0.98, -1.4] }, dur: 0.8, ease: "out",
    hand: { rate: 2.4, bob: 0.012, sway: 0.01, roll: 1.0, drift: 0.004 } }],
  ["3 shadows", 2.8, { pos: [-0.3, EYE, -0.9], look: [1.25, 1.62, -3.3], fov: 58, to: { pos: [-0.3, EYE, -2.3], look: [1.25, 1.55, -4.8] }, dur: 1.2, ease: "linear",
    hand: { rate: 3.0, bob: 0.028, sway: 0.024, roll: 1.8, tilt: 0.8 } }],
  ["4 the fryer", 4.0, { pos: [-0.8, EYE + 0.14, -3.7], look: [0.4, -0.25, -9.0], fov: 68, to: { pos: [-0.8, EYE + 0.14, -3.95] }, dur: 2.0, ease: "out",
    hand: { rate: 1.1, bob: 0.008, sway: 0.006, roll: 0.6, drift: 0.004 } }, "reveal"],
  ["5 he loves it", 6.0, { pos: [-0.4, EYE + 0.04, -7.9], look: [r3(BK.x - 0.22), r3(UP_Y + 0.62), r3(BK.z - 0.13)], fov: 44, hand: { rate: 0.8, bob: 0.003, sway: 0.002, roll: 0.3, drift: 0.002 } }, "payoff"],
  ["6a nope (whip)", 7.4, { pos: [-0.4, EYE + 0.04, -7.9], look: [r3(BK.x - 0.22), r3(UP_Y + 0.62), r3(BK.z - 0.13)], fov: 44, to: { pos: [-0.4, 0.48, -7.85], look: [-0.5, 0.3, -3.5], fov: 62 }, dur: 0.2, ease: "out", spin: -1 }],
  ["6b nope (run)", 7.6, { pos: [-0.4, 0.48, -7.85], look: [-0.5, 0.3, -3.5], fov: 62, to: { pos: [-0.42, 0.48, -7.1], look: [-0.5, 0.3, -2.8] }, dur: 0.4, ease: "linear",
    hand: { rate: 3.6, bob: 0.04, sway: 0.035, roll: 3.0, tilt: 2.5, lead: 0 } }],
], END);

write(import.meta.url, {
  id: "real-footage-of-hell",
  title: "Real Footage of Hell",
  idea: "Jonny's brief 30 Oct 2026 (Content gap 'hell real footage'): a first-person run into hell, which is a giant deep fryer; the potato inside loves it",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  set: { type: "furnace", night: true, light: "furnace", seed: 9, shadowSize: 10 },
  // a string-and-choir swell under shots 1-4, cut at 6.0 so the chime lands; the panic sting is an effect at 7.4
  music: { file: "ai/drama-swell/drama-swell-01.ogg", from: 0, until: 6.0, gain: 0.55, lock: false },
  motionBlur: false,
  sound: { sfx: 0.7, ambience: 0.2, signature: { payoff: false, entrances: false }, surface: "concrete" },
  hook: { show: ["rea"], hint: 0, what: "Reaper waves the running camera on down a red-glowing tunnel" },
  creative: { length: [8, 8] },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "spud", with: "basket", from: 0, to: END, reason: "the crispy potato stands in the wire basket (its feet on the floor wires, the walls round it)" },
    { who: "spud", with: "oil", from: 0, to: 6.4, reason: "the basket and the potato in it are under the oil until it rises" },
    { who: "rea", with: "spud", from: 0, to: 6.0, reason: "the crispy potato is out of sight under the oil until 6.0, so nothing of Reaper covers his face" },
  ],
  notes: "Generated by storyboards/hell/make-real-footage-of-hell.mjs.",
});
