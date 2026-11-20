import * as THREE from "three";
import { clamp, lerp } from "./util.js";

// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md section D): the HEART and the
// BEETLE CHARM. Axes: metres, x right, y up, z toward the default camera; a prop faces +z at rot 0. Every mark is drawn once
// (canvas textures, cached per green) from its index and a fixed seed: no Math.random, no clock. Hand-drawn look: the engine
// puts the ink on the hard edges; the face is a see-through canvas laid on the heart's front, redrawn only when its state changes.
//
// KINDS
//   heartface    the cartoon heart (never anatomical). Origin: its CONTACT POINT (the bottom centre of the flattened foot, y 0);
//                it faces +z and leans back 6 degrees (top toward -z). Body 0.20 wide x 0.19 tall x 0.13 deep (lobes r 0.062, cleft
//                0.03, foot 0.05 wide): glossy #e3262e, shade #a8141f on the lower right third, bounce #ff7a6e along the lower left
//                edge, a GOLD reflection of the dish 0.02 high at the foot; gloss = one kidney 0.035 x 0.020 + a dot 0.008 (#ffffff) on
//                the upper left lobe and a thin rim light (#ffb0a8) on the right lobe. Eyes (-0.030, +0.030 | 0.118) ovals 0.017 x 0.024
//                #1a1014 with a 0.005 catch-light, brows 0.018 long 0.012 above, mouth (0, 0.082) 0.022 wide (line and inside #6e0f18,
//                tongue #ff8a8a). The face reads at 250 px of heart width or more (frame 0.85 m wide or less).
//                spec keys (all also tween with a "prop" action; seed the ones that are not propState keys with a dur-0 set first):
//                  who "chip" (default) | "spud"   spud = the whole heart x 1.15 (same colours); spec.scale multiplies on top of it
//                  blink 0..1 (0)   1 = lids shut (a curved line). NOT read from the spec: tween it (propState seeds it at 0)
//                  mouth 0..1 (0)   talk: 0 a line, 1 an open oval 0.024 x 0.030 with the tongue
//                  smug 0..1 (0)    half lids, flat brows (one raised), a one-sided smirk
//                  seal 0..1 (0)    lips pressed to a wavy line, cheeks puff (lobes 8 % fatter beside the mouth), eyes wide with white
//                                   and turned to the charm, the whole face slides 0.012 toward +x (panel 18)
//                  sweat 0..1 (0)   ONE bead r 0.014 on the upper left lobe, slides 0.05 m down every 1.2 s (the clip clock), nothing flies off
//                  squish 0..1 (0)  opening 02: height x 0.55, width x 1.30 (reached at 0.95), eyes shut as two chevrons, mouth wide.
//                                   At 1 the whole heart is HIDDEN (the jaws are shut, H's burst starts). Never shown bitten
//                  lookX, lookY -1..1 (0)   the eye ovals slide up to 0.0035; seal adds the turn to the charm on top
//                  beat 0..1 (0.3), rate Hz (1.2)   a two-thump pulse, a 4 % swell at beat 1
//                  lean -1..1 (0)   15 degrees about the contact point toward +x (a speaker); hop 0..1 (0) = a 0.03 m lift (tween it per syllable)
//                  charm 0..1 (0)   the beetle charm stuck on the front: centre (-0.040, 0.070), long axis 20 degrees off upright (head up,
//                                   tilted to the right), proud 0.026 m. 0 hidden, 0..1 it arrives from 0.07 m in front along the surface
//                                   normal; 1 = stuck. slap 0..1 (0) = the 2-frame 8 % squash of the slap (tween 0 -> 1 -> 0 in 2 frames)
//   heartscarab  the heart scarab charm, 0.085 long x 0.062 wide x 0.028 thick (legs included in the width), standing: origin = the
//                CENTRE of the flat underside (z 0, the underside faces -z), the head up (+y), the carved back toward +z (dome to z 0.028).
//                Polished dark green stone #2f5a3c (light #4f8a5c, deep #1c3524). Back: head plate with 4 notches and 2 eye bumps, shoulder
//                plate with a border and 2 curved V marks, 2 wing cases (centre seam, 5 grooves each, a triangle notch at each shoulder), 6 legs
//                in low relief (4-5 saw notches on the front pair). Underside: raised oval border, 3 registers parted by double lines
//                (reeds + boat with 2 potato rowers / seated potato on a throne + offering table with 3 loaves and a jar + lotus /
//                4 reeds + a jackal lying on a shrine + a feather), cut lines 0.6 mm filled pale #a9d6a0, gilding #c9b45a in 30 % of them.
//                Stone: 30 pale flecks #9fc49a, 2 darker veins, a soft highlight, 2 tiny rim chips, the thread hole's 2 mm ends at head and tail.
//                spec: green 0..4 (0) picks #2f5a3c #3a6b47 #27503a #4a7a52 #5d8a5a; glint 0..1 (0) one highlight sweep across the back.
//                Lying on a palm, underside up, head to +z: tip 90 (tip leans the top toward +z). Lying back up: tip -90.
//                HELD (proof: node storyboards/lookdev/make-grip-tests.mjs --prop heartscarab --hold thin|mug, sheet heart-grip-sheet.png). The
//                director adds the SIZE entry to storyboards/lib/grips.mjs: heartscarab: { len: 0.05, r: 0.007, h: 0 }. THIN (panel 16): the
//                default pinch (0.6 x len = y +0.030) is on the head plate, the body hangs below the fingertips. FIST (panel 23): grips.mug with
//                { gap: 0.02 } (h 0 = the fist at the middle, both ends peek out). The held frame shows the UNDERSIDE to a camera in front of
//                the holder (placeFor rot = yaw + 180 turns the carved back toward the holder): add placeFor { turn: 180 } to show the back.
//                Lying on an open palm (panel 17, underside up, head to +z): tip 90, origin 0.004 above the palm.
//                HEART_HEART_GRIPS.heartscarab: shoulder, mid, head, tail, back, underside, palm.
//
// Exported for props-heart-case.js: makeScarab(), SCARAB_GREENS.

const DEG = Math.PI / 180;
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const decal = (tex) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const hexRGB = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mix = (a, b, k) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), k); return `#${c.getHexString()}`; };
// a smooth curve through [x, y] control points (cubic Hermite, finite-difference tangents)
function curve(pts) {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    let i = 1; while (pts[i][0] < x) i++;
    const p0 = pts[i - 1], p1 = pts[i], pm = pts[i - 2] || p0, pn = pts[i + 1] || p1, h = p1[0] - p0[0], t = (x - p0[0]) / h;
    const m0 = ((p1[1] - pm[1]) / (p1[0] - pm[0])) * h, m1 = ((pn[1] - p0[1]) / (pn[0] - p0[0])) * h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p0[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1[1] + (t3 - t2) * m1;
  };
}

// ============================================================================================================ THE SCARAB
export const SCARAB_GREENS = ["#2f5a3c", "#3a6b47", "#27503a", "#4a7a52", "#5d8a5a"];
const SL = 0.085, SHW = 0.0275, SHL = 0.0445;   // length; the texture covers x +-0.0275, y +-0.0445
const WIDTH = curve([[0, 0.0135], [0.03, 0.0150], [0.12, 0.0160], [0.19, 0.0170], [0.235, 0.0212], [0.34, 0.0240], [0.45, 0.0255], [0.58, 0.0262], [0.72, 0.0252], [0.85, 0.0212], [0.94, 0.0135], [0.985, 0.006], [1, 0]]);
const THICK = curve([[0, 0.0085], [0.1, 0.0105], [0.19, 0.0125], [0.235, 0.0165], [0.4, 0.0215], [0.5, 0.0265], [0.6, 0.028], [0.75, 0.0258], [0.9, 0.0185], [1, 0.011]]);
const yOfV = (v) => SL / 2 - SL * v;
const NOTCH_X = [-0.009, -0.003, 0.003, 0.009];
const notchDepth = (x) => NOTCH_X.reduce((s, xk) => s + Math.max(0, 1 - Math.abs(x - xk) / 0.0017) * 0.0018, 0);
function domeH(u, v, x, y) {
  const sp = Math.pow(1 - Math.pow(Math.abs(u), 2.8), 0.55);
  const c0 = v < 0.045 ? Math.sqrt(1 - Math.pow(1 - v / 0.045, 2)) : 1, c1 = v > 0.94 ? Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.94) / 0.06, 2))) : 1;
  let h = THICK(v) * sp * c0 * c1;
  const k = clamp(sp * 2.5) * c0 * c1;
  const ye = yOfV(0.12);
  h += 0.0022 * k * (Math.exp(-(((x - 0.0085) ** 2 + (y - ye) ** 2) / (2 * 0.0022 ** 2))) + Math.exp(-(((x + 0.0085) ** 2 + (y - ye) ** 2) / (2 * 0.0022 ** 2))));   // the eye bumps
  h += 0.0013 * k * ss((v - 0.19) / 0.03) * (1 - ss((v - 0.41) / 0.03));                              // the shoulder plate stands proud
  h -= 0.0007 * k * Math.exp(-(((v - 0.195) / 0.008) ** 2));                                           // groove between head and shoulder plate
  h -= 0.0006 * k * Math.exp(-(((v - 0.425) / 0.008) ** 2));                                           // groove between shoulder plate and wing cases
  if (v > 0.43) { const w = ss((v - 0.43) / 0.02) * (1 - ss((v - 0.96) / 0.03)); h -= 0.001 * k * w * Math.exp(-((x / 0.0007) ** 2)); h *= 1 - 0.05 * w * (1 - ss(Math.abs(x) / 0.014)); }   // the centre seam
  return Math.max(0, h);
}
let GEO = null;
function scarabGeo() {
  if (GEO) return GEO;
  const NU = 56, NV = 104, pos = [], uvT = [], uvB = [], idx = [], base = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const v = j / NV, u = -1 + (2 * i) / NU, x = u * WIDTH(v), y = yOfV(v) - notchDepth(x) * Math.max(0, 1 - v / 0.07), z = domeH(u, v, x, y);
    pos.push(x, y, z); base.push(x, y, 0); uvT.push((x + SHW) / (2 * SHW), (y + SHL) / (2 * SHL)); uvB.push((-x + SHW) / (2 * SHW), (y + SHL) / (2 * SHL));
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const dome = new THREE.BufferGeometry(); dome.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); dome.setAttribute("uv", new THREE.Float32BufferAttribute(uvT, 2)); dome.setIndex(idx); dome.computeVertexNormals();
  const under = new THREE.BufferGeometry(); under.setAttribute("position", new THREE.Float32BufferAttribute(base, 3)); under.setAttribute("uv", new THREE.Float32BufferAttribute(uvB, 2));
  under.setAttribute("normal", new THREE.Float32BufferAttribute(base.map((_, k) => (k % 3 === 2 ? -1 : 0)), 3)); under.setIndex(idx.map((_, k, a) => a[k - (k % 3) + [0, 2, 1][k % 3]]));
  // six legs in low relief: the right side (mm, x out, y along); the front pair is the digging leg with 5 saw notches on its outer edge
  const front = [[16, 16.5], [22, 17.5], [28, 20.5], [31, 23]];
  for (let k = 0; k < 5; k++) front.push([31.2, 23.6 + 2 * k], [29.4, 24.8 + 2 * k]);   // the saw: 5 teeth
  front.push([30, 34.2], [27.4, 34.8], [25.6, 31.2], [22.4, 28.2], [17.5, 24.5]);
  const mid = [[18, 6.2], [25, 6.8], [29.6, 4.2], [31.4, 0.2], [30.2, -1.6], [28.2, 0.6], [25.4, 2.6], [18.5, 2.2]];
  const hind = [[18, -11], [25, -12.6], [30, -17.5], [31, -23.8], [29.4, -24.2], [26.6, -19], [22.8, -15.8], [18, -15]];
  const legG = (pts, sgn) => { const s = new THREE.Shape(); pts.forEach(([x, y], k) => s[k ? "lineTo" : "moveTo"](sgn * x / 1000, y / 1000)); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.0034, bevelEnabled: true, bevelSize: 0.0003, bevelThickness: 0.0003, bevelSegments: 1, curveSegments: 6 }); };
  const legs = [1, -1].map((sg) => [front, mid, hind].map((p) => legG(p, sg)));
  GEO = { dome, under, legs: legs.flat(), idx, nu: NU, nv: NV };
  return GEO;
}

// ---- the stone: base, flecks, veins, highlight (drawn in mm, +y up, 1 mm = PX pixels)
function inScarab(x, y) { const v = (SL / 2 - y / 1000) / SL; return v > 0.02 && v < 0.98 && Math.abs(x) < WIDTH(v) * 1000 - 1.2; }
function stone(g, c, seed, flecks = 30) {
  g.fillStyle = c.base; g.fillRect(-40, -50, 80, 100);
  const gr = g.createLinearGradient(-20, 30, 20, -30); gr.addColorStop(0, mix(c.base, c.light, 0.5)); gr.addColorStop(0.55, c.base); gr.addColorStop(1, mix(c.base, c.deep, 0.5)); g.fillStyle = gr; g.fillRect(-40, -50, 80, 100);
  let n = 0, k = 0;
  while (n < flecks && k < 600) {   // 30 pale flecks inside the outline
    const x = (rr(seed * 31 + k * 3.1) - 0.5) * 52, y = (rr(seed * 17 + k * 5.7 + 2) - 0.5) * 86; k++;
    if (!inScarab(x, y)) continue;
    g.globalAlpha = 0.5 + 0.45 * rr(seed + n * 9.1); g.fillStyle = "#9fc49a"; g.beginPath(); g.ellipse(x, y, 0.28 + 0.4 * rr(n * 3.3 + seed), 0.2 + 0.3 * rr(n * 7.7 + seed), rr(n + seed) * 3.14, 0, 6.2832); g.fill(); n++;
  }
  g.globalAlpha = 1;
  // 2 darker veins: a wobbling line across the stone
  g.lineCap = "round";
  for (let q = 0; q < 2; q++) {
    const a = [-22 + q * 10, -30 + q * 52], b = [18 - q * 36, 28 - q * 54]; g.strokeStyle = c.deep; g.globalAlpha = 0.5; g.lineWidth = 0.55; g.beginPath();
    for (let s = 0; s <= 24; s++) { const t = s / 24, x = a[0] + (b[0] - a[0]) * t + 2.2 * Math.sin(t * 9 + seed + q * 2) + 1.1 * Math.sin(t * 21 + q), y = a[1] + (b[1] - a[1]) * t + 1.4 * Math.sin(t * 7 + q * 3); g[s ? "lineTo" : "moveTo"](x, y); }
    g.stroke(); g.globalAlpha = 1;
  }
}
function outlinePath(g, inset = 0, v0 = 0.02, v1 = 0.98) {
  g.beginPath();
  for (let s = 0; s <= 60; s++) { const v = v0 + ((v1 - v0) * s) / 60; g[s ? "lineTo" : "moveTo"]((WIDTH(v) * 1000 - inset), (yOfV(v) * 1000)); }
  for (let s = 60; s >= 0; s--) { const v = v0 + ((v1 - v0) * s) / 60; g.lineTo(-(WIDTH(v) * 1000 - inset), yOfV(v) * 1000); }
  g.closePath();
}
const cacheTex = new Map();
function backTex(gi, res) {
  const key = `b${gi}|${res}`; if (cacheTex.has(key)) return cacheTex.get(key);
  const base = SCARAB_GREENS[gi], c = { base, light: mix(base, "#7fc08a", 0.45), deep: mix(base, "#0c1a12", 0.45) };
  const W = Math.round(640 * res), H = Math.round(1040 * res), PX = 11.64 * res;
  const t = canvasTex(W, H, (g) => {
    g.translate(W / 2, H / 2); g.scale(PX, -PX); stone(g, c, 11 + gi);
    // the rim: a dark band just inside the outline
    g.save(); outlinePath(g, 0, 0.0, 1.0); g.strokeStyle = c.deep; g.globalAlpha = 0.55; g.lineWidth = 2.6; g.stroke(); g.restore();
    // grooves lit from the upper left: a pale lip below and right, the dark cut on top
    const cut = (pts, w = 0.5, closed = false) => {
      const draw = (dx, dy) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x + dx, y + dy)); if (closed) g.closePath(); g.stroke(); };
      g.lineCap = g.lineJoin = "round"; g.lineWidth = w; g.strokeStyle = mix(c.base, c.light, 0.9); g.globalAlpha = 0.6; draw(0.16, -0.16); g.strokeStyle = c.deep; g.globalAlpha = 0.95; draw(0, 0); g.globalAlpha = 1;
    };
    const arcPts = (f, a, b, n = 28) => Array.from({ length: n + 1 }, (_, i) => f(a + ((b - a) * i) / n));
    const wmm = (v) => WIDTH(v) * 1000, ymm = (v) => yOfV(v) * 1000;
    // head plate: the 4 notches (dark wedges), the 2 eye bumps ringed, the clypeal sutures, the back edge
    for (const xk of NOTCH_X) { g.fillStyle = c.deep; g.beginPath(); g.moveTo(xk * 1000 - 1.7, 42.55); g.lineTo(xk * 1000, 42.5 - 1.85); g.lineTo(xk * 1000 + 1.7, 42.55); g.closePath(); g.fill(); }
    for (const s of [-1, 1]) cut(arcPts((a) => [s * 8.5 + 3.1 * Math.cos(a), 32.3 + 3.1 * Math.sin(a)], 0, 6.283, 24), 0.45, true);
    for (const s of [-1, 1]) cut([[s * 4.6, 40.6], [s * 4.9, 37.4], [s * 5.8, 34.6]], 0.45);
    cut(arcPts((x) => [x, 25.9 + 0.5 * Math.cos((x / 17) * 1.5)], -16.8, 16.8, 24), 0.55);
    // shoulder plate: a border line inset from the outline, the 2 curved V marks
    const bp = [];
    for (let s = 0; s <= 12; s++) { const v = 0.215 + (0.195 * s) / 12; bp.push([-(wmm(v) - 1.7), ymm(v)]); }   // left side, top to bottom
    for (let s = 12; s >= 0; s--) { const v = 0.215 + (0.195 * s) / 12; bp.push([wmm(v) - 1.7, ymm(v)]); }      // right side, bottom to top
    cut(bp, 0.5, true);
    cut([[-9.2, 20.8], [-6.4, 18.8], [-3.2, 16.6], [0, 13.6], [3.2, 16.6], [6.4, 18.8], [9.2, 20.8]], 0.62);
    cut([[-6.6, 14.9], [-4.6, 13.6], [-2.3, 12.0], [0, 10.4], [2.3, 12.0], [4.6, 13.6], [6.6, 14.9]], 0.55);
    // wing cases: the centre seam, 5 fine grooves each (following the outline), the triangle notch at each shoulder
    cut([[0, 6.8], [0, 0], [0, -20], [0, -40.5]], 0.62);
    for (const s of [-1, 1]) {
      [0.2, 0.38, 0.55, 0.71, 0.86].forEach((f, j) => { const v0 = 0.465 + 0.012 * j, v1 = 0.93 - 0.02 * j; cut(Array.from({ length: 22 }, (_, i) => { const v = v0 + ((v1 - v0) * i) / 21; return [s * f * wmm(v), ymm(v)]; }), 0.4); });
      const ys = ymm(0.43); g.fillStyle = c.deep; g.beginPath(); g.moveTo(s * (wmm(0.43) - 0.5), ys + 1.8); g.lineTo(s * (wmm(0.43) - 0.5), ys - 1.8); g.lineTo(s * (wmm(0.43) - 3.3), ys); g.closePath(); g.fill();
    }
    // 2 tiny rim chips (pale stone showing), the thread hole's ends at head and tail
    g.fillStyle = "#9fc49a"; g.globalAlpha = 0.85; for (const [x, y, r] of [[24.7, -7.5, 0.9], [-15.6, 30.6, 0.7]]) { g.beginPath(); g.moveTo(x - r, y - r * 0.6); g.lineTo(x + r * 1.1, y); g.lineTo(x - r * 0.2, y + r); g.closePath(); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = "#0b140e"; for (const y of [41.4, -41.4]) { g.beginPath(); g.arc(0, y, 0.95, 0, 6.2832); g.fill(); }
    // one soft highlight
    const hl = g.createRadialGradient(-7, 8, 0, -7, 8, 13); hl.addColorStop(0, "rgba(255,255,255,0.28)"); hl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = hl; g.fillRect(-40, -50, 80, 100);
  });
  cacheTex.set(key, t); return t;
}
// the underside (panel 17): authored as the viewer sees it from below (x to the viewer's right, the UV flips x)
function underTex(gi, res) {
  const key = `u${gi}|${res}`; if (cacheTex.has(key)) return cacheTex.get(key);
  const base = SCARAB_GREENS[gi], c = { base, light: mix(base, "#7fc08a", 0.45), deep: mix(base, "#0c1a12", 0.45) };
  const W = Math.round(640 * res), H = Math.round(1040 * res), PX = 11.64 * res;
  const t = canvasTex(W, H, (g) => {
    g.translate(W / 2, H / 2); g.scale(PX, -PX); stone(g, c, 23 + gi);
    let li = 0;
    // a carved line: a dark cut with a pale fill 0.6 mm wide; 30 % of the lines keep traces of old gilding
    const line = (fn, { w = 0.6, fill = false } = {}) => {
      const gild = [1, 4, 8].includes(li % 10); li++;   // exactly 3 lines in 10
      g.lineCap = g.lineJoin = "round";
      g.strokeStyle = c.deep; g.globalAlpha = 0.8; g.lineWidth = w + 0.5; g.beginPath(); fn(); g.stroke();
      g.globalAlpha = res < 1 ? 0.62 : 1; g.strokeStyle = gild ? "#c9b45a" : "#a9d6a0"; g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.globalAlpha = 1;
      if (fill) { g.fillStyle = gild ? "rgba(201,180,90,0.35)" : "rgba(169,214,160,0.3)"; g.beginPath(); fn(); g.fill(); }
    };
    const P = (pts) => () => pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y));
    const ell = (cx, cy, rx, ry, rot = 0) => () => { g.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot)); g.ellipse(cx, cy, rx, ry, rot, 0, 6.2832); };
    const Q = (x0, y0, x1, y1, x2, y2) => () => { g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); };
    // the raised oval border 3 mm wide: pale light on the upper left, shade lower right
    for (const [off, col, a] of [[0.28, c.deep, 0.7], [-0.28, mix(c.base, c.light, 0.9), 0.75]]) { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 0.5; for (const [rx, ry] of [[21, 38], [18, 35]]) { g.beginPath(); g.ellipse(off * 0.5, -off * 0.5, rx, ry, 0, 0, 6.2832); g.stroke(); } }
    g.globalAlpha = 0.32; g.fillStyle = mix(c.base, c.light, 0.55); g.beginPath(); g.ellipse(0, 0, 21, 38, 0, 0, 6.2832); g.ellipse(0, 0, 18, 35, 0, 0, 6.2832, true); g.fill("evenodd"); g.globalAlpha = 1;
    // 3 registers parted by 2 double lines
    const hw = (y, r = 18, b = 35) => r * Math.sqrt(Math.max(0, 1 - (y / b) ** 2));
    for (const y of [12.2, 11.2, -11.2, -12.2]) line(() => { g.moveTo(-hw(y), y); g.lineTo(hw(y), y); }, { w: 0.5 });
    // reeds: a stem, a plume, two leaf blades
    const reed = (x, y0, h, lean = 0.4, i = 0) => {
      line(Q(x, y0, x + lean * 0.4, y0 + h * 0.5, x + lean, y0 + h - 1.8), { w: 0.5 }); line(ell(x + lean, y0 + h - 0.9, 0.5, 1.45), { w: 0.4 });
      const sd = i % 2 ? 1 : -1;   // one blade a stem, alternating sides
      line(Q(x + lean * 0.4, y0 + h * 0.35, x + sd * 1.3, y0 + h * 0.42, x + sd * 1.7, y0 + h * 0.62), { w: 0.38 });
    };
    // a potato person: body, head, a leaf sprout (the cast's silhouette)
    const potato = (cx, cy, k = 1) => { line(ell(cx, cy, 1.5 * k, 1.9 * k), { w: 0.5 }); line(ell(cx + 0.1 * k, cy + 2.9 * k, 1.15 * k, 1.1 * k), { w: 0.5 }); line(Q(cx + 0.1 * k, cy + 4.0 * k, cx + 0.2 * k, cy + 4.9 * k, cx + 1.4 * k, cy + 5.1 * k), { w: 0.4 }); line(Q(cx + 0.1 * k, cy + 4.0 * k, cx - 0.8 * k, cy + 4.9 * k, cx - 1.1 * k, cy + 4.5 * k), { w: 0.4 }); };
    // ---- top register: 5 reed stems, a boat with 2 potato rowers
    [[-12.5, 14.4, 7.6], [-10.5, 14.2, 9.6], [-8.5, 14.0, 11.2], [-6.5, 14.2, 9.4], [-4.5, 14.4, 6.8]].forEach(([x, y, h], i) => reed(x, y, h, (i - 2) * 0.3, i));
    line(() => { g.moveTo(0.2, 21.4); g.bezierCurveTo(0.9, 19.4, 3, 16.6, 7.2, 16.2); g.bezierCurveTo(11.2, 16.5, 13.7, 19.2, 14.4, 21.8); }, { w: 0.6 });
    line(Q(0.2, 21.4, -0.4, 22.6, 0.5, 23.2), { w: 0.45 }); line(Q(14.4, 21.8, 15.0, 23, 14.1, 23.5), { w: 0.45 });
    line(P([[1.2, 19.9], [13.4, 19.9]]), { w: 0.4 });
    line(() => { g.moveTo(1, 14.8); for (let i = 1; i <= 14; i++) g.lineTo(1 + i * 0.95, 14.8 + 0.5 * Math.sin(i * 1.3)); }, { w: 0.4 });
    line(() => { g.moveTo(2.5, 13.4); for (let i = 1; i <= 11; i++) g.lineTo(2.5 + i * 0.95, 13.4 + 0.45 * Math.sin(i * 1.3 + 1)); }, { w: 0.4 });
    for (const cx of [4.3, 9.7]) { potato(cx, 21.2, 0.85); line(P([[cx + 1.1, 21.4], [cx + 3.4, 18.4]]), { w: 0.4 }); line(ell(cx + 3.7, 18.0, 0.35, 1.1, 0.9), { w: 0.4 }); }
    // ---- middle register: a seated potato figure on a low throne, an offering table with 3 loaves and a jar, a lotus
    line(P([[-14.6, -4.4], [-6.4, -4.4], [-6.4, -7.9], [-14.6, -7.9], [-14.6, -4.4]]), { w: 0.55 }); line(P([[-14.6, -4.4], [-14.6, 3.6], [-13.1, 3.6], [-13.1, -4.4]]), { w: 0.5 });
    line(P([[-12.8, -6.0], [-8, -6.0]]), { w: 0.35 });
    potato(-9.6, -1.0, 1.15); line(P([[-7.6, 0.6], [-4.6, 0.9]]), { w: 0.5 }); line(P([[-7.9, -3.0], [-6.2, -4.3]]), { w: 0.45 });
    line(P([[-4.2, -1.7], [6.2, -1.7], [6.2, -2.6], [-4.2, -2.6], [-4.2, -1.7]]), { w: 0.55 }); line(P([[0.8, -2.6], [0.8, -7.4], [-1.4, -7.9], [3.0, -7.9], [0.8, -7.4]]), { w: 0.55 });
    [[-2.2, 1.5, 2.6], [1.2, 1.6, 3.2], [4.4, 1.5, 2.4]].forEach(([x, w, h]) => { line(() => { g.moveTo(x - w, -1.7); g.bezierCurveTo(x - w, -1.7 + h * 1.15, x + w, -1.7 + h * 1.15, x + w, -1.7); g.closePath(); }, { w: 0.5 }); line(P([[x - w * 0.4, -1.5 + h * 0.5], [x + w * 0.4, -1.5 + h * 0.5]]), { w: 0.3 }); });
    line(() => { g.moveTo(8.0, 3.2); g.bezierCurveTo(7.4, 2.6, 6.3, 0, 6.4, -3.2); g.bezierCurveTo(6.6, -6, 7.6, -7.6, 8.7, -7.6); g.bezierCurveTo(10, -7.6, 11, -6, 11, -3.2); g.bezierCurveTo(11.1, 0, 10, 2.6, 9.4, 3.2); }, { w: 0.55 });
    line(P([[7.7, 3.6], [9.7, 3.6]]), { w: 0.5 }); line(P([[6.5, -1.2], [10.9, -1.2]]), { w: 0.4 }); line(P([[6.6, -4.2], [10.9, -4.2]]), { w: 0.4 });
    line(Q(13.6, -7.9, 13.4, -3, 13.6, 1.6), { w: 0.5 });   // the lotus: stem, three petals, two leaves at the foot
    line(ell(13.6, 4.4, 1.15, 2.7, Math.PI / 2), { w: 0.5 }); line(ell(11.9, 3.7, 0.95, 2.4, Math.PI / 2 + 0.6), { w: 0.45 }); line(ell(15.3, 3.7, 0.95, 2.4, Math.PI / 2 - 0.6), { w: 0.45 });
    line(P([[12.6, 1.7], [14.6, 1.7]]), { w: 0.4 });
    line(Q(13.5, -5.6, 11.4, -5.2, 10.9, -6.9), { w: 0.4 }); line(Q(13.5, -5.6, 15.5, -5.2, 16.1, -6.9), { w: 0.4 });
    // ---- bottom register: 4 reed stems, a jackal lying on a shrine, a feather
    [[-13.0, -23.8, 9.2], [-10.6, -23.4, 10.0], [-8.2, -23.2, 9.4], [-5.8, -23.6, 7.6]].forEach(([x, y, h], i) => reed(x, y, h, (i - 1.5) * 0.35, i));
    line(P([[-3.4, -26.2], [6.0, -26.2], [6.0, -20.8], [-3.4, -20.8], [-3.4, -26.2]]), { w: 0.55 }); line(P([[-4.2, -20.8], [6.8, -20.8], [6.8, -19.6], [-4.2, -19.6], [-4.2, -20.8]]), { w: 0.5 });
    line(P([[-1.8, -25.4], [-1.8, -22], [-0.3, -22], [-0.3, -25.4]]), { w: 0.4 }); line(P([[1.6, -25.4], [1.6, -22], [3.1, -22], [3.1, -25.4]]), { w: 0.4 });
    line(ell(0.6, -17.9, 4.3, 1.25), { w: 0.55 });   // the jackal lies on the shrine: body
    line(P([[4.4, -18.2], [5.1, -16.2], [5.7, -15.4]]), { w: 0.5 });   // neck
    line(P([[5.6, -16.4], [6.0, -15.2], [7.2, -14.9], [9.9, -15.9], [9.7, -16.6], [7.3, -16.9], [5.6, -16.4]]), { w: 0.5 });   // head and long snout
    line(P([[6.0, -15.2], [5.7, -13.0], [6.9, -15.0]]), { w: 0.5 }); line(P([[6.9, -15.0], [7.5, -13.0], [7.9, -15.0]]), { w: 0.5 });   // 2 tall ears
    line(P([[3.2, -19.0], [8.8, -19.0]]), { w: 0.45 }); line(P([[8.8, -19.0], [9.2, -18.6]]), { w: 0.4 });   // forelegs stretched out
    line(Q(-3.5, -17.8, -4.6, -16.2, -5.8, -17.0), { w: 0.5 });   // the tail
    line(P([[10.8, -26], [11.6, -21], [12.3, -15.6], [13.0, -21.5], [11.8, -26.6]]), { w: 0.45 }); line(P([[10.9, -26.3], [12.1, -14.6]]), { w: 0.45 });   // a feather: vane and shaft
    for (let k = 0; k < 5; k++) line(P([[11.9 - 0.1 * k, -24 + k * 1.9], [10.6 + 0.2 * k, -23 + k * 1.9]]), { w: 0.3 });
    // the sheen
    const hl = g.createRadialGradient(-6, 8, 0, -6, 8, 20); hl.addColorStop(0, "rgba(255,255,255,0.14)"); hl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = hl; g.fillRect(-40, -50, 80, 100);
  });
  cacheTex.set(key, t); return t;
}
const glintTex = () => { const k = "glint"; if (cacheTex.has(k)) return cacheTex.get(k); const t = canvasTex(256, 256, (g, w, h) => { const q = g.createLinearGradient(w * 0.2, 0, w * 0.8, 0); q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.5, "rgba(255,255,255,0.6)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(w / 2, h / 2); g.rotate(-0.35); g.translate(-w / 2, -h / 2); g.fillStyle = q; g.fillRect(-w, -h, 3 * w, 3 * h); g.restore(); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; cacheTex.set(k, t); return t; };
const MATS = new Map();
function stoneMats(gi, res, withUnder) {
  const k = `${gi}|${res}|${withUnder}`; if (MATS.has(k)) return MATS.get(k);
  const lift = (t) => ({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: res < 1 ? 0.14 : 0.3 });
  const back = new THREE.MeshStandardMaterial({ ...lift(backTex(gi, res)), roughness: 0.26, metalness: 0.04 }); back.userData.noHatch = true;
  const under = withUnder ? new THREE.MeshStandardMaterial({ ...lift(underTex(gi, res)), roughness: 0.28, metalness: 0.04 }) : mat(SCARAB_GREENS[gi], { roughness: 0.3 }); under.userData.noHatch = true;
  const legs = mat(mix(SCARAB_GREENS[gi], "#7fc08a", 0.12), { roughness: 0.3 });
  const r = { back, under, legs }; MATS.set(k, r); return r;
}
// a gold band round the body (leaf: a long light band on the round, shade low, wear to bronze on the edges, red bole in 1 rubbed spot of 4)
function goldBand(v0, v1) {
  const NU = 44, NV = 4, pos = [], col = [], idx = [], c0 = hexRGB("#e2b04a"), cl = hexRGB("#fff0b8"), cs = hexRGB("#9a6a1e"), cb = hexRGB("#6b4612"), cr = hexRGB("#8a4a2a");
  const put = (x, y, z, shade, wear, n) => {
    let c = c0.map((q, i) => lerp(lerp(q, cs[i], clamp(shade)), cl[i], clamp(-shade * 1.4))); const w = wear > 0.82 + 0.0 ? 1 : 0;
    if (w) { const rb = rr(n * 3.7) < 0.25 ? cr : cb; c = c.map((q, i) => lerp(q, rb[i], 0.85)); }
    pos.push(x, y, z); col.push(...c);
  };
  let n = 0;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const v = v0 + ((v1 - v0) * j) / NV, u = -1 + (2 * i) / NU, x = u * WIDTH(v), y = yOfV(v), z = domeH(u, v, x, y) + 0.0004;
    const edge = Math.abs(u) ** 6, light = Math.exp(-(((u + 0.25) / 0.22) ** 2)) * 0.9, hole = rr(Math.floor(i / 2) * 7.1 + Math.floor(j / 2) * 3.3 + 5) ;
    put(x * 1.012, y, z, 0.15 + 0.6 * edge - light * 1.1, edge > 0.35 && hole < 0.5 ? 1 : hole > 0.94 ? 1 : 0, n++);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  // the strip under the flat face (facing -z)
  const o = pos.length / 3;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i += NU) { const v = v0 + ((v1 - v0) * j) / NV, u = -1 + (2 * i) / NU; put(u * WIDTH(v) * 1.012, yOfV(v), -0.0004, 0.5, 0, n++); }
  idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4, o + 3, o + 5, o + 4, o + 4, o + 5, o + 6, o + 5, o + 7, o + 6, o + 6, o + 7, o + 8, o + 7, o + 9, o + 8);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, color: "#ffffff", metalness: 0.5, roughness: 0.34, side: THREE.DoubleSide })); m.castShadow = true; return m;
}
// the scarab in its own frame: underside z 0 (faces -z), back dome to +z, head +y. opts: green 0..4, res (texture scale), chip, band, under (draw the carved underside), glint (an overlay for one sweep)
export function makeScarab({ green = 0, res = 1, chip = false, band = false, under = true, glint = false } = {}) {
  const G = scarabGeo(), M = stoneMats(green, res, under), grp = new THREE.Group();
  const add = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = false; grp.add(o); return o; };
  add(G.dome, M.back); add(G.under, M.under); for (const lg of G.legs) add(lg, M.legs);
  if (chip) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.0075, 0.0032, 0.0026), mat("#a9cfa2", { roughness: 0.5 })); w.position.set(WIDTH(0.33) * 0.99, yOfV(0.33), 0.0042); w.rotation.set(0.3, 0.2, 0.5); w.castShadow = false; grp.add(w); }
  if (band) grp.add(goldBand(0.5, 0.56));
  let gm = null;
  if (glint) { const m = decal(glintTex()); m.map = glintTex().clone(); m.map.needsUpdate = true; m.map.repeat.set(3.2, 1.0); m.blending = THREE.AdditiveBlending; m.opacity = 0.0; m.userData.noOutline = true; const o = new THREE.Mesh(G.dome, m); o.scale.setScalar(1.001); o.castShadow = false; o.renderOrder = 4; o.userData.steam = true; grp.add(o); gm = m; }
  grp.userData.setGlint = (gl) => { if (!gm) return; const on = gl > 0.001 && gl < 0.999; gm.visible = on; gm.opacity = on ? 0.55 : 0; gm.map.offset.set(0.5 - (1.15 - 1.3 * gl) * 3.2, 0.0); };
  return grp;
}

// ============================================================================================================ THE HEART
const HC = [0, 0.095], HD = 0.065, HP = 2.5;   // star centre, half depth, plan-to-depth profile exponent
const lobeY = (x) => 0.128 + Math.sqrt(Math.max(0, 0.062 * 0.062 - (x - 0.038) ** 2));
const sideW = (y) => 0.025 + 0.075 * (1 - Math.pow(1 - clamp(y / 0.128), 1.6));
let HTAB = null;
function heartRadial() {   // the outline's radius about the star centre, by angle (a table of 720)
  if (HTAB) return HTAB;
  const pts = [];
  for (let k = 0; k <= 40; k++) { const x = (0.03 * k) / 40, t = x / 0.03, s = t * t * (3 - 2 * t); pts.push([x, 0.16 + (lobeY(0.03) - 0.16) * s]); }
  for (let k = 1; k <= 60; k++) { const a = (97.4 * DEG) * (1 - k / 60); pts.push([0.038 + 0.062 * Math.cos(a), 0.128 + 0.062 * Math.sin(a)]); }
  for (let k = 1; k <= 60; k++) { const y = 0.128 * (1 - k / 60); pts.push([sideW(y), y]); }
  const right = pts.slice(); const left = right.map(([x, y]) => [-x, y]).reverse();
  const loop = [...right, [0.025, 0], ...left.slice(0, -1)].concat([[-0.025, 0], [0.025, 0]].slice(0, 0));
  const poly = []; for (const [x, y] of [...right, [0.0125, 0], [-0.0125, 0], ...left.slice(0)]) poly.push([x, y]); void loop;
  const tab = poly.map(([x, y]) => [Math.atan2(y - HC[1], x - HC[0]), Math.hypot(x - HC[0], y - HC[1])]).sort((a, b) => a[0] - b[0]);
  const N = 720, R = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI + (2 * Math.PI * i) / N; let j = 0; while (j < tab.length - 1 && tab[j + 1][0] < a) j++;
    const p = tab[j], q = tab[Math.min(j + 1, tab.length - 1)], t = q[0] === p[0] ? 0 : clamp((a - p[0]) / (q[0] - p[0])); R[i] = lerp(p[1], q[1], t);
  }
  // a blurred copy (12 degrees): the depth follows it inside, so the cleft does not crease the pillow down the middle
  const B = new Float32Array(N + 1), sg = 40;
  for (let i = 0; i <= N; i++) { let acc = 0, wsum = 0; for (let d = -3 * sg; d <= 3 * sg; d++) { const w = Math.exp(-(d * d) / (2 * sg * sg)), j = (((i + d) % N) + N) % N; acc += R[j] * w; wsum += w; } B[i] = acc / wsum; }
  HTAB = R; HBLUR = B; return R;
}
let HBLUR = null;
const tabAt = (T, a) => { const f = ((a + Math.PI) / (2 * Math.PI)) * 720, i = Math.floor(f), t = f - i; return lerp(T[Math.min(i, 720)], T[Math.min(i + 1, 720)], t); };
const radAt = (a) => tabAt(heartRadial(), a), radBlur = (a) => (heartRadial(), tabAt(HBLUR, a));
const depthS = (s) => HD * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, s), HP)), 1 / HP);
// the depth at plan radius r in direction a: the true s at the rim, the blurred s inside
const depthAt = (r, a) => { const s = r / radAt(a), sb = r / radBlur(a), w = ss((s - 0.88) / 0.12); return depthS(w * s + (1 - w) * sb); };
const cheekG = (x, y) => Math.exp(-(((Math.abs(x) - 0.052) ** 2 + (y - 0.085) ** 2) / (2 * 0.032 * 0.032)));
// the front surface z at (x, y) (before the cheek puff) and its normal
function frontZ(x, y, puff = 0) {
  const dx = x - HC[0], dy = y - HC[1], a = Math.atan2(dy, dx), s = Math.hypot(dx, dy) / radAt(a);
  return s >= 1 ? 0 : depthAt(Math.hypot(dx, dy), a) * (1 + 0.08 * puff * cheekG(x, y));
}
function frontN(x, y, puff = 0) {
  const e = 0.0015, nx = -(frontZ(x + e, y, puff) - frontZ(x - e, y, puff)) / (2 * e), ny = -(frontZ(x, y + e, puff) - frontZ(x, y - e, puff)) / (2 * e);
  return new THREE.Vector3(nx, ny, 1).normalize();
}
function heartGrids() {
  const NT = 168, NS = 30, out = [];
  for (const sg of [1, -1]) {
    const pos = [], uv = [], idx = [], base = [], col = [];
    for (let i = 0; i <= NS; i++) {
      const s = 1 - Math.pow(1 - i / NS, 1.7);
      for (let k = 0; k < NT; k++) {
        const a = -Math.PI + (2 * Math.PI * k) / NT, r = s * radAt(a), x = HC[0] + r * Math.cos(a), y = HC[1] + r * Math.sin(a), z = sg * depthAt(r, a);
        base.push(x, y, z, s); pos.push(x, y, z); uv.push((x + 0.115) / 0.23, (y + 0.02) / 0.23);
      }
    }
    for (let i = 0; i < NS; i++) for (let k = 0; k < NT; k++) { const a = i * NT + k, b = (i + 1) * NT + k, c = i * NT + ((k + 1) % NT), d = (i + 1) * NT + ((k + 1) % NT); if (sg > 0) idx.push(a, b, c, c, b, d); else idx.push(a, c, b, c, d, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // vertex paint: glossy red, shade on the lower right third, bounce along the lower left edge, the dish's gold at the foot
    const red = hexRGB("#e3262e"), shade = hexRGB("#a8141f"), bounce = hexRGB("#ff7a6e"), gold = hexRGB("#e2b04a"), nrm = g.attributes.normal;
    for (let q = 0; q < pos.length / 3; q++) {
      const x = pos[q * 3], y = pos[q * 3 + 1], s = base[q * 4 + 3], nx = nrm.getX(q), ny = nrm.getY(q);
      const d = (x / 0.1) * 0.55 + ((0.095 - y) / 0.095) * 0.5 + nx * 0.25 - ny * 0.1, sh = ss((d - 0.3) / 0.35) * 0.95;
      const bo = ss((s - 0.7) / 0.3) * clamp(-x / 0.06) * clamp((0.12 - y) / 0.1) * 0.8, go = ss((0.02 - y) / 0.02) * 0.85;
      let c = red.map((v, i) => lerp(v, shade[i], sh)); c = c.map((v, i) => lerp(v, bounce[i], bo)); c = c.map((v, i) => lerp(v, gold[i], go)); col.push(...c);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    out.push({ g, base, NT, NS });
  }
  return out;
}

// the face: a see-through canvas over the front (1024 px = 0.23 m, x -0.115..0.115, y -0.02..0.21)
const FPX = 1024 / 0.23;
function drawFace(g, st) {
  g.clearRect(0, 0, 1024, 1024); g.save(); g.setTransform(FPX, 0, 0, -FPX, 0.115 * FPX, 0.21 * FPX);
  g.lineCap = g.lineJoin = "round";
  const INK = "#1a1014", LIP = "#6e0f18", TONG = "#ff8a8a";
  // gloss: the kidney + dot on the upper left lobe, a thin rim light on the right lobe
  g.save(); g.translate(-0.050, 0.152); g.rotate(35 * DEG); g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(-0.0175, 0); g.bezierCurveTo(-0.0175, 0.0115, 0.010, 0.0150, 0.0175, 0.0035); g.bezierCurveTo(0.0125, -0.0020, 0.0, 0.0030, -0.0070, -0.0040); g.bezierCurveTo(-0.0140, -0.0090, -0.0175, -0.0060, -0.0175, 0); g.fill(); g.restore();
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(-0.0262, 0.1672, 0.004, 0, 6.2832); g.fill();
  g.strokeStyle = "#ffb0a8"; g.lineWidth = 0.0028; g.beginPath(); g.arc(0.038, 0.128, 0.0538, 18 * DEG, 68 * DEG); g.stroke();
  const sl = st.seal, sq = st.squish, slide = 0.012 * sl, cx0 = slide, mood = 1 - sq;
  const lx = st.lookX * 0.0035 - 0.0045 * sl, ly = st.lookY * 0.0035 - 0.0055 * sl;
  // eyes
  for (const s of [-1, 1]) {
    const ex = s * 0.03 + cx0, ey = 0.118;
    if (sq > 0.3) {   // shut tight: a chevron (> on the left eye, < on the right)
      g.strokeStyle = INK; g.lineWidth = 0.0042; g.globalAlpha = ss((sq - 0.3) / 0.3); g.beginPath(); g.moveTo(ex - s * 0.008, ey + 0.009); g.lineTo(ex + s * 0.007, ey); g.lineTo(ex - s * 0.008, ey - 0.009); g.stroke(); g.globalAlpha = 1; continue;
    }
    if (st.blink >= 0.88) { g.strokeStyle = INK; g.lineWidth = 0.0038; g.beginPath(); g.moveTo(ex - 0.0085, ey + 0.001); g.quadraticCurveTo(ex, ey - 0.0075, ex + 0.0085, ey + 0.001); g.stroke(); continue; }
    const k = 1 - st.blink * 0.95, ry = 0.012 * k * (1 + 0.1 * sl);
    if (sl > 0.01) { g.globalAlpha = sl; g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 0.0016; g.beginPath(); g.ellipse(ex, ey, 0.0135, 0.0175 * k, 0, 0, 6.2832); g.fill(); g.stroke(); g.globalAlpha = 1; }
    g.save();
    if (st.smug > 0.01) { const lid = ey + 0.012 - 0.0145 * st.smug; g.beginPath(); g.rect(ex - 0.02, ey - 0.03, 0.04, lid - (ey - 0.03)); g.clip(); }
    g.fillStyle = INK; g.beginPath(); g.ellipse(ex + lx, ey + ly, 0.0085 * (1 + 0.12 * sl), ry, 0, 0, 6.2832); g.fill(); g.restore();
    if (st.smug > 0.01) { const lid = ey + 0.012 - 0.0145 * st.smug; g.globalAlpha = ss(st.smug * 2); g.strokeStyle = INK; g.lineWidth = 0.0034; g.beginPath(); g.moveTo(ex - 0.0105, lid); g.lineTo(ex + 0.0105, lid - 0.0006 * s); g.stroke(); g.globalAlpha = 1; }
    if (st.blink < 0.5) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(ex + lx - 0.0032, ey + ly + 0.0055 * k, 0.0025, 0, 6.2832); g.fill(); }
  }
  // brows: 0.018 strokes, 0.012 above the eyes; a little worry by default, flat and one raised when smug, up when sealed
  if (sq < 0.3) for (const s of [-1, 1]) {
    const by = 0.142 + 0.004 * sl + (st.smug > 0 ? 0.004 * st.smug * (s > 0 ? 1 : -1.2) : 0), tilt = lerp(lerp(9, 15, sl), 0, st.smug) * DEG * s;
    const bx = s * 0.03 + cx0; g.strokeStyle = INK; g.lineWidth = 0.0034; g.beginPath(); g.moveTo(bx - 0.009 * Math.cos(tilt), by + 0.009 * Math.sin(tilt)); g.lineTo(bx + 0.009 * Math.cos(tilt), by - 0.009 * Math.sin(tilt)); g.stroke();
  }
  // mouth
  const my = 0.082;
  if (sq > 0.3) {   // wide open, shouting
    g.globalAlpha = ss((sq - 0.3) / 0.3); g.fillStyle = LIP; g.beginPath(); g.ellipse(cx0, my - 0.002, 0.020, 0.0125, 0, 0, 6.2832); g.fill(); g.save(); g.beginPath(); g.ellipse(cx0, my - 0.002, 0.020, 0.0125, 0, 0, 6.2832); g.clip(); g.fillStyle = TONG; g.beginPath(); g.ellipse(cx0, my - 0.0105, 0.012, 0.007, 0, 0, 6.2832); g.fill(); g.restore(); g.globalAlpha = 1;
  } else if (sl > 0.5) {   // lips pressed to a wavy line
    g.strokeStyle = LIP; g.lineWidth = 0.0042; g.beginPath(); for (let i = 0; i <= 24; i++) { const t = i / 24, x = cx0 + (t - 0.5) * 0.026; g[i ? "lineTo" : "moveTo"](x, my + 0.0024 * Math.sin(t * Math.PI * 3.0 + 0.6)); } g.stroke();
  } else if (st.mouth > 0.04) {
    const m = st.mouth, ow = lerp(0.011, 0.012, m), oh = lerp(0.0016, 0.015, m);
    g.fillStyle = LIP; g.beginPath(); g.ellipse(cx0, my - oh * 0.3, ow, oh, 0, 0, 6.2832); g.fill();
    g.save(); g.beginPath(); g.ellipse(cx0, my - oh * 0.3, ow, oh, 0, 0, 6.2832); g.clip(); g.fillStyle = TONG; g.beginPath(); g.ellipse(cx0, my - oh * 0.95, ow * 0.7, oh * 0.55, 0, 0, 6.2832); g.fill(); g.restore();
    g.strokeStyle = LIP; g.lineWidth = 0.0026; g.beginPath(); g.ellipse(cx0, my - oh * 0.3, ow, oh, 0, 0, 6.2832); g.stroke();
  } else if (st.smug > 0.05) {   // a one-sided smirk with a dimple
    const k = st.smug; g.strokeStyle = LIP; g.lineWidth = 0.0036; g.beginPath(); g.moveTo(-0.0115, my - 0.0012 * k); g.quadraticCurveTo(0.004, my - 0.0035 * k, 0.0125, my + 0.0075 * k); g.stroke(); g.lineWidth = 0.0022; g.beginPath(); g.moveTo(0.0135, my + 0.0035 * k); g.lineTo(0.0152, my + 0.0108 * k); g.stroke();
  } else { g.strokeStyle = LIP; g.lineWidth = 0.0036; g.beginPath(); g.moveTo(-0.011, my + 0.0004); g.quadraticCurveTo(0, my - 0.0030, 0.011, my + 0.0004); g.stroke(); }
  void mood; g.restore();
}

function heartface(P) {
  const S = P.spec, K = S.who === "spud" ? 1.15 : 1, G = heartGrids(), [FG, BG] = G;
  const kRoot = new THREE.Group(); kRoot.scale.setScalar(K); P.whole.add(kRoot);
  const leanG = new THREE.Group(); kRoot.add(leanG);
  const tilt = new THREE.Group(); tilt.rotation.x = -6 * DEG; leanG.add(tilt);
  const body = new THREE.Group(); tilt.add(body);
  const hm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.28, metalness: 0.02 });
  for (const g of [FG.g, BG.g]) { const m = new THREE.Mesh(g, hm); m.castShadow = m.receiveShadow = true; body.add(m); }
  // the flattened foot: the point it stands on, 0.05 wide
  const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshStandardMaterial({ color: "#c8212a", roughness: 0.35 })); foot.scale.set(0.025, 0.0125, 0.02); foot.position.set(0, 0.0125, 0); foot.castShadow = true; body.add(foot);
  const gl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, 6.2832, 0, 1.2), new THREE.MeshStandardMaterial({ color: "#e2b04a", roughness: 0.3, metalness: 0.4 })); gl.scale.set(0.019, 0.004, 0.015); gl.position.set(0, 0.002, 0); gl.rotation.x = Math.PI; gl.visible = false; body.add(gl);
  const face = new THREE.CanvasTexture(Object.assign(document.createElement("canvas"), { width: 1024, height: 1024 })); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
  const fm = new THREE.Mesh(FG.g, decal(face)); fm.renderOrder = 2; body.add(fm);
  // the charm: the heart scarab on the front, on its own pivot
  const charm = new THREE.Group(); const sc = makeScarab({ green: 0, res: 1, under: false }); charm.add(sc); charm.visible = false; body.add(charm);
  // the sweat bead
  const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14, a = t * Math.PI; prof.push(new THREE.Vector2(Math.sin(a) * 0.014 * (1 - 0.0 * t), -Math.cos(a) * 0.014)); }
  const bead = new THREE.Mesh(new THREE.LatheGeometry(prof.map((p, i) => new THREE.Vector2(p.x * (p.y > 0 ? 1 - 0.55 * (p.y / 0.014) ** 2 : 1), p.y)), 20), new THREE.MeshStandardMaterial({ color: "#7fcdf0", roughness: 0.12, emissive: "#5fb6e0", emissiveIntensity: 0.3 })); bead.castShadow = false; bead.visible = false; body.add(bead);
  let key = "", puffKey = -1;
  const zOf = (x, y, puff) => frontZ(x, y, puff);
  return {
    grip: 0,
    apply(ps, tt) {
      const t = tt ?? 0, gv = (k, d) => ps[k] ?? S[k] ?? d;
      const st = { blink: Math.round(clamp(ps.blink || 0) * 50) / 50, mouth: Math.round(clamp(ps.mouth || 0) * 50) / 50, smug: Math.round(clamp(gv("smug", 0)) * 50) / 50, seal: Math.round(clamp(gv("seal", 0)) * 50) / 50, squish: Math.round(clamp(gv("squish", 0)) * 50) / 50, lookX: Math.round(clamp(ps.lookX || 0, -1, 1) * 50) / 50, lookY: Math.round(clamp(ps.lookY || 0, -1, 1) * 50) / 50 };
      const k2 = JSON.stringify(st); if (k2 !== key) { key = k2; drawFace(face.image.getContext("2d"), st); face.needsUpdate = true; }
      if (st.seal !== puffKey) {   // cheeks puff: the lobes beside the mouth 8 % fatter
        puffKey = st.seal;
        for (const [grid] of [[FG], [BG]]) { const p = grid.g.attributes.position, b = grid.base; for (let i = 0; i < p.count; i++) { const f = 1 + 0.08 * st.seal * cheekG(b[i * 4], b[i * 4 + 1]); p.setXYZ(i, HC[0] + (b[i * 4] - HC[0]) * (1 + 0.0 * f) * (1 + (f - 1) * 0.6), b[i * 4 + 1], b[i * 4 + 2] * f); } p.needsUpdate = true; grid.g.computeVertexNormals(); }
      }
      const beat = gv("beat", 0.3), rate = gv("rate", 1.2), ph = ((t * rate) % 1 + 1) % 1, bump = (c, w) => Math.exp(-(((ph - c) / w) ** 2));
      const pulse = clamp(bump(0.05, 0.06) + 0.75 * bump(0.27, 0.06)), sw = 1 + 0.04 * beat * pulse;
      const sqz = ss(st.squish / 0.95), sx = lerp(1, 1.3, sqz), sy = lerp(1, 0.55, sqz);
      body.scale.set(sx * sw, sy * sw, sw); body.position.y = 0.03 * clamp(gv("hop", 0)) + (S.y0 || 0);
      leanG.rotation.z = -clamp(ps.lean || 0, -1, 1) * 15 * DEG; leanG.rotation.y = 0;
      P.root.visible = P.root.visible && st.squish < 0.999;
      // the charm: arrives along the surface normal and sticks (centre (-0.040, 0.070), 20 degrees off upright, proud 0.026)
      const cm = clamp(gv("charm", 0)), slap = clamp(gv("slap", 0));
      charm.visible = cm > 0.002;
      if (charm.visible) {
        const cx = -0.04, cy = 0.07, n = frontN(cx, cy, st.seal), z0 = zOf(cx, cy, st.seal), e = 1 - Math.pow(1 - cm, 3), off = 0.07 * (1 - e);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n), qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -20 * DEG);
        charm.quaternion.copy(q).multiply(qz); charm.position.set(cx, cy, z0).addScaledVector(n, -0.002 + off);
        sc.userData.setGlint?.(gv("glint", 0)); body.scale.multiplyScalar(1 - 0.08 * slap);
      }
      // the sweat bead: one drop on the upper left lobe, sliding 0.05 m every 1.2 s
      const swt = clamp(gv("sweat", 0)); bead.visible = swt > 0.01;
      if (bead.visible) {
        const p = (((t + (S.sweatPhase || 0)) / 1.2) % 1 + 1) % 1, x = -0.060 - 0.004 * p, y = 0.158 - 0.05 * (p * p * 0.6 + p * 0.4), n = frontN(x, y, 0), z = zOf(x, y, 0);
        const k = swt * ss(p / 0.14) * (1 - ss((p - 0.9) / 0.1)) * (0.8 + 0.2 * p);
        bead.position.set(x, y, z).addScaledVector(n, 0.004); bead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0)); bead.scale.set(k, k * (1 + 0.35 * p), k * 0.8);
      }
    },
  };
}

function heartscarab(P) {
  const S = P.spec, sc = makeScarab({ green: S.green ?? 0, res: 1, under: true, glint: true }); P.whole.add(sc);
  return { grip: 0.012, apply(ps) { sc.userData.setGlint(clamp(ps.glint ?? S.glint ?? 0)); } };
}

export const HEART_HEART_KINDS = { heartface, heartscarab };
// hand points in each prop's own frame (metres from its origin, before rot and scale), for arm poses { prop, grip: "name" }
export const HEART_HEART_GRIPS = {
  heartface: { contact: [0, 0, 0], charm: [-0.04, 0.07, 0.05], top: [0, 0.19, 0] },
  heartscarab: { shoulder: [0, 0.01, 0], mid: [0, 0, 0.014], head: [0, 0.0425, 0.004], tail: [0, -0.0425, 0.004], back: [0, 0, 0.028], underside: [0, 0, 0], palm: [0, 0, -0.004] },
};
export const HEART_HEART_STATE = {
  heartface: { smug: 0, seal: 0, sweat: 0, squish: 0, beat: 0.3, rate: 1.2, hop: 0, charm: 0, slap: 0 },
  heartscarab: { glint: 0 },
};
