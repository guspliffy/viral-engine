// Reads every narrator line (film.mjs NARRATOR) into out/speech and writes each spoken length to lines.json (keyed by
// the line's text), so make-film.mjs times the picture on the measured voice. In chunks of 8 (a killed run keeps what it read).
//   node storyboards/series/facts/01-mona-lisa/measure-lines.mjs
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { NARRATOR, SCENES, TAKES } from "./film.mjs";
const lines = [...new Set(SCENES.flatMap((s) => s.seq.filter((x) => x[0] === "n").map((x) => x[1])))];
const LJ = new URL("./lines.json", import.meta.url), dur = existsSync(LJ) ? JSON.parse(readFileSync(LJ, "utf8")) : {};
for (const k of Object.keys(dur)) if (!lines.includes(k)) delete dur[k];
const todo = lines.filter((l) => !(l in dur));
for (let i = 0; i < todo.length; i += 8) {
  const part = todo.slice(i, i + 8);
  const out = withSpeech({ beats: [{ at: 0, do: part.map((line) => ({ macro: "narrate", line, voice: NARRATOR, ...(TAKES[line] && { take: TAKES[line] }) })) }] }, {});
  out.beats[0].do.forEach((it, j) => { dur[part[j]] = it.dur; });
  writeFileSync(LJ, JSON.stringify(dur, null, 1) + "\n");
  console.log(`${Math.min(i + 8, todo.length)} of ${todo.length}`);
}
const tot = Object.values(dur).reduce((a, b) => a + b, 0);
console.log(`${lines.length} lines, ${tot.toFixed(1)} s of narrator`);
