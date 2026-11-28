// The cover frame: the board at time t with NO subtitles and NO banner (default 4.4 s: Hansel at the door, the red eyes in the sugar window).
//   node storyboards/series/legend/hansel-gretel/hg-cover.mjs <out.jpg> [t]
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
const require = createRequire(resolve("tools/svg2d/render.mjs"));
const { chromium } = require("playwright");
const S = await import("./hg.mjs");
const [out, tt = "4.4"] = process.argv.slice(2), t = +tt;
if (t < S.BANNER_END) throw new Error(`t ${t} is inside the banner (ends ${S.BANNER_END})`);
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: S.W, height: S.H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, S.parts(t).pic + "</svg>");
writeFileSync(out, await page.screenshot({ type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: S.W, height: S.H } }));
await browser.close(); console.log("cover", out, "t", t);
