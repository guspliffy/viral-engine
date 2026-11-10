// Bench for the money props (engine/page/props-money.js, task T1 of storyboards/series/what-if/04-copy-money/BRIEF-T1.md):
// one group per camera on a plain floor, 7 m apart so each camera sees only its own group. Not a clip.
//   coin        pinched at the rim's bottom in each glove at chest height (left shine 0, right shine 1)
//   flatcoins   three coins lying flat on a 0.38 m box (one shining, spun)
//   cashbrick   carried from above in the right glove, then lying on the box with the glove flat on it
//   cashthrone  build 0.1 (the low pile), 0.5, then 1 with Gunslinger sitting on it
//   walletheap  n 0.3 and 1 in his arms, then spill 0.5 and 1
//   cashheap    grow 0.5 and 1 on the box
//   node storyboards/series/what-if/04-copy-money/bench/make-money-props.mjs
//   node engine/render.mjs storyboards/series/what-if/04-copy-money/bench/money-props.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const GX = { coin: 0, flat: 7, brick: 14, throne: 21, heap: 28, pile: 35 };   // each group's x
const BOX_H = 0.38, END = 13.0;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GSL = "never-has-money/gunslinger";
const CGRIP = [0, -0.085, 0], PINCH = { shape: "tip", set: { roll: 30, lean: 30, thin: 0.006 } };   // MONEY_GRIPS.coin.pinch

// ---- coins pinched at the rim's bottom, chest height (his left glove is on our right)
const CL = [GX.coin + 0.36, 0.55, 0.4], CR = [GX.coin - 0.34, 0.55, 0.4];
const pinch = (who, side, id, at) => {
  c.arm(0, who, side, { prop: id, grip: CGRIP, point: "pinch", at }, 0.01); A(0, who, "grip", { side, ...PINCH, dur: 0.01 });
  A(0, who, "grab", { prop: id, hand: side, grip: CGRIP, dur: 0, pose: null, point: "pinch" });
  c.arm(0.02, who, side, { prop: id, grip: CGRIP, point: "pinch", at }, 0.01);
};
pinch("g1", "L", "coinL", CL); pinch("g1", "R", "coinR", CR);
A(0, "g1", "look", { to: [0, 0.1], dur: 0.01, blink: false });

// ---- coins flat on the box
const BOXF = { id: "boxf", kind: "dinercounter", x: GX.flat, z: 0.6, w: 1.2, d: 0.7, h: BOX_H, rot: 180 };
const FLATS = [["fl1", -0.3, 0.1, 0, 0], ["fl2", 0.0, 0.0, 1, 35], ["fl3", 0.32, 0.12, 0, 80]];

// ---- the brick: carried from above in the right glove (on our left), then laid on the box with the glove flat on it
const BOXB = { id: "boxb", kind: "dinercounter", x: GX.brick - 0.2, z: 1.15, w: 1.0, d: 0.7, h: BOX_H, rot: 180 };
const BR0 = [GX.brick - 0.42, 0.62, 0.5], BR1 = [GX.brick - 0.42, BOX_H, 1.0];
const BGRIP = [0, 0.11 + 0.055, 0.03], BPALM = [0, -0.89, 0.03];
const BRICK = { id: "brick", kind: "cashbrick", x: BR0[0], y: BR0[1], z: BR0[2], rot: 0, squash: 0 };
const bpose = (t, at, dur, ease) => c.arm(t, "g2", "R", { prop: "brick", grip: BGRIP, palm: BPALM, ...(at && { at }) }, dur, ease);
bpose(0, null, 0.01); A(0, "g2", "grip", { side: "R", shape: "flat", dur: 0.01 });
A(0, "g2", "grab", { prop: "brick", hand: "R", grip: BGRIP, dur: 0, pose: null });
bpose(0.02, BR0, 0.01);
bpose(2.55, BR1, 0.5, "inOut");
A(3.1, "g2", "release", { prop: "brick", dur: 0 });
A(0, "g2", "look", { to: [0, -0.2], dur: 0.01, blink: false });

// ---- the throne: build 0.1, 0.5, then 1 with Gunslinger sitting on it
const THRONE = { id: "throne", kind: "cashthrone", x: GX.throne, y: 0, z: 0, rot: 0, w: 1.25, d: 1.0, seat: 0.42, back: 1.7, build: 0 };
c.prop(0, "throne", { build: 0 }, 0, "linear");
c.prop(3.95, "throne", { build: 0.1 }, 0, "linear"); c.prop(4.95, "throne", { build: 0.5 }, 0, "linear"); c.prop(5.8, "throne", { build: 1 }, 0.3, "out");
A(5.7, "g3", "move", { to: [GX.throne + 0.3, 0.95], dur: 0.01, steps: 0 }); A(5.9, "g3", "sit", { seat: "throne", dur: 0.2 });

// ---- the wallet heap in his arms
const HEAP = { id: "heap", kind: "walletheap", x: GX.heap, y: 0.34, z: 0.42, rot: 0, n: 0, spill: 0, wobble: 0, count: 100 };
c.prop(0, "heap", { n: 0, wobble: 0 }, 0, "linear");
c.prop(6.95, "heap", { n: 0.3 }, 0, "linear"); c.prop(7.95, "heap", { n: 1 }, 0, "linear");
c.prop(8.95, "heap", { spill: 0.5 }, 0, "linear"); c.prop(9.95, "heap", { spill: 1 }, 0, "linear");
for (const [s, x] of [["R", -0.5], ["L", 0.5]]) { c.arm(0, "g4", s, { world: [GX.heap + x, 0.36, 0.5] }, 0.01); A(0, "g4", "grip", { side: s, shape: "flat", dur: 0.01 }); }
A(0, "g4", "look", { to: [0, 0.2], dur: 0.01, blink: false });

// ---- the cash heap on the box
const BOXP = { id: "boxp", kind: "dinercounter", x: GX.pile, z: 0.2, w: 1.2, d: 0.8, h: BOX_H, rot: 180 };
const PILE = { id: "pile", kind: "cashheap", x: GX.pile, y: BOX_H, z: 0.2, w: 0.6, d: 0.5, h: 0.36, grow: 0 };
c.prop(0, "pile", { grow: 0 }, 0, "linear"); c.prop(10.95, "pile", { grow: 0.5 }, 0, "linear"); c.prop(11.95, "pile", { grow: 1 }, 0.0, "linear");

const props = [
  { id: "coinL", kind: "coin", x: CL[0], y: CL[1], z: CL[2], rot: 0, shine: 0, flat: 0 },
  { id: "coinR", kind: "coin", x: CR[0], y: CR[1], z: CR[2], rot: 0, shine: 1, flat: 0 },
  BOXF, ...FLATS.map(([id, dx, dz, sh, sp]) => ({ id, kind: "coin", x: GX.flat + dx, y: BOX_H + 0.0085, z: BOXF.z - 0.2 + dz, rot: 0, shine: sh, flat: 1, spin: sp })),
  BOXB, BRICK,
  THRONE, HEAP, BOXP, PILE,
];

const cast = [
  { id: "g1", character: GSL, at: [GX.coin, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
  { id: "g2", character: GSL, at: [GX.brick, 0.15], face: 0, expr: "kind", follow: 0.2, seed: 1.4 },
  { id: "g3", character: GSL, at: [GX.throne + 3.4, 0.6], face: 0, expr: "kind", follow: 0.2, seed: 3.1 },
  { id: "g4", character: GSL, at: [GX.heap, 0], face: 0, expr: "kind", follow: 0.2, seed: 4.2 },
];

// [name, start, camera, label]; each beat is one still, taken 0.6 s after its start
const SHOTS = [
  ["coin", 0, { pos: [GX.coin + 0.1, 0.9, 3.4], look: [GX.coin, 0.55, 0.3], fov: 30 }, "coins pinched in each glove: shine 0 (our right) and shine 1 (our left)"],
  ["flatcoins", 1, { pos: [GX.flat, 1.3, 3.2], look: [GX.flat, 0.4, 0.4], fov: 32 }, "coins flat on a 0.38 m box: shine 0, shine 1 spun 35, spun 80"],
  ["brickcarry", 2, { pos: [GX.brick - 0.2, 1.0, 3.4], look: [GX.brick - 0.4, 0.62, 0.5], fov: 28 }, "brick carried from above in the right glove"],
  ["brickrest", 3, { pos: [GX.brick - 0.2, 1.1, 3.6], look: [GX.brick - 0.4, 0.4, 1.0], fov: 30 }, "brick lying on the box, the glove flat on it"],
  ["throne01", 4, { pos: [GX.throne + 2.2, 1.5, 5.2], look: [GX.throne, 0.8, 0], fov: 40 }, "cashthrone build 0.1: a low pile"],
  ["throne05", 5, { pos: [GX.throne + 2.2, 1.5, 5.2], look: [GX.throne, 0.8, 0], fov: 40 }, "cashthrone build 0.5"],
  ["throne1", 6, { pos: [GX.throne + 2.2, 1.5, 5.2], look: [GX.throne, 0.8, 0], fov: 40 }, "cashthrone build 1, Gunslinger sitting"],
  ["heap03", 7, { pos: [GX.heap + 0.6, 1.0, 4.4], look: [GX.heap, 0.5, 0.3], fov: 40 }, "wallet heap n 0.3 in his arms"],
  ["heap1", 8, { pos: [GX.heap + 0.6, 1.0, 4.4], look: [GX.heap, 0.5, 0.3], fov: 40 }, "wallet heap n 1 in his arms"],
  ["spill05", 9, { pos: [GX.heap + 0.4, 1.9, 6.4], look: [GX.heap, 0.2, 1.4], fov: 46 }, "wallet heap spill 0.5"],
  ["spill1", 10, { pos: [GX.heap + 0.4, 1.9, 6.4], look: [GX.heap, 0.2, 1.4], fov: 46 }, "wallet heap spill 1"],
  ["pile05", 11, { pos: [GX.pile + 0.2, 1.1, 3.2], look: [GX.pile, 0.5, 0.2], fov: 32 }, "cash heap grow 0.5"],
  ["pile1", 12, { pos: [GX.pile + 0.2, 1.1, 3.2], look: [GX.pile, 0.5, 0.2], fov: 32 }, "cash heap grow 1"],
];
for (const [, t, , label] of SHOTS) c.cap(t, t + 1, label, 240, false, { kinetic: false });
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.6)).join(","));

write(import.meta.url, {
  id: "money-props", title: "Money props bench", idea: "Props bench for There's a catch EP04 (coin, cashbrick, cashthrone, walletheap, cashheap), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#cfdde8", floor: "#8a8274" }, music: false, sound: { auto: false },
  hook: { show: ["g1", "coinL"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, s]) => [n, t, s]), END),
  notes: "Generated by storyboards/series/what-if/04-copy-money/bench/make-money-props.mjs (props bench, no reviews).",
});
