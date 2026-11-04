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
  // o.topFn: the top edge's elevation round the body (a neckline: low at the clasp, high at the back); o.lift0: the
  // lift at the top edge (tuck it under a hood or collar), growing to `lift` a quarter of the way down
  const topAt = o.topFn || (() => top), lift0 = o.lift0 ?? lift;
  const at = (th, v, off) => {
    const tp = topAt(th), ph = tp + (hemAt(th) - tp) * v, s = ch.surf(th, ph), lift = lift0 + ((o.lift ?? 0.01) - lift0) * sstep(0, o.liftRamp ?? 0.25, v);
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
  return { outer: go, inner: gi, hem: ge, lines: { hem: hemLine, left, right }, at, fold: { folds, phase, from, to, closed, thick } };
}
// a trim along a garment edge: a flat braid (an embroidered border) following the line
export function trim(line, r, mat, flat = 0.45) {
  const curve = new THREE.CatmullRomCurve3(line), g = new THREE.TubeGeometry(curve, Math.max(24, line.length * 2), r, 8, false);
  const m = new THREE.Mesh(g, mat); m.scale.set(1, 1, 1); m.castShadow = true; m.userData.flat = flat; return m;
}
// garment() as meshes in a group: the outside in `color`, the inside darker
export function garmentMesh(ch, o, color, lining) {
  const G = garment(ch, { grad: 0.16, ...o }), { outer, inner, hem, lines } = G, g = new THREE.Group(), out = clothMat(color, { side: THREE.DoubleSide, vertexColors: true });
  g.userData.lines = lines;
  const m1 = new THREE.Mesh(outer, out); m1.castShadow = m1.receiveShadow = true; g.add(m1);
  const m2 = new THREE.Mesh(inner, liningMat(lining || new THREE.Color(color).multiplyScalar(0.55))); g.add(m2);
  const m3 = new THREE.Mesh(hem, clothMat(color, { side: THREE.DoubleSide })); g.add(m3);
  // o.trim: a border braid in this colour along the hem (and the front edges of an open garment)
  if (o.trim) { const tm = clothMat(o.trim, { roughness: 0.7 }); for (const L of [lines.hem, lines.left, lines.right]) if (L.length > 2) g.add(trim(L, o.trimR ?? 0.009, tm)); }
  if (o.ink !== false) { const ig = foldInk(G, o.ink || {}); if (ig) g.add(inkMesh(ig, color)); }
  return g;
}

// a lock of hair, a feather of fire, a tuft of fur: a ribbon along `pts` whose cross-section is an ellipse `w` wide
// (sideways) and `h` thick (along `up`, usually the head's outward normal), both following profile(t) 0..1 from root
// to tip. ups: one vector per point (or one for all). Closed at both ends.
export function lock(pts, ups, w, h, profile = (t) => Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.92)) ** 0.8, segs = 28, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), upC = Array.isArray(ups) ? new THREE.CatmullRomCurve3(ups) : null;
  if (upC) upC.arcLengthDivisions = 20;
  const P = [], T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), frames = [];
  for (let j = 0; j <= segs; j++) {
    const t = j / segs, c = curve.getPointAt(t); curve.getTangentAt(t, T);
    // ups "side": the lock's flat face looks sideways-out of the plane it bends in (a flame or a crest seen from the
    // front is wide); else the given up (the head's normal: a lock lying on the head is wide across the head)
    if (ups === "side") N.crossVectors(X_AXIS, T); else N.copy(upC ? upC.getPoint(t) : ups);
    if (N.lengthSq() < 1e-6) N.set(0, 0, 1);
    N.normalize(); B.crossVectors(T, N); if (B.lengthSq() < 1e-8) B.set(1, 0, 0); B.normalize(); N.crossVectors(B, T).normalize();
    const k = profile(t);
    frames.push({ c: c.clone(), N: N.clone(), B: B.clone(), w: w * k, h: h * k, t });
    for (let i = 0; i <= radial; i++) { const a = (i / radial) * Math.PI * 2; P.push(c.clone().addScaledVector(B, Math.cos(a) * w * k).addScaledVector(N, Math.sin(a) * h * k)); }
  }
  // gridMesh wants u along the ring: transpose
  const pts2 = []; for (let i = 0; i <= radial; i++) for (let j = 0; j <= segs; j++) pts2.push(P[j * (radial + 1) + i]);
  const g = gridMesh(pts2, segs, radial); g.userData.row = segs + 1; g.userData.frames = frames;
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

// ---------- drawn detail lines (Jonny 1 Nov: "a bit more handdrawn sophisticated style") ---------------------------
// A hand-drawn costume has a few ink strokes inside its shapes: a line down each deep fold, a stroke or two along a
// lock of hair. They are thin ribbons lying just on the surface, tapered at both ends like a brush stroke, uneven in
// length (copy nature: never every fold the same), in a deep shade of the cloth's own colour (coloured ink, not black).
const hash1 = (x) => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
export function inkMat(color, k = 0.4) {
  const c = new THREE.Color(color), h = {}; c.getHSL(h);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.15 + 0.08), Math.max(0.05, h.l * k)), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.userData.ink = true; return m;
}
export function inkMesh(geo, color, k = 0.32) { const m = new THREE.Mesh(geo, inkMat(color, k)); m.userData.inkStroke = true; return m; }
// a strip from centre points, a side vector per point and a width per point
function strip(cs, sides, ws) {
  const pos = [], idx = [];
  cs.forEach((c, i) => { pos.push(...c.clone().addScaledVector(sides[i], -ws[i]).toArray(), ...c.clone().addScaledVector(sides[i], ws[i]).toArray()); });
  for (let i = 0; i < cs.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const brushW = (u, W, heavy = 0.5) => W * (1 - heavy + heavy * u) * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
// ink down the deep folds of a garment(): from part way down to just above the hem, a shorter second stroke beside
// some of them; o: { width (m), every (1: every fold), from (v where the longest start) }
export function foldInk(G, o = {}) {
  const { at, fold } = G, W = o.width ?? 0.0045, out = [];
  if (!at) return null;
  for (let k = -2; k < fold.folds + 2; k++) {
    const th0 = (1.5 * Math.PI + 2 * Math.PI * k - fold.phase) / fold.folds;
    if (fold.closed ? (k < 0 || k >= fold.folds) : (th0 < fold.from + 0.05 || th0 > fold.to - 0.05)) continue;
    const r = hash1(k * 3.1 + fold.folds), r2 = hash1(k * 7.7 + 1.3);
    if (r < 0.18) continue;   // a fold left without a line
    for (const [dt, v0, v1, ww] of [[0, 0.22 + 0.3 * r, 0.9 + 0.06 * r2, 1], ...(r2 > 0.55 ? [[0.09 * (r > 0.5 ? 1 : -1), 0.6 + 0.15 * r2, 0.93, 0.7]] : [])]) {
      const cs = [], sides = [], ws = [], n = 16;
      for (let j = 0; j <= n; j++) {
        const u = j / n, v = v0 + (v1 - v0) * u, th = th0 + dt + 0.025 * Math.sin(u * 4 + k);
        const c = at(th, v, fold.thick + 0.0012), sd = at(th + 0.01, v, fold.thick).sub(at(th - 0.01, v, fold.thick)).normalize();
        cs.push(c); sides.push(sd); ws.push(brushW(u, W * ww, 0.6));
      }
      out.push(strip(cs, sides, ws));
    }
  }
  return out.length ? mergeGeos(out) : null;
}
// ink along locks made by lock(): a stroke on each flat face, a little off centre, root to about two thirds
export function lockInk(geos, o = {}) {
  const out = [], W = o.width ?? 0.003;
  for (const g of [].concat(geos)) {
    const F = g.userData.frames; if (!F) continue;
    for (const s of [1, -1]) {
      const off = (o.off ?? 0.25) * s, cs = [], sides = [], ws = [];
      const sel = F.filter((f) => f.t >= (o.from ?? 0.06) && f.t <= (o.to ?? 0.7));
      sel.forEach((f, i) => {
        const u = i / Math.max(1, sel.length - 1), hN = f.h * Math.sqrt(Math.max(0, 1 - off * off)) + 0.0009;
        cs.push(f.c.clone().addScaledVector(f.N, hN * s).addScaledVector(f.B, f.w * off)); sides.push(f.B.clone()); ws.push(brushW(u, W, -0.3));
      });
      if (cs.length > 2) out.push(strip(cs, sides, ws));
    }
  }
  return out.length ? mergeGeos(out) : null;
}
function mergeGeos(gs) {
  let n = 0; for (const g of gs) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), idx = []; let o = 0;
  for (const g of gs) { pos.set(g.attributes.position.array, o * 3); for (const i of g.index.array) idx.push(i + o); o += g.attributes.position.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------- sheet cloth kit (castLook "sheet", quality plan item 5, 4 Nov 2026) ---------------------------------------
// Jonny's ten design sheets (references/cast-sheets-v1) are now the cast's look. What their cloth does that ours didn't:
//   - "just three or four purposeful broad folds": garment() lays 8-22 even sine folds round the body. drape() takes a
//     short hand-placed list of broad folds, each with its own width and depth, ridges and valleys, never in a rhythm
//     (copy nature: real cloth hangs in a few big tubes from where it is held, with flat stretches between)
//   - "weighted slightly uneven hem": the hem hangs lower under a ridge and rides up over a valley, plus a slow drift,
//     so no two stretches of hem sit at the same height
//   - "tangible seams and fabric thickness": a rolled edge, a soft tube as thick as the cloth, along the hem and the
//     front edges (the sheets' "thick rolled rims"); the cloth itself is thicker (2-3 cm instead of 1-2)
//   - "subtly lighter inner lining": the inside is a shade lighter or warmer than the outside, and an open garment's
//     front edges turn back (a facing), so the lining shows from the front as the sheets draw it
// Folds are [th, depth, width]: th the angle round the body (0 front), depth in metres (+ a ridge standing out, - a
// valley), width in radians. Built from the body's own surface like garment(), so it fits any potato.
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
export function drape(ch, o) {
  const NU = o.segs ?? 200, NV = o.rows ?? 40, top = o.top, from = o.from ?? 0, to = o.to ?? Math.PI * 2, closed = o.to == null;
  const F = o.folds || [], flare = o.flare ?? 0.06, lift = o.lift ?? 0.01, thick = o.thick ?? 0.024, hang = o.hang ?? 0.4;
  const sag = o.sag ?? 1.6, [dA, dF, dP] = o.drift || [0.025, 1.7, 0.6];
  const foldAt = (th) => { let f = 0; for (const [c, d, w] of F) { const x = angDiff(th, c) / w; f += d * Math.exp(-x * x); } return f; };
  const flareAt = o.flareFn || (() => 1);
  // weighted hem: lower under a ridge (sag x its depth, in elevation per metre of depth), and a slow drift round the body
  const hemAt = o.hemFn || ((th) => o.hem - sag * foldAt(th) + dA * Math.sin(th * dF + dP));
  // o.free (default on): below the body's widest point the cloth stops following the potato inward and hangs from the
  // widest point it passed (copy nature: a cloak falls straight from the shoulders, it doesn't tuck under the belly)
  const free = o.free ?? true, reach = new Map();
  const widest = (th, ph) => {   // the furthest out the body reaches at angle th between the top and elevation ph
    const key = Math.round(th * 400);
    let prof = reach.get(key);
    if (!prof) { prof = []; for (let k = 0; k <= 24; k++) { const t0 = topAt(th), e = t0 + (o.hem - 0.15 - t0) * (k / 24), p = ch.surf(th, e).pos; prof.push([e, Math.hypot(p.x, p.z)]); } reach.set(key, prof); }
    let r = 0; for (const [e, rr] of prof) { if (e < ph) break; r = Math.max(r, rr); }
    return r;
  };
  // o.topFn: the top edge's elevation round the body (a neckline: low at the clasp, high at the back); o.lift0: the
  // lift at the top edge (tuck it under a hood or collar), growing to `lift` a quarter of the way down
  const topAt = o.topFn || (() => top), lift0 = o.lift0 ?? lift;
  const at = (th, v, off) => {
    const tp = topAt(th), ph = tp + (hemAt(th) - tp) * v, s = ch.surf(th, ph), lift = lift0 + ((o.lift ?? 0.01) - lift0) * sstep(0, o.liftRamp ?? 0.25, v);
    // the folds hang from where the cloth is held: already there below the top, growing toward the hem
    const fold = foldAt(th) * (0.3 + 0.7 * Math.pow(v, 1.1));
    const n = s.normal.clone(); n.y *= hang; n.normalize();
    const p = s.pos.clone();
    if (free) { const r = Math.hypot(p.x, p.z), w = widest(th, ph); if (w > r && r > 1e-4) { p.x *= w / r; p.z *= w / r; n.set(p.x, 0, p.z).normalize().lerp(s.normal, 0.15 * (1 - v)).normalize(); } }
    return p.addScaledVector(n, lift + flare * flareAt(th) * Math.pow(v, 1.6) + fold + off);
  };
  // o.spread: an open garment's front edges part further toward the hem (radians at the hem), like a cloak hanging
  // open from a clasp at the neck
  const sp = o.spread ?? 0, f0 = (v) => from + sp * v, t0 = (v) => to - sp * v;
  const th = (i, v = 1) => f0(v) + (t0(v) - f0(v)) * (i / NU);
  const outer = [], inner = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { outer.push(at(th(i, j / NV), j / NV, thick)); inner.push(at(th(i, j / NV), j / NV, 0)); }
  const go = gridMesh(outer, NU, NV), gi = gridMesh(inner, NU, NV);
  if (closed) { weldU(go, NU, NV); weldU(gi, NU, NV); }
  // painted shading: a little lighter where the cloth is held, darker toward the hem, darker still in each valley
  if (o.grad ?? 0.16) for (const g of [go, gi]) {
    const n = g.attributes.position.count, cols = new Float32Array(n * 3), G = o.grad ?? 0.16;
    for (let k = 0; k < n; k++) { const i = k % (NU + 1), v = Math.floor(k / (NU + 1)) / NV, f = foldAt(th(i, v)), c = 1.06 - G * Math.pow(v, 1.2) + (o.valleyShade ?? 2.2) * Math.min(0, f) * v; cols[k * 3] = cols[k * 3 + 1] = cols[k * 3 + 2] = Math.max(0.55, c); }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  }
  // the edges, just outside the cloth's middle: the hem, and for an open garment its two front edges
  const hemLine = [], left = [], right = [];
  for (let i = 0; i <= NU; i++) hemLine.push(at(th(i), 1, thick * 0.5));
  if (!closed) for (let j = 0; j <= NV; j++) { left.push(at(f0(j / NV), j / NV, thick * 0.5)); right.push(at(t0(j / NV), j / NV, thick * 0.5)); }
  // facings: the lining turned back along each front edge, a strip lying on the outside (o.facing: its width, radians)
  const facings = [];
  if (!closed && o.facing) for (const sd of [1, -1]) {
    const P = [], n2 = 12;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= n2; i++) { const v = j / NV, e = sd > 0 ? f0(v) : t0(v), u = i / n2, t = e + sd * o.facing * u; P.push(at(t, v, thick + 0.003 + 0.004 * (1 - u))); }
    facings.push(gridMesh(P, n2, NV));
  }
  return { outer: go, inner: gi, facings, lines: { hem: hemLine, left, right }, at, th, f0, t0, foldAt, hemAt, F, from, to, closed, thick };
}
// a rolled edge: a soft round tube along an edge line, a little flattened against the cloth (userData.flat for drawn.js)
export function roll(line, r, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(line, closed, "centripetal");
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, line.length * 2), r, 10, closed), mat);
  m.castShadow = true; m.userData.flat = 0.3; return m;
}
// ink down the valleys of a drape(): one tapered stroke per valley from part way down to near the hem, a short second
// one beside the deepest, and a short stroke rising from the hem under each ridge (where the cloth turns)
export function drapeInk(D, o = {}) {
  const W = o.width ?? 0.005, out = [];
  D.F.forEach(([c, d, w], k) => {
    if (o.only === "ridge" && d < 0) return;
    if (o.only === "ridge") { const r = hash1(k * 9.1 + 0.7); strokesFor(c, k, [[0.08 * w, 0.18 + 0.2 * r, 0.9, 1.3]]); return; }
    const r = hash1(k * 5.3 + 2.1), strokes = d < 0 ? [[0, 0.12 + 0.25 * r, 0.94, 1]] : [[0.35 * w * (r > 0.5 ? 1 : -1), 0.62 + 0.12 * r, 0.96, 0.75]];
    if (d < -0.03) strokes.push([0.28 * w * (r > 0.5 ? -1 : 1), 0.55 + 0.1 * r, 0.9, 0.6]);
    strokesFor(c, k, strokes);
  });
  function strokesFor(c, k, strokes) {
    for (const [dt, v0, v1, ww] of strokes) {
      const cs = [], sides = [], ws = [], n = 18;
      if (!D.closed && (c + dt < D.f0(v1) + 0.08 || c + dt > D.t0(v1) - 0.08)) continue;
      for (let j = 0; j <= n; j++) {
        const u = j / n, v = v0 + (v1 - v0) * u, t = c + dt + 0.02 * Math.sin(u * 3 + k);
        cs.push(D.at(t, v, D.thick + 0.0015)); sides.push(D.at(t + 0.01, v, D.thick).sub(D.at(t - 0.01, v, D.thick)).normalize()); ws.push(brushW(u, W * ww, 0.6));
      }
      out.push(strip(cs, sides, ws));
    }
  }
  return out.length ? mergeGeos(out) : null;
}
// drape() as meshes: the outside in `color`, the inside and the facings in the lighter `lining`, rolled hem and front
// edges (o.rollR, in `o.rollColor`, default a mix of outside and lining), valley ink. Returns the group; .userData.drape
// keeps the drape for later pieces (stitches, motion).
export function drapeMesh(ch, o, color, lining) {
  const D = drape(ch, o), g = new THREE.Group(), out = clothMat(color, { side: THREE.DoubleSide, vertexColors: true });
  const m1 = new THREE.Mesh(D.outer, out); m1.castShadow = m1.receiveShadow = true; g.add(m1);
  const inM = clothMat(lining, { side: THREE.BackSide, vertexColors: true, role: o.liningRole || "cloth" });
  g.add(new THREE.Mesh(D.inner, inM));
  const face = clothMat(lining, { side: THREE.DoubleSide }); face.polygonOffset = true; face.polygonOffsetFactor = -1; face.polygonOffsetUnits = -1;
  for (const f of D.facings) g.add(new THREE.Mesh(f, face));
  const rm = clothMat(o.rollColor || new THREE.Color(color).lerp(new THREE.Color(lining), 0.45), { side: THREE.FrontSide });
  const R = o.rollR ?? D.thick * 0.75;
  // o.topRoll: a rolled collar along the top edge (a cape fastened at the neck), its radius
  if (o.topRoll) { const L = []; for (let i = 0; i <= 120; i++) L.push(D.at(D.th(i * (o.segs ?? 200) / 120, 0), 0, D.thick * 0.5)); g.add(roll(L, o.topRoll, rm, D.closed)); }
  if (R > 0) { g.add(roll(D.lines.hem, R, rm, D.closed)); if (!D.closed && o.edgeRoll !== false) for (const L of [D.lines.left, D.lines.right]) g.add(roll(L, R * 0.9, rm)); }
  if (o.ink !== false) { const ig = drapeInk(D, o.ink || {}); if (ig) g.add(inkMesh(ig, color, o.inkK ?? 0.32)); }
  // o.sheen: dark cloth shows its folds by the light on the ridges, not by ink: a soft lighter stroke down each ridge
  if (o.sheen) { const ig = drapeInk(D, { width: (o.ink?.width ?? 0.005) * 2.2, only: "ridge" }); if (ig) g.add(inkMesh(ig, color, o.sheen)); }
  g.userData.drape = D;
  return g;
}
// a repair: a few short stitches across a seam line (the sheets' "one tidy repaired stitch"), lying on a surface.
// p the middle, n the surface normal there, along the seam's direction; n stitches, each `len` long
export function stitches(p, n, along, count = 3, len = 0.03, color = "#b8a890") {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 }); m.userData.lookRole = "cloth";
  const a = along.clone().normalize(), side = new THREE.Vector3().crossVectors(n, a).normalize(), gap = len * 0.55;
  // the seam itself, then the cross stitches over it
  const seam = new THREE.Mesh(new THREE.CapsuleGeometry(len * 0.07, gap * (count + 0.6), 3, 6), m);
  seam.position.copy(p).addScaledVector(n, 0.002); seam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a); g.add(seam);
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(len * 0.1, len, 3, 6), m);
    s.position.copy(p).addScaledVector(a, (i - (count - 1) / 2) * gap).addScaledVector(n, 0.004);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side.clone().addScaledVector(a, 0.15 * (i % 2 ? 1 : -1)).normalize()); g.add(s);
  }
  return g;
}
