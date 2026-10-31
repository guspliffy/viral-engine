// Character turnarounds (thread "Make the characters more detailed and beautiful", 31 Oct 2026): one 6 s clip per
// fighter on a plain warm stage: front hold, a full turn in four quarter turns (side, back, side, front), then a push
// in to a face close-up. Jonny judges character looks from short videos (turnaround + close-up), not stills.
//   node storyboards/characters/make-turnaround.mjs [castLook] [suffix]   -> storyboards/characters/turn-<name><suffix>.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const look = process.argv[2] || "board", suffix = process.argv[3] || "";
// the file each fighter is drawn from in today's clips (glove hands where a clip version exists)
export const CAST = {
  astronaut: "potatobrawl/astronaut", viking: "potatobrawl/viking", reaper: "lookdev/reaper-crisp",
  gunslinger: "lookdev/gunslinger-crisp", dragon: "lookdev/dragon-crisp", allfather: "lookdev/allfather-crisp",
  samurai: "potatobrawl/samurai", wizard: "lookdev/wizard-crisp", sorcerer: "potatobrawl/sorcerer", phoenix: "duo/phoenix",
};
const NAMES = { allfather: "Norse god" };

export function turnaround(name, character, castLook) {
  const full = { pos: [0, 0.82, 4.3], look: [0, 0.68, 0], fov: 30 }, close = { pos: [0, 0.9, 2.9], look: [0, 0.84, 0], fov: 30 };
  const turns = [90, 180, 270, 360].map((to, i) => ({ who: "c", at: 0.7 + i * 0.95, do: "turn", to, dur: 0.75 }));
  return {
    id: `turn-${name}${suffix}`, title: `${NAMES[name] || name[0].toUpperCase() + name.slice(1)} turnaround`, fps: 30,
    look: "anime-pro", profile: "short", loop: false, castLook,
    set: { type: "plain", color: "#f3d9a4", floor: "#d9b27a", light: "golden", para: 0, aperture: 0, shade: "soft" },
    drawn: true, music: false, sound: { sfx: 0, ambience: 0 },
    creative: { length: [4, 20], notes: false },
    camera: [{ at: 0, ...full }, { at: 4.55, ...full }, { at: 5.25, ...close }, { at: 6.5, ...close }],
    cast: [{ id: "c", character, at: [0, 0], face: 0, expr: "kind", follow: 0.25, seed: 1.3 }],
    beats: [{ name: "turn", at: 0, len: 6.5, do: turns }],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name, character] of Object.entries(CAST)) {
    const f = path.join(here, `turn-${name}${suffix}.json`);
    fs.writeFileSync(f, JSON.stringify(turnaround(name, character, look), null, 1) + "\n");
    console.log(f);
  }
}
