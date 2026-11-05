// The three Little Chaos Club designs (reference pack 2026-11-05, references/friends-v1/): each species' head, torso,
// ears, feet, clothing details and colours, built once per character from numbers. friends.js poses them.
//
// Frames: the torso's own frame has its origin at the hip centre (root y = anatomy.hip[1]); the head's at the neck
// pivot (root y = anatomy.neckY); +y up, +z front, anatomical right -x. All sides below are ANATOMICAL: "left" is +x.
// Colours are the pack's sRGB albedos (CHARACTER-SPEC.json palette), calibrated by eye under the template light.
import * as THREE from "three";
import { ellipsoid, roundBox, union, smin, smax, blobMesh, rayHit, gradient, tubeMesh, capped, smoothPath, mixHex, sstep, vnoise } from "./friends-geo.js";
import { inkMat } from "../costumes-art.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// a matte material for one colour role; vertex colours carry the painted markings. lookRole: looks.js shading role
// (skin: the warm skin/fur ramp; cloth: fabric), line: the outline's own colour (a vertex-coloured material is white)
// mirror scale (-1) turns a mesh inside out: swap each triangle's 2nd and 3rd vertex (indexed or not) to turn it back
function flipWinding(g) {
  if (g.index) { const I = g.index; for (let i = 0; i < I.count; i += 3) { const a = I.getX(i + 1); I.setX(i + 1, I.getX(i + 2)); I.setX(i + 2, a); } I.needsUpdate = true; return; }
  for (const k in g.attributes) {
    const A = g.attributes[k], n = A.itemSize, arr = A.array;
    for (let t = 0; t < A.count; t += 3) for (let c = 0; c < n; c++) { const i1 = (t + 1) * n + c, i2 = (t + 2) * n + c, v = arr[i1]; arr[i1] = arr[i2]; arr[i2] = v; }
    A.needsUpdate = true;
  }
}
export function mat(color, { role = "skin", line = null, vc = false, rough = 0.85, side = THREE.FrontSide } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: vc ? "#ffffff" : color, roughness: rough, vertexColors: vc, side });
  // the look darkens the outline from this colour (looks.js); a vertex-coloured material is white, so name its own
  m.userData.lookRole = role; m.userData.lineColor = color;
  return m;
}
const mesh = (g, m, name) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; if (name) o.name = name; return o; };

// a ring round a blob surface at height y (the field's own frame): points where horizontal rays from the axis leave
// it, pushed out by `out` (a hem band, a cuff, a collar sitting on the surface). zc: the axis' z
function ringAt(field, y, out, n = 56, zc = 0, tilt = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = V(Math.sin(a), Math.sin(a) * 0 + tilt * Math.cos(a), Math.cos(a)).normalize(), h = rayHit(field, V(0, y, zc), d, 1);
    if (h) pts.push(h.pos.addScaledVector(gradient(field, h.pos), out));
  }
  return new THREE.CatmullRomCurve3(pts, true, "centripetal");
}
const ringMesh = (curve, r, m, name) => mesh(new THREE.TubeGeometry(curve, 96, r, 8, true), m, name);
// a line drawn on a surface: the points (x, y) on the front (or back, dir -1) of the field, lifted by `out`
function lineOn(field, xy, out, dir = 1, zc = 0) {
  return xy.map(([x, y]) => { const h = rayHit(field, V(x * 0.2, y, zc), V(x * 0.8, 0, dir).normalize(), 1); return h ? h.pos.addScaledVector(gradient(field, h.pos), out) : V(x, y, 0); });
}
// a point on the front (dir 1) or back (-1) of a field straight ahead of (x, y): true x and y, unlike lineOn's fan
function onFront(field, xy, out, dir = 1) {
  return xy.map(([x, y]) => { const h = rayHit(field, V(x, y, 0), V(0, 0, dir), 1) || rayHit(field, V(x * 0.2, y, 0), V(x * 0.8, 0, dir).normalize(), 1); return h ? h.pos.addScaledVector(gradient(field, h.pos), out) : V(x, y, 0); });
}
// a small sculpted fur tuft: a curved cone from `at` along `dir`, bending by `bend`, base radius r, length len
function tuft(at, dir, bend, r, len, m) {
  const d = dir.clone().normalize(), b = bend.clone(), pts = [];
  for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(at.clone().addScaledVector(d, len * u).addScaledVector(b, len * u * u)); }
  return mesh(tubeMesh(pts, { radial: 8, radius: (u) => r * (1 - u) ** 0.8 * Math.min(1, (u + 0.02) / 0.12) }), m, "tuft");
}

// detail kit (Jonny 5 Nov 2026: "every new character ... the handdrawn ghibli anime style, and very detailed"):
// a fixed hash for jitter (renders stay deterministic), a fur fringe round a silhouette, whiskers, ribbed bands and
// stitched seams. All static meshes built once; they ride their part (head, ear, torso) like the tufts above
const hsh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// a ring of tufts round a field's outline seen from the front: angle a from straight up (0) to the sides (±π/2) and
// below, in the plane tipped back by zDir; each tuft points out along its ray, swept back and down a little
function fringe(field, c, { from, to, n, zDir = 0, zJit = 0, len, r, sweep = V(0, -0.15, -0.45), matOf, seed = 1, sink = 0.012 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = from + (to - from) * ((i + 0.25 + 0.5 * hsh(seed + i)) / n);
    const d = V(Math.sin(a), Math.cos(a), zDir + zJit * (hsh(seed * 11 + i) - 0.5)).normalize(), h = rayHit(field, c, d, 1);
    if (!h) continue;
    const g = gradient(field, h.pos), k = 0.75 + 0.5 * hsh(seed * 7 + i);
    out.push(tuft(h.pos.clone().addScaledVector(g, -sink), g.clone().add(d).normalize(), sweep.clone().add(V(0, 0, 0.2 * (hsh(seed * 3 + i) - 0.5))), r * (0.85 + 0.3 * hsh(seed * 5 + i)), len * k, matOf(h.pos)));
  }
  return out;
}
// whiskers: thin pale hairs from a muzzle point, fanning out sideways; no outline (a line round a hair doubles it)
function whiskers(field, from, s, m, { n = 3, len = 0.075, spread = 0.18 } = {}) {
  const out = [], h = rayHit(field, from, V(s, -0.05, 0.55).normalize(), 0.5);
  if (!h) return out;
  for (let i = 0; i < n; i++) {
    const dy = (i - (n - 1) / 2) * spread, o = h.pos.clone().add(V(0, dy * 0.06, 0));
    const pts = [0, 0.33, 0.66, 1].map((u) => o.clone().add(V(s * len * u, dy * len * u - 0.012 * u * u, -0.25 * len * u)));
    out.push(mesh(tubeMesh(pts, { radial: 5, radius: (u) => 0.0022 * (1 - 0.7 * u) }), m, "whisker"));
  }
  return out;
}
// a ribbed knit band: a tube round a ring with darker ribs across it (vertex colours by the tube's u)
function ribbedRing(curve, r, base, rib, ribs, name) {
  const g = new THREE.TubeGeometry(curve, Math.max(96, ribs * 2), r, 8, true), uv = g.attributes.uv, C = new Float32Array(uv.count * 3), a = new THREE.Color(base), b = new THREE.Color(rib), c = new THREE.Color();
  for (let i = 0; i < uv.count; i++) { c.copy(a).lerp(b, sstep(0.25, 0.6, Math.abs(Math.sin(uv.getX(i) * Math.PI * ribs)))); C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  return mesh(g, mat(base, { role: "cloth", vc: true, line: rib }), name);
}
// a sewn seam: a thin raised line along points on the surface
const seam = (pts, m, r = 0.0035, name = "seam") => mesh(tubeMesh(smoothPath(pts, Math.max(12, pts.length * 4)), { radial: 5, radius: capped(() => r, 0.06) }), m, name);
// a drawn crease (the potato cloth kit's fold ink, costumes-art.js inkMat): a thin brush ribbon lying just on the cloth,
// tapered at both ends, in a deep shade of the cloth's own colour. xy: points straight ahead of the field (onFront),
// dir 1 front / -1 back; w its widest half-width. A few per garment, uneven in length, never in a rhythm
function crease(field, xy, color, { dir = 1, w = 0.0032, k = 0.42 } = {}) {
  const c = smoothPath(onFront(field, xy, 0.0025, dir), 16), pos = [], idx = [];
  c.forEach((p, i) => {
    const t = c[Math.min(c.length - 1, i + 1)].clone().sub(c[Math.max(0, i - 1)]).normalize(), n = gradient(field, p), sd = new THREE.Vector3().crossVectors(n, t).normalize();
    const u = i / (c.length - 1), ww = w * (0.45 + 0.55 * u) * Math.pow(Math.sin(Math.PI * u), 0.55) + 0.0003;
    pos.push(...p.clone().addScaledVector(sd, -ww).toArray(), ...p.clone().addScaledVector(sd, ww).toArray());
  });
  for (let i = 0; i < c.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, inkMat(color, k)); m.userData.inkStroke = true; m.name = "crease"; return m;
}
const whiskerMat = (c) => { const m = mat(c, { role: "char" }); m.userData.noOutline = true; return m; };

// ================================================================================================= RUSTY: red panda
function rusty(def) {
  const P = def.palette, A = def.anatomy;
  // ---- head (head frame: neck pivot at root y 0.76; chin -0.03, crown 0.36)
  const head = union([
    { f: ellipsoid([0, 0.2, -0.01], [0.195, 0.165, 0.175]) },
    { f: ellipsoid([-0.155, 0.1, 0.0], [0.115, 0.088, 0.1], [0, 0, 0.35]), k: 0.06 },   // cheek ruffs: the broad cheek fur is
    { f: ellipsoid([0.155, 0.1, 0.0], [0.115, 0.088, 0.1], [0, 0, -0.35]), k: 0.06 },   // part of the head's silhouette
    { f: ellipsoid([0, 0.065, 0.04], [0.15, 0.08, 0.13]), k: 0.05 },                       // jowls under the cheeks
    { f: ellipsoid([0, 0.098, 0.168], [0.076, 0.058, 0.09]), k: 0.04 },                    // the short muzzle, projecting
    { f: ellipsoid([0, 0.045, 0.125], [0.052, 0.034, 0.055]), k: 0.03 },                   // chin
  ]);
  const cream = P.cream, fur = P.fur, furL = P.furLight, dark = "#8c2f12";
  const headPaint = (p, n) => {
    const N = vnoise(p.x * 28, p.y * 28, p.z * 28);
    let c = mixHex(fur, furL, 0.15 + 0.35 * sstep(0.15, 0.32, p.y) * sstep(-0.1, 0.2, n.z) + 0.15 * (N - 0.5));
    // muzzle and chin: cream, round the nose and down the front of the jaw
    const mz = Math.hypot(p.x / 0.085, (p.y - 0.085) / 0.075) + (p.z > 0.07 ? 0 : 9);
    // cheek masks: broad cream patches from under the eyes out over the lower cheek ruffs (red panda), leaving the
    // russet "tear" streak from each eye's inner corner down to the mouth corner
    const ax = Math.abs(p.x), ck = Math.hypot((ax - 0.15) / 0.12, (p.y - 0.095) / 0.075);
    const tear = (1 - sstep(0.016, 0.028, Math.abs((ax - 0.055) - (0.16 - p.y) * 0.55))) * sstep(0.06, 0.08, p.y) * (1 - sstep(0.16, 0.18, p.y)) * sstep(0.07, 0.09, p.z);
    const front = sstep(-0.55, -0.15, n.z);
    let cr = Math.max(1 - sstep(0.85, 1.05, mz), front * (1 - sstep(0.8, 1.05, ck)), p.y < 0.035 && p.z > 0.02 ? 1 : 0);
    cr *= 1 - 0.85 * tear;
    c = c.lerp(new THREE.Color(cream), cr);
    // a darker russet band behind the cheek ruffs and under the chin, where the head meets the body
    if (p.y < 0.02 && !(p.z > 0.05)) c.lerp(new THREE.Color(dark), 0.5);
    return c;
  };
  const headGeo = blobMesh(head, { center: [0, 0.16, 0.01], wSeg: 160, hSeg: 120, paint: headPaint });
  const parts = [];
  const furM = mat(fur, { role: "skin", vc: true, line: "#7a2a10" }), furSolid = mat(fur, { role: "skin", line: "#7a2a10" }), creamM = mat(cream, { role: "skin", line: "#b98a5c" });
  // the nose: small, dark and blunt, on the top of the muzzle's tip
  const nose = mesh(new THREE.SphereGeometry(1, 24, 16), mat(P.nose, { role: "char", rough: 0.5, line: "#140c0a" }), "nose"); nose.scale.set(0.034, 0.022, 0.022); nose.position.set(0, 0.128, 0.246); parts.push(nose);
  // crown tufts (a few sculpted locks swept up and back) and cream cheek tufts on the ruffs' outer edge
  const tm = furSolid;
  for (const [x, z, dx, len, r] of [[0, 0.1, 0, 0.09, 0.03], [-0.05, 0.06, -0.4, 0.08, 0.026], [0.05, 0.06, 0.4, 0.08, 0.026], [-0.025, 0.13, -0.15, 0.07, 0.022], [0.03, 0.12, 0.2, 0.065, 0.02], [0, 0.0, 0, 0.07, 0.03]]) {
    const h = rayHit(head, V(0, 0.2, 0), V(x, 1, z).normalize(), 1);
    if (h) parts.push(tuft(h.pos.clone().addScaledVector(gradient(head, h.pos), -0.012), V(dx, 1, -0.35), V(0, -0.2, -0.6), r, len, tm));
  }
  for (const s of [-1, 1]) for (const [y, dy, len] of [[0.13, 0.15, 0.06], [0.08, -0.25, 0.07], [0.035, -0.6, 0.055]]) {
    const h = rayHit(head, V(0, y, 0), V(s, 0, 0.15).normalize(), 1);
    if (h) parts.push(tuft(h.pos.clone().addScaledVector(gradient(head, h.pos), -0.015), V(s, dy, -0.1), V(0, -0.35, 0), 0.026, len, creamM));
  }
  // the sheet's shaggy outline: a fringe of small locks round the head (russet over the crown and temples, cream on
  // the cheek ruffs), a second, longer ring over the back of the head
  const furOf = (p) => (p.y < 0.14 && Math.abs(p.x) > 0.11 ? creamM : tm);
  parts.push(...fringe(head, V(0, 0.17, 0), { from: -2.15, to: 2.15, n: 30, zDir: -0.3, zJit: 0.3, len: 0.05, r: 0.017, matOf: furOf, seed: 11, sink: 0.015 }));
  parts.push(...fringe(head, V(0, 0.17, -0.02), { from: -2.0, to: 2.0, n: 26, zDir: -1.1, zJit: 1.4, len: 0.055, r: 0.02, sweep: V(0, -0.5, -0.25), matOf: () => tm, seed: 23, sink: 0.018 }));
  const wm = whiskerMat("#f6ecd8");
  for (const s of [-1, 1]) parts.push(...whiskers(head, V(s * 0.03, 0.09, 0.15), s, wm));
  // ears: rounded, cream-lined cups (a russet back, a dark inner bowl, a thick cream rim), one pivot each at the root
  const ear = (s) => {
    const f = union([{ f: ellipsoid([0, 0.075, 0], [0.095, 0.098, 0.034]) }]);
    const g = blobMesh(f, { center: [0, 0.075, 0], wSeg: 40, hSeg: 30, paint: (p, n) => {
      const rr = Math.hypot(p.x / 0.095, (p.y - 0.075) / 0.098);
      if (n.z > 0.2) return rr > 0.72 ? new THREE.Color(cream) : mixHex("#5a2214", "#7a3018", rr);   // the inside: a dark bowl, cream rim
      return mixHex(fur, cream, sstep(0.86, 0.98, rr));
    } });
    // cup the front: the middle of the front face sinks back (a bowl, not a flat disc)
    const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const rr = Math.hypot(x / 0.095, (y - 0.075) / 0.098); if (z > 0) pos.setZ(i, z - 0.045 * Math.max(0, 1 - rr * rr)); pos.setX(i, x * (1 - 0.3 * sstep(0.06, 0.17, y))); }
    g.computeVertexNormals();
    const pivot = new THREE.Group(); pivot.position.set(s * 0.145, 0.295, -0.03); pivot.rotation.set(-0.12, s * 0.3, s * -0.62);
    const m = mesh(g, furM, "ear"); m.userData.bodyPart = "ear"; pivot.add(m);
    // cream fluff growing out of the bowl and tufts on the rim (the sheet's furry ears)
    for (const [x, y, dx, len] of [[-0.035, 0.025, -0.55, 0.065], [-0.012, 0.02, -0.15, 0.08], [0.012, 0.02, 0.15, 0.08], [0.035, 0.025, 0.55, 0.065], [-0.022, 0.045, -0.3, 0.055], [0.022, 0.045, 0.3, 0.055]]) m.add(tuft(V(x, y, -0.005), V(dx, 1, 0.5), V(0, -0.15, 0.3), 0.015, len, creamM));
    return { pivot, mesh: m, rest: [-0.12, s * 0.3, s * -0.62], range: 0.35 };
  };
  // ---- torso (torso frame: hip centre at root y 0.31; hem 0.08, neck 0.45)
  const hood = ellipsoid([0, 0.405, -0.125], [0.155, 0.085, 0.085]);
  const torso = union([
    { f: ellipsoid([0, 0.02, -0.01], [0.185, 0.12, 0.15]) },                      // pelvis (fur)
    { f: ellipsoid([0, 0.175, 0.015], [0.228, 0.19, 0.165]), k: 0.06 },           // the pear's belly (hoodie)
    { f: ellipsoid([0, 0.33, -0.005], [0.19, 0.14, 0.14]), k: 0.06 },             // chest
    { f: ellipsoid([-0.12, 0.395, -0.01], [0.1, 0.065, 0.095]), k: 0.04 },        // shoulders
    { f: ellipsoid([0.12, 0.395, -0.01], [0.1, 0.065, 0.095]), k: 0.04 },
    { f: ellipsoid([0, 0.45, 0.0], [0.085, 0.06, 0.08]), k: 0.04 },               // neck, inside the hood
    { f: hood, k: 0.03 },                                                         // the hood, resting on the upper back
  ]);
  const hemY = 0.085, hood0 = P.hoodie, hoodD = "#56637a";
  const torsoPaint = (p, n) => {
    const hem = hemY + 0.01 * Math.sin(Math.atan2(p.x, p.z) * 2);
    if (p.y < hem) {   // below the hem: dark legs-fur in front and underneath, russet on the hips and back
      const back = sstep(-0.1, -0.6, n.z) * sstep(-0.02, 0.05, p.y), side = sstep(0.12, 0.19, Math.abs(p.x)) * sstep(-0.05, 0.04, p.y);
      return mixHex(P.legs, fur, Math.max(back, side * 0.8));
    }
    const N = vnoise(p.x * 20, p.y * 40, p.z * 20);
    let c = mixHex(hood0, hoodD, 0.25 * N);
    if (hood(p) < 0.004 && p.z < -0.06) c = mixHex(hood0, hoodD, 0.35 + 0.3 * N);   // the hood's folds a shade darker
    return c;
  };
  const torsoGeo = blobMesh(torso, { center: [0, 0.2, 0], wSeg: 96, hSeg: 72, paint: torsoPaint });
  const clothM = mat(hood0, { role: "cloth", vc: true, line: "#2f3646" }), bandM = mat("#5b6880", { role: "cloth", line: "#2f3646" });
  const det = [];
  det.push(ribbedRing(ringAt(torso, hemY - 0.004, 0.004), 0.021, "#5b6880", "#46516a", 70, "hem"));        // ribbed hem band
  det.push(ribbedRing(ringAt(torso, 0.432, -0.002, 48, 0.0), 0.024, "#5b6880", "#46516a", 46, "collar"));   // collar round the neck
  // sewn lines (the sheet's stitched hoodie): the kangaroo pocket's outline, raglan seams from the collar to the
  // armpits, front and back, and the hood's centre seam
  const stitchM = mat("#4a566e", { role: "cloth", line: "#2f3646" });
  for (const s of [-1, 1]) { det.push(seam(onFront(torso, [[s * 0.018, 0.208], [s * 0.06, 0.211], [s * 0.1, 0.208]], 0.003), stitchM)); det.push(seam(onFront(torso, [[s * 0.15, 0.122], [s * 0.153, 0.1], [s * 0.152, hemY + 0.018]], 0.003), stitchM)); }
  for (const s of [-1, 1]) for (const dir of [1, -1]) det.push(seam(onFront(torso, [[s * 0.06, 0.425], [s * 0.1, 0.395], [s * 0.14, 0.35], [s * 0.17, 0.3]], 0.003, dir), stitchM));
  det.push(seam(onFront(torso, [[0, 0.47], [0, 0.42], [0, 0.37]], 0.004, -1), stitchM));
  // creases: pull folds from each armpit toward the belly, the cloth bunching above the ribbed hem, and two under the
  // hood at the back (hand-placed, uneven, as the sheets draw a soft hoodie)
  for (const [xy, dir, w] of [
    [[[-0.17, 0.32], [-0.12, 0.27], [-0.075, 0.245]], 1, 0.0034], [[[0.165, 0.31], [0.115, 0.275], [0.08, 0.258]], 1, 0.003],
    [[[-0.155, 0.27], [-0.125, 0.235]], 1, 0.0024],
    [[[-0.11, 0.13], [-0.08, 0.112], [-0.05, 0.105]], 1, 0.0026], [[[0.045, 0.12], [0.075, 0.108], [0.105, 0.11]], 1, 0.0028], [[[0.17, 0.14], [0.19, 0.115]], 1, 0.0022],
    [[[-0.06, 0.33], [-0.04, 0.27], [-0.05, 0.21]], -1, 0.003], [[[0.07, 0.31], [0.08, 0.24]], -1, 0.0026], [[[0.14, 0.15], [0.12, 0.11]], -1, 0.0024],
  ]) det.push(crease(torso, xy, hood0, { dir, w }));
  // closed zip: the teeth line up the front, the coral pull near the top
  const zp = lineOn(torso, Array.from({ length: 14 }, (_, i) => [0, hemY + 0.012 + (i / 13) * (0.42 - hemY - 0.012)]), 0.003);
  det.push(mesh(tubeMesh(smoothPath(zp, 30), { radial: 6, radius: capped(() => 0.0055, 0.02) }), mat("#b9bcc2", { role: "char", line: "#4a4c52" }), "zip"));
  const pull = new THREE.Group(), pullM = mat(P.zipperPull, { role: "char", line: "#7a3a1e" });
  const tab = mesh(new THREE.BoxGeometry(0.022, 0.05, 0.008), pullM); tab.position.y = -0.026; pull.add(tab);
  const ring = mesh(new THREE.TorusGeometry(0.008, 0.0028, 6, 12), mat("#b9bcc2", { role: "char" })); pull.add(ring);
  const top = zp[zp.length - 3]; pull.position.copy(top).add(V(0, 0, 0.008)); pull.rotation.x = -0.25; det.push(pull);
  // two simple pocket openings (a kangaroo pocket's slanted mouths), sewn lines in the darker blue
  for (const s of [-1, 1]) {
    const pts = onFront(torso, [[s * 0.1, 0.208], [s * 0.128, 0.168], [s * 0.15, 0.122]], 0.003);
    det.push(mesh(tubeMesh(smoothPath(pts, 16), { radial: 6, radius: capped(() => 0.0065, 0.1) }), bandM, "pocket"));
  }
  // the hood's rim: a soft roll along its top edge, shoulder to shoulder over the back
  const rim = lineOn(torso, Array.from({ length: 11 }, (_, i) => { const a = -1 + (2 * i) / 10; return [a * 0.15, 0.445 - 0.05 * a * a]; }), 0.004, -1);
  det.push(mesh(tubeMesh(smoothPath(rim, 30), { radial: 8, radius: capped(() => 0.016, 0.06) }), bandM, "hood-rim"));
  return {
    head: { field: head, geo: headGeo, mat: furM, parts, center: [0, 0.16, 0.01] },
    ears: [ear(-1), ear(1)],
    torso: { field: torso, geo: torsoGeo, mat: clothM, below: furM, det, hemY },
    face: { origin: [0, 0.175, 0.0], gu: 1.25, gv: 0.62, v0: 0.0, lids: mat(fur, { role: "skin", line: "#7a2a10" }) },
    furM: furSolid,
  };
}

// ================================================================================================= PIP: woodland imp
function pip(def) {
  const P = def.palette;
  const head = union([
    { f: ellipsoid([0, 0.185, -0.012], [0.165, 0.158, 0.162]) },        // cranium
    { f: ellipsoid([0, 0.1, 0.035], [0.142, 0.115, 0.125]), k: 0.06 },   // round lower face and cheeks
    { f: ellipsoid([0, 0.035, 0.07], [0.075, 0.048, 0.06]), k: 0.04 },   // chin
    { f: ellipsoid([0, 0.118, 0.155], [0.024, 0.03, 0.03], [0.35, 0, 0]), k: 0.02 },   // a modest projecting nose
  ]);
  const headPaint = (p, n) => {
    let c = mixHex(P.skin, P.skinLight, 0.25 * sstep(-0.2, 0.6, n.y) + 0.2 * sstep(0.1, 0.9, n.z));
    if (p.z > 0.15 && Math.abs(p.x) < 0.03 && p.y > 0.09 && p.y < 0.15) c.lerp(new THREE.Color("#e98f6d"), 0.45 * sstep(0.15, 0.18, p.z));   // a rosy nose tip
    if (p.y < 0.0) c.lerp(new THREE.Color(P.skinShadow), 0.35);
    return c;
  };
  const headGeo = blobMesh(head, { center: [0, 0.15, 0.02], wSeg: 160, hSeg: 120, paint: headPaint });
  const skinM = mat(P.skin, { role: "skin", vc: true, line: "#8a4a32" }), skinS = mat(P.skin, { role: "skin", line: "#8a4a32" });
  const hairM = mat(P.hair, { role: "hair", vc: true, line: "#0f2428" });
  const parts = [];
  // hair: a cap over the scalp and a few sculpted locks, the dominant swept mass toward the anatomical RIGHT (-x)
  // a full mop (the sheet): the cap covers the crown and the back down to the nape, the hairline sits high on the
  // forehead and dips at the temples; the locks hang over it and flick out at the ends
  const cap = union([
    { f: ellipsoid([0, 0.215, -0.025], [0.186, 0.18, 0.186]) },
    { f: ellipsoid([-0.02, 0.3, -0.005], [0.17, 0.085, 0.15]), k: 0.05 },     // volume on top, a little to his right
    { f: ellipsoid([0, 0.12, -0.1], [0.172, 0.13, 0.115]), k: 0.05 },          // the back, down to the nape
  ]);
  const hairline = (p) => 0.035 + 0.215 * sstep(-0.08, 0.1, p.z) - 0.09 * sstep(0.1, 0.165, Math.abs(p.x)) * sstep(-0.05, 0.1, p.z);
  const capCut = (p) => smax(cap(p), hairline(p) - p.y, 0.015);
  parts.push(mesh(blobMesh(capCut, { center: [0, 0.24, -0.04], wSeg: 80, hSeg: 60, paint: (p) => mixHex(P.hair, P.hairAccent, 0.35 * vnoise(p.x * 30, p.y * 30, p.z * 30)) }), hairM, "hair"));
  const lock = (root, ctrl, r, tip = P.hairAccent) => {
    const pts = smoothPath([root, ...ctrl].map((a) => V(...a)), 20);
    return mesh(tubeMesh(pts, { radial: 10, radius: (u) => r * Math.min(1, (u + 0.3) / 0.4) * (1 - u) ** 0.8, color: (u) => mixHex(P.hair, tip, sstep(0.45, 1, u) * 0.6) }), hairM, "hair-lock");
  };
  // [root, path..., radius]; x < 0 is his right
  const L = [
    [[0.04, 0.33, 0.12], [[-0.02, 0.3, 0.18], [-0.07, 0.255, 0.195], [-0.11, 0.225, 0.18]], 0.045],     // the fringe, swept to his right
    [[-0.04, 0.335, 0.11], [[-0.1, 0.3, 0.165], [-0.15, 0.24, 0.16], [-0.18, 0.19, 0.13]], 0.042],
    [[0.085, 0.325, 0.1], [[0.08, 0.29, 0.165], [0.05, 0.25, 0.18]], 0.032],
    [[0.125, 0.3, 0.07], [[0.155, 0.25, 0.12], [0.165, 0.2, 0.11]], 0.03],                               // a small lock to his left
    [[-0.12, 0.34, 0.03], [[-0.2, 0.34, 0.05], [-0.26, 0.29, 0.05]], 0.036],                            // the swept mass, his right
    [[-0.14, 0.27, 0.0], [[-0.2, 0.2, 0.0], [-0.215, 0.12, -0.01], [-0.25, 0.07, 0.0]], 0.04],          // side locks over the ear roots
    [[0.14, 0.27, -0.02], [[0.19, 0.2, -0.02], [0.2, 0.13, -0.03], [0.235, 0.09, -0.02]], 0.036],
    [[-0.11, 0.25, -0.12], [[-0.17, 0.17, -0.16], [-0.18, 0.07, -0.16], [-0.22, 0.025, -0.15]], 0.04],  // the back, flicking out
    [[0.11, 0.25, -0.12], [[0.16, 0.17, -0.16], [0.17, 0.08, -0.16], [0.21, 0.045, -0.14]], 0.038],
    [[0.0, 0.25, -0.17], [[0.0, 0.15, -0.22], [0.0, 0.05, -0.215], [0.03, 0.0, -0.24]], 0.045],
    [[-0.06, 0.3, -0.14], [[-0.1, 0.22, -0.21], [-0.12, 0.12, -0.22], [-0.1, 0.04, -0.245]], 0.04],
    [[0.06, 0.3, -0.14], [[0.09, 0.22, -0.21], [0.11, 0.13, -0.22], [0.125, 0.06, -0.245]], 0.04],
    [[-0.02, 0.38, -0.02], [[-0.08, 0.425, -0.02], [-0.15, 0.415, 0.0]], 0.04],                         // a few messy flicks on top
    [[0.03, 0.38, -0.06], [[0.08, 0.425, -0.1], [0.13, 0.405, -0.14]], 0.036],
    [[-0.06, 0.37, -0.1], [[-0.12, 0.4, -0.16], [-0.18, 0.36, -0.2]], 0.036],
  ];
  for (const [r, c, w] of L) parts.push(lock(r, c, w));
  // the sheet's shaggy mop: many smaller locks over the crown, sides and back (never over the face), each growing out
  // of the cap and flicking out at its end; fixed by a hash, so the hair is the same in every clip
  for (let i = 0; i < 34; i++) {
    const az = -2.6 + 5.2 * ((i + 0.5 * hsh(i + 70)) / 34), el = 0.25 + 0.95 * hsh(i + 90);   // azimuth from the back, elevation
    const d = V(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    if (d.z > 0.35 && d.y < 0.75) continue;   // the face
    const h = rayHit(capCut, V(0, 0.22, -0.03), d, 1);
    if (!h) continue;
    const g = gradient(capCut, h.pos), root = h.pos.clone().addScaledVector(g, -0.01), len = 0.07 + 0.06 * hsh(i + 110);
    const out = g.clone().multiplyScalar(0.28).add(V(0, -0.9, 0)).normalize(), side = V(-d.z, 0, d.x).multiplyScalar(0.4 * (hsh(i + 130) - 0.5));
    const p1 = root.clone().addScaledVector(g, 0.02).addScaledVector(out, len * 0.45).add(side.clone().multiplyScalar(len * 0.3));
    const p2 = p1.clone().addScaledVector(out, len * 0.45).add(side.clone().multiplyScalar(len * 0.5));
    const tip = p2.clone().addScaledVector(g, 0.012 + 0.012 * hsh(i + 150)).add(V(0, 0.01, 0));   // the flick
    parts.push(lock(root.toArray(), [p1.toArray(), p2.toArray(), tip.toArray()], 0.022 + 0.012 * hsh(i + 170)));
  }
  // leaf ears, spreading sideways and a little up: a curved leaf with a thick broad root. The anatomical LEFT ear (+x)
  // has one V notch on its upper outer edge, modelled into its outline so no pose can mirror it
  const ear = (s) => {
    const sh = new THREE.Shape(), n = 40, len = 0.235, notch = s > 0;
    // the outline from the root's top, out along the upper edge to the tip, back along the lower edge (x out, y up)
    const up = (u) => 0.055 * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.8 * (1 - 0.35 * u) + 0.05 * u * u;
    const lo = (u) => -0.045 * Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 0.7 * (1 - u * 0.5) + 0.05 * u * u;
    sh.moveTo(0, up(0.0));
    for (let i = 1; i <= n; i++) {
      const u = i / n; let y = up(u);
      if (notch && u > 0.62 && u < 0.74) y -= 0.022 * (1 - Math.abs((u - 0.68) / 0.06));   // the V notch
      sh.lineTo(u * len, y);
    }
    for (let i = n; i >= 0; i--) { const u = i / n; sh.lineTo(u * len, lo(u)); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 3, curveSegments: 4, steps: 1 });
    g.translate(0, 0, -0.006);
    // curl it: the leaf cups forward along its length and the tip lifts
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), u = x / len;
      p.setXYZ(i, x, y + 0.02 * u * u, z + 0.03 * Math.sin(Math.PI * u) - 0.25 * y * y * 4);
      const inner = z > 0 && Math.abs(y) < 0.03 * (1 - u) && u > 0.08 && u < 0.8;
      c.set(inner ? mixHex(P.skin, P.skinShadow, 0.5) : mixHex(P.skin, P.skinLight, 0.3 * u)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    if (s < 0) { g.scale(-1, 1, 1); flipWinding(g); g.computeVertexNormals(); }
    const pivot = new THREE.Group(); pivot.position.set(s * 0.145, 0.165, -0.015); pivot.rotation.set(0, s * -0.25, s * 0.18);
    const m = mesh(g, skinM, notch ? "ear-left-notched" : "ear-right"); m.userData.bodyPart = "ear"; pivot.add(m);
    return { pivot, mesh: m, rest: [0, s * -0.25, s * 0.18], range: 0.45 };
  };
  // ---- torso (hip centre at root 0.48: waist 0.1, jacket hem 0.13, shoulders 0.4, neck 0.44)
  const torso = union([
    { f: ellipsoid([0, 0.025, 0.0], [0.15, 0.1, 0.112]) },                     // hips (trousers)
    { f: ellipsoid([0, 0.16, 0.005], [0.135, 0.13, 0.1]), k: 0.06 },           // waist
    { f: ellipsoid([0, 0.305, 0.0], [0.158, 0.13, 0.112]), k: 0.06 },          // chest
    { f: ellipsoid([-0.1, 0.375, -0.005], [0.075, 0.05, 0.075]), k: 0.035 },   // shoulders
    { f: ellipsoid([0.1, 0.375, -0.005], [0.075, 0.05, 0.075]), k: 0.035 },
    { f: ellipsoid([0, 0.44, 0.005], [0.045, 0.06, 0.045]), k: 0.03 },         // neck
  ]);
  const hemJ = 0.125, waist = 0.1;
  const torsoPaint = (p, n) => {
    if (p.y > 0.405) return P.skin;   // the neck
    if (p.y < waist) return mixHex(P.trousers, "#5e3236", 0.25 * vnoise(p.x * 30, p.y * 30, p.z * 30));
    // the open jacket: the cream shirt shows in a V at the front, widening to the hem
    const open = p.z > 0.02 && Math.abs(p.x) < 0.045 + 0.035 * sstep(0.4, hemJ, p.y);
    if (open || p.y < hemJ) return mixHex(P.shirt, "#d9c7aa", 0.2 * vnoise(p.x * 20, p.y * 20, p.z * 20) + (p.y < hemJ ? 0.25 : 0));
    return mixHex(P.jacket, "#a86d1c", 0.3 * vnoise(p.x * 18, p.y * 30, p.z * 18));
  };
  const torsoGeo = blobMesh(torso, { center: [0, 0.2, 0], wSeg: 128, hSeg: 96, paint: torsoPaint });
  const clothM = mat(P.jacket, { role: "cloth", vc: true, line: "#5a3a10" }), jacketM = mat(P.jacket, { role: "cloth", line: "#5a3a10" }), jacketD = mat("#a96f1d", { role: "cloth", line: "#5a3a10" });
  const det = [];
  // the jacket's hem band (cropped at the waist, open at the front) and its two front edges
  const hem = ringAt(torso, hemJ + 0.005, 0.006, 64).getSpacedPoints(64).filter((q) => !(q.z > 0.02 && Math.abs(q.x) < 0.085));
  hem.sort((a, b) => Math.atan2(a.x, -a.z) - Math.atan2(b.x, -b.z));
  det.push(mesh(tubeMesh(smoothPath(hem, 60), { radial: 8, radius: capped(() => 0.014, 0.02) }), jacketD, "jacket-hem"));
  for (const s of [-1, 1]) {
    // a chest pocket with a flap and a button on each side (restrained detail)
    const at = rayHit(torso, V(0, 0.27, 0), V(s * 1.0, 0, 1).normalize(), 1);
    if (at) {
      const n = gradient(torso, at.pos), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n);
      const flap = mesh(new THREE.BoxGeometry(0.06, 0.022, 0.01), jacketD, "pocket-flap"); flap.position.copy(at.pos).addScaledVector(n, 0.006); flap.quaternion.copy(q); det.push(flap);
      const btn = mesh(new THREE.SphereGeometry(0.0065, 10, 8), mat("#6b4a2a", { role: "char" }), "button"); btn.position.copy(at.pos).addScaledVector(n, 0.013).add(V(0, -0.006, 0)); det.push(btn);
    }
  }
  // the popped collar: a flared band round the back of the neck, open at the front
  const col = ringAt(torso, 0.4, 0.012, 48).getSpacedPoints(48).filter((q) => !(q.z > 0.03 && Math.abs(q.x) < 0.05));
  col.sort((a, b) => Math.atan2(a.x, -a.z) - Math.atan2(b.x, -b.z));
  const colPts = smoothPath(col, 40);
  det.push(mesh(tubeMesh(colPts, { radial: 8, radius: capped((u) => 0.022 + 0.008 * Math.sin(Math.PI * u), 0.05), ref: V(0, 1, 0) }), jacketM, "collar"));
  // sewn detail (the sheet's work jacket): a top-stitch line above the hem band, both front edges stitched, three
  // buttons down his left front edge, shoulder seams front and back, and the trousers' waistband under the hem
  const stM = mat("#8a5a18", { role: "cloth", line: "#5a3a10" });
  const edgeX = (y) => 0.045 + 0.035 * sstep(0.4, hemJ, y) + 0.008;
  for (const sx of [-1, 1]) det.push(seam(onFront(torso, [0.39, 0.33, 0.27, 0.21, 0.15].map((y) => [sx * edgeX(y), y]), 0.003), stM, 0.0028));
  for (const y of [0.32, 0.25, 0.18]) { const b = onFront(torso, [[edgeX(y) + 0.008, y]], 0.006)[0]; const bt = mesh(new THREE.SphereGeometry(0.0075, 10, 8), mat("#6b4a2a", { role: "char" }), "button"); bt.position.copy(b); det.push(bt); }
  const top = ringAt(torso, hemJ + 0.028, 0.004, 64).getSpacedPoints(64).filter((q) => !(q.z > 0.02 && Math.abs(q.x) < 0.09));
  top.sort((a, b) => Math.atan2(a.x, -a.z) - Math.atan2(b.x, -b.z));
  det.push(seam(top, stM, 0.0028, "hem-stitch"));
  for (const sx of [-1, 1]) for (const dir of [1, -1]) det.push(seam(onFront(torso, [[sx * 0.05, 0.42], [sx * 0.09, 0.4], [sx * 0.13, 0.38], [sx * 0.155, 0.34]], 0.003, dir), stM, 0.0028));
  det.push(ringMesh(ringAt(torso, waist + 0.012, 0.004, 64), 0.012, mat("#5e3236", { role: "cloth", line: "#3a1a1e" }), "waistband"));
  for (const [xy, dir, w] of [
    [[[-0.13, 0.33], [-0.1, 0.29], [-0.085, 0.25]], 1, 0.0028], [[[0.125, 0.3], [0.1, 0.26]], 1, 0.0026], [[[-0.11, 0.175], [-0.095, 0.15]], 1, 0.0022],
    [[[-0.07, 0.34], [-0.05, 0.28], [-0.06, 0.22]], -1, 0.003], [[[0.06, 0.31], [0.075, 0.25], [0.07, 0.2]], -1, 0.0028], [[[-0.11, 0.18], [-0.085, 0.15]], -1, 0.0022],
  ]) det.push(crease(torso, xy, P.jacket, { dir, w }));
  // the trousers' waist and a hint of the belt loops is enough; the cuffs are on the legs (friends.js)
  return {
    head: { field: head, geo: headGeo, mat: skinM, parts, center: [0, 0.15, 0.02] },
    ears: [ear(-1), ear(1)],
    torso: { field: torso, geo: torsoGeo, mat: clothM, det, hemY: hemJ },
    face: { origin: [0, 0.16, 0.0], gu: 1.1, gv: 0.6, v0: 0.0, lids: skinS },
    skinM: skinS,
  };
}

// ================================================================================================= MOSS: capybara
function moss(def) {
  const P = def.palette;
  // the head: a gently sloped cranium running straight into a long, blunt, rectangular muzzle (no round snout on a ball)
  const muzzle = roundBox([0, 0.135, 0.185], [0.118, 0.092, 0.155], 0.08, [0.12, 0, 0]);
  const head = union([
    { f: ellipsoid([0, 0.2, -0.065], [0.205, 0.15, 0.165]) },                  // cranium, flat on top
    { f: muzzle, k: 0.07 },                                                      // the long muzzle (front at z ~0.34)
    { f: ellipsoid([-0.1, 0.085, 0.0], [0.095, 0.095, 0.13]), k: 0.06 },         // jowls
    { f: ellipsoid([0.1, 0.085, 0.0], [0.095, 0.095, 0.13]), k: 0.06 },
    { f: ellipsoid([0, 0.045, 0.1], [0.11, 0.055, 0.13]), k: 0.05 },             // lower jaw
    { f: ellipsoid([-0.125, 0.262, 0.05], [0.08, 0.062, 0.075], [0, -0.5, 0]), k: 0.05 },  // the eye seats: where the cranium
    { f: ellipsoid([0.125, 0.262, 0.05], [0.08, 0.062, 0.075], [0, 0.5, 0]), k: 0.05 },    // meets the muzzle, facing forward-out
  ]);
  // flatten the very top into a gentle slope down to the muzzle (a capybara's forehead line)
  const field = (p) => smax(head(p), p.y - (0.335 - 0.3 * Math.max(0, p.z + 0.04)), 0.05);
  const headPaint = (p, n) => {
    const N = vnoise(p.x * 26, p.y * 26, p.z * 26);
    let c = mixHex(P.fur, P.furLight, 0.25 + 0.3 * (N - 0.5) + 0.2 * sstep(0.2, 0.33, p.y));
    // the muzzle's front and lower sides: lighter, sandy
    c.lerp(new THREE.Color(P.muzzle), 0.6 * sstep(0.12, 0.26, p.z) * (1 - sstep(0.1, 0.19, p.y)));
    return c;
  };
  const headGeo = blobMesh(field, { center: [0, 0.16, 0.04], wSeg: 160, hSeg: 120, paint: headPaint });
  const furM = mat(P.fur, { role: "skin", vc: true, line: "#5a3a1c" }), furS = mat(P.fur, { role: "skin", line: "#5a3a1c" });
  const parts = [];
  // the broad dark nose: a soft pad over the muzzle's front top, with two nostril commas
  const nose = mesh(new THREE.SphereGeometry(1, 28, 18), mat(P.nose, { role: "skin", line: "#2a1810" }), "nose");
  const nf = rayHit(field, V(0, 0.12, 0.1), V(0, 0.38, 1).normalize(), 1);   // the muzzle's front-top corner
  nose.scale.set(0.088, 0.05, 0.045); nose.position.copy(nf ? nf.pos : V(0, 0.2, 0.32)).add(V(0, -0.004, -0.02)); nose.rotation.x = -0.55; parts.push(nose);
  for (const s of [-1, 1]) {
    const nn = mesh(new THREE.SphereGeometry(1, 12, 8), mat("#2e1c14", { role: "char" }), "nostril"); nn.scale.set(0.022, 0.009, 0.01);
    nn.position.copy(nose.position).add(V(s * 0.038, -0.006, 0.04)); nn.rotation.set(-0.55, 0, s * -0.5); nn.scale.set(0.019, 0.008, 0.009); parts.push(nn);
  }
  // a few sculpted fur tufts on the crown (the sheet's spiky top)
  for (const [x, z, dx, len] of [[0, -0.1, 0, 0.05], [-0.06, -0.08, -0.3, 0.045], [0.06, -0.08, 0.3, 0.045], [0, -0.17, 0, 0.04]]) {
    const h = rayHit(field, V(0, 0.2, -0.06), V(x, 1, z).normalize(), 1);
    if (h) parts.push(tuft(h.pos.clone().addScaledVector(gradient(field, h.pos), -0.01), V(dx, 1, -0.6), V(0, -0.2, -0.4), 0.022, len, furS));
  }
  // the sheet's shaggy coat: a fringe of short locks round the head's outline and over the back of the head, a
  // spiky crest on the crown, and the few dark whisker pores on each side of the muzzle
  parts.push(...fringe(field, V(0, 0.2, -0.06), { from: -2.0, to: 2.0, n: 26, zDir: -0.2, zJit: 0.5, len: 0.04, r: 0.016, sweep: V(0, -0.3, -0.35), matOf: () => furS, seed: 41, sink: 0.012 }));
  parts.push(...fringe(field, V(0, 0.2, -0.06), { from: -2.1, to: 2.1, n: 30, zDir: -1.2, zJit: 1.4, len: 0.06, r: 0.013, sweep: V(0, -0.75, -0.15), matOf: () => furS, seed: 53, sink: 0.012 }));
  parts.push(...fringe(field, V(0, 0.2, -0.08), { from: -0.5, to: 0.5, n: 9, zDir: -0.3, zJit: 0.9, len: 0.055, r: 0.016, sweep: V(0, 0.05, -0.6), matOf: () => furS, seed: 67, sink: 0.01 }));
  const poreM = mat("#5a3a22", { role: "char" }); poreM.userData.noOutline = true;
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const h = rayHit(field, V(0, 0.12, 0.2), V(s * (0.75 + 0.15 * hsh(i + 200)), 0.1 + 0.35 * hsh(i + 210), 0.75).normalize(), 0.5);
    if (h) { const d = mesh(new THREE.SphereGeometry(0.0045 + 0.002 * hsh(i + 220), 8, 6), poreM, "pore"); d.position.copy(h.pos).addScaledVector(gradient(field, h.pos), -0.001); d.scale.z = 0.5; d.lookAt(h.pos.clone().add(gradient(field, h.pos))); parts.push(d); }
  }
  // small high rounded ears
  const ear = (s) => {
    const f = ellipsoid([0, 0.04, 0], [0.05, 0.045, 0.026]);
    const g = blobMesh(f, { center: [0, 0.04, 0], wSeg: 28, hSeg: 20, paint: (p, n) => (n.z > 0.3 && Math.hypot(p.x / 0.05, (p.y - 0.04) / 0.045) < 0.7 ? new THREE.Color("#6e4a30") : mixHex(P.fur, "#8a5a34", 0.4)) });
    const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), rr = Math.hypot(x / 0.05, (y - 0.04) / 0.045); if (z > 0) pos.setZ(i, z - 0.025 * Math.max(0, 1 - rr * rr)); }
    g.computeVertexNormals();
    const pivot = new THREE.Group(); pivot.position.set(s * 0.14, 0.3, -0.15); pivot.rotation.set(-0.1, s * 0.6, s * -0.3); pivot.scale.setScalar(0.72);
    const m = mesh(g, furM, "ear"); m.userData.bodyPart = "ear"; pivot.add(m);
    return { pivot, mesh: m, rest: [-0.1, s * 0.6, s * -0.3], range: 0.15 };
  };
  // ---- torso: a wide barrel (hip centre at root 0.25; hem 0.08, shoulders 0.4, neck 0.43)
  const torso = union([
    { f: ellipsoid([0, 0.02, -0.005], [0.235, 0.13, 0.19]) },                   // hips (fur)
    { f: ellipsoid([0, 0.16, 0.015], [0.278, 0.2, 0.21]), k: 0.07 },            // the barrel
    { f: ellipsoid([0, 0.31, 0.0], [0.245, 0.15, 0.185]), k: 0.07 },            // chest
    { f: ellipsoid([-0.15, 0.37, -0.01], [0.12, 0.07, 0.12]), k: 0.05 },        // shoulders
    { f: ellipsoid([0.15, 0.37, -0.01], [0.12, 0.07, 0.12]), k: 0.05 },
    { f: ellipsoid([0, 0.43, 0.0], [0.12, 0.06, 0.11]), k: 0.05 },              // the short broad neck
  ]);
  const hemY = 0.075;
  const torsoPaint = (p) => {
    if (p.y > 0.445) return P.fur;
    if (p.y < hemY + 0.008 * Math.sin(Math.atan2(p.x, p.z) * 3)) return mixHex(P.fur, P.furLight, 0.3 * vnoise(p.x * 26, p.y * 26, p.z * 26));
    return mixHex(P.sweatshirt, "#6c7548", 0.3 * vnoise(p.x * 18, p.y * 18, p.z * 18));
  };
  const torsoGeo = blobMesh(torso, { center: [0, 0.2, 0], wSeg: 96, hSeg: 72, paint: torsoPaint });
  const clothM = mat(P.sweatshirt, { role: "cloth", vc: true, line: "#3a4224" }), ribM = mat("#717b4b", { role: "cloth", line: "#3a4224" });
  const det = [];
  det.push(ribbedRing(ringAt(torso, hemY, 0.004, 64), 0.024, "#717b4b", "#5d663c", 84, "hem"));
  det.push(ribbedRing(ringAt(torso, 0.425, 0.0, 56), 0.026, "#717b4b", "#5d663c", 64, "crewneck"));
  // dropped-shoulder seams front and back and a side seam each side (the sheet's knit sweater)
  const swM = mat("#626b40", { role: "cloth", line: "#3a4224" });
  for (const sx of [-1, 1]) for (const dir of [1, -1]) det.push(seam(onFront(torso, [[sx * 0.2, 0.39], [sx * 0.225, 0.34], [sx * 0.24, 0.29]], 0.003, dir), swM));
  for (const [xy, dir, w] of [
    [[[-0.22, 0.29], [-0.17, 0.25], [-0.12, 0.235]], 1, 0.0036], [[[0.215, 0.27], [0.165, 0.24]], 1, 0.003],
    [[[-0.15, 0.13], [-0.1, 0.11], [-0.06, 0.105]], 1, 0.003], [[[0.02, 0.115], [0.07, 0.105]], 1, 0.0026], [[[0.17, 0.14], [0.205, 0.115]], 1, 0.0026],
    [[[-0.09, 0.32], [-0.07, 0.25], [-0.085, 0.18]], -1, 0.0034], [[[0.1, 0.3], [0.115, 0.22]], -1, 0.003], [[[-0.02, 0.13], [0.04, 0.11]], -1, 0.0026],
  ]) det.push(crease(torso, xy, P.sweatshirt, { dir, w }));
  // the oatmeal patch pocket on the anatomical LEFT chest (+x), stitched round
  const at = rayHit(torso, V(0, 0.29, 0), V(0.42, 0.02, 1).normalize(), 1), pocket = new THREE.Group();
  if (at) {
    const n = gradient(torso, at.pos), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n);
    const sh = new THREE.Shape(); const w = 0.05, h = 0.06; sh.moveTo(-w, h); sh.lineTo(w, h); sh.lineTo(w, -h + 0.015); sh.quadraticCurveTo(w, -h, w - 0.015, -h); sh.lineTo(-w + 0.015, -h); sh.quadraticCurveTo(-w, -h, -w, -h + 0.015); sh.lineTo(-w, h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 });
    // bend it onto the chest's curve
    const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) ps.setZ(i, ps.getZ(i) - 2.2 * ps.getX(i) ** 2);
    g.computeVertexNormals();
    const pm = mesh(g, mat(P.pocket, { role: "cloth", line: "#8a7550" }), "pocket"); pocket.add(pm);
    const stitch = mesh(new THREE.BoxGeometry(0.096, 0.004, 0.004), mat("#b19c74", { role: "char" })); stitch.position.set(0, h - 0.012, 0.009); pocket.add(stitch);
    // running stitches round the pocket's sides and bottom, just inside its edge
    const stM = mat("#a58d62", { role: "char" }); stM.userData.noOutline = true;
    const ring = [[-w + 0.007, h - 0.02], [-w + 0.007, -h + 0.02], [-w + 0.02, -h + 0.007], [w - 0.02, -h + 0.007], [w - 0.007, -h + 0.02], [w - 0.007, h - 0.02]];
    for (let k = 0; k < ring.length - 1; k++) { const [x0, y0] = ring[k], [x1, y1] = ring[k + 1], L = Math.hypot(x1 - x0, y1 - y0), m2 = Math.max(1, Math.round(L / 0.012)); for (let j = 0; j < m2; j++) { const t = (j + 0.5) / m2, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; const dash = mesh(new THREE.BoxGeometry(L / m2 * 0.55, 0.0025, 0.002), stM, "stitch"); dash.position.set(x, y, 0.0085 - 2.2 * x * x); dash.rotation.z = Math.atan2(y1 - y0, x1 - x0); pocket.add(dash); } }
    pocket.position.copy(at.pos).addScaledVector(n, 0.001); pocket.quaternion.copy(q); det.push(pocket);
  }
  return {
    head: { field, geo: headGeo, mat: furM, parts, center: [0, 0.16, 0.04] },
    ears: [ear(-1), ear(1)],
    torso: { field: torso, geo: torsoGeo, mat: clothM, below: furM, det, hemY },
    face: { origin: [0, 0.22, -0.12], gu: 0.875, gv: 0.62, v0: 0.0, spread: 1.2, spreadV: [0, 0.5], lids: furS },
    furM: furS,
  };
}

export const DESIGNS = { "red-panda": rusty, imp: pip, capybara: moss };
export function buildDesign(def) {
  const f = DESIGNS[def.species];
  if (!f) throw new Error(`friends rig: no design for species "${def.species}" (${def.id})`);
  return f(def);
}
