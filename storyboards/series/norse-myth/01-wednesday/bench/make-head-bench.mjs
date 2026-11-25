// Norse myth 01 head bench (task T-C, 22 Nov 2026): the kind `norsehead` of engine/page/props-norse-head.js at DESIGN section C sizes. Not a clip, no cast.
// The "pool" is the set floor in water blue at y 0 (the head's origin is the water line). One shot per state, 1.0 s each, the still is 0.5 s in:
//   rise: rise0 (ferns 0.05 under) / rise50 / rise70 (eyes shut) / rise85 (eyes opening, beard surfacing) / front / three4 / low05 (a low angle like panel 05)
//   turns: turnL turnR (120 degrees each way) / turnMid (0.5, the beard wraps) / turnTop (from above: the beard fan and the wrap)
//   squint (panel 19): squintF squintW (a frame 2.2 m wide) squint34;  talk: talk0 talk5 talk10 (speak 0 / 0.5 / 1) + talkW
//   eyes: eyeL eyeGlow (glow 1.2, lids 0.1);  beard: beardTop;  count views: sideL sideR back crown, brow, hang (roots), life (snail), mush, shed, nod, lean
//   node storyboards/series/norse-myth/01-wednesday/bench/make-head-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/norse-myth/01-wednesday/bench/head-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-head
//   node qa/contact.mjs /tmp/claude-0/bench-head/head-bench-*.png --out storyboards/series/norse-myth/01-wednesday/bench/head-sheet.png
import { clip, frame, write } from "../../../../lib/clip.mjs";
import { headCounts, headMeasure } from "../../../../../engine/page/props-norse-head.js";

const c = clip();
const BASE = { rise: 1, shed: 0, lids: 0.35, glow: 0.6, lookX: 0, lookY: 0, turn: 0, turnTo: 9, speak: 0, squint: 0, nod: 0, lean: 0 };
const props = [{ id: "h", kind: "norsehead", x: 0, y: 0, z: 0, rot: 0, at: [0, 0.1, 1.6], ...BASE }];
const ONLY = process.argv.slice(2);
const shots = [];
const shot = (name, over, cam) => { if (!ONLY.length || ONLY.includes(name)) shots.push([name, over, cam]); };
const T = [0, 0.8, 0.35];
shot("p05", {}, frame([0, 0.62, 0.5], { az: 8, el: -3, h: 2.5, fov: 24 }));
shot("p19", { squint: 1 }, frame([0, 0.6, 0.6], { az: 0, el: 2, h: 2.4, fov: 24 }));
shot("rise0", { rise: 0 }, frame([0, 0.2, 0.4], { az: 25, el: 14, h: 3.4, fov: 24 }));
shot("rise50", { rise: 0.5 }, frame([0, 0.5, 0.4], { az: 20, el: 8, h: 3.6, fov: 24 }));
shot("rise70", { rise: 0.7 }, frame([0, 0.7, 0.4], { az: 20, el: 6, h: 3.6, fov: 24 }));
shot("rise85", { rise: 0.85 }, frame([0, 0.75, 0.4], { az: 20, el: 6, h: 3.8, fov: 24 }));
shot("front", {}, frame(T, { az: 0, el: 5, h: 3.9, fov: 24 }));
shot("three4", {}, frame(T, { az: 38, el: 8, h: 3.9, fov: 24 }));
shot("low05", {}, frame([0, 0.95, 0.3], { az: 12, el: -2, h: 3.6, fov: 24 }));
shot("turnL", { turn: 1, turnTo: 1 }, frame(T, { az: 20, el: 8, h: 3.9, fov: 24 }));
shot("turnR", { turn: -1, turnTo: -1 }, frame(T, { az: -20, el: 8, h: 3.9, fov: 24 }));
shot("turnMid", { turn: 0.5, turnTo: 1 }, frame(T, { az: 0, el: 10, h: 3.9, fov: 24 }));
shot("turnTop", { turn: 0.5, turnTo: 0.5 }, frame([0, 0.1, 0.4], { az: 0, el: 62, h: 4.2, fov: 24 }));
shot("squintF", { squint: 1 }, frame([0, 0.62, 0.7], { az: 0, el: 4, h: 2.4, fov: 22 }));
shot("squintW", { squint: 1 }, frame([0, 0.55, 0.6], { az: 0, el: 6, h: 3.9, fov: 24 }));
shot("squint34", { squint: 1 }, frame([0.1, 0.62, 0.6], { az: 36, el: 6, h: 1.9, fov: 22 }));
shot("talk0", {}, frame([0, 0.24, 0.72], { az: 0, el: 6, h: 1.3, fov: 22 }));
shot("talk5", { speak: 0.5 }, frame([0, 0.24, 0.72], { az: 0, el: 6, h: 1.3, fov: 22 }));
shot("talk10", { speak: 1 }, frame([0, 0.24, 0.72], { az: 0, el: 6, h: 1.3, fov: 22 }));
shot("talkW", { speak: 1 }, frame(T, { az: 22, el: 6, h: 3.9, fov: 24 }));
shot("eyeL", { lids: 0.0, lookX: 0.8, lookY: 0.3, glow: 1 }, frame([0.42, 0.64, 0.7], { az: 0, el: 3, h: 0.7, fov: 20 }));
shot("eyeGlow", { glow: 1.2, lids: 0.1 }, frame([0, 0.62, 0.7], { az: 0, el: 3, h: 1.5, fov: 22 }));
shot("beardTop", {}, frame([0, 0, 0.5], { az: 0, el: 74, h: 3.4, fov: 24 }));
shot("sideL", {}, frame([0, 0.6, 0], { az: 90, el: 4, h: 3.2, fov: 24 }));
shot("sideR", {}, frame([0, 0.6, 0], { az: -90, el: 4, h: 3.2, fov: 24 }));
shot("back", {}, frame([0, 0.6, 0], { az: 180, el: 6, h: 3.4, fov: 24 }));
shot("crown", {}, frame([0, 1.2, 0], { az: 25, el: 48, h: 2.4, fov: 22 }));
shot("brow", {}, frame([0.3, 0.74, 0.6], { az: 28, el: 6, h: 1.1, fov: 20 }));
shot("hang", {}, frame([0.85, 0.65, 0.05], { az: 80, el: 4, h: 1.6, fov: 20 }));
shot("life", {}, frame([0.75, 0.86, 0.15], { az: 80, el: 8, h: 0.34, fov: 14 }));
shot("mush", {}, frame([-0.76, 0.9, 0.12], { az: -80, el: 8, h: 0.3, fov: 14 }));
shot("shed", { shed: 1 }, frame(T, { az: 18, el: 8, h: 3.9, fov: 24 }));
shot("nod", { nod: 1, lean: 1 }, frame(T, { az: 60, el: 6, h: 3.9, fov: 24 }));

const beats = []; let t = 0; const stills = [];
for (const [name, over, cam] of shots) { c.prop(t, "h", { ...BASE, ...over }, 0); stills.push(Math.round((t + 0.5) * 100) / 100); beats.push([name, t, cam]); t += 1; }
const sb = {
  id: "head-bench", title: "Norse myth 01 head bench", idea: "Engine look bench for the norsehead prop (task T-C), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#2a4f5c", floor: "#2f9fc6", light: "golden", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats(beats, t),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-head-bench.mjs (engine bench, no story).",
};
write(import.meta.url, sb);
console.log("stills:", stills.join(","));
console.error("counts:", JSON.stringify(headCounts()));
console.error("measure:", JSON.stringify(headMeasure()));
