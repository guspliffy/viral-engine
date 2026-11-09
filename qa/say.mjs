// Check output that repeats only what changed (Jonny, 8 Nov 2026: fewer tokens per clip, same checks). A clip runs
// its layout and preflight 15 to 25 times, and every run printed every warning and note again into the thread, where
// each later step reads it again. Now:
// - every finding of this run is written to a file beside the layout (the full list, every time)
// - fails and visible glitches always print in full
// - any other line prints in full the first time it appears; a line the last run printed word for word is counted
//   ("unchanged since the last run"), and lines that went away are counted too
// - CHECKS_FULL=1 prints every line, every run (as before); the first run of a storyboard prints everything anyway
// No check, level or verdict changes here: only what is repeated on screen.
import fs from "node:fs";
import path from "node:path";

export const FULL = /^(1|true|yes|on)$/i.test(process.env.CHECKS_FULL || "");

// "  warn hand-pop: ..." / "  FAIL  front: ..." / "  note visible: ..." -> "hand-pop"
const checkOf = (text) => (/^\s*\S+\s+([\w-]+)/.exec(text) || [])[1] || "other";
const tally = (lines) => {
  const n = new Map();
  for (const t of lines) n.set(checkOf(t), (n.get(checkOf(t)) || 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (v > 1 ? `${k} x${v}` : k)).join(", ");
};

// lines: the finding lines of this run, as they would print; always(text): a line that prints every run.
// Returns the lines it printed (for callers that tee).
export function sayChanged(lines, file, { always = () => false, log = console.log, root = process.cwd() } = {}) {
  let prev = null;
  try { prev = fs.readFileSync(file, "utf8").split("\n").filter(Boolean); } catch { prev = null; }
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, lines.map((l) => `${l}\n`).join("")); } catch { prev = null; }
  if (FULL || !prev) { for (const l of lines) log(l); return lines; }
  const before = new Set(prev), now = new Set(lines), same = [], shown = [];
  for (const l of lines) { if (always(l) || !before.has(l)) { log(l); shown.push(l); } else same.push(l); }
  const gone = prev.filter((l) => !now.has(l));
  const rel = path.relative(root, file) || file;
  if (same.length) log(`  (${same.length} more unchanged since the last run, not repeated: ${tally(same)}; every line: ${rel})`);
  if (gone.length) log(`  (${gone.length} gone since the last run: ${tally(gone)})`);
  return shown;
}
