// Avalanche bench (Survive it EP1 "Snowed in", task T2): the mountain world (set "snowslope", engine/page/set-snowslope.js)
// and the avalanche props (engine/page/props-avalanche.js) in the clip's look (anime-pro, the template's cel, ink,
// satsuei and light 2), one still a second, each from its own camera (shots):
//   0.5  panel 06: night, the cottage mid-ride (slide 0.5, tilt 6) on the front of the snowfront (run 0.5), firs
//        flipping, from a tracking camera 25 m off, down the slope and to its back-wall side (the lit window) (outside the front's 40 m width:
//        25 m straight to its side is 5 m from the wall's end), looking up the slope; smoke 2.5
//   1.5  panel 07: day, the cottage at slide 1, door open, a camera at eye height (0.71 m) looking +x and up at the
//        door, the cap white in the sky over the roof (4.15 m out: from 3 m the roof's snowy eave hides the whole cap)
//   2.5  panel 08: the snowmound risen, the cap gone (bare rock, the track), the World line's camera
//   3.5  the payoff wave mid-way: snowcap run 0.6, scale 3, the same camera
//   4.5  the brief's literal panel 07 camera (3 m from the door, eyes 0.71, looking +x): for the record
//   node storyboards/lookdev/make-avalanche-bench.mjs   -> avalanche-bench.json, and the still times (printed)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SET = { type: "snowslope", dark: [[0, 1], [1, 1], [1, 0]], light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };

// the ride's place at slide 0.5 (SNOWSLOPE.ridePath: x 140 -> 0 along the 30-degree apron, y = tan 30 * (x - 30))
const RIDE = [70, Math.tan(Math.PI / 6) * 40, 0];
const add = (a, b) => a.map((v, i) => +(v + b[i]).toFixed(3));
const STILLS = [
  { at: 0, still: 0.5, name: "panel 06: the ride (night)", shot: { pos: add(RIDE, [-19, 3, -15.5]), look: add(RIDE, [1.5, 4.5, 0.5]), fov: 42 },
    set: { cot: { slide: 0.5, tilt: 6, door: 0, boards: 1, trail: 1, smoke: 2.5 }, front: { run: 0.5, scale: 1 }, cap: { run: 0, break: 0, scale: 3 }, mound: { rise: 0 } } },
  { at: 1, still: 1.5, name: "panel 07: the doorway (day)", shot: { pos: [-6.9, 0.71, -0.4], look: [3.1, 3.58, -0.4], fov: 56 },
    set: { cot: { slide: 1, tilt: 0, door: 1, boards: 0, trail: 0.6, smoke: 1 }, front: { run: 1, scale: 0.001 }, cap: { run: 0, break: 0, scale: 3 }, mound: { rise: 0 } } },
  { at: 2, still: 2.5, name: "panel 08: the mound, the bare peak", shot: { pos: [-12, 4, -0.4], look: [60, 40, 0], fov: 50 },
    set: { cot: { slide: 1, tilt: 0, door: 0, boards: 0, trail: 0.6, smoke: 0 }, front: { run: 1, scale: 0.001 }, cap: { run: 1, break: 1, scale: 3 }, mound: { rise: 1 } } },
  { at: 3, still: 3.5, name: "the payoff wave mid-way (cap run 0.6, scale 3)", shot: { pos: [-12, 4, -0.4], look: [60, 40, 0], fov: 50 },
    set: { cot: { slide: 1, tilt: 0, door: 0, boards: 0, trail: 0.6, smoke: 1 }, front: { run: 1, scale: 0.001 }, cap: { run: 0.6, break: 1, scale: 3 }, mound: { rise: 0 } } },
  { at: 4, still: 4.5, name: "the brief's panel 07 camera, 3 m out", shot: { pos: [-5.75, 0.71, -0.4], look: [4.25, 3.58, -0.4], fov: 56 },
    set: { cot: { slide: 1, tilt: 0, door: 1, boards: 0, trail: 0.6, smoke: 1 }, front: { run: 1, scale: 0.001 }, cap: { run: 0, break: 0, scale: 3 }, mound: { rise: 0 } } },
];

const props = [
  { id: "cot", kind: "cottagesled", x: 0, y: 0, z: 0, slide: 1, scenery: true },
  { id: "ccap", kind: "chimneycap", x: 0, y: 0, z: 0 },
  { id: "front", kind: "snowfront", x: 0, y: 0, z: 0, run: 0 },
  { id: "cap", kind: "snowcap", x: 0, y: 0, z: 0, run: 0, scale: 3 },
  { id: "mound", kind: "snowmound", x: 0, y: 0, z: 0, rise: 0 },
];
// every key at each still's second (dur 0), and the chimney cap on the chimney's top for that slide and tilt
// (props-avalanche.js AVALANCHE.chimneyTop; worked out here from the same numbers: the chimney's top at x 1.05,
// z -1.9, 1.2 m above the ridge (eave 2.6 + 2.75 tan 30))
const CHIM = [1.05, 2.6 + 2.75 * Math.tan(Math.PI / 6) + 1.2, -1.9];
function chimneyTop(slide, tilt) {
  const x = 140 * (1 - slide), y = x <= 20 ? 0 : x <= 40 ? (Math.tan(Math.PI / 6) * (x - 20) ** 2) / 40 : Math.tan(Math.PI / 6) * (x - 30);
  const d = x <= 20 ? 0 : x <= 40 ? (Math.tan(Math.PI / 6) * (x - 20)) / 20 : Math.tan(Math.PI / 6);
  const a = Math.atan(d) - (tilt * Math.PI) / 180, [cx, cy, cz] = CHIM;
  return { at: [+(x + cx * Math.cos(a) - cy * Math.sin(a)).toFixed(4), +(y + cx * Math.sin(a) + cy * Math.cos(a)).toFixed(4), cz], roll: +((a * 180) / Math.PI).toFixed(3) };
}
const actions = [];
for (const s of STILLS) {
  const c = chimneyTop(s.set.cot.slide, s.set.cot.tilt);
  actions.push({ do: "prop", id: "cot", at: s.at, dur: 0, set: s.set.cot });
  actions.push({ do: "prop", id: "ccap", at: s.at, dur: 0, set: { x: c.at[0], y: c.at[1], z: c.at[2], roll: c.roll } });
  actions.push({ do: "prop", id: "front", at: s.at, dur: 0, set: s.set.front });
  actions.push({ do: "prop", id: "cap", at: s.at, dur: 0, set: s.set.cap });
  actions.push({ do: "prop", id: "mound", at: s.at, dur: 0, set: s.set.mound });
}

const sb = {
  id: "avalanche-bench", title: "Avalanche bench: the snowy mountain, the cottage's ride and the cap coming down", fps: 30, look: "anime-pro", castLook: "sheet",
  profile: "short", loop: false, duration: STILLS.length, cleanStart: true, set: SET, music: false, sound: { sfx: 0, ambience: 0, speech: false },
  creative: { length: [1, 30], notes: false }, cast: [], props, actions, captions: [],
  shots: STILLS.map((s) => ({ at: s.at, ...s.shot })),
  notes: "Test bench, not a clip. Generated by storyboards/lookdev/make-avalanche-bench.mjs (Survive it EP1 task T2).",
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = path.join(here, `${sb.id}.json`);
  fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n");
  console.log(path.relative(process.cwd(), f));
  console.log(`stills: ${STILLS.map((s) => s.still).join(",")}`);
  for (const s of STILLS) console.log(`  ${s.still}  ${s.name}`);
}
