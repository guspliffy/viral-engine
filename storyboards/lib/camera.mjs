// A hand-set shot for a clip whose brief fixes its framing (the directed camera, engine/direct.mjs, picks shots from
// beat kinds; this is for the rest). Same maths the Charger and DUO generators wrote out by hand.
//
//   aim(target, { az, el, h, fov, push, dur })
// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and
// elevation el, far enough that the frame is h metres tall at the target with lens fov; push 0..1 moves it that much
// of the way in over dur seconds (a slow push), `to` another target for a slow pan as it pushes
import { r3 } from "./clip.mjs";

export function aim(target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0, to = null } = {}) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  const t2 = to || target;
  return { pos, look: target.map(r3), fov,
    ...((push || to) && { to: { pos: t2.map((v, i) => r3(v + dir[i] * d * (1 - push))), ...(to && { look: t2.map(r3) }) }, dur }) };
}

// ---------------------------------------------------------------- time and lens moves (docs/CAMERA-MOVES.md)
// c is the clip builder (clip.mjs); each helper adds a beat item, so the move is written in story time like the rest.
//
//   freeze(c, t, hold, { on, label, sub, who, push, tone, flash, scratch })
// a freeze frame: the picture stops at t for `hold` seconds of video (engine/shared/holds.js), pushes in slowly on
// `on` (a cast id) in a drained, warm tone (engine/page/freeze.js), with an optional name tag (label + sub, in who's
// colour). scratch: true adds the record scratch (whitelisted "recordscratch") on its first frame.
export function freeze(c, t, hold = 1.2, o = {}) {
  const { label, sub, who, side, y, scratch, ...rest } = o;
  c.at(t, { fx: "freeze", hold, ...rest, ...(label && { label: { title: label, ...(sub && { sub }), ...(who && { who }), ...(side && { side }), ...(y != null && { y }) } }) });
  if (scratch) c.sfx(t, "recordscratch", { gain: typeof scratch === "number" ? scratch : 0.5 });
}
//   ramp(c, t, len, rate, { in, out })
// a speed ramp: the story from t to t + len plays at `rate` (0.3 = a third of real speed; 2 = twice as fast), easing
// in from full speed over `in` seconds of video and back out over `out` (0.25 each by default). Keep spoken lines out
// of a slow ramp (the voice is not slowed; load.mjs warns).
export function ramp(c, t, len, rate = 0.35, o = {}) { c.at(t, { fx: "ramp", len, rate, ...o }); }
//   dolly(shot, { fov, k, dur, delay, ease, on })
// a dolly zoom on a hand-set shot ({ pos, look, fov }): over dur the lens goes to `fov` (or k times the shot's fov) while
// the camera slides so the picture height at `on` (default the look point) never changes. k < 1: the camera pulls back
// and the background closes in on the subject; k > 1: it pushes in and the background falls away. In a directed clip
// write the beat's shot as { size: "close", who, dolly: { k: 0.5 } }, or give the beat kind "realize".
export function dolly(shot, { fov, k = 0.5, dur = 1.1, delay, ease, on } = {}) {
  return { ...shot, dolly: { fov: r3(fov ?? (shot.fov ?? 32) * k), dur, ...(delay != null && { delay }), ...(ease && { ease }), ...(on && { on: on.map(r3) }) } };
}
