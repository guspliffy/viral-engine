// The human friends (Jonny, 19 Nov 2026): one test clip per friend, the same shots as the potato friends' tests
// (make-everyday-test.mjs): a slow full turn, then three faces in close-up.
//   node storyboards/characters/make-human-friends-test.mjs   -> storyboards/characters/human-<name>-test.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
// each friend's standing height to the top of the hair (m) and where the middle of the face is
const FRIENDS = { mash: { h: 1.56, face: 1.05 } };

const Q = 1.6, R = 0.25, RA = (90 / Q) * R / 3;   // a quarter turn (s); the turn eases in and out over R s and RA degrees
const turnSteps = [[RA, R, "in"], [90, Q * (90 - RA) / 90, "linear"], [180, Q, "linear"], [270, Q, "linear"], [360 - RA, Q * (90 - RA) / 90, "linear"], [360, R, "out"]];
const turnEnd = 0.5 + turnSteps.reduce((n, s) => n + s[1], 0), T1 = +(turnEnd + 0.3).toFixed(2);

for (const [name, F] of Object.entries(FRIENDS)) {
  const r3 = (v) => +v.toFixed(3);
  const { camera, ...rest } = turnaround(`human-${name}`, `human-friends/${name}`, "sheet");
  write({
    ...rest, id: `human-${name}-test`, title: `Human ${name[0].toUpperCase() + name.slice(1)} test`,
    shots: [
      { at: 0, pos: [0, r3(F.h * 0.55), r3(F.h * 3.9)], look: [0, r3(F.h * 0.5), 0], fov: 30 },
      { at: T1, pos: [0, r3(F.face + 0.03), r3(F.h * 1.55)], look: [0, r3(F.face), 0], fov: 30 },
    ],
    cast: [{ id: "c", character: `human-friends/${name}`, at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 }],
    beats: [
      { name: "turn", at: 0, len: T1, do: [
        ...turnSteps.map(([to, dur, ease], i) => ({ who: "c", do: "turn", at: +(0.5 + turnSteps.slice(0, i).reduce((n, s) => n + s[1], 0)).toFixed(4), to, dur: +dur.toFixed(4), ease }))] },
      { name: "faces", at: T1, len: 4.4, do: [
        { who: "c", do: "expr", at: 0.8, expr: "shocked" },
        { who: "c", do: "expr", at: 1.9, expr: "sad" },
        { who: "c", do: "expr", at: 3.0, expr: "happy" },
      ] },
    ],
  });
}
