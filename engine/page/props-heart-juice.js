import * as THREE from "three";
import { clamp } from "./util.js";

// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md section H): the JUICE. Metres, x right, y up,
// z toward the camera. Cartoon-gross, never gore: thick as ketchup, fat glossy blobs, opaque, ONE shade tone, a hard white gloss shape on
// each, an ink outline. The ONLY colours are the JUICE palette: base #f0502a (tomato, leaning orange), shade #c9341a (never darker),
// light #ff9a6b (the warm torch highlight), gloss #fff3e6, tomato seeds #f6d98a (pale teardrops 4 mm, 1 blob in 3, 7 in the main pool),
// ink line #2a1c14. Flat colours baked into the geometry (MeshBasic, no scene light, no tone mapping): the palette is exact in any light.
// No brown, no drying, no soaking, no mist, no smears on skin, no runs down a body, no pieces of heart. Every shape is built once from its
// index (no Math.random, no clock) and every state is a pure function of the spec and the state keys, so any frame in any order is the same.
//
// ===== heartjuice   the spray, the pool and the splats
//   ORIGIN: the heart's seat S on the pan the juice belongs to (the point on the pan where the heart sits), +z toward the camera. The
//   floor is spec.floor below S, the mouth spec.mouth from S; nothing else is placed relative to S.
//   spec  mouth [0, 0.10, 0.12]  where the drops leave (S + this): just above the seat, a hand toward the camera (the monster's mouth)
//         floor -0.25            y of the floor relative to S (the pan's seat is about 0.25 above the stone); every splat and pool lies there
//         shoes [x, z]           where the 3 aimed shoe drops land (x, z relative to S, on the trainers); default [0.9, 1.6]. Two pairs
//                                [[x, z], [x, z]] (right trainer then left) alternate between them. The drops end 0.05 above the floor
//         shoeY 0.05             height of a trainer's top above the floor (where an aimed drop ends)
//         cheek [x, y, z]        where the 1 aimed cheek drop ends (the camera-left cheek of Chip, relative to S); default [0.85, 0.55, 1.65]
//         burst 0, pool 0        the start of the state keys below
//   state (ps.<key> ?? spec.<key> ?? default; `burst` is a propState default, `pool` is not: seed it with a dur-0 set, c.prop(0, id,
//          { pool: 0 }, 0), before the first tween or a later tween steps at its `at`)
//     burst 0..1 (0)  the spray, 0..1 = 0..0.8 s of flight, drawn as it flies. 46 drops of 2.5-7 cm (diameter) leave the mouth within the first
//                     0.04 s in a fan of 150 degrees about +z (+-75 degrees), 10-65 degrees up, 2.2-5.0 m/s, fall under gravity (9.8) and are
//                     stretched 1.6 x along their path; each has a hard gloss shape and a shade half (turned with it, so the light stays put),
//                     1 in 3 a pale seed. Each of the 42 free drops lands as ITS OWN splat (a flat glossy blob 1.9 x its size with 2 tails
//                     pointing away from S, thickness 2.5 mm, rounded edge) at a spot fixed by its index, whatever burst does; the splat
//                     opens over 0.05 s. All 42 have landed by burst 1 (0.78 s) when spec.floor >= -0.4. The 4 AIMED drops are the first four:
//                     3 end on spec.shoes and 1 on spec.cheek, arriving at burst 0.5 (0.4 s); on arrival each is gone (the stain on Chip is the
//                     decal kinds below, which the director shows from that frame).
//     pool 0..1 (0)   on the floor under the pan, around (0, floor, 0), and it stays: a main pool 0.55 x 0.38 (5 lobes, 6 mm thick, rounded
//                     edge, 7 seeds) that spreads from a third of its size; 14 splats of 4-16 cm within r 1.6, each with 2-4 tails pointing
//                     away from S; 20 dots of 1-2 cm (14 beside the splats, 6 loose); a warm highlight band and a gloss on each; they appear
//                     in a staggered order from pool 0.1 to 0.9 and are all there at 1. Opaque: no floor inlay shows through.
//   size  the drops reach about 4 m from S at the extreme; the pool and its splats lie within r 1.6. Not solid for the checks (nothing is).
//   HOLD POINTS: none.
//
// ===== heartjuiceshoe   the stains on one of Chip's trainers (a decal kind: the director places it on the foot, costumes are not touched)
//   ORIGIN: the CENTRE of the trainer's foot ball (potato.js: a sphere of radius 0.075 scaled 0.9 x 0.5 x 1.25, i.e. semi axes 0.0675 x 0.0375 x
//   0.094, centre y 0.035 above the floor and z +0.04 ahead of the body); +z is the toe, +y up. The blobs sit on that ellipsoid, 0.6 mm proud.
//   spec  side "R"            "R": the right trainer, 3 blobs (diameters 2.6, 1.8, 1.2 cm) on the toe cap and the OUTER side; "L": the left, 2 blobs
//                             (2.2, 1.4 cm). Outer = the foot's -x for R, +x for L (Chip facing +z). spec.mirror true flips the sides' x
//         ell [0.0675, 0.0375, 0.094]   the foot's semi axes (x, y, z); a costume's shoeSize multiplies them: pass it here
//   Stays for the whole film once placed (the clip swaps Chip's shoes at the cut after 0.3 s). Each blob has a gloss shape; no outline gap.
//
// ===== heartjuicecheek   ONE teardrop on Chip's camera-left cheek (a decal kind)
//   ORIGIN: the teardrop's centre on the cheek, +z out of the skin, +y up (the tip points up, the round end down, like a drop that landed);
//   2.0 wide x 2.6 high, 1.5 mm thick, bent to the cheek (radius spec.bend 0.12). The director puts it 0.05 below the eye and 0.06 outside the
//   mouth corner on the camera-left cheek, in the head's frame so it turns with the head. No runs, no smear (the design forbids them).
//   spec  bend 0.12, mirror false (true: the tip leans the other way)
const TAU = Math.PI * 2;
export const HEART_JUICE_STATE = { heartjuice: { burst: 0, pool: 0 } };
const PAL = { base: "#f0502a", shade: "#c9341a", light: "#ff9a6b", gloss: "#fff3e6", seed: "#f6d98a", ink: "#2a1c14" };
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fr = (x) => x - Math.floor(x);
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const G = 9.8, CO = {};
for (const [k, v] of Object.entries(PAL)) CO[k] = new THREE.Color(v);
const juiceMat = () => { const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const flatM = (c) => { const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.FrontSide, toneMapped: false }); m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const capM = (c) => { const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.FrontSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const nolight = (o) => { o.castShadow = false; o.receiveShadow = false; o.userData.solid = false; o.userData.steam = true;   // steam: the clipping check skips it (a decal sits ON Chip)
   o.frustumCulled = false; return o; };

// ---- a flat blob built from a polar radius table rho[N] (angle i/N x 2 pi, x = r sin, z = r cos), vertex-coloured: ink edge, base, shade rim,
//      light band, gloss shape, seeds. H = its thickness; bend = radius of the surface it lies on (0 = flat floor).
function blobGeo({ rho, H, inkW, gl, band, seeds = [], bend = 0, glossK = 1 }) {
  const N = rho.length, pos = [], col = [], idx = [];
  const rm = rho.reduce((a, b) => a + b, 0) / N;
  const vtx = (x, y, z, c) => { const k = pos.length / 3; pos.push(x, y - (bend ? (x * x + z * z) / (2 * bend) : 0), z); col.push(c.r, c.g, c.b); return k; };
  const at = (i, f) => { const a = (i / N) * TAU, r = rho[((i % N) + N) % N] * f; return [r * Math.sin(a), r * Math.cos(a)]; };
  const hf = (f) => (f <= 0.78 ? H * (1 - 0.07 * (f / 0.78)) : f <= 0.93 ? H * (0.93 - 0.33 * ((f - 0.78) / 0.15)) : H * 0.6 * (1 - (f - 0.93) / 0.07));
  const tri = (a, b, c) => idx.push(a, b, c);
  // ink: an annulus from 0.9 of the edge to the edge + inkW, just under the base
  const ink = [];
  for (let i = 0; i < N; i++) { const a = at(i, 0.9), q = at(i, 1), r = rho[i], s = (r + inkW) / r, o = at(i, s); ink.push([vtx(a[0], 0.0002, a[1], CO.ink), vtx(o[0], 0.0002, o[1], CO.ink), q]); }
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; tri(ink[i][0], ink[i][1], ink[j][1]); tri(ink[i][0], ink[j][1], ink[j][0]); }
  // the body: centre, base ring (0.78), shade rings (0.78 again, 0.93, 1.0)
  const c0 = vtx(0, H, 0, CO.base), ring = (f, c) => { const o = []; for (let i = 0; i < N; i++) { const p = at(i, f); o.push(vtx(p[0], hf(f), p[1], c)); } return o; };
  const R1 = ring(0.78, CO.base), R2 = ring(0.78, CO.shade), R3 = ring(0.93, CO.shade), R4 = ring(1.0, CO.shade);
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; tri(c0, R1[j], R1[i]); }
  for (const [A, B] of [[R2, R3], [R3, R4]]) for (let i = 0; i < N; i++) { const j = (i + 1) % N; tri(A[i], A[j], B[j]); tri(A[i], B[j], B[i]); }
  // the warm highlight band: indices band[0]..band[1], between 0.58 and 0.70 of the radius
  if (band) for (let i = band[0]; i < band[1]; i++) { const f0 = 0.58, f1 = 0.70, e = 0.0006, a0 = at(i, f0), a1 = at(i, f1), b0 = at(i + 1, f0), b1 = at(i + 1, f1), t = (i - band[0]) / (band[1] - band[0]), w = Math.sin(Math.PI * Math.min(1, (t + 0.08) / 1.08));
    const m0 = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2], m1 = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2], p = (m, q, k) => [m[0] + (q[0] - m[0]) * k, m[1] + (q[1] - m[1]) * k];
    const w1 = Math.sin(Math.PI * Math.min(1, (t + 1 / (band[1] - band[0]) + 0.08) / 1.08)), A0 = p(m0, a0, w), A1 = p(m0, a1, w), B0 = p(m1, b0, w1), B1 = p(m1, b1, w1);
    const q = [vtx(A0[0], hf(f0) + e, A0[1], CO.light), vtx(A1[0], hf(f1) + e, A1[1], CO.light), vtx(B0[0], hf(f0) + e, B0[1], CO.light), vtx(B1[0], hf(f1) + e, B1[1], CO.light)]; tri(q[0], q[1], q[3]); tri(q[0], q[3], q[2]); }
  // the gloss: a hard white ellipse (a tapering teardrop) at index gl, 0.42 of the radius out
  if (gl) {
    const [gi, gf, ga, gb] = gl, e = 0.0010, c = at(gi, gf), th = (gi / N) * TAU, n = 14, ring2 = [];
    for (let k = 0; k < n; k++) { const q = (k / n) * TAU, ex = ga * rm * Math.cos(q) * (1 + 0.25 * Math.cos(q)), ez = gb * rm * Math.sin(q); const rx = ex * Math.cos(th) + ez * Math.sin(th), rz = -ex * Math.sin(th) + ez * Math.cos(th); ring2.push([c[0] + rx, c[1] + rz]); }
    const ctr = vtx(c[0], hf(gf) + e, c[1], CO.gloss), vs = ring2.map((p) => vtx(p[0], hf(gf) + e, p[1], CO.gloss));
    for (let k = 0; k < n; k++) tri(ctr, vs[k], vs[(k + 1) % n]);
    // a small second dot, as on a glossy sweet
    if (glossK) { const c2 = at(gi + Math.round(N * 0.07), gf * 0.78), d = vtx(c2[0], hf(gf * 0.78) + e, c2[1], CO.gloss), r2 = 0.075 * rm, vs2 = []; for (let k = 0; k < 8; k++) vs2.push(vtx(c2[0] + r2 * Math.cos((k / 8) * TAU), hf(gf * 0.78) + e, c2[1] + r2 * Math.sin((k / 8) * TAU), CO.gloss)); for (let k = 0; k < 8; k++) tri(d, vs2[k], vs2[(k + 1) % 8]); }
  }
  // tomato seeds: pale teardrops 4 mm long, [angle index, radius fraction, turn]
  for (const [si, sf, st] of seeds) {
    const c = at(si, sf), e = 0.0013, y = hf(sf) + e, L = 0.004, W = 0.0024, k0 = vtx(c[0], y, c[1], CO.seed), pts = [];
    for (let k = 0; k < 10; k++) { const q = (k / 10) * TAU, along = Math.cos(q) * L * 0.5 + (Math.cos(q) > 0 ? 0 : 0), wd = Math.sin(q) * W * 0.5 * (0.55 + 0.45 * ((1 - Math.cos(q)) / 2)), x1 = along * Math.cos(st) - wd * Math.sin(st), z1 = along * Math.sin(st) + wd * Math.cos(st); pts.push(vtx(c[0] + x1, y, c[1] + z1, CO.seed)); }
    for (let k = 0; k < 10; k++) tri(k0, pts[k], pts[(k + 1) % 10]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  // up-facing wherever the triangle is: flip any that face down (double sided anyway, but keep a stable order)
  g.setIndex(idx); return g;
}
// a splat's radius table: an uneven blob, with `tails` narrow spikes pointing at angle dir (radians, x = sin, z = cos), at fixed spread
function splatRho(r, seed, tails, dir, N = 72, ax = 1, az = 1, lobes = 0, lobeA = 0) {
  const rho = [], p1 = TAU * rr(seed * 1.3), p2 = TAU * rr(seed * 2.1), p3 = TAU * rr(seed * 3.7);
  const T = []; for (let k = 0; k < tails; k++) T.push([dir + (k - (tails - 1) / 2) * 0.62 + (rr(seed * 5.1 + k) - 0.5) * 0.3, r * (0.7 + 1.0 * rr(seed * 7.7 + k * 1.9)), 0.23 + 0.09 * rr(seed + k * 3.3)]);
  for (let i = 0; i < N; i++) {
    // the ellipse for x = r sin, z = r cos: semi axis ax along x, az along z
    const a = (i / N) * TAU, e = (ax * az) / Math.sqrt((az * Math.sin(a)) ** 2 + (ax * Math.cos(a)) ** 2), s = 1 + 0.09 * Math.sin(3 * a + p1) + 0.05 * Math.sin(5 * a + p2) + 0.03 * Math.sin(7 * a + p3) + (lobes ? lobeA * Math.cos(lobes * a + p1) : 0);
    let q = r * e * s;
    for (const [ta, tl, tw] of T) { const d = Math.atan2(Math.sin(a - ta), Math.cos(a - ta)); q += tl * Math.exp(-((d / tw) * (d / tw))); }
    rho.push(Math.max(q, r * 0.3));
  }
  return rho;
}
const blobMesh = (geo, mat) => nolight(new THREE.Mesh(geo, mat));

// ---- a sphere cap (the drop's gloss and shade shapes): the part of a sphere of radius R within `ang` radians of +z, stretched to an ellipse
function capGeo(R, ang, sq = 1, n = 12, rings = 4) {
  const pos = [], idx = [];
  pos.push(0, 0, R);
  for (let j = 1; j <= rings; j++) for (let i = 0; i < n; i++) { const th = (i / n) * TAU, ph = (j / rings) * ang, s = Math.sin(ph); pos.push(R * s * Math.cos(th) * sq * (1 + 0.18 * Math.cos(th)), R * s * Math.sin(th) / sq, R * Math.cos(ph)); }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n));
  for (let j = 1; j < rings; j++) for (let i = 0; i < n; i++) { const a = 1 + (j - 1) * n + i, b = 1 + (j - 1) * n + ((i + 1) % n), c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
const tearGeo = (L, W, th = 0.0004) => {   // a seed: a flat teardrop lying in the xy plane facing +z
  const sh = new THREE.Shape(); for (let k = 0; k <= 12; k++) { const q = (k / 12) * TAU, x = Math.sin(q) * W * 0.5 * (0.55 + 0.45 * ((1 - Math.cos(q)) / 2)), y = Math.cos(q) * L * 0.5; sh[k ? "lineTo" : "moveTo"](x, y); }
  return new THREE.ShapeGeometry(sh);
};

// ---- the spray's numbers: the 46 flight paths, fixed by index
function dropData(S) {
  const m = S.mouth ?? [0, 0.10, 0.12], yF = S.floor ?? -0.25, out = [];
  const sh = S.shoes ?? [0.9, 1.6], pairs = typeof sh[0] === "number" ? [sh] : sh, ch = S.cheek ?? [0.85, 0.55, 1.65], sY = S.shoeY ?? 0.05;
  for (let i = 0; i < 46; i++) {
    const d = i < 4 ? (i < 3 ? 0.050 : 0.030) : 0.025 + 0.045 * Math.pow(fr(i * 0.41421356 + 0.2), 2);
    let v0, T, e0 = 0, aimed = i < 4;
    if (aimed) {   // arrive at 0.4 s (burst 0.5)
      T = 0.4; let tgt;
      if (i < 3) { const p = pairs[i % pairs.length], dx = typeof sh[0] === "number" ? [-0.06, 0.06, 0][i] : (i % 2 ? 0.02 : -0.02); tgt = [p[0] + dx, yF + sY, p[1] + (i === 2 ? 0.03 : 0)]; } else tgt = ch;
      v0 = [(tgt[0] - m[0]) / T, (tgt[1] - m[1]) / T + 0.5 * G * T, (tgt[2] - m[2]) / T];
    } else {
      const k = i - 4, phi = (-75 + 150 * fr(0.5 + k * 0.6180339887)) * (Math.PI / 180), v = 2.2 + 2.8 * fr(k * 0.569840291 + 0.7);
      let el = (10 + 55 * fr(k * 0.7548776662 + 0.3)) * (Math.PI / 180); el = Math.max(10 * (Math.PI / 180), Math.min(el, Math.asin(Math.min(1, 3.3 / v))));
      const vh = v * Math.cos(el); v0 = [vh * Math.sin(phi), v * Math.sin(el), vh * Math.cos(phi)];
      e0 = 0.04 * rr(i * 3.1 + 1);
      const h0 = m[1] - yF; T = (v0[1] + Math.sqrt(v0[1] * v0[1] + 2 * G * h0)) / G;
    }
    const L = [m[0] + v0[0] * T, yF, m[2] + v0[2] * T];
    out.push({ d, v0, T, e0, aimed, L, seed: i % 3 === 0 });
  }
  return out;
}

// ===================================================================================================================================
export const HEART_JUICE_KINDS = {
  heartjuice(P) {
    const S = P.spec, m = S.mouth ?? [0, 0.10, 0.12], yF = S.floor ?? -0.25, D = dropData(S), root = new THREE.Group(); P.whole.add(root);
    const bodyM = juiceMat(), hullM = (() => { const mm = flatM(PAL.ink); mm.side = THREE.BackSide; return mm; })(), baseM = capM(PAL.base), shadeM = capM(PAL.shade), glossM = capM(PAL.gloss), seedM = capM(PAL.seed);
    const LG = new THREE.Vector3(-0.35, 0.65, 0.68).normalize();   // the gloss's direction in the world (key from the upper left, toward the camera)
    // ---- the 46 drops: a stretched ball, an ink hull, a shade half and a gloss shape that keep their world direction, 1 in 3 with a seed
    const unit = new THREE.SphereGeometry(0.5, 16, 12), capShade = capGeo(0.5, 1.15, 1, 16, 5), capGloss = capGeo(0.5, 0.42, 1.55, 14, 3), seedG = tearGeo(0.004, 0.0024);
    const drops = D.map((d, i) => {
      const g = new THREE.Group(), body = blobMesh(unit, baseM), hull = blobMesh(unit, hullM); hull.scale.setScalar(1.13 + 0.05 * (0.025 / d.d));
      const sd = blobMesh(capShade, shadeM), gl = blobMesh(capGloss, glossM); sd.scale.setScalar(1.004); gl.scale.setScalar(1.012);
      g.add(hull, body, sd, gl); let seed = null;
      if (d.seed) { seed = blobMesh(seedG, seedM); seed.scale.setScalar(1 / 1); g.add(seed); }
      g.visible = false; root.add(g); return { g, sd, gl, seed, i };
    });
    // ---- the 42 free splats, each at its landing spot
    const splats = D.map((d, i) => {
      if (d.aimed) return null;
      const r = 0.95 * d.d, dir = Math.atan2(d.L[0], d.L[2]), rho = splatRho(r, i + 20, 2, dir, 56);
      const seeds = d.seed ? [[Math.round(56 * 0.3), 0.45, 0.6 + i]] : [];
      const geo = blobGeo({ rho, H: 0.0025, inkW: 0.0016 + 0.012 * r, gl: [Math.round(56 * 0.62), 0.42, 0.30, 0.13], band: [Math.round(56 * 0.06), Math.round(56 * 0.32)], seeds, glossK: 0 });
      const o = blobMesh(geo, bodyM); o.position.set(d.L[0], yF + 0.0015 + 0.0001 * (i % 5), d.L[2]); o.visible = false; root.add(o); return o;
    });
    // ---- the pool: the main pool + 14 splats + 20 dots (all pointing away from S), lying under the pan
    const poolG = new THREE.Group(); poolG.position.y = yF + 0.0016; root.add(poolG);
    const mainRho = splatRho(0.2, 7, 0, 0, 96, 0.275 / 0.2, 0.19 / 0.2, 5, 0.17), main = blobMesh(blobGeo({ rho: mainRho, H: 0.006, inkW: 0.004, gl: [Math.round(96 * 0.60), 0.42, 0.26, 0.10], band: [Math.round(96 * 0.03), Math.round(96 * 0.34)], seeds: [0, 1, 2, 3, 4, 5, 6].map((k) => [Math.round(96 * (0.5 + 0.11 * k + 0.3 * rr(k + 3))) % 96, 0.15 + 0.5 * rr(k * 2.7 + 1), 1 + 2.4 * k]) }), bodyM);
    poolG.add(main);
    const pops = [];   // [mesh, appear 0..1]
    for (let k = 0; k < 14; k++) {
      const rd = 0.30 + 1.3 * Math.pow((k + 0.5) / 14, 1.1), a = k * 2.39996 + 0.8, x = rd * Math.sin(a) * 1.0, z = rd * Math.cos(a), r = 0.02 + 0.06 * rr(k * 2.9 + 4), dir = Math.atan2(x, z), tl = 2 + (k % 3);
      const rho = splatRho(r, 100 + k, tl, dir, 64), geo = blobGeo({ rho, H: 0.003, inkW: 0.0018 + 0.01 * r, gl: [Math.round(64 * 0.62), 0.42, 0.30, 0.13], band: [Math.round(64 * 0.05), Math.round(64 * 0.32)], seeds: k % 3 === 0 ? [[Math.round(64 * 0.3), 0.42, 0.9 + k]] : [], glossK: 0 });
      const o = blobMesh(geo, bodyM); o.position.set(x, 0.0001 * (k % 4), z); o.visible = false; poolG.add(o); pops.push([o, 0.1 + 0.6 * (k / 14), 0.2]);
    }
    for (let k = 0; k < 20; k++) {
      const a0 = k < 14 ? k * 2.39996 + 0.8 : k * 1.7 + 0.2, rd0 = k < 14 ? 0.30 + 1.3 * Math.pow((k + 0.5) / 14, 1.1) : 0.5 + 1.2 * rr(k * 1.3);
      const ex = k < 14 ? 0.11 + 0.08 * rr(k * 2.3) : 0, ra = k < 14 ? a0 + (rr(k + 40) - 0.5) * 0.9 : a0, x = (rd0 + ex + (k < 14 ? 0.05 : 0)) * Math.sin(ra), z = (rd0 + ex + (k < 14 ? 0.05 : 0)) * Math.cos(ra), r = 0.005 + 0.005 * rr(k * 3.9 + 2);
      const rho = splatRho(r, 200 + k, 0, 0, 28), geo = blobGeo({ rho, H: 0.0025, inkW: 0.0012, gl: [Math.round(28 * 0.62), 0.38, 0.32, 0.18], band: [Math.round(28 * 0.04), Math.round(28 * 0.30)], glossK: 0 });
      const o = blobMesh(geo, bodyM); o.position.set(x, 0.0001, z); o.visible = false; poolG.add(o); pops.push([o, 0.15 + 0.7 * (k / 20), 0.15]);
    }
    const dir = new THREE.Vector3(), qq = new THREE.Quaternion(), qi = new THREE.Quaternion(), zax = new THREE.Vector3(0, 0, 1), dl = new THREE.Vector3(), ds = new THREE.Vector3();
    const pose = (burst, pool) => {
      const t = 0.8 * burst;
      drops.forEach(({ g, sd, gl, seed, i }) => {
        const d = D[i], tt = t - d.e0, T = d.T;
        const flying = burst > 0 && tt > 0 && tt < T, landed = burst > 0 && tt >= T && !d.aimed;
        g.visible = flying;
        if (flying) {
          const x = m[0] + d.v0[0] * tt, y = m[1] + d.v0[1] * tt - 0.5 * G * tt * tt, z = m[2] + d.v0[2] * tt;
          dir.set(d.v0[0], d.v0[1] - G * tt, d.v0[2]).normalize(); qq.setFromUnitVectors(zax, dir); g.quaternion.copy(qq); g.position.set(x, y, z);
          g.scale.set(d.d, d.d, d.d * 1.6);
          qi.copy(qq).invert(); dl.copy(LG).applyQuaternion(qi); gl.quaternion.setFromUnitVectors(zax, dl); ds.copy(LG).negate().add(new THREE.Vector3(0.12, -0.35, 0)).normalize().applyQuaternion(qi); sd.quaternion.setFromUnitVectors(zax, ds);
          if (seed) { const sn = new THREE.Vector3(0.55, 0.15, 0.8).normalize().applyQuaternion(qi); seed.position.copy(sn).multiplyScalar(0.5 * 1.012); seed.quaternion.setFromUnitVectors(zax, sn); seed.scale.setScalar(1 / d.d); }
        }
        if (!d.aimed) { const o = splats[i]; o.visible = landed; if (landed) { const s = 0.35 + 0.65 * ss((tt - T) / 0.05); o.scale.set(s, s, s); } }
      });
      main.visible = pool > 0; main.scale.setScalar(0.33 + 0.67 * ss(pool / 0.45)); main.scale.y = 1;
      for (const [o, a0, w] of pops) { const s = ss((pool - a0) / w); o.visible = s > 0.002; o.scale.setScalar(Math.max(s, 0.01)); }
    };
    pose(S.burst ?? 0, S.pool ?? 0);
    return { grip: 0, apply(ps) { pose(clamp(ps.burst ?? S.burst ?? 0), clamp(ps.pool ?? S.pool ?? 0)); } };
  },

  // ---- the stains on one trainer
  heartjuiceshoe(P) {
    const S = P.spec, side = S.side === "L" ? "L" : "R", mir = S.mirror ? -1 : 1, out = (side === "R" ? -1 : 1) * mir, [A, B, C] = S.ell ?? [0.0675, 0.0375, 0.094];
    const bodyM = juiceMat(), root = new THREE.Group(); P.whole.add(root);
    // [diameter, direction from the foot's centre (x outward, y, z toe)]
    const B3 = side === "R" ? [[0.026, [out * 0.12, 0.55, 1.0]], [0.018, [out * 1.0, 0.30, 0.45]], [0.012, [out * 0.62, 0.62, 0.95]]] : [[0.022, [out * 0.35, 0.60, 1.0]], [0.014, [out * 1.0, 0.32, 0.18]]];
    B3.forEach(([dia, v], k) => {
      const n = Math.hypot(v[0] / A, v[1] / B, v[2] / C), p = v.map((c) => c / n), nrm = new THREE.Vector3(p[0] / (A * A), p[1] / (B * B), p[2] / (C * C)).normalize();
      const Rc = 0.045, r = dia / 2, rho = splatRho(r, 300 + k + (side === "L" ? 10 : 0), 0, 0, 48), geo = blobGeo({ rho, H: 0.0016, inkW: 0.0008 + 0.02 * r, gl: [Math.round(48 * 0.62), 0.40, 0.30, 0.14], band: [Math.round(48 * 0.05), Math.round(48 * 0.30)], bend: Rc, glossK: 0 });
      const o = blobMesh(geo, bodyM), g = new THREE.Group(); g.position.set(p[0], p[1], p[2]).addScaledVector(nrm, 0.0006); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); g.add(o); g.rotateY(k * 1.7); root.add(g);
    });
    return { grip: 0 };
  },

  // ---- the teardrop on the cheek
  heartjuicecheek(P) {
    const S = P.spec, mir = S.mirror ? -1 : 1, bend = S.bend ?? 0.12, bodyM = juiceMat(), N = 72;
    // the outline: a teardrop with the tip up, scaled to exactly 2.0 x 2.6 cm; its radius table from the bulb centre
    const pts = []; for (let k = 0; k < 400; k++) { const q = (k / 400) * TAU; pts.push([Math.sin(q) * Math.pow(Math.sin(q / 2), 1.0) * (mir), Math.cos(q)]); }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sx = 0.020 / (x1 - x0), sy = 0.026 / (y1 - y0), cy = y0 + 0.36 * (y1 - y0), cx = (x0 + x1) / 2, poly = pts.map(([x, y]) => [(x - cx) * sx, -(y - cy) * sy]);   // the blob's z is the drop's -y (turned up below)
    const rho = []; for (let i = 0; i < N; i++) {   // a ray from the origin (x = r sin a, z = r cos a, here z = the drop's y) to the polygon
      const a = (i / N) * TAU, dx = Math.sin(a), dz = Math.cos(a); let best = 0;
      for (let k = 0; k < poly.length; k++) { const p = poly[k], q = poly[(k + 1) % poly.length], ex = q[0] - p[0], ez = q[1] - p[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-12) continue; const t = (p[0] * ez - p[1] * ex) / den, u = (p[0] * dz - p[1] * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t); }
      rho.push(best);
    }
    const geo = blobGeo({ rho, H: 0.0015, inkW: 0.0016, gl: [Math.round(N * 0.88), 0.45, 0.30, 0.13], band: [Math.round(N * 0.40), Math.round(N * 0.62)], bend, glossK: 0 });
    const o = blobMesh(geo, bodyM); o.rotation.x = Math.PI / 2;   // the blob's own y is thickness: stand it up so it faces +z, its z (the drop's y) becomes up
    const g = new THREE.Group(); g.add(o); P.whole.add(g);
    return { grip: 0 };
  },
};

export const HEART_JUICE_GRIPS = {};
