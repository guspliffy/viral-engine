// Reads block C's narrator lines (lines.mjs) in the kit's narrator voice into out/speech and writes each spoken length
// to lines.json, so make-block-c.mjs times the cut from measured lengths.
//   node storyboards/series/happiness/03-happiness-score/block-c/measure-lines.mjs
import { writeFileSync } from "node:fs";
import { withSpeech } from "../../../../../engine/voice/speech.mjs";
import { NARRATOR } from "../kit/score-kit.mjs";
import { LINES } from "./lines.mjs";
const sb = { beats: [{ at: 0, do: Object.entries(LINES).map(([k, line]) => ({ macro: "narrate", line, voice: NARRATOR, take: 1 })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES), dur = {};
out.beats[0].do.forEach((it, i) => { dur[keys[i]] = it.dur; console.log(keys[i].padEnd(4), String(it.dur).padEnd(6), it.line); });
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(dur, null, 1) + "\n");
