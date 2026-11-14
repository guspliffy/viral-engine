// Records block D's host lines (VoxCPM2, voice "reaper") into out/speech and writes each spoken length to lines.json,
// so the generator's timing is measured, not guessed. Run: node storyboards/series/ancient-aliens/02-stonehenge/block-d/measure-lines.mjs
import fs from "node:fs";
import { withSpeech } from "../../../../../engine/voice/speech.mjs";
import { HOST_VOICE } from "../kit/sh-kit.mjs";
import { LINES, TONES } from "./lines.mjs";
const sb = { beats: [{ at: 0, do: Object.entries(LINES).map(([k, line]) => ({ macro: "say", who: "spud", line, tone: TONES[k] ?? "calm", voice: HOST_VOICE })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES), len = {};
out.beats[0].do.forEach((it, i) => { len[keys[i]] = it.dur; console.log(keys[i].padEnd(8), String(it.dur).padEnd(6), it.line); });
fs.writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(len, null, 1) + "\n");
