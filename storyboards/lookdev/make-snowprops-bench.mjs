// Snow props bench (Survive it EP1 "Snowed in", task T4): the small props of engine/page/props-survive-snow.js in the
// warm "xmasroom" set, in the clip's look (castLook "sheet", look "anime-pro" with the clip template's cel, ink, satsuei
// and light 2). One shot a second or two, a still in the middle of each (STILLS, printed). The cast moves between the
// shots at the cuts; a prop that is not in a shot is hidden (scale 0) there.
//   1  holds       Viking holds the one log in both gloves (grips.box), Reaper the hammer in his right fist (grips.mug)
//   2  lineup      the floor props at their sizes: lograck (2 logs), choppingblock, boardplank, hammer, two woodchairs
//   3  heap        choppingblock + sliverheap, amount 0.3 then 1, a chop's chips mid-air in each still
//   4  armful      the Samurai holds a kindlingarmful across both arms (grips.box) as it dumps, dump 0.5
//   5  huddle      huddleblanket over three potatoes (spec.over), one quilt, faces and hands free
//   6  window      the xmasroom's window boarded with four planks (1.4 m), snowspray on 1 through the gaps
//   7  bolt        chimneybolt on 1 up the chimney breast
//   8  throat      snowthroat (trickle 0.7)
//   9  ice         iciclerow under a board, two icicles, snowdrift against the back wall
//  10  warm          sunbeam over a face, snowlump hat and nose dab, greenpatch (grow 1) with its three flowers
//   node storyboards/lookdev/make-snowprops-bench.mjs   -> snowprops-bench.json, and the still times (printed)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, r3 } from "../lib/clip.mjs";
import * as grips from "../lib/grips.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SET = { type: "xmasroom", light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };
const c = clip(), { A } = c;

// ---------------------------------------------------------------- the shots: camera, who stands where, which props show
const yawTo = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const SHOTS = [
  { name: "holds", len: 3.5, st: [1.8], cam: { pos: [0, 1.5, 4.5], look: [0, 0.7, 0.4], fov: 50 }, cast: { vik: [-0.55, 0.2], rea: [0.62, 0.2], sam: [-2.3, -1.7] }, show: ["blkA", "blkB", "log", "hammer"] },
  { name: "lineup", len: 1, st: [0.5], cam: { pos: [0, 1.7, 6.6], look: [0, 0.6, 0], fov: 52 }, cast: { vik: [-1.3, -1.3], rea: [1.0, -1.3], sam: [0, -1.6] }, show: ["rack", "block", "plank", "hammer2", "chL1", "chL2", "lump"] },
  { name: "heap", len: 2, st: [0.55, 1.55], cam: { pos: [0.9, 1.45, 2.7], look: [-0.45, 0.3, -0.5], fov: 52 }, cast: { vik: [1.5, -0.4], rea: [-1.9, -0.9], sam: [-0.45, -1.15] }, show: ["block3", "heap", "rack3"] },
  { name: "armful", len: 2, st: [1.25], cam: { pos: [0.15, 1.3, 4.0], look: [0, 0.55, 0.3], fov: 50 }, cast: { vik: [-2.2, -1.3], rea: [2.2, -1.3], sam: [0, 0.3] }, show: ["blkC", "kind"] },
  { name: "huddle", len: 1, st: [0.5], cam: { pos: [-0.12, 1.15, 4.8], look: [-0.12, 0.85, -0.2], fov: 60 }, cast: { vik: [-1.2, -0.2], sam: [0, -0.2], rea: [0.97, -0.2] }, show: ["quilt"] },
  { name: "window", len: 1, st: [0.5], cam: { pos: [0.5, 1.5, 1.9], look: [-1.4, 1.45, -2.3], fov: 52 }, cast: { vik: [1.6, -1.2], sam: [2.2, 0.6], rea: [-2.2, 0.8] }, show: ["pl1", "pl2", "pl3", "pl4", "spray"] },
  { name: "bolt", len: 1, st: [0.5], cam: { pos: [0.4, 1.5, 1.2], look: [1.05, 1.5, -2.0], fov: 54 }, cast: { vik: [-2.0, -1.0], sam: [-2.2, 0.8], rea: [2.2, 1.0] }, show: ["bolt"] },
  { name: "throat", len: 1, st: [0.5], cam: { pos: [-0.1, 1.15, 3.3], look: [-0.1, 0.65, -1.6], fov: 52 }, cast: { vik: [1.9, 0.4], sam: [2.4, -0.9], rea: [-2.1, 0.2] }, show: ["throat"] },
  { name: "ice", len: 1, st: [0.5], cam: { pos: [0, 1.4, 3.4], look: [-0.05, 1.0, -2.0], fov: 52 }, cast: { vik: [1.9, 0.5], sam: [2.2, -0.6], rea: [-2.1, 0.3] }, show: ["icerow", "plIce", "ice1", "ice2", "drift"] },
  { name: "warm", len: 1, st: [0.5], cam: { pos: [2.5, 1.35, 3.1], look: [-0.15, 0.95, -0.4], fov: 50 }, cast: { vik: [-0.4, -0.1], sam: [-2.2, -1.5], rea: [-1.2, -1.7] }, show: ["beam", "lumpHat", "lumpNose", "patch", "plBeam"] },
];
SHOTS.reduce((t, s) => { s.at = r3(t); s.stills = s.st.map((d) => r3(t + d)); return t + s.len; }, 0);
const END = SHOTS.at(-1).at + SHOTS.at(-1).len;
export const STILLS = SHOTS.flatMap((s) => s.stills);
const inShot = (id, i) => SHOTS[i].show.includes(id);

// ---------------------------------------------------------------- props
const WIN = { x: -1.4, y0: 0.82, y1: 2.2 };   // the xmasroom's window, boarded in shot 6
const PL_Y = [0.95, 1.3, 1.65, 2.0];            // the four planks' middles (0.18 wide: three 0.17 gaps between)
const props = [];
const add = (spec) => { const first = SHOTS.findIndex((s, i) => inShot(spec.id, i)); props.push({ ...spec, ...(first !== 0 && { scale: 0 }) }); };

// shot 1: the holds. The log lies on a chopping block in front of Viking, the hammer stands on another in front of Reaper
const VIK1 = SHOTS[0].cast.vik, REA1 = SHOTS[0].cast.rea;
const BLK_A = [VIK1[0], 0, VIK1[1] + 0.62], BLK_B = [REA1[0], 0, REA1[1] + 0.62];
add({ id: "blkA", kind: "choppingblock", x: BLK_A[0], y: 0, z: BLK_A[2] });
add({ id: "blkB", kind: "choppingblock", x: BLK_B[0], y: 0, z: BLK_B[2] });
const LOG_SEAT = [BLK_A[0], 0.4, BLK_A[2]], HAM_SEAT = [BLK_B[0] + 0.05, 0.4, BLK_B[2]];
const LOG = { id: "log", kind: "firewood", len: 0.5, r: 0.09, ...grips.placeFor("firewood", LOG_SEAT, 0) };
const HAM = { id: "hammer", kind: "hammer", ...grips.placeFor("hammer", HAM_SEAT, 0) };
add(LOG); add(HAM);

// shot 2: the lineup, left to right
add({ id: "rack", kind: "lograck", x: -1.45, z: 0.4, rot: 20, logs: 2 });
add({ id: "block", kind: "choppingblock", x: -0.75, z: 0.45 });
add({ id: "plank", kind: "boardplank", x: -0.15, y: 0, z: 0.4, rot: -25, tilt: 7 });
add({ id: "hammer2", kind: "hammer", x: 0.3, y: 0.02, z: 0.9, rot: 210, tilt: 90 });
add({ id: "chL1", kind: "woodchair", x: 0.55, z: 0.4, rot: -20 });
add({ id: "chL2", kind: "woodchair", x: 1.15, z: 0.55, rot: 70, tip: 90, y: 0.45 });
add({ id: "lump", kind: "snowlump", x: -0.4, y: 0, z: 1.5, r: 0.15 });

// shot 3: the block, the heap and the chips (amount 0.3 then 1; a chop 0.2 s before each still)
const BLK = [-0.45, -0.5];
add({ id: "block3", kind: "choppingblock", x: BLK[0], z: BLK[1] });
add({ id: "heap", kind: "sliverheap", x: BLK[0] + 0.0, z: BLK[1] + 0.32, block: [0, -0.32], amount: 0.3, chop: [[SHOTS[2].at + 0.35], [SHOTS[2].at + 1.35]], seed: 11 });
add({ id: "rack3", kind: "lograck", x: -1.35, z: -0.35, rot: 12, logs: 1 });

// shot 4: the kindling armful on a chair seat, taken in both arms by the Samurai
const SAM4 = SHOTS[3].cast.sam, BLK_C = [SAM4[0], 0, SAM4[1] + 0.62];
add({ id: "blkC", kind: "choppingblock", x: BLK_C[0], y: 0, z: BLK_C[2] });
const KIND = { id: "kind", kind: "kindlingarmful", ...grips.placeFor("kindlingarmful", [BLK_C[0], 0.4, BLK_C[2]], 0) };
add(KIND);

// shot 5: one quilt over three potatoes
add({ id: "quilt", kind: "huddleblanket", over: [[-1.2, -0.2, 1.38], [0, -0.2, 1.33], [0.97, -0.2, 1.4]], cover: 1, staged: "worn over the cast" });

// shot 6: four planks laid across the window (long side along x, tilt 90), nailed on the +z face, and the spray
const PLANK_LEN = 1.4;
PL_Y.forEach((y, k) => add({ id: `pl${k + 1}`, kind: "boardplank", len: PLANK_LEN, seed: 4 + k, x: WIN.x - PLANK_LEN / 2 + (k % 2 ? 0.03 : -0.02), y, z: -2.2, tilt: 90, staged: "nailed over the window" }));
add({ id: "spray", kind: "snowspray", x: WIN.x, y: WIN.y0, z: -2.17, w: 1.3, h: WIN.y1 - WIN.y0, gaps: [0.305, 0.655, 1.005], seed: 3 });

// shot 7: the bolt up the chimney breast, from the fire opening (x 1.05) to the ceiling
add({ id: "bolt", kind: "chimneybolt", x: 1.05, y: 1.0, z: -1.9, w: 1.7, h: 1.6 });

// shot 8: snow in the throat, icicles under an edge (a plank laid along the top as the edge), a drift against the left wall
add({ id: "throat", kind: "snowthroat", x: -0.1, y: 0, z: -1.6, trickle: 0.7 });
add({ id: "plIce", kind: "boardplank", len: 1.3, x: -0.7, y: 1.75, z: -1.6, tilt: 90, staged: "a board overhead, the icicles' edge" });
add({ id: "icerow", kind: "iciclerow", x: 0, y: 1.66, z: -1.6, len: 1.2, count: 11, grow: 0.9, staged: "hangs from the board" });
add({ id: "ice1", kind: "icicle", x: 0.8, y: 1.3, z: -1.2, len: 0.14, staged: "a dropping icicle held in the air for the bench" });
add({ id: "ice2", kind: "icicle", x: 0.55, y: 0.02, z: -0.9, tip: 100, len: 0.14 });
add({ id: "drift", kind: "snowdrift", x: -0.1, y: 0, z: -2.28, w: 1.3, d: 0.9, depth: 1 });

// shot 9: a sunbeam through a board gap over a face, snowlumps on a head and a nose, the green patch
const WARM = SHOTS.find((x) => x.name === "warm"), VIK9 = WARM.cast.vik;
add({ id: "plBeam", kind: "boardplank", len: 1.2, x: -1.0, y: 1.9, z: -1.3, tilt: 90, staged: "the board with the gap" });
add({ id: "beam", kind: "sunbeam", x: -0.15, y: 1.8, z: -1.25, len: 1.9, w: 0.07, h: 0.5, dir: [-0.16, -0.65, 0.74], sweep: 0.5, on: 1, staged: "light" });
add({ id: "lumpHat", kind: "snowlump", x: VIK9[0] - 0.04, y: 1.24, z: VIK9[1] + 0.0, r: 0.16, staged: "on his crest" });
add({ id: "lumpNose", kind: "snowlump", x: VIK9[0] + 0.05, y: 0.76, z: VIK9[1] + 0.38, r: 0.035, staged: "on his nose" });
add({ id: "patch", kind: "greenpatch", x: 0.8, y: 0, z: 0.7, grow: 1 });

// ---------------------------------------------------------------- actions
const cast = [["vik", "duo/viking", SHOTS[0].cast.vik], ["sam", "duo/samurai", SHOTS[0].cast.sam], ["rea", "never-has-money/reaper", SHOTS[0].cast.rea]].map(([id, character, at], i) => ({ id, character, at, face: yawTo(at, [SHOTS[0].cam.pos[0], SHOTS[0].cam.pos[2]]), follow: 0, sway: 0.4, seed: 1.1 + i * 0.7 }));
for (const [id] of [["vik"], ["sam"], ["rea"]]) A(0, id, "noblink");
// the cast moves while the picture is cut (a cut cheat, never seen) and turns to the new camera; props toggle the same way
SHOTS.forEach((s, i) => {
  if (!i) return;
  const t = r3(s.at - 0.03), cam = [s.cam.pos[0], s.cam.pos[2]];
  for (const [id, at] of Object.entries(s.cast)) {
    A(t, id, "move", { to: at, dur: 0.01, steps: 0 }); A(t, id, "turn", { to: yawTo(at, cam), dur: 0.01 });
    for (const side of ["R", "L"]) { c.arm(t, id, side, "rest", 0.01); A(t, id, "grip", { side, shape: "relaxed", dur: 0.01 }); }   // arms back to rest at the cut
  }
  for (const p of props) { const was = inShot(p.id, i - 1), now = inShot(p.id, i); if (was !== now) c.prop(t, p.id, { scale: now ? 1 : 0 }, 0.01, "linear"); }
});

// shot 1: Viking takes the log from the seat in both gloves (grips.box), holds it up like a trophy, puts it back;
// Reaper takes the hammer in his right fist (grips.mug) and holds it up
{
  const hv = grips.box(c, "vik", LOG), hr = grips.mug(c, "rea", HAM, { side: "R" });
  A(0, "vik", "look", { to: [0, 0.1], dur: 0.01, blink: false }); A(0, "rea", "look", { to: [0, 0.1], dur: 0.01, blink: false });
  let t = hv.take(0.1); t = hv.carry(t + 0.05, [VIK1[0], 0.62, VIK1[1] + 0.46], 0.5);
  let u = hr.take(0.1); u = hr.carry(u + 0.05, [REA1[0] - 0.42, 0.8, REA1[1] + 0.45], 0.5);
  const back = Math.max(t, u) + 1.0;
  hv.put(back, LOG_SEAT); hr.put(back, HAM_SEAT);
}
// shot 4: the Samurai takes the bundle in both arms and tips it forward: the dump runs 0 -> 1 over a second (0.5 at the still)
{
  const t0 = SHOTS[3].at, hs = grips.box(c, "sam", KIND);
  A(t0, "sam", "noblink");
  let t = hs.take(t0 + 0.05); t = hs.carry(t + 0.05, [SAM4[0], 0.62, SAM4[1] + 0.46], 0.4);
  c.prop(SHOTS[3].stills[0] - 0.5, "kind", { dump: 0 }, 0.01, "linear"); c.prop(SHOTS[3].stills[0] - 0.5, "kind", { dump: 1 }, 1.0, "linear");
}
// shot 3: the heap grows from 0.3 to 1 between the stills
c.prop(SHOTS[2].at + 1.0, "heap", { amount: 1 }, 0.3, "out");
// shot 6, 7, 8: the effects come on
c.prop(SHOTS[5].at + 0.05, "spray", { on: 1 }, 0.3, "out");
c.prop(SHOTS[6].at + 0.05, "bolt", { on: 1 }, 0.4, "linear");
c.prop(WARM.at, "beam", { on: 1 }, 0.01, "linear");


const actions = c.items.sort((a, b) => a.at - b.at);
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"], HUDDLE = SHOTS.find((x) => x.name === "huddle");
const sb = {
  id: "snowprops-bench", title: "Snow props bench: the small props of the snowed-in cottage", fps: 30, look: "anime-pro", castLook: "sheet",
  profile: "short", loop: false, duration: r3(END), cleanStart: true, rig: { hand: 2, eyes: 2, hold: 2 }, animeTiming: true,
  set: SET, music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [1, 30], notes: false },
  shots: SHOTS.map((s) => ({ at: s.at, ...s.cam })), cast, props, actions,
  // the same windows as the episode (make-snowed-in.mjs): a worn prop trips the body checks by design
  allowClip: [
    { who: "quilt", from: HUDDLE.at, to: r3(HUDDLE.at + HUDDLE.len), checks: WORN, reason: "one quilt worn over all three, the arms tucked under it" },
    { who: "lumpHat", from: WARM.at, to: r3(END), checks: WORN, reason: "a lump of snow sitting on Viking's crest" },
  ],
  notes: "Generated by storyboards/lookdev/make-snowprops-bench.mjs (props bench, Survive it EP1 task T4).",
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = path.join(here, `${sb.id}.json`);
  fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n");
  console.log(path.relative(process.cwd(), f));
  console.log(`stills: ${STILLS.join(",")}`);
}
