// The two contact sheets from the finished picture (with subtitles):
//   node storyboards/series/legend/hansel-gretel/hg-sheets.mjs <video-with-subs.mp4> <out-sheet.jpg> <out-captions.jpg>
//   sheet = 1 fps (every frame a second apart); captions = every caption phrase on its frame (all words shown), tagged with its line.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { TL_LINES, DUR } from "./hg.mjs";
const [video, sheet, caps] = process.argv.slice(2);
const tmp = "out/legend-hansel/sheet-tmp"; mkdirSync(tmp, { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const rows = Math.ceil(DUR / 10);
ff("-i", video, "-vf", `fps=1,scale=216:384,tile=10x${rows}`, "-frames:v", "1", "-q:v", "3", sheet);
const times = [];
for (const ln of TL_LINES) ln.phrases.forEach((p, i) => { const nx = ln.phrases[i + 1]; const last = p.ws[p.ws.length - 1][1] + 0.2; times.push(Math.min(last - 0.05, nx ? nx.at - 0.14 : ln.off + 0.1) + ln.at); });
times.forEach((t, i) => ff("-ss", t.toFixed(2), "-i", video, "-frames:v", "1", "-vf", "scale=216:384", `${tmp}/c${String(i).padStart(3, "0")}.png`));
ff("-framerate", "1", "-i", `${tmp}/c%03d.png`, "-vf", `tile=10x${Math.ceil(times.length / 10)}`, "-frames:v", "1", "-q:v", "3", caps);
console.log("sheet", sheet, "captions", caps, times.length, "phrases");
