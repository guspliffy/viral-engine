// Reads every EP04 line in its speaker's voice (VoxCPM2) into out/speech and writes each spoken length to lines.json, so the
// generator times everything from measured lengths, not guesses.
//   node storyboards/series/ancient-aliens/04-serapeum/measure-lines.mjs
import { writeFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { LINES } from "./lines.mjs";
import { VOICE } from "./voice.mjs";
const sb = { beats: [{ at: 0, do: Object.values(LINES).map(([who, line, tone, take]) => ({ who, macro: "say", line, voice: VOICE[who], tone, ...(take && { take }) })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES), dur = {};
out.beats[0].do.forEach((it, i) => { dur[keys[i]] = it.dur; console.log(keys[i].padEnd(5), String(it.dur).padEnd(6), it.line); });
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(dur, null, 1) + "\n");
