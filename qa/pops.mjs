#!/usr/bin/env node
// One-frame pops in any clip, in seconds: the "pops" line of qa/check.mjs on its own. For the proof before the render
// farm: draw only the second round a flash, an impact frame, a card that lands on an effect or a big prop passing
// the lens, in draft quality, and look for a frame that differs from both its neighbours (Survive it EP1, 10 Nov
// 2026: all three check-fix rounds on full renders were such frames; this takes 30 s instead of a 13 min render).
//
//   node engine/render.mjs <sb> --draft --from 5.5 --to 6.5     -> out/<id>-5.5-6.5-draft.mp4 (times start at 0 in it)
//   node qa/pops.mjs out/<id>-5.5-6.5-draft.mp4 [--from 5.5]    -> FAIL over 30, WARN over 8, as in qa/check.mjs
//
// --from adds the window's start to the printed times. Exit code 1 on a FAIL.
import fs from "node:fs";
import { oddFrames, RULES } from "./check.mjs";

const a = process.argv.slice(2), fi = a.indexOf("--from"), from = fi < 0 ? 0 : Number(a[fi + 1]);
const clip = a.find((x, i) => !x.startsWith("--") && (fi < 0 || i !== fi + 1));
if (!clip || !fs.existsSync(clip)) { console.error("usage: node qa/pops.mjs <clip.mp4> [--from <seconds>]"); process.exit(2); }
const odd = oddFrames(clip, 30), worst = odd.slice(0, 6), top = worst[0]?.score ?? 0;
const level = top > RULES.oddFrameFail ? "FAIL" : top > RULES.oddFrame ? "WARN" : "PASS";
console.log(`${level}  pops: ${worst.length ? worst.map((o) => `${(o.t + from).toFixed(2)}s (${o.score.toFixed(0)}, ${o.where})`).join(", ") : "no odd single frames"}${level === "PASS" ? " (all under the warn line of " + RULES.oddFrame + ")" : ""}`);
process.exit(level === "FAIL" ? 1 : 0);
