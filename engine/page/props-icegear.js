import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, rng } from "./util.js";
import { mat } from "./props-trend.js";
import { clothMat, inkMesh } from "./costumes-art.js";
import { texOf, wash, hash2 } from "./costumes-art-cast.js";

// Ice-fishing gear (friends try to 12, "the frozen lake"): the heavy fishing gear that pours out of Chip's hoodie, the heap it
// makes and the lumpy hoodie that gives it away. Design: storyboards/series/friends-try-to/12-frozen-lake/DESIGN-frozen-lake.md
// sections 5-7 (conventions: ref/DESIGN-buffet-from-10.md section 1). Own file (props3d.js merges ICEGEAR_KINDS and ICEGEAR_GRIPS
// on their own line). Metres, y up, front +z. No lettering. Every scatter is hashed from spec.seed or an index (no Math.random, no
// clock, nothing kept between frames but meshes keyed on exact inputs). Toon look: each item is a few merged flat-colour meshes with
// the standard ink outline; marks under 0.008 m (scuffs, holes, line, rust, glints) are flat strokes lying on the surface with
// noOutline, so they never turn into black dots. No round tan lump (cast skin is #e2a95c) and no yellow item anywhere: the colours are
// lead grey, steel, olive, red, blue, iron, cream rope and orange line; the hoodie lumps are the hoodie's own yellow cloth.
// Nothing is held by a hand (ICEGEAR_GRIPS is empty): the reel falls out of the hem and everything is dropped (c.drop), so no grip.
//
// LOOSE ITEMS (six kinds, each ONE rigid body: spec.body, ready-made in GEAR[kind].body, e.g.
//   { id: "g1", kind: "sinker", x, y: 0.5, z, in: 0, body: GEAR.sinker.body }; then `in` 1 at or before c.drop(t, "g1")).
//   Origin: bottom centre in the resting pose built here, long axis along x. spec.seed varies the hand-drawn marks (and a sinker's
//   shape). Every loose item has the key `in` 0..1 (spec.in, default 1; 0 hides it, over 0.01 shows it): park an item with `in: 0`
//   and set `in: 1` AT OR BEFORE its c.drop time (the physics bake takes the shape from the pose AT that time). Bodies are the hull of
//   the meshes. Sizes are as built (x y z, metres); the rest pose after a drop is whatever the physics settles into.
//   sinker     0.07 x 0.044 x 0.044: lead pear on its side (r 0.022), brass eye at the thin end (-x). spec.shape "pear" (default by
//              seed) | "ball" (r 0.016, a dark slot) | "coin" (r 0.024 x 0.009, a hole; lies flat). Body density 6000, bounce 0.03, friction 0.6.
//   fishreel   0.10 x 0.085 x 0.068: a spinning reel standing on its foot bar: drum with green line between two steel plates (five dark
//              holes each), crank arm and black knob on +x and the +z side. Body density 1500, bounce 0.08, friction 0.5.
//   tacklebox  0.20 x 0.11 x 0.12: olive box, lid groove at 62 % height, two steel latches on +z, folded handle on top. Never opens.
//              Body shape "box", density 700, bounce 0.03, friction 0.8.
//   baittin    0.11 x 0.038 x 0.11: red lid with a cream ring (no letters) and a steel ring-pull, dark rim, steel base; lies flat (axis y), lands, rolls on its
//              edge and spins down. Body density 1200, bounce 0.06, friction 0.5.
//   iceauger   0.52 x 0.10 x 0.16: blue spiral flight (r 0.05, 3.5 turns) on a dark shaft, two steel blades at the tip (-x), brown T
//              handle (+x, along z). Lies on its side. Body density 2500, bounce 0.05, friction 0.7. It may bite and stand, then fall.
//   anchor     0.19 wide x 0.24 high x 0.12 deep, built STANDING in the xy plane (ring on top, flukes up, stock along z); a drop
//              lets it fall over onto its arms and stock. Iron with lit edges, rust, a cream rope stub on the ring. Body density
//              7000, bounce 0, friction 0.9: one dead thud, no second bounce.
// GEAR (export): { <kind>: { w, h, d, body } }, the real sizes and the body defaults of every loose kind.
// ICEGEAR_BUILD (export, for benches): { <kind>: (seed, spec) -> Group } of the six kinds and the heap-only ropecoil, linespool, chain, bucket.
//
// gearheap       the gear dump beside Chip (origin: floor centre G). spec.r 0.45, spec.h 0.42, spec.seed 7, spec.u [0.8, 0.6] (the toe
//                direction: from Chip to G, in x z), spec.itemScale 1 (the size of the 44 heap items), spec.pivot [[-0.01, 1.18], [1.07,
//                -0.26]] (the slab's pivot line, world x z), spec.tipDeg 18, spec.strays (below). Keys (spec.<key> is the default; keys that
//                propState does not know (jolt, slab, slide) need a dur-0 set at t 0 to tween):
//                `fill` 0..1 (default 1: the mound grows as a pour does and 5 or 6 items are in the air while it moves, so hold `fill`
//                only at 0 or 1; core hidden below 0.08), `jolt` 0..1 (default 0: tween 0 -> 1 once, every item hops 0.015 x its height / h,
//                for the anchor's landing), `slab` 0..1 (default 0: the whole heap turns about the pivot line by tipDeg x slab, the +u side
//                down: the SAME tween as lakeice's slab), `slide` 0..1 (default 0: the dump, see below).
//                Shape at fill 1: peak 0.05 off centre toward Chip (-u), a shoulder 0.28 high 0.16 toward (0.61, 1.65), toe 0.45 along u,
//                0.38 at the sides, 0.30 on Chip's side. 44 items at fill 1 (plus 14 extra, see spec.extra): sinker 16, fishreel 8, baittin 5, tacklebox 3, ropecoil 4
//                (R 0.07, 3 turns), linespool 6 (r 0.025 x 0.03, orange line), chain 2 (8 links); no auger, no anchor (the film has one of
//                each, the loose ones). spec.extra (default 14) adds sinkers, reels, rope coils and spools on the slope: 44 items left bare core,
//                so the default is 58 (extra 0 gives the design's 44). Heap items are drawn larger than the loose ones (sinker x 1.9, reel
//                1.4, rope 1.25, spool and chain 1.6, tin 1.05, box 1.05) so they hide the core: spec.itemScale multiplies that. The core (lumpy iron-grey dome 20 % inside the shape, painted with 10 metal ovals, `noHatch`) is what
//                loose things land on. For the physics bake the heap also carries an INVISIBLE full-size copy of the core (colorWrite and
//                depthWrite off), so it is solid at full size from frame 0 whatever `fill` is: aim loose items outside its 0.45 radius,
//                only the anchor lands on it (on its peak, with `jolt`). The heap items are meshes too (the bake reads the visible ones).
//                `slide`: items go down the slope along u, lowest first, item of rank k in the window [0.55 k / N, 0.55 k / N + 0.45],
//                accelerating, turning up to 120 degrees; once under world y -0.02 it sinks 0.3 more (+ its own height) and is hidden;
//                a foam ring r 0.06-0.15 marks each entry (y -0.02). The core shrinks with what is left; at 1 nothing is left.
//                spec.strays [[kind, x, y, z, rotY, seed(, rotX, rotZ)], ...] up to 16 (kind: any of the six, sinker, fishreel, tacklebox,
//                baittin or "bucket" (a plain galvanised pail); WORLD x y z of the origin, rotY degrees): the loose bodies' rest poses from the
//                layout. Drawn only while slide > 0 (they turn with the slab), slide after the heap, the anchor last at 0.7 x speed (its
//                window starts earlier and is longer, its ring and stock go under last). The director hides the loose bodies that frame.
//
// hoodiegear     the gear under Chip's hoodie. WORN (never solid): spec.wear "chip", x y z 0 (built in his body frame, origin his feet, like
//                `satchel`). Key `fill` 0..1 (spec.fill, default 1). Body ellipsoid: centre y 0.405, half sizes 0.285 x 0.265 x 0.26, taper
//                0.02 (those are Chip's numbers and the defaults; spec.fit { rx, ry, rz, cy, taper } overrides). spec.color the hoodie
//                yellow (default #ffcf2e). A lumpy patch of the same fleece cloth over his belly (azimuth -105..+105, elevation -22..-72,
//                tucked under the hem band, 0.015 off the skin on its border so no edge shows), the pocket stitch redrawn over it, a
//                fold-ink crescent on the rim of each lump, three pull lines from the fluke's point, and the reel's crank arm under the hem
//                (az +40, shown while fill > 0.86, slid 0.03 down below 0.9: the first loose fishreel drops from there). Lumps (az, el,
//                flattens over fill): anchor fluke (-20, -36; a hooked ridge ending in one sharp point; slides to el -58 over 0.30 -> 0.14,
//                gone 0.14 -> 0.03: LAST), tackle box corner (+30, -38; 0.62 -> 0.48), auger handle (+14..+52, -27; 0.44 -> 0.30), reel (-50,
//                -46; 0.90 -> 0.80), sinkers (+60, -52; 0.98 -> 0.88: first). Hidden below fill 0.02. Keep Chip's squash under 5 % while fill > 0.

const V3 = THREE.Vector3, DEG = Math.PI / 180;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const M4 = (p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => new THREE.Matrix4().compose(new V3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "YXZ")), new V3(...s));
const dirAE = (az, el) => new V3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));

export const ICEGEAR_GRIPS = {};

// ---------------------------------------------------------------------------------------------------- kit: merged flat-colour meshes
// add(geo, color, opts, matrix): opts { rough, metal, mark (a flat stroke: noOutline, drawn over the surface), double (both sides) }
function kit() {
  const bins = new Map();
  return {
    add(geo, color, o = {}, M = null) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (M) g.applyMatrix4(M);
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const key = [color, o.rough ?? 0.7, o.metal ?? 0, o.mark ? 1 : 0, o.double ? 1 : 0].join("|");
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
        } else m = mat(color, { roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, ...(o.double && { side: THREE.DoubleSide }) });
        const mesh = new THREE.Mesh(merged, m); mesh.castShadow = !o.mark; mesh.receiveShadow = true; parent.add(mesh);
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
// a ribbon following fn(u) -> { p, n } for u 0..1, half width wf(u), lifted along the normal
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
const sphereG = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
const cylZ = (r, len, seg = 20) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); return g; };   // axis along z
const cylX = (r, len, seg = 20) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); return g; };   // axis along x
const torus = (R, t, seg = 12, tub = 6) => new THREE.TorusGeometry(R, t, tub, seg);
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, r);
// a rope (alternating two cream strands) along a list of points, tube radius r, n pieces
function rope(K, pts, r, n, c0 = "#d8d2c0", c1 = "#b4ab93") {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), seg = [];
  for (let i = 0; i < n; i++) seg.push(curve.getPoints(40).slice(Math.floor((i / n) * 40), Math.min(41, Math.ceil(((i + 1) / n) * 40) + 1)));
  seg.forEach((p, i) => { if (p.length < 2) return; K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 6, r, 8, false), i % 2 ? c1 : c0, { rough: 0.9 }); });
  K.add(sphereG(r, 8, 6), "#d8d2c0", { rough: 0.9 }, M4(pts[0].toArray())); K.add(sphereG(r, 8, 6), n % 2 ? "#b4ab93" : "#d8d2c0", { rough: 0.9 }, M4(pts[pts.length - 1].toArray()));
}
// a lathe profile [[r, y], ...] -> its radius at y
const radAt = (prof, y) => { for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0) / Math.max(1e-9, y1 - y0)); } return prof[prof.length - 1][0]; };
// a lathe in three tones: top, sides and underside, with the axis turned from y to x (the top ends up facing +y)
const TOPS = [["#b4bbc5", -Math.PI / 2 - 0.8, 1.6], ["#8b929c", -Math.PI / 2 + 0.8, 1.54], ["#5c626c", Math.PI / 2 - 0.8, 1.6], ["#8b929c", Math.PI / 2 + 0.8, 1.54]];
const ROTZ = new THREE.Matrix4().makeRotationZ(-Math.PI / 2);   // y -> +x, lathe radius sin(phi) -> -y

// ---------------------------------------------------------------------------------------------------- sinker (lead weight)
const PEAR = [[0.0015, 0.010], [0.0065, 0.014], [0.012, 0.024], [0.019, 0.042], [0.022, 0.054], [0.019, 0.064], [0.009, 0.0695], [0.001, 0.070]];
function sinker(seed = 1, S = {}) {
  const K = kit(), r = rng(2100 + seed * 17), g = new THREE.Group(), shape = S.shape ?? ["pear", "pear", "ball", "coin"][Math.floor(hash2(seed, 5) * 4) % 4];
  const eye = (M) => K.add(torus(0.0055, 0.0016, 14, 6), "#b9953f", { rough: 0.35, metal: 0.6 }, M);
  if (shape === "ball") {
    const R = 0.016, th = [["#b4bbc5", 0, 0.85], ["#8b929c", 0.85, 1.4], ["#5c626c", 2.25, Math.PI - 2.25]];
    for (const [c, a, l] of th) K.add(new THREE.SphereGeometry(R, 18, 8, 0, Math.PI * 2, a, l), c, { rough: 0.45, metal: 0.3 }, M4([0, R, 0]));
    // the casting slot: a dark groove over the top on the +z face, and the eye on top
    K.add(ribbon((u) => { const a = (-20 + 180 * u) * DEG; return { p: new V3(0, R + Math.sin(a) * R, Math.cos(a) * R), n: new V3(0, Math.sin(a), Math.cos(a)) }; }, 16, () => 0.0018, 0.0004), "#3d424a", { mark: true });
    eye(M4([0, 2 * R + 0.003, 0], [0, 0, 0]));
  } else if (shape === "coin") {
    const sh = new THREE.Shape(); sh.absarc(0, 0, 0.024, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 0.007, 0, Math.PI * 2, true); sh.holes.push(hole);
    const e = new THREE.ExtrudeGeometry(sh, { depth: 0.009, bevelEnabled: false, curveSegments: 20 }); e.rotateX(-Math.PI / 2);
    K.add(e, "#8b929c", { rough: 0.45, metal: 0.3 });
    const topRing = new THREE.RingGeometry(0.0085, 0.022, 28); topRing.rotateX(-Math.PI / 2); K.add(topRing, "#b4bbc5", { mark: true, rough: 0.4 }, M4([0, 0.0093, 0]));
    const inner = new THREE.RingGeometry(0.0072, 0.0092, 20); inner.rotateX(-Math.PI / 2); K.add(inner, "#3d424a", { mark: true }, M4([0, 0.0095, 0]));
    for (let i = 0; i < 2; i++) { const a = r() * 6.28, d = 0.013 + r() * 0.007; K.add(flat(0.007 + r() * 0.005, 0.0022, 0.0004), "#6a7079", { mark: true }, M4([Math.sin(a) * d, 0.0096, Math.cos(a) * d], [0, r() * 3, 0]).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2))); }
  } else {
    // the pear on its side: thin end (brass eye) at -x, fat end at +x
    const pts = PEAR.map(([rr, y]) => new THREE.Vector2(rr, y));
    for (const [c, a, l] of TOPS) K.add(new THREE.LatheGeometry(pts, 20, a, l), c, { rough: 0.45, metal: 0.3 }, ROTZ);
    eye(M4([0.0045, 0, 0]));
    // two scuffs on the sides, a glint stroke on top
    for (let i = 0; i < 2; i++) {
      const y = 0.026 + r() * 0.028, ph = (i ? 40 : 150) * DEG + r() * 0.6, rr = radAt(PEAR, y) + 0.0004, p = new V3(rr * Math.sin(ph), y, rr * Math.cos(ph)), n = new V3(Math.sin(ph), 0, Math.cos(ph));
      K.add(flat(0.008 + r() * 0.007, 0.0026, 0.0004), "#656b74", { mark: true }, frameAt(p, n, r() * 2.5, 0.0003).premultiply(ROTZ));
    }
    K.add(ribbon((u) => { const y = 0.030 + 0.026 * u, rr = radAt(PEAR, y), ph = -Math.PI / 2 + 0.28; return { p: new V3(rr * Math.sin(ph), y, rr * Math.cos(ph)), n: new V3(Math.sin(ph), 0, Math.cos(ph)) }; }, 8, taper(0.0022), 0.0004), "#e1e6ec", { mark: true, rough: 0.3 }, ROTZ);
  }
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- fishreel
function fishreel(seed = 1) {
  const K = kit(), r = rng(2200 + seed * 13), g = new THREE.Group(), CY = 0.0455, STEEL = "#8e98a3", HOLE = "#3a3f47", DRUM = "#3f8f5a";
  const steel = { rough: 0.35, metal: 0.45 };
  K.add(cylZ(0.036, 0.034, 24), DRUM, { rough: 0.8 }, M4([0, CY, 0]));
  for (const z of [-0.0215, 0.0215]) K.add(cylZ(0.04, 0.0044, 28), STEEL, steel, M4([0, CY, z]));
  // wound line: dark turns round the drum, uneven, and the drum's lit edge
  for (let i = 0; i < 7; i++) { const z = -0.0145 + 0.029 * ((i + r() * 0.5) / 7.2); K.add(torus(0.0363, 0.0009, 36, 4), "#2c6b44", { mark: true, rough: 0.8 }, M4([0, CY, z]));  }
  // five holes in each plate: dark discs on the outer faces
  for (const [z, s] of [[0.0239, 1], [-0.0239, -1]]) for (let i = 0; i < 5; i++) { const a = (i / 5) * 2 * Math.PI + (s > 0 ? 0.3 : 0.9); K.add(disc(0.0068, 0.0068, 12), HOLE, { mark: true }, M4([Math.sin(a) * 0.0235, CY + Math.cos(a) * 0.0235, z], [0, s > 0 ? 0 : Math.PI, 0])); }
  // a light edge on each plate's rim (a stroke 120 degrees long), the hub
  for (const [z, s] of [[0.0239, 1], [-0.0239, -1]]) K.add(ribbon((u) => { const a = (30 + 120 * u) * DEG; return { p: new V3(Math.sin(a) * 0.0372, CY + Math.cos(a) * 0.0372, z), n: new V3(0, 0, s) }; }, 12, taper(0.0016), 0.0003), "#dfe5ea", { mark: true, rough: 0.3 });
  // crank on the +z plate: hub, arm along +x, black knob; a bolt cap on the -z plate
  K.add(cylZ(0.0085, 0.006, 16), "#6c747e", steel, M4([0, CY, 0.0255]));
  K.add(rbox(0.0475, 0.0075, 0.0045, 0.0015), STEEL, steel, M4([0.0225, CY, 0.0277]));
  K.add(cylZ(0.012, 0.017, 16), "#23262b", { rough: 0.5 }, M4([0.045, CY, 0.0345]));
  K.add(cylZ(0.0075, 0.005, 12), "#6c747e", steel, M4([0, CY, -0.0262]));
  // the foot bar under the plates, its neck
  K.add(rbox(0.06, 0.0068, 0.016, 0.0025), "#6c747e", steel, M4([0, 0.0034, 0]));
  K.add(rbox(0.016, 0.007, 0.012, 0.002), "#6c747e", steel, M4([0, 0.0085, 0]));
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- tackle box
function tacklebox(seed = 1) {
  const K = kit(), r = rng(2300 + seed * 11), g = new THREE.Group(), W = 0.2, D = 0.116;
  K.add(rbox(W, 0.022, D, 0.0105), "#4f5f33", { rough: 0.75 }, M4([0, 0.011, 0]));                       // base band
  K.add(rbox(W - 0.0016, 0.0505, D - 0.0016, 0.0115), "#6b7f45", { rough: 0.7 }, M4([0, 0.0432, 0]));   // body
  K.add(rbox(W + 0.0008, 0.0046, D + 0.0008, 0.0023), "#3c4a28", { rough: 0.8 }, M4([0, 0.0682, 0]));      // the lid groove at 62 % height
  K.add(rbox(W, 0.0417, D, 0.012), "#7d9352", { rough: 0.7 }, M4([0, 0.0889, 0]));                    // lid (top 0.1097)
  // two steel latches on +z straddling the groove, a dark slot in each; a folded handle on top
  for (const sx of [-0.052, 0.052]) {
    K.add(rbox(0.018, 0.022, 0.0065, 0.0016), "#c5c9cc", { rough: 0.3, metal: 0.55 }, M4([sx, 0.0682, D / 2 - 0.0002]));
    K.add(flat(0.011, 0.0034, 0.0004), "#4a4f55", { mark: true }, M4([sx, 0.0682, D / 2 + 0.0031]));
  }
  K.add(rbox(0.09, 0.0065, 0.012, 0.0028), "#2e3524", { rough: 0.6 }, M4([0, 0.1097 - 0.0005, 0.0]));
  for (const sx of [-0.045, 0.045]) K.add(rbox(0.012, 0.0045, 0.02, 0.002), "#2e3524", { rough: 0.6 }, M4([sx, 0.1097 - 0.0005, 0.0]));
  // lit edge along the front of the lid and the body, one scuff on the lid, one on the end
  K.add(ribbon((u) => ({ p: new V3(-0.088 + 0.176 * u, 0.1097 + 0.0, D / 2 - 0.006), n: new V3(0, 1, 0) }), 8, taper(0.0022), 0.0004), "#a2b873", { mark: true, rough: 0.5 });
  K.add(flat(0.026, 0.004, 0.0004), "#3c4a28", { mark: true }, M4([0.045 + r() * 0.02, 0.1102, -0.02], [0, 0.4, 0]).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
  K.add(flat(0.015, 0.0035, 0.0004), "#3c4a28", { mark: true }, M4([W / 2 + 0.0004, 0.045, 0.02], [0, Math.PI / 2, 0]));
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- bait tin
function baittin(seed = 1) {
  const K = kit(), r = rng(2400 + seed * 7), g = new THREE.Group();
  K.add(new THREE.CylinderGeometry(0.0525, 0.052, 0.0215, 32), "#aab1b8", { rough: 0.35, metal: 0.45 }, M4([0, 0.01075, 0]));          // steel base
  K.add(new THREE.CylinderGeometry(0.0555, 0.0555, 0.0075, 32), "#8f1f1a", { rough: 0.5 }, M4([0, 0.0235, 0]));                       // the dark rim
  K.add(new THREE.CylinderGeometry(0.0525, 0.0525, 0.0125, 32), "#c8352b", { rough: 0.45 }, M4([0, 0.0288, 0]));                      // lid
  const ring = new THREE.RingGeometry(0.0285, 0.0345, 36); ring.rotateX(-Math.PI / 2); K.add(ring, "#f2e3c6", { mark: true, rough: 0.5 }, M4([0, 0.0352, 0]));
  // a ring-pull on the lid (flat steel ring and its tab), so it reads as a tin and not a button
  { const rp = new THREE.TorusGeometry(0.0095, 0.0019, 6, 18); rp.rotateX(-Math.PI / 2); K.add(rp, "#c5c9cc", { rough: 0.3, metal: 0.5 }, M4([0.0, 0.0368, 0.0])); const tab = new THREE.BoxGeometry(0.014, 0.0016, 0.012); K.add(tab, "#c5c9cc", { rough: 0.3, metal: 0.5 }, M4([0.0, 0.0356, 0.0])); }
  K.add(ribbon((u) => { const a = (200 + 70 * u) * DEG; return { p: new V3(Math.sin(a) * 0.046, 0.0352, Math.cos(a) * 0.046), n: new V3(0, 1, 0) }; }, 12, taper(0.0022), 0.0004), "#ee7468", { mark: true, rough: 0.3 });
  for (const y of [0.007, 0.0145]) K.add(new THREE.TorusGeometry(0.0521, 0.0012, 4, 36).rotateX(Math.PI / 2), "#8a9096", { mark: true }, M4([0, y, 0]));
  for (let i = 0; i < 2; i++) { const a = r() * 6.28; K.add(flat(0.01 + r() * 0.008, 0.003, 0.0004), "#7c828a", { mark: true }, frameAt(new V3(Math.sin(a) * 0.0524, 0.008 + r() * 0.008, Math.cos(a) * 0.0524), new V3(Math.sin(a), 0, Math.cos(a)), r() * 2, 0.0003)); }
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- ice auger (long axis x, tip at -x)
function iceauger(seed = 1) {
  const K = kit(), g = new THREE.Group(), X0 = -0.226, TURNS = 3.5, PITCH = 0.30 / TURNS, RIN = 0.009, ROUT = 0.05, TH = 0.0022, YC = 0;
  // the flight: a helicoid strip, thin solid (top face, underside, outer edge)
  const NU = Math.round(TURNS * 30), RAD = [RIN, 0.026, ROUT], surf = (dx) => {
    const pos = [], idx = [];
    for (let i = 0; i <= NU; i++) { const th = (i / NU) * TURNS * 2 * Math.PI; for (const rr of RAD) pos.push(X0 + (PITCH * th) / (2 * Math.PI) + dx, YC + rr * Math.cos(th), rr * Math.sin(th)); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < RAD.length - 1; j++) { const a = i * RAD.length + j, b = a + 1, c = a + RAD.length, d = c + 1; idx.push(a, c, b, b, c, d); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals(); return gg;
  };
  K.add(surf(TH), "#3f7fd0", { rough: 0.45, double: true });
  K.add(surf(-TH), "#2a5aa0", { rough: 0.5, double: true });
  { const pos = [], idx = []; for (let i = 0; i <= NU; i++) { const th = (i / NU) * TURNS * 2 * Math.PI, x = X0 + (PITCH * th) / (2 * Math.PI); for (const dx of [-TH, TH]) pos.push(x + dx, YC + ROUT * Math.cos(th), ROUT * Math.sin(th)); }
    for (let i = 0; i < NU; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); eg.setIndex(idx); eg.computeVertexNormals(); K.add(eg, "#7fb0ec", { rough: 0.4, double: true }); }
  // shaft, pilot point, two blades at the tip, the T handle
  K.add(cylX(0.009, 0.49, 14), "#3b4048", { rough: 0.5, metal: 0.4 }, M4([-0.004, YC, 0]));
  K.add(new THREE.ConeGeometry(0.0095, 0.028, 12).rotateZ(Math.PI / 2), "#cfd6dd", { rough: 0.3, metal: 0.5 }, M4([-0.254, YC, 0]));
  for (const s of [-1, 1]) K.add(new THREE.BoxGeometry(0.022, 0.0028, 0.042), "#cfd6dd", { rough: 0.3, metal: 0.5 }, M4([-0.236, YC, s * 0.03], [s * 0.45, 0, 0]));
  K.add(cylZ(0.012, 0.136, 14), "#7a4a22", { rough: 0.75 }, M4([0.246, YC, 0]));
  for (const s of [-1, 1]) K.add(sphereG(0.012, 12, 8), "#7a4a22", { rough: 0.75 }, M4([0.246, YC, s * 0.068]));
  K.add(cylX(0.0125, 0.026, 14), "#4a4f58", { rough: 0.5, metal: 0.4 }, M4([0.232, YC, 0]));
  // a light highlight along the handle, a lit edge on the flight's first turns
  K.add(ribbon((u) => ({ p: new V3(0.246 - 0.0085, YC + 0.0105, -0.06 + 0.12 * u), n: new V3(0, 1, 0) }), 8, taper(0.0022), 0.0004), "#b07a44", { mark: true, rough: 0.5 });
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- anchor (standing in the xy plane)
function anchor(seed = 1) {
  const K = kit(), r = rng(2500 + seed * 9), g = new THREE.Group(), IRON = "#2b2f36", LIT = "#5a626e", iron = { rough: 0.6, metal: 0.35 };
  // shank, crown, ring, stock
  K.add(new THREE.CylinderGeometry(0.0085, 0.0105, 0.19, 14), IRON, iron, M4([0, 0.103, 0]));
  K.add(sphereG(0.0135, 14, 10), IRON, iron, M4([0, 0.0145, 0]));
  K.add(torus(0.022, 0.0058, 22, 8), IRON, iron, M4([0, 0.2125, 0]));
  K.add(cylZ(0.0075, 0.1, 12), IRON, iron, M4([0, 0.171, 0]));
  for (const s of [-1, 1]) K.add(sphereG(0.0102, 10, 8), IRON, iron, M4([0, 0.171, s * 0.05]));
  // the two arms (curved tubes) and their flukes (a spade each, 0.05 wide, 0.04 long)
  const arm = [[0, 0.016], [0.028, 0.0105], [0.055, 0.022], [0.072, 0.050], [0.0805, 0.060]];
  for (const s of [-1, 1]) {
    const pts = arm.map(([x, y]) => new V3(s * x, y, 0)), curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), a = curve.getPoints(30);
    K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a.slice(0, 16)), 14, 0.0105, 10, false), IRON, iron);
    K.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a.slice(15)), 14, 0.0085, 10, false), IRON, iron);
    const T = new V3(s * 0.3, 0.95, 0).normalize(), Zw = new V3(0, 0, 1), N = T.clone().cross(Zw), tip = pts[pts.length - 1];
    const sh = new THREE.Shape(); sh.moveTo(-0.004, -0.012); sh.lineTo(0.012, -0.025); sh.lineTo(0.030, -0.017); sh.lineTo(0.0405, 0); sh.lineTo(0.030, 0.017); sh.lineTo(0.012, 0.025); sh.lineTo(-0.004, 0.012); sh.closePath();
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false }); fg.translate(0, 0, -0.004);
    K.add(fg, IRON, iron, new THREE.Matrix4().makeBasis(T, Zw, N).setPosition(tip.clone().addScaledVector(T, -0.002)));
    // lit edge on the +z face of the arm, a lit stroke on each fluke
    K.add(ribbon((u) => { const q = curve.getPoint(u * 0.92); return { p: new V3(q.x, q.y + 0.003, 0.0102), n: new V3(0, 0, 1) }; }, 14, () => 0.0022, 0.0006), LIT, { mark: true, rough: 0.5 });
    K.add(flat(0.024, 0.004, 0.0004), LIT, { mark: true }, new THREE.Matrix4().makeBasis(T, Zw, N).setPosition(tip.clone().addScaledVector(T, 0.02).addScaledVector(N, 0.0046)));
  }
  K.add(ribbon((u) => ({ p: new V3(0.0, 0.02 + 0.17 * u, 0), n: new V3(0, 0, 1) }), 10, () => 0.0023, 0.0).applyMatrix4(M4([0.0, 0, 0.0099])), LIT, { mark: true, rough: 0.5 });
  K.add(ribbon((u) => ({ p: new V3(0, 0.171, -0.046 + 0.092 * u), n: new V3(0, 1, 0) }), 8, () => 0.0018, 0.0075), LIT, { mark: true, rough: 0.5 });
  // three rust strokes
  for (let i = 0; i < 3; i++) { const y = 0.05 + r() * 0.12; K.add(flat(0.016 + r() * 0.014, 0.0035, 0.0004), "#6b3f2a", { mark: true }, M4([(r() - 0.5) * 0.004, y, 0.0107], [0, 0, 1.4 + r() * 0.3])); }
  // the rope stub: knotted on the ring, a tail hanging out and down, 0.12 long
  rope(K, [new V3(0.0, 0.2345, 0), new V3(0.026, 0.2385, 0.004), new V3(0.056, 0.222, 0.008), new V3(0.074, 0.19, 0.006), new V3(0.078, 0.158, 0.002)], 0.0058, 8);
  K.add(sphereG(0.0105, 10, 8), "#d8d2c0", { rough: 0.9 }, M4([0.0, 0.2335, 0]));
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- heap-only: ropecoil, linespool, chain; stray-only: bucket
function ropecoil(seed = 1) {
  const K = kit(), r = rng(2600 + seed * 5), g = new THREE.Group(), pts = [];
  const N = 96, a0 = r() * 6.28; for (let i = 0; i <= N; i++) { const t = (i / N) * 3, a = a0 + t * 2 * Math.PI, rr = 0.0605 - 0.0125 * t; pts.push(new V3(Math.sin(a) * rr, 0.0095 + 0.0035 * t, Math.cos(a) * rr)); }
  const tail = pts[0].clone(), dir = tail.clone().setY(0).normalize(); for (let i = 1; i <= 4; i++) pts.unshift(tail.clone().addScaledVector(dir, 0.012 * i).add(new V3(0, 0.0, 0)).addScaledVector(new V3(-dir.z, 0, dir.x), 0.004 * i * (i % 2 ? 1 : 0.6)));
  rope(K, pts, 0.0095, 30);
  return settle(K.flush(g));
}
function linespool(seed = 1) {
  const K = kit(), r = rng(2700 + seed * 3), g = new THREE.Group();
  K.add(new THREE.CylinderGeometry(0.0205, 0.0205, 0.024, 20), "#e8742c", { rough: 0.8 }, M4([0, 0.015, 0]));
  for (const y of [0.0015, 0.0285]) K.add(new THREE.CylinderGeometry(0.0252, 0.0252, 0.003, 22), "#8e98a3", { rough: 0.35, metal: 0.45 }, M4([0, y, 0]));
  for (let i = 0; i < 6; i++) K.add(new THREE.TorusGeometry(0.0207, 0.0007, 4, 24).rotateX(Math.PI / 2), "#bd5a1c", { mark: true, rough: 0.8 }, M4([0, 0.005 + 0.0045 * i + r() * 0.0015, 0]));
  K.add(ribbon((u) => { const a = (-20 + 70 * u) * DEG; return { p: new V3(Math.sin(a) * 0.0208, 0.0285 - 0.0105 * u, Math.cos(a) * 0.0208), n: new V3(Math.sin(a), 0, Math.cos(a)) }; }, 8, taper(0.0016), 0.0003), "#f7a86c", { mark: true, rough: 0.5 });
  return settle(K.flush(g));
}
function chain(seed = 1) {
  const K = kit(), r = rng(2800 + seed * 7), g = new THREE.Group(), C = "#5a626e";
  for (let i = 0; i < 8; i++) {
    const x = (i - 3.5) * 0.0215, z = 0.018 * Math.sin((i / 7) * Math.PI * 1.3 + seed), tg = 0.018 * Math.cos((i / 7) * Math.PI * 1.3 + seed) * (1.3 * Math.PI / 7) / 0.0215;
    const link = new THREE.TorusGeometry(0.0075, 0.0029, 6, 14); link.scale(1.6, 1, 1);
    const flatLink = i % 2 === 0; const yaw = Math.atan(tg);
    K.add(link, C, { rough: 0.5, metal: 0.4 }, M4([x, flatLink ? 0.0029 : 0.0107, z], [flatLink ? Math.PI / 2 : 0, -yaw, 0]));
    K.add(flat(0.011, 0.0024, 0.0004), "#9aa4b1", { mark: true }, M4([x, flatLink ? 0.0059 : 0.0187, z], [0, -yaw, 0]).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
  }
  void r;
  return settle(K.flush(g));
}
function bucket(seed = 1) {
  const K = kit(), r = rng(2900 + seed * 3), g = new THREE.Group(), prof = [[0.001, 0], [0.085, 0], [0.0935, 0.07], [0.1015, 0.14], [0.108, 0.186], [0.11, 0.19]].map(([x, y]) => new THREE.Vector2(x, y));
  K.add(new THREE.LatheGeometry(prof, 28), "#aeb7c0", { rough: 0.35, metal: 0.45 });
  K.add(new THREE.TorusGeometry(0.1095, 0.0032, 6, 28).rotateX(Math.PI / 2), "#d3dae1", { rough: 0.3, metal: 0.5 }, M4([0, 0.1885, 0]));
  const inside = new THREE.CircleGeometry(0.106, 24); inside.rotateX(-Math.PI / 2); K.add(inside, "#3b4048", { rough: 0.7 }, M4([0, 0.16, 0]));
  for (const y of [0.06, 0.12]) K.add(new THREE.TorusGeometry(radAt([[0.085, 0], [0.0935, 0.07], [0.1015, 0.14], [0.108, 0.19]], y) + 0.0006, 0.0018, 4, 28).rotateX(Math.PI / 2), "#8f99a3", { mark: true }, M4([0, y, 0]));
  const bail = new THREE.TorusGeometry(0.1, 0.0022, 6, 26, Math.PI); K.add(bail, "#d3dae1", { rough: 0.4, metal: 0.5 }, M4([0, 0.19, 0], [Math.PI / 2 - 0.2, 0, 0]));
  for (let i = 0; i < 3; i++) { const a = r() * 6.28; K.add(flat(0.016 + r() * 0.01, 0.006, 0.0004), "#7e8892", { mark: true }, frameAt(new V3(Math.sin(a) * 0.098, 0.05 + r() * 0.09, Math.cos(a) * 0.098), new V3(Math.sin(a), 0, Math.cos(a)), r() * 2, 0.0003)); }
  return settle(K.flush(g));
}

// ---------------------------------------------------------------------------------------------------- registries
export const ICEGEAR_BUILD = { sinker, fishreel, tacklebox, baittin, iceauger, anchor, ropecoil, linespool, chain, bucket };
const BODY = {
  sinker: { density: 6000, bounce: 0.03, friction: 0.6 }, fishreel: { density: 1500, bounce: 0.08, friction: 0.5 }, tacklebox: { shape: "box", density: 700, bounce: 0.03, friction: 0.8 },
  baittin: { density: 1200, bounce: 0.06, friction: 0.5 }, iceauger: { density: 2500, bounce: 0.05, friction: 0.7 }, anchor: { density: 7000, bounce: 0, friction: 0.9 },
};
// real sizes (x, y, z) as built (measured from the meshes); the body defaults are the design's
export const GEAR = {
  sinker: { w: 0.07, h: 0.044, d: 0.044 }, fishreel: { w: 0.1, h: 0.085, d: 0.068 }, tacklebox: { w: 0.2, h: 0.11, d: 0.12 }, baittin: { w: 0.111, h: 0.038, d: 0.111 },
  iceauger: { w: 0.52, h: 0.1, d: 0.16 }, anchor: { w: 0.19, h: 0.24, d: 0.12 },
};
for (const k of Object.keys(BODY)) GEAR[k].body = BODY[k];

const loose = (kind) => (P) => {
  const S = P.spec, g = ICEGEAR_BUILD[kind](S.seed ?? 1, S);
  P.whole.add(g);
  return { grip: GEAR[kind].h / 2, apply(ps) { g.visible = (ps.in ?? S.in ?? 1) > 0.01; } };
};


// ---------------------------------------------------------------------------------------------------- gearheap
// local frame of the heap: x = across (b), z = along the toe (u, away from Chip); the whole is turned about y so that +z is spec.u
function heapShape(k, hk) {
  const Rd = (az) => { const q = Math.cos(az); return 0.45 * k * (q > 0 ? 0.844 + 0.156 * q : 0.844 + 0.178 * q); };   // toe 0.45, sides 0.38, Chip's side 0.30
  const H = (x, z) => {
    const rr = Math.hypot(x, z), rho0 = rr / Rd(Math.atan2(x, z)); if (rho0 >= 1) return 0;
    const qz = z + 0.05 * k * (1 - rho0 * rho0), rho = Math.min(1, Math.hypot(x, qz) / Rd(Math.atan2(x, qz)));   // the peak 0.05 off centre toward Chip (-z)
    const a = 0.42 * hk * (1 - Math.pow(rho, 1.7)), rb = Math.min(1, Math.hypot(x + 0.14 * k, z - 0.077 * k) / (0.28 * k)), b = 0.28 * hk * (1 - Math.pow(rb, 1.7));   // the shoulder, 0.16 toward K6
    return Math.pow(a ** 4 + b ** 4, 0.25) * smooth(1, 0.93, rho0);
  };
  return { Rd, H };
}
const COREK = 0.74, COREF = 0.8, WATER = -0.02;
// heap items are drawn larger than the loose ones (44 small things must hide the core): x spec.itemScale
const HEAPSCALE = { sinker: 1.9, fishreel: 1.4, baittin: 1.05, tacklebox: 1.05, ropecoil: 1.25, linespool: 1.6, chain: 1.6 };
const ITEM_H = { sinker: 0.035, fishreel: 0.085, baittin: 0.035, tacklebox: 0.11, ropecoil: 0.03, linespool: 0.03, chain: 0.02, iceauger: 0.1, anchor: 0.24, bucket: 0.19 };
const GREY = new Set(["sinker", "chain"]);
// a built item lying on its +z side (a reel on a plate: the crank faces up)
const lieOn = (g) => { const w = new THREE.Group(); w.add(g); w.rotation.x = -Math.PI / 2; return settle(w); };
const upAxis = new V3(0, 1, 0);

function heap(P) {
  const S = P.spec, R0 = S.r ?? 0.45, H0 = S.h ?? 0.42, k = R0 / 0.45, hk = H0 / 0.42, seed = S.seed ?? 7, IS = S.itemScale ?? 1, r = rng(seed * 977 + 13), { Rd, H } = heapShape(k, hk);
  const U = S.u ?? [0.8, 0.6], psi = Math.atan2(U[0], U[1]), TIP = (S.tipDeg ?? 18) * DEG, PIV = S.pivot ?? [[-0.01, 1.18], [1.07, -0.26]];
  const core = (x, z) => COREK * H(x / COREF, z / COREF) * (1 + 0.04 * Math.sin(x * 37 + seed) * Math.cos(z * 29 - seed * 0.7));
  const tiltG = new THREE.Group(); tiltG.matrixAutoUpdate = false; P.whole.add(tiltG);
  const hg = new THREE.Group(); hg.rotation.y = psi; tiltG.add(hg);
  // --- the core: a lumpy dome, a heightfield on polar rings, painted with ten overlapping metal ovals
  const NA = 56, NR = 16, cpos = [], cidx = [], cg = new THREE.Group(), K = kit();
  for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) { const a = (i / NA) * 2 * Math.PI, rho = j / NR, rr = rho * COREF * Rd(a), x = Math.sin(a) * rr, z = Math.cos(a) * rr; cpos.push(x, core(x, z), z); }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA, c = a + NA, d = b + NA; cidx.push(a, c, b, b, c, d); }
  const coreGeo = new THREE.BufferGeometry(); coreGeo.setAttribute("position", new THREE.Float32BufferAttribute(cpos, 3)); coreGeo.setIndex(cidx); coreGeo.computeVertexNormals();
  const coreMat = mat("#2b313c", { roughness: 0.8, metalness: 0.15, side: THREE.DoubleSide }); coreMat.userData.noHatch = true;
  const coreMesh = new THREE.Mesh(coreGeo, coreMat); coreMesh.castShadow = coreMesh.receiveShadow = true; cg.add(coreMesh);
  // ten big ovals of dark metal, then 36 smaller ones and 14 thin strokes of line, rope and paint: no bare patch of core over 0.05 m
  const PAL = ["#262c36", "#333b48", "#3a4350", "#2f3642", "#454e5c"], STROKE = ["#8e98a3", "#2f6d49", "#a9531f", "#9aa0a6", "#5a626e", "#8f2a22", "#2f6d49"];
  for (let i = 0; i < 60; i++) {
    const big = i < 10, thin = i >= 46, a = r() * 6.283, rho = 0.05 + r() * 0.8, cx = Math.sin(a) * rho * R0 * 0.8, cz = Math.cos(a) * rho * R0 * 0.8;
    const rx = (big ? 0.04 + r() * 0.05 : thin ? 0.035 + r() * 0.03 : 0.018 + r() * 0.025) * k, rz = (big ? 0.03 + r() * 0.04 : thin ? 0.004 + r() * 0.003 : 0.012 + r() * 0.018) * k, rot = r() * 3;
    const col = thin ? STROKE[i % STROKE.length] : big ? (i % 2 ? "#3a4350" : "#222833") : PAL[i % PAL.length], lift = 0.0015 + i * 0.00025;
    const ptOn = (u, v, lf) => { const x = cx + Math.cos(rot) * u - Math.sin(rot) * v, z = cz + Math.sin(rot) * u + Math.cos(rot) * v; return [x, core(x, z) + lf, z]; };
    const pp = [...ptOn(0, 0, lift)], pi = [], RN = 3, SG = 14;
    for (let q = 1; q <= RN; q++) for (let s2 = 0; s2 < SG; s2++) { const t = (s2 / SG) * 2 * Math.PI, e = q / RN; pp.push(...ptOn(Math.cos(t) * rx * e, Math.sin(t) * rz * e, lift)); }
    for (let s2 = 0; s2 < SG; s2++) pi.push(0, 1 + s2, 1 + (s2 + 1) % SG);
    for (let q = 1; q < RN; q++) for (let s2 = 0; s2 < SG; s2++) { const a0 = 1 + (q - 1) * SG + s2, b0 = 1 + (q - 1) * SG + (s2 + 1) % SG, c0 = a0 + SG, d0 = b0 + SG; pi.push(a0, c0, b0, b0, c0, d0); }
    const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); og.setIndex(pi); og.computeVertexNormals(); K.add(og, col, { mark: true, rough: 0.6, metal: thin ? 0 : 0.2 });
  }
  K.flush(cg); hg.add(cg);
  // the invisible full-size copy of the core: solid for the physics bake whatever `fill` is then
  const proxy = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); proxy.material.userData.noOutline = true; proxy.castShadow = proxy.receiveShadow = false; proxy.renderOrder = -1; hg.add(proxy);

  // --- the 44 items: slots by band (crown / slope / foot), kinds by a seeded swap search
  const GA = 2.399963, slots = [], F = (x, z) => [x * k, z * k];
  const spiral = (n, rho0, rho1, a0) => Array.from({ length: n }, (_, i) => { const rho = Math.sqrt(rho0 * rho0 + (rho1 * rho1 - rho0 * rho0) * ((i + 0.5) / n)), a = a0 + i * GA, rr = rho * Rd(a); return [Math.sin(a) * rr, Math.cos(a) * rr, a]; });
  const crownK = [["tacklebox", ...F(0.0, -0.04)], ["fishreel", ...F(-0.12, 0.05)], ["baittin", ...F(0.11, 0.03)], ["ropecoil", ...F(0.0, 0.14)], ["sinker", ...F(-0.07, -0.14)], ["linespool", ...F(0.09, -0.12)]];
  for (const [kind, x, z] of crownK) slots.push({ band: "crown", kind, x, z });
  // spec.extra (default 14 slope items: 8 sinkers, 2 reels, 2 rope coils, 2 spools) on top of the design's 44: 44 small things leave bare core; 0 gives the 44
  const EXTRA = ["sinker", "fishreel", "sinker", "ropecoil", "sinker", "linespool", "sinker", "sinker", "fishreel", "ropecoil", "sinker", "linespool", "sinker", "sinker"].slice(0, S.extra ?? 14);
  const slopeKinds = [...Array(11).fill("sinker"), ...Array(6).fill("fishreel"), ...Array(3).fill("baittin"), ...Array(2).fill("tacklebox"), ...Array(3).fill("ropecoil"), ...Array(3).fill("linespool"), ...EXTRA];
  spiral(28 + EXTRA.length, 0.22, 0.88, 0.3).forEach(([x, z]) => slots.push({ band: "slope", kind: null, x, z }));
  const footKinds = ["sinker", "chain", "sinker", "sinker", "chain", "sinker", "fishreel", "baittin", "linespool", "linespool"];
  const footAt = spiral(10, 0.94, 1.0, 1.1);
  footAt.forEach(([x, z, a], i) => slots.push({ band: "foot", kind: footKinds[i], x, z, a }));
  const sl = slots.filter((s) => s.band === "slope"), pool = [...slopeKinds];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  sl.forEach((s, i) => { s.kind = pool[i]; });
  // cost: a grey item (lead, chain) wants a coloured one within 0.17, no kind three times within 0.12
  const cost = () => { let c = 0; for (const s of slots) { let same = 0, colour = false; for (const o of slots) { if (o === s) continue; const d = Math.hypot(o.x - s.x, o.z - s.z); if (d < 0.17 * k && !GREY.has(o.kind)) colour = true; if (d < 0.12 * k && o.kind === s.kind) same++; } if (GREY.has(s.kind) && !colour) c += 3; if (same > 2) c += 4; c += same; } return c; };
  let best = cost();
  for (let it = 0; it < 500 && best > 0; it++) { const a = sl[Math.floor(r() * sl.length)], b = sl[Math.floor(r() * sl.length)]; if (a === b || a.kind === b.kind) continue; [a.kind, b.kind] = [b.kind, a.kind]; const c = cost(); if (c <= best) best = c; else [a.kind, b.kind] = [b.kind, a.kind]; }
  // item templates once per kind and variant, cloned per slot
  const cache = new Map(), SHAPES = ["pear", "pear", "ball", "pear", "pear", "coin", "pear", "pear"];
  const tpl = (kind, v, lie = false) => {
    const key = kind + v + (lie ? "L" : ""); if (cache.has(key)) return cache.get(key);
    const g = kind === "sinker" ? sinker(v + 1, { shape: SHAPES[v % 8] }) : ICEGEAR_BUILD[kind](v + 1, {});
    const out = lie ? lieOn(g) : g; cache.set(key, out); return out;
  };
  const order = Array.from({ length: slots.length }, (_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const N = slots.length, items = [], gradAt = (x, z) => { const e = 0.01; return new V3(-(core(x + e, z) - core(x - e, z)) / (2 * e), 1, -(core(x, z + e) - core(x, z - e)) / (2 * e)).normalize(); };
  slots.forEach((s, i) => {
    const lie = s.kind === "fishreel" && i % 2 === 0, node = tpl(s.kind, i, lie).clone(), wrap = new THREE.Group(); wrap.add(node); wrap.scale.setScalar(IS * HEAPSCALE[s.kind]);
    const onFloor = s.band === "foot", cy = onFloor ? 0 : core(s.x, s.z), n = onFloor ? upAxis.clone() : gradAt(s.x, s.z);
    const q = new THREE.Quaternion().setFromUnitVectors(upAxis, n), yaw = new THREE.Quaternion().setFromAxisAngle(n, r() * 6.283);
    q.premultiply(yaw);
    const tilt = (s.band === "slope" ? 0.17 : 0.06) * (r() - 0.5) * 2; q.premultiply(new THREE.Quaternion().setFromAxisAngle(new V3(Math.cos(r() * 6.283), 0, Math.sin(r() * 6.283)), tilt));
    const sink = onFloor ? 0 : 0.15 * ITEM_H[s.kind] * IS * HEAPSCALE[s.kind];
    const home = new V3(s.x, cy, s.z).addScaledVector(n, -sink);
    items.push({ wrap, home, q, ax: new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), w0: (0.9 * order[i]) / N, floor: onFloor, kind: s.kind, h: ITEM_H[s.kind] * IS * HEAPSCALE[s.kind], sp: 1, ringR: 0.06 + 0.09 * hash2(i, seed) });
    hg.add(wrap);
  });
  // --- the strays (loose bodies' rest poses, drawn only while slide > 0): world x y z -> the heap's frame
  const rotW = (S.rot ?? 0) * DEG, strays = [], list = (S.strays ?? []).slice(0, 16);
  list.forEach(([kind, wx, wy, wz, rotY = 0, sd = 1, rx = 0, rz = 0], i) => {
    const dx = wx - (S.x ?? 0), dz = wz - (S.z ?? 0), c = Math.cos(rotW), sn = Math.sin(rotW), lx = dx * c - dz * sn, lz = dx * sn + dz * c;   // into the prop's own frame
    const cp = Math.cos(psi), sp = Math.sin(psi), hx = lx * cp - lz * sp, hz = lx * sp + lz * cp;   // into the heap's frame
    const node = (kind === "bucket" ? bucket(sd) : ICEGEAR_BUILD[kind] ? (kind === "sinker" ? sinker(sd, S.strayShape ? { shape: S.strayShape } : {}) : ICEGEAR_BUILD[kind](sd, {})) : null);
    if (!node) return;
    const wrap = new THREE.Group(); wrap.add(node);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx * DEG, rotY * DEG - rotW - psi, rz * DEG, "YXZ"));
    strays.push({ wrap, home: new V3(hx, wy - (S.y ?? 0), hz), q, ax: new V3(0.3 + hash2(i, 3), 0.1, 0.2 - hash2(i, 5)).normalize(), kind, h: ITEM_H[kind] ?? 0.1, sp: kind === "anchor" ? 0.7 : 1, floor: true, ringR: 0.06 + 0.09 * hash2(i + 40, seed) });
    wrap.position.copy(strays[strays.length - 1].home); wrap.quaternion.copy(q); hg.add(wrap);
  });
  // slide ranks: heap items lowest first, then the strays in the given order, the anchor last
  const byLow = items.map((it, i) => i).sort((a, b) => items[a].home.y - items[b].home.y || items[b].home.z - items[a].home.z), NT = items.length + strays.length;
  byLow.forEach((i, rk) => { items[i].win = [0.55 * rk / NT, 0.45]; });
  strays.forEach((st, i) => { const rk = items.length + i; st.win = st.kind === "anchor" ? [0.99 - 0.45 / 0.7, 0.45 / 0.7] : [0.55 * rk / NT, 0.45]; });
  // foam rings, one per sliding thing, on the water plane (not turned with the slab)
  const ringGeo = new THREE.RingGeometry(0.76, 1, 28); ringGeo.rotateX(-Math.PI / 2);
  const ringMat = mat("#dfeaf7", { roughness: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); ringMat.userData.noOutline = true; ringMat.userData.noHatch = true;
  const sliders = [...items, ...strays];
  for (const it of sliders) { it.ring = new THREE.Mesh(ringGeo, ringMat); it.ring.visible = false; it.ring.castShadow = false; P.whole.add(it.ring); }
  if (!strays.length) hg.userData.noStrays = true;
  for (const st of strays) st.wrap.visible = false;

  const qT = new THREE.Quaternion(), qS = new THREE.Quaternion(), Ms = new THREE.Matrix4(), tmp = new V3(), tmp2 = new V3();
  // the slab's tip: about the pivot line (world x z -> this prop's frame), the +u side down
  const tiltMatrix = (ps, slab) => {
    Ms.identity(); if (slab <= 1e-4) return Ms;
    const rot = (ps.rot ?? 0) * DEG, c = Math.cos(rot), sn = Math.sin(rot), to = ([wx, wz]) => { const dx = wx - ps.x, dz = wz - ps.z; return new V3(dx * c - dz * sn, 0, dx * sn + dz * c); };
    const p1 = to(PIV[0]), p2 = to(PIV[1]), ax = p2.clone().sub(p1).normalize(), uu = new V3(Math.sin(psi), 0, Math.cos(psi));
    const sgn = -Math.sign(ax.clone().cross(uu).y) || 1, ang = sgn * TIP * slab;   // a +u point must move down
    return Ms.makeTranslation(p1.x, 0, p1.z).multiply(new THREE.Matrix4().makeRotationAxis(ax, ang)).multiply(new THREE.Matrix4().makeTranslation(-p1.x, 0, -p1.z));
  };
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fill ?? S.fill ?? 1), jolt = clamp(ps.jolt ?? S.jolt ?? 0), slab = clamp(ps.slab ?? S.slab ?? 0), slide = clamp(ps.slide ?? S.slide ?? 0), s = Math.sqrt(f);
      if (slide <= 0) for (const it of sliders) it.ring.visible = false;
      const Mt = tiltMatrix(ps, slab); tiltG.matrix.copy(Mt); tiltG.matrixWorldNeedsUpdate = true;
      let gone = 0;
      const base = (it) => {   // the fill pose
        const t = (f - it.w0) / 0.1;
        if (t < 0 || f < 0.02) { it.wrap.visible = false; return false; }
        it.wrap.visible = true;
        const u = Math.min(1, t / 0.75), hop = t > 0.75 ? 0.012 * Math.sin(Math.PI * Math.min(1, (t - 0.75) / 0.25)) : 0, fall = u < 1 ? 0.14 * (1 - u * u) : 0;
        qT.setFromAxisAngle(it.ax, 70 * DEG * (1 - u)); it.wrap.quaternion.copy(it.q).premultiply(qT);
        it.wrap.position.copy(it.home).multiplyScalar(s); it.wrap.position.y += fall + hop + (it.floor ? 0 : 0.015 * (it.home.y / (0.42 * hk)) * Math.sin(Math.PI * jolt));
        if (it.floor) it.wrap.position.y = it.home.y + fall + hop;
        return true;
      };
      const slideIt = (it) => {
        const tau = clamp((slide - it.win[0]) / it.win[1]); it.ring.visible = false;
        if (tau <= 0) return;
        if (tau >= 1) { it.wrap.visible = false; gone++; return; }
        const b0 = it.wrap.position.clone(), at = (tt, out) => out.copy(b0).add(tmp2.set(0, -0.45 * tt * tt * tt, 1.0 * it.sp * tt * tt));
        const yw = (tt) => { at(tt, tmp); tmp.applyAxisAngle(upAxis, psi).applyMatrix4(Mt); return tmp.y + ps.y; };
        let te = -1; for (let i = 0; i <= 24; i++) if (yw(i / 24) < WATER) { te = i / 24; break; }
        const p = at(tau, new V3()); let u2 = 0;
        if (te >= 0 && tau >= te) { u2 = (tau - te) / Math.max(1e-3, 1 - te); p.y -= (0.3 + it.h) * smooth(0, 1, u2); }
        it.wrap.position.copy(p); qS.setFromAxisAngle(it.ax, 120 * DEG * tau * tau); it.wrap.quaternion.premultiply(qS);
        const top = p.clone().applyAxisAngle(upAxis, psi).applyMatrix4(Mt).y + ps.y + it.h;
        if (te >= 0 && tau >= te && top < WATER - 0.02) { it.wrap.visible = false; gone++; }
        if (te >= 0 && tau >= te && tau < te + 0.6 * (1 - te)) {   // the foam ring where it went in, growing
          const e = at(te, new V3()).applyAxisAngle(upAxis, psi).applyMatrix4(Mt), g = smooth(0, 1, (tau - te) / (0.3 * (1 - te) + 1e-6));
          it.ring.visible = true; it.ring.position.set(e.x, WATER - ps.y + 0.004, e.z); it.ring.scale.set(it.ringR * (0.45 + 0.55 * g), 1, it.ringR * (0.45 + 0.55 * g));
        }
      };
      for (const it of items) { if (base(it) && slide > 0) slideIt(it); }
      for (const st of strays) { st.wrap.visible = slide > 0; if (slide > 0) { st.wrap.position.copy(st.home); st.wrap.quaternion.copy(st.q); slideIt(st); } }
      const left = slide > 0 ? 1 - gone / Math.max(1, items.length) : 1;
      cg.visible = f >= 0.08 && slide < 1 && left > 0.03; cg.scale.setScalar(Math.max(0.01, s * left));
    },
  };
}

// ---------------------------------------------------------------------------------------------------- hoodiegear
// the hoodie's fleece (costumes-everyday.js fleeceTexture, private there): light base, short flecks running down the cloth, a third of them pencil-dark
function fleece(W, H, seed, n) {
  const buf = wash(W, H, 90, seed, 0.03), lift = new Float32Array(W * H);
  for (let q = 0; q < buf.length; q++) buf[q] += 0.96;
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const stroke = (x0, y0, x1, y1, w0, w1, val, dark) => {
    const pad = Math.max(w0, w1) + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(H - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), w = w0 + (w1 - w0) * u;
      const a = 1 - sstep(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = y * W + (((x % W) + W) % W);
      if (dark) lift[q] = Math.min(lift[q], -a * val); else if (lift[q] >= 0) lift[q] = Math.max(lift[q], a * val);
    }
  };
  const h = (i, m) => hash2(i * 3.17 + m * 11.3 + seed, i * 0.71 + m * 1.7 + seed * 0.37), k = 0.55;
  for (let i = 0; i < n; i++) {
    const x = h(i, 1) * W, y = h(i, 2) * H, len = 7 + 13 * h(i, 3), a = (h(i, 4) - 0.5) * 1.1, w = 1.1 + 1.5 * h(i, 5), dark = h(i, 6) < 0.34;
    stroke(x, y, x + Math.sin(a) * len, y + Math.cos(a) * len, w, w * 0.45, k * (dark ? 0.08 + 0.07 * h(i, 7) : 0.05 + 0.06 * h(i, 7)), dark);
  }
  for (let q = 0; q < buf.length; q++) buf[q] += lift[q];
  return texOf(buf, W, H, false);
}
const CHIP = { rx: 0.285, ry: 0.265, rz: 0.26, cy: 0.405, taper: 0.02 };
const AZ0 = -105, AZ1 = 105, EL0 = -72, EL1 = -22;
const shadeHex = (hex, kk) => `#${new THREE.Color(hex).multiplyScalar(kk).getHexString()}`;
const lerpTab = (tab, x) => { for (let i = 0; i < tab.length - 1; i++) if (x <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (x - tab[i][0]) / (tab[i + 1][0] - tab[i][0])); return tab[tab.length - 1][1]; };
// the lumps: centre (az, el degrees), shape, height at fill 1, and the fill range over which it flattens (the anchor's is its own, see state())
const HOOK_R = 0.08, HOOK_HALF = Math.asin(0.06 / HOOK_R), HOOK_BOW = (HOOK_R * (1 - Math.cos(HOOK_HALF))) / 2;
const hookPt = (t) => { const a = lerp(-HOOK_HALF, HOOK_HALF, t); return [HOOK_R * Math.sin(a), HOOK_R * (1 - Math.cos(a)) - HOOK_BOW]; };
const hookHw = (t) => 0.025 * (1 - Math.pow(t, 2.2)) + 0.0015;
const LUMPS = [
  { id: "anchor", az: -20, el: -36, shape: "hook", h: 0.065 },
  { id: "box", az: 30, el: -38, shape: "pyr3", r: 0.055, h: 0.050, rot: 20, fl: [0.48, 0.62] },
  { id: "auger", az: 33, el: -27, shape: "bar", len: 0.15, w: 0.028, rot: 14, rend: 0.02, h: 0.030, fl: [0.30, 0.44] },
  { id: "reel", az: -50, el: -46, shape: "disc", r: 0.04, h: 0.034, fl: [0.80, 0.90] },
  { id: "sinkers", az: 60, el: -52, shape: "bumps", r: 0.045, h: 0.024, fl: [0.88, 0.98] },
];
const BUMPS = [[-0.021, -0.014], [0.022, -0.017], [-0.014, 0.022], [0.019, 0.019]];
function hoodiegear(P) {
  const S = P.spec, F = { ...CHIP, ...(S.fit || {}) }, col = S.color || "#ffcf2e", group = new THREE.Group(); P.whole.add(group);
  const skin = (azd, eld, out = 0) => { const d = dirAE(azd * DEG, eld * DEG), tp = 1 - F.taper * d.y, n = new V3(d.x / F.rx, d.y / F.ry, d.z / F.rz).normalize(); return { p: new V3(d.x * F.rx * tp, F.cy + d.y * F.ry, d.z * F.rz * tp).addScaledVector(n, out), n }; };
  const metres = (azd, eld) => [azd * DEG * F.rx * Math.cos(eld * DEG), eld * DEG * F.ry];   // az, el (degrees) -> surface metres (x right, y up)
  const cloth = clothMat(col, { side: THREE.DoubleSide, vertexColors: true }); cloth.map = fleece(512, 256, 57.3, 70);
  const NA = 150, NE = 62, geo = new THREE.BufferGeometry(), pos = new Float32Array((NA + 1) * (NE + 1) * 3), uv = new Float32Array((NA + 1) * (NE + 1) * 2), colr = new Float32Array((NA + 1) * (NE + 1) * 3), idx = [];
  for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const q = j * (NA + 1) + i; uv[q * 2] = i / NA; uv[q * 2 + 1] = j / NE; }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("color", new THREE.BufferAttribute(colr, 3)); geo.setIndex(idx);
  const patch = new THREE.Mesh(geo, cloth); patch.castShadow = patch.receiveShadow = true; patch.frustumCulled = false; group.add(patch);
  const marks = new THREE.Group(); group.add(marks);
  const stitchM = clothMat(shadeHex(col, 0.62));
  // the lumps' state at a fill: centre (the fluke slides down), strength 0..1
  const state = (fill) => LUMPS.map((L) => {
    let kk, el = L.el;
    if (L.id === "anchor") { kk = smooth(0.03, 0.14, fill); el = lerp(-58, -36, smooth(0.14, 0.30, fill)); } else kk = smooth(L.fl[0], L.fl[1], fill);
    return { ...L, el, k: kk };
  });
  const lumpField = (L, azd, eld) => {
    const [mx, my] = metres(azd - L.az, eld - L.el), h = L.h * L.k; if (h <= 1e-5) return 0;
    if (L.shape === "hook") {   // an arc ridge (radius 0.08, 0.12 long, 0.05 wide) ending in ONE sharp point at +x
      let dm = 1e9, tm = 0; const n = 24;
      for (let i = 0; i <= n; i++) { const t = i / n, [px, py] = hookPt(t), d = Math.hypot(mx - px, my - py); if (d < dm) { dm = d; tm = t; } }
      const hw = hookHw(tm); return dm >= hw ? 0 : h * Math.pow(1 - (dm / hw) ** 2, 0.9) * (0.7 + 0.3 * tm);
    }
    if (L.shape === "disc") { const q = Math.hypot(mx, my) / L.r; return h * smooth(1, 0.6, q); }   // flat top, a steep rim 1.6 cm wide (the grid is 0.7 cm)
    if (L.shape === "pyr3") {   // three flat faces meeting
      let q = -1e9; for (let i = 0; i < 3; i++) { const a = (L.rot + 90 + 120 * i) * DEG; q = Math.max(q, mx * Math.cos(a) + my * Math.sin(a)); }
      const A = L.r * 0.5; return h * Math.min(1, 1.2 * Math.max(0, 1 - q / A));
    }
    if (L.shape === "bumps") { let m = 0; for (const [bx, by] of BUMPS) { const q = Math.hypot(mx - bx, my - by) / 0.017; if (q < 1) m = Math.max(m, h * Math.pow(1 - q * q, 0.7)); } return m; }
    // bar: a straight ridge tilted by rot with a round end (r rend) at +u
    const c = Math.cos(L.rot * DEG), sn = Math.sin(L.rot * DEG), u = mx * c + my * sn, w = -mx * sn + my * c;
    const e = smooth(L.len / 2 + 0.003, L.len / 2 - 0.003, Math.abs(u)), q = Math.abs(w) / (L.w / 2), bar = q >= 1 ? 0 : h * Math.pow(1 - q, 0.8) * e;
    const dq = Math.hypot(u - (L.len / 2 - L.rend), w) / L.rend, ball = dq >= 1 ? 0 : h * 1.3 * Math.pow(1 - dq * dq, 0.7);
    return Math.max(bar, ball);
  };
  // the point on the patch at (az, el) degrees for the lumps `st` at `fill`: { p, n (surface), off (metres from the skin) }
  const point = (azd, eld, fill, st) => {
    const dAz = Math.min(azd - AZ0, AZ1 - azd), dEl = Math.min(eld - EL0, EL1 - eld), dd = Math.max(0, Math.min(dAz, dEl)), ramp = smooth(0, 10, dd);
    const base = lerp(0.015, 0.03 + 0.016 * Math.min(1, 5 * fill), ramp), sk = skin(azd, eld, 0);
    const Fz = lerpTab([[0, 1], [45, 0.75], [80, 0.3], [105, 0]], Math.abs(azd)), E = eld >= -45 ? clamp((EL1 - eld) / 23 * 1) : clamp((eld - EL0) / 27);
    let pn = 0; for (const L of st) pn += Math.pow(lumpField(L, azd, eld), 4);
    let extra = ramp * (0.11 * fill * Fz * E + Math.pow(pn, 0.25) * (1 - 0.92 * smooth(-54, -63, eld)));   // lumps die away before the hem band, so none hangs over it
    const fw = new V3(Math.sin(azd * DEG) * Math.cos(10 * DEG), -Math.sin(10 * DEG), Math.cos(azd * DEG) * Math.cos(10 * DEG));
    // limits: his mouth stays clear (nothing above y 0.325), the drawstrings stay on top, 0.235 at most
    const bd = sk.n.clone().multiplyScalar(1 - smooth(-30, -55, eld)).addScaledVector(fw, smooth(-30, -55, eld)).normalize();
    const at = (e) => sk.p.clone().addScaledVector(bd, base).addScaledVector(fw, e);
    const lim = (cap) => { extra = Math.min(extra, cap); };
    lim(0.235 - base);
    if (Math.abs(azd) < 12 && eld > -30) lim(Math.max(0, 0.045 - base));
    let pt = at(extra); if (pt.y > 0.325 && extra > 0) { let lo = 0, hi = extra; for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (at(mid).y > 0.325) hi = mid; else lo = mid; } extra = lo; pt = at(extra); }
    return { p: pt, n: sk.n, off: base + extra };
  };
  const surf = (a, e, fill, st) => {
    const p0 = point(a, e, fill, st), da = point(a + 0.4, e, fill, st).p.sub(p0.p), de = point(a, e + 0.4, fill, st).p.sub(p0.p), n = da.cross(de).normalize();
    if (n.dot(p0.n) < 0) n.negate();
    return { p: p0.p, n };
  };
  const toAE = (L, mx, my) => [L.az + mx / (F.rx * Math.cos(L.el * DEG)) / DEG, L.el + my / F.ry / DEG];
  const ink = (azels, wf, st, fill, kk, lift = 0.0035) => {
    if (kk < 0.08) return;
    const pts = azels.map(([a, e]) => surf(a, Math.max(e, -57), fill, st));
    marks.add(inkMesh(ribbon((u) => pts[Math.round(u * (pts.length - 1))], pts.length - 1, (u) => wf(u) * kk, lift), col, 0.32));
  };
  // the crescent on the upper rim of each lump (metres, in the lump's frame)
  const rim = (L, f) => {
    if (L.shape === "hook") { const [px, py] = hookPt(f); return [px, py + hookHw(f) * 0.85]; }
    if (L.shape === "bar") { const along = (f - 0.5) * (L.len * 0.8), off = (L.w / 2) * 0.9, c2 = Math.cos(L.rot * DEG), s2 = Math.sin(L.rot * DEG); return [along * c2 - off * s2, along * s2 + off * c2]; }
    const th = (20 + 140 * f) * DEG, rr = (L.r ?? 0.05) * (L.shape === "pyr3" ? 0.78 : 0.96); return [Math.cos(th) * rr, Math.sin(th) * rr];
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
      const pts = []; for (let t = 0; t <= 36; t++) { const [mx, my] = rim(L, t / 36); pts.push(toAE(L, mx, my)); }
      ink(pts, (u) => 0.0045 * Math.sin(Math.PI * u) + 0.0006, st, fill, L.k);
    }
    const fl = st[0];
    if (fl.k > 0.08) {   // three pull lines from the fluke's point toward the box corner, the hem and the pocket end
      const [tx, ty] = hookPt(1);
      for (const [angd, len] of [[8, 0.07], [-78, 0.06], [-140, 0.045]]) { const th = angd * DEG, pts = []; for (let t = 0; t <= 8; t++) { const d = 0.008 + (t / 8) * len; pts.push(toAE(fl, tx + Math.cos(th) * d, ty + Math.sin(th) * d)); } ink(pts, (u) => 0.0022 * (1 - u * 0.85), st, fill, fl.k); }
    }
    const sp = []; for (let t = 0; t <= 44; t++) { const a = -30 + 60 * (t / 44), q = surf(a, -42, fill, st); sp.push(q.p.clone().addScaledVector(q.n, 0.004)); }
    marks.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 90, 0.0028, 5, false), stitchM));
  };
  // the hem hint: the reel's crank arm, its black knob and 120 degrees of one steel plate with green line, at az +40 under the hem,
  // pointing down and 30 degrees out, 0.06 showing below the hem line (y 0.167)
  const tipG = new THREE.Group(); group.add(tipG);
  { const hem = skin(40, -64, 0.034), out = new V3(Math.sin(40 * DEG), 0, Math.cos(40 * DEG)), dir = new V3(0, -Math.cos(30 * DEG), 0).addScaledVector(out, Math.sin(30 * DEG)).normalize();
    const X = new V3(Math.cos(40 * DEG), 0, -Math.sin(40 * DEG)), Z = X.clone().cross(dir).normalize(); if (Z.dot(out) < 0) Z.negate();
    const Mh = new THREE.Matrix4().makeBasis(X, dir, Z).setPosition(hem.p.clone().add(new V3(0, -0.005, 0)).addScaledVector(out, 0.004)), KT = kit();
    const sec = new THREE.Shape(); sec.moveTo(0, 0); for (let i = 0; i <= 16; i++) { const a = (-60 + 120 * (i / 16)) * DEG; sec.lineTo(Math.sin(a) * 0.04, Math.cos(a) * 0.04); } sec.closePath();
    const plate = new THREE.ExtrudeGeometry(sec, { depth: 0.004, bevelEnabled: false }); plate.translate(0, 0, -0.002);
    KT.add(plate, "#8e98a3", { rough: 0.35, metal: 0.45 }, Mh);
    const ringArc = new THREE.RingGeometry(0.026, 0.034, 20, 1, (90 - 52) * DEG, 104 * DEG); KT.add(ringArc, "#3f8f5a", { mark: true, rough: 0.8 }, Mh.clone().multiply(M4([0, 0, 0.0024])));
    KT.add(cylZ(0.0085, 0.006, 14), "#6c747e", { rough: 0.35, metal: 0.45 }, Mh.clone().multiply(M4([0, 0, 0.003])));
    KT.add(new THREE.BoxGeometry(0.0075, 0.047, 0.004), "#8e98a3", { rough: 0.35, metal: 0.45 }, Mh.clone().multiply(M4([0, 0.0225, 0.0055])));
    KT.add(cylZ(0.014, 0.014, 16), "#23262b", { rough: 0.5 }, Mh.clone().multiply(M4([0, 0.047, 0.012])));
    KT.flush(tipG); }
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fill ?? S.fill ?? 1);
      group.visible = f > 0.02; if (f <= 0.02) return;
      if (f !== last) { rebuild(f); last = f; }
      tipG.visible = f > 0.86; tipG.position.y = -0.03 * (1 - smooth(0.86, 0.9, f));
    },
  };
}

// ---------------------------------------------------------------------------------------------------- gearrope
// the anchor's rope (frozen lake v3 ending, Jonny 19 Nov "Chip gets yanked in"): one cream rope between two points in the prop's
// frame (place the prop at 0,0,0 rot 0 so they are world points): a (ax, ay, az) = Chip's hem, b (bx, by, bz) = the anchor's ring.
// sag (metres, 0 = taut) drops the middle; where the line would go under the ice top (y 0.006) it lies on the ice, unless that
// part is over open water (an end under y -0.01: the rope runs down into the water). in 0..1 shows it. All params tween
// (props3d propState). Rebuilt only when its numbers change (keyed on the exact inputs, so renders stay deterministic).
export const ROPE_KEYS = ["ax", "ay", "az", "bx", "by", "bz", "sag", "in"];
function gearrope(P) {
  const S = P.spec, g = new THREE.Group(); P.whole.add(g);
  const mA = mat("#d8d2c0", { roughness: 0.9 }), mB = mat("#b4ab93", { roughness: 0.9 });
  let key = null;
  return {
    grip: 0,
    apply(ps) {
      const v = (k, d = 0) => Number(ps[k] ?? S[k] ?? d);
      const on = v("in", 1) > 0.01; g.visible = on; if (!on) return;
      const A = new V3(v("ax"), v("ay"), v("az")), B = new V3(v("bx"), v("by"), v("bz")), sag = Math.max(0, v("sag", 0.1));
      const k = [A.x, A.y, A.z, B.x, B.y, B.z, sag].map((x) => x.toFixed(4)).join(",");
      if (k === key) return; key = k;
      for (const c of [...g.children]) { g.remove(c); c.geometry.dispose(); }
      const N = 48, pts = [], wet = Math.min(A.y, B.y) < -0.01;
      for (let i = 0; i <= N; i++) {
        const u = i / N, p = A.clone().lerp(B, u); p.y -= sag * 4 * u * (1 - u);
        if (!wet || p.y > -0.01) p.y = Math.max(p.y, 0.006 + 0.004 * Math.sin(u * 37));   // on the ice it lies flat (a little wander)
        pts.push(p);
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), n = 10;
      for (let i = 0; i < n; i++) {
        const seg = curve.getPoints(80).slice(Math.floor((i / n) * 80), Math.min(81, Math.ceil(((i + 1) / n) * 80) + 1));
        if (seg.length < 2) continue;
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seg), 8, 0.0075, 8, false), i % 2 ? mB : mA); m.castShadow = true; g.add(m);
      }
    },
  };
}

export const ICEGEAR_KINDS = { sinker: loose("sinker"), fishreel: loose("fishreel"), tacklebox: loose("tacklebox"), baittin: loose("baittin"), iceauger: loose("iceauger"), anchor: loose("anchor"), gearheap: heap, hoodiegear, gearrope };
