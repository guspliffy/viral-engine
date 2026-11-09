// Hit-stops, freeze frames and speed ramps: the story's clock and the video's clock part ways for a while.
//
//   "hitStop": [{ "at": 1.2, "frames": 3 }]                       the whole picture holds for a few frames on an impact
//                                                                (acting.mjs impact() adds one)
//   { "fx": "freeze", "at": 2.4, "hold": 1.2, ... }               a freeze frame: the picture stops for `hold` seconds
//                                                                of video (engine/page/freeze.js draws its look and label)
//   { "fx": "ramp", "at": 3.0, "len": 0.8, "rate": 0.3,           a speed ramp: the story from `at` to `at + len` plays
//     "in": 0.25, "out": 0.25 }                                  slowed to `rate` (0.3 = a third of real speed; over 1
//                                                                speeds it up), easing from full speed into it over `in`
//                                                                seconds of video and back out over `out`
//
// The storyboard keeps its own clock (story time, what every action, effect, caption and shot is written in), and the
// video runs longer by the held and slowed frames (render time). Shared by Node (load.mjs, render.mjs, audio) and the
// page (stage.js), so the picture and the sound agree on every moment:
//
//   picture: the frame at render time t shows story time storyTime(t) (frozen at `at` for a hold, slowed in a ramp)
//   sound:   an event at story time s plays at render time renderTime(s); one exactly on `at` (the hit) plays on the
//            impact, everything after it plays the hold's length later, so it stays on its picture; a sound inside a
//            ramp lands where its picture is (it is not slowed down itself)
//
// A segment is { at, dur } (a hold: story time stands at `at` for `dur` seconds of video) or { at, len, dur, rate,
// in, out } (a ramp: `len` seconds of story take `dur` seconds of video). Pure and deterministic: no state between
// frames, so shards and stills agree.

const R6 = (x) => Math.round(x * 1e6) / 1e6;

// a ramp's speed curve as a segment: full speed eases (smoothstep) down to `rate` over `in` seconds of video, holds,
// and eases back over `out`. The video length is a whole number of frames: the slow middle's rate is evened out to
// fit, so the ramp still covers exactly `len` of story.
function rampOf(f, fps) {
  const at = Math.round(f.at * fps) / fps, len = f.len ?? 1, want = f.rate ?? 0.35;
  if (!(len > 0) || !(want > 0)) throw new Error(`ramp at ${f.at} s needs len > 0 and rate > 0`);
  let tin = Math.max(0, f.in ?? 0.25), tout = Math.max(0, f.out ?? 0.25);
  // the eases alone cover (in + out) (1 + rate) / 2 of story: a short ramp gets shorter eases
  const ease = ((tin + tout) * (1 + want)) / 2;
  if (ease > len) { const k = len / ease; tin *= k; tout *= k; }
  const mid = (len - ((tin + tout) * (1 + want)) / 2) / want;
  const dur = Math.max(1, Math.round((tin + tout + mid) * fps)) / fps, m = Math.max(0, dur - tin - tout);
  // the rate that covers len exactly in that many frames: (in + out)(1 + r) / 2 + r m = len
  const rate = (len - (tin + tout) / 2) / ((tin + tout) / 2 + m);
  if (!(rate > 0)) throw new Error(`ramp at ${f.at} s: len ${len} s is too short for its eases (in ${f.in}, out ${f.out})`);
  return { at: R6(at), len: R6(len), dur: R6(dur), rate: R6(rate), in: R6(tin), out: R6(tout), ramp: true };
}

// story seconds a ramp has covered tau seconds of video into it (the integral of its speed curve)
const I = (u) => u * u * u - (u * u * u * u) / 2;   // the integral of smoothstep 3u² - 2u³ from 0 to u
function rampStory(h, tau) {
  const r = h.rate, a = h.in, b = h.out, m = h.dur - a - b;
  if (tau <= 0) return 0;
  if (tau < a) return tau + (r - 1) * a * I(tau / a);
  const A = (a * (1 + r)) / 2;
  if (tau < a + m) return A + r * (tau - a);
  const w = Math.min(b, tau - a - m);
  return A + r * m + r * w + (b > 0 ? (1 - r) * b * I(w / b) : 0);
}
// the inverse: how far into the ramp (video seconds) story second sigma is shown (the speed is never 0, so it is one
// to one; found by halving, deterministic)
function rampVideo(h, sigma) {
  let lo = 0, hi = h.dur;
  for (let i = 0; i < 48; i++) { const mid = (lo + hi) / 2; if (rampStory(h, mid) < sigma) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// sb.hitStop + freeze and ramp effects -> [{ at, dur, len? ... }] sorted, in story time (dur = video seconds)
export function holdsOf(sb) {
  const fps = sb.fps ?? 30;
  const out = (sb.hitStop || []).map((h) => ({ at: h.at, dur: R6((h.frames ?? 3) / fps) }));
  for (const f of sb.fx || []) {
    if (f.do === "freeze") out.push({ at: R6(Math.round(f.at * fps) / fps), dur: R6(Math.max(1, Math.round((f.hold ?? 1) * fps)) / fps), freeze: true });
    else if (f.do === "ramp") out.push(rampOf(f, fps));
  }
  return out.sort((a, b) => a.at - b.at);
}

// video seconds a segment adds to the clip (a ramp that speeds up takes some away)
const extra = (h) => h.dur - (h.len || 0);

export function storyTime(holds, t) {
  if (!holds || !holds.length) return t;
  let shift = 0;
  for (const h of holds) {
    const a = h.at + shift;   // the segment's start in render time
    if (t < a) break;
    if (t < a + h.dur) return h.len ? R6(h.at + rampStory(h, t - a)) : h.at;
    shift += extra(h);
  }
  return t - shift;
}

export function renderTime(holds, s) {
  if (!holds || !holds.length) return s;
  let shift = 0;
  for (const h of holds) {
    if (s > h.at + (h.len || 0) + 1e-9) { shift += extra(h); continue; }
    if (h.len && s > h.at + 1e-9) return R6(h.at + shift + rampVideo(h, s - h.at));   // inside a ramp
  }
  return s + shift;
}

export const heldFor = (holds) => (holds || []).reduce((s, h) => s + extra(h), 0);

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
    // `to` is a time only in a from/to span (a caption, a beat span). An action's `to` is where it goes (a move's
    // [x, z], a turn's yaw, a shot's camera): remapping it as a time made every move's target NaN on this clock, so a
    // clip with a hit-stop and planted feet got NaN footsteps, and one NaN gain silenced the effects and the music
    // (Never Has Money 04, 8 Nov)
    if (x.from != null && typeof x.to === "number") o.to = R(x.to);
    if (x.dur != null && at != null) o.dur = Math.round((R(at + x.dur) - R(at)) * 1e6) / 1e6;
    return o;
  };
  const out = { ...sb, holds: undefined, heldFrom: holds };
  for (const k of ["actions", "fx", "sfx", "captions", "shots", "beatSpans"]) if (Array.isArray(sb[k])) out[k] = sb[k].map(span);
  return out;
}
