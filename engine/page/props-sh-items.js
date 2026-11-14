// Ancient aliens EP02 Stonehenge kit (14 Nov 2026), items: the small things of the "today" scenes. Design: storyboards/series/
// ancient-aliens/02-stonehenge/kit/BOARD.md (palette section 2, sizes section 3). Bench: kit/bench (make-sh-items.mjs, sh-items-sheet.png).
// Metres. World axes as the kit: +z north-east (default camera side), +x screen right, up +y. Every mark (fleece lock, curl, feather, knit
// wale, rib, fibre, rope knot, tuft, window silhouette) is drawn once from a hash of its own index: no tiling texture, no Math.random, no
// wall clock. Animation only from the params below and the clip clock t the engine passes to apply(ps, t). Params are read from the
// storyboard's per-beat props (ps) first, then from spec, so a spec value is the start value. NO param needs seeding: every default is 0.
// Nothing here is solid or standable (no tops), nothing is gripped (grip 0, SH_ITEMS_GRIPS is empty). Scenery kinds (ropeline, shuttlebus)
// carry userData.lookOnly and solid false (no contact oval, no contact check). Look: wool and decals set noHatch / noOutline so the
// hand-drawn line pass draws them as marks, not as a woven hatch.
//
//   sheep      a real sheep, 0.75 at the shoulder (0.77 with the wool lumps), 1.15 long; origin on the floor between the four
//              feet, facing +z (the head is at +z). About 980 hand-placed fleece locks (two sizes, cream tones, curls on every second
//              one), dark head and legs #3a332e, pink inner ears, amber eyes with the horizontal slot pupil and a lid that blinks,
//              topknot, nose pad, nostrils, cloven hooves, a short wool tail. Locks and curls are merged geometry (a handful of draw calls).
//                spec.chew  0..1 (0) sideways jaw-grind, 1.6 cycles/s on the clip clock; 0 holds the jaw still. Use with grass true.
//                spec.grass true|false (false) a few green grass blades hang from the mouth (a child of the jaw).
//                spec.graze 0..1 (0) head down to the turf, nose in the grass (neck down, face about 62 deg from the horizon).
//                spec.lie   0..1 (0) legs fold under, body sinks 0.225, chin up. 1 = lying.
//                spec.headY -1..1 (0) turns the head 60 deg each way (+1 = toward +x, the sheep's left when it faces +z).
//                spec.headP -1..1 (0) tips the head 30 deg: +1 down, -1 up.
//                spec.blink 0..1 (0) lids shut. spec.ears 0..1 (0) a flick of both ears. spec.tail 0..1 (0) a wag.
//                spec.locks (980) how many fleece placements to try: lower it for far sheep (400 still reads at 100 px).
//
//   crow       a carrion crow, 0.45 long (beak to tail tip), 0.24 tall standing; origin on the floor at its feet, facing +z. Glossy
//              black, a blue-violet sheen drawn on the wing and tail feathers (each feather its own hash), scaled legs and toes.
//                spec.hop   0..1 (0) one small hop: the whole bird rises 0.075 m at hop 0.5, legs stretch, wings lift a little.
//                spec.caw   0..1 (0) the lower mandible drops, a red tongue shows, the body dips and the head tips up.
//                spec.wings 0..1 (0) 0 folded on the back, 1 fully spread (landing): 9 primaries, 9 secondaries, 3 rows of coverts each side.
//                spec.headY -1..1 (0) turns the head 75 deg each way.
//
//   bobblehat  a knitted winter hat WORN on a potato, built on the real skin of the body it is fitted to (the same bodyPoint the cast
//              uses, from AA_BODIES), so it sits right with no storyboard numbers. Origin = the wearer's origin (the floor between the feet,
//              facing +z): put it at the wearer's x, z and give it the wearer's turn. Ribbed turned-up cuff 0.062 high with rolled edges,
//              a knit cap (72 wales), a pom-pom of ~240 hand-set fibres on the crown, stray fibres, and a slit through which the leaf
//              sprout comes out (a lipped slit sized by the body's sprout), never over the eyes, mouth or leaf.
//                spec.wear / spec.fit  "spud" | "chip" | "wedge" | "mash" (default "spud"), a cast id such as "potatobrawl/chip" also
//                                      works; or an object {...bodyDef, sprout, cloth, pom} for a custom body.
//                spec.color  "#c23b3b"   knit colour (the kit's three: #c23b3b red, #2f6fb0 blue, #e0b030 yellow).
//                spec.pom    "#f4f1e6"   pom-pom colour.        spec.slit true (false: a small plain slit, no sprout room).
//                spec.rim    33  degrees of the head's height where the cuff's lower edge sits (lower = hat lower on the head).
//                spec.cuff   0.062   cuff height, m.            spec.pomR (0.05 scaled by body width) pom-pom radius, m.
//                spec.pomAt  [x, z] the pom-pom's place on the crown; default per body (the POM table: away from the leaf).
//              Per-body tables inside this file: SPROUT (sprout size: spud 1, chip 1.25, wedge 2.2, mash 2.2), CLOTH (how far a scarf
//              stands off the skin over the costume: spud .03, chip .03, wedge .075, mash .05), POM. The Wedge hat is lifted and bulged a
//              little (hatExtra) so his sunglasses do not push through the knit.
//
//   scarf      a knitted scarf WORN the same way (spec.wear / spec.fit as bobblehat): one turn and a bit (1.16) round the body just under
//              the mouth, never over the mouth or eyes, with a lapped layer, and two hanging ends on the wearer's LEFT (+x of a wearer who faces +z:
//              screen right for a wearer who faces the default camera), 0.35 and 0.25 m long with a fringe. The ends
//              sway 3-4 deg on the clip clock (two slow sines, 0.33 and 0.27 Hz, a phase each).
//                spec.color  "#2f6fb0"   spec.stripe  null  a second colour: stripes across the whole length, ends included.
//                spec.width  0.088  band height, m.   spec.drop  -12  degrees of the head's height of the band's top edge (more
//                negative = lower).   spec.cloth  per body (CLOTH table above): stand-off from the skin, m.
//
//   ropeline   the visitors' rope: short dark-green metal posts 0.45 high (cap, collar, base plate, eye) every 2.5 m, a pale twisted rope
//              sagging 0.075-0.095 between them with a knot at each eye, grass tufts at the feet. Origin = the origin of the arc / points
//              (on the ground). lookOnly.
//                spec.arc  [36, -60, 60]  [radius, fromDeg, toDeg], degrees from +z round the origin, +deg toward +x.
//                spec.pts  [[x, z], ...]  a polyline instead of the arc (wins over arc).      spec.gap 2.5  post spacing along it, m.
//
//   shuttlebus the visitors' shuttle: 11 long (z) x 2.5 wide (x) x 3.1 high, origin bottom centre, front +z, static. White upper body,
//              dark-green lower band, big tinted windows with potato silhouettes (hashed per window), the door on the +x side, wheel arches
//              with wheels (front axle z +3.3, rear z -2.9), mirrors, roof vents, aerial, a destination blind and the name text
//              "STONEHENGE TOURS", head and tail lamps, a soft ground shadow plane. No spec keys. lookOnly.
//
// The bench drops each piece in its own group 800 m from the next (the cameras see 700 m), one beat per shot.
import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";
import { AA_BODIES } from "./props-aa-items.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, repeat) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();   // every drawn texture is made once per page (pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const tubeGeo = (pts, r, seg = 6, closed = false, n = 0) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), closed), n || Math.max(6, pts.length * 3), r, seg, closed);
// a parametric surface fn(u, v) on a (nu+1) x (nv+1) grid, front facing +u x +v (flip: the other way)
function surfGrid(fn, nu, nv, flip = false) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ hand-drawn marks
// ellipsoid blobs (wool locks, pom-pom cores): { p, f, n, r: [along f, across, along n] }, merged into one geometry with exact normals
let _sph = null;
function sphereTpl() {
  if (_sph) return _sph;
  const g = new THREE.SphereGeometry(1, 10, 7), p = g.attributes.position.array, ix = g.index.array;
  return (_sph = { pos: Float32Array.from(p), idx: Uint16Array.from(ix), nv: p.length / 3 });
}
function blobGeo(list) {
  const T = sphereTpl(), n = list.length, pos = new Float32Array(n * T.nv * 3), nor = new Float32Array(n * T.nv * 3), idx = new Uint32Array(n * T.idx.length);
  const s = V(), f = V(), nn = V();
  list.forEach((B, k) => {
    f.copy(B.f).normalize(); nn.copy(B.n).normalize(); s.crossVectors(f, nn).normalize();
    const [a, b, c] = B.r;
    for (let i = 0; i < T.nv; i++) {
      const x = T.pos[i * 3], y = T.pos[i * 3 + 1], z = T.pos[i * 3 + 2], o = (k * T.nv + i) * 3;
      pos[o] = B.p.x + f.x * x * a + s.x * z * b + nn.x * y * c; pos[o + 1] = B.p.y + f.y * x * a + s.y * z * b + nn.y * y * c; pos[o + 2] = B.p.z + f.z * x * a + s.z * z * b + nn.z * y * c;
      let nx = f.x * (x / a) + s.x * (z / b) + nn.x * (y / c), ny = f.y * (x / a) + s.y * (z / b) + nn.y * (y / c), nz = f.z * (x / a) + s.z * (z / b) + nn.z * (y / c);
      const l = Math.hypot(nx, ny, nz) || 1; nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
    }
    for (let i = 0; i < T.idx.length; i++) idx[k * T.idx.length + i] = T.idx[i] + k * T.nv;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
// curls (a ringlet of wool, a knitted loop): { p, f, n, r, turns, tube, rise, a0 } a square-section tube along a spiral that lies in the plane of f and n x f
function curlGeo(list, steps = 9) {
  const pos = [], nor = [], idx = [], s = V(), f = V(), nn = V(), c = V(), tg = V(), b = V(), u = V();
  for (const C of list) {
    f.copy(C.f).normalize(); nn.copy(C.n).normalize(); s.crossVectors(f, nn).normalize();
    const base = pos.length / 3, pts = [], rad = [];
    for (let j = 0; j <= steps; j++) {
      const t = j / steps, a = (C.a0 ?? 0) + t * (C.turns ?? 1.2) * TAU, r = C.r * (1 - 0.4 * t);
      pts.push(V().copy(C.p).addScaledVector(f, Math.cos(a) * r).addScaledVector(s, Math.sin(a) * r * 0.85).addScaledVector(nn, (C.rise ?? 0.012) * t)); rad.push(C.tube * (1 - 0.45 * t * t));
    }
    for (let j = 0; j <= steps; j++) {
      tg.copy(pts[Math.min(steps, j + 1)]).sub(pts[Math.max(0, j - 1)]).normalize();
      b.crossVectors(tg, nn).normalize(); u.crossVectors(b, tg).normalize();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4, dx = Math.cos(a), dy = Math.sin(a);
        c.copy(u).multiplyScalar(dx).addScaledVector(b, dy);
        pos.push(pts[j].x + c.x * rad[j], pts[j].y + c.y * rad[j], pts[j].z + c.z * rad[j]); nor.push(c.x, c.y, c.z);
      }
    }
    for (let j = 0; j < steps; j++) for (let k = 0; k < 4; k++) { const a = base + j * 4 + k, a2 = base + j * 4 + (k + 1) % 4, d = a + 4, d2 = a2 + 4; idx.push(a, d, a2, a2, d, d2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
// a flat tapered card (a hair lock, a feather, a grass blade): from p along d, len long, w wide, bending down by sag
function cardInto(pos, idx, p, d, len, w, sag, side, tip = 0.55, n = 3) {
  const base = pos.length / 3, dn = V(0, -1, 0), sd = V().copy(side).normalize();
  for (let i = 0; i <= n; i++) {
    const k = i / n, c = V().copy(p).addScaledVector(d, len * k).addScaledVector(dn, sag * len * k * k), hw = w * Math.sqrt(Math.max(0, 1 - Math.pow(k, 1 + tip * 2.2)));
    pos.push(c.x + sd.x * hw, c.y + sd.y * hw, c.z + sd.z * hw, c.x - sd.x * hw, c.y - sd.y * hw, c.z - sd.z * hw);
  }
  for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
}
function cardGeo(list) {
  const pos = [], idx = []; for (const l of list) cardInto(pos, idx, ...l);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a section of a lofted body: Catmull-Rom through rows [z, cy, w, up, dn, n]; the skin point at section angle ang (pi/2 the back, 0 the +x flank) pushed out along the normal
function sectionAt(A, z) {
  let k = A.length - 2; for (let i = 0; i < A.length - 1; i++) if (z <= A[i + 1][0]) { k = i; break; }
  const f = clamp((z - A[k][0]) / (A[k + 1][0] - A[k][0])), p = (j) => A[Math.max(0, Math.min(A.length - 1, j))];
  const cr = (m) => { const a = p(k - 1)[m], b = p(k)[m], c = p(k + 1)[m], d = p(k + 2)[m]; return 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f); };
  return { cy: cr(1), w: Math.max(0.01, cr(2)), up: Math.max(0.01, cr(3)), dn: Math.max(0.01, cr(4)), n: 2.1 };
}
function skinAt(A, z, ang, out) {
  const pt = (zz, a) => { const s = sectionAt(A, zz), e = 2 / s.n, co = Math.cos(a), si = Math.sin(a); return V(Math.sign(co) * Math.abs(co) ** e * s.w, s.cy + Math.sign(si) * Math.abs(si) ** e * (si > 0 ? s.up : s.dn), zz); };
  const p = pt(z, ang), t = pt(z, ang + 0.01).sub(p).normalize(), tz = pt(Math.min(0.59, z + 0.01), ang).sub(pt(Math.max(-0.565, z - 0.01), ang)).normalize();
  const n = V().crossVectors(t, tz).normalize();
  return { p: p.addScaledVector(n, out), n, t };
}
// the surface area of the torso from the rump to the chest, so locks can be scattered evenly over it (z for a share u in 0..1)
const torsoZ = (A) => once("sh-torso-z", () => {
  const N = 140, z0 = -0.56, z1 = 0.585, cum = [0], per = []; let tot = 0;
  for (let i = 0; i <= N; i++) {
    const z = lerp(z0, z1, i / N), pts = []; for (let k = 0; k < 24; k++) pts.push(skinAt(A, z, (k / 24) * TAU, 0).p);
    let l = 0; for (let k = 0; k < 24; k++) l += pts[k].distanceTo(pts[(k + 1) % 24]); per.push(l);
    if (i) { tot += 0.5 * (l + per[i - 1]) * Math.hypot((z1 - z0) / N, (l - per[i - 1]) / TAU); cum.push(tot); }
  }
  return (u) => { const k = u * tot; let i = 1; while (i < cum.length - 1 && cum[i] < k) i++; return lerp(z0, z1, ((i - 1) + (k - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])) / N); };
});

// ------------------------------------------------------------------------------------------------ sheep
const SHEEP = {
  dark: "#3a332e", darkL: "#5a5048", darkD: "#241f1b", pink: "#f5c8c0", pinkD: "#da9c94", amber: "#d99a2c",
  wool: ["#fffbee", "#f6efdb", "#eee4c9", "#fffefa"], core: "#d6caad",
  // torso rows: z, centre y, half width, up, down, superellipse n (nose z +0.585 chest, rump z -0.56: 1.145 long, back 0.72 + the fleece)
  torso: [[-0.56, 0.47, 0.05, 0.06, 0.06, 2], [-0.5, 0.47, 0.16, 0.19, 0.18, 2.1], [-0.38, 0.465, 0.235, 0.245, 0.225, 2.15], [-0.15, 0.46, 0.265, 0.25, 0.23, 2.2], [0.1, 0.46, 0.275, 0.25, 0.23, 2.2], [0.3, 0.465, 0.265, 0.25, 0.225, 2.15], [0.45, 0.475, 0.22, 0.22, 0.2, 2.1], [0.54, 0.475, 0.14, 0.15, 0.15, 2], [0.585, 0.475, 0.05, 0.06, 0.06, 2]],
  B: [0, 0.52, 0.28], LN: 0.42,   // the neck's base (inside the chest) and its length to the poll
  DY: 0.225,                   // the body sinks this far when it lies
  // legs: [y, z, half width, front, back]; standing, and folded under (lying)
  front: { stand: [[0.42, 0.33, 0.06, 0.065, 0.065], [0.3, 0.33, 0.04, 0.045, 0.05], [0.2, 0.335, 0.027, 0.03, 0.032], [0.165, 0.335, 0.03, 0.034, 0.032], [0.09, 0.34, 0.017, 0.018, 0.017], [0.045, 0.342, 0.019, 0.02, 0.02], [0.024, 0.348, 0.018, 0.02, 0.016]],
    lie: [[0.2, 0.33, 0.06, 0.065, 0.065], [0.1, 0.4, 0.04, 0.045, 0.05], [0.06, 0.5, 0.027, 0.03, 0.032], [0.05, 0.57, 0.03, 0.034, 0.032], [0.04, 0.5, 0.017, 0.018, 0.017], [0.035, 0.44, 0.019, 0.02, 0.02], [0.024, 0.41, 0.018, 0.02, 0.016]] },
  hind: { stand: [[0.4, -0.36, 0.075, 0.08, 0.08], [0.3, -0.42, 0.05, 0.05, 0.055], [0.2, -0.47, 0.03, 0.032, 0.036], [0.16, -0.465, 0.03, 0.03, 0.034], [0.09, -0.44, 0.018, 0.019, 0.018], [0.045, -0.42, 0.02, 0.021, 0.02], [0.024, -0.415, 0.019, 0.02, 0.017]],
    lie: [[0.18, -0.36, 0.075, 0.08, 0.08], [0.1, -0.42, 0.05, 0.05, 0.055], [0.06, -0.52, 0.03, 0.032, 0.036], [0.05, -0.5, 0.03, 0.03, 0.034], [0.04, -0.46, 0.018, 0.019, 0.018], [0.035, -0.42, 0.02, 0.021, 0.02], [0.024, -0.39, 0.019, 0.02, 0.017]] },
  // head rows (own frame: origin the poll, +z along the face, +y up the forehead): s, y, half width, up, down, n
  upper: [[-0.04, 0.012, 0.058, 0.066, 0.062, 2.3], [0, 0.012, 0.067, 0.074, 0.068, 2.3], [0.05, 0.012, 0.068, 0.074, 0.066, 2.3], [0.1, 0.012, 0.058, 0.068, 0.058, 2.3], [0.15, 0.014, 0.049, 0.064, 0.05, 2.3], [0.2, 0.012, 0.045, 0.06, 0.046, 2.2], [0.24, 0.006, 0.043, 0.056, 0.042, 2.2], [0.268, 0, 0.038, 0.048, 0.036, 2.2], [0.288, -0.004, 0.027, 0.032, 0.026, 2.1], [0.298, -0.006, 0.012, 0.014, 0.012, 2]],
  jaw: [[0.03, -0.05, 0.052, 0.024, 0.03, 2.2], [0.09, -0.052, 0.046, 0.02, 0.026, 2.2], [0.16, -0.049, 0.037, 0.014, 0.02, 2.2], [0.23, -0.047, 0.033, 0.013, 0.016, 2.2], [0.268, -0.044, 0.03, 0.011, 0.014, 2.2], [0.288, -0.04, 0.02, 0.008, 0.01, 2.2], [0.296, -0.038, 0.008, 0.004, 0.005, 2]],
};
const sheepFur = (key, base, light, dark, W, H, n, seed) => once(key, () => {
  const [c, g] = canvas(W, H); g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) { g.fillStyle = rnd(seed + i * 5) > 0.5 ? light : dark; g.globalAlpha = 0.05 + 0.07 * rnd(seed + i * 5 + 1); g.beginPath(); g.ellipse(rnd(seed + i * 5 + 2) * W, rnd(seed + i * 5 + 3) * H, 14 + 60 * rnd(seed + i * 5 + 4), 6 + 28 * rnd(seed + i * 5 + 6), 0, 0, TAU); g.fill(); }
  for (let i = 0; i < n; i++) {   // short hairs along the length of the part (u runs along the spine), each its own place, length, tone and strength
    const x = rnd(seed + i * 7 + 11) * W, y = rnd(seed + i * 7 + 12) * H, l = 5 + 16 * rnd(seed + i * 7 + 13), t = rnd(seed + i * 7 + 14);
    g.strokeStyle = t > 0.5 ? light : dark; g.globalAlpha = 0.18 + 0.4 * rnd(seed + i * 7 + 15); g.lineWidth = 0.7 + 1.1 * rnd(seed + i * 7 + 16);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y + (rnd(seed + i * 7 + 17) - 0.5) * 3, x + l, y + (rnd(seed + i * 7 + 18) - 0.5) * 4); g.stroke();
  }
  g.globalAlpha = 1; return tex(c);
});
const woolCore = () => once("sh-wool-core", () => {
  const [c, g] = canvas(512, 256); g.fillStyle = SHEEP.core; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = rnd(i + 3) > 0.5 ? "#e9dfc6" : "#b9ac8c"; g.globalAlpha = 0.12 + 0.18 * rnd(i + 5); g.beginPath(); g.ellipse(rnd(i + 7) * 512, rnd(i + 9) * 256, 8 + 36 * rnd(i + 11), 4 + 14 * rnd(i + 13), (rnd(i + 15) - 0.5) * 1.2, 0, TAU); g.fill(); }
  g.globalAlpha = 1; return tex(c);
});

function sheep(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const wools = SHEEP.wool.map((c) => { const m = mat(c, { roughness: 0.95 }); m.userData.noHatch = true; m.userData.lineColor = "#a99a78"; m.userData.lineK = 0.6; return m; });
  const curlM = mat("#dccfac", { roughness: 0.9 }); curlM.userData.noOutline = true; curlM.userData.noHatch = true;
  const coreM = mat("#ffffff", { map: woolCore(), roughness: 0.95 }); coreM.userData.noHatch = true; coreM.userData.lineColor = "#a99a78"; coreM.userData.lineK = 0.6;
  const faceM = mat("#ffffff", { map: sheepFur("sh-sheep-face", SHEEP.dark, SHEEP.darkL, SHEEP.darkD, 512, 256, 900, 17), roughness: 0.85 });
  const legM = mat("#ffffff", { map: sheepFur("sh-sheep-leg", SHEEP.dark, SHEEP.darkL, SHEEP.darkD, 256, 256, 500, 91), roughness: 0.85 });
  const darkM = mat(SHEEP.darkD, { roughness: 0.7 }), hoofM = mat("#1d1815", { roughness: 0.55 });
  const body = new THREE.Group(); G.add(body);   // everything that sinks when the sheep lies
  const A = SHEEP.torso;
  // ---- the torso core (the inside of the fleece), then the fleece as individual locks: blobs and curls in four cream tones
  const tSecs = () => A.map(([z, cy, w, up, dn, n]) => ({ c: [0, cy, z], w, up, dn, n }));
  const torso = makeLoft(tSecs(), { sub: 5, radial: 36, ref: [0, 1, 0] }); torso.userData.set(tSecs()); mesh(torso, coreM, body);
  const lumpsBy = [[], [], [], []], curls = [];
  const place = (z, ang, out, sc, i, k0) => {
    const h = (k) => rnd(i * 31 + k0 + k), sk = skinAt(A, z, ang, 0), n = sk.n.clone().add(V(0, 0, 0)), down = sk.t.y < 0 ? sk.t.clone() : sk.t.clone().multiplyScalar(-1);
    // the wool flows down the flank and back along the spine
    const fl = down.multiplyScalar(0.8).add(V(0, 0, -0.4)).add(V((h(7) - 0.5) * 0.5, (h(8) - 0.5) * 0.4, (h(9) - 0.5) * 0.6)).normalize();
    fl.addScaledVector(n, -fl.dot(n)).normalize();
    return { sk, n, fl, h };
  };
  const zOf = torsoZ(A), NB = S.locks ?? 980;
  for (let i = 0; i < NB; i++) {
    const z = zOf(rnd(i * 17 + 1)), ang = lerp(-1.1, TAU - 1.1, rnd(i * 17 + 2));
    if (Math.sin(ang) < -0.75 && rnd(i * 17 + 3) < 0.6) continue;
    const sec = sectionAt(A, z), sc = clamp(sec.w / 0.24, 0.62, 1.05), { sk, n, fl, h } = place(z, ang, 0, sc, i, 100), big = i % 3 !== 2;   // two thirds big locks that make the mass, one third small ones on top
    const out = big ? 0.006 + 0.012 * h(4) : 0.036 + 0.014 * h(4), k = big ? 1 : 0.66, a = (0.05 + 0.028 * h(5)) * sc * k, b = (0.04 + 0.02 * h(6)) * sc * k, c = (0.038 + 0.014 * h(10)) * sc * k;
    lumpsBy[Math.floor(rnd(i * 17 + 5) * 4) % 4].push({ p: sk.p.clone().addScaledVector(n, out), f: fl, n, r: [a, b, c] });
    if (i % 2 === 0 && rnd(i * 17 + 9) < 0.9) curls.push({ p: sk.p.clone().addScaledVector(n, out + c * 0.78), f: fl, n, r: (0.013 + 0.01 * h(11)) * sc, turns: 0.95 + 0.5 * h(12), tube: 0.0062 * sc + 0.0014, rise: 0.008 + 0.006 * h(13), a0: h(14) * TAU });
  }
  // trousers on the hind legs, a deeper belly fringe and a woolly rump
  for (let i = 0; i < 70; i++) {
    const sd = i % 2 ? 1 : -1, y = lerp(0.2, 0.4, rnd(i * 3 + 400)), z = -0.4 + 0.1 * (rnd(i * 3 + 401) - 0.5), a = rnd(i * 3 + 402) * TAU, r = 0.07 + 0.02 * rnd(i * 3 + 403);
    const n = V(Math.cos(a), 0, Math.sin(a) * 0.8).normalize(); lumpsBy[i % 4].push({ p: V(sd * 0.12 + Math.cos(a) * r * 0.8, y, z + Math.sin(a) * r), f: V(0, -1, -0.3), n, r: [0.05, 0.036, 0.03] });
  }
  const fleeceMeshes = lumpsBy.map((L, i) => mesh(blobGeo(L), wools[i], body));
  const curlMesh = mesh(curlGeo(curls), curlM, body); curlMesh.castShadow = false;
  void fleeceMeshes;
  // ---- the neck: a wool-covered core and its locks in the neck's own frame (+z along it), turned and tipped by the pose
  const neckG = new THREE.Group(); neckG.rotation.order = "YXZ"; neckG.position.set(...SHEEP.B); body.add(neckG);
  const nSecs = [[0, 0.135, 0.145, 0.135], [0.12, 0.125, 0.135, 0.125], [0.25, 0.098, 0.105, 0.098], [0.34, 0.074, 0.078, 0.072], [0.41, 0.062, 0.064, 0.06]].map(([z, w, up, dn]) => ({ c: [0, 0, z], w, up, dn }));
  const neckL = makeLoft(nSecs, { sub: 5, radial: 22, ref: [0, 1, 0] }); neckL.userData.set(nSecs); mesh(neckL, coreM, neckG);
  { const by = [[], [], [], []], cu = [], LN = SHEEP.LN;
    for (let i = 0; i < 120; i++) {
      const z = lerp(0.02, LN - 0.03, Math.pow(rnd(i * 7 + 800), 0.85)), a = rnd(i * 7 + 801) * TAU, k = z / LN, r0 = lerp(0.14, 0.064, k) + 0.012, sc = lerp(1.0, 0.62, k);
      const n = V(Math.cos(a), Math.sin(a), 0), fl = V(0, -0.35 * Math.sin(a), -1).add(V((rnd(i * 7 + 802) - 0.5) * 0.4, (rnd(i * 7 + 803) - 0.5) * 0.4, 0)).normalize();
      by[i % 4].push({ p: V(Math.cos(a) * r0, Math.sin(a) * r0, z), f: fl, n, r: [(0.046 + 0.026 * rnd(i * 7 + 804)) * sc, (0.034 + 0.02 * rnd(i * 7 + 805)) * sc, (0.027 + 0.014 * rnd(i * 7 + 806)) * sc] });
      if (i % 2 === 0) cu.push({ p: V(Math.cos(a) * (r0 + 0.026 * sc), Math.sin(a) * (r0 + 0.026 * sc), z), f: fl, n, r: 0.012 * sc, turns: 1.1, tube: 0.0048, rise: 0.008, a0: rnd(i * 7 + 807) * TAU });
    }
    by.forEach((L, i) => mesh(blobGeo(L), wools[i], neckG)); mesh(curlGeo(cu), curlM, neckG).castShadow = false; }
  // ---- the head (rigid, in its own group at the end of the neck) and the jaw (hinged: it grinds sideways when it chews)
  const headG = new THREE.Group(); headG.rotation.order = "YXZ"; headG.position.set(0, 0, SHEEP.LN); neckG.add(headG);
  const HZ = 0.86;   // the drawing rows are 0.30 long: a sheep's head is short and deep
  const rows = (R) => R.map(([s, y, w, up, dn, n]) => ({ c: [0, y, s * HZ], w, up, dn, n }));
  const upS = rows(SHEEP.upper), jawS = rows(SHEEP.jaw);
  const upG = makeLoft(upS, { sub: 5, radial: 28, ref: [0, 1, 0] }); upG.userData.set(upS); mesh(upG, faceM, headG);
  const jaw = new THREE.Group(); headG.add(jaw);
  const jawG = makeLoft(jawS, { sub: 4, radial: 20, ref: [0, 1, 0] }); jawG.userData.set(jawS); mesh(jawG, faceM, jaw);
  // the nose: a darker pad, two comma nostrils, the lip crease, the cleft under the nose; the mouth line on each side
  { const nose = mesh(new THREE.SphereGeometry(1, 14, 10), darkM, headG, 0, -0.002, 0.282 * HZ); nose.scale.set(0.034, 0.032, 0.022); nose.castShadow = false;
    for (const sd of [-1, 1]) {
      const nos = mesh(new THREE.SphereGeometry(1, 10, 8), mat("#0d0a09", { roughness: 0.5 }), headG, sd * 0.0135, 0.004, 0.299 * HZ); nos.scale.set(0.009, 0.0056, 0.0075); nos.rotation.set(0, 0, sd * 0.5); nos.castShadow = false;
      mesh(tubeGeo([V(sd * 0.008, -0.008, 0.298 * HZ), V(sd * 0.02, -0.026, 0.286 * HZ), V(sd * 0.033, -0.036, 0.24 * HZ), V(sd * 0.042, -0.036, 0.15 * HZ), V(sd * 0.05, -0.034, 0.06 * HZ)], 0.0019, 5, false, 18), mat("#0d0a09", { roughness: 0.7 }), headG).castShadow = false;
    }
    mesh(tubeGeo([V(0, -0.002, 0.301 * HZ), V(0, -0.016, 0.298 * HZ), V(0, -0.032, 0.292 * HZ)], 0.0016, 5, false, 6), mat("#0d0a09"), headG).castShadow = false; }
  // eyes: amber, a horizontal slot pupil, a dark lid that closes with blink
  const eyes = [];
  for (const sd of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sd * 0.0575, 0.03, 0.078); eg.quaternion.setFromUnitVectors(V(0, 0, 1), V(sd, 0.1, 0.55).normalize()); headG.add(eg);
    mesh(new THREE.SphereGeometry(0.0182, 22, 16), mat(SHEEP.amber, { roughness: 0.3 }), eg).castShadow = false;
    const pup = new THREE.Mesh(new THREE.CircleGeometry(0.0128, 24), new THREE.MeshBasicMaterial({ color: "#150f08", toneMapped: false })); pup.scale.set(1, 0.36, 1); pup.position.z = 0.0176; pup.material.userData.noOutline = true; eg.add(pup);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.0037, 8), new THREE.MeshBasicMaterial({ color: "#fff6dc", toneMapped: false })); hl.position.set(-sd * 0.0052, 0.0052, 0.0181); hl.material.userData.noOutline = true; eg.add(hl);
    const lid = new THREE.Group(); eg.add(lid);
    mesh(new THREE.SphereGeometry(0.0194, 22, 10, 0, TAU, 0, Math.PI / 2), faceM, lid).castShadow = false;
    const brow = mesh(new THREE.SphereGeometry(1, 12, 8), faceM, headG, sd * 0.052, 0.052, 0.08); brow.scale.set(0.02, 0.009, 0.03); brow.rotation.z = -sd * 0.25; brow.castShadow = false;
    eyes.push({ lid });
  }
  // ears: leaf shaped, held out sideways, dark outside, pink and veined inside, each with its own droop
  const ears = [];
  for (const sd of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sd * 0.055, 0.05, -0.01); headG.add(e);
    const L = 0.122, wid = (u) => (0.01 + 0.026 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.9)) * (1 - Math.pow(u, 9)) + 0.0006;
    const ep = (u, v, dy) => V(sd * L * u, -0.013 * (1 - v * v) * Math.sin(Math.PI * Math.min(1, u * 1.05)) - 0.014 * u * u + dy, wid(u) * v + 0.01 * u);
    mesh(surfGrid((u, v) => ep(u, v * 2 - 1, 0.0018), 12, 6, sd > 0), mat(SHEEP.pink, { roughness: 0.75, side: THREE.DoubleSide, map: earInner() }), e).castShadow = false;
    mesh(surfGrid((u, v) => ep(u, v * 2 - 1, -0.0018), 12, 6, sd < 0), faceM, e).castShadow = false;
    ears.push({ e, sd });
  }
  // the topknot and the wool behind the ears: the head comes out of the fleece
  { const L = [], cu = [];
    for (let i = 0; i < 34; i++) {
      const a = lerp(-0.5, Math.PI + 0.5, rnd(i * 5 + 900)), s = lerp(-0.07, 0.035, rnd(i * 5 + 901)), r = 0.055 + 0.01 * rnd(i * 5 + 902), n = V(Math.cos(a), Math.sin(a), -0.15).normalize();
      L.push({ p: V(Math.cos(a) * r, Math.sin(a) * r * 1.05, s), f: V((rnd(i * 5 + 903) - 0.5) * 0.4, -0.2 + (rnd(i * 5 + 904) - 0.5) * 0.4, -0.8).normalize(), n, r: [0.028 + 0.012 * rnd(i * 5 + 905), 0.021 + 0.008 * rnd(i * 5 + 906), 0.016 + 0.008 * rnd(i * 5 + 907)] });
      if (i % 2 === 0) cu.push({ p: V(Math.cos(a) * (r + 0.016), Math.sin(a) * (r + 0.016) * 1.05, s), f: V(0, 0, -1), n, r: 0.009, turns: 1.1, tube: 0.0036, rise: 0.006, a0: rnd(i * 5 + 908) * TAU });
    }
    for (let i = 0; i < 20; i++) L.push({ p: V((rnd(i + 970) - 0.5) * 0.07, 0.066 + 0.016 * rnd(i + 950), -0.03 + 0.1 * rnd(i + 951)), f: V((rnd(i + 952) - 0.5) * 0.5, -0.3, 0.9).normalize(), n: V(0, 1, 0), r: [0.03 + 0.012 * rnd(i + 953), 0.02 + 0.006 * rnd(i + 954), 0.02 + 0.006 * rnd(i + 955)] });
    for (let i = 0; i < 7; i++) cu.push({ p: V((rnd(i + 980) - 0.5) * 0.06, 0.092, -0.02 + 0.08 * rnd(i + 981)), f: V(0, 0, 1), n: V(0, 1, 0), r: 0.011, turns: 1.1, tube: 0.0042, rise: 0.006, a0: rnd(i + 982) * TAU });
    const by = [[], [], [], []]; L.forEach((l, i) => by[i % 4].push(l)); by.forEach((l, i) => mesh(blobGeo(l), wools[i], headG)); mesh(curlGeo(cu), curlM, headG).castShadow = false; }
  // grass in the mouth: a few blades at the left corner, in the jaw's group so they chew with it
  const grass = new THREE.Group(); jaw.add(grass); grass.visible = S.grass === true;
  { const L = []; for (let i = 0; i < 9; i++) { const a = (rnd(i + 40) - 0.5) * 1.1; L.push([V(0.034 + 0.004 * (i % 3), -0.036, 0.15 + 0.012 * rnd(i + 41)), V(0.5 + 0.4 * rnd(i + 42), -0.25 - 0.3 * rnd(i + 43), 0.35 + Math.sin(a) * 0.4).normalize(), 0.055 + 0.035 * rnd(i + 44), 0.0034, 0.5, V(0, 1, 0), 0.5, 4]); }
    const gm = mat("#7fa84a", { roughness: 0.85, side: THREE.DoubleSide }); mesh(cardGeo(L.slice(0, 5)), gm, grass).castShadow = false; mesh(cardGeo(L.slice(5)), mat("#9bbd5c", { roughness: 0.85, side: THREE.DoubleSide }), grass).castShadow = false; }
  // ---- the tail: a short woolly stub that hangs from the rump
  const tailG = new THREE.Group(); tailG.position.set(0, 0.475, -0.55); body.add(tailG);
  { const ts = [[0, 0.04, 0.04, 0.04], [0.06, 0.042, 0.042, 0.042], [0.12, 0.036, 0.036, 0.036], [0.17, 0.016, 0.016, 0.016]].map(([y, w, up, dn]) => ({ c: [0, -y, -0.02 * y / 0.17 * 2], w, up, dn }));
    const tl = makeLoft(ts, { sub: 4, radial: 14, ref: [0, 0, 1] }); tl.userData.set(ts); mesh(tl, coreM, tailG);
    const by = [[], [], [], []]; for (let i = 0; i < 26; i++) { const y = rnd(i + 60) * 0.15, a = rnd(i + 61) * TAU, r = 0.04 * (1 - y / 0.22) + 0.01; by[i % 4].push({ p: V(Math.cos(a) * r, -y, Math.sin(a) * r - 0.02 * y * 2), f: V(0, -1, -0.15), n: V(Math.cos(a), 0, Math.sin(a)), r: [0.036, 0.022, 0.018] }); }
    by.forEach((l, i) => mesh(blobGeo(l), wools[i], tailG)); }
  // ---- the legs: one dark loft each, cloven hooves, in the world (they do not sink: they fold)
  const legs = [], hoofs = [];
  for (const [kind, x] of [["front", 0.115], ["front", -0.115], ["hind", 0.115], ["hind", -0.115]]) {
    const ls = (lie) => SHEEP[kind].stand.map((s, i) => { const t = SHEEP[kind].lie[i], m = (j) => lerp(s[j], t[j], lie); return { c: [x, m(0), m(1)], w: m(2), up: m(3), dn: m(4) }; });
    const g = makeLoft(ls(0), { sub: 4, radial: 14, ref: [0, 0, 1] }); g.userData.set(ls(0));
    const m = mesh(g, legM, G); m.frustumCulled = false;
    const hoof = new THREE.Group(); G.add(hoof);
    for (const o of [-1, 1]) mesh(new THREE.SphereGeometry(1, 10, 8), hoofM, hoof, o * 0.0078, 0.01, 0.014).scale.set(0.0075, 0.0125, 0.024);
    legs.push({ g, ls, hoof, x, kind });
  }
  // ---- state
  let key = "";
  const pose = (ps, t) => {
    const lie = clamp(num(ps, S, "lie")), graze = clamp(num(ps, S, "graze")) * (1 - lie), hy = clamp(num(ps, S, "headY"), -1, 1), hpi = clamp(num(ps, S, "headP"), -1, 1), chew = clamp(num(ps, S, "chew")), blink = clamp(num(ps, S, "blink")), earsK = num(ps, S, "ears", 0), tailK = num(ps, S, "tail", 0);
    body.position.y = -SHEEP.DY * lie;
    for (const L of legs) {
      const secs = L.ls(lie); L.g.userData.set(secs);
      const e = secs[secs.length - 1]; L.hoof.position.set(L.x, Math.max(0, e.c[1] - 0.024), e.c[2] + 0.0); L.hoof.rotation.x = lerp(0, L.kind === "front" ? -0.15 : 0.2, lie);
    }
    const yaw = hy * 60 * DEG;
    const neckUp = lerp(lerp(28, -33, graze), 45, lie), face = lerp(lerp(36, 62, graze), 8, lie) + hpi * 30;
    neckG.rotation.set(-neckUp * DEG, 0.35 * yaw, 0);
    headG.rotation.set((face + neckUp) * DEG, 0.65 * yaw, 0);
    const ph = TAU * 1.6 * (t ?? 0);
    jaw.position.set(0.008 * chew * Math.sin(ph), 0, 0); jaw.rotation.set(0.05 * chew * (0.5 + 0.5 * Math.sin(2 * ph + 1)), 0.03 * chew * Math.sin(ph), 0.05 * chew * Math.sin(ph));
    for (const E of eyes) E.lid.rotation.x = lerp(-1.0, 1.55, blink);
    const fl = Math.sin(Math.PI * earsK) ** 2;
    for (const E of ears) E.e.rotation.set(0, E.sd * (0.3 + 0.35 * fl), -E.sd * (0.32 - 0.55 * fl));
    tailG.rotation.set(0.15 + 0.1 * lie, 0, 0.55 * Math.sin(Math.PI * clamp(tailK)) * Math.sin(TAU * 2 * tailK));
  };
  pose({}, 0);
  return {
    grip: 0,
    apply(ps, t) {
      const k = ["lie", "graze", "headY", "headP", "chew", "blink", "ears", "tail"].map((n) => num(ps, S, n)).join("|") + "|" + (num(ps, S, "chew") > 0 ? t : 0);
      if (k === key) return; key = k; pose(ps, t);
    },
  };
}
const earInner = () => once("sh-ear-inner", () => {
  const [c, g] = canvas(128, 128); g.fillStyle = SHEEP.pink; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = SHEEP.pinkD; g.lineCap = "round";
  for (let i = 0; i < 9; i++) { g.globalAlpha = 0.3 + 0.3 * rnd(i + 5); g.lineWidth = 1 + 1.4 * rnd(i + 6); g.beginPath(); g.moveTo(0, 64 + (i - 4) * 4); g.quadraticCurveTo(50, 64 + (i - 4) * 12 + (rnd(i) - 0.5) * 10, 118, 64 + (i - 4) * 5); g.stroke(); }
  g.globalAlpha = 1; return tex(c);
});


// ------------------------------------------------------------------------------------------------ crow
// feathers: flat cards with uv (u across, v along), merged; { p, ang (deg from +x toward -z in the wing plane), len, w, sag, tile, lift }
function featherGeo(list, atlas = 4) {
  const pos = [], uv = [], idx = [], N = 4;
  for (const F of list) {
    const base = pos.length / 3, a = F.ang * DEG, d = V(Math.cos(a), 0, -Math.sin(a)), sd = V(Math.sin(a), 0, Math.cos(a));
    for (let i = 0; i <= N; i++) {
      const k = i / N, c = V().copy(F.p).addScaledVector(d, F.len * k); c.y -= F.lift ?? 0; c.y -= (F.sag ?? 0) * F.len * k * k;
      const hw = F.w * (0.78 + 0.22 * Math.sin(Math.PI * Math.min(1, k * 0.9 + 0.05))) * Math.sqrt(Math.max(0, 1 - Math.pow(k, 5.2)));
      pos.push(c.x + sd.x * hw, c.y, c.z + sd.z * hw, c.x - sd.x * hw, c.y, c.z - sd.z * hw);
      uv.push((F.tile + 1) / atlas, 1 - k, F.tile / atlas, 1 - k);
    }
    for (let i = 0; i < N; i++) { const a0 = base + i * 2; idx.push(a0, a0 + 1, a0 + 3, a0, a0 + 3, a0 + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const crowFeatherTex = (sheen) => once("sh-crow-feather" + sheen, () => {
  const [c, g] = canvas(256, 256), TW = 64;
  for (let t = 0; t < 4; t++) {
    const x0 = t * TW; g.fillStyle = "#17171d"; g.fillRect(x0, 0, TW, 256);
    const gr = g.createLinearGradient(0, 0, 0, 256);   // v 0 = the tip (top of the canvas), 1 = the root
    gr.addColorStop(0, sheen ? "rgba(92,84,190,0.85)" : "rgba(60,60,90,0.5)"); gr.addColorStop(0.35, sheen ? "rgba(62,82,170,0.6)" : "rgba(40,40,64,0.3)"); gr.addColorStop(0.8, "rgba(20,20,40,0)");
    g.fillStyle = gr; g.fillRect(x0, 0, TW, 256);
    for (let i = 0; i < 70; i++) { const y = rnd(t * 100 + i + 3) * 256, l = 20 + 70 * rnd(t * 100 + i + 5), xs = rnd(t * 100 + i + 7) * TW; g.strokeStyle = rnd(t * 100 + i + 9) > 0.5 ? (sheen ? "#5b64c8" : "#3a3a4e") : "#0c0c10"; g.globalAlpha = 0.18 + 0.3 * rnd(t * 100 + i + 11); g.lineWidth = 0.8 + rnd(t * 100 + i + 13); g.beginPath(); g.moveTo(x0 + TW / 2, y); g.lineTo(x0 + xs, y + l * 0.5 * (xs < TW / 2 ? 1 : 1)); g.stroke(); }   // barbs leaving the shaft
    g.globalAlpha = 0.7; g.strokeStyle = "#07070a"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0 + TW / 2, 0); g.lineTo(x0 + TW / 2 + (t - 1.5) * 1.2, 256); g.stroke();   // the shaft
    g.globalAlpha = 0.5; g.strokeStyle = sheen ? "#8f93e0" : "#55556a"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + TW / 2 + 2, 6); g.lineTo(x0 + TW / 2 + 2 + (t - 1.5), 190); g.stroke(); g.globalAlpha = 1;
  }
  return tex(c);
});
const crowBodyTex = () => once("sh-crow-body", () => {
  const [c, g] = canvas(512, 256); g.fillStyle = "#15151b"; g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 22; r++) for (let i = 0; i < 40; i++) {   // rows of overlapping feather tips, each its own tone and sheen
    const x = (i + 0.5 * (r % 2)) * 12.8 + (rnd(r * 77 + i) - 0.5) * 3, y = r * 11.6 + 8, l = rnd(r * 53 + i + 5);
    g.fillStyle = l > 0.6 ? "#272735" : l > 0.25 ? "#1d1d28" : "#101015"; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(x, y, 7.5, 7, 0, 0, Math.PI); g.fill();
    g.strokeStyle = l > 0.5 ? "#4a54a8" : "#2a2e5a"; g.globalAlpha = 0.18 + 0.3 * rnd(r * 31 + i + 9); g.lineWidth = 1; g.beginPath(); g.arc(x, y, 7, 0.15, Math.PI - 0.15); g.stroke(); g.globalAlpha = 1;
  }
  return tex(c);
});
const CROW = {
  body: [[-0.15, 0, 0.016, 0.018, 0.014, 2], [-0.1, 0, 0.038, 0.04, 0.033, 2.1], [-0.04, 0.002, 0.057, 0.057, 0.05, 2.15], [0.03, 0.003, 0.063, 0.06, 0.056, 2.15], [0.09, 0.004, 0.054, 0.056, 0.05, 2.1], [0.127, 0.006, 0.03, 0.034, 0.032, 2], [0.14, 0.008, 0.016, 0.02, 0.018, 2]],
  neck: [[-0.025, -0.012, 0.04, 0.036, 0.04], [0.0, 0.006, 0.038, 0.036, 0.038], [0.025, 0.026, 0.034, 0.033, 0.034], [0.04, 0.044, 0.03, 0.03, 0.03]],
  head: [[-0.03, 0.0, 0.023, 0.026, 0.024, 2.2], [0.0, 0.002, 0.031, 0.033, 0.029, 2.2], [0.028, 0.0, 0.03, 0.032, 0.027, 2.2], [0.05, -0.003, 0.025, 0.028, 0.024, 2.2], [0.062, -0.005, 0.018, 0.024, 0.02, 2.2]],
  beak: [[0.05, -0.003, 0.016, 0.0225, 0.0105, 2.3], [0.068, -0.004, 0.0135, 0.0205, 0.0095, 2.3], [0.088, -0.0075, 0.0095, 0.0155, 0.007, 2.3], [0.104, -0.0125, 0.0055, 0.0095, 0.0045, 2.3], [0.116, -0.0185, 0.0014, 0.0035, 0.002, 2]],
  lower: [[0.05, -0.0155, 0.013, 0.0055, 0.0085, 2.3], [0.07, -0.0165, 0.0105, 0.0055, 0.0075, 2.3], [0.09, -0.0195, 0.0072, 0.0045, 0.006, 2.3], [0.105, -0.0235, 0.0036, 0.003, 0.0035, 2.3], [0.112, -0.0265, 0.001, 0.0015, 0.0015, 2]],
};
function crow(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const black = mat("#ffffff", { map: crowBodyTex(), roughness: 0.32, metalness: 0.05 }), featherM = mat("#ffffff", { map: crowFeatherTex(true), roughness: 0.3, side: THREE.DoubleSide }), tailM = mat("#ffffff", { map: crowFeatherTex(false), roughness: 0.35, side: THREE.DoubleSide });
  const beakM = mat("#1a1a1e", { roughness: 0.25 }), legM = mat("#2b2a30", { roughness: 0.6 }), mouthM = mat("#7a2a2e", { roughness: 0.6 });
  const bodyG = new THREE.Group(); bodyG.position.set(0, 0.158, 0); G.add(bodyG);
  const bSecs = CROW.body.map(([z, y, w, up, dn, n]) => ({ c: [0, y, z], w, up, dn, n }));
  const bl = makeLoft(bSecs, { sub: 5, radial: 22, ref: [0, 1, 0] }); bl.userData.set(bSecs); mesh(bl, black, bodyG);
  // thigh feathers (trousers), the vent and a few loose body feathers hanging over the wing roots
  { const L = []; for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1; L.push([V(sd * (0.045 + 0.006 * rnd(i + 3)), -0.034, -0.04 + 0.02 * rnd(i + 4)), V(sd * 0.1, -0.7, 0.1 * rnd(i + 5) - 0.1).normalize(), 0.05 + 0.02 * rnd(i + 6), 0.012, 0.1, V(0, 0, 1), 0.7, 3]); }
    mesh(cardGeo(L), mat("#1b1b24", { roughness: 0.4, side: THREE.DoubleSide }), bodyG).castShadow = false; }
  // the tail: nine flight feathers in a narrow fan, slightly drooped
  { const L = []; for (let i = 0; i < 9; i++) { const k = i / 8 - 0.5, a = 180 - k * 26 + 0; L.push({ p: V(k * 0.012, -0.005 + 0.0009 * Math.abs(i - 4), -0.12), ang: 90 + k * 22, len: 0.19 - 0.012 * Math.abs(k) * 4, w: 0.0195, sag: 0.1, tile: i % 4, lift: -0.0008 * (i % 2) }); void a; }
    // featherGeo's angle runs from +x toward -z: ang 90 points straight back
    mesh(featherGeo(L), tailM, bodyG).castShadow = false; }
  // wings: shoulder groups; every feather is a flat card in the wing's own plane (+x outward, -z back), rebuilt when `wings` changes
  const wings = [];
  for (const sd of [1, -1]) {
    const hold = new THREE.Group(); hold.scale.x = sd; hold.position.set(sd * 0.064, 0.04, 0.03); bodyG.add(hold);
    const wg = new THREE.Group(); wg.rotation.order = "YXZ"; hold.add(wg);
    const arm = mesh(new THREE.SphereGeometry(1, 14, 10), black, wg); arm.scale.set(0.07, 0.01, 0.022); arm.position.set(0.05, -0.004, -0.008); arm.castShadow = false;
    const fm = mesh(new THREE.BufferGeometry(), featherM, wg); fm.castShadow = false; fm.frustumCulled = false;
    wings.push({ wg, fm, sd });
  }
  const wingFeathers = (w) => {   // w 0 folded .. 1 spread
    const L = [], fan = lerp(0.12, 1, w), wr = V(0.15, 0, -0.03);   // the wrist
    for (let i = 0; i < 9; i++) {   // primaries from the wrist: the leading one points out, the rest sweep back
      const k = i / 8, spread = lerp(-6, 62, k) , fold = (k - 0.5) * 8;
      L.push({ p: wr.clone().add(V(-0.004 * i, 0.0006 * i, 0)), ang: lerp(fold, spread, w) + (i === 0 ? 0 : 0), len: 0.2 - 0.022 * Math.abs(k - 0.25) * 3.2 * (w * 0.6 + 0.4) + 0.005, w: 0.0115, sag: 0.1 * w, tile: i % 4, lift: 0.0009 * i });
    }
    for (let i = 0; i < 9; i++) {   // secondaries along the forearm's trailing edge
      const k = i / 8, x = lerp(0.135, 0.02, k);
      L.push({ p: V(x, 0.003 + 0.0008 * i, -0.02 - 0.012 * (1 - k) * w), ang: lerp((k - 0.5) * 6, 78 + 14 * k, w), len: 0.108 + 0.02 * Math.sin(Math.PI * Math.min(1, k * 1.1)) + 0.012, w: 0.0145, sag: 0.08 * w, tile: (i + 1) % 4, lift: 0.0006 * i });
    }
    for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {   // coverts: three rows of short wide feathers over the roots, each its own length
      const k = i / 7, x = lerp(0.015, 0.145, k) - 0.002 * r;
      L.push({ p: V(x, 0.011 + 0.003 * r, 0.004 - 0.02 * r), ang: lerp(0, 82, w) * 0 + lerp((k - 0.5) * 6, 84, w) , len: 0.06 - 0.012 * r + 0.012 * rnd(r * 9 + i), w: 0.0135 - 0.001 * r, sag: 0.05 * w, tile: (i + r) % 4, lift: 0.0035 * r });
    }
    return L;
  };
  // ---- head and neck: one rigid group pivoting at the neck's base
  const headG = new THREE.Group(); headG.rotation.order = "YXZ"; headG.position.set(0, 0.026, 0.1); bodyG.add(headG);
  const nS = CROW.neck.map(([z, y, w, up, dn]) => ({ c: [0, y, z], w, up, dn })), nl = makeLoft(nS, { sub: 4, radial: 18, ref: [0, 1, 0] }); nl.userData.set(nS); mesh(nl, black, headG);
  const hS = CROW.head.map(([z, y, w, up, dn, n]) => ({ c: [0, y + 0.062, z + 0.05], w, up, dn, n })), hl = makeLoft(hS, { sub: 4, radial: 20, ref: [0, 1, 0] }); hl.userData.set(hS); mesh(hl, black, headG);
  const bkS = CROW.beak.map(([z, y, w, up, dn, n]) => ({ c: [0, y + 0.062, z + 0.05], w, up, dn, n })), bk = makeLoft(bkS, { sub: 4, radial: 16, ref: [0, 1, 0] }); bk.userData.set(bkS); mesh(bk, beakM, headG);
  const lower = new THREE.Group(); lower.position.set(0, 0.062 - 0.012, 0.05 + 0.045); headG.add(lower);
  const lwS = CROW.lower.map(([z, y, w, up, dn, n]) => ({ c: [0, y + 0.012, z - 0.045], w, up, dn, n })), lw = makeLoft(lwS, { sub: 4, radial: 14, ref: [0, 1, 0] }); lw.userData.set(lwS); mesh(lw, beakM, lower);
  const tongue = mesh(new THREE.SphereGeometry(1, 10, 6), mat("#c9737a", { roughness: 0.6 }), lower, 0, 0.0035, 0.025); tongue.scale.set(0.0045, 0.0018, 0.022); tongue.castShadow = false;
  const gape = mesh(new THREE.SphereGeometry(1, 10, 6), mouthM, lower, 0, 0.002, 0.018); gape.scale.set(0.0105, 0.0022, 0.028); gape.castShadow = false;
  // the bristles over the nostrils, the eyes (dark brown with a glint) and a lighter lid line
  { const L = []; for (let i = 0; i < 12; i++) { const sd = i % 2 ? 1 : -1; L.push([V(sd * 0.007 * (1 + i / 12), 0.074 + 0.003 * rnd(i + 70), 0.06 + 0.004 * (i >> 1)), V(sd * 0.18, -0.08, 0.95).normalize(), 0.022 + 0.01 * rnd(i + 72), 0.0024, 0.1, V(0, 1, 0), 0.7, 2]); }
    mesh(cardGeo(L), mat("#0d0d10", { roughness: 0.5, side: THREE.DoubleSide }), headG).castShadow = false; }
  const eyes = [];
  for (const sd of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sd * 0.0285, 0.071, 0.056); eg.quaternion.setFromUnitVectors(V(0, 0, 1), V(sd, 0.1, 0.5).normalize()); headG.add(eg);
    mesh(new THREE.SphereGeometry(0.0062, 14, 10), mat("#1d1410", { roughness: 0.2 }), eg).castShadow = false;
    const hl2 = new THREE.Mesh(new THREE.CircleGeometry(0.0017, 8), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); hl2.position.set(-sd * 0.0018, 0.002, 0.0063); hl2.material.userData.noOutline = true; eg.add(hl2);
    const lid = new THREE.Group(); eg.add(lid); mesh(new THREE.SphereGeometry(0.0067, 14, 8, 0, TAU, 0, Math.PI / 2), black, lid).castShadow = false; eyes.push({ lid });
  }
  // ---- legs: scaled dark tarsi, three toes forward and one back, each with a claw; they stay on the perch when the body hops (they stretch)
  const legG = [];
  for (const sd of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(sd * 0.032, 0.0, 0.0); G.add(lg);
    const leg = mesh(tubeGeo([V(0, 0.105, -0.012), V(0, 0.075, 0.0), V(0, 0.045, 0.006), V(0, 0.012, 0.012)], 0.0064, 7, false, 10), legM, lg);
    for (let i = 0; i < 6; i++) { const sc = mesh(new THREE.TorusGeometry(0.0068, 0.0011, 4, 8), mat("#17161a"), lg, 0, 0.088 - i * 0.012, 0.0 + 0.0025 * i); sc.rotation.x = Math.PI / 2; sc.castShadow = false; }   // the scutes
    for (const [a, len] of [[-34, 0.034], [0, 0.04], [34, 0.034], [180, 0.03]]) {
      const ar = a * DEG, tg = new THREE.Group(); tg.position.set(0, 0.008, 0.012); tg.rotation.y = ar; lg.add(tg);
      const t = mesh(new THREE.CylinderGeometry(0.0042, 0.0052, len, 6), legM, tg, 0, 0, len / 2); t.rotation.x = Math.PI / 2; t.position.y = -0.003;
      const cl = mesh(new THREE.ConeGeometry(0.0036, 0.011, 6), mat("#101012", { roughness: 0.4 }), tg, 0, -0.005, len + 0.003); cl.rotation.x = Math.PI / 2 + 0.5;
    }
    legG.push(lg); void leg;
  }
  // ---- state
  let key = "", wkey = "";
  const pose = (ps, t) => {
    const hop = clamp(num(ps, S, "hop")), caw = clamp(num(ps, S, "caw")), wspread = clamp(num(ps, S, "wings")), hy = clamp(num(ps, S, "headY"), -1, 1);
    const hh = 0.075 * Math.sin(Math.PI * hop), w = Math.max(wspread, 0.4 * Math.sin(Math.PI * hop) ** 1.5);
    G.position.y = hh;
    bodyG.rotation.x = -0.36 + 0.2 * caw - 0.12 * Math.sin(Math.PI * hop) + 0.12 * wspread; bodyG.position.y = 0.158 - 0.012 * caw;
    for (const lg of legG) lg.scale.y = 1 + hh / 0.1;   // the legs stretch to stay on the ground while the body is up
    headG.rotation.set(-0.55 * caw + 0.2 * 0 + 0.26, hy * 75 * DEG, 0);
    lower.rotation.x = 0.62 * caw; tongue.visible = gape.visible = caw > 0.05;
    for (const E of eyes) E.lid.rotation.x = -1.2;
    const k = w.toFixed(3); if (k !== wkey) { wkey = k; for (const W of wings) { W.fm.geometry.dispose(); W.fm.geometry = featherGeo(wingFeathers(w)); W.wg.rotation.set(lerp(-1.5, 0, w), lerp(1.48, 0, w), 0); W.wg.position.y = lerp(-0.0, 0, w); } }
  };
  pose({}, 0);
  return { grip: 0, apply(ps, t) { const k = ["hop", "caw", "wings", "headY"].map((n) => num(ps, S, n)).join("|"); if (k === key) return; key = k; pose(ps, t); } };
}

// ------------------------------------------------------------------------------------------------ worn knitwear: bobblehat and scarf
// The four cast bodies as potato.js bodyPoint() draws them (AA_BODIES from the pilot's items file, the sprout's size from characters/potatobrawl/*.json),
// so a worn prop sits on the real skin with no storyboard numbers.
const SPROUT = { spud: 1, chip: 1.25, wedge: 2.2, mash: 2.2 };
const CLOTH = { spud: 0.03, chip: 0.03, wedge: 0.075, mash: 0.05 };      // how far the scarf stands off the skin: the sweater, the hoodie and the fur collar are under it
const POM = { spud: [-0.07, -0.02], chip: [0, -0.07], wedge: [-0.1, -0.03], mash: [-0.05, -0.03] };   // where the pom-pom sits on the crown (x, z): away from the leaf
function wornDef(S) {
  const f = S.fit ?? S.wear;
  if (f && typeof f === "object") return { ...AA_BODIES.spud, ...f, sprout: f.sprout ?? 1, cloth: f.cloth ?? 0.03, pom: f.pom ?? [-0.07, -0.02] };
  const key = String(f ?? "spud").replace(/^.*\//, "");
  return { ...(AA_BODIES[key] || AA_BODIES.spud), sprout: SPROUT[key] ?? 1, cloth: CLOTH[key] ?? 0.03, pom: POM[key] ?? [-0.07, -0.02] };
}
function wornBody(B) {
  const rx = B.width / 2, ry = B.height / 2, rz = B.depth / 2, cy = 0.14 + ry;
  let sd = (B.seed || 1) * 7919 >>> 0 || 1;
  const rg = () => { sd = (sd + 0x6d2b79f5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lumps = Array.from({ length: 9 }, () => { const d = V(rg() * 2 - 1, rg() * 2 - 1, rg() * 2 - 1).normalize(); return { d, a: (rg() * 2 - 1) * B.lump, k: 3 + rg() * 5 }; });
  const _d = V();
  const point = (d) => {   // = Character.bodyPoint
    let r = 1; for (const L of lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (B.taper ?? 0.07) * d.y;
    if (B.square) { const q = B.square; r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q); }
    return V(d.x * rx * taper * r, cy + d.y * ry * r, d.z * rz * taper * r);
  };
  const ring = (alpha, y) => {   // the skin point at horizontal direction alpha (0 = front +z, + toward +x) and height y
    const th = Math.atan2(rz * Math.sin(alpha), rx * Math.cos(alpha)), st = Math.sin(th), ct = Math.cos(th);
    let lo = -Math.PI / 2 + 1e-4, hi = Math.PI / 2 - 1e-4;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m))).y < y) lo = m; else hi = m; }
    const m = (lo + hi) / 2; return point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m)));
  };
  const normal = (alpha, y) => { const e = 0.004, a = ring(alpha + e, y).sub(ring(alpha - e, y)), b = ring(alpha, y + e).sub(ring(alpha, y - e)); return a.cross(b).normalize(); };
  const crown = point(V(0, 1, 0)).y;
  const frontY = (deg) => point(V(0, Math.sin(deg * DEG), Math.cos(deg * DEG))).y;   // the skin height straight ahead at an elevation
  return { rx, ry, rz, cy, point, ring, normal, crown, frontY };
}
// one knitted stitch field: rows of V stitches (columns x rows), each its own tone and strength
const knitTex = (key, base, cols, rows, W, H, opts = {}) => once(key, () => {
  const [c, g] = canvas(W, H), col = new THREE.Color(base), hex = (k) => "#" + col.clone().multiplyScalar(k).getHexString();
  g.fillStyle = hex(0.78); g.fillRect(0, 0, W, H);
  const cw = W / cols, rh = H / rows;
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5 * (opts.stagger ? r % 2 : 0)) * cw, y = r * rh, l = rnd(r * 211 + i * 7 + (opts.seed ?? 0));
    for (const sd of [-1, 1]) {   // the two legs of the V
      g.strokeStyle = l > 0.6 ? hex(1.2) : l > 0.25 ? hex(1.04) : hex(0.92); g.globalAlpha = 0.75 + 0.25 * rnd(r * 31 + i + 5); g.lineWidth = cw * 0.34; g.lineCap = "round";
      g.beginPath(); g.moveTo(x + cw * 0.5 + sd * cw * 0.3, y + rh * 0.12); g.lineTo(x + cw * 0.5, y + rh * 0.86); g.stroke();
    }
    g.strokeStyle = hex(0.6); g.globalAlpha = 0.35; g.lineWidth = 1; g.beginPath(); g.moveTo(x + cw * 0.5, y + rh * 0.9); g.lineTo(x + cw * 0.5, y + rh); g.stroke();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 60; i++) { g.strokeStyle = hex(1.3); g.globalAlpha = 0.45; g.lineWidth = 1; const x = rnd(i + 301) * W, y = rnd(i + 302) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + 5 * rnd(i + 303), y + (rnd(i + 304) - 0.5) * 6); g.stroke(); }   // stray fibres
  g.globalAlpha = 1; const t = tex(c); return t;
});
const ribTex = (key, base, cols, W, H) => once(key, () => {
  const [c, g] = canvas(W, H), col = new THREE.Color(base), hex = (k) => "#" + col.clone().multiplyScalar(k).getHexString(), cw = W / cols;
  g.fillStyle = hex(0.85); g.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i += 2) { g.fillStyle = hex(1.1); g.fillRect(i * cw, 0, cw, H); }
  for (let i = 0; i < cols; i++) for (let y = 0; y < H; y += 8) { g.strokeStyle = hex(i % 2 ? 0.7 : 1.28); g.globalAlpha = 0.5; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i * cw + cw * 0.5, y); g.lineTo(i * cw + cw * (i % 2 ? 0.3 : 0.7), y + 6); g.stroke(); }
  g.globalAlpha = 1; return tex(c);
});
// the fibres of a pom-pom / fringe: thin tapered cards, each its own place, length and direction
function fuzz(centre, rad, n, len, seed, up = 1) {
  const L = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(seed + i * 5 + 1) * TAU, b = Math.acos(1 - 2 * rnd(seed + i * 5 + 2) * up), d = V(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
    L.push([V().copy(centre).addScaledVector(d, rad * 0.55), d, len * (0.7 + 0.5 * rnd(seed + i * 5 + 3)), 0.0042, 0.25, V().crossVectors(d, V(0, 1, 0.3)).normalize(), 0.6, 2]);
  }
  return L;
}

// the knitted winter hat: a ribbed turned-up cuff round the head just above the brows, a stitched cap, a pom-pom behind the crown and a slit for the leaf
function bobblehat(P) {
  const S = P.spec, BD = wornDef(S), B = wornBody(BD), C = S.color ?? "#c23b3b", POM = S.pom ?? "#f4f1e6";
  const yb = B.frontY(S.rim ?? 33), CUFF = S.cuff ?? 0.062, yt = yb + CUFF;
  const g = new THREE.Group(); P.whole.add(g);
  const knitM = mat("#ffffff", { map: knitTex("sh-knit-cap" + C, C, 72, 34, 2048, 1024, { seed: 5 }), roughness: 0.95 }), ribM = mat("#ffffff", { map: ribTex("sh-knit-rib" + C, C, 48, 1024, 128), roughness: 0.95 }), edgeM = mat(C, { roughness: 0.95 });
  for (const m of [knitM, ribM, edgeM]) { m.userData.noHatch = true; m.userData.lineK = 0.7; }
  const NA = 288, NC = 384, phis = Math.asin(clamp((yt - B.cy) / B.ry, -1, 1));
  // the slit for the leaf: half sizes by the sprout's size; without it the pom-pom shuts a small round hole
  const ss = BD.sprout, hz = S.slit === false ? 0.012 : 0.010 + 0.0125 * ss, hx = S.slit === false ? 0.012 : hz * 1.35;
  const holeR = (a) => (hx * hz) / Math.sqrt((hz * Math.sin(a)) ** 2 + (hx * Math.cos(a)) ** 2);   // the hole's radius at horizontal direction a from +x ... in (alpha from +z) terms below
  const holeAt = (alpha) => holeR(Math.PI / 2 - alpha);
  const yEnds = new Map();
  const capAt = (u, v) => {   // u round (alpha from +z toward +x), v up from the cuff top to the hole
    const a = u * TAU, rh = holeAt(a), kk = Math.round(u * 1e4);
    // the end elevation: where the ring's horizontal radius is the hole's (found once per direction)
    if (!yEnds.has(kk)) { let lo = yt, hi = B.crown - 1e-3; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2, q = B.ring(a, m); if (Math.hypot(q.x, q.z) > rh) lo = m; else hi = m; } yEnds.set(kk, (lo + hi) / 2); }
    const yEnd = yEnds.get(kk), ph = lerp(phis, Math.asin(clamp((yEnd - B.cy) / B.ry, -1, 1)), v), y = clamp(B.cy + B.ry * Math.sin(ph), yt, yEnd);
    const p = B.ring(a, y), n = B.normal(a, y), wale = 0.0013 * Math.sin(u * 72 * TAU) * 1, ex = BD.hatExtra ?? 0;
    p.addScaledVector(n, 0.0085 + wale + 0.004 * Math.sin(Math.PI * Math.min(1, v * 1.4)) * 0.5);
    if (ex) { const k = 1 + 1.2 * ex * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.05)); p.x *= k; p.z *= k; p.y += ex * Math.pow(v, 1.3); }   // a taller, wider crown for the sunglasses on his head
    return p;
  };
  const cap = surfGrid((u, v) => capAt(u, v), NA, 26, false); mesh(cap, knitM, g);
  // the cuff: a doubled ribbed band, thicker than the cap, its two edges rolled
  const cuffAt = (u, v) => { const a = u * TAU, y = lerp(yb, yt, v), n = B.normal(a, y), rib = 0.0021 * Math.sin(u * 48 * TAU); return B.ring(a, y).addScaledVector(n, 0.0125 + rib + 0.004 * Math.sin(Math.PI * v)); };
  mesh(surfGrid(cuffAt, NC, 6, false), ribM, g);
  for (const [y, o] of [[yb, 0.0075], [yt, 0.011]]) { const pts = []; for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU; pts.push(B.ring(a, y).addScaledVector(B.normal(a, y), o + 0.002)); } mesh(tubeGeo(pts, 0.0062, 8, true, 192), edgeM, g); }
  // the slit's lip: a rolled edge round the hole, and a dark inside so the leaf's stem comes out of the knit
  { const pts = []; for (let i = 0; i < 40; i++) { const u = i / 40, q = capAt(u, 1); pts.push(q.addScaledVector(V(0, 1, 0), 0.0015)); } mesh(tubeGeo(pts, 0.0034, 6, true, 80), edgeM, g); }
  // the pom-pom: a core and a hundred fibres, set on the crown behind the leaf
  const pomR = S.pomR ?? 0.05 * (0.75 + 0.25 * BD.width / 0.76), [px, pz] = S.pomAt ?? BD.pom, pomAl = Math.atan2(px, pz), pomRad = Math.hypot(px, pz) * (BD.hatExtra ? 1.15 : 1);
  { let lo = yt, hi = B.crown; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2, q = B.ring(pomAl, m); if (Math.hypot(q.x, q.z) > pomRad) lo = m; else hi = m; }
    const y = (lo + hi) / 2, base = B.ring(pomAl, y), n = B.normal(pomAl, y), ex = BD.hatExtra ?? 0, centre = base.clone().addScaledVector(n, pomR * 0.55 + 0.006);
    if (ex) { centre.x *= 1 + 1.2 * ex * 0.9; centre.z *= 1 + 1.2 * ex * 0.9; centre.y += ex * 0.85; }
    const pm = mat(POM, { roughness: 1 }); pm.userData.noHatch = true; pm.userData.lineK = 0.6; pm.userData.lineColor = "#9a9486";
    mesh(new THREE.SphereGeometry(pomR * 0.78, 16, 12), pm, g, centre.x, centre.y, centre.z);
    const fm = mat(POM, { roughness: 1, side: THREE.DoubleSide }); fm.userData.noOutline = true; fm.userData.noHatch = true;
    mesh(cardGeo(fuzz(centre, pomR * 1.7, 150, pomR * 0.7, 40)), fm, g).castShadow = false;
    const fm2 = mat("#e4dfd0", { roughness: 1, side: THREE.DoubleSide }); fm2.userData.noOutline = true; fm2.userData.noHatch = true;
    mesh(cardGeo(fuzz(centre, pomR * 1.5, 90, pomR * 0.6, 90)), fm2, g).castShadow = false; }
  // stray fibres of the knit
  { const fm = mat(C, { roughness: 1, side: THREE.DoubleSide }); fm.userData.noOutline = true;
    const L = []; for (let i = 0; i < 46; i++) { const a = rnd(i * 3 + 500) * TAU, y = lerp(yt, B.crown - 0.04, rnd(i * 3 + 501) ** 1.3), p = B.ring(a, y), n = B.normal(a, y); L.push([p.addScaledVector(n, 0.01), n.clone().add(V(rnd(i + 3) - 0.5, rnd(i + 5) - 0.3, rnd(i + 7) - 0.5).multiplyScalar(0.8)).normalize(), 0.014 + 0.012 * rnd(i * 3 + 502), 0.0022, 0.3, V().crossVectors(n, V(0, 1, 0)).normalize(), 0.7, 2]); }
    mesh(cardGeo(L), fm, g).castShadow = false; }
  return { grip: 0 };
}

// the knitted scarf: wound once round the body just under the face (a puffy band, one end laid over the other at the front left) and two ends
// hanging down the chest on the wearer's left, a fringe on each, that sway a little on the clip clock
function scarf(P) {
  const S = P.spec, BD = wornDef(S), B = wornBody(BD), C = S.color ?? "#2f6fb0", ST = S.stripe ?? null;
  const g = new THREE.Group(); P.whole.add(g);
  const H = S.width ?? 0.088, W = 0.078, CL = S.cloth ?? BD.cloth, yc = B.frontY(S.drop ?? -12) - H / 2 - 0.012;   // just under the mouth
  const tile = 0.22;   // one stripe repeat along the scarf, metres
  const tx = (rep) => { const t = scarfTex(C, ST); const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rep, 1); return c; };
  const scarfTex = (c1, c2) => once("sh-scarf" + c1 + c2, () => {
    const Wp = 1024, Hp = 256, [cv, gg] = canvas(Wp, Hp), col = new THREE.Color(c1), hex = (k) => "#" + col.clone().multiplyScalar(k).getHexString();
    gg.fillStyle = hex(0.8); gg.fillRect(0, 0, Wp, Hp);
    const cols = 40, rows = 10, cw = Wp / cols, rh = Hp / rows;
    for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {   // garter ridges across the width, V stitches along the length
      const x = i * cw, y = r * rh, l = rnd(r * 73 + i * 3 + 11), stripe = c2 && ((x / Wp > 0.56 && x / Wp < 0.64) || (x / Wp > 0.7 && x / Wp < 0.74));
      const base = stripe ? new THREE.Color(c2) : col, hh = (k) => "#" + base.clone().multiplyScalar(k).getHexString();
      for (const sd of [-1, 1]) { gg.strokeStyle = l > 0.6 ? hh(1.22) : l > 0.25 ? hh(1.04) : hh(0.9); gg.globalAlpha = 0.8; gg.lineWidth = rh * 0.3; gg.lineCap = "round"; gg.beginPath(); gg.moveTo(x + cw * 0.12, y + rh * 0.5 + sd * rh * 0.22); gg.lineTo(x + cw * 0.9, y + rh * 0.5); gg.stroke(); }
      gg.strokeStyle = hh(0.62); gg.globalAlpha = 0.4; gg.lineWidth = 1.2; gg.beginPath(); gg.moveTo(x, y + rh - 1); gg.lineTo(x + cw, y + rh - 1); gg.stroke();
    }
    gg.globalAlpha = 1; return tex(cv);
  });
  const mkM = (rep) => { const m = mat("#ffffff", { map: tx(rep), roughness: 0.95, side: THREE.DoubleSide }); m.userData.noHatch = true; m.userData.lineK = 0.7; return m; };
  // the wrap: one turn and a bit; at the front left it lies over its own start (a second layer, a little lower and further out)
  const T = 1.16, a0 = 0.65 - T * TAU;   // it ends at alpha 0.65 rad (front, toward +x = the wearer's left)
  const wrapAt = (u, v) => {
    const a = a0 + u * T * TAU, lap = sstep(1 / T - 0.05, 1 / T + 0.02, u), y = yc + (v - 0.5) * H - 0.014 * lap + 0.006 * (1 - u);
    const n = B.normal(a, y), out = CL + 0.016 + 0.015 * Math.sin(Math.PI * v) ** 0.8 + 0.02 * lap + 0.0012 * Math.sin(u * T * 26 * TAU);
    return B.ring(a, y).addScaledVector(n, out);
  };
  const lenWrap = T * TAU * (B.rx + B.rz) / 2;
  mesh(surfGrid(wrapAt, 280, 10, false), mkM(lenWrap / tile), g);
  // the two hanging ends: flat knitted strips on the chest, each swinging a little about the point it leaves the wrap
  const ends = [];
  for (const [i, [len, al, off]] of [[0.35, 0.58, 0.046], [0.25, 0.8, 0.054]].entries()) {
    const hang = new THREE.Group(); const yTop = yc - 0.012 - 0.01 * i, p = B.ring(al, yTop), n = B.normal(al, yTop);
    hang.position.copy(p).addScaledVector(n, off + CL); hang.rotation.order = "YXZ"; hang.rotation.y = al; g.add(hang);
    const strip = surfGrid((u, v) => V((u - 0.5) * W, -v * len, 0.0), 8, 24, false);   // faces +z
    const sp = strip.attributes.position, uv = strip.attributes.uv; for (let k = 0; k < sp.count; k++) { const v = -sp.getY(k) / len; sp.setZ(k, 0.006 * Math.sin(Math.PI * uv.getX(k)) + 0.012 * v * v); }
    strip.computeVertexNormals();
    // the strip's texture runs across its width: repeat the scarf texture along the length
    for (let k = 0; k < sp.count; k++) uv.setXY(k, uv.getY(k), uv.getX(k));   // the texture's length runs down the strip
    mesh(strip, mkM(len / tile), hang);
    // the fringe: a row of yarn tassels along the cut end
    const fr = []; for (let k = 0; k < 15; k++) fr.push([V((k / 14 - 0.5) * W * 0.96, -len, 0.014), V(0.05 * (rnd(k + i * 20) - 0.5), -1, 0.05).normalize(), 0.035 + 0.012 * rnd(k + i * 40), 0.0034, 0.15, V(0, 0, 1), 0.8, 2]);
    const fm = mat(ST ?? C, { roughness: 1, side: THREE.DoubleSide }); fm.userData.noOutline = true; fm.userData.noHatch = true;
    mesh(cardGeo(fr), fm, hang).castShadow = false;
    ends.push({ hang, ph: i * 1.7 + 0.4, al });
  }
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0;
      for (const E of ends) { E.hang.rotation.x = 0.05 * Math.sin(TAU * 0.33 * tt + E.ph); E.hang.rotation.z = 0.07 * Math.sin(TAU * 0.27 * tt + E.ph * 1.3); }
    },
  };
}

// ------------------------------------------------------------------------------------------------ scenery: the visitors' rope and the shuttle bus
const scenery = (o) => { o.traverse((m) => { m.userData.solid = false; m.userData.lookOnly = true; }); return o; };
const postTex = () => once("sh-post", () => {
  const [c, g] = canvas(128, 256); g.fillStyle = "#2f4a3c"; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = rnd(i + 3) > 0.5 ? "#3a5a49" : "#25392f"; g.globalAlpha = 0.5; g.fillRect(rnd(i + 5) * 128, 0, 3 + 12 * rnd(i + 7), 256); }   // brush streaks down the paint
  g.globalAlpha = 1;
  for (let i = 0; i < 38; i++) { const x = rnd(i + 11) * 128, y = rnd(i + 13) * 256, r = 1 + 3 * rnd(i + 15); g.fillStyle = rnd(i + 17) > 0.35 ? "#7e8a7a" : "#9a6a3a"; g.globalAlpha = 0.5 + 0.4 * rnd(i + 19); g.beginPath(); g.ellipse(x, y, r * 1.5, r, rnd(i + 21) * 3, 0, TAU); g.fill(); }   // chips down to the primer and rust
  for (let i = 0; i < 8; i++) { const x = rnd(i + 31) * 128; g.strokeStyle = "#8a4f2a"; g.globalAlpha = 0.45; g.lineWidth = 1.5 + 2 * rnd(i + 33); g.beginPath(); g.moveTo(x, 256); g.lineTo(x + (rnd(i + 35) - 0.5) * 6, 256 - 40 - 60 * rnd(i + 37)); g.stroke(); }   // rust creeping up from the base
  g.globalAlpha = 1; return tex(c);
});
const ropeTex = () => once("sh-rope", () => {
  const [c, g] = canvas(256, 64); g.fillStyle = "#cfc3a2"; g.fillRect(0, 0, 256, 64);
  for (let i = -4; i < 20; i++) { g.fillStyle = i % 2 ? "#e6dcc0" : "#a89c7c"; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 10, 0); g.lineTo(i * 16 + 34, 64); g.lineTo(i * 16 + 24, 64); g.closePath(); g.fill(); }   // the twist: slanted strands
  for (let i = 0; i < 90; i++) { g.strokeStyle = rnd(i + 3) > 0.5 ? "#f5eed8" : "#7a6e52"; g.globalAlpha = 0.35; g.lineWidth = 1; const x = rnd(i + 5) * 256, y = rnd(i + 7) * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 4); g.stroke(); }   // loose fibres
  g.globalAlpha = 1; return tex(c, [1, 1]);
});
function ropeline(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  let path = [];
  if (S.pts) path = S.pts.map(([x, z]) => V(x, 0, z));
  else { const [r, a0, a1] = S.arc ?? [36, -60, 60], n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * DEG * r / 0.5)); for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n) * DEG; path.push(V(Math.sin(a) * r, 0, Math.cos(a) * r)); } }
  const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + path[i].distanceTo(path[i - 1]));
  const total = cum[cum.length - 1], at = (d) => { let i = 1; while (i < path.length - 1 && cum[i] < d) i++; const f = clamp((d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])); return V().lerpVectors(path[i - 1], path[i], f); };
  const SP = S.gap ?? 2.5, ds = []; for (let d = 0; d < total - 0.3; d += SP) ds.push(d); ds.push(total);
  const posts = ds.map((d) => at(d)), HP = 0.45, HE = 0.395;
  const postM = mat("#ffffff", { map: postTex(), roughness: 0.55, metalness: 0.2 }), rope = mat("#ffffff", { map: ropeTex(), roughness: 0.95 }), cap = mat("#22362c", { roughness: 0.4, metalness: 0.3 }), dark = mat("#1b261f", { roughness: 0.7 });
  const grassM = mat("#7f9a5a", { roughness: 1, side: THREE.DoubleSide }); grassM.userData.noOutline = true;
  const grass = [];
  posts.forEach((p, i) => {
    const pg = new THREE.Group(); pg.position.copy(p); G.add(pg);
    mesh(new THREE.CylinderGeometry(0.0225, 0.026, HP, 14), postM, pg, 0, HP / 2, 0);
    mesh(new THREE.SphereGeometry(0.03, 14, 8, 0, TAU, 0, Math.PI / 2), cap, pg, 0, HP, 0).scale.set(1, 0.7, 1);
    mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.012, 14), dark, pg, 0, HP - 0.02, 0);   // the collar under the cap
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.012, 16), dark, pg, 0, 0.006, 0).castShadow = false;   // the base plate
    const eye = mesh(new THREE.TorusGeometry(0.016, 0.0042, 6, 12), dark, pg, 0, HE, 0.026); eye.rotation.x = Math.PI / 2 * 0 + 0;   // the eye the rope runs through
    for (let k = 0; k < 7; k++) { const a = rnd(i * 17 + k + 3) * TAU, r0 = 0.05 + 0.04 * rnd(i * 17 + k + 5); grass.push([V(p.x + Math.cos(a) * r0, 0, p.z + Math.sin(a) * r0), V(Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25).normalize(), 0.09 + 0.07 * rnd(i * 17 + k + 7), 0.01, 0.3, V(-Math.sin(a), 0, Math.cos(a)), 0.6, 2]); }
  });
  mesh(cardGeo(grass), grassM, G).castShadow = false;
  // the rope: one sagging tube between every two posts, hung in each post's eye (the posts lean a little in or out by hash, so it is not a ruler)
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i].clone(), b = posts[i + 1].clone(), len = a.distanceTo(b), sag = 0.075 + 0.02 * rnd(i + 8), pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, q = V().lerpVectors(a, b, t); q.y = HE - sag * 4 * t * (1 - t); pts.push(q); }
    const tube = mesh(tubeGeo(pts, 0.0125, 6, false, 24), (() => { const m = rope.clone(); m.map = ropeTex().clone(); m.map.needsUpdate = true; m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(len / 0.09, 1); return m; })(), G); tube.castShadow = false;
    mesh(new THREE.SphereGeometry(0.0165, 8, 6), rope, G, a.x, HE, a.z).castShadow = false;   // the knot at the post
  }
  return { grip: 0, scenery: scenery(G) };
}

const busSide = (side) => once("sh-bus-side" + side, () => {
  const W = 2560, H = 640, [c, g] = canvas(W, H), PX = W / 11, Y0 = 0.42, Y1 = 3.1, py = (y) => (Y1 - y) / (Y1 - Y0) * H, px = (z) => (side > 0 ? (5.5 - z) : (z + 5.5)) * PX;
  g.clearRect(0, 0, W, H);
  // white upper body, dark green lower band (painted here so the decal and the hull agree), a thin green line under the windows
  g.fillStyle = "#f1efe7"; g.fillRect(0, 0, W, py(1.15)); g.fillStyle = "#2c5740"; g.fillRect(0, py(1.15), W, H - py(1.15));
  g.fillStyle = "#e6e3d8"; g.fillRect(0, py(1.2), W, py(1.15) - py(1.2) + 3);
  g.fillStyle = "#2c5740"; g.fillRect(0, py(2.72), W, 7); g.fillRect(0, py(1.62) - 18, W, 5);
  // dirt: rain streaks down from under the windows, mud splashes up the skirt, each its own place, width and strength
  for (let i = 0; i < 160; i++) { const x = rnd(i + 3) * W, y0 = py(1.62 + 0.02 * rnd(i + 5)), l = 30 + 140 * rnd(i + 7); g.strokeStyle = "#8d887a"; g.globalAlpha = 0.06 + 0.12 * rnd(i + 9); g.lineWidth = 1 + 2.5 * rnd(i + 11); g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (rnd(i + 13) - 0.5) * 6, y0 + l); g.stroke(); }
  for (let i = 0; i < 380; i++) { const x = rnd(i + 103) * W, y = H - 6 - 70 * Math.pow(rnd(i + 105), 2), r = 1 + 4 * rnd(i + 107); g.fillStyle = rnd(i + 109) > 0.5 ? "#6b5a3e" : "#8a7a5a"; g.globalAlpha = 0.25 + 0.4 * rnd(i + 111); g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // panel seams
  for (let z = -4.2; z < 4; z += 1.45) { g.strokeStyle = "#b9b5a6"; g.globalAlpha = 0.55; g.lineWidth = 2; g.beginPath(); g.moveTo(px(z), py(1.15)); g.lineTo(px(z), py(3.0)); g.stroke(); }
  g.globalAlpha = 1;
  // windows: dark tinted glass with a slanted sheen, a pale frame and the silhouettes of the potatoes inside
  const win = (z0, z1, y0, y1, seed, n) => {
    const x0 = Math.min(px(z0), px(z1)), x1 = Math.max(px(z0), px(z1)), ya = py(y1), yb = py(y0), w = x1 - x0, h = yb - ya;
    g.fillStyle = "#e9e6dc"; g.beginPath(); g.roundRect(x0 - 7, ya - 7, w + 14, h + 14, 16); g.fill();
    const gr = g.createLinearGradient(0, ya, 0, yb); gr.addColorStop(0, "#3a5a6c"); gr.addColorStop(1, "#1d303b"); g.fillStyle = gr; g.beginPath(); g.roundRect(x0, ya, w, h, 12); g.fill();
    g.save(); g.beginPath(); g.roundRect(x0, ya, w, h, 12); g.clip();
    for (let k = 0; k < n; k++) {   // a potato at the window: a dark body, the lighter rim of the light, a sprout, now and then a bobble hat
      const cx = x0 + w * (0.14 + 0.72 * rnd(seed + k * 7 + 1)) , r = h * (0.2 + 0.07 * rnd(seed + k * 7 + 2)), cy = yb - r * 0.55;
      g.fillStyle = "#0c161c"; g.globalAlpha = 0.92; g.beginPath(); g.ellipse(cx, cy - r * 0.2, r * 0.95, r * 1.18, 0, 0, TAU); g.fill();
      g.strokeStyle = "#5c7d8e"; g.globalAlpha = 0.5; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy - r * 0.2, r * 0.95, r * 1.18, 0, -2.5, -0.9); g.stroke();
      g.globalAlpha = 0.9; g.strokeStyle = "#101e14"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy - r * 1.35); g.lineTo(cx + 5, cy - r * 1.7); g.stroke();
      if (rnd(seed + k * 7 + 3) > 0.55) { g.fillStyle = ["#6a2a2c", "#1f3a5a", "#6a5a1c"][k % 3]; g.beginPath(); g.ellipse(cx, cy - r * 1.18, r * 0.78, r * 0.34, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.arc(cx, cy - r * 1.55, r * 0.17, 0, TAU); g.fillStyle = "#cfcabd"; g.fill(); }
    }
    g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) { g.fillStyle = "#cfe6f0"; g.globalAlpha = 0.1 + 0.05 * k; g.beginPath(); g.moveTo(x0 + w * (0.1 + 0.3 * k), ya); g.lineTo(x0 + w * (0.2 + 0.3 * k), ya); g.lineTo(x0 + w * (-0.1 + 0.3 * k), yb); g.lineTo(x0 + w * (-0.2 + 0.3 * k), yb); g.closePath(); g.fill(); }   // slanted reflections
    g.globalAlpha = 1; g.restore();
    g.strokeStyle = "#8f9a96"; g.globalAlpha = 0.7; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, ya + h * 0.78); g.lineTo(x1, ya + h * 0.78); g.stroke(); g.globalAlpha = 1;   // the top of the sliding vents
  };
  for (let i = 0; i < 6; i++) win(-4.95 + i * 1.46, -4.95 + i * 1.46 + 1.36, 1.68, 2.62, 40 + i * 13 + side * 5, 2 + (i % 2));
  win(-5.3, -5.12, 1.68, 2.62, 3, 0);
  if (side > 0) {   // the door at the front on the wearer's left: two folding leaves with glass, a handrail, a step line
    const z0 = 3.7, z1 = 5.0, x0 = px(z0), x1 = px(z1), xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    g.fillStyle = "#e4e1d6"; g.fillRect(xa, py(2.9), xb - xa, py(0.62) - py(2.9));
    g.strokeStyle = "#7a7769"; g.lineWidth = 3; g.strokeRect(xa, py(2.9), xb - xa, py(0.62) - py(2.9)); g.beginPath(); g.moveTo((xa + xb) / 2, py(2.9)); g.lineTo((xa + xb) / 2, py(0.62)); g.stroke();
    for (const [a0, a1] of [[xa + 8, (xa + xb) / 2 - 5], [(xa + xb) / 2 + 5, xb - 8]]) { const gr = g.createLinearGradient(0, py(2.72), 0, py(1.0)); gr.addColorStop(0, "#3a5a6c"); gr.addColorStop(1, "#1d303b"); g.fillStyle = gr; g.beginPath(); g.roundRect(a0, py(2.72), a1 - a0, py(1.0) - py(2.72), 8); g.fill(); }
    g.fillStyle = "#c8c5b8"; g.fillRect((xa + xb) / 2 - 3, py(1.9), 6, 70);   // the handle
    g.fillStyle = "#2a2a2c"; g.fillRect(xa, py(0.72), xb - xa, 8);   // the step edge
  } else win(3.7, 5.0, 1.68, 2.62, 77, 2);
  // wheel arches: dark half discs over the two axles, a pale rim line
  for (const z of [3.3, -2.9]) { g.fillStyle = "#14201a"; g.beginPath(); g.arc(px(z), py(0.5), 0.66 * PX, Math.PI, 0); g.fill(); g.strokeStyle = "#1f3a2d"; g.lineWidth = 6; g.beginPath(); g.arc(px(z), py(0.5), 0.68 * PX, Math.PI, 0); g.stroke(); }
  // lamps, reflectors and the little numbers
  g.fillStyle = "#d8402e"; for (const z of [-5.35]) g.fillRect(px(z) - 6, py(0.95), 12, 40);
  g.fillStyle = "#e8e2c4"; g.fillRect(px(5.38) - 8, py(0.95), 16, 38);
  g.fillStyle = "#1e3a2c"; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.fillText("STONEHENGE TOURS", px(-1.0), py(0.82));
  g.globalAlpha = 1; return tex(c);
});
const busFront = (back) => once("sh-bus-front" + back, () => {
  const W = 640, H = 686, [cv, g] = canvas(W, H), PX = W / 2.46, Y0 = 0.42, Y1 = 3.1, py = (y) => (Y1 - y) / (Y1 - Y0) * H, px = (x) => (x + 1.23) * PX;
  g.fillStyle = "#f1efe7"; g.fillRect(0, 0, W, H); g.fillStyle = "#2c5740"; g.fillRect(0, py(1.15), W, H - py(1.15));
  for (let i = 0; i < 100; i++) { g.strokeStyle = "#8d887a"; g.globalAlpha = 0.1 + 0.1 * rnd(i + 3); g.lineWidth = 1 + 2 * rnd(i + 5); const x = rnd(i + 7) * W, y = py(1.6) + 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 20 + 90 * rnd(i + 9)); g.stroke(); }
  g.globalAlpha = 1;
  const glass = (x0, x1, y0, y1) => { g.fillStyle = "#e9e6dc"; g.beginPath(); g.roundRect(px(x0) - 6, py(y1) - 6, px(x1) - px(x0) + 12, py(y0) - py(y1) + 12, 18); g.fill(); const gr = g.createLinearGradient(0, py(y1), 0, py(y0)); gr.addColorStop(0, "#44667a"); gr.addColorStop(1, "#1f3340"); g.fillStyle = gr; g.beginPath(); g.roundRect(px(x0), py(y1), px(x1) - px(x0), py(y0) - py(y1), 14); g.fill(); g.save(); g.clip(); for (let k = 0; k < 3; k++) { g.fillStyle = "#cfe6f0"; g.globalAlpha = 0.1; g.beginPath(); g.moveTo(px(x0) + 60 * k + 90, py(y1)); g.lineTo(px(x0) + 60 * k + 150, py(y1)); g.lineTo(px(x0) + 60 * k, py(y0)); g.lineTo(px(x0) + 60 * k - 60, py(y0)); g.closePath(); g.fill(); } g.restore(); g.globalAlpha = 1; };
  if (!back) {
    glass(-1.08, 1.08, 1.5, 2.72);   // the windscreen
    g.strokeStyle = "#161616"; g.lineWidth = 5; for (const x of [-0.5, 0.45]) { g.beginPath(); g.moveTo(px(x), py(1.58)); g.lineTo(px(x + 0.55), py(2.1)); g.stroke(); }   // the wipers
    g.fillStyle = "#111"; g.fillRect(px(-0.8), py(2.95), px(0.8) - px(-0.8), py(2.78) - py(2.95));   // the destination blind
    g.fillStyle = "#f0a830"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.fillText("STONEHENGE", px(0), py(2.84));
    for (const x of [-0.85, 0.85]) { g.fillStyle = "#f5efd0"; g.beginPath(); g.arc(px(x), py(0.95), 0.12 * PX, 0, TAU); g.fill(); g.strokeStyle = "#8a8670"; g.lineWidth = 4; g.stroke(); }
    g.fillStyle = "#1b1b1b"; g.fillRect(px(-0.45), py(1.1), px(0.45) - px(-0.45), py(0.74) - py(1.1)); for (let i = 0; i < 7; i++) { g.fillStyle = "#3a3a3a"; g.fillRect(px(-0.45), py(1.1) + 6 + i * 14, px(0.45) - px(-0.45), 5); }
    g.fillStyle = "#f2d83a"; g.fillRect(px(-0.28), py(0.7), px(0.28) - px(-0.28), 30); g.fillStyle = "#222"; g.font = "bold 24px sans-serif"; g.fillText("SH 24 BUS", px(0), py(0.7) + 24);
    g.fillStyle = "#2a2a2c"; g.fillRect(0, py(0.58), W, py(0.42) - py(0.58));   // the bumper
  } else {
    glass(-0.9, 0.9, 1.7, 2.6);
    for (const x of [-1.0, 1.0]) { g.fillStyle = "#c4342a"; g.fillRect(px(x) - 22, py(1.1), 44, 60); }
    g.fillStyle = "#f2d83a"; g.fillRect(px(-0.28), py(0.9), px(0.28) - px(-0.28), 30); g.fillStyle = "#2a2a2c"; g.fillRect(0, py(0.58), W, py(0.42) - py(0.58));
  }
  return tex(cv);
});
function shuttlebus(P) {
  const G = new THREE.Group(); P.whole.add(G);
  const L = 11, Wd = 2.5, B = 0.18, BT = 0.3, rounded = (x0, y0, x1, y1, r) => { const sh = new THREE.Shape(); sh.moveTo(x0 + r, y0); sh.lineTo(x1 - r, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + r); sh.lineTo(x1, y1 - r); sh.quadraticCurveTo(x1, y1, x1 - r, y1); sh.lineTo(x0 + r, y1); sh.quadraticCurveTo(x0, y1, x0, y1 - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0); return sh; };
  const ext = (sh) => { const g = new THREE.ExtrudeGeometry(sh, { depth: L - 2 * BT, bevelEnabled: true, bevelThickness: BT, bevelSize: B, bevelSegments: 4, curveSegments: 6 }); g.translate(0, 0, -(L - 2 * BT) / 2); return g; };
  const white = mat("#f1efe7", { roughness: 0.55 }), green = mat("#2c5740", { roughness: 0.6 });
  mesh(ext(rounded(-Wd / 2 + B, 1.12, Wd / 2 - B, 3.1 - B, 0.22)), white, G);
  mesh(ext(rounded(-Wd / 2 + B, 0.42 + B, Wd / 2 - B, 1.2, 0.05)), green, G);
  // the decals: both sides, the front and the back
  const decal = (w, h, map, pos, ry) => { const m = new THREE.MeshStandardMaterial({ map, roughness: 0.5, transparent: true }); m.userData.noHatch = true; m.userData.noOutline = true; const o = mesh(new THREE.PlaneGeometry(w, h), m, G, ...pos); o.rotation.y = ry; o.castShadow = false; return o; };
  decal(L, 2.68, busSide(1), [Wd / 2 + 0.004, 1.76, 0], Math.PI / 2);
  decal(L, 2.68, busSide(-1), [-Wd / 2 - 0.004, 1.76, 0], -Math.PI / 2);
  decal(Wd - 0.04, 2.68, busFront(false), [0, 1.76, L / 2 + 0.004], 0);
  decal(Wd - 0.04, 2.68, busFront(true), [0, 1.76, -L / 2 - 0.004], Math.PI);
  // wheels: black tyres, grey hubs with bolts, the axle in the dark under the floor
  const tyre = mat("#18181a", { roughness: 0.95 }), hub = mat("#9a9a96", { roughness: 0.4, metalness: 0.5 }), bolt = mat("#4a4a48", { roughness: 0.5 });
  for (const z of [3.3, -2.9]) for (const sd of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(sd * (Wd / 2 - 0.12), 0.5, z); G.add(w);
    const t = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 28), tyre, w); t.rotation.z = Math.PI / 2;
    const h = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 20), hub, w, sd * 0.155, 0, 0); h.rotation.z = Math.PI / 2;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; const bt = mesh(new THREE.SphereGeometry(0.022, 6, 5), bolt, w, sd * 0.17, Math.cos(a) * 0.17, Math.sin(a) * 0.17); bt.castShadow = false; }
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), bolt, w, sd * 0.17, 0, 0).rotation.z = Math.PI / 2;
    for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU; const tr = mesh(new THREE.BoxGeometry(0.31, 0.03, 0.06), mat("#0e0e10", { roughness: 1 }), w, 0, Math.cos(a) * 0.49, Math.sin(a) * 0.49); tr.rotation.x = a; tr.castShadow = false; }   // the tread blocks
  }
  mesh(new THREE.BoxGeometry(Wd - 0.5, 0.2, L - 1.2), mat("#1d1d1f", { roughness: 0.9 }), G, 0, 0.36, 0).castShadow = false;   // the underside in the dark
  // mirrors on arms at the front corners, a roof vent and an aerial, the bumper corners
  const dk = mat("#202224", { roughness: 0.5 });
  for (const sd of [-1, 1]) { mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), dk, G, sd * (Wd / 2 + 0.2), 2.45, L / 2 - 0.45); mesh(new THREE.BoxGeometry(0.06, 0.42, 0.2), dk, G, sd * (Wd / 2 + 0.4), 2.38, L / 2 - 0.45); mesh(new THREE.BoxGeometry(0.02, 0.36, 0.17), mat("#5a7684", { roughness: 0.1, metalness: 0.5 }), G, sd * (Wd / 2 + 0.43), 2.38, L / 2 - 0.45).castShadow = false; }
  mesh(new THREE.BoxGeometry(0.9, 0.12, 1.2), mat("#d8d6cc", { roughness: 0.6 }), G, 0, 3.1, 1.0); mesh(new THREE.BoxGeometry(0.9, 0.1, 1.2), mat("#d8d6cc", { roughness: 0.6 }), G, 0, 3.1, -2.2);
  mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.6, 6), dk, G, 0.8, 3.38, -3.6);
  // the soft shadow under it
  const sh = (() => { const [c, g] = canvas(256, 64); const gr = g.createRadialGradient(128, 32, 6, 128, 32, 128); gr.addColorStop(0, "rgba(20,26,34,0.5)"); gr.addColorStop(1, "rgba(20,26,34,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 64); return tex(c); })();
  const shm = new THREE.Mesh(new THREE.PlaneGeometry(L + 3, Wd + 2.2), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false })); shm.rotation.x = -Math.PI / 2; shm.rotation.z = Math.PI / 2; shm.position.y = 0.01; shm.material.userData.noOutline = true; shm.castShadow = false; shm.renderOrder = 1; G.add(shm);
  scenery(G);
  return { grip: 0 };
}

export const SH_ITEMS_KINDS = { sheep, crow, bobblehat, scarf, ropeline, shuttlebus };
export const SH_ITEMS_GRIPS = {};
