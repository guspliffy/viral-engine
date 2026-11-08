// Joins the three acts of the firebender duel (tools/human/make-duel-01.mjs: street, alley, roof) into one clip and
// lays one music bed over the whole fight (an act storyboard has "music": false: a bed restarting at every place would
// break the build-up). The bed ducks under the acts' own sound (sidechain), drops 12 dB for the 0.6 s before the clash
// (the payoff lands after a dip, CLAUDE.md) and swells back on it; the mix is normalised to -14 LUFS, true peak -1.5.
//   node tools/human/join-duel.mjs <music.wav|ogg> [--draft] [--out out/duel-01.mp4]
// Inputs: out/duel-01-<act>-anime-pro[-draft].mp4 for street, alley, roof (render each act first).
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const a = process.argv.slice(2), music = a.find((x) => !x.startsWith("--") && !/^out\//.test(x)), draft = a.includes("--draft");
const out = a[a.indexOf("--out") + 1] && a.includes("--out") ? a[a.indexOf("--out") + 1] : `out/duel-01${draft ? "-draft" : ""}.mp4`;
if (!music) { console.error("usage: node tools/human/join-duel.mjs <music> [--draft] [--out file]"); process.exit(2); }
const acts = ["street", "alley", "roof"].map((x) => `out/duel-01-${x}-anime-pro${draft ? "-draft" : ""}.mp4`);
for (const f of acts) if (!fs.existsSync(f)) { console.error("missing", f); process.exit(1); }
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
const lens = acts.map(dur), total = lens.reduce((s, x) => s + x, 0);
// the clash: the roof storyboard's payoff beat (+ the meeting moment inside it)
const roof = JSON.parse(fs.readFileSync("storyboards/human/duel/duel-01-roof.json", "utf8"));
const pay = roof.beats.find((b) => b.kind === "payoff"), hit = roof.hitStop?.[0]?.at ?? pay.at;
const T = lens[0] + lens[1] + hit;
const dip = [Math.max(0, T - 0.6), T];
const tmp = "out/duel-01-join"; fs.mkdirSync(tmp, { recursive: true });
// the music: from its start, faded out over the last 0.4 s, dipped before the clash and lifted 2 dB after it
const vol = `volume='if(between(t,${dip[0].toFixed(3)},${dip[1].toFixed(3)}),0.25,if(gte(t,${T.toFixed(3)}),1.26,1))':eval=frame`;
const fc = [
  `[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[v][fx]`,
  `[3:a]atrim=0:${total.toFixed(3)},asetpts=PTS-STARTPTS,${vol},afade=t=out:st=${(total - 0.4).toFixed(3)}:d=0.4,volume=-9dB[m0]`,
  `[fx]asplit=2[fx1][key]`,
  `[m0][key]sidechaincompress=threshold=0.05:ratio=4:attack=8:release=220:makeup=1[m1]`,
  `[fx1][m1]amix=inputs=2:normalize=0:duration=first[mix]`,
];
execFileSync("ffmpeg", ["-y", "-v", "error", ...acts.flatMap((f) => ["-i", f]), "-i", music, "-filter_complex", fc.join(";"),
  "-map", "[v]", "-map", "[mix]", "-c:v", "libx264", "-preset", draft ? "veryfast" : "slow", "-crf", draft ? "23" : "17", "-pix_fmt", "yuv420p", "-r", "30",
  "-c:a", "pcm_s16le", "-ar", "48000", `${tmp}/raw.mkv`]);
// two-pass loudness to -14 LUFS, true peak -1.5 dBTP
const j = (() => { const r = execFileSync("bash", ["-c", `ffmpeg -hide_banner -i ${tmp}/raw.mkv -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`]).toString(); return JSON.parse(r); })();
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", `${tmp}/raw.mkv`, "-c:v", "copy", "-af", `${ln},aresample=48000`, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
console.log(`wrote ${out}: ${total.toFixed(2)} s (acts ${lens.map((x) => x.toFixed(2)).join(" + ")}), clash at ${T.toFixed(2)} s, music dip ${dip.map((x) => x.toFixed(2)).join("-")} s`);
