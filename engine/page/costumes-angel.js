import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { garment, clothMat, liningMat, foldInk, inkMesh, sstep, softFollow } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";

// Potato Desk "Heaven Steps" (storyboards/series/potato-desk/heaven-steps/DESIGN.md section 1, variant A): THE ANGEL, the deadpan clerk
// of Heaven, a white-robed potato. costumes-everyday.js KIT entry `angel` calls angelKit(C, ch); characters/potatobrawl/angel.json uses it.
// All sizes in metres, body-local y = measured up from the body's bottom (the body is 1.20 high, 0.14 above the floor: standing = body-local + 0.14).
//
// WHAT IT DRAWS
//   robe     ONE white wrap robe #f8f5ec (inside #e2dccd), stand-off 0.02 from the skin. Shoulder line at body-local y 0.52 (back and sides),
//            the front neckline a V down to y 0.36 (the mouth at 0.50 stays clear: the cloth is 0.07+ below the mouth corners). The left panel
//            lies over the right: the gold edge runs from the left shoulder through the V and on down to the hem at th -0.62. Gold trim
//            band 0.035 wide #e8b93a on the collar edge, that wrap edge, the hem and each cuff. Hem at y 0.06, flare 0.04, 4 fold strokes
//            #d9d2c0 (each drawn once by foldInk). Short bell sleeves, diameter 0.24 -> 0.20, 0.16 long, ending far before the wrist.
//   belt     twisted rope, diameter 0.035 #d9a93a, a twist mark every 0.045 #b3831f, round the robe at y 0.26; a bow at the front (knot,
//            two loops) with two hanging ends 0.20 and 0.16 long, tassels 0.05 #e8b93a (the ends swing with the body: softFollow).
//   wings    two, each 0.46 high x 0.32 wide x about 0.04 thick, a curved shell of 5 primaries (0.20-0.26), 5 secondaries and 6 coverts,
//            #fbf8f0 shading to #e3dccb at the quill, feather lines #cfc6b0; each wing is its own canvas, own feather jitter (not mirrored).
//            The wing spans body-local y 0.40..0.86 (shoulder to eye height); the root is at x +-0.30, z -0.30; tip to tip 1.24.
//            Swept back 22 degrees, tips 6 degrees up; idle flutter 6 degrees at 0.4 Hz (the two wings in opposite phase). They sit
//            behind the shoulder line (z < -0.27), the arms are always in front of it: they never meet.
//   halo     gold ring, outer diameter 0.44, tube 0.022, #f6c744, emissive #fff3b0 at 0.6, a soft glow card r 0.30 at 25 % behind it.
//            Centre 0.07 above the sprout tip (sprout tip 1.50, halo top 1.63), tipped 12 degrees toward the lens, bobs 0.01 at 0.5 Hz,
//            trails the head by the engine's follow-through (about 3 frames) so it follows head turns, never snaps.
//   glasses  round gold wire, rim #e8b93a 0.012 thick, lens diameter 0.17, centres 0.23 apart, bridge 0.05, worn LOW (lens centre at
//            standing 0.75, eyes at 0.90) so the rims cross the eyes' lower third; one sheen stroke on each lens at 8 %.
//   sprout   the usual two-leaf V, size 1.0 (angel.json sprout.size).
//   skin     7 potato-eye specks #c98d47 and 6 freckles #eec07e, each placed once by hand (never on the face; body.specks is 0).
//   slippers white #f8f5ec with a gold sole band #e8b93a (0.16 x 0.25), on both feet.
//   hands    left free: cream glove hands (handsAndFeet in costumes-everyday.js), size 1.7 in angel.json. The quill hold is another file.
// FACE (angel.json face.layout): eyes standing 0.90, eyebrows 0.11 above them, mouth 0.64, mouth width 0.2 (small, flat). Eye build = Spud's.
//   The five faces are expression + face controls, no kit key: deadpan (default; lids 0.45 by face lid), sideeye, write, oops, soft.
//   See storyboards/series/potato-desk/heaven-steps/bench/make-angel-bench.mjs for the exact numbers used.
//
// COSTUME KEYS (angel.json "costume"; all optional). A number holds a value; an array of keyframes [[t0, v0], [t1, v1], ...] (clip
// seconds, linear between, held outside) moves it, like the Devil's tailDroop. The timeline action { "do": "wings", "to": 0..1 } (st.wings)
// and st.flap also drive `flap` (the larger wins), so the director can animate it with no engine change.
//   flap       0     0..1: the wings pop open (swing out, tips up) up to 25 degrees; 6 frames in is the director's call (ease it in the keyframes)
//   slip       0     0..1: the glasses slide 0.03 down the nose (also st.slip)
//   tilt       0     0..20 degrees: the halo knocked askew (rolled, and slid 0.03 sideways at 20)
//   haloTip    12    degrees the halo is tipped toward the lens (reads as an ellipse 0.44 x 0.09-0.12 on the series cameras)
//   flutter    6     degrees of the idle wing flutter (0 = still)
//   wings      true  false: no wings (a bust shot, a test)
//   glasses    "#e8b93a" or false (no glasses)
//   robe "#f8f5ec", robeShade "#e2dccd", trim "#e8b93a", fold "#d9d2c0", rope "#d9a93a", ropeMark "#b3831f", tassel "#e8b93a",
//   wing "#fbf8f0", wingShade "#e3dccb", wingLine "#cfc6b0", halo "#f6c744", haloGlow "#fff3b0", slipper "#f8f5ec", sole "#e8b93a"   (colours)

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3 + 77, i * 0.71 + n * 1.7 + 31.4);   // a hash 0..1 for mark i, channel n (the angel's seed 77)
const gold = (c, r = 0.35, m = 0.45) => { const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, side: THREE.DoubleSide }); x.userData.lookRole = "cloth"; return x; };
// a number or keyframes [[t, v], ...] -> a function of the clip time
const keyed = (spec, def = 0) => {
  const kf = Array.isArray(spec) ? spec : null, base = kf ? 0 : +(spec ?? def);
  return (t) => { if (!kf) return base; if (t <= kf[0][0]) return kf[0][1]; for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) return lerp(kf[i - 1][1], kf[i][1], (t - kf[i - 1][0]) / Math.max(1e-6, kf[i][0] - kf[i - 1][0])); return kf[kf.length - 1][1]; };
};

// elevation (radians on the body) of a height y (floor based) at angle th
const elOfY = (ch, y, th = 0) => { let a = -1.45, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; };
// the front point of the body x metres from the middle at height y (floor based): { pos, normal }
function surfAt(ch, x, y) {
  const sg = x < 0 ? -1 : 1, ax = Math.abs(x); let ph = elOfY(ch, y), m = 0;
  for (let k = 0; k < 3; k++) {
    let a = 0, b = PI / 2;
    for (let i = 0; i < 26; i++) { const t = (a + b) / 2; if (Math.abs(ch.surf(sg * t, ph).pos.x) < ax) a = t; else b = t; }
    m = (a + b) / 2; ph = elOfY(ch, y, sg * m);
  }
  return ch.surf(sg * m, ph);
}
// a point on the garment G at (th, v) and its outward normal
function onG(G, th, v, off) {
  const e = 0.004, p = G.at(th, v, off), a = G.at(th + e, v, off).sub(G.at(th - e, v, off)), b = G.at(th, Math.min(1, v + 0.01), off).sub(G.at(th, Math.max(0, v - 0.01), off)), n = new THREE.Vector3().crossVectors(b, a).normalize();
  if (n.x * p.x + n.z * p.z < 0) n.negate();
  return { p, n };
}
// a flat strip 2 hw wide lying on the garment along the path [{ th, v }, ...] (a trim band), the cloth's own curve
function stripOn(G, path, hw, off, mat) {
  const pos = [], idx = [], P = path.map(({ th, v }) => onG(G, th, v, off));
  P.forEach((q, i) => {
    const T = P[Math.min(P.length - 1, i + 1)].p.clone().sub(P[Math.max(0, i - 1)].p).normalize(), side = new THREE.Vector3().crossVectors(T, q.n).normalize();
    pos.push(...q.p.clone().addScaledVector(side, -hw).toArray(), ...q.p.clone().addScaledVector(side, hw).toArray());
  });
  for (let i = 0; i < P.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, mat, false);
}

// ------------------------------------------------------------------ the robe: a wrap robe with a V, gold edges, a rope belt and a bow
function robe(C, ch, S) {
  const parts = ch.potatoParts, base = S.base, robeC = C.robe || "#f8f5ec", robeSh = C.robeShade || "#e2dccd", trimC = C.trim || "#e8b93a";
  const phY = (y) => elOfY(ch, base + y), hemPh = phY(0.06);
  // the neckline: the V's point at y 0.36 on the chest, rising to the shoulder line (0.52) at the sides and the back; the mouth (0.50) is clear
  const ctl = [[0, 0.36], [0.4, 0.405], [0.75, 0.45], [1.05, 0.485], [1.6, 0.515], [2.3, 0.53], [PI, 0.54]];
  const neckY = (d) => { for (let i = 1; i < ctl.length; i++) if (d <= ctl[i][0]) { const u = (d - ctl[i - 1][0]) / (ctl[i][0] - ctl[i - 1][0]); return lerp(ctl[i - 1][1], ctl[i][1], i === 1 ? u : u * u * (3 - 2 * u)); } return ctl[ctl.length - 1][1]; };
  const dOf = (th) => { const q = ((th % TAU) + TAU) % TAU; return q > PI ? TAU - q : q; };
  const TBL = 720, tbl = Array.from({ length: TBL + 1 }, (_, i) => phY(neckY(dOf((i / TBL) * TAU))));
  const topPh = (th) => { const q = ((((th % TAU) + TAU) % TAU) / TAU) * TBL, i = Math.min(TBL - 1, Math.floor(q)); return lerp(tbl[i], tbl[i + 1], q - i); };
  const NU = 180, NV = 40, lift = 0.02, thick = 0.01;
  const G = garment(ch, { topFn: topPh, top: topPh(0), hem: hemPh, folds: 4, depth: 0.006, flare: 0.04, lift, lift0: lift, wave: 0.004, thick, phase: 0.7, grad: 0.1, segs: NU, rows: NV });
  const m = clothMat(robeC, { side: THREE.DoubleSide, vertexColors: true }); m.emissive = new THREE.Color(robeC); m.emissiveIntensity = 0.12;   // keeps the white white in the look's shadow tint
  parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(robeSh), false)); parts.add(mesh(G.hem, clothMat(robeC, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.0055 }); if (ig) parts.add(inkMesh(ig, robeC, 0.82)); }
  // trim bands 0.035 wide: the collar edge, the wrap edge, the hem
  const tm = gold(trimC), hw = 0.0175, off = thick + 0.004;
  const len = (th) => Math.max(0.05, G.at(th, 0, off).distanceTo(G.at(th, 1, off)));
  { const path = []; for (let i = 0; i <= 200; i++) { const th = (i / 200) * TAU; path.push({ th, v: hw / len(th) }); } parts.add(stripOn(G, path, hw, off, tm)); }
  { const path = [], th1 = -0.62;   // the left panel's edge: from the V's point down to the hem on the right side
    for (let i = 0; i <= 40; i++) { const u = i / 40, th = th1 * u; path.push({ th, v: lerp(hw / len(0), 1 - hw / len(th1), u) }); }
    parts.add(stripOn(G, path, hw, off + 0.001, tm)); }
  { const path = []; for (let i = 0; i <= 200; i++) { const th = (i / 200) * TAU; path.push({ th, v: 1 - hw / len(th) }); } parts.add(stripOn(G, path, hw, off, tm)); }
  // the rope belt at y 0.26: a twisted rope (marks every 0.045) round the robe
  const ph = phY(0.26), vOf = (th) => clamp01((topPh(th) - ph) / (topPh(th) - hemPh)), R = 0.0175, ro = thick + R * 0.8;
  const N = 480, centre = [], Ns = [], Bs = [];
  for (let i = 0; i < N; i++) { const th = (i / N) * TAU, q = onG(G, th, vOf(th), ro); centre.push(q.p); Ns.push(q.n); }
  const Tg = centre.map((p, i) => centre[(i + 1) % N].clone().sub(centre[(i + N - 1) % N]).normalize());
  Tg.forEach((T, i) => Bs.push(new THREE.Vector3().crossVectors(T, Ns[i]).normalize()));
  parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(centre, true), N, R, 10, true), clothMat(C.rope || "#d9a93a", { roughness: 0.75 })));
  { const pts = []; let s = 0; for (let i = 0; i < N * 2; i++) { const k = i / 2, i0 = Math.floor(k) % N, i1 = (i0 + 1) % N, f = k - Math.floor(k);
      const c = centre[i0].clone().lerp(centre[i1], f), n = Ns[i0].clone().lerp(Ns[i1], f).normalize(), b = Bs[i0].clone().lerp(Bs[i1], f).normalize();
      if (i) s += pts[i - 1].c.distanceTo(c);
      const a = TAU * s / 0.045; pts.push({ c, p: c.clone().addScaledVector(n, Math.cos(a) * R).addScaledVector(b, Math.sin(a) * R) }); }
    parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => q.p), true), N * 2, 0.0034, 4, true), clothMat(C.ropeMark || "#b3831f", { roughness: 0.8 }), false)); }
  // the bow at the front a hand left of the middle: a knot, two loops, two hanging ends with tassels (the ends swing)
  { const th0 = 0.1, v0 = vOf(th0), K = onG(G, th0, v0, ro + 0.014), ropeM = clothMat(C.rope || "#d9a93a", { roughness: 0.75 }), tasM = clothMat(C.tassel || "#e8b93a", { roughness: 0.6, side: THREE.DoubleSide });
    const Tx = G.at(th0 + 0.01, v0, ro).sub(G.at(th0 - 0.01, v0, ro)).normalize(), Ux = new THREE.Vector3().crossVectors(K.n, Tx).normalize(); if (Ux.y < 0) Ux.negate();
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), ropeM); knot.scale.set(1.15, 1, 0.85); knot.position.copy(K.p); knot.castShadow = true; knot.lookAt(K.p.clone().add(K.n)); parts.add(knot);
    const bas = (T, U, Nn, c) => new THREE.Matrix4().makeBasis(T, U, Nn).setPosition(c);
    for (const [sg, ang] of [[1, 0.35], [-1, -0.35]]) {
      const X = Tx.clone().multiplyScalar(Math.cos(ang)).addScaledVector(Ux, Math.sin(ang)), Y = Ux.clone().multiplyScalar(Math.cos(ang)).addScaledVector(Tx, -Math.sin(ang)), c = K.p.clone().addScaledVector(Tx, sg * 0.034).addScaledVector(Ux, 0.008).addScaledVector(K.n, 0.004);
      const lg = new THREE.TorusGeometry(0.026, 0.0085, 8, 22); lg.scale(1.2, 1, 1); lg.applyMatrix4(bas(X, Y, K.n, c)); parts.add(mesh(lg, ropeM));
    }
    const ends = new THREE.Group(); parts.add(ends);
    for (const [dir, L] of [[-1, 0.2], [1, 0.16]]) {   // each end follows the robe's surface down and out a little; the last 0.05 is the tassel
      const pts = [K.p.clone().addScaledVector(K.n, -0.004)]; let acc = 0, v = v0, prev = pts[0]; const shaft = L - 0.05;
      while (acc < shaft && v < 0.985) { v += 0.004; const th = th0 + dir * 0.075 * Math.pow(acc / shaft, 0.9), p = G.at(th, v, ro + 0.012); acc += p.distanceTo(prev); prev = p; pts.push(p); }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0095, 6, false); ends.add(mesh(tube, ropeM));
      const e = pts[pts.length - 1], T = e.clone().sub(pts[pts.length - 3]).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), T), mat4 = new THREE.Matrix4().compose(e.clone().addScaledVector(T, 0.024), q, V(1, 1, 1));
      const cone = new THREE.ConeGeometry(0.017, 0.04, 12, 1, true); cone.applyMatrix4(mat4); ends.add(mesh(cone, tasM));   // fringe: wide at its foot, narrow at the cord
      const cap = new THREE.SphereGeometry(0.011, 10, 8); cap.applyMatrix4(new THREE.Matrix4().compose(e.clone().addScaledVector(T, 0.006), q, V(1, 1, 1))); ends.add(mesh(cap, tasM));
      const ring = new THREE.TorusGeometry(0.012, 0.0035, 6, 14); ring.rotateX(PI / 2); ring.applyMatrix4(new THREE.Matrix4().compose(e.clone().addScaledVector(T, 0.014), q, V(1, 1, 1))); ends.add(mesh(ring, tasM, false));
    }
    softFollow(ch, ends, 1.0, { top: K.p.y }); }
  return G;
}

// ------------------------------------------------------------------ sleeves: short bell sleeves, a gold cuff band; the tube follows the arm, rebuilt every frame
function sleeves(ch, mat, bandMat, SL) {
  const slv = {}, bands = {};
  for (const s of ["L", "R"]) {
    slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), mat); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]);
    bands[s] = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.035, 28, 1, true), bandMat); bands[s].castShadow = true; bands[s].visible = false; ch.root.add(bands[s]);
  }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), _t = V(0, 0, 0), R = 24, N = 10;
  const radius = (t) => SL.r0 + (SL.r1 - SL.r0) * t;
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = bands[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength()), T00 = curve.getTangentAt(0), P00 = curve.getPointAt(0), tot = SL.back + SL.len;
      const T0 = curve.getTangentAt(0), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const pos = new Float32Array((N + 1) * (R + 1) * 3), idx = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, sm = -SL.back + tot * t, u = Math.min(0.9, Math.max(0, sm / L)), p = sm < 0 ? P00.clone().addScaledVector(T00, sm) : curve.getPointAt(u), T = sm < 0 ? T00 : curve.getTangentAt(u);
        _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
        const r = radius(t);
        for (let k = 0; k <= R; k++) { const a = (k / R) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k; pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z; }
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const NN = g.attributes.normal; for (let i = 0; i <= N; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
      slv[s].geometry.dispose(); slv[s].geometry = g; slv[s].visible = true;
      const uB = Math.min(0.9, (SL.len - 0.0175) / L); curve.getPointAt(uB, bands[s].position); curve.getTangentAt(uB, _t); bands[s].quaternion.setFromUnitVectors(V(0, 1, 0), _t);
      const rr = SL.r1 + 0.003; bands[s].scale.set(rr, 1, rr); bands[s].visible = true;
    }
  };
}

// ------------------------------------------------------------------ wings: each its own canvas and its own feather jitter
// the planform (a out from the root, b up, metres) is built flat, then bent into a shell: swept by the group, cupped forward at the tip
function wing(C, ch, S, sd) {
  const seed = sd > 0 ? 1 : 2, h = (i, n) => hs(i + seed * 41, n);
  const PRI = [[-4, 0.26], [-19, 0.255], [-34, 0.24], [-48, 0.225], [-61, 0.205]], SEC = [[14, 0.2], [30, 0.205], [46, 0.2], [61, 0.19], [75, 0.175]], COV = [[-50, 0.12], [-30, 0.125], [-8, 0.13], [14, 0.125], [36, 0.12], [58, 0.11]];
  const F = [];   // { pts: [[a, b]] outline, base, tip, layer, ang, rachis }
  const addF = (list, layer, wid, base, i0) => list.forEach(([deg, L0], i) => {
    const ang = (deg + (h(i0 + i, 1) - 0.5) * 6) * PI / 180, L = L0 * (0.97 + 0.06 * h(i0 + i, 2)), W = wid * (0.92 + 0.16 * h(i0 + i, 3)), curl = (h(i0 + i, 4) - 0.5) * 0.14, m = 12, left = [], right = [];
    for (let j = 0; j <= m; j++) { const u = j / m, w = (W / 2) * Math.pow(Math.sin(PI * Math.pow(u, 0.62)), 0.4), cc = curl * L * u * u; left.push([u * L, cc - w]); right.push([u * L, cc + w]); }
    const loc = [...left, ...right.reverse()], ca = Math.cos(ang), sa = Math.sin(ang), bx = base[0] + (layer === 2 ? 0.01 * i : 0), by = base[1];
    F.push({ pts: loc.map(([s, t]) => [bx + s * ca - t * sa, by + s * sa + t * ca]), base: [bx, by], tip: [bx + L * ca - curl * L * sa, by + L * sa + curl * L * ca], layer, ang, L, W, i: i0 + i });
  });
  addF(PRI, 0, 0.095, [0.02, 0], 0); addF(SEC, 1, 0.09, [0.02, 0.01], 10); addF(COV, 2, 0.075, [0.045, 0.005], 20);
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const f of F) for (const [a, b] of f.pts) { a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  const sa_ = 0.32 / (a1 - Math.min(0, a0)), sb_ = 0.46 / (b1 - b0), A0 = Math.min(0, a0) * sa_, B0 = b0 * sb_;   // scale the planform to 0.32 x 0.46 exactly
  for (const f of F) { f.pts = f.pts.map(([a, b]) => [a * sa_, b * sb_]); f.base = [f.base[0] * sa_, f.base[1] * sb_]; f.tip = [f.tip[0] * sa_, f.tip[1] * sb_]; }
  // the wing's own canvas: each feather shaded from the quill end to the tip, a rachis and barbs, outline
  const CW = 512, CH = Math.round(CW * 0.46 / 0.32), pad = 0.004, ext = [0.32 + 2 * pad, 0.46 + 2 * pad];
  const cx = (a) => ((a - A0 + pad) / ext[0]) * CW, cy = (b) => (1 - (b - B0 + pad) / ext[1]) * CH;
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; const g = cv.getContext("2d");
  const light = C.wing || "#fbf8f0", dark = C.wingShade || "#e3dccb", line = C.wingLine || "#cfc6b0";
  g.fillStyle = dark; g.fillRect(0, 0, CW, CH); g.lineJoin = "round"; g.lineCap = "round";
  for (const f of [...F].sort((p, q) => p.layer - q.layer)) {
    g.beginPath(); f.pts.forEach(([a, b], j) => (j ? g.lineTo(cx(a), cy(b)) : g.moveTo(cx(a), cy(b)))); g.closePath();
    const gr = g.createLinearGradient(cx(f.base[0]), cy(f.base[1]), cx(f.tip[0]), cy(f.tip[1])); gr.addColorStop(0, dark); gr.addColorStop(0.5, light); gr.addColorStop(1, light);
    g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = line; g.stroke();
    const ux = (f.tip[0] - f.base[0]), uy = (f.tip[1] - f.base[1]), ul = Math.hypot(ux, uy) || 1, nx = -uy / ul, ny = ux / ul;
    g.strokeStyle = line; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx(f.base[0] + ux * 0.05), cy(f.base[1] + uy * 0.05)); g.lineTo(cx(f.base[0] + ux * 0.92), cy(f.base[1] + uy * 0.92)); g.stroke();
    const nb = 4 + Math.floor(3 * h(f.i, 5)); g.lineWidth = 1.3; g.globalAlpha = 0.75;
    for (let k = 1; k <= nb; k++) for (const sg of [-1, 1]) { const u = 0.2 + 0.68 * (k / (nb + 1)), bl = f.W * 0.34 * (0.7 + 0.4 * h(f.i * 7 + k, 6)) * (1 - 0.3 * u); const bx = f.base[0] + ux * u, by = f.base[1] + uy * u;
      g.beginPath(); g.moveTo(cx(bx), cy(by)); g.lineTo(cx(bx + (nx * sg * 0.8 + ux / ul * 0.5) * bl), cy(by + (ny * sg * 0.8 + uy / ul * 0.5) * bl)); g.stroke(); }
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
  // the feathers: a thin bevelled slab each, three layers 0.012 apart (primaries at the back, coverts in front); uv from the planform
  const geos = [];
  for (const f of F) {
    const sh = new THREE.Shape(f.pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 1 });
    const P = eg.attributes.position, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const a = P.getX(i), b = P.getY(i), z = P.getZ(i) - 0.004 + f.layer * 0.012;
      uv[i * 2] = (a - A0 + pad) / ext[0]; uv[i * 2 + 1] = (b - B0 + pad) / ext[1];
      P.setXYZ(i, sd * a, b, z + 0.35 * a * a);   // x out (mirrored for the left wing), y up from the root pivot, the tip cupped forward
    }
    eg.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); eg.deleteAttribute("normal"); geos.push(eg);
  }
  const mg = mergeGeometries(geos, false);
  if (sd < 0) { const P = mg.attributes.position, U = mg.attributes.uv; for (let i = 0; i < P.count; i += 3) for (const A of [P, U]) { const n = A.itemSize, t = []; for (let c = 0; c < n; c++) { t.push(A.getComponent(i + 1, c)); A.setComponent(i + 1, c, A.getComponent(i + 2, c)); A.setComponent(i + 2, c, t[c]); } } }
  mg.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: "#ffffff", roughness: 0.85, side: THREE.DoubleSide, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.18 });   // lifts the shadow side: the wings stay white behind the body mat.userData.lookRole = "cloth";
  const grp = new THREE.Group(), m = mesh(mg, mat); m.frustumCulled = false; grp.add(m);
  // the group's origin is the root (the planform's pivot); the wing's bottom is at b = B0 (below it), so the wing spans body-local y 0.40..0.86
  grp.position.set(sd * 0.30, S.base + 0.40 - B0, -0.30);
  return { grp, sd };
}
function wings(C, ch, S) {
  const flut = (C.flutter ?? 6) * PI / 180, sweep = 22 * PI / 180, roll = 6 * PI / 180, W = [-1, 1].map((sd) => wing(C, ch, S, sd)), flapAt = keyed(C.flap);
  for (const w of W) ch.potatoParts.add(w.grp);
  return (st, t) => {
    const fl = clamp01(Math.max(flapAt(t), st?.flap || 0, st?.wings || 0));
    for (const { grp, sd } of W) {
      const ph = sd > 0 ? 0 : 1.9, fy = flut * Math.sin(TAU * 0.4 * t + ph);
      grp.rotation.set(0, sd * (sweep - fl * 25 * PI / 180 + fy), sd * (roll + fl * 0.22));
    }
  };
}

// ------------------------------------------------------------------ the halo: a gold ring above the sprout, a soft glow card behind it
function halo(C, ch) {
  const g = new THREE.Group(), tipG = new THREE.Group(), tipDeg = C.haloTip ?? 12;
  const col = C.halo || "#f6c744", ringM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.3, emissive: new THREE.Color(C.haloGlow || "#fff3b0"), emissiveIntensity: 0.6 }); ringM.userData.lookRole = "cloth"; ringM.userData.noOutline = false;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22 - 0.011, 0.011, 12, 56), ringM); ring.rotation.x = -PI / 2; ring.castShadow = false; tipG.add(ring);
  g.add(tipG);
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c2 = cv.getContext("2d"), gr = c2.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,243,176,0.85)"); gr.addColorStop(0.55, "rgba(255,236,150,0.35)"); gr.addColorStop(1, "rgba(255,236,150,0)"); c2.fillStyle = gr; c2.fillRect(0, 0, 128, 128);
  const gt = new THREE.CanvasTexture(cv); gt.colorSpace = THREE.SRGBColorSpace;
  const gm = new THREE.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0.25, depthWrite: false }); gm.userData.noOutline = true;
  const card = new THREE.Mesh(new THREE.CircleGeometry(0.30, 32), gm); card.position.z = -0.02; card.userData.steam = true; card.castShadow = false; g.add(card);
  ch.potatoParts.add(g);
  const y0 = ch.topY() + 0.23, tiltAt = keyed(C.tilt);
  return (st, t) => {
    const ft = st?.ft || { f: 0, s: 0, u: 0 }, tl = clamp01(tiltAt(t) / 20), bob = 0.01 * Math.sin(TAU * 0.5 * t);
    g.position.set(ft.s * 0.25 + 0.03 * tl, y0 + bob + ft.u * 0.05, ft.f * 0.25);
    tipG.rotation.set(tipDeg * PI / 180 + 0.05 * tl, 0, -(tiltAt(t) * PI) / 180 - ft.s * 0.5);
  };
}

// ------------------------------------------------------------------ round gold glasses, worn low (lens centre at standing 0.75), `slip` slides them down the nose
function glasses(C, ch) {
  const gl = new THREE.Group(); let slipAt = () => 0;
  if (C.glasses === false) return { apply: () => {} };
  const rimC = typeof C.glasses === "string" ? C.glasses : "#e8b93a", wire = gold(rimC, 0.3, 0.7), sheen = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide });
  sheen.userData.noOutline = true;
  const Z = V(0, 0, 1), cs = {}, ly = 0.75, lx = 0.115, RR = 0.079;   // rim mid radius 0.079 + tube 0.006 = lens diameter 0.17
  for (const s of [-1, 1]) {
    const q = surfAt(ch, s * lx, ly), n = q.normal.clone(), c = q.pos.clone().addScaledVector(n, 0.03); cs[s] = { c, n };
    const grp = new THREE.Group(); grp.position.copy(c); grp.quaternion.setFromUnitVectors(Z, n); gl.add(grp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.006, 8, 48), wire); ring.castShadow = true; grp.add(ring);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.009), sheen); st.position.set(0.03 * s, -0.04, 0.002); st.rotation.z = 0.75 * s; st.userData.steam = true; st.castShadow = false; grp.add(st);
    // the temple hugs the head: from the rim's outer edge along the skin (0.012 off it) at the lens height round to the side of the head
    const th0 = Math.abs(Math.atan2(q.pos.x + s * (RR + 0.006), q.pos.z)), tp = []; for (let k = 0; k <= 8; k++) { const u = k / 8, th = s * (th0 + 0.3 * u), e = ch.surf(th, elOfY(ch, ly, th)); tp.push(e.pos.clone().addScaledVector(e.normal, lerp(0.012, -0.008, u * u))); }   // 0.08 along the skin, then sunk into it (behind the ear)
    gl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c.clone().add(V(s * (RR + 0.004), 0.002, 0)), ...tp]), 24, 0.0055, 6, false), wire));
  }
  { const a = cs[-1].c.clone().add(V(RR + 0.004, 0.006, 0)), b = cs[1].c.clone().add(V(-(RR + 0.004), 0.006, 0));   // bridge: a small arch between the rims
    gl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(V(0, 0.012, 0.004)), b]), 8, 0.0055, 6, false), wire)); }
  ch.potatoParts.add(gl);
  slipAt = keyed(C.slip);
  return { apply: (st, t) => { gl.position.y = -0.03 * clamp01(Math.max(slipAt(t), st?.slip || 0)); } };
}

// ------------------------------------------------------------------ white slippers with a gold sole band
function slippers(C, ch) {
  const upM = clothMat(C.slipper || "#f8f5ec", { roughness: 0.8 }), soleM = clothMat(C.sole || "#e8b93a", { roughness: 0.6 });
  const outline = (w, l) => { const s = new THREE.Shape(), n = 36; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, c = Math.cos(a), sn = Math.sin(a), x = Math.sign(c) * Math.abs(c) ** 0.8 * (w / 2) * (sn < 0 ? 1 : 0.86), y = Math.sign(sn) * Math.abs(sn) ** 0.8 * (l / 2); (i ? s.lineTo : s.moveTo).call(s, x, y); } s.closePath(); return s; };
  const soleG = new THREE.ExtrudeGeometry(outline(0.16, 0.25), { depth: 0.012, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 10 }); soleG.rotateX(-PI / 2);
  const domeG = new THREE.SphereGeometry(1, 28, 12, 0, TAU, 0, PI / 2);
  for (const s of ["L", "R"]) {
    const f = ch.legs?.[s]?.foot; if (!f) continue;
    const g = new THREE.Group(); g.scale.set(1 / 0.9, 1 / 0.5, 1 / 1.25); g.position.set(0, -0.035 / 0.5, 0);   // undo the foot ball's squash: the floor at the group's origin
    const sole = mesh(soleG, soleM); sole.position.z = 0.01; g.add(sole);
    const dome = mesh(domeG, upM); dome.scale.set(0.075, 0.068, 0.113); dome.position.set(0, 0.013, 0.012); g.add(dome);
    f.add(g);
  }
}

// ------------------------------------------------------------------ skin marks: 7 potato-eye specks and 6 freckles, each placed once by hand (th, ph on the body)
function skinMarks(C, ch) {
  const dimM = new THREE.MeshStandardMaterial({ color: "#c98d47", roughness: 0.9 }), frM = new THREE.MeshStandardMaterial({ color: "#eec07e", roughness: 0.9 }); dimM.userData.noOutline = frM.userData.noOutline = true;
  const D = [[-0.5, 1.0, 0.034, 0.4], [0.85, 0.9, 0.03, -0.3], [-1.45, 0.45, 0.036, 0.7], [1.75, 0.3, 0.032, 0.1], [2.25, 0.95, 0.034, -0.6], [-2.6, 0.6, 0.036, 0.2], [3.0, 0.3, 0.03, 0.9]];
  const F = [[0.12, 1.0, 0.013], [-0.7, 0.88, 0.011], [1.25, 0.65, 0.012], [-1.15, 0.6, 0.014], [2.7, 0.78, 0.012], [-2.0, 0.85, 0.011]];
  const put = (m, th, ph, r, rot, flat) => { const q = ch.surf(th, ph), o = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), m); o.scale.set(r, r * (0.7 + 0.5 * flat), 0.0035); o.position.copy(q.pos).addScaledVector(q.normal, -0.0008); o.lookAt(q.pos.clone().add(q.normal)); o.rotateZ(rot); ch.potatoParts.add(o); };
  D.forEach(([th, ph, r, rot], i) => put(dimM, th, ph, r, rot, hs(i, 40)));
  F.forEach(([th, ph, r], i) => put(frM, th, ph, r, (hs(i, 41) - 0.5) * 3, hs(i, 42)));
}

export function angelKit(C, ch) {
  const S = { base: ch.cy - ch.ry };
  skinMarks(C, ch);
  slippers(C, ch);
  robe(C, ch, S);
  const sl = sleeves(ch, clothMat(C.robe || "#f8f5ec", { side: THREE.DoubleSide }), gold(C.trim || "#e8b93a"), { r0: 0.12, r1: 0.1, len: 0.16, back: 0.05 });
  const wingUp = C.wings === false ? () => {} : wings(C, ch, S), haloUp = halo(C, ch), glassUp = glasses(C, ch);
  return { sl, apply: (st, t) => { wingUp(st, t); haloUp(st, t); glassUp.apply(st, t); } };
}
