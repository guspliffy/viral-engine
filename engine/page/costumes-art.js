import * as THREE from "three";

// costume.art (castLook "art", thread "Make the characters more detailed and beautiful", 31 Oct 2026): shapes that
// make a costume piece read as cloth, hair or fur that belongs to the character instead of a primitive stuck on it.
// Jonny: "now they are still quite simple and some traits not seem that well integrated and natural ... each
// character and video should feel like an artwork itself". What the turnarounds of the board look showed, and the rule
// each helper here follows:
//   - belts and sashes were round tubes (pool rings): a band() is a flat strip lying on the body with soft edges
//   - tunics, vests and suits were smooth bowls with a ring on top: a garment() has folds that deepen toward a
//     hem that lifts off the body, a thickness you can see at the hem, and a darker inside
//   - hair was a shell with ridges (the Norse god's "shower cap"): hair is a scalp cap with locks growing out of it,
//     each lock a flattened tapered ribbon that lies on the head and lifts off toward a pointed tip (lock())
//   - cloth was glossy plastic: clothMat() is matte, with the looks.js "cloth" role
// Everything is built from the character's own surface (ch.surf / ch.bodyPoint), so it fits any body.

const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const X_AXIS = new THREE.Vector3(1, 0, 0);
export const dirOf = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));

export function clothMat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.roughness ?? 0.95, metalness: 0, side: o.side ?? THREE.FrontSide, ...(o.vertexColors ? { vertexColors: true } : {}) });
  m.userData.lookRole = o.role || "cloth";
  return m;
}
export const liningMat = (color) => clothMat(color, { side: THREE.BackSide, role: "lining" });
export const leatherMat = (color) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 }); m.userData.lookRole = "cloth"; return m; };
export const metalMat = (color, rough = 0.32) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.8 });

// a mesh from a (nu+1) x (nv+1) grid of points; closedU joins the last column to the first
function gridMesh(pts, nu, nv) {
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a seam-free normal for a closed ring grid: average the first and last column
function weldU(g, nu, nv) {
  const N = g.attributes.normal;
  for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = (N.getX(a) + N.getX(b)) / 2, y = (N.getY(a) + N.getY(b)) / 2, z = (N.getZ(a) + N.getZ(b)) / 2, l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  N.needsUpdate = true; return g;
}

// a flat band round the body: a belt, a sash, a collar. o: { ph (elevation of its middle), w (half width along the
// surface, m), t (thickness, m), lift (gap to the skin, m), tilt (elevation change front to back: a slung belt), dip
// (th of its lowest point), from/to (theta range for an open band; default all round), round (0 square .. 1 oval) }
export function band(ch, o) {
  const NU = o.segs ?? 160, NV = 16, from = o.from ?? 0, to = o.to ?? Math.PI * 2, closed = o.to == null;
  const w = o.w ?? 0.04, t = o.t ?? 0.016, lift = o.lift ?? 0.006, pr = 2 / (2 + 6 * (1 - (o.round ?? 0.35)));
  const pts = [];
  for (let j = 0; j <= NV; j++) {
    const a = (j / NV) * Math.PI * 2, cu = Math.cos(a), su = Math.sin(a);
    const U = Math.sign(cu) * Math.abs(cu) ** pr, V = Math.sign(su) * Math.abs(su) ** pr;   // a rounded rectangle
    for (let i = 0; i <= NU; i++) {
      const th = from + (to - from) * (i / NU), ph = o.ph + (o.tilt ?? 0) * 0.5 * (1 - Math.cos(th - (o.dip ?? 0)));
      const c = ch.surf(th, ph), up = ch.surf(th, ph + 0.01).pos.sub(ch.surf(th, ph - 0.01).pos).normalize();
      const k = (V * 0.5 + 0.5);   // 0 on the skin side, 1 outside
      pts.push(c.pos.clone().addScaledVector(up, U * w).addScaledVector(c.normal, lift + k * t + (o.bulge ?? 0) * k * (1 - U * U)));
    }
  }
  const g = gridMesh(pts, NU, NV);
  return closed ? weldU(g, NU, NV) : g;
}

// a garment hanging from the body: from elevation `top` down to `hem`, all round (or theta from..to). Lies on the
// skin at the top, lifts off toward the hem (flare), soft vertical folds that deepen toward the hem, a hem that waves
// (wave) or is cut in points (ragged), and a thickness band at the hem so the cloth has an edge. Returns
// { outer, inner, hem } geometries (inner = the inside, a little in, for a darker lining material).
export function garment(ch, o) {
  const NU = o.segs ?? 180, NV = o.rows ?? 36, top = o.top, hemEl = o.hem, from = o.from ?? 0, to = o.to ?? Math.PI * 2, closed = o.to == null;
  const folds = o.folds ?? 9, depth = o.depth ?? 0.014, flare = o.flare ?? 0.03, lift = o.lift ?? 0.008, wave = o.wave ?? 0.02, ragged = o.ragged ?? 0;
  const thick = o.thick ?? 0.012, phase = o.phase ?? 0.4;
  const hemAt = o.hemFn || ((th) => hemEl + wave * Math.sin(th * folds + phase) - ragged * Math.abs(((((th * (o.points ?? 9)) / Math.PI) % 2) + 2) % 2 - 1));
  const at = (th, v, off) => {
    const ph = top + (hemAt(th) - top) * v, s = ch.surf(th, ph);
    // folds: a smooth wave plus a sharper crease, both growing toward the hem
    const fw = Math.sin(th * folds + phase), fold = depth * Math.pow(v, 1.3) * (0.7 * fw + 0.3 * Math.sign(fw) * Math.abs(fw) ** 0.4);
    const n = s.normal.clone(); n.y *= 0.4; n.normalize();   // hang: lift sideways, not up
    return s.pos.clone().addScaledVector(n, lift + flare * Math.pow(v, 1.8) + fold + off);
  };
  const outer = [], inner = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const th = from + (to - from) * (i / NU), v = j / NV; outer.push(at(th, v, thick)); inner.push(at(th, v, 0)); }
  const go = gridMesh(outer, NU, NV), gi = gridMesh(inner, NU, NV);
  // the hem's edge: a strip joining the outside to the inside along the bottom row
  const edge = [];
  for (let k = 0; k <= 2; k++) for (let i = 0; i <= NU; i++) { const th = from + (to - from) * (i / NU); edge.push(at(th, 1 + k * 0.0, thick * (1 - k / 2))); }
  const ge = gridMesh(edge, NU, 2);
  if (closed) { weldU(go, NU, NV); weldU(gi, NU, NV); }
  // the edges as lines just outside the cloth: the hem, and for an open garment its two front edges (for trims)
  const hemLine = [], left = [], right = [];
  for (let i = 0; i <= NU; i++) hemLine.push(at(from + (to - from) * (i / NU), 1, thick * 0.5));
  if (!closed) for (let j = 0; j <= NV; j++) { left.push(at(from, j / NV, thick * 0.5)); right.push(at(to, j / NV, thick * 0.5)); }
  // painted shading (castLook "art"): each vertex's colour a little lighter at the top and darker toward the hem
  if (o.grad) for (const g of [go, gi]) {
    const n = g.attributes.position.count, cols = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const v = Math.floor(k / (NU + 1)) / NV, c = 1.06 - o.grad * Math.pow(v, 1.2); cols[k * 3] = cols[k * 3 + 1] = cols[k * 3 + 2] = c; }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  }
  return { outer: go, inner: gi, hem: ge, lines: { hem: hemLine, left, right } };
}
// a trim along a garment edge: a flat braid (an embroidered border) following the line
export function trim(line, r, mat, flat = 0.45) {
  const curve = new THREE.CatmullRomCurve3(line), g = new THREE.TubeGeometry(curve, Math.max(24, line.length * 2), r, 8, false);
  const m = new THREE.Mesh(g, mat); m.scale.set(1, 1, 1); m.castShadow = true; m.userData.flat = flat; return m;
}
// garment() as meshes in a group: the outside in `color`, the inside darker
export function garmentMesh(ch, o, color, lining) {
  const { outer, inner, hem, lines } = garment(ch, { grad: 0.16, ...o }), g = new THREE.Group(), out = clothMat(color, { side: THREE.DoubleSide, vertexColors: true });
  g.userData.lines = lines;
  const m1 = new THREE.Mesh(outer, out); m1.castShadow = m1.receiveShadow = true; g.add(m1);
  const m2 = new THREE.Mesh(inner, liningMat(lining || new THREE.Color(color).multiplyScalar(0.55))); g.add(m2);
  const m3 = new THREE.Mesh(hem, clothMat(color, { side: THREE.DoubleSide })); g.add(m3);
  // o.trim: a border braid in this colour along the hem (and the front edges of an open garment)
  if (o.trim) { const tm = clothMat(o.trim, { roughness: 0.7 }); for (const L of [lines.hem, lines.left, lines.right]) if (L.length > 2) g.add(trim(L, o.trimR ?? 0.009, tm)); }
  return g;
}

// a lock of hair, a feather of fire, a tuft of fur: a ribbon along `pts` whose cross-section is an ellipse `w` wide
// (sideways) and `h` thick (along `up`, usually the head's outward normal), both following profile(t) 0..1 from root
// to tip. ups: one vector per point (or one for all). Closed at both ends.
export function lock(pts, ups, w, h, profile = (t) => Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.92)) ** 0.8, segs = 28, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), upC = Array.isArray(ups) ? new THREE.CatmullRomCurve3(ups) : null;
  if (upC) upC.arcLengthDivisions = 20;
  const P = [], T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  for (let j = 0; j <= segs; j++) {
    const t = j / segs, c = curve.getPointAt(t); curve.getTangentAt(t, T);
    // ups "side": the lock's flat face looks sideways-out of the plane it bends in (a flame or a crest seen from the
    // front is wide); else the given up (the head's normal: a lock lying on the head is wide across the head)
    if (ups === "side") N.crossVectors(X_AXIS, T); else N.copy(upC ? upC.getPoint(t) : ups);
    if (N.lengthSq() < 1e-6) N.set(0, 0, 1);
    N.normalize(); B.crossVectors(T, N); if (B.lengthSq() < 1e-8) B.set(1, 0, 0); B.normalize(); N.crossVectors(B, T).normalize();
    const k = profile(t);
    for (let i = 0; i <= radial; i++) { const a = (i / radial) * Math.PI * 2; P.push(c.clone().addScaledVector(B, Math.cos(a) * w * k).addScaledVector(N, Math.sin(a) * h * k)); }
  }
  // gridMesh wants u along the ring: transpose
  const pts2 = []; for (let i = 0; i <= radial; i++) for (let j = 0; j <= segs; j++) pts2.push(P[j * (radial + 1) + i]);
  const g = gridMesh(pts2, segs, radial); g.userData.row = segs + 1;
  return g;
}
// a path of (az, el, lift) on the body to points just off its surface, and the outward normals there
export function onBody(ch, path, scale = 1) {
  const pts = [], ups = [];
  for (const [az, el, l] of path) { const s = ch.surf(az, el); pts.push(new THREE.Vector3(s.pos.x * scale, ch.cy + (s.pos.y - ch.cy) * scale, s.pos.z * scale).addScaledVector(s.normal, l)); ups.push(s.normal); }
  return { pts, ups };
}

// a scalp: the body's skin scaled out a little where mask(az, el) > 0, the edge tucked under the skin so the hairline
// reads as a painted edge, not a lip. A sphere grid, faces with mask 0 dropped.
export function scalp(ch, mask, out = 0.018, wobble = 0.004) {
  const g = new THREE.SphereGeometry(1, 160, 110), p = g.attributes.position, v = new THREE.Vector3(), m = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const n = v.fromBufferAttribute(p, i).clone().normalize(), az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const k = (m[i] = mask(az, el)), q = ch.bodyPoint(n), s = (1 + (out * k - 0.004 * (1 - k)) / Math.max(ch.rx, ch.ry)) + wobble * Math.sin(az * 31 + el * 7) * k;
    p.setXYZ(i, q.x * s, ch.cy + (q.y - ch.cy) * s, q.z * s);
  }
  const idx = g.index.array, keep = [];
  for (let i = 0; i < idx.length; i += 3) if (m[idx[i]] > 0.02 || m[idx[i + 1]] > 0.02 || m[idx[i + 2]] > 0.02) keep.push(idx[i], idx[i + 1], idx[i + 2]);
  g.setIndex(keep); g.computeVertexNormals();
  return g;
}

// colours along a lock from root to tip (fire, sun-bleached hair): writes vertex colours by height along the lock
export function tintAlong(geo, root, tip, power = 1.4) {
  const p = geo.attributes.position, n = p.count, cols = new Float32Array(n * 3), a = new THREE.Color(root), b = new THREE.Color(tip), c = new THREE.Color();
  // gridMesh order: (radial+1) rows of (segs+1): u = index % (segs+1) runs root to tip
  const row = geo.userData.row || 29;
  for (let i = 0; i < n; i++) { const u = (i % row) / (row - 1); c.copy(a).lerp(b, Math.pow(u, power)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return geo;
}

// an anime hair shine: brightens vertex colours (adds them if missing) in a band round height y0 (on the side facing
// up and out), the lighter "angel ring" painted across a head of hair
export function shineBand(geo, y0, w, amount = 0.22, base = [1, 1, 1]) {
  const P = geo.attributes.position, n = P.count, N = (geo.attributes.normal || (geo.computeVertexNormals(), geo.attributes.normal));
  let C = geo.attributes.color;
  if (!C) { const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.set(base, i * 3); C = new THREE.BufferAttribute(c, 3); geo.setAttribute("color", C); }
  for (let i = 0; i < n; i++) {
    const d = (P.getY(i) - y0) / w, k = Math.exp(-d * d * 2) * Math.max(0, N.getY(i) * 0.6 + 0.5) * (1 + 0.35 * Math.sin(P.getX(i) * 60 + P.getZ(i) * 40));
    C.setXYZ(i, Math.min(1.3, C.getX(i) + amount * k), Math.min(1.3, C.getY(i) + amount * k), Math.min(1.3, C.getZ(i) + amount * k * 0.9));
  }
  C.needsUpdate = true; return geo;
}

export { sstep };
