// Hit-stops: the whole picture freezes for a few frames on an impact, then the clip carries on where it stopped
// ("hitStop": [{ "at": 1.2, "frames": 3 }] in the storyboard; acting.mjs impact() adds one). A hold inserts time: the
// storyboard keeps its own clock (story time, what every action, effect, caption and shot is written in), and the
// video runs longer by the held frames (render time). Shared by Node (load.mjs, render.mjs, audio) and the page
// (stage.js), so the picture and the sound agree on every moment:
//
//   picture: the frame at render time t shows story time storyTime(t) (frozen at `at` for the hold)
//   sound:   an event at story time s plays at render time renderTime(s); one exactly on `at` (the hit) plays on the
//            impact, everything after it plays the hold's length later, so it stays on its picture
//
// Pure and deterministic: no state between frames, so shards and stills agree.

// sb.hitStop -> [{ at, dur }] sorted, in story time (dur = frames / fps)
export function holdsOf(sb) {
  const fps = sb.fps ?? 30;
  return (sb.hitStop || []).map((h) => ({ at: h.at, dur: Math.round(((h.frames ?? 3) / fps) * 1e6) / 1e6 })).sort((a, b) => a.at - b.at);
}

export function storyTime(holds, t) {
  if (!holds || !holds.length) return t;
  let shift = 0;
  for (const h of holds) {
    const a = h.at + shift;   // the hold's start in render time
    if (t < a) break;
    if (t < a + h.dur) return h.at;
    shift += h.dur;
  }
  return t - shift;
}

export function renderTime(holds, s) {
  if (!holds || !holds.length) return s;
  let shift = 0;
  for (const h of holds) if (s > h.at + 1e-9) shift += h.dur;
  return s + shift;
}

export const heldFor = (holds) => (holds || []).reduce((s, h) => s + h.dur, 0);

// the storyboard on the sound's clock: every time moved to render time (an action that runs through a hold lasts the
// hold longer), and no holds left, so mapping twice changes nothing. engine/audio.mjs and engine/music.mjs start
// with it, so every sound (code effects, foley from actions, voices, the music's lock to the payoff) lands on its
// picture.
export function soundClock(sb) {
  const holds = sb && sb.holds;
  if (!holds || !holds.length) return sb;
  const R = (s) => Math.round(renderTime(holds, s) * 1e6) / 1e6;
  const span = (x) => {
    const at = x.at ?? x.from, o = { ...x };
    if (x.at != null) o.at = R(x.at);
    if (x.from != null) o.from = R(x.from);
    if (x.to != null) o.to = R(x.to);
    if (x.dur != null && at != null) o.dur = Math.round((R(at + x.dur) - R(at)) * 1e6) / 1e6;
    return o;
  };
  const out = { ...sb, holds: undefined, heldFrom: holds };
  for (const k of ["actions", "fx", "sfx", "captions", "shots", "beatSpans"]) if (Array.isArray(sb[k])) out[k] = sb[k].map(span);
  return out;
}
