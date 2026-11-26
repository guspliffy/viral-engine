// Hall bench (Kid vs Dad 05 task T4, engine/page/props-carrots-hall.js; DESIGN.md sections 7 to 9): kidhall + floortoys + toyblock at
// frame H (world 200, 0, 0), with Tato (spud-kid) and the reporter standing in at the design's marks. One still a second; the
// cameras are section 8's 02, 05, 06, 08, 10, 11, then two overviews and a toy close-up. Not a clip.
//   node storyboards/series/kid-vs-dad/05-carrots/bench/bench-hall.mjs        -> bench-hall.json (beside this file)
//   node engine/render.mjs <that json> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5 --draft --safe
//   node qa/contact.mjs out/bench-hall-*.png --out <sheet.png>
// Stand-ins: tato5 at (-3.0, 0.10) facing +x (05), tato6 at the bed's middle (-4.55, 0.95) facing -x (06; the real Tato lies in the bed),
// tato8 beside the red block (08), rep at (2.30, 0.45) rot -35 crouch 0.14 (02, 11). All 1.2 m+ apart. The set's `lights` is 0.15 and
// the moonlamps (T3) are not in this bench: the bodies stand under the set's own night light.
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const X = 200;                                  // frame H
const at = (x, z) => [X + x, z];
const cast = [
  { id: "tato5", character: "potatobrawl/spud-kid", at: at(-3.0, 0.10), face: 90, expr: "kind", follow: 0, seed: 2.9 },
  { id: "tato6", character: "potatobrawl/spud-kid", at: at(-4.55, 0.95), face: -90, expr: "kind", follow: 0, seed: 2.9 },
  { id: "tato8", character: "potatobrawl/spud-kid", at: at(0.55, 0.55), face: 0, expr: "kind", follow: 0, seed: 2.9 },
  { id: "rep", character: "potatobrawl/reporter", at: at(2.30, 0.45), face: -35, expr: "kind", follow: 0, seed: 131.3 },
];
const props = [
  { id: "hall", kind: "kidhall", x: X, y: 0, z: 0, open: 0, strip: 0 },
  { id: "toys", kind: "floortoys", x: X, y: 0, z: 0 },
  { id: "block", kind: "toyblock", x: X + 0.20, y: 0, z: 0.25 },
];
c.A(0, "rep", "crouch", { to: 0.14, dur: 0.01 });
// who stands in which still (the rest are hidden, so a stand-in never blocks the camera of another panel)
const WHO = [["rep"], ["tato5"], ["tato5"], ["tato6"], ["tato6"], ["tato8"], ["tato8"], ["rep"], ["rep", "tato5", "tato6", "tato8"], ["rep", "tato5", "tato6", "tato8"], ["tato8"], [], [], [], [], []];

const H = (x, y, z) => [X + x, y, z];
const cam = (p, l, fov) => ({ pos: H(...p), look: H(...l), fov });
const STILLS = [
  ["02 reporter, door open 1, W1 behind", { open: 1, strip: 0 }, cam([3.25, 0.62, 1.55], [1.6, 0.58, 0.2], 40)],
  ["05 door shut, Tato at the door", { open: 0, strip: 0 }, cam([-3.3, 0.7, 2.7], [-2.5, 0.45, 0.1], 38)],
  ["05 same, door open 1", { open: 1, strip: 0 }, cam([-3.3, 0.7, 2.7], [-2.5, 0.45, 0.1], 38)],
  ["06 door shut, strip 0", { open: 0, strip: 0 }, cam([-5.5, 1.05, -0.4], [-2.0, 0.5, 0.4], 36)],
  ["06 strip 1", { open: 0, strip: 1 }, cam([-5.5, 1.05, -0.4], [-2.0, 0.5, 0.4], 36)],
  ["08 Tato by the block (tip 10), W1 over him", { open: 1, strip: 0, tipBlock: 1 }, cam([0.6, 0.6, 3.0], [0.3, 0.42, 0], 36)],
  ["10 spy roll camera, toys", { open: 1, strip: 0 }, cam([0.8, 0.45, 2.9], [0.6, 0.3, 0], 40)],
  ["11 reporter, fov 28", { open: 1, strip: 0 }, cam([3.25, 0.62, 1.55], [1.6, 0.58, 0.2], 28)],
  ["overview front, door open 1", { open: 1, strip: 1 }, cam([-1.1, 1.7, 7.5], [-1.1, 0.9, 0], 70)],
  ["plan from above", { open: 0, strip: 1 }, cam([-1.1, 11, 0.5], [-1.1, 0, 0.4], 75)],
  ["toys close from the front", { open: 1, strip: 0 }, cam([0.6, 0.9, 3.4], [0.5, 0.05, 0.2], 52)],
  ["door shut seen from the hall (knob, panels, casing)", { open: 0, strip: 0 }, cam([0.2, 1.1, 3.0], [-2.0, 0.9, 0.1], 40)],
  ["door open 1 seen from the room side, 3/4", { open: 1, strip: 0 }, cam([-4.2, 1.0, 2.6], [-2.0, 0.9, 0.1], 40)],
  ["dino close (rot -30, facing the lens)", { open: 1, strip: 0 }, cam([1.3, 0.25, 0.2], [1.3, 0.13, -0.8], 30)],
  ["car close (rot 25)", { open: 1, strip: 0 }, cam([-0.7, 0.4, 1.6], [-0.9, 0.05, 0.75], 30)],
  ["ball close", { open: 1, strip: 0 }, cam([1.5, 0.35, 1.9], [1.5, 0.1, 0.95], 30)],
];
STILLS.forEach(([, s], i) => {
  c.prop(i, "hall", { open: s.open, strip: s.strip }, 0);
  c.prop(i, "block", { tip: s.tipBlock ? 10 : 0, y: s.tipBlock ? 0.008 : 0 }, 0);
});
WHO.forEach((who, i) => cast.forEach((a) => c.A(i, a.id, who.includes(a.id) ? "show" : "hide")));
const beats = c.beats(STILLS.map(([n, , shot], i) => [n, i, shot, n]), STILLS.length);
write(import.meta.url, {
  id: "bench-hall", title: "Hall bench: kidhall, floortoys, toyblock (Kid vs Dad 05 T4)", idea: "Props bench for engine/page/props-carrots-hall.js, not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  music: false, sound: { auto: false, sfx: 0, ambience: 0, speech: false },
  set: { type: "plain", night: true, color: "#1a2a66", floor: "none", para: 0, aperture: 0, focus: false, lighting: 2, lights: 0.15, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  creative: { length: [1, 40], notes: false }, hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats, allowClip: [],
  notes: "Test bench, not a clip. Generated by storyboards/series/kid-vs-dad/05-carrots/bench/bench-hall.mjs (T4).",
});
