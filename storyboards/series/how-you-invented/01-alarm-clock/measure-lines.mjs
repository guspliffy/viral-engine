// Reads every line (lines.mjs) into out/speech and writes each spoken length to lines.json (keyed by text).
//   node storyboards/series/how-you-invented/01-alarm-clock/measure-lines.mjs
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { NARRATOR, LINES } from "./lines.mjs";
const LJ = new URL("./lines.json", import.meta.url), dur = existsSync(LJ) ? JSON.parse(readFileSync(LJ, "utf8")) : {};
const keys = LINES.map((l) => l[2]);
for (const k of Object.keys(dur)) if (!keys.includes(k)) delete dur[k];
const item = ([kind, who, line, tone = "calm", o = {}]) => kind === "narr"
  ? { macro: "narrate", line, voice: NARRATOR, ...(o.take && { take: o.take }) }
  : { macro: "say", who, line, tone, ...o };
const todo = LINES.filter((l) => !(l[2] in dur));
for (let i = 0; i < todo.length; i += 4) {
  const part = todo.slice(i, i + 4);
  const out = withSpeech({ beats: [{ at: 0, do: part.map(item) }] }, {});
  out.beats[0].do.forEach((it, j) => { dur[part[j][2]] = it.dur; });
  writeFileSync(LJ, JSON.stringify(dur, null, 1) + "\n");
  console.log(`${Math.min(i + 4, todo.length)} of ${todo.length}`);
}
for (const l of LINES) console.log(dur[l[2]], l[2]);
