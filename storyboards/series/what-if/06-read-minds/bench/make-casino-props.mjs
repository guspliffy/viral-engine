// Bench for the casino props (engine/page/props-casino.js, task T1 of storyboards/series/what-if/06-read-minds/BRIEF-T1.md).
// One scene, ten stills 1 s apart (each 0.6 s into its beat), a plain set under the casino hall's own carpet. Not a clip.
//   still 1  wide from x 0, y 1.6, z 6 looking at 0, 1.2, -6 (fov 50): the table, four sschair, the lamp, 6 guests, the hall
//   still 2  table close from 2 m: chippile 1, two chipstacks (red 12, blue 7), chipmountain grow 0.5
//   still 3  the same, pile amount 0.3, chipmountain grow 1
//   still 4  cards on the felt: playcard 2h and 7s face up, a cardfan of four aces, spread 1
//   still 5  carkeys on the felt
//   still 6  three guests close (tux, two gowns, one cheering, one swaying)
//   still 7  the wide again with dim 1 and the pot gone (the end shots)
//   still 8  the chipmountain at grow 1 from low, the way panel 06 sees it (a seated potato's head top 1.2 m up)
//   still 9  the left slot bank, two guests      still 10  the roulette table
//   node storyboards/series/what-if/06-read-minds/bench/make-casino-props.mjs
//   node engine/render.mjs storyboards/series/what-if/06-read-minds/bench/casino-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6 --draft --safe
//   node qa/contact.mjs out/casino-props-*.png --out storyboards/series/what-if/06-read-minds/bench/casino-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const END = 10.4, FELT = 0.62;
const CAMS = {
  wide: { pos: [0, 1.6, 6], look: [0, 1.2, -6], fov: 50 },
  table: { pos: [0.2, 1.2, 2.0], look: [0, 0.72, 0.0], fov: 42 },
  cards: { pos: [0.1, 0.98, 0.98], look: [0.1, 0.68, 0.3], fov: 32 },
  keys: { pos: [-0.05, 0.86, 0.6], look: [-0.05, 0.64, 0.2], fov: 24 },
  guests: { pos: [3.9, 1.15, 4.2], look: [3.9, 0.55, 2.0], fov: 40 },
  slots: { pos: [-1.5, 1.3, -1.0], look: [-6.5, 0.9, -7.5], fov: 55 },
  roul: { pos: [1.8, 2.3, -4.2], look: [3.2, 0.7, -8], fov: 50 },
  low: { pos: [-0.2, 0.9, 2.6], look: [-0.75, 0.9, 0], fov: 40 },
};
// [camera, label]
const SHOTS = [["wide", "wide of the hall"], ["table", "table close, pile 1, mountain 0.5"], ["table", "pile 0.3, mountain 1"], ["cards", "cards on the felt"],
  ["keys", "car keys"], ["guests", "guests close"], ["wide", "wide, dim 1"], ["low", "mountain from low"], ["slots", "left slot bank, two guests"], ["roul", "roulette table"]];

const props = [
  { id: "hall", kind: "casinohall", x: 0, y: 0, z: 0, rot: 0, w: 20, d: 24, h: 7.5, dim: 0 },
  { id: "table", kind: "pokertable", x: 0, y: 0, z: 0, rot: 0, w: 2.4, d: 1.4, h: FELT },
  { id: "lamp", kind: "pokerlamp", x: 0, y: 0, z: 0, rot: 0 },
  { id: "chairA", kind: "sschair", x: -0.55, y: 0, z: -1.05, rot: 0 }, { id: "chairB", kind: "sschair", x: 0.55, y: 0, z: -1.05, rot: 0 },
  { id: "chairC", kind: "sschair", x: -1.6, y: 0, z: 0.05, rot: 90 }, { id: "chairD", kind: "sschair", x: 1.6, y: 0, z: 0.05, rot: -90 },
  { id: "pot", kind: "chippile", x: 0.05, y: FELT, z: -0.05, rot: 20, r: 0.36, amount: 1 },
  { id: "stk1", kind: "chipstack", x: 0.62, y: FELT, z: 0.28, rot: 0, n: 12, color: "#c62828" },
  { id: "stk2", kind: "chipstack", x: 0.74, y: FELT, z: 0.22, rot: 0, n: 7, color: "#1e4fb5" },
  { id: "stk3", kind: "chipstack", x: 0.9, y: FELT, z: 0.3, rot: 0, n: 9, color: "#2e7d32" },
  { id: "stk4", kind: "chipstack", x: 0.8, y: FELT, z: 0.42, rot: 0, n: 5, color: "#f2f2f2" },
  { id: "stk5", kind: "chipstack", x: 0.68, y: FELT, z: 0.44, rot: 0, n: 10, color: "#222" },
  { id: "mtn", kind: "chipmountain", x: -0.78, y: FELT, z: -0.05, rot: 0, w: 0.9, d: 0.6, h: 1.9, grow: 0.5 },
  { id: "c2h", kind: "playcard", x: 0.2, y: FELT + 0.002, z: 0.52, rot: 24, tip: -90, flip: 1, card: "2h" },
  { id: "c7s", kind: "playcard", x: 0.36, y: FELT + 0.002, z: 0.5, rot: -12, tip: -90, flip: 1, card: "7s" },
  { id: "fan", kind: "cardfan", x: -0.2, y: FELT, z: 0.34, rot: 0, cards: ["As", "Ah", "Ad", "Ac"], spread: 1 },
  { id: "keys", kind: "carkeys", x: -0.05, y: FELT, z: 0.2, rot: 25 },
  // six guests among the slot machines
  { id: "g1", kind: "casinoguest", x: -5.4, y: 0, z: -4, rot: -90, dress: "tux", sway: 1 }, { id: "g2", kind: "casinoguest", x: -5.5, y: 0, z: -8, rot: -90, dress: "gown", color: "#7a1f3d", sway: 1 },
  { id: "g3", kind: "casinoguest", x: 5.5, y: 0, z: -5, rot: 90, dress: "gown", color: "#1f5a7a", sway: 1 }, { id: "g4", kind: "casinoguest", x: 5.4, y: 0, z: -9, rot: 90, dress: "tux", sway: 1 },
  { id: "g5", kind: "casinoguest", x: -3.2, y: 0, z: -11, rot: 20, dress: "gown", color: "#5a2a7a", sway: 1 }, { id: "g6", kind: "casinoguest", x: 2.0, y: 0, z: -12, rot: -15, dress: "tux", sway: 1 },
  // the close lineup
  { id: "h1", kind: "casinoguest", x: 3.45, y: 0, z: 2.0, rot: 10, dress: "tux", sway: 1 }, { id: "h2", kind: "casinoguest", x: 3.95, y: 0, z: 2.0, rot: 0, dress: "gown", color: "#7a1f3d", cheer: 1 },
  { id: "h3", kind: "casinoguest", x: 4.45, y: 0, z: 2.0, rot: -10, dress: "gown", color: "#1f6a5a", sway: 1 },
];
// seed the keys propState has no default for (spread, n, sway, cheer, dim), then one jump per beat
c.prop(0, "hall", { dim: 0 }, 0, "linear"); for (const id of ["c2h", "c7s"]) c.prop(0, id, { flip: 1 }, 0, "linear");
c.prop(6.01, "hall", { dim: 1 }, 0, "linear"); c.prop(6.01, "pot", { amount: 0 }, 0, "linear");
c.prop(2.01, "pot", { amount: 0.3 }, 0, "linear"); c.prop(2.01, "mtn", { grow: 1 }, 0, "linear");
c.prop(7.01, "pot", { amount: 1 }, 0, "linear"); c.prop(7.01, "mtn", { grow: 1 }, 0, "linear"); c.prop(7.01, "hall", { dim: 0 }, 0, "linear");

const beats = c.beats(SHOTS.map(([cam, label], i) => [`${cam}${i + 1}`, i, CAMS[cam], label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "casino-props", title: "Casino props bench", idea: "Props bench for There's a catch EP06 (casinohall, pokertable, chips, cards, guests), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#0a0608", floor: "#120a0a" }, sky: [[0, 1]], hud: { sky: false }, music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast: [], props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/06-read-minds/bench/make-casino-props.mjs (props bench, no reviews).",
});
