// Selftest for captions.mjs titleSlot(): a title box always lands between y 190 and the subtitle's top, never overlaps it.
//   node tools/svg2d/title-slot-selftest.mjs
import { titleSlot, captionTop } from "./lib/captions.mjs";
const band = captionTop();   // 2 rows at 74 px around y 560 -> ~464
let bad = 0;
const cases = [
  ["Golem stone plaque, as drawn (586-936)", { x: 76, y: 586, w: 930, h: 350 }],
  ["Sol's relief title (595-713)", { x: 233, y: 595, w: 537, h: 118 }],
  ["tall title", { x: 100, y: 0, w: 880, h: 900 }],
  ["wide title", { x: -200, y: 300, w: 1480, h: 120 }],
];
for (const [name, b] of cases) {
  const t = titleSlot(b), w = b.w * t.scale, ok = t.y0 >= 190 - 0.01 && t.y1 <= band - 19.99 && t.scale <= 1 && w <= 960.01;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: y ${t.y0}-${t.y1}, scale ${t.scale.toFixed(3)}, width ${Math.round(w)}  (subtitle top ${band.toFixed(1)})`);
}
if (bad) { console.error(`${bad} case(s) failed`); process.exit(1); }
