// Selftest for captions.mjs house size: a board's maxFs above 74 px is clamped unless trial: true (Jonny 28 Nov, Pandora).
//   node tools/svg2d/caption-size-selftest.mjs
import { captionSvg, HOUSE_FS } from "./lib/captions.mjs";
const ph = [{ ws: [["Big", 0, 0.3], ["test", 0.3, 0.6]], at: 0 }];
const fs = (o) => +captionSvg(ph, 0.5, o).match(/font-size="(\d+)"/)[1];
const cases = [["default", {}, HOUSE_FS], ["wolf trial number copied (104)", { maxFs: 104 }, HOUSE_FS], ["asked-for size trial", { maxFs: 104, trial: true }, 104], ["smaller is kept", { maxFs: 60 }, 60]];
let bad = 0;
for (const [name, o, want] of cases) { const got = fs(o), ok = got === want; if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${got} px (want ${want})`); }
process.exit(bad ? 1 : 0);
