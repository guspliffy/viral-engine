// Bench for the gold coupe's new keys `door` and `brake` (engine/page/props-coupe.js, task T6; happiness 01 redo, DESIGN.md 8b, 8c). Not a clip.
// Plain set, stills only; coupes 14 m apart (rot 0: front +z, driver +x), every key primed at t 0 with a zero-length tween:
//   A (x 0)    panel 14: brake 1 (lever pulled), door 0; with --spud Spud sits in it (ride + sit)
//   B (x 14)   panel 15: door 1, brake 1, coatheap (door 1) on the driver's cushion, nobody inside
//   C (x 28)   today's coupe: no door / brake key at all (the comparison for door 0)
//   (D, x 42, unused)  C gets { door: 0 } at t 11.0: its second still must equal its first pixel for pixel
//   F (x 42)   door 0 and brake 0 primed: the lever at rest
//   E (x 56)   door 0.5, brake 0.5, coatheap door 0.5 (a half-open check; the pane is down above 0.02)
//   node storyboards/series/happiness/01-money-redo/bench/coupe2/make-coupe2-bench.mjs
//   node engine/render.mjs <that json> --stills beats --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/*.png --out bench/coupe2/contact.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { RIDE_OFF, SEAT } from "../../../../../../engine/page/props-coupe.js";
import { COAT_AT } from "../../../../../../engine/page/props-tow.js";

const c = clip(), { A } = c;
const XA = 0, XB = 14, XC = 28, XD = 42, XE = 56, XF = 42;
const SPUD = process.argv.includes("--spud");   // coupe2-spud-bench.json: Spud seated in A for panel 14 (preflight FAILs on the seated overlap: that is the seat, not a bug)
const L = (pos, look, fov) => ({ pos, look, fov });
const props = [
  { id: "coupeA", kind: "coupe", x: XA, y: 0, z: 0, rot: 0 },
  { id: "coupeB", kind: "coupe", x: XB, y: 0, z: 0, rot: 0 },
  { id: "heapB", kind: "coatheap", x: XB + COAT_AT[0], y: COAT_AT[1], z: COAT_AT[2], door: 1 },
  { id: "coupeC", kind: "coupe", x: XC, y: 0, z: 0, rot: 0 },
  { id: "coupeE", kind: "coupe", x: XE, y: 0, z: 0, rot: 0 },
  { id: "coupeF", kind: "coupe", x: XF, y: 0, z: 0, rot: 0 },
  { id: "heapE", kind: "coatheap", x: XE + COAT_AT[0], y: COAT_AT[1], z: COAT_AT[2], door: 0.5 },
];
const prime = (id, set) => c.prop(0, id, set, 0);
prime("coupeA", { door: 0, brake: 1, load: 0 });
prime("coupeB", { door: 1, brake: 1, load: 0 }); prime("heapB", { door: 1 });
c.prop(11.0, "coupeC", { door: 0 }, 0);   // door 0 appears on C after its "today" still: the two stills must be identical
prime("coupeF", { door: 0, brake: 0 });
prime("coupeE", { door: 0.5, brake: 0.5, load: 0 }); prime("heapE", { door: 0.5 });
if (SPUD) A(0, "spud", "ride", { prop: "coupeA", off: RIDE_OFF, yaw: 0, sit: true, dur: 0 });
const cast = [{ id: "spud", character: "potatobrawl/spud", at: SPUD ? [XA + SEAT[0], SEAT[2]] : [XA - 6, 3], face: 0, expr: "sad", follow: 0.2, seed: 2.2 }];

const SHOTS = [
  ["p14", L([XA - 0.5, 0.9, 0.22], [XA + 0.2, 0.92, -0.22], 50), "panel 14's lens (DESIGN 8c numbers): his face above, the lever below the frame's middle"],
  ["p14wide", L([XA - 0.66, 1.02, 0.2], [XA + 0.1, 0.62, -0.3], 62), "wider from the passenger side: the lever pulled between the seats, Spud's hand place"],
  ["p14lever", L([XA - 0.62, 0.86, -0.06], [XA - 0.12, 0.56, -0.28], 30), "the lever pulled (brake 1) from the passenger seat"],
  ["p15", L([XB + 2.6, 1.3, -4.0], [XB + 1.0, 0.6, 0.0], 44), "panel 15's lens (behind, low): door open, the coat's sleeve and chain on the road"],
  ["p15seat", L([XB + 3.0, 1.8, -2.0], [XB + 0.9, 0.45, -0.1], 45), "from behind and above the open door: coat on the seat, the spill over the sill"],
  ["open_side", L([XB + 13.5, 1.1, 0.0], [XB, 0.8, 0.0], 34), "door 1 side-on: hinge at the front, the door out 62 degrees"],
  ["open_top", L([XB + 5.0, 4.4, 4.0], [XB + 0.4, 0.6, 0.0], 36), "door 1 from above and in front: cream trim, piping, pull, jamb"],
  ["today", L([XC + 13.5, 1.1, 0.3], [XC, 0.8, 0.0], 34), "today's coupe (no door key at all), side"],
  ["door0", L([XC + 13.5, 1.1, 0.3], [XC, 0.8, 0.0], 34), "door 0 primed: the same as the one before (pixel diff)"],
  ["half", L([XE + 8.0, 3.0, 5.0], [XE, 0.8, 0.0], 34), "door 0.5, brake 0.5, the pane down"],
  ["lever0", L([XF - 0.62, 0.86, -0.06], [XF - 0.12, 0.56, -0.28], 30), "the lever at rest (brake 0)"],
];
const times = [];
const beats = SHOTS.map(([name, cam], i) => { const t = i * 1.4; times.push(r3(t + 0.55)); return [name, t, cam]; });
console.log("stills:", times.join(","));
console.log(SHOTS.map(([n], i) => `${i + 1}:${n}`).join("  "));
write(import.meta.url, {
  id: SPUD ? "coupe2-spud-bench" : "coupe2-bench", title: "Gold coupe door and brake bench", idea: "Props bench for the coupe's door and brake keys (happiness 01 redo), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#7d8996", floor: "#56606b" }, music: false, sound: { auto: false },
  hook: { show: ["spud"], hint: 0, what: "engine test" },
  cast, props, allowClip: [{ who: "spud", with: "coupeA", from: 0, to: 99, reason: "bench: Spud sits in the coupe's seat, the body shell round him (the episode's ride window)" }], captions: [], beats: c.beats(beats, r3(SHOTS.length * 1.4)),
  notes: "Generated by bench/coupe2/make-coupe2-bench.mjs (props bench, no reviews). Stills: " + SHOTS.map(([n], i) => `${i + 1}:${n}`).join(" "),
});
