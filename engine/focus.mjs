// Who the camera focuses on ("set": { "aperture": 0.045, "focus": "acting" }, depth of field in look C): the
// character acting at each moment, as a list of { at, who } the page pulls focus along (engine/page/looks.js
// storyFocus, with a 0.3 s pull). Acting is a line, a face change or a body move; eyes, blinks and holds don't count.
// A new actor takes focus only when it does something bigger than the last one did, or 0.5 s after the last
// pull, so focus doesn't hunt between two characters moving at once. Runs in loadStoryboard, so the renderer and
// every qa/ tool see the same track.
const WEIGHT = { talk: 4, expr: 3, mood: 3, face: 2, move: 2, run: 2, hop: 2, fly: 2, land: 2, crouch: 2, stand: 2, sit: 2, grab: 2, throw: 2, swing: 2, slash: 2, charge: 2, flare: 2, turn: 1, arm: 1, squash: 1, wings: 1 };
const SETTLE = 0.5;

export function focusTrack(sb) {
  if (sb.set?.focus !== "acting" || !((sb.set.aperture ?? 0) > 0)) return sb;
  const ids = new Set((sb.cast || []).map((c) => c.id));
  const ev = (sb.actions || []).filter((a) => ids.has(a.who) && (WEIGHT[a.do] ?? 0) >= 1)
    .map((a) => ({ at: a.at, who: a.who, w: WEIGHT[a.do] })).sort((a, b) => a.at - b.at || b.w - a.w);
  const track = [];
  let cur = null;   // who has focus, since when, and how big their last action was
  for (const e of ev) {
    if (!cur) { cur = { ...e, at: 0 }; track.push({ at: 0, who: e.who }); continue; }
    if (e.who === cur.who) { cur.w = e.at - cur.at < SETTLE ? Math.max(cur.w, e.w) : e.w; continue; }
    if (e.w < 2 || (e.at - cur.at < SETTLE && e.w <= cur.w)) continue;
    cur = { ...e };
    track.push({ at: Math.round(e.at * 1000) / 1000, who: e.who });
  }
  return { ...sb, focusTrack: track };
}
