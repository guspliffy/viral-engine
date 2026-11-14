// Bench for the Stonehenge small things (engine/page/props-sh-items.js, task S4 of ../briefs/S4.md): one group per camera on the plain base set
// (blue-grey backdrop, shadow floor). Wide frame (1920 x 1080) with the 700 m far plane of the episode. Not a clip. Each shot is one beat; the
// still is 0.55 s in. Spud (0.88 m) stands 1.5 m from the sheep for scale (1.2 m clear of anything else).
//   A   sheep standing, side (chew 0)      A2 chew 0.5 with grass in the mouth, head 3/4      A3 grazing      A4 lying
//   A5  head turned to the camera (headY 1)    A6 the 200 px test: the sheep 200 px tall beside Spud    A7 face close    A8 from the front
//   B   crow on a 1 m box, wings 0   B2 wings 1   B3 caw   B4 head close   B5 hop
//   C   bobblehat + scarf on Chip, Wedge, Mash (three colours) and the hat on Spud: front, side, close
//   D   ropeline arc with a shuttlebus 25 m behind it
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-items.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-items.json --stills <times> --draft --out out/sh-items
//   node qa/contact.mjs out/sh-items/sh-items-*.png --out storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-items-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
// group origins [x, z]: far apart on a diagonal so no camera looks at another group's pieces
const G = { A: [0, 0], A2: [800, 800], A3: [1600, 1600], A4: [2400, 2400], A5: [3200, 3200], A6: [4000, 4000], A7: [4800, 4800], A8: [5600, 5600], B: [6400, 6400], B2: [7200, 7200], B3: [8000, 8000], B4: [8800, 8800], B5: [9600, 9600], C: [10400, 10400], C2: [11200, 11200], C3: [12000, 12000], C4: [12800, 12800], C5: [13600, 13600], C6: [14400, 14400], C7: [15200, 15200], D: [16000, 16000], D2: [16800, 16800], D3: [17600, 17600] };
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const SPUD = (id, g, x, z, face, seed = 2.1) => ({ id, character: "potatobrawl/spud", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed });
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const cast = [], props = [];
const cam = (g, p, l, f = 28) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
// a camera by az / el / visible height h at a target in the group
const view = (g, tgt, az, h, el = 0, f = 28) => {
  const a = az * Math.PI / 180, e = el * Math.PI / 180, d = h / 2 / Math.tan(f * Math.PI / 360);
  return cam(g, [tgt[0] + Math.sin(a) * Math.cos(e) * d, tgt[1] + Math.sin(e) * d, tgt[2] + Math.cos(a) * Math.cos(e) * d], tgt, f);
};
let T = 0;
const SHOTS = [];
const shot = (name, set, cm, label) => SHOTS.push([name, set, cm, label]);

// ---------------------------------------------------------------- A: the sheep (origin between its feet, facing +z; Spud 1.5 m to its left at x +1.5)
// [group, sheep params, camera az, Spud's side offset (m, screen right +) so he stands beside the sheep and out of a close frame]
const AZ = { A: 90, A2: 40, A3: 70, A4: 55, A5: 25, A6: 90, A7: 0, A8: 0 };
for (const [g, extra, off] of [["A", {}, 0], ["A2", { chew: 0.5, grass: true }, -1.6], ["A3", { graze: 1 }, -1.8], ["A4", { lie: 1 }, -1.8], ["A5", { headY: 1 }, -1.6], ["A6", {}, 0], ["A7", { chew: 0.5, grass: true }, -1.6], ["A8", { grass: true }, 1.5]]) {
  props.push(P("sheep" + g, "sheep", g, 0, 0, { rot: 0, ...extra }));
  const a = AZ[g] * Math.PI / 180;
  if (g === "A" || g === "A6") cast.push(SPUD("spud" + g, g, 0.3, 1.75, 90));   // side view: Spud in front of the sheep's nose (screen left)
  else cast.push(SPUD("spud" + g, g, r3(Math.cos(a) * off), r3(-Math.sin(a) * off + 0.3), AZ[g]));
}
shot("A", () => {}, view("A", [0, 0.42, 0.55], 90, 2.1), "A sheep standing: side, chew 0, Spud 1.5 m beside it");
shot("A2", () => {}, view("A2", [0, 0.55, 0.3], 40, 1.0), "A2 chew 0.5, grass in the mouth: 3/4");
shot("A3", () => {}, view("A3", [0, 0.4, 0.2], 70, 1.3), "A3 grazing (graze 1)");
shot("A4", () => {}, view("A4", [0.2, 0.3, 0.1], 55, 1.4), "A4 lying (lie 1)");
shot("A5", () => {}, view("A5", [0, 0.5, 0.2], 25, 1.2), "A5 head turned to the camera (headY 1)");
shot("A6", () => {}, view("A6", [0, 0.5, 0.7], 90, 4.0), "A6 the 200 px test: the sheep 200 px tall beside Spud");
shot("A7", () => {}, view("A7", [0, 0.55, 0.65], 0, 0.55, 0, 24), "A7 face close, front: eyes, nose, ears, grass");
shot("A8", () => {}, view("A8", [0.75, 0.45, 0.2], 0, 2.1), "A8 from the front, Spud facing the camera beside it");

// ---------------------------------------------------------------- B: the crow on a 1 m box (the box is the pilot's wooden crate, size 1: the only box the engine has), Spud 1.2 m beside it
for (const g of ["B", "B2", "B3", "B4", "B5"]) {
  props.push(P("box" + g, "crate", g, 0, 0, { size: 1 }), P("crow" + g, "crow", g, 0, 0, { y: 1, rot: 0 }));
  cast.push(SPUD("spud" + g, g, -1.8, 0.2, 60)); void 0;
}
shot("B", () => {}, view("B", [0, 1.14, 0], 70, 0.7, 6), "B crow perched on a 1 m box, wings 0 (folded)");
shot("B2", (c) => c.prop(T, "crowB2", { wings: 1 }, 0), view("B2", [0, 1.1, -0.05], 20, 0.9, 55), "B2 wings 1 (spread, landing)");
shot("B3", (c) => c.prop(T, "crowB3", { caw: 0.9 }, 0), view("B3", [0, 1.16, 0.05], 80, 0.5, 5), "B3 caw 0.9: beak open, body dips");
shot("B4", () => {}, view("B4", [0, 1.2, 0.05], 50, 0.4, 8), "B4 head close: beak, eye, bristles, sheen on the wing");
shot("B5", (c) => c.prop(T, "crowB5", { hop: 0.5 }, 0), view("B5", [0, 1.22, 0], 90, 0.7), "B5 hop 0.5 (the top of the hop)");

// ---------------------------------------------------------------- C: bobblehat + scarf on Chip (red), Wedge (blue), Mash (yellow), the hat alone on Spud
{
  const WHO = [["chip", "#c23b3b", -1.1], ["wedge", "#2f6fb0", 0.0], ["mash", "#e0b030", 1.15]];
  for (const g of ["C", "C2", "C3", "C4", "C5"]) {
    for (const [who, col, x] of WHO) {
      cast.push({ id: who + g, character: "potatobrawl/" + who, at: at(g, x, 0), face: 0, expr: "kind", follow: 0.2, seed: 3 });
      props.push({ id: "hat" + who + g, kind: "bobblehat", wear: who + g, fit: "potatobrawl/" + who, x: 0, y: 0, z: 0, color: col, pom: "#f4f1e6" });
      props.push({ id: "scarf" + who + g, kind: "scarf", wear: who + g, fit: "potatobrawl/" + who, x: 0, y: 0, z: 0, color: col === "#e0b030" ? "#c23b3b" : col === "#c23b3b" ? "#2f6fb0" : "#e0b030", stripe: who === "wedge" ? "#f4f1e6" : null });
    }
  }
  for (const g of ["C6", "C7"]) {
    cast.push({ id: "spud" + g, character: "potatobrawl/spud", at: at(g, 0, 0), face: 0, expr: "kind", follow: 0.2, seed: 2.1 });
    props.push({ id: "hatspud" + g, kind: "bobblehat", wear: "spud" + g, fit: "potatobrawl/spud", x: 0, y: 0, z: 0, color: "#c23b3b" });
  }
  shot("C", () => {}, view("C", [0, 0.62, 0], 0, 1.8, 6, 30), "C hat + scarf on Chip, Wedge, Mash: front");
  shot("C2", () => {}, view("C2", [0, 0.62, 0], 90, 1.8, 6, 30), "C2 the same from the side (the wearer's left)");
  shot("C3", () => {}, view("C3", [-0.3, 0.8, 0], 40, 1.2, 14, 30), "C3 3/4 from above: slit, pom-pom, leaf (Chip and Wedge)");
  shot("C4", () => {}, view("C4", [0.6, 0.82, 0], 35, 1.3, 10, 30), "C4 Wedge and Mash close, 3/4");
  shot("C5", () => {}, view("C5", [0, 0.62, 0], 180, 1.8, 6, 30), "C5 from behind");
  shot("C6", () => {}, view("C6", [0, 0.75, 0], 0, 1.2, 4, 26), "C6 the hat on Spud: front");
  shot("C7", () => {}, view("C7", [0, 0.75, 0], 70, 1.2, 8, 26), "C7 the hat on Spud: side, the leaf in the slit");
}

// ---------------------------------------------------------------- D: the visitors' rope (arc r 36, +-60 deg) with the shuttle bus 25 m behind it (r 61), Spud inside the rope
for (const g of ["D", "D2", "D3"]) {
  props.push(P("rope" + g, "ropeline", g, 0, 0, { arc: [36, -60, 60] }), P("bus" + g, "shuttlebus", g, 0, 61, { rot: g === "D3" ? 90 : 160 }));
  cast.push(SPUD("spud" + g, g, g === "D2" ? 1.4 : 1.5, g === "D2" ? 34.1 : 34.4, g === "D2" ? 200 : 180));
}
shot("D", () => {}, cam("D", [-9, 1.5, 24], [4, 1.5, 58], 40), "D ropeline arc r 36 with the shuttlebus 25 m behind it, Spud inside the rope");
shot("D2", () => {}, cam("D2", [-2.2, 0.75, 29.8], [0.4, 0.45, 36], 36), "D2 the rope close: posts, sag, twist, grass at the feet");
shot("D3", () => {}, cam("D3", [14, 1.6, 52], [0, 1.6, 61], 40), "D3 the bus close, 3/4 (side with the door)");

const END_PLACEHOLDER = 0;
void END_PLACEHOLDER;
SHOTS.forEach(([name, set, cm, label], i) => { T = r3(0.1 + i * 1.0); set(c); SHOTS[i] = [name, T, cm]; c.cap(T, T + 0.9, label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));

write(import.meta.url, {
  id: "sh-items", title: "Stonehenge small things bench", idea: "Props bench for the Stonehenge small things (sheep, crow, bobblehat, scarf, ropeline, shuttlebus), not a clip",
  frame: "wide", far: 700, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["spudA", "sheepA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS, END),
  notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-items.mjs (props bench, no reviews).",
});
