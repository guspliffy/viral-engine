// Spud, the main character (Jonny, 11 Nov 2026): his turnaround on the plain stage (same as the fighters'), and his
// test clip: the turnaround, three faces in close-up with the sprout showing the mood, then his size between the
// Viking and the Wizard (the group stands 3 m along the stage, so a cut takes us there and nobody has to walk in).
//   node storyboards/characters/make-spud-test.mjs   -> storyboards/characters/turn-spud-sheet.json, spud-test.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
const turn = { ...turnaround("spud", "potatobrawl/spud", "sheet"), id: "turn-spud-sheet" };
write(turn);

const Q = 1.45, R = 0.25, RA = (90 / Q) * R / 3;   // a quarter turn (s); the turn eases in and out over R s and RA degrees (cubic: it meets the even speed)
const turnSteps = [[RA, R, "in"], [90, Q * (90 - RA) / 90, "linear"], [180, Q, "linear"], [270, Q, "linear"], [360 - RA, Q * (90 - RA) / 90, "linear"], [360, R, "out"]];
const turnEnd = 0.35 + turnSteps.reduce((n, s) => n + s[1], 0), T1 = +(turnEnd + 0.2).toFixed(2), T2 = +(T1 + 3.55).toFixed(2);   // the close-up's start, the group shot's start
const X = -3;   // where the group stands (to the left: the light comes from the right, so its shadows fall away from the solo shot)
const { camera, ...rest } = turn;
write({
  ...rest, id: "spud-test", title: "Spud test",
  shots: [
    { at: 0, pos: [0, 0.82, 4.3], look: [0, 0.68, 0], fov: 30 },
    { at: T1, pos: [0, 0.9, 2.9], look: [0, 0.84, 0], fov: 30 },
    { at: T2, pos: [X + 0.03, 0.78, 7.9], look: [X + 0.03, 0.6, 0], fov: 30 },
  ],
  cast: [
    { id: "c", character: "potatobrawl/spud", at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 },
    { id: "s2", character: "potatobrawl/spud", at: [X, 0.2], face: 0, expr: "kind", follow: 0.25, seed: 2.1 },
    { id: "vik", character: "potatobrawl/viking", at: [X + 0.66, -0.55], face: 0, expr: "kind", seed: 3.4 },
    { id: "wiz", character: "lookdev/wizard-crisp", at: [X - 0.7, -0.55], face: 0, expr: "kind", seed: 4.2 },
  ],
  beats: [
    // one slow full turn at an even speed, as four quarter turns end to end (a turn to 360 is "no turn": the engine
    // takes the short way round; the fighters' four quick eased quarter turns move a hand 18 cm in a frame on the drawn timing)
    { name: "turn", at: 0, len: T1, do: [{ who: "c", do: "look", at: 0.2, to: [0.5, 0], dur: 0.12 },
      ...turnSteps.map(([to, dur, ease], i) => ({ who: "c", do: "turn", at: +(0.35 + turnSteps.slice(0, i).reduce((n, s) => n + s[1], 0)).toFixed(4), to, dur: +dur.toFixed(4), ease })),
      { who: "c", do: "look", at: T1 - 0.17, to: [0, 0], dur: 0.12 }] },
    { name: "faces", at: T1, len: 3.55, do: [
      { who: "c", do: "expr", at: 0.7, expr: "shocked" },
      { who: "c", do: "expr", at: 1.7, expr: "sad" }, { who: "c", do: "droop", at: 1.7, to: 1, dur: 0.3 },
      { who: "c", do: "expr", at: 2.7, expr: "happy" }, { who: "c", do: "droop", at: 2.7, to: 0, dur: 0.2 },
    ] },
    { name: "size", at: T2, len: 3.9, do: [
      { who: "s2", do: "look", at: 0.6, to: [-0.8, 0.35], dur: 0.2 }, { who: "wiz", do: "look", at: 0.9, to: [0.5, -0.1], dur: 0.2 },
      { who: "s2", do: "look", at: 1.6, to: [0.8, 0.35], dur: 0.2 }, { who: "vik", do: "look", at: 1.9, to: [-0.5, -0.1], dur: 0.2 },
      { who: "s2", do: "look", at: 2.6, to: [0, 0], dur: 0.2 }, { who: "s2", do: "expr", at: 2.75, expr: "happy" },
    ] },
  ],
});
