// Design check for the two duel fighters (Teo, Ryn: firebender duel, 7 Nov 2026): both in a guard, front three-quarter
// then from behind (headband tails, sash), so the clothes can be judged before any clip uses them.
//   node tools/human/make-duel-design.mjs -> storyboards/human/duel/duel-design.json
import fs from "node:fs";
import { Performance, prepClip, worldPose } from "../../engine/page/rigs/human-perform.js";
const C = { c76_04: prepClip(JSON.parse(fs.readFileSync("assets/mocap/c76_04.json", "utf8"))) };
const where = (x, h) => { const W = worldPose(new Performance([seg(x, h)], C, [], 0.845).at(0.8)); return W.root.start; };
const seg = (x, h) => ({ at: 0, clip: "c76_04", from: 1.0, to: 3.0, speed: 0.5, blend: 0, heading: h, place: [x, -3] });
const sb = {
  id: "duel-design", title: "Duel fighters design check", fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  set: { type: "park", seed: 4, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  sound: { sfx: 0, ambience: 0 }, music: false, creative: { notes: false },
  cast: [
    { id: "teo", character: "human/teo", at: [-0.55, -3], face: { angry: 0.5 }, seed: 1.3, perform: [seg(-0.42, 20)], fingers: [[0, 0.95, 0.95]] },
    { id: "ryn", character: "human/ryn", at: [0.55, -3], face: { angry: 0.5 }, seed: 2.1, perform: [seg(0.42, -20)], fingers: [[0, 0.95, 0.95]] },
  ],
  props: [],
  beats: (() => { const a = where(-0.42, 20), b = where(0.42, -20), m = a.clone().add(b).multiplyScalar(0.5);
    return [{ name: "front", at: 0, len: 2, do: [], shot: { pos: [m.x, 1.35, m.z + 3.0], look: [m.x, 1.05, m.z], fov: 40 } }, { name: "back", at: 2, len: 2, do: [], shot: { pos: [m.x + 0.6, 1.4, m.z - 3.0], look: [m.x, 1.05, m.z], fov: 40 } }]; })(),
  duration: 4,
};
fs.writeFileSync("storyboards/human/duel/duel-design.json", JSON.stringify(sb, null, 1));
console.log("ok");
