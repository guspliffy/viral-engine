// Renders short sound demos through the engine's own audio path (code effects and library sounds), for test sheets.
//   node engine/soundgen/engine-sounds.mjs demos.json OUT_DIR
// demos.json: [{ "name": "katana-old", "duration": 1.8, "sfx": [{ "sound": "shing", "at": 0.25 }] }, ...]
// No room ambience or reverb, so the demos compare the sounds themselves. Writes OUT_DIR/<name>.wav.
import fs from "node:fs";
import path from "node:path";
import { renderAudio, writeWav } from "../audio.mjs";

const [demos, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const d of JSON.parse(fs.readFileSync(demos, "utf8"))) {
  const sb = { id: d.name, duration: d.duration, cast: [], beats: [], actions: [], fx: [], sfx: d.sfx, set: {}, sound: { ambience: 0, reverb: 0, auto: false, seed: d.seed ?? 1 } };
  const { L, R } = renderAudio(sb, {});
  writeWav(path.join(out, `${d.name}.wav`), L, R);
}
