import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";

// You wake up mid EP03 "mid zombie apocalypse" (12 Nov 2026), task T3: the smoke-room waiting room (panel 14, the teaser).
// World metres, x right, y up, z toward the camera; `rot` degrees about y (rot 0 faces +z). Hand-drawn look: every mark is painted
// once on a canvas from an index and `spec.seed` (nothing tiled), ink lines on hard edges (the engine's outline), nothing random,
// everything a pure function of the spec, the state and the clip time t. NO blood.
//
// ===== zwait  ONE prop holding the whole place: a 1968 experiment room with an observation booth behind the back wall.
//   ORIGIN: the middle of the floor, y 0 = the floor top. Room x -1.8..+1.8, z -2.2..+2.2, 2.6 high. The viewer sits at the +z
//     end and faces the back wall (z -2.2). Walls, ceiling and floor draw only their INNER faces (a camera may stand outside);
//     all five are one-sided painted canvases, the front wall (z +2.2) too. Stand it 300 m or more from zstreet and the other
//     looks (e.g. x 400): the sky is the set's plain grey and the room is closed, so nothing of it shows outside.
//   spec  seed 1 (every painted mark, the sitters' writing phases)
//   state smoke 0..1 (0)  the smoke from the vent V. 0 a clean vent. 0.10 a first puff 0.3 m out of the slats (five lobes). From
//                         0.10 the plume (14 lobes, 0.18 -> 0.5 m) pushes 0.3 m into the room and rolls up the wall, 0.5 m wide at
//                         the vent, 0.9 m at the ceiling. A ceiling layer (60 lobes of 0.5-0.9 m on a hashed lattice, 7 round lobes
//                         at 0.6 opacity on its leading edge) spreads over the ceiling: its front is R = 0.4 + 4.6 * smoke^0.8 m
//                         from the vent, its thickness 0.12 + 0.33 * smoke (underside y 2.15 at 1, a bulge down to y 2.0 within
//                         0.5 m of the vent). A lobe grows 0 -> 1 over 0.25 of the state once the front passes it (lobes the front
//                         reaches after 0.75 still finish at 1). Cel smoke: 3 flat tones lit #fbfbf8 / body #e3e6e6 / underside
//                         #bcc4c9, hard scalloped edges with a thin ink rim, opacity 0.96. On t each lobe turns 15-35 deg/s and
//                         breathes 6 %. A soft white bar (the batten at (0.2, 2.6, -1.2)) keeps glowing through the layer.
//         watch 0..1 (0)  0 the lab man looks down and writes; 1 his head lifts 6 degrees, the pen stops and his pupils sit on
//                         the viewer. The clip's last frame. (The sitters never look up.)
//   The things (x right, y up, z toward you):
//     vent V     back wall, x -1.10..-0.60, y 2.10..2.40: cream #c9c9bf louvre 0.5 x 0.3, 7 slats, #3a3d41 between
//     clock      back wall, centre (-0.85, 1.72), 0.28 across, white face, black rim 2 cm, hands at 2:17; the red second hand
//                steps 6 degrees a second on t
//     window OW  back wall hole x -0.20..+1.15, y 1.50..2.20 (1.35 x 0.70), frame 5 cm #6e7472, faint glass
//     booth      behind OW: floor y 0.75, x -0.35..1.30, z -3.4..-2.2, ceiling y 2.45, walls #3f474d. The LAB MAN stands at
//                (0.55, 0.75, -2.75), 1.45 tall, 0.6 wide, eyes at y about 1.85, white coat #f2f2ec, dark tie, black-rimmed
//                glasses, a clipboard at his chest; a tape recorder at the left (two turning 0.18 m reels at (-0.15, 1.62) and
//                (0.05, 1.62), z -2.58), a desk lamp at the right with a #ffd9a0 pool on the booth's back wall
//     3 chairs   on the back wall, x -0.75, 0, +0.75, centre z -1.8: moulded shell #5d7688, seat 0.46 x 0.42 at y 0.42, back to
//                0.78, steel tube legs 2 cm. A SITTER on each: golden #d9a85a potato figures built inside the prop (the zcivil
//                body plan, face on the body, thin arms with an elbow), 0.6 wide, heads to y 1.20. Brown cardigan #7b6a58,
//                grey jacket #5a5f66 with a thin tie, pale blue blouse #9aa7b0. Each holds a clipboard 0.23 x 0.32 (#8a6a48,
//                steel clip, a white form with 9 grey lines) tilted 35 degrees on the lap, and a pencil. Eyes down, lids 60 %
//                shut. The hand runs 1.2 cm along a line at 2.5 Hz and drops one line every 1.4 s (phases hashed).
//     low table  centre (0, 0, -0.95), 0.9 x 0.5, top y 0.40, 4 magazines
//     batten F   (0.2, 2.6, -1.2) and (0.2, 2.6, 1.3): twin tubes 1.25 x 0.2 x 0.09 along x (white, unlit)
//     Walls: gloss dado 1.0 m #8f9892, a 3 cm rail #6f7773, matte #a9aeac above; ceiling tiles 0.6 m #c9ccc8 (unlit); floor 0.3 m
//     lino #b8b4a6 / #a9a598, skirting 0.1 #5c605e; contact ovals under the furniture (20 % dark). No flicker.
//   LIGHT: the room brings two point lights at the battens (#f1f6f2, range 7 m: nothing outside the room is touched). The cel look
//     itself comes from the engine's key: ask for the key TO the light (0.1, 1.0, 0.2) (set.key with light "golden" or a lighting
//     block), the flat fluorescent look; the ceiling is unlit paint so it stays pale whatever the key.
//   Every mesh is userData.solid = false. No grips (nothing is held by a hand of the cast).
//   POV CAMERA (the viewer): pos (0, 1.0, 1.5) -> look (0, 1.35, -2.2), fov 68; free box x -0.3..0.3, y 0.9..1.1, z 1.2..1.8.
//     About, in px from the top left: ceiling line y 490, vent x 118-310, y 570-680, clock 108 px at (214, 820), OW x 463-982,
//     y 640-900, sitters 259 px wide at x 217, 540, 863, heads at y 1015, floor line y 1490; at smoke 1 smoke down to y 655.
export const ZWAIT_GRIPS = {};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZWAIT_STATE = { zwait: { smoke: 0, watch: 0 } };

// ---------------------------------------------------------------------------------------------------- helpers
const rad = (d) => (d * Math.PI) / 180;
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, M4 = THREE.Matrix4, Qt = THREE.Quaternion, Eu = THREE.Euler;
const DOWN = new V3(0, -1, 0), UP = new V3(0, 1, 0), ZAX = new V3(0, 0, 1);

function tex(w, h, draw, nearest = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (nearest) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  return t;
}
const stdM = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const flatStd = (o = {}) => { const m = stdM(o); m.userData.noOutline = true; return m; };
const basicM = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, fog: false, ...o }); m.userData.noOutline = true; return m; };
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
  m.userData.solid = false; parent.add(m); return m;
}
const glow = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (r0, r1, h, n = 10, open = false) => new THREE.CylinderGeometry(r0, r1, h, n, 1, open);

// a cylinder between two points
function limb(parent, a, b, r0, r1, mat, n = 8) {
  const d = new V3(...b).sub(new V3(...a)), L = d.length(), g = CY(r0, r1, 1, n);
  const m = put(parent, g, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(UP, d.normalize()); m.scale.set(1, L, 1); return m;
}
// a plane with its inner face toward `normal` (one of +-x, +-y, +-z), covering w x h, centred at (x, y, z); uv a sub-rectangle
function plane(parent, mat, w, h, x, y, z, face, uv = null) {
  const g = new THREE.PlaneGeometry(w, h);
  if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + (uv[2] - uv[0]) * a.getX(i), uv[1] + (uv[3] - uv[1]) * a.getY(i)); }
  const m = put(parent, g, mat, x, y, z);
  if (face === "+x") m.rotation.y = Math.PI / 2; else if (face === "-x") m.rotation.y = -Math.PI / 2; else if (face === "-z") m.rotation.y = Math.PI;
  else if (face === "+y") m.rotation.x = -Math.PI / 2; else if (face === "-y") m.rotation.x = Math.PI / 2;
  return m;
}

// painterly strokes: n rotated flat rectangles (colours, alpha range, length / thickness ranges, angle range)
function strokes(g, R, W, H, n, cols, lenR, thR, aR, angR = [0, Math.PI]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(R() * W, R() * H); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
    g.fillRect(-lenR[0] / 2 - R() * lenR[1] / 2, 0, lenR[0] + R() * lenR[1], thR[0] + R() * (thR[1] - thR[0])); g.restore();
  }
  g.globalAlpha = 1;
}
const ink = (g, x0, y0, x1, y1, w = 1.6, col = "rgba(52,58,56,0.8)") => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };

// ---------------------------------------------------------------------------------------------------- painted surfaces
// a wall of wm x hm metres: matte above, gloss dado to 1.0 m, a 3 cm rail, a 10 cm skirting, a soft grime under the ceiling
function wallTex(seed, wm, hm, ppm) {
  const W = Math.round(wm * ppm), H = Math.round(hm * ppm);
  return tex(W, H, (g) => {
    const R = rng(seed), yAt = (m) => H - m * ppm, dado = yAt(1.0), sk = yAt(0.1);
    g.fillStyle = "#a9aeac"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, dado, 240, ["#b2b7b5", "#a0a5a3", "#adb2b0", "#9ea3a1", "#b5bab7"], [60, 150], [8, 34], [0.05, 0.13], [1.5, 1.64]);   // roller streaks
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(120,124,120,${0.04 + R() * 0.06})`; g.beginPath(); g.ellipse(R() * W, R() * dado, 3 + R() * 9, 2 + R() * 6, R() * 3, 0, 6.283); g.fill(); }
    const gr = g.createLinearGradient(0, 0, 0, 0.12 * ppm); gr.addColorStop(0, "rgba(70,76,72,0.18)"); gr.addColorStop(1, "rgba(70,76,72,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, 0.12 * ppm);
    g.fillStyle = "#8f9892"; g.fillRect(0, dado, W, H - dado);   // the gloss dado
    strokes(g, R, W, H - dado, 200, ["#97a09a", "#869088", "#929b95", "#a0a9a3", "#808a83"], [50, 120], [6, 26], [0.06, 0.15], [1.5, 1.64]);
    g.save(); g.translate(0, dado);
    for (let i = 0; i < 16; i++) { const x = R() * W, w = 5 + R() * 11, lg = g.createLinearGradient(0, 0, 0, H - dado); lg.addColorStop(0, `rgba(255,255,255,${0.14 + R() * 0.1})`); lg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = lg; g.fillRect(x, 0, w, (H - dado) * (0.5 + R() * 0.4)); }   // gloss
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,64,60,${0.08 + R() * 0.1})`; const x = R() * W, y = (H - dado) * (0.55 + R() * 0.45); g.fillRect(x, y, 6 + R() * 30, 1.5 + R() * 2.5); }   // scuffs low down
    g.restore();
    const rh = 0.03 * ppm;   // the rail: 3 cm, a light line on top, a shadow under it
    g.fillStyle = "#6f7773"; g.fillRect(0, dado - rh / 2, W, rh); g.fillStyle = "rgba(190,198,194,0.5)"; g.fillRect(0, dado - rh / 2, W, 1.5);
    g.fillStyle = "rgba(30,36,34,0.3)"; g.fillRect(0, dado + rh / 2, W, 3); ink(g, 0, dado - rh / 2, W, dado - rh / 2); ink(g, 0, dado + rh / 2, W, dado + rh / 2, 1.2);
    g.fillStyle = "#5c605e"; g.fillRect(0, sk, W, H - sk); g.fillStyle = "rgba(180,186,182,0.35)"; g.fillRect(0, sk, W, 1.5); ink(g, 0, sk, W, sk);   // skirting
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(30,32,30,${0.1 + R() * 0.12})`; g.fillRect(R() * W, sk + R() * (H - sk), 4 + R() * 18, 1.5); }
  });
}
function floorTex(seed) {
  const ppm = 170, W = Math.round(3.6 * ppm), H = Math.round(4.4 * ppm), T = 0.3 * ppm;
  return tex(W, H, (g) => {
    const R = rng(seed + 31);
    for (let r = 0; r * T < H; r++) for (let c = 0; c * T < W; c++) {
      const x = c * T, y = r * T; g.fillStyle = (r + c) % 2 ? "#b8b4a6" : "#a9a598"; g.fillRect(x, y, T, T);
      for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "232,228,214" : "110,104,92"},${0.12 + R() * 0.16})`; g.beginPath(); g.ellipse(x + R() * T, y + R() * T, 1 + R() * 3.5, 0.8 + R() * 1.6, R() * 3, 0, 6.283); g.fill(); }
      g.fillStyle = `rgba(255,255,248,${0.05 + R() * 0.06})`; g.fillRect(x + 1, y + 1, T - 2, 2.5);
    }
    g.strokeStyle = "rgba(62,60,52,0.5)"; g.lineWidth = 1.4; for (let c = 0; c * T <= W; c++) ink(g, c * T, 0, c * T, H, 1.4, "rgba(62,60,52,0.45)"); for (let r = 0; r * T <= H; r++) ink(g, 0, r * T, W, r * T, 1.4, "rgba(62,60,52,0.45)");
    strokes(g, R, W, H, 70, ["rgba(70,66,56,1)"], [30, 60], [2, 6], [0.04, 0.09], [1.3, 1.8]);   // the worn path
    for (const [x0, y0, x1, y1] of [[0, 0, W, 0.12 * ppm], [0, H - 0.12 * ppm, W, H], [0, 0, 0.12 * ppm, H], [W - 0.12 * ppm, 0, W, H]]) { g.fillStyle = "rgba(34,34,30,0.14)"; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
  });
}
function ceilingTex(seed) {
  const ppm = 130, W = Math.round(3.6 * ppm), H = Math.round(4.4 * ppm), T = 0.6 * ppm;
  return tex(W, H, (g) => {
    const R = rng(seed + 57);
    for (let r = 0; r * T < H; r++) for (let c = 0; c * T < W; c++) {
      const x = c * T, y = r * T; g.fillStyle = (r * 3 + c * 7) % 5 === 0 ? "#c3c6c2" : "#c9ccc8"; g.fillRect(x, y, T, T);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(104,110,104,${0.3 + R() * 0.25})`; g.beginPath(); g.ellipse(x + 4 + R() * (T - 8), y + 4 + R() * (T - 8), 0.8 + R() * 1.3, 0.7 + R() * 1.0, R() * 3, 0, 6.283); g.fill(); }
      g.fillStyle = `rgba(236,238,232,${0.2 + R() * 0.2})`; g.fillRect(x + 2, y + 2, T - 4, 2.5);
    }
    for (let c = 0; c * T <= W; c++) ink(g, c * T, 0, c * T, H, 2, "rgba(112,118,112,0.7)"); for (let r = 0; r * T <= H; r++) ink(g, 0, r * T, W, r * T, 2, "rgba(112,118,112,0.7)");
    for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(150,140,110,${0.06 + R() * 0.06})`; g.beginPath(); g.ellipse(R() * W, R() * H, 10 + R() * 30, 8 + R() * 18, R() * 3, 0, 6.283); g.fill(); }
  });
}
const boothTex = (seed) => tex(256, 256, (g, W, H) => { const R = rng(seed + 91); g.fillStyle = "#3f474d"; g.fillRect(0, 0, W, H); strokes(g, R, W, H, 120, ["#485057", "#363e44", "#434b52", "#3a4248"], [30, 80], [4, 16], [0.1, 0.25], [1.4, 1.7]); });
const woodTex = (seed, base, a, b) => tex(256, 128, (g, W, H) => { const R = rng(seed); g.fillStyle = base; g.fillRect(0, 0, W, H); strokes(g, R, W, H, 90, [a, b], [60, 120], [1.5, 5], [0.15, 0.4], [-0.04, 0.04]); });

// ---------------------------------------------------------------------------------------------------- the potato people
// the zcivil body plan: ellipsoid 0.86 x 1.0 x 0.76 (unit size), body centre 0.65 above the feet, hips at 0.18, faces +z; the head is
// the upper half, the clothes the lower half. A figure scales its body group (sx, sy) so the torso can lean without a shear.
const RX = 0.43, RY = 0.5, RZ = 0.38, HIP = 0.18, L1 = 0.3, L2 = 0.3;
const onBody = (th, ph) => {
  const p = new V3(RX * Math.sin(th) * Math.cos(ph), RY * Math.sin(ph), RZ * Math.cos(th) * Math.cos(ph));
  const nn = new V3(Math.sin(th) * Math.cos(ph) / RX, Math.sin(ph) / RY, Math.cos(th) * Math.cos(ph) / RZ).normalize(); return [p, nn];
};
const phOf = (y) => Math.asin(clamp(y / RY, -1, 1));

function bake() {
  const list = [], Mx = new M4(), Qx = new Qt(), Ex = new Eu();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], q = null, s = [1, 1, 1], c = "#888888" } = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      Mx.compose(new V3(...p), q || Qx.setFromEuler(Ex.set(r[0], r[1], r[2])), new V3(...s)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    geo() { return list.length ? mergeGeometriesLite(list) : null; },
  };
}
function mergeGeometriesLite(list) {   // non-indexed geometries with position, normal, uv, color
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry(), keys = ["position", "normal", "uv", "color"];
  for (const k of keys) {
    const sz = list[0].attributes[k].itemSize, a = new Float32Array(n * sz); let o = 0;
    for (const g of list) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(a, sz));
  }
  return out;
}
function decalMaker(fb) {
  return (th, y, rx, ry, rz, col, lift = 0, rollZ = 0) => {
    const [p, nn] = onBody(th, phOf(y)), q = new Qt().setFromUnitVectors(ZAX, nn);
    if (rollZ) q.multiply(new Qt().setFromAxisAngle(ZAX, rollZ));
    fb.add(new THREE.SphereGeometry(1, 10, 8), { p: p.addScaledVector(nn, lift).toArray(), q, s: [rx, ry, rz], c: col });
  };
}

let CK = null;
function civilKit() {
  if (CK) return CK;
  const gold = tex(512, 256, (g, W, H) => {   // the cast's golden skin, painted
    const R = rng(909); g.fillStyle = "#d9a85a"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 300, ["#e2b569", "#cf9c4c", "#d6a455", "#e8c07a", "#c7954a"], [20, 60], [5, 22], [0.1, 0.3]);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(150,100,40,${0.08 + R() * 0.1})`; g.beginPath(); g.ellipse(R() * W, R() * H, 6 + R() * 12, 4 + R() * 8, R() * 3, 0, 6.283); g.fill(); }
  });
  const bodyMat = new THREE.MeshStandardMaterial({ map: gold, roughness: 0.8 }); bodyMat.userData.noOutline = true;
  const bodyGeo = new THREE.SphereGeometry(1, 28, 20), bp = bodyGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) bp.setXYZ(i, bp.getX(i) * RX, bp.getY(i) * RY, bp.getZ(i) * RZ);
  bodyGeo.computeVertexNormals();
  const faceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }); faceMat.userData.noOutline = true;
  return (CK = { bodyGeo, bodyMat, faceMat, cloth: {}, mats: {}, faces: {} });
}
const clothMat = (col) => {   // a painted cloth per colour, cached
  const K = civilKit();
  return (K.cloth[col] ||= (() => {
    const c = new THREE.Color(col), hex = (k) => `#${c.clone().offsetHSL(0, 0, k).getHexString()}`;
    const t = tex(128, 128, (g, W, H) => { const R = rng(parseInt(col.slice(1), 16) % 9973 + 3); g.fillStyle = col; g.fillRect(0, 0, W, H); strokes(g, R, W, H, 90, [hex(0.05), hex(-0.06), hex(0.02), hex(-0.03)], [14, 36], [3, 9], [0.2, 0.45], [-0.5, 0.5]); });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }); m.userData.noOutline = true; return m;
  })());
};
const flatMat = (col) => { const K = civilKit(); return (K.mats[col] ||= stdM({ color: col, roughness: 0.8, side: THREE.DoubleSide })); };

// the face (baked): lids = eyes down, the upper 60 % of each white under a skin-coloured lid with a dark lash line, the pupil low;
// open = the whites only (the pupils are moving meshes). ey = the eye centre height.
function faceGeo(o) {
  const K = civilKit(), { eyes: kind, ey, browY, mouthY, eyeRy } = o, key = [kind, ey, browY, mouthY, eyeRy].join();
  if (K.faces[key]) return K.faces[key];
  const fb = bake(), decal = decalMaker(fb), ry = eyeRy, rx = ry * 0.82;
  for (const s of [-1, 1]) {
    decal(s * 0.4, ey, rx, ry, 0.05, "#f4efdc", -0.005);   // the white
    if (kind === "lids") {
      decal(s * 0.4, ey - 0.055, 0.06, 0.072, 0.056, "#2a2118", 0);   // the pupil, low
      decal(s * 0.4, ey + 0.068, rx + 0.005, 0.104, 0.061, "#5b3b1c", 0);   // the lash line
      decal(s * 0.4, ey + 0.072, rx + 0.003, 0.1, 0.062, "#d9a85a", 0);    // the lid over the upper 60 %
    }
    decal(s * 0.42, browY, kind === "open" ? 0.075 : 0.1, kind === "open" ? 0.011 : 0.016, 0.067, "#5b3b1c", 0.002, -s * 0.1);   // the brow
  }
  decal(0, mouthY, 0.06, 0.013, 0.05, "#3a1f12", -0.004);   // a small shut mouth
  return (K.faces[key] = fb.geo());
}

// a flat painted patch lying on the clothed lower body: y0 (top) .. y1 (bottom), x edges (a, b) at the top and at the bottom
function patch(parent, mat, y0, y1, a0, b0, a1, b1, lift = 0.012, k = 1.07) {
  const N = 6, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, y = lerp(y0, y1, f), a = lerp(a0, a1, f), b = lerp(b0, b1, f);
    for (const x of [a, (a + b) / 2, b]) { const q = 1 - (x / (RX * k)) ** 2 - (y / (RY * (k - 0.01))) ** 2; pos.push(x, y, RZ * (k + 0.03) * Math.sqrt(Math.max(q, 0)) + lift); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 1, c = a + 3, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return put(parent, g, mat);
}

// clothes and hair on a figure's body (children of the body group; unit size)
function dress(bodyG, o) {
  const cloth = clothMat(o.c), sh = (geo, mat, x, y, z, sx, sy, sz) => { const m = put(bodyG, geo, mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const cap = (th0, th1, mat, k = 1.05) => sh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, th0, th1 - th0), mat, 0, 0, 0, RX * k, RY * (k - 0.01), RZ * (k + 0.03));
  const ring = (y, a, b, mat, r = 0.1) => { const g = new THREE.TorusGeometry(1, r, 6, 28); g.rotateX(Math.PI / 2); g.scale(a, 1, b); put(bodyG, g, mat, 0, y, 0); };
  const top = o.top === "labcoat" ? 1.45 : Math.PI * 0.5, yTop = RY * 1.06 * Math.cos(top);
  cap(top, Math.PI, cloth, 1.07); ring(yTop, RX * 1.07 * Math.sin(top), RZ * 1.1 * Math.sin(top), cloth, 0.05);
  if (o.top === "labcoat") {
    const g = CY(0.4, 0.5, 0.5, 24, true); g.scale(1, 1, 0.92); put(bodyG, g, cloth, 0, -0.44, 0);   // the coat to the knees
    patch(bodyG, flatMat("#dfe0d9"), 0.02, -0.34, -0.2, -0.03, -0.06, -0.015, 0.016);   // lapels
    patch(bodyG, flatMat("#dfe0d9"), 0.02, -0.34, 0.03, 0.2, 0.015, 0.06, 0.016);
    patch(bodyG, flatMat("#e9ebe5"), 0.04, -0.2, -0.03, 0.03, -0.015, 0.015, 0.02);   // the shirt
    patch(bodyG, flatMat("#3a3d41"), 0.0, -0.3, -0.017, 0.017, -0.022, 0.022, 0.026);   // the dark tie
    patch(bodyG, flatMat("#cfd1cb"), -0.2, -0.3, 0.16, 0.3, 0.16, 0.3, 0.016);   // a breast pocket
  } else if (o.top === "jacket") {
    patch(bodyG, flatMat("#4b5057"), -0.02, -0.4, -0.22, -0.04, -0.1, -0.04, 0.016);
    patch(bodyG, flatMat("#4b5057"), -0.02, -0.4, 0.04, 0.22, 0.04, 0.1, 0.016);
    patch(bodyG, flatMat("#e7e6df"), -0.01, -0.3, -0.04, 0.04, -0.02, 0.02, 0.018);   // shirt
    patch(bodyG, flatMat(o.tie), -0.03, -0.33, -0.014, 0.014, -0.018, 0.018, 0.024);   // a thin tie
  } else if (o.top === "cardigan") {
    patch(bodyG, flatMat("#e3dccb"), -0.0, -0.22, -0.06, 0.06, -0.025, 0.025, 0.016);   // the blouse in the V
    patch(bodyG, flatMat("#5b4a3a"), -0.0, -0.42, -0.1, -0.05, -0.1, -0.05, 0.02);      // the button bands
    patch(bodyG, flatMat("#5b4a3a"), -0.0, -0.42, 0.05, 0.1, 0.05, 0.1, 0.02);
    for (let i = 0; i < 4; i++) { const y = -0.08 - i * 0.09, z = RZ * 1.1 * Math.sqrt(Math.max(0, 1 - (y / (RY * 1.06)) ** 2)) + 0.032; sh(new THREE.SphereGeometry(1, 8, 6), flatMat("#2e2620"), 0.075, y, z, 0.016, 0.016, 0.01); }
  } else if (o.top === "blouse") {
    patch(bodyG, flatMat("#c5d1d8"), -0.0, -0.1, -0.2, -0.02, -0.12, -0.02, 0.016);   // a collar, two wings
    patch(bodyG, flatMat("#c5d1d8"), -0.0, -0.1, 0.02, 0.2, 0.02, 0.12, 0.016);
    for (let i = 0; i < 4; i++) { const y = -0.12 - i * 0.1, z = RZ * 1.1 * Math.sqrt(Math.max(0, 1 - (y / (RY * 1.06)) ** 2)) + 0.022; sh(new THREE.SphereGeometry(1, 8, 6), flatMat("#e8eef0"), 0, y, z, 0.014, 0.014, 0.01); }
  }
  const [kind, col] = o.hair;
  const hairM = flatMat(col);
  cap(0, Math.PI * (kind === "bob" ? 0.27 : (o.hairTh ?? 0.18)), hairM, 1.04);
  if (kind === "bob") for (const s of [-1, 1]) sh(new THREE.SphereGeometry(1, 10, 8), hairM, s * 0.4, 0.2, -0.02, 0.1, 0.2, 0.22);
  if (kind === "part") { const m = sh(new THREE.SphereGeometry(1, 10, 8), hairM, -0.1, RY * 0.9, 0.12, 0.17, 0.05, 0.22); m.rotation.z = 0.25; }
  if (!o.noLeaf) {
    const leaf = new THREE.SphereGeometry(1, 8, 6); const l1 = sh(leaf, flatMat("#6f9a3c"), 0.06, RY + 0.06, 0.02, 0.1, 0.035, 0.05); l1.rotation.z = -0.5;
    const l2 = sh(leaf, flatMat("#7fae48"), -0.05, RY + 0.05, 0.0, 0.09, 0.03, 0.045); l2.rotation.z = 0.6;
  }
}

// the figure: root (the feet) -> torso pivot at the hips (the lean) -> body group (scaled sx, sy; body, face, clothes, arms)
function makeFigure(o) {
  const K = civilKit();
  const root = new THREE.Group(), torso = new THREE.Group(), bodyG = new THREE.Group();
  root.userData.solid = false; torso.position.y = HIP * o.sy; bodyG.position.y = (0.65 - HIP) * o.sy; bodyG.scale.set(o.sx, o.sy, o.sx);
  root.add(torso); torso.add(bodyG);
  put(bodyG, K.bodyGeo, K.bodyMat); put(bodyG, faceGeo(o), K.faceMat);
  dress(bodyG, o);
  const sleeve = clothMat(o.c), hand = flatMat("#d9a85a"), pants = flatMat(o.pants), shoe = flatMat("#2b2420");
  const arms = [-1, 1].map((sg) => {
    const up = new THREE.Group(); up.position.set(sg * 0.4, -0.02, 0.06); bodyG.add(up);
    put(up, CY(0.036, 0.032, L1, 6), sleeve, 0, -L1 / 2, 0);
    const fore = new THREE.Group(); fore.position.y = -L1; up.add(fore);
    put(fore, new THREE.SphereGeometry(0.036, 8, 6), sleeve); put(fore, CY(0.032, 0.03, L2, 6), sleeve, 0, -L2 / 2, 0);
    put(fore, new THREE.SphereGeometry(0.052, 8, 6), hand, 0, -L2 - 0.02, 0).scale.set(1, 1.1, 0.85);
    return { up, fore, l1: L1, l2: L2 + 0.02, pole: new V3(sg * 1, -0.35, 0.05).normalize() };
  });
  const pupils = [];
  if (o.eyes === "open") for (const s of [-1, 1]) {
    const p = put(bodyG, new THREE.SphereGeometry(1, 18, 12), stdM({ color: "#2a2118", roughness: 0.5 }), 0, 0, 0); p.scale.set(0.056, 0.07, 0.062); p.material.userData.noOutline = true; p.userData.s = s; pupils.push(p);
    if (o.glasses) {
      const [pp, nn] = onBody(s * 0.4, phOf(o.ey)), q = new Qt().setFromUnitVectors(ZAX, nn), rim = stdM({ color: "#1d1f21", roughness: 0.4 });
      const ring = put(bodyG, new THREE.TorusGeometry(0.128, 0.017, 8, 24), rim, ...pp.clone().addScaledVector(nn, 0.03).toArray()); ring.quaternion.copy(q); ring.scale.set(1, 0.9, 1);
    }
  }
  if (o.glasses) { const [pp, nn] = onBody(0, phOf(o.ey)); put(bodyG, BX(0.12, 0.02, 0.02), stdM({ color: "#1d1f21" }), pp.x, pp.y + 0.03, pp.z + 0.03); }
  if (o.seated) {
    root.position.y = 0.395;
    for (const sg of [-1, 1]) {
      const hx = sg * 0.105, fy = -0.395;
      limb(root, [hx, 0.09, 0.0], [hx, 0.06, 0.36], 0.046, 0.04, pants); limb(root, [hx, 0.06, 0.36], [hx, fy + 0.07, 0.4], 0.04, 0.032, pants);
      put(root, new THREE.SphereGeometry(0.041, 8, 6), pants, hx, 0.06, 0.36); put(root, BX(0.1, 0.07, 0.2), shoe, hx, fy + 0.035, 0.46);
    }
  } else {
    for (const sg of [-1, 1]) { limb(root, [sg * 0.1, HIP * o.sy, 0], [sg * 0.1, 0.03, 0], 0.05, 0.04, pants); put(root, BX(0.12, 0.06, 0.2), shoe, sg * 0.1, 0.03, 0.04); }
  }
  return { root, torso, bodyG, arms, pupils, o };
}

// two-bone arm, in the body group's own frame: the hand's centre reaches T, the elbow bends toward the arm's pole
const _s = new V3(), _d = new V3(), _p = new V3(), _e = new V3(), _u = new V3(), _f = new V3(), _q = new Qt();
function solveArm(a, T) {
  _s.copy(a.up.position); _d.copy(T).sub(_s); const L = a.l1 + a.l2; let d = _d.length();
  if (d > L * 0.985) { _d.multiplyScalar((L * 0.985) / d); d = L * 0.985; } d = Math.max(d, 0.1); _d.normalize();
  const aa = (a.l1 * a.l1 - a.l2 * a.l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a.l1 * a.l1 - aa * aa));
  _p.copy(a.pole).addScaledVector(_d, -a.pole.dot(_d)).normalize();
  _e.copy(_s).addScaledVector(_d, aa).addScaledVector(_p, h);
  _u.copy(_e).sub(_s).normalize(); a.up.quaternion.setFromUnitVectors(DOWN, _u);
  _f.copy(_s).addScaledVector(_d, d).sub(_e).normalize().applyQuaternion(_q.copy(a.up.quaternion).invert()); a.fore.quaternion.setFromUnitVectors(DOWN, _f);
}

// ---------------------------------------------------------------------------------------------------- clipboards, pencils
let FORM = null;
const formTex = () => (FORM ||= tex(200, 280, (g, W, H) => {   // 0.2 x 0.28 m at 1000 px/m: 9 grey lines at v = 0.09 - k * 0.022
  const R = rng(4411); g.fillStyle = "#f4f3ee"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#c9c9c2"; g.fillRect(10, 10, 180, 14); g.fillStyle = "#8a8d90"; g.fillRect(12, 13, 60, 3); g.fillRect(12, 18, 36, 2); g.fillRect(150, 13, 32, 3);
  for (let k = 0; k < 9; k++) {
    const y = (0.14 - (0.09 - k * 0.022)) * 1000; ink(g, 12, y, 188, y, 1.4, "rgba(130,134,138,0.85)");
    const n = 2 + ((R() * 5) | 0); g.strokeStyle = "rgba(70,72,78,0.55)"; g.lineWidth = 1.1; g.beginPath(); g.moveTo(16, y - 3);
    for (let i = 0; i < n * 5; i++) g.lineTo(16 + i * (R() * 6 + 2), y - 3 - (i % 2) * (2 + R() * 4)); g.stroke();
  }
}));
let BOARDM = null;
function makeBoard(parent) {
  const g = new THREE.Group(); g.userData.solid = false; parent.add(g);
  BOARDM ||= { back: stdM({ map: woodTex(77, "#8a6a48", "#9a7a56", "#7a5c3c"), roughness: 0.8 }), steel: stdM({ color: "#b8bdc1", roughness: 0.35, metalness: 0.4 }), form: flatStd({ map: formTex(), roughness: 0.95 }) };
  put(g, BX(0.23, 0.32, 0.008), BOARDM.back);
  put(g, new THREE.PlaneGeometry(0.2, 0.28), BOARDM.form, 0, -0.005, 0.0045);
  put(g, BX(0.07, 0.035, 0.014), BOARDM.steel, 0, 0.145, 0.008); put(g, BX(0.05, 0.02, 0.004), BOARDM.steel, 0, 0.148, -0.006);
  return g;
}
function makePencil(parent) {   // origin = the tip, along +y
  const g = new THREE.Group(); g.userData.solid = false; parent.add(g);
  put(g, CY(0.0045, 0.0045, 0.15, 6), stdM({ color: "#e0b23a", roughness: 0.5 }), 0, 0.085, 0); put(g, new THREE.ConeGeometry(0.0045, 0.012, 6), stdM({ color: "#2b2b2e" }), 0, 0.006, 0).rotation.x = Math.PI;
  put(g, CY(0.0046, 0.0046, 0.008, 6), stdM({ color: "#d98a8a" }), 0, 0.164, 0);
  return g;
}

// ---------------------------------------------------------------------------------------------------- cel smoke
let SK = null;
function smokeKit() {
  if (SK) return SK;
  const toneTex = tex(100, 1, (g, W) => { const cuts = [[0, 0.22, "#bcc4c9"], [0.22, 0.58, "#e3e6e6"], [0.58, 1, "#fbfbf8"]]; for (const [a, b, c] of cuts) { g.fillStyle = c; g.fillRect(a * W, 0, (b - a) * W + 1, 1); } }, true);   // u = n.y * 0.5 + 0.5
  const geos = [0, 1, 2, 3].map((v) => {
    const g = new THREE.SphereGeometry(1, 22, 16), p = g.attributes.position, ph = [v * 1.7, v * 2.3 + 1, v * 0.9 + 2];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), az = Math.atan2(z, x), el = Math.asin(clamp(y, -1, 1));
      const k = 1 + 0.11 * Math.sin(az * 3 + ph[0]) * Math.cos(el * 2 + ph[1]) + 0.07 * Math.sin(az * 5 + el * 3 + ph[2]) + 0.04 * Math.sin(az * 2 - el * 4 + ph[0]);
      p.setXYZ(i, x * k, y * k, z * k);
    }
    g.deleteAttribute("normal"); g.deleteAttribute("uv"); const m = mergeVertices(g, 1e-4); m.computeVertexNormals();
    const n = m.attributes.normal, mp = m.attributes.position, uv = new Float32Array(n.count * 2);
    for (let i = 0; i < n.count; i++) { const kk = Math.hypot(mp.getX(i), mp.getY(i), mp.getZ(i)); uv[i * 2] = clamp(0.5 + 0.5 * (0.45 * n.getY(i) + 3.2 * (kk - 1) + 0.1), 0, 1); uv[i * 2 + 1] = 0.5; }   // tone: the lobe's own top / bottom and its bumps
    m.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return m;
  });
  const fill = (op, dw) => { const m = new THREE.MeshBasicMaterial({ map: toneTex, transparent: true, opacity: op, depthWrite: dw, fog: false }); m.userData.noOutline = true; return m; };
  const hull = (op) => { const m = new THREE.MeshBasicMaterial({ color: "#8a959b", side: THREE.BackSide, transparent: op < 1, opacity: op, depthWrite: op >= 1, fog: false }); m.userData.noOutline = true; return m; };
  return (SK = { geos, fill: fill(0.96, true), fillLead: fill(0.6, false), hull: hull(1), hullLead: hull(0.6) });
}

// a soft painted card (a radial blot) for glows and the lamp pool
let BLOT = null;
const blotTex = () => (BLOT ||= tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.45, "rgba(255,255,255,0.7)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }));

// ---------------------------------------------------------------------------------------------------- the kind
const VX = -0.85, VY = 2.25, WZ = -2.2;   // the vent's centre on the back wall
const ZWAIT = {
  zwait(P) {
    const S = P.spec, G = P.whole, seed = S.seed ?? 1;
    const root = new THREE.Group(); root.userData.solid = false; G.add(root);

    // ---------------- room shell: inner faces only
    const wallB = flatStd({ map: wallTex(seed * 7 + 1, 3.6, 2.6, 330), roughness: 0.55 });
    const wallS = (k) => flatStd({ map: wallTex(seed * 7 + 2 + k, 4.4, 2.6, 250), roughness: 0.55 });
    const HX0 = -0.2, HX1 = 1.15, HY0 = 1.5, HY1 = 2.2;   // the observation window's hole
    const uvx = (x) => (x + 1.8) / 3.6, uvy = (y) => y / 2.6;
    plane(root, wallB, HX0 + 1.8, 2.6, (-1.8 + HX0) / 2, 1.3, WZ, "+z", [0, 0, uvx(HX0), 1]);
    plane(root, wallB, 1.8 - HX1, 2.6, (HX1 + 1.8) / 2, 1.3, WZ, "+z", [uvx(HX1), 0, 1, 1]);
    plane(root, wallB, HX1 - HX0, HY0, (HX0 + HX1) / 2, HY0 / 2, WZ, "+z", [uvx(HX0), 0, uvx(HX1), uvy(HY0)]);
    plane(root, wallB, HX1 - HX0, 2.6 - HY1, (HX0 + HX1) / 2, (HY1 + 2.6) / 2, WZ, "+z", [uvx(HX0), uvy(HY1), uvx(HX1), 1]);
    plane(root, wallS(0), 4.4, 2.6, -1.8, 1.3, 0, "+x"); plane(root, wallS(1), 4.4, 2.6, 1.8, 1.3, 0, "-x"); plane(root, wallS(2), 3.6, 2.6, 0, 1.3, 2.2, "-z");
    plane(root, flatStd({ map: floorTex(seed), roughness: 0.4 }), 3.6, 4.4, 0, 0, 0, "+y");
    plane(root, basicM("#ffffff", { map: ceilingTex(seed) }), 3.6, 4.4, 0, 2.6, 0, "-y");
    // the window's reveals (0.12 deep) and its frame
    const rev = flatStd({ color: "#a9aeac" }), frameM = stdM({ color: "#6e7472", roughness: 0.5 });
    plane(root, rev, HX1 - HX0, 0.12, (HX0 + HX1) / 2, HY0, WZ - 0.06, "+y"); plane(root, rev, HX1 - HX0, 0.12, (HX0 + HX1) / 2, HY1, WZ - 0.06, "-y");
    plane(root, rev, 0.12, HY1 - HY0, HX0, (HY0 + HY1) / 2, WZ - 0.06, "+x"); plane(root, rev, 0.12, HY1 - HY0, HX1, (HY0 + HY1) / 2, WZ - 0.06, "-x");
    const fw = HX1 - HX0, fh = HY1 - HY0, fc = [(HX0 + HX1) / 2, (HY0 + HY1) / 2];
    put(root, BX(fw, 0.05, 0.1), frameM, fc[0], HY1 - 0.025, WZ - 0.05); put(root, BX(fw, 0.05, 0.1), frameM, fc[0], HY0 + 0.025, WZ - 0.05);
    put(root, BX(0.05, fh - 0.1, 0.1), frameM, HX0 + 0.025, fc[1], WZ - 0.05); put(root, BX(0.05, fh - 0.1, 0.1), frameM, HX1 - 0.025, fc[1], WZ - 0.05);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(fw - 0.1, fh - 0.1), new THREE.MeshBasicMaterial({ map: tex(128, 64, (g, W, H) => { g.fillStyle = "rgba(205,225,232,0.07)"; g.fillRect(0, 0, W, H); g.fillStyle = "rgba(255,255,255,0.12)"; for (const [x, w] of [[22, 10], [44, 4], [96, 8]]) { g.beginPath(); g.moveTo(x + w, 0); g.lineTo(x + 2 * w, 0); g.lineTo(x + w - 18, H); g.lineTo(x - 18, H); g.fill(); } }), transparent: true, depthWrite: false, fog: false }));
    glass.material.userData.noOutline = true; glass.position.set(fc[0], fc[1], WZ - 0.04); glass.userData.solid = false; glass.renderOrder = 2; root.add(glass);

    // ---------------- the booth behind the window
    const bm = flatStd({ map: boothTex(seed), roughness: 0.9 });
    plane(root, bm, 1.65, 1.2, 0.475, 0.75, -2.8, "+y"); plane(root, bm, 1.65, 1.2, 0.475, 2.45, -2.8, "-y");
    plane(root, bm, 1.2, 1.7, -0.35, 1.6, -2.8, "+x"); plane(root, bm, 1.2, 1.7, 1.3, 1.6, -2.8, "-x"); plane(root, bm, 1.65, 1.7, 0.475, 1.6, -3.4, "+z");
    const desk = stdM({ map: woodTex(seed + 3, "#6a553f", "#7a634a", "#594632"), roughness: 0.8 }), dark = stdM({ color: "#2f3236", roughness: 0.6 });
    put(root, BX(0.62, 0.05, 0.42), desk, -0.02, 1.425, -2.68); put(root, BX(0.52, 0.05, 0.45), desk, 1.02, 1.425, -3.0);   // the two desk tops (below the sill, mostly)
    // the tape recorder: a case with two turning reels
    put(root, BX(0.46, 0.3, 0.2), stdM({ color: "#565b5f", roughness: 0.6 }), -0.05, 1.6, -2.68);
    put(root, BX(0.44, 0.03, 0.02), dark, -0.05, 1.5, -2.57);
    for (const [x, y] of [[0.0, 1.5], [0.06, 1.5], [0.12, 1.5]]) put(root, CY(0.012, 0.012, 0.02, 10), stdM({ color: "#d8d4c8" }), x - 0.12, y - 0.0, -2.565).rotation.x = Math.PI / 2;
    const reelM = new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, W) => { const R = rng(seed + 12); g.fillStyle = "#b8bdc1"; g.fillRect(0, 0, W, W); g.fillStyle = "#3a2e24"; g.beginPath(); g.arc(64, 64, 56, 0, 6.283); g.fill(); g.fillStyle = "#c9ccc8"; g.beginPath(); g.arc(64, 64, 40, 0, 6.283); g.fill(); g.fillStyle = "#2f3236"; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(64, 64); g.arc(64, 64, 34, k * 2.094 + 0.2, k * 2.094 + 1.55); g.closePath(); g.fill(); } g.fillStyle = "#e8e6de"; g.beginPath(); g.arc(64, 64, 9, 0, 6.283); g.fill(); ink(g, 64, 64 - 56, 64, 64 - 44, 3, "#d8d4c8"); void R; }), roughness: 0.6 });
    const reels = [-0.15, 0.05].map((x) => { const grp = new THREE.Group(); grp.position.set(x, 1.62, -2.575); root.add(grp); const m = put(grp, CY(0.09, 0.09, 0.018, 28), [stdM({ color: "#b8bdc1" }), reelM, stdM({ color: "#b8bdc1" })], 0, 0, 0); m.rotation.x = Math.PI / 2; return grp; });
    // the desk lamp and its pool
    const lampM = stdM({ color: "#3d4a3f", roughness: 0.5 });
    put(root, CY(0.05, 0.06, 0.03, 12), lampM, 1.08, 1.465, -3.05); limb(root, [1.08, 1.47, -3.05], [1.0, 1.85, -3.05], 0.008, 0.008, lampM, 6); limb(root, [1.0, 1.85, -3.05], [0.9, 1.78, -3.0], 0.008, 0.008, lampM, 6);
    put(root, new THREE.ConeGeometry(0.09, 0.12, 14, 1, true), stdM({ color: "#4a5d4c", side: THREE.DoubleSide }), 0.86, 1.74, -3.0).rotation.z = 0.7;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: blotTex(), color: "#ffd9a0", transparent: true, opacity: 0.55, depthWrite: false, fog: false })); pool.material.userData.noOutline = true; pool.position.set(0.95, 1.68, -3.38); pool.userData.solid = false; root.add(pool);

    // ---------------- vent V and clock on the back wall
    const cream = stdM({ color: "#c9c9bf", roughness: 0.6 });
    put(root, BX(0.5, 0.3, 0.02), stdM({ color: "#3a3d41" }), VX, VY, WZ + 0.01);
    for (let k = 0; k < 7; k++) { const m = put(root, BX(0.47, 0.018, 0.03), cream, VX, 2.1 + (k + 0.5) * (0.3 / 7), WZ + 0.026); m.rotation.x = -0.55; }
    for (const [w, h, x, y] of [[0.52, 0.016, 0, 0.158], [0.52, 0.016, 0, -0.158], [0.016, 0.3, -0.254, 0], [0.016, 0.3, 0.254, 0]]) put(root, BX(w, h, 0.03), cream, VX + x, VY + y, WZ + 0.015);
    const clock = new THREE.Group(); clock.position.set(-0.85, 1.72, WZ + 0.015); root.add(clock);
    put(clock, CY(0.14, 0.14, 0.03, 36), stdM({ color: "#1d1f21", roughness: 0.5 }), 0, 0, 0).rotation.x = Math.PI / 2;
    const face = put(clock, new THREE.CircleGeometry(0.12, 36), flatStd({ map: tex(256, 256, (g, W) => { g.fillStyle = "#f6f4ee"; g.fillRect(0, 0, W, W); for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r0 = big ? 100 : 114, r1 = 122; ink(g, 128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0, 128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1, big ? 6 : 2, "#2a2c2e"); } ink(g, 120, 6, 120, 28, 5, "#2a2c2e"); ink(g, 136, 6, 136, 28, 5, "#2a2c2e"); }) }), 0, 0, 0.0155);
    face.userData.solid = false;
    const hand = (len, w, col, z) => { const g = new THREE.Group(); g.position.z = z; clock.add(g); put(g, BX(w, len, 0.003), stdM({ color: col, roughness: 0.5 }), 0, len / 2 - 0.012, 0); return g; };
    const hH = hand(0.075, 0.012, "#1d1f21", 0.02), hM = hand(0.105, 0.008, "#1d1f21", 0.0235), hS = hand(0.115, 0.004, "#c4302b", 0.027);
    hH.rotation.z = -rad(2 * 30 + 17 * 0.5); hM.rotation.z = -rad(17 * 6);
    put(hS, new THREE.CircleGeometry(0.009, 10), stdM({ color: "#c4302b" }), 0, 0, 0.0005);

    // ---------------- battens F (unlit tubes) with a soft white bar that shines through the smoke
    const tubeM = basicM("#ffffff"), housing = stdM({ color: "#e4e7e2", roughness: 0.5 });
    for (const z of [-1.2, 1.3]) {
      put(root, BX(1.25, 0.09, 0.2), housing, 0.2, 2.555, z); for (const dz of [-0.05, 0.05]) put(root, CY(0.02, 0.02, 1.2, 8), tubeM, 0.2, 2.505, z + dz).rotation.z = Math.PI / 2;
      const L = new THREE.PointLight("#f1f6f2", 0.9, 7, 1.2); L.position.set(0.2, 2.35, z); L.castShadow = false; root.add(L);
    }
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.5), new THREE.MeshBasicMaterial({ map: blotTex(), color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    bar.material.userData.noOutline = true; bar.rotation.x = Math.PI / 2; bar.position.set(0.2, 2.4, -1.2); glow(bar, 12); root.add(bar);

    // ---------------- contact ovals (20 % dark) under the furniture and the feet
    const ovals = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.4), new THREE.MeshBasicMaterial({ map: tex(216, 264, (g) => { const oval = (x, z, rx, rz) => { g.save(); g.translate((x + 1.8) * 60, (z + 2.2) * 60); g.scale(rx * 60, rz * 60); const r = g.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, "rgba(30,30,26,0.2)"); r.addColorStop(0.7, "rgba(30,30,26,0.17)"); r.addColorStop(1, "rgba(30,30,26,0)"); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, 6.283); g.fill(); g.restore(); }; for (const x of [-0.75, 0, 0.75]) { oval(x, -1.8, 0.36, 0.34); oval(x, -1.38, 0.2, 0.16); } oval(0, -0.95, 0.62, 0.42); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: false }));
    ovals.material.userData.noOutline = true; ovals.rotation.x = -Math.PI / 2; ovals.position.y = 0.003; ovals.userData.solid = false; ovals.renderOrder = 1; root.add(ovals);

    // ---------------- chairs
    const shell = stdM({ color: "#5d7688", roughness: 0.4 }), steel = stdM({ color: "#b9bec2", roughness: 0.3, metalness: 0.4 });
    const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; };
    const ext = (w, h, d) => new THREE.ExtrudeGeometry(rr(w - 0.02, h - 0.02, 0.05), { depth: d - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 6 });
    for (const x of [-0.75, 0, 0.75]) {
      const c = new THREE.Group(); c.position.set(x, 0, -1.8); root.add(c);
      const seat = put(c, ext(0.46, 0.42, 0.04).rotateX(-Math.PI / 2), shell, 0, 0.38 + 0.008, 0); seat.position.y = 0.388;
      const back = put(c, ext(0.42, 0.3, 0.035), shell, 0, 0.62, -0.2); back.rotation.x = -0.14;
      put(c, BX(0.1, 0.1, 0.03), steel, 0, 0.45, -0.19);
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) limb(c, [sx * 0.19, 0.385, sz * 0.17], [sx * 0.22, 0.0, sz * 0.22], 0.01, 0.01, steel, 6);
      for (const sx of [-1, 1]) limb(c, [sx * 0.2, 0.2, 0.19], [sx * 0.2, 0.2, -0.19], 0.008, 0.008, steel, 6);
    }

    // ---------------- table and magazines
    const tableTop = stdM({ map: woodTex(seed + 5, "#a07a50", "#b08a5c", "#8e6a44"), roughness: 0.6 }), tleg = stdM({ color: "#3b3633", roughness: 0.6 });
    put(root, BX(0.9, 0.03, 0.5), tableTop, 0, 0.385, -0.95);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) limb(root, [sx * 0.39, 0.37, -0.95 + sz * 0.2], [sx * 0.43, 0.0, -0.95 + sz * 0.22], 0.02, 0.013, tleg, 8);
    const covers = [["#c25b4a", "#e8d7b0"], ["#e3c26a", "#3d5f7a"], ["#4f7f8f", "#e8d7b0"], ["#d8d2c4", "#b44a3c"]];
    const mags = [[-0.27, -0.99, 0.35, 0], [-0.25, -1.0, 0.12, 1], [0.12, -0.9, -0.4, 2], [0.3, -1.02, 0.7, 3]];
    mags.forEach(([x, z, a, i], n) => {
      const [c1, c2] = covers[i], top = flatStd({ map: tex(128, 160, (g, W, H) => { const R = rng(seed * 11 + i); g.fillStyle = c1; g.fillRect(0, 0, W, H); g.fillStyle = c2; g.fillRect(8, 8, W - 16, 22); g.fillStyle = "rgba(30,30,30,0.7)"; g.fillRect(14, 15, 50 + R() * 40, 7); g.fillStyle = c2; g.beginPath(); g.ellipse(W / 2, H * 0.58, 34 + R() * 8, 40, 0, 0, 6.283); g.fill(); g.fillStyle = c1; g.beginPath(); g.ellipse(W / 2, H * 0.58, 20, 26, 0, 0, 6.283); g.fill(); for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(30,30,30,0.55)"; g.fillRect(12, H - 30 + k * 8, 40 + R() * 50, 4); } }), roughness: 0.6 });
      const m = put(root, BX(0.21, 0.008, 0.28), [stdM({ color: "#e8e4d8" }), stdM({ color: "#e8e4d8" }), top, stdM({ color: "#e8e4d8" }), stdM({ color: "#e8e4d8" }), stdM({ color: "#e8e4d8" })], x, 0.4 + 0.0045 + (n === 1 ? 0.008 : 0), z); m.rotation.y = a;
    });

    // ---------------- the people
    const folks = [];
    const OUT = [
      { top: "cardigan", c: "#7b6a58", pants: "#5d554d", hair: ["hair", "#3a2a22"] },
      { top: "jacket", c: "#5a5f66", tie: "#2d3036", pants: "#4a4f57", hair: ["part", "#8a8a86"] },
      { top: "blouse", c: "#9aa7b0", pants: "#5c6577", hair: ["bob", "#5b3a28"] },
    ];
    const boardBasis = (tiltDeg) => { const a = rad(tiltDeg), yb = new V3(0, Math.sin(a), Math.cos(a)), zb = new V3(0, Math.cos(a), -Math.sin(a)), xb = new V3().crossVectors(yb, zb); return { xb, yb, zb }; };
    const addFolk = (fig, o) => {
      root.add(fig.root); const board = makeBoard(root), pencil = makePencil(root), bs = boardBasis(o.tilt);
      board.quaternion.setFromRotationMatrix(new M4().makeBasis(bs.xb, bs.yb, bs.zb)); board.position.copy(o.C);
      const pd = new V3().addScaledVector(bs.zb, 0.6).addScaledVector(bs.yb, -0.75).addScaledVector(bs.xb, 0.2).normalize();
      pencil.quaternion.setFromUnitVectors(UP, pd);
      folks.push({ fig, bs, C: o.C, pd, pencil, lab: !!o.lab, off: hash(seed * 5 + o.i) * 1.4, ph2: hash(seed * 9 + o.i * 3), lean: o.lean, amp: o.amp ?? 1 });
    };
    [-0.75, 0, 0.75].forEach((x, i) => {
      const fig = makeFigure({ ...OUT[i], sx: 0.7, sy: 0.7, seated: true, eyes: "lids", ey: 0.2, browY: 0.385, mouthY: 0.028, eyeRy: 0.14 }); fig.root.position.set(x, 0.395, -1.78);
      addFolk(fig, { C: new V3(x, 0.64, -1.45), tilt: 35, lean: 0.32, i });
    });
    const lab = makeFigure({ top: "labcoat", c: "#f2f2ec", pants: "#3a3a3e", hair: ["hair", "#9a9a96"], sx: 0.62, sy: 1.24, eyes: "open", ey: 0.24, browY: 0.4, mouthY: 0.098, eyeRy: 0.115, hairTh: 0.15, glasses: true });
    lab.root.position.set(0.55, 0.75, -2.75);
    addFolk(lab, { C: new V3(0.55, 1.6, -2.5), tilt: 72, lean: 0.25, i: 7, lab: true, amp: 0.8 });

    // ---------------- smoke lobes
    const SMK = smokeKit(), smokeG = new THREE.Group(); smokeG.userData.solid = false; root.add(smokeG);
    const lobes = [];
    const mkLobe = (kind, lead, o) => {
      const geo = SMK.geos[(o.v | 0) % 4], f = new THREE.Mesh(geo, lead ? SMK.fillLead : SMK.fill), h = new THREE.Mesh(geo, lead ? SMK.hullLead : SMK.hull);
      glow(f, 8); glow(h, 7); f.visible = h.visible = false; smokeG.add(f); smokeG.add(h);
      lobes.push({ kind, f, h, ...o }); return lobes[lobes.length - 1];
    };
    const dVent = (x, z) => Math.hypot(x - VX, z - WZ);
    for (let i = 0; i < 14; i++) {   // the plume at the vent
      const v = i / 13, hh = (q) => hash(seed * 211 + i * 7.3 + q), d = 0.18 + 0.32 * v, r = d / 2;
      const first = i < 5, x = first ? VX + (i - 2) * 0.1 + (hh(1) - 0.5) * 0.06 : VX + (hh(1) - 0.5) * (0.5 + 0.4 * v), y = first ? 2.14 + 0.24 * hh(2) + 0.02 * i : 2.3 + 0.28 * v + (hh(2) - 0.5) * 0.06;
      const rr = first ? 0.085 + 0.03 * hh(7) : r, z = first ? WZ + 0.3 - rr * (0.6 + 0.5 * hh(3)) : Math.max(WZ + 0.8 * r, WZ + 0.3 * (0.5 + 0.5 * hh(3)) - 0.12 * v + r * 0.3);
      mkLobe("plume", false, { x, y, z: Math.max(z, WZ + 0.8 * rr), r: rr, ry: rr * 0.9, v: i, vv: v, first: i < 5, turn: rad(15 + 20 * hh(4)) * (hh(5) < 0.5 ? -1 : 1), ph: hh(6) * 6.283 });
    }
    for (let j = 0; j < 10; j++) for (let k = 0; k < 6; k++) {   // the ceiling layer: a hashed lattice of 60
      const n = j * 6 + k, hh = (q) => hash(seed * 331 + n * 3.7 + q), d = 0.5 + 0.4 * hh(1), r = d / 2;
      const x = clamp(-1.8 + (k + 0.5) * 0.6 + (hh(2) - 0.5) * 0.36, -1.8 + 0.8 * r, 1.8 - 0.8 * r), z = clamp(WZ + (j + 0.5) * 0.44 + (hh(3) - 0.5) * 0.26, WZ + 0.8 * r, 2.2 - 0.8 * r);
      const dv = dVent(x, z), sI = Math.min(Math.pow(Math.max(dv - 0.4, 0) / 4.6, 1.25), 0.75);
      mkLobe("layer", false, { x, z, r, v: n + 3, sI, dv, turn: rad(15 + 20 * hh(4)) * (hh(5) < 0.5 ? -1 : 1), ph: hh(6) * 6.283 });
    }
    for (let j = 0; j < 7; j++) {   // the round lobes on the leading edge
      const hh = (q) => hash(seed * 457 + j * 5.1 + q), r = (0.4 + 0.3 * hh(1)) / 2;
      mkLobe("edge", true, { r, ang: ((j + 0.5) / 7) * Math.PI, v: j + 1, turn: rad(15 + 20 * hh(4)) * (hh(5) < 0.5 ? -1 : 1), ph: hh(6) * 6.283 });
    }

    // ---------------- apply
    const g4 = new M4(), inv = new M4(), T = new V3(), tip = new V3(), tgt = new V3();
    const setLobe = (l, x, y, z, rx, ry, rz, t, on) => {
      l.f.visible = l.h.visible = on; if (!on) return;
      const br = 1 + 0.06 * Math.sin(t * 1.9 + l.ph), ry2 = (l.turn ?? 0) * t + l.ph;
      l.f.position.set(x, y, z); l.h.position.set(x, y, z); l.f.rotation.y = l.h.rotation.y = ry2;
      l.f.scale.set(rx * br, ry * br, rz * br); l.h.scale.set(rx * br + 0.012, ry * br + 0.012, rz * br + 0.012);
    };
    return {
      grip: 0,
      apply(ps, t) {
        const smoke = clamp(ps.smoke ?? S.smoke ?? 0), watch = clamp(ps.watch ?? S.watch ?? 0), tt = t ?? 0;
        // clock, reels
        hS.rotation.z = -rad(6 * (Math.floor(tt) + ((seed * 7) % 60)));
        reels[0].rotation.z = -tt * 2.4; reels[1].rotation.z = -tt * 3.1;
        // the people: lean, pencil, hands
        for (const f of folks) {
          const fig = f.fig, w = f.lab ? 1 - sm(watch / 0.35) : 1;
          fig.torso.rotation.x = f.lean - (f.lab ? rad(6) * sm(watch) : 0) + 0.012 * Math.sin(tt * 2.5 * 6.283 + f.ph2 * 6.283) * w;
          if (f.lab) {
            const e = sm(watch), ey = lerp(0.24 - 0.045, 0.24 + 0.004, e), th = lerp(0.0, -0.025, e);
            for (const p of fig.pupils) { const [pp, nn] = onBody(p.userData.s * 0.4 + th * p.userData.s * -1, phOf(ey)); p.position.copy(pp).addScaledVector(nn, 0.0); p.quaternion.setFromUnitVectors(ZAX, nn); }
          }
        }
        G.updateMatrixWorld(true);
        for (const f of folks) {
          const fig = f.fig, w = f.lab ? 1 - sm(watch / 0.35) : 1, fr = (tt + f.off) / 1.4, row = Math.floor(fr), fc = fr - row;
          const k = ((row % 9) + 9) % 9 + w * sm((fc - 0.8) / 0.2), prog = fc < 0.8 ? fc / 0.8 : 1 - sm((fc - 0.8) / 0.2);
          const tri = Math.abs((((2.5 * tt + f.ph2) % 1) + 1) % 1 * 2 - 1), u = -0.07 + 0.12 * prog + (tri - 0.5) * 0.012 * w * f.amp, v = 0.09 - k * 0.022;
          tip.copy(f.C).addScaledVector(f.bs.xb, u).addScaledVector(f.bs.yb, v).addScaledVector(f.bs.zb, 0.005);
          f.pencil.position.copy(tip);
          inv.copy(fig.bodyG.matrixWorld).invert(); g4.copy(G.matrixWorld);
          tgt.copy(tip).addScaledVector(f.pd, 0.062).applyMatrix4(g4).applyMatrix4(inv); solveArm(fig.arms[0], tgt);
          tgt.copy(f.C).addScaledVector(f.bs.xb, -0.11).addScaledVector(f.bs.yb, -0.1).addScaledVector(f.bs.zb, 0.02).applyMatrix4(g4).applyMatrix4(inv); solveArm(fig.arms[1], tgt);
        }
        // smoke
        const thick = 0.12 + 0.33 * smoke, R = 0.4 + 4.6 * Math.pow(smoke, 0.8), puff = sm(smoke / 0.1), on = smoke > 0.002;
        for (const l of lobes) {
          if (l.kind === "plume") {
            const g = l.first ? puff : sm((smoke - (0.1 + 0.2 * l.vv)) / 0.18), push = l.first ? lerp(0.3, 0.0, 0) : 1;
            const gg = g * (smoke > 0.002 ? 1 : 0); void push;
            setLobe(l, l.x, l.y, l.z, l.r * gg, l.ry * gg, l.r * gg, tt, gg > 0.01);
          } else if (l.kind === "layer") {
            const s0 = Math.max(l.sI, 0.1), g = sm((smoke - s0) / 0.25) * (smoke > 0.1 ? 1 : 0), th = thick + 0.15 * sm(smoke) * Math.max(0, 1 - l.dv / 0.5);
            setLobe(l, l.x, 2.6 - 0.38 * th, l.z, l.r * g, 0.62 * th * g, l.r * g, tt, g > 0.01);
          } else {
            const cx = clamp(VX + Math.cos(l.ang) * (R - 0.12), -1.8 + 0.8 * l.r, 1.8 - 0.8 * l.r), cz = clamp(WZ + Math.sin(l.ang) * (R - 0.12), WZ + 0.8 * l.r, 2.2 - 0.8 * l.r);
            const g = sm((smoke - 0.1) / 0.25) * (1 - sm((smoke - 0.85) / 0.15)), th = thick;
            setLobe(l, cx, 2.6 - 0.38 * th, cz, l.r * g, 0.62 * th * g, l.r * g, tt, g > 0.01 && on);
          }
        }
        bar.material.opacity = 0.85 * sm((smoke - 0.3) / 0.25); bar.visible = bar.material.opacity > 0.01; bar.position.y = 2.6 - thick - 0.08;
      },
    };
  },
};
export const ZWAIT_KINDS = ZWAIT;
