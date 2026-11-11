// Sprout Man's skeleton (Doomscroll to survive pilot, 11 Nov 2026), shared by the prop that draws him
// (engine/page/props-sprout.js) and the generators that aim his arms (storyboards/series/doomscroll/).
//
// Units are metres in his own frame at scale 1: origin on the ground between his feet, facing +z, +x = his left.
// At scale 1 he stands about 2.9 m tall (three potatoes); the giant is the same prop at a large scale.
export const SPROUT = {
  hipY: 1.28,                 // the hip's height when he stands
  leg: 0.66,                  // thigh = shin
  torso: 0.98,                // hip to the neck pivot, along the leaning torso
  shoulder: [0.2, 0.86, 0.0], // the left arm's root in the torso frame (mirror x for the right)
  back: [0.0, 0.7, -0.1],     // where the thin back sprouts grow from, in the torso frame
  headUp: 0.3,                // neck pivot to the head's centre
  head: [0.22, 0.3, 0.23],    // the head's half sizes
  rest: [0.36, 0.05, 0.05],   // the left hand's rest place (hanging to the ground), in his frame
};

// the state keys the prop reads (all plain numbers so `prop` tweens them); engine/page/props3d.js adds them to a
// prop's state with these defaults
export const SPROUT_STATE = {
  hipY: SPROUT.hipY, hipZ: 0, sit: 0, cross: 0,
  aLx: 0, aLy: 0, aLz: 0, aLk: 0, aRx: 0, aRy: 0, aRz: 0, aRk: 0,     // arm targets in his frame; k 0 = hanging, 1 = at the target
  fanL: 0.35, fanR: 0.35, wig: 0,                                     // fingers: 0 = one pointing tip, 1 = spread; wig = wiggle
  tAx: 0, tAy: 0, tAz: 0, tAk: 0, tBx: 0, tBy: 0, tBz: 0, tBk: 0,     // two back sprouts that reach and coil round a target
  puppy: 0, flash: 0, eyes: 0,
};

const rad = (d) => (d * Math.PI) / 180;

// a point given in the world -> his own frame (what aLx.. and tAx.. take). base: { x, y, z, rot, scale }
export function toSprout(base, world) {
  const s = base.scale ?? 1, a = rad(base.rot ?? 0);
  const dx = world[0] - (base.x ?? 0), dy = world[1] - (base.y ?? 0), dz = world[2] - (base.z ?? 0);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  return [r3((dx * Math.cos(a) - dz * Math.sin(a)) / s), r3(dy / s), r3((dx * Math.sin(a) + dz * Math.cos(a)) / s)];
}

// his head's centre in the world for a pose { x, y, z, rot, scale, hipY, hipZ, lean, twist } (lean = degrees forward)
export function sproutHead(base) {
  const s = base.scale ?? 1, a = rad(base.rot ?? 0), le = rad(base.lean ?? 0), tw = rad(base.twist ?? 0);
  const up = SPROUT.torso + SPROUT.headUp;
  // torso frame: yaw twist, then pitch lean about x (forward = +z)
  let p = [0, up * Math.cos(le), up * Math.sin(le)];
  p = [p[0] * Math.cos(tw) + p[2] * Math.sin(tw), p[1], -p[0] * Math.sin(tw) + p[2] * Math.cos(tw)];
  p = [p[0], p[1] + (base.hipY ?? SPROUT.hipY), p[2] + (base.hipZ ?? 0)];
  return [(base.x ?? 0) + (p[0] * Math.cos(a) + p[2] * Math.sin(a)) * s, (base.y ?? 0) + p[1] * s, (base.z ?? 0) + (-p[0] * Math.sin(a) + p[2] * Math.cos(a)) * s];
}
