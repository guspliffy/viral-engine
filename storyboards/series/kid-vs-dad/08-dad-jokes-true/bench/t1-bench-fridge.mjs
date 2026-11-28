// T1 bench for Kid vs Dad 08 (DESIGN.md sections 0, 2, 3, 4; engine/page/props-jokes-fridge.js, props-fridge.js switches, grips.mjs SIZE). Not a clip.
// World = frame K. One still a second (0.5 ... 16.5), each beat its own camera:
//   0.5 camera 09 (top = moon, row b1..b4)   1.5 camera 09 (top = toast)   2.5 camera 05 (top = corner)   3.5 camera 05 (top = toast)
//   4.5 the 7 pictures at 240 px across      5.5 the 7 pictures at 64 px across
//   6.5 .. 9.5   Dad's instacam in his `mug` hold: eject 0, 0.5, 1, then flash 1 (eject 0.5)     10.5 the same from his right side
//   11.5 .. 14.5 Tato's instacam in his `box` hold: eject 0, 0.5, 1, then flash 1 (eject 0.5)
//   15.5 / 16.5  an instacam alone, 3/4 view, flash 0 / flash 1
//   node storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t1-bench-fridge.mjs
//   node engine/render.mjs storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t1-bench-fridge.json --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5 --draft --safe
//   node qa/contact.mjs out/t1-bench-fridge-*.png --out storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t1-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const cam = (pos, look, fov = 40) => ({ pos, look, fov });
// the ladder (section 2): photo centre = door front plane -1.499 + 0.0025
const KX = 1.35, KY = 0.36, KZ = -1.4965;
const SLOT = { top: [0, 0.8725, -2], b1: [0.236, 0.26, 4], b2: [0.079, 0.26, -3], b3: [-0.078, 0.26, 2], b4: [-0.235, 0.26, -5] };
const photo = (id, pic, slot, o = {}) => ({ id, kind: "jokephoto", pic, x: r3(KX + SLOT[slot][0]), y: r3(KY + SLOT[slot][1]), z: KZ, rot: 0, roll: SLOT[slot][2], ...o });
const props = [
  { id: "kitchen", kind: "kitchenroom", x: 0, y: 0, z: 0, fridge: false, lamp: 1, time: 2.75 },
  { id: "fridge", kind: "openfridge", x: KX, y: 0, z: -1.78, rot: 0, scale: 0.75, open: 0, lit: 0, note: false, handleY: [1.0, 1.5] },
  { id: "ladder", kind: "jokeladder", x: KX, y: KY, z: -1.499, rot: 0 },
  photo("b1", "corner", "b1"), photo("b2", "sneakers", "b2"), photo("b3", "beard", "b3"), photo("b4", "sandwich", "b4"),
  photo("ptM", "moon", "top"), photo("ptT", "toast", "top", { scale: 0.001, roll: 3 }), photo("ptC", "corner", "top", { scale: 0.001 }),
];
// the seven pictures: a 240 px sheet (4 + 3, x 30) and a 64 px row (x 40)
const PICS = ["corner", "sneakers", "beard", "sandwich", "moon", "toast", "blank"];
PICS.forEach((p, i) => {
  const row = i < 4 ? 0 : 1, col = row ? i - 4 : i, n = row ? 3 : 4;
  props.push({ id: "big" + i, kind: "jokephoto", pic: p, x: r3(30 + (col - (n - 1) / 2) * 0.16), y: row ? 1.28 : 1.5, z: 0, rot: 0 });
  props.push({ id: "sm" + i, kind: "jokephoto", pic: p, x: r3(40 + (i - 3) * 0.2), y: 1.4, z: 0, rot: 0 });
});
// the hand-held cameras
const CAMD = { id: "camD", kind: "instacam", ...grips.placeFor("instacam", [19.9, 0.34, 0.62], 0), eject: 0, flash: 0 };
const CAMT = { id: "camT", kind: "instacam", ...grips.placeFor("instacam", [22.4, 0.25, 0.42], 0), eject: 0, flash: 0 };
const ALONE = { id: "cam0", kind: "instacam", x: 50, y: 0.9, z: 0, rot: -30, eject: 0.6, flash: 0 };
props.push(CAMD, CAMT, ALONE);
const cast = [
  { id: "dad", character: "potatobrawl/dad", at: [20, 0], face: 0, expr: "kind", follow: 0, seed: 1.1 },
  { id: "tato", character: "potatobrawl/spud-kid", at: [22.4, 0], face: 0, expr: "kind", follow: 0, seed: 2.9 },
];
grips.mug(c, "dad", CAMD, { side: "R" }).take(0, { reach: 0.01, settle: 0.01 });
grips.box(c, "tato", CAMT).take(0, { reach: 0.01, settle: 0.01 });

// states by beat (set a hair before each cut)
const P = (t, id, set) => c.prop(r3(t), id, set, 0);
P(0.99, "ptM", { scale: 0.001 }); P(0.99, "ptT", { scale: 1 });                                        // 1.5: toast on top
P(1.99, "ptT", { scale: 0.001 }); P(1.99, "ptC", { scale: 1 });                                        // 2.5: corner on top
P(2.99, "ptC", { scale: 0.001 }); P(2.99, "ptT", { scale: 1 });                                        // 3.5: toast on top
for (const [t, e, f] of [[6, 0, 0], [7, 0.5, 0], [8, 1, 0], [9, 0.5, 1], [10, 0.5, 0]]) P(t - 0.01, "camD", { eject: e, flash: f });
for (const [t, e, f] of [[11, 0, 0], [12, 0.5, 0], [13, 1, 0], [14, 0.5, 1]]) P(t - 0.01, "camT", { eject: e, flash: f });
P(15.99, "cam0", { flash: 1 });

const SH = [
  ["camera 09, top moon", cam([1.35, 0.875, 1.20], [1.35, 0.875, -1.50], 30)],
  ["camera 09, top toast", cam([1.35, 0.875, 1.20], [1.35, 0.875, -1.50], 30)],
  ["camera 05, top corner", cam([0.95, 1.25, -0.20], [1.38, 1.27, -1.50], 34)],
  ["camera 05, top toast", cam([0.95, 1.25, -0.20], [1.38, 1.27, -1.50], 34)],
  ["7 pictures at 240 px", cam([30, 1.39, 1.366], [30, 1.39, 0], 46)],
  ["7 pictures at 64 px", cam([40, 1.4, 5.13], [40, 1.4, 0], 46)],
  ...[0, 0.5, 1].map((e) => [`Dad, mug hold, eject ${e}`, cam([19.7, 0.6, 1.7], [19.9, 0.45, 0.62], 36)]),
  ["Dad, flash 1 (eject 0.5)", cam([19.7, 0.6, 1.7], [19.9, 0.45, 0.62], 36)],
  ["Dad, from his right side", cam([18.5, 0.6, 0.75], [19.9, 0.45, 0.62], 40)],
  ...[0, 0.5, 1].map((e) => [`Tato, box hold, eject ${e}`, cam([22.3, 0.75, 1.55], [22.4, 0.33, 0.42], 48)]),
  ["Tato, flash 1 (eject 0.5)", cam([22.3, 0.75, 1.55], [22.4, 0.33, 0.42], 48)],
  ["camera alone, 3/4, flash 0", cam([49.7, 1.15, 0.9], [50, 1.0, 0], 30)],
  ["camera alone, 3/4, flash 1", cam([49.7, 1.15, 0.9], [50, 1.0, 0], 30)],
];
const beats = c.beats(SH.map(([label, k], i) => [`s${i}`, i, k, `${i}.5 ${label}`]), SH.length);

write(import.meta.url, {
  tool: "a builder bench for the fridge ladder, photos and instant camera (Kid vs Dad 08 T1), never a video",
  id: "t1-bench-fridge", title: "T1 bench: jokeladder, jokephoto, instacam", idea: "Prop bench for props-jokes-fridge.js, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", night: true, floor: "none", light: "dusk", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade: [[0, { s: 1.12, w: 0.5, c: 1, lift: 0.03, tint: "#ffffff" }]],
  fx: [{ do: "lights", at: 0, to: 1, lamp: 1, dur: 0.01 }],
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "prop test" },
  cast, props, captions: c.captions, beats,
  allowClip: [{ who: "dad", with: "camD", from: 0, to: 30, reason: "bench: the camera is held" }, { who: "tato", with: "camT", from: 0, to: 30, reason: "bench: the camera is held" }],
  notes: "Test bench, not a clip. Generated by storyboards/series/kid-vs-dad/08-dad-jokes-true/bench/t1-bench-fridge.mjs (T1).",
});
