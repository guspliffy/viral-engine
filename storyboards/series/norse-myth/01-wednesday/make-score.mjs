// Norse myth 01 "One eye for one sip": the score. Recorded-sounding orchestra only (never synth for danger), from 0.0,
// changing at the turns (STORY.md Needs: low strings + mystery, warm-golden at the sip, light and comic in the classroom).
// Library beds (assets/music/ai, manifest has source + licence), loudness-matched and laid on the clip's own seconds, read
// from odin.json's beats:
//   0 -> the tree           zombies-score-03 "dread" (slow cello + double bass, sparse piano, soft timpani): the cave, the head
//   the tree -> the hang    calm-landscape-01 (slow and wise: piano, viola, woodwinds): nine nights, the runes
//   the hang -> caught      sneaky-01 (pizzicato + bassoon): four seconds, the drop, the ravens snitch, the sneak
//   caught -> gold          zombies-score-03 "dread" again from 22 s: the head's "You drink. You pay.", the potato eye
//   gold -> i paid an eye   drama-swell-01 (strings + choir rising): the sip, one thing, Odin's smile
//   i paid an eye -> class  sneaky-01 from 4 s: the complaint
//   the classroom -> end    elegant-reveal-02 (felt piano + celesta): the test, the smile, the last line
// Run after make-odin.mjs whenever the timing changes:  node storyboards/series/norse-myth/01-wednesday/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const sb = JSON.parse(fs.readFileSync(path.join(HERE, "odin.json"), "utf8"));
const beat = (n) => { const b = sb.beats.find((x) => x.name === n); if (!b) throw new Error(`no beat ${n}`); return b.at; };
const TREE = beat("the tree"), HANG = beat("i can do one"), SNAP = beat("caught"), GOLD = beat("the sip") + 0.4, PAID = beat("i paid an eye"), CLASS = beat("the classroom");
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, "assets/music/norse-myth/odin-score.ogg");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const seg = (i, from, len, at, { lufs = -16, fin = 0.12, fout = 0.3, vol = 1 } = {}) =>
  `[${i}:a]loudnorm=I=${lufs}:TP=-1.5,atrim=${f(from)}:${f(from + len)},asetpts=PTS-STARTPTS,volume=${vol},afade=t=in:d=${fin},afade=t=out:st=${f(len - fout)}:d=${fout},adelay=${ms(at)}|${ms(at)}[s${i}]`;
const parts = [
  ["zombies-score/zombies-score-03.ogg", 0, TREE + 0.2, 0, { fin: 0.01 }],
  ["calm-landscape/calm-landscape-01.ogg", 0, HANG - TREE + 0.2, TREE, { fin: 0.2, lufs: -17 }],
  ["sneaky/sneaky-01.ogg", 0, SNAP - HANG + 0.1, HANG, { fin: 0.1, lufs: -17 }],
  ["zombies-score/zombies-score-03.ogg", 22, GOLD - SNAP + 0.2, SNAP, { fin: 0.05 }],
  ["drama-swell/drama-swell-01.ogg", 0, PAID - GOLD + 0.15, GOLD, { fin: 0.3, fout: 0.15 }],
  ["sneaky/sneaky-01.ogg", 4, CLASS - PAID + 0.1, PAID, { fin: 0.05, fout: 0.1, lufs: -18 }],
  ["elegant-reveal/elegant-reveal-02.ogg", 0, END - CLASS, CLASS, { fin: 0.05, fout: 0.4, lufs: -17 }],
];
const g = [...parts.map(([, from, len, at, o], i) => seg(i, from, len, at, o)),
  `${parts.map((_, i) => `[s${i}]`).join("")}amix=inputs=${parts.length}:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...parts.flatMap(([file]) => ["-stream_loop", "2", "-i", `${A}/${file}`]),
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: dread 0-${f(TREE)}, wise -${f(HANG)}, sneaky -${f(SNAP)}, dread -${f(GOLD)}, swell -${f(PAID)}, sneaky -${f(CLASS)}, reveal -${f(END)} s`);
