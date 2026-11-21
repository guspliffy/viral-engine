import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clothMat } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";

// Egypt myth 01 "Your heart vs. one feather", DESIGN section F (storyboards/series/egypt-myth/01-heart/DESIGN.md): THE 42 JUDGES (assessors).
// costume.assessor on Spud's body (characters/egypt-myth/assessor-a/b/c.json: costume { type: "spud", assessor: { lean } }); Spud's own
// skin, eyes and hands, no sprout, no sweater. castCostume (costumes-cast.js) calls assessor(C, ch, out) before every type. Everything is
// built once from the character's own surface (ch.surf), every mark placed by hand or by index (hash2): nothing tiles, nothing random,
// no clock. Metres, body-local heights (y 0 = the base of the body; world y = this + 0.14 legs). The DESIGN's heights are for the 0.88 body:
// the other copies (0.85, 0.91) scale every height by body.height / 0.88 (sizes of pieces stay), so the headband and the neck opening keep
// their place on the face; the feather stays 0.42 tall.
//
// USAGE (costume keys; "assessor": true takes every default):
//   assessor.lean     10     the feather's lean back in degrees (the copies: a 5, b 10, c 15)
//   assessor.sway     1      the feather's follow-through scale (0 = a stiff feather)
//   assessor.gold     "#e2b04a"   GOLD base (shade #9a6a1e, deep #6b4612, light #fff0b8, bole #8a4a2a)
//   assessor.lapis    "#2b4fa2"   LAPIS (shade #1c3470, light #5f86d6)
//   assessor.linen    "#f3eee2"   LINEN (folds #cfc7b4, the 3 deepest #a89f8c)
// SEATED: on a stool top at y 0.42 (the `sit` action's height) the head top is at world 1.30 and the feather tip 1.70 (0.88 body).
// LEAN-IN (panel 08): the clip's `lean` action tips the body 25 degrees; the robe, band and feather ride the body. Rigs sit on stools 1-6.
// THE PIECES (every count of DESIGN F):
//   robe      a shell 0.02 off the belly, hem y 0.03 and 0.82 wide (rolled edge 0.02), neck opening lowest at y 0.30 rising to the shoulders
//             at y 0.60; 9 broad folds (5 fanning from the left shoulder across the chest, 4 falling over the lap), folds #cfc7b4 on their
//             shade side and the 3 deepest #a89f8c; fine pleat lines 4 mm at 0.012 pitch down the lap (150, each wobbled); a knotted
//             fringe of 48 tassels 0.02 long on the hem.
//   over-fold a band 0.17 wide from the left shoulder to the right hip (y 0.14), 0.012 above the robe: 60 fine pleat lines across it, a GOLD
//             stripe 0.012 on its lower edge, a loose end 0.12 hanging behind the shoulder.
//   sleeves   short and wide: diameter 0.20 at the shoulder to 0.15, ending 0.14 before the hand's centre; 14 pleat lines each; a rolled
//             cuff; a GOLD band 0.035 on the bare forearm with 1 engraved line (the band is moved on the live arm curve each frame, the
//             sleeve is rebuilt only when the pose changes).
//   collar    a GOLD band 0.05 round the neck opening, 18 bead dots across the front, a LAPIS oval 0.03 at the front centre.
//   headband  0.045 high, centred y 0.76 (0.12 or more above the eyes): GOLD, 12 LAPIS squares 0.012 inlaid round it, a LAPIS disc r 0.022
//             at the front, the tie's two ends 0.08 hanging at the back.
//   feather   ONE ostrich feather: root (0, 0.86, -0.05), 0.42 tall, 0.14 wide at 65 % up, tip curled 0.06 forward, leaning back by `lean`;
//             #f6f2e6, shade #cfc9bb, quill #e9dcc0: 38 barbs a side with 4 splits (a wedge where two barbs part), 6 downy tufts at the
//             root; it follows the head 0.15 s late: the engine's follow-through (st.ft) times 6 degrees, plus a slow hashed idle sway.
// GOLD LEAF: base #e2b04a, a long light band #fff0b8 on every round part, shade #9a6a1e, wear to bronze #6b4612 on edges and about 8 % of
//   the pieces (the red bole #8a4a2a in 1 spot of 4), baked into vertex colours from each piece's own frame.
// NOT BUILT HERE: the stern face (an expression the clip sets), the far-row copies on stools 7-42 (props-heart-hall.js builds them).

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * Math.PI / 2) ** 2);
const wrapPi = (x) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const col = (h) => new THREE.Color(h);
const se = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);

function grid(nu, nv, at, closed = true) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) {
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}
function ribbon(pts, nrm, W, heavy = 0.4) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    const u = i / n, w = W * (1 - heavy + heavy * u) * Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.92)), 0.55);
    pos.push(...p.clone().addScaledVector(side, -w).toArray(), ...p.clone().addScaledVector(side, w).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function strip(pts, nrm, W) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    pos.push(...p.clone().addScaledVector(side, -W).toArray(), ...p.clone().addScaledVector(side, W).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const bucket = () => ({ g: [] });
function put(b, geo, M, colorFn) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const n = g.attributes.normal, p = g.attributes.position, cols = new Float32Array(n.count * 3), v = V(0, 0, 0), q = V(0, 0, 0);
  for (let i = 0; i < n.count; i++) { v.fromBufferAttribute(n, i); q.fromBufferAttribute(p, i); const c = colorFn(v, q, i); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  if (M) g.applyMatrix4(M);
  b.g.push(g);
}
function flush(b, mat, parent, shadow = true) {
  if (!b.g.length) return null;
  const m = new THREE.Mesh(mergeGeometries(b.g), mat); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m;
}
const vmat = (o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: o.rough ?? 0.55, metalness: 0, side: o.side ?? (o.flat ? THREE.DoubleSide : THREE.FrontSide) });
  if (o.line) m.userData.lineColor = o.line;
  if (o.flat) { m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  if (o.role) m.userData.lookRole = o.role;
  return m;
};

export function assessor(C, ch, out) {
  const A = C.assessor === true ? {} : C.assessor || {}, parts = ch.potatoParts;
  const LOC = ch.cy - ch.ry, sc = ch.H / 0.88, Y = (y) => y * sc;
  const phOf = (yl) => Math.asin(clamp((yl + LOC - ch.cy) / ch.ry, -0.995, 0.995));
  const surfAt = (th, yl) => ch.surf(th, phOf(yl));
  const root = new THREE.Group(); root.name = "assessor"; root.position.y = LOC; parts.add(root);   // body-local coordinates from here on
  const bp = (th, yl, off = 0, flatN = 1) => { const s = surfAt(th, yl), n = s.normal.clone(); n.y *= flatN; n.normalize(); const p = s.pos.clone().addScaledVector(n, off); p.y -= LOC; return { p, n }; };
  const frame = (th, yl, off = 0, flatN = 0.4) => {
    const { p, n } = bp(th, yl, off, flatN), X = V(0, 1, 0).cross(n).normalize(), Yv = n.clone().cross(X).normalize();
    return new THREE.Matrix4().makeBasis(X, Yv, n).setPosition(p);
  };

  const GB = col(A.gold || "#e2b04a"), GS = col("#9a6a1e"), GD = col("#6b4612"), GL = col("#fff0b8"), GBOLE = col("#8a4a2a");
  const LB = col(A.lapis || "#2b4fa2"), LS = col("#1c3470"), LL = col("#5f86d6");
  const LIN = col(A.linen || "#f3eee2"), LINF = col("#cfc7b4"), LIND = col("#a89f8c");
  const FW = col("#f6f2e6"), FS = col("#cfc9bb"), FQ = col("#e9dcc0");
  const _c = new THREE.Color();
  const gold = (n, wear = 0, bole = false) => {
    const k = sstep(-0.6, 0.45, n.y * 0.6 + n.z * 0.5), c = _c.copy(GS).lerp(GB, k);
    c.lerp(GL, sstep(0.76, 0.93, n.y * 0.55 + n.z * 0.83) * 0.92);
    if (wear > 0) c.lerp(bole ? GBOLE : GD, clamp(wear));
    return c.clone();
  };
  const roundCol = (base, light, shade) => (n) => { const c = _c.copy(shade).lerp(base, sstep(-0.6, 0.4, n.y * 0.6 + n.z * 0.5)); c.lerp(light, sstep(0.78, 0.93, n.y * 0.55 + n.z * 0.83) * 0.7); return c.clone(); };
  const B = { gold: bucket(), lapis: bucket(), linen: bucket(), deco: bucket(), fth: bucket() };

  // ================================================================ ROBE
  const YB = Y(0.30), YH = 0.03, YS = Y(0.60), YN = Y(0.30), BASE = 0.02;
  const yTop = (th) => YN + (YS - YN) * sstep(0.7, 1.45, Math.abs(wrapPi(th)));
  const yHem = (th) => YH + 0.004 * (0.5 + 0.5 * Math.sin(th * 3 + 0.5));
  let FH = 1; { const s = ch.surf(Math.PI / 2, phOf(YB)); FH = 0.82 / 2 / (s.pos.x + BASE); }
  // 9 folds: paths in (angle, height); 5 fan from the left shoulder across the chest, 4 fall over the lap. [path points, amplitude, half width (m)]
  const RF = 0.34;   // metres per radian, to measure distances on the robe
  const quad = (a, b, c, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [(1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * b[1] + t * t * c[1]]; });
  const FOLDS = [
    { p: quad([1.12, Y(0.57)], [0.55, Y(0.34)], [-0.98, Y(0.26)]), a: 0.017, w: 0.05 },
    { p: quad([1.08, Y(0.56)], [0.42, Y(0.26)], [-0.72, Y(0.17)]), a: 0.021, w: 0.055 },
    { p: quad([1.02, Y(0.55)], [0.3, Y(0.2)], [-0.4, Y(0.11)]), a: 0.024, w: 0.05 },
    { p: quad([0.98, Y(0.53)], [0.35, Y(0.14)], [-0.02, Y(0.08)]), a: 0.02, w: 0.05 },
    { p: quad([0.95, Y(0.5)], [0.55, Y(0.1)], [0.36, Y(0.06)]), a: 0.017, w: 0.045 },
    { p: quad([-0.82, Y(0.25)], [-0.88, Y(0.14)], [-0.78, 0.05]), a: 0.019, w: 0.05 },
    { p: quad([-0.28, Y(0.22)], [-0.22, Y(0.12)], [-0.3, 0.05]), a: 0.024, w: 0.055 },
    { p: quad([0.3, Y(0.22)], [0.38, Y(0.12)], [0.28, 0.05]), a: 0.018, w: 0.05 },
    { p: quad([0.86, Y(0.26)], [0.8, Y(0.14)], [0.92, 0.05]), a: 0.021, w: 0.05 },
  ];
  const distSeg = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l2); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  const foldDist = (f, th, yl) => { let d = 1e9; for (let i = 0; i < f.p.length - 1; i++) d = Math.min(d, distSeg(th * RF, yl, f.p[i][0] * RF, f.p[i][1], f.p[i + 1][0] * RF, f.p[i + 1][1])); return d; };
  const foldAmp = FOLDS.map((f) => f.a);
  const deepest = new Set([...FOLDS.keys()].sort((a, b) => foldAmp[b] - foldAmp[a]).slice(0, 3));
  const fold1 = (k, th, yl) => FOLDS[k].a * bump(foldDist(FOLDS[k], th, yl) / FOLDS[k].w);
  const fold = (th, yl) => { let f = 0; for (let k = 0; k < FOLDS.length; k++) f += fold1(k, th, yl); return f * (0.45 + 0.55 * sstep(YS, YB * 0.4, yl)); };
  const robePt = (th, yl, off = 0, withFold = true) => {
    const ylc = Math.max(yl, YB), s = ch.surf(th, phOf(ylc)), n = s.normal.clone(); n.y *= 0.4; n.normalize();
    const p = s.pos.clone().addScaledVector(n, BASE + (withFold ? fold(th, yl) : 0) + off);
    if (yl < YB) { const f = 1 + (FH - 1) * sstep(0, 1, (YB - yl) / (YB - YH)); p.x *= f; p.z *= f; p.y -= YB - yl; }
    p.y -= LOC; return { p, n };
  };
  {
    {
    const nu = 220, nv = 46, geo = grid(nu, nv, (u, v) => { const th = -Math.PI + u * TAU, yt = yTop(th), yl = yt + (yHem(th) - yt) * v; return robePt(th, yl).p; });
    const D = 0.02;
    put(B.linen, geo, null, (n, p, i) => {
      const u = (i % (nu + 1)) / nu, th = -Math.PI + u * TAU, v = Math.floor(i / (nu + 1)) / nv, yt = yTop(th), yl = yt + (yHem(th) - yt) * v;
      const c = _c.copy(LIN);
      if (Math.abs(th) < 2.7) {
        // the shade side of every fold: light from the left, so a flank that rises toward +th is lit and one that falls is in shade
        let shade = 0, deep = 0;
        for (let k = 0; k < FOLDS.length; k++) {
          const d0 = fold1(k, th - D, yl), d1 = fold1(k, th + D, yl), g = -(d1 - d0) / (2 * D) * 3.4, near = bump(foldDist(FOLDS[k], th, yl) / (FOLDS[k].w * 1.6));
          const s = clamp(g) * near; shade = Math.max(shade, s); if (deepest.has(k)) deep = Math.max(deep, s);
        }
        c.lerp(LINF, shade * 0.85); c.lerp(LIND, deep * 0.55);
      }
      c.lerp(LINF, 0.08 * (1 - v));
      return c.clone();
    });
    // the rolled edges 0.02: the neck opening and the hem
    for (const [yf, r, lift] of [[(th) => yTop(th), 0.0095, 0.004], [(th) => yHem(th), 0.0095, 0.0]]) {
      const pts = Array.from({ length: 120 }, (_, i) => { const th = -Math.PI + (i / 120) * TAU; return robePt(th, yf(th), lift, true).p; });
      put(B.linen, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, r, 8, true), null, (n, p, i) => LIN.clone().lerp(LINF, 0.3 + 0.2 * Math.sin(i * 0.011)));
    }
    // fine pleat lines down the lap: 4 mm wide at 0.012 pitch (hem circumference / 0.012), each wobbled and ending at its own height
    {
      let k = 0; const R0 = 0.41, step = 0.012 / R0;
      for (let th = -2.45; th <= 2.45; th += step, k++) {
        const top = Y(0.13) + 0.1 * hs(k, 3) * sc, x = th + (hs(k, 1) - 0.5) * 0.006, pts = [], ns = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, yl = lerp(top, YH + 0.012, t), q = robePt(x + 0.004 * Math.sin(i * 0.8 + k * 1.3), yl, 0.0015); pts.push(q.p); ns.push(q.n); }
        put(B.deco, ribbon(pts, ns, 0.002, 0.2), null, () => LIN.clone().lerp(LINF, 0.55));
      }
    }
    // the knotted fringe: 48 tassels 0.02 long on the hem, each with its knot
    for (let i = 0; i < 48; i++) {
      const th = -Math.PI + ((i + 0.5) / 48) * TAU + (hs(i, 4) - 0.5) * 0.03, q = robePt(th, yHem(th) - 0.004, 0.004);
      const len = 0.02 * (0.9 + 0.2 * hs(i, 5)), X = V(0, 1, 0).cross(q.n).normalize(), Yv = q.n.clone().cross(X).normalize();
      const M = new THREE.Matrix4().makeBasis(X, Yv, q.n).setPosition(q.p);
      const knot = new THREE.SphereGeometry(0.0055, 8, 6); put(B.linen, knot, M, () => LINF.clone());
      const t = new THREE.CylinderGeometry(0.0035, 0.0022, len, 6); t.translate(0, -len / 2 - 0.003, 0);
      put(B.linen, t, M.clone().multiply(new THREE.Matrix4().makeRotationX(0.1 * (hs(i, 6) - 0.5))), (n) => LIN.clone().lerp(LINF, 0.25 + 0.4 * (1 - n.y) * 0.5));
    }
    }
  }

  // ================================================================ OVER-FOLD: 0.17 wide, left shoulder -> right hip (y 0.14), 0.012 above the robe
  
  {
    const path = [[1.5, Y(0.585)], [1.25, Y(0.47)], [0.8, Y(0.31)], [0.2, Y(0.22)], [-0.45, Y(0.17)], [-0.98, Y(0.13)]];   // (angle, height) of the centre line
    const NS = 40, NW = 6, WID = 0.17, OFF = 0.012;
    const spl = new THREE.CatmullRomCurve3(path.map(([a, y]) => V(a * RF, y, 0)));   // metres on the cloth
    const L = spl.getLength();
    const at = (s, w, off = OFF) => {   // s 0..1 along, w -1..1 across
      const q = spl.getPointAt(clamp(s, 0, 1)), T = spl.getTangentAt(clamp(s, 0, 1)), N = V(-T.y, T.x, 0);
      return robePt((q.x + N.x * w * WID / 2) / RF, q.y + N.y * w * WID / 2, off, true);
    };
    const g = grid(NW, NS, (u, v) => at(v, u * 2 - 1).p, false);
    put(B.linen, g, null, (n, p, i) => { const u = (i % (NW + 1)) / NW, v = Math.floor(i / (NW + 1)) / NS; return LIN.clone().lerp(col("#ffffff"), 0.35 * (1 - Math.abs(u * 2 - 1) ** 2)).lerp(LINF, 0.35 * sstep(0.7, 1, u)); });
    // 60 fine pleat lines across it, each wobbled
    for (let k = 0; k < 60; k++) {
      const s = 0.015 + 0.97 * ((k + 0.5) / 60), pts = [], ns = [];
      for (let i = 0; i <= 8; i++) { const w = lerp(-0.94, 0.94, i / 8), q = at(s + 0.004 * Math.sin(i * 0.9 + k * 2.1) + 0.003 * (hs(k, 7) - 0.5), w, OFF + 0.0016); pts.push(q.p); ns.push(q.n); }
      put(B.deco, ribbon(pts, ns, 0.002, 0.15), null, () => LINF.clone().lerp(LIND, k % 7 === 0 ? 0.5 : 0));
    }
    // the edges: a fine fold line on the upper edge, the GOLD stripe 0.012 on the lower edge (the right-hand side of the tangent)
    {
      const pu = [], nu2 = [], pl = [], nl = [];
      for (let i = 0; i <= NS; i++) { const a = at(i / NS, 0.99, OFF + 0.0014), b = at(i / NS, -0.93, OFF + 0.0016); pu.push(a.p); nu2.push(a.n); pl.push(b.p); nl.push(b.n); }
      put(B.deco, strip(pu, nu2, 0.0016), null, () => LINF.clone());
      put(B.gold, strip(pl, nl, 0.006), null, (n, p, i) => { const c = gold(V(0, 0.55, 0.83), 0); if (hs(Math.floor(i / 6), 11) < 0.08) c.lerp(GD, 0.6); return c; });
    }
    // the loose end: 0.12 hanging behind the shoulder, over the back of the left shoulder
    {
      const ge = grid(NW, 6, (u, v) => { const a = 1.62 + (u * 2 - 1) * 0.17 / RF * 0.5 * (1 - 0.18 * v), y = lerp(Y(0.575), Y(0.575) - 0.12, v) + 0.006 * Math.sin(u * Math.PI) * v; return robePt(a, y, OFF + 0.006 * v, true).p; }, false);
      put(B.linen, ge, null, (n, p, i) => { const v = Math.floor(i / (NW + 1)) / 6; return LIN.clone().lerp(LINF, 0.25 + 0.35 * v); });
      const ps = [], nn = []; for (let i = 0; i <= 6; i++) { const q = robePt(1.62 + (-0.5) * (0.17 / RF) * (1 - 0.18 * 1) * 0 + (hs(2, 1) - 0.5) * 0.02 + (i / 6 - 0.5) * 0.4 * 0.17 / RF, Y(0.575) - 0.12 - 0.002, OFF + 0.007); ps.push(q.p); nn.push(q.n); }
      put(B.gold, strip(ps, nn, 0.004), null, () => gold(V(0, 0.55, 0.83), 0));
    }
  }

  // ================================================================ COLLAR band round the neck opening
  
  {
    const hw = 0.025, NU = 240;
    const g = grid(NU, 6, (u, v) => { const th = -Math.PI + u * TAU, a = v * TAU, yl = yTop(th) - hw * 0.7 + se(Math.cos(a), 3) * hw * 0.82; const q = robePt(th, yl, 0.0125 + 0.0045 + se(Math.sin(a), 3) * 0.0045, false); return q.p; });
    put(B.gold, g, null, (n, p, i) => { const u = (i % (NU + 1)) / NU; const c = gold(n, hs(Math.floor(u * 40), 8) < 0.08 ? 0.7 : 0, hs(Math.floor(u * 40), 9) < 0.25); return c; });
    // 18 bead dots across the front
    for (let k = 0; k < 18; k++) {
      const th = -1.45 + ((k + 0.5) / 18) * 2.9, yl = yTop(th) - hw * 0.7, q = robePt(th, yl, 0.0225, false);
      const M = new THREE.Matrix4().setPosition(q.p), s = new THREE.SphereGeometry(0.0062 * (0.95 + 0.1 * hs(k, 3)), 10, 8);
      put(B.gold, s, M, (n) => gold(n, 0));
    }
    // the LAPIS oval 0.03 at the front
    const q = robePt(0, yTop(0) - hw * 0.7, 0.024, false), X = V(0, 1, 0).cross(q.n).normalize(), Yv = q.n.clone().cross(X).normalize();
    const M = new THREE.Matrix4().makeBasis(X, Yv, q.n).setPosition(q.p);
    const ov = new THREE.SphereGeometry(0.015, 18, 12); ov.scale(1.0, 0.8, 0.4); put(B.lapis, ov, M, roundCol(LB, LL, LS));
    const fr = new THREE.TorusGeometry(0.0165, 0.0026, 6, 22); fr.scale(1, 0.8, 0.6); put(B.gold, fr, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.001)), (n) => gold(n, 0));
  }

  // ================================================================ HEADBAND (GOLD, 12 LAPIS squares, a LAPIS disc, a tie)
  
  {
    const YC = Y(0.76), W = 0.0225, T = 0.011, lift = 0.004;
    const NU = 200, g = grid(NU, 10, (u, v) => {
      const th = -Math.PI + u * TAU, a = v * TAU, fr = bp(th, YC, 0, 0.4);
      return fr.p.clone().addScaledVector(V(0, 1, 0), se(Math.cos(a), 3.2) * W).addScaledVector(fr.n, lift + T * 0.5 + se(Math.sin(a), 3.2) * T * 0.5);
    });
    put(B.gold, g, null, (n, p, i) => { const c = gold(n, 0); const ring = Math.floor(i / (NU + 1)) % 11; if (ring === 2 || ring === 8) c.lerp(GS, 0.4); const th = Math.atan2(p.x, p.z); if (hs(Math.floor((th + Math.PI) * 5), 12) < 0.08) c.lerp(hs(Math.floor((th + Math.PI) * 5), 13) < 0.25 ? GBOLE : GD, 0.6); return c; });
    for (let k = 0; k < 12; k++) {   // 12 LAPIS squares 0.012 inlaid, the front left open for the disc
      const th = ((k + 0.5) / 12) * TAU, M = frame(th, YC, lift + T + 0.0004, 0.4), box = new THREE.BoxGeometry(0.012, 0.012, 0.0025);
      put(B.lapis, box, M.clone().multiply(new THREE.Matrix4().makeRotationZ((hs(k, 2) - 0.5) * 0.06)), (n) => (n.z > 0.5 ? LL.clone().lerp(LB, 0.5) : LS.clone()));
    }
    const dM = frame(0, YC, lift + T + 0.003, 0.4), disc = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24); disc.rotateX(Math.PI / 2);
    put(B.lapis, disc, dM, roundCol(LB, LL, LS));
    const rim = new THREE.TorusGeometry(0.022, 0.0035, 6, 26); put(B.gold, rim, dM.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.002)), (n) => gold(n, 0));
    // the tie: a small knot at the back and two ends 0.08 hanging
    const kM = frame(Math.PI, YC, lift + T + 0.002, 0.4), ball = new THREE.SphereGeometry(0.0085, 10, 8); put(B.gold, ball, kM, (n) => gold(n, 0));
    for (const sg of [-1, 1]) {
      const pts = [], ns = []; for (let i = 0; i <= 8; i++) { const t = i / 8, p = bp(Math.PI + sg * (0.02 + 0.07 * t), YC - 0.01 - 0.08 * t, lift + T + 0.004 + 0.006 * t, 0.4); pts.push(p.p); ns.push(p.n); }
      put(B.gold, ribbon(pts, ns, 0.0075, 0.1), null, (n) => gold(V(0, 0.5, 0.86), 0));
      const e = bp(Math.PI + sg * 0.09, YC - 0.092, lift + T + 0.01, 0.4), bead = new THREE.SphereGeometry(0.0055, 8, 6); put(B.gold, bead, new THREE.Matrix4().setPosition(e.p), (n) => gold(n, 0));
    }
  }

  // ================================================================ FEATHER
  const fRoot = new THREE.Group(), fGrp = new THREE.Group(); fRoot.name = "assessor-feather"; root.add(fRoot); fRoot.add(fGrp);
  fRoot.position.set(0, Y(0.86), -0.05);
  {
    const H = 0.42, WH = 0.07, S0 = 0.06, NB = 38;
    const curl = (s) => 0.06 * Math.pow(Math.max(0, s), 3.2) + 0.012 * Math.sin(Math.max(0, s) * Math.PI);          // the shaft bows and the tip curls 0.06 forward
    const rach = (s) => V(0, s * H, curl(s));
    const half = (s) => { const u = clamp((s - S0) / (0.98 - S0)); return WH * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 1.45))), 0.85); };
    // quill (the shaft): a tapered tube from under the root to the tip
    const qp = Array.from({ length: 14 }, (_, i) => rach(-0.07 + (i / 13) * 1.07)), curve = new THREE.CatmullRomCurve3(qp);
    const qg = new THREE.TubeGeometry(curve, 40, 0.0065, 7, false), qa = qg.attributes.position, tq = new THREE.Vector3();
    for (let i = 0; i < qa.count; i++) { tq.fromBufferAttribute(qa, i); const s = clamp((tq.y / H + 0.07) / 1.07), k = lerp(1, 0.32, Math.pow(s, 0.8)), c = curve.getPointAt(s); tq.sub(c).multiplyScalar(k).add(c); qa.setXYZ(i, tq.x, tq.y, tq.z); }
    qg.computeVertexNormals(); put(B.fth, qg, null, (n) => FQ.clone().lerp(FS, 0.25 * (1 - n.z) * 0.5));
    // barbs: 38 a side, each a strip from the shaft to the outline, drooping and curling a little at its tip; 4 splits (two barbs part like a wedge)
    const splitsL = new Set([6, 15, 24, 31]), splitsR = new Set([9, 19, 27, 34]);
    for (const sd of [-1, 1]) {
      const splits = sd < 0 ? splitsL : splitsR;
      for (let i = 0; i < NB; i++) {
        const s0 = 0.085 + 0.9 * ((i + 0.5) / NB), base = rach(s0);
        let phi = lerp(0.95, 0.78, sstep(0.0, 1, i / NB)) + 0.05 * (hs(i + (sd > 0 ? 50 : 0), 1) - 0.5);          // angle up from the horizontal: steeper near the tip
        if (splits.has(i)) phi += 0.17; else if (splits.has(i + 1)) phi -= 0.17;                                    // the wedge: the barb above steepens, the one below flattens
        const part = splits.has(i) || splits.has(i + 1) ? 1 : 0;
        // barb length so its end meets the outline: L cos(phi) = half(s0 + L sin(phi) / H)
        let Lb = 0.05; for (let it = 0; it < 6; it++) Lb = Math.max(0.012, half(clamp(s0 + (Lb * Math.sin(phi)) / H, 0, 1)) / Math.cos(phi));
        Lb *= 0.97 + 0.06 * hs(i + (sd > 0 ? 70 : 20), 2);
        const pitch = (0.9 * H) / NB, w2 = pitch * 0.5 * (part ? 0.8 : 0.96), N = 6, pos = [], idx = [], cols = [];
        const base1 = hs(i + (sd > 0 ? 3 : 90), 3);
        for (let j = 0; j <= N; j++) {
          const t = j / N, along = Lb * t, dx = sd * Math.cos(phi) * along, dy = Math.sin(phi) * along - 0.012 * t * t,
            dz = (sd * 0.0 + 0.012 * t * t) + curl(clamp(s0 + dy / H)) - curl(s0) * 0 - 0 + 0.006 * Math.sin(t * Math.PI) * (sd);
          const c0 = base.clone().add(V(dx, dy, dz - curl(s0)));   // base already includes the shaft's own curl at s0
          // a barb is a flat blade: its width runs along the shaft direction
          const w = w2 * (1 - 0.35 * t) * (t > 0.9 ? 1 - (t - 0.9) * 5 : 1);
          pos.push(c0.x, c0.y - w, c0.z, c0.x, c0.y + w, c0.z);
          const shade = 0.12 + 0.5 * base1 * t + 0.2 * (1 - t) * (1 - sstep(0, 0.2, s0));
          const c1 = FW.clone().lerp(FS, clamp(shade)), c2 = FW.clone().lerp(FS, clamp(shade + 0.28));
          cols.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
        for (let j = 0; j < N; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
        B.fth.g.push(g.toNonIndexed());
      }
    }
    // 6 downy tufts at the root: a fan of thin wisps curling up and out
    for (let k = 0; k < 6; k++) {
      const sd = k % 2 ? 1 : -1, s0 = 0.012 + 0.028 * Math.floor(k / 2), base = rach(s0);
      for (let w = 0; w < 5; w++) {
        const ang = 0.5 + 0.32 * w + 0.1 * hs(k * 5 + w, 4), len = 0.034 + 0.018 * hs(k * 5 + w, 5), pos = [], idx = [], cols = [], N = 5;
        for (let j = 0; j <= N; j++) {
          const t = j / N, x = sd * Math.cos(ang) * len * t * (1 - 0.1 * t), y = Math.sin(ang) * len * t - 0.014 * t * t + 0.004, z = 0.004 * Math.sin(t * 3 + k) + 0.006 * t, ww = 0.0034 * (1 - 0.8 * t);
          pos.push(base.x + x, base.y + y - ww, base.z + z, base.x + x, base.y + y + ww, base.z + z);
          const c = FW.clone().lerp(FS, 0.12 + 0.2 * t); cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
        for (let j = 0; j < N; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
        B.fth.g.push(g.toNonIndexed());
      }
    }
    flush(B.fth, vmat({ line: "#9a9484", rough: 0.9, side: THREE.DoubleSide }), fGrp);
  }
  const LEAN = (A.lean ?? 10) * Math.PI / 180, SWAY = A.sway ?? 1, PH = 2 * Math.PI * hs((ch.def?.body?.seed ?? 1) * 0.37, 21);

  // ================================================================ flush the static buckets
  { const lm = vmat({ line: "#9a9280", rough: 0.95, role: "cloth" }); lm.emissive = LIN.clone(); lm.emissiveIntensity = 0.22; flush(B.linen, lm, root); }
  flush(B.gold, vmat({ line: "#5a3c10", rough: 0.4 }), root);
  flush(B.lapis, vmat({ line: "#142348", rough: 0.5 }), root);
  flush(B.deco, vmat({ flat: true, rough: 0.9 }), root, false);

  // ================================================================ SLEEVES (rebuilt when the pose changes) and the forearm bands (moved each frame)
  const TUBE_R = 84, TUBE_N = 26;
  const slM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); slM.userData.lookRole = "cloth"; slM.userData.lineColor = "#9a9280";
  const cuffG = new THREE.TorusGeometry(0.0745, 0.0095, 8, 40), cuffM = clothMat(A.linen || "#f3eee2", { side: THREE.DoubleSide });
  const sl = {}, cf = {}, bandOf = {}, key = {};
  const mkBand = (len, seed) => {
    const R = ch.limbW + 0.0045, hh = len / 2, pp = [[R - 0.001, -hh], [R + 0.0012, -hh + 0.0008], [R + 0.0032, -hh + 0.003], [R + 0.0036, -hh + 0.0075]];
    const mid = []; for (let k = 0; k <= 6; k++) { const y = lerp(-hh + 0.0075, hh - 0.0075, k / 6); let r = R + 0.0036; const d = Math.abs(y); if (d < 0.0022) r -= 0.0009 * (1 - d / 0.0022); mid.push([r, y]); }   // 1 engraved line
    const tail = [[R + 0.0032, hh - 0.003], [R + 0.0012, hh - 0.0008], [R - 0.001, hh]];
    const lathe = new THREE.LatheGeometry([...pp, ...mid, ...tail].map(([x, y]) => new THREE.Vector2(x, y)), 24), gb = bucket(), grp = new THREE.Group();
    put(gb, lathe, null, (n, p, i) => {
      const a = Math.atan2(p.z, p.x), edge = sstep(hh - 0.006, hh, Math.abs(p.y)), w = hs(Math.floor((a + Math.PI) * 4) + seed * 7, 3) < 0.5 ? 1 : 0, groove = Math.abs(p.y) < 0.0016 ? 1 : 0;
      const c = gold(V(0, 0.55 * n.y + 0.45, 0.2 + 0.8 * clamp(0.5 + 0.5 * (Math.cos(a) * 0.6 + Math.sin(a) * 0.5))).normalize(), 0); c.lerp(GS, groove * 0.8);
      if (edge > 0 && w) c.lerp(hs(seed + i, 5) < 0.25 ? GBOLE : GD, edge * 0.7); return c.clone();
    });
    flush(gb, vmat({ line: "#5a3c10", rough: 0.4 }), grp); return grp;
  };
  for (const s of ["L", "R"]) {
    sl[s] = new THREE.Mesh(new THREE.BufferGeometry(), slM); cf[s] = new THREE.Mesh(cuffG, cuffM);
    for (const m of [sl[s], cf[s]]) { m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); }
    bandOf[s] = mkBand(0.035, s === "L" ? 3 : 4); bandOf[s].visible = false; ch.root.add(bandOf[s]);
  }
  const _t = V(0, 0, 0), _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4(), up = V(0, 1, 0), fw = V(0, 0, 1);
  // a tube along the arm curve between u = ua and ub (radius rad(w)), pleat lines baked as vertex colours: 14 lines 4 mm wide, each wobbled
  const tube = (curve, ua, ub, rad, n, n0, seed) => {
    const R = TUBE_R, pos = [], idx = [], cols = [], N = n0.clone(), Tn = V(0, 0, 0), Bn = V(0, 0, 0), L0 = curve.getLength();
    for (let i = 0; i <= n; i++) {
      const w = i / n, u = ua + (ub - ua) * w, p = curve.getPointAt(u); curve.getTangentAt(u, Tn); N.addScaledVector(Tn, -N.dot(Tn)).normalize(); Bn.crossVectors(Tn, N);
      for (let k = 0; k <= R; k++) {
        const a = (k / R) * TAU, r = rad(w, a); pos.push(p.x + r * (Math.cos(a) * N.x + Math.sin(a) * Bn.x), p.y + r * (Math.cos(a) * N.y + Math.sin(a) * Bn.y), p.z + r * (Math.cos(a) * N.z + Math.sin(a) * Bn.z));
        const c = _c.copy(LIN); let m = 0;
        for (let j = 0; j < 14; j++) { const aj = ((j + 0.5 + 0.3 * (hs(j + seed, 1) - 0.5)) / 14) * TAU + 0.05 * Math.sin(w * 6 + j), d = Math.abs(wrapPi(a - aj)) * r, hwid = 0.002 * (0.8 + 0.4 * hs(j + seed, 2)); m = Math.max(m, 1 - sstep(hwid * 0.6, hwid * 1.5, d)); }
        c.lerp(LINF, m * (0.65 + 0.25 * w)); c.lerp(LINF, 0.12 * w); cols.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    void L0; return g;
  };
  const build = () => {
    for (const s of ["L", "R"]) {
      const Am = ch.arms?.[s]; if (!Am?.shoulder || !Am.elbow || !Am.hand) { sl[s].visible = cf[s].visible = bandOf[s].visible = false; continue; }
      const k = [Am.shoulder, Am.elbow, Am.hand.position].map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|") + Am.joint;
      const curve = ch.constructor.armCurve(Am.shoulder, Am.elbow, Am.hand.position, Am.joint), L0 = Math.max(0.05, curve.getLength());
      const to = Math.max(0.34, Math.min(0.94, 1 - 0.14 / L0)), from = 0;
      const T0 = curve.getTangentAt(0.02), wv = sstep(0.75, 0.95, Math.abs(T0.y)), n0 = up.clone().multiplyScalar(1 - wv).addScaledVector(fw, wv);
      if (key[s] !== k) {
        key[s] = k;
        // diameter 0.20 at the shoulder (tucked under the robe: the first 12 % grow from 0.055) to 0.15 at the cuff
        const rad = (t) => (0.10 - 0.025 * Math.pow(t, 0.9)) * (0.55 + 0.45 * sstep(0, 0.12, t)) * (1 + 0.03 * Math.sin(t * 9));
        sl[s].geometry.dispose(); sl[s].geometry = tube(curve, from, to, (q) => rad(q), TUBE_N, n0, s === "L" ? 10 : 30); sl[s].visible = true;
      }
      // the rolled cuff at the sleeve's end, opening along the arm
      const pe = curve.getPointAt(to), Te = curve.getTangentAt(to).normalize();
      _x.copy(n0).addScaledVector(Te, -n0.dot(Te)).normalize(); _z.crossVectors(Te, _x); _m.makeBasis(_x, _z, Te); cf[s].quaternion.setFromRotationMatrix(_m); cf[s].position.copy(pe); cf[s].visible = true;
      cf[s].scale.setScalar(1 - 0.025 * 0);
      // the GOLD band 0.035 on the bare forearm, centred 0.075 before the hand's centre (at least clear of the cuff)
      const d = Math.max(to * L0 + 0.03, L0 - 0.075), u = clamp(d / L0, 0.001, 0.999), p = curve.getPointAt(u); curve.getTangentAt(u, _t);
      const outV = V(s === "L" ? 1 : -1, 0.1, 0).normalize(); _y.copy(_t).normalize(); _x.copy(outV).addScaledVector(_y, -outV.dot(_y)).normalize(); _z.crossVectors(_x, _y); _m.makeBasis(_x, _y, _z);
      bandOf[s].quaternion.setFromRotationMatrix(_m); bandOf[s].position.copy(p); bandOf[s].visible = true;
    }
  };
  // ================================================================ apply: sleeves, the feather's follow-through
  const baseApply = out.apply;
  out.apply = (st, t, ...rest) => {
    baseApply && baseApply(st, t, ...rest);
    build();
    // the feather follows the head 0.15 s late, 6 degrees: the engine's follow-through (st.ft, already a lagged signal) and the gaze, plus a slow idle sway
    const ft = st?.ft || { f: 0, s: 0 }, lk = st?.look || [0, 0], idle = Math.sin(TAU * 0.3 * t + PH);
    fGrp.rotation.set(-LEAN - 0.105 * SWAY * (ft.f || 0) * 1 + 0.01 * SWAY * Math.sin(TAU * 0.23 * t + PH * 0.7), 0, SWAY * (0.105 * (0.6 * (ft.s || 0) - 0.35 * (lk[0] || 0)) + 0.02 * idle));
  };
  out.hat = null; out.prop = null; out.sitDepth = 0;
  return out;
}
