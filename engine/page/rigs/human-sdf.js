// Signed-distance modelling for the human rig (rig "human-v1"): each body part (skin, shirt, trousers, shoes, hair)
// is a few round cones, ellipsoids and rounded boxes melted together with a smooth minimum (Inigo Quilez,
// iquilezles.org), modelled in the skeleton's rest pose and tagged with the bone that carries it. The node tool
// tools/human/build.mjs meshes the parts once (surface nets) and weights every vertex to the bones of the shapes it
// lies on; the page uses the same field to put the face on the head. Pure maths, no three.js.

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// shapes: { t: "cone", a, b, ra, rb } | { t: "ell", c, r: [rx, ry, rz] } | { t: "box", c, h: [hx, hy, hz], round }
// | { t: "plane", n, d } (keeps n·p > d); every shape may carry m (a 3x3 row-major turn applied about its centre)
export function prep(s) {
  if (s.t === "cone") {
    const ba = sub3(s.b, s.a), l2 = dot3(ba, ba) || 1e-12, rr = s.ra - s.rb;
    return { ...s, ba, l2, rr, a2: l2 - rr * rr, il2: 1 / l2,
      lo: [0, 1, 2].map((i) => Math.min(s.a[i] - s.ra, s.b[i] - s.rb)), hi: [0, 1, 2].map((i) => Math.max(s.a[i] + s.ra, s.b[i] + s.rb)) };
  }
  if (s.t === "ell" || s.t === "box") {
    const R = s.t === "ell" ? Math.max(...s.r) : Math.hypot(...s.h) + (s.round || 0);
    return { ...s, lo: s.c.map((v) => v - R), hi: s.c.map((v) => v + R) };
  }
  return { ...s, lo: [-1e9, -1e9, -1e9], hi: [1e9, 1e9, 1e9] };
}
function local(s, x, y, z) {
  let px = x - s.c[0], py = y - s.c[1], pz = z - s.c[2];
  if (s.m) { const m = s.m; const qx = m[0] * px + m[3] * py + m[6] * pz, qy = m[1] * px + m[4] * py + m[7] * pz, qz = m[2] * px + m[5] * py + m[8] * pz; px = qx; py = qy; pz = qz; }
  return [px, py, pz];
}
export function sd(s, x, y, z) {
  if (s.t === "cone") {
    const px = x - s.a[0], py = y - s.a[1], pz = z - s.a[2], ba = s.ba, l2 = s.l2;
    const yy = px * ba[0] + py * ba[1] + pz * ba[2], zz = yy - l2;
    const qx = px * l2 - ba[0] * yy, qy = py * l2 - ba[1] * yy, qz = pz * l2 - ba[2] * yy, x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(s.rr) * s.rr * s.rr * x2;
    if (Math.sign(zz) * s.a2 * z2 > k) return Math.sqrt(x2 + z2) * s.il2 - s.rb;
    if (Math.sign(yy) * s.a2 * y2 < k) return Math.sqrt(x2 + y2) * s.il2 - s.ra;
    return (Math.sqrt(x2 * s.a2 * s.il2) + yy * s.rr) * s.il2 - s.ra;
  }
  if (s.t === "ell") {
    const [px, py, pz] = local(s, x, y, z), r = s.r;
    const k0 = Math.hypot(px / r[0], py / r[1], pz / r[2]), k1 = Math.hypot(px / (r[0] * r[0]), py / (r[1] * r[1]), pz / (r[2] * r[2]));
    return k1 < 1e-9 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
  }
  if (s.t === "box") {
    const [px, py, pz] = local(s, x, y, z), rd = s.round || 0;
    const qx = Math.abs(px) - s.h[0] + rd, qy = Math.abs(py) - s.h[1] + rd, qz = Math.abs(pz) - s.h[2] + rd;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rd;
  }
  if (s.t === "plane") return s.d - (s.n[0] * x + s.n[1] * y + s.n[2] * z);   // inside where n·p > d
  return 1;
}
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const boxDist = (s, x, y, z) => {
  const dx = Math.max(s.lo[0] - x, 0, x - s.hi[0]), dy = Math.max(s.lo[1] - y, 0, y - s.hi[1]), dz = Math.max(s.lo[2] - z, 0, z - s.hi[2]);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// a part: { shapes: [{ ...shape, op: "add"|"sub"|"int", k }], k (default blend) }. Shapes run in order: "add" melts
// in with its k, "sub" carves with its k, "int" keeps only what's inside it (a hairline, a hem).
export function partField(part) {
  const S = part.shapes.map(prep), K = part.k ?? 0.01;
  const f = (x, y, z) => {
    let d = Infinity;
    for (const s of S) {
      const k = s.k ?? K, op = s.op || "add";
      if (op === "add") { if (d !== Infinity && boxDist(s, x, y, z) - k > d) continue; const v = sd(s, x, y, z); d = d === Infinity ? v : smin(d, v, k); }
      else if (op === "sub") { if (boxDist(s, x, y, z) > Math.abs(d) + k) continue; d = smax(d, -sd(s, x, y, z), k); }
      else d = smax(d, sd(s, x, y, z), k);
    }
    return d;
  };
  f.shapes = S;
  return f;
}
export function partBounds(part, pad = 0.02) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const s of part.shapes.map(prep)) if (!s.op || s.op === "add") for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], s.lo[i] - pad); hi[i] = Math.max(hi[i], s.hi[i] + pad); }
  return { lo, hi };
}

// surface nets on an h grid: positions, field normals, triangle indices
export function mesh(f, bounds, h) {
  const o = bounds.lo.map((v) => Math.floor(v / h) * h), n = bounds.hi.map((v, i) => Math.ceil((v - o[i]) / h) + 1);
  const [nx, ny, nz] = n, N = nx * ny * nz, F = new Float32Array(N), B = 6;
  const P = (i, j, k) => [o[0] + i * h, o[1] + j * h, o[2] + k * h];
  const rad = Math.sqrt(3) * (B / 2 + 1) * h;
  for (let bz = 0; bz < nz; bz += B) for (let by = 0; by < ny; by += B) for (let bx = 0; bx < nx; bx += B) {
    const [cx, cy, cz] = P(bx + B / 2, by + B / 2, bz + B / 2), dc = f(cx, cy, cz);
    const far = Math.abs(dc) > rad;
    for (let k = bz; k < Math.min(bz + B, nz); k++) for (let j = by; j < Math.min(by + B, ny); j++) for (let i = bx; i < Math.min(bx + B, nx); i++)
      F[i + nx * (j + ny * k)] = far ? dc : f(...P(i, j, k));
  }
  const cell = new Int32Array(N).fill(-1), pos = [], nrm = [], idx = [];
  const g = (x, y, z) => { const e = h * 0.25; const v = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)]; const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const vert = (i, j, k) => {
    const id = i + nx * (j + ny * k);
    if (cell[id] >= 0) return cell[id];
    const v = corner.map(([a, b, c]) => F[i + a + nx * (j + b + ny * (k + c))]);
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (const [a, b] of edges) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]), A = corner[a], Bc = corner[b];
      sx += A[0] + (Bc[0] - A[0]) * t; sy += A[1] + (Bc[1] - A[1]) * t; sz += A[2] + (Bc[2] - A[2]) * t; m++;
    }
    let p = P(i + sx / m, j + sy / m, k + sz / m);
    for (let it = 0; it < 2; it++) { const d = f(...p), n2 = g(...p); p = p.map((c, q) => c - d * n2[q]); }
    cell[id] = pos.length / 3; pos.push(...p); nrm.push(...g(...p));
    return cell[id];
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const a = F[i + nx * (j + ny * k)];
    // the three edges leaving this grid point in +x, +y, +z: a sign change makes a quad of the 4 cells round it
    for (let ax = 0; ax < 3; ax++) {
      const di = ax === 0 ? 1 : 0, dj = ax === 1 ? 1 : 0, dk = ax === 2 ? 1 : 0;
      const b = F[i + di + nx * (j + dj + ny * (k + dk))];
      if ((a < 0) === (b < 0)) continue;
      // the 4 cells sharing this edge
      let c;
      if (ax === 0) c = [[i, j - 1, k - 1], [i, j, k - 1], [i, j, k], [i, j - 1, k]];
      else if (ax === 1) c = [[i - 1, j, k - 1], [i - 1, j, k], [i, j, k], [i, j, k - 1]];
      else c = [[i - 1, j - 1, k], [i, j - 1, k], [i, j, k], [i - 1, j, k]];
      const q = c.map(([x, y, z]) => vert(x, y, z));
      if (a < 0) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]); else idx.push(q[0], q[2], q[1], q[0], q[3], q[2]);
    }
  }
  return { pos, nrm, idx };
}

// march a ray from `from` along `dir` to the part's surface (bisection after a sphere-traced bracket); null if missed
export function hit(f, from, dir, max = 0.4) {
  let t = 0, d = f(...from);
  const inside = d < 0;
  for (let i = 0; i < 200 && t < max; i++) {
    const p = from.map((v, q) => v + dir[q] * t), v = f(...p);
    if ((v < 0) !== inside) { let a = Math.max(0, t - 0.004), b = t; for (let j = 0; j < 30; j++) { const m = (a + b) / 2, pm = from.map((v2, q) => v2 + dir[q] * m); if ((f(...pm) < 0) !== inside) b = m; else a = m; } return from.map((v2, q) => v2 + dir[q] * b); }
    t += Math.max(Math.abs(v) * 0.8, 0.0015);
  }
  return null;
}
export function normalAt(f, p, e = 5e-4) {
  const v = [f(p[0] + e, p[1], p[2]) - f(p[0] - e, p[1], p[2]), f(p[0], p[1] + e, p[2]) - f(p[0], p[1] - e, p[2]), f(p[0], p[1], p[2] + e) - f(p[0], p[1], p[2] - e)];
  const l = Math.hypot(...v) || 1; return v.map((c) => c / l);
}
