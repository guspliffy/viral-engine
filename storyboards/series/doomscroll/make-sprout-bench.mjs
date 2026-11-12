// SPROUT MAN look bench (Doomscroll to survive pilot, 11 Nov 2026): his poses next to Spud on the plain stage.
//   node storyboards/series/doomscroll/make-sprout-bench.mjs   -> sprout-bench.json (stills only: --stills beats --draft)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toSprout } from "../../../engine/shared/sprout-rig.js";
const here = path.dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(fs.readFileSync(path.join(here, "../../characters/spud-test.json"), "utf8"));
const SM = { x: -0.25, z: -0.3, rot: 12, scale: 1 };
const P = (at, set, dur = 0.2) => ({ do: "prop", id: "sm", at, set, dur });
const L = (w) => { const [x, y, z] = toSprout(SM, w); return { aLx: x, aLy: y, aLz: z, aLk: 1 }; };
const R = (w) => { const [x, y, z] = toSprout(SM, w); return { aRx: x, aRy: y, aRz: z, aRk: 1 }; };
const TA = (w) => { const [x, y, z] = toSprout(SM, w); return { tAx: x, tAy: y, tAz: z, tAk: 1 }; };
const poses = [
  ["rest", {}],
  ["reach", { ...L([1.0, 1.0, 0.5]), fanL: 1, wig: 1, lean: 12, headP: 15 }],
  ["crouch", { hipY: 0.6, hipZ: -0.25, lean: 38, headP: 20, ...R([0.75, 0.75, 0.55]), fanR: 0, aLk: 0 }],
  ["grab", { hipY: 1.28, hipZ: 0, lean: 0, headP: 0, aRk: 0, aLk: 0, ...TA([0.95, 1.9, 0.0]) }],
  ["sit", { tAk: 0, hipY: 0.45, sit: 1, lean: 22, headP: 30, ...L([-0.2, 0.75, 0.25]), ...R([-0.32, 0.75, 0.25]), fanL: 0.6, fanR: 0.6 }],
  ["cross", { sit: 0, cross: 1, hipY: 0.14, lean: 25 }],
  ["puppy", { cross: 0, hipY: 1.28, lean: 5, aLk: 0, aRk: 0, puppy: 1, headP: 0 }],
];
const beats = poses.map(([name, set], i) => ({ name, at: i * 1.0, len: 1.0, do: [P(0.0, set, 0.3)] }));
const sb = { ...base, id: "sprout-bench", title: "Sprout Man bench",
  shots: [{ at: 0, pos: [0.2, 1.5, 8.2], look: [0.2, 1.4, 0], fov: 30 }, { at: 6.0, pos: [-0.1, 2.5, 2.6], look: [-0.25, 2.55, 0], fov: 30 }],
  cast: [{ id: "c", character: "potatobrawl/spud", at: [0.95, 0.0], face: -15, expr: "kind", follow: 0.25, seed: 1.3 }],
  props: [{ id: "sm", kind: "sproutman", ...SM }],
  beats, duration: poses.length };
fs.writeFileSync(path.join(here, "sprout-bench.json"), JSON.stringify(sb, null, 1) + "\n"); console.log("sprout-bench.json");
