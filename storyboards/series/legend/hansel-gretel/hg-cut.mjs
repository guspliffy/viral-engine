// Round 2 line cuts (Sol R1 + director D2), only inside measured silence (10 ms RMS < 0.6 % of the take peak):
//   L11 drop the second sentence after "1812." | L20 drop "Her eyes couldn't tell the difference" after "chicken bone." | L28 shorten the pause between "Gretel..." and "gingerbread" to 0.40 s
//   L05 and L26 are dropped whole (not copied). Everything else is copied unchanged.
//   node storyboards/series/legend/hansel-gretel/hg-cut.mjs   ->  out/legend-hansel/vo-cut/<id>.wav (+ words.json, re-timed by hg-whisper.py)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
const SRC = "out/legend-hansel/vo", DST = "out/legend-hansel/vo-cut"; mkdirSync(DST, { recursive: true });
function readWav(p) { const b = readFileSync(p); let o = 12, sr = 44100, data = null; while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); } return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) }; }
function writeWav(p, s, sr) { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + s.length * 2, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(s.length * 2, 40); writeFileSync(p, Buffer.concat([h, Buffer.from(s.buffer, s.byteOffset, s.byteLength)])); }
// silent runs: [start, end] samples where every 10 ms window is < 0.6 % of the take's peak
function silences(s, sr) {
  let pk = 0; for (const v of s) pk = Math.max(pk, Math.abs(v)); const thr = 0.006 * pk, win = Math.round(sr * 0.01), runs = []; let a = -1;
  for (let i = 0; i + win <= s.length; i += win) { let q = 0; for (let j = i; j < i + win; j++) q += (s[j] / 1) ** 2; const rms = Math.sqrt(q / win); if (rms < thr) { if (a < 0) a = i; } else if (a >= 0) { runs.push([a, i]); a = -1; } }
  if (a >= 0) runs.push([a, s.length]);
  return { runs, thr, win };
}
const rms = (s, a, b) => { let q = 0; for (let i = a; i < b; i++) q += s[i] ** 2; return Math.sqrt(q / Math.max(1, b - a)); };
const report = [];
const KID = ["L02", "L10", "L14", "L28", "L30"];   // R2 final: qa/voicebright.py flagged the kid takes as thin (L10 0.46 %): one more presence lift on every kid take, same chain for all five

for (let i = 1; i <= 30; i++) {
  const id = "L" + String(i).padStart(2, "0");
  if (id === "L05" || id === "L26") continue;
  const wav = `${SRC}/${id}.wav`; if (!existsSync(wav)) continue;
  if (!["L11", "L20", "L28"].includes(id)) { copyFileSync(wav, `${DST}/${id}.wav`); copyFileSync(`${SRC}/${id}.words.json`, `${DST}/${id}.words.json`); continue; }
  const { sr, s } = readWav(wav), words = JSON.parse(readFileSync(`${SRC}/${id}.words.json`, "utf8")), { runs, thr, win } = silences(s, sr);
  let out, note;
  const runAfter = (t) => runs.find(([a, b]) => b / sr > t && (b - a) / sr > 0.15 && a / sr >= t - 0.12);   // the first real silence at/after time t
  if (id === "L11" || id === "L20") {
    const endWord = id === "L11" ? words.find((w) => w[0].startsWith("1812"))[2] : words.find((w) => w[0].startsWith("bone"))[2];
    const r = runAfter(endWord); const cutAt = Math.min(r[1] - Math.round(sr * 0.02), Math.max(r[0] + Math.round(sr * 0.15), Math.round(endWord * sr) + Math.round(sr * 0.15)));
    out = s.subarray(0, cutAt); note = `cut at ${(cutAt / sr).toFixed(3)} s inside silence ${(r[0] / sr).toFixed(3)}-${(r[1] / sr).toFixed(3)} (word end ${endWord})`;
  } else {
    const gT = words[0][2], nT = words[1][1], r = runs.filter(([a, b]) => a / sr >= gT - 0.1 && b / sr <= nT + 0.1).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))[0];
    const keep = Math.round(sr * 0.2), a = r[0] + keep, b = r[1] - keep;       // keep 0.2 s of silence on each side of the join = 0.40 s
    out = new Int16Array(s.length - (b - a)); out.set(s.subarray(0, a)); out.set(s.subarray(b), a); note = `pause ${(r[0] / sr).toFixed(3)}-${(r[1] / sr).toFixed(3)} (${((r[1] - r[0]) / sr).toFixed(2)} s) -> 0.40 s, removed ${((b - a) / sr).toFixed(3)} s`;
  }
  const f15 = Math.round(sr * 0.015), lastRms = rms(out, out.length - f15, out.length), firstRms = rms(out, 0, f15);
  report.push(`${id}: ${note}; new length ${(out.length / sr).toFixed(3)} s; first/last 15 ms RMS ${firstRms.toFixed(1)} / ${lastRms.toFixed(1)} (silence threshold ${thr.toFixed(1)})`);
  writeWav(`${DST}/${id}.wav`, out, sr); copyFileSync(`${SRC}/${id}.words.json`, `${DST}/${id}.words.json`);
}
for (const id of KID) {
  const f = `${DST}/${id}.wav`; if (!existsSync(f)) continue;
  const dur = readWav(f).s.length / readWav(f).sr, fade = id === "L28" ? `,afade=t=out:st=${(dur - 0.08).toFixed(3)}:d=0.08` : "";   // L28 ends at -52 dB while "gingerbread" is still decaying (qa/voicecut.py): an 80 ms fade closes it, no word is cut
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-af", "treble=g=7:f=2500,equalizer=f=5200:t=q:w=1:g=3" + fade, "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", f + ".tmp.wav"]); renameSync(f + ".tmp.wav", f);
  report.push(`${id}: kid presence lift (treble +7 dB at 2.5 kHz, +3 dB at 5.2 kHz)`);
}
console.log(report.join("\n"));
