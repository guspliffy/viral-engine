import * as THREE from "three";
import { clamp } from "./util.js";

// How you invented 02 "The shopping cart", task C: the first cart (`chaircart`) and its chain (`lockchain`).
// Design: storyboards/series/how-you-invented/02-shopping-cart/DESIGN.md 2.7, 2.8, 3, 6. Metres, +x screen right, +y up, +z toward the lens.
// Every mark is drawn once from a fixed table (the seeded `hash` below): no Math.random, no clock, nothing keeps a mesh between frames
// except by exact inputs, nothing tweens a material opacity (things appear by `visible` or by scale). No letter and no digit anywhere.
// Registry (props3d.js, already wired): CART_CHAIR_KINDS, CART_CHAIR_GRIPS (EMPTY: nothing here is held by a grip; the gloves on the
// rail, the lock and the pedal are arm poses of the director, so there is no in-hand proof), CART_CHAIR_STATE (the keys below, so a
// `prop` action TWEENS them; every key also reads its spec value as the start value).
//
// ===== chaircart   ORIGIN: the ground under the seat's middle; the front (the basket side) is +z, the rail is at the back (-z).
//   A small plank chair on four wooden wheels with a basket on its seat. Wood of the kit `woodchair` (#a2703f, dark #7d5230).
//   Placed in the row / on the hill with rot 180 (front downhill); `tip` 14 leans the front down about the origin (the wheels then
//   stand on a 14 degree slope that passes through the origin). ONE prop, about 3 900 triangles (budget 4 500). Solid except the
//   basket's items. NOT held: it moves by its own x, y, z, rot, tip tweens (the wheels need `spin`, below).
//   SIZES  seat 0.44 x 0.40, top y 0.24, 0.03 thick; 4 legs 0.04 square; back posts (z -0.20) up to 0.52; top rail 0.44 x 0.05, its
//          top at 0.50; slat top at 0.40. Wheels r 0.06, 0.035 thick at (+-0.24, 0.06, +-0.17), track 0.48. Basket rim at 0.44.
//          Total length 0.50 without the step; the step board reaches back to z -0.47.
//   RAIL GRIP POINTS (prop frame, where a glove pinned on the rail goes): RL (-0.17, 0.475, -0.20), RR (+0.17, 0.475, -0.20).
//          With rot 180 they are at (x - -0.17.. i.e. the prop's x - local x, 0.475, z + 0.20): the pusher stands on the +z side.
//   STEP   a board 0.40 x 0.10 on two cleats from the back legs at y 0.10 (top), centred z -0.42: both boots stand on it when a
//          body rides behind the rail: ride off [0, 0.10, -0.42].
//   RIDING (director): behind the rail (Spud) ride off [0, 0.10, -0.42]; in the basket, backwards (Mash) ride off [0, 0.32, 0.02],
//          sit: true, yaw 180. NOTE: `ride` turns the offset with the prop's `rot` only, never with `tip`: a rider on the slope stays
//          upright while the cart leans 14 degrees about the seat's middle (the seat shifts only 0.05 at the basket's ends).
//   SPEC KEYS (default)
//     lock   false  true builds the lock box on the rail's local +x end, centre (0.17, 0.47, -0.25), 0.10 x 0.08 x 0.06, face toward
//                   -z (the pusher), iron #8d959c / #5f666c, 4 rivets, a coin slot 0.092 x 0.014 in its top (the design's 0.11 is wider
//                   than a 0.10 box and than the coin's 0.094 chord at a third in: it is 0.092 here), a keyhole-shaped tab hole in
//                   its outer side (local x +0.22, the chain's `b`), and an iron eye on the top of the back right post (0.20, 0.53,
//                   -0.20) that holds the next chair's chain.
//     brake  false  true builds the stick brake: a pale new-wood stick 0.36 long on the back right leg (pivot (0.24, 0.15, -0.20)),
//                   a block 0.06 x 0.05 x 0.04 on a leather strap over the back right wheel's tread (0.012 clear), a flat pedal
//                   0.08 x 0.06 at (0.24, 0.27, -0.50). NOTE the key `brake` is a number: seed `brake: 0` at t 0 with a duration-0
//                   `prop` action (spec true reads as 0 until then).
//     basket 1      0 hides the basket and its items (and the stubs).
//     fill   0      0..1: the heap in the basket, 18 items to 0.10 over the rim (0.54 world), they appear bottom-up, one by one.
//   STATE KEYS (tween with `prop`)
//     spin   0   turns of the four wheels. Tween it with the travel: distance / 0.377 per turn; rolling toward the prop's local +z
//                (front) is a positive spin. The wheels show their own boards and battens, so a sliding wheel is visible.
//     brake  0   0..1: pedal down 0.07, the block drops onto the tread (touching from about 0.95); from 0.9 the back right wheel is
//                the director's to stop: this kind has no memory, so HOLD `spin` (end its tween) when `brake` passes 0.9.
//     jolt   0   0..1 (tween 0 to 1): the basket items hop 0.03 once (a sine; the upper layers a little later).
//     fill   0   see above.      basket 1   see above.
//   NOTE the basket here is a PLACEHOLDER with the numbers of DESIGN 2.6 (oval 0.52 x 0.40 at the rim, 0.42 x 0.32 at the foot, 0.20
//   tall, willow weave, rim roll 0.03, two stubs 0.12 long leaning 25 degrees out at the long axis ends); task B's `wickerbasket`
//   replaces it when that kind exists. The 18 heap items are plain balls (apple, orange, potato, bread, greens).
//
// ===== lockchain   ORIGIN: the world origin (spec x, y, z, rot, scale stay 0 / 0 / 0 / 0 / 1: its points are absolute).
//   20 oval iron links (#7d858c, wire 0.006, centre-line length 0.035, pitch 0.035: 0.70 m) from `a` to `b`, hanging in a catenary
//   0.06 deep; at the `b` end a flat tab 0.05 long with a round head, sitting in the lock box's tab hole. ~780 triangles. Not held,
//   not solid. SPEC KEYS (default)
//     chair  5      1..5 picks both points from the row of DESIGN 3 (chairs at x 0.95, z 0.75 + 0.62 (n - 1), rot 180): `b` = the tab
//                   hole of chair n's box (0.73, 0.47, z + 0.25), `a` = the eye of chair n - 1 (0.75, 0.53, z - 0.62 + 0.20); for
//                   n = 1 `a` is a wall ring at (0.75, 0.53, 0.33).
//     a      [x, y, z]   the fixed end (the eye or the wall ring), world; wins over `chair`.
//     b      [x, y, z]   the tab hole (the box's outer face), world; wins over `chair`.
//     in     [1, 0, 0]   the direction the tab goes INTO the hole (for a chair with rot 180: +x). The tab's outer end lies 0.02 outside.
//     floor  0.012       the world y the chain lies on after it falls.
//     ring   false       true draws a small iron ring at `a` (a wall ring; the chair eyes are drawn by `chaircart` with lock: true).
//     sag    0.06        the catenary's depth at `taut` 0. With the design's 0.06 the middle of chain 4-5 dips to y 0.44 over the
//                        basket's rim (0.44 to 0.455, its end 0.03 inside the chain): a link then crosses the rim. 0.03 clears it.
//   STATE KEYS
//     pop    0   0 = locked; then seconds since it let go (tween linearly, e.g. 0 to 2 over 2 s). The tab jumps 0.03 out of the hole in
//                2 frames (0.067 s), the chain swings down about `a` and hangs straight at 0.35 s, then two damped swings of 8 degrees
//                (period 0.5 s); the part of it longer than the drop to `floor` lies on the cobbles toward where it came from. It hangs
//                from the eye's far edge (0.035 further along where it came from), so it hangs beside the post, not through it.
//     taut   0   0..1: the catenary pulls straight (depth 0.06 to 0), the links stand in line.
//   Five props make the row: ring to chair 1, then 1 to 2 ... 4 to 5.

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---------------------------------------------------------------- textures and materials (drawn once per page)
const CACHE = {};
const once = (k, f) => (CACHE[k] ||= f());
// plank grain: vertical = lines run down the canvas (legs, posts, the seat's boards); else they run across (rail, slat, step, stick)
function woodTex(seed, base, vertical) {
  return canvasTex(vertical ? 128 : 256, vertical ? 256 : 128, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(70,44,22,${0.10 + hash(seed + i) * 0.2})`; g.lineWidth = 1 + hash(seed + i + 50) * 2.2; g.beginPath();
      if (vertical) { const x = hash(seed + i + 9) * W; g.moveTo(x, 0); g.bezierCurveTo(x + 6 - hash(seed + i + 3) * 12, H * 0.3, x + 6 - hash(seed + i + 4) * 12, H * 0.7, x + 4 - hash(seed + i + 5) * 8, H); }
      else { const y = hash(seed + i + 9) * H; g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 6 - hash(seed + i + 3) * 12, W * 0.7, y + 6 - hash(seed + i + 4) * 12, W, y + 4 - hash(seed + i + 5) * 8); }
      g.stroke();
    }
    for (let k = 0; k < 2; k++) { const x = (0.25 + hash(seed + k * 11) * 0.5) * W, y = (0.2 + hash(seed + k * 13 + 1) * 0.6) * H; g.fillStyle = "rgba(60,36,18,0.6)"; g.beginPath(); g.ellipse(x, y, vertical ? 7 : 13, vertical ? 12 : 7, 0, 0, TAU); g.fill(); }
  });
}
const woodM = () => once("wood", () => ({
  light: mat("#ffffff", { map: woodTex(9, "#a2703f", true), roughness: 0.85 }), lightH: mat("#ffffff", { map: woodTex(11, "#a2703f", false), roughness: 0.85 }),
  dark: mat("#ffffff", { map: woodTex(21, "#7d5230", true), roughness: 0.9 }), darkH: mat("#ffffff", { map: woodTex(23, "#7d5230", false), roughness: 0.9 }),
  rim: mat("#8a5e34", { roughness: 0.9 }), pale: mat("#ffffff", { map: woodTex(31, "#d9b77a", false), roughness: 0.85 }),
  iron: mat("#3a3a40", { roughness: 0.5, metalness: 0.5 }), strap: mat("#5a3a22", { roughness: 0.9 }),
  lock: mat("#8d959c", { roughness: 0.45, metalness: 0.55 }), lockDark: mat("#5f666c", { roughness: 0.5, metalness: 0.5 }), hole: mat("#1d1f22", { roughness: 0.9 }),
}));
// the wheel's face: 3 boards (two seams) and two cross battens, nail dots at the batten ends. Canvas u = the wheel's z, v = its y
const wheelFace = () => once("wheelface", () => {
  const t = canvasTex(128, 128, (g, W, H) => {
    g.fillStyle = "#a2703f"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) { g.strokeStyle = `rgba(70,44,22,${0.12 + hash(40 + i) * 0.2})`; g.lineWidth = 1 + hash(60 + i) * 1.6; const x = hash(80 + i) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 3 - hash(100 + i) * 6, H); g.stroke(); }
    g.fillStyle = "#6b4426"; g.fillRect(W * 0.33 - 1.5, 0, 3, H); g.fillRect(W * 0.67 - 1.5, 0, 3, H);                 // the two seams
    for (const v of [0.22, 0.78]) { g.fillStyle = "#7d5230"; g.fillRect(0, H * v - 7, W, 14); g.fillStyle = "rgba(30,18,10,0.45)"; g.fillRect(0, H * v + 5, W, 3); }   // two battens, each with a shade edge
    g.fillStyle = "#2b2b30"; for (const v of [0.22, 0.78]) for (const u of [0.2, 0.5, 0.8]) { g.beginPath(); g.arc(W * u, H * v, 2.6, 0, TAU); g.fill(); }
    g.fillStyle = "#2b2b30"; g.beginPath(); g.arc(W / 2, H / 2, 7, 0, TAU); g.fill();
  });
  return mat("#ffffff", { map: t, roughness: 0.85 });
});
const weaveTex = () => once("weave", () => canvasTex(352, 144, (g, W, H) => {
  const NS = 22, NR = 9, cw = W / NS, ch = H / NR;
  g.fillStyle = "#c79a55"; g.fillRect(0, 0, W, H);
  for (let r = 0; r < NR; r++) for (let s = 0; s < NS; s++) {
    const over = (s + r) % 2 === 0, x = s * cw, y = r * ch;
    g.fillStyle = over ? "#e0bb7a" : "#c79a55"; g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    g.fillStyle = over ? "#9a7238" : "#b98a48"; g.fillRect(x, y + ch - 2, cw, 2); g.fillRect(x + cw - 2, y, 2, ch);
    if (hash(r * 40 + s) > 0.8) { g.fillStyle = "rgba(255,230,170,0.35)"; g.fillRect(x + 3, y + 3, cw - 8, 2); }
  }
}));

// ---------------------------------------------------------------- the chair
const WHEELS = [[1, 1], [-1, 1], [1, -1], [-1, -1]];   // [sx, sz]: front right, front left, back right, back left
const HEAP = (() => {   // 18 items in four layers: [x, y, z, r, colour] in the basket's frame (y 0 = its bottom), peak 0.30 = rim 0.20 + 0.10
  const cols = ["#c0392b", "#e08a2c", "#8c6a3f", "#6f9a43", "#d9b36a", "#b8452f"], out = [];
  const layer = (n, y, rx, rz, a0) => { for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU, i = out.length; out.push({ x: Math.cos(a) * rx, y, z: Math.sin(a) * rz, r: 0.043 + 0.006 * hash(i + 3), c: cols[(i * 5 + 1) % cols.length], lag: [0, 0.04, 0.08, 0.12][out.length < 6 ? 0 : out.length < 11 ? 1 : out.length < 15 ? 2 : 3], ph: hash(i + 9) * TAU }); } };
  layer(6, 0.07, 0.15, 0.10, 0.17); layer(5, 0.13, 0.09, 0.06, 0.63); layer(4, 0.19, 0.07, 0.04, 0.35); layer(3, 0.245, 0.03, 0.02, 0.0);
  return out;
})();

function buildBasket(parent, M) {
  const g = new THREE.Group(); g.position.set(0, 0.24, 0.03); parent.add(g);
  const wm = once("weavemat", () => { const t = weaveTex(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); return mat("#ffffff", { map: t, roughness: 0.9, side: THREE.DoubleSide }); });
  const wall = mesh(new THREE.CylinderGeometry(1, 0.42 / 0.52, 0.20, 22, 2, true), wm, g, 0, 0.10, 0); wall.scale.set(0.26, 1, 0.20);
  const floor = mesh(new THREE.CircleGeometry(1, 22), mat("#9a7238", { roughness: 0.9 }), g, 0, 0.012, 0); floor.rotation.x = -Math.PI / 2; floor.scale.set(0.205, 0.158, 1);
  const rimPts = Array.from({ length: 22 }, (_, i) => new THREE.Vector3(Math.cos((i / 22) * TAU) * 0.26, 0.20, Math.sin((i / 22) * TAU) * 0.20));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 30, 0.015, 4, true), mat("#d2a860", { roughness: 0.85 }), g);
  const stubs = [];
  for (const s of [-1, 1]) {   // the two arch stubs (the arch is gone: DESIGN 2.6 `stub 1`): 0.12 long, leaning 25 degrees out
    const pivot = new THREE.Group(); pivot.position.set(s * 0.255, 0.20, 0); pivot.rotation.z = -s * 25 * DEG; g.add(pivot);
    mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.12, 5), mat("#b98a48", { roughness: 0.9 }), pivot, 0, 0.06, 0); stubs.push(pivot);
  }
  const items = HEAP.map((h) => { const o = mesh(new THREE.IcosahedronGeometry(1, 1), mat(h.c, { roughness: 0.7 }), g, h.x, h.y, h.z); o.scale.setScalar(h.r); o.castShadow = true; o.userData.solid = false; return o; });
  return { g, items };
}

function chaircart(P) {
  const S = P.spec, M = woodM(), root = P.whole;
  // ---- the chair
  box(0.44, 0.03, 0.40, M.light, root, 0, 0.225, 0);                                   // seat, top 0.24
  box(0.003, 0.032, 0.40, M.dark, root, 0, 0.2255, 0);                                 // the gap line between its two boards
  for (const sx of [-1, 1]) {
    box(0.04, 0.11, 0.04, M.dark, root, sx * 0.20, 0.155, 0.18);                       // front legs, y 0.10 to 0.21
    box(0.04, 0.42, 0.04, M.dark, root, sx * 0.20, 0.31, -0.20);                       // back posts, y 0.10 to 0.52
    box(0.05, 0.07, 0.07, M.dark, root, sx * 0.20, 0.065, 0.17);                       // the four blocks nailed under the legs
    box(0.05, 0.07, 0.07, M.dark, root, sx * 0.20, 0.065, -0.17);
    for (const [bz, k] of [[0.17, 1], [-0.17, -1]]) for (const [nx, ny, bend] of [[-0.011, 0.082, 0.45], [0.011, 0.05, -0.4]]) {   // two bent nails showing on each block's outer z face
      const nl = box(0.004, 0.004, 0.02, M.iron, root, sx * 0.20 + nx, ny, bz + k * 0.04); nl.rotation.set(k * bend, 0, 0);
    }
    box(0.025, 0.03, 0.27, M.darkH, root, sx * 0.185, 0.085, -0.335);                  // the step's two cleats, from the back legs
  }
  box(0.44, 0.05, 0.03, M.lightH, root, 0, 0.475, -0.20);                                // the top rail, top at 0.50
  box(0.40, 0.04, 0.025, M.lightH, root, 0, 0.38, -0.20);                              // the slat, y 0.36 to 0.40
  box(0.40, 0.025, 0.10, M.lightH, root, 0, 0.0875, -0.42);                            // the step, top at 0.10
  // ---- wheels: [right, left] x [front, back]; each a spinner group turned by `spin`
  const spinners = [];
  for (const [sx, sz] of WHEELS) {
    const pos = new THREE.Group(); pos.position.set(sx * 0.24, 0.06, sz * 0.17); root.add(pos);
    const sp = new THREE.Group(); pos.add(sp);
    const disc = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.035, 20), [M.rim, wheelFace(), wheelFace()], sp); disc.rotation.z = Math.PI / 2;
    for (const v of [-1, 1]) { const b = box(0.008, 0.012, 0.09, M.darkH, sp, sx * 0.0215, v * 0.032, 0); b.castShadow = true; }   // two battens standing off the outer face
    const hub = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8), M.iron, sp, sx * 0.0235, 0, 0); hub.rotation.z = Math.PI / 2;   // the iron nail head
    spinners.push({ sp, sx, sz });
  }
  // ---- the stick brake
  let brake = null;
  if (S.brake) {
    const PIV = new THREE.Vector3(0.24, 0.15, -0.20);
    const stickG = new THREE.Group(); stickG.position.copy(PIV); root.add(stickG);
    const stick = box(0.03, 0.02, 0.36, M.pale, stickG, 0, 0, -0.143); stick.castShadow = true;   // runs from +0.037 (short end) to -0.323 (pedal end)
    mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 8), M.iron, stickG, 0, 0, 0).rotation.z = Math.PI / 2;   // the pivot nail
    const pedal = box(0.08, 0.012, 0.06, M.pale, stickG, 0, 0.005, -0.323);
    const block = box(0.06, 0.04, 0.05, M.pale, root, 0.24, 0.152, -0.166);
    const strap = box(0.02, 0.003, 1, M.strap, root, 0.24, 0.17, -0.18); strap.castShadow = false;
    brake = { stickG, pedal, block, strap, PIV };
  }
  // ---- the lock box and the eye
  if (S.lock) {
    const lk = new THREE.Group(); root.add(lk);
    box(0.10, 0.08, 0.06, M.lock, lk, 0.17, 0.47, -0.25);
    box(0.092, 0.003, 0.014, M.hole, lk, 0.17, 0.5115, -0.25);                         // the coin slot in the top
    box(0.094, 0.004, 0.018, M.lockDark, lk, 0.17, 0.5105, -0.25).castShadow = false;
    for (const [ux, uy] of [[-0.04, -0.03], [0.04, -0.03], [-0.04, 0.03], [0.04, 0.03]]) {   // four rivets on the face toward -z
      mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 6), M.lockDark, lk, 0.17 + ux, 0.47 + uy, -0.2825).rotation.x = Math.PI / 2;
    }
    const hole = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 10), M.hole, lk, 0.2215, 0.47, -0.25); hole.rotation.z = Math.PI / 2;    // keyhole: round head ...
    box(0.004, 0.02, 0.008, M.hole, lk, 0.2215, 0.452, -0.25);                                                                                     // ... and its slot
    const eye = mesh(new THREE.TorusGeometry(0.011, 0.003, 3, 8), M.iron, lk, 0.20, 0.5345, -0.20);                                               // the iron eye, in the x-y plane
    box(0.006, 0.01, 0.006, M.iron, lk, 0.20, 0.526, -0.20);
  }
  // ---- the basket and its heap
  const bk = buildBasket(root, M);
  const lagOf = bk.items.map((_, i) => HEAP[i].lag);
  return {
    grip: 0,
    apply(ps) {
      const spin = typeof ps.spin === "number" ? ps.spin : 0;
      const bkk = typeof ps.brake === "number" ? clamp(ps.brake) : 0, jolt = clamp(typeof ps.jolt === "number" ? ps.jolt : 0);
      const fill = clamp(typeof ps.fill === "number" ? ps.fill : 0), showB = (typeof ps.basket === "number" ? ps.basket : 1) > 0.5;
      for (const w of spinners) w.sp.rotation.x = spin * TAU;
      bk.g.visible = showB;
      if (showB) bk.items.forEach((o, i) => {
        const h = HEAP[i], k = clamp(fill * HEAP.length - i), hop = 0.03 * Math.sin(Math.PI * clamp((jolt - lagOf[i]) / (1 - lagOf[i])));
        o.visible = k > 0.001; o.scale.setScalar(Math.max(0.0001, h.r * smooth(k))); o.position.set(h.x, h.y + hop, h.z);
      });
      if (brake) {
        const k = smooth(bkk), phi = (21.8 - 12.9 * k) * DEG;   // the stick's rise about its pivot: pedal 0.07 lower at k 1
        brake.stickG.rotation.x = phi;
        brake.pedal.rotation.x = -phi;                          // the pedal plate stays flat
        // the block hangs on its strap under the short end and drops onto the tread: 0.012 clear at k 0, 0.002 into the tread at k 1
        const sn = Math.sin(phi), cs = Math.cos(phi), endY = brake.PIV.y - 0.037 * sn, endZ = brake.PIV.z + 0.037 * cs;
        const by = 0.152 - 0.014 * k;
        brake.block.position.set(0.24, by, endZ);
        // the leather strap hinge: from the stick's top 0.03 back from its end to the block's top; it stretches as the block drops
        const p1y = endY + 0.03 * sn + 0.011 * cs, p1z = endZ - 0.03 * cs + 0.011 * sn, p2y = by + 0.022, p2z = endZ + 0.005;
        const dy = p2y - p1y, dz = p2z - p1z, len = Math.hypot(dy, dz);
        brake.strap.scale.z = len; brake.strap.position.set(0.24, (p1y + p2y) / 2, (p1z + p2z) / 2); brake.strap.rotation.x = -Math.atan2(dy, dz);
      }
    },
  };
}

// ---------------------------------------------------------------- the chain
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const NL = 20, PITCH = 0.035;
function lockchain(P) {
  const S = P.spec, M = woodM();
  const n = Math.max(1, Math.min(5, Math.round(S.chair ?? 5))), zOf = (k) => 0.75 + 0.62 * (k - 1);
  const A = V(...(S.a ?? [0.75, 0.53, zOf(n - 1) + 0.20])), B = V(...(S.b ?? [0.73, 0.47, zOf(n) + 0.25]));
  const D = V(...(S.in ?? [1, 0, 0])).normalize(), FLOOR = S.floor ?? 0.012, SAG = S.sag ?? 0.06;
  const ironM = mat("#7d858c", { roughness: 0.4, metalness: 0.6 });
  const linkGeo = new THREE.TorusGeometry(PITCH / 2, 0.003, 3, 6); linkGeo.scale(1, 0.55, 1);
  const links = Array.from({ length: NL }, () => { const o = new THREE.Mesh(linkGeo, ironM); o.castShadow = true; o.userData.solid = false; P.whole.add(o); return o; });
  const tab = new THREE.Group(); P.whole.add(tab);
  const tm = mat("#6d747a", { roughness: 0.4, metalness: 0.6 });
  mesh(new THREE.BoxGeometry(0.038, 0.016, 0.003), tm, tab, 0.019, 0, 0).userData.solid = false;     // along +x of the tab frame (origin = the outer end); its inner end is +x
  mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.003, 8), tm, tab, 0.0385, 0, 0).rotation.x = Math.PI / 2;   // the round head
  tab.children.forEach((c) => { c.userData.solid = false; });
  const ring = S.ring ? mesh(new THREE.TorusGeometry(0.014, 0.003, 3, 8), ironM, P.whole, A.x, A.y, A.z) : null;
  if (ring) ring.userData.solid = false;
  const Z = V(0, 0, 1), UP = V(0, 1, 0), DN = V(0, -1, 0), tmp = V(), bas = new THREE.Matrix4(), qq = new THREE.Quaternion();
  const cat = (u, endPt, depth) => tmp.copy(A).lerp(endPt, u).add(V(0, -depth * 4 * u * (1 - u), 0)).clone();
  const place = (pts, ends) => {   // pts: NL + 1 chain points; links sit at the segments' middles, alternate links turned 90 degrees about the chain
    for (let i = 0; i < NL; i++) {
      const p0 = pts[i], p1 = pts[i + 1], T = p1.clone().sub(p0); if (T.lengthSq() < 1e-10) T.copy(DN); T.normalize();
      let Y = (Math.abs(T.y) > 0.97 ? V(1, 0, 0) : UP.clone()); Y.addScaledVector(T, -Y.dot(T)).normalize();
      if (i & 1) Y = new THREE.Vector3().crossVectors(T, Y);
      const Zv = new THREE.Vector3().crossVectors(T, Y).normalize();
      bas.makeBasis(T, Y, Zv); qq.setFromRotationMatrix(bas);
      links[i].position.copy(p0).add(p1).multiplyScalar(0.5); links[i].quaternion.copy(qq);
    }
  };
  return {
    grip: 0,
    apply(ps) {
      const pop = typeof ps.pop === "number" ? Math.max(0, ps.pop) : 0, taut = clamp(typeof ps.taut === "number" ? ps.taut : 0);
      const depth = SAG * (1 - taut), shift = 0.03 * smooth(pop / 0.067);
      // the tab's outer end (where the last link hangs): 0.02 outside the hole, pulled 0.03 further out by the pop
      const end = B.clone().addScaledVector(D, -(0.02 + shift)), pts = [];
      for (let i = 0; i <= NL; i++) pts.push(cat(i / NL, end, depth));
      let dirTab = D.clone();
      if (pop > 0) {
        const u0 = end.clone().sub(A).normalize(), th0 = Math.acos(clamp(u0.dot(DN), -1, 1)), axis = new THREE.Vector3().crossVectors(u0, DN);
        if (axis.lengthSq() < 1e-8) axis.set(0, 0, 1); axis.normalize();
        const rem = (s) => (s < 0.35 ? th0 * Math.cos((Math.PI / 2) * (s / 0.35)) : -8 * DEG * Math.exp(-(s - 0.35) / 0.4) * Math.sin((TAU * (s - 0.35)) / 0.5));
        const lie = new THREE.Vector3(end.x - A.x, 0, end.z - A.z); if (lie.lengthSq() < 1e-8) lie.set(0, 0, 1); lie.normalize();
        const hang = new THREE.Vector3(end.x - A.x, 0, end.z - A.z); if (hang.lengthSq() < 1e-8) hang.set(0, 0, 1); hang.normalize();
        const piv = A.clone().addScaledVector(hang, 0.035 * smooth(pop / 0.3));   // the chain slides to the eye's far edge as it falls
        const free = [piv];
        for (let i = 0; i < NL; i++) {
          const th = rem(Math.max(0, pop - 0.05 * (i / NL))), d = u0.clone().applyAxisAngle(axis, th0 - th), p = free[i], q = p.clone().addScaledVector(d, PITCH);
          if (q.y < FLOOR) {   // on the cobbles: keep the pitch, slide along the ground
            const dy = FLOOR - p.y, hl = Math.sqrt(Math.max(0, PITCH * PITCH - dy * dy)), h = new THREE.Vector3(d.x, 0, d.z);
            if (h.lengthSq() < 1e-6 || p.y <= FLOOR + 1e-4) h.copy(lie); h.normalize();
            q.copy(p).addScaledVector(h, hl); q.y = FLOOR;
          }
          free.push(q);
        }
        const w = smooth(pop / 0.12);
        for (let i = 0; i <= NL; i++) pts[i].lerp(free[i], w);
        const last = pts[NL].clone().sub(pts[NL - 1]); if (last.lengthSq() > 1e-10) dirTab.lerp(last.normalize(), w).normalize();
      }
      place(pts);
      // the tab: its outer end at the chain's end, pointing along dirTab (into the hole while locked)
      tab.position.copy(pts[NL]); tab.visible = true;
      const Yt = Math.abs(dirTab.y) > 0.97 ? V(1, 0, 0) : UP.clone(); Yt.addScaledVector(dirTab, -Yt.dot(dirTab)).normalize();
      bas.makeBasis(dirTab, Yt, new THREE.Vector3().crossVectors(dirTab, Yt).normalize()); tab.quaternion.setFromRotationMatrix(bas);
    },
  };
}

export const CART_CHAIR_KINDS = { chaircart, lockchain };
export const CART_CHAIR_GRIPS = {};
export const CART_CHAIR_STATE = {
  chaircart: { spin: 0, brake: 0, jolt: 0, fill: 0, basket: 1 },
  lockchain: { pop: 0, taut: 0 },
};
