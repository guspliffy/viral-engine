// Read a storyboard file the way every tool should: real speech first (engine/voice/speech.mjs, so lines last as
// long as they are spoken), then compile beats to the flat storyboard, then check its sounds against the whitelist. Renderer and qa/ all use this, so they agree
// on every time in the clip.
import fs from "node:fs";
import path from "node:path";
import { compile } from "./compile.mjs";
import { direct } from "./direct.mjs";
import { withSpeech, ROOT } from "./voice/speech.mjs";
import { soundsOf } from "./sfx/whitelist.mjs";
import { holdsOf, heldFor } from "./shared/holds.js";
import { focusTrack } from "./focus.mjs";

export function loadCharacters(sb) {
  const chars = {};
  for (const c of sb.cast || []) chars[c.character] = castLook(JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${c.character}.json`), "utf8")), sb.castLook);
  return chars;
}

// "castLook": "golden" (Jonny's pick from skin test 01, 30 Oct 2026; new clips get it from the clip template): every
// potato's skin hue is pulled toward golden orange (29° in sRGB; lemon Phoenix moves furthest, warm Reaper least),
// the eyes are 12% bigger with a 1.6x heavier upper lid line, and the brows lift clear of the bigger eye. A storyboard
// without it draws the cast exactly as before. An object { skinGold, eyeSize, lash, browClear } sets the parts.
const CAST_LOOKS = { golden: { skinGold: 1, eyeSize: 1.12, lash: 1.6, browClear: 0.008 } };
export function castLook(def, look) {
  const L = typeof look === "string" ? CAST_LOOKS[look] : look;
  if (!L || def.rig !== "potato") return def;
  const hsl = def.body?.color && hexHsl(def.body.color);
  // potato skins only (yellow to orange): an egg-white, onion or tomato skin keeps its colour
  if (L.skinGold && hsl && hsl[0] >= 20 && hsl[0] <= 55 && hsl[1] > 0.3 && hsl[2] < 0.85) def.body.color = hslHex(hsl[0] + L.skinGold * (29 - hsl[0]), hsl[1], hsl[2]);
  const F = (def.face ||= {});
  if (L.eyeSize) F.size = (F.size ?? 1) * L.eyeSize;
  if (L.lash) F.eye = { ...F.eye, lash: +((F.eye?.lash ?? 1) * L.lash).toFixed(3) };
  if (L.browClear && F.browShape?.clear == null) F.browShape = { ...F.browShape, clear: L.browClear };
  return def;
}
function hexHsl(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
}
function hslHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

export function loadStoryboard(file) {
  const sb = JSON.parse(fs.readFileSync(file, "utf8"));
  if (sb.set?.plate) plateFiles(sb.set.plate);
  const chars = loadCharacters(sb);
  return withHolds(focusTrack(direct(soundsOf(compile(withSpeech(sb, chars))), chars))); // sfx names -> whitelisted ids (engine/sfx/whitelist.mjs)
}

// hit-stops (engine/shared/holds.js): every time in the storyboard stays story time; "duration" becomes the video's
// length (the story plus the held frames), "storyDuration" keeps the story's own
function withHolds(sb) {
  const holds = holdsOf(sb);
  if (!holds.length) return sb;
  const bad = holds.find((h) => h.at < 0 || h.at >= sb.duration);
  if (bad) throw new Error(`hitStop at ${bad.at} s is outside the clip (0-${sb.duration} s)`);
  return { ...sb, holds, storyDuration: sb.duration, duration: Math.round((sb.duration + heldFor(holds)) * 1e6) / 1e6 };
}

// A painted plate uses the depth and motion maps next to its picture (engine/plates/depth.py) when they exist, so the
// 2.5D relief and ambient motion are on by default (set-plate.js); false in the storyboard turns one off.
function plateFiles(P) {
  for (const [key, ext] of [["depth", ".depth.png"], ["motion", ".motion.png"]]) {
    const f = P.src.replace(/\.\w+$/, ext);
    if (P[key] === undefined && fs.existsSync(path.join(ROOT, f))) P[key] = f;
  }
}
