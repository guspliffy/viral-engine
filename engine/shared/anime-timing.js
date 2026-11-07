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
//                    "skip": [...] }    actions that don't make a key (default: still, noblink, talk, voice, blink)
// Everything is a function of (who, t), so renders and shards stay repeatable.
const SKIP = ["still", "noblink", "talk", "voice", "blink", "idle", "mood"];
export function animeTimingSpec(o) {
  if (!o) return null;
  return { fast: 0.2, slow: 0.9, idle: 3, push: 1.8, long: 1.2, skip: SKIP, ...(o === true ? {} : o) };
}
export function makeAnimeTiming(o, actions = [], fps = 30) {
  const S = animeTimingSpec(o);
  if (!S) return null;
  const skip = new Set(S.skip), f = 1 / fps, per = new Map();
  for (const a of actions) {
    if (!a.who || !(a.dur > 0) || skip.has(a.do)) continue;
    const L = per.get(a.who) || per.set(a.who, { keys: [], long: [] }).get(a.who);
    (a.dur > S.long ? L.long : L.keys).push([a.at, a.at + a.dur]);
  }
  // overlapping or touching moves (less than 2 frames apart) make one key-to-key segment
  for (const L of per.values()) {
    L.keys.sort((x, y) => x[0] - y[0]);
    const segs = [];
    for (const [a, b] of L.keys) { const s = segs[segs.length - 1]; if (s && a <= s[1] + 2 * f) s[1] = Math.max(s[1], b); else segs.push([a, b]); }
    L.segs = segs;
  }
  const step = (t, from, n) => from + Math.floor((t - from) * fps / n + 1e-4) * n / fps;
  const timing = (who, t) => {
    const L = per.get(who);
    if (!L) return step(t, 0, S.idle);
    for (const [a, b] of L.segs) {
      if (t < a - 1e-6 || t >= b - 1e-6) continue;
      const d = b - a, n = d <= S.fast ? 1 : d >= S.slow ? 3 : 2;
      const p = Math.min(1, (step(t, a, n) - a) / d);
      return a + d * (1 - Math.pow(1 - p, S.push));
    }
    // between moves: the drawing holds, stepping from the end of the last move (on 2s under a long action, a walk)
    let from = 0;
    for (const [, b] of L.segs) if (b <= t + 1e-6) from = Math.max(from, b);
    const walk = L.long.find(([a, b]) => t >= a - 1e-6 && t < b);
    if (walk) return step(t, Math.max(from, walk[0]), 2);
    return step(t, from, S.idle);
  };
  timing.spec = S;
  // the key-to-key segments of a character ([start, end] in story time), for checks that judge drawings (qa/rig.mjs)
  timing.segments = (who) => per.get(who)?.segs || [];
  return timing;
}
