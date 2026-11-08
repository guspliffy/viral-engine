// Water bending bench (Jonny 7 Nov 2026 20:25: "pebble bend water near a lake ... the bending should look really
// really good"; prompt and study in /mnt/project-files/videos/pebble/waterbend-01/). Pebble plays the opening of a real
// tai chi form (CMU motion capture subject 12, take 04) and a stream of water rises out of a pool beside him, follows his
// hands up, sways while he holds, and pours back as his hands sink. The water's track is worked out from his drawn hands
// (tools/water/bend-path.mjs), so run it twice: the first pass has no water and gives the layout.
//   node storyboards/pebble/make-pebble-water-bench.mjs
//   node engine/render.mjs storyboards/pebble/water/water-bench-front.json --layout
//   node storyboards/pebble/make-pebble-water-bench.mjs      (now with the water)
//   node engine/render.mjs storyboards/pebble/water/water-bench-front.json   (and -side)
// Pure engine test (no reviews).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip } from "../lib/clip.mjs";
import { play, load } from "../lib/moves/index.mjs";
import { handsTrack, keyedPath } from "../../tools/water/bend-path.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(HERE, "water"), ROOT = path.join(HERE, "../..");
fs.mkdirSync(OUT, { recursive: true });
// the lake-shore set (Jonny's painting, 7 Nov): he stands on the pebbly bank side-on to us, already turned to the lake
// on our right (Jonny 7 Nov 21:46: "first be turned towards the water and raise his arms and make gestures so there is
// an obvious cause and effect"). Every change in the water starts from a hand move a moment before it:
//   rest, eyes on the water -> hands float up: the water swells and climbs out of the lake with them -> hands draw in
//   toward his chest: the water arcs in to him -> cloud hands, left then right: it swings after them -> a push out over
//   the lake: it shoots out -> hands sink: it pours home
const W = "peb", END = 11.5, AT = [-0.05, -0.05], HEAD = 100, SRC = [1.25, -0.002, -0.85];

const c = clip(), { A } = c;
A(0, W, "noblink");
const RANGE = [0.5, 11.5], DUR = 10.5, clipT = (u) => ((u - RANGE[0]) * DUR) / (RANGE[1] - RANGE[0]);
const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const ease = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * smooth((t - K[i][0]) / (K[i + 1][0] - K[i][0])); return K[K.length - 1][1]; };
// hand offsets on top of the recorded opening, arm lengths: SWEEP + toward his left (away from us), REACH + toward the lake
const SWEEP = [[0, 0], [4.9, 0], [5.8, 0.35], [6.8, -0.35], [7.4, 0], [11, 0]];
const REACH = [[0, 0], [1.0, 0], [2.6, 0.3], [3.5, 0.3], [4.5, -0.05], [5.0, 0.0], [7.3, 0.0], [8.1, 0.8], [8.8, 0.6], [10.6, 0]];
// the draw-in brings the hands down to the chest (higher, they came up to his mouth)
const DIP = [[0, 0], [3.7, 0], [4.5, 1], [5.4, 1], [6.2, 0.4], [11, 0.4]];
const mv = JSON.parse(JSON.stringify(load("taichi-open")));
for (const sd of ["R", "L"]) mv.hand[sd] = mv.hand[sd].map((v, i) => {
  const t = clipT(i / mv.fps), sw = ease(SWEEP, t), up = Math.max(0, (v[1] + 0.9) / 1.04);
  return [v[0] + (sd === "R" ? -sw : sw), v[1] + (0.5 - 0.35 * ease(DIP, t)) * up, v[2] + ease(REACH, t)];
});
play(c, 0, W, mv, { from: AT, heading: HEAD, char: "pebble/pebble", range: RANGE, dur: DUR, reach: 0.85 });
// the eyes on the water all the way (straight ahead is the lake), then to us at the end
A(0.3, W, "look", { to: [0.1, -0.25], dur: 0.5, blink: false });
A(1.4, W, "look", { to: [0.05, 0.2], dur: 0.8, blink: false });
A(3.9, W, "look", { to: [-0.1, 0.0], dur: 0.5, blink: false });
A(5.4, W, "look", { to: [0.25, -0.05], dur: 0.5, blink: false });
A(6.4, W, "look", { to: [-0.35, -0.1], dur: 0.5, blink: false });
A(7.8, W, "look", { to: [0.05, 0.15], dur: 0.4, blink: false });
A(9.0, W, "look", { to: [0.05, -0.25], dur: 0.6, blink: false });
A(10.7, W, "look", { to: [-0.6, 0], dur: 0.6, blink: false });
// the water's head, timed ~0.15 s after each hand move (the spring adds its weight on top)
const KEYS = [[1.2, 1.25, -0.4, -0.85], [2.6, 1.25, 1.0, -0.8], [3.6, 1.15, 1.35, -0.65], [4.7, 0.65, 0.95, -0.2], [5.1, 0.7, 0.95, -0.3],
  [6.0, 0.85, 1.05, -0.75], [7.0, 0.7, 0.85, 0.4], [7.5, 0.7, 0.95, -0.15], [8.4, 1.6, 1.3, -1.15], [9.2, 1.45, 1.0, -1.0], [10.7, 1.25, -0.4, -0.85]];

const SHOTS = { front: { pos: [0.3, 1.5, 4.4], look: [0.45, 0.85, -0.3], fov: 42 } };
for (const [v, SHOT] of Object.entries(SHOTS)) {
  const id = `water-bench-${v}`, lay = path.join(ROOT, "out", "water-bench-front-anime-pro.layout.json");   // the hands are the same in both
  const props = [];
  if (fs.existsSync(lay)) {
    const H = handsTrack(lay, W);
    const stream = keyedPath(H, { keys: KEYS, amp: [1.2, 1.2, 1.2], lag: 0.2, sway: 0.06 });
    props.push({ id: "water", kind: "waterbend", x: 0, y: 0, z: 0, rot: 0, level: 0, wet: [[-3, -12, 3, -0.6]], streams: [{ path: stream, from: [SRC[0], -0.1, SRC[2]], tail: 1.3, r: 0.05, v0: 0.8, drops: 14, seed: 1 }], staged: "water: the bent water out of the painted lake, it rests on nothing" });
  }
  const sb = {
    id, title: "Water bending bench", idea: "Engine test: water bending, not a clip", fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false,
    motion: { feet: 3, overlap: true, timing: true, solve: true, feetTune: { body: 0, lean: 0, tip: 0 } }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
    set: { type: "env", env: "lake-shore", focus: false, lighting: 2, hatch: { boil: 0.25 } },
    music: false, sound: { sfx: 0.5, ambience: 0.3, surface: "grass" },
    hook: { show: [W], hint: 0, what: "engine test" },
    cast: [{ id: W, character: "pebble/pebble", at: AT, face: HEAD, expr: "kind", follow: 0.3, seed: 1.3, span: 0 }],
    props, captions: [{ from: 0, to: END, text: `WATER BENCH: ${v.toUpperCase()}`, pos: 260, pop: false, kinetic: false }],
    beats: c.beats([["bench", 0, SHOT]], END), duration: END,
    notes: "Generated by storyboards/pebble/make-pebble-water-bench.mjs (engine test). Motion: CMU subject 12 take 04 (mocap.cs.cmu.edu).",
  };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${id}: ${props.length ? "with the water" : "no layout yet: no water (run render.mjs --layout, then this again)"}`);
}
