// Reads take 2 of the narrator lines VoxCPM2 read too fast (fast.json: line -> % faster) so the better take can be picked.
//   node storyboards/series/what-if/10-lie-count/retake.mjs <fast.json>
import { readFileSync } from "node:fs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { NARRATOR } from "./film.mjs";
const lines = Object.keys(JSON.parse(readFileSync(process.argv[2], "utf8")));
for (let i = 0; i < lines.length; i += 8) {
  const part = lines.slice(i, i + 8);
  const out = withSpeech({ beats: [{ at: 0, do: part.map((line) => ({ macro: "narrate", line, voice: NARRATOR, take: 2 })) }] }, {});
  out.beats[0].do.forEach((it, j) => console.log(`TAKE2 ${it.dur} ${part[j]}`));
}
