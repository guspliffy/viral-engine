// Pebble bends the lake (Jonny 7 Nov 2026 20:25: "pebble bend water near a lake ... bending water smoothly and speaking
// about life ... the bending should look really really good"; 21:46: "first be turned towards the water and raise his
// arms and make gestures so there is an obvious cause and effect"; 8 Nov 05:30 on the bench: hands not further in than
// at 0:22, moving backgrounds, about 15 s). Prompt and study: /mnt/project-files/videos/pebble/waterbend-01/.
// Built from storyboards/templates/clip-template.mjs and the water bench (make-pebble-water-bench.mjs). The water's
// track follows his drawn hands (tools/water/bend-path.mjs), so run it twice:
//   node storyboards/pebble/make-pebble-lake.mjs
//   node engine/render.mjs storyboards/pebble/pebble-lake.json --layout
//   node storyboards/pebble/make-pebble-lake.mjs      (now with the water)
//
// THE BRIEF
//   Joke:        none: a calm clip. Pebble stands at the lake and, with slow tai chi hands, lifts a ribbon of water out
//                of it, draws it in, swings it and sends it out over the lake, then says one line about life.
//   Wants:       Pebble wants to move with the water, not force it.
//   Consequence: the water answers every gesture; it hangs over the lake while he speaks, then goes home.
//   Ending:      his hands sink, the water pours back, he looks to us and smiles; his hands start to rise again (loop).
//   Callback:    the clip opens on his hands starting to rise from rest and ends on them back at rest.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write } from "../lib/clip.mjs";
import { play, load } from "../lib/moves/index.mjs";
import { handsTrack, keyedPath } from "../../tools/water/bend-path.mjs";
import * as peb from "./pebble-acting.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, "../..");
// the template's house picks (Jonny's decisions to 8 Nov); feet: the tai chi form stands still (no steps)
const FOCUS = false, LOOK = "sheet", FACES = "strong";
const MOTION = { feet: 2, overlap: true, timing: true, solve: true, feetTune: { body: 0, lean: 0, tip: 0 } };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const PHYSICS = true, LIGHTING = 2, HATCH = { boil: 0.25 };
// living world (Jonny 7 Nov 20:08, "apply it to all future videos"): gusts, cloud drift, far birds, background only
const LIFE = "auto";
const LINES = { sub: true, blink: false, pos: 230 };

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see } = c;
const W = "peb", END = 16.0;

// ---------------------------------------------------------------- places (lake-shore env; x right, z toward us)
// he stands side-on to us (a touch toward us, so his face reads) on the pebbly bank, turned to the lake on our right; the water comes out of the lake there
const AT = [0.0, -0.05], HEAD = 82;
const cast = [{ id: W, character: "pebble/pebble", at: AT, face: HEAD, expr: "kind", follow: 0.3, seed: 1.3, span: 0 }];

// ---------------------------------------------------------------- the form: CMU subject 12 take 04 (tai chi), opening
// The bench's staging (bench time b), warped into 15 s: from rest the rise, draw-in, arc and push play at their own pace
// (clip 0-7.4 = b 0.5-7.9), the push's follow-through is held slowly while he speaks, the sink plays, and his hands
// settle at rest, the pose the clip opens on (a loop). The speed eases between the parts, so no hand changes pace in one
// frame.
const SPEED = [[0, 1], [7.4, 1], [8.2, 0.06], [12.0, 0.06], [12.8, 0.95], [14.3, 0.95], [15.0, 0.45], [16, 0.45]];
const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const ease = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * smooth((t - K[i][0]) / (K[i + 1][0] - K[i][0])); return K[K.length - 1][1]; };
// the bench's staging for short arms (bench time): bigger reach and rise, a draw-in to the chest, then (Fable review A:
// a sideways sweep on a side-on body shows nothing) an arc up and over toward the lake that the camera sees
const ARC = [[0, 0], [4.9, 0], [5.8, 0.18], [6.6, 0.1], [7.3, 0]];
const REACH = [[0, 0], [1.0, 0], [2.6, 0.3], [3.5, 0.3], [4.5, -0.05], [5.0, 0.0], [5.8, 0.35], [6.6, 0.3], [7.3, 0.0], [8.1, 0.8], [8.8, 0.6], [10.6, 0]];
const DIP = [[0, 0], [3.7, 0], [4.5, 1], [5.4, 1], [6.2, 0.4], [11, 0.4]];
// Jonny 8 Nov: the hands never come in closer to his chest than at the draw-in (bench 5.25 s); the floor lets go as
// they sink home
const FLOOR = [[0, 0], [5.2, 0], [5.3, 1], [8.6, 1], [9.4, 0]];
// the body turned toward us for the line (degrees on top of HEAD), and back to the lake as the water goes home
const TURN = [[0, 0], [7.9, 0], [8.5, -45], [12.2, -45], [12.9, 0]];
// while he speaks the held palms trace a slow circle (5-6 cm, 4 s) and the water answers it (Fable review A)
const HOLD = [[0, 0], [8.2, 0], [8.8, 1], [11.7, 1], [12.3, 0]];
const src = load("taichi-open"), RANGE = [0.5, 11.5], BDUR = 10.5, uOf = (b) => RANGE[0] + (b * (RANGE[1] - RANGE[0])) / BDUR;
const at = (arr, u) => { const f = Math.max(0, Math.min(arr.length - 1, u * src.fps)), i = Math.min(arr.length - 2, Math.floor(f)), r = f - i, a = arr[i], b = arr[i + 1]; return Array.isArray(a) ? a.map((v, k) => v + (b[k] - v) * r) : a + (b - a) * r; };
const staged = (sd, b) => {
  const v = at(src.hand[sd], uOf(b)), up = Math.max(0, (v[1] + 0.9) / 1.04);
  return [v[0], v[1] + (0.5 - 0.35 * ease(DIP, b)) * up + ease(ARC, b), v[2] + ease(REACH, b)];
};
const floorZ = { R: staged("R", 5.25)[2], L: staged("L", 5.25)[2] };
const B0 = 0.5, BT = [B0]; for (let i = 1; i <= END * 300; i++) BT.push(BT[i - 1] + ease(SPEED, (i - 0.5) / 300) / 300);
const bOf = (t) => BT[Math.max(0, Math.min(BT.length - 1, Math.round(t * 300)))];
const N = Math.round(END * src.fps) + 1, mv = { ...src, feet: { R: [], L: [] }, len: END, hand: { R: [], L: [] }, path: [], yaw: [], pitch: [], lean: [], drop: [], head: [] };
for (let i = 0; i < N; i++) {
  const t = i / src.fps, b = bOf(t), u = uOf(b), hold = ease(HOLD, t), ph = (2 * Math.PI * (t - 8.2)) / 4;
  for (const k of ["path", "yaw", "pitch", "lean", "drop", "head"]) mv[k].push(at(src[k], u));
  mv.yaw[i] += ease(TURN, t);   // he turns his body to us for the line, and back to the water
  for (const sd of ["R", "L"]) {
    const v = staged(sd, b), f = ease(FLOOR, b); v[2] = v[2] + f * Math.max(0, floorZ[sd] - v[2]);
    v[1] += hold * 0.07 * Math.sin(ph); v[2] += hold * 0.07 * (1 - Math.cos(ph));
    mv.hand[sd].push(v);
  }
}
// the loop: over the last 0.8 s every channel eases back onto frame 0's pose, so the rewatch doesn't stutter
for (let i = 0; i < N; i++) {
  const k = smooth((i / src.fps - 15.2) / 0.8); if (k <= 0) continue;
  for (const ch of ["path", "yaw", "pitch", "lean", "drop", "head"]) { const a = mv[ch][i], z = mv[ch][0]; mv[ch][i] = Array.isArray(a) ? a.map((v, j) => v + (z[j] - v) * k) : a + (z - a) * k; }
  for (const sd of ["R", "L"]) mv.hand[sd][i] = mv.hand[sd][i].map((v, j) => v + (mv.hand[sd][0][j] - v) * k);
}
// two small steps round for each turn (a 45 degree turn on planted feet would skate): each foot lifts and re-plants
// under the hip at the new heading
const STEPS = { R: [[7.92, 8.22], [12.52, 12.82]], L: [[8.22, 8.52], [12.22, 12.52]] };
for (const sd of ["R", "L"]) mv.feet[sd] = STEPS[sd].map(([t0, t1]) => { const pc = at(mv.path, t1); return { t0, t1, p0: pc, p1: [pc[0], pc[1] + (sd === "L" ? 1 : -1) * src.human.hipHalf], h: 0.05 }; });
play(c, 0, W, mv, { from: AT, heading: HEAD, char: "pebble/pebble", range: [0, END - 0.1], dur: END - 0.1, reach: 0.85 });

// ---------------------------------------------------------------- the eyes: a glance at us, then on the water all the way
// (the clip opens on the look it ends on, so the loop holds), to us for the line, home with the water, to us
A(0, W, "look", { to: [-0.6, 0], dur: 0, blink: false });
A(0.2, W, "look", { to: [0.1, -0.25], dur: 0.35, blink: false });
A(1.0, W, "look", { to: [0.05, 0.2], dur: 0.8, blink: false });
A(3.4, W, "look", { to: [-0.1, 0.0], dur: 0.5, blink: false });
A(4.9, W, "look", { to: [0.0, 0.3], dur: 0.6, blink: false });
A(6.2, W, "look", { to: [-0.1, 0.05], dur: 0.5, blink: false });
A(7.3, W, "look", { to: [0.05, 0.15], dur: 0.4, blink: false });
A(8.2, W, "look", { to: [-0.6, 0], dur: 0.6, blink: false });         // to us for the line
A(12.2, W, "look", { to: [0.05, -0.2], dur: 0.6, blink: false });     // back to the water as it goes home
A(15.0, W, "look", { to: [-0.6, 0], dur: 0.6, blink: false });        // to us, a small smile
peb.calmSmile(c, 15.2, W);

// ---------------------------------------------------------------- the line (our own words; Fable review A: say what we see)
// (peb.line's still hold would freeze his follow-through and let it snap back at the end: the line here is said with
// the clip's blinks off instead)
A(0, W, "noblink");
A(8.3, W, "face", { lid: peb.LID, dur: 0.3 });
c.macro(8.4, W, "say", { line: "Never push. Move with it.", tone: "calm", pos: 230 });

// ---------------------------------------------------------------- the water: its head path, timed just after each hand move
// (clip time: up out of the lake as the hands rise, in toward his chest, up and over in an arc, pushed out over the lake,
// an S-curve there while he speaks, home as the hands sink; the rings of the last return still spread on frame 0)
const KEYS = [[0.4, 1.25, -0.4, -0.85], [2.1, 1.25, 1.0, -0.8], [3.1, 1.15, 1.35, -0.65], [4.2, 0.7, 0.95, -0.2], [4.6, 0.75, 0.95, -0.3],
  [5.3, 1.0, 1.45, -0.55], [6.1, 0.65, 1.5, -0.2], [6.8, 0.8, 1.1, -0.2], [7.9, 1.35, 1.3, -1.25],
  [8.9, 1.05, 1.5, -1.4], [9.9, 1.45, 1.2, -1.2], [10.9, 1.1, 1.35, -1.05], [11.9, 1.4, 1.3, -1.3],
  [13.3, 1.25, 1.0, -1.0], [14.7, 1.25, -0.4, -0.85]];
const SRC = [1.25, -0.002, -0.85];
const id = "pebble-lake", lay = path.join(ROOT, "out", `${id}-anime-pro.layout.json`), props = [];
if (fs.existsSync(lay)) {
  const stream = keyedPath(handsTrack(lay, W), { keys: KEYS, amp: [1.2, 1.2, 1.2], lag: 0.2, sway: 0.1 });
  props.push({ id: "water", kind: "waterbend", x: 0, y: 0, z: 0, rot: 0, level: 0, wet: [[-3, -12, 3, -0.6]], rings: [[-1.0, SRC[0], SRC[2], 0.35], [-0.6, SRC[0] + 0.05, SRC[2] - 0.05, 0.25]], streams: [{ path: stream, from: [SRC[0], -0.1, SRC[2]], tail: 1.6, r: 0.06, v0: 0.8, drops: 14, seed: 1 }], staged: "water: the bent water out of the painted lake, it rests on nothing" });
}

// ---------------------------------------------------------------- sound: each named sound on what the water does
sfx(0.75, "bubbling", { gain: 0.12, dur: 1.1, reason: "the lake swells and gurgles where the water starts to rise" });
sfx(7.7, "whoosh", { gain: 0.18, reason: "the push: the ribbon of water swept out over the lake" });
sfx(14.1, "bubbling", { gain: 0.12, dur: 0.6, reason: "the water slips back into the lake (a quiet return, not a splash: Fable review A)" });
sfx(14.55, "ai/drip", { gain: 0.25, reason: "the last drops falling back into the lake" });

see(0.4, 3.1, [`${W}.face`, W], "his hands rise and the water rises out of the lake");
see(8.3, 12.3, [`${W}.face`], "his line while the water hangs over the lake");

// ---------------------------------------------------------------- shots (lake-shore camera range: qa/env.mjs --range)
const WIDE = { pos: [0.3, 1.5, 4.4], look: [0.45, 0.85, -0.3], fov: 42 };
const beats = c.beats([
  ["the water rises", 0, WIDE, "hook"],
  ["draw and arc", 3.7, WIDE],
  ["out over the lake", 7.1, WIDE, "reveal"],
  ["the line", 8.3, WIDE, "payoff"],
  ["home", 12.4, WIDE],
], END);

write(import.meta.url, {
  id, title: "Pebble bends the lake",
  idea: "Pebble lifts a ribbon of water out of the lake with slow tai chi hands and says one line about life",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true,
  ...(MOTION && { motion: MOTION }), ...(RIG && { rig: RIG }), ...(PHYSICS && { physics: true }),
  creative: { length: [8, 20] },
  set: { type: "env", env: "lake-shore", shade: "soft", aperture: FOCUS ? 0.045 : 0, focus: false, lighting: LIGHTING, hatch: HATCH, life: LIFE },
  music: { pool: "calm-landscape", ...peb.MIX.music },
  sound: { ...peb.MIX.sound, surface: "grass" },
  hook: { show: [W, "water"], hint: 0.3, what: "the lake rises to his hands" },
  // the turn to us for the line pivots on his planted left foot while the right one steps round (a ball pivot, as a
  // person turns; the foot's centre swings 2-3 cm with it)
  allowClip: [{ who: W, from: 7.9, to: 8.6, checks: ["foot-slide"], reason: "the turn to us pivots on his planted left foot (a ball pivot) while the right foot steps round" }],
  cast, props, captions: c.captions, beats, visible: c.visible,
  notes: "Generated by storyboards/pebble/make-pebble-lake.mjs. Motion: CMU subject 12 take 04 (mocap.cs.cmu.edu).",
});
