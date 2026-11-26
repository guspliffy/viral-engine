// Cast bench for Kid vs Dad 04 (DESIGN.md sections 0, 4, 5; task T4). Not a clip. Set plain, look anime-pro, castLook sheet, no music, no captions.
//   the waiter (`characters/potatobrawl/mash-waiter.json`) at x 0 in his white shirt, black waistcoat and the worn `waiterapron` (y0 0.33, y1 0.04, rx 0.255, rz 0.24,
//   arc 150, band #f4f1ea, bandArc 360, bow true), `spudpad` (scale 0.85, bottom at y 0.40, 0.33 in front of him, tipped 20 back) in his left hand
//   (grips.phone, height 0.2) and `feltpen` in his right (grips.thin), its tip on the page's upper third.
//   the cook (`characters/potatobrawl/cook.json`) at x -1.2 (the casts stand 1.2 m apart) on a 0.51 `crate`, `toque` worn, palms together at y 0.82.
// One still a second from 1.5 s (0 to 1 s is the take); each from its own camera:
//   node storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-cast.mjs
//   node engine/render.mjs storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-cast.json --stills 1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5 --draft --safe
//   node qa/contact.mjs out/bench-cast-*.png --out out/bench-cast-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const cam = (pos, look, fov = 40) => ({ pos, look, fov });
const WX = 0, CX = -1.2, CRATE = 0.51;
const cast = [
  { id: "wait", character: "potatobrawl/mash-waiter", at: [WX, 0], face: 0, expr: "kind", follow: 0, seed: 3.1 },
  { id: "cook", character: "potatobrawl/cook", at: [CX, 0], y: CRATE, face: 0, expr: "kind", follow: 0, seed: 4.2 },
];
// pad: bottom edge at y 0.40, 0.33 in front of his middle, tipped 20 degrees back (top away from him: tip -20), the page toward him
const PAD = { id: "pad", kind: "spudpad", scale: 0.85, ...grips.placeFor("spudpad", [WX, 0.40, 0.33], 0), tip: -20, write: 0 };
// pen: the felt tip on the page's upper third (0.67 of the page's height up, x just right of his middle), a hand's breadth above the pad's face
const PEN = { id: "pen", kind: "feltpen", color: "#26262b", cap: "#26262b", ...grips.placeFor("feltpen", [WX - 0.02, 0.545, 0.305], 0), tip: -50 };
const props = [
  { id: "apron", kind: "waiterapron", wear: "wait", x: 0, y: 0, z: 0, y0: 0.33, y1: 0.04, rx: 0.255, rz: 0.24, arc: 150, band: "#f4f1ea", bandArc: 360, bow: true },
  PAD, PEN,
  { id: "crate", kind: "crate", x: CX, y: 0, z: 0, size: CRATE },
  { id: "toque", kind: "toque", wear: "cook", fit: { H: 0.46, W: 0.50, D: 0.46, taper: 0.02, legH: 0.14 }, h: 0.20, x: 0, y: 0, z: 0 },
];
const { A } = c;
// the waiter: both props taken at once, polite face (his neutral)
const hp = grips.phone(c, "wait", PAD, { side: "L", height: 0.2 });
const hn = grips.thin(c, "wait", PEN, { side: "R" });
A(0, "wait", "noblink");
let t = hp.take(0.0);
hn.take(0.05);
// the cook: lids shut, palms together under the mouth (y 0.79 to 0.86)
const PRAY = 0.82;
A(0, "cook", "noblink");
A(0, "cook", "expr", { expr: "serene", set: { tilt: 0.3, curve: -0.15 }, dur: 0.01 });
c.arm(0, "cook", "L", { world: [CX + 0.014, PRAY, 0.27] }, 0.4, "inOut");
c.arm(0, "cook", "R", { world: [CX - 0.014, PRAY, 0.27] }, 0.4, "inOut");
A(0.2, "cook", "grip", { side: "L", shape: "clasp", dur: 0.2 });
A(0.2, "cook", "grip", { side: "R", shape: "clasp", dur: 0.2 });

const WB = [WX, 0.62, 0], CB = [CX, CRATE + 0.55, 0];
const SH = [
  ["take (warm-up)", cam([0, 0.8, 3.4], [0, 0.65, 0], 32)],
  ["waiter front, full", cam([0, 0.75, 3.4], [0, 0.65, 0], 30)],
  ["waiter front, close: V, apron, pad, pen", cam([0, 0.8, 1.9], [0, 0.6, 0.1], 28)],
  ["waiter side (from his left)", cam([3.2, 0.7, 0.2], [0, 0.65, 0.1], 30)],
  ["waiter back, full (apron, bow)", cam([0, 0.75, -3.4], [0, 0.65, 0], 30)],
  ["bow close", cam([0.05, 0.4, -1.1], [0, 0.31, -0.24], 20)],
  ["pad and pen close, from the lens", cam([0, 0.6, 1.3], [0, 0.5, 0.3], 22)],
  ["camera 04 height: eyes at 0.9, from y 0.85", cam([0.3, 0.85, 2.2], [0, 0.85, 0], 36)],
  ["cook front, full on the crate", cam([CX, 0.7, 3.2], [CX, 0.6, 0], 30)],
  ["cook side (from his left)", cam([CX + 3.0, 0.85, 0.2], [CX, 0.7, 0.1], 30)],
  ["cook close: hat, face, hands", cam([CX, 0.95, 1.6], [CX, 0.88, 0.1], 24)],
  ["both, 1.2 apart, wide", cam([CX / 2, 0.8, 4.6], [CX / 2, 0.55, 0], 40)],
];
const beats = c.beats(SH.map(([label, k], i) => [`s${i}`, i, k, `${i}.5 ${label}`]), SH.length);

write(import.meta.url, {
  tool: "a builder bench for the waiter and cook (Kid vs Dad 04 T4), never a video",
  id: "bench-cast", title: "Cast bench: waiter and cook", idea: "Cast bench for Kid vs Dad 04 (DESIGN.md T4), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#efe2c8", floor: "#7b4650", light: "golden", para: 0, aperture: 0, lighting: 2, shade: "soft" },
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/kid-vs-dad/04-waiter-jokes/bench/bench-cast.mjs (T4 cast bench, no reviews).",
});
