// Potato Desk 09 "hell reviews": the score (Jonny 19 Nov 2026 story check: "elevator music again, i'd like something
// different" and "when he mentions the music the music stops"). Three library beds (assets/music/ai, its manifest has
// source and licence), loudness-matched and laid on the clip's own seconds, read from hell-reviews.json:
//   0 -> "One star."   sneaky pizzicato + bassoon (the cheeky resort), looped
//   "One star." -> sob  fast cartoon chase (the Devil scrambles to fix every perk)
//   sob -> tag          sad piano (he sobs over four stars)
//   tag -> end          sneaky again (the next customer already knows), 0.6 s fade at the end
// Run after make-hell-reviews.mjs whenever the timing changes:  node storyboards/series/potato-desk/09-hell-reviews/make-score.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const sb = JSON.parse(fs.readFileSync(path.join(HERE, "hell-reviews.json"), "utf8"));
const beat = (n) => sb.beats.find((b) => b.name === n).at;
const TURN = sb.captions.find((c) => c.text === "One star.").from, SOB = beat("sob"), TAG = beat("tag");
const END = sb.beats.reduce((m, b) => Math.max(m, b.at + b.len), 0);
const A = path.join(ROOT, "assets/music/ai"), OUT = path.join(ROOT, "assets/music/hell-reviews/hell-reviews-score.ogg");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const SPEED = 1.07;   // the whole video is played 1.07x at the end (Jonny 19 Nov), voices at their own pitch
const f = (x) => x.toFixed(3), ms = (x) => Math.round(x * 1000);
const g = [
  `[0:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f(TURN)},asetpts=PTS-STARTPTS,afade=t=out:st=${f(TURN - 0.25)}:d=0.25[a]`,
  // the chase is laid in slowed by the clip's final speed-up, so it plays at its own tempo in the 1.07x video, and 10 % quieter
  // (Jonny 19 Nov 17:51: "make the second song in normal speed and turn the volume 10% down")
  `[1:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f((SOB - TURN) / SPEED)},asetpts=PTS-STARTPTS,atempo=${f(1 / SPEED)},volume=0.9,afade=t=in:d=0.08,afade=t=out:st=${f(SOB - TURN - 0.25)}:d=0.25,adelay=${ms(TURN)}|${ms(TURN)}[b]`,
  `[2:a]loudnorm=I=-17:TP=-1.5,atrim=0:${f(TAG - SOB)},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=${f(TAG - SOB - 0.3)}:d=0.3,adelay=${ms(SOB)}|${ms(SOB)}[c]`,
  `[3:a]loudnorm=I=-16:TP=-1.5,atrim=0:${f(END - TAG)},asetpts=PTS-STARTPTS,afade=t=in:d=0.1,afade=t=out:st=${f(END - TAG - 0.6)}:d=0.6,adelay=${ms(TAG)}|${ms(TAG)}[d]`,
  `[a][b][c][d]amix=inputs=4:normalize=0:duration=longest,atrim=0:${f(END)},aresample=44100[o]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error",
  "-stream_loop", "3", "-i", `${A}/sneaky/sneaky-01.ogg`, "-stream_loop", "3", "-i", `${A}/car-chase/car-chase-03.ogg`,
  "-stream_loop", "1", "-i", `${A}/sad/sad-02.ogg`, "-stream_loop", "1", "-i", `${A}/sneaky/sneaky-01.ogg`,
  "-filter_complex", g, "-map", "[o]", "-c:a", "libvorbis", "-q:a", "6", OUT]);
console.log(`wrote ${path.relative(ROOT, OUT)}: sneaky 0-${f(TURN)}, chase -${f(SOB)}, sad -${f(TAG)}, sneaky -${f(END)} s`);
