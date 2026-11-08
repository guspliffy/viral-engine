// How dark it is outside at story time t (Jonny 8 Nov 2026: "when we go night time in the scene the outdoor time should
// change as well"): 0 as painted, 1 night. The series HUD's clock (engine/page/hud.js) sets it by default, so the
// window turns to night as the clock passes the evening; "sky": [[t, level, dur?]] keys set it by hand ("sky": false,
// or "hud": { "sky": false }, keeps the picture as painted). Used by the page (engine/page/sky.js fades the plate to
// its night picture and grades the frame) and by engine/load.mjs (the warning for a night clock on a day set).
// Shared by Node and the page: no imports.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);   // = util.js ease("inOut")

// "HH:MM" or minutes -> minutes
export const minutes = (s) => { if (typeof s === "number") return s; const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };

// [[t, v, dur], ...] at t: the value, how far into its count it is, and when the key started (the HUD's keys: from t
// the value counts from the previous key's value to its own over dur seconds, eased in and out; no dur: it jumps)
export function keyed(spec, t, parse = (v) => v) {
  if (spec == null) return null;
  const K = (Array.isArray(spec) ? spec : [[0, spec]]).map((k) => [k[0], parse(k[1]), k[2] ?? 0]).sort((a, b) => a[0] - b[0]);
  let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j;
  if (i < 0) return { v: K[0][1], since: -Infinity, i: 0, K };
  const [t0, v, d] = K[i], prev = i > 0 ? K[i - 1][1] : v;
  const k = d > 0 ? clamp((t - t0) / d) : 1;
  return { v: d > 0 ? prev + (v - prev) * inOut(k) : v, since: t - t0, i, K, prev, counting: k < 1 };
}

// the clock's hour -> night 0-1: dusk from 19:30, night from 21:30, dawn from 04:30, day from 06:30 (a European summer
// evening; the HUD shows the moon from half way, 20:30)
export function nightOf(mins) {
  const h = (((mins / 60) % 24) + 24) % 24;
  return h >= 12 ? smooth(19.5, 21.5, h) : 1 - smooth(4.5, 6.5, h);
}

// the night level at story time t
export function skyAt(sb, t) {
  if (sb.sky === false) return 0;
  if (Array.isArray(sb.sky)) return clamp(keyed(sb.sky, t).v);
  const H = sb.hud;
  if (!H || !H.clock || H.sky === false) return 0;
  // the light follows the clock over the last skyFade seconds (default 0.6): a jump fades instead of flipping mid-shot,
  // and a fast clock run still shows the window dimming
  const f = H.skyFade ?? 0.6, n = f > 0 ? 6 : 0;
  let v = 0; for (let i = 0; i <= n; i++) v += nightOf(keyed(H.clock, t - (f * i) / Math.max(n, 1), minutes).v);
  return v / (n + 1);
}

// the highest level the clip reaches (sampled every 0.05 s of story; 0: the sky never changes)
export function skyMax(sb, end = sb.storyDuration ?? sb.duration ?? 10) {
  let m = 0;
  for (let t = 0; t <= end + 1e-9; t += 0.05) m = Math.max(m, skyAt(sb, t));
  return m;
}
