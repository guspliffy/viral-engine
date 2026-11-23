// Krampus myth 01 "One night a year he checks your boots": the score (the heart-video recipe). Recorded-sounding orchestra
// only (Jonny 12 Nov: never synth for danger), from 0.0, changing at the turns (Jonny 11 Nov). Library beds
// (assets/music/ai, manifest has source + licence), loudness-matched and laid on the clip's own seconds, read from boots.json:
//   0 -> my boot is dirty         zombies-score-03 "dread" (cello + bass ostinato, timpani heartbeat): door 9, the rules
//   my boot is dirty -> door 8    sneaky (pizzicato + bassoon): cheat 1, the polish
//   door 8 -> doesn't find me     orchestra-suspense (low piano, tremolo): the clean boot gets sticks, the fries
//   doesn't find me -> he sniffs  sneaky (later in the cue): cheat 2, the dive
//   he sniffs -> last idea        zombies-score-03 "panic": the sniff, next door, the real Krampus runs
//   last idea -> good page        sneaky (from the top): cheat 3, the swap
//   good page -> the long page    sos-warm (strings + choir): chocolate
//   the long page -> end          orchestra-suspense: the roll, the sticks, the lid; 0.3 s fade on the punchline
// Run after make-boots.mjs whenever the timing changes:  node storyboards/series/krampus-myth/01-boots/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const sb = JSON.parse(fs.readFileSync(path.join(HERE, "boots.json"), "utf8"));
const beat = (n) => { const b = sb.beats.find((x) => x.name === n); if (!b) throw new Error(`no beat ${n}`); return b.at; };
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const CUTS = [0, beat("my boot is dirty"), beat("door eight"), beat("doesn't find me"), beat("he sniffs"), beat("last idea"), beat("good page"), beat("the long page"), END];
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, "assets/music/krampus-myth/boots-score.ogg");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const PANIC = 42.95;   // zombies-score-03.ogg.json: the "zombie-panic" section starts here
// [input, offset in the cue, options]
const SRC = [
  [`${A}/zombies-score/zombies-score-03.ogg`, 0, { fin: 0.01 }],
  [`${A}/sneaky/sneaky-01.ogg`, 0, { lufs: -17 }],
  [`${A}/orchestra-suspense/orchestra-suspense-01.ogg`, 0, { fin: 0.2 }],
  [`${A}/sneaky/sneaky-01.ogg`, 12, { lufs: -17 }],
  [`${A}/zombies-score/zombies-score-03.ogg`, PANIC, { fin: 0.25 }],
  [`${A}/sneaky/sneaky-01.ogg`, 0, { lufs: -17 }],
  [`${A}/sos-warm/sos-warm-02.ogg`, 0, { fin: 0.3, fout: 0.15 }],
  [`${A}/orchestra-suspense/orchestra-suspense-01.ogg`, 6, { fin: 0.05, fout: 0.3 }],
];
const seg = (i, from, len, at, { lufs = -16, fin = 0.12, fout = 0.3, vol = 1 } = {}) =>
  `[${i}:a]loudnorm=I=${lufs}:TP=-1.5,atrim=${f(from)}:${f(from + len)},asetpts=PTS-STARTPTS,volume=${vol},afade=t=in:d=${fin},afade=t=out:st=${f(len - fout)}:d=${fout},adelay=${ms(at)}|${ms(at)}[s${i}]`;
const parts = SRC.map(([, from, o], i) => seg(i, from, CUTS[i + 1] - CUTS[i] + (i < SRC.length - 1 ? 0.2 : 0), CUTS[i], o));
const g = [...parts, `${SRC.map((_, i) => `[s${i}]`).join("")}amix=inputs=${SRC.length}:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...SRC.flatMap(([file]) => ["-stream_loop", "2", "-i", file]),
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: ${CUTS.map(f).join(" | ")}`);
