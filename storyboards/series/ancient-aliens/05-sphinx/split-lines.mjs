// Lines that run across a scene join are cut in two at the pause between their sentences (Jonny 19 Nov 2026, rough draft 1:
// "why does it stare at the exact spot is cut off": each segment renders only its own sound, so a line that ran past a
// segment's end lost its tail). One take is cut, not two takes read, so the voice and its melody stay the same.
// Writes voice/<key>-<n>.flac and splits.json { "<key>:1": { line, file, dur, off } }: off = where part 2 starts after
// part 1 starts (the take's own pause kept). Run after measure-lines.mjs:
//   node storyboards/series/ancient-aliens/05-sphinx/split-lines.mjs
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { withSpeech, CACHE } from "../../../../engine/voice/speech.mjs";
import { LINES } from "./lines.mjs";
import { VOICE } from "./voice.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), REL = "storyboards/series/ancient-aliens/05-sphinx/voice";
// [key, first part's text, second part's text]: the cut is the pause after the first part
export const SPLITS = [
  ["s02", "Rain did this.", "Years of it. It was here before the desert!"],
  ["s04", "Then what about the secret room?", "A library, hidden under its paw."],
  ["a05c", "They carved the Sphinx, and built the temple from what they cut away.", "Right after King Khafre's temple next door."],
  ["s06", "Then why does it stare at the exact spot where the Lion rose at sunrise...", "twelve and a half thousand years ago?"],
];
const keys = Object.keys(LINES);
const sb = { beats: [{ at: 0, do: keys.map((k) => { const [who, line, tone, take] = LINES[k]; return { who, macro: "say", line, voice: VOICE[who], tone, ...(take && { take }) }; }) }] };
const said = withSpeech(sb, {}).beats[0].do;
const silences = (wav) => [...spawnSync("ffmpeg", ["-v", "info", "-i", wav, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], { encoding: "utf8" }).stderr
  .matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
const out = {}, recs = [];
for (const [k, p1, p2] of SPLITS) {
  if (`${p1} ${p2}` !== LINES[k][1]) throw new Error(`${k}: the parts do not add up to the line`);
  const it = said[keys.indexOf(k)], wav = path.join(CACHE, `${it.speech.id}.wav`);
  const n1 = p1.split(/\s+/).length, w = it.speech.words, after = w[n1 - 1][1];   // the end of part 1's last word (estimate)
  const gap = silences(wav).filter(([a, b]) => a > 0.05 && b < it.dur - 0.05).sort((x, y) => Math.abs((x[0] + x[1]) / 2 - after) - Math.abs((y[0] + y[1]) / 2 - after))[0];
  if (!gap || gap[0] > after + 0.4 || gap[1] < after - 0.4) throw new Error(`${k}: no pause near "${p1}" (word end ${after})`);
  const cut = (gap[0] + gap[1]) / 2;
  [[1, 0, cut, p1], [2, cut, null, p2]].forEach(([n, a, b, text]) => {
    const file = `${REL}/${k}-${n}.flac`;
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-ss", String(a), ...(b ? ["-to", String(b)] : []), "-c:a", "flac", path.join(HERE, "voice", `${k}-${n}.flac`)], { encoding: "utf8" });
    if (r.status) throw new Error(r.stderr);
    out[`${k}:${n}`] = { line: text, file, who: LINES[k][0], off: n === 2 ? Math.round((gap[1] - 0.02) * 1000) / 1000 : 0 };
    recs.push({ who: LINES[k][0], macro: "say", line: text, rec: file, age: "age-none" });
  });
  console.log(k, "cut at", cut.toFixed(3), "pause", gap.map((x) => x.toFixed(2)).join("-"));
}
withSpeech({ beats: [{ at: 0, do: recs }] }, {}).beats[0].do.forEach((it, i) => { out[Object.keys(out)[i]].dur = it.dur; });
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(7), String(v.dur).padEnd(6), "off", v.off, v.line);
writeFileSync(path.join(HERE, "splits.json"), JSON.stringify(out, null, 1) + "\n");
