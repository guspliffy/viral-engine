// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section A): the costume ODIN, on characters/norse-myth/odin.json.
// Dispatched by costumes-cast.js when the character's costume has `odin: true` (castCostume type "kid"). Body-local metres, y 0 = the body's base.
//
// SIZE   body 1.53 tall (the potato 1.39 x 0.66 x 0.60 + legs 0.14), 1.70 to the hat's tip, 1.80 to the dry leaf's tip (1.5 Spuds). out.hat = { height 0.17,
//        brimR 0 }: the rig adds no hat of its own; the hat, its band and the sprout are built here (the hat group cancels costumes.js's (-0.08, 0, 0.06) rock).
// FACE   measured on the rig: eyeU 0.514, eyeV 0.916, browV 1.13, mouthV 0.52. His LEFT eye (eyes[1], +x) is under the patch and hidden every frame; the
//        visible eye is the rig's eyes[0] (his right, -x), pupil scaled 0.72 (0.022 across). The rig's brows are hidden: 7 silver hairs a brow are rebuilt
//        when the expression changes. The closed mouth line is hidden (the moustache covers it); the open mouth shows inside #4a1c14.
// PARTS  skin marks (3 forehead lines, 2 frown lines, cheek folds, lid fold, 2 bags, 4 crow's feet, the scar with 3 ticks), eyepatch (22 stitches, trefoil
//        stud with 12 beads, 2 straps, 2 rivets, bronze buckle), hat (brim 9 nicks, 3 holes, 1 patch with 10 stitches, 38 band crossings, 3-strand cord,
//        dry sprout through a ragged hole), 16 hair locks, moustache (2 halves), centre beard (9 locks, 28 strand lines), 2 braids (13 crossings, 2 rings
//        each, a tuft of 8), wolf mantle (78 fur locks + 14 guard hairs, 2 wolf masks, 2 brooches, 2 chains of 78 links in all), mail (chest + 9-tooth skirt),
//        under-tunic, belt (60 stitches a row, 2 rows, 14 studs, buckle), pouch, sheath, cloak (outer, lining, 11 folds, 2 holes, a darned patch, 9 mud splashes,
//        knotwork trim of 80 crossings + 3 trefoil knots), sleeves (#3b4560, 16 fold lines, 0.11 to 0.085 wide, ending 0.17 before the hand's centre, the left
//        arm 0.31), bracers (right 0.10 long, left 0.24 long with 9 claw scratches; leather, 3 straps, bronze studs), shoulder flaps (lining grey, 0.26 long,
//        5 folds), boots (0.20 x 0.13 x 0.11, strap + bronze buckle, 5 creases, mud on the welt) on the rig's own feet (the rig's foot is hidden).
//        Counts are in out.measure (mail, trim).
// PERCH  points a raven's feet take, body-local: shoulders (-0.34, 0.83, -0.01) and (+0.34, 0.83, -0.01), under the mantle; the left bracer: 0.05 and 0.19 from its
//        wrist end, along the forearm, on the leather. A raven's crown stays 0.01 to 0.03 under the brim's edge. Nothing of his is built over the shoulders.
// STATE KEYS (all optional; the timeline has no `odin` action yet, so each is read from st.odin when a clip supplies one, else derived from the face)
//   st.odin.cheek   0..1  both cheeks: default derived = (lidR - 0.3) / 0.7 (the warm smile's lid shut to 1 gives 1; stern 0)
//   st.odin.cheekR  0..1  his right (visible) cheek; default max(cheek, smirk * 1.25) (amused: smirk 0.4 gives 0.5). cheekL: his left cheek, default cheek
//                         A cheek lifts the blush plane up to 0.018, shows the blush #e8875a up to 0.35 and pushes the lower lid up 0.2; the crow's feet
//                         shown = round(2 + 2 * cheekR) of 4 (stern 2, amused 3, warm 4)
//   st.odin.glint   0..1  (0) the eye's second catch-light and one thin light arc crossing the iris (0 and 1 show nothing)
//   st.odin.wind    0..1  (0) the hem streams out up to 25 degrees, hair and braids 12, the brim flutters 3 degrees at 5 Hz
//   st.odin.windDir radians (0) the direction the wind blows TOWARD in his own frame: 0 = to his front (+z), +pi/2 = to his left (+x)
// READ FROM THE ACTOR'S STATE  st.expr (tilt, browY, curve, open, eye, smirk, raise), st.face.lidR / browL / browR / tiltL / tiltR, st.talk, st.droop, st.ft
//   moustache: ends 12 degrees down at rest, up to +18 with `curve` (smile); the smirk lifts his RIGHT half (the half over the visible eye) +6 degrees at 0.4
//              (a mirrored smirk: the rig's smirk is "right side", the moustache follows the visible eye); +4 with talk or an open mouth. Range -12..+18.
//   beard root drops 0.012 with talk; hair, centre beard and braids hang from the timeline's lagged head signal st.ft (a 2.2 Hz spring, the lag the spring
//   gives): hair 5 degrees, beard 4, braids up to 14 degrees as pendulums; the fur and chains sway 3 to 4 degrees; the brim flexes 2 degrees on a head
//   snap; the sprout's leaves droop with st.droop and rattle 3 degrees at 7 Hz after a head move.
//   the cloak hangs plumb: below the belt (full under y 0.40, none above 0.62) every vertex turns back 80 % of the body's pitch and roll about the belt line.
// LOOK   anime-pro; the flat decoration meshes carry no ink (noOutline); tiny parts use light line colours. Deterministic: no Math.random, no clock; the
//        hair, crow's feet and marks come from fixed hashes.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { hash2 } from "./costumes-art-cast.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const col = (h) => new THREE.Color(h);
const gauss = (x, w) => Math.exp(-((x / w) ** 2));
const wrapPi = (x) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

// ---- palette (DESIGN "Shared palette")
const P = {
  skin: col("#d99a44"), skinS: col("#a86e28"), skinL: col("#f2c47a"), speck: col("#b87a30"), scar: col("#f0c890"),
  hair: col("#e6e6e2"), hairS: col("#a9aeb4"), hairD: col("#7d848c"), hairL: col("#ffffff"),
  cloak: col("#4a5674"), cloakS: col("#2e364c"), cloakF: col("#20263a"), cloakL: col("#6e7c9c"), lin: col("#8d929d"), linS: col("#62677a"),
  hat: col("#38425c"), hatS: col("#232a3d"), hatL: col("#56627f"), hatFade: col("#4c587a"), hatPatch: col("#2c3449"), stain: col("#5a4630"),
  gold: col("#c9a04a"), goldS: col("#8a6a26"), goldW: col("#6b5222"), goldL: col("#f0d68a"),
  silver: col("#b9bfc6"), silverS: col("#6f7780"), silverT: col("#4a5058"), silverL: col("#f2f6fa"),
  bronze: col("#a8843e"), bronzeS: col("#6b5222"), verd: col("#5f8f7a"), bronzeL: col("#e6c97a"),
  fur: col("#9d9486"), furS: col("#625b50"), furG: col("#403b34"), furL: col("#d2cab8"),
  leather: col("#6b4526"), leatherD: col("#3a2a20"), leatherS: col("#3f2814"), leatherK: col("#1f1611"), leatherL: col("#9a6c40"), rubbed: col("#6b4f3a"),
  mail: col("#8f97a0"), mailS: col("#6f7780"), mailR: col("#7a5a40"), mailL: col("#a9b1ba"),
  ash: col("#c9a46a"),
};

// a (nu+1) x (nv+1) grid of points, closed round in u (the last column meets the first with one normal); skip(i, j) drops a cell;
// ref(centroid) names the way the surface must face: the winding is flipped as a whole when most cells face the other way
function grid(nu, nv, at, closed = true, skip = null, ref = null) {
  const pos = [], idx = [], P3 = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = at(i / nu, j / nv); pos.push(p.x, p.y, p.z); P3.push(p); }
  let vote = 0;
  const cells = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    if (skip && skip(i, j)) continue; const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; cells.push([a, b, c, d]);
    if (ref) { const A = P3[a], B = P3[b], Cc = P3[c], cen = A.clone().add(B).add(Cc).multiplyScalar(1 / 3), n = B.clone().sub(A).cross(Cc.clone().sub(A)); vote += Math.sign(n.dot(ref(cen))) * Math.min(1, n.length() * 1e4); }
  }
  for (const [a, b, c, d] of cells) { if (vote < 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
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
// a band of constant half width W (square ends), for lines that must not taper
function strip(pts, nrm, W) {
  const pos = [], idx = [], n = pts.length - 1;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], side = nrm[i].clone().cross(b.clone().sub(a)).normalize();
    pos.push(...p.clone().addScaledVector(side, -W).toArray(), ...p.clone().addScaledVector(side, W).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a round tube along a curve with radius function r(t), closed at both ends by a tapering of r (open ends otherwise)
function tube(curve, segs, radial, r, rz = null) {
  const fr = curve.computeFrenetFrames(segs, false), pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], a0 = r(t), b0 = rz ? rz(t) : a0;
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU; pos.push(p.x + a0 * Math.cos(a) * N.x + b0 * Math.sin(a) * B.x, p.y + a0 * Math.cos(a) * N.y + b0 * Math.sin(a) * B.y, p.z + a0 * Math.cos(a) * N.z + b0 * Math.sin(a) * B.z); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const NN = g.attributes.normal; for (let i = 0; i <= segs; i++) { const a = i * (radial + 1), b = a + radial, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
  return g;
}

// a flat-oval "lock" (hair, beard, fur, braid strand): a path with a half width w(t) and half thickness th(t), the face turned toward `out`
// (a function of t giving the outward direction). Frames are built once; geometry() lofts it, line(u, t0, t1, lift) gives a stroke on its face.
class Lock {
  constructor(pts, out, w, th, n = 18) {
    this.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"); this.n = n; this.w = w; this.th = th;
    this.P = []; this.S = []; this.N = []; this.T = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = this.curve.getPointAt(t), T = this.curve.getTangentAt(t), o = out(t).clone();
      const S = o.clone().cross(T).normalize(), N = T.clone().cross(S).normalize();   // S across the lock, N out of its face
      this.P.push(p); this.T.push(T); this.S.push(S); this.N.push(N);
    }
  }
  at(t, u, lift = 0) { const f = clamp(t) * this.n, i = Math.min(this.n - 1, Math.floor(f)), k = f - i, L = (a) => a[i].clone().lerp(a[i + 1], k);
    const S = L(this.S).normalize(), N = L(this.N).normalize(), P0 = L(this.P), w = this.w(clamp(t)), th = this.th(clamp(t)), uu = clamp(u, -1, 1);
    return { p: P0.addScaledVector(S, uu * w).addScaledVector(N, th * Math.sqrt(Math.max(0, 1 - uu * uu)) + lift), n: N.clone().addScaledVector(S, uu * 0.6).normalize() }; }
  geometry(radial = 8) {
    const pos = [], idx = [], n = this.n;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = this.w(t), th = this.th(t);
      for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU; pos.push(...this.P[i].clone().addScaledVector(this.S[i], Math.cos(a) * w).addScaledVector(this.N[i], Math.sin(a) * th).toArray()); }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (radial + 1), b = a + radial, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  }
  line(u, t0, t1, lift = 0.0012, k = 10, wob = 0, seed = 0) {
    const pts = [], ns = [];
    for (let i = 0; i <= k; i++) { const t = lerp(t0, t1, i / k), q = this.at(t, u + wob * Math.sin(i * 1.3 + seed), lift); pts.push(q.p); ns.push(q.n); }
    return { pts, ns };
  }
}

// ---- vertex-coloured buckets: many small parts merged into one mesh per material family
const bucket = () => ({ g: [] });
const _n = V(0, 0, 0), _q = V(0, 0, 0);
function put(b, geo, M, colorFn) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const n = g.attributes.normal, p = g.attributes.position, cols = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { _n.fromBufferAttribute(n, i); _q.fromBufferAttribute(p, i); const c = colorFn(_n, _q, i); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
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
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: o.rough ?? 0.7, metalness: 0, side: o.side ?? (o.flat ? THREE.DoubleSide : THREE.FrontSide) });
  if (o.line) m.userData.lineColor = o.line;
  if (o.flat) { m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = o.po ?? -2; m.polygonOffsetUnits = o.po ?? -2; }
  m.userData.lookRole = o.role || "cloth";
  return m;
};
const _c = new THREE.Color();
// shading from a normal in the piece's own frame (+y up, +z toward the viewer): shade underneath, light upper left
const shade = (base, sh, li, n, k = 1) => { const a = sstep(-0.55, 0.4, n.y * 0.7 + n.z * 0.4 - n.x * 0.1); _c.copy(sh).lerp(base, a); _c.lerp(li, sstep(0.55, 0.95, n.y * 0.5 + n.z * 0.5 - n.x * 0.35) * 0.55 * k); return _c.clone(); };
// a ring or a dot on a surface frame: a flat disc at p facing n
const discG = (r, p, n, seg = 10) => { const g = new THREE.CircleGeometry(r, seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n)); g.translate(p.x, p.y, p.z); return g; };

export function odin(C, ch, out) {
  const O = C.odin === true ? {} : C.odin || {};
  const parts = ch.potatoParts, F = ch.face, LOC = ch.cy - ch.ry;
  const phOf = (yl) => Math.asin(clamp((yl + LOC - ch.cy) / ch.ry, -0.995, 0.995));
  const surfAt = (th, yl) => ch.surf(th, phOf(yl));
  const root = new THREE.Group(); root.name = "odin"; root.position.y = LOC; parts.add(root);   // body-local coordinates from here on (y 0 = the base of the body)
  const bp = (th, yl, off = 0) => { const s = surfAt(th, yl), n = s.normal.clone(), p = s.pos.clone().addScaledVector(n, off); p.y -= LOC; return { p, n }; };
  const thFor = (x, yl) => { const ph = phOf(yl); let lo = 0, hi = Math.PI / 2; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (ch.surf(m, ph).pos.x < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  const sk = (x, y, off = 0.0012) => bp(Math.sign(x || 1) * thFor(Math.abs(x), y), y, off);   // the skin at (x, y) of the face, lifted `off`
  // the frame of a piece lying on the body at (th, yl): +z out, +y up, +x along the row
  const frame = (th, yl, off = 0, flatN = 0.5) => { const s = surfAt(th, yl), n = s.normal.clone(); n.y *= flatN; n.normalize(); const p = s.pos.clone().addScaledVector(n, off); p.y -= LOC; const X = V(0, 1, 0).cross(n).normalize(), Y = n.clone().cross(X).normalize(); return new THREE.Matrix4().makeBasis(X, Y, n).setPosition(p); };
  const topLocal = ch.topY() - LOC;
  const B = { skin: bucket(), hair: bucket(), hairLn: bucket(), gold: bucket(), silver: bucket(), bronze: bucket(), leather: bucket(), leatherLn: bucket(), ink: bucket(), fur: bucket(), furLn: bucket() };
  const ink = (b, pts, ns, W, c, heavy = 0.5) => put(b, ribbon(pts, ns, W, heavy), null, () => c);
  const polyOn = (b, pts2, W, c, off = 0.0012, heavy = 0.5) => { const q = pts2.map(([x, y]) => sk(x, y, off)); ink(b, q.map((o) => o.p), q.map((o) => o.n), W, c, heavy); };
  const smooth = (pts2, n = 12) => { const cv = new THREE.CatmullRomCurve3(pts2.map(([x, y]) => V(x, y, 0))); return cv.getPoints(n).map((p) => [p.x, p.y]); };

  // ---- measure the rig: the face layout in the character file puts the eye at body-local y 1.00 and x -0.105 (his right), the patch at +0.105
  const L = F.layout;
  const eyeP = F.place(-L.eyeU, L.eyeV).pos.clone(); eyeP.y -= LOC;
  const dEye = V(-0.105 - eyeP.x, 1.00 - eyeP.y, 0);   // how far the rig's eye is from the design's (printed on the bench; every face mark below is placed by the design's numbers)
  out.measure = { eye: eyeP.toArray().map((v) => +v.toFixed(4)), d: dEye.toArray().map((v) => +v.toFixed(4)) };
  const EXY = [-0.105, 1.00, 0.105];   // right eye x, eye line y, patch centre x
  const dk = col("#8c5a1e"), dk2 = col("#a8702a"), fine = col("#a06a24");

  // ================================================================ SKIN MARKS (3 forehead lines, 2 frown lines, cheek folds, lid fold, 2 bags, 4 crow's feet, the scar)
  const SK = bucket(), CF = [bucket(), bucket(), bucket(), bucket()];
  [[1.092, 0.15, -0.004, 0.0], [1.114, 0.18, 0.012, 1.7], [1.133, 0.12, -0.016, 3.1]].forEach(([y, len, x0, ph], k) => {   // forehead lines 0.12-0.18, half under the brim
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10 - 0.5; pts.push([x0 + u * len, y + 0.004 * Math.sin(u * 5 + ph) - 0.012 * u * u]); }
    polyOn(SK, pts, 0.0021, dk2, 0.0012, 0.5);
  });
  polyOn(SK, smooth([[-0.021, 1.074], [-0.019, 1.056], [-0.023, 1.04]], 6), 0.0016, dk2, 0.0012, 0.6);   // 2 short frown lines between the brows
  polyOn(SK, smooth([[0.017, 1.072], [0.020, 1.055], [0.016, 1.04]], 6), 0.0016, dk2, 0.0012, 0.6);
  for (const s of [-1, 1]) polyOn(SK, smooth([[s * 0.083, 0.962], [s * 0.071, 0.935], [s * 0.054, 0.912]], 8), 0.0022, dk2, 0.0012, 0.4);   // cheek folds 0.05 into the moustache
  polyOn(SK, smooth([[-0.158, 1.018], [-0.14, 1.043], [-0.105, 1.054], [-0.073, 1.047], [-0.056, 1.031]], 14), 0.0025, dk, 0.0012, 0.6);   // the heavy upper lid fold
  polyOn(SK, smooth([[-0.15, 0.946], [-0.105, 0.932], [-0.064, 0.942]], 10), 0.0019, fine, 0.0012, 0.6);   // 2 bag lines under the eye
  polyOn(SK, smooth([[-0.142, 0.934], [-0.103, 0.919], [-0.07, 0.929]], 10), 0.0016, fine, 0.0012, 0.6);
  [[-22, 0.021], [-3, 0.035], [16, 0.032], [34, 0.024]].forEach(([a, len], k) => {   // 4 crow's feet at the outer corner, 0.02-0.035
    const r = a * DEG, pts = []; for (let i = 0; i <= 5; i++) { const u = i / 5; pts.push([-0.153 - Math.cos(r) * len * u, 0.998 + Math.sin(r) * len * u + 0.002 * u * u]); }
    polyOn(CF[k], pts, 0.0017, dk, 0.0012, 0.7);
  });
  // the one old scar #f0c890: 0.07 long with 3 cross ticks, through the left brow and on under the patch
  { const a = [0.128, 1.108], b = [0.097, 1.050], pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([lerp(a[0], b[0], u) + 0.003 * Math.sin(u * 3), lerp(a[1], b[1], u)]); }
    polyOn(SK, pts, 0.0027, P.scar, 0.0017, 0.3);
    for (const u of [0.26, 0.5, 0.74]) { const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); polyOn(SK, [[x - 0.007, y + 0.003], [x + 0.007, y - 0.003]], 0.0014, P.scar, 0.0017, 0.2); } }
  flush(SK, vmat({ flat: true, rough: 0.9 }), root, false);
  const crowG = CF.map((b) => flush(b, vmat({ flat: true, rough: 0.9 }), root, false));

  // ================================================================ EYE: iris ring, 10 flecks, the second catch-light and the glint arc (children of the eye's gaze group)
  const eyeR = F.eyes[0];   // the rig's right eye (side -1): his visible eye. eyes[1] is under the patch: hidden every frame
  {
    const r = eyeR.r, E = F.eyeStyle, ri = E.iris, z0 = r * (E.depth - 0.16), rad = r * ri;
    const ringM = new THREE.MeshBasicMaterial({ color: "#4a5563" }); ringM.userData.noOutline = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.93, rad * 0.075, 6, 40), ringM); ring.scale.set(1, 1.12, 0.35); ring.position.z = z0 + 0.05 * rad; eyeR.look.add(ring);
    const flM = new THREE.MeshBasicMaterial({ color: "#a9b6c4" }); flM.userData.noOutline = true;
    for (let i = 0; i < 10; i++) {   // 10 pale flecks, each its own place and size
      const a = hs(i, 1) * TAU, rr = (0.28 + 0.56 * hs(i, 2)) * rad, fz = z0 + 0.35 * rad * Math.sqrt(Math.max(0, 1 - (rr / rad) ** 2));
      const f = new THREE.Mesh(new THREE.CircleGeometry(rad * (0.034 + 0.03 * hs(i, 3)), 6), flM); f.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 1.12, fz + 0.002 * rad); f.scale.set(1.5, 0.8, 1); f.rotation.z = a; eyeR.look.add(f);
    }
    const glM = new THREE.MeshBasicMaterial({ color: "#ffffff" }); glM.userData.noOutline = true;
    const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.1, 10, 8), glM); g2.scale.set(1, 1.1, 0.5); g2.position.set(-rad * 0.34, -rad * 0.42, r * (E.depth + 0.03)); g2.visible = false; eyeR.look.add(g2);   // the doubled catch-light (glint)
    const arc = [], an = []; for (let i = 0; i <= 10; i++) { const a = (-0.9 + 1.8 * i / 10); arc.push(V(Math.sin(a) * rad * 0.78, Math.cos(a) * rad * 0.9 * 1.12 - rad * 0.2, 0)); an.push(V(0, 0, 1)); }
    const arcM = new THREE.Mesh(ribbon(arc, an, rad * 0.05, 0.4), glM); arcM.position.z = z0 + 0.36 * rad * 0.99; arcM.visible = false; eyeR.look.add(arcM);   // one thin light arc crosses the iris
    var glintParts = { g2, arcM, rad };
  }

  // ================================================================ BROWS: 7 silver hair strokes each, rebuilt only when the expression changes; the rig's two tubes are hidden
  const browG = new THREE.Group(); browG.name = "odin-brows"; F.group.add(browG);
  let browKey = "";
  const hairM = vmat({ flat: true, rough: 0.9, po: -4 });
  const buildBrows = (e, c) => {
    const key = [e.tilt, e.browY, e.raise, c.browL, c.browR, c.tiltL, c.tiltR, e.eye].join("|");
    if (key === browKey) return; browKey = key;
    for (const ch2 of browG.children.slice()) { browG.remove(ch2); ch2.geometry.dispose(); }
    const bk = bucket();
    for (const side of [-1, 1]) {
      const yb = L.browV + e.browY * 6 + (side < 0 ? e.raise * 6 : 0) + (side < 0 ? c.browR : c.browL) * 0.3, tilt = e.tilt + (side < 0 ? c.tiltR : c.tiltL);
      const inner = 0.25, outer = 0.78;
      const ctr = (t) => [side * (inner + (outer - inner) * t), yb + Math.sin(t * Math.PI) * 0.09 + (1 - t) * tilt * 0.35 - t * tilt * 0.05];
      for (let h = 0; h < 7; h++) {   // 7 hair strokes: each its own start along the brow, its own row across it and its own length
        const s = side < 0 ? h : h + 7, t0 = h === 0 ? 0 : 0.03 + 0.78 * (h - 1) / 6 * 0.9 + 0.04 * hs(s, 1), len = 0.40 + 0.2 * hs(s, 2) + (h >= 5 ? 0.12 : 0), row = (hs(s, 3) - 0.5) * 0.085;
        const pts = [], ns = [];
        for (let i = 0; i <= 5; i++) {
          const t = clamp(t0 + len * i / 5 * (h >= 5 ? 1.12 : 1), 0, h >= 5 ? 1.045 : 1), q = ctr(Math.min(t, 1)), ex = t > 1 ? (t - 1) * (outer - inner) * side : 0;
          const lean = (hs(s, 4) - 0.35) * 0.09 * (i / 5);   // each hair leans up and away
          const P = F.place(q[0] + ex, q[1] + row + lean + 0.012 * Math.sin(i + s)), p = P.pos.clone().addScaledVector(P.normal, 0.0095 * F.size / 0.58 * 0.58 + 0.0018 * (h % 2));
          pts.push(p); ns.push(P.normal.clone());
        }
        put(bk, ribbon(pts, ns, 0.0042 + 0.0016 * hs(s, 5), 0.55), null, () => (h % 3 === 2 ? P.hairS : h % 3 === 1 ? P.hair : P.hairL).clone().lerp(P.hair, 0.2));
      }
    }
    const m = flush(bk, hairM, browG, false); if (m) m.userData.noPad = true;
  };

  // ================================================================ EYEPATCH (a rounded shield, point down, 0.135 x 0.125, domed 0.012), the knot stud, straps and rivets
  const PX = 0.105, PT = 1.052, PH = 0.125, PW = 0.0675;   // centre x, top y, height, half width
  const halfW = (v) => PW * (v < 0.46 ? 1 - 0.06 * gauss(v, 0.08) * 0 : Math.pow(Math.max(0, 1 - ((v - 0.46) / 0.54) ** 2.15), 0.62)) * (1 - 0.26 * Math.pow(Math.max(0, 1 - v / 0.14), 2));
  const dome = (u, v) => 0.012 * Math.max(0, 1 - (u * u * 0.9 + Math.pow((v - 0.42) / 0.6, 2)) * 0.95) ** 0.8;
  const patchP = (u, v, lift = 0) => { const x = PX + u * halfW(v), y = PT - v * PH - 0.012 * (1 - Math.pow(1 - Math.abs(u), 0.5)) * (v < 0.2 ? 1 : 0) * 0, q = sk(x, y, 0.004 + dome(u, v) + lift); return q; };
  {
    const sh = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6, metalness: 0 }); sh.userData.lookRole = "cloth"; sh.userData.lineColor = "#1b120c";
    const g = grid(16, 18, (a, b) => patchP(a * 2 - 1, b).p, false, null, () => V(0, 0, 1));
    const bk = bucket(); put(bk, g, null, (n, p) => { const c = shade(P.leatherD, P.leatherK, P.leatherL.clone().lerp(P.rubbed, 0.5), n, 0.9); const dx = (p.x - PX) / PW, dy = (PT - p.y) / PH; c.lerp(P.rubbed, 0.55 * sstep(0.8, 1.0, Math.hypot(dx, (dy - 0.45) * 0.9))); return c; });
    flush(bk, sh, root);
    // the rolled edge: a tube round the outline, rubbed to #6b4f3a
    const edge = []; for (let i = 0; i < 64; i++) { const a = i / 64 * 2, side = a < 1 ? 1 : -1, w = a < 1 ? a : 2 - a; const v = 1 - Math.abs(1 - 2 * w * 0 - 0) * 0; edge.push(w); }
    const path = []; for (let i = 0; i < 40; i++) { const v = i / 39; path.push(patchP(1, v, -0.0006).p); }   // the right edge top to point (his left side of the patch is +x)
    for (let i = 38; i >= 1; i--) { const v = i / 39; path.push(patchP(-1, v, -0.0006).p); }
    const topEdge = []; for (let i = 1; i < 12; i++) { const u = 1 - 2 * i / 12; topEdge.push(patchP(u, 0, -0.0006).p); }
    const loop = [...path.slice(0, 40), ...path.slice(40).reverse().slice(0, 0)];
    const full = [...Array.from({ length: 40 }, (_, i) => patchP(1, i / 39, -0.0006).p), ...Array.from({ length: 38 }, (_, i) => patchP(-1, 1 - (i + 1) / 39, -0.0006).p), ...topEdge.slice().reverse().reverse()];
    const rim = bucket(); const cv = new THREE.CatmullRomCurve3(full, true);
    put(rim, new THREE.TubeGeometry(cv, 180, 0.0036, 6, true), null, (n, p, i) => shade(P.rubbed, P.leatherD, P.leatherL, n).lerp(P.leatherD, 0.25 * hs(Math.floor(i / 30), 5)));
    flush(rim, vmat({ line: "#1b120c", rough: 0.8 }), root);
    // 22 stitches #8a6a4a at a pitch of 0.012, along the upper edge and down the outer side, inset 0.0065
    const st = bucket(), L0 = cv.getLength();
    for (let i = 0; i < 22; i++) {
      const d = (0.004 + i * 0.012) / L0, p = cv.getPointAt(d % 1), tg = cv.getTangentAt(d % 1), q = sk(p.x + 0, p.y, 0.0), cx = V(PX, PT - PH * 0.42, 0), toC = V(cx.x - p.x, cx.y - p.y, 0).normalize();
      const a = sk(p.x + toC.x * 0.0072, p.y + toC.y * 0.0072, 0.0125), n = a.n;
      const cross = toC.clone().multiplyScalar(0.0034); const pts = [a.p.clone().sub(cross), a.p.clone().add(cross)];
      put(st, strip(pts, [n, n], 0.0009), null, () => col("#8a6a4a")); void q; void tg;
    }
    flush(st, vmat({ flat: true, rough: 0.9, po: -4 }), root, false);
    // 5 scratch lines across the leather, each its own length and slant
    const sc = bucket();
    [[-0.5, 0.28, 0.05, 0.42], [0.35, 0.22, -0.04, 0.38], [-0.1, 0.62, 0.06, 0.3], [0.5, 0.52, -0.05, 0.34], [-0.38, 0.72, 0.03, 0.26]].forEach(([u, v, sl, len], k) => {
      const pts = [], ns = []; for (let i = 0; i <= 5; i++) { const q = patchP(clamp(u + sl * i * 2.2, -0.85, 0.85), clamp(v + len * 0.24 * (i / 5), 0.05, 0.93), 0.0008); pts.push(q.p); ns.push(q.n); }
      put(sc, ribbon(pts, ns, 0.0012, 0.4), null, () => (k % 2 ? P.leatherL : P.leatherK).clone().lerp(P.rubbed, 0.2));
    });
    flush(sc, vmat({ flat: true, rough: 0.9, po: -3 }), root, false);
  }
  // the knot stud: r 0.016, proud 0.005, silver; three interlaced arcs (a 3-loop knot) in relief, a rim of 12 beads, tarnish in the cuts
  {
    const c0 = patchP(0, 0.42, 0.0), M = new THREE.Matrix4(); { const n = c0.n, X = V(0, 1, 0).cross(n).normalize(), Y = n.clone().cross(X).normalize(); M.makeBasis(X, Y, n).setPosition(c0.p); }
    const sb = bucket(), disc = new THREE.CylinderGeometry(0.016, 0.0165, 0.004, 28); disc.rotateX(Math.PI / 2); disc.translate(0, 0, 0.002);
    put(sb, disc, M, (n) => shade(P.silverT.clone().lerp(P.silverS, 0.5), P.silverT, P.silver, n, 0.8));
    // the rim bead ring (12 dots) and the 3 interlaced arcs (a trefoil knot: 3 crossings, over and under)
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, s = new THREE.SphereGeometry(0.0013, 6, 5); s.translate(Math.cos(a) * 0.0143, Math.sin(a) * 0.0143, 0.0043); put(sb, s, M, (n) => shade(P.silver, P.silverS, P.silverL, n)); }
    const tre = (t) => V(Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t));   // a trefoil: 3 crossings
    const pts = [], dz = []; for (let i = 0; i <= 90; i++) { const q = tre(i / 90 * TAU); pts.push(V(q.x * 0.0036, q.y * 0.0036, 0.0046 + 0.0007 * q.z)); }
    put(sb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, 0.00115, 5, true), M, (n) => shade(P.silver, P.silverS, P.silverL, n, 1.2)); void dz;
    flush(sb, vmat({ line: "#2f3338", rough: 0.35 }), root);
  }
  // straps 0.016 wide: A from the patch's upper inner corner up across the forehead at 28 degrees to the brim at x -0.10; B from the outer corner back under the hair to a bronze buckle 0.014 at the temple
  {
    const sb = bucket(), a0 = [PX - PW * 0.84, PT - 0.004], a1 = [-0.10, a0[1] + (a0[0] + 0.10) * Math.tan(28 * DEG)];
    const pts = [], ns = []; for (let i = 0; i <= 14; i++) { const u = i / 14, q = sk(lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u) + 0.003 * Math.sin(u * 3), 0.0045); pts.push(q.p); ns.push(q.n); }
    put(sb, strip(pts, ns, 0.008), null, (n) => shade(P.leather, P.leatherS, P.leatherL, n, 0.8));
    const e1 = [], n1 = []; for (let i = 0; i <= 14; i++) { const u = i / 14, q = sk(lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u) + 0.003 * Math.sin(u * 3), 0.0058); e1.push(q.p); n1.push(q.n); }
    const sbi = bucket(); put(sbi, strip(e1, n1, 0.0009), null, () => P.leatherK);
    const b0 = [PX + PW * 0.93, PT - PH * 0.2], bts = [], bns = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(b0[0], 0.205, u), y = lerp(b0[1], 1.004, u) + 0.004 * Math.sin(u * 3), q = sk(x, y, 0.0045); bts.push(q.p); bns.push(q.n); }
    put(sb, strip(bts, bns, 0.008), null, (n) => shade(P.leather, P.leatherS, P.leatherL, n, 0.8));
    { const c2 = []; for (let i = 0; i <= 10; i++) { const th = lerp(thFor(0.205, 1.004), 1.9, i / 10), q = bp(th, 1.004 + 0.02 * (i / 10), 0.0045); c2.push(q); } put(sb, strip(c2.map((q) => q.p), c2.map((q) => q.n), 0.008), null, (n) => shade(P.leather, P.leatherS, P.leatherL, n, 0.8)); }
    flush(sb, vmat({ line: "#1b120c", rough: 0.7 }), root);
    flush(sbi, vmat({ flat: true, rough: 0.9, po: -4 }), root, false);
    // 2 rivets at the strap ends and the bronze buckle 0.014 at the temple
    const bz = bucket();
    for (const [x, y] of [[a0[0] + 0.004, a0[1] - 0.001], [b0[0] - 0.003, b0[1]]]) { const q = sk(x, y, 0.0055), s = new THREE.SphereGeometry(0.0052, 10, 8); s.scale(1, 1, 0.55); const M2 = frame(Math.sign(x) * thFor(Math.abs(x), y), y, 0.0058); put(bz, s, M2, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n)); void q; }
    { const th = thFor(0.205, 1.004), M2 = frame(th, 1.004, 0.0075), fr = new THREE.TorusGeometry(0.0075, 0.0017, 6, 16); fr.scale(1, 0.9, 0.7); put(bz, fr, M2, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n)); const pr = new THREE.CapsuleGeometry(0.0012, 0.01, 2, 5); pr.rotateZ(Math.PI / 2); put(bz, pr, M2, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n)); }
    flush(bz, vmat({ line: "#3a2a12", rough: 0.35 }), root);
  }

  // ================================================================ HAT (HAT BLUE felt): brim, crown, band, dry sprout. Built in body-local metres inside the hat group.
  const hat = new THREE.Group(), hatIn = new THREE.Group(); hat.add(hatIn);
  { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, 0, 0.06)).invert(); hatIn.quaternion.copy(q); hatIn.position.set(0, -topLocal, 0).applyQuaternion(q); }   // costumes.js rocks the hat group by (-0.08, 0, 0.06): the design's numbers are kept
  const BR = 1.14;   // the brim's root line
  // ---- the brim: an oval, front z +0.33, sides x 0.33, back z -0.35; lifted 8 degrees over his eye, drooping 14 over the patch and 10 at the back; 5 waves; 9 nicks; 2 holes; 1 sewn patch
  const tiltKeys = [[-3.1416, -10], [-2.2, -6], [-1.3, -1], [-0.4, 8], [0.0, 1], [0.4, -14], [1.3, -4], [2.2, -8], [3.1416, -10]];   // radians -> degrees; phi < 0 is his right (the eye's side)
  const tiltAt = (phi) => { const f = wrapPi(phi); let i = 0; while (i < tiltKeys.length - 2 && f > tiltKeys[i + 1][0]) i++; const a = tiltKeys[i], b = tiltKeys[i + 1], k = (f - a[0]) / (b[0] - a[0]), s = k * k * (3 - 2 * k); return (a[1] + (b[1] - a[1]) * s) * DEG; };
  const NICK = Array.from({ length: 9 }, (_, k) => ({ a: -3.0 + k * 0.71 + 0.2 * (hs(k, 1) - 0.5), d: 0.010 + 0.020 * hs(k, 2), w: 0.028 + 0.02 * hs(k, 3) }));   // 9 nicks 0.01-0.03 deep
  const brimPt = (phi, rho, under = 0) => {
    const s = Math.sin(phi), c = Math.cos(phi);
    const pin = [0.25 * s, 0.225 * c], pout = [0.47 * s, -0.02 + 0.42 * c];
    let nd = 0; for (const n of NICK) nd += n.d * gauss(wrapPi(phi - n.a), n.w);
    const wid = Math.hypot(pout[0] - pin[0], pout[1] - pin[1]), k = 1 - nd / wid * (rho > 0.7 ? 1 : 0) * sstep(0.7, 1, rho) ;
    const r2 = rho * k, x = lerp(pin[0], pout[0], r2), z = lerp(pin[1], pout[1], r2), d = r2 * wid;
    const y = BR + Math.tan(tiltAt(phi) * 0.68) * d + 0.020 * Math.sin(4 * phi + 0.8) * Math.pow(rho, 1.4) * (1 + 0.5 * hs(Math.floor((phi + 3.2) * 3), 2)) + 0.008 * Math.sin(9 * phi + 2.1) * Math.pow(rho, 2) - 0.016 * rho * rho - under + 0.006 * (1 - rho);
    return V(x, y, z);
  };
  const HOLE = { phi: -0.95, rho: 0.58, r: 0.018 };   // hole 1: r 0.018 on his right at 60 % out
  const holeC = brimPt(HOLE.phi, HOLE.rho);
  const inHole = (u, v) => { const q = brimPt((u * 2 - 1) * Math.PI, v); return Math.hypot(q.x - holeC.x, q.z - holeC.z) < HOLE.r * 0.95; };
  const BNU = 360, BNV = 12;
  {
    const hb = bucket(), top = grid(BNU, BNV, (u, v) => brimPt((u * 2 - 1) * Math.PI, v), true, (i, j) => inHole((i + 0.5) / BNU, (j + 0.5) / BNV), () => V(0, 1, 0));
    const stainA = [0.35, 0.35 + 0.4 * TAU - TAU * 0], sw = 0.015 / 0.12;
    const brimCol = (n, p, i, under) => {
      const ii = i % (BNU + 1), jj = Math.floor(i / (BNU + 1)), phi = (ii / BNU * 2 - 1) * Math.PI, rho = jj / BNV;
      const c = under ? P.hatS.clone().lerp(P.hat, 0.2) : shade(P.hat, P.hatS, P.hatL, n, 0.9);
      c.lerp(P.hatS, 0.25 * (1 - rho) * (under ? 0 : 1));
      const inStain = ((phi + Math.PI) / TAU) % 1 < 0.4 ? 1 : 0;
      if (rho > 1 - sw) c.lerp(P.stain, inStain * sstep(1 - sw, 1 - sw * 0.5, rho) * 0.95);
      return c;
    };
    put(hb, top, null, (n, p, i) => brimCol(n, p, i, false));
    const bot = grid(BNU, BNV, (u, v) => brimPt((1 - u * 2) * Math.PI, v, 0.008), true, (i, j) => inHole(1 - (i + 0.5) / BNU, (j + 0.5) / BNV), () => V(0, -1, 0));
    put(hb, bot, null, (n, p, i) => brimCol(n, p, i, true));
    // the rolled edge 0.012 along the rim, stained on 40 % of it
    const rim = Array.from({ length: 180 }, (_, i) => brimPt((i / 180 * 2 - 1) * Math.PI, 1, 0.004));
    put(hb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 360, 0.0062, 6, true), null, (n, p, i) => { const f = Math.floor(i / 7 / 6) % 360 / 360, c = shade(P.hat, P.hatS, P.hatL, n, 0.7); if (f < 0.4) c.lerp(P.stain, 0.9); return c; });
    // the rim of hole 1 (a worn, thread-bare ring) and the cut-in
    put(hb, new THREE.TorusGeometry(HOLE.r, 0.0026, 5, 18).rotateX(Math.PI / 2).translate(holeC.x, holeC.y - 0.004, holeC.z), null, (n) => shade(P.hat, P.hatS, P.hatL, n, 0.5));
    flush(hb, vmat({ line: "#151a28", rough: 0.9, role: "cloth", side: THREE.DoubleSide }), hatIn);
  }
  // hatching on the brim and the crown: short strokes, a light and a dark kind, each its own place, slant and length
  { const hk = bucket();
    for (let k = 0; k < 300; k++) {
      const phi = (hs(k, 1) * 2 - 1) * Math.PI, rho = 0.08 + 0.9 * hs(k, 2), a = brimPt(phi, rho), ang = (hs(k, 3) - 0.5) * 1.3 + (k % 2 ? 0 : 1.57), len = 0.014 + 0.018 * hs(k, 4);
      const dr = brimPt(phi, rho + 0.03).sub(a).normalize(), tg = brimPt(phi + 0.02, rho).sub(a).normalize(), dir = dr.clone().multiplyScalar(Math.cos(ang)).addScaledVector(tg, Math.sin(ang)).normalize();
      if (Math.hypot(a.x - holeC.x, a.z - holeC.z) < 0.03) continue;
      const pts = [a.clone().addScaledVector(dir, -len / 2), a.clone(), a.clone().addScaledVector(dir, len / 2)].map((p) => p.add(V(0, 0.0016, 0))); const ns = pts.map(() => V(0, 1, 0));
      put(hk, ribbon(pts, ns, 0.0016, 0.3), null, () => (k % 3 === 0 ? P.hatL : P.hatS).clone().lerp(P.hat, 0.45));
    }
    flush(hk, vmat({ flat: true, rough: 0.95 }), hatIn, false); }
  // hole 2: a slit 0.05 at the back left; the sewn patch 0.05 x 0.04 #2c3449 on the left, with 10 stitches
  {
    const hb = bucket(), s0 = brimPt(2.45, 0.5), sa = brimPt(2.45, 0.56).sub(brimPt(2.45, 0.44)).normalize(), tg = brimPt(2.47, 0.5).sub(brimPt(2.43, 0.5)).normalize();
    const pts = [], ns = []; for (let i = 0; i <= 8; i++) { const u = i / 8 - 0.5; pts.push(s0.clone().addScaledVector(tg, u * 0.05).addScaledVector(sa, 0.004 * Math.sin(u * 5)).add(V(0, 0.0018, 0))); ns.push(V(0, 1, 0)); }
    put(hb, ribbon(pts, ns, 0.0042, 0.3), null, () => col("#0d0f17"));
    const lip = pts.map((p) => p.clone().addScaledVector(sa, 0.0044).add(V(0, 0.0004, 0)));
    put(hb, ribbon(lip, ns, 0.0016, 0.3), null, () => P.hatL);
    const c0 = brimPt(0.95, 0.5), rd = brimPt(0.95, 0.56).sub(brimPt(0.95, 0.44)).normalize(), td = brimPt(0.97, 0.5).sub(brimPt(0.93, 0.5)).normalize(), nn = rd.clone().cross(td).normalize().multiplyScalar(-1).y < 0 ? V(0, 1, 0) : V(0, 1, 0);
    const pg = grid(4, 4, (u, v) => c0.clone().addScaledVector(td, (u - 0.5) * 0.05).addScaledVector(rd, (v - 0.5) * 0.04).add(V(0, 0.0022, 0)), false);
    put(hb, pg, null, (n) => shade(P.hatPatch, P.hatS, P.hatL, n, 0.6));
    for (let i = 0; i < 10; i++) {   // 10 stitches round the patch's border
      const f = (i + 0.5) / 10 * 4, side = Math.floor(f), k = f - side, u = [k, 1, 1 - k, 0][side] - 0.5, v = [0, k, 1, 1 - k][side] - 0.5, ix = [0, -1, 0, 1][side], iy = [-1, 0, 1, 0][side];
      const p = c0.clone().addScaledVector(td, u * 0.044).addScaledVector(rd, v * 0.034).add(V(0, 0.0032, 0)), dd = td.clone().multiplyScalar(ix * 0.0034).addScaledVector(rd, iy * 0.0034);
      put(hb, strip([p.clone().sub(dd), p.clone().add(dd)], [V(0, 1, 0), V(0, 1, 0)], 0.0007), null, () => col("#aab1c2"));
    }
    flush(hb, vmat({ flat: true, rough: 0.9, po: -4 }), hatIn, false);
  }
  // ---- the crown: a soft cone, base radii 0.24 x 0.21 at the brim line, the top third folded back and to HIS RIGHT, blunt tip r 0.03 at (-0.13, 1.48, -0.10)
  const SP = new THREE.CatmullRomCurve3([V(0, 1.125, 0), V(0, 1.19, 0), V(0, 1.26, -0.005), V(0, 1.33, -0.015), V(-0.02, 1.385, -0.035), V(-0.07, 1.415, -0.055), V(-0.14, 1.41, -0.075), V(-0.205, 1.37, -0.09), V(-0.25, 1.305, -0.095)], false, "centripetal");
  const CT = 64, CA = 56;
  const creases = [[0.56, 2.55], [0.62, -2.6], [0.68, 3.0], [0.60, -2.1]];   // 4 crease folds at the bend
  const ringAt = (t) => { const C0 = SP.getPointAt(t), T = SP.getTangentAt(t), Wz = V(0, 0, 1).addScaledVector(T, -T.z).normalize(), U = T.clone().cross(Wz).normalize(); return { C0, U, Wz }; };   // the fold lies in the x-y plane: the ring's depth axis stays front-back
  const crownR = (t, a) => {
    const k = 1 - 0.82 * Math.pow(t, 0.85);
    let m = 1 + 0.035 * Math.sin(3 * a + 4 * t + 0.7) - 0.03 * gauss(wrapPi(a), 0.55) * gauss(t - 0.3, 0.1);   // a dent at the front
    for (const [tc, ac] of creases) m -= 0.26 * gauss(t - tc, 0.04) * gauss(wrapPi(a - ac), 0.3);
    return { rx: 0.25 * k * m, rz: 0.24 * k * m };
  };
  const crownPt = (t, a, off = 0) => { const { C0, U, Wz } = ringAt(Math.min(t, 0.999)), { rx, rz } = crownR(t, a); const p = C0.clone().addScaledVector(U, rx * Math.sin(a)).addScaledVector(Wz, rz * Math.cos(a)); if (off) { const n = U.clone().multiplyScalar(Math.sin(a) / Math.max(rx, 1e-3)).addScaledVector(Wz, Math.cos(a) / Math.max(rz, 1e-3)).normalize(); p.addScaledVector(n, off); } return p; };
  {
    const cb = bucket();
    const geo = grid(CA, CT + 4, (u, v) => {
      if (v <= (CT) / (CT + 4)) return crownPt(v * (CT + 4) / CT, u * TAU - Math.PI);
      const k = (v - CT / (CT + 4)) * (CT + 4) / 4, { C0, U, Wz } = ringAt(0.999), { rx, rz } = crownR(0.999, u * TAU - Math.PI), a = u * TAU - Math.PI;   // the blunt cap: a quarter circle of 4 rings
      const T = SP.getTangentAt(0.999), s = Math.cos(k * Math.PI / 2), z = Math.sin(k * Math.PI / 2) * 0.03;
      return C0.clone().addScaledVector(U, rx * Math.sin(a) * s).addScaledVector(Wz, rz * Math.cos(a) * s).addScaledVector(T, z);
    }, true, null, (c) => { let b = SP.getPoint(0), bd = 1e9; for (let i = 0; i <= 40; i++) { const q = SP.getPoint(i / 40), d = q.distanceTo(c); if (d < bd) { bd = d; b = q; } } return c.clone().sub(b); });
    put(cb, geo, null, (n, p, i) => {
      const jj = Math.floor(i / (CA + 1)), t = Math.min(1, jj / CT), c = shade(P.hat, P.hatS, P.hatL, n, 0.9);
      c.lerp(P.hatFade, sstep(0.45, 0.9, t) * sstep(0.1, 0.7, n.y) * 0.8);   // sun-faded on top
      c.lerp(P.hatS, 0.35 * (1 - sstep(0, 0.12, t)));
      for (const [tc, ac] of creases) c.lerp(P.hatS, 0.5 * gauss(t - tc, 0.03) * gauss(wrapPi(((i % (CA + 1)) / CA * TAU - Math.PI) - ac), 0.3));
      return c;
    });
    flush(cb, vmat({ line: "#151a28", rough: 0.9, role: "cloth" }), hatIn);
    const hk = bucket();   // hatching on the crown
    for (let k = 0; k < 150; k++) {
      const t = 0.04 + 0.9 * hs(k, 11), a = (hs(k, 12) * 2 - 1) * Math.PI, p = crownPt(t, a, 0.0016), ang = (hs(k, 13) - 0.5) * 1.3 + (k % 2 ? 0 : 1.57), len = 0.014 + 0.016 * hs(k, 14);
      const tu = crownPt(t + 0.03, a, 0.0016).sub(p).normalize(), ta = crownPt(t, a + 0.08, 0.0016).sub(p).normalize(), dir = tu.clone().multiplyScalar(Math.cos(ang)).addScaledVector(ta, Math.sin(ang)).normalize();
      const nn = crownPt(t, a, 0.02).sub(p).normalize(), pts = [p.clone().addScaledVector(dir, -len / 2), p, p.clone().addScaledVector(dir, len / 2)];
      put(hk, ribbon(pts, [nn, nn, nn], 0.0015, 0.3), null, () => (k % 3 === 0 ? P.hatL : P.hatS).clone().lerp(P.hat, 0.45));
    }
    flush(hk, vmat({ flat: true, rough: 0.95 }), hatIn, false);
    // the ragged hole 0.03 x 0.02 in the front right of the crown
    const rk = bucket(), tc = 0.30, ac = -0.62, c0 = crownPt(tc, ac, 0.0018), ring = [], rn = [];
    const tu = crownPt(tc + 0.03, ac, 0).sub(crownPt(tc - 0.03, ac, 0)).normalize(), ta = crownPt(tc, ac + 0.1, 0).sub(crownPt(tc, ac - 0.1, 0)).normalize(), nn = crownPt(tc, ac, 0.05).sub(crownPt(tc, ac, 0)).normalize();
    for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU, rj = 0.85 + 0.35 * hs(i % 12, 21); ring.push(c0.clone().addScaledVector(ta, Math.cos(a) * 0.015 * rj).addScaledVector(tu, Math.sin(a) * 0.010 * rj)); rn.push(nn); }
    const fan = new THREE.BufferGeometry(); { const pos = [c0.x, c0.y, c0.z, ...ring.flatMap((p) => [p.x, p.y, p.z])], idx = []; for (let i = 0; i < 12; i++) idx.push(0, i + 1, i + 2); fan.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fan.setIndex(idx); fan.computeVertexNormals(); }
    put(rk, fan, null, () => col("#0b0d14")); put(rk, ribbon(ring, rn, 0.0018, 0.3), null, () => P.hatL);
    flush(rk, vmat({ flat: true, rough: 0.9, po: -3 }), hatIn, false);
  }
  // ---- the band: a 3-strand braided cord 0.022 thick, 2 turns round the crown's base, 38 crossings a turn; a knot at the back left with 2 frayed ends of 0.06
  {
    const bb = bucket(), cordC = col("#a87f4a"), cordS = col("#6e5230"), turns = 2, N = 120, pts = [];
    const tBand = (s) => 0.052 + 0.045 * (s / (turns * TAU));
    for (let i = 0; i <= N * turns; i++) { const s = i / N * TAU, t = tBand(s), a = Math.PI + s; pts.push(crownPt(t, -a + 0.0, 0.0105)); }   // from the back, running round
    const cord = new THREE.CatmullRomCurve3(pts, false), len = cord.getLength();
    put(bb, new THREE.TubeGeometry(cord, 240 * turns, 0.0108, 8, false), null, (n) => shade(cordS.clone().lerp(cordC, 0.5), cordS, cordC, n, 0.5));
    const NX = 38 * turns;   // 38 crossings a turn, each a V of the plait lying on the cord, the V turned one way and the other, 3 columns
    for (let k = 0; k < NX; k++) {
      const u = (k + 0.5) / NX, p = cord.getPointAt(u), T = cord.getTangentAt(u), up = V(0, 1, 0).addScaledVector(T, -T.y).normalize(), out2 = T.clone().cross(up).normalize();   // out2 across the cord, along the crown's surface
      const lean = (k % 2 ? 1 : -1), w = 0.0072, vtx = p.clone().addScaledVector(out2, 0.0), pa = p.clone().addScaledVector(up, lean * w).addScaledVector(T, -0.0075);
      const pb = p.clone().addScaledVector(up, -lean * w).addScaledVector(T, 0.0075), nrm = p.clone().sub(crownPt(tBand(u * turns * TAU), -(Math.PI + u * turns * TAU), -0.0)).normalize();
      const mid = p.clone().addScaledVector(nrm, 0.0112);
      put(bb, ribbon([pa.clone().addScaledVector(nrm, 0.0099), mid, pb.clone().addScaledVector(nrm, 0.0099)], [nrm, nrm, nrm], 0.0030, 0.1), null, () => (k % 3 === 0 ? cordC : k % 3 === 1 ? cordC.clone().lerp(cordS, 0.4) : cordS.clone().lerp(cordC, 0.6)));
      void vtx;
    }
    flush(bb, vmat({ line: "#2c1e10", rough: 0.9, role: "cloth" }), hatIn);
    // the knot at the back left, with 2 frayed ends of 0.06
    const kb = bucket(), kp = crownPt(tBand(0.0), 2.35, 0.016), ball = new THREE.SphereGeometry(0.017, 12, 9); ball.scale(1.2, 0.9, 0.9);
    put(kb, ball, new THREE.Matrix4().setPosition(kp), (n) => shade(cordC, cordS, P.goldL.clone().lerp(cordC, 0.6), n, 0.5));
    for (const s of [-1, 1]) {
      const a0 = kp.clone(), pts2 = [a0, a0.clone().add(V(s * 0.012, -0.022, -0.006)), a0.clone().add(V(s * 0.02, -0.046, -0.01)), a0.clone().add(V(s * 0.026 + 0.004, -0.06, -0.012))];
      put(kb, tube(new THREE.CatmullRomCurve3(pts2), 8, 6, (t) => 0.0052 * (1 - 0.35 * t)), null, (n) => shade(cordC, cordS, P.goldL.clone().lerp(cordC, 0.6), n, 0.4));
      for (let f = 0; f < 3; f++) { const b = pts2[3].clone(); put(kb, ribbon([b.clone().add(V(-s * 0.002, 0.0, 0)), b.clone().add(V(s * (0.003 + f * 0.003), -0.011 - 0.003 * f, -0.002 * f)), b.clone().add(V(s * (0.006 + f * 0.006), -0.021 - 0.002 * f, -0.004 * f))], [V(0, 0, 1), V(0, 0, 1), V(0, 0, 1)], 0.0017, 0.3), null, () => cordC); }
    }
    flush(kb, vmat({ line: "#2c1e10", rough: 0.9, role: "cloth", flat: false }), hatIn);
    var knotAt = kp;
  }
  // ---- the dry sprout through a ragged hole r 0.015 in the crown's front left slope (+0.06, 1.49, +0.05): stem 0.07 bent, 2 leaves 0.11 x 0.05 and 0.07 x 0.035, the tip at y 1.66
  const sproutG = new THREE.Group(), sprBase = (() => { let best = null; for (let i = 0; i <= 120; i++) for (let j = 0; j < 72; j++) { const t = 0.1 + 0.5 * i / 120, a = j / 72 * TAU - Math.PI, p = crownPt(t, a), d = Math.hypot(p.x - 0.09, p.y - 1.33, p.z - 0.09); if (!best || d < best.d) best = { d, t, a, p }; } return best; })();
  {
    const sb = bucket(), base = sprBase.p.clone(), nrm = crownPt(sprBase.t, sprBase.a, 0.05).sub(base).normalize();
    // the ragged hole: a dark ring r 0.015 with a torn lip
    const ring = [], rn = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rj = 0.88 + 0.28 * hs(i % 14, 31), e1 = nrm.clone().cross(V(0, 1, 0)).normalize(), e2 = nrm.clone().cross(e1).normalize(); ring.push(base.clone().addScaledVector(nrm, 0.0016).addScaledVector(e1, Math.cos(a) * 0.015 * rj).addScaledVector(e2, Math.sin(a) * 0.015 * rj)); rn.push(nrm); }
    const fan = new THREE.BufferGeometry(); { const pos = [base.x + nrm.x * 0.0016, base.y + nrm.y * 0.0016, base.z + nrm.z * 0.0016, ...ring.flatMap((p) => [p.x, p.y, p.z])], idx = []; for (let i = 0; i < 14; i++) idx.push(0, i + 1, i + 2); fan.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fan.setIndex(idx); fan.computeVertexNormals(); }
    put(sb, fan, null, () => col("#0b0d14")); put(sb, ribbon(ring, rn, 0.0019, 0.3), null, () => P.hatL);
    flush(sb, vmat({ flat: true, rough: 0.9, po: -3 }), hatIn, false);
    sproutG.position.copy(base).addScaledVector(nrm, -0.012);
    // stem 0.07, bent, 0.008 thick
    const lean = V(-0.35, 0.0, 0.35).normalize(), stemPts = [V(0, 0, 0), nrm.clone().multiplyScalar(0.03).add(V(0, 0.02, 0)), nrm.clone().multiplyScalar(0.045).add(V(0, 0.045, 0)).addScaledVector(lean, 0.012), nrm.clone().multiplyScalar(0.05).add(V(0, 0.062, 0)).addScaledVector(lean, 0.03)];
    const stemC = new THREE.CatmullRomCurve3(stemPts), stemG = new THREE.Group(); sproutG.add(stemG);
    const stem = new THREE.Mesh(tube(stemC, 12, 6, (t) => 0.0044 - 0.0008 * t), vmat({ rough: 0.8 })); stem.geometry = (() => { const g = stem.geometry, c = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < g.attributes.position.count; i++) { _n.fromBufferAttribute(g.attributes.normal, i); const k = shade(col("#7a4a22"), col("#4f2f14"), col("#a06a3a"), _n); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; } g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g; })();
    stem.material.userData.lineColor = "#3a2210"; stemG.add(stem);
    const top = stemC.getPoint(1), tt = stemC.getTangent(1);
    // leaves: a blade lofted along a curved midrib, cupped, edges curled 20 degrees, a midrib and 5 side veins a side
    const leaf = (len, wid, seed, bites, holeAt) => {
      const lb = bucket(), nu = 6, nv = 16, mid = (v) => V(0, Math.sin(v * 1.2) * 0.0, 0).setY(v * len).setZ(0.018 * len * v * v + 0.006 * Math.sin(v * 3 + seed));
      const half = (v) => wid / 2 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(0.05 + v * 0.95), 0.8)), 0.8) * (1 - 0.25 * v) - bites.reduce((s, [bv, bd]) => s + bd * gauss(v - bv, 0.025), 0);
      const at = (u, v) => { const x = (u * 2 - 1) * half(v), q = mid(v); return V(x, q.y, q.z + 0.5 * Math.abs(u * 2 - 1) ** 2 * wid * 0.22 * (0.3 + v) - 0.1 * x * x / Math.max(wid, 1e-3) * 0 + (Math.abs(u * 2 - 1) > 0.9 ? 0.0 : 0) + Math.tan(20 * DEG) * Math.max(0, Math.abs(x) - half(v) * 0.7) * 0.9); };
      const geo = grid(nu, nv, at, false, holeAt ? (i, j) => { const q = at((i + 0.5) / nu, (j + 0.5) / nv); return Math.hypot(q.x - holeAt[0], q.y - holeAt[1]) < 0.0036; } : null);
      put(lb, geo, null, (n, p) => { const c = shade(col("#c98a3a"), col("#9a6226"), col("#e6b25c"), n, 1); c.lerp(col("#9a6226"), 0.25 * sstep(0.6, 1, Math.abs(p.x) / (wid / 2))); return c; });
      const veins = bucket();
      const mr = [], mn = []; for (let i = 0; i <= 12; i++) { const v = 0.04 + 0.9 * i / 12, q = at(0.5, v); q.z += 0.0014; mr.push(q); mn.push(V(0, 0, 1)); } put(veins, ribbon(mr, mn, 0.0014, 0.3), null, () => col("#7a4a22"));
      for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const v0 = 0.14 + 0.15 * k, pts = [], ns = []; for (let i = 0; i <= 4; i++) { const v = v0 + 0.07 * i / 4, uu = 0.5 + sd * 0.4 * (i / 4) * (1 - 0.1 * k); const q = at(uu, clamp(v, 0, 0.97)); q.z += 0.0014; pts.push(q); ns.push(V(0, 0, 1)); } put(veins, ribbon(pts, ns, 0.0009, 0.3), null, () => col("#a8702a")); }
      const g = new THREE.Group(); flush(lb, vmat({ line: "#4f2f14", rough: 0.7, side: THREE.DoubleSide }), g); flush(veins, vmat({ flat: true, rough: 0.8, po: -3 }), g, false); return g;
    };
    const L1 = new THREE.Group(), L2 = new THREE.Group(); L1.position.copy(top); L2.position.copy(top).addScaledVector(tt, -0.006); sproutG.add(L1, L2);
    const bigL = leaf(0.11, 0.05, 1.3, [[0.32, 0.007], [0.66, 0.006]], [0.006, 0.058]), smallL = leaf(0.07, 0.035, 4.1, [], null);
    L1.add(bigL); L2.add(smallL);
    L1.rotation.set(-0.42, 0.4, -0.74, "YXZ"); L2.rotation.set(-0.5, -0.55, 0.78, "YXZ");
    var sprout = { L1, L2, stemG, top };
    sproutG.scale.setScalar(1.6);   // grown 1.6 times about its hole, so the leaf still tops out near 1.80
    hatIn.add(sproutG);
  }
  out.hat = { group: hat, height: 0.17, brimR: 0 };

  // ================================================================ HAIR, MOUSTACHE, BEARD, BRAIDS (SILVER HAIR); each is a pendulum or a pivot the apply swings
  const SIL = (n, k = 1) => shade(P.hair, P.hairS, P.hairL, n, k);
  const lockMat = () => vmat({ line: "#6a7078", rough: 0.85, role: "cloth" });
  const strandMat = () => vmat({ flat: true, rough: 0.9, po: -3 });
  // a path along the body surface: pts2 = [[x, y, off], ...] -> points and normals
  const along = (pts2) => { const qs = pts2.map(([x, y, off]) => sk(x, y, off)); return { P: qs.map((q) => q.p), N: qs.map((q) => q.n) }; };
  const outOf = (N) => (t) => { const f = clamp(t) * (N.length - 1), i = Math.min(N.length - 2, Math.floor(f)); return N[i].clone().lerp(N[i + 1], f - i).normalize(); };
  const mkLock = (P3, N3, w, th, n = 18) => new Lock(P3, outOf(N3), w, th, n);
  const hairPivot = new THREE.Group(), hairIn = new THREE.Group(); hairPivot.position.set(0, 1.08, 0); hairIn.position.set(0, -1.08, 0); hairPivot.add(hairIn); root.add(hairPivot);
  {
    const hl = bucket(), hn = bucket(), locks = [];
    const wave = (k, t, amp) => amp * Math.sin(t * TAU * (1.1 + 0.6 * hs(k, 7)) + hs(k, 8) * TAU) * Math.sin(Math.PI * clamp(t * 1.4));
    // 5 back locks: from under the brim at the back, lying on the fur down to y 0.74
    for (let k = 0; k < 5; k++) {
      const th = Math.PI + (k - 2) * 0.27 + 0.05 * (hs(k, 1) - 0.5), y1 = 0.74 + 0.03 * hs(k, 2), pts = [], ns = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10, y = lerp(1.115, y1, t), q = bp(th + wave(k, t, 0.045) + (t > 0.9 ? 0.02 : 0), y, 0.030 + 0.060 * sstep(0.2, 0.9, t) + (t > 0.93 ? 0.016 : 0)); pts.push(q.p); ns.push(q.n); }
      locks.push({ P: pts, N: ns, w: 0.062 + 0.008 * hs(k, 3), len: 0.36, k });
    }
    // 4 locks each side: down the head past the ears onto the fur shelf at the shoulders
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const th = s * (1.18 + 0.27 * k) + 0.04 * (hs(k + 9 * (s > 0), 1) - 0.5), y1 = 0.84 + 0.02 * hs(k, 4), pts = [], ns = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10, y = lerp(1.115, y1, Math.pow(t, 0.9)), q = bp(th + s * wave(k + 7 * (s > 0), t, 0.05), y, 0.032 + 0.08 * sstep(0.45, 1, t) + (t > 0.93 ? 0.014 : 0)); pts.push(q.p); ns.push(q.n); }
      locks.push({ P: pts, N: ns, w: 0.058 + 0.008 * hs(k, 5), len: 0.31, k: k + 5 + (s > 0 ? 4 : 0) });
    }
    // 3 thin locks in front of the ears: 1 on his right, 2 on his left
    [[-1, 0.9], [1, 0.82], [1, 1.02]].forEach(([s, th0], k) => {
      const pts = [], ns = [], x0 = Math.sin(th0) * 0.3; for (let i = 0; i <= 10; i++) { const t = i / 10, y = lerp(1.1, 0.80 + 0.03 * k, t), q = bp(s * (th0 + 0.05 * Math.sin(t * 5 + k)), y, 0.012 + 0.03 * t + (t > 0.9 ? 0.012 : 0)); pts.push(q.p); ns.push(q.n); }
      locks.push({ P: pts, N: ns, w: 0.014 + 0.002 * k, len: 0.3, k: 13 + k, thin: true }); void x0;
    });
    locks.forEach((L2, idx) => {
      const lk = mkLock(L2.P, L2.N, (t) => L2.w * (t < 0.1 ? 0.55 + 4.5 * t : 1 - 0.55 * Math.pow(sstep(0.62, 1, t), 1.4)), () => 0.017 + 0.003 * hs(idx, 9));
      put(hl, lk.geometry(8), null, (n) => SIL(n));
      const ns2 = idx % 3 === 0 ? 6 : idx % 3 === 1 ? 5 : 4;   // 4-6 strand lines a lock, 3 of them darker #7d848c
      for (let q = 0; q < ns2; q++) { const u = -0.7 + 1.4 * (q + 0.5) / ns2 + 0.1 * (hs(idx * 7 + q, 3) - 0.5), t0 = 0.04 + 0.25 * hs(idx * 7 + q, 4), t1 = 0.55 + 0.4 * hs(idx * 7 + q, 5), dark = (idx * 3 + q) % 11 === 0 || (idx * 5 + q) % 17 === 3;
        const ln = lk.line(u, t0, t1, 0.0006, 8, 0.05, idx + q); put(hn, ribbon(ln.pts, ln.ns, 0.0016, 0.5), null, () => (dark ? P.hairD : q % 2 ? P.hairL : P.hairS).clone()); }
      // the ends curl out 0.02
      const e = lk.at(1, 0, 0.0), tip = new THREE.SphereGeometry(0.004, 6, 5); tip.translate(e.p.x, e.p.y, e.p.z); put(hl, tip, null, (n) => SIL(n));
    });
    flush(hl, lockMat(), hairIn); flush(hn, strandMat(), hairIn, false);
  }
  // ---- the hair's mass under the locks: one skin round the back and sides of the head from under the brim to the shoulders, locks carved in it (so no skin shows between the locks)
  {
    const mb = bucket(), NU = 90, NV = 20, TH0 = 1.0;
    const phAt = (u, v) => u * 11 + 0.3 * Math.sin(v * 5 + u * 9);
    const lobe = (ph) => Math.sin(Math.PI * (ph - Math.floor(ph)));
    const botY = (u) => 0.80 + 0.05 * Math.pow(lobe(u * 11), 0.6) * -1 + 0.04 * Math.cos(u * TAU);
    const at = (a, b) => { const th = lerp(TH0, TAU - TH0, a), y = lerp(1.118, botY(a), Math.pow(b, 0.9)), side = Math.abs(wrapPi(th)); const off = 0.018 + 0.07 * sstep(0.3, 1, b) * (0.6 + 0.4 * sstep(1.0, 2.2, side)) + 0.008 * lobe(phAt(a, b)) - 0.012 * sstep(0.1, 0, b); return bp(th, y, off).p; };
    const geo = grid(NU, NV, at, false, null, (c) => V(c.x, 0, c.z));
    put(mb, geo, null, (n, p, i) => { const ii = i % (NU + 1), jj = Math.floor(i / (NU + 1)), a = ii / NU, b = jj / NV, ph = phAt(a, b), k = Math.floor(ph), c = SIL(n, 0.9).lerp(P.hairS, 0.35 + 0.4 * Math.pow(1 - lobe(ph), 1.5) + 0.2 * hs(k, 31)); c.lerp(P.hairD, 0.45 * sstep(0.12, 0, b)); return c; });
    flush(mb, vmat({ line: "#6a7078", rough: 0.9, role: "cloth", side: THREE.DoubleSide }), hairIn);
  }
  // ---- moustache: 2 halves each 0.15 long, 0.05 thick at the root to 0.015, hanging 0.03 below the mouth corners, tips curling out; 6 strand lines each; a gap of 0.03 under the root
  const moust = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(), gi = new THREE.Group(); const rootP = sk(s * 0.010, 0.903, 0.0).p; g.position.copy(rootP); gi.position.copy(rootP).negate(); g.add(gi); root.add(g); moust.push({ g, s, rootP });
    const base = [[0.010, 0.905, 0.040], [0.050, 0.898, 0.038], [0.100, 0.878, 0.031], [0.148, 0.846, 0.022], [0.184, 0.828, 0.016], [0.212, 0.836, 0.013], [0.226, 0.862, 0.011]];
    const pth = along(base.map(([x, y, off]) => [s * x, y, off + 0.0]));
    const lk = mkLock(pth.P, pth.N, (t) => 0.040 * Math.pow(1 - t, 0.8) + 0.0075, (t) => 0.034 * Math.pow(1 - t, 0.85) + 0.0060, 14);
    const mb = bucket(), ms = bucket();
    put(mb, lk.geometry(10), null, (n) => SIL(n));
    for (let q = 0; q < 6; q++) { const u = -0.75 + 1.5 * (q + 0.5) / 6, ln = lk.line(u, 0.02 + 0.1 * hs(q, 11), 0.62 + 0.36 * hs(q + 3, 12), 0.0007, 10, 0.04, q); put(ms, ribbon(ln.pts, ln.ns, 0.0016, 0.5), null, () => (q % 2 ? P.hairD : P.hairS).clone().lerp(P.hair, q % 3 ? 0.3 : 0)); }
    flush(mb, lockMat(), gi); flush(ms, strandMat(), gi, false);
  }
  // ---- centre beard: ONE soft mass, 0.30 wide along the jaw, from under the moustache (and up the jaw at the sides) to mid-chest (tip y 0.40), 0.10 thick at the top;
  // 9 locks carved into its surface (grooves between puffed locks, meandering), 28 strand lines as surface carving, the bottom edge nine soft points, the tip curled to his left
  const beardPivot = new THREE.Group(), beardIn = new THREE.Group(); beardPivot.position.set(0, 0.84, 0.2); beardIn.position.set(0, -0.84, -0.2); beardPivot.add(beardIn); root.add(beardPivot);
  {
    const bb = bucket(), bs = bucket(), NL = 9, NU = 72, NV = 44;
    const topY = (u) => 0.832 + 0.135 * Math.pow(Math.max(0, Math.abs(u) - 0.22) / 0.78, 1.5);   // a U: under the moustache in the middle, up the jaw at the sides
    const wob = (v) => 0.28 * Math.sin(v * 5.5 + 0.6) + 0.12 * Math.sin(v * 13 + 1.3);            // the locks meander as they fall
    const lockPh = (u, v) => (u * 0.5 + 0.5) * NL + wob(v) * (0.3 + v);                          // 0..9 across, wobbled
    const lobeAt = (ph) => Math.sin(Math.PI * (ph - Math.floor(ph)));                              // 0 in a groove, 1 on a lock's crest
    const tipY = (u, v) => { const a = Math.abs(u), ph = (u * 0.5 + 0.5) * NL; return 0.45 + 0.17 * Math.pow(a, 1.3) - 0.05 * Math.pow(lobeAt(ph), 0.6); };
    const hw = (v) => 0.158 * (1 + 0.1 * Math.sin(Math.PI * v) - 0.42 * Math.pow(v, 1.6));
    const bpt = (u, v, lift = 0) => {
      const y = lerp(topY(u), tipY(u, v), Math.pow(v, 0.95)), a = Math.abs(u);
      const x = u * hw(v) + 0.032 * Math.pow(v, 2.2) * (1 - 0.5 * a) + 0.012 * Math.sin(v * 6.5 + u * 2.1) * (0.3 + v);
      const ph = lockPh(u, v), crest = Math.pow(lobeAt(ph), 0.7), carve = 0.010 * crest * sstep(0.03, 0.22, v);
      const off = lerp(0.098 - 0.03 * a, 0.021, Math.pow(v, 0.8)) + 0.026 * Math.sqrt(Math.max(0, 1 - u * u)) * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.05)) + carve - 0.024 * sstep(0.14, 0, v) + lift;   // the top sinks into the skin: no cut edge
      return sk(x, y, off);
    };
    const geo = grid(NU, NV, (a, b) => bpt(a * 2 - 1, b).p, false, null, (c) => V(c.x * 0.3, 0, 1));
    put(bb, geo, null, (n, p, i) => {
      const ii = i % (NU + 1), jj = Math.floor(i / (NU + 1)), u = (ii / NU) * 2 - 1, v = jj / NV, ph = lockPh(u, v), k = Math.floor(ph), tone = hs(k, 8), crest = lobeAt(ph);
      const c = SIL(n, 1.0).lerp(P.hairS, 0.42 * Math.pow(1 - crest, 1.6) + 0.22 * tone * (1 - crest)).lerp(P.hairL, 0.14 * (1 - tone) * crest);
      c.lerp(P.hairD, 0.5 * sstep(0.12, 0, v));   // shaded where it grows from the skin
      return c;
    });
    // 28 strand lines, 3 on each of the 9 locks and one more, following the meander
    for (let q = 0; q < 28; q++) {
      const k = q % NL, f0 = 0.2 + 0.6 * hs(q, 21), v0 = 0.08 + 0.3 * hs(q, 22), v1 = 0.55 + 0.4 * hs(q, 23), pts = [], ns = [];
      for (let i = 0; i <= 14; i++) { const v = lerp(v0, v1, i / 14), ph = k + f0, u = ((ph - wob(v) * (0.3 + v)) / NL - 0.5) * 2, w = bpt(clamp(u, -1, 1), v, 0.0016); pts.push(w.p); ns.push(w.n); }
      put(bs, ribbon(pts, ns, 0.0019, 0.5), null, () => (q % 4 === 0 ? P.hairD : q % 2 ? P.hairS : P.hairL).clone());
    }
    flush(bb, vmat({ line: "#6a7078", rough: 0.85, role: "cloth", side: THREE.DoubleSide }), beardIn); flush(bs, strandMat(), beardIn, false);
  }
  // ---- braids: 2 plaits at x -0.14 and +0.14 in front of the beard's sides, y 0.80 to 0.34, 0.055 thick to 0.04; 13 crossings each as V shapes, 2 rings each (55 % and 86 % down), a tuft of 8 strands below the last ring
  const braidP = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(), pin = new THREE.Group(), top = sk(s * 0.175, 0.80, 0.085).p; piv.position.copy(top); pin.position.copy(top).negate(); piv.add(pin); piv.scale.set(1.5, 1, 1.5); root.add(piv); braidP.push({ piv, s });
    const ctrl = []; for (let i = 0; i <= 12; i++) { const t = i / 12, y = lerp(0.80, 0.34, t), x = s * (0.175 - 0.012 * t * t + 0.004 * Math.sin(t * 5)), q = sk(x, y, 0.085 - 0.014 * t + 0.0 * s); ctrl.push(q.p); }
    const cv = new THREE.CatmullRomCurve3(ctrl), rad = (t) => 0.0275 - 0.0075 * t;
    const bb = bucket(), bs = bucket(), tbs = bucket(), rg = bucket(), rl = bucket();
    const plaitT1 = 0.86;
    put(bb, tube(cv, 40, 10, (t) => rad(t) * (t < plaitT1 ? 1 : 0.0001), null).clone(), null, (n) => shade(P.hairS.clone().lerp(P.hair, 0.4), P.hairD, P.hair, n, 0.6));
    // 13 crossings, each a V: two strands crossing over the plait's face, the V's tip pointing down
    for (let k = 0; k < 13; k++) {
      const t = 0.045 + (plaitT1 - 0.085) * k / 12, p = cv.getPointAt(t), T = cv.getTangentAt(t).normalize(), fwd = V(0, 0, 1).addScaledVector(T, -T.z).normalize(), X = T.clone().cross(fwd).normalize(), r = rad(t), h = 0.0085;
      const mk = (a) => p.clone().addScaledVector(X, Math.sin(a) * r * 1.0).addScaledVector(fwd, Math.cos(a) * r * 1.0);
      const pts = [], ns = []; const a0 = 1.1, a1 = -1.1; for (let i = 0; i <= 6; i++) { const u = i / 6, a = lerp(a0, a1, u), vv = Math.abs(u - 0.5) * 2; const q = mk(a).addScaledVector(T, -h * (1 - vv) + h * 0.2).addScaledVector(mk(a).sub(p).normalize(), 0.0012); pts.push(q); ns.push(mk(a).sub(p).normalize()); }
      put(bs, ribbon(pts, ns, 0.0042, 0.1), null, () => (k % 2 ? P.hair : P.hairL).clone().lerp(P.hairS, 0.15));
      const ln = pts.map((q, i) => q.clone().addScaledVector(ns[i], 0.0012)); put(bs, strip(ln, ns, 0.0007), null, () => P.hairD);
    }
    // the tuft below the last ring: 8 strands, 0.07 long, flaring to 0.05
    const t0 = cv.getPointAt(plaitT1), T0 = cv.getTangentAt(plaitT1).normalize(), X0 = T0.clone().cross(V(0, 0, 1)).normalize(), Z0 = X0.clone().cross(T0).normalize();
    for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + 0.3, r0 = 0.0145, r1 = 0.023 + 0.004 * hs(q, 31), len = 0.066 + 0.008 * hs(q, 32), pts = [t0.clone().addScaledVector(X0, Math.cos(a) * r0 * 0.5).addScaledVector(Z0, Math.sin(a) * r0 * 0.5), t0.clone().addScaledVector(T0, len * 0.5).addScaledVector(X0, Math.cos(a) * (r0 + r1) / 2).addScaledVector(Z0, Math.sin(a) * (r0 + r1) / 2), t0.clone().addScaledVector(T0, len).addScaledVector(X0, Math.cos(a) * r1).addScaledVector(Z0, Math.sin(a) * r1)];
      put(tbs, tube(new THREE.CatmullRomCurve3(pts), 6, 5, (t) => 0.0062 * (1 - 0.8 * t) + 0.0006), null, (n) => shade(q % 2 ? P.hair : P.hairS, P.hairD, P.hairL, n, 0.8)); }
    // 2 rings: SILVER, 2 raised rims, an engraved 2-strand twist of 10 crossings between them, rubbed bright on the front
    for (const [tt, hgt] of [[0.55, 0.030], [0.86, 0.035]]) {
      const c0 = cv.getPointAt(tt), T = cv.getTangentAt(tt).normalize(), r = rad(tt) + 0.0042, frm = new THREE.Matrix4(), X = T.clone().cross(V(0, 0, 1)).normalize(), Zf = X.clone().cross(T).normalize();
      frm.makeBasis(X, T, Zf).setPosition(c0);
      const body = new THREE.CylinderGeometry(r, r, hgt - 0.008, 24, 1, true); const rimTop = new THREE.TorusGeometry(r + 0.0006, 0.0026, 6, 24), rimBot = rimTop.clone();
      rimTop.rotateX(Math.PI / 2).translate(0, hgt / 2 - 0.0026, 0); rimBot.rotateX(Math.PI / 2).translate(0, -hgt / 2 + 0.0026, 0);
      const ringCol = (n) => { const c = shade(P.silver, P.silverS, P.silverL, n, 1.2); c.lerp(P.silverL, 0.4 * sstep(0.1, 0.9, n.z)); return c; };
      put(rg, body, frm, (n, p) => ringCol(n).lerp(P.silverS, 0.18)); put(rg, rimTop, frm, ringCol); put(rg, rimBot, frm, ringCol);
      for (const sg of [0, 1]) { const pts = [], ns = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU, y = (sg ? -1 : 1) * 0 + (Math.sin(u * TAU * 10 / 2 * 2 + (sg ? Math.PI : 0)) * (hgt / 2 - 0.0085)) * 0.75; const q = V(Math.cos(a) * (r + 0.0011), y, Math.sin(a) * (r + 0.0011)).applyMatrix4(frm); pts.push(q); ns.push(q.clone().sub(c0).setY(0).normalize()); }
        // a twist: u spans the ring once; 10 crossings of the two strands = 10 half-periods... drawn over the full circle (the back half is hidden by the plait)
        put(rl, ribbon(pts.slice(0, 41), ns.slice(0, 41), 0.0016, 0.1), null, () => P.silverT.clone().lerp(P.silverS, 0.4)); }
    }
    flush(bb, lockMat(), pin); flush(bs, strandMat(), pin, false); flush(tbs, lockMat(), pin); flush(rg, vmat({ line: "#2f3338", rough: 0.35 }), pin); flush(rl, strandMat(), pin, false);
  }

  // ================================================================ WOLF-FUR MANTLE: a flat top shelf at y 0.83 (x 0.24 to 0.40 each side, the ravens' perch), nape 0.90, front ends down to 0.62, a deep V at the back to 0.48
  const keyF = (keys, a) => { let i = 0; while (i < keys.length - 2 && a > keys[i + 1][0]) i++; const [a0, v0] = keys[i], [a1, v1] = keys[i + 1], k = clamp((a - a0) / (a1 - a0)); return v0 + (v1 - v0) * k * k * (3 - 2 * k); };
  const swayP = new THREE.Group(), swayIn = new THREE.Group(); swayP.position.set(0, 0.95, 0); swayIn.position.set(0, -0.95, 0); swayP.add(swayIn); root.add(swayP);   // the fur, the wolf masks, the brooches and the chains sway together
  const TH0 = 0.40;                                          // the front is open: the mantle runs from th 0.40 round the back to 2 pi - 0.40
  const mTop = (th) => { const a = Math.abs(wrapPi(th)); return 0.90 - 0.07 * sstep(0.5, 1.05, a) * (1 - sstep(2.35, 3.0, a)); };
  const mBot = (th) => keyF([[0.40, 0.655], [0.62, 0.615], [1.0, 0.68], [1.57, 0.715], [2.3, 0.65], [3.1416, 0.48]], Math.abs(wrapPi(th)));
  const mOff = (th, v) => { const a = Math.abs(wrapPi(th)), sh = gauss(a - 1.57, 0.78); return 0.034 + 0.046 * sh * Math.pow(1 - v, 0.55) + 0.014 * (1 - v) * (0.5 + 0.5 * sh) + 0.006 * Math.sin(th * 7 + v * 5); };
  const mPt = (th, v, extra = 0) => { const y = lerp(mTop(th), mBot(th), v), a = Math.abs(wrapPi(th)); return bp(th, y, mOff(th, v) + extra); };
  const FURL = [], fb = bucket(), ft2 = bucket(), FLN = bucket();
  {
    const NU = 150, NV = 12;
    const geo = grid(NU, NV, (u, v) => mPt(TH0 + u * (TAU - 2 * TH0), 1 - v).p, false, null, (c) => V(c.x, 0, c.z));
    put(fb, geo, null, (n, p, i) => { const jj = Math.floor(i / (NU + 1)), v = 1 - jj / NV, c = shade(P.fur, P.furS, P.furL, n, 0.7); c.lerp(P.furG, 0.25 * sstep(0.5, 1, v) * hs(Math.floor(p.x * 80) + 7 * Math.floor(p.y * 80), 3)); return c; });
    // the flat shelf (the ravens' perch): from inside the body out to the rim, both shoulders, at y 0.83
    for (const s of [-1, 1]) { const a0 = 1.0, a1 = 2.35, NS = 26;
      const cap = grid(NS, 4, (u, w) => { const th = s * lerp(a0, a1, u), y = mTop(th); return bp(th, y, lerp(-0.045, mOff(th, 0) + 0.004, w)).p; }, false, null, () => V(0, 1, 0));
      put(fb, cap, null, (n, p) => shade(P.fur, P.furS, P.furL, n, 0.7).lerp(P.furS, 0.15 * hs(Math.floor(p.x * 90), 4)));
    }
    flush(fb, vmat({ line: "#4a443a", rough: 0.95, role: "cloth", side: THREE.DoubleSide }), swayIn);
    // 78 pointed locks in 3 rows (22, 26, 30), each 0.05-0.11 long and 0.025-0.045 wide, 3-4 strand lines, tips pale, lean hashed 12 degrees; 14 guard hairs
    const rows = [[22, 0.06], [26, 0.47], [30, 0.88]];
    let idx = 0;
    rows.forEach(([n, v0], r) => {
      for (let k = 0; k < n; k++, idx++) {
        const th = TH0 + 0.03 + (k + 0.5 + 0.35 * (hs(idx, 1) - 0.5)) / n * (TAU - 2 * TH0 - 0.06), v = clamp(v0 + 0.04 * (hs(idx, 2) - 0.5), 0, 0.97), len = 0.05 + 0.06 * hs(idx, 3), wid = (0.0125 + 0.01 * hs(idx, 4)) * (r === 2 ? 1.08 : 1), lean = (hs(idx, 5) - 0.5) * 2 * 12 * DEG;
        const base = mPt(th, v, 0.006), p0 = base.p, nn = base.n, down = V(0, -1, 0).addScaledVector(nn, 0.06 + 0.16 * (r === 0 ? 1 : 0.6)).normalize(), side = V(0, 1, 0).cross(nn).normalize();
        const dir = down.clone().addScaledVector(side, Math.tan(lean)).normalize(), p1 = p0.clone().addScaledVector(dir, len * 0.5).addScaledVector(nn, 0.01 + 0.006 * r), p2 = p0.clone().addScaledVector(dir, len).addScaledVector(nn, 0.014 + 0.012 * r - 0.003 * hs(idx, 6)), outN = (t) => nn;
        const lk = new Lock([p0, p1, p2], outN, (t) => wid * Math.pow(1 - t, 0.75) * (t < 0.12 ? 0.6 + 3.3 * t : 1) + 0.0008, () => 0.0065, 8);
        FURL.push({ lk, idx, r, p0, p2 });
        put(ft2, lk.geometry(6), null, (n, p) => { const t = clamp(p0.distanceTo(p) / len), c = shade(P.fur, P.furS, P.furL, n, 0.8); c.lerp(P.furL, sstep(0.55, 1, t) * 0.85); if (r === 0) c.lerp(P.furL, 0.12); return c; });
        const nq = 3 + (idx % 2);
        for (let q = 0; q < nq; q++) { const u = -0.55 + 1.1 * (q + 0.5) / nq, ln = lk.line(u, 0.12, 0.92, 0.0006, 5, 0, q); put(FLN, ribbon(ln.pts, ln.ns, 0.00085, 0.4), null, () => (q % 2 ? P.furS : P.furL).clone().lerp(P.fur, 0.2)); }
      }
    });
    for (let k = 0; k < 14; k++, idx++) {   // 14 guard-hair locks: long, thin, dark with pale tips, standing out of the rows
      const th = TH0 + 0.12 + (k + 0.5) / 14 * (TAU - 2 * TH0 - 0.24) + 0.05 * (hs(k, 41) - 0.5), v = 0.2 + 0.55 * hs(k, 42), len = 0.09 + 0.045 * hs(k, 43), base = mPt(th, v, 0.014), nn = base.n, down = V(0, -1, 0).addScaledVector(nn, 0.34).normalize();
      const p0 = base.p, p1 = p0.clone().addScaledVector(down, len * 0.5).addScaledVector(nn, 0.02), p2 = p0.clone().addScaledVector(down, len).addScaledVector(nn, 0.04 + 0.01 * hs(k, 44));
      const lk = new Lock([p0, p1, p2], () => nn, (t) => 0.0065 * (1 - t * 0.9) + 0.0006, () => 0.0035, 8);
      put(ft2, lk.geometry(5), null, (n, p) => { const t = clamp(p0.distanceTo(p) / len), c = shade(P.furG, P.furG, P.furS, n, 0.5); c.lerp(P.furL, sstep(0.7, 1, t) * 0.8); return c; });
    }
    // fur strokes on the pelt between the locks: 420 short flowing hairs, dark and pale, so the shell reads as fur and not as felt
    for (let k = 0; k < 420; k++) {
      const th = TH0 + 0.02 + hs(k, 51) * (TAU - 2 * TH0 - 0.04), v = 0.03 + 0.94 * hs(k, 52), dv = 0.07 + 0.07 * hs(k, 53), A1 = mPt(th, clamp(v + dv, 0, 1), 0.004), A2 = mPt(th, clamp(v - dv, 0, 1), 0.004), B = A1.p.y < A2.p.y ? A1 : A2, M0 = mPt(th, v, 0.0045), sd = (hs(k, 54) - 0.5) * 0.02;
      const side = V(0, 1, 0).cross(M0.n).normalize(), pts = [M0.p.clone().addScaledVector(side, -sd), M0.p.clone().lerp(B.p, 0.5).addScaledVector(M0.n, 0.003), B.p.clone().addScaledVector(side, sd)], ns = [M0.n, M0.n, B.n];
      put(FLN, ribbon(pts, ns, 0.0034 + 0.003 * hs(k, 55), 0.55), null, () => (k % 3 === 0 ? P.furL : k % 3 === 1 ? P.furG : P.furS).clone().lerp(P.fur, 0.25));
    }
    flush(ft2, vmat({ line: "#7a7264", rough: 0.95, role: "cloth", side: THREE.DoubleSide }), swayIn);
  }
  flush(FLN, vmat({ flat: true, rough: 0.95, po: -3 }), swayIn, false);
  // ---- 2 wolf masks, the pelt's two front ends, lying on the chest outside each brooch: 0.13 long x 0.10 wide, snout down and inward; flat, asleep
  for (const s of [-1, 1]) {
    const mb = bucket(), mk = bucket(), M = frame(s * 0.74, 0.705, 0.0, 0.35);
    const tw = new THREE.Matrix4().makeRotationZ(-s * 0.2); M.multiply(tw);
    const wH = (v) => 0.05 * Math.pow(Math.sin(Math.PI * clamp(0.05 + 0.9 * (1 - v))), 0.55) * (v > 0.55 ? 1 - 0.55 * ((v - 0.55) / 0.45) ** 1.3 : 1) + 0.004;   // v 0 at the crown, 1 at the nose
    const zH = (u, v) => 0.016 * Math.pow(Math.max(0, 1 - u * u), 0.6) * (1 - 0.5 * v ** 1.6) + 0.011;
    const at = (u, v) => V((u * 2 - 1) * wH(v), 0.065 - v * 0.13, 0.026 + zH(u * 2 - 1, v));   // origin: the mask's middle, y up, snout toward -y
    put(mb, grid(14, 14, at, false, null, () => V(0, 0, 1)), M, (n, p) => { const v = (0.065 - p.y) / 0.13, c = shade(P.fur, P.furS, P.furL, n, 0.9); c.lerp(col("#b9b1a2"), sstep(0.5, 0.85, v) * 0.9 * sstep(0.7, 0.25, Math.abs(p.x) / (wH(v) + 1e-3))); return c; });
    for (const e of [-1, 1]) { const ear = new THREE.ConeGeometry(0.0155, 0.035, 5); ear.scale(1, 1, 0.4); ear.rotateZ(-e * 0.35); put(mb, ear, M.clone().multiply(new THREE.Matrix4().makeTranslation(e * 0.03, 0.078, 0.037)), (n) => shade(P.furS, P.furG, P.fur, n)); }
    const nose = new THREE.SphereGeometry(0.0095, 10, 8); nose.scale(1.3, 0.9, 0.8); put(mk, nose, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.0635, 0.041)), (n) => shade(col("#2a2622"), col("#14110f"), col("#6b6258"), n));
    for (const e of [-1, 1]) { const pts = [], ns = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(V(e * (0.012 + 0.015 * u), 0.012 - 0.006 * Math.sin(u * Math.PI) + 0.0, 0.053).applyMatrix4(M)); ns.push(V(0, 0, 1).transformDirection(M)); } put(mk, ribbon(pts, ns, 0.0016, 0.3), null, () => col("#1f1b17")); }   // shut eye slits
    const mp = []; for (let i = 0; i <= 5; i++) { const u = i / 5; mp.push(V(0.001 * Math.sin(u * 3), -0.012 - 0.035 * u, 0.0475 - 0.006 * u).applyMatrix4(M)); } put(mk, ribbon(mp, mp.map(() => V(0, 0, 1).transformDirection(M)), 0.0013, 0.3), null, () => col("#4a443c"));
    for (let k = 0; k < 9; k++) { const x = (hs(k + 9 * (s > 0), 51) - 0.5) * 0.07, y0 = 0.045 - 0.1 * hs(k, 52), pts = [V(x, y0, 0.05).applyMatrix4(M), V(x * 1.02, y0 - 0.014, 0.053).applyMatrix4(M)]; put(mk, strip(pts, [V(0, 0, 1).transformDirection(M), V(0, 0, 1).transformDirection(M)], 0.0009), null, () => (k % 2 ? P.furL : P.furS).clone()); }
    flush(mb, vmat({ line: "#2a2620", rough: 0.95, role: "cloth" }), swayIn); flush(mk, vmat({ flat: true, rough: 0.9, po: -3 }), swayIn, false);
  }
  // ---- 2 brooches, BRONZE discs r 0.045 at (-0.19 and +0.19, 0.66): a raised rim, a 3-loop knot in relief, a boss r 0.008 and the pin; verdigris in 1 recess of 5
  for (const s of [-1, 1]) {
    const bb = bucket(), th = s * thFor(0.19, 0.66), M = frame(th, 0.66, 0.03, 0.4);
    const bz = (n, k = 1) => shade(P.bronze, P.bronzeS, P.bronzeL, n, k);
    const face = new THREE.CylinderGeometry(0.0425, 0.0425, 0.004, 32); face.rotateX(Math.PI / 2); put(bb, face, M, (n) => bz(n, 0.6).lerp(P.bronzeS, 0.2));
    const rim = new THREE.TorusGeometry(0.0425, 0.0045, 8, 40); rim.translate(0, 0, 0.0025); put(bb, rim, M, (n) => bz(n, 1.1));
    const boss = new THREE.SphereGeometry(0.008, 12, 9); boss.scale(1, 1, 0.8); boss.translate(0, 0, 0.004); put(bb, boss, M, (n) => bz(n, 1.2));
    const tre = (t) => V(Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t)), kp = [];
    for (let i = 0; i <= 120; i++) { const q = tre(i / 120 * TAU); kp.push(V(q.x * 0.0072, q.y * 0.0072, 0.0058 + 0.0011 * q.z)); }
    put(bb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kp, true), 160, 0.0023, 6, true), M, (n) => bz(n, 1.3));
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3, d = new THREE.CylinderGeometry(0.0046, 0.0046, 0.0012, 12); d.rotateX(Math.PI / 2); d.translate(Math.cos(a) * 0.0295, Math.sin(a) * 0.0295, 0.0032); const green = k === (s < 0 ? 1 : 3); put(bb, d, M, (n) => (green ? shade(P.verd, P.verd.clone().multiplyScalar(0.55), P.verd.clone().lerp(col("#ffffff"), 0.3), n) : shade(P.bronzeS, P.bronzeS.clone().multiplyScalar(0.6), P.bronze, n))); }
    const pin = new THREE.CapsuleGeometry(0.0022, 0.07, 3, 6); pin.rotateZ(Math.PI / 2 + 0.05); pin.translate(0, 0.0, -0.002); put(bb, pin, M, (n) => bz(n, 0.8));   // the pin runs across behind the disc and shows at both sides
    flush(bb, vmat({ line: "#3a2a12", rough: 0.4, role: "cloth" }), swayIn);
  }
  // ---- 2 chains: 78 OLD GOLD links 0.012 x 0.008 (36 + 42), swags between the brooches 0.42 and 0.50 long, sag 0.04 and 0.09, under the beard; every second link turned 90 degrees
  {
    const gb = bucket(), TH = thFor(0.19, 0.66);
    [[36, 0.42, 0.04, 0.667], [42, 0.50, 0.09, 0.655]].forEach(([n, L0, sag, yA], c) => {
      const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60, th = lerp(-TH, TH, u), y = yA - sag * (1 - Math.pow(2 * u - 1, 2)), q = bp(th, y, 0.036 + 0.004 * c); pts.push(q.p); }
      const cv = new THREE.CatmullRomCurve3(pts), len = cv.getLength();
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, p = cv.getPointAt(u), T = cv.getTangentAt(u).normalize(), nn = p.clone().sub(V(0, p.y, -0.0)).setY(0).normalize(), X = T, Y = nn.clone().cross(T).normalize().multiplyScalar(-1), Z = nn.clone();
        const link = new THREE.TorusGeometry(0.0026, 0.0013, 5, 12); link.scale(1.8, 1, 1);
        const turn = i % 2 ? Math.PI / 2 : 0, M = new THREE.Matrix4().makeBasis(X, Y, Z).multiply(new THREE.Matrix4().makeRotationX(turn)).setPosition(p);
        put(gb, link, M, (n2) => shade(P.gold, P.goldS, P.goldL, n2, 1.1));
      }
      void len; void L0;
    });
    flush(gb, vmat({ line: "#3a2a0e", rough: 0.35, role: "cloth" }), swayIn);
  }

  // ================================================================ MAIL (chest V from y 0.74 to the belt, skirt y 0.365 to 0.20 ending in 9 points 0.03 deep), UNDER-TUNIC, BELT, BUCKLE, POUCH, SHEATH
  const edgeX = (y) => 0.15 + (0.66 - y) * (0.052 / 0.66);   // the cloak's front edge: x 0.15 at the brooches, 0.20 at the hem
  const MAILN = { n: 0, rust: 0, gone: 0 };
  {
    const mb = bucket(), mt = bucket(), PITCH = 0.008, RR = 0.0055;
    const tones = [P.mail, P.mailS.clone().lerp(P.mail, 0.4), P.mailL.clone().lerp(P.mail, 0.35)];
    const ring = (x, y, off, idx) => {
      const q = sk(x, y, off), up = V(0, 1, 0), X = up.clone().cross(q.n).normalize(), Y = q.n.clone().cross(X).normalize();
      const k = hs(idx, 61), tone = tones[Math.floor(k * 3) % 3];
      if (hs(idx, 62) < 0.04) { MAILN.gone++; return; }   // 4 % missing
      const rust = (idx % 171 === 13 || idx % 163 === 47 || idx % 197 === 5) && MAILN.rust < 14;
      if (rust) MAILN.rust++;
      const a0 = 0.15 * Math.PI + 0.2 * (hs(idx, 63) - 0.5), a1 = a0 + 1.55 * Math.PI, pts = [], ns = [];
      for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); pts.push(q.p.clone().addScaledVector(X, Math.cos(a) * RR).addScaledVector(Y, Math.sin(a) * RR * 0.9)); ns.push(q.n); }
      put(mb, ribbon(pts, ns, 0.0014, 0.15), null, () => (rust ? P.mailR : tone).clone());
      const tk = [q.p.clone().addScaledVector(X, -RR * 0.55).addScaledVector(Y, RR * 0.7).addScaledVector(q.n, 0.0007), q.p.clone().addScaledVector(X, -RR * 0.1).addScaledVector(Y, RR * 0.95).addScaledVector(q.n, 0.0007)];
      put(mt, strip(tk, [q.n, q.n], 0.0006), null, () => P.mailL.clone());
      MAILN.n++;
    };
    let idx = 0;
    // chest: a V neckline (the mail starts lower at the middle), down to the belt's top edge
    for (let j = 0; j * PITCH < 0.74 - 0.432; j++) {
      const y = 0.74 - j * PITCH;
      for (let i = -30; i <= 30; i++) {
        const x = i * PITCH + (j % 2) * PITCH * 0.5, vtop = 0.585 + 1.1 * Math.abs(x);
        if (Math.abs(x) > edgeX(y) - 0.006 || y > Math.min(0.74, vtop)) continue;
        ring(x, y, 0.0085 + 0.0012 * ((i + j) % 2), idx++);
      }
    }
    // skirt: y 0.365 down to 0.20, a little off the body and flaring, ending in 9 points 0.03 deep
    const pts9 = 9, wid = 2 * (edgeX(0.2) - 0.006), pitch9 = wid / pts9;
    for (let j = 0; 0.365 - j * PITCH >= 0.17; j++) {
      const y = 0.365 - j * PITCH;
      for (let i = -30; i <= 30; i++) {
        const x = i * PITCH + (j % 2) * PITCH * 0.5; if (Math.abs(x) > edgeX(y) - 0.006) continue;
        const f = (((x + wid / 2) % pitch9) + pitch9) % pitch9 / pitch9, tooth = 0.03 * (1 - Math.abs(f * 2 - 1));   // 9 triangular points, each hanging 0.03 below y 0.20
        if (y < 0.20 - tooth) continue;
        ring(x, y, 0.011 + 0.03 * (0.365 - y) / 0.165 + 0.0012 * ((i + j) % 2), idx++);
      }
    }
    flush(mb, vmat({ flat: true, rough: 0.5, po: -3 }), root, false); flush(mt, vmat({ flat: true, rough: 0.5, po: -4 }), root, false);
    // a plain backing under the rings, so the chest reads as one mailed surface (the dark between the links)
    const bk = bucket(), g1 = grid(24, 22, (u, v) => { const y = lerp(0.74, 0.432, v), x = (u * 2 - 1) * (edgeX(y) - 0.006); return sk(x, y, 0.0065).p; }, false, null, () => V(0, 0, 1));
    put(bk, g1, null, () => col("#454a52"));
    const g2 = grid(24, 8, (u, v) => { const y = lerp(0.366, 0.185, v), x = (u * 2 - 1) * (edgeX(y) - 0.006); return sk(x, y, 0.0095 + 0.03 * (0.365 - y) / 0.165).p; }, false, null, () => V(0, 0, 1));
    put(bk, g2, null, () => col("#454a52"));
    flush(bk, vmat({ rough: 0.9, line: "#2a2e34" }), root, false);
  }
  // ---- under-tunic: y 0.20 to 0.10, hem band to 0.06; LEATHER, 12 pleats, hem #5a2f26
  {
    const tb = bucket(), PL = 12, Y0 = 0.205, Y1 = 0.10, Y2 = 0.058;
    const rowPt = (th, y) => { const yb = Math.max(y, 0.045), q = bp(th, yb, 0.0), flare = 1 + 0.12 * sstep(0.2, 0.06, y) + 0.04; q.p.x *= flare; q.p.z *= flare; q.p.y = y; return q; };
    const g = grid(PL * 8, 8, (u, v) => { const th = -Math.PI + u * TAU, y = lerp(Y0, Y2, v), pl = Math.sin(u * PL * TAU) * 0.0085 * (0.4 + v), q = rowPt(th, y), o = V(q.p.x, 0, q.p.z).normalize(); return q.p.clone().addScaledVector(o, 0.016 + pl + 0.008 * v); }, true, null, (c) => V(c.x, 0, c.z));
    put(tb, g, null, (n, p, i) => { const v = Math.floor(i / (PL * 8 + 1)) / 8, c = shade(P.leather, P.leatherS, P.leatherL, n, 0.8); c.lerp(col("#5a2f26"), sstep(Y0 - Y1 * 0, 1, 0) + sstep(0.72, 0.8, v)); return c; });
    flush(tb, vmat({ line: "#2a1a10", rough: 0.8, role: "cloth", side: THREE.DoubleSide }), root);
  }
  // ---- belt: 0.07 high, centre y 0.40, LEATHER; 2 stitch rows of 60, 7 BRONZE studs r 0.007 each side of the buckle at 0.045 pitch, a free end hanging 0.14 at his left with a bronze tip
  {
    const bb = bucket(), bz = bucket(), st = bucket(), YB = 0.40, W = 0.035, T = 0.012;
    const bg = grid(240, 6, (u, v) => { const th = -Math.PI + u * TAU, q = bp(th, YB + (0.5 - v) * 2 * W * 0 + (v - 0.5) * 2 * W, 0.0); return q.p.clone().addScaledVector(q.n, 0.0065 + T * 0.5 * (1 - Math.pow(Math.abs(v - 0.5) * 2, 3))); }, true, null, (c) => V(c.x, 0, c.z));
    put(bb, bg, null, (n) => shade(P.leather, P.leatherS, P.leatherL, n, 0.9));
    for (const yy of [YB + 0.021, YB - 0.021]) for (let i = 0; i < 60; i++) {   // 2 stitch rows, 60 stitches each, along the front
      const th = lerp(-1.32, 1.32, (i + 0.5) / 60), q = bp(th, yy, 0.0066 + T * 0.5 * (1 - Math.pow((yy - YB) / W, 2) * 0.9)), X = V(0, 1, 0).cross(q.n).normalize();
      put(st, strip([q.p.clone().addScaledVector(X, -0.0045), q.p.clone().addScaledVector(X, 0.0045)], [q.n, q.n], 0.0007), null, () => col("#8a6a4a"));
    }
    for (const s of [-1, 1]) for (let k = 0; k < 7; k++) {   // 7 studs r 0.007 each side, 0.045 pitch from the buckle
      const x = s * (0.0885 + 0.045 * k), th = Math.sign(x) * thFor(Math.abs(x), YB), M = frame(th, YB, 0.0125 , 0.5), sp = new THREE.SphereGeometry(0.007, 12, 8); sp.scale(1, 1, 0.55);
      put(bz, sp, M, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n, 1.1));
    }
    // the free end: 0.14 long hanging at his left of the buckle, a bronze tip
    { const q0 = sk(0.082, YB - W + 0.004, 0.0105), q1 = sk(0.088, YB - W - 0.136, 0.0125), pts = [q0.p, q0.p.clone().lerp(q1.p, 0.5).add(V(0.003, 0, 0.003)), q1.p], ns = [q0.n, q0.n, q1.n];
      put(bb, strip(pts, ns, 0.0125), null, (n) => shade(P.leather, P.leatherS, P.leatherL, n, 0.9));
      const tip = new THREE.CapsuleGeometry(0.0125, 0.016, 3, 8); tip.scale(1, 1, 0.35); put(bz, tip, new THREE.Matrix4().makeTranslation(q1.p.x, q1.p.y - 0.004, q1.p.z + 0.001), (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n)); }
    flush(bb, vmat({ line: "#2a1a10", rough: 0.7, role: "cloth", side: THREE.DoubleSide }), root); flush(bz, vmat({ line: "#3a2a12", rough: 0.35 }), root); flush(st, vmat({ flat: true, rough: 0.9, po: -4 }), root, false);
    // the buckle: plate 0.11 x 0.085, frame 0.008, a square knot of 2 interlaced loops (8 crossings), 4 corner dots, rubbed bright on the high lines
    const kb = bucket(), M = frame(0, YB, 0.0165, 0.5), bz2 = (n, k = 1) => { const c = shade(P.bronze, P.bronzeS, P.bronzeL, n, k); c.lerp(P.bronzeL, 0.28 * sstep(0.5, 1, n.z)); return c; };
    const plate = new THREE.BoxGeometry(0.11, 0.085, 0.003); put(kb, plate, M, (n) => shade(P.bronzeS.clone().lerp(P.bronze, 0.35), P.bronzeS, P.bronze, n, 0.7));
    for (const [w, h, cx, cy] of [[0.11, 0.008, 0, 0.0385], [0.11, 0.008, 0, -0.0385], [0.008, 0.085, 0.051, 0], [0.008, 0.085, -0.051, 0]]) { const bar = new THREE.BoxGeometry(w, h, 0.0045); bar.translate(cx, cy, 0.0022); put(kb, bar, M, (n) => bz2(n, 1.2)); }
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const d = new THREE.SphereGeometry(0.0042, 8, 6); d.scale(1, 1, 0.6); d.translate(cx * 0.0405, cy * 0.0275, 0.0045); put(kb, d, M, (n) => bz2(n, 1.3)); }
    const sq = (t, rot, r) => { const a = t, c = Math.cos(a), s = Math.sin(a), e = 3.4, x = Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * r, y = Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * r, cr = Math.cos(rot), sr = Math.sin(rot); return [x * cr - y * sr, x * sr + y * cr]; };
    for (let L2 = 0; L2 < 2; L2++) {
      const pts = [], rot = L2 ? Math.PI / 4 : 0, r = L2 ? 0.0225 : 0.0215;
      for (let i = 0; i < 96; i++) { const t = i / 96 * TAU, [x, y] = sq(t, rot, r), z = 0.0055 + 0.0011 * Math.sin(4 * t + (L2 ? 0 : Math.PI)); pts.push(V(x, y * 0.84, z)); }   // the over / under alternates 8 times round
      put(kb, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 192, 0.0027, 6, true), M, (n) => bz2(n, 1.4));
    }
    flush(kb, vmat({ line: "#3a2a12", rough: 0.35 }), root);
  }
  // ---- pouch 0.10 x 0.11 x 0.04 on his right hip (flap, horn toggle, 12 stitches) and a knife sheath 0.16 on his left hip, 15 degrees off level (handle bound with 6 turns of cord, a bronze cap; no blade)
  {
    const pb = bucket(), pz = bucket(), ps = bucket(), M = frame(-thFor(0.15, 0.30), 0.30, 0.058, 0.35);
    const LEA = (n, k = 0.9) => shade(P.leather, P.leatherS, P.leatherL, n, k), rbox = (w, h, d, r) => { const g = new THREE.BoxGeometry(w, h, d, 6, 6, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ex = Math.max(0, Math.abs(x) - (w / 2 - r)), ey = Math.max(0, Math.abs(y) - (h / 2 - r)), ez = Math.max(0, Math.abs(z) - (d / 2 - r)), l = Math.hypot(ex, ey, ez); if (l > r) { const k = r / l; p.setXYZ(i, Math.sign(x) * (Math.abs(x) - ex + ex * k), Math.sign(y) * (Math.abs(y) - ey + ey * k), Math.sign(z) * (Math.abs(z) - ez + ez * k)); } } g.computeVertexNormals(); return g; };
    put(pb, rbox(0.10, 0.11, 0.04, 0.008), M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.055, 0)), (n) => LEA(n));
    const flap = rbox(0.104, 0.056, 0.012, 0.005); put(pb, flap, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.026, 0.0235)), (n) => LEA(n, 1.1).lerp(P.leatherL, 0.1));
    const lp = rbox(0.016, 0.03, 0.008, 0.003); put(pb, lp, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.012, 0.006)), (n) => LEA(n));   // the belt loop
    const tg = new THREE.CapsuleGeometry(0.0055, 0.022, 4, 8); tg.rotateZ(Math.PI / 2); put(pz, tg, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.050, 0.034)), (n) => shade(col("#d9cfb5"), col("#a39a82"), col("#f4ecd6"), n));   // horn toggle
    const tl = new THREE.TorusGeometry(0.008, 0.0016, 5, 12); tl.scale(1.3, 1, 1); put(ps, tl, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.037, 0.0295)), () => P.leatherK);
    for (let i = 0; i < 12; i++) { const a = i / 12, side = Math.floor(a * 3), k = a * 3 - side, px = [-0.044 + 0.088 * k, 0.044, 0.044 - 0.088 * k][side] , py = [-0.003, -0.003 - 0.03 * k * 0 , -0.003][side]; const ang = i / 12 * Math.PI; void px; void py; void ang;
      const u = (i + 0.5) / 12, x = lerp(-0.044, 0.044, u), y = -0.0035 - 0.043 * (1 - Math.pow(Math.sin(u * Math.PI), 0.5)) * 0 - 0.026 * Math.pow(Math.abs(u * 2 - 1), 2.2);
      put(ps, strip([V(x - 0.0001, y + 0.0032, 0.03).applyMatrix4(M), V(x + 0.0001, y - 0.0032, 0.03).applyMatrix4(M)], [V(0, 0, 1).transformDirection(M), V(0, 0, 1).transformDirection(M)], 0.0007), null, () => col("#8a6a4a")); }
    // the sheath: 0.16 long in all, 15 degrees off level, on his left hip; the grip bound with 6 turns of cord, a bronze cap
    const MS = frame(thFor(0.185, 0.275), 0.275, 0.058, 0.35).multiply(new THREE.Matrix4().makeRotationZ(-15 * DEG));
    const sh = new THREE.CapsuleGeometry(0.0155, 0.1, 5, 12); sh.rotateZ(Math.PI / 2); sh.scale(1, 1, 0.55); put(pb, sh, MS.clone().multiply(new THREE.Matrix4().makeTranslation(-0.03, 0, 0)), (n) => LEA(n));
    const mouth = new THREE.TorusGeometry(0.0165, 0.003, 6, 16); mouth.rotateY(Math.PI / 2); mouth.scale(1, 1, 0.58); mouth.translate(0.0225, 0, 0); put(pz, mouth, MS, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n));
    const hd = new THREE.CapsuleGeometry(0.0115, 0.036, 4, 10); hd.rotateZ(Math.PI / 2); hd.scale(1, 1, 0.8); put(pb, hd, MS.clone().multiply(new THREE.Matrix4().makeTranslation(0.052, 0, 0)), (n) => shade(col("#7a5632"), col("#4a3018"), col("#a8814f"), n));
    for (let k = 0; k < 6; k++) { const x = 0.037 + 0.0125 * (k / 5) * 2.0 * 0.62 + k * 0.0016, tr = new THREE.TorusGeometry(0.0121, 0.0016, 5, 12); tr.rotateY(Math.PI / 2); tr.scale(1, 1, 0.82); put(ps, tr, MS.clone().multiply(new THREE.Matrix4().makeTranslation(x, 0, 0)), () => (k % 2 ? col("#d9cfb5") : col("#b8aa88"))); }
    const cap = new THREE.SphereGeometry(0.0125, 12, 8); cap.scale(1, 1, 0.8); put(pz, cap, MS.clone().multiply(new THREE.Matrix4().makeTranslation(0.0795, 0, 0)), (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n, 1.1));
    flush(pb, vmat({ line: "#2a1a10", rough: 0.7, role: "cloth" }), root); flush(pz, vmat({ line: "#3a2a12", rough: 0.4 }), root); flush(ps, vmat({ flat: true, rough: 0.8, po: -4 }), root, false);
  }

  // ================================================================ CLOAK (CLOAK BLUE wool, lining grey): from under the mantle to y -0.07 at the sides and back; front open, edges at x 0.15 (brooches) to 0.20 (hem), front corners cut up to y +0.05
  // Below the belt it hangs plumb: every vertex there turns back 80 % of the body's pitch and roll about the belt line (apply). BEND holds those meshes.
  const BEND = [];
  const bendable = (m) => { if (!m) return null; m.frustumCulled = false; const g = m.geometry; BEND.push({ g, p0: g.attributes.position.array.slice(), n0: g.attributes.normal ? g.attributes.normal.array.slice() : null }); return m; };
  const cloakR = (y) => [keyF([[-0.08, 0.455], [0.07, 0.44], [0.30, 0.395], [0.5, 0.375], [0.8, 0.40], [0.95, 0.40]], y), keyF([[-0.08, 0.465], [0.07, 0.445], [0.3, 0.395], [0.5, 0.365], [0.8, 0.345], [0.95, 0.34]], y)];
  const thE = (y) => Math.asin(clamp(edgeX(clamp(y, -0.07, 0.8)) / cloakR(y)[0], 0, 0.95));   // the front edge's angle at height y
  const hemY = (th) => { const a = Math.abs(wrapPi(th)), te = thE(0.05); return -0.07 + 0.12 * sstep(1.45, te + 0.02, a) + 0.011 * Math.sin(th * 7 + 0.9) * sstep(te, 0.9, a) + 0.007 * Math.sin(th * 13 + 2.1); };
  const FOLDS = [...[-0.8, -0.4, 0, 0.4, 0.8].map((d) => [Math.PI + d, 0.15, 1]), ...[1, -1].flatMap((s) => [0.92, 1.4, 1.9].map((a) => [s * a, 0.17, 0.85]))];   // 11 deep folds: 5 back, 3 each side
  const foldAt = (th, y) => { let f = 0; const A = 0.010 + 0.036 * sstep(0.74, -0.07, y); for (const [t0, w, k] of FOLDS) { const d = wrapPi(th - t0 - 0.05 * (0.8 - y) * Math.sign(Math.sin(t0))); f += A * k * (gauss(d, w) - 0.32 * gauss(wrapPi(d + w * 1.55), w * 0.8) - 0.32 * gauss(wrapPi(d - w * 1.55), w * 0.8)); } return f + A * 0.18 * Math.sin(th * 5 + y * 3); };
  const cloakPt = (th, y, extra = 0) => { const [rx, rz] = cloakR(y), f = foldAt(th, y), x = (rx + f + extra) * Math.sin(th), z = (rz + f + extra) * Math.cos(th) - 0.005; return V(x, y, z); };
  const cloakN = (th, y) => { const [rx, rz] = cloakR(y); return V(Math.sin(th) / rx, 0.12, Math.cos(th) / rz).normalize(); };
  const cloakRow = (th, w) => { const y0 = 0.80, yh = hemY(th); return lerp(y0, yh, w); };
  const CNU = 168, CNV = 40;
  {
    const cb = bucket(), cl = bucket(), MUD = col("#3a3a36"), cc = (th, y, n) => { const rr = hemY(th); return { rr }; };
    const at = (u, v) => { const w = v; const yApprox = lerp(0.8, -0.07, w), th0 = thE(yApprox), th = lerp(th0, TAU - th0, u); return cloakPt(th, cloakRow(th, w)); };
    const geo = grid(CNU, CNV, at, false, null, (c) => V(c.x, 0.05, c.z));
    put(cb, geo, null, (n, p, i) => {
      const j = Math.floor(i / (CNU + 1)), v = j / CNV, th = Math.atan2(p.x, p.z), y = p.y, h = hemY(th), f = foldAt(th, y), A = 0.010 + 0.036 * sstep(0.74, -0.07, y);
      const c = shade(P.cloak, P.cloakS, P.cloakL, n, 0.9), vk = clamp(0.5 + f / (2.2 * A));
      c.lerp(P.cloakF, 0.55 * sstep(0.46, 0.05, vk)); c.lerp(P.cloakL, 0.2 * sstep(0.62, 0.95, vk));
      c.lerp(P.cloakS, 0.12 * hs(Math.floor(p.x * 120) + 31 * Math.floor(p.y * 120), 4));   // wool weave: a fine, uneven grain
      const mudH = 0.06 + 0.02 * Math.sin(th * 9 + 1) + 0.01 * hs(Math.floor((th + 4) * 14), 6);   // the mud band #3a3a36 0.06 high
      if (y < h + mudH) { const k = sstep(h + mudH, h + mudH - 0.012, y); c.lerp(MUD, k * (Math.abs(wrapPi(th)) > 1.2 ? 0.95 : 0.6)); }
      return c;
    });
    bendable(flush(cb, vmat({ line: "#1a2030", rough: 0.95, role: "cloth", side: THREE.FrontSide }), root));
    // the lining, grey, seen inside the open front and over the arms: the same surface, its back
    const lg = grid(CNU, CNV, at, false, null, (c) => V(-c.x, -0.05, -c.z));
    put(cl, lg, null, (n, p) => { const c = shade(P.lin, P.linS, P.lin.clone().lerp(col("#ffffff"), 0.2), n, 0.5); c.lerp(P.linS, 0.15 * hs(Math.floor(p.x * 90) + 17 * Math.floor(p.y * 90), 8)); return c; });
    bendable(flush(cl, vmat({ rough: 0.95, role: "lining", side: THREE.FrontSide, line: "#3a3e4c" }), root));
  }
  // ---- wool hatching, 2 small holes, 1 darned patch with 9 stitches, 9 mud splashes at the back hem
  {
    const hk = bucket(), dk3 = bucket();
    for (let k = 0; k < 560; k++) {
      const th = TH0 + (TAU - 2 * TH0) * hs(k, 71), y = lerp(0.74, -0.05, Math.pow(hs(k, 72), 0.9));
      if (y < hemY(th) + 0.02 || Math.abs(wrapPi(th)) < thE(y) + 0.03) continue;
      const ang = (hs(k, 73) - 0.5) * 0.7 + (k % 2 ? 0 : 1.5707), len = 0.016 + 0.016 * hs(k, 74), p = cloakPt(th, y, 0.0016), n = cloakN(th, y), tg = V(Math.cos(th), 0, -Math.sin(th)), dir = tg.clone().multiplyScalar(Math.sin(ang)).addScaledVector(V(0, 1, 0), Math.cos(ang)).normalize();
      put(hk, ribbon([p.clone().addScaledVector(dir, -len / 2), p, p.clone().addScaledVector(dir, len / 2)], [n, n, n], 0.0014, 0.3), null, () => (k % 3 === 0 ? P.cloakL : P.cloakS).clone().lerp(P.cloak, 0.5));
    }
    // 2 small holes (a darker patch of the lining shows through)
    for (const [th, y, r] of [[2.0, 0.37, 0.0085], [-1.55, 0.22, 0.007]]) { const p = cloakPt(th, y, 0.0012), n = cloakN(th, y), pts = [], ns = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU, rj = 0.85 + 0.3 * hs(i % 12, 81); pts.push(p.clone().addScaledVector(V(Math.cos(th), 0, -Math.sin(th)), Math.cos(a) * r * rj).addScaledVector(V(0, 1, 0), Math.sin(a) * r * 1.15 * rj)); ns.push(n); }
      const fan = new THREE.BufferGeometry(), pos = [p.x, p.y, p.z, ...pts.flatMap((q) => [q.x, q.y, q.z])], idx = []; for (let i = 0; i < 12; i++) idx.push(0, i + 1, i + 2); fan.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fan.setIndex(idx); fan.computeVertexNormals();
      put(dk3, fan, null, () => col("#12141c")); put(dk3, ribbon(pts, ns, 0.0016, 0.3), null, () => P.cloakF.clone()); }
    // the darned patch: 0.07 x 0.06, a slightly lighter weave, 9 darning stitches across it
    { const th0 = -2.55, y0 = 0.30, tg = V(Math.cos(th0), 0, -Math.sin(th0)), pat = (a, b, off) => cloakPt(th0 + a * 0.035 / cloakR(y0)[0], y0 + b * 0.03, off);
      const g = grid(4, 4, (u, v) => pat(u * 2 - 1, v * 2 - 1, 0.0014), false, null, (c) => V(c.x, 0, c.z)); put(hk, g, null, (n) => shade(P.cloak.clone().lerp(P.cloakL, 0.25), P.cloakS, P.cloakL, n, 0.7));
      for (let k = 0; k < 9; k++) { const b = -0.82 + 1.64 * k / 8, pts = [], ns = []; for (let i = 0; i <= 6; i++) { const a = -0.85 + 1.7 * i / 6, q = pat(a, b + 0.04 * Math.sin(i + k) * 0.3, 0.0026); pts.push(q); ns.push(cloakN(th0, y0)); } put(dk3, strip(pts, ns, 0.0009), null, () => col("#a69a82")); }
      const bd = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]) for (let i = 0; i < 5; i++) bd.push(pat(a, b, 0.0022)); void bd; void tg; }
    // 9 splashes of mud at the back hem
    for (let k = 0; k < 9; k++) { const th = Math.PI + (k - 4) * 0.2 + 0.07 * (hs(k, 91) - 0.5), y = hemY(th) + 0.065 + 0.05 * hs(k, 92), r = 0.006 + 0.006 * hs(k, 93), p = cloakPt(th, y, 0.0016), n = cloakN(th, y), pts = [], ns = [];
      for (let i = 0; i <= 10; i++) { const a = i / 10 * TAU, rj = 0.7 + 0.5 * hs(i % 10 + k * 3, 94); pts.push(p.clone().addScaledVector(V(Math.cos(th), 0, -Math.sin(th)), Math.cos(a) * r * rj).addScaledVector(V(0, 1, 0), Math.sin(a) * r * rj * 0.9)); ns.push(n); }
      const fan = new THREE.BufferGeometry(), pos = [p.x, p.y, p.z, ...pts.flatMap((q) => [q.x, q.y, q.z])], idx = []; for (let i = 0; i < 10; i++) idx.push(0, i + 1, i + 2); fan.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fan.setIndex(idx); fan.computeVertexNormals(); put(dk3, fan, null, () => col("#3a3a36")); }
    bendable(flush(hk, vmat({ flat: true, rough: 0.95 }), root, false)); bendable(flush(dk3, vmat({ flat: true, rough: 0.95, po: -4 }), root, false));
  }
  // ---- knotwork trim: a band 0.055 wide, 0.02 in from both front edges and the whole hem; OLD GOLD, a 2-strand interlace with one crossing every 0.045 (46 on the hem, 17 on each front edge = 80), between 2 lines of 0.004
  const TRIM = { crossings: 0 };
  {
    const tb = bucket(), tw = bucket(), tl = bucket(), BAND = 0.055, strandW = 0.0043, GOLD = (n, wear) => { const c = shade(P.gold, P.goldS, P.goldL, n, 1.1); if (wear) c.lerp(P.goldW, 0.85); return c; };
    // one band along a path: pathFn(s) -> {p, n, side} for s in 0..L (m); N crossings
    const band = (pathFn, L, N, wornAt) => {
      const pitch = L / N, K = 14, edgeL = [], edgeR = [], nl = [];
      for (let i = 0; i <= N * K; i++) { const s = i / K * pitch, q = pathFn(s), a = Math.PI * s / pitch; edgeL.push(q.p.clone().addScaledVector(q.side, BAND / 2 - 0.002).addScaledVector(q.n, 0.0018)); edgeR.push(q.p.clone().addScaledVector(q.side, -(BAND / 2 - 0.002)).addScaledVector(q.n, 0.0018)); nl.push(q.n); void a; }
      put(tl, strip(edgeL, nl, 0.002), null, (n) => GOLD(n, false)); put(tl, strip(edgeR, nl, 0.002), null, (n) => GOLD(n, false));
      for (let strand = 0; strand < 2; strand++) for (let m = 0; m < N; m++) {   // each strand a piece per crossing, over at the even crossings or the odd, so it passes over and under
        const pts = [], ns = [], A = BAND / 2 - 0.0125;
        for (let i = 0; i <= K; i++) {
          const s = (m + i / K) * pitch, q = pathFn(s), ph = Math.PI * (m + i / K) + (strand ? Math.PI : 0), lat = A * Math.sin(ph + Math.PI / 2 * 0), lift = 0.0016 * Math.cos(Math.PI * (m + i / K) + (strand ? Math.PI : 0)) * Math.cos(0);
          void lift; const over = ((m + strand) % 2 === 0) ? 1 : 0;
          pts.push(q.p.clone().addScaledVector(q.side, strand ? -lat : lat).addScaledVector(q.n, 0.0028 + 0.0016 * over * Math.sin(Math.PI * i / K)));
          ns.push(q.n);
        }
        const worn = hs(m * 2 + strand + 100 * L, 15) < (wornAt ? wornAt(m / N) : 0.05);
        put(tb, strip(pts, ns, strandW), null, (n) => GOLD(n, worn));
        // a darker inner line down each strand's middle: the thread's twist
        put(tw, ribbon(pts.map((p, i) => p.clone().addScaledVector(ns[i], 0.0014)), ns, 0.0009, 0.2), null, () => P.goldS.clone());
        TRIM.crossings += strand === 0 ? 1 : 0;
      }
    };
    // the hem (46 crossings), from the front corner round the back to the other
    { const te = thE(0.06) + 0.012, thA = te, thB = TAU - te, S = 400, tab = [0], pt = (th) => cloakPt(th, hemY(th) + 0.0475, 0.0);
      for (let i = 1; i <= S; i++) tab.push(tab[i - 1] + pt(lerp(thA, thB, i / S)).distanceTo(pt(lerp(thA, thB, (i - 1) / S))));
      const L = tab[S], thAt = (s) => { let i = 1; while (i < S && tab[i] < s) i++; return lerp(thA, thB, (i - 1 + (s - tab[i - 1]) / Math.max(1e-9, tab[i] - tab[i - 1])) / S); };
      band((s) => { const th = thAt(clamp(s, 0, L)), p = pt(th), th2 = thAt(clamp(s + 0.004, 0, L)), p2 = pt(th2), T = p2.clone().sub(p).normalize(), n = cloakN(th, hemY(th) + 0.0475), side = n.clone().cross(T).normalize().multiplyScalar(-1); return { p, n, side }; }, L, 46, (f) => 0.04 + 0.5 * (f > 0.25 && f < 0.75 ? 1 : 0));
    }
    // the two front edges (17 crossings each): from the brooch level down to the hem corner; the right (his right, -x) edge is the worn one
    for (const s of [-1, 1]) {
      const yTop = 0.70, yBot = hemY(s * thE(0.05)) + 0.058, S = 200, edgeP = (y) => { const th = s * (thE(y) + 0.0475 / cloakR(y)[0]); return cloakPt(th, y, 0.0); }, tab = [0];
      for (let i = 1; i <= S; i++) tab.push(tab[i - 1] + edgeP(lerp(yTop, yBot, i / S)).distanceTo(edgeP(lerp(yTop, yBot, (i - 1) / S))));
      const L = tab[S], yAt = (sd) => { let i = 1; while (i < S && tab[i] < sd) i++; return lerp(yTop, yBot, (i - 1 + (sd - tab[i - 1]) / Math.max(1e-9, tab[i] - tab[i - 1])) / S); };
      band((sd) => { const y = yAt(clamp(sd, 0, L)), y2 = yAt(clamp(sd + 0.004, 0, L)), p = edgeP(y), p2 = edgeP(y2), T = p2.clone().sub(p).normalize(), th = s * (thE(y)), n = cloakN(th, y), side = n.clone().cross(T).normalize().multiplyScalar(-1); return { p, n, side }; }, L, 17, () => (s < 0 ? 0.33 : 0.04));
    }
    // 3-loop knots: 0.22 x 0.20 at the centre back hem, 0.12 at each front corner (a trefoil drawn over and under)
    const knot = (th0, y0, size, wear) => {
      const tre = (t) => V(Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t)), k = size / 5.4, pts = [], ns = [], r0 = cloakR(y0)[0];
      for (let i = 0; i <= 150; i++) { const q = tre(i / 150 * TAU), th = th0 + q.x * k / r0, y = y0 + q.y * k * 0.93 + 0.06 * k * 2.2 * 0; pts.push(cloakPt(th, y, 0.0028 + 0.0019 * q.z)); ns.push(cloakN(th, y)); }
      const edge = pts.map((p, i) => p.clone().addScaledVector(ns[i], 0.0016));
      put(tb, strip(pts.slice(0, 151), ns, size * 0.019 + 0.0012), null, (n) => GOLD(n, wear)); put(tl, strip(edge, ns, size * 0.0042), null, () => P.goldS.clone());
    };
    knot(Math.PI, hemY(Math.PI) + 0.0475 + 0.155, 0.21, true);   // the back knot sits on the hem band, worn
    for (const s of [-1, 1]) knot(s * (thE(0.06) + 0.045), hemY(s * thE(0.06)) + 0.095, 0.12, s < 0);
    bendable(flush(tb, vmat({ line: "#4a3410", rough: 0.4, role: "cloth" }), root)); bendable(flush(tl, vmat({ flat: true, rough: 0.45, po: -4 }), root, false)); bendable(flush(tw, vmat({ flat: true, rough: 0.6, po: -5 }), root, false));
    out.measure.trim = TRIM;
  }

  // ================================================================ SLEEVES (#3b4560, 0.11 wide at the shoulder to 0.085, 16 fold lines), BRACERS, SHOULDER FLAPS, BOOTS
  const SLV = col("#3b4560"), SLVS = col("#262e44"), SLVL = col("#55638a");
  const slvM = vmat({ line: "#141a2a", rough: 0.95, role: "cloth", side: THREE.DoubleSide }), liningM = vmat({ line: "#3a3e4c", rough: 0.95, role: "lining", side: THREE.DoubleSide });
  const arm = { L: {}, R: {} };
  const mkSleeve = () => { const m = new THREE.Mesh(new THREE.BufferGeometry(), slvM); m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); return m; };
  const mkCuff = () => { const m = new THREE.Mesh(new THREE.BufferGeometry(), slvM); m.castShadow = true; m.frustumCulled = false; m.visible = false; ch.root.add(m); return m; };
  const NS = 40, NR = 48, FOLDN = 16;
  const sleeveGeo = (curve, ua, ub, rad, n0, seed) => {
    const pos = [], col3 = [], idx = [], N = n0.clone(), Tn = V(0, 0, 0), Bn = V(0, 0, 0);
    for (let i = 0; i <= NS; i++) {
      const w = i / NS, u = ua + (ub - ua) * w, p = curve.getPointAt(u); curve.getTangentAt(u, Tn); N.addScaledVector(Tn, -N.dot(Tn)).normalize(); Bn.crossVectors(Tn, N);
      for (let k = 0; k <= NR; k++) {
        const a = (k / NR) * TAU, rip = Math.sin(a * FOLDN + seed + w * 1.7) , r = rad(w) * (1 + 0.045 * rip * sstep(0.04, 0.3, w) * (1 - 0.6 * sstep(0.8, 1, w)));
        pos.push(p.x + r * (Math.cos(a) * N.x + Math.sin(a) * Bn.x), p.y + r * (Math.cos(a) * N.y + Math.sin(a) * Bn.y), p.z + r * (Math.cos(a) * N.z + Math.sin(a) * Bn.z));
        const trough = sstep(0.1, -0.85, rip), c = SLV.clone().lerp(SLVS, 0.62 * trough * sstep(0.04, 0.3, w)).lerp(SLVL, 0.22 * sstep(0.5, 1, rip) * sstep(0.04, 0.3, w)); col3.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < NS; i++) for (let k = 0; k < NR; k++) { const a = i * (NR + 1) + k, b = a + NR + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col3, 3)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= NS; i++) { const a = i * (NR + 1), b = a + NR, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  };
  slvM.vertexColors = true; slvM.color.set("#ffffff");
  // a bracer in its own frame: axis +y, the up side +z (LEATHER, 3 straps with bronze studs; the left one carries 9 claw scratches)
  const mkBracer = (len, claws) => {
    const g = new THREE.Group(), lb = bucket(), bz = bucket(), sc = bucket(), R0 = ch.limbW + 0.0065, hh = len / 2;
    const lat = new THREE.LatheGeometry([[R0 - 0.002, -hh], [R0 + 0.0018, -hh + 0.001], [R0 + 0.0042, -hh + 0.004], [R0 + 0.0045, -hh + 0.009], [R0 + 0.004, 0], [R0 + 0.0045, hh - 0.009], [R0 + 0.0042, hh - 0.004], [R0 + 0.0018, hh - 0.001], [R0 - 0.002, hh]].map(([r, y]) => new THREE.Vector2(r, y)), 28); lat.rotateX(Math.PI / 2); lat.rotateX(-Math.PI / 2);
    put(lb, lat, null, (n, p) => { const c = shade(P.leather, P.leatherS, P.leatherL, n, 0.9), a = Math.atan2(p.z, p.x); c.lerp(P.leatherL, 0.18 * hs(Math.floor((a + 4) * 9) + Math.floor(p.y * 90), 9)); c.lerp(P.rubbed, 0.5 * sstep(hh - 0.011, hh, Math.abs(p.y))); return c; });
    const nSt = 3; for (let k = 0; k < nSt; k++) {   // 3 straps across, each with a bronze stud at its side
      const y = lerp(-hh + 0.022, hh - 0.022, nSt === 1 ? 0.5 : k / (nSt - 1)) * (len > 0.15 ? 0.95 : 0.9), t = new THREE.TorusGeometry(R0 + 0.0052, 0.0034, 5, 28); t.rotateX(Math.PI / 2); t.translate(0, y, 0); put(lb, t, null, (n) => shade(P.leatherS.clone().lerp(P.leather, 0.5), P.leatherK, P.leather, n, 0.7));
      const s = new THREE.SphereGeometry(0.0048, 8, 6); s.scale(1, 1, 0.6); s.translate(0.0, y, R0 + 0.0098); put(bz, s, null, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n, 1.1));
      const bk = new THREE.TorusGeometry(0.0052, 0.0013, 5, 12); bk.rotateX(0); bk.translate(R0 * 0.0 - 0.0, y, 0); void bk;
    }
    if (claws) for (let k = 0; k < 9; k++) {   // 9 claw scratches, pale and criss-crossed
      const a0 = (-0.55 + 1.1 * hs(k, 101)) , y0 = (hs(k, 102) - 0.5) * (len - 0.05), lenS = 0.025 + 0.03 * hs(k, 103), ang = (k % 2 ? 1 : -1) * (0.45 + 0.5 * hs(k, 104)), pts = [], ns = [];
      for (let i = 0; i <= 6; i++) { const u = i / 6 - 0.5, y = y0 + Math.cos(ang) * u * lenS, a = a0 + Math.sin(ang) * u * lenS / R0, r = R0 + 0.0052; pts.push(V(Math.sin(a) * r, y, Math.cos(a) * r)); ns.push(V(Math.sin(a), 0, Math.cos(a))); }
      put(sc, ribbon(pts, ns, 0.0012, 0.4), null, () => col("#d8b98a"));
    }
    flush(lb, vmat({ line: "#2a1a10", rough: 0.65, role: "cloth", side: THREE.DoubleSide }), g); flush(bz, vmat({ line: "#3a2a12", rough: 0.4 }), g); flush(sc, vmat({ flat: true, rough: 0.9, po: -4 }), g, false);
    g.visible = false; ch.root.add(g); return g;
  };
  // a shoulder flap in its own frame: the cloak's grey lining thrown over the upper arm, 0.26 long, 5 folds, an arch over the arm (open to the inside)
  const mkFlap = (s) => {
    const g = new THREE.Group(), fb = bucket(), fl = bucket(), LEN = 0.26, NFA = 30, NFV = 12;
    const at = (u, v) => { const a = lerp(-1.95, 1.95, u), r = lerp(0.066, 0.058, v) + 0.007 * Math.sin(a * 4 + 0.5) * (0.4 + 0.6 * v), hem = 0.012 * Math.sin(u * TAU * 2.5 + 0.6) * sstep(0.7, 1, v); return V(s * Math.cos(a) * r, -v * LEN - hem, Math.sin(a) * r); };
    const geo = grid(NFA, NFV, at, false, null, (c) => V(s * c.x, 0, c.z));
    put(fb, geo, null, (n, p) => { const c = shade(P.lin, P.linS, P.lin.clone().lerp(col("#ffffff"), 0.2), n, 0.6), a = Math.atan2(p.z, p.x * s); c.lerp(P.linS, 0.35 * gauss(Math.sin(a * 5 + 0.6), 0.35)); return c; });
    flush(fb, vmat({ line: "#3a3e4c", rough: 0.95, role: "lining", side: THREE.DoubleSide }), g);
    for (let k = 0; k < 5; k++) { const a = lerp(-1.4, 1.4, (k + 0.5) / 5), pts = [], ns = []; for (let i = 0; i <= 8; i++) { const v = 0.05 + 0.88 * i / 8, r = lerp(0.066, 0.058, v) + 0.0015 + 0.007 * Math.sin(a * 4 + 0.5) * (0.4 + 0.6 * v); pts.push(V(s * Math.cos(a) * r, -v * LEN, Math.sin(a) * r)); ns.push(V(s * Math.cos(a), 0, Math.sin(a))); } put(fl, ribbon(pts, ns, 0.0022, 0.5), null, () => P.linS.clone().lerp(P.hairD, 0.2)); }   // 5 folds
    flush(fl, vmat({ flat: true, rough: 0.9, po: -3 }), g, false);
    g.visible = false; ch.root.add(g); return g;
  };
  for (const s of ["L", "R"]) { arm[s].sleeve = mkSleeve(); arm[s].cuff = mkCuff(); arm[s].bracer = mkBracer(s === "L" ? 0.24 : 0.10, s === "L"); arm[s].flap = mkFlap(s === "L" ? 1 : -1); arm[s].key = ""; }
  const _t = V(0, 0, 0), _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4(), UP = V(0, 1, 0), FW = V(0, 0, 1);
  const GAP = { R: 0.17, L: 0.31 }, BRAL = { R: 0.10, L: 0.24 }, ARMBACK = 0.07;
  const buildArm = (s) => {
    const A = ch.arms?.[s], a = arm[s];
    if (!A?.shoulder || !A.elbow || !A.hand) { a.sleeve.visible = a.cuff.visible = a.bracer.visible = a.flap.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L0 = Math.max(0.12, curve.getLength()), sx = s === "L" ? 1 : -1;
    const k = [A.shoulder, A.elbow, A.hand.position].map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|") + A.joint;
    const T0 = curve.getTangentAt(0.1), w = sstep(0.7, 0.95, Math.abs(T0.y)), n0 = UP.clone().multiplyScalar(1 - w).addScaledVector(FW, w);
    if (a.key !== k) {
      a.key = k;
      const from = 0.02, to = clamp(1 - GAP[s] / L0, from + 0.2, 0.95), mid = Math.max(from + 0.15, to - 0.022 / L0);
      const rad = (q) => 0.0555 - 0.0125 * Math.pow(q, 0.9);   // 0.11 wide at the shoulder to 0.085
      const m1 = (mid - from) / (to - from);
      a.sleeve.geometry.dispose(); a.sleeve.geometry = sleeveGeo(curve, from, mid, (q) => rad(q * m1), n0, s === "L" ? 0.7 : 2.1); a.sleeve.visible = true;
      a.cuff.geometry.dispose(); a.cuff.geometry = sleeveGeo(curve, mid, to, (q) => (rad(m1 + (1 - m1) * q) * 1.03 + 0.0035 * Math.sin(Math.PI * q)), n0, 9); a.cuff.visible = true;
      // the bracer: LEATHER, between 0.07 and (0.07 + its length) before the hand's centre
      const dMid = L0 - ARMBACK - BRAL[s] / 2, u = clamp(dMid / L0, 0.05, 0.98), p = curve.getPointAt(u); curve.getTangentAt(u, _t);
      _y.copy(_t).normalize(); const up2 = UP.clone().multiplyScalar(1 - w).addScaledVector(FW, w); _z.copy(up2).addScaledVector(_y, -up2.dot(_y)).normalize(); _x.crossVectors(_y, _z);
      _m.makeBasis(_x, _y, _z); a.bracer.quaternion.setFromRotationMatrix(_m); a.bracer.position.copy(p); a.bracer.visible = true;
      // the flap: hangs from the shoulder, 60 % along the upper arm's way
      const dir = curve.getTangentAt(0.12).normalize(), down = V(0, -1, 0), tgt = down.clone().lerp(dir, 0.6).normalize();
      a.flap.quaternion.setFromUnitVectors(down, tgt); a.flap.position.copy(curve.getPointAt(0.03)); a.flap.visible = true;
    }
  };
  // ---- boots: 0.20 x 0.13 x 0.11, a round toe cap; #6f4b2a, shade #432b16, sole #2e1d0f; one strap with a bronze buckle, 5 crease lines, mud on the welt. Built in the foot's frame (origin under the foot's middle)
  const boots = {};
  for (const s of ["L", "R"]) {
    const g = new THREE.Group(), bb = bucket(), bs = bucket(), bz = bucket(), sx = s === "L" ? 1 : -1, BC = col("#6f4b2a"), BS = col("#432b16"), BL = col("#9a6c3c"), SOLE = col("#2e1d0f"), MUD = col("#4a3a22");
    const W = 0.065, Ln = 0.100, H = 0.075, zc = 0.012, se2 = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);
    const body = grid(36, 14, (u, v) => { const a = u * TAU, y = -0.0375 + 0.012 + v * (H - 0.012), k = 1 - 0.12 * v ** 2.2, z0 = Math.cos(a), x0 = Math.sin(a), toe = 1 + 0.0 * v; return V(se2(x0, 2.6) * W * k, y, zc + se2(z0, 2.6) * Ln * k * (z0 > 0 ? 1 - 0.1 * v : 1 - 0.0 * v)); }, true, null, (c) => V(c.x, 0, c.z - zc));
    put(bb, body, null, (n, p) => { const v = (p.y + 0.0255) / (H - 0.012), c = shade(BC, BS, BL, n, 0.9); c.lerp(MUD, 0.7 * sstep(0.2, 0, v) * (0.5 + 0.5 * hs(Math.floor((p.x + p.z * 2) * 60), 12))); const toeK = sstep(zc + 0.035, zc + 0.055, p.z) * sstep(0.7, 0.2, v); c.lerp(BL, 0.14 * toeK); return c; });
    const sole = grid(36, 3, (u, v) => { const a = u * TAU, x0 = Math.sin(a), z0 = Math.cos(a), r = 1.0 + 0.07 * (1 - v) + 0.0; return V(se2(x0, 2.6) * (W * 1.04) * r, -0.0375 + 0.012 * (1 - v), zc + se2(z0, 2.6) * (Ln * 1.03) * r); }, true, null, (c) => V(c.x, -1, c.z - zc));
    put(bb, sole, null, () => SOLE.clone());
    const welt = new THREE.TorusGeometry(1, 0.0034, 5, 40); welt.rotateX(Math.PI / 2); welt.scale(W * 1.02, 1, Ln * 1.0); welt.translate(0, -0.0255, zc); put(bb, welt, null, (n, p) => BS.clone().lerp(MUD, 0.55 * hs(Math.floor((p.x + p.z * 3) * 50), 13)));
    // the toe cap: a seam across the front and a raised cap, 5 crease lines across the instep, a strap round the ankle with a bronze buckle at the outside
    { const pts = [], ns = []; for (let i = 0; i <= 14; i++) { const a = lerp(-1.1, 1.1, i / 14), x = Math.sin(a) * W * 0.93, z = zc + Ln * 0.38 + 0.0 + (1 - Math.cos(a)) * 0.0; pts.push(V(x, 0.0, z)); ns.push(V(Math.sin(a), 0.3, Math.cos(a)).normalize()); }
      const seam = pts.map((p) => { const k = 1 - 0.12 * ((0.0255 + 0.0) / (H - 0.012)) ** 2.2; return p; }); void seam; }
    for (let k = 0; k < 5; k++) { const z = zc + Ln * (0.22 + 0.1 * k) * 0.9 - 0.02, pts = [], ns = []; for (let i = 0; i <= 7; i++) { const a = lerp(-0.7, 0.7, i / 7), x = Math.sin(a) * W * 0.55 * (1 - 0.3 * k / 4), vv = 0.62 + 0.05 * Math.cos(a * 2), y = -0.0255 + vv * (H - 0.012); pts.push(V(x, y + 0.0, z + (hs(k, 14) - 0.5) * 0.004 + 0.003 * Math.sin(a * 3))); ns.push(V(0, 1, 0.2).normalize()); }
      // each crease sits on the boot's top surface: lift it to the skin
      const lifted = pts.map((p) => { const dz = (p.z - zc) / Ln, dx = p.x / W, t = Math.max(0, 1 - dx * dx - dz * dz), yTop = -0.0255 + (H - 0.012) * Math.min(1, 0.85 + 0.15 * t); return V(p.x, Math.min(yTop, p.y) + 0.0, p.z); }); void lifted;
      put(bs, ribbon(pts.map((p) => V(p.x, p.y + 0.0016, p.z)), ns, 0.0016, 0.5), null, () => BS.clone().lerp(col("#2a1a0c"), 0.3)); }
    const strap = new THREE.TorusGeometry(1, 0.0062, 5, 40); strap.rotateX(Math.PI / 2); strap.scale(W * 0.985, 1, Ln * 0.72); strap.translate(0, 0.0165, zc - 0.012); put(bb, strap, null, (n) => shade(BS.clone().lerp(BC, 0.4), col("#2a1a0c"), BC, n, 0.7));
    const bkl = new THREE.TorusGeometry(0.0075, 0.0017, 5, 14); bkl.scale(1, 1.05, 1); bkl.rotateY(Math.PI / 2); bkl.translate(sx * W * 0.99, 0.0165, zc - 0.012 + 0.0); put(bz, bkl, null, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n, 1.1));
    const pr = new THREE.CapsuleGeometry(0.0012, 0.012, 2, 5); pr.translate(sx * W * 1.0, 0.0165, zc - 0.012); put(bz, pr, null, (n) => shade(P.bronze, P.bronzeS, P.bronzeL, n));
    // the collar the leg goes up through
    const col2 = new THREE.CylinderGeometry(0.047, 0.052, 0.052, 20, 1, true); col2.translate(0, 0.0465, zc - 0.022); put(bb, col2, null, (n) => shade(BC, BS, BL, n, 0.8));
    flush(bb, vmat({ line: "#1f130a", rough: 0.75, role: "cloth", side: THREE.DoubleSide }), g); flush(bs, vmat({ flat: true, rough: 0.9, po: -4 }), g, false); flush(bz, vmat({ line: "#3a2a12", rough: 0.4 }), g);
    g.visible = false; ch.root.add(g); boots[s] = g;
  }
  out.measure.mail = MAILN;

  // ================================================================ APPLY (a pure function of the state and the time)
  const D2R = Math.PI / 180, hatQ0 = hatIn.quaternion.clone(), hatFlex = new THREE.Quaternion(), hatE = new THREE.Euler();
  const hairBase = hairPivot.position.clone(), beardBase = beardPivot.position.clone();
  const cheekBase = new Map(), sprL1 = sprout.L1.rotation.clone(), sprL2 = sprout.L2.rotation.clone();
  const _bp = V(0, 0, 0), _bn = V(0, 0, 0), PIV_Y = 0.40;
  F.mouthMat.color.set("#4a1c14");
  const baseApply = out.apply;
  out.apply = (st, t, ...rest) => {
    baseApply && baseApply(st, t, ...rest);
    const e = st?.expr || {}, c = st?.face || {}, od = st?.odin || {}, ft = st?.ft || { f: 0, s: 0, u: 0 }, speak = clamp(Math.max(e.open ?? 0, st?.talk ?? 0));
    const wind = clamp(od.wind ?? 0), wa = od.windDir ?? 0, wx = Math.sin(wa), wz = Math.cos(wa), head = clamp((Math.abs(ft.f) + Math.abs(ft.s) + Math.abs(ft.u)) / 0.12);
    // ---- the face. His left eye is shut under the patch for the whole film; the rig's brows are hidden and replaced by the 7-hair silver brows
    F.eyes[1].root.visible = false;
    for (const b of F.brows) if (b) b.visible = false;
    buildBrows({ tilt: e.tilt ?? 0, browY: e.browY ?? 0, raise: e.raise ?? 0, eye: e.eye ?? 1 }, { browL: c.browL ?? 0, browR: c.browR ?? 0, tiltL: c.tiltL ?? 0, tiltR: c.tiltR ?? 0 });
    if (F.mouthLine && !F.mouthFill) F.mouthLine.visible = false;   // the moustache hides the closed line; the mouth shows only when open
    // the cheek: od.cheek / cheekR / cheekL when the clip sets them, else read off the face (lid squeeze, and the smirk lifts his right cheek a quarter more)
    const sm = clamp(e.smirk ?? 0), base = clamp(((c.lidR ?? 0) - 0.3) / 0.7 + 0.35 * clamp(e.curve ?? 0, 0, 1) * (e.curve > 0.6 ? 1 : 0));
    const chR = clamp(od.cheekR ?? Math.max(od.cheek ?? base, sm * 1.25)), chL = clamp(od.cheekL ?? od.cheek ?? base);
    for (const k of F.cheeks) {
      const q = k.side < 0 ? chR : chL; if (!cheekBase.has(k)) cheekBase.set(k, k.m.position.clone());
      k.m.position.y = cheekBase.get(k).y + 0.018 * q; k.m.material.opacity = 0.35 * q; k.m.visible = q > 0.01;   // rises up to 0.018; blush #e8875a up to 0.35
    }
    eyeR.lowPivot.rotation.x -= 0.2 * chR * (Math.PI / 2);   // the cheek pushes the lower lid up by 0.2
    const nCrow = Math.round(2 + 2 * chR);   // crow's feet: stern 2, amused 3, warm 4
    crowG.forEach((w, i) => { w.visible = i < nCrow; });
    // the glint: the catch-light doubles and one thin light arc crosses the iris
    const gl = clamp(od.glint ?? 0);
    glintParts.g2.visible = gl > 0.001 && gl < 0.999; glintParts.arcM.visible = glintParts.g2.visible; glintParts.arcM.position.x = lerp(-glintParts.rad * 0.7, glintParts.rad * 0.7, gl);
    eyeR.pupil.scale.multiplyScalar(0.72);   // the pupil 0.022 across
    // ---- moustache: -12 degrees at rest; up to +18 with the smile; his right half +6 with the (mirrored) smirk; lifts 4 with talk
    for (const m of moust) { const ang = clamp(-12 + 28 * clamp(e.curve ?? 0) + (m.s < 0 ? 6 * clamp(sm / 0.4, 0, 1.5) : 0) + 4 * speak, -12, 18); m.g.rotation.z = m.s * ang * D2R; }
    // ---- beard and hair, braids: hang from the lagged head signal (the timeline's follow-through spring) plus the wind
    beardPivot.position.set(beardBase.x, beardBase.y - 0.012 * speak, beardBase.z);   // the beard's root drops 0.012 with speech
    beardPivot.rotation.set(-0.2 * ft.f - 0.03 * wind * wz, 0, 0.2 * ft.s + 0.03 * wind * wx + 0.02 * Math.sin(t * 5.3) * wind);
    hairPivot.rotation.set(-0.25 * ft.f - 12 * D2R * wind * wz, 0, 0.25 * ft.s + 12 * D2R * wind * wx + 0.012 * wind * Math.sin(t * 4.1));
    for (const b of braidP) { const ph = b.s * 0.6; b.piv.rotation.set(-0.7 * ft.f - 12 * D2R * wind * wz + 0.02 * speak * Math.sin(t * 9 + ph), 0, 0.7 * ft.s + 12 * D2R * wind * wx + 0.012 * wind * Math.sin(t * 4.7 + ph)); }
    swayP.rotation.set(-0.12 * ft.f, 0, 0.2 * ft.s + 0.02 * wind * wx);   // fur and chains sway 3 to 4 degrees
    // ---- the hat: the brim flexes 2 degrees on a head snap, flutters 3 degrees at 5 Hz in the wind; the sprout droops and rattles
    const flexX = (2 * D2R) * clamp(ft.f / 0.2, -1, 1) + 3 * D2R * wind * Math.sin(t * TAU * 5), flexZ = (2 * D2R) * clamp(ft.s / 0.2, -1, 1);
    hatQ0 && (hatE.set(flexX, 0, -flexZ), hatFlex.setFromEuler(hatE), hatIn.quaternion.copy(hatQ0).multiply(hatFlex));
    const dr = clamp(st?.droop ?? 0), rat = 3 * D2R * head * Math.sin(t * TAU * 7) * (0.3 + 0.7 * head);
    sprout.L1.rotation.set(sprL1.x + 0.5 * dr + rat, sprL1.y, sprL1.z + 0.12 * dr * Math.sign(sprL1.z)); sprout.L2.rotation.set(sprL2.x + 0.45 * dr - rat, sprL2.y, sprL2.z + 0.12 * dr * Math.sign(sprL2.z));
    // ---- the cloak hangs plumb: below the belt every vertex turns back 80 % of the body's pitch and roll about the belt line; the wind streams the hem out
    const R = ch.root.rotation, rx = -0.8 * (R.x || 0), rz = -0.8 * (R.z || 0), cx = Math.cos(rx), sx_ = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
    for (const B of BEND) {
      const P0 = B.p0, P1 = B.g.attributes.position.array, N0 = B.n0, N1 = B.g.attributes.normal ? B.g.attributes.normal.array : null;
      for (let i = 0; i < P0.length; i += 3) {
        const y0 = P0[i + 1], w = 1 - sstep(0.40, 0.62, y0);
        if (w <= 0) { P1[i] = P0[i]; P1[i + 1] = y0; P1[i + 2] = P0[i + 2]; if (N1) { N1[i] = N0[i]; N1[i + 1] = N0[i + 1]; N1[i + 2] = N0[i + 2]; } continue; }
        // rotate about x then z by w times the turn, about the pivot (0, 0.40, 0)
        let x = P0[i], y = y0 - PIV_Y, z = P0[i + 2];
        const ax = rx * w, az = rz * w, c1 = Math.cos(ax), s1 = Math.sin(ax), c2 = Math.cos(az), s2 = Math.sin(az);
        let y1 = y * c1 - z * s1, z1 = y * s1 + z * c1; y = y1; z = z1;
        let x2 = x * c2 - y * s2, y2 = x * s2 + y * c2; x = x2; y = y2;
        if (wind > 0) { const hang = clamp((PIV_Y - y0) / 0.4, 0, 1.2), k = Math.sin(25 * D2R) * 0.9 * wind * hang * hang * w, fl = 0.012 * wind * hang * Math.sin(t * 6 + y0 * 9 + P0[i] * 7); x += wx * k + wx * fl; z += wz * k + wz * fl; y += 0.35 * Math.abs(k) * 0 - 0.12 * k * k / 0.4; }
        P1[i] = x; P1[i + 1] = y + PIV_Y; P1[i + 2] = z;
        if (N1) { let nx = N0[i], ny = N0[i + 1], nz = N0[i + 2]; const ny1 = ny * c1 - nz * s1, nz1 = ny * s1 + nz * c1; ny = ny1; nz = nz1; const nx2 = nx * c2 - ny * s2, ny2 = nx * s2 + ny * c2; N1[i] = nx2; N1[i + 1] = ny2; N1[i + 2] = nz; }
      }
      B.g.attributes.position.needsUpdate = true; if (N1) B.g.attributes.normal.needsUpdate = true;
    }
    void rz, void cx, void sx_, void cz, void sz;
    // ---- sleeves, bracers, shoulder flaps follow the arms; the boots follow the feet (their own leg tubes stay under the collars)
    buildArm("L"); buildArm("R");
    for (const s of ["L", "R"]) {
      const f = ch.legs?.[s]?.foot, bt = boots[s];
      if (f && f.visible) { bt.position.copy(f.position); bt.quaternion.copy(f.quaternion); bt.visible = true; f.visible = false; } else bt.visible = false;
    }
  };
  out.prop = null; out.sitDepth = 0;
  return out;
}
