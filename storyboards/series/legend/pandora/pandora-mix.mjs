// The sound mix for pandora-draft1: voices (pd-voice.mjs timeline) + music beds + sfx, built on the director's score (SHOTS.md + the task list).
//   node storyboards/series/legend/pandora/pandora-mix.mjs out/legend-pandora/mix.wav
// music/sfx come from out/legend-pandora/{music,sfx}; a sound that is missing is skipped and listed. The evils make no sound.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { TIMELINE } from "./pandora.mjs";
import { LINE, DUR, wordAt } from "./pd-voice.mjs";
const OUT = "out/legend-pandora", [mixPath = `${OUT}/mix.wav`] = process.argv.slice(2);
const missing = [], used = [];
const find = (dir, id, k = 0) => {
  const d = `${OUT}/${dir}`, mf = `${d}/manifest.json`; let files = [];
  if (k === "bed") { const b = `${d}/${id}/${id}-bed.wav`; if (existsSync(b)) return b; k = 0; }
  if (existsSync(mf)) { const m = JSON.parse(readFileSync(mf, "utf8").replace(/NaN/g, "null")).sounds?.find((s) => s.id === id); if (m) files = m.files.map((f) => `${d}/${f}`); }
  if (!files.length && existsSync(d)) files = readdirSync(d).filter((f) => f.startsWith(id) && f.endsWith(".wav")).sort().map((f) => `${d}/${f}`);
  if (!files.length) { const r = `${OUT}/raw/${id}`; if (existsSync(r)) files = readdirSync(r).filter((f) => f.endsWith(".wav")).sort().map((f) => `${r}/${f}`); }
  if (!files.length) { if (!missing.includes(id)) missing.push(id); return null; }
  return files[k % files.length];
};
const ins = [], bus = { vo: [], mus: [], sfx: [] };
const add = (b, file, t0, gain, extra = "") => { if (!file) return; ins.push("-i", file); const k = ins.length / 2 - 1; bus[b].push(k); filt.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`); };
const filt = [];
const loop = (b, file, t0, t1, gain, fi = 0.25, fo = 0.25) => add(b, file, t0, gain, `aloop=loop=-1:size=2e9,atrim=0:${(t1 - t0).toFixed(2)},afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, t1 - t0 - fo).toFixed(2)}:d=${fo},`);
const one = (b, file, t0, gain, len, fo = 0.1) => add(b, file, t0, gain, `atrim=0:${len},afade=t=out:st=${Math.max(0, len - fo)}:d=${fo},`);
const at = (id) => LINE[id].at, end = (id) => LINE[id].end;
const w = (id, p) => LINE[id].at + wordAt(LINE[id], p);
const sh = (id) => TIMELINE.find((s) => s.id === id).at;
// voices: every take laid down in pieces around its cuts (cuts lie in measured silence), 6 ms fades at every join
for (const ln of Object.values(LINE)) {
  const g = { K: 1.15, G: 1.0, N: 1.0, P: 1.0, E: 1.0 }[ln.who], f = `${OUT}/vo/${ln.id}.wav`;
  let pos = 0, out = 0; const segs = [...ln.cuts.map(([a, b]) => [a, b]), [ln.endKeep, ln.endKeep]];
  for (const [a, b] of segs) { add("vo", f, ln.at + out, g, `atrim=${pos.toFixed(3)}:${a.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st=${Math.max(0, a - pos - 0.006).toFixed(3)}:d=0.006,`); out += a - pos; pos = b; }
}
const M = (id, a, b, g, fi, fo) => loop("mus", find("music", id), a, b, g, fi, fo);
const lift = sh("16a");                                                   // the lid starts to lift: music is gone for L17
// music (Sol r1 part C, director calls): room tone + trace cello to 12.6 s, myth from "stolen fire", forge only in the forge, hard silence at the lift
// (score AND ambience, through "Not a sound." and the gap after), thin strings under the consequences and out on "without a sound",
// nothing on the slam or "one thing", hope from the first amber glint, thin at Grandma's hand
const slap0 = at("L24") - 0.06, glint = LINE.L21.at + LINE.L21.words[5][1] - 0.05, wo = w("L19", "without");
M("pd-hush", 0, 12.6, 0.4, 0.02, 1.2);
M("pd-myth", w("L04", "fire") - 0.3, end("L10") + 0.2, 0.4, 0.8, 0.5);
M("pd-forge", sh("6a") - 0.05, sh("7a") + 0.05, 0.3, 0.3, 0.3);
M("pd-lyre", at("L11") - 0.1, end("L12") + 0.3, 0.4, 0.2, 0.4);
M("pd-dread", at("L13"), lift - 0.04, 0.4, 0.5, 0.06);
M("pd-dread", at("L18") - 0.05, wo - 0.05, 0.22, 0.5, 0.25);
M("pd-hope", glint, slap0, 0.32, 0.6, 0.25);
M("pd-hope", slap0 - 0.1, DUR, 0.15, 0.25, 0.1);
// room tone and the lamp: quiet beds; NOTHING from the lift to the start of L18
loop("sfx", find("sfx", "night-room", "bed"), 0, 12.6, 0.35, 0.05, 1.0);
loop("sfx", find("sfx", "night-room", "bed"), end("L10"), lift - 0.04, 0.3, 0.4, 0.05);
loop("sfx", find("sfx", "oil-lamp", "bed"), at("L13"), lift - 0.04, 0.2, 0.4, 0.05);
loop("sfx", find("sfx", "night-room", "bed"), at("L18") - 0.05, at("L21"), 0.28, 0.4, 0.4);
loop("sfx", find("sfx", "oil-lamp", "bed"), at("L18"), wo, 0.14, 0.2, 0.3);
// sfx (the evils themselves are silent)
const th = find("sfx", "thunder-crack", 0);
one("sfx", th, w("L04", "laughed") - 0.05, 0.9, 3.5, 1.0); one("sfx", find("sfx", "thunder-crack", 1) || th, sh("5a") + 0.6, 0.45, 2.2, 0.8);
loop("sfx", find("sfx", "forge-fire"), sh("6a") - 0.05, sh("7a") + 0.1, 0.5, 0.3, 0.4);
for (const [i, p] of ["mixed", "mud", "water", "woman"].entries()) one("sfx", find("sfx", "clay-squish", i), w("L06", p) - 0.02, 0.8, 0.9, 0.2);
one("sfx", find("sfx", "door-open"), sh("10a") - 0.5, 0.85, 2.0, 0.4);
one("sfx", find("sfx", "lid-scrape"), lift + 0.15, 0.9, Math.min(0.78, at("L17") - lift - 0.17), 0.12);
one("sfx", find("sfx", "cough"), sh("17b") + 0.12, 0.9, 1.0, 0.2);
one("sfx", find("sfx", "lid-slam"), sh("19a") + 0.38, 1.0, 1.2, 0.3);
one("sfx", find("sfx", "jar-tap", 0), slap0 + 0.13, 1.0, 0.7, 0.1);
one("sfx", find("sfx", "lid-slam", 0), slap0 + 0.13, 0.25, 0.5, 0.1);
// bus: voices, music ducked under the voices (sidechain), sfx; loudness at the end
const sum = (b, name) => (bus[b].length ? `${bus[b].map((k) => `[a${k}]`).join("")}amix=inputs=${bus[b].length}:normalize=0[${name}]` : `anullsrc=r=44100:cl=mono,atrim=0:${DUR}[${name}]`);
const graph = [...filt, sum("vo", "vo"), sum("mus", "mus"), sum("sfx", "sfx"), "[vo]asplit=2[vo1][vo2]", "[mus][vo1]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=400[musd]",
  `[vo2][musd][sfx]amix=inputs=3:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`].join(";");
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", graph, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
console.log("mix", mixPath, "inputs", ins.length / 2, missing.length ? "MISSING: " + missing.join(",") : "all sounds present");
