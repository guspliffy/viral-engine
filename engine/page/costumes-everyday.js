import * as THREE from "three";
import { band, garment, clothMat, liningMat, foldInk, inkMesh, softFollow, sstep } from "./costumes-art.js";
import { texOf, wash, ribTexture, gridUv, hash2 } from "./costumes-art-cast.js";

// Spud's everyday friends (Jonny, 12 Nov 2026): Chip, Wedge and Mash. No costume, no weapon, no powers: each one is a
// friend type the viewer can tag, told apart by body shape and size (characters/potatobrawl/*.json), ONE garment in one
// colour of its own, the leaf, and one everyday thing. Skin, eyes and face are Spud's (castLook "sheet"). Their
// reference sheets: references/cast/{chip,wedge,mash}-reference-sheet-2026-11-12.png.
//   chip   too much energy: the smallest, a round ball; sunny yellow hoodie, hood down, two white drawstrings; two
//          leaves in a V; white trainers with a red stripe
//   wedge  "trust me": the biggest, broad on top and narrow below, a rounded crown; red bomber jacket with cream ribbed
//          collar, cuffs and hem; sunglasses pushed up on top of his head beside the leaf, never on the forehead
//   mash   never looks up: a tall narrow oval; charcoal hoodie, hood down; big light-blue headphones round the neck;
//          the phone is a prop he is handed in a clip, not part of him
// Spud's rules hold for every piece (Jonny, 11 Nov): each mark drawn once by hand, no repeating pattern; a sleeve ends a
// fixed distance before the hand and carries one twist-free frame; coloured limbs take no ink hull.

const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;

// a painted cloth map: a soft wash of light and dark, and brush or pencil strokes on it, each with its own place,
// length, width and strength (hashed, so the same every render). draw(stroke, h): stroke(x0, y0, x1, y1, w0, w1, val,
// dark) in pixels, h(i, n) a hash for mark i. Wraps in x.
function paintTex(W, H, seed, base, washAmp, draw, swap = false) {
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
  return texOf(buf, W, H, swap);
}
// sweatshirt fleece: short soft flecks, most of them running down the cloth, a third of them pencil-dark
function fleeceTexture(W, H, seed, n, swap = false, pale = false) {   // pale: a light cloth (yellow) takes fainter marks, or it greys
  const k = pale ? 0.55 : 1;
  return paintTex(W, H, seed, pale ? 0.96 : 0.88, pale ? 0.03 : 0.05, (stroke, h) => {
    for (let i = 0; i < n; i++) {
      const x = h(i, 1) * W, y = h(i, 2) * H, len = 7 + 13 * h(i, 3), a = (h(i, 4) - 0.5) * 1.1, w = 1.1 + 1.5 * h(i, 5), dark = h(i, 6) < 0.34;
      stroke(x, y, x + Math.sin(a) * len, y + Math.cos(a) * len, w, w * 0.45, k * (dark ? 0.08 + 0.07 * h(i, 7) : 0.05 + 0.06 * h(i, 7)), dark);
    }
  }, swap);
}
// a bomber jacket's smooth shell: a few long brush strokes of sheen across it and fewer, thinner crease lines
function shellTexture(W, H, seed, n, swap = false) {
  return paintTex(W, H, seed, 0.86, 0.06, (stroke, h) => {
    for (let i = 0; i < n; i++) {
      const x = h(i, 1) * W, y = h(i, 2) * H, len = 50 + 120 * h(i, 3), a = 0.5 + (h(i, 4) - 0.5) * 0.9, dark = h(i, 6) < 0.3, w = dark ? 1 + 0.8 * h(i, 5) : 2.5 + 3.5 * h(i, 5);
      stroke(x, y, x + Math.sin(a) * len, y + Math.cos(a) * len * 0.6, w, w * 0.4, dark ? 0.1 + 0.06 * h(i, 7) : 0.045 + 0.05 * h(i, 7), dark);
    }
  }, swap);
}

// a soft roll lying on the body along a path th0..th1 (a hood folded down, a headphone band, a cord): its centre sits
// r + lift off the skin at elevation ph(th), its section is r(th) thick (off the body) and r * wide(th) broad. Closed at
// both ends when r goes to (almost) nothing there. uv: u along, v round.
function rollOn(ch, o) {
  const NU = o.segs ?? 96, NV = o.radial ?? 14, pts = [], P = (th) => { const ph = o.ph(th), s = ch.surf(th, ph), r = o.r(th); return { c: s.pos.clone().addScaledVector(s.normal, (o.lift ?? 0) + r * (o.sink ?? 1)), n: s.normal, r }; };
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = o.th0 + (o.th1 - o.th0) * (i / NU), a = (j / NV) * Math.PI * 2, q = P(th), T = P(th + 0.01).c.sub(P(th - 0.01).c).normalize();
    const B = new THREE.Vector3().crossVectors(T, q.n).normalize(), wide = o.wide ? o.wide(th) : 1;
    pts.push(q.c.addScaledVector(q.n, Math.cos(a) * q.r).addScaledVector(B, Math.sin(a) * q.r * wide));
  }
  const pos = new Float32Array(pts.length * 3), uv = new Float32Array(pts.length * 2), idx = [];
  pts.forEach((p, k) => { pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; uv[k * 2] = (k % (NU + 1)) / NU; uv[k * 2 + 1] = Math.floor(k / (NU + 1)) / NV; });
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }   // wound so the faces look OUT (the ink hull needs it)
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  { const N = g.attributes.normal; for (let i = 0; i <= NU; i++) { const a = i, b = NV * (NU + 1) + i, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}
// one brush line lying on the body from th0 to th1 at elevation ph(th), `lift(th)` off the skin: thick in the middle, thin at its ends
function rollInk(ch, ph, lift, th0, th1) {
  const n = 60, pts = []; for (let i = 0; i <= n; i++) { const th = th0 + (th1 - th0) * (i / n), q = ch.surf(th, ph(th)); pts.push(q.pos.clone().addScaledVector(q.normal, lift(th))); }
  const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, 120, 0.004, 5, false), P = g.attributes.position, v = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i <= 120; i++) { c.getPointAt(i / 120, q); const k = 0.25 + 0.75 * Math.sin(Math.PI * (i / 120)); for (let j = 0; j <= 5; j++) { const m = i * 6 + j; v.fromBufferAttribute(P, m).sub(q).multiplyScalar(k).add(q); P.setXYZ(m, v.x, v.y, v.z); } }
  return g;
}
// a cord or a strip running DOWN the body at one theta (a zip, a drawstring): from elevation ph0 to ph1, `lift` off the skin
function cordDown(ch, th, ph0, ph1, r, lift, o = {}) {
  const n = 14, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = ch.surf(th + (o.sway ?? 0) * Math.sin(t * 2.6), ph0 + (ph1 - ph0) * t); pts.push(s.pos.clone().addScaledVector(s.normal, lift + (o.hang ?? 0) * t * t)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, r, 8, false); g.userData.end = pts[n]; g.userData.endN = ch.surf(th, ph1).normal;
  return g;
}

// sleeves as Spud's (costumes-art-cast.js spud): a tube along the arm's own curve, rebuilt every frame, ending SL.gap
// metres before the hand's centre, with one frame carried along the arm without twist. Here the cuff is its own piece
// (the last SL.cuffAt..1 of the tube), so it can take another colour and its own ribbing.
function sleeves(ch, armM, cuffM, SL) {
  const slv = {}, cuf = {};
  for (const s of ["L", "R"]) for (const [set, m] of [[slv, armM], [cuf, cuffM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), R = SL.radial ?? 16, N = SL.n ?? 16, NC = Math.max(2, Math.round(N * (1 - SL.cuffAt)));
  const radius = (t) => t < SL.cuffAt ? SL.r0 + (SL.r1 - SL.r0) * (t / SL.cuffAt)
    : (SL.rc + SL.cuff * Math.sin(Math.PI * (t - SL.cuffAt) / (1 - SL.cuffAt))) * (1 - 0.22 * sstep(0.9, 1, t));   // the cuff: a soft ring, its mouth closing in on the wrist
  const tube = (curve, ua, ub, ta, tb, n) => {
    const pos = new Float32Array((n + 1) * (R + 1) * 3), uv = new Float32Array((n + 1) * (R + 1) * 2), idx = [];
    for (let i = 0; i <= n; i++) {
      const t = ta + (tb - ta) * (i / n), u = ua + (ub - ua) * (i / n), p = curve.getPointAt(u), T = curve.getTangentAt(u);
      _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
      const r = radius(t);
      for (let k = 0; k <= R; k++) {
        const a = (k / R) * Math.PI * 2, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k;
        pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z;
        uv[q * 2] = i / n; uv[q * 2 + 1] = k / R;
      }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  };
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = cuf[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength());
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / L)), mid = SL.from + (to - SL.from) * SL.cuffAt;
      const T0 = curve.getTangentAt(SL.from), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const g1 = tube(curve, SL.from, mid, 0, SL.cuffAt, N - NC), g2 = tube(curve, mid, to, SL.cuffAt, 1, NC);   // _n carries on from the sleeve into the cuff
      slv[s].geometry.dispose(); slv[s].geometry = g1; slv[s].visible = true;
      cuf[s].geometry.dispose(); cuf[s].geometry = g2; cuf[s].visible = true;
    }
  };
}

// pale bare hands and no ink hull on coloured limbs, as Spud's; `shoes`: the feet in their own colour with a stripe
// across the instep and a darker sole line (trainers), instead of the legs' colour
function handsAndFeet(C, ch) {
  const pale = C.hands || "#f6dcae";
  if (ch.skinMat) ch.skinMat.color.set(pale);
  if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(pale);
  if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(pale); hm.userData = { ...ch.limbMat.userData };
    for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); }
  if (ch.limbMat) ch.limbMat.userData.noOutline = true;
  if (C.shoes && ch.limbMat) {
    const sm = ch.limbMat.clone(); sm.color.set(C.shoes); sm.userData = { ...ch.limbMat.userData, noOutline: true };
    const stripeM = clothMat(C.stripe || "#b43a23"), soleM = clothMat(C.sole || shade(C.shoes, 0.8));
    for (const s of ["L", "R"]) {
      const f = ch.legs?.[s]?.foot; if (!f) continue; f.material = sm;
      if (C.shoeSize) f.scale.multiplyScalar(C.shoeSize);
      // in the foot's own space (a 0.075 ball flattened by its scale): one stripe over the instep (Chip), a rim round the sole
      if (C.stripe) { const st = new THREE.Mesh(new THREE.TorusGeometry(0.0745, 0.0085, 8, 28, Math.PI), stripeM); st.position.z = 0.012; st.scale.z = 1.5; f.add(st); }
      const so = new THREE.Mesh(new THREE.TorusGeometry(0.071, 0.012, 8, 36), soleM); so.rotation.x = Math.PI / 2; so.position.y = -0.03; f.add(so);
    }
  }
}

// the body of a top: garment() from a neckline (low under the mouth, rising to the back of the head) down to the hem,
// in one painted map that runs once round
function top(ch, C, o) {
  const parts = ch.potatoParts, neck = (th) => o.front + (o.back - o.front) * Math.pow(0.5 * (1 - Math.cos(th)), o.vee ?? 1), NU = 180, NV = 36;   // vee < 1: the neckline dips to a point at the front (a V)
  const G = garment(ch, { topFn: neck, top: o.front, hem: o.hem, folds: o.folds ?? 5, depth: o.depth ?? 0.012, flare: o.flare ?? 0.012, lift: 0.024, lift0: 0.02, wave: 0.005, thick: 0.016, phase: o.phase ?? 0.9, grad: 0.22, segs: NU, rows: NV });
  gridUv(G.outer, NU, NV, (i, j) => { const th = (i / NU) * Math.PI * 2, tp = neck(th); return [i / NU, (tp + (o.hem - tp) * (j / NV) - o.hem) / (Math.max(o.front, o.back) - o.hem)]; });
  const m = clothMat(o.color, { side: THREE.DoubleSide, vertexColors: true }); m.map = o.map;
  parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(o.color, 0.6)), false)); parts.add(mesh(G.hem, clothMat(o.color, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, o.color)); }
  return { G, neck };
}
const BN = 160, BV = 16, bandUv = (g) => gridUv(g, BN, BV, (i, j) => [i / BN, j / BV]);
const ribMat = (color, tex) => { const m = clothMat(color, { side: THREE.DoubleSide }); m.map = tex; return m; };

// ---------- the hoodie (Chip, Mash): hood down, a ribbed hem and cuffs, two drawstrings, a pouch pocket -----------------
function hoodie(C, ch, P) {
  const parts = ch.potatoParts, col = C.hoodie || P.color, seed = P.seed;
  const fleece = fleeceTexture(1024, 512, seed, P.flecks ?? 620, false, P.pale), fleeceArm = fleeceTexture(256, 256, seed + 4.2, Math.round((P.flecks ?? 620) / 7), true, P.pale), rib = ribTexture(60, 1024, 64, seed + 1.9), ribCuff = ribTexture(14, 256, 64, seed + 2.7);
  const { neck } = top(ch, C, { front: P.front, back: P.back, vee: P.vee, hem: P.hem, color: col, map: fleece, folds: P.folds ?? 4, phase: P.phase });
  const fm = () => { const m = clothMat(col, { side: THREE.DoubleSide }); m.map = fleece; return m; };
  // the hood, folded down (their sheets): a thick rolled cowl all round the neck that closes in a V under the chin, and
  // behind the head a folded roll, taller than it is deep, lying against the back
  const open = P.open ?? 0.1, fat = (th) => sstep(0.35, 1, 1 - Math.abs(th - Math.PI) / Math.PI), end = (th) => sstep(0, 0.22, Math.min(th - open, Math.PI * 2 - open - th));
  const cr = (th) => 0.003 + (P.cowlR + (P.hoodR - P.cowlR) * fat(th)) * end(th), cw = (th) => P.cowlWide + (P.hoodWide - P.cowlWide) * fat(th);
  parts.add(mesh(rollOn(ch, { th0: open, th1: Math.PI * 2 - open, ph: (th) => neck(th) - (cr(th) * cw(th) * 0.85) / ch.ry, r: cr, wide: cw, lift: 0.014, sink: 0.85, segs: 140, radial: 16 }), fm()));
  { const ig = rollInk(ch, (th) => neck(th) - (cr(th) * cw(th) * 1.95) / ch.ry, (th) => 0.014 + cr(th) * 0.8, 0.9, Math.PI * 2 - 0.9); if (ig) parts.add(inkMesh(ig, col)); }   // the fold under the roll, one brush line
  // the ribbed hem
  parts.add(mesh(bandUv(band(ch, { ph: P.hem + 0.02, w: 0.034, t: 0.03, lift: 0.02, round: 1, segs: BN })), ribMat(col, rib)));
  // the pouch pocket: a flat patch low on the front, one stitch line along its top (and a rivet at each top corner, Mash)
  { const pw = P.pocketW ?? 0.5, pph = P.hem + (P.pocketUp ?? 0.3), phh = P.pocketH ?? 0.06;
    parts.add(mesh(band(ch, { ph: pph, w: phh, t: 0.007, lift: 0.04, from: -pw, to: pw, round: 0.5, segs: 60 }), fm(), false));
    const line = []; for (let i = 0; i <= 40; i++) { const th = -pw + 0.04 + (2 * pw - 0.08) * (i / 40), q = ch.surf(th, pph + (phh - 0.012) / ch.ry); line.push(q.pos.clone().addScaledVector(q.normal, 0.05)); }
    parts.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line), 40, 0.0028, 5, false), clothMat(shade(col, 0.62))));
    if (P.rivets) for (const sg of [-1, 1]) { const q = ch.surf(sg * (pw - 0.05), pph + (phh - 0.03) / ch.ry), rv = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), new THREE.MeshStandardMaterial({ color: "#b9b2a6", roughness: 0.4, metalness: 0.5 })); rv.position.copy(q.pos).addScaledVector(q.normal, 0.05); parts.add(rv); } }
  // two drawstrings from the opening down the chest, each ending in a small knot; they swing a little with the body
  const cords = new THREE.Group(), cm = clothMat(C.strings || "#fffaf0", { roughness: 0.8 });
  for (const s of [-1, 1]) {
    const g = cordDown(ch, s * (P.cordAt ?? 0.12), P.front - 0.02, P.front - 0.02 - (P.cordLen ?? 0.3) * (s > 0 ? 1 : 0.86), P.cordR ?? 0.008, 0.05, { sway: s * 0.03, hang: 0.012 });
    cords.add(mesh(g, cm));
    const k = new THREE.Mesh(new THREE.SphereGeometry((P.cordR ?? 0.008) * 1.7, 10, 8), cm); k.position.copy(g.userData.end); k.scale.y = 1.5; k.castShadow = true; cords.add(k);
  }
  parts.add(cords); softFollow(ch, cords, 0.9);
  return sleeves(ch, (() => { const m = clothMat(col, { side: THREE.DoubleSide }); m.map = fleeceArm; return m; })(), ribMat(col, ribCuff), { from: 0.04, gap: C.cuffGap ?? P.gap ?? 0.062, r0: P.r0, r1: P.r1, rc: P.r1 * 0.94, cuff: 0.012, cuffAt: 0.8 });
}

// ---------- the bomber jacket (Wedge): a smooth red shell, cream ribbed collar, cuffs and hem, a zip, two flap pockets ---
function bomber(C, ch, P) {
  const parts = ch.potatoParts, col = C.jacket || P.color, cream = C.rib || "#f1e3c2", seed = P.seed;
  const shell = shellTexture(1024, 512, seed, 70), shellArm = shellTexture(256, 256, seed + 3.3, 12, true), rib = ribTexture(64, 1024, 64, seed + 1.1), ribCuff = ribTexture(14, 256, 64, seed + 2.3);
  const { neck } = top(ch, C, { front: P.front, back: P.back, vee: P.vee, hem: P.hem, color: col, map: shell, folds: 4, depth: 0.01, phase: P.phase });
  // the thick ribbed shawl collar: all round the neck and down the two edges of the V to the top of the zip, thinning there;
  // and the ribbed hem that gathers the jacket in
  { const open = 0.05, end = (th) => sstep(0, 0.3, Math.min(th - open, Math.PI * 2 - open - th)), cr = (th) => 0.004 + (P.collarR ?? 0.026) * end(th), cw = () => P.collarWide ?? 2.1;
    parts.add(mesh(rollOn(ch, { th0: open, th1: Math.PI * 2 - open, ph: (th) => neck(th) - (cr(th) * cw() * 0.6) / ch.ry, r: cr, wide: cw, lift: 0.016, sink: 0.8, segs: 140, radial: 14 }), ribMat(cream, ribTexture(70, 1024, 64, seed + 1.1)))); }
  parts.add(mesh(bandUv(band(ch, { ph: P.hem + 0.02, w: 0.04, t: 0.03, lift: 0.018, round: 1, segs: BN })), ribMat(C.hemRib || cream, rib)));
  // the zip down the front: a darker tape with a pale line of teeth, and its pull under the collar
  const zipFrom = P.front - 0.02, zipTo = P.hem + 0.07;
  { const tape = mesh(cordDown(ch, 0, zipFrom, zipTo, 0.011, 0.043), clothMat(C.zipTape || "#ba976a"), false); tape.userData.flat = 0.4; parts.add(tape);
    const teeth = cordDown(ch, 0, zipFrom, zipTo, 0.0045, 0.05); parts.add(mesh(teeth, new THREE.MeshStandardMaterial({ color: C.zip || "#dab48b", roughness: 0.45, metalness: 0.4 }), false));
    const s = ch.surf(0, zipFrom - 0.02), pull = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.034, 0.006), new THREE.MeshStandardMaterial({ color: C.zip || "#dab48b", roughness: 0.4, metalness: 0.5 }));
    pull.position.copy(s.pos).addScaledVector(s.normal, 0.058); pull.lookAt(s.pos.clone().addScaledVector(s.normal, 1)); parts.add(pull); }
  // two slanted flap pockets low on the front, one button each (on his sheet)
  if (P.pockets !== false) for (const s of [-1, 1]) {
    const a = s > 0 ? [0.3, 0.78] : [-0.78, -0.3], pph = P.hem + 0.26, slant = (th) => pph + 0.35 * Math.abs(th);
    parts.add(mesh(band(ch, { ph: pph, tilt: 0.7, w: 0.024, t: 0.007, lift: 0.042, from: a[0], to: a[1], round: 0.5, segs: 40 }), clothMat(shade(col, 0.88)), false));
    const th = s * 0.54, q = ch.surf(th, pph + 0.7 * 0.5 * (1 - Math.cos(th)) - 0.012 / ch.ry), bt = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), clothMat(C.button || "#dfa972", { roughness: 0.6 }));
    bt.position.copy(q.pos).addScaledVector(q.normal, 0.052); parts.add(bt);
  }
  return sleeves(ch, (() => { const m = clothMat(col, { side: THREE.DoubleSide }); m.map = shellArm; return m; })(), ribMat(cream, ribCuff), { from: 0.04, gap: C.cuffGap ?? P.gap ?? 0.066, r0: P.r0, r1: P.r1, rc: P.r1 * 0.86, cuff: 0.012, cuffAt: 0.78 });
}

// sunglasses pushed up onto the crown (Wedge): standing on the head beside the leaf, lenses forward, never on the
// forehead. Two rounded dark lenses, a bridge, two temples running back along the head.
function shades(C, ch, P) {
  const g = new THREE.Group(), lensM = new THREE.MeshStandardMaterial({ color: C.lens || "#57463a", roughness: 0.2, metalness: 0.1 }), frameM = new THREE.MeshStandardMaterial({ color: C.frame || "#2b1b0f", roughness: 0.5 });
  frameM.userData.lookRole = lensM.userData.lookRole = "cloth";
  const lw = P.lens ?? 0.062, lh = lw * 0.5, sh = new THREE.Shape(), r = lh * 0.8;
  sh.moveTo(-lw + r, -lh); sh.lineTo(lw - r, -lh); sh.quadraticCurveTo(lw, -lh, lw, -lh + r); sh.lineTo(lw, lh - r * 0.6); sh.quadraticCurveTo(lw, lh, lw - r * 0.6, lh); sh.lineTo(-lw + r * 0.6, lh); sh.quadraticCurveTo(-lw, lh, -lw, lh - r * 0.6); sh.lineTo(-lw, -lh + r); sh.quadraticCurveTo(-lw, -lh, -lw + r, -lh);
  const lensG = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 8 });
  for (const s of [-1, 1]) {
    const L = new THREE.Mesh(lensG, lensM); L.position.set(s * (lw + 0.012), 0, 0); L.rotation.y = s * 0.16; L.castShadow = true; g.add(L);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(lw * 0.7, 0.008), new THREE.MeshBasicMaterial({ color: "#967b63" })); glint.position.set(s * (lw + 0.012) - lw * 0.2, lh * 0.35, 0.0175); glint.rotation.z = 0.35; g.add(glint);
    const temple = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, P.temple ?? 0.1, 3, 8), frameM); temple.rotation.x = Math.PI / 2; temple.position.set(s * (lw * 2 + 0.016), 0.004, -(P.temple ?? 0.1) / 2 - 0.004); g.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.022, 3, 8), frameM); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, lh * 0.25, 0.008); g.add(bridge);
  // they stand on the crown facing forward and a little up, a touch to one side of the middle, their lower rim on the
  // top line of the head
  const topP = ch.surf(0, Math.PI / 2).pos, k = P.size ?? 1;
  g.scale.setScalar(k);
  g.position.set(topP.x + (P.x ?? 0), topP.y + lh * k * 0.72 + (P.up ?? 0), topP.z + (P.fwd ?? 0.06));
  g.rotation.set(P.tip ?? -0.5, 0, P.roll ?? 0.04);
  ch.potatoParts.add(g);
}

// big headphones round the neck (Mash): the band lies round the back of the neck, the two cups rest on the collarbones,
// cushions toward each other
function headphones(C, ch, P) {
  const parts = ch.potatoParts, col = C.phones || "#8fb1c5", bandM = new THREE.MeshStandardMaterial({ color: C.phoneBand || "#80a2b8", roughness: 0.55 }), cupM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 }), padM = clothMat(C.phonePad || "#66615b", { roughness: 0.9 });
  bandM.userData.lookRole = cupM.userData.lookRole = "cloth";
  const a = P.at ?? 0.62, ph = (th) => P.ph + (P.rise ?? 0.22) * 0.5 * (1 - Math.cos(th));
  parts.add(mesh(rollOn(ch, { th0: a, th1: Math.PI * 2 - a, ph, r: () => 0.013, wide: () => 1.9, lift: P.lift ?? 0.05, segs: 90, radial: 10 }), bandM));
  for (const s of [-1, 1]) {
    const th = s * a, q = ch.surf(th, ph(th)), cup = new THREE.Group(), R = P.cup ?? 0.062;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.9, 0.036, 28), cupM); shell.castShadow = true; cup.add(shell);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(R * 0.78, R * 0.26, 10, 28), padM); pad.rotation.x = Math.PI / 2; pad.position.y = -0.024; cup.add(pad);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.008, 20), new THREE.MeshStandardMaterial({ color: shade(col, 0.8), roughness: 0.4 })); cap.position.y = 0.021; cup.add(cap);
    // the cup lies on the chest, its outside facing out from the body and a little up
    const out = q.normal.clone().add(V(0, 0.25, 0)).normalize();
    cup.quaternion.setFromUnitVectors(V(0, 1, 0), out); cup.position.copy(q.pos).addScaledVector(q.normal, (P.lift ?? 0.05) + 0.02);
    parts.add(cup);
  }
}

// numbers from their sheets (measured 12 Nov 2026), set against Spud's own sheet and his build
const KIT = {
  chip: (C, ch) => hoodie(C, ch, { color: "#ffcf2e", seed: 21.4, front: -0.28, back: 0.25, vee: 0.6, hem: -1.14, cowlR: 0.02, cowlWide: 1.7, hoodR: 0.026, hoodWide: 2.7, r0: 0.062, r1: 0.05, phase: 0.6, cordLen: 0.2, cordR: 0.0085, pocketW: 0.52, pocketH: 0.05, pocketUp: 0.26, flecks: 220, folds: 3, pale: true }),
  mash: (C, ch) => { const sl = hoodie(C, ch, { color: "#7a716c", seed: 33.8, front: -0.16, back: 0.2, vee: 0.7, hem: -1.2, cowlR: 0.022, cowlWide: 1.8, hoodR: 0.05, hoodWide: 2.3, r0: 0.07, r1: 0.054, phase: 1.4, cordLen: 0.2, cordR: 0.006, pocketW: 0.62, pocketH: 0.07, pocketUp: 0.3, rivets: true, flecks: 900 }); headphones(C, ch, { ph: -0.2, rise: 0.46, at: 1.15, cup: 0.078, lift: 0.05 }); return sl; },
  wedge: (C, ch) => { const sl = bomber(C, ch, { color: "#c34732", seed: 12.6, front: -0.3, back: 0.3, vee: 0.6, hem: -1.12, r0: 0.09, r1: 0.066, phase: 0.3 }); shades(C, ch, { size: 2.0, x: 0.04, tip: -0.42, fwd: 0.1, up: -0.035 }); return sl; },
};
export const EVERYDAY = Object.keys(KIT);
export function everyday(C, ch, out) {
  const sl = KIT[C.type](C, ch);
  handsAndFeet(C, ch);
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); };
  out.sitDepth = 0;
  return out;
}
