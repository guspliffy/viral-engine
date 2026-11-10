#!/usr/bin/env node
// Contact sheet of a clip for a quick human or model review: one still per beat, labelled with its time,
// in a grid of small frames (a few hundred KB, so a review costs a handful of image tokens, not a video).
//
//   node qa/contact.mjs out/test-01-golden.mp4 --sb storyboards/test-01-golden.json   -> out/test-01-golden.contact.png
//   node qa/contact.mjs clip.mp4 --times 0.5,2,3.1 [--cols 4] [--width 270] [--out sheet.png]
//   node qa/contact.mjs out/x-safe-draft-t0.50.png out/x-safe-draft-t2.00.png ...           -> sheet of draft stills (pre-render review)
//   node qa/contact.mjs out/x.mp4 --sb storyboards/x.json --cuts    -> out/x.cuts.png: one row per shot cut (and the loop
//                                                                     seam), 0.2 s either side, the first new frame marked red
//   node qa/contact.mjs out/x.mp4 --phone                          -> out/x.phone.png: one frame a second at 360 px wide,
//                                                                     the size people watch at: read every caption there
//   node qa/contact.mjs out/x-draft.mp4 --sb storyboards/x.json --contacts   -> out/x-draft.contacts-1.png ...: one row per
//                                                                     contact moment (every grab, release and drop, and
//                                                                     whatever appears or vanishes inside a shot), a
//                                                                     15 fps strip from 0.13 s before to 0.33 s after,
//                                                                     the contact frame marked red; six rows a sheet.
//                                                                     --at 3.8,11.3 adds moments (a raise, a touch),
//                                                                     --every 1 shows every frame instead of every 2nd.
//                                                                     Run it on the DRAFT, before the full render
//                                                                     (What if EP03, 9 Nov: four one-frame glitches
//                                                                     every check passed were found on these strips
//                                                                     after full render 1, and cost four more renders)
//
// Without --times the beats come from the storyboard: just after each shot starts, plus a frame mid-way through
// each shot longer than 1.5 s. Without a storyboard: 8 evenly spaced frames.
//
// ONE CLOCK: every time you type (--times, --at) is a second of the VIDEO, the number the sheets print on each frame.
// Moments this tool takes from the storyboard (beats, cuts, contacts) are story seconds there and are converted here
// (a hit-stop, freeze or slow-motion ramp makes the video longer than the story). A time past the end of the video is
// named and left out, it no longer ends the run.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";
import { renderTime } from "../engine/shared/holds.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");

export function beatTimes(sb, max = 12) {
  // just after each shot starts, mid-way through long shots, plus the fixed review frames
  // story seconds: a loaded storyboard's "duration" is the video's (engine/load.mjs adds the holds), and these times go
  // through renderTime after, so with a ramp or freeze the last beats used to land past the end of the clip
  const dur = sb.storyDuration ?? sb.duration, shots = [...(sb.shots || [])].sort((a, b) => a.at - b.at), t = [];
  for (const b of sb.beatSpans || []) t.push(b.from + Math.min(0.5, (b.to - b.from) * 0.6)); // one still inside each beat
  shots.forEach((s, i) => {
    const end = i + 1 < shots.length ? shots[i + 1].at : dur, len = end - s.at;
    t.push(s.at + Math.min(0.35, len / 3));
    if (len > 1.5) t.push(s.at + len * 0.7);
  });
  if (!t.length) for (let i = 0; i < 8; i++) t.push(((i + 0.5) / 8) * dur);
  // fixed review frames (algorithm research #13): the opening, 1.5 s and 3 s (hook + premise), the last frame
  t.push(0, 1.5, 3.0, dur - 0.04);
  const out = [...new Set(t.map((x) => Math.min(dur - 0.05, Math.round(x * 100) / 100)))].sort((a, b) => a - b);
  const fixed = new Set([0, 1.5, 3, Math.round((dur - 0.04) * 100) / 100]);
  for (let i = out.length - 1; i > 0; i--) if (!fixed.has(out[i]) && (out[i] - out[i - 1] < 0.3 || (out[i + 1] ?? 1e9) - out[i] < 0.3)) out.splice(i, 1); // drop near-duplicates of the fixed frames
  while (out.length > max) { const i = out.findIndex((x, k) => k > 0 && k < out.length - 1 && !fixed.has(x)); if (i < 0) break; out.splice(i, 1); }
  return out;
}

// clip: an MP4 (frames taken at `times`), or a list of PNG stills from `render.mjs --stills` (times read from their names)
export function contactSheet(clip, times, { cols = 4, width = 270, out } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "contact-")), files = [], missing = [];
  const stills = Array.isArray(clip) ? clip : null;
  if (stills) stills.sort((a, b) => Number((a.match(/-t([\d.]+)\.png$/) || [])[1]) - Number((b.match(/-t([\d.]+)\.png$/) || [])[1]));
  if (stills) times = stills.map((f) => Number((f.match(/-t([\d.]+)\.png$/) || [])[1] ?? NaN));
  times.forEach((t, i) => {
    const f = path.join(tmp, `${String(i).padStart(2, "0")}.png`);
    const label = `drawtext=fontfile=${FONT}:text='${Number.isFinite(t) ? t.toFixed(2) + "s" : String(i + 1)}':x=8:y=8:fontsize=${Math.round(width / 11)}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4`;
    const src = stills ? ["-i", stills[i]] : ["-ss", String(t), "-i", clip];
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...src, "-frames:v", "1", "-vf", `scale=${width}:-2,${label}`, f]);
    if (r.status !== 0) throw new Error(`ffmpeg failed at ${t}s: ${r.stderr}`);
    if (fs.existsSync(f)) files.push(f); else missing.push(t);   // ffmpeg writes nothing past the end of the clip, and says nothing
  });
  if (missing.length) { console.error(`no frame at ${missing.join(", ")} s (past the end of the clip?): left out`); times = times.filter((t) => !missing.includes(t)); }
  if (!files.length) { fs.rmSync(tmp, { recursive: true, force: true }); throw new Error("none of the times has a frame in the clip"); }
  const rows = Math.ceil(files.length / cols);
  while (files.length < rows * cols) files.push(files[files.length - 1]); // pad the last row (drawn black below)
  const inputs = files.flatMap((f) => ["-i", f]);
  const pad = times.length < files.length ? files.slice(times.length).map((_, k) => `[${times.length + k}:v]drawbox=c=black:t=fill[p${k}];`).join("") : "";
  const labels = files.map((_, i) => (i < times.length ? `[${i}:v]` : `[p${i - times.length}]`)).join("");
  const layout = files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, (_, k) => `w${k}`).join("+") : 0}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, (_, k) => `h${k * cols}`).join("+") : 0}`).join("|");
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${pad}${labels}xstack=inputs=${files.length}:layout=${layout}`, out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`ffmpeg xstack failed: ${r.stderr}`);
  return out;
}

const probe = (clip, what) => spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", what, "-of", "csv=p=0", clip], { encoding: "utf8" }).stdout.trim();

// the cuts of a clip: the storyboard's shot starts (timeline.js cutBetween), else the frames that change far more than
// the frames around them (a 36x64 grey copy: |dY| over max(8, 4x the median of +-12 frames), as in qa/pace.py)
export function cutTimes(clip, sb, fps = 30) {
  if (sb) return Array.isArray(sb.camera) && sb.camera.length ? [] : (sb.shots || []).map((s) => s.at).filter((t) => t > 0 && t < sb.duration).sort((a, b) => a - b);
  const W = 36, H = 64, N = W * H, r = spawnSync("ffmpeg", ["-v", "error", "-i", clip, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 256 << 20 });
  const b = r.stdout, n = Math.floor(b.length / N), d = [0];
  for (let i = 1; i < n; i++) { let s = 0; for (let k = 0; k < N; k++) s += Math.abs(b[i * N + k] - b[(i - 1) * N + k]); d.push(s / N); }
  const med = (i) => { const w = d.slice(Math.max(1, i - 12), i + 13).sort((x, y) => x - y); return w[Math.floor(w.length / 2)]; };
  return d.map((x, i) => (i > 0 && x > Math.max(8, 4 * med(i)) && x >= d[i - 1] && x >= (d[i + 1] ?? 0) ? i / fps : null)).filter((x) => x != null);
}

// one row per cut: frames -6, -4, -2, -1 | 0, +2, +4, +6 around it (0.2 s either side at 30 fps), the first frame of the
// new shot with a red edge. A cut has to read in those frames: the eye lands on the same spot, the action carries on.
// With loop: true the seam (last frame -> first) gets a row too.
export function cutStrips(clip, cuts, { fps = 30, width = 180, out, loop = false, dur, K = [-6, -4, -2, -1, 0, 2, 4, 6] } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cuts-")), rows = [];
  // the clip's own length, not the storyboard's: a windowed or cut-short draft is shorter than its storyboard
  const n = Math.round(Math.min(dur ?? Infinity, Number(probe(clip, "format=duration")) || Infinity) * fps);
  const grab = (f, file, mark, label) => {
    const vf = [`scale=${width}:-2`, mark ? "drawbox=x=0:y=0:w=6:h=ih:c=red:t=fill" : null, `drawtext=fontfile=${FONT}:text='${label}':x=6:y=6:fontsize=${Math.round(width / 9)}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=3`].filter(Boolean).join(",");
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.max(0, (f - 0.5) / fps)), "-i", clip, "-frames:v", "1", "-vf", vf, file]);
    if (r.status !== 0) throw new Error(`ffmpeg failed at frame ${f}: ${r.stderr}`);
  };
  const strips = cuts.map((t) => ({ f: Math.round(t * fps), frames: K.map((k) => Math.round(t * fps) + k) }));
  if (loop) strips.push({ f: 0, seam: true, frames: K.map((k) => (k < 0 ? n + k : k)) });
  strips.forEach((s, r) => {
    const files = s.frames.filter((f) => f >= 0 && f < n).map((f, i) => {
      const file = path.join(tmp, `${r}-${i}.png`), k = K[s.frames.indexOf(f)];
      grab(f, file, k === 0, `${(f / fps).toFixed(2)}s${s.seam && k === 0 ? " loop" : ""}`);
      return file;
    }).filter((file) => fs.existsSync(file));   // ffmpeg writes nothing past the end of the clip
    if (!files.length) { console.error(`no frame of the clip around ${(s.f / fps).toFixed(2)} s (it is ${(n / fps).toFixed(2)} s long): row left out`); return; }
    const row = path.join(tmp, `row-${r}.png`), x = spawnSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${files.length},pad=${width * K.length}:ih:0:0:black`, row]);
    if (x.status !== 0) throw new Error(`ffmpeg hstack failed: ${x.stderr}`);
    rows.push(row);
  });
  if (!rows.length) { fs.rmSync(tmp, { recursive: true, force: true }); return null; }
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...rows.flatMap((f) => ["-i", f]), "-filter_complex", rows.length > 1 ? `${rows.map((_, i) => `[${i}:v]`).join("")}vstack=inputs=${rows.length}` : "null", out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`ffmpeg vstack failed: ${r.stderr}`);
  return out;
}

// The contact moments of a storyboard, on the video's clock: every grab, release and drop (a grab that takes time:
// where the hand sets off and where it closes), and a character or prop shown or hidden inside a shot (at a cut the
// cut strips show it). Moments within 0.25 s of each other share a row. [{ t, what: ["wiz grab baton", ...] }]
// `extra` (--at) is in VIDEO seconds already, like --times and the labels on every sheet; the storyboard's own
// moments are story seconds and are converted here.
export function contactMoments(sb, extra = []) {
  const cuts = (sb.shots || []).map((x) => x.at), atCut = (t) => t < 0.05 || cuts.some((c) => Math.abs(c - t) < 0.07), ev = [];
  for (const a of sb.actions || []) {
    const name = `${a.who ?? ""} ${a.do} ${a.prop ?? ""}`.replace(/\s+/g, " ").trim();
    if (["grab", "release", "drop"].includes(a.do)) { if (a.at > 0.05 || (a.dur ?? 0) > 0) ev.push({ t: a.at, what: name }); if ((a.dur ?? 0) > 0.25) ev.push({ t: a.at + a.dur, what: `${name} (done)` }); }
    else if (["show", "hide"].includes(a.do) && !atCut(a.at)) ev.push({ t: a.at, what: name });
  }
  const story = sb.storyDuration ?? sb.duration, video = sb.storyDuration != null ? sb.duration : renderTime(sb.holds, sb.duration);
  const all = ev.filter((x) => x.t >= 0 && x.t < story).map((x) => ({ t: renderTime(sb.holds, x.t), what: x.what }));
  for (const t of extra) if (t >= 0 && t < video) all.push({ t, what: "named with --at" });
  const out = [];
  for (const e of all.sort((x, y) => x.t - y.t)) {
    const last = out.at(-1);
    if (last && e.t - last.t < 0.25) { if (!last.what.includes(e.what)) last.what.push(e.what); } else out.push({ t: e.t, what: [e.what] });
  }
  return out;
}

// one frame a second at 360 px wide, 6 to a row, labelled with its second
export function phoneSheet(clip, { out, cols = 6, width = 360 } = {}) {
  const secs = Math.ceil(Number(probe(clip, "format=duration"))), rows = Math.ceil(secs / cols);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `fps=1,scale=${width}:-2,drawtext=fontfile=${FONT}:text='%{eif\\:t\\:d}s':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,tile=${cols}x${rows}:padding=4`, "-frames:v", "1", out]);
  if (r.status !== 0) throw new Error(`ffmpeg phone sheet failed: ${r.stderr}`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), o = { cols: 4, width: 270 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--times") o.times = a[++i].split(",").map(Number);
    else if (a[i] === "--cols") o.cols = Number(a[++i]);
    else if (a[i] === "--width") o.width = Number(a[++i]);
    else if (a[i] === "--out") o.out = a[++i];
    else if (a[i] === "--cuts") o.cuts = true;
    else if (a[i] === "--contacts") o.contacts = true;
    else if (a[i] === "--at") o.at = a[++i].split(",").map(Number);
    else if (a[i] === "--every") o.every = Number(a[++i]);
    else if (a[i] === "--phone") o.phone = true;
    else (o.inputs ||= []).push(a[i]);
  }
  o.clip = o.inputs && (o.inputs.every((f) => f.endsWith(".png")) ? o.inputs : o.inputs[0]);
  if (!o.clip) { console.error("usage: node qa/contact.mjs <clip.mp4> [--sb storyboard.json | --times t,t] [--cols 4] [--width 270] [--out sheet.png]\n       node qa/contact.mjs <clip.mp4> --sb storyboard.json --cuts | --contacts [--at t,t] [--every 1] | --phone\n       --times and --at are seconds of the VIDEO (the labels on the sheets); storyboard moments are converted for you"); process.exit(2); }
  if (o.contacts) {
    if (!o.sb) { console.error("--contacts needs --sb <storyboard.json>: the contact moments come from it"); process.exit(2); }
    const sb = loadStoryboard(o.sb), base = o.clip.replace(/\.mp4$/, ""), fps = sb.fps ?? 30, step = o.every === 1 ? 1 : 2;
    const moments = contactMoments(sb, o.at || []), K = [-2, -1, 0, 1, 2, 3, 4, 5].map((k) => k * step), per = 6;
    // the clip's own length: a windowed draft is shorter than its storyboard, and a row without a frame would shift the legend
    const len = Math.min(sb.duration, Number(probe(o.clip, "format=duration")) || sb.duration), past = (o.at || []).filter((t) => !(t >= 0 && t < len));
    if (past.length) console.error(`--at ${past.join(", ")}: not in the clip (it is ${len.toFixed(2)} s long; --at takes seconds of the video, as printed on the sheets): left out`);
    const cutOff = moments.filter((m) => m.t >= len && !m.what.includes("named with --at"));
    if (cutOff.length) console.error(`${cutOff.length} contact moment${cutOff.length === 1 ? "" : "s"} after the end of this clip (${cutOff.map((m) => m.t.toFixed(2)).join(", ")} s): left out`);
    for (let i = moments.length - 1; i >= 0; i--) if (moments[i].t >= len) moments.splice(i, 1);
    if (!moments.length) { console.log("no contact moments in the storyboard (no grab, release or drop, nothing shown or hidden inside a shot): name some with --at"); process.exit(0); }
    for (let i = 0; i < moments.length; i += per) {
      const part = moments.slice(i, i + per), f = cutStrips(o.clip, part.map((m) => m.t), { out: `${base}.contacts-${i / per + 1}.png`, fps, dur: sb.duration, K });
      if (!f) { console.error(`sheet ${i / per + 1}: none of its moments is in the clip (${part.map((m) => m.t.toFixed(2)).join(", ")} s)`); continue; }
      console.log(`wrote ${f} (${step === 1 ? "every frame" : "15 fps"}, the contact frame marked red; times are the video's):`);
      part.forEach((m, k) => console.log(`  row ${k + 1}  ${m.t.toFixed(2)} s  ${m.what.join(", ")}`));
    }
    console.log(`${moments.length} contact moment${moments.length === 1 ? "" : "s"}: in every row the hand reaches the thing before it moves, the thing never hangs alone, nothing appears or is gone a frame early`);
    process.exit(0);
  }
  if (o.cuts || o.phone) {
    const sb = o.sb ? loadStoryboard(o.sb) : null, base = o.clip.replace(/\.mp4$/, "");
    if (o.cuts) {
      // a storyboard's cuts are story seconds: on the video's clock here, or every cut after a hit-stop or ramp is off by its length
      const cuts = cutTimes(o.clip, sb, sb?.fps ?? 30).map((t) => (sb ? renderTime(sb.holds, t) : t)), f = cutStrips(o.clip, cuts, { out: o.out && !o.phone ? o.out : `${base}.cuts.png`, loop: !!sb?.loop, fps: sb?.fps ?? 30, dur: sb?.duration });
      console.log(f ? `wrote ${f} (${cuts.length} cut${cuts.length === 1 ? "" : "s"}${sb?.loop ? " + the loop seam" : ""}${cuts.length ? " at " + cuts.map((t) => t.toFixed(2)).join(", ") + " s" : ""}${sb ? "" : ", found in the pixels"})` : "no cuts");
    }
    if (o.phone) console.log(`wrote ${phoneSheet(o.clip, { out: o.out && !o.cuts ? o.out : `${base}.phone.png` })} (one frame a second at 360 px)`);
    process.exit(0);
  }
  let times = o.times;
  if (Array.isArray(o.clip)) times = [];
  else if (!times) {
    if (o.sb) { const sb = loadStoryboard(o.sb); times = beatTimes(sb).map((t) => renderTime(sb.holds, t)); }   // on the video's clock (hit-stops)
    else {
      const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o.clip], { encoding: "utf8" }).stdout);
      times = Array.from({ length: 8 }, (_, i) => Math.round(((i + 0.5) / 8) * d * 100) / 100);
    }
  }
  const out = o.out || (Array.isArray(o.clip) ? o.clip[0].replace(/-t[\d.]+\.png$/, "") + ".stills.contact.png" : o.clip.replace(/\.mp4$/, "") + ".contact.png");
  contactSheet(o.clip, times, { cols: o.cols, width: o.width, out });
  console.log(`wrote ${out} (${Array.isArray(o.clip) ? o.clip.length + " stills" : times.length + " frames at " + times.join(", ") + " s"})`);
}
