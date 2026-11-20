import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk "Heaven Steps": the stairway of 100 steps (storyboards/series/potato-desk/heaven-steps/DESIGN.md sections 2 and 4).
// Axes: x right, y up, +z toward the camera = DOWNHILL, metres. Every size and hex colour is the DESIGN's. Every mark (vein, crack, smear, number) is
// placed once with a fixed rng seed, nothing is tiled or mirrored. Everything is a pure function of the prop state (no clock, no Math.random).
// Nothing here is hand-held: HSTAIRS_GRIPS is empty (the case, can, megaphone ... are other props that ride the steps).
//
// heavenstairs  the whole stair, ONE prop. Place it at the world origin (0, 0, 0) = station B (the foot of riser 2 on the stair's centre line; y 0 = hell's floor).
//               Size 2.40 wide (3.70 with a landing), 22.0 high, 55.8 long (z +0.50 .. -55.80). No spec key is needed: the default is the closed stair.
//               The stair does not move: it has no x / y / z of its own (leave them 0), the stations are only places to put cameras and cast.
//   Layout      step n = box 2.40 x 0.22 x 0.50, riser n at z = -0.50 (n - 2) - 0.70 floor((n - 1) / 10), tread n top at y = 0.22 n (tread 100 top y 22, riser 100 z -55.30).
//               Landings 10..90 are 1.20 deep (3.70 wide, landing 10: 2.40); the flights shift sideways (decade offsets 0 0 +1.3 0 -1.3 0 +1.3 0 -1.3 0), so steps
//               91-100 and 1-20 are at x 0, 21-30 and 61-70 at x +1.3, 41-50 and 81-90 at x -1.3 (centre x of tread n = OFF[floor((n-1)/10)]).
//               Zones (one instanced draw each, 100 steps = 1 200 triangles): 4 red stone 1-20, 3 scorched 21-70, 2 grey cloud 71-90, 1 gold-white 91-100.
//               Gold nosing strips (zones 1-2), glowing seam under every nosing (zone 4), 16 gold riser numbers (10..90, 2, 61, 62, 91, 98, 99, 100),
//               hero marks on 96-100, 88-92, 59-63, 1-6, parapets from step 11 up (18 walls + 22 level pieces on the landings), 36 newels with pearls
//               (the top pair at station T (+-1.27, 0) is 0.40 high in all), balusters on the terrace right and back-right edges (25, station T) and on
//               landing 60's open edge (5), landing 90's open edge broken (1.13 gap, 2 stumps, 3 chips), arcades on the +x side of flights 61-70, 71-80,
//               81-90, a rock core under steps 1-10. Terrace slab, gate, podium, sky and clouds are other kinds.
//   Everything is see-through for the contact oval / occlusion boxes (userData.steam), casts no shadow (the key light would need a 56 m frustum); the steps
//   are solid for the physics bake (zone draws carry at most 50 instances, under the bake's 64 cap).
//   STATE KEYS. propState tweens only the numbers it already knows; an unknown key STEPS at its `at`. So the tweens ride known names:
//     foldFrom  tread under his feet, the first to fold (default 100)                       STEPS   (spec or `prop` set)
//     foldCount how many treads fold, from foldFrom downward (default 10; landings count but stay flat)   STEPS
//     fall      0..1 TWEENS = the fold wave's progress over foldFrom..foldFrom-foldCount+1 (`fold` 0..1 is the same number but STEPS: use it for stills)
//     unfold    0..1 TWEENS (the engine's own key) = the unfold wave, same order, after the fold; a tread is folded by fall and un-folded by unfold
//               Wave timing is the DESIGN's, in frames: tread k (0 = foldFrom) starts at 3k for k < 3, then at 6 + (k - 3) / 3; each tread takes 4 frames
//               (turn 23.7 deg about its nose, stretch 0.50 -> 0.546, 8 % overshoot). Whole wave F = start(N - 1) + 4 frames (N 10: 12 frames, N 30: 22,
//               N 60: 36). Tween `fall` 0 -> 1 with dur F / 30 and ease "linear" to get exactly that. For a second fold in one clip set fall 0, unfold 0 and the
//               new foldFrom / foldCount in ONE dur-0 step (all treads are flat again then, nothing jumps).
//               Folded treads form one marble slide (every riser and number under it is covered) with a 0.30 white strip at 15 % down the middle.
//     escalator 0..1 STEPS, or `rise` 0..1 TWEENS (use rise for the 60-frame wave): the gold wave front at step 100 x value (step n is gold when n <= 100 x value)
//     fade      0..1 TWEENS: the gold drains bottom-up (steps n <= 100 x fade go back); a gold step = top #ffd76a, riser #f2b63a, nosing #fff3b0, numbers
//               white-hot #fffbe0, plus an additive strip #ffd76a at 45 % on each lit tread
//     flash     tread number n, 0 = none (default 0) STEPS: treads n and n+1 flash gold (the Lift's 6-frame flash: set n, then 0 six frames later)
//
// ridetread     0.80 x 0.035 x 0.46, origin = the centre of the plate's BOTTOM face (place it on a tread top at the feet: y = tread top). Gold #ffd76a, emissive,
//               with an additive glow card under it (1.30 x 0.90). It is the Lift: the director tweens x / y / z (0.50 back, 0.22 up in 8 frames; the escalator
//               path is a long x / y / z tween). It carries what stands on it (the plate is solid, 0.035 thick).
//     pop    0..1 TWEENS (default 1): grows under his feet (scale of the plate in x and z), the director sets dur 0.1 (3 frames)
//     glow   0..1 TWEENS (default 1): the card's strength
//     fade   0..1 TWEENS (default 0): sinks flush (0.035 down) and fades out, dur 4 frames

const mat = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }); m.userData.noHatch = true; return m; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; m.userData.noHatch = true; return m; };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);
const FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
const steamy = (o) => { o.traverse((c) => { if (c.isMesh || c.isInstancedMesh) { c.userData.steam = true; c.castShadow = false; c.receiveShadow = true; c.frustumCulled = false; } }); return o; };

// ---- the step table -----------------------------------------------------------------------------------------------------------------------------
const RISE = 0.22, GO = 0.50, WID = 2.40, LAND = 1.20;
const OFF = [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0];
const dec = (n) => Math.floor((n - 1) / 10);
const isLand = (n) => n % 10 === 0 && n <= 90;
const zoneOf = (n) => (n >= 91 ? 1 : n >= 71 ? 2 : n >= 21 ? 3 : 4);
const zRiser = (n) => -0.5 * (n - 2) - 0.7 * dec(n);
const TH = Math.atan2(RISE, GO), STR = Math.hypot(RISE, GO) / GO - 1;   // 23.7 deg, 0.546 / 0.5 - 1
const STEPS = [null];
for (let n = 1; n <= 100; n++) {
  const land = isLand(n), d = dec(n);
  let lo = OFF[d] - 1.2, hi = OFF[d] + 1.2;
  if (land) { const u = OFF[n / 10]; lo = Math.min(lo, u - 1.2); hi = Math.max(hi, u + 1.2); }
  STEPS.push({ n, z: zRiser(n), y: RISE * n, land, zone: zoneOf(n), x0: lo, x1: hi, cx: (lo + hi) / 2, w: hi - lo, D: land ? LAND : GO });
}
const ZONE_N = { 1: [], 2: [], 3: [], 4: [] };
for (let n = 1; n <= 100; n++) ZONE_N[STEPS[n].zone].push(n);
const ZIDX = new Int16Array(101); for (const z of [1, 2, 3, 4]) ZONE_N[z].forEach((n, i) => { ZIDX[n] = i; });

// the zone colours (DESIGN section 2, Zones)
const ZC = {
  1: { top: "#f7f2e6", riser: "#ebe3d0", nose: "#e8b93a", cap: "#e8b93a" },
  2: { top: "#e6e6ea", riser: "#cfd0d8", nose: "#b9bcc6", cap: "#c9a45a" },
  3: { top: "#e9d2b8", riser: null, nose: null, cap: "#9a6a3a" },
  4: { top: "#8a332a", riser: "#6b241f", nose: null, cap: null },
};
const baseTop = (z) => C(ZC[z].top);
const treadColor = (n) => (zoneOf(n) === 3 ? C("#b98a6a").lerp(C("#e9d2b8"), (n - 21) / 49) : C(ZC[zoneOf(n)].top));
// a 3-step blend at each zone border: s -> 0.25 toward the next zone, s+1 -> 0.5, s+2 -> 0.25 back toward the lower one (per-step tint, no texture)
function blendedTread(n) {
  const c = treadColor(n);
  for (const s of [20, 70, 90]) {
    if (n === s - 1) c.lerp(treadColor(s + 1), 0.25);
    else if (n === s) c.lerp(treadColor(s + 1), 0.5);
    else if (n === s + 1) c.lerp(treadColor(s), 0.25);
  }
  return c;
}
const noseColor = (n) => { const z = zoneOf(n); return z === 3 ? treadColor(n).multiplyScalar(0.93) : z === 4 ? C("#8a332a") : C(ZC[z].nose); };
const wallColor = (n) => treadColor(n);

// the fold wave (frames) and an 8 % overshoot ease, found once
const waveStart = (k) => (k < 3 ? 3 * k : 6 + (k - 3) / 3);
const waveFrames = (N) => waveStart(Math.max(0, N - 1)) + 4;
const backEase = (() => {
  const f = (c1, p) => { const t = p - 1; return 1 + (c1 + 1) * t * t * t + c1 * t * t; };
  let lo = 0, hi = 4;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; let mx = 0; for (let j = 0; j <= 100; j++) mx = Math.max(mx, f(mid, j / 100) - 1); if (mx > 0.08) hi = mid; else lo = mid; }
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : f(lo, p));
})();

// ---- merged static geometry with vertex colours -------------------------------------------------------------------------------------------------
class Acc {
  constructor() { this.p = []; this.c = []; }
  tri(a, b, c, col) { this.p.push(...a, ...b, ...c); for (let k = 0; k < 3; k++) this.c.push(col.r, col.g, col.b); }
  quadOut(a, b, c, d, col, ctr) {   // a quad wound to face away from ctr
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [(a[0] + c[0]) / 2 - ctr[0], (a[1] + c[1]) / 2 - ctr[1], (a[2] + c[2]) / 2 - ctr[2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) { this.tri(a, b, c, col); this.tri(a, c, d, col); } else { this.tri(a, c, b, col); this.tri(a, d, c, col); }
  }
  // a sheared box: x0..x1, front z0 / back z1, bottom and top heights at each end
  prism(x0, x1, z0, z1, yb0, yb1, yt0, yt1, col) {
    const P = (x, z, y) => [x, y, z], k = [P(x0, z0, yb0), P(x1, z0, yb0), P(x1, z0, yt0), P(x0, z0, yt0), P(x0, z1, yb1), P(x1, z1, yb1), P(x1, z1, yt1), P(x0, z1, yt1)];
    const ctr = [0, 1, 2].map((i) => k.reduce((s, q) => s + q[i], 0) / 8);
    for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) this.quadOut(k[f[0]], k[f[1]], k[f[2]], k[f[3]], col, ctr);
  }
  box(cx, cy, cz, w, h, d, col) { this.prism(cx - w / 2, cx + w / 2, cz + d / 2, cz - d / 2, cy - h / 2, cy - h / 2, cy + h / 2, cy + h / 2, col); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals(); return g; }
}

// ---- canvas art, each drawn once ----------------------------------------------------------------------------------------------------------------
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function inkMeasure(text, hpx) {
  const g = document.createElement("canvas").getContext("2d"); g.font = FONT(100);
  const m = g.measureText(text), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, fs = (100 * hpx) / ih;
  g.font = FONT(fs); const m2 = g.measureText(text);
  return { fs, iw: m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight, l: m2.actualBoundingBoxLeft, a: m2.actualBoundingBoxAscent, d: m2.actualBoundingBoxDescent, ih: hpx };
}
const PPM = 700, CAP = 0.17, OUT = 0.008;
function numberTex(text, hot) {
  const k = inkMeasure(text, CAP * PPM), pad = 12, w = Math.ceil(k.iw + 2 * pad + 2 * OUT * PPM), h = Math.round(0.21 * PPM);
  const tex = canvasTex(w, h, (g) => {
    g.font = FONT(k.fs); g.textAlign = "left"; g.textBaseline = "alphabetic"; g.lineJoin = "round";
    const x = (w - k.iw) / 2 + k.l, y = h / 2 + (k.a - k.d) / 2;
    g.strokeStyle = hot ? "#d9a53a" : "#8a5a12"; g.lineWidth = 2 * OUT * PPM; g.strokeText(text, x, y);
    g.fillStyle = hot ? "#fffbe0" : "#f2c230"; g.fillText(text, x, y);
    g.save(); g.beginPath(); g.rect(0, y - k.a, w, k.ih * 0.34); g.clip(); g.fillStyle = hot ? "#ffffff" : "#ffe89a"; g.fillText(text, x, y); g.restore();
  });
  return { tex, w: w / PPM, h: h / PPM };
}
const overlay = (tex, emit, order = 2) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: emit });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
};
const radialTex = (inner, outer) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

// a flat strip along a polyline of [x, z] points at height y (tread-local frame), width w
function stripGeo(pts, w, y) {
  const pos = [], idx = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const px = -dz * w / 2, pz = dx * w / 2;
    pos.push(p[0] + px, y, p[1] + pz, p[0] - px, y, p[1] - pz);
    if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- the stairway ---------------------------------------------------------------------------------------------------------------------------------
function buildStairs(P) {
  const S = P.spec, root = P.whole;
  const unit = new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, -0.5);   // origin = the nose (top front edge), x +-0.5, y -1..0, z -1..0
  const flatTop = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  // 1. the four zone draws: [+x, -x, top, bottom, riser (front), back]
  const zoneMesh = {};
  for (const z of [1, 2, 3, 4]) {
    const top = baseTop(z), riser = ZC[z].riser ? C(ZC[z].riser) : top.clone().multiplyScalar(0.88);
    const mk = (c) => mat("#ffffff", { color: c });
    const side = mk(riser.clone()), tm = mk(top.clone()), bm = mk(riser.clone().multiplyScalar(0.7)), rm = mk(riser.clone());
    const mesh = new THREE.InstancedMesh(unit, [side, side, tm, bm, rm, side], ZONE_N[z].length);
    mesh.name = `heavenstairs-zone${z}`; root.add(mesh); zoneMesh[z] = mesh;
    ZONE_N[z].forEach((n, i) => { const b = baseTop(z), t = blendedTread(n); mesh.setColorAt(i, new THREE.Color(t.r / b.r, t.g / b.g, t.b / b.b)); });
  }
  // 2. nosing strips (all 100) and the zone 4 seam (steps 1-20), in the tread's own frame so they fold with it
  const nosing = new THREE.InstancedMesh(flatTop, basic("#ffffff", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 100);
  const colNose = (n) => noseColor(n);
  for (let n = 1; n <= 100; n++) nosing.setColorAt(n - 1, colNose(n));
  root.add(nosing);
  const seamTex = canvasTex(4, 16, (g, w, h) => { g.fillStyle = "#ff7a1c"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffd23f"; g.fillRect(0, 6, w, 5); });
  seamTex.magFilter = THREE.LinearFilter;
  const seam = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), basic("#ffffff", { map: seamTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 20);
  for (let n = 1; n <= 20; n++) seam.setColorAt(n - 1, C("#ffffff"));
  root.add(seam);
  // 3. gold skin, white strip, sheen: dynamic subsets
  const gTop = C("#ffd76a"), gRis = C("#f2b63a");
  const gm = (c) => mat(c, { emissive: new THREE.Color(c), emissiveIntensity: 0.18, roughness: 0.5 });   // 0.35 bloomed his feet and the tread edges away in the ride close-ups (Sol r1 #11)
  const skin = new THREE.InstancedMesh(unit, [gm(gRis), gm(gRis), gm(gTop), gm(gRis), gm(gRis), gm(gRis)], 100); skin.visible = false; skin.count = 0; root.add(skin);
  const strip = new THREE.InstancedMesh(flatTop, basic("#ffd76a", { transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }), 100); strip.visible = false; strip.count = 0; strip.renderOrder = 3; root.add(strip);
  const sheen = new THREE.InstancedMesh(flatTop, basic("#ffffff", { transparent: true, opacity: 0.15, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 100); sheen.visible = false; sheen.count = 0; sheen.renderOrder = 3; root.add(sheen);
  for (const m of [skin, strip, sheen]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }

  // 4. decals riding each tread: the 16 numbers and the hero marks
  const groups = {}, grp = (n) => { if (!groups[n]) { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.name = `heavenstairs-step${n}`; root.add(g); groups[n] = g; } return groups[n]; };
  const NUMS = [[10, 0], [20, 0], [30, 1.3], [40, 0], [50, -1.3], [60, 0], [70, 1.3], [80, 0], [90, -0.70], [91, -0.70], [98, 0.10], [99, 0.10], [100, 0.10], [61, 1.20], [62, 1.20], [2, 0]];
  const numMats = [];
  for (const [n, x] of NUMS) {
    const a = numberTex(String(n), false), b = numberTex(String(n), true), m = overlay(a.tex, 0.10);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), m); pl.position.set(x, -RISE / 2, 0.0025); pl.renderOrder = 2; pl.castShadow = false; grp(n).add(pl);
    numMats.push({ n, m, norm: a.tex, hot: b.tex });
  }
  const markM = (c, o = {}) => basic(c, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...o });
  const crack = (n, seed, col, w, core = null) => {   // a jittered zig-zag across the tread top
    const st = STEPS[n], r = rng(seed), x = st.x0 + 0.25 + r() * (st.w - 0.5), pts = [[x, -0.03 - r() * 0.05]], len = st.D * 0.85, k = 5;
    for (let i = 1; i <= k; i++) pts.push([pts[0][0] + (r() - 0.5) * 0.45 * (i / k) + (i % 2 ? 0.05 : -0.05), -0.03 - len * (i / k)]);
    const m1 = new THREE.Mesh(stripGeo(pts, w, 0.003), markM(col)); m1.renderOrder = 2; grp(n).add(m1);
    if (core) { const m2 = new THREE.Mesh(stripGeo(pts, w * 0.4, 0.0035), markM(core)); m2.renderOrder = 2; grp(n).add(m2); }
  };
  const vein = (n, seed) => {
    const st = STEPS[n], r = rng(seed), side = r() < 0.5 ? -1 : 1, x = st.cx + side * (0.45 + r() * 0.6), pts = [];
    for (let i = 0; i < 5; i++) pts.push([x + (i - 2) * 0.13 * side + (r() - 0.5) * 0.05, -0.04 - i * 0.1 - r() * 0.02]);
    const m = new THREE.Mesh(stripGeo(pts, 0.014, 0.003), markM("#e3dccb")); m.renderOrder = 2; grp(n).add(m);
  };
  const smear = (n, seed, riser) => {
    const st = STEPS[n], r = rng(seed), x = st.cx + (r() - 0.5) * 1.4, rx = 0.14 + r() * 0.14, rz = 0.06 + r() * 0.08;
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), markM("#6b4a3a", { transparent: true, opacity: 0.5, depthWrite: false }));
    if (riser) { m.position.set(x + 0.4, -RISE / 2, 0.003); m.scale.set(rx, rz * 1.4, 1); } else { m.rotation.x = -Math.PI / 2; m.position.set(x, 0.0032, -0.12 - r() * (st.D - 0.3)); m.scale.set(rx, rz, 1); }
    m.renderOrder = 2; grp(n).add(m);
  };
  const chip = (n, seed) => {
    const st = STEPS[n], r = rng(seed), x = st.cx + (r() - 0.5) * 1.8;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06 + r() * 0.03, 0.022, 0.04 + r() * 0.02), mat("#b9bcc6")); m.position.set(x, 0.011, -0.05 - r() * 0.15); m.rotation.y = r() * 3; m.rotation.z = (r() - 0.5) * 0.4; grp(n).add(m);
  };
  [96, 97, 99, 100].forEach((n, i) => vein(n, 900 + i * 17));                       // zone 1: 4 marble veins
  [88, 89, 91, 92].forEach((n, i) => crack(n, 910 + i * 13, "#9a9ca8", 0.008));      // zone 2: 4 hairline cracks, 3 chips
  [88, 89, 92].forEach((n, i) => chip(n, 920 + i * 11));
  [[59, 0], [60, 0], [61, 0], [62, 0], [59, 1], [63, 1]].forEach(([n, rs], i) => smear(n, 930 + i * 7, !!rs));   // zone 3: 6 soot smears, 4 cracks
  [59, 60, 62, 63].forEach((n, i) => crack(n, 940 + i * 19, "#5a3a2a", 0.012));
  [1, 1, 2, 3, 3, 4, 5, 6].forEach((n, i) => crack(n, 950 + i * 23, "#ff7a1c", 0.024, "#ffd23f"));   // zone 4: 8 cracks with a glowing core

  // 5. the fixed parts: parapets, level pieces, rock core, arcades, stumps and chips
  const wallAcc = new Acc(), capAcc = new Acc();
  const capCol = (n) => { const z = zoneOf(n); return z === 3 ? C(ZC[3].cap) : z === 4 ? C("#8a332a") : C(ZC[z].cap); };
  const posts = [];
  for (let d = 1; d <= 9; d++) {
    const n0 = 10 * d + 1, zf = zRiser(n0), zb = zf - 4.5, y0 = RISE * n0, yn = (z) => y0 + 0.44 * (zf - z), col = wallColor(n0 + 4), cc = capCol(n0 + 4);
    for (const s of [-1, 1]) {
      const xc = OFF[d] + s * 1.27, top1 = d === 9 ? 0.28 : 0.45;
      wallAcc.prism(xc - 0.07, xc + 0.07, zf, zb, yn(zf) - 0.30, yn(zb) - 0.30, yn(zf) + 0.45, yn(zb) + top1, col);
      capAcc.prism(xc - 0.09, xc + 0.09, zf, zb, yn(zf) + 0.45, yn(zb) + top1, yn(zf) + 0.50, yn(zb) + top1 + 0.05, cc);
      posts.push({ x: xc, z: zf, y: yn(zf), h: 0.62, col }, { x: xc, z: zb, y: yn(zb), h: d === 9 ? 0.22 : 0.62, col });
    }
  }
  for (let k = 2; k <= 9; k++) {   // the landings' level pieces: both sides, and the open back edge (not 60 and 90: balusters, broken)
    const st = STEPS[10 * k], zf = st.z, zb = zf - LAND, yt = st.y, col = wallColor(10 * k), cc = capCol(10 * k);
    for (const [xa, xb] of [[st.x0 - 0.14, st.x0], [st.x1, st.x1 + 0.14]]) {
      wallAcc.prism(xa, xb, zf, zb, yt - 0.30, yt - 0.30, yt + 0.45, yt + 0.45, col);
      capAcc.prism(xa - 0.02, xb + 0.02, zf, zb, yt + 0.45, yt + 0.45, yt + 0.50, yt + 0.50, cc);
    }
    if (k === 6 || k === 9) continue;
    const u = OFF[k], [xa, xb] = u > OFF[k - 1] ? [st.x0, u - 1.2] : [u + 1.2, st.x1];
    wallAcc.prism(xa, xb, zb, zb - 0.14, yt - 0.30, yt - 0.30, yt + 0.45, yt + 0.45, col);
    capAcc.prism(xa, xb, zb + 0.02, zb - 0.16, yt + 0.45, yt + 0.45, yt + 0.50, yt + 0.50, cc);
  }
  // landing 90's broken open edge: 2 stumps with slanted broken tops (1.13 gap), 3 chips on the slab
  { const st = STEPS[90], zb = st.z - LAND, yt = st.y, col = wallColor(90), r = rng(977);
    wallAcc.prism(st.x0, st.x0 + 0.085, zb, zb - 0.14, yt - 0.30, yt - 0.30, yt + 0.20, yt + 0.09, col);
    wallAcc.prism(-1.2 - 0.085, -1.2, zb, zb - 0.14, yt - 0.30, yt - 0.30, yt + 0.07, yt + 0.24, col);
    for (let i = 0; i < 3; i++) wallAcc.box(-2.2 + r() * 0.9, yt + 0.015, zb + 0.15 + r() * 0.3, 0.05 + r() * 0.04, 0.03, 0.04 + r() * 0.03, col); }
  // the rock core under steps 1-10: instead of parapets
  { const rock = C("#3a1f22"), lit = C("#8f2f22");
    wallAcc.prism(-1.45, 1.45, 0.5, -4.0, 0, 0, 0.02, 1.98, rock); wallAcc.prism(-1.45, 1.45, -4.0, -5.2, 0, 0, 1.98, 1.98, rock);
    capAcc.prism(-1.45, -1.38, 0.5, -4.0, 0.0, 0.0, 0.03, 1.99, lit); capAcc.prism(1.38, 1.45, 0.5, -4.0, 0.0, 0.0, 0.03, 1.99, lit); }
  const vm = () => mat("#ffffff", { vertexColors: true, roughness: 0.8 });
  const walls = new THREE.Mesh(wallAcc.geo(), vm()), caps = new THREE.Mesh(capAcc.geo(), mat("#ffffff", { vertexColors: true, roughness: 0.45, metalness: 0.2 }));
  walls.name = "heavenstairs-walls"; caps.name = "heavenstairs-caps"; root.add(walls, caps);

  // newels with pearls (instanced); the top pair at T is 0.22 high + pearl = 0.40
  const newel = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.62, 0.16).translate(0, 0.31, 0), mat("#ffffff"), posts.length);
  const pearl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 7, 5), mat("#fbf8f2", { roughness: 0.35 }), posts.length);
  const mm = new THREE.Matrix4(), sc = new THREE.Matrix4();
  posts.forEach((q, i) => {
    newel.setMatrixAt(i, mm.makeScale(1, q.h / 0.62, 1).setPosition(q.x, q.y, q.z)); newel.setColorAt(i, q.col);
    pearl.setMatrixAt(i, mm.makeScale(1, 1, 1).setPosition(q.x, q.y + q.h + 0.09 - (q.h < 0.5 ? 0.0 : 0.0), q.z));
  });
  root.add(newel, pearl);

  // balusters (instanced lathe): terrace right + back-right (25, station T), landing 60's open edge (5)
  const bal = []; const T0 = { x: 0, y: 22.0, z: -55.30 };
  for (let i = 0; i < 17; i++) bal.push([T0.x + 2.5, T0.y + 0.03, T0.z - 0.6 - i * 0.22]);
  for (let i = 0; i < 8; i++) bal.push([T0.x + 2.28 - i * 0.22, T0.y + 0.03, T0.z - 4.2]);
  { const st = STEPS[60]; for (let i = 0; i < 5; i++) bal.push([-0.55 + (i - 2) * 0.22, st.y + 0.03, st.z - LAND - 0.07]); }
  const prof = [[0.04, 0], [0.04, 0.05], [0.025, 0.10], [0.052, 0.20], [0.025, 0.30], [0.04, 0.38]].map(([r, y]) => new THREE.Vector2(r, y));
  const balM = new THREE.InstancedMesh(new THREE.LatheGeometry(prof, 6), mat("#f7f2e6"), bal.length);
  bal.forEach((b, i) => balM.setMatrixAt(i, mm.makeTranslation(b[0], b[1], b[2])));
  root.add(balM);
  { const ra = new Acc(), g = C("#e8b93a"), mc = C("#f7f2e6");
    ra.box(T0.x + 2.5, T0.y + 0.44, T0.z - 2.4 - 0.1, 0.10, 0.05, 3.9, g); ra.box(T0.x + 2.5, T0.y + 0.015, T0.z - 2.4 - 0.1, 0.12, 0.03, 3.9, mc);
    ra.box(T0.x + 1.63, T0.y + 0.44, T0.z - 4.2, 1.9, 0.05, 0.10, g); ra.box(T0.x + 1.63, T0.y + 0.015, T0.z - 4.2, 1.9, 0.03, 0.12, mc);
    const st = STEPS[60]; ra.box(-0.55, st.y + 0.44, st.z - LAND - 0.07, 1.3, 0.05, 0.10, g); ra.box(-0.55, st.y + 0.015, st.z - LAND - 0.07, 1.3, 0.03, 0.12, mc);
    root.add(new THREE.Mesh(ra.geo(), mat("#ffffff", { vertexColors: true, roughness: 0.5 }))); }

  // arcades on the +x side of flights 61-70, 71-80, 81-90: wall 4.5 long, 3.2 deep, 0.20 thick, 2 round arches 1.50 x 1.90, piers 0.50, parallel to the slope
  for (const d of [6, 7, 8]) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(4.5, 0); sh.lineTo(4.5, -3.2); sh.lineTo(4.0, -3.2); sh.lineTo(4.0, -2.05);
    sh.absarc(3.25, -2.05, 0.75, 0, Math.PI, false); sh.lineTo(2.5, -3.2); sh.lineTo(2.0, -3.2); sh.lineTo(2.0, -2.05);
    sh.absarc(1.25, -2.05, 0.75, 0, Math.PI, false); sh.lineTo(0.5, -3.2); sh.lineTo(0, -3.2); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.20, bevelEnabled: false, curveSegments: 8 });
    g.rotateY(Math.PI / 2); g.rotateX(TH);
    const n0 = 10 * d + 1, ph = Math.cos(TH);
    g.translate(OFF[d] + 1.34, RISE * n0 - 0.12 + 0.2 * Math.sin(TH), zRiser(n0) - 0.2 * ph);
    const m = new THREE.Mesh(g, mat(wallColor(n0 + 4), { side: THREE.DoubleSide })); m.name = `heavenstairs-arcade${d}`; root.add(m);
  }
  steamy(root);
  for (const m of [skin, strip, sheen]) { m.userData.steam = true; }

  // ---- the layout of every dynamic thing from the state --------------------------------------------------------------------------------------------
  const N = new THREE.Matrix4(), L = new THREE.Matrix4(), M = new THREE.Matrix4();
  const noseM = (st, a) => N.makeRotationX(TH * a).setPosition(0, st.y, st.z);
  const put = (mesh, i, st, a, tx, ty, tz, sx, sy, sz) => { M.multiplyMatrices(noseM(st, a), L.makeScale(sx, sy, sz).setPosition(tx, ty, tz)); mesh.setMatrixAt(i, M); };
  let lastKey = null, lastHot = new Set();
  function layout(from, cnt, fp, up, esc, drain, flash) {
    const A = new Float32Array(101);
    if (fp > 0) {
      const F = waveFrames(cnt);
      for (let k = 0; k < cnt; k++) {
        const n = from - k; if (n < 1) break; if (isLand(n) || n > 100) continue;
        const s = waveStart(k), pf = clamp((fp * F - s) / 4), pu = clamp((up * F - s) / 4);
        A[n] = backEase(pf) * (1 - ss(pu));
      }
    }
    const lit = new Uint8Array(101), fl = Math.floor(flash);
    for (let n = 1; n <= 100; n++) if ((esc > 0 && n <= esc * 100 + 1e-9 && n > drain * 100 + 1e-9) || (fl > 0 && (n === fl || n === fl + 1))) lit[n] = 1;
    let ns = 0, nl = 0, nf = 0;
    for (let n = 1; n <= 100; n++) {
      const st = STEPS[n], a = A[n], Dz = st.D * (1 + STR * a);
      put(zoneMesh[st.zone], ZIDX[n], st, a, st.cx, 0, 0, st.w, RISE, Dz);
      put(nosing, n - 1, st, a, st.cx, 0.005, -0.02, st.w, 1, 0.04);
      if (n <= 20) put(seam, n - 1, st, a, st.cx, -0.012, 0.0015, st.w, 0.02, 1);
      if (lit[n]) { put(skin, nl, st, a, st.cx, 0.003, 0.003, st.w + 0.01, RISE + 0.006, Dz + 0.006); put(strip, nl, st, a, st.cx, 0.0045, -Dz / 2, 0.9, 1, Dz * 0.92); nl++; }
      nosing.setColorAt(n - 1, lit[n] ? C("#fff3b0") : colNose(n));
      if (a > 0.6) { put(sheen, nf, st, a, st.cx, 0.004, -Dz / 2, 0.30, 1, Dz); nf++; }
      if (groups[n]) { groups[n].matrix.copy(noseM(st, a)).multiply(L.makeScale(1, 1 - 0.95 * a, 1 + STR * a)); groups[n].matrixWorldNeedsUpdate = true; }   // the riser number squashes into the nose as its riser folds (numerals bunched on one face mid-unfold, Sol r1 #9)
    }
    for (const m of [...Object.values(zoneMesh), nosing, seam]) { m.instanceMatrix.needsUpdate = true; }
    nosing.instanceColor.needsUpdate = true;
    skin.count = nl; strip.count = nl; skin.visible = strip.visible = nl > 0; sheen.count = nf; sheen.visible = nf > 0;
    skin.instanceMatrix.needsUpdate = strip.instanceMatrix.needsUpdate = sheen.instanceMatrix.needsUpdate = true;
    for (const q of numMats) { const h = !!lit[q.n]; if (h !== lastHot.has(q.n)) { q.m.map = q.m.emissiveMap = h ? q.hot : q.norm; q.m.emissiveIntensity = h ? 0.5 : 0.10; q.m.needsUpdate = true; } }
    lastHot = new Set(numMats.filter((q) => lit[q.n]).map((q) => q.n));
    root.updateMatrixWorld(true);
  }
  layout(100, 10, 0, 0, 0, 0, 0);
  return {
    grip: 0,
    apply(ps) {
      const from = Math.round(num(ps, S, "foldFrom", 100)), cnt = Math.round(num(ps, S, "foldCount", 10));
      const fp = Math.max(clamp(num(ps, S, "fold", 0)), clamp(ps.fall || 0)), up = clamp(ps.unfold || 0);
      const esc = Math.max(clamp(num(ps, S, "escalator", 0)), clamp(ps.rise || 0)), drain = clamp(ps.fade || 0), flash = Math.round(num(ps, S, "flash", 0));
      const key = [from, cnt, fp, up, esc, drain, flash].join("|");
      if (key === lastKey) return; lastKey = key;
      layout(from, cnt, fp, up, esc, drain, flash);
    },
  };
}

// ---- the Lift ---------------------------------------------------------------------------------------------------------------------------------------
function buildRide(P) {
  const S = P.spec; if (S.pop === undefined) S.pop = 1; if (S.glow === undefined) S.glow = 1;
  const plateM = mat("#ffd76a", { emissive: new THREE.Color("#ffd76a"), emissiveIntensity: 0.8, roughness: 0.4, transparent: true });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.035, 0.46), plateM); plate.position.y = 0.0175; plate.castShadow = false; plate.receiveShadow = true; P.whole.add(plate);
  const cardM = new THREE.MeshBasicMaterial({ map: radialTex("rgba(255,243,176,0.95)", "rgba(255,215,106,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); cardM.fog = false;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 0.90).rotateX(-Math.PI / 2), cardM); card.position.y = 0.006; card.userData.steam = true; card.userData.solid = false; card.renderOrder = 3; P.whole.add(card);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.16), cardM); edge.position.set(0, 0.04, 0.235); edge.userData.steam = true; edge.userData.solid = false; edge.renderOrder = 3; P.whole.add(edge);
  return {
    grip: 0,
    apply(ps) {
      const pop = clamp(ps.pop ?? 1), g = clamp(ps.glow ?? 1), f = clamp(ps.fade ?? 0);
      plate.scale.set(Math.max(pop, 1e-3), 1, Math.max(pop, 1e-3)); plate.visible = pop > 0.002;
      plate.position.y = 0.0175 - 0.035 * f; plateM.opacity = 1 - f; plateM.emissiveIntensity = 0.8 * g + 0.2;
      card.scale.set(Math.max(pop, 1e-3), 1, Math.max(pop, 1e-3)); edge.scale.set(Math.max(pop, 1e-3), Math.max(pop, 1e-3), 1);
      cardM.opacity = g * (1 - f) * pop; card.visible = edge.visible = cardM.opacity > 0.003;
    },
  };
}

export const HSTAIRS_KINDS = { heavenstairs: buildStairs, ridetread: buildRide };
export const HSTAIRS_GRIPS = {};
