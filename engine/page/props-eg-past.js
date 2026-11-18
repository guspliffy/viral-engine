// EGYPT EP04 SERAPEUM (18 Nov 2026), task T3: the past places, part 1. Design: storyboards/series/ancient-aliens/04-serapeum/DESIGN.md
// sections 1, 2, 6 "Memphis" and "Nile". Bench: storyboards/series/ancient-aliens/04-serapeum/bench (make-eg-past.mjs, eg-past-sheet.png).
// Metres; origin the bottom centre and the front +z unless said; +x right, +y up. Everything is built from hand-placed marks: each chisel
// cut, chip, crack, streak, stain, plank, strand and leaf gets its own place, size and strength from q(i,k) = fract((i+1)*.61803398875 +
// (k+1)*.41421356237) (DESIGN section 2; i the mark, k = faceID + 19*instance). No tiling texture, no Math.random, no wall clock. Animation
// reads only params and the clip time the engine passes. Relief and pigment are real polygons (extruded plates 3-6 mm deep).
// Every animated value is a param 0..1 unless said, with a spec.<name> start value; a param propState has no default for is listed
// below ("seed it with a dur-0 set at 0").
//
//   memphiscourt  the temple court of panel 04. Origin the middle of the court floor, floor top at y 0 (15 x 12, x -7.5..7.5, z -6..6,
//                 9 x 7 limestone slabs, .007 lime joints, five cracks a slab). Rear wall (0, 0, -4.50) 15 x 4.30 x .48, front face z -4.26:
//                 seven panels of three painted relief registers (y .55 / 1.29 / 2.26: five profile figures and two rows of glyph groups
//                 each), a dado, a khekher frieze and a cavetto cap. Colonnade: 8 lotus columns at x -5.55 + 2.05 i (i 0..3), z -3.65 /
//                 -1.55: plinth, 12-flute taper shaft with five painted registers (y .48 / .91 / 1.40 / 2.24 / 2.84, eight relief figures a
//                 figure band), lotus capital with 12 blue/green petals and gold rims; the roof block (cornice 8.20 x .34 x 2.95, y 3.85..4.19,
//                 centre x -2.475, z -2.785, four painted bands, a painted blue ceiling). Two pylon towers stand behind the wall (spec.pylons
//                 false hides them). spec.palms (default true) adds the three palms (x, z, height) (3.1, -3.1, 4.6) (5.2, -2.9, 3.8)
//                 (6.4, -4, 4.1); spec.seed (0). Solid: floor, wall, columns. Not standable but the floor is. No params.
//                 Sun for the bench: azimuth +40 deg from +Z, elevation 51, fill .43 (the director sets the light).
//   palm          a date palm, spec.height (default 4, the crown apex): 12 trunk sections with .012 scar grooves and leaf-base diamonds,
//                 taper diameter .18 -> .09 scaled by height/4, 11 fronds .30 x height long with 36 deg droop, 18 blade pairs a frond (.07-.22
//                 long), three dead fronds, a date bunch (spec.dates, default true). spec.seed (0), spec.lean (default 1: 0 = straight trunk).
//                 Origin the middle of the trunk's foot. Solid: trunk only. No params.
//   apisbier      the bier of the dead Apis bull, origin the middle of the bier on the ground. Deck 2.12 x .092 x .92 (x, y, z), top y .53 (a
//                 white linen pad on it, top .56); four gilt legs .105 x .438 x .105 at x +-.83, z +-.33; two carrying poles O.058 x 2.48
//                 along X at z +-.34, y .30; +Z fascia: lapis panel, gold winged disc O.078, two wings .56 x .14 of 13 feathers (4 mm deep),
//                 twelve wear spots on each long edge. spec.bull (default true): the static black bull, nose to rump spec.bullLength (default
//                 1.84; scales about the bull's middle), head toward -X (poll (-.66,.79,.06), muzzle (-.91,.61,.20)), white forehead diamond
//                 .117 x .106, two curved horns, closed eyes, ears, nostrils, four legs folded under (hooves on the deck), tail, and the white
//                 drape over the haunch (x .60, .83 x .89, eight folds to 4.1 cm, hangs .37 over the +Z edge). Solid: bier and bull. Static, no params.
//   nilebarge     the Nile cargo barge. Origin the middle of the hull's BOTTOM: put the prop at y -0.42 so the water plane y 0 is the waterline
//                 (the hull shows a wet dark band and a pale waterline mark at local y .42). Local coordinates: deck (planks) y 1.06 (N: .64),
//                 stem and stern tips y 1.63 at x +-4.30, hull 8.60 x 2.84 (beam), bow -X (the wedjat eye on both sides at x -3.58). Cargo
//                 (spec.cargo, default true): a black granite box 2.200 x 1.480 x 1.265 (+ lid, 1.815 high) at (.32, local 1.08, 0), palm-leaf mat
//                 on top (y 2.475 N) tied by four O.035 ropes at x -.50/.05/.63/1.18 to deck eyes at z +-.92. Mast (-1.90, z -.31) to y 4.79,
//                 yard, square 2.65 sail (eight panels, seams, .24 belly toward +Z). Rail .36 high with 18 posts. Eight oars (x -3 / -2.2 / 2 /
//                 2.8, both sides, 2.10 long, blades .39 x .16, in the water), steering oar at x 3.63, z -1.05 on an outrigger. Rowers: 8 on the
//                 deck at the oar x, z +-.80 (seat y .66 N); steersman at x 3.4, z -.6. Params: row 0..1 (spec.row, default 0) one oar
//                 cycle (+-18 deg; blades in the water on the power stroke, lifted on the recovery); drift 0..1 (spec.drift, 0) moves the whole
//                 barge .64 m along +X; sway 0..1 (spec.sway, default 1) the +-1 deg roll on the clip clock (period 4.1 s). Seed row and
//                 drift with a dur-0 set at 0 (propState has no default). Solid: hull, deck, box. See-through: none.
//   nilebanks     the banks and far palms of panel 09, origin the scene origin (like nilewater): far bank from z -29, near bank from z +34, 13 wide
//                 and 160 long (x -80..80), y .04..1.10, silt edge, sand, green fields, reed tufts, shrubs; far 19 palms (x -54 + 6 i, z -30 -
//                 1.6 q(i,2)), near 12 (x -44 + 8 i, z 35 + 2 q(i,2)), height 3.2 + 1.5 q(i,3); a hazy far town and low hills (spec.town true);
//                 spec.sunset (default true) bakes the warm low light and haze into every colour; spec.track (default true) draws the pale
//                 sun track on the water (width 3.20 at the start, 19 crests per 6 m, .22-.82 long, alpha .45) from spec.trackFrom [x, z]
//                 (default [.2, 10.9], the camera) at spec.sunAz (default 11 deg, 0 = -Z, toward +X). Everything here is see-through-free scenery
//                 (userData.solid false); the track is userData.steam. Use nilewater under it and aasky (time "sunset", sun [11, 5]) behind it.
//
// GRIPS: nothing here is held. SOLID/standable: the court floor (y 0), the barge deck (local y 1.06; planks), the bier deck (y .53).
import * as THREE from "three";
import { makeLoft } from "./geo.js";
import { clamp } from "./util.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const q = (i, k) => { const v = (i + 1) * 0.61803398875 + (k + 1) * 0.41421356237; return v - Math.floor(v); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const vmat = (o = {}) => { const { lc, ...r } = o; const m = mat("#ffffff", { vertexColors: true, ...r }); m.userData.lineColor = lc ?? "#3b2c20"; return m; };   // lc: the ink colour (a white base colour would draw white lines)
const lined = (m, lc) => { m.userData.lineColor = lc; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// a decal mesh: no ink outline, casts no shadow
function decal(geo, parent, o = {}) {
  const m = vmat({ roughness: 0.9, ...o }); m.userData.noOutline = true;
  const d = mesh(geo, m, parent); d.castShadow = false; return d;
}
const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), V3(sx, sy, sz));
const col = (hex, tone = 1) => new THREE.Color(hex).multiplyScalar(tone);

// ---------------------------------------------------------------------------------------------------------------- palette (DESIGN 1)
const PL = "#DCB884", REL = "#A67D57", RED = "#A65540", BLU = "#477C8F", GRN = "#548278", OCH = "#CA994E", GOLD = "#C28C30", GOLD2 = "#F5CC70";
const LAPIS = "#26447B", TURQ = "#3F9C9C", CARN = "#A94830", LIN = "#F1E0BA", INK = "#251E21", CRK = "#3B3030", STN = "#84654C";
const HIDE = "#232329", HIDE2 = "#41424B", HOOF = "#19171B", HORN = "#D6C2A0", HORN2 = "#8D7762", DRAPE = "#E7D4B2";

// ---------------------------------------------------------------------------------------------------------------- Acc: merged coloured geometry
class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; }
  // any geometry through a matrix; colour: a hex / Color (times tone), a function (x, y, z) -> Color, or the geometry's own colour attribute
  push(g, m, colour, tone = 1) {
    const n = g.index ? g.toNonIndexed() : g.clone(); n.applyMatrix4(m);
    if (!n.attributes.normal) n.computeVertexNormals();
    const pa = n.attributes.position.array, na = n.attributes.normal.array, ca = n.attributes.color?.array;
    const C = typeof colour === "string" || colour?.isColor ? col(colour, tone) : null;
    for (let i = 0, k = 0; i < pa.length; i += 3, k++) {
      this.p.push(pa[i], pa[i + 1], pa[i + 2]); this.n.push(na[i], na[i + 1], na[i + 2]);
      if (ca) this.c.push(ca[k * 3] * tone, ca[k * 3 + 1] * tone, ca[k * 3 + 2] * tone);
      else if (C) this.c.push(C.r, C.g, C.b);
      else { const f = colour(pa[i], pa[i + 1], pa[i + 2]); this.c.push(f.r * tone, f.g * tone, f.b * tone); }
    }
  }
  box(cx, cy, cz, w, h, d, colour, tone = 1, ry = 0, rx = 0, rz = 0) { this.push(UBOX, M4(cx, cy, cz, rx, ry, rz, w, h, d), colour, tone); }
  // a triangle, one colour or one per corner (face normal)
  tri(a, b, c, c0, c1 = c0, c2 = c0) {
    const nrm = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    for (const [p, k] of [[a, c0], [b, c1], [c, c2]]) { this.p.push(p.x, p.y, p.z); this.n.push(nrm.x, nrm.y, nrm.z); this.c.push(k.r, k.g, k.b); }
  }
  // an extruded polygon plate: pts [u, v] in the plane (O origin, U right, W up, front = U x W), depth along the front, lift off the surface
  plate(pts, O, U, W, depth, colour, tone = 1, lift = 0) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))), { depth, bevelEnabled: false, curveSegments: 4 });
    const N = new THREE.Vector3().crossVectors(U, W).normalize(), m = new THREE.Matrix4().makeBasis(U, W, N);
    m.setPosition(O.clone().addScaledVector(N, lift)); this.push(g, m, colour, tone);
  }
  // a ribbon along 3D points, width w, lying in the surface with normal N
  ribbon(pts, w, N, colour, tone = 1) {
    const C = col(colour, tone);
    for (let i = 0; i + 1 < pts.length; i++) {
      const d = pts[i + 1].clone().sub(pts[i]), s = new THREE.Vector3().crossVectors(d, N).normalize().multiplyScalar(w / 2);
      const a = pts[i].clone().add(s), b = pts[i].clone().sub(s), c = pts[i + 1].clone().sub(s), e = pts[i + 1].clone().add(s);
      this.tri(a, b, c, C); this.tri(a, c, e, C);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
  get empty() { return this.p.length === 0; }
}
const UBOX = new THREE.BoxGeometry(1, 1, 1);

// a smooth indexed grid surface f(u, v) -> [x, y, z], colour c(u, v, p) -> hex | Color; hint = the outward direction (a Vector3 or (u, v) -> Vector3) so the winding is right
function grid(nu, nv, f, c, hint, wrap = false) {
  const n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), cl = new Float32Array(n * 3), idx = [], uv = new Float32Array(n * 2);
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const k = i * (nv + 1) + j, p = f(i / nu, j / nv), cc = c ? new THREE.Color(c(i / nu, j / nv, p)) : new THREE.Color("#fff");
    pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2]; cl[k * 3] = cc.r; cl[k * 3 + 1] = cc.g; cl[k * 3 + 2] = cc.b; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv;
  }
  const P = (i, j) => { const k = i * (nv + 1) + j; return V3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); };
  const mi = nu >> 1, mj = nv >> 1, a = P(mi, mj), nr = new THREE.Vector3().crossVectors(P(mi + 1, mj).sub(a), P(mi, mj + 1).sub(a));
  const h = typeof hint === "function" ? hint((mi + 0.5) / nu, (mj + 0.5) / nv) : hint, flip = hint ? nr.dot(h) < 0 : false;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const A = i * (nv + 1) + j, B = A + nv + 1, C = A + 1, D = B + 1;
    if (flip) idx.push(A, C, B, B, C, D); else idx.push(A, B, C, B, D, C);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(cl, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  if (wrap) { const N = g.attributes.normal.array; for (let j = 0; j <= nv; j++) { const a0 = j * 3, b0 = (nu * (nv + 1) + j) * 3; for (let k = 0; k < 3; k++) { const v = (N[a0 + k] + N[b0 + k]) / 2; N[a0 + k] = N[b0 + k] = v; } } g.attributes.normal.needsUpdate = true; }
  g.computeBoundingSphere(); g.computeBoundingBox(); return g;
}
// a tube along points: radius rAt(t), colour cAt(t, round) -> hex | Color
function tubeGeo(pts, rAt, radial = 8, cAt = null) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(...p)))), segs = Math.max(8, pts.length * 4), fr = curve.computeFrenetFrames(segs, false);
  const pos = [], cl = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), r = rAt(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, c = Math.cos(a), s = Math.sin(a), cc = new THREE.Color(cAt ? cAt(t, j / radial) : "#fff");
      pos.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z)); cl.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const circ = (r, n = 10, sx = 1, sy = 1) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * r * sx, Math.sin((i / n) * TAU) * r * sy]);

// ================================================================================================================ relief figures and glyphs
// a figure in profile facing +U, unit height 1 (feet at v 0, head top 1), origin at its feet. dir -1 mirrors it. kind (0..4) picks the headdress and the held thing.
function figure(A, O, U, W, h, dir, seed, k, depth = 0.005, lift = 0) {
  const sk = [RED, "#B8683F", OCH][Math.floor(q(seed, k + 3) * 3)], kind = Math.floor(q(seed, k + 5) * 5), P = (pts, c, d = depth, l = 0, t = 1) =>
    A.plate(pts.map(([u, v]) => [u * dir * h, v * h]), O, dir < 0 ? U : U, W, d, c, t, lift + l);
  const flip = dir < 0;   // mirrored polygons wind the other way: Shape handles either
  void flip;
  P([[-0.08, 0.3], [0.0, 0.3], [-0.01, 0.0], [-0.07, 0.0]], sk, depth, 0);                        // back leg
  P([[-0.07, 0.0], [0.0, 0.0], [0.07, 0.02], [0.065, 0.045], [-0.01, 0.04]], sk, depth, 0.0005);   // foot
  P([[-0.01, 0.3], [0.09, 0.3], [0.1, 0.0], [0.03, 0.0]], sk, depth, 0.001);                       // front leg
  P([[0.03, 0.0], [0.11, 0.0], [0.17, 0.02], [0.165, 0.045], [0.04, 0.045]], sk, depth, 0.0015);
  P([[-0.1, 0.52], [0.13, 0.52], [0.19, 0.27], [-0.08, 0.30]], LIN, depth + 0.0005, 0.002);       // kilt
  P([[0.06, 0.5], [0.15, 0.5], [0.19, 0.28], [0.12, 0.28]], "#D9C3A0", depth, 0.0035);              // kilt fold
  P([[-0.09, 0.52], [0.09, 0.52], [0.13, 0.8], [-0.13, 0.8]], sk, depth, 0.002);                  // torso
  P([[-0.115, 0.8], [0.115, 0.8], [0.14, 0.725], [0.0, 0.69], [-0.14, 0.725]], GOLD, depth, 0.004);   // collar
  P([[-0.085, 0.795], [0.085, 0.795], [0.1, 0.75], [0.0, 0.725], [-0.1, 0.75]], LAPIS, depth, 0.0055);
  P([[-0.04, 0.8], [0.06, 0.8], [0.065, 0.84], [-0.03, 0.84]], sk, depth, 0.002);                  // neck
  P([[-0.04, 0.84], [0.06, 0.84], [0.095, 0.875], [0.115, 0.905], [0.092, 0.92], [0.1, 0.94], [0.07, 0.975], [0.0, 0.99], [-0.06, 0.975], [-0.08, 0.9]], sk, depth, 0.003);   // head
  P([[-0.115, 0.985], [-0.125, 0.82], [-0.06, 0.79], [-0.03, 0.86], [0.03, 0.965], [-0.03, 1.02]], INK, depth, 0.0045);   // wig
  P([[0.035, 0.935], [0.065, 0.945], [0.062, 0.955], [0.03, 0.948]], "#F1E0BA", depth * 0.5, 0.0065);   // eye
  P([[0.03, 0.935], [0.0455, 0.935], [0.0455, 0.947], [0.03, 0.947]], INK, depth * 0.5, 0.0075);
  if (kind === 0) P([[-0.05, 1.0], [0.04, 1.0], [0.03, 1.2], [-0.01, 1.22]], LIN, depth, 0.005);                   // white crown
  else if (kind === 1) { P(circ(0.06, 9, 1, 1).map(([u, v]) => [u - 0.0, v + 1.07]), CARN, depth, 0.005); P([[-0.07, 1.0], [0.03, 1.0], [0.0, 1.03]], GOLD, depth, 0.005); }   // sun disc
  else if (kind === 2) P([[-0.06, 1.0], [0.0, 1.0], [0.01, 1.26], [-0.02, 1.26], [-0.06, 1.12]], BLU, depth, 0.005);   // plume
  else if (kind === 3) P([[-0.1, 0.97], [0.0, 1.02], [0.1, 0.97], [0.12, 0.9], [-0.12, 0.9]], GOLD, depth * 0.6, 0.005);   // gold band
  // the arm and what it holds
  if (kind % 2 === 0) { P([[0.1, 0.78], [0.3, 0.72], [0.31, 0.68], [0.1, 0.72]], sk, depth, 0.005); P([[0.3, 0.2], [0.325, 0.2], [0.325, 0.92], [0.3, 0.92]], OCH, depth, 0.006); }   // a staff
  else { P([[0.1, 0.78], [0.28, 0.82], [0.29, 0.78], [0.1, 0.72]], sk, depth, 0.005); P(circ(0.04, 9, 1, 1.5).map(([u, v]) => [u + 0.34, v + 0.92]), GOLD, depth, 0.006); P([[0.33, 0.8], [0.35, 0.8], [0.35, 0.6], [0.33, 0.6]], GOLD, depth, 0.006); P([[0.3, 0.74], [0.38, 0.74], [0.38, 0.72], [0.3, 0.72]], GOLD, depth, 0.006); }   // an ankh
}
// a glyph in a box of side s, centre (0, 0) of its plane; kinds 0..6
function glyph(A, O, U, W, s, kind, colour, depth = 0.004, lift = 0) {
  const P = (pts) => A.plate(pts.map(([u, v]) => [u * s, v * s]), O, U, W, depth, colour, 1, lift);
  switch (kind % 7) {
    case 0: P(circ(0.4, 10)); break;                                                                    // sun
    case 1: P([[-0.4, 0.35], [0.4, 0.35], [0.4, 0.2], [-0.4, 0.2]]); P([[-0.4, 0.05], [0.4, 0.05], [0.4, -0.1], [-0.4, -0.1]]); P([[-0.4, -0.25], [0.4, -0.25], [0.4, -0.4], [-0.4, -0.4]]); break;   // bars
    case 2: P([[-0.4, -0.2], [0.1, -0.1], [0.35, 0.1], [0.4, 0.0], [0.38, 0.28], [0.2, 0.3], [0.1, 0.1], [-0.4, -0.05]]); break;   // bird
    case 3: P([[-0.4, 0.3], [-0.2, 0.1], [0.0, 0.3], [0.2, 0.1], [0.4, 0.3], [0.4, 0.2], [0.2, 0.0], [0.0, 0.2], [-0.2, 0.0], [-0.4, 0.2]]); P([[-0.4, -0.1], [-0.2, -0.3], [0.0, -0.1], [0.2, -0.3], [0.4, -0.1], [0.4, -0.2], [0.2, -0.4], [0.0, -0.2], [-0.2, -0.4], [-0.4, -0.3]]); break;   // water
    case 4: P(circ(0.2, 8, 1, 1.2).map(([u, v]) => [u, v + 0.22])); P([[-0.05, 0.0], [0.05, 0.0], [0.05, -0.42], [-0.05, -0.42]]); P([[-0.25, -0.1], [0.25, -0.1], [0.25, -0.2], [-0.25, -0.2]]); break;   // ankh
    case 5: P([[-0.42, 0], [-0.2, 0.2], [0.2, 0.2], [0.42, 0], [0.2, -0.16], [-0.2, -0.16]]); break;     // eye
    default: P([[-0.3, -0.4], [-0.22, -0.4], [-0.22, 0.4], [-0.3, 0.4]]); P([[-0.04, -0.4], [0.04, -0.4], [0.04, 0.4], [-0.04, 0.4]]); P([[0.22, -0.4], [0.3, -0.4], [0.3, 0.4], [0.22, 0.4]]);   // reeds
  }
}
const GCOL = [BLU, RED, GRN, LAPIS, OCH];

// ================================================================================================================ palm
const trunkR0 = (H) => 0.09 * (H / 4), trunkR1 = (H) => 0.045 * (H / 4);
const palmAxis = (H, seed, lean) => { const lx = (q(seed, 1) - 0.5) * H * 0.16 * lean, lz = (q(seed, 2) - 0.5) * H * 0.1 * lean; return (t) => V3(lx * t * t, t * 0.74 * H, lz * t * t); };
// one frond: a rachis arching out of C and its blade pairs into the Acc. pitch0 deg above horizontal, az radians, L length
function frond(A, C, az, pitch0, L, nb, tone, dead, seed, k) {
  const N = 18, pts = [C.clone()], dirs = [];
  let p = C.clone();
  for (let i = 0; i < N; i++) {
    const s = i / N, pitch = (pitch0 - 36 * Math.pow(s, 1.2) - 12 * (1 - Math.min(1, pitch0 / 78)) * s * s) * DEG, d = V3(Math.cos(pitch) * Math.sin(az), Math.sin(pitch), Math.cos(pitch) * Math.cos(az));
    dirs.push(d); p = p.clone().addScaledVector(d, L / N); pts.push(p);
  }
  const base = dead ? "#8B7A4A" : "#51653A", mid = dead ? "#A8935A" : "#7B8545", tip = dead ? "#B5A06A" : "#92A055";
  const rg = tubeGeo(pts, (t) => (0.015 * (1 - t) + 0.003) * (L / 1.2), 5, () => (dead ? "#8B6542" : "#7B8545"));
  A.push(rg, new THREE.Matrix4(), (x, y, z) => col(dead ? "#8B6542" : "#6f7a3f", tone));
  for (let b = 0; b < nb; b++) {
    const s = 0.1 + 0.88 * (b / (nb - 1)), idx = Math.min(N - 1, Math.floor(s * N)), pos = pts[idx].clone().lerp(pts[idx + 1], s * N - idx), d = dirs[idx];
    const up = V3(0, 1, 0).addScaledVector(d, -d.y).normalize(), side = new THREE.Vector3().crossVectors(d, up).normalize();
    const len = (0.07 + 0.15 * Math.pow(Math.sin(Math.PI * (b + 1) / (nb + 1)), 1.1)) * (L / 1.2) * (0.9 + 0.2 * q(b, k + seed * 19)) * (dead ? 0.8 : 1);
    for (const sg of [-1, 1]) {
      const dir = d.clone().multiplyScalar(0.55).addScaledVector(side, sg * 0.75).addScaledVector(up, 0.18).addScaledVector(V3(0, -1, 0), (dead ? 0.55 : 0.3) + 0.15 * q(b, k + 7)).normalize();
      const w = (0.02 + 0.022 * Math.sin(Math.PI * (b + 1) / (nb + 1))) * (L / 1.2), tp = pos.clone().addScaledVector(dir, len), md = pos.clone().addScaledVector(dir, len * 0.45);
      const ma = md.clone().addScaledVector(up, w), mb = md.clone().addScaledVector(up, -w);
      const t1 = tone * (b % 2 ? 0.94 : 1.05) * (0.95 + 0.1 * q(b + sg, k + 11));
      A.tri(pos, ma, tp, col(base, t1), col(mid, t1), col(tip, t1)); A.tri(pos, tp, mb, col(base, t1), col(tip, t1), col(mid, t1));
    }
  }
}
// the whole palm into two Acc's: the trunk (grid geometry) and the foliage
function palmParts(H, seed, o = {}) {
  const lean = o.lean ?? 1, nb = o.blades ?? 18, tone = o.tone ?? new THREE.Color("#fff"), hz = o.haze ?? 0, hzc = col(o.hazeColor ?? "#e6a98a"), axis = palmAxis(H, seed, lean), r0 = trunkR0(H), r1 = trunkR1(H);
  const fin = (c) => { const x = new THREE.Color(c).multiply(tone); return hz ? x.lerp(hzc, hz) : x; };
  const rows = o.rows ?? 72, cols = o.cols ?? 16, sec = 12;
  const trunk = grid(cols, rows, (u, v) => {
    const a = u * TAU, c = axis(v), j = Math.floor(v * sec), fr = v * sec - j, edge = Math.min(fr, 1 - fr), groove = Math.exp(-Math.pow(edge / 0.07, 2)) * 0.012 * (H / 4);
    const ph = q(j, seed * 19 + 3) * TAU, bump = 0.006 * (H / 4) * Math.max(0, Math.cos(7 * a + ph + (j % 2) * Math.PI / 7)) * Math.sin(Math.PI * fr);
    const r = lerp(r0, r1, v) * (1 + 0.05 * Math.sin(v * 6 + seed)) + bump - groove + (v < 0.06 ? 0.04 * (1 - v / 0.06) * (H / 4) : 0);
    return [c.x + r * Math.sin(a), c.y, c.z + r * Math.cos(a)];
  }, (u, v) => {
    const j = Math.floor(v * sec), fr = v * sec - j, edge = Math.min(fr, 1 - fr), g = Math.exp(-Math.pow(edge / 0.07, 2)), n = q(Math.floor(u * cols), Math.floor(v * rows) + seed * 19);
    return fin(col("#8B6542", (0.97 + 0.12 * n) * (1 - 0.38 * g) * (1.06 - 0.22 * v)));
  }, (u, v) => V3(Math.sin(u * TAU), 0, Math.cos(u * TAU)), true);
  const F = new Acc(), top = axis(1);
  const fronds = o.fronds ?? 11, L = 0.3 * H;
  for (let f = 0; f < fronds; f++) {
    const az = f * 2.39996 + q(f, seed * 19) * 0.3, p0 = 78 - 66 * Math.pow(f / (fronds - 1), 0.8) + (q(f, seed * 19 + 1) - 0.5) * 8, tn = 0.92 + 0.16 * q(f, seed * 19 + 2);
    const fa = new Acc(); frond(fa, top.clone().add(V3(0, 0.02, 0)), az, p0, L * (0.94 + 0.12 * q(f, seed * 19 + 4)), nb, 1, false, seed, f);
    F.p.push(...fa.p); F.n.push(...fa.n); for (let i = 0; i < fa.c.length; i += 3) { const c = fin(new THREE.Color(fa.c[i], fa.c[i + 1], fa.c[i + 2])).multiplyScalar(tn); F.c.push(c.r, c.g, c.b); }
  }
  if (!o.noDead) for (let f = 0; f < 3; f++) {
    const az = f * 2.1 + 0.7 + q(f, seed * 19 + 9) * 0.6, fa = new Acc(); frond(fa, top.clone().add(V3(0, -0.05 * H * 0.25, 0)), az, -38 - 12 * f, L * 0.78, Math.round(nb * 0.7), 1, true, seed, f + 20);
    F.p.push(...fa.p); F.n.push(...fa.n); for (let i = 0; i < fa.c.length; i += 3) { const c = fin(new THREE.Color(fa.c[i], fa.c[i + 1], fa.c[i + 2])); F.c.push(c.r, c.g, c.b); }
  }
  // the crown knob of leaf bases and a date bunch
  const sph = new THREE.SphereGeometry(1, 8, 6);
  F.push(sph, M4(top.x, top.y - 0.02, top.z, 0, 0, 0, r1 * 1.9, r1 * 1.4, r1 * 1.9), (x, y, z) => fin("#6a6f3a"), 1);
  if (o.dates !== false) {
    const dx = top.x + 0.1 * (H / 4), dz = top.z + 0.07 * (H / 4);
    for (let i = 0; i < 26; i++) {
      const a = q(i, seed * 19 + 5) * TAU, rr = 0.03 + 0.05 * q(i, seed * 19 + 6), yy = top.y - 0.08 * (H / 4) - 0.11 * (H / 4) * q(i, seed * 19 + 7);
      F.push(sph, M4(dx + Math.cos(a) * rr, yy, dz + Math.sin(a) * rr, 0, 0, 0, 0.018, 0.026, 0.018), (x, y, z) => fin(i % 3 ? "#B8651B" : "#8F4A14"), 1);
    }
    for (let i = 0; i < 3; i++) F.box(dx + (i - 1) * 0.02, top.y - 0.05 * (H / 4), dz, 0.006, 0.07 * (H / 4), 0.006, fin("#7B8545"));
  }
  return { trunk, foliage: F };
}
function buildPalm(parent, H, seed, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const { trunk, foliage } = palmParts(H, seed, o), tm = vmat({ roughness: 0.9 });
  mesh(trunk, tm, g);
  const fm = vmat({ roughness: 0.75, side: THREE.DoubleSide }); fm.userData.noOutline = true;
  const f = mesh(foliage.geo(), fm, g); f.castShadow = true;
  g.userData.solid = false; return g;
}

// ================================================================================================================ memphiscourt
const CW = { z: -4.26 };   // the wall's front face
function courtFloor(A, D) {
  const NX = 9, NZ = 7, SW = 15 / NX, SD = 12 / NZ;
  A.box(0, -0.074, 0, 15, 0.14, 12, "#E8DDC0");
  for (let ix = 0; ix < NX; ix++) for (let iz = 0; iz < NZ; iz++) {
    const cx = -7.5 + SW * (ix + 0.5), cz = -6 + SD * (iz + 0.5), k = ix + NX * iz, tone = 0.93 + 0.12 * q(k, 3), base = new THREE.Color("#D9BD8C").multiplyScalar(tone * (0.97 + 0.06 * q(k, 5)));
    A.box(cx, -0.09, cz, SW - 0.007, 0.18, SD - 0.007, base);
    const lo = V3(0, 1, 0);
    for (let i = 0; i < 5; i++) {   // cracks: .04-.28 long, wandering in two or three bends
      const x0 = cx + (q(i, k) - 0.5) * (SW - 0.25), z0 = cz + (q(i, k + 7) - 0.5) * (SD - 0.25), a = q(i, k + 13) * Math.PI, len = 0.04 + 0.24 * q(i, k + 11), w = 0.004 + 0.005 * q(i, k + 17), pts = [];
      for (let s = 0; s <= 3; s++) { const aa = a + (q(i * 3 + s, k + 2) - 0.5) * 0.7; pts.push(V3(x0 + Math.cos(aa) * len * (s / 3), 0.0016, z0 + Math.sin(aa) * len * (s / 3))); }
      D.ribbon(pts, w, lo, base.clone().lerp(col(CRK), 0.5));
    }
    for (let i = 0; i < 3; i++) {   // stains
      const r = 0.05 + 0.18 * q(i, k + 21), x0 = cx + (q(i, k + 22) - 0.5) * (SW - 0.2), z0 = cz + (q(i, k + 23) - 0.5) * (SD - 0.2);
      D.plate(circ(r, 9, 1 + 0.4 * q(i, k + 24), 0.7), V3(x0, 0.001, z0), V3(1, 0, 0), V3(0, 0, -1), 0.0006, base.clone().lerp(col(STN), 0.16));
    }
    for (let i = 0; i < 2; i++) {   // chips on the arrises
      const x0 = cx + (q(i, k + 31) > 0.5 ? 1 : -1) * (SW / 2 - 0.05 - 0.05 * q(i, k + 33)), z0 = cz + (q(i, k + 32) - 0.5) * (SD - 0.2);
      D.plate(circ(0.014 + 0.03 * q(i, k + 34), 6), V3(x0, 0.001, z0), V3(1, 0, 0), V3(0, 0, -1), 0.0006, base.clone().lerp(col(CRK), 0.4), 1);
    }
  }
}
function courtWall(A, D) {
  A.box(0, 2.15, -4.5, 15, 4.3, 0.48, PL);
  // courses
  for (let j = 1; j < 10; j++) D.box(0, 0.43 * j, CW.z + 0.003, 15, 0.011, 0.006, "#B99A68", 0.95 + 0.1 * q(j, 1));
  for (let j = 0; j < 10; j++) for (let i = 0; i < 13; i++) {
    const x = -7.5 + 1.2 * (i + 0.5 * (j % 2)) + (q(i, j + 40) - 0.5) * 0.1; if (x > 7.45 || x < -7.45) continue;
    D.box(x, 0.43 * (j + 0.5), CW.z + 0.003, 0.011, 0.43, 0.006, "#B99A68", 0.95 + 0.1 * q(i, j + 50));
  }
  D.box(0, 0.25, CW.z + 0.003, 15, 0.5, 0.006, REL); D.box(0, 0.5, CW.z + 0.006, 15, 0.03, 0.008, OCH); D.box(0, 0.47, CW.z + 0.005, 15, 0.012, 0.008, RED);
  const PW = 15 / 7, YR = [0.55, 1.29, 2.26], HR = [0.52, 0.81, 0.45], U = V3(1, 0, 0), W = V3(0, 1, 0);
  for (let p = 0; p < 7; p++) {
    const x0 = -7.5 + PW * p, k = p;
    D.box(x0, 1.7, CW.z + 0.004, 0.035, 2.4, 0.01, p % 2 ? BLU : RED); D.box(x0 + 0.04, 1.7, CW.z + 0.004, 0.012, 2.4, 0.01, OCH);
    for (let r = 0; r < 3; r++) {
      const y0 = YR[r], h = HR[r], kk = k * 3 + r, xc = x0 + PW / 2, bg = new THREE.Color("#E7D1A0").multiplyScalar(0.96 + 0.06 * q(kk, 2));
      D.box(xc, y0 + h / 2, CW.z + 0.003, PW - 0.14, h, 0.006, bg);
      D.box(xc, y0 + h - 0.012, CW.z + 0.006, PW - 0.14, 0.024, 0.008, BLU); D.box(xc, y0 + 0.012, CW.z + 0.006, PW - 0.14, 0.024, 0.008, RED);
      D.box(xc, y0 + h - 0.03, CW.z + 0.006, PW - 0.14, 0.008, 0.008, OCH); D.box(xc, y0 + 0.03, CW.z + 0.006, PW - 0.14, 0.008, 0.008, OCH);
      const gh = Math.min(0.12, h * 0.2), fh = h - 2 * gh - 0.07;
      for (let f = 0; f < 5; f++) {   // five profile figures, facing the centre of the panel
        const fx = x0 + 0.25 + (PW - 0.5) * (f + 0.5 * 0) / 4 + (q(f, kk + 1) - 0.5) * 0.04, dir = f < 2 ? 1 : f > 2 ? -1 : (q(kk, 8) > 0.5 ? 1 : -1);
        figure(D, V3(fx, y0 + gh + 0.04, CW.z + 0.006), U, W, fh * 0.82, dir, kk * 7 + f, 11, 0.006, 0);
      }
      for (const row of [0, 1]) for (let gi = 0; gi < 9; gi++) {   // nine incision groups above and below
        const gx = x0 + 0.17 + (PW - 0.34) * (gi + 0.5) / 9, gy = row ? y0 + h - 0.06 - gh / 2 + 0.01 : y0 + 0.045 + gh / 2;
        for (let s = 0; s < 3; s++) { const kg = Math.floor(q(s + gi * 3 + row * 27, kk + 61) * 7), c = GCOL[Math.floor(q(s, kk * 9 + gi + row) * 5)]; glyph(D, V3(gx + (s - 1) * 0.062, gy, CW.z + 0.006), U, W, Math.min(0.075, gh * 0.8), kg, c, 0.004, 0); }
      }
    }
    for (let i = 0; i < 9; i++) {   // chips of fallen plaster
      const cx = x0 + 0.1 + (PW - 0.2) * q(i, k + 71), cy = 0.3 + 3.2 * q(i, k + 72);
      D.plate(circ(0.017 + 0.055 * q(i, k + 73), 6 + (i % 3), 1.3, 0.8), V3(cx, cy, CW.z + 0.007), U, W, 0.002, i % 3 ? REL : col(STN), 0.9 + 0.2 * q(i, k + 74));
    }
    for (let i = 0; i < 3; i++) {   // a stain streak from the cornice
      const sx = x0 + 0.2 + (PW - 0.4) * q(i, k + 81), sl = 0.3 + 0.9 * q(i, k + 82), sw = 0.05 + 0.07 * q(i, k + 83);
      D.box(sx, 4.15 - sl / 2, CW.z + 0.0035, sw, sl, 0.004, STN, 1.05, 0, 0, (q(i, k + 84) - 0.5) * 0.06);
    }
  }
  // khekher frieze under the cap, and the cavetto cap
  for (let i = 0; i < 94; i++) { const x = -7.5 + 0.08 + 0.16 * i, c = [BLU, RED, GRN, OCH][i % 4]; D.box(x, 3.4, CW.z + 0.006, 0.075, 0.3, 0.008, c, 0.95 + 0.1 * q(i, 90)); D.box(x, 3.56, CW.z + 0.011, 0.04, 0.03, 0.006, GOLD); }
  D.box(0, 3.2, CW.z + 0.006, 15, 0.03, 0.01, GOLD); D.box(0, 3.62, CW.z + 0.006, 15, 0.03, 0.01, GOLD);
  A.box(0, 4.33, -4.4, 15.1, 0.09, 0.62, "#CDA86F"); A.box(0, 4.37, -4.1, 15.1, 0.02, 0.05, GOLD); D.box(0, 4.27, CW.z - 0.02, 15, 0.05, 0.04, OCH);
}
const colR = (y) => lerp(0.275, 0.215, (y - 0.22) / 2.83);
const BANDS = [[0.48, 0.06], [0.91, 0.12], [1.4, 0.32], [2.24, 0.24], [2.84, 0.1]];
const fluteAmt = (y) => { let a = 1; for (const [b, w] of BANDS) a = Math.min(a, sstep(0, 0.03, Math.max(b - y, y - (b + w)))); return a; };
const CAPPROF = [[0.215, 3.05], [0.222, 3.1], [0.24, 3.17], [0.29, 3.3], [0.355, 3.46], [0.405, 3.62], [0.43, 3.74], [0.43, 3.85]];
const capR = (y) => { for (let i = 0; i + 1 < CAPPROF.length; i++) { const [r0, y0] = CAPPROF[i], [r1, y1] = CAPPROF[i + 1]; if (y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0)); } return 0.43; };
function courtColumn(g, A, D, cx, cz, k) {
  const tone0 = 0.97 + 0.05 * q(k, 2);
  // plinth and shaft
  const plinth = new THREE.CylinderGeometry(0.4, 0.4, 0.22, 36); const pa = new Acc(); pa.push(plinth, M4(cx, 0.11, cz), (x, y, z) => col("#CDAE7E", 0.95 + 0.08 * q(Math.floor((y + 1) * 10), k)), 1);
  A.push(plinth, M4(cx, 0.11, cz), "#CDAE7E", tone0);
  const shaft = grid(72, 90, (u, v) => {
    const a = u * TAU, y = lerp(0.22, 3.05, v), fr = (u * 12) % 1, fl = 0.016 * (1 - Math.pow(2 * fr - 1, 2)) * fluteAmt(y), r = colR(y) - fl;
    return [cx + r * Math.sin(a), y, cz + r * Math.cos(a)];
  }, (u, v) => {
    const y = lerp(0.22, 3.05, v), fr = (u * 12) % 1, fl = 0.016 * (1 - Math.pow(2 * fr - 1, 2)) * fluteAmt(y), n = q(Math.floor(u * 72) + 3, Math.floor(v * 90) + k * 19), st = q(Math.floor(u * 72 / 3), k + 55) > 0.82 ? 0.9 : 1;
    return col(PL, tone0 * (0.97 + 0.05 * n) * (1 - fl * 7) * (1 - 0.2 * Math.exp(-(y - 0.22) / 0.35)) * st);
  }, (u) => V3(Math.sin(u * TAU), 0, Math.cos(u * TAU)), true);
  mesh(shaft, vmat({ roughness: 0.9 }), g);
  // registers: pigment rings and relief figure bands
  const ring = (y, h, c, tone = 1, lift = 0.0035) => D.push(new THREE.CylinderGeometry(colR(y + h) + lift, colR(y) + lift, h, 48, 1, true), M4(cx, y + h / 2, cz), c, tone);
  ring(0.48, 0.06, RED); ring(0.485, 0.012, GOLD, 1, 0.005); ring(0.525, 0.012, GOLD, 1, 0.005);
  ring(0.91, 0.12, "#E7D1A0"); ring(0.91, 0.018, OCH, 1, 0.005); ring(1.012, 0.018, OCH, 1, 0.005);
  for (let i = 0; i < 24; i++) {   // the checker row on the .12 band
    const a = ((i + 0.5) / 24) * TAU, R = colR(0.97) + 0.0055, O = V3(cx + R * Math.sin(a), 0.935, cz + R * Math.cos(a));
    D.plate([[-0.0225, 0], [0.0225, 0], [0.0225, 0.07], [-0.0225, 0.07]], O, V3(Math.cos(a), 0, -Math.sin(a)), V3(0, 1, 0), 0.003, i % 2 ? BLU : RED, 1);
  }
  for (const [yb, hb, nf, sc] of [[1.4, 0.32, 8, 0.8], [2.24, 0.24, 8, 0.78]]) {
    ring(yb, hb, "#E8D2A2"); ring(yb, 0.022, RED, 1, 0.005); ring(yb + hb - 0.022, 0.022, BLU, 1, 0.005);
    for (let f = 0; f < nf; f++) {
      const a = ((f + 0.5) / nf) * TAU, R = colR(yb + hb / 2) + 0.0045;
      figure(D, V3(cx + R * Math.sin(a), yb + 0.035, cz + R * Math.cos(a)), V3(Math.cos(a), 0, -Math.sin(a)), V3(0, 1, 0), (hb - 0.075) * sc, 1, k * 11 + f + (yb > 2 ? 3 : 0), 13, 0.004, 0);
    }
  }
  ring(2.84, 0.1, "#E7D1A0"); ring(2.84, 0.03, BLU, 1, 0.005); ring(2.885, 0.025, GOLD, 1, 0.005); ring(2.915, 0.025, RED, 1, 0.005);
  for (let i = 0; i < 24; i++) { const a = ((i + 0.5) / 24) * TAU, R = colR(2.9) + 0.0055; D.plate([[-0.0225, 0], [0.0225, 0], [0.0225, 0.025], [-0.0225, 0.025]], V3(cx + R * Math.sin(a), 2.89, cz + R * Math.cos(a)), V3(Math.cos(a), 0, -Math.sin(a)), V3(0, 1, 0), 0.003, i % 2 ? GRN : TURQ, 1); }
  // streaks, chips
  for (let i = 0; i < 6; i++) {
    const a = q(i, k + 91) * TAU, yy = 0.3 + 2.5 * q(i, k + 92), l = 0.07 + 0.22 * q(i, k + 93), R = colR(yy) + 0.002;
    D.plate([[-0.01 - 0.01 * q(i, k + 94), 0], [0.012 + 0.012 * q(i, k + 95), 0], [0.006, l], [-0.004, l]], V3(cx + R * Math.sin(a), yy, cz + R * Math.cos(a)), V3(Math.cos(a), 0, -Math.sin(a)), V3(0, 1, 0), 0.002, "#C9A878", 1);
  }
  for (let i = 0; i < 4; i++) {
    const a = q(i, k + 96) * TAU, yy = 0.3 + 2.4 * q(i, k + 97), R = colR(yy) + 0.006;
    D.plate(circ(0.01 + 0.02 * q(i, k + 98), 6), V3(cx + R * Math.sin(a), yy, cz + R * Math.cos(a)), V3(Math.cos(a), 0, -Math.sin(a)), V3(0, 1, 0), 0.002, "#B99668", 1);
  }
  // capital: bell + 12 petals with gold rims
  const bell = grid(48, 24, (u, v) => { const y = lerp(3.05, 3.85, v), a = u * TAU, r = capR(y); return [cx + r * Math.sin(a), y, cz + r * Math.cos(a)]; },
    (u, v) => { const y = lerp(3.05, 3.85, v); return y < 3.1 ? RED : y < 3.14 ? GOLD : y > 3.8 ? OCH : y > 3.77 ? RED : col("#E2C99A", 0.97 + 0.05 * q(Math.floor(u * 48), Math.floor(v * 24) + k)); }, (u) => V3(Math.sin(u * TAU), 0, Math.cos(u * TAU)), true);
  mesh(bell, vmat({ roughness: 0.9 }), g);
  for (let m = 0; m < 12; m++) {
    const a0 = (m / 12) * TAU, c = m % 2 ? GRN : BLU, wmax = 0.098;
    for (const [inset, color, lift] of [[0, GOLD, 0.004], [0.018, c, 0.007]]) {
      const s0 = 3.2 + inset * 1.2, s1 = 3.78 - inset * 1.3;
      const petal = grid(6, 14, (u, v) => {
        const y = lerp(s0, s1, v), s = (y - 3.2) / 0.58, w = Math.max(0, (wmax * Math.pow(Math.sin(Math.PI * Math.pow(clamp(s), 0.8)), 0.7) - inset)), r = capR(y) + lift, ang = a0 + ((u - 0.5) * 2 * w) / r;
        return [cx + r * Math.sin(ang), y, cz + r * Math.cos(ang)];
      }, (u, v) => (Math.abs(u - 0.5) < 0.04 && inset ? new THREE.Color(c).multiplyScalar(0.7) : new THREE.Color(color).multiplyScalar(0.95 + 0.1 * q(m, k + Math.floor(v * 14)))), (u, v) => V3(Math.sin(a0), 0, Math.cos(a0)));
      const pm = vmat({ roughness: 0.55 }); pm.userData.noOutline = true; const pmesh = mesh(petal, pm, g); pmesh.castShadow = false;
    }
  }
  D.push(new THREE.TorusGeometry(0.43, 0.011, 6, 48), M4(cx, 3.84, cz, Math.PI / 2), GOLD, 1);
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * TAU; D.push(new THREE.SphereGeometry(0.02, 6, 4), M4(cx + 0.43 * Math.sin(a), 3.75, cz + 0.43 * Math.cos(a), 0, 0, 0, 1, 1.3, 1), TURQ, 1); }
}
function courtRoof(A, D) {
  const cx = -2.475, cz = -2.785, w = 8.2, d = 2.95;
  A.box(cx, 4.02, cz, w, 0.34, d, "#D3B07C");
  const zf = cz + d / 2 + 0.003, U = V3(1, 0, 0), W = V3(0, 1, 0);
  D.box(cx, 3.88, zf, w, 0.06, 0.008, BLU); D.box(cx, 3.855, zf + 0.003, w, 0.012, 0.008, GOLD);
  D.box(cx, 3.99, zf, w, 0.12, 0.008, "#E7D1A0");
  for (let i = 0; i < 38; i++) { const x = cx - w / 2 + 0.15 + (w - 0.3) * (i + 0.5) / 38; glyph(D, V3(x, 3.99, zf + 0.005), U, W, 0.085, Math.floor(q(i, 3) * 7), GCOL[i % 5], 0.004); }
  D.box(cx, 4.075, zf, w, 0.05, 0.008, RED); D.box(cx, 4.12, zf, w, 0.07, 0.008, OCH);
  for (let i = 0; i < 80; i++) D.box(cx - w / 2 + 0.05 + (w - 0.1) * (i + 0.5) / 80, 4.15, zf + 0.004, 0.05, 0.04, 0.008, i % 2 ? BLU : GRN);
  D.box(cx, 4.185, zf + 0.01, w + 0.05, 0.02, 0.04, GOLD);
  // the blue painted ceiling with gold stars
  D.box(cx, 3.847, cz, w - 0.1, 0.004, d - 0.1, "#3A6B7C");
  for (let i = 0; i < 70; i++) {
    const x = cx - w / 2 + 0.25 + (w - 0.5) * q(i, 5), z = cz - d / 2 + 0.2 + (d - 0.4) * q(i, 6), r = 0.035 + 0.02 * q(i, 7), pts = [];
    for (let s = 0; s < 10; s++) { const rr = s % 2 ? r * 0.45 : r; pts.push([Math.sin((s / 10) * TAU) * rr, Math.cos((s / 10) * TAU) * rr]); }
    D.plate(pts, V3(x, 3.845, z), V3(1, 0, 0), V3(0, 0, 1), 0.003, GOLD2, 1);
  }
}
function pylonTower(A, D, x, z, k) {
  const steps = [[2.2, 4.6, 2.0], [2.0, 2.4, 1.8], [1.8, 1.2, 1.6]]; let y = 0;
  for (const [w, h, dd] of steps) { A.box(x, y + h / 2, z, w, h, dd, "#D6B882", 0.95 + 0.08 * q(k, y)); y += h; }
  A.box(x, y + 0.08, z, 2.0, 0.16, 1.8, "#C9A56C"); A.box(x, y + 0.2, z + 0.9, 1.9, 0.05, 0.05, GOLD);
  for (let j = 1; j < 18; j++) D.box(x, 0.42 * j, z + 1.01, 2.1 - 0.0 * j, 0.01, 0.006, "#B99A68");
  D.box(x, 2.0, z + 1.012, 0.7, 3.2, 0.008, RED, 0.9); D.box(x, 2.0, z + 1.016, 0.5, 3.0, 0.008, "#E7D1A0");
  for (let i = 0; i < 8; i++) glyph(D, V3(x, 0.8 + 0.4 * i, z + 1.02), V3(1, 0, 0), V3(0, 1, 0), 0.22, i + k, GCOL[i % 5], 0.004);
}
function memphiscourt(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const A = new Acc(), D = new Acc(), FL = new Acc();
  courtFloor(FL, D); courtWall(A, D);
  let kk = 0;
  for (let ix = 0; ix < 4; ix++) for (const z of [-3.65, -1.55]) courtColumn(G, A, D, -5.55 + 2.05 * ix, z, kk++);
  courtRoof(A, D);
  if (S.pylons !== false) { pylonTower(A, D, 4.3, -8.4, 1); pylonTower(A, D, 7.4, -8.4, 2); A.box(5.85, 2.2, -8.8, 3.6, 4.4, 1.4, "#CFAC76"); }
  const am = vmat({ roughness: 0.9, lc: "#7a5e3c" }), a = mesh(A.geo(), am, G); a.userData.solid = true;
  const fl = mesh(FL.geo(), vmat({ roughness: 0.95, emissive: "#8f7650", emissiveIntensity: 0.55, lc: "#7a6446" }), G); fl.userData.solid = true; fl.castShadow = false;
  decal(D.geo(), G, { roughness: 0.85 }).receiveShadow = true;
  if (S.palms !== false) for (const [i, [x, z, h]] of [[3.1, -3.1, 4.6], [5.2, -2.9, 3.8], [6.4, -4, 4.1]].entries()) { const p = buildPalm(G, h, (S.seed ?? 0) + i + 1); p.position.set(x, 0, z); }
  return { grip: 0 };
}
function palm(P) {
  const S = P.spec; buildPalm(P.whole, S.height ?? 4, S.seed ?? 0, { lean: S.lean ?? 1, dates: S.dates });
  return { grip: 0 };
}

// ================================================================================================================ apisbier
function hideTex() {
  return once("eg-apis-hide", () => {
    const W = 2048, H = 1024, [c, g] = canvas(W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#1d1d23"); gr.addColorStop(0.28, "#2a2a31"); gr.addColorStop(0.5, "#34353d"); gr.addColorStop(0.72, "#2a2a31"); gr.addColorStop(1, "#1d1d23");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let x = 0; x < 6; x++) { g.fillStyle = "#424049"; g.globalAlpha = 0.18; g.beginPath(); g.ellipse(W * 0.965, H * (0.2 + 0.6 * q(x, 1)), 90, 90, 0, 0, TAU); g.fill(); }   // muzzle end of the spine
    g.globalAlpha = 1; g.lineCap = "round";
    for (let i = 0; i < 1400; i++) {   // hair strokes: each its own place, length, angle, tone
      const x = q(i, 1) * W, y = q(i, 8) * H, l = 8 + 40 * q(i, 12), a = 0.15 + (q(i, 14) - 0.5) * 0.7, t = q(i, 4);
      g.strokeStyle = t > 0.55 ? HIDE2 : t > 0.2 ? "#14141a" : "#52525b"; g.globalAlpha = 0.14 + 0.3 * q(i, 6); g.lineWidth = 1 + 2.2 * q(i, 18);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < 42; i++) {   // the 42 long fur strokes (.013-.062 m): glossy tufts on the back
      const x = q(i, 31) * W, y = (0.22 + 0.45 * q(i, 32)) * H, l = 14 + 66 * q(i, 33);
      g.strokeStyle = "#5d5f6b"; g.globalAlpha = 0.29; g.lineWidth = 2 + 3 * q(i, 34); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y - 4, x + l, y + 2 + 6 * q(i, 35)); g.stroke();
    }
    g.lineCap = "round";
    for (const vc of [0.25, 0.75]) for (let r = 0; r < 9; r++) { const u = (0.3 + 0.09 * r) * W, v = vc * H; g.globalAlpha = 0.3; g.strokeStyle = "#0e0e12"; g.lineWidth = 5 + 3 * q(r, 77); g.beginPath(); g.moveTo(u, v - 150); g.quadraticCurveTo(u + 20 + 15 * q(r, 78), v, u - 6, v + 150); g.stroke(); g.globalAlpha = 0.16; g.strokeStyle = "#5d5f6b"; g.lineWidth = 3; g.beginPath(); g.moveTo(u + 10, v - 140); g.quadraticCurveTo(u + 34 + 15 * q(r, 78), v, u + 4, v + 140); g.stroke(); }
    g.globalAlpha = 1; return tex(c);
  });
}
function giltCol(tone, k) { return (x, y, z) => col(((Math.floor(x * 40) + Math.floor(y * 40) + Math.floor(z * 40)) % 7 === 0) ? GOLD2 : GOLD, tone); }
function bierBase(A, D) {
  const U = V3(1, 0, 0), W = V3(0, 1, 0), fz = 0.46;
  A.box(0, 0.484, 0, 2.12, 0.092, 0.92, GOLD, 1);
  A.box(0, 0.532, 0.445, 2.1, 0.02, 0.03, GOLD2, 0.95); A.box(0, 0.532, -0.445, 2.1, 0.02, 0.03, GOLD2, 0.95);
  A.box(1.045, 0.532, 0, 0.03, 0.02, 0.88, GOLD2, 0.95); A.box(-1.045, 0.532, 0, 0.03, 0.02, 0.88, GOLD2, 0.95);
  A.box(0, 0.55, 0, 1.96, 0.03, 0.78, DRAPE, 0.96);   // linen pad, top .565
  for (let i = 0; i < 14; i++) D.box(-0.9 + 1.8 * q(i, 3), 0.566, (q(i, 4) - 0.5) * 0.7, 0.2 + 0.4 * q(i, 5), 0.003, 0.012, "#C9B592", 1, q(i, 6) * 0.3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // gilt legs, with a capital, collar rings and a foot
    const x = sx * 0.83, z = sz * 0.33; A.box(x, 0.219, z, 0.105, 0.438, 0.105, GOLD, 0.97);
    A.box(x, 0.41, z, 0.14, 0.04, 0.14, GOLD2, 0.96); A.box(x, 0.02, z, 0.13, 0.04, 0.13, GOLD2, 0.94); A.box(x, 0.22, z, 0.12, 0.018, 0.12, GOLD2, 0.9); A.box(x, 0.27, z, 0.115, 0.012, 0.115, "#8B5E22", 1);
    A.box(x, 0.16, z, 0.118, 0.012, 0.118, "#8B5E22", 1);
  }
  for (const sz of [-1, 1]) {   // the two carrying poles
    A.push(new THREE.CylinderGeometry(0.029, 0.029, 2.48, 14), M4(0, 0.3, sz * 0.34, 0, 0, Math.PI / 2), GOLD, 0.96);
    for (const sx of [-1, 1]) { A.push(new THREE.SphereGeometry(0.036, 10, 8), M4(sx * 1.25, 0.3, sz * 0.34, 0, 0, 0, 1.2, 1, 1), GOLD2, 1); A.push(new THREE.TorusGeometry(0.03, 0.007, 5, 14), M4(sx * 1.17, 0.3, sz * 0.34, 0, Math.PI / 2), "#8B5E22", 1); for (const dx of [-0.075, 0.075]) A.push(new THREE.TorusGeometry(0.031, 0.01, 5, 14), M4(sx * 0.83 + dx, 0.3, sz * 0.34, 0, Math.PI / 2), "#BB985C", 1); }
  }
  // fascia (+Z): a lapis panel, gilt frame, the winged sun disc with two wings of 13 feathers, wear spots on both long edges
  const zf = 0.46 + 0.012, ph = 0.16, py = 0.455;
  D.box(0, py, zf, 1.56, ph, 0.012, LAPIS); D.box(0, py + ph / 2, zf + 0.004, 1.58, 0.022, 0.016, GOLD2); D.box(0, py - ph / 2, zf + 0.004, 1.58, 0.022, 0.016, GOLD2);
  D.box(0.79, py, zf + 0.004, 0.022, ph + 0.02, 0.016, GOLD2); D.box(-0.79, py, zf + 0.004, 0.022, ph + 0.02, 0.016, GOLD2);
  D.push(new THREE.CylinderGeometry(0.039, 0.039, 0.016, 20), M4(0, py, zf + 0.012, Math.PI / 2), GOLD2, 1); D.push(new THREE.TorusGeometry(0.039, 0.006, 6, 20), M4(0, py, zf + 0.02), GOLD, 1);
  D.push(new THREE.SphereGeometry(0.02, 8, 6), M4(0, py, zf + 0.025, 0, 0, 0, 1, 1, 0.5), CARN, 1);
  for (const s of [-1, 1]) {   // a wing: 13 long flight feathers fanning out and down, 13 short coverts over them, a gilt leading edge
    const top = py + 0.05, Wg = 0.56, OO = V3(0, 0, zf + 0.007);
    const feather = (x0, y0, fw, fl, a, fill, lift, depth) => {
      const loc = [[-fw / 2, 0], [fw / 2, 0], [fw / 2, -fl], [fw * 0.3, -fl - fw * 0.28], [-fw * 0.3, -fl - fw * 0.28], [-fw / 2, -fl]];
      D.plate(loc.map(([u, v]) => [x0 + u * Math.cos(a) - v * Math.sin(a), y0 + v * Math.cos(a) + u * Math.sin(a)]), OO, U, W, depth, fill, 1, lift);
    };
    for (let i = 0; i < 13; i++) {   // 13 flight feathers as stacked horizontal bars, longest in the lower middle, tips rounded and drooping
      const y = top - 0.004 - i * 0.0098, L = Wg * (0.5 + 0.5 * Math.sin(Math.PI * (0.18 + 0.82 * (i + 1) / 13))), c = ["#3a5da8", TURQ, CARN, "#2b3f86"][i % 4], x1 = 0.05, x2 = x1 + L, dr = 0.0016 * i;
      D.plate([[x1 * s, y], [(x2 - 0.03) * s, y - dr * 0.5], [x2 * s, y - dr - 0.004], [(x2 - 0.03) * s, y - dr - 0.0088], [x1 * s, y - 0.0092]], OO, U, W, 0.004, GOLD2, 1, 0.001);
      D.plate([[(x1 + 0.004) * s, y - 0.0012], [(x2 - 0.034) * s, y - dr * 0.5 - 0.0012], [(x2 - 0.006) * s, y - dr - 0.0042], [(x2 - 0.034) * s, y - dr - 0.0076], [(x1 + 0.004) * s, y - 0.0078]], OO, U, W, 0.004, c, 1, 0.0022);
    }
    for (let f = 0; f < 13; f++) {   // 13 short coverts along the leading edge
      const x0 = s * (0.07 + (Wg / 13) * (f + 0.5) * 0.97), fw = (Wg / 13) * 0.95, cc = [LAPIS, "#2b8f8a", "#7d2d1f", GOLD][f % 4];
      D.plate([[-fw / 2, 0], [fw / 2, 0], [fw / 2, -0.012], [0, -0.022], [-fw / 2, -0.012]].map(([u, v]) => [x0 + u, top + 0.006 + v + 0.012 - f * 0.0004]), OO, U, W, 0.004, cc, 1, 0.0045);
    }
    D.plate([[0.045 * s, top + 0.008], [0.585 * s, top - 0.002], [0.585 * s, top - 0.013], [0.045 * s, top - 0.004]], OO, U, W, 0.006, GOLD2, 1, 0.006);   // leading edge
  }
  for (const e of [-1, 1]) for (let i = 0; i < 12; i++) D.plate(circ(0.006 + 0.01 * q(i, 40 + e), 7), V3(-0.74 + 1.48 * q(i, 41 + e), py + e * (ph / 2 - 0.004 * q(i, 43)), zf + 0.016), U, W, 0.002, "#6a4a1c", 0.9 + 0.3 * q(i, 44));
  // the other faces: a lapis inset in a gilt frame
  D.box(0, py, -zf, 1.56, ph, 0.012, LAPIS, 0.9); D.box(0, py + ph / 2, -zf - 0.004, 1.58, 0.022, 0.016, GOLD2); D.box(0, py - ph / 2, -zf - 0.004, 1.58, 0.022, 0.016, GOLD2);
  for (const s of [-1, 1]) {
    D.box(s * 1.066, py, 0, 0.012, ph, 0.7, LAPIS, 0.95); D.box(s * 1.07, py + ph / 2, 0, 0.016, 0.022, 0.72, GOLD2); D.box(s * 1.07, py - ph / 2, 0, 0.016, 0.022, 0.72, GOLD2);
    for (let i = 0; i < 9; i++) D.plate([[-0.03, 0], [0.03, 0], [0, 0.07]], V3(s * 1.075, py - 0.05, -0.32 + i * 0.08), V3(0, 0, s), W, 0.004, i % 2 ? GOLD2 : TURQ, 1);
  }
}
// the head's own frame (see bull): F forward, L lateral, D dorsal
const HEAD = { c: [[-0.66, 0.79, 0.06], [-0.74, 0.74, 0.11], [-0.82, 0.68, 0.155], [-0.91, 0.61, 0.2], [-0.955, 0.585, 0.222]], w: [0.135, 0.13, 0.1, 0.09, 0.03], up: [0.125, 0.12, 0.095, 0.08, 0.03], dn: [0.125, 0.115, 0.085, 0.075, 0.03], n: 2.6 };
function headFrame() {
  const F = V3(...HEAD.c[3]).sub(V3(...HEAD.c[0])).normalize(), L = new THREE.Vector3().crossVectors(V3(0, 1, 0), F).normalize(), D = new THREE.Vector3().crossVectors(F, L).normalize();
  return { F, L, D };
}
const headAt = (f) => { const i = Math.min(3, Math.floor(f)), t = f - i, g = (a) => lerp(a[i], a[i + 1], t); return { c: V3(...HEAD.c[i]).lerp(V3(...HEAD.c[i + 1]), t), w: g(HEAD.w), up: g(HEAD.up) }; };
function bullBody(G, S) {
  const hm = lined(mat("#ffffff", { map: hideTex(), roughness: 0.62 }), "#0b0b10");
  const secs = [
    { c: [0.9, 0.745, -0.075], w: 0.035, up: 0.04, dn: 0.04, n: 2 }, { c: [0.87, 0.755, -0.07], w: 0.1, up: 0.1, dn: 0.1, n: 2 }, { c: [0.8, 0.78, -0.065], w: 0.205, up: 0.2, dn: 0.2, n: 2.1 }, { c: [0.7, 0.795, -0.06], w: 0.265, up: 0.25, dn: 0.255, n: 2.2 }, { c: [0.58, 0.8, -0.05], w: 0.3, up: 0.275, dn: 0.275, n: 2.2 },
    { c: [0.33, 0.82, -0.04], w: 0.305, up: 0.27, dn: 0.28, n: 2.2 }, { c: [0.07, 0.83, -0.025], w: 0.33, up: 0.29, dn: 0.29, n: 2.2 }, { c: [-0.15, 0.88, -0.03], w: 0.33, up: 0.31, dn: 0.31, n: 2.2 },
    { c: [-0.35, 0.98, -0.04], w: 0.31, up: 0.33, dn: 0.33, n: 2.2 }, { c: [-0.5, 0.9, 0.02], w: 0.19, up: 0.2, dn: 0.19, n: 2.2 },
    ...HEAD.c.map((c, i) => ({ c, w: HEAD.w[i], up: HEAD.up[i], dn: HEAD.dn[i], n: HEAD.n })),
  ];
  const lg = makeLoft(secs, { sub: 5, radial: 32, ref: [0, 1, 0] }); lg.userData.set(secs);
  mesh(lg, hm, G);
  // the real skin, for placing the diamond, the eyes and the drape on it
  const rc = new THREE.Raycaster(), rayMesh = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); rayMesh.updateMatrixWorld(true);
  const hit = (o, d) => { rc.set(o, d.clone().normalize()); const h = rc.intersectObject(rayMesh, false); return h.length ? h[0] : null; };
  const { F, L, D } = headFrame(), C7 = V3(...HEAD.c[0]);
  // the white forehead diamond .117 x .106 (a domed diamond on the head's dorsal surface), between the eyes
  { const h = headAt(0.75), dg = grid(6, 6, (u, v) => { const X = (u + v - 1) * 0.0585, Y = (v - u) * 0.053, o = h.c.clone().addScaledVector(L, X).addScaledVector(F, Y).addScaledVector(D, 0.4), r = hit(o, D.clone().negate());
      return (r ? r.point.clone().addScaledVector(D, 0.0035) : h.c.clone().addScaledVector(L, X).addScaledVector(F, Y).addScaledVector(D, h.up)).toArray(); }, (u, v) => "#F7E7CD", D);
    const dm = mat("#ffffff", { vertexColors: true, roughness: 0.9 }); dm.userData.noOutline = true; mesh(dg, dm, G).castShadow = false; }
  // closed eyes: a thin dark curve with a lid fold, one each side below the horn base
  for (const s of [-1, 1]) {
    const h = headAt(1.05), e = new Acc(), pts = [];
    for (let i = 0; i <= 6; i++) { const t = (i / 6 - 0.5) * 0.06, X = s * 0.1, o = h.c.clone().addScaledVector(L, X).addScaledVector(F, t).addScaledVector(D, 0.4), r = hit(o, D.clone().negate().addScaledVector(L, -s * 0.5));
      pts.push((r ? r.point : h.c.clone().addScaledVector(L, X).addScaledVector(F, t).addScaledVector(D, h.up)).clone().addScaledVector(D, 0.003 - 0.0 * Math.pow(i / 6 * 2 - 1, 2))); }
    e.ribbon(pts, 0.006, D, HOOF); e.ribbon(pts.map((p) => p.clone().addScaledVector(F, 0.014).addScaledVector(D, 0.0025)), 0.004, D, "#6a6c78");
    const em = vmat({ roughness: 0.8 }); em.userData.noOutline = true; mesh(e.geo(), em, G).castShadow = false;
    // ears .14 x .079, behind and under the horns, pointing out
    const ear = new Acc(), eb = h.c.clone().addScaledVector(L, s * 0.115).addScaledVector(F, -0.07).addScaledVector(D, 0.03), ed = L.clone().multiplyScalar(s).addScaledVector(D, 0.15).addScaledVector(F, -0.2).normalize();
    const qn = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), ed), em4 = new THREE.Matrix4().compose(eb.clone().addScaledVector(ed, 0.06), qn, V3(0.07, 0.0395, 0.012));
    ear.push(new THREE.SphereGeometry(1, 10, 8), em4, HIDE, 1.1);
    ear.push(new THREE.SphereGeometry(1, 8, 6), new THREE.Matrix4().compose(eb.clone().addScaledVector(ed, 0.06).addScaledVector(D, 0.008), qn, V3(0.055, 0.026, 0.012)), "#5a4a4a", 1);
    mesh(ear.geo(), vmat({ roughness: 0.7 }), G);
    // horns .27 long, O.081 -> .012, 43 deg out and up, curving forward; six growth rings
    const base = C7.clone().addScaledVector(L, s * 0.105).addScaledVector(D, 0.075).addScaledVector(F, 0.025), d0 = L.clone().multiplyScalar(s * Math.cos(43 * DEG)).addScaledVector(D, Math.sin(43 * DEG)), tgt = D.clone().multiplyScalar(0.8).addScaledVector(F, 0.6), hp = [base.clone()];
    let p = base.clone();
    for (let i = 0; i < 16; i++) { const t = i / 16, d = d0.clone().lerp(tgt, sstep(0, 1, t) * 0.72).normalize(); p = p.clone().addScaledVector(d, 0.27 / 16); hp.push(p); }
    const hr = (t) => 0.0405 * Math.pow(1 - t, 1.3) + 0.006, hg = tubeGeo(hp, hr, 10, (t) => col(HORN, 1.0).lerp(col(HORN2), Math.pow(t, 1.6)));
    const hmM = vmat({ roughness: 0.45 }); mesh(hg, hmM, G);
    const rings = new Acc(), curve = new THREE.CatmullRomCurve3(hp);
    for (let r = 0; r < 6; r++) { const t = (r + 0.8) / 7.2, pt = curve.getPointAt(t), tg = curve.getTangentAt(t); rings.push(new THREE.TorusGeometry(hr(t) + 0.0008, 0.0026, 5, 14), new THREE.Matrix4().compose(pt, new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), tg), V3(1, 1, 1)), HORN2, 1); }
    const rm = vmat({ roughness: 0.5 }); rm.userData.noOutline = true; mesh(rings.geo(), rm, G).castShadow = false;
    // nostril .023
    const nm = new Acc(), mc = V3(...HEAD.c[3]), np = mc.clone().addScaledVector(F, 0.075).addScaledVector(L, s * 0.034).addScaledVector(D, 0.004);
    nm.plate(circ(0.0115, 8, 0.8, 1.3), np, L.clone().multiplyScalar(s), D, 0.004, HOOF, 1, 0.0); mesh(nm.geo(), vmat(), G).castShadow = false;
  }
  // legs folded under: knee K inside the flank, lower leg at the fold angle toward the hint, split hooves on the deck
  const hide = (c, y) => col(HIDE, 1.0 + 0.2 * Math.sin(c * 9));
  // each leg: hip H (inside the body), knee Kv, hoof centre Hf; the upper tube, the knee, the cannon bone, the fetlock and two split toes
  const leg = (H, Kv, Hf) => {
    const A = new Acc(), h = V3(...H), k = V3(...Kv), f = V3(...Hf), d = f.clone().sub(k).normalize(), An = f.clone().addScaledVector(d, -0.056), lm = (t) => col(HIDE, 1.05 + 0.1 * t);
    A.push(tubeGeo([h, h.clone().lerp(k, 0.5), k], (t) => lerp(0.085, 0.056, t), 10, lm), new THREE.Matrix4(), "#fff", 1);
    A.push(new THREE.SphereGeometry(0.06, 10, 8), M4(k.x, k.y, k.z), HIDE, 1.1);
    A.push(tubeGeo([k, k.clone().lerp(An, 0.5), An], (t) => lerp(0.05, 0.036, t), 8, lm), new THREE.Matrix4(), "#fff", 1);
    A.push(new THREE.SphereGeometry(0.04, 8, 6), M4(An.x, An.y, An.z), HIDE, 1);
    const qn = new THREE.Quaternion().setFromUnitVectors(V3(0, -1, 0), d), side = new THREE.Vector3().crossVectors(d, V3(0, 1, 0)).normalize();
    for (const sg of [-1, 1]) A.push(new THREE.CylinderGeometry(0.026, 0.034, 0.108, 8), new THREE.Matrix4().compose(f.clone().addScaledVector(side, sg * 0.023), qn, V3(1, 1, 1.12)), HOOF, 1);
    mesh(A.geo(), vmat({ roughness: 0.6, lc: "#0b0b10" }), G);
  };
  leg([-0.4, 0.9, 0.1], [-0.44, 0.63, 0.33], [-0.21, 0.605, 0.375]);
  leg([0.55, 0.9, 0.1], [0.7, 0.62, 0.2], [0.5, 0.6, 0.23]);
  leg([-0.4, 0.9, -0.08], [-0.44, 0.63, -0.27], [-0.22, 0.605, -0.25]);
  leg([0.55, 0.9, -0.12], [0.7, 0.62, -0.2], [0.5, 0.6, -0.25]);
  // tail O.032 tapering over .44, tuft .078
  { const tp = [[0.86, 0.76, -0.07], [0.95, 0.7, 0.0], [1.0, 0.6, 0.08], [0.98, 0.575, 0.17]], tg = tubeGeo(tp, (t) => lerp(0.016, 0.006, t), 8, () => HIDE); mesh(tg, vmat({ roughness: 0.6 }), G);
    const tf = new Acc(); tf.push(new THREE.SphereGeometry(1, 10, 8), M4(0.98, 0.56, 0.205, 0.5, 0, 0, 0.032, 0.039, 0.032), "#14141a", 1); mesh(tf.geo(), vmat({ roughness: 0.7 }), G); }
  // the white drape over the haunch: x .60 centre, .83 wide, eight folds to .041, hangs .37 over the +Z edge; its arc follows the real skin
  if (S.drape !== false) {
    const AX = [[0.9, 0.745, -0.075], [0.87, 0.755, -0.07], [0.8, 0.78, -0.065], [0.7, 0.795, -0.06], [0.58, 0.8, -0.05], [0.33, 0.82, -0.04], [0.07, 0.83, -0.025], [-0.15, 0.88, -0.03]];
    const axisAt = (x) => { let i = 0; while (i < AX.length - 2 && x < AX[i + 1][0]) i++; const t = clamp((x - AX[i][0]) / (AX[i + 1][0] - AX[i][0])); return [lerp(AX[i][1], AX[i + 1][1], t), lerp(AX[i][2], AX[i + 1][2], t)]; };
    const x0 = 0.6 - 0.415, NX = 64, XH = 0.84, cache = new Map();
    const pathHit = (x) => {
      const [yc, zc] = axisAt(x), P0 = V3(x, yc, zc), pts = [];
      for (let i = 0; i <= 13; i++) { const al = (125 - (125 * i) / 13) * DEG, r = hit(P0, V3(0, Math.sin(al), Math.cos(al))), d = (r ? r.distance : 0.1) + 0.022; pts.push([zc + Math.cos(al) * d, yc + Math.sin(al) * d]); }
      return pts;
    };
    const full = (arc) => {   // arc + the drop to the deck, the flat run to the edge and the hang
      const pts = arc.map(([z, y]) => [z, Math.max(0.575, y)]), zE = Math.max(pts[pts.length - 1][0], 0.3), yE = pts[pts.length - 1][1];
      for (let i = 1; i <= 3; i++) pts.push([lerp(zE, zE + 0.012, i / 3), lerp(yE, 0.575, Math.pow(i / 3, 1.2))]);
      for (let i = 1; i <= 4; i++) pts.push([lerp(zE + 0.012, 0.46, i / 4), 0.575 + 0.01 * Math.sin((i / 4) * Math.PI)]);
      for (let i = 1; i <= 11; i++) pts.push([0.466 + 0.012 * Math.sin((i / 11) * 2), lerp(0.565, 0.16, Math.pow(i / 11, 0.95))]);
      return pts;
    };
    const arcOf = (x) => {
      const xc = Math.min(x, XH); if (!cache.has(xc)) cache.set(xc, pathHit(xc));
      const base = cache.get(xc); if (x <= XH) return base;
      const k = sstep(XH, 1.015, x); return base.map(([z, y]) => [z, 0.575 + (y - 0.575) * (1 - 0.92 * k)]);
    };
    const n0 = full(arcOf(0.6)).length, dg = grid(NX, n0 - 1, (u, v) => {
      const x = x0 + u * 0.83, pts = full(arcOf(x)), j = Math.round(v * (n0 - 1)), p = pts[j], pr = pts[Math.max(0, j - 1)], pn = pts[Math.min(n0 - 1, j + 1)];
      const tz = pn[0] - pr[0], ty = pn[1] - pr[1], l = Math.hypot(tz, ty) || 1, nz = ty / l, ny = -tz / l, amp = 0.041 * sstep(0.1, 0.85, v), fold = (0.5 + 0.5 * Math.sin(u * 8 * TAU + 0.6)) * amp * (0.75 + 0.25 * Math.sin(u * 3.1 + v * 2.4));
      const edge = v > 0.97 ? (q(Math.floor(u * NX), 5) - 0.5) * 0.012 : 0;
      return [x, p[1] + ny * (fold + 0.004) - edge, p[0] + nz * (fold + 0.004)];
    }, (u, v) => { const fo = Math.sin(u * 8 * TAU + 0.6); return col(DRAPE, 0.93 + 0.07 * fo * sstep(0.1, 0.8, v) + 0.05 * q(Math.floor(u * NX), Math.floor(v * 40))); }, V3(0, 1, 0.2));
    const cm = vmat({ roughness: 0.95, side: THREE.DoubleSide, lc: "#8a7a5a" }); mesh(dg, cm, G);
    const fr = new Acc(); for (let i = 0; i < 22; i++) { const x = x0 + 0.83 * ((i + 0.5) / 22); fr.box(x, 0.145, 0.48 + 0.004 * q(i, 3), 0.014, 0.05 + 0.02 * q(i, 4), 0.004, "#CDB78F", 0.95 + 0.1 * q(i, 5)); }
    const frm = vmat({ roughness: 0.95 }); frm.userData.noOutline = true; mesh(fr.geo(), frm, G).castShadow = false;
  }
}
function apisbier(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const A = new Acc(), D = new Acc(); bierBase(A, D);
  const bm = vmat({ roughness: 0.35, metalness: 0.2 }); const bmesh = mesh(A.geo(), bm, G); bmesh.userData.solid = true;
  decal(D.geo(), G, { roughness: 0.4, metalness: 0.15 });
  if (S.bull !== false) {
    const BG = new THREE.Group(); G.add(BG); const sc = (S.bullLength ?? 1.84) / 1.84; BG.position.set(-0.05, 0.53, 0); BG.scale.set(sc, sc, sc);
    const inner = new THREE.Group(); inner.position.set(0.05 / sc * 0 + 0.05, -0.53, 0); BG.add(inner); bullBody(inner, S);
  }
  return { grip: 0 };
}

// ================================================================================================================ nilebarge
const BG = { L: 8.6, B: 2.84, DK: 1.06, TIP: 1.63, MULT: [0.24, 0.52, 0.75, 0.91, 0.99, 1, 0.99, 0.91, 0.75, 0.52, 0.24] };
function hullMult(x) {
  const ax = Math.abs(x);
  if (ax >= 4) return lerp(0.24, 0.05, clamp((ax - 4) / 0.3));
  const f = (x + 4) / 0.8, i = Math.min(9, Math.floor(f)), t = f - i, a = BG.MULT[Math.max(0, i - 1)], b = BG.MULT[i], c = BG.MULT[i + 1], d = BG.MULT[Math.min(10, i + 2)];
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
}
const hullB = (x) => (BG.B / 2) * hullMult(x);                                   // half beam at the gunwale
const hullTop = (x) => BG.DK + (BG.TIP - BG.DK) * Math.pow(Math.abs(x) / 4.3, 2.6);   // gunwale height
const hullKeel = (x) => 0.38 * Math.pow(Math.abs(x) / 4.3, 2.5);
const SB = 0.3;   // the section's bottom share
// a hull cross-section: s 0..1 from the keel centre to the gunwale: (z, y)
function hullSec(x, s) {
  const b = hullB(x), H = hullTop(x), yk = hullKeel(x), yb = yk + 0.08;
  if (s <= SB) { const t = s / SB; return [0.54 * b * t, yk + 0.08 * t * t]; }
  const t = (s - SB) / (1 - SB); return [0.54 * b + 0.46 * b * Math.pow(t, 0.72), yb + (H - yb) * t];
}
// a point on the hull surface (+side z positive), pushed off the surface by `off`
function hullPos(x, s, side, off = 0) {
  const e = 1e-3, [z, y] = hullSec(x, s), [z2, y2] = hullSec(x, Math.min(1, s + e)), [z1, y1] = hullSec(x, Math.max(0, s - e));
  let tz = z2 - z1, ty = y2 - y1; const l = Math.hypot(tz, ty) || 1; tz /= l; ty /= l;
  return V3(x, y - tz * off, side * (z + ty * off));   // outward normal in (z, y) = (ty, -tz)
}
const sOfY = (x, y) => { const yb = hullKeel(x) + 0.08, H = hullTop(x); return SB + (1 - SB) * clamp((y - yb) / (H - yb)); };
const OARX = [-3, -2.2, 2, 2.8], BOXC = [0.32, 1.08, 0];

// the hull: 9 strakes a side with .028 seams, the bottom .54 of the top width, 11 loft stations
const STR = 9;
function hullRows() {
  const rows = [], g = 0.022;
  const side = [];
  for (let i = 0; i < 6; i++) side.push({ s: (SB * i) / 6, off: 0, j: -1 });
  for (let j = 0; j < STR; j++) {
    const a = j / STR, b = (j + 1) / STR;
    side.push({ t: j ? a + g / 2 : 0, off: j ? 0.002 : 0, j }, { t: (j + 0.5) / STR, off: 0.006, j }, { t: j === STR - 1 ? 1 : b - g / 2, off: j === STR - 1 ? 0 : 0.002, j });
    if (j < STR - 1) side.push({ t: b, off: -0.012, j: -2 });
  }
  for (const r of side) if (r.t !== undefined) r.s = SB + (1 - SB) * r.t;
  for (let i = side.length - 1; i >= 1; i--) rows.push({ ...side[i], side: -1 });
  for (let i = 0; i < side.length; i++) rows.push({ ...side[i], side: 1 });
  return rows;
}
function hullTex() {
  return once("eg-barge-hull", () => {
    const W = 2048, H = 1024, [c, g] = canvas(W, H);
    g.fillStyle = "#efe4d8"; g.fillRect(0, 0, W, H); g.lineCap = "round";
    for (const sd of [-1, 1]) for (let j = 0; j < STR; j++) {
      const t0 = SB + (1 - SB) * (j / STR), t1 = SB + (1 - SB) * ((j + 1) / STR), v0 = 0.5 + sd * 0.5 * t0, v1 = 0.5 + sd * 0.5 * t1, ya = Math.min(v0, v1) * H, yb = Math.max(v0, v1) * H, hh = yb - ya, k = j + 9 * (sd + 1);
      for (let i = 0; i < 70; i++) { const x = q(i, k) * W, y = ya + hh * (0.08 + 0.84 * q(i, k + 7)), l = 40 + 230 * q(i, k + 11); g.strokeStyle = q(i, k + 5) > 0.35 ? "#8a7260" : "#fffaf2"; g.globalAlpha = 0.12 + 0.35 * q(i, k + 13); g.lineWidth = 0.8 + 2.2 * q(i, k + 17); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + (q(i, k + 3) - 0.5) * 5, x + l, y + (q(i, k + 19) - 0.5) * 4); g.stroke(); }
      for (let m = 0; m < 6; m++) {   // butt joints, staggered, with two nail dots
        const x = ((m + q(m, k + 21) * 0.8) / 6) * W + (j % 2) * 120;
        g.globalAlpha = 0.7; g.strokeStyle = "#5a4636"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, ya + 2); g.lineTo(x + (q(m, k + 23) - 0.5) * 3, yb - 2); g.stroke();
        for (const dy of [0.25, 0.75]) { g.fillStyle = "#3d2c22"; g.globalAlpha = 0.8; g.beginPath(); g.arc(x + 9, ya + hh * dy, 1.8, 0, TAU); g.fill(); }
      }
      for (let n = 0; n < 2; n++) { const x = q(n, k + 31) * W, y = ya + hh * (0.2 + 0.6 * q(n, k + 32)); g.globalAlpha = 0.5; g.strokeStyle = "#4f3a2c"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, 7 + 5 * q(n, k + 33), 3 + 2 * q(n, k + 34), 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(x, y, 3, 1.4, 0, 0, TAU); g.stroke(); }   // knots
    }
    g.globalAlpha = 1; return tex(c);
  });
}
function deckTex() {
  return once("eg-barge-deck", () => {
    const W = 2048, H = 512, [c, g] = canvas(W, H);
    g.fillStyle = "#f2e6d4"; g.fillRect(0, 0, W, H); g.lineCap = "round";
    for (let p = 0; p < 8; p++) {
      const ya = (p / 8) * H, hp = H / 8;
      g.fillStyle = p % 2 ? "#e9d9c0" : "#f6ead6"; g.globalAlpha = 0.5; g.fillRect(0, ya, W, hp);
      for (let sgm = 0; sgm < 4; sgm++) {   // each plank in butt-jointed lengths, five grain strokes each (.08-.46 m)
        const x0 = ((sgm + 0.3 * q(p, sgm + 3)) / 4) * W, k = p * 4 + sgm;
        g.globalAlpha = 0.65; g.strokeStyle = "#5a4636"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, ya + 1); g.lineTo(x0, ya + hp - 1); g.stroke();
        for (let i = 0; i < 5; i++) { const x = x0 + 20 + q(i, k) * 330, y = ya + hp * (0.12 + 0.76 * q(i, k + 7)), l = 19 + 91 * q(i, k + 11); g.globalAlpha = 0.45; g.strokeStyle = i % 2 ? "#7a5c44" : "#fffaf0"; g.lineWidth = 1.2 + 1.6 * q(i, k + 13); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (q(i, k + 15) - 0.5) * 3); g.stroke(); }
      }
      g.globalAlpha = 0.8; g.strokeStyle = "#4a3224"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, ya); g.lineTo(W, ya); g.stroke();
    }
    for (let i = 0; i < 18; i++) { const x = q(i, 61) * W, y = (0.05 + 0.9 * q(i, 62)) * H; g.globalAlpha = 0.9; g.fillStyle = "#4a3224"; g.beginPath(); g.arc(x, y, 3.6, 0, TAU); g.fill(); g.fillStyle = "#fffaf0"; g.globalAlpha = 0.5; g.beginPath(); g.arc(x - 1, y - 1, 1.4, 0, TAU); g.fill(); }   // 18 dowels O.015
    for (const ox of OARX) for (const sd of [0.12, 0.88]) { g.globalAlpha = 0.22; g.fillStyle = "#fff6e0"; g.beginPath(); g.ellipse(((ox + 4.15) / 8.3) * W, sd * H, 56, 26, 0, 0, TAU); g.fill(); }   // worn where the rowers sit
    g.globalAlpha = 1; return tex(c);
  });
}
function graniteTex(key, k0) {
  return once(key, () => {
    const W = 1024, [c, g] = canvas(W, W), gr = g.createLinearGradient(0, 0, W, W);
    gr.addColorStop(0, "#2a2c33"); gr.addColorStop(0.5, "#22242A"); gr.addColorStop(1, "#16181e"); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 160; i++) {   // 160 mineral marks O.002-.014 (the face is ~2.2 m: 465 px/m)
      const x = q(i, k0) * W, y = q(i, k0 + 7) * W, r = (0.002 + 0.012 * q(i, k0 + 11)) * 465 * 0.5 + 0.8, t = q(i, k0 + 13);
      g.fillStyle = t > 0.6 ? "#A08668" : t > 0.25 ? "#646873" : "#C8D6DE"; g.globalAlpha = 0.33 + 0.45 * q(i, k0 + 17); g.beginPath(); g.ellipse(x, y, r * (1 + q(i, k0 + 2)), r, q(i, k0 + 3) * 3, 0, TAU); g.fill();
    }
    for (let i = 0; i < 8; i++) { const x = q(i, k0 + 41) * W, y = q(i, k0 + 42) * W, l = (0.08 + 0.19 * q(i, k0 + 43)) * 465; g.globalAlpha = 0.16; g.strokeStyle = "#c8d6de"; g.lineWidth = 1 + 0.5 * q(i, k0 + 44); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (q(i, k0 + 45) - 0.5) * 30); g.stroke(); }
    g.globalAlpha = 1; return tex(c);
  });
}
function sailTex() {
  return once("eg-barge-sail", () => {
    const W = 1024, [c, g] = canvas(W, W);
    g.fillStyle = "#f0e2c8"; g.fillRect(0, 0, W, W); g.lineCap = "round";
    for (let p = 0; p < 8; p++) {
      g.fillStyle = p % 2 ? "#d9c4a0" : "#f4e7cf"; g.globalAlpha = 0.5; g.fillRect((p / 8) * W, 0, W / 8, W);
      for (let i = 0; i < 70; i++) { const x = (p / 8 + q(i, p) / 8) * W, y = q(i, p + 7) * W, l = 14 + 70 * q(i, p + 11); g.globalAlpha = 0.1 + 0.25 * q(i, p + 13); g.strokeStyle = q(i, p + 5) > 0.5 ? "#8a6f48" : "#fffaf0"; g.lineWidth = 1 + 1.4 * q(i, p + 17); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (q(i, p + 19) - 0.5) * 6, y + l); g.stroke(); }
      g.globalAlpha = 0.7; g.strokeStyle = "#6a5236"; g.lineWidth = 1.5; for (let s = 0; s < 52; s++) { const y = (s / 52) * W + 3, x = (p / 8) * W + 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); }   // stitches along the seam
    }
    for (let i = 0; i < 14; i++) { const x = q(i, 71) * W, y = q(i, 72) * W; g.globalAlpha = 0.1; g.fillStyle = "#8a6f48"; g.beginPath(); g.ellipse(x, y, 30 + 60 * q(i, 73), 10 + 20 * q(i, 74), q(i, 75), 0, TAU); g.fill(); }
    g.globalAlpha = 1; return tex(c);
  });
}
const matTone = (i, k) => 0.9 + 0.22 * q(i, k);
// a bar between two points
function bar(A, p0, p1, w, h, colour, tone = 1) {
  const d = p1.clone().sub(p0), len = d.length(), qn = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), d.clone().normalize());
  A.push(UBOX, new THREE.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), qn, V3(len, h, w)), colour, tone);
}
// three-strand rope along points
function ropeAcc(A, pts, r, k) {
  const curve = new THREE.CatmullRomCurve3(pts), N = Math.max(40, Math.round(curve.getLength() * 40)), fr = curve.computeFrenetFrames(N, false);
  for (let s = 0; s < 3; s++) {
    const sp = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = curve.getPointAt(t), a = (s / 3) * TAU + t * curve.getLength() * 16, h = r * 0.55; sp.push(p.clone().addScaledVector(fr.normals[i], Math.cos(a) * h).addScaledVector(fr.binormals[i], Math.sin(a) * h)); }
    A.push(tubeGeo(sp, () => r * 0.58, 5, (t) => (Math.floor(t * 60 + s * 7) % 2 ? "#BB985C" : "#715333")), new THREE.Matrix4(), "#fff", 1);
  }
}
function bargeOar(parent, blade, bl, shaftBack, length) {   // an oar along +z about the pivot: loom back .42, blade at the outboard end
  const A = new Acc(), shaft = length - bl;
  A.push(new THREE.CylinderGeometry(0.0215, 0.0215, shaft + shaftBack, 10), M4(0, 0, (shaft - shaftBack) / 2, Math.PI / 2), (x, y, z) => col("#AB7850", 0.92 + 0.14 * q(Math.floor(z * 20) + 5, 2)), 1);
  A.push(new THREE.SphereGeometry(0.03, 8, 6), M4(0, 0, -shaftBack, 0, 0, 0, 1, 1, 1.5), "#8a5f3a", 1);   // the handle knob
  A.push(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), M4(0, 0, 0.02, Math.PI / 2), "#6a4a34", 1);   // the leather sleeve at the thole pins
  const hw = blade / 2, z0 = shaft;
  A.plate([[-0.03, 0], [0.03, 0], [hw, 0.07], [hw * 0.97, bl * 0.7], [hw * 0.55, bl], [-hw * 0.55, bl], [-hw * 0.97, bl * 0.7], [-hw, 0.07]].map(([u, v]) => [u, v]), V3(0, 0.011, z0), V3(1, 0, 0), V3(0, 0, 1), 0.022, "#C9A36E", 1);
  A.box(0, 0, z0 + bl * 0.9, hw * 1.3, 0.026, 0.05, "#DCA83B", 1); A.box(0, 0, z0 + 0.04, 0.02, 0.026, bl * 0.9, "#9a7048", 1);
  const m = vmat({ roughness: 0.75 }); const o = mesh(A.geo(), m, parent); return o;
}
function nilebarge(P) {
  const S = P.spec, pivot = new THREE.Group(), root = new THREE.Group(); P.whole.add(pivot); pivot.position.y = 0.42; pivot.add(root); root.position.y = -0.42;
  const DK = BG.DK, A = new Acc(), D = new Acc();
  // --- hull skin (double-sided: the bulwark ends show their inner face)
  const rows = hullRows(), NX = 64, X0 = -4.3;
  const hull = grid(NX, rows.length - 1, (u, v) => { const r = rows[Math.round(v * (rows.length - 1))], x = X0 + u * 8.6; return hullPos(x, r.s, r.side, r.off).toArray(); },
    (u, v, p) => {
      const r = rows[Math.round(v * (rows.length - 1))], strake = r.j, x = p[0], seg = Math.floor((x + 4.3 + (strake % 3) * 0.5) / (1.1 + 0.3 * q(strake, 3))), tone = 0.94 + 0.12 * q(seg + (r.side > 0 ? 40 : 0), Math.max(0, strake) + 5);
      let c = col(r.off < -0.005 ? "#4B2E25" : "#73452F", tone * (strake === -1 ? 0.9 : 1));
      const wet = sstep(0.56, 0.3, p[1]); c = c.lerp(col("#3a2a20"), wet * 0.62); const tide = Math.exp(-Math.pow((p[1] - 0.44) / 0.04, 2)); c = c.lerp(col("#b9a27a"), tide * 0.32);
      return c;
    }, V3(0, -1, 0));
  { const uv = hull.attributes.uv.array; for (let i = 0; i <= NX; i++) for (let j = 0; j < rows.length; j++) { const r = rows[j], k = i * rows.length + j; uv[k * 2] = i / NX; uv[k * 2 + 1] = 0.5 + r.side * 0.5 * r.s; } hull.attributes.uv.needsUpdate = true; }
  const hm = lined(mat("#ffffff", { vertexColors: true, map: hullTex(), roughness: 0.88, side: THREE.DoubleSide }), "#2c1a12"); const hullM = mesh(hull, hm, root); hullM.userData.solid = true;
  // gunwale caps, the stem and stern posts
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 40; i++) { const x = -4.28 + (8.56 * i) / 40; pts.push(V3(x, hullTop(x) + 0.02, sd * (hullB(x) + 0.012))); }
    A.push(tubeGeo(pts, () => 0.038, 7, (t) => col("#8a5a3a", 0.95 + 0.1 * q(Math.floor(t * 40), 3 + (sd > 0 ? 9 : 0)))), new THREE.Matrix4(), "#fff", 1);
  }
  const bowPost = [[-4.15, 1.2, 0], [-4.3, 1.55, 0], [-4.36, 1.78, 0]], stPost = [[4.15, 1.2, 0], [4.32, 1.6, 0], [4.18, 1.95, 0], [3.93, 2.02, 0]];
  A.push(tubeGeo(bowPost, () => 0.07, 8, () => "#8a5a3a"), new THREE.Matrix4(), "#fff", 1); A.push(new THREE.SphereGeometry(0.09, 10, 8), M4(-4.37, 1.82, 0, 0, 0, 0, 1, 1.2, 1), GOLD, 1);
  for (let i = 0; i < 3; i++) A.push(new THREE.TorusGeometry(0.075, 0.012, 5, 14), M4(-4.22 - i * 0.05, 1.3 + i * 0.17, 0, 0, Math.PI / 2), i % 2 ? "#BB985C" : "#715333", 1);
  A.push(tubeGeo(stPost, (t) => 0.07 - 0.03 * t, 8, (t) => (t > 0.85 ? GOLD : "#8a5a3a")), new THREE.Matrix4(), "#fff", 1);
  for (let i = 0; i < 4; i++) A.push(new THREE.TorusGeometry(0.07, 0.012, 5, 14), M4(4.17 + 0.02 * i, 1.28 + i * 0.16, 0, 0, Math.PI / 2), i % 2 ? "#BB985C" : "#715333", 1);
  // --- deck: an under plate and eight planks (grain and 18 dowels in the map)
  const BD = (x) => Math.max(0.02, hullB(x) - 0.035), DX = 4.1, dtex = deckTex(), dm = lined(mat("#ffffff", { vertexColors: true, map: dtex, roughness: 0.9 }), "#3a2418");
  const under = grid(40, 1, (u, v) => { const x = -DX + u * 2 * DX; return [x, DK - 0.03, (v * 2 - 1) * BD(x)]; }, () => "#4B2E25", V3(0, 1, 0)); mesh(under, vmat({ roughness: 1 }), root);
  for (let p = 0; p < 8; p++) {
    const hj = 0.004 * (q(p, 5) - 0.5), pg = grid(60, 1, (u, v) => { const x = -DX + u * 2 * DX, b = BD(x), za = b * (-1 + (2 * p) / 8) + 0.006, zb = b * (-1 + (2 * (p + 1)) / 8) - 0.006; return [x, DK + hj, lerp(za, zb, v)]; }, (u, v) => col("#B98458", 0.94 + 0.1 * q(p, Math.floor(u * 7) + 11)), V3(0, 1, 0));
    const uv = pg.attributes.uv.array; for (let i = 0; i <= 60; i++) for (let j = 0; j <= 1; j++) { const k = i * 2 + j, x = -DX + (i / 60) * 2 * DX; uv[k * 2] = (x + 4.15) / 8.3; uv[k * 2 + 1] = (p + j) / 8; } pg.attributes.uv.needsUpdate = true;
    const dmesh = mesh(pg, dm, root); dmesh.userData.solid = true; dmesh.castShadow = false;
  }
  // --- rail .36 high, 18 posts, gaps where the oars pass
  const postX = Array.from({ length: 9 }, (_, i) => -3.4 + 0.85 * i);
  for (const sd of [-1, 1]) {
    for (const x of postX) { const y0 = hullTop(x), z = sd * (hullB(x) - 0.06); A.box(x, y0 + 0.18, z, 0.057, 0.36, 0.062, "#9a6a44", 0.92 + 0.14 * q(Math.round(x * 10), sd + 3)); A.push(new THREE.TorusGeometry(0.036, 0.007, 4, 10), M4(x, y0 + 0.3, z, Math.PI / 2), "#BB985C", 1); }
    for (const [hh, th] of [[0.34, 0.04], [0.17, 0.032]]) for (let x = -3.45; x < 3.4; x += 0.1) {
      const xm = x + 0.05; if (OARX.some((o) => Math.abs(xm - o) < 0.2)) continue;
      const a = V3(x, hullTop(x) + hh, sd * (hullB(x) - 0.06)), b = V3(x + 0.1, hullTop(x + 0.1) + hh, sd * (hullB(x + 0.1) - 0.06)); bar(A, a, b, th, th, "#9a6a44", 0.92 + 0.14 * q(Math.round(x * 10), hh * 10));
    }
    for (const ox of OARX) for (const dx of [-0.085, 0.085]) A.box(ox + dx, hullTop(ox) + 0.1, sd * (hullB(ox) + 0.025), 0.03, 0.2, 0.03, "#6a4a34", 1);   // thole pins
  }
  // --- mast, yard, sail, sheets
  const mx = -1.9, mz = -0.31, my0 = DK, my1 = 4.79;
  A.push(tubeGeo([V3(mx, my0, mz), V3(mx, (my0 + my1) / 2, mz), V3(mx, my1, mz)], (t) => lerp(0.067, 0.05, t), 12, (t) => col("#9a6a44", 0.94 + 0.1 * q(Math.floor(t * 30), 8))), new THREE.Matrix4(), "#fff", 1);
  A.push(new THREE.SphereGeometry(0.06, 10, 8), M4(mx, my1 + 0.02, mz, 0, 0, 0, 1, 1.3, 1), GOLD, 1);
  A.box(mx, DK + 0.06, mz, 0.4, 0.12, 0.46, "#6a4a34", 1);
  const yardY = 4.59, yz = mz + 0.095;
  A.push(tubeGeo([V3(mx - 1.55, yardY, yz), V3(mx, yardY, yz), V3(mx + 1.55, yardY, yz)], (t) => 0.034 * (1 - 0.5 * Math.pow(Math.abs(t - 0.5) * 2, 3)) + 0.006, 8, () => "#a9794a"), new THREE.Matrix4(), "#fff", 1);
  for (let i = 0; i < 13; i++) { const x = mx - 1.35 + 0.225 * i; A.push(new THREE.TorusGeometry(0.04, 0.007, 4, 10), M4(x, yardY, yz, 0, Math.PI / 2), "#BB985C", 1); }
  for (let i = 0; i < 4; i++) A.push(new THREE.TorusGeometry(0.075, 0.011, 5, 12), M4(mx, yardY - 0.02 + i * 0.03, mz, Math.PI / 2), i % 2 ? "#BB985C" : "#715333", 1);
  const SW = 2.65, sail = grid(48, 20, (u, v) => {
    const pi = Math.min(7, Math.floor(u * 8)), lu = u * 8 - pi, puff = 0.012 * Math.sin(Math.PI * lu) * Math.sin(Math.PI * v), dent = -0.006 * Math.exp(-Math.pow(Math.min(lu, 1 - lu) / 0.03, 2)), belly = 0.24 * Math.pow(Math.sin(Math.PI * u), 0.9) * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * v)), 0.85);
    return [mx + (u - 0.5) * SW, yardY - 0.02 - v * SW, yz + 0.03 + belly + puff + dent];
  }, (u, v) => { const pi = Math.min(7, Math.floor(u * 8)); return col(v > 0.955 ? "#AB865E" : "#E3C392", (pi % 2 ? 0.95 : 1.04) * (0.96 + 0.08 * q(pi, 9)) * (u < 0.01 || u > 0.99 ? 0.8 : 1)); }, V3(0, 0, 1));
  { const uv = sail.attributes.uv.array; for (let i = 0; i <= 48; i++) for (let j = 0; j <= 20; j++) { const k = i * 21 + j; uv[k * 2] = i / 48; uv[k * 2 + 1] = j / 20; } sail.attributes.uv.needsUpdate = true; }
  const sm = lined(mat("#ffffff", { vertexColors: true, map: sailTex(), roughness: 0.95, side: THREE.DoubleSide }), "#7a5f3c"); mesh(sail, sm, root);
  ropeAcc(A, [V3(mx - SW / 2, yardY - SW, yz + 0.04), V3(mx - SW / 2 - 0.3, 2.9, yz + 0.1), V3(mx - SW / 2 - 0.5, DK + 0.4, 0.45), V3(mx - SW / 2 - 0.55, DK + 0.06, 0.7)], 0.011, 1);
  ropeAcc(A, [V3(mx + SW / 2, yardY - SW, yz + 0.04), V3(mx + SW / 2 + 0.05, 2.9, yz + 0.3), V3(mx + SW / 2 + 0.2, DK + 0.5, 0.55), V3(mx + SW / 2 + 0.25, DK + 0.06, 0.7)], 0.011, 2);
  // --- steering oar on an outrigger at the stern, x 3.63 z -1.05
  for (const bx of [3.43, 3.85]) bar(A, V3(bx, 1.34, -0.32), V3(bx, 1.4, -1.22), 0.07, 0.08, "#8a5a3a", 1);
  A.push(tubeGeo([V3(3.64, 1.38, -1.12), V3(3.64, 1.9, -1.12), V3(3.64, 2.38, -1.12)], () => 0.04, 8, () => "#8a5a3a"), new THREE.Matrix4(), "#fff", 1);
  for (let i = 0; i < 3; i++) A.push(new THREE.TorusGeometry(0.056, 0.011, 5, 12), M4(3.64, 2.0 + 0.045 * i, -1.12, Math.PI / 2), i % 2 ? "#BB985C" : "#715333", 1);
  { const T = V3(3.66, 2.55, -0.92), d = V3(0.116, -0.97, -0.213).normalize(), B = T.clone().addScaledVector(d, 2.42), qn = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), d), oa = new Acc();
    oa.push(new THREE.CylinderGeometry(0.0285, 0.0285, 2.42 - 0.51, 10), new THREE.Matrix4().compose(T.clone().addScaledVector(d, (2.42 - 0.51) / 2), new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d), V3(1, 1, 1)), "#AB7850", 1);
    oa.box(T.x, T.y, T.z, 0.42, 0.045, 0.045, "#8a5a3a", 1);
    const bp = new THREE.Matrix4().compose(T.clone().addScaledVector(d, 2.42 - 0.255), new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), d).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))), V3(1, 1, 1));
    oa.push(new THREE.BoxGeometry(0.2, 0.03, 0.51), bp, "#C9A36E", 1); void B; void qn;
    mesh(oa.geo(), vmat({ roughness: 0.8 }), root); }
  // --- the eye (wedjat) on the bow, both sides: gilt outline, lapis eye, brow, tear
  for (const sd of [-1, 1]) {
    const x = -3.58, s = sOfY(x, 0.98), O = hullPos(x, s, sd, 0.0), ux = hullPos(x + 0.06, s, sd).sub(hullPos(x - 0.06, s, sd)).normalize(), uw = hullPos(x, Math.min(1, s + 0.01), sd).sub(hullPos(x, s - 0.01, sd)).normalize();
    const U = ux.clone().multiplyScalar(sd < 0 ? -1 : 1), Wv = uw, mir = sd > 0 ? -1 : 1, sc = 0.28, P = (pts, c, d, l) => D.plate(pts.map(([a, b]) => [a * mir * sc, b * 0.18]), O, U, Wv, d, c, 1, l);
    const alm = [[-0.5, 0], [-0.3, 0.3], [0, 0.42], [0.3, 0.33], [0.5, 0.06], [0.3, -0.14], [0, -0.24], [-0.3, -0.16]], sm2 = alm.map(([a, b]) => [a * 0.82, b * 0.78 + 0.01]);
    P(alm, GOLD, 0.008, 0.002); P(sm2, LAPIS, 0.006, 0.01); P(circ(0.2, 10).map(([a, b]) => [a * 0.9 + 0.02, b * 1.1 + 0.09]), "#101830", 0.004, 0.016); P(circ(0.06, 6).map(([a, b]) => [a - 0.03, b + 0.16]), "#cfe0ee", 0.003, 0.02);
    P([[-0.52, 0.5], [0, 0.66], [0.56, 0.48], [0.56, 0.4], [0, 0.55], [-0.52, 0.4]], GOLD, 0.008, 0.002); P([[0.16, -0.3], [0.26, -0.3], [0.3, -0.86], [0.2, -0.86]], GOLD, 0.008, 0.002); P(circ(0.09, 8).map(([a, b]) => [a + 0.55, b - 0.5]), GOLD, 0.008, 0.002);
  }
  // --- cargo: the granite box, sleepers, mat and ropes
  if (S.cargo !== false) {
    const bx = BOXC[0], by = BOXC[1], gm = lined(mat("#ffffff", { map: graniteTex("eg-barge-granite-a", 3), roughness: 0.3 }), "#15161b"), gt = lined(mat("#ffffff", { map: graniteTex("eg-barge-granite-b", 91), roughness: 0.3 }), "#15161b");
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.48, 1.265), [gm, gm, gt, gm, gm, gm]); body.position.set(bx, by + 0.74, 0); body.castShadow = body.receiveShadow = true; body.userData.solid = true; root.add(body);
    const lid = new THREE.BoxGeometry(1, 1, 1), lp = lid.attributes.position; for (let i = 0; i < lp.count; i++) if (lp.getY(i) > 0) lp.setXYZ(i, lp.getX(i) * (1.98 / 2.2), lp.getY(i), lp.getZ(i) * (1.045 / 1.265)); lid.computeVertexNormals();
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.265), gt), l2 = new THREE.Mesh(lid, gt); l1.position.set(bx, by + 1.48 + 0.09 + 0.002, 0); l2.scale.set(2.2, 0.155, 1.265); l2.position.set(bx, by + 1.48 + 0.18 + 0.002 + 0.0775, 0);
    for (const m of [l1, l2]) { m.castShadow = m.receiveShadow = true; root.add(m); }
    for (const dx of [-0.8, 0.8]) A.box(bx + dx, DK + 0.01, 0, 0.12, 0.02, 1.1, "#8a5a3a", 1);   // sleepers under the box
    // the palm-leaf mat: 22 strips along X, 2.33 long, .061 wide, pitch .059, ends droop .14, frayed in three tips
    const topY = by + 1.815 + 0.012;
    for (let i = 0; i < 22; i++) {
      const zc = (i - 10.5) * 0.059 + (q(i, 3) - 0.5) * 0.008, wob = (q(i, 5) - 0.5) * 0.012, hj = 0.005 * q(i, 7);
      const gs = grid(26, 2, (u, v) => {
        const lx = (u - 0.5) * 2.33, ax = Math.abs(lx), z = zc + (v - 0.5) * 0.061 * (ax > 1.1 ? 1 - 0.5 * (ax - 1.1) / 0.065 : 1) + wob * Math.sin(u * 5 + i);
        let y = topY + hj + 0.004 * Math.sin(u * 17 + i * 2) * 1 - (ax > 0.99 ? 0.14 * Math.pow((ax - 0.99) / 0.175, 1.5) : 0); const az = Math.abs(z); if (az > 0.5225) y -= 0.1 * Math.pow((az - 0.5225) / 0.1, 1.4);
        return [bx + lx, y + (v === 1 ? 0.004 : 0), z];
      }, (u, v) => col("#AA9552", matTone(i, 11) * (Math.abs(v - 0.5) < 0.2 ? 0.86 : 1) * (0.94 + 0.1 * q(Math.floor(u * 26), i))), V3(0, 1, 0));
      A.push(gs, new THREE.Matrix4(), "#fff", 1);
      for (const e of [-1, 1]) for (let tpi = 0; tpi < 3; tpi++) {   // frayed tips
        const ex = bx + e * 1.165, ey = topY + hj - 0.14 + 0.0, a0 = V3(ex, ey + 0.012, zc + (tpi - 1) * 0.018), a1 = V3(ex, ey + 0.012, zc + (tpi - 0.5) * 0.018), a2 = V3(ex + e * (0.04 + 0.05 * q(i, tpi + e * 5)), ey - 0.05 - 0.03 * q(i, tpi + 13), zc + (tpi - 1) * 0.02 + (q(i, tpi + 17) - 0.5) * 0.02);
        A.tri(a0, a1, a2, col("#95804A", 0.9), col("#95804A", 0.9), col("#B8A468", 1));
      }
    }
    const TH = new Acc();   // dry palm fronds lying over the mat and drooping off its edges
    for (let i = 0; i < 9; i++) { const az = i * 2.39996 + 0.3, r = 0.2 + 0.25 * q(i, 3); frond(TH, V3(bx + Math.sin(az) * r * 1.4, topY + 0.03, Math.cos(az) * r * 0.9), az, 14 + 14 * q(i, 4), 1.0 + 0.25 * q(i, 5), 16, 1, true, 3, i + 30); }
    { const tmM = vmat({ roughness: 0.9, side: THREE.DoubleSide, lc: "#6a5a2c" }); tmM.userData.noOutline = true; mesh(TH.geo(), tmM, root).castShadow = true; }
    for (const [i, rx] of [-0.5, 0.05, 0.63, 1.18].entries()) {   // four O.035 ropes from deck eye to deck eye over the box
      const ez = 0.92;
      ropeAcc(A, [V3(rx, DK + 0.06, -ez), V3(rx, 1.5, -0.74), V3(rx, 1.9, -0.655), V3(rx, 2.3, -0.62), V3(rx, 2.5, -0.5), V3(rx, topY + 0.03, -0.25), V3(rx, topY + 0.032, 0.25), V3(rx, 2.5, 0.5), V3(rx, 2.3, 0.62), V3(rx, 1.9, 0.655), V3(rx, 1.5, 0.74), V3(rx, DK + 0.06, ez)], 0.0175, i);
      for (const sz of [-1, 1]) { A.push(new THREE.CylinderGeometry(0.03, 0.036, 0.12, 8), M4(rx, DK + 0.06, sz * ez), "#6a4a34", 1); for (let t = 0; t < 3; t++) A.push(new THREE.TorusGeometry(0.05, 0.0175, 5, 14), M4(rx, DK + 0.035 + 0.032 * t, sz * ez, Math.PI / 2), t % 2 ? "#BB985C" : "#715333", 1); }
    }
  }
  const am = vmat({ roughness: 0.85 }), amesh = mesh(A.geo(), am, root); amesh.userData.solid = true;
  decal(D.geo(), root, { roughness: 0.4, metalness: 0.15 });
  // --- waterline mark: a pale algae and tide line along the hull at local y .42
  { const W2 = new Acc(); for (const sd of [-1, 1]) { const pts = []; for (let x = -3.9; x <= 3.9; x += 0.15) { const yb = hullKeel(x) + 0.08; if (yb > 0.4) continue; pts.push(hullPos(x, sOfY(x, 0.43), sd, 0.012)); } for (let i = 0; i + 1 < pts.length; i++) W2.ribbon([pts[i], pts[i + 1]], 0.022, V3(0, 0, sd), "#cdbb8e", 0.9 + 0.2 * q(i, 3)); }
    if (!W2.empty) decal(W2.geo(), root, { roughness: 1 }); }
  // --- eight oars, both sides: sides group the pairs so row can drive their yaw and lift
  const oars = [];
  for (const sd of [-1, 1]) for (const ox of OARX) {
    const pz = sd * (hullB(ox) + 0.035), py = hullTop(ox) + 0.12, tilt = Math.asin(clamp((py - 0.36) / 1.485, 0, 0.95)), g = new THREE.Group();
    g.position.set(ox, py, pz); g.rotation.order = "YXZ"; root.add(g); const o = bargeOar(g, 0.16, 0.39, 0.42, 2.1); o.userData.solid = false;
    oars.push({ g, sd, tilt, ox });
  }
  // an oar drawn past the pivot: the +z oar's outboard end is +z; the -z oar is the same, turned half round
  const state = { row: -1, drift: -1, sway: -1 };
  const setRow = (row) => {
    const u = row * TAU;
    for (const o of oars) {
      const al = 18 * DEG * -Math.cos(u + (o.ox > 0 ? 0 : 0)), lift = 10 * DEG * Math.pow(Math.max(0, -Math.sin(u)), 0.7);
      o.g.rotation.y = o.sd > 0 ? al : Math.PI - al; o.g.rotation.x = o.tilt - lift; o.g.rotation.z = 0;
    }
  };
  setRow(clamp(S.row ?? 0));
  return {
    grip: 0,
    apply(ps, t) {
      const row = num(ps, S, "row", 0), dr = clamp(num(ps, S, "drift", 0)), sw = clamp(num(ps, S, "sway", 1));
      if (row !== state.row) { state.row = row; setRow(row); }
      pivot.position.x = 0.64 * dr; pivot.rotation.x = 1 * DEG * sw * Math.sin(TAU * ((t ?? 0) / 4.1) + 0.7);
    },
  };
}

// ================================================================================================================ nilebanks
function nilebanks(P) {
  const S = P.spec, sunset = S.sunset !== false, G = P.whole, tone = sunset ? new THREE.Color("#ffd9b6") : new THREE.Color("#ffffff"), hazeCol = sunset ? "#e7a58c" : "#cfe0ea";
  const fin = (c, z) => { const x = new THREE.Color(c).multiply(tone), hz = sunset ? clamp((Math.abs(z) - 20) / 140) * 0.55 : clamp((Math.abs(z) - 20) / 200) * 0.3; return hz ? x.lerp(col(hazeCol), hz) : x; };
  const BANKS = [{ z0: -29, dz: -1, k: 0 }, { z0: 34, dz: 1, k: 1 }];
  for (const B of BANKS) {
    const bank = grid(160, 26, (u, v) => {
      const x = -80 + u * 160, edge = 0.7 * Math.sin(x * 0.37 + B.k) + 0.45 * Math.sin(x * 1.13 + 2) + 0.2 * (q(Math.floor(x), 9) - 0.5), t = v, z = B.z0 + B.dz * (edge * (1 - v) * 0.9 + v * 13);
      const y = 0.04 + 1.06 * Math.pow(sstep(0, 1, t), 1.25) + 0.05 * (q(Math.floor(x * 0.7), Math.floor(t * 26) + B.k * 5) - 0.5) * sstep(0.1, 0.4, t);
      return [x, y, z];
    }, (u, v, p) => {
      const x = p[0], cell = q(Math.floor(x / 7), Math.floor(v * 7) + B.k * 11), cell2 = q(Math.floor(x / 2.2), Math.floor(v * 26) + 3);
      let c; if (v < 0.07) c = col("#896249", 0.9 + 0.2 * cell2); else if (v < 0.16) c = col(cell2 > 0.5 ? "#A1876B" : "#D6AE79", 0.95 + 0.1 * cell); else c = col(cell > 0.66 ? "#7B8545" : cell > 0.33 ? "#51653A" : "#B58B62", 0.9 + 0.2 * cell2);
      if (v >= 0.16 && Math.floor(x / 2.2) % 9 === 0) c.multiplyScalar(0.85);   // an irrigation line
      return fin(c, p[2]);
    }, V3(0, 1, 0));
    const bm = vmat({ roughness: 0.95 }); bm.userData.noOutline = true; const bmesh = mesh(bank, bm, G); bmesh.userData.solid = false; bmesh.castShadow = false;
    // the fields behind the bank, a flat green plain out to the town and hills
    const far = grid(40, 8, (u, v) => [-120 + u * 240, 1.1 + 0.06 * Math.sin(u * 40 + v * 3), B.z0 + B.dz * (13 + v * 60)], (u, v, p) => fin(col(q(Math.floor(u * 40), Math.floor(v * 8) + B.k) > 0.5 ? "#6f7f3c" : "#5c7036", 0.9 + 0.2 * q(Math.floor(u * 80), Math.floor(v * 16))), p[2]), V3(0, 1, 0));
    const fm = vmat({ roughness: 1 }); fm.userData.noOutline = true; const fmesh = mesh(far, fm, G); fmesh.userData.solid = false; fmesh.castShadow = false;
    // reed tufts along the water's edge, shrubs behind
    const R = new Acc();
    for (let i = 0; i < 110; i++) {
      const x = -79 + 1.45 * i + (q(i, 3 + B.k) - 0.5) * 1.1, z = B.z0 + B.dz * (0.6 + 1.5 * q(i, 5)), h = 0.8 + 0.7 * q(i, 7);
      for (let b = 0; b < 7; b++) { const a = q(b, i + 20) * TAU, lean = 0.2 + 0.3 * q(b, i + 30), base = V3(x + Math.cos(a) * 0.1, 0.2, z + Math.sin(a) * 0.1), tip = base.clone().add(V3(Math.cos(a) * lean, h * (0.7 + 0.3 * q(b, i + 40)), Math.sin(a) * lean)); const sd = V3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.025);
        R.tri(base.clone().add(sd), base.clone().sub(sd), tip, fin("#59702f", z), fin("#59702f", z), fin("#a2ae5c", z)); }
    }
    for (let i = 0; i < 44; i++) { const x = -78 + 3.6 * i + (q(i, 61) - 0.5) * 2, z = B.z0 + B.dz * (3.5 + 8 * q(i, 62)), r = 1 + 1.1 * q(i, 63); R.push(new THREE.SphereGeometry(1, 8, 6), M4(x, 1.3 + r * 0.55, z, 0, 0, 0, r * 1.2, r * 0.85, r * 1.2), (X, Y, Z) => fin(q(i, 64) > 0.5 ? "#3f5a2c" : "#4d6a31", z), 0.9 + 0.2 * q(i, 65)); }
    const rm = vmat({ roughness: 0.9, side: THREE.DoubleSide }); rm.userData.noOutline = true; const rmesh = mesh(R.geo(), rm, G); rmesh.userData.solid = false; rmesh.castShadow = false;
  }
  // palms: far 19, near 12
  const trunks = new Acc(), folia = new Acc();
  const far = Array.from({ length: 19 }, (_, i) => [-54 + 6 * i, -30 - 1.6 * q(i, 2), 3.2 + 1.5 * q(i, 3)]), near = Array.from({ length: 12 }, (_, i) => [-44 + 8 * i, 35 + 2 * q(i, 2), 3.2 + 1.5 * q(i, 3)]);
  const o = { sunset, tone, hazeColor: hazeCol };
  const add = (list, k0) => { for (const [i, [x, z, h]] of list.entries()) { const hz = sunset ? clamp((Math.abs(z) - 20) / 120) * 0.5 : clamp((Math.abs(z) - 20) / 160) * 0.3, { trunk, foliage } = palmParts(h, k0 + i, { blades: 12, rows: 36, cols: 10, dates: false, tone, haze: hz, hazeColor: hazeCol }), m = M4(x, 0.8 + 0.2 * q(i, 4), z, 0, q(i, 77) * TAU, 0); trunks.push(trunk, m, "#fff", 1); const fa = new Acc(); fa.p = foliage.p; fa.n = foliage.n; fa.c = foliage.c; folia.push(fa.geo(), m, "#fff", 1); } };
  void o; add(far, 100); add(near, 200);
  const tm = vmat({ roughness: 0.9 }); tm.userData.noOutline = true; mesh(trunks.geo(), tm, G).userData.solid = false;
  const fm2 = vmat({ roughness: 0.75, side: THREE.DoubleSide }); fm2.userData.noOutline = true; mesh(folia.geo(), fm2, G).userData.solid = false;
  // a hazy far town and the desert hills
  if (S.town !== false) {
    const T = new Acc();
    for (let i = 0; i < 14; i++) { const x = 26 + 3.2 * i + (q(i, 3) - 0.5) * 2, h = 3 + 6 * q(i, 4) * (i % 4 === 0 ? 1.6 : 1), w = 3 + 3 * q(i, 5), d = 3 + 2 * q(i, 6); T.box(x, h / 2 + 1.1, -66 - 4 * q(i, 7), w, h, d, fin(i % 3 ? "#D9A98B" : "#C98E78", -66), 0.92 + 0.16 * q(i, 8)); T.box(x, h + 1.25, -66 - 4 * q(i, 7), w + 0.3, 0.3, d + 0.3, fin("#B98166", -66), 1); }
    for (const x of [30.5, 36.5]) { T.box(x, 6, -61, 3.2, 12, 2.4, fin("#CFA086", -62)); T.box(x, 12.3, -61, 3.5, 0.5, 2.7, fin("#BA8368", -62)); }
    const hills = grid(60, 4, (u, v) => { const x = -240 + u * 480, h = (1.6 + 3.2 * Math.sin(x * 0.011 + 1) ** 2 + 1.4 * Math.sin(x * 0.04) ** 2) * (1 - v * 0.9); return [x, 1 + h * (v < 1 ? 1 : 0), -125 - v * 8]; }, (u, v, p) => fin(q(Math.floor(u * 60), v * 4) > 0.5 ? "#D1A183" : "#C69578", -125), V3(0, 0, 1));
    const tmm = vmat({ roughness: 1 }); tmm.userData.noOutline = true; mesh(T.geo(), tmm, G).userData.solid = false; const hm2 = vmat({ roughness: 1, side: THREE.DoubleSide }); hm2.userData.noOutline = true; mesh(hills, hm2, G).userData.solid = false;
  }
  // the sun track on the water: 19 crests per 6 m, .22-.82 long, alpha .45, width 3.20 at the start, widening with distance
  if (S.track !== false) {
    const [fx, fz] = S.trackFrom ?? [0.2, 10.9], az = (S.sunAz ?? 11) * DEG, z0 = fz - 1.5, z1 = -28, n = Math.round(((z0 - z1) / 6) * 19), pos = [], cl = [];
    for (let i = 0; i < n; i++) {
      const dd = (i + q(i, 2)) / n, z = lerp(z0, z1, dd), d = fz - z, w = 3.2 * (1 + d / 12), xc = fx + d * Math.tan(az), x = xc + (q(i, 3) - 0.5) * w, k = Math.abs(x - xc) / (w / 2);
      const len = (0.22 + 0.6 * q(i, 4)) * (1 + d / 18), th = 0.024 * (1 + d / 12) * (0.7 + 0.6 * q(i, 5)), a = Math.min(0.9, 0.45 * (1.3 + 0.5 * Math.min(1, d / 20)) * Math.pow(1 - k, 0.7) * (0.7 + 0.3 * q(i, 6))), c = col(q(i, 7) > 0.3 ? "#F9BE76" : "#E3A57F");
      // a crest: a flat lens, clear at both ends, strongest in the middle
      const P0 = [x - len / 2, z, 0], P1 = [x, z + th / 2, a], P2 = [x + len / 2, z, 0], P3 = [x, z - th / 2, a];
      for (const [A_, B_, C_] of [[P0, P1, P2], [P0, P2, P3]]) for (const pt of [A_, B_, C_]) { pos.push(pt[0], 0.02, pt[1]); cl.push(c.r, c.g, c.b, pt[2]); }
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(cl, 4));
    const tmt = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); tmt.userData.noOutline = true;
    const tr = steamy(new THREE.Mesh(tg, tmt), 2); tr.userData.solid = false; G.add(tr);
  }
  return { grip: 0 };
}

export const EG_PAST_KINDS = { memphiscourt, palm, apisbier, nilebarge, nilebanks };
export const EG_PAST_GRIPS = {};
