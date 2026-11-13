// Bench for EP07's neighbours (DESIGN.md 4 and 6 T3): engine/page/props-neonstreet.js streetpotato with the new dresses "pyjamas" and
// "bathrobe", hat 2 (the nightcap) and the param `angry`; engine/page/costumes-everyday.js `bathrobe` (the grumpy old neighbour,
// characters/what-if/grumpy-neighbour.json). One scene, a plain set, stills 1 s apart (each 0.6 s into its beat). Not a clip.
//   1-2  the 7 crowd potatoes of 4.1 in a row with a Spud (potatobrawl/spud) in the middle of them, angry 0: the left half (3 + Spud),
//        the right half (Spud + 4)
//   3-4  the same at angry 0.8 (5 of them 0.8, 2 of them 0.3 would be the clip; here all 0.8 to see the face and the arm)
//   5    walking strip, pyjamas: walk 0, 0.14, 0.28, 0.42 from the side, the same potato (feet on the ground, one forward one back)
//   6    walking strip, bathrobe + nightcap, the same
//   7-9  the grumpy neighbour next to Spud: front, 3/4, side (the side pair stands apart along z, so neither hides the other)
//   10   a close shot of his head: curlers, face, collar
//   11   his head through a 0.43 m door crack (two wall pieces with a gap), Spud in front of it
//   node storyboards/series/what-if/07-fire-rewind/bench/make-neighbours-bench.mjs
//   node engine/render.mjs storyboards/series/what-if/07-fire-rewind/bench/neighbours-bench.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,10.6 --draft --safe
//   node qa/contact.mjs out/neighbours-bench-*.png --out storyboards/series/what-if/07-fire-rewind/bench/neighbours-sheet.png
import { clip, write, r3, frame } from "../../../../lib/clip.mjs";

const c = clip();
const CX = 40, WX = 16, DX = 120, SX = -60;   // x of the crowd row, the walking strips, the door crack; SX the side pair (nothing stands behind it seen from +x); the front pair is at x 0
// the 7 of 4.1: h, dress, colour, hat (cap)
const CROWD = [
  [0.90, "pyjamas", "#7f9fd0", 0], [0.78, "bathrobe", "#d9c7a3", 2, "#a85a5a"], [0.86, "pyjamas", "#9fc3a0", 2, "#9fc3a0"], [0.74, "bathrobe", "#8a7fb4", 0],
  [0.92, "bathrobe", "#5f7f8f", 0], [0.80, "pyjamas", "#e0b3a0", 1], [0.84, "bathrobe", "#b7a1c8", 2, "#7a6a94"],
];
const SKIN = "#f9b75c";   // the streetpotato default is #e2a95c; the cast under castLook "sheet" (Spud, the neighbour) is this, so the crowd takes it to stand next to them
const GAP = 0.84, X0 = CX - 3 * GAP;   // 8 places in a row; the 4th (index 3) is Spud
const slot = (i) => r3(X0 + i * GAP);
const props = [];
CROWD.forEach(([h, dress, color, hat, capColor], i) => {
  const idx = i < 3 ? i : i + 1;   // Spud stands in the 4th place
  props.push({ id: `n${i + 1}`, kind: "streetpotato", x: slot(idx), y: 0, z: 0, rot: 0, h, dress, color, hat, skin: SKIN, ...(capColor && { capColor }), walk: 0, angry: 0, angryArm: i % 2 ? 1 : -1 });
});
// walking strips: the same potato at four step phases (auto 0: walk is the metres walked)
[["pj", { dress: "pyjamas", color: "#7f9fd0", h: 0.9, hat: 0 }, WX], ["rb", { dress: "bathrobe", color: "#d9c7a3", h: 0.86, hat: 2, capColor: "#a85a5a" }, WX + 8]].forEach(([id, spec, x0]) =>
  [0, 0.14, 0.28, 0.42].forEach((w, i) => props.push({ id: `${id}${i}`, kind: "streetpotato", x: r3(x0 + (i - 1.5) * 0.95), y: 0, z: 0, rot: 90, ...spec, walk: w })));
// a door crack of 0.43 m: two wall pieces 1.0 wide with the gap between them, the neighbour behind it
props.push({ id: "wallL", kind: "sidewall", x: r3(DX - 0.215 - 0.8), y: 0, z: 0, rot: 0, w: 1.6, h: 2.2 }, { id: "wallR", kind: "sidewall", x: r3(DX + 0.215 + 0.8), y: 0, z: 0, rot: 0, w: 1.6, h: 2.2 });

const CAMS = {
  crowdL: frame([slot(1.5), 0.5, 0], { az: 0, h: 6.4, fov: 30 }), crowdR: frame([slot(5), 0.5, 0], { az: 0, h: 6.4, fov: 30 }),
  stripP: frame([WX, 0.42, 0], { az: 0, h: 6.8, fov: 30 }), stripR: frame([WX + 8, 0.42, 0], { az: 0, h: 6.8, fov: 30 }),
  front: frame([0, 0.5, 0], { az: 0, h: 5.4, fov: 26 }), tq: frame([0, 0.5, 0], { az: 38, h: 5.4, fov: 26 }), side: frame([SX, 0.5, 0], { az: 90, h: 5.4, fov: 26 }),
  head: frame([0.8, 0.7, 0], { az: 20, el: 6, h: 1.9, fov: 24 }),
  crack: frame([DX - 0.3, 0.62, 0], { az: 16, el: 4, h: 3.2, fov: 30 }),
};
const SHOTS = [["crowdL", "7 crowd potatoes (left half) and Spud, angry 0"], ["crowdR", "right half, angry 0"], ["crowdL", "left half, angry 0.8"], ["crowdR", "right half, angry 0.8"],
  ["stripP", "walking strip, pyjamas, walk 0 .14 .28 .42"], ["stripR", "walking strip, bathrobe + nightcap"], ["front", "the grumpy neighbour next to Spud, front"], ["tq", "3/4"], ["side", "side"],
  ["head", "his head: curlers, face, collar"], ["crack", "his head through a 0.43 m door crack"]];
// angry 0.8 on all seven for stills 3-4 (the clip sets 0.8 on 5 and 0.3 on 2), set at the start of beat 3
for (let i = 1; i <= 7; i++) c.prop(2.0, `n${i}`, { angry: 0.8 }, 0);
const beats = c.beats(SHOTS.map(([cam, label], i) => [`${cam}${i + 1}`, i, CAMS[cam], label]), SHOTS.length + 0.4);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "neighbours-bench", title: "EP07 neighbours bench", idea: "Props and costume bench for There's a catch EP07 (streetpotato pyjamas, bathrobe, nightcap, angry; the grumpy neighbour), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#46506a", floor: "#8a8494", light: "warm", para: 0, bloom: "emissive", aperture: 0 }, hud: { sky: false }, music: false, sound: { auto: false },
  hook: { show: ["spud"], hint: 0, what: "engine test" },
  cast: [
    { id: "spud", character: "potatobrawl/spud", at: [-0.75, 0], face: 0, follow: 0.2, seed: 1.3 },
    { id: "grump", character: "what-if/grumpy-neighbour", at: [0.8, 0], face: 0, follow: 0.2, seed: 5.3 },
    { id: "spudside", character: "potatobrawl/spud", at: [SX, 0.85], face: 0, follow: 0.2, seed: 1.3 },
    { id: "grumpside", character: "what-if/grumpy-neighbour", at: [SX, -0.75], face: 0, follow: 0.2, seed: 5.3 },
    { id: "spudrow", character: "potatobrawl/spud", at: [slot(3), 0], face: 0, follow: 0.2, seed: 1.3 },
    { id: "spuddoor", character: "potatobrawl/spud", at: [DX - 0.7, 1.0], face: 165, follow: 0.2, seed: 1.3 },
    { id: "grumpdoor", character: "what-if/grumpy-neighbour", at: [DX + 0.02, -0.5], face: 0, follow: 0.2, seed: 5.3 },
  ],
  props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/07-fire-rewind/bench/make-neighbours-bench.mjs (props bench, no reviews).",
});
