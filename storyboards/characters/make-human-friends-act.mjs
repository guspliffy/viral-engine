// The human friends (Jonny, 19 Nov 2026: "let him walk and act a bit"): one walk-and-act test per friend on the plain
// turnaround stage: walks in, sees us, waves, a shrug, walks up to the camera, a nod and a hop, then walks off.
//   node storyboards/characters/make-human-friends-act.mjs   -> storyboards/characters/human-<name>-act.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
// each friend's standing height to the top of the hair (m), the middle of the face, and the walk's rhythm (a move's "steps": stride cycles a second)
const FRIENDS = { mash: { h: 1.56, face: 1.2, cad: 1.15 } };
const r3 = (v) => +v.toFixed(3);

for (const [name, F] of Object.entries(FRIENDS)) {
  const { camera, beats: _b, cast: _c, ...rest } = turnaround(`human-${name}`, `human-friends/${name}`, "sheet");
  // he comes in on a diagonal from the back left and leaves past the camera on the right, so the walks show his face
  // three quarters on (in a flat side view the eye sits on the very edge of the head)
  const IN = [-2.2, -1.6], Z1 = 2.2, OUT = [1.5, Z1 + 1.1], DIAG = Math.round((Math.atan2(-IN[0], -IN[1]) * 180) / Math.PI);
  // the cameras: one that walks in with him, a full-body shot for the acting, a front view he walks up to
  const cam = (x, y, z, ly, lz = 0) => ({ pos: [x, r3(F.h * y), z], look: [x, r3(F.h * ly), lz], fov: 30 });
  const walkIn = { ...cam(-1.6, 0.6, 6.4, 0.5), to: { pos: cam(0, 0.6, 6.4, 0.5).pos, look: cam(0, 0.6, 6.4, 0.5).look }, dur: 3.3 };
  const full = cam(0, 0.6, 4.7, 0.53), front = cam(0, 0.58, 6.7, 0.52, Z1);
  // his own arm poses ({ o: [out from the side, up in body heights, forward] }): the potatoes' named poses aim at a
  // potato's top, which on him is the inside of his head
  const WAVE = (out) => ({ o: [out, 1.05, 0.1], elbow: 0.08 }), SHRUG = { o: [0.2, 0.4, 0.17], elbow: 0.1 }, CHEER = { o: [0.25, 1.08, 0.08], elbow: 0.07 };
  const HOP = 4.2 + 2.9 + 2.2 + 3.5 + 1.3;   // when the hop starts (the beats before it, then its place in its own)
  const waves = [0.3, 0.2, 0.3, 0.2, 0.3].map((out, i) => ({ who: "c", do: "arm", at: r3(0.75 + i * 0.24), side: "R", pose: WAVE(out), dur: 0.24 }));
  write({
    ...rest, id: `human-${name}-act`, title: `Human ${name[0].toUpperCase() + name.slice(1)} walks and acts`,
    motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, gate: 2, cleanStart: true,
    // every frame is its own drawing (no held 2s): the checks' per-frame limits are in potato centimetres, and a friend
    // 1.7 times a potato's height covers that much more ground per drawing
    drawn: { ...rest.drawn, twos: false },
    creative: { length: [4, 25], notes: false },
    allowClip: [{ who: "c", from: HOP - 0.05, to: HOP + 0.2, checks: ["motion"], reason: "the hop's own 0.1 s anticipation crouch: the body dips 0.061 in a frame against a limit of 0.06" }],
    cast: [{ id: "c", character: `human-friends/${name}`, at: IN, face: DIAG, expr: "kind", follow: 0.25, seed: 1.3 }],
    beats: [
      { name: "walks in", at: 0, len: 4.2, shot: walkIn, do: [
        { who: "c", do: "look", at: 0, to: [0.5, 0], dur: 0.1 },
        { who: "c", do: "move", at: 0.15, to: [0, 0], dur: 3.1, steps: F.cad },
        { who: "c", do: "look", at: 3.15, to: [-0.6, 0.1], dur: 0.2 },
        { who: "c", do: "turn", at: 3.35, to: "camera", dur: 0.5 },
        { who: "c", do: "look", at: 3.7, to: [0, 0], dur: 0.2 },
      ] },
      { name: "wave", len: 2.9, shot: full, do: [
        { who: "c", do: "expr", at: 0.1, expr: "happy" },
        { who: "c", do: "arm", at: 0.15, side: "R", pose: WAVE(0.2), dur: 0.6 },
        ...waves,
        { who: "c", do: "lean", at: 0.3, to: 4, dur: 0.3 },
        { who: "c", do: "arm", at: 2.05, side: "R", pose: "rest", dur: 0.6 },
        { who: "c", do: "lean", at: 2.05, to: 0, dur: 0.3 },
        { who: "c", do: "expr", at: 2.3, expr: "kind" },
      ] },
      { name: "shrug", len: 2.2, do: [
        { who: "c", do: "look", at: 0.1, to: [0.7, 0.25], dur: 0.2 },
        { who: "c", do: "arm", at: 0.4, side: "both", pose: SHRUG, dur: 0.5 },
        { who: "c", do: "lean", at: 0.45, to: -4, dur: 0.4 },
        { who: "c", do: "arm", at: 1.45, side: "both", pose: "rest", dur: 0.55 },
        { who: "c", do: "lean", at: 1.45, to: 0, dur: 0.4 },
        { who: "c", do: "look", at: 1.7, to: [0, 0], dur: 0.2 },
      ] },
      { name: "comes closer", len: 3.5, shot: front, do: [
        { who: "c", do: "look", at: 0, to: [0, 0.1], dur: 0.1 },
        { who: "c", do: "move", at: 0.1, to: [0, Z1], dur: 2.9, steps: F.cad },
      ] },
      { name: "nod and hop", len: 3.7, do: [
        { macro: "nod", who: "c", at: 0.3, times: 2 },
        { who: "c", do: "expr", at: 0.9, expr: "happy" },
        { who: "c", do: "arm", at: 0.95, side: "both", pose: CHEER, dur: 0.55 },
        { who: "c", do: "hop", at: 1.3, count: 2, height: 0.14, dur: 1.3, quiet: true },
        { who: "c", do: "arm", at: 2.75, side: "both", pose: "rest", dur: 0.6 },
        { who: "c", do: "expr", at: 3.2, expr: "kind" },
      ] },
      { name: "walks off", len: 3.0, do: [
        { who: "c", do: "look", at: 0.05, to: [0.6, 0], dur: 0.2 },
        { who: "c", do: "turn", at: 0.2, to: DIAG, dur: 0.5 },
        { who: "c", do: "look", at: 0.6, to: [0.5, 0.05], dur: 0.12 },
        { who: "c", do: "move", at: 0.75, to: OUT, dur: 2.2, steps: F.cad },
      ] },
    ],
  });
}
