// A motion take on the anime person, as a quick strip of stills to judge it before it goes into a clip:
//   node tools/human/preview.mjs <clip> <from> <to> <step> [heading=90] [character=human/vrm-test-01] [side=1]
// writes storyboards/human/preview-<clip>.json (the camera beside the path, following the pelvis) and prints the times
import fs from "node:fs";
import { Performance, prepClip, worldPose } from "../../engine/page/rigs/human-perform.js";

const [clip, from, to, step = "0.25", heading = "90", character = "human/vrm-test-01", side = "1"] = process.argv.slice(2);
const C = prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${clip}.json`, "utf8")));
const LEG = 0.78;   // about the VRoid base's thigh + shin (the page measures the real one)
const seg = { at: 0, clip, from: +from, to: +to, place: [0, -3.0], heading: +heading };
const P = new Performance([seg], { [clip]: C }, [], LEG), dur = +to - +from;
const camera = [];
for (let t = 0; t <= dur + 1e-6; t += 0.1) {
  const W = worldPose(P.at(t)), p = W.root.start;
  camera.push({ at: +t.toFixed(2), pos: [+p.x.toFixed(3), 1.15, +(p.z + 4.6 * +side).toFixed(3)], look: [+p.x.toFixed(3), 0.85, +p.z.toFixed(3)], fov: 32 });
}
for (let r = 0; r < 4; r++) for (let i = 1; i < camera.length - 1; i++) for (const k of ["pos", "look"]) for (const c of [0, 2]) camera[i][k][c] = +((camera[i - 1][k][c] + 2 * camera[i][k][c] + camera[i + 1][k][c]) / 4).toFixed(3);
const sb = {
  id: `preview-${clip}`, title: `Preview ${clip}`, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  set: { type: "park", seed: 4, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },   // (a plain set: a painted env refuses a camera that travels)
  sound: { sfx: 0, ambience: 0 }, creative: { notes: false },
  cast: [{ id: "h", character, at: [0, -3], face: "camera", expr: "kind", seed: 1.3, perform: [seg] }],
  props: [], beats: [{ name: "a", at: 0, len: dur, do: [] }], camera, duration: +dur.toFixed(2),
};
fs.writeFileSync(`storyboards/human/preview-${clip}.json`, JSON.stringify(sb, null, 1));
const ts = []; for (let t = 0.02; t <= dur; t += +step) ts.push(t.toFixed(2));
console.log(ts.join(","));
