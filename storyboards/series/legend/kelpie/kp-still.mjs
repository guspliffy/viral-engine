// stills at given times: node kp-still.mjs <outdir> t1 t2 ... (env SUBS=0 for none)
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
const require = createRequire(resolve("tools/svg2d/render.mjs"));
const { chromium } = require("playwright");
const S = await import("./kp.mjs");
const [dir, ...ts] = process.argv.slice(2); mkdirSync(dir, { recursive: true });
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: S.W, height: S.H } });
await page.setContent(`<html><head>${S.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
for (const t of ts.map(Number)) {
  const svg = process.env.SUBS === "0" ? (() => { const p = S.parts(t); return p.pic + "</svg>"; })() : S.draw(t);
  await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, svg);
  await page.screenshot({ path: `${dir}/t${t.toFixed(2)}.png`, clip: { x: 0, y: 0, width: S.W, height: S.H } });
}
await browser.close();
