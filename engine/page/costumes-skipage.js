import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clothMat, liningMat, garment, trim, sstep } from "./costumes-art.js";
import { ribTexture, hash2 } from "./costumes-art-cast.js";

// Happiness EP02 "skip the boring parts" (16 Nov 2026): SPUD AGED. DESIGN.md section 2, builder pieces 1-3.
// costume.age "mid" | "old" on the spud costume (characters/potatobrawl/spud-mid.json, spud-old.json). castCostume
// (costumes-cast.js) calls skipAge(C, ch, out) after Spud's own costume (his teal sweater) is built; a costume without
// `age` draws as before. Everything is built once from the character's own surface; every mark is placed by index
// (hash2), nothing tiles, nothing random, no clock.
//
// USAGE (costume keys, all optional; the character files set `age` and, for old, `cardigan`):
//   age        "mid" | "old"
//              mid: 3 crow's feet (14 mm) and 1 under-eye line (22 mm) per eye, round gold glasses. NO cardigan.
//              old: 5 forehead lines (40-58 mm), 4 crow's feet (16-20 mm) and 2 under-eye lines per eye, 2 mouth lines (18 mm),
//                   22 skin spots #c79a63, round gold glasses, the grey cardigan.
//   glasses    false: leave the glasses off (default: on, both ages). Round gold wire: rim 2 mm #c8a23c, bridge 0.022 m between the
//              rims, arms along the sides of the head ending 0.01 m before the silhouette, lenses 12 % white sheen (see-through).
//              The lens is sized from the face: radius = half the eye spacing minus half the bridge (about 0.082 m on Spud; the
//              design's 0.052 would not cover his 0.072 x 0.09 eye), a touch taller than wide (glasses.tall, default 1.1).
//   cardigan   hex, old only (default "#9a958c"): the knit body (14 ribs per 0.1 m, each drawn once), open at the front (the teal
//              collar and sweater show), a rib band down both front edges, a ribbed hem, 4 buttons #7a5a34 at the heights 0.62, 0.50,
//              0.38, 0.26 (their spacing, scaled over the built front: it is only 0.25 m tall), sleeves ending 0.11 m before the hand centre with a
//              ribbed cuff (the sweater's own cuff shows past it), one stitched tan patch 0.09 x 0.07 on the LEFT elbow.
//   crease     ink colour (default "#8a6a46", drawn at 0.55 opacity, not black)
//   patch      the elbow patch colour (default Spud's "#9a6a3c")
// Posture (lean 4 / 14 degrees) and walk speed (0.85 / 0.55) are NOT character data keys: the clip generator sets them.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const merge = (gs) => { const keep = gs.filter((g) => g?.attributes?.position?.count); return keep.length === 1 ? keep[0] : mergeGeometries(keep.map((g) => (g.index ? g.toNonIndexed() : g))); };
const brushW = (u, W, heavy = 0.5) => W * (1 - heavy + heavy * u) * Math.pow(Math.sin(Math.PI * clamp01(u)), 0.55);
function strip(cs, sides, ws) {
  const pos = [], idx = [];
  cs.forEach((c, i) => { pos.push(...c.clone().addScaledVector(sides[i], -ws[i]).toArray(), ...c.clone().addScaledVector(sides[i], ws[i]).toArray()); });
  for (let i = 0; i < cs.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };

// ---------------------------------------------------------------- creases and spots (the old face method of costumes-plato.js)
function faceMarks(C, ch, parts, old) {
  const pl = ch.face?.place; if (!pl) return;
  const L = ch.face.layout || { eyeU: 0.35, eyeV: 0.32, mouthV: -0.12, mouthW: 0.27 }, r = 0.08 * (ch.face.size || 1);
  const eu = L.eyeU, ev = L.eyeV, o = pl(eu, ev).pos, d = 0.01;
  const su = pl(eu + d, ev).pos.distanceTo(o) / d, sv = pl(eu, ev + d).pos.distanceTo(o) / d;   // metres per face unit
  const lines = [];
  // a drawn stroke through points given in metres (dx, dy) from the face point (cu, cv): width tapers like a brush
  const line = (cu, cv, pts, W, heavy = 0.4) => {
    const cs = [], sides = [], ws = [], n = pts.length - 1;
    const at = (p) => { const c = pl(cu + p[0] / su, cv + p[1] / sv); return c; };
    pts.forEach((p, q) => {
      const c = at(p), a = at(pts[Math.max(0, q - 1)]).pos, b = at(pts[Math.min(n, q + 1)]).pos;
      const sd = c.normal.clone().cross(b.clone().sub(a)); if (sd.lengthSq() < 1e-14) sd.set(1, 0, 0);
      cs.push(c.pos.addScaledVector(c.normal, 0.0022)); sides.push(sd.normalize()); ws.push(brushW(q / n, W, heavy));
    });
    lines.push(strip(cs, sides, ws));
  };
  // n points on an arc from a to b, bowed by `bow` metres sideways
  const arc = (a, b, bow, n = 8) => Array.from({ length: n + 1 }, (_, q) => { const t = q / n, k = Math.sin(Math.PI * t) * bow, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [a[0] + dx * t - dy / l * k, a[1] + dy * t + dx / l * k]; });
  const W0 = old ? 0.0026 : 0.0021;   // half width of a crease stroke (about 1.2 to 1.5 px at the atlas scale)
  let id = old ? 100 : 0;
  for (const sd of [-1, 1]) {
    const eye = [sd * eu, ev], out = sd * (0.9 * r + 0.008), eyeH = 0.9 * r * (ch.face.eyeStyle?.oval || 1.24);
    // crow's feet: a fan from just outside the outer corner, each its own angle and length
    const nf = old ? 4 : 3, len0 = old ? 0.018 : 0.014;
    for (let k = 0; k < nf; k++) {
      id++;
      const ang = (k - (nf - 1) / 2) * (old ? 0.36 : 0.42) + (hs(id, 1) - 0.5) * 0.1, len = len0 * (0.86 + 0.28 * hs(id, 2)), s0 = [out + sd * 0.002, 0.004 + 0.004 * (hs(id, 3) - 0.5) + 0.003 * (k - (nf - 1) / 2)];
      line(eye[0], eye[1], arc(s0, [s0[0] + sd * len * Math.cos(ang), s0[1] + len * Math.sin(ang)], sd * 0.0015 * (hs(id, 4) - 0.3)), W0);
    }
    // under-eye lines: a long soft arc under the eye (22 mm); the old face adds a second, shorter one below it
    id++; line(eye[0], eye[1], arc([sd * -0.006, -eyeH - 0.01], [sd * 0.052, -eyeH - 0.016], -0.0035 * sd), W0 * (old ? 1.1 : 1.0), 0.5);
    if (old) { id++; line(eye[0], eye[1], arc([sd * 0.004, -eyeH - 0.028], [sd * 0.04, -eyeH - 0.036], -0.003 * sd), W0 * 0.9, 0.5); }
  }
  if (old) {
    // forehead: five lines of 40-58 mm, arching a little, each its own height, length and shift
    for (let k = 0; k < 5; k++) {
      const half = (0.020 + 0.009 * hs(k, 11)) * 1, cv = 1.15 + 0.17 * k + 0.03 * (hs(k, 12) - 0.5), cu = (hs(k, 13) - 0.5) * 0.02;
      const pts = Array.from({ length: 11 }, (_, q) => { const x = (q / 10 * 2 - 1) * half; return [x + cu, 0.005 * (1 - (x / half) ** 2) + 0.002 * Math.sin(x * 90 + k * 2) + 0.003 * (hs(k, 14) - 0.5) * (x / half)]; });
      line(0, cv, pts, W0 * 1.5, 0.45);
    }
    // laugh lines: one each side of the mouth (18 mm), curving down and in
    for (const sd of [-1, 1]) line(sd * (L.mouthW + 0.085), L.mouthV + 0.1, arc([0, 0], [sd * 0.003, -0.018], sd * 0.004, 7), W0 * 1.1, 0.5);
  }
  if (lines.length) {
    const m = new THREE.MeshBasicMaterial({ color: C.crease || "#8a6a46", transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    m.userData.ink = true; m.userData.noOutline = true;
    const cr = new THREE.Mesh(merge(lines), m); cr.userData.inkStroke = true; cr.renderOrder = 1; parts.add(cr);
  }
  if (old) {
    // 22 skin spots: flat marks in the skin, each its own place, size, shape and shade, kept off the eyes, brows and mouth
    const gs = [], spotM = new THREE.MeshStandardMaterial({ color: "#c79a63", roughness: 0.9, vertexColors: true }); spotM.userData.noOutline = true; spotM.userData.lookRole = "skin";
    spotM.polygonOffset = true; spotM.polygonOffsetFactor = -2; spotM.polygonOffsetUnits = -2;
    for (let i = 0, n = 0; n < 22 && i < 400; i++) {
      const u = (hs(i, 70) - 0.5) * 2.5, v = -0.55 + 2.45 * hs(i, 71), au = Math.abs(u);
      if (au > 0.08 && au < 0.66 && v > -0.02 && v < 0.64) continue;       // the eyes and their lids
      if (au < 0.72 && v > 0.64 && v < 1.08) continue;                      // the brows
      if (au < 0.5 && v < 0.12 && v > -0.6) continue;                       // the mouth and nose
      if (v > 1.04 && au < 0.3 && ((v - 1.15) % 0.17) < 0.06) continue;     // the forehead lines
      n++;
      const s = pl(u, v), rr = 0.005 + 0.007 * hs(i, 72) ** 1.5, g = new THREE.CircleGeometry(rr, 12), k = 0.8 + 0.2 * hs(i, 73);
      g.scale(1, 0.7 + 0.3 * hs(i, 74), 1); g.rotateZ(hs(i, 75) * 3);
      g.applyMatrix4(new THREE.Matrix4().compose(s.pos.clone().addScaledVector(s.normal, 0.0012), new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), s.normal), V(1, 1, 1)));
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(k), 3)); gs.push(g);
    }
    parts.add(mesh(merge(gs), spotM, false));
  }
}

// ---------------------------------------------------------------- round thin gold glasses
function glasses(C, ch, parts) {
  const pl = ch.face?.place; if (!pl) return;
  const G = C.glasses && typeof C.glasses === "object" ? C.glasses : {}, L = ch.face.layout || { eyeU: 0.35, eyeV: 0.32 };
  const RIM = 0.001, BRIDGE = G.bridge ?? 0.022, AWAY = G.away ?? 0.036;   // wire radius (2 mm across), gap between rims, how far in front of the skin the lenses stand
  const eL = pl(-L.eyeU, L.eyeV), eR = pl(L.eyeU, L.eyeV);
  const lens = G.r ?? Math.max(0.052, (eL.pos.distanceTo(eR.pos) - BRIDGE) / 2 - RIM), tall = G.tall ?? 1.15;
  const gold = new THREE.MeshStandardMaterial({ color: "#c8a23c", roughness: 0.35, metalness: 0.35 }); gold.userData.noOutline = true; gold.userData.noHatch = true;
  const glass = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.03, depthWrite: false, side: THREE.DoubleSide }); glass.userData.noOutline = true; glass.userData.noHatch = true;
  const glint = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, depthWrite: false }); glint.userData.noOutline = true; glint.userData.noHatch = true;
  const g = new THREE.Group(); g.name = "glasses";
  const thEye = L.eyeU * 0.74, phEye = L.eyeV * 0.55 - 0.05;
  const ctr = {};
  for (const sd of [-1, 1]) {
    const e = sd < 0 ? eL : eR, c = e.pos.clone().addScaledVector(e.normal, AWAY); ctr[sd] = c;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), e.normal);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(lens, RIM, 5, 40), gold); rim.scale.set(1, tall, 1); rim.position.copy(c); rim.quaternion.copy(q); g.add(rim);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(lens, 32), glass); disc.scale.set(1, tall, 1); disc.position.copy(c); disc.quaternion.copy(q); disc.renderOrder = 3; g.add(disc);
    // the sheen: one short bright arc at the upper outer side of the lens (the rest of the lens stays clear so the eye reads)
    { const gl = new THREE.Mesh(new THREE.TorusGeometry(lens * 0.8, 0.0014, 3, 10, 0.8), glint); gl.scale.set(1, tall, 1); gl.position.copy(c); gl.quaternion.copy(q); gl.rotateZ(sd > 0 ? 1.0 : 1.34); gl.translateZ(0.0005); gl.renderOrder = 4; g.add(gl); }
    // the arm: from the rim's outer edge back along the side of the head, lying just off the skin, ending 0.01 m before the silhouette
    const tan = ch.surf(sd * thEye + 0.01, phEye).pos.sub(ch.surf(sd * thEye - 0.01, phEye).pos).normalize().multiplyScalar(sd);   // outward along the surface (th rises toward +x)
    const start = c.clone().addScaledVector(tan.clone().multiplyScalar(1), lens), pts = [start];
    let xmax = 0; for (let th = 0; th < 1.75; th += 0.02) xmax = Math.max(xmax, Math.abs(ch.surf(sd * th, phEye).pos.x));
    for (let k = 1; k <= 18; k++) {
      const th = sd * (thEye + 0.04 + (k / 18) * 1.1), s = ch.surf(th, phEye + 0.03 * (k / 18)), off = 0.004 + (AWAY - 0.004) * (1 - sstep(0, 0.4, k / 18)) ** 2, p = s.pos.addScaledVector(s.normal, off);
      if (Math.abs(p.x) > xmax - 0.01) break;
      pts.push(p);
    }
    if (pts.length > 2) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, RIM, 4, false), gold));
  }
  // the bridge: a small arch over the nose between the rims' inner edges
  { const a = ctr[-1].clone(), b = ctr[1].clone(), m = a.clone().lerp(b, 0.5), dir = b.clone().sub(a).normalize();
    const p0 = a.clone().addScaledVector(dir, lens), p1 = b.clone().addScaledVector(dir, -lens), up = V(0, 1, 0);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, p0.clone().lerp(p1, 0.5).addScaledVector(up, 0.012).addScaledVector(eL.normal.clone().lerp(eR.normal, 0.5), 0.004), p1), 8, RIM, 4, false), gold)); }
  parts.add(g);
}

// ---------------------------------------------------------------- the grey cardigan (old only)
const GAP = 0.2;   // half the opening at the front (rad round the body)
function cardigan(C, ch, parts, out) {
  const grey = C.cardigan || "#9a958c", dark = `#${new THREE.Color(grey).multiplyScalar(0.6).getHexString()}`, dk2 = `#${new THREE.Color(grey).multiplyScalar(0.74).getHexString()}`;
  const front = -0.58, back = -0.1, neck = (th) => front + (back - front) * 0.5 * (1 - Math.cos(th)), hem = -1.23, NU = 190, NV = 36, TH = 0.02;
  const from = GAP, to = Math.PI * 2 - GAP;
  const ribs = ribTexture(300, 2048, 64, 7.7), ribPlk = ribTexture(6, 128, 128, 3.3);   // one rib line each, hash placed
  const cloth = (map, color = grey) => { const m = clothMat(color, { side: THREE.DoubleSide }); m.map = map; return m; };
  const Gm = garment(ch, { topFn: neck, top: front, hem, folds: 7, depth: 0.007, flare: 0.012, lift: 0.068, lift0: 0.05, wave: 0.008, thick: TH, phase: 2.1, grad: 0.2, segs: NU, rows: NV, from, to });
  const guv = (g, fn) => { const n = g.attributes.position.count, uv = new Float32Array(n * 2); for (let j = 0, k = 0; j <= NV; j++) for (let i = 0; i <= NU; i++, k++) { const [u, v] = fn(i, j); uv[k * 2] = u; uv[k * 2 + 1] = v; } g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g; };
  guv(Gm.outer, (i, j) => [(from + (to - from) * i / NU) / (Math.PI * 2), j / NV]);
  const bodyM = cloth(ribs); bodyM.vertexColors = true;
  parts.add(mesh(Gm.outer, bodyM));
  parts.add(mesh(Gm.inner, liningMat(dark), false));
  parts.add(mesh(Gm.hem, clothMat(grey, { side: THREE.DoubleSide }), false));
  // a band along a garment path (th0..th1, v0..v1), a little proud of the cloth: the hem rib, the front bands, the neck
  const band = (th0, th1, v0, v1, nu, nv, off, uvf) => {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = Gm.at(th0 + (th1 - th0) * i / nu, v0 + (v1 - v0) * j / nv, off); pos.push(p.x, p.y, p.z); uv.push(...uvf(i / nu, j / nv)); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const hemV = 0.9;   // the hem rib: the last tenth (about 0.03 m)
  parts.add(mesh(band(from, to, hemV, 1, NU, 6, TH + 0.007, (a, b) => [(from + (to - from) * a) / (Math.PI * 2), b]), cloth(ribs, dk2)));
  for (const [t0, t1, nm] of [[from, from + 0.075, "L"], [to - 0.075, to, "R"]]) parts.add(mesh(band(t0, t1, 0, hemV, 4, NV, TH + 0.007, (a, b) => [a, b * 6]), cloth(ribPlk, dk2)));   // the button band and the one it laps over
  parts.add(mesh(band(from, to, 0, 0.1, NU, 4, TH + 0.007, (a, b) => [(from + (to - from) * a) / (Math.PI * 2), b]), cloth(ribs, dk2)));   // the neck band
  // ink: the hem's top edge, the inside edge of each front band
  { const ink = clothMat(dark, { side: THREE.DoubleSide }); ink.userData.ink = true;
    const edge = (path, r = 0.0016) => { const m = trim(path, r, ink); m.castShadow = false; return m; };
    parts.add(edge(Array.from({ length: 60 }, (_, i) => Gm.at(from + (to - from) * i / 59, hemV, TH + 0.009))));
    parts.add(edge(Array.from({ length: 24 }, (_, j) => Gm.at(from + 0.075, hemV * j / 23, TH + 0.009))));
    parts.add(edge(Array.from({ length: 24 }, (_, j) => Gm.at(to - 0.075, hemV * j / 23, TH + 0.009)))); }
  // four buttons down the band on the wearer's right (screen left): their spacing as on the sheet
  { const btn = new THREE.MeshStandardMaterial({ color: "#7a5a34", roughness: 0.55 }); btn.userData.lookRole = "cloth";
    const thr = new THREE.MeshBasicMaterial({ color: "#3a2814" });
    [0.62, 0.50, 0.38, 0.26].forEach((y) => {
      // the design's heights (0.62 .. 0.26) are the button spacing on his sheet; Spud's built cardigan front is only about 0.25 m tall,
      // so the four keep their spacing ratio over the band between the neck and the hem rib
      const v = 0.14 + ((0.62 - y) / 0.36) * 0.62;
      const p = Gm.at(to - 0.04, v, TH + 0.007), a = Gm.at(to - 0.04 - 0.01, v, TH + 0.007), b = Gm.at(to - 0.04 + 0.01, v, TH + 0.007), c = Gm.at(to - 0.04, v - 0.01, TH + 0.007), e = Gm.at(to - 0.04, v + 0.01, TH + 0.007);
      const nrm = b.clone().sub(a).cross(e.clone().sub(c)).normalize(); if (nrm.dot(p.clone().sub(V(0, p.y, 0))) < 0) nrm.negate();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nrm), m = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 14, 8), btn); m.scale.set(1, 1, 0.42); m.position.copy(p).addScaledVector(nrm, 0.002); m.quaternion.copy(q); m.castShadow = true; parts.add(m);
      for (const dx of [-0.0045, 0.0045]) for (const dy of [-0.0045, 0.0045]) { const t = new THREE.Mesh(new THREE.CircleGeometry(0.0017, 6), thr); t.position.copy(p).addScaledVector(nrm, 0.0027); t.quaternion.copy(q); t.translateX(dx); t.translateY(dy); parts.add(t); }
    }); }

  // sleeves over the sweater's: wider, ending 0.11 m before the hand centre, a ribbed cuff, built as the sweater's own (one frame
  // carried along the arm without twist, so the ribs do not swim)
  const SL = { from: 0.015, gap: C.cardiganGap ?? 0.11, r0: 0.112, r1: 0.088, cuff: 0.01, n: 16, radial: 18, cuffLen: 0.032 };
  const armRib = ribTexture(84, 1024, 64, 9.1), armM = clothMat(grey, { side: THREE.DoubleSide, vertexColors: true }); armM.map = armRib;
  const PH = 0.035, patchAt = { u: 0.4, k: 1 }, patch = new THREE.Group();
  const slv = {}; for (const s of ["L", "R"]) { slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), armM); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0);
  const sleeves = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Ln = Math.max(0.05, curve.getLength());
      const to2 = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / Ln)), cuffT = 1 - SL.cuffLen / (Ln * (to2 - SL.from)), n = SL.n, R = SL.radial;
      const radius = (t) => (SL.r0 + (SL.r1 - SL.r0) * t) * (1 - 0.05 * sstep(cuffT - 0.06, cuffT - 0.01, t) + 0.0) + SL.cuff * sstep(cuffT - 0.01, cuffT + 0.05, t) - 0.003 * sstep(cuffT - 0.05, cuffT, t) * (1 - sstep(cuffT, cuffT + 0.04, t));
      if (s === "L") { const pu = Math.min(0.42, to2 - (SL.cuffLen + 0.01 + PH) / Ln), tp = (pu - SL.from) / (to2 - SL.from); patchAt.u = pu; patchAt.k = (radius(tp) + 0.003) / PR; }   // the elbow (0.42 along the arm, where the sweater's own patch is), kept 10 mm off the cuff, on the sleeve's own radius
      const pos = new Float32Array((n + 1) * (R + 1) * 3), uv = new Float32Array((n + 1) * (R + 1) * 2), col = new Float32Array((n + 1) * (R + 1) * 3), idx = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = SL.from + (to2 - SL.from) * t, p = curve.getPointAt(u), T = curve.getTangentAt(u);
        if (i === 0) { const w = sstep(0.75, 0.95, Math.abs(T.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r); }
        _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
        const r = radius(t) * (1 - 0.18 * sstep(0.93, 1, t)), sh = t > cuffT - 0.01 ? 0.84 : 1;
        for (let k = 0; k <= R; k++) {
          const a = (k / R) * Math.PI * 2, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k;
          pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z;
          uv[q * 2] = k / R; uv[q * 2 + 1] = t; col[q * 3] = col[q * 3 + 1] = col[q * 3 + 2] = sh;   // the ribs run along the arm, once round
        }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const N = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
      slv[s].geometry.dispose(); slv[s].geometry = g; slv[s].visible = true;
    }
  };
  // the stitched tan patch on the LEFT elbow (0.09 x 0.07): a piece of cloth curved round the sleeve, a pale stitch each side,
  // riding the arm's curve every frame on the side that faces out and back
  const PR = 0.1, PA = 0.045 / PR;   // the patch is built at radius PR and scaled round the sleeve each frame (sleeves() sets patchAt)
  { const n = 10, pts = []; for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const a = (i / n - 0.5) * 2 * PA, y = (j / n - 0.5) * 2 * PH; pts.push(V(Math.sin(a) * PR, y, Math.cos(a) * PR)); }
    const pos = new Float32Array(pts.length * 3), idx = []; pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    patch.add(mesh(g, clothMat(C.patch || "#9a6a3c", { side: THREE.DoubleSide }), false));
    const thread = new THREE.MeshStandardMaterial({ color: "#e6d9b8", roughness: 0.8 }); thread.userData.lookRole = "cloth";
    const st = (a, y, alongY) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.0028, 0.016, 3, 6), thread); m.position.set(Math.sin(a) * (PR + 0.002), y, Math.cos(a) * (PR + 0.002)); if (!alongY) m.rotation.z = Math.PI / 2; m.rotation.y = a; patch.add(m); };
    for (const k of [-0.5, 0.5]) { st(k * PA, PH, true); st(k * PA, -PH, true); st(PA, k * PH, false); st(-PA, k * PH, false); } }
  patch.visible = false; ch.root.add(patch);
  // the sweater's own elbow patch (hidden by the cardigan's sleeve; ours is on top): the last hidden Group of 9 parts in ch.root before ours
  const sweaterPatch = ch.root.children.filter((o) => o.isGroup && o !== patch && o.children.length === 9 && !o.visible).pop() || null;
  const _x = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4(), base = out.apply;
  out.apply = (st, t, ...r) => {
    base && base(st, t, ...r); sleeves(); if (sweaterPatch) sweaterPatch.visible = false;
    const A = ch.arms?.L; if (!A?.shoulder || !A.elbow || !A.hand) { patch.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), p = curve.getPointAt(patchAt.u), T = curve.getTangentAt(patchAt.u);
    _z.set(1, 0, -0.7); _z.addScaledVector(T, -T.dot(_z)).normalize();
    _x.crossVectors(T, _z).normalize();
    patch.quaternion.setFromRotationMatrix(_m.makeBasis(_x, T, _z)); patch.position.copy(p); patch.scale.set(patchAt.k, 1, patchAt.k); patch.visible = true;
  };
}

export function skipAge(C, ch, out) {
  const age = C.age; if (age !== "mid" && age !== "old") return out;
  const parts = ch.potatoParts; if (!parts) return out;
  faceMarks(C, ch, parts, age === "old");
  if (C.glasses !== false) glasses(C, ch, parts);
  if (age === "old") cardigan(C, ch, parts, out);
  return out;
}
