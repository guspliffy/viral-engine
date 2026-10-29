// One seamless surface for an arm and its glove hand (def.hands.seamless): the forearm, palm, fingers and thumb are
// round cones joined by a smooth minimum (Inigo Quilez, iquilezles.org/articles/smin), so the wrist and the finger
// roots grow out of each other with soft fillets instead of separate parts meeting at an ink line. The distance field
// is sampled on a grid snapped to fixed world steps and turned into triangles by surface nets (0fps.net), each vertex
// pulled onto the true surface and lit with the field's own gradient, so the ink outline only draws real silhouettes.
import * as THREE from "three";

// a round cone from a (radius ra) to b (radius rb), with its constants for the exact distance (iquilezles.org
// articles/distfunctions, sdRoundCone with two points)
export function cone(a, b, ra, rb) {
  const ba = [b.x - a.x, b.y - a.y, b.z - a.z], l2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2] || 1e-12;
  const rr = ra - rb, a2 = l2 - rr * rr;
  return { a: [a.x, a.y, a.z], ba, l2, rr, a2, il2: 1 / l2, r1: ra, r2: rb,
    lo: [Math.min(a.x - ra, b.x - rb), Math.min(a.y - ra, b.y - rb), Math.min(a.z - ra, b.z - rb)],
    hi: [Math.max(a.x + ra, b.x + rb), Math.max(a.y + ra, b.y + rb), Math.max(a.z + ra, b.z + rb)] };
}
function sdCone(c, x, y, z) {
  const px = x - c.a[0], py = y - c.a[1], pz = z - c.a[2], ba = c.ba, l2 = c.l2;
  const yy = px * ba[0] + py * ba[1] + pz * ba[2], zz = yy - l2;
  const qx = px * l2 - ba[0] * yy, qy = py * l2 - ba[1] * yy, qz = pz * l2 - ba[2] * yy, x2 = qx * qx + qy * qy + qz * qz;
  const y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(c.rr) * c.rr * c.rr * x2;
  if (Math.sign(zz) * c.a2 * z2 > k) return Math.sqrt(x2 + z2) * c.il2 - c.r2;
  if (Math.sign(yy) * c.a2 * y2 < k) return Math.sqrt(x2 + y2) * c.il2 - c.r1;
  return (Math.sqrt(x2 * c.a2 * c.il2) + yy * c.rr) * c.il2 - c.r1;
}
// quadratic smooth minimum: k is the most the join swells; beyond k apart the two shapes don't touch each other
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };

// shape: { arm: [cones], palm: [cones], digits: [[cones], ...] } plus blends { wrist, root, joint } (metres)
// field: arm and palm melt into one body (wrist), each digit melts into that body at its root but never into the
// next digit (a hard minimum between digits, so the fingers don't web together), and a digit's own segments meet
// with a small blend (a soft knuckle crease instead of a ball)
function bound(list) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const c of list) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], c.lo[i]); hi[i] = Math.max(hi[i], c.hi[i]); }
  return { lo, hi };
}
const boxDist = (b, x, y, z) => {
  const dx = b.lo[0] - x > 0 ? b.lo[0] - x : x - b.hi[0] > 0 ? x - b.hi[0] : 0, dy = b.lo[1] - y > 0 ? b.lo[1] - y : y - b.hi[1] > 0 ? y - b.hi[1] : 0;
  const dz = b.lo[2] - z > 0 ? b.lo[2] - z : z - b.hi[2] > 0 ? z - b.hi[2] : 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
// a chain of cones blended by k; a cone whose box is more than k further than the nearest so far can't change it
const chain = (list, x, y, z, k) => {
  let d = Infinity;
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; if (d !== Infinity && boxDist(c, x, y, z) - k > d) continue;
    const s = sdCone(c, x, y, z); d = d === Infinity ? s : smin(d, s, k);
  }
  return d;
};

export function field(shape) {
  const { arm, palm, digits, cuff = [], wrist = 0.012, root = 0.009, joint = 0.003, palmK = 0.02, sep = 0 } = shape;
  const dg = digits.filter((d) => d.length).map((d) => ({ list: d, box: bound(d) }));
  // act: per digit, whether it can matter near this point (a block test), so far digits cost nothing
  return (x, y, z, act = null) => {
    let body = palm.length ? chain(palm, x, y, z, palmK) : 1;
    if (arm.length) body = smin(chain(arm, x, y, z, joint), body, wrist);
    // the digits together first (kept apart by only a crease's blend), then that hand of digits into the body: a far
    // digit that can't reach below the body's own value + the root blend is left out, which changes nothing
    let D = Infinity;
    const cut = body + root;
    for (let i = 0; i < dg.length; i++) {
      if ((act && !act[i]) || boxDist(dg[i].box, x, y, z) - sep > Math.min(D, cut)) continue;
      const c = chain(dg[i].list, x, y, z, joint); D = D === Infinity ? c : smin(D, c, sep);
    }
    let d = D === Infinity ? body : smin(body, D, root);
    // a glove cuff: its own ring round the wrist, joined with only a crease's blend so it reads as a separate rim
    if (cuff.length) d = smin(d, chain(cuff, x, y, z, joint), joint);
    return d;
  };
}

// mesh the shape with surface nets on an h-metre grid (snapped to multiples of h, so a still hand gives the same
// mesh every frame). Returns a BufferGeometry with positions and field normals, in the shape's own space.
export function meshShape(shape, h = 0.003, old = null, inkFade = [-5, 15]) {
  const f = field(shape), all = [...shape.arm, ...shape.palm, ...shape.digits.flat(), ...(shape.cuff || [])], b = bound(all);
  const pad = 2 * h + Math.max(shape.wrist ?? 0.012, shape.root ?? 0.009) * 0.5;
  const o = b.lo.map((v) => Math.floor((v - pad) / h) * h), n = b.hi.map((v, i) => Math.ceil((v + pad - o[i]) / h) + 1);
  const [nx, ny, nz] = n, F = new Float32Array(nx * ny * nz), B = 8, half = (B * h) / 2, rad = Math.sqrt(3) * (half + h);
  const dg = shape.digits.filter((d) => d.length).map((d) => bound(d)), act = new Uint8Array(dg.length);
  // blocks: the field at a block's centre tells whether the surface can pass through it; far blocks get a sign only,
  // and only cells in or next to a near block are searched for the surface
  const mx = Math.ceil(nx / B), my = Math.ceil(ny / B), mz = Math.ceil(nz / B), near = new Uint8Array(mx * my * mz);
  // a far block's points get the centre's value less the most they can be closer (a lower bound, at least h): the
  // sign is all a far point needs, and a near cell next to it still interpolates a sensible crossing
  const h2 = Math.sqrt(3) * 0.5 * h, rad2 = h2 + h;
  const fill = (x0, y0, z0, w, d, r) => {
    const v = d > 0 ? d - r : d + r;
    for (let k = z0; k < Math.min(z0 + w, nz); k++) for (let j = y0; j < Math.min(y0 + w, ny); j++) for (let i = x0; i < Math.min(x0 + w, nx); i++) F[i + nx * (j + ny * k)] = v;
  };
  for (let bz = 0; bz < nz; bz += B) for (let by = 0; by < ny; by += B) for (let bx = 0; bx < nx; bx += B) {
    const cx = o[0] + (bx + B / 2) * h, cy = o[1] + (by + B / 2) * h, cz = o[2] + (bz + B / 2) * h;
    const dc = f(cx, cy, cz), far = Math.abs(dc) > rad;
    if (far) { fill(bx, by, bz, B, dc, Math.sqrt(3) * half); continue; }
    near[bx / B + mx * (by / B + my * (bz / B))] = 1;
    for (let i = 0; i < dg.length; i++) act[i] = boxDist(dg[i], cx, cy, cz) < rad + 0.02 ? 1 : 0;
    // inside a near block, the same test on 2-cell sub-blocks: only points close to the surface get their own value
    for (let sz = bz; sz < Math.min(bz + B, nz); sz += 2) for (let sy = by; sy < Math.min(by + B, ny); sy += 2) for (let sx = bx; sx < Math.min(bx + B, nx); sx += 2) {
      const ds = f(o[0] + (sx + 0.5) * h, o[1] + (sy + 0.5) * h, o[2] + (sz + 0.5) * h, act);
      if (Math.abs(ds) > rad2) { fill(sx, sy, sz, 2, ds, h2); continue; }
      for (let k = sz; k < Math.min(sz + 2, nz); k++) for (let j = sy; j < Math.min(sy + 2, ny); j++) for (let i = sx; i < Math.min(sx + 2, nx); i++)
        F[i + nx * (j + ny * k)] = f(o[0] + i * h, o[1] + j * h, o[2] + k * h, act);
    }
  }
  // one vertex per cell the surface crosses (made when a crossing edge first needs it): the mean of its edge crossings,
  // then one Newton step onto the surface
  const cell = new Int32Array(nx * ny * nz).fill(-1), pos = [], nrm = [], E = 1e-4;
  const corner = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1];
  const edges = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  const v = new Float64Array(8), off = [0, 1, 2, 3, 4, 5, 6, 7].map((c) => corner[3 * c] + nx * (corner[3 * c + 1] + ny * corner[3 * c + 2]));
  const vert = (i, j, k) => {
    const id0 = i + nx * (j + ny * k);
    if (cell[id0] >= 0) return cell[id0];
    for (let c = 0; c < 8; c++) v[c] = F[id0 + off[c]];
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (let e = 0; e < 24; e += 2) {
      const p = edges[e], q = edges[e + 1]; if ((v[p] < 0) === (v[q] < 0)) continue;
      const t = v[p] / (v[p] - v[q]), A = 3 * p, Q = 3 * q;
      sx += corner[A] + (corner[Q] - corner[A]) * t; sy += corner[A + 1] + (corner[Q + 1] - corner[A + 1]) * t; sz += corner[A + 2] + (corner[Q + 2] - corner[A + 2]) * t; m++;
    }
    let x = o[0] + (i + sx / m) * h, y = o[1] + (j + sy / m) * h, z = o[2] + (k + sz / m) * h;
    // the gradient there is both the Newton step and the vertex normal (a hair off the surface, close enough)
    const d = f(x, y, z), gx = (f(x + E, y, z) - d) / E, gy = (f(x, y + E, z) - d) / E, gz = (f(x, y, z + E) - d) / E;
    const g2 = gx * gx + gy * gy + gz * gz || 1, st = Math.max(-h, Math.min(h, d)) / g2, gl = Math.sqrt(g2);
    x -= gx * st; y -= gy * st; z -= gz * st;
    // kept inside its own cell: a vertex pulled into the next cell folds its quads over (dark specks)
    x = Math.min(Math.max(x, o[0] + i * h), o[0] + (i + 1) * h); y = Math.min(Math.max(y, o[1] + j * h), o[1] + (j + 1) * h); z = Math.min(Math.max(z, o[2] + k * h), o[2] + (k + 1) * h);
    cell[id0] = pos.length / 3; pos.push(x, y, z); nrm.push(gx / gl, gy / gl, gz / gl);
    return cell[id0];
  };
  // a quad for every grid edge the surface crosses, joining the four cells round that edge, wound to face outwards; a
  // far block has no crossing within a cell of its points, so only near blocks are searched
  const idx = [], quads = [];
  const fit = (a, b, c) => {
    const ax = pos[3 * a], ay = pos[3 * a + 1], az = pos[3 * a + 2], ux = pos[3 * b] - ax, uy = pos[3 * b + 1] - ay, uz = pos[3 * b + 2] - az, vx = pos[3 * c] - ax, vy = pos[3 * c + 1] - ay, vz = pos[3 * c + 2] - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1e-20;
    return (nx * (nrm[3 * a] + nrm[3 * b] + nrm[3 * c]) + ny * (nrm[3 * a + 1] + nrm[3 * b + 1] + nrm[3 * c + 1]) + nz * (nrm[3 * a + 2] + nrm[3 * b + 2] + nrm[3 * c + 2])) / l;
  };
  const quad = (a, b, c, d, flip) => { if (flip) quads.push(a, d, c, b); else quads.push(a, b, c, d); };
  for (let bz = 0; bz < nz; bz += B) for (let by = 0; by < ny; by += B) for (let bx = 0; bx < nx; bx += B) {
    if (!near[bx / B + mx * (by / B + my * (bz / B))]) continue;
    for (let k = Math.max(bz, 1); k < Math.min(bz + B, nz - 1); k++) for (let j = Math.max(by, 1); j < Math.min(by + B, ny - 1); j++) for (let i = Math.max(bx, 1); i < Math.min(bx + B, nx - 1); i++) {
      const id = i + nx * (j + ny * k), s0 = F[id] < 0;
      if (s0 !== F[id + 1] < 0) quad(vert(i, j - 1, k - 1), vert(i, j, k - 1), vert(i, j, k), vert(i, j - 1, k), !s0);
      if (s0 !== F[id + nx] < 0) quad(vert(i - 1, j, k - 1), vert(i - 1, j, k), vert(i, j, k), vert(i, j, k - 1), !s0);
      if (s0 !== F[id + nx * ny] < 0) quad(vert(i - 1, j - 1, k), vert(i, j - 1, k), vert(i, j, k), vert(i - 1, j, k), !s0);
    }
  }
  // relax: each vertex moves half way to the middle of its neighbours along the surface, then back onto it, once;
  // this irons out the folds surface nets leaves in tight creases (they showed as dark specks)
  const nv = pos.length / 3, sum = new Float64Array(nv * 3), cnt = new Uint16Array(nv);
  for (let r = 0; r < 1; r++) {
    sum.fill(0); cnt.fill(0);
    for (let q = 0; q < quads.length; q += 4) for (let e = 0; e < 4; e++) {
      const a = quads[q + e], b = quads[q + ((e + 1) & 3)];
      sum[3 * a] += pos[3 * b]; sum[3 * a + 1] += pos[3 * b + 1]; sum[3 * a + 2] += pos[3 * b + 2]; cnt[a]++;
    }
    for (let v = 0; v < nv; v++) {
      if (!cnt[v]) continue;
      let dx = sum[3 * v] / cnt[v] - pos[3 * v], dy = sum[3 * v + 1] / cnt[v] - pos[3 * v + 1], dz = sum[3 * v + 2] / cnt[v] - pos[3 * v + 2];
      const nd = dx * nrm[3 * v] + dy * nrm[3 * v + 1] + dz * nrm[3 * v + 2]; dx -= nd * nrm[3 * v]; dy -= nd * nrm[3 * v + 1]; dz -= nd * nrm[3 * v + 2];
      let x = pos[3 * v] + dx * 0.5, y = pos[3 * v + 1] + dy * 0.5, z = pos[3 * v + 2] + dz * 0.5;
      const d = f(x, y, z), gx = (f(x + E, y, z) - d) / E, gy = (f(x, y + E, z) - d) / E, gz = (f(x, y, z + E) - d) / E, g2 = gx * gx + gy * gy + gz * gz || 1, st = Math.max(-h, Math.min(h, d)) / g2;
      x -= gx * st; y -= gy * st; z -= gz * st; pos[3 * v] = x; pos[3 * v + 1] = y; pos[3 * v + 2] = z;
      const l = Math.sqrt(g2); nrm[3 * v] = gx / l; nrm[3 * v + 1] = gy / l; nrm[3 * v + 2] = gz / l;
    }
  }
  // a quad splits along whichever diagonal keeps both triangles facing the way the surface does (the other one folds
  // a triangle over at a saddle); a fold left over is turned to face out
  const tri = (p, q, r) => (fit(p, q, r) < 0 ? idx.push(p, r, q) : idx.push(p, q, r));
  for (let q = 0; q < quads.length; q += 4) {
    const a = quads[q], b = quads[q + 1], c = quads[q + 2], d = quads[q + 3];
    if (Math.min(fit(a, b, c), fit(a, c, d)) >= Math.min(fit(a, b, d), fit(b, c, d))) { tri(a, b, c); tri(a, c, d); } else { tri(a, b, d); tri(b, c, d); }
  }
  // ink weight per vertex (ASW's Guilty Gear line lecture: no line in valleys): 1 where the surface curves away
  // (convex, a silhouette), fading to 0 where it folds in (between fingers, the wrist fillet), from how far its
  // neighbours rise above its tangent plane
  const ink = new Float32Array(nv), bend = new Float64Array(nv); cnt.fill(0);
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) {
    const a = idx[t + e], b = idx[t + ((e + 1) % 3)], dx = pos[3 * b] - pos[3 * a], dy = pos[3 * b + 1] - pos[3 * a + 1], dz = pos[3 * b + 2] - pos[3 * a + 2];
    const l2 = dx * dx + dy * dy + dz * dz || 1e-12;
    bend[a] += (2 * (dx * nrm[3 * a] + dy * nrm[3 * a + 1] + dz * nrm[3 * a + 2])) / l2; cnt[a]++;
    bend[b] -= (2 * (dx * nrm[3 * b] + dy * nrm[3 * b + 1] + dz * nrm[3 * b + 2])) / l2; cnt[b]++;
  }
  for (let v = 0; v < nv; v++) { const k = cnt[v] ? bend[v] / cnt[v] : 0, u = Math.min(1, Math.max(0, (k - inkFade[0]) / (inkFade[1] - inkFade[0]))); ink[v] = 1 - u * u * (3 - 2 * u); }
  const geo = old || new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("ink", new THREE.Float32BufferAttribute(ink, 1));
  geo.setIndex(idx); geo.computeBoundingSphere(); geo.computeBoundingBox();
  return geo;
}

// the ink line of a seamless skin (and of the arm tube under it): the surface pushed out like three's OutlineEffect does
// (a fixed share of the screen) but only across the screen, not towards the camera, and by the vertex's ink weight, so
// the line thins away in creases. OutlineEffect's push towards the camera made one part's line show through another
// part close in front of it as dark specks. color, thickness: the look's line for the limbs, set each frame by the owner
export function inkMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { thickness: { value: 0 }, color: { value: new THREE.Color(0, 0, 0) }, ...THREE.UniformsLib.fog },
    fog: true,
    vertexShader: [
      "#include <common>", "#include <fog_pars_vertex>", "#include <logdepthbuf_pars_vertex>",
      "attribute float ink; uniform float thickness;",
      "void main() {",
      "  vec3 transformed = position;",
      "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vec4 pos = projectionMatrix * mvPosition;",
      "  vec4 pos2 = projectionMatrix * modelViewMatrix * vec4(position - 0.01 * normal, 1.0);",
      "  vec2 d = pos.xy / pos.w - pos2.xy / pos2.w; float l = length(d);",
      "  gl_Position = pos; if (l > 1e-9) gl_Position.xy += d / l * thickness * ink * pos.w;",
      "  #include <logdepthbuf_vertex>", "#include <fog_vertex>",
      "}",
    ].join("\n"),
    fragmentShader: [
      "#include <common>", "#include <fog_pars_fragment>", "#include <logdepthbuf_pars_fragment>",
      "uniform vec3 color;",
      "void main() {", "  #include <logdepthbuf_fragment>", "  gl_FragColor = vec4(color, 1.0);",
      "  #include <tonemapping_fragment>", "#include <colorspace_fragment>", "#include <fog_fragment>", "}",
    ].join("\n"),
  });
}
