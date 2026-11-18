// Bench for the 3D hilltop (engine/page/set-score-hill.js, type "scorehill"), task SET-HT. Not a clip: stills, one per beat, 0.6 s into each beat.
//   node .../bench/hill/make-hill-bench.mjs gold     -> hill-gold.json   (a painting cam W | b 43 | c painting cam E | d 39 east | e overview | f 44 east)
//   node .../bench/hill/make-hill-bench.mjs sunset   -> hill-sunset.json (a painting cam W2 | b 47 | c east sunset (48) | d overview)
//   node engine/render.mjs storyboards/series/happiness/03-happiness-score/bench/hill/hill-gold.json --stills 0.6,1.6,2.6,3.6,4.6,5.6 --draft --safe
import { clip, write } from "../../../../../lib/clip.mjs";

const MODE = process.argv[2] === "sunset" ? "sunset" : "gold";
const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const FAR = 80;
const look = (pos, pitch, yaw = 0) => { const L = 10, p = pitch * Math.PI / 180, y = yaw * Math.PI / 180; return [pos[0] + Math.sin(y) * L, pos[1] + Math.tan(p) * L, pos[2] - Math.cos(y) * L]; };
const cam = (pos, pitch, fov, yaw = 0) => ({ pos, look: look(pos, pitch, yaw), fov });
const E = (pos, pitch, fov, yaw = 0) => { const q = cam(pos, pitch, fov, yaw); q.look[2] = pos[2] + (pos[2] - q.look[2]); q.look[0] = pos[0] - (q.look[0] - pos[0]); return q; };   // looks down +z
const props = [
  { id: "bench", kind: "hillbench", x: 0, y: 0, z: -1.2, rot: 180, scale: 1 },
  { id: "bk0", kind: "seatmark", x: -1, y: 0, z: -2.55, rot: 180 }, { id: "bk1", kind: "seatmark", x: 0, y: 0, z: -2.55, rot: 180 }, { id: "bk2", kind: "seatmark", x: 1, y: 0, z: -2.55, rot: 180 },
];
const cast = [], beats = [];
if (MODE === "sunset") { props[0].x = FAR; c.prop(2.0, "bench", { x: 0 }, 0.01, "linear"); }   // 47 has no bench in the way; 48 does
const who = (id, ch, face = 0) => cast.push({ id, character: "potatobrawl/" + ch, at: [FAR, 0], y: 0, face, expr: "kind", follow: 0.2, seed: 1.3 });
const park = (t, id) => { c.A(t, id, "stand", { dur: 0.01 }); c.A(t + 0.02, id, "move", { to: [FAR, 0], y: 0, dur: 0.01 }); };
const sitBench = (t, id, along) => c.A(t, id, "sit", { seat: "bench", along, dur: 0.01, hands: "lap" });
const stand = (t, id, to, face) => { c.A(t, id, "move", { to, y: 0, dur: 0.01 }); if (face != null) c.A(t, id, "turn", { to: face, dur: 0.01 }); };

if (MODE === "gold") {
  who("mashB", "mash"); who("spudB", "spud"); who("mashD", "mash"); who("spudD", "spud"); who("mashF", "mash"); who("spudF", "spud"); who("chipF", "chip"); who("wedgeF", "wedge");
  // b (t 1): panel 43, Mash and Spud on the bench seen from behind
  sitBench(1.0, "mashB", 0.48); sitBench(1.0, "spudB", -0.47); park(1.95, "mashB"); park(1.95, "spudB");
  // d (t 3): panel 39 from the east: Mash on the bench, Spud standing at x 2.0 facing the camera
  sitBench(3.0, "mashD", 0.48); stand(3.0, "spudD", [2.2, -0.6]); park(3.95, "mashD"); park(3.95, "spudD");
  // f (t 5): panel 44: both on the bench, Chip and Wedge sitting on the grass in front
  sitBench(5.0, "mashF", 0.48); sitBench(5.0, "spudF", -0.47);
  c.A(5.0, "chipF", "move", { to: [1.5, -2.15], y: 0, dur: 0.01 }); c.A(5.0, "wedgeF", "move", { to: [2.7, -2.2], y: 0, dur: 0.01 });
  beats.push(["a", 0, cam([0, 1.25, 5.2], -6, 38), "painting cam W (golden)"], ["b", 1, cam([0, 1.25, 5.2], -6, 36), "panel 43"], ["c", 2, E([0, 1.1, -4.4], -6, 38), "painting cam E"],
    ["d", 3, E([0.4, 0.95, -4.4], -4, 40), "panel 39 (east)"], ["e", 4, { pos: [-13, 4.5, 11], look: [0, 1.8, -1.5], fov: 54 }, "overview"], ["f", 5, E([0.8, 0.85, -4.6], -2, 42), "panel 44 (east)"]);
} else {
  who("chipB", "chip"); who("spudB", "spud"); who("wedgeB", "wedge"); who("spudC", "spud");
  c.A(1.0, "chipB", "sit", { seat: "bk0", height: 0.06, dur: 0.01, hands: "lap" }); c.A(1.0, "spudB", "sit", { seat: "bk1", height: 0.06, dur: 0.01, hands: "lap" }); c.A(1.0, "wedgeB", "sit", { seat: "bk2", height: 0.06, dur: 0.01, hands: "lap" });
  for (const id of ["chipB", "spudB", "wedgeB"]) park(1.95, id);
  stand(2.0, "spudC", [-1.5, -1.0], 160);
  beats.push(["a", 0, cam([0.6, 0.8, 0.4], -0.5, 36), "painting cam W2 (sunset)"], ["b", 1, cam([0.6, 0.8, 0.4], 2, 34), "panel 47"], ["c", 2, E([0.2, 1.0, -3.6], -4, 40), "panel 48 (east, sunset)"],
    ["d", 3, { pos: [-13, 4.5, 11], look: [0, 1.8, -1.5], fov: 54 }, "overview"]);
}
const KEY = MODE === "sunset" ? [-2.2, 1.6, -4.6] : [-1.2, 3.3, -4.2];
write(import.meta.url, {
  id: "hill-" + MODE, title: "Hilltop set bench", idea: "Set bench for Happiness 03 (set scorehill), not a clip", fps: 30, frame: "wide", look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "scorehill", time: MODE === "sunset" ? "sunset" : "golden", light: "golden", windows: false, key: KEY, shadowSize: 9, stats: true, birdAt: Number(process.env.BIRDAT ?? 0.5), birdDur: 40 }, music: false, sound: { auto: false },
  hook: { show: [cast[0].id], hint: 0, what: "engine test" }, cast, props, captions: c.captions, beats: c.beats(beats, beats.length), notes: "Generated by bench/hill/make-hill-bench.mjs (set bench, no reviews).",
});
