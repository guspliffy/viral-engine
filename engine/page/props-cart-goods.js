import * as THREE from "three";
import { clamp } from "./util.js";

// How you invented 02 "The shopping cart", task B: the food props (storyboards/series/how-you-invented/02-shopping-cart/DESIGN.md 2.4-2.6).
// Metres, +x screen right, +y up, +z toward the camera, hex colours. Pure functions of the keys and the clip time: no Math.random, no wall
// clock, nothing keeps a mesh between frames except by exact inputs. Things appear by `visible` or scale, never by opacity. Every fall and
// roll is a designed path INSIDE its kind (a key = seconds since), not engine physics. The food is INSTANCED (4 shared item shapes, a fixed
// table of 64): tin (r 0.045 x 0.09, steel #b9c0c6, rib, lid ring #8d959c), orange (r 0.045 #f08a24), apple (r 0.04 #d8342c, green cheek),
// bread (0.20 x 0.08 #c98f4e). Instanced meshes are not "solid" for the contact checks; the heap's bulk mound (a plain mesh) is.
//
// HOW THE KEYS REACH A KIND: every key below that is listed in CART_GOODS_STATE tweens with a plain `prop` action (c.prop(t, id, { n: 64 }, dur)).
// The kinds ignore `scale` 1 assumptions: parts are placed in metres, so give `scale` 1 except for the 0 that hides a prop. `rot` is free.
//
// KINDS (origin; spec keys with defaults; state keys with defaults; size; where a hand holds it)
//   foodtower   The armful, the tower and the heap in one. Origin: the middle of its base. The stack: 3 items a layer, each layer turned 47 deg
//               and 0.01 to 0.03 off centre, layers 0.0675 apart for the first 5 (the armful), then 0.0994. Keys: n 0..64 (default 14) items
//               shown from the bottom up (the fractional item pops by scale): 14 = the armful 0.46 wide x 0.30 deep x 0.36 tall; 64 = the
//               tower 0.46 wide at the base, 2.05 tall. sway 0..14 degrees (0) bends the stack like a rod toward +x, the top most. fall (0)
//               = seconds since it went (<= 0 standing): every item i leaves on its own ballistic path (g 9.8, bottom items 0..0.14 s
//               later, a bulge toward +x +z, tumbling), all lying by 0.9 s on the mound: r 0.80, 0.62 high, centred 0.10 in front of the
//               base (z +0.10), a hollow r 0.40 and 0.50 high under its middle (a stand-in cloth-coloured bulk shell is the solid mound;
//               it rises 0.25 to 0.70 s), a hole of r `hole` (spec, 0.10; 0 = none) at the very top for Spud's leaf with no item in it.
//               Items 1, 9 and 17 (oranges) land on the outer ring and roll on 0.22 m to 1.4 s. Spec: hole 0.10.
//               HELD: grips.box, SIZE foodtower { w 0.46, h 0.36, d 0.30 } (both gloves on the two ends of the bottom layer, x +-0.275,
//               y 0.55 h). The prop's own front is +z (the holder's side); place it with grips.placeFor("foodtower", [x, y, z], yaw).
//               Two invisible collision boxes (armful, column) stand in for the instanced food while it stands (the contact checks; the grip-gap
//               check needs them). 2 660 triangles at n 64, 4 040 after the fall (bulk 350).
//               Proof (bench-goods.mjs): the armful's top is y 0.36 + base 0.26 = 0.62: over Spud's mouth (0.54): his mouth shows only from a lens
//               above about y 1.5. The hollow (r 0.40, 0.50 high) is narrower than Spud + arms: his gloves touch its wall (hand-in-prop 3 cm).
//   foodpile    Mash's growing stolen pile. Origin: bottom centre (the bench top). Key grow 0..5 (default 0): each integer step pops in
//               by scale as the key passes it (tween it over 4 frames on the cut): 1 = 6 orange-peel curls; 2 = + 9 tins and 3 oranges, 0.22
//               high; 3 = + 12 apples, 0.34 high, 0.50 wide; 4 = a heap 0.55 wide, 0.62 high with a whole broken basket on top (two
//               stubs, no arch); 5 = 0.60 wide, 0.95 high, + a wheel of cheese and a ham on it. Never wider than 0.60. The lumps under
//               the food are solid. ~2 900 triangles at grow 5.
//   snackfruit  One fruit to eat. Origin: the BOTTOM of the fruit (its centre is r = 0.045 up; DESIGN says centre, but the mug hold takes
//               its origin as the bottom and misses a centre-origin fruit: see the proof sheet); spec origin "centre" gives DESIGN's. Spec: fruit "orange" | "apple" (orange), biteDir [x, y, z] (the
//               bite's direction in the prop frame, default [0, 0.4, 0.9] = toward the holder's mouth side, +z). Key bite 0..1 (0): a
//               hollow 0.05 across of pale flesh. HELD: the mug hold, SIZE snackfruit { r 0.045, h 0.09 } with its defaults. 192 triangles.
//   catchdrop   The thing that falls into a waiting glove. Origin: the WORLD ORIGIN (from and to are absolute): keep x y z 0. Spec: item
//               "orange" | "coin" (orange), from [x, y, z], to [x, y, z], hop (0): metres the orange rises first. The coin = the kit
//               coin's look at r 0.05 (gold, potato emblem, face +z at drop 0 as the kit coin pinched). Key drop (0) = seconds since it left
//               (<= 0 at `from`): a ballistic path (g 9.8) from `from` to `to`, the flight time found from the heights (rest start,
//               or an up-kick of sqrt(2 g hop)): the orange from (-3.70, 0.72, 1.95) to (-3.22, 0.38, 1.70) hop 0.06 flies 0.396 s,
//               the coin from (-0.25, 1.12, 4.30) to (-0.18, 0.14, 4.35) 0.447 s. It rolls (orange) or turns 2.5 turns about x (coin;
//               spec turns) and STOPS AT `to` and stays there, exactly, with no motion after. Pin the glove at `to` 4 frames earlier.
//               Not solid. 140 triangles.
//   foodrain    26 items of the foodtower family. Origin: the world origin for mode "down", the cart's frame for "up".
//               mode "up": ride the cart with spec.ride ["<cart id>", "<anchor>"] and the cart's rot (the prop's local -z is BEHIND the cart).
//               Spec: from [0, 0.50, 0] (the basket's rim in the cart frame), back [0, 0, -1] (the direction the items fall behind in the
//               prop frame), accel 2.4 (the cart's m/s2 along the hill: the items drift back by accel t2 / 2). Key fly (0) = seconds:
//               item i leaves at 0.12 i s, rises 0.8 to 1.6 m, tumbles and falls behind, gone 1.2 s after it left.
//               mode "down" (C09): spec to [x, y, z] (WORLD: the sack's ring centre; r 0.10 the disc they fall into). Key rain (0) = seconds:
//               item i enters at y +4.2 over `to` at 0.085 i s and falls straight (g 9.8, tumbling) into the disc, hidden once its
//               centre is 0.03 under it; the last is in by about 3.1 s. Not solid. ~2 000 triangles.
//   hoodsack    Mash's hood held out like a sack. WORN: spec.wear "mash", x y z 0 (his body frame; it squashes with him). A cloth funnel in
//               his hoodie colour #7a716c (inside #5c5450) from his collar's back over his right shoulder to a mouth ring (r 0.17, rolled
//               edge) at body frame ring [-0.55, 0.41, 0.12], tipped `lean` 15 degrees toward his front (+z); the belly hangs under the ring.
//               Spec: ring, lean, collar [0, 0.55, -0.24], and 2 drawstring ends #f2d8bd. Key fill 0..1 (0): the belly sags from 0.10 to
//               0.34 and 3 item shapes press through. His gloves: GRIPS hoodsack near (the ring's +z point) and far (its -z point), in the
//               body frame. Pin a glove there with the arm pose { x: [-0.55, up, fwd] } (absolute body-frame x; up = (y - 0.14) / 1.24): near
//               = { x: [-0.55, 0.182, 0.284] }, far = { x: [-0.55, 0.253, -0.044] } (the default ring). At yaw -30 the ring centre stands
//               at (+0.664, 0.41, +0.329) from Mash's (1.2, 0.5): i.e. his world x,z minus (0.536, -0.171) rotated: put foodrain `to` there
//               (the design's `to` (60.32, 0.55, 1.59) is 0.31 off in z and 0.14 high). Not solid. 1 200 triangles.
//   wickerbasket An oval hand basket 0.52 (x) x 0.40 (z) at the rim, 0.42 x 0.32 at the foot, 0.20 tall, plaited rim roll 0.03; the weave drawn
//               once (22 stakes, 9 rows: willow #c79a55, shade #9a7238, light #e0bb7a). Origin: the middle of its bottom. Arch handle of two
//               twisted rods 0.022 thick in the xy plane, from the two long-side rim points (+-0.26, 0.20) up to 0.42. Keys: fill 0..1 (0)
//               a heap of 18 items to 0.10 over the rim (nine are apples); snap (0) = 0 intact, then seconds since it broke: 0..0.08 s five
//               willow fibres fray at the arch's top, at 0.08 s it parts, the halves spring apart (0.06 s) into stubs 0.12 long leaning 25
//               degrees out and quiver 3 degrees at 9 Hz for 0.3 s; no flash, no mark. Spec stub 1 = built with the two stubs from the start
//               (every basket after round 2). spill (0) = seconds: the nine apples roll out of the mouth along fixed tracks in the PARENT
//               (world) frame: the top three stop at spillTo [x, z] (default [x + 0.1, z - 0.4] of the basket), the other six run along
//               +x on the floor (spec floorY 0) over 1.5 m, the last stopping at 1.6 s; roll speeds decay. To lie it on its long
//               side with the mouth toward +x: rot 90, tip 90 (tilt 90 alone stands it on its short end). Lifted (05): GRIPS arch,
//               archL, archR (0.05 apart, apex), stubL, stubR; the engine's `y` tween lifts it. ~3 000 triangles at fill 1.
//
// Held in hands: foodtower (box hold) and snackfruit (mug hold) only: CART_GOODS_GRIPS lists named pin points for the rest.

const G = 9.8, DEG = Math.PI / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const backOut = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const num = (ps, P, k, d) => ps[k] ?? P.spec[k] ?? d;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const AX = { x: V(1, 0, 0), y: V(0, 1, 0), z: V(0, 0, 1) };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _v = new THREE.Vector3();
const qAxis = (ax, a, out = new THREE.Quaternion()) => out.setFromAxisAngle(ax, a);
const colors = {};
const col = (h) => (colors[h] ||= new THREE.Color(h));

// ------------------------------------------------------------------------------------------------------------------
// the four items, drawn once (geometry shared by every prop that shows them), centred on the origin
const paint = (g, fn) => {
  const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { fn(_c, p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
};
const GEOS = {};
function itemGeos(lod = 0) {
  if (GEOS[lod]) return GEOS[lod];
  const seg = lod ? 6 : 8, sph = lod ? [6, 4] : [8, 6];
  // tin: lathe with a rib and a lid ring, y centred
  const prof = (lod
    ? [[0.0001, 0], [0.044, 0], [0.045, 0.008], [0.045, 0.082], [0.047, 0.09], [0.0001, 0.09]]
    : [[0.0001, 0], [0.044, 0], [0.045, 0.008], [0.045, 0.040], [0.0425, 0.045], [0.045, 0.050], [0.045, 0.082], [0.047, 0.087], [0.047, 0.09], [0.0001, 0.09]]).map(([x, y]) => new THREE.Vector2(x, y - 0.045));
  const tin = paint(new THREE.LatheGeometry(prof, seg), (c, x, y) => { const yy = y + 0.045; c.set(yy > 0.081 || yy < 0.009 ? "#8d959c" : yy > 0.038 && yy < 0.052 && !lod ? "#a3abb2" : "#b9c0c6"); });
  const orange = new THREE.SphereGeometry(0.045, sph[0], sph[1]);
  { const p = orange.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.03 * (hash(Math.round(p.getX(i) * 4000) + Math.round(p.getY(i) * 5000) * 3 + Math.round(p.getZ(i) * 6000) * 7) - 0.5); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.97, p.getZ(i) * k); } orange.computeVertexNormals(); }
  paint(orange, (c, x, y, z, nx, ny) => { c.set("#f08a24"); if (ny > 0.8) c.lerp(col("#c26a14"), 0.6); else if (ny > 0.35) c.lerp(col("#f7a64a"), 0.35); });
  const apple = new THREE.SphereGeometry(0.04, sph[0], sph[1]);
  { const p = apple.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) * 0.92; const r = Math.hypot(p.getX(i), p.getZ(i)); if (p.getY(i) > 0.034) y -= 0.007; p.setXYZ(i, p.getX(i) * (1 + 0.04 * Math.max(0, p.getY(i) / 0.04)), y, p.getZ(i) * (1 + 0.04 * Math.max(0, p.getY(i) / 0.04))); void r; } apple.computeVertexNormals(); }
  paint(apple, (c, x, y, z, nx, ny) => { c.set("#d8342c"); if (ny > 0.9) c.set("#5a3a1e"); else if (nx < -0.35) c.lerp(col("#9cb23c"), clamp((-nx - 0.35) * 2)); });
  const bread = new THREE.SphereGeometry(1, lod ? 6 : 8, lod ? 4 : 5); bread.scale(0.10, 0.04, 0.04);
  { const p = bread.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (p.getY(i) < 0 ? 0.7 : 1)); bread.computeVertexNormals(); }
  paint(bread, (c, x, y, z, nx, ny) => { c.set("#c98f4e"); if (ny > 0.45) c.lerp(col("#dca564"), 0.5); else if (ny < -0.3) c.lerp(col("#9b6a34"), 0.6); if (ny > 0.45 && Math.abs(((x + 0.1) / 0.2) * 4 - Math.round(((x + 0.1) / 0.2) * 4)) < 0.1) c.lerp(col("#8a5a28"), 0.5); });
  return (GEOS[lod] = { tin, orange, apple, bread });
}
let IMATS = null;
const itemMats = () => (IMATS ||= {
  tin: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.5 }),
  orange: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 }),
  apple: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }),
  bread: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
});
const TYPES8 = ["tin", "orange", "apple", "tin", "apple", "orange", "tin", "bread"];
const typeAt = (i) => TYPES8[i % 8];
const HALF = { tin: 0.045, orange: 0.045, apple: 0.04, bread: 0.04 };

// a set of instanced items (one InstancedMesh per type present); put(i, p, q, s) writes one, flush() after the last
class Items {
  constructor(parent, types, lod = 0) {
    const g = itemGeos(lod), m = itemMats(), cnt = {};
    this.slot = []; this.im = {};
    for (const t of types) cnt[t] = (cnt[t] || 0) + 1;
    for (const t of Object.keys(cnt)) { const im = new THREE.InstancedMesh(g[t], m[t], cnt[t]); im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.userData.k = 0; parent.add(im); this.im[t] = im; }
    types.forEach((t, i) => { const im = this.im[t], k = im.userData.k++; this.slot.push([im, k]); im.setColorAt(k, _c.setScalar(0.93 + 0.14 * hash(i, 7))); this.hide(i); });
    for (const im of Object.values(this.im)) im.instanceColor.needsUpdate = true;
    this.types = types;
  }
  put(i, p, q, s = 1) { const [im, k] = this.slot[i]; _m.compose(p, q, _s.set(s, s, s)); im.setMatrixAt(k, _m); }
  hide(i) { this.put(i, _p.set(0, -9, 0), _q.identity(), 1e-4); }
  flush() { for (const im of Object.values(this.im)) im.instanceMatrix.needsUpdate = true; }
}
// a resting orientation for item i (a hash: tins lie or stand, bread lies flat, fruit any way)
function restQuat(i, type, out = new THREE.Quaternion()) {
  const yaw = hash(i, 11) * Math.PI * 2;
  out.setFromAxisAngle(AX.y, yaw);
  if (type === "tin" && hash(i, 12) < 0.5) out.multiply(qAxis(AX.x, Math.PI / 2, _q2));
  else if (type !== "bread") out.multiply(_q2.setFromEuler(new THREE.Euler((hash(i, 13) - 0.5) * 0.5, 0, (hash(i, 14) - 0.5) * 0.5)));
  return out;
}

// ------------------------------------------------------------------------------------------------------------------
// the tower's stack: place of item i (centre) and its stacked orientation
const Y0 = 0.0675, Y1 = 0.0994;
const layerY = (k) => (k <= 4 ? k * Y0 : 4 * Y0 + (k - 4) * Y1);
function stackPlace(i) {
  const k = Math.floor(i / 3), j = i % 3, u = sm((k - 2) / 6), R = lerp(0.185, 0.10, u), Rz = R * lerp(0.62, 1, u);
  const th = (k * 47 + j * 120 + 30) * DEG, mag = 0.01 + 0.02 * hash(k, 2), dir = hash(k, 3) * Math.PI * 2;
  // the armful (layers 0 to 4) is a wall: 3 across, alternate layers staggered in z, then it winds into the tower's turned triangles
  const w = 1 - sm((k - 2) / 4), rx = (j - 1) * 0.175 + (k % 2 ? 0.02 : -0.02), rz = ((k % 2 ? 1 : -1) * (j === 1 ? 1 : -0.6)) * 0.05;
  return { x: lerp(R * Math.cos(th), rx, w) + mag * Math.cos(dir), y: layerY(k) + 0.045, z: lerp(Rz * Math.sin(th), rz, w) + mag * Math.sin(dir), th, k };
}
const STACK = Array.from({ length: 64 }, (_, i) => stackPlace(i));
const TOP = (n) => (n <= 0 ? 0.36 : Math.max(0.36, STACK[Math.min(63, Math.ceil(n) - 1)].y + 0.045));
// the heap: item i (low i = outer, high i = middle) placed by a small settle onto the bulk's dome or onto items already down
const HEAPK = { R: 0.8, H: 0.62, cz: 0.10, inner: 0.50, innerR: 0.40 };
const shellH = (rho) => HEAPK.H * Math.max(0, 1 - (rho / HEAPK.R) ** 2);
const ROLLERS = [1, 9, 17];
const HEAPS = {};
function heapPlan(hole) {
  const key = hole.toFixed(3); if (HEAPS[key]) return HEAPS[key];
  const placed = [], out = [], r0 = hole + 0.06;
  for (let i = 0; i < 64; i++) {
    const type = typeAt(i), frac = i / 63, ri = ROLLERS.indexOf(i);
    const rho = ri >= 0 ? [0.77, 0.75, 0.78][ri] : r0 + (0.74 - r0) * Math.pow(1 - frac, 0.75);
    const th = ri >= 0 ? (ri * 2.1 + 0.4) : i * 2.39996 + (hash(i, 1) - 0.5) * 0.5;
    const x = rho * Math.cos(th), z = HEAPK.cz + rho * Math.sin(th);
    let y = Math.max(HALF[type], shellH(rho) + HALF[type] + 0.004);
    for (const q of placed) { const d = Math.hypot(x - q.x, z - q.z); if (d < 0.09) y = Math.max(y, q.y + Math.sqrt(0.0081 - d * d)); }
    const o = { x, y, z, rho, type, th, q: restQuat(i, type), roll: ri >= 0 };
    placed.push(o); out.push(o);
  }
  return (HEAPS[key] = out);
}
// the bulk mound: a lathe over the shell profile with a hole at the top, in the colours of the food seen in shadow
function bulkGeo(hole) {
  const pts = [], R = HEAPK.R, H = HEAPK.H;
  const top = Math.max(hole, 0.0001);
  for (let k = 0; k <= 8; k++) { const rho = R - (R - top) * (k / 8); pts.push([rho, H * (1 - (rho / R) ** 2)]); }
  for (let k = 0; k <= 5; k++) { const rho = top + (HEAPK.innerR - top) * (k / 5); pts.push([rho, HEAPK.inner * Math.max(0, 1 - (rho / HEAPK.innerR) ** 2) * (1 - 0.0 * rho)]); }
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 14);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const w = 0.02 * (hash(Math.round(p.getX(i) * 900) * 7 + Math.round(p.getZ(i) * 900) * 13, 4) - 0.5); if (p.getY(i) > 0.02) p.setY(i, p.getY(i) + w); }
  g.computeVertexNormals();
  const pal = ["#7a4a2d", "#5e4b34", "#9a6a30", "#4f5a38", "#6e3a2c"];
  paint(g, (c, x, y, z) => { c.set(pal[Math.floor(hash(Math.round(x * 14) * 5 + Math.round(z * 14) * 11, 6) * pal.length)]); });
  return g;
}

// ------------------------------------------------------------------------------------------------------------------
// a sweep along a polyline with an elliptic section (rw wide in the frame's N, rh in B); frames from a fixed up reference
function sweepGeo(pts, sides, rfn, up = V(0, 0, 1)) {
  const n = pts.length, pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const t = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    let N = new THREE.Vector3().crossVectors(t, up); if (N.lengthSq() < 1e-6) N = V(1, 0, 0); N.normalize();
    const B = new THREE.Vector3().crossVectors(N, t).normalize(), [rw, rh] = rfn(i / (n - 1));
    for (let j = 0; j < sides; j++) { const a = (j / sides) * Math.PI * 2; pos.push(pts[i].x + (N.x * Math.cos(a) * rw + B.x * Math.sin(a) * rh), pts[i].y + (N.y * Math.cos(a) * rw + B.y * Math.sin(a) * rh), pts[i].z + (N.z * Math.cos(a) * rw + B.z * Math.sin(a) * rh)); }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a dynamic tube (rewritten per frame): fixed sections, fixed sides; set(points, radius)
class DTube {
  constructor(parent, maxSec, sides, material) {
    this.maxSec = maxSec; this.sides = sides;
    this.pos = new Float32Array(maxSec * sides * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const idx = []; for (let i = 0; i < maxSec - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
    g.setIndex(idx); this.geo = g; this.mesh = new THREE.Mesh(g, material); this.mesh.frustumCulled = false; this.mesh.castShadow = this.mesh.receiveShadow = true; parent.add(this.mesh);
  }
  set(pts, r) {
    const n = pts.length, N = V(), B = V(), t = V();
    for (let i = 0; i < n; i++) {
      t.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      N.crossVectors(t, AX.z); if (N.lengthSq() < 1e-6) N.set(1, 0, 0); N.normalize(); B.crossVectors(N, t);
      for (let j = 0; j < this.sides; j++) { const a = (j / this.sides) * Math.PI * 2, o = (i * this.sides + j) * 3, c = Math.cos(a) * r, s = Math.sin(a) * r; this.pos[o] = pts[i].x + N.x * c + B.x * s; this.pos[o + 1] = pts[i].y + N.y * c + B.y * s; this.pos[o + 2] = pts[i].z + N.z * c + B.z * s; }
    }
    for (let i = n; i < this.maxSec; i++) for (let j = 0; j < this.sides; j++) { const o = (i * this.sides + j) * 3, s = ((n - 1) * this.sides + j) * 3; this.pos[o] = this.pos[s]; this.pos[o + 1] = this.pos[s + 1]; this.pos[o + 2] = this.pos[s + 2]; }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
}
// the wearer's squash (props-heist.js wearSquash, copied: not exported): a worn prop's `whole` follows his squash every frame
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

// ------------------------------------------------------------------------------------------------------------------
// the basket: oval wall (a grid of rings), a weave canvas, a rim roll, a floor, the arch (two twisted rods in two halves)
const BK = { rimA: 0.26, rimB: 0.20, footA: 0.21, footB: 0.16, H: 0.20, e: 2.4 };
const sgn = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), 2 / e);
function ringPt(y, th, off = 0) {
  const u = y / BK.H, bulge = 0.008 * Math.sin(Math.PI * u);
  const a = lerp(BK.footA, BK.rimA, u) + bulge + off, b = lerp(BK.footB, BK.rimB, u) + bulge + off;
  return [a * sgn(Math.cos(th), BK.e), a === 0 ? 0 : y, b * sgn(Math.sin(th), BK.e)];
}
function gridGeo(nu, nv, fn, flip = false) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
let WEAVE = null;
function weaveTex() {
  if (WEAVE) return WEAVE;
  const W = 2048, H = 512, S = 22, Rw = 9, cw = W / S, ch = H / Rw, mk = (draw) => { const cv = document.createElement("canvas"); cv.width = W; cv.height = H; draw(cv.getContext("2d")); return cv; };
  const tone = (a, b, c, d) => (a ^ b ^ c ^ d) & 1;
  const col = mk((g) => {
    g.fillStyle = "#9a7238"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < Rw; r++) for (let s = 0; s < S; s++) {
      const x = s * cw, y = r * ch, over = (r + s) % 2 === 0;
      const hx = hash(r * 31 + s, 5), grad = g.createLinearGradient(over ? x : x, over ? y : y, over ? x : x + cw, over ? y + ch : y);
      if (over) { // a horizontal weaver passing in front of the stake
        const gg = g.createLinearGradient(0, y, 0, y + ch); gg.addColorStop(0, "#d6ad68"); gg.addColorStop(0.5, "#c79a55"); gg.addColorStop(1, "#a37a3c");
        g.fillStyle = gg; g.beginPath(); g.roundRect(x - 2, y + 4, cw + 4, ch - 8, 18); g.fill();
        g.strokeStyle = "rgba(90,60,25,0.55)"; g.lineWidth = 3; g.stroke();
        g.strokeStyle = "rgba(255,235,180,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, y + ch * 0.32 + hx * 4); g.lineTo(x + cw - 6, y + ch * 0.32 + hx * 4); g.stroke();
      } else { // the stake in front of the weaver
        const gg = g.createLinearGradient(x, 0, x + cw, 0); gg.addColorStop(0, "#b98c49"); gg.addColorStop(0.5, "#e0bb7a"); gg.addColorStop(1, "#b08340");
        g.fillStyle = gg; g.beginPath(); g.roundRect(x + 6, y - 2, cw - 12, ch + 4, 16); g.fill();
        g.strokeStyle = "rgba(90,60,25,0.55)"; g.lineWidth = 3; g.stroke();
        g.strokeStyle = "rgba(120,80,35,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + cw * 0.5 + (hx - 0.5) * 10, y + 6); g.lineTo(x + cw * 0.5 + (hx - 0.5) * 10, y + ch - 6); g.stroke();
      }
      void grad; void tone;
    }
  });
  const bump = mk((g) => {
    g.fillStyle = "#303030"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < Rw; r++) for (let s = 0; s < S; s++) { const x = s * cw, y = r * ch; g.fillStyle = (r + s) % 2 === 0 ? "#ffffff" : "#bdbdbd"; g.beginPath(); if ((r + s) % 2 === 0) g.roundRect(x - 2, y + 4, cw + 4, ch - 8, 18); else g.roundRect(x + 6, y - 2, cw - 12, ch + 4, 16); g.fill(); }
  });
  const t1 = new THREE.CanvasTexture(col), t2 = new THREE.CanvasTexture(bump);
  t1.colorSpace = THREE.SRGBColorSpace; t1.anisotropy = 8; t1.wrapS = THREE.RepeatWrapping;
  const plait = mk2();
  return (WEAVE = { map: t1, bump: t2, plait });
  function mk2() {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 64; const g = cv.getContext("2d");
    g.fillStyle = "#9a7238"; g.fillRect(0, 0, 512, 64);
    for (let i = -2; i < 18; i++) { const x = i * 32; const gg = g.createLinearGradient(0, 0, 0, 64); gg.addColorStop(0, "#e0bb7a"); gg.addColorStop(1, "#b08340"); g.fillStyle = gg; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 20, 64); g.lineTo(x + 44, 0); g.lineTo(x + 24, 0); g.closePath(); g.fill(); g.strokeStyle = "rgba(90,60,25,0.6)"; g.lineWidth = 3; g.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  }
}
// the fill heap of 18 items inside the basket: layers of 6, 7 and 5 (centres y 0.06, 0.15, 0.24: the top 0.285, 0.085 over the rim), the middle ones highest
const FILL_TYPES = Array.from({ length: 18 }, (_, i) => (i % 2 === 0 ? "apple" : ["tin", "orange", "tin", "bread", "orange", "tin", "orange", "tin", "bread"][(i - 1) / 2 | 0]));
const FILL = (() => {
  const out = []; const layers = [[6, 0.06, 0.15, 0.10], [7, 0.15, 0.17, 0.115], [5, 0.24, 0.10, 0.07]];
  for (const [n, y, rx, rz] of layers) for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + (out.length % 2) * 0.4; out.push({ x: rx * Math.cos(a) * (j % 2 ? 0.8 : 1), y, z: rz * Math.sin(a) * (j % 2 ? 0.8 : 1) }); }
  return out;
})();

// ------------------------------------------------------------------------------------------------------------------
// the arch: the half arch from the rim point (sigma * 0.26, 0.20) over an ellipse (a 0.26, b 0.22) to the apex (0, 0.42)
const ARCH = (() => {
  const a = BK.rimA, b = 0.22, N = 40, tab = [[0, 0]]; let s = 0, pr = [a, 0];
  for (let i = 1; i <= N; i++) { const f = (i / N) * Math.PI / 2, p = [a * Math.cos(f), b * Math.sin(f)]; s += Math.hypot(p[0] - pr[0], p[1] - pr[1]); tab.push([s, f]); pr = p; }
  return { a, b, L: s, tab };
})();
function archPt(sig, l, out = V()) {
  const { a, b, tab } = ARCH; l = clamp(l, 0, ARCH.L); let k = 1; while (k < tab.length - 1 && tab[k][0] < l) k++;
  const f = lerp(tab[k - 1][1], tab[k][1], (l - tab[k - 1][0]) / Math.max(1e-9, tab[k][0] - tab[k - 1][0]));
  return out.set(sig * a * Math.cos(f), BK.rimB + b * Math.sin(f), 0);
}
const STUB = 0.12, STUBLEAN = 25 * DEG;

// ------------------------------------------------------------------------------------------------------------------
function buildBasket(P, { lod = 0, stub = false, withHandle = true } = {}) {
  const T = weaveTex(), nu = lod ? 22 : 44, nv = lod ? 3 : 5;
  const wall = new THREE.MeshStandardMaterial({ map: T.map, bumpMap: T.bump, bumpScale: 2.2, roughness: 0.85, side: THREE.DoubleSide });
  const g = P.whole;
  const geo = gridGeo(nu, nv, (u, v) => ringPt(0.012 + v * (BK.H - 0.012), u * Math.PI * 2));
  const w = mesh(geo, wall, g);
  const inner = mesh(gridGeo(nu, 2, (u, v) => ringPt(0.012 + v * (BK.H - 0.012), u * Math.PI * 2, -0.012), true), mat("#8a6530", { side: THREE.DoubleSide }), g); inner.castShadow = false;
  const floor = mesh(gridGeo(nu, 1, (u, v) => { const p = ringPt(0.012, u * Math.PI * 2, -0.012); return [p[0] * (1 - v), 0.012, p[2] * (1 - v)]; }), mat("#a37a3c", { side: THREE.DoubleSide }), g); floor.castShadow = false;
  const plait = new THREE.MeshStandardMaterial({ map: T.plait, roughness: 0.8 });
  const rnu = lod ? 22 : 44, rnv = lod ? 4 : 6;
  const rim = mesh(gridGeo(rnu, rnv, (u, v) => { const th = u * Math.PI * 2, c = ringPt(BK.H, th, 0), e = v * Math.PI * 2, nx = sgn(Math.cos(th), BK.e), nz = sgn(Math.sin(th), BK.e), n = Math.hypot(nx / BK.rimA, nz / BK.rimB) || 1, on = [nx / BK.rimA / n, nz / BK.rimB / n]; return [c[0] + on[0] * 0.015 * Math.cos(e), BK.H + 0.015 * Math.sin(e), c[2] + on[1] * 0.015 * Math.cos(e)]; }), plait, g);
  void w; void rim;
  const out = { items: null, handle: null };
  const willow = mat("#c79a55", { roughness: 0.8 }), shade = mat("#9a7238", { roughness: 0.85 });
  if (withHandle) {
    const hd = { A: [], B: [] }, secs = 16;
    for (const sig of [1, -1]) { const A = new DTube(g, secs, 5, willow), B = new DTube(g, secs, 5, shade); hd[sig > 0 ? "R" : "L"] = [A, B]; }
    const fibM = mat("#d6ad68", { roughness: 0.9 }), fibG = new THREE.ConeGeometry(0.0035, 0.05, 4, 1); fibG.translate(0, 0.025, 0);
    const fibres = Array.from({ length: 5 }, () => { const f = new THREE.Mesh(fibG, fibM); f.castShadow = true; f.visible = false; g.add(f); return f; });
    out.handle = { hd, fibres, secs, stub, update(snap) {
      // state of the halves: p = spring progress 0..1, Lcur = length, quiver angle
      let p = 0, quiver = 0, frayK = 0;
      if (stub) p = 1;
      else if (snap > 0) { p = sm((snap - 0.08) / 0.06); frayK = sm(snap / 0.08); const q = snap - 0.14; if (q > 0 && q < 0.3) quiver = 3 * DEG * Math.sin(Math.PI * 2 * 9 * q) * (1 - q / 0.3); }
      const Lcur = lerp(ARCH.L, STUB, p), ends = [];
      for (const sig of [1, -1]) {
        const base = V(sig * ARCH.a, BK.rimB, 0), d = V(sig * Math.sin(STUBLEAN), Math.cos(STUBLEAN), 0).applyAxisAngle(AX.z, -sig * quiver * 1);
        const pts = [], ptsA = [], ptsB = [];
        for (let k = 0; k < secs; k++) { const l = (k / (secs - 1)) * Lcur; archPt(sig, l, _p); const st = base.clone().addScaledVector(d, l); pts.push(_p.clone().lerp(st, p)); }
        for (let k = 0; k < secs; k++) {
          const t = pts[Math.min(secs - 1, k + 1)].clone().sub(pts[Math.max(0, k - 1)]).normalize(), N2 = new THREE.Vector3().crossVectors(t, AX.z).normalize(), ps = -sig * ((k / (secs - 1)) * Lcur) * Math.PI * 2 / 0.09;
          const o = AX.z.clone().multiplyScalar(Math.cos(ps) * 0.0105).addScaledVector(N2, Math.sin(ps) * 0.0105);
          ptsA.push(pts[k].clone().add(o)); ptsB.push(pts[k].clone().sub(o));
        }
        hd[sig > 0 ? "R" : "L"][0].set(ptsA, 0.011); hd[sig > 0 ? "R" : "L"][1].set(ptsB, 0.011);
        const tEnd = pts[secs - 1].clone().sub(pts[secs - 2]).normalize();
        ends.push([pts[secs - 1], tEnd]);
      }
      // the five fibres: three on the +x half's end, two on the -x half's end, splayed
      fibres.forEach((f, i) => {
        const [e, t] = ends[i < 3 ? 0 : 1];
        f.visible = frayK > 0.01 && !stub ? true : stub;
        const splay = ((i < 3 ? i - 1 : (i - 3) - 0.5)) * 0.5, up = t.clone();
        f.position.copy(e).add(V(0, 0, (hash(i, 21) - 0.5) * 0.016));
        f.quaternion.setFromUnitVectors(AX.y, up.applyAxisAngle(AX.z, splay + (p < 1 ? 0 : -(i < 3 ? 1 : -1) * 0.5 * p)).normalize());
        const k = stub ? 0.8 : frayK; f.scale.set(1, 0.4 + 0.9 * hash(i, 22), 1).multiplyScalar(k);
      });
    } };
    out.handle.update(0);
  }
  // the fill heap
  out.items = new Items(g, FILL_TYPES, lod);
  out.setFill = (fill, skip) => {
    for (let i = 0; i < 18; i++) {
      const f = FILL[i], k = clamp(fill * 18.4 - i);
      if (k <= 0 || (skip && skip(i))) { out.items.hide(i); continue; }
      out.items.put(i, _p.set(f.x, f.y, f.z), restQuat(i + 100, FILL_TYPES[i], _q), backOut(k));
    }
    out.items.flush();
  };
  return out;
}

// ------------------------------------------------------------------------------------------------------------------
export const CART_GOODS_KINDS = {
  // ================================================================================================================
  foodtower(P) {
    const S = P.spec, hole = S.hole ?? 0.10, types = Array.from({ length: 64 }, (_, i) => typeAt(i)), items = new Items(P.whole, types, 0), plan = heapPlan(hole);
    const bulk = mesh(bulkGeo(hole), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), P.whole, 0, 0, HEAPK.cz); bulk.visible = false;
    const stand = types.map((t, i) => { const s = STACK[i], q = new THREE.Quaternion(); if (t === "bread") q.setFromAxisAngle(AX.y, -s.th + Math.PI / 2); else q.setFromAxisAngle(AX.y, hash(i, 15) * Math.PI * 2); if (t === "tin" && hash(i, 16) < 0.2) q.multiply(qAxis(AX.x, Math.PI / 2, _q2)); return q; });
    // per-item fall constants
    const FC = types.map((t, i) => { const s = STACK[i], d = 0.14 * (1 - s.y / 2.05) * 0 + 0.14 * (1 - Math.min(1, s.y / 2.05)) + 0.02 * hash(i, 31); return { d, ax: V(hash(i, 32) - 0.5, hash(i, 33) - 0.5, hash(i, 34) - 0.5).normalize(), w: 5 + 8 * hash(i, 35) }; });
    const rot = new THREE.Quaternion(), pos = V();
    // two collision proxies for the contact checks (the instanced food is not solid): the armful's box 0.46 x 0.36 x 0.30 and the column above it.
    // They draw nothing (no colour, no depth), so only the checks (hand-in-prop, grip gap) see them; off while the heap's bulk is the solid
    const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const proxyBase = mesh(new THREE.BoxGeometry(0.46, 0.36, 0.30), ghost, P.whole, 0, 0.18, 0), proxyCol = mesh(new THREE.BoxGeometry(0.26, 1, 0.22), ghost, P.whole);
    for (const o of [proxyBase, proxyCol]) { o.castShadow = o.receiveShadow = false; o.frustumCulled = false; }
    return {
      grip: 0,
      apply(ps) {
        const n = clamp(num(ps, P, "n", 14), 0, 64), sway = clamp(num(ps, P, "sway", 0), 0, 14) * DEG, fall = num(ps, P, "fall", 0), Ht = TOP(n);
        const lean = (y) => { if (sway < 1e-4) return [0, y, 0]; const f = y / Ht; return [Ht * (1 - Math.cos(sway * f)) / sway, Ht * Math.sin(sway * f) / sway, sway * f]; };
        let landed = 0;
        for (let i = 0; i < 64; i++) {
          const k = clamp(n - i);
          if (k <= 0) { items.hide(i); continue; }
          const s = STACK[i], [lx, ly, lphi] = lean(s.y);
          const sp = V(s.x + lx, ly, s.z), sq = qAxis(AX.z, -lphi, new THREE.Quaternion()).multiply(stand[i]);
          const tau = fall - FC[i].d;
          if (fall <= 0 || tau <= 0) { items.put(i, sp, sq, backOut(k)); continue; }
          const e = plan[i], h = e.y, y0 = sp.y, vy = 0, Tm = Math.max(0.18, Math.sqrt(Math.max(0, y0 - h) / (G / 2)));
          void vy;
          const v0 = (h - y0 + (G / 2) * Tm * Tm) / Tm;   // the up-kick that lands exactly on the heap place in Tm
          if (tau < Tm) {
            const u = tau / Tm, bul = 0.14 * Math.min(1, y0 / 2.0) * 4 * u * (1 - u);
            pos.set(lerp(sp.x, e.x, u) + bul * 0.7, y0 + v0 * tau - (G / 2) * tau * tau, lerp(sp.z, e.z, u) + bul * 0.7);
            rot.copy(sq).slerp(e.q, sm(u)).premultiply(qAxis(FC[i].ax, FC[i].w * 4 * u * (1 - u), _q2));
            items.put(i, pos, rot, 1);
          } else {
            const tt = tau - Tm; pos.set(e.x, e.y, e.z); rot.copy(e.q);
            if (tt < 0.12) pos.y += 0.02 * 4 * (tt / 0.12) * (1 - tt / 0.12);
            if (e.roll) {   // on from the ring: 0.22 m outward, easing out, to 1.4 s, down onto the cobbles
              const u = clamp((fall - (FC[i].d + Tm)) / Math.max(0.1, 1.4 - FC[i].d - Tm)), f = 1 - (1 - u) * (1 - u), dx = Math.cos(e.th), dz = Math.sin(e.th);
              pos.x += dx * 0.22 * f; pos.z += dz * 0.22 * f; pos.y = lerp(e.y, HALF[e.type], sm(u * 1.4));
              rot.premultiply(qAxis(V(-dz, 0, dx), (0.22 * f) / 0.045, _q2));
            }
            items.put(i, pos, rot, 1);
            landed++;
          }
        }
        items.flush();
        { const up = fall <= 0 && n > 0; proxyBase.visible = up; const colH = Math.max(0, Ht - 0.36); proxyCol.visible = up && colH > 0.02; proxyCol.scale.y = Math.max(0.001, colH); proxyCol.position.set(Ht > 0.36 ? lean(0.36 + colH / 2)[0] : 0, 0.36 + colH / 2, 0); }
        bulk.visible = fall > 0.25 && n > 40;
        const bk = sm((fall - 0.25) / 0.45); bulk.scale.set(1, Math.max(0.01, bk), 1);
        bulk.userData.solid = fall > 0.7;
      },
    };
  },

  // ================================================================================================================
  foodpile(P) {
    const S = P.spec, g = P.whole, lod = 1;
    // four stacked lumps (solid), each a dome over the last: [base, height, radius]
    const LUMPS = [[0, 0.13, 0.255], [0.05, 0.16, 0.245], [0.15, 0.22, 0.23], [0.32, 0.32, 0.2]];
    const pal = ["#c0463a", "#d8842e", "#a5adb3", "#c98f4e", "#8fa24a", "#b9554a"];   // the core is a mass of food seen in shadow: apple, orange, tin, bread, green, plum
    const lumps = LUMPS.map(([b, h, r], s) => {
      const pts = []; for (let k = 0; k <= 4; k++) { const rho = r * (1 - k / 4 * 0.97); pts.push(new THREE.Vector2(Math.max(rho, 0.0001), b + h * (1 - (rho / r) ** 2) ** 0.5)); }
      const geo = new THREE.LatheGeometry(pts.reverse(), 12); paint(geo, (c, x, y, z) => c.set(pal[Math.floor(hash(Math.round(x * 40) * 5 + Math.round(z * 40) * 11 + Math.round(y * 40) * 3 + s, 6) * pal.length)]).lerp(col("#6a4a30"), 0.35));
      const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), g); m.visible = false; return m;
    });
    const surf = (s, rho) => { const [b, h, r] = LUMPS[s]; return b + h * Math.max(0, 1 - (rho / r) ** 2) ** 0.5; };
    // items: [step, type, rho, theta]
    const plan = [];
    const add = (step, type, n, r0, r1, off) => { for (let i = 0; i < n; i++) plan.push({ step, type, rho: lerp(r0, r1, (i + 0.5) / n) * (0.9 + 0.2 * hash(plan.length, 41)), th: (off + i) * 2.39996 + 0.7 * hash(plan.length, 42) }); };
    add(2, "tin", 9, 0.02, 0.185, 0); add(2, "orange", 3, 0.04, 0.13, 3);
    add(3, "apple", 12, 0.02, 0.19, 5);
    add(4, "tin", 3, 0.03, 0.15, 8); add(4, "orange", 2, 0.05, 0.14, 2); add(4, "bread", 2, 0.04, 0.12, 4);
    add(5, "apple", 3, 0.03, 0.12, 6); add(5, "tin", 2, 0.04, 0.10, 1);
    const placed = [];
    for (const it of plan) {
      const x = it.rho * Math.cos(it.th), z = it.rho * Math.sin(it.th);
      let y = Math.max(...[1, 2, 3, 4].filter((s) => s <= Math.min(4, it.step - 1)).map((s) => surf(s - 1, it.rho)), 0.0) + HALF[it.type];
      y = Math.max(y, surf(Math.min(3, it.step - 2), it.rho) + HALF[it.type] * 0.85);
      for (const q of placed) { const d = Math.hypot(x - q.x, z - q.z); if (d < 0.085) y = Math.max(y, q.y + Math.sqrt(0.085 * 0.085 - d * d) * 0.8); }
      it.x = x; it.y = y; it.z = z; it.q = restQuat(plan.indexOf(it) + 200, it.type); placed.push(it);
    }
    const items = new Items(g, plan.map((p) => p.type), lod);
    // peel: 6 curls
    const peelM = mat("#f08a24", { roughness: 0.6, side: THREE.DoubleSide });
    const peel = Array.from({ length: 6 }, (_, i) => { const m = mesh(new THREE.TorusGeometry(0.022, 0.0055, 3, 8, Math.PI * (1.4 + 0.5 * hash(i, 51))), peelM, g, (hash(i, 52) - 0.5) * 0.30, 0.0075, (hash(i, 53) - 0.5) * 0.26); m.rotation.set(-Math.PI / 2 + (hash(i, 54) - 0.5) * 0.8, hash(i, 55) * 1.0, hash(i, 56) * 6.28); m.visible = false; return m; });
    // the broken basket on top (step 4): lying a little tipped, two stubs, no arch, 0.80 scale; a cheese and a ham on top (step 5)
    const bg = new THREE.Group(); g.add(bg); bg.visible = false;
    const bP = { whole: bg, root: P.root, spec: {} }, bsk2 = buildBasket(bP, { lod: 1, stub: true });
    bg.position.set(0.0, 0.50, 0.0); bg.rotation.set(0.14, 0.5, -0.12); bg.scale.setScalar(0.78);
    const cheese = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 12, 1), mat("#f2c85a", { roughness: 0.6 }), g, 0.0, 0.84, 0.0); cheese.visible = false;
    { const wedge = mesh(new THREE.BoxGeometry(0.1, 0.092, 0.07), mat("#fff0a8", { roughness: 0.6 }), cheese, 0.1, 0, 0.05); wedge.rotation.y = 0.6; wedge.castShadow = false; }
    const ham = new THREE.Group(); g.add(ham); ham.visible = false; ham.position.set(0.05, 0.88, -0.04); ham.rotation.set(0, 0.9, 0.15);
    { const hm = mat("#b5543e", { roughness: 0.65 }), s = mesh(new THREE.SphereGeometry(1, 10, 7), hm, ham, 0, 0.07, 0); s.scale.set(0.18, 0.09, 0.10); const bone = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 6), mat("#f2e8d0"), ham, -0.2, 0.07, 0); bone.rotation.z = Math.PI / 2; const kn = mesh(new THREE.SphereGeometry(0.026, 6, 4), mat("#f2e8d0"), ham, -0.25, 0.07, 0); void kn; }
    const solidAt = (s) => { for (let k = 0; k < lumps.length; k++) lumps[k].userData.solid = true; void s; };
    solidAt(0);
    return {
      grip: 0,
      apply(ps) {
        const gr = clamp(num(ps, P, "grow", 0), 0, 5);
        peel.forEach((m, i) => { const k = clamp(gr - 0.0); m.visible = k > 0.001; m.scale.setScalar(Math.max(0.001, backOut(k * 1 - 0 + 0.0))); void i; });
        lumps.forEach((m, k) => { const kk = backOut(gr - (k + 1)); m.visible = gr > k + 1 + 0.001; m.scale.set(1, Math.max(0.01, kk), 1); });
        plan.forEach((it, i) => { const k = gr - (it.step - 1); if (k <= 0.001) items.hide(i); else items.put(i, _p.set(it.x, it.y * 1.0, it.z), it.q, 1.12 * backOut(k)); });
        items.flush();
        const k4 = gr - 3; bg.visible = k4 > 0.001; bg.scale.setScalar(0.78 * Math.max(0.001, backOut(k4)));
        const k5 = gr - 4; cheese.visible = k5 > 0.001; cheese.scale.setScalar(Math.max(0.001, backOut(k5))); ham.visible = k5 > 0.001; ham.scale.setScalar(Math.max(0.001, backOut(k5 - 0.0)));
        void bsk2;
      },
    };
  },

  // ================================================================================================================
  snackfruit(P) {
    const S = P.spec, apple = S.fruit === "apple", R = apple ? 0.043 : 0.045, g = new THREE.SphereGeometry(R, 12, 9), bd = V(...(S.biteDir ?? [0, 0.4, 0.9])).normalize();
    const flesh = apple ? "#f8f3dc" : "#ffe9a8", skin = apple ? "#d8342c" : "#f08a24";
    { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (apple && p.getY(i) > R * 0.85) p.setY(i, p.getY(i) - 0.006); g.computeVertexNormals(); }
    const base = g.attributes.position.array.slice();
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: apple ? 0.5 : 0.62 });
    const cols = new Float32Array(g.attributes.position.count * 3); g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    const m = mesh(g, material, P.whole, 0, S.origin === "centre" ? 0 : R, 0);   // bottom-origin by default: the mug hold's grip 0.66 h is then at the fruit's equator band
    let last = -1;
    const paintBite = (b) => {
      const p = g.attributes.position, nrm = V();
      for (let i = 0; i < p.count; i++) {
        nrm.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]).normalize();
        const ang = Math.acos(clamp(nrm.dot(bd), -1, 1)), inb = b > 0.001 ? clamp(1 - ang / (0.62 * (0.4 + 0.6 * b))) : 0, depth = 0.024 * b * Math.sqrt(inb);
        const rr = R - depth * (inb > 0 ? 1 : 0);
        p.setXYZ(i, nrm.x * rr * (apple ? 1 : 1), nrm.y * rr * (apple && nrm.y > 0.85 ? 0.88 : 1) , nrm.z * rr);
        if (inb > 0.05) _c.set(flesh); else { _c.set(skin); if (apple && nrm.y > 0.88) _c.set("#5a3a1e"); else if (!apple && nrm.y > 0.88) _c.set("#c26a14"); }
        cols[i * 3] = _c.r; cols[i * 3 + 1] = _c.g; cols[i * 3 + 2] = _c.b;
      }
      p.needsUpdate = true; g.attributes.color.needsUpdate = true; g.computeVertexNormals();
    };
    paintBite(0);
    return { grip: 0, apply(ps) { const b = clamp(num(ps, P, "bite", 0)); if (b !== last) { last = b; paintBite(b); } void m; } };
  },

  // ================================================================================================================
  catchdrop(P) {
    const S = P.spec, coin = S.item === "coin", from = V(...(S.from ?? [0, 1, 0])), to = V(...(S.to ?? [0, 0, 0])), hop = S.hop ?? 0, turns = S.turns ?? 2.5;
    const body = new THREE.Group(); P.whole.add(body);
    if (coin) {
      const k = 0.05 / 0.085, gold = mat("#f2c230", { metalness: 0.8, roughness: 0.3 });
      const prof = [[0.0001, -0.0055], [0.07, -0.0055], [0.085, -0.0065], [0.085, 0.0065], [0.07, 0.0055], [0.0001, 0.0055]].map(([x, y]) => new THREE.Vector2(x * k, y * k));
      const lg = new THREE.LatheGeometry(prof, 12); lg.rotateX(Math.PI / 2); mesh(lg, gold, body);
      const emb = mat("#d48a14", { metalness: 0.55, roughness: 0.38 }), eg = new THREE.CircleGeometry(1, 10); eg.scale(0.031 * k, 0.038 * k, 1);
      for (const s of [1, -1]) { const e = mesh(eg, emb, body, 0, -0.006 * k, s * 0.0058 * k); e.rotation.y = s > 0 ? 0 : Math.PI; e.castShadow = false; }
    } else mesh(itemGeos(0).orange, itemMats().orange, body);
    const v0 = Math.sqrt(2 * G * hop), dy = from.y - to.y, T = (v0 + Math.sqrt(v0 * v0 + 2 * G * dy)) / G;
    return {
      grip: 0, T,
      apply(ps) {
        const d = num(ps, P, "drop", 0), u = clamp(d / T);
        _p.set(lerp(from.x, to.x, u), from.y + v0 * Math.min(d, T) - 0.5 * G * Math.min(d, T) ** 2, lerp(from.z, to.z, u));
        if (d >= T) _p.copy(to);
        body.position.copy(_p);
        if (coin) body.quaternion.setFromAxisAngle(AX.x, turns * Math.PI * 2 * u);
        else { const dx = to.x - from.x, dz = to.z - from.z, L = Math.hypot(dx, dz) || 1; body.quaternion.setFromAxisAngle(V(dz / L, 0, -dx / L), 4 * Math.PI * u); }
      },
    };
  },

  // ================================================================================================================
  foodrain(P) {
    const S = P.spec, down = S.mode === "down", N = 26, types = Array.from({ length: N }, (_, i) => typeAt(i + 3)), items = new Items(P.whole, types, 1);
    const from = V(...(S.from ?? [0, 0.50, 0])), back = V(...(S.back ?? [0, 0, -1])).normalize(), accel = S.accel ?? 2.4, to = V(...(S.to ?? [0, 0, 0])), r = S.r ?? 0.10;
    const spin = types.map((t, i) => ({ ax: V(hash(i, 61) - 0.5, hash(i, 62) - 0.5, hash(i, 63) - 0.5).normalize(), w: 4 + 8 * hash(i, 64), q0: restQuat(i + 300, t) }));
    const side = V().crossVectors(AX.y, back).normalize();
    return {
      grip: 0,
      apply(ps) {
        for (let i = 0; i < N; i++) {
          let on = false;
          if (down) {
            const tau = num(ps, P, "rain", 0) - 0.085 * i, y = to.y + 4.2 - 0.5 * G * tau * tau;
            if (tau > 0 && y > to.y - 0.03) { const a = hash(i, 65) * Math.PI * 2, rr = r * 0.8 * Math.sqrt(hash(i, 66)); on = true; _p.set(to.x + rr * Math.cos(a), y, to.z + rr * Math.sin(a)); _q.copy(spin[i].q0).premultiply(qAxis(spin[i].ax, spin[i].w * tau, _q2)); }
          } else {
            const tau = num(ps, P, "fly", 0) - 0.12 * i;
            if (tau > 0 && tau < 1.2) {
              const Hh = 0.8 + 0.8 * hash(i, 67), v0 = Math.sqrt(2 * G * Hh), lat = (hash(i, 68) - 0.5) * 0.5;
              on = true; _p.copy(from).addScaledVector(AX.y, v0 * tau - 0.5 * G * tau * tau).addScaledVector(back, 0.5 * accel * tau * tau * (0.7 + 0.5 * hash(i, 69))).addScaledVector(side, lat * tau).addScaledVector(side, (hash(i, 70) - 0.5) * 0.2);
              _q.copy(spin[i].q0).premultiply(qAxis(spin[i].ax, spin[i].w * tau, _q2));
            }
          }
          if (on) items.put(i, _p, _q, 1); else items.hide(i);
        }
        items.flush();
      },
    };
  },

  // ================================================================================================================
  hoodsack(P) {
    const S = P.spec, RC = V(...(S.ring ?? [-0.55, 0.41, 0.12])), lean = (S.lean ?? 15) * DEG, R = 0.17, collar = V(...(S.collar ?? [0, 0.55, -0.24]));
    const nrm = V(0, Math.cos(lean), Math.sin(lean)), u = V(1, 0, 0), w = new THREE.Vector3().crossVectors(u, nrm).normalize(), uu = new THREE.Vector3().crossVectors(nrm, w).normalize();
    const cloth = mat("#7a716c", { roughness: 0.92 }), inside = mat("#5c5450", { roughness: 0.95, side: THREE.BackSide }), outside = mat("#7a716c", { roughness: 0.92 });
    // the rolled mouth
    const ringG = new THREE.TorusGeometry(R, 0.022, 6, 20), ring = mesh(ringG, cloth, P.whole); ring.position.copy(RC); ring.quaternion.setFromUnitVectors(AX.z, nrm);
    // the tail: a flattened funnel from the collar's back over the right shoulder to the ring's body side
    const near = RC.clone().addScaledVector(uu, R * (RC.x < 0 ? 1 : -1)).add(V(0, 0.01, 0));
    const curve = new THREE.CatmullRomCurve3([collar.clone(), V(collar.x * 0.4 + RC.x * 0.25, collar.y + 0.17, collar.z + 0.02), V(RC.x * 0.55, collar.y + 0.20, -0.02), near.clone().add(V(RC.x * 0.12, 0.17, -0.02)), near.clone().add(V(0, 0.01, 0))], false, "catmullrom", 0.5);
    const tailPts = curve.getPoints(12), tailG = sweepGeo(tailPts, 8, (t) => [lerp(0.05, 0.15, sm(t)), lerp(0.03, 0.05, t)], V(0, 1, 0));
    mesh(tailG, outside, P.whole); const tailIn = mesh(tailG, inside, P.whole); tailIn.castShadow = false;
    // two drawstring ends at the collar
    const strM = mat("#f2d8bd", { roughness: 0.8 });
    for (const sx of [-1, 1]) { const c = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 5), strM, P.whole, collar.x + sx * 0.04, collar.y - 0.02, collar.z + 0.02); c.rotation.z = sx * 0.2; }
    // the belly: a bag under the ring, rebuilt when fill changes
    const NU = 14, NV = 5, belly = gridGeo(NU, NV, () => [0, 0, 0], true);
    const bOut = mesh(belly, outside, P.whole), bIn = mesh(belly, inside, P.whole); bIn.castShadow = false; void bOut;
    const bumps = [0, 1, 2].map((i) => mesh(new THREE.SphereGeometry(0.05, 7, 5), cloth, P.whole));
    let last = -1;
    const build = (f) => {
      const sag = lerp(0.10, 0.34, f), p = belly.attributes.position;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const v = j / NV, th = (i / NU) * Math.PI * 2, rr = R * Math.pow(Math.cos(v * Math.PI / 2), 0.7), dep = sag * Math.pow(Math.sin(v * Math.PI / 2), 1.1);
        const q = RC.clone().addScaledVector(uu, rr * Math.cos(th)).addScaledVector(w, rr * Math.sin(th)); q.y -= dep; p.setXYZ(j * (NU + 1) + i, q.x, q.y, q.z);
      }
      p.needsUpdate = true; belly.computeVertexNormals(); belly.computeBoundingSphere();
      bumps.forEach((b, i) => { const k = sm((f - 0.12 - i * 0.22) / 0.25), a = 1.0 + i * 2.2, rr = 0.07 * (1 - i * 0.12); b.position.copy(RC).addScaledVector(uu, rr * Math.cos(a) * 0.8).addScaledVector(w, rr * Math.sin(a) * 0.8); b.position.y -= sag * (0.78 - 0.1 * i); b.scale.setScalar(Math.max(0.001, k)); b.visible = k > 0.01; });
    };
    P.whole.traverse((o) => { if (o.isMesh) o.userData.solid = false; });   // not solid: a cloth worn on the body
    if (S.wear) wearSquash(P);
    const hood = { grip: 0, apply(ps) { const f = clamp(num(ps, P, "fill", 0)); if (f !== last) { last = f; build(f); } } };
    return hood;
  },

  // ================================================================================================================
  wickerbasket(P) {
    const S = P.spec, B = buildBasket(P, { lod: 0, stub: !!S.stub }), g = P.whole;
    const appleIdx = []; for (let i = 0; i < 18; i++) if (FILL_TYPES[i] === "apple") appleIdx.push(i);
    const spillOrder = appleIdx.slice().sort((a, b) => FILL[b].y - FILL[a].y || a - b);   // the top layer leaves first
    const rank = new Map(spillOrder.map((i, k) => [i, k]));
    const STOP = [0.95, 1.05, 1.15, 1.25, 1.30, 1.40, 1.45, 1.52, 1.60];
    const rq = (i) => restQuat(i + 100, FILL_TYPES[i]), inv = new THREE.Matrix4(), tmp = V(), mouth = V(), p0 = V(), e = V(), m2 = V();
    return {
      grip: 0, anchors: {},
      apply(ps) {
        const fill = clamp(num(ps, P, "fill", 0)), snap = num(ps, P, "snap", 0), spill = num(ps, P, "spill", 0);
        if (B.handle) B.handle.update(snap);
        B.setFill(fill, null);
        if (spill > 0 && fill > 0) {
          P.root.updateMatrix(); inv.copy(P.root.matrix).invert();
          const fy = S.floorY ?? 0, sp = S.spillTo ?? [P.root.position.x + 0.1, P.root.position.z - 0.4];
          mouth.set(0, BK.H, 0).applyMatrix4(P.root.matrix);
          for (const i of appleIdx) {
            const k = rank.get(i), dk = 0.04 + 0.05 * k, S1 = 0.18, tau = spill - dk;
            p0.set(FILL[i].x, FILL[i].y, FILL[i].z).applyMatrix4(P.root.matrix);
            const out = V(mouth.x + 0.06, fy + 0.04, mouth.z + (hash(k, 81) - 0.5) * 0.06);
            if (k < 3) e.set(sp[0] + [0, 0.085, 0.04][k], fy + 0.04, sp[1] + [0, 0.03, -0.075][k]); else e.set(mouth.x + 0.30 + (k - 3) * 0.24, fy + 0.04, mouth.z + 0.14 * Math.sin(k * 2.1));
            const D = Math.max(0.2, STOP[k] - dk - S1);
            if (tau <= 0) { B.items.put(i, _p.copy(tmp.copy(p0).applyMatrix4(inv)), rq(i), 1); continue; }
            let wp = V(), q = rq(i).clone();
            if (tau < S1) { const u = tau / S1; wp.copy(p0).lerp(out, u * u); wp.y = lerp(p0.y, out.y, u * u) + 0.06 * 4 * u * (1 - u); q.premultiply(qAxis(AX.z, -u * 2.0, _q2)); }
            else { const u = clamp((tau - S1) / D), f = 1 - (1 - u) * (1 - u); wp.copy(out).lerp(e, f); wp.y = fy + 0.04 + (u < 0.15 ? 0.03 * 4 * (u / 0.15) * (1 - u / 0.15) : 0); const dist = out.distanceTo(e) * f; m2.set(e.z - out.z, 0, -(e.x - out.x)).normalize(); q.premultiply(qAxis(m2, dist / 0.04, _q2)); q.premultiply(qAxis(AX.z, -2.0, new THREE.Quaternion())); }
            wp.applyMatrix4(inv);
            // the orientation is given in the parent frame: bring it into the prop's
            const pq = new THREE.Quaternion().setFromRotationMatrix(inv); q.premultiply(pq);
            B.items.put(i, wp, q, 1);
          }
          B.items.flush();
        }
        void g;
      },
    };
  },
};

// Named pin points in each prop's own frame (arm poses with { prop, grip: [x, y, z] } take these numbers; DESIGN 3 panels 05, 07a, 09)
export const CART_GOODS_GRIPS = {
  wickerbasket: { arch: [0, 0.42, 0], archL: [-0.025, 0.42, 0], archR: [0.025, 0.42, 0], stubL: [-0.26 - 0.12 * Math.sin(STUBLEAN) * 0.5, 0.20 + 0.12 * Math.cos(STUBLEAN) * 0.5, 0], stubR: [0.26 + 0.12 * Math.sin(STUBLEAN) * 0.5, 0.20 + 0.12 * Math.cos(STUBLEAN) * 0.5, 0] },
  hoodsack: { near: [-0.55, 0.41 - 0.17 * Math.sin(15 * DEG), 0.12 + 0.17 * Math.cos(15 * DEG)], far: [-0.55, 0.41 + 0.17 * Math.sin(15 * DEG), 0.12 - 0.17 * Math.cos(15 * DEG)] },
};
// state keys of the kinds (props3d's KIT_STATE format): a `prop` action tweens these; defaults
export const CART_GOODS_STATE = {
  foodtower: { n: 14, sway: 0, fall: 0 },
  foodpile: { grow: 0 },
  snackfruit: { bite: 0 },
  catchdrop: { drop: 0 },
  foodrain: { fly: 0, rain: 0 },
  hoodsack: { fill: 0 },
  wickerbasket: { fill: 0, snap: 0, spill: 0 },
};
