import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, rng } from "./util.js";
import { mat } from "./props-trend.js";
import { clothMat, inkMesh } from "./costumes-art.js";
import { fleeceTexture } from "./costumes-everyday.js";

// "Take the lift" (friends try to 10): the hotel breakfast buffet that pours out of Chip's hoodie. Design:
// storyboards/series/friends-try-to/10-take-the-lift/DESIGN-buffet.md. Own file, so parallel clips never edit the same one
// (props3d.js merges BUFFET_KINDS and BUFFET_GRIPS on their own line). Metres, y up, front +z. No lettering. Every scatter
// is hashed from spec.seed or an index (no Math.random, no clock). Toon look: every item is a few merged flat-colour meshes
// with the standard ink outline; marks smaller than 0.008 m (flakes, seeds, freckles, glints, drips) are flat strokes lying on
// the surface with noOutline, so they never turn into black dots. No potato food: no round tan lump anywhere (the cast skin
// is #e2a95c); the melon is green, the roll is split and seeded.
//
// LOOSE ITEMS (nine kinds, each ONE rigid body: spec.body, ready-made in BUFFET[kind].body, e.g.
//   { id: "c1", kind: "croissant", x, y: 0.5, z, body: BUFFET.croissant.body }; then c.drop(t, "c1") or c.throw(...)).
//   Origin: bottom centre in the resting pose, long axis along x (the melon: its CENTRE, like `apple`). spec.seed varies the
//   hand-drawn marks. Every loose item has the key `in` 0..1 (spec.in, default 1): 0 hides it (visible false), anything over
//   0.01 shows it. A clip parks an item with `in: 0` and sets `in: 1` AT OR BEFORE its c.drop / c.throw time: the physics bake
//   takes the body's shape from the prop's pose AT that time, and an item that is hidden then has no body.
//   croissant     0.154 x 0.056 x 0.095 (x y z): seven fat segments on an arc, horns toward +z, grooves, glaze, flakes.
//   sausage       0.115 long, r 0.017: grilled sausage on a shallow arch, knotted ends. BUFFET_GRIPS.sausage.end = the end
//                 that stays up the sleeve, [-0.0575, 0.017, 0] (the prop's origin is its middle).
//   pancakestack  r 0.08 (0.171 x 0.083 x 0.164 with the drips), 0.083 high: four pancakes, butter on its melt, syrup with drips and a glint. Lands flat and stays.
//   melon         honeydew, r 0.10 (scale 1.06, 0.96, 1: a wobbling roll). Heavy: one thud, then a slow roll.
//   breadroll     0.095 x 0.055 x 0.075: split poppy-seed roll (split and seeds so it never reads as a potato).
//   banana        0.19 along its arc, lying on its side, belly toward +z. spec.n 1 (default) .. 3: a fanned hand on one stem block.
//   juicejug      lidded glass carafe 0.173 high with its knob (0.165 to the lid), orange juice in it, handle on +x. Never breaks, never opens.
//   waffle        Belgian square 0.115 x 0.024 x 0.115 (4 x 4 pockets, icing sugar on one corner); body shape "box".
//   muffin        blueberry muffin 0.086 across, 0.08 high, in its paper case.
// BUFFET (export): { <kind>: { w, h, d, body } }, the real sizes and the body defaults of every loose kind.
//
// buffetheap     the pile beside Chip (origin: floor centre). spec.r 0.45, spec.h 0.45, spec.seed 7, spec.melon false (true
//                puts a melon on the peak). Keys: `fill` 0..1 (spec.fill, default 1: seed it with a dur-0 set; the mound grows
//                as a pour does and 5 or 6 items are in the air while it moves, so hold `fill` only at 0 or 1), `jolt` 0..1
//                (spec.jolt, default 0: tween 0 -> 1 once, every item hops up to 0.02 x its height / h and back; for the melon's
//                landing). 52 items at fill 1 (croissant 9, roll 8, sausage 7, waffle 5, muffin 5, apple 5, banana 4, pancakes
//                3, egg 3, jug 2, plate 1; no melon). The core (lumpy brown dome 20 % inside the shape, hidden below fill 0.08)
//                is what loose things land on. For the physics bake the heap also carries an INVISIBLE full-size copy of
//                the core (colorWrite and depthWrite off), so it is solid at full size from frame 0 whatever `fill` is at the
//                moment the bake reads it: aim loose items outside its 0.45 radius, only the melon lands on it. The heap
//                items are meshes too (the bake reads the ones visible at that moment).
//
// hoodiestuff    the buffet under Chip's hoodie. WORN (never solid): spec.wear "chip", x y z 0 (built in his body frame, origin
//                his feet, like `satchel`). Key `fill` 0..1 (spec.fill, default 1). Body ellipsoid: centre y 0.405, half sizes
//                0.285 x 0.265 x 0.26, taper 0.02 (those are Chip's numbers and the defaults; spec.fit { rx, ry, rz, cy, taper }
//                overrides). spec.color the hoodie yellow (default #ffcf2e). A lumpy patch of the same fleece cloth over his
//                belly (azimuth -105..+105, elevation -22..-72), the stitch redrawn over it, a fold-ink crescent on the visible rim of each lump (the under side faces the floor, a camera above never sees it),
//                three pull lines at the melon, and the croissant tip under the hem (az +40; shown while fill > 0.9, gone by
//                0.82). Lumps flatten as fill goes down: roll +58 (0.98 -> 0.88), roll -55 (0.90 -> 0.80), waffle edge
//                (0.80 -> 0.65), banana (0.70 -> 0.55), jug corner (0.55 -> 0.40), melon last (slides down 0.35 -> 0.12, gone
//                0.12 -> 0.03); hidden below 0.02. Keep Chip's squash under 5 % while fill > 0.

const V3 = THREE.Vector3, DEG = Math.PI / 180;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const M4 = (p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => new THREE.Matrix4().compose(new V3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "YXZ")), new V3(...s));
const dirAE = (az, el) => new V3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));

export const BUFFET_GRIPS = { sausage: { end: [-0.0575, 0.017, 0] } };

// ---------------------------------------------------------------------------------------------------- kit: merged flat-colour meshes
// add(geo, color, opts, matrix): opts { rough, metal, mark (a flat stroke: noOutline, drawn over the surface) }
function kit() {
  const bins = new Map();
  return {
    add(geo, color, o = {}, M = null) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (M) g.applyMatrix4(M);
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const key = [color, o.rough ?? 0.7, o.metal ?? 0, o.mark ? 1 : 0, o.glass ?? 0].join("|");
      if (!bins.has(key)) bins.set(key, { color, o, geos: [] });
      bins.get(key).geos.push(g);
    },
    flush(parent) {
      for (const { color, o, geos } of bins.values()) {
        const merged = mergeGeometries(geos); if (!merged) continue;
        let m;
        if (o.mark) {
          m = mat(color, { roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
          m.userData.noOutline = true; m.userData.noHatch = true;
        } else if (o.glass) {
          m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, transparent: true, opacity: o.glass, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); m.userData.glass = true;
        } else m = mat(color, { roughness: o.rough ?? 0.7, metalness: o.metal ?? 0 });
        const mesh = new THREE.Mesh(merged, m); mesh.castShadow = !o.mark && !o.glass; mesh.receiveShadow = true; if (o.glass) mesh.renderOrder = 3; parent.add(mesh);
      }
      return parent;
    },
  };
}
// origin to the bottom centre (or the centre) of what was built
function settle(g, centre = false) {
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new V3()), w = new THREE.Group();
  g.position.set(-c.x, centre ? -c.y : -box.min.y, -c.z); w.add(g); return w;
}
// a frame lying on a surface at p with normal n, turned rot about n, lifted along n
function frameAt(p, n, rot = 0, lift = 0) {
  const ref = Math.abs(n.y) < 0.92 ? new V3(0, 1, 0) : new V3(1, 0, 0), x0 = ref.clone().cross(n).normalize(), y0 = n.clone().cross(x0);
  const x = x0.clone().multiplyScalar(Math.cos(rot)).addScaledVector(y0, Math.sin(rot)), y = n.clone().cross(x);
  return new THREE.Matrix4().makeBasis(x, y, n).setPosition(p.clone().addScaledVector(n, lift));
}
// a flat capsule stroke along x (length len, width w), a flat ellipse disc (rx, ry)
const flat = (len, w, th = 0.0006) => { const g = new THREE.CapsuleGeometry(w / 2, Math.max(1e-4, len - w), 2, 6); g.rotateZ(Math.PI / 2); g.scale(1, 1, th / (w / 2)); return g; };
const disc = (rx, ry = rx, seg = 12) => { const g = new THREE.CircleGeometry(1, seg); g.scale(rx, ry, 1); return g; };
// a ribbon following fn(u) -> { p, n } for u 0..1 (closed: u 1 is u 0), half width wf(u), lifted along the normal
function ribbon(fn, N, wf, lift = 0.0007, closed = false) {
  const pts = []; for (let i = 0; i <= N; i++) pts.push(fn(i / N));
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = pts[closed ? (i + N - 1) % N : Math.max(0, i - 1)].p, b = pts[closed ? (i + 1) % N : Math.min(N, i + 1)].p, t = b.clone().sub(a).normalize();
    const { p, n } = pts[i], s = n.clone().cross(t).normalize().multiplyScalar(wf(i / N)), q = p.clone().addScaledVector(n, lift);
    pos.push(q.x - s.x, q.y - s.y, q.z - s.z, q.x + s.x, q.y + s.y, q.z + s.z); nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
    if (i < N) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
const taper = (hw) => (u) => hw * (0.25 + 0.75 * Math.sin(Math.PI * u));
// a point on an ellipsoid with semi axes ax in the unit direction u: { p, n }
const ellPt = (ax, u) => ({ p: new V3(u.x * ax[0], u.y * ax[1], u.z * ax[2]), n: new V3(u.x / ax[0], u.y / ax[1], u.z / ax[2]).normalize() });
// a flat stroke or disc lying on an ellipsoid
function onEll(K, color, ax, u, rot, len, w, M = null, o = {}) {
  const { p, n } = ellPt(ax, u.clone().normalize()), F = frameAt(p, n, rot, 0.0005 + w * 0.1); if (M) F.premultiply(M);
  K.add(len === w ? disc(w / 2, w / 2, 10) : flat(len, w), color, { mark: true, ...o }, F);
}
const sphereG = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
const ellG = (ax, ws = 16, hs = 12) => { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(ax[0], ax[1], ax[2]); return g; };

// ---------------------------------------------------------------------------------------------------- croissant
function croissant(seed = 1) {
  const K = kit(), r = rng(1100 + seed * 13), g = new THREE.Group(), R = 0.066, RS = [0.013, 0.021, 0.027, 0.030, 0.027, 0.021, 0.013], AX = [1.15, 0.93, 0.85];
  const cum = [0]; for (let i = 0; i < 6; i++) cum.push(cum[i] + 0.65 * (RS[i] + RS[i + 1]));
  const ang = cum.map((c) => (-80 + 160 * (c / cum[6])) * DEG), seg = [];
  RS.forEach((rr, i) => {
    const a = ang[i], pos = new V3(R * Math.sin(a), AX[1] * rr, -R * Math.cos(a)), M = new THREE.Matrix4().makeBasis(new V3(Math.cos(a), 0, Math.sin(a)), new V3(0, 1, 0), new V3(-Math.sin(a), 0, Math.cos(a))).setPosition(pos);
    seg.push({ pos, M, rr });
    K.add(ellG([rr * AX[0], rr * AX[1], rr * AX[2]], 16, 12), i % 2 ? "#d68d2c" : "#e2a03a", { rough: 0.7 }, M);
  });
  const sx = (rr) => [rr * AX[0], rr * AX[1], rr * AX[2]];
  // a groove in each of the 6 joints: a thin disc a touch wider than the crossing of the two segments
  for (let i = 0; i < 6; i++) {
    const A = seg[i], B = seg[i + 1], d = A.pos.distanceTo(B.pos), x1 = (d * d + A.rr * A.rr - B.rr * B.rr) / (2 * d), rc = Math.sqrt(Math.max(1e-6, A.rr * A.rr - x1 * x1)) * 1.045;
    const dir = B.pos.clone().sub(A.pos).normalize(), c = A.pos.clone().addScaledVector(dir, x1), M = new THREE.Matrix4().makeBasis(dir, new V3(0, 1, 0), dir.clone().cross(new V3(0, 1, 0))).setPosition(c);
    K.add(ellG([0.0015, rc * AX[1], rc * AX[2]], 6, 14), "#9c5a1e", { mark: true }, M);
  }
  // glaze stripe on the three middle ridges, and 2-3 flake strokes on every segment
  for (let i = 2; i <= 4; i++) {
    const { M, rr } = seg[i], ax = sx(rr);
    K.add(ribbon((u) => { const th = (u - 0.5) * 2.0, d = new V3(0.3, Math.cos(th), Math.sin(th)).normalize(); return ellPt(ax, d); }, 14, taper(0.0032), 0.0006), "#ffe2a0", { mark: true, rough: 0.3 }, M);
  }
  seg.forEach(({ M, rr }, i) => {
    const n = 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) onEll(K, "#b9742a", sx(rr), new V3((r() - 0.5) * 1.4, 0.35 + r() * 0.65, (r() - 0.5) * 1.5), r() * 6.28, 0.007 + r() * 0.008, 0.0022, M);
    void i;
  });
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- sausage
function sausage(seed = 1) {
  const K = kit(), r = rng(1200 + seed * 7), g = new THREE.Group(), RR = 0.017, HL = 0.0515, cy = (x) => RR + 0.007 * Math.max(0, 1 - (x / HL) ** 2);
  const pts = []; for (let i = 0; i <= 16; i++) { const x = -0.0345 + (0.069 * i) / 16; pts.push(new V3(x, cy(x), 0)); }
  K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, RR, 14, false), "#b5562c", { rough: 0.35 });
  for (const s of [-1, 1]) { K.add(sphereG(RR, 14, 10), "#b5562c", { rough: 0.35 }, M4([s * 0.0345, cy(s * 0.0345), 0])); K.add(sphereG(0.006, 8, 6), "#8f4322", { rough: 0.5 }, M4([s * HL, RR, 0])); }
  // three grill bands, tilted 25 degrees, gaps 0.021 and 0.03, three different lengths, round the top
  const bands = [[-0.021, 62, -8], [0.0, 74, 6], [0.03, 50, -3]];
  for (const [x0, half, ph] of bands) {
    K.add(ribbon((u) => { const f = ((ph + (u - 0.5) * 2 * half) * DEG), x = x0 + (u - 0.5) * 2 * half * DEG * RR * Math.tan(25 * DEG) * 1.2; return { p: new V3(x, cy(x), 0).add(new V3(0, Math.cos(f), Math.sin(f)).multiplyScalar(RR)), n: new V3(0, Math.cos(f), Math.sin(f)) }; }, 16, () => 0.0025, 0.0006), "#5a2713", { mark: true, rough: 0.4 });
  }
  K.add(ribbon((u) => { const x = -0.025 + 0.05 * u, f = 30 * DEG; return { p: new V3(x, cy(x), 0).add(new V3(0, Math.cos(f), Math.sin(f)).multiplyScalar(RR)), n: new V3(0, Math.cos(f), Math.sin(f)) }; }, 10, taper(0.002), 0.0006), "#f0b58c", { mark: true, rough: 0.25 });
  return settle(K.flush(g));   // origin: the middle of the sausage, y 0 = its lowest point
}

// ---------------------------------------------------------------------------------------------------- pancake stack
const PCR = [0.078, 0.074, 0.080, 0.072], PCT = 0.0165, PCS = [[0, 0], [0.007, -0.004], [-0.006, 0.005], [0.004, 0.006]];
function pancakeStack(seed = 1) {
  const K = kit(), r = rng(1300 + seed * 11), g = new THREE.Group(), tops = [];
  PCR.forEach((R, i) => {
    const tx = (r() - 0.5) * 2 * 3 * DEG, tz = (r() - 0.5) * 2 * 3 * DEG, M = M4([PCS[i][0], i * PCT * 0.97, PCS[i][1]], [tx, 0, tz]), e = 0.0082, edge = [];
    for (let k = 0; k <= 8; k++) { const th = (-90 + k * 22.5) * DEG; edge.push(new THREE.Vector2(R - e + e * Math.cos(th), e + e * Math.sin(th))); }
    edge.unshift(new THREE.Vector2(R - e, 0)); edge.push(new THREE.Vector2(R - e, PCT));
    const lat = new THREE.LatheGeometry(edge.map((q) => new THREE.Vector2(q.x, q.y * (PCT / (2 * e)) )), 30);
    K.add(lat, "#f4d99a", { rough: 0.7 }, M);
    const top = new THREE.CircleGeometry(R - e, 30); top.rotateX(-Math.PI / 2); K.add(top, "#cc8736", { rough: 0.7 }, M.clone().multiply(M4([0, PCT + 0.0002, 0])));
    const ring = new THREE.RingGeometry(R - e - 0.008, R - e, 30); ring.rotateX(-Math.PI / 2); K.add(ring, "#eebd6c", { mark: true }, M.clone().multiply(M4([0, PCT + 0.0006, 0])));
    tops.push(M);
  });
  const T = tops[3], TY = PCT + 0.0006;   // top pancake frame, top face height
  // blotches, melt puddle, butter, syrup pool with six lobes, four drips, glint (all in the top pancake's frame)
  const add = (geo, color, o, M) => K.add(geo, color, o, T.clone().multiply(M));
  for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = 0.045 + r() * 0.022, q = disc(0.008 + r() * 0.01, 0.007 + r() * 0.008, 10); q.rotateX(-Math.PI / 2); add(q, "#b3702a", { mark: true }, M4([Math.sin(a) * d, TY + 0.0026, Math.cos(a) * d], [0, r() * 3, 0])); }
  const lobes = Array.from({ length: 7 }, (_, k) => (k === 6 ? null : 0.045 + r() * 0.021)); lobes[6] = lobes[0];
  const pr = (a) => { const s = ((a / (2 * Math.PI)) % 1 + 1) % 1 * 6, k = Math.floor(s); return lerp(lobes[k], lobes[k + 1], smooth(0, 1, s - k)); };
  const sh = new THREE.Shape(); for (let k = 0; k < 48; k++) { const a = (k / 48) * 2 * Math.PI; sh.lineTo(Math.cos(a) * pr(a) * 1, Math.sin(a) * pr(a)); } sh.closePath();
  const pool = new THREE.ShapeGeometry(sh, 1); pool.rotateX(-Math.PI / 2);   // xy -> xz (y -> -z): az measured below accounts for it
  add(pool, "#9a4a14", { mark: true, rough: 0.18 }, M4([0, TY + 0.0012, 0]));
  const puddle = disc(0.027, 0.027, 20); puddle.rotateX(-Math.PI / 2); add(puddle, "#ffe98a", { mark: true, rough: 0.3 }, M4([0.01, TY + 0.0022, 0.004]));
  add(new RoundedBoxGeometry(0.034, 0.013, 0.034, 2, 0.004), "#fff2a6", { rough: 0.4 }, M4([0.01, TY + 0.0065 + 0.0018, 0.004], [0, 24 * DEG, 0]));
  // drips: over the rim and down the side (the side follows the stack's own radii: a drip bridges each ledge)
  [[15, 0.022], [100, 0.05], [190, 0.03], [300, 0.055]].forEach(([azd, L]) => {
    const a = azd * DEG, sx = Math.sin(a), cz = Math.cos(a), RT = PCR[3], e = 0.0082, pathPts = [];
    const n = 22; for (let i = 0; i <= n; i++) {
      const s = (i / n) * (0.02 + L);   // along the path: 0.02 across the top face, then the rounded edge, then straight down
      let rho, y, nr;
      if (s < 0.02) { rho = RT - e - 0.02 + s; y = PCT + 0.0016; nr = [0, 1]; }
      else if (s < 0.02 + 0.0129) { const th = (s - 0.02) / e; rho = RT - e + (e + 0.0007) * Math.sin(th); y = PCT - e + (e + 0.0007) * Math.cos(th); nr = [Math.sin(th), Math.cos(th)]; }
      else { const d = s - 0.0329; rho = RT + 0.0007; y = PCT - e - d; nr = [1, 0]; }
      pathPts.push({ p: new V3(sx * rho, y, cz * rho), n: new V3(sx * nr[0], nr[1], cz * nr[0]) });
    }
    add(ribbon((u) => pathPts[Math.round(u * n)], n, (u) => 0.006 * (1 - 0.35 * u), 0.0006), "#9a4a14", { mark: true, rough: 0.18 }, M4());
    const end = pathPts[n], dropM = new THREE.Matrix4().makeBasis(new V3(cz, 0, -sx), new V3(0, 1, 0), new V3(sx, 0, cz)).setPosition(end.p.clone().add(new V3(sx * 0.004, -0.004, cz * 0.004)));
    add(ellG([0.0055, 0.0095, 0.0055], 10, 8), "#9a4a14", { mark: true, rough: 0.18 }, dropM);
  });
  add(flat(0.02, 0.004, 0.0005), "#fff6e0", { mark: true, rough: 0.2 }, M4([-0.012, TY + 0.0017, 0.03], [0, 0.5, 0]).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- melon (origin: its centre)
function melon(seed = 1) {
  const K = kit(), r = rng(1400 + seed * 5), g = new THREE.Group(), AX = [0.106, 0.096, 0.1];
  K.add(ellG(AX, 28, 20), "#bfd96b", { rough: 0.3 });
  const cheek = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, 0.85), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dirAE(40 * DEG, -22 * DEG));
  cheek.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); cheek.scale(AX[0] * 1.004, AX[1] * 1.004, AX[2] * 1.004); K.add(cheek, "#dcec9a", { mark: true, rough: 0.3 });
  // nine lines from stem to tip, each wavering, three of them broken
  for (let i = 0; i < 9; i++) {
    const az0 = (i / 9) * 6.283 + (r() - 0.5) * 0.3, amp = 0.05 + r() * 0.08, ph = r() * 6, hw = (0.003 + r() * 0.004) / 2, broken = i % 3 === 1;
    const line = (u0, u1) => ribbon((u) => { const uu = lerp(u0, u1, u); return ellPt(AX, dirAE(az0 + amp * Math.sin(uu * 5 + ph), (80 - 160 * uu) * DEG, 0)); }, 16, (u) => hw * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1))), 0.0006);
    if (broken) { const cut = 0.35 + r() * 0.3; K.add(line(0, cut), "#9dbb4e", { mark: true }); K.add(line(cut + 0.1, 1), "#9dbb4e", { mark: true }); } else K.add(line(0, 1), "#9dbb4e", { mark: true });
  }
  for (let i = 0; i < 14; i++) onEll(K, "#a3c258", AX, new V3(r() - 0.5, (r() - 0.5) * 1.7, r() - 0.5), r() * 6, 0.005 + r() * 0.004, 0.003 + r() * 0.002);
  K.add(disc(0.014, 0.014, 14), "#a89250", { mark: true }, frameAt(new V3(0, AX[1], 0), new V3(0, 1, 0), 0, 0.0008).premultiply(new THREE.Matrix4()));
  K.add(new THREE.CylinderGeometry(0.0055, 0.0065, 0.012, 8), "#6f6030", { rough: 0.8 }, M4([0, AX[1] + 0.005, 0]));
  onEll(K, "#f3fbd0", AX, dirAE(-40 * DEG, 35 * DEG), 0.4, 0.03, 0.015, null, { rough: 0.2 });
  return K.flush(g);
}

// ---------------------------------------------------------------------------------------------------- bread roll
function breadroll(seed = 1) {
  const K = kit(), r = rng(1500 + seed * 9), g = new THREE.Group(), AX = [0.0475, 0.0367, 0.0375], CUT = -0.5 * AX[1];
  const top = new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, 120 * DEG); top.scale(AX[0], AX[1], AX[2]);
  K.add(top, "#c8842f", { rough: 0.75 });
  const base = new THREE.CircleGeometry(1, 28); base.rotateX(Math.PI / 2); base.scale(AX[0] * 0.866, 1, AX[2] * 0.866); K.add(base, "#b57426", { rough: 0.75 }, M4([0, CUT, 0]));
  // the split: crumb, a darker lip each side; the floury ring round the foot
  const onTop = (x, z) => { const u = new V3(x / AX[0], 0, z / AX[2]); u.y = Math.sqrt(Math.max(0.02, 1 - u.x * u.x - u.z * u.z)); return ellPt(AX, u); };
  K.add(ribbon((u) => onTop(-0.036 + 0.072 * u, 0.0015 * Math.sin(u * 6)), 14, taper(0.0085), 0.0007), "#f6e6bd", { mark: true, rough: 0.9 });
  for (const s of [-1, 1]) K.add(ribbon((u) => onTop(-0.035 + 0.07 * u, s * 0.0105 + 0.0015 * Math.sin(u * 6)), 14, taper(0.0026), 0.0009), "#9a5a1c", { mark: true });
  K.add(ribbon((u) => { const a = u * 2 * Math.PI; return ellPt(AX, dirAE(a, -20 * DEG)); }, 40, () => 0.006, 0.0006, true), "#e9cf9a", { mark: true, rough: 0.95 });
  for (let i = 0; i < 22; i++) {
    const dx = (r() - 0.5) * 2 * 0.9, dz = (r() - 0.5) * 2 * 0.9 * (0.25 + 0.75 * Math.pow(r(), 0.7)) * (r() < 0.5 ? 1 : 1);
    const u = new V3(dx, 0, dz * 0.95); if (u.x * u.x + u.z * u.z > 0.85) { i--; continue; } u.y = Math.sqrt(1 - u.x * u.x - u.z * u.z);
    if (Math.abs(dz) < 0.12 && Math.abs(dx) < 0.7) { u.z += 0.22 * Math.sign(dz || 1); u.y = Math.sqrt(Math.max(0.05, 1 - u.x * u.x - u.z * u.z)); }
    onEll(K, "#2a1c14", AX, u, r() * 3, 0.008, 0.005, null, { rough: 0.6 });
  }
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- banana
const BANR = 0.13, BANS = 84 * DEG;
const banR = (u) => (u < 0.3 ? lerp(0.010, 0.019, smooth(0, 0.3, u)) : u < 0.75 ? 0.019 : lerp(0.019, 0.011, smooth(0.75, 1, u)));
function banana(seed = 1, S = {}) {
  const K = kit(), r = rng(1600 + seed * 3), g = new THREE.Group(), n = Math.max(1, Math.min(3, Math.round(S.n ?? 1)));
  const cen = (u) => { const a = (u - 0.5) * BANS; return new V3(BANR * Math.sin(a), banR(u), BANR * Math.cos(a) - BANR); };
  const tan = (u) => { const a = (u - 0.5) * BANS; return new V3(Math.cos(a), 0, -Math.sin(a)); };
  const side = (u) => new V3(0, 1, 0).cross(tan(u)).normalize();
  const ringAt = (u, ph) => { const rad = banR(u) * (1 + 0.06 * Math.cos(5 * ph)), d = new V3(0, Math.cos(ph), 0).addScaledVector(side(u), Math.sin(ph)); return { p: cen(u).addScaledVector(d, rad), n: d }; };
  const tube = (u0, u1) => {
    const NU = Math.max(4, Math.round(36 * (u1 - u0))), NV = 14, pos = [], idx = [];
    for (let i = 0; i <= NU; i++) for (let j = 0; j < NV; j++) { const q = ringAt(lerp(u0, u1, i / NU), (j / NV) * 2 * Math.PI).p; pos.push(q.x, q.y, q.z); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * NV + j, b = i * NV + (j + 1) % NV, c = a + NV, d = b + NV; idx.push(a, c, b, b, c, d); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals(); return gg;
  };
  const fr = Array.from({ length: 5 }, () => [0.2 + r() * 0.6, r() * 6.28, 0.004 + r() * 0.005]);
  const one = (M) => {
    K.add(tube(0, 0.16), "#a8c24a", { rough: 0.3 }, M); K.add(tube(0.16, 1), "#f6dd52", { rough: 0.3 }, M);
    const t0 = cen(0), t1 = cen(1), tg1 = tan(1), tg0 = tan(0);
    K.add(new THREE.CylinderGeometry(0.0065, 0.0085, 0.02, 8), "#6e5a2c", { rough: 0.8 }, new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), tg0.clone().negate())).setPosition(t0.clone().addScaledVector(tg0, -0.01)).premultiply(M));
    K.add(sphereG(0.008, 8, 6), "#3f2e1c", { rough: 0.6 }, M4(t1.clone().addScaledVector(tg1, 0.004).toArray()).premultiply(M));
    for (const ph0 of [0.3, 0.7]) K.add(ribbon((u) => ringAt(lerp(0.12, 0.9, u), ph0 * 2 * Math.PI + 0.0), 20, taper(0.0012), 0.0005), "#b48a2e", { mark: true, rough: 0.4 }, M);
    for (const [u, ph, len] of fr) { const q = ringAt(u, ph), F = frameAt(q.p, q.n, r() * 6, 0.0005); F.premultiply(M); K.add(flat(len, 0.004, 0.0004), "#8a6424", { mark: true }, F); }
  };
  const stem = cen(0).clone().setY(0);
  for (let k = 0; k < n; k++) {
    const a = (k - (n - 1) / 2) * 16 * DEG, lift = n === 3 && k === 1 ? 0.024 : n === 2 && k === 1 ? 0.014 : 0, pre = M4([0, 0, 0]);
    const M = new THREE.Matrix4().makeTranslation(stem.x, lift, stem.z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeTranslation(-stem.x, 0, -stem.z)).multiply(pre);
    one(M);
  }
  if (n > 1) K.add(ellG([0.014, 0.014, 0.014 + 0.004 * n], 10, 8), "#6e5a2c", { rough: 0.8 }, M4([stem.x, 0.014 + (n === 3 ? 0.01 : 0.004), stem.z]));
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- juice jug
const JUG = [[0.036, 0], [0.045, 0.035], [0.045, 0.10], [0.031, 0.13], [0.031, 0.142], [0.035, 0.15]];
const jugR = (y) => { for (let i = 0; i < JUG.length - 1; i++) { const [r0, y0] = JUG[i], [r1, y1] = JUG[i + 1]; if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0)); } return JUG[JUG.length - 1][0]; };
function juicejug(seed = 1) {
  const K = kit(), r = rng(1700 + seed * 7), g = new THREE.Group(), YJ = 0.128;
  const sm = new THREE.CatmullRomCurve3([new V3(0.001, 0.0, 0), ...JUG.map(([x, y]) => new V3(x, y, 0))], false, "centripetal").getPoints(40).map((p) => new THREE.Vector2(p.x, p.y));
  K.add(new THREE.LatheGeometry(sm, 32), "#eef9ff", { glass: 0.3 });
  // the juice: opaque, 0.004 inside the glass, up to y 0.128 (into the neck, so it looks right lying on its side)
  const jp = [new THREE.Vector2(0.001, 0.004)]; for (let y = 0.004; y <= YJ + 1e-6; y += 0.004) jp.push(new THREE.Vector2(Math.max(0.01, jugR(Math.min(y, YJ)) - 0.004), y)); jp.push(new THREE.Vector2(0.001, YJ));
  K.add(new THREE.LatheGeometry(jp, 28), "#ff9a1c", { rough: 0.3 });
  const rj = jugR(YJ) - 0.004, foam = new THREE.CylinderGeometry(rj, rj, 0.006, 24); K.add(foam, "#ffc45a", { rough: 0.5 }, M4([0, YJ + 0.002, 0]));
  for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * (jugR(0.09) - 0.008), y = 0.012 + r() * 0.09, q = flat(0.008 + r() * 0.005, 0.004, 0.0004); K.add(q, "#ffb648", { mark: true }, frameAt(new V3(Math.sin(a) * (jugR(y) - 0.0042), y, Math.cos(a) * (jugR(y) - 0.0042)), new V3(Math.sin(a), 0, Math.cos(a)), r() * 3, 0)); void d; }
  K.add(ribbon((u) => { const a = u * 2 * Math.PI, y = YJ - 0.003 + 0.0015 * Math.sin(a * 3 + 1), rr = jugR(YJ) - 0.0039; return { p: new V3(Math.sin(a) * rr, y, Math.cos(a) * rr), n: new V3(Math.sin(a), 0, Math.cos(a)) }; }, 40, () => 0.0013, 0.0, true), "#e07c10", { mark: true });
  // steel lid and knob, glass handle on +x (thick enough for the physics to see), two glints
  K.add(new THREE.CylinderGeometry(0.036, 0.0365, 0.014, 24), "#c5c9cc", { rough: 0.3, metal: 0.5 }, M4([0, 0.157, 0]));
  K.add(sphereG(0.01, 10, 8), "#c5c9cc", { rough: 0.3, metal: 0.5 }, M4([0, 0.1605, 0]));
  const hd = new THREE.TorusGeometry(0.033, 0.0065, 8, 24, 190 * DEG); hd.rotateZ(-95 * DEG); K.add(hd, "#e4f2ee", { glass: 0.66 }, M4([0.042, 0.0785, 0]));
  const az = -40 * DEG, gl = (y0, y1, hw) => ribbon((u) => { const y = lerp(y0, y1, u), rr = jugR(y) + 0.0006; return { p: new V3(Math.sin(az) * rr, y, Math.cos(az) * rr), n: new V3(Math.sin(az), 0, Math.cos(az)) }; }, 12, taper(hw), 0.0004);
  K.add(gl(0.03, 0.1, 0.003), "#ffffff", { mark: true, rough: 0.2 }); K.add(gl(0.11, 0.125, 0.0025), "#ffffff", { mark: true, rough: 0.2 });
  return K.flush(g);
}

// ---------------------------------------------------------------------------------------------------- waffle
function waffle(seed = 1) {
  const K = kit(), r = rng(1800 + seed * 5), g = new THREE.Group(), W = 0.115, HH = 0.024, CR = 0.014, B = 0.008, RIM = 0.009, BAR = 0.007;
  const rr = (w, c) => { const s = new THREE.Shape(), x = w / 2; s.moveTo(-x + c, -x); s.lineTo(x - c, -x); s.quadraticCurveTo(x, -x, x, -x + c); s.lineTo(x, x - c); s.quadraticCurveTo(x, x, x - c, x); s.lineTo(-x + c, x); s.quadraticCurveTo(-x, x, -x, x - c); s.lineTo(-x, -x + c); s.quadraticCurveTo(-x, -x, -x + c, -x); return s; };
  const ext = (shape, depth, y) => { const e = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 5 }); e.rotateX(Math.PI / 2); e.translate(0, y + depth, 0); return e; };   // top at y + depth
  const edge = rr(W, CR); edge.holes.push(rr(W - 0.004, CR - 0.002));
  K.add(ext(edge, HH * 0.985, 0), "#b06c1f", { rough: 0.7 });
  K.add(ext(rr(W - 0.003, CR), B, (HH - B) / 2), "#c98a30", { rough: 0.7 });
  const rimS = rr(W - 0.0032, CR - 0.0016); rimS.holes.push(rr(W - 2 * RIM, CR - RIM * 0.6));
  for (const y0 of [0, HH - B]) K.add(ext(rimS, B, y0), "#e6ab45", { rough: 0.7 });
  const inner = W - 2 * RIM, pitch = (inner - 3 * BAR) / 4 + BAR;
  for (const y0 of [0, HH - B]) for (let k = 0; k < 3; k++) { const c = -inner / 2 + (inner - 3 * BAR) / 4 + BAR / 2 + k * pitch; K.add(new THREE.BoxGeometry(BAR, B, inner), "#e6ab45", { rough: 0.7 }, M4([c, y0 + B / 2, 0])); K.add(new THREE.BoxGeometry(inner, B, BAR), "#e6ab45", { rough: 0.7 }, M4([0, y0 + B / 2, c])); }
  const onRib = (x, z) => { const ax = Math.abs(Math.abs(x) - inner / 2) < 0.0001; void ax; if (Math.abs(x) > inner / 2 || Math.abs(z) > inner / 2) return true; for (let k = 0; k < 3; k++) { const c = -inner / 2 + (inner - 3 * BAR) / 4 + BAR / 2 + k * pitch; if (Math.abs(x - c) < BAR / 2 || Math.abs(z - c) < BAR / 2) return true; } return false; };
  for (let i = 0; i < 26; i++) { const x = 0.052 - 0.05 * r() * r(), z = -0.052 + 0.05 * r() * r(), q = disc(0.003 + r() * 0.003, 0.003 + r() * 0.003, 8); q.rotateX(-Math.PI / 2); K.add(q, "#fffaf0", { mark: true, rough: 0.9 }, M4([x, (onRib(x, z) ? HH : HH - B) + 0.0008, z])); }
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- blueberry muffin
function muffin(seed = 1) {
  const K = kit(), r = rng(1900 + seed * 3), g = new THREE.Group();
  // the paper case: 16 flutes, a lathe-like grid
  const NU = 48, NV = 6, pos = [], idx = [], caseR = (y, a) => (0.027 + 0.010 * (y / 0.042)) + 0.002 * Math.cos(a * 16);
  for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) { const a = (i / NU) * 2 * Math.PI, y = (j / NV) * 0.044, rr = caseR(y, a); pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr); }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * NU + i, b = j * NU + (i + 1) % NU, c = a + NU, d = b + NU; idx.push(a, c, b, b, c, d); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals(); K.add(cg, "#f7f2e4", { rough: 0.85 });
  for (let k = 0; k < 16; k++) { const a = ((k + 0.5) / 16) * 2 * Math.PI, y0 = 0.002 + r() * 0.006, y1 = 0.026 + r() * 0.016, n = new V3(Math.sin(a), 0, Math.cos(a)); K.add(ribbon((u) => { const y = lerp(y0, y1, u); return { p: new V3(Math.sin(a) * (caseR(y, a) + 0.0008), y, Math.cos(a) * (caseR(y, a) + 0.0008)), n }; }, 6, () => 0.0009, 0.0003), "#c9bda2", { mark: true }); }
  // the dome: r 0.043 squashed 0.8, from y 0.036 to 0.08, cracked patch, six blueberries
  const AX = [0.043, 0.0344, 0.043], cy = 0.08 - AX[1], cut = -(cy - 0.036) / AX[1], th = Math.acos(clamp(cut, -1, 1));
  const dome = new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, th); dome.scale(AX[0], AX[1], AX[2]); K.add(dome, "#c6853c", { rough: 0.8 }, M4([0, cy, 0]));
  const D = M4([0, cy, 0]);
  onEll(K, "#ecc481", AX, new V3(0.18, 1, -0.1), 0.5, 0.03, 0.022, D, { rough: 0.85 });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * 6.283 + r() * 0.6, rho = 0.25 + r() * 0.5, u = new V3(Math.sin(a) * rho, Math.sqrt(1 - rho * rho), Math.cos(a) * rho), { p, n } = ellPt(AX, u);
    K.add(sphereG(0.009, 10, 8), "#3d3a7a", { rough: 0.4 }, M4(p.clone().add(new V3(0, cy, 0)).addScaledVector(n, -0.003).toArray()));
    if (k < 2) { const q = new THREE.RingGeometry(0.0085, 0.013, 14); K.add(q, "#6a4a8c", { mark: true }, frameAt(p, n, 0, 0.0006).premultiply(D)); }
  }
  return K.flush(g);
}

// ---------------------------------------------------------------------------------------------------- the three heap-only items (redrawn from props3d.js)
function applePiece() {
  const K = kit(), g = new THREE.Group();
  K.add(ellG([0.07, 0.0644, 0.07], 18, 14), "#e2322b", { rough: 0.35 }, M4([0, 0.0644, 0]));
  K.add(new THREE.CylinderGeometry(0.006, 0.008, 0.05, 6), "#5a3b1f", { rough: 0.7 }, M4([0, 0.0644 + 0.0644 + 0.004 - 0.01, 0]));
  K.add(ellG([0.03, 0.0075, 0.015], 8, 6), "#5cbf55", { rough: 0.6 }, M4([0.025, 0.0644 + 0.0644 + 0.02, 0]));
  return K.flush(g);
}
function eggPiece() { const K = kit(), g = new THREE.Group(); K.add(ellG([0.05, 0.065, 0.05], 16, 12), "#f6ead6", { rough: 0.45 }, M4([0, 0.065, 0])); return K.flush(g); }
function platePiece() {
  const K = kit(), g = new THREE.Group(), prof = [[0.001, 0], [0.062, 0], [0.068, 0.008], [0.1, 0.02], [0.094, 0.022], [0.07, 0.012], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  K.add(new THREE.LatheGeometry(prof, 36), "#f7f5ef", { rough: 0.35 });
  const band = new THREE.TorusGeometry(0.0975, 0.0032, 6, 40); band.rotateX(Math.PI / 2); K.add(band, "#3d8fb0", { mark: true, rough: 0.4 }, M4([0, 0.0212, 0]));
  return K.flush(g);
}

// ---------------------------------------------------------------------------------------------------- the registry of builders and real sizes
const BUILD = { croissant, sausage, pancakestack: pancakeStack, melon, breadroll, banana, juicejug, waffle, muffin };
const BODY = { croissant: { bounce: 0.08 }, sausage: { bounce: 0.1 }, pancakestack: { bounce: 0.05, friction: 0.9 }, melon: { bounce: 0.12, friction: 0.7 }, breadroll: { bounce: 0.1 }, banana: { bounce: 0.08 }, juicejug: { density: 500, bounce: 0.05, friction: 0.8 }, waffle: { bounce: 0.08, shape: "box" }, muffin: { bounce: 0.08 } };
// real sizes (x, y, z) as built (measured from the meshes); the body defaults are the design's
export const BUFFET = {
  croissant: { w: 0.154, h: 0.056, d: 0.095 }, sausage: { w: 0.115, h: 0.038, d: 0.035 }, pancakestack: { w: 0.171, h: 0.083, d: 0.164 }, melon: { w: 0.212, h: 0.192, d: 0.2 },
  breadroll: { w: 0.095, h: 0.056, d: 0.076 }, banana: { w: 0.204, h: 0.04, d: 0.071 }, juicejug: { w: 0.129, h: 0.173, d: 0.095 }, waffle: { w: 0.115, h: 0.025, d: 0.115 }, muffin: { w: 0.086, h: 0.085, d: 0.086 },
};
for (const k of Object.keys(BODY)) BUFFET[k].body = BODY[k];

const loose = (kind) => (P) => {
  const S = P.spec, g = BUILD[kind](S.seed ?? 1, S);
  P.whole.add(g);
  return { grip: BUFFET[kind].h / 2, apply(ps) { g.visible = (ps.in ?? S.in ?? 1) > 0.01; } };
};

// ---------------------------------------------------------------------------------------------------- buffetheap
// the shape at fill 1: peak 0.06 off centre toward -x, a lower shoulder, a long toe toward +z, height h x (1 - rho^1.7)
function heapShape(k, hk) {
  const Rd = (az) => { const q = Math.cos(az); return 0.45 * k * (q > 0 ? 0.889 + 0.111 * q : 0.889 + 0.178 * q); };
  const H = (x, z) => {
    const rr = Math.hypot(x, z), rho0 = rr / Rd(Math.atan2(x, z)); if (rho0 >= 1) return 0;
    const qx = x + 0.06 * k * (1 - rho0 * rho0), rho = Math.min(1, Math.hypot(qx, z) / Rd(Math.atan2(qx, z)));
    const a = 0.45 * hk * (1 - Math.pow(rho, 1.7)), rb = Math.min(1, Math.hypot(x - 0.18 * k, z + 0.05 * k) / (0.28 * k)), b = 0.30 * hk * (1 - Math.pow(rb, 1.7));
    return Math.pow(a ** 4 + b ** 4, 0.25) * smooth(1, 0.93, rho0);
  };
  return { Rd, H };
}
const COREK = 0.82, COREF = 0.92;
const ITEM_H = { croissant: 0.055, breadroll: 0.055, sausage: 0.034, waffle: 0.024, muffin: 0.08, apple: 0.13, banana: 0.04, pancakestack: 0.08, egg: 0.13, juicejug: 0.09, plate: 0.02 };
const BROWN = new Set(["croissant", "breadroll", "sausage", "waffle", "muffin", "pancakestack"]);

function heap(P) {
  const S = P.spec, R0 = S.r ?? 0.45, H0 = S.h ?? 0.45, k = R0 / 0.45, hk = H0 / 0.45, seed = S.seed ?? 7, r = rng(seed * 977 + 13), { Rd, H } = heapShape(k, hk);
  const core = (x, z) => COREK * H(x / COREF, z / COREF) * (1 + 0.04 * Math.sin(x * 37 + seed) * Math.cos(z * 29 - seed * 0.7));
  // --- the core: a lumpy dome, a heightfield on polar rings, painted with ten overlapping bread ovals
  const NA = 56, NR = 16, cpos = [], cidx = [], cg = new THREE.Group(), K = kit();
  for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) { const a = (i / NA) * 2 * Math.PI, rho = j / NR, rr = rho * COREF * Rd(a), x = Math.sin(a) * rr, z = Math.cos(a) * rr; cpos.push(x, core(x, z), z); }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA, c = a + NA, d = b + NA; idx(cidx, a, b, c, d); }
  function idx(L, a, b, c, d) { L.push(a, c, b, b, c, d); }
  const coreGeo = new THREE.BufferGeometry(); coreGeo.setAttribute("position", new THREE.Float32BufferAttribute(cpos, 3)); coreGeo.setIndex(cidx); coreGeo.computeVertexNormals();
  const coreMat = mat("#8c5a26", { roughness: 0.85, side: THREE.DoubleSide }); coreMat.userData.noHatch = true;
  const coreMesh = new THREE.Mesh(coreGeo, coreMat); coreMesh.castShadow = coreMesh.receiveShadow = true; cg.add(coreMesh);
  for (let i = 0; i < 10; i++) {
    const a = r() * 6.283, rho = 0.1 + r() * 0.65, cx = Math.sin(a) * rho * R0 * 0.8, cz = Math.cos(a) * rho * R0 * 0.8, rx = (0.04 + r() * 0.05) * k, rz = (0.03 + r() * 0.04) * k, rot = r() * 3, col = i % 2 ? "#a06a2c" : "#7a4c1f", lift = 0.0015 + i * 0.0003;
    const pp = [], pi = [], RN = 3, SG = 14; pp.push(...ptOn(cx, cz, 0, 0, lift));
    function ptOn(x0, z0, u, v, lf) { const x = x0 + Math.cos(rot) * u - Math.sin(rot) * v, z = z0 + Math.sin(rot) * u + Math.cos(rot) * v; return [x, core(x, z) + lf, z]; }
    for (let q = 1; q <= RN; q++) for (let s = 0; s < SG; s++) { const t = (s / SG) * 2 * Math.PI, e = q / RN; pp.push(...ptOn(cx, cz, Math.cos(t) * rx * e, Math.sin(t) * rz * e, lift)); }
    for (let s = 0; s < SG; s++) pi.push(0, 1 + s, 1 + (s + 1) % SG);
    for (let q = 1; q < RN; q++) for (let s = 0; s < SG; s++) { const a0 = 1 + (q - 1) * SG + s, b0 = 1 + (q - 1) * SG + (s + 1) % SG, c0 = a0 + SG, d0 = b0 + SG; pi.push(a0, c0, b0, b0, c0, d0); }
    const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); og.setIndex(pi); og.computeVertexNormals(); K.add(og, col, { mark: true, rough: 0.9 });
  }
  K.flush(cg); P.whole.add(cg);
  // the invisible full-size copy of the core: solid for the physics bake whatever `fill` is then
  const proxy = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); proxy.material.userData.noOutline = true; proxy.castShadow = proxy.receiveShadow = false; proxy.renderOrder = -1; P.whole.add(proxy);

  // --- the 52 items: slots by band (crown / slope / foot), kinds assigned with a seeded swap search
  const GA = 2.399963, slots = [], F = (x, z) => [x * k, z * k];
  const spiral = (n, rho0, rho1, a0) => Array.from({ length: n }, (_, i) => { const rho = Math.sqrt(rho0 * rho0 + (rho1 * rho1 - rho0 * rho0) * ((i + 0.5) / n)), a = a0 + i * GA, rr = rho * Rd(a); return [Math.sin(a) * rr, Math.cos(a) * rr, a]; });
  const crownK = [["pancakestack", ...F(-0.06, 0.02)], ["apple", ...F(0.09, 0.09)], ["plate", ...F(-0.1, -0.16)], ["croissant", ...F(-0.18, 0.07)], ["banana", ...F(0.04, -0.09)], ["muffin", ...F(0.15, 0.0)], ["breadroll", ...F(-0.02, 0.17)]];
  for (const [kind, x, z] of crownK) slots.push({ band: "crown", kind, x, z });
  const slopeKinds = [...Array(6).fill("croissant"), ...Array(7).fill("breadroll"), ...Array(2).fill("sausage"), ...Array(4).fill("waffle"), ...Array(4).fill("muffin"), ...Array(2).fill("apple"), ...Array(2).fill("banana"), ...Array(2).fill("pancakestack"), ...Array(2).fill("egg")];
  const slopeAt = spiral(31, 0.30, 0.88, 0.3);
  slopeAt.forEach(([x, z]) => slots.push({ band: "slope", kind: null, x, z }));
  const strayKinds = ["apple", "apple", "sausage", "croissant"], strayAz = [-38, -10, 20, 46].map((d) => d * DEG);
  strayAz.forEach((a, i) => { const d = Rd(a) + (0.05 + 0.07 * ((i * 5) % 4) / 3) * k; slots.push({ band: "stray", kind: strayKinds[i], x: Math.sin(a) * d, z: Math.cos(a) * d }); });
  const footKinds = ["juicejug", "juicejug", "sausage", "sausage", "sausage", "sausage", "croissant", "waffle", "egg", "banana"];
  const footAt = spiral(10, 0.94, 1.0, 1.1); footAt[0][2] = -35 * DEG; footAt[0][0] = Math.sin(-35 * DEG) * 0.99 * Rd(-35 * DEG); footAt[0][1] = Math.cos(-35 * DEG) * 0.99 * Rd(-35 * DEG);
  footAt.forEach(([x, z, a], i) => slots.push({ band: "foot", kind: footKinds[i], x, z, a }));
  // jug 0 sits front-left (lid toward the camera); the slope kinds are shuffled, then swapped to spread the non-brown things
  const sl = slots.filter((s) => s.band === "slope"), pool = [...slopeKinds];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  sl.forEach((s, i) => { s.kind = pool[i]; });
  const cost = () => { let c = 0; for (const s of slots) { let same = 0, nonBrown = false; for (const o of slots) { if (o === s) continue; const d = Math.hypot(o.x - s.x, o.z - s.z); if (d < 0.17 * k) { if (!BROWN.has(o.kind)) nonBrown = true; } if (d < 0.12 * k && o.kind === s.kind) same++; } if (BROWN.has(s.kind) && !nonBrown) c += 3; if (same > 2) c += 4; c += same; } return c; };
  let best = cost();
  for (let it = 0; it < 500 && best > 0; it++) { const a = sl[Math.floor(r() * sl.length)], b = sl[Math.floor(r() * sl.length)]; if (a === b || a.kind === b.kind) continue; [a.kind, b.kind] = [b.kind, a.kind]; const c = cost(); if (c <= best) best = c; else [a.kind, b.kind] = [b.kind, a.kind]; }
  // --- build the item meshes once per kind and variant, clone for each slot
  const cache = new Map(), tpl = (kind, v) => { const key = kind + v; if (!cache.has(key)) cache.set(key, kind === "apple" ? applePiece() : kind === "egg" ? eggPiece() : kind === "plate" ? platePiece() : BUILD[kind](v + 1, { n: kind === "banana" && v === 2 ? 3 : 1 })); return cache.get(key); };
  const order = Array.from({ length: slots.length }, (_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const N = slots.length, items = [], up = new V3(0, 1, 0), gradAt = (x, z) => { const e = 0.01; return new V3(-(core(x + e, z) - core(x - e, z)) / (2 * e), 1, -(core(x, z + e) - core(x, z - e)) / (2 * e)).normalize(); };
  slots.forEach((s, i) => {
    const v = i % 2, node = tpl(s.kind, i === slots.findIndex((o) => o.kind === "banana") ? 2 : v).clone(), wrap = new THREE.Group(); wrap.add(node);
    const onFloor = s.band === "foot" || s.band === "stray", cy = onFloor ? 0 : core(s.x, s.z), n = onFloor ? up.clone() : gradAt(s.x, s.z);
    const q = new THREE.Quaternion().setFromUnitVectors(up, n), yaw = new THREE.Quaternion().setFromAxisAngle(n, r() * 6.283);
    q.premultiply(yaw);
    const tilt = (s.band === "slope" ? 0.17 : 0.06) * (r() - 0.5) * 2; q.premultiply(new THREE.Quaternion().setFromAxisAngle(new V3(Math.cos(r() * 6.283), 0, Math.sin(r() * 6.283)), tilt));
    let extraY = 0;
    if (s.kind === "pancakestack" && s.band === "crown") { q.premultiply(new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), 25 * DEG)); }
    if (s.kind === "plate") { q.copy(new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), 50 * DEG)); q.premultiply(new THREE.Quaternion().setFromAxisAngle(up, 0.15)); extraY = 0.05; }
    if (s.kind === "juicejug") { const lid = i === slots.findIndex((o) => o.kind === "juicejug"); q.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, lid ? 0 : 2.3, 0, "YXZ"))); extraY = 0.045; }
    const sink = s.band === "foot" || s.band === "stray" ? 0 : 0.15 * (ITEM_H[s.kind] ?? 0.05);
    const home = new V3(s.x, cy + extraY, s.z).addScaledVector(n, -sink);
    const ax = new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    items.push({ wrap, home, q, ax, w0: (0.9 * order[i]) / N, floor: onFloor });
    P.whole.add(wrap);
  });
  let melonG = null; if (S.melon) { melonG = melon(1); melonG.position.set(-0.06 * k, core(-0.06 * k, 0.0) + 0.09, 0); P.whole.add(melonG); }
  const qT = new THREE.Quaternion();
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fill ?? S.fill ?? 1), jolt = clamp(ps.jolt ?? S.jolt ?? 0), s = Math.sqrt(f);
      cg.visible = f >= 0.08; cg.scale.setScalar(Math.max(0.01, s));
      for (const it of items) {
        const t = (f - it.w0) / 0.1;
        if (t < 0 || f < 0.02) { it.wrap.visible = false; continue; }
        it.wrap.visible = true;
        const u = Math.min(1, t / 0.75), hop = t > 0.75 ? 0.012 * Math.sin(Math.PI * Math.min(1, (t - 0.75) / 0.25)) : 0, fall = u < 1 ? 0.14 * (1 - u * u) : 0;
        qT.setFromAxisAngle(it.ax, 70 * DEG * (1 - u)); it.wrap.quaternion.copy(it.q).premultiply(qT);
        it.wrap.position.copy(it.home).multiplyScalar(s); it.wrap.position.y += fall + hop + (it.floor ? 0 : 0) + 0.02 * (it.home.y / (0.45 * hk)) * Math.sin(Math.PI * jolt);
        if (it.floor) it.wrap.position.y = it.home.y + fall + hop;
      }
      if (melonG) melonG.visible = f > 0.96;
    },
  };
}

// ---------------------------------------------------------------------------------------------------- hoodiestuff
const CHIP = { rx: 0.285, ry: 0.265, rz: 0.26, cy: 0.405, taper: 0.02 };
const AZ0 = -105, AZ1 = 105, EL0 = -72, EL1 = -22;
const shadeHex = (hex, kk) => `#${new THREE.Color(hex).multiplyScalar(kk).getHexString()}`;
const lerpTab = (tab, x) => { for (let i = 0; i < tab.length - 1; i++) if (x <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (x - tab[i][0]) / (tab[i + 1][0] - tab[i][0])); return tab[tab.length - 1][1]; };
// the lumps: centre (az, el degrees), shape, height at fill 1, and the fill range over which it flattens
const LUMPS = [
  { id: "melon", az: -22, el: -40, shape: "cap", r: 0.095, h: 0.075 },
  { id: "jug", az: 34, el: -38, shape: "sq", r: 0.05, h: 0.045, rot: 20, fl: [0.40, 0.55] },
  { id: "waffle", az: 14, el: -36, shape: "ridge", len: 0.09, w: 0.024, rot: 30, h: 0.022, fl: [0.65, 0.80] },
  { id: "banana", az: 30, el: -56, shape: "curve", len: 0.16, w: 0.04, bow: 0.02, h: 0.028, fl: [0.55, 0.70] },
  { id: "roll1", az: -55, el: -44, shape: "dome", r: 0.04, h: 0.032, fl: [0.80, 0.90] },
  { id: "roll2", az: 58, el: -50, shape: "dome", r: 0.035, h: 0.028, fl: [0.88, 0.98] },
];
function hoodiestuff(P) {
  const S = P.spec, F = { ...CHIP, ...(S.fit || {}) }, col = S.color || "#ffcf2e", group = new THREE.Group(); P.whole.add(group);
  const skin = (azd, eld, out = 0) => { const d = dirAE(azd * DEG, eld * DEG), tp = 1 - F.taper * d.y, n = new V3(d.x / F.rx, d.y / F.ry, d.z / F.rz).normalize(); return { p: new V3(d.x * F.rx * tp, F.cy + d.y * F.ry, d.z * F.rz * tp).addScaledVector(n, out), n }; };
  const metres = (azd, eld) => [azd * DEG * F.rx * Math.cos(eld * DEG), eld * DEG * F.ry];   // az, el (degrees) -> surface metres (x right, y up)
  const cloth = clothMat(col, { side: THREE.DoubleSide, vertexColors: true }); cloth.map = fleeceTexture(512, 256, 57.3, 70, false, true);
  const NA = 150, NE = 62, geo = new THREE.BufferGeometry(), pos = new Float32Array((NA + 1) * (NE + 1) * 3), uv = new Float32Array((NA + 1) * (NE + 1) * 2), colr = new Float32Array((NA + 1) * (NE + 1) * 3), idx = [];
  for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const q = j * (NA + 1) + i; uv[q * 2] = i / NA; uv[q * 2 + 1] = j / NE; }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("color", new THREE.BufferAttribute(colr, 3)); geo.setIndex(idx);
  const patch = new THREE.Mesh(geo, cloth); patch.castShadow = patch.receiveShadow = true; patch.frustumCulled = false; group.add(patch);
  const marks = new THREE.Group(); group.add(marks);
  const stitchM = clothMat(shadeHex(col, 0.62));
  // the lumps' current state at a fill: centre (it slides for the melon), strength 0..1
  const state = (fill) => LUMPS.map((L) => {
    let kk, el = L.el;
    if (L.id === "melon") { kk = smooth(0.03, 0.12, fill); el = lerp(-60, -40, smooth(0.12, 0.35, fill)); } else kk = smooth(L.fl[0], L.fl[1], fill);
    return { ...L, el, k: kk };
  });
  const lumpField = (L, azd, eld) => {
    const [mx, my] = metres(azd - L.az, eld - L.el), h = L.h * L.k; if (h <= 1e-5) return 0;
    if (L.shape === "cap") { const d = Math.hypot(mx, my), Rs = (L.r * L.r + L.h * L.h) / (2 * L.h); return d >= L.r ? 0 : Math.max(0, Math.sqrt(Rs * Rs - d * d) - (Rs - L.h)) * L.k; }
    if (L.shape === "dome") { const q = Math.hypot(mx, my) / L.r; return q >= 1 ? 0 : h * Math.pow(1 - q * q, 0.7); }
    const c = Math.cos(L.rot * DEG), sn = Math.sin(L.rot * DEG), u = mx * c + my * sn, w = -mx * sn + my * c;
    if (L.shape === "sq") { const q = Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(w), 4), 0.25) / L.r; return h * smooth(1, 0.62, q); }
    if (L.shape === "ridge") { const e = smooth(L.len / 2 + 0.003, L.len / 2 - 0.003, Math.abs(u)), q = Math.abs(w) / (L.w / 2); return q >= 1 ? 0 : h * Math.pow(1 - q, 0.8) * e; }
    // curve: the distance to a bowed polyline (len - w long, bowed down in the middle), round ends
    let dm = 1e9; for (let t = 0; t <= 20; t++) { const f = t / 20, px = (f - 0.5) * (L.len - L.w), py = -L.bow * 4 * f * (1 - f) + L.bow / 2; dm = Math.min(dm, Math.hypot(mx - px, my - py)); }
    const q = dm / (L.w / 2); return q >= 1 ? 0 : h * (1 - q * q);
  };
  // the point on the patch at (az, el) degrees for the lumps `st` at `fill`: { p, n (surface), off (metres from the skin) }
  const point = (azd, eld, fill, st) => {
    const dAz = Math.min(azd - AZ0, AZ1 - azd), dEl = Math.min(eld - EL0, EL1 - eld), dd = Math.max(0, Math.min(dAz, dEl)), ramp = smooth(0, 10, dd);
    const base = lerp(0.015, 0.03 + 0.016 * Math.min(1, 5 * fill), ramp), sk = skin(azd, eld, 0);
    const Fz = lerpTab([[0, 1], [45, 0.75], [80, 0.3], [105, 0]], Math.abs(azd)), E = eld >= -45 ? clamp((EL1 - eld) / 23 * 1) : clamp((eld - EL0) / 27);
    let pn = 0; for (const L of st) pn += Math.pow(lumpField(L, azd, eld), 4);
    let extra = ramp * (0.11 * fill * Fz * E + Math.pow(pn, 0.25));
    const fw = new V3(Math.sin(azd * DEG) * Math.cos(10 * DEG), -Math.sin(10 * DEG), Math.cos(azd * DEG) * Math.cos(10 * DEG));
    // limits: his mouth stays clear (nothing above y 0.325), the drawstrings stay on top, 0.235 at most
    // (low on the ball the normal points at the floor and would fold the cloth under itself: there the base is pushed out level too)
    const bd = sk.n.clone().multiplyScalar(1 - smooth(-30, -55, eld)).addScaledVector(fw, smooth(-30, -55, eld)).normalize();
    const at = (e) => sk.p.clone().addScaledVector(bd, base).addScaledVector(fw, e);
    const lim = (cap) => { extra = Math.min(extra, cap); };
    lim(0.235 - base);
    if (Math.abs(azd) < 12 && eld > -30) lim(Math.max(0, 0.045 - base));
    let pt = at(extra); if (pt.y > 0.325 && extra > 0) { let lo = 0, hi = extra; for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (at(mid).y > 0.325) hi = mid; else lo = mid; } extra = lo; pt = at(extra); }
    return { p: pt, n: sk.n, off: base + extra };
  };
  // the patch's own surface normal at (az, el): lifting a mark along it keeps it on the flank of a steep lump
  const surf = (a, e, fill, st) => {
    const p0 = point(a, e, fill, st), da = point(a + 0.4, e, fill, st).p.sub(p0.p), de = point(a, e + 0.4, fill, st).p.sub(p0.p), n = da.cross(de).normalize();
    if (n.dot(p0.n) < 0) n.negate();
    return { p: p0.p, n };
  };
  // the marks that thin out with their lump: a crescent on the upper rim of each lump, three pull lines at the melon, the redrawn stitch
  const toAE = (L, mx, my) => [L.az + mx / (F.rx * Math.cos(L.el * DEG)) / DEG, L.el + my / F.ry / DEG];
  const ink = (azels, wf, st, fill, kk, lift = 0.0035) => {
    if (kk < 0.08) return;
    const pts = azels.map(([a, e]) => surf(a, Math.max(e, -57), fill, st));   // (never lower than the hem band, which would hide it)
    marks.add(inkMesh(ribbon((u) => pts[Math.round(u * (pts.length - 1))], pts.length - 1, (u) => wf(u) * kk, lift), col, 0.32));
  };
  let last = -1;
  const rebuild = (fill) => {
    const st = state(fill), p = geo.attributes.position, c = geo.attributes.color;
    for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const q = j * (NA + 1) + i, e = point(AZ0 + (AZ1 - AZ0) * (i / NA), EL0 + (EL1 - EL0) * (j / NE), fill, st); p.setXYZ(q, e.p.x, e.p.y, e.p.z); }
    geo.computeVertexNormals(); const nn = geo.attributes.normal;
    for (let q = 0; q < nn.count; q++) { const d = 1 - 0.14 * smooth(-0.1, -0.5, nn.getY(q)); c.setXYZ(q, d, d, d); }
    p.needsUpdate = true; c.needsUpdate = true; geo.computeBoundingSphere();
    for (const o of [...marks.children]) { marks.remove(o); o.geometry.dispose(); }
    for (const L of st) {
      if (L.k < 0.08) continue;
      const pts = []; const n = 36;
      for (let t = 0; t <= n; t++) {
        const f = t / n; let mx, my;
        if (L.shape === "ridge" || L.shape === "curve") { const along = (f - 0.5) * (L.len * 0.8), off = (L.w / 2) * 0.9; if (L.shape === "ridge") { const c2 = Math.cos(L.rot * DEG), s2 = Math.sin(L.rot * DEG); mx = along * c2 + off * -s2; my = along * s2 + off * c2; } else { mx = (f - 0.5) * (L.len - L.w); my = -L.bow * 4 * f * (1 - f) + L.bow / 2 + off; } }
        else { const th = (90 - 70 + 140 * f) * DEG, rr = (L.r ?? 0.05) * 0.96; mx = Math.cos(th) * rr; my = Math.sin(th) * rr; }
        pts.push(toAE(L, mx, my));
      }
      ink(pts, (u) => 0.0045 * Math.sin(Math.PI * u) + 0.0006, st, fill, L.k);
    }
    const ml = st[0];
    if (ml.k > 0.08) {
      const lines = [[10, 0.07], [-55, 0.06], [-165, 0.05]];
      for (const [angd, len] of lines) { const th = angd * DEG, pts = []; for (let t = 0; t <= 8; t++) { const d = ml.r + 0.008 + (t / 8) * len; pts.push(toAE(ml, Math.cos(th) * d, Math.sin(th) * d)); } ink(pts, (u) => 0.0022 * (1 - u * 0.85), st, fill, ml.k); }
    }
    const sp = []; for (let t = 0; t <= 44; t++) { const a = -30 + 60 * (t / 44), q = surf(a, -42, fill, st); sp.push(q.p.clone().addScaledVector(q.n, 0.004)); }
    marks.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 90, 0.0028, 5, false), stitchM));
    last = fill;
  };
  // the croissant tip under the hem at az +40
  const tipG = new THREE.Group(); group.add(tipG);
  { const hem = skin(40, -64, 0.034), out = new V3(Math.sin(40 * DEG), 0, Math.cos(40 * DEG)), dir = new V3(0, -Math.cos(30 * DEG), 0).addScaledVector(out, Math.sin(30 * DEG)).normalize(), K = kit();
    K.add(sphereG(0.021, 14, 10), "#b86a24", { rough: 0.7 }, M4(hem.p.clone().addScaledVector(dir, 0.008).toArray())); K.add(sphereG(0.013, 12, 8), "#b86a24", { rough: 0.7 }, M4(hem.p.clone().addScaledVector(dir, 0.034).toArray())); K.flush(tipG); }
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fill ?? S.fill ?? 1);
      group.visible = f > 0.02; if (f <= 0.02) return;
      if (f !== last) rebuild(f);
      tipG.visible = f > 0.82; tipG.position.y = -0.03 * (1 - smooth(0.82, 0.9, f));
    },
  };
}

export const BUFFET_KINDS = { croissant: loose("croissant"), sausage: loose("sausage"), pancakestack: loose("pancakestack"), melon: loose("melon"), breadroll: loose("breadroll"), banana: loose("banana"), juicejug: loose("juicejug"), waffle: loose("waffle"), muffin: loose("muffin"), buffetheap: heap, hoodiestuff };
