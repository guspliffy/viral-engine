// Records the narrator lines (VoxCPM2, voice "narrator") into out/speech and prints each spoken length, so the
// generator's DUR table is measured, not guessed. Run: node storyboards/series/you-wake-up-mid/03-zombies/measure-lines.mjs
import { withSpeech } from "../../../../engine/voice/speech.mjs";
export const STYLE = "intrigued, mysterious storyteller, urgent and quick";
export const LINES = {
  six: "Six bullets to get your best friend out.",
  wake: "You wake up mid zombie apocalypse.",
  reach: "Only shoot what's in reach.",
  loud: "Every shot is loud. Noise brings more.",
  block: "Close it. Block it.",
  up: "Go up. On stairs they come one at a time.",
  down: "No way down.",
  one: "One bullet. What do you do?",
  stopped: "You stopped to shoot. No run-up.",
  next: "You wake up mid psycho experiment.",
};
const sb = { beats: [{ at: 0, do: Object.values(LINES).map((line) => ({ macro: "narrate", line, voice: "narrator", style: STYLE })) }] };
const out = withSpeech(sb, {});
const keys = Object.keys(LINES);
out.beats[0].do.forEach((it, i) => console.log(keys[i].padEnd(8), String(it.dur).padEnd(6), it.line));
