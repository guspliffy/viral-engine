// Norse myth 01 "One eye for one sip" (Wednesday), DESIGN.md section E2: the WIND THINGS of the tree set. The wind blows toward +x, everywhere and
// on everyone. Metres, x right, y up, +z toward the default camera (a prop faces +z at rot 0). No Math.random, no clock: every mark is drawn once from
// its index and spec.seed; every state is a pure function of the spec, the state keys and t (any frame in any order is the same).
// Place ALL FOUR kinds at the tree set's origin (x 0, y 0, z 0 of the set = the ground under the rope's hang point), rot 0; the numbers below
// are in that frame (the leaf pile's footprint is centred a little off it, as the design's table: (0.15, 0, 0.10)).
//
// ===== norseleaves   falling leaves  (not held; no grips)
//   ORIGIN: the middle of the box's floor (x, z centred, y 0 = the bottom of the box, the top is box[1]). 46 leaves in the air inside the box at
//   any time (160 in column mode), each a closed loop of t: it falls 0.6-1.1 m/s, drifts 2.2 m/s toward +x (+-8 %), sways 0.25 m, and rocks
//   35 degrees at 2-3 Hz; where a leaf leaves the box by a side or the top/bottom it has shrunk to nothing (scale, never opacity) and comes
//   back from the other side. Leaf shapes (5, by index): 3 pointed leaflets with fine teeth 0.06 / 0.08 / 0.11 long, 1 small round one 0.05, 1
//   three-lobed one 0.09; every leaf has a midrib, 4-6 side veins, curled edges and a drawn ink rim; DRY LEAF colours by hash.
//   spec  box [8, 6, 6]       [w, h, d] of the air box (column mode: [14, 40, 10])
//         column false        true: 160 leaves in a box of 14 x 40 x 10 (the crane up the trunk)
//         plate 0             a number > 0 lays the 5 leaf shapes in a row, upright, enlarged by that factor (6 = a close-up sheet); hides the air
//         seed 0
//   state gust 0..1 (0)       30 more leaves appear (staggered over gust 0.1-0.8) that fly 2.2 x as fast with paths lifted 15 degrees; the 46 base
//                             leaves rock up to 1.4 x as wide and lift up to 0.9 m. (A speed can not be integrated from a tween value in a pure function of
//                             t, so the base leaves keep their speed and the fast leaves are the gust: see NOTES in the delivery.)
//   Count: 46 + 30 (column 160 + 30) leaf slots, 5 shapes; a faded slot is scale 0.
//
// ===== norsepile   the leaf pile of the hollow between two buttress roots
//   ORIGIN: the tree origin on the ground (the footprint spans x -1.34..1.54, z -1.08..1.12: 2.8 x 2.2, peak 0.62 at about (0, 0.06): Chip's leaf
//   tips at 0.755 hang 0.135 over it). Three uneven lobes thinning toward +x (the hollow). Top layer 420 single leaves each drawn once; under it a
//   lumpy body in 3 tones (a heightfield) with 300 leaf edges standing out of it; 30 stalks and twigs (some forked); 5 bunches of winged seeds;
//   8 % of the leaves yellow-green, 6 % dark rotten ones with holes; 160 loose leaves on the ground within 3.5 m of the pile, thinning out; 90 burst
//   leaves (hidden until `burst`); 6 dust puffs #d9b877 (hidden until `burst`).
//   spec  at [0, 0]           [x, z] where Chip lands (the crater's centre; a 3-number [x, y, z] works too)
//         hole 0.12           radius of the hole round his ankles when the crater has closed (burst 1): only the two trainers show
//         seed 0
//   state burst 0..1 (0)      the drop at 28.5 s, director: 0 -> 1 in 2.4 s. 0 = the pile at rest. 0..0.08: a crater of r 0.34 opens 0.5 deep (the 25
//                             top leaves inside it are blown away); 90 leaves leave it between 0.015 and 0.085, fly 0.6-1.6 up and out about 1.3, tumbling,
//                             rising faster than they fall; all have landed by 1 (the latest land at 1.0). 0.35..1: the rim closes in to the hole of r 0.12
//                             with a collar of leaves (the funnel inside is dark). 6 dust puffs grow and shrink away over 0.02..0.6.
//         rustle 0..1 (0.3)   30 top leaves lift 0.03 and slide up to 0.05 in pulses (a pulse every 1.6-3.2 s per leaf); 4 leaves a second at 0.3 (up to
//                             8 at 1) lift off and fly downwind 2.6 m in 2 s, tumbling, and shrink away.
//
// ===== norserope   hemp rope: 3 turns + a hitch round the branch, down 0.50 to a 2-turn loop and a knot round Chip's RIGHT ankle
//   ORIGIN: the tree origin on the ground. The branch B1 is a cylinder of radius spec.branchR at height spec.branchY over the origin (underside
//   y 2.085); the rope is hemp 0.022 thick, 3 strands (lay 0.036: a strand mark every 0.012), #b9975a, shade #7d6236. 3 turns lie side by side (0.0225 apart)
//   in the old groove, a trefoil hitch sits on top with a tail of 0.18; the standing part drops from the branch's underside behind the foot to the ankle
//   loop: 2 turns (0.0225 apart down the leg), a knot at the front, tail 0.07. 14 frayed fibres: 7 at each tail end. The loop is always round the ankle,
//   no gap, never through the shoe (the standing part keeps 0.07 from the leg's axis past the shoe: it rises behind the leg).
//   spec  end [0, 1.585, 0]   [x, y, z] the ankle: where the loop's top turn sits (the shoe is above it; the standing part rises behind the leg, -z)
//         ankle 0.034         the leg's radius at the loop (the loop is 0.09 across with the default: 2 x (0.034 + 0.011))
//         branchY 2.36        height of the branch's axis at the hang point; branchR 0.275: its radius (E1: 0.55 thick there)
//         axis [1, 0, 0]      the branch's direction at the hang point (E1's slopes are about 3 degrees: pass the tangent for a perfect fit)
//         slipAt 28.5         the time (s) the loop lets go: the empty loop then swings 12 degrees and settles in 2 s (exp. decay 2.2 /s, 0.9 Hz)
//         bar false           true: draws a plain bar for the branch (BENCH ONLY: the tree builds the real one)
//         seed 0
//   state swing -1..1 (0)     the rope's lower part swings 15 degrees about the hang point (+ toward +x, the wind)
//         twist -1..1 (0)     the lower rope twists 20 degrees about the vertical through the ankle (Chip turns 20 degrees the same way: rotate him)
//         slip 0..1 (0)       0..0.5 the knot creeps open (the loop 0.03 wider, the knot loosens); 0.5..1 it lets go (director: 4 frames), the loop swings
//                             down to hang empty in the vertical plane, 0.09 across. After it the swing from slipAt (above) is added to `swing`.
//
// ===== norsestaves   the nine rune staves (21.0 s)
//   ORIGIN: the centre of the staves' column on the trunk's near face at the centre of the fall (y 0 = middle of the span); +z toward the camera,
//   the trunk behind at z 0, rot it with the trunk's face. 9 slips of pale ASH WOOD 0.46 x 0.07 x 0.012, bark on one edge, both ends cut slanting, ONE
//   mark cut in the flat face and glowing (cut #3a2c1c filled #fff1b8, a halo 0.06 #f2cf6a at 0.5, the wood warm round it; the mark is as tall as the face
//   allows: see width). Order of the marks: M4, M1, M2, M3, M5, M6, M8, M10, M9 (day, last and nearest the camera). They sink 0.35 m/s, each turns 0.25 turns a
//   second about its length, sways 0.2 side to side, 0.25 s apart, 0.6-2.5 m in front of the trunk (z by index, M9 at 2.5); 6 round gold motes trail each
//   and shrink away. A stave is 165 px long in a frame 3 m wide.
//   spec  span 9              metres of fall from "above the frame" (fall 0) to "below it" (fall 1)
//         width 0.07          the stave's width. A mark 0.20 tall (6 % cut) needs about 0.10 of face for M6 M9 M11; on 0.07 each mark is scaled to fit
//         plate false         true: the nine laid in a row (x -1.2..1.2), upright, facing +z, no spin (the count sheet)
//         flares []           [[x, y, z], ...] carved marks on the trunk in this frame: a gold flare grows on each as a stave passes its height
//         seed 0
//   state fall 0..1 (0)       0 all above the frame, 1 all below (the last stave leaves at 1); a stave i is 0.25 s (0.0097 of the fall at 0.35 m/s) after i-1
// Nothing here is held: NORSE_WIND_GRIPS is empty.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp } from "./util.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mod = (a, b) => ((a % b) + b) % b;
const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const V3 = THREE.Vector3;

const PAL = {
  dry: ["#d9952e", "#e6b23c", "#b86f26", "#8a4f22", "#c9c04a"], yg: ["#b4bd45", "#a2b53c"], rot: ["#5a3a20", "#4a3020"],
  ash: "#c9a46a", ashS: "#8f6f42", ashL: "#e6c890", bark: "#5b4a3c", barkR: "#8a7560", barkF: "#2e241d",
  hemp: "#b9975a", hempS: "#7d6236", hempL: "#d8bf8a", rune: "#f2cf6a", cut: "#3a2c1c", glow: "#fff1b8",
  twig: ["#6b4a2b", "#8a6a40", "#4a3420", "#7a5a38"], seed: "#c9a45a", seedS: "#8f6f3a",
};

// ---------------------------------------------------------------------------------------------------------------------------------------
// materials and canvases
// ---------------------------------------------------------------------------------------------------------------------------------------
function canvasTex(w, h, draw, aniso = 4) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, ...o }); m.userData.noHatch = true; return m; };
const glowMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const steamy = (o, order = 4) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };
function geoOf(pos, col, idx, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (col) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// ---------------------------------------------------------------------------------------------------------------------------------------
// the five leaf shapes: a surface lying flat (normal +y, the stalk at +z, the tip at -z), centred on its middle; UV (across, along) for the vein map
// ---------------------------------------------------------------------------------------------------------------------------------------
const LEAFK = [
  { L: 0.06, kind: "ash", teeth: 7, W: 0.20, veins: 4 },
  { L: 0.08, kind: "ash", teeth: 8, W: 0.19, veins: 5 },
  { L: 0.11, kind: "ash", teeth: 10, W: 0.17, veins: 6 },
  { L: 0.05, kind: "round", teeth: 9, W: 0.40, veins: 4 },
  { L: 0.09, kind: "lobed", teeth: 0, W: 1, veins: 5 },
];
const LOBED = [[0, 0.03], [0.08, 0.13], [0.17, 0.34], [0.25, 0.43], [0.32, 0.31], [0.39, 0.13], [0.45, 0.11], [0.53, 0.2], [0.63, 0.29], [0.73, 0.27], [0.85, 0.16], [0.95, 0.05], [1, 0]];
const saw = (x) => { const f = x - Math.floor(x); return f < 0.7 ? f / 0.7 : (1 - f) / 0.3; };   // slow rise, quick drop: a tooth
function halfW(k, t, side) {   // half width in units of the leaf's length
  const D = LEAFK[k];
  if (D.kind === "ash") {
    const g = Math.pow(Math.sin(Math.PI * Math.pow(Math.max(t, 1e-4), 0.72)), 0.85);
    const env = sm((t - 0.1) / 0.2) * (1 - sm((t - 0.93) / 0.07));
    return Math.max(0.003 * (1 - t), D.W * g * (1 + 0.17 * env * (saw(t * D.teeth + (side > 0 ? 0.35 : 0)) - 0.5) * 2));
  }
  if (D.kind === "round") return Math.max(0.003, D.W * Math.pow(Math.sin(Math.PI * t), 0.62) * (1 + 0.05 * (saw(t * D.teeth + (side > 0 ? 0.3 : 0)) - 0.5)));
  let i = 0; while (i < LOBED.length - 2 && t > LOBED[i + 1][0]) i++;
  const a = LOBED[i], b = LOBED[i + 1], u = sm((t - a[0]) / (b[0] - a[0]));
  return (a[1] + (b[1] - a[1]) * u) * (side > 0 ? 0.96 : 1.03);
}
function leafGeo(k, flat) {
  const D = LEAFK[k], L = D.L, nt = D.kind === "ash" ? D.teeth * 3 + 6 : D.kind === "round" ? 20 : 30;
  const pos = [], col = [], uv = [], idx = [];
  const S = [-0.88, -0.44, 0, 0.44, 0.88], INK = 0.88;
  const zf = (s, t, hw) => (hw * (0.25 * Math.abs(s) + 0.55 * Math.abs(s) ** 3) - 0.12 * t * t) * L;
  const vtx = (s, t, c) => { const hw = halfW(k, t, s < 0 ? -1 : 1); pos.push(s * hw * L, t * L, zf(s, t, hw)); const q = c * (0.9 + 0.1 * t); col.push(q, q, q); uv.push((s + 1) / 2, t); };
  // surface
  for (let i = 0; i <= nt; i++) for (const s of S) vtx(s, i / nt, 1);
  for (let i = 0; i < nt; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b = a + 1, c = a + 5, d = c + 1; idx.push(a, b, c, b, d, c); }
  // the ink rim: a band between 0.88 and 1.0 of the half width, a hard step (own vertices), both sides
  for (const sg of [-1, 1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= nt; i++) { vtx(sg * INK, i / nt, 0.22); vtx(sg, i / nt, 0.22); }
    for (let i = 0; i < nt; i++) { const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3; if (sg > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  }
  // the stalk: 0.14 long, tapering, a darker green-brown
  { const base = pos.length / 3, n = 3;
    for (let i = 0; i <= n; i++) { const y = -0.14 * L * (i / n), w = (0.011 - 0.004 * (i / n)) * L; pos.push(-w, y, 0, w, y, 0); col.push(0.5, 0.5, 0.5, 0.5, 0.5, 0.5); uv.push(0.5, 0.02, 0.5, 0.02); }
    for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = geoOf(pos, col, idx, uv);
  if (!flat) return g;
  g.rotateX(-Math.PI / 2); g.translate(0, 0, 0.43 * L); g.computeVertexNormals(); return g;
}
function leafTex(k, rot) {
  const D = LEAFK[k];
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    const X = (u) => u * w, Y = (v) => (1 - v) * h;
    g.lineCap = "round";
    g.strokeStyle = "rgb(190,190,190)"; g.lineWidth = 3.2; g.beginPath(); g.moveTo(X(0.5), Y(0.0)); g.lineTo(X(0.5), Y(0.95)); g.stroke();
    g.strokeStyle = "rgb(197,197,197)"; g.lineWidth = 2;
    for (let i = 0; i < D.veins; i++) {
      const v0 = 0.12 + (0.7 * i) / D.veins, dv = D.kind === "round" ? 0.1 : 0.14, du = D.kind === "round" ? 0.42 : D.kind === "lobed" ? 0.44 : 0.38;
      for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(X(0.5), Y(v0)); g.lineTo(X(0.5 + sg * du), Y(Math.min(0.96, v0 + dv))); g.stroke(); }
    }
    if (rot) { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 4; i++) { const hx = 0.25 + 0.5 * hh(k * 7 + i * 3.1), hy = 0.18 + 0.6 * hh(k * 5 + i * 1.7), r = 3 + 4 * hh(k + i * 2.3); g.beginPath(); g.arc(X(hx), Y(hy), r, 0, TAU); g.fill(); } g.globalCompositeOperation = "source-over"; }
  });
}
let LEAF_RES = null;
function leafRes() {
  if (LEAF_RES) return LEAF_RES;
  const mk = (rot) => LEAFK.map((_, k) => { const m = stdMat({ color: "#ffffff", map: leafTex(k, rot), vertexColors: true, side: THREE.DoubleSide, alphaTest: rot ? 0.5 : 0, roughness: 0.8 }); return noLine(m); });
  LEAF_RES = { flat: LEAFK.map((_, k) => leafGeo(k, true)), raw: LEAFK.map((_, k) => leafGeo(k, false)), mat: [mk(false), mk(true)] };
  return LEAF_RES;
}
// a leaf's look by index: shape, rotten, colour (8 % yellow-green, 6 % rotten with holes, else a dry colour; a little tone variation)
function leafLook(i, salt, allowRot = true) {
  const u = hh(i * 3.17 + salt), shape = Math.floor(hh(i * 5.3 + salt + 1.3) * 5), v = hh(i * 2.9 + salt + 4.1);
  let c, rot = false;
  if (allowRot && u < 0.06) { rot = true; c = PAL.rot[i % 2]; }
  else if (u < 0.14) c = PAL.yg[i % 2];
  else c = PAL.dry[Math.floor(hh(i * 4.7 + salt + 2.2) * 5) % 5];
  c = v < 0.5 ? cmix(c, "#3a2412", 0.14 * (0.5 - v) * 2) : cmix(c, "#fff0b0", 0.12 * (v - 0.5) * 2);
  return { shape, rot, color: c };
}

// instanced leaves: one InstancedMesh per (shape, rotten); a leaf is a slot with its own matrix and colour
const _M = new THREE.Matrix4(), _V = new V3(), _S = new V3(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(0, 0, 0, "YXZ"), _Q2 = new THREE.Quaternion(), _N = new V3(), _UP = new V3(0, 1, 0);
class LeafSet {
  constructor(plan, parent) {
    const R = leafRes(), buckets = new Map(); this.slot = []; this.meshes = [];
    plan.forEach((p, i) => { const key = p.shape * 2 + (p.rot ? 1 : 0); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(i); });
    for (const [key, list] of buckets) {
      const shape = key >> 1, rot = key & 1, im = new THREE.InstancedMesh(R.flat[shape], R.mat[rot][shape], list.length);
      im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.userData.solid = false;
      list.forEach((pi, j) => { this.slot[pi] = { im, j }; im.setColorAt(j, new THREE.Color(plan[pi].color)); _M.makeScale(0, 0, 0); im.setMatrixAt(j, _M); });
      im.instanceColor.needsUpdate = true; parent.add(im); this.meshes.push(im);
    }
  }
  set(i, x, y, z, q, sx, sy = sx, sz = sx) { const s = this.slot[i]; _M.compose(_V.set(x, y, z), q, _S.set(sx, sy, sz)); s.im.setMatrixAt(s.j, _M); }
  hide(i) { const s = this.slot[i]; _M.makeScale(0, 0, 0); s.im.setMatrixAt(s.j, _M); }
  flush() { for (const im of this.meshes) im.instanceMatrix.needsUpdate = true; }
}
const qYXZ = (x, y, z, out = _Q) => out.setFromEuler(_E.set(x, y, z));
// a leaf lying on a surface with normal n: yaw about the normal after a tilt (tx about its x, tz about its z)
function qOnSurface(n, yaw, tx, tz, out = new THREE.Quaternion()) {
  const q1 = _Q.setFromUnitVectors(_UP, n), q2 = _Q2.setFromAxisAngle(n, yaw), qt = new THREE.Quaternion().setFromEuler(_E.set(tx, 0, tz));
  return out.copy(q2).multiply(q1).multiply(qt);
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// norseleaves
// ---------------------------------------------------------------------------------------------------------------------------------------
function norseleaves(P) {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root);
  const seed = (S.seed ?? 0) * 13.7, col = !!S.column, box = S.box || (col ? [14, 40, 10] : [8, 6, 6]), [bw, bh, bd] = box;
  const plate = +S.plate || 0, R = leafRes();
  const nBase = col ? 160 : 46, nGust = 30, N = nBase + nGust;
  // the plate of the 5 shapes
  const plateG = new THREE.Group(); root.add(plateG); plateG.visible = plate > 0;
  if (plate > 0) for (let k = 0; k < 5; k++) {
    const m = new THREE.Mesh(R.raw[k], R.mat[0][k]); m.userData.solid = false; m.castShadow = false;
    const sc = plate; m.scale.setScalar(sc); m.position.set((k - 2) * 0.092 * sc, 0.1 * sc - 0.02, 0); m.rotation.set(-0.12, 0.28 - k * 0.04, 0);
    const mat = m.material.clone(); noLine(mat); m.material = mat; m.material.color.set(PAL.dry[k]); plateG.add(m);
  }
  const plan = [], L = [];
  for (let i = 0; i < N; i++) {
    const look = leafLook(i, seed + 11, false); plan.push(look);
    const g = i >= nBase, h1 = (n) => hh(i * 13.1 + n * 7.7 + seed);
    const v = lerp(0.6, 1.1, h1(1)), drift = 2.2 * (0.92 + 0.16 * h1(2)) * (g ? 2.2 : 1);
    L.push({
      g, th: g ? 0.1 + (0.7 * (i - nBase)) / nGust : 0, x0: h1(3) * bw, y0: h1(4) * bh, z0: (h1(5) - 0.5) * bd * 0.9,
      vy: g ? -v * 2.2 + drift * Math.tan(15 * DEG) : -v, vx: drift, f: 2 + h1(6), ph: h1(7) * TAU, ph2: h1(8) * TAU, ph3: h1(9) * TAU,
      yaw0: h1(10) * TAU, spin: (h1(11) - 0.5) * 1.6, ax: h1(12) * TAU, sc: 0.9 + 0.4 * h1(13),
    });
  }
  const set = new LeafSet(plan, root);
  const q = new THREE.Quaternion(), qr = new THREE.Quaternion(), ax = new V3();
  return {
    grip: 0,
    apply(ps, t = 0) {
      const gust = clamp(ps.gust ?? 0);
      if (plate > 0) { for (let i = 0; i < N; i++) set.hide(i); set.flush(); return; }
      for (let i = 0; i < N; i++) {
        const l = L[i];
        let vis = 1;
        if (l.g) vis = sm((gust - l.th) / 0.2);
        if (vis <= 0.001) { set.hide(i); continue; }
        const xs = mod(l.x0 + l.vx * t, bw) - bw / 2, ys = mod(l.y0 + l.vy * t, bh);
        vis *= sm(Math.min(xs + bw / 2, bw / 2 - xs) / 0.5) * sm(Math.min(ys, bh - ys) / 0.5);
        const lift = l.g ? 0 : gust * 0.9 * (0.5 + 0.5 * Math.sin(l.ph + 0.3 * t * l.f));
        const x = xs + 0.25 * Math.sin(TAU * 0.55 * t + l.ph2), y = ys + lift, z = l.z0 + 0.3 * Math.sin(TAU * 0.4 * t + l.ph3);
        const amp = 35 * DEG * (l.g ? 1 : 1 + 0.4 * gust), rock = amp * Math.sin(TAU * l.f * t + l.ph);
        ax.set(Math.cos(l.ax), 0, Math.sin(l.ax));
        q.setFromAxisAngle(_UP, l.yaw0 + l.spin * t);
        qr.setFromAxisAngle(ax, rock); q.multiply(qr);
        qr.setFromEuler(_E.set(0.35 * Math.sin(TAU * 0.33 * t + l.ph2), 0, (l.g ? -0.3 : 0.12) + 0.3 * Math.sin(TAU * 0.27 * t + l.ph3))); q.multiply(qr);
        set.set(i, x, y, z, q, l.sc * vis);
      }
      set.flush();
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// norsepile
// ---------------------------------------------------------------------------------------------------------------------------------------
const SOFT = (() => { let t = null; return () => t ||= canvasTex(64, 64, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.5, "rgba(255,255,255,0.55)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, 1); })();
// a tube along a polyline [[x,y,z]...] with radius r0 -> r1 and a vertex colour
function tubeGeo(pts, r0, r1, seg, color, cap = true) {
  const n = pts.length, Pn = pts.map((p) => new V3(...p)), pos = [], col = [], idx = [], c3 = lin(color);
  const T = Pn.map((p, i) => Pn[Math.min(n - 1, i + 1)].clone().sub(Pn[Math.max(0, i - 1)]).normalize());
  let N0 = Math.abs(T[0].y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0); N0 = N0.sub(T[0].clone().multiplyScalar(N0.dot(T[0]))).normalize();
  for (let i = 0; i < n; i++) {
    N0 = N0.sub(T[i].clone().multiplyScalar(N0.dot(T[i]))).normalize(); const B = new V3().crossVectors(T[i], N0).normalize(), r = lerp(r0, r1, i / (n - 1));
    for (let s = 0; s < seg; s++) { const a = (s / seg) * TAU, d = N0.clone().multiplyScalar(Math.cos(a) * r).add(B.clone().multiplyScalar(Math.sin(a) * r)); pos.push(Pn[i].x + d.x, Pn[i].y + d.y, Pn[i].z + d.z); col.push(...c3); }
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg, c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
  if (cap) for (const [i, flip] of [[0, true], [n - 1, false]]) { const c = pos.length / 3; pos.push(Pn[i].x, Pn[i].y, Pn[i].z); col.push(...c3); for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg; if (flip) idx.push(c, b, a); else idx.push(c, a, b); } }
  return geoOf(pos, col, idx);
}

function norsepile(P) {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root);
  const seed = (S.seed ?? 0) * 9.1, hole = S.hole ?? 0.12, R0 = 0.34;
  const at = Array.isArray(S.at) ? (S.at.length >= 3 ? [S.at[0], S.at[2]] : [S.at[0], S.at[1]]) : [0, 0];
  // ---- the heightfield: 3 uneven lobes, thinning toward the hollow (+x), lumps
  const LOBES = [[0.0, 0.06, 0.86, 0.80, 0.60], [-0.72, 0.62, 0.70, 0.62, 0.46], [0.84, -0.42, 0.76, 0.64, 0.42]];
  const LUMPS = []; for (let i = 0; i < 16; i++) LUMPS.push([-1.2 + 2.6 * hh(i * 3.3 + seed + 1), -0.95 + 2.0 * hh(i * 5.1 + seed + 2), 0.10 + 0.14 * hh(i * 2.7 + seed), (hh(i * 7.9 + seed + 3) - 0.5) * 0.05]);
  const Hr = (x, z) => {
    let s = 0;
    for (const [cx, cz, rx, rz, h] of LOBES) { const d2 = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2; if (d2 < 1) s += Math.pow(h * Math.pow(1 - d2, 1.2), 2); }
    let H = Math.sqrt(s); if (H <= 0.0005) return 0;
    for (const [cx, cz, r, a] of LUMPS) { const d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (r * r); if (d2 < 4) H += a * Math.exp(-d2) * sm(H / 0.1); }
    H *= 1 - 0.32 * sm((x - 0.8) / 0.7);
    return Math.max(0, H);
  };
  // ---- the crater: opens over b 0..0.08, holds, closes in over 0.35..1 to the hole with a collar
  const cs = (b) => { const open = sm(b / 0.08), close = sm((b - 0.35) / 0.65); return { open, close, R: lerp(R0, hole, close) * (0.15 + 0.85 * open), D: lerp(0.5, 0.05, close) * open, pit: 0.3 * close * open, lip: (0.05 * (1 - close) + 0.035 * close) * open }; };
  const Hb = (x, z, b, c = b > 0 ? cs(b) : null) => {
    const h = Hr(x, z); if (!c || c.open <= 0) return h;
    const r = Math.hypot(x - at[0], z - at[1]); let y = h;
    if (r < c.R) { const q = r / c.R; y = Math.max(h - c.D * (1 - q * q), Math.min(h, 0.03)); }
    y += c.lip * Math.exp(-(((r - 1.22 * c.R) / (0.3 * c.R + 0.03)) ** 2));
    if (c.pit > 0) y -= c.pit * (1 - sm(r / (hole * 1.2)));
    return Math.max(h > 0.004 ? 0.01 : 0, y);
  };
  const nrm = (x, z, b, c, out) => { const e = 0.035, dx = Hb(x + e, z, b, c) - Hb(x - e, z, b, c), dz = Hb(x, z + e, b, c) - Hb(x, z - e, b, c); return out.set(-dx / (2 * e), 1, -dz / (2 * e)).normalize(); };
  // ---- the lumpy body: a heightfield, painted once with 2600 litter leaves in 3 tones (planar UV over the footprint: nothing tiles)
  const X0 = -1.5, X1 = 1.8, Z0 = -1.25, Z1 = 1.45, NX = 96, NZ = 80, cols = NX + 1, nV = (NX + 1) * (NZ + 1);
  const bp = new Float32Array(nV * 3), bc = new Float32Array(nV * 3), buv = new Float32Array(nV * 2), hv = new Float32Array(nV);
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const v = j * cols + i, x = X0 + (X1 - X0) * (i / NX), z = Z0 + (Z1 - Z0) * (j / NZ);
    bp[v * 3] = x; bp[v * 3 + 2] = z; buv[v * 2] = i / NX; buv[v * 2 + 1] = 1 - j / NZ; hv[v] = Hr(x, z);
  }
  const bidx = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * cols + i; if (Math.max(hv[a], hv[a + 1], hv[a + cols], hv[a + cols + 1]) > 0) bidx.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1); }
  const litter = canvasTex(2048, 1664, (g, w, h) => {
    const px = w / (X1 - X0), tone = ["#6e3f1c", "#9a5c24", "#c98a2c"];
    g.fillStyle = "#5c3418"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = tone[i % 3]; g.globalAlpha = 0.28; g.beginPath(); g.ellipse(hh(i * 3.3 + seed) * w, hh(i * 5.1 + seed + 1) * h, 40 + 130 * hh(i * 2.9), 30 + 100 * hh(i * 4.7), hh(i * 7.3) * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    let n = 0;
    for (let c = 0; n < 2600 && c < 20000; c++) {
      const x = X0 + (X1 - X0) * hh(c * 2.13 + seed + 3), z = Z0 + (Z1 - Z0) * hh(c * 3.31 + seed + 4); if (Hr(x, z) < 0.008) continue;
      const lay = n < 800 ? 0 : n < 1800 ? 1 : 2, L = (0.04 + 0.05 * hh(c * 1.7)) * px, wd = L * (0.22 + 0.16 * hh(c * 2.7)), col = lay === 0 ? cmul(PAL.dry[Math.floor(hh(c * 4.1) * 5)], 0.55) : lay === 1 ? cmul(PAL.dry[Math.floor(hh(c * 4.3) * 5)], 0.8) : PAL.dry[Math.floor(hh(c * 4.7) * 5)];
      g.save(); g.translate((x - X0) * px, (z - Z0) * px); g.rotate(hh(c * 6.1) * TAU);
      g.beginPath(); g.moveTo(0, -L / 2); g.quadraticCurveTo(wd * 1.3, -L * 0.15, 0, L / 2); g.quadraticCurveTo(-wd * 1.3, -L * 0.15, 0, -L / 2);
      g.fillStyle = col; g.fill(); g.strokeStyle = cmul(col, 0.5); g.lineWidth = 1.4; g.stroke();
      g.strokeStyle = cmul(col, 0.72); g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L / 2); g.lineTo(0, L / 2); g.stroke();
      g.restore(); n++;
    }
  }, 8);
  const bodyGeo = new THREE.BufferGeometry(); bodyGeo.setAttribute("position", new THREE.BufferAttribute(bp, 3)); bodyGeo.setAttribute("color", new THREE.BufferAttribute(bc, 3)); bodyGeo.setAttribute("uv", new THREE.BufferAttribute(buv, 2)); bodyGeo.setIndex(bidx);
  const bodyMat = noLine(stdMat({ vertexColors: true, map: litter, roughness: 0.95 })); bodyMat.userData.noShine = true; bodyMat.userData.krimK = 0;
  const body = new THREE.Mesh(bodyGeo, bodyMat); body.castShadow = false; body.receiveShadow = true; body.frustumCulled = false; body.userData.solid = false; root.add(body);
  const updateBody = (b) => {
    const c = b > 0 ? cs(b) : null;
    for (let v = 0; v < nV; v++) {
      const x = bp[v * 3], z = bp[v * 3 + 2], h0 = hv[v], hb = Hb(x, z, b, c);
      bp[v * 3 + 1] = hb + 0.002;
      const ao = (h0 > 0.004 ? 0.55 + 0.45 * sm(hb / 0.12) : 0.85) * (1 - 0.8 * sm((h0 - hb) / 0.3)), dk = 0.25 + 0.75 * ao;
      bc[v * 3] = bc[v * 3 + 1] = bc[v * 3 + 2] = dk;
    }
    bodyGeo.attributes.position.needsUpdate = true; bodyGeo.attributes.color.needsUpdate = true; bodyGeo.computeVertexNormals();
  };
  // ---- leaves: top 420, mid 300, loose 160, burst 90, flyers 16
  const NT = 420, NM = 300, NL = 160, NB = 90, NF = 16, oT = 0, oM = NT, oL = NT + NM, oB = oL + NL, oF = oB + NB, NALL = oF + NF;
  const sample = (n, salt, dens) => { const out = []; let c = 0; while (out.length < n && c < n * 80) { const x = X0 + (X1 - X0) * hh(c * 2.31 + salt + seed), z = Z0 + (Z1 - Z0) * hh(c * 3.77 + salt + 9.1 + seed), h = Hr(x, z); if (h > 0.02 && hh(c * 7.13 + salt + 4.4) < dens(h)) out.push([x, z]); c++; } return out; };
  const top = sample(NT, 1, (h) => 0.25 + 0.75 * (h / 0.62)), mid = sample(NM, 50, (h) => 0.2 + 0.8 * (h / 0.62));
  const plan = [], rec = [];
  const mkRec = (i, kind, x, z, extra) => ({ i, kind, x, z, r: Math.hypot(x - at[0], z - at[1]), yaw: hh(i * 3.9 + seed) * TAU, tx: 0, tz: 0, s: 1, yo: 0, ...extra });
  for (let i = 0; i < NT; i++) { const [x, z] = top[i % top.length]; plan.push(leafLook(i, seed + 21)); rec.push(mkRec(i, "top", x, z, { tx: (hh(i * 1.7) - 0.5) * 0.5, tz: (hh(i * 2.3) - 0.5) * 0.5, s: 0.95 + 0.4 * hh(i * 6.1 + seed), yo: 0.004 + 0.004 * hh(i * 8.3) })); }
  for (let i = 0; i < NM; i++) { const [x, z] = mid[i % mid.length]; plan.push(leafLook(i + 500, seed + 31)); const st = (25 + 40 * hh(i * 3.3 + seed)) * DEG; rec.push(mkRec(oM + i, "mid", x, z, { tx: st * (hh(i * 4.1) < 0.5 ? 1 : -1), tz: (hh(i * 5.9) - 0.5) * 0.9, s: 1.0 + 0.35 * hh(i * 6.1 + seed), yo: -0.006 - 0.02 * hh(i * 8.3) })); }
  for (let i = 0; i < NL; i++) {   // loose leaves within 3.5 m of the pile, thinning out; wind drifts them toward +x
    const a = TAU * hh(i * 2.9 + seed + 7) + 0.9 * (hh(i * 1.3) - 0.5), r = 0.9 + 2.6 * Math.pow(hh(i * 4.3 + seed + 3), 1.8), x = 0.15 + 1.3 * r * Math.cos(a) * 0.8 + 0.5 * r * 0.2, z = 0.1 + r * Math.sin(a) * 0.8;
    plan.push(leafLook(i + 900, seed + 41)); rec.push(mkRec(oL + i, "loose", x, z, { tx: (hh(i * 1.9) - 0.5) * 0.4, tz: (hh(i * 2.1) - 0.5) * 0.4, s: 0.95 + 0.4 * hh(i * 6.1), yo: 0.003 + 0.003 * hh(i * 8.1) }));
  }
  // the burst leaves: launch from the crater, fly out about 1.3, land on the finished surface (burst 1) by their own time
  const Hfin = (x, z) => Hb(x, z, 1);
  for (let k = 0; k < NB; k++) {
    plan.push(leafLook(k + 1300, seed + 61, true));
    const th = 2.39996 * k + 0.4, d = 0.2 + 1.5 * Math.sqrt(hh(k * 3.1 + seed + 5)), lx = at[0] + 0.25 * Math.sqrt(hh(k * 1.3)) * Math.cos(th), lz = at[1] + 0.25 * Math.sqrt(hh(k * 1.3)) * Math.sin(th);
    const ex = at[0] + d * Math.cos(th) + 0.3, ez = at[1] + d * Math.sin(th), ey = Hfin(ex, ez) + 0.006 + 0.0004 * k;
    rec.push({ i: oB + k, kind: "burst", lx, lz, ex, ez, ey, tl: 0.015 + 0.07 * hh(k * 2.7 + seed), bl: 0.62 + 0.38 * Math.pow(hh(k * 5.3 + seed + 1), 0.6), up: 0.6 + 1.0 * hh(k * 6.7 + seed), turns: 2 + 2 * hh(k * 1.9), tax: new V3(hh(k * 2.2) - 0.5, hh(k * 3.3) - 0.5, hh(k * 4.4) - 0.5).normalize(), yaw: hh(k * 3.9 + seed) * TAU, s: 1.0 + 0.3 * hh(k * 6.1), nrm: nrm(ex, ez, 1, cs(1), new V3()) });
  }
  for (let f = 0; f < NF; f++) { plan.push(leafLook(f + 1700, seed + 71, false)); rec.push({ i: oF + f, kind: "fly" }); }
  const set = new LeafSet(plan, root);
  // rustle: 30 top leaves (windward half of the pile, away from the crater)
  const RUS = []; for (let c = 0, f = 0; f < 30 && c < 4000; c++) { const i = (c * 13 + 5) % NT, e = rec[i]; if (e.r > 0.6 && e.x > -0.9 && !RUS.some((q) => q.i === i)) { RUS.push({ i, per: 1.6 + 1.6 * hh(f * 3.1 + seed), ph: hh(f * 5.7 + seed) }); f++; } }
  // twigs and stalks (30, some forked), 5 seed bunches: static, kept off the crater
  const keepOff = (x, z) => Math.hypot(x - at[0], z - at[1]) > 0.6;
  const wood = new THREE.Group(); root.add(wood); const woodGeos = [];
  for (let i = 0; i < 30; i++) {
    let x = 0, z = 0, c = 0; do { const p = sample(1, 100 + i * 7 + c * 3, () => 1)[0] || [0, 0]; x = p[0]; z = p[1]; c++; } while (!keepOff(x, z) && c < 20);
    const yaw = hh(i * 2.9 + seed + 8) * TAU, len = 0.12 + 0.28 * hh(i * 3.7 + seed + 9), r0 = 0.0035 + 0.004 * hh(i * 5.1), col = PAL.twig[i % 4], cs_ = Math.cos(yaw), sn = Math.sin(yaw);
    const bow = (hh(i * 6.3) - 0.5) * 0.06, pts = []; const nn = 5;
    for (let k = 0; k < nn; k++) { const u = k / (nn - 1), d = (u - 0.5) * len, px = x + d * cs_ - bow * Math.sin(Math.PI * u) * sn, pz = z + d * sn + bow * Math.sin(Math.PI * u) * cs_; pts.push([px, Hr(px, pz) + r0 * 0.6 + 0.004 * Math.sin(u * 5 + i), pz]); }
    woodGeos.push(tubeGeo(pts, r0, r0 * 0.45, 5, col));
    if (i % 3 === 0) {   // a fork: a short side twig
      const u0 = 0.35 + 0.3 * hh(i * 1.1), p0 = pts[Math.round(u0 * (nn - 1))], ya = yaw + (hh(i * 2.1) < 0.5 ? 0.7 : -0.7), fl = len * 0.4, f = [];
      for (let k = 0; k < 3; k++) { const d = (k / 2) * fl, px = p0[0] + d * Math.cos(ya), pz = p0[2] + d * Math.sin(ya); f.push([px, Hr(px, pz) + r0 * 0.5 + 0.002, pz]); }
      woodGeos.push(tubeGeo(f, r0 * 0.7, r0 * 0.35, 4, col));
    }
  }
  for (let b = 0; b < 5; b++) {   // a bunch of ash keys: a stalk with 8 winged seeds fanned from its end
    let x = 0, z = 0, c = 0; do { const p = sample(1, 300 + b * 11 + c * 3, () => 1)[0] || [0.4, 0.3]; x = p[0]; z = p[1]; c++; } while (!keepOff(x, z) && c < 20);
    const yaw = hh(b * 4.3 + seed + 2) * TAU, cy = Math.cos(yaw), sy = Math.sin(yaw), y0 = Hr(x, z) + 0.008, sl = 0.09;
    const ex = x + sl * cy, ez = z + sl * sy; woodGeos.push(tubeGeo([[x, y0, z], [(x + ex) / 2, y0 + 0.004, (z + ez) / 2], [ex, y0 + 0.002, ez]], 0.0025, 0.002, 4, "#6b4a2b"));
    for (let k = 0; k < 8; k++) {
      const a = yaw + (k / 7 - 0.5) * 1.5 + 0.1 * (hh(b * 8 + k) - 0.5), len = 0.03 + 0.006 * hh(b * 9 + k), pts = [[ex, y0 + 0.002, ez], [ex + 0.5 * len * Math.cos(a), y0 + 0.006, ez + 0.5 * len * Math.sin(a)], [ex + len * Math.cos(a), y0 + 0.003, ez + len * Math.sin(a)]];
      const g = tubeGeo(pts, 0.0034, 0.0012, 4, k % 3 === 2 ? PAL.seedS : PAL.seed); g.scale(1, 0.45, 1); woodGeos.push(g);   // a flat wing with a swelling at the seed end
    }
  }
  const wg = mergeGeometries(woodGeos, false); if (wg) { const wm = new THREE.Mesh(wg, noLine(stdMat({ vertexColors: true, roughness: 0.9 }))); wm.castShadow = false; wm.receiveShadow = false; wm.userData.solid = false; wood.add(wm); }
  // dust puffs
  const puffs = []; for (let j = 0; j < 6; j++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT(), color: "#d9b877", transparent: true, depthWrite: false, opacity: 0.4, fog: false, toneMapped: false })); sp.material.userData.noOutline = true; steamy(sp, 5); sp.scale.setScalar(0); root.add(sp);
    puffs.push({ sp, a: (j / 6) * TAU + 0.5, d0: 0.015 * j, r: 0.2 + 0.14 * hh(j * 2.3 + seed), dx: 0.25 + 0.2 * hh(j * 4.1) });
  }
  // ---- placing
  const cur = new V3(), nn_ = new V3();
  const place = (e, b, c) => {
    const h = Hb(e.x, e.z, b, c);
    let vis = 1; if ((e.kind === "top" || e.kind === "mid") && b > 0 && e.r < R0 * 0.95) vis = 1 - sm((b - 0.004) / 0.03);
    if (vis <= 0.001) { set.hide(e.i); return; }
    nrm(e.x, e.z, b, c, nn_);
    set.set(e.i, e.x, h + e.yo, e.z, qOnSurface(nn_, e.yaw, e.tx, e.tz), e.s * vis);
  };
  const placeBurst = (e, b) => {
    if (b <= e.tl) { set.hide(e.i); return; }
    const u = clamp((b - e.tl) / (e.bl - e.tl)), y0 = Hr(at[0], at[1]) - 0.1;
    const up = u < 0.28 ? Math.sin((Math.PI / 2) * (u / 0.28)) : 0.5 * (1 + Math.cos((Math.PI * (u - 0.28)) / 0.72));
    const hz = 1 - Math.pow(1 - u, 1.6), ez = 1 - Math.pow(1 - u, 2.2);
    const x = lerp(e.lx, e.ex, hz) + 0.07 * Math.sin(TAU * 1.3 * u + e.yaw) * (1 - u), z = lerp(e.lz, e.ez, hz) + 0.07 * Math.cos(TAU * 1.1 * u + e.yaw) * (1 - u);
    const y = lerp(y0, e.ey, ez) + e.up * up;
    const q = qOnSurface(e.nrm, e.yaw, 0.1, 0.05), tum = (1 - u) ** 1.5 * e.turns * TAU;
    q.premultiply(_Q2.setFromAxisAngle(e.tax, tum));
    set.set(e.i, x, y, z, q, e.s * sm((b - e.tl) / 0.02));
  };
  let lastB = -1, curC = null;
  const frame = (b) => {
    const c = b > 0 ? cs(b) : null; curC = c;
    updateBody(b);
    for (const e of rec) { if (e.kind === "burst") placeBurst(e, b); else if (e.kind !== "fly") place(e, b, c); }
  };
  return {
    grip: 0,
    apply(ps, t = 0) {
      const b = clamp(ps.burst ?? 0), rus = clamp(ps.rustle ?? 0.3, 0, 3);
      if (b !== lastB) { frame(b); lastB = b; }
      const c = curC, a = clamp(rus / 0.3, 0, 3);
      // rustle: 30 top leaves lift and slide
      for (const q of RUS) {
        const e = rec[q.i], p = Math.pow(Math.max(0, Math.sin(TAU * (t / q.per + q.ph))), 3) * a * (rus > 0 ? 1 : 0), h = Hb(e.x, e.z, b, c);
        nrm(e.x, e.z, b, c, nn_);
        const qq = qOnSurface(nn_, e.yaw, e.tx, e.tz); qq.premultiply(_Q2.setFromAxisAngle(new V3(0, 0, 1), -0.45 * p));
        set.set(e.i, e.x + 0.05 * p, h + e.yo + 0.03 * p, e.z, qq, e.s);
      }
      // 4 a second fly off downwind (up to 16 slots, 2 s a flight)
      const nAct = Math.min(NF, Math.round(8 * rus / 0.3));
      for (let f = 0; f < NF; f++) {
        const rank = (f * 7) % NF, off = (f / NF) * 2, cyc = Math.floor((t + off) / 2), u = (t + off) / 2 - cyc, i = oF + f;
        if (rank >= nAct) { set.hide(i); continue; }
        const h1 = (n) => hh(f * 13.7 + cyc * 7.3 + n * 3.1 + seed), sx = -0.9 + 2.0 * h1(1), sz = -0.8 + 1.8 * h1(2), hs = Hb(sx, sz, b, c);
        const x = sx + 2.6 * Math.pow(u, 1.1), y = hs + 0.01 + 0.4 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 0.2 * u, z = sz + 0.4 * Math.sin(TAU * 0.6 * u + h1(3) * TAU);
        const q = qYXZ(0.5 * Math.sin(TAU * 1.5 * u + h1(4)), h1(5) * TAU + 6 * u, 0.5 * Math.sin(TAU * 1.1 * u + h1(6)), new THREE.Quaternion());
        set.set(i, x, y, z, q, 1.1 * sm(u / 0.08) * (1 - sm((u - 0.78) / 0.22)));
      }
      set.flush();
      // dust
      for (const p of puffs) {
        const u = clamp((b - 0.02 - p.d0) / 0.58), grow = 0.15 + 0.42 * Math.sqrt(u), s = b <= 0 || u <= 0 ? 0 : grow * sm(u * 12) * (1 - sm((u - 0.55) / 0.45));
        p.sp.position.set(at[0] + p.r * Math.cos(p.a) + p.dx * u, Hr(at[0], at[1]) + 0.05 + 0.5 * u, at[1] + p.r * Math.sin(p.a)); p.sp.scale.setScalar(s);
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// norserope: hemp, 3 strands, built from a centre line
// ---------------------------------------------------------------------------------------------------------------------------------------
const RDS = 0.0045, ROPE_R = 0.011, PITCH = 0.036;
function resample(pts, ds) {
  const out = [pts[0].clone()]; let need = ds;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], seg = a.distanceTo(b); let pos = 0;
    if (seg < 1e-9) continue;
    while (seg - pos >= need - 1e-12) { pos += need; out.push(a.clone().lerp(b, pos / seg)); need = ds; }
    need -= seg - pos;
  }
  const last = pts[pts.length - 1]; if (out[out.length - 1].distanceTo(last) > ds * 0.35) out.push(last.clone());
  return out;
}
// 3 helical strands of tube radius 0.0052 about the centre line: the lay (PITCH 0.036) makes a visible strand mark every 0.012; a darker band there
function ropeGeo(P, dir = 1) {
  const n = P.length, T = [], Nn = [], Bn = [], pos = [], col = [], idx = [], rs = 0.0052, rho = ROPE_R - rs, SEG = 5;
  for (let i = 0; i < n; i++) T.push(P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  let N0 = Math.abs(T[0].y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0); N0 = N0.sub(T[0].clone().multiplyScalar(N0.dot(T[0]))).normalize();
  for (let i = 0; i < n; i++) { N0 = N0.sub(T[i].clone().multiplyScalar(N0.dot(T[i]))).normalize(); Nn.push(N0.clone()); Bn.push(new V3().crossVectors(T[i], N0).normalize()); }
  const bH = lin(PAL.hemp), sH = lin(PAL.hempS);
  for (let k = 0; k < 3; k++) {
    const tone = 1 + (k - 1) * 0.04, v0 = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const s = i * RDS, th = dir * TAU * (s / PITCH) + (k * TAU) / 3, band = (s / 0.012) % 1 < 0.26;
      const cx = Math.cos(th), cy = Math.sin(th);
      for (let a = 0; a < SEG; a++) {
        const ang = (a / SEG) * TAU, ox = Math.cos(ang), oy = Math.sin(ang), out = ox * cx + oy * cy;
        const d = Nn[i].clone().multiplyScalar(rho * cx + rs * ox).add(Bn[i].clone().multiplyScalar(rho * cy + rs * oy));
        pos.push(P[i].x + d.x, P[i].y + d.y, P[i].z + d.z);
        const m = 0.4 + 0.6 * (0.5 + 0.5 * out), bandK = band ? 0.72 : 1;
        for (let c = 0; c < 3; c++) col.push((sH[c] + (bH[c] - sH[c]) * m) * bandK * tone);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let a = 0; a < SEG; a++) { const q = v0 + i * SEG + a, r = v0 + i * SEG + ((a + 1) % SEG), s2 = q + SEG, t2 = r + SEG; idx.push(q, r, s2, r, t2, s2); }
    for (const [i, flip] of [[0, true], [n - 1, false]]) { const c = pos.length / 3; pos.push(P[i].x + rho * (Nn[i].x * Math.cos(dir * TAU * (i * RDS / PITCH) + k * TAU / 3) + Bn[i].x * Math.sin(dir * TAU * (i * RDS / PITCH) + k * TAU / 3)), P[i].y + rho * (Nn[i].y * Math.cos(dir * TAU * (i * RDS / PITCH) + k * TAU / 3) + Bn[i].y * Math.sin(dir * TAU * (i * RDS / PITCH) + k * TAU / 3)), P[i].z + rho * (Nn[i].z * Math.cos(dir * TAU * (i * RDS / PITCH) + k * TAU / 3) + Bn[i].z * Math.sin(dir * TAU * (i * RDS / PITCH) + k * TAU / 3))); col.push(bH[0] * 0.9, bH[1] * 0.9, bH[2] * 0.9); for (let a = 0; a < SEG; a++) { const q = v0 + i * SEG + a, r = v0 + i * SEG + ((a + 1) % SEG); if (flip) idx.push(c, r, q); else idx.push(c, q, r); } }
  }
  return geoOf(pos, col, idx);
}
// 7 frayed fibres at a cut end (point p, direction d pointing out of the rope): thin curled tubes 0.015-0.035 long
function fibreGeo(p, d, salt) {
  const geos = [], e1 = Math.abs(d.y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0).cross(d).normalize(), e2 = new V3().crossVectors(d, e1).normalize();
  for (let f = 0; f < 7; f++) {
    const a = hh(f * 3.7 + salt) * TAU, r0 = 0.0075 * Math.sqrt(hh(f * 5.1 + salt + 1)), sp = (0.15 + 0.5 * hh(f * 2.3 + salt + 2)), len = 0.015 + 0.02 * hh(f * 7.9 + salt + 3);
    const ra = hh(f * 4.1 + salt + 4) * TAU, cu = (hh(f * 6.1 + salt + 5) - 0.5) * 0.012;
    const o = e1.clone().multiplyScalar(Math.cos(a) * r0).add(e2.clone().multiplyScalar(Math.sin(a) * r0)), s0 = p.clone().add(o);
    const dd = d.clone().add(e1.clone().multiplyScalar(Math.cos(ra) * sp)).add(e2.clone().multiplyScalar(Math.sin(ra) * sp)).normalize();
    const p1 = s0.clone().add(dd.clone().multiplyScalar(len * 0.5)).add(e1.clone().multiplyScalar(cu)), p2 = s0.clone().add(dd.clone().multiplyScalar(len)).add(e2.clone().multiplyScalar(cu * 1.6)).add(new V3(0, -0.004 * (f % 2), 0));
    geos.push(tubeGeo([s0.toArray(), p1.toArray(), p2.toArray()], 0.0012, 0.0006, 3, f % 2 ? PAL.hempL : PAL.hemp));
  }
  return mergeGeometries(geos, false);
}
// the open trefoil (an overhand knot): t from pi, so the rope runs in and out along +X at the knot's outer point; (X, Y+3, Z) in units of the scale
const trefoil = (tau) => { const t = Math.PI + tau; return [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t) + 3, -Math.sin(3 * t)]; };

function norserope(P) {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root);
  const E = new V3(...(S.end ?? [0, 1.585, 0])), ra = S.ankle ?? 0.034, bR = S.branchR ?? 0.275, cy = S.branchY ?? 2.36, seed = (S.seed ?? 0) * 7.3, slipAt = S.slipAt ?? 28.5;
  const A = new V3(...(S.axis ?? [1, 0, 0])).normalize(), Uv = new V3(0, 1, 0).sub(A.clone().multiplyScalar(A.y)).normalize(), Sv = new V3().crossVectors(A, Uv).normalize();
  const C = new V3(0, cy, 0), Rw = bR + 0.0105, XS = -0.028, PIT = 0.0225, rb = 0.03;
  const B0 = C.clone().add(A.clone().multiplyScalar(XS)).sub(Uv.clone().multiplyScalar(Rw));   // the hang point: the rope leaves the underside here
  const ropeMat = stdMat({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); ropeMat.userData.lineK = 0.55;
  const mkMesh = (geo, parent) => { const m = new THREE.Mesh(geo, ropeMat); m.castShadow = true; m.receiveShadow = true; m.userData.solid = false; parent.add(m); return m; };
  // ---- the bench bar
  if (S.bar) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(bR, bR, 3.6, 28), stdMat({ color: PAL.bark, roughness: 0.95 })); bar.quaternion.setFromUnitVectors(_UP, A); bar.position.copy(C); bar.userData.solid = false; root.add(bar); }
  // ---- the wrap: 3 turns side by side (sweep 0..900 deg from the underside, over the front, over the top three times), the hitch, the tail
  const wrapPt = (sw) => { const phi = Math.PI - sw * DEG, xa = XS + PIT * (sw / 360); return C.clone().add(A.clone().multiplyScalar(xa)).add(Uv.clone().multiplyScalar(Rw * Math.cos(phi))).add(Sv.clone().multiplyScalar(Rw * Math.sin(phi))); };
  const stat = []; const dsw = (RDS / Rw) / DEG * 0.5;
  for (let sw = 0; sw < 900; sw += dsw) stat.push(wrapPt(sw));
  { // the hitch: an overhand knot lying on top over the 3 bands, its far end toward -A
    const P0 = wrapPt(900), Tt = Sv.clone().negate(), s0 = 0.012, n = 150;
    for (let k = 0; k < n; k++) { const tau = (k / n) * TAU, [X, Y, Z] = trefoil(tau); stat.push(P0.clone().add(Tt.clone().multiplyScalar(X * s0)).sub(A.clone().multiplyScalar(Y * s0)).add(Uv.clone().multiplyScalar(0.0125 * Math.pow(Math.sin(tau / 2), 2) + Z * 0.0115))); }
    for (let sw = 900; sw <= 936; sw += dsw) stat.push(wrapPt(sw));
  }
  const statP = resample(stat, RDS), staticGeo = ropeGeo(statP, 1);
  const tEnd = statP[statP.length - 1].clone().sub(statP[statP.length - 4]).normalize();
  const fibTop = fibreGeo(statP[statP.length - 1], tEnd, seed + 3);
  mkMesh(mergeGeometries([staticGeo, fibTop], false), root);
  // ---- the lower rope, rebuilt when slip or twist change (pivot B0; local coordinates)
  const low = new THREE.Group(); low.position.copy(B0); root.add(low);
  let lowMesh = null, lowKey = "";
  const buildLow = (cr, rel, tw) => {
    const pts = [];
    // the bend off the underside: a quarter circle r 0.03 from the bundle's bottom down behind it, then the standing part, 3 s-bends past the shoe
    for (let k = 0; k <= 24; k++) { const th = (Math.PI / 2) * (1 - k / 24); pts.push(B0.clone().add(Uv.clone().multiplyScalar(-rb + rb * Math.sin(th))).add(Sv.clone().multiplyScalar(-rb * Math.cos(th)))); }
    const K0 = pts[pts.length - 1].clone();
    const rl0 = ra + 0.0112, rlc = lerp(rl0 + 0.015 * cr, rl0, rel), pp = PIT + 0.004 * cr * (1 - rel), s1 = 0.010 * (1 + 0.3 * cr * (1 - rel));
    const Lc = (phi, rr = rlc) => new V3(E.x + rr * Math.sin(phi), E.y + 0.012 - pp * (phi / TAU), E.z - rr * Math.cos(phi));
    const Ls = Lc(0), P3 = new V3(E.x - 0.03, E.y + 0.095, E.z - 0.068), P4 = new V3(E.x - 0.028, E.y + 0.055, E.z - rlc - 0.016), P5 = new V3(E.x - 0.016, E.y + 0.022, E.z - rlc - 0.004);
    const P1 = K0.clone().lerp(P3, 0.3).add(new V3(0, 0, -0.012)), P2 = K0.clone().lerp(P3, 0.65).add(new V3(0, 0, -0.01));
    const cr3 = new THREE.CatmullRomCurve3([K0.clone().add(new V3(0, 0.02, 0)), K0, P1, P2, P3, P4, P5, Ls, Ls.clone().add(new V3(0.02, -0.002, 0))], false, "centripetal");
    const sp = cr3.getSpacedPoints(Math.ceil(cr3.getLength() / RDS * 1.4)); const iK = sp.findIndex((q) => q.distanceTo(K0) < 0.002), iL = sp.reduce((bi, q, i) => (q.distanceTo(Ls) < sp[bi].distanceTo(Ls) ? i : bi), 0);
    for (let i = Math.max(1, iK + 1); i <= iL; i++) pts.push(sp[i]);
    // the coil (2 turns), the knot at 540 degrees (the front), the tail 0.07
    const phik = Math.PI + 0.25 * cr * (1 - rel), dphi = RDS / rlc * 0.5, coil = [];
    for (let ph = dphi; ph < phik; ph += dphi) coil.push(Lc(ph));
    const nk = 150, base = Lc(phik);
    for (let k = 0; k < nk; k++) { const tau = (k / nk) * TAU, [X, Y, Z] = trefoil(tau), ang = phik + (X * s1) / rlc, rr = rlc + 0.0125 * Math.pow(Math.sin(tau / 2), 2) + Z * 0.0115; coil.push(new V3(E.x + rr * Math.sin(ang), base.y - Y * s1 * 0.85, E.z - rr * Math.cos(ang))); }
    for (let ph = phik + dphi; ph <= 2 * TAU; ph += dphi) coil.push(Lc(ph));
    const PT = Lc(2 * TAU), Tt = new V3(1, -0.01, 0.02).normalize();
    for (let k = 1; k <= 12; k++) { const u = k / 12; coil.push(PT.clone().add(Tt.clone().multiplyScalar(0.07 * u)).add(new V3(0, -0.012 * u * u, 0.006 * u))); }
    // let go: the whole coil turns about Ls (about x) by up to 90 degrees so the ring hangs empty in the vertical plane
    const al = (Math.PI / 2) * sm(rel), ca = Math.cos(al), sa = Math.sin(al);
    for (const q of coil) { const dy = q.y - Ls.y, dz = q.z - Ls.z; q.y = Ls.y + dy * ca - dz * sa; q.z = Ls.z + dy * sa + dz * ca; pts.push(q); }
    // twist: the part below the bend turns about the vertical through the ankle (Chip's 20 degrees)
    const twr = tw * 20 * DEG, yTop = K0.y;
    if (Math.abs(twr) > 1e-6) for (const q of pts) { const w = sm((yTop - q.y) / 0.2), a = twr * w, dx = q.x - E.x, dz = q.z - E.z; q.x = E.x + dx * Math.cos(a) + dz * Math.sin(a); q.z = E.z - dx * Math.sin(a) + dz * Math.cos(a); }
    for (const q of pts) q.sub(B0);
    const R = resample(pts, RDS), n = R.length, tEnd2 = R[n - 1].clone().sub(R[n - 4]).normalize();
    const g = mergeGeometries([ropeGeo(R, -1), fibreGeo(R[n - 1], tEnd2, seed + 9)], false);
    return g;
  };
  const setLow = (cr, rel, tw) => {
    const key = `${Math.round(cr * 200)}|${Math.round(rel * 200)}|${Math.round(tw * 400)}`; if (key === lowKey) return; lowKey = key;
    const g = buildLow(cr, rel, tw); if (lowMesh) { lowMesh.geometry.dispose(); lowMesh.geometry = g; } else lowMesh = mkMesh(g, low);
  };
  setLow(0, 0, 0);
  return {
    grip: 0,
    apply(ps, t = 0) {
      const slip = clamp(ps.slip ?? 0), cr = clamp(slip / 0.5), rel = clamp((slip - 0.5) / 0.5), tw = clamp(ps.twist ?? 0, -1, 1);
      setLow(cr, rel, tw);
      const tt = t - slipAt, after = slip >= 0.999 && tt > 0 ? 12 * DEG * Math.exp(-2.2 * tt) * Math.cos(TAU * 0.9 * tt) : 0;
      low.rotation.z = -(clamp(ps.swing ?? 0, -1, 1) * 15 * DEG + after);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// norsestaves: nine rune staves
// ---------------------------------------------------------------------------------------------------------------------------------------
const MARKS = {   // the RUNE MARKS of DESIGN.md (cell 1 wide x 2 high), as strokes [x1, y1, x2, y2]: the nine the staves carry
  M1: [[0, 0, 0, 2], [0, 1.0, 0.6, 1.6], [0, 1.45, 0.5, 1.95]],
  M2: [[0, 0, 0, 2], [0, 2, 0.7, 1.3], [0.7, 1.3, 0.7, 0]],
  M3: [[0, 0, 0, 2], [0, 1.5, 0.5, 1.0], [0.5, 1.0, 0, 0.5]],
  M4: [[0, 0, 0, 2], [0, 2, 0.6, 1.45], [0, 1.4, 0.6, 0.85]],
  M5: [[0.6, 1.6, 0, 1.0], [0, 1.0, 0.6, 0.4]],
  M6: [[0, 0.3, 0.8, 1.7], [0, 1.7, 0.8, 0.3]],
  M8: [[0, 0, 0, 2], [0, 2, 0.6, 1.4]],
  M9: [[0, 0.4, 0, 1.6], [0.8, 0.4, 0.8, 1.6], [0, 1.6, 0.8, 0.4], [0, 0.4, 0.8, 1.6]],
  M10: [[0.4, 0, 0.4, 2], [0.4, 1.4, 0.1, 1.0], [0.1, 1.0, 0.4, 0.6], [0.4, 0.6, 0.7, 1.0], [0.7, 1.0, 0.4, 1.4]],
};
const STAVE_ORDER = ["M4", "M1", "M2", "M3", "M5", "M6", "M8", "M10", "M9"];
const STAVE_L = 0.46, STAVE_T = 0.012, STAVE_BARK = 0.006;
// the face texture: ash grain, the warm wood round the cut, the cut (dark) with its glowing fill; the emissive map and the halo card come from the same strokes
function staveTextures(mk, faceW, idx, seed) {
  const strokes = MARKS[mk], pxm = 1024 / STAVE_L, W = Math.round(faceW * pxm), H = 1024;
  let bw = 0, bh = 0, bx0 = 9, by0 = 9; for (const [a, b, c, d] of strokes) { bx0 = Math.min(bx0, a, c); bw = Math.max(bw, a, c); by0 = Math.min(by0, b, d); bh = Math.max(bh, b, d); }
  const wU = bw - bx0, sc = Math.min(1, (faceW - 0.008) / (wU * 0.1 + 0.012)), unit = 0.1 * sc, cw = 0.012 * sc;   // unit: metres per cell unit
  const cxU = (bx0 + bw) / 2, cyU = (by0 + bh) / 2;
  const P = (x, y) => [W / 2 + (x - cxU) * unit * pxm, H * 0.5 - (y - cyU) * unit * pxm];
  const strokeAll = (g, width, color) => { g.lineWidth = width; g.strokeStyle = color; g.lineCap = "butt"; for (const [a, b, c, d] of strokes) { const p = P(a, b), q = P(c, d); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); } };
  const face = canvasTex(W, H, (g) => {
    g.fillStyle = PAL.ash; g.fillRect(0, 0, W, H);
    const lg = g.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, "rgba(255,230,170,0.22)"); lg.addColorStop(0.5, "rgba(255,230,170,0)"); lg.addColorStop(1, "rgba(120,80,40,0.2)"); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 52; i++) {   // grain: long streaks along the stave, slightly wandering
      const x0 = hh(i * 3.1 + idx * 17 + seed) * W, w = 0.6 + 2.4 * hh(i * 5.3 + idx), a = 0.06 + 0.2 * hh(i * 7.7 + idx + 1), ph = hh(i * 2.9 + idx) * 6;
      g.strokeStyle = `rgba(143,111,66,${a})`; g.lineWidth = w; g.beginPath(); for (let y = 0; y <= H; y += 32) { const x = x0 + 3 * Math.sin(y * 0.011 + ph); if (y === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
    }
    const kx = hh(idx * 9.1 + seed) * W * 0.7 + W * 0.15, ky = H * (0.12 + 0.76 * (hh(idx * 4.3) < 0.5 ? hh(idx * 5.7) * 0.25 : 0.75 + hh(idx * 5.7) * 0.2));
    g.fillStyle = "rgba(110,76,40,0.5)"; g.beginPath(); g.ellipse(kx, ky, 6, 11, 0, 0, TAU); g.fill();   // a knot
    const wr = 0.075 * pxm, wg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, wr); wg.addColorStop(0, "rgba(240,176,80,0.55)"); wg.addColorStop(1, "rgba(240,176,80,0)"); g.fillStyle = wg; g.fillRect(0, 0, W, H);
    strokeAll(g, cw * pxm, PAL.cut); strokeAll(g, cw * pxm * 0.58, PAL.glow);
  }, 8);
  const emis = canvasTex(W, H, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    const wr = 0.06 * pxm, wg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, wr + bh * unit * pxm * 0.5); wg.addColorStop(0, "rgba(242,207,106,0.30)"); wg.addColorStop(1, "rgba(242,207,106,0)"); g.fillStyle = wg; g.fillRect(0, 0, W, H);
    g.shadowColor = PAL.rune; g.shadowBlur = 10; strokeAll(g, cw * pxm * 0.58, PAL.glow); g.shadowBlur = 0; strokeAll(g, cw * pxm * 0.58, PAL.glow);
  }, 4);
  // the halo card: 0.06 of glow round the strokes, additive at 0.5 (a 0.2 x 0.34 card, 600 px a metre)
  const CW = 0.2, CH = 0.2 + 0.0, cpx = 600, hc = Math.round(CW * cpx), hh_ = Math.round((bh - by0) * unit * 1 * cpx + 0.2 * cpx), ch = Math.max(hh_, 64);
  const halo = canvasTex(hc, ch, (g) => {
    g.globalCompositeOperation = "lighter"; g.shadowColor = PAL.rune; g.shadowBlur = 0.06 * cpx; g.lineCap = "butt"; g.strokeStyle = PAL.rune; g.lineWidth = cw * cpx;
    for (const [a, b, c, d] of strokes) { const p = [hc / 2 + (a - cxU) * unit * cpx, ch / 2 - (b - cyU) * unit * cpx], q = [hc / 2 + (c - cxU) * unit * cpx, ch / 2 - (d - cyU) * unit * cpx]; for (let r = 0; r < 2; r++) { g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); } }
  }, 2);
  return { face, emis, halo, cardH: ch / cpx, cardW: CW, markH: (bh - by0) * unit };
}
let GRAIN = null;
const grainTex = () => GRAIN ||= canvasTex(96, 512, (g, w, h) => {
  g.fillStyle = cmix(PAL.ash, PAL.ashS, 0.18); g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const x0 = hh(i * 3.7 + 5) * w; g.strokeStyle = `rgba(110,80,44,${0.06 + 0.16 * hh(i * 2.1)})`; g.lineWidth = 0.6 + 2 * hh(i * 5.9); g.beginPath(); for (let y = 0; y <= h; y += 32) { const x = x0 + 2 * Math.sin(y * 0.02 + i); if (y === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
}, 4);

function staveBody(Wd) {   // the split slip: a prism, ends cut slanting, bark on the +x edge; vertex-coloured; flat-shaded
  const hw = Wd / 2, z = STAVE_T / 2, bk = STAVE_BARK;
  const ring = [[-hw, z], [hw - bk, z], [hw - 0.0015, z * 0.7], [hw + 0.001, 0], [hw - 0.0015, -z * 0.7], [hw - bk, -z], [-hw, -z]];
  const yb = (x) => -STAVE_L / 2 + 0.03 * (1 - (x + hw) / Wd), yt = (x) => STAVE_L / 2 - 0.03 * ((x + hw) / Wd);
  const pos = [], col = [];
  const tri = (a, b, c, k) => { pos.push(...a, ...b, ...c); const cc = lin(k); for (let i = 0; i < 3; i++) col.push(...cc); };
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length], isBark = i >= 1 && i <= 4, k = i === 6 ? PAL.ashS : isBark ? (i === 2 || i === 3 ? PAL.barkR : PAL.bark) : i === 0 ? PAL.ash : PAL.ashS;
    const a = [x0, yb(x0), z0], b = [x1, yb(x1), z1], c = [x1, yt(x1), z1], d = [x0, yt(x0), z0];
    tri(a, b, c, k); tri(a, c, d, k);
  }
  for (const [yf, kc] of [[yb, PAL.ashL], [yt, PAL.ashL]]) for (let i = 1; i < ring.length - 1; i++) { const p0 = ring[0], p1 = ring[i], p2 = ring[i + 1]; tri([p0[0], yf(p0[0]), p0[1]], [p1[0], yf(p1[0]), p1[1]], [p2[0], yf(p2[0]), p2[1]], cmix(kc, PAL.ashS, 0.15 * (i % 2))); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  return { geo: g, yb, yt, hw, xl: -hw, xr: hw - bk };
}
function facePlane(B, dz, flip) {   // the front (or back) face as one quad with UV (u across, v along)
  const { yb, yt, xl, xr } = B, q = [[xl, yb(xl)], [xr, yb(xr)], [xr, yt(xr)], [xl, yt(xl)]];
  const pos = [], uv = [];
  for (const [x, y] of q) { pos.push(flip ? -x + (xl + xr) : x, y, dz); uv.push((x - xl) / (xr - xl), (y + STAVE_L / 2) / STAVE_L); }
  return geoOf(pos, null, flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3], uv);
}

function norsestaves(P) {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root);
  const span = S.span ?? 9, Wd = S.width ?? 0.07, plate = !!S.plate, seed = (S.seed ?? 0) * 5.3, N = 9, DLT = (0.25 * 0.35) / span;
  const XS = [0.55, -0.45, 0.2, -0.75, 0.75, -0.15, 0.4, -0.6, 0.0], ZS = [0.6, 1.5, 0.9, 1.9, 1.1, 2.2, 1.4, 1.75, 2.5];
  const B = staveBody(Wd), faceW = B.xr - B.xl;
  const bodyM = stdMat({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }); bodyM.userData.lineK = 0.6;
  const backM = stdMat({ map: grainTex(), roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); backM.userData.noOutline = true;
  const geoF = facePlane(B, STAVE_T / 2 + 0.0002, false), geoB = facePlane(B, -STAVE_T / 2 - 0.0002, true);
  const G = [];
  for (let j = 0; j < N; j++) {
    const g = new THREE.Group(), tx = staveTextures(STAVE_ORDER[j], faceW, j, seed); root.add(g);
    const body = new THREE.Mesh(B.geo, bodyM); body.castShadow = false; body.receiveShadow = false; body.userData.solid = false; g.add(body);
    const fm = stdMat({ map: tx.face, emissiveMap: tx.emis, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 1.0, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); fm.userData.noOutline = true;
    const face = new THREE.Mesh(geoF, fm); face.userData.solid = false; g.add(face);
    const back = new THREE.Mesh(geoB, backM); back.userData.solid = false; g.add(back);
    const hm = glowMat({ map: tx.halo, opacity: 0.5, blending: THREE.AdditiveBlending, color: "#ffffff" });
    const hF = steamy(new THREE.Mesh(new THREE.PlaneGeometry(tx.cardW, tx.cardH), hm), 4); hF.position.set((B.xl + B.xr) / 2, 0, STAVE_T / 2 + 0.002); g.add(hF);
    const hB = steamy(new THREE.Mesh(new THREE.PlaneGeometry(tx.cardW, tx.cardH), glowMat({ map: tx.halo, opacity: 0.3, blending: THREE.AdditiveBlending, color: "#ffffff" })), 4); hB.position.set((B.xl + B.xr) / 2, 0, -STAVE_T / 2 - 0.002); hB.rotation.y = Math.PI; g.add(hB);
    G.push({ g, ph: hh(j * 3.9 + seed + 1) * TAU, ph2: hh(j * 5.3 + seed + 2) * TAU, tilt: (hh(j * 7.1 + seed) - 0.5) * 0.25 });
  }
  // 6 gold motes trailing each, round (never stars)
  const moteM = noLine(new THREE.MeshBasicMaterial({ color: PAL_GOLD(), toneMapped: false, fog: false }));
  const motes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), moteM, N * 6); motes.frustumCulled = false; motes.castShadow = false; motes.userData.solid = false; motes.userData.steam = true; root.add(motes);
  // flares on the carved marks of the trunk
  const flares = (S.flares || []).map((f) => { const m = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat({ map: SOFT(), color: PAL.rune, opacity: 0.9, blending: THREE.AdditiveBlending })), 4); m.position.set(f[0], f[1], f[2] + 0.02); m.scale.setScalar(0); root.add(m); return { m, y: f[1] }; });
  const sway = (j, t) => 0.1 * Math.sin(TAU * 0.37 * t + G[j].ph2);
  return {
    grip: 0,
    apply(ps, t = 0) {
      const fall = clamp(ps.fall ?? 0), ys = [];
      for (let j = 0; j < N; j++) {
        const o = G[j], f = fall * (1 + 8 * DLT) - j * DLT, y = plate ? 0 : span * (0.5 - f);
        ys.push(y); o.g.visible = plate || Math.abs(y) < span / 2 + 1.2;
        if (plate) { o.g.position.set(-1.2 + 0.3 * j, 0, 0.5); o.g.rotation.set(0, 0, 0); continue; }
        o.g.position.set(XS[j] + sway(j, t), y, ZS[j]);
        o.g.rotation.set(0.12 * Math.sin(TAU * 0.2 * t + o.ph), TAU * 0.25 * t + o.ph, o.tilt + 0.06 * Math.sin(TAU * 0.31 * t + o.ph2));
      }
      const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), p = new V3(), sc = new V3();
      for (let j = 0; j < N; j++) for (let m = 1; m <= 6; m++) {
        const i = j * 6 + m - 1, tau = 0.12 * m, r = plate || !G[j].g.visible ? 0 : 0.013 * Math.pow(1 - m / 7, 1.1);
        p.set(XS[j] + sway(j, t - tau) + 0.012 * Math.sin(m * 2.1 + j), ys[j] + 0.1 + 0.075 * m, ZS[j] + 0.012 * Math.cos(m * 1.7 + j)); sc.setScalar(r);
        m4.compose(p, q0, sc); motes.setMatrixAt(i, m4);
      }
      motes.instanceMatrix.needsUpdate = true;
      for (const f of flares) { let s = 0; for (let j = 0; j < N; j++) s = Math.max(s, Math.exp(-(((ys[j] - f.y) / 0.35) ** 2))); f.m.scale.setScalar(plate || s < 0.03 ? 0 : 0.15 + 0.65 * s); }
    },
  };
}
function PAL_GOLD() { return "#f0d68a"; }

export const NORSE_WIND_KINDS = { norseleaves, norsepile, norserope, norsestaves };
export const NORSE_WIND_GRIPS = {};
export const NORSE_WIND_STATE = { norseleaves: { gust: 0 }, norsepile: { burst: 0, rustle: 0.3 }, norserope: { swing: 0, twist: 0, slip: 0 }, norsestaves: { fall: 0 } };
