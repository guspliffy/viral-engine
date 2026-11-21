// Egypt myth 01 monster bench (task T3, 20 Nov 2026): the kind `heartmonster` of engine/page/props-heart-monster.js at DESIGN section C sizes. Not a clip, no cast.
// One shot per state (1.0 s each, the still is 0.5 s in), every pose at its full value, then the head close-ups and the chomp strip:
//   stand34 / standP / standB   standing, 3/4 from her left front, profile from her left, 3/4 from her right back
//   low rear lunge sit slump    each body pose at 1 (profile or 3/4); lunge = rear 1 + jaw 1 (opening 01: paws planted wide, head thrust over the pan)
//   gait                        mid-step, profile
//   yawL yawR                   headYaw +1 / -1 (headPitch +-0.6)
//   jawF jawL jawR jawT         jaw 1 (jawTop 0.27) from the front, her left, her right, above: the 36 teeth countable
//   lick0 lick1 lick2 chew      jaw shut + lick 0.1 / 0.5 / 0.9, chew 0.25
//   lowJaw breath drool         low + jaw 1 + jawTop 1, jaw 1 + breath 1, drool 1 + stain 1
//   mane eye claws nails        the mane + braids, an eye (glow 1), the left front paw (4 claws), the left hind foot (4 nails)
//   shut                        jaw shut, profile: 8 uppers and 5 lowers over the lips
//   flank rump                  the left flank (ribs, scars), the rump + tail (wag 1)
//   chomp1..chomp6              jaw 1 -> 0 over 0.2 s, one still per 30 fps frame (times printed below)
//   node storyboards/series/egypt-myth/01-heart/bench/make-monster-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/egypt-myth/01-heart/bench/monster-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-monster
//   node qa/contact.mjs /tmp/claude-0/bench-monster/monster-bench-*.png --out storyboards/series/egypt-myth/01-heart/bench/monster-sheet.png
import { clip, frame, write } from "../../../../lib/clip.mjs";
import { monsterCounts, monsterMouth } from "../../../../../engine/page/props-heart-monster.js";

const c = clip();
const BASE = { low: 0, rear: 0, sit: 0, slump: 0, jaw: 0, jawTop: 0.27, chomp: 0, chew: 0, lick: 0, headYaw: 0, headPitch: 0, gait: 0, breath: 0, drool: 0.5, stain: 0, lids: 0.25, glow: 0.4, wag: 0 };
const props = [{ id: "m", kind: "heartmonster", x: 0, y: 0, z: 0, rot: 0, ...BASE }];
const HEAD = [0, 1.08, 1.30];
const shots = [];
const shot = (name, over, cam) => shots.push([name, over, cam]);
shot("stand34", {}, frame([0, 0.78, 0.3], { az: 38, el: 8, h: 4.6, fov: 24 }));
shot("standP", {}, frame([0, 0.78, 0.3], { az: 90, el: 3, h: 6.4, fov: 24 }));
shot("standB", {}, frame([0, 0.78, 0.2], { az: -140, el: 10, h: 4.8, fov: 24 }));
shot("low", { low: 1 }, frame([0, 0.8, 0.4], { az: 90, el: 3, h: 6.4, fov: 24 }));
shot("rear", { rear: 1 }, frame([0, 1.05, 0.3], { az: 90, el: 3, h: 6.4, fov: 24 }));
shot("lunge", { rear: 1, jaw: 1, drool: 1, breath: 0 }, frame([0, 0.95, 0.6], { az: 55, el: 6, h: 3.6, fov: 24 }));
shot("sit", { sit: 1 }, frame([0, 0.85, 0.1], { az: 38, el: 6, h: 4.2, fov: 24 }));
shot("slump", { slump: 1 }, frame([0, 0.45, 0.5], { az: 38, el: 8, h: 3.4, fov: 24 }));
shot("gait", { gait: 0.3 }, frame([0, 0.78, 0.3], { az: 90, el: 3, h: 6.4, fov: 24 }));
shot("yawL", { headYaw: 1, headPitch: -0.6 }, frame([0, 1.05, 0.9], { az: 15, el: 10, h: 2.6, fov: 24 }));
shot("yawR", { headYaw: -1, headPitch: 0.6 }, frame([0, 1.05, 0.9], { az: -15, el: 10, h: 2.6, fov: 24 }));
shot("jawF", { jaw: 1 }, frame([0, 0.95, 1.35], { az: 0, el: 14, h: 1.5, fov: 22 }));
shot("jawL", { jaw: 1 }, frame([0, 1.0, 1.3], { az: 72, el: 8, h: 1.7, fov: 22 }));
shot("jawR", { jaw: 1 }, frame([0, 1.0, 1.3], { az: -72, el: 8, h: 1.7, fov: 22 }));
shot("jawT", { jaw: 1 }, frame([0, 0.95, 1.3], { az: 0, el: 62, h: 1.6, fov: 22 }));
shot("lick0", { lick: 0.1 }, frame([0, 1.02, 1.42], { az: 50, el: 8, h: 1.2, fov: 22 }));
shot("lick1", { lick: 0.5 }, frame([0, 1.02, 1.42], { az: 25, el: 8, h: 1.2, fov: 22 }));
shot("lick2", { lick: 0.9 }, frame([0, 1.02, 1.42], { az: -50, el: 8, h: 1.2, fov: 22 }));
shot("chew", { chew: 0.25 }, frame([0, 1.02, 1.3], { az: 40, el: 8, h: 1.6, fov: 22 }));
shot("lowJaw", { low: 1, jaw: 1, jawTop: 1 }, frame([0, 0.7, 1.1], { az: 80, el: 3, h: 2.6, fov: 24 }));
shot("breath", { jaw: 1, breath: 1 }, frame([0, 1.0, 1.5], { az: 80, el: 4, h: 3.0, fov: 24 }));
shot("drool", { drool: 1, stain: 1 }, frame([0, 0.95, 1.5], { az: 30, el: 6, h: 1.2, fov: 22 }));
shot("mane", {}, frame([0, 1.1, 0.62], { az: 52, el: 8, h: 1.7, fov: 22 }));
shot("eye", { glow: 1 }, frame([0.17, 1.24, 1.0], { az: 38, el: 12, h: 0.5, fov: 20 }));
shot("claws", {}, frame([0.3, 0.08, 0.7], { az: 18, el: 20, h: 0.5, fov: 22 }));
shot("nails", {}, frame([0.37, 0.08, -0.62], { az: 60, el: 14, h: 0.8, fov: 22 }));
shot("flank", {}, frame([0, 0.75, -0.45], { az: 90, el: 4, h: 2.4, fov: 24 }));
shot("rump", { wag: 1 }, frame([0, 0.95, -1.2], { az: 180, el: 10, h: 1.6, fov: 22 }));
shot("topH", {}, frame([0, 1.2, 1.2], { az: 0, el: 80, h: 1.9, fov: 22 }));
shot("shut", {}, frame([0, 1.02, 1.32], { az: 90, el: 4, h: 1.9, fov: 22 }));
const T0 = shots.length;   // the chomp strip: one beat, six stills at 30 fps times
const CT = T0 + 0.1;
shot("chomp", { jaw: 1 }, frame([0, 1.0, 1.35], { az: 75, el: 6, h: 1.7, fov: 22 }));

const beats = []; let t = 0; const stills = [];
for (const [name, over, cam] of shots) {
  c.prop(t, "m", { ...BASE, ...over }, 0);
  if (name === "chomp") { c.prop(t + 0.1, "m", { jaw: 0 }, 0.2, "linear"); for (let k = 1; k <= 6; k++) stills.push(Math.round((t + 0.1 + k / 30) * 10000) / 10000); }
  else stills.push(Math.round((t + 0.5) * 100) / 100);
  beats.push([name, t, cam]); t += 1;
}
const sb = {
  id: "monster-bench", title: "Egypt myth 01 monster bench", idea: "Engine look bench for the heartmonster prop (task T3), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#cdbfa6", floor: "#7a6e5c", light: "golden", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats(beats, t),
  notes: "Generated by storyboards/series/egypt-myth/01-heart/bench/make-monster-bench.mjs (engine bench, no story).",
};
console.log("stills:", stills.join(","));
console.error("counts:", JSON.stringify(monsterCounts()));
console.error("M (jaw shut) stand / low / rear / sit / slump:", [{}, { low: 1 }, { rear: 1 }, { sit: 1 }, { slump: 1 }].map((p) => monsterMouth(p).map((v) => Math.round(v * 1000) / 1000).join(",")).join("  |  "));
write(import.meta.url, sb);
