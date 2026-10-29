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
