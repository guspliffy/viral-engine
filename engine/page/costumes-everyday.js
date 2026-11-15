import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { taperedTube } from "./geo.js";
import { band, garment, clothMat, liningMat, foldInk, inkMesh, softFollow, sstep } from "./costumes-art.js";
import { texOf, wash, ribTexture, gridUv, hash2 } from "./costumes-art-cast.js";

// Spud's everyday friends (Jonny, 12 Nov 2026): Chip, Wedge and Mash. No costume, no weapon, no powers: each one is a
// friend type the viewer can tag, told apart by body shape and size (characters/potatobrawl/*.json), ONE garment in one
// colour of its own, the leaf, and one everyday thing. Skin, eyes and face are Spud's (castLook "sheet"). Their
// approved reference sheets (12 Nov 2026) are on Jonny's PC, not in the repo; they were measured there and the numbers
// below and in the character files are those measurements, set against Spud's own sheet and build.
//   chip   too much energy: the smallest, a round ball; sunny yellow hoodie, the hood down as a rolled cowl that closes
//          in a V, two white drawstrings, a pouch pocket; two leaves in a V; brown trousers, white trainers, a red stripe
//   wedge  "trust me": the biggest, broad on top and narrow below, a rounded crown; red bomber jacket with a cream ribbed
//          shawl collar in a deep V to the zip, cream cuffs and hem, two flap pockets; brown sunglasses pushed up on top of
//          his head beside the leaf, never on the forehead; dark brown trousers and boots
//   bathrobe (storyboards/series/what-if/07-fire-rewind, the grumpy neighbour, characters/what-if/grumpy-neighbour.json): a
//          striped lilac wrap robe to the floor, shawl collar, belt and knot, pink fluffy slippers, pink hair curlers on his head
//   mash   never looks up: a tall narrow oval; charcoal hoodie, hood down; big light-blue headphones round the neck;
//          brown trousers, chunky white trainers; the phone is a prop he is handed in a clip, not part of him
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
  for (const s of ["L", "R"]) for (const [set, m] of [[slv, armM], [cuf, cuffM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m.L ? m[s] : m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); }
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
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / L));
      if (SL.cuffLen) SL.cuffAt = Math.max(0.5, Math.min(0.97, 1 - SL.cuffLen / (L * (to - SL.from))));   // SL.cuffLen: the cuff is this many metres long, whatever the arm
      const mid = SL.from + (to - SL.from) * SL.cuffAt;
      const T0 = curve.getTangentAt(SL.from), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const g1 = tube(curve, SL.from, mid, 0, SL.cuffAt, N - NC), g2 = tube(curve, mid, to, SL.cuffAt, 1, NC);   // _n carries on from the sleeve into the cuff
      slv[s].geometry.dispose(); slv[s].geometry = g1; slv[s].visible = true;
      cuf[s].geometry.dispose(); cuf[s].geometry = g2; cuf[s].visible = true;
      if (SL.hook) SL.hook(s, curve, L, to, _n, _b);   // (garters, a watch): the arm's curve, its length, where the sleeve ends and the end frame
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
  const parts = ch.potatoParts, neck = o.neckFn || ((th) => o.front + (o.back - o.front) * Math.pow(0.5 * (1 - Math.cos(th)), o.vee ?? 1)), NU = 180, NV = 36;   // vee < 1: the neckline dips to a point at the front (a V)
  const G = garment(ch, { topFn: neck, top: o.front, hem: o.hem, folds: o.folds ?? 5, depth: o.depth ?? 0.012, flare: o.flare ?? 0.012, lift: o.lift ?? 0.024, lift0: o.lift0 ?? 0.02, wave: 0.005, thick: 0.016, phase: o.phase ?? 0.9, grad: 0.22, segs: NU, rows: NV });
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

// ---------- the bathrobe (the grumpy neighbour, "There's a catch" EP07, DESIGN.md 4.2) --------------------------------------
// A striped wrap robe that hangs from the shoulders as a bell to 0.06 m above the floor (the garment() kit on a body that is the
// potato down to the belt and a flared skirt below it), a rolled shawl collar crossing left over right with a trim band down the
// front, a belt with a knot and two ends, striped sleeves with a turned cuff; pink fluffy slippers over the feet; eight pink
// curlers on top of the head (the sprout hides under them); two short lines under each eye. C: robe, stripe, collar, belt,
// slippers, curler, curlerLine, hair (the grey wisp), lines (under-eye colour), hands. Nothing here moves with the face.

// the potato down to ph phJ, below it a bell skirt to height yHem (floor 0): one surface for garment(); ph runs on to phEnd
function robeSurface(ch, phJ, phEnd, yHem, flare) {
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
// a flat ribbon lying on a surface along path(t) -> [th, ph], w wide, `lift` off the cloth (a trim band down the front)
function ribbonOn(surf, path, w, lift, n = 30) {
  const pos = [], idx = [], P = [], N = [];
  for (let i = 0; i <= n; i++) { const [th, ph] = path(i / n), q = surf.surf(th, ph); P.push(q.pos.clone().addScaledVector(q.normal, lift)); N.push(q.normal); }
  for (let i = 0; i <= n; i++) {
    const d = P[Math.min(n, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize(), sd = d.cross(N[i]).normalize();
    const wi = typeof w === "function" ? w(i / n) : w;
    for (const k of [-1, 1]) { const q = P[i].clone().addScaledVector(sd, k * wi / 2); pos.push(q.x, q.y, q.z); }
  }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the robe's cloth: vertical stripes `sw` m wide every `pitch` m round a body `circ` m round (each a hair different, by hash), a soft
// wash and a few fibre flecks; `across`: the stripes run along the map's width instead (a sleeve: u runs along the arm)
function robeTex(base, stripe, circ, pitch, sw, seed, across = false) {
  const W = 1024, H = across ? 256 : 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), n = Math.round(circ / pitch), len = across ? H : W, pi = len / n;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.fillStyle = stripe;
  for (let i = 0; i < n; i++) {
    const x = i * pi + pi * 0.5 - (pi * sw / pitch) / 2 + (hash2(i * 1.7 + seed, 3.3) - 0.5) * pi * 0.05, w = (pi * sw / pitch) * (0.93 + 0.14 * hash2(i * 2.9 + seed, 1.1));
    if (across) g.fillRect(0, x, W, w); else g.fillRect(x, 0, w, H);
  }
  for (let i = 0; i < 520; i++) { const x = hash2(i * 3.1 + seed, 1.3) * W, y = hash2(i * 1.9 + seed, 7.7) * H, dark = hash2(i, seed) < 0.45; g.fillStyle = dark ? `rgba(40,20,60,${0.04 + 0.07 * hash2(i, 4.4)})` : `rgba(255,240,255,${0.04 + 0.07 * hash2(i, 5.5)})`; g.fillRect(x, y, across ? 5 + 9 * hash2(i, 6.1) : 1.5, across ? 1.5 : 5 + 9 * hash2(i, 6.1)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function robe(C, ch, P) {
  const parts = ch.potatoParts, col = C.robe || P.color, stripe = C.stripe || P.stripe, collar = C.collar || P.collar, beltC = C.belt || P.beltC;
  const phJ = P.phBelt, phEnd = -1.5, hyb = robeSurface(ch, phJ, phEnd, P.hem, P.flare);
  const neck = (th) => P.front + (P.back - P.front) * Math.pow(0.5 * (1 - Math.cos(th)), P.vee), NU = 180, NV = 40;
  const G = garment(hyb, { topFn: neck, top: P.front, hem: phEnd, folds: 6, depth: 0.011, flare: 0.012, lift: 0.024, lift0: 0.02, wave: 0.004, thick: 0.016, phase: P.phase, grad: 0.2, segs: NU, rows: NV, liftRamp: 0.1 });
  gridUv(G.outer, NU, NV, (i) => [i / NU, 0.5]);
  const body = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); body.map = robeTex(col, stripe, P.circ, 0.08, 0.035, P.seed);
  parts.add(mesh(G.outer, body)); parts.add(mesh(G.inner, liningMat(shade(col, 0.6)), false)); parts.add(mesh(G.hem, clothMat(col, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, col)); }
  const cm = () => clothMat(collar, { side: THREE.DoubleSide });
  // the shawl collar: a rolled band all round the neck line, closing in the V; thick at the back and shoulders, thinning toward the belt
  const open = 0.06, fat = (th) => sstep(0.3, 1, 1 - Math.abs(th - Math.PI) / Math.PI), end = (th) => sstep(0, 0.2, Math.min(th - open, Math.PI * 2 - open - th));
  const cr = (th) => 0.004 + (0.016 + 0.014 * fat(th)) * end(th), cw = (th) => 1.9 + 0.8 * fat(th);
  parts.add(mesh(rollOn(ch, { th0: open, th1: Math.PI * 2 - open, ph: (th) => neck(th) - (cr(th) * cw(th) * 0.85) / ch.ry, r: cr, wide: cw, lift: 0.016, sink: 0.85, segs: 140, radial: 14 }), cm()));
  // left over right: the trim band down the front edge of the lapping (left, +x) panel, from the V's point across the belt to the hem
  const lap = mesh(ribbonOn(hyb, (t) => [-0.6 * t * t, P.front + t * (-1.4 - P.front)], 0.052, 0.04), cm(), false);
  parts.add(lap);
  // the belt, its knot and two ends
  parts.add(mesh(band(hyb, { ph: phJ, w: 0.024, t: 0.018, lift: 0.04, round: 0.55, segs: 120 }), clothMat(beltC, { side: THREE.DoubleSide })));
  const bm = clothMat(beltC, { roughness: 0.85 }), kq = hyb.surf(0.1, phJ), knot = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), bm);
  knot.position.copy(kq.pos).addScaledVector(kq.normal, 0.062); knot.scale.set(1.15, 0.9, 0.8); knot.lookAt(kq.pos.clone().addScaledVector(kq.normal, 1)); knot.castShadow = true; parts.add(knot);
  const ends = new THREE.Group();
  for (const s of [-1, 1]) {
    const g = cordDown(hyb, 0.1 + s * 0.05, phJ - 0.05, phJ - 0.05 - 0.4, 0.013, 0.058, { sway: s * 0.02, hang: 0.01 }), e = mesh(g, bm); e.userData.flat = 0.4; ends.add(e);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0145, 8, 6), bm); tip.position.copy(g.userData.end); tip.scale.y = 1.3; ends.add(tip);
  }
  parts.add(ends); softFollow(ch, ends, 0.9);
  slippers(C, ch, P); curlers(C, ch, P); tiredEyes(C, ch);
  const arm = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, side: THREE.DoubleSide }); arm.userData.lookRole = "cloth"; arm.map = robeTex(col, stripe, 0.4, 0.08, 0.035, P.seed + 5, true);
  return sleeves(ch, arm, clothMat(collar, { side: THREE.DoubleSide }), { from: 0.04, gap: C.cuffGap ?? P.gap ?? 0.062, r0: P.r0, r1: P.r1, rc: P.r1 * 0.95, cuff: 0.012, cuffAt: 0.8 });
}

// pink fluffy slippers over the feet (children of each foot, so they take its step, roll and turn): a round slipper body and a
// ring of soft tufts round the ankle and across the toe
function slippers(C, ch, P) {
  const col = C.slippers || "#e9a9bd", fluff = shade(col, 1.07), bodyM = clothMat(col, { roughness: 1 }), fluffM = clothMat(fluff, { roughness: 1 }), inkM = clothMat(shade(col, 0.72), { roughness: 1 });
  for (const m of [bodyM, fluffM, inkM]) m.userData.noOutline = true;
  const tuft = new THREE.SphereGeometry(0.019, 8, 6);
  for (const s of ["L", "R"]) {
    const f = ch.legs?.[s]?.foot; if (!f) continue;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 22, 14), bodyM); b.scale.set(1, 1, 1.02); b.castShadow = true; f.add(b);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, t = new THREE.Mesh(tuft, fluffM); t.position.set(Math.cos(a) * 0.062, 0.058, -0.012 + Math.sin(a) * 0.052); t.scale.set(1, 1.15, 1); f.add(t); }
    for (let i = 0; i < 7; i++) { const a = -0.95 + (i / 6) * 1.9, t = new THREE.Mesh(tuft, fluffM); t.position.set(Math.sin(a) * 0.066, 0.036 + 0.018 * Math.cos(a), 0.052 + Math.cos(a) * 0.02); t.scale.set(0.95, 1.05, 0.95); f.add(t); }
    const so = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.01, 8, 30), inkM); so.rotation.x = Math.PI / 2; so.position.y = -0.03; f.add(so);   // a darker sole line
  }
}

// eight rollers in two rows of four across the top of the head, their axes along x, lying on the head's curve; each with three
// darker ring lines, a dark clip dot on its outer side and a wisp of grey hair wrapped round it (a paler stripe)
function curlers(C, ch, P) {
  const R = P.curlerR ?? 0.032, L = P.curlerL ?? 0.075, pink = C.curler || "#e58fb0", line = C.curlerLine || "#c76a93", grey = C.hair || "#b9b3ad";
  const pm = clothMat(pink, { roughness: 0.55 }), lm = clothMat(line, { roughness: 0.6 }), gm = clothMat(grey, { roughness: 0.9 }), dm = clothMat("#4a2a38", { roughness: 0.5 });
  const cyl = new THREE.CylinderGeometry(R, R, L, 20, 1), capG = new THREE.SphereGeometry(R, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), ringG = new THREE.TorusGeometry(R + 0.0008, 0.0032, 6, 20), wispG = new THREE.TorusGeometry(R + 0.002, 0.0052, 6, 20), clipG = new THREE.SphereGeometry(0.0072, 8, 6);
  const at = (xi, al) => { const d = V(xi / ch.rx, Math.cos(al), Math.sin(al)).normalize(); return ch.surf(Math.atan2(d.x, d.z), Math.asin(d.y)); };
  const Y = V(0, 1, 0), grp = new THREE.Group();
  P.rows.forEach((al, r) => {
    for (let i = 0; i < 4; i++) {
      const xi = (i - 1.5) * (L + 0.004), q = at(xi, al), a = at(xi + 0.01, al).pos.sub(at(xi - 0.01, al).pos).normalize(), n = q.normal.clone().addScaledVector(a, -q.normal.dot(a)).normalize();
      const x = new THREE.Vector3().crossVectors(a, n).normalize(), g = new THREE.Group(), cu = new THREE.Mesh(cyl, pm); cu.castShadow = true; g.add(cu);
      for (const sg of [-1, 1]) { const cp = new THREE.Mesh(capG, pm); cp.scale.set(1, 0.18, 1); cp.position.y = sg * L / 2; if (sg < 0) cp.rotation.x = Math.PI; g.add(cp); }
      for (const dy of [-0.022, 0, 0.022]) { const rg = new THREE.Mesh(ringG, lm); rg.rotation.x = Math.PI / 2; rg.position.y = dy; g.add(rg); }
      const w = new THREE.Mesh(wispG, gm); w.rotation.set(Math.PI / 2 + 0.38, 0, 0.12 * (i % 2 ? 1 : -1)); w.position.y = 0.012 * (i % 2 ? -1 : 1); g.add(w);
      const cl = new THREE.Mesh(clipG, dm); cl.position.set(0, 0.0, R + 0.002); cl.scale.set(1, 1.7, 0.55); g.add(cl);
      g.matrixAutoUpdate = false; g.matrix.makeBasis(x, a, n); g.matrix.setPosition(q.pos.clone().addScaledVector(n, R + 0.003)); grp.add(g);
    }
  });
  ch.potatoParts.add(grp);
}

// two short lines under each eye (a tired old face), lying on the skin where the face puts its eyes
function tiredEyes(C, ch) {
  const pl = ch.face?.place; if (!pl) return;
  const m = clothMat(C.lines || "#a8743c", { roughness: 0.8 });
  for (const s of [-1, 1]) for (const [a, b] of [[[0.25, 0.07], [0.36, 0.045]], [[0.29, 0.0], [0.38, -0.02]]]) {
    const p0 = pl(s * a[0], a[1]), p1 = pl(s * b[0], b[1]), pts = [p0.pos.clone().addScaledVector(p0.normal, 0.002), p1.pos.clone().addScaledVector(p1.normal, 0.002)];
    parts_add(ch, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([pts[0], pts[0].clone().lerp(pts[1], 0.5).addScaledVector(p0.normal, 0.001), pts[1]]), 6, 0.0026, 5, false), m));
  }
}
const parts_add = (ch, o) => ch.potatoParts.add(o);

// ---------- the rich couple and the teller (Happiness 01 "Does money make you happy?", draft 2, 15 Nov 2026; DESIGN.md 11.2, 11.3) -------
// costume types (characters/potatobrawl/duchess.json, dauphin.json, tot.json, rosti.json; the names are Jonny's to change):
//   duchess  raspberry dress with a bell skirt to y 0.09, a white fur stole round the shoulders (open at the front, its two ends
//            hanging to y 0.20 / 0.26) with seven ermine ticks, a string of 19 pearls on the chest, a cream straw sun hat (crown r 0.17,
//            brim to r 0.38 in three waves, tipped back 16 degrees, a pink ribbon, three roses; her leaf comes up through a 0.05 hole).
//   dauphin  double-breasted navy velvet blazer (a V to y 0.30, hem y 0.14, a sheen band on the shoulders and the outer sleeves, four gold
//            buttons), dark lapel roll, gold ascot, white pocket square on the left chest, 0.02 of white cuff past each sleeve, a gold watch
//            on the LEFT wrist (key: the glint is a 4-point star on a 0.9 s period). Under the blazer a white shirt shows in the V.
//   teller   Tot and Rosti. White shirt, sleeves ending 0.09 before the hand's centre. costume.vest "#hex" | false (a V from y 0.34, hem
//            y 0.13, 3 brass buttons), costume.tie "#hex" | false (short, burgundy), costume.glasses "#hex" | false (round brass wire, lenses
//            r 0.085, glass at 0.08 white = steam; key `slip` 0..1 slides them 0.02 down; drive it with the `wings` action until the timeline has its own), costume.garters false turns the black sleeve
//            garters off. Rosti = teller with all four off, on a taller body, wearing the props `apron` and `paperhat` (see rosti.json).
// Each mark is drawn once by hand (hashed, no tile); sleeves end a fixed distance before the hand (the glove stays free).
const PI = Math.PI, TAU = Math.PI * 2, clamp01 = (x) => Math.max(0, Math.min(1, x));
const H2 = (a, b = 0) => hash2(a * 1.7 + 11.3, b * 2.3 + 5.1);
// the elevation at which the body surface (meridian th) is y metres above the floor
const elOfY = (ch, y, th = 0, lo = -1.45) => { let a = lo, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; };
// the point of the front (or back) of the body at x, y metres: { th, ph, pos, normal }
function surfAt(ch, x, y, back = false) {
  const sg = x < 0 ? -1 : 1, ax = Math.abs(x);
  let ph = elOfY(ch, y), m = 0;
  for (let k = 0; k < 3; k++) {
    let a = 0, b = PI / 2;
    for (let i = 0; i < 26; i++) { const t = (a + b) / 2; if (Math.abs(ch.surf(sg * t, ph).pos.x) < ax) a = t; else b = t; }
    m = (a + b) / 2; ph = elOfY(ch, y, back ? sg * (PI - m) : sg * m);
  }
  const th = back ? sg * (PI - m) : sg * m, q = ch.surf(th, ph);
  return { th, ph, pos: q.pos, normal: q.normal };
}
// a painted colour map (canvas), row 0 = v 0 (like the cast's data maps)
function colorTex(W, H, draw) {
  const c = document.createElement("canvas"); c.width = W; c.height = H; draw(c.getContext("2d"), W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// short soft strokes lying along the cloth (a velvet's nap): n strokes, each its own place, length, width and strength
function napStrokes(g, W, H, seed, n, light, dark, across = false) {
  for (let i = 0; i < n; i++) {
    const x = H2(i, seed) * W, y = H2(i, seed + 1.3) * H, len = 6 + 16 * H2(i, seed + 2.1), a = (H2(i, seed + 3.7) - 0.5) * 0.7, w = 1.2 + 2.2 * H2(i, seed + 4.9), dk = H2(i, seed + 5.5) < 0.45;
    g.strokeStyle = dk ? dark : light; g.globalAlpha = (dk ? 0.1 : 0.07) + 0.08 * H2(i, seed + 6.3); g.lineWidth = w; g.lineCap = "round";
    g.beginPath(); if (across) { g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); } else { g.moveTo(x, y); g.lineTo(x + Math.sin(a) * len, y + Math.cos(a) * len); } g.stroke();
  }
  g.globalAlpha = 1;
}
const metal = (c, r = 0.32, m = 0.75) => { const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); x.userData.lookRole = "cloth"; x.userData.noOutline = true; return x; };
// glass and light: see-through, never counted by the contact checks
const steam = (o) => { o.userData.steam = true; o.castShadow = false; return o; };

// a collar roll round the neckline in the garment's own colour (a shirt's collar, a hood's cowl), thinning to nothing at the V
function collarRoll(ch, neck, col, r0, wide = 1.3, open = 0.08) {
  const end = (th) => sstep(0, 0.25, Math.min(th - open, TAU - open - th)), cr = (th) => 0.004 + r0 * end(th);
  return mesh(rollOn(ch, { th0: open, th1: TAU - open, ph: (th) => neck(th) - (cr(th) * wide * 0.6) / ch.ry, r: cr, wide: () => wide, lift: 0.016, sink: 0.8, segs: 140, radial: 12 }), clothMat(col, { side: THREE.DoubleSide }));
}
// a round button / ball on the cloth at (th, ph), `off` from the skin
function studAt(ch, th, ph, off, r, m, sq = 0.6) {
  const q = ch.surf(th, ph), s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); s.position.copy(q.pos).addScaledVector(q.normal, off); s.scale.set(1, 1, sq); s.lookAt(q.pos.clone().addScaledVector(q.normal, 2)); s.castShadow = true; return s;
}

// ---------- the teller (Tot, Rosti): shirt, vest, tie, garters, round glasses ---------------------------------------------------
function teller(C, ch, P) {
  const parts = ch.potatoParts, seed = P.seed, shirt = C.shirt || "#fbf8f1", vestC = C.vest === false ? null : C.vest || "#2f5d44", tieC = C.tie === false ? null : C.tie || "#7a2f2a";
  const glassC = C.glasses === false ? null : C.glasses || "#c9a24a", garters = C.garters !== false && !!vestC;
  const body = fleeceTexture(1024, 512, seed, 150, false, true), arm = fleeceTexture(256, 256, seed + 4.2, 22, true, true), cuffT = ribTexture(14, 256, 64, seed + 2.7);
  const { neck } = top(ch, C, { front: -0.3, back: 0.22, vee: 0.7, hem: -1.18, color: shirt, map: body, folds: 3, depth: 0.008, phase: 0.5 });
  parts.add(collarRoll(ch, neck, shirt, 0.013));
  if (vestC) {   // the waistcoat: a V from y 0.34, hem at y 0.13 (the underside of the belly), armholes cut at the sides, 3 brass buttons
    const fV = elOfY(ch, 0.34), hV = Math.max(-1.3, elOfY(ch, 0.13)), vNeck = (th) => fV + (0.3 - fV) * Math.pow(0.5 * (1 - Math.cos(th)), 0.6) - 0.3 * Math.exp(-(((Math.abs(th) - 1.4) / 0.36) ** 2));
    top(ch, C, { neckFn: vNeck, front: fV, back: 0.3, hem: hV, color: vestC, map: shellTexture(1024, 512, seed + 9, 50), folds: 3, depth: 0.007, phase: 1.1, lift: 0.042, lift0: 0.034 });
    const brass = metal("#c9a24a", 0.3, 0.7);
    for (let k = 0; k < 3; k++) parts.add(studAt(ch, 0, fV - 0.16 - 0.17 * k, 0.07 + 0.01 * k, 0.014, brass));
  }
  if (tieC) {   // a short tie from the collar into the vest, wider at its end
    const tm = clothMat(tieC, { side: THREE.DoubleSide }), fV = elOfY(ch, 0.34);
    parts.add(mesh(ribbonOn(ch, (t) => [0, -0.3 - 0.36 * t], (t) => 0.024 + 0.022 * t, 0.046, 14), tm, false));
    parts.add(studAt(ch, 0, -0.3, 0.05, 0.02, tm, 0.7));
  }
  // round glasses: brass wire r 0.004, lenses r 0.085, 0.012 in front of the eye bulbs; glass 0.08 white; key `slip` slides them down 0.02
  const gl = new THREE.Group();
  if (glassC && ch.face?.place) {
    const L = ch.face.layout, wire = metal(glassC, 0.3, 0.7), glass = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.1, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide });
    glass.userData.lookRole = "cloth"; glass.userData.noOutline = true;
    const Z = V(0, 0, 1), pts = [];
    for (const s of [-1, 1]) {
      const p = ch.face.place(s * L.eyeU, L.eyeV), n = p.normal.clone(), c = p.pos.clone().addScaledVector(n, 0.022); pts[s] = { c, n };
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.004, 8, 44), wire); ring.position.copy(c); ring.quaternion.setFromUnitVectors(Z, n); gl.add(ring);
      const pane = steam(new THREE.Mesh(new THREE.CircleGeometry(0.085, 28), glass)); pane.position.copy(c).addScaledVector(n, 0.001); pane.quaternion.setFromUnitVectors(Z, n); gl.add(pane);
      const side = ch.surf(s * 1.3, ch.face.layout.eyeV * 0.55 - 0.05).pos, a0 = c.clone().add(V(s * 0.085, 0, 0)), temple = new THREE.CatmullRomCurve3([a0, a0.clone().add(V(s * 0.012, 0, -0.06)), V(side.x * 1.0, c.y, side.z + 0.03).addScaledVector(V(s, 0, 0), 0.012)]);
      gl.add(new THREE.Mesh(new THREE.TubeGeometry(temple, 12, 0.004, 6, false), wire));
    }
    const a = pts[-1].c.clone().add(V(0.085, 0.004, 0)), b = pts[1].c.clone().add(V(-0.085, 0.004, 0));
    gl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(V(0, 0.012, 0.004)), b]), 8, 0.004, 6, false), wire));
    parts.add(gl);
  }
  // black garters 0.018 wide round each upper sleeve, riding the sleeve every frame
  const gar = garters ? [0, 1].map(() => { const g = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.018, 20, 1, true), clothMat("#1b1a20", { side: THREE.DoubleSide, roughness: 0.7 })); g.castShadow = false; g.visible = false; ch.root.add(g); return g; }) : [];
  const _q = new THREE.Quaternion(), _T = V(0, 0, 0), SLV = { from: 0.04, gap: C.cuffGap ?? 0.09, r0: P.r0 ?? 0.068, r1: P.r1 ?? 0.052, rc: (P.r1 ?? 0.052) * 0.94, cuff: 0.009, cuffAt: 0.84 };
  SLV.hook = (s, curve, L, to) => {
    const g = gar[s === "L" ? 0 : 1]; if (!g) return;
    const u = SLV.from + (to - SLV.from) * 0.3; curve.getPointAt(u, g.position); curve.getTangentAt(u, _T);
    g.quaternion.setFromUnitVectors(V(0, 1, 0), _T); const R = SLV.r0 + (SLV.r1 - SLV.r0) * (0.3 / SLV.cuffAt) + 0.006; g.scale.set(R, 1, R); g.visible = true;
  };
  const sl = sleeves(ch, (() => { const m = clothMat(shirt, { side: THREE.DoubleSide }); m.map = arm; return m; })(), ribMat(shirt, cuffT), SLV);
  return { sl, apply: (st) => { gl.position.y = -0.02 * clamp01(st.slip ?? st.wings ?? 0); } };   // slip: driven with the `wings` action ({ do: "wings", to }) until the timeline has its own key, as Spud's spread
}

// ---------- the duchess: raspberry dress, white fur stole, pearls, cream sun hat -----------------------------------------------
const LD = V(0.3, 0.8, 0.5).normalize(), lobeProto = new THREE.SphereGeometry(1, 6, 4);
// a soft fur clump: a flattened ball lying on the cloth (T its long axis, n up from the cloth), a lit or a shade tone by how it faces the light
function lobeGeo(c, T, n, B, a, b, cc, yaw, tones, h) {
  const g = lobeProto.clone(), X = T.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(B, Math.sin(yaw)).normalize(), Z = new THREE.Vector3().crossVectors(X, n).normalize(), Y = new THREE.Vector3().crossVectors(Z, X).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(X.multiplyScalar(a), Y.multiplyScalar(b), Z.multiplyScalar(cc)).setPosition(c)); g.deleteAttribute("uv");
  const N = g.attributes.normal, col = new Float32Array(N.count * 3), tmp = new THREE.Color();
  for (let i = 0; i < N.count; i++) { const lam = N.getX(i) * LD.x + N.getY(i) * LD.y + N.getZ(i) * LD.z, k = 0.5 - 0.5 * lam + (h - 0.5) * 0.35; tmp.copy(tones[k < 0.42 ? 0 : k < 0.64 ? 1 : 2]); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); return g;
}
function duchess(C, ch, P) {
  const parts = ch.potatoParts, seed = P.seed, dressC = C.dress || "#b8336a", stoleC = C.stole || "#fbf8f1", hatC = C.hat || "#fbf6ea", ribC = C.ribbon || "#e86a9a";
  // the dress: a fitted bodice and a bell skirt to y 0.09 (the bathrobe's hybrid surface: the body down to the waist, a flare below)
  const phJ = -0.62, phEnd = -1.5, hyb = robeSurface(ch, phJ, phEnd, 0.09, 1.3), NU = 120, NV = 30;
  const neckD = (th) => -0.3 + 0.55 * Math.pow(0.5 * (1 - Math.cos(th)), 0.8);
  const G = garment(hyb, { topFn: neckD, top: -0.3, hem: phEnd, folds: 6, depth: 0.011, flare: 0.012, lift: 0.024, lift0: 0.02, wave: 0.004, thick: 0.016, phase: 0.8, grad: 0.2, segs: NU, rows: NV, liftRamp: 0.1 });
  gridUv(G.outer, NU, NV, (i, j) => [i / NU, 1 - j / NV]);
  const dm = clothMat(dressC, { side: THREE.DoubleSide, vertexColors: true }); dm.map = shellTexture(1024, 512, seed, 70);
  parts.add(mesh(G.outer, dm)); parts.add(mesh(G.inner, liningMat(shade(dressC, 0.6)), false)); parts.add(mesh(G.hem, clothMat(dressC, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, dressC)); }
  parts.add(mesh(band(hyb, { ph: phJ, w: 0.02, t: 0.014, lift: 0.042, round: 0.55, segs: 120 }), clothMat(shade(dressC, 0.7), { side: THREE.DoubleSide }), false));   // a sash at the waist
  // ---- the stole: a roll r 0.075 round the shoulders, centre y 0.47 behind, 0.31 in front, open at the front; its two ends hang to y 0.20 (left, +x) and 0.26
  const R = 0.075, TH0 = 0.5, yS = (th) => 0.31 + 0.08 * (1 - Math.cos(th)), phS = (th) => elOfY(ch, yS(th), th);
  const cenAt = (th, ph, r) => { const q = ch.surf(th, ph); return { c: q.pos.clone().addScaledVector(q.normal, 0.034 + r * 0.85), n: q.normal }; };
  const tones = [stoleC, "#e8e6ee", "#c3c8d8"].map((c) => new THREE.Color(c)), lobes = [], tickAt = [];
  parts.add(mesh(rollOn(ch, { th0: TH0, th1: TAU - TH0, ph: phS, r: () => R, wide: () => 1, lift: 0.034, sink: 0.85, segs: 90, radial: 12 }), clothMat("#e6e5ec", { side: THREE.DoubleSide })));
  const fr = (th) => { const a = cenAt(th - 0.01, phS(th - 0.01), R).c, b = cenAt(th + 0.01, phS(th + 0.01), R).c, q = cenAt(th, phS(th), R), T = b.sub(a).normalize(); return { c: q.c, n: q.n, T, B: new THREE.Vector3().crossVectors(T, q.n).normalize() }; };
  const NM = 66;
  for (let i = 0; i < NM; i++) {
    const row = i % 3, th = TH0 + (TAU - 2 * TH0) * (((i - row) / 3 + 0.5 + (row === 1 ? 0.5 : 0) + (H2(i, 1) - 0.5) * 0.3) / (NM / 3)), f = fr(Math.max(TH0 + 0.02, Math.min(TAU - TH0 - 0.02, th))), phi = [0.05, 1.05, -1.05][row] + (H2(i, 2) - 0.5) * 0.3;
    const dir = f.n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(f.B, Math.sin(phi)), pos = f.c.clone().addScaledVector(dir, R * 0.9);
    const w = 0.036 + 0.012 * H2(i, 3); lobes.push(lobeGeo(pos, f.T, dir, new THREE.Vector3().crossVectors(f.T, dir).normalize(), w, 0.02 + 0.006 * H2(i, 4), w * 0.8, (H2(i, 5) - 0.5) * 0.8, tones, H2(i, 6)));
    if ([5, 17, 29, 41, 52, 61, 64].includes(i)) tickAt.push({ pos: pos.clone().addScaledVector(dir, 0.016), T: f.T.clone(), n: dir, h: i });
  }
  for (const [sg, yEnd] of [[1, 0.2], [-1, 0.26]]) {   // the hanging ends: a tube tapering from the roll's end down the chest, with a cap where it leaves the roll
    const th = sg * TH0, p0 = phS(sg > 0 ? TH0 : TAU - TH0), p1 = elOfY(ch, yEnd, th), pts = [], rs = (t) => R * (1 - 0.3 * t);
    for (let k = 0; k <= 6; k++) { const t = k / 6, q = cenAt(th + sg * 0.05 * t, p0 + (p1 - p0) * t, rs(t)); pts.push(q.c); }
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.add(mesh(taperedTube(curve, 0, 0, 20, 12, rs), clothMat("#e6e5ec", { side: THREE.DoubleSide })));
    const cap = mesh(new THREE.SphereGeometry(R * 0.98, 12, 8), clothMat("#e6e5ec"), false); cap.position.copy(pts[0]); parts.add(cap);
    for (let i = 0; i < 12; i++) {
      const t = 0.04 + 0.92 * ((i + 0.5 + (H2(i, 7 + sg) - 0.5) * 0.4) / 12), q = cenAt(th + sg * 0.05 * t, p0 + (p1 - p0) * t, rs(t)), T = curve.getTangentAt(t), phi = (i % 3 - 1) * 1.1 + (H2(i, 8) - 0.5) * 0.4;
      const Bn = new THREE.Vector3().crossVectors(T, q.n).normalize(), dir = q.n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(Bn, Math.sin(phi)), pos = curve.getPointAt(t).addScaledVector(dir, rs(t) * 0.9), w = 0.034 + 0.01 * H2(i, 9);
      lobes.push(lobeGeo(pos, T, dir, new THREE.Vector3().crossVectors(T, dir).normalize(), w, 0.02 + 0.005 * H2(i, 10), w * 0.8, (H2(i, 11) - 0.5) * 0.8, tones, H2(i, 12)));
    }
  }
  { const fm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1 }); fm.userData.lookRole = "hair"; fm.userData.noOutline = true; parts.add(mesh(mergeGeometries(lobes), fm, false)); }   // 90 clumps
  { const pos = [], idx = []; tickAt.forEach((t, k) => {   // 7 ermine ticks: small black kites lying on the clumps
      const X = t.T.clone(), Z = new THREE.Vector3().crossVectors(X, t.n).normalize(), ang = H2(t.h, 13) * PI, a = X.clone().multiplyScalar(Math.cos(ang)).addScaledVector(Z, Math.sin(ang)), b = new THREE.Vector3().crossVectors(t.n, a).normalize();
      for (const [u, v] of [[0.0125, 0], [0, 0.004], [-0.0125, 0], [0, -0.004]]) { const p = t.pos.clone().addScaledVector(a, u).addScaledVector(b, v); pos.push(p.x, p.y, p.z); }
      const o = k * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3); });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const tm = new THREE.MeshBasicMaterial({ color: "#1b1a20", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); tm.userData.ink = true; tm.userData.noOutline = true; parts.add(mesh(g, tm, false)); }
  // ---- pearls: 19 of r 0.02 in a U from (x +-0.12, y 0.30) down to y 0.17, strung by hand (each its own wobble)
  { const U = (x) => 0.3 - 0.13 * (1 - (x / 0.12) ** 2), S = [[-0.12, 0]]; let len = 0;
    for (let i = 1; i <= 240; i++) { const x = -0.12 + 0.24 * (i / 240), [px, py] = [S[S.length - 1][0], U(S[S.length - 1][0])]; len += Math.hypot(x - px, U(x) - py); S.push([x, len]); }
    const pm = new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.22, metalness: 0.05 }); pm.userData.lookRole = "cloth"; pm.userData.noOutline = true;
    const sph = new THREE.SphereGeometry(0.02, 10, 7);
    for (let k = 0; k < 19; k++) { const L = (len * (k + 0.5)) / 19; let j = 0; while (j < S.length - 2 && S[j + 1][1] < L) j++; const x = S[j][0] + (S[j + 1][0] - S[j][0]) * ((L - S[j][1]) / Math.max(1e-6, S[j + 1][1] - S[j][1])) + (H2(k, 14) - 0.5) * 0.002;
      const q = surfAt(hyb, x, U(x), false), m = mesh(sph, pm, false); m.position.copy(q.pos).addScaledVector(q.normal, 0.062); parts.add(m); } }
  // ---- the sun hat: crown r 0.17 x 0.10, a brim to r 0.38 in three soft waves drooping at its edge, tipped back 16 degrees (about the crown's top, where
  // the leaf comes through a 0.05 hole), a ribbon 0.04 wide and three roses r 0.045
  { const hat = new THREE.Group(), straw = colorTex(512, 256, (g, W, Hh) => {
      g.fillStyle = hatC; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 360; i++) { const x = H2(i, 21) * W, y0 = H2(i, 22) * Hh * 0.6, len = Hh * (0.25 + 0.5 * H2(i, 23)), dk = H2(i, 24) < 0.6; g.strokeStyle = dk ? "#cdbd9e" : "#fffdf4"; g.globalAlpha = 0.1 + 0.14 * H2(i, 25); g.lineWidth = 1 + 1.6 * H2(i, 26); g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (H2(i, 27) - 0.5) * 6, y0 + len); g.stroke(); }
      g.globalAlpha = 0.3; g.fillStyle = "#cdbd9e"; g.fillRect(0, Hh * 0.965, W, Hh * 0.035); g.globalAlpha = 1; }), sm = clothMat("#ffffff", { side: THREE.DoubleSide, roughness: 0.9 });
    sm.map = straw; sm.color.set(hatC);
    const lp = [[0.17, -0.1], [0.176, -0.07], [0.166, -0.035], [0.12, -0.01], [0.062, 0.0], [0.03, 0.004]].map(([r, y]) => new THREE.Vector2(r, y));
    hat.add(mesh(new THREE.LatheGeometry(lp, 28), sm));
    const NA = 48, NK = 7, bp = [], bi = [], buv = [];
    for (let k = 0; k <= NK; k++) for (let a = 0; a <= NA; a++) { const A = (a / NA) * TAU, kk = k / NK, r = 0.17 + 0.21 * kk; bp.push(Math.sin(A) * r, -0.1 - 0.12 * Math.pow(kk, 1.5) + 0.014 * Math.sin(3 * A + 0.7) * kk, Math.cos(A) * r); buv.push(a / NA, kk * 0.6); }
    for (let k = 0; k < NK; k++) for (let a = 0; a < NA; a++) { const i0 = k * (NA + 1) + a, i1 = i0 + 1, i2 = i0 + NA + 1, i3 = i2 + 1; bi.push(i0, i2, i1, i1, i2, i3); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute("uv", new THREE.Float32BufferAttribute(buv, 2)); bg.setIndex(bi); bg.computeVertexNormals(); hat.add(mesh(bg, sm));
    const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.18, 0.04, 36, 1, true), clothMat(ribC, { side: THREE.DoubleSide })); rb.position.y = -0.082; rb.castShadow = true; hat.add(rb);
    const petM = clothMat(ribC, { roughness: 0.7 }), coreM = clothMat(shade(ribC, 0.6), { roughness: 0.7 }), pg = new THREE.SphereGeometry(1, 8, 6), cg = new THREE.SphereGeometry(1, 8, 6);
    [[0.35, -0.09], [0.78, -0.095], [1.2, -0.09]].forEach(([az, y], k) => {   // three roses on the front-left of the band
      const rz = new THREE.Group(); rz.position.set(Math.sin(az) * 0.186, y, Math.cos(az) * 0.186); rz.lookAt(rz.position.clone().multiplyScalar(2)); rz.rotation.z += k;
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + k, p = new THREE.Mesh(pg, petM); p.scale.set(0.022, 0.019, 0.011); p.position.set(Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0.012); p.rotation.z = a; p.castShadow = true; rz.add(p); }
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.7 + k, p = new THREE.Mesh(pg, petM); p.scale.set(0.015, 0.014, 0.009); p.position.set(Math.cos(a) * 0.011, Math.sin(a) * 0.011, 0.022); rz.add(p); }
      const c = new THREE.Mesh(cg, coreM); c.scale.set(0.009, 0.009, 0.007); c.position.z = 0.028; rz.add(c); hat.add(rz); });
    const tp = ch.surf(0, PI / 2).pos; hat.position.set(tp.x, tp.y + 0.022, tp.z); hat.rotation.x = -(16 * PI) / 180; parts.add(hat); }
  const SLV = { from: 0.04, gap: C.cuffGap ?? 0.1, r0: 0.078, r1: 0.062, rc: 0.058, cuff: 0.01, cuffAt: 0.86 };
  return sleeves(ch, (() => { const m = clothMat(dressC, { side: THREE.DoubleSide }); m.map = shellTexture(256, 256, seed + 3.3, 12, true); return m; })(), clothMat(shade(dressC, 0.82), { side: THREE.DoubleSide }), SLV);
}

// ---------- the dauphin: navy velvet double-breasted blazer, gold ascot, pocket square, a gold watch on the left wrist ---------------------
function dauphin(C, ch, P) {
  const parts = ch.potatoParts, seed = P.seed, blazer = C.blazer || "#2a3f8f", lapel = C.lapel || "#18224f", ascot = C.ascot || "#e9b93a", goldC = C.gold || "#f6c832";
  const gold = metal(goldC, 0.28, 0.7);
  // the shirt under it (white, showing in the V) with a small collar
  const shirtTex = fleeceTexture(1024, 512, seed + 2, 120, false, true), sN = top(ch, C, { front: -0.3, back: 0.22, vee: 0.7, hem: -1.18, color: "#fbf8f1", map: shirtTex, folds: 3, depth: 0.007, phase: 0.4 }).neck;
  parts.add(collarRoll(ch, sN, "#fbf8f1", 0.012));
  // the blazer: a V to y 0.30, hem at y 0.14; one painted colour map: velvet nap in short strokes and a sheen band 0.03 wide below the neckline over the shoulders
  const fV = elOfY(ch, 0.30), hV = Math.max(-1.3, elOfY(ch, 0.14)), bNeck = (th) => fV + (0.3 - fV) * Math.pow(0.5 * (1 - Math.cos(th)), 0.6), HEM = hV, RNG = 0.3 - HEM;
  const body = colorTex(1024, 512, (g, W, Hh) => {
    g.fillStyle = blazer; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 26; i++) { g.fillStyle = H2(i, 31) < 0.5 ? "#34499e" : "#1f3279"; g.globalAlpha = 0.1; g.beginPath(); g.ellipse(H2(i, 32) * W, H2(i, 33) * Hh, 40 + 60 * H2(i, 34), 30 + 40 * H2(i, 35), 0, 0, TAU); g.fill(); }
    g.globalAlpha = 1; napStrokes(g, W, Hh, seed + 5, 420, "#4c63b8", "#18224f");
    // the sheen: from 0.03 m below the neckline edge to 0.06, strongest over the shoulder crest (th 1.1 .. 2.2 each side), as a soft stripe
    for (let x = 0; x < W; x += 2) { const th = (x / W) * TAU, w = Math.max(sstep(0.7, 1.3, Math.abs(Math.atan2(Math.sin(th), Math.cos(th)))), 0) * (1 - sstep(2.4, 3.0, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))))), tp = bNeck(th), v1 = (tp - 0.06 / ch.ry - HEM) / RNG, v0 = (tp - 0.1 / ch.ry - HEM) / RNG;
      g.fillStyle = "#5f77c9"; g.globalAlpha = 0.9 * w; g.fillRect(x, v0 * Hh, 2, (v1 - v0) * Hh); }
    g.globalAlpha = 1; });
  const arms = {}; for (const [s, vb] of [["R", 0.25], ["L", 0.75]]) arms[s] = colorTex(256, 256, (g, W, Hh) => {   // u (x) along the arm, v (y) round it; the outer side of each arm is v 0.25 (R) / 0.75 (L)
    g.fillStyle = blazer; g.fillRect(0, 0, W, Hh); napStrokes(g, W, Hh, seed + 7 + (s === "L" ? 3 : 0), 150, "#4c63b8", "#18224f", true);
    const y0 = (vb - 0.04) * Hh, gr = g.createLinearGradient(0, y0, 0, y0 + 0.08 * Hh); gr.addColorStop(0, "rgba(95,119,201,0)"); gr.addColorStop(0.5, "rgba(95,119,201,0.95)"); gr.addColorStop(1, "rgba(95,119,201,0)"); g.fillStyle = gr; g.fillRect(0, y0, W, 0.08 * Hh); });
  { const m = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); m.map = body;
    const NU = 180, NV = 36, G = garment(ch, { topFn: bNeck, top: fV, hem: HEM, folds: 4, depth: 0.009, flare: 0.016, lift: 0.052, lift0: 0.046, wave: 0.005, thick: 0.016, phase: 0.9, grad: 0.22, segs: NU, rows: NV });
    gridUv(G.outer, NU, NV, (i, j) => { const th = (i / NU) * TAU, tp = bNeck(th); return [i / NU, (tp + (HEM - tp) * (j / NV) - HEM) / RNG]; });
    parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(blazer, 0.6)), false)); parts.add(mesh(G.hem, clothMat(blazer, { side: THREE.DoubleSide }), false));
    { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, blazer)); } }
  // the lapels: a rolled dark collar from the shoulders down both edges of the V, thinning at the V's point
  { const open = 0.05, end = (th) => sstep(0, 0.3, Math.min(th - open, TAU - open - th)), cr = (th) => 0.004 + 0.015 * end(th), cw = 1.7;
    parts.add(mesh(rollOn(ch, { th0: open, th1: TAU - open, ph: (th) => bNeck(th) - (cr(th) * cw * 0.6) / ch.ry, r: cr, wide: () => cw, lift: 0.05, sink: 0.8, segs: 140, radial: 14 }), clothMat(lapel, { side: THREE.DoubleSide }))); }
  // the front seam and the 4 gold buttons (two columns, double-breasted)
  parts.add(mesh(cordDown(ch, 0, fV - 0.02, HEM + 0.05, 0.004, 0.066), clothMat(lapel), false));
  for (const sg of [-1, 1]) for (const dp of [0.36, 0.62]) parts.add(studAt(ch, sg * 0.2, HEM + dp * (fV - HEM) * 0.9 + 0.02, 0.082, 0.02, gold, 0.5));
  // a gold ascot in the V: a knot and two soft flaps; a white pocket square on the left chest (+x)
  { const am = clothMat(ascot, { roughness: 0.55, side: THREE.DoubleSide }), ph0 = fV + 0.22;
    parts.add(studAt(ch, 0, ph0, 0.052, 0.027, am, 0.6));
    for (const sg of [-1, 1]) { const q = ch.surf(sg * 0.09, ph0 - 0.12), f = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), am); f.scale.set(0.028, 0.055, 0.011); f.position.copy(q.pos).addScaledVector(q.normal, 0.055); f.lookAt(q.pos.clone().addScaledVector(q.normal, 2)); f.rotateZ(sg * 0.35); f.castShadow = true; parts.add(f); } }
  { const q = ch.surf(0.74, -0.66), n = q.normal, up = V(0, 1, 0), S = new THREE.Vector3().crossVectors(up, n).normalize(), U = new THREE.Vector3().crossVectors(n, S).normalize(), pos = [], idx = [];
    [[-0.016, 0.016, -0.02], [0, 0.026, 0.004], [0.016, 0.014, -0.012]].forEach(([x, hgt], k) => { const base = q.pos.clone().addScaledVector(n, 0.066).addScaledVector(U, 0.004); const o = pos.length / 3;
      for (const p of [base.clone().addScaledVector(S, x - 0.014), base.clone().addScaledVector(S, x + 0.014), base.clone().addScaledVector(S, x).addScaledVector(U, hgt).addScaledVector(n, 0.004 * k)]) pos.push(p.x, p.y, p.z); idx.push(o, o + 1, o + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); parts.add(mesh(g, clothMat("#fbf8f1", { side: THREE.DoubleSide }), false)); }
  // sleeves: end 0.11 before the hand's centre, then 0.02 of white cuff; the gold watch on the LEFT wrist, its case 0.075 across, a 4-point glint every 0.9 s
  const watch = new THREE.Group(), face = new THREE.Group(); watch.visible = false; ch.root.add(watch); watch.add(face);
  { const wm = metal(goldC, 0.25, 0.75), dial = clothMat("#f4ecd2", { roughness: 0.5 }), caseG = new THREE.CylinderGeometry(0.0375, 0.0375, 0.018, 24), dg = new THREE.CylinderGeometry(0.03, 0.03, 0.004, 24);
    const cs = mesh(caseG, wm, false); face.add(cs); const dl = new THREE.Mesh(dg, dial); dl.position.y = 0.01; face.add(dl);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, t = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.002, k % 3 ? 0.005 : 0.008), wm); t.position.set(Math.sin(a) * 0.024, 0.0125, Math.cos(a) * 0.024); t.rotation.y = a; face.add(t); }
    for (const [l, a] of [[0.016, 0], [0.011, 1.9]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, l), wm); h.position.set(Math.sin(a) * l / 2, 0.0125, Math.cos(a) * l / 2); h.rotation.y = a; face.add(h); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.0075, 8, 26), wm); band.castShadow = true; watch.add(band); face.position.y = 0.05;
    // the glint: two crossed thin diamonds (a 4-point star) over the case, #fff3b0, steam
    const sg = new THREE.BufferGeometry(), sp = []; for (const [a, b] of [[0.026, 0.004], [0.004, 0.026]]) { sp.push(-a, 0, 0, 0, 0, -b, a, 0, 0, -a, 0, 0, a, 0, 0, 0, 0, b); } sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    // (the second pair's winding is reversed on purpose: the star is double-sided below)
    const sm = new THREE.MeshBasicMaterial({ color: "#fff3b0", side: THREE.DoubleSide, transparent: true, depthWrite: false }); sm.userData.noOutline = true; const star = steam(new THREE.Mesh(sg, sm)); star.position.y = 0.016; star.visible = false; face.add(star); watch.userData.star = star; }
  const _m = new THREE.Matrix4(), _o = V(0, 0, 0), _t = V(0, 0, 0), _nn = V(0, 0, 0), _bb = V(0, 0, 0);
  const SLV = { from: 0.04, gap: C.cuffGap ?? 0.09, cuffLen: 0.02, r0: 0.09, r1: 0.068, rc: 0.058, cuff: 0.003, cuffAt: 0.86 };
  SLV.hook = (s, curve, L, to, n, b) => {
    if (s !== "L") return;
    const u = Math.min(1, 1 - 0.062 / L); curve.getPointAt(u, _o); curve.getTangentAt(u, _t);
    _nn.set(0.6, 0.8, 1.0); _nn.addScaledVector(_t, -_nn.dot(_t)).normalize();   // the case sits on the back of the wrist: the side of the arm that faces up, out and forward
    _bb.crossVectors(_nn, _t).normalize(); _m.makeBasis(_bb, _nn, _t); watch.quaternion.setFromRotationMatrix(_m); watch.position.copy(_o); watch.visible = true;
  };
  const sl = sleeves(ch, { L: (() => { const m = clothMat("#ffffff", { side: THREE.DoubleSide }); m.map = arms.L; return m; })(), R: (() => { const m = clothMat("#ffffff", { side: THREE.DoubleSide }); m.map = arms.R; return m; })() }, clothMat("#fbf8f1", { side: THREE.DoubleSide }), SLV);
  return { sl, apply: (st, t) => { const ph = (t / 0.9) % 1, k = Math.max(0, 1 - Math.abs(ph - 0.5) * 9), star = watch.userData.star; star.visible = k > 0.02; star.scale.setScalar(0.3 + 0.9 * k); star.rotation.y = 0.5 * ph; } };
}

// numbers from their sheets (measured 12 Nov 2026), set against Spud's own sheet and his build
const KIT = {
  bathrobe: (C, ch) => robe(C, ch, { color: "#b79ac8", stripe: "#8a6aa6", collar: "#cdb6da", beltC: "#9a7ab4", phBelt: -0.62, seed: 53.4, front: -0.4, back: 0.25, vee: 0.75, hem: 0.06, flare: 1.36, circ: 2.45, phase: 0.8, r0: 0.074, r1: 0.059, rows: [0.78, 0.46] }),
  chip: (C, ch) => hoodie(C, ch, { color: "#ffcf2e", seed: 21.4, front: -0.28, back: 0.25, vee: 0.6, hem: -1.14, cowlR: 0.02, cowlWide: 1.7, hoodR: 0.026, hoodWide: 2.7, r0: 0.062, r1: 0.05, phase: 0.6, cordLen: 0.2, cordR: 0.0085, pocketW: 0.52, pocketH: 0.05, pocketUp: 0.26, flecks: 220, folds: 3, pale: true }),
  mash: (C, ch) => { const sl = hoodie(C, ch, { color: "#7a716c", seed: 33.8, front: -0.16, back: 0.2, vee: 0.7, hem: -1.2, cowlR: 0.022, cowlWide: 1.8, hoodR: 0.05, hoodWide: 2.3, r0: 0.07, r1: 0.054, phase: 1.4, cordLen: 0.2, cordR: 0.006, pocketW: 0.62, pocketH: 0.07, pocketUp: 0.3, rivets: true, flecks: 900 }); headphones(C, ch, { ph: -0.2, rise: 0.46, at: 1.15, cup: 0.078, lift: 0.05 }); return sl; },
  teller: (C, ch) => teller(C, ch, { seed: 87.3 }),
  duchess: (C, ch) => duchess(C, ch, { seed: 73.6 }),
  dauphin: (C, ch) => dauphin(C, ch, { seed: 79.2 }),
  wedge: (C, ch) => { const sl = bomber(C, ch, { color: "#c34732", seed: 12.6, front: -0.3, back: 0.3, vee: 0.6, hem: -1.12, r0: 0.09, r1: 0.066, phase: 0.3 }); shades(C, ch, { size: 2.0, x: 0.04, tip: -0.42, fwd: 0.1, up: -0.035 }); return sl; },
};
export const EVERYDAY = Object.keys(KIT);
export function everyday(C, ch, out) {
  const kit = KIT[C.type](C, ch), sl = typeof kit === "function" ? kit : kit.sl, more = typeof kit === "function" ? null : kit.apply;   // { sl, apply(st, t) }: a kit with keys of its own (glasses slip, a watch glint)
  handsAndFeet(C, ch);
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); more && more(st, t); };
  out.sitDepth = 0;
  return out;
}
