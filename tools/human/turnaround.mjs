// A character turnaround for a human (rig vrm-v1) character: the same standing moment seen from five sides (front,
// 3/4 front, side, 3/4 back, back), one beat each, camera fixed, so the stills line up like a model sheet.
//   node tools/human/turnaround.mjs [character=human/first-01] [clip=stand] [t=0.5]
// writes storyboards/human/turnaround-<name>.json and prints the still times
import fs from "node:fs";
const [character = "human/first-01", clip = "stand", t0 = "0.5"] = process.argv.slice(2);
const HEAD = [0, 35, 90, 145, 180], LEN = 0.6, from = +t0;
const perform = HEAD.map((h, i) => ({ at: i * LEN, clip, from, to: from, heading: h, place: [0, -1.0], blend: 0 }));
const name = character.split("/").pop();
const sb = {
  id: `turnaround-${name}`, title: `Turnaround ${name}`, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  set: { type: "park", seed: 4, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0 } },
  sound: { sfx: 0, ambience: 0 }, creative: { notes: false },
  cast: [{ id: "h", character, at: [0, -1.0], face: "camera", expr: "kind", seed: 1.3, perform }],
  props: [], beats: HEAD.map((h, i) => ({ name: `h${h}`, at: i * LEN, len: LEN, do: [] })),
  camera: [{ at: 0, pos: [0, 1.0, 3.6], look: [0, 0.9, -1.0], fov: 34 }],
  duration: HEAD.length * LEN,
};
fs.writeFileSync(`storyboards/human/turnaround-${name}.json`, JSON.stringify(sb, null, 1));
console.log(HEAD.map((_, i) => (i * LEN + 0.3).toFixed(2)).join(","));
