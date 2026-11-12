// Spud's everyday friends (Jonny, 12 Nov 2026): one test clip each for Chip, Wedge and Mash, the same three shots as
// Spud's (make-spud-test.mjs): a slow full turn, three faces in close-up with the leaf showing the mood, then the size
// line-up of all four friends (the group stands 3 m along the stage, so a cut takes us there).
//   node storyboards/characters/make-everyday-test.mjs   -> storyboards/characters/{chip,wedge,mash}-test.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
const LEG = 0.14, SPUD = LEG + 0.88;   // top of Spud's head
// each friend's body height (characters/potatobrawl/*.json), for the camera
const FRIENDS = { chip: 0.53, wedge: 0.98, mash: 1.24 };

const Q = 1.45, R = 0.25, RA = (90 / Q) * R / 3;   // a quarter turn (s); the turn eases in and out over R s and RA degrees
const turnSteps = [[RA, R, "in"], [90, Q * (90 - RA) / 90, "linear"], [180, Q, "linear"], [270, Q, "linear"], [360 - RA, Q * (90 - RA) / 90, "linear"], [360, R, "out"]];
const turnEnd = 0.35 + turnSteps.reduce((n, s) => n + s[1], 0), T1 = +(turnEnd + 0.2).toFixed(2), T2 = +(T1 + 3.55).toFixed(2);
const X = -3;   // where the group stands (its shadows fall away from the solo shot)

for (const [name, h] of Object.entries(FRIENDS)) {
  const k = (LEG + h) / SPUD, r3 = (v) => +v.toFixed(3);
  const { camera, ...rest } = turnaround(name, `potatobrawl/${name}`, "sheet");
  write({
    ...rest, id: `${name}-test`, title: `${name[0].toUpperCase() + name.slice(1)} test`,
    shots: [
      { at: 0, pos: [0, r3(0.82 * k), r3(4.3 * Math.max(0.85, k))], look: [0, r3(0.68 * k), 0], fov: 30 },
      { at: T1, pos: [0, r3(0.9 * k), r3(2.9 * Math.max(0.8, k))], look: [0, r3(0.84 * k), 0], fov: 30 },
      { at: T2, pos: [X + 0.02, 0.86, 14.2], look: [X + 0.02, 0.7, 0], fov: 30 },
    ],
    cast: [
      { id: "c", character: `potatobrawl/${name}`, at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 },
      { id: "spud", character: "potatobrawl/spud", at: [X - 1.45, 0], face: 0, expr: "kind", follow: 0.25, seed: 2.1 },
      { id: "chip", character: "potatobrawl/chip", at: [X - 0.55, 0], face: 0, expr: "kind", follow: 0.25, seed: 3.4 },
      { id: "wedge", character: "potatobrawl/wedge", at: [X + 0.5, 0], face: 0, expr: "kind", follow: 0.25, seed: 4.2 },
      { id: "mash", character: "potatobrawl/mash", at: [X + 1.5, 0], face: 0, expr: "kind", follow: 0.25, seed: 5.6 },
    ],
    beats: [
      { name: "turn", at: 0, len: T1, do: [{ who: "c", do: "look", at: 0.2, to: [0.5, 0], dur: 0.12 },
        ...turnSteps.map(([to, dur, ease], i) => ({ who: "c", do: "turn", at: +(0.35 + turnSteps.slice(0, i).reduce((n, s) => n + s[1], 0)).toFixed(4), to, dur: +dur.toFixed(4), ease })),
        { who: "c", do: "look", at: T1 - 0.17, to: [0, 0], dur: 0.12 }] },
      { name: "faces", at: T1, len: 3.55, do: [
        { who: "c", do: "expr", at: 0.7, expr: "shocked" },
        { who: "c", do: "expr", at: 1.7, expr: "sad" }, { who: "c", do: "droop", at: 1.7, to: 1, dur: 0.3 },
        { who: "c", do: "expr", at: 2.7, expr: "happy" }, { who: "c", do: "droop", at: 2.7, to: 0, dur: 0.2 },
      ] },
      { name: "size", at: T2, len: 3.9, do: [
        { who: "spud", do: "look", at: 0.6, to: [0.8, 0], dur: 0.2 }, { who: "chip", do: "look", at: 0.9, to: [-0.6, 0.4], dur: 0.2 },
        { who: "wedge", do: "look", at: 1.4, to: [-0.6, -0.2], dur: 0.2 }, { who: "mash", do: "look", at: 1.7, to: [-0.6, -0.3], dur: 0.2 },
        { who: "spud", do: "look", at: 2.6, to: [0, 0], dur: 0.2 }, { who: "spud", do: "expr", at: 2.75, expr: "happy" },
        { who: name, do: "expr", at: 2.9, expr: "happy" },
      ] },
    ],
  });
}
