// The human friends (Jonny, 19 Nov 2026): all four together at their real sizes on the plain turnaround stage, in the
// order of the picked line-up (Spud, Chip, Wedge, Mash): they walk up in a row, say hello each in their own way, then
// turn once round so every back shows.
//   node storyboards/characters/make-human-friends-lineup.mjs   -> storyboards/characters/human-friends-lineup.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
// where each stands in the row; Mash's walk rhythm is his own (a move's "steps": stride cycles a second), the others
// take the engine's
const ROW = [["spud", -1.1], ["chip", -0.4], ["wedge", 0.4], ["mash", 1.3]], Z0 = -2.0, CAD = { mash: 1.15 };
const Q = 1.6, R = 0.25, RA = (90 / Q) * R / 3;
const turnSteps = [[RA, R, "in"], [90, Q * (90 - RA) / 90, "linear"], [180, Q, "linear"], [270, Q, "linear"], [360 - RA, Q * (90 - RA) / 90, "linear"], [360, R, "out"]];
const turnLen = turnSteps.reduce((n, s) => n + s[1], 0);

const { camera, beats: _b, cast: _c, ...rest } = turnaround("human-friends", "human-friends/mash", "sheet");
const WALK = 3.9, HELLO = 3.6, HOP = WALK + 0.9;
write({
  ...rest, id: "human-friends-lineup", title: "Human friends line-up", frame: "wide",
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, gate: 2, cleanStart: true,
  drawn: { ...rest.drawn, twos: false },   // as the walk-and-act test: the checks' per-frame limits are in potato centimetres
  creative: { length: [4, 25], notes: false },
  allowClip: [{ who: "chip", from: HOP - 0.05, to: HOP + 1.3, checks: ["motion", "rig-jump"], reason: "his two hops: the 0.1 s anticipation crouch before each and the landing move hips and feet a few cm in a frame (the limits are in potato centimetres)" }],
  shots: [{ at: 0, pos: [0.1, 0.85, 4.05], look: [0.1, 0.75, 0], fov: 30 }],
  cast: ROW.map(([n, x], i) => ({ id: n, character: `human-friends/${n}`, at: [x, Z0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 + i * 0.7 })),
  beats: [
    { name: "walk up", at: 0, len: WALK, do: ROW.map(([n, x], i) => ({ who: n, do: "move", at: 0.15 + i * 0.12, to: [x, 0], dur: 3.0, ...(CAD[n] ? { steps: CAD[n] } : {}) })) },
    { name: "hello", len: HELLO, do: [
      { who: "spud", do: "expr", at: 0.2, expr: "happy" },
      { who: "spud", do: "arm", at: 0.3, side: "R", pose: { o: [0.14, 1.15, 0.08], elbow: 0.05 }, dur: 0.5 },
      ...[0.2, 0.12, 0.2, 0.12].map((out, i) => ({ who: "spud", do: "arm", at: +(0.85 + i * 0.24).toFixed(2), side: "R", pose: { o: [out, 1.15, 0.08], elbow: 0.05 }, dur: 0.24 })),
      { who: "spud", do: "arm", at: 2.0, side: "R", pose: "rest", dur: 0.5 },
      { who: "spud", do: "expr", at: 2.6, expr: "kind" },
      { who: "chip", do: "expr", at: 0.5, expr: "delighted" },
      { who: "chip", do: "hop", at: 0.9, count: 2, height: 0.08, dur: 1.2, quiet: true },
      { who: "chip", do: "expr", at: 2.6, expr: "kind" },
      { who: "wedge", do: "expr", at: 0.6, expr: "cocky" },
      ...[[1.0, -0.8], [1.25, 0.1], [1.5, 0]].map(([at, v]) => ({ who: "wedge", do: "look", at, to: [0, v], dur: 0.2 })),
      { who: "wedge", do: "expr", at: 2.6, expr: "kind" },
      { who: "mash", do: "look", at: 0.8, to: [-0.8, -0.3], dur: 0.3 },   // a glance down the row at the others
      { who: "mash", do: "look", at: 2.2, to: [0, 0], dur: 0.3 },
    ] },
    { name: "turn", len: +(turnLen + 0.9).toFixed(2), do: ROW.flatMap(([n]) => turnSteps.map(([to, dur, ease], i) => ({ who: n, do: "turn", at: +(0.3 + turnSteps.slice(0, i).reduce((s, x) => s + x[1], 0)).toFixed(4), to, dur: +dur.toFixed(4), ease }))) },
  ],
});
