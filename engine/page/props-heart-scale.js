import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md, section B): THE SCALE and the FEATHER.
// Metres, x right, y up, z toward the default camera; the prop faces +z at rot 0. Every mark is drawn once from its index and
// spec.seed (no tiling, no random, no clock): the same spec, state and t give the same picture. Gold is painted leaf: a long light
// band #fff0b8 on every round part, shade in every recess, leaf seams every 0.085 m at 6 % contrast on the flat faces, wear to bronze
// #6b4612 on 8 % of the area (edges and where hands go), red bole #8a4a2a in 1 rubbed spot of 4. No letters, no glyphs anywhere.
//
// ===== heartscale   the balance: base, fluted pillar, yoke, winged crest, rope beam with lotus finials, pointer over a notched arc
//   plate, two pans on chains (3 chains of 26 links a pan), and the ostrich feather on the right pan. Not a held prop.
//   ORIGIN: the floor under the pillar, beam along x. The HEART pan is LEFT (-x), the FEATHER pan RIGHT (+x). SIZE: 3.55 tall (orb top),
//   beam 3.24 long with the finials, base r 0.42, pans r 0.40. Solid for the checks: base and pillar ONLY (hands touch the pillar and
//   the heart, nothing else); every other mesh is userData.solid = false.
//   spec   seed 1        wear patches, scratches, dents, engraving jitter (hashed)
//          feather true  false leaves the right pan empty
//          tilt, wobble  as the state keys below (a spec value is the start value)
//   STATE KEYS (a "prop" action tweens them; seed jolt, smear and drip with a dur-0 set before the first tween, they are not
//   propState defaults; HEART_SCALE_STATE below lists all five for KIT_STATE if the director wires it)
//     tilt   -1..+1 (0)  heart side down = negative. beam angle a = asin(0.633 tilt) (39.3 degrees at 1). One CLUNK is the director's tween
//                        (0.2 in 3 frames, 15 % overshoot, settled in 9 frames); the pointer rides the beam and drops into the next
//                        notch (its lapis tip sinks into the V cut as it passes a notch angle, rises between).
//                        NOTE: `tilt` is also the engine's lean key (props3d turns a prop by -tilt DEGREES). This prop cancels that
//                        exactly in apply(), so tilt means only the beam here; a spec.tilt of 0.3 is NOT a 0.3 degree lean.
//     wobble 0..1  (0)   beam rocks 2.2 degrees at 1.7 Hz + 0.6 degrees at 4.1 Hz; the pans stay plumb and swing 1 degree about their
//                        hang points a quarter cycle late; the feather tip lifts up to 1 cm. A function of t.
//     jolt   0..1  (0)   the chain links rattle 4 degrees (hashed phases, 8-12 Hz) and the pans bounce 1.5 cm (director: 1 -> 0 in 0.4 s)
//     smear  0..1  (0)   JUICE on the LEFT pan: 5 drip runs over the +z rim (0.05-0.14 long, bulb + a hanging drop), 9 splats on the outer
//                        petals, a pool r 0.12 in the dish, tomato seeds on 1 blob in 3 and 6 in the pool. Pieces pop in one after the
//                        other as smear rises (0 = none, 1 = all). Nothing within 0.06 m of the heart's outline seen from +z.
//     drip   0..1  (0)   runs 2 and 4 of the 5 let a drop fall every 0.9 s (hashed phases) from the pan toward the floor (the pool is
//                        heartjuice's). Only shows with smear > 0.
//   POSITIONS (prop-local, level): pan rim centres (-1.50, 1.10, 0) and (+1.50, 1.10, 0); dish floors 0.07 lower.
//   HEART SEAT S (where heartface's contact point sits, grip rule 2: the heart rides the dish rigidly): with a = asin(0.633 tilt),
//     S = ( -1.5 cos a , 1.03 + 0.95 tilt , 0 )  = ( -1.5 sqrt(1 - 0.4007 tilt^2) , 1.03 + 0.95 tilt , 0 )     + the wobble:
//     d(t) = wobble (2.2 sin(2 pi 1.7 t) + 0.6 sin(2 pi 4.1 t)) degrees (beam angle), s(t) = wobble sin(2 pi 1.7 t - pi/2) degrees (pan swing);
//     the beam angle is th = -a + d and S = P + 1.5 (-cos th, -sin th) + 2.07 (sin s, -cos s)   with P = (0, 3.10) in (x, y) (add the jolt
//     bounce 0.015 jolt sin(2 pi 5.2 t) to y). Add the prop's own x, y, z. 
//     Check values: tilt 0 -> (-1.500, 1.030); tilt -0.8 -> (-1.293, 0.270) (rim 0.34); tilt -1 -> (-1.161, 0.080) (the CHOMP mark's mouth lands
//     at x -1.16); tilt +0.3 -> (-1.473, 1.315). Rim y = S.y + 0.07. The feather pan mirrors it: (+1.5 cos a, 1.03 - 0.95 tilt, 0).
//   GRIPS (level positions; the beam moves, these do not): seatL, seatR (the dish floors at tilt 0), rimL, rimR (the +z rim points
//     0.40 in front of each pan centre), pillarHand [0.080, 0.95, -0.029] (the surface point the jackal's right hand meets, 110 degrees from
//     +z toward +x, the polished and rubbed zone y 0.8-1.2), pivot (the beam axis).
//   LOOK COUNTS (DESIGN 12): 156 chain links (6 chains x 26, none merged), 16 embossed petals + 14 dents + 40 scratches + 60 beads a pan,
//     11 notches on the arc plate (the middle one a feather cut), 54 crest feathers (2 wings x 3 rows x 9), 64 rope twists on the beam, 16
//     pillar flutes, 48 base tongues, 8 collar petals, 5 finial petals an end; feather 44 barbs a side with 4 splits a side, 6 downy tufts.
//   JUICE: #f0502a / #c9341a / #ff9a6b, gloss #fff3e6, seeds #f6d98a (heartjuice owns the same palette).

const DEG = Math.PI / 180, TAU = Math.PI * 2, V3 = THREE.Vector3;
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const C = (h) => new THREE.Color(h);

// ---- value noise (wear patches)
function vnoise(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (i, j, k) => hs(xi + i + (yi + j) * 57.13 + (zi + k) * 113.7 + s * 7.31);
  return mix(mix(mix(L(0, 0, 0), L(1, 0, 0), u), mix(L(0, 1, 0), L(1, 1, 0), u), v), mix(mix(L(0, 0, 1), L(1, 0, 1), u), mix(L(0, 1, 1), L(1, 1, 1), u), v), w);
}

// ---- palettes and gold leaf painting
const PAL = {
  gold: { base: C("#e2b04a"), shade: C("#9a6a1e"), deep: C("#6b4612"), light: C("#fff0b8") },
  lapis: { base: C("#2b4fa2"), shade: C("#1c3470"), deep: C("#14265a"), light: C("#5f86d6") },
  turq: { base: C("#3fa39a"), shade: C("#2a7069"), deep: C("#1d524c"), light: C("#7fd0c4") },
  deepl: { base: C("#1c3470"), shade: C("#142758"), deep: C("#0e1b40"), light: C("#3a5ca8") },
};
const POLISH = C("#ffe9a0"), BOLE = C("#8a4a2a"), TARNISH = C("#9a6a1e"), WHITE = C("#ffffff");
const BAND = new V3(-0.28, 0.74, 0.62).normalize(), KEYL = new V3(0.25, 0.85, 0.45).normalize();
function shade(pal, nx, ny, nz, ao = 0) {
  const c = pal.base.clone(), dk = nx * KEYL.x + ny * KEYL.y + nz * KEYL.z;
  c.lerp(pal.shade, Math.min(1, sstep(0.3, -0.5, dk) * 0.45 + ao * 0.7));
  const db = nx * BAND.x + ny * BAND.y + nz * BAND.z;
  c.lerp(pal.light, sstep(0.80, 0.94, db) * 0.95);
  return c;
}
// wear coverage 0..1 at a point; `edge` 0..1 widens the patches at edges and where hands go
function wearK(x, y, z, seed, edge, f = 15) {
  const n = vnoise(x * f, y * f, z * f, seed), thr = 0.80 - 0.15 * edge;
  return sstep(thr, thr + 0.05, n);
}
const wearCol = (x, y, z, seed) => (hs(Math.floor(x * 12) + Math.floor(y * 12) * 31 + Math.floor(z * 12) * 57 + seed * 5) < 0.25 ? BOLE : PAL.gold.deep);
// the painter for a gold part: o { pal, seed, ao(x,y,z,nx,ny,nz) 0..1 recess, edge(...) 0..1, bright(x,y,z) 0..1 polished, wear 0..1 }
function goldPaint(o = {}) {
  const { pal = PAL.gold, seed = 0, ao = null, edge = null, bright = null, wear = 1, freq = 15 } = o;
  return (x, y, z, nx, ny, nz) => {
    const c = shade(pal, nx, ny, nz, ao ? ao(x, y, z, nx, ny, nz) : 0);
    if (pal === PAL.gold) {
      if (bright) { const k = bright(x, y, z); if (k > 0) c.lerp(POLISH, k * 0.8); }
      const w = wearK(x, y, z, seed, edge ? edge(x, y, z, nx, ny, nz) : 0, freq) * wear;
      if (w > 0) c.lerp(wearCol(x, y, z, seed), w * 0.8);
    }
    return c;
  };
}

// ---- geometry kit
function paintGeo(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); return g;
}
// a nu x nv grid from f(i, j) -> [x, y, z]; wrap closes the u direction; uvf(i, j) -> [u, v]. The winding is fixed by orient()
function gridGeo(nu, nv, f, wrap = false, uvf = null) {
  const cols = wrap ? nu : nu + 1, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { pos.push(...f(i, j)); if (uvf) uv.push(...uvf(i, j)); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * cols + i, b = j * cols + ((i + 1) % cols), c = a + cols, d = b + cols; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (uvf) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); return g;
}
// make the triangles face the way ref(x, y, z) -> [rx, ry, rz] says (summed over the faces), then smooth normals
function orient(g, ref) {
  const p = g.attributes.position, ix = g.index.array, a = new V3(), b = new V3(), c = new V3(), e1 = new V3(), e2 = new V3(), n = new V3();
  let s = 0;
  for (let t = 0; t < ix.length; t += 3) {
    a.fromBufferAttribute(p, ix[t]); b.fromBufferAttribute(p, ix[t + 1]); c.fromBufferAttribute(p, ix[t + 2]);
    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    const r = ref((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3); s += n.x * r[0] + n.y * r[1] + n.z * r[2];
  }
  if (s < 0) for (let t = 0; t < ix.length; t += 3) { const k = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = k; }
  g.computeVertexNormals(); return g;
}
// per-vertex outward vectors (a Float32Array) instead of a function: for tubes
function orientBy(g, refs) {
  const ix = g.index.array, p = g.attributes.position, a = new V3(), b = new V3(), c = new V3(), e1 = new V3(), e2 = new V3(), n = new V3();
  let s = 0;
  for (let t = 0; t < ix.length; t += 3) {
    a.fromBufferAttribute(p, ix[t]); b.fromBufferAttribute(p, ix[t + 1]); c.fromBufferAttribute(p, ix[t + 2]); n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    for (const k of [ix[t], ix[t + 1], ix[t + 2]]) s += n.x * refs[k * 3] + n.y * refs[k * 3 + 1] + n.z * refs[k * 3 + 2];
  }
  if (s < 0) for (let t = 0; t < ix.length; t += 3) { const k = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = k; }
  g.computeVertexNormals(); return g;
}
// a surface of revolution about y from profile rows [[r, y], ...] (going up = outward normals); rmod(theta, j) adds radius
function revolve(prof, nu, rmod = null) {
  return gridGeo(nu, prof.length - 1, (i, j) => { const th = (TAU * i) / nu, r = prof[j][0] + (rmod ? rmod(th, j) : 0); return [r * Math.sin(th), prof[j][1], r * Math.cos(th)]; }, true);
}
// a tube along a closed planar (xy) curve, wire radius rad, rs sides; the outward vectors steer the winding
function sweepPlanar(pts, rad, rs) {
  const n = pts.length, refs = [], pos = [], idx = [];
  for (let k = 0; k < n; k++) {
    const a = pts[(k + n - 1) % n], b = pts[(k + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty), nx = ty / l, ny = -tx / l;
    for (let s = 0; s < rs; s++) { const w = (TAU * s) / rs, cw = Math.cos(w), sw = Math.sin(w); pos.push(pts[k][0] + rad * cw * nx, pts[k][1] + rad * cw * ny, rad * sw); refs.push(cw * nx, cw * ny, sw); }
  }
  for (let k = 0; k < n; k++) for (let s = 0; s < rs; s++) { const a = k * rs + s, b = k * rs + ((s + 1) % rs), c = ((k + 1) % n) * rs + s, d = ((k + 1) % n) * rs + ((s + 1) % rs); idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return orientBy(g, new Float32Array(refs));
}
// an open tube along 3D points with radius rf(t 0..1) (parallel transport, rounded to a point at both ends when rf is 0 there)
function sweepTube(pts, rf, rs = 6) {
  const n = pts.length, pos = [], refs = [], idx = [], T = [];
  for (let k = 0; k < n; k++) T.push(new V3().subVectors(pts[Math.min(n - 1, k + 1)], pts[Math.max(0, k - 1)]).normalize());
  let nrm = Math.abs(T[0].y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0); nrm = nrm.sub(T[0].clone().multiplyScalar(nrm.dot(T[0]))).normalize();
  for (let k = 0; k < n; k++) {
    if (k) { nrm = nrm.sub(T[k].clone().multiplyScalar(nrm.dot(T[k]))); if (nrm.lengthSq() < 1e-9) nrm.set(0, 0, 1); nrm.normalize(); }
    const bn = new V3().crossVectors(T[k], nrm), r = rf(k / (n - 1));
    for (let s = 0; s < rs; s++) { const w = (TAU * s) / rs, cw = Math.cos(w), sw = Math.sin(w), ox = cw * nrm.x + sw * bn.x, oy = cw * nrm.y + sw * bn.y, oz = cw * nrm.z + sw * bn.z; pos.push(pts[k].x + r * ox, pts[k].y + r * oy, pts[k].z + r * oz); refs.push(ox, oy, oz); }
  }
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < rs; s++) { const a = k * rs + s, b = k * rs + ((s + 1) % rs), c = a + rs, d = b + rs; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return orientBy(g, new Float32Array(refs));
}
// place a geometry: columns ex, ey, ez of the matrix and an origin (in place; returns it)
function basis(g, ex, ey, ez, o = [0, 0, 0]) { return g.applyMatrix4(new THREE.Matrix4().makeBasis(new V3(...ex), new V3(...ey), new V3(...ez)).setPosition(o[0], o[1], o[2])); }
function xform(g, o = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  return g.applyMatrix4(new THREE.Matrix4().compose(new V3(...o), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "YXZ")), new V3(...s)));
}
// merge painted geometries (position, normal, color; uv kept only when keepUV)
function merged(list, keepUV = false) {
  const gs = list.filter(Boolean).map((g0) => {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "color" && !(keepUV && k === "uv")) g.deleteAttribute(k);
    if (!g.attributes.color) paintGeo(g, () => WHITE);
    if (keepUV && !g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    return g;
  });
  return mergeGeometries(gs, false);
}
// a lotus petal in its own frame: base at the origin, length +y, bulging toward +z, width along x, bent toward +z by curl radians
function petalGeo({ len, wid, rise = 0.2, curl = 0.5, nu = 6, nv = 9 }) {
  const k = curl / len, W = (v) => 0.5 * wid * (v < 0.4 ? 0.55 + 0.45 * Math.sin((Math.PI / 2) * (v / 0.4)) : Math.pow(Math.max(0, Math.cos((Math.PI / 2) * Math.pow((v - 0.4) / 0.6, 1.1))), 0.75));
  const g = gridGeo(nu, nv, (i, j) => {
    const u = (i / nu) * 2 - 1, v = j / nv, s = len * v, cy = curl ? Math.sin(k * s) / k : s, cz = curl ? (1 - Math.cos(k * s)) / k : 0, ny = curl ? -Math.sin(k * s) : 0, nz = curl ? Math.cos(k * s) : 1;
    const b = wid * rise * (1 - u * u) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, v * 1.15)));
    return [u * W(v), cy + ny * b, cz + nz * b];
  });
  return orient(g, () => [0, 0, 1]);
}

// ---- seam texture for the flat leaf faces (14 x 14 leaves of 0.085 m = 1.19 m; the uv of a flat face is (x, y) / 1.19 + 0.5)
function seamTexture() {
  const N = 1190, cv = document.createElement("canvas"); cv.width = cv.height = N; const g = cv.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, N, N);
  for (let a = 0; a < 14; a++) for (let b = 0; b < 14; b++) { const v = Math.round(250 + 5 * hs(a * 14 + b + 3)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(a * 85, b * 85, 85, 85); }
  g.strokeStyle = "#f0f0f0"; g.lineWidth = 2.2; g.lineCap = "round";
  for (let k = 1; k < 14; k++) {
    g.beginPath(); for (let y = 0; y <= N; y += 8) { const x = k * 85 + 2.2 * Math.sin(y * 0.021 + k * 1.7) + 1.3 * Math.sin(y * 0.0074 + k * 2.9); g[y ? "lineTo" : "moveTo"](x, y); } g.stroke();
    g.beginPath(); for (let x = 0; x <= N; x += 8) { const y = k * 85 + 2.2 * Math.sin(x * 0.019 + k * 2.3) + 1.3 * Math.sin(x * 0.0081 + k * 1.3); g[x ? "lineTo" : "moveTo"](x, y); } g.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const seamUV = (g, ox = 0, oy = 0, plane = "xy") => {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const a = plane === "xz" ? p.getX(i) : p.getX(i), b = plane === "xz" ? p.getZ(i) : p.getY(i); uv[i * 2] = (a - ox) / 1.19 + 0.5; uv[i * 2 + 1] = (b - oy) / 1.19 + 0.5; }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
};

// ---- the pan's lines (pan-local: y 0 at the rim line, the dish floor at -0.07). Rim roll: tube r 0.02 centred (0.38, -0.012).
const yIn = (r) => -0.070 + 0.0528 * Math.pow(r / 0.36, 2.4), yOut = (r) => -0.082 + 0.050 * Math.pow(r / 0.38, 2.4);
const dOut = (r) => ((0.050 * 2.4) / 0.38) * Math.pow(r / 0.38, 1.4);
const dishY = (r) => (r <= 0.3607 ? yIn(r) : -0.012 + Math.sqrt(Math.max(0, 0.0004 - (r - 0.38) * (r - 0.38))));   // the floor and the roll's upper side
const PAN_R = 0.40, PAN_DROP = 2.00, APEX = 0.15, CH_N = 26, LINK = { len: 0.095, wid: 0.045, wire: 0.011 };
const CHAIN_AZ = [-60, 60, 180];   // degrees from +z toward +x

// ---- JUICE look
const JUICE = "#f0502a", JGLOSS = "#fff3e6", JSEED = "#f6d98a";

export const HEART_SCALE_KINDS = {
  heartscale(P) {
    const S = P.spec, seed = S.seed ?? 1;
    const mk = (g, m, parent, solid = false, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; o.userData.solid = solid; parent.add(o); return o; };
    const gmat = (o = {}, k = 1, line = "#4a2f0c") => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.42, ...o }); m.userData.lineColor = line; m.userData.lineK = k; return m; };
    const GM = gmat(), GMT = gmat({ roughness: 0.38 }, 0.55);
    const seamTex = seamTexture(), GMS = gmat({ map: seamTex, roughness: 0.46 });
    const whole = P.whole, fixedG = new THREE.Group(), topG = new THREE.Group(), beamG = new THREE.Group(), tipG = new THREE.Group();
    whole.add(fixedG, topG, beamG); beamG.position.set(0, 3.10, 0);

    // =============================================== BASE: 3 discs, 48 tongues, lapis band, seamed tops
    {
      const discs = [[0.42, 0.0, 0.08], [0.34, 0.08, 0.16], [0.26, 0.16, 0.24]], fil = 0.012, walls = [], tops = [];
      discs.forEach(([r, y0, y1], d) => {
        const prof = [];
        const rows = d === 1 ? [y0, y0 + 0.012, 0.0995, 0.1005, 0.1395, 0.1405, 0.148] : [y0, y0 + 0.012, y0 + 0.03, y0 + 0.05, y1 - fil];
        for (const y of rows) {
          const bandBulge = d === 1 && y > 0.1 && y < 0.14 ? 0.003 : d === 1 && (y === 0.0995 || y === 0.1405) ? 0.0015 : 0;
          prof.push([r + bandBulge - (y === y0 ? 0.012 : 0), y]);   // the bottom row tucks in under the fillet
        }
        for (let a = 1; a <= 5; a++) { const w = (a / 5) * (Math.PI / 2); prof.push([r - fil + fil * Math.cos(w), y1 - fil + fil * Math.sin(w)]); }
        const top = y1;
        const g = revolve(prof, 112); orient(g, (x, y, z) => [x, 0, z]);
        paintGeo(g, (x, y, z, nx, ny, nz) => {
          const lap = d === 1 && y > 0.1 && y < 0.14, inGold = d === 1 && ((y > 0.0975 && y < 0.1) || (y > 0.14 && y < 0.1425));
          const ed = sstep(top - 0.016, top - 0.002, y);
          return goldPaint({ pal: lap ? PAL.lapis : PAL.gold, seed: seed + d, edge: () => ed * 1.15, ao: (X, Y) => (Y < y0 + 0.02 ? 0.5 : inGold ? 0.2 : 0) })(x, y, z, nx, ny, nz);
        });
        walls.push(g);
        // the flat top: an annulus up to the next disc (or the whole top), with the leaf seams
        const rIn = d < 2 ? discs[d + 1][0] : 0.0, rOut = r - fil;
        const flat = gridGeo(112, 3, (i, j) => { const th = (TAU * i) / 112, rr = mix(rIn + (d < 2 ? 0 : 0.0), rOut, j / 3); return [rr * Math.sin(th), top, rr * Math.cos(th)]; }, true);
        orient(flat, () => [0, 1, 0]);
        paintGeo(flat, (x, y, z, nx, ny, nz) => { const rr = Math.hypot(x, z); return goldPaint({ seed: seed + 7 + d, edge: () => sstep(rOut - 0.02, rOut, rr) * 1.2, ao: () => (d < 2 ? sstep(rIn + 0.03, rIn, rr) * 0.7 : 0) })(x, y, z, nx, ny, nz); });
        seamUV(flat, 0, 0, "xz"); tops.push(flat);
      });
      // 48 petal tongues round the lowest edge: width 0.052 at the root, 0.05 high, curled out a little
      const tongues = [];
      for (let k = 0; k < 48; k++) {
        const az = (TAU * (k + 0.5)) / 48, g = petalGeo({ len: 0.05 + 0.004 * (hs(k + seed) - 0.5), wid: 0.052, rise: 0.2, curl: 0.45, nu: 4, nv: 6 });
        basis(g, [Math.cos(az), 0, -Math.sin(az)], [0, 1, 0], [Math.sin(az), 0, Math.cos(az)], [0.4198 * Math.sin(az), 0.007, 0.4198 * Math.cos(az)]);
        tongues.push(g);
      }
      const tg = merged(tongues); paintGeo(tg, (x, y, z, nx, ny, nz) => goldPaint({ seed: seed + 11, edge: () => sstep(0.035, 0.055, y) * 1.1, ao: () => sstep(0.03, 0.007, y) * 0.8 })(x, y, z, nx, ny, nz));
      mk(merged([...walls, tg]), GM, fixedG, true);
      mk(merged(tops, true), GMS, fixedG, true);
    }

    // =============================================== PILLAR: 16 flutes, 6 lapis stripes, polished hand zone, lotus collar of 8
    {
      const NU = 128, rings = [];
      for (let y = 0.24; y <= 3.0201; y += 0.016) rings.push(y);
      for (let k = 0; k < 6; k++) { const a = 0.45 + 0.054 * k; rings.push(a - 0.0006, a + 0.0006, a + 0.03 - 0.0006, a + 0.03 + 0.0006); }
      rings.sort((a, b) => a - b);
      for (let i = 1; i < rings.length; i++) if (rings[i] - rings[i - 1] < 1e-4) rings[i] = rings[i - 1] + 1e-4;
      const bump = (y, y0, w, a) => a * Math.exp(-(((y - y0) / w) ** 2)), Rb = (y) => 0.09 - (0.02 * (y - 0.24)) / 2.78;
      const R = (y) => Rb(y) + bump(y, 0.272, 0.02, 0.010) + bump(y, 0.325, 0.007, 0.005) + bump(y, 2.745, 0.007, 0.005) + bump(y, 2.985, 0.016, 0.013) + bump(y, 3.015, 0.006, 0.006);
      const mask = (y) => sstep(0.34, 0.38, y) * sstep(2.72, 2.68, y), depthF = (th) => 1 - Math.pow(Math.abs(Math.cos(8 * th)), 0.55);
      const g = gridGeo(NU, rings.length - 1, (i, j) => { const th = (TAU * i) / NU, y = rings[j], r = R(y) - 0.0065 * mask(y) * depthF(th); return [r * Math.sin(th), y, r * Math.cos(th)]; }, true);
      orient(g, (x, y, z) => [x, 0, z]);
      const stripe = (y) => { for (let k = 0; k < 6; k++) { const a = 0.45 + 0.054 * k; if (y > a && y < a + 0.03) return true; } return false; };
      paintGeo(g, (x, y, z, nx, ny, nz) => {
        const th = Math.atan2(x, z), az = ((th / DEG) + 360) % 360, lap = stripe(y);
        const hand = Math.exp(-(((az - 110) / 38) ** 2)) * Math.exp(-(((y - 0.95) / 0.2) ** 2));
        return goldPaint({
          pal: lap ? PAL.lapis : PAL.gold, seed: seed + 21, ao: () => depthF(th) * mask(y) * 0.6, wear: 1,
          bright: (X, Y) => sstep(0.78, 0.86, Y) * sstep(1.24, 1.16, Y) * 0.95,
          edge: () => hand * 1.2 + sstep(0.30, 0.25, y) * 0.8 + sstep(3.0, 3.02, y) * 0.5,
        })(x, y, z, nx, ny, nz);
      });
      const parts = [g];
      // the lotus collar: 8 petals at y 2.76-2.88 flaring out from the shaft
      for (let k = 0; k < 8; k++) {
        const az = (TAU * (k + 0.5)) / 8, pg = petalGeo({ len: 0.13, wid: 0.072, rise: 0.22, curl: 0.95, nu: 5, nv: 8 }), r0 = R(2.76) + 0.001;
        basis(pg, [Math.cos(az), 0, -Math.sin(az)], [0, 1, 0], [Math.sin(az), 0, Math.cos(az)], [r0 * Math.sin(az), 2.76, r0 * Math.cos(az)]);
        paintGeo(pg, goldPaint({ seed: seed + 31 + k, ao: (x, y) => sstep(2.79, 2.76, y) * 0.8, edge: (x, y) => sstep(2.86, 2.9, y) }));
        parts.push(pg);
      }
      mk(merged(parts), GM, fixedG, true);
    }

    // =============================================== YOKE, standoffs, ARC PLATE (11 notches), CREST (54 feathers, orb) - all fixed, not solid
    {
      const parts = [], flatParts = [];
      // two cheeks r 0.07 round the pivot, 0.02 thick, a neck down to the pillar top
      for (const sz of [1, -1]) {
        const sh = new THREE.Shape(), a0 = -Math.acos(0.045 / 0.07), yi = 3.10 - Math.sqrt(0.07 * 0.07 - 0.045 * 0.045);
        sh.moveTo(-0.045, 3.02); sh.lineTo(0.045, 3.02); sh.lineTo(0.045, yi); sh.absarc(0, 3.10, 0.07, a0, Math.PI - a0, false); sh.lineTo(-0.045, 3.02);
        const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 28 });
        eg.translate(0, 0, sz > 0 ? 0.06 : -0.08);
        paintGeo(eg, goldPaint({ seed: seed + 41, edge: (x, y) => sstep(3.025, 3.02, y) * 0.5 + 0.35 }));
        parts.push(eg);
        const inl = new THREE.CylinderGeometry(0.03, 0.03, 0.004, 28); inl.rotateX(Math.PI / 2); inl.translate(0, 3.10, sz > 0 ? 0.0845 : -0.0845);
        paintGeo(inl, goldPaint({ pal: PAL.lapis })); parts.push(inl);
        const bead = new THREE.TorusGeometry(0.0455, 0.0042, 8, 36); bead.translate(0, 3.10, sz > 0 ? 0.0858 : -0.0858);
        paintGeo(bead, goldPaint({ seed: seed + 42 })); parts.push(bead);
      }
      // the crest bracket and 2 standoffs for the arc plate
      const br = new THREE.BoxGeometry(0.046, 0.06, 0.075); br.translate(0, 3.15, -0.1175); paintGeo(br, goldPaint({ seed: seed + 43 })); parts.push(br);
      for (const sx of [-1, 1]) {
        const so = new THREE.CylinderGeometry(0.010, 0.010, 0.056, 14); so.rotateX(Math.PI / 2); so.translate(sx * 0.05, 3.00, 0.108); paintGeo(so, goldPaint({ seed: seed + 44 })); parts.push(so);
        const cap = new THREE.SphereGeometry(0.0135, 14, 8); cap.scale(1, 1, 0.55); cap.translate(sx * 0.05, 3.00, 0.1405); paintGeo(cap, goldPaint({ seed: seed + 45 })); parts.push(cap);
      }
      // arc plate: apex at the pivot, r 0.35, +-46 degrees from straight down, 11 notches (tilt -1..+1 step 0.2), the middle one a feather cut
      {
        const notch = []; for (let k = 0; k <= 10; k++) notch.push(-Math.asin(0.633 * (-1 + 0.2 * k)) );   // pointer angle for tilt t is -asin(0.633 t); k = 0 is tilt -1
        const sh = new THREE.Shape(), R0 = 0.35, A = 46 * DEG, pt = (r, ang) => [r * Math.sin(ang), 3.10 - r * Math.cos(ang)];
        sh.moveTo(0, 3.10); let [sx, sy] = pt(R0, -A); sh.lineTo(sx, sy);
        const order = notch.map((a, k) => ({ a, k })).sort((p, q) => p.a - q.a);
        for (const { a, k } of order) {
          const hw = 0.011 / R0;
          if (k === 5) {   // the feather cut: a quill slot widening to a leaf, pointed inside
            const L = (rr, da) => pt(rr, a + da / R0);
            let p = L(R0, -0.004); sh.lineTo(p[0], p[1]);
            for (const [rr, da] of [[0.340, -0.0046], [0.331, -0.0105], [0.322, -0.0100], [0.314, -0.0062], [0.308, 0], [0.314, 0.0062], [0.322, 0.0100], [0.331, 0.0105], [0.340, 0.0046], [R0, 0.004]]) { p = L(rr, da); sh.lineTo(p[0], p[1]); }
          } else { let p = pt(R0, a - hw); sh.lineTo(p[0], p[1]); p = pt(R0 - 0.016, a); sh.lineTo(p[0], p[1]); p = pt(R0, a + hw); sh.lineTo(p[0], p[1]); }
          // the arc between notches is sampled (a chord would cut the circle)
          const next = order[order.findIndex((o) => o.k === k) + 1], a1 = next ? next.a - 0.011 / R0 : A, a0 = a + 0.011 / R0;
          for (let s = 1; s < 6; s++) { const p2 = pt(R0, mix(a0, a1, s / 6)); sh.lineTo(p2[0], p2[1]); }
        }
        sh.lineTo(...pt(R0, A)); sh.lineTo(0, 3.10);
        const pg = new THREE.ExtrudeGeometry(sh, { depth: 0.010, bevelEnabled: false, curveSegments: 6 }); pg.translate(0, 0, 0.130);
        paintGeo(pg, (x, y, z, nx, ny, nz) => { const rr = Math.hypot(x, y - 3.10); return goldPaint({ seed: seed + 51, ao: () => sstep(0.05, 0.0, rr) * 0.5 + sstep(0.30, 0.35, rr) * 0.25, edge: () => sstep(0.31, 0.35, rr) * 1.1 + 0.15 })(x, y, z, nx, ny, nz); });
        seamUV(pg, 0, 3.10); flatParts.push(pg);
      }
      // the winged sun disc behind the beam: wings 2 x (3 rows x 9 feathers) inlaid, orb r 0.11 (top y 3.55), a ring
      {
        const zf = -0.138, pitch = 0.0478, rowDef = [{ pal: PAL.lapis, y0: 0.095, len: 0.070 }, { pal: PAL.turq, y0: 0.035, len: 0.100 }, { pal: PAL.deepl, y0: -0.020, len: 0.130 }];
        const feat = (len, wid) => { const sh = new THREE.Shape(), n = 12; sh.moveTo(-wid * 0.36, 0); for (let k = 0; k <= n; k++) { const v = k / n, w = wid * 0.5 * (v < 0.35 ? 0.72 + 0.28 * Math.sin((Math.PI / 2) * (v / 0.35)) : Math.pow(Math.cos((Math.PI / 2) * Math.pow((v - 0.35) / 0.65, 1.3)), 0.7)); sh.lineTo(w, -len * v); } for (let k = n; k >= 0; k--) { const v = k / n, w = wid * 0.5 * (v < 0.35 ? 0.72 + 0.28 * Math.sin((Math.PI / 2) * (v / 0.35)) : Math.pow(Math.cos((Math.PI / 2) * Math.pow((v - 0.35) / 0.65, 1.3)), 0.7)); sh.lineTo(-w, -len * v); } return new THREE.ShapeGeometry(sh, 2); };
        const tipsC = [];
        for (const sgn of [1, -1]) {
          rowDef.forEach((row, r) => {
            for (let i = 0; i < 9; i++) {
              const x = 0.12 + i * pitch, y = row.y0 + 0.05 * Math.pow((x - 0.10) / 0.45, 2), lean = (7 + 5 * r + 2 * hs(i * 3 + r + seed)) * DEG, len = row.len * (0.9 + 0.1 * (i / 8)) * (0.97 + 0.05 * hs(i + 9 * r + seed * 3));
              // a gold frame (a little bigger) and the inlay on it; the upper rows lie over the lower ones (3.6 mm a row)
              const dzRow = r === 0 ? 0.0072 : r === 1 ? 0.0036 : 0;
              for (const [grow, dz, which] of [[0.0035, 0.002, "frame"], [0, 0.0045, "inlay"]]) {
                const g = feat(len + grow * 1.6, 0.040 + grow * 2);
                g.rotateZ(lean); g.translate(x, y + grow * 0.5, 0); if (sgn < 0) g.scale(-1, 1, 1);   // the tip leans outward
                g.translate(0, 3.28, zf + dzRow + dz);
                orient(g, () => [0, 0, 1]);
                if (which === "frame") paintGeo(g, goldPaint({ seed: seed + 60 + r * 9 + i + (sgn > 0 ? 0 : 40), edge: () => 0.3 }));
                else paintGeo(g, (x2, y2, z2, nx, ny, nz) => { const t = sstep(3.28 + 0.15, 3.28 - 0.15, y2); const c = shade(row.pal, nx, ny, nz, 0.15 * (1 - t)); if (hs(i * 7 + r * 31 + (sgn > 0 ? 0 : 5)) < 0.18) c.lerp(row.pal.light, 0.18); return c; });
                parts.push(g);
              }
              if (r === 2 && sgn > 0) tipsC[i] = [x + Math.sin(lean) * len, y - Math.cos(lean) * len];
            }
          });
        }
        // the gold wing plate behind the inlays: one plate across both wings, a rising top edge, a scalloped lower edge that follows the long row
        const Wp = [];
        for (let k = 0; k <= 10; k++) Wp.push([0.09 + 0.50 * (k / 10), 0.112 + 0.062 * Math.pow(k / 10, 1.7)]);
        Wp.push([0.603, 0.125], [0.600, 0.045]);
        for (let i = 8; i >= 0; i--) { const [tx, ty] = tipsC[i]; Wp.push([tx + 0.014, ty - 0.003], [tx - 0.003, ty - 0.011]); if (i > 0) Wp.push([(tx + tipsC[i - 1][0]) / 2 - 0.004, (ty + tipsC[i - 1][1]) / 2 + 0.028]); }
        Wp.push([0.09, -0.075]);
        const poly = Wp.concat(Wp.map((q) => [-q[0], q[1]]).reverse()), sh = new THREE.Shape(); poly.forEach((q, k) => sh[k ? "lineTo" : "moveTo"](q[0], q[1] + 3.28)); sh.closePath();
        const plate = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }); plate.translate(0, 0, zf - 0.012);
        paintGeo(plate, (x, y, z, nx, ny, nz) => goldPaint({ seed: seed + 71, ao: () => 0.2, edge: () => sstep(0.46, 0.56, Math.abs(x)) * 0.9 + 0.1 })(x, y, z, nx, ny, nz)); seamUV(plate, 0, 3.28); flatParts.push(plate);
        // the orb: a thick lens r 0.11, centre y 3.44 (top 3.55), a ring round it, a collar under it
        const orb = new THREE.SphereGeometry(0.11, 36, 22); orb.scale(1, 1, 0.5); orb.translate(0, 3.44, zf + 0.04);
        paintGeo(orb, goldPaint({ seed: seed + 72, edge: () => 0.1 })); parts.push(orb);
        const ring = new THREE.TorusGeometry(0.1165, 0.0075, 10, 48); ring.translate(0, 3.44, zf + 0.04); paintGeo(ring, goldPaint({ seed: seed + 73, edge: () => 0.3 })); parts.push(ring);
        const col = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 24); col.rotateX(Math.PI / 2); col.translate(0, 3.30, zf + 0.011); paintGeo(col, goldPaint({ seed: seed + 74 })); parts.push(col);
      }
      mk(merged(parts), GM, topG); mk(merged(flatParts, true), GMS, topG);
    }

    // =============================================== BEAM: 64 rope twists, lotus finials, pin, pointer
    {
      const NX = 780, NT = 18, TW = 0.0425, X0 = 0.095, X1 = 1.455;
      const bump = (x, x0, w, a) => a * Math.exp(-(((x - x0) / w) ** 2)), Rb = (ax) => 0.055 - 0.02 * Math.pow(ax / 1.5, 1.2);
      const phase = (x) => x / TW + 0.06 * Math.sin(x * 9.1 + seed), amp = (ax) => 0.0030 * sstep(X0 - 0.004, X0 + 0.004, ax) * sstep(X1 + 0.004, X1 - 0.004, ax);
      const rad = (x, th) => { const ax = Math.abs(x), q = 0.5 + 0.5 * Math.cos(3 * th - TAU * phase(x)); return Rb(ax) + bump(ax, 0.085, 0.006, 0.007) + bump(ax, 1.468, 0.005, 0.006) + bump(ax, 0.0, 0.03, 0.004) + amp(ax) * (0.82 + 0.3 * hs(Math.floor(Math.abs(phase(x))) + seed)) * q; };
      const g = gridGeo(NT, NX, (i, j) => { const x = -1.5 + (3 * j) / NX, th = (TAU * i) / NT, r = rad(x, th); return [x, r * Math.sin(th), r * Math.cos(th)]; }, true);
      orient(g, (x, y, z) => [0, y, z]);
      paintGeo(g, (x, y, z, nx, ny, nz) => {
        const th = Math.atan2(y, z), ax = Math.abs(x), q = 0.5 + 0.5 * Math.cos(3 * th - TAU * phase(x)), m = sstep(X0, X0 + 0.01, ax) * sstep(X1, X1 - 0.01, ax);
        return goldPaint({ seed: seed + 81, ao: () => (1 - q) * (1 - q) * m * 0.85, edge: () => (ax < 0.12 || ax > 1.44 ? 0.55 : 0.05) })(x, y, z, nx, ny, nz);
      });
      const parts = [g];
      // lotus finials: 5 petals an end, closing like a bud, x 1.50 -> 1.62
      for (const sgn of [1, -1]) for (let k = 0; k < 5; k++) {
        const om = (TAU * (k + 0.5)) / 5, pg = petalGeo({ len: 0.118, wid: 0.050, rise: 0.30, curl: -0.55, nu: 5, nv: 8 }), tn = [0, -Math.sin(om), Math.cos(om)], rr = [0, Math.cos(om), Math.sin(om)];
        if (sgn > 0) basis(pg, tn, [1, 0, 0], rr, [1.495, 0.034 * Math.cos(om), 0.034 * Math.sin(om)]); else basis(pg, tn.map((v) => -v), [-1, 0, 0], rr, [-1.495, 0.034 * Math.cos(om), 0.034 * Math.sin(om)]);
        paintGeo(pg, goldPaint({ seed: seed + 90 + k + (sgn > 0 ? 0 : 7), ao: (X, Y, Z) => sstep(0.012, 0.0, Math.abs(Math.abs(X) - 1.495)) * 0.7, edge: (X) => sstep(1.58, 1.62, Math.abs(X)) * 0.9 }));
        parts.push(pg);
      }
      // the end caps of the finial: a small boss each
      for (const sgn of [1, -1]) { const b = new THREE.SphereGeometry(0.0155, 12, 8); b.translate(sgn * 1.612, 0, 0); paintGeo(b, goldPaint({ seed: seed + 99 })); parts.push(b); }
      // the axle pin through the cheeks (z -0.108 .. +0.165), heads, and the pointer hub
      const pin = new THREE.CylinderGeometry(0.012, 0.012, 0.284, 14); pin.rotateX(Math.PI / 2); pin.translate(0, 0, 0.033); paintGeo(pin, goldPaint({ seed: seed + 100 })); parts.push(pin);
      const hb = new THREE.SphereGeometry(0.019, 16, 10); hb.translate(0, 0, -0.108); paintGeo(hb, goldPaint({ seed: seed + 101 })); parts.push(hb);
      const hub = new THREE.CylinderGeometry(0.028, 0.030, 0.010, 24); hub.rotateX(Math.PI / 2); hub.translate(0, 0, 0.158); paintGeo(hub, goldPaint({ seed: seed + 102, edge: () => 0.5 })); parts.push(hub);
      const hh = new THREE.SphereGeometry(0.016, 14, 8); hh.scale(1, 1, 0.7); hh.translate(0, 0, 0.1655); paintGeo(hh, goldPaint({ seed: seed + 103 })); parts.push(hh);
      // the pointer tongue: from the hub 0.30 down, tapering 0.022 -> 0.009, rounded; pointing down (-y) in the beam frame
      {
        const sh = new THREE.Shape(); sh.moveTo(-0.012, -0.02); sh.lineTo(-0.0045, -0.30); sh.lineTo(0.0045, -0.30); sh.lineTo(0.012, -0.02); sh.lineTo(0.0, 0.01); sh.closePath();
        const tg = new THREE.ExtrudeGeometry(sh, { depth: 0.007, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 1 }); tg.translate(0, 0, 0.1465);
        paintGeo(tg, goldPaint({ seed: seed + 104, edge: () => 0.3 })); parts.push(tg);
      }
      mk(merged(parts), GM, beamG);
      // the lapis tip: 0.051 long, pointed, sunk into the notch as it passes one (tipG moves in z with the seat)
      const tip = new THREE.Shape(); tip.moveTo(-0.0055, 0); tip.lineTo(-0.0075, -0.034); tip.lineTo(0, -0.051); tip.lineTo(0.0075, -0.034); tip.lineTo(0.0055, 0); tip.closePath();
      const tg2 = new THREE.ExtrudeGeometry(tip, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 }); tg2.translate(0, 0, 0.1455);
      paintGeo(tg2, goldPaint({ pal: PAL.lapis })); beamG.add(tipG); mk(tg2, GM, tipG); tipG.position.set(0, -0.294, 0);
    }

    // =============================================== PANS on CHAINS: the hanging assemblies
    const lmat = GMT;
    // one link: a stadium of 0.095 x 0.045, wire 0.011, painted for its turn (odd links stand 90 degrees to the face)
    const linkGeo = (odd) => {
      const hsr = 0.025, rc = 0.017, pts = []; const N = 9;
      for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; pts.push([rc * Math.cos(a), hsr + rc * Math.sin(a)]); }
      for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; pts.push([-rc * Math.cos(a), -hsr - rc * Math.sin(a)]); }
      const g = sweepPlanar(pts, LINK.wire / 2, 6);
      paintGeo(g, (x, y, z, nx, ny, nz) => { const a = odd ? [-nz, ny, -nx] : [nx, ny, nz]; return goldPaint({ seed: seed + 120, wear: 0.0, ao: () => 0 })(x, y, z, a[0], a[1], a[2]); });
      return g;
    };
    const LG = [linkGeo(false), linkGeo(true)];
    const ringGeo = (w, h, wire) => { const hsr = (h - w) / 2, rc = w / 2, pts = [], N = 14; for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; pts.push([rc * Math.cos(a), hsr + rc * Math.sin(a)]); } for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; pts.push([-rc * Math.cos(a), -hsr - rc * Math.sin(a)]); } return sweepPlanar(pts, wire, 8); };
    // pan texture painters (see the header: 40 scratches, 14 dents, rubbed rim; 16 petals with centre + 2 side veins)
    const px = (v, W) => (v / 0.8 + 0.5) * W;
    const paintInner = (g, W, sd) => {
      const X = (x) => px(x, W), Y = (z) => (0.5 - z / 0.8) * W, pxm = W / 0.8;
      const bg = g.createRadialGradient(X(-0.04), Y(0.05), 0, X(0), Y(0), 0.4 * pxm);
      bg.addColorStop(0, "#fffbe0"); bg.addColorStop(0.30, "#fff0b8"); bg.addColorStop(0.75, "#f1cb70"); bg.addColorStop(0.9, "#e2b04a"); bg.addColorStop(1, "#b98a2e");
      g.fillStyle = bg; g.fillRect(0, 0, W, W);
      // a long soft light band on the near-left of the dish
      g.save(); g.filter = "blur(7px)"; g.strokeStyle = "rgba(255,255,240,0.45)"; g.lineWidth = 0.035 * pxm; g.lineCap = "round"; g.beginPath(); g.arc(X(0), Y(0), 0.27 * pxm, 118 * DEG, 205 * DEG); g.stroke(); g.restore();
      // 40 concentric scratch strokes, each its own wobbly arc
      for (let k = 0; k < 40; k++) {
        const h = (n) => hs(sd * 977 + k * 13.7 + n), rho = (0.03 + 0.31 * h(1)) * pxm, cx = X(0.016 * (h(2) - 0.5)), cy = Y(0.016 * (h(3) - 0.5)), a0 = TAU * h(4), span = (50 + 150 * h(5)) * DEG;
        g.strokeStyle = k % 2 ? "rgba(150,104,32,0.40)" : "rgba(255,251,232,0.60)"; g.lineWidth = 1.1 + 1.6 * h(6); g.lineCap = "round"; g.beginPath();
        for (let s = 0; s <= 26; s++) { const a = a0 + (span * s) / 26, r = rho * (1 + 0.012 * Math.sin(a * 5 + k) + 0.006 * Math.sin(a * 11 + k * 2)); g[s ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
        g.stroke();
      }
      // 14 dents of 1-3 cm: a dark upper-left edge, a light lower-right edge, a soft pit
      for (let k = 0; k < 14; k++) {
        const h = (n) => hs(sd * 551 + k * 17.3 + n), a = TAU * h(1), rho = (0.04 + 0.27 * h(2)) * pxm, r = (0.005 + 0.010 * h(3)) * pxm, cx = X(0) + rho * Math.cos(a), cy = Y(0) + rho * Math.sin(a);
        const dg = g.createRadialGradient(cx + 0.3 * r, cy + 0.3 * r, 0.05 * r, cx, cy, 1.05 * r);
        dg.addColorStop(0, "rgba(255,250,215,0.55)"); dg.addColorStop(0.6, "rgba(225,176,74,0.25)"); dg.addColorStop(1, "rgba(130,88,22,0.70)");
        g.fillStyle = dg; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
        g.lineCap = "round"; g.lineWidth = Math.max(1.6, r * 0.18); g.strokeStyle = "rgba(100,64,12,0.75)"; g.beginPath(); g.arc(cx, cy, r * 0.96, 195 * DEG, 295 * DEG); g.stroke();
        g.strokeStyle = "rgba(255,255,236,0.85)"; g.beginPath(); g.arc(cx, cy, r * 0.96, 15 * DEG, 115 * DEG); g.stroke();
      }
      // the rim rubbed to bronze: patches along the inner wall, 1 in 4 showing red bole
      for (let k = 0; k < 22; k++) {
        const h = (n) => hs(sd * 313 + k * 7.9 + n), a = TAU * (k + h(1) * 0.7) / 22, rho = (0.338 + 0.026 * h(2)) * pxm, span = (5 + 16 * h(3)) * DEG;
        g.strokeStyle = h(4) < 0.25 ? "rgba(138,74,42,0.55)" : "rgba(107,70,18,0.50)"; g.lineWidth = (0.005 + 0.012 * h(5)) * pxm; g.lineCap = "round"; g.beginPath(); g.arc(X(0), Y(0), rho, a, a + span); g.stroke();
      }
      g.strokeStyle = "rgba(107,70,18,0.35)"; g.lineWidth = 0.012 * pxm; g.beginPath(); g.arc(X(0), Y(0), 0.372 * pxm, 0, TAU); g.stroke();
    };
    const paintPetals = (g, sd) => {
      const CW = 128, CH = 256;
      for (let k = 0; k < 16; k++) {
        const h = (n) => hs(sd * 211 + k * 9.1 + n), ox = k * CW;
        const Wv = (v) => 0.5 * (v < 0.4 ? 0.55 + 0.45 * Math.sin((Math.PI / 2) * (v / 0.4)) : Math.pow(Math.max(0, Math.cos((Math.PI / 2) * Math.pow((v - 0.4) / 0.6, 1.1))), 0.75)) * (CW - 8);
        const Yv = (v) => CH - v * CH;
        g.save(); g.beginPath(); g.rect(ox, 0, CW, CH); g.clip();
        const bgc = g.createLinearGradient(0, CH, 0, 0); bgc.addColorStop(0, "#d9a73d"); bgc.addColorStop(0.55, "#e9bd55"); bgc.addColorStop(1, "#f6d37c");
        g.fillStyle = bgc; g.fillRect(ox, 0, CW, CH);
        const hg = g.createLinearGradient(ox, 0, ox + CW, 0); hg.addColorStop(0, "rgba(120,78,20,0.45)"); hg.addColorStop(0.35, "rgba(255,240,184,0.0)"); hg.addColorStop(0.5, "rgba(255,240,184,0.40)"); hg.addColorStop(0.65, "rgba(255,240,184,0.0)"); hg.addColorStop(1, "rgba(120,78,20,0.45)");
        g.fillStyle = hg; g.fillRect(ox, 0, CW, CH);
        // outline of the petal, wobbled
        g.strokeStyle = "rgba(107,70,18,0.75)"; g.lineWidth = 3.2; g.lineJoin = "round"; g.beginPath();
        for (let s = 0; s <= 40; s++) { const v = s / 40, w = Wv(v) - 2 + 1.2 * Math.sin(v * 17 + k); g[s ? "lineTo" : "moveTo"](ox + CW / 2 - w, Yv(v)); }
        for (let s = 40; s >= 0; s--) { const v = s / 40, w = Wv(v) - 2 + 1.2 * Math.sin(v * 19 + k * 2); g.lineTo(ox + CW / 2 + w, Yv(v)); }
        g.stroke();
        // veins: the centre vein, two side veins, each a dark groove with a light edge
        const vein = (x0, x1, v0, v1, bend, wd) => {
          for (const [col, off, lw] of [["rgba(255,240,184,0.75)", 2.4, wd * 0.55], ["rgba(120,76,16,0.85)", 0, wd]]) {
            g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.beginPath();
            for (let s = 0; s <= 24; s++) { const t = s / 24, v = mix(v0, v1, t), xx = ox + CW / 2 + mix(x0, x1, t) * Wv(0.5) * 1.0 + bend * Math.sin(Math.PI * t) + off; g[s ? "lineTo" : "moveTo"](xx, Yv(v)); }
            g.stroke();
          }
        };
        vein(0, 0, 0.10, 0.84, 3.2 * (h(1) - 0.5), 4.2);
        vein(0, -0.55, 0.14, 0.66 + 0.05 * h(2), 2.0 * (h(3) - 0.5), 3.0); vein(0, 0.55, 0.14, 0.66 + 0.05 * h(4), 2.0 * (h(5) - 0.5), 3.0);
        g.restore();
      }
    };
    const canv = (w, h) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; return cv; };
    const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

    // ---- a pan (pan-local, origin = the rim line centre). Returns { grp, parts }
    const buildPan = (side) => {
      const sd = seed * 3 + (side === "L" ? 1 : 2), grp = new THREE.Group();
      // the shell: outer wall -> rim roll -> inner wall, one profile
      const outer = [], roll = [], inner = [];
      for (let k = 0; k <= 44; k++) { const r = 0.38 * Math.sin((Math.PI / 2) * (k / 44)); outer.push([r, yOut(r)]); }
      for (let a = -75; a <= 195; a += 15) roll.push([0.38 + 0.02 * Math.cos(a * DEG), -0.012 + 0.02 * Math.sin(a * DEG)]);
      for (let k = 1; k <= 44; k++) { const r = 0.3607 * Math.cos((Math.PI / 2) * (k / 44)); inner.push([r, yIn(r)]); }
      const shellOut = revolve([...outer, ...roll], 104); shellOut.computeVertexNormals();
      paintGeo(shellOut, (x, y, z, nx, ny, nz) => {
        const r = Math.hypot(x, z), onRoll = r > 0.358 && y > -0.034;
        if (onRoll) return goldPaint({ seed: sd + 5, freq: 26, ao: () => sstep(-0.03, -0.034, y) * 0.5, edge: () => 0.4 })(x, y, z, nx, ny, nz);
        const c = TARNISH.clone().lerp(PAL.gold.base, 0.25 * vnoise(x * 20, y * 20, z * 20, sd)); return c;
      });
      const shellIn = revolve([roll[roll.length - 4], roll[roll.length - 3], roll[roll.length - 2], roll[roll.length - 1], ...inner], 104); shellIn.computeVertexNormals();
      {
        const p = shellIn.attributes.position, uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 0.8 + 0.5; uv[i * 2 + 1] = 0.5 + p.getZ(i) / 0.8; }
        shellIn.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        paintGeo(shellIn, () => WHITE);
      }
      const cvIn = canv(1024, 1024); paintInner(cvIn.getContext("2d"), 1024, sd);
      const inMat = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, map: tex(cvIn), roughness: 0.3 }); inMat.userData.lineColor = "#4a2f0c";
      // 16 embossed petals on the outer wall, each its own atlas cell
      const cvP = canv(2048, 256); paintPetals(cvP.getContext("2d"), sd);
      const petMat = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, map: tex(cvP), roughness: 0.38 }); petMat.userData.lineColor = "#4a2f0c"; petMat.userData.lineK = 0.7;
      const pets = [], NP = 16, rA = 0.04, rB = 0.335;
      for (let k = 0; k < NP; k++) {
        const psi = (TAU * k) / NP + 0.012 * (hs(k + sd) - 0.5), lenJ = 1 + 0.02 * (hs(k * 3 + sd) - 0.5);
        const g = gridGeo(8, 16, (i, j) => {
          const u = (i / 8) * 2 - 1, v = j / 16, r = mix(rA, rB * lenJ, v), wv = v < 0.4 ? 0.55 + 0.45 * Math.sin((Math.PI / 2) * (v / 0.4)) : Math.pow(Math.max(0, Math.cos((Math.PI / 2) * Math.pow((v - 0.4) / 0.6, 1.1))), 0.75);
          const ang = psi + u * wv * 0.171, dy = dOut(r), nl = Math.hypot(dy, 1), nr = dy / nl, ny = -1 / nl, h = 0.0035 + 0.0045 * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 1.1 + 0.05));
          const rr = r + nr * h; return [rr * Math.sin(ang), yOut(r) + ny * h, rr * Math.cos(ang)];
        }, false, (i, j) => [(k + 0.5 + (i / 8 - 0.5) * 0.94) / NP, j / 16]);
        orient(g, (x, y, z) => [x * 2, -1, z * 2]); paintGeo(g, () => WHITE); pets.push(g);
      }
      const petG = merged(pets, true);
      // 60 beads under the rim
      const beads = [];
      for (let k = 0; k < 60; k++) { const a = (TAU * (k + 0.5)) / 60, bg = new THREE.SphereGeometry(0.0066, 10, 7); bg.translate(0.3662 * Math.sin(a), -0.0392, 0.3662 * Math.cos(a)); paintGeo(bg, goldPaint({ seed: sd + 9, edge: () => 0.2 })); beads.push(bg); }
      // 3 chain lugs on the roll (a boss + an eye ring in the radial plane), at -60, +60, 180
      const lugs = [];
      for (const az of CHAIN_AZ) {
        const a = az * DEG, rx = [Math.sin(a), 0, Math.cos(a)], tz = [Math.cos(a), 0, -Math.sin(a)];
        const boss = new THREE.SphereGeometry(0.0125, 12, 8); boss.translate(0.3995 * rx[0], -0.0125, 0.3995 * rx[2]); paintGeo(boss, goldPaint({ seed: sd + 12, edge: () => 0.4 })); lugs.push(boss);
        const eye = ringGeo(0.026, 0.040, 0.0036); basis(eye, rx, [0, 1, 0], tz, [0.4075 * rx[0], -0.0215, 0.4075 * rx[2]]); paintGeo(eye, goldPaint({ seed: sd + 13, edge: () => 0.3 })); lugs.push(eye);
      }
      mk(merged([shellOut, ...beads, ...lugs]), GM, grp);
      mk(shellIn, inMat, grp);
      mk(petG, petMat, grp);
      return { grp, sd };
    };

    // ---- assemblies (one per beam end), origin = the hang point H on the beam axis; the pan rim centre is 2.00 below
    const asm = {}, links = [], anchors = {};
    for (const side of ["L", "R"]) {
      const g = new THREE.Group(); whole.add(g);
      const sg = side === "L" ? 1 : 2;
      // the falcon claw: a knuckle on the beam end, 3 talons hooking the ring; the ring and the little yz collector ring under it
      const parts = [];
      const kn = new THREE.SphereGeometry(0.0165, 14, 10); kn.translate(0, -0.044, 0); paintGeo(kn, goldPaint({ seed: seed + 130, edge: () => 0.3 })); parts.push(kn);
      const TAL = [
        [[0, -0.050, 0.012], [0, -0.054, 0.025], [0, -0.066, 0.029], [0, -0.078, 0.019], [0, -0.072, 0.0065]],       // front talon, hooks under the ring's top wire
        [[0.012, -0.050, -0.004], [0.026, -0.055, -0.006], [0.029, -0.067, -0.003], [0.018, -0.078, -0.002], [0.0066, -0.072, 0.0]],   // hind talon
        [[0, -0.050, -0.012], [0, -0.054, -0.025], [0, -0.066, -0.029], [0, -0.078, -0.019], [0, -0.072, -0.0065]],  // back talon
      ];
      TAL.forEach((pp, k) => {
        const cp = new THREE.CatmullRomCurve3(pp.map((q) => new V3(...q))).getPoints(14);
        const tg = sweepTube(cp, (t) => 0.0068 * (1 - t) + 0.0012, 6); paintGeo(tg, goldPaint({ seed: seed + 131 + k })); parts.push(tg);
      });
      const rg = ringGeo(0.040, 0.075, 0.006); rg.translate(0, -0.0975, 0); paintGeo(rg, goldPaint({ seed: seed + 134, edge: () => 0.3 })); parts.push(rg);
      const r2 = ringGeo(0.026, 0.0315, 0.0042); r2.rotateY(Math.PI / 2); r2.translate(0, -0.1347, 0); paintGeo(r2, goldPaint({ seed: seed + 135 })); parts.push(r2);
      mk(merged(parts), GM, g);
      // 3 chains of 26 links from the collector (apex, 0.15 under H) to the rim lugs (2.00 under H); the links hang plumb with the pan
      const pan = buildPan(side); pan.grp.position.set(0, -PAN_DROP, 0); g.add(pan.grp);
      const A0 = new V3(0, -APEX, 0), chainLinks = [];
      CHAIN_AZ.forEach((az, c) => {
        const a = az * DEG, R = new V3(PAN_R * Math.sin(a), -PAN_DROP, PAN_R * Math.cos(a)), d = R.clone().sub(A0), L = d.length(), dir = d.clone().normalize(), pitch = L / CH_N;
        const n1 = new V3().crossVectors(dir, new V3(0, 0, 1)).normalize(), n2 = new V3().crossVectors(dir, n1).normalize();
        for (let i = 0; i < CH_N; i++) {
          const odd = i % 2, m = new THREE.Mesh(LG[odd], lmat), cpos = A0.clone().add(dir.clone().multiplyScalar((i + 0.5) * pitch));
          const xa = odd ? n2 : n1, za = new V3().crossVectors(xa, dir), mat4 = new THREE.Matrix4().makeBasis(xa, dir, za);
          m.position.copy(cpos); m.quaternion.setFromRotationMatrix(mat4); m.scale.set(1, (pitch + LINK.wire * 2) / LINK.len, 1);
          m.castShadow = true; m.receiveShadow = true; m.userData.solid = false; g.add(m);
          links.push({ m, q0: m.quaternion.clone(), ph: hs(sg * 1000 + c * 100 + i) * TAU, f: 8 + 4 * hs(sg * 777 + c * 50 + i) });
          chainLinks.push(m);
        }
      });
      asm[side] = { g, pan };
      const seat = new THREE.Object3D(); seat.position.set(0, -2.07, 0); g.add(seat); anchors["seat" + side] = seat;   // HEART SEAT S, riding the pan
    }
    // the chain pitch is L/26 = 0.0728 and the link is stretched to 0.0948 (wire 0.011 hooked into its neighbour): a taut chain's pitch is
    // the inside length, so 26 links of 0.075 could only span 1.4 m of the 1.89 m from the apex to the rim (see NOTES)

    // =============================================== THE FEATHER on the right pan
    const featherG = new THREE.Group(); asm.R.pan.grp.add(featherG);
    let featherPivot = 0;
    if (S.feather !== false) {
      const L = 0.46, WMAX = 0.06, rTip = 0.3985, clr = 0.0075;
      // z(a): the spine's place along +z at arclength a from the root, built backward from the tip over the roll and the dish (it may cross the centre)
      const surf = (r) => dishY(Math.min(Math.abs(r), 0.3999)) + clr;
      const tab = [[rTip, 0]]; let acc = 0, rr = rTip;
      while (acc < L) { const r2 = rr - 0.0015; acc += Math.hypot(0.0015, surf(r2) - surf(rr)); rr = r2; tab.push([rr, acc]); }
      const rOf = (a) => { const t = L - a; let i = 1; while (i < tab.length - 1 && tab[i][1] < t) i++; const [r1, s1] = tab[i - 1], [r2, s2] = tab[i]; return mix(r1, r2, (t - s1) / Math.max(1e-6, s2 - s1)); };
      const xo = (a) => 0.016 + 0.018 * (a / L);
      const Wf = (a) => WMAX * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(Math.min(1, a / L), 1.357))), 0.9);
      const pos3 = (a, l, lift) => { const x = xo(a) + l, z = rOf(a), r = Math.hypot(x, z); return [x, surf(r) + lift - 0.0035 * Math.pow(l / WMAX, 2), z]; };
      // barbs: a strip each, tapering, angled toward the tip
      const barbs = [], A0v = 0.045, NB = 44, SPLITS = { 1: [8, 17, 27, 36], "-1": [6, 15, 25, 35] };
      const cream = C("#f6f2e6"), shadeC = C("#cfc9bb"), quillC = C("#e9dcc0");
      const barb = (a0, sgn, alpha, jit, bw, lift0, liftEnd, tint, seedB, taper = 0.55) => {
        let ae = a0 + Wf(a0 + 0.02) / Math.tan(alpha); ae = a0 + Wf(ae) / Math.tan(alpha); ae = Math.min(L, a0 + (ae - a0) * jit);
        const lat = Math.max(0.004, (ae - a0) * Math.tan(alpha)), dl = Math.hypot(ae - a0, lat), pa = -lat / dl, pl = (ae - a0) / dl, NS = 4;
        // three columns: the two edges and a raised middle (a ridge along the barb), so every barb catches light and shade on its own
        const g = gridGeo(2, NS, (i, j) => { const q = j / NS, hw = 0.5 * bw * (1 - taper * q), side = i - 1, a = mix(a0, ae, q) + pa * hw * side, l = sgn * (lat * q + pl * hw * side * 1.0); const p3 = pos3(a, l, mix(lift0, liftEnd, q * q) + (i === 1 ? 0.0016 : 0)); return p3; });
        orient(g, () => [0, 1, 0]);
        paintGeo(g, (x, y, z, nx, ny, nz, vi) => { const q = Math.floor(vi / 3) / NS, edge = vi % 3 !== 1; return cream.clone().lerp(shadeC, clamp(tint * (0.15 + 0.85 * q) + (edge ? 0.22 : 0))); });
        return g;
      };
      for (const sgn of [1, -1]) {
        const sp = SPLITS[sgn]; let clump = 0;
        for (let i = 0; i < NB; i++) {
          if (sp.includes(i)) clump++;
          const a0 = A0v + ((i + 0.5) / NB) * (L - A0v), off = (clump % 2 ? 1 : -1) * 0.075, al = 55 * DEG + off + 0.03 * (hs(i + sgn * 40 + seed) - 0.5), jit = 0.94 + 0.08 * hs(i * 5 + sgn + seed);
          barbs.push(barb(a0, sgn, al, jit, 0.0125, 0.0016 * (i / NB), -0.0005, 0.55 + 0.35 * hs(i + 77 + sgn), i));
        }
      }
      // 6 downy tufts at the root: 3 a side, each a fan of 6 fine curling barbs
      for (const sgn of [1, -1]) for (let k = 0; k < 3; k++) for (let f = 0; f < 6; f++) {
        const a0 = 0.006 + 0.014 * k + 0.002 * f, al = (36 + 9 * f + 6 * hs(k * 7 + f + sgn)) * DEG; const tb = barb(a0, sgn, al, 1, 0.0042, 0.003, 0.011, 0.25, k * 6 + f, 0.7);
        barbs.push(tb);
      }
      const FM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); FM.userData.lineColor = "#8f8670"; FM.userData.lineK = 0.45; FM.userData.noHatch = true;
      mk(merged(barbs), FM, featherG, false);
      const sp = []; for (let k = 0; k <= 40; k++) { const a = (L * k) / 40, q = pos3(a, 0, 0.003); sp.push(new V3(q[0], q[1], q[2])); }
      const qg = sweepTube(sp, (t) => 0.0046 * (1 - t) + 0.0009, 6); paintGeo(qg, () => quillC); mk(qg, FM, featherG, false);
      featherPivot = rOf(0); featherG.position.z = featherPivot; featherG.children.forEach((c) => { c.position.z = -featherPivot; });
    }

    // =============================================== JUICE smear on the left pan (outer petals, rim runs, pool)
    const jm = new THREE.MeshStandardMaterial({ color: JUICE, roughness: 0.3, emissive: new THREE.Color("#c9341a"), emissiveIntensity: 0.55 }); jm.userData.noShine = true; jm.userData.lineColor = "#8a2410"; jm.userData.lineK = 0.8; jm.userData.noHatch = true;
    const glossM = new THREE.MeshBasicMaterial({ color: JGLOSS, toneMapped: false }); glossM.userData.noOutline = true;
    const seedM = new THREE.MeshBasicMaterial({ color: JSEED, toneMapped: false, side: THREE.DoubleSide }); seedM.userData.noOutline = true;
    const smearG = new THREE.Group(); asm.L.pan.grp.add(smearG);
    const smearEls = [], hangs = [], dropEls = [];
    {
      const jmesh = (geo, parent, shadow = false) => { const o = new THREE.Mesh(geo, jm); o.castShadow = shadow; o.userData.solid = false; parent.add(o); return o; };
      const gmesh = (geo, parent, m = glossM) => { const o = new THREE.Mesh(geo, m); o.userData.solid = false; parent.add(o); return o; };
      // a lobed dome in its own frame: z up, radius R0 (+-lobes), height h
      const blob = (R0, lobes, sd, h, rings = 5, nu = 28) => {
        const ph = [TAU * hs(sd), TAU * hs(sd + 1.7)];
        return orient(gridGeo(nu, rings, (i, j) => { const a = (TAU * i) / nu, rho = j / rings, R = R0 * (1 + 0.16 * Math.sin(lobes * a + ph[0]) + 0.07 * Math.sin((lobes + 3) * a + ph[1])) * rho; return [R * Math.cos(a), R * Math.sin(a), h * Math.pow(Math.max(0, 1 - Math.pow(rho, 3)), 0.55)]; }, true), () => [0, 0, 1]);
      };
      // a flat bean (the hard white gloss shape) in the xy plane, z up
      const kidney = (len, wid, bend) => orient(gridGeo(8, 1, (i, j) => { const t = i / 8; return [len * (t - 0.5), -bend * 4 * (t - 0.5) * (t - 0.5) + wid * 0.5 * Math.sin(Math.PI * t) * (j ? 1 : -1), 0]; }), () => [0, 0, 1]);
      const tear = (len) => { const sh = new THREE.Shape(); sh.moveTo(0, len * 0.5); sh.bezierCurveTo(len * 0.38, len * 0.05, len * 0.3, -len * 0.5, 0, -len * 0.5); sh.bezierCurveTo(-len * 0.3, -len * 0.5, -len * 0.38, len * 0.05, 0, len * 0.5); return new THREE.ShapeGeometry(sh, 4); };
      const place = (g, F) => basis(g, F.ex.toArray(), F.ey.toArray(), F.ez.toArray(), F.o ? F.o.toArray() : [0, 0, 0]);
      const addEl = (grp, anchor, order) => { grp.position.copy(anchor); smearG.add(grp); smearEls.push({ grp, d: order }); return grp; };
      // the rim path: inner floor -> over the roll -> down the outer wall; sigma = metres from the roll's top (negative = inside the dish)
      const path = [];
      for (let r = 0.30; r < 0.3606; r += 0.004) { const dy = ((0.0528 * 2.4) / 0.36) * Math.pow(r / 0.36, 1.4), l = Math.hypot(dy, 1); path.push({ r, y: yIn(r), n: [-dy / l, 1 / l] }); }
      for (let a = 195; a > -90; a -= 5) path.push({ r: 0.38 + 0.02 * Math.cos(a * DEG), y: -0.012 + 0.02 * Math.sin(a * DEG), n: [Math.cos(a * DEG), Math.sin(a * DEG)] });
      for (let r = 0.38; r > 0.22; r -= 0.004) { const dy = dOut(r), l = Math.hypot(dy, 1); path.push({ r, y: yOut(r), n: [dy / l, -1 / l] }); }
      let cum = 0; path.forEach((p, k) => { if (k) cum += Math.hypot(p.r - path[k - 1].r, p.y - path[k - 1].y); p.s = cum; });
      const sTop = path.reduce((b, p) => (p.y > b.y ? p : b), path[0]).s;
      const pathAt = (sig) => { const t = sTop + sig; let i = 1; while (i < path.length - 1 && path[i].s < t) i++; const p = path[i - 1], q = path[i], f = clamp((t - p.s) / Math.max(1e-6, q.s - p.s)); return { r: mix(p.r, q.r, f), y: mix(p.y, q.y, f), n: [mix(p.n[0], q.n[0], f), mix(p.n[1], q.n[1], f)] }; };
      const surf3 = (sig, a, w, h) => { const p = pathAt(sig), rr = p.r + p.n[0] * h; return new V3(rr * Math.sin(a) + Math.cos(a) * w, p.y + p.n[1] * h, rr * Math.cos(a) - Math.sin(a) * w); };
      const nrm3 = (sig, a) => { const p = pathAt(sig); return new V3(p.n[0] * Math.sin(a), p.n[1], p.n[0] * Math.cos(a)).normalize(); };
      const frameAt = (sig, a, w, h) => { const ez = nrm3(sig, a), ex = new V3(Math.cos(a), 0, -Math.sin(a)); ex.sub(ez.clone().multiplyScalar(ex.dot(ez))).normalize(); return { o: surf3(sig, a, w, h), ex, ey: new V3().crossVectors(ez, ex), ez }; };
      // 5 drip runs over the +z rim at azimuths clear of the heart's outline (|x| >= 0.17), lengths 0.05-0.14, bulb + a hanging drop
      const RUNS = [{ psi: -44, len: 0.07 }, { psi: -29, len: 0.12 }, { psi: 27, len: 0.05 }, { psi: 37, len: 0.14 }, { psi: 50, len: 0.09 }];
      RUNS.forEach((rn, k) => {
        const a = rn.psi * DEG, s0 = -0.032, s1 = rn.len + 0.045, NS = 18, anchor = surf3(0, a, 0, 0), grp = new THREE.Group();
        const wf = (t) => 0.0165 * (1 - 0.3 * t) * (1 + 0.5 * sstep(0.85, 1, t)), hf = (t, u) => 0.0040 + 0.0062 * Math.sqrt(Math.max(0, 1 - u * u)) * (1 + 0.5 * sstep(0.85, 1, t));
        const rib = gridGeo(6, NS, (i, j) => { const t = j / NS, u = (i / 6) * 2 - 1; return surf3(mix(s0, s1, t), a, wf(t) * u, hf(t, u)).sub(anchor).toArray(); });
        const refs = new Float32Array(7 * (NS + 1) * 3); for (let j = 0; j <= NS; j++) for (let i = 0; i < 7; i++) nrm3(mix(s0, s1, j / NS), a).toArray(refs, (j * 7 + i) * 3);
        orientBy(rib, refs);
        const bulbR = 0.0105 + 0.0009 * k, bulb = new THREE.SphereGeometry(bulbR, 14, 10), bc = surf3(s1, a, 0, bulbR * 0.45).sub(anchor); bulb.translate(bc.x, bc.y, bc.z);
        jmesh(merged([rib, bulb]), grp, true);
        // gloss: a bean along the run's lit side, a dot on the bulb
        const NG = 8, gk = gridGeo(NG, 1, (i, j) => { const t = mix(0.12, 0.74, i / NG), w = -0.0058 + (j ? 1 : -1) * 0.0016 * Math.sin((Math.PI * i) / NG); return surf3(mix(s0, s1, t), a, w, hf(t, -0.35) + 0.0006).sub(anchor).toArray(); });
        const grefs = new Float32Array((NG + 1) * 2 * 3); for (let j = 0; j <= 1; j++) for (let i = 0; i <= NG; i++) nrm3(mix(s0, s1, mix(0.12, 0.74, i / NG)), a).toArray(grefs, (j * (NG + 1) + i) * 3);
        orientBy(gk, grefs); gmesh(gk, grp);
        const nb = nrm3(s1, a), dot = new THREE.SphereGeometry(bulbR * 0.26, 8, 6); dot.translate(bc.x + nb.x * bulbR * 0.85 - Math.cos(a) * bulbR * 0.3, bc.y + nb.y * bulbR * 0.85 + bulbR * 0.25, bc.z + nb.z * bulbR * 0.85 + Math.sin(a) * bulbR * 0.3); gmesh(dot, grp);
        if (k % 3 === 0) { const sg = tear(0.004), F = frameAt(s1 * 0.78, a, 0.003, hf(0.78, 0) + 0.0007); F.o.sub(anchor); place(sg, F); gmesh(sg, grp, seedM); }
        addEl(grp, anchor, k * 0.07);
        // the hanging drop under the end: its own group, it swells and lets go in `drip`
        const hang = new THREE.Group(), hr = 0.0085 + 0.0007 * k, hd = new THREE.SphereGeometry(hr, 12, 9); hd.scale(1, 1.35, 1);
        const hp = surf3(s1, a, 0, 0.004); hp.y -= bulbR + hr * 1.15; jmesh(hd, hang, true);
        const hg = new THREE.SphereGeometry(hr * 0.26, 8, 6); hg.translate(-hr * 0.35, hr * 0.5, hr * 0.78); gmesh(hg, hang);
        hang.position.copy(hp); smearG.add(hang); hangs.push({ g: hang, k, d: k * 0.07 + 0.05, pos: hp.clone(), hr });
      });
      // 9 splats on the outer petals: a main blob + 2-3 satellites + a gloss bean, a tomato seed on 1 blob in 3
      const SPL = [[34, 0.30, 0.034], [52, 0.19, 0.028], [71, 0.27, 0.044], [-36, 0.22, 0.030], [-58, 0.31, 0.040], [-80, 0.17, 0.024], [115, 0.26, 0.046], [-128, 0.21, 0.028], [160, 0.30, 0.038]];
      SPL.forEach(([psi, r, R0], k) => {
        const a = psi * DEG, dy = dOut(r), nl = Math.hypot(dy, 1), nr = dy / nl, ny = -1 / nl, ez = new V3(nr * Math.sin(a), ny, nr * Math.cos(a)), ex = new V3(Math.cos(a), 0, -Math.sin(a)), F = { ex, ey: new V3().crossVectors(ez, ex), ez };
        const o = new V3((r + nr * 0.003) * Math.sin(a), yOut(r) + ny * 0.003, (r + nr * 0.003) * Math.cos(a)), grp = new THREE.Group(), subs = [place(blob(R0, 5 + (k % 3), 200 + k, 0.0065), F)];
        for (let s = 0; s < 2 + (k % 2); s++) { const ang = TAU * hs(k * 3 + s + 5), dist = R0 * (1.35 + 0.5 * hs(k + s * 9)), sr = R0 * (0.16 + 0.14 * hs(k * 7 + s)), b2 = blob(sr, 4, 300 + k * 3 + s, 0.0045, 3, 14); b2.translate(Math.cos(ang) * dist, Math.sin(ang) * dist, 0); subs.push(place(b2, F)); }
        jmesh(merged(subs), grp);
        const gk = kidney(R0 * 0.7, R0 * 0.2, R0 * 0.1); gk.rotateZ(0.4); gk.translate(-R0 * 0.2, R0 * 0.3, 0.0071); gmesh(place(gk, F), grp);
        if ((k + 5) % 3 === 0) { const sg = tear(0.004); sg.rotateZ(hs(k) * TAU); sg.translate(R0 * 0.1, -R0 * 0.1, 0.0075); gmesh(place(sg, F), grp, seedM); }
        addEl(grp, o, 0.35 + k * 0.06);
      });
      // the pool r 0.12 in the dish, well off the heart's outline: centre (-0.235, 0.03), 5 lobes, 6 tomato seeds, a gloss bean
      {
        const cx = -0.235, cz = 0.03, nu = 40, rings = 6, ph = [TAU * hs(seed + 400), TAU * hs(seed + 401)], grp = new THREE.Group(), ay = dishY(0.24);
        const g = orient(gridGeo(nu, rings, (i, j) => { const a = (TAU * i) / nu, rho = j / rings, R = 0.120 * (1 + 0.08 * Math.sin(5 * a + ph[0]) + 0.03 * Math.sin(8 * a + ph[1])) * rho, x = cx + R * Math.cos(a), z = cz + R * Math.sin(a); return [x - cx, dishY(Math.hypot(x, z)) + 0.0012 + 0.0055 * Math.pow(Math.max(0, 1 - Math.pow(rho, 3)), 0.5) - ay, z - cz]; }, true), () => [0, 1, 0]);
        jmesh(g, grp);
        const gk = gridGeo(8, 1, (i, j) => { const t = i / 8, x = cx - 0.03 + 0.07 * (t - 0.5), z = cz + 0.04 + 0.0050 * Math.sin(Math.PI * t) * (j ? 1 : -1); return [x - cx, dishY(Math.hypot(x, z)) + 0.0071 - ay, z - cz]; });
        gmesh(orient(gk, () => [0, 1, 0]), grp);
        const seedsG = []; for (let s = 0; s < 6; s++) { const a = TAU * hs(s * 3 + 41 + seed), d = 0.075 * Math.sqrt(hs(s + 50 + seed)), x = cx + d * Math.cos(a), z = cz + d * Math.sin(a), sg = tear(0.004); sg.rotateX(-Math.PI / 2); sg.rotateY(hs(s + 60) * TAU); sg.translate(x - cx, dishY(Math.hypot(x, z)) + 0.0072 - ay, z - cz); seedsG.push(sg); }
        gmesh(merged(seedsG), grp, seedM);
        addEl(grp, new V3(cx, ay, cz), 0.9);
      }
      // the falling drops (runs 2 and 4), in prop-local space, stretched along the fall, a gloss dot each
      for (const k of [1, 3]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.0095 + 0.0007 * k, 12, 9), jm); m.castShadow = true; m.userData.solid = false; m.visible = false; whole.add(m);
        const gg = new THREE.SphereGeometry(0.0028, 8, 6); gg.translate(-0.003, 0.004, 0.007); gmesh(gg, m);
        dropEls.push({ m, k });
      }
      smearG.visible = false; smearEls.hangs = hangs;
    }

    // =============================================== per-frame state
    const notch = []; for (let k = 0; k <= 10; k++) notch.push(-Math.asin(0.633 * (-1 + 0.2 * k)));
    const smearOn = (e, s) => { const k = sstep(e.d, e.d + 0.45, s * 1.5 - 0.0); e.grp.scale.setScalar(Math.max(1e-4, k)); e.grp.visible = k > 0.002; };
    return {
      grip: 0,
      anchors,   // seatL / seatR: a prop with spec.ride ["<this id>", "seatL"] sits on the dish with every tilt, wobble and jolt (stage.js)
      apply(ps, t) {
        whole.rotation.z = (ps.tilt ?? 0) * DEG;   // the engine leans a prop by -tilt degrees (props3d): cancel it, tilt here is the beam
        const tilt = clamp(ps.tilt ?? S.tilt ?? 0, -1, 1), wob = clamp(ps.wobble ?? S.wobble ?? 0), jolt = clamp(ps.jolt ?? S.jolt ?? 0), smear = clamp(ps.smear ?? S.smear ?? 0), drip = clamp(ps.drip ?? S.drip ?? 0);
        const th0 = -Math.asin(0.633 * tilt), d = wob * (2.2 * Math.sin(TAU * 1.7 * t) + 0.6 * Math.sin(TAU * 4.1 * t)) * DEG, th = th0 + d, sw = wob * Math.sin(TAU * 1.7 * t - Math.PI / 2) * DEG;
        beamG.rotation.z = th;
        const hy = (sg) => 3.10 + sg * 1.5 * Math.sin(th), hx = (sg) => sg * 1.5 * Math.cos(th);
        for (const [side, sg] of [["L", -1], ["R", 1]]) {
          const A = asm[side], bounce = 0.015 * jolt * Math.sin(TAU * 5.2 * t + (sg > 0 ? 1.3 : 0));
          A.g.position.set(hx(sg), hy(sg) + bounce, 0); A.g.rotation.z = sw;
        }
        // the pointer's lapis tip drops into a notch when the beam angle passes one (th is the pointer's angle from straight down)
        let dmin = 9; for (const a of notch) dmin = Math.min(dmin, Math.abs(th - a) / DEG);
        const seat = 1 - sstep(0.35, 1.5, dmin);
        tipG.position.z = 0.0085 * (1 - seat) - 0.0105 * seat;
        // chain rattle
        if (jolt > 0.001 || links._on) { for (const L of links) { L.m.quaternion.copy(L.q0); if (jolt > 0.001) L.m.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), 4 * DEG * jolt * Math.sin(TAU * L.f * t + L.ph))); } links._on = jolt > 0.001; }
        // the feather tip lifts up to 1 cm
        featherG.rotation.x = -(0.01 / 0.46) * wob * (0.5 + 0.5 * Math.sin(TAU * 1.7 * t - Math.PI / 2)) * 1.0;
        // juice
        smearG.visible = smear > 0.002;
        if (smearG.visible) {
          for (const e of smearEls) smearOn(e, smear);
          for (const h of smearEls.hangs) {
            const on = sstep(h.d, h.d + 0.45, smear * 1.5), dr = (h.k === 1 || h.k === 3) ? drip : 0, ph = ((t + (h.k === 1 ? 0.2 : 0.55)) % 0.9) / 0.9, sc = on * (dr > 0 ? mix(1, 0.35 + 0.65 * sstep(0, 1, ph), dr) : 1);
            h.g.scale.setScalar(Math.max(1e-4, sc)); h.g.visible = sc > 0.002;
          }
          dropEls.forEach((D) => {
            const h = smearEls.hangs.find((q) => q.k === D.k), tau = ((t + (D.k === 1 ? 0.2 : 0.55)) % 0.9), on = drip > 0.01 && smear > 0.4;
            const A = asm.L, x0 = A.g.position.x + h.pos.x, y0 = A.g.position.y - PAN_DROP + h.pos.y, z0 = h.pos.z, fall = 0.5 * 9.81 * tau * tau, y = y0 - fall, floorY = 0.02;
            D.m.visible = on && y > floorY && tau > 0.02; if (D.m.visible) { D.m.position.set(x0, y, z0); D.m.scale.set(0.9, 1 + Math.min(0.6, tau * 1.6), 0.9); }
          });
        }
      },
    };
  },
};

// where each named hand point sits in the prop's own frame, level (the beam moves, these do not)
export const HEART_SCALE_GRIPS = {
  heartscale: {
    seatL: [-1.5, 1.03, 0], seatR: [1.5, 1.03, 0], rimL: [-1.5, 1.10, 0.40], rimR: [1.5, 1.10, 0.40],
    pillarHand: [Math.round(0.0849 * Math.sin(110 * DEG) * 1e4) / 1e4, 0.95, Math.round(0.0849 * Math.cos(110 * DEG) * 1e4) / 1e4], pivot: [0, 3.10, 0],
  },
};
// the state keys of the kind (props3d's KIT_STATE format): a "prop" action tweens these only if they are listed there; otherwise seed them
// at 0 with a dur-0 set first (tilt and wobble are propState defaults already)
export const HEART_SCALE_STATE = { heartscale: { tilt: 0, wobble: 0, jolt: 0, smear: 0, drip: 0 } };
