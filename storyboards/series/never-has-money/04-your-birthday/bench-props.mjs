// STILLS BENCH for the props of Never Has Money EP04 "your birthday" (engine/page/props-birthday.js, task T2).
//   node storyboards/series/never-has-money/04-your-birthday/bench-props.mjs -> bench-props.json
//   node engine/render.mjs storyboards/series/never-has-money/04-your-birthday/bench-props.json --stills <times> --draft --safe --skip-gate
// Every prop stands in its own spot along x, each beat is a still with its own camera (beat n at n s, shot at n + 0.2 s).
// WORN holds the body-frame offsets the director copies into the clip's props (spec.wear).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";

const c = clip({ faces: "normal", lines: null });
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9), fov: 30 });

// the worn offsets under test (the body frame of the wearer; x + toward the wearer's left = screen right from the front)
export const WORN = {
  gslHat: { wear: "gsl", x: 0.06, y: 1.31, z: 0.0, rot: 0, tilt: 0, tip: 0 },
  vikHat: { wear: "vik", x: 0.08, y: 1.2, z: 0.08, rot: 0, tilt: 14, tip: 0 },
  rosette: { wear: "vik", x: -0.2, y: 0.5, z: 0.36, rot: 0, tilt: 0, tip: 0 },
};

const GSL = [0, 0], VIK = [2.4, 0];
const cast = [
  { id: "gsl", character: "never-has-money/gunslinger", at: GSL, face: 0, expr: "happy", follow: 0, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK, face: 0, expr: "happy", follow: 0, seed: 4.1 },
];
const CP = [[-2.4, 0, 0], [-4.8, 0.5, 0], [-7.2, 1, 0], [-9.6, 1, 1]];   // x, ink, fold
const props = [
  { id: "floor", kind: "plankfloor", x: 0, z: 0.4, w: 30, d: 8 },
  ...CP.map(([x, ink, fold], i) => ({ id: `cp${i}`, kind: "coupon", x, y: 1.05, z: 0, rot: 0, ink, fold })),
  { id: "cpHeld", kind: "coupon", x: GSL[0] + 0.0, y: 0.58, z: 0.42, rot: 0, ink: 1 },   // at his chest as in panel 04 (no hands)
  { id: "hatG", kind: "partyhat", ...WORN.gslHat, color: "#d8392b", accent: "#f2c14e", pattern: "stripes", pom: "#f2c14e" },
  { id: "hatV", kind: "partyhat", ...WORN.vikHat, color: "#3d7fd1", accent: "#f2c14e", pattern: "dots", pom: "#f2c14e" },
  { id: "ros", kind: "rosette", ...WORN.rosette },
  { id: "giftP", kind: "bowgift", x: 5.0, y: 0, z: 0, rot: -12, w: 0.46, h: 0.34, color: "#7d3fb8", ribbon: "#e7b43a" },
  { id: "giftB", kind: "bowgift", x: 5.75, y: 0, z: 0.1, rot: 8, w: 0.22, h: 0.14, color: "#26232a", ribbon: "#c9ced6" },
  { id: "giftO", kind: "bowgift", x: 6.6, y: 0, z: 0, rot: 0, w: 0.46, h: 0.34, color: "#7d3fb8", ribbon: "#e7b43a", lid: 1 },
  { id: "bunt", kind: "bunting", x: 9.5, y: 1.9, z: -0.6, w: 3.4, sag: 0.22, count: 15, colors: ["#8a4fc4", "#f2c14e", "#e97a9a"], faces: true },
];

const gHat = [GSL[0] + 0.05, 1.3, GSL[1]], vHat = [VIK[0], 1.2, VIK[1]];
const raw = [
  ["coupon ink 0", 0, fw([CP[0][0], 1.05, 0], { w: 1.2, el: 0 })],
  ["coupon ink 0.5", 1, fw([CP[1][0], 1.05, 0], { w: 1.2, el: 0 })],
  ["coupon ink 1", 2, fw([CP[2][0], 1.05, 0], { w: 1.2, el: 0 })],
  ["coupon folded", 3, fw([CP[3][0], 1.05, 0], { w: 1.2, el: 0 })],
  ["coupon close", 4, fw([CP[2][0], 1.05, 0], { w: 0.45, el: 0 })],
  ["coupon back / 3-4", 5, fw([CP[2][0], 1.05, 0], { w: 1.0, az: 140, el: 10 })],
  ["gsl hat front", 6, fw(gHat, { w: 1.1, el: 4 })],
  ["gsl hat 3/4", 7, fw(gHat, { w: 1.1, az: 40, el: 6 })],
  ["vik hat front", 8, fw(vHat, { w: 1.1, el: 4 })],
  ["vik hat 3/4", 9, fw(vHat, { w: 1.1, az: -40, el: 6 })],
  ["rosette on vik", 10, fw([VIK[0] - 0.1, 0.62, 0], { w: 1.3, el: 2 })],
  ["gsl + coupon", 11, fw([GSL[0], 0.8, GSL[1]], { w: 1.0, az: 4, el: 2 })],
  ["both gifts", 12, fw([5.35, 0.25, 0.05], { w: 1.2, az: -8, el: 14 })],
  ["gift big 3/4", 13, fw([5.0, 0.28, 0], { w: 0.8, az: 28, el: 14 })],
  ["gift open", 14, fw([6.6, 0.3, 0], { w: 1.0, az: 0, el: 16 })],
  ["bow close big", 17, fw([5.0, 0.4, 0], { w: 0.6, az: -12, el: 12 })],
  ["bow close small", 18, fw([5.75, 0.17, 0.1], { w: 0.3, az: 8, el: 12 })],
  ["bunting", 15, fw([9.5, 1.55, -0.6], { w: 3.8, el: 0 })],
  ["bunting close", 16, fw([8.9, 1.7, -0.6], { w: 1.4, el: 0 })],
];
const shots = raw.map(([n, , sh], i) => [n, i, sh]);   // beat i starts at i s
const beats = c.beats(shots, shots.length);

write(import.meta.url, {
  id: "bench-props",
  title: "Props bench: your birthday",
  idea: "Stills bench for the props of never has money 04 (coupon, party hats, rosette, bow gifts, bunting).",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false, animeTiming: true,
  set: { type: "plain", color: "#d9b98a", floor: "#a86f3e", light: "golden", para: 0, bloom: "emissive", aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 } },
  music: { style: "warm", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0, ambience: 0, surface: "wood", room: "room", guard: false },
  cast, props, captions: [], beats, visible: [], allowClip: [],
  notes: "Stills bench for props-birthday.js (builder task T2). Not a clip.",
});
