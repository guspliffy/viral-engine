// Norse myth 01 Odin bench (task T-A, 22 Nov 2026): costume `odin` (engine/page/costumes-odin.js, characters/norse-myth/odin.json) and
// kind `odinspear` (engine/page/props-norse-spear.js). Not a clip, no story. One still per beat (1.2 s a beat, the still is 0.9 s in).
// Usage: node storyboards/series/norse-myth/01-wednesday/bench/make-odin-bench.mjs [only-beat-names...]
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/odin-bench.json --stills <times printed> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/odin-bench-*.png --out <this dir>/odin-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const ONLY = process.argv.slice(2);
const OX = -0.45, SX = 0.45;   // Odin at 0; Spud beside him for the height
const shots = [];
let T = 0;
const cam = (x, y, z, lx, ly, lz, fov) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
const beat = (name, camera, acts = () => {}) => { if (ONLY.length && !ONLY.includes(name)) return; acts(T); shots.push([name, T, camera]); T += 1.2; };

for (const w of ["odin", "spud"]) { A(0, w, "noblink"); c.arm(0, w, "R", "rest", 0.01); c.arm(0, w, "L", "rest", 0.01); }
const turn = (t, to, who = "odin") => A(t, who, "turn", { to, dur: 0.01 });
const face = (t, expr, set = {}, extra = {}) => { A(t, "odin", "expr", { expr, ...(Object.keys(set).length && { set }), dur: 0.01 }); if (extra.face) A(t, "odin", "face", { ...extra.face, dur: 0.01 }); };

const EY = (x, y, z, lx, ly, lz, f) => cam(x, y, z, lx, ly, lz, f);
beat("front", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { turn(t, 0); turn(t, 0, "spud"); });
beat("q34", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { turn(t, 35); turn(t, 25, "spud"); });
beat("side", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { turn(t, 90); turn(t, 90, "spud"); });
beat("back", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { turn(t, 170); turn(t, 170, "spud"); });
beat("upper", cam(OX, 1.05, 3.6, OX, 1.0, 0, 24), (t) => { turn(t, 0); });
beat("upper34", cam(OX, 1.05, 3.6, OX, 1.0, 0, 24), (t) => { turn(t, 40); });
beat("face", cam(OX, 1.02, 1.9, OX, 1.0, 0, 22), (t) => { turn(t, 0); });
beat("face34", cam(OX, 1.02, 1.9, OX, 1.0, 0, 22), (t) => { turn(t, 40); });
beat("arms", cam(OX, 0.75, 2.4, OX, 0.72, 0, 22), (t) => { turn(t, 0); });
beat("lower", cam(OX, 0.45, 2.6, OX, 0.42, 0, 22), (t) => { turn(t, 20); });

// ---- expressions (section 12: four), the 22 degree lean, the spear
const reset = (t) => { face(t, "stern", {}, { face: { lidR: 0, lidL: 0 } }); A(t, "odin", "pitch", { to: 0, dur: 0.01 }); c.arm(t, "odin", "R", "rest", 0.01); c.arm(t, "odin", "L", "rest", 0.01); A(t, "odin", "grip", { side: "both", shape: "open", dur: 0.01 }); turn(t, 0); c.prop(t + 0.03, "spear", { x: 99 }, 0.005); c.prop(t, "spearD", { x: 99 }, 0.005); };
const FC = () => cam(OX, 1.12, 1.55, OX, 1.1, 0, 22);
beat("stern", FC(), (t) => { reset(t); });
beat("amused", FC(), (t) => { reset(t); face(t, "stern", { smirk: 0.4, raise: 0.01 }, { face: { lidR: 0.40 } }); });
beat("warm", FC(), (t) => { reset(t); face(t, "stern", { tilt: 0.12, browY: 0.012, curve: 0.9, eye: 0.9 }, { face: { lidR: 1 } }); });
beat("whisper", cam(OX, 1.0, 3.0, OX, 0.95, 0, 24), (t) => { reset(t); turn(t, 90); face(t, "stern", { open: 0.25 }, { face: { lidR: 0.35 } }); A(t, "odin", "pitch", { to: 22, dur: 0.01 }); });
beat("lean34", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { reset(t); turn(t, 60); A(t, "odin", "pitch", { to: 22, dur: 0.01 }); });
// the spear in the right hand (his right is -x): "rest" and "point"
const SPR = { id: "spear", kind: "odinspear", x: OX - 0.46, y: 0, z: 0.1, tip: -6 }, SPD = { id: "spearD", kind: "odinspear", x: 4, y: 0, z: 0, rot: 0 };
const hold = (t, g) => { c.arm(t + 0.03, "odin", "R", { prop: "spear", grip: g }, 0.01); A(t + 0.03, "odin", "grip", { side: "R", shape: "hold", dur: 0.01 }); };
beat("spearrest", cam(0, 0.98, 7.4, 0, 0.9, 0, 26), (t) => { reset(t); turn(t, 25); c.prop(t + 0.03, "spear", SPR, 0.01); hold(t, "rest"); });
beat("grip-front", cam(OX - 0.5, 1.05, 1.5, OX - 0.5, 1.05, 0, 20), (t) => { reset(t); turn(t, 0); c.prop(t + 0.03, "spear", SPR, 0.01); hold(t, "rest"); });
beat("grip-side", cam(OX + 1.5, 1.05, 0.1, OX - 0.5, 1.05, 0.1, 20), (t) => { reset(t); turn(t, 0); c.prop(t + 0.03, "spear", SPR, 0.01); hold(t, "rest"); });
beat("point", cam(0, 1.3, 7.4, 0, 1.3, 0, 30), (t) => { reset(t); turn(t, 0); c.prop(t + 0.03, "spear", { ...SPR, x: OX - 0.53, y: 0.26, z: 0.1, tip: 0, tilt: -35 }, 0.01); hold(t, "point"); });
beat("ravenarm", cam(0, 1.0, 5.0, 0, 0.95, 0, 26), (t) => { reset(t); turn(t, 0); c.arm(t, "odin", "L", { x: [OX + 0.62, 0.86, 0.40] }, 0.01); });
// the spear alone (x 4): butt and low bands, the grip zone, socket and blade, the blade with glow and glint
beat("sp-low", cam(4, 0.5, 1.6, 4, 0.5, 0, 24), (t) => { reset(t); c.prop(t + 0.03, "spearD", { ...SPD, glow: 0, glint: 0 }, 0.01); });
beat("sp-mid", cam(4, 1.1, 1.6, 4, 1.1, 0, 24), (t) => { reset(t); c.prop(t + 0.03, "spearD", { ...SPD, glow: 0, glint: 0 }, 0.01); });
beat("sp-top", cam(4, 1.9, 1.2, 4, 1.9, 0, 24), (t) => { reset(t); c.prop(t + 0.03, "spearD", { ...SPD, glow: 0, glint: 0 }, 0.01); });
beat("sp-glow", cam(4, 1.9, 1.2, 4, 1.9, 0, 24), (t) => { reset(t); c.prop(t + 0.03, "spearD", { ...SPD, glow: 1, glint: 0.5 }, 0.01); });
beat("sp-back", cam(4, 1.9, -1.2, 4, 1.9, 0, 24), (t) => { reset(t); c.prop(t + 0.03, "spearD", { ...SPD, glow: 0, glint: 0 }, 0.01); });
beat("hat", cam(OX, 1.58, 1.5, OX, 1.58, 0, 22), (t) => { reset(t); turn(t, 30); });
beat("braid", cam(OX, 0.72, 1.4, OX, 0.72, 0, 22), (t) => { reset(t); });

const END = T + 1.2;
const stills = shots.map(([n, t]) => Math.round((t + 0.9) * 100) / 100);
console.log("stills:", stills.join(","));
write(import.meta.url, {
  id: "odin-bench", title: "Norse myth 01 Odin bench", idea: "Bench for Odin and his spear (task T-A), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#8a93a6", floor: "#59606e", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["odin"], hint: 0, what: "engine test" },
  cast: [
    { id: "odin", character: "norse-myth/odin", at: [OX, 0], face: 0, follow: 0, seed: 1.3 },
    { id: "spud", character: "potatobrawl/spud", at: [SX, 0.1], face: 0, expr: "kind", follow: 0, seed: 2.6 },
  ],
  props: [SPR, SPD].map((p) => ({ ...p, x: 99, y: 0, z: 0 })),
  captions: c.captions,
  beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-odin-bench.mjs (Odin bench, no story).",
});
