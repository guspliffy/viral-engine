// The sound mix for the hg draft: voices (timeline from hg.mjs) + Sol's cue sheet (music) + sfx.
//   node storyboards/series/legend/hansel-gretel/hg-mix.mjs out/legend-hansel/mix.wav
// SWAPPING IN THE NEW SOUNDS IS ONE EDIT-FREE STEP: every sound below is looked up by its new id first (music assets/music/ai/hg-*.ogg or
// hg-*/hg-*-NN.ogg; sfx assets/sfx/ai/<id>/*.wav), then by the library stand-in listed in SFX. When the hg-* files exist they win automatically.
// A sound that is in neither place is skipped and listed at the end ("MISSING").
import { existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINE, DUR, CUE, TIMELINE } from "./hg.mjs";
const [mixPath = "out/legend-hansel/mix.wav"] = process.argv.slice(2);
const VOICES = process.env.HG_VO || "out/legend-hansel/vo-cut", missing = [], used = [];
const filesOf = (dir, exts) => (existsSync(dir) ? readdirSync(dir).filter((x) => exts.some((e) => x.endsWith(e))).sort().map((x) => `${dir}/${x}`) : []);
const musicFile = (id) => { const flat = filesOf("assets/music/ai", [".ogg", ".wav"]).filter((f) => f.split("/").pop().startsWith(id)); const dir = filesOf(`assets/music/ai/${id}`, [".ogg", ".wav"]); return [...flat, ...dir][0] || null; };
// sfx: [new id (TODO: hg-sfx recipes), stand-in from the library]
const SFX = {
  "campfire-crackle": ["campfire-crackle", "torch-flame"], "birds-peck": ["birds-peck", "wing-flap"], "owl-hoot": ["owl-hoot", null], sniff: ["sniff", "snuff"],
  "door-creak": ["wood-door-creak", "knock"], "cage-rattle": ["cage-rattle", "pot-bang"], "oven-roar": ["oven-roar", "house-fire"], "iron-slam": ["iron-slam", "pot-bang"], "pearls-rattle": ["pearls-rattle", "coin-jar"],
  crunch: ["crunch", null], ignite: ["ignite", null], step: ["step-grass", null], insects: ["night-insects", null], fog: ["fog-air", null], flap: ["wing-flap", null], fire: ["house-fire", null],
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
// The beds start at 0.0 and sit about 7 dB under the voice (both are about -16 LUFS, so the bed gain is 0.45). A bed is tiled from its takes (-01, -02, ..),
// each take crossfaded into the next. Dropouts (listed in HOLES): 200 ms on the red eyes; a breath before "Stick out your finger" through "Still thin";
// the shove through one beat (0.83 s) after the slam; before "Turn around" and nothing under the last two lines. Beds change at the story turns.
const BEAT = 60 / 72 * 1.0, BG = 0.45, XF = 0.2;
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const takes = (id) => [...filesOf("assets/music/ai", [".ogg", ".wav"]).filter((x) => x.split("/").pop().startsWith(id)), ...filesOf(`assets/music/ai/${id}`, [".ogg", ".wav"])];
const HOLES = [];                                                              // [from, to, why]
const hole = (a, b, why) => HOLES.push([a, b, why]);
const M = (id, a, b, g = BG, fi = 0.4, fo = 0.5) => {
  const tk = takes(id); if (!tk.length) { if (!missing.includes(id)) missing.push(id); return; }
  // cut the span at every hole inside it
  let segs = [[a, b]];
  for (const [h0, h1] of HOLES) segs = segs.flatMap(([x, y]) => (h1 <= x || h0 >= y ? [[x, y]] : [[x, Math.max(x, h0)], [Math.min(y, h1), y]].filter(([p, q]) => q - p > 0.05)));
  for (const [x, y] of segs) {
    let t = x, i = 0;
    while (t < y - 0.05) {
      const f1 = tk[i % tk.length], d = dur(f1), e = Math.min(y, t + d), last = e >= y - 1e-6;
      const fin = t === x ? (x === a ? fi : 0.06) : XF, fout = last ? (y === b ? fo : 0.06) : XF;
      add(f1, t, g, `atrim=0:${(e - t + (last ? 0 : XF)).toFixed(3)},afade=t=in:d=${fin},afade=t=out:st=${Math.max(0, e - t + (last ? 0 : XF) - fout).toFixed(3)}:d=${fout},`);
      t = e; i++;
    }
  }
};
const eyesAt = TIMELINE.find((s) => s.id === "1").at + 1.45;
hole(eyesAt, eyesAt + 0.2, "red eyes turn");
hole(at("L19") - 0.45, at("L22") - 0.05, "Stick out your finger .. Still thin");
hole(CUE.shove, CUE.slam + BEAT, "shove through the slam + one beat");   // 0.83 s after the slam
hole(at("L29") - 0.3, DUR, "Turn around .. I'm turning");
M("hg-open", 0.0, at("L03") + 0.4, BG, 0.05, 0.5);                              // zither + cello from the first frame
M("hg-forest", at("L03"), at("L15") + 0.1, BG, 0.5, 0.6);                        // broken-fifth zither, Waldhorn D as the father leaves, flute baits, muted viola under 1812, up to the door
M("hg-sweet", at("L15") - 0.35, at("L16") - 0.1, BG, 0.15, 0.5);               // celesta full motif as the door opens
M("hg-hunger", at("L16") - 0.1, at("L22"), BG, 0.5, 0.25);                      // violins slide on "smelled him first", peak at the grab; OUT before "Stick out your finger"
M("hg-oven", at("L22"), CUE.shove, BG, 0.3, 0.05);                              // doubled cello pulse; OUT at the shove
M("hg-open", CUE.slam + BEAT, at("L27"), 0.4, 0.4, 0.5);               // zither 2 bait notes after the slam + one beat
M("hg-run", at("L27") - 0.1, at("L29") - 0.3, BG, 0.2, 0.15);                  // run home, 96 BPM; OUT before "Turn around"
console.log("holes", HOLES.map(([a, b, y]) => `${a.toFixed(2)}-${b.toFixed(2)} ${y}`).join(" | "));

// ---- sfx
loop(sfxFile("insects"), 0, DUR, 0.07, 0.3, 0.2);
one(sfxFile("owl-hoot"), 0.6, 0.4, 3.0, 0.8);
loop(sfxFile("fog"), at("L07"), end("L12"), 0.09, 0.6, 0.6);
one(sfxFile("oven-roar"), 2.4, 0.35, 0.6, 0.2); one(sfxFile("oven-roar", 1), LINE.L12.end - 0.12, 0.4, 1.0, 0.4);   // the two oven glimpses
loop(sfxFile("campfire-crackle"), at("L03") - 0.1, at("L04") + 0.3, 0.3, 0.2, 0.4);
one(sfxFile("sniff"), at("L02") + 0.75, 0.6, 1.2); one(sfxFile("sniff", 1), at("L08") + 0.25, 0.6, 1.2);
for (let i = 0; i < 6; i++) add(sfxFile("step", i), shotAt("4b") + 0.2 + i * 0.5, 0.35);
add(sfxFile("flap", 0), shotAt("5") + 0.0, 0.35); add(sfxFile("flap", 3), shotAt("5") + 0.3, 0.3);
loop(sfxFile("birds-peck"), shotAt("5") + 0.05, shotAt("5") + 0.83, 0.5, 0.05, 0.2);
{ const a = at("L10") - 0.3, b = end("L12") + 0.6; for (let t = a, i = 0; t < b; t += 0.52, i++) add(sfxFile("step", i), t, 0.3); }   // the walk to the house
add(sfxFile("crunch", 0), shotAt("12a") + 0.17, 0.6); add(sfxFile("crunch", 1), shotAt("12a") + 0.6, 0.7);   // the break, then the bite
one(sfxFile("door-creak"), shotAt("14") + 0.05, 0.55, 2.2, 0.5);
for (let i = 0; i < 3; i++) one(sfxFile("sniff", i + 2), w("L17", "witches") + 0.1 + i * 1.5, 0.7, 1.2);
one(sfxFile("sniff", 5), shotAt("16c") + 0.3, 0.8, 1.4);
one(sfxFile("sniff", 6), shotAt("17a") + 0.4, 0.6, 1.2);
one(sfxFile("cage-rattle"), shotAt("17c") + 0.2, 0.6, 1.6); one(sfxFile("cage-rattle", 1), shotAt("17d") + 0.4, 0.7, 2.0, 0.6);
one(sfxFile("ignite"), shotAt("22c") + 0.3, 0.55, 1.0, 0.3);
one(sfxFile("oven-roar", 2), CUE.oven - 0.25, 0.7, 2.6, 0.7);
loop(sfxFile("fire"), at("L24"), CUE.shove + 0.1, 0.12, 0.4, 0.05);
one(sfxFile("iron-slam"), CUE.slam, 0.9, 1.6, 0.5);
one(sfxFile("cage-rattle", 3), shotAt("26a") + 0.25, 0.6, 1.0, 0.3);
one(sfxFile("pearls-rattle"), shotAt("26b") + 0.1, 0.6, 1.3, 0.4);
{ const a = at("L27") + 0.1, b = at("L28") - 0.2; for (let t = a, i = 0; t < b; t += 0.29, i++) add(sfxFile("step", i), t, 0.26); }
one(sfxFile("crunch", 2), at("L28") + 0.05, 0.4, 0.5, 0.2); one(sfxFile("sniff", 0), at("L28") + 0.2, 0.5, 1.0);
for (let i = 0; i < 3; i++) one(sfxFile("crunch", i), at("L30") + 0.15 + i * 0.4, 0.5, 0.5, 0.2);   // chewing under the last line

const k = ins.length / 2;
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { maxBuffer: 1 << 28 });
console.log("mix", mixPath, "inputs", k, missing.length ? "MISSING: " + missing.join(",") : "all sounds present", used.length ? "(stand-ins: " + used.join(", ") + ")" : "");
