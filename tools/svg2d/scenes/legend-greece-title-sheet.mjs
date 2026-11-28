// The comparison sheet for the Cried Wolf opening title (legend-greece-title.mjs): each style full-frame at 1.2 s over
// the real opening frame with a sample subtitle at y 580, its in / hold / out strip, and style A with the three teasers.
//   node tools/svg2d/scenes/legend-greece-title-sheet.mjs <out.jpg>
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as CW from "../../../storyboards/series/legend/cried-wolf/cw.mjs";
import { titleCard, TITLE_STYLES, TEASERS } from "../lib/legend-greece-title.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const out = process.argv[2] || "out/legend-wolf/title-options.jpg";
const STYLES = [["A", "vase"], ["B", "marble"], ["C", "shepherd"]], STRIP = [0.3, 0.6, 1.5, 2.3, 2.55];
const SUB = `<text x="540" y="580" text-anchor="middle" font-family="Inter" font-weight="900" font-size="104" stroke="#120c24" stroke-width="20" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1"><tspan fill="#ffffff">Shout</tspan> <tspan fill="#ff3b3b">wolf</tspan></text>`;
const frameSvg = (t, o) => CW.parts(t).pic + titleCard(t, o) + SUB + "</svg>";

const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.setContent(`<html><head>${CW.HEAD}</head><body style="margin:0;overflow:hidden;background:#000"><div id="r"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
const shot = async (t, o, clip) => { await page.evaluate((s) => { document.getElementById("r").innerHTML = s; }, frameSvg(t, o)); return "data:image/png;base64," + (await page.screenshot({ type: "png", clip: clip || { x: 0, y: 0, width: 1080, height: 1920 } })).toString("base64"); };
const TOP = { x: 0, y: 130, width: 1080, height: 560 };

let html = `<html><body style="margin:0;background:#15131c;font-family:Inter,sans-serif;color:#fff"><div id="sheet" style="width:1860px;padding:26px 20px 30px 20px">`;
const lab = (txt, w = 64) => `<div style="width:${w}px;flex:none;font-size:54px;font-weight:900;color:#ffd24a">${txt}</div>`;
const note = (txt) => `<div style="font-size:21px;color:#b9b6c8;margin:4px 0 8px 0">${txt}</div>`;
html += `<div style="font-size:30px;font-weight:900;margin-bottom:6px">The Boy Who Cried Wolf: opening title, three styles (frame at 1.2 s, sample subtitle at y 580, the wolf's eyes below)</div><div style="display:flex;gap:18px">`;
for (const [L, st] of STYLES) html += `<div>${`<div style="font-size:46px;font-weight:900;color:#ffd24a">${L} <span style="font-size:24px;color:#b9b6c8">${st}, y ${TITLE_STYLES[st].y.join(" to ")}</span></div>`}<img src="${await shot(1.2, { style: st })}" width="594" height="1056"></div>`;
html += `</div>`;
html += `<div style="font-size:26px;font-weight:900;margin:22px 0 2px 0">In, hold, out (top of the frame at ${STRIP.join(" / ")} s)</div>`;
for (const [L, st] of STYLES) { const T = TITLE_STYLES[st].time; html += `<div style="display:flex;align-items:center;margin-top:8px">${lab(L)}<div style="display:flex;gap:6px">`; for (const t of STRIP) html += `<img src="${await shot(t, { style: st }, TOP)}" width="352" height="182">`; html += `</div></div>` + note(`<span style="margin-left:64px">in ${T.in.join(" to ")} s, out ${T.out.join(" to ")} s${T.eyes ? `, eyes open at ${T.eyes} s and blink` : ""}</span>`); }
html += `<div style="font-size:26px;font-weight:900;margin:18px 0 6px 0">Style A, the three teaser lines</div><div style="display:flex;align-items:flex-start">${lab("A")}<div style="display:flex;gap:8px">`;
for (const k of ["T1", "T2", "T3"]) html += `<div><div style="font-size:24px;font-weight:900;color:#ffd24a">${k} <span style="color:#b9b6c8;font-size:20px">${TEASERS[k].toLowerCase().replace("…", "...")}</span></div><img src="${await shot(1.2, { style: "vase", teaser: k }, TOP)}" width="586" height="304"></div>`;
html += `</div></div></div></body></html>`;

const p2 = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
await p2.setContent(`<html><head>${CW.HEAD}</head></html>`); await p2.setContent(html.replace("<html>", `<html><head>${CW.HEAD}</head>`));
await p2.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await (await p2.$("#sheet")).screenshot({ type: "jpeg", quality: 88 }));
await browser.close();
console.log("wrote", out);
