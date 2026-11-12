import * as THREE from "three";

// A tube along `curve` whose radius goes from r0 to r1 (or follows radiusAt(t)), closed at the tip.
export function taperedTube(curve, r0, r1, segs = 32, radial = 24, radiusAt = null) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [], uv = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t);
    const r = radiusAt ? radiusAt(t) : r0 + (r1 - r0) * t;
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z));
      uv.push(t, j / radial);   // u along the tube, v round it (a decal on a sleeve)
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1); // counter-clockwise seen from outside, so normals point outward
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// A disc-like surface of revolution from a profile of [radius, y] points (radius may be 0).
export function lathe(profile, segs = 64) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs);
}

// Soft round sprite texture (glow, smoke, blush)
export function radialTexture(stops) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// A skin lofted through cross-sections: ONE continuous closed surface (an animal's body, neck, limb, tail), so a body
// never reads as balls fitted together. sections, in order along the spine: { c: [x, y, z], w, up, dn, n }.
//   w = half width (to the side), up / dn = half heights above / below the centre c (a flat back over a deep belly),
//   n = superellipse power of the cross-section (2 = ellipse, 3-4 = boxy like a skull); default 2.
// The cross-section stands square to the spine. Its "up" starts as opts.ref (default +y) and is carried along the
// spine (parallel transport), so a limb may run down and bend forward without a twist. Catmull-Rom through the
// sections (`sub` rings per pair), both ends closed with a fan (give the end sections a small w/up/dn for a tip).
// uv: u along the spine (0 first section, 1 last), v round it (0 and 1 = belly line, 0.25 = +side, 0.5 = back).
// geo.userData.set(sections) moves the same skin (same section count): call it from a prop's update with joints
// worked out from the prop state, so neck, legs and tail bend as one skin. A pure function of the sections.
export function makeLoft(sections, { sub = 5, radial = 24, ref = [0, 1, 0] } = {}) {
  const n = sections.length, rings = (n - 1) * sub + 1, row = radial + 1, verts = rings * row + 2;
  const pos = new Float32Array(verts * 3), uv = new Float32Array(verts * 2), idx = [];
  for (let k = 0; k < rings; k++) for (let j = 0; j <= radial; j++) { const v = k * row + j; uv[v * 2] = k / (rings - 1); uv[v * 2 + 1] = j / radial; }
  uv[rings * row * 2] = 0; uv[rings * row * 2 + 1] = 0.5; uv[(rings * row + 1) * 2] = 1; uv[(rings * row + 1) * 2 + 1] = 0.5;
  for (let k = 0; k < rings - 1; k++) for (let j = 0; j < radial; j++) { const a = k * row + j, b = a + row; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  for (let j = 0; j < radial; j++) { idx.push(rings * row, j + 1, j); const a = (rings - 1) * row + j; idx.push(rings * row + 1, a, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const cr = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);
  const C = new Float32Array(rings * 3), W = new Float32Array(rings * 4);
  g.userData.set = (S) => {
    if (S.length !== n) throw new Error(`makeLoft: ${S.length} sections, built with ${n}`);
    const at = (i) => S[Math.max(0, Math.min(n - 1, i))];
    for (let k = 0; k < rings; k++) {
      const i = Math.min(n - 2, Math.floor(k / sub)), f = k / sub - i, a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
      for (let m = 0; m < 3; m++) C[k * 3 + m] = cr(a.c[m], b.c[m], c.c[m], d.c[m], f);
      const lo = (key) => Math.max(Math.min(b[key], c[key]) * 0.5, 1e-4);   // never overshoot below half the smaller neighbour
      W[k * 4] = Math.max(lo("w"), cr(a.w, b.w, c.w, d.w, f)); W[k * 4 + 1] = Math.max(lo("up"), cr(a.up, b.up, c.up, d.up, f));
      W[k * 4 + 2] = Math.max(lo("dn"), cr(a.dn, b.dn, c.dn, d.dn, f)); W[k * 4 + 3] = b.n === undefined && c.n === undefined ? 2 : (b.n ?? 2) + ((c.n ?? 2) - (b.n ?? 2)) * f;
    }
    let ux = ref[0], uy = ref[1], uz = ref[2];
    for (let k = 0; k < rings; k++) {
      const p = Math.max(0, k - 1) * 3, q = Math.min(rings - 1, k + 1) * 3;
      let tx = C[q] - C[p], ty = C[q + 1] - C[p + 1], tz = C[q + 2] - C[p + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const dt = ux * tx + uy * ty + uz * tz; let ax = ux - dt * tx, ay = uy - dt * ty, az = uz - dt * tz; const al = Math.hypot(ax, ay, az);
      if (al > 1e-5) { ux = ax / al; uy = ay / al; uz = az / al; }
      const sx = uy * tz - uz * ty, sy = uz * tx - ux * tz, sz = ux * ty - uy * tx;   // side = up x tangent
      const w = W[k * 4], up = W[k * 4 + 1], dn = W[k * 4 + 2], e = 2 / W[k * 4 + 3];
      for (let j = 0; j <= radial; j++) {
        const ang = -Math.PI / 2 + (j / radial) * Math.PI * 2, co = Math.cos(ang), si = Math.sin(ang);
        const cs = Math.sign(co) * Math.abs(co) ** e * w, sn = Math.sign(si) * Math.abs(si) ** e * (si > 0 ? up : dn), v = (k * row + j) * 3;
        pos[v] = C[k * 3] + sx * cs + ux * sn; pos[v + 1] = C[k * 3 + 1] + sy * cs + uy * sn; pos[v + 2] = C[k * 3 + 2] + sz * cs + uz * sn;
      }
    }
    const e0 = rings * row * 3, e1 = e0 + 3, l = (rings - 1) * 3;
    pos[e0] = C[0]; pos[e0 + 1] = C[1]; pos[e0 + 2] = C[2]; pos[e1] = C[l]; pos[e1 + 1] = C[l + 1]; pos[e1 + 2] = C[l + 2];
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
    const N = g.attributes.normal.array;   // the belly seam (v 0 and v 1 are the same place): one normal for both
    for (let k = 0; k < rings; k++) {
      const a = (k * row) * 3, b = (k * row + radial) * 3; let x = N[a] + N[b], y = N[a + 1] + N[b + 1], z = N[a + 2] + N[b + 2]; const m = Math.hypot(x, y, z) || 1;
      x /= m; y /= m; z /= m; N[a] = N[b] = x; N[a + 1] = N[b + 1] = y; N[a + 2] = N[b + 2] = z;
    }
    g.attributes.normal.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  return g.userData.set(sections);
}
