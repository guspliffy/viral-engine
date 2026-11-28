// prints beats.txt: the lines (start-end, speaker, text) and the shots (start-end, id, line)
import { TL_LINES, TIMELINE, DUR } from "./kp.mjs";
const f = (x) => x.toFixed(2);
console.log("DUR", DUR); console.log("LINES");
for (const ln of TL_LINES) console.log(`${f(ln.at)}-${f(ln.end)}  ${ln.who}  ${ln.text}`);
console.log("\nSHOTS");
for (const s of TIMELINE) console.log(`${f(s.at)}-${f(s.end)}  ${s.id}  ${s.line}`);
