// Bench for EP07 T2 (engine/page/props-firerewind.js): facadefire, blockfire, stairfire, floorsmoke. Stand-in boxes only (T1's
// fireblock / firelobby are not used): a brick-coloured wall with the window holes of DESIGN 1.1, Chip's box on the perch, a lobby
// stair of boxes at DESIGN 2 numbers. Three storyboards, each 1 s per proof state, the still lands 0.5 s into each:
//   firerewind-street.json   the street (frame A): proofs a, b, e, h
//   firerewind-inside.json   the stair and hallway (frame B at z -40): proofs f, g
//   firerewind-strip.json    proof c: the rewind in clip time 2.0-3.4 s (pause "grey", Spud as keeper), stills at 12 fps
//   node storyboards/series/what-if/07-fire-rewind/bench/make-firerewind-bench.mjs
//   node engine/render.mjs <json> --stills 0.5,1.5,... --draft --safe --silent      (the beat times are printed)
import { clip, write } from "../../../../lib/clip.mjs";

const BRICK = "#9c4a38", NAVY = "#232a4a";
const plank = (id, x, y, z, w, h, t, color) => ({ id, kind: "plank", x, y, z, w, h, t, color });

// ---------------------------------------------------------------------------------------------- the street (frame A)
const WINCOL = [-4.2, -2.1, 0, 2.3, 4.4], ROWS = [[1.15, 2.45], [2.95, 4.25], [5.55, 6.85], [8.15, 9.45]];
function windows() {   // [x0, x1, y0, y1, kind]
  const out = [];
  ROWS.forEach(([y0, y1], r) => WINCOL.forEach((cx) => {
    if (r === 0 && cx === 2.3) return;   // the door
    const w = r === 0 ? 1.5 : r === 1 && cx === 0 ? 1.3 : 1.2;
    out.push([cx - w / 2, cx + w / 2, y0, y1, r === 0 && cx === 0 ? "fire" : r === 1 && cx === 0 ? "chip" : "dark"]);
  }));
  return out;
}
function street(chipColor) {
  const P = [], W = windows();
  const bands = [[0, 1.15], [2.45, 2.95], [4.25, 5.55], [6.85, 8.15], [9.45, 10.6]];   // between window rows
  bands.forEach(([a, b], i) => P.push(plank(`wb${i}`, 0, a, -0.125, 12, b - a, 0.25, BRICK)));
  ROWS.forEach(([y0, y1], r) => {   // the brick between windows in a row (the door column is brick)
    const row = W.filter((w) => w[2] === y0).sort((a, b) => a[0] - b[0]);
    let x = -6; const xs = [];
    for (const w of row) { xs.push([x, w[0]]); x = w[1]; } xs.push([x, 6]);
    xs.forEach(([a, b], i) => { if (b - a > 0.001) P.push(plank(`wr${r}_${i}`, (a + b) / 2, y0, -0.125, b - a, y1 - y0, 0.25, BRICK)); });
  });
  W.forEach(([x0, x1, y0, y1, k], i) => { if (k === "dark") P.push(plank(`pane${i}`, (x0 + x1) / 2, y0, -0.10, x1 - x0, y1 - y0, 0.02, NAVY)); });
  // Chip's room (warm back wall) and the fire room (dim box, a sofa back)
  P.push(plank("chiproom", 0, 2.6, -1.0, 2.4, 2.0, 0.05, chipColor));
  P.push(plank("fireback", 0, 0.3, -1.85, 2.6, 2.45, 0.1, "#3a2c2a"), plank("firel", -1.3, 0.3, -0.95, 0.1, 2.45, 1.8, "#3a2c2a"), plank("firer", 1.3, 0.3, -0.95, 0.1, 2.45, 1.8, "#3a2c2a"));
  P.push(plank("fireceil", 0, 2.75, -0.95, 2.6, 0.05, 1.8, "#3a2c2a"));
  P.push(plank("sofa", 0, 0.3, -1.2, 1.4, 0.5, 0.5, "#241a1a"));
  P.push(plank("perch", 0, 2.85, -0.42, 1.2, 0.05, 0.6, "#4a3a34"));
  P.push(plank("chip", 0, 2.90, -0.42, 0.57, 0.53, 0.52, "#f2c94c"));   // the Chip stand-in (0.57 x 0.53 x 0.52)
  P.push({ id: "cob", kind: "cobbles", x: 0, y: 0, z: 1.6, w: 28, d: 3.2, seed: 4, leaves: 0 });
  P.push({ id: "road", kind: "cobbles", x: 0, y: -0.12, z: 7.1, w: 28, d: 7.6, seed: 9, leaves: 0 });
  P.push({ id: "lamp", kind: "streetlamp", x: -2.4, y: 0, z: 2.75, h: 3.2 });
  return P;
}

// ---------------------------------------------------------------------------------------------- the stair (frame B at z -40)
const Z0 = -40, SX = 1.7, SZ = -2.4 + Z0;
function inside() {
  const P = [];
  for (let n = 1; n <= 16; n++) P.push(plank(`tread${n}`, SX, 0, SZ - 0.3 * (n - 0.5), 1.6, 0.14 * n, 0.3, "#a79f94"));
  P.push(plank("lobbyfloor", 0, -0.1, Z0 - 3.6, 5, 0.1, 7.2, "#a79f94"));
  P.push(plank("hallfloor", SX, 0, Z0 - 11.2, 1.6, 2.24, 8, "#7a3038"));
  P.push(plank("back", -0.8, 0, Z0 - 7.3, 3.4, 5.2, 0.2, "#d9c7a3"), plank("backtop", SX, 4.44, Z0 - 7.3, 1.6, 0.76, 0.2, "#d9c7a3"));
  P.push(plank("rwall", 2.6, 0, Z0 - 3.6, 0.2, 5.2, 7.2, "#d9c7a3"), plank("lwall", -2.6, 0, Z0 - 3.6, 0.2, 5.2, 7.2, "#d9c7a3"));
  P.push(plank("ceil", 0, 5.2, Z0 - 3.6, 5.4, 0.1, 7.4, "#e9dcc0"));
  P.push(plank("hl", 0.8, 2.24, Z0 - 11.2, 0.2, 2.2, 8, "#d9c7a3"), plank("hr", 2.6, 2.24, Z0 - 11.2, 0.2, 2.2, 8, "#d9c7a3"), plank("hc", SX, 4.44, Z0 - 11.2, 1.8, 0.1, 8, "#e9dcc0"));
  P.push(plank("hend", SX, 2.24, Z0 - 15.3, 1.8, 2.2, 0.2, "#d9c7a3"));
  P.push(plank("clock", -0.9, 3.15, Z0 - 7.15, 0.9, 0.9, 0.05, "#f4ecd8"));   // the lobby clock stand-in (x -1.35..-0.45)
  P.push(plank("ruler", 0.9, 2.24 + 0.45, Z0 - 11.2, 0.02, 0.012, 8, "#e03030"));   // a red line along the left wall at 0.45 m
  P.push(plank("spud", SX, 2.24, Z0 - 10.4, 0.76, 0.88, 0.66, "#3aa6a0"));   // the Spud stand-in (0.76 x 0.88 x 0.66)
  return P;
}

// ---------------------------------------------------------------------------------------------- one storyboard
function bench(id, title, props, states, cams, extra = {}) {
  const c = clip();
  const fire = { id: "ff", kind: "facadefire", x: 0, y: 1.15, z: 0 }, block = { id: "bf", kind: "blockfire" };
  const stair = { id: "sf", kind: "stairfire", x: SX, y: 0, z: SZ }, smoke = { id: "fs", kind: "floorsmoke", x: SX, y: 2.24, z: Z0 - 11.2, box: [1.6, 8] };
  const all = extra.inside ? [stair, smoke] : [fire, block];
  states.forEach((s, i) => {
    const at = i === 0 ? 0 : i + 0.01;
    if (extra.inside) { c.prop(at, "sf", s.sf, 0); c.prop(at, "fs", s.fs, 0); } else { c.prop(at, "ff", s.ff, 0); c.prop(at, "bf", s.bf, 0); }
  });
  const sb = {
    id, title, idea: "Props bench for engine/page/props-firerewind.js (T2), not a clip",
    fps: 30, look: "anime-pro", profile: "short", loop: false, music: false, sound: { auto: false, sfx: 0, ambience: 0, speech: false }, cleanStart: true,
    set: { type: "plain", color: extra.inside ? "#2a2430" : "#141a45", floor: "none", night: true, para: 0, bloom: "emissive", key: [-2.5, 6, 4], aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    hook: { show: [], hint: 0, what: "engine test" }, cast: [], props: [...props, ...all],
    captions: c.captions, beats: c.beats(cams.map(([n, shot], i) => [n, i, shot]), cams.length),
    notes: "Test bench, not a clip. Generated by storyboards/series/what-if/07-fire-rewind/bench/make-firerewind-bench.mjs (T2).",
  };
  write(import.meta.url, sb);
  console.log(`  stills: --stills ${cams.map((_, i) => i + 0.5).join(",")}`);
}

// ---- the street states
const ST = (ff, bf = {}) => ({ ff: { time: 12.3, grow: 1, curl: 0, low: 0, ...ff }, bf: { time: 12.3, spread: 0, ...bf } });
const CAM_A = { pos: [1.4, 0.45, 3.0], look: [0.2, 2.6, 0], fov: 62 };
const CAM_LOW = { pos: [1.7, 0.6, 4.4], look: [0.2, 1.9, 0.6], fov: 66 };   // sees the cobbles in front of the window (T1-a's own lens does not)
const CAM_WIDE = { pos: [0, 1.2, 9], look: [0, 5.2, 0], fov: 70 };
const street_states = [
  // a: the glass, six times (grow 1)
  [`a time 10.0`, CAM_A, ST({ time: 10.0 })], [`a time 10.75 cracks`, CAM_A, ST({ time: 10.75 })], [`a time 10.85 burst`, CAM_A, ST({ time: 10.85 })],
  [`a time 11.0 shards fly`, CAM_A, ST({ time: 11.0 })], [`a time 11.4 shards land`, CAM_A, ST({ time: 11.4 })], [`a time 12.3 all down`, CAM_A, ST({ time: 12.3 })],
  // b: grow ramp at 12.3, and low 1
  [`b grow 0`, CAM_A, ST({ grow: 0 })], [`b grow 0.15`, CAM_A, ST({ grow: 0.15 })], [`b grow 0.5`, CAM_A, ST({ grow: 0.5 })],
  [`b grow 0.85`, CAM_A, ST({ grow: 0.85 })], [`b grow 1`, CAM_A, ST({ grow: 1 })], [`b grow 1 low 1`, CAM_A, ST({ grow: 1, low: 1 })],
  // e: the whole block ablaze
  [`e spread 0.5`, CAM_WIDE, ST({ low: 0.4 }, { spread: 0.5 })], [`e spread 1`, CAM_WIDE, ST({ low: 0.4 }, { spread: 1 })],
  // h: the tag, curl on the dark whole block (the glass is whole: time under the burst)
  [`h curl 1 grow 0`, CAM_A, ST({ time: 9.9, grow: 0, curl: 1 })], [`h curl 0.5 grow 0`, CAM_A, ST({ time: 9.9, grow: 0, curl: 0.5 })],
  // extras for the director: a mid growth wide, the rewound glass at 10.7 (cracks closing) and the burst bulge
  [`x grow 0.5 wide`, CAM_WIDE, ST({ grow: 0.5 })],
  [`x soot grow 1 time 9.9`, CAM_A, ST({ time: 9.9 })],
  [`x soot close`, { pos: [0, 2.1, 2.6], look: [0, 2.4, 0], fov: 50 }, ST({ time: 9.9, grow: 0.9 })],
  [`a-low time 11.0`, CAM_LOW, ST({ time: 11.0 })], [`a-low time 11.4`, CAM_LOW, ST({ time: 11.4 })], [`a-low time 12.3`, CAM_LOW, ST({ time: 12.3 })], [`x time 10.95 bulge`, CAM_A, ST({ time: 10.95 })],
];
bench("firerewind-street", "firerewind street bench", street("#f0c98a"),
  street_states.map(([, , s]) => s), street_states.map(([n, cam]) => [n, cam]));

// ---- the inside states (frame B)
const AT = 10, CAM_IN = { pos: [-0.9, 1.7, Z0 - 0.4], look: [1.0, 2.3, Z0 - 6.5], fov: 62 };
const CAM_SIDE = { pos: [2.4, 2.24 + 0.5, Z0 - 11.2], look: [0.9, 2.24 + 0.3, Z0 - 11.2], fov: 50 };   // across the hall at the red 0.45 m line on the left wall
const CAM_HALL = { pos: [SX, 2.24 + 0.6, Z0 - 7.6], look: [SX, 2.24 + 0.35, Z0 - 12], fov: 55 };
const IS = (sf, fs = {}) => ({ sf: { time: AT + 2, grow: 1, front: 0.25, ...sf }, fs: { time: 12, level: 0, drift: 0.25, ...fs } });
const inside_states = [
  [`f at+0.05 front 0.25`, CAM_IN, IS({ time: AT + 0.05 })], [`f at+0.2`, CAM_IN, IS({ time: AT + 0.2 })], [`f at+1.0`, CAM_IN, IS({ time: AT + 1.0 })],
  [`f front 0.1`, CAM_IN, IS({ time: 12, front: 0.1 })], [`f front 0.5`, CAM_IN, IS({ time: 12, front: 0.5 })], [`f front 0.8`, CAM_IN, IS({ time: 12, front: 0.8 })],
  [`g level 0.3`, CAM_HALL, IS({ grow: 0 }, { level: 0.3 })], [`g level 0.8`, CAM_HALL, IS({ grow: 0 }, { level: 0.8 })], [`g level 1`, CAM_HALL, IS({ grow: 0 }, { level: 1 })],
  [`g side level 1`, CAM_SIDE, IS({ grow: 0 }, { level: 1 })], [`g side level 0.8`, CAM_SIDE, IS({ grow: 0 }, { level: 0.8 })],
  [`x fire + smoke 0.5`, CAM_IN, IS({ time: 12, front: 0.5 }, { level: 0.5 })],
];
bench("firerewind-inside", "firerewind inside bench", inside(), inside_states.map(([, , s]) => s), inside_states.map(([n, cam]) => [n, cam]), { inside: true });

// ---- proof c: the rewind strip (clip time 2.0 .. 3.4, stills at 12 fps)
{
  const c = clip();
  // `time` runs 11.0 -> 12.0 -> 12.3 forward (to clip 2.3), then 12.3 -> 9.9 over 2.3-3.1 (3 s/s, linear), grow 1 -> 0 (ease in), low 0.6 -> 0
  c.prop(0, "ff", { time: 10.0, grow: 1, curl: 0, low: 0.6 }, 0);
  c.prop(0, "ff", { time: 12.3 }, 2.3, "linear");
  c.prop(2.3, "ff", { time: 9.9 }, 0.8, "linear"); c.prop(2.3, "ff", { grow: 0, low: 0 }, 0.8, "in");
  c.prop(0, "bf", { time: 0, spread: 0 }, 0);
  const sb = {
    id: "firerewind-strip", title: "firerewind rewind strip", idea: "Proof c: the fire running back in a pause window, not a clip",
    fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, music: false, sound: { auto: false, sfx: 0, ambience: 0, speech: false }, cleanStart: true,
    motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, animeTiming: true,
    set: { type: "plain", color: "#141a45", floor: "none", night: true, para: 0, bloom: "emissive", key: [-2.5, 6, 4], aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    hook: { show: ["spud"], hint: 0, what: "engine test" },
    pause: [{ from: 2.3, to: 3.1, keep: ["spud"], origin: "spud", look: "grey", wave: 0.12, back: 0.25, grade: { sat: 0.10, bright: 0.90, contrast: 0.95 } }],
    cast: [{ id: "spud", character: "potatobrawl/spud", at: [2.6, 1.7], face: "camera", expr: "shocked", follow: 0.3, seed: 1.3 }],
    props: [...street("#f0c98a"), { id: "ff", kind: "facadefire", x: 0, y: 1.15, z: 0 }, { id: "bf", kind: "blockfire" }],
    captions: c.captions, beats: c.beats([["strip", 0, { pos: [1.2, 1.1, 6.6], look: [1.2, 1.9, 0], fov: 66 }]], 3.5),
    notes: "Test bench, not a clip. Generated by make-firerewind-bench.mjs (T2, proof c).",
  };
  write(import.meta.url, sb);
  console.log(`  stills: --stills ${Array.from({ length: 17 }, (_, k) => (2 + k / 12).toFixed(3)).join(",")}`);
}
