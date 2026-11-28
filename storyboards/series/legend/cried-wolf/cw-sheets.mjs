// prints the times for the two contact sheets: shots (mid of each shot) and captions (0.35 s into each phrase)
import { TIMELINE, TL_LINES } from "./cw.mjs";
const kind = process.argv[2];
if (kind === "shots") console.log(TIMELINE.map((s) => ((s.at + s.end) / 2).toFixed(2)).join(" "));
else console.log(TL_LINES.flatMap((ln) => ln.phrases.map((p) => (ln.at + p.at + 0.4).toFixed(2))).join(" "));
