// Norse myth 01 bench for D2: the WELL (kind `norsewell`) and the WELL FLOOR (kind `norsefloor`) of engine/page/props-norse-well.js. Not a clip.
// One shot per beat (1.0 s each, the still is 0.5 s in). Cameras are 9:16. The well stands at 0, 0, 0; the floor set stands 300 m away at x 300.
//   node storyboards/series/norse-myth/01-wednesday/bench/make-well-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/norse-myth/01-wednesday/bench/well-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-well
//   node qa/contact.mjs /tmp/claude-0/bench-well/well-bench-*.png --out storyboards/series/norse-myth/01-wednesday/bench/well-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const FX = 300;   // the floor set
const props = [
  { id: "well", kind: "norsewell", x: 0, y: 0, z: 0, light: 1, dipAt: [0.45, 0.55], payAt: [-0.35, 0.5] },
  { id: "floor", kind: "norsefloor", x: FX, y: 0, z: 0 },
];
const WD = { glow: 1, gold: 0, glints: 1, ripple: 0.3, bulge: 0, splash: 0, rings: 0, swirl: 0, dip: 0, pay: 0, rise: 0 };
const FD = { blink: 0, lookX: 0, lookY: 0, plunge: 0, headShadow: 1, peek: 0 };
c.prop(0, "well", WD, 0); c.prop(0, "floor", FD, 0);
// Chip leans (the rig's lean 14 reads as about 35 degrees at the shoulders) over the floor set's rim (section 12's small proof): on the ledge at y 2.18, facing -x, 0.36 m off the rim
const CH = [FX + 1.8, 0.1];
const cast = [{ id: "chip", character: "potatobrawl/chip", at: CH, face: -90, expr: "shocked", follow: 0.3, seed: 2.3 }];
A(0, "chip", "move", { to: CH, y: 2.18, dur: 0.01 }); A(0, "chip", "noblink"); A(0, "chip", "lean", { to: 14, dur: 0.01 });
c.arm(0, "chip", "R", { x: [-0.3, 0.4, 0.15] }, 0.01); c.arm(0, "chip", "L", { x: [-0.3, 0.4, -0.15] }, 0.01);

const cam = (pos, look, fov = 40) => ({ pos, look, fov });
const SHOTS = [
  // name, camera, well params, floor params, time offset inside the beat (the still is 0.5 s into the beat; t0 shifts the clock)
  ["rest",    cam([0, 1.25, 3.7], [0, 0.18, 0], 38), {}],
  ["rest3q",  cam([2.7, 0.7, 2.6], [0.1, 0.15, 0.2], 36), {}],
  ["band",    cam([0.2, 0.42, 2.15], [0.05, 0.17, 1.39], 22), {}],
  ["bandSide",cam([2.6, 0.5, 0.9], [1.1, 0.17, 0.85], 24), {}],
  ["roundel", cam([0.1, 0.22, 1.85], [0.0, 0.16, 1.39], 12), {}],
  ["sip",     cam([-2.2, 0.75, 0.55], [-1.26, 0.25, -0.22], 24), {}],
  ["capback", cam([0, 0.8, -2.5], [0, 0.28, -1.3], 30), {}],
  ["top",     cam([0, 3.4, 0.4], [0, 0.22, 0], 34), {}],
  ["bulge",   cam([0, 1.0, 3.4], [0, 0.32, 0], 34), { bulge: 1, glow: 1.3 }],
  ["splash2", cam([0, 0.9, 3.4], [0, 0.4, 0], 34), { splash: 0.2, glow: 1.2 }],
  ["splash5", cam([0, 0.9, 3.4], [0, 0.4, 0], 34), { splash: 0.5 }],
  ["rings",   cam([0, 2.2, 2.6], [0, 0.22, 0], 34), { rings: 0.55 }],
  ["rings2",  cam([0, 2.2, 2.6], [0, 0.22, 0], 34), { rings: 1.9 }],
  ["swirl",   cam([0, 3.0, 0.9], [0, 0.22, 0], 34), { swirl: 0.9, rise: 0.4 }],
  ["dip",     cam([0, 1.6, 2.4], [0.2, 0.22, 0.3], 30), { dip: 0.25 }],
  ["pay",     cam([0, 1.6, 2.4], [-0.2, 0.22, 0.3], 30), { pay: 0.2 }],
  ["gold",    cam([0, 1.25, 3.7], [0, 0.18, 0], 38), { gold: 1, glow: 1.2 }],
  ["cold",    cam([0, 1.25, 3.7], [0, 0.18, 0], 38), { glints: 0, glow: 0.8 }],
  ["floor06", cam([FX - 0.6, 0.32, 0.12], [FX + 1.2, 0.92, 0.12], 82), {}, {}],
  ["eye",     cam([FX + 0.05, 0.28, 0.62], [FX + 0.25, 0.1, 0.15], 34), {}, {}],
  ["eyeBlink",cam([FX + 0.05, 0.28, 0.62], [FX + 0.25, 0.1, 0.15], 34), {}, { blink: 0.55 }],
  ["eyeShut", cam([FX + 0.05, 0.28, 0.62], [FX + 0.25, 0.1, 0.15], 34), {}, { blink: 1, lookX: 1 }],
  ["eyeUp",   cam([FX + 0.25, 0.62, 0.15], [FX + 0.25, 0.09, 0.15], 20), {}, { lookX: 1, lookY: 0.4 }],
  ["pebbles", cam([FX - 0.7, 0.9, 1.2], [FX, 0.05, -0.1], 66), {}, {}],
  ["shaft",   cam([FX + 0.1, 0.6, 0.5], [FX - 0.2, 1.8, -0.9], 64), {}, {}],
  ["upward",  cam([FX + 0.05, 0.25, 0.3], [FX - 0.1, 2.4, -0.1], 70), {}, {}],
  ["plunge",  cam([FX, 1.2, 0.5], [FX, 0.4, -0.1], 60), {}, { plunge: 0.5 }],
  ["peek",    cam([FX - 0.2, 0.3, 0.7], [FX + 0.7, 1.9, 0.0], 66), {}, { peek: 1, headShadow: 0 }],
  ["chipSide",cam([FX + 1.5, 2.7, 3.2], [FX + 1.5, 2.6, 0.1], 30), {}, {}],
  ["chipTop", cam([FX + 3.4, 3.4, 2.6], [FX + 1.5, 2.5, 0.0], 36), {}, {}],
];
const cams = [];
SHOTS.forEach(([name, cm, wp, fp = {}], i) => { const at = 1.0 * i; c.prop(at, "well", { ...WD, ...wp }, 0.01); c.prop(at, "floor", { ...FD, ...fp }, 0.01); cams.push([name, at, cm]); });

const end = 1.0 * SHOTS.length + 0.3;
const sb = {
  id: "well-bench", title: "Norse 01 well bench", idea: "Engine look bench for D2 (well, water, well floor), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#06090c", floor: "none", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast,
  props, captions: c.captions,
  beats: c.beats(cams, end),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-well-bench.mjs (engine bench, no story).",
};
console.log("stills:", sb.beats.map((b) => Math.round((b.at + 0.5) * 100) / 100).join(","));
write(import.meta.url, sb);
