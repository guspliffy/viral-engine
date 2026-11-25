import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";

// Potato Desk "Heaven's terms and conditions", SET B: HEAVEN HOME (storyboards/series/potato-desk/heaven-terms/DESIGN.md section 3, panels 04-10).
// Axes: x right, y up, +z toward the camera, metres; every size and hex colour is the DESIGN's. Station H = world (10.50, 26.00, 15.00), the centre of the island's top.
// Every mark (lobe, puff, crease, leaf stroke, glint, bead, far island) is placed once from a fixed seed or its own numbers; nothing is tiled or mirrored.
// Everything animated is a pure function of the prop state and the clip time t (no clock, no Math.random). Clouds carry no ink outline (as cloudpuff).
// STATE KEYS. propState tweens the numbers it already knows (`tilt`, `bump`, `cover`, `over`, `on`, `puff`: all are such names); every key starts at its spec
// value (default 0). `tilt` is the engine's own (a rotation about the prop's origin, + = toward +x), so a tilt rocks an island about the middle of its top.
// SPEC `loop` (seconds, optional, on every kind that moves by t): drift / bob / shimmer close on the last frame (as zoneclouds). `seed` changes the rng seeds.
// SOLIDS (what a body can stand on or hit): homeisland / cloudhouse: the flat top disc and the two flat dock / lie tabs; cloudbed: the flat mattress top;
// goldharp: pillar + base. Everything else (lobes, bodies, puffs, house, strings, duvet, glints, water, sky) is see-through for the contact checks and casts no shadow.
// HOLDS: nothing here is held (HHOME_GRIPS is empty). The Angel's roll, the phone and the hands are other kinds.
//
// homeisland   the cloud island. Origin: the CENTRE of its top (y 0) = H (place it at 10.50, 26.00, 15.00). Disc r 2.25 (walkable, flat, solid), 16 rim lobes r 0.35-0.60
//              (tops y 0.05-0.25, each its own size, 2-3 lumps), outer edge r ~2.60, a body of 22 puffs reaching y -1.5 below. Two flat rim gaps, flat tabs in the same top
//              colour (solid): the LIE spot at azimuth (-0.62, -0.79) (the tab reaches r 2.68, 1.0 wide: Spud lies on it, head at the rim) and the DOCK on
//              the +x side at azimuth (2.55, -0.75) (1.4 wide, tab reaches r 2.62). Top #fbfdff, shade #d9d6ee (lilac), dawn edge light #ffe2c4 on the back-right, underside
//              #f6c9d4. Wet: one sheen card r 1.9 at 10 % (fixed opacity) and 9 small glints, each its own place / size / turn. Lobes bob 0.02 m at 0.25 Hz from t (phase each).
//              spec: seed 1, bob 1 (0 = still lobes), loop 0.   state: `tilt` (engine, +-1.5 for the dock bump, rocks about the top's centre), `bump` 0..1 (default 0): the two
//              lobes beside the dock squash 10 % in height (+4 % wide): tween it 0 -> 1 -> 0 over 6 frames on contact.
// cloudbed     the sleeper's bed on the `bed` interface (sit works): Origin: WHERE THE SLEEPER SITS UP (his seat at the origin, mattress top y 0.42 = SEAT_Y), the bed runs 1.6 m toward
//              +z (the foot), the pillow at -z. Mattress 1.15 x 0.42 x 1.90 (x -0.575..+0.575, z -0.38..+1.55) of 9 merged puffs #f7f9fd / #dcdcf0; ONE solid flat top
//              0.92 x 1.24 (x +-0.46, z 0.03..1.27, y 0.42: he stands on it, e.g. in shot 14 at local (0, 0.42, 0.62)); one pillow 0.62 x 0.16 x 0.34 (#ffffff / #e6e4f0,
//              two crease strokes) behind him at (0, 0.42, -0.22); a thin fluffy duvet (12 puffs, top y 0.44-0.48, 5 soft folds painted once, #f7f9fd) over the legs from z 0.31 to
//              the foot; no frame, no legs. Place at H (-1.25, 0, -0.60), rot +40 (the foot points front-right); the bed's cloud sits on the island top (its y 0).
//              spec: seed 1, cover 0 (start value). state: `cover` 0..1: the turned-down fold (one soft roll in a U round the sitter's front, z up to 0.45) rises from 0.08 to 0.40 high
//              (the chest), exactly as `bed`; `over` 0..1: the duvet lump (3 puffs, 1.24 wide x 1.6 high x 1.12 deep at full size: bigger than `bed`'s, it must hide a SEATED Spud, top y 1.40) covers the sitter's head (the sleeping lump; tween 1 -> 0 to burst).
//              Not held. Use `sit` with seat: "<this id>" (height default SEAT_Y).
// goldharp     the harp. Origin: the middle of the frame on the floor (y 0), strings' plane facing +z (the lens). Size about 0.85 wide (x -0.44..+0.40), 1.45 high, 0.30 deep at the base.
//              Gold #e8b93a, shade #b8862a, light #ffe89a. Straight fluted pillar r 0.04 at x +0.27 (y 0.12..1.30, solid), stepped base 0.30 x 0.08 x 0.30 + 0.22 x 0.04 x 0.22 centred
//              x +0.22 (solid), S-curved neck from the pillar top to a volute r 0.09 at the top left (-0.31, 1.355), a slanted soundbox 0.16 wide (0.07 deep) from the pillar's foot
//              up-left with 6 engraved leaf strokes (#b8862a, each its own size and turn), a strut to the volute. 11 strings #fff6d6, diameter 0.004, pitch 0.045, x from -0.24 (string 1,
//              left, 0.42 long) to +0.21 (string 11, 1.05 long), tops on the neck, feet on the soundbox. Numbered 1..11 from the LEFT: string 4 is at x -0.105.
//              spec: on 0 (start value), puff 0. state: `on` 0..1: ALL strings vibrate, amplitude 0.012 x on, drawn as a spindle (two offset copies of the string and a 30 % fill between
//              them: fixed phases, fixed opacity, no blur); `puff` 0..1: ONLY string 4 swings 0.03 x puff (his pluck: tween 1 -> 0 over 0.5 s); the swing is the same spindle.
// cloudhouse   the neighbour: an island r 1.50 built as homeisland (disc r 1.30, 9 lobes r 0.27-0.46, tops y 0.04-0.19, body 14 puffs to y -1.2, a flat DOCK tab toward -x/+z at azimuth
//              163.6 degrees, solid, edge r 1.40) with a round cloud house on it: r 0.85, 1.25 high, 12 merged puffs centred at local (0.30, 0, -0.30); a round-topped door 0.46 x 0.70
//              #d9a25a with a gold knob facing the ride point; one round window r 0.16 lit #ffd76a with a cross bar on the front right; a stub chimney (#c98f64) with one puff of white
//              smoke that bobs 0.03. Origin: the centre of the island's top. It DRIFTS by the director's tween of x / y / z (from H (9.00, -0.30, -4.00) to the dock H (3.75, -0.05, -1.10) in
//              2.0 s ease out). RIDE POINT for the ex: local (-0.75, 0, 0.55) (on the flat top, 0.5 m in front of the door, bodies 0.31 from the house wall).
//              spec: seed 2, bob 1, loop 0.   state: `tilt` (engine), `bump` 0..1 (as homeisland: the two lobes beside its dock tab squash 10 %). Lobes bob 0.02 m; the smoke 0.03.
// dawnsky      the dawn drum round H. Origin: H (place at 10.50, 26.00, 15.00). Unlit open drum r 30, y -5..+40 (flat cap #9fb0ee above, NO floor: rays that leave through the bottom see the
//              real world below, shot 15), ONE vertical gradient by height over H: -5 #ffd9a8, 0 #ffcfa6, +4 #f6b7c4, +10 #d7b3e6, +18 #b3a6e8, +30 #9fb0ee; a soft sun glow (no disc) #fff1c2 at 45 %,
//              30 degrees wide, low at the back right (azimuth x +, z -). A cloud sea: 60 OPAQUE two-tone puffs (zoneclouds' build, two instanced draws of 30; #fbeef0 / #e7c9dc, gold tops #ffe9c4) in a ring
//              r 9..28 at y -3.5..-2 (tops never above y -1.6), none nearer than 3.5 m to H's axis, and NONE within 28 degrees of the bearing from H to the hatch out to r 22 (shot 15's window).
//              7 far islands 0.8-2.0 wide on the drum (r 27.5) at y -1..+6, one with a tiny house. Drift 0.02 m/s toward -x with a 0.02 m bob at 0.2 Hz from t. See-through for every check.
//              spec: seed 1, loop 0, speed 1 (drift x), hatch [-11.15, -13.70] (the hatch relative to this prop's origin: world (-0.65, 1.30) minus H's x and z), gapDeg 28 (half angle),
//              gapR 22. The camera far plane must reach 30 m from the camera (any); no keys.
// sockwell     the wet cloud under one foot. Origin: the CENTRE of the foot on the island's top (y 0); two instances at H (0.36, 0, 0.55) and (0.64, 0, 0.55). `on` 0..1 (tween it over 8 frames as the
//              sock lands; starts at spec.on, 0): a dimple r 0.16 (#cfd9e6 in its hollow, a lit crescent) grows in; a film of clear water #bfe6f2 at FIXED 55 % opacity wells up from r 0.10 to r 0.19, a lens 0.035 high (grown
//              by scale, never faded; unlit, so the warm light does not tint it); 5 beads r 0.008-0.014 squeeze out at the film's edge, rise 0.03 and run back into it (gone at on 1); one slow ring (#a9d8ea, 90 %, r 0.19 -> 0.29, 0.006 thick) stays.
//              Nothing leaves the surface by more than 0.05: no crown, no flying drops. All flat cards and beads, see-through, no ink. The sock's own sink (0.05) is the director's.

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const snapHz = (hz, loop) => (loop > 0 ? Math.max(1, Math.round(hz * loop)) / loop : hz);
const col = (h) => new THREE.Color(h);
const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// see-through for the checks and the shadows
const see = (root) => { root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } }); return root; };
const flat = (o) => { o.castShadow = false; o.userData.solid = false; o.userData.steam = true; return o; };
const noInk = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; m.toneMapped = false; return noInk(m); };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

// ---- colour by normal: every cloud is one merged mesh with baked two-tone vertex colours -------------------------------------------------------------------
const SUN = new V3(0.6, 0.25, -0.75).normalize();   // dawn: low, behind, right
const cloudPal = (top, shade, edge, under) => ({ top: col(top), shade: col(shade), edge: edge && col(edge), under: under && col(under) });
const PAL_ISLE = cloudPal("#fbfdff", "#d9d6ee", "#ffe2c4", "#f6c9d4");
const PAL_BED = cloudPal("#f7f9fd", "#dcdcf0", "#ffe2c4", null);
const PAL_PILLOW = cloudPal("#ffffff", "#e6e4f0", null, null);
function paintGeo(geo, fn) {
  const n = geo.attributes.normal, p = geo.attributes.position, cs = new Float32Array(n.count * 3), c = new THREE.Color(), v = new V3();
  for (let i = 0; i < n.count; i++) {
    v.set(n.getX(i), n.getY(i), n.getZ(i)).normalize();
    fn(c, v, p.getX(i), p.getY(i), p.getZ(i)); cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); return geo;
}
const cloudFn = (pal, extra) => (c, n, x, y, z) => {
  c.copy(pal.shade).lerp(pal.top, ss((n.y + 0.15) / 0.45));
  if (pal.edge) c.lerp(pal.edge, 0.75 * ss((n.dot(SUN) - 0.45) / 0.3));
  if (pal.under) c.lerp(pal.under, 0.8 * ss((-n.y - 0.3) / 0.5));
  if (extra) extra(c, x, y, z, pal);
};
// a merged cluster of ellipsoids: lump = [x, y, z, rx, ry, rz, turn]
function lumpGeo(lumps, fn, w = 16, h = 11) {
  const q = new THREE.Quaternion();
  const geos = lumps.map(([x, y, z, rx, ry, rz, turn = 0]) => {
    const g = new THREE.SphereGeometry(1, w, h);
    g.applyMatrix4(new THREE.Matrix4().compose(new V3(x, y, z), q.setFromAxisAngle(UP, turn), new V3(rx, ry, rz))); return g;
  });
  const m = mergeGeometries(geos); geos.forEach((g) => g.dispose()); return paintGeo(m, fn);
}
const cloudMat = (o = {}) => noInk(new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.9, emissive: col("#f7fafc"), emissiveIntensity: 0.04, ...o }));
const goldMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.42, metalness: 0.12, emissive: col("#7a5410"), emissiveIntensity: 0.2, ...o }); m.userData.noHatch = true; return m; };
const GOLD = { top: col("#e8b93a"), shade: col("#b8862a"), light: col("#ffe89a") }, LIGHT = new V3(-0.45, 0.55, 0.7).normalize();
const goldFn = (c, n) => { c.copy(GOLD.shade).lerp(GOLD.top, ss((n.z * 0.55 + n.y * 0.45 + 0.35) / 0.8)); c.lerp(GOLD.light, 0.85 * ss((n.dot(LIGHT) - 0.72) / 0.2)); };

// a rounded box (corners pulled toward an ellipsoid by k), smooth normals
function softBox(w, h, d, sx, sy, sz, k = 0.4) {
  let g = new THREE.BoxGeometry(w, h, d, sx, sy, sz); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-5);
  const p = g.attributes.position, a = w / 2, b = h / 2, c = d / 2;
  for (let i = 0; i < p.count; i++) {
    const qx = p.getX(i) / a, qy = p.getY(i) / b, qz = p.getZ(i) / c, l2 = Math.hypot(qx, qy, qz) || 1, li = Math.max(Math.abs(qx), Math.abs(qy), Math.abs(qz));
    const s = 1 + k * (li / l2 - 1);
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s);
  }
  g.computeVertexNormals(); return g;
}
// a rounded slab in x/z of w x d, h high (bottom at y 0), bevel b
function slabXZ(w, d, h, r, b) {
  const x = -(w - 2 * b) / 2, y = -(d - 2 * b) / 2, W = w - 2 * b, D = d - 2 * b, rr = Math.max(0.002, r - b), s = new THREE.Shape();
  s.moveTo(x + rr, y); s.lineTo(x + W - rr, y); s.quadraticCurveTo(x + W, y, x + W, y + rr); s.lineTo(x + W, y + D - rr); s.quadraticCurveTo(x + W, y + D, x + W - rr, y + D);
  s.lineTo(x + rr, y + D); s.quadraticCurveTo(x, y + D, x, y + D - rr); s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return g;
}
// radial soft card texture
const radialTex = (stops) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const card = (w, h, m, parent, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2), m); o.position.set(x, y, z); o.rotation.y = ry; o.renderOrder = 4; flat(o); o.receiveShadow = false; parent.add(o); return o; };
const softMat = (map, o = {}) => noInk(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, ...o }));

// ================================================================== THE ISLAND (homeisland and the neighbour's)
// o: R (outer edge of the lobes), nLobes, lobeR [lo, hi] (m), top [lo, hi] (m), nBody, depth (m, body bottom), gaps [{ az, w, rx, rz, edge, dock }], seed, glints [[x, z, size, turn, kind]]
function buildIsland(P, o) {
  const S = P.spec, R0 = rng((S.seed ?? 1) * 977 + o.seed), loop = S.loop ?? 0, bobHz = snapHz(0.25, loop), bobK = (S.bob ?? 1) * 0.02;
  const disc = o.R * 0.865, k = Math.sqrt(o.R / 2.6), fn = cloudFn(PAL_ISLE), mt = cloudMat();
  const root = new THREE.Group(); P.whole.add(root);
  // the walkable disc: a flat top (solid), a rounded edge and a belly
  const prof = [[0, -0.55], [disc * 0.72, -0.45], [disc - 0.1, -0.28], [disc, -0.12], [disc - 0.03, -0.02], [disc - 0.1, 0], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  const dm = mesh(paintGeo(new THREE.LatheGeometry(prof, 64), fn), mt, root); dm.castShadow = false;
  // the flat tabs in the rim gaps (solid, top 0.004 under the disc's so the two never fight)
  const tprof = [[0, -0.34], [0.70, -0.30], [0.97, -0.16], [1.0, -0.07], [0.94, -0.012], [0, -0.004]].map(([r, y]) => new THREE.Vector2(r, y));
  for (const g of o.gaps) {
    const c = g.edge - g.rz, tg = paintGeo(new THREE.LatheGeometry(tprof, 40).applyMatrix4(new THREE.Matrix4().makeScale(g.rx, 1, g.rz)), fn);
    const t = mesh(tg, mt, root, Math.cos(g.az) * c, 0, Math.sin(g.az) * c); t.rotation.y = Math.PI / 2 - g.az; t.castShadow = false;
  }
  // the rim lobes, spread over the arcs between the gaps
  const gs = o.gaps.map((g) => ({ az: g.az, h: (g.w / 2 + 0.28 * k) / (o.R * 0.92), dock: !!g.dock })).sort((a, b) => a.az - b.az);
  const arcs = gs.map((g, i) => { const nx = gs[(i + 1) % gs.length], to = nx.az + (i + 1 === gs.length ? TAU : 0) - nx.h; return [g.az + g.h, to]; });
  const total = arcs.reduce((a, [f, t]) => a + (t - f), 0); let left = o.nLobes;
  const counts = arcs.map(([f, t], i) => { const n = i === arcs.length - 1 ? left : Math.round((o.nLobes * (t - f)) / total); left -= n; return n; });
  const lobes = [];
  arcs.forEach(([f, t], ai) => {
    for (let i = 0; i < counts[ai]; i++) {
      const pitch = (t - f) / counts[ai], a = f + (i + 0.5) * pitch + (R0() - 0.5) * 0.36 * pitch;
      const rl = (o.lobeR[0] + (o.lobeR[1] - o.lobeR[0]) * R0()) * k, top = o.top[0] + (o.top[1] - o.top[0]) * R0(), rd = o.R - 0.78 * rl + (R0() - 0.5) * 0.08;
      const ry = 0.72 * rl, ph = R0() * TAU, tw = (R0() - 0.5) * 0.5;
      const lumps = [[0, top - ry, 0, rl, ry, rl * 0.95, tw], [rl * (0.55 + 0.15 * R0()), top - ry * 1.18, -rl * 0.12, rl * 0.64, ry * 0.8, rl * 0.6, tw + 0.5], [-rl * (0.5 + 0.2 * R0()), top - ry * 1.25, rl * 0.1, rl * 0.58, ry * 0.76, rl * 0.56, tw - 0.4]];
      const m = mesh(lumpGeo(lumps, fn), mt, root, Math.cos(a) * rd, 0, Math.sin(a) * rd); m.rotation.y = Math.PI / 2 - a; flat(m); m.receiveShadow = false;
      lobes.push({ m, a, ph, touch: false });
    }
  });
  // the two lobes beside the dock squash on contact
  const dock = gs.find((g) => g.dock);
  if (dock) {
    const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x)), pos = lobes.filter((l) => wrap(l.a - dock.az) > 0).sort((p, q) => wrap(p.a - dock.az) - wrap(q.a - dock.az))[0], neg = lobes.filter((l) => wrap(l.a - dock.az) < 0).sort((p, q) => wrap(q.a - dock.az) - wrap(p.a - dock.az))[0];
    if (pos) pos.touch = true; if (neg) neg.touch = true;
  }
  // the belly: puffs under the disc, never above y -0.02
  const body = [], D = o.depth;
  for (let i = 0; i < o.nBody; i++) {
    const ring = i < Math.round(o.nBody * 0.45) ? 0 : i < Math.round(o.nBody * 0.77) ? 1 : 2, ang = R0() * TAU;
    const rho = ring === 0 ? disc * (0.78 + 0.1 * R0()) : ring === 1 ? disc * (0.42 + 0.15 * R0()) : disc * 0.2 * R0();
    const rad = (ring === 0 ? 0.6 + 0.25 * R0() : ring === 1 ? 0.7 + 0.25 * R0() : 0.7 + 0.2 * R0()) * k, ry = rad * (ring === 2 ? 0.7 : 0.58);
    let top = ring === 0 ? -0.06 - 0.2 * R0() : ring === 1 ? -0.3 - 0.2 * R0() : -0.5 - 0.2 * R0();
    top = Math.min(top, -0.02); let yc = top - ry; if (yc - ry < -D) yc = -D + ry;
    body.push([Math.cos(ang) * rho, yc, Math.sin(ang) * rho, rad, ry, rad * (0.9 + 0.2 * R0()), R0() * TAU]);
  }
  for (const g of o.gaps) { const c = g.edge - g.rz * 0.8; body.push([Math.cos(g.az) * c, -0.16 - 0.3 * k, Math.sin(g.az) * c, g.rx * 0.8, 0.3 * k, g.rz * 0.9, 0]); }
  see(mesh(lumpGeo(body, fn, 18, 12), mt, root));
  // wet: one sheen card (10 %, fixed) and a few glints, each placed once
  const sheen = softMat(radialTex([[0, "rgba(255,255,255,1)"], [0.6, "rgba(255,255,255,0.55)"], [1, "rgba(255,255,255,0)"]]), { opacity: 0.10 });
  card(disc * 1.7, disc * 1.7, sheen, root, 0, 0.006, 0);
  const gtex = [canvasTex(64, 16, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2, h * 0.28, 0, 0, 7); g.fill(); }),
    canvasTex(48, 48, (g, w, h) => { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(w / 2, 2); g.quadraticCurveTo(w / 2 + 3, h / 2 - 3, w - 2, h / 2); g.quadraticCurveTo(w / 2 + 3, h / 2 + 3, w / 2, h - 2); g.quadraticCurveTo(w / 2 - 3, h / 2 + 3, 2, h / 2); g.quadraticCurveTo(w / 2 - 3, h / 2 - 3, w / 2, 2); g.fill(); })];
  const gm = gtex.map((t) => softMat(t, { opacity: 0.9 }));
  for (const [x, z, sz, turn, kd] of o.glints) card(sz, kd ? sz : sz * 0.28, gm[kd ? 1 : 0], root, x, 0.008, z, turn * DEG);
  return {
    lobes, bobHz, bobK, root, disc,
    apply(ps, t) {
      const b = clamp(ps.bump ?? 0), tt = t || 0;
      for (const l of lobes) {
        l.m.position.y = bobK * Math.sin(TAU * bobHz * tt + l.ph);
        const q = l.touch ? b : 0; l.m.scale.set(1 + 0.04 * q, 1 - 0.10 * q, 1 + 0.04 * q);
      }
    },
  };
}

const LIE_AZ = Math.atan2(-0.79, -0.62), DOCK_AZ = Math.atan2(-0.75, 2.55);
const HOME_GLINTS = [[0.95, 0.75, 0.16, 20, 0], [1.40, -0.20, 0.10, -35, 1], [-0.10, 1.30, 0.20, 8, 0], [0.30, 0.35, 0.09, 0, 1], [-1.70, 0.90, 0.14, -50, 0], [1.75, 1.00, 0.12, 62, 0], [0.70, -1.50, 0.07, 0, 1], [-0.60, 1.80, 0.17, 24, 0], [1.10, 1.55, 0.11, -14, 0]];
const HOUSE_GLINTS = [[0.20, 0.55, 0.12, 25, 0], [-0.90, -0.30, 0.15, -20, 0], [0.80, 0.30, 0.07, 0, 1], [-0.20, 0.95, 0.10, 70, 0], [0.55, -0.85, 0.12, 5, 0]];

// ================================================================== THE BED
function cloudbed(P) {
  const S = P.spec, R0 = rng((S.seed ?? 1) * 313 + 17), top = 0.42, fnB = cloudFn(PAL_BED), mt = cloudMat();
  const g = new THREE.Group(); P.whole.add(g);
  // the mattress: 9 merged puffs, tops 0.37-0.405 so the flat solid top (0.42) stands clear of them
  const rows = [[0.0, 0.42], [0.60, 0.44], [1.15, 0.42]], cols = [[-0.24, 0.395], [0, 0.40], [0.24, 0.395]], mat9 = [];
  for (const [z, rz] of rows) for (const [x, tp] of cols) { const ry = 0.30, j = (R0() - 0.5) * 0.03; mat9.push([x, tp - ry + j, z, 0.36, ry, rz, (R0() - 0.5) * 0.4]); }
  see(mesh(lumpGeo(mat9, fnB, 18, 12), mt, g));
  // the one solid flat top: 0.92 x 1.24, top y 0.42 (a soft ellipse in the same white)
  const sprof = [[0, -0.20], [0.78, -0.18], [0.95, -0.11], [1.0, -0.05], [0.97, -0.012], [0.9, -0.003], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  const sl = new THREE.LatheGeometry(sprof, 48).applyMatrix4(new THREE.Matrix4().makeScale(0.50, 1, 0.66));
  const slm = mesh(paintGeo(sl, fnB), mt, g, 0, top, 0.65); slm.castShadow = false;
  // the pillow: 0.62 x 0.16 x 0.34, two crease strokes painted once on its top
  const creases = [[[-0.20, 0.07], [-0.10, 0.01], [-0.02, -0.04]], [[0.06, 0.09], [0.14, 0.03], [0.24, -0.01]]];
  const pg = softBox(0.62, 0.16, 0.34, 28, 6, 16, 0.5);
  paintGeo(pg, cloudFn(PAL_PILLOW, (c, x, y, z, pal) => {
    if (y < 0.04) return;
    let d = 9; for (const pl of creases) for (let i = 0; i < pl.length - 1; i++) { const [ax, az] = pl[i], [bx, bz] = pl[i + 1], vx = bx - ax, vz = bz - az, u = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - u * vx, z - az - u * vz)); }
    c.lerp(pal.shade, 0.9 * (1 - ss((d - 0.006) / 0.014)));
  }));
  const pil = see(mesh(pg, mt, g, 0, top + 0.075, -0.22)); pil.rotation.x = 0.1;
  // the duvet: 12 flattened puffs over the legs, 5 soft folds painted once as darker lines
  const folds = [[[-0.45, 0.70], [-0.20, 0.79], [0.10, 0.74], [0.42, 0.83]], [[-0.50, 1.00], [-0.15, 0.97], [0.20, 1.06], [0.50, 1.00]], [[-0.40, 1.24], [-0.10, 1.31], [0.25, 1.21], [0.50, 1.28]], [[-0.12, 0.52], [-0.05, 0.90], [-0.13, 1.32]], [[0.28, 0.58], [0.35, 0.95], [0.30, 1.38]]];
  const duv = [];
  [[0.58, 0.27], [0.86, 0.27], [1.14, 0.27], [1.40, 0.25]].forEach(([z, rz], r) => [-0.34, 0, 0.34].forEach((x, c) => duv.push([x + (R0() - 0.5) * 0.04, 0.395 + 0.01 * (r % 2) + (R0() - 0.5) * 0.012, z + (R0() - 0.5) * 0.04, 0.30, 0.065, rz, (R0() - 0.5) * 0.6])));
  const fnD = cloudFn(PAL_BED, (c, x, y, z, pal) => {
    let d = 9; for (const pl of folds) for (let i = 0; i < pl.length - 1; i++) { const [ax, az] = pl[i], [bx, bz] = pl[i + 1], vx = bx - ax, vz = bz - az, u = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - u * vx, z - az - u * vz)); }
    c.lerp(pal.shade, 0.85 * (1 - ss((d - 0.012) / 0.03)));
  });
  see(mesh(lumpGeo(duv, fnD, 26, 16), mt, g));
  // the turned-down fold: one soft roll in a U round the sitter's front (a half ellipse, z up to 0.45) plus its two end puffs; it rises with `cover`
  const fold = new THREE.Group(); g.add(fold);
  const upath = []; for (let i = 0; i <= 24; i++) { const ph = (i / 24) * Math.PI; upath.push(new V3(0.55 * Math.cos(ph), 0, 0.05 + 0.40 * Math.sin(ph))); }
  const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upath), 48, 0.15, 14, false); paintGeo(tg, fnB);
  see(mesh(tg, mt, fold));
  for (const sx of [-1, 1]) see(mesh(lumpGeo([[0, 0, 0, 0.15, 0.15, 0.15, 0]], fnB, 14, 10), mt, fold, sx * 0.55, 0, 0.05));
  // the lump: 3 puffs, 1.05 x 1.25 x 0.95 at full size, the sleeper under it
  const lg = new THREE.Group(); lg.position.set(0, 0.45, 0.05); g.add(lg);
  see(mesh(lumpGeo([[0, 0.15, 0, 0.62, 0.80, 0.56, 0.2], [-0.34, -0.05, 0.28, 0.38, 0.5, 0.38, 0.9], [0.36, -0.10, 0.20, 0.36, 0.46, 0.36, -0.6]], fnD, 24, 16), mt, lg));
  return {
    grip: 0,
    apply(ps) {
      const cv = clamp(ps.cover ?? S.cover ?? 0), ov = clamp(ps.over ?? 0), h = 0.08 + 0.32 * cv, ry = h / 2;
      fold.scale.y = ry / 0.15; fold.position.y = top + ry - 0.02; fold.visible = ov < 0.98;
      lg.visible = ov > 0.02; lg.scale.set(ov, ov, ov);
    },
  };
}

// ================================================================== THE HARP
const HARP = { px: 0.27, x0: -0.24, pitch: 0.045, n: 11, lmin: 0.42, lmax: 1.05, cv: [-0.31, 1.355], vr: 0.09 };
function goldharp(P) {
  const S = P.spec, loop = S.loop ?? 0, hz = snapHz(11, loop), gm = goldMat();
  const gold = (geo) => paintGeo(geo, goldFn);
  const g = new THREE.Group(); P.whole.add(g);
  // stepped base (solid) and the fluted pillar (solid)
  const b1 = mesh(gold(slabXZ(0.30, 0.30, 0.08, 0.03, 0.012)), gm, g, 0.22, 0, 0), b2 = mesh(gold(slabXZ(0.22, 0.22, 0.04, 0.025, 0.008)), gm, g, 0.22, 0.08, 0); b1.castShadow = b2.castShadow = true;
  const pc = new THREE.CylinderGeometry(0.04, 0.04, 1.18, 48, 1, true); pc.translate(0, 0.12 + 0.59, 0);
  { const p = pc.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x), s = 1 - 0.15 * (0.5 - 0.5 * Math.cos(8 * th)); p.setX(i, x * s); p.setZ(i, z * s); } pc.computeVertexNormals(); }
  mesh(gold(pc), gm, g, HARP.px, 0, 0);
  mesh(gold(new THREE.CylinderGeometry(0.053, 0.056, 0.03, 24)), gm, g, HARP.px, 0.135, 0); mesh(gold(new THREE.CylinderGeometry(0.056, 0.05, 0.04, 24)), gm, g, HARP.px, 1.28, 0);
  // the S-curved neck and the volute
  const [vx, vy] = HARP.cv, neckPts = [[HARP.px, 1.30], [0.23, 1.37], [0.13, 1.395], [0.02, 1.35], [-0.10, 1.335], [-0.21, 1.385], [vx, vy + HARP.vr]].map(([x, y]) => new V3(x, y, 0));
  const neck = new THREE.CatmullRomCurve3(neckPts, false, "centripetal");
  see(mesh(gold(new THREE.TubeGeometry(neck, 60, 0.028, 10, false)), gm, g));
  const spiral = []; for (let i = 0; i <= 28; i++) { const u = i / 28, a = Math.PI / 2 + u * Math.PI * 3, r = HARP.vr * (1 - u) + 0.022 * u; spiral.push(new V3(vx + Math.cos(a) * r, vy + Math.sin(a) * r, 0)); }
  see(mesh(gold(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 80, 0.015, 8, false)), gm, g));
  // the strings: tops on the neck's underside, lengths 0.42 .. 1.05, feet on the soundbox's line
  const np = neck.getPoints(400), topAt = (x) => { let best = np[0]; for (const p of np) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p; return best.y - 0.03; };
  const strings = []; for (let i = 0; i < HARP.n; i++) { const x = HARP.x0 + HARP.pitch * i, L = HARP.lmin + (HARP.lmax - HARP.lmin) * (i / (HARP.n - 1)), yt = topAt(x); strings.push({ x, yt, yb: yt - L, ph: ((i * 2654435761) % 1000) / 1000 * TAU }); }
  // the slanted soundbox 0.16 wide, 0.07 deep, its top face on the string feet
  const B0 = new V3(strings[0].x, strings[0].yb, 0), B1 = new V3(strings[HARP.n - 1].x, strings[HARP.n - 1].yb, 0), d = B0.clone().sub(B1).normalize(), nn = new V3(-d.y, d.x, 0);
  const onLine = (x) => B1.clone().addScaledVector(d, (x - B1.x) / d.x), pa = onLine(0.30).addScaledVector(nn, 0.08), pb = onLine(-0.30).addScaledVector(nn, 0.08), mid = pa.clone().add(pb).multiplyScalar(0.5), len = pa.distanceTo(pb);
  const sb = see(mesh(gold(softBox(len, 0.16, 0.07, 24, 4, 3, 0.35)), gm, g, mid.x, mid.y, 0)); sb.rotation.z = Math.atan2(pb.y - pa.y, pb.x - pa.x);   // the box's +x runs along the bar, from the pillar's foot up-left
  see(mesh(gold(new THREE.TubeGeometry(new THREE.LineCurve3(pb.clone().addScaledVector(d, 0.03), new V3(vx, vy - HARP.vr + 0.01, 0)), 6, 0.022, 8, false)), gm, g));
  // six engraved leaf strokes on the soundbox's face, each its own size and turn
  const leafM = new THREE.MeshStandardMaterial({ color: "#b8862a", roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 }); leafM.userData.noHatch = true; leafM.userData.noOutline = true;
  const ang = Math.atan2(d.y, d.x);
  [[0.12, 0.020, 0.085, 0.030, 0.5], [0.28, -0.022, 0.070, 0.024, -0.6], [0.43, 0.015, 0.095, 0.032, 0.2], [0.58, -0.018, 0.075, 0.026, 0.8], [0.73, 0.022, 0.088, 0.028, -0.3], [0.87, -0.012, 0.066, 0.022, 0.4]].forEach(([s, off, L, W, tw]) => {
    const sh = new THREE.Shape(); sh.moveTo(0, -L / 2); sh.quadraticCurveTo(W, 0, 0, L / 2); sh.quadraticCurveTo(-W, 0, 0, -L / 2);
    const lg = new THREE.Mesh(new THREE.ShapeGeometry(sh, 8), leafM), c = pa.clone().lerp(pb, s).addScaledVector(nn, off + 0.0); c.z = 0.0365;
    lg.position.copy(c); lg.rotation.z = ang - Math.PI / 2 + tw; lg.castShadow = false; flat(lg); g.add(lg);
  });
  // the strings: a spindle (two offset copies + a 30 % fill) from fixed phases; no blur
  const strM = basic("#fff6d6", { side: THREE.DoubleSide }), fillM = basic("#fff6d6", { side: THREE.DoubleSide, transparent: true, opacity: 0.30, depthWrite: false });
  const N = 12, idx = (strips) => { const a = []; for (let s = 0; s < strips; s++) for (let i = 0; i < N; i++) { const o = s * (N + 1) * 2 + i * 2; a.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } return a; };
  const parts = strings.map((st) => {
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * (N + 1) * 2 * 3), 3)); lg.setIndex(idx(2));
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3)); fg.setIndex(idx(1));
    const lm = new THREE.Mesh(lg, strM), fm = new THREE.Mesh(fg, fillM); for (const m of [lm, fm]) { m.frustumCulled = false; m.castShadow = false; flat(m); g.add(m); } fm.renderOrder = 3;
    return { st, lg, fg, fm };
  });
  const HW = 0.002, setStrip = (pos, strip, row, xa, xb, y) => { const o = (strip * (N + 1) * 2 + row * 2) * 3; pos.setXYZ(o / 3, xa, y, 0.012); pos.setXYZ(o / 3 + 1, xb, y, 0.012); };
  return {
    grip: 0,
    apply(ps, t) {
      const on = clamp(ps.on ?? S.on ?? 0), pf = clamp(ps.puff ?? S.puff ?? 0), tt = t || 0;
      parts.forEach(({ st, lg, fg, fm }, i) => {
        const A = Math.max(0.012 * on, i === 3 ? 0.03 * pf : 0) * (0.82 + 0.18 * Math.sin(TAU * hz * tt + st.ph)), lp = lg.attributes.position, fp = fg.attributes.position;
        for (let r = 0; r <= N; r++) {
          const u = r / N, y = st.yt + (st.yb - st.yt) * u, w = A * Math.sin(Math.PI * u);
          setStrip(lp, 0, r, st.x - w - HW, st.x - w + HW, y); setStrip(lp, 1, r, st.x + w - HW, st.x + w + HW, y); setStrip(fp, 0, r, st.x - w, st.x + w, y);
        }
        lp.needsUpdate = fp.needsUpdate = true; fm.visible = A > 0.0004;
      });
    },
  };
}

// ================================================================== THE NEIGHBOUR
function cloudhouse(P) {
  const S = P.spec, loop = S.loop ?? 0, fn = cloudFn(PAL_BED), mt = cloudMat(), R0 = rng((S.seed ?? 2) * 211 + 5);
  const isl = buildIsland(P, { R: 1.5, nLobes: 9, lobeR: [0.35, 0.60], top: [0.04, 0.19], nBody: 14, depth: 1.2, seed: 7, glints: HOUSE_GLINTS, gaps: [{ az: Math.atan2(1.10, -3.75), w: 1.0, rx: 0.55, rz: 0.38, edge: 1.40, dock: true }] });
  // the house: 12 merged puffs round (0.30, -0.30), r 0.85, 1.25 high
  const C = [0.30, -0.30], h = new THREE.Group(); h.position.set(C[0], 0, C[1]); P.whole.add(h);
  const lumps = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; lumps.push([Math.cos(a) * 0.5, 0.40, Math.sin(a) * 0.5, 0.36, 0.40, 0.36, R0() * TAU]); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.9; lumps.push([Math.cos(a) * 0.30, 0.85, Math.sin(a) * 0.30, 0.34, 0.34, 0.34, R0() * TAU]); }
  lumps.push([0, 0.92, 0, 0.42, 0.33, 0.42, 0.4]);
  see(mesh(lumpGeo(lumps, fn, 18, 12), mt, h));
  // the door (round-topped, 0.46 x 0.70) facing the ride point, gold knob
  const azd = Math.atan2(0.85, -1.05), wood = new THREE.MeshStandardMaterial({ color: "#d9a25a", roughness: 0.65 }), woodD = new THREE.MeshStandardMaterial({ color: "#b8803e", roughness: 0.7 });
  const dsh = new THREE.Shape(); dsh.moveTo(-0.23, 0); dsh.lineTo(0.23, 0); dsh.lineTo(0.23, 0.47); dsh.absarc(0, 0.47, 0.23, 0, Math.PI, false); dsh.lineTo(-0.23, 0);
  const door = new THREE.Group(); door.position.set(Math.cos(azd) * 0.80, 0, Math.sin(azd) * 0.80); door.rotation.y = Math.PI / 2 - azd; h.add(door);
  see(mesh(new THREE.ExtrudeGeometry(dsh, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 14 }), wood, door, 0, 0, -0.01));
  see(mesh(new THREE.BoxGeometry(0.012, 0.52, 0.012), woodD, door, 0, 0.30, 0.1)); see(mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: "#e8b93a", roughness: 0.35, metalness: 0.2 }), door, 0.14, 0.33, 0.115));
  // the window: r 0.16 lit, a cross bar and a rim, on the front right
  const azw = 1.08, win = new THREE.Group(); win.position.set(Math.cos(azw) * 0.80, 0.80, Math.sin(azw) * 0.80); win.rotation.y = Math.PI / 2 - azw; h.add(win);
  const lit = new THREE.MeshStandardMaterial({ color: "#ffd76a", emissive: col("#ffd76a"), emissiveIntensity: 0.9, roughness: 0.5 });
  see(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 28).rotateX(Math.PI / 2), lit, win, 0, 0, 0.01));
  see(mesh(new THREE.TorusGeometry(0.16, 0.014, 8, 28), wood, win, 0, 0, 0.045)); see(mesh(new THREE.BoxGeometry(0.32, 0.018, 0.02), wood, win, 0, 0, 0.05)); see(mesh(new THREE.BoxGeometry(0.018, 0.32, 0.02), wood, win, 0, 0, 0.05));
  // the stub chimney and its one puff of smoke
  const chA = -0.6, cx = Math.cos(chA) * 0.30, cz = Math.sin(chA) * 0.30, brick = new THREE.MeshStandardMaterial({ color: "#c98f64", roughness: 0.8 });
  see(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.30, 14), brick, h, cx, 1.18, cz)); see(mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.04, 14), new THREE.MeshStandardMaterial({ color: "#e8c08e", roughness: 0.8 }), h, cx, 1.35, cz));
  const smoke = new THREE.Group(); smoke.position.set(cx, 1.5, cz); h.add(smoke);
  see(mesh(lumpGeo([[0, 0, 0, 0.075, 0.06, 0.07, 0.3], [0.05, 0.07, 0.01, 0.055, 0.045, 0.05, 0.9]], cloudFn(cloudPal("#ffffff", "#e4e8f4", null, null)), 14, 10), mt, smoke));
  const sHz = snapHz(0.35, loop);
  return {
    grip: 0,
    apply(ps, t) {
      isl.apply(ps, t); const tt = t || 0;
      smoke.position.set(cx + 0.015 * Math.sin(TAU * sHz * tt + 0.6), 1.5 + 0.03 * Math.sin(TAU * sHz * tt + 1.0), cz); smoke.scale.setScalar(1 + 0.06 * Math.sin(TAU * sHz * tt + 2.1));
    },
  };
}

// ================================================================== THE DAWN SKY
const DAWN = [[-5, "#ffd9a8"], [0, "#ffcfa6"], [4, "#f6b7c4"], [10, "#d7b3e6"], [18, "#b3a6e8"], [30, "#9fb0ee"]];
const D_R = 30, D_Y0 = -5, D_Y1 = 40;
const hexRGB = (c) => { const k = col(c); return [k.r * 255, k.g * 255, k.b * 255]; };
const SEA_LUMPS = [[0, 0, 0, 1.0], [0.85, -0.12, 0.1, 0.72], [-0.8, -0.1, -0.15, 0.68], [0.2, 0.42, 0.1, 0.62], [-0.35, 0.3, 0.35, 0.5], [0.45, -0.05, 0.55, 0.5]];
function seaPuffGeo() {
  const top = col("#fbeef0"), shade = col("#e7c9dc"), hi = col("#ffe9c4");
  const fn = (c, n) => { c.copy(shade).lerp(top, ss((n.y + 0.12) / 0.34)); c.lerp(hi, 0.75 * ss((n.dot(SUN) * 0.9 + n.y * 0.4 - 0.45) / 0.3)); };
  return lumpGeo(SEA_LUMPS.map(([x, y, z, k]) => [x, y, z, k, k, k]), fn, 14, 10);
}
function dawnsky(P) {
  const S = P.spec, loop = S.loop ?? 0, spd = S.speed ?? 1, bobHz = snapHz(0.2, loop), [hx, hz] = S.hatch ?? [-11.15, -13.70], bearing = Math.atan2(hz, hx), gapA = (S.gapDeg ?? 28) * DEG, gapR = S.gapR ?? 22;
  // the drum: one vertical gradient by height + the sun glow, one texture
  const TW = 1024, TH = 512, hOf = (j) => D_Y1 - (D_Y1 - D_Y0) * (j / (TH - 1));
  const tex = canvasTex(TW, TH, (g, w, h) => {
    const im = g.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      const y = hOf(j); let a = DAWN[0], b = DAWN[0];
      if (y >= DAWN[DAWN.length - 1][0]) a = b = DAWN[DAWN.length - 1]; else if (y > DAWN[0][0]) for (let i = 0; i < DAWN.length - 1; i++) if (y >= DAWN[i][0] && y <= DAWN[i + 1][0]) { a = DAWN[i]; b = DAWN[i + 1]; break; }
      const kk = a === b ? 0 : (y - a[0]) / (b[0] - a[0]), A = hexRGB(a[1]), B = hexRGB(b[1]);
      for (let i = 0; i < w; i++) { const o = (j * w + i) * 4; im.data[o] = A[0] + (B[0] - A[0]) * kk; im.data[o + 1] = A[1] + (B[1] - A[1]) * kk; im.data[o + 2] = A[2] + (B[2] - A[2]) * kk; im.data[o + 3] = 255; }
    }
    g.putImageData(im, 0, 0);
    // the sun: no disc, a soft glow 30 degrees wide at the back right (theta from +z toward +x: 135 degrees), low
    const sx = (135 / 360) * w, sy = ((D_Y1 - 1.5) / (D_Y1 - D_Y0)) * h;
    g.save(); g.translate(sx, sy); g.scale((30 / 360) * w * 0.9, 0.12 * h * 1.1, 1);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, "rgba(255,241,194,0.45)"); gr.addColorStop(0.5, "rgba(255,241,194,0.2)"); gr.addColorStop(1, "rgba(255,241,194,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
  });
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const part = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.set(0, y, 0); o.renderOrder = -10; o.frustumCulled = false; flat(o); P.whole.add(o); return o; };
  part(new THREE.CylinderGeometry(D_R, D_R, D_Y1 - D_Y0, 72, 1, true), basic("#ffffff", { map: tex, side: THREE.BackSide }), (D_Y0 + D_Y1) / 2);
  part(new THREE.CircleGeometry(D_R, 48).rotateX(Math.PI / 2), basic("#9fb0ee", { side: THREE.DoubleSide }), D_Y1);
  // the cloud sea: 60 opaque two-tone puffs in two instanced draws of 30; none in the window toward the hatch (r <= gapR), none within 3.5 m of the island's axis
  const R1 = rng((S.seed ?? 1) * 4093 + 31), wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x)), puffs = [];
  for (let j = 0; j < 60; j++) {
    for (let tr = 0; tr < 80; tr++) {
      const rho = 9 + 19 * (((j * 0.381966 + 0.07 * tr) % 1 + 1) % 1) * (tr < 20 ? 1 : R1()), ang = (j * 2.399963 + 0.7 + 0.5 * tr + (R1() - 0.5) * 0.4) % TAU;
      const r = 1.6 + 1.1 * R1(), sx = 0.9 + 0.35 * R1(), sz = 0.85 + 0.35 * R1(), y = -3.5 + 1.5 * Math.pow(R1(), 1.5), sy = Math.min(0.42 + 0.3 * R1(), (-1.6 - y) / (1.04 * r));
      if (sy < 0.2 || r * sx * 1.57 > rho - 3.5) continue;
      // the puff's whole reach (its lumps reach 1.57 r sideways) stays out of the window toward the hatch, out to r gapR
      const reachM = r * Math.max(sx, sz) * 1.57;
      if (rho - reachM < gapR && Math.abs(wrap(ang - bearing)) < gapA + Math.atan2(reachM, rho)) continue;
      puffs.push({ x: Math.cos(ang) * rho, y, z: Math.sin(ang) * rho, r, sx, sy, sz, turn: R1() * TAU, ph: R1() * TAU }); break;
    }
  }
  if (puffs.length !== 60) throw new Error(`dawnsky: placed ${puffs.length} of 60 sea puffs`);
  const seaM = basic("#ffffff", { vertexColors: true }), pg = seaPuffGeo(), draws = [0, 1].map((k) => {
    const im = new THREE.InstancedMesh(pg, seaM, 30); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = im.receiveShadow = false; flat(im); im.renderOrder = k;
    const c = new THREE.Color(); for (let i = 0; i < 30; i++) { const kk = 0.95 + 0.1 * ((((k * 30 + i) * 7919) % 100) / 100); im.setColorAt(i, c.setRGB(kk, kk, kk)); }
    P.whole.add(im); return { im, list: puffs.slice(k * 30, k * 30 + 30) };
  });
  // seven far islands on the drum, one with a tiny house (unlit, fixed)
  const far = [[-165, 1.5, 1.0], [-142, 4.2, 1.7], [-122, -0.4, 0.9], [-68, 5.6, 1.2], [-54, 2.0, 2.0], [-33, 0.6, 1.5], [-14, 4.0, 0.8]], farM = basic("#ffffff", { vertexColors: true }), fnF = cloudFn(cloudPal("#fbeef0", "#e7c9dc", "#ffe9c4", "#f2c0cc"));
  far.forEach(([az, y, wd], i) => {
    const a = wd / 2, lumps = [[0, 0, 0, a * 0.55, a * 0.2, a * 0.45, i], [a * 0.5, -a * 0.03, 0.05, a * 0.36, a * 0.16, a * 0.34, i + 0.6], [-a * 0.46, -a * 0.04, -0.04, a * 0.32, a * 0.15, a * 0.3, i - 0.5], [a * 0.12, a * 0.1, -a * 0.1, a * 0.3, a * 0.17, a * 0.28, 0.2]];
    const m = new THREE.Mesh(lumpGeo(lumps, fnF, 14, 8), farM); const th = az * DEG; m.position.set(Math.cos(th) * 27.5, y, Math.sin(th) * 27.5); m.rotation.y = -th + Math.PI / 2; m.frustumCulled = false; flat(m); P.whole.add(m);
    if (i === 4) {   // the tiny house: a round cottage on top with a door and a cone roof
      const hg = new THREE.Group(); hg.position.set(m.position.x, y + a * 0.22, m.position.z); hg.rotation.y = m.rotation.y; P.whole.add(hg);
      for (const [geo, c, yy] of [[new THREE.CylinderGeometry(0.17, 0.19, 0.2, 12), "#f7f9fd", 0.1], [new THREE.ConeGeometry(0.23, 0.17, 12), "#d9a25a", 0.285]]) { const q = new THREE.Mesh(geo, basic(c)); q.position.y = yy; q.castShadow = false; flat(q); hg.add(q); }
      const dr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.11), basic("#c98f64")); dr.position.set(0, 0.07, 0.19); flat(dr); hg.add(dr);
    }
  });
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new V3(), s = new V3();
  const drift = (t) => (loop > 0 ? -((0.02 * spd * loop) / TAU) * Math.sin((TAU * t) / loop) : -0.02 * spd * t);
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t || 0, dx = drift(tt);
      for (const { im, list } of draws) {
        for (let i = 0; i < list.length; i++) { const c = list[i]; p.set(c.x + dx, c.y + 0.02 * Math.sin(TAU * bobHz * tt + c.ph), c.z); q.setFromAxisAngle(UP, c.turn); s.set(c.r * c.sx, c.r * c.sy, c.r * c.sz); im.setMatrixAt(i, M.compose(p, q, s)); }
        im.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

// ================================================================== THE WET FOOT
function sockwell(P) {
  const S = P.spec, loop = S.loop ?? 0, rHz = snapHz(0.3, loop), g = new THREE.Group(); P.whole.add(g);
  const dimple = canvasTex(128, 128, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(207,217,230,1)"); gr.addColorStop(0.72, "rgba(207,217,230,0.95)"); gr.addColorStop(1, "rgba(207,217,230,0)");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(168,184,208,0.85)"; c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.36, 3.4, 5.5); c.stroke();   // the hollow's shaded far lip, drawn once
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 4; c.beginPath(); c.arc(w / 2, h / 2, w * 0.33, 0.45, 1.9); c.stroke();   // its lit near lip
  });
  const dimM = softMat(dimple), ringM = basic("#a9d8ea", { transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }), beadM = basic("#e6f6fb");
  const dm = card(0.32, 0.32, dimM, g, 0, 0.004, 0);
  const fm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 8, 0, TAU, 0, Math.PI / 2), basic("#bfe6f2", { transparent: true, opacity: 0.55, depthWrite: false }));   // the film: an unlit lens 0.19 across and 0.035 high, FIXED 55 %
  fm.renderOrder = 4; fm.castShadow = false; flat(fm); g.add(fm);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.984, 1.0, 48).rotateX(-Math.PI / 2), ringM); ring.position.y = 0.007; ring.renderOrder = 5; flat(ring); g.add(ring);
  const beads = [[0.9, 0.5, 0.011, 0.30], [2.2, 0.8, 0.008, 0.38], [3.5, 0.6, 0.014, 0.46], [4.5, 0.7, 0.009, 0.54], [5.6, 0.9, 0.012, 0.62]].map(([a, k, r, st]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), beadM); b.castShadow = false; flat(b); g.add(b); return { b, a, k, r, st }; });
  return {
    grip: 0,
    apply(ps, t) {
      const on = clamp(ps.on ?? S.on ?? 0), tt = t || 0, fr = 0.10 + 0.09 * ss(on);
      dm.visible = on > 0.02; dm.scale.setScalar(0.4 + 0.6 * ss(on / 0.8));
      fm.visible = on > 0.02; fm.scale.set(fr, 0.035 * ss(on / 0.7), fr);   // grown by scale, never faded
      const rr = 0.19 + 0.10 * ss((on - 0.3) / 0.7) + 0.004 * Math.sin(TAU * rHz * tt); ring.visible = on > 0.3; ring.scale.setScalar(rr);
      for (const { b, a, k, r, st } of beads) {
        const u = clamp((on - st) / 0.55); b.visible = u > 0.02 && u < 0.98;
        const rad = fr * (0.55 + 0.4 * k) * (1 + 0.1 * u); b.position.set(Math.cos(a) * rad, r + 0.03 * Math.sin(Math.PI * u), Math.sin(a) * rad);
      }
    },
  };
}

// ================================================================== THE ISLAND KIND
function homeisland(P) {
  const isl = buildIsland(P, { R: 2.6, nLobes: 16, lobeR: [0.35, 0.60], top: [0.05, 0.25], nBody: 22, depth: 1.5, seed: 3, glints: HOME_GLINTS,
    gaps: [{ az: LIE_AZ, w: 1.0, rx: 0.55, rz: 0.40, edge: 2.68 }, { az: DOCK_AZ, w: 1.4, rx: 0.75, rz: 0.45, edge: 2.62, dock: true }] });
  return { grip: 0, apply: (ps, t) => isl.apply(ps, t) };
}

export const HHOME_KINDS = { homeisland, cloudbed, goldharp, cloudhouse, dawnsky, sockwell };
export const HHOME_GRIPS = {};
