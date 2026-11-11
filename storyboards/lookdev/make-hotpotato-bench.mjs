// Hot Potato prop bench (task T2, 11 Nov 2026): the hand props of engine/page/props-hotpotato.js on a plain set with a
// small cast. Not a clip: a lookdev check of the coal, the tongs, the bow tie and the fry-basket lift.
//   0.0 s  the coal alone, close up (glow 1, smoke 1)
//   1.8 s  Spud's cupped gloves round the coal at chest height (the grip library's bowl hold)
//   3.0 s  the host's glove on the tongs, the coal in their jaws (carried by the tongs), from the front
//   4.0 s  the same from above and the left (the jaws hold the coal at the pads, nothing through the glove)
//   5.0 s  the rainbow bow tie on the host's chest under his face (singe 0)
//   6.0 s  a second host standing in the lift basket, his bow tie singed (singe 1), the pole beside him
//   node storyboards/lookdev/make-hotpotato-bench.mjs && node engine/render.mjs storyboards/lookdev/hotpotato-bench.json --stills beats --draft --safe
//   node qa/contact.mjs out/hotpotato-bench-*-t*.png --out out/hotpotato-bench.png
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as grips from "../lib/grips.mjs";

const c = clip(), { A } = c;
const END = 7.0;

// ---- who stands where (metres; face 0 = toward the camera at +z, minus turns toward -x) ---------------------------
const SPUD = [-1.6, 0], HOST = [1.25, 0], LIFT = [3.9, 0], COAL_ALONE = [-3.6, 0];
const TONGS = { at: [0.72, 0.5, 0.45], rot: -90, tip: 10 };   // the hinge in the host's right glove, the jaws toward Spud
const TIP = (TONGS.tip * Math.PI) / 180;
// the coal rides the jaws: the carry offset ignores the tongs' tip, so it is turned by hand (props-hotpotato.js header)
const COAL_OFF = [0, r3(-0.5 * Math.sin(TIP)), r3(0.5 * Math.cos(TIP))];
const LIFT_Y = 0.5;

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD, face: 0, expr: "kind", follow: 0.3, seed: 2.9 },
  { id: "host", character: "halloween/wizard-host", at: HOST, face: -20, expr: "delighted", follow: 0.3, seed: 0.4 },
  { id: "hostB", character: "halloween/wizard-host", at: LIFT, y: LIFT_Y, face: 0, expr: "kind", follow: 0.3, seed: 0.9 },
];

// ---- the props ----------------------------------------------------------------------------------------------------
const PLINTH = { x: SPUD[0], z: 0.42, h: 0.14 };
const COAL = { id: "coalS", kind: "hpcoal", x: PLINTH.x, y: r3(PLINTH.h + 0.094), z: PLINTH.z, glow: 1, smoke: 0.6 };
const props = [
  // the coal alone on the floor (the lump's lowest point is 0.094 under its middle)
  { id: "coalA", kind: "hpcoal", x: COAL_ALONE[0], y: 0.094, z: COAL_ALONE[1], glow: 1, smoke: 1 },
  // Spud's: it lies on a plinth in front of him, his gloves close on its lower sides, and he lifts it to his chest
  { id: "plinth", kind: "stoneblock", x: PLINTH.x, y: 0, z: PLINTH.z, w: 0.3, h: PLINTH.h, d: 0.3, cap: 0 },
  COAL,
  // the tongs hang in the host's glove (his hand follows them: a prop carried by another prop rides the carrier's own
  // tween position, never a hand, props3d.js carriedAt) and carry the coal between their pads
  { id: "tongs", kind: "hptongs", x: TONGS.at[0], y: TONGS.at[1], z: TONGS.at[2], rot: TONGS.rot, tip: TONGS.tip, open: 0.25,
    staged: "the host's hand follows the tongs (the coal is carried by them, which a hand-held carrier cannot do)" },
  { id: "coalT", kind: "hpcoal", x: TONGS.at[0], y: TONGS.at[1], z: TONGS.at[2], glow: 1, smoke: 0.6 },
  // the bow tie, worn: a point in the host's body frame (his chest, under the face)
  { id: "tie0", kind: "hpbowtie", wear: "host", x: 0, y: 0.34, z: 0.33, singe: 0 },
  { id: "tie1", kind: "hpbowtie", wear: "hostB", x: 0, y: 0.42, z: 0.33, singe: 1 },
  { id: "lift", kind: "hplift", x: LIFT[0], y: LIFT_Y, z: LIFT[1], drip: 1 },
];

// ---- Spud takes the coal in both gloves and lifts it to his chest ---------------------------------------------------
{
  const h = grips.bowl(c, "spud", COAL);
  let t = h.take(0.0);
  h.carry(t + 0.15, [SPUD[0], 0.34, 0.34], 0.6);
  A(0, "spud", "look", { to: [0, -0.4], dur: 0.01, blink: false });
}

// ---- the host holds the tongs, the coal in their jaws ---------------------------------------------------------------
c.at(0, { do: "carry", prop: "coalT", by: "tongs", off: COAL_OFF });
c.arm(0, "host", "R", { prop: "tongs", grip: "hold", palm: [0, 0, 0.13] }, 0.005);
A(0, "host", "grip", { side: "R", shape: "clasp", dur: 0.005 });
A(0, "host", "look", { to: [-0.6, -0.2], dur: 0.01, blink: false });
A(0, "hostB", "ride", { prop: "lift", off: [0, 0.02, 0], yaw: 0, dur: 0 });

// ---- cameras ------------------------------------------------------------------------------------------------------
const beats = c.beats([
  ["coal alone", 0, frame([COAL_ALONE[0], 0.3, 0], { az: 0, el: 6, h: 1.0, fov: 30 })],
  ["Spud cups the coal", 1.8, frame([SPUD[0], 0.5, 0.3], { az: 0, el: 4, h: 1.5, fov: 30 })],
  ["tongs, front", 3.0, frame([0.5, 0.45, 0.45], { az: 0, el: 4, h: 1.6, fov: 30 })],
  ["tongs, from above", 4.0, frame([0.5, 0.45, 0.45], { az: -38, el: 32, h: 1.6, fov: 30 })],
  ["bow tie, singe 0", 5.0, frame([HOST[0], 0.5, 0.3], { az: 0, el: 2, h: 1.1, fov: 30 })],
  ["the lift, singe 1", 6.0, frame([LIFT[0] + 0.1, 0.95, 0], { az: 0, el: 6, h: 2.4, fov: 32 })],
], END);

write(import.meta.url, {
  id: "hotpotato-bench", title: "Hot Potato props bench", idea: "Prop bench (task T2), not a clip: the coal, the tongs, the bow tie and the fry-basket lift",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  set: { type: "plain", color: "#8fc4ee", floor: "#4a4350", para: 0, bloom: "emissive", key: [0.6, 6.5, 4.0], aperture: 0, lighting: 2, hatch: { boil: 0.25 }, satsuei: true },
  music: false, sound: { auto: false }, hook: { show: ["spud", "host", "hostB"], hint: 0, what: "prop bench" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "spud", with: "coalS", from: 0, to: END, reason: "the cupped gloves hold the coal on their lower sides" },
    { who: "spud", with: "plinth", from: 0, to: 1.2, reason: "the gloves reach over the plinth's top to cup the coal that lies on it" },
    { who: "host", with: "tongs", from: 0, to: END, reason: "the glove closes on the tongs' handle (the hand follows the prop)" },
    { who: "hostB", with: "lift", from: 0, to: END, reason: "the host stands in the wire basket: his feet on the floor wires, the walls round him" },
  ],
  notes: "Generated by storyboards/lookdev/make-hotpotato-bench.mjs (prop bench, no reviews).",
});
