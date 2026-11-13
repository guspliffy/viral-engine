import * as THREE from "three";
import { clamp, lerp } from "./util.js";

// What if you could teleport? (what-if EP09, wedding rings, 13 Nov 2026): the hand props and wearables. The design is
// storyboards/series/what-if/09-teleport-rings/DESIGN.md sections 3, 5; the look is its board.png. Everything is a pure
// function of the params and the clip time (hashes, no Math.random, no wall clock). Metres. +z is a prop's front. No
// letters or numerals on any prop; realistic (no sparkle, no glow fx). The set (garden, hall) is props-wedding-set.js.
// Registered in props3d.js as WEDDING_KINDS (no named grips: every hold comes from storyboards/lib/grips.mjs SIZE).
//
// A param that propState (props3d.js) has no default for (rings, swing, ...) reads spec.<name> until a tween sets it, and the
// first tween of such a key JUMPS: seed it with a dur-0 `set` at time 0, then tween. lid, spin, puff and fall have defaults.
//
//   ringbox     the velvet ring box (board 02, 08). ORIGIN = bottom centre. Front (+z) = the side it opens to. Base 0.18 w x
//               0.07 h x 0.15 d (corners r 0.022), the lid hinged on the base's top back edge (y 0.070, z -0.075): 0.135 tall
//               shut, the lid's crown 0.015. Velvet #8e1b2b (shade #5e0f1c), a lighter 0.01 band #b33a4c on every outside edge,
//               a gold line #e3b23c on both rims, a gold clasp 0.016 x 0.012 in front, two small hinges. Inside all velvet: lid
//               lining #6a1220, cushion top y 0.055 #7a1626, ONE valley 0.12 x 0.035 (floor y 0.020, #3a0710). Solid.
//               spec  rings 0    0 | 1 | 2: rings of 3.2 standing in the valley at x -0.028 (z +0.012, first) and x +0.028
//                                (z -0.012), leaning back 35 degrees, lowest point y 0.022, top y 0.118 (9 mm under the shut lid)
//               param lid   0    0..1 = 0..105 degrees (spec.lid is its start)
//                     rings      is a spec key: set it with a prop tween (it steps; seed it at t 0 to tween nothing)
//               Hold: grips.box (SIZE.ringbox w 0.18 h 0.07 d 0.15): two palms on the BASE's short ends, never the lid; one hand =
//               grips.mug from behind at half the base's height ({ height: 0.5 }); presented = a flat palm under it.
//   goldring    one wide plain wedding band: ORIGIN = ITS CENTRE. Outer radius 0.048 (0.096 across), wall 0.012, 0.030 wide,
//               edges rounded 0.004. Gold #f6c21c, shade #c98a12 (the inside), a fixed painted pale band #fff3b0 on the upper
//               outer quarter, a little emissive, ink #7a4a00. Solid. At rest it LIES FLAT (axis +y): put its y 0.015 above the
//               surface. Stands (axis +z, the hole to the camera) with spec.up true.
//               spec  up   false  stand it on edge (a hold, the box's valley, a glove); spin is then ignored
//                     n    1      2 = the pair as ONE prop (ORIGIN = the surface under their middle, no spin):
//                     pose "lean"  ring A flat at (-0.022, 0.015, 0), ring B leaning on it at 60 degrees, centre (0.030, 0.049, -0.005)
//                          "link"  both standing, holes to +z, centres (-0.026, 0.048, 0.016) and (0.026, 0.048, -0.016)
//                     seed 0.13  the spin's start direction (turns of the tilt direction; the director uses 0.13 and 0.61)
//                     T 2.2, a0 38, turns 9   the rattle's length (s), first tilt (degrees), turns of the tilt direction
//               param spin  spec.spin or 0   seconds since touchdown; below 0 or 0 = at rest. Tween it linearly 0 -> T over T
//                     seconds from the landing frame: tilt = a0 min(1, spin/0.10) (1-u)^0.6 (one edge kicks up in 3 frames, then
//                     sinks), the tilt direction turns 360 (seed + turns (1 - (1-u)^0.5)) degrees, the lowest rim point stays on the
//                     surface, the centre circles 0.048 (1 - cos tilt) off its rest spot.
//               Hold: grips.thin, SIZE goldring { len: -0.08, r: 0.015 } = the thin pinch at the rim's bottom point (from 0.6) with
//               spec.up true; the pair (n 2): grips.thin with { from: 0 } at the pair's bottom for "link"; "lean" lies on a palm.
//               Drop body { shape: "box", bounce: 0.2, friction: 0.9 } (the single ring, flat).
//   bowtie      a small satin bow tie, black by default: the host's hpbowtie lobes (props-hotpotato.js, not edited) at scale 0.56,
//               ORIGIN = THE KNOT'S CENTRE. 0.20 wide x 0.095 tall, lobes 0.025 thick, knot 0.039 x 0.053 x 0.055. Faces +z.
//               DO NOT set scale 0.56: scale 1 is the board's tie. WORN: spec.wear = "spud", x 0, y 0.47, z 0.335 (the knot on
//               the collar roll; nudge on the bench); LOOSE (no wear): the body is a box 0.20 x 0.095 x 0.05, it can be held or
//               dropped. Solid.
//               spec  color  "#201e26"  the lobes; omit for the black tie: lobes #201e26, a satin streak #585466 along each lobe's
//                            upper third, knot #17151c, ink #0e0d12. With a colour: the streak is that colour 30 % to white, the
//                            knot 0.72 x, the ink 0.45 x.
//                     sheen  1  0..1 the streak's strength
//               Hold: grips.mug(c, who, TIE, { height: 0 }): SIZE.bowtie { r: 0.028, h: 0.053 }, a fist round the knot, the lobes
//               out both sides (the origin is the knot's centre, so heights run -0.027..0.027).
//   flowerpin   a five-petal daisy 0.09 across, 0.02 thick (petals #fdfbf5 / shade #e6dfd2, centre #f2b632 0.024, one leaf #5d9a4a
//               0.05 behind it, ink #6a5a48). ORIGIN = ITS CENTRE, faces +z. WORN: spec.wear = "chip", x 0.14, y 0.33, z 0.235 (his
//               left chest, left of the left drawstring, 0.02 under the cowl roll, clear of the face). Solid.
//   bouquet     round white daisy bouquet. ORIGIN = THE HANDLE'S BOTTOM, handle up +y: handle 0.09 long r 0.016 under a white ribbon
//               wrap with two short tails, a dome 0.20 across x 0.13 on top: 12 daisies r 0.028 (#fdfbf5, centres #f2b632) and a
//               ring of leaves #3f7a3c / #5d9a4a. 0.22 tall. Solid. Hold: grips.mug, SIZE.bouquet { r: 0.016, h: 0.09 } (one fist on
//               the handle at 0.06 up, the other glove under the dome).
//   bridalveil  the veil. WORN: spec.wear = "mash", x 0, y 0, z 0 (the numbers are in her frame, spec.body [0.54, 1.24, 0.50]).
//               From the crown (0, 1.37, -0.03), behind her leaf: ONE sheet falls over both sides and down the back, 0.03 off the
//               body: half-width 0.10 at y 1.37, body + 0.03 at y 1.10 (0.30), growing to 0.43 at y 0.28; its front edges stay
//               behind the plane z -0.02, so her face, leaf and headphone cups are clear. 6 soft folds, a lace band 0.035 along both
//               front edges and the hem (scalloped, one row of dot holes #d9dfe8). Opaque cel cloth #fbf7ef, shade #d9dfe8, ink
//               #9aa3b5. GHOST (userData.steam, solid false: the checks see through it), casts no shadow.
//               param swing  spec.swing or 0   -1..1 = +-6 degrees, the whole veil sways sideways about the crown (a seed + tween key)
//               Hem flutter 1.5 degrees at 0.9 Hz, always (a function of the clip time, the hem only moves BACK, never forward).
//   spudleaf    Spud's sprout as a loose prop: stem 0.07 (r 0.012-0.016) + ONE leaf 0.15 long x 0.11 wide x 0.014 thick, #6cbf3a, rib
//               #4b8629, exactly costumes.js's. ORIGIN = THE STEM'S BASE. "A leaf on the air". Leave x, y, z at 0 and rot 0, scale 1
//               (or put x, y, z at `from`): it places itself in WORLD metres relative to its own x, y, z. Solid.
//               spec  from  [0.40, 1.02, 1.80]  LEAF_FROM (the base of the stem, where it stood on his head)
//                     to    [1.05, 0.50, 1.97]  LEAF_LAND (the surface: the leaf lies on it, CENTRED, 0.007 up, rib up, tip +z, the
//                                              stem's base 0.11 behind `to`)
//               param show  1   0 hides it (before the vanish frame, while the head leaf is still on him)
//               param fall  0   0..1, tween it linearly over 1.6 s after the 3-frame hang. At 0 it stands exactly as on his head
//                     (leaf turn -0.15, 0.25, -0.5 rad): no pop. place = lerp(from, to, fall) + 0.07 sin(2 pi 2.5 fall)(1-fall)
//                     across the path (in the picture plane) + 0.10 sin(pi fall) toward +z; height = from.y + (to.y - from.y)
//                     (fall - 0.028 sin(4 pi 2.5 fall)(1 - fall)) (it stalls at each swing's end, never rises); rolls
//                     35 sin(2 pi 2.5 fall)(1-fall) degrees into each slide and turns 200 x fall degrees; over the last 15 % it lays over.
//   dustring    the board's ring of round cream puffs on the ground. ORIGIN = THE GROUND UNDER HIS FEET. n soft round sprites
//               (camera-facing, no ink outline, no shadow, ghost) on a ring: angle i/n x 360 + hash x 8 degrees, radius x 0.92-1.08.
//               param puff  spec.puff or 0   0..1, linear: tween it over the duration. radius r0 -> r1 as (1-e^(-4 puff))/(1-e^-4),
//                     size s0 -> s1, centre height 0.04 -> 0.09, alpha a x min(1, puff x 8) x (1 - puff)^1.5 (0 at puff 0 and 1: it
//                     is invisible at rest); nothing above y 0.20.
//               spec  mode "leave" (default): n 14, r 0.30 -> 0.60, size 0.12 -> 0.22, a 0.70, tween 0.50 s
//                     mode "arrive":            n 10, r 0.20 -> 0.42, size 0.09 -> 0.16, a 0.50, tween 0.35 s
//                     n, r0, r1, s0, s1, a: override any of those. surface "lawn" (default: cream #efe3c6, shade #d9cba8) | "boards"
//                     (#f3eada, shade #ddd0b8); color, shade: override. seed 0: the puffs' own turn.

export const WEDDING_KINDS = {};

const DEG = Math.PI / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const ghost = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const h1 = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (u) => { const k = clamp(u); return k * k * (3 - 2 * k); };
const C = (hex) => new THREE.Color(hex);
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---- geometry helpers ---------------------------------------------------------------------------------------------
const flat = (g) => (g.index ? g.toNonIndexed() : g);
// per-vertex colour from a function (nx, ny, nz, x, y, z) -> "#hex" | THREE.Color
function recolor(g, fn) {
  const n = g.attributes.normal, p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    let c = fn(n.getX(i), n.getY(i), n.getZ(i), p.getX(i), p.getY(i), p.getZ(i), i); if (typeof c === "string") c = C(c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); return g;
}
const paint = (g, hex) => recolor(g, () => hex);
// non-indexed merge of position, normal, uv, colour (missing ones are filled)
function merge(list) {
  const pos = [], nor = [], uv = [], col = [];
  for (const g0 of list) {
    const g = flat(g0), p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      col.push(c ? c.getX(i) : 1, c ? c.getY(i) : 1, c ? c.getZ(i) : 1);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return out;
}
function rrPath(p, w, d, r) {
  const x = w / 2, y = d / 2; r = Math.min(r, x, y);
  p.moveTo(-x + r, -y); p.lineTo(x - r, -y); p.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); p.lineTo(x, y - r);
  p.absarc(x - r, y - r, r, 0, Math.PI / 2, false); p.lineTo(-x + r, y); p.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(-x, -y + r); p.absarc(-x + r, -y + r, r, Math.PI, 1.5 * Math.PI, false); return p;
}
// a rounded-rectangle slab, y 0..h (optional hole = a rounded rectangle through it), flat-shaded, non-indexed
function slab(w, d, r, h, hole = null) {
  const s = rrPath(new THREE.Shape(), w, d, r);
  if (hole) s.holes.push(rrPath(new THREE.Path(), hole.w, hole.d, hole.r));
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); return flat(g);
}
// a rounded-rectangle plate (w x d, corners r) as a grid in y = 0 facing up (or down), for the lid's crown
function gridPlate(w, d, r, nx, nz, up = true) {
  const g = new THREE.PlaneGeometry(w, d, nx, nz), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i); const ax = Math.abs(x) - (w / 2 - r), ay = Math.abs(y) - (d / 2 - r);
    if (ax > 0 && ay > 0) { const l = Math.hypot(ax, ay); if (l > r) { x = Math.sign(x) * (w / 2 - r + (ax * r) / l); y = Math.sign(y) * (d / 2 - r + (ay * r) / l); } }
    p.setXYZ(i, x, y, 0);
  }
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); return g;
}

// ---- the ring (shared by goldring and ringbox) ----------------------------------------------------------------------
const RING = { R: 0.048, W: 0.012, H: 0.030, e: 0.004 };
function ringGeo() {
  const { R, W, H, e } = RING, ri = R - W, hw = H / 2, pts = [], arc = (cx, cy, a0, a1) => { for (let k = 0; k <= 4; k++) { const a = a0 + ((a1 - a0) * k) / 4; pts.push(new THREE.Vector2(cx + e * Math.cos(a), cy + e * Math.sin(a))); } };
  arc(R - e, -hw + e, -Math.PI / 2, 0);              // outer-bottom corner (the profile runs counter-clockwise in (r, y))
  arc(R - e, hw - e, 0, Math.PI / 2);                // outer-top
  arc(ri + e, hw - e, Math.PI / 2, Math.PI);         // inner-top
  arc(ri + e, -hw + e, Math.PI, 1.5 * Math.PI);      // inner-bottom
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, 56), gold = C("#f6c21c"), shade = C("#c98a12"), pale = C("#fff3b0");
  return recolor(g, (nx, ny, nz, x, y, z) => {
    const rad = Math.hypot(x, z), ang = Math.atan2(z, x);
    let d = Math.abs(ang + Math.PI / 2); if (d > Math.PI) d = 2 * Math.PI - d;     // from -z (the "upper" side once it stands)
    const band = (1 - sm((d - 35 * DEG) / (20 * DEG))) * sm((rad - 0.0405) / 0.006) * (0.55 + 0.45 * sm((y + 0.015) / 0.03));
    const inner = 1 - sm((rad - (ri + 0.0015)) / 0.004);
    return gold.clone().lerp(shade, inner * 0.95).lerp(pale, band);
  });
}
let RING_GEO = null;
function ringMat() {
  const m = mat("#ffffff", { vertexColors: true, roughness: 0.36, metalness: 0.15, emissive: C("#7a5200"), emissiveIntensity: 0.25 });
  m.userData.lineColor = "#7a4a00"; return m;
}
function ringMesh(parent) { RING_GEO ??= ringGeo(); return mesh(RING_GEO, ringMat(), parent); }

// ---- the daisy (flowerpin, bouquet) -----------------------------------------------------------------------------------------
// parts of one daisy of radius `rad` (0.045 = the pin), as geometries already placed by `m` (a Matrix4: the daisy faces +z)
function daisyParts(m, rad = 0.045, leaf = false, turn = 0) {
  const k = rad / 0.045, list = [], white = C("#fdfbf5"), shade = C("#e6dfd2"), yellow = C("#f2b632"), yDark = C("#d79a1c");
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * Math.PI * 2, g = new THREE.SphereGeometry(1, 12, 9);
    g.scale(0.0185 * k, 0.0165 * k, 0.008 * k); g.rotateZ(0); g.translate(0.0275 * k, 0, 0); g.rotateZ(a);
    recolor(g, (nx, ny, nz, x, y, z) => { const r = Math.hypot(x, y) / k; return shade.clone().lerp(white, sm((r - 0.012) / 0.03)); });
    list.push(g);
  }
  const c = new THREE.SphereGeometry(1, 14, 10); c.scale(0.012 * k, 0.012 * k, 0.0085 * k); c.translate(0, 0, 0.0035 * k);
  list.push(recolor(c, (nx, ny, nz) => yellow.clone().lerp(yDark, sm(0.5 - nz * 0.8))));
  if (leaf) {
    const g = new THREE.SphereGeometry(1, 12, 8); g.scale(0.026 * k, 0.012 * k, 0.003 * k); g.translate(0.03 * k, 0, -0.011 * k); g.rotateZ(-125 * DEG + turn * 0.0);
    list.push(recolor(g, () => "#5d9a4a"));
  }
  return list.map((g) => { const o = flat(g); o.applyMatrix4(m); return o; });
}
// the unit leaf of costumes.js (the portraits' sprout): w half width, len, thick
function leafGeometry(w, len, thick) {
  const g = new THREE.SphereGeometry(1, 24, 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (y + 1) / 2;
    const taper = Math.sin(Math.PI * Math.min(1, 0.08 + k * 0.92)) ** 0.8 * (1 - 0.35 * k);
    p.setXYZ(i, x * w * taper, k * len, z * thick * taper + 0.25 * thick * (x * x));
  }
  g.computeVertexNormals(); return g;
}

// ---- bow tie: the hpbowtie lobes (props-hotpotato.js) at scale 0.56, black ------------------------------------------------------
const TIE = { w: 0.36, h: 0.17, knot: 0.03, thick: 0.045 }, TIE_K = 0.56;
function tieLobe(side) {
  const NU = 26, NV = 14, W0 = TIE.knot, W1 = TIE.w / 2, pos = [], uv = [], rim = [], vv = [], uu = [], idx = [];
  for (const face of [1, -1]) {
    const base = pos.length / 3;
    for (let iu = 0; iu <= NU; iu++) for (let iv = 0; iv <= NV; iv++) {
      const u = iu / NU, v = (iv / NV) * 2 - 1, s = u > 0.78 ? (u - 0.78) / 0.22 : 0;
      const cap = Math.pow(Math.max(0, 1 - Math.pow(s, 4)), 0.25);
      const hh = lerp(0.034, TIE.h / 2, sm(u * 1.15)) * cap, x = side * (W0 + (W1 - W0) * u), y = v * hh;
      const z = face * TIE.thick * Math.pow(Math.max(0, 1 - v * v), 0.5) * cap * (0.78 + 0.22 * Math.sin(Math.PI * u)) * (1 - 0.14 * Math.exp(-v * v * 14));
      pos.push(x, y, z); uv.push((x + TIE.w / 2) / TIE.w, (y + TIE.h / 2) / TIE.h); rim.push(Math.max(Math.abs(v), s)); vv.push(v); uu.push(u);
    }
    for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
      const a = base + iu * (NV + 1) + iv, b = a + 1, c = a + NV + 1, d = c + 1;
      if (face * side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  return { pos, uv, rim, vv, uu, idx };
}

// ---- dust sprites -------------------------------------------------------------------------------------------------------
const BB_VERT = `uniform float uR; varying vec2 vUv;
  void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`;
const DUST_FRAG = `uniform float uA, uSeed; uniform vec3 uCol, uShade; varying vec2 vUv;
  float disc(vec2 p, vec2 c, float r) { return length(p - c) - r; }
  void main() {
    vec2 q = (vUv - 0.5) * 2.0; float up = q.y, s = sin(uSeed * 6.2832), c0 = cos(uSeed * 6.2832);
    vec2 p = mat2(c0, -s, s, c0) * q;
    float d = disc(p, vec2(0.0), 0.5);
    for (int i = 0; i < 5; i++) { float a = float(i) * 1.2566 + uSeed * 3.0; d = min(d, disc(p, 0.52 * vec2(cos(a), sin(a)), 0.36 + 0.06 * sin(float(i) * 2.3 + uSeed * 5.0))); }
    float edge = 1.0 - smoothstep(-0.06, 0.02, d);
    if (edge <= 0.002) discard;
    vec3 col = mix(uShade, uCol, smoothstep(-0.75, 0.35, up + 0.25 * sin(p.x * 5.0 + uSeed * 4.0)));
    gl_FragColor = linearToOutputTexel(vec4(col, uA * edge));
  }`;
function dustMaterial(seed, col, shade) {
  const m = new THREE.ShaderMaterial({ uniforms: { uR: { value: 0.05 }, uA: { value: 0 }, uSeed: { value: seed }, uCol: { value: C(col) }, uShade: { value: C(shade) } }, vertexShader: BB_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false });
  m.userData.noOutline = true; return m;
}

// =====================================================================================================================
// ringbox
// =====================================================================================================================
WEDDING_KINDS.ringbox = (P) => {
  const S = P.spec, W = 0.18, D = 0.15, R = 0.022, WALL = 0.012, HB = 0.07, HINGE = [0, HB, -0.075];
  const vel = mat("#ffffff", { vertexColors: true, roughness: 1 }); vel.userData.lineColor = "#3a0710";
  const goldM = mat("#e3b23c", { roughness: 0.35, metalness: 0.2 }); goldM.userData.lineColor = "#7a4a00";
  const hole = { w: W - 2 * WALL, d: D - 2 * WALL, r: R - WALL };
  const side = (nx, nz, x, z) => nx * x + nz * z;   // < 0: a face turned toward the middle (an inside wall)
  // the base: a tub, a dark floor, the cushion with its valley
  const tub = recolor(slab(W, D, R, HB, hole), (nx, ny, nz, x, y, z) => (ny > 0.5 ? "#b33a4c" : ny < -0.5 ? "#5e0f1c" : side(nx, nz, x, z) < 0 ? "#7a1626" : "#8e1b2b"));
  mesh(tub, vel, P.whole);
  mesh(paint(slab(hole.w - 0.001, hole.d - 0.001, hole.r, 0.02), "#3a0710"), vel, P.whole);
  const slot = { w: 0.12, d: 0.035, r: 0.012 }, cush = recolor(slab(hole.w - 0.001, hole.d - 0.001, hole.r, 0.035, slot), (nx, ny, nz, x, y, z) => (ny > 0.5 ? "#7a1626" : ny < -0.5 ? "#3a0710" : side(nx, nz, x, z) < 0 && Math.abs(x) < 0.062 && Math.abs(z) < 0.019 ? "#4a0b16" : "#7a1626"));
  mesh(cush, vel, P.whole, 0, 0.02, 0);
  // a gold line on the base's rim, the catch on its front, two hinges at the back
  const line = (m) => slab(0.168, 0.138, 0.016, 0.0014, { w: 0.16, d: 0.13, r: 0.012 });
  mesh(line(), goldM, P.whole, 0, HB - 0.0006, 0);
  mesh(new THREE.BoxGeometry(0.012, 0.009, 0.004), goldM, P.whole, 0, HB - 0.006, D / 2 + 0.001);
  for (const sx of [-1, 1]) { const hg = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.03, 10), goldM, P.whole, sx * 0.05, HB, -0.0775); hg.rotation.z = Math.PI / 2; }
  // the lid: its walls (lighter bottom rim), a crowned top and a crowned lining 8 mm under it, a gold line and the clasp
  const lid = new THREE.Group(); lid.position.set(...HINGE); P.whole.add(lid);
  const crown = (x, z) => 0.015 * Math.max(0, 1 - ((2 * x) / W) ** 2) * Math.max(0, 1 - ((2 * z) / D) ** 2);
  mesh(recolor(slab(W, D, R, 0.05, hole), (nx, ny, nz, x, y, z) => (ny > 0.5 ? "#b33a4c" : ny < -0.5 ? "#b33a4c" : side(nx, nz, x, z) < 0 ? "#6a1220" : "#8e1b2b")), vel, lid, 0, 0, 0.075);
  const top = gridPlate(hole.w, hole.d, hole.r, 14, 12, true), under = gridPlate(hole.w, hole.d, hole.r, 14, 12, false);
  for (const [g, y0, col] of [[top, 0.05, "#8e1b2b"], [under, 0.042, "#6a1220"]]) {
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, y0 + crown(p.getX(i), p.getZ(i)));
    g.computeVertexNormals(); paint(g, col); mesh(g, vel, lid, 0, 0, 0.075);
  }
  mesh(line(), goldM, lid, 0, 0.0003, 0.075);
  mesh(new THREE.BoxGeometry(0.016, 0.012, 0.005), goldM, lid, 0, 0.008, D + 0.0025);
  // the rings: left first at (-0.028, 0.07, +0.012), leaning back 35 degrees
  const rings = [[-0.028, 0.012], [0.028, -0.012]].map(([x, z]) => { const r = ringMesh(P.whole); r.position.set(x, 0.07, z); r.rotation.x = (90 - 35) * DEG; return r; });
  return {
    grip: HB,
    apply(ps) {
      lid.rotation.x = -clamp(ps.lid ?? 0) * 105 * DEG;
      const n = Math.round(clamp(ps.rings ?? S.rings ?? 0, 0, 2));
      rings[0].visible = n >= 1; rings[1].visible = n >= 2;
    },
  };
};

// =====================================================================================================================
// goldring
// =====================================================================================================================
WEDDING_KINDS.goldring = (P) => {
  const S = P.spec, n = S.n ?? 1, T = S.T ?? 2.2, A0 = S.a0 ?? 38, TURNS = S.turns ?? 9, SEED = S.seed ?? 0.13, { R } = RING;
  const q = new THREE.Quaternion(), ax = new THREE.Vector3();
  if (n >= 2) {
    const A = ringMesh(P.whole), B = ringMesh(P.whole);
    if (S.pose === "link") {
      A.rotation.x = B.rotation.x = Math.PI / 2; A.position.set(-0.026, 0.048, 0.016); B.position.set(0.026, 0.048, -0.016);
    } else {   // "lean": A flat, B leaning on it at 60 degrees toward +x (its low rim on the surface)
      A.position.set(-0.022, 0.015, 0); B.position.set(0.030, 0.049, -0.005);
      B.quaternion.setFromAxisAngle(ax.set(0, 0, -1), 60 * DEG);
    }
    return { grip: 0, apply() {} };
  }
  const piv = new THREE.Group(); P.whole.add(piv); ringMesh(piv);
  const up = !!S.up; if (up) piv.rotation.x = Math.PI / 2;
  return {
    grip: 0,
    apply(ps) {
      if (up) return;
      const spin = ps.spin ?? 0;
      if (!(spin > 0)) { piv.position.set(0, 0, 0); piv.quaternion.identity(); return; }
      const u = clamp(spin / T), tilt = A0 * Math.min(1, spin / 0.1) * (1 - u) ** 0.6 * DEG;
      const phi = 360 * (SEED + TURNS * (1 - (1 - u) ** 0.5)) * DEG, ux = Math.cos(phi), uz = Math.sin(phi);
      // the tilt is a turn of the ring about the horizontal axis y x u (+ lifts the edge away from u: its low rim is on u's side)
      piv.quaternion.setFromAxisAngle(ax.set(uz, 0, -ux), tilt);
      const k = R * (1 - Math.cos(tilt)), cy = 0.015 * Math.cos(tilt) + R * Math.sin(tilt) - 0.015;
      piv.position.set(ux * k, cy, uz * k);
    },
  };
};

// =====================================================================================================================
// bowtie: a copy of props-hotpotato.js hpbowtie's lobes, black, 0.20 wide
// =====================================================================================================================
WEDDING_KINDS.bowtie = (P) => {
  const S = P.spec, own = S.color != null, lobeC = C(S.color ?? "#201e26"), sheen = clamp(S.sheen ?? 1);
  const streakC = own ? lobeC.clone().lerp(C("#ffffff"), 0.3) : C("#585466"), knotC = own ? lobeC.clone().multiplyScalar(0.72) : C("#17151c"), inkC = own ? lobeC.clone().multiplyScalar(0.45) : C("#0e0d12");
  const m = mat("#ffffff", { vertexColors: true, roughness: 0.4, metalness: 0.08 }); m.userData.lineColor = `#${inkC.getHexString()}`; m.userData.noHatch = true;
  const G = new THREE.Group(); G.scale.setScalar(TIE_K); P.whole.add(G);
  for (const side of [1, -1]) {
    const { pos, uv, rim, vv, uu, idx } = tieLobe(side), g = new THREE.BufferGeometry(), col = new Float32Array(pos.length);
    for (let j = 0; j < rim.length; j++) {
      const edge = sm((rim[j] - 0.82) / 0.18), streak = sheen * 0.9 * Math.exp(-(((vv[j] - 0.55) / 0.2) ** 2)) * Math.sin(Math.PI * clamp(uu[j] * 1.05)) ** 0.5;
      const c = lobeC.clone().lerp(streakC, streak).lerp(inkC, edge * 0.85);
      col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); mesh(g, m, G);
  }
  const kg = new THREE.SphereGeometry(0.045, 24, 16), kp = kg.attributes.position;
  for (let i = 0; i < kp.count; i++) kp.setXYZ(i, kp.getX(i) * 0.78, kp.getY(i) * 1.05, kp.getZ(i) * 1.1);
  kg.computeVertexNormals(); paint(kg, knotC); mesh(kg, m, G, 0, 0, 0.012);
  return { grip: 0, apply() {} };
};

// =====================================================================================================================
// flowerpin
// =====================================================================================================================
WEDDING_KINDS.flowerpin = (P) => {
  const m = mat("#ffffff", { vertexColors: true, roughness: 0.75 }); m.userData.lineColor = "#6a5a48";
  mesh(merge(daisyParts(new THREE.Matrix4(), 0.045, true)), m, P.whole);
  return { grip: 0, apply() {} };
};

// =====================================================================================================================
// bouquet
// =====================================================================================================================
WEDDING_KINDS.bouquet = (P) => {
  const m = mat("#ffffff", { vertexColors: true, roughness: 0.8 }); m.userData.lineColor = "#5a6a4a";
  const parts = [], ribbon = C("#fbf7ef"), rShade = C("#d9dfe8"), cy = 0.155, ex = 0.1, ey = 0.065;
  // handle: a stem stub, the ribbon wrap (cream with slanted shade bands), a bow knot and two tails
  const hg = new THREE.CylinderGeometry(0.0165, 0.0155, 0.09, 14, 6, false); hg.translate(0, 0.045, 0);
  parts.push(recolor(hg, (nx, ny, nz, x, y, z) => (ny < -0.9 ? "#3f7a3c" : ((y * 70 + Math.atan2(z, x) * 2.2) % 1 + 1) % 1 < 0.28 ? rShade : ribbon)));
  for (const [dz, rx, len] of [[0.014, 0.35, 0.075], [-0.012, -0.25, 0.065]]) {
    const t = new THREE.BoxGeometry(0.014, len, 0.003); t.translate(0, -len / 2, 0); t.rotateX(rx); t.translate(0, 0.088, dz + (dz > 0 ? 0.012 : -0.012));
    parts.push(paint(t, ribbon));
  }
  const knot = new THREE.SphereGeometry(0.02, 12, 8); knot.scale(1, 0.55, 1); knot.translate(0, 0.088, 0); parts.push(paint(knot, rShade));
  // the dome: a green core, a ring of leaves under it, 12 daisies spread over its upper surface
  const core = new THREE.SphereGeometry(1, 28, 16); core.scale(ex * 0.97, ey * 0.97, ex * 0.97); core.translate(0, cy, 0);
  parts.push(recolor(core, (nx, ny) => (ny > 0.2 ? "#4b8a43" : "#3f7a3c")));
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + h1(i) * 0.3, g = new THREE.SphereGeometry(1, 12, 8);
    g.scale(0.024, 0.052, 0.006); g.translate(0, 0.052, 0); g.rotateX(1.92);   // out and a little down from the dome's rim
    g.translate(0, 0, 0.076); g.rotateY(a); g.translate(0, 0.112, 0);
    parts.push(paint(g, i % 2 ? "#5d9a4a" : "#3f7a3c"));
  }
  for (let i = 0; i < 12; i++) {
    const th = Math.acos(1 - (0.12 + (i + 0.5) / 12 * 0.78)), ph = i * 2.399963 + 0.4;   // polar angle from the top, golden angle
    const d = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const pt = new THREE.Vector3(d.x * ex, cy + d.y * ey, d.z * ex).multiplyScalar(1.0), nrm = new THREE.Vector3(d.x / ex, d.y / ey, d.z / ex).normalize();
    const M = new THREE.Matrix4().compose(pt, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm), new THREE.Vector3(1, 1, 1));
    parts.push(...daisyParts(M, 0.028, false, h1(i + 5) * 1.2));
  }
  mesh(merge(parts), m, P.whole);
  return { grip: 0, apply() {} };
};

// =====================================================================================================================
// spudleaf
// =====================================================================================================================
WEDDING_KINDS.spudleaf = (P) => {
  const S = P.spec, FROM = new THREE.Vector3(...(S.from ?? [0.4, 1.02, 1.8])), TO = new THREE.Vector3(...(S.to ?? [1.05, 0.5, 1.97])), LAY = 0.11, TIP_Z = 1;
  const m = mat("#6cbf3a", { roughness: 0.45, side: THREE.DoubleSide }), vein = mat("#4b8629", { roughness: 0.5 }); m.userData.lineColor = "#2f6a22"; vein.userData.lineColor = "#2f6a22";
  const G = new THREE.Group(); P.whole.add(G);
  const stem = mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10), m, G, 0, 0.03, 0); stem.castShadow = true;
  const pivot = new THREE.Group(); pivot.position.y = 0.06; G.add(pivot);
  const leaf = mesh(leafGeometry(0.056, 0.15, 0.014), m, pivot); leaf.rotation.set(-0.15, 0.25, -0.5);
  const rib = mesh(new THREE.CylinderGeometry(0.003, 0.0045, 0.115, 6), vein, leaf, 0, 0.062, 0.01);
  const base = FROM.clone(), end = TO.clone().add(new THREE.Vector3(0, 0.007, -LAY * TIP_Z));
  const path = end.clone().sub(base), pd = path.clone().normalize();
  const across = new THREE.Vector3(0, 0, 1).cross(pd); if (across.lengthSq() < 1e-6) across.set(1, 0, 0); across.normalize();
  // lying: tip toward +z, the rib side up (rotate about x by -90 first, then about y by 180)
  const lie = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)));
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), yAx = new THREE.Vector3(0, 1, 0), zAx = new THREE.Vector3(0, 0, 1);
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fall ?? 0), sw = Math.sin(2 * Math.PI * 2.5 * f) * (1 - f);
      const pos = base.clone().lerp(end, f).addScaledVector(across, 0.07 * sw);
      pos.y = base.y + (end.y - base.y) * (f - 0.028 * Math.sin(4 * Math.PI * 2.5 * f) * (1 - f)) + across.y * 0.07 * sw;
      pos.z += 0.1 * Math.sin(Math.PI * f);
      qa.setFromAxisAngle(yAx, 200 * f * DEG); qb.setFromAxisAngle(zAx, 35 * sw * DEG); qa.multiply(qb);
      qa.slerp(lie, sm((f - 0.85) / 0.15));
      G.quaternion.copy(qa); G.position.set(pos.x - ps.x, pos.y - ps.y, pos.z - ps.z);
      G.visible = (ps.show ?? 1) > 0.5;   // show 0 hides it until the vanish frame (it still sits on his head before)
    },
  };
};

// =====================================================================================================================
// dustring
// =====================================================================================================================
WEDDING_KINDS.dustring = (P) => {
  const S = P.spec, arrive = S.mode === "arrive", boards = S.surface === "boards";
  const n = S.n ?? (arrive ? 10 : 14), r0 = S.r0 ?? (arrive ? 0.2 : 0.3), r1 = S.r1 ?? (arrive ? 0.42 : 0.6), s0 = S.s0 ?? (arrive ? 0.09 : 0.12), s1 = S.s1 ?? (arrive ? 0.16 : 0.22), A = S.a ?? (arrive ? 0.5 : 0.7);
  const col = S.color ?? (boards ? "#f3eada" : "#efe3c6"), shade = S.shade ?? (boards ? "#ddd0b8" : "#d9cba8"), seed = S.seed ?? 0;
  const puffs = Array.from({ length: n }, (_, i) => {
    const mt = dustMaterial(h1(i * 7 + 3 + seed * 13), col, shade), o = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mt), 4); P.whole.add(o);
    return { o, mt, a: ((i / n) * 360 + h1(i + 11) * 8 + seed * 360) * DEG, k: 0.92 + 0.16 * h1(i + 29), sz: 0.88 + 0.24 * h1(i + 47) };
  });
  return {
    grip: 0,
    apply(ps) {
      const u = clamp(ps.puff ?? 0), e = (1 - Math.exp(-4 * u)) / (1 - Math.exp(-4)), alpha = A * Math.min(1, u * 8) * (1 - u) ** 1.5;
      for (const p of puffs) {
        const r = lerp(r0, r1, e) * p.k, s = lerp(s0, s1, u) * p.sz, y = lerp(0.04, 0.09, u);
        p.o.visible = alpha > 0.003; p.o.position.set(Math.cos(p.a) * r, Math.min(y, 0.2 - s / 2), Math.sin(p.a) * r);
        p.mt.uniforms.uR.value = s / 2; p.mt.uniforms.uA.value = alpha;
      }
    },
  };
};

// =====================================================================================================================
// bridalveil
// =====================================================================================================================
const VEIL = { top: 1.37, hem: 0.28, lace: 0.035, crown: [0, 1.37, -0.03], front: -0.02 };
// Mash's hoodie is wider than her body ellipsoid where the hood sits down (y 0.85-1.1: 0.04 m past the 0.03 off the body, bench 13 Nov): a bump keeps the sheet outside it
const hood = (y) => Math.exp(-(((y - 0.97) / 0.14) ** 2));
const veilHW = (y) => (y >= VEIL.top ? 0.1 : y > 1.1 ? 0.1 + 0.2 * Math.sin(((VEIL.top - y) / (VEIL.top - 1.1)) * Math.PI / 2) : 0.3 + 0.13 * clamp((1.1 - y) / (1.1 - VEIL.hem))) + 0.035 * hood(y);
const veilDZ = (y) => 0.25 * Math.sqrt(Math.max(0, 1 - ((y - 0.76) / 0.62) ** 2)) + 0.03 + 0.16 * sm((1.1 - y) / (1.1 - VEIL.hem)) + 0.075 * hood(y);
function laceTex() {
  return canvasTex(128, 64, (g, w, h) => {
    // v = 0 (the free edge) is the canvas bottom: scallops 0.03 apart, one row of dot holes, the cloth above
    g.clearRect(0, 0, w, h); g.fillStyle = "#fbf7ef"; g.fillRect(0, 0, w, 33);
    for (const cx of [32, 96]) { g.beginPath(); g.arc(cx, 33, 31, 0, Math.PI); g.fill(); }
    g.strokeStyle = "#9aa3b5"; g.lineWidth = 3; for (const cx of [32, 96]) { g.beginPath(); g.arc(cx, 33, 30, 0.12, Math.PI - 0.12); g.stroke(); }
    g.fillStyle = "#d9dfe8"; for (const cx of [32, 96]) { g.beginPath(); g.arc(cx, 40, 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#d9dfe8"; g.fillRect(0, 8, w, 3);
  });
}
WEDDING_KINDS.bridalveil = (P) => {
  const S = P.spec, ROWS = 36, COLS = 30, TOP = VEIL.top, HEMTOP = VEIL.hem + VEIL.lace;
  const cloth = mat("#ffffff", { vertexColors: true, roughness: 0.9, side: THREE.DoubleSide, emissive: C("#fbf7ef"), emissiveIntensity: 0.28 }); cloth.userData.lineColor = "#9aa3b5"; cloth.userData.noHatch = true;
  const lace = mat("#ffffff", { map: laceTex(), roughness: 0.9, side: THREE.DoubleSide, alphaTest: 0.5, emissive: C("#fbf7ef"), emissiveIntensity: 0.28 }); lace.userData.lineColor = "#9aa3b5"; lace.userData.noHatch = true;
  const sway = new THREE.Group(); sway.position.set(...VEIL.crown); P.whole.add(sway);
  const white = C("#fbf7ef"), shadeC = C("#d9dfe8");
  // one point of the sheet: y, a (-pi/2 .. pi/2 across the back), time, an offset along the outward normal
  const pt = (y, a, t, off, out) => {
    const hw = veilHW(y), dz = veilDZ(y), ca = Math.cos(a), sa = Math.sin(a), k = (TOP - y) / (TOP - VEIL.hem);
    const fold = 0.012 * (0.5 + 0.5 * Math.sin(12 * a + 0.6 + y * 1.7)) * Math.pow(Math.max(0, ca), 0.7) * (0.35 + 0.65 * k);
    const flut = (TOP - y) * Math.tan(1.5 * DEG) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.9 * t + 0.5 * Math.sin(3 * a))) * ca;
    const d = dz + fold + flut;
    let x = hw * sa, z = VEIL.front - d * ca;
    if (off) { const nx = x / (hw * hw), nz = (z - VEIL.front) / (d * d), l = Math.hypot(nx, nz) || 1; x += (nx / l) * off; z += (nz / l) * off; }
    out[0] = x - VEIL.crown[0]; out[1] = y - VEIL.crown[1]; out[2] = z - VEIL.crown[2]; return fold;
  };
  const tmp = [0, 0, 0], yTop = (a) => TOP - 0.03 * Math.cos(a);
  // the sheet
  const sheetG = new THREE.BufferGeometry(), nS = (ROWS + 1) * (COLS + 1), sPos = new Float32Array(nS * 3), sCol = new Float32Array(nS * 3), sIdx = [];
  for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) {
    const a = -Math.PI / 2 + (c / COLS) * Math.PI, y = lerp(yTop(a), HEMTOP, r / ROWS), f = pt(y, a, 0, 0, tmp), i = r * (COLS + 1) + c;
    const col = white.clone().lerp(shadeC, 0.55 * (1 - f / 0.012) * (0.25 + 0.75 * Math.cos(a) ** 0.5) * (0.4 + 0.6 * r / ROWS));
    sCol[i * 3] = col.r; sCol[i * 3 + 1] = col.g; sCol[i * 3 + 2] = col.b;
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1; sIdx.push(a, d, b, b, d, e); }
  sheetG.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); sheetG.setAttribute("color", new THREE.BufferAttribute(sCol, 3)); sheetG.setIndex(sIdx);
  const sheet = ghost(new THREE.Mesh(sheetG, cloth), 0); sheet.castShadow = false; sheet.receiveShadow = true; sway.add(sheet);
  // the lace: the hem band and one band down each front edge, a grid each (rows across the band, v = 0 at the free edge)
  const bands = [];
  const band = (rows, cols, at) => {   // at(rr, cc, out): the point; rr 0 = free edge .. 1; cc 0..1 along
    const g = new THREE.BufferGeometry(), nn = (rows + 1) * (cols + 1), pos = new Float32Array(nn * 3), uv = new Float32Array(nn * 2), idx = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    const o = ghost(new THREE.Mesh(g, lace), 1); o.castShadow = false; sway.add(o); const b = { o, g, rows, cols, at }; bands.push(b); return b;
  };
  const edgeA = (s) => s * (Math.PI / 2);
  const hem = band(1, COLS, (rr, cc, t, out) => { const a = -Math.PI / 2 + cc * Math.PI; pt(lerp(VEIL.hem, HEMTOP, rr), a, t, 0.0025, out); });
  const fronts = [-1, 1].map((s) => band(1, ROWS, (rr, cc, t, out) => { const y0 = lerp(yTop(edgeA(s)), VEIL.hem, cc), da = VEIL.lace / veilDZ(y0), a = edgeA(s) - s * da * (1 - rr); pt(y0, a, t, 0.0025, out); }));
  let drawn = "";
  const update = (swing, t) => {
    const key = `${swing}|${t}`; if (key === drawn) return; drawn = key;
    sway.rotation.z = swing * 6 * DEG;
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) {
      const a = -Math.PI / 2 + (c / COLS) * Math.PI, y = lerp(yTop(a), HEMTOP, r / ROWS), i = r * (COLS + 1) + c; pt(y, a, t, 0, tmp);
      sPos[i * 3] = tmp[0]; sPos[i * 3 + 1] = tmp[1]; sPos[i * 3 + 2] = tmp[2];
    }
    sheetG.attributes.position.needsUpdate = true; sheetG.computeVertexNormals();
    for (const b of bands) {
      const pos = b.g.attributes.position, uv = b.g.attributes.uv; let len = 0, prev = null;
      for (let c = 0; c <= b.cols; c++) {
        for (let r = 0; r <= b.rows; r++) {
          b.at(r / b.rows, c / b.cols, t, tmp); const i = r * (b.cols + 1) + c; pos.setXYZ(i, tmp[0], tmp[1], tmp[2]);
          if (r === 0) { if (prev) len += Math.hypot(tmp[0] - prev[0], tmp[1] - prev[1], tmp[2] - prev[2]); prev = tmp.slice(); }
          uv.setXY(i, len / 0.06, r / b.rows);
        }
      }
      pos.needsUpdate = true; uv.needsUpdate = true; b.g.computeVertexNormals(); b.g.computeBoundingSphere();
    }
    sheetG.computeBoundingSphere();
  };
  update(0, 0);
  return { grip: 0, apply(ps, t) { update(clamp(ps.swing ?? S.swing ?? 0, -1, 1), t ?? 0); } };
};
