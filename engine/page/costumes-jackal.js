import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clothMat } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";

// Egypt myth 01 "Your heart vs. one feather", DESIGN section E (storyboards/series/egypt-myth/01-heart/DESIGN.md): THE JACKAL JUDGE.
// costume.jackal on Mash's body (characters/egypt-myth/jackal.json: costume { type: "mash", jackal: true }). castCostume
// (costumes-cast.js) calls jackal(C, ch, out) before every type; none of Mash's own costume (hoodie, headphones, trainers) is built.
// Everything is built once from the character's own surface (ch.surf / ch.face.place), every mark placed by hand or by index (hash2):
// no tiling, no random, no clock. Metres, body-local heights (y 0 = the base of the 1.24 body; world y = this + 0.14 legs).
//
// USAGE (costume keys; "jackal": true takes every default; a spec object overrides):
//   jackal.jaw       0..1   a hold on the lower jaw (opens up to 12 degrees); only read from st.jackal.jaw if a timeline action ever sets it
//   jackal.gold      "#e2b04a"   GOLD base (shade #9a6a1e, deep #6b4612, light #fff0b8: the palette of the DESIGN)
//   jackal.lapis     "#2b4fa2"   LAPIS base (shade #1c3470, light #5f86d6)
//   jackal.turq      "#3fa39a"   TURQUOISE base (shade #2a7069, light #7fd0c4)
//   jackal.linen     "#f3eee2"   kilt (folds #cfc7b4, the 3 deepest #a89f8c)
//   jackal.skin      "#d99d3d"   the golden torso skin between collar and belt (the character file's limbs.color is the same gold)
//   jackal.eyeU      0.72   the eyes' spread (the rig's layout, set here: the look's 0.39 put them 0.15 apart); eyeW 1.08 / eyeH 0.40 the
//                    almond's squash of the rig's round eye; eyeTilt 0.30 rad, the outer corner up
// The live jaw: the lower jaw hinges at the snout root and follows the rig's speech (the larger of the expression's `open` and st.talk,
// the very value the rig's own mouth uses) up to 12 degrees. The rig's mouth and eyes stay alive: the eyes blink and look as Mash's,
// the face layout puts them at eyeU 0.45 (characters/egypt-myth/jackal.json) so the gold rim lines clear each other.
// MEASURED ON THE RIG (face.place, the character's own face numbers): mouth point = place(0, mouthV); eye centre = place(+-eyeU, eyeV);
// every head part is shifted by (measured mouth y - the design's 0.57), the ears and body pieces are not.
// THE PIECES (every count of DESIGN E):
//   head      the body is #1b1a21 already, black only above the collar (the torso shell below it is gold skin); a soft blue sheen on the bridge
//             and brow; the rig's two eyes squashed to narrow almonds and tilted (apply, after the rig places them: its lids, blink and gaze
//             still drive them), each with a GOLD rim line 0.006, a kohl tail and an inner tick; the rig's brows are hidden.
//   snout     the main shape of the face: root at the brow (axis 0.05 under the eyes' centre), 0.15 wide x 0.27 high at the root (upper 0.15,
//             lower jaw 0.12), 0.34 long, sloping 7 degrees down, tip 0.07 x 0.07 (a long wedge in profile), a bridge ridge carries its top
//             line up the forehead so there is no step at the brow; lower jaw 0.30 long, under-jaw #2a2832, hinged at the root (rotation.x = jaw x 12 degrees);
//             nose pad r 0.028 #0d0c10 glossy with 2 comma nostrils and a highlight; a mouth line each side (it turns up at the
//             corner); 6 whisker dots a side. Inside the mouth #2a1015.
//   ears      roots (+-0.108, 1.16, -0.055), 0.40 tall, 0.105 wide, cupped (a shell, convex behind, concave in front), 8 degrees out,
//             9 back; tips at body-local 1.54 (world 1.68 = 1.65 Spuds). Inner stripe #c9962e with 5 fur strokes; a thin GOLD ring
//             on the LEFT ear's edge (character's left, +x) at 60 % up.
//   lappets   2 striped bands 0.10 wide (across the surface) from y 1.00 (behind the ears) to y 0.40, inner edge 0.03 outside the
//             eye rims (x about 0.24; the design says 0.12 from the centre, which would cross the eye), shoulders free; 20 stripes each at
//             0.03 pitch LAPIS / GOLD (40), a GOLD end bar.
//   collar    top edge y 0.47, 0.10 deep, bib to y 0.33 at the front: row 1 36 GOLD tube beads, row 2 32 LAPIS blocks, row 3 28
//             TURQUOISE blocks, row 4 a GOLD bar; 22 teardrop drops 0.022 LAPIS and GOLD alternating along the front; a counterweight
//             tab 0.05 x 0.10 at the back. Beads and blocks are spaced evenly along the row (arc length), each hand-varied.
//   belt      0.05 at y 0.27, GOLD, an oval LAPIS buckle 0.05 with a gold frame and a tied knot under it; a tab 0.06 x 0.22 down the
//             apron of 10 LAPIS / GOLD bars.
//   kilt      y 0.27 to 0.02, hem 1.10 x the radius at the belt, LINEN: 26 hand-varied pleats wrapping right over left (the overlap
//             edge shows), a rolled hem; a stiff front apron 0.16 wide at the belt, 0.24 at the hem, GOLD border 0.012, 7 GOLD
//             thread lines across, 14 fine pleat lines.
//   bands     armlets 0.03 long, 0.08 under the shoulder; wrist bands 0.035, ending 0.06 before the hand's centre; anklets 0.02;
//             GOLD with 2 engraved lines, worn at the edges; each armlet a LAPIS oval. Built on the live arm curve each frame (no
//             geometry rebuilt: the group is moved), so the pieces stay on the arm in every pose.
// GOLD LEAF: base #e2b04a, one long light band #fff0b8 on every round part, shade #9a6a1e in recesses, wear to bronze #6b4612
//   on about 8 % (the red bole #8a4a2a in 1 spot of 4); all baked into vertex colours from each piece's own frame.
// GESTURES (the director's arm poses, the costume stays clear in each; proof on the bench sheet):
//   hand on pillar, "pass" (left arm 60 degrees above level, 0.35 forward, palm flat to the cast) and "next" (left arm straight and
//   level at the heart pan, one finger out): see storyboards/series/egypt-myth/01-heart/bench/make-costumes-bench.mjs.
// ASSUMPTIONS the director may overrule: the lappets' inner edge (above), and the collar's side rows are left open where the arm leaves
//   the shoulder (the rig's shoulder joint is at body-local y 0.437, inside the collar band).

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const bump = (x) => (Math.abs(x) >= 1 ? 0 : Math.cos(x * Math.PI / 2) ** 2);
const col = (h) => new THREE.Color(h);

// a (nu+1) x (nv+1) grid of points, closed round in u (the last column meets the first with one normal)
function grid(nu, nv, at, closed = true) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) {
    const N = g.attributes.normal;
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  }
  return g;
}
// a brush stroke lying on a surface: centre points, the surface normal at each, a half width, tapering to a point at both ends
function ribbon(pts, nrm, W, heavy = 0.4) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    const u = i / n, w = W * (1 - heavy + heavy * u) * Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.92)), 0.55);
    pos.push(...p.clone().addScaledVector(side, -w).toArray(), ...p.clone().addScaledVector(side, w).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a band of constant half width W between two edges (square ends), for lines that must not taper (border lines, seams)
function strip(pts, nrm, W) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    pos.push(...p.clone().addScaledVector(side, -W).toArray(), ...p.clone().addScaledVector(side, W).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- vertex-coloured buckets: many small parts merged into one mesh per colour family
const bucket = () => ({ g: [] });
function put(b, geo, M, colorFn) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const n = g.attributes.normal, p = g.attributes.position, cols = new Float32Array(n.count * 3), v = V(0, 0, 0), q = V(0, 0, 0);
  for (let i = 0; i < n.count; i++) { v.fromBufferAttribute(n, i); q.fromBufferAttribute(p, i); const c = colorFn(v, q, i); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  if (M) g.applyMatrix4(M);
  b.g.push(g);
}
function flush(b, mat, parent, shadow = true) {
  if (!b.g.length) return null;
  const m = new THREE.Mesh(mergeGeometries(b.g), mat); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m;
}
const vmat = (o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: o.rough ?? 0.55, metalness: 0, side: o.side ?? (o.flat ? THREE.DoubleSide : THREE.FrontSide) });
  if (o.line) m.userData.lineColor = o.line;
  if (o.flat) { m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  if (o.role) m.userData.lookRole = o.role;
  return m;
};

export function jackal(C, ch, out) {
  const J = C.jackal === true ? {} : C.jackal || {}, parts = ch.potatoParts;
  const LOC = ch.cy - ch.ry;                                                   // bodyGroup y of body-local 0 (the legs' length)
  const phOf = (yl) => Math.asin(clamp((yl + LOC - ch.cy) / ch.ry, -0.995, 0.995));
  const surfAt = (th, yl) => ch.surf(th, phOf(yl));
  const root = new THREE.Group(); root.name = "jackal"; root.position.y = LOC; parts.add(root);   // body-local coordinates from here on
  // body-local surface point + outward normal (hang-flattened if flatN < 1), `off` m out
  const bp = (th, yl, off = 0, flatN = 1) => { const s = surfAt(th, yl), n = s.normal.clone(); n.y *= flatN; n.normalize(); const p = s.pos.clone().addScaledVector(n, off); p.y -= LOC; return { p, n }; };
  // the frame of a piece lying on the body at (th, yl): +z out, +y up, +x along the row (to the character's left at the front)
  const frame = (th, yl, off = 0, flatN = 0.4) => {
    const { p, n } = bp(th, yl, off, flatN), X = V(0, 1, 0).cross(n).normalize(), Y = n.clone().cross(X).normalize();
    return new THREE.Matrix4().makeBasis(X, Y, n).setPosition(p);
  };
  // th at which the surface is |x| from the middle, at height yl
  const thFor = (x, yl) => { const ph = phOf(yl); let lo = 0, hi = Math.PI / 2; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (ch.surf(m, ph).pos.x < x) lo = m; else hi = m; } return (lo + hi) / 2; };

  // ---- palette
  const GB = col(J.gold || "#e2b04a"), GS = col("#9a6a1e"), GD = col("#6b4612"), GL = col("#fff0b8"), GBOLE = col("#8a4a2a");
  const LB = col(J.lapis || "#2b4fa2"), LS = col("#1c3470"), LL = col("#5f86d6");
  const TB = col(J.turq || "#3fa39a"), TS = col("#2a7069"), TL = col("#7fd0c4");
  const LIN = col(J.linen || "#f3eee2"), LINF = col("#cfc7b4"), LIND = col("#a89f8c");
  const BLACK = col("#1b1a21"), MUZ = col("#22212b"), UNDER = col("#1d1c25"), NOSE = col("#0d0c10"), MOUTH = col("#2a1015"), SHEEN = col("#34406a");
  const _c = new THREE.Color();
  // GOLD LEAF from a piece's own frame (n: local normal, +z out, +y up): shade underneath and in recesses, one long light band, wear
  const gold = (n, wear = 0, bole = false) => {
    const k = sstep(-0.6, 0.45, n.y * 0.6 + n.z * 0.5), c = _c.copy(GS).lerp(GB, k);
    c.lerp(GL, sstep(0.76, 0.93, n.y * 0.55 + n.z * 0.83) * 0.92);
    if (wear > 0) c.lerp(bole ? GBOLE : GD, clamp(wear));
    return c.clone();
  };
  const faceCol = (base, light, shade) => (n) => _c.copy(n.y > 0.5 ? light : n.y < -0.5 ? shade : n.z > 0.5 ? base : shade).lerp(base, n.y < -0.5 || n.z > 0.5 || n.y > 0.5 ? 0 : 0.35).clone();
  const roundCol = (base, light, shade) => (n) => { const c = _c.copy(shade).lerp(base, sstep(-0.6, 0.4, n.y * 0.6 + n.z * 0.5)); c.lerp(light, sstep(0.78, 0.93, n.y * 0.55 + n.z * 0.83) * 0.7); return c.clone(); };

  const B = { gold: bucket(), lapis: bucket(), turq: bucket(), linen: bucket(), deco: bucket(), ink: bucket(), skin: bucket() };

  // ---- measure the rig
  const F = ch.face, L = F.layout, S0 = F.size;
  // the look's layout (castLook "sheet": eyeU 0.39) puts the eyes 0.15 apart, a potato's face; a jackal's sit wide, each flanking the muzzle root.
  // The face keeps this one object, so everything that reads it (eyes, brows, the QA's eye measures) follows. The rig's own mouth shrinks to a
  // dot under the muzzle (the costume draws the mouth).
  L.eyeU = J.eyeU ?? 0.72; L.mouthW = Math.min(L.mouthW, 0.05);
  const EYE = { sx: J.eyeW ?? 1.08, sy: J.eyeH ?? 0.4, tilt: J.eyeTilt ?? 0.3 };   // the rig's round eye, squashed to an almond and turned: outer corner up
  const mouthP = F.place(0, L.mouthV).pos.clone(); mouthP.y -= LOC;
  const dHead = mouthP.y - 0.57;   // every head part moves by this (the design assumed mouth 0.57, eyes 0.72)
  const eyeC = [-1, 1].map((sd) => { const q = F.place(sd * L.eyeU, L.eyeV); return { p: q.pos.clone().setY(q.pos.y - LOC), n: q.normal.clone(), sd }; });

  // ================================================================ EARS
  {
    const H = 0.40, W = 0.105, nu = 14, nv = 22;
    const wAt = (v) => W * Math.pow(Math.max(0, 1 - Math.pow(v, 2.3)), 0.62);
    const bulge = (s, v) => 0.030 * Math.pow(Math.max(0, 1 - s * s), 0.85) * (1 - 0.4 * v);
    const zOf = (s, v, front) => -bulge(s, v) + 0.034 * v * v + (front ? 0.004 + 0.012 * (1 - s * s) * (1 - v) : 0);
    const earGeo = (front) => grid(nu, nv, (u, v) => { const s = u * 2 - 1; return V(s * wAt(v) / 2, -0.02 + v * H, zOf(s, v, front)); }, false);
    const earM = new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.7, side: THREE.DoubleSide });
    // the ear's stripe and fur strokes on the front (concave) face
    const front = (s, v, lift = 0.0016) => { const x = s * wAt(v) / 2, y = -0.02 + v * H, z = zOf(s, v, true) + lift; return V(x, y, z); };
    const nrmF = V(0, 0.15, 1).normalize();
    for (const sg of [-1, 1]) {
      const g = new THREE.Group(); g.name = sg < 0 ? "jackal-ear-R" : "jackal-ear-L"; root.add(g);
      const a = new THREE.Mesh(earGeo(false), earM), b = new THREE.Mesh(earGeo(true), earM); a.castShadow = b.castShadow = true; g.add(a, b);
      // the rim: the two shells meet at the edge
      // inner stripe #c9962e: a pointed leaf from 12 % to 82 % up, then 5 fur strokes
      const stripe = [], sn = [];
      for (let i = 0; i <= 16; i++) { const v = 0.1 + 0.72 * (i / 16); stripe.push(front(0.02 * Math.sin(i * 0.5), v, 0.0022)); sn.push(nrmF); }
      const gm = vmat({ flat: true });
      const decoLocal = bucket();
      put(decoLocal, ribbon(stripe, sn, 0.021, 0.2), null, () => col("#c9962e"));
      // 5 fur strokes along the stripe, each its own length and lean (darker gold, hand-placed)
      const fur = [[-0.16, 0.2, 0.22, 0.05], [0.14, 0.28, 0.2, -0.06], [-0.12, 0.42, 0.2, 0.06], [0.16, 0.5, 0.18, -0.05], [-0.04, 0.6, 0.16, 0.04]];
      fur.forEach(([s0, v0, len, lean], k) => {
        const pts = [], ns = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(front(s0 + lean * 3 * t + 0.06 * Math.sin(t * 2.4 + k) * (s0 > 0 ? 1 : -1), v0 + len * t, 0.0034)); ns.push(nrmF); }
        put(decoLocal, ribbon(pts, ns, 0.0042, 0.5), null, () => col("#7a5412"));
      });
      const dm = flush(decoLocal, gm, g, false);
      // a thin GOLD ring through the LEFT ear's rim (the character's left is +x) at 60 % up
      if (sg > 0) {
        const v = 0.6, e = V(wAt(v) / 2, -0.02 + v * H, zOf(1, v, true) - 0.002);
        const ring = new THREE.TorusGeometry(0.0165, 0.0038, 8, 24); ring.rotateX(Math.PI / 2);
        const gl = bucket(); const M = new THREE.Matrix4().setPosition(e.x - 0.003, e.y, e.z); put(gl, ring, M, (n) => gold(V(n.x, n.z, n.y).normalize(), 0.12 * hs(7, 1)));
        flush(gl, vmat({ line: "#5a3c10" }), g);
      }
      g.position.set(sg * 0.108, 1.16, -0.055);
      g.rotation.set(-9 * Math.PI / 180, 0, -sg * 8 * Math.PI / 180, "ZXY");
      void dm;
    }
  }

  // ================================================================ SNOUT
  const snout = new THREE.Group(); snout.name = "jackal-snout"; root.add(snout);
  snout.position.set(0, eyeC[0].p.y - 0.05, mouthP.z - 0.012);   // the axis 0.05 under the eyes' centre: the muzzle's top starts at the brow (0.10 over the eyes' centre), its jaw ends over the collar
  snout.rotation.x = 7 * Math.PI / 180;                 // sloping 8 degrees down
  const jawPivot = new THREE.Group(); jawPivot.name = "jackal-jaw"; snout.add(jawPivot);
  const SB = { deco: bucket(), ink: bucket() };   // marks in the snout's own frame
  const SN = { w0: 0.15, h0: 0.27, w1: 0.07, h1: 0.07, L: 0.34, LJ: 0.30, back: 0.10, n: 2.6 };
  const hw = (t) => 0.5 * lerp(SN.w0, SN.w1, Math.pow(clamp(t), 0.9));
  const hh = (t) => lerp(SN.h0, SN.h1, Math.pow(clamp(t), 0.9));
  const se = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);
  // one half of the muzzle: upper (a over the top) or lower jaw (a under the chin), loft of NR rings + a rounded cap
  function muzzle(upper) {
    const Ln = upper ? SN.L : SN.LJ, NRt = 15, CAP = 4, NA = 26, NF = 5, nu = NA + NF;   // columns: NA arc points + NF floor points, then the closing copy of column 0
    const rings = [];
    for (let j = 0; j <= NRt; j++) { const t = lerp(-SN.back / Ln, 1, j / NRt); rings.push({ z: t * Ln, tt: Math.max(0, t) * (Ln / SN.L), k: 1 }); }
    for (let c = 1; c <= CAP; c++) { const ps = (c / CAP) * Math.PI / 2; rings.push({ z: Ln + 0.022 * Math.sin(ps), tt: Ln / SN.L, k: Math.cos(ps) }); }
    const nv = rings.length - 1, share = upper ? 0.56 : 0.44, jw = upper ? 1 : 0.94, sag = upper ? 1 : 0.95;
    const colOf = (c) => (c >= NA && c < nu ? "floor" : "side");
    const at = (u, v) => {
      const c = Math.round(u * nu) % (nu), r = rings[Math.round(v * nv)];
      const w = hw(r.tt) * jw * r.k, hgt = hh(r.tt) * share * sag * r.k;
      if (c < NA) { const a = (c / (NA - 1)) * Math.PI * (upper ? 1 : -1); return V(w * se(Math.cos(a), SN.n), (upper ? 1 : -1) * 0 + hgt * se(Math.sin(a), SN.n), r.z); }
      const f = (c - NA) / (NF - 1); return V(lerp(-w, w, f) * (upper ? 1 : 1), upper ? 0 : -0.0012, r.z);
    };
    const g = grid(nu, nv, at, true);
    const cols = new Float32Array((nu + 1) * (nv + 1) * 3);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const cc = colOf(i % nu === 0 && i === nu ? 0 : i), c = cc === "floor" ? MOUTH : upper ? MUZ : UNDER, k = (j * (nu + 1) + i) * 3; cols[k] = c.r; cols[k + 1] = c.g; cols[k + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }
  // the upper muzzle's cross-section points (for the dots and lines): ring at t (0..1), arc angle a (0 = the seam on the character's left (+x), PI/2 = top)
  const upPt = (t, a, off = 0.0015) => {
    const w = hw(t), hgt = hh(t) * 0.56, p = V(w * se(Math.cos(a), SN.n), hgt * se(Math.sin(a), SN.n), t * SN.L);
    const n = V(Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 2 - 2 / SN.n * 0 ) / Math.max(1e-3, w), Math.pow(Math.abs(Math.sin(a)), 1) / Math.max(1e-3, hgt), 0.15);
    n.set(p.x / (w * w), p.y / (hgt * hgt), 0.4 * (1 - t) * 0 + 0.12).normalize();
    return { p: p.addScaledVector(n, off), n };
  };
  {
    const um = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1, metalness: 0 }); um.userData.lookRole = "cloth"; um.userData.lineColor = "#08070c";   // matte: a glossy dark surface took the key light as a pale grey patch
    const upper = new THREE.Mesh(muzzle(true), um); upper.castShadow = true; snout.add(upper);
    const jaw = new THREE.Mesh(muzzle(false), um); jaw.castShadow = true; jawPivot.add(jaw);
    // sheen on the snout bridge: a thin blue band down the top line (the head's sheen continues onto the muzzle)
    const bpts = [], bn = [];
    for (let i = 0; i <= 12; i++) { const t = 0.02 + 0.5 * (i / 12), q = upPt(t, Math.PI / 2, 0.002); bpts.push(q.p); bn.push(q.n); }
    put(SB.deco, ribbon(bpts, bn, 0.0085, 0.5), null, () => SHEEN);
    // a mouth line along each side at the seam; it turns up at the corner
    for (const sg of [-1, 1]) {
      const pts = [], ns = [];
      for (let i = 0; i <= 18; i++) { const t = -0.05 + 0.93 * (i / 18), y = 0.016 * Math.pow(1 - clamp(t / 0.5), 2) + 0.001; pts.push(V(sg * (hw(Math.max(0, t)) + 0.0008), y, t * SN.L)); ns.push(V(sg, 0, 0)); }
      put(SB.ink, ribbon(pts, ns, 0.0026, 0.7), null, () => col("#5b5972"));
      // 6 whisker dots a side: two rows of three on the upper lip, each its own place (pale on the black)
      const rows = [[0.30, 0.42, 0.55, 0.28], [0.36, 0.5, 0.62, 0.62]];
      rows.forEach(([t0, t1, t2, a0], r) => [t0, t1, t2].forEach((t, k) => {
        const aa = (sg > 0 ? a0 : Math.PI - a0) + 0.05 * (hs(r * 3 + k + (sg > 0 ? 0 : 9), 4) - 0.5), q = upPt(t + 0.02 * (hs(r * 3 + k, 5) - 0.5), aa, 0.0016);
        const d = new THREE.CircleGeometry(0.0046 + 0.0008 * hs(r * 3 + k, 6), 12), M = new THREE.Matrix4().makeBasis(V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)).setPosition(q.p);
        d.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), q.n)); put(SB.deco, d, M, () => col("#6a6980"));
      }));
    }
    // nose pad r 0.028 #0d0c10, glossy, with 2 comma nostrils and a highlight
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.028, 24, 16), new THREE.MeshStandardMaterial({ color: NOSE, roughness: 0.12, metalness: 0 }));
    pad.scale.set(1.18, 0.82, 0.92); pad.position.set(0, 0.014, SN.L + 0.004); pad.castShadow = true; snout.add(pad); pad.userData.noPad = true;
    pad.material.userData.noOutline = true;
    for (const sg of [-1, 1]) {   // a comma: a head and a tail curving out and down, drawn on the pad's front
      const pts = [], ns = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8, a = (sg > 0 ? 0.5 : Math.PI - 0.5) - sg * t * 1.2, r = 0.0075 * (1 - 0.35 * t); pts.push(V(sg * 0.011 + Math.cos(a) * r * 0.9, 0.0145 - 0.002 + Math.sin(a) * r * 1.1 - 0.006 * t, SN.L + 0.004 + 0.028 * 0.92 * 0.99)); ns.push(V(0, 0, 1)); }
      put(SB.ink, ribbon(pts, ns, 0.0036, 0.9), null, () => col("#000000"));
      const rim = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = (sg > 0 ? 0.5 : Math.PI - 0.5) - sg * t * 1.2, r = 0.0105 * (1 - 0.3 * t); rim.push(V(sg * 0.011 + Math.cos(a) * r * 0.9, 0.0125 + Math.sin(a) * r * 1.1 - 0.007 * t, SN.L + 0.004 + 0.028 * 0.92 * 0.99 - 0.0004)); }
      put(SB.deco, ribbon(rim, rim.map(() => V(0, 0, 1)), 0.0014, 0.5), null, () => col("#2f2e3a"));
    }
    const hl = new THREE.CircleGeometry(0.0062, 14); hl.scale(1.5, 0.8, 1);
    put(SB.deco, hl, new THREE.Matrix4().makeRotationZ(0.5).setPosition(-0.013, 0.0245, SN.L + 0.004 + 0.0275), () => col("#ffffff"));
    snout.userData.pad = pad;
  }
  flush(SB.deco, vmat({ flat: true, rough: 0.8 }), snout, false); flush(SB.ink, vmat({ flat: true, rough: 1 }), snout, false);

  // ================================================================ EYES (the rig's, squashed to an almond and turned in apply) + their GOLD rims
  // the almond's half width a and half height b on the face, in metres (the rig's eye is 0.9 r wide and 0.9 r x oval tall, then EYE scales it)
  const eyeR = 0.08 * S0, eyeA = 0.9 * eyeR * EYE.sx, eyeB = 0.9 * eyeR * (F.eyeStyle.oval || 1) * EYE.sy;
  {
    const gl = bucket();
    for (const e of eyeC) {
      const o = F.place(e.sd * L.eyeU, L.eyeV).pos, d = 0.01, rot = e.sd * EYE.tilt, cr = Math.cos(rot), sr = Math.sin(rot);
      const su = F.place(e.sd * (L.eyeU + d), L.eyeV).pos.distanceTo(o) / d, sv = F.place(e.sd * L.eyeU, L.eyeV + d).pos.distanceTo(o) / d;
      // a point (x, y) metres in the eye's own frame (x toward the character's own left at +u), turned by the tilt, on the face lifted `lift`
      const at = (x, y, lift) => { const X = x * cr - y * sr, Y = x * sr + y * cr, q = F.place(e.sd * L.eyeU + X / su, L.eyeV + Y / sv), p = q.pos.clone().addScaledVector(q.normal, lift); p.y -= LOC; return { p, n: q.normal.clone() }; };
      const m = 0.0042, rx = eyeA + m, ry = eyeB + m;   // the rim ring sits just outside the squashed white
      const pts = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * TAU, ca = Math.cos(a), sa = Math.sin(a), pt = 1 + 0.16 * Math.pow(Math.abs(ca), 9);   // the corners are drawn out to a point
        pts.push(at(e.sd * rx * ca * pt, ry * sa * (sa > 0 ? 1 : 0.78), 0.0036).p);
      }
      const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.0031, 6, true);
      put(gl, rim, null, (n) => gold(V(0, n.y, Math.abs(n.z) + 0.2).normalize(), 0.0));
      // the kohl line's tail: from the outer corner out toward the ear, tapering to a point (the lappets take the rest)
      const tp = [], tn = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8, q = at(e.sd * (rx * 1.14 + 0.024 * t), ry * 0.1 + 0.012 * t * t + 0.0028 * Math.sin(t * 3), 0.0036); tp.push(q.p); tn.push(q.n); }
      put(gl, ribbon(tp, tn, 0.0034, 0.9), null, () => GB.clone().lerp(GL, 0.25));
      // the inner corner's short tick, toward the muzzle
      const ip = [], inn = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5, q = at(-e.sd * (rx * 1.14 + 0.012 * t), -ry * 0.2 - 0.008 * t, 0.0036); ip.push(q.p); inn.push(q.n); }
      put(gl, ribbon(ip, inn, 0.0026, 0.9), null, () => GB.clone().lerp(GL, 0.2));
    }
    flush(gl, vmat({ line: "#5a3c10", flat: true }), root, false);
  }
  // the bridge: the muzzle's top line carried up the forehead as a low ridge that fades out at the brow (no step where the muzzle starts),
  // a soft blue sheen on its crest and a thin sheen band on up to the crown
  {
    const Y0 = eyeC[0].p.y + 0.02, Y1 = 1.02;
    const ridge = grid(10, 16, (u, v) => {
      const yl = lerp(Y0, Y1, v), w = 0.07 * Math.pow(1 - v, 0.7) + 0.004, x = (u * 2 - 1) * w, th = Math.sign(x) * thFor(Math.abs(x), yl), k = 1 - (2 * u - 1) ** 2;
      return bp(th, yl, 0.026 * Math.pow(1 - v, 1.3) * Math.pow(k, 0.6) + 0.0012, 1).p;
    }, false);
    put(B.ink, ridge, null, (n, p) => { const v = clamp((p.y - Y0) / (Y1 - Y0)), c = _c.copy(MUZ).lerp(SHEEN, Math.exp(-((p.x / 0.016) ** 2)) * 0.75 * (1 - v)); return c.clone(); });
    const sp = [], sn = [];
    for (let i = 0; i <= 12; i++) { const yl = Y1 - 0.02 - (i / 12) * 0.0 + (i / 12) * 0.14, q = bp(0, 1.12 - (i / 12) * 0.1, 0.0025); void yl; sp.push(q.p); sn.push(q.n); }
    put(B.deco, ribbon(sp, sn, 0.022, 0.3), null, () => SHEEN);
  }

  // ================================================================ TORSO: the golden skin from the collar to the belt (the black is the head, above the collar)
  {
    const SK = col(J.skin || "#d99d3d"), SKS = col("#a96f22"), SKL = col("#f2c068"), Y0 = 0.225, Y1 = 0.462;
    const shell = grid(96, 12, (u, v) => bp(-Math.PI + u * TAU, lerp(Y0, Y1, v), 0.0045, 1).p);
    put(B.skin, shell, null, (n, p) => {
      const v = clamp((p.y - Y0) / (Y1 - Y0)), c = _c.copy(SK).lerp(SKS, 0.55 * (1 - sstep(-0.5, 0.35, n.y * 0.7 + n.z * 0.4))).lerp(SKS, 0.35 * sstep(0.8, 1, v));
      c.lerp(SKL, 0.45 * Math.exp(-(((n.x + 0.35) / 0.3) ** 2)) * sstep(0.1, 0.7, n.z));   // a soft light on the chest, upper left of the viewer
      return c.clone();
    });
  }

  // ================================================================ COLLAR
  {
    const TOP = 0.47, NB = 0.012;
    const dRow = [0.0125, 0.0405, 0.0685, 0.0925];
    const dip = (th) => 1 + 0.42 * bump(th / 1.35);   // the bib: rows spread toward the front, the lowest edge 0.33
    const rowY = (k) => (th) => TOP - dRow[k] * dip(th);
    // spread n elements evenly along a row by arc length: returns the angles
    const spread = (yAt, lift, n, phase = 0) => {
      const S = 360, cum = [0], ths = []; let prev = null;
      for (let i = 0; i <= S; i++) { const th = -Math.PI + (TAU * i) / S, p = bp(th, yAt(th), lift).p; if (prev) cum.push(cum[i - 1] + p.distanceTo(prev)); ths.push(th); prev = p; }
      const tot = cum[S], res = [];
      for (let k = 0; k < n; k++) { const s = (((k + 0.5 + phase) / n) % 1) * tot; let i = 1; while (i < S && cum[i] < s) i++; const f = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); res.push(lerp(ths[i - 1], ths[i], f)); }
      return { ths: res, pitch: tot / n };
    };
    // the arm leaves the shoulder inside the collar band: rows 2-4 are left open where the arm exits (|th| 1.38 +- 0.19, lower z half)
    const shoulderGap = (th) => Math.abs(Math.abs(th) - 1.38) < 0.19;
    // row 1: 36 GOLD tube beads (capsules lying along the row)
    {
      const r1 = spread(rowY(0), 0.016, 36), len = r1.pitch * 0.9;
      r1.ths.forEach((th, i) => {
        const y = rowY(0)(th), k = 0.96 + 0.08 * hs(i, 1), rr = 0.0078 * (0.95 + 0.1 * hs(i, 2));
        const cap = new THREE.CapsuleGeometry(rr, Math.max(0.004, len * k - 2 * rr), 3, 10); cap.rotateZ(Math.PI / 2);
        const M = frame(th, y + 0.001 * (hs(i, 3) - 0.5), 0.016).multiply(new THREE.Matrix4().makeRotationZ((hs(i, 4) - 0.5) * 0.05));
        const worn = hs(i, 5) < 0.08 ? 0.75 : 0, bole = hs(i, 6) < 0.25;
        put(B.gold, cap, M, (n) => gold(n, worn, bole));
      });
    }
    // rows 2 and 3: 32 LAPIS blocks, 28 TURQUOISE blocks
    const blocks = (k, n, bucketOf, base, light, shade, w, h, seed) => {
      const sp = spread(rowY(k), 0.0155, n, 0.25 * k);
      sp.ths.forEach((th, i) => {
        const y = rowY(k)(th), ww = Math.min(sp.pitch * 0.9, w) * (0.96 + 0.08 * hs(i + seed, 1)), hh2 = h * (0.95 + 0.1 * hs(i + seed, 2));
        if (shoulderGap(th) && Math.abs(th) > 0) { /* kept: arms are drawn through the gap by the rig's own order */ }
        const box = new THREE.BoxGeometry(ww, hh2, 0.011);
        const M = frame(th, y, 0.0155).multiply(new THREE.Matrix4().makeRotationZ((hs(i + seed, 3) - 0.5) * 0.06));
        put(bucketOf, box, M, faceCol(base, light, shade));
      });
    };
    blocks(1, 32, B.lapis, LB, LL, LS, 0.046, 0.024, 100);
    blocks(2, 28, B.turq, TB, TL, TS, 0.055, 0.024, 200);
    // row 4: a GOLD bar (a rounded strip all round), 2 engraved lines on it; a short lapis-free bar so the drops hang from it
    {
      const NU = 300, W = 0.0085, T = 0.007, lift = 0.0135;
      const g = grid(NU, 8, (u, v) => {
        const th = -Math.PI + u * TAU, a = v * TAU, cu = Math.cos(a), su = Math.sin(a), y = rowY(3)(th), fr = bp(th, y, 0, 0.4), up = V(0, 1, 0);
        const px = fr.p.clone().addScaledVector(up, se(cu, 2.8) * W).addScaledVector(fr.n, lift + T * 0.5 + se(su, 2.8) * T * 0.5 + 0.002); return px;
      });
      put(B.gold, g, null, (n, p, i) => { const wear = (Math.floor(i / 9) % 53) < 4 ? 0.7 : 0; return gold(n, wear, false); });
    }
    // 22 teardrop drops 0.022, LAPIS and GOLD alternating, hanging from the bar across the front
    {
      for (let i = 0; i < 22; i++) {
        const th = -1.5 + ((i + 0.5) / 22) * 3.0, y = rowY(3)(th) - 0.0085 - 0.0115;
        const prof = []; for (let k = 0; k <= 10; k++) { const t = k / 10, r = 0.0072 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.9) * (1 - 0.15 * t) + 0.0002; prof.push(new THREE.Vector2(r, (0.5 - t) * 0.022)); }
        const geo = new THREE.LatheGeometry(prof, 12), M = frame(th, y, 0.0165, 0.4);
        if (i % 2 === 0) put(B.lapis, geo, M, roundCol(LB, LL, LS)); else put(B.gold, geo, M, (n) => gold(n, 0));
      }
    }
    // the counterweight tab 0.05 x 0.10 at the back
    {
      const tab = new THREE.BoxGeometry(0.05, 0.10, 0.008), M = frame(Math.PI, 0.30, 0.02);
      put(B.gold, tab, M, (n) => gold(n, 0));
      const dot = new THREE.CylinderGeometry(0.011, 0.011, 0.004, 14); dot.rotateX(Math.PI / 2);
      put(B.lapis, dot, frame(Math.PI, 0.31, 0.0265), roundCol(LB, LL, LS));
      const cord = new THREE.CapsuleGeometry(0.0045, 0.03, 3, 8); cord.rotateZ(Math.PI / 2);
      put(B.gold, cord, frame(Math.PI, 0.357, 0.0185), (n) => gold(n, 0));
    }
  }

  // ================================================================ LAPPETS (2 striped bands, 20 stripes each, LAPIS / GOLD at 0.03 pitch)
  {
    const NS = 20, Y0 = 1.0, Y1 = 0.40, PITCH = (Y0 - Y1) / NS, WID = 0.10, XIN = Math.max(0.165, eyeC[1].p.x + eyeA * 1.14 + 0.03);
    for (const sg of [-1, 1]) {
      const edge = (yl) => {   // inner and outer angle: the inner edge at x XIN, the outer WID along the surface
        const ti = thFor(XIN, yl), ph = phOf(yl); let th = ti, run = 0, prev = ch.surf(th, ph).pos;
        while (run < WID * (0.55 + 0.45 * 1) && th < 1.3) { th += 0.01; const p = ch.surf(th, ph).pos; run += p.distanceTo(prev); prev = p; }
        return [ti, th];
      };
      for (let k = 0; k < NS; k++) {
        const gold1 = k % 2 === 1, ya = Y0 - k * PITCH, yb = ya - PITCH;
        const nv = 3, nu = 6;
        const g = grid(nu, nv, (u, v) => {
          const yl = lerp(ya, yb, v), taper = 0.5 + 0.5 * sstep(0, 0.1, (Y0 - yl) / (Y0 - Y1)), [ti, to] = edge(yl), mid = (ti + to) / 2, half = ((to - ti) / 2) * taper;
          const th = sg * (mid + (u * 2 - 1) * half), dome = 0.006 * (1 - (2 * u - 1) ** 2);
          return bp(th, yl, 0.034 + dome, 0.4).p;
        }, false);
        // across-colour: gold carries the long light band, lapis a paler centre
        put(gold1 ? B.gold : B.lapis, g, null, (n, p) => {
          const along = 0; void along;
          const sideN = V(n.x * sg, n.y, n.z), u = clamp(0.5 + sideN.x * 1.2);
          if (gold1) { const c = _c.copy(GB).lerp(GS, clamp(Math.abs(u - 0.5) * 1.6) * 0.5); c.lerp(GL, Math.exp(-(((u - 0.38) / 0.11) ** 2)) * 0.85); return c.clone(); }
          const c = _c.copy(LB).lerp(LS, clamp(Math.abs(u - 0.5) * 1.5) * 0.7); c.lerp(LL, Math.exp(-(((u - 0.4) / 0.14) ** 2)) * 0.45); return c.clone();
        });
      }
      // the GOLD end bar
      const yb0 = Y1 - 0.003, yb1 = Y1 - 0.016;
      const g = grid(6, 2, (u, v) => { const yl = lerp(yb0, yb1, v), [ti, to] = edge(Y1), th = sg * lerp(ti - 0.012, to + 0.012, u); return bp(th, yl, 0.036 + 0.004 * Math.sin(Math.PI * v), 0.4).p; }, false);
      put(B.gold, g, null, (n) => gold(V(0, n.y * 0.6 + 0.4, 0.8).normalize(), 0));
    }
  }

  // ================================================================ BELT (0.05 at y 0.27) and the kilt's apron tab
  {
    const YB = 0.27, W = 0.025, T = 0.012, lift = 0.0125;
    const g = grid(260, 10, (u, v) => {
      const th = -Math.PI + u * TAU, a = v * TAU, cu = Math.cos(a), su = Math.sin(a), fr = bp(th, YB, 0, 0.4);
      return fr.p.clone().addScaledVector(V(0, 1, 0), se(cu, 3.2) * W).addScaledVector(fr.n, lift + 0.0035 + T * 0.5 + se(su, 3.2) * T * 0.5);
    });
    put(B.gold, g, null, (n, p, i) => { const col2 = gold(n, 0); const ring = Math.floor(i / 11) % 11; if (ring === 2 || ring === 8) col2.lerp(GS, 0.45); const th = Math.atan2(p.x, p.z); if (hs(Math.floor((th + Math.PI) * 6), 9) < 0.08) col2.lerp(GD, 0.55); return col2; });
    // the oval LAPIS buckle 0.05 with a gold frame, front centre
    const M = frame(0, YB, lift + 0.011);
    const frameG = new THREE.TorusGeometry(0.0235, 0.0045, 8, 28); frameG.scale(1, 0.72, 0.6);
    put(B.gold, frameG, M, (n) => gold(n, 0));
    const lap = new THREE.SphereGeometry(0.02, 20, 14); lap.scale(1.15, 0.78, 0.4);
    put(B.lapis, lap, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.004)), roundCol(LB, LL, LS));
    // the tied knot under it (two loops and two tails, gold)
    const knotM = frame(0, 0.236, lift + 0.012);
    const ball = new THREE.SphereGeometry(0.0095, 12, 10);
    put(B.gold, ball, knotM, (n) => gold(n, 0));
    for (const sg of [-1, 1]) {
      const loop = new THREE.SphereGeometry(0.0085, 12, 10); loop.scale(1.35, 0.8, 0.8); loop.rotateZ(sg * 0.5);
      put(B.gold, loop, knotM.clone().multiply(new THREE.Matrix4().makeTranslation(sg * 0.014, 0.003, -0.001)), (n) => gold(n, 0));
      const tail = new THREE.CapsuleGeometry(0.0038, 0.022, 3, 8); tail.rotateZ(sg * 0.35);
      put(B.gold, tail, knotM.clone().multiply(new THREE.Matrix4().makeTranslation(sg * 0.007, -0.016, 0.0)), (n) => gold(n, 0));
    }
  }

  // ================================================================ KILT (LINEN), apron, tab
  {
    const KB = 0.27, KH = 0.02, FH = 1.10, NP = 26, BASEOFF = 0.011;
    const kPt = (th, yl, off = 0) => {
      const ylc = Math.max(yl, KB), s = surfAt(th, ylc), n = s.normal.clone(); n.y *= 0.4; n.normalize();
      const p = s.pos.clone().addScaledVector(n, BASEOFF + off);
      if (yl < KB) { const f = 1 + (FH - 1) * sstep(0, 1, (KB - yl) / (KB - KH)); p.x *= f; p.z *= f; p.y -= KB - yl; }
      p.y -= LOC; return { p, n };
    };
    // 26 hand-varied pleats: boundaries by cumulative hashed widths
    const wsum = []; { let a = 0; for (let j = 0; j < NP; j++) { a += 0.78 + 0.44 * hs(j, 1); wsum.push(a); } const k = TAU / a; for (let j = 0; j < NP; j++) wsum[j] *= k; }
    const PH = 0.37;
    const pleat = (th) => {
      let t = (((th + Math.PI + PH) % TAU) + TAU) % TAU, j = 0; while (j < NP - 1 && wsum[j] < t) j++;
      const a0 = j ? wsum[j - 1] : 0, f = (t - a0) / (wsum[j] - a0); return { j, f };
    };
    const amp = (j) => 0.0062 * (0.7 + 0.6 * hs(j, 2));
    const order = [...Array(NP).keys()].sort((a, b) => amp(b) - amp(a)), deep = new Set(order.slice(0, 3));
    const THe = (v) => 0.40 + 0.07 * v;                                   // the overlap edge, slanting outward to the hem
    const lap = (th, v) => 0.0095 * sstep(THe(v) + 0.02, THe(v) - 0.02, th) * sstep(-2.6, -1.9, th);   // right over left: the right panel is 0.0095 proud
    const NU = NP * 10, NV = 12;
    const geo = grid(NU, NV, (u, v) => {
      const th = -Math.PI + u * TAU, { j, f } = pleat(th), yl = lerp(KB, KH, v), hemWave = 0.004 * Math.sin(th * 5 + 0.7) + 0.003 * (hs(j, 7) - 0.5);
      const off = amp(j) * Math.pow(Math.sin(Math.PI * f), 0.7) * (0.35 + 0.65 * v) + lap(th, v);
      const y2 = yl + (v > 0.9 ? hemWave * sstep(0.9, 1, v) : 0);
      return kPt(th, y2, off).p;
    });
    put(B.linen, geo, null, (n, p, i) => {
      const u = (i % (NU + 1)) / NU, th = -Math.PI + u * TAU, { j, f } = pleat(th), v = Math.floor(i / (NU + 1)) / NV;
      const crease = 1 - sstep(0.0, 0.13, Math.min(f, 1 - f)), c = _c.copy(LIN);
      c.lerp(deep.has(j) ? LIND : LINF, crease * (0.55 + 0.35 * v) * (deep.has(j) ? 0.9 : 0.75));
      c.lerp(LINF, 0.12 * v * (0.5 + 0.5 * hs(j, 3)));
      return c.clone();
    });
    // the overlap edge: a shade line under it and a pale lip on it, slanting from the belt to the hem
    {
      const pts = [], ns = [], pts2 = [], ns2 = [];
      for (let i = 0; i <= 14; i++) { const v = i / 14, yl = lerp(KB - 0.004, KH + 0.012, v), th = THe(v) + 0.014; const a = kPt(th + 0.03, yl, 0.0004), b = kPt(th - 0.01, yl, 0.0105); pts.push(a.p); ns.push(a.n); pts2.push(b.p); ns2.push(b.n); }
      put(B.deco, strip(pts, ns, 0.0042), null, () => LIND);
      put(B.deco, strip(pts2, ns2, 0.0016), null, () => col("#ffffff"));
    }
    // the rolled hem: a tube 0.018 across along the hem
    {
      const pts = Array.from({ length: 120 }, (_, i) => { const th = -Math.PI + (i / 120) * TAU, { j } = pleat(th); return kPt(th, KH + 0.003 * Math.sin(th * 5 + 0.7) + 0.0015 * (hs(j, 7) - 0.5), 0.006 + amp(j) * 0.6).p; });
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.0085, 8, true);
      put(B.linen, tube, null, (n, p, i) => LIN.clone().lerp(LINF, 0.35 + 0.2 * Math.sin(i * 0.013)));
    }
    // the stiff front apron: 0.16 wide at the belt, 0.24 at the hem, a little proud and flaring out
    const apW = (v) => lerp(0.16, 0.24, v), apPt = (x, v, off = 0) => {
      const yl = lerp(KB - 0.012, KH + 0.012, v), R = 0.235, th = x / R, { p, n } = kPt(th, yl, 0.009 + 0.018 * Math.pow(v, 1.5) + off);
      return { p, n };
    };
    const ap = grid(8, 12, (u, v) => apPt((u * 2 - 1) * apW(v) / 2, v).p, false);
    put(B.linen, ap, null, (n, p, i) => LIN.clone().lerp(LINF, 0.1 * Math.floor(i / 9) / 12));
    const border = (pa, pb) => { const pts = [], ns = []; for (let i = 0; i <= 12; i++) { const q = apPt(...pa(i / 12), 0.0016); pts.push(q.p); ns.push(q.n); } put(B.gold, strip(pts, ns, 0.006), null, (n) => { const c = gold(V(0, 0.6, 0.8), 0); return c; }); void pb; };
    // GOLD border 0.012 along both sides and the bottom edge
    border((t) => [-apW(t) / 2 + 0.006, t]);
    border((t) => [apW(t) / 2 - 0.006, t]);
    {
      const pts = [], ns = []; for (let i = 0; i <= 12; i++) { const x = lerp(-0.12, 0.12, i / 12), q = apPt(x * 0.985, 0.985, 0.0016); pts.push(q.p); ns.push(q.n); }
      put(B.gold, strip(pts, ns, 0.006), null, () => gold(V(0, 0.6, 0.8), 0));
    }
    // 7 GOLD thread lines across, each slightly wobbled
    for (let k = 0; k < 7; k++) {
      const v = 0.1 + 0.8 * ((k + 0.5) / 7), pts = [], ns = [];
      for (let i = 0; i <= 12; i++) { const x = lerp(-1, 1, i / 12) * (apW(v) / 2 - 0.014), q = apPt(x, v + 0.004 * Math.sin(i * 0.9 + k * 1.7), 0.0016); pts.push(q.p); ns.push(q.n); }
      put(B.gold, strip(pts, ns, 0.0013), null, () => GB.clone().lerp(GL, 0.2));
    }
    // 14 fine pleat lines down the apron (4 mm at 0.012 pitch is 20 across; the stiff cloth shows 14, each wobbled)
    for (let k = 0; k < 14; k++) {
      const f = (k + 0.5) / 14, pts = [], ns = [];
      for (let i = 0; i <= 10; i++) { const v = 0.08 + 0.84 * (i / 10), q = apPt((f * 2 - 1) * (apW(v) / 2 - 0.016) + 0.002 * Math.sin(i * 0.7 + k), v, 0.0014); pts.push(q.p); ns.push(q.n); }
      put(B.deco, ribbon(pts, ns, 0.002, 0.3), null, () => LINF);
    }
    // the belt's tab 0.06 x 0.22: 10 LAPIS / GOLD bars from the buckle down the apron, a gold end bar
    {
      const NB2 = 10, top = KB - 0.026, len = 0.22;
      for (let k = 0; k < NB2; k++) {
        const va = k / NB2, vb = (k + 1) / NB2, ya = top - va * len, yb2 = top - vb * len;
        const g = grid(3, 2, (u, v) => { const yl = lerp(ya, yb2 - 0.0006, v), vv = clamp((KB - yl) / (KB - KH)); return apPt((u * 2 - 1) * 0.03, vv, 0.0045 + 0.002 * Math.sin(Math.PI * u)).p; }, false);
        put(k % 2 ? B.gold : B.lapis, g, null, (n) => (k % 2 ? gold(V(n.x * 0.5, n.y, n.z), 0) : roundCol(LB, LL, LS)(V(n.x, n.y, n.z))));
      }
    }
  }

  // ================================================================ flush the buckets
  flush(B.skin, vmat({ line: "#7a4a14", rough: 0.75 }), root);
  flush(B.gold, vmat({ line: "#5a3c10", rough: 0.4 }), root);
  flush(B.lapis, vmat({ line: "#142348", rough: 0.5 }), root);
  flush(B.turq, vmat({ line: "#16453f", rough: 0.5 }), root);
  { const lm = vmat({ line: "#8a8270", rough: 0.95, role: "cloth" }); lm.emissive = LIN.clone(); lm.emissiveIntensity = 0.22; flush(B.linen, lm, root); }
  flush(B.deco, vmat({ flat: true, rough: 0.8 }), root, false);
  flush(B.ink, vmat({ flat: true, rough: 1 }), root, false);

  // ================================================================ BANDS on the arms and legs (moved each frame; nothing rebuilt)
  const mkBand = (len, withOval, seed, wear) => {
    const R = ch.limbW + 0.0045, hh = len / 2, prof = [], r1 = 0.0022;
    const pp = [[R - 0.001, -hh], [R + 0.0012, -hh + 0.0008], [R + 0.0032, -hh + 0.003], [R + 0.0036, -hh + 0.0075]];
    for (const q of pp) prof.push(V(q[0], q[1], 0));
    // 2 engraved lines
    const g1 = len > 0.025 ? [-0.30, 0.30] : [];
    const top = [R + 0.0036, hh - 0.0075];
    const mid = []; for (let k = 0; k <= 6; k++) { const y = lerp(-hh + 0.0075, hh - 0.0075, k / 6); let r = R + 0.0036; for (const gy of g1) { const d = Math.abs(y - gy * len * 0.9); if (d < 0.0022) r -= 0.0009 * (1 - d / 0.0022); } mid.push(V(r, y, 0)); }
    const tail = [[R + 0.0032, hh - 0.003], [R + 0.0012, hh - 0.0008], [R - 0.001, hh]];
    const pts2 = [...prof.map((p) => new THREE.Vector2(p.x, p.y)), ...mid.map((p) => new THREE.Vector2(p.x, p.y)), ...tail.map((q) => new THREE.Vector2(q[0], q[1]))];
    void top; void r1;
    const lathe = new THREE.LatheGeometry(pts2, 24);
    const gb = bucket(), grp = new THREE.Group();
    put(gb, lathe, null, (n, p, i) => {
      const a = Math.atan2(p.z, p.x), edge = sstep(hh - 0.006, hh, Math.abs(p.y)), w = hs(Math.floor((a + Math.PI) * 4) + seed * 7, 3) < 0.5 ? 1 : 0;
      const groove = Math.abs(Math.abs(p.y) - 0.3 * len * 0.9) < 0.0016 && len > 0.025 ? 1 : 0;
      const loc = V(n.x, n.y * 0.6 + 0.2, n.z * 0.0 + Math.abs(n.x) * 0.9 + 0.4).normalize(); // a band's normal is radial: the light band runs along the band
      const radial = V(Math.cos(a), 0, Math.sin(a)); const outward = radial.x * 0.0 + radial.z; const nl = V(0, 0.55 * n.y + 0.45, 0.2 + 0.8 * clamp(0.5 + 0.5 * (radial.x * 0.6 + radial.z * 0.5))).normalize(); void loc; void outward;
      const c = gold(nl, 0); c.lerp(GS, groove * 0.8); if (edge > 0 && w) c.lerp(hs(seed + i, 5) < 0.25 ? GBOLE : GD, edge * 0.7); return c.clone();
    });
    flush(gb, vmat({ line: "#5a3c10", rough: 0.4 }), grp);
    if (withOval) { const ov = new THREE.SphereGeometry(0.0105, 16, 10); ov.scale(0.7, 1.0, 0.45); ov.rotateY(0); const lb = bucket(); put(lb, ov, new THREE.Matrix4().makeTranslation(R + 0.0045, 0, 0), roundCol(LB, LL, LS)); flush(lb, vmat({ line: "#142348", rough: 0.4 }), grp); }
    return grp;
  };
  const arm = { L: {}, R: {} }, leg = { L: {}, R: {} };
  for (const s of ["L", "R"]) {
    arm[s].upper = mkBand(0.03, true, s === "L" ? 1 : 2); arm[s].wrist = mkBand(0.035, false, s === "L" ? 3 : 4); leg[s].ankle = mkBand(0.02, false, s === "L" ? 5 : 6);
    for (const o of [arm[s].upper, arm[s].wrist, leg[s].ankle]) { o.visible = false; ch.root.add(o); }
  }
  const key = {}, _t = V(0, 0, 0), _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4(), UP = V(0, 1, 0);
  // place a band at arc distance d along an arm curve, its axis along the arm, its oval toward `out`
  const placeBand = (grp, curve, L0, d, out) => {
    const u = clamp(d / L0, 0.001, 0.999), p = curve.getPointAt(u); curve.getTangentAt(u, _t);
    _y.copy(_t).normalize(); _x.copy(out).addScaledVector(_y, -out.dot(_y)).normalize(); _z.crossVectors(_x, _y);
    _m.makeBasis(_x, _y, _z); grp.quaternion.setFromRotationMatrix(_m); grp.position.copy(p); grp.visible = true;
  };
  const _qz = new THREE.Quaternion(), _zAxis = V(0, 0, 1);
  const baseApply = out.apply;
  out.apply = (st, t, ...rest) => {
    baseApply && baseApply(st, t, ...rest);
    // the live jaw: the larger of the speech opening (what the rig's own mouth uses) and an explicit hold, up to 12 degrees
    const speak = Math.max(st?.expr?.open ?? 0, st?.talk ?? 0), hold = st?.jackal?.jaw ?? J.jaw ?? 0;
    jawPivot.rotation.x = (12 * Math.PI / 180) * clamp(Math.max(speak * 1.1, hold));
    // the eyes: after the rig has placed them this frame, squash each to an almond and turn it (outer corner up); the rig's lids, blink,
    // gaze and brows keep working inside. The brows are hidden: black on black, they only floated above the narrow eyes.
    F.eyes.forEach((eye) => { eye.root.scale.set(EYE.sx, EYE.sy, 1); eye.root.quaternion.multiply(_qz.setFromAxisAngle(_zAxis, eye.side * EYE.tilt)); });
    for (const b of F.brows) if (b) b.visible = false;
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], sx = s === "L" ? 1 : -1;
      if (!A?.shoulder || !A.elbow || !A.hand) { arm[s].upper.visible = arm[s].wrist.visible = false; }
      else {
        const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L0 = Math.max(0.1, curve.getLength());
        const outV = V(sx, 0.15, 0.0).normalize();
        const dW = Math.max(0.1, L0 - 0.06 - 0.0175), dU = Math.max(0.035, Math.min(0.08 + 0.015, dW - 0.04));   // the armlet stays clear of the wrist band on a short arm
        placeBand(arm[s].upper, curve, L0, dU, outV);
        placeBand(arm[s].wrist, curve, L0, dW, outV);
      }
      // anklet: 0.045 up the leg from the foot along the line to the hip
      const f = ch.legs?.[s]?.foot;
      if (f && f.visible) {
        const hip = V(sx * (ch.def.legs?.hipX ?? 0.12), ch.legH + (ch.def.legs?.hipY ?? 0.06), 0), ax = hip.clone().sub(f.position).normalize(), g = leg[s].ankle;
        g.position.copy(f.position).addScaledVector(ax, 0.05); _y.copy(ax); _x.set(sx, 0, 0).addScaledVector(_y, -sx * _y.x).normalize(); _z.crossVectors(_x, _y); _m.makeBasis(_x, _y, _z); g.quaternion.setFromRotationMatrix(_m); g.visible = true;
      } else leg[s].ankle.visible = false;
    }
    void key; void UP;
  };
  out.hat = null; out.prop = null; out.sitDepth = 0;
  return out;
}
