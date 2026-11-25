import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// Kid vs Dad 05 "Carrots" (T3): nvgoggles, eyeshine, moonlamp, daywindow. Spec: storyboards/series/kid-vs-dad/05-carrots/DESIGN.md sections 1, 4, 6.
// Metres, body frame y 0 = the floor, +z the way he faces, +x HIS left. Deterministic: no random, no clock, no material opacity is ever tweened
// (every glow is a scale, a visibility or an unlit colour). No letters or digits on any part. Keys with a propState default (props3d.js propState):
// on 0 (spec.on is NOT read: tween it, or give a dur-0 `prop` set at time 0), lit spec.lit ?? 0. Keys without one (up, pulse) read ps.<name> ?? spec.<name>.
//
//   nvgoggles   Dad's night-vision goggles, WORN: { kind: "nvgoggles", wear: "dad", x: 0, y: 0.842, z: 0.355 (NV_AT, exported; bench-wear prints it) }.
//               Origin the point between his eyes ON the skin (x 0, b 0.642 = y 0.842: the bench layout's eye height, 0.007 above DAD-DESIGN's 0.635). Nothing else is placed: every part is built on his real skin
//               (the potato.js bodyPoint maths, dad.json body, legs 0.20), so it turns, leans and follows him. It does not squash with him (5 % squash moves it 2 cm).
//     up 0..1    spec.up (default 0), tweens (6 fixed seats in between, each placed clear of the skin; the strap steps between 7 bands). 0 = over the eyes. 1 = pushed up onto the forehead: plate middle b 0.935
//                (y 1.135), tipped back 58 degrees, the strap tilted with it (front b 0.935, back 0.16 lower). Lowest point of any part for abs(x) < 0.25 is
//                b >= 0.872 (the bench prints it), the eye zone b 0.496..0.86 stays empty; its rear edge stops 0.02+ short of the leaf nub (crown, x -0.11, z +0.02).
//     lit 0..1   spec.lit (default 0): lens colours from #0d3a1c (0) to #39ff6a (1), inner glow to #c8ffd6. Director: up 0 -> 1, up 1 -> 0.6. Unlit colours.
//     SIZE       face plate 0.40 x 0.21 (b 0.537..0.747, corners r 0.05, 0.02 thick, 0.008 off the skin, curved to the face) #1e2024, edge roll r 0.006 #33363c;
//                2 tubes at x +-0.116, r 0.056, 0.075 long, #26282d, grip ring r 0.060 x 0.012 #3a3d44; bridge block 0.05 deep x 0.04 tall between the tubes with
//                a dial r 0.012 #8a8f98; lenses r 0.044 #39ff6a, rim #0f7a32; strap 0.035 x 0.006 #2a2c31 round the head, steel buckle 0.03 x 0.02 at the back.
//     HAND       none (a hand pushes the plate: pin the glove on the plate's top edge at the cut). No grip entry.
//
//   eyeshine    two glowing eyes WORN on a face, eyeglow's recipe (props-mind.js) with colours: additive ellipses at x +-gap/2, core, body, halo 2.5x, no tone mapping.
//               { kind: "eyeshine", wear: "spud", x: 0, y: 0.445 (Tato's eye height in the layout; DESIGN's b 0.341 would be y 0.481), z: 0.228 (his skin 0.216 + 0.012; bench-wear prints it), gap: 0.15, ew: 0.05, eh: 0.066,
//                 core: "#fff3c4", body: "#ffb02e", halo: "#ff7a1a", k: 0.8 }. Green pair on Dad: gap 0.232, ew 0.05, eh 0.05, core "#eafff0", body "#39ff6a", halo "#12b84a".
//               Spec keys (default): ew 0.05, eh 0.066, gap 0.15, core "#fff3c4", body "#ffb02e", halo "#ff7a1a", k 0.8, pulse 0. Keys: on 0..1 (default 0), pulse 0..1
//               (a 4 Hz shimmer; seed it with a dur-0 set at 0 before tweening). Origin between the eyes, faces +z, flat quads (an eye seen edge-on from the side thins out).
//
//   moonlamp    no mesh: one real point light "#9db8ff" at the prop's place. Spec range 8, k 5 (intensity at on 1, decay 1.6). Key on 0..1.5 (default 0).
//
//   daywindow   the morning of panel 07. Origin = the kitchenroom's origin (K): place it at the same x y z as the room. Card 1.60 x 1.15 unlit at K (0, 2.05, -2.278)
//               (0.012 in front of the window glass): sky #7cc4f2 to #ffe3b0, a low sun r 0.14, 3 clouds, 5 leaves #6fae4a lower left; an opaque sun patch (a parallelogram
//               1.1 x 1.6, #f6d9a0, 0.002 above the surface) in two pieces: the table top (x +-0.65, z 0.05..0.65, y 0.30) and the floor; one point light
//               "#fff0c8" at K (-0.9, 2.3, -1.4), range 9. Spec k 8 (light intensity, 1.5x it is the fallback). Key on 0 or 1 shows card, patch and light together.

const D2R = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- the skin (the potato.js bodyPoint maths)
export const NV_BODIES = {
  dad: { height: 0.98, width: 0.86, depth: 0.76, lump: 0.02, seed: 71, taper: 0.14, square: 2.3, legH: 0.20 },
  tato: { height: 0.55, width: 0.50, depth: 0.44, lump: 0.02, seed: 29, taper: 0.07, legH: 0.14 },
};
export function makeSkin(B) {
  const rx = B.width / 2, ry = B.height / 2, rz = B.depth / 2, cy = B.legH + ry, rg = rng((B.seed || 1) * 7919);
  const lumps = Array.from({ length: 9 }, () => { const d = V(rg() * 2 - 1, rg() * 2 - 1, rg() * 2 - 1).normalize(); return { d, a: (rg() * 2 - 1) * B.lump, k: 3 + rg() * 5 }; });
  const point = (d) => {
    let r = 1; for (const L of lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (B.taper ?? 0.07) * d.y;
    if (B.square) { const q = B.square; r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q); }
    return V(d.x * rx * taper * r, cy + d.y * ry * r, d.z * rz * taper * r);
  };
  const P = (th, ph) => point(V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph)));
  // the skin point over (x, y) on the front half (Newton on the angles) and its outward normal
  const skin = (x, y) => {
    let th = Math.asin(clamp(x / rx, -0.95, 0.95)), ph = Math.asin(clamp((y - cy) / ry, -0.98, 0.98)), p, pt, pp;
    for (let i = 0; i < 10; i++) {
      p = P(th, ph); const e = 1e-4; pt = P(th + e, ph).sub(p).divideScalar(e); pp = P(th, ph + e).sub(p).divideScalar(e);
      const det = pt.x * pp.y - pp.x * pt.y, dx = x - p.x, dy = y - p.y;
      th += (dx * pp.y - pp.x * dy) / det; ph += (pt.x * dy - dx * pt.y) / det;
    }
    p = P(th, ph);
    return { p, n: pt.clone().cross(pp).normalize() };
  };
  const _d = V();
  const ring = (alpha, y) => {   // the skin at horizontal direction alpha (0 = front, + toward +x) and height y
    const th = Math.atan2(rz * Math.sin(alpha), rx * Math.cos(alpha)), st = Math.sin(th), ct = Math.cos(th);
    let lo = -Math.PI / 2 + 1e-4, hi = Math.PI / 2 - 1e-4;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m))).y < y) lo = m; else hi = m; }
    const m = (lo + hi) / 2; return point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m)));
  };
  // metres a point is inside the skin (> 0 inside), approximate: radial gap in the body's normalised space
  const depth = (p) => {
    const q = V(p.x / rx, (p.y - cy) / ry, p.z / rz), ql = q.length(), qd = q.clone().normalize(), d = qd.clone();
    let sq = V();
    for (let i = 0; i < 4; i++) { const s = point(d); sq = V(s.x / rx, (s.y - cy) / ry, s.z / rz); d.add(qd.clone().sub(sq.clone().normalize())).normalize(); }
    return (sq.length() - ql) * Math.min(rx, rz) * 0.85;
  };
  return { rx, ry, rz, cy, point, skin, ring, depth };
}

// ---------------------------------------------------------------- small geometry helpers
// a grid of points fn(i, j) (i 0..nu, j 0..nv) as an indexed surface
function gridGeo(nu, nv, fn) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = j * (nu + 1) + i; idx.push(k, k + 1, k + nu + 1, k + 1, k + nu + 2, k + nu + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const merge = (geos) => {   // plain concatenation of indexed geometries (position only)
  const pos = [], idx = []; let o = 0;
  for (const g of geos) { const a = g.attributes.position; for (let i = 0; i < a.count; i++) pos.push(a.getX(i), a.getY(i), a.getZ(i)); for (const k of g.index.array) idx.push(k + o); o += a.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
};
// a closed band round the head: path(a) -> { p (the skin point), u (up the skin), n (out) }, width w, thickness t, standing off the skin by off
function bandGeo(path, w, t, off, n = 96) {
  const rows = [];
  for (let k = 0; k <= n; k++) {
    const { p, u, n: nn } = path((k / n) * Math.PI * 2);
    rows.push([[1, 0], [1, 1], [-1, 1], [-1, 0]].map(([a, b]) => p.clone().addScaledVector(u, (a * w) / 2).addScaledVector(nn, off + b * t)));
  }
  const pos = [], idx = [];
  rows.forEach((r) => r.forEach((p) => pos.push(p.x, p.y, p.z)));
  for (let k = 0; k < n; k++) for (let c = 0; c < 4; c++) { const a = k * 4 + c, b = k * 4 + (c + 1) % 4; idx.push(a, b, a + 4, b, b + 4, a + 4); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- nvgoggles
const PL = { w: 0.40, h: 0.21, r: 0.05, T: 0.02, bC: 0.642, tubeX: 0.116, tubeR: 0.056, tubeL: 0.075 };   // DESIGN section 4
const UP = { b: 0.945, tilt: 58, drop: 0.16 };
const CROWN_NUB = [-0.11, 0.02];   // the leaf nub (crown x, z)
const NVC = { plate: "#1e2024", roll: "#33363c", tube: "#26282d", ring: "#3a3d44", dial: "#8a8f98", strap: "#2a2c31", buckle: "#9aa0a8", lens: "#39ff6a", lensOff: "#0d3a1c", glow: "#c8ffd6", rim: "#0f7a32", rimOff: "#06240f" };

// the fixed numbers of the build, from dad.json's body (nvgogglesInfo prints them in the bench)
const _dad = makeSkin(NV_BODIES.dad);
const yEye = NV_BODIES.dad.legH + PL.bC, _s0 = _dad.skin(0, yEye);
export const NV_AT = [0, +yEye.toFixed(3), +_s0.p.z.toFixed(3)];

function curvature(S, yC) {   // plate patch curvature (1 / radius across x and along v) fitted to the skin at the face
  const c = S.skin(0, yC).p.z, ex = S.skin(PL.w / 2, yC).p.z, ev = (S.skin(0, yC + PL.h / 2).p.z + S.skin(0, yC - PL.h / 2).p.z) / 2;
  const f = (d, h) => (2 * Math.max(d, 1e-4)) / (h * h + d * d);
  return { kx: f(c - ex, PL.w / 2), kv: f(Math.max(c - ev, 0), PL.h / 2) };
}

function buildNvgoggles(P) {
  const g = P.whole, S = P.spec, K = _dad, [ox, oy, oz] = NV_AT;
  const root = new THREE.Group(); root.position.set(-ox, -oy, -oz); g.add(root);   // body-frame coordinates inside; the prop's origin sits between his eyes
  const { kx, kv } = curvature(K, yEye);
  const zb = (x, v) => -(kx * x * x + kv * v * v) / 2;   // the patch (local: +z out of the back face at the middle)
  const hw = PL.w / 2, hh = PL.h / 2;
  const rr = (i, j) => { let X = (2 * i - 1) * hw, Y = (2 * j - 1) * hh;   // a grid point of the rounded rectangle
    const ax = Math.abs(X) - (hw - PL.r), ay = Math.abs(Y) - (hh - PL.r);
    if (ax > 0 && ay > 0) { const k = Math.max(ax, ay) / Math.hypot(ax, ay); X = Math.sign(X) * (hw - PL.r + ax * k); Y = Math.sign(Y) * (hh - PL.r + ay * k); }
    return [X, Y]; };
  const plateM = mat(NVC.plate, { roughness: 0.5, side: THREE.DoubleSide }), rollM = mat(NVC.roll, { roughness: 0.45 }), tubeM = mat(NVC.tube, { roughness: 0.5 });
  const ringM = mat(NVC.ring, { roughness: 0.4 }), dialM = mat(NVC.dial, { roughness: 0.3, metalness: 0.6 }), strapM = mat(NVC.strap, { roughness: 0.85, side: THREE.DoubleSide });
  const buckM = mat(NVC.buckle, { roughness: 0.32, metalness: 0.75 });
  const lensM = basic({ color: NVC.lens, toneMapped: false }), glowM = basic({ color: NVC.glow, toneMapped: false }), rimM = basic({ color: NVC.rim, toneMapped: false });

  // the piece in its own frame: +z out, y up the plate, origin at the middle of the BACK face
  const piece = new THREE.Group(); root.add(piece);
  const NU = 28, NV = 14, back = (i, j) => { const [X, Y] = rr(i, j); return V(X, Y, zb(X, Y)); }, front = (i, j) => back(i, j).add(V(0, 0, PL.T));
  const skirt = [];   // the plate's side wall between the two faces along the grid's border
  const border = []; for (let i = 0; i <= NU; i++) border.push([i / NU, 0]); for (let j = 1; j <= NV; j++) border.push([1, j / NV]); for (let i = NU - 1; i >= 0; i--) border.push([i / NU, 1]); for (let j = NV - 1; j >= 1; j--) border.push([0, j / NV]);
  const wall = gridGeo(border.length, 1, (a, b) => { const k = Math.min(border.length - 1, Math.round(a * border.length)) % border.length, [i, j] = border[k]; return b ? front(i, j) : back(i, j); });
  mesh(merge([gridGeo(NU, NV, back), gridGeo(NU, NV, front), wall]), plateM, piece);
  const roll = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(border.filter((_, k) => k % 2 === 0).map(([i, j]) => front(i, j)), true), 80, 0.006, 6, true), rollM); roll.castShadow = false; piece.add(roll);

  let lensZ = 0;   // the lens front in the piece's frame (the bench reads it for the green eyeshine)
  for (const s of [-1, 1]) {
    const x = s * PL.tubeX, z0 = PL.T + zb(x, 0) - 0.004, zEnd = PL.T + zb(x, 0) + PL.tubeL; lensZ = zEnd + 0.0012;
    const tube = mesh(new THREE.CylinderGeometry(PL.tubeR, PL.tubeR, zEnd - z0, 32), tubeM, piece, x, 0, (z0 + zEnd) / 2); tube.rotation.x = Math.PI / 2;
    const ring = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 32), ringM, piece, x, 0, zEnd - 0.006); ring.rotation.x = Math.PI / 2;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.044, 32), lensM); lens.position.set(x, 0, zEnd + 0.0006); lens.castShadow = false; piece.add(lens);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.0425, 0.048, 32), rimM); rim.position.set(x, 0, zEnd + 0.0008); rim.castShadow = false; piece.add(rim);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), glowM); glow.position.set(x + 0.008, 0.008, zEnd + 0.0012); glow.castShadow = false; piece.add(glow);   // up and to HIS left (+x)
  }
  const bz = PL.T + zb(0, 0), bridge = mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), tubeM, piece, 0, 0, bz + 0.02);
  const dial = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), dialM, piece, 0, 0.024, bz + 0.02);

  // where the piece sits for each state: its back middle on the skin point, turned about x to a tilt, standing off the skin far enough to clear it
  const samples = [];
  for (const X of [-hw, -hw / 2, 0, hw / 2, hw]) for (const Y of [-hh, -hh / 2, 0, hh / 2, hh]) samples.push([X, Y]);
  const placeFor = (b, tiltDeg) => {
    const yC = PL.bC === b ? yEye : NV_BODIES.dad.legH + b, sk = K.skin(0, yC), tilt = tiltDeg ?? Math.atan2(sk.n.y, sk.n.z) / D2R;
    const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -tilt * D2R), nrm = V(0, 0, 1).applyQuaternion(q);
    let off = 0.008;
    for (; off < 0.08; off += 0.001) {
      const m = new THREE.Matrix4().compose(sk.p.clone().addScaledVector(nrm, off), q, V(1, 1, 1));
      if (samples.every(([X, Y]) => K.depth(V(X, Y, zb(X, Y)).applyMatrix4(m)) < 0.002)) break;
    }
    return { pos: sk.p.clone().addScaledVector(nrm, off), q, tilt, off, skinTilt: Math.atan2(sk.n.y, sk.n.z) / D2R };
  };
  const st0 = placeFor(PL.bC, null), st1 = placeFor(UP.b, UP.tilt);
  // the push up as a real move (Sol, ending check 25 Nov: it jumped in one frame): NS fixed in-between seats, each placed clear of the skin
  const NS = 6, seats = [st0];
  for (let k = 1; k < NS; k++) { const f = k / NS; seats.push(placeFor(PL.bC + (UP.b - PL.bC) * f, st0.tilt + (UP.tilt - st0.tilt) * f)); }
  seats.push(st1);

  // the strap: a level band over the eyes (up 0) or tilted with the plate (front b 0.935, the back UP.drop lower) (up 1); buckle at the back
  const pathFor = (yOf) => (a) => {   // the band's centre line: a = 0 at the back, round to the back again; n is the horizontal outward normal
    const al = a - Math.PI, y = yOf(al), e = 0.004, t = K.ring(al + e, y).sub(K.ring(al - e, y)).normalize();
    return { p: K.ring(al, y), u: K.ring(al, y + e).sub(K.ring(al, y - e)).normalize(), n: V(-t.z, 0, t.x).normalize() };
  };
  const strapFor = (yOf) => {
    const grp = new THREE.Group(), path = pathFor(yOf), s = new THREE.Mesh(bandGeo(path, 0.035, 0.006, 0.006), strapM); s.castShadow = false; grp.add(s);
    const back = path(0), bk = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.008), buckM, grp, back.p.x, back.p.y, back.p.z - 0.011); bk.userData.noOutline = true;
    root.add(grp); return grp;
  };
  const yF0 = NV_BODIES.dad.legH + PL.bC, yF1 = NV_BODIES.dad.legH + UP.b;
  const straps = seats.map((_, k) => { const f = k / NS; return strapFor((al) => yF0 + (yF1 - yF0) * f - f * UP.drop * (1 - Math.cos(al)) / 2); });   // al = 0 at the front

  const cDark = new THREE.Color(NVC.lensOff), cLens = new THREE.Color(NVC.lens), cGlowOn = new THREE.Color(NVC.glow), cRimOn = new THREE.Color(NVC.rim), cRimOff = new THREE.Color(NVC.rimOff);
  return {
    grip: 0,
    info: { lensZ, lensX: PL.tubeX, yEye, zFront: _s0.p.z, kx, kv, up0: st0, up1: st1, seats, root, piece },
    apply(ps) {
      const u = clamp(ps.up ?? S.up ?? 0) * NS, k = Math.min(NS - 1, Math.floor(u)), f = u - k, a = seats[k], b = seats[k + 1], lit = clamp(ps.lit ?? S.lit ?? 0);
      piece.position.copy(a.pos).lerp(b.pos, f); piece.quaternion.copy(a.q).slerp(b.q, f);
      const near = Math.round(u); straps.forEach((st, i) => { st.visible = i === near; });
      lensM.color.copy(cDark).lerp(cLens, lit); glowM.color.copy(cDark).lerp(cGlowOn, lit); rimM.color.copy(cRimOff).lerp(cRimOn, lit);
    },
  };
}

// ---------------------------------------------------------------- eyeshine (eyeglow's recipe with spec colours)
function buildEyeshine(P) {
  const S = P.spec, EW = S.ew ?? 0.05, EH = S.eh ?? 0.066, GAP = S.gap ?? 0.15, K = S.k ?? 0.8;
  const c = (v, d) => { const k = new THREE.Color(v ?? d); return new THREE.Vector3(k.r, k.g, k.b); };
  const mat3 = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 }, uCore: { value: c(S.core, "#fff3c4") }, uBody: { value: c(S.body, "#ffb02e") }, uHalo: { value: c(S.halo, "#ff7a1a") } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uI; uniform vec3 uCore; uniform vec3 uBody; uniform vec3 uHalo; varying vec2 vUv;
      void main() {
        float e = length((vUv - 0.5) * 2.0) / 0.4;           // 1 at the edge of the eye ellipse, 2.5 at the edge of the halo
        float core = 1.0 - smoothstep(0.0, 0.62, e), body = 1.0 - smoothstep(0.35, 1.05, e), halo = exp(-e * e * 0.85) * (1.0 - smoothstep(1.6, 2.5, e));
        vec3 col = uHalo * halo * 0.75 + uBody * body * 1.1 + uCore * core * 1.6;
        float a = clamp(halo * 0.55 + body * 0.9 + core, 0.0, 1.0) * uI;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide,
  });
  mat3.userData.noOutline = true; mat3.userData.outlineParameters = { visible: false };
  const eyes = [-1, 1].map((s) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(EW * 2.5, EH * 2.5), mat3); m.position.set((s * GAP) / 2, 0, 0);
    m.frustumCulled = false; m.renderOrder = 9; m.castShadow = m.receiveShadow = false; m.userData.steam = true; m.userData.solid = false; P.whole.add(m); return m;
  });
  return {
    grip: 0,
    apply(ps, t) {
      const on = clamp(ps.on ?? 0), pu = clamp(ps.pulse ?? S.pulse ?? 0), sh = pu * Math.sin((t ?? 0) * 25.1327);
      mat3.uniforms.uI.value = on * K * (1 + 0.18 * sh); for (const m of eyes) { m.visible = on > 0.002; m.scale.setScalar(1 + 0.05 * sh); }
    },
  };
}

// ---------------------------------------------------------------- moonlamp
function buildMoonlamp(P) {
  const S = P.spec, L = new THREE.PointLight("#9db8ff", 0, S.range ?? 8, 1.6); L.castShadow = false; P.whole.add(L);
  return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0, 0, 1.5); L.intensity = (S.k ?? 5) * on; L.visible = on > 0.001; } };
}

// ---------------------------------------------------------------- daywindow
const SUN = { z: -2.278, x0: -0.55, x1: 0.55, z0: -0.1, z1: 1.5, shear: 0.35, cx: 0.1 };   // the patch: 1.1 wide, 1.6 long, leaning +x as it runs toward the room
const TABLE = { x: 0.65, z0: 0.05, z1: 0.65, y: 0.30 };
function clipPoly(poly, keep) {   // Sutherland-Hodgman against one half-plane list: keep(p) -> signed distance (>= 0 inside)
  const out = [];
  poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], da = keep(a), db = keep(b); if (da >= 0) out.push(a); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } });
  return out;
}
function buildDaywindow(P) {
  const S = P.spec, g = new THREE.Group(); P.whole.add(g);
  const tex = canvasTex(320, 230, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7cc4f2"); gr.addColorStop(1, "#ffe3b0"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const pm = w / 1.6;   // pixels per metre
    c.fillStyle = "#fff4c2"; c.beginPath(); c.arc(w * 0.28, h * 0.68, 0.14 * pm, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.92)";
    for (const [x, y, r] of [[0.62, 0.26, 0.07], [0.69, 0.23, 0.09], [0.77, 0.27, 0.065], [0.48, 0.12, 0.05], [0.55, 0.10, 0.065], [0.90, 0.46, 0.05]]) { c.beginPath(); c.arc(w * x, h * y, r * pm, 0, Math.PI * 2); c.fill(); }   // 3 clouds
    c.fillStyle = "#6fae4a";
    for (const [x, y, rot, l] of [[0.06, 0.86, -0.6, 0.20], [0.16, 0.92, 0.2, 0.18], [0.10, 0.74, -1.1, 0.17], [0.24, 0.84, 0.7, 0.15], [0.03, 0.62, -0.3, 0.16]]) {   // 5 leaves
      c.save(); c.translate(w * x, h * y); c.rotate(rot); c.beginPath(); c.ellipse(l * pm * 0.5, 0, l * pm * 0.5, l * pm * 0.2, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.15), basic({ map: tex, toneMapped: false })); card.position.set(0, 2.05, SUN.z); card.castShadow = false; g.add(card);
  const patchM = basic({ color: "#f6d9a0", toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
  const flat = (poly, y) => {
    const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, z))), geo = new THREE.ShapeGeometry(sh); geo.rotateX(Math.PI / 2); geo.translate(0, y, 0);
    const m = new THREE.Mesh(geo, patchM); m.castShadow = m.receiveShadow = false; m.userData.solid = false; g.add(m); return m;
  };
  const xs = (z, s) => SUN.cx + SUN.shear * ((z - SUN.z0) / (SUN.z1 - SUN.z0)) + s * 0.55;
  const para = [[xs(SUN.z0, -1), SUN.z0], [xs(SUN.z0, 1), SUN.z0], [xs(SUN.z1, 1), SUN.z1], [xs(SUN.z1, -1), SUN.z1]];
  const onTable = [(p) => TABLE.x - p[0], (p) => p[0] + TABLE.x, (p) => p[1] - TABLE.z0, (p) => TABLE.z1 - p[1]].reduce((poly, f) => clipPoly(poly, f), para);
  flat(para, 0.002); if (onTable.length > 2) flat(onTable, TABLE.y + 0.002);   // ShapeGeometry (x, z) -> rotateX turns its y into +z... (checked on the bench)
  const light = new THREE.PointLight("#fff0c8", 0, 9, 1.6); light.position.set(-0.9, 2.3, -1.4); light.castShadow = false; g.add(light);
  return { grip: 0, apply(ps) { const on = ps.on >= 0.5 ? 1 : 0; g.visible = on > 0; light.visible = on > 0; light.intensity = (S.k ?? 8) * on; } };
}

export const CARROTS_WEAR_KINDS = { nvgoggles: buildNvgoggles, eyeshine: buildEyeshine, moonlamp: buildMoonlamp, daywindow: buildDaywindow };
