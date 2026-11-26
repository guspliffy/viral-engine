// Carrot bench (Kid vs Dad 05, task T1: engine/page/props-carrots.js; DESIGN.md section 2). Not a clip: set plain, look anime-pro, castLook sheet.
// Cast: tato (spud-kid) at the table, dad (dad.json) 4 m off to the left for the head shots. Table, plate and bowl as DESIGN section 8 (kitchen frame K = world).
// Stills (times in seconds, printed below): 0.5 plate + pile n 14   1.5 pile n 13   3.0 stick pinched at his mouth, eaten 0   4.0 eaten 0.5
//   5.0 bowl fill 1   6.0 bowl fill 0.6   7.5 bag in both palms, fill 1 crush 0   8.5 bag fill 0 crush 1   9.5 Dad's head, crumbs on, fov 30
//   10.5 Dad's moustache from his side   11.5 one stick (x2) close   12.5 geometry: two bags (fill 1 crush 0; fill 0 crush 1), two bowls (fill 1; 0.6)
//   node storyboards/series/kid-vs-dad/05-carrots/bench/bench-carrots.mjs
//   node engine/render.mjs storyboards/series/kid-vs-dad/05-carrots/bench/bench-carrots.json --stills 0.5,1.5,3.0,4.0,5.0,6.0,7.5,8.5,9.5,10.5,11.5,12.5 --draft --safe
//   node qa/contact.mjs out/bench-carrots-anime-pro-safe-draft-t*.png --out out/bench-carrots-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const TATO = [0.55, -0.2], DAD = [-4.0, 0], TOP = 0.30;

// the stick (spec up: origin its thick end, thin end up; tilt -80 lays it toward +x at his mouth); the bag stands on the table until he takes it
const STICK = { id: "stick", kind: "carrotstick", up: true, ...grips.placeFor("carrotstick", [0.40, 0.37, 0.045], 0), tip: 0, tilt: -80 };   // held in the air at his mouth from the start (standing on the table the fingers would go into it)
const BAG = { id: "bag", kind: "carrotbag", ...grips.placeFor("carrotbag", [0.55, TOP, 0.28], 0) };
const props = [
  { id: "table", kind: "kitchentable", x: 0, y: 0, z: 0.35, w: 1.3, d: 0.6, h: TOP },
  { id: "plate", kind: "plate", x: 0.26, y: TOP, z: 0.28 },
  { id: "pile", kind: "carrotpile", x: 0.26, y: TOP + 0.019, z: 0.28, n: 14 },
  { id: "bowl", kind: "carrotbowl", x: 0.30, y: TOP, z: 0.28, scale: 0.001 },
  STICK, BAG,
  { id: "crumbs", kind: "crumbs", wear: "dad", x: 0, y: 0.63, z: 0.39 },
  { id: "bench1", kind: "carrotstick", x: DAD[0] + 1.6, y: 1.5, z: 0, scale: 2 },
  // geometry review, off to the side (x -2.2 .. -1.2): the bag at fill 1 / crush 0 and fill 0 / crush 1, the bowl at fill 1 and 0.6
  { id: "mbag1", kind: "carrotbag", x: -2.0, y: 0, z: 0, rot: -15, crush: 0 }, { id: "mbag2", kind: "carrotbag", x: -1.55, y: 0, z: 0, rot: 15, fill: 0, crush: 1 },
  { id: "mbowl1", kind: "carrotbowl", x: -2.0, y: 0, z: 0.7, fill: 1, rot: 0 }, { id: "mbowl2", kind: "carrotbowl", x: -1.55, y: 0, z: 0.7, fill: 0.6 },
];
c.prop(0, "stick", { eaten: 0, y: -9 }, 0); c.prop(0, "bag", { crush: 0, y: -9 }, 0);   // stored under the floor until they are wanted (a held prop keeps scale 1: the grips divide by it)

// 0.5 / 1.5: the pile, 13 sticks left on the second
c.prop(1.0, "pile", { n: 13 }, 0);
// 2.0: the stick (the 14th) is in the world again, he takes it and puts its tip to his mouth (held in the air from the start: standing on the table the fingers would go into it)
c.prop(1.99, "stick", { y: 0.37 }, 0);
const hs = grips.thin(c, "tato", STICK, { side: "R", from: 0.28 });
hs.take(2.0, { reach: 0.3, settle: 0.15 });
// 3.5: the bite, half eaten
c.prop(3.5, "stick", { eaten: 0.5 }, 0.05);
// 4.3: the stick goes, the bowl comes (fill 1, then 0.6 at 5.4), the plate with it
c.prop(4.1, "stick", { eaten: 1 }, 0.1);   // behind the face: it hides
hs.release(4.3);
c.prop(4.4, "bowl", { scale: 1, fill: 1 }, 0); c.prop(4.4, "plate", { scale: 0.001 }, 0); c.prop(4.4, "pile", { scale: 0.001 }, 0);
c.prop(5.4, "bowl", { fill: 0.6 }, 0);
// 6.4: the bag, both palms (box hold, height 0.4 = y 0.12), tipped 25 to his mouth; 7.7: emptied and squeezed
c.prop(6.4, "bowl", { scale: 0.001 }, 0); c.prop(6.4, "bag", { y: TOP }, 0);
c.prop(6.3, "table", { y: -9 }, 0);   // panel 09 shows no table: the bag hangs in front of him where the table was (see NOTES: the table would swallow it)
const hb = grips.box(c, "tato", BAG, { gap: 0.03, height: 0.4 });
let t = hb.take(6.45, { reach: 0.25, settle: 0.15 });
t = hb.carry(t + 0.05, [0.55, 0.12, 0.17], 0.3, "inOut", { rot: 180, tip: 25 });
c.prop(7.6, "bag", { fill: 0, crush: 1 }, 0.25);

const FAR = { id: "dad", character: "potatobrawl/dad", at: DAD, face: 0, expr: "kind", follow: 0, seed: 1.1 };
const cast = [{ id: "tato", character: "potatobrawl/spud-kid", at: TATO, face: 0, expr: "kind", follow: 0, seed: 2.9 }, FAR];
// crumbs show from 8.0 (a cut of visibility, not a tween)
c.prop(8.9, "crumbs", { on: 1 }, 0);

const TWO = { pos: [0.36, 0.66, 2.0], look: [0.36, 0.42, 0.2], fov: 30 };
const CLOSE = { pos: [0.55, 0.50, 1.40], look: [0.55, 0.44, -0.20], fov: 30 };   // DESIGN section 8, shots 04 and 09
const BOWLC = { pos: [0.36, 0.64, 2.0], look: [0.36, 0.42, 0.2], fov: 30 };
const HEAD = { pos: [DAD[0], 0.88, 2.0], look: [DAD[0], 0.72, 0], fov: 30 };
const SIDE = { pos: [DAD[0] + 1.0, 0.68, 0.7], look: [DAD[0], 0.62, 0.34], fov: 24 };
const MACRO = { pos: [DAD[0] + 1.9, 1.75, 1.2], look: [DAD[0] + 1.6, 1.5, 0], fov: 24 };
const STILLS = [0.5, 1.5, 3.0, 4.0, 5.0, 6.0, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5];
const GEO = { pos: [-1.75, 0.55, 2.0], look: [-1.75, 0.2, 0.3], fov: 30 };
const shots = [
  ["pile14", 0, TWO, "0.5 plate + pile n 14"], ["pile13", 1, TWO, "1.5 pile n 13"], ["stick0", 2, CLOSE, "3.0 stick at his mouth, eaten 0"], ["stick05", 3.4, CLOSE, "4.0 stick eaten 0.5"],
  ["bowl1", 4.5, BOWLC, "5.0 bowl fill 1"], ["bowl06", 5.5, BOWLC, "6.0 bowl fill 0.6"], ["bag1", 6.4, CLOSE, "7.5 bag fill 1 crush 0"], ["bag0", 8.0, CLOSE, "8.5 bag fill 0 crush 1"],
  ["dad", 9, HEAD, "9.5 Dad's head, crumbs on, fov 30"], ["dadside", 10, SIDE, "10.5 Dad moustache from his side, crumbs"], ["macro", 11, MACRO, "11.5 one stick close"], ["geo", 12, GEO, "12.5 bags (fill 1 crush 0; fill 0 crush 1) and bowls (fill 1; 0.6)"],
];
const beats = c.beats(shots, 13);

write(import.meta.url, {
  id: "bench-carrots", title: "Carrot bench (Kid vs Dad 05 T1)", idea: "props-carrots.js bench, not a clip", fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, physics: false,
  set: { type: "plain", color: "#2a3346", floor: "#3a3f4a", light: "golden", para: 0, aperture: 0, lighting: 2 },
  music: false, sound: { sfx: 0, ambience: 0, speech: false }, creative: { length: [4, 40], notes: false }, hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/kid-vs-dad/05-carrots/bench/bench-carrots.mjs (props bench, no reviews).",
});
