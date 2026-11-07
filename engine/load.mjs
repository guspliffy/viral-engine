// Read a storyboard file the way every tool should: real speech first (engine/voice/speech.mjs, so lines last as
// long as they are spoken), then compile beats to the flat storyboard, then check its sounds against the whitelist. Renderer and qa/ all use this, so they agree
// on every time in the clip.
import { resolveLife } from "./shared/life-auto.mjs";
import fs from "node:fs";
import path from "node:path";
import { compile } from "./compile.mjs";
import { direct } from "./direct.mjs";
import { anime2dFx } from "./shared/anime2d.js";
import { withSpeech, ROOT } from "./voice/speech.mjs";
import { soundsOf } from "./sfx/whitelist.mjs";
import { holdsOf, heldFor } from "./shared/holds.js";
import { focusTrack } from "./focus.mjs";
import { cameraState } from "./page/timeline.js";
import { worldCamera } from "./page/vehicle.js";
import { envCoverage } from "./shared/env-coverage.js";

export function loadCharacters(sb) {
  const chars = {};
  for (const c of sb.cast || []) chars[c.character] = castLook(JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${c.character}.json`), "utf8")), sb.castLook);
  return chars;
}

// "castLook": "golden" (Jonny's pick from skin test 01, 30 Oct 2026; new clips get it from the clip template): every
// potato's skin hue is pulled toward golden orange (29° in sRGB; lemon Phoenix moves furthest, warm Reaper least),
// the eyes are 12% bigger with a 1.6x heavier upper lid line, and the brows lift clear of the bigger eye. A storyboard
// without it draws the cast exactly as before. An object { skinGold, eyeSize, lash, browClear } sets the parts.
// "board" (look match with Jonny's AI storyboards, 31 Oct 2026, a proposal until he approves it): golden skin, much
// (and his clean-anime character sheet): golden skin, eyes mostly dark iris inside a thin white rim with two catch
// lights, stronger blush.
// "art" (thread "Make the characters more detailed and beautiful", 31 Oct 2026, a proposal until Jonny approves it):
// the board look plus costume.art (costumes-art*.js: cloth that hangs with folds and a hem, flat belts, hair in locks
// from a scalp, wings that grow from the back, matte cloth) and the one-piece 3-finger glove for every fighter.
const CAST_LOOKS = {
  golden: { skinGold: 1, eyeSize: 1.12, lash: 1.6, browClear: 0.008 },
  art: { skinGold: 1, eyeSize: 1.1, oval: 1.5, eyeU: 0.39, eyeV: 0.27, corner: 0, lash: 1.4, browClear: 0.012, browThick: 0.75, iris: 0.7, irisShade: true, irisColor: "#5e2c12", blush: 1.7, glints: 1, mouthW: 0.2, detail: true, art: true },
  // "sheet" (quality plan, 4 Nov 2026: Jonny's 10 design sheets, references/cast-sheets-v1): the art look plus
  // costume.sheet (costume thread: costumes rebuilt from the sheets) and def.sheet (this thread: per-character resting
  // faces, brighter golden skin with a warm orange shadow, freckles, pencil hatching in the shadows). Approved 4 Nov (PR #83).
  sheet: { skinGold: 1, eyeSize: 1.1, oval: 1.5, eyeU: 0.39, eyeV: 0.27, corner: 0, lash: 1.4, browClear: 0.012, browThick: 0.75, iris: 0.7, irisShade: true, irisColor: "#5e2c12", blush: 1.7, glints: 1, mouthW: 0.2, detail: true, art: true, sheet: true },
  "sheet-clean": { skinGold: 1, eyeSize: 1.1, oval: 1.5, eyeU: 0.39, eyeV: 0.27, corner: 0, lash: 1.4, browClear: 0.012, browThick: 0.75, iris: 0.7, irisShade: true, irisColor: "#5e2c12", blush: 1.7, glints: 1, mouthW: 0.2, detail: true, art: true, sheet: true, clean: true },
  "sheet-hatch": { skinGold: 1, eyeSize: 1.1, oval: 1.5, eyeU: 0.39, eyeV: 0.27, corner: 0, lash: 1.4, browClear: 0.012, browThick: 0.75, iris: 0.7, irisShade: true, irisColor: "#5e2c12", blush: 1.7, glints: 1, mouthW: 0.2, detail: true, art: true, sheet: true },
  board: { skinGold: 1, eyeSize: 1.1, oval: 1.5, eyeU: 0.39, eyeV: 0.27, corner: 0, lash: 1.4, browClear: 0.012, browThick: 0.75, iris: 0.7, irisShade: true, irisColor: "#5e2c12", blush: 1.7, glints: 1, mouthW: 0.2, detail: true },
};
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
  if (L.eyeU) F.layout = { ...F.layout, eyeU: L.eyeU };
  if (L.mouthW) F.layout = { ...F.layout, mouthW: L.mouthW };
  if (L.eyeV) F.layout = { ...F.layout, eyeV: L.eyeV };
  if (L.oval) F.eye = { ...F.eye, oval: L.oval };
  if (L.detail && def.costume) {
    def.costume = { ...def.costume, detail: true };   // costume detail (costumes*.js C.detail)
    // the Wizard's hat band turns gold (the Reaper keeps his approved hoodie: the cloth hood read worse, Jonny 31 Oct)
    if (def.costume.type === "wizard") def.costume.band = "#d6a23c";
  }
  if (L.art && def.costume) {
    def.costume.art = true;
    // every fighter gets the seamless 3-finger glove (PR #44/#47), keeping its grips
    if ((def.hands?.type ?? "mitten") === "mitten") def.hands = { type: "glove", size: 1.7, fingers: 3, seamless: true, cell: 0.0035, blend: { root: 0.35 }, ...(def.hands?.grip ? { grip: def.hands.grip } : {}) };
    // the Norse god's brows are white and bushy like his hair (the face study)
    if (def.costume.type === "allfather") { F.brow = def.costume.hair || "#ece9e2"; F.browShape = { ...F.browShape, thick: +((F.browShape?.thick ?? 0.85) * 1.6).toFixed(3) }; }
  }
  if (L.sheet) { def.sheet = true; if (def.costume) def.costume.sheet = true; }   // castLook "sheet": costumes and faces read these flags
  // the sheet look keeps round 3's pencil hatching in the shadows (Jonny's pick, 4 Nov 2026 14:11); "sheet-clean" is the
  // sheets' own clean two-tone cel ("sheet-hatch" is kept as a name for the default)
  if (L.sheet && !L.clean) def.sheetHatch = true;
  if (L.browThick) F.browShape = { ...F.browShape, thick: +((F.browShape?.thick ?? 0.85) * L.browThick).toFixed(3) };
  if (L.blush) F.blush = +((F.blush ?? 1) * L.blush).toFixed(3);
  if (L.glints) F.eye = { ...F.eye, glints: L.glints };
  if (L.iris) F.eye = { ...F.eye, iris: L.iris };
  if (L.corner != null) F.eye = { ...F.eye, corner: L.corner };
  if (L.irisShade) F.eye = { ...F.eye, irisShade: true };
  const ih = hexHsl(F.iris || "#4a2a14");
  if (L.irisColor && ih[0] <= 40 && ih[2] < 0.35) F.iris = L.irisColor;   // brown eyes only (blue, green, purple keep theirs)
  if (L.sheet) sheetFace(def);
  // face.final (the Core Five redesign, characters/core-five-2026): the character's own face numbers, applied after the
  // look's shared ones (an object merges into the look's, a value replaces it). No older character file has it
  if (F.final) for (const [k, v] of Object.entries(F.final)) F[k] = v && typeof v === "object" && !Array.isArray(v) ? { ...F[k], ...v } : v;
  return def;
}

// castLook "sheet": each fighter's face and skin from Jonny's design sheets (characters/sheet-cast.json, by costume
// type): the shared eye style (a bigger gradient iris, a heavier lid line, one bigger catch light), brighter golden
// skin, a few freckles, and the character's own resting face (face.rest, drawn by potato.js), which replaces the
// generic "kind" face and the old default + neutral numbers. Unknown types (kids, onions) only get the shared parts.
let SHEET;
function sheetFace(def) {
  SHEET ||= JSON.parse(fs.readFileSync(path.join(ROOT, "characters", "sheet-cast.json"), "utf8"));
  const A = SHEET.all, T = SHEET.types[def.costume?.type] || {}, F = def.face;
  const sk = def.body?.color && hexHsl(def.body.color);
  if (sk && sk[0] >= 20 && sk[0] <= 55 && sk[1] > 0.3 && sk[2] < 0.85) def.body.color = T.skin || A.skin;   // potato skins only
  // the core build's heads (every new character, Jonny 5 Nov: "the style we build for the potato characters") take the
  // same golden sheet skin as the potato cast; head.keepSkin keeps a head's own colour (a non-skin creature)
  const hk = def.head?.color && hexHsl(def.head.color);
  if (hk && !def.head.keepSkin && hk[0] >= 20 && hk[0] <= 55 && hk[1] > 0.3 && hk[2] < 0.85) def.head.color = T.skin || A.skin;
  F.eye = { ...F.eye, ...A.eye, ...T.eye };
  F.browShape = { ...F.browShape, ...A.browShape, ...T.browShape };
  if (def.costume?.type === "allfather") F.browShape.thick = +(F.browShape.thick * 1.45).toFixed(3);   // his white brows stay bushy
  const ih = hexHsl(F.iris || "#4a2a14");
  F.iris = T.iris || (ih[0] <= 40 && ih[2] < 0.35 ? A.iris : F.iris);
  F.freckles = T.freckles ?? A.freckles;
  F.blush = T.blush ?? A.blush;
  if (T.rest) {
    F.rest = T.rest; F.default = "kind";
    // the old neutral expression numbers are replaced by the rest face; the lids stay a per-eye control
    F.neutral = { ...Object.fromEntries(Object.entries(F.neutral || {}).filter(([k]) => !(k in T.rest))), lidL: T.lids[0], lidR: T.lids[1] };
  }
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

export function loadStoryboard(file, opts = {}) {
  const sb = JSON.parse(fs.readFileSync(file, "utf8"));
  if (sb.set?.plate) plateFiles(sb.set.plate);
  if (sb.set?.type === "env") envFiles(sb.set, sb);
  const chars = loadCharacters(sb);
  const out = withAnime2d(withHolds(cleanStart(resolveLife(focusTrack(direct(soundsOf(compile(withSpeech(sb, chars))), chars))))));   // "life": "auto" -> the living world (engine/shared/life-auto.mjs) // sfx names -> whitelisted ids (engine/sfx/whitelist.mjs); "anime2d" -> the drawn marks (engine/shared/anime2d.js)
  if (out.set?.type === "env" && opts.envGate !== false && out.set.envCheck !== false) envGate(out);
  return out;
}

// "cleanStart": true (quality plan item 1, 5 Nov 2026; on in the clip template): the clip opens in its pose. The
// generators say "start like this" with a move of 0.01 s at t = 0 (c.arm(0, "wiz", "R", ARMREST, 0.01),
// c.prop(0, "phone", { glow: 1 }, 0.01)), and the engine drew the start of that move on frame 0 and its end on frame 1:
// between the first two frames hands jumped up to 60 cm, Reaper sat down on his box and the phone's glow switched on
// (IKEA, the plane, split the bill). With the flag, an action that sets a state (a pose, a look, a face, a seat, a
// prop's place) at t = 0 in less than a frame is instant (dur 0: it is there from frame 0), so generators can keep
// writing 0.01. A hop, a talk, a blink, a walk and anything a frame or longer keep their times. Times stay at 0 or
// later (page code reads the pose at an action's own time, e.g. a grab's held offset). It runs after the camera is
// directed, so the shots don't change; old clips without the flag load exactly as before.
const SETS_STATE = new Set(["arm", "look", "face", "expr", "prop", "sit", "crouch", "ride", "grip", "grab", "pitch", "lean", "turn", "droop", "bloom", "tilt", "hat", "span", "skin", "wings"]);
export function cleanStart(sb) {
  if (!sb.cleanStart || !sb.actions) return sb;
  const frame = 1 / (sb.fps ?? 30);
  const opening = (a) => Math.abs(a.at ?? 0) < 1e-6 && a.dur > 0 && a.dur < frame && SETS_STATE.has(a.do);
  if (!sb.actions.some(opening)) return sb;
  return { ...sb, actions: sb.actions.map((a) => (opening(a) ? { ...a, dur: 0 } : a)) };
}

// A layered painted environment (set "type": "env", "env": "<name>"; engine/page/set-env.js) reads
// assets/environments/<name>/env.json (made by engine/plates/env.py) into set.envData, and takes its light from it:
// golden light from where the painting's sun is (set.key), so the cast and the painting agree, and the footsteps' floor
// (env.json surface). The storyboard's own set.key / set.light / sound.surface win.
function envFiles(set, sb) {
  const dir = `assets/environments/${set.env}`, f = path.join(ROOT, dir, "env.json");
  if (!fs.existsSync(f)) throw new Error(`set env "${set.env}": ${dir}/env.json not found (make it with engine/plates/env.py)`);
  const E = { ...JSON.parse(fs.readFileSync(f, "utf8")), dir };
  set.envData = E;
  set.light ??= "golden";
  set.key ??= E.light?.key;
  set.windows ??= false;
  set.shadowSize ??= 6;
  if (E.surface && !sb.sound?.surface) sb.sound = { ...sb.sound, surface: E.surface };   // footsteps on the painted ground
}

// the camera must stay where the layers cover the frame (engine/shared/env-coverage.js): a storyboard whose camera
// shows a layer's edge is refused before any render, like a contact glitch. qa/env.mjs prints the details and the
// safe range; set.envCheck false turns the gate off (a test of the check itself).
function envGate(sb) {
  const r = envCoverage(sb.set.envData, (t) => worldCamera(sb, cameraState(sb, t), t), sb.duration ?? 1, sb.fps ?? 30);
  if (r.fails.length) throw new Error(`set env "${sb.set.env}": the camera shows the edge of the painting:\n` +
    r.fails.map((e) => `  ${e.from.toFixed(2)}-${e.to.toFixed(2)} s ${e.rule}: ${e.msg} (${e.at})`).join("\n") + `\n  run node qa/env.mjs ${sb.id ?? "<storyboard>"} for the safe camera range`);
}

// hit-stops (engine/shared/holds.js): every time in the storyboard stays story time; "duration" becomes the video's
// length (the story plus the held frames), "storyDuration" keeps the story's own
// "anime2d" (opt-in, look-2d-layer-01): the drawn 2D layer's marks (anger veins, sweat drops, shock and gloom lines,
// dust on landings, the drawn smear) read from the clip's own expressions and landings (engine/shared/anime2d.js), added
// as ordinary fx items so the renderer, the frame cache and qa/ all see the same list
function withAnime2d(sb) {
  const add = anime2dFx(sb);
  return add.length ? { ...sb, fx: [...(sb.fx || []), ...add].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)) } : sb;
}

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
