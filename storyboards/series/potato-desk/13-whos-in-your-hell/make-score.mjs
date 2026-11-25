// Potato Desk 13 "Who's in your hell?": the score (music from 0.0 under the voices, changes at the turn; memory rule).
// Library beds (assets/music/ai, its manifest has source and licence), loudness-matched, laid on the clip's own seconds,
// read from whos-in-your-hell.json:
//   0 -> "the worst one" (shot 11)   sneaky pizzicato + bassoon (the hell waiting room, as 09 hell reviews), looped
//   "the worst one" -> "You're his hell."   orchestral suspense (the door rattles, the pen clicks)
//   "You're his hell." -> end   sneaky again, cut hard 0.1 s after the scream's end (end on the punchline)
// Run after make-whos-in-your-hell.mjs whenever the timing changes:
//   node storyboards/series/potato-desk/13-whos-in-your-hell/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const sb = JSON.parse(fs.readFileSync(path.join(HERE, "whos-in-your-hell.json"), "utf8"));
const beat = (n) => sb.beats.find((b) => b.name === n).at;
const WORST = beat("the worst one"), TURN = sb.captions.find((c) => /his\*? hell/.test(c.text)).from;
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, "assets/music/whos-in-your-hell/whos-hell-score.ogg");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const g = [
  `[0:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f(WORST)},asetpts=PTS-STARTPTS,afade=t=out:st=${f(WORST - 0.25)}:d=0.25[a]`,
  `[1:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f(TURN - WORST)},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=${f(TURN - WORST - 0.2)}:d=0.2,adelay=${ms(WORST)}|${ms(WORST)}[b]`,
  `[2:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f(END - TURN)},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st=${f(END - TURN - 0.3)}:d=0.3,adelay=${ms(TURN)}|${ms(TURN)}[c]`,
  `[a][b][c]amix=inputs=3:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error",
  "-stream_loop", "3", "-i", `${A}/sneaky/sneaky-01.ogg`, "-stream_loop", "2", "-i", `${A}/orchestra-suspense/orchestra-suspense-01.ogg`,
  "-stream_loop", "1", "-i", `${A}/sneaky/sneaky-01.ogg`,
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: sneaky 0-${f(WORST)}, suspense -${f(TURN)}, sneaky -${f(END)} s`);
