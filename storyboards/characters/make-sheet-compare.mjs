// Sheet comparison clips (thread "Bring the sheet faces and skin to the cast", 4 Nov 2026): every fighter in the
// same short performance twice, once as a full figure in the sheets' hero three-quarter view and once as a face
// close-up, so Jonny's design sheet (references/cast-sheets-v1) can sit next to the old look and the new one.
// The face rests (expr "kind", as the clip template casts it), glances aside, blinks and comes back.
//   node storyboards/characters/make-sheet-compare.mjs [castLook ...]   -> storyboards/characters/sheet-compare/<name>-<look>-<shot>.json
//   (default looks: art sheet sheet-hatch)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CAST } from "./make-turnaround.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, "sheet-compare");
const looks = process.argv.slice(2).length ? process.argv.slice(2) : ["art", "sheet", "sheet-hatch"];
// the sheets' hero view: the body turned a little to the viewer's left, the eyes on the viewer
const SHOTS = {
  body: { pos: [0, 0.8, 4.0], look: [0, 0.62, 0], fov: 30 },
  face: { pos: [0, 0.9, 2.15], look: [0, 0.84, 0], fov: 30 },
};

export function compare(name, character, castLook, shot) {
  const drawn = { lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } };
  return {
    id: `sheetcmp-${name}-${castLook}-${shot}`, title: `${name} ${castLook} ${shot}`, fps: 30,
    look: "anime-pro", profile: "short", loop: false, castLook, duration: 2.6,
    set: { type: "plain", color: "#f3e6cc", floor: "#ddc49a", light: "golden", para: 0, aperture: 0, shade: "soft" },
    drawn, music: false, sound: { sfx: 0, ambience: 0 },
    creative: { length: [2, 20], notes: false },
    camera: [{ at: 0, ...SHOTS[shot] }, { at: 2.6, ...SHOTS[shot] }],
    cast: [{ id: "c", character, at: [0, 0], face: -18, expr: "kind", follow: 0.25, seed: 1.3 }],
    actions: [
      { who: "c", at: 0.0, do: "look", to: [0.12, 0.05], dur: 0.01, blink: false },
      { who: "c", at: 0.9, do: "look", to: [-0.55, 0.0], dur: 0.25 },
      { who: "c", at: 1.7, do: "look", to: [0.12, 0.05], dur: 0.25, blink: false },
      { who: "c", at: 2.15, do: "blink" },
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, character] of Object.entries(CAST)) for (const look of looks) for (const shot of Object.keys(SHOTS)) {
    const f = path.join(out, `${name}-${look}-${shot}.json`);
    fs.writeFileSync(f, JSON.stringify(compare(name, character, look, shot), null, 1) + "\n");
  }
  console.log(`wrote ${Object.keys(CAST).length * looks.length * 2} storyboards to ${path.relative(process.cwd(), out)}`);
}
