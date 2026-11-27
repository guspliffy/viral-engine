// The sound mix for fw-draft: voices (lines.json order, times from fw.mjs) + the cue list fw-cues.json (music stems, ambience, sfx).
//   node storyboards/series/legend/fisherman/fw-mix.mjs out/legend-fisher/mix.wav
// Music cues are ducked under speech (sidechain, about -7 dB). A cue whose file is missing is skipped with a warning.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINE, DUR } from "./fw.mjs";
const OUT = "out/legend-fisher", [mixPath = `${OUT}/mix.wav`] = process.argv.slice(2);
const CUES = JSON.parse(readFileSync("storyboards/series/legend/fisherman/fw-cues.json", "utf8"));
const num = (v) => (typeof v === "number" ? v : null);
// anchor: seconds | "END" | "L15" | "L15:black" with an optional +/-offset
function T(v) {
  if (num(v) !== null) return v;
  const m = /^(END|L\d+)(?::([A-Za-z']+))?([+-][\d.]+)?$/.exec(String(v).trim());
  if (!m) throw new Error("bad time " + v);
  let t = m[1] === "END" ? DUR : LINE[m[1]].at;
  if (m[2]) { const w = LINE[m[1]].words.find((q) => q[0].toLowerCase().replace(/[^a-z']/g, "").startsWith(m[2].toLowerCase())); if (!w) throw new Error("no word " + m[2] + " in " + m[1]); t += w[1]; }
  return t + (m[3] ? +m[3] : 0);
}
const warn = [], ins = [], vf = [], mf = [], sf = [];
const used = new Set();
let idx = 0;
function add(bus, file, t0, t1, gain, o = {}) {
  const k = idx++; ins.push("-i", file);
  const dur = Math.max(0.05, t1 - t0);
  let ex = "";
  if (o.loop) ex += `aloop=loop=-1:size=2e9,`;
  ex += `atrim=0:${(o.trim ? Math.min(o.trim, dur) : dur).toFixed(3)},asetpts=PTS-STARTPTS,`;
  const len = o.trim ? Math.min(o.trim, dur) : dur, fi = o.fi ?? 0, fo = o.fo ?? 0;
  if (fi) ex += `afade=t=in:d=${fi},`;
  if (fo) ex += `afade=t=out:st=${Math.max(0, len - fo).toFixed(3)}:d=${Math.min(fo, len)},`;
  bus.push(`[${k}:a]aformat=sample_rates=44100:channel_layouts=stereo,${ex}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`);
  return `[a${k}]`;
}
const vTags = [], mTags = [], sTags = [];
for (const ln of Object.values(LINE)) vTags.push(add(vf, `${OUT}/vo/${ln.id}.wav`, ln.at, ln.at + ln.dur, { K: 1.15, G: 1.0, N: 1.0, F: 1.0 }[ln.who] ?? 1));
for (const [list, bus, tags] of [[CUES.music || [], mf, mTags], [CUES.sfx || [], sf, sTags]]) {
  for (const c of list) {
    if (!existsSync(c.file)) { warn.push(c.file); continue; }
    used.add(c.file);
    const t0 = T(c.at), t1 = c.to !== undefined ? T(c.to) : t0 + (c.trim ?? 6);
    if (t1 <= t0) { warn.push(c.file + " (empty span)"); continue; }
    tags.push(add(bus, c.file, t0, t1, c.gain ?? 1, c));
  }
}
const mdir = `${OUT}/music`;
if (existsSync(mdir)) for (const f of readdirSync(mdir)) if (/^fw-music-.*\.wav$/.test(f) && !used.has(`${mdir}/${f}`)) warn.push(`${mdir}/${f} is not named in fw-cues.json (unused)`);
const mix = (tags, name) => tags.length ? `${tags.join("")}amix=inputs=${tags.length}:normalize=0[${name}]` : null;
const g = [...vf, ...mf, ...sf];
g.push(mix(vTags, "vo"));
g.push(`[vo]asplit=2[vo1][vo2]`);
const bus = ["[vo1]"];
if (mTags.length) { g.push(mix(mTags, "mus")); g.push(`[mus][vo2]sidechaincompress=threshold=0.03:ratio=3.5:attack=30:release=350:makeup=1[musd]`); bus.push("[musd]"); } else g.push(`[vo2]anullsink`);
if (sTags.length) { g.push(mix(sTags, "sfx")); bus.push("[sfx]"); }
g.push(`${bus.join("")}amix=inputs=${bus.length}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`);
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", g.filter(Boolean).join(";"), "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { stdio: "inherit" });
console.log("mix", mixPath, "inputs", idx, "music cues", mTags.length, "sfx cues", sTags.length, warn.length ? "\nWARNING missing/unused: " + warn.join(", ") : "all files present");
