// cheat-overlap (12 Nov 2026, You wake up mid EP02, the improvement loop's next fix): a cheat behind a cut is a "dur": 0
// (or 0.01) move of a character, or of the carrier prop it rides, in the last 0.05 s before a cut, so the next shot
// starts with everyone in a new place. Anime timing front-loads every move into its key pose, so a move of the same
// character still running in the 0.2 s before the cheat can draw its key with the cheat already applied: EP02's swim
// stroke reached the shore cheat and the layout gate found a 145 cm rig-jump (a full layout round to find it). This
// reads only the storyboard, before any layout: warn, with the move to end earlier.
//
//   node qa/cheats.mjs <storyboard.json>          (also part of qa/preflight.mjs)
import { pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";

const BEFORE = 0.05;   // a cheat this close before a cut
const CLEAR = 0.2;     // a move must end this long before the cheat
const INSTANT = 0.012;
// actions that never make a drawn key (anime-timing's skip list) or never move the body
const QUIET = new Set(["still", "noblink", "talk", "voice", "blink", "idle", "mood", "expr", "look", "hide", "show", "say", "sfx", "grip"]);

export function cheatResults(sb) {
  const acts = sb.actions || [];
  const cuts = (sb.shots || []).map((s) => s.at).filter((t) => t > 0);
  if (!cuts.length || !sb.animeTiming) return [];
  // who rides which carrier prop: { do: "ride", prop } (from then on)
  const rides = acts.filter((a) => a.do === "ride" && a.prop).map((a) => ({ who: a.who, prop: a.prop, at: a.at }));
  const riderOf = (prop, t) => rides.filter((r) => r.prop === prop && r.at <= t + 1e-6).map((r) => r.who);
  const cutAfter = (t) => cuts.find((c) => c >= t - 1e-6 && c - t <= BEFORE + 1e-6);
  const cheats = [];
  for (const a of acts) {
    if (!((a.dur ?? 0) <= INSTANT) || QUIET.has(a.do)) continue;
    const cut = cutAfter(a.at);
    if (cut == null) continue;
    const whos = a.do === "prop" ? riderOf(a.id, a.at) : a.who ? [a.who] : [];
    for (const who of whos) cheats.push({ who, at: a.at, cut, what: a.do === "prop" ? `${a.id} (the carrier it rides)` : a.do });
  }
  const out = [], seen = new Set();
  for (const ch of cheats) {
    for (const m of acts) {
      if (m.who !== ch.who || QUIET.has(m.do) || !((m.dur ?? 0) > INSTANT)) continue;
      const end = m.at + m.dur;
      if (m.at < ch.at && end > ch.at - CLEAR) {
        const key = `${ch.who}/${m.do}/${m.at}/${ch.at}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ level: "warn", check: "cheat-overlap", msg: `${ch.who}: the ${m.do} at ${m.at.toFixed(2)}-${end.toFixed(2)} s runs into the cheat behind the cut at ${ch.cut.toFixed(2)} s (${ch.what} at ${ch.at.toFixed(2)} s): anime timing front-loads it, so its key can draw the new place before the cut; end it by ${(ch.at - CLEAR).toFixed(2)} s` });
      }
    }
  }
  if (!out.length) out.push({ level: "pass", check: "cheat-overlap", msg: `no move runs into a cheat behind a cut (${cheats.length} cheats)` });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const f = process.argv[2];
  if (!f) { console.error("usage: node qa/cheats.mjs <storyboard.json>"); process.exit(2); }
  const res = cheatResults(loadStoryboard(f));
  for (const r of res) console.log(`${r.level.toUpperCase().padEnd(5)} ${r.check}: ${r.msg}`);
  if (!res.length) console.log("cheat-overlap: anime timing is off or the clip has one shot");
}
