// prints beats.txt for a review pack: the lines (start-end, speaker, text) and the shots (start-end, id, line)
import { TL_LINES, TIMELINE } from "./pandora.mjs";
const f = (x) => x.toFixed(2);
console.log("LINES (start-end s, speaker, text; end = last word heard)");
for (const ln of TL_LINES) console.log(`${f(ln.at)}-${f(ln.end)}  ${ln.who}  ${ln.text}`);
console.log("\nSHOTS (start-end s, shot id, line):");
for (const s of TIMELINE) console.log(`${f(s.at)}-${f(s.end)}  ${s.id}  ${s.line}`);
