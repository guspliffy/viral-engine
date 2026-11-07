// The living world (set "life", 7 Nov 2026, research/living-worlds-2026-11-07): one wind, one clock, shared by the
// picture (engine/page/set-life.js) and the sound (engine/audio.mjs), so a gust you see bending the grass is the
// gust you hear, and the birds that leave on a shout leave on the frame the shout lands.
//
// Everything is a pure function of the storyboard and the time t: no state carries from frame to frame (renders are
// sharded, engine/render.mjs).
//
// Wind: gusts are bands of stronger air that travel across the meadow in the wind's direction (+x, screen right),
// like the waves that run over a field of wheat (Py, de Langre & Moulia 2006: 3.1 m/s, in patches with random gaps).
// Each gust has its own strength, width and crossing time; between gusts the air never stops completely.

// a small seeded generator (same as engine/page/util.js rng, copied so Node and the page share this file)
export function lifeRng(seed) {
  let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

export const GUST_MAX = 12;
export const LOOK = 0.25;   // the alert hold before a startled bird leaves (s)

// set.life -> the full recipe with defaults, or null when the set has no life
export function lifeSpec(set, duration = 10) {
  const L = set?.life;
  if (!L) return null;
  const seed = L.seed ?? 11, r = lifeRng(seed);
  // "storm": true (or an object of overrides): a grey, windy day. Gusts come every 1-2 s and much stronger, the air
  // never settles, the trees bend from the trunk, the sky darkens and races, leaves and twigs fly, a light rain
  // slants with the wind, and the birds keep quiet
  const ST = L.storm ? { ...(L.storm === true ? {} : L.storm) } : null;
  const W = { speed: 3.2, every: [2.6, 5.0], strength: [0.7, 1.2], width: [2.2, 4.0], calm: 0.4,
    ...(ST ? { speed: 5.5, every: [0.9, 2.0], strength: [1.2, 2.0], width: [3, 6], calm: 1.0, first: -0.6 } : {}), ...(L.wind || {}) };
  // gusts: crossing x = 0 at tc; the first one already on its way at frame 0, so the field moves from the start
  const gusts = [];
  if (L.wind !== false) {
    let tc = (W.first ?? 0.9) - r() * 0.4;
    while (gusts.length < GUST_MAX && tc < duration + 3) {
      gusts.push({ tc: +tc.toFixed(3), s: +(W.strength[0] + r() * (W.strength[1] - W.strength[0])).toFixed(3),
        w: +(W.width[0] + r() * (W.width[1] - W.width[0])).toFixed(3), ph: +(r() * 6.283).toFixed(3) });
      tc += W.every[0] + r() * (W.every[1] - W.every[0]);
    }
    for (const g of W.at || []) gusts.push({ tc: g.t, s: g.s ?? 1, w: g.w ?? 3, ph: 0 });
    gusts.sort((a, b) => a.tc - b.tc).splice(GUST_MAX);
  }
  // startles: a loud sound (or a fast rush) at a place and time. Every bird and insect that hears it reacts.
  const startle = (L.startle || []).map((s) => ({ t: s.t, at: s.at, loud: s.loud ?? 1 }));
  const clouds = L.clouds === false ? null : { drift: 0.0035, shadow: 0.3, speed: 7.5, scale: 46, near: 14,
    ...(ST ? { drift: 0.011, shadow: 0.42, speed: 10, scale: 22, near: 9 } : {}), ...(L.clouds || {}) };
  return { seed, wind: { ...W, gusts }, clouds,
    // bend: how far the trees and tall grass lean from their foot in the wind (m at 6 m up, per unit of gust)
    bend: L.bend ?? (ST ? 0.16 : 0.035),
    // grade: the painting under a grey sky (multiply, saturation) and the cast's light with it
    grade: L.grade ?? (ST ? { mul: [0.8, 0.84, 0.92], sat: 0.75, light: 0.75, tint: "#d2dae8", sky: 0.7 } : null),
    rain: L.rain ?? (ST ? { n: 700, speed: 9, len: 0.32 } : null),
    debris: L.debris ?? (ST ? { n: 26 } : null), storm: !!ST,
    birds: L.birds || [], butterflies: L.butterflies || null, leaves: L.leaves || null, startle, song: L.song ?? (ST ? 0 : 1), duration };
}

// how strong the wind is at world (x, z) at time t: calm air plus every gust band passing. 0.4 calm .. ~1.6 in a gust
export function gustAt(S, x, z, t) {
  const W = S.wind; let g = 0;
  for (const G of W.gusts) {
    const front = W.speed * (t - G.tc) + Math.sin(z * 0.33 + G.ph) * 1.1;   // the band is ragged along its length
    const d = (x - front) / G.w; g += G.s * Math.exp(-d * d);
  }
  return W.calm + g;
}

// when gust k reaches the point x (the sound of the wind in the leaves swells then)
export const gustTimeAt = (S, G, x) => G.tc + x / S.wind.speed;

// a bird's reaction to the startles: the time it leaves (or null). Flight initiation: the louder and nearer the
// sound, the surer; neighbours follow within a frame or two (starlings pass a turn on at 20-40 m/s, Attanasi 2014).
// A loud sound reaches every bird here at once, so the order comes from reaction time: the nearest go first.
export function leaveTime(S, bird, i) {
  const r = lifeRng(S.seed * 31 + i * 7.13);
  let best = null;
  for (const s of S.startle) {
    const dx = bird.at[0] - s.at[0], dz = bird.at[2] - s.at[1], d = Math.hypot(dx, dz);
    const reach = 6 * s.loud;                          // metres at which this sound still sends a small bird off
    if (d > reach) continue;
    // the look: heads snap up toward the sound at once (startle, ~70 ms), the song stops, and they hold for 6-10
    // frames weighing it up (the risk-assessment beat before fleeing) before the burst; nearest first
    const alert = s.t + 0.07, t = s.t + LOOK + d * 0.035 + r() * 0.1;
    if (best === null || t < best.t) best = { t, alert, from: s.at };
  }
  if (bird.leave != null && (best === null || bird.leave < best.t)) best = { t: bird.leave, alert: bird.leave, from: bird.from || [0, 0] };
  return best;
}
