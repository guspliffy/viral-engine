// Bench for the painted 3D scene "29" (engine/page/props-at-c-plate-29.js, kind cplate; brief block-c/briefs/PROJ-C.md): the edge road at
// stormy evening, light AT_EVE, wide frame, set.floor "none". One group per camera, the scene's data read from the props file. Not a clip.
//   P  the painter's camera (the same picture as plate 29), no cast
//   S  the painter's camera, Spud and the foreman standing on the road (Spud 3.6 m from the camera, the road top is y 0)
//   M  the camera moved 0.8 m sideways (onto the road) and 0.5 m in: the parallax proof
//   Z  the painter's camera at half the field of view on Spud: the close-up the clip will use
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-29.mjs
//   flock /tmp/claude-render.lock node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-c/bench/at-cplate-29.json --stills <times> --draft --out out/at-cplate-29
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-29.py --vs out/at-cplate-29      (-> bench/at-cplate-29-vs.png)
import { readFileSync, writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_EVE } from "../../kit/at-kit.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const SC = JSON.parse(/\/\*PLATES-JSON-BEGIN\*\/\s*const SCENE_29 = ([\s\S]*?);\s*\/\*PLATES-JSON-END\*\//.exec(readFileSync(new URL("../../../../../../engine/page/props-at-c-plate-29.js", import.meta.url), "utf8"))[1]);
const C = SC.cam, YAW = C.yaw * Math.PI / 180;
const NAMES = ["P", "S", "M", "Z"];
const GX = Object.fromEntries(NAMES.map((n, i) => [n, 100000 + i * 6000]));
const SPUD_AT = [-2.4, -3.6], FOREMAN_AT = [-1.2, -5.0];
const cast = [], props = [], SHOTS = [];
const who = (g, id, character, [x, z], face, seed) => cast.push({ id: id + g, character, at: [GX[g] + x, z], y: 0, face, expr: "kind", follow: 0.2, seed });
// the painter's camera as an engine camera; row/col = the plate pixel in the middle of the frame, k = the share of the plate's width in frame
function plateCam(g, { row = 512, col = 768, k = 1, move = [0, 0, 0] } = {}) {
  const dx = (col - C.cx) / C.f, dy = (C.hy - row) / C.f;
  const d = [dx * Math.cos(YAW) - Math.sin(YAW), dy, -dx * Math.sin(YAW) - Math.cos(YAW)];
  const p = [C.pos[0] + move[0], C.pos[1] + move[1], C.pos[2] + move[2]];
  return { pos: [r3(GX[g] + p[0]), r3(p[1]), r3(p[2])], look: [r3(GX[g] + p[0] + d[0] * 50), r3(p[1] + d[1] * 50), r3(p[2] + d[2] * 50)], fov: r3(2 * Math.atan(432 * k / C.f) * 180 / Math.PI) };
}
// where Spud's head is in the plate (for Z): the point 0.55 m over his feet
const proj = (x, y, z) => { const xc = Math.cos(YAW) * (x - C.pos[0]) - Math.sin(YAW) * (z - C.pos[2]), zc = Math.sin(YAW) * (x - C.pos[0]) + Math.cos(YAW) * (z - C.pos[2]), w = -zc; return [C.cx + C.f * xc / w, C.hy - C.f * (y - C.pos[1]) / w]; };
const [sc, sr] = proj(SPUD_AT[0], 0.55, SPUD_AT[1]);
const ROW = 520;
for (const g of NAMES) {
  props.push({ id: "plate" + g, kind: "cplate", x: GX[g], z: 0, scene: "29" });
  if (g !== "P") who(g, "spud", "potatobrawl/spud", SPUD_AT, 100, 2.1);
  if (g === "S" || g === "M") who(g, "foreman", "ancient-aliens/alien-foreman", FOREMAN_AT, -140, 3.1);
}
const mv = [-0.8 * Math.cos(YAW) - 0.5 * Math.sin(YAW), 0, 0.8 * Math.sin(YAW) - 0.5 * Math.cos(YAW)];
SHOTS.push(["P", plateCam("P", { row: ROW }), "P plate 29 from the painter's camera, no cast"]);
SHOTS.push(["S", plateCam("S", { row: ROW }), "S the same, Spud and the foreman on the road"]);
SHOTS.push(["M", plateCam("M", { row: ROW, move: mv }), "M the camera 0.8 m onto the road and 0.5 m in: parallax"]);
SHOTS.push(["Z", plateCam("Z", { row: r3(sr - 20), col: r3(sc + 40), k: 0.5 }), "Z half the field of view on Spud: the close-up"]);

let T = 0;
SHOTS.forEach(([name, cm, label], i) => { T = r3(0.1 + i * 1.0); SHOTS[i] = [name, T, cm, label]; });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
console.log("Spud head in the plate:", r3(sc), r3(sr));
const st = Object.fromEntries(SHOTS.map(([n, t]) => [n, r3(t + 0.55)]));
writeFileSync(new URL("./at-cplate-29-vs.json", import.meta.url), JSON.stringify({ id: "at-cplate-29", vs: [["P", "29", ROW, 1, 768, st.P]], others: [["S", st.S, "S: Spud and the foreman on the road (painter's camera)"], ["M", st.M, "M: camera 0.8 m onto the road, 0.5 m in (parallax)"], ["Z", st.Z, "Z: half the field of view on Spud (the close-up)"]] }) + "\n");
write(import.meta.url, {
  id: "at-cplate-29", title: "Atlantis block C plate 29 bench", idea: "Props bench for the painted 3D scene 29 (cplate), not a clip",
  frame: "wide", far: 1500, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { ...AT_EVE, floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm]) => [n, t, cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-29.mjs (props bench, no reviews).",
});
