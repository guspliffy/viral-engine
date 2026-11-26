// Potato Desk 14 head-kit bench (task T1): the hash-brown toupee, its crumbs and the wall shadow of engine/page/props-desk14-head.js at their
// DESIGN numbers (storyboards/series/potato-desk/14-dont-laugh/DESIGN.md section 1). Not a clip. The judge (characters/potatobrawl/
// viking-judge-toupee.json) sits as in the film (chair at (-0.69, 0.72, -0.66), body base 1.14) and wears the toupee at the DESIGN's placement
// (wear "vik", x 0, y 1.113, z 0.139, tip 30, rot 8, tilt 4). One shot per beat, 1.1 s each (the still is 0.4 s in), then the crumbs run:
//   front0, front1   the reveal's read at 360 px: 733 px/m, lens 10 deg below the patty; hero shred 0 then 1 (hanging at his left temple)
//   side, top        the slab from the viewer's right, and from above (the shred lies on the top face)
//   med193           a medium (630 px/m) with the frame's top edge at world y 1.93 (the hide rule), shred 1 hanging into frame
//   bite             a close three-quarter from the left: the bite, the cut wall, the crisp tips
//   shadow0, shadow1 the painted wall shadow from the right, low, as shot 08; shred 0 / 1
//   crumbs           stills at fall 0.2 / 0.5 / 1.6: the shred and 17 crumbs fall from the head onto the paper stack
//   node storyboards/series/potato-desk/bench/make-desk14-head-bench.mjs
//   node engine/render.mjs storyboards/series/potato-desk/bench/desk14-head-bench.json --stills 0.4,1.5,2.6,3.7,4.8,5.9,7.0,8.1,9.0,9.3,10.4 --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/desk14-head-bench-*.png --cols 4 --width 360 --out out/desk14-head-bench-sheet.png
import { clip, write } from "../../../lib/clip.mjs";

const c = clip(), { A } = c, r3 = (v) => Math.round(v * 1000) / 1000;
const END = 11.2, VIK = [-0.69, -0.66], DECK = 1.18;
const cast = [{ id: "vik", character: "potatobrawl/viking-judge-toupee", at: VIK, face: 0, expr: "stern", follow: 0.2, seed: 1.7 }];
A(0, "vik", "noblink"); A(0, "vik", "look", { to: [0, 0], dur: 0.01, blink: false });
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });

const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 10, h: 6 },
  { id: "dado", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true, trimW: 10, xs: [-4.5, -3.75, -3, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 3, 3.75, 4.5] },
  { id: "chair", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "toup", kind: "hashtoupee", wear: "vik", x: 0, y: 1.113, z: 0.139, tip: 30, rot: 8, tilt: 4, steam: 1 },
  { id: "shadow", kind: "judgeshadow", x: -0.36, y: 1.27, z: -1.296 },
  { id: "papers", kind: "paperstack", x: -0.44, y: DECK, z: -0.06, amount: 0.4, scale: 0 },
  { id: "crumbs", kind: "hashcrumbs", staged: "falls from his head", x: -0.42, y: 2.10, z: -0.40 },
];
c.prop(0, "shadow", { on: 1 }, 0);
// hero shred on the toupee: lying (0), hanging (1) for the reveal read and the medium, lying for the side / top / bite, hanging for the cut, gone at the burst
c.prop(0, "toup", { shred: 0 }, 0); c.prop(1.1, "toup", { shred: 1 }, 0); c.prop(2.2, "toup", { shred: 0 }, 0); c.prop(4.4, "toup", { shred: 1 }, 0); c.prop(5.5, "toup", { shred: 0 }, 0);
c.prop(6.6, "shadow", { shred: 0 }, 0); c.prop(7.7, "shadow", { shred: 1 }, 0);
// the burst: the toupee's own shred is hidden at the frame the crumbs start (DESIGN 1d), the paper stack appears, `fall` runs 0 -> 1.6 linear
c.prop(8.8, "toup", { shred: 2 }, 0); c.prop(8.8, "papers", { scale: 1 }, 0); c.prop(8.8, "crumbs", { on: 1, fall: 0 }, 0); c.prop(8.8, "crumbs", { fall: 1.6 }, 1.6, "linear");

// the patty's centre is at about (-0.69, 2.11, -0.52); 4.9 m away with fov 30 is 733 px/m at 1080 x 1920; the lens 10 deg below it
const PAT = [-0.69, 2.11, -0.52], D = 4.9, LOW = r3(PAT[1] - D * Math.tan(10 * Math.PI / 180));
const FRONT = { pos: [PAT[0], LOW, r3(PAT[2] + D)], look: PAT, fov: 30 };
const SIDE = { pos: [r3(PAT[0] + D), LOW, PAT[2]], look: PAT, fov: 30 };
const TOP = { pos: [PAT[0], 6.0, -0.2], look: [PAT[0], 2.2, -0.6], fov: 30 };
// the hide rule's frame, level camera, fov 32 (630 px/m): the top edge is y 1.93 at the plane of the shred and the toupee's front (z -0.40):
// 0.479 + 5.06 x tan 16 = 1.93. (At the DESIGN's plane z -0.66 the same frame is 2.005; his face, z -0.29, sees an edge of 1.90.)
const MED = { pos: [-0.55, 0.479, 4.66], look: [-0.55, 0.479, -0.66], fov: 32 };
const BITE = { pos: [-1.55, 2.0, 1.55], look: [-0.78, 2.12, -0.45], fov: 26 };
const SHADOW = { pos: [3.3, 1.0, 2.2], look: [-0.3, 2.2, -1.3], fov: 34 };
const CRUMB = { pos: [-0.2, 1.7, 3.2], look: [-0.45, 1.65, -0.2], fov: 30 };
write(import.meta.url, {
  id: "desk14-head-bench", title: "Potato Desk 14 head-kit bench", idea: "Engine look bench for the Desk 14 head kit (task T1), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural", physics: false,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["vik"], hint: 0, what: "engine bench" },
  cast, props, captions: c.captions,
  beats: c.beats([["front0", 0, FRONT], ["front1", 1.1, FRONT], ["side", 2.2, SIDE], ["top", 3.3, TOP], ["med193", 4.4, MED], ["bite", 5.5, BITE], ["shadow0", 6.6, SHADOW], ["shadow1", 7.7, SHADOW], ["crumbs", 8.8, CRUMB]], END),
  allowClip: [],
  notes: "Generated by storyboards/series/potato-desk/bench/make-desk14-head-bench.mjs (engine bench, no reviews).",
});
