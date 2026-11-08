// Anime timing (anime look 01, 7 Nov 2026, opt-in storyboard "animeTiming"; research/anime-look-2026-11-07, report
// section "Timing and acting"). Limited animation is not a lower frame rate: a move snaps into its key pose (most of
// the travel early, no slow-in), shows as held drawings counted from the move's own start (so the start and end keys
// are always drawn), on 1s when it is very fast, 2s for normal acting, 3s for slow, and the pose then holds while the
// small idle drift steps on 3s. Only the characters step: the camera, the set, the living world and effects stay on
// every frame (Spider-Verse, TV anime: background on 1s, characters on 2s), so it never reads as a choppy video.
//
//   "animeTiming": true                 the defaults below
//   "animeTiming": { "fast": 0.2,       a move this short or shorter shows on 1s
//                    "slow": 0.9,       this long or longer on 3s (between: on 2s)
//                    "idle": 3,         frames each drawing holds between moves (breathing, sway)
//                    "push": 1.8,       how hard the move front-loads (1: as eased; 1.8: ~71 % of the way at half time)
//                    "long": 1.2,       actions longer than this (walks, slow turns) aren't snapped, only stepped on 2s
//                    "skip": [...],     actions that don't make a key (default: still, noblink, talk, voice, blink)
//                    "travel": [...],   moves the feet step through (move, turn, walk, run ...): never snapped, whatever their
//                                       length, only stepped on 2s, so the planted feet keep their stride
//                                       (a front-loaded walk skates: the template Wizard's 0.45 s move, 8 Nov),
//                    "lead": 0.3,       from this long before such a move (its first steps start early)
//                    "settle": 0.15 }   until this long after it
// A drawing never holds across a cut: at a cut (cuts: the shot start times) every character shows its pose at the cut
// or later, so a new setup placed just before a cut is what the new shot opens on (what if 01, 8 Nov 2026: a held
// drawing showed the old setup in the new shot's first frame).
// Everything is a function of (who, t), so renders and shards stay repeatable.
const SKIP = ["still", "noblink", "talk", "voice", "blink", "idle", "mood"];
const TRAVEL = ["move", "turn", "walk", "run", "dash", "shuffle", "step", "dance", "ride", "fly", "follow", "wander", "chase", "flee"];
export function animeTimingSpec(o) {
  if (!o) return null;
  return { fast: 0.2, slow: 0.9, idle: 3, push: 1.8, long: 1.2, lead: 0.3, settle: 0.15, skip: SKIP, travel: TRAVEL, ...(o === true ? {} : o) };
}
export function makeAnimeTiming(o, actions = [], fps = 30, cuts = []) {
  const S = animeTimingSpec(o);
  if (!S) return null;
  const skip = new Set(S.skip), travel = new Set(S.travel), f = 1 / fps, per = new Map();
  for (const a of actions) {
    if (!a.who || !(a.dur > 0) || skip.has(a.do)) continue;
    const L = per.get(a.who) || per.set(a.who, { keys: [], long: [] }).get(a.who);
    // a move the feet step through starts its steps a little early (the gait's lead-in) and settles after: the window
    // that stays on plain 2s covers both
    if (travel.has(a.do)) L.long.push([Math.max(0, a.at - S.lead), a.at + a.dur + S.settle]);
    else (a.dur > S.long ? L.long : L.keys).push([a.at, a.at + a.dur]);
  }
  // overlapping or touching moves (less than 2 frames apart) make one key-to-key segment
  for (const L of per.values()) {
    L.keys.sort((x, y) => x[0] - y[0]);
    const segs = [];
    for (const [a, b] of L.keys) { const s = segs[segs.length - 1]; if (s && a <= s[1] + 2 * f) s[1] = Math.max(s[1], b); else segs.push([a, b]); }
    L.segs = segs;
  }
  const step = (t, from, n) => from + Math.floor((t - from) * fps / n + 1e-4) * n / fps;
  const cutList = cuts.filter((c) => c > 0).sort((a, b) => a - b);
  const lastCut = (t) => { let c = null; for (const x of cutList) if (x <= t + 1e-6) c = x; else break; return c; };
  const timing = (who, t) => { const r = drawing(who, t), c = cutList.length ? lastCut(t) : null; return c != null && r < c ? c : r; };
  const drawing = (who, t) => {
    const L = per.get(who);
    if (!L) return step(t, 0, S.idle);
    // travelling through the room: on 2s from the move's start, never snapped (a key over it waits for the feet)
    const walk = L.long.find(([a, b]) => t >= a - 1e-6 && t < b);
    if (walk) return step(t, walk[0], 2);
    for (const [a, b] of L.segs) {
      if (t < a - 1e-6 || t >= b - 1e-6) continue;
      const d = b - a, n = d <= S.fast ? 1 : d >= S.slow ? 3 : 2;
      const p = Math.min(1, (step(t, a, n) - a) / d);
      return a + d * (1 - Math.pow(1 - p, S.push));
    }
    // between moves: the drawing holds, stepping from the end of the last move
    let from = 0;
    for (const [, b] of L.segs) if (b <= t + 1e-6) from = Math.max(from, b);
    return step(t, from, S.idle);
  };
  timing.spec = S;
  // the key-to-key segments of a character ([start, end] in story time), for checks that judge drawings (qa/rig.mjs)
  timing.segments = (who) => per.get(who)?.segs || [];
  return timing;
}
