import * as THREE from "three";
import { taperedTube } from "./geo.js";
import { garment, clothMat, liningMat, foldInk, inkMesh, sstep } from "./costumes-art.js";
import { hash2, gridUv } from "./costumes-art-cast.js";

// Potato Desk 09 "Hell Reviews" (storyboards/series/potato-desk/09-hell-reviews/DESIGN.md section 1): THE DEVIL, a red potato.
// costumes-everyday.js KIT entry `devil` calls devilKit(C, ch); characters/potatobrawl/devil.json and devil-imp.json use it.
// Every devil sign is a potato's own part (no leaf: sprout.placement "none"): two sprouting chits for horns, a root runner for a tail.
//
// WHAT IT DRAWS (sizes in metres, body-local = measured from the body's bottom; they scale with the body: k = height / 0.92)
//   horns   two chits at x +-0.17 (x scales with the body's width; set on the skin of the head, root sunk in), 0.16 long, diameter 0.06 at the root
//           to 0.02, one gentle curve (12 deg outward at the root, 35 deg of bend, so the tips lean 23 deg inward), root #f0dcc0 blending to tip #8e3a6b, a
//           rounded tip, 2 bud bumps on each (each horn its own heights).
//   tail    a root runner from the back at y 0.07 (BELOW the shirt's hem at 0.12, key tailY; never through cloth): tube 0.55 long, diameter 0.018, #7a2622, ONE S-curve (up, down, up) and a little
//           sideways S; at its end a spade leaf 0.10 x 0.12 #c8352b lying along the tail (flat to the floor when the tail lies). Idle sway
//           8 deg at 0.7 Hz (the sway runs along the tail as a wave), driven by the clip time the kit is given: no clock, no random.
//   shirt   the loud resort shirt #17a3a0 (shade #0f7f80, the inside), stand-off 0.018 from the skin, hem at y 0.12 (flare 0.028, one drawn fold line
//           per side), open collar in a V (V point y 0.25, top edge 0.03 under the mouth corners, higher at the back; a rolled collar all along
//           the neckline) with two pointed lapel flaps folded out, their underside in the shade teal (tips down to y 0.19), 3 buttons #f8f3e1 down the front, SIX flame-flowers #ffb02e with
//           centres #ff6a13 (0.10-0.16 across, 5-7 flame petals each, every one painted ONCE on the shirt's one canvas, each its own petal
//           count, turn, length and curl: no copies, mirrors or tiling), a hand-washed teal with darker brush strokes. Short sleeves, diameter
//           0.17 -> 0.13, 0.12 long, ending far before the wrist (the hands are always clear), a hem ring on each.
//   badge   gold plate 0.10 x 0.06 #e8b93a on the shirt at the chest, x +0.20 (his left, the camera side when he faces the lens),
//           one red star #b3261e, no letters.
//   skin    6 potato-eye dimples #8f2f2a and 8 freckles #d97a62 (colours dimple, freckle), each placed once by hand on the head, sides and back (never on the
//           face; the body's own specks are off in the character files)
//   sandals flat sandals on both feet: a thin sole #f2c94c (0.15 x 0.245, the same on the small demon: the engine's foot ball does not scale), one strap #b3261e across the instep.
//
// COSTUME KEYS (devil.json "costume"; all optional; the director edits the numbers there, or uses a character file of his own)
//   shirt       true    false: no shirt, no sleeves, no badge (the small demon)
//   badge       true    false: no badge
//   hornLen     0.16    horn length (0.05 for the small demon: stubs; diameters scale with its square root)
//   tailLen     0.55    tail tube length (0.20 for the small demon; the leaf shrinks with it)
//   tailDroop   0       0..1: 0 = normal sway, 1 = the tail hangs from the back and its tip lies on the floor (from beat 12). A number holds it;
//                       an array of keyframes [[t0, v0], [t1, v1], ...] (clip seconds, linear between, held outside) moves it.
//                       ALSO: the timeline action { "do": "droop", "to": 1, "dur": 0.6 } (the leaf droop; this character has no leaf)
//                       drives it: the tail uses the larger of the two. This is how the director animates it per clip, no engine change.
//   tailFlick   none    a time in seconds, or an array of times: at each one the tail tip flicks once (0.5 s, about 3 Hz, dying out)
//   shirtColor "#17a3a0", shirtShade "#0f7f80", flower "#ffb02e", flowerCore "#ff6a13", horn "#f0dcc0", hornTip "#8e3a6b", tail "#7a2622",
//   tailLeaf "#c8352b", sole "#f2c94c", strap "#b3261e", buttons "#f8f3e1", plate "#e8b93a", star "#b3261e"   (colours)
// Face, eyes, hands, limbs: devil.json (Spud's eye build, Chip's glove hands). Crack, sob, sweat and whimper are done with the existing face
// controls (tears, lids, corners) and fx sweat; nothing is added here.
//
//   shades      off     (Potato Desk Heaven Steps, DESIGN.md section 4) black shades #1d1a20 from Wedge's piece (two rounded lenses, a bridge,
//                       short temples; lens 0.15 x 0.09, a faint glint each). Absent or false: not built at all, the Devil renders exactly as before.
//                       A number or keyframes [[t0, v0], ...] (clip seconds, linear between, held outside) of a pose: 0 off (hidden), 1 on the eyes
//                       (in front of the eye bulbs), 2 pushed up on the forehead between the horns (resting on the head, tipped back); between 1
//                       and 2 they slide up. true / "on" = 1, "up" = 2. Spec keys shadesColor "#1d1a20", shadesGlint "#4a4452".
//   tailY       0.07    where the tail leaves the back (body-local y); keep it under the hem
// WHERE THINGS ARE (deviation from the design table): its "V down to y 0.55" and "badge at y 0.62" are at the height of his mouth and eyes on a
// 0.92 egg (the face is placed on the body's middle: eyes at y 0.52, mouth at 0.41). Here the V's point is at y 0.25, the top edge runs 0.03 under
// the mouth corners (0.36-0.40 at the cheeks), 0.50 at the sides and 0.58 at the back; the badge's centre is at y 0.275, pinned on the +x lapel.

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3 + 66, i * 0.71 + n * 1.7 + 24.4);   // a hash 0..1 for mark i, channel n (the devil's seed 66)
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// elevation (radians on the body) of a height y (floor based) at angle th
const elOfY = (ch, y, th = 0) => { let a = -1.45, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; };
// the angle th (0..PI/2, front to side) where the body at elevation ph is x metres from the middle
const thOfX = (ch, ph, x) => { let a = 0, b = PI / 2; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (Math.abs(ch.surf(m, ph).pos.x) < x) a = m; else b = m; } return (a + b) / 2; };
function bodySize(ch) { return { Hh: ch.ry * 2, base: ch.cy - ch.ry }; }

// a point on the garment G at (th, v) and its outward normal
function onG(G, th, v, off) {
  const e = 0.004, p = G.at(th, v, off), a = G.at(th + e, v, off).sub(G.at(th - e, v, off)), b = G.at(th, Math.min(1, v + 0.01), off).sub(G.at(th, Math.max(0, v - 0.01), off)), n = new THREE.Vector3().crossVectors(b, a).normalize();
  if (n.x * p.x + n.z * p.z < 0) n.negate();
  return { p, n };
}

// a soft roll lying on the body along a path th0..th1 (the collar): centre r + lift off the skin at elevation ph(th), r(th) thick, r * wide(th) broad
function rollOn(ch, o) {
  const NU = o.segs ?? 96, NV = o.radial ?? 14, pts = [], P = (th) => { const s = ch.surf(th, o.ph(th)), r = o.r(th); return { c: s.pos.clone().addScaledVector(s.normal, (o.lift ?? 0) + r * (o.sink ?? 1)), n: s.normal, r }; };
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = o.th0 + (o.th1 - o.th0) * (i / NU), a = (j / NV) * TAU, q = P(th), T = P(th + 0.01).c.sub(P(th - 0.01).c).normalize();
    const B = new THREE.Vector3().crossVectors(T, q.n).normalize(), wide = o.wide ? o.wide(th) : 1;
    pts.push(q.c.addScaledVector(q.n, Math.cos(a) * q.r).addScaledVector(B, Math.sin(a) * q.r * wide));
  }
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, k) => { pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; });
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------ the shirt's one canvas
// th, y -> pixel: the shirt's uv has the front at u 0.5 (the seam is at the back) and v running down from the neckline to the hem
function shirtCanvas(ch, C, geo, W = 2048, H = 1024) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const teal = C.shirtColor || "#17a3a0", dark = C.shirtShade || "#0f7f80", petalC = C.flower || "#ffb02e", coreC = C.flowerCore || "#ff6a13";
  g.fillStyle = teal; g.fillRect(0, 0, W, H);
  // a hand wash: soft darker patches and a light brush stroke here and there, each its own place (hashed)
  for (let i = 0; i < 46; i++) {
    const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 40 + 110 * hs(i, 3), a = 0.05 + 0.07 * hs(i, 4);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${hs(i, 5) < 0.6 ? "15,127,128" : "70,200,196"},${a})`); gr.addColorStop(1, "rgba(15,127,128,0)");
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.lineCap = "round";
  for (let i = 0; i < 90; i++) {
    const x = hs(i, 6) * W, y = hs(i, 7) * H, len = 30 + 90 * hs(i, 8), a = (hs(i, 9) - 0.5) * 1.1, dk = hs(i, 10) < 0.6;
    g.strokeStyle = dk ? `rgba(15,127,128,${0.18 + 0.2 * hs(i, 11)})` : `rgba(90,215,208,${0.1 + 0.12 * hs(i, 11)})`; g.lineWidth = 2 + 4 * hs(i, 12);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * len * 0.4, y + Math.cos(a) * len); g.stroke();
  }
  const dTh = (th) => { const d = ((th % TAU) + TAU) % TAU; return d > PI ? TAU - d : d; };
  const px = (th) => ((((th / TAU + 0.5) % 1) + 1) % 1) * W;
  const rx = ch.rx, rz = ch.rz;
  const speed = (th) => Math.hypot(rx * Math.cos(th), rz * Math.sin(th));   // metres of body per radian
  const six = [   // th (0 front, + toward his left), height y (body-local), size (m across), the petal count (the lapels cover the upper chest)
    { th: -1.05, y: 0.215, s: 0.14, n: 6 }, { th: 1.05, y: 0.205, s: 0.13, n: 5 }, { th: 1.7, y: 0.3, s: 0.15, n: 7 },
    { th: -1.75, y: 0.3, s: 0.13, n: 5 }, { th: -0.38, y: 0.168, s: 0.10, n: 6 }, { th: 2.6, y: 0.35, s: 0.16, n: 7 },
  ];
  six.forEach((f, i) => {
    const k = geo.k, thc = f.th, yc = geo.base + f.y * k;
    // local flower coordinates (a along the cloth, b up, metres) -> canvas
    const map = (a, b) => {
      const th = thc + a / speed(thc), tp = geo.topPh(th), ph = elOfY(ch, yc + b), hm = geo.hemPh, v = (tp - ph) / (tp - hm);
      return [px(th), v * H];
    };
    const rot = (hs(i, 20) - 0.5) * 1.2, curl = 0.35 + 0.5 * hs(i, 21), R = f.s / 2, n = f.n;
    const petal = (ang, len, wid, cu, fill, edge = false) => {
      const pts = [], m = 14;
      for (let side of [-1, 1]) for (let j = 0; j <= m; j++) {
        const s = side < 0 ? j / m : 1 - j / m, w = wid * Math.pow(Math.sin(PI * Math.pow(s, 0.62)), 0.85) * (1 - 0.3 * s);
        const ax = Math.sin(ang) * s * len + Math.cos(ang) * (cu * s * s * len), ay = Math.cos(ang) * s * len - Math.sin(ang) * (cu * s * s * len);   // the axis, curled to one side
        const nx = Math.cos(ang), ny = -Math.sin(ang);   // sideways
        pts.push([ax + nx * w * side, ay + ny * w * side]);
      }
      g.beginPath(); pts.forEach(([a, b], j) => { const [X, Y] = map(a, b); j ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fillStyle = fill; g.fill(); if (edge) { g.lineWidth = 2.2; g.lineJoin = "round"; g.strokeStyle = "rgba(214,92,10,0.7)"; g.stroke(); }
    };
    // outer flames, then shorter inner ones in the core colour at low strength (a flame's heart), then the centre
    for (let p = 0; p < n; p++) {
      const ang = rot + (p / n) * TAU + (hs(i * 9 + p, 22) - 0.5) * 0.35, len = R * (0.9 + 0.3 * hs(i * 9 + p, 23)), wid = R * (0.30 + 0.09 * hs(i * 9 + p, 24)), cu = curl * (0.7 + 0.6 * hs(i * 9 + p, 25));
      petal(ang, len, wid, cu, petalC, true);
    }
    for (let p = 0; p < n; p++) {
      const ang = rot + (p / n) * TAU + (hs(i * 9 + p, 22) - 0.5) * 0.35, len = R * (0.9 + 0.3 * hs(i * 9 + p, 23)) * 0.58, wid = R * 0.13, cu = curl * (0.7 + 0.6 * hs(i * 9 + p, 25)) * 0.9;
      petal(ang, len, wid, cu, "rgba(255,106,19,0.62)");
    }
    const core = []; for (let j = 0; j < 20; j++) { const a = (j / 20) * TAU, r = R * (0.2 + 0.03 * hs(i * 5 + j % 7, 26)); core.push(map(Math.cos(a) * r, Math.sin(a) * r)); }
    g.beginPath(); core.forEach(([X, Y], j) => (j ? g.lineTo(X, Y) : g.moveTo(X, Y))); g.closePath(); g.fillStyle = coreC; g.fill();
    // one small dark-orange dot ring mark in the heart, each flower its own
    const dot = map((hs(i, 27) - 0.5) * R * 0.1, (hs(i, 28) - 0.5) * R * 0.1); g.fillStyle = "#e8590d"; g.beginPath(); g.arc(dot[0], dot[1], 3 + hs(i, 29) * 2, 0, TAU); g.fill();
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------ sleeves: short, wide, a hem ring; the tube follows the arm, rebuilt every frame
function sleeves(ch, mat, ringMat, SL) {
  const slv = {}, rings = {};
  for (const s of ["L", "R"]) {
    slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), mat); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]);
    rings[s] = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), ringMat); rings[s].castShadow = true; rings[s].visible = false; ch.root.add(rings[s]);
  }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), _t = V(0, 0, 0), _q = new THREE.Quaternion(), R = 20, N = 10;
  const radius = (t) => SL.r0 + (SL.r1 - SL.r0) * t;
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = rings[s].visible = false; continue; }
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
      curve.getPointAt(Math.min(0.9, SL.len / L), rings[s].position); curve.getTangentAt(Math.min(0.9, SL.len / L), _t); rings[s].quaternion.setFromUnitVectors(V(0, 0, 1), _t); const rr = SL.r1; rings[s].scale.set(rr, rr, rr); rings[s].visible = true;
    }
  };
}

// ------------------------------------------------------------------ horns: two chits
function horns(C, ch, S) {
  const k = S.Hh / 0.92, kw = ch.rx / 0.4, len = C.hornLen ?? 0.16, rs = Math.sqrt(len / 0.16), r0 = 0.03 * rs, r1 = 0.01 * rs;
  const rootC = new THREE.Color(C.horn || "#f0dcc0"), tipC = new THREE.Color(C.hornTip || "#8e3a6b"), col = new THREE.Color();
  const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.62 }), tipMat = new THREE.MeshStandardMaterial({ color: tipC, roughness: 0.62 });
  const hx = 0.17 * kw, SEG = 28, RAD = 14;
  for (const sg of [1, -1]) {
    const side = sg > 0 ? 0 : 1;
    const ph = (() => { let a = 0, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(sg * PI / 2, m).pos.x * sg > hx) a = m; else b = m; } return (a + b) / 2; })();
    const root = ch.surf(sg * PI / 2, ph).pos, n = ch.surf(sg * PI / 2, ph).normal;
    // the horn's path in the x-y plane: 12 degrees outward at the root, bending 35 degrees inward by the tip
    const a0 = 0.21, a1 = a0 - 35 * PI / 180, pts = [root.clone().addScaledVector(V(Math.sin(a0) * sg, Math.cos(a0), 0), -0.02 * rs)];
    const cur = root.clone(); pts.push(cur.clone());
    for (let i = 1; i <= 16; i++) { const s = (i - 0.5) / 16, a = lerp(a0, a1, Math.pow(s, 0.9)); cur.addScaledVector(V(Math.sin(a) * sg, Math.cos(a), 0), len / 16); pts.push(cur.clone()); }
    const curve = new THREE.CatmullRomCurve3(pts), dl = len + 0.02 * rs, rad = (t) => { const s = clamp01((t * dl - 0.02 * rs) / len); return Math.max(r1 * 0.9, lerp(r0, r1, Math.pow(s, 0.8))) * (1 + 0.1 * Math.sin(PI * s) * 0); };
    const geo = taperedTube(curve, 0, 0, SEG, RAD, rad), P = geo.attributes.position, cols = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const t = Math.floor(i / (RAD + 1)) / SEG, s = clamp01((t * dl - 0.02 * rs) / len); col.copy(rootC).lerp(tipC, sstep(0.1, 0.72, s)); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    ch.potatoParts.add(mesh(geo, mat));
    const tip = curve.getPointAt(1), cap = mesh(new THREE.SphereGeometry(r1 * 0.95, 14, 10), tipMat); cap.position.copy(tip); ch.potatoParts.add(cap);
    // two bud bumps, each horn its own heights; both lean to the camera side so they read from the front
    const buds = side ? [[0.31, 0.62, 0.8], [0.6, -0.5, 0.7]] : [[0.36, 0.55, 0.85], [0.64, -0.6, 0.65]];
    buds.forEach(([t, lat, sz], j) => {
      const u = clamp01((t * len + 0.02 * rs) / dl), p = curve.getPointAt(u), s = t, rr = lerp(r0, r1, Math.pow(s, 0.8)), a = lerp(a0, a1, Math.pow(s, 0.9));
      const out = V(Math.cos(a) * sg, -Math.sin(a), 0), dir = out.multiplyScalar(lat * sg > 0 ? 0.55 : -0.55).add(V(0, 0, 0.8)).normalize();
      const bm = new THREE.MeshStandardMaterial({ color: new THREE.Color().copy(rootC).lerp(tipC, sstep(0.1, 0.72, s)), roughness: 0.62 });
      const b = mesh(new THREE.SphereGeometry(rr * 0.62 * sz, 12, 8), bm); b.position.copy(p).addScaledVector(dir, rr * 0.82); b.scale.set(1, 1.15, 1); ch.potatoParts.add(b);
    });
  }
}

// ------------------------------------------------------------------ the tail: a root runner, a spade leaf at its tip
function tail(C, ch, S) {
  const k = S.Hh / 0.92, len = C.tailLen ?? 0.55, r = 0.009 * (0.4 + 0.6 * Math.min(1, len / 0.55)), ls = 0.35 + 0.65 * Math.min(1, len / 0.55), N = 22, ds = len / N;
  const ph = elOfY(ch, S.base + (C.tailY ?? 0.07) * k, PI), bk = ch.surf(PI, ph).pos, root = V(0, bk.y, bk.z + 0.03 * k);
  const mat = clothMat(C.tail || "#7a2622", { roughness: 0.7 }), tube = new THREE.Mesh(new THREE.BufferGeometry(), mat); tube.castShadow = true; tube.frustumCulled = false; ch.potatoParts.add(tube);
  const leafSh = new THREE.Shape(); leafSh.moveTo(0, 0.008); leafSh.bezierCurveTo(-0.012, -0.006, -0.05, 0.0, -0.05, 0.04); leafSh.bezierCurveTo(-0.05, 0.075, -0.015, 0.095, 0, 0.12); leafSh.bezierCurveTo(0.015, 0.095, 0.05, 0.075, 0.05, 0.04); leafSh.bezierCurveTo(0.05, 0.0, 0.012, -0.006, 0, 0.008);
  const lg = new THREE.ExtrudeGeometry(leafSh, { depth: 0.005, bevelEnabled: true, bevelSize: 0.0018, bevelThickness: 0.0018, bevelSegments: 2, curveSegments: 10 }); lg.translate(0, 0, -0.0025);
  const leaf = new THREE.Mesh(lg, clothMat(C.tailLeaf || "#c8352b", { roughness: 0.6, side: THREE.DoubleSide })); leaf.castShadow = true; leaf.frustumCulled = false; leaf.scale.setScalar(ls); ch.potatoParts.add(leaf);
  const floor = r + 0.003, flicks = [].concat(C.tailFlick ?? []), kf = Array.isArray(C.tailDroop) ? C.tailDroop : null, base = kf ? 0 : +(C.tailDroop || 0);
  const droopAt = (t) => { if (!kf) return base; if (t <= kf[0][0]) return kf[0][1]; for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) return lerp(kf[i - 1][1], kf[i][1], (t - kf[i - 1][0]) / Math.max(1e-6, kf[i][0] - kf[i - 1][0])); return kf[kf.length - 1][1]; };
  let last = "";
  const _T = V(0, 0, 0), _Z = V(0, 0, 0), _X = V(0, 0, 0), _m = new THREE.Matrix4();
  return (st, t) => {
    const d = clamp01(Math.max(droopAt(t), st?.droop || 0)), sw = (8 * PI / 180) * (1 - 0.8 * d);
    let fl = 0; for (const f of flicks) { const a = t - f; if (a >= 0 && a < 0.5) fl += 0.75 * Math.exp(-a * 7) * Math.sin(TAU * 3 * a); }
    const key = `${((t * 0.7) % 1).toFixed(6)}|${d.toFixed(5)}|${fl.toFixed(5)}`; if (key === last) return; last = key;
    const pts = [root.clone()], p = root.clone(); let pitch = 0, yaw = 0;
    for (let i = 1; i <= N; i++) {
      const s = (i - 0.5) / N;
      pitch = 0.5 * Math.cos(TAU * s) - 0.15 + fl * Math.pow(s, 1.4) * (1 - 0.6 * d);   // up, down, up: the one S
      const drop = -1.25 * clamp01((p.y - floor) / 0.1); pitch = lerp(pitch, drop, d);
      yaw = sw * Math.sin(TAU * 0.7 * t - 1.3 * s) * (0.35 + 0.65 * s) + 0.28 * Math.sin(TAU * s) * (0.6 + 0.4 * d);
      p.add(_T.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(ds)); if (p.y < floor) p.y = floor; pts.push(p.clone());
    }
    tube.geometry.dispose(); tube.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 7, false);
    const e = pts[N], tg = e.clone().sub(pts[N - 2]).normalize();
    _Z.copy(V(0, 1, 0)).addScaledVector(tg, -tg.y); if (_Z.lengthSq() < 1e-4) _Z.set(0, 0, 1); _Z.normalize(); _X.crossVectors(tg, _Z).normalize();   // _Z: up across the tail; the leaf's broad side is turned to face sideways (its plane holds the tail and up), flat as the tail lies down
    _Z.multiplyScalar(d).addScaledVector(_X, 1 - d).normalize(); _X.crossVectors(tg, _Z).normalize();
    _m.makeBasis(_X, tg, _Z); leaf.quaternion.setFromRotationMatrix(_m); leaf.position.copy(e).addScaledVector(tg, -0.004 * ls);
  };
}

// ------------------------------------------------------------------ the shirt and the badge
function shirt(C, ch, S) {
  const parts = ch.potatoParts, k = S.Hh / 0.92, teal = C.shirtColor || "#17a3a0", dark = C.shirtShade || "#0f7f80";
  const phY = (y) => elOfY(ch, S.base + y * k);
  const hemPh = phY(0.12);
  // the neckline: the V's point at y 0.31 on the chest, rising to the cheeks, the sides and the back (linear at the point so it stays a V)
  const ctl = [[0, 0.25], [0.4, 0.31], [0.75, 0.36], [1.05, 0.395], [1.6, 0.5], [2.3, 0.55], [PI, 0.58]];
  const neckY = (d) => { for (let i = 1; i < ctl.length; i++) if (d <= ctl[i][0]) { const u = (d - ctl[i - 1][0]) / (ctl[i][0] - ctl[i - 1][0]); return lerp(ctl[i - 1][1], ctl[i][1], i === 1 ? u : u * u * (3 - 2 * u)); } return ctl[ctl.length - 1][1]; };
  const dOf = (th) => { const q = ((th % TAU) + TAU) % TAU; return q > PI ? TAU - q : q; };
  const TBL = 720, tbl = Array.from({ length: TBL + 1 }, (_, i) => phY(neckY(dOf((i / TBL) * TAU))));   // elevation of the neckline for the angle: a table (the bisection is slow)
  const topPh = (th) => { const q = ((((th % TAU) + TAU) % TAU) / TAU) * TBL, i = Math.min(TBL - 1, Math.floor(q)); return lerp(tbl[i], tbl[i + 1], q - i); };
  const NU = 180, NV = 36, lift = 0.018, thick = 0.012;
  const G = garment(ch, { topFn: topPh, top: topPh(0), hem: hemPh, folds: 3, depth: 0.005, flare: 0.028, lift, lift0: lift, wave: 0.004, thick, phase: 0.9, grad: 0.18, segs: NU, rows: NV });
  gridUv(G.outer, NU, NV, (i, j) => [i / NU + 0.5, j / NV]);
  const tex = shirtCanvas(ch, C, { k, base: S.base, topPh, hemPh });
  const m = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); m.map = tex;
  parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(teal, 0.6)), false)); parts.add(mesh(G.hem, clothMat(teal, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, teal)); }
  // the camp collar: a flat rolled strip along the whole neckline, both V edges included
  { const open = 0.02, end = (th) => sstep(0, 0.2, Math.min(th - open, TAU - open - th)), cr = (th) => 0.0028 + 0.003 * end(th), wide = 4.6, cm = clothMat(teal, { side: THREE.DoubleSide });
    parts.add(mesh(rollOn(ch, { th0: open, th1: TAU - open, ph: (th) => topPh(th) - (cr(th) * wide * 0.5) / ch.ry, r: cr, wide: () => wide, lift: lift + 0.006, sink: 0.8, segs: 160, radial: 10 }), cm));
    const lm = clothMat(dark, { side: THREE.DoubleSide });   // the collar's edge line in the shade colour, a thin roll just inside it
    parts.add(mesh(rollOn(ch, { th0: open + 0.03, th1: TAU - open - 0.03, ph: (th) => topPh(th) + 0.0015 / ch.ry, r: (th) => 0.0016 * (0.4 + end(th)), wide: () => 1.4, lift: lift + 0.004, sink: 0.8, segs: 160, radial: 6 }), lm, false)); }
  // two pointed lapel flaps folded out over the chest (the underside shows: the shade teal), each from the V's point up to the shoulder, its tip down
  { const lm = clothMat(dark, { side: THREE.DoubleSide }), M = 10;
    for (const [sg, tipD, tipY] of [[1, 0.58, 0.19], [-1, 0.62, 0.2]]) {
      const A = [0.07, 0.252], B = [1.02, 0.393], Cc = [tipD, tipY], pos = [], idx = [];
      for (let j = 0; j <= M; j++) for (let i = 0; i <= M; i++) {
        const u = i / M, w = j / M, d = lerp(A[0] + u * (B[0] - A[0]), Cc[0], w), y = lerp(A[1] + u * (B[1] - A[1]), Cc[1], w), th = sg * d;
        const vv = Math.max(0, (topPh(th) - phY(y)) / (topPh(th) - hemPh)), q = G.at(th, vv, thick + 0.004 + 0.009 * w); pos.push(q.x, q.y, q.z);
      }
      for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + 1, c = a + M + 1, e = c + 1; idx.push(a, c, b, b, c, e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); parts.add(mesh(g, lm));
    } }
  // one drawn fold line down each side of the shirt (each its own wobble)
  { const fm = clothMat(shade(dark, 0.78));
    for (const [th0, a, b] of [[1.3, 0.45, 1.0], [-1.38, 0.5, 0.98]]) { const pts = []; for (let n = 0; n <= 16; n++) { const t = n / 16, v = lerp(a, b, t); pts.push(G.at(th0 + 0.05 * Math.sin(t * 3.3 + th0), v, thick + 0.002)); }
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.0018, 5, false);
      parts.add(mesh(g, fm, false)); } }
  // 3 buttons down the front
  { const bm = clothMat(C.buttons || "#f8f3e1", { roughness: 0.55 }), hm = clothMat(shade(C.buttons || "#f8f3e1", 0.6));
    for (const y of [0.213, 0.178, 0.143]) { const v = (topPh(0) - phY(y)) / (topPh(0) - hemPh), q = onG(G, 0.0001, v, thick + 0.004), b = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 14, 10), bm); b.scale.set(1, 1, 0.5); b.position.copy(q.p); b.lookAt(q.p.clone().add(q.n)); b.castShadow = true; parts.add(b);
      for (const dx of [-0.0028, 0.0028]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 6, 5), hm); h.position.copy(b.position).addScaledVector(q.n, 0.0042).add(V(dx, 0, 0)); parts.add(h); } } }
  // the badge: gold plate 0.10 x 0.06, one red star, no letters, on his left chest (+x)
  if (C.badge !== false) {
    const yb = 0.275 * k, ph = phY(yb / k), th = thOfX(ch, ph, 0.2 * (ch.rx / 0.4)), v = (topPh(th) - ph) / (topPh(th) - hemPh), q = onG(G, th, v, thick + 0.016);   // pinned on the lapel
    const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; };
    const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: C.plate || "#e8b93a", roughness: 0.35, metalness: 0.45 }); gold.userData.lookRole = "cloth";
    const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(0.1, 0.06, 0.012), { depth: 0.004, bevelEnabled: true, bevelSize: 0.0025, bevelThickness: 0.0022, bevelSegments: 2, curveSegments: 6 }), gold); plate.castShadow = true; g.add(plate);
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(0.088, 0.048, 0.009), { depth: 0.0005, bevelEnabled: false, curveSegments: 6 }), new THREE.MeshStandardMaterial({ color: shade(C.plate || "#e8b93a", 0.82), roughness: 0.4, metalness: 0.4 })); rim.position.z = 0.0066; rim.userData.noOutline = true; g.add(rim);
    const st = new THREE.Shape(), R0 = 0.0185, R1 = 0.0078; for (let i = 0; i < 10; i++) { const a = PI / 2 + (i * PI) / 5, r = i % 2 ? R1 : R0; (i ? st.lineTo : st.moveTo).call(st, Math.cos(a) * r, Math.sin(a) * r); } st.closePath();
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(st, { depth: 0.0012, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: C.star || "#b3261e", roughness: 0.5 })); star.position.set(0, -0.001, 0.0071); g.add(star);
    g.position.copy(q.p).addScaledVector(q.n, 0.0005); g.lookAt(q.p.clone().add(q.n)); g.rotateZ(-0.12); parts.add(g);
  }
  // short sleeves: wide, 0.12 long, hem ring, ending far before the wrist
  return sleeves(ch, clothMat(teal, { side: THREE.DoubleSide }), clothMat(dark), { r0: 0.085, r1: 0.065, len: 0.12, back: 0.05 });
}

// ------------------------------------------------------------------ flat sandals on the feet
function sandals(C, ch) {
  const soleM = clothMat(C.sole || "#f2c94c", { roughness: 0.7 }), strapM = clothMat(C.strap || "#b3261e", { roughness: 0.6 });
  const outline = (w, l) => { const s = new THREE.Shape(), n = 36; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, c = Math.cos(a), sn = Math.sin(a), x = Math.sign(c) * Math.abs(c) ** 0.8 * (w / 2) * (sn < 0 ? 1 : 0.86), y = Math.sign(sn) * Math.abs(sn) ** 0.8 * (l / 2); (i ? s.lineTo : s.moveTo).call(s, x, y); } s.closePath(); return s; };
  const soleG = new THREE.ExtrudeGeometry(outline(0.15, 0.245), { depth: 0.015, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 10 }); soleG.rotateX(-PI / 2);
  for (const s of ["L", "R"]) {
    const f = ch.legs?.[s]?.foot; if (!f) continue;
    const g = new THREE.Group(); g.scale.set(1 / 0.9, 1 / 0.5, 1 / 1.25); g.position.set(0, -0.035 / 0.5, 0);   // the foot ball is squashed (0.9, 0.5, 1.25) and 0.035 up: undo it, the floor at the group's origin
    const sole = mesh(soleG, soleM); sole.position.z = 0.012; g.add(sole);
    // one strap over the instep: a flat half ring across the foot
    const pts = []; for (let i = 0; i <= 16; i++) { const a = PI * (i / 16); pts.push(V(Math.cos(a) * 0.0705, 0.0148 + Math.sin(a) * 0.0615, 0.018)); }
    const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0048, 6, false), strapM); strap.scale.set(1, 1, 2.1); strap.castShadow = true; g.add(strap);
    f.add(g);
  }
}

// ------------------------------------------------------------------ skin marks: 6 potato-eye dimples and 8 freckles, each placed once by hand (th, ph on the body)
function skinMarks(C, ch, S) {
  const kk = Math.pow(S.Hh / 0.92, 0.7), dimM = new THREE.MeshStandardMaterial({ color: C.dimple || "#8f2f2a", roughness: 0.9 }), frM = new THREE.MeshStandardMaterial({ color: C.freckle || "#d97a62", roughness: 0.9 });
  dimM.userData.noOutline = frM.userData.noOutline = true;
  const D = [[-0.5, 0.95, 0.028, 0.4], [0.95, 0.82, 0.024, -0.3], [-1.5, 0.42, 0.03, 0.7], [2.1, 0.55, 0.026, 0.1], [-2.7, 0.66, 0.03, -0.6], [-2.95, 0.98, 0.022, 0.9]];
  const F = [[0.2, 0.9, 0.011], [-0.28, 0.82, 0.009], [0.62, 0.97, 0.008], [-1.05, 0.8, 0.012], [1.4, 0.64, 0.009], [-2.05, 0.74, 0.01], [2.7, 0.82, 0.011], [-2.35, 0.5, 0.008]];
  const put = (m, th, ph, r, rot, flat) => { const q = ch.surf(th, ph), o = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), m); o.scale.set(r * kk, r * kk * (0.7 + 0.5 * flat), 0.0035); o.position.copy(q.pos).addScaledVector(q.normal, -0.0008); o.lookAt(q.pos.clone().add(q.normal)); o.rotateZ(rot); ch.potatoParts.add(o); };
  D.forEach(([th, ph, r, rot], i) => put(dimM, th, ph, r, rot, hs(i, 40)));
  F.forEach(([th, ph, r], i) => put(frM, th, ph, r, (hs(i, 41) - 0.5) * 3, hs(i, 42)));
}

// ------------------------------------------------------------------ black shades (key `shades`): on the eyes, or pushed up on the forehead between the horns
function shadesOn(C, ch) {
  const col = C.shadesColor || "#1d1a20", lensM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.22, metalness: 0.1 }), frameM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
  frameM.userData.lookRole = lensM.userData.lookRole = "cloth";
  const L = ch.face.layout, pl = ch.face.place(-L.eyeU, L.eyeV), pr = ch.face.place(L.eyeU, L.eyeV);
  const mid = pl.pos.clone().add(pr.pos).multiplyScalar(0.5), nEye = pl.normal.clone().add(pr.normal).normalize(), hx = pl.pos.distanceTo(pr.pos) / 2;
  const lw = 0.075, lh = 0.047, r = lh * 0.8, sh = new THREE.Shape();
  sh.moveTo(-lw + r, -lh); sh.lineTo(lw - r, -lh); sh.quadraticCurveTo(lw, -lh, lw, -lh + r); sh.lineTo(lw, lh - r * 0.6); sh.quadraticCurveTo(lw, lh, lw - r * 0.6, lh); sh.lineTo(-lw + r * 0.6, lh); sh.quadraticCurveTo(-lw, lh, -lw, lh - r * 0.6); sh.lineTo(-lw, -lh + r); sh.quadraticCurveTo(-lw, -lh, -lw + r, -lh);
  const lensG = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 8 });
  const g = new THREE.Group(), glintM = new THREE.MeshBasicMaterial({ color: C.shadesGlint || "#4a4452" }); glintM.userData.noOutline = true;
  for (const sg of [-1, 1]) {
    const l = new THREE.Mesh(lensG, lensM); l.position.set(sg * hx, 0, 0); l.rotation.y = sg * 0.16; l.castShadow = true; g.add(l);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(lw * 0.7, 0.008), glintM); glint.position.set(sg * hx - lw * 0.2, lh * 0.35, 0.0115); glint.rotation.z = 0.35; g.add(glint);
    const temple = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.05, 3, 8), frameM); temple.rotation.x = PI / 2; temple.position.set(sg * (hx + lw + 0.008), 0.004, -0.03); g.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 2 * (hx - lw) + 0.012, 3, 8), frameM); bridge.rotation.z = PI / 2; bridge.position.set(0, lh * 0.25, 0.005); g.add(bridge);
  ch.potatoParts.add(g);
  // the two poses: on the eyes (in front of the bulbs), and up on the forehead (the front of the crown between the horns, tipped back)
  const Z = V(0, 0, 1), eyeQ = new THREE.Quaternion().setFromUnitVectors(Z, nEye), eyeP = mid.clone().addScaledVector(nEye, 0.045);
  const up = ch.surf(0, 1.12), upN = up.normal.clone(), upQ = new THREE.Quaternion().setFromUnitVectors(Z, upN), upP = up.pos.clone().addScaledVector(upN, 0.02);
  const norm = (v) => (v === true || v === "on" ? 1 : v === "up" ? 2 : +v || 0), spec = Array.isArray(C.shades) ? C.shades.map(([t, v]) => [t, norm(v)]) : norm(C.shades);
  const at = (t) => { if (!Array.isArray(spec)) return spec; if (t <= spec[0][0]) return spec[0][1]; for (let i = 1; i < spec.length; i++) if (t <= spec[i][0]) return lerp(spec[i - 1][1], spec[i][1], (t - spec[i - 1][0]) / Math.max(1e-6, spec[i][0] - spec[i - 1][0])); return spec[spec.length - 1][1]; };
  return (t) => {
    const v = Math.max(0, Math.min(2, at(t))); g.visible = v > 0.001; if (!g.visible) return;
    const p = clamp01(v - 1), e = p * p * (3 - 2 * p);
    g.position.copy(eyeP).lerp(upP, e).addScaledVector(V(0, 0, 1), 0.03 * Math.sin(PI * e)); g.quaternion.copy(eyeQ).slerp(upQ, e);
  };
}

export function devilKit(C, ch) {
  const S = bodySize(ch);
  horns(C, ch, S);
  skinMarks(C, ch, S);
  const tailUp = tail(C, ch, S);
  sandals(C, ch);
  const sl = C.shirt === false ? () => {} : shirt(C, ch, S);
  const shadesUp = C.shades == null || C.shades === false ? null : shadesOn(C, ch);   // key shades: absent = nothing built, the Devil is unchanged
  return { sl, apply: (st, t) => { tailUp(st, t); shadesUp && shadesUp(t); } };
}
