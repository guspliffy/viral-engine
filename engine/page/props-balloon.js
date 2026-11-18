import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, rng } from "./util.js";
import { mat } from "./props-trend.js";

// "Hot air balloon" (friends try to 11): the balloon rig, the sandbag and the dawn valley. Design:
// storyboards/series/friends-try-to/11-hot-air-balloon/DESIGN-balloon.md (target look panels-v1-codex.png), bench make-balloon-bench.mjs
// in the same folder. Own file (props3d.js merges BALLOON_KINDS and BALLOON_GRIPS on their own line). Metres, y up, +z toward
// the main cameras, -z the sunrise. No lettering. Every hand-drawn mark is placed once from a hash of an index or spec.seed (no
// Math.random, no clock; flames and drifts are pure functions of the time t that apply() gets). Toon look: flat colours with the
// standard ink outline; marks under 0.008 m, flames, glows, mist and sky are noOutline.
//
// balloon      the WHOLE rig. Origin = the grass under the basket centre; +z toward the main cameras, -z the sunrise; az = degrees from
//              +z toward +x, a point at az a and radius r is (r sin a, y, r cos a). Real sizes (BALLOON.balloon): rim top 0.80, load
//              ring 2.70, mouth hoop 2.92, widest 6.12 (envelope 4.80 wide), crown 8.12, basket 2.23 wide (rim outer), mouth 1.84.
//              Envelope: 18 gores red #c9432b / orange #ef8a2a / cream #f6e2b9 (the gore centred on az 0 is red), seams, cross
//              seams, wrinkles at the mouth, crown cap, a dark red inside lit by the burner; mouth hoop, skirt, load ring, 12 flying
//              wires, 4 uprights (az +-70 and +-110), burner (can, coil, lever, hoses), flame, glow. Basket: wicker wall (one woven
//              painting), leather roll rim 0.13 wide with 14 cushions, three floor levels, 3 toggles, 4 rope rings, lacing. Four
//              tethers: stakes at radius 1.75 az +-70 / +-110, hemp ropes from the rim rings to the stakes. The envelope casts no
//              shadow; the flame, glow and inside are see-through for the checks.
//              KEYS (spec or a "prop" action; all optional):
//                burn   0..1   the burner. ENGINE FACT: propState has its own `burn: 0` and never reads spec.burn, so burn arrives as 0
//                              when no action tweened it. Here exactly 0 means "never set": it reads spec.burn, else the idle 0.3. To
//                              set a flame from frame 0 use a dur-0 prop action (c.prop(0, id, { burn: 0.3 }, 0.01)); tween from the
//                              value you set (a tween starts from 0, not from 0.3). A pilot-only flame needs burn 0.001 (0 = default).
//                              0.001 pilot only, 0.3 idle (flame 0.75 m), 1 full blast (flame 1.8 m, glow disc r 1.4, coil top glows).
//                strain 0..1   (default 0) the envelope, skirt and hoop lift 0.08 x strain and stretch (y x 1.035, x z x 0.988), a slow
//                              tug of +-30 % of that at 0.8 Hz; the flying wires go straight; the wrinkles fade. Ring, uprights, basket stay.
//                sway   0..1   (default 0) the envelope turns +-3 deg x sway (7 s period), rocks +-2 deg x sway (4.3 s). The basket floor
//                              stays level and in place, so a rider needs nothing extra.
//                taut   0..1   (default 1) the tethers: 1 a straight humming line (9 Hz, 4 mm), below 1 it sags 0.14 x (1 - taut)^2 mid span.
//                free   0..1   (default 0) the release: the stakes rip out of the turf one after another (front-left f 0.05, back-right
//                              0.20, front-right 0.35, back-left 0.50), clods burst, and each swings from its hole to hang under its ring.
//                              Tween it 0 -> 1 linearly (1.6 s in the design). A hole and two clods stay in the grass.
//              THE RIG RISES WITH THE PROP'S OWN x, y, z (so a character can { do: "ride", prop } it): there is NO `rise` key. Tween the
//              prop's own y (and x, z for a drift): c.prop(t, "rig", { y: 3 }, 2.0, "in"). Everything that belongs to the ground stays
//              where spec put it: the stakes still in the ground, the pressed-grass ring, the holes and the clods are counter-moved by
//              (spec.x - ps.x, spec.y - ps.y, spec.z - ps.z) (turned by -rot); a rope between a rim ring that rises and a stake that
//              does not just stretches between the two. A clip that rides the rig: the cast `ride` it with off = [x, stand y, z] in the
//              rig frame (the places below), or tween their own y by the same amount.
//              PLACES (rig frame x, z, stand y; all face +z): Spud (-0.535, 0.10, 0.50) / Wedge (0.475, 0.10, 0.50) / Chip (-0.05, 0.68,
//              0.67, on the front step) / Mash (0.0, -0.40, 0.85, on the back box). Add the rig's own x, y, z for world places. Exits over
//              the front-right rim at az +40 and the front-left rim at az -45.
//              GRIPS: none. The rim top (y 0.80, radius 1.05) is a seat and a grip: BALLOON.balloon.rim, rimR.
// sandbag      a loose rigid body, origin bottom centre: 0.24 wide x 0.25 high x 0.18 deep (neck to 0.29, rope loop to 0.36), flat underneath.
//              spec.seed varies the cross-hatch. Body: { bounce 0.02, friction 0.95, density 1600 } ready-made in BALLOON.sandbag.body: spec
//              { id, kind: "sandbag", x, y, z, body: BALLOON.sandbag.body } then c.drop(t, id): one thud, no roll. BALLOON_GRIPS.sandbag.neck =
//              [0, 0.27, 0]. Hung: its centre at radius 1.14 on a toggle's az (-84, -55, +55), y 0.36 (origin y 0.235), 0.02 off the wall.
// dawnvalley   scenery, never solid, no shadows, origin at the rig's origin (a sky prop like aasky: put it at the rig's spec x, y, z and never
//              move it). Sky (the inside of a sphere r 250, pinned to the far plane, hides the set's own dome r 262; sunrise side -z), nine
//              cumulus (drift 0.4 m/s toward +x), the sun at rig (30.7, 24.7, -233) (disc r 7.5, glow r 60, nine rays), three ridge cards
//              (z -230 / -170 / -110, 520 / 400 / 280 wide) and four mist bands (z -90, -140, -200, -245) that slide on t. No keys.
// BALLOON (export): the real sizes, places and body defaults. Not a prop: a table for the clip.

const V3 = THREE.Vector3, DEG = Math.PI / 180, TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// a stable pseudo-random number 0..1 from up to three integers (no state, no clock)
const hash = (i, j = 0, k = 0) => { let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 2147483647) + 1013904223) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const M4 = (p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => new THREE.Matrix4().compose(new V3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "YXZ")), new V3(...s));
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const atAz = (r, azDeg, y) => new V3(r * Math.sin(azDeg * DEG), y, r * Math.cos(azDeg * DEG));

export const BALLOON_GRIPS = { sandbag: { neck: [0, 0.27, 0] } };
export const BALLOON = {
  balloon: { w: 4.80, h: 8.12, d: 4.80, rim: 0.80, rimR: 1.05, ring: 2.70, hoop: 2.92, widest: 6.12, crown: 8.12, basket: 2.23, mouth: 1.84, deck: 0.50, step: 0.67, box: 0.85, stakeR: 1.75 },
  sandbag: { w: 0.24, h: 0.25, d: 0.18, body: { bounce: 0.02, friction: 0.95, density: 1600 } },
  dawnvalley: { r: 250 },
  // rig frame places: x, z, stand y (all face +z)
  places: { spud: [-0.535, 0.10, 0.50], wedge: [0.475, 0.10, 0.50], chip: [-0.05, 0.68, 0.67], mash: [0.0, -0.40, 0.85] },
  hung: { az: [-84, -55, 55], r: 1.14, y: 0.36 },
};

// ---------------------------------------------------------------------------------------------------- kit: merged flat-colour meshes
// add(geo, color, opts, matrix): opts { rough, metal, mark (a flat stroke: noOutline, drawn over the surface), solid (false: scenery) }
function kit() {
  const bins = new Map();
  return {
    add(geo, color, o = {}, M = null) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (M) g.applyMatrix4(M);
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const key = [color, o.rough ?? 0.7, o.metal ?? 0, o.mark ? 1 : 0, o.shadow === false ? 0 : 1].join("|");
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
        } else m = mat(color, { roughness: o.rough ?? 0.7, metalness: o.metal ?? 0 });
        const mesh = new THREE.Mesh(merged, m); mesh.castShadow = !o.mark && o.shadow !== false; mesh.receiveShadow = true; parent.add(mesh);
      }
      return parent;
    },
  };
}
// a straight rod from a to b (radius r0 at a, r1 at b)
function cyl(a, b, r0, r1 = r0, seg = 8) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, seg, 1);
  g.applyMatrix4(new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()), new V3(1, 1, 1)));
  return g;
}
const flat = (len, w, th = 0.0006) => { const g = new THREE.CapsuleGeometry(w / 2, Math.max(1e-4, len - w), 2, 6); g.rotateZ(Math.PI / 2); g.scale(1, 1, th / (w / 2)); return g; };
const discG = (rx, ry = rx, seg = 12) => { const g = new THREE.CircleGeometry(1, seg); g.scale(rx, ry, 1); return g; };
// a frame at p: x along tx (projected into the surface), z = the normal n
function frameOn(p, n, tx, lift = 0.0007) {
  const x = tx.clone().addScaledVector(n, -tx.dot(n)).normalize(), y = n.clone().cross(x);
  return new THREE.Matrix4().makeBasis(x, y, n).setPosition(p.clone().addScaledVector(n, lift));
}
// a ribbon following fn(u) -> { p, n } for u 0..1, half width wf(u), lifted along the normal
function ribbon(fn, N, wf, lift = 0.0007) {
  const pts = []; for (let i = 0; i <= N; i++) pts.push(fn(i / N));
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(N, i + 1)].p, t = b.clone().sub(a).normalize();
    const { p, n } = pts[i], s = n.clone().cross(t).normalize().multiplyScalar(wf(i / N)), q = p.clone().addScaledVector(n, lift);
    pos.push(q.x - s.x, q.y - s.y, q.z - s.z, q.x + s.x, q.y + s.y, q.z + s.z); nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
    if (i < N) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
// the outward normal of a surface p(u, v) by central differences (flip: -1 to turn it)
function surfN(fn, u, v, e = 1e-3, flip = 1) {
  const du = fn(u + e, v).sub(fn(u - e, v)), dv = fn(u, v + e).sub(fn(u, v - e));
  return du.cross(dv).normalize().multiplyScalar(flip);
}
const radial = (th) => new V3(Math.sin(th), 0, Math.cos(th));

// a tube of fixed topology that follows an array of points (for ropes, wires): N segments, K sides, flat quads coloured c0 / c1 by a twist pattern
function dynTube(parent, N, K, rad, c0, c1, o = {}) {
  const nv = N * K * 6, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), A = new THREE.Color(c0), B = new THREE.Color(c1 ?? c0);
  let q = 0;
  for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) { const c = (i + k) % (o.period ?? 4) === 0 ? B : A; for (let v = 0; v < 6; v++) { col[q * 3] = c.r; col[q * 3 + 1] = c.g; col[q * 3 + 2] = c.b; q++; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = mat("#ffffff", { roughness: o.rough ?? 0.85, vertexColors: true }); if (o.line) m.userData.lineColor = o.line; if (o.noOutline) m.userData.noOutline = true;
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.castShadow = o.shadow ?? false; mesh.receiveShadow = false; parent.add(mesh);
  const ring = [], tN = new V3(), tB = new V3(), a = new V3(), b = new V3(), t = new V3(), ref = new V3();
  return {
    mesh,
    set(pts) {
      for (let i = 0; i <= N; i++) {
        a.copy(pts[Math.max(0, i - 1)]); b.copy(pts[Math.min(N, i + 1)]); t.copy(b).sub(a).normalize();
        ref.set(0, 1, 0); if (Math.abs(t.y) > 0.95) ref.set(1, 0, 0);
        tN.copy(ref).cross(t).normalize(); tB.copy(t).cross(tN);
        const row = ring[i] ??= Array.from({ length: K }, () => ({ p: new V3(), n: new V3() }));
        for (let k = 0; k < K; k++) { const ang = (k / K) * TAU, c = Math.cos(ang), s = Math.sin(ang); row[k].n.copy(tN).multiplyScalar(c).addScaledVector(tB, s); row[k].p.copy(pts[i]).addScaledVector(row[k].n, rad); }
      }
      let w = 0;
      for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) {
        const k2 = (k + 1) % K, P = [ring[i][k], ring[i][k2], ring[i + 1][k], ring[i][k2], ring[i + 1][k2], ring[i + 1][k]];
        for (const r of P) { pos[w] = r.p.x; pos[w + 1] = r.p.y; pos[w + 2] = r.p.z; nor[w] = r.n.x; nor[w + 1] = r.n.y; nor[w + 2] = r.n.z; w += 3; }
      }
      g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------------------------------------------- envelope
const ENV = [[0, 0.92], [0.5, 1.20], [1.2, 1.62], [2.0, 2.07], [2.8, 2.34], [3.2, 2.40], [3.7, 2.33], [4.2, 2.10], [4.65, 1.70], [4.95, 1.10], [5.14, 0.50], [5.2, 0]];   // (height above the hoop, radius)
const envCurve = new THREE.SplineCurve(ENV.map(([h, r]) => new THREE.Vector2(r, h)));
const envDense = envCurve.getPoints(500).map((v) => [v.y, v.x]);   // (h, r), h rising
const envR = (h) => { const D = envDense; if (h <= D[0][0]) return D[0][1]; for (let i = 1; i < D.length; i++) if (D[i][0] >= h) { const f = (h - D[i - 1][0]) / Math.max(1e-9, D[i][0] - D[i - 1][0]); return lerp(D[i - 1][1], D[i][1], f); } return 0; };
const GORE = ["#c9432b", "#ef8a2a", "#f6e2b9"], SEAM = "#8f2f1f", GORES = 18, GA = 360 / GORES;
// a point on the envelope surface at height h above the hoop, azimuth az (degrees), fraction u across its gore (for the bulge)
const envPt = (h, az) => { const g = Math.floor((az + GA / 2) / GA + 1e-9), u = (az + GA / 2 - g * GA) / GA, r = envR(h) + 0.035 * 4 * u * (1 - u) * Math.min(1, envR(h) / 1.2); return new V3(r * Math.sin(az * DEG), h, r * Math.cos(az * DEG)); };
function goreShade(h, g, kk = 1) {
  const hf = h / 5.2, dark = hf < 0.2 ? 1 - 0.12 * (1 - hf / 0.2) : 1, light = h > 3.2 && h < 4.2 ? 1 + 0.06 * Math.sin(Math.PI * (h - 3.2)) : 1;
  return dark * light * (1 + 0.03 * (hash(g, 5) - 0.5)) * kk;
}
function envelopeGeo() {
  const NR = 34, NC = 6, rows = envCurve.getSpacedPoints(NR), pos = [], col = [], idx = [], hs = [], gi = [];
  const c = new THREE.Color();
  for (let g = 0; g < GORES; g++) {
    const base = g * (NR + 1) * (NC + 1);
    for (let j = 0; j <= NR; j++) for (let k = 0; k <= NC; k++) {
      const u = k / NC, az = g * GA + (u - 0.5) * GA, h = rows[j].y, r0 = rows[j].x, R = r0 + 0.035 * 4 * u * (1 - u) * Math.min(1, r0 / 1.2);
      pos.push(R * Math.sin(az * DEG), h, R * Math.cos(az * DEG)); hs.push(h); gi.push(g);
      c.set(GORE[g % 3]).multiplyScalar(goreShade(h, g)); col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < NR; j++) for (let k = 0; k < NC; k++) { const a = base + j * (NC + 1) + k, b = a + 1, d = a + NC + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, hs, gi };
}
// the skirt: cloth from the hoop down to radius 0.89 at -0.16 with 18 uneven scallops of 0.03, the gore colours 20 % darker
function skirtGeo() {
  const NC = 6, pos = [], col = [], idx = [], c = new THREE.Color();
  for (let g = 0; g < GORES; g++) {
    const base = g * 3 * (NC + 1), amp = 0.03 * (0.7 + 0.6 * hash(g, 11));
    for (let j = 0; j < 3; j++) for (let k = 0; k <= NC; k++) {
      const u = k / NC, az = g * GA + (u - 0.5) * GA, scal = j === 2 ? amp * Math.pow(Math.sin(Math.PI * u), 0.7) : 0, y = j === 0 ? 0.004 : j === 1 ? -0.08 : -0.16 - scal, r = j === 0 ? 0.922 : j === 1 ? 0.905 : 0.89;
      pos.push(r * Math.sin(az * DEG), y, r * Math.cos(az * DEG)); c.set(GORE[g % 3]).multiplyScalar(0.8 * (1 - 0.08 * j)); col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < 2; j++) for (let k = 0; k < NC; k++) { const a = base + j * (NC + 1) + k, b = a + 1, d = a + NC + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// strokes on the envelope: seams, cross seams, wrinkles, the crown cap. Returns { marks (kit), wrinkles (kit) }
function envelopeMarks(K, Kw) {
  const nrm = (h, az) => surfN((u, v) => envPt(u, v), h, az, 2e-3).multiplyScalar(-1);
  const onEnv = (h, az) => { const p = envPt(h, az); let n = nrm(h, az); if (n.dot(new V3(p.x, 0, p.z)) < 0) n.negate(); return { p, n }; };
  // 18 seam ribbons
  for (let g = 0; g < GORES; g++) {
    const az = g * GA + GA / 2;
    K.add(ribbon((u) => onEnv(0.03 + u * 5.1, az), 56, () => 0.01, 0.0025), SEAM, { mark: true, rough: 0.8 });
  }
  // cross seams: one wavering stroke on about 40 % of the panels (rows 0.55 apart), each drawn once
  for (let g = 0; g < GORES; g++) for (let k = 1; k <= 9; k++) {
    if (hash(g, k, 3) > 0.4) continue;
    const h0 = k * 0.55 + (hash(g, k, 4) - 0.5) * 0.08, ph = hash(g, k, 5) * 6.28, a0 = g * GA - GA * 0.44, a1 = g * GA + GA * 0.44, sh = shade(GORE[g % 3], 0.82);
    K.add(ribbon((u) => onEnv(h0 + 0.025 * Math.sin(u * 9 + ph), lerp(a0, a1, u)), 14, (u) => 0.006 * (0.6 + 0.4 * Math.sin(Math.PI * u)), 0.0025), sh, { mark: true, rough: 0.9 });
  }
  // 12 wrinkle strokes fanning 0.3-0.6 up from the hoop
  for (let i = 0; i < 12; i++) {
    const az = (i + 0.5 * hash(i, 8)) * 30 + 6, g = Math.round(az / GA) % GORES, len = 0.3 + 0.3 * hash(i, 9), sh = shade(GORE[g % 3], 0.78), ph = hash(i, 2) * 6;
    Kw.add(ribbon((u) => onEnv(0.02 + u * len, az + 3.5 * u * (hash(i, 6) - 0.5) * 2 + 0.6 * Math.sin(u * 6 + ph)), 8, (u) => 0.007 * (1 - 0.6 * u), 0.0025), sh, { mark: true, rough: 0.9 });
  }
  // the crown cap: red disc r 0.5 in a ring of seam red (a lathe hugging the dome)
  const cap = (r0, r1, lift) => {
    const pts = []; for (let i = 0; i <= 8; i++) { const r = lerp(r0, r1, i / 8), h = (() => { let lo = 4.6, hi = 5.2; for (let q = 0; q < 24; q++) { const m = (lo + hi) / 2; if (envR(m) > r) lo = m; else hi = m; } return (lo + hi) / 2; })(); pts.push(new THREE.Vector2(r, h + lift)); }
    return new THREE.LatheGeometry(pts, 36);
  };
  K.add(cap(0.001, 0.5, 0.004), GORE[0], { mark: true, rough: 0.8 });
  K.add(cap(0.5, 0.57, 0.0045), SEAM, { mark: true, rough: 0.8 });
}

// ---------------------------------------------------------------------------------------------------- the basket: weave painting, rim
const WEAVE = { W: 2048, H: 768, ribs: 34, rows: 26 };
function weaveTexture() {
  const { W, H, ribs, rows } = WEAVE, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d"), cw = W / ribs, ch = H / rows;
  g.fillStyle = "#6a3a16"; g.fillRect(0, 0, W, H);
  const TONE = ["#e0a04a", "#c98432", "#d8963f", "#e8b058", "#c98432"], SHADOW = "#9a5a22";
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  for (let r = 0; r < rows; r++) for (let k = 0; k < ribs; k++) {
    const x0 = k * cw, y0 = r * ch, hsh = hash(k, r, 1), over = (k + r) % 2 === 0;
    if (over) {
      // the strand passes over the rib: one stroke across the cell, its own width and tone
      const sh = hash(k, r, 2) < 0.22, tone = sh ? SHADOW : TONE[Math.floor(hash(k, r, 3) * TONE.length)], hh = ch * (0.78 + 0.16 * hsh), yy = y0 + (ch - hh) / 2 + (hash(k, r, 4) - 0.5) * 2.5;
      g.fillStyle = tone; rr(x0 + 1.5 + hash(k, r, 5) * 2, yy, cw - 3 - hash(k, r, 6) * 3, hh, hh * 0.45);
      g.fillStyle = "rgba(255,226,160,0.35)"; rr(x0 + 6, yy + 1.5, cw - 14 - hash(k, r, 7) * 8, 2.2, 1);
      g.strokeStyle = "rgba(110,60,20,0.35)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + 6, yy + hh * (0.45 + 0.2 * hash(k, r, 8))); g.lineTo(x0 + cw - 6, yy + hh * (0.45 + 0.2 * hash(k, r, 9))); g.stroke();
    } else {
      // the strand dives under: the upright rib shows, a short darker bit of strand each side
      const rw = cw * (0.4 + 0.1 * hsh), xx = x0 + (cw - rw) / 2 + (hash(k, r, 10) - 0.5) * 3, tone = hash(k, r, 11) < 0.3 ? "#b4722c" : "#cf8d3a";
      g.fillStyle = SHADOW; rr(x0 + 1.5, y0 + ch * 0.14, cw - 3, ch * 0.72, ch * 0.3);
      g.fillStyle = tone; rr(xx, y0 + 0.5, rw, ch - 1, rw * 0.35);
      g.fillStyle = "rgba(255,220,150,0.3)"; rr(xx + rw * 0.18, y0 + 2, 2.2, ch - 4, 1);
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
// the leather roll: centreline radius 1.05, 0.13 wide x 0.116 high, top at 0.80; 14 cushions of uneven length
const RIM = { R: 1.05, a: 0.065, b: 0.058, y: 0.742, n: 14, S: 10, P: 14 };
const rimJ = (() => { const L = Array.from({ length: RIM.n }, (_, i) => 1 + 0.12 * (2 * hash(i, 7) - 1)), s = L.reduce((x, y) => x + y, 0), J = [0.13]; for (const l of L) J.push(J.at(-1) + (TAU * l) / s); return J; })();
const rimTh = (s) => { const i = Math.floor(s), f = s - i, j = ((i % RIM.n) + RIM.n) % RIM.n, th0 = rimJ[j], th1 = rimJ[j + 1]; return { th: th0 + f * (th1 - th0) + Math.floor(i / RIM.n) * TAU, len: th1 - th0, f, j }; };
function rimPt(s, phi) {
  const { th, len, f } = rimTh(s), d = Math.min(f, 1 - f) * len * RIM.R, pinch = Math.exp(-Math.pow(d / 0.03, 2)), puff = Math.sin(Math.PI * f);
  const a = RIM.a * (1 + 0.05 * puff) - 0.008 * pinch, b = RIM.b * (1 + 0.04 * puff) - 0.008 * pinch, r = RIM.R + a * Math.cos(phi);
  return new V3(r * Math.sin(th), RIM.y + b * Math.sin(phi), r * Math.cos(th));
}
const rimOn = (s, phi) => { const p = rimPt(s, phi), n = surfN(rimPt, s, phi, 2e-3), th = rimTh(s).th, c = new V3(RIM.R * Math.sin(th), RIM.y, RIM.R * Math.cos(th)); if (n.dot(p.clone().sub(c)) < 0) n.negate(); return { p, n }; };
function rimGeometry() {
  const NS = RIM.n * RIM.S, NP = RIM.P, pos = [], col = [], idx = [], c = new THREE.Color();
  for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) {
    const s = i / RIM.S, phi = (j / NP) * TAU, p = rimPt(s, phi), cu = Math.floor(s), tone = 0.94 + 0.12 * hash(cu, 21), top = Math.sin(phi), f = s - cu, pinch = Math.exp(-Math.pow(Math.min(f, 1 - f) * (rimJ[cu % RIM.n + 1] - rimJ[cu % RIM.n]) * RIM.R / 0.03, 2));   // 1 on top, -1 under
    c.set("#7b3a22"); if (top > 0) c.lerp(new THREE.Color("#b45f33"), 0.85 * top * top); else c.lerp(new THREE.Color("#55250f"), 0.7 * -top);
    c.multiplyScalar(tone * (1 - 0.5 * pinch)); pos.push(p.x, p.y, p.z); col.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) { const a = i * NP + j, b = i * NP + ((j + 1) % NP), d = ((i + 1) % NS) * NP + j, e = ((i + 1) % NS) * NP + ((j + 1) % NP); idx.push(a, d, b, b, d, e); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
function rimMarks(K) {
  for (let j = 0; j < RIM.n; j++) {
    // stitches across each joint: cream
    for (let k = 0; k < 7; k++) {
      const phi = (14 + k * 25) * DEG, { p, n } = rimOn(j, phi), tx = rimOn(j + 0.02, phi).p.sub(rimOn(j - 0.02, phi).p);
      K.add(flat(0.02, 0.0045, 0.0005), "#e9cf9c", { mark: true, rough: 0.7 }, frameOn(p, n, tx, 0.0012));
    }
    // 1-2 crease strokes and one highlight stroke on the cushion
    const nc = 1 + (hash(j, 31) < 0.5 ? 1 : 0);
    for (let q = 0; q < nc; q++) {
      const s0 = j + 0.2 + 0.3 * hash(j, 32 + q), s1 = s0 + 0.25 + 0.2 * hash(j, 34 + q), phi0 = (30 + 100 * hash(j, 36 + q)) * DEG, ph = hash(j, 38 + q) * 6;
      K.add(ribbon((u) => rimOn(lerp(s0, s1, u), phi0 + 0.1 * Math.sin(u * 7 + ph)), 8, (u) => 0.0017 * (0.5 + Math.sin(Math.PI * u)), 0.0012), "#55250f", { mark: true, rough: 0.6 });
    }
    const h0 = j + 0.15 + 0.15 * hash(j, 40), h1 = j + 0.7 + 0.15 * hash(j, 41), hp = (62 + 18 * hash(j, 42)) * DEG;
    K.add(ribbon((u) => rimOn(lerp(h0, h1, u), hp + 0.06 * Math.sin(u * 5 + j)), 8, (u) => 0.004 * Math.sin(Math.PI * u) + 0.0006, 0.0012), "#c06a38", { mark: true, rough: 0.35 });
  }
}

// ---------------------------------------------------------------------------------------------------- stakes and clods
function makeStake(idx) {
  const K = kit(), g = new THREE.Group(), WOOD = "#a9783f", GRAIN = "#8a5c2c", CRACK = "#5e3d1c";
  K.add(new RoundedBoxGeometry(0.07, 0.64, 0.07, 2, 0.012), WOOD, { rough: 0.95 }, M4([0, 0.02, 0]));
  const tip = new THREE.ConeGeometry(0.05, 0.14, 4); tip.rotateY(Math.PI / 4); tip.rotateX(Math.PI); K.add(tip, WOOD, { rough: 0.95 }, M4([0, -0.37, 0]));
  K.add(new RoundedBoxGeometry(0.088, 0.03, 0.084, 2, 0.01), shade(WOOD, 0.94), { rough: 0.95 }, M4([0.002, 0.325, 0], [0, 0.1 * (hash(idx, 1) - 0.5), 0]));   // the top, mushroomed by the hammer
  K.add(new THREE.BoxGeometry(0.004, 0.034, 0.075), CRACK, { mark: true }, M4([0.004, 0.329, 0], [0, 0, 0.2 * (hash(idx, 2) - 0.5)]));   // the split
  for (const sx of [-1, 1]) K.add(new THREE.BoxGeometry(0.012, 0.012, 0.03), shade(WOOD, 0.88), { rough: 0.95 }, M4([sx * 0.046, 0.332, (hash(idx, 3 + sx) - 0.5) * 0.04], [0, 0, sx * 0.6]));   // frayed bits
  K.add(new THREE.BoxGeometry(0.0745, 0.07, 0.0745), "#6e4a28", { rough: 1 }, M4([0, 0.032, 0]));   // the damp band at the turf line
  // grain and cracks on the four faces
  for (let f = 0; f < 4; f++) {
    const ry = f * Math.PI / 2, M0 = M4([0, 0, 0], [0, ry, 0]);
    for (let q = 0; q < 12; q++) {
      const y0 = -0.05 + 0.34 * hash(idx, f, q + 40), len = Math.min(0.06 + 0.2 * hash(idx, f, q), 0.2 * 2 * (0.305 - Math.max(0.09, y0)) + 0.02), x = (hash(idx, f, q + 80) - 0.5) * 0.058, crack = q < 2;
      K.add(new THREE.BoxGeometry(crack ? 0.0035 : 0.0022, len, 0.0012), crack ? CRACK : GRAIN, { mark: true }, M0.clone().multiply(M4([x, Math.min(0.3 - len / 2, Math.max(0.09, y0 + len / 2)), 0.0365]).multiply(M4([0, 0, 0], [0, 0, (hash(idx, f, q + 120) - 0.5) * 0.08]))));
    }
  }
  // three wraps of hemp rope at the groove, 0.24 above the turf
  for (let w = 0; w < 3; w++) { const t = new THREE.TorusGeometry(0.046, 0.0125, 6, 18); t.rotateX(Math.PI / 2); K.add(t, "#d9c08a", { rough: 0.9 }, M4([0, 0.216 + w * 0.027, 0], [0, w * 0.5, 0])); }
  return K.flush(g);
}
const clodGeo = (() => { const g = new THREE.IcosahedronGeometry(1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.82 + 0.3 * hash(Math.round(p.getX(i) * 20), Math.round(p.getY(i) * 20), Math.round(p.getZ(i) * 20)); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.78, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
const clodCap = (() => { const g = new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, 1.05); g.scale(0.9, 0.42, 0.9); return g; })();

// ---------------------------------------------------------------------------------------------------- the balloon
const TETHER = [{ az: -70, f: 0.05 }, { az: 110, f: 0.20 }, { az: 70, f: 0.35 }, { az: -110, f: 0.50 }];   // front-left, back-right, front-right, back-left
const STAKE_R = 1.75, LEAN = 12 * DEG, GROOVE = 0.24, ROPE_L = 0.83, RING_R = 1.128, RING_Y = 0.72;

function balloon(P) {
  const S = P.spec, G = P.whole;
  const basket = new THREE.Group(), upper = new THREE.Group(), envG = new THREE.Group(), ground = new THREE.Group(), tethers = new THREE.Group();
  G.add(basket, upper, envG, ground, tethers);

  // ---- envelope
  const { geo: eGeo, hs, gi } = envelopeGeo();
  const envM = mat("#ffffff", { vertexColors: true, roughness: 0.85, side: THREE.FrontSide, emissive: new THREE.Color("#8c6648"), emissiveIntensity: 1 }); envM.userData.lineColor = "#7a2a1a"; envM.userData.noHatch = true;
  const env = new THREE.Mesh(eGeo, envM); env.castShadow = false; env.receiveShadow = false; env.userData.solid = false; envG.add(env);
  // the inside: the gore colours x 0.55, lit by the burner at the hoop (rewritten when burn changes), unlit
  const inGeo = new THREE.BufferGeometry(); inGeo.setAttribute("position", eGeo.attributes.position); inGeo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(hs.length * 3), 3)); inGeo.setIndex(eGeo.index);
  const inM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false }); inM.userData.noOutline = true;
  const inner = new THREE.Mesh(inGeo, inM); inner.castShadow = false; inner.userData.solid = false; inner.userData.steam = true; envG.add(inner);
  let lastBurn = -1;
  const paintInside = (burn) => {
    const c = new THREE.Color(), lit = new THREE.Color("#ff9a3a"), a = inGeo.attributes.color;
    for (let i = 0; i < hs.length; i++) { c.set(GORE[gi[i] % 3]).multiplyScalar(0.55); { const k = 0.5 * burn * Math.pow(Math.max(0, 1 - hs[i] / 3), 1.3); c.r += lit.r * k; c.g += lit.g * k; c.b += lit.b * k; } a.setXYZ(i, c.r, c.g, c.b); }
    a.needsUpdate = true; lastBurn = burn;
  };
  paintInside(0);
  const skirtM = mat("#ffffff", { vertexColors: true, roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color("#3a281a") }); skirtM.userData.lineColor = "#7a2a1a";
  const skirt = new THREE.Mesh(skirtGeo(), skirtM); skirt.castShadow = false; skirt.userData.solid = false; envG.add(skirt);
  const Km = kit(), Kw = kit(); envelopeMarks(Km, Kw);
  Km.flush(envG); const wrinkleG = new THREE.Group(); Kw.flush(wrinkleG); envG.add(wrinkleG);
  for (const m of wrinkleG.children) { m.material.transparent = true; m.castShadow = false; }
  envG.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.userData.solid = false; } });
  const hoop = new THREE.TorusGeometry(0.92, 0.02, 8, 64); hoop.rotateX(Math.PI / 2);
  { const K = kit(); K.add(hoop, "#c5c9cc", { metal: 0.6, rough: 0.35 }); K.flush(envG); }

  // ---- load ring, bar, uprights, burner (static, in the upper group)
  const Ku = kit();
  { const ring = new THREE.TorusGeometry(0.88, 0.022, 8, 64); ring.rotateX(Math.PI / 2); Ku.add(ring, "#c5c9cc", { metal: 0.6, rough: 0.35 }, M4([0, 2.70, 0])); }
  Ku.add(cyl([-0.88, 2.70, 0], [0.88, 2.70, 0], 0.018, 0.018, 8), "#c5c9cc", { metal: 0.6, rough: 0.35 });
  for (const az of [-70, 70, -110, 110]) {
    const a = atAz(1.02, az, 0.80), b = atAz(0.88, az, 2.70), up = b.clone().sub(a).normalize(), at = (d) => a.clone().addScaledVector(up, d);
    Ku.add(cyl(a.toArray(), b.toArray(), 0.016, 0.016, 8), "#c5c9cc", { metal: 0.6, rough: 0.35 });
    Ku.add(cyl(a.clone().add(new V3(0, -0.0, 0)).toArray(), a.clone().add(new V3(0, 0.05, 0)).toArray(), 0.03, 0.03, 10), "#b98a3c", { metal: 0.5, rough: 0.4 });   // the brass socket
    for (const d of [0.5, 1.4]) Ku.add(cyl(at(d - 0.015).toArray(), at(d + 0.015).toArray(), 0.024, 0.024, 10), "#b98a3c", { metal: 0.5, rough: 0.4 });   // brass collars
    Ku.add(cyl(at(0.06).toArray(), at(0.36).toArray(), 0.0215, 0.0215, 8), "#7b3a22", { rough: 0.8 });   // leather wrap on the lowest 0.30
  }
  // burner: can on a brass collar, blast lever with a red knob, a 5-turn coil
  Ku.add(cyl([0, 2.70, 0], [0, 2.73, 0], 0.095, 0.095, 14), "#b98a3c", { metal: 0.5, rough: 0.4 });
  Ku.add(cyl([0, 2.73, 0], [0, 2.86, 0], 0.085, 0.085, 14), "#8f949a", { metal: 0.6, rough: 0.4 });
  Ku.add(cyl([-0.08, 2.78, 0.02], [-0.20, 2.80, 0.03], 0.008, 0.008, 6), "#8f949a", { metal: 0.6, rough: 0.4 });
  Ku.add(new THREE.SphereGeometry(0.018, 10, 8), "#c9322a", { rough: 0.5 }, M4([-0.205, 2.80, 0.03]));
  const helix = (u0, u1) => { const pts = []; for (let i = 0; i <= 60 * (u1 - u0); i++) { const u = u0 + i / 60, rr = lerp(0.12, 0.10, u / 5), a = u * TAU; pts.push(new V3(rr * Math.cos(a), 2.86 + (u / 5) * 0.22, rr * Math.sin(a))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.round(14 * (u1 - u0) * 5), 0.012, 6, false); };
  Ku.add(helix(0, 4), "#8f949a", { metal: 0.6, rough: 0.4 });
  Ku.flush(upper);
  const coilTop = new THREE.Mesh(helix(4, 5), mat("#7d8fb0", { roughness: 0.4, metalness: 0.4, emissive: new THREE.Color("#ff7a1a"), emissiveIntensity: 0 })); coilTop.castShadow = true; upper.add(coilTop);
  // two black hoses from the can to the back uprights and down them to the rim
  { const K = kit();
    for (const sx of [-1, 1]) {
      const az = sx > 0 ? 110 : -110, up = (y) => atAz(lerp(1.02, 0.88, (y - 0.8) / 1.9), az, y), pts = [new V3(sx * 0.08, 2.76, -0.04), new V3(sx * 0.3, 2.56, -0.13), up(2.5).add(new V3(0, 0, -0.02)), up(1.6).add(new V3(0, 0, -0.03)), up(0.95).add(new V3(0, 0, -0.035)), atAz(1.02, az, 0.84).add(new V3(0, 0, -0.03))];
      K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 6, false), "#2e2a28", { rough: 0.7 });
    }
    K.flush(upper); }
  // twelve flying wires, ring to hoop (they follow the envelope's lift and turn)
  const wires = Array.from({ length: 12 }, () => dynTube(upper, 3, 4, 0.004, "#5a5f66", "#5a5f66", { rough: 0.5, shadow: false }));
  upper.traverse((o) => { if (o.isMesh && o !== wires[0]?.mesh) o.userData.solid = o.userData.solid ?? true; });

  // ---- flame (unlit, see-through), glow
  const fl = new THREE.Group(); fl.position.set(0, 2.88, 0); upper.add(fl);
  const bm = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, fog: false, transparent: true, depthWrite: false, ...o }); m.userData.noOutline = true; return m; };
  const flameMesh = (geo, m, order = 5) => { const me = new THREE.Mesh(geo, m); me.castShadow = false; me.userData.steam = true; me.userData.solid = false; me.renderOrder = order; fl.add(me); return me; };
  const drop = (() => { const pts = [[0.001, 0], [0.34, 0.07], [0.5, 0.24], [0.43, 0.48], [0.25, 0.72], [0.08, 0.92], [0.001, 1]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 16); })();
  const coneC = (() => { const g = new THREE.ConeGeometry(1, 1, 14, 1, true); g.translate(0, 0.5, 0); const p = g.attributes.position, c = []; const a = new THREE.Color("#3f8cff"), b = new THREE.Color("#9fdcff"), q = new THREE.Color(); for (let i = 0; i < p.count; i++) { q.copy(a).lerp(b, p.getY(i)); c.push(q.r, q.g, q.b); } g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); return g; })();
  const pilot = flameMesh(coneC, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false, transparent: true, depthWrite: false, opacity: 0.95 }), 4); pilot.material.userData.noOutline = true; pilot.scale.set(0.014, 0.05, 0.014);
  const core = flameMesh(coneC, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false, transparent: true, depthWrite: false, opacity: 0.9 }), 6); core.material.userData.noOutline = true;
  const layers = [["#ff7a1a", 1, 1, 0.9], ["#ffb030", 0.8, 0.86, 0.95], ["#ffe680", 0.55, 0.68, 0.97]].map(([c, w, h, o], i) => ({ me: flameMesh(drop, bm(c, { opacity: o }), 7 + i), w, h }));
  const tongues = Array.from({ length: 5 }, (_, i) => ({ me: flameMesh(drop, bm(i % 2 ? "#ffb030" : "#ff7a1a", { opacity: 0 }), 11), i }));
  const glowM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { k: { value: 0 }, c: { value: new THREE.Color("#ffb060") } },
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float k; uniform vec3 c; varying vec3 vN; void main(){ float a = pow(abs(normalize(vN).z), 2.2) * k; gl_FragColor = vec4(c * a, a);\n #include <colorspace_fragment>\n }",
  });
  glowM.userData.noOutline = true;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), glowM); glow.userData.steam = true; glow.userData.solid = false; glow.renderOrder = 12; glow.castShadow = false; glow.frustumCulled = false; upper.add(glow);

  // ---- basket
  const Kb = kit(), Kbm = kit();
  const wallPts = [[-0.02, 0.875], [0, 0.88], [0.10, 0.91], [0.30, 0.96], [0.55, 1.005], [0.70, 1.03], [0.74, 1.035]];
  const wallCurve = new THREE.SplineCurve(wallPts.map(([y, r]) => new THREE.Vector2(y, r))), wallDense = wallCurve.getPoints(300);
  const wallR = (y) => { for (let i = 1; i < wallDense.length; i++) if (wallDense[i].x >= y) return lerp(wallDense[i - 1].y, wallDense[i].y, (y - wallDense[i - 1].x) / Math.max(1e-9, wallDense[i].x - wallDense[i - 1].x)); return 1.035; };
  const NW = 78, y0 = -0.02, y1 = 0.74;
  const outer = [], innerP = [];
  for (let j = 0; j <= NW; j++) { const y = y0 + (y1 - y0) * (j / NW), ridge = 0.0035 * (0.5 + 0.5 * Math.cos(TAU * ((y - y0) / (y1 - y0)) * WEAVE.rows - Math.PI)); outer.push(new THREE.Vector2(wallR(y) + ridge, y)); innerP.push(new THREE.Vector2(wallR(y) - 0.035, y)); }
  const weaveM = mat("#ffffff", { map: weaveTexture(), roughness: 0.9 }); weaveM.userData.lineColor = "#5a3012"; weaveM.userData.noHatch = true;
  const wall = new THREE.Mesh(new THREE.LatheGeometry(outer, 96), weaveM); wall.castShadow = wall.receiveShadow = true; basket.add(wall);
  const innerM = mat("#8a5a26", { roughness: 0.95, side: THREE.BackSide }); const wallIn = new THREE.Mesh(new THREE.LatheGeometry(innerP, 64), innerM); wallIn.castShadow = false; wallIn.receiveShadow = true; basket.add(wallIn);
  // three braided bands
  for (const y of [0.03, 0.40, 0.69]) {
    const R = wallR(y) + 0.012, t = new THREE.TorusGeometry(R, 0.03, 8, 96); t.rotateX(Math.PI / 2); Kb.add(t, "#b87428", { rough: 0.85 }, M4([0, y, 0]));
    for (let i = 0; i < 90; i++) for (const row of [-1, 1]) {
      const th = ((i + (row > 0 ? 0.5 : 0)) / 90) * TAU, psi = row * 34 * DEG, r = R + 0.03 * Math.cos(psi), p = new V3(r * Math.sin(th), y + 0.03 * Math.sin(psi), r * Math.cos(th)), n = new V3(Math.cos(psi) * Math.sin(th), Math.sin(psi), Math.cos(psi) * Math.cos(th)), tg = new V3(Math.cos(th), 0, -Math.sin(th)).addScaledVector(new V3(0, 1, 0), row * 0.9);
      Kbm.add(flat(0.034, 0.005, 0.0006), "#7a4a1a", { mark: true }, frameOn(p, n, tg, 0.0009));
    }
  }
  // the leather rim, its marks, the lacing cord under it
  const rimM = mat("#ffffff", { vertexColors: true, roughness: 0.55 }); rimM.userData.lineColor = "#3a1808"; rimM.userData.noHatch = true;
  const rim = new THREE.Mesh(rimGeometry(), rimM); rim.castShadow = rim.receiveShadow = true; basket.add(rim);
  rimMarks(Kbm);
  { const pts = []; for (let i = 0; i < 112; i++) { const th = (i / 112) * TAU, hi = i % 2 === 0, y = hi ? 0.688 : 0.60, r = hi ? 1.075 : wallR(0.6) + 0.012; pts.push(new V3(r * Math.sin(th), y, r * Math.cos(th))); }
    Kb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 224, 0.006, 4, true), "#d9b877", { rough: 0.8 }); }
  { const bot = new THREE.Mesh(new THREE.CircleGeometry(0.885, 40), mat("#a8682a", { roughness: 0.95, side: THREE.DoubleSide })); bot.rotation.x = Math.PI / 2; bot.position.y = 0.002; bot.castShadow = false; basket.add(bot); }   // the wicker bottom
  // the floor: deck 0.50, front step 0.67, back box 0.85 (tops to stand on)
  const plank = mat("#6b4a2b", { roughness: 0.9 }), wick = mat("#c98432", { roughness: 0.9 });
  { const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.965, 0.965, 0.04, 56), plank); deck.position.y = 0.48; deck.receiveShadow = true; basket.add(deck);
    for (let i = -3; i <= 3; i++) { const x = i * 0.27, half = Math.sqrt(Math.max(0.01, 0.94 * 0.94 - x * x)); Kbm.add(new THREE.BoxGeometry(0.005, 0.001, half * 2), "#3e2a16", { mark: true }, M4([x, 0.5008, 0])); } }
  const zOf = (x, R) => Math.sqrt(Math.max(0, R * R - x * x));
  const slab = (x0, x1, zFlat, front, y0b, y1b, mats) => {
    const sh = new THREE.Shape(), R = 0.945, n = 14, zf = front ? zFlat : -zFlat; sh.moveTo(x0, -zf);   // (shape y = -z)
    sh.lineTo(x1, -zf); for (let i = 0; i <= n; i++) { const x = lerp(x1, x0, i / n), z = zOf(x, R) * (front ? 1 : -1); sh.lineTo(x, -z); } sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: y1b - y0b, bevelEnabled: false, steps: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y0b, 0);
    const me = new THREE.Mesh(g, mats); me.castShadow = me.receiveShadow = true; basket.add(me); return me;
  };
  slab(-0.34, 0.24, 0.42, true, 0.50, 0.67, [plank, wick]);
  slab(-0.20, 0.26, 0.13, false, 0.50, 0.85, [plank, wick]);
  // Mash's box: the gas cylinder's wicker cover with one leather strap
  Kb.add(new THREE.BoxGeometry(0.04, 0.006, 0.7), "#7b3a22", { rough: 0.7 }, M4([0.03, 0.853, -0.50]));
  Kb.add(new THREE.BoxGeometry(0.04, 0.34, 0.006), "#7b3a22", { rough: 0.7 }, M4([0.03, 0.68, -0.128 - 0.0]));
  // hooks (3 toggles under the rim, az -84 -55 +55) and a steel rope ring at each tether
  for (const az of [-84, -55, 55]) { const p = atAz(1.125, az, 0.69), tg = new V3(Math.cos(az * DEG), 0, -Math.sin(az * DEG)); Kb.add(cyl(p.clone().addScaledVector(tg, -0.025).toArray(), p.clone().addScaledVector(tg, 0.025).toArray(), 0.0085, 0.0085, 8), "#a9783f", { rough: 0.9 });
    Kb.add(new THREE.SphereGeometry(0.0085, 8, 6), "#8a5c2c", { rough: 0.9 }, M4(p.clone().addScaledVector(tg, 0.025).toArray())); Kb.add(new THREE.SphereGeometry(0.0085, 8, 6), "#8a5c2c", { rough: 0.9 }, M4(p.clone().addScaledVector(tg, -0.025).toArray())); }
  for (const { az } of TETHER) { const t = new THREE.TorusGeometry(0.02, 0.004, 6, 18); Kb.add(t, "#c5c9cc", { metal: 0.6, rough: 0.35 }, M4(atAz(RING_R - 0.008, az, RING_Y).toArray(), [0, (az + 90) * DEG, 0])); }
  Kb.flush(basket); Kbm.flush(basket);
  basket.traverse((o) => { if (o.isMesh && o.material?.userData?.noOutline) o.castShadow = false; });

  // ---- ground: pressed grass, holes (they stay in the grass when the rig lifts)
  const pressM = mat("#5f8a36", { roughness: 1, transparent: true, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: false }); pressM.userData.noOutline = true;
  { const rg = new THREE.RingGeometry(0.86, 1.05, 64); rg.rotateX(-Math.PI / 2); const pr = new THREE.Mesh(rg, pressM); pr.position.y = 0.006; pr.receiveShadow = true; pr.userData.solid = false; ground.add(pr); }
  const holeM = mat("#2c1d10", { roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), tornM = mat("#6b4a2b", { roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  holeM.userData.noOutline = true; tornM.userData.noOutline = true;
  const clodM = mat("#6b4a2b", { roughness: 1 }), capM = mat("#5f8a36", { roughness: 1 }); clodM.userData.lineColor = "#3a2813"; capM.userData.lineColor = "#34501c";
  const stakes = TETHER.map((T, i) => {
    const base = atAz(STAKE_R, T.az, 0), grp = makeStake(i); tethers.add(grp); grp.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
    const hole = new THREE.Group(); { const d = new THREE.Mesh(discG(0.062, 0.058, 12), holeM); d.rotation.x = -Math.PI / 2; d.position.y = 0.0045; const t = new THREE.Mesh(discG(0.105, 0.095, 12), tornM); t.rotation.x = -Math.PI / 2; t.position.y = 0.003; hole.add(t, d); hole.position.copy(base); hole.visible = false; ground.add(hole); hole.traverse((o) => { o.userData.solid = false; o.receiveShadow = true; }); }
    const clods = Array.from({ length: 5 }, (_, c) => {
      const a = (hash(i, c, 1) * 0.5 + c / 5) * TAU, dist = 0.2 + 0.3 * hash(i, c, 2), peak = 0.22 + 0.3 * hash(i, c, 3), sz = 0.032 + 0.03 * hash(i, c, 4), g = new THREE.Group();
      const b = new THREE.Mesh(clodGeo, clodM); b.scale.setScalar(sz); b.castShadow = true; const cap = new THREE.Mesh(clodCap, capM); cap.scale.setScalar(sz); cap.position.y = sz * 0.5; g.add(b, cap); g.visible = false; ground.add(g);
      return { g, dir: new V3(Math.sin(a), 0, Math.cos(a)), dist, peak, sz, stay: c < 2, spin: new V3(hash(i, c, 5) * 6 - 3, hash(i, c, 6) * 4, hash(i, c, 7) * 6 - 3) };
    });
    const rope = dynTube(tethers, 64, 8, 0.014, "#d9c08a", "#b89a5e", { rough: 0.95, line: "#8a6e3a", period: 4, shadow: true });
    return { T, i, base, grp, hole, clods, rope, out: radial(T.az * DEG), ring: atAz(RING_R, T.az, RING_Y) };
  });
  const swayPts = []; for (let i = 0; i <= 64; i++) swayPts.push(new V3());

  // the contact checks measure a body against each mesh's box: the rig's parts (wall, rim, floor blocks, uprights, ring) are shells and blocks round and under
  // the cast, so they are judged by their surface alone (userData.surfaceOnly); the ground parts are flat and small
  G.traverse((o) => { if (o.isMesh && o.parent !== ground) o.userData.surfaceOnly = true; });
  // ---- per frame
  const Dv = new V3(), ringW = new V3(), grooveG = new V3(), Gp = new V3(), up = new V3(0, 1, 0), aG = new V3(), aA = new V3(), tmp = new V3(), v0 = new V3(), dd = new V3(), Q = new THREE.Quaternion(), ax = new V3(), hoopTop = new V3();
  return {
    grip: 0,
    apply(ps, t = 0) {
      const burn = clamp(ps.burn ? ps.burn : S.burn ?? 0.3), strain = clamp(ps.strain ?? S.strain ?? 0), sway = clamp(ps.sway ?? S.sway ?? 0), taut = clamp(ps.taut ?? S.taut ?? 1), free = clamp(ps.free ?? S.free ?? 0);
      // the ground stays where spec put it
      const th = (ps.rot ?? 0) * DEG, dx = (S.x ?? 0) - ps.x, dz = (S.z ?? 0) - ps.z, dy = (S.y ?? 0) - ps.y;
      Dv.set(dx * Math.cos(th) - dz * Math.sin(th), dy, dx * Math.sin(th) + dz * Math.cos(th));
      ground.position.copy(Dv);
      // envelope: strain lift and stretch, sway turn and rock
      const tug = 1 + 0.3 * Math.sin(TAU * 0.8 * t), s = strain * tug;
      envG.position.set(0, 2.92 + 0.08 * s, 0); envG.scale.set(1 - 0.012 * s, 1 + 0.035 * s, 1 - 0.012 * s);
      envG.rotation.set(0, sway * 3 * DEG * Math.sin(TAU * t / 7), sway * 2 * DEG * Math.sin(TAU * t / 4.3)); envG.updateMatrix();
      for (const m of wrinkleG.children) m.material.opacity = 1 - strain * 0.9;
      if (Math.abs(burn - lastBurn) > 0.004) paintInside(burn);
      coilTop.material.emissiveIntensity = 0.6 * burn;
      // wires: ring to hoop, straight with strain, a little slack without
      for (let i = 0; i < 12; i++) {
        const az = i * 30 + 15, a = atAz(0.88, az, 2.70); hoopTop.set(0.92 * Math.sin(az * DEG), 0, 0.92 * Math.cos(az * DEG)).applyMatrix4(envG.matrix);
        const slack = 0.025 * (1 - strain) * Math.cos(TAU * t * 0.5 + i);
        for (let k = 0; k <= 3; k++) { const f = k / 3; swayPts[k].copy(a).lerp(hoopTop, f); const bow = Math.sin(Math.PI * f) * slack; swayPts[k].x += bow * Math.cos(az * DEG); swayPts[k].z -= bow * Math.sin(az * DEG); }
        wires[i].set(swayPts.slice(0, 4));
      }
      // flame
      const fk = smooth(0.0, 0.12, burn), H = (0.3 + 1.5 * burn), Wd = 0.16 + 0.22 * burn, fa = (ph = 0) => 1 + 0.10 * Math.sin(69.1 * t + ph) + 0.06 * Math.sin(108.7 * t + 1.7 + ph) + 0.05 * Math.sin(32.0 * t + 0.4 + ph);
      const lean = 4 * DEG * Math.sin(20.7 * t);
      core.visible = fk > 0.01; core.scale.set(0.07, (0.25 + 0.45 * burn) * fa(0.3) * fk, 0.07); core.rotation.z = lean * 0.6;
      layers.forEach((L, i) => { L.me.visible = fk > 0.01; L.me.scale.set(Wd / 2 * L.w * (1 + 0.04 * Math.sin(50 * t + i)), H * L.h * fa(i * 0.9) * fk, Wd / 2 * L.w); L.me.rotation.z = lean * (1 + 0.3 * i); L.me.position.y = 0.0; });
      tongues.forEach(({ me, i }) => {
        const T = 0.23 + 0.035 * i, p = (((t / T) + i * 0.37) % 1 + 1) % 1, a = i * 72 * DEG + 0.4, rr = 0.05 + 0.07 * burn;
        me.visible = fk > 0.01; me.position.set(Math.sin(a) * rr, 0.05 + p * 0.3, Math.cos(a) * rr); me.scale.set(0.025 + 0.03 * burn, 0.12 + 0.08 * burn, 0.025 + 0.03 * burn); me.material.opacity = (1 - p) * 0.9 * fk;
      });
      glow.position.set(0, 2.95 + 0.5 * burn, 0); glow.scale.setScalar(0.5 + 0.9 * burn); glowM.uniforms.k.value = 0.35 * burn * 1.0; glow.visible = burn > 0.01;
      // tethers: stakes, ropes, holes, clods
      for (const st of stakes) {
        const { T, i, base, grp, hole, clods, rope, out, ring } = st;
        const pull = smooth(T.f - 0.05, T.f, free), lean = LEAN + 12 * DEG * pull;
        aG.copy(out).multiplyScalar(Math.sin(lean)).addScaledVector(up, Math.cos(lean));
        tmp.copy(base).add(Dv); tmp.y += 0.10 * pull;   // the stake in the ground, pulled up
        grooveG.copy(tmp).addScaledVector(aG, GROOVE);
        ringW.copy(ring);
        let pos = tmp, axis = aG, Gend = grooveG;
        if (free > T.f) {
          const u = (free - T.f) / 0.5, b = 1 - Math.exp(-4 * u) * Math.cos(3 * Math.PI * u);
          v0.copy(grooveG).sub(ringW); const L0 = v0.length(); v0.divideScalar(L0 || 1);
          dd.copy(v0).lerp(new V3(0, -1, 0), b).normalize();
          Gp.copy(ringW).addScaledVector(dd, lerp(L0, ROPE_L, clamp(b)));
          aA.copy(aG).lerp(up, clamp(b, -0.3, 1.3)).normalize();
          pos = tmp.copy(Gp).addScaledVector(aA, -GROOVE); axis = aA; Gend = Gp;
        }
        grp.position.copy(pos); Q.setFromUnitVectors(up, axis); grp.quaternion.copy(Q);
        // hole and clods
        hole.visible = free > T.f - 0.005; if (hole.visible) hole.position.copy(base);
        const tau = clamp((free - T.f) / 0.15);
        for (const c of clods) {
          c.g.visible = free > T.f && (c.stay || tau < 1);
          if (!c.g.visible) continue;
          const e = tau, h = 4 * c.peak * e * (1 - e), sc = c.stay ? 1 : 1 - smooth(0.8, 1, tau);
          c.g.position.set(base.x + c.dir.x * c.dist * e, 0.02 + c.sz * 0.35 + h, base.z + c.dir.z * c.dist * e); c.g.scale.setScalar(sc);
          c.g.rotation.set(c.spin.x * (1 - e), c.spin.y * (1 - e), c.spin.z * (1 - e));
        }
        // rope: ring to groove; taut line with a hum, or a sag
        const sag = 0.14 * (1 - taut) * (1 - taut), hum = 0.004 * smooth(0.9, 1, taut);
        for (let k = 0; k <= 64; k++) {
          const f = k / 64, p = swayPts[k]; p.copy(ringW).lerp(Gend, f);
          p.y += -sag * 4 * f * (1 - f) + hum * Math.sin(Math.PI * f) * Math.sin(TAU * 9 * t + i);
          p.x += hum * Math.sin(Math.PI * f) * Math.cos(TAU * 9 * t + i) * 0.5;
          if (p.y < Dv.y + 0.02 && k < 64) p.y = Dv.y + 0.02;
        }
        rope.set(swayPts);
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------------- the sandbag
const BAG = [[0.001, 0], [0.085, 0], [0.108, 0.012], [0.12, 0.05], [0.118, 0.10], [0.105, 0.15], [0.08, 0.19], [0.052, 0.222], [0.036, 0.246], [0.033, 0.256], [0.037, 0.268], [0.034, 0.29], [0.001, 0.29]];
function sandbag(P) {
  const S = P.spec, seed = S.seed ?? 1, K = kit(), g = new THREE.Group(); P.whole.add(g);
  const bagP = (a, y) => { const r = lerp(BAG[0][0], BAG[0][0], 0) + (() => { for (let i = 1; i < BAG.length; i++) if (BAG[i][1] >= y) return lerp(BAG[i - 1][0], BAG[i][0], (y - BAG[i - 1][1]) / Math.max(1e-9, BAG[i][1] - BAG[i - 1][1])); return 0.03; })(), zk = lerp(0.75, 1, smooth(0.22, 0.26, y)), lumps = 1 + 0.03 * Math.sin(a * 3 + seed) * smooth(0.02, 0.1, y) * (1 - smooth(0.2, 0.24, y)); return new V3(r * lumps * Math.sin(a) + 0.03 * Math.pow(y / 0.25, 2), y, r * lumps * zk * Math.cos(a)); };
  const lat = new THREE.LatheGeometry(BAG.map(([r, y]) => new THREE.Vector2(r, y)), 40), pos = lat.attributes.position, colr = [], c0 = new THREE.Color("#c9ad7d"), c1 = new THREE.Color("#9c7f52");
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(x, z), q = bagP(a, y); pos.setXYZ(i, q.x, q.y, q.z); const c = y < 0.006 ? c1 : c0; colr.push(c.r, c.g, c.b); }
  lat.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); lat.computeVertexNormals();
  const bagM = mat("#ffffff", { vertexColors: true, roughness: 1 }); bagM.userData.lineColor = "#5a4528"; bagM.userData.noHatch = true;
  const body = new THREE.Mesh(lat, bagM); body.castShadow = body.receiveShadow = true; g.add(body);
  const on = (a, y) => { const p = bagP(a, y), n = surfN((u, v) => bagP(u, v), a, y, 2e-3); const c = new V3(0.03 * Math.pow(y / 0.25, 2), y, 0); if (n.dot(p.clone().sub(c)) < 0) n.negate(); return { p, n }; };
  // about 40 short cross-hatch strokes in two directions, one worn patch, one dashed seam
  for (let i = 0; i < 40; i++) {
    const a = hash(i, seed, 1) * TAU, y = 0.025 + 0.2 * hash(i, seed, 2), { p, n } = on(a, y), rot = (i % 2 ? 1 : -1) * 0.7 + (hash(i, seed, 3) - 0.5) * 0.4, tx = new V3(Math.cos(a), 0, -Math.sin(a)).multiplyScalar(Math.cos(rot)).addScaledVector(new V3(0, 1, 0), Math.sin(rot));
    K.add(flat(0.016 + 0.014 * hash(i, seed, 4), 0.0028, 0.0005), "#a88a58", { mark: true, rough: 1 }, frameOn(p, n, tx, 0.0008));
  }
  { const { p, n } = on(0.5, 0.11); K.add(discG(0.04, 0.03, 14), "#dcc59b", { mark: true, rough: 1 }, frameOn(p, n, new V3(1, 0.3, 0), 0.001)); }
  for (let i = 0; i < 9; i++) { const y = 0.03 + i * 0.021, { p, n } = on(2.2, y); K.add(flat(0.012, 0.003, 0.0005), "#8a6c42", { mark: true, rough: 1 }, frameOn(p, n, new V3(0, 1, 0), 0.001)); }
  // the gathered neck: pleats, three wraps of twine and a bow, a frill above the tie, a rope loop
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, p = new V3(0.0355 * Math.sin(a) + 0.03 * 1.0 * 0.96, 0.272, 0.0355 * Math.cos(a)); K.add(flat(0.034, 0.003, 0.0005), "#a88a58", { mark: true, rough: 1 }, frameOn(p.clone().setX(0.0355 * Math.sin(a) + 0.0295), new V3(Math.sin(a), 0, Math.cos(a)), new V3(0, 1, 0), 0.0006)); }
  const nx = 0.03 * 0.96;   // the neck's x shift from the slump
  for (let w = 0; w < 3; w++) { const t = new THREE.TorusGeometry(0.0375, 0.0028, 6, 20); t.rotateX(Math.PI / 2); K.add(t, "#d9c08a", { rough: 0.9 }, M4([nx, 0.252 + w * 0.0075, 0], [0, w * 0.4, 0])); }
  for (const s of [-1, 1]) { const t = new THREE.TorusGeometry(0.012, 0.0025, 6, 14); K.add(t, "#d9c08a", { rough: 0.9 }, M4([nx + s * 0.013, 0.26, 0.042], [0, 0, s * 0.5])); K.add(cyl([nx, 0.26, 0.04], [nx + s * 0.02, 0.236, 0.05], 0.0022, 0.0022, 5), "#d9c08a", { rough: 0.9 }); }
  { const fr = new THREE.LatheGeometry([[0.034, 0.282], [0.052, 0.296], [0.048, 0.31], [0.026, 0.302], [0.034, 0.288]].map(([r, y]) => new THREE.Vector2(r, y)), 16); fr.translate(nx, 0, 0); K.add(fr, "#c9ad7d", { rough: 1 }); }
  { const pts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * TAU; pts.push(new V3(nx + 0.0295 * Math.cos(a) * 1.0, 0.327 + 0.035 * Math.sin(a), 0)); } K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 40, 0.0042, 5, true), "#d9c08a", { rough: 0.9 }); }
  K.flush(g);
  g.traverse((o) => { if (o.isMesh && o.material?.side === THREE.DoubleSide && !o.material.userData.noOutline) o.castShadow = true; });
  return { grip: 0.27, apply() {} };
}

// ---------------------------------------------------------------------------------------------------- dawnvalley
const bsm = (o) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const cv2 = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const place = (geo, m, order, p) => { const me = new THREE.Mesh(geo, m); me.renderOrder = order; me.frustumCulled = false; me.castShadow = false; me.receiveShadow = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (p) me.position.set(...p); return me; };
const dirOf = (azDeg, elDeg, dist) => new V3(Math.sin(azDeg * DEG) * Math.cos(elDeg * DEG), Math.sin(elDeg * DEG), -Math.cos(azDeg * DEG) * Math.cos(elDeg * DEG)).multiplyScalar(dist);   // az from -z toward +x
function cloudCanvas(seed, kind) {
  const c = cv2(512, 256), g = c.getContext("2d"), n = 7 + Math.floor(hash(seed, 1) * 4), blobs = [];
  for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, x = 40 + f * 432 + (hash(seed, i, 2) - 0.5) * 30, r = 34 + 40 * Math.sin(Math.PI * f) * (0.6 + 0.6 * hash(seed, i, 3)); blobs.push([x, 170 - r * 0.55 - 10 * hash(seed, i, 4), r]); }
  const paint = (col, dx, dy, k) => { g.fillStyle = col; for (const [x, y, r] of blobs) { g.beginPath(); g.ellipse(x + dx, y + dy, r * k, r * k * 0.82, 0, 0, TAU); g.fill(); } g.fillRect(40 + dx, 150 + dy - (k < 1 ? 14 : 0), 432, k < 1 ? 20 : 26); };
  const gold = kind === "gold";
  g.clearRect(0, 0, 512, 256);
  g.globalCompositeOperation = "source-over"; paint(gold ? "#ffe2a8" : "#ffd9a8", 0, 0, 1);   // the lit rim
  g.globalCompositeOperation = "source-atop"; paint(gold ? "#fdd48e" : "#f4b6a0", -6, -7, 1);
  paint(gold ? "#f8c680" : "#d9a9b6", -12, -14, 0.9);
  if (!gold) paint("#b9a6cf", -16, -30, 0.78);
  g.globalCompositeOperation = "destination-out"; const gr = g.createLinearGradient(0, 168, 0, 190); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, 168, 512, 90);
  g.globalCompositeOperation = "source-over";
  return c;
}
function sunCanvas() {
  const c = cv2(512, 512), g = c.getContext("2d"), C = 256;
  const gl = g.createRadialGradient(C, C, 0, C, C, C); gl.addColorStop(0, "rgba(255,200,100,1)"); gl.addColorStop(0.14, "rgba(255,196,96,0.75)"); gl.addColorStop(0.4, "rgba(255,190,100,0.3)"); gl.addColorStop(1, "rgba(255,190,100,0)"); g.fillStyle = gl; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,214,120,0.16)";
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + hash(i, 5) * 0.3, w = 0.06 + 0.07 * hash(i, 6), L = C * (0.6 + 0.4 * hash(i, 7)); g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a - w) * L, C + Math.sin(a - w) * L); g.lineTo(C + Math.cos(a + w) * L, C + Math.sin(a + w) * L); g.closePath(); g.fill(); }
  const R = C * 7.5 / 60, rim = g.createRadialGradient(C, C, R * 0.6, C, C, R * 1.08); rim.addColorStop(0, "#fff3c4"); rim.addColorStop(0.8, "#fff3c4"); rim.addColorStop(0.93, "#ffd76a"); rim.addColorStop(1, "rgba(255,215,106,0)");
  g.fillStyle = rim; g.beginPath(); g.arc(C, C, R * 1.08, 0, TAU); g.fill();
  return c;
}
// a ridge card: its own painting (two sines and noise, a fringe of tree bumps), fading into mist over the lowest quarter. Sizes in
// metres: the card is w x h, its crest wanders `relief` below the top (a notch of 7 m at notchX, 0..1 across), canvas px per metre = W / w
function ridgeCanvas(seed, W, Hh, w, relief, color, fringe, notchX) {
  const c = cv2(W, Hh), g = c.getContext("2d"), pts = [], pm = W / w;
  for (let x = 0; x <= W; x += 4) {
    const u = x / W, base = Math.sin(u * 9.1 + seed) * 0.5 + Math.sin(u * 23.7 + seed * 2.3) * 0.25 + (hash(Math.floor(x / 4), seed) - 0.5) * 0.12, notch = notchX != null ? 7 * Math.exp(-Math.pow((u - notchX) / 0.03, 2)) : 0;
    pts.push([x, (relief * (0.5 - 0.5 * base) + notch + 0.4) * pm]);
  }
  g.beginPath(); g.moveTo(0, Hh); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(W, Hh); g.closePath(); g.fillStyle = color; g.fill();
  if (fringe) { g.fillStyle = fringe; for (let x = 0; x < W; x += 6) { const [, y] = pts[Math.min(pts.length - 1, Math.floor(x / 4))], r = (0.5 + 1.1 * hash(x, seed, 9)) * pm; g.beginPath(); g.arc(x, y + 0.3 * pm, r, 0, TAU); g.fill(); } }
  g.globalCompositeOperation = "destination-out"; const gr = g.createLinearGradient(0, Hh * 0.75, 0, Hh); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, Hh * 0.75, W, Hh * 0.25);
  return c;
}
function mistCanvas(seed) {
  const c = cv2(2048, 512), g = c.getContext("2d"), n = 30 + Math.floor(hash(seed, 1) * 11);
  // the body under the lobes: top colour at the surface, the lilac underside below (a vertical gradient, opaque enough to hide the valley)
  const body = g.createLinearGradient(0, 140, 0, 512); body.addColorStop(0, "rgba(251,238,221,0.85)"); body.addColorStop(0.3, "rgba(227,207,224,0.85)"); body.addColorStop(1, "rgba(227,207,224,0.85)"); g.fillStyle = body; g.fillRect(0, 140, 2048, 372);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 2048 + (hash(seed, i, 2) - 0.5) * 120, rx = 80 + 120 * hash(seed, i, 3), ry = 36 + 50 * hash(seed, i, 4), y = 61 + ry, gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, "rgba(251,238,221,0.9)"); gr.addColorStop(0.6, "rgba(251,238,221,0.55)"); gr.addColorStop(1, "rgba(251,238,221,0)");
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  }
  return c;
}
function dawnvalley(P) {
  const G = P.whole, parts = [];
  // sky: the inside of a sphere r 250, unlit, pinned to the far plane, hides the set's own dome
  const U = { cz: { value: new THREE.Color("#9aa3dc") }, cm: { value: new THREE.Color("#f4b49c") }, ch: { value: new THREE.Color("#fde3a4") }, bz: { value: new THREE.Color("#8f9bd8") }, bm: { value: new THREE.Color("#c9b3dc") }, bh: { value: new THREE.Color("#f1cfc0") } };
  const sm = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: U,
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p.z = p.w * 0.99995; gl_Position = p; }",
    fragmentShader: ["uniform vec3 cz, cm, ch, bz, bm, bh; varying vec3 vD;", "void main(){ vec3 d = normalize(vD); float h = max(d.y, 0.0), w = smoothstep(0.35, -0.35, d.z);",
      "  vec3 a = mix(ch, cm, smoothstep(0.0, 0.5, h)); a = mix(a, cz, smoothstep(0.5, 0.95, h));", "  vec3 b = mix(bh, bm, smoothstep(0.0, 0.5, h)); b = mix(b, bz, smoothstep(0.5, 0.95, h));",
      "  gl_FragColor = vec4(mix(b, a, w), 1.0);", "  #include <colorspace_fragment>", "}"].join("\n"),
  });
  sm.userData.noOutline = true;
  G.add(place(new THREE.SphereGeometry(250, 64, 32), sm, -999));
  // nine cumulus, each painted once from its own seed (six lilac-pink, three small gold ones near the horizon)
  const CL = [[-24, 31, 220, 78], [-8, 22, 235, 90], [10, 36, 215, 64], [24, 18, 240, 70], [-27, 12, 245, 52], [5, 14, 236, 44], [-14, 9, 244, 34, "gold"], [14, 9.5, 246, 30, "gold"], [27, 11, 243, 28, "gold"]];
  const clouds = CL.map(([az, el, dist, w, kind], i) => {
    const m = bsm({ map: tex(cloudCanvas(i + 3, kind)), side: THREE.DoubleSide, opacity: kind === "gold" ? 0.9 : 0.97 }), me = place(new THREE.PlaneGeometry(w, w / 2), m, -990 + i * 0.01), p = dirOf(az, el, dist);
    me.position.copy(p); me.lookAt(0, 0, 0); G.add(me); return { me, p };
  });
  // the sun: glow + rays on one card, the disc inside it (r 7.5, glow r 60)
  { const m = bsm({ map: tex(sunCanvas()), opacity: 1 }), me = place(new THREE.PlaneGeometry(120, 120), m, -985, [30.7, 24.7, -233]); me.lookAt(0, 0, 0); G.add(me);
    const d = bsm({ map: tex((() => { const c = cv2(128, 128), g = c.getContext("2d"), q = g.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, "#fff3c4"); q.addColorStop(0.86, "#fff3c4"); q.addColorStop(0.94, "#ffd76a"); q.addColorStop(1, "rgba(255,215,106,0)"); g.fillStyle = q; g.fillRect(0, 0, 128, 128); return c; })()), opacity: 1 }), md = place(new THREE.PlaneGeometry(15.6, 15.6), d, -984, [30.7, 24.7, -233]); md.lookAt(0, 0, 0); G.add(md); }
  // three ridge cards, far to near, between the four mist bands
  const RIDGE = [[-230, 520, 22, "#8f86b8", null, 0.5 + 30.7 / 520, 9], [-170, 400, 9, "#7a76aa", null, null, 6], [-110, 280, 1.5, "#66709a", "#4f5d86", null, 3]];
  const mists = [], MZ = [-245, -200, -140, -90], MT = [19, 10, 3, -1.5];
  const order = [["mist", 0], ["ridge", 0], ["mist", 1], ["ridge", 1], ["mist", 2], ["ridge", 2], ["mist", 3]];
  order.forEach(([kind, i], o) => {
    if (kind === "ridge") {
      const [z, w, top, col, fr, notch, relief] = RIDGE[i], h = top + 60, px = 2048, py = Math.round(px * h / w);
      G.add(place(new THREE.PlaneGeometry(w, h), bsm({ map: tex(ridgeCanvas(i + 11, px, py, w, relief, col, fr, notch)), opacity: 1 }), -980 + o, [0, top - h / 2, z]));
    } else {
      // a mist band: soft lobes whose tops stand 10 m under the card's top (canvas 12 %), the card reaches 60 m under the band's top
      const w = 640, h = 72, me = place(new THREE.PlaneGeometry(w, h), bsm({ map: tex(mistCanvas(i + 21)), opacity: 0.85 }), -980 + o, [0, MT[i] + 12 - h / 2, MZ[i]]); G.add(me); mists.push({ me, i });
    }
  });
  return {
    grip: 0,
    apply(ps, t = 0) {
      for (const c of clouds) c.me.position.set(c.p.x + 0.4 * t, c.p.y, c.p.z);
      for (const { me, i } of mists) me.position.x = (6 + 3 * i) * Math.sin(TAU * t / (40 + 7 * i));
    },
  };
}

export const BALLOON_KINDS = { balloon, sandbag, dawnvalley };
