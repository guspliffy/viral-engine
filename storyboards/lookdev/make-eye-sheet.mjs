// Eye sheet (quality plan item 4, "eyes that stay readable", 5 Nov 2026): one face held in 9 looks x 4 lid closures,
// at front, three-quarter and profile, once as the eyes work today and once with "rig": { "eyes": 2 } (face.js: the
// pupil kept inside the opening the lids leave, the upper lid following the gaze, saccades). Each pose holds 0.25 s;
// take a still 0.2 s into each and tile them (tools/eye-sheet/tile.py).
//   node storyboards/lookdev/make-eye-sheet.mjs [character] [castLook]   -> storyboards/lookdev/eyes/eye-sheet-<name>-<view>-<v1|v2>.json
//   (default: phoenix, sheet). The still times: STILLS below (printed too).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, "eyes");
export const LOOKS = [[-0.6, 0.5], [0, 0.7], [0.6, 0.5], [-0.8, 0], [0, 0], [0.8, 0], [-0.6, -0.5], [0, -0.7], [0.6, -0.5]];
export const LIDS = [0, 0.3, 0.55, 0.75];
// the camera goes round the face (degrees from the front, to the character's left); the face stays square to the set
export const VIEWS = { front: 0, three: 40, profile: 72 };
const HOLD = 0.25;
export const STILLS = LIDS.flatMap((_, j) => LOOKS.map((_, i) => +((j * LOOKS.length + i) * HOLD + 0.2).toFixed(3)));

export function sheet(character, castLook, view, v) {
  const name = character.split("/").pop(), actions = [{ who: "c", at: 0, do: "noblink" }];
  LIDS.forEach((lid, j) => LOOKS.forEach((to, i) => {
    const at = +((j * LOOKS.length + i) * HOLD).toFixed(3);
    actions.push({ who: "c", at, do: "look", to, dur: 0.1, blink: false }, { who: "c", at, do: "face", lid, dur: 0 });
  }));
  const a = (VIEWS[view] * Math.PI) / 180, look = [+(0.07 * Math.sin(a)).toFixed(3), 0.68, 0.3];
  const shot = { pos: [+(look[0] + 2 * Math.sin(a)).toFixed(3), 0.74, +(look[2] + 2 * Math.cos(a)).toFixed(3)], look, fov: 22 }, D = LIDS.length * LOOKS.length * HOLD;
  return {
    id: `eye-sheet-${name}-${view}-${v}`, title: `Eye sheet ${name} ${view} ${v}`, fps: 30,
    look: "anime-pro", profile: "short", loop: false, castLook, duration: D,
    ...(v === "v2" && { rig: { eyes: 2 } }),
    set: { type: "plain", color: "#f3e6cc", floor: "#ddc49a", light: "golden", para: 0, aperture: 0, shade: "soft" },
    music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [2, 30], notes: false },
    camera: [{ at: 0, ...shot }, { at: D, ...shot }],
    cast: [{ id: "c", character, at: [0, 0], face: 0, expr: "kind", follow: 0, sway: 0, seed: 1.3 }],
    actions,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const character = process.argv[2] || "phoenix", castLook = process.argv[3] || "sheet";
  fs.mkdirSync(out, { recursive: true });
  for (const view of Object.keys(VIEWS)) for (const v of ["v1", "v2"]) {
    const sb = sheet(character, castLook, view, v);
    fs.writeFileSync(path.join(out, `${sb.id}.json`), JSON.stringify(sb, null, 1) + "\n");
    console.log(path.relative(process.cwd(), path.join(out, `${sb.id}.json`)));
  }
  console.log(`stills: ${STILLS.join(",")}`);
}
