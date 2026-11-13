// Bench for the wedding props (engine/page/props-wedding.js, task T2 of storyboards/series/what-if/09-teleport-rings/DESIGN.md
// section 8): one group per camera on a plain floor, 7 m apart so each camera sees only its own group. Not a clip.
//   boxes   ringbox lid 0 / 1 x rings 0 / 2 (shut empty, shut with rings, open empty, open with two rings)
//   spin    two goldrings (seeds 0.13, 0.61) rattling flat from the landing frame: 12 fps strip of `spin` 0 -> 2.2 s
//   fall    spudleaf `fall` 0 -> 1 over 1.6 s onto a shelf: 12 fps strip
//   dust    a loose black bowtie hanging at 0.47 over the leaving dustring (0.50 s) and the arriving one (0.35 s): 12 fps strips
//   pairs   both goldring pair poses ("lean" on a flat palm, "link" in a glove) in Spud's glove
//   veil    bridalveil + bouquet on Mash: front, 3/4, back, and at 77 px tall
//   cast    Chip (flowerpin), Spud (bowtie worn), Spud bald, Mash with the veil, side by side
//   node storyboards/series/what-if/09-teleport-rings/bench/make-props-bench.mjs
//   node engine/render.mjs storyboards/series/what-if/09-teleport-rings/bench/props-bench.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { boxes: 0, spin: 7, fall: 14, dust: 21, lean: 28, link: 35, veil: 42, cast: 49, bald: 56, close: 63, tie: 70 };
const SPUD = "potatobrawl/spud", BALD = "what-if/spud-bald", CHIP = "potatobrawl/chip", MASH = "potatobrawl/mash";
const FPS12 = (t0, n) => Array.from({ length: n }, (_, i) => r3(t0 + i / 12));

// ---- boxes: 2 x 2, shut on the left, open on the right? rows: lid 0 (back) and lid 1 (front); columns rings 0 / 2
const BX = GX.boxes;
const boxes = [
  { id: "b00", lid: 0, rings: 0, x: BX - 0.17, z: 0.22 }, { id: "b02", lid: 0, rings: 2, x: BX + 0.17, z: 0.22 },
  { id: "b10", lid: 1, rings: 0, x: BX - 0.17, z: -0.22 }, { id: "b12", lid: 1, rings: 2, x: BX + 0.17, z: -0.22 },
].map(({ id, lid, rings, x, z }) => ({ id, kind: "ringbox", x, y: 0, z, rot: 0, lid, rings }));

// ---- two rings spinning on the floor from the landing frame (spin tween 0 -> 2.2, linear)
const SP0 = 1.5;
const rings = [["r1", GX.spin - 0.1, 0.13], ["r2", GX.spin + 0.12, 0.61]].map(([id, x, seed]) => ({ id, kind: "goldring", x, y: 0.015, z: 0, rot: 0, seed, spin: 0 }));
for (const [id] of [["r1"], ["r2"]]) c.prop(SP0, id, { spin: 2.2 }, 2.2, "linear");

// ---- the leaf falling onto a shelf (LEAF_FROM -> LEAF_LAND, shifted to this group)
const FA0 = 4.4, FX = GX.fall - 1.05;
const leaf = { id: "leaf", kind: "spudleaf", staged: "bench: a leaf on the air", x: 0, y: 0, z: 0, rot: 0, from: [FX + 0.4, 1.02, 1.8], to: [FX + 1.05, 0.5, 1.97], fall: 0 };
const shelf = { id: "shelf", kind: "dinercounter", x: FX + 1.05, z: 1.95, w: 0.3, d: 1.3, h: 0.5, rot: 0 };
c.prop(FA0, "leaf", { fall: 1 }, 1.6, "linear");

// ---- dust: a loose black tie hanging at 0.47 over the ring, the leaving ring and the arriving ring
const DU = GX.dust, DL0 = 7.3, DA0 = 8.6;
const lawn = { id: "lawn", kind: "rug", x: DU, z: 0, w: 3.2, d: 3.0, color: "#8fc65a", pattern: "quiet" };
const tie = { id: "tie", kind: "bowtie", staged: "bench: a tie hanging in the air", x: DU, y: 0.47, z: 0.0, rot: 0 };
const dleave = { id: "dleave", kind: "dustring", x: DU, y: 0.0, z: 0, puff: 0 }, darrive = { id: "darrive", kind: "dustring", mode: "arrive", x: DU, y: 0, z: 0, puff: 0 };
c.prop(DL0, "dleave", { puff: 1 }, 0.5, "linear"); c.prop(DA0, "darrive", { puff: 1 }, 0.35, "linear");

// ---- pairs in Spud's glove: "lean" on a flat palm, "link" pinched at the bottom where the two bands cross
const HELD = (gx) => [gx, 0.46, 0.4];
const lean = { id: "pl", kind: "goldring", n: 2, pose: "lean", x: HELD(GX.lean)[0], y: HELD(GX.lean)[1], z: HELD(GX.lean)[2], rot: 0 };
const link = { id: "pk", kind: "goldring", n: 2, pose: "link", x: HELD(GX.link)[0], y: HELD(GX.link)[1], z: HELD(GX.link)[2], rot: 0 };
const PALM = [0, -0.045, 0];
c.arm(0, "s1", "R", { prop: "pl", grip: PALM, palm: [0, 1, 0], at: HELD(GX.lean) }, 0.01); A(0, "s1", "grip", { side: "R", shape: "flat", dur: 0.01 });
A(0.05, "s1", "grab", { prop: "pl", hand: "R", grip: PALM, dur: 0, pose: null }); c.arm(0.06, "s1", "R", { prop: "pl", grip: PALM, palm: [0, 1, 0], at: HELD(GX.lean) }, 0.01);
const LGRIP = [0, 0.012, 0], LPINCH = { shape: "tip", set: { roll: 30, lean: 30, thin: +(process.env.THIN ?? 0.0165) } };
c.arm(0, "s2", "R", { prop: "pk", grip: LGRIP, point: "pinch", at: HELD(GX.link) }, 0.01); A(0, "s2", "grip", { side: "R", ...LPINCH, dur: 0.01 });
A(0.05, "s2", "grab", { prop: "pk", hand: "R", grip: LGRIP, dur: 0, pose: null, point: "pinch" }); c.arm(0.06, "s2", "R", { prop: "pk", grip: LGRIP, point: "pinch", at: HELD(GX.link) }, 0.01);
A(0, "s1", "look", { to: [0, -0.3], dur: 0.01, blink: false }); A(0, "s2", "look", { to: [0, -0.3], dur: 0.01, blink: false });

// ---- Mash in the veil with the bouquet in her right hand (a mug hold at the handle), seen four ways
const BQ = { id: "bq", kind: "bouquet", staged: "bench: carried by Mash", ...grips.placeFor("bouquet", [GX.veil + 0.3, 0.5, 0.5], 0) };
const veil = { id: "veil", kind: "bridalveil", wear: "mash", x: 0, y: 0, z: 0 };
const hq = grips.mug(c, "mash", BQ, { side: "R" });
A(9.5, "mash", "look", { to: [0.2, -0.3], dur: 0.1, blink: false });
let tq = hq.take(9.7); tq = hq.carry(tq + 0.05, [GX.veil + 0.16, 0.62, 0.56], 0.45);
A(0, "mash", "look", { to: [0, 0], dur: 0.01, blink: false });

// ---- Chip with the pin, Spud with the black tie, Mash in the veil: the step-0 triangle, then Spud and bald Spud side by side
const pin = { id: "pin", kind: "flowerpin", wear: "chip", x: 0.14, y: 0.33, z: 0.235 };
const tieW = { id: "tieW", kind: "bowtie", wear: "spud", x: 0, y: 0.47, z: 0.335 };
const veilB = { id: "veilB", kind: "bridalveil", wear: "mashB", x: 0, y: 0, z: 0 };
const props = [...boxes, ...rings, leaf, shelf, lawn, tie, dleave, darrive, lean, link, BQ, veil, pin, tieW, veilB];
const cast = [
  { id: "s1", character: SPUD, at: [GX.lean, -0.25], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
  { id: "s2", character: SPUD, at: [GX.link, -0.25], face: 0, expr: "kind", follow: 0.2, seed: 2.7 },
  { id: "mash", character: MASH, at: [GX.veil, 0], face: 0, expr: "kind", follow: 0.2, seed: 3.1 },
  { id: "chip", character: CHIP, at: [GX.cast - 0.48, 0], face: 0, expr: "kind", follow: 0.2, seed: 4.1 },
  { id: "spud", character: SPUD, at: [GX.cast + 0.5, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.5 },
  { id: "mashB", character: MASH, at: [GX.cast, -0.65], face: 0, expr: "kind", follow: 0.2, seed: 3.3 },
  { id: "chipB", character: CHIP, at: [GX.bald - 1.7, 0], face: 0, expr: "kind", follow: 0.2, seed: 4.2 },
  { id: "spudA", character: SPUD, at: [GX.bald - 0.6, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.4 },
  { id: "bald", character: BALD, at: [GX.bald + 0.6, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.4 },
  { id: "mashC", character: MASH, at: [GX.bald + 1.8, 0], face: 0, expr: "kind", follow: 0.2, seed: 3.4 },
  { id: "chipC", character: CHIP, at: [GX.close - 0.48, 0], face: 0, expr: "kind", follow: 0.2, seed: 4.3 },
  { id: "spudC", character: SPUD, at: [GX.close + 0.5, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
];
props.push({ id: "pinC", kind: "flowerpin", wear: "chipC", x: 0.14, y: 0.33, z: 0.235 }, { id: "tieC", kind: "bowtie", wear: "spudC", x: 0, y: 0.47, z: 0.335 });

// ---- the loose tie in a fist behind the knot (mug hold, angle 180, height 0), lobes out both sides
const TIEH = { id: "tieH", kind: "bowtie", staged: "bench: carried by Spud", ...grips.placeFor("bowtie", [GX.tie, 0.5, 0.4], 0) };
const ht = grips.mug(c, "s3", TIEH, { side: "R", angle: 180, height: 0 });
A(0, "s3", "look", { to: [0, -0.3], dur: 0.01, blink: false });
A(17.45, "s3", "look", { to: [0, -0.3], dur: 0.1, blink: false });
let tt = ht.take(17.6); tt = ht.carry(tt + 0.05, [GX.tie, 0.42, 0.55], 0.4);
props.push(TIEH); cast.push({ id: "s3", character: SPUD, at: [GX.tie, -0.25], face: 0, expr: "kind", follow: 0.2, seed: 2.9 });
const SHOTS = [
  ["boxes", 0, { pos: [BX, 1.9, 1.9], look: [BX, 0.06, -0.02], fov: 28 }],
  ["spin", 1, { pos: [GX.spin + 0.05, 0.9, 1.0], look: [GX.spin, 0.0, 0], fov: 30 }],
  ["fall", 4, { pos: [FX + 0.7, 0.95, 4.0], look: [FX + 0.8, 0.72, 1.9], fov: 28 }],
  ["dust", 7, { pos: [DU, 1.3, 2.8], look: [DU, 0.22, 0], fov: 30 }],
  ["lean", 9.5, { pos: [GX.lean - 0.7, 1.0, 3.3], look: [GX.lean, 0.5, 0.3], fov: 30 }],
  ["link", 10.5, { pos: [GX.link - 0.7, 1.0, 3.3], look: [GX.link, 0.5, 0.3], fov: 30 }],
  ["veilFront", 11.5, { pos: [GX.veil, 0.95, 4.2], look: [GX.veil, 0.72, 0], fov: 30 }],
  ["veil34", 12.5, { pos: [GX.veil + 2.5, 1.0, 3.4], look: [GX.veil, 0.72, 0], fov: 30 }],
  ["veilBack", 13.5, { pos: [GX.veil + 0.3, 1.0, -4.2], look: [GX.veil, 0.72, 0], fov: 30 }],
  ["veilFar", 14.5, { pos: [GX.veil, 1.0, 21], look: [GX.veil, 0.7, 0], fov: 30 }],
  ["cast", 15.5, { pos: [GX.cast, 0.9, 4.2], look: [GX.cast, 0.6, 0], fov: 30 }],
  ["bald", 16.5, { pos: [GX.bald, 0.9, 4.6], look: [GX.bald, 0.6, 0], fov: 34 }],
  ["quartet", 17.0, { pos: [GX.bald, 0.9, 9.5], look: [GX.bald, 0.6, 0], fov: 34 }],
  ["close", 17.5, { pos: [GX.close, 0.7, 3.6], look: [GX.close, 0.5, 0], fov: 30 }],
  ["tiehold", 18.5, { pos: [GX.tie - 0.5, 0.95, 2.6], look: [GX.tie, 0.55, 0.3], fov: 24 }],
];
const END = 19.5;
console.log("boxes still:", 0.5);
console.log("spin stills:", FPS12(SP0 - 0.2, 33).join(","));
console.log("fall stills:", FPS12(FA0 - 0.1, 22).join(","));
console.log("dust stills:", [...FPS12(DL0 - 0.05, 9), ...FPS12(DA0 - 0.05, 6)].join(","));

write(import.meta.url, {
  id: "props-bench", title: "Wedding props bench", idea: "Props bench for What if EP09 (ringbox, goldring, bowtie, flowerpin, bouquet, bridalveil, spudleaf, dustring), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#cfe0ee", floor: "#c48c54" }, music: false, sound: { auto: false },
  hook: { show: ["r1"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, s]) => [n, t, s]), END),
  notes: "Generated by storyboards/series/what-if/09-teleport-rings/bench/make-props-bench.mjs (props bench, no reviews).",
});
