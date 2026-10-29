// The whitelist's listen sheet: every sound (not the raw families behind a named one) played once on a card with its
// id, Jonny's words for it and the line that says what it sounds like, grouped by family. Jonny listens and marks
// the descriptions that are wrong; Claude can't hear them.
//   node engine/sfx/sheet.mjs [--family wet,ui] [--out out/sound-sheet]  -> sheet.mp4 + sheet.md (timestamps)
// Each sound is peak-normalised for the sheet, so its level here is not its level in a clip. A "pending" sound that
// isn't in this checkout is listed in sheet.md but not played.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { SR } from "./dsp.mjs";
import { soundSamples, writeWav, CODE_SOUNDS } from "../audio.mjs";
import { DIR } from "./library.mjs";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const out = opt("--out", "out/sound-sheet"), only = opt("--family")?.split(",");
const WL = JSON.parse(fs.readFileSync(path.join(DIR, "whitelist.json"), "utf8"));
const CAT = JSON.parse(fs.readFileSync(path.join(DIR, "catalog.json"), "utf8")).sounds;
const have = (id) => CODE_SOUNDS.includes(id) || /^sig-/.test(id) || !!CAT[id];
fs.mkdirSync(out, { recursive: true });

const rows = [], missing = [];
for (const fam of Object.keys(WL.families)) {
  if (only && !only.includes(fam)) continue;
  for (const [id, e] of Object.entries(WL.sounds)) {
    if (e.family !== fam || e.same || id === "speech") continue;
    if (!have(id)) { missing.push({ id, e }); continue; }
    rows.push({ id, e, x: soundSamples(id, 7919, 1.0) });
  }
}

// the cards: 0.4 s of quiet, the sound, 0.6 s after it (at least 1.8 s, at most 5.5 s a card)
const lens = rows.map((r) => Math.min(5.5, Math.max(1.8, 0.4 + r.x.length / SR + 0.6)));
const total = lens.reduce((a, b) => a + b, 0), L = new Float32Array(Math.ceil(total * SR) + SR);
let t = 0;
rows.forEach((r, i) => {
  let peak = 0; for (const v of r.x) peak = Math.max(peak, Math.abs(v));
  const a = Math.round((t + 0.4) * SR), n = Math.min(r.x.length, Math.round((lens[i] - 0.5) * SR));
  for (let k = 0; k < n; k++) L[a + k] = (r.x[k] / (peak || 1)) * 0.5 * Math.min(1, (n - k) / (0.03 * SR));
  r.at = t; t += lens[i];
});
writeWav(path.join(out, "sheet.wav"), L, L);

// the picture: one subtitle card per sound (libass), on a plain background
const ts = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(2).padStart(5, "0"); return `${h}:${String(m).padStart(2, "0")}:${x}`; };
const esc = (s) => String(s).replace(/[{}]/g, "").replace(/\n/g, " ");
const ass = [`[Script Info]\nScriptType: v4.00+\nPlayResX: 720\nPlayResY: 1280\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding`,
  `Style: fam,DejaVu Sans,30,&H0080C8FF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,2,0,1,0,0,8,50,50,120,1`,
  `Style: id,DejaVu Sans,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,8,50,50,330,1`,
  `Style: says,DejaVu Sans,36,&H00E0E0E0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,60,60,520,1`,
  `Style: words,DejaVu Sans,34,&H0060E0A0,&H00FFFFFF,&H00000000,&H00000000,0,1,0,0,100,100,0,0,1,0,0,8,60,60,430,1`,
  `Style: scene,DejaVu Sans,30,&H004080FF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,2,60,60,160,1`,
  `\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`];
rows.forEach((r, i) => {
  const a = ts(r.at), b = ts(r.at + lens[i]), n = `${i + 1}/${rows.length}`;
  ass.push(`Dialogue: 0,${a},${b},fam,,0,0,0,,${esc(r.e.family.toUpperCase())}  ·  ${n}`);
  ass.push(`Dialogue: 0,${a},${b},id,,0,0,0,,${esc(r.id)}`);
  if (r.e.words?.length) ass.push(`Dialogue: 0,${a},${b},words,,0,0,0,,${esc(r.e.words.map((w) => `"${w}"`).join("  "))}`);
  ass.push(`Dialogue: 0,${a},${b},says,,0,0,0,,${esc(r.e.says)}`);
  if (r.e.scenes) ass.push(`Dialogue: 0,${a},${b},scene,,0,0,0,,only in a ${esc(r.e.scenes.join(" / "))} scene`);
});
fs.writeFileSync(path.join(out, "sheet.ass"), ass.join("\n") + "\n");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=0x1b1d24:s=720x1280:r=30:d=${total.toFixed(2)}`, "-i", path.join(out, "sheet.wav"),
  "-vf", `ass=${path.join(out, "sheet.ass")}`, "-t", total.toFixed(2), "-c:v", "libx264", "-preset", "fast", "-crf", "28", "-tune", "stillimage", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", path.join(out, "sheet.mp4")], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr);

// the index: where each sound plays, for marking descriptions that are wrong
const md = [`# Sound whitelist: listen sheet`, ``, `${rows.length} sounds, ${Math.round(total / 60)} min ${Math.round(total % 60)} s. Levels are evened out for listening. Mark a line that doesn't match what you hear.`, ``, `| time | sound | your words | what it sounds like |`, `|---|---|---|---|`,
  ...rows.map((r) => `| ${Math.floor(r.at / 60)}:${(r.at % 60).toFixed(0).padStart(2, "0")} | \`${r.id}\`${r.e.scenes ? ` (${r.e.scenes.join("/")} only)` : ""} | ${(r.e.words || []).join(", ")} | ${r.e.says} |`),
  ...(missing.length ? [``, `Not in this checkout yet (pending):`, ...missing.map((m) => `- \`${m.id}\` (${m.e.pending}): ${m.e.says}`)] : [])];
fs.writeFileSync(path.join(out, "sheet.md"), md.join("\n") + "\n");
console.log(`sheet: ${rows.length} sounds, ${total.toFixed(1)} s -> ${path.join(out, "sheet.mp4")}${missing.length ? ` (${missing.length} pending not played)` : ""}`);
