// Jar bench (Kid vs Dad 05 task T2, engine/page/props-carrots-jar.js; DESIGN.md sections 3, 5, 8). Not a clip.
// World = frame K: the kitchen prop at the origin (fridge false), `openfridge` at K (-3.0, 0, -1.90), `pantryshelf` at K (-4.66, 0, -1.30) rot 90
// with wall 3.6, `cookiejar` on its top plank at K (-4.66, 0.95, -1.42), `jarstool` at K (-3.94, 0, -1.15). Dad (dad.json) stands on the
// stool with his right fist in the jar's mouth; Tato (spud-kid.json) hangs on the unit's camera-side end (feet on the 0.65 plank, hands on 0.95).
//   node storyboards/series/kid-vs-dad/05-carrots/bench/bench-jar.mjs                 -> bench-jar.json (beside this file); prints the glove fit
//   node qa/preflight.mjs storyboards/series/kid-vs-dad/05-carrots/bench/bench-jar.json --quick
//   node engine/render.mjs <that json> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5 --draft --safe
//   node qa/contact.mjs out/bench-jar-*.png --out <sheet.png>
// Stills: 0.5 camera 03 (unit + wall + fridge, jar fill 1 lid 1) | 1.5 camera 12 (Tato on the rungs, fill 0.45 lid 1) | 2.5 camera 13 (Dad on the
// stool, fill 0.45 lid 0, Tato's right hand open at the rim) | 3.5 camera 14 (Dad's right fist in the mouth, fill 0.25 lid 0) | 4.5 five jars (fill/lid:
// 1/1, 1/0, 0.45/1, 0.45/0, 0.25/0) | 5.5 from above into the mouth (glove fit) | 6.5 the stool alone.
import { clip, write } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const UNIT = { id: "unit", kind: "pantryshelf", x: -4.66, y: 0, z: -1.3, rot: 90, wall: 3.6 };
const JAR = { id: "jar", kind: "cookiejar", x: -4.66, y: 0.95, z: -1.42, rot: 0, fill: 1, lid: 1 };
const STOOL = { id: "stool", kind: "jarstool", x: -3.94, y: 0, z: -1.15, rot: 0 };
const LINE = [[1, 1, -0.5, 1.7], [1, 0, 0, 1.7], [0.45, 1, 0.5, 1.7], [0.45, 0, -0.25, 0.95], [0.25, 0, 0.25, 0.95]].map(([fill, lid, x, z], i) => ({ id: "j" + i, kind: "cookiejar", x, y: 0, z, rot: 0, fill, lid }));
const props = [
  { id: "kitchen", kind: "kitchenroom", x: 0, y: 0, z: 0, fridge: false, lamp: 1, time: 2.75 },
  { id: "fridge", kind: "openfridge", x: -3.0, y: 0, z: -1.9, rot: 0, open: 0, lit: 0 },
  UNIT, JAR, STOOL, ...LINE,
];
const cast = [
  { id: "tato", character: "potatobrawl/spud-kid", at: [-4.63, -0.5], y: 0.65, face: 180, expr: "kind", follow: 0, seed: 2.9 },
  { id: "dad", character: "potatobrawl/dad", at: [-3.94, -1.15], y: 0.24, face: 0, expr: "kind", follow: 0, seed: 1.1 },
];
// both hidden at 0, shown per still
c.A(0, "tato", "hide"); c.A(0, "dad", "hide");
c.A(1.0, "tato", "show");
c.A(2.0, "dad", "show");
c.A(3.0, "tato", "hide");
c.A(4.0, "dad", "hide");
c.A(5.0, "dad", "show");
c.A(6.0, "dad", "hide");
// jar states by still (set 0.02 before each cut)
const jar = (t, fill, lid) => c.prop(t, "jar", { fill, lid }, 0);
jar(0.97, 0.45, 1); jar(1.97, 0.45, 0); jar(2.97, 0.25, 0);
// Tato: right hand on rungR of the 0.95 plank, left on rungL of the 0.65 plank (palms flat, grips.rest: 0.055 lift)
grips.rest(c, "tato", "R", UNIT, [-0.505, 0.12], 0, { top: 0.95, dur: 0.01 });
grips.rest(c, "tato", "L", UNIT, [-0.505, -0.12], 0, { top: 0.65, dur: 0.01 });
// 2.5: Tato's right hand open toward the rim (0.03 short of it: jar frame (0, 0.29, 0.15)), he has come off the rung
c.arm(1.9, "tato", "R", { prop: "jar", grip: [0, 0.29, 0.15] }, 0.05); c.A(1.9, "tato", "grip", { side: "R", shape: "open", dur: 0.05 });
c.arm(2.9, "tato", "R", "rest", 0.05);
// Dad: right fist inside the mouth (jar frame (0, 0.15, 0)), left hand relaxed
c.arm(1.95, "dad", "R", { prop: "jar", grip: [0, 0.15, 0] }, 0.05); c.A(1.95, "dad", "grip", { side: "R", shape: "fist", dur: 0.05 });

const CAM03 = { pos: [-2.9, 0.35, 1.2], look: [-4.45, 0.8, -1.1], fov: 42 };
const CAM12 = { pos: [-2.5, 0.9, 2.3], look: [-4.35, 0.75, -0.95], fov: 40 };
const CAM13 = { pos: [-4.15, 1.3, 0.55], look: [-4.5, 1.1, -1.25], fov: 30 };
const CAM14 = { pos: [-4.4, 1.05, 2.0], look: [-3.8, 0.95, -1.3], fov: 40 };
const LINEUP = { pos: [0, 1.0, 4.4], look: [0, 0.2, 1.3], fov: 46 };
const TOP = { pos: [-4.66, 2.6, -1.25], look: [-4.66, 1.1, -1.42], fov: 22 };
const STOOLCAM = { pos: [-3.3, 0.5, 0.6], look: [-3.94, 0.15, -1.15], fov: 35 };
const shots = [["03", 0, CAM03], ["12", 1, CAM12], ["13", 2, CAM13], ["14", 3, CAM14], ["lineup", 4, LINEUP], ["top", 5, TOP], ["stool", 6, STOOLCAM]];
const beats = c.beats(shots, 7);

// the fist in the mouth, measured on the top view (still 5.5) against the 0.232 opening:
const MOUTH = 2 * 0.116, FIST_W = 0.105;   // FIST_W measured on still 5.5 (top view): the knuckle block ~400 px at ~3830 px/m = 0.105 across, ~0.13 long; forearm ~0.05
console.log(`mouth ${MOUTH.toFixed(3)} across; Dad's right fist (hands.size 1.3) ${FIST_W.toFixed(3)} across -> clearance ${(((MOUTH - FIST_W) / 2) * 100).toFixed(1)} cm a side`);

write(import.meta.url, {
  id: "bench-jar", title: "Jar bench: pantry unit, cookie jar, stool (Kid vs Dad 05 T2)", idea: "Prop bench for props-carrots-jar.js, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#2a3346", floor: "none", light: "golden", para: 0, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [1, 30], notes: false },
  hook: { show: [], hint: 0, what: "prop test" },
  cast, props, captions: c.captions, beats,
  allowClip: [{ who: "dad", with: "unit", from: 0, to: 30, reason: "director: the reach-into-the-jar test pose; the upper arm grazes the top plank's front edge by 5 cm (staged out in the clip by camera and stool height)" }],
  notes: "Test bench, not a clip. Generated by storyboards/series/kid-vs-dad/05-carrots/bench/bench-jar.mjs (T2).",
});
