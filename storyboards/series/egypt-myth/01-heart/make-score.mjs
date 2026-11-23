// Egypt myth 01 "Your heart vs. one feather": the score. Recorded-sounding orchestra only (Jonny 12 Nov: never synth for
// danger), from 0.0, changing at the turns (Jonny 11 Nov). Library beds (assets/music/ai, manifest has source + licence),
// loudness-matched and laid on the clip's own seconds, read from heart.json:
//   0 -> clunk 3        zombies-score-03 "dread" (slow cello + double bass ostinato, sparse piano, timpani heartbeat)
//   clunk 3 -> slap     zombies-score-03 "panic" (the monster at the pan)
//   slap -> the doors   sneaky (pizzicato + bassoon: the cheat works, the montage)
//   the doors -> next   sos-warm (strings + choir: the pass, the fields)
//   next -> end         orchestra-suspense (low piano, tremolo: Spud's heart), 0.4 s fade into the loop
// Run after make-heart.mjs whenever the timing changes:  node storyboards/series/egypt-myth/01-heart/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const ID = process.env.CUT === "mystery" ? "heart-mystery" : "heart";   // CUT=mystery: the mysteries-channel cut (make-heart.mjs)
const sb = JSON.parse(fs.readFileSync(path.join(HERE, `${ID}.json`), "utf8"));
const beat = (n) => { const b = sb.beats.find((x) => x.name === n); if (!b) throw new Error(`no beat ${n}`); return b.at; };
const CL3 = beat("clunk 3"), SLAP = beat("sealed") - 0.15, DOORS = beat("the doors"), NEXT = beat("next");
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, `assets/music/egypt-myth/${ID}-score.ogg`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const PANIC = 42.95;   // zombies-score-03.ogg.json: the "zombie-panic" section starts here
const seg = (i, from, len, at, { lufs = -16, fin = 0.12, fout = 0.3, vol = 1 } = {}) =>
  `[${i}:a]loudnorm=I=${lufs}:TP=-1.5,atrim=${f(from)}:${f(from + len)},asetpts=PTS-STARTPTS,volume=${vol},afade=t=in:d=${fin},afade=t=out:st=${f(len - fout)}:d=${fout},adelay=${ms(at)}|${ms(at)}[s${i}]`;
const g = [
  seg(0, 0, CL3 + 0.25, 0, { fin: 0.01 }),
  seg(1, PANIC, SLAP - CL3, CL3, { fin: 0.25 }),
  seg(2, 0, DOORS - SLAP + 0.2, SLAP, { lufs: -17 }),
  seg(3, 0, NEXT - DOORS + 0.15, DOORS, { fin: 0.3, fout: 0.15 }),
  seg(4, 0, END - NEXT, NEXT, { fin: 0.05, fout: 0.4 }),
  `[s0][s1][s2][s3][s4]amix=inputs=5:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error",
  "-i", `${A}/zombies-score/zombies-score-03.ogg`, "-i", `${A}/zombies-score/zombies-score-03.ogg`,
  "-stream_loop", "1", "-i", `${A}/sneaky/sneaky-01.ogg`, "-stream_loop", "1", "-i", `${A}/sos-warm/sos-warm-02.ogg`,
  "-stream_loop", "1", "-i", `${A}/orchestra-suspense/orchestra-suspense-01.ogg`,
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: dread 0-${f(CL3)}, panic -${f(SLAP)}, sneaky -${f(DOORS)}, warm -${f(NEXT)}, suspense -${f(END)} s`);
