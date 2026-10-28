// Vehicles: a rig is a moving frame that characters and props ride in (sb.rigs). A cast entry or a prop with
// "rig": "<id>" is placed in the rig's own frame (x right, y up, z its front, metres from the ground under its middle)
// and moves, banks and rolls with it: stage.js parents them to the rig, so grips, held props, contact and face checks
// all work as usual. A shot with "rig": "<id>" is a camera fixed to the rig (pos and look in its frame; the horizon
// turns behind it). The road under a vehicle is a treadmill: the set scrolls past (set-road.js) while the rig stays
// near the origin, so a clip loops by scrolling a whole number of road patterns.
//   sb.rigs[]: { id, kind: "roadster", color, pivot: [x, y, z] (what it rolls and turns about),
//                keys: [{ at, pos: [x, y, z], roll, pitch, yaw, steer }, ...] (degrees; roll + lifts its left side,
//                its own +x), wheel: 0.358 (tyre radius) }
// Everything here is plain math (no three.js), so qa tools and generators can use the same numbers in node.

const D2R = Math.PI / 180;
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// the road's speed (set.speed: metres per second, or [[t, v], ...] blended smoothly between keys) and the distance it
// has scrolled by t, summed in fixed steps from 0 and cached, so a frame is the same in a still or a full render
const DIST = new WeakMap(), STEP = 1 / 240;
export function roadSpeed(set, t) {
  const S = set?.speed ?? 0;
  if (typeof S === "number") return S;
  if (t <= S[0][0]) return S[0][1];
  for (let i = 1; i < S.length; i++) if (t <= S[i][0]) { const [t0, v0] = S[i - 1], [t1, v1] = S[i]; return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0)); }
  return S[S.length - 1][1];
}
export function roadDistance(set, t) {
  const S = set?.speed ?? 0;
  if (typeof S === "number") return S * t;
  let c = DIST.get(S); if (!c) { c = [0]; DIST.set(S, c); }
  const k = Math.max(0, Math.floor(t / STEP));
  for (let i = c.length; i <= k; i++) c.push(c[i - 1] + 0.5 * (roadSpeed(set, (i - 1) * STEP) + roadSpeed(set, i * STEP)) * STEP);
  const r = t - k * STEP;
  return c[k] + 0.5 * (roadSpeed(set, k * STEP) + roadSpeed(set, t)) * r;
}

// the raised lane divider (set.divider: { x, width, height, length, bevel, hit: [t, z] }): its near end, the bevelled
// one the car runs onto, is at z = hit[1] at time hit[0] and scrolls with the road. Returns its near end's z.
export function dividerZ(set, t) {
  const d = set?.divider; if (!d) return null;
  const [th, zh] = d.hit;
  return zh - (roadDistance(set, t) - roadDistance(set, th));
}
// the ground's height at (x, z) at time t: the road (0), or on the divider (its bevel ramps up from its near end)
export function groundAt(set, t, x, z) {
  const d = set?.divider; if (!d) return 0;
  const z0 = dividerZ(set, t), w = (d.width ?? 0.5) / 2, b = d.bevel ?? 0.5, h = d.height ?? 0.18, L = d.length ?? 4;
  if (Math.abs(x - d.x) > w || z < z0 || z > z0 + L) return 0;
  const u = Math.min(z - z0, z0 + L - z);   // bevelled at both ends
  return h * Math.min(1, u / b);
}

// the rig's pose at t: keys blended with a cubic Hermite curve (Catmull-Rom tangents in time), like a camera path
function hermite(K, t, f) {
  if (t <= K[0].at) return f(K[0]);
  if (t >= K[K.length - 1].at) return f(K[K.length - 1]);
  let i = 0; while (K[i + 1].at < t) i++;
  const a = K[i], b = K[i + 1], h = b.at - a.at, u = (t - a.at) / h;
  const tan = (j) => { if (j === 0 || j === K.length - 1) return 0; return (f(K[j + 1]) - f(K[j - 1])) / (K[j + 1].at - K[j - 1].at); };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return h00 * f(a) + h10 * h * tan(i) + h01 * f(b) + h11 * h * tan(i + 1);
}
const SORTED = new WeakMap();
export function rigState(rig, t) {
  let K = SORTED.get(rig); if (!K) { K = [...(rig.keys || [{ at: 0 }])].sort((a, b) => a.at - b.at); SORTED.set(rig, K); }
  const ch = (name, i) => hermite(K, t, (k) => (i == null ? k[name] ?? 0 : (k[name] || [0, 0, 0])[i]));
  return { pos: [0, 1, 2].map((i) => ch("pos", i)), roll: ch("roll"), pitch: ch("pitch"), yaw: ch("yaw"), steer: ch("steer") };
}

// rotation of the rig (yaw about y, then pitch about its own x, then roll about its own z: Euler YXZ, like the
// characters) as a 3x3 row-major matrix
export function rigRotation(s) {
  const [y, p, r] = [s.yaw * D2R, s.pitch * D2R, s.roll * D2R];
  const cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p), cr = Math.cos(r), sr = Math.sin(r);
  // Ry * Rx * Rz
  return [
    [cy * cr + sy * sp * sr, -cy * sr + sy * sp * cr, sy * cp],
    [cp * sr, cp * cr, -sp],
    [-sy * cr + cy * sp * sr, sy * sr + cy * sp * cr, cy * cp],
  ];
}
// where the rig's frame sits in the world: its origin, so that it turns about `pivot` (in its own frame) placed at
// pivot + pos
export function rigOrigin(rig, s, R = rigRotation(s)) {
  const p = rig.pivot || [0, 0.55, 0];
  return [0, 1, 2].map((i) => s.pos[i] + p[i] - (R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2]));
}
// a point in the rig's frame, in the world at time t
export function rigToWorld(rig, t, q) {
  const s = rigState(rig, t), R = rigRotation(s), o = rigOrigin(rig, s, R);
  return [0, 1, 2].map((i) => o[i] + R[i][0] * q[0] + R[i][1] * q[1] + R[i][2] * q[2]);
}

// the roadster's wheels in its own frame: [x, z] of each hub, and the suspension's travel (metres up and down)
export const ROADSTER = { track: 0.95, front: 1.25, rear: -1.2, rideY: 0.358, travel: 0.12, width: 0.26 };
// how far each wheel is pushed up into its arch (+) or hangs down (-) at time t: on the ground the tyre sits on the
// road or the divider, in the air it hangs at full droop; tipped past ~45 degrees it just hangs
export function wheelTravel(rig, set, t) {
  const s = rigState(rig, t), R = rigRotation(s), o = rigOrigin(rig, s, R), r = rig.wheel ?? ROADSTER.rideY, T = ROADSTER.travel;
  const up = R[1][1];   // the rig's own up, as seen by the world's up
  return [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const q = [sx * ROADSTER.track, r, sz > 0 ? ROADSTER.front : ROADSTER.rear];
    const w = [0, 1, 2].map((i) => o[i] + R[i][0] * q[0] + R[i][1] * q[1] + R[i][2] * q[2]);
    if (up < 0.7) return -T;
    const need = (groundAt(set, t, w[0], w[2]) + r - w[1]) / up;
    return Math.max(-T, Math.min(T, need));
  });
}
// the same, unclamped: how far a tyre would have to go into the road (> travel) or how far above it hangs; for checks
export function wheelNeed(rig, set, t) {
  const s = rigState(rig, t), R = rigRotation(s), o = rigOrigin(rig, s, R), r = rig.wheel ?? ROADSTER.rideY;
  return [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const q = [sx * ROADSTER.track, r, sz > 0 ? ROADSTER.front : ROADSTER.rear];
    const w = [0, 1, 2].map((i) => o[i] + R[i][0] * q[0] + R[i][1] * q[1] + R[i][2] * q[2]);
    return (groundAt(set, t, w[0], w[2]) + r - w[1]) / Math.max(0.05, R[1][1]);
  });
}
