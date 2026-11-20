import * as THREE from "three";
import { clothMat, band, leatherMat } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";

// Potato Desk 05 "Court Day" (18 Nov 2026): VIKING AS THE JUDGE. storyboards/series/potato-desk/05-court-day/DESIGN.md section 3.
// costume.judge on the viking costume (characters/potatobrawl/viking-judge.json). castCostume (costumes-cast.js) calls
// judge(C, ch, out) for a viking whose costume has `judge`; every other character and plain viking.json never reach this
// file. The judge is Viking's own body, face and sprout in a different costume: no helmet, hair tufts, red tunic, fur
// mantle, strap or axe (the gavel is a prop of the clip). Everything is built once from the character's own surface
// (ch.surf), every mark is placed by hand or by index (hash2): nothing tiles, nothing random, no clock.
//
// USAGE (costume keys; "judge": true takes every default; sizes are metres, heights are BODY-LOCAL: y 0 is the base of the
// 1.02 m body, the world y of the body's own ground minus the legs):
//   judge.robe       true | false   the black robe with its two sleeves, and the belt under it (default true)
//   judge.wig        true | false   the white curled wig; false leaves the head bare, the sprout on the top (default true)
//   judge.beard      true | false   the ginger beard and its two braids (default true). Viking has no beard of his own in the
//                                    sheet look; this one is the design's "existing" beard, built here
//   judge.robeColor  "#202227"      shell. Seam "#343840", 3 fold strokes "#2C3036" (painted on one unique canvas), cuffs "#30343B"
//   judge.wigColor   "#F1EFE4"      crown dome and curl faces; curl sides "#D0D0CD", spirals "#9B9DA1"
//   judge.beardColor "#874B2E"      beard and braids; strand accents "#B46B43", ties "#50372B"
//   judge.hem        0.79           hem width in x; the shell is 0.018 m off the belly (0.022 with the folds' base), down to y 0.02
//   judge.neck       0.36           lowest front point of the neck opening (see ASSUMPTIONS below)
//   judge.cuffGap    0.09           where the cuff stops short of the hand's centre, along the arm (the wrist joint)
// THE PIECES
//   robe     shell down to y 0.02, 0.79 hem; shoulders covered up to y 0.71; front neck opening 0.34 m wide (the shell's top edge
//            leaves y 0.36 at the front centre and rises to 0.71 from 25 to 77 degrees round); a rolled edge at the neck and the hem;
//            ten broad geometric folds, none in front of the beard; the front closure seam 0.010 m wide down the centre and three
//            hand-painted fold strokes (0.21, 0.16 and 0.23 m long) on one 1024 x 512 canvas. No texture tiles.
//   belt     0.065 m #5C3B2B band at y 0.27 under the shell, buckle left off.
//   sleeves  cones from the shoulder (diameter 0.18) to the wrist (0.09) round each arm's own curve, rebuilt for any pose;
//            a 0.028 m cuff #30343B ends cuffGap before the hand's centre. The black hand stays clear.
//   wig      flattened ellipsoid 0.55 x 0.19 x 0.43 centred at y 1.00 with a 0.055 m notch at the crown for the sprout (the stem shows
//            0.05 m above the cap), 3 curls a side (cylinders 0.108 across, 0.19 deep, bevelled) at |x| 0.265 / 0.284 / 0.265
//            and y 0.962 / 0.870 / 0.778, front discs at z 0.225 or 0.020 ahead of the skin, each with its own 1.25-turn spiral
//            (0.009 stroke, 0.038 outer radius). Silhouette top: 1.095 + the stem and leaves, 1.145 at the stem top.
//   beard    ginger, from just under the lip line (y 0.38) down to y 0.16, 0.38 m across at the top, 0.06 m off the face, with
//            lighter strands; two braids of about 0.24 x 0.065 hang from its lower corners over the robe, tied in #50372B.
// ASSUMPTIONS the director may overrule: the design's "front neck opening drops to y 0.54" would cover the mouth and the eyes' lower
// lids (the lip line is at about y 0.42, the eyes at 0.56-0.63); the neck's lowest point is therefore y 0.36, below the lip line and
// behind the beard (judge.neck).

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * Math.PI / 2) ** 2);
const wrapPi = (x) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };

// a (nu+1) x (nv+1) grid of points, closed round in u (the last column meets the first with one normal)
function grid(nu, nv, at) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = at(i / nu, j / nv); pos.push(q.p.x, q.p.y, q.p.z); uv.push(q.uv[0], q.uv[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const N = g.attributes.normal;
  for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  return g;
}
// a brush stroke lying on a surface: centre points, the surface normal at each, a half width at each end tapering to a point
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
const flat = (color) => { const m = clothMat(color, { side: THREE.DoubleSide }); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; m.userData.noOutline = true; return m; };

// ---------------------------------------------------------------- the robe's one unique canvas: seam and three fold strokes
// u (round the body, 0.5 = the front centre), v (up from the hem at y 0.02 to the shoulders at y 0.71). Row 0 is the hem.
const TW = 1024, TH = 512, Y0 = 0.02, Y1 = 0.71;
function robeCanvas(robe, seam, fold, neckY) {
  const data = new Uint8Array(TW * TH * 4);
  const base = new THREE.Color(robe).getHex(), bs = [(base >> 16) & 255, (base >> 8) & 255, base & 255];
  const hex = (h) => { const x = parseInt(h.slice(1), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; };
  for (let k = 0; k < TW * TH; k++) { data[k * 4] = bs[0]; data[k * 4 + 1] = bs[1]; data[k * 4 + 2] = bs[2]; data[k * 4 + 3] = 255; }
  const seg = (x0, y0, x1, y1, w0, w1, c) => {
    const pad = Math.max(w0, w1) + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(TH - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = clamp(((x - x0) * dx + (y - y0) * dy) / l2), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), w = w0 + (w1 - w0) * u, a = 1 - sstep(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = (y * TW + (((x % TW) + TW) % TW)) * 4;
      for (let ch = 0; ch < 3; ch++) data[q + ch] = Math.round(data[q + ch] + (c[ch] - data[q + ch]) * a);
    }
  };
  const row = (y) => ((y - Y0) / (Y1 - Y0)) * (TH - 1), colOf = (th) => ((th + Math.PI) / TAU) * TW;
  // the closure seam: 0.010 m wide (4 px of 2.55 mm), from the neck's lowest point to the hem, a hand's wobble in it
  { const top = row(neckY), n = 16, S = hex(seam); let px = TW / 2, py = top;
    for (let i = 1; i <= n; i++) { const t = i / n, ny = top * (1 - t), nx = TW / 2 + 1.6 * Math.sin(t * 7 + 0.6) + 0.9 * Math.sin(t * 17 + 2), w = 1.55 + 0.45 * Math.sin(Math.PI * clamp(t * 1.1)); seg(px, py, nx, ny, w, w, S); px = nx; py = ny; } }
  // three fold strokes (m): angle round the body, top y, length, lean (rad of x per rad of y), bow
  const F = hex(fold);
  for (const [th, yTop, len, lean, bow] of [[-0.62, 0.285, 0.21, 0.05, 0.012], [0.8, 0.245, 0.16, -0.06, -0.01], [-1.18, 0.27, 0.23, 0.07, 0.014]]) {
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([colOf(th) + (lean * len * t + bow * Math.sin(Math.PI * t)) / 0.00255, row(yTop - len * t)]); }
    for (let i = 0; i < 10; i++) { const w = 4.2 * Math.pow(Math.sin(Math.PI * clamp(0.05 + 0.9 * (i + 0.5) / 10)), 0.6); seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, w, F); }
  }
  const t = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

export function judge(C, ch, out) {
  const J = C.judge === true ? {} : C.judge || {}, parts = ch.potatoParts;
  const wantRobe = J.robe !== false, wantWig = J.wig !== false, wantBeard = J.beard !== false;
  const robeC = J.robeColor || "#202227", wigC = J.wigColor || "#F1EFE4", beardC = J.beardColor || "#874B2E";
  const LOC = ch.cy - ch.ry;                                                  // bodyGroup y of body-local 0
  const phOf = (yl) => Math.asin(clamp((yl + LOC - ch.cy) / ch.ry, -0.995, 0.995));
  const topLocal = ch.topY() - LOC;                                           // the head top, body-local (the hat's origin)

  // ---------------------------------------------------------------- robe
  const YB = 0.3, YH = 0.02, YS = 0.71, YN = J.neck ?? 0.36, BASE = 0.022;
  const yTop = (th) => YN + (YS - YN) * sstep(0.44, 1.35, Math.abs(wrapPi(th)));
  const yHem = (th) => YH + 0.006 * (0.5 + 0.5 * Math.sin(th * 3 + 0.5));
  // broad folds: angle, half width (rad), height (m), lean per metre of drop. None in front of the beard (|th| < 0.5)
  const FOLDS = [[-2.9, 0.2, 0.016, 0.1], [-2.3, 0.16, 0.024, -0.12], [-1.7, 0.2, 0.018, 0.08], [-1.05, 0.15, 0.022, -0.1], [-0.68, 0.13, 0.014, 0.06], [0.7, 0.14, 0.016, -0.07], [1.1, 0.17, 0.024, 0.1], [1.75, 0.2, 0.018, -0.08], [2.35, 0.16, 0.026, 0.12], [2.85, 0.2, 0.02, -0.1]];
  const fold = (th, yl) => { let f = 0; for (const [t0, w, A, sl] of FOLDS) f += A * bump(wrapPi(th - t0 - sl * (YS - yl)) / w); return f * 1.5 * (0.35 + 0.65 * sstep(0.6, 0.12, yl)); };
  let FH = 1;
  { const s = ch.surf(Math.PI / 2, phOf(YB)); FH = (J.hem ?? 0.79) / 2 / (s.pos.x + BASE); }
  const robePt = (th, yl, off = 0, withFold = true) => {
    const ylc = Math.max(yl, YB), s = ch.surf(th, phOf(ylc)), n = s.normal.clone(); n.y *= 0.4; n.normalize();
    const p = s.pos.clone().addScaledVector(n, BASE + (withFold ? fold(th, yl) : 0) + off);
    if (yl < YB) { const f = 1 + (FH - 1) * sstep(0, 1, (YB - yl) / (YB - YH)); p.x *= f; p.z *= f; p.y -= YB - yl; }
    return p;
  };
  if (wantRobe) {
    const robeM = clothMat("#ffffff", { side: THREE.DoubleSide }); robeM.map = robeCanvas(robeC, J.seamColor || "#343840", J.foldColor || "#2C3036", YN);
    // no outline hull on the shell: under set "ink" the thin double-sided shell's hull drew pale streaks down the robe front
    // (Desk 11 Sol check, 20 Nov 2026); the sleeves, belt and crest strokes keep their lines
    robeM.userData.noOutline = true;
    const G = grid(200, 44, (u, v) => { const th = -Math.PI + u * TAU, yt = yTop(th), yl = yt + (yHem(th) - yt) * v; return { p: robePt(th, yl), uv: [u, clamp((yl - Y0) / (Y1 - Y0))] }; });
    const robe = mesh(G, robeM); robe.name = "judge-robe"; parts.add(robe);
    // a drawn line down the crest of each broad fold, in strokes of uneven length (the folds must read on a black robe)
    const crestM = flat(J.foldColor || "#2C3036");
    FOLDS.forEach(([t0, , , sl], k) => {
      const yA = 0.5 - 0.2 * hs(k, 31), yB = Math.max(0.07, yA - 0.22 - 0.22 * hs(k, 32)), pts = [], ns = [];
      for (let i = 0; i <= 14; i++) { const yl = yA + (yB - yA) * (i / 14), th = t0 + sl * (YS - yl) + 0.03 * Math.sin(i * 0.6 + k), p = robePt(th, yl, 0.003); ns.push(V(p.x, 0, p.z).normalize()); pts.push(p); }
      parts.add(mesh(ribbon(pts, ns, 0.0055, 0.5), crestM, false));
    });
    // the rolled edges: the neck opening and the hem
    const rimM = clothMat(robeC, { side: THREE.DoubleSide });
    for (const [yf, r, lift] of [[(th) => yTop(th), 0.011, 0.004], [(th) => yHem(th), 0.009, 0.0]]) {
      const pts = Array.from({ length: 96 }, (_, i) => { const th = -Math.PI + (i / 96) * TAU; return robePt(th, yf(th), lift); });
      parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 192, r, 8, true), rimM));
    }
  }
  // the belt, under the shell (its buckle left off)
  parts.add(mesh(band(ch, { ph: phOf(0.27), w: 0.0325, t: 0.01, lift: 0.004 }), leatherMat(J.beltColor || "#5C3B2B")));

  // ---------------------------------------------------------------- sleeves: a cone round each arm's own curve, ending at the wrist
  if (wantRobe) {
    const slvM = clothMat(robeC, { side: THREE.DoubleSide }), cufM = clothMat(J.cuffColor || "#30343B", { side: THREE.DoubleSide });
    const sl = {}, cf = {}, key = {}, GAP = J.cuffGap ?? 0.09, CUFF = 0.028, R = 18, up = V(0, 1, 0), fw = V(0, 0, 1);
    for (const s of ["L", "R"]) for (const [set, m] of [[sl, slvM], [cf, cufM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); set[s].visible = false; }
    // a tube along the curve between u = ua and ub whose radius is rad(w), w 0..1 along it; the frame is carried along the curve
    const tube = (curve, ua, ub, rad, n, n0, cap) => {
      const pos = [], idx = [], N = n0.clone(), Tn = V(0, 0, 0), B = V(0, 0, 0);
      for (let i = 0; i <= n; i++) {
        const w = i / n, u = ua + (ub - ua) * w, p = curve.getPointAt(u); curve.getTangentAt(u, Tn); N.addScaledVector(Tn, -N.dot(Tn)).normalize(); B.crossVectors(Tn, N);
        for (let k = 0; k <= R; k++) { const a = (k / R) * TAU, r = rad(w, a); pos.push(p.x + r * (Math.cos(a) * N.x + Math.sin(a) * B.x), p.y + r * (Math.cos(a) * N.y + Math.sin(a) * B.y), p.z + r * (Math.cos(a) * N.z + Math.sin(a) * B.z)); }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      void cap;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
      return g;
    };
    const buildSleeves = () => {
      for (const s of ["L", "R"]) {
        const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { sl[s].visible = cf[s].visible = false; continue; }
        const k = [A.shoulder, A.elbow, A.hand.position].map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|") + A.joint;
        if (key[s] === k) continue; key[s] = k;
        const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength());
        const from = 0.04, to = Math.max(from + 0.3, Math.min(0.94, 1 - GAP / L)), mid = Math.max(from + 0.2, to - CUFF / L);
        const T0 = curve.getTangentAt(from), w = sstep(0.75, 0.95, Math.abs(T0.y)), n0 = up.clone().multiplyScalar(1 - w).addScaledVector(fw, w);
        // diameter 0.18 at the shoulder to 0.09 at the wrist, with five soft pleats that die out toward the cuff
        const ph = s === "L" ? 0.7 : 2.1, rad = (t, a) => (0.09 - 0.045 * Math.pow(t, 0.9)) * (1 + 0.035 * Math.sin(a * 5 + ph) * sstep(0.1, 0.5, t) * (1 - sstep(0.8, 1, t)));
        const m1 = (mid - from) / (to - from);
        sl[s].geometry.dispose(); sl[s].geometry = tube(curve, from, mid, (q, a) => rad(q * m1, a), 22, n0); sl[s].visible = true;
        cf[s].geometry.dispose(); cf[s].geometry = tube(curve, mid, to, (q) => rad(m1 + (1 - m1) * q, 0) * 1.025 + 0.004 * Math.sin(Math.PI * q), 4, n0); cf[s].visible = true;
        // the second tube starts with the first's frame: the normal is re-carried from the same start, which is the same arm line
      }
    };
    const base = out.apply; out.apply = (st, t, ...r) => { base && base(st, t, ...r); buildSleeves(); };
  }

  // ---------------------------------------------------------------- beard and braids (outside the collar, lip line clear above)
  if (wantBeard) {
    const L = 0.52, WK = 0.52, DK = 0.7, RO = 0.03;
    const bpt = (vx, vy, vz, strands = 0) => {
      const k = (1 - vy) / 2, w = (0.28 * (1 - 0.8 * k ** 1.6) + 0.015) * WK, d = (0.15 * (1 - 0.45 * k) + 0.02) * DK;
      const th = (vx * w) / ch.rx * 1.3, ph = -0.26 + 0.14 * vx * vx * (1 - k) - k * L, s = ch.surf(th, ph), lift = Math.max(0, vz) * (d + strands) + 0.012 + RO;
      const p = s.pos.clone().addScaledVector(s.normal, lift); p.y += 0.02; p.n = s.normal; return p;
    };
    const g = new THREE.SphereGeometry(1, 64, 48), pa = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const q = bpt(v.x, v.y, v.z, 0.01 * Math.sin(Math.atan2(v.x, v.z) * 18 + ((1 - v.y) / 2) * 4)); pa.setXYZ(i, q.x, q.y, q.z); }
    g.computeVertexNormals();
    const beard = mesh(g, clothMat(beardC, { roughness: 0.9 })); beard.name = "judge-beard"; parts.add(beard);
    // lighter strands, each its own start, length and sway
    const strandG = [];
    for (let i = 0; i < 9; i++) {
      const vx0 = (hs(i, 1) - 0.5) * 1.1, k0 = 0.1 + 0.3 * hs(i, 2), dk = 0.28 + 0.3 * hs(i, 3), pts = [], ns = [];
      for (let q = 0; q <= 12; q++) {
        const t = q / 12, k = Math.min(0.94, k0 + dk * t), vy = 1 - 2 * k, lim = Math.sqrt(Math.max(0.04, 0.9 - vy * vy)), vx = clamp(vx0 * (1 - 0.5 * t) + 0.04 * Math.sin(t * 5 + i), -lim, lim), vz = Math.sqrt(Math.max(0.02, 1 - vx * vx - vy * vy));
        const p = bpt(vx, vy, vz); ns.push(p.n.clone()); pts.push(p.addScaledVector(p.n, 0.004));
      }
      strandG.push(ribbon(pts, ns, 0.0042 + 0.0016 * hs(i, 4), 0.5));
    }
    const strandM = flat(J.strandColor || "#B46B43");
    for (const g2 of strandG) parts.add(mesh(g2, strandM, false));
    // the two braids: tapered tubes pinched at every plait, tied with a band and ending in a small tuft
    const braidM = clothMat(beardC, { roughness: 0.9 }), tieM = clothMat(J.tieColor || "#50372B"), sheen = flat(J.strandColor || "#B46B43");
    for (const [si, s] of [-1, 1].entries()) {
      const th = s * 0.37, y0 = 0.325, y1 = 0.085, rad = (t) => (0.0325 - 0.004 * t) * (0.74 + 0.26 * Math.abs(Math.sin(t * Math.PI * 7))) * (1 - 0.55 * sstep(0.93, 1, t));
      const at = (t) => { const yl = y0 + (y1 - y0) * t, p = robePt(th + s * 0.03 * Math.sin(t * 3.2), yl, 0.036); p.x += s * 0.012 * Math.sin(t * 5 + si); return p; };
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => at(i / 11)));
      const tube = new THREE.Mesh(taperedBraid(curve, rad), braidM); tube.castShadow = true; parts.add(tube);
      const e = curve.getPointAt(0.9), T = curve.getTangentAt(0.9), tie = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0085, 8, 18), tieM);
      tie.position.copy(e); tie.quaternion.setFromUnitVectors(V(0, 0, 1), T); tie.castShadow = true; parts.add(tie);
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.045, 10), braidM); tuft.position.copy(curve.getPointAt(0.985)).add(V(0, -0.02, 0)); tuft.rotation.x = Math.PI; tuft.castShadow = true; parts.add(tuft);
      for (let q = 0; q < 2; q++) {   // two light strand strokes down the face of the braid
        const t0 = 0.08 + 0.35 * hs(si * 2 + q, 5), t1 = t0 + 0.38 + 0.2 * hs(si * 2 + q, 6), pts = [], ns = [];
        for (let i = 0; i <= 8; i++) { const t = t0 + (t1 - t0) * (i / 8), p = curve.getPointAt(Math.min(0.88, t)); const n = V(s * 0.25 * (q ? 1 : -1), 0, 1).normalize(); pts.push(p.addScaledVector(n, rad(t) * 0.93 + 0.003)); ns.push(n); }
        parts.add(mesh(ribbon(pts, ns, 0.004, 0.5), sheen, false));
      }
    }
  }

  // ---------------------------------------------------------------- wig and the sprout's notch
  const hat = new THREE.Group();
  if (wantWig) {
    const wig = new THREE.Group(); wig.name = "judge-wig"; hat.add(wig);
    wig.quaternion.setFromEuler(new THREE.Euler(-0.08, 0, 0.06)).invert();   // costumes.js sets the hat's rock (-0.08, 0, 0.06) on the group: the wig keeps the design's numbers
    const YC = 1.0 - topLocal, wigM = clothMat(wigC, { roughness: 0.9 }), sideM = clothMat(J.curlSide || "#D0D0CD", { roughness: 0.9 });
    // crown dome 0.55 x 0.19 x 0.43, its pole open: a 0.055 m notch
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 28, 0, TAU, Math.asin(0.0275 / 0.275), Math.PI), wigM);
    dome.scale.set(0.275, 0.095, 0.215); dome.position.y = YC; dome.castShadow = true; wig.add(dome);
    // where the skin is at (x, y): the front of the body at that height, found along the body's own surface (lumps included)
    const skinZ = (x, yl) => { const ph = phOf(yl); let lo = 0, hi = Math.PI / 2; for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (ch.surf(m, ph).pos.x < Math.abs(x)) lo = m; else hi = m; } return ch.surf((lo + hi) / 2, ph).pos.z; };
    const RC = 0.054, B = 0.012, DEEP = 0.19, SPIR = flat(J.spiralColor || "#9B9DA1");
    const prof = []; for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; prof.push(new THREE.Vector2(RC - B + B * Math.sin(a), -DEEP / 2 + B - B * Math.cos(a))); }   // bevel at the back
    for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; prof.push(new THREE.Vector2(RC - B + B * Math.cos(a), DEEP / 2 - B + B * Math.sin(a))); }
    prof.unshift(new THREE.Vector2(0, -DEEP / 2)); prof.push(new THREE.Vector2(0, DEEP / 2));
    const curlG = new THREE.LatheGeometry(prof, 28);
    for (const s of [-1, 1]) [[0.265, 0.962], [0.284, 0.87], [0.265, 0.778]].forEach(([ax, yl], ci) => {
      const x = s * ax, zf = Math.max(0.225, skinZ(x, yl) + 0.02), c = new THREE.Group(); c.position.set(x, yl - topLocal, zf - DEEP / 2); c.rotation.x = Math.PI / 2; wig.add(c);
      const body = new THREE.Mesh(curlG, sideM); body.castShadow = true; c.add(body);
      // the front disc and its own spiral: 1.25 turns, 0.009 wide, 0.038 outer radius, each curl wound from its own start
      const disc = new THREE.Mesh(new THREE.CircleGeometry(RC - B * 0.5, 28), wigM); disc.rotation.x = -Math.PI / 2; disc.position.y = DEEP / 2 + 0.0006; c.add(disc);
      const idn = (s < 0 ? 0 : 3) + ci, a0 = hs(idn, 7) * TAU, turns = 1.25 + 0.04 * (hs(idn, 8) - 0.5), pts = [], ns = [];
      for (let i = 0; i <= 40; i++) { const t = i / 40, a = a0 + s * t * turns * TAU, r = 0.004 + (0.038 - 0.004) * Math.pow(t, 0.85); pts.push(V(Math.cos(a) * r, DEEP / 2 + 0.0016, -Math.sin(a) * r)); ns.push(V(0, 1, 0)); }
      c.add(mesh(ribbon(pts, ns, 0.0045, 0.15), SPIR, false));
    });
    hat.userData.cap = YC + 0.095;
  }
  const capRel = wantWig ? hat.userData.cap : 0.0;
  // costumes.js stands the sprout's stem at hat.height - 0.02: 0.015 below the cap's top, so 0.05 of the 0.065 stem shows
  out.hat = { group: hat, height: capRel + 0.005, brimR: 0 };
  if (!wantWig) out.hat = null;
  out.prop = null; out.sitDepth = 0;
  return out;
}

// a tube along a curve with a radius function of t (open ends: the braid's end is closed by the tuft and its top is inside the beard)
function taperedBraid(curve, rad, segs = 60, radial = 12) {
  const frames = curve.computeFrenetFrames(segs, false), pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i], r = rad(t);
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU; pos.push(p.x + r * (Math.cos(a) * N.x + Math.sin(a) * B.x), p.y + r * (Math.cos(a) * N.y + Math.sin(a) * B.y), p.z + r * (Math.cos(a) * N.z + Math.sin(a) * B.z)); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
