#!/usr/bin/env node
// Camera coverage for a layered painted environment (set "type": "env"; engine/shared/env-coverage.js): does every
// frame stay where the painting's layers cover it? Well under a second, from the storyboard alone.
//
//   node qa/env.mjs storyboards/x.json          every frame: fails (edge of the painting in frame) and warnings
//   node qa/env.mjs --range <env name>          the safe camera range from the painting camera (metres, degrees)
//
// engine/load.mjs refuses to load a storyboard with a fail (so render.mjs never starts one); this prints the details.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";
import { cameraState } from "../engine/page/timeline.js";
import { worldCamera } from "../engine/page/vehicle.js";
import { envCoverage, envRange } from "../engine/shared/env-coverage.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

export function envReport(sb) {
  if (sb.set?.type !== "env") return null;
  return envCoverage(sb.set.envData, (t) => worldCamera(sb, cameraState(sb, t), t), sb.duration ?? 1, sb.fps ?? 30);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  if (a[0] === "--range") {
    const E = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/environments", a[1], "env.json"), "utf8"));
    const r = envRange(E);
    console.log(`safe camera range for ${a[1]} (from the painting camera ${r.base.pos.join(", ")}, fov ${r.base.fov}):`);
    console.log(`  move   left ${r.left} m, right ${r.right} m, down ${r.down} m, up ${r.up} m, in ${r.in} m, out ${r.out} m`);
    console.log(`  turn   pan left ${r.panLeft}°, pan right ${r.panRight}°, tilt up ${r.tiltUp}°, tilt down ${r.tiltDown}°`);
    console.log(`  widest fov ${r.fovMax}°`);
    process.exit(0);
  }
  if (!a[0]) { console.error("usage: node qa/env.mjs <storyboard.json> | --range <env name>"); process.exit(2); }
  const sb = loadStoryboard(a[0], { envGate: false });
  const r = envReport(sb);
  if (!r) { console.log("not an env set: nothing to check"); process.exit(0); }
  for (const e of r.fails) console.log(`FAIL ${e.from.toFixed(2)}-${e.to.toFixed(2)} s  ${e.rule}: ${e.msg} (${e.at}; ${e.frames} frame-points)`);
  for (const e of r.warns) console.log(`warn ${e.from.toFixed(2)}-${e.to.toFixed(2)} s  ${e.rule}: ${e.msg}`);
  console.log(r.fails.length ? `${r.fails.length} fail(s) in ${r.frames} frames` : `ok: ${r.frames} frames covered${r.warns.length ? `, ${r.warns.length} warning(s)` : ""}`);
  process.exit(r.fails.length ? 1 : 0);
}
