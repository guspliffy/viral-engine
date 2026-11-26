import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk "Heaven's terms and conditions": the gate-and-stair props (storyboards/series/potato-desk/heaven-terms/DESIGN.md sections 1, 2, 7 task A, 8).
// Axes: x right, y up, +z toward the camera = DOWNHILL, metres. Sizes and hex colours are the DESIGN's. Nothing here is lettering: every "line of text" is a grey
// bar. Every mark (bar row, grain stroke, weave stroke, ink speck) is drawn once from a fixed seed. Everything animated is a pure function of the prop state
// (no clock, no Math.random). The stairway geometry the ribbon lies on is props-heavenstairs.js's step table (riser n at z -0.5 (n - 2) - 0.7 floor((n - 1) / 10),
// tread n top y 0.22 n, landings 1.2 deep every tenth step), copied as formulas here.
// STATE KEYS: propState tweens `unroll`, `count`, `pull`, `fall` (numbers it knows); `end` is not seeded from the spec, so it STEPS at its `at` (set it in a dur-0
// `prop` step, or put it in the spec: the prop reads ps.end ?? spec.end). Parts below are the paper ("sheet") and its wooden roller (a turned wood shaft #8a5a34,
// grain #6b4324, a gold ring #e8b93a at each end, a knob r 0.035 at each end: 0.52 knob to knob).
//
// termsscroll   THE COUNTER. ONE prop, WORLD ORIGIN (x 0, y 0, z 0, never rot / scale it: its path is in world coordinates). Paper 0.40 wide, cream #f3e7c6 (shade #dccb9f,
//               edge line #b89f6a, grey bars #8f8a80, back #e6d6ae with no bars). The path (centre line, 69.8 m: the paper spans the corners, it does not hug the risers, so it is shorter than the DESIGN's ~81 m): the top roller at T (1.02, 0.46, -1.02) on the podium top ->
//               across it (x drifts to 0.945 so the stamp's pad at T (0.86, 0.42, -0.74) lands on the sheet) -> over the front rim at T (0.945, 0.42, -0.47) -> hangs to tread 100
//               at T (0.90, 0, -0.41) -> nose 100 at T x +0.62 -> down all 100 steps (flat 0.004 over each tread, a straight slant over every riser to a touch line 0.18 in
//               front of it on the tread below, 0.02 sag; it never hugs a riser) -> hell's floor, up over the hatch ring's brackets, over the lid and its handwheel (a 0.07 bump)
//               -> the end roller at B (-0.65, 0.15, 1.62) on the front half of the lid. Lanes (world x): steps 100-93 +0.62; 89-73 -0.36; 69-53 +0.36; 49-33 -0.36; 29-13 +0.36;
//               9-1 and the floor -0.65. Five swerves at landings 90, 70, 50, 30, 10 (2.20 m of z run each, smoothstep in x, paper square to its path): they start at the nose of tread
//               (landing + 3), the back edge of the second tread above the landing, and end at the landing's front edge; landings 80, 60, 40, 20 are crossed straight. Always 0.06+ inside every tread edge; it passes beside
//               (never over) the gold numbers. Not solid, see-through for every check; only the part above tread 90 casts a shadow.
//     unroll 0..1 (TWEENS, default 0): the paper laid LINEARLY in distance behind the travelling roll (0.41 m + u x 69.4 m); the director shapes the wave with the tween's ease
//               (DESIGN: distance 81 m x (t / 2.8 s)^1.6). 0 = frame 0: the top roller at T (1.02, 0.46, -1.02), 0.30 of flat sheet in front of it, the FAT roll (r 0.12, axis
//               across the path) at T (0.95, 0.54, -0.62). The roll rides the paper's front, radius sqrt(0.035^2 + (0.12^2 - 0.035^2)(1 - unroll)), turning by distance /
//               radius, hops 0.045 off every nose and squashes 5 % where it touches down. 1 = the bare end roller (r 0.035) on the lid; it rocks +-12 degrees twice over the
//               last 0.30 m of path (tween unroll 0.9963 -> 1 over 8 frames for the rock) and lies still at 1.
//               The fat roll hides the stamp's plant at frame 0 from a low camera at x 0.2 (the stamp's knob peeks out at the roll's left end).
//     count 0|1 (default 0): the stamp mark on the podium sheet, T (0.86, 0.42, -0.74), 0.19 x 0.13: a red #b3261e frame with a tick in it, 12 % of the ink missing in specks.
//     pull  0|1 (default 0, STEPS): the last 1.7 m (floor, lid, end roller) are gone (it is in his gloves), the roll hidden, the paper stops 1.7 m before the end (on the lowest treads).
// scrollroll    the Angel's roll: wooden roller 0.52 knob to knob, paper roll r 0.055 x 0.40, a tongue of sheet 0.16 hanging from its FRONT (-z, bars on that face). ORIGIN = the
//               roll's AXIS CENTRE (place the origin 0.40 over his feet and 0.30 in front of his middle: top 0.455); the axis runs along x. No keys. HOLD: box, BOTH gloves on
//               the two knob ends (SIZE scrollroll { w 0.52, h 0, d 0.11 }: gloves at x +-0.305, y 0). Tongue and bars face the lens (the holder is on the +z side).
// scrollsheet   the sheet the hero reads. ORIGIN = the page's middle between his gloves (place it 0.34 over his feet: the page top is 0.50, his mouth's lower edge). A stiff curved
//               page 0.40 wide x 0.34 tall (bowed 0.02 toward him), leaning 20 degrees back toward the holder (+z) about the origin; bars on the +z face (the side he reads);
//               the lens (-z) sees the plain back. A tail falls from the page's bottom edge, forward and down, to local y -0.31 / z -0.07 (0.03 over the tread when the origin is
//               0.34 over it and 0.28 in front of his feet = 0.35 in front). end 0|1 (STEPS; spec.end): 1 = the tail is 0.22 long and ends in the bare end roller hanging at his
//               shins (shot 22). HOLD: box, both gloves on the page's side edges (SIZE scrollsheet { w 0.40, h 0, d 0.01 }: gloves at x +-0.245, y 0). Two-handed, never one.
// scrolltail    the scroll flying after him: ORIGIN = its TOP end (where it left his gloves), 2.40 m of ribbon hanging down -y, bars on +z, the end roller at the lower end.
//               fall 0..1 (TWEENS, default 0, set it with a `prop` step: spec.fall is NOT read; the director tweens over 14 frames): 0 = hangs straight; the wave then runs down it into an S (two bends, 0.25 amplitude)
//               and the whole ribbon follows; top end still snaking at 1. Not held, not solid.
// goldstamp     big desk stamp, all gold: base 0.20 x 0.045 x 0.14 on a red rubber pad 0.19 x 0.012 x 0.13 (#b3261e), neck r 0.030 -> 0.022 up to y 0.167, a ball knob r 0.05
//               (top y 0.24) with one sheen stroke. No engraving. ORIGIN = the middle of the pad's FACE (its underside, y 0): stand it on a surface at that point. No keys.
//               HOLD: mug, round the neck (SIZE goldstamp { r 0.0232, h 0.2424 }: the fist at y 0.16). Solid.
// goldmat       gold doormat 0.72 x 0.02 x 0.34, ORIGIN = the middle of its underside (place it ON a tread top: tread 99 at T (-0.10, -0.22, 0.25)); pile #e8b93a, border 0.03
//               #b8862a, 14 short weave strokes #c9972e, corners rounded 0.02. No lettering. See-through for the checks (feet stand on it). No keys.
// risernum      a gold number decal on a riser, as the stair's own numbers (face #f2c230, highlight #ffe89a, outline 0.008 #8a5a12, 10 % emissive), cap height 0.17.
//               ORIGIN = the number's centre: place it at B (0, 0.11, 0.501) for the "1" on riser 1. spec.text (default "1"). No other keys. See-through.

const mat = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }); return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180, TAU = Math.PI * 2;
// see-through for the contact checks and the shadows
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });

// ---------------------------------------------------------------------------------------------------------------------------------- the paper
const PAPER = "#f3e7c6", SHADE = "#dccb9f", EDGE = "#b89f6a", BAR = "#8f8a80", BACK = "#e6d6ae", WOOD = "#8a5a34", WOOD2 = "#6b4324", GOLD = "#e8b93a";
const W = 0.40, PITCH = 0.034, BAR_H = 0.012;
// the printed side, drawn once: rows of grey bars, a clause = a short 0.05 bar + 6-9 body rows + one gap row; tile = 70 rows
function barsTex(seed, wpx = 256) {
  const ppm = wpx / W, rows = 70, hpx = Math.round(rows * PITCH * ppm), tileM = hpx / ppm;
  const tex = canvasTex(wpx, hpx, (g, w, h) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    g.fillStyle = SHADE; g.fillRect(0, 0, 0.02 * ppm, h); g.fillRect(w - 0.02 * ppm, 0, 0.02 * ppm, h);
    g.fillStyle = EDGE; g.fillRect(0.008 * ppm, 0, 0.0035 * ppm, h); g.fillRect(w - 0.0115 * ppm, 0, 0.0035 * ppm, h);
    const r = rng(seed); g.fillStyle = BAR;
    let i = 0;
    while (i < rows) {
      const y = (i) * PITCH * ppm + (PITCH - BAR_H) / 2 * ppm;
      g.fillRect(0.03 * ppm, y, 0.05 * ppm, BAR_H * ppm); i++;       // the clause's short bar
      const n = 6 + Math.floor(r() * 4);
      for (let k = 0; k < n && i < rows; k++, i++) {
        const len = (0.55 + 0.37 * r()) * W, yy = i * PITCH * ppm + (PITCH - BAR_H) / 2 * ppm;
        g.fillRect(0.03 * ppm, yy, Math.min(len, W - 0.06) * ppm, BAR_H * ppm);
      }
      i++;                                                           // the gap row
    }
  });
  tex.wrapT = THREE.RepeatWrapping; tex.wrapS = THREE.ClampToEdgeWrapping;
  return { tex, tileM };
}
const paperMat = (tex, side) => mat("#ffffff", { map: tex, roughness: 0.9, side, emissive: new THREE.Color(PAPER), emissiveMap: tex, emissiveIntensity: 0.3 });
const backMat = () => mat(BACK, { roughness: 0.9, side: THREE.BackSide, emissive: new THREE.Color(BACK), emissiveIntensity: 0.3 });
let BARS = null;
const bars = () => (BARS ??= barsTex(3141));

// the paper rolled on the travelling roll: bars run along the axis, one column per bar row round the circumference; caps show the spiral
function rollBodyTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    const r = rng(2718), ppm = h / W; g.fillStyle = BAR;
    for (let x = 6; x < w - 6; x += 11.6) { if (r() < 0.16) continue; const a = (0.55 + 0.37 * r()) * h, b = 0.03 * ppm; g.fillRect(x, b, 4, Math.min(a, h - 2 * b)); }
    g.fillStyle = EDGE; g.fillRect(0, 0, 2, h);
  });
}
function rollCapTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h); g.strokeStyle = SHADE; g.lineWidth = 2;
    for (let r = 8; r < 64; r += 4.5) { g.beginPath(); g.arc(64, 64, r, 0, TAU); g.stroke(); }
    g.strokeStyle = EDGE; g.lineWidth = 2.5; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.stroke();
    g.fillStyle = WOOD2; g.beginPath(); g.arc(64, 64, 7, 0, TAU); g.fill();
  });
}
let WOODTEX = null;
const woodTex = () => (WOODTEX ??= canvasTex(64, 256, (g, w, h) => {   // the turned shaft: a few grain strokes, each its own place
  g.fillStyle = WOOD; g.fillRect(0, 0, w, h); g.strokeStyle = WOOD2; g.lineCap = "round";
  for (const [x, y0, y1, lw] of [[10, 12, 150, 3], [24, 70, 240, 2], [37, 5, 110, 3.5], [49, 120, 250, 2.5], [58, 30, 90, 2]]) { g.lineWidth = lw; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 3, (y0 + y1) / 2, x - 1, y1); g.stroke(); }
}));

// one wooden roller lying across x: shaft, two gold rings, two knobs (0.52 knob to knob), optionally wrapped in a paper roll of radius 1 (scaled by the caller)
function makeRoller(parent, { wrap = false } = {}) {
  const frame = new THREE.Group(); parent.add(frame);          // oriented and squashed by the caller
  const spin = new THREE.Group(); frame.add(spin);             // turns about x
  const woodM = mat("#ffffff", { map: woodTex(), roughness: 0.6 }), goldM = mat(GOLD, { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#7a5410"), emissiveIntensity: 0.25 });
  const shaft = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.46, 14).rotateZ(Math.PI / 2), woodM, spin);
  for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 14).rotateZ(Math.PI / 2), goldM, spin, s * 0.212, 0, 0);
    const k = mesh(new THREE.SphereGeometry(0.035, 12, 10), woodM, spin, s * 0.235, 0, 0); k.scale.set(0.7, 1, 1);
  }
  let paper = null;
  if (wrap) {
    const capM = mat("#ffffff", { map: rollCapTex(), roughness: 0.9, emissive: new THREE.Color(PAPER), emissiveIntensity: 0.2 });
    const bodyT = rollBodyTex(), bodyM = mat("#ffffff", { map: bodyT, roughness: 0.9, emissive: new THREE.Color(PAPER), emissiveMap: bodyT, emissiveIntensity: 0.2 });
    paper = mesh(new THREE.CylinderGeometry(1, 1, W, 36).rotateZ(Math.PI / 2), [bodyM, capM, capM], spin);
  }
  return { frame, spin, paper, shaft };
}

// a curved sheet: rows follow the profile pts [[y, z], ...] (top to bottom), x across `w`; bowAt(x, t) adds a z offset; facing +1 = the bars face +z
function sheetGeo(pts, w, bowAt, nx = 6) {
  const n = pts.length, pos = new Float32Array(n * (nx + 1) * 3), uv = new Float32Array(n * (nx + 1) * 2), idx = [];
  let arc = 0; const { tileM } = bars();
  for (let i = 0; i < n; i++) {
    if (i) arc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (let j = 0; j <= nx; j++) {
      const x = (j / nx - 0.5) * w, k = i * (nx + 1) + j;
      pos[k * 3] = x; pos[k * 3 + 1] = pts[i][0]; pos[k * 3 + 2] = pts[i][1] + bowAt(x, i / (n - 1));
      uv[k * 2] = j / nx; uv[k * 2 + 1] = 1 - arc / tileM;
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nx; j++) { const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the printed face + the plain back as two meshes on one geometry (facing +1: print on the +z side, -1: on the -z side)
function sheetMeshes(parent, geo, facing = 1) {
  const front = new THREE.Mesh(geo, paperMat(bars().tex, facing > 0 ? THREE.FrontSide : THREE.BackSide)), back = new THREE.Mesh(geo, facing > 0 ? backMat() : Object.assign(backMat(), { side: THREE.FrontSide }));
  const g = new THREE.Group(); for (const o of [front, back]) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; g.add(o); }
  parent.add(g); return g;
}

// ---------------------------------------------------------------------------------------------------------------------------------- the path
const RISE = 0.22, TY = 22, TZ = -55.3;
const dec = (n) => Math.floor((n - 1) / 10);
const zR = (n) => -0.5 * (n - 2) - 0.7 * dec(n);         // riser n's z (the front of tread n)
const LANES = [0.62, -0.36, 0.36, -0.36, 0.36, -0.65], SW = [90, 70, 50, 30, 10];
function laneX(z) {
  if (z < TZ) return 0.62 + 0.28 * (1 - ss((z - (TZ - 0.41)) / 0.41));
  for (let k = 0; k < 5; k++) {
    const zs = zR(SW[k] + 3), ze = zR(SW[k]);
    if (z < zs) return LANES[k];
    if (z < ze) return LANES[k] + (LANES[k + 1] - LANES[k]) * ss((z - zs) / (ze - zs));
  }
  return LANES[5];
}
const dxdz = (z) => (laneX(z + 0.01) - laneX(z - 0.01)) / 0.02;

let PATH = null;
function termsPath() {
  if (PATH) return PATH;
  // 1. the height profile of the stair: [z, y] ascending z (centre line of the paper's top)
  const prof = [[TZ - 0.30, TY + 0.004]], touches = [], noses = [];
  for (let n = 100; n >= 1; n--) {
    const R = zR(n), y = RISE * n + 0.004;
    prof.push([R - 0.03, y], [R, y - 0.0005], [R + 0.022, y - 0.026]); noses.push(R);
    if (n >= 2) { const yt = RISE * (n - 1) + 0.004; prof.push([R + 0.10, (y - 0.026 + yt) / 2 - 0.02], [R + 0.18, yt]); touches.push(R + 0.18); }
  }
  // hell's floor end: over the hatch ring's brackets, the lid, the handwheel's 0.07 bump, to the end roller at z 1.62
  for (const p of [[0.58, 0.178], [0.62, 0.166], [0.72, 0.165], [0.78, 0.14], [0.86, 0.124], [1.0, 0.121], [1.04, 0.15], [1.06, 0.205], [1.3, 0.208], [1.52, 0.205], [1.56, 0.15], [1.59, 0.124], [1.625, 0.122]]) prof.push(p);
  const Y = (z) => {
    if (z <= prof[0][0]) return prof[0][1]; if (z >= prof[prof.length - 1][0]) return prof[prof.length - 1][1];
    let lo = 0, hi = prof.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (prof[m][0] <= z) lo = m; else hi = m; }
    const t = (z - prof[lo][0]) / (prof[hi][0] - prof[lo][0]); return prof[lo][1] + (prof[hi][1] - prof[lo][1]) * t;
  };
  // 2. the rows: the podium and the hang (explicit), then every profile z plus a sample every 0.06 m inside the swerves
  const T = (x, y, z) => [x, TY + y, TZ + z];
  const rows = [];
  const hangRow = (p, sx, hang) => rows.push({ c: p, sx, hang });
  [[1.02, 0.424, -1.02], [0.99, 0.424, -0.88], [0.955, 0.424, -0.74], [0.948, 0.424, -0.6], [0.945, 0.424, -0.5]].forEach((q, i, a) => hangRow(T(...q), i < a.length - 1 ? (a[i + 1][0] - q[0]) / (a[i + 1][2] - q[2]) : -0.02, false));
  [[0.945, 0.416, -0.462], [0.944, 0.396, -0.447], [0.94, 0.3, -0.417], [0.93, 0.2, -0.406], [0.915, 0.1, -0.4], [0.9, 0.007, -0.396]].forEach((q) => hangRow(T(...q), 0, true));
  const zs = new Set(prof.map((p) => +p[0].toFixed(5)));
  for (const L of SW) for (let z = zR(L + 3); z <= zR(L) + 1e-9; z += 0.06) zs.add(+z.toFixed(5));
  [...zs].sort((a, b) => a - b).forEach((z) => { if (z > TZ - 0.396) rows.push({ c: [laneX(z), Y(z), z], sx: dxdz(z), hang: false }); });
  // 3. edges (each at its own height: the paper lies on the tread under it), arclength, uv
  let s = 0;
  rows.forEach((r, i) => {
    const nrm = Math.hypot(1, r.sx), wx = 1 / nrm, wz = r.hang ? 0 : -r.sx / nrm; r.w = [wx, 0, wz];
    const ye = (z) => (r.hang || r.c[2] < TZ - 0.35 ? r.c[1] : Y(z));
    r.L = [r.c[0] - wx * W / 2, ye(r.c[2] - wz * W / 2), r.c[2] - wz * W / 2]; r.R = [r.c[0] + wx * W / 2, ye(r.c[2] + wz * W / 2), r.c[2] + wz * W / 2];
    if (i) s += Math.hypot(r.c[0] - rows[i - 1].c[0], r.c[1] - rows[i - 1].c[1], r.c[2] - rows[i - 1].c[2]); r.s = s;
  });
  const sAtZ = (z) => { for (let i = 1; i < rows.length; i++) if (rows[i].c[2] >= z) { const a = rows[i - 1], b = rows[i], t = (z - a.c[2]) / (b.c[2] - a.c[2]); return a.s + (b.s - a.s) * t; } return s; };
  const sOf = (zq) => { let best = 0, bd = 1e9; rows.forEach((r) => { const d = Math.abs(r.c[2] - zq); if (!r.hang && r.c[2] > TZ - 0.35 && d < bd) { bd = d; best = r.s; } }); return best; };
  PATH = { rows, L: s, S0: sAtZ(TZ - 0.62), noses: noses.map(sOf), touches: touches.map(sOf), Y };
  return PATH;
}
export function termsPathInfo() { const p = termsPath(); return { length: p.L, s0: p.S0, rows: p.rows.length }; }

// ---------------------------------------------------------------------------------------------------------------------------------- the strip (two parts: above tread 90 casts a shadow)
function makePart(rows, castShadow, parent) {
  const n = rows.length, master = new Float32Array(n * 6), uvm = new Float32Array(n * 4), idx = [], { tileM } = bars();
  rows.forEach((r, i) => { master.set([...r.L, ...r.R], i * 6); uvm.set([0, 1 - r.s / tileM, 1, 1 - r.s / tileM], i * 4); });
  for (let i = 0; i < n - 1; i++) { const a = 2 * i, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const pos = new Float32Array(master), uv = new Float32Array(uvm), geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  const front = new THREE.Mesh(geo, paperMat(bars().tex, THREE.FrontSide)), back = new THREE.Mesh(geo, backMat());
  for (const o of [front, back]) { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; parent.add(o); }   // thin paper: no shadow acne on itself
  front.castShadow = castShadow;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  let lastKey = "";
  return {
    meshes: [front, back],
    update(sDraw) {
      const key = sDraw.toFixed(6); if (key === lastKey) return; lastKey = key;
      if (sDraw <= rows[0].s + 1e-6) { front.visible = back.visible = false; return; }
      front.visible = back.visible = true;
      if (sDraw >= rows[n - 1].s) { pos.set(master); geo.setDrawRange(0, (n - 1) * 6); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); return; }
      let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m].s <= sDraw) lo = m; else hi = m; }
      const t = (sDraw - rows[lo].s) / (rows[hi].s - rows[lo].s);
      pos.set(master); pos.set([...lerp3(rows[lo].L, rows[hi].L, t), ...lerp3(rows[lo].R, rows[hi].R, t)], hi * 6);
      uv.set(uvm); uv[hi * 4 + 1] = uv[hi * 4 + 3] = 1 - sDraw / tileM;
      geo.setDrawRange(0, hi * 6); geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}

// the stamp mark: a frame with a tick, 12 % of the ink missing in specks (each placed once)
function stampTex() {
  return canvasTex(760, 520, (g, w, h) => {
    const ppm = 4000, fw = 0.012 * ppm;
    g.clearRect(0, 0, w, h); g.fillStyle = "#b3261e"; g.strokeStyle = "#b3261e"; g.lineCap = "round"; g.lineJoin = "round";
    g.fillRect(0, 0, w, fw); g.fillRect(0, h - fw, w, fw); g.fillRect(0, 0, fw, h); g.fillRect(w - fw, 0, fw, h);
    g.lineWidth = 0.017 * ppm; g.beginPath(); g.moveTo(w * 0.24, h * 0.55); g.lineTo(w * 0.42, h * 0.76); g.lineTo(w * 0.78, h * 0.25); g.stroke();
    const r = rng(777); g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h, rr = (0.0016 + 0.0034 * r()) * ppm; g.beginPath(); g.ellipse(x, y, rr * (0.7 + r() * 0.8), rr, r() * 3, 0, TAU); g.fill(); }
    g.globalCompositeOperation = "source-over";
  });
}
const decalMat = (tex, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };

// ---------------------------------------------------------------------------------------------------------------------------------- kinds
function termsscroll(P) {
  const { rows, L, S0, noses, touches } = termsPath(), S = P.spec;
  const split = rows.findIndex((r) => r.c[1] < 19.9);
  const partA = makePart(rows.slice(0, split + 1), true, P.whole), partB = makePart(rows.slice(split), false, P.whole);
  const rA = makeRoller(P.whole);                                                      // the top roller (bare), fixed at the start
  { const r0 = rows[0], p = r0.c; rA.frame.position.set(p[0], p[1] + 0.035, p[2]); rA.frame.rotation.y = Math.atan(r0.sx); }
  const R = makeRoller(P.whole, { wrap: true });                                       // the travelling roll
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.13), decalMat(stampTex(), { emissive: new THREE.Color("#b3261e"), emissiveIntensity: 0.5 })); mark.rotation.x = -Math.PI / 2; mark.position.set(0.86, TY + 0.4275, TZ - 0.74); mark.renderOrder = 4; mark.castShadow = false; P.whole.add(mark);
  see(P.whole); partA.meshes[0].castShadow = true;
  const rowAt = (s) => {
    let lo = 0, hi = rows.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m].s <= s) lo = m; else hi = m; }
    const a = rows[lo], b = rows[hi], t = clamp((s - a.s) / (b.s - a.s || 1));
    return { p: a.c.map((v, i) => v + (b.c[i] - v) * t), w: a.w.map((v, i) => v + (b.w[i] - v) * t) };
  };
  const q = new THREE.Vector3(), T = new THREE.Vector3(), Wv = new THREE.Vector3(), N = new THREE.Vector3(), M = new THREE.Matrix4();
  const nearest = (arr, s) => { let d = 1e9; for (const v of arr) { const e = Math.abs(v - s); if (e < d) d = e; } return d; };
  let last = "";
  return {
    grip: 0,
    apply(ps) {
      const u = clamp(ps.unroll ?? 0), pull = (ps.pull ?? 0) > 0.5, key = `${u}|${pull}|${ps.count}`;
      mark.visible = (ps.count ?? S.count ?? 0) > 0.5;
      if (key === last) return; last = key;
      const sRoll = S0 + (L - S0) * u, sEnd = pull ? L - 1.7 : L, sDraw = Math.min(sRoll, sEnd);
      partA.update(sDraw); partB.update(sDraw);
      const rp = Math.sqrt(0.035 * 0.035 + (0.12 * 0.12 - 0.035 * 0.035) * (1 - u));
      R.frame.visible = !pull;
      if (pull) return;
      const a = rowAt(Math.max(0, sRoll - 0.06)), b = rowAt(Math.min(L, sRoll + 0.06)), c = rowAt(sRoll);
      T.set(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]).normalize(); Wv.set(...c.w).normalize(); N.crossVectors(T, Wv).normalize();
      T.crossVectors(Wv, N).normalize();
      const rockQ = clamp((sRoll - (L - 0.3)) / 0.3), rock = 12 * RAD * Math.sin(2 * TAU * rockQ) * (1 - rockQ);
      const hop = 0.045 * Math.max(0, 1 - nearest(noses, sRoll) / 0.22) * (c.p[2] > TZ - 0.3 && c.p[2] < 0.55 ? 1 : 0);
      const squash = 0.05 * Math.max(0, 1 - nearest(touches, sRoll) / 0.05);
      q.set(c.p[0], c.p[1], c.p[2]).addScaledVector(N, rp + 0.002).addScaledVector(new THREE.Vector3(0, 1, 0), hop).addScaledVector(T, rp * rock);
      M.makeBasis(Wv, N, T); R.frame.setRotationFromMatrix(M); R.frame.position.copy(q);
      R.frame.scale.set(1, 1 - squash, 1); R.spin.rotation.x = sRoll / Math.max(rp, 0.02) + rock;
      R.paper.visible = rp > 0.0365; R.paper.scale.set(1, rp, rp);
      R.frame.traverse((o) => { if (o.isMesh) o.castShadow = c.p[1] > 19.9; });
    },
  };
}

function scrollroll(P) {
  const R = makeRoller(P.whole, { wrap: true }); R.paper.scale.set(1, 0.055, 0.055);
  // the tongue: 0.16 of printed sheet hanging from the roll's front (-z), the bars on the -z face, a small curl outward
  const pts = [], n = 8; for (let i = 0; i < n; i++) { const t = i / (n - 1); pts.push([-0.05 - 0.16 * t, -0.052 - 0.02 * t * t]); }
  sheetMeshes(P.whole, sheetGeo(pts, W, (x, t) => 0.006 * (x / 0.2) ** 2 * (1 - t)), -1);
  return { grip: 0 };
}

function scrollsheet(P) {
  const S = P.spec, lean = 20 * RAD, h2 = 0.17, ty = h2 * Math.cos(lean), tz = h2 * Math.sin(lean);
  const bow = (x, t) => 0.02 * (x / 0.2) ** 2 * (t < 0.55 ? 1 : 1 - 0.6 * ss((t - 0.55) / 0.45));
  const page = [], np = 9; for (let i = 0; i < np; i++) { const t = i / (np - 1); page.push([ty - 2 * ty * t, tz - 2 * tz * t]); }
  const bezier = (p0, p1, p2, p3, k) => { const o = []; for (let i = 1; i <= k; i++) { const t = i / k, m = 1 - t; o.push([0, 1].map((c) => m * m * m * p0[c] + 3 * m * m * t * p1[c] + 3 * m * t * t * p2[c] + t * t * t * p3[c])); } return o; };
  const B = page[np - 1], dir = [-Math.cos(lean), -Math.sin(lean)];
  const tail0 = bezier(B, [B[0] + 0.06 * dir[0], B[1] + 0.06 * dir[1]], [-0.25, -0.07], [-0.31, -0.07], 10);
  const tail1 = bezier(B, [B[0] + 0.07 * dir[0], B[1] + 0.07 * dir[1]], [B[0] - 0.14, B[1] - 0.075], [B[0] - 0.22, B[1] - 0.085], 8);
  const g0 = sheetMeshes(P.whole, sheetGeo([...page, ...tail0], W, bow, 6), 1), g1 = sheetMeshes(P.whole, sheetGeo([...page, ...tail1], W, bow, 6), 1);
  const R = makeRoller(P.whole); const e = tail1[tail1.length - 1]; R.frame.position.set(0, e[0] - 0.034, e[1]);
  return { grip: 0, apply(ps) { const end = (ps.end ?? S.end ?? 0) > 0.5; g0.visible = !end; g1.visible = end; R.frame.visible = end; } };
}

function scrolltail(P) {
  const NR = 60, LEN = 2.40, { tileM } = bars(), pos = new Float32Array(NR * 2 * 3), uv = new Float32Array(NR * 2 * 2), idx = [];
  for (let i = 0; i < NR; i++) { const v = 1 - ((i / (NR - 1)) * LEN) / tileM; uv.set([0, v, 1, v], i * 4); }
  for (let i = 0; i < NR - 1; i++) { const a = 2 * i; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1.2, 0), 4);
  sheetMeshesFor(P.whole, geo);
  const R = makeRoller(P.whole);
  const shape = (sg, f) => {   // the ribbon's centre at arclength sg: a wave that runs down it as `fall` goes 0..1
    const a = ss(f * 3), ph = TAU * (sg / 1.6 - 0.8 * f), env = 0.35 + 0.65 * ss(sg / 0.7);
    return [0.08 * a * Math.sin(ph + 1.2) * env, -sg * (1 - 0.02 * a), 0.25 * a * Math.sin(ph) * env];
  };
  let last = -1;
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fall ?? 0); if (f === last) return; last = f;
      for (let i = 0; i < NR; i++) {
        const sg = (i / (NR - 1)) * LEN, c = shape(sg, f), c2 = shape(Math.min(LEN, sg + 0.02), f), c1 = shape(Math.max(0, sg - 0.02), f);
        const tx = c2[0] - c1[0], ty = c2[1] - c1[1], tz = c2[2] - c1[2], tl = Math.hypot(tx, ty, tz) || 1;
        pos.set([c[0] - W / 2, c[1], c[2], c[0] + W / 2, c[1], c[2]], i * 6);
        if (i === NR - 1) R.frame.position.set(c[0] + 0.03 * (tx / tl), c[1] + 0.03 * (ty / tl), c[2] + 0.03 * (tz / tl));
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}
function sheetMeshesFor(parent, geo) {
  const front = new THREE.Mesh(geo, paperMat(bars().tex, THREE.FrontSide)), back = new THREE.Mesh(geo, backMat());
  for (const o of [front, back]) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; parent.add(o); }
}

function goldstamp(P) {
  const gold = mat(GOLD, { roughness: 0.35, metalness: 0.35, emissive: new THREE.Color("#7a5410"), emissiveIntensity: 0.25 }), shade = mat("#b8862a", { roughness: 0.4, metalness: 0.3 }), light = mat("#ffe89a", { roughness: 0.3, emissive: new THREE.Color("#ffe89a"), emissiveIntensity: 0.25 });
  const rubber = mat("#b3261e", { roughness: 0.8 }), basicLight = new THREE.MeshBasicMaterial({ color: "#fff6c8" });
  const g = new THREE.Group(); P.whole.add(g);
  box(0.19, 0.012, 0.13, rubber, g, 0, 0.006, 0);                                   // the pad, origin at its face
  box(0.20, 0.045, 0.14, gold, g, 0, 0.0345, 0);                                    // the base
  box(0.202, 0.008, 0.142, shade, g, 0, 0.0185, 0);                                 // its shade band, low
  box(0.202, 0.007, 0.142, light, g, 0, 0.0535, 0);                                 // its light band, on the top edge
  const pts = [[0, 0], [0.032, 0], [0.030, 0.006], [0.024, 0.02], [0.022, 0.06], [0.022, 0.11], [0.030, 0.118]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(pts, 16), gold, g, 0, 0.057, 0);                     // turned neck r 0.030 -> 0.022, 0.11 high
  mesh(new THREE.SphereGeometry(0.05, 20, 14), gold, g, 0, 0.19, 0);   // ball knob, top y 0.24
  // the knob's one sheen stroke: a great-circle arc on its upper left front
  const dirs = [[-0.75, 0.35, 0.55], [-0.5, 0.62, 0.52], [-0.25, 0.85, 0.45]].map((d) => { const l = Math.hypot(...d); return new THREE.Vector3(d[0] / l, d[1] / l, d[2] / l).multiplyScalar(0.0505); });
  const sheen = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dirs), 10, 0.0028, 5), basicLight); sheen.position.set(0, 0.19, 0); sheen.castShadow = false; g.add(sheen);
  return { grip: 0 };
}

function goldmat(P) {
  const ww = 0.72, dd = 0.34, r = 0.02;
  const sh = new THREE.Shape(), x = -ww / 2, y = -dd / 2;
  sh.moveTo(x + r, y); sh.lineTo(x + ww - r, y); sh.quadraticCurveTo(x + ww, y, x + ww, y + r); sh.lineTo(x + ww, y + dd - r); sh.quadraticCurveTo(x + ww, y + dd, x + ww - r, y + dd); sh.lineTo(x + r, y + dd); sh.quadraticCurveTo(x, y + dd, x, y + dd - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  mesh(geo, mat("#b8862a", { roughness: 0.9 }), P.whole, 0, 0, 0);
  const ppm = 1000, tex = canvasTex(ww * ppm, dd * ppm, (g, w, h) => {
    const rr = (a, b, c, d, rad) => { g.beginPath(); g.moveTo(a + rad, b); g.arcTo(a + c, b, a + c, b + d, rad); g.arcTo(a + c, b + d, a, b + d, rad); g.arcTo(a, b + d, a, b, rad); g.arcTo(a, b, a + c, b, rad); g.closePath(); };
    g.clearRect(0, 0, w, h); g.fillStyle = "#b8862a"; rr(0, 0, w, h, r * ppm); g.fill();
    g.fillStyle = GOLD; rr(0.03 * ppm, 0.03 * ppm, w - 0.06 * ppm, h - 0.06 * ppm, 0.012 * ppm); g.fill();
    g.strokeStyle = "#c9972e"; g.lineCap = "round";
    const q = rng(4242);
    for (let i = 0; i < 14; i++) { const cx = (0.1 + 0.52 * q()) * ppm, cy = (0.07 + 0.2 * q()) * ppm, len = (0.06 + 0.06 * q()) * ppm, a = (q() - 0.5) * 0.5; g.lineWidth = (0.006 + 0.003 * q()) * ppm; g.beginPath(); g.moveTo(cx - Math.cos(a) * len / 2, cy - Math.sin(a) * len / 2); g.lineTo(cx + Math.cos(a) * len / 2, cy + Math.sin(a) * len / 2); g.stroke(); }
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(ww, dd), decalMat(tex)); top.rotation.x = -Math.PI / 2; top.position.y = 0.0205; top.renderOrder = 2; top.castShadow = false; P.whole.add(top);
  see(P.whole);
  return { grip: 0.02 };
}

// the stair's own number build (props-heavenstairs.js numberTex): face #f2c230, highlight #ffe89a over the top 34 %, outline 0.008 #8a5a12
function risernum(P) {
  const text = String(P.spec.text ?? "1"), PPM = 700, CAP = 0.17, OUT = 0.008, FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
  const g0 = document.createElement("canvas").getContext("2d"); g0.font = FONT(100);
  const m = g0.measureText(text), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, fs = (100 * CAP * PPM) / ih; g0.font = FONT(fs);
  const m2 = g0.measureText(text), iw = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight, l = m2.actualBoundingBoxLeft, a = m2.actualBoundingBoxAscent, d = m2.actualBoundingBoxDescent;
  const w = Math.ceil(iw + 24 + 2 * OUT * PPM), h = Math.round(0.21 * PPM);
  const tex = canvasTex(w, h, (g) => {
    g.font = FONT(fs); g.textAlign = "left"; g.textBaseline = "alphabetic"; g.lineJoin = "round";
    const x = (w - iw) / 2 + l, y = h / 2 + (a - d) / 2;
    g.strokeStyle = "#8a5a12"; g.lineWidth = 2 * OUT * PPM; g.strokeText(text, x, y); g.fillStyle = "#f2c230"; g.fillText(text, x, y);
    g.save(); g.beginPath(); g.rect(0, y - a, w, CAP * PPM * 0.34); g.clip(); g.fillStyle = "#ffe89a"; g.fillText(text, x, y); g.restore();
  });
  const mm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.10 });
  mm.userData.noOutline = true; mm.userData.noHatch = true;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w / PPM, h / PPM), mm); pl.castShadow = false; pl.receiveShadow = true; P.whole.add(pl); see(P.whole);
  return { grip: 0 };
}

export const HTERMS_KINDS = { termsscroll, scrollroll, scrollsheet, scrolltail, goldstamp, goldmat, risernum };
export const HTERMS_GRIPS = {};
