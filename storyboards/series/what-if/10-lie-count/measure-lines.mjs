// Reads every narrator line of the film (voice 1, kit NARRATOR) into out/speech and writes each spoken length to
// lines.json (keyed by the line's text), so make-film.mjs times the picture on the measured voice.
//   node storyboards/series/what-if/10-lie-count/measure-lines.mjs
import { writeFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { NARRATOR, SCENES, TAKES } from "./film.mjs";
const lines = [...new Set(SCENES.flatMap((s) => s.seq.filter((x) => x[0] === "n").map((x) => x[1])))];
// in chunks of 10, so every finished chunk is cached in out/speech (a killed run keeps what it read)
const dur = {};
for (let i = 0; i < lines.length; i += 10) {
  const part = lines.slice(i, i + 10);
  const out = withSpeech({ beats: [{ at: 0, do: part.map((line) => ({ macro: "narrate", line, voice: NARRATOR, take: TAKES[line] ?? 1 })) }] }, {});
  out.beats[0].do.forEach((it, j) => { dur[part[j]] = it.dur; });
  console.log(`${Math.min(i + 10, lines.length)} of ${lines.length}`);
}
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(dur, null, 1) + "\n");
const tot = Object.values(dur).reduce((a, b) => a + b, 0);
console.log(`${lines.length} lines, ${tot.toFixed(1)} s of narrator`);
