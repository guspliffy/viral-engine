// EP02 T2+T13 prop bench: the skip remote (clean front/back, dusty, press), the umbrella (open overhead, folded at the side) and
// the loaf on Chip's head. Not a clip: a lookdev check of engine/page/props-skipremote.js. Writes two storyboards next to this file:
//   node storyboards/series/happiness/02-skip-remote/bench/remote/make-bench.mjs
//   node engine/render.mjs storyboards/series/happiness/02-skip-remote/bench/remote/remote-bench.json --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5 --draft --out <dir>
//   node engine/render.mjs storyboards/series/happiness/02-skip-remote/bench/remote/people-bench.json --stills 2.6,5.9,8.6 --draft --out <dir>
import { clip, write } from "../../../../../lib/clip.mjs";
import * as grips from "../../../../../lib/grips.mjs";

const SET = { type: "plain", color: "#8e98a4", floor: "#6f7680", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true };
const BASE = { fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, set: SET, music: false, sound: { auto: false }, notes: "Prop bench for props-skipremote.js (no reviews)." };

// ---- the remote: 1080 x 1920 at fov 30: 3154 px per metre needs the camera 1.136 m from the face (410 px wide); the back at 1.083 m (430 px)
{
  const c = clip(), Y = 1.0;
  const R = (id, x, o = {}) => ({ id, kind: "skipremote", x, y: Y, z: 0, ...o });
  const props = [
    R("front", 0), R("back", 1.5, { rot: 180 }), R("dustF", 3, { dust: 0.45, halo: 1 }), R("dustB", 4.5, { dust: 0.45, rot: 180 }),
    R("wipe", 6, { dust: 0.45, wipe: 0.7, rot: 180 }), R("press", 7.5), R("tilt", 9, { dust: 0.45, tip: 30, rot: -25, tilt: 0 }),
  ];
  for (const p of props) c.prop(0, p.id, { press: 0, dust: p.dust ?? 0, wipe: p.wipe ?? 0 }, 0);
  c.prop(0.1, "press", { press: 1 }, 0);
  const cam = (x, d) => ({ pos: [x, Y, d + 0.03], look: [x, Y, 0], fov: 30 });
  const shots = [["front", 0, cam(0, 1.136)], ["back", 1, cam(1.5, 1.083)], ["dustF", 2, cam(3, 1.136)], ["dustB", 3, cam(4.5, 1.083)], ["wipe", 4, cam(6, 1.083)], ["press", 5, cam(7.5, 1.136)],
    ["tilt", 6, { pos: [9.25, Y + 0.05, 0.95], look: [9, Y, 0], fov: 30 }], ["front", 7, { pos: [0.15, Y + 0.02, 0.6], look: [0, Y, 0.02], fov: 30 }]];
  write(import.meta.url, { id: "remote-bench", title: "Skip remote bench", idea: "Prop bench, not a clip", ...BASE, hook: { show: [], hint: 0, what: "prop bench" }, cast: [], props, captions: c.captions, beats: c.beats(shots, 8) });
}

// ---- Spud: the umbrella open overhead (R fist on the handle), then folded at the side; Chip with the loaf on his head
{
  const c = clip(), { A } = c;
  const UMB = { id: "umb", kind: "umbrella", open: 0, len: 0.78, ...grips.placeFor("umbrella", [-0.3, 0.14, 0.22], 0) };
  const h = grips.mug(c, "spud", UMB, { side: "R" });
  A(0, "spud", "noblink"); A(0, "spud", "look", { to: [0, 0], dur: 0.01, blink: false });
  let t = h.take(0.3);
  t = h.carry(t + 0.05, [-0.34, 0.36, 0.2], 0.5);           // lift: the handle at chest height, the canopy up over the head
  c.prop(t - 0.2, "umb", { open: 1 }, 0.5, "out");
  t = h.carry(t + 1.2, [-0.34, 0.37, 0.2], 0.6);            // hold overhead (still at 2.6)
  c.prop(t + 0.1, "umb", { open: 0 }, 0.5, "inOut");        // fold it
  t = h.carry(t + 0.1, [-0.36, 0.30, 0.20], 0.7);           // folded at the side (still at 5.9)
  const end = 9;
  const props = [UMB, { id: "loaf", kind: "loaf", x: 2.2, y: 0.64, z: 0.03, rot: 0 }];
  write(import.meta.url, {
    id: "people-bench", title: "Umbrella and loaf bench", idea: "Prop bench, not a clip", ...BASE, hook: { show: ["spud", "chip"], hint: 0, what: "prop bench" },
    cast: [{ id: "spud", character: "potatobrawl/spud", at: [0, 0], face: 0, expr: "kind", follow: 0.2, seed: 1.3 }, { id: "chip", character: "potatobrawl/chip", at: [2.2, 0], face: 0, expr: "happy", follow: 0.2, seed: 2.1 }],
    props, captions: c.captions,
    beats: c.beats([["spud", 0, { pos: [0.5, 0.95, 3.3], look: [-0.15, 0.85, 0.1], fov: 36 }], ["spud", 6.5, { pos: [0.5, 0.75, 3.0], look: [-0.15, 0.55, 0.1], fov: 36 }]
      ].slice(0, 1).concat([["chip", 7, { pos: [2.2, 0.75, 2.6], look: [2.2, 0.6, 0], fov: 32 }]]), end),
  });
}
