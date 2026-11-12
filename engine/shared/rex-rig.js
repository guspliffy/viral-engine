// The real-anatomy T. rex's skeleton (There's a catch EP05, 12 Nov 2026), shared by the prop that draws it
// (engine/page/props-rex.js, kind `rex`) and the generator that aims it: one set of joint places and one forward
// kinematics, so "put the snout 20 cm from the phone" in the generator is where the drawing puts it.
// Same shape as engine/shared/trex-rig.js (the old cartoon kind keeps that one): REX, rexAngles(ps), rexPoints(ps).
//
// Units are metres in the rex's own frame at scale 1: origin on the ground between its feet, facing +z.
// Joints, each turned by prop-state numbers in degrees (all 0 = the rest pose: standing, head forward):
//   hip    the body's pivot over the feet (1.9 m up); lean (+ tips the body forward and down, the tail up)
//   neck   at the front top of the chest; neckY (+ turns the head to the rex's left, +x), neckP (+ bends down)
//   head   at the end of the neck (the skull's back); headY, headP (+ nods down), headR (+ tilts the top toward +x)
// Places in the head's frame: the snout tip, the nose, the eyes, the jaw hinge. headScale is 1 (no cartoon head).
export const REX = {
  hip: [0, 1.9, 0],
  neck: [0, 0.18, 1.5],           // from the hip
  head: [0, 0.42, 0.62],          // from the neck pivot (the neck's length)
  headScale: 1,
  snout: [0, -0.02, 1.02],        // from the head pivot: the tip of the upper jaw
  nose: [0, 0.1, 0.95],           // between the nostrils
  eye: [0.2, 0.2, 0.16],          // the left eye's centre (mirror x for the right)
  eyeR: 0.06,
  jaw: [0, -0.1, -0.02],          // the lower jaw's hinge
  tailBase: [0, 0.05, -0.6],      // from the hip
  tailLen: 3.4,
  // legs, rest places in the prop frame for the left leg (mirror x for the right)
  socket: [0.36, 1.85, 0], knee: [0.42, 1.12, 0.42], ankle: [0.42, 0.52, -0.22], toe: [0.42, 0.10, 0.02],
  stride: 0.72,                   // metres (scale 1) a planted foot travels back per half cycle (spec.stride overrides)
  shoulder: [0.30, -0.30, 1.25],  // from the hip, the left arm (mirror x for the right)
};

const rad = (d) => (d * Math.PI) / 180;
// 3x3 rotation matrices as row arrays; Y then X then Z, like three.js "YXZ"
export function rotYXZ(y, x, z) {
  const cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x), cz = Math.cos(z), sz = Math.sin(z);
  return [
    [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx],
    [cx * sz, cx * cz, -sx],
    [-sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx],
  ];
}
export const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const app = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
export const add = (a, b) => a.map((v, i) => v + b[i]);

// the angles the drawing uses for the joints, from the prop state (pitch + = down, so the x rotation is +)
export function rexAngles(ps) {
  return {
    hip: [0, rad(ps.lean ?? 0), 0],
    neck: [rad(ps.neckY ?? 0), rad(ps.neckP ?? 0), 0],
    head: [rad(ps.headY ?? 0), rad(ps.headP ?? 0), rad(-(ps.headR ?? 0))],
  };
}

// the neck and head in the HIP frame (scale 1, no prop rotation): rotations and pivot places. The prop lofts the neck
// through these, rexPoints below puts them in the world.
export function rexLocal(ps) {
  const A = rexAngles(ps);
  const Rn = rotYXZ(...A.neck), Rd = mul(Rn, rotYXZ(...A.head));
  const neck = REX.neck.slice(), head = add(neck, app(Rn, REX.head));
  return { Rn, Rd, neck, head };
}

// world positions of the head's points for a prop state (x, y, z, rot, scale + the joint numbers)
export function rexPoints(ps) {
  const A = rexAngles(ps), s = ps.scale ?? 1;
  const R0 = rotYXZ(rad(ps.rot ?? 0), 0, 0);
  const Rh = mul(R0, rotYXZ(...A.hip));
  const Rn = mul(Rh, rotYXZ(...A.neck));
  const Rd = mul(Rn, rotYXZ(...A.head));
  const o = [ps.x ?? 0, ps.y ?? 0, ps.z ?? 0];
  const sc = (v) => v.map((k) => k * s);
  const hip = add(o, app(R0, sc(REX.hip)));
  const neck = add(hip, app(Rh, sc(REX.neck)));
  const head = add(neck, app(Rn, sc(REX.head)));
  const at = (p) => add(head, app(Rd, sc(p.map((k) => k * REX.headScale))));
  return {
    hip, neck, head, snout: at(REX.snout), nose: at(REX.nose),
    eyeL: at(REX.eye), eyeR: at([-REX.eye[0], REX.eye[1], REX.eye[2]]),
    // the direction the snout points (unit, world)
    forward: app(Rd, [0, 0, 1]),
  };
}
