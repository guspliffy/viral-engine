// stretchAt(sb, at, len, slow): a live reaction hold instead of a hit-stop (Jonny 8 Nov, on the v3 re-cuts: a 0.7 s
// hit-stop "seems to be stuck/frozen"). The `slow` seconds of story from `at` play in slow motion over `slow + len`
// seconds, and everything after them happens `len` seconds later: the same end state as hitStop [{ at, frames: len *
// fps }], but the picture keeps moving (a run goes on in slow motion, the close-up breathes) and the story clock is the
// video clock again, so allowClip windows, captions and sounds all sit on one clock.
//
// It is one time warp f applied to every time in a written beat storyboard (the object clip.mjs write() gets): beats
// and their relative `do` items (start and end), captions, visible, allowClip, hitStop, music parts, the cover.
// Keyframe lists inside an action (`pts` [[t, x, z]], `rate` [[t, k]], relative to the action's start) get points at
// the warp's two corners, so every character slows down and speeds up on the same frames and nobody drifts into a
// neighbour.
const r3 = (x) => Math.round(x * 1000) / 1000;

export function stretchAt(sb, at, len, slow) {
  const k = (slow + len) / slow;
  const f = (s) => (s <= at ? s : s < at + slow ? at + (s - at) * k : s + len);
  const keys = (list, t0, ns) => {
    if (!list.length || !list.every((p) => Array.isArray(p) && typeof p[0] === "number")) return list;
    const pts = list.map((p) => [t0 + p[0], ...p.slice(1)]), out = [];
    for (let i = 0; i < pts.length; i++) {
      out.push(pts[i]);
      const a = pts[i], b = pts[i + 1];
      if (!b) break;
      for (const c of [at, at + slow]) if (a[0] < c - 1e-9 && b[0] > c + 1e-9) {   // a corner inside this span: add a point on it
        const u = (c - a[0]) / (b[0] - a[0]);
        out.push([c, ...a.slice(1).map((v, j) => (typeof v === "number" && typeof b[j + 1] === "number" ? r3(v + (b[j + 1] - v) * u) : v))]);
      }
    }
    return out.map((p) => [r3(f(p[0]) - ns), ...p.slice(1)]);
  };
  // a step rate ([[t, steps a second]]) is a speed: inside the slow part the legs step k times slower, so the footfalls
  // and the arm swing keep pace with the slowed body (else the arms flail at full speed while the body crawls). The
  // rate ramps down and back up over one frame at each corner.
  const rates = (list, t0, ns) => {
    const K = keys(list, t0, ns);
    if (K === list) return list;
    const A = r3(f(at) - ns), B = r3(f(at + slow) - ns), fr = 1 / 30, out = [];
    for (let i = 0; i < K.length; i++) {
      const [t, v] = K[i], prev = out[out.length - 1];
      if (Math.abs(t - A) < 1e-6) { if (!prev || prev[0] < t - fr - 1e-6) out.push([r3(t - fr), v]); out.push([t, r3(v / k)]); }
      else if (Math.abs(t - B) < 1e-6) { out.push([t, r3(v / k)]); const nx = K[i + 1]; if (!nx || nx[0] > t + fr + 1e-6) out.push([r3(t + fr), v]); }
      else out.push(t > A && t < B ? [t, r3(v / k)] : [t, v]);
    }
    return out;
  };
  const span = (o, a = "from", b = "to") => ({ ...o, ...(o[a] != null && { [a]: r3(f(o[a])) }), ...(o[b] != null && { [b]: r3(f(o[b])) }) });
  const beats = (sb.beats || []).map((b) => {
    const nb = r3(f(b.at)), ne = b.len != null ? r3(f(b.at + b.len)) : null;
    const items = (b.do || []).map((d) => {
      const t0 = b.at + (d.at ?? 0), ns = r3(f(t0)), o = { ...d, at: r3(ns - nb) };
      if (d.dur != null) o.dur = r3(f(t0 + d.dur) - ns);
      if (Array.isArray(d.pts)) o.pts = keys(d.pts, t0, ns);
      if (Array.isArray(d.rate)) o.rate = rates(d.rate, t0, ns);
      return o;
    });
    const shot = b.shot && typeof b.shot === "object" && b.shot.dur != null ? { ...b.shot, dur: r3(f(b.at + b.shot.dur) - nb) } : b.shot;   // a camera move keeps its story span
    return { ...b, at: nb, ...(ne != null && { len: r3(ne - nb) }), ...(b.do && { do: items }), ...(shot !== undefined && { shot }) };
  });
  const out = { ...sb, beats };
  if (sb.captions) out.captions = sb.captions.map((c) => span(c));
  if (sb.visible) out.visible = sb.visible.map((v) => span(v));
  if (sb.allowClip) out.allowClip = sb.allowClip.map((w) => span(w));
  if (sb.hitStop) out.hitStop = sb.hitStop.map((h) => ({ ...h, at: r3(f(h.at)) }));
  if (sb.duration != null) out.duration = r3(sb.duration + len);
  if (sb.music && Array.isArray(sb.music.parts)) out.music = { ...sb.music, parts: sb.music.parts.map((p) => ({ ...p, at: r3(f(p.at)) })) };
  if (sb.music && sb.music.until != null) out.music = { ...(out.music || sb.music), until: r3(f(sb.music.until)) };
  if (sb.creative && Array.isArray(sb.creative.length)) out.creative = { ...sb.creative, length: sb.creative.length.map((x) => r3(x + len)) };
  if (typeof sb.cover === "number") out.cover = r3(f(sb.cover));
  else if (sb.cover && typeof sb.cover.at === "number") out.cover = { ...sb.cover, at: r3(f(sb.cover.at)) };
  return out;
}
