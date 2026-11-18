// Bench for the frozen lake world (friends try to 12, task T1): the set `icelake` (engine/page/set-icelake.js) and the props lakeice, icejetty,
// icerod x2, icebucket, icesplash (engine/page/props-icelake.js), in the template's look, with Spud / Chip / Wedge / Mash on their 0.0 marks and
// the three on the ledge and on the jetty deck marks (design section 1). Not a clip: one still per shot, each from its own camera.
//   node storyboards/series/friends-try-to/12-frozen-lake/make-icelake-bench.mjs      -> icelake-bench.json and the still times
//   node engine/render.mjs <json> --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/icelake-bench-*.png --out storyboards/series/friends-try-to/12-frozen-lake/bench/icelake-sheet.png
// DONE WHEN list (design section 9): set from A-wide, B, A-mid; the four on their marks; the three on the ledge and the deck marks; lakeice at crack
// 0.05 0.1 0.3 0.5 0.8 1 from A-wide and from above; run 0.5 and 1; slab 0.5 and 1 with churn 1; icesplash at puff 0.15 0.4 0.8; rods + bucket.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const LOOK = { aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };
const SET = { type: "icelake", ...LOOK };

// ---- the design's cameras (section 1), plus bench cameras
const CAM = {
  wide: { pos: [-0.35, 1.35, 4.9], look: [-0.35, 0.40, 0.3], fov: 58 },
  B: { pos: [3.0, 1.0, 1.8], look: [-0.6, 0.45, -1.6], fov: 46 },
  mid: { pos: [0.55, 1.50, 4.5], look: [0.45, 0.40, -0.5], fov: 54 },
  close: { pos: [0.25, 0.75, 2.5], look: [0.25, 0.38, 0], fov: 40 },
  ots: { pos: [0.30, 0.95, 1.5], look: [0.05, 0.75, -2.5], fov: 42 },
  marks: { pos: [-0.3, 1.2, 3.9], look: [-0.3, 0.5, 0], fov: 50 },
  above: { pos: [0.0, 6.0, 1.6], look: [0.0, 0, 0.2], fov: 45 },
  slab: { pos: [1.0, 1.25, 3.7], look: [0.75, 0.0, 0.6], fov: 40 },
  splash: { pos: [1.5, 0.95, 3.1], look: [1.4, 0.15, 0.9], fov: 44 },
  rods: { pos: [-0.3, 0.9, 3.0], look: [-0.1, 0.12, 1.6], fov: 36 },
  hole: { pos: [-0.45, 0.6, 2.7], look: [-0.3, 0.08, 1.6], fov: 32 },
  deck: { pos: [0.55, 1.50, 4.5], look: [0.2, 0.6, -1.2], fov: 54 },
  sky: { pos: [-0.35, 1.35, 4.9], look: [-0.35, 4.0, -8], fov: 58 },
};

// ---- cast: marks at 0.0 (design 1), the ledge (feet y 0.10) and the deck marks (feet y 0.20, rot 0, sheet order P6)
const spec = (id, character, at, y, face, seed) => ({ id, character, at, ...(y ? { y } : {}), face, expr: "kind", follow: 0.3, seed });
const cast = [
  spec("chip", "potatobrawl/chip", [0, 0], 0, 0, 2.1), spec("spud", "potatobrawl/spud", [-0.55, -0.85], 0, 5, 1.3), spec("wedge", "potatobrawl/wedge", [-1.35, 0.10], 0, 12, 3.7), spec("mash", "potatobrawl/mash", [0.80, -0.60], 0, -8, 4.4),
  spec("wedgeL", "potatobrawl/wedge", [-1.05, -1.96], 0.10, 0, 3.7), spec("mashL", "potatobrawl/mash", [0.10, -1.96], 0.10, 0, 4.4), spec("spudL", "potatobrawl/spud", [1.15, -1.96], 0.10, 0, 1.3),
  spec("wedgeD", "potatobrawl/wedge", [-1.05, -2.60], 0.20, 0, 3.7), spec("mashD", "potatobrawl/mash", [0.10, -2.55], 0.20, 0, 4.4), spec("spudD", "potatobrawl/spud", [1.15, -2.60], 0.20, 0, 1.3),
];
const GROUPS = { marks: ["chip", "spud", "wedge", "mash"], ledge: ["chip", "wedgeL", "mashL", "spudL"], deck: ["chip", "wedgeD", "mashD", "spudD"], three: ["spud", "wedge", "mash"], none: [] };

const props = [
  { id: "ice", kind: "lakeice", x: 0, y: 0, z: 0, scenery: true },
  { id: "jetty", kind: "icejetty", x: 0, y: 0, z: 0, scenery: true },
  { id: "rodA", kind: "icerod", x: -0.80, y: 0, z: 1.72, rot: 0, hole: [-0.30, 1.60, 0.22] },
  { id: "rodB", kind: "icerod", x: 0.20, y: 0, z: 1.78, rot: 180, hole: [-0.30, 1.60, 0.22] },
  { id: "bucket", kind: "icebucket", x: 0.67, y: 0, z: 1.35, staged: "bench: the bucket stays put while the slab tips under it" },
  { id: "splash", kind: "icesplash", x: 1.42, y: -0.02, z: 0.94, scale: 1 },
];

// [label, camera, group, keys { crack, run, slab, churn, puff }]
const S = (label, cam, group, k = {}) => ({ label, cam, group, k: { crack: 0, run: 0, slab: 0, churn: 0, puff: 0, ...k } });
const SHOTS = [
  S("set A-wide, four on their marks, frame 0 (crack 0.05)", "wide", "marks", { crack: 0.05 }),
  S("set B, three on the ledge (crack 0.3)", "B", "ledge", { crack: 0.3 }),
  S("set A-mid, three on the deck marks (crack 0.5)", "mid", "deck", { crack: 0.5 }),
  S("the four on their 0.0 marks, closer (crack 0.05)", "marks", "marks", { crack: 0.05 }),
  S("the three on the ledge from A-mid (crack 0.65)", "mid", "ledge", { crack: 0.65 }),
  ...[0.05, 0.1, 0.3, 0.5, 0.8, 1].map((c) => S(`lakeice crack ${c}, A-wide`, "wide", "marks", { crack: c })),
  ...[0.05, 0.1, 0.3, 0.5, 0.8, 1].map((c) => S(`lakeice crack ${c}, from above`, "above", "none", { crack: c })),
  S("run 0.5 (crack 1)", "slab", "none", { crack: 1, run: 0.5 }),
  S("run 1 (crack 1)", "slab", "none", { crack: 1, run: 1 }),
  S("slab 0.5, churn 1", "slab", "none", { crack: 1, run: 1, slab: 0.5, churn: 1 }),
  S("slab 1, churn 1", "slab", "none", { crack: 1, run: 1, slab: 1, churn: 1 }),
  S("slab 1, churn 1, from A-mid with Spud, Wedge, Mash (Chip stands on the slab at 0,0: a clip staging question)", "mid", "three", { crack: 1, run: 1, slab: 1, churn: 1 }),
  ...[0.15, 0.4, 0.8].map((p) => S(`icesplash puff ${p}`, "splash", "none", { crack: 1, run: 1, slab: 0.3, churn: 1, puff: p })),
  S("rods and bucket", "rods", "none", { crack: 0.1 }),
  S("the hole close", "hole", "none", { crack: 0.05 }),
  S("jetty from B, three on the deck marks", "B", "deck", { crack: 0.8 }),
  S("A-close (Chip, the web)", "close", "ledge", { crack: 0.65 }),
  S("the sky and the gap, looking up", "sky", "none", { crack: 0.05 }),
];

const actions = [], shots = [], stills = [];
SHOTS.forEach((s, i) => {
  const at = i;
  shots.push({ at, ...CAM[s.cam] }); stills.push(at + 0.5);
  for (const id of ["ice"]) actions.push({ do: "prop", id, at, dur: 0, set: s.k.crack !== undefined ? { crack: s.k.crack, run: s.k.run, slab: s.k.slab, churn: s.k.churn } : {} });
  actions.push({ do: "prop", id: "splash", at, dur: 0, set: { puff: s.k.puff } });
  for (const c of cast) actions.push({ who: c.id, do: GROUPS[s.group].includes(c.id) ? "show" : "hide", at });
});

const sb = {
  id: "icelake-bench", title: "Frozen lake bench: icelake set, lakeice, icejetty, icerod, icebucket, icesplash (friends try to 12, T1)", fps: 30, look: "anime-pro", castLook: "sheet",
  profile: "short", loop: false, duration: SHOTS.length, cleanStart: true, set: SET, music: false, sound: { sfx: 0, ambience: 0, speech: false },
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  creative: { length: [1, 60], notes: false }, cast, props, actions: actions.sort((a, b) => a.at - b.at), captions: [], shots,
  notes: "Test bench, not a clip. Generated by storyboards/series/friends-try-to/12-frozen-lake/make-icelake-bench.mjs (task T1).",
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = path.join(here, `${sb.id}.json`);
  fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n");
  console.log(path.relative(process.cwd(), f));
  console.log(`stills: ${stills.join(",")}`);
  SHOTS.forEach((s, i) => console.log(`  ${stills[i]}  ${s.label}`));
}
