import * as THREE from "three";
import { clamp } from "./util.js";

// Rival duel 01 "Armrest war": the six small fx and plant props (DESIGN.md sections 5-9, 26 Nov 2026). Metres, y up, +z = the plane's
// nose, a prop faces +z at rot 0. No letters, digits or icons anywhere. Every look is built from plain shapes; nothing tweens a
// material's opacity or colour: parts are shown, hidden, swapped or scaled, and every alpha is a fixed number. All state keys are
// read ps.<key> ?? spec.<key> ?? default and tween with a "prop" action; their defaults are ARMREST_FX_STATE (registered in
// KIT_STATE in props3d.js, or the first tween jumps). Pure functions of the spec, the state and the clip time t (story time).
// Everything but the hat is userData.steam (see-through for the checks), noOutline and without a shadow; nothing is solid.
//
// ===== pilothat  (panel 08, plant 1) a captain's cap lying in an open red bag. Never worn, never held, no keys. Not solid.
//   ORIGIN: the centre of the bag's open mouth = a stock `duffel` (color "#a8352b", trim "#c9a25a") origin + (0, 0.125, 0); +x along the zip.
//   Size: the hat is 0.30 across (band r 0.15, crown flaring to r 0.175), 0.105 tall unposed; posed it sits tipped FORWARD 25 degrees, rolled
//         10, band-bottom centre at (0.03, -0.03, 0.02), its highest point (the back rim of the crown) 0.12 above the mouth (world y 0.375
//         on the staged bag at y 0.13 + hat y 0.255 = 0.255 + 0.12). The peak points +z, dips toward the camera.
//   Parts: an almond mouth 0.34 (x) x 0.15 (z) that follows the bag's round top (0.002 above the skin: the capsule's top is 0.13, the
//         origin 0.125), dark navy inside, two fold lumps, two zip lips bowed 0.02 up; hat: navy band 0.045 tall, soft white crown, GOLD cord
//         across the front, GOLD wings badge 0.10 x 0.035 bent round the band, glossy black peak 0.085 long, 14 degrees down.
//   spec  lip "#c9a25a" (the zip lips), roll 10 / pitch 25 / at [0.03, -0.03, 0.02] (the pose, degrees and metres; no need to set them).
//
// ===== sleepmask  (panel 11) a plain black sleeping mask, WORN: spec.wear = Wedge's actor id, x 0, y 0, z 0 (his body frame). No keys.
//   Fitted to his real skin (potato.js bodyPoint with his measured lumps, WEDGE_FIT) and squashes with him (wearSquash). Every part is
//   steam: it hides his eyes on purpose and no face check may fail on it.
//   Pad (MEASURED on Wedge, castLook "sheet": his eyes x +-0.239 y 0.538..0.826 open, brows to 0.92 (kind) or 0.87 (serene)):
//         0.524 wide x 0.349 tall, x +-0.262, y 0.536..0.885 (centre 0.71), corner r 0.07, a nose notch 0.05 wide x 0.035 deep at the
//         bottom middle (his open mouth top is 0.59: the notch top is 0.571), 0.016 thick with pillowed edges, its inner face `gap`
//         0.036 off the skin (measured: his eyes and brows stand out at most 0.031, bench/measure-wedge.mjs); one soft sheen 0.012 wide along the top edge. Black #1b1b20, sheen #3a3a44.
//   Strap: black, 0.022 wide, 0.009 off the skin (his cheek blush stands 0.006 out), from the pad's two ends round the back on y 0.71.
//   Nothing is above y 0.885 (the shades' lower rim is at about 1.07).
//   spec  color "#1b1b20", sheen "#3a3a44", gap 0.036, thick 0.016, x0 0 / yBot 0.536 / yTop 0.885 / halfW 0.262 (the outline),
//         strapY 0.71, fit (WEDGE_FIT or { rx, rz, cy, ry, taper, square, lumps }).
//   Use: scale 0 -> 1 in 2 frames behind his gloves; eyes "closed" under it, mouth open.
//
// ===== wingspin  (panels 11, 14; plant 2) a gold wings pin on Wedge's chest, WORN: spec.wear = his actor id, x 0, y 0, z 0. Steam.
//   Where (MEASURED): on the red shell on the viewer's right of the zip (+x), body frame (0.17, 0.355, 0.2973 + 0.003), turned to the
//         shell's slope (yaw 14.7, pitch 21) and 6 degrees askew; the cream collar's edge is 0.05 above it at that x and the pocket
//         flap 0.03 below its right wing tip. (The design's est. (0.20, 0.41) lands on the collar's edge of this costume.)
//   Size: 0.10 wide x 0.034 tall x 0.004 thick: a round boss r 0.014, two wings 0.036 long, three feather rows each (stepping down,
//         each row's end a scallop), GOLD #e8b93a with shade #9a6a1e in the grooves, a light band #fff0b8 on each wing's top edge.
//   key   show 0..1 (default 1): the pin's scale about its centre; 0 = not there.
//   spec  at [x, y, z] (the spot above), yaw 14.7, pitch 21, askew 6 (degrees).
//   The glint is fx `glint` at the pin's world point, once, in round 4 (not built here).
//
// ===== ejecthatch  (panels 14, 15) the hatch in the bin's underside over seat C: a painted hole, no cut in the hall.
//   ORIGIN: the centre of the opening, on the bin's underside, looking down. Place at (-1.08, 2.35, 0.05). Local y below is down.
//   Opening 0.90 x 0.90, corners r 0.06. Parts: seam + 4 latches (always drawn, y -0.002); sky card (y -0.006, #6fb4f2 at the +z edge to
//   #cfe9ff at the -z edge, two white clouds crossing +z to -z in 0.5 s each, 0.25 s apart, looping on t; they grow and shrink by scale at
//   the ends so they never pass the opening); frame 0.05 wide #9aa0a8 with 12 rivets (y -0.008); lid 0.90 x 0.90 x 0.02 #dfe4ea (y -0.012);
//   light shaft (4-sided frustum 0.90 -> 1.15 square over 2.345, its floor end 0.25 toward -x, unlit #fff6d8 alpha 0.12) with 4 rays
//   (0.10 x 0.01, fanned 4 degrees, alpha 0.14); floor patch 1.15 square at (-0.25, -2.342, 0), #fff3c4 alpha 0.3; two seat rails
//   (0.06 x 0.02 x 0.62 at x -0.25 and +0.35, y -2.34, z -0.05) with 5 bolt holes each.
//   key   hatch 0..1 (default 0): 0 = seam, latches and lid only. Over 0.05 the sky card and the frame show. 0 -> 0.9 the lid stays in its
//         plane and shrinks (scale 1 -> 0.06), turning 220 degrees about y and drifting 0.30 toward -z; hidden from 0.9. 0.3 -> 1 the shaft
//         and rays grow down from the opening. From 0.95 the floor patch and the rails show (a step).
//
// ===== seatrocket  (panels 14, 15) the thruster under seat C and its flame. ORIGIN: seat C's origin (the director gives it the seat's own
//   position tweens). Unlit, steam. Thruster (always there, under the floor until the seat rises): a block 0.50 x 0.08 x 0.30 at y -0.08..0
//   and a bell nozzle r 0.07 -> 0.10 from y -0.08 to -0.20, #55595f.
//   key   flame 0..1 (default 0; scale only, hidden at 0): ONE flame down from the nozzle: base r 0.10 at y -0.20, tip at y -0.20 - 0.60 x flame
//         (and its width 0.5 + 0.5 x flame); three nested shells (rim #f0621e, mid #ffb02a at 0.7, core #fff6c0 at 0.4); the edge is 7 tongues
//         with hashed lengths (25 % spread); two silhouettes swapped at 15 Hz on t. The white smoke column is fx `poof` (not built here).
//
// ===== cockpitcard  (panel 13, plant 3) one flat unlit painted card 1.0 x 2.0, ORIGIN the middle of its bottom edge, the picture on +z. Place at
//   (0, 0, 10.56), rot 180: it fills the hall's front doorway and hides the hall's daylight plane. No keys. Picture (no letters or digits):
//   the top 45 % a windscreen of two sky panes #8fc8ff, one cloud each, a dark centre post; under it a dark panel #3a3f4a with three glowing
//   screens (two #9fe0b0, one #ffc46a); a centre pedestal with two throttle levers; two EMPTY seat backs seen from behind (#6f757d, 0.30 wide,
//   pale headrests #c9ced6, their tops at y 1.25 against the windscreen), one on each side.

export const ARMREST_FX_STATE = {
  wingspin: { show: 1 },
  ejecthatch: { hatch: 0 },
  seatrocket: { flame: 0 },
};
export const ARMREST_FX_GRIPS = {};   // nothing here is held

// ---------------------------------------------------------------------------------------------------- helpers
const rad = (d) => (d * Math.PI) / 180;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3;
const stdM = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });
const basicM = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
// a mesh nobody collides with
function put(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = false; o.userData.solid = false; parent.add(o); return o;
}
// see-through for the checks, no outline, no shadow, drawn after the solid things
const glow = (o, order = 4) => { o.traverse((c) => { c.frustumCulled = false; c.renderOrder = order; c.castShadow = false; c.receiveShadow = false; c.userData.steam = true; c.userData.solid = false; if (c.material) c.material.userData.noOutline = true; }); return o; };
const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
// a rounded rectangle centred on the origin
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// a flat shape whose uv spans its bounding box
function shapeGeo(shape, seg = 10) {
  const g = new THREE.ShapeGeometry(shape, seg); g.computeBoundingBox();
  const b = g.boundingBox, uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  return g;
}
// a parametric surface fn(u, v) -> Vector3 on a (nu+1) x (nv+1) grid
function surfGrid(fn, nu, nv) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a horizontal card (facing DOWN, shape x -> x, shape y -> z), as seen from the cabin floor looking up
const downCard = (geo, m, parent, y) => { const o = put(parent, geo, m, 0, y, 0); o.rotation.x = Math.PI / 2; return o; };

// ---------------------------------------------------------------------------------------------------- worn: the wearer's squash
// (props-heist.js wearSquash, copied: it is not exported) A worn prop's `whole` follows the wearer's squash every frame. The wearer is the
// potato standing where this prop was put; found in the posed scene, nothing from a clock. Not found: scale 1.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function potatoRoots(scene) {
  const out = [];
  scene.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) out.push(o); });
  return out;
}
function wearSquash(P) {
  const whole = P.whole, sup = whole.updateMatrixWorld;
  let roots = [];
  const find = () => {
    if (!roots.length) { let s = P.root; while (s.parent) s = s.parent; roots = potatoRoots(s); }
    P.root.getWorldPosition(_wp);
    for (const r of roots) { r.getWorldPosition(_bp); if (_bp.distanceToSquared(_wp) < 4e-6) return r; }
    return null;
  };
  whole.updateMatrixWorld = function (force) {
    const r = P.root.parent ? find() : null;
    if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1);
    sup.call(this, force);
  };
}

// ---------------------------------------------------------------------------------------------------- Wedge's skin (potato.js bodyPoint)
// body.height 0.98, width 0.88, depth 0.67, lump 0.03, seed 53, taper -0.26, square 2.6, legs 0.14: measured with potato.js's own generator
// (bench/measure-wedge.mjs). lumps: { d: unit direction, a: height, k: tightness }.
export const WEDGE_FIT = { rx: 0.44, rz: 0.335, cy: 0.63, ry: 0.49, taper: -0.26, square: 2.6, lumps: [
  { d: [-0.4585, -0.3883, 0.7994], a: -0.00986, k: 5.49 }, { d: [-0.5828, 0.8065, 0.1001], a: 0.00163, k: 6.526 }, { d: [0.8122, -0.4669, 0.3497], a: -0.0128, k: 4.396 },
  { d: [0.2496, 0.8003, -0.5451], a: 0.00102, k: 7.415 }, { d: [-0.5635, -0.4392, -0.6997], a: -0.02699, k: 7.783 }, { d: [-0.2284, -0.6904, 0.6864], a: 0.02287, k: 6.456 },
  { d: [0.6801, 0.6113, -0.4046], a: -0.00926, k: 3.911 }, { d: [-0.9752, -0.1964, -0.1023], a: 0.02474, k: 3.758 }, { d: [0.713, 0.5269, 0.4625], a: -0.01457, k: 7.689 }] };
// the skin at polar angle th (0 = front, + toward +x) and elevation el
function skinPt(F, th, el) {
  const dx = Math.sin(th) * Math.cos(el), dy = Math.sin(el), dz = Math.cos(th) * Math.cos(el);
  let r = 1; for (const L of F.lumps || []) r += L.a * Math.exp(-L.k * (1 - (dx * L.d[0] + dy * L.d[1] + dz * L.d[2])));
  const tp = 1 - (F.taper ?? 0.07) * dy, q = F.square;
  if (q) r /= Math.pow(Math.abs(dx) ** q + Math.abs(dy) ** q + Math.abs(dz) ** q, 1 / q);
  return new V3(dx * F.rx * tp * r, F.cy + dy * F.ry * r, dz * F.rz * tp * r);
}
// the skin's outward normal at (th, el)
export function skinN(F, th, el) {
  const e = 0.003;
  return skinPt(F, th + e, el).sub(skinPt(F, th - e, el)).cross(skinPt(F, th, el + e).sub(skinPt(F, th, el - e))).normalize();
}
// the skin point at body-frame (x, y) on the front (z > 0), plus `out` along its normal: a fixed number of damped steps (no loop on a tolerance)
export function skinXY(F, x, y, out = 0) {
  let el = Math.asin(clamp((y - F.cy) / F.ry, -0.98, 0.98)), th = Math.asin(clamp(x / (F.rx * Math.cos(el)), -0.98, 0.98));
  for (let i = 0; i < 18; i++) {
    const p = skinPt(F, th, el);
    th += ((x - p.x) / (F.rx * Math.max(0.2, Math.cos(el) * Math.cos(th)))) * 0.8; el += ((y - p.y) / (F.ry * Math.max(0.2, Math.cos(el)))) * 0.8;
  }
  const p = skinPt(F, th, el);
  return out ? p.addScaledVector(skinN(F, th, el), out) : p;
}
// the elevation at azimuth th where the skin is at height y (bisection)
function elAtY(F, th, y) { let a = -1.2, b = 1.5; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (skinPt(F, th, m).y < y) a = m; else b = m; } return (a + b) / 2; }

// ---------------------------------------------------------------------------------------------------- the wings (pin and hat badge)
const GOLD = "#e8b93a", GOLD_S = "#9a6a1e", GOLD_L = "#fff0b8";
// one wing row: a bar from x0 to x0 + len, height h, the outer end a scallop (half round), thickness d
function rowGeo(len, h, d) {
  const s = new THREE.Shape(), r = h / 2;
  s.moveTo(0, -r); s.lineTo(len - r, -r); s.absarc(len - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0, r); s.lineTo(0, -r);
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 8 });
}
// the wings badge, 0.10 x 0.034 x 0.004, origin the boss centre, the back plane at z -0.002, +z the front
function wingsGroup(shiny = 0.35) {
  const DS = { side: THREE.DoubleSide }, g = new THREE.Group(), gold = stdM(GOLD, { roughness: shiny, ...DS }), shade = stdM(GOLD_S, { roughness: 0.6, ...DS }), light = stdM(GOLD_L, { roughness: 0.4, ...DS });
  const boss = put(g, new THREE.CylinderGeometry(0.014, 0.014, 0.004, 20), gold); boss.rotation.x = Math.PI / 2;
  put(g, new THREE.CylinderGeometry(0.0075, 0.0075, 0.0012, 16), shade, 0, 0, 0.0024).rotation.x = Math.PI / 2;   // the boss's inner ring (a groove)
  // [y of the row's inner end, length, height, tilt up in radians]: three rows, each shorter and lower
  const rows = [[0.0085, 0.036, 0.0092, 0.08], [-0.0005, 0.031, 0.0092, 0.0], [-0.0100, 0.024, 0.0092, -0.06]];
  for (const sd of [-1, 1]) {
    const w = new THREE.Group(); w.scale.x = sd; g.add(w);
    // the groove colour behind: a wider shade bar under each row
    rows.forEach(([y, len, h, tl], k) => {
      const piv = new THREE.Group(); piv.position.set(0.012, y, 0); piv.rotation.z = tl; w.add(piv);
      const back = put(piv, rowGeo(len + 0.002, h + 0.0022, 0.002), shade, 0, 0, -0.002);
      const row = put(piv, rowGeo(len, h, 0.002), gold, 0.0005, 0, 0);
      if (k === 0) put(piv, new THREE.BoxGeometry(len * 0.72, 0.0012, 0.0006), light, 0.0005 + len * 0.4, h / 2 - 0.0014, 0.0023);   // one light band on the wing's top edge
    });
  }
  return g;
}
// the pivots carry the rows' tilt: bake every mesh's matrix into its geometry (so a bend can work on plain vertices)
function flattenInto(group) {
  group.updateMatrixWorld(true);
  const meshes = []; group.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const out = new THREE.Group(), inv = group.matrixWorld.clone().invert();
  for (const m of meshes) { const g = m.geometry.clone().applyMatrix4(inv.clone().multiply(m.matrixWorld)); const o = new THREE.Mesh(g, m.material); o.castShadow = false; o.userData.solid = false; out.add(o); }
  return out;
}

// ---------------------------------------------------------------------------------------------------- kinds
export const ARMREST_FX_KINDS = {
  // ================================================================================================ pilothat
  pilothat(P) {
    const S = P.spec, W = P.whole;
    const bag = (x, z) => {   // the duffel's skin height at (x, z) above its origin: a capsule round x, 0.13 up, 0.1196 deep (props-plane.js)
      const ax = Math.abs(x), f = ax <= 0.13 ? 1 : Math.sqrt(Math.max(0, 1 - ((ax - 0.13) / 0.13) ** 2)), rz = 0.1196 * f;
      return 0.13 * f * Math.sqrt(Math.max(0, 1 - (z / Math.max(0.001, rz)) ** 2));
    };
    const Y0 = 0.125, HX = 0.17, HZ = 0.075;
    // the almond mouth: |x| <= 0.17, half depth 0.075 * sqrt(1 - (x/0.17)^2), on the bag's round top
    const mouthY = (x, z) => bag(x, z) - Y0 + 0.002;
    const mouthGrid = (kz, dy = 0) => surfGrid((u, v) => { const x = (u * 2 - 1) * HX, hz = HZ * Math.sqrt(Math.max(0, 1 - (x / HX) ** 2)) * kz, z = (v * 2 - 1) * hz; return new V3(x, mouthY(x, z) + dy, z); }, 28, 8);
    const dark = stdM("#1d2238", { roughness: 0.95, side: THREE.DoubleSide });
    put(W, mouthGrid(1, 0), dark);
    // two fold lumps (folded clothes)
    const lump = stdM("#2a3352", { roughness: 0.95 });
    for (const [x, z, sx, sz] of [[-0.07, -0.01, 0.07, 0.04], [0.06, 0.02, 0.06, 0.035]]) { const l = put(W, new THREE.SphereGeometry(1, 14, 9), lump, x, mouthY(x, z) + 0.002, z); l.scale.set(sx, 0.014, sz); }
    // zip lips: two tubes along the almond's edges, bowed 0.02 up
    const lipM = stdM(S.lip || "#c9a25a", { roughness: 0.6 });
    for (const sd of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const x = (i / 24 * 2 - 1) * HX, z = sd * HZ * Math.sqrt(Math.max(0, 1 - (x / HX) ** 2)), bow = 0.02 * Math.cos((x / HX) * Math.PI / 2); pts.push(new V3(x, mouthY(x, z) + 0.006 + bow, z + sd * 0.003)); }
      put(W, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 6, false), lipM);
    }
    // the hat: built upright on its band bottom centre, then posed
    const hat = new THREE.Group(), navy = stdM("#1c2748", { roughness: 0.75 }), white = stdM("#f4f4f0", { roughness: 0.85 }), gold = stdM(GOLD, { roughness: 0.35 }), black = stdM("#15151a", { roughness: 0.14, metalness: 0.2 });
    const band = put(hat, new THREE.CylinderGeometry(0.15, 0.15, 0.045, 40, 1, false), navy, 0, 0.0225, 0);
    // the soft crown: a lathe, flaring from r 0.15 at the band's top to r 0.175 at 0.085, domed 0.02
    const prof = [[0.15, 0.044], [0.158, 0.058], [0.168, 0.072], [0.175, 0.085], [0.172, 0.093], [0.152, 0.1], [0.11, 0.104], [0.06, 0.1055], [0.0, 0.1065]].map(([r, y]) => new THREE.Vector2(r, y));
    put(hat, new THREE.LatheGeometry(prof, 44), white).material.side = THREE.DoubleSide;
    put(hat, new THREE.TorusGeometry(0.151, 0.0026, 5, 44), stdM("#d9d9d2", { roughness: 0.9 })).rotation.x = Math.PI / 2;   // the piping where the crown meets the band
    hat.children[hat.children.length - 1].position.y = 0.0455;
    // the gold cord across the band's front, just over the peak: an arc of the band's top edge
    const cord = []; for (let i = 0; i <= 20; i++) { const a = rad(-62 + (124 * i) / 20); cord.push(new V3(Math.sin(a) * 0.1545, 0.0395 - 0.0012 * Math.cos(a * 3), Math.cos(a) * 0.1545)); }
    put(hat, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 30, 0.006, 6, false), gold);
    for (const sd of [-1, 1]) put(hat, new THREE.SphereGeometry(0.0085, 10, 8), gold, sd * Math.sin(rad(62)) * 0.1545, 0.0395 - 0.0012 * Math.cos(rad(186)), Math.cos(rad(62)) * 0.1545);   // the two cord buttons
    // the wings badge on the band's front, bent round it
    const wg = flattenInto(wingsGroup(0.4)); wg.position.set(0, 0.0235, 0.1545); wg.scale.setScalar(1.0); hat.add(wg);
    wg.traverse((o) => { if (o.isMesh) { const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = x / 0.1545; p.setXYZ(i, (0.1545 + z) * Math.sin(a), p.getY(i), (0.1545 + z) * Math.cos(a) - 0.1545 + 0.0); } o.geometry.computeVertexNormals(); } });
    // the glossy black peak: 0.085 forward from the band's bottom front, 14 degrees down, 0.006 thick
    const pk = new THREE.Shape(); pk.moveTo(-0.095, 0); pk.lineTo(0.095, 0); pk.quadraticCurveTo(0.088, 0.062, 0.0, 0.085); pk.quadraticCurveTo(-0.088, 0.062, -0.095, 0);
    const peak = put(hat, new THREE.ExtrudeGeometry(pk, { depth: 0.006, bevelEnabled: false }), black); peak.rotation.set(Math.PI / 2 + rad(14), 0, 0); peak.position.set(0, 0.004, 0.148);
    // pose (as panel 08): band-bottom centre at (0.03, -0.03, 0.02), pitched FORWARD 25 degrees (about x: the top turns toward +z), rolled 10
    const at = S.at || [0.03, -0.03, 0.02];
    hat.rotation.order = "YXZ"; hat.rotation.set(rad(S.pitch ?? 25), 0, rad(S.roll ?? 10)); hat.position.set(at[0], at[1], at[2]);
    W.add(hat);
    hat.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.userData.solid = false; } });
    return { grip: 0 };
  },

  // ================================================================================================ sleepmask
  sleepmask(P) {
    const S = P.spec, W = P.whole, F = { ...WEDGE_FIT, ...(S.fit || {}) };
    const GAP = S.gap ?? 0.036, TH = S.thick ?? 0.016, HW = S.halfW ?? 0.262, YB = S.yBot ?? 0.536, YT = S.yTop ?? 0.885, X0 = S.x0 ?? 0, RC = 0.07, NW = 0.05, ND = 0.035, SY = S.strapY ?? 0.71;
    const m = stdM(S.color || "#1b1b20", { roughness: 0.85, side: THREE.DoubleSide }), sheen = stdM(S.sheen || "#3a3a44", { roughness: 0.5, side: THREE.DoubleSide });
    // the outline: bottom and top edge heights at x (rounded corners, a nose notch at the bottom middle)
    const rise = (ax) => { const q = (ax - (HW - RC)) / RC; return q > 0 ? RC * (1 - Math.sqrt(Math.max(0, 1 - q * q))) : 0; };
    const yb = (x) => YB + rise(Math.abs(x)) + (Math.abs(x) < NW / 2 ? ND * Math.sqrt(1 - (x / (NW / 2)) ** 2) : 0);
    const yt = (x) => YT - rise(Math.abs(x)) * 0.8;
    const edgeD = (x, y) => Math.max(0, Math.min(y - yb(x), yt(x) - y, HW - Math.abs(x)));
    const NU = 64, NV = 20;
    const xOf = (u) => HW * Math.sin((u - 0.5) * Math.PI);
    const point = (u, v, outer) => {
      const x = xOf(u), b = yb(x), t = yt(x), y = b + (t - b) * v, d = edgeD(x, y), th = outer ? TH * Math.sqrt(clamp(d / 0.014)) : 0;
      return skinXY(F, X0 + x, y, GAP + th);
    };
    glow(put(W, surfGrid((u, v) => point(u, v, false), NU, NV), m));
    glow(put(W, surfGrid((u, v) => point(u, v, true), NU, NV), m));
    // the sheen: a strip 0.012 wide a little inside the top edge, on the outer face
    glow(put(W, surfGrid((u, v) => { const x = xOf(0.12 + 0.76 * u), y = yt(x) - 0.006 - 0.012 * v; return skinXY(F, X0 + x, y, GAP + TH * Math.sqrt(clamp(edgeD(x, y) / 0.014)) + 0.0009); }, 30, 2), sheen));
    // the strap: 0.022 wide, from the pad's ends round the back on the eye line, 0.009 off the skin (the cheek blush stands 0.006 out)
    const th1 = Math.asin(clamp((HW - 0.03) / (F.rx * 0.97), 0, 0.99)), NS = 90, SW = 0.011;
    const strapAt = (i, side) => {
      const u = i / NS, th = th1 + (2 * Math.PI - 2 * th1) * u, k = sm(0, 0.12, u) * (1 - sm(0.88, 1, u)), out = GAP + 0.004 + (0.009 - GAP - 0.004) * k;
      const y = SY + side * SW, el = elAtY(F, th, y), p = skinPt(F, th, el);
      return p.addScaledVector(skinN(F, th, el), out);
    };
    glow(put(W, surfGrid((u, v) => strapAt(Math.round(u * NS), v * 2 - 1), NS, 1), m));
    if (S.wear) wearSquash(P);
    return { grip: 0 };
  },

  // ================================================================================================ wingspin
  wingspin(P) {
    const S = P.spec, W = P.whole;
    const at = S.at || [0.17, 0.355, 0.3003];
    const pin = new THREE.Group(); pin.position.set(at[0], at[1], at[2]);
    pin.rotation.order = "YXZ"; pin.rotation.set(rad(S.pitch ?? 21), rad(S.yaw ?? 14.7), rad(S.askew ?? 6));
    const body = wingsGroup(0.35); pin.add(body); W.add(pin); glow(pin);
    if (S.wear) wearSquash(P);
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.show ?? S.show ?? 1); pin.visible = k > 0.002; body.scale.setScalar(Math.max(0.0001, k)); },
    };
  },

  // ================================================================================================ ejecthatch
  ejecthatch(P) {
    const W = P.whole, HALF = 0.45, DEPTH = 2.345, SHIFT = -0.25;
    const root = new THREE.Group(); W.add(root);
    // seam (always) + latches
    const seamShape = rrShape(0.916, 0.916, 0.066); seamShape.holes.push(new THREE.Path(rrShape(0.9, 0.9, 0.06).getPoints(10).reverse()));
    glow(downCard(new THREE.ShapeGeometry(seamShape, 10), basicM("#8e9399", { side: THREE.DoubleSide }), root, -0.002), 4);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) glow(put(root, new THREE.BoxGeometry(0.05, 0.006, 0.02), stdM("#8e9399", { roughness: 0.5 }), sx * 0.37, -0.005, sz * 0.425), 4);
    // the hatch's own parts (sky, frame): shown over hatch 0.05
    const open = new THREE.Group(); root.add(open);
    const skyTex = canvasTex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#6fb4f2"); gr.addColorStop(1, "#cfe9ff"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });   // canvas top = +z edge
    glow(downCard(shapeGeo(rrShape(0.9, 0.9, 0.06)), basicM("#ffffff", { map: skyTex, side: THREE.DoubleSide }), open, -0.006), 4);
    const clouds = [0, 1].map((k) => {
      const c = new THREE.Group(), wm = basicM("#ffffff", { side: THREE.DoubleSide });
      for (const [x, z, rx, rz] of [[0, 0, 0.17, 0.07], [-0.11, 0.015, 0.1, 0.055], [0.12, -0.01, 0.1, 0.05], [0.02, 0.03, 0.09, 0.06]]) { const d = put(c, new THREE.CircleGeometry(1, 16), wm, x, 0, z); d.rotation.x = Math.PI / 2; d.scale.set(rx, rz, 1); }
      c.position.y = -0.0066; c.position.x = k ? 0.14 : -0.12; open.add(c); glow(c, 5); return c;
    });
    const frameShape = rrShape(1.0, 1.0, 0.09); frameShape.holes.push(new THREE.Path(rrShape(0.9, 0.9, 0.06).getPoints(10).reverse()));
    glow(downCard(new THREE.ShapeGeometry(frameShape, 10), basicM("#9aa0a8", { side: THREE.DoubleSide }), open, -0.008), 4);
    const rivM = basicM("#6f757d", { side: THREE.DoubleSide });
    const rv = []; for (const t of [-0.3, 0, 0.3]) { rv.push([t, 0.475], [t, -0.475], [0.475, t], [-0.475, t]); }
    for (const [x, z] of rv) { const d = put(open, new THREE.CircleGeometry(0.008, 10), rivM, x, -0.0085, z); d.rotation.x = Math.PI / 2; glow(d, 5); }
    // the lid: a 0.90 square panel 0.02 thick, hinged on its own centre so it can shrink, turn and drift
    const lidPivot = new THREE.Group(); root.add(lidPivot);
    const lid = put(lidPivot, new THREE.BoxGeometry(0.9, 0.02, 0.9), stdM("#dfe4ea", { roughness: 0.6 }), 0, -0.012, 0); glow(lid, 3);
    // the light: a frustum, 4 rays
    const dayM = basicM("#fff6d8", { transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
    const shaftG = new THREE.BufferGeometry(); shaftG.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
    const shaft = put(root, shaftG, dayM); glow(shaft, 6);
    const rayM = basicM("#fff6d8", { transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
    const rays = [0, 1, 2, 3].map((k) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(4 * 3), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return glow(put(root, g, rayM), 7); });
    const floorY = -2.342;
    const patch = glow(put(root, new THREE.PlaneGeometry(1.15, 1.15), basicM("#fff3c4", { transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }), -0.25, floorY, 0), 3); patch.rotation.x = -Math.PI / 2;
    const rails = new THREE.Group(); root.add(rails);
    for (const x of [-0.25, 0.35]) {
      glow(put(rails, new THREE.BoxGeometry(0.06, 0.02, 0.62), stdM("#9aa0a8", { roughness: 0.5 }), x, -2.34, -0.05), 3);
      for (let i = 0; i < 5; i++) { const b = put(rails, new THREE.CircleGeometry(0.008, 10), basicM("#3a3d42", { side: THREE.DoubleSide }), x, -2.3295, -0.05 - 0.25 + i * 0.125); b.rotation.x = -Math.PI / 2; glow(b, 4); }
    }
    // the frustum's vertices at a depth d (0..DEPTH): square half size 0.45 -> 0.575, centre x shifting toward -x
    const sqAt = (d) => { const f = d / DEPTH, h = HALF + (0.575 - HALF) * f, cx = SHIFT * f; return [[cx - h, -d, -h], [cx + h, -d, -h], [cx + h, -d, h], [cx - h, -d, h]]; };
    return {
      grip: 0,
      apply(ps, t) {
        const h = clamp(ps.hatch ?? 0), tt = t ?? 0;
        open.visible = h > 0.05;
        // clouds: +z -> -z in 0.5 s each, 0.25 s apart, looping on t; they grow in and shrink out so they stay inside the opening
        clouds.forEach((c, k) => { const u = (((tt - 0.25 * k) / 0.5) % 1 + 1) % 1, s = sm(0, 0.18, u) * (1 - sm(0.82, 1, u)); c.position.z = 0.33 - 0.66 * u; c.scale.setScalar(Math.max(0.0001, s)); c.visible = s > 0.01; });
        // the lid: stays in its plane, shrinks 1 -> 0.06, turns 220 degrees about y, drifts 0.30 toward -z; hidden from 0.9
        const k = clamp(h / 0.9);
        lidPivot.visible = h < 0.9; lidPivot.scale.set(1 - 0.94 * k, 1, 1 - 0.94 * k); lidPivot.rotation.y = rad(220) * k; lidPivot.position.z = -0.3 * k;
        // the light grows down from the opening, 0.3 -> 1
        const g = clamp((h - 0.3) / 0.7), on = g > 0.002; shaft.visible = on; rays.forEach((r) => (r.visible = on));
        if (on) {
          const d = g * DEPTH, top = sqAt(0), bot = sqAt(d), pos = [];
          for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) pos.push(...top[a], ...top[b], ...bot[b], ...bot[a]);   // the four side quads
          shaftG.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
          const ix = []; for (let i = 0; i < 4; i++) ix.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); shaftG.setIndex(ix);
          // rays: slabs 0.10 wide hanging from x -0.3, -0.1, 0.1, 0.3 at the opening, leaning with the light and fanned 4 degrees apart
          rays.forEach((r, i) => {
            const x0 = (i - 1.5) * 0.2, dx = d * (SHIFT / DEPTH + Math.tan(rad((i - 1.5) * 4))), hw = 0.05;
            r.geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array([x0 - hw, 0, 0, x0 + hw, 0, 0, x0 + dx + hw, -d, 0, x0 + dx - hw, -d, 0]), 3));
            r.geometry.computeBoundingSphere(); r.position.z = (i % 2 ? 1 : -1) * 0.005;
          });
        }
        patch.visible = rails.visible = h >= 0.95;
      },
    };
  },

  // ================================================================================================ seatrocket
  seatrocket(P) {
    const W = P.whole, gray = basicM("#55595f");
    glow(put(W, new THREE.BoxGeometry(0.5, 0.08, 0.3), gray, 0, -0.04, 0), 3);
    glow(put(W, new THREE.CylinderGeometry(0.07, 0.1, 0.12, 20, 1, true), basicM("#55595f", { side: THREE.DoubleSide }), 0, -0.14, 0), 3);
    // the flame: 7 tongues with hashed lengths, 3 nested shells, two silhouettes (A, B)
    const NA = 56, NR = 9;
    const flameGeo = (seed) => {
      const len = [];
      for (let j = 0; j < 7; j++) len.push(1 + 0.125 * (hs(seed * 31 + j * 5.3) * 2 - 1));   // 25 % spread
      const pos = [], idx = [];
      for (let r = 0; r <= NR; r++) for (let a = 0; a < NA; a++) {
        const ang = (a / NA) * 6.2832, w = (a / NA) * 7, j = Math.floor(w) % 7, f = w - Math.floor(w);
        const peak = Math.sin(Math.PI * f), tl = len[j] * (0.62 + 0.38 * Math.pow(peak, 0.8));   // the length of this angular column: a tongue's tip, a valley between
        const u = Math.min(1, r / NR), prof = Math.pow(1 - u, 0.65), wob = 1 + 0.08 * Math.sin(u * 9 + seed + j);
        pos.push(Math.cos(ang) * 0.1 * prof * wob, -0.6 * tl * u, Math.sin(ang) * 0.1 * prof * wob);
      }
      for (let r = 0; r < NR; r++) for (let a = 0; a < NA; a++) { const a2 = (a + 1) % NA, i0 = r * NA + a, i1 = r * NA + a2, i2 = (r + 1) * NA + a, i3 = (r + 1) * NA + a2; idx.push(i0, i1, i3, i0, i3, i2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const flame = new THREE.Group(); flame.position.y = -0.2; W.add(flame);
    const sil = [3, 8].map((seed, si) => {
      const grp = new THREE.Group(); flame.add(grp);
      [["#f0621e", 1, 0.9, 7], ["#ffb02a", 0.7, 0.95, 8], ["#fff6c0", 0.4, 1, 9]].forEach(([c, s, al, order]) => {
        const mm = basicM(c, { side: THREE.DoubleSide, transparent: true, opacity: al, depthWrite: false }), o = put(grp, flameGeo(seed), mm); o.scale.setScalar(s); glow(o, order);
      });
      return grp;
    });
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.flame ?? 0), on = f > 0.004;
        flame.visible = on; if (!on) return;
        flame.scale.set(0.5 + 0.5 * f, Math.max(0.0001, f), 0.5 + 0.5 * f);
        const k = Math.floor((t ?? 0) * 15 + 1e-6) % 2; sil[0].visible = k === 0; sil[1].visible = k === 1;
      },
    };
  },

  // ================================================================================================ cockpitcard
  cockpitcard(P) {
    const W = P.whole, CW = 512, CH = 1024, X = (x) => (x + 0.5) * CW, Y = (y) => ((2 - y) / 2) * CH;
    const tex = canvasTex(CW, CH, (g) => {
      const rr = (x0, y0, x1, y1, r, fill) => { g.fillStyle = fill; g.beginPath(); g.roundRect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1), r); g.fill(); };
      g.fillStyle = "#2c3038"; g.fillRect(0, 0, CW, CH);
      // windscreen: top 45 % (y 1.1 .. 2.0): the frame, two sky panes, a dark centre post, one cloud each
      g.fillStyle = "#23262e"; g.fillRect(0, 0, CW, Y(1.1));
      const pane = (x0, x1, cx, cy) => {
        rr(x0, 1.14, x1, 1.96, 14, "#8fc8ff");
        g.save(); g.beginPath(); g.roundRect(X(x0), Y(1.96), X(x1) - X(x0), Y(1.14) - Y(1.96), 14); g.clip();
        g.fillStyle = "#ffffff"; for (const [dx, dy, rx, ry] of [[0, 0, 62, 20], [-38, 6, 38, 16], [40, 4, 42, 15], [6, -9, 40, 16]]) { g.beginPath(); g.ellipse(X(cx) + dx, Y(cy) + dy, rx, ry, 0, 0, 6.283); g.fill(); }
        g.restore();
      };
      pane(-0.47, -0.03, -0.26, 1.62); pane(0.03, 0.47, 0.25, 1.52);
      rr(-0.03, 1.1, 0.03, 2.0, 0, "#23262e");   // the dark centre post
      // the dark panel and its three glowing screens
      rr(-0.5, 0.45, 0.5, 1.1, 0, "#3a3f4a");
      const screen = (x0, y0, x1, y1, c) => { g.save(); g.shadowColor = c; g.shadowBlur = 16; rr(x0, y0, x1, y1, 5, c); g.restore(); rr(x0 + 0.008, y0 + 0.008, x1 - 0.008, y1 - 0.008, 3, c); };
      screen(-0.145, 0.9, -0.015, 1.04, "#9fe0b0"); screen(0.015, 0.9, 0.145, 1.04, "#9fe0b0"); screen(-0.1, 0.68, 0.1, 0.84, "#ffc46a");
      // the pedestal, two throttle levers
      rr(-0.11, 0, 0.11, 0.56, 4, "#4d535e"); rr(-0.11, 0.5, 0.11, 0.58, 6, "#5a606b");
      for (const sx of [-1, 1]) { g.strokeStyle = "#c9ced6"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(X(sx * 0.04), Y(0.53)); g.lineTo(X(sx * 0.04 + sx * 0.012), Y(0.68)); g.stroke(); g.fillStyle = "#e0e3e8"; g.beginPath(); g.arc(X(sx * 0.052), Y(0.69), 9, 0, 6.283); g.fill(); }
      // the two empty seat backs seen from behind, 0.30 wide, headrests topping out at y 1.25
      for (const sx of [-1, 1]) {
        const cx = sx * 0.31;
        rr(cx - 0.15, 0.2, cx + 0.15, 1.05, 18, "#6f757d"); rr(cx - 0.12, 0.24, cx + 0.12, 1.0, 12, "#656b73");   // the back and its shaded inset
        rr(cx - 0.11, 1.02, cx + 0.11, 1.25, 16, "#c9ced6"); rr(cx - 0.085, 1.04, cx + 0.085, 1.22, 12, "#d7dbe1");   // the pale headrest
      }
    });
    const card = put(W, new THREE.PlaneGeometry(1.0, 2.0), basicM("#ffffff", { map: tex, side: THREE.DoubleSide }), 0, 1.0, 0);
    glow(card, 2);
    return { grip: 0 };
  },
};
