// Records block D's host lines (VoxCPM2, voice "reaper") into out/speech and prints each spoken length, so the generator's
// LEN table is measured, not guessed. Run: node storyboards/series/ancient-aliens/01-pyramids/block-d/measure-lines.mjs
import { withSpeech } from "../../../../../engine/voice/speech.mjs";
import { HOST_VOICE } from "../../kit/aa-kit.mjs";
export const LINES = {
  belt: "Orion's Belt.",
  star: "The smallest star sits off the line.",
  pyr: "So does the smallest pyramid.",
  shaft: "And this shaft pointed right at them.",
  years: "Four and a half thousand years ago.",
  us: "They didn't build it for us.",
  home: "They built a signpost home.",
  closed: "Case closed.",
  nobody: "...nobody saw that.",
};
// v2 (How we explain): each clue reveal is read "excited"
export const TONES = { belt: "excited" };
const sb = { beats: [{ at: 0, do: Object.entries(LINES).map(([k, line]) => ({ macro: "say", who: "spud", line, tone: TONES[k] ?? "calm", voice: HOST_VOICE })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES);
out.beats[0].do.forEach((it, i) => console.log(keys[i].padEnd(8), String(it.dur).padEnd(6), it.line));
