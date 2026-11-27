// PNG stills of the picture without banner or subtitles (or with --subs):  node storyboards/series/legend/cried-wolf/cw-still.mjs <outdir> <t1,t2,...> [--subs] [--banner]
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
const require = createRequire(resolve("tools/svg2d/render.mjs"));
const { chromium } = require("playwright");
const S = await import("./cw.mjs");
const [dir, list, ...fl] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const b = await chromium.launch(), page = await b.newPage({ viewport: { width: S.W, height: S.H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
for (const t of list.split(",").map(Number)) {
  const p = S.parts(t), pic = fl.includes("--banner") ? p.pic : S.partsNoTitle(t);
  await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, pic + (fl.includes("--subs") ? p.cap : "") + "</svg>");
  writeFileSync(`${dir}/t${t.toFixed(2)}.png`, await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: S.W, height: S.H } }));
}
await b.close();
