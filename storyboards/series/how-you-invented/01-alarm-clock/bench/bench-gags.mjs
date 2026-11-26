// How you invented 01 "The alarm clock", task B bench: the gag props (engine/page/props-alarm-gags.js). Not a clip.
// Bench stage: a plain set, a 0.22 box where the ceiling beam is (underside y 2.05, centre z -0.70), a kit `stool` at
// (0.32, 0, -0.20), a kit `callbell` (scale 1.15) and Mash lying at pitch -60 on a ramp box (his SLEEP pose: ride a
// carrier at (0.90, 0.32, -0.55: 0.18 lower and 0.25 further back than the design, so the bench's bare bucket clears his leaf; the real bed's blanket and ramp differ), yaw -12, lids shut, arms under the blanket).
//
//   node storyboards/series/how-you-invented/01-alarm-clock/bench/bench-gags.mjs     -> bench-gags.json, prints both time lists
//   export CHROME_PATH=/opt/pw-browsers/chromium
//   node engine/render.mjs <bench-gags.json> --stills <STILLS> --draft --safe --out out/alarm-bench     (a state per second)
//   node qa/contact.mjs out/alarm-bench/alarm-bench-gags-*-t*.png --cols 6 --width 300 --out out/alarm-bench-gags-sheet.png
//   strips (sequential draft windows, then 15 fps frames):
//     node engine/render.mjs <bench-gags.json> --draft --safe --from <a> --to <b> --out out/alarm-bench     (one per zone below)
//     node qa/contact.mjs out/alarm-bench/alarm-bench-gags-draft.mp4 --times <a, a+1/15, ...> --cols 8 --width 240 --out out/alarm-strip-<zone>.png
//
// FOR THE DIRECTOR (found on this bench):
//   lightbeam from the window point to the candle: prop at (1.25, 1.66, -1.74), rot 149.4, tip -30.5, len 2.01, w 0.45,
//   color "#ffd9a0", glow 0..0.8 (the beam runs along the prop's local -z; rot is its yaw, tip its pitch; checked in still 30).
//   Seed every key the engine does not hold (swing flip snap pour nailA nailB flare h hitY round) with a duration-0 prop
//   action, then tween it; the bucket's tip about its pins is `flip` (the engine's own `tip` leans the whole prop).
//   Rope R2/R3 follow the bucket's ring and R4 the anvil's ring with spec.to = that prop's id.
//   The mouthjet needs spec mouth "mash" and target = its own id (not wear).
//
// Zones (seconds of the bench timeline), each starts from a clean state set at its first instant:
//   100 to 103.5  R2: pull, swing 0 / -30 / +40 / -55, flip to 115 at the left apex, the pour (rope R2 follows the bucket's ring)
//   110 to 113.5  R3: the bucket's flip 0 to 180 in 0.35 s when the line parts (snap), pour, the whip of the rope
//   120 to 122.5  R4: the anvil's fall with the rope's snap
//   130 to 133    nail A: burn 0.80 -> let go, falls onto the floor plate
//   140 to 143    nail B: pushed 0 -> 1 over 1.4 s, then let go, strikes the bell
//   150 to 152    the jet on a lying Mash, h 0 -> 1
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const ALL = ["r2", "bk", "r3", "r4", "an", "nc", "tp", "jet", "lb", "bell"];
const props = [
  { id: "beam", kind: "stoneblock", w: 4.6, h: 0.22, d: 0.22, x: 0, y: 2.05, z: -0.70, seed: 3 },
  { id: "stool", kind: "stool", r: 0.17, x: 0.32, y: 0, z: -0.20 },
  { id: "bell", kind: "callbell", scale: 1.15, x: 0.286, y: 0.432, z: -0.138 },
  { id: "ramp", kind: "stoneblock", w: 1.1, h: 0.06, d: 1.6, x: 0.9, y: 0.20, z: -1.30, tip: 30, seed: 5 },
  { id: "mc", kind: "carrier", x: 0.9, y: 0.32, z: -0.55 },
  // R2: the bucket (pivot at the beam), its trip rope
  { id: "bk", kind: "waterbucket", x: 0.9, y: 2.05, z: -0.7, round: 2, fill: 1 },
  { id: "r2", kind: "beamrope", to: "bk", xa: 0.55, xb: -0.25, tail: [-0.25, 0.30, -0.70] },
  // R3: the bucket's trip rope over to the candle's knot
  { id: "r3", kind: "beamrope", to: "bk", xa: 0.62, xb: 0.37, bridle: true, knot: [0.37, 0.85, -0.25], scale: 0.0 },
  // R4: the anvil
  { id: "an", kind: "anvil", x: -0.4, y: 0, z: -0.7, scale: 0.0 },
  { id: "r4", kind: "beamrope", to: "an", xa: -0.40, xb: 0.37, bridle: true, knot: [0.37, 0.80, -0.25], scale: 0.0 },
  { id: "nc", kind: "nailcandle", x: 0.37, y: 0.42, z: -0.25, lit: 1, scale: 0.0 },
  { id: "tp", kind: "tinplate", x: 0.17, y: 0, z: 0.03, scale: 0.0 },
  { id: "jet", kind: "mouthjet", mouth: "mash", target: "jet", scale: 0.0 },
  { id: "lb", kind: "lightbeam", x: 1.25, y: 1.66, z: -1.74, rot: 149.4, tip: -30.5, len: 2.01, w: 0.45, color: "#ffd9a0", glow: 0, scale: 0.0 },
];
// Mash in SLEEP on the carrier
c.A(0, "mash", "ride", { prop: "mc", off: [0, 0, 0], yaw: -12, dur: 0 });
c.A(0, "mash", "pitch", { to: -60, dur: 0 });
for (const side of ["R", "L"]) c.arm(0, "mash", side, { o: [-0.02, 0.30, -0.12] }, 0);
c.A(0, "mash", "face", { lid: 1, dur: 0.01 });

const P = (t, id, set, dur = 0, ease = "linear") => c.prop(t, id, set, dur, ease);
const only = (t, ids) => { for (const id of ALL) P(t, id, { scale: ids.includes(id) ? 1 : 0 }); };
// seed every key the engine does not hold, once, at frame 0 of the timeline
for (const [id, set] of [["bk", { swing: 0, flip: 0, pour: 0 }], ["r2", { snap: -1, slack: 0, burn: 0, pull: 0 }], ["r3", { snap: -1, slack: 0, burn: 0, pull: 0 }], ["r4", { snap: -1, slack: 0, burn: 0, pull: 0 }],
  ["an", { fall: 0 }], ["nc", { nailA: 0, nailB: -1, burn: 0, flare: 0, bend: 0 }], ["jet", { on: 0, h: 1 }]]) P(0, id, set);

const CAM = {
  c06: { pos: [-0.15, 1.35, 3.6], look: [0.2, 1.2, -0.75], fov: 46 }, c07: { pos: [0.1, 1.3, 3.3], look: [0.3, 0.95, -0.6], fov: 42 },
  c08a: { pos: [-0.2, 0.98, 0.85], look: [0.37, 0.86, -0.25], fov: 30 }, c09: { pos: [0.25, 1.3, 3.5], look: [0.18, 0.62, -0.7], fov: 50 },
  c10: { pos: [-0.2, 2.1, 2.6], look: [0.3, 0.75, -0.75], fov: 50 }, c13: { pos: [1.05, 0.66, 0.3], look: [0.32, 0.55, -0.19], fov: 30 },
  c12a: { pos: [-0.3, 1.15, 2.9], look: [0.3, 0.8, -0.4], fov: 44 }, c14c: { pos: [0.6, 1.35, 3.9], look: [0.32, 1.05, -0.09], fov: 54 },
  wide: { pos: [1.2, 1.4, 4.2], look: [0.2, 1.2, -0.7], fov: 50 }, c08b: { pos: [-0.45, 1.55, 2.9], look: [0.7, 1.25, -0.75], fov: 42 },
  side: { pos: [3.2, 1.1, -0.3], look: [0.9, 0.9, -0.4], fov: 40 }, knot: { pos: [0.1, 0.92, 1.2], look: [0.37, 0.8, -0.25], fov: 30 },
  floor: { pos: [0.6, 0.55, 1.5], look: [0.2, 0.15, 0.0], fov: 40 }, cand: { pos: [0.9, 0.62, 0.55], look: [0.37, 0.5, -0.25], fov: 26 },
  zb: { pos: [0.3, 1.35, 3.1], look: [0.3, 1.3, -0.7], fov: 50 }, zc: { pos: [0.2, 1.2, 2.9], look: [0.0, 1.0, -0.7], fov: 46 },
  zn: { pos: [0.75, 0.75, 1.9], look: [0.25, 0.3, -0.05], fov: 46 }, zk: { pos: [0.95, 0.66, 0.4], look: [0.3, 0.5, -0.17], fov: 30 },
  anv: { pos: [0.6, 1.3, 2.4], look: [-0.4, 1.2, -0.7], fov: 40 },
  beam: { pos: [1.0, 1.9, 1.8], look: [0.2, 1.4, -0.6], fov: 55 }, bell: { pos: [0.75, 0.62, 0.35], look: [0.3, 0.46, -0.15], fov: 24 },
};
const shots = [];   // [name, start, cam]
const stills = [];
let n = 0;
const S = (name, cam, setup) => { const t = n++; setup(t); shots.push([name, t, CAM[cam]]); stills.push(r3(t + 0.5)); };
const rope = (id, set, t) => P(t, id, set);

// ---- stills ----
S("R2 rest", "c06", (t) => { only(t, ["bk", "r2"]); P(t, "bk", { round: 2 }); });
S("R2 pull 0.3 swing -30", "c06", (t) => { P(t, "r2", { pull: 0.3 }); P(t, "bk", { swing: -30 }); });
S("R2 swing +40", "c06", (t) => { P(t, "bk", { swing: 40 }); });
S("R2 left apex -55 flip 115", "c06", (t) => { P(t, "bk", { swing: -55, flip: 115 }); });
S("R2 apex pour 0.2", "c06", (t) => { P(t, "bk", { pour: 0.2 }); });
S("R2 apex pour 0.4", "c06", (t) => { P(t, "bk", { pour: 0.4 }); });
S("R2 apex pour 0.7", "c06", (t) => { P(t, "bk", { pour: 0.7 }); });
S("R2 slack 1", "c06", (t) => { P(t, "bk", { swing: 0, flip: 0, pour: 0 }); P(t, "r2", { pull: 0, slack: 1 }); });
S("R3 rest burn 0.25", "c07", (t) => { only(t, ["bk", "r3", "nc", "stool"]); P(t, "bk", { swing: 0, flip: 0, pour: 0, round: 3 }); P(t, "nc", { burn: 0.25 }); P(t, "r3", { burn: 0.25 }); });
S("R3 burn 0.5", "c07", (t) => { P(t, "r3", { burn: 0.5 }); });
S("R3 burn 0.9", "c07", (t) => { P(t, "r3", { burn: 0.9 }); });
S("R3 burn 1", "c07", (t) => { P(t, "r3", { burn: 1 }); });
S("R3 knot close burn 0", "knot", (t) => { P(t, "r3", { burn: 0 }); });
S("R3 knot close burn 0.5", "knot", (t) => { P(t, "r3", { burn: 0.5 }); });
S("R3 knot close burn 0.9", "knot", (t) => { P(t, "r3", { burn: 0.9 }); });
S("R3 beam wrap, high", "beam", (t) => { P(t, "r3", { burn: 0.25 }); });
S("R4 anvil hanging burn 0.5", "c09", (t) => { only(t, ["an", "r4", "nc"]); P(t, "nc", { burn: 0.45 }); P(t, "r4", { burn: 0.5 }); });
S("R4 burn 0.9", "c09", (t) => { P(t, "r4", { burn: 0.9 }); });
S("R4 burn 1", "c09", (t) => { P(t, "r4", { burn: 1 }); });
S("anvil close fall 0", "anv", (t) => { only(t, ["an"]); });
for (const b of [0, 0.25, 0.45, 0.8, 0.955]) S(`candle burn ${b}`, "cand", (t) => { only(t, ["nc", "stool", "bell"]); P(t, "nc", { burn: b, nailB: b > 0.7 ? 0.5 : -1, nailA: 0 }); });
S("candle 13 view burn 0.82 nailB 1", "c13", (t) => { only(t, ["nc", "stool", "tp", "bell"]); P(t, "tp", { x: 0.286, y: 0.42, z: -0.138 }); P(t, "nc", { burn: 0.82, nailB: 1, nailA: 1.5 }); });
S("bell + plate + nailB lying", "bell", (t) => { only(t, ["nc", "stool", "tp", "bell"]); P(t, "nc", { burn: 0.955, nailB: 2.5 }); });
S("plate on floor + nailA lying", "floor", (t) => { only(t, ["nc", "stool", "tp"]); P(t, "tp", { x: 0.17, y: 0, z: 0.03 }); P(t, "nc", { burn: 0.8, nailA: 1.2, nailB: -1 }); });
S("jet h 1 on lying Mash (front)", "c08b", (t) => { only(t, ["jet"]); P(t, "jet", { on: 1, h: 1 }); });
S("jet from the side (world up)", "side", (t) => { });
S("lightbeam wide", "wide", (t) => { only(t, ["lb", "nc", "stool"]); P(t, "lb", { glow: 0.8 }); P(t, "nc", { burn: 0.45, nailA: 0, nailB: -1 }); });
S("all of round 3 wide", "wide", (t) => { only(t, ["bk", "r3", "nc", "stool"]); P(t, "r3", { burn: 0.6 }); P(t, "nc", { burn: 0.6 }); });
S("rope top run (design's original)", "beam", (t) => { });
const STILL_END = n;

// ---- strips (sequential windows) ----
const ZT = { r2: 100, r3: 110, r4: 120, na: 130, nb: 140, jet: 150 };
const zbeats = [];
// R2
{ const z = ZT.r2; only(z, ["bk", "r2"]); P(z, "bk", { swing: 0, flip: 0, pour: 0, round: 2 }); P(z, "r2", { pull: 0, slack: 0 });
  P(z + 0.2, "r2", { pull: 0.3 }, 0.2); P(z + 0.4, "bk", { swing: -30 }, 0.5); P(z + 0.9, "bk", { swing: 40 }, 0.7); P(z + 1.6, "bk", { swing: -55 }, 0.6);
  P(z + 1.9, "bk", { flip: 115 }, 0.4); P(z + 2.2, "bk", { pour: 1.1 }, 1.1); }
// R3: the line parts at z+0.6: snap runs, the bucket flips 0 to 180 in 0.35 s, the water leaves as it passes 90
{ const z = ZT.r3; only(z, ["bk", "r3", "nc", "stool"]); P(z, "bk", { swing: 0, flip: 0, pour: 0, round: 3 }); P(z, "r3", { burn: 1, snap: -1 }); P(z, "nc", { burn: 0.25 });
  P(z + 0.6, "r3", { snap: 0 }); P(z + 0.6, "r3", { snap: 2.4 }, 2.4); P(z + 0.6, "bk", { flip: 180 }, 0.35); P(z + 0.77, "bk", { pour: 0 }); P(z + 0.77, "bk", { pour: 1.2 }, 1.2);
  P(z + 0.95, "bk", { swing: 6 }, 0.3); P(z + 1.25, "bk", { swing: -6 }, 0.4); P(z + 1.65, "bk", { swing: 4 }, 0.4); P(z + 2.05, "bk", { swing: -2 }, 0.4); }
// R4: anvil falls as the rope parts
{ const z = ZT.r4; only(z, ["an", "r4", "nc"]); P(z, "an", { fall: 0 }); P(z, "r4", { burn: 1, snap: -1 }); P(z, "nc", { burn: 0.45 });
  P(z + 0.3, "an", { fall: 0 }); P(z + 0.3, "an", { fall: 1.2 }, 1.2); P(z + 0.3, "r4", { snap: 0 }); P(z + 0.3, "r4", { snap: 1.2 }, 1.2); }
// nail A
{ const z = ZT.na; only(z, ["nc", "stool", "tp"]); P(z, "tp", { x: 0.17, y: 0, z: 0.03 }); P(z, "nc", { burn: 0.8, nailA: 0, nailB: -1 }); P(z + 0.3, "nc", { nailA: 1.5 }, 1.5); }
// nail B
{ const z = ZT.nb; only(z, ["nc", "stool", "tp", "bell"]); P(z, "tp", { x: 0.286, y: 0.42, z: -0.138 }); P(z, "nc", { burn: 0.82, nailA: 1.5, nailB: 0 }); P(z, "nc", { nailB: 1 }, 1.4); P(z + 1.4, "nc", { burn: 0.955 }); P(z + 1.4, "nc", { nailB: 2.2 }, 1.2); }
// jet
{ const z = ZT.jet; only(z, ["jet"]); P(z, "jet", { on: 1, h: 0 }); P(z, "jet", { h: 1 }, 1.0); P(z + 1.5, "jet", { h: 0.5 }, 0.5); }

const SH = [...shots, ["zr2", ZT.r2, CAM.zb], ["zr3", ZT.r3, CAM.zb], ["zr4", ZT.r4, CAM.zc], ["zna", ZT.na, CAM.zn], ["znb", ZT.nb, CAM.zk], ["zjet", ZT.jet, CAM.c08b]];
const beats = c.beats(SH.map(([name, start, shot]) => [name, start, shot]), ZT.jet + 3);
console.log("STILLS:", stills.join(","));
console.log("labels:", shots.map(([nm], i) => `${i}:${nm}`).join(" | "));
console.log("zones:", JSON.stringify(ZT));

write(import.meta.url, {
  id: "alarm-bench-gags", title: "How you invented 01: gag props bench", idea: "Props bench (engine/page/props-alarm-gags.js), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#2a3050", floor: "#6e4c2f", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true },
  music: false, sound: { auto: false }, hook: { show: ["mash"], hint: 0, what: "engine bench" },
  cast: [{ id: "mash", character: "potatobrawl/mash", at: [0.9, -0.55], face: -12, expr: "calm", follow: 0, seed: 2.2 }],
  props, captions: [], beats,
  allowClip: [{ who: "mash", with: "ramp", from: 0, to: ZT.jet + 3, reason: "Mash lies on the ramp box (bench)" }, { who: "mash", with: "mc", from: 0, to: ZT.jet + 3, reason: "he rides the carrier point" }],
  notes: "Generated by bench-gags.mjs (props bench, no reviews).",
});
