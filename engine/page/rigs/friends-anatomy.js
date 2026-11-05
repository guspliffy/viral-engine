// The friends rig's anatomy in numbers (no THREE, no browser): read by the page rig (friends.js) and by the node
// tools that predict where hands and eyes are without drawing (engine/direct.mjs camera framing, qa/motion.mjs hand
// jumps, timeline.js foot homes). One place, so the drawn rig and the checks agree.
//
// Conventions (reference pack CHARACTER-SPEC.json "coordinates"): metres, +y up, +z the character's front, its
// anatomical right at -x (as potato.js: the right hand is at -x). The root sits on the floor between the soles.
//
// def.body for a friend is the POSE FRAME the shared timeline already speaks, not anatomy: body.height = the top of the
// character (ears or hair) above the potato leg line (LEG_H 0.14), body.width = its widest part. That keeps the
// storyboard hand poses aimed at the world ({ x: [x, k, z] }: y = LEG_H + body.height * k, timeline.js resolveArms)
// exact for any height, and the old "top of the body" meaning for framing. Everything anatomical (joints, limb
// lengths, eye line) is in def.anatomy.
export const LEG_H = 0.14;
export const isFriend = (def) => def?.rig === "friends-v1";

// where each named arm pose puts the hand, from the character's own shoulders and reach (potato.js handTarget has the
// potato's table: its hands come out of the middle of an egg). sx -1 right arm, +1 left. Returns root-space [x, y, z].
export function friendNamed(A, pose, sx, t) {
  const [shx, shy, shz] = A.shoulder, R = A.arm[0] + A.arm[1], tw = A.torso.w / 2, td = A.torso.d / 2, hip = A.hip[1];
  const head = A.eyeY, hw = A.headW / 2;
  switch (pose) {
    case "up":    return [sx * (hw + 0.05), shy + 0.9 * R, 0.02];   // beside the head, not into it (the friends' heads are wide)
    case "wave":  return [sx * (shx + 0.16 * R + 0.06 * Math.sin(t * 6.283 * 2.4)), shy + 0.72 * R, 0.08];
    case "point": return [sx * (shx + 0.28 * R), shy + 0.04, shz + 0.82 * R];
    case "shrug": return [sx * (shx + 0.5 * R), shy - 0.42 * R, shz + 0.3 * R];
    case "hips":  return [sx * (tw + 0.035), hip + 0.12, -0.01];
    case "cast":  return [sx * (shx + 0.08), shy + 0.25 * R, shz + 0.75 * R];
    case "hold":  return [sx * Math.max(0.09, tw * 0.62), shy - 0.5 * R, td + 0.1];
    case "hat":   return [sx * hw * 0.55, A.crown + 0.02, 0.06];
    case "fist":  return [sx * (shx * 0.8), shy - 0.08, shz + 0.62 * R];
    case "lap":   return [sx * tw * 0.55, hip + 0.05, td + 0.1];
    case "table": return [sx * shx * 0.75, shy - 0.35 * R, td + 0.32 * R];
    case "cheeks": return [sx * hw * 0.62, head - 0.06, A.faceZ * 0.8];
    default:      return [sx * Math.max(shx + 0.07, tw + 0.075), shy - 0.82 * R, shz + 0.04];   // rest: hanging just clear of the body (a relaxed A)
  }
}
// the hand target for an arm pose (the same forms as potato.js handTarget: a blend { mix }, { o }, { x }, a name), in
// the root's space before the body's squash. H, rx: the pose frame (def.body.height, def.body.width / 2)
export function friendTarget(A, pose, sx, rx, H, t, lerp) {
  if (pose && pose.mix) { const m = pose.mix, a = friendTarget(A, m.from, sx, rx, H, t, lerp), b = friendTarget(A, m.pose, sx, rx, H, t, lerp); return lerp(a, b, m.p, sx); }
  if (pose && typeof pose === "object") return pose.x ? [pose.x[0], LEG_H + H * pose.x[1], pose.x[2]] : [sx * (rx + pose.o[0]), LEG_H + H * pose.o[1], pose.o[2]];
  return friendNamed(A, pose, sx, t);
}
// handTarget(pose, sx, rx, H, t) for any character: the friend table for friends, potato.js's otherwise. `potato` is
// potato.js's handTarget, `lerp` its arcLerp (passed in so this file stays free of THREE)
export function handTargetFor(def, potato, lerp) {
  if (!isFriend(def)) return potato;
  const A = def.anatomy, lin = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
  return (pose, sx, rx, H, t) => friendTarget(A, pose, sx, rx, H, t, lerp || lin);
}
// the eyes' height as a share of the pose frame (engine/direct.mjs EYE_K: 0.56 on a potato)
export const eyeK = (def) => (isFriend(def) ? (def.anatomy.eyeY - LEG_H) / def.body.height : null);
// half the distance between the feet's homes (timeline.js GAIT.hx: 0.13 on a potato)
export const stanceX = (def) => (isFriend(def) ? def.anatomy.stance : null);
