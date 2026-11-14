// Reads Spud's block B lines in Reaper's voice (VoxCPM2, HOST_VOICE) into out/speech and writes each spoken length to
// lines.json, so the generator times everything from measured lengths, not guesses.
//   node storyboards/series/ancient-aliens/02-stonehenge/block-b/measure-lines.mjs
import { writeFileSync } from "node:fs";
import { withSpeech } from "../../../../../engine/voice/speech.mjs";
import { HOST_VOICE } from "../kit/sh-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";
const sb = { beats: [{ at: 0, do: Object.entries(LINES).map(([k, line]) => ({ who: "spud", macro: "say", line, voice: HOST_VOICE, tone: toneOf(k) })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES), dur = {};
out.beats[0].do.forEach((it, i) => { dur[keys[i]] = it.dur; console.log(keys[i].padEnd(5), String(it.dur).padEnd(6), it.line); });
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(dur, null, 1) + "\n");
