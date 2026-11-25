// Loads each storyboard and mixes its sound in memory (no render, nothing written): seconds a board. Episode CI runs it
// on the castless storyboards a pull request changes (a film's narrator-only part, Atlantis B3), which the layout
// preflight skips: their sound mix crashed on a machine without the cached voice takes (engine audit, 24 Nov 2026).
//   node qa/mixcheck.mjs <storyboard.json> [...]     -> one line each; exits 1 when any fails
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { renderAudio } from "../engine/audio.mjs";

let bad = 0;
for (const f of process.argv.slice(2)) {
  try {
    const sb = loadStoryboard(f), a = renderAudio(sb, loadCharacters(sb));
    console.log(`mix ok   ${f} (${sb.duration} s, ${a.events.length} sounds)`);
  } catch (e) { bad++; console.log(`mix FAIL ${f}: ${String(e.message || e).split("\n").join("\n  ")}`); }
}
process.exit(bad ? 1 : 0);
