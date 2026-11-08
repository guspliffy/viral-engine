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
// Everything is a function of (who, t), so renders and shards stay repeatable.
// cuts: the story times of the camera cuts (the shots' starts). A drawing never holds across a cut: the first frame of a
// shot shows the pose at that frame, so a cheat behind a cut (a twin swapped in, a "dur": 0 move to a new place) lands
// on the cut and not two frames into the new shot (Death waits for GTA 6 ep 2, 8 Nov 2026: Death sat down three
// frames after the cut). Nor does a front-loaded key reach past the next cut: a squash running over a cut showed
// Phoenix already in the next shot's place two frames before it.
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
  const CUTS = [...cuts].filter((x) => x > 0).sort((x, y) => x - y);
  // the last cut at or before t (the drawings count from it)
  const cutAt = (t) => { let c = -Infinity; for (const x of CUTS) { if (x <= t + 1e-6) c = x; else break; } return c; };
  const cutAfter = (t) => { for (const x of CUTS) if (x > t + 1e-6) return x; return Infinity; };
  const timing = (who, t) => {
    const L = per.get(who), cut = cutAt(t);
    if (!L) return step(t, Math.max(0, cut), S.idle);
    // travelling through the room: on 2s from the move's start, never snapped (a key over it waits for the feet)
    const walk = L.long.find(([a, b]) => t >= a - 1e-6 && t < b);
    if (walk) return step(t, Math.max(walk[0], cut), 2);
    for (const [a, b] of L.segs) {
      if (t < a - 1e-6 || t >= b - 1e-6) continue;
      const d = b - a;
      // a chain of moves merged into one key-to-key segment longer than S.long (back-to-back acting, 3 s of it in
      // never-has-money 04) is not one move: front-loading it drew the body up to 0.6 s ahead of its props and
      // everyone else (the hands holding a card up at the face while the script had it on the knee). Step it on 2s,
      // as a long action is (8 Nov)
      if (d > S.long) return step(t, Math.max(a, cut), 2);
      const n = d <= S.fast ? 1 : d >= S.slow ? 3 : 2;
      const p = Math.min(1, (step(t, Math.max(a, cut), n) - a) / d);
      return Math.min(a + d * (1 - Math.pow(1 - p, S.push)), cutAfter(t) - 1e-4);
    }
    // between moves: the drawing holds, stepping from the end of the last move (or the last cut)
    let from = Math.max(0, cut);
    for (const [, b] of L.segs) if (b <= t + 1e-6) from = Math.max(from, b);
    return step(t, from, S.idle);
  };
  timing.spec = S;
  // the key-to-key segments of a character ([start, end] in story time), for checks that judge drawings (qa/rig.mjs)
  timing.segments = (who) => per.get(who)?.segs || [];
  return timing;
}
