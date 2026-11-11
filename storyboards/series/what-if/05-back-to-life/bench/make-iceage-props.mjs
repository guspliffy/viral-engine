// Bench for the ice-age animals (engine/page/props-iceage.js, task T2 of storyboards/series/what-if/05-back-to-life/BRIEF-T2.md):
// mammoth, sabre-tooth and pterosaur on the plain golden set with the existing T. rex and Spud (back to camera, looking up).
// Not a clip. One still per beat, 1 s apart, each taken 0.6 s into its beat; every beat sets every animal param (dur 0).
//   A  low wide (panel 06): calm, then starving        B  looking up at the faces (panel 08): starving
//   C  side on, 6 m away, each animal alone (the others are moved away for those beats)
//   node storyboards/series/what-if/05-back-to-life/bench/make-iceage-props.mjs   (prints the still times and their labels)
//   node engine/render.mjs storyboards/series/what-if/05-back-to-life/bench/btl-iceage-props.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/btl-iceage-props-*.png --out storyboards/series/what-if/05-back-to-life/bench/iceage-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };

const CAM_A = { pos: [-0.3, 0.3, 8.6], look: [0.8, 2.9, -4.6], fov: 54 };
const CAM_B = { pos: [0.1, 0.45, 3.5], look: [0.05, 2.45, -1], fov: 55 };

// where everything stands in the A and B shots
const HOME = {
  mam: { kind: "mammoth", x: 3.3, y: 0, z: -3.4, rot: -70 },
  sab: { kind: "sabretooth", x: -1.9, y: 0, z: -2.1, rot: 65 },
  pte: { kind: "pterosaur", x: 1.5, y: 5.5, z: -3, rot: 90 },
  rex: { kind: "trex", x: 0.4, y: 0, z: -5.5, rot: 0, scale: 1.5 },
};
// every param of every animal, at rest (the bench sets all of them at each beat)
const REST = {
  mam: { gait: 0, trunk: 0, trunkY: 0, ears: 0, glow: 0, jaw: 0, brow: 0, squint: 0, blink: 0, lookX: 0, lookY: 0, headY: 0, headP: 0, drool: 0, breath: 0 },
  sab: { gait: 0, bound: 0, crouch: 0, lick: 0, tail: 0, glow: 0, jaw: 0, brow: 0, squint: 0, blink: 0, lookX: 0, lookY: 0, headY: 0, headP: 0, drool: 0, breath: 0 },
  pte: { flap: 0, bank: 0, fold: 0, glow: 0, jaw: 0, brow: 0, squint: 0, blink: 0, lookX: 0, lookY: 0, headY: 0, headP: 0, drool: 0, breath: 0 },
};
const CALM = { brow: 0.4, lookY: 0.1 };
const STARVING = { brow: -1, squint: 0.7, jaw: 0.3, drool: 1, lookY: -1, headP: 12 };
const FAR = 60;   // an animal that is not in the shot stands this far off to the side

// a side-on camera 6 m from an animal, looking at its middle
const side = (id, look, fov) => {
  const h = HOME[id], a = (h.rot * Math.PI) / 180;
  return { pos: [r3(h.x + 6 * Math.cos(a)), look, r3(h.z - 6 * Math.sin(a))], look: [h.x, look, h.z], fov };
};
// a face close-up: the camera `d` m in front of the head (in the animal's own frame), at height `cy`, looking at the face
const faceCam = (id, head, d, cy, fov) => {
  const h = HOME[id], a = (h.rot * Math.PI) / 180, f = [Math.sin(a), Math.cos(a)];
  return { pos: [r3(h.x + f[0] * (head[1] + d)), cy, r3(h.z + f[1] * (head[1] + d))], look: [r3(h.x + f[0] * head[1]), h.y + head[0], r3(h.z + f[1] * head[1])], fov };
};
const C = { mam: side("mam", 1.5, 76), sab: side("sab", 0.6, 40), pte: side("pte", 5.5, 48) };

// [label, camera, solo (the one animal in the shot) | null, { id: params }]
const SHOTS = [
  ["A calm", CAM_A, null, { mam: CALM, sab: CALM, pte: CALM }],
  ["A starving", CAM_A, null, { mam: STARVING, sab: STARVING, pte: STARVING }],
  ["B starving", CAM_B, null, { mam: STARVING, sab: STARVING, pte: STARVING }],
  ["face mammoth calm", faceCam("mam", [2.0, 1.6], 3.6, 1.5, 40), "mam", { mam: CALM }],
  ["face mammoth starving", faceCam("mam", [2.0, 1.6], 3.6, 1.5, 40), "mam", { mam: STARVING }],
  ["face sabre calm", faceCam("sab", [0.8, 0.9], 1.7, 0.7, 40), "sab", { sab: CALM }],
  ["face sabre starving", faceCam("sab", [0.8, 0.9], 1.7, 0.6, 40), "sab", { sab: STARVING }],
  ["face ptero calm", faceCam("pte", [0.2, 0.75], 1.5, 5.6, 40), "pte", { pte: CALM }],
  ["face ptero starving", faceCam("pte", [0.2, 0.75], 1.5, 5.3, 40), "pte", { pte: STARVING }],
  ["mammoth gait 0", C.mam, "mam", { mam: {} }],
  ["mammoth gait 0.25", C.mam, "mam", { mam: { gait: 0.25 } }],
  ["mammoth gait 0.5", C.mam, "mam", { mam: { gait: 0.5 } }],
  ["mammoth glow 0.5", C.mam, "mam", { mam: { glow: 0.5 } }],
  ["mammoth glow 1", C.mam, "mam", { mam: { glow: 1 } }],
  ["mammoth trunk -1", C.mam, "mam", { mam: { trunk: -1 } }],
  ["mammoth trunk 1", C.mam, "mam", { mam: { trunk: 1 } }],
  ["sabre gait 0", C.sab, "sab", { sab: {} }],
  ["sabre gait 0.25", C.sab, "sab", { sab: { gait: 0.25 } }],
  ["sabre gait 0.5", C.sab, "sab", { sab: { gait: 0.5 } }],
  ["sabre glow 0.5", C.sab, "sab", { sab: { glow: 0.5 } }],
  ["sabre glow 1", C.sab, "sab", { sab: { glow: 1 } }],
  ["sabre crouch 1 lick 0.5", C.sab, "sab", { sab: { crouch: 1, lick: 0.5 } }],
  ["ptero flap 0", C.pte, "pte", { pte: {} }],
  ["ptero flap 0.25", C.pte, "pte", { pte: { flap: 0.25 } }],
  ["ptero flap 0.75", C.pte, "pte", { pte: { flap: 0.75 } }],
  ["ptero glow 0.5", C.pte, "pte", { pte: { glow: 0.5 } }],
  ["ptero glow 1", C.pte, "pte", { pte: { glow: 1 } }],
  ["ptero fold 1", C.pte, "pte", { pte: { fold: 1 } }],
];
const END = SHOTS.length;

const props = Object.entries(HOME).map(([id, h]) => ({ id, ...h, ...(REST[id] ?? {}), ...(id === "sab" && { tail: 0 }) }));
SHOTS.forEach(([, , solo, set], i) => {
  const t = i + 0.01;
  for (const id of Object.keys(HOME)) {
    const away = solo && id !== solo;   // alone in the C shots
    const h = HOME[id];
    c.prop(t, id, { x: away ? h.x + FAR : h.x, y: h.y, z: h.z, rot: h.rot, ...(REST[id] ?? {}), ...(set[id] ?? {}) }, 0, "linear");
  }
});

const cast = [{ id: "spud", character: "potatobrawl/spud", at: [0.1, -0.7], face: 180, expr: "terrified", follow: 0.2, seed: 1.3 }];
c.A(0, "spud", "look", { to: [0, 0.4], dur: 0.01, blink: false });

const beats = c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, cam, label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "btl-iceage-props", title: "Ice-age animals bench", idea: "Props bench for There's a catch EP05 (mammoth, sabretooth, pterosaur), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["spud", "mam"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/05-back-to-life/bench/make-iceage-props.mjs (props bench, no reviews).",
});
