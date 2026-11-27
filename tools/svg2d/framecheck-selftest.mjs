// Self-test for tools/svg2d/framecheck.mjs: synthetic probe(t) scenes with known faults (seconds, no browser).
//   node tools/svg2d/framecheck-selftest.mjs        -> prints each report, exit 1 if any scene's findings differ
// A: a face drifting off the edge, a caption over a face, a prop jumping hands across a cut, fingers 2 -> 1.
// B: the same scene done right (prop put down between hands, fingers only rise, caption clear): no findings.
// C: a prop teleporting inside a shot, a prop appearing mid-shot, a caption carried into a shot after its line.
import { checkScene, report } from "./framecheck.mjs";

const shot = (t) => (t < 2 ? "a" : "b");
const A = {
  DUR: 4, LINES: [{ id: "L1", t0: 0.8, t1: 1.6 }],
  probe: (t) => ({
    shot: shot(t),
    faces: [{ id: "hero", x: 600 + t * 200, y: 1200, r: 100 }, { id: "pal", x: 300, y: 400, r: 90 }],
    props: [{ id: "paw", x: 500 + t * 10, y: 1400, holder: t < 2 ? "kid.handL" : "kid.handR", state: { fingers: t < 3 ? 2 : 1 } }],
    caption: t >= 1 && t < 1.5 ? { x0: 200, y0: 350, x1: 880, y1: 430 } : null, captionLine: t >= 1 && t < 1.5 ? "L1" : null,
  }),
};
const B = {
  DUR: 4, LINES: [{ id: "L1", t0: 0.8, t1: 1.6 }],
  probe: (t) => ({
    shot: shot(t),
    faces: [{ id: "hero", x: 600 + t * 60, y: 1200, r: 100 }, { id: "pal", x: 300, y: 900, r: 90 }],
    props: [{ id: "paw", x: t < 1.5 ? 500 + t * 900 : 1850 - t * 10, y: 1400, holder: t < 1.5 ? "kid.handL" : t < 2.5 ? "world" : "kid.handR", state: { fingers: t < 3 ? 1 : 2 } }],
    caption: t >= 1 && t < 1.6 ? { x0: 200, y0: 250, x1: 880, y1: 330 } : null, captionLine: t >= 1 && t < 1.6 ? "L1" : null,
  }),
};
const C = {
  DUR: 4, LINES: [{ id: "L1", t0: 0.2, t1: 1.0 }],
  probe: (t) => ({
    shot: shot(t),
    faces: [{ id: "hero", x: 540, y: 1100, r: 100 }],
    props: [{ id: "cap", x: t < 1 ? 300 : 700, y: 1500, holder: "son.handR" }, ...(t >= 3 ? [{ id: "envelope", x: 540, y: 1600, holder: "world" }] : [])],
    caption: t >= 0.3 && t < 2.4 ? { x0: 200, y0: 250, x1: 880, y1: 330 } : null, captionLine: t >= 0.3 && t < 2.4 ? "L1" : null,
  }),
};

const want = {
  A: ["CAPTION_FACE pal", "HOLDER_SWITCH paw", "FACE_EDGE hero", "COUNT_BACK paw"],
  B: [],
  C: ["PROP_JUMP cap", "CAPTION_CARRY L1", "PROP_JUMP envelope"],
};
let bad = 0;
for (const [name, S] of Object.entries({ A, B, C })) {
  const r = checkScene(S, { fps: 10 }), got = r.findings.map((f) => `${f.kind} ${f.id}`);
  const ok = got.length === want[name].length && got.every((g, i) => g === want[name][i]);
  console.log(`--- scene ${name}: ${ok ? "ok" : "MISMATCH"}\n${report(r, name).text}`);
  if (!ok) { bad++; console.log(`  wanted: ${want[name].join(", ") || "(none)"}\n  got:    ${got.join(", ") || "(none)"}`); }
}
console.log(bad ? `framecheck selftest: ${bad} scene(s) differ` : "framecheck selftest: all 3 scenes as expected");
process.exit(bad ? 1 : 0);
