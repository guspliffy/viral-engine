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
// the lake-shore set (Jonny's painting, 7 Nov): he stands on the pebbly bank, the water's edge about 0.85 m behind him;
// the water comes out of the lake behind him on his left (our right) and is led round to his front
const W = "peb", END = 11.5, AT = [-0.25, 0.3], SRC = [1.0, -0.002, -1.1];

const c = clip(), { A } = c;
A(0, W, "noblink");
// the tai chi opening (the recording's own timing, 10.5 s of it), staged bigger for short arms: the hands rise to above
// the shoulder, and while they hold they drift together from his left (the lake side) to his right and back, as in
// cloud hands, leading the water across in front of him; on the sink they push it home to the lake
const RANGE = [0.5, 11.5], DUR = 10.5, clipT = (u) => ((u - RANGE[0]) * DUR) / (RANGE[1] - RANGE[0]);
const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const ease = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * smooth((t - K[i][0]) / (K[i + 1][0] - K[i][0])); return K[K.length - 1][1]; };
// + toward his left (our right, the lake side), arm lengths
const SWEEP = [[0, 0], [1.2, 0], [2.8, 0.3], [3.6, 0.3], [6.4, -0.4], [7.0, -0.4], [8.0, 0], [8.4, 0], [9.4, 0.32], [10.8, 0]];
const mv = JSON.parse(JSON.stringify(load("taichi-open")));
for (const sd of ["R", "L"]) mv.hand[sd] = mv.hand[sd].map((v, i) => {
  const t = clipT(i / mv.fps), sw = ease(SWEEP, t), up = Math.max(0, (v[1] + 0.9) / 1.04);
  return [v[0] + (sd === "R" ? -sw : sw), v[1] + 0.45 * up, v[2]];
});
play(c, 0, W, mv, { from: AT, heading: "camera", char: "pebble/pebble", range: RANGE, dur: DUR });
// the eyes on the water all the way (they lead the head), then back to us as it goes home
A(1.0, W, "look", { to: [0.5, -0.05], dur: 0.5, blink: false });
A(3.3, W, "look", { to: [0.3, 0.15], dur: 0.6, blink: false });
A(4.6, W, "look", { to: [0.05, -0.2], dur: 0.6, blink: false });
A(6.0, W, "look", { to: [-0.45, 0.0], dur: 0.7, blink: false });
A(7.8, W, "look", { to: [0, -0.15], dur: 0.6, blink: false });
A(9.0, W, "look", { to: [0.45, 0.05], dur: 0.6, blink: false });
A(10.6, W, "look", { to: [0, 0], dur: 0.5, blink: false });
// the water's head: up out of the lake behind him on our right, over his left shoulder, across in front of his chest
// (below the face), out to his right, back to the middle, and home over his left side (keys just after the hands)
const KEYS = [[1.1, 1.0, -0.4, -1.1], [2.3, 1.0, 0.9, -1.0], [3.4, 0.85, 1.35, -0.35], [4.6, 0.45, 0.85, 0.95], [5.6, -0.15, 0.7, 1.15],
  [6.7, -0.75, 1.0, 0.75], [8.1, -0.1, 0.8, 1.1], [9.2, 0.75, 1.25, -0.2], [10.1, 1.0, 0.6, -1.0], [10.9, 1.0, -0.4, -1.1]];

const SHOTS = { front: { pos: [0.05, 1.5, 4.4], look: [0.1, 0.8, 0], fov: 40 }, side: { pos: [0.55, 1.4, 4.2], look: [0.0, 0.85, 0], fov: 36 } };
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
    cast: [{ id: W, character: "pebble/pebble", at: AT, face: "camera", expr: "kind", follow: 0.3, seed: 1.3, span: 0 }],
    props, captions: [{ from: 0, to: END, text: `WATER BENCH: ${v.toUpperCase()}`, pos: 260, pop: false, kinetic: false }],
    beats: c.beats([["bench", 0, SHOT]], END), duration: END,
    notes: "Generated by storyboards/pebble/make-pebble-water-bench.mjs (engine test). Motion: CMU subject 12 take 04 (mocap.cs.cmu.edu).",
  };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${id}: ${props.length ? "with the water" : "no layout yet: no water (run render.mjs --layout, then this again)"}`);
}
