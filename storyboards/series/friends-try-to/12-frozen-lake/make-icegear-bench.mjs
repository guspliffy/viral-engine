// Bench for the ice-fishing gear (engine/page/props-icegear.js, task T2 of the friends try to 12 "frozen lake" build,
// DESIGN-frozen-lake.md sections 5-7 and 9). Not a clip. One plain pale-blue set, one station per camera, 4-6 m apart:
//   gear     the six kinds, each 4 copies turned 0 / 90 / 180 / 270 degrees (from above, 30 degrees)
//   heap     gearheap at fill 0.15, 0.4, 0.7, 1; then slab 1 with slide 0.3 and 0.7 (strays: auger, anchor, bucket, 2 sinkers)
//   chip     Chip with hoodiegear at fill 1, 0.6, 0.3, 0 from the front, 3/4 and the side; the hem hint close up
//   scene    Chip + heap at fill 1 with the clip's A-close and A-mid cameras (what the clip frame shows)
//   drop     the six kinds dropped onto the floor (c.drop at 0.3): a still before and one at 3.8 s once they have settled
//   node storyboards/series/friends-try-to/12-frozen-lake/make-icegear-bench.mjs   -> icegear-bench.json + the still times
//   flock /tmp/ve-render.lock node engine/render.mjs storyboards/series/friends-try-to/12-frozen-lake/icegear-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/icegear-bench-*.png --out storyboards/series/friends-try-to/12-frozen-lake/bench/icegear-sheet.png [--width 270 for the phone sheet]
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import { GEAR } from "../../../../engine/page/props-icegear.js";

const RIG = { hand: 2, eyes: 2, hold: 2 }, MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const c = clip();
const props = [], cast = [], shots = [], stills = [];
const G = [0.76, 0.57];                                  // the heap centre from Chip's mark (design section 1)
let T = 0;
const beat = (name, cam, label, len = 1, still = null) => { shots.push([name, r3(T), cam]); c.cap(T, r3(T + len), label, 240, false, { kinetic: false }); stills.push([name, r3(T + (still ?? Math.min(0.55, len - 0.2)))]); T = r3(T + len); };

// ---- the drop first (so its physics has the whole run): six kinds in a 3 x 2 grid, dropped from 0.45 m
{
  const X = -30, SPOT = { sinker: [0, 0], fishreel: [0.55, 0], tacklebox: [1.2, 0], baittin: [0, 0.65], iceauger: [0.75, 0.65], anchor: [1.55, 0.65] };
  for (const [kind, [dx, dz]] of Object.entries(SPOT)) {
    props.push({ id: `d-${kind}`, kind, x: X + dx, y: 0.45, z: dz, rot: kind === "iceauger" ? 20 : 0, seed: 1, body: GEAR[kind].body, staged: "bench: dropped from 0.45 m at 0.3 s" });
    c.drop(0.3, `d-${kind}`);
  }
  beat("drop", frame([X + 0.78, 0.1, 0.32], { az: 0, el: 40, h: 3.9, fov: 28 }), "drop: before and settled", 4, 3.8);
  stills.splice(stills.length - 1, 0, ["drop0", 0.2]);
}

// ---- the six kinds, four sides each
const KINDS = ["sinker", "fishreel", "tacklebox", "baittin", "iceauger", "anchor"];
KINDS.forEach((kind, i) => {
  const X = 4 + i * 4, sz = Math.max(GEAR[kind].w, GEAR[kind].d), sp = sz * 0.95 + 0.03;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz2], k) => props.push({ id: `k-${kind}-${k}`, kind, x: X + sx * sp / 2 * 1.15, z: sz2 * sp / 2 * 1.15, rot: 90 * k, seed: 1, ...(kind === "sinker" && { shape: ["pear", "pear", "ball", "coin"][k] }) }));
  const ext = 2 * sp * 1.15 + 0.05;
  beat(`k-${kind}`, frame([X, GEAR[kind].h * 0.3, 0], { az: 0, el: 32, h: Math.max(0.5, ext * 1.75), fov: 28 }), `${kind}: rot 0, 90, 180, 270`);
});

// ---- the heap
[0.15, 0.4, 0.7, 1].forEach((fill, i) => {
  const X = 40 + i * 4;
  props.push({ id: `h-${i}`, kind: "gearheap", x: X, z: 0, seed: 7, fill });
  beat(`h-fill-${fill}`, frame([X, 0.18, 0], { az: 25, el: 22, h: 1.15, fov: 28 }), `gearheap fill ${fill}`);
});
{
  const X = 40 + 4 * 4 + 40;                    // x 96: Chip's mark is at X - G.x ... the heap sits at G in world coordinates shifted by X0
  const strayList = (X0) => [["iceauger", X0 + 0.55, 0.0, 0.9, 200, 1], ["anchor", X0 + 0.80, 0.30, 0.52, 35, 1], ["bucket", X0 + 1.12, 0.0, 1.05, 0, 1], ["sinker", X0 + 0.30, 0, 1.0, 40, 3], ["sinker", X0 + 1.2, 0, 0.55, 90, 5]];
  [0.3, 0.7].forEach((sl, i) => {
    const X0 = 70 + i * 6;                      // Chip's mark of this station; the heap at X0 + 0.76, 0.57
    props.push({ id: `s-${i}`, kind: "gearheap", x: X0 + G[0], z: G[1], seed: 7, fill: 1, slab: 1, slide: sl, staged: "bench: the heap is tipped under the floor on purpose", pivot: [[-0.01 + X0, 1.18], [1.07 + X0, -0.26]], strays: strayList(X0) });
    beat(`h-slide-${sl}`, frame([X0 + G[0], 0.1, G[1]], { az: 20, el: 30, h: 1.5, fov: 28 }), `gearheap slab 1 slide ${sl}`);
  });
  void X;
}

// ---- Chip with hoodiegear at four fills, three views each
const CHIP = (id, x, seed) => ({ id, character: "potatobrawl/chip", at: [x, 0], face: 0, expr: "kind", follow: 0.2, seed });
[1, 0.6, 0.3, 0].forEach((fill, i) => {
  const X = 100 + i * 4, id = `chip${i}`;
  cast.push(CHIP(id, X, 3 + i)); props.push({ id: `hg-${i}`, kind: "hoodiegear", wear: id, x: 0, y: 0, z: 0, fill });
  for (const [az, nm] of [[0, "front"], [38, "3q"], [85, "side"]]) beat(`chip-${fill}-${nm}`, frame([X, 0.33, 0], { az, el: 10, h: 1.0, fov: 28 }), `hoodiegear fill ${fill}: ${nm}`);
  beat(`chip-${fill}-close`, frame([X, 0.24, 0], { az: 30, el: 22, h: 0.62, fov: 28 }), `hoodiegear fill ${fill}: close, from above`);
  if (fill === 1) beat("chip-hem", frame([X + 0.1, 0.2, 0.1], { az: 40, el: 6, h: 0.45, fov: 28 }), "hoodiegear fill 1: the hem hint");
});
// extra fills where the patch is thinnest, front-ish
[0.9, 0.86, 0.1, 0.03].forEach((fill, i) => {
  const X = 118 + i * 4, id = `chipx${i}`;
  cast.push(CHIP(id, X, 9 + i)); props.push({ id: `hgx-${i}`, kind: "hoodiegear", wear: id, x: 0, y: 0, z: 0, fill });
  beat(`chip-x${fill}`, frame([X, 0.26, 0], { az: 30, el: 16, h: 0.8, fov: 28 }), `hoodiegear fill ${fill}: 3/4`);
});

// ---- the clip frame: Chip + heap at G, A-close and A-mid
{
  const X = 135;
  cast.push(CHIP("chipS", X, 17)); props.push({ id: "hgS", kind: "hoodiegear", wear: "chipS", x: 0, y: 0, z: 0, fill: 1 }, { id: "hS", kind: "gearheap", x: X + G[0], z: G[1], seed: 7, fill: 1 });
  beat("scene-A-close", { pos: [X + 0.25, 0.75, 2.5], look: [X + 0.25, 0.38, 0], fov: 40 }, "A-close: Chip and the heap at fill 1");
  beat("scene-A-mid", { pos: [X + 0.55, 1.5, 4.5], look: [X + 0.45, 0.4, -0.5], fov: 54 }, "A-mid: Chip and the heap at fill 1");
}
const END = r3(T + 0.1);
for (const w of cast) c.A(0, w.id, "look", { to: [0, 0.1], dur: 0.01, blink: false });
console.log("stills:", stills.map(([, t]) => t).join(","));
console.log("names:", stills.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "icegear-bench", title: "Ice gear bench", idea: "Props bench for friends try to 12 (the six gear kinds, gearheap, hoodiegear), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: true,
  set: { type: "plain", color: "#c9d6ee", floor: "#a9bde0" }, music: false, sound: { auto: false },
  hook: { show: ["chip0"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by make-icegear-bench.mjs (props bench, no reviews).",
});
