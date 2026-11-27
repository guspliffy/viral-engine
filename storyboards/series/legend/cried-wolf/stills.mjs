// helper: print mid-shot times (or per-shot start+0.5) for the stills of the contact sheet:  node stills.mjs [mid|start]
import { TIMELINE } from "./cw.mjs";
const mode = process.argv[2] || "mid";
console.log(TIMELINE.map((s) => (mode === "start" ? s.at + 0.35 : (s.at + s.end) / 2).toFixed(2)).join(","));
