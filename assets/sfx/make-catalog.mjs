// Builds assets/sfx/catalog.json from the sound files in assets/sfx/: one entry per family of takes (footstep_wood_000..004
// -> "kenney/footstep-wood"), plus the named sounds storyboards and the auto foley use ("step-wood", "katana-slice", ...).
//   node assets/sfx/make-catalog.mjs
// A sound is either { files, gain } (a seeded take is picked each time it plays) or { layers: [[id, offset s, gain?]] }
// (several sounds at once, e.g. whoosh + cut + ring), or { pattern: { pool, rate, jitter } } (a burst sized by the
// event's dur, e.g. typing). Ids without a slash may also name the engine's code sounds (whoosh, tink, ...).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = {
  kenney: { name: "Kenney audio packs (Impact Sounds, RPG Audio, Interface Sounds, UI Audio, Digital Audio, Sci-fi Sounds, Music Jingles)",
    url: "https://kenney.nl/assets/category:Audio", license: "CC0 1.0 (public domain): commercial use, no credit needed", downloaded: "2026-10-25" },
};

// families of takes, found from the file names
const families = {};
for (const pack of fs.readdirSync(path.join(HERE, "kenney"))) {
  const dir = path.join(HERE, "kenney", pack);
  if (!fs.statSync(dir).isDirectory()) continue;
  const walk = (d) => fs.readdirSync(d).flatMap((f) => (fs.statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
  for (const f of walk(dir).filter((f) => f.endsWith(".ogg")).sort()) {
    const base = path.basename(f, ".ogg").replace(/^jingles_/, "").replace(/[_-]?\d+$/, "");
    const id = `kenney/${base.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    (families[id] ??= { source: "kenney", files: [] }).files.push(path.relative(HERE, f).split(path.sep).join("/"));
  }
}

const F = (id) => { if (!families[id]) throw new Error(`no family ${id}`); return families[id].files; };
const pick = (...ids) => ids.flatMap(F);
// named sounds: what storyboards ask for. gain is relative to the engine's code effects (most sit at 0.3-0.55)
const named = {
  // footsteps, one take per footfall; the auto foley picks the surface from the set
  "step-wood": { files: F("kenney/footstep-wood"), gain: 0.3 },
  "step-grass": { files: F("kenney/footstep-grass"), gain: 0.3 },
  "step-concrete": { files: F("kenney/footstep-concrete"), gain: 0.3 },
  "step-carpet": { files: F("kenney/footstep-carpet"), gain: 0.35 },
  "step-snow": { files: F("kenney/footstep-snow"), gain: 0.3 },
  "step-indoor": { files: F("kenney/footstep"), gain: 0.3 },
  // handling props
  grab: { files: pick("kenney/handle-small-leather", "kenney/cloth"), gain: 0.18 },
  "put-down": { files: F("kenney/impact-wood-light"), gain: 0.22 },
  "put-down-glass": { files: F("kenney/impact-glass-light"), gain: 0.2 },
  "put-down-metal": { files: F("kenney/impact-metal-light"), gain: 0.2 },
  cloth: { files: pick("kenney/cloth", "kenney/cloth-belt"), gain: 0.2 },
  sit: { files: F("kenney/creak"), gain: 0.2 },
  // blades
  "blade-draw": { files: F("kenney/draw-knife"), gain: 0.45 },
  "blade-cut": { files: F("kenney/knife-slice"), gain: 0.5 },
  "katana-slice": { layers: [["whoosh", 0, 0.35], ["blade-cut", 0.07], ["tink", 0.14, 0.15]] },
  "katana-draw": { layers: [["blade-draw", 0], ["tink", 0.18, 0.12]] },
  chop: { files: F("kenney/chop"), gain: 0.5 },
  // hits
  punch: { files: pick("kenney/impact-punch-medium", "kenney/impact-punch-heavy"), gain: 0.45 },
  thud: { files: F("kenney/impact-soft-heavy"), gain: 0.45 },
  "thud-soft": { files: F("kenney/impact-soft-medium"), gain: 0.35 },
  "hit-wood": { files: pick("kenney/impact-wood-medium", "kenney/impact-wood-heavy"), gain: 0.45 },
  "hit-metal": { files: pick("kenney/impact-metal-medium", "kenney/impact-metal-heavy"), gain: 0.4 },
  "hit-glass": { files: pick("kenney/impact-glass-medium", "kenney/impact-glass-heavy"), gain: 0.4 },
  "hit-plate": { files: pick("kenney/impact-plate-medium", "kenney/impact-plate-heavy"), gain: 0.4 },
  bell: { files: F("kenney/impact-bell-heavy"), gain: 0.35 },
  "pan-bonk": { files: F("kenney/metal-pot"), gain: 0.45 },
  // doors and small objects
  knock: { layers: [["hit-wood", 0, 0.8], ["hit-wood", 0.17, 0.75], ["hit-wood", 0.33, 0.85]] },
  "door-open": { files: F("kenney/door-open"), gain: 0.4 },
  "door-close": { files: F("kenney/door-close"), gain: 0.45 },
  "door-slam": { layers: [["door-close", 0, 1.4], ["thud", 0, 0.9], ["latch", 0.05, 0.6]] },
  "door-creak": { files: F("kenney/creak"), gain: 0.35 },
  latch: { files: pick("kenney/metal-latch", "kenney/metal-click"), gain: 0.35 },
  coins: { files: F("kenney/handle-coins"), gain: 0.35 },
  "book-flip": { files: F("kenney/book-flip"), gain: 0.3 },
  "book-close": { files: pick("kenney/book-close", "kenney/book-place"), gain: 0.35 },
  // office
  key: { files: pick("kenney/switch", "kenney/click"), gain: 0.16 },
  typing: { pattern: { pool: "key", rate: 11, jitter: 0.5 } },
  "mouse-click": { layers: [["kenney/mouseclick", 0, 0.25], ["kenney/mouserelease", 0.08, 0.2]] },
  "ui-click": { files: F("kenney/click"), gain: 0.25 },
  "ui-error": { files: F("kenney/error"), gain: 0.25 },
  "ui-confirm": { files: F("kenney/confirmation"), gain: 0.25 },
  // magic and gadgets (cartoon: the Gunslinger's shots are lasers or pops, never real guns)
  "magic-up": { files: F("kenney/power-up"), gain: 0.3 },
  zap: { files: pick("kenney/zap", "kenney/zap-two-tone"), gain: 0.3 },
  "force-field": { files: F("kenney/force-field"), gain: 0.3 },
  laser: { files: F("kenney/laser-small"), gain: 0.3 },
  "laser-big": { files: F("kenney/laser-large"), gain: 0.3 },
  // short musical stings (1-3 s)
  "jingle-sax": { files: F("kenney/sax"), gain: 0.35 },
  "jingle-pizzicato": { files: F("kenney/pizzi"), gain: 0.35 },
  "jingle-8bit": { files: F("kenney/nes"), gain: 0.3 },
  "jingle-steel": { files: F("kenney/steel"), gain: 0.35 },
  "jingle-hit": { files: F("kenney/hit"), gain: 0.35 },
};

const sounds = {};
for (const [id, s] of Object.entries(named)) sounds[id] = { ...s, ...(s.files ? { source: "kenney" } : {}) };
for (const [id, s] of Object.entries(families)) sounds[id] = { ...s, gain: 0.35 };

// other sources bring their own manifest: assets/sfx/<source>/manifest.json = { source: {name, url, license, ...},
// sounds: [{ id, files: [paths relative to that folder], gain?, tags?, ... }] } -> ids "<source>/<id>"
for (const dir of fs.readdirSync(HERE).filter((d) => fs.existsSync(path.join(HERE, d, "manifest.json")))) {
  const m = JSON.parse(fs.readFileSync(path.join(HERE, dir, "manifest.json"), "utf8"));
  SOURCES[dir] = m.source || { name: dir };
  for (const s of m.sounds || []) {
    const files = (s.files || [s.file]).filter(Boolean).map((f) => `${dir}/${f}`);
    for (const f of files) if (!fs.existsSync(path.join(HERE, f))) throw new Error(`${dir}/manifest.json: missing ${f}`);
    sounds[`${dir}/${s.id}`] = { source: dir, files, gain: s.gain ?? 0.35, ...(s.tags ? { tags: s.tags } : {}) };
  }
}
// Jonny's picks by ear from the AI sound test (2026-10-28, /mnt/project-files/audio/ai-sound-test-01/): these named
// sounds take the winner's takes. Kept as they were: step-wood, step-concrete, step-grass and zap (Kenney won).
// The knock ("AI B", picked 2026-10-28 19:18) keeps the old three-knock rhythm.
const take = (id, nums) => { const f = sounds[id]?.files; if (!f) throw new Error(`no ${id}`); return nums ? nums.map((n) => f[n - 1]) : f; };
Object.assign(sounds, {
  "katana-slice": { layers: [["shing", 0.07, 0.45]] }, // the engine's own code "shing" beat Kenney and AI; still 0.07 s after the swing starts
  "step-carpet": { source: "ai", files: take("ai/step-carpet"), gain: 0.35 },
  key: { source: "ai", files: take("ai/key-press"), gain: 0.16 }, // the typing pattern's pool
  "wing-flap": { source: "ai", files: take("ai/wing-flap", [5, 6, 7, 8, 1]), gain: 0.3, anchor: "hit" }, // "AI B" on the sheet; auto on Phoenix's downstrokes
  "knock-hit": { source: "ai", files: take("ai/knock", [4, 5, 6]), gain: 0.45, anchor: "hit" }, // one knuckle on wood ("AI B")
  knock: { layers: [["knock-hit", 0, 0.8], ["knock-hit", 0.17, 0.75], ["knock-hit", 0.33, 0.85]] },
});
fs.writeFileSync(path.join(HERE, "catalog.json"), JSON.stringify({ about: "Generated by make-catalog.mjs; edit that, not this.", sources: SOURCES, sounds }, null, 1) + "\n");
console.log(`catalog: ${Object.keys(named).length} named sounds, ${Object.keys(families).length} families, ${Object.values(families).reduce((n, f) => n + f.files.length, 0)} files`);
