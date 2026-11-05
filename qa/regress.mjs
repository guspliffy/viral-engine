#!/usr/bin/env node
// Contact and motion regression run: lays out every fixture in storyboards/regress/ (render.mjs --layout, no frames
// drawn) and tests its contact and rig results against the fixture's "expect" block (see make-regress.mjs). Run it
// after changing the rig, a grip, the contact checks or qa/rig.mjs; a fixture that stops failing where it must is a
// check that went blind.
//
//   node qa/regress.mjs                 -> one line per fixture, exit 1 when any expectation is broken
//   node qa/regress.mjs hug arm-pop     -> only those fixtures
//   node qa/regress.mjs --keep          -> reuse layouts already in out/ (checking a change to qa/ only)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";
import { clipResults, contactResults } from "./check.mjs";
import { GATE as RENDER_GATE } from "./gate.mjs";
import { visibility, frontResults } from "./framing.mjs";
import { motionResults } from "./motion.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "storyboards/regress");
// the checks a fixture may not fail unless its expect block names them (the render gate, qa/gate.mjs)
const GATE = RENDER_GATE.fails;

// the contact, rig, framing (must-see, the front) and motion results, as qa/preflight.mjs judges them
export async function judge(sb, layout) {
  const res = [...clipResults(sb, layout), ...contactResults(layout, sb), ...frontResults(sb, layout), ...visibility(sb, layout).results, ...(await motionResults(sb, sb.fps ?? 30))], ex = sb.expect || {}, bad = [];
  const lvl = (check) => (res.some((r) => r.check === check && r.level === "fail") ? "fail" : res.some((r) => r.check === check && r.level === "warn") ? "warn" : "pass");
  for (const c of ex.fail || []) if (lvl(c) !== "fail") bad.push(`${c} should fail, got ${lvl(c)}`);
  for (const c of ex.warn || []) if (lvl(c) === "pass") bad.push(`${c} should warn, got pass`);
  for (const c of ex.clean || []) if (lvl(c) !== "pass") bad.push(`${c} should be clean, got ${lvl(c)}: ${res.find((r) => r.check === c && r.level !== "pass").msg}`);
  for (const r of res) if (r.level === "fail" && GATE.includes(r.check) && !(ex.fail || []).includes(r.check)) bad.push(`unexpected fail ${r.check}: ${r.msg}`);
  return { bad, res };
}

const args = process.argv.slice(2), keep = args.includes("--keep"), only = args.filter((a) => !a.startsWith("--"));
const files = fs.readdirSync(DIR).filter((f) => /^regress-.*\.json$/.test(f) && (!only.length || only.includes(f.slice(8, -5)))).sort();
let broken = 0;
for (const f of files) {
  const file = path.join(DIR, f), sb = loadStoryboard(file), t0 = Date.now();
  const lay = path.join(ROOT, "out", `${sb.id}-${sb.look || "anime-pro"}.layout.json`);
  if (!keep || !fs.existsSync(lay)) {
    const r = spawnSync(process.execPath, [path.join(ROOT, "engine/render.mjs"), file, "--layout"], { cwd: ROOT, encoding: "utf8" });
    const wrote = (r.stdout.match(/^wrote (.*\.layout\.json)$/m) || [])[1];
    if (!wrote) { broken++; console.log(`BROKEN ${sb.id}: no layout\n${r.stdout}${r.stderr}`); continue; }
    if (wrote !== lay) fs.copyFileSync(wrote, lay);
  }
  const { bad } = await judge(sb, JSON.parse(fs.readFileSync(lay, "utf8")));
  if (bad.length) broken++;
  console.log(`${bad.length ? "BROKEN" : "ok    "} ${sb.id.padEnd(24)} ${((Date.now() - t0) / 1000).toFixed(0)}s${bad.map((b) => "\n         " + b).join("")}`);
}
console.log(broken ? `${broken} of ${files.length} fixtures broken` : `all ${files.length} fixtures judged as expected`);
if (broken) process.exitCode = 1;
