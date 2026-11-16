// Bench for the painted 3D scene "27" (engine/page/props-at-c-plate-27.js, kind cplate; brief block-c/briefs/PROJ-C.md): Bimini from above,
// light AT_DAY, wide frame, set.floor "none". One group per camera, the scene's data read from the props file. Not a clip.
//   P  the painter's camera (the same picture as plate 27), no cast
//   S  the painter's camera, Spud standing on a road block 5 m under the sea (the prop lifted 4.9 so that block top is y 0: the floor and
//      its contact shadow; the clip does not use this, plate 27 has no standing place)
//   M  the camera moved 0.8 m sideways and 0.5 m in: the parallax proof
//   Z  the painter's camera at half the field of view (on the boat): the close-up
//   H  the painter's camera with spec.hide ["boat"]: the boat and its shadow on the sand gone (the clip adds its own biminiboat)
//   R  the clip's move: 1 m in, 0.5 m lower than a 10 % push and a 5 degree pan to the right
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-27.mjs
//   flock /tmp/claude-render.lock node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/block-c/bench/at-cplate-27.json --stills <times> --draft --out out/at-cplate-27
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-27.py --vs out/at-cplate-27      (-> bench/at-cplate-27-vs.png)
import { readFileSync, writeFileSync } from "node:fs";
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { AT_DAY } from "../../kit/at-kit.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const SC = JSON.parse(/\/\*SCENE-JSON-BEGIN\*\/\s*const SCENE_27 = ([\s\S]*?);\s*\/\*SCENE-JSON-END\*\//.exec(readFileSync(new URL("../../../../../../engine/page/props-at-c-plate-27.js", import.meta.url), "utf8"))[1]);
const C = SC.cam, YAW = C.yaw * Math.PI / 180, PIT = C.pitch * Math.PI / 180;
const NAMES = ["P", "S", "M", "Z", "H", "R"];
const GX = Object.fromEntries(NAMES.map((n, i) => [n, 100000 + i * 9000]));
const LIFT = 4.9;                                  // the S group: the prop up by the road top's depth, so the block top is y 0
const SPUD_AT = [0, -20.3];                        // x 0, the middle of the block k = 1 (z -19.03 .. -21.6)
const cast = [], props = [], SHOTS = [];
// a view ray of the painter's camera (plate pixel col,row), the way plateMatrix builds it: world dir = Ry(yaw) Rx(pitch) (u, -v, -1)
function dirAt(col, row, yaw = YAW) {
  const vx = (col - C.cx) / C.f, vy = -(row - C.hy) / C.f, vz = -1;
  const y1 = vy * Math.cos(PIT) - vz * Math.sin(PIT), z1 = vy * Math.sin(PIT) + vz * Math.cos(PIT);
  return [vx * Math.cos(yaw) + z1 * Math.sin(yaw), y1, -vx * Math.sin(yaw) + z1 * Math.cos(yaw)];
}
// the painter's camera as an engine camera: col,row = the plate pixel in the middle of the frame, k = the share of the plate's width in frame
function plateCam(g, { row = 512, col = 768, k = 1, move = [0, 0, 0], dyaw = 0, lift = 0 } = {}) {
  const d = dirAt(col, row, YAW + dyaw * Math.PI / 180), p = [C.pos[0] + move[0], C.pos[1] + move[1] + lift, C.pos[2] + move[2]];
  return { pos: [r3(GX[g] + p[0]), r3(p[1]), r3(p[2])], look: [r3(GX[g] + p[0] + d[0] * 50), r3(p[1] + d[1] * 50), r3(p[2] + d[2] * 50)], fov: r3(2 * Math.atan(432 * k / C.f) * 180 / Math.PI) };
}
// where a world point lands in the plate
const proj = (x, y, z) => {
  const dx = x - C.pos[0], dy = y - C.pos[1], dz = z - C.pos[2], cy = Math.cos(-YAW), sy = Math.sin(-YAW);
  const x1 = cy * dx + sy * dz, z1 = -sy * dx + cy * dz, a = -PIT, y2 = Math.cos(a) * dy - Math.sin(a) * z1, z2 = Math.sin(a) * dy + Math.cos(a) * z1, w = -z2;
  return [C.cx + C.f * x1 / w, C.hy - C.f * y2 / w];
};
const ROW = 500;
for (const g of NAMES) {
  props.push({ id: "plate" + g, kind: "cplate", x: GX[g], z: 0, y: g === "S" ? LIFT : 0, scene: "27", ...(g === "H" ? { hide: ["boat"] } : {}) });
  if (g === "S") cast.push({ id: "spud" + g, character: "potatobrawl/spud", at: [GX[g] + SPUD_AT[0], SPUD_AT[1]], y: 0, face: 8, expr: "kind", follow: 0.2, seed: 2.1 });
}
// the camera moves: 0.8 m to the right of the view and 0.5 m along it (horizontal part), the S group one lifted by LIFT
const fwd = [-Math.sin(YAW), 0, -Math.cos(YAW)], rgt = [Math.cos(YAW), 0, -Math.sin(YAW)];
const mv = [0.8 * rgt[0] + 0.5 * fwd[0], 0, 0.8 * rgt[2] + 0.5 * fwd[2]];
const push = [1.0 * fwd[0], -0.3, 1.0 * fwd[2]];
SHOTS.push(["P", plateCam("P", { row: ROW }), "P plate 27 from the painter's camera, no cast"]);
SHOTS.push(["S", plateCam("S", { row: ROW, lift: LIFT }), "S the same, Spud on a road block (prop lifted 4.9)"]);
SHOTS.push(["M", plateCam("M", { row: ROW, move: mv }), "M the camera 0.8 m sideways and 0.5 m in: parallax"]);
SHOTS.push(["Z", plateCam("Z", { row: 540, col: 1150, k: 0.5 }), "Z half the field of view on the boat: the close-up"]);
SHOTS.push(["H", plateCam("H", { row: ROW }), "H spec.hide boat: the boat and its shadow gone"]);
SHOTS.push(["R", plateCam("R", { row: ROW, move: push, dyaw: -5 }), "R the clip's move: 1 m in, 0.3 m down, panned 5 deg right"]);

let T = 0;
SHOTS.forEach(([name, cm, label], i) => { T = r3(0.1 + i * 1.0); SHOTS[i] = [name, T, cm, label]; });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
const [sc, sr] = proj(SPUD_AT[0], 0.85 - LIFT, SPUD_AT[1]);
console.log("Spud body in the plate (col,row):", r3(sc), r3(sr));
const st = Object.fromEntries(SHOTS.map(([n, t]) => [n, r3(t + 0.55)]));
writeFileSync(new URL("./at-cplate-27-vs.json", import.meta.url), JSON.stringify({ id: "at-cplate-27", vs: [["P", "27", ROW, 1, 768, st.P]], others: [["S", st.S, "S: Spud on a road block (prop lifted 4.9 m)"], ["M", st.M, "M: camera 0.8 m sideways, 0.5 m in (parallax)"], ["Z", st.Z, "Z: half the field of view on the boat"], ["H", st.H, "H: hide boat"], ["R", st.R, "R: 1 m in, 5 deg pan"]] }) + "\n");
write(import.meta.url, {
  id: "at-cplate-27", title: "Atlantis block C plate 27 bench", idea: "Props bench for the painted 3D scene 27 (cplate), not a clip",
  frame: "wide", far: 1500, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { ...AT_DAY, floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, cm]) => [n, t, cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-cplate-27.mjs (props bench, no reviews).",
});
