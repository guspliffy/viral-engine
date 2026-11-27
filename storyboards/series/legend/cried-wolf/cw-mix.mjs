// The sound mix for cw-draft: voices (lines.json order, times from cw.mjs) + Sol's cue sheet (music) + realistic sfx.
//   node storyboards/series/legend/cried-wolf/cw-mix.mjs out/legend-wolf/mix.wav
// music/sfx come from out/legend-wolf/{music,sfx} (pick.py output); a missing sound is skipped and listed.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINE, DUR } from "./cw.mjs";
const OUT = "out/legend-wolf", [mixPath = `${OUT}/mix.wav`] = process.argv.slice(2);
const man = (d) => (existsSync(`${OUT}/${d}/manifest.json`) ? JSON.parse(readFileSync(`${OUT}/${d}/manifest.json`, "utf8").replace(/NaN/g, "null")).sounds : []);
const MUS = man("music"), SFX = man("sfx"), missing = [], usedRaw = [];
const rawTake = (id, k) => { const d = `${OUT}/raw/${id}`; if (!existsSync(d)) return null; const fl = readdirSync(d).filter((x) => x.endsWith(".wav")).sort(); return fl.length ? `${d}/${fl[k % fl.length]}` : null; };   // pick.py cut nothing: use the raw take
const find = (arr, dir, id, k = 0) => { const m = arr.find((s) => s.id === id); if (m && !m.files.length) { const r = rawTake(id, k); if (r) { if (!usedRaw.includes(id)) usedRaw.push(id); return r; } } if (!m) { if (!missing.includes(id)) missing.push(id); return null; } return `${OUT}/${dir}/${m.files[k % m.files.length]}`; };
const ins = [], f = [];
const add = (file, t0, gain, extra = "") => { if (!file) return; ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`); };
const loop = (file, t0, t1, gain, fi = 0.25, fo = 0.25) => add(file, t0, gain, `aloop=loop=-1:size=2e9,atrim=0:${(t1 - t0).toFixed(2)},afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, t1 - t0 - fo).toFixed(2)}:d=${fo},`);
const at = (id) => LINE[id].at, w = (id, p) => { const x = LINE[id].words.find((q) => q[0].toLowerCase().replace(/[^a-z']/g, "").startsWith(p)); return LINE[id].at + (x ? x[1] : 0); };
// voices (kid a little up: his read is softer than the narrator's); a line with CUTS (real digital silence taken out) is laid down in pieces
for (const ln of Object.values(LINE)) {
  const g = { K: 1.15, G: 1.0, V: 1.0, N: 1.0 }[ln.who], f = `${OUT}/vo/${ln.id}.wav`;
  if (!ln.cuts.length) { add(f, ln.at, g); continue; }
  let pos = 0, out = 0; const segs = [...ln.cuts.map(([a, b]) => [a, b]), [1e9, 1e9]];
  for (const [a, b] of segs) { add(f, ln.at + out, g, `atrim=${pos}${a < 1e8 ? ":" + a : ""},asetpts=PTS-STARTPTS,`); out += (a < 1e8 ? a : 0) - pos; pos = b; }
}
// music (Sol): cello from frame 1, prank 116 BPM, guilt cut on "voice", OFF through the howl and its tail, low dread under the history line, MUTE from the first
// light out, dread as the eyes multiply, lyra on the idea, chase, HARD MUTE before WOLF!, soft lyra on the teeth, cut before the kid's last line
const M = (id, a, b, g, fi, fo) => loop(find(MUS, "music", id), a, b, g, fi, fo);
M("cw-eyes", 0, at("L03") + 0.2, 0.4, 0.02, 0.3);
M("cw-prank", at("L03"), at("L10"), 0.4, 0.3, 0.2);
M("cw-guilt", at("L10"), w("L11", "voice") - 0.02, 0.4, 0.3, 0.02);
M("cw-dread", at("L13"), w("L15", "lights") - 0.05, 0.3, 0.8, 0.05);
M("cw-dread", w("L17", "more") - 0.3, at("L18"), 0.36, 0.5, 0.3);
M("cw-guilt", at("L18"), at("L20"), 0.34, 0.3, 0.3);
M("cw-chase", at("L20") + 0.25, at("L23") + LINE.L23.len - 0.3, 0.42, 0.3, 0.02);
M("cw-lamplight", at("L25") + 0.2, at("L26") + LINE.L26.len + 0.1, 0.34, 0.3, 0.1);
// sfx
const howl = find(SFX, "sfx", "wolf-howl", 0), howl2 = find(SFX, "sfx", "wolf-howl", 1);
add(howl, 0.0, 0.25, "atrim=0:3.0,afade=t=out:st=2.4:d=0.6,");
add(howl2 || howl, w("L12", "howled") - 0.15, 0.85, "atrim=0:4.5,afade=t=out:st=3.5:d=1.0,");
const snarl = find(SFX, "sfx", "wolf-snarl");
add(snarl, 2.4, 0.3, "atrim=0:0.6,"); add(snarl, w("L13", "but") - 0.1, 0.35, "atrim=0:1.2,afade=t=out:st=0.9:d=0.3,"); add(snarl, w("L25", "teeth") - 0.25, 0.55, "atrim=0:1.8,afade=t=out:st=1.4:d=0.4,");
const bells = find(SFX, "sfx", "sheep-bells");
loop(bells, at("L05") + 0.1, at("L05") + 2.6, 0.35, 0.3, 0.4); loop(bells, at("L21") - 0.05, at("L22") + 5.0, 0.7, 0.2, 0.5);
const rush = find(SFX, "sfx", "village-rush");
add(rush, at("L05") + 0.3, 0.45, "atrim=0:2.2,afade=t=out:st=1.6:d=0.6,"); add(rush, w("L23", "every") + 0.5, 0.7, "atrim=0:2.2,afade=t=out:st=1.5:d=0.7,");
for (let i = 0; i < 6; i++) add(find(SFX, "sfx", "sheep-bleat", i), w("L21", "and") + 0.2 + i * 0.45, 0.35 + 0.1 * (i % 2));
for (let i = 0; i < 4; i++) add(find(SFX, "sfx", "sheep-bleat", i + 6), w("L22", "the") + 0.1 + i * 0.7, 0.4);
add(find(SFX, "sfx", "wooden-gate"), at("L20") + 0.4, 0.7, "atrim=0:1.6,afade=t=out:st=1.2:d=0.4,");
add(find(SFX, "sfx", "chapel-bell"), at("L24") + LINE.L24.len + 0.2, 0.5, "atrim=0:3.5,afade=t=out:st=2.6:d=0.9,");
loop(find(SFX, "sfx", "cicadas-night"), 0, DUR, 0.06, 0.1, 0.1);
const k = ins.length / 2;
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
console.log("mix", mixPath, "inputs", k, missing.length ? "MISSING: " + missing.join(",") : "all sounds present", usedRaw.length ? "(raw takes: " + usedRaw.join(",") + ")" : "");
