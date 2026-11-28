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
const warn = [], ins = [], vf = [], mf = [], sf = [], df = [];
const used = new Set();
// a stem by id: the manifest of its folder (pick.py output: { sounds: [{ id, files }] }), else the first <id>*.wav in the folder
function resolve(c) {
  if (c.file) return c.file;
  const dir = `${OUT}/${c.dir}`, mf2 = `${dir}/manifest.json`;
  if (existsSync(mf2)) { try { const m = JSON.parse(readFileSync(mf2, "utf8").replace(/NaN/g, "null")).sounds.find((q) => q.id === c.id); if (m && m.files && m.files.length) return `${dir}/${m.files[(Number.isInteger(c.take) ? c.take : 0) % m.files.length]}`; } catch (e) { /* fall through */ } }
  if (existsSync(`${dir}/${c.id}.wav`)) return `${dir}/${c.id}.wav`;
  if (existsSync(dir)) { const f = readdirSync(dir).filter((x) => x.startsWith(c.id) && /\.(wav|ogg|mp3)$/.test(x)).sort(); if (f.length) return `${dir}/${f[(Number.isInteger(c.take) ? c.take : 0) % f.length]}`; }
  const raw = `${OUT}/raw/${c.id}`;   // pick.py has not run yet: use the raw take
  if (existsSync(raw)) { const f = readdirSync(raw).filter((x) => x.endsWith(".wav")).sort(); if (f.length) return `${raw}/${f[(Number.isInteger(c.take) ? c.take : 0) % f.length]}`; }
  return `${dir}/${c.id}.wav`;
}
// a music take shorter than its cue: repeat it with a 0.5 s crossfade (written once next to the stems), instead of a hard aloop
const durOf = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
function xfLoop(file, need) {
  const d = durOf(file), XF = 0.5;
  if (d >= need) return file;
  const n = Math.ceil((need - XF) / (d - XF)), out = `${OUT}/music/_loop-${file.split("/").pop().replace(/\.wav$/, "")}-${n}.wav`;
  if (!existsSync(out)) {
    const a = []; for (let i = 0; i < n; i++) a.push("-i", file);
    let fc = "", last = "[0:a]";
    for (let i = 1; i < n; i++) { fc += `${last}[${i}:a]acrossfade=d=${XF}:c1=tri:c2=tri[x${i}];`; last = `[x${i}]`; }
    execFileSync("ffmpeg", ["-v", "error", "-y", ...a, "-filter_complex", fc.replace(/;$/, ""), "-map", last, out]);
  }
  return out;
}
let idx = 0;
function add(bus, file, t0, t1, gain, o = {}) {
  const k = idx++; ins.push("-i", file);
  const dur = Math.max(0.05, t1 - t0), len = o.trim ? Math.min(o.trim, dur) : dur, fi = o.fi ?? 0, fo = o.fo ?? 0;
  let ex = "";
  if (o.loop) ex += `aloop=loop=-1:size=2e9,`;
  ex += `atrim=0:${len.toFixed(3)},asetpts=PTS-STARTPTS,`;
  if (fi) ex += `afade=t=in:d=${fi},`;
  if (fo) ex += `afade=t=out:st=${Math.max(0, len - fo).toFixed(3)}:d=${Math.min(fo, len)},`;
  bus.push(`[${k}:a]aformat=sample_rates=44100:channel_layouts=stereo,${ex}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`);
  return `[a${k}]`;
}
const vTags = [], dTags = [], sTags = [];
for (const ln of Object.values(LINE)) vTags.push(add(vf, `${OUT}/vo/${ln.id}.wav`, ln.at, ln.at + ln.dur, { K: 1.15, G: 1.0, N: 1.0, F: 1.0 }[ln.who] ?? 1));
for (const [list, isMusic] of [[CUES.music || [], true], [CUES.sfx || [], false]]) {
  for (const c of list) {
    const file = resolve(c);
    if (!existsSync(file)) { warn.push(file); continue; }
    used.add(file);
    const t0 = T(c.at), t1 = c.to !== undefined ? T(c.to) : t0 + (c.trim ?? 6);
    if (t1 <= t0) { warn.push(file + " (empty span)"); continue; }
    let f2 = file, c2 = c;
    if (isMusic && c.loop) { f2 = xfLoop(file, t1 - t0 + 0.1); c2 = { ...c, loop: false }; }
    const ducked = c.duck ?? isMusic;
    if (ducked) dTags.push(add(df, f2, t0, t1, c.gain ?? 1, c2)); else sTags.push(add(sf, f2, t0, t1, c.gain ?? 1, c2));
  }
}
const mixOf = (tags, name) => tags.length ? `${tags.join("")}amix=inputs=${tags.length}:normalize=0[${name}]` : null;
// the duck: every voice line lowers music + wind + surf by 7 dB (ramp in 0.1 s before, out 0.25 s after the last sound): 10^(-7/20) = 0.447
const DUCK = 0.447;
const act = Object.values(LINE).map((ln) => `clip((t-${(ln.at - 0.12).toFixed(3)})/0.12,0,1)*clip((${(ln.at + ln.len + 0.25).toFixed(3)}-t)/0.25,0,1)`).join("+");
const g = [...vf, ...df, ...sf, mixOf(vTags, "vo")];
const bus = ["[vo]"];
if (dTags.length) { g.push(mixOf(dTags, "dmix")); g.push(`[dmix]volume='1-${(1 - DUCK).toFixed(3)}*min(1,${act})':eval=frame[dd]`); bus.push("[dd]"); }
if (sTags.length) { g.push(mixOf(sTags, "sfx")); bus.push("[sfx]"); }
g.push(`${bus.join("")}amix=inputs=${bus.length}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`);
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", g.filter(Boolean).join(";"), "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { stdio: "inherit" });
console.log("mix", mixPath, "inputs", idx, "ducked cues", dTags.length, "plain sfx cues", sTags.length, warn.length ? "\nWARNING missing: " + warn.join(", ") : "all files present");
