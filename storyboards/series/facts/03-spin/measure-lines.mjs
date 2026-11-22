// Reads every narrator line (lines.mjs) into out/speech and writes each spoken length to lines.json (keyed by text).
//   node storyboards/series/facts/03-spin/measure-lines.mjs
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { NARRATOR, LINES } from "./lines.mjs";
const TAKES = {};
const lines = LINES.map((l) => l[1]);
const LJ = new URL("./lines.json", import.meta.url), dur = existsSync(LJ) ? JSON.parse(readFileSync(LJ, "utf8")) : {};
for (const k of Object.keys(dur)) if (!lines.includes(k)) delete dur[k];
const todo = lines.filter((l) => !(l in dur));
for (let i = 0; i < todo.length; i += 4) {
  const part = todo.slice(i, i + 4);
  const out = withSpeech({ beats: [{ at: 0, do: part.map((line) => ({ macro: "narrate", line, voice: NARRATOR, ...(TAKES[line] && { take: TAKES[line] }) })) }] }, {});
  out.beats[0].do.forEach((it, j) => { dur[part[j]] = it.dur; });
  writeFileSync(LJ, JSON.stringify(dur, null, 1) + "\n");
  console.log(`${Math.min(i + 4, todo.length)} of ${todo.length}`);
}
for (const [t, l] of LINES) console.log(t, dur[l], l);
