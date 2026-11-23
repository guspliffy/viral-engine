// Krampus myth 01 beast bench (task T-B, 21 Nov 2026): the kinds `krampus` and `krampusshadow` of engine/page/props-krampus-beast.js at DESIGN section B sizes. Not a clip, no cast.
// One shot per state (1.0 s each, the still is 0.5 s in), every pose at its full value:
//   front stand34 side back      the whole figure: front, 3/4, profile, the basket from behind
//   face faceJaw faceSide        the carved face close: 150 gouges, brow V, 2 sockets, jaw shut / open 32 deg, from the side (ear, hinge peg)
//   tongue sniff lick            tongue 1 (0.72 m, hangs plumb), nose 1 + sniff 0.5, lick 0.45 (nose 1)
//   horn                         the left horn (chipped tip, 32 rings), the right one (notched at ring 9)
//   stoop stoopJam jamUp         stoop 1; stoop 1 + jam 1 + tongue 1 (butts at jamAt); jam 0.5 (the raised fist, panel 06)
//   fist chain bells hooves      close-ups: the fist + bunch, the wrist chain, the belt chain + 3 cowbells, a hoof with fetlock hair
//   gait1 gait2                  gait 0.25 / 0.75 (one hoof in the air, profile)
//   lid1 lid2 lid3 lidBack       the lid at 0.25 / 0.6 / 1 over the stoop (panel 23: mouth toward the camera), and lid 1 standing from behind
//   basket                       the basket from behind close: 28 stakes, 46 rows, patch, belts, rim, hinge loops
//   kidPeek1 kidPeek05 kidDang kidKick kidClose  the kid stowed: head over the rim, eyes only, dangling by the scarf (stow 0), upside down (kidKick), close
//   shadow                       krampusshadow on a door (grow 1, sway 0.5) with the apron
//   runners runnerMid runnerFar  runner copies: 4 near (seeds 1-4), a mid and a far one
//   node storyboards/series/krampus-myth/01-boots/bench/make-beast-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/krampus-myth/01-boots/bench/beast-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-beast
//   node qa/contact.mjs /tmp/claude-0/bench-beast/beast-bench-*.png --out storyboards/series/krampus-myth/01-boots/bench/beast-sheet.png
import { clip, frame, write } from "../../../../lib/clip.mjs";
import { krampusCounts, krampusPoints } from "../../../../../engine/page/props-krampus-beast.js";

const c = clip();
const BASE = { stoop: 0, nose: 0, sniff: 0, twist: 0, headYaw: 0, headPitch: 0, gait: 0, slope: 0, jam: 0, bunch: 1, tongue: 0.35, lick: 0, jaw: 0, breath: 0, lids: 0.3, glow: 0.5, lookX: 0, lookY: 0, ears: 0, ring: 0, lid: 0, stow: 1, kidPeek: 0, kidTalk: 0, kidKick: 0, scarfOut: 0, spares: 3 };
const RUN = [[1, 0.1, 0.5, 0.20], [2, 0.0, 0.3, 0.35], [3, 0.2, 0.7, 0.6], [4, 0.05, 0.2, 0.85]];   // seed, stoop, tongue, gait
const props = [
  { id: "k", kind: "krampus", x: 0, y: 0, z: 0, rot: 0, ...BASE },
  { id: "ks", kind: "krampusshadow", x: 8, y: 0, z: 0.07, grow: 1, sway: 0.5 },
  { id: "door", kind: "door", x: 6.4, y: 0, z: 0, w: 3.2, h: 2.2, color: "#b98a52" },
  ...RUN.map(([seed, stoop, tongue, gait], i) => ({ id: `r${i + 1}`, kind: "krampus", runner: true, seed, x: 14 + i * 1.5, y: 0, z: 0, rot: 0, ...BASE, stoop, tongue, gait, jam: 0.5, ring: 0.8, scale: 0 })),
  { id: "rm", kind: "krampus", runner: true, lod: "mid", seed: 5, x: 22, y: 0, z: 0, rot: 0, ...BASE, jam: 0.5, scale: 0 },
  { id: "rf", kind: "krampus", runner: true, lod: "far", seed: 7, x: 26, y: 0, z: 0, rot: 0, gait: 0.2, scale: 0 },
];
const shots = [];
const shot = (name, over, cam, show = []) => shots.push([name, over, cam, show]);
const T = (x = 0, y = 1.2, z = 0.2) => [x, y, z];
shot("front", {}, frame(T(0, 1.22, 0.2), { az: 0, el: 6, h: 3.0, fov: 24 }));
shot("stand34", { ring: 0 }, frame(T(0, 1.22, 0.0), { az: 38, el: 8, h: 3.0, fov: 24 }));
shot("side", {}, frame(T(0, 1.22, -0.1), { az: 90, el: 3, h: 3.0, fov: 24 }));
shot("back", {}, frame(T(0, 1.3, -0.3), { az: -150, el: 10, h: 3.0, fov: 24 }));
shot("face", {}, frame(T(0, 1.8, 0.4), { az: 10, el: 4, h: 0.62, fov: 20 }));
shot("faceJaw", { jaw: 1, tongue: 0, glow: 1, lids: 0.1 }, frame(T(0, 1.8, 0.4), { az: 18, el: 6, h: 0.6, fov: 20 }));
shot("faceSide", { glow: 1 }, frame(T(0, 1.86, 0.3), { az: 78, el: 4, h: 0.7, fov: 20 }));
shot("tongue", { tongue: 1 }, frame(T(0, 1.4, 0.3), { az: 35, el: 6, h: 1.9, fov: 22 }));
shot("sniff", { nose: 1, sniff: 0.5, tongue: 0.2, breath: 1 }, frame(T(0, 1.9, 0.4), { az: 42, el: 6, h: 1.4, fov: 22 }));
shot("lick", { nose: 1, lick: 0.45, tongue: 0.35 }, frame(T(0.1, 1.95, 0.5), { az: 30, el: 6, h: 1.4, fov: 22 }));
shot("horn", {}, frame(T(0.3, 2.2, 0.1), { az: 25, el: 6, h: 1.0, fov: 20 }));
shot("hornR", {}, frame(T(-0.3, 2.2, 0.1), { az: -25, el: 6, h: 1.0, fov: 20 }));
shot("stoop", { stoop: 1 }, frame(T(0, 1.15, 0.5), { az: 88, el: 3, h: 3.0, fov: 24 }));
shot("stoopJam", { stoop: 1, jam: 1, tongue: 1 }, frame(T(0.0, 1.0, 0.5), { az: 50, el: 8, h: 2.8, fov: 24 }));
shot("jamUp", { jam: 0.5 }, frame(T(-0.3, 1.4, 0.3), { az: -45, el: 6, h: 2.4, fov: 24 }));
shot("fist", { jam: 0.5 }, frame(T(-0.45, 1.85, 0.4), { az: -35, el: 6, h: 0.8, fov: 20 }));
shot("chain", { ring: 0.5 }, frame(T(0.4, 0.75, 0.2), { az: 55, el: 6, h: 1.0, fov: 20 }));
shot("bells", { ring: 0 }, frame(T(0.0, 1.0, 0.3), { az: 12, el: 6, h: 0.75, fov: 20 }));
shot("hooves", { gait: 0.25 }, frame(T(0.05, 0.3, 0.1), { az: 50, el: 12, h: 0.9, fov: 20 }));
shot("gait1", { gait: 0.25, ring: 0 }, frame(T(0, 1.15, 0.1), { az: 90, el: 3, h: 3.0, fov: 24 }));
shot("gait2", { gait: 0.75, ring: 0 }, frame(T(0, 1.15, 0.1), { az: 90, el: 3, h: 3.0, fov: 24 }));
shot("lid1", { stoop: 1, lid: 0.25, kidPeek: 0.5 }, frame(T(0, 2.0, 0.3), { az: 22, el: 12, h: 1.7, fov: 22 }));
shot("lid2", { stoop: 1, lid: 0.6, kidPeek: 0.5 }, frame(T(0, 2.0, 0.3), { az: 22, el: 12, h: 1.7, fov: 22 }));
shot("lid3", { stoop: 1, lid: 1, kidPeek: 0.5 }, frame(T(0, 2.0, 0.3), { az: 22, el: 12, h: 1.7, fov: 22 }));
shot("lidBack", { lid: 1, kidPeek: 1 }, frame(T(0, 1.8, -0.6), { az: -145, el: 20, h: 1.6, fov: 22 }));
shot("basket", {}, frame(T(0, 1.7, -0.66), { az: 180, el: 6, h: 1.0, fov: 20 }));
shot("kidPeek1", { kidPeek: 1 }, frame(T(0, 2.1, -0.5), { az: 38, el: 18, h: 0.9, fov: 20 }));
shot("kidPeek05", { kidPeek: 0.5, kidTalk: 1 }, frame(T(0, 2.1, -0.5), { az: 25, el: 18, h: 0.9, fov: 20 }));
shot("kidDang", { stow: 0, lid: 1, kidPeek: 0 }, frame(T(0.2, 2.0, -0.3), { az: 60, el: 12, h: 1.5, fov: 22 }));
shot("kidKick", { kidKick: 1.125, lid: 0.12 }, frame(T(0, 2.0, -0.55), { az: -150, el: 22, h: 1.2, fov: 20 }));
shot("kidClose", { kidPeek: 1, scarfOut: 0 }, frame(T(0, 2.22, -0.5), { az: 12, el: 14, h: 0.5, fov: 20 }));
shot("scarf", { kidPeek: 0, scarfOut: 1, lid: 0 }, frame(T(0.1, 1.9, -0.45), { az: 25, el: 12, h: 0.9, fov: 20 }));
shot("shadow", {}, frame(T(8, 1.15, 0.7), { az: 0, el: 12, h: 4.8, fov: 24 }));
shot("runners", {}, frame(T(15.1, 1.2, 0.2), { az: 0, el: 5, h: 3.0, fov: 30 }), ["r1", "r2", "r3", "r4"]);
shot("runnerMid", {}, frame(T(22, 1.2, 0.2), { az: 15, el: 5, h: 3.0, fov: 24 }), ["rm"]);
shot("runnerFar", {}, frame(T(26, 1.2, 0.2), { az: 0, el: 5, h: 3.0, fov: 24 }), ["rf"]);

const beats = []; let t = 0; const stills = [];
for (const [name, over, cam, show] of shots) {
  c.prop(t, "k", { ...BASE, ...over }, 0);
  for (const id of show) c.prop(t, id, { scale: 1 }, 0);
  for (const id of show) c.prop(t + 0.99, id, { scale: 0 }, 0);
  stills.push(Math.round((t + 0.5) * 100) / 100);
  beats.push([name, t, cam]); t += 1;
}
const sb = {
  id: "beast-bench", title: "Krampus myth 01 beast bench", idea: "Engine look bench for the krampus and krampusshadow props (task T-B), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#cdbfa6", floor: "#7a6e5c", light: "golden", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats(beats, t),
  notes: "Generated by storyboards/series/krampus-myth/01-boots/bench/make-beast-bench.mjs (engine bench, no story).",
};
console.log("stills:", stills.join(","));
console.log("shots:", shots.map((s, i) => `${i}:${s[0]}`).join(" "));
console.error("counts:", JSON.stringify(krampusCounts()));
const f = (a) => a && a.map((v) => Math.round(v * 1000) / 1000).join(",");
for (const p of [{}, { stoop: 1 }, { nose: 1 }, { stoop: 1, jam: 1 }, { stoop: 1, jam: 1, mirror: true, jamAt: [0, 0.24, 0.85] }, { stoop: 1, lid: 1 }]) { const r = krampusPoints(p); console.error(JSON.stringify(p), "M", f(r.M), "crown", f(r.crown), "hornTop", f(r.hornTop), "rim", f(r.rim), "lidEdge", f(r.lidEdge), "butts", f(r.butts), "reachShort", r.reachShort); }
write(import.meta.url, sb);
