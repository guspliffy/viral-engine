import * as THREE from "three";
import { clamp } from "./util.js";
import { steamWisps } from "./steam.js";

// Potato Desk 14 "Don't. Laugh." (26 Nov 2026): the judge's HASH-BROWN TOUPEE kit. storyboards/series/potato-desk/14-dont-laugh/DESIGN.md
// section 1 (1a-1e) is the design; every number below is its. Metres, +x right, +y up, +z toward the camera. Everything is drawn once
// (canvases, merged geometry) and every pose is a pure function of the keys and the clip time: no Math.random, no clock.
// Keys the engine's propState knows tween smoothly (steam, shred, fall, on, drop, tilt, tip, rot, scale, x, y, z). `on` starts at 0 in
// propState: SEED a prop that needs it with { do: "prop", id, set: { on: 1 }, dur: 0 }.
//
// KINDS
//   hashtoupee   the toupee: a stiff golden hash-brown SLAB, not hair. ORIGIN = the centre of its underside, +y up, front +z
//                (yaw 0 faces the camera). Size 0.58 (x) x 0.40 (z) x 0.07 at the centre (0.055 at the rim, top domed, rim sags
//                0.015, so the underside is a shallow bowl that touches the head at the origin only). Outline: a superellipse
//                |x/0.29|^3 + |z/0.20|^3 = 1 with +-0.008 wobble, top edge rounded r 0.012, no spikes. A BITE r 0.095 is cut
//                through it at the front, screen-left (centre (-0.15, 0.20): notch 0.18 wide, 0.08 deep, 4 tooth scallops, pale
//                cut wall). Top face: one 1024 x 706 canvas (90 shred strokes, 14 browned spots, darkened rim) + 36 raised
//                shreds; side wall crust with flecks; 8 crisp tips on the top edge; two steam wisps over the top; one HERO SHRED
//                hinged at the rim (0.27, 0.05, 0.11).
//                WORN: spec.wear: "<actor id>" (stage.js puts it on the body; the squash follows the wearer, as flatcap).
//                  Director's placement (DESIGN 1a): wear "vik", x 0, y 1.113, z 0.139, tip 30, rot 8, tilt 4.
//                spec keys (default)
//                  wear     actor id (none: the prop stands where x y z put it, unsquashed)
//                  shred    0..1 (0)   hero shred, TWEENS (propState): 0 lying on the top face inside the outline; 1 swung out over
//                                      the rim and hanging world-vertical, 8 deg outward lean, face to +z (computed each frame from
//                                      the prop's own tip/tilt/turn and the wearer's turn); lying -> out along (0.9, 0.2, 0.4) at
//                                      0.45 -> hanging at 1. Overshoot to 1.15 allowed (use ease back; the swing past vertical is capped at 10 %); 1.15..1.5 hold the hanging
//                                      pose; >= 1.5 HIDDEN (it fell, hashcrumbs takes over)
//                  steam    0..1 (0)   the two wisps (steam.js, group scale 1.5 and 1.1), TWEENS (propState)
//                  steamK   (1)        multiplier on both wisp groups' scale (extra to DESIGN, 1 = as designed)
//                  x y z tip tilt rot scale squash: the usual prop keys
//   hashcrumbs   WORLD prop (not worn): the shred and 17 crumbs falling from the head to the papers. ORIGIN = the hero shred's
//                hinge in the world; +z toward the papers; seated judge, yaw 0: about (-0.42, 2.10, -0.40). Nothing shows while
//                `fall` is 0 (unless `on` is 1), so place it and tween `fall` 0 -> 1.6 linear in 1.6 s at the burst.
//                18 pieces: 1 hero shred (starts HANGING at fall 0, exactly the toupee's hanging pose; the clip hides the toupee's
//                own shred at the same frame), 6 flakes (hexagons 0.05 x 0.04 x 0.009), 11 bits (0.02-0.03). Burst A at fall 0
//                (shred, 2 flakes, 5 bits), burst B at 0.27 (4 flakes, 6 bits), each piece + hash x 0.06. Flight: start speed vx
//                (h-0.5)*0.5, vy 0.1..0.4, vz 0.9..1.4 m/s, gravity 9.81 with drag (terminal shred 2.0, flakes 1.5, bits 2.6 m/s),
//                horizontal decay tau 0.35 s, spin 2-5 rev/s (flakes rock +-25 deg), landing on y = -drop; all lie flat within
//                0.08 s and STAY; bits bounce once (<= 0.012 high). Fall times over 0.88 m: bits ~0.6, shred ~0.65, flakes ~0.75 s.
//                spec keys (default)
//                  fall   seconds (0)  the clock, TWEENS; a pure function of it: any frame in any order
//                  drop   metres (0.88) how far below the origin the pieces land (the paper top)
//                  on     0..1 (0)     1 shows the prop at fall 0 (the hanging shred), seed with dur 0 at the burst
//   judgeshadow  the wall shadow: a PAINTED card, not a light (as copshadow). 1.30 x 1.50, faces +z, ORIGIN = bottom centre,
//                canvas 832 x 960 drawn once, blurred 0.018 m, fill #2f2630, opacity 0.40 x `on`, normal blend, depthWrite off, no
//                outline. Body ellipse (0, 0.62) 0.505 x 0.60 fading to nothing over its lowest 0.375; toupee lozenge 0.68 x 0.14 at
//                (0.04, 1.25) tipped -6 deg (right end lower) with 9 spikes and 4 underside bumps; no bite, no steam.
//                Put it on the wall at the judge's lamp offset: DESIGN 1e bottom centre (-0.36, 1.27, -1.296).
//                spec keys (default)
//                  on     0..1 (0)     TWEENS, SEEDS at 0: set { on: 1 } with dur 0 at frame 0 (the shoulder shows in the wides)
//                  shred  0 | 1 (0)    the strip 0.35 x 0.035, 3 zigzags, hanging from (0.36, 1.22) (the clip sets 1 after tease 1,
//                                      0 after tease 3). Reveal: tween y +0.16 with the judge standing
//                  x y z  the card's bottom centre

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hs = (i, n = 0) => rnd(i * 3.7 + n * 17.9 + 1.3);
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ------------------------------------------------------------------------------------------------- the worn prop's squash
// A worn prop gets the wearer's place and turn from stage.js but not its squash (bodyGroup.scale in potato.js). Same idea as flatcap
// (props-spree.js), but the wearer is the potato nearest to the prop in plan (within 0.5 m): the toupee's origin is on his head, not at
// his feet, so flatcap's "standing exactly where the prop was put" never matches it.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function potatoRoots(scene) {
  const out = [];
  scene.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) out.push(o); });
  return out;
}
function wearerFinder(P) {
  let roots = [];
  return () => {
    if (!roots.length) { let s = P.root; while (s.parent) s = s.parent; roots = potatoRoots(s); }   // the cast is built once, before the first frame
    P.root.getWorldPosition(_wp);
    let best = null, bd = 0.25;
    for (const r of roots) { r.getWorldPosition(_bp); const d = (_bp.x - _wp.x) ** 2 + (_bp.z - _wp.z) ** 2; if (d < bd) { bd = d; best = r; } }
    return best;
  };
}

// merge small coloured parts into one vertex-coloured geometry (one draw call, one outline hull)
function merger() {
  const pos = [], nor = [], col = [], idx = [];
  const v = new THREE.Vector3();
  return {
    add(geo, matrix, hex) {
      const p = geo.attributes.position, n = geo.attributes.normal, base = pos.length / 3, c = new THREE.Color(hex), nm = new THREE.Matrix3().getNormalMatrix(matrix);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(matrix); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b);
      }
      for (const i of geo.index.array) idx.push(base + i);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); return g;
    },
  };
}
// flip the winding of an indexed geometry whose normals point the wrong way on the whole (sign of sum(n . want(p)))
function orient(g, want) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), w = new THREE.Vector3(); let sum = 0;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); w.fromBufferAttribute(n, i); sum += w.dot(want(v)); }
  if (sum < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}

// =================================================================================================== the slab's plan
const SA = 0.29, SB = 0.20, N = 720, J = 14, INSET = 0.012, TOP0 = 0.07, SAG = 0.015;
const BCX = -0.15, BCZ = 0.20, BR = 0.095, BA0 = -2.185, BPER = 0.63;   // the bite: centre, radius, scallop phase and period (rad round the centre)
const topH = (s) => TOP0 - 0.03 * s * s;      // top face height at the radial fraction s (0.07 centre, 0.04 at the inset ring)
const undH = (s) => -SAG * s * s;              // underside: the rim sags
const outRho = (phi) => {
  const s = Math.abs(Math.sin(phi)) / SA, c = Math.abs(Math.cos(phi)) / SB;
  return Math.pow(s ** 3 + c ** 3, -1 / 3) + 0.008 * (0.6 * Math.sin(5 * phi + 0.9) + 0.4 * Math.sin(9 * phi + 2.3));   // 5 and 9 lobes, +-0.008
};
// the bite, 4 tooth scallops: the circle's radius dips 0.007 at each cusp (the material left standing) and swells 0.007 between
const inBite = (x, z) => {
  const dx = x - BCX, dz = z - BCZ, a = Math.atan2(dz, dx), R = BR - 0.007 + 0.014 * Math.abs(Math.sin(Math.PI * (a - BA0) / BPER));
  return dx * dx + dz * dz < R * R;
};
let _slab = null;
function slab() {
  if (_slab) return _slab;
  const rf = new Float64Array(N), bite = new Uint8Array(N), PX = new Float64Array(N), PZ = new Float64Array(N), nx = new Float64Array(N), nz = new Float64Array(N), mx = new Float64Array(N), mz = new Float64Array(N), s0 = new Float64Array(N), s0in = new Float64Array(N), cum = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) {
    const phi = (TAU * i) / N, ro = outRho(phi), sx = Math.sin(phi), cz = Math.cos(phi);
    let r = ro, b = 0;
    for (let t = 0.1; t < ro; t += 0.002) if (inBite(t * sx, t * cz)) {
      let lo = t - 0.002, hi = t;
      for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (inBite(m * sx, m * cz)) hi = m; else lo = m; }
      r = hi; b = 1; break;
    }
    rf[i] = r; bite[i] = b; PX[i] = r * sx; PZ[i] = r * cz;
  }
  for (let i = 0; i < N; i++) {
    const a = (i + 2) % N, b = (i - 2 + N) % N, tx = PX[a] - PX[b], tz = PZ[a] - PZ[b], l = Math.hypot(tx, tz) || 1;
    nx[i] = -tz / l; nz[i] = tx / l;   // outward (phi runs +z -> +x)
  }
  // the rounded edge's inset runs ALONG each sample's own ray from the centre (so the star-shaped outline can never fold at the bite's two
  // corners), lengthened by 1 / cos(angle between ray and edge normal), at most 2.5 x: the edge is set back 0.012 square to itself
  for (let i = 0; i < N; i++) { const l = Math.hypot(PX[i], PZ[i]) || 1, rx = PX[i] / l, rz = PZ[i] / l, k = 1 / Math.max(0.4, nx[i] * rx + nz[i] * rz); mx[i] = rx * k; mz[i] = rz * k; }
  // the surface heights are a function of the ORIGINAL outline's radial fraction (the bite is cut through a smooth dome, full thickness), so the
  // dome has no crease running out to the bite's corners: s0 at the rim, s0in at the inset ring
  for (let i = 0; i < N; i++) { const ro = outRho((TAU * i) / N); s0[i] = rf[i] / ro; s0in[i] = (rf[i] - Math.hypot(mx[i], mz[i]) * INSET) / ro; }
  for (let i = 0; i < N; i++) cum[i + 1] = cum[i] + Math.hypot(PX[(i + 1) % N] - PX[i], PZ[(i + 1) % N] - PZ[i]);
  const rhoAt = (phi) => { const u = ((((phi / TAU) % 1) + 1) % 1) * N, i = Math.floor(u), f = u - i; return rf[i % N] * (1 - f) + rf[(i + 1) % N] * f; };
  const sOf = (x, z) => Math.hypot(x, z) / rhoAt(Math.atan2(x, z));
  const s0Of = (x, z) => Math.hypot(x, z) / outRho(Math.atan2(x, z));
  let b0 = -1, b1 = -1; for (let i = 0; i < N; i++) if (bite[i]) { if (b0 < 0) b0 = i; b1 = i; }
  return (_slab = { rf, bite, PX, PZ, nx, nz, mx, mz, s0, s0in, cum, total: cum[N], rhoAt, sOf, s0Of, b0, b1 });
}
const hOf = (M, x, z) => topH(Math.min(1, M.s0Of(x, z)));

// ---------------------------------------------------------------- top face: one canvas 1024 x 706, drawn once
function topCanvas(M) {
  return canvasTex(1024, 706, (g, w, h) => {
    const px = w / (2 * SA), X = (x) => (x + SA) * px, Z = (z) => (z + SB) * px;   // canvas row grows with z (the back edge is the top row)
    g.fillStyle = "#efb53e"; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath();
    for (let i = 0; i < N; i++) { const x = X(M.PX[i]), y = Z(M.PZ[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.closePath(); g.clip();
    // 90 shred strokes 0.03-0.07 long x 0.006-0.009 wide, round caps, 40 / 32 / 18 in the three tones
    const pal = []; for (let i = 0; i < 90; i++) pal.push(i < 40 ? "#f8d470" : i < 72 ? "#c9862b" : "#9a5a1c");
    const order = pal.map((c, i) => [hs(i, 3), c]).sort((a, b) => a[0] - b[0]).map((o) => o[1]);
    g.lineCap = "round";
    const place = (i, n0, lim, margin) => {
      for (let k = 0; k < 30; k++) { const x = (hs(i, n0 + k) * 2 - 1) * SA * 0.95, z = (hs(i, n0 + 40 + k) * 2 - 1) * SB * 0.95; if (M.sOf(x, z) < lim && Math.hypot(x - BCX, z - BCZ) > BR + margin) return [x, z]; }
      return [0, 0];
    };
    for (let i = 0; i < 90; i++) {
      const [x, z] = place(i, 10, 0.93, 0.02), len = 0.03 + 0.04 * hs(i, 5), a = hs(i, 6) * Math.PI, bend = (hs(i, 7) - 0.5) * 0.012;
      const x1 = x + Math.cos(a) * len, z1 = z + Math.sin(a) * len;
      g.strokeStyle = order[i]; g.lineWidth = (0.006 + 0.003 * hs(i, 8)) * px;
      g.beginPath(); g.moveTo(X(x), Z(z)); g.quadraticCurveTo(X((x + x1) / 2 - Math.sin(a) * bend), Z((z + z1) / 2 + Math.cos(a) * bend), X(x1), Z(z1)); g.stroke();
    }
    // 14 browned spots r 0.006-0.012 at 60 %
    g.fillStyle = "rgba(125,71,22,0.6)";
    for (let i = 0; i < 14; i++) { const [x, z] = place(i, 200, 0.9, 0.03); g.beginPath(); g.arc(X(x), Z(z), (0.006 + 0.006 * hs(i, 9)) * px, 0, TAU); g.fill(); }
    // the outer 0.03 darkened toward #b8731f: stacked strokes of the outline, widest faintest
    g.strokeStyle = "rgba(184,115,31,0.16)"; g.lineJoin = "round";
    for (let k = 0; k < 7; k++) {
      g.lineWidth = 2 * 0.03 * px * (1 - k / 7);
      g.beginPath(); for (let i = 0; i < N; i++) { const x = X(M.PX[i]), y = Z(M.PZ[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
    }
    g.restore();
  });
}

// ---------------------------------------------------------------- side wall: one canvas, u round the rim, v down the rounded edge and the wall
const RIM_ARC = (INSET * Math.PI) / 2, PROF = RIM_ARC + (topH(1) - INSET - undH(1));   // PROF: the canvas's v length (the cut wall is a little taller: the foot stretches)
function wallCanvas(M) {
  return canvasTex(2048, 160, (g, w, h) => {
    const pu = w / M.total, pv = h / PROF, V = (s) => s * pv;
    g.fillStyle = "#9a5a1c"; g.fillRect(0, 0, w, h);
    const u0 = M.cum[M.b0] * pu, u1 = M.cum[M.b1 + 1] * pu;
    g.fillStyle = "#c9862b";   // 20 flecks, none on the cut
    for (let i = 0; i < 20; i++) { const u = hs(i, 11) * w; if (u > u0 - 20 && u < u1 + 20) continue; g.beginPath(); g.ellipse(u, V(0.02 + 0.035 * hs(i, 12)), 0.0055 * pu, 0.0065 * pv, 0, 0, TAU); g.fill(); }
    // the cut wall: cream, with 5 shred-end dots r 0.006 #e8cf8e
    g.fillStyle = "#f7e8b8"; g.fillRect(u0, V(0.0095), u1 - u0, h);
    g.fillStyle = "#e8cf8e";
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(u0 + (u1 - u0) * (0.1 + 0.8 * (i + hs(i, 13) * 0.6) / 5.6), V(0.022 + 0.026 * hs(i, 14)), 0.006 * pu, 0.006 * pv, 0, 0, TAU); g.fill(); }
    // the crust line round the top edge: 0.008 on the wall, 0.006 on the cut (it ends where the cut wall starts)
    g.fillStyle = "#7d4716"; g.fillRect(0, V(0.003), w, V(0.008)); g.fillRect(u0, V(0.0035), u1 - u0, V(0.006));
    g.fillStyle = "#c9862b"; g.fillRect(0, V(PROF - 0.004), u0, V(0.004)); g.fillRect(u1, V(PROF - 0.004), w - u1, V(0.004));   // the foot, toward the underside's colour
  });
}

function slabParts(M, topTex, wallTex) {
  const parts = [];
  // ---- top face (a fan, then J rings; the last ring is the outline inset by 0.012)
  const posT = [], uvT = [], idxT = [];
  const put = (arr, uv, x, y, z) => { arr.push(x, y, z); uv.push((x + SA) / (2 * SA), 1 - (z + SB) / (2 * SB)); };
  put(posT, uvT, 0, TOP0, 0);
  for (let j = 1; j <= J; j++) { const s = j / J; for (let i = 0; i < N; i++) put(posT, uvT, (M.PX[i] - M.mx[i] * INSET) * s, topH(s * M.s0in[i]), (M.PZ[i] - M.mz[i] * INSET) * s); }
  const R = (j, i) => 1 + (j - 1) * N + (i % N);
  for (let i = 0; i < N; i++) idxT.push(0, R(1, i + 1), R(1, i));
  for (let j = 1; j < J; j++) for (let i = 0; i < N; i++) idxT.push(R(j, i), R(j, i + 1), R(j + 1, i), R(j, i + 1), R(j + 1, i + 1), R(j + 1, i));
  const gT = new THREE.BufferGeometry(); gT.setAttribute("position", new THREE.Float32BufferAttribute(posT, 3)); gT.setAttribute("uv", new THREE.Float32BufferAttribute(uvT, 2)); gT.setIndex(idxT);
  orient(gT, () => new THREE.Vector3(0, 1, 0));
  parts.push({ geo: gT, mat: mat("#ffffff", { map: topTex, roughness: 0.62 }) });
  // ---- underside, #c9862b
  const posU = [0, 0, 0], idxU = [];
  for (let j = 1; j <= J; j++) { const s = j / J; for (let i = 0; i < N; i++) posU.push(M.PX[i] * s, undH(s * M.s0[i]), M.PZ[i] * s); }
  for (let i = 0; i < N; i++) idxU.push(0, R(1, i + 1), R(1, i));
  for (let j = 1; j < J; j++) for (let i = 0; i < N; i++) idxU.push(R(j, i), R(j, i + 1), R(j + 1, i), R(j, i + 1), R(j + 1, i + 1), R(j + 1, i));
  const gU = new THREE.BufferGeometry(); gU.setAttribute("position", new THREE.Float32BufferAttribute(posU, 3)); gU.setIndex(idxU);
  orient(gU, () => new THREE.Vector3(0, -1, 0));
  parts.push({ geo: gU, mat: mat("#c9862b", { roughness: 0.8 }) });
  // ---- side wall: the rounded top edge (6 steps) then the wall down to the underside's rim
  const K = 6, nu = N + 1, posW = [], uvW = [], idxW = [];
  for (let r = 0; r <= K + 1; r++) for (let i = 0; i <= N; i++) {
    const q = i % N, yTop = topH(M.s0in[q]) - INSET, yBot = undH(M.s0[q]);
    let inset, y, sv;
    if (r <= K) { const th = (r / K) * Math.PI / 2; inset = INSET * (1 - Math.sin(th)); y = yTop + INSET * Math.cos(th); sv = (r / K) * RIM_ARC; }
    else { inset = 0; y = yBot; sv = RIM_ARC + (yTop - yBot); }
    posW.push(M.PX[q] - M.mx[q] * inset, y, M.PZ[q] - M.mz[q] * inset); uvW.push(M.cum[i] / M.total, Math.max(0, 1 - sv / PROF));
  }
  for (let r = 0; r <= K; r++) for (let i = 0; i < N; i++) { const a = r * nu + i, b = a + nu; idxW.push(a, a + 1, b, a + 1, b + 1, b); }
  const gW = new THREE.BufferGeometry(); gW.setAttribute("position", new THREE.Float32BufferAttribute(posW, 3)); gW.setAttribute("uv", new THREE.Float32BufferAttribute(uvW, 2)); gW.setIndex(idxW);
  orient(gW, (v) => new THREE.Vector3(v.x, 0, v.z));
  const NN = gW.attributes.normal;   // one normal where the seam closes
  for (let r = 0; r <= K + 1; r++) { const a = r * nu, b = a + N, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
  parts.push({ geo: gW, mat: mat("#ffffff", { map: wallTex, roughness: 0.75 }) });
  return parts;
}

// ---------------------------------------------------------------- relief: 36 raised shreds, 8 crisp tips (one vertex-coloured mesh)
function reliefGeometry(M) {
  const mg = merger(), I = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
  const tones = ["#f8d470", "#c9862b", "#9a5a1c"], tcount = [40, 32, 18];   // the same hexes, in the strokes' proportions
  const pick = (i) => { const f = (i * 0.618 + 0.13) % 1 * 90; return f < tcount[0] ? tones[0] : f < tcount[0] + tcount[1] ? tones[1] : tones[2]; };
  for (let i = 0; i < 36; i++) {
    let x = 0, z = 0, len = 0.035 + 0.035 * hs(i, 21);
    for (let k = 0; k < 40; k++) {
      x = (hs(i, 30 + k) * 2 - 1) * SA * 0.85; z = (hs(i, 80 + k) * 2 - 1) * SB * 0.85;
      if (M.sOf(x, z) < 0.86 && Math.hypot(x - BCX, z - BCZ) > BR + len / 2 + 0.01) break;
    }
    const e = 0.004, hx = (hOf(M, x + e, z) - hOf(M, x - e, z)) / (2 * e), hz = (hOf(M, x, z + e) - hOf(M, x, z - e)) / (2 * e);
    const qs = new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(-hx, 1, -hz).normalize()), qy = new THREE.Quaternion().setFromAxisAngle(Y, hs(i, 22) * Math.PI);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, hOf(M, x, z) + 0.004, z), qs.multiply(qy), new THREE.Vector3(1, 1, 1));
    mg.add(new THREE.BoxGeometry(0.009, 0.007, len), m, pick(i));
  }
  // crisp tips: tapered boxes 0.014 x h x 0.008 leaning out 15-45 deg at the listed azimuths (0 = +z, 90 = +x)
  const AZ = [15, 95, 130, 165, 200, 235, 270, 295], HT = [0.020, 0.035, 0.025, 0.040, 0.020, 0.030, 0.035, 0.025];
  AZ.forEach((az, k) => {
    const phi = az * DEG, i = Math.round((phi / TAU) * N) % N, r = M.rhoAt(phi), nxk = M.nx[i], nzk = M.nz[i], h = HT[k];
    const g = new THREE.BoxGeometry(0.014, h, 0.008); g.translate(0, h / 2, 0);
    const p = g.attributes.position; for (let v = 0; v < p.count; v++) if (p.getY(v) > h * 0.99) p.setXYZ(v, p.getX(v) * 0.35, p.getY(v), p.getZ(v) * 0.5);
    g.computeVertexNormals();
    const n3 = new THREE.Vector3(nxk, 0, nzk), lean = (15 + 30 * hs(k, 41)) * DEG;
    const qL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().crossVectors(Y, n3).normalize(), lean), qY = new THREE.Quaternion().setFromAxisAngle(Y, Math.atan2(nxk, nzk));
    const m = new THREE.Matrix4().compose(new THREE.Vector3(r * Math.sin(phi) - nxk * 0.004, 0.036, r * Math.cos(phi) - nzk * 0.004), qL.multiply(qY), new THREE.Vector3(1, 1, 1));
    mg.add(g, m, "#9a5a1c");
  });
  return mg.build();
}

// =================================================================================================== the hero shred
const SHR = { L: 0.30, W0: 0.030, W1: 0.018, T: 0.009, M: 30 };
// A crinkle strip hinged at its origin, hanging along -y, front face +z. 0.30 long, 0.030 wide tapering to 0.018, 0.009 thick, 5 bends +-0.010.
// face texture: #b8731f, edges #7d4716 0.004, a centre line #f8d470 0.004, the last 0.04 #7d4716. setLift(fn) moves ring t along z (the
// lying pose follows the dome).
function makeShred() {
  const { L, W0, W1, T, M: Mn } = SHR;
  const tex = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = "#b8731f"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#7d4716"; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h); g.fillRect(0, h * (1 - 0.04 / L), w, h);
    g.fillStyle = "#f8d470"; g.fillRect(w / 2 - 4, 0, 8, h * (1 - 0.04 / L));
  });
  const knots = [0, 1, -1, 1, -1, 0], pos0 = [], uv = [], idx = [];
  const centre = (t) => { const u = clamp(t) * 5, i = Math.min(4, Math.floor(u)), f = u - i; return 0.010 * (knots[i] + (knots[i + 1] - knots[i]) * f); };
  for (let k = 0; k <= Mn; k++) {
    const t = k / Mn, xc = centre(t), hw = (W0 + (W1 - W0) * t) / 2, y = -t * L, xl = xc - hw, xr = xc + hw, v = 1 - t;
    for (const [x, z, u, vv] of [[xl, T / 2, 0, v], [xr, T / 2, 1, v], [xl, -T / 2, 0, v], [xr, -T / 2, 1, v], [xl, T / 2, 0.02, v], [xl, -T / 2, 0.02, v], [xr, T / 2, 0.02, v], [xr, -T / 2, 0.02, v]]) { pos0.push(x, y, z); uv.push(u, vv); }
  }
  const tri = (a, b, c, want) => {   // one triangle, wound so its normal faces `want`
    const A = new THREE.Vector3(pos0[a * 3], pos0[a * 3 + 1], pos0[a * 3 + 2]), B = new THREE.Vector3(pos0[b * 3], pos0[b * 3 + 1], pos0[b * 3 + 2]), C = new THREE.Vector3(pos0[c * 3], pos0[c * 3 + 1], pos0[c * 3 + 2]);
    const n = new THREE.Vector3().crossVectors(B.sub(A), C.sub(A)); if (n.dot(want) >= 0) idx.push(a, b, c); else idx.push(a, c, b);
  };
  const FACES = [[0, 1, new THREE.Vector3(0, 0, 1)], [2, 3, new THREE.Vector3(0, 0, -1)], [4, 5, new THREE.Vector3(-1, 0, 0)], [6, 7, new THREE.Vector3(1, 0, 0)]];
  for (let k = 0; k < Mn; k++) for (const [p, q, want] of FACES) { const a = k * 8 + p, b = k * 8 + q, c = (k + 1) * 8 + p, d = (k + 1) * 8 + q; tri(a, b, c, want); tri(b, d, c, want); }
  const g = new THREE.BufferGeometry(), pos = new Float32Array(pos0);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = mat("#ffffff", { map: tex, roughness: 0.75 }), group = new THREE.Group(), strip = new THREE.Mesh(g, m); strip.castShadow = strip.receiveShadow = true; strip.frustumCulled = false; group.add(strip);
  return {
    group, strip,
    setLift(fn) { for (let k = 0; k <= Mn; k++) { const l = fn(k / Mn); for (let i = 0; i < 8; i++) pos[(k * 8 + i) * 3 + 2] = pos0[(k * 8 + i) * 3 + 2] + l; } g.attributes.position.needsUpdate = true; g.computeVertexNormals(); },
  };
}

// a rotation from a strip's frame: the strip hangs along its local -y, its front face is local +z
const _Y = new THREE.Vector3(0, 1, 0);
function qBasis(yA, zA) {
  const y = yA.clone().normalize(), z = zA.clone().addScaledVector(y, -zA.dot(y)).normalize(), x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
const HINGE = [0.27, 0.05, 0.11];
// lying: along the top toward (-0.02, 0.058, -0.08) (in plan; the dome is followed by setLift), face up
const D_LIE = new THREE.Vector3(-0.29, 0, -0.19).normalize();
const Q_LIE = qBasis(D_LIE.clone().negate(), _Y);
// out: straight out along (0.9, 0.2, 0.4): the lying strip flips up and over the rim about the horizontal axis a (the swing passes over the top)
const D_OUT = new THREE.Vector3(0.9, 0.2, 0.4).normalize();
const Q_OUT = (() => {
  const a = new THREE.Vector3().crossVectors(D_LIE, _Y).normalize(), el = Math.asin(D_OUT.y);
  const r1 = new THREE.Quaternion().setFromAxisAngle(a, Math.PI - el);
  const hOut = new THREE.Vector3(D_OUT.x, 0, D_OUT.z).normalize(), hNow = D_LIE.clone().negate();
  const yaw = new THREE.Quaternion().setFromAxisAngle(_Y, Math.atan2(hNow.z * hOut.x - hNow.x * hOut.z, hNow.x * hOut.x + hNow.z * hOut.z));
  return yaw.multiply(r1).multiply(Q_LIE);
})();
// the lying pose's strip follows the dome: how far ring t must rise (in z) to clear the relief (0.0125 above the top face)
function lieLift(M) {
  return (t) => { const d = SHR.L * t, x = HINGE[0] + D_LIE.x * d, z = HINGE[2] + D_LIE.z * d; return Math.max(0, hOf(M, x, z) + 0.0125 - HINGE[1]); };
}

// =================================================================================================== hashtoupee
const _m4 = new THREE.Matrix4(), _pos = new THREE.Vector3(), _q = new THREE.Quaternion(), _sc = new THREE.Vector3();
const _hv = new THREE.Vector3(), _dn = new THREE.Vector3(), _zw = new THREE.Vector3(), _qh = new THREE.Quaternion();
function hashtoupee(P) {
  const S = P.spec, M = slab(), st = { s: S.shred ?? 0, lie: -1 };
  for (const { geo, mat: m } of slabParts(M, topCanvas(M), wallCanvas(M))) mesh(geo, m, P.whole);
  const relief = mesh(reliefGeometry(M), mat("#ffffff", { vertexColors: true, roughness: 0.7 }), P.whole);
  void relief;
  const shred = makeShred(), hinge = new THREE.Group(); hinge.position.set(...HINGE); hinge.add(shred.group); P.whole.add(hinge);
  const lift = lieLift(M);
  const k = S.steamK ?? 1, sA = new THREE.Group(), sB = new THREE.Group();
  sA.position.set(-0.03, 0.075, -0.06); sA.scale.setScalar(1.5 * k); sB.position.set(0.16, 0.07, -0.02); sB.scale.setScalar(1.1 * k); P.whole.add(sA, sB);
  const steamA = steamWisps(sA, 0), steamB = steamWisps(sB, 0);
  const sup = P.whole.updateMatrixWorld, near = S.wear ? wearerFinder(P) : null, qLie = Q_LIE, qOut = Q_OUT;
  P.whole.updateMatrixWorld = function (force) {
    if (near) { const r = P.root.parent ? near() : null; if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1); }
    if (st.s < 1.5) {
      // hanging: world-vertical with 8 deg outward lean, front face to +z, found from the prop's final world turn (stage.js has put it on the head)
      _m4.copy(P.root.matrixWorld).decompose(_pos, _q, _sc);
      _hv.set(HINGE[0], 0, HINGE[2]).applyQuaternion(_q); _hv.y = 0; if (_hv.lengthSq() < 1e-6) _hv.set(1, 0, 0); _hv.normalize();
      _dn.set(0, -Math.cos(8 * DEG), 0).addScaledVector(_hv, Math.sin(8 * DEG));
      _zw.set(0, 0, 1);
      const qHang = qBasis(_dn.clone().negate(), _zw).premultiply(_qh.copy(_q).invert());
      const s = st.s <= 1.15 ? Math.max(0, st.s) : 1;
      if (s <= 0.45) hinge.quaternion.slerpQuaternions(qLie, qOut, s / 0.45);
      else hinge.quaternion.slerpQuaternions(qOut, qHang, Math.min(1.1, (s - 0.45) / 0.55));   // overshoot capped at 10 % of the swing: it must not swing into the head
    }
    sup.call(this, force);
  };
  return {
    grip: 0,
    apply(ps, t) {
      st.s = ps.shred ?? 0;
      hinge.visible = st.s < 1.5;
      const lieAmt = 1 - sm(st.s / 0.35);
      if (Math.abs(lieAmt - st.lie) > 0.004) { st.lie = lieAmt; shred.setLift((u) => lift(u) * lieAmt); }
      steamA(clamp(ps.steam), t); steamB(clamp(ps.steam), t);
    },
  };
}

// =================================================================================================== hashcrumbs
const GRAV = 9.81, TAUH = 0.35;
function crumbPieces() {
  const out = [];
  const add = (o) => out.push({ i: out.length, ...o });
  add({ kind: "shred", burst: 0, vt: 2.0, rest: SHR.T / 2 });
  const flakeCol = ["#efb53e", "#c9862b", "#efb53e", "#c9862b", "#efb53e", "#c9862b"], bitCol = ["#f8d470", "#c9862b", "#9a5a1c", "#c9862b", "#f8d470", "#c9862b", "#9a5a1c", "#c9862b", "#f8d470", "#9a5a1c", "#c9862b"];
  const A = [["flake", 2], ["bit", 5]], B = [["flake", 4], ["bit", 6]]; let f = 0, b = 0;
  [[A, 0], [B, 0.27]].forEach(([list, burst]) => { for (const [kind, n] of list) for (let q = 0; q < n; q++) add({ kind, burst, vt: kind === "flake" ? 1.5 : 2.6, rest: kind === "flake" ? 0.0045 : 0.006, col: kind === "flake" ? flakeCol[f++] : bitCol[b++] }); });
  for (const p of out) {
    const i = p.i, c = p.kind === "shred";
    p.t0 = p.burst + hs(i, 51) * 0.06;
    p.x0 = c ? Math.sin(8 * DEG) * SHR.L / 2 : (hs(i, 52) - 0.5) * 0.02; p.y0 = c ? -Math.cos(8 * DEG) * SHR.L / 2 : hs(i, 53) * 0.04; p.z0 = c ? 0 : (hs(i, 54) - 0.5) * 0.08;
    p.vx = (hs(i, 55) - 0.5) * 0.5; p.vy = 0.1 + 0.3 * hs(i, 56); p.vz = 0.9 + 0.5 * hs(i, 57);
    p.spin = (2 + 3 * hs(i, 58)) * TAU * (hs(i, 59) < 0.5 ? -1 : 1);
    p.axis = c ? new THREE.Vector3(1, 0.2 * (hs(i, 60) - 0.5), 0.3 * (hs(i, 61) - 0.5)).normalize() : new THREE.Vector3(hs(i, 60) - 0.5, hs(i, 61) - 0.5, hs(i, 62) - 0.5).normalize();
    p.yaw = (hs(i, 63) - 0.5) * (c ? 0.3 : TAU);
    p.rock = 25 * DEG * (hs(i, 64) < 0.5 ? -1 : 1); p.ph = hs(i, 65) * TAU;
  }
  return out;
}
const flightY = (p, tau) => { const k = GRAV / p.vt; return p.y0 - p.vt * tau + ((p.vy + p.vt) / k) * (1 - Math.exp(-k * tau)); };
const flightH = (x0, v, tau) => x0 + v * TAUH * (1 - Math.exp(-tau / TAUH));
function landTime(p, ground) { let lo = 0, hi = 4; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (flightY(p, m) > ground) lo = m; else hi = m; } return hi; }
const Q_SHRED_FLAT = qBasis(new THREE.Vector3(0, 0, 1), _Y);   // the strip's local +y along +z, face up: it lies along z toward the papers
function hashcrumbs(P) {
  const S = P.spec, pieces = crumbPieces();
  const flakeG = (i) => {
    const sh = new THREE.Shape(), a = [0, 1, 2, 3, 4, 5].map((q) => { const th = (q / 6) * TAU + 0.3 * (hs(i, 70 + q) - 0.5), r = 0.8 + 0.4 * hs(i, 80 + q); return [Math.cos(th) * 0.025 * r, Math.sin(th) * 0.02 * r]; });
    a.forEach(([x, y], q) => (q ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.009, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -0.0045, 0); return g;
  };
  const shredPiece = makeShred();
  for (const p of pieces) {
    const holder = new THREE.Group();
    if (p.kind === "shred") { shredPiece.group.position.y = SHR.L / 2; holder.add(shredPiece.group); }
    else if (p.kind === "flake") mesh(flakeG(p.i), mat(p.col, { roughness: 0.65 }), holder);
    else mesh(new THREE.BoxGeometry(0.02 + 0.01 * hs(p.i, 90), 0.012, 0.02 + 0.01 * hs(p.i, 91)), mat(p.col, { roughness: 0.7 }), holder);
    P.whole.add(holder); p.holder = holder;
  }
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion(), lean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 8 * DEG);
  return {
    grip: 0,
    apply(ps) {
      const fall = ps.fall || 0, drop = ps.drop || S.drop || 0.88;
      P.whole.visible = fall > 0 || (ps.on ?? 0) > 0.5;
      for (const p of pieces) {
        const tau = fall - p.t0, h = p.holder, hero = p.kind === "shred";
        if (tau < 0 && !hero) { h.visible = false; continue; }
        h.visible = true;
        if (tau <= 0) { h.position.set(p.x0, p.y0, p.z0); h.quaternion.copy(lean); continue; }   // the hero shred still hangs
        const ground = -drop + p.rest, tl = landTime(p, ground), tt = Math.min(tau, tl);
        const x = flightH(p.x0, p.vx, tt), z = flightH(p.z0, p.vz, tt);
        let y = tau < tl ? flightY(p, tau) : ground;
        if (p.kind === "bit" && tau > tl) { const q = (tau - tl) / 0.12; if (q < 1) y += 0.012 * 4 * q * (1 - q); }
        // in the air: the shred and bits tumble about their own axis, the flakes spin about the vertical and rock; down: flat in 0.08 s
        if (hero) qa.setFromAxisAngle(p.axis, p.spin * tt).multiply(lean);
        else if (p.kind === "bit") qa.setFromAxisAngle(p.axis, p.spin * tt);
        else qa.setFromAxisAngle(_Y, p.spin * tt).multiply(qb.setFromAxisAngle(new THREE.Vector3(1, 0, 0), p.rock * Math.sin(TAU * 3 * tt + p.ph)));
        qc.setFromAxisAngle(_Y, p.yaw); if (hero) qc.multiply(Q_SHRED_FLAT);
        h.quaternion.copy(qa); if (tau > tl) h.quaternion.slerp(qc, sm((tau - tl) / 0.08));
        h.position.set(x, y, z);
      }
    },
  };
}

// =================================================================================================== judgeshadow
function judgeshadow(P) {
  const S = P.spec, W = 1.30, H = 1.50, PXM = 640;
  const paint = (withShred) => canvasTex(832, 960, (g, w, h) => {
    const X = (u) => w / 2 + u * PXM, Y = (v) => h - v * PXM, col = "#2f2630";
    g.clearRect(0, 0, w, h); g.filter = `blur(${(0.018 * PXM).toFixed(1)}px)`; g.fillStyle = col; g.strokeStyle = col;
    g.beginPath(); g.ellipse(X(0), Y(0.62), 0.505 * PXM, 0.60 * PXM, 0, 0, TAU); g.fill();
    // the toupee: a lozenge 0.68 x 0.14 centre (0.04, 1.25), rotated -6 deg (clockwise: the right end lower)
    g.save(); g.translate(X(0.04), Y(1.25)); g.rotate(6 * DEG);
    const lx = 0.34, ly = 0.07, top = (u) => -ly * Math.pow(Math.max(0, 1 - Math.abs(u / lx) ** 3), 1 / 3), bot = (u) => -top(u);
    g.beginPath(); for (let i = 0; i <= 60; i++) { const u = -lx + (2 * lx * i) / 60; i ? g.lineTo(u * PXM, top(u) * PXM) : g.moveTo(u * PXM, top(u) * PXM); }
    for (let i = 60; i >= 0; i--) { const u = -lx + (2 * lx * i) / 60; g.lineTo(u * PXM, bot(u) * PXM); } g.closePath(); g.fill();
    const SU = [-0.26, -0.19, -0.12, -0.05, 0.03, 0.10, 0.17, 0.24, 0.30], SH = [0.02, 0.05, 0.03, 0.07, 0.025, 0.04, 0.06, 0.02, 0.045];
    SU.forEach((u, i) => { const wd = 0.03 + 0.02 * hs(i, 100); g.beginPath(); g.moveTo((u - wd / 2) * PXM, (top(u - wd / 2) + 0.004) * PXM); g.lineTo(u * PXM, (top(u) - SH[i]) * PXM); g.lineTo((u + wd / 2) * PXM, (top(u + wd / 2) + 0.004) * PXM); g.closePath(); g.fill(); });
    [-0.21, -0.06, 0.1, 0.23].forEach((u) => { g.beginPath(); g.ellipse(u * PXM, bot(u) * PXM, 0.03 * PXM, 0.015 * PXM, 0, 0, Math.PI); g.fill(); });
    g.restore();
    if (withShred) {   // the hanging shred: 0.35 x 0.035, 3 zigzags, from (0.36, 1.22)
      g.lineWidth = 0.035 * PXM; g.lineJoin = "miter"; g.beginPath(); g.moveTo(X(0.36), Y(1.22));
      [[0.335, 1.105], [0.385, 0.99], [0.335, 0.92], [0.36, 0.87]].forEach(([u, v]) => g.lineTo(X(u), Y(v))); g.stroke();
    }
    // the body fades out over its lowest 0.375 (v 0.25 of the card): 1 at the top of the ramp, 0 at the bottom
    g.filter = "none"; g.globalCompositeOperation = "destination-in";
    const gr = g.createLinearGradient(0, Y(0), 0, Y(0.25 * H)); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const t0 = paint(false), t1 = paint(true);
  const m = new THREE.MeshBasicMaterial({ map: t0, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.userData.noOutline = true;
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2, 0);
  const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = false; o.frustumCulled = false; o.renderOrder = 2; o.userData.steam = true; o.visible = false; P.whole.add(o);
  void S;
  return {
    grip: 0,
    apply(ps) { const on = clamp(ps.on ?? 0); m.opacity = 0.40 * on; o.visible = on > 0.001; m.map = (ps.shred ?? 0) > 0.5 ? t1 : t0; },
  };
}

export const DESK14HEAD_KINDS = { hashtoupee, hashcrumbs, judgeshadow };
