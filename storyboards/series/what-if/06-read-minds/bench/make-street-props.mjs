// Bench for the neon street props (engine/page/props-neonstreet.js neonstreet + streetpotato, props-casino.js goldwatch, props-mind.js
// cards83), task T4 of storyboards/series/what-if/06-read-minds/BRIEF-T4.md. One scene, seven stills 1 s apart (each 0.6 s into its
// beat), a plain set with no floor of its own. Not a clip. The table and the bubble stand far off to the side (x 40 and 60), in the
// night sky of the street.
//   still 1  the walking shot [0, 1.25, 3.5] at [0, 1.1, -8] fov 50: Spud standing in the road at z -2, six streetpotatoes round him
//   still 2  the higher shot [0, 4, 6] at [0, 1, -12] fov 55
//   still 3  a streetpotato mid-step from the side (x +1.7 of it), feet clearly apart
//   still 4  the goldwatch on the felt next to a chippile, medium wide (the way panel 01 sees the pot)
//   still 5  the goldwatch close
//   still 6  a thoughtbubble with obj cards83
//   still 7  the four dresses in a lineup (coat + bag, dress + beanie, hoodie, suit)
//   node storyboards/series/what-if/06-read-minds/bench/make-street-props.mjs
//   node engine/render.mjs storyboards/series/what-if/06-read-minds/bench/street-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6 --draft --safe
//   node qa/contact.mjs out/street-props-*.png --out storyboards/series/what-if/06-read-minds/bench/street-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const FELT = 0.62, TX = 40, BX = 60, LX = 80;
const CAMS = {
  walk: { pos: [0, 1.25, 3.5], look: [0, 1.1, -8], fov: 50 },
  high: { pos: [0, 4, 6], look: [0, 1, -12], fov: 55 },
  side: { pos: [-1.0 + 2.6, 0.5, -24], look: [-1.0, 0.4, -24], fov: 36 },
  table: { pos: [TX + 0.1, 1.2, 2.3], look: [TX + 0.1, 0.68, 0.1], fov: 45 },
  watch: { pos: [TX + 0.28, 0.95, 1.05], look: [TX + 0.28, 0.63, 0.4], fov: 40 },
  bubble: { pos: [BX, 1.5, 1.8], look: [BX, 1.5, 0], fov: 38 },
  lineup: { pos: [LX, 0.75, 4.3], look: [LX, 0.45, 0], fov: 52 },
};
const SHOTS = [["walk", "walking shot, Spud in the road, six passers-by"], ["high", "higher shot"], ["side", "a streetpotato mid-step from the side"],
  ["table", "goldwatch next to the pot, medium wide"], ["watch", "goldwatch close"], ["bubble", "thoughtbubble cards83"], ["lineup", "coat, dress, hoodie, suit"]];

const props = [
  { id: "street", kind: "neonstreet", x: 0, y: 0, z: 0, rot: 0, len: 36, seed: 6, cars: 6, light: 1 },
  // six passers-by at different step phases (walk is the metres walked; the cycle is 0.56 m)
  { id: "p1", kind: "streetpotato", x: -3.3, y: 0, z: -11, rot: 0, h: 0.85, dress: "coat", color: "#d8452e", walk: 0.0 },
  { id: "p2", kind: "streetpotato", x: 3.4, y: 0, z: -12.5, rot: 180, h: 0.8, dress: "hoodie", color: "#1fb5a8", walk: 0.14, bag: 1 },
  { id: "p3", kind: "streetpotato", x: -3.2, y: 0, z: -15.5, rot: 0, h: 0.9, dress: "dress", color: "#ff6fb0", walk: 0.28, bag: 1 },
  { id: "p4", kind: "streetpotato", x: 3.5, y: 0, z: -16.5, rot: 15, h: 0.85, dress: "suit", color: "#2b3a78", walk: 0.42, hat: 1 },
  { id: "p5", kind: "streetpotato", x: 1.3, y: 0, z: -7.5, rot: 0, h: 0.8, dress: "coat", color: "#e8b830", walk: 0.07, hat: 1 },
  { id: "p6", kind: "streetpotato", x: -1.2, y: 0, z: -5.0, rot: -25, h: 0.95, dress: "hoodie", color: "#8a5cff", walk: 0.35 },
  { id: "close", kind: "streetpotato", x: -1.0, y: 0, z: -24, rot: 0, h: 0.85, dress: "coat", color: "#c8452e", walk: 0, hat: 1, bag: 1 },
  // a lineup of the four dresses (still 7)
  { id: "l1", kind: "streetpotato", x: LX - 0.8, y: 0, z: 0, rot: 12, dress: "coat", color: "#2fa8c8", walk: 0.1, bag: 1 }, { id: "l2", kind: "streetpotato", x: LX + 0.3, y: 0, z: 0, rot: -12, dress: "dress", color: "#ff6fb0", walk: 0.3, hat: 1 },
  { id: "l3", kind: "streetpotato", x: LX - 0.3, y: 0, z: -0.5, rot: 8, dress: "hoodie", color: "#e8a020", walk: 0.2 }, { id: "l4", kind: "streetpotato", x: LX + 0.8, y: 0, z: -0.5, rot: -8, dress: "suit", color: "#c8305e", walk: 0.4 },
  // the table, the pot and the watch
  { id: "lamp", kind: "pokerlamp", x: TX, y: 0, z: 0, rot: 0 },
  { id: "table", kind: "pokertable", x: TX, y: 0, z: 0, rot: 0, w: 2.4, d: 1.4, h: FELT },
  { id: "pot", kind: "chippile", x: TX + 0.05, y: FELT, z: -0.05, rot: 20, r: 0.36, amount: 1 },
  { id: "watch", kind: "goldwatch", x: TX + 0.28, y: FELT, z: 0.4, rot: 12, glint: 1 },
  // the thought
  { id: "bub", kind: "thoughtbubble", x: BX, y: 1.5, z: 0, rot: 0, r: 0.35, obj: "cards83", pop: 1, glow: 1 },
];
const beats = c.beats(SHOTS.map(([cam, label], i) => [`${cam}${i + 1}`, i, CAMS[cam], label]), 7.4);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "street-props", title: "Neon street props bench", idea: "Props bench for There's a catch EP06 (neonstreet, streetpotato, goldwatch, cards83), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#05081e", floor: "none" }, hud: { sky: false }, music: false, sound: { auto: false },
  hook: { show: ["spud"], hint: 0, what: "engine test" },
  cast: [{ id: "spud", character: "potatobrawl/spud", at: [0, -2], face: 0, expr: "terrified", follow: 0.2, seed: 1.3 }],
  props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/06-read-minds/bench/make-street-props.mjs (props bench, no reviews).",
});
