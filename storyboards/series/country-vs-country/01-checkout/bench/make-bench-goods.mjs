// Country vs Country 01 checkout, goods bench (task T2): the props of engine/page/props-checkout-goods.js at their DESIGN sizes (section 7) and the
// bag heap at grow 0.25, 0.6 and 1 from DESIGN cam 08. Plain set, the clip's look. One shot per group, a still in the middle of each (printed).
//   node storyboards/series/country-vs-country/01-checkout/bench/make-bench-goods.mjs   -> bench-goods.json, and the still times
//   node engine/render.mjs <json> --stills <times> --draft ; node qa/contact.mjs <dir>/bench-goods-*.png --out <sheet.png>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const r3 = (v) => Math.round(v * 1000) / 1000;
const SET = { type: "plain", color: "#d9d4c8", floor: "shadow", light: "golden", aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };

// portrait frame, vertical fov 30: width seen = 0.3014 x distance
const closeCam = (c, w, h = 0.1, dist = null, down = 0.06) => { const d = dist ?? (w * 1.2) / 0.3014; return { pos: [c[0], c[1] + h + down, c[2] + d], look: [c[0], c[1] + h, c[2]], fov: 30 }; };

const props = [], actions = [];
const add = (spec) => props.push(spec);
const GR = (x) => [x, 0, 0];   // a group's centre on the floor
// A: hand props with their design numbers
add({ id: "roll", kind: "cashroll", x: -3.12, y: 0, z: 0, scale: 1.4 });
add({ id: "grape", kind: "grape", x: -2.92, y: 0, z: 0 });
add({ id: "milk", kind: "milkcarton", x: -2.77, y: 0, z: 0.0, rot: 20 });
// B: egg carton, closed and mid rattle
add({ id: "eggs", kind: "eggcarton", x: -5, y: 0, z: 0, rattle: 0 });
// C: cheese, a paper bag, the tweed cap
add({ id: "cheese", kind: "cheesewedge", x: -7.1, y: 0, z: 0, rot: 25 });
add({ id: "bag", kind: "paperbag", x: -6.88, y: 0, z: 0, rot: 12 });
add({ id: "cap", kind: "tweedcap", wear: "mov", fit: "mover", x: 0, y: 0, z: 0 });
// D: the coin tray at 5 and 12
add({ id: "coins", kind: "centrow", x: -9, y: 0, z: 0, count: 5 });
// E: the armful at n 2, 4, 6
add({ id: "arm", kind: "groceryarmful", x: -11, y: 0.13, z: 0, n: 2 });
// F: the heap
add({ id: "heap", kind: "bagheap", x: 1.86, y: 0, z: -1.22, grow: 0.25, seed: 1 });

const SHOTS = [
  { name: "hand goods: cash roll (1.4), grape, milk carton", len: 1, st: 0.5, cam: closeCam([-2.95, 0, 0], 0.42, 0.1) },
  { name: "egg carton closed", len: 1, st: 0.5, cam: closeCam([-5, 0, 0], 0.3, 0.04, 0.9, 0.35) },
  { name: "egg carton, rattle 0.5 (lid up, eggs hopping)", len: 1, st: 0.5, cam: closeCam([-5, 0, 0], 0.3, 0.04, 0.9, 0.35), set: (t) => actions.push({ do: "prop", id: "eggs", at: t, dur: 0, set: { rattle: 0.45 } }) },
  { name: "cheese wedge, paper bag", len: 1, st: 0.5, cam: closeCam([-7.0, 0, 0.0], 0.5, 0.1, null, 0.12) },
  { name: "tweed cap worn by the mover", len: 1, st: 0.5, cam: { pos: [-12.9, 1.0, 2.4], look: [-12.9, 0.88, 0], fov: 32 } },
  { name: "centrow count 5", len: 1, st: 0.5, cam: closeCam([-9, 0.03, 0], 0.5, 0.03, null, 0.25) },
  { name: "centrow count 12", len: 1, st: 0.5, cam: closeCam([-9, 0.03, 0], 0.5, 0.03, null, 0.25), set: (t) => actions.push({ do: "prop", id: "coins", at: t, dur: 0, set: { count: 12 } }) },
  { name: "armful n 2", len: 1, st: 0.5, cam: closeCam([-11, 0.13, 0], 0.7, 0.25, null, 0.1) },
  { name: "armful n 4", len: 1, st: 0.5, cam: closeCam([-11, 0.13, 0], 0.7, 0.25, null, 0.1), set: (t) => actions.push({ do: "prop", id: "arm", at: t, dur: 0, set: { n: 4 } }) },
  { name: "armful n 6", len: 1, st: 0.5, cam: closeCam([-11, 0.13, 0], 0.7, 0.25, null, 0.1), set: (t) => actions.push({ do: "prop", id: "arm", at: t, dur: 0, set: { n: 6 } }) },
  { name: "heap grow 0.25 (cam 08)", len: 1, st: 0.5, cam: { pos: [1.85, 1.35, 7.6], look: [1.7, 1.35, 0], fov: 34 } },
  { name: "heap grow 0.6", len: 1, st: 0.5, cam: { pos: [1.85, 1.35, 7.6], look: [1.7, 1.35, 0], fov: 34 }, set: (t) => actions.push({ do: "prop", id: "heap", at: t, dur: 0, set: { grow: 0.6 } }) },
  { name: "heap grow 1 (pocket ring)", len: 1, st: 0.5, cam: { pos: [1.85, 1.35, 7.6], look: [1.7, 1.35, 0], fov: 34 }, set: (t) => actions.push({ do: "prop", id: "heap", at: t, dur: 0, set: { grow: 1 } }) },
];
let t = 0;
for (const s of SHOTS) { s.at = r3(t); s.still = r3(t + s.st); s.set?.(s.at); t += s.len; }
// the rattle shot (3): the carton is shut again after it
actions.push({ do: "prop", id: "eggs", at: SHOTS[3].at, dur: 0, set: { rattle: 0 } });
actions.sort((a, b) => a.at - b.at);
const sb = {
  id: "bench-goods", title: "Checkout goods bench: hand props, coins, armful, bag heap", tool: "prop bench for the checkout goods (Country vs Country 01 T2), never a video", fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false,
  duration: r3(t), cleanStart: true, set: SET, music: false, sound: { sfx: 0, ambience: 0, speech: false }, creative: { length: [1, 30], notes: false },
  shots: SHOTS.map((s) => ({ at: s.at, ...s.cam })), cast: [{ id: "mov", character: "happiness/mover", at: [-12.9, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 }], props, actions, captions: [],
  notes: "Test bench, not a clip. Generated by bench/make-bench-goods.mjs (Country vs Country 01 checkout, task T2).",
};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = path.join(here, `${sb.id}.json`);
  fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n");
  console.log(path.relative(process.cwd(), f));
  console.log(`stills: ${SHOTS.map((s) => s.still).join(",")}`);
  SHOTS.forEach((s) => console.log(`  ${s.still}  ${s.name}`));
}
