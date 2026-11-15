// Bench for the painted 3D scene "28" (Bimini road under water: engine/page/props-at-c-plate-28.js, kind `cplate`; brief block-c/briefs/PROJ-C.md).
// Wide 1920 x 1080, far 1500, set AT_UNDER. One group per camera (6000 m apart on x from 40000), each its own copy of the scene. Not a clip; each shot
// is one beat, the still is 0.55 s in. The prop sits at x 0, z 0 of its group with y 4.9, so the top of block 0 (sea y -4.9) is the floor y 0: Spud's
// contact shadow lands on it. The painter's camera is read from the scene data (engine/page/props-at-c-plate-28.js, written by block-c/tools/plate-28.py).
//   P  the painter's camera, no cast: the frame must be the painting (rows 80-944 of the plate, the 16:9 window)
//   S  the painter's camera, Spud standing on block 0 (scene meta.spud), facing the camera
//   M  the camera moved 0.8 m to the left (toward the road) and 0.5 m in: the parallax proof          N  the same moved 0.8 m to the right and 0.5 m back
//   Z  the painter's camera at half the fov, aimed at Spud: the close-up the clip will use
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-28.mjs
//   flock /tmp/claude-render.lock node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-c/bench/at-cplate-28.json --stills <times> --draft --out out/at-cplate-28
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-28.py --vs out/at-cplate-28     (painting | P | S | M | Z -> bench/at-cplate-28-vs.png)
import { readFileSync, writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_UNDER } from "../../kit/at-kit.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const SRC = readFileSync(new URL("../../../../../../engine/page/props-at-c-plate-28.js", import.meta.url), "utf8");
const SC = JSON.parse(/\/\*SCENE-JSON-BEGIN\*\/\s*const SCENE_28 = ([\s\S]*?);\s*\/\*SCENE-JSON-END\*\//.exec(SRC)[1]);
const CAM = SC.cam, [SX, SZ] = SC.meta.spud, PY = SC.meta.propY, TOPY = SC.meta.topY;
const DEG = Math.PI / 180;
// the painter's camera basis (yaw turns left, pitch < 0 looks down) as the engine's plateMatrix reads it
const yaw = CAM.yaw * DEG, pit = -CAM.pitch * DEG;
const FW = [-Math.sin(yaw) * Math.cos(pit), -Math.sin(pit), -Math.cos(yaw) * Math.cos(pit)];
const RT = [Math.cos(yaw), 0, -Math.sin(yaw)];
const UP = [RT[1] * FW[2] - RT[2] * FW[1], RT[2] * FW[0] - RT[0] * FW[2], RT[0] * FW[1] - RT[1] * FW[0]];
const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k);
const GX = { P: 40000, S: 46000, M: 52000, Z: 58000, N: 64000 };
const want = (process.argv[2] || "P,S,M,Z,N").split(","), on = (g) => want.includes(g);
const cast = [], props = [], SHOTS = [];
const W = 1536, K = CAM.f;
// the engine camera of group g: sea-coordinate position p (the prop's y lifts it by PY), a plate pixel (u, v) the view axis passes through, vertical fov from the half height (px)
const cam = (g, p, u, v, half) => {
  const pos = [r3(GX[g] + p[0]), r3(p[1] + PY), r3(p[2])];
  const d = add(add(FW, RT, (u - W / 2) / K), UP, -(v - CAM.hy) / K), look = add(pos, d, 50);
  return { pos, look: look.map(r3), fov: r3(2 * Math.atan(half / K) / DEG) };
};
const proj = (x, y, z) => { const v = [x - CAM.pos[0], y - CAM.pos[1], z - CAM.pos[2]], d = v[0] * FW[0] + v[1] * FW[1] + v[2] * FW[2]; return [W / 2 + K * (v[0] * RT[0] + v[1] * RT[1] + v[2] * RT[2]) / d, CAM.hy - K * (v[0] * UP[0] + v[1] * UP[1] + v[2] * UP[2]) / d]; };
const spud = (g, face) => cast.push({ id: `spud${g}`, character: "potatobrawl/spud", at: [GX[g] + SX, SZ], y: 0, face, expr: "kind", follow: 0.2, seed: 2.1 });
const GRADE = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;   // a test of the plate grade: [lift, gain]
const scene = (g) => props.push({ id: `plate${g}`, kind: "cplate", x: GX[g], z: 0, y: PY, scene: "28", ...(GRADE && { grade: GRADE }), ...(process.env.HIDE && { hide: process.env.HIDE.split(",") }) });   // HIDE=fish,reef: the groups spec.hide takes out (a test)
const FACE = r3(Math.atan2(CAM.pos[0] - SX, CAM.pos[2] - SZ) / DEG);    // toward the painter's camera
const [zu, zv] = proj(SX, TOPY + 0.5, SZ);
const MOVE_L = add(add(CAM.pos, RT, -0.8), [FW[0], 0, FW[2]].map((v) => v / Math.hypot(FW[0], FW[2])), 0.5);
const MOVE_R = add(add(CAM.pos, RT, 0.8), [FW[0], 0, FW[2]].map((v) => v / Math.hypot(FW[0], FW[2])), -0.5);
if (on("P")) { scene("P"); SHOTS.push(["P", cam("P", CAM.pos, W / 2, CAM.hy, 432), "plate 28 from the painter's camera, no cast"]); }
if (on("S")) { scene("S"); spud("S", FACE); SHOTS.push(["S", cam("S", CAM.pos, W / 2, CAM.hy, 432), "S: Spud on block 0 (contact shadow)"]); }
if (on("M")) { scene("M"); spud("M", FACE); SHOTS.push(["M", cam("M", MOVE_L, W / 2, CAM.hy, 432), "M: camera 0.8 m left, 0.5 m in (parallax)"]); }
if (on("Z")) { scene("Z"); spud("Z", FACE); SHOTS.push(["Z", cam("Z", CAM.pos, zu, zv, 216), "Z: half the fov on Spud (the close-up)"]); }
if (on("N")) { scene("N"); spud("N", FACE); SHOTS.push(["N", cam("N", MOVE_R, W / 2, CAM.hy, 432), "N: camera 0.8 m right, 0.5 m back (parallax)"]); }
SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); c.cap(s.T, s.T + 0.9, s[2], 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s[0]).join(","));
// what plate-28.py --vs lays out: the painting windows (col, row, share of the width) and the stills
writeFileSync(new URL("./at-cplate-28-vs.json", import.meta.url), JSON.stringify({ id: "at-cplate-28", window: { P: [W / 2, CAM.hy, 1], Z: [r3(zu), r3(zv), 0.5] }, shots: SHOTS.map((s) => [s[0], r3(s.T + 0.55), s[2]]) }) + "\n");
write(import.meta.url, {
  id: "at-cplate-28", title: "Block C plate 28 painted 3D bench", idea: "Props bench for the painted scene 28 (Bimini road under water), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 1500,
  set: { ...AT_UNDER, floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [cast[0]?.id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map((s) => [s[0], s.T, s[1]]), END),
  notes: "Generated by make-at-cplate-28.mjs (props bench, no reviews).",
});
