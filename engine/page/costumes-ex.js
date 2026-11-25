import * as THREE from "three";
import { taperedTube } from "./geo.js";
import { garment, band, clothMat, liningMat, foldInk, inkMesh, sstep, scalp } from "./costumes-art.js";
import { hash2, knitTexture, ribTexture } from "./costumes-art-cast.js";

// Potato Desk "Heaven's terms and conditions" (storyboards/series/potato-desk/heaven-terms/DESIGN.md section 4): THE EX, the hero's ex who docks
// next door and hugs him. Costume type `ex` (characters/potatobrawl/ex.json); registered in costumes-cast.js (CAST_TYPES + one dispatch line).
// Hand-drawn Ghibli look: every stitch, hair stroke, freckle and lash is its own mark, placed once from a fixed hash (no tiling, no Math.random).
// All heights are metres above the FLOOR (she stands 0.98: body 0.84 high, its bottom 0.14 up; mouth 0.48, eyes about 0.62, bun top 1.12).
//
// WHAT IT DRAWS
//   hair      no leaf. A small scalp cap (footprint r 0.12, #9a6a42) on the crown, a HIGH BUN r 0.085 on it (same colour, 5 hair strokes #7a4f2e, each its
//             own arc), 2 loose wisps 0.04 long (one each side, hanging from the cap's edge). The bun sits on the hat mount: it trails her head a frame
//             behind (the engine's follow-through) and bobs 0.01.
//   scrunchie a torus (R 0.05, tube 0.018) #f2c94c round the bun's foot with 6 gather strokes #d9a93a, each its own length and lean.
//   cardigan  lilac knit #b79fe0 (shade #9a82c8), the hand-drawn knit of Spud's sweater (knitTexture: every stitch its own stroke), OPEN at the front:
//             a V of white top 0.04 wide at the collar and 0.16 wide at the hem. Collar front at y 0.37, back 0.47; hem y 0.22. Rolled collar that runs
//             down both edges of the V (the placket), a ribbed hem and ribbed cuffs, 3 buttons #f3ead2 on HER LEFT panel (+x), each a little different.
//             Sleeves end 0.05 before the wrist (cuffGap 0.105 from the hand's centre) with a ribbed cuff.
//   top       a white top #fbf8f0 under it (a rolled neck band, plain cloth), seen in the V.
//   skirt     a cream band #e9dcc6 0.06 below the cardigan's hem (y 0.22 -> 0.16), tucked under the hem.
//   flats     lilac #9a82c8 with a paler sole line #cdbdea (the shoes build of costumes-everyday.js handsAndFeet); legs cream (limbs.color); pale hands.
//   face      3 long lashes per eye (tapered, riding the lid: they follow every blink), 5 pale freckles #f6cda6 under the eyes (the face's own decals).
//   skin      body.keepSkin true in ex.json: light rosy-tan #ecb787, cheeks #ff9aa8 (castLook "sheet" would otherwise turn it golden).
// COSTUME KEYS (ex.json "costume"; all optional): cardigan "#b79fe0", cardiganShade "#9a82c8", top "#fbf8f0", skirt "#e9dcc6", flats "#9a82c8", hair "#9a6a42",
//   hairShade "#7a4f2e", scrunchie "#f2c94c", button "#f3ead2", hands "#f6dcae" (the glove skin), cuffGap 0.105 (m the cuff ends before the hand's centre).
// FACES: ex.json default `happy` (curve 1.0 in face.neutral); hug: expr "serene" with curve 1.0 (eyes shut, beaming). Bench:
//   storyboards/series/potato-desk/heaven-terms/bench/make-cast-bench.mjs.

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3 + 41, i * 0.71 + n * 1.7 + 9.2);   // a hash 0..1 for mark i, channel n (the ex's seed 41)
// the elevation at which the body's surface (meridian th) is y metres above the floor
const elOfY = (ch, y, th = 0, lo = -1.45) => { let a = lo, b = 1.5; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; };
// a function of th from a table (the neckline: one bisection per sample, not per vertex)
const tabled = (f, n = 96) => { const T = []; for (let i = 0; i <= n; i++) T.push(f((i / n) * TAU)); return (th) => { const q = (((th % TAU) + TAU) % TAU) / TAU * n, i = Math.min(n - 1, Math.floor(q)), k = q - i; return T[i] + (T[i + 1] - T[i]) * k; }; };

// a grid of points (nu + 1 columns, nv + 1 rows) as a mesh, wound as costumes-art.js gridMesh (the faces look out)
function grid(pts, nu, nv, uv) {
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); if (uv) g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- sleeves: Spud's (costumes-art-cast.js spud) as costumes-everyday.js `sleeves`: a tube along the arm's own curve, rebuilt every frame, ending
// SL.gap metres before the hand's centre, with one frame carried along the arm without twist; the last SL.cuffAt..1 is the cuff (its own piece and map)
function knitSleeves(ch, armM, cuffM, SL) {
  const slv = {}, cuf = {};
  for (const s of ["L", "R"]) for (const [set, m] of [[slv, armM], [cuf, cuffM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), R = 16, N = 16, NC = Math.max(2, Math.round(N * (1 - SL.cuffAt)));
  const radius = (t) => t < SL.cuffAt ? SL.r0 + (SL.r1 - SL.r0) * (t / SL.cuffAt) : (SL.rc + SL.cuff * Math.sin(PI * (t - SL.cuffAt) / (1 - SL.cuffAt))) * (1 - 0.22 * sstep(0.9, 1, t));
  const tube = (curve, ua, ub, ta, tb, n) => {
    const pos = new Float32Array((n + 1) * (R + 1) * 3), uv = new Float32Array((n + 1) * (R + 1) * 2), idx = [];
    for (let i = 0; i <= n; i++) {
      const t = ta + (tb - ta) * (i / n), u = ua + (ub - ua) * (i / n), p = curve.getPointAt(u), T = curve.getTangentAt(u);
      _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
      const r = radius(t);
      for (let k = 0; k <= R; k++) {
        const a = (k / R) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k;
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
      if (SL.cuffLen) SL.cuffAt = Math.max(0.5, Math.min(0.97, 1 - SL.cuffLen / (L * (to - SL.from))));
      const mid = SL.from + (to - SL.from) * SL.cuffAt;
      const T0 = curve.getTangentAt(SL.from), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const g1 = tube(curve, SL.from, mid, 0, SL.cuffAt, N - NC), g2 = tube(curve, mid, to, SL.cuffAt, 1, NC);
      slv[s].geometry.dispose(); slv[s].geometry = g1; slv[s].visible = true;
      cuf[s].geometry.dispose(); cuf[s].geometry = g2; cuf[s].visible = true;
    }
  };
}

// ---------- pale hands, no ink hull on the cream legs, flats: the foot in lilac with a paler sole line (as costumes-everyday.js handsAndFeet `shoes`)
function handsAndFlats(C, ch) {
  const pale = C.hands || "#f6dcae";
  if (ch.skinMat) ch.skinMat.color.set(pale);
  if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(pale);
  if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(pale); hm.userData = { ...ch.limbMat.userData };
    for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); }
  if (ch.limbMat) ch.limbMat.userData.noOutline = true;
  if (ch.limbMat) {
    const fl = C.flats || "#9a82c8", sm = ch.limbMat.clone(); sm.color.set(fl); sm.userData = { ...ch.limbMat.userData, noOutline: true };
    const soleM = clothMat(C.sole || "#cdbdea");
    for (const s of ["L", "R"]) {
      const f = ch.legs?.[s]?.foot; if (!f) continue; f.material = sm;
      const so = new THREE.Mesh(new THREE.TorusGeometry(0.071, 0.01, 8, 36), soleM); so.rotation.x = PI / 2; so.position.y = -0.03; f.add(so);
    }
  }
}

// ---------- hair: scalp cap on the body, the bun (with scrunchie and strokes) on the hat mount, two loose wisps ---------------------------------------
function hairMat(color) { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 }); m.userData.lookRole = "hair"; m.userData.noOutline = true; return m; }
function hair(C, ch) {
  const parts = ch.potatoParts, hairC = C.hair || "#9a6a42", dark = C.hairShade || "#7a4f2e", capM = hairMat(hairC), darkM = hairMat(dark), wispM = hairMat(hairC);
  // the cap: elevation above ~1.27 rad on the crown, its edge a little wavy (footprint r 0.12 on the head)
  parts.add(mesh(scalp(ch, (az, el) => sstep(1.25 + 0.025 * Math.sin(az * 3 + 1) + 0.015 * Math.sin(az * 7), 1.3 + 0.025 * Math.sin(az * 3 + 1), el), 0.008, 0.002), capM, false));
  // two wisps from the cap's edge (front-left of the crown and back-right), each a tapered curl hanging 0.04
  [[0.95, 1.2, 1, 0.055], [-2.3, 1.14, -1, 0.05]].forEach(([az, el, sd, len], i) => {
    const q = ch.surf(az, el), n = q.normal, side = V(Math.cos(az), 0, -Math.sin(az)).multiplyScalar(sd * 0.012);
    const p0 = q.pos.clone().addScaledVector(n, 0.012), p1 = p0.clone().addScaledVector(n, 0.014).add(V(0, -len * 0.4, 0)).add(side), p2 = p1.clone().add(V(0, -len * 0.55, 0)).addScaledVector(n, 0.004).add(side.clone().multiplyScalar(-1.2));
    parts.add(mesh(taperedTube(new THREE.CatmullRomCurve3([p0, p1, p2]), 0, 0, 14, 6, (t) => 0.0055 * (1 - t * 0.8)), wispM, false));
  });
  // the bun: on the hat mount (origin = the crown's top). A lathe r 0.085, 0.14 tall, gathered at its foot, with 5 strokes of the darker hair
  const top = ch.topY() * (ch.bodyGroup?.scale?.y ?? 1), g = new THREE.Group(), bun = new THREE.Group(); g.add(bun);
  const prof = [[0.0, 0.0], [0.046, 0.006], [0.062, 0.03], [0.081, 0.062], [0.085, 0.092], [0.07, 0.122], [0.04, 0.14], [0.0, 0.146]].map(([r, y]) => new THREE.Vector2(r, y));
  const bunMesh = mesh(new THREE.LatheGeometry(prof, 28), capM); bunMesh.position.set(0, 0.0, -0.012); bun.add(bunMesh);
  for (let k = 0; k < 5; k++) {   // each stroke: an arc over the bun's surface, its own start, sweep and length
    const a0 = (k / 5) * TAU + (hs(k, 1) - 0.5) * 0.7, sweep = 0.6 + 0.5 * hs(k, 2), y0 = 0.02 + 0.03 * hs(k, 3), y1 = 0.1 + 0.035 * hs(k, 4), pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, y = y0 + (y1 - y0) * u, r = bunRadius(prof, y) + 0.0022, a = a0 + sweep * u * (k % 2 ? 1 : -1); pts.push(V(Math.sin(a) * r, y, -0.012 + Math.cos(a) * r)); }
    bun.add(mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 16, 5, (t) => 0.0034 * Math.pow(Math.sin(PI * Math.min(1, 0.1 + t * 0.9)), 0.6)), darkM, false));
  }
  // the scrunchie round the bun's foot (a flat torus), 6 gather strokes across its tube, each its own place and length
  const scrM = clothMat(C.scrunchie || "#f2c94c"), gathM = clothMat(shade(C.scrunchie || "#f2c94c", 0.82)), scr = mesh(new THREE.TorusGeometry(0.05, 0.018, 10, 32), scrM); scr.rotation.x = PI / 2; scr.position.set(0, 0.012, -0.012); scr.scale.set(1, 1, 0.8); bun.add(scr);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + (hs(k, 5) - 0.5) * 0.4, p0 = -0.6 + 0.5 * hs(k, 6), p1 = 1.3 + 0.5 * hs(k, 7), pts = [];
    for (let i = 0; i <= 6; i++) { const ph = p0 + (p1 - p0) * (i / 6), rr = 0.05 + 0.0192 * Math.cos(ph), y = 0.012 + 0.0192 * 0.8 * Math.sin(ph); pts.push(V(Math.sin(a) * rr, y, -0.012 + Math.cos(a) * rr)); }
    bun.add(mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 10, 4, (t) => 0.0017 * Math.sin(PI * (0.1 + 0.8 * t))), gathM, false));
  }
  const bunY = 0.0;
  return { group: g, height: 0.15, top, sway(tip) { bun.rotation.x = 0.08 + (tip[0] || 0) * 0.5; bun.rotation.z = -0.06 - (tip[1] || 0) * 0.5; bun.position.y = bunY; } };   // (buildCostume tips every hat group -0.08 / 0.06: the bun stands straight)
}
const bunRadius = (prof, y) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i].y) { const k = (y - prof[i - 1].y) / Math.max(1e-6, prof[i].y - prof[i - 1].y); return prof[i - 1].x + (prof[i].x - prof[i - 1].x) * k; } return 0.0; };

// ---------- face marks: 3 long lashes on each upper lid (they ride the lid), 5 pale freckles -----------------------------------------------------------
function faceMarks(C, ch) {
  const F = ch.face; if (!F) return;
  // lashes: from the outer third of the lid line, each its own length and curl; in the lid pivot's frame (the lid edge circle in x-z at y -0.015 r)
  for (const eye of F.eyes || []) {
    const host = eye.lidPivot || eye.lid; if (!host) continue;
    const side = eye.side, r = eye.r;
    [[2.2, 0.85, 0.35], [2.55, 1.05, 0.42], [2.88, 0.9, 0.3]].forEach(([ph, len, up], k) => {
      const cx = -side * Math.cos(ph), cz = Math.sin(ph), b = V(cx * r * 1.07, -0.015 * r, cz * r * 1.07), L = r * len * (0.9 + 0.2 * hs(k + (side > 0 ? 3 : 0), 8));
      const out = V(cx, 0, cz).normalize(), tan = V(side * Math.sin(ph), 0, Math.cos(ph)), curl = (hs(k + (side > 0 ? 3 : 0), 9) - 0.5) * 0.3;
      const d1 = out.clone().multiplyScalar(0.8).addScaledVector(tan, 0.45 + curl).add(V(0, up, 0)).normalize(), d2 = out.clone().multiplyScalar(0.7).addScaledVector(tan, 0.3 + curl).add(V(0, up + 0.55, 0)).normalize();
      const p1 = b.clone().addScaledVector(d1, L * 0.5), p2 = p1.clone().addScaledVector(d2, L * 0.5);
      host.add(new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3([b, p1, p2]), 0, 0, 12, 5, (t) => r * 0.07 * (1 - t * 0.85)), F.inkMat));
    });
  }
  // freckles: soft pale dots, one decal each, placed by hand on the cheeks under the eyes (face u, v)
  const cv = document.createElement("canvas"); cv.width = cv.height = 32; const g = cv.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 15);
  gr.addColorStop(0, "rgba(246,205,166,0.95)"); gr.addColorStop(0.6, "rgba(246,205,166,0.85)"); gr.addColorStop(1, "rgba(246,205,166,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  [[-0.29, 0.1, 0.017], [-0.4, 0.07, 0.013], [-0.34, 0.015, 0.015], [0.3, 0.095, 0.014], [0.41, 0.04, 0.017]].forEach(([u, v, w]) => {
    const m = F._decal(u, v, w, w * 0.9, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 0.0045); m.userData.noOutline = true; m.renderOrder = 2;
  });
}

// ---------- the cardigan, the white top and the skirt band ---------------------------------------------------------------------------------------------
function clothes(C, ch) {
  const parts = ch.potatoParts, lilac = C.cardigan || "#b79fe0", lilacD = C.cardiganShade || "#9a82c8", white = C.top || "#fbf8f0", cream = C.skirt || "#e9dcc6";
  const yF = 0.40, yB = 0.54, hemY = 0.22;
  const neck = tabled((th) => elOfY(ch, yF + (yB - yF) * 0.5 * (1 - Math.cos(th)), th)), hem = elOfY(ch, hemY), top = neck(0);
  const NU = 180, NV = 36, TH0 = 0.07, TH1 = 0.27, tho = (v) => TH0 + (TH1 - TH0) * Math.pow(v, 1.1);   // the V: half-angle of the opening at height v (0 collar .. 1 hem)
  // the white top under it: a plain garment from the neckline to under the hem, a rolled neck band (the V shows it)
  { const m = clothMat(white, { side: THREE.DoubleSide, vertexColors: true }), G = garment(ch, { topFn: neck, top, hem: hem - 0.06, folds: 5, depth: 0.007, flare: 0.006, lift: 0.015, lift0: 0.012, wave: 0.004, thick: 0.012, phase: 0.4, grad: 0.16, segs: NU, rows: NV });
    parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(white, 0.7)), false)); parts.add(mesh(G.hem, clothMat(white, { side: THREE.DoubleSide }), false));
    const neckBand = band(ch, { ph: neck(0), tilt: neck(PI) - neck(0), w: 0.02, t: 0.024, lift: 0.014, round: 1, segs: 160 }); parts.add(mesh(neckBand, clothMat(shade(white, 0.97), { side: THREE.DoubleSide }), false)); }
  // the cardigan: garment()'s own surface (folds, flare) cut open at the front by a V; one hand-drawn knit map over it
  const G = garment(ch, { topFn: neck, top, hem, folds: 6, depth: 0.012, flare: 0.014, lift: 0.022, lift0: 0.014, wave: 0.005, thick: 0.016, phase: 0.9, grad: 0.24, segs: NU, rows: NV });
  const knit = knitTexture(40, 12, 1024, 512, 6.7), knitArm = knitTexture(9, 5, 256, 256, 11.3, true), rib = ribTexture(48, 1024, 64, 7.9), ribHem = ribTexture(60, 1024, 64, 8.4), ribCuff = ribTexture(14, 256, 64, 9.1);
  const tint = new THREE.Color(lilac).multiplyScalar(1.3); tint.r = Math.min(1, tint.r); tint.g = Math.min(1, tint.g); tint.b = Math.min(1, tint.b);
  const wool = (map, extra = {}) => { const m = clothMat(tint, { side: THREE.DoubleSide, ...extra }); m.map = map; return m; };
  const top0 = Math.max(neck(0), neck(PI)), outer = [], inner = [], uv = new Float32Array((NU + 1) * (NV + 1) * 2);
  for (let j = 0; j <= NV; j++) {
    const v = j / NV, th0 = tho(v);
    for (let i = 0; i <= NU; i++) {
      const th = th0 + (TAU - 2 * th0) * (i / NU), tp = neck(th), k = (j * (NU + 1) + i) * 2;
      outer.push(G.at(th, v, 0.016)); inner.push(G.at(th, v, 0));
      uv[k] = th / TAU; uv[k + 1] = (tp + (hem - tp) * v - hem) / (top0 - hem);
    }
  }
  const go = grid(outer, NU, NV, uv), gi = grid(inner, NU, NV);
  parts.add(mesh(go, wool(knit, { vertexColors: false }))); parts.add(mesh(gi, liningMat(lilacD), false));
  // the fold ink: one brush line down each deep fold, only on the panels (clear of the V)
  { const ig = foldInk({ at: G.at, fold: { ...G.fold, closed: false, from: TH1 + 0.06, to: TAU - TH1 - 0.06 } }, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, lilac)); }
  // the collar roll round the back, running on down both edges of the V (the placket): ONE tube, ribbed across its length
  { const pts = [], edge = (v, sd) => { const th = sd > 0 ? tho(v) : TAU - tho(v); return G.at(th, v, 0.009); };
    for (let j = 24; j >= 0; j--) pts.push(edge(j / 24, 1));   // up the +x (her left) edge from the hem to the collar
    for (let i = 1; i < 60; i++) { const th = tho(0) + (TAU - 2 * tho(0)) * (i / 60); pts.push(G.at(th, 0, 0.012)); }   // over the shoulders and the back
    for (let j = 0; j <= 24; j++) pts.push(edge(j / 24, -1));   // down the other edge to the hem
    const curve = new THREE.CatmullRomCurve3(pts), r = (t) => (0.011 + 0.01 * Math.pow(Math.sin(PI * t), 0.8)) * (1 - 0.15 * sstep(0.9, 1, t));
    const m = clothMat(shade(lilac, 0.96), { side: THREE.DoubleSide }); m.map = rib;
    parts.add(mesh(taperedTube(curve, 0, 0, 200, 14, r), m)); }
  // the ribbed hem along the bottom edge (between the two placket ends)
  { const pts = []; for (let i = 0; i <= 80; i++) { const th = tho(1) + (TAU - 2 * tho(1)) * (i / 80); pts.push(G.at(th, 1, 0.008)); }
    const m = clothMat(shade(lilac, 0.94), { side: THREE.DoubleSide }); m.map = ribHem; parts.add(mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 160, 12, (t) => 0.016 * (0.75 + 0.25 * Math.sin(PI * t) ** 0.4)), m)); }
  // 3 buttons on HER LEFT panel (+x), each a little different: size, turn, two holes
  { const bM = clothMat(C.button || "#f3ead2", { roughness: 0.55 }), hM = clothMat("#b4a98a");
    [[0.3, 0.0126, 0.35, 0.09], [0.52, 0.0118, 1.1, 0.085], [0.74, 0.0131, 2.0, 0.095]].forEach(([v, r, rot, dx], k) => {
      const th = tho(v) + dx, p = G.at(th, v, 0.02), q = G.at(th + 0.01, v, 0.016).sub(G.at(th - 0.01, v, 0.016)), u = G.at(th, Math.min(1, v + 0.01), 0.016).sub(G.at(th, Math.max(0, v - 0.01), 0.016)), n = new THREE.Vector3().crossVectors(u, q).normalize();
      if (n.x * p.x + n.z * p.z < 0) n.negate();
      const b = new THREE.Group(); b.position.copy(p); b.quaternion.setFromUnitVectors(V(0, 1, 0), n);
      const disc = mesh(new THREE.CylinderGeometry(r, r * 1.04, 0.006, 20), bM, false); b.add(disc);
      for (const s of [-1, 1]) { const h = mesh(new THREE.CylinderGeometry(0.0017, 0.0017, 0.0075, 6), hM, false); h.position.set(Math.cos(rot) * s * r * 0.34, 0.0004, Math.sin(rot) * s * r * 0.34); b.add(h); }
      b.rotation.y += 0; parts.add(b);
    }); }
  // the cream skirt band under the hem: tucked under the cardigan, 0.06 down to y 0.16, a hair of flare
  { const sk = garment(ch, { top: elOfY(ch, hemY + 0.05), hem: elOfY(ch, hemY - 0.06), folds: 7, depth: 0.006, flare: 0.03, lift: 0.014, lift0: 0.012, wave: 0.004, thick: 0.012, phase: 0.2, grad: 0.1, segs: 140, rows: 8 }), m = clothMat(cream, { side: THREE.DoubleSide, vertexColors: true });
    parts.add(mesh(sk.outer, m)); parts.add(mesh(sk.inner, liningMat(shade(cream, 0.65)), false)); parts.add(mesh(sk.hem, clothMat(cream, { side: THREE.DoubleSide }), false)); }
  // sleeves: end 0.05 before the wrist, a ribbed cuff
  const SL = { from: 0.04, gap: C.cuffGap ?? 0.105, r0: 0.076, r1: 0.058, rc: 0.052, cuff: 0.011, cuffAt: 0.82 };
  const cuffM = clothMat(shade(lilac, 0.96), { side: THREE.DoubleSide }); cuffM.map = ribCuff;
  const armM = wool(knitArm);
  return knitSleeves(ch, armM, cuffM, SL);
}

export const EX_TYPES = ["ex"];
export function ex(C, ch, out) {
  const sl = clothes(C, ch), h = hair(C, ch);
  faceMarks(C, ch);
  handsAndFlats(C, ch);
  out.hat = h; out.sitDepth = 0;
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); };
  return out;
}
