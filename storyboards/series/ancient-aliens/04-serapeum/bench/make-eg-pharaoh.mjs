// Bench for the Pharaoh and the Memphis priests (engine/page/costumes-pharaoh.js, task T1 of ../briefs/T1.md): one group per camera on the plain
// base set, wide frame, 40 m apart so each camera sees only its own group. Not a clip. Each shot is one beat; the still is 0.55 s in.
// Spud (0.88 m) stands 1.2 m clear of the Pharaoh in A for scale.
//   A front, Spud beside him   B three-quarter   C side (his left)   D face close-up   E eyes slide sideways (panel 06)   F cough into the right hand (panel 23)
//   G arms spread wide, palms to camera (panel 24)   H from behind   I the priests and a worker, front   J the priests, three-quarter   K hand close-up
//   node storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-pharaoh.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/04-serapeum/bench/eg-pharaoh.json --stills <times> --draft --out out/eg-pharaoh
//   node qa/contact.mjs out/eg-pharaoh/eg-pharaoh-*.png --out storyboards/series/ancient-aliens/04-serapeum/bench/eg-pharaoh-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
const G = Object.fromEntries(KEYS.map((k, i) => [k, [i * 40, i * 40]]));
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const cast = [], SHOTS = [];
const PH = (g, x, z, face = 0) => ({ id: "ph" + g, character: "ancient-aliens/pharaoh", at: at(g, x, z), face, expr: "deadpan", follow: 0.2, seed: 4.1 });
const SPUD = (g, x, z, face = 0) => ({ id: "spud" + g, character: "potatobrawl/spud", at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 2.1 });
const CH = (id, character, g, x, z, face = 0) => ({ id, character, at: at(g, x, z), face, expr: "kind", follow: 0.2, seed: 5.5 });
const cam = (g, p, l, f = 30) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
const view = (g, tgt, az, h, el = 0, f = 28) => {
  const a = az * Math.PI / 180, e = el * Math.PI / 180, d = h / 2 / Math.tan(f * Math.PI / 360);
  return cam(g, [tgt[0] + Math.sin(a) * Math.cos(e) * d, tgt[1] + Math.sin(e) * d, tgt[2] + Math.cos(a) * Math.cos(e) * d], tgt, f);
};
const shot = (name, cm, label, set) => SHOTS.push({ name, cm, label, set });
// poses (reported in the costume file's header)
const COUGH = { o: [-0.34, 0.455, 0.35], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } };
const SPREAD_L = { o: [0.3, 0.3, 0.12], frame: { y: [0, 0.4, 0.9], z: [0, 1, 0] } }, SPREAD_R = { o: [0.3, 0.3, 0.12], frame: { y: [0, 0.4, 0.9], z: [0, 1, 0] } };

cast.push(PH("A", 0, 0), SPUD("A", -1.4, 0.2));
shot("A", view("A", [-0.7, 0.55, 0], 0, 1.7, 3, 30), "A front, Spud beside him for scale");
cast.push(PH("B", 0, 0));
shot("B", view("B", [0, 0.56, 0], 38, 1.35, 5, 30), "B three-quarter");
cast.push(PH("C", 0, 0));
shot("C", view("C", [0, 0.56, 0], 90, 1.35, 3, 30), "C side (his left)");
cast.push(PH("D", 0, 0));
shot("D", view("D", [0, 0.74, 0.2], 0, 0.62, 0, 30), "D face close-up: kohl lids, raised brow, thin mouth, plait under the chin");
cast.push(PH("E", 0, 0));
shot("E", view("E", [0, 0.72, 0.2], 0, 0.78, 0, 30), "E eyes slide sideways (look 0.7, lids 0.47)", (t) => {
  c.A(t, "phE", "look", { to: [0.7, 0], dur: 0.01 }); c.A(t, "phE", "face", { lidL: 0.47, lidR: 0.47, dur: 0.01 });
});
cast.push(PH("F", 0, 0));
shot("F", view("F", [0, 0.62, 0.15], 20, 0.9, 4, 30), "F cough into the right wrapped hand", (t) => {
  c.arm(t, "phF", "R", COUGH, 0.01);
  c.A(t, "phF", "face", { lidL: 1, lidR: 1, browL: -0.3, browR: -0.3, dur: 0.01 });
});
cast.push(PH("G", 0, 0));
shot("G", view("G", [0, 0.55, 0.1], 0, 1.5, 3, 30), "G arms spread wide, palms to the camera", (t) => {
  c.arm(t, "phG", "L", SPREAD_L, 0.01); c.arm(t, "phG", "R", SPREAD_R, 0.01);
  c.A(t, "phG", "grip", { side: "L", shape: "open", dur: 0.01 }); c.A(t, "phG", "grip", { side: "R", shape: "open", dur: 0.01 });
});
cast.push(PH("H", 0, 0));
shot("H", view("H", [0, 0.56, 0], 180, 1.35, 4, 30), "H from behind: nemes tail, bands, free ends");
cast.push(CH("wkI", "ancient-aliens/worker-a", "I", -1.5, 0.1), CH("prI1", "ancient-aliens/priest", "I", -0.5, 0), CH("prI2", "ancient-aliens/priest", "I", 0.5, 0), CH("plI", "ancient-aliens/priest-leopard", "I", 1.5, 0));
shot("I", view("I", [0, 0.45, 0], 0, 2.4, 3, 30), "I a worker, two priests, the leopard priest");
cast.push(CH("wkJ", "ancient-aliens/worker-a", "J", -1.5, 0.1, 30), CH("prJ1", "ancient-aliens/priest", "J", -0.5, 0, 30), CH("plJ", "ancient-aliens/priest-leopard", "J", 0.7, 0, 30));
shot("J", view("J", [-0.2, 0.42, 0], 38, 1.9, 4, 30), "J worker, priest, leopard priest: three-quarter");
cast.push(PH("K", 0, 0));
shot("K", view("K", [0, 0.4, 0.4], 0, 0.95, 3, 30), "K hands and wraps close: right fist, left point", (t) => {
  c.arm(t, "phK", "R", { o: [-0.2, 0.3, 0.5] }, 0.01); c.arm(t, "phK", "L", { o: [0.15, 0.3, 0.5] }, 0.01);
  c.A(t, "phK", "grip", { side: "R", shape: "fist", dur: 0.01 }); c.A(t, "phK", "grip", { side: "L", shape: "point", dur: 0.01 });
});

SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); if (s.set) s.set(s.T); c.cap(s.T, s.T + 0.9, s.label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s.name).join(","));
write(import.meta.url, {
  id: "eg-pharaoh", title: "Pharaoh bench", idea: "Cast bench for the Pharaoh and the Memphis priests (T1), not a clip",
  frame: "wide", far: 900, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["phA", "spudA"], hint: 0, what: "engine test" },
  cast, props: [], captions: c.captions, beats: c.beats(SHOTS.map((s) => [s.name, s.T, s.cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-pharaoh.mjs (cast bench, no reviews).",
});
