// Bench for THE ANGEL (characters/potatobrawl/angel.json, engine/page/costumes-angel.js: keys in its header) and the Devil's black shades
// (costume key `shades`, engine/page/costumes-devil.js): Potato Desk Heaven Steps DESIGN.md section 1 and section 4. Not a clip.
//   cast: Angel at x 0, Chip at 1.0 (scale), Devil with shades at -3.0, the "oops" Angel at +3.0 (bench-only character copy with
//   costume slip 1, flap 1, tilt 20, written next to this file by this generator; the real keys are keyframes in the character file)
//   stills (draft stills at +0.9 s into each beat, 1.5 s beats; the generator prints the times):
//     front, threeq (32 deg), side (90), back (180)   full body, camera 6.4 m
//     deadpan, sideeye (one brow up, pupils to Chip), write (stern, eyes down), oops (lids 0, o mouth, slip, flap, halo tilt), soft   close, halo in frame
//     scale   the Angel beside Chip, front
//     shadesOn, shadesUp   the Devil with the shades on the eyes, then pushed up on the forehead between the horns
//   node storyboards/series/potato-desk/heaven-steps/bench/make-angel-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/potato-desk/heaven-steps/bench/angel-bench.json --stills <the times printed> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/angel-bench-*.png --out storyboards/series/potato-desk/heaven-steps/bench/angel-sheet.png
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write } from "../../../../lib/clip.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../../../../..");
const REL = path.relative(path.join(root, "characters"), here);   // characters are loaded as characters/<id>.json: a bench-only copy is reached by a relative id
const variant = (name, base, edit) => { const d = JSON.parse(fs.readFileSync(path.join(root, "characters", `${base}.json`), "utf8")); d.id = `bench/${name}`; edit(d); fs.writeFileSync(path.join(here, `${name}.json`), JSON.stringify(d, null, 2) + "\n"); return `${REL}/${name}`; };
const OOPS = variant("angel-oops", "potatobrawl/angel", (d) => { d.costume = { ...d.costume, slip: 1, flap: 1, tilt: 20 }; });
const DEVIL = variant("devil-shades", "potatobrawl/devil", (d) => { d.costume = { ...d.costume, shades: [[0, 1], [16.3, 1], [16.9, 2]] }; });

const c = clip(), { A } = c, END = 18.0, BEAT = 1.5;
const X = { angel: 0, chip: 1.0, devil: -3.0, oops: 3.0 };
const WHO = Object.keys(X);

const FULL = (x) => ({ pos: [x, 1.3, 6.4], look: [x, 0.8, 0], fov: 26 });
const FACE = (x) => ({ pos: [x, 1.05, 3.8], look: [x, 1.0, 0], fov: 24 });
const TWO = { pos: [0.5, 1.1, 8.8], look: [0.5, 0.7, 0], fov: 26 };
const DEV = { pos: [-3, 0.62, 2.6], look: [-3, 0.62, 0], fov: 24 };

for (const w of WHO) { A(0, w, "noblink"); A(0, w, "look", { to: [0, 0], dur: 0.01, blink: false }); c.arm(0, w, "R", "rest", 0.01); c.arm(0, w, "L", "rest", 0.01); }
// the turns
A(1.5, "angel", "turn", { to: 32, dur: 0.4 });
A(3.0, "angel", "turn", { to: 90, dur: 0.4 });
A(4.5, "angel", "turn", { to: 180, dur: 0.4 });
A(6.0, "angel", "turn", { to: 0, dur: 0.4 });
// the five faces (expression + the face controls; no kit key)
const face = (t, who, expr, set, ctl, look) => { A(t, who, "expr", { expr, set, dur: 0.05 }); if (ctl) A(t, who, "face", { ...ctl, dur: 0.05 }); A(t, who, "look", { to: look || [0, 0], dur: 0.05, blink: false }); };
face(6.0, "angel", "deadpan", {}, { lid: 0.2 });
face(7.5, "angel", "deadpan", { raise: 0.035, browY: -0.005 }, { lid: 0.2, browR: -0.1 }, [0.85, -0.05]);
face(9.0, "angel", "stern", {}, { lid: 0.15 }, [0, -0.8]);
face(10.5, "oops", "shocked", { tilt: 0.3, browY: 0.04, curve: 0, open: 0.25, eye: 1.15, pupil: 0.5, pucker: 1 }, { lid: 0 });
face(12.0, "angel", "deadpan", { curve: 0.25, eye: 0.7 }, { lid: 0.3 }, [0.6, -0.5]);
// scale: front again (the angel's face back to deadpan)
face(13.5, "angel", "deadpan", {}, { lid: 0.2 });

write(import.meta.url, {
  id: "angel-bench", title: "Angel bench", idea: "Bench for Potato Desk Heaven Steps' Angel (angel.json) and the Devil's shades, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#d9cdb4", floor: "#8f8a80", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["angel"], hint: 0, what: "engine test" },
  cast: [
    { id: "angel", character: "potatobrawl/angel", at: [X.angel, 0], face: 0, expr: "deadpan", follow: 0.2, seed: 1.7 },
    { id: "chip", character: "potatobrawl/chip", at: [X.chip, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
    { id: "devil", character: DEVIL, at: [X.devil, 0], face: 0, expr: "kind", follow: 0.2, seed: 3.9 },
    { id: "oops", character: OOPS, at: [X.oops, 0], face: 0, expr: "deadpan", follow: 0.2, seed: 1.7 },
  ],
  props: [],
  captions: c.captions,
  beats: c.beats([["front", 0, FULL(0)], ["threeq", 1.5, FULL(0)], ["side", 3, FULL(0)], ["back", 4.5, FULL(0)], ["deadpan", 6, FACE(0)], ["sideeye", 7.5, FACE(0)], ["write", 9, FACE(0)], ["oops", 10.5, FACE(X.oops)], ["soft", 12, FACE(0)], ["scale", 13.5, TWO], ["shadesOn", 15, DEV], ["shadesUp", 16.5, DEV]], END),
  notes: "Generated by storyboards/series/potato-desk/heaven-steps/bench/make-angel-bench.mjs (character bench, no story).",
});
console.log("stills:", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (i * BEAT + 0.9).toFixed(1)).join(","));
