// Pandora's jar: the voice timeline (shared by pandora.mjs and pandora-mix.mjs).
// Every take: the silent tail after the last sound is dropped, and silent runs longer than 0.5 s INSIDE a take are shortened to 0.42 s;
// all cuts lie strictly inside measured silence (10 ms RMS < 0.6 % of the take's peak), never at a word or at a line's first onset / last tail.
// A word whose Whisper start lies inside such a silent run really starts where the sound resumes: its start is moved there.
import { readFileSync } from "node:fs";
import { align, phrases } from "../../../../tools/svg2d/lib/captions.mjs";
import { clamp } from "../../../../tools/svg2d/lib/legend.mjs";
export const FPS = 30;
export const VO = "out/legend-pandora/vo";
export const SPEC = JSON.parse(readFileSync("storyboards/series/legend/pandora/lines.json", "utf8"));
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length)) };
}
const SIL = 0.006, WIN = 0.01, KEEP = 0.42, MINRUN = 0.5, PAD = 0.08;
// phrases for the lines that have no "cap" entry in lines.json (2-4 words each)
const CAP2 = { L02: "What came out?", L10: "Oh!|For me?", L11: "Wait.|He forgot already?", L12: "His name|means afterthought.", L16: "She just|opened it?", L22: "So Hope's|the good one?", L24: "That one|stays in." };
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
for (const ln of Object.values(LINE)) {
  const { sr, s: s0 } = readWav(`${VO}/${ln.id}.wav`), h = Math.round(sr * WIN), nw = Math.floor(s0.length / h);
  let pk = 0; for (let i = 0; i < s0.length; i++) pk = Math.max(pk, Math.abs(s0[i]));
  const loud = [];
  for (let w = 0; w < nw; w++) { let a = 0; for (let j = w * h; j < (w + 1) * h; j++) a += s0[j] * s0[j]; loud.push(Math.sqrt(a / h) >= SIL * pk); }
  let first = loud.indexOf(true), last = loud.lastIndexOf(true);
  const endKeep = Math.min(s0.length / sr, (last + 1) * WIN + PAD);          // everything after is silence
  // internal silent runs
  const runs = []; let st = null;
  for (let w = first; w <= last; w++) { if (!loud[w]) { if (st === null) st = w; } else if (st !== null) { runs.push([st * WIN, w * WIN]); st = null; } }
  ln.silent = runs;
  ln.cuts = runs.filter(([a, b]) => b - a > MINRUN).map(([a, b]) => [a + KEEP / 2, b - KEEP / 2]);   // [from, to] removed, in take time
  ln.endKeep = endKeep;
  const mapT = (t) => { let d = 0; for (const [a, b] of ln.cuts) { if (t >= b) d += b - a; else if (t > a) d += t - a; } return t - d; };
  // Whisper puts a word that follows a silence at the start of that silence; it really starts where the sound resumes.
  // Words starting inside a silent run (> 0.2 s) are moved to its end (several in a row: spread by their length).
  const raw0 = JSON.parse(readFileSync(`${VO}/${ln.id}.words.json`, "utf8")).map(([w, a, b]) => [w, a, b]);
  for (const [ra, rb] of runs) {
    if (rb - ra < 0.2) continue;
    const grp = raw0.filter((q) => q[1] >= ra - 0.05 && q[1] < rb && q[2] > ra + 0.1);
    let t0 = rb; for (const q of grp) { q[1] = t0; t0 += Math.max(0.2, q[0].replace(/[^a-z]/gi, "").length * 0.1); }
  }
  for (let i = 0; i < raw0.length; i++) raw0[i][2] = Math.max(raw0[i][2], raw0[i][1] + 0.1);
  const raw = raw0;
  ln.words = align(ln.text.split(/\s+/), raw.map(([w, a, b]) => [w, mapT(a), Math.max(mapT(a) + 0.04, mapT(b))]));
  // samples after the cuts, for the mouth envelope
  const keep = []; for (let i = 0; i < s0.length; i++) { const t = i / sr; if (t >= endKeep) break; if (!ln.cuts.some(([a, b]) => t >= a && t < b)) keep.push(s0[i]); }
  const s = Int16Array.from(keep); ln.dur = s.length / sr; ln.len = ln.dur;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.phrases = phrases(ln.words, ln.text, SPEC.cap?.[ln.id] ?? CAP2[ln.id]);
}

// order and the breath between lines (seconds after the previous line's last sound)
export const ORDER = Object.keys(LINE);
const GAP = { L02: 0.15, L03: 0.15, L04: 0.15, L05: 0.15, L06: 0.12, L07: 0.15, L08: 0.2, L09: 0.15, L10: 0.4, L11: 0.25, L12: 0.2, L13: 0.3, L14: 0.25, L15: 0.2, L16: 0.25, L17: 0.85, L18: 0.4, L19: 0.3, L20: 0.2, L21: 0.25, L22: 0.15, L23: 0.15, L24: 0.6 };
{ let prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? prev.end + GAP[id] : 0; ln.end = ln.at + ln.len; prev = ln; } }
export const wordAt = (ln, w) => { const x = ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "") === w) || ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };
export const wordEnd = (ln, w) => ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w))[2];
export const DUR = +(LINE.L24.at + LINE.L24.len + 0.05).toFixed(2);
