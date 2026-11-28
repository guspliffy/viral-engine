// dev helper: stills at given times (with subtitles) -> out/legend-hansel/stills/<t>.png ; "sheet" arg tiles them
//   node storyboards/series/legend/hansel-gretel/hg-still.mjs 0 1.5 4.2 ...        |   --shots (mid of every shot)  |  --starts (first frame of every shot, +0.3 s)
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
const require = createRequire(resolve("tools/svg2d/render.mjs"));
const { chromium } = require("playwright");
const S = await import("./hg.mjs");
const args = process.argv.slice(2), dir = "out/legend-hansel/stills"; mkdirSync(dir, { recursive: true }); for (const f of readdirSync(dir)) if (/^s-.*\.png$/.test(f)) unlinkSync(`${dir}/${f}`);
let times = [];
if (args[0] === "--shots") times = S.TIMELINE.map((s) => +(Math.min((s.at + s.end) / 2, s.at + 1.6)).toFixed(2));
else if (args[0] === "--starts") times = S.TIMELINE.map((s) => +(s.at + 0.3).toFixed(2));
else if (args[0] === "--shot") { const q = S.TIMELINE.filter((s) => args.slice(1).includes(s.id)); for (const s of q) for (const f of [0.15, 0.5, 0.85]) times.push(+(s.at + (s.end - s.at) * f).toFixed(2)); }
else times = args.map(Number);
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: S.W, height: S.H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const files = [];
for (const t of times) {
  await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, S.draw(t));
  const p = `${dir}/s-${t.toFixed(2).padStart(6, "0")}.png`; writeFileSync(p, await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: S.W, height: S.H } })); files.push(p);
}
await browser.close();
console.log(times.map((t) => t.toFixed(2)).join(" "), "DUR", S.DUR, "missing", S.MISSING.length);
