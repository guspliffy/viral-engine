// Potato Desk "heaven steps": the score (after Jonny's story check, 20 Nov 2026; the rough draft ran one sneaky bed).
// Four library beds (assets/music/ai, its manifest has source and licence), loudness-matched and laid on the clip's own
// seconds, read from heaven-steps.json; the music changes at each turn:
//   0 -> "step 2"        elegant, light (heaven's gate: the brags and the falls)
//   "step 2" -> "humility"   spooky, low (hell's door: the climb, the Devil's offer, the quill)
//   "humility" -> "humble"   drama swell (the gold escalator, the gate, he gives the quill back)
//   "humble" -> end      elegant again (back at the gate; the loop lands on the opening's music)
// The video is played 1.25x at the end (Jonny 20 Nov 21:45 "just put the video at 1.25x speed"), voices at their own
// pitch, so each bed is laid in slowed by that speed and plays at its own tempo in the final.
// Run after make-heaven-steps.mjs whenever the timing changes:  node storyboards/series/potato-desk/heaven-steps/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const sb = JSON.parse(fs.readFileSync(path.join(HERE, "heaven-steps.json"), "utf8"));
const beat = (n) => sb.beats.find((b) => b.name === n).at;
const T1 = beat("step 2"), T2 = beat("humility"), T3 = beat("humble");
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, "assets/music/heaven-steps/heaven-steps-score.ogg");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const SPEED = 1.25;
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const seg = (i, from, to, lufs, fin, fout) =>
  `[${i}:a]loudnorm=I=${lufs}:TP=-1.5,atrim=0:${f((to - from) / SPEED)},asetpts=PTS-STARTPTS,atempo=${f(1 / SPEED)},` +
  `afade=t=in:d=${fin},afade=t=out:st=${f(to - from - fout)}:d=${fout}` + (from > 0 ? `,adelay=${ms(from)}|${ms(from)}` : "") + `[s${i}]`;
const g = [
  seg(0, 0, T1, -16, 0.01, 0.3),
  seg(1, T1, T2, -17, 0.1, 0.25),
  seg(2, T2, T3, -16, 0.08, 0.3),
  seg(3, T3, END, -16, 0.15, 0.4),
  `[s0][s1][s2][s3]amix=inputs=4:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error",
  "-stream_loop", "3", "-i", `${A}/elegant-reveal/elegant-reveal-02.ogg`, "-stream_loop", "3", "-i", `${A}/spooky/spooky-02.ogg`,
  "-stream_loop", "1", "-i", `${A}/drama-swell/drama-swell-01.ogg`, "-stream_loop", "1", "-i", `${A}/elegant-reveal/elegant-reveal-02.ogg`,
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: elegant 0-${f(T1)}, spooky -${f(T2)}, swell -${f(T3)}, elegant -${f(END)} s`);
