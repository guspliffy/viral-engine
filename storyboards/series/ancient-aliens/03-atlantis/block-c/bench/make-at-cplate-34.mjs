// Bench for the painted 3D scene of plate 34 (Port Royal 1692; engine/page/props-at-c-plate-34.js, scene "34"; task PROJ-C of ../briefs/):
// one group per camera, 12000 m apart on x (the sea and sky quads are huge), wide frame 1920 x 1080, far 1500, light AT_DAY, floor none.
//   P  the painter's camera, nobody in the frame (the frame must be the painting)
//   S  the painter's camera, Spud standing on the boardwalk at his spot (feet on the floor, contact shadow)
//   M  the camera moved 0.8 m to the right and 0.5 m in, same direction (the parallax proof)
//   M2 the camera 0.8 m to the left and 0.4 m back, looking a little right
//   Z  the painter's camera at half the fov on Spud (the close-up the clip will use)
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-34.mjs
//   flock /tmp/claude-render.lock node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-c/bench/at-cplate-34.json --stills <times> --draft --out out/at-cplate-34
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-34.py --vs out/at-cplate-34 34     (-> bench/at-cplate-34-vs.png)
import { writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_DAY } from "../../kit/at-kit.mjs";
import { SCENES_34, CPLATE_CAMS, floorAt } from "../../../../../../engine/page/props-at-c-plate-34.js";

const KEY = "34", SPOT = [520, 940], FACE = -12 + 25, ROW = 560;   // Spud's plate pixel (his feet), his turn, the middle row of the 16:9 window
const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const NAMES = ["P", "S", "M", "M2", "Z"], want = (process.argv[2] || NAMES.join(",")).split(",");
const GX = Object.fromEntries(NAMES.map((n, i) => [n, 3000 + i * 12000]));
const C = CPLATE_CAMS[KEY], yaw = C.yaw * Math.PI / 180, pit = (C.pitch ?? 0) * Math.PI / 180;
const FW = [-Math.sin(yaw) * Math.cos(pit), Math.sin(pit), -Math.cos(yaw) * Math.cos(pit)], RT = [Math.cos(yaw), 0, -Math.sin(yaw)];
const UP = [Math.sin(pit) * Math.sin(yaw), Math.cos(pit), Math.sin(pit) * Math.cos(yaw)];
const [SX, , SZ] = floorAt(KEY, ...SPOT);
// the painter's camera as a clip camera in group g: looks at plate pixel (col, row), k = the share of the plate width in frame
function pcam(g, { row = ROW, col = 768, k = 1, move = [0, 0, 0], turn = 0 } = {}) {
  const dx = (col - 768) / C.f + Math.tan(turn * Math.PI / 180), dy = (C.hy - row) / C.f;
  const d = [FW[0] + dx * RT[0] + dy * UP[0], FW[1] + dy * UP[1], FW[2] + dx * RT[2] + dy * UP[2]];
  const p = [C.pos[0] + move[0], C.pos[1] + move[1], C.pos[2] + move[2]];
  return { pos: [r3(GX[g] + p[0]), r3(p[1]), r3(p[2])], look: [r3(GX[g] + p[0] + d[0] * 50), r3(p[1] + d[1] * 50), r3(p[2] + d[2] * 50)], fov: r3(2 * Math.atan(432 * k / C.f) * 180 / Math.PI) };
}
const HZ = V2(FW);
const mv = (right, fwd, up = 0) => [RT[0] * right + HZ[0] * fwd, up, RT[2] * right + HZ[2] * fwd];
function V2(f) { const l = Math.hypot(f[0], f[2]); return [f[0] / l, 0, f[2] / l]; }
const cast = [], props = [], SHOTS = [], VS = [];
const shot = (name, cm, label, spud) => SHOTS.push({ name, cm, label, spud });
for (const g of NAMES.filter((n) => want.includes(n))) {
  props.push({ id: "plate" + g, kind: "cplate", scene: KEY, light: "day", x: GX[g], z: 0, y: 0 });
  if (g !== "P") cast.push({ id: "spud" + g, character: "potatobrawl/spud", at: [r3(GX[g] + SX), r3(SZ)], y: 0, face: FACE, expr: "kind", follow: 0.2, seed: 2.1 });
}
if (want.includes("P")) { shot("P", pcam("P"), `P plate ${KEY}: the painter's camera, no one in the frame`); VS.push(["P", ROW, 1, 768]); }
if (want.includes("S")) { shot("S", pcam("S"), `S plate ${KEY}: the painter's camera, Spud on the boardwalk (${SX}, ${SZ})`); VS.push(["S", ROW, 1, 768]); }
if (want.includes("M")) shot("M", pcam("M", { move: mv(0.8, 0.5) }), "M the camera 0.8 m to the right and 0.5 m in (parallax)");
if (want.includes("M2")) shot("M2", pcam("M2", { move: mv(-0.8, -0.4, 0.2), turn: 4 }), "M2 the camera 0.8 m to the left, 0.4 back, 0.2 up, turned 4 deg right");
if (want.includes("Z")) shot("Z", pcam("Z", { k: 0.5, col: SPOT[0], row: SPOT[1] - 150 }), "Z the painter's camera at half the fov on Spud");
SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); c.cap(s.T, s.T + 0.9, s.label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s.name).join(","));
console.log("Spud's spot:", SX, SZ);
const ID = "at-cplate-" + KEY;
writeFileSync(new URL(`./${ID}-vs.json`, import.meta.url), JSON.stringify({
  id: ID, vs: VS.map(([n, row, k, col]) => [n, row, k, col, r3(SHOTS.find((s) => s.name === n).T + 0.55)]).concat(SHOTS.some((s) => s.name === "Z") ? [["Z", SPOT[1] - 150, 0.5, SPOT[0], r3(SHOTS.find((s) => s.name === "Z").T + 0.55)]] : []),
  moved: SHOTS.filter((s) => s.name[0] === "M").map((s) => [s.name, r3(s.T + 0.55), s.label]),
}) + "\n");
write(import.meta.url, {
  id: ID, title: `Atlantis block C painted scene ${KEY} bench`, idea: "Props bench for the painted 3D scene (cplate), not a clip",
  frame: "wide", far: 1500, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { ...AT_DAY, floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map((s) => [s.name, s.T, s.cm]), END),
  notes: `Generated by storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-${KEY}.mjs (props bench, no reviews).`,
});
