// The archaeologist (Egypt debate shorts, 19 Nov 2026): her test clips on the fighters' plain turnaround stage, the same three shots as
// Spud's and the everyday friends' (make-spud-test.mjs, make-everyday-test.mjs): a slow full turn, three faces in close-up (kind, one
// brow raised = "skeptical", surprised), then the line-up beside Spud (his sweater, her hat: the two silhouettes).
//   archaeologist-test.json        the three shots above (lamp off, no brush)
//   archaeologist-lamp-test.json   a short second test: the tunnel lamp on and the conservation brush in her right hand at rest
//                                  (hand by the right hip, bristles down and about 25 degrees forward), a quarter turn each way
//   node storyboards/characters/make-archaeologist-test.mjs   -> storyboards/characters/archaeologist-{,lamp-}test.json
// Draft stills: node engine/render.mjs storyboards/characters/archaeologist-test.json --stills <times> --draft --safe  (times printed below)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turnaround } from "./make-turnaround.mjs";
import { clip } from "../lib/clip.mjs";
import * as grips from "../lib/grips.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const write = (sb) => { const f = path.join(here, `${sb.id}.json`); fs.writeFileSync(f, JSON.stringify(sb, null, 1) + "\n"); console.log(f); };
const r3 = (v) => +v.toFixed(3);
const LEG = 0.14, SPUD = LEG + 0.88;   // top of Spud's head
const ARCH = "ancient-aliens/archaeologist", ARCH_TOTAL = 0.05 + 0.757;   // her legs (legs.height) + body, no hat: 0.79 of Spud
const k = ARCH_TOTAL / SPUD;

const Q = 1.45, R = 0.25, RA = (90 / Q) * R / 3;   // a quarter turn (s); the turn eases in and out over R s and RA degrees
const turnSteps = [[RA, R, "in"], [90, Q * (90 - RA) / 90, "linear"], [180, Q, "linear"], [270, Q, "linear"], [360 - RA, Q * (90 - RA) / 90, "linear"], [360, R, "out"]];
const turnEnd = 0.35 + turnSteps.reduce((n, s) => n + s[1], 0), T1 = +(turnEnd + 0.2).toFixed(2), T2 = +(T1 + 4.55).toFixed(2);
const X = -3;   // where the group stands (its shadows fall away from the solo shot)
const { camera, ...rest } = turnaround("archaeologist", ARCH, "sheet");
// the wide brim (1.14 across) needs a wider frame than Spud's: the full-length camera stands further back and a little higher (the hat's top shows)
write({
  ...rest, id: "archaeologist-test", title: "Archaeologist test",
  shots: [
    { at: 0, pos: [0, 0.95, 3.9], look: [0, 0.5, 0], fov: 30 },
    { at: T1, pos: [0, 0.75, 2.3], look: [0, 0.6, 0], fov: 30 },
    { at: T2, pos: [X + 0.03, 0.78, 7.9], look: [X + 0.03, 0.6, 0], fov: 30 },
  ],
  cast: [
    { id: "c", character: ARCH, at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 },
    { id: "a2", character: ARCH, at: [X + 0.55, 0], face: 0, expr: "kind", follow: 0.25, seed: 2.1 },
    { id: "spud", character: "potatobrawl/spud", at: [X - 0.55, 0], face: 0, expr: "kind", follow: 0.25, seed: 3.4 },
  ],
  beats: [
    { name: "turn", at: 0, len: T1, do: [{ who: "c", do: "look", at: 0.2, to: [0.5, 0], dur: 0.12 },
      ...turnSteps.map(([to, dur, ease], i) => ({ who: "c", do: "turn", at: +(0.35 + turnSteps.slice(0, i).reduce((n, s) => n + s[1], 0)).toFixed(4), to, dur: +dur.toFixed(4), ease })),
      { who: "c", do: "look", at: T1 - 0.17, to: [0, 0], dur: 0.12 }] },
    { name: "faces", at: T1, len: 4.55, do: [
      { who: "c", do: "expr", at: 0.2, expr: "kind" },
      // one brow raised (her right, -u: browR) with the mouth level: "skeptical"
      { who: "c", do: "face", at: 1.3, browR: 0.5, dur: 0.18 },
      { who: "c", do: "face", at: 2.5, browR: 0, dur: 0.2 },
      { who: "c", do: "expr", at: 3.2, expr: "shocked" },
    ] },
    { name: "size", at: T2, len: 3.9, do: [
      { who: "spud", do: "look", at: 0.6, to: [0.8, 0], dur: 0.2 }, { who: "a2", do: "look", at: 0.9, to: [-0.6, 0.1], dur: 0.2 },
      { who: "spud", do: "look", at: 2.6, to: [0, 0], dur: 0.2 }, { who: "a2", do: "look", at: 2.8, to: [0, 0], dur: 0.2 },
    ] },
  ],
});
console.log("stills (turn): front 0.3, 3/4 ~0.9, side ~" + r3(0.35 + R + Q * (90 - RA) / 90 + 0.1) + ", back ~" + r3(0.35 + R + Q * (90 - RA) / 90 + Q + 0.1) + "; faces " + r3(T1 + 0.9) + " (kind) " + r3(T1 + 2.3) + " (skeptical) " + r3(T1 + 3.9) + " (surprised); line-up " + r3(T2 + 0.4));

// ---- the second test: the tunnel lamp on and the brush in her right hand at rest ----------------------------------------------------
// Her right hand (-x) hangs by the right hip; the conservation brush (prop kind "archbrush", origin = its bristle tip, bristles DOWN) is held at the lower end of the handle with
// a closed fist on the handle (grips.mug: the brush is 0.42 of her height, so the butt shows above the fist) and tipped 25 degrees: bristles forward of the hand. The prop's rot is the hold frame's (holder yaw 0 + 180), so tip +25 puts the
// butt back and the bristles forward. The camera stands to her right front (the brush side), so the forward lean of the bristles shows; she glances at it and back.
{
  // costume.lamp is a character-file key (a cast entry cannot override the costume), so the lamp test wears a copy of her file with lamp true, written here
  const root = path.resolve(here, "..", ".."), her = JSON.parse(fs.readFileSync(path.join(root, "characters", `${ARCH}.json`), "utf8"));
  fs.writeFileSync(path.join(root, "characters", `${ARCH}-lamp.json`), JSON.stringify({ ...her, id: `${ARCH}-lamp`, name: "The archaeologist (tunnel lamp on)", costume: { ...her.costume, lamp: true } }, null, 2) + "\n");
  const c = clip(), { A } = c, HAND = [-0.46, 0.22, 0.3], TIP = 25, a = (TIP * Math.PI) / 180;
  const at = [HAND[0], HAND[1] - 0.165 * Math.cos(a), HAND[2] + 0.165 * Math.sin(a)];   // the bristle tip: 0.165 (the fist, the lower middle of the handle) down the brush's axis from the hand
  const BRUSH = { id: "brush", kind: "archbrush", tip: TIP, ...grips.placeFor("archbrush", at, 0) };
  const h = grips.mug(c, "c", BRUSH, { side: "R" });
  A(0, "c", "look", { to: [0.2, 0], dur: 0.01, blink: false });
  const held = h.take(0, { reach: 1.1, settle: 0.6 });   // the hand goes from her side to the handle (a fist, 1.1 + 0.6 s: slow, the palm turn spread)
  A(0.95, "c", "look", { to: [-0.5, -0.5], dur: 0.15, blink: false }); A(held + 0.2, "c", "look", { to: [0.6, 0.1], dur: 0.2, blink: false }); A(held + 1.8, "c", "look", { to: [0, 0], dur: 0.2, blink: false });
  const end = 4.2;
  const lampTest = {
    ...rest, id: "archaeologist-lamp-test", title: "Archaeologist lamp and brush test",
    cast: [{ id: "c", character: `${ARCH}-lamp`, at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 }],
    props: [BRUSH], captions: c.captions, beats: c.beats([["rest", 0, { pos: [0.35, 0.85, 4.0], look: [-0.05, 0.45, 0], fov: 30 }]], end),
  };
  write(lampTest);
}
