// Bench for the museum skeletons and the waking sparks (engine/page/props-fossils.js, task T3 of
// storyboards/series/what-if/05-back-to-life/BRIEF-T3.md): sabrebones, mammothbones, trexbones (scale 1.5) on stone plinths and
// two pterobones hanging, on the plain golden set with Spud. Not a clip. One still per beat, 1 s apart, each taken 0.6 s into
// its beat. glow, rattle and rise have no propState default for rattle: every one is seeded with a dur-0 set at time 0, and
// every beat sets all of them again (dur 0).
//   A  the hall (panel 02/04): rest, then glow 1          B  low and long (panel 04): rest, then glow 1 (the last two stills;
//      camera B stands 0.3 m from Spud, so Spud is hidden from there on)
//   C  side on, 6 m away (the mammoth 8 m, the trex 17 m, the ptero 4.6 m from the front quarter), each skeleton alone: glow 0, 0.5, 1 and rattle 1
//   the overlap check: `trex` alone, then `trexbones` alone, at the same place, scale 1.5, side on; the two stills 50/50 over each
//   other (a prop has no opacity, and the skin would hide the bones): python3 -I -c "from PIL import Image; a=Image.open(A).convert('RGB'); Image.blend(a, Image.open(B).convert('RGB'), 0.5).save(OUT)"
//   lifesparks at rise 0.3 and 0.7 round the sabre-tooth
//   node storyboards/series/what-if/05-back-to-life/bench/make-fossils-props.mjs   (prints the still times and their labels)
//   node engine/render.mjs storyboards/series/what-if/05-back-to-life/bench/btl-fossils-props.json --stills <times> --draft --safe
//   node qa/contact.mjs out/btl-fossils-props-*.png --out storyboards/series/what-if/05-back-to-life/bench/fossils-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };

const CAM_A = { pos: [-0.2, 1.1, 7.6], look: [0.75, 1.5, 0], fov: 44 };
const CAM_B = { pos: [-0.3, 0.3, 2.6], look: [0.8, 2.9, -10.6], fov: 54 };

// where everything stands in the A and B shots (skeletons at y 0.3, on their plinths; the ptero hang)
const HOME = {
  sab: { kind: "sabrebones", x: 3.4, y: 0.3, z: 0.5, rot: -90 },
  mam: { kind: "mammothbones", x: 3.6, y: 0.3, z: -4.2, rot: -55 },
  rex: { kind: "trexbones", x: 1.0, y: 0.3, z: -11, rot: 0, scale: 1.5 },
  pt1: { kind: "pterobones", x: 2, y: 5.5, z: -1, rot: -60, wire: 3.5 },
  pt2: { kind: "pterobones", x: 2.2, y: 5.8, z: -6.5, rot: -110, wire: 3.5 },
  psab: { kind: "stoneblock", x: 3.4, y: 0, z: 0.5, rot: 0, w: 2.6, h: 0.3, d: 1.6 },
  pmam: { kind: "stoneblock", x: 3.6, y: 0, z: -4.2, rot: 0, w: 3.2, h: 0.3, d: 4.4 },
  prex: { kind: "stoneblock", x: 1.0, y: 0, z: -11, rot: 0, w: 3.4, h: 0.3, d: 3.0 },
  twa: { kind: "trex", x: 1.0, y: 0, z: -11, rot: 0, scale: 1.5 },
  twb: { kind: "trexbones", x: 1.0, y: 0, z: -11, rot: 0, scale: 1.5 },
  spk: { kind: "lifesparks", x: 3.4, y: 0.3, z: 0.5, rot: 0, r: 1.5, h: 3 },
};
const ANIM = ["sab", "mam", "rex", "pt1", "pt2", "twb"];   // the ones with glow and rattle
const BASE = { A: ["sab", "mam", "rex", "pt1", "pt2", "psab", "pmam", "prex"] };
const FAR = 80;   // what is not in a shot stands this far off to the side

// a side-on camera `d` m from a skeleton, `a` degrees round from its side (0 = square on to its flank), looking at `look` (y)
// at `off` m along its facing from the origin
const side = (id, d, look, fov, off = 0, a = 0) => {
  const h = HOME[id], r = (h.rot * Math.PI) / 180 + (a * Math.PI) / 180, f = [Math.sin((h.rot * Math.PI) / 180), Math.cos((h.rot * Math.PI) / 180)];
  return { pos: [r3(h.x + d * Math.cos(r)), look, r3(h.z - d * Math.sin(r))], look: [r3(h.x + f[0] * off), look, r3(h.z + f[1] * off)], fov };
};
const CS = { sab: side("sab", 6, 0.65, 50, 0.15), mam: side("mam", 8, 1.5, 66, 0.4), rex: side("rex", 17, 2.4, 72, -0.4), pt1: side("pt1", 4.6, 5.45, 54, 0, 55) };
const CAM_SPK = side("sab", 6.2, 1.5, 56, 0);

// [label, camera, ids in the shot (null = the A set), { id: params }, extra ids]
const SHOTS = [
  ["A rest", CAM_A, BASE.A, {}],
  ["A glow 1", CAM_A, BASE.A, Object.fromEntries(ANIM.map((k) => [k, { glow: 1 }]))],
]; 
for (const [id, cam, plinth] of [["sab", CS.sab, "psab"], ["mam", CS.mam, "pmam"], ["rex", CS.rex, "prex"], ["pt1", CS.pt1, null]]) {
  const ids = plinth ? [id, plinth] : [id];
  for (const [lab, p] of [["glow 0", {}], ["glow 0.5", { glow: 0.5 }], ["glow 1", { glow: 1 }], ["rattle 1", { rattle: 1 }]]) SHOTS.push([`C ${id} ${lab}`, cam, ids, { [id]: p }]);
}
SHOTS.push(["overlap: the trex alone", CS.rex, ["twa"], {}]);
SHOTS.push(["overlap: the trexbones alone, same place", CS.rex, ["twb"], {}]);
SHOTS.push(["sparks rise 0.3 round the sabre", CAM_SPK, ["sab", "psab", "spk"], { spk: { rise: 0.3 } }]);
SHOTS.push(["sparks rise 0.7, sabre glow 0.5", CAM_SPK, ["sab", "psab", "spk"], { spk: { rise: 0.7 }, sab: { glow: 0.5 } }]);
// the B shots come last: camera B stands 0.3 m from Spud (the brief's places), so Spud is hidden from the first of them on
SHOTS.push(["B rest (Spud hidden)", CAM_B, BASE.A, {}]);
SHOTS.push(["B glow 1 (Spud hidden)", CAM_B, BASE.A, Object.fromEntries(ANIM.map((k) => [k, { glow: 1 }]))]);
const END = SHOTS.length;

const props = Object.entries(HOME).map(([id, h]) => ({ id, ...h, ...(ANIM.includes(id) && { glow: 0, rattle: 0 }), ...(id === "spk" && { rise: 0 }) }));
// seed the keys propState has no default for (rattle) and glow / rise as the brief asks, then one jump per beat
for (const id of ANIM) c.prop(0, id, { glow: 0, rattle: 0 }, 0, "linear");
c.prop(0, "spk", { rise: 0 }, 0, "linear");
SHOTS.forEach(([, , ids, set], i) => {
  const t = i + 0.01;
  for (const [id, h] of Object.entries(HOME)) {
    const away = !ids.includes(id);
    c.prop(t, id, { x: away ? h.x + FAR : h.x, y: h.y, z: h.z, rot: h.rot, ...(ANIM.includes(id) && { glow: 0, rattle: 0 }), ...(id === "spk" && { rise: 0 }), ...(set[id] ?? {}) }, 0, "linear");
  }
});

const cast = [{ id: "spud", character: "potatobrawl/spud", at: [-0.6, 2.3], face: 0, expr: "terrified", follow: 0.2, seed: 1.3 }];
c.A(0, "spud", "look", { to: [0, 0.1], dur: 0.01, blink: false });
c.A(SHOTS.findIndex(([l]) => l.startsWith("B ")) + 0.005, "spud", "hide");

const beats = c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, cam, label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.6).toFixed(2)}s  ${label}`));

write(import.meta.url, {
  id: "btl-fossils-props", title: "Fossil skeletons bench", idea: "Props bench for There's a catch EP05 (trexbones, mammothbones, sabrebones, pterobones, lifesparks), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["spud", "sab"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/05-back-to-life/bench/make-fossils-props.mjs (props bench, no reviews).",
});
