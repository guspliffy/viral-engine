// Engine demo for the living world (set "life", engine/page/set-life.js, 7 Nov 2026; research in
// /mnt/project-files/research/living-worlds-2026-11-07): the meadow road of the env demo, but alive. Gusts run over
// the grass and through the trees (and you hear each one), cloud shadows slide over the far hills, the sky drifts,
// sparrows hop and peck on the road ahead, butterflies work the flowers on the bank, and a strong gust shakes a few
// leaves loose. Then Phoenix sees the view and lets out a loud "WOO-HOO!": the sparrows burst off the road, away
// from him and up past the camera, the birdsong stops, and Reaper glares at him. Pure engine test.
//   node storyboards/env/make-living-meadow.mjs            -> living-meadow.json (life on) + living-meadow-still.json (life off)
//   node engine/render.mjs storyboards/env/living-meadow.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip } from "../lib/clip.mjs";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const ENV = "meadow-path";
const E = JSON.parse(fs.readFileSync(path.join(OUT, "../../assets/environments", ENV, "env.json"), "utf8"));
const [ex, ey, ez] = E.eye.pos;

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, cap, sfx } = c, END = 9.6;
const PHX0 = [-0.12, -3.9], REA0 = [0.84, -4.9], PHX1 = [-0.3, -1.6], REA1 = [0.62, -2.5];
const SHOUT = 5.0;

// 1 WALK 0-3.9: already walking at frame 0; the sparrows on the road ahead don't mind them
A(0, "phx", "noblink"); A(0, "rea", "noblink");
A(0, "phx", "move", { to: PHX1, dur: 3.6, steps: 2.2 });
A(0.08, "rea", "move", { to: REA1, dur: 3.55, steps: 2.6 });
A(1.2, "rea", "look", { to: [-0.6, 0.1], dur: 0.25 });
A(2.0, "rea", "look", { to: [0, 0.05], dur: 0.3 });
A(2.4, "phx", "look", { to: [0.5, 0.45], dur: 0.3 });           // the view catches Phoenix's eye
// 2 THE VIEW 3.7-5.0: he stops, turns to it, fills up with joy
A(3.75, "phx", "look", { to: [0.4, 0.45], dur: 0.35 });   // facing us, eyes on the view (a turn would aim his cheer at Reaper)
A(4.1, "phx", "expr", { expr: "delighted", dur: 0.25 });
A(4.15, "rea", "look", { to: [-0.4, 0.5], dur: 0.3 });
A(4.6, "rea", "expr", { expr: "kind", dur: 0.3 });
// 3 THE SHOUT 5.0: both arms up, wings open, as loud as he can
A(SHOUT - 1.25, "phx", "arm", { side: "R", pose: { o: [0.08, 0.62, 0.3] }, dur: 0.7, lead: false });   // up in two stages: out in front first, so the palm never flips
A(SHOUT - 0.55, "phx", "arm", { side: "R", pose: { o: [0.1, 1.08, 0.12] }, dur: 0.5, lead: false });
A(SHOUT - 1.25, "phx", "arm", { side: "L", pose: { o: [0.08, 0.62, 0.3] }, dur: 0.7, lead: false });   // up in two stages: out in front first, so the palm never flips
A(SHOUT - 0.55, "phx", "arm", { side: "L", pose: { o: [0.1, 1.08, 0.12] }, dur: 0.5, lead: false });
A(SHOUT - 0.3, "phx", "wings", { to: 1, dur: 0.3 });
c.say(SHOUT, "phx", "WOO-HOO!", 0.7, "excited", { sub: "WOO-HOO!" });
// 4 THE WORLD ANSWERS 5.1-6.5: the sparrows go (set.life.startle below); Reaper flinches, then turns on him
A(SHOUT + 0.05, "rea", "expr", { expr: "shocked", dur: 0.12 });
A(SHOUT + 0.1, "rea", "look", { to: [-0.5, 0.2], dur: 0.15 });
A(SHOUT + 0.55, "rea", "look", { to: [0.2, 0.6], dur: 0.25 });   // watching the birds go over
A(SHOUT + 1.3, "rea", "look", { to: [-0.6, 0.15], dur: 0.25 });
A(SHOUT + 1.35, "rea", "expr", { expr: "annoyed", dur: 0.3 });
A(SHOUT + 0.9, "phx", "wings", { to: 0.3, dur: 0.6 });
A(SHOUT + 0.9, "phx", "arm", { side: "R", pose: "rest", dur: 1.35 });
A(SHOUT + 0.9, "phx", "arm", { side: "L", pose: "rest", dur: 1.35 });

A(SHOUT + 1.7, "phx", "look", { to: [0.6, 0.0], dur: 0.25 });
A(SHOUT + 1.75, "phx", "expr", { expr: "eager", dur: 0.25 });     // "...what?"
// 5 QUIET 7.5-9.6: the meadow goes on without the birds
A(SHOUT + 2.7, "rea", "look", { to: [0, 0.1], dur: 0.3 });
A(SHOUT + 2.8, "rea", "expr", { expr: "deadpan", dur: 0.3 });
cap(0, 2.4, "living world test", 300, false, { kinetic: false });

const p = (E.eye.pitch * Math.PI) / 180, ahead = (pos, k = 10) => [pos[0], pos[1] - Math.sin(p) * k, pos[2] - Math.cos(p) * k];
const W0 = [ex - 0.3, ey, ez + 0.15], W1 = [ex + 0.3, ey, ez];
const WIDE = { pos: W0, look: ahead(W0), fov: 36, to: { pos: W1, look: ahead(W1) }, dur: 3.9, ease: "inOut" };
const C0 = [0.32, 0.86, 2.7], C1 = [0.22, 0.86, 2.45];
const CLOSE = { pos: C0, look: [0.03, 0.8, -1.6], fov: 38, to: { pos: C1, look: [0.03, 0.82, -1.6] }, dur: 5.7, ease: "inOut" };

const LIFE = {
  seed: 11,
  wind: { speed: 3.2, every: [2.4, 4.2], first: 0.8 },
  clouds: { drift: 0.0035, shadow: 0.32, speed: 4, scale: 16, near: 14 },
  // background life stays in the background (Jonny 7 Nov): a few sparrows on the far road behind the pair and
  // three on the bare branch and the edge of the left tree; on the shout they all go up and away, into the distance
  birds: [
    { flock: { n: 5, at: [0.2, -6.9], r: 0.5 } },
    { perch: [222, 1418], card: "mid-1", yaw: 70 }, { perch: [252, 1409], card: "mid-1", yaw: -40 }, { perch: [338, 1282], card: "mid-1", yaw: 20 },
  ],
  butterflies: { n: 3, at: [[-0.75, 0.45, -0.7], [-1.2, 0.55, -2.3], [1.15, 0.5, -1.4]], r: 0.4, color: "#f0a23a" },
  leaves: { from: [[1.6, 2.6, -1.8], [-1.9, 2.8, -3.5]], n: 2 },
  startle: [{ t: SHOUT, at: PHX1, loud: 1 }],
  song: 1,
};

const base = (id, life) => ({
  id, title: `Living world: meadow road (engine demo${!life ? ", life off" : life.storm ? ", storm" : ""})`,
  idea: "Engine demo, not a clip: living, reactive backgrounds (set.life)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "env", env: ENV, shade: "soft", aperture: 0, focus: false, ...(life ? { life } : {}), ...(life?.storm ? { sway: 2, grade: "storm" } : {}) },
  drawn: { lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0, wash: 0.09, pool: 0.15 } },
  music: { style: "lofi", seed: 41, gain: life?.storm ? 0.4 : 0.6 }, sound: { sfx: 0.8, ambience: life ? 0.9 : 0.5 },
  creative: { length: [6, 20], notes: false },
  hook: { show: ["phx", "rea"], hint: 0, what: "engine demo" },
  cast: [
    { id: "phx", character: "duo/phoenix", at: PHX0, face: "camera", expr: "kind", follow: 0.3, seed: 1.7, span: 0 },
    { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: "camera", expr: "kind", follow: 0.3, seed: 2.2 },
  ],
  props: [],
  duration: END,
  notes: "Generated by storyboards/env/make-living-meadow.mjs (engine demo).",
});
const beats = c.beats([["walk", 0, WIDE], ["view", 3.9, CLOSE]], END);
// the same walk on a stormy day: the wind bends the trees from the trunk, leaves fly, a light rain slants, the sky goes
// grey and races; the butterflies are sheltering and the birds in the tree sit tight until the shout
const STORM = { ...LIFE, seed: 23, storm: true, song: 0, wind: undefined, clouds: undefined, butterflies: null, leaves: { from: [[1.6, 2.6, -1.8], [-1.9, 2.8, -3.5]], n: 3, color: "#7f9a3c" },
  birds: LIFE.birds.filter((b) => b.perch) };
for (const [file, life] of [["living-meadow.json", LIFE], ["living-meadow-still.json", null], ["living-meadow-storm.json", STORM]]) {
  const sb = { ...base(file.replace(".json", ""), life), beats };
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(sb, null, 1) + "\n");
  console.log(`wrote storyboards/env/${file}`);
}
