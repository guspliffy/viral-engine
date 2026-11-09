#!/usr/bin/env node
// Preflight: every check a storyboard can pass before a frame is drawn, in one command and one verdict (quality plan
// item 3, 5 Nov 2026). Ten clips of 4-5 Nov shipped about 35 warnings each, many of them glitches anyone sees at full
// speed; this sorts them into what blocks the render, what may not ship as a warning, and the rest.
//
//   node qa/preflight.mjs <storyboard>                  -> lays out (or reuses a fresh layout in out/), then the verdict
//   node qa/preflight.mjs <storyboard> --gate 2         -> judged as with "gate": 2 in the storyboard (the new fails)
//   node qa/preflight.mjs <storyboard> --all-fails      -> as if every root fix were in too (what fails once wave 1 lands)
//   node qa/preflight.mjs <storyboard> --layout <file>  -> judge this layout (no layout pass)
//   node qa/preflight.mjs <storyboard> --fresh          -> always lay out again
//   node qa/preflight.mjs <storyboard> --quick          -> skip the sound and the readability stills (seconds after the layout)
//   node qa/preflight.mjs <storyboard> --json           -> machine-readable
//
// Runs: the layout pass (engine/render.mjs --layout, 3-7 min for a clip, reused while newer than the storyboard and the
// engine), the contact and grip checks, the drawn rig (qa/rig.mjs), the subject-owns-the-front check and the must-see
// list and the pupils the lids leave showing (qa/framing.mjs), the captions (safe zone, the brief's band, hidden
// behind characters: qa/check.mjs captionResults), the storyboard's motion and acting habits (qa/motion.mjs), the camera lint (qa/camera.mjs), the
// sound the render would make on a phone speaker (qa/sound.mjs --phone) and the readability stills (qa/readability.mjs).
//
// Verdict:
//   FAIL   a check in GATE.fails failed: render.mjs refuses to render it (fix it, or a window with a reason for the rare
//          beat that needs it)
//   WARN   no fail, but a visible-glitch warning (GATE.visible: a hand flip, a skating foot, a slipping prop, a jump):
//          a delivery may carry none, so fix it or name it in a window with a reason
//   PASS   nothing visible left; any other warning gets a one-line reason in the delivery (all of them: out/<id>.warnings.txt;
//          on screen a warning prints only when it is new since the last preflight, CHECKS_FULL=1 prints them all)
// Exit code 1 on FAIL only.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { clipResults, contactResults, captionResults } from "./check.mjs";
import { GATE } from "./gate.mjs";
import { motionResults, storyNotes } from "./motion.mjs";
import { visibility, frontResults, eyesResults } from "./framing.mjs";
import { cameraLint } from "./camera.mjs";
import { lockMusic } from "../engine/music.mjs";
import { sayChanged } from "./say.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function args() {
  const a = process.argv.slice(2), o = { sb: null, layout: null, fresh: false, gate: null, all: false, quick: false, json: false, out: path.join(ROOT, "out") };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--fresh") o.fresh = true;
    else if (a[i] === "--gate") o.gate = Number(a[++i]);
    else if (a[i] === "--all-fails") o.all = true;
    else if (a[i] === "--quick") o.quick = true;
    else if (a[i] === "--json") o.json = true;
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
    else { console.error(`unknown option ${a[i]}`); process.exit(2); }
  }
  if (!o.sb) { console.error("usage: node qa/preflight.mjs <storyboard.json> [--gate 2] [--all-fails] [--layout file] [--fresh] [--quick] [--json] [--out dir]"); process.exit(2); }
  return o;
}

// newest change to what a layout depends on: the storyboard, the page code, the characters, the loader
function newest(sbFile) {
  let m = fs.statSync(sbFile).mtimeMs;
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else m = Math.max(m, fs.statSync(f).mtimeMs); } };
  for (const d of ["engine/page", "engine/shared", "characters"]) walk(path.join(ROOT, d));
  for (const f of ["engine/load.mjs", "engine/render.mjs"]) m = Math.max(m, fs.statSync(path.join(ROOT, f)).mtimeMs);
  return m;
}

// the layout: given, reused while fresh, else laid out now
export function layoutFor(sbFile, sb, { layout = null, fresh = false, out = path.join(ROOT, "out"), log = () => {} } = {}) {
  if (layout) return { file: layout, lay: JSON.parse(fs.readFileSync(layout, "utf8")), how: "given" };
  const cands = [`${sb.id}-${sb.look || "anime-pro"}.layout.json`, `${sb.id}.layout.json`].map((f) => path.join(out, f)).filter((f) => fs.existsSync(f));
  if (!fresh && cands.length && fs.statSync(cands[0]).mtimeMs > newest(sbFile)) return { file: cands[0], lay: JSON.parse(fs.readFileSync(cands[0], "utf8")), how: "reused (newer than the storyboard and the engine)" };
  log(`laying out ${path.relative(ROOT, sbFile)} (render.mjs --layout, a few minutes) ...`);
  const t0 = Date.now(), r = spawnSync(process.execPath, [path.join(ROOT, "engine/render.mjs"), sbFile, "--layout", "--out", out], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  const wrote = (r.stdout.match(/^wrote (.*\.layout\.json)$/m) || [])[1];
  if (!wrote) throw new Error(`the layout pass failed:\n${r.stdout}${r.stderr}`);
  return { file: wrote, lay: JSON.parse(fs.readFileSync(wrote, "utf8")), how: `laid out in ${((Date.now() - t0) / 1000).toFixed(0)}s` };
}

// every check, judged on one layout; returns the results with a group each: fail, visible, warn, note, pass
export async function preflight(sb, lay, { quick = false, sbFile = null } = {}) {
  const res = [];
  const add = (r, from) => res.push({ ...r, from });
  for (const r of [...clipResults(sb, lay), ...contactResults(lay, sb)]) add(r, "contacts");
  // captions over faces or outside the brief's band, from the layout: before this every build found them on a rendered
  // draft (Never Has Money 04, 8 Nov: a draft and a check round each, and one cancelled farm render)
  for (const r of captionResults(sb, lay)) add(r, "captions");
  for (const r of frontResults(sb, lay)) add(r, "framing");
  for (const r of eyesResults(sb, lay)) add(r, "framing");
  const chars = loadCharacters(sb);
  for (const r of visibility(sb, lay, chars).results) add(r, "framing");
  if (!sb.music?.lock && sb.music !== false) sb.music = lockMusic(sb);   // the grid the render uses (dance moves follow it)
  for (const r of await motionResults(sb, sb.fps ?? 30)) add(r, "motion");
  for (const r of await storyNotes(sb, sb.fps ?? 30)) add(r, "motion");
  for (const r of cameraLint(sb, chars)) add({ ...r, level: r.level === "pass" ? "pass" : "note" }, "camera");
  if (!quick) {
    try {
      const { soundNotes, freshMix, phoneBand } = await import("./sound.mjs");
      for (const r of soundNotes(sb)) add(r, "sound");
      const f = freshMix(sb, chars); for (const r of phoneBand(f.mix, f.events)) add(r, "sound");
    } catch (e) { add({ level: "warn", check: "sound", msg: `the sound wasn't measured (${e.message.split("\n")[0]})` }, "sound"); }
    if (sbFile) {
      const r = spawnSync(process.execPath, [path.join(ROOT, "qa/readability.mjs"), sbFile, "--json"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
      try { const j = JSON.parse(r.stdout.slice(r.stdout.indexOf("{"))); for (const w of j.warnings || []) add({ level: "warn", check: "readability", msg: typeof w === "string" ? w : w.msg || JSON.stringify(w) }, "readability"); for (const n of j.notes || []) add({ level: "note", check: "readability", msg: typeof n === "string" ? n : n.msg || JSON.stringify(n) }, "readability"); }
      catch { add({ level: "warn", check: "readability", msg: `the readability stills didn't run (${(r.stderr || r.stdout).trim().split("\n").pop()})` }, "readability"); }
    }
  }
  for (const r of res) r.kind = r.level === "fail" ? (GATE.fails.includes(r.check) ? "fail" : "fail") : r.level === "warn" ? (GATE.visible.includes(r.check) ? "visible" : "warn") : r.level === "note" ? "note" : "pass";
  return res;
}

export function verdict(res) {
  const n = (k) => res.filter((r) => r.kind === k).length;
  return n("fail") ? "FAIL" : n("visible") ? "WARN" : "PASS";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args(), sb = loadStoryboard(o.sb);
  if (o.gate != null) sb.gate = o.gate;
  if (o.all) { sb.gate = Math.max(2, Number(sb.gate ?? 1)); sb.rig = { ...(sb.rig || {}), hand: 2, hold: 2 }; sb.motion = { ...(typeof sb.motion === "object" ? sb.motion : {}), feet: 2 }; }
  const L = layoutFor(o.sb, sb, { layout: o.layout, fresh: o.fresh, out: o.out, log: o.json ? () => {} : (m) => console.log(m) });
  const res = await preflight(sb, L.lay, { quick: o.quick, sbFile: o.sb }), v = verdict(res);
  if (o.json) { console.log(JSON.stringify({ storyboard: o.sb, layout: L.file, gate: Number(sb.gate ?? 1), allFails: o.all, verdict: v, results: res }, null, 2)); process.exit(v === "FAIL" ? 1 : 0); }
  console.log(`preflight ${sb.id}: gate ${Number(sb.gate ?? 1)}${o.all ? " (every root fix assumed in)" : ""}, layout ${path.relative(process.cwd(), L.file)} ${L.how}`);
  const head = { fail: "BLOCKS THE RENDER", visible: "VISIBLE GLITCHES (may not ship as warnings: fix, or name in a window with a reason)", warn: "OTHER WARNINGS (one-line reason each in the delivery)" };
  for (const k of ["fail", "visible", "warn"]) {
    const rs = res.filter((r) => r.kind === k), lines = rs.map((r) => `  ${r.level === "fail" ? "FAIL" : "WARN"}  ${r.check}: ${r.msg}`);
    // the other warnings: every one in <id>.warnings.txt beside the layout (each needs its one-line reason in the
    // delivery), on screen only when new since the last preflight (qa/say.mjs; CHECKS_FULL=1 prints them all)
    if (k === "warn") { if (lines.length) console.log(` ${head[k]}`); sayChanged(lines, path.join(o.out, `${sb.id}.warnings.txt`), { root: ROOT }); continue; }
    if (!rs.length) continue;
    console.log(` ${head[k]}`);
    for (const l of lines) console.log(l);
  }
  const notes = res.filter((r) => r.kind === "note").length, c = (k) => res.filter((r) => r.kind === k).length;
  console.log(`${v}: ${c("fail")} fail${c("fail") === 1 ? "" : "s"}, ${c("visible")} visible-glitch warning${c("visible") === 1 ? "" : "s"}, ${c("warn")} other warning${c("warn") === 1 ? "" : "s"}, ${notes} note${notes === 1 ? "" : "s"}`);
  process.exit(v === "FAIL" ? 1 : 0);
}
