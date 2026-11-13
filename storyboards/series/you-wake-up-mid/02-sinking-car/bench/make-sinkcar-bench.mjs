// Cabin-props bench for You wake up mid EP02 (task T2, engine/page/props-sinkcar.js; brief briefs/T2-sinkcar.md, DESIGN.md section 3):
// the real hatchback rig pitched as DESIGN 2 "The car's fall" gives it (origin y / nose-down pitch; plus the bob and roll until 16 s),
// three stand-in blocks 0.65 m tall for the seated (driver +x, passenger -x, back seat), three carseats, the wheel, and the new props
// riding in the rig. One storyboard, one real timeline (the keys are DESIGN's); the stills are taken at the proof times:
//   4.5  9.0  11.5  12.2 (mid-flicker)  13.5 +2 +5 +12 frames  16.0  19.0   (and an extra outside view at 22.0 for bubbles and headbeams)
//   a 10 fps strip of 13.4 .. 14.4 s
//   node storyboards/series/you-wake-up-mid/02-sinking-car/bench/make-sinkcar-bench.mjs   -> sinkcar-bench.json (beside this file)
//   node engine/render.mjs <that json> --stills 4.5,9,11.5,12.2,13.57,13.67,13.9,16,19,22 --draft --silent
//   node engine/render.mjs <that json> --stills 13.4,13.5,13.6,13.7,13.8,13.9,14,14.1,14.2,14.3,14.4 --draft --silent
import { clip, write } from "../../../../lib/clip.mjs";
import { LEVELS, dashKeys, DASH_OFF_FRAME } from "../../../../../engine/page/props-sinkcar.js";

const c = clip(), { prop } = c;
const FPS = 30, T0 = 13.5;
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---- the car's fall (DESIGN 2): [t, origin y, nose-down pitch]
const FALL = [[0, -0.45, 3], [4.5, -0.45, 3], [7.0, -0.70, 5], [9.0, -1.10, 7], [11.5, -1.30, 9], [13.5, -1.45, 10], [16.0, -1.70, 14], [19.0, -2.2, 25], [21.5, -3.2, 35], [24.0, -5.0, 40], [26.5, -7.0, 20]];
const sm = (x) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const base = (t) => { for (let i = 1; i < FALL.length; i++) if (t <= FALL[i][0]) { const [t0, y0, p0] = FALL[i - 1], [t1, y1, p1] = FALL[i], u = sm((t - t0) / (t1 - t0)); return [y0 + (y1 - y0) * u, p0 + (p1 - p0) * u]; } return FALL.at(-1).slice(1); };
// keys: DESIGN's, and every 0.25 s up to 16 s with the bob (+-4 cm, 2.3 s) and the roll (+-2 degrees, 3.1 s)
const keys = [];
for (const [t, y, p] of FALL) if (t >= 16 || t === 0) keys.push({ at: t, pos: [0, y, 0], yaw: 0, pitch: p, roll: 0 });
for (let t = 0.25; t < 16 - 1e-6; t += 0.25) { const [y, p] = base(t), f = t >= 4.5 ? 1 : 0; keys.push({ at: r3(t), pos: [0, r3(y + f * 0.04 * Math.sin((2 * Math.PI * t) / 2.3)), 0], yaw: 0, pitch: r3(p), roll: r3(f * 2 * Math.sin((2 * Math.PI * t) / 3.1)) }); }
keys.sort((a, b) => a.at - b.at);
const rigs = [{ id: "car", kind: "hatchback", color: "#c8372d", pivot: [0, 0, 0], keys }];

// ---- props
const SEAT_Y = 0.295;   // cushion top 0.72 (DESIGN); EP01 used 0.12
const SEAT = { kind: "carseat", rig: "car", y: SEAT_Y, color: "#59535f", trim: "#6e6875" };
const BODY = { kind: "stoneblock", rig: "car", w: 0.42, h: 0.65, d: 0.30, staged: "stand-in for a seated potato (0.65 m)" };
const FX = (extra) => ({ rig: "car", x: 0, y: 0, z: 0, staged: "air, water and glass, see-through", ...extra });
const props = [
  { id: "seatD", ...SEAT, x: 0.55, z: 0.2, width: 0.86 },
  { id: "seatP", ...SEAT, x: -0.55, z: 0.2, width: 0.86 },
  { id: "seatR", ...SEAT, x: 0, z: -0.85, width: 0.78 },
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.62, z: 0.7, tip: 34 },
  { id: "bodyD", ...BODY, x: 0.55, y: SEAT_Y + 0.425, z: 0.22 },
  { id: "bodyP", ...BODY, x: -0.55, y: SEAT_Y + 0.425, z: 0.22 },
  { id: "bodyR", ...BODY, x: 0, y: SEAT_Y + 0.425, z: -0.83, w: 0.36 },
  { id: "water", kind: "cabinwater", ...FX({ level: LEVELS[0][1] }) },
  { id: "glass", kind: "carglass", ...FX({ level: LEVELS[0][1], t0: T0 }) },
  { id: "dash", kind: "dashglow", ...FX({}) },
  { id: "beams", kind: "headbeams", ...FX({}) },
  // the headrest at the moment the prongs land (the held pose is the grip proof): prongs toward +x on the hit point
  { id: "head", kind: "headrest", rig: "car", x: 0.77, y: 1.0, z: -0.22, roll: 90, scale: 0, staged: "held in Spud's hands in the clip" },
  { id: "bubbles", kind: "lakebubbles", staged: "underwater air", car: rigs[0], at: [0.99, 1.4, 0.2] },
  { id: "seams", kind: "lakebubbles", staged: "underwater air", car: rigs[0], at: [0, 0.9, 1.3], sizes: [1, 2] },
];

// ---- keys: the schedule of DESIGN 3 (prime every key that propState does not know with a zero-length tween at 0)
prop(0, "water", { dim: 0, agit: 0, hiss: 1 }, 0); prop(0, "beams", { lamps: 1 }, 0); prop(0, "glass", { pour: 1 }, 0); prop(0, "dash", { on: 1 }, 0);
for (let i = 1; i < LEVELS.length; i++) for (const id of ["water", "glass"]) prop(LEVELS[i - 1][0], id, { level: LEVELS[i][1] }, LEVELS[i][0] - LEVELS[i - 1][0], "inOut");
prop(13.5, "water", { agit: 1, hiss: 0 }, 0.1); prop(14.5, "water", { agit: 0 }, 0.4);
prop(r3(DASH_OFF_FRAME / FPS), "water", { dim: 1 }, 0);
for (const [t, set] of dashKeys(FPS)) prop(r3(t), "dash", set, 0, "linear");
prop(11.6, "glass", { drop: 0.02 }, 0.3);
prop(T0, "glass", { burst: 1 }, 0);
prop(13.2, "head", { scale: 1 }, 0); prop(13.7, "head", { scale: 0 }, 0);
// lamps (DESIGN 2): 1.0 at 19, 0.8 at 24, two dips to 0.2 of 3 frames at 25.0 and 25.4, 0.15 at 26.5, 0 at 27
prop(19, "beams", { lamps: 0.8 }, 5, "linear");

// ---- cameras (in the rig's frame for the cabin; one world camera for the outside)
const CAMS = [
  ["04 the front wall: jets, foam rings, water at the feet", 4.0, { rig: "car", pos: [0.0, 1.1, 0.05], look: [0.0, 0.5, 0.72], fov: 85 }],
  ["06 Mash's window: the lake outside, the waterline", 8.5, { rig: "car", pos: [0.4, 1.85, -1.2], look: [-0.99, 1.1, -0.7], fov: 55 }],
  ["07 the dash: dials, hazard, the window button", 11.0, { rig: "car", pos: [-0.28, 1.15, 0.2], look: [0.55, 0.93, 0.5], fov: 45 }],
  ["08 the driver's window: craze, burst, pour", 13.0, { rig: "car", pos: [-0.2, 1.85, 0.2], look: [0.99, 1.2, 0.0], fov: 60 }],
  ["09 back seat: water to the chest", 15.5, { rig: "car", pos: [-0.2, 1.85, 0.3], look: [0.0, 0.95, -1.1], fov: 60 }],
  ["10 full: the mirror under the roof", 18.5, { rig: "car", pos: [0.0, 1.3, 0.2], look: [0.0, 1.9, -0.8], fov: 75 }],
  ["x outside underwater: bubbles and beams", 21.5, { pos: [4.6, -3.4, 2.6], look: [0.3, -3.6, 0.6], fov: 55 }],
];
const END = 23;
const sb = {
  id: "sinkcar-bench", title: "Sinking-car props bench: cabin water, glass, burst, dash, headrest, beams, bubbles", idea: "Props bench for engine/page/props-sinkcar.js, not a clip",
  fps: FPS, look: "anime-pro", profile: "short", loop: false, music: false, sound: { auto: false, sfx: 0, ambience: 0, speech: false },
  cleanStart: true,
  set: { type: "plain", color: "#4a5d57", floor: "none" },
  creative: { length: [1, 40], notes: false },
  hook: { show: [], hint: 0, what: "engine test" }, cast: [], props, rigs,
  captions: c.captions, beats: c.beats(CAMS.map(([n, t, shot], i) => [n, i === 0 ? 0 : t, shot]), END),
  notes: "Test bench, not a clip. Generated by storyboards/series/you-wake-up-mid/02-sinking-car/bench/make-sinkcar-bench.mjs (T2).",
};
write(import.meta.url, sb);
