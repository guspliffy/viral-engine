// Read a storyboard file the way every tool should: real speech first (engine/voice/speech.mjs, so lines last as
// long as they are spoken), then compile beats to the flat storyboard. Renderer and qa/ all use this, so they agree
// on every time in the clip.
import fs from "node:fs";
import path from "node:path";
import { compile } from "./compile.mjs";
import { direct } from "./direct.mjs";
import { withSpeech, ROOT } from "./voice/speech.mjs";

export function loadCharacters(sb) {
  const chars = {};
  for (const c of sb.cast || []) chars[c.character] = JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${c.character}.json`), "utf8"));
  return chars;
}

export function loadStoryboard(file) {
  const sb = JSON.parse(fs.readFileSync(file, "utf8"));
  if (sb.set?.plate) plateFiles(sb.set.plate);
  const chars = loadCharacters(sb);
  return direct(compile(withSpeech(sb, chars)), chars);
}

// A painted plate uses the depth and motion maps next to its picture (engine/plates/depth.py) when they exist, so the
// 2.5D relief and ambient motion are on by default (set-plate.js); false in the storyboard turns one off.
function plateFiles(P) {
  for (const [key, ext] of [["depth", ".depth.png"], ["motion", ".motion.png"]]) {
    const f = P.src.replace(/\.\w+$/, ext);
    if (P[key] === undefined && fs.existsSync(path.join(ROOT, f))) P[key] = f;
  }
}
