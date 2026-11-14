// Bench for the Stonehenge land kit (engine/page/props-sh-land.js, task S2 of ../briefs/S2.md): one group per camera, 2500 m apart (a sky draws only
// within its spec.reach of its own x,z, so each group sees its own sky; the skyline's skirt reaches 1100 m), 30 grey boxes 2.1 x 4.1 x 1.1 on the r 15.5
// ring as stand-ins for the sarsens (limeblock, look weathered), Spud (0.88 m) for scale. Not a clip. The storyboard is wide with far 700.
//   A  today, time a, sun (26, 12)        B  today, time c, sun (9, 4)        C  today, time d, sun (0, 0.3): the disc on the axis horizon;
//   C2 the same look direction from [0, 1.6, 140] (the sun must stand at the same height)        D  dusk (stars)
//   E  era new, time b, from [40, 70, 80] at the centre: white bank, ditch ring, Avenue   E2  the same camera toward the +x +z valley: river, huts, smoke
//   F  today from above: path ring, barrows with beeches (look +x)   F2  the same toward the -x quarter: the far road and lorries
//   G  Avenue "ridges" (today)   G2  Avenue "cut" (2500 BC) from [0, 1.6, 150] looking down -z   H  pitcut from 6 m   I  sunshaft, time d, era new, from [8, 2, 40]
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-land.mjs [A,B,...]      (a list writes only those groups to sh-land-<list>.json)
//   node engine/render.mjs <json> --stills <times> --draft --out out/sh-land
//   node qa/contact.mjs out/sh-land/sh-land-*.png --out storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-land-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const NAMES = ["A", "B", "C", "D", "E", "F", "G", "G2", "H", "I"], want = (process.argv[2] || NAMES.join(",")).split(",");
const GX = Object.fromEntries(NAMES.map((n, i) => [n, i * 2500]));
const on = (g) => want.includes(g);

const cast = [], props = [];
const spud = (g, x, z, face = 180) => cast.push({ id: `spud${g}`, character: "potatobrawl/spud", at: [GX[g] + x, z], face, expr: "kind", follow: 0.2, seed: 2.1 });
const boxes = (g) => {   // 30 stand-ins on the r 15.5 ring: stone n at a = 6 + 12 (n - 1) deg from +z toward -x, facing the centre
  for (let n = 1; n <= 30; n++) { const a = 6 + 12 * (n - 1), r = a * Math.PI / 180; props.push({ id: `st${g}${n}`, kind: "limeblock", x: r3(GX[g] - 15.5 * Math.sin(r)), z: r3(15.5 * Math.cos(r)), rot: r3(180 - a), size: [2.1, 4.1, 1.1], look: "weathered" }); }
};
const land = (g, { era, time, sun, ground = true, henge = true, avenue = true, skyline = true, grooves = "none", dusk, slope }) => {
  props.push({ id: `sky${g}`, kind: "shsky", x: GX[g], z: 0, time, sunAz: sun[0], sunEl: sun[1], ...(dusk != null && { dusk }) });
  if (ground) props.push({ id: `ground${g}`, kind: "salisburyplain", x: GX[g], z: 0, era, sunAz: sun[0], sunEl: sun[1], ...(slope && { slope }), ...(dusk != null && { dusk }) });
  if (henge) props.push({ id: `henge${g}`, kind: "henge", x: GX[g], z: 0, era });
  if (avenue) props.push({ id: `avenue${g}`, kind: "avenue", x: GX[g], z: 0, era, grooves });
  if (skyline) props.push({ id: `skyline${g}`, kind: "skyline", x: GX[g], z: 0, era, sunAz: sun[0], sunEl: sun[1], time, ...(dusk != null && { dusk }) });
};
const cam = (g, p, l, f = 32) => ({ pos: [GX[g] + p[0], p[1], p[2]], look: [GX[g] + l[0], l[1], l[2]], fov: f });
const SHOTS = [];   // [name, group, camera, label]
if (on("A")) { land("A", { era: "today", time: "a", sun: [26, 12] }); boxes("A"); spud("A", -2.5, 60); SHOTS.push(["A", cam("A", [0, 1.6, 70], [0, 3, 0]), "A today, time a, sun (26, 12)"]); }
if (on("B")) { land("B", { era: "today", time: "c", sun: [9, 4] }); boxes("B"); spud("B", -2.5, 60); SHOTS.push(["B", cam("B", [0, 1.6, 70], [0, 3, 0]), "B today, time c, sun (9, 4)"]); }
if (on("C")) {
  land("C", { era: "today", time: "d", sun: [0, 0.3] }); boxes("C"); spud("C", -2.5, 60);
  SHOTS.push(["C", cam("C", [0, 1.6, 70], [0, 3, 0]), "C today, time d, sun (0, 0.3), from z 70"], ["C2", cam("C", [0, 1.6, 140], [0, 3, 70]), "C2 the same direction from z 140"], ["C3", cam("C", [-26, 1.6, 70], [-26, 3, 0]), "C3 from beside the ring: the disc on the horizon, no stone in front"]);
}
if (on("D")) { land("D", { era: "today", time: "dusk", sun: [0, -4], dusk: 1 }); boxes("D"); spud("D", -2.5, 60); SHOTS.push(["D", cam("D", [0, 1.6, 70], [0, 3, 0]), "D dusk: violet-blue, red band, first stars"]); }
if (on("E")) {
  land("E", { era: "new", time: "b", sun: [14, 6.5] }); boxes("E"); spud("E", 6, 30, 200);
  SHOTS.push(["E", cam("E", [40, 70, 80], [0, 3, 0], 40), "E era new from above: bank, ditch, Avenue"], ["E2", cam("E", [40, 70, 80], [120, 0, 130], 40), "E2 toward the valley: river, huts, smoke"], ["E3", cam("E", [-6, 1.7, 66], [-30, 0, 48], 40), "E3 eye height at the ditch, causeway to the left"], ["E4", cam("E", [0, 1.6, 66], [0, 4.4, 0], 27), "E4 the kit axis camera: ditch ends either side of the causeway"], ["E5", cam("E", [-4, 40, 60], [-4, 0, 52], 40), "E5 from above the causeway end"]);
}
if (on("F")) {
  land("F", { era: "today", time: "a", sun: [26, 12] }); boxes("F"); spud("F", 4, 24, 180);
  SHOTS.push(["F", cam("F", [-60, 60, 30], [80, 4, -10], 40), "F today from above toward +x: path ring, barrows with beeches"], ["F2", cam("F", [60, 60, 20], [-110, 0, 0], 40), "F2 toward -x: the far road and lorries"], ["F3", cam("F", [-6, 1.7, 66], [-30, 0, 48], 40), "F3 eye height at the dip"]);
}
if (on("G")) { land("G", { era: "today", time: "c", sun: [9, 4], grooves: "ridges" }); boxes("G"); SHOTS.push(["G", cam("G", [0, 1.6, 150], [0, 3, 0]), "G Avenue with two grass ridges (today)"]); }
if (on("G2")) { land("G2", { era: "new", time: "c", sun: [9, 4], grooves: "cut" }); boxes("G2"); SHOTS.push(["G2", cam("G2", [0, 1.6, 150], [0, 3, 0]), "G2 Avenue with two fresh chalk grooves (2500 BC)"]); c.prop(0, "avenueG2", { cut: 1 }, 0); }
if (on("H")) {
  props.push({ id: "skyH", kind: "shsky", x: GX.H, z: 0, time: "a", sunAz: 26, sunEl: 12 }, { id: "pitH", kind: "pitcut", x: GX.H, z: 0 });
  spud("H", 2.4, 1.6, 200); SHOTS.push(["H", cam("H", [1.6, 1.4, 6], [0, -1.3, 0], 36), "H pitcut from 6 m"]);
}
if (on("I")) {
  land("I", { era: "new", time: "d", sun: [0, 0.6] }); boxes("I");
  props.push({ id: "shaftI", kind: "sunshaft", x: GX.I, z: 0, show: 1 }, { id: "altarI", kind: "limeblock", x: GX.I, z: -4.2, size: [4.9, 0.5, 1.0], look: "weathered" },
    { id: "pairLI", kind: "limeblock", x: GX.I - 1.45, z: -6.3, size: [2.4, 6.7, 1.2], look: "weathered" }, { id: "pairRI", kind: "limeblock", x: GX.I + 1.45, z: -6.3, size: [2.4, 6.7, 1.2], look: "weathered" });
  spud("I", 4, 30, 180); SHOTS.push(["I", cam("I", [8, 2, 40], [0, 1.5, -6], 34), "I sunshaft, time d, era new"]);
}
const shots = [];
SHOTS.forEach(([name, cm, label], i) => { const T = r3(0.1 + i * 1.0); shots.push([name, T, cm]); c.cap(T, T + 0.9, label, 1000, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", shots.map(([n]) => n).join(","));

write(import.meta.url, {
  id: want.length === NAMES.length ? "sh-land" : "sh-land-" + want.join("-").toLowerCase(), title: "Stonehenge land kit bench", idea: "Props bench for the Stonehenge land kit (shsky, salisburyplain, henge, avenue, skyline, pitcut, sunshaft), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false, frame: "wide", far: 700,
  set: { type: "plain", color: "#bcd4ea", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id ?? "x"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-land.mjs (props bench, no reviews).",
});
