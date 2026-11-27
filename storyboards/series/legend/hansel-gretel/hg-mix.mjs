// The sound mix for the hg draft: voices (timeline from hg.mjs) + Sol's cue sheet (music) + sfx.
//   node storyboards/series/legend/hansel-gretel/hg-mix.mjs out/legend-hansel/mix.wav
// SWAPPING IN THE NEW SOUNDS IS ONE EDIT-FREE STEP: every sound below is looked up by its new id first (music assets/music/ai/hg-*.ogg or
// hg-*/hg-*-NN.ogg; sfx assets/sfx/ai/<id>/*.wav), then by the library stand-in listed in SFX. When the hg-* files exist they win automatically.
// A sound that is in neither place is skipped and listed at the end ("MISSING").
import { existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINE, DUR, CUE, TIMELINE } from "./hg.mjs";
const [mixPath = "out/legend-hansel/mix.wav"] = process.argv.slice(2);
const VOICES = process.env.HG_VO || "out/legend-hansel/vo", missing = [], used = [];
const filesOf = (dir, exts) => (existsSync(dir) ? readdirSync(dir).filter((x) => exts.some((e) => x.endsWith(e))).sort().map((x) => `${dir}/${x}`) : []);
const musicFile = (id) => { const flat = filesOf("assets/music/ai", [".ogg", ".wav"]).filter((f) => f.split("/").pop().startsWith(id)); const dir = filesOf(`assets/music/ai/${id}`, [".ogg", ".wav"]); return [...flat, ...dir][0] || null; };
// sfx: [new id (TODO: hg-sfx recipes), stand-in from the library]
const SFX = {
  "campfire-crackle": ["campfire-crackle", "torch-flame"], "birds-peck": ["birds-peck", "wing-flap"], "owl-hoot": ["owl-hoot", null], sniff: ["sniff", "snuff"],
  "door-creak": ["wood-door-creak", "knock"], "cage-rattle": ["cage-rattle", "pot-bang"], "oven-roar": ["oven-roar", "house-fire"], "iron-slam": ["iron-slam", "pot-bang"], "pearls-rattle": ["pearls-rattle", "coin-jar"],
  crunch: ["crunch", null], step: ["step-grass", null], insects: ["night-insects", null], fog: ["fog-air", null], flap: ["wing-flap", null], fire: ["house-fire", null],
};
const sfxFile = (key, k = 0) => { for (const id of SFX[key].filter(Boolean)) { const f = filesOf(`assets/sfx/ai/${id}`, [".wav", ".ogg"]); if (f.length) { if (id !== SFX[key][0] && !used.includes(key + "->" + id)) used.push(key + "->" + id); return f[k % f.length]; } } if (!missing.includes(key)) missing.push(key); return null; };
const ins = [], f = [];
const add = (file, t0, gain, extra = "") => { if (!file) return; ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`); };
const loop = (file, t0, t1, gain, fi = 0.25, fo = 0.25) => add(file, t0, gain, `aloop=loop=-1:size=2e9,atrim=0:${(t1 - t0).toFixed(2)},afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, t1 - t0 - fo).toFixed(2)}:d=${fo},`);
const one = (file, t0, gain, len = 1.5, fo = 0.3) => add(file, t0, gain, `atrim=0:${len},afade=t=out:st=${Math.max(0, len - fo)}:d=${fo},`);
const at = (id) => LINE[id].at, end = (id) => LINE[id].end, w = (id, p) => { const x = LINE[id].words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(p)); return LINE[id].at + (x ? x[1] : 0); };
const shotAt = (id) => TIMELINE.find((s) => s.id === id).at;

// ---- voices (kid and Gretel a little up: their reads are softer than the narrator's)
for (const ln of Object.values(LINE)) if (existsSync(`${VOICES}/${ln.id}.wav`)) add(`${VOICES}/${ln.id}.wav`, ln.at, { K: 1.1, R: 1.1, G: 1.0, W: 1.0, N: 1.0 }[ln.who]);

// ---- music (Sol 27 Nov, answer-summary.md): beds hg-open, hg-forest, hg-sweet, hg-hunger, hg-oven, hg-run; 72 BPM, 96 for the run.
// Dropouts: ~200 ms at the red eyes (frame 0); a breath before "Stick out your finger" through "Still thin"; the shove through one beat (0.83 s) after the slam;
// before "Turn around" (nothing under L29/L30). Cue times follow the story events (the timeline is voice-led, Sol's seconds were for another cut).
const BEAT = 60 / 72 * 1.0;   // one dotted-quarter beat at 72 BPM (s)
const M = (id, a, b, g, fi, fo) => { const file = musicFile(id); if (!file) { if (!missing.includes(id)) missing.push(id); return; } loop(file, a, b, g, fi, fo); };
M("hg-open", 0.2, at("L03") + 0.4, 0.4, 0.05, 0.5);                            // zither + cello from the first frame (200 ms dropout on the red eyes)
M("hg-forest", at("L03"), end("L12") + 0.3, 0.4, 0.5, 0.6);                      // broken-fifth zither, Waldhorn D as father leaves, Hackbrett tap on the last crumb, flute baits, muted viola under 1812
M("hg-sweet", at("L15") - 0.35, at("L16") - 0.1, 0.4, 0.15, 0.5);              // celesta full motif as the door opens
M("hg-hunger", at("L16") - 0.1, at("L19") - 0.45, 0.42, 0.5, 0.25);            // violins slide to Eb on "smelled him first", peak at the grab; OUT a breath before "Stick out your finger"
M("hg-oven", at("L22"), CUE.shove, 0.4, 0.3, 0.05);                              // doubled cello pulse; OUT at the shove
M("hg-open", CUE.slam + BEAT, end("L26") + 0.2, 0.36, 0.4, 0.6);                // zither 2 bait notes after the slam, Waldhorn fifth under the reversal line
M("hg-run", at("L27") - 0.1, at("L29") - 0.3, 0.42, 0.2, 0.15);                // run home, 96 BPM, flute 2 notes at "gingerbread"; OUT before "Turn around"

// ---- sfx
loop(sfxFile("insects"), 0, DUR, 0.07, 0.3, 0.2);
one(sfxFile("owl-hoot"), 0.6, 0.45, 3.0, 0.8);
loop(sfxFile("fog"), at("L07"), end("L12"), 0.09, 0.6, 0.6);
one(sfxFile("oven-roar"), 2.4, 0.35, 0.6, 0.2); one(sfxFile("oven-roar"), w("L22", "bone") - 0.1, 0.4, 1.0, 0.4);   // the two glimpses
loop(sfxFile("campfire-crackle"), at("L03") - 0.1, at("L04") + 0.3, 0.3, 0.2, 0.4);
one(sfxFile("sniff"), at("L02") + 0.75, 0.6, 1.2); one(sfxFile("sniff"), at("L08") + 0.25, 0.6, 1.2);
for (let i = 0; i < 6; i++) add(sfxFile("step", i), shotAt("4b") + 0.2 + i * 0.5, 0.35);
add(sfxFile("flap", 0), at("L05") + 0.1, 0.35); add(sfxFile("flap", 3), at("L05") + 0.5, 0.3);
loop(sfxFile("birds-peck"), at("L05") + 0.15, at("L05") + 1.75, 0.5, 0.1, 0.4);
{ const a = at("L10") - 0.3, b = end("L12") + 0.6; for (let t = a, i = 0; t < b; t += 0.52, i++) add(sfxFile("step", i), t, 0.3); }   // the walk to the house
add(sfxFile("crunch", 0), shotAt("12a") + 0.85, 0.7); add(sfxFile("crunch", 1), shotAt("12a") + 1.15, 0.55);
one(sfxFile("door-creak"), at("L15") - 0.35, 0.55, 2.2, 0.5);
for (let i = 0; i < 3; i++) one(sfxFile("sniff", i + 1), w("L17", "witches") + 0.1 + i * 1.5, 0.7, 1.2);
one(sfxFile("sniff", 2), shotAt("16c") + 0.3, 0.8, 1.4);
one(sfxFile("cage-rattle"), shotAt("17a") + 0.4, 0.6, 1.6); one(sfxFile("cage-rattle", 1), shotAt("17b") + 0.9, 0.7, 2.0, 0.6);
one(sfxFile("oven-roar"), CUE.oven - 0.25, 0.7, 2.6, 0.7);
loop(sfxFile("fire"), at("L24"), CUE.shove + 0.1, 0.12, 0.4, 0.05);
one(sfxFile("iron-slam"), CUE.slam, 0.9, 1.6, 0.5);
loop(sfxFile("pearls-rattle"), w("L27", "pockets") - 0.1, w("L27", "pockets") + 2.0, 0.5, 0.1, 0.5);
{ const a = at("L27") + 0.1, b = at("L28") - 0.2; for (let t = a, i = 0; t < b; t += 0.29, i++) add(sfxFile("step", i), t, 0.26); }
one(sfxFile("crunch", 2), at("L28") + 0.05, 0.4, 0.5, 0.2); one(sfxFile("sniff", 0), at("L28") + 0.2, 0.5, 1.0);
for (let i = 0; i < 3; i++) one(sfxFile("crunch", i), at("L30") + 0.15 + i * 0.4, 0.5, 0.5, 0.2);   // chewing under the last line

const k = ins.length / 2;
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { maxBuffer: 1 << 28 });
console.log("mix", mixPath, "inputs", k, missing.length ? "MISSING: " + missing.join(",") : "all sounds present", used.length ? "(stand-ins: " + used.join(", ") + ")" : "");
