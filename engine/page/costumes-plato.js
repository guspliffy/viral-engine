import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clothMat, inkMesh, sstep } from "./costumes-art.js";
import { texOf, wash, hash2 } from "./costumes-art-cast.js";

// ANCIENT ALIENS EP03 ATLANTIS kit (15 Nov 2026, task T6, design round 2): PLATO, an old potato philosopher, cast file
// characters/ancient-aliens/plato.json, face type "plato" in characters/sheet-cast.json. One costume type, "plato", through castCostume
// (costumes-cast.js). Design: DESIGNS.md section 8; the look target is panels 39, 47 and 48 of the Atlantis sheets (Plato at his desk, the wink
// with a finger at his lips, Spud in front of him). He never speaks. Acts: write, look up, wink (left eye), finger to lips.
//
//   plato   Body 1.08 high x 0.80 wide x 0.70 deep (lump 0.04, taper 0.06), skin #e0a655 (a shade duller than Spud), no sprout. Face: Spud's
//           eye style, smaller and rounder with a smaller iris (face size 0.84, oval 1.12, iris 0.56), heavy lids 0.55 (the lid line cuts the
//           top of the iris), thick white brows (thick 1.5, #e6e4e2), the eyes set high (eyeV 0.66) so the moustache sits right under them, no
//           blush, 20 freckles; the costume adds two short lines under each eye and 22 skin spots on the bare forehead and temples (each its
//           own place, size and shade).
//           - HAIR: ONE soft white mass, a cap round the back of the head from the hairline: a high bald forehead, a small forelock at the
//             top, down the sides to eye height (bare skin between it and the beard), lower round the nape. Its edge is 25 curls of uneven
//             width (one lobe in each scallop of the hairline, fuller over the ears) with 27 bigger waves behind them, all running into each
//             other (creases between them, shaded grey); each lobe has its own drawn curl stroke (a hook), half of them a second short arc;
//             one drawn line runs along the hairline.
//           - BEARD + MOUSTACHE: ONE full rounded mass from sideburn to sideburn (it covers the mouth and the chin), hanging from the chin
//             down onto the chest (to about 0.26 m under the body's middle), a scalloped lower edge of 8 curls, about 30 soft lobes, drawn
//             curl hooks, 8 strand lines and grey shade in the creases; a broad moustache in two halves lies over it right under the eyes
//             (its own form with a drawn outline, a parting, a scalloped lower edge). The mouth is under the hair: he never speaks.
//           - ROBE (a himation): a cream wrap round the body from a rolled collar (two rolls) that follows the beard's outline in front and
//             stays under the hair behind, hanging from the belly in 15 irregular pleats to a wavy hem 0.05 m off the floor; over it ONE
//             broad band of pleats that fans from the left shoulder diagonally down across the front to the hem at his right, and from that
//             shoulder down the back as the thrown end (free hem at the back). Drawn fold lines along every crease and edge, a painted wash
//             with fibre flecks, no border. Seated (st.sit > 0) the hanging part shortens and opens forward so it lies over the lap and the
//             seat (not through them).
//           - SLEEVES: the cloth hangs over each upper arm as a short draped sleeve (left to 52 % of the arm, right to 40 %, wider and
//             hanging lower toward its wavy open end, radial pleats, rebuilt every frame on the arm's own curve, whatever pose). Below them:
//             bare golden forearms (limbs.color), cream 3-finger gloves (costume.hands #f6dcae, size 1.5).
//           - SANDALS: golden bare feet with a dark-brown sole and two straps each (costume.sandal #6a4a2e), under the robe's hem.
//           costume keys (default): robe "#efe8d6" | fold "#b9ab8c" (the deep shade of the cream: fold ink) | hair "#dedddd" (hair, beard,
//             moustache) | sandal "#6a4a2e" | hands "#f6dcae" (the glove)
//           face.final in plato.json carries his face layout (the sheet look would otherwise reset the eyes): size 0.84, eyeU 0.34,
//             eyeV 0.66, browV 0.94, cheekU 0.78, cheekV 0.34 (where the freckles sit: beside and under the eyes).
//           No props, nothing standable. Origin: his feet on the floor (the rig's). The sandals show when he walks or sits (the robe covers
//           them standing). Seated: a chair at SEAT_Y, "sit" with hands "keep"; the hanging cloth shortens and opens forward by itself.
//
// POSE VALUES (checked in the bench stills, storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-plato-sheet.png; rig { hand: 2 }):
//   finger to lips (right hand, index straight up in front of the moustache's parting, the hand in front of the beard):
//     { do: "arm", side: "R", pose: { o: [-0.37, 0.4, 0.56], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } }, dur: 0.45, ease: "settle" }
//     { do: "grip", side: "R", shape: "point", dur: 0.2 }
//   wink (his left eye, the +x one): { do: "face", lidL: 1, browL: -0.45, cornerL: 0.5, dur: 0.12 }   (back: lidL 0.55, browL 0, cornerL 0)
//     as panel 47 the open eye goes wide with its brow up: add lidR: 0.15, browR: 0.35 (back: lidR 0.55, browR 0)
//   writing (seated on a chair, desk top 0.72 m high 0.9 m in front of the chair's centre, right hand forward on it):
//     right { o: [-0.2, 0.283, 0.68] }, left { o: [-0.12, 0.283, 0.5] }; eyes down { do: "look", to: [0, -0.4] }
// Hand-drawn rules as everywhere (costumes-aliens.js): each mark has its own place, width and strength from a hash of its index (no
// repeating pattern, no Math.random, no clock).

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const wrapPi = (x) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const dirOf = (th, ph) => V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));   // theta 0 = front, phi = elevation
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * Math.PI / 2) ** 2);

// a smooth curve through [x, y] points (x rising): cubic Hermite, flat at both ends
function curveOf(pts) {
  const n = pts.length, m = pts.map((p, i) => (i === 0 || i === n - 1 ? 0 : (pts[i + 1][1] - pts[i - 1][1]) / (pts[i + 1][0] - pts[i - 1][0])));
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (pts[i + 1][0] < x) i++;
    const h = pts[i + 1][0] - pts[i][0], t = (x - pts[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}
// n scallops of uneven width over one period: 0 at each cusp, 1 at each scallop's middle; .mid = the middles, .wid = the widths (0..period)
function scallops(n, seed, period, spread = 0.7) {
  const b = []; let x = 0; for (let i = 0; i < n; i++) { b.push(x); x += 1 - spread / 2 + spread * hs(i, seed); }
  const tot = x, f = (t) => { const u = ((((t / period) % 1) + 1) % 1) * tot; let i = n - 1; while (b[i] > u) i--; return Math.sin(Math.PI * (u - b[i]) / ((i + 1 < n ? b[i + 1] : tot) - b[i])); };
  f.mid = b.map((v, i) => ((v + (i + 1 < n ? b[i + 1] : tot)) / 2 / tot) * period); f.wid = b.map((v, i) => (((i + 1 < n ? b[i + 1] : tot) - v) / tot) * period); return f;
}

// ---------- hand-painted cloth map (a grey multiplier on the cloth colour): a soft wash, fibre flecks, a few long vertical streaks ----------
function paintTex(W, H, seed, base, washAmp, draw) {
  const buf = wash(W, H, 90, seed, washAmp), lift = new Float32Array(W * H);
  for (let k = 0; k < buf.length; k++) buf[k] += base;
  const stroke = (x0, y0, x1, y1, w0, w1, val, dark) => {
    const pad = Math.max(w0, w1) + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(H - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), w = w0 + (w1 - w0) * u;
      const a = 1 - sstep(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = y * W + (((x % W) + W) % W);
      if (dark) lift[q] = Math.min(lift[q], -a * val); else if (lift[q] >= 0) lift[q] = Math.max(lift[q], a * val);
    }
  };
  draw(stroke, (i, n) => hash2(i * 3.17 + n * 11.3 + seed, i * 0.71 + n * 1.7 + seed * 0.37));
  for (let k = 0; k < buf.length; k++) buf[k] += lift[k];
  return texOf(buf, W, H, false);
}
const TEX = new Map();
function robeTex(seed) {
  const key = `robe|${seed}`; if (TEX.has(key)) return TEX.get(key);
  const W = 1024, H = 512;
  const t = paintTex(W, H, seed, 0.965, 0.03, (stroke, h) => {
    for (let i = 0; i < 320; i++) { const x = h(i, 1) * W, y = h(i, 2) * H, l = 3 + 8 * h(i, 3), dark = h(i, 6) < 0.32; stroke(x, y, x + 1.4 * (h(i, 4) - 0.5), y + l, 0.8 + 0.6 * h(i, 5), 0.4, dark ? 0.05 + 0.04 * h(i, 7) : 0.03, dark); }
    for (let k = 0; k < 46; k++) {   // long soft streaks down the cloth: where it has been creased and sat on
      const x0 = h(k, 11) * W, y0 = H * (0.05 + 0.5 * h(k, 12)), y1 = y0 + H * (0.2 + 0.4 * h(k, 13)), w = 1.4 + 2.4 * h(k, 14), val = 0.035 + 0.05 * h(k, 15), bend = (h(k, 16) - 0.5) * 16;
      let px = x0, py = y0; for (let i = 1; i <= 5; i++) { const tt = i / 5, nx = x0 + bend * Math.sin(tt * 2.2 + k), ny = y0 + (y1 - y0) * tt; stroke(px, py, nx, ny, w, w * 0.7, val, true); px = nx; py = ny; }
    }
  });
  TEX.set(key, t); return t;
}

// ---------- a ribbon along points: a brush stroke lying on a surface (sides: one vector per point, ws: half width per point) ----------
function strip(cs, sides, ws) {
  const pos = [], idx = [];
  cs.forEach((c, i) => { pos.push(...c.clone().addScaledVector(sides[i], -ws[i]).toArray(), ...c.clone().addScaledVector(sides[i], ws[i]).toArray()); });
  for (let i = 0; i < cs.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const brushW = (u, W, heavy = 0.5) => W * (1 - heavy + heavy * u) * Math.pow(Math.sin(Math.PI * clamp01(u)), 0.55);
// a stroke through points on a surface (nrm: the surface's normal at each). even: a contour line (nearly one width, a slow wobble) instead of a brush stroke
function stroke(pts, nrm, W, heavy = 0.5, even = false) {
  const n = pts.length, sides = [], ws = [];
  for (let i = 0; i < n; i++) {
    const sd = nrm[i].clone().cross(pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)])); if (sd.lengthSq() < 1e-14) sd.set(1, 0, 0);
    sides.push(sd.normalize()); const u = i / (n - 1);
    ws.push(even ? W * (0.78 + 0.22 * Math.sin(u * 19 + W * 7000)) * Math.pow(Math.sin(Math.PI * clamp01(0.02 + 0.96 * u)), 0.3) : brushW(u, W, heavy));
  }
  return strip(pts, sides, ws);
}
const merge = (gs) => {
  const keep = gs.filter((g) => g?.attributes?.position?.count);
  return keep.length === 1 ? keep[0] : mergeGeometries(keep.map((g) => (g.index ? g.toNonIndexed() : g)));
};

// ---------- a surface from a (u, v) grid: at(u, v) -> Vector3 (its .k, if set, is the vertex's shade 0..1); faces turned to `outOf(p)` ----------
function gridGeo(nu, nv, at, outOf, seam = false) {
  const pos = [], uv = [], col = [], idx = []; let shaded = false;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv);
    const k = p.k ?? 1; if (p.k != null) shaded = true; col.push(k, k, Math.min(1, k + (1 - k) * 0.2));
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  // which way do the faces look? (sampled; a grid's winding depends on how its u and v run)
  let s = 0; const A = V(0, 0, 0), B = V(0, 0, 0), Cc = V(0, 0, 0);
  for (let q = 0; q < idx.length; q += 3 * Math.max(1, Math.floor(idx.length / 3 / 200))) {
    A.fromArray(pos, idx[q] * 3); B.fromArray(pos, idx[q + 1] * 3); Cc.fromArray(pos, idx[q + 2] * 3);
    const n = B.clone().sub(A).cross(Cc.clone().sub(A)); if (n.lengthSq() < 1e-16) continue;
    s += Math.sign(n.dot(outOf(A.clone().add(B).add(Cc).multiplyScalar(1 / 3))));
  }
  if (s < 0) for (let q = 0; q < idx.length; q += 3) { const t = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = t; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  if (shaded) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  if (seam) {   // the first column is the last one: one normal for both
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}

// ---------- wave lobes of a hair mass: the highest and the second highest lobe over the point p (their difference is small in a crease) ----------
function lobeTop(p, lobes) {
  let m1 = 0, m2 = 0;
  for (const l of lobes) {
    const dx = p.x - l.c.x, dy = p.y - l.c.y, dz = p.z - l.c.z, a = (dx * l.u.x + dy * l.u.y + dz * l.u.z) / l.ra, b = (dx * l.w.x + dy * l.w.y + dz * l.w.z) / l.rb, q = a * a + b * b;
    if (q >= 1 || Math.abs(dx * l.n.x + dy * l.n.y + dz * l.n.z) > 0.2) continue;
    const h = l.amp * Math.pow(1 - q, 0.6); if (h > m1) { m2 = m1; m1 = h; } else if (h > m2) m2 = h;
  }
  return [m1, m2];
}
const lobeShade = (m1, m2) => 1 - 0.17 * Math.max((1 - sstep(0, 0.009, m1 - m2)) * sstep(0.001, 0.008, m2), 0.75 * (1 - sstep(0, 0.012, m1)));
// a lobe at c on a surface with normal n: its long axis is `along` turned by rot round the normal
const lobeAt = (c, n, along, rot, ra, rb, amp) => {
  const u0 = along.clone().addScaledVector(n, -along.dot(n)).normalize(), w0 = n.clone().cross(u0), u = u0.clone().multiplyScalar(Math.cos(rot)).addScaledVector(w0, Math.sin(rot));
  return { c, n, u, w: n.clone().cross(u), ra, rb, amp };
};

// ---------- the body's skirt: hangs from the ring at elevation phJ straight to the height yHem, opening to `flare` times the ring's radius ----------
function skirtSurface(ch, phJ, phEnd, yHem, flare) {
  const pt = (th, ph) => {
    if (ph >= phJ) return ch.surf(th, ph).pos;
    const s0 = ch.surf(th, phJ).pos, t = Math.min(1.3, (phJ - ph) / (phJ - phEnd)), f = 1 + (flare - 1) * Math.sin(Math.min(1, t) * Math.PI / 2) ** 1.6;
    return V(s0.x * f, s0.y + (yHem - s0.y) * t, s0.z * f);
  };
  return Object.assign(Object.create(ch), { surf(th, ph) {
    if (ph >= phJ + 0.004) return ch.surf(th, ph);
    const p = pt(th, ph), e = 2e-3, a = pt(th + e, ph).sub(pt(th - e, ph)), b = pt(th, ph + e).sub(pt(th, ph - e)), n = a.cross(b).normalize();
    if (n.x * p.x + n.z * p.z < 0) n.negate();
    return { pos: p, normal: n };
  } });
}

// ---------- a closed cloth with a real edge: outer face, inner face, top edge, hem edge; at(u, v, off) -> the point off m out of the inner face ----------
function clothSlab(nu, nv, at, thick) {
  const pos = [], uv = [], idx = []; let base = 0;
  const grid = (nu2, nv2, pt, flip, uvf) => {
    for (let j = 0; j <= nv2; j++) for (let i = 0; i <= nu2; i++) { const p = pt(i / nu2, j / nv2), q = uvf(i / nu2, j / nv2); pos.push(p.x, p.y, p.z); uv.push(q[0], q[1]); }
    for (let j = 0; j < nv2; j++) for (let i = 0; i < nu2; i++) { const a = base + j * (nu2 + 1) + i, b = a + 1, c = a + nu2 + 1, d = c + 1; if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
    base += (nu2 + 1) * (nv2 + 1);
  };
  const same = (u, v) => [u, v];
  grid(nu, nv, (u, v) => at(u, v, thick), false, same);
  grid(nu, nv, (u, v) => at(u, v, 0), true, same);
  grid(nu, 1, (u, k) => at(u, 0, k ? 0 : thick), true, (u) => [u, 0.002]);
  grid(nu, 1, (u, k) => at(u, 1, k ? 0 : thick), false, (u) => [u, 0.998]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // a seam-free normal where the first column meets the last (the cloth goes all the way round)
  const N = g.attributes.normal;
  for (let j = 0; j <= nv; j++) for (const off of [0, (nu + 1) * (nv + 1)]) { const a = off + j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  return g;
}

// ---------- a draped sleeve on an arm's own curve, rebuilt for any pose: a tube from ta to about tb that widens, hangs lower on its under side
// toward its open end (cloth over an arm), has radial pleats and a wavy rim. Returns the geometry and pt(t, a): a point on it (for the fold ink) ----------
function sleeve(curve, ta, tb, rAt, hang, phase, n = 16, R = 26) {
  const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), tMax = Math.min(0.95, tb * 1.14), F = [], M = 24;
  curve.getTangentAt(ta, T); const w = sstep(0.75, 0.95, Math.abs(T.y)); Nn.set(0, 1 - w, w);
  for (let i = 0; i <= M; i++) { const t = ta + (tMax - ta) * (i / M), p = curve.getPointAt(t); curve.getTangentAt(t, T); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); B.crossVectors(T, Nn); F.push({ p, N: Nn.clone(), B: B.clone() }); }
  const frame = (t) => { const x = clamp01((t - ta) / (tMax - ta)) * M, i = Math.min(M - 1, Math.floor(x)), f = x - i, a = F[i], b = F[i + 1]; return { p: a.p.clone().lerp(b.p, f), N: a.N.clone().lerp(b.N, f).normalize(), B: a.B.clone().lerp(b.B, f).normalize() }; };
  const rim = (a) => tb * (1 + 0.09 * Math.sin(a * 3 + phase) + 0.05 * Math.sin(a * 5 + phase * 2.3));
  const pt = (t, a, off = 0) => {
    const f = frame(t), d = f.N.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.B, Math.sin(a)), p = f.p.clone().addScaledVector(d, rAt(t, a) + off);
    p.y -= hang(t) * Math.pow(Math.max(0, -d.y), 1.5); p.o = d; return p;
  };
  const cen = [], g = gridGeo(R, n, (u, v) => { const a = u * TAU, t = ta + (rim(a) - ta) * v, p = pt(t, a); cen.push(frame(t).p); return p; }, (p) => { let best = 0, bd = 1e9; for (let i = 0; i < cen.length; i += 7) { const d = cen[i].distanceToSquared(p); if (d < bd) { bd = d; best = i; } } return p.clone().sub(cen[best]); }, true);
  return { geo: g, pt, rim };
}

export const PLATO_TYPES = ["plato"];
export function plato(C, ch, out) {
  const parts = ch.potatoParts, hairC = C.hair || "#dedddd", robeC = C.robe || "#efe8d6", foldC = C.fold || "#b9ab8c";
  const skinInk = "#b07a3c", hairInk = "#b3aca6", seed = 5.3;
  const RX = ch.rx, RY = ch.ry, RZ = ch.rz, CY = ch.cy;
  const body = (d) => ({ pos: ch.bodyPoint(d), normal: V(d.x / RX, d.y / RY, d.z / RZ).normalize() });   // the skin under direction d, its (ellipsoid) normal
  const outBody = (p) => V(p.x / RX, (p.y - CY) / RY, p.z / RZ);
  const hairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.9, vertexColors: true }); hairM.userData.lookRole = "hair"; hairM.userData.noHatch = true;
  // the surface normal of a two-parameter surface f at (a, b), turned to the side `ref` looks to
  const nrmOf = (f, a, b, ea, eb, ref) => { const n = f(a + ea, b).sub(f(a - ea, b)).cross(f(a, b + eb).sub(f(a, b - eb))); if (n.lengthSq() < 1e-18) return ref.clone().normalize(); n.normalize(); return n.dot(ref) < 0 ? n.negate() : n; };

  // ================================================================ BEARD: the edges first (the hair and the robe keep clear of them)
  const TB = 1.3, PJB = -0.28;   // half width round the body (theta); below elevation PJB the beard hangs straight down from the chin
  const bTop0 = curveOf([[0, 0.05], [0.35, 0.04], [0.7, -0.01], [1.0, 0.0], [1.2, 0.035], [TB, 0.06]]);
  const bBot0 = (a) => 0.06 - 0.58 * Math.pow(Math.max(0, 1 - (a / TB) ** 2), 1.05);
  const bSc = scallops(8, 31, 2 * TB);
  const bTopS = (th) => { const a = Math.abs(th); return bTop0(a) + 0.012 * Math.sin(th * 11 + 0.6) * sstep(0.45, 0.7, a) * sstep(TB, TB - 0.2, a); };
  const bBotS = (th) => { const a = Math.abs(th); return bBot0(a) - 0.075 * (bSc(th + TB) - 0.4) * sstep(0, 0.4, 1 - a / TB); };
  const bSurf = (th, ph) => {
    const s = body(dirOf(th, Math.max(ph, PJB))), k = Math.max(0, PJB - ph);
    if (k > 0) { s.pos.y -= k * RY * 0.95; s.pos.x += Math.sin(th) * 0.03 * k; s.pos.z += Math.cos(th) * 0.03 * k; }
    s.normal.y *= 1 - 0.65 * sstep(PJB + 0.2, PJB, ph); s.normal.normalize(); return s;
  };

  // ================================================================ HAIR: one mass, a polar cap round the back-top of the head
  const HC = V(0, Math.sin(0.62), -Math.cos(0.62)), HE1 = V(0, Math.cos(0.62), Math.sin(0.62)), HE2 = V(1, 0, 0);
  // the hairline (theta, phi): top of the forehead, temple, in front of the ear, the sideburn, under the ear, behind it, the nape
  const HL = [[0, 1.2], [1.12, 0.84], [1.32, 0.58], [1.34, 0.37], [1.65, 0.33], [2.05, 0.22], [2.45, 0.0], [2.8, -0.2], [Math.PI, -0.26]].map(([th, ph]) => { const d = dirOf(th, ph); return [Math.atan2(d.dot(HE2), d.dot(HE1)), Math.acos(d.dot(HC))]; });
  const rhoB = curveOf(HL), hSc = scallops(25, 7, TAU, 1.05);
  const rhoMax = (al) => rhoB(Math.abs(al)) * (1 + 0.07 * (hSc(al + Math.PI) - 0.5)) + 0.1 * Math.exp(-((al / 0.2) ** 2)) + 0.015 * Math.sin(al + 0.6);
  const hDir = (al, rho) => HC.clone().multiplyScalar(Math.cos(rho)).addScaledVector(HE1, Math.cos(al) * Math.sin(rho)).addScaledVector(HE2, Math.sin(al) * Math.sin(rho));
  const HLOBES = [];
  const hLobe = (al, s, rot, ra, rb, amp) => { const b = body(hDir(al, s * rhoMax(al))), l = lobeAt(b.pos, b.normal, body(hDir(al + 0.03, s * rhoMax(al))).pos.sub(b.pos), rot, ra, rb, amp); l.al = al; l.s = s; HLOBES.push(l); };
  // one curl in each scallop of the hairline (25 round the head, each its own width, fuller over the ears), then three rings of waves behind them
  hSc.mid.forEach((m, i) => { const al = wrapPi(m - Math.PI), ra = Math.max(0.05, hSc.wid[i] * 0.45 * 0.66 * Math.sin(rhoB(Math.abs(al)))); hLobe(al, 0.83 + 0.05 * (hs(i, 21) - 0.5), (hs(i, 22) - 0.5) * 0.6, ra, 0.075 + 0.02 * hs(i, 24), (0.042 + 0.018 * hs(i, 25)) * (1 + 0.45 * bump((Math.abs(al) - 1.15) / 0.6))); });
  [[0.6, 14], [0.36, 9], [0.12, 4]].forEach(([s0, n], ri) => {
    for (let q = 0; q < n; q++) { const i = HLOBES.length; hLobe(wrapPi(TAU * (q + 0.5 + 0.5 * (hs(i, 20) - 0.5)) / n + ri * 0.37), s0 + 0.06 * (hs(i, 21) - 0.5), (hs(i, 22) - 0.5) * 1.3, 0.085 + 0.025 * hs(i, 23), 0.075 + 0.02 * hs(i, 24), 0.03 + 0.012 * hs(i, 25)); }
  });
  // the hair's surface over (alpha, s): s 0 = the middle of the cap, 1 = the hairline
  const hairPS = (al, s, off = 0) => {
    const b = body(hDir(al, s * rhoMax(al))), [m1, m2] = lobeTop(b.pos, HLOBES), e = s >= 1 ? 0 : Math.pow(1 - Math.pow(Math.max(0, s), 6), 0.5);
    const p = b.pos.addScaledVector(b.normal, e * (0.026 + 0.008 * sstep(-0.3, 0.5, b.normal.y) + m1) + off);
    p.k = Math.pow(lobeShade(m1, m2), 1.35) * (1 - 0.1 * sstep(0.9, 1, s)); return p;
  };
  {
    const g = gridGeo(200, 46, (u, v) => hairPS((u - 0.5) * TAU, 1 - Math.pow(1 - v, 1.6)), outBody, true);
    const hair = mesh(g, hairM); hair.name = "hair"; parts.add(hair);
    const inks = [], line = (f, n, W, heavy, even) => { const ps = [], ns = []; for (let k = 0; k <= n; k++) { const [al, s] = f(k / n); ps.push(hairPS(al, s, 0.0028)); ns.push(nrmOf((a, b) => hairPS(a, b), al, s, 0.01, 0.01, outBody(ps[k]))); } inks.push(stroke(ps, ns, W, heavy, even)); };
    HLOBES.forEach((l, i) => {
      const rho = l.s * rhoMax(l.al), ma = 1 / (0.45 * Math.max(0.25, Math.sin(rho))), ms = 1 / (0.45 * rhoMax(l.al));   // metres -> alpha, s
      const R = Math.min(0.05, l.ra * 0.52) + 0.008 * hs(i, 30), a0 = hs(i, 31) * TAU, hand = hs(i, 32) < 0.5 ? 1 : -1, sw = 3.3 + 1.7 * hs(i, 33);
      // the curl: a hook that turns in on itself
      line((t) => { const a = a0 + hand * sw * t, r = R * (1 - 0.58 * t); return [l.al + Math.cos(a) * r * ma, Math.min(0.975, l.s + Math.sin(a) * r * ms)]; }, 20, 0.003 * (0.85 + 0.35 * hs(i, 34)), 0.45);
      // a short arc beside it (the next wave of the lock)
      if (hs(i, 35) < 0.5) { const b0 = a0 + hand * (0.5 + 1.5 * hs(i, 36)), R2 = R * (1.45 + 0.2 * hs(i, 37)); line((t) => { const a = b0 + hand * (1.0 + 0.7 * hs(i, 38)) * t; return [l.al + Math.cos(a) * R2 * ma, Math.min(0.975, l.s + Math.sin(a) * R2 * ms)]; }, 10, 0.0023, 0.5); }
    });
    parts.add(inkMesh(merge(inks), hairInk, 0.52));
    // the hairline: one drawn line on the skin right at the hair's edge (six strokes round the head)
    const edge = []; for (let q = 0; q < 6; q++) { const a0 = -Math.PI + q * TAU / 6 - 0.02, a1 = a0 + TAU / 6 + 0.04, ps = [], ns = []; for (let k = 0; k <= 50; k++) { const al = a0 + (a1 - a0) * k / 50, b = body(hDir(al, rhoMax(al) * 1.006)); ps.push(b.pos.addScaledVector(b.normal, 0.003)); ns.push(b.normal); } edge.push(stroke(ps, ns, 0.003, 0.5, true)); }
    parts.add(inkMesh(merge(edge), hairInk, 0.42));
  }

  // ================================================================ BEARD + MOUSTACHE: one mass from sideburn to sideburn
  const BLOBES = [];
  {
    const add = (th, v, k) => { const i = BLOBES.length, ph = bTopS(th) + (bBotS(th) - bTopS(th)) * v, s = bSurf(th, ph); const l = lobeAt(s.pos, s.normal, V(Math.cos(th), 0, -Math.sin(th)), (hs(i, 42) - 0.5) * 1.1, 0.05 + 0.02 * hs(i, 43), 0.042 + 0.016 * hs(i, 44), k * (0.012 + 0.009 * hs(i, 45))); l.th = th; l.ph = ph; BLOBES.push(l); };
    [[0.3, 7, 1.08], [0.55, 8, 1.0], [0.76, 7, 0.85]].forEach(([v, n, span]) => { for (let q = 0; q < n; q++) add((-1 + 2 * (q + 0.5 + 0.5 * (hs(BLOBES.length, 40) - 0.5)) / n) * span, v + 0.06 * (hs(BLOBES.length, 41) - 0.5), 1); });
    for (const m of bSc.mid) { const th = m - TB; if (Math.abs(th) < TB * 0.86) add(th, 0.88, 1.15); }   // one curl in each scallop of the lower edge
  }
  // the moustache's outline over u -1 .. 1 (theta = u * MW)
  const MW = 0.95, mMid = curveOf([[0, 0.04], [0.3, 0.074], [0.6, 0.052], [0.85, 0.012], [1, -0.005]]), mSc = scallops(7, 77, 2);
  const mHalf = (u) => 0.082 * Math.pow(Math.max(0, 1 - Math.abs(u) ** 2.0), 0.75) * (0.36 + 0.64 * sstep(0, 0.3, Math.abs(u)));
  const mTopE = (u) => mMid(Math.abs(u)) + mHalf(u) * 0.8, mBotE = (u) => mMid(Math.abs(u)) - mHalf(u) * (1.2 + 0.32 * mSc(u + 1));
  // the beard's thickness over the skin at (theta, phi) and its shade
  const beardH = (th, ph, p0) => {
    const a = Math.abs(th) / TB; if (a >= 1) return [0, 1, 0];
    const tp = bTopS(th), v = (tp - ph) / Math.max(1e-4, tp - bBotS(th)); if (v <= 0 || v >= 1) return [0, 1, clamp01(v)];
    const prof = Math.pow(sstep(0, 0.24, v), 0.8) * Math.pow(1 - sstep(0.5, 1, v) ** 2.4, 0.5), [m1, m2] = lobeTop(p0, BLOBES);
    const u = th / MW, under = Math.abs(u) < 1 ? Math.exp(-(((mBotE(u) - ph) / 0.05) ** 2)) * (ph < mBotE(u) ? 1 : 0.4) : 0;   // the moustache's shadow on the beard
    return [prof * sstep(0, 0.14, 1 - a) * (0.022 + 0.04 * Math.pow(1 - a * a, 0.8) + m1), lobeShade(m1, m2) * (1 - 0.2 * under) * (1 - 0.1 * sstep(0.7, 1, v)), v];
  };
  const beardAt = (th, ph, off = 0) => {
    const s = bSurf(th, ph), [h, k, v] = beardH(th, ph, s.pos), p = s.pos.clone().addScaledVector(s.normal, h + off);
    if (ph < PJB && v > 0.8) {   // the lowest part turns back onto the chest (it rests on the robe)
      const b = body(dirOf(th, Math.asin(Math.max(-0.98, Math.min(0.98, (p.y - CY) / RY))))), q = b.pos.addScaledVector(b.normal, 0.045 + off), f = sstep(0.8, 1, v);
      p.x += (q.x - p.x) * f; p.z += (q.z - p.z) * f;
    }
    p.k = k; return p;
  };
  const moustAt = (u, w, off = 0) => {
    const th = u * MW, ph = mTopE(u) + (mBotE(u) - mTopE(u)) * w, r = Math.pow(Math.max(0, 1 - (2 * w - 1) ** 2), 0.5);
    const p = beardAt(th, ph, 0.004 + (0.052 - 0.026 * u * u) * (0.5 + 0.5 * sstep(0, 0.26, Math.abs(u))) * r * sstep(1, 0.86, Math.abs(u)) + off);
    p.k = 1 - 0.07 * (1 - r) - 0.04 * Math.pow(Math.abs(Math.sin(u * 9 + w * 5)), 3); return p;
  };
  {
    const bg = gridGeo(150, 64, (u, v) => { const th = (u * 2 - 1) * TB; return beardAt(th, bTopS(th) + (bBotS(th) - bTopS(th)) * v); }, outBody);
    const beard = mesh(bg, hairM); beard.name = "beard"; parts.add(beard);
    const mg = gridGeo(120, 18, (u, w) => moustAt(u * 2 - 1, w), outBody);
    const moust = mesh(mg, hairM); moust.name = "moustache"; parts.add(moust);
    const inks = [], heavy = [];
    const bl = (f, n, W, hv, even, to = inks) => { const ps = [], ns = []; for (let k = 0; k <= n; k++) { const [th, ph] = f(k / n); ps.push(beardAt(th, ph, 0.0028)); ns.push(nrmOf((a, b) => beardAt(a, b), th, ph, 0.012, 0.012, outBody(ps[k]))); } to.push(stroke(ps, ns, W, hv, even)); };
    const ml = (f, n, W, hv, even, to = inks) => { const ps = [], ns = []; for (let k = 0; k <= n; k++) { const [u, w] = f(k / n); ps.push(moustAt(u, w, 0.0028)); ns.push(nrmOf((a, b) => moustAt(a, b), u, w, 0.012, 0.03, outBody(ps[k]))); } to.push(stroke(ps, ns, W, hv, even)); };
    // a curl hook on each lobe, a short arc beside most
    BLOBES.forEach((l, i) => {
      const R = 0.026 + 0.012 * hs(i, 50), a0 = hs(i, 51) * TAU, hand = hs(i, 52) < 0.5 ? 1 : -1, sw = 3.4 + 1.6 * hs(i, 53), mt = 1 / (RX * 0.95), mp = 1 / (RY * 0.95);
      const inside = (th, ph) => { const lo = bBotS(th), hi = bTopS(th); return [th, Math.max(lo + 0.06 * (hi - lo), Math.min(hi - 0.1 * (hi - lo), ph))]; };
      bl((t) => { const a = a0 + hand * sw * t, r = R * (1 - 0.58 * t); return inside(l.th + Math.cos(a) * r * mt, l.ph + Math.sin(a) * r * mp); }, 18, 0.0029 * (0.85 + 0.35 * hs(i, 54)), 0.45);
      if (hs(i, 55) < 0.4) { const b0 = a0 + hand * (0.6 + 1.4 * hs(i, 56)), R2 = R * 1.5; bl((t) => { const a = b0 + hand * (0.9 + 0.7 * hs(i, 57)) * t; return inside(l.th + Math.cos(a) * R2 * mt, l.ph + Math.sin(a) * R2 * mp); }, 10, 0.0022, 0.5); }
    });
    // strands: wavy lines flowing down from under the moustache, each its own place, length, drift and weight
    for (let q = 0; q < 8; q++) {
      const th0 = (-1 + 2 * (q + 0.5 + 0.6 * (hs(q, 95) - 0.5)) / 8) * 0.85, v0 = 0.2 + 0.2 * hs(q, 96), v1 = v0 + 0.22 + 0.3 * hs(q, 97), dr = (hs(q, 98) - 0.5) * 0.12 + th0 * 0.05, wv = 0.02 + 0.03 * hs(q, 99);
      bl((t) => { const th = th0 + dr * t + wv * Math.sin(t * 6 + q * 1.7), v = v0 + (v1 - v0) * t; return [th, bTopS(th) + (bBotS(th) - bTopS(th)) * v]; }, 16, 0.002 * (0.8 + 0.5 * hs(q, 94)), 0.5);
    }
    // the moustache: strokes that follow its sweep, and its drawn outline (top edge on the skin, lower edge on the beard)
    for (const sd of [-1, 1]) {
      for (let q = 0; q < 3; q++) { const w0 = 0.26 + 0.22 * q + 0.1 * (hs(q + (sd > 0 ? 9 : 0), 60) - 0.5), u0 = 0.08 + 0.25 * hs(q + (sd > 0 ? 9 : 0), 61), u1 = 0.5 + 0.4 * hs(q + (sd > 0 ? 9 : 0), 62); ml((t) => [sd * (u0 + (u1 - u0) * t), w0 + 0.12 * Math.sin(t * 3 + q * 2 + sd) * t], 16, 0.0025, 0.5); }
      ml((t) => [sd * (0.015 + 0.975 * t), 1.03], 40, 0.0023, 0.5, true, heavy);
      ml((t) => [sd * (0.015 + 0.975 * t), -0.03], 36, 0.0022, 0.5, true, heavy);
    }
    ml((t) => [0, 0.25 + 0.75 * t], 8, 0.0022, 0.6, false, heavy);   // the parting under the nose
    // the beard's top edge on the cheeks, each side, from beside the moustache out to the sideburn's tip
    for (const sd of [-1, 1]) bl((t) => { const th = sd * (0.9 + (TB - 0.93) * t); return [th, bTopS(th) + 0.008]; }, 36, 0.0026, 0.5, true, heavy);
    parts.add(inkMesh(merge(inks), hairInk, 0.52)); parts.add(inkMesh(merge(heavy), hairInk, 0.46));
  }

  // ================================================================ the old face: two short lines under each eye, spots on the bare skin
  if (ch.face?.place) {
    const pl = ch.face.place, L = ch.face.layout || { eyeU: 0.35, eyeV: 0.32 }, o = pl(L.eyeU, L.eyeV).pos, d = 0.01, r = 0.08 * (ch.face.size || 1);
    const su = pl(L.eyeU + d, L.eyeV).pos.distanceTo(o) / d, sv = pl(L.eyeU, L.eyeV + d).pos.distanceTo(o) / d;
    const lines = [];
    for (const sd of [-1, 1]) for (const [k, [du, dv, len, ang]] of [[0.012, -1.22 * r, 0.05, -0.3], [0.004, -1.45 * r, 0.036, -0.22]].entries()) {
      const cs = [], sides = [], ws = [], n = 8;
      for (let q = 0; q <= n; q++) {
        const t = q / n - 0.5, u = sd * L.eyeU + sd * (du + t * len * Math.cos(ang)) / su, v = L.eyeV + (dv + t * len * Math.sin(ang * sd) - 0.01 * (t * t)) / sv, c = pl(u, v);
        cs.push(c.pos.addScaledVector(c.normal, 0.0022)); sides.push(c.normal.clone().cross(V(Math.cos(ang), Math.sin(ang * sd), 0)).normalize()); ws.push(brushW(q / n, 0.0025 * (1 - 0.2 * k), 0.4));
      }
      lines.push(strip(cs, sides, ws));
    }
    parts.add(inkMesh(merge(lines), skinInk, 0.5));
  }
  {
    // 22 potato spots on the forehead, the temples and beside the eyes: flat marks in the skin, each its own place, size, shape and shade
    const gs = [], spotM = new THREE.MeshStandardMaterial({ color: "#c58e45", roughness: 0.9, vertexColors: true }); spotM.userData.noOutline = true; spotM.userData.lookRole = "skin";
    for (let i = 0; i < 22; i++) {
      const top = i < 13, th = top ? (hs(i, 70) - 0.5) * 1.9 : (i % 2 ? 1 : -1) * (0.62 + 0.4 * hs(i, 70)), ph = top ? 0.66 + 0.36 * hs(i, 71) : 0.08 + 0.42 * hs(i, 71);
      const s = body(dirOf(th, ph)), r = 0.005 + 0.009 * hs(i, 72) ** 1.6, g = new THREE.CircleGeometry(r, 12), k = 0.78 + 0.22 * hs(i, 73);
      g.scale(1, 0.7 + 0.3 * hs(i, 74), 1); g.rotateZ(hs(i, 75) * 3);
      g.applyMatrix4(new THREE.Matrix4().compose(s.pos.addScaledVector(s.normal, 0.0012), new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), s.normal), V(1, 1, 1)));
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(k), 3)); gs.push(g);
    }
    const spots = mesh(merge(gs), spotM, false); spots.material.polygonOffset = true; spots.material.polygonOffsetFactor = -2; spots.material.polygonOffsetUnits = -2; parts.add(spots);
  }

  // ================================================================ ROBE: the wrap round the body
  const PH_J = -0.5, HEM = -1.5, NU = 220, NV = 44, T = 0.008, YHEM = 0.05;
  const hyb = skirtSurface(ch, PH_J, HEM, YHEM, 1.06);
  const fr = (th) => Math.abs(wrapPi(th));   // the angle from the front, 0 .. pi
  const collarBack = curveOf([[TB, 0.0], [1.6, 0.02], [2.1, 0.02], [2.5, -0.1], [2.8, -0.27], [Math.PI, -0.33]]);   // under the hair's edge
  const top = (th) => { const a = fr(th); return a < TB ? Math.min(0.0, bBot0(a) - 0.015 + 0.07 * sstep(1.0, 0.7, a)) : collarBack(a); };   // in front: along the beard's outline (behind it where it hangs)
  const hem = (th) => HEM + 0.03 * Math.sin(th * 3 + 0.5) + 0.018 * Math.sin(th * 7 + 2);
  const PLEATS = Array.from({ length: 15 }, (_, k) => ({ th: (k + 0.5 + 0.7 * (hs(k, 60) - 0.5)) * TAU / 15 - Math.PI, w: 0.13 + 0.12 * hs(k, 61), A: 0.012 + 0.018 * hs(k, 62), sl: (hs(k, 63) - 0.5) * 0.3, v0: 0.12 + 0.3 * hs(k, 64) }));
  const lift = (th, v) => {
    let f = 0; for (const p of PLEATS) f += p.A * bump(wrapPi(th - p.th - p.sl * v) / p.w) * sstep(p.v0, p.v0 + 0.3, v);
    return 0.012 + 0.015 * bump((v - 0.04) / 0.04) + 0.011 * bump((v - 0.115) / 0.045) + f * (0.55 + 0.45 * v);
  };
  const robeN = (s) => { const n = s.normal.clone(); n.y *= 0.4; return n.normalize(); };
  const robeAt = (th, v, off) => { const tp = top(th), s = hyb.surf(th, tp + (hem(th) - tp) * v); return s.pos.clone().addScaledVector(robeN(s), lift(th, v) + off); };
  const G = clothSlab(NU, NV, (u, v, off) => robeAt(u * TAU, v, off), T);
  const robeM = clothMat(robeC, { side: THREE.DoubleSide }); robeM.map = robeTex(seed);
  const robeMesh = mesh(G, robeM); robeMesh.name = "robe"; parts.add(robeMesh);
  const skirtGeos = [G];   // geometries the seated pose squashes
  // a brush line on the wrap along a (th, v) path
  const ribbon = (path, n, W, off, even = false) => {
    const ps = [], ns = [];
    for (let q = 0; q <= n; q++) { const [th, v] = path(q / n), p = robeAt(th, v, off); ps.push(p); ns.push(robeAt(th, v, off + 0.05).sub(p).normalize()); }
    return stroke(ps, ns, W, 0.5, even);
  };
  const inkGeos = [];
  PLEATS.forEach((p, k) => {   // a line down one flank of each pleat, a shorter second one beside some
    if (hs(k, 65) < 0.12) return; const sd = hs(k, 66) < 0.5 ? -1 : 1;
    inkGeos.push(ribbon((u) => [p.th + sd * 0.8 * p.w + p.sl * (p.v0 + 0.1 + u) + 0.02 * Math.sin(u * 4 + k), p.v0 + 0.1 + (0.86 + 0.08 * hs(k, 67) - p.v0 - 0.1) * u], 20, 0.0034 + 0.0014 * hs(k, 68), T + 0.0014));
    if (hs(k, 69) > 0.5) inkGeos.push(ribbon((u) => [p.th - sd * 0.75 * p.w + p.sl * (0.55 + u * 0.4), 0.55 + 0.1 * hs(k, 70) + 0.36 * u], 14, 0.0028, T + 0.0014));
  });
  for (let k = 0; k < 10; k++) {   // the collar: lines in the crease between its two rolls and under the second, in strokes of uneven length
    const a0 = -Math.PI + (k + 0.3 * hs(k, 80)) * TAU / 10, len = 0.36 + 0.22 * hs(k, 81);
    inkGeos.push(ribbon((u) => [a0 + len * u, 0.079 + 0.006 * Math.sin(u * 5 + k)], 16, 0.003, T + 0.0014));
    if (hs(k, 82) > 0.35) inkGeos.push(ribbon((u) => [a0 + 0.1 + len * 0.8 * u, 0.165 + 0.012 * Math.sin(u * 4 + k * 2)], 14, 0.0026, T + 0.0014));
  }
  for (let k = 0; k < 6; k++) inkGeos.push(ribbon((u) => [-Math.PI + (k + u) * TAU / 6, 0.006], 44, 0.0026, T + 0.0016, true));   // the collar's edge

  // ================================================================ ROBE: the band across the chest, over the left shoulder, down the back
  // its middle line (theta, phi) and width (m) from under the right arm at the back to the thrown end's hem
  const BP = [[-2.7, -1.42, 0.1], [-1.7, -1.42, 0.16], [-0.8, -1.33, 0.26], [0, -1.0, 0.25], [0.65, -0.6, 0.2], [0.95, -0.42, 0.17], [1.2, -0.24, 0.14], [1.45, -0.1, 0.12], [1.8, -0.1, 0.12], [2.15, -0.22, 0.13], [2.4, -0.7, 0.16], [2.47, -1.1, 0.18], [2.48, -1.4, 0.18]];
  const bTh = curveOf(BP.map((p, i) => [i / (BP.length - 1), p[0]])), bPh = curveOf(BP.map((p, i) => [i / (BP.length - 1), p[1]])), bWd = curveOf(BP.map((p, i) => [i / (BP.length - 1), p[2]]));
  const MT = 1 / (RX * 0.95), MP = 1 / (RY * 0.95), NPL = 4.6;
  const pleatPh = (s, w) => NPL * (w + 0.05 * Math.sin(w * 7 + s * 3)) + 0.25 * Math.sin(s * 9) + 0.1;
  const bandAt = (s, w, off = 0) => {
    const e = 0.004, mx = (bTh(s + e) - bTh(s - e)) / MT, my = (bPh(s + e) - bPh(s - e)) / MP, l = Math.hypot(mx, my) || 1, k = (0.5 - w) * bWd(s);
    const th = bTh(s) + (-my / l) * k * MT, ph = Math.max(hem(th) + 0.03, bPh(s) + (mx / l) * k * MP);   // never below the wrap's hem
    const tp = top(th), v = clamp01((tp - ph) / (tp - hem(th))), sf = hyb.surf(th, ph);
    const ed = sstep(0, 0.1, w) * sstep(0, 0.1, 1 - w) * sstep(0, 0.04, s), ridge = Math.pow(Math.abs(Math.sin(Math.PI * pleatPh(s, w))), 0.65), amp = (0.009 + 0.007 * Math.sin(s * 5 + 1) ** 2) * (0.75 + 2.2 * bWd(s));
    const p = sf.pos.clone().addScaledVector(robeN(sf), lift(th, v) + T - 0.006 + ed * (0.012 + amp * ridge) + off);
    p.k = 1 - 0.17 * ed * Math.pow(1 - ridge, 1.5); return p;
  };
  const bandM = clothMat(robeC, { side: THREE.DoubleSide, vertexColors: true }); bandM.map = robeTex(seed + 3.1);
  const bandG = gridGeo(170, 26, (u, v) => bandAt(u, v), (p) => V(p.x, 0, p.z));
  const band = mesh(bandG, bandM); band.name = "himation"; parts.add(band); skirtGeos.push(bandG);
  {
    const bline = (f, n, W, even) => { const ps = [], ns = []; for (let q = 0; q <= n; q++) { const [s, w, o] = f(q / n); ps.push(bandAt(s, w, o)); ns.push(nrmOf((a, b) => bandAt(a, b, o), s, w, 0.004, 0.02, V(ps[q].x, 0, ps[q].z))); } inkGeos.push(stroke(ps, ns, W, 0.5, even)); };
    for (let k = 1; k <= 4; k++) {   // the creases between its pleats, in strokes of uneven length with gaps (every other one where the band is gathered narrow)
      let s = 0.04 + 0.05 * hs(k, 85), q = 0;
      while (s < 0.96) { const len = Math.min(0.97 - s, 0.1 + 0.17 * hs(k * 7 + q, 86)), s0 = s; if (len > 0.03 && !(k % 2 && bWd(s0 + len / 2) < 0.15)) bline((u) => { const ss = s0 + len * u; return [ss, (k - 0.1 - 0.25 * Math.sin(ss * 9)) / NPL - 0.05 * Math.sin(k * 7 / NPL + ss * 3), 0.0015]; }, 22, 0.003 + 0.0012 * hs(k * 7 + q, 87)); s += len + 0.02 + 0.05 * hs(k * 7 + q, 88); q++; }
    }
    for (const w of [-0.035, 1.035]) for (let q = 0; q < 4; q++) bline((u) => [0.05 + (q + u) * 0.94 / 4, w, 0.0075], 44, 0.0027, true);   // its two edges, drawn on the wrap beside it
  }
  const inkG = merge(inkGeos); parts.add(inkMesh(inkG, foldC, 0.36)); skirtGeos.push(inkG);

  // ================================================================ sleeves: the cloth hanging over each upper arm
  const slvM = clothMat(robeC, { side: THREE.DoubleSide }); slvM.map = robeTex(seed + 1.7);
  const sl = {}, key = {};
  for (const s of ["L", "R"]) {
    sl[s] = { out: new THREE.Mesh(new THREE.BufferGeometry(), slvM), ink: inkMesh(new THREE.BufferGeometry(), foldC, 0.36) };
    for (const m of Object.values(sl[s])) { m.castShadow = true; m.frustumCulled = false; ch.root.add(m); m.visible = false; }
    sl[s].ink.castShadow = false;
  }
  const armR = (t) => ch.constructor.armRadius(t, ch.limbW, ch.def.limbs?.armTaper);
  const buildSleeves = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], S = sl[s];
      if (!A?.shoulder || !A.elbow || !A.hand) { for (const m of Object.values(S)) m.visible = false; continue; }
      const k = [A.shoulder, A.elbow, A.hand.position].map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|") + A.joint;
      if (key[s] === k) continue; key[s] = k;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = s === "L", tEnd = L ? 0.52 : 0.4, phs = L ? 1 : 2.6;
      const rAt = (t, a) => armR(t) + 0.02 + 0.03 * sstep(0.06, tEnd, t) + 0.007 * sstep(0.1, tEnd, t) * Math.sin(a * 5 + phs * 2 + t * 4);
      const sv = sleeve(curve, 0.02, tEnd, rAt, (t) => (L ? 0.06 : 0.045) * sstep(0.08, tEnd, t), phs);
      S.out.geometry.dispose(); S.out.geometry = sv.geo; S.out.visible = true;
      // fold lines down the sleeve in the valleys of its pleats, and one round its rim
      const cs = [];
      for (let q = 0; q < 5; q++) {
        const a = ((q + 0.75 + 0.3 * (hs(q + (L ? 5 : 0), 80) - 0.5)) / 5) * TAU - (phs * 2) / 5, t0 = 0.1 + 0.1 * hs(q, 81), t1 = sv.rim(a) - 0.02 - 0.05 * hs(q, 82), ps = [], ns = [];
        for (let i = 0; i <= 10; i++) { const p = sv.pt(t0 + (t1 - t0) * i / 10, a + 0.12 * Math.sin(i * 0.5 + q), 0.0016); ps.push(p); ns.push(p.o); }
        cs.push(stroke(ps, ns, 0.0032, 0.5));
      }
      S.ink.geometry.dispose(); S.ink.geometry = merge(cs); S.ink.visible = true;
    }
  };

  // ================================================================ sandals: golden bare feet, dark soles, two straps each
  { const skinM = ch.limbMat.clone(); skinM.userData = { ...ch.limbMat.userData, noOutline: true };
    const soleM = clothMat(C.sandal || "#6a4a2e", { roughness: 0.8 }), strapM = clothMat(shade(C.sandal || "#6a4a2e", 1.15), { roughness: 0.7 }); soleM.userData.noOutline = strapM.userData.noOutline = true;
    for (const s of ["L", "R"]) {
      const f = ch.legs?.[s]?.foot; if (!f) continue;
      f.material = skinM;
      const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.02, 28), soleM); sole.position.y = -0.0715; f.add(sole);
      for (const [z, r] of [[0.0, 0.0775], [0.052, 0.0585]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0065, 6, 20, Math.PI * 1.02), strapM); ring.position.set(0, -0.03, z); ring.rotation.z = -0.02; f.add(ring); }
    }
  }
  // the glove is cream, the forearm golden (limbs.color)
  if (ch.skinMat) ch.skinMat.color.set(C.hands || "#f6dcae");

  // ================================================================ the seated pose: the hanging cloth shortens and opens forward over the lap
  const rest = skirtGeos.map((g) => g.attributes.position.array.slice()), restN = skirtGeos.map((g) => (g.attributes.normal ? g.attributes.normal.array.slice() : null));
  const yJ = ch.surf(0, PH_J).pos.y;
  let lastSit = -1;
  const squash = (sit) => {
    if (Math.abs(sit - lastSit) < 1e-4) return; lastSit = sit;
    skirtGeos.forEach((g, gi) => {
      const P = g.attributes.position, R = rest[gi];
      for (let i = 0; i < P.count; i++) {
        const x = R[i * 3], y = R[i * 3 + 1], z = R[i * 3 + 2];
        if (y >= yJ) { P.setXYZ(i, x, y, z); continue; }
        const d = clamp01((yJ - y) / (yJ - YHEM)) * sit;   // how far down the hanging cloth, how seated
        const front = clamp01(z / 0.3), k = 1 + 0.55 * d * front;
        P.setXYZ(i, x * (1 + 0.1 * d), yJ - (yJ - y) * (1 - 0.3 * sit) - 0.02 * d * front, z * k + 0.05 * d * front);
      }
      if (sit <= 0 && restN[gi]) { g.attributes.normal.array.set(restN[gi]); g.attributes.normal.needsUpdate = true; } else g.computeVertexNormals();
      P.needsUpdate = true; g.computeBoundingSphere();
    });
  };

  out.sitDepth = 0;
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); squash(st?.sit || 0); buildSleeves(); };
  return out;
}
