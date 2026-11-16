// Bench for Plato (engine/page/costumes-plato.js, characters/ancient-aliens/plato.json, task T6 of ../briefs/T6.md): one group per camera on the plain
// base set (blue-grey backdrop, shadow floor), wide frame (1920 x 1080), far 900 (BOARD section 1). Not a clip. Each shot is one beat; the still is 0.55 s in.
// Spud (0.88 m) stands 1.4 m from Plato in A for scale (1.2 m clear of anything else).
//   A   front, Spud beside him      A2 front, whole body close      B   three-quarter      C   side (his left)      D   seated at a 0.72 desk, writing, right hand forward
//   D2  seated, looking up          E   the wink with the finger at his lips, close      E2  the same from three-quarter      F   from behind (hair down the back)
//   G   head close, neutral         H   from behind his left: the himation's thrown end down the back, the draped sleeve
//   node storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-plato.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-plato.json --stills <times> --draft --out out/at-plato
//   node qa/contact.mjs out/at-plato/at-plato-*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-plato-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const KEYS = ["A", "A2", "B", "C", "D", "D2", "E", "E2", "F", "G", "H"];
const G = Object.fromEntries(KEYS.map((k, i) => [k, [i * 40, i * 40]]));
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const cast = [], props = [], SHOTS = [];
const PLATO = (g, x, z, face = 0) => ({ id: "plato" + g, character: "ancient-aliens/plato", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 4.1 });
const SPUD = (g, x, z, face = 0) => ({ id: "spud" + g, character: "potatobrawl/spud", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 2.1 });
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const cam = (g, p, l, f = 30) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
const view = (g, tgt, az, h, el = 0, f = 28) => {
  const a = az * Math.PI / 180, e = el * Math.PI / 180, d = h / 2 / Math.tan(f * Math.PI / 360);
  return cam(g, [tgt[0] + Math.sin(a) * Math.cos(e) * d, tgt[1] + Math.sin(e) * d, tgt[2] + Math.cos(a) * Math.cos(e) * d], tgt, f);
};
const shot = (name, cm, label, set) => SHOTS.push({ name, cm, label, set });
// poses (reported to the director): the right hand's finger at his lips, the right hand writing, the wink
const LIPS = { o: [-0.37, 0.4, 0.56], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } }, WRITE = { o: [-0.2, 0.283, 0.68] }, REST_L = { o: [-0.12, 0.283, 0.5] };

// A: front with Spud at his right (screen left), both facing the camera
cast.push(PLATO("A", 0, 0), SPUD("A", -1.4, 0.2));
shot("A", view("A", [-0.65, 0.55, 0], 0, 1.7, 3, 30), "A front, Spud beside him for scale (Plato taller, broader)");
// A2: whole body, nearer
cast.push(PLATO("A2", 0, 0));
shot("A2", view("A2", [0, 0.58, 0], 0, 1.35, 3, 30), "A2 front: himation, sleeves, hem 0.05 off the floor");
// B: three-quarter
cast.push(PLATO("B", 0, 0, 0));
shot("B", view("B", [0, 0.58, 0], 38, 1.35, 5, 30), "B three-quarter");
// C: side, his left towards the camera
cast.push(PLATO("C", 0, 0, 0));
shot("C", view("C", [0, 0.58, 0], 90, 1.35, 3, 30), "C side (his left)");
// D: seated at a 0.72 desk (a plain crate, the engine's box), writing: right hand forward on the desk
cast.push(PLATO("D", 0, 0, 0));
props.push(P("chairD", "chair", "D", 0, 0, { rot: 0 }), P("deskD", "table", "D", 0, 0.9, { scale: 1.16 }));
shot("D", view("D", [0, 0.8, 0.3], 14, 1.5, 6, 30), "D seated at the 0.72 desk, writing (right hand forward)", (t, g) => {
  c.A(t, "platoD", "sit", { seat: "chairD", dur: 0.01, hands: "keep" });
  c.arm(t, "platoD", "R", WRITE, 0.01); c.arm(t, "platoD", "L", REST_L, 0.01);
  c.A(t, "platoD", "look", { to: [0, -0.4], dur: 0.01 });
});
cast.push(PLATO("D2", 0, 0, 0));
props.push(P("chairD2", "chair", "D2", 0, 0, { rot: 0 }), P("deskD2", "table", "D2", 0, 0.9, { scale: 1.16 }));
shot("D2", view("D2", [0, 0.95, 0.2], 0, 1.1, 3, 30), "D2 seated, looking up at the camera, hands on the desk", (t) => {
  c.A(t, "platoD2", "sit", { seat: "chairD2", dur: 0.01, hands: "keep" }); c.A(t, "platoD2", "noblink");
  c.arm(t, "platoD2", "R", WRITE, 0.01); c.arm(t, "platoD2", "L", REST_L, 0.01);
});
// E: the wink, finger at his lips, close
cast.push(PLATO("E", 0, 0, 0));
shot("E", view("E", [0, 0.64, 0.25], 0, 0.95, 4, 30), "E the wink (his left eye) with the finger at his lips", (t) => {
  c.arm(t, "platoE", "R", LIPS, 0.01);
  c.A(t, "platoE", "grip", { side: "R", shape: "point", dur: 0.01 });
  c.A(t, "platoE", "face", { lidL: 1, browL: -0.45, cornerL: 0.5, lidR: 0.15, browR: 0.35, dur: 0.01 });   // panel 47: the open eye wide, its brow up
});
cast.push(PLATO("E2", 0, 0, 0));
shot("E2", view("E2", [0, 0.62, 0.2], 30, 1.1, 8, 30), "E2 the same, three-quarter", (t) => {
  c.arm(t, "platoE2", "R", LIPS, 0.01);
  c.A(t, "platoE2", "grip", { side: "R", shape: "point", dur: 0.01 });
  c.A(t, "platoE2", "face", { lidL: 1, browL: -0.45, cornerL: 0.5, dur: 0.01 });
});
// F: from behind
cast.push(PLATO("F", 0, 0, 0));
shot("F", view("F", [0, 0.58, 0], 180, 1.35, 4, 30), "F from behind: the hair down the back, the robe");
// G: head close, neutral
cast.push(PLATO("G", 0, 0, 0));
shot("G", view("G", [0, 0.72, 0.2], 0, 0.75, 0, 30), "G head close, neutral: hair, brows, lines under the eyes, moustache and beard");
// H: the left shoulder from behind his left: the thrown end down the back, the draped sleeve, the hand raised
cast.push(PLATO("H", 0, 0, 0));
shot("H", view("H", [0.15, 0.55, -0.05], 128, 1.3, 10, 30), "H from behind his left: the thrown end down the back, the draped sleeve", (t) => {
  c.arm(t, "platoH", "L", { o: [0.14, 0.34, 0.55] }, 0.01);
});

SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); if (s.set) s.set(s.T); c.cap(s.T, s.T + 0.9, s.label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s.name).join(","));
write(import.meta.url, {
  id: "at-plato", title: "Plato bench", idea: "Cast bench for Plato (the old potato philosopher, T6), not a clip",
  frame: "wide", far: 900, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["platoA", "spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map((s) => [s.name, s.T, s.cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-plato.mjs (cast bench, no reviews).",
});
