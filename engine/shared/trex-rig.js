// The T-rex's skeleton (Never Looks Up ep 1, 4 Nov 2026), shared by the prop that draws it (engine/page/props-dino.js)
// and the generator that aims it (storyboards/series/never-looks-up/): one set of joint places and one forward
// kinematics, so "put the snout 20 cm from the phone" in the generator is where the drawing puts it.
//
// Units are metres in the T-rex's own frame at scale 1: origin on the ground between its feet, facing +z.
// Joints, each turned by prop-state numbers in degrees (all 0 = the rest pose: standing, head forward):
//   hip    the body's pivot over the feet; lean (+ tips the body forward and down)
//   neck   at the front top of the chest; neckY (+ turns the head to the T-rex's left, +x), neckP (+ bends down)
//   head   at the end of the neck; headY, headP (+ nods down), headR (+ tilts the top toward +x)
// Places in the head's frame: the snout tip, the eyes, the nostrils (the sniff), the jaw hinge.
export const TREX = {
  hip: [0, 1.75, 0],
  neck: [0, 0.9, 0.9],            // from the hip
  head: [0, 0.55, 0.42],          // from the neck pivot (the neck's length)
  headScale: 1.45,                // the head is drawn this much bigger than the numbers below (a cartoon head)
  snout: [0, 0.02, 1.18],         // from the head pivot, before headScale: the tip of the upper jaw
  nose: [0, 0.16, 1.1],           // between the nostrils
  eye: [0.27, 0.36, 0.62],        // the left eye's centre (mirror x for the right)
  eyeR: 0.13,
  jaw: [0, -0.1, 0.18],           // the lower jaw's hinge
  tailBase: [0, 0.28, -0.95],     // from the hip
  tailLen: 3.6, tailSegs: 14,
};

const rad = (d) => (d * Math.PI) / 180;
// 3x3 rotation matrices as row arrays; Y then X then Z, like three.js "YXZ"
function rotYXZ(y, x, z) {
  const cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x), cz = Math.cos(z), sz = Math.sin(z);
  // R = Ry * Rx * Rz
  return [
    [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx],
    [cx * sz, cx * cz, -sx],
    [-sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx],
  ];
}
const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const app = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const add = (a, b) => a.map((v, i) => v + b[i]);

// the angles the drawing uses for the joints, from the prop state (pitch + = down, so the x rotation is +)
export function trexAngles(ps) {
  return {
    hip: [0, rad(ps.lean ?? 0), 0],
    neck: [rad(ps.neckY ?? 0), rad(ps.neckP ?? 0), 0],
    head: [rad(ps.headY ?? 0), rad(ps.headP ?? 0), rad(-(ps.headR ?? 0))],
  };
}

// world positions of the head's points for a prop state (x, y, z, rot, scale + the joint numbers)
export function trexPoints(ps) {
  const A = trexAngles(ps), s = ps.scale ?? 1;
  const R0 = rotYXZ(rad(ps.rot ?? 0), 0, 0);
  const Rh = mul(R0, rotYXZ(...A.hip));
  const Rn = mul(Rh, rotYXZ(...A.neck));
  const Rd = mul(Rn, rotYXZ(...A.head));
  const o = [ps.x ?? 0, ps.y ?? 0, ps.z ?? 0];
  const sc = (v) => v.map((k) => k * s);
  const hip = add(o, app(R0, sc(TREX.hip)));
  const neck = add(hip, app(Rh, sc(TREX.neck)));
  const head = add(neck, app(Rn, sc(TREX.head)));
  const at = (p) => add(head, app(Rd, sc(p.map((k) => k * TREX.headScale))));
  return {
    hip, neck, head, snout: at(TREX.snout), nose: at(TREX.nose),
    eyeL: at(TREX.eye), eyeR: at([-TREX.eye[0], TREX.eye[1], TREX.eye[2]]),
    // the direction the snout points (unit, world)
    forward: app(Rd, [0, 0, 1]),
  };
}
