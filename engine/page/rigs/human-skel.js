// The human rig's skeleton (rig "human-v1"): the CMU motion-capture skeleton's bones, rest directions and lengths
// (subject 143, a person about 1.6 m tall), so a recorded turn plays on it unchanged, plus finger chains the database
// doesn't record. Rest pose = the database's T pose: facing +z, left = +x, arms out along ±x with the palms down,
// legs 20° apart. Every bone's rest turn is identity: a bone's world turn in a pose IS the turn away from the T pose.
// Pure maths, no three.js (the node tools build the body with it, the page poses it).

// name: [parent, direction (unit), length m]
export const BONES = {
  root: [null, [0, 0, 0], 0],
  lhipjoint: ["root", [0.69, -0.6, 0.4], 0.134], lfemur: ["lhipjoint", [0.342, -0.94, 0], 0.349], ltibia: ["lfemur", [0.342, -0.94, 0], 0.39],
  lfoot: ["ltibia", [0.1, -0.27, 0.96], 0.102], ltoes: ["lfoot", [0, 0, 1], 0.051],
  rhipjoint: ["root", [-0.64, -0.64, 0.42], 0.126], rfemur: ["rhipjoint", [-0.342, -0.94, 0], 0.347], rtibia: ["rfemur", [-0.342, -0.94, 0], 0.388],
  rfoot: ["rtibia", [-0.12, -0.33, 0.94], 0.109], rtoes: ["rfoot", [0, 0, 1], 0.054],
  lowerback: ["root", [0.03, 0.97, -0.25], 0.113], upperback: ["lowerback", [-0.02, 1, -0.03], 0.115], thorax: ["upperback", [-0.03, 1, 0.08], 0.122],
  lowerneck: ["thorax", [0.03, 0.98, 0.19], 0.081], upperneck: ["lowerneck", [-0.09, 0.99, 0.04], 0.082], head: ["upperneck", [-0.03, 1, 0], 0.082],
  lclavicle: ["thorax", [0.82, 0.56, -0.13], 0.15], lhumerus: ["lclavicle", [1, 0, 0], 0.285], lradius: ["lhumerus", [1, 0, 0], 0.191],
  lwrist: ["lradius", [1, 0, 0], 0.096], lhand: ["lwrist", [1, 0, 0], 0.032], lfingers: ["lhand", [1, 0, 0], 0.026], lthumb: ["lwrist", [0.71, 0, 0.71], 0.037],
  rclavicle: ["thorax", [-0.75, 0.63, -0.17], 0.154], rhumerus: ["rclavicle", [-1, 0, 0], 0.286], rradius: ["rhumerus", [-1, 0, 0], 0.178],
  rwrist: ["rradius", [-1, 0, 0], 0.089], rhand: ["rwrist", [-1, 0, 0], 0.041], rfingers: ["rhand", [-1, 0, 0], 0.033], rthumb: ["rwrist", [-0.71, 0, 0.71], 0.047],
};
// the database's spine and neck directions lean (a person's S curve); normalise every direction once
for (const b of Object.values(BONES)) { const [x, y, z] = b[1], l = Math.hypot(x, y, z) || 1; b[1] = [x / l, y / l, z / l]; }

// Our own hand on the database's coarse one: the palm grows from the wrist (the end of "lwrist") along the arm, four
// fingers of three bones each from the palm's far edge, the thumb's three bones from the palm's root, toward the
// front. Lengths for a slim adult hand (palm 8.6 cm, middle finger 8.4 cm). All children of "lhand"/"rhand" (the
// wrist's bend), so the database's own lhand turn bends the whole hand.
export const PALM = 0.086;
const FINGERS = { index: [0.026, 0.92, 0.36], middle: [0.008, 1.0, 0.4], ring: [-0.01, 0.95, 0.38], pinky: [-0.027, 0.76, 0.33] };   // across, length k, base k
export const FINGER_NAMES = Object.keys(FINGERS);
export function handBones() {
  const out = {};
  for (const s of ["l", "r"]) {
    const sx = s === "l" ? 1 : -1;
    for (const [f, [z, k]] of Object.entries(FINGERS)) {
      const L = 0.084 * k, seg = [0.45, 0.31, 0.24].map((v) => v * L);
      out[`${s}${f}1`] = [`${s}hand`, [sx, 0, 0], seg[0], [sx * PALM, -0.002, z]];   // parent, dir, len, start in parent's space
      out[`${s}${f}2`] = [`${s}${f}1`, [sx, 0, 0], seg[1]];
      out[`${s}${f}3`] = [`${s}${f}2`, [sx, 0, 0], seg[2]];
    }
    const td = [sx * 0.55, -0.32, 0.77], tl = Math.hypot(...td), tdir = td.map((v) => v / tl);
    out[`${s}thumb1`] = [`${s}hand`, tdir, 0.046, [sx * 0.012, -0.006, 0.022]];
    out[`${s}thumb2`] = [`${s}thumb1`, tdir, 0.032];
    out[`${s}thumb3`] = [`${s}thumb2`, tdir, 0.026];
  }
  return out;
}
export const HAND_BONES = handBones();

// every bone with its parent, its start in the parent's space (rest), its direction and length
export function skeleton() {
  const list = [];
  for (const [n, [p, dir, len]] of Object.entries(BONES)) list.push({ name: n, parent: p, dir, len, start: p ? BONES[p][1].map((v) => v * BONES[p][2]) : [0, 0, 0] });
  for (const [n, [p, dir, len, st]] of Object.entries(HAND_BONES)) list.push({ name: n, parent: p, dir, len, start: st || (() => { const P = HAND_BONES[p]; return P[1].map((v) => v * P[2]); })() });
  return list;
}

// 3x3 row-major helpers
export const mat = {
  mul: (a, b) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; },
  app: (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]],
  I: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  axis: (ax, a) => { const [x, y, z] = ax, c = Math.cos(a), s = Math.sin(a), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; },
};
// The BIND pose the body is modelled and skinned in: arms lowered 55 degrees and a little forward with soft elbows
// (an A pose). A body skinned in the T pose balloons at the shoulders when the arms come down; skinned halfway, both
// arms up and arms down bend half as far. Local turns, as axis-angle (radians).
export const BIND = {
  lhumerus: [[0, 0, 1], -0.96], rhumerus: [[0, 0, 1], 0.96],
  lradius: [[0, 1, 0], -0.22], rradius: [[0, 1, 0], 0.22],
};
// a pose: every bone's start, end and world turn in the root's space (root at the origin); local: { bone: 3x3 }
export function restPose(local = null) {
  const L = local || Object.fromEntries(Object.entries(BIND).map(([k, [ax, a]]) => [k, mat.axis(ax, a)]));
  const sk = skeleton(), at = {}, out = {};
  for (const b of sk) {
    const P = b.parent ? out[b.parent] : null;
    const W = P ? mat.mul(P.W, L[b.name] || mat.I) : (L[b.name] || mat.I);
    const s = P ? mat.app(P.W, b.start).map((v, i) => v + P.start[i]) : [0, 0, 0];
    const e = s.map((v, i) => v + mat.app(W, b.dir)[i] * b.len);
    out[b.name] = { start: s, end: e, dir: b.dir, len: b.len, parent: b.parent, W };
  }
  return out;
}
// the T pose (every turn identity)
export const tPose = () => restPose({});
