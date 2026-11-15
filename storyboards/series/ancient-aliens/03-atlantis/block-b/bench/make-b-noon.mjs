// Bench for the noon city (engine/page/props-at-b-noon.js, brief block-b/briefs/B3.md): kind atbnoon at PLACE(26), plain set + AT_NOON, wide frame, far 1500.
//   W1 wall17 from the painter's camera (rows 40..904 of plate 17)   W2 the same pushed 1 m in and side-stepped 1 m   W3 closer, Spud + the crew member at the plate
//   B1 bridge19 from the painter's camera (rows 40..904 of plate 19) B2 the same pushed 1 m and side-stepped 1 m       B3 panel 20: low on the deck over the crew
//   B4 bridge19 with quake 1 (dust off the far wall joints, rings on the water)    W4 wall17 with quake 1
//   node storyboards/series/ancient-aliens/03-atlantis/block-b/bench/make-b-noon.mjs [W1,W2,...] [--bare]     (--bare: no cast, id b-noon-bare: the painter's-camera comparisons)
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-b/bench/b-noon.json --stills <times printed> --draft --out out/b-noon
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-b/tools/b-noon-vs.py out/b-noon     (plate | still -> b-noon-<name>-vs.png + b-noon-sheet.png)
import { writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_NOON, PLACE } from "../../kit/at-kit.mjs";
const c = clip();
const [PX, PZ] = PLACE(26);
const CAMS = { W: { pos: [-0.8, 1.26, 2.47], yaw: -27.2, f: 1250, hy: 537, ox: 0 }, B: { pos: [0, 1.2, 0], yaw: -52.1, f: 1250, hy: 505, ox: 500 } };
// the painter's camera as an engine camera: row = the plate row in the middle of the 16:9 frame; move = [forward metres, right metres, up metres]
function plateCam(k, { row = 472, col = 768, move = [0, 0, 0], f2 } = {}) {
  const C = CAMS[k], yaw = C.yaw * Math.PI / 180, dx = (col - 768) / C.f, dy = (C.hy - row) / C.f;
  const d = [dx * Math.cos(yaw) - Math.sin(yaw), dy, -dx * Math.sin(yaw) - Math.cos(yaw)], fw = [-Math.sin(yaw), 0, -Math.cos(yaw)], rt = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const p = [C.pos[0] + fw[0] * move[0] + rt[0] * move[1], C.pos[1] + move[2], C.pos[2] + fw[2] * move[0] + rt[2] * move[1]];
  return { pos: [r3(PX + C.ox + p[0]), r3(p[1]), r3(PZ + p[2])], look: [r3(PX + C.ox + p[0] + d[0] * 50), r3(p[1] + d[1] * 50), r3(PZ + p[2] + d[2] * 50)], fov: r3(f2 ?? 2 * Math.atan(432 / C.f) * 180 / Math.PI) };
}
const cam = (ox, p, l, f = 38) => ({ pos: [r3(PX + ox + p[0]), r3(p[1]), r3(PZ + p[2])], look: [r3(PX + ox + l[0]), r3(l[1]), r3(PZ + l[2])], fov: f });
const SHOTS = [
  ["W1", plateCam("W"), "wall17 from the painter's camera"],
  ["W2", plateCam("W", { move: [1, 1, 0] }), "wall17 pushed 1 m and side-stepped 1 m"],
  ["W3", cam(0, [-1.2, 0.95, 1.9], [1.3, 0.4, -0.7], 42), "wall17 closer: Spud and the crew member at the plates"],
  ["B1", plateCam("B"), "bridge19 from the painter's camera"],
  ["B2", plateCam("B", { move: [1, 1, 0] }), "bridge19 pushed 1 m and side-stepped 1 m"],
  ["B3", cam(500, [1.2, 0.75, 0.7], [5.6, 1.0, -9], 44), "bridge19 panel 20: low on the deck over the crew"],
  ["W4", plateCam("W"), "wall17 quake 1", { quake: 1 }],
  ["B4", plateCam("B"), "bridge19 quake 1", { quake: 1 }],
].filter(([n]) => { const l = process.argv.slice(2).find((a) => !a.startsWith("--")); return !l || l.split(",").includes(n); });
const spud = (id, x, z, face, ox) => ({ id, character: "potatobrawl/spud", at: [r3(PX + ox + x), r3(PZ + z)], y: 0, face, expr: "kind", follow: 0.2, seed: 2.1 });
const crew = (id, x, z, face, ox) => ({ id, character: "ancient-aliens/alien-crew", at: [r3(PX + ox + x), r3(PZ + z)], y: 0, face, expr: "kind", follow: 0.2, seed: 3.3 });
const BARE = process.argv.includes("--bare"), ID = BARE ? "b-noon-bare" : "b-noon";
const cast = BARE ? [] : [spud("spudW", -0.1, 0.3, 180, 0), crew("crewW", 2.6, -1.45, 0, 0), spud("spudB", 2.2, -1.7, 180, 500), crew("crewB1", 3.6, -1.7, 180, 500), crew("crewB2", 5.0, -1.7, 180, 500)];
const props = [{ id: "w17", kind: "atbnoon", x: PX, z: PZ, view: "wall17", light: "noon", seed: 1 }, { id: "b19", kind: "atbnoon", x: PX, z: PZ, view: "bridge19", light: "noon", seed: 1 }];
const T = SHOTS.map((s, i) => r3(0.1 + i * 1.0)), END = r3(0.1 + SHOTS.length + 0.1);
console.log("stills:", T.map((t) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s[0]).join(","));
writeFileSync(new URL(`./${ID}-names.json`, import.meta.url), JSON.stringify({ names: SHOTS.map((s) => s[0]), times: T.map((t) => r3(t + 0.55)), labels: SHOTS.map((s) => s[2]) }) + "\n");
for (let i = 0; i < SHOTS.length; i++) { const v = SHOTS[i][3]?.quake ?? 0; c.prop(r3(T[i] - 0.05), "w17", { quake: v }, 0); c.prop(r3(T[i] - 0.05), "b19", { quake: v }, 0); }
write(import.meta.url, {
  id: ID, title: "Atlantis noon city bench", idea: "Props bench for atbnoon (B3), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  frame: "wide", far: 1500, set: { ...AT_NOON }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, cm], i) => [n, T[i], cm]), END),
  notes: "Generated by block-b/bench/make-b-noon.mjs (props bench, no reviews).",
});
