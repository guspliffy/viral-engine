// FRIENDS TRY TO 11: BALLOON BENCH (not a clip). Every kind of engine/page/props-balloon.js on the scorehill set (season spring):
// the rig at world (6.0, 0, -0.7) burning at full blast and straining, three sandbags hung on the basket and dropped (c.drop at
// 1.0 / 1.2 / 1.4 s), then from 2.5 s the PROP'S OWN y rising to 3 while `free` goes 0 -> 1 over 1.6 s (the stakes rip out and dangle).
//   node storyboards/series/friends-try-to/11-hot-air-balloon/make-balloon-bench.mjs [--cam 1|2|3|4|5|6|8|9|10|11|12|flame|burner|top|side] [--ride] [--end 5] [--burn 1] [--strain 1]
//        -> balloon-bench.json (camera 1), balloon-bench-cam5.json, ...; --ride adds the four friends riding the rig (-ride in the id)
//   node engine/render.mjs <json> --stills 0.5,2.0,4.5 --draft --safe
// The camera numbers are the panels of DESIGN-balloon.md section 8 (rig frame; the bench adds the rig's world place).
import "../../../../engine/page/costumes.js";   // (node only: the page modules import each other in a circle unless costumes.js comes first)
import { BALLOON } from "../../../../engine/page/props-balloon.js";
import { clip, write, r3 } from "../../../lib/clip.mjs";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const BURN = Number(arg("--burn", 1)), STRAIN = Number(arg("--strain", 1));
const CAM = String(arg("--cam", "1")), RIDE = process.argv.includes("--ride"), END = Number(arg("--end", 5));
const RIG = [6.0, 0, -0.7];   // the rig's origin in the world (the set's flat grass, the oak's reach 0.2 m clear)
const SHOTS = {   // panel: [pos, look, fov] in the rig frame
  1: [[0.2, 0.5, 8.4], [0, 3.6, 0], 56], 2: [[-2.6, 0.14, 2.1], [-0.75, 1.15, 0.25], 56], 3: [[0, 1.25, 6.6], [0, 1.3, 0], 44], 4: [[0.3, 0.7, 6.4], [0, 2.5, 0], 50],
  5: [[0, 1.2, 4.6], [0, 1.95, 0], 42], 6: [[0.15, 0.85, 5.9], [0.15, 1.45, 0], 44], 8: [[0.4, 0.9, 5.4], [0.4, 1.4, 0], 44], 9: [[-0.3, 1.05, 3.1], [-0.3, 1.62, 0], 42],
  burner: [[0.3, 2.2, 3.4], [0, 3.4, 0], 40], flame: [[0.6, 0.9, 1.9], [0, 3.7, 0], 50], top: [[0, 9, 14], [0, 5.5, 0], 40], side: [[14, 4, 0.5], [0, 4, 0], 40],
  10: [[-0.1, 2.0, 8.4], [-0.1, 2.3, 0], 44], 11: [[-0.05, 0.5, 3.0], [-0.05, 1.2, 0], 52], 12: [[-0.4, 0.75, 10.4], [-0.9, 3.75, 0], 50],
};
if (!SHOTS[CAM]) { console.error(`--cam ${CAM}: use ${Object.keys(SHOTS).join(", ")}`); process.exit(2); }
const add = (p, q) => p.map((v, i) => r3(v + q[i]));
const [cp, cl, fov] = SHOTS[CAM];

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A } = c;
const cast = [];
if (RIDE) {
  // the cast ride the rig: { do: "ride", prop, off: [x, stand y, z] in the rig frame, dur 0 } at once, facing +z; they rise with the prop's own y
  const PL = BALLOON.places;
  for (const [id, who] of [["spud", "spud"], ["wedge", "wedge"], ["chip", "chip"], ["mash", "mash"]]) {
    const [x, z, y] = PL[who];
    cast.push({ id, character: `potatobrawl/${who}`, at: [RIG[0] + x, RIG[2] + z], y: RIG[1] + y, face: 0, expr: "kind", follow: 0.3, seed: 2.3 });
    A(0, id, "ride", { prop: "rig", off: [x, y, z], yaw: 0, dur: 0 });
  }
}

// the sandbags hang on the three toggles (design: centre at radius 1.14 on the toggle's az, y 0.36, 0.02 off the wall); origin = bottom centre
const props = [
  { id: "valley", kind: "dawnvalley", x: RIG[0], y: RIG[1], z: RIG[2], staged: "sky and far scenery, nothing stands on it" },
  { id: "rig", kind: "balloon", x: RIG[0], y: RIG[1], z: RIG[2], rot: 0 },
  ...BALLOON.hung.az.map((az, i) => ({ id: `bag${i}`, kind: "sandbag", x: r3(RIG[0] + BALLOON.hung.r * Math.sin(az * Math.PI / 180)), y: r3(RIG[1] + BALLOON.hung.y - 0.125), z: r3(RIG[2] + BALLOON.hung.r * Math.cos(az * Math.PI / 180)), rot: az, seed: i + 1, body: BALLOON.sandbag.body, staged: "hung by its rope loop on the basket's toggle until it is dropped" })),
  { id: "mist", kind: "fogveil", box: [[-40, -9, -60], [50, -1.5, -8]], n: 60, size: 9, color: "#f6e7dc", on: 0.8 },
];
c.prop(0, "rig", { burn: BURN, strain: STRAIN, sway: 0.5 }, 0.01);
[1.0, 1.2, 1.4].forEach((t, i) => c.drop(t, `bag${i}`));
// the lift: the prop's own y (the cast ride it), the free key 0 -> 1 in 1.6 s; the ground parts stay down by themselves
c.prop(2.5, "rig", { y: 3 }, 2.5, "in");
c.prop(2.5, "rig", { free: 1 }, 1.6, "linear");

const beats = c.beats([["bench", 0, { pos: add(RIG, cp), look: add(RIG, cl), fov }]], END);
write(import.meta.url, {
  id: CAM === "1" && !RIDE && BURN === 1 && STRAIN === 1 ? "balloon-bench" : `balloon-bench${CAM === "1" ? "" : `-cam${CAM}`}${RIDE ? "-ride" : ""}${BURN === 1 ? "" : `-burn${BURN}`}${STRAIN === 1 ? "" : `-strain${STRAIN}`}`, title: "Friends try to 11 balloon bench", idea: "props-balloon.js on the scorehill set (spring): balloon, three sandbags, dawnvalley", fps: 30,
  look: "anime-pro", profile: "short", loop: false, castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  set: { type: "scorehill", time: "golden", view: "west", backdrop: false, light: "golden", windows: false, key: [0.6, 1.9, -4.4], shadowSize: 10, leaves: 4, birds: 5, birdAt: 3, season: "spring" },
  sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props, captions: c.captions, beats, visible: c.visible,
  notes: "Bench for engine/page/props-balloon.js (friends try to 11). Not a clip.",
});
