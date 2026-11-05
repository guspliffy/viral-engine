// Geometry helpers for the friends rig (Rusty, Pip, Moss: engine/page/rigs/friends.js). Everything here is plain
// code that builds THREE.BufferGeometry once from numbers (no assets, no GPU features, no randomness at draw time):
//
//   blobMesh(field, opts)   a closed surface around a smooth union of ellipsoids / rounded boxes, made by pushing a
//                           sphere's vertices out from a centre to where the field crosses zero (the shapes here are
//                           all star-shaped from their centre), with vertex colours from a paint function. Used for
//                           heads (cranium + cheek ruffs + muzzle in ONE closed surface: no coplanar decals, no
//                           doubled outline across a muzzle), torsos, ears and feet.
//   rayHit(field, o, d)     where a ray from o (inside) leaves the surface: the face's place(u, v) for face.js
//   tubeMesh(pts, ...)      a tube along a polyline with rotation-minimising frames, per-vertex radius and colour,
//                           round closed ends: limbs, sleeves, the tail, hair locks.
//
// Distances are metres in the part's own frame (+y up, +z the front, anatomical right = -x).
import * as THREE from "three";

// ---------------------------------------------------------------------------------------------------- the fields
// signed distance (approximate, iq's ellipsoid bound) to an ellipsoid centred at c with radii r; rot: [rx, ry, rz]
// radians (Euler XYZ) turning the ellipsoid, applied as the inverse to the point
export function ellipsoid(c, r, rot = null) {
  const q = rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)).invert() : null, v = new THREE.Vector3();
  return (p) => {
    v.set(p.x - c[0], p.y - c[1], p.z - c[2]); if (q) v.applyQuaternion(q);
    const k0 = Math.hypot(v.x / r[0], v.y / r[1], v.z / r[2]), k1 = Math.hypot(v.x / (r[0] * r[0]), v.y / (r[1] * r[1]), v.z / (r[2] * r[2]));
    return k1 < 1e-9 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
  };
}
// a box with rounded edges: half sizes h, corner radius k (a capybara's blunt rectangular muzzle)
export function roundBox(c, h, k, rot = null) {
  const q = rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)).invert() : null, v = new THREE.Vector3();
  return (p) => {
    v.set(p.x - c[0], p.y - c[1], p.z - c[2]); if (q) v.applyQuaternion(q);
    const dx = Math.abs(v.x) - h[0] + k, dy = Math.abs(v.y) - h[1] + k, dz = Math.abs(v.z) - h[2] + k;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0) - k;
  };
}
// smooth minimum (polynomial, iq): blends two surfaces over about k metres instead of leaving a crease
export const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k)); return b + (a - b) * h - k * h * (1 - h); };
export const smax = (a, b, k) => -smin(-a, -b, k);
// union of parts [{ f, k }]: each part blended in with its own smoothness k
export function union(parts, k0 = 0.03) {
  return (p) => { let d = parts[0].f(p); for (let i = 1; i < parts.length; i++) d = smin(d, parts[i].f(p), parts[i].k ?? k0); return d; };
}

// ---------------------------------------------------------------------------------------------------- blob meshes
// the field's gradient (outward normal) at p, by central differences
export function gradient(field, p, e = 0.0015) {
  const a = new THREE.Vector3(), q = p.clone();
  q.x += e; a.x = field(q); q.x -= 2 * e; a.x -= field(q); q.x += e;
  q.y += e; a.y = field(q); q.y -= 2 * e; a.y -= field(q); q.y += e;
  q.z += e; a.z = field(q); q.z -= 2 * e; a.z -= field(q);
  return a.normalize();
}
// the first point along o + t d (t in 0..tMax, o inside the surface) where the field turns positive; null if none.
// Marches in steps a little smaller than the distance bound, then bisects.
export function rayHit(field, o, d, tMax = 1.5) {
  const p = new THREE.Vector3();
  let t = 0, prev = field(o);
  if (prev > 0) return null;
  for (let i = 0; i < 400 && t < tMax; i++) {
    const step = Math.max(0.002, Math.abs(prev) * 0.7), t1 = Math.min(tMax, t + step);
    const v = field(p.copy(o).addScaledVector(d, t1));
    if (v > 0) {
      let a = t, b = t1;
      for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (field(p.copy(o).addScaledVector(d, m)) > 0) b = m; else a = m; }
      return { t: b, pos: o.clone().addScaledVector(d, b) };
    }
    t = t1; prev = v;
  }
  return null;
}
// A closed surface around `field` (negative inside), from a sphere (wSeg x hSeg) whose vertices are pushed out from
// `center` to the surface. paint(p, n) -> THREE.Color (sRGB hex or Color) gives each vertex its colour. Normals from
// the field (smooth, so a muzzle blended into cheeks shades as one form). Returns a BufferGeometry with colours.
export function blobMesh(field, { center = [0, 0, 0], wSeg = 64, hSeg = 48, paint = null, tMax = 1.2 } = {}) {
  const g = new THREE.SphereGeometry(1, wSeg, hSeg), pos = g.attributes.position, o = new THREE.Vector3(...center), d = new THREE.Vector3();
  const col = new Float32Array(pos.count * 3), nrm = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const h = rayHit(field, o, d, tMax), p = h ? h.pos : o.clone().addScaledVector(d, 0.01);
    pos.setXYZ(i, p.x, p.y, p.z);
    const n = gradient(field, p); nrm[i * 3] = n.x; nrm[i * 3 + 1] = n.y; nrm[i * 3 + 2] = n.z;
    if (paint) { c.set(paint(p, n)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  }
  // the sphere's seam column repeats its first; weld normals there so no hard line shows
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  if (paint) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------------------------------- tubes
// rotation-minimising frames along a polyline (double reflection, Wang et al. 2008), the first normal chosen square to
// the first tangent and as close as possible to `ref`: the same input always gives the same frames, so a stripe or a
// patch painted at an angle round the tube stays on the same side of the limb
export function rmFrames(pts, ref = new THREE.Vector3(0, 0, 1)) {
  const n = pts.length, T = [], N = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const t = b.clone().sub(a); if (t.lengthSq() < 1e-12) t.copy(T[i - 1] || new THREE.Vector3(0, 1, 0)); T.push(t.normalize());
  }
  let r = ref.clone().addScaledVector(T[0], -ref.dot(T[0]));
  if (r.lengthSq() < 1e-8) { r = new THREE.Vector3(1, 0, 0).addScaledVector(T[0], -T[0].x); if (r.lengthSq() < 1e-8) r.set(0, 0, 1); }
  N.push(r.normalize()); B.push(new THREE.Vector3().crossVectors(T[0], N[0]));
  for (let i = 0; i < n - 1; i++) {
    const v1 = pts[i + 1].clone().sub(pts[i]), c1 = v1.dot(v1);
    if (c1 < 1e-14) { N.push(N[i].clone()); B.push(B[i].clone()); continue; }
    const rL = N[i].clone().addScaledVector(v1, (-2 / c1) * v1.dot(N[i])), tL = T[i].clone().addScaledVector(v1, (-2 / c1) * v1.dot(T[i]));
    const v2 = T[i + 1].clone().sub(tL), c2 = v2.dot(v2);
    const nn = c2 < 1e-14 ? rL : rL.addScaledVector(v2, (-2 / c2) * v2.dot(rL));
    N.push(nn.normalize()); B.push(new THREE.Vector3().crossVectors(T[i + 1], N[i + 1]).normalize());
  }
  return { T, N, B };
}
// resample a polyline (or a curve's points) to n points evenly spaced along its length; returns [points, lengths]
export function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const tot = L[L.length - 1], out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (tot * k) / (n - 1);
    while (j < pts.length - 2 && L[j + 1] < s) j++;
    const f = L[j + 1] > L[j] ? (s - L[j]) / (L[j + 1] - L[j]) : 0;
    out.push(pts[j].clone().lerp(pts[j + 1], Math.min(1, Math.max(0, f))));
  }
  return { pts: out, length: tot };
}
// A tube through pts (Vector3s, already smooth enough to draw), radius(u, a) and colour(u, a) per vertex, u 0..1 along,
// a 0..2pi round (a = 0 on the frame's normal, i.e. towards `ref` at the start). Closed: the radius must come to 0 at
// u 0 and u 1 (capped(), below); the end rings then meet in a point. Writes into `geo` when given (a pose rebuild keeps
// one geometry and only rewrites its arrays when the counts match).
export function tubeMesh(pts, { radial = 16, radius, color = null, ref, geo = null } = {}) {
  const n = pts.length, F = rmFrames(pts, ref), cnt = n * (radial + 1);
  let g = geo;
  const fresh = !g || !g.attributes.position || g.attributes.position.count !== cnt;
  if (fresh) {
    if (g) g.dispose();
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(cnt * 2), 2));
    if (color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    const idx = [];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    g.setIndex(idx);
  }
  const P = g.attributes.position.array, Nn = g.attributes.normal.array, U = g.attributes.uv.array, C = color ? g.attributes.color.array : null, c = new THREE.Color();
  // the radius's slope along the tube tilts the normal (a cone's side), so round ends shade round
  const L = [0]; for (let i = 1; i < n; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const tot = L[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const u = L[i] / tot, p = pts[i], T = F.T[i], N = F.N[i], B = F.B[i];
    const du = 0.5 / Math.max(1, n - 1);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r = radius(u, a);
      const dr = (radius(Math.min(1, u + du), a) - radius(Math.max(0, u - du), a)) / (2 * du * tot);
      const k = (i * (radial + 1) + j) * 3;
      P[k] = p.x + r * (ca * N.x + sa * B.x); P[k + 1] = p.y + r * (ca * N.y + sa * B.y); P[k + 2] = p.z + r * (ca * N.z + sa * B.z);
      let nx = ca * N.x + sa * B.x - dr * T.x, ny = ca * N.y + sa * B.y - dr * T.y, nz = ca * N.z + sa * B.z - dr * T.z;
      const nl = Math.hypot(nx, ny, nz) || 1; Nn[k] = nx / nl; Nn[k + 1] = ny / nl; Nn[k + 2] = nz / nl;
      const q = (i * (radial + 1) + j) * 2; U[q] = u; U[q + 1] = j / radial;
      if (C) { c.set(color(u, a)); C[k] = c.r; C[k + 1] = c.g; C[k + 2] = c.b; }
    }
  }
  g.attributes.position.needsUpdate = g.attributes.normal.needsUpdate = g.attributes.uv.needsUpdate = true;
  if (C) g.attributes.color.needsUpdate = true;
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}
// a radius profile closed at both ends: the body r(u) between, rounded off over the first and last e of the length
// (a quarter circle in u, so the cap is a dome, not a cone)
export const capped = (r, e0 = 0.08, e1 = e0) => (u, a) => {
  const k0 = u < e0 ? Math.sqrt(Math.max(0, 1 - ((e0 - u) / e0) ** 2)) : 1, k1 = u > 1 - e1 ? Math.sqrt(Math.max(0, 1 - ((u - 1 + e1) / e1) ** 2)) : 1;
  return r(u, a) * k0 * k1;
};
// a smooth curve through control points (centripetal Catmull-Rom), sampled to n points
export function smoothPath(ctrl, n = 24) {
  const c = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
  return c.getSpacedPoints(n - 1);
}

// ---------------------------------------------------------------------------------------------------- colours
export const mixHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));
export const sstep = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
// a deterministic hash in 0..1 of a 3D point (painted fur variation that never changes between frames)
export const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
// value noise 0..1 (trilinear, smoothed) for broad painted variation (fur clumps), stable in the part's own frame
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const h = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v), l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
}
