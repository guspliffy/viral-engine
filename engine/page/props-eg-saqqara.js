// EGYPT EP04 SERAPEUM (18 Nov 2026), task T4: the past places part 2 (Saqqara) and the episode's small effects. Design:
// storyboards/series/ancient-aliens/04-serapeum/DESIGN.md sections 1, 2, 6 "Saqqara", 7 "11" and "13-15". Bench: storyboards/series/ancient-aliens/04-serapeum/bench
// (make-eg-saqqara.mjs, eg-saqqara-sheet.png). Metres; origin the bottom centre, front +z, +x right, +y up, unless said. Every mark (chisel cut,
// chip, crack, stain, grain line, knot, scuff, pit, pebble, ripple) is drawn once with its own place, size and strength from q(i, k) (DESIGN
// section 2) for the first coordinate and an integer hash for the rest (q(i, k+7) is one fixed offset of q(i, k): all marks would sit on a
// diagonal). No tiling texture (a rope is its own repeat), no Math.random, no wall clock; animation reads only params and the clip time t.
// Every animated value is a param 0..1 with a spec.<name> start value. propState has NO default for pour, wet, track, pry, snap, age, along:
// seed what you tween with a dur-0 set at 0 (a clip that only sets them once may also give them as spec keys).
//
//   saqqara     the desert and the cliff of panels 10-12. Ground slab 64 (x) x 0.22 x 58 (z), top y 0, centred on the origin (z -29..29); a
//               haul lane overlay (x +-5, z -3.7..25.9) with fine ripples, pits, sandal prints, 150 real pebbles on it; 13 low wind ridges
//               0.03..0.21 high outside the lanes (|x| > 3.4, look-only). The cliff: x +-15, 4.2 high, front plane z 0 (relief +-0.1), back
//               z -3.4, six hewn strata .74/.81/.69/.38/.78/.80 thick, each cut into blocks with vertical joints. Sun in the set: azimuth
//               -38, elevation 48. spec mouth true = the rock-cut tunnel mouth at z 0: a stone frame 2.19 x 2.62 x 0.31 (z -.155..+.155;
//               five jamb courses a side .416 tall, a .32 lintel, a .22 cap; 18 chisel cuts and 4 chips on every stone), CLEAR width 1.405,
//               height 2.080, and a tunnel behind it to z -3.4 (painted rock, darkening with depth); false = cliff without the opening.
//               spec cliff true (false = no cliff, no mouth: a bare desert), apron true (a 700 m flat sand plane at y -0.012 round the slab so
//               Djoser and the horizon stand on sand; give false on every second instance). Alias kind `saqqaramouth`.
//               SOLID: the slab top y 0, the frame, the cliff. The box on its sledge clears the mouth by .070 a side (yaw +90).
//   djoser      the six-tier step pyramid. spec s 0.11 (scale; 0.11 = tiers X x Z x H 13.31x11.99x1.21, 11.52x10.32x1.18, 9.73x8.66x1.13,
//               7.95x6.99x1.10, 6.16x5.33x1.03, 4.38x3.67x0.95 = 13.3 x 12 x 6.6 m), stack centred, walls batter 6 deg, bevel .042, each face eight
//               courses +-8 % tone with seven .015 course lines, block joints, 11 chips .04..0.19, stains; six ledges show. Origin the middle of the
//               base on the ground. Look-only. Place it at (-48, y, -40) yaw 14 (the director's rise).
//   sledge      1.37 (x) x 0.19 x 2.82 (z): two runners at x +-0.505 (.20 x .115, noses toward -z lifting .07 over .21, each with a hole and a
//               rope ring through it), four crossbeams 1.37 x .075 x .17 at z +-.92 / +-.32 (pegged), four lashings of three turns on the outer
//               beams' overhangs, wood grain / knots / scuffs / splits painted. DECK TOP y 0.19 (the crossbeams; runners .115): a granitebox goes at
//               y 0.19, rot 90 (long axis along z, 2.2 on a 2.82 sledge). spec ropes true (two haul ropes of Ø.034 from the rings at z -1.395 to
//               spec.ropeLen 12 ahead, x .505 -> .57, rising from the ring to spec.ropeEnd 0.42, sagging spec.sag 0.27 and resting on the sand;
//               frayed ends). SOLID: the deck (standable). No params; the director moves it (sledge z 16.20 in 10, -1.83 in 11).
//   egypthaul   the forty haulers of panel 11 (far figures, one instanced mesh per part): golden potatoes 0.82 tall (+-3 %), short white
//               linen kilt (#EDE1C9, pleats #B5A086), white headcloth, bare arms and feet, no fur. Two files of 20 (spec n) at x +-0.57, 0.55 m
//               apart (spec spacing) along the ropes, the first spec first 1.98 ahead of the tow point, leaning spec lean 23 deg toward -z, hands
//               on the sledge's ropes (the same sag), faces -z. ORIGIN = the sledge's tow point (the sledge's x 0, z -1.32) on the ground: put it
//               at the sledge's start z - 1.32 (14.88 for z 16.20). Param along 0..1 (spec 0) moves the whole crowd spec travel 1.83 toward -z
//               (set it with the sledge's travel). Steps (1.15 per second), bob and the lean pulse run on the clip clock. spec stagger 0 (1 = the
//               right file half a pace behind), h 0.82. Look-only, no ink.
//   waterjar    a clay jar .38 high, belly Ø.31, neck Ø.105, lip Ø.135, two .095 high handles on +-z, six hand-drawn arcs .004 wide, wet-darkened
//               foot. Origin the bottom centre. Param pour 0..1 (spec 0): the jar tips to 68 deg about the handle axis (0, .30, z), mouth toward
//               +x (rot 180 to pour toward -x); water flows from pour .5: four streams Ø.007..0.014 falling spec fall 0.26 while going spec
//               reach 0.21 forward from the lip, 11 drops Ø.006, a small splash at the end, alpha .62, wobble on the clip clock. At pour 1 the lip
//               is at (.0995, .267): stand the jar so its origin is on the sand. GRIPS handleL [0, .30, .121] / handleR [0, .30, -.121] (the tilt
//               axis: a hand there stays put while pour tips the jar), hold [0, .19, 0] (belly). SIZE for grips.mjs: w .31, h .38.
//   wetsand     two dark wet patches centred x +-0.34 (origin the middle between them, z 0), each .61 (x) x 2.02 (z), 21 edge points with .023
//               scallops and a .047 feather, deeper wet inside, ripples and glints; runner tracks at x +-0.505, .20 wide. Params wet 0..1 (spec
//               0): the patches grow from 40 % and fade in (dry -> wet; time it .44 s); track 0..1 (spec 0): the dark runner tracks with their
//               little berms, from z +.95 toward -z, spec trackLen 1.83 long at 1. Flat decals (look-only) on the sand; put at y 0.
//   pounder     the round dolerite hand pounder .19 (x) x .21 (y) x .15 (z), origin the bottom centre: nine hammered facets, 36 pits, feldspar
//               and dark specks, pale bruises. No params. GRIPS hold [0, .105, 0] (a fist round it). SIZE for grips.mjs: w .19, h .21.
//   lever       the 1.22 m wooden lever, Ø.065 butt -> Ø.047 tip, on a fulcrum block .23 x .14 x .23 (limestone, spec fulcrum true). Origin the ground
//               under the fulcrum's middle; the rod lies along z, TIP toward -z at z -0.23 (the fulcrum .23 behind the tip), butt at z +0.99,
//               resting on the block. Six grain lines, two knots, polished hand patches (hands .21 apart), worn tip. Param pry 0..1 (spec 0):
//               the rod turns about the fulcrum top from the handle raised 11 deg (0) to pressed 9 deg below level (1). Param snap 0 | 1 (spec 0)
//               with spec snapAt 39.32 (clip seconds, set the SAME time with a dur-0 set of snap 1): at snap the rod breaks .49 from the tip
//               (z +.26) into two jagged halves with 7 pale splinters each (.021..0.092); over 0.74 s they separate .31, tumble 43 / -63 deg
//               yaw, drop with a small bounce and settle flat on the ground (the fulcrum stays). Seed-safe: t decides, nothing is stored. spec seed
//               (1..8) varies grain, knots and wear. GRIPS handA [0, .2, .62] / handB [0, .2, .83] (lever frame, pry 0). SIZE: w .065, h 1.22.
//   dustcloud   a soft drifting cloud: lobes (hand-drawn cauliflower puffs, three variants), grains and (size 1 only) six limestone chips. Origin
//               the emission point (the jam dust at the return (.824, .21, -6.22); the cough at the glove). Param age 0..1 (spec 0) over the life
//               (jam: 39.34 -> 40.91, cough 62.04 -> 62.83); 0 = nothing. spec size 1 (>= .6 = the jam dust of panel 15: 11 lobes Ø.16 -> .51,
//               rise .48, spread .44, alpha .34 -> 0, 37 grains Ø.003..0.020, six chips .025..0.062 that fall and settle by age .68 and stay;
//               0.3 = the cough puff of panel 23: 7 lobes Ø.05 -> .15, alpha .31 -> 0, 21 wake grains Ø.003..0.010, drift [.32, 0, 0] (+x = screen
//               right in shot 23)). spec spread / rise / drift [x, y, z] / floorY (the sand's height below the origin: -.21 for the jam, -.5 for
//               the cough) override. Alpha rises over the first 12 % of the age, then falls to 0 at 1. See-through (userData.steam).
//
// Hands: only waterjar, pounder and lever are held; no in-hand proof was run (storyboards/lib/grips.mjs has no SIZE for them and the proof tool
// knows only mug, bowl, box, thin and phone). The grip points above follow the sizes.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
// DESIGN section 2: q(i, k) = fract((i + 1) .61803398875 + (k + 1) .41421356237). q(i, k + 7) is a fixed offset of q(i, k) (one diagonal), so the
// second and third coordinates of a mark come from the integer hash H, the first from q.
const Q = (i, k) => { const v = (i + 1) * 0.61803398875 + (k + 1) * 0.41421356237; return v - Math.floor(v); };
const H = (a, b = 0, c = 0, d = 0) => {
  let h = 0x811c9dc5;
  for (const v of [a, b, c, d]) { h ^= Math.floor(v * 997) | 0; h = Math.imul(h, 0x01000193); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; }
  h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35); h ^= h >>> 15; return (h >>> 0) / 4294967296;
};
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const sh = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
// palette (DESIGN section 1)
const C = {
  lime: hex("#A68A6C"), limeSh: hex("#665348"), chip: hex("#CAB093"), crack: hex("#3B3030"), stain: hex("#84654C"),
  tunnel: hex("#A1876B"), desert: hex("#D6AE79"), ridge: hex("#B58B62"), wet: hex("#896249"), dust: hex("#C8B292"), dustSh: hex("#907D65"),
  hull: hex("#73452F"), joint: hex("#4B2E25"), deck: hex("#AB7850"), scuff: hex("#BC9169"), rope: hex("#BB985C"), rope2: hex("#715333"),
  jar: hex("#A55235"), jar2: hex("#653725"), splinter: hex("#D2A97B"), pour: hex("#ABC8CE"), ink: hex("#251E21"),
  linen: hex("#EDE1C9"), linenSh: hex("#B5A086"), skin: hex("#E0A655"), skinSh: hex("#B47A3C"),
};
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
const quiet = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "set"; return m; };   // scenery: no ink hull, the set's own shading role
const setRole = (m) => { m.userData.lookRole = "set"; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0, cast = true, recv = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = recv; if (parent) parent.add(o); return o; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const lookOnly = (o) => { o.userData.solid = false; o.userData.lookOnly = true; o.castShadow = false; return o; };
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; }

// ---------------------------------------------------------------------------------------------------------------------------
// painting in metres, y UP (the canvas origin is the bottom left, so uv = (x / wm, y / hm) maps a surface straight onto it)
function cv(wm, hm, ppm) {
  const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(wm * ppm)); c.height = Math.max(2, Math.round(hm * ppm));
  const g = c.getContext("2d"); g.setTransform(c.width / wm, 0, 0, -c.height / hm, 0, c.height); return { c, g, ppm, wm, hm };
}
const line = (g, x0, y0, x1, y1, w, col, a) => { g.strokeStyle = rgba(col, a); g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const blob = (g, x, y, rx, ry, rot, col, a, soft = 0.5) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(soft, rgba(col, a * 0.55)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
};
// a chisel cut: a dark groove with a lit lip above it
function cutMark(X, cx, cy, L, wd, ang, a) {
  const w = Math.max(wd, 1.15 / X.ppm), dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
  line(X.g, cx - dx - w * 0.3, cy - dy + w * 0.9, cx + dx - w * 0.3, cy + dy + w * 0.9, w * 0.55, sh(C.chip, 1.1), a * 0.8);
  line(X.g, cx - dx, cy - dy, cx + dx, cy + dy, w, C.crack, a);
  line(X.g, cx - dx * 0.8, cy - dy * 0.8 - w * 0.1, cx + dx * 0.8, cy + dy * 0.8 - w * 0.1, w * 0.4, hex("#160e0c"), a * 0.6);
}
// a chip: a ragged bite with a pale broken face and a shadow under its lip
function chipMark(X, cx, cy, d, key, a) {
  const g = X.g, n = 7, pts = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * TAU + H(key, i, 1) * 0.5, r = (d / 2) * (0.65 + 0.5 * H(key, i, 2)); pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.85]); }
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.fillStyle = rgba(C.chip, a * 0.75); g.fill(); g.strokeStyle = rgba(C.crack, a * 0.9); g.lineWidth = Math.max(1.1 / X.ppm, d * 0.04); g.stroke();
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const i of [1, 2, 3]) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = rgba(C.limeSh, a); g.lineWidth = Math.max(1.4 / X.ppm, d * 0.07); g.stroke();
}
// a ragged crack polyline from points with a width, pale lip + dark core
function crackLine(X, pts, wid, a = 0.9) {
  const g = X.g; g.lineCap = "round"; g.lineJoin = "round";
  for (const [k, col] of [[1.8, sh(C.chip, 1.05)], [1, C.crack], [0.45, hex("#140d0b")]]) {
    for (let i = 1; i < pts.length; i++) {
      const w = Math.max(1.1 / X.ppm, wid * k * (k < 1 ? 0.5 : 1) * (0.7 + 0.5 * H(i, pts[0][0] * 9)));
      g.strokeStyle = rgba(col, k > 1.2 ? a * 0.35 : a); g.lineWidth = w; g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1] + (k > 1.2 ? w * 0.4 : 0)); g.lineTo(pts[i][0], pts[i][1] + (k > 1.2 ? w * 0.4 : 0)); g.stroke();
    }
  }
}
const jag = (x0, y0, x1, y1, key, n = 7, amp = 0.03) => {   // a jagged polyline from a to b
  const pts = [[x0, y0]], L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  for (let i = 1; i < n; i++) { const t = i / n, o = (H(key, i, 3) - 0.5) * amp * 2; pts.push([lerp(x0, x1, t) + nx * o, lerp(y0, y1, t) + ny * o]); }
  pts.push([x1, y1]); return pts;
};
// wood: base, broad tone drift, grain lines along x (one stroke each: own place, length, width, strength), knots, scuffs, splits
function paintWood(X, o) {
  const { g, wm, hm } = X, k = o.k ?? 0, base = o.base ?? C.hull, dk = o.dark ?? C.joint, lt = o.light ?? C.scuff;
  g.fillStyle = rgba(base, 1); g.fillRect(0, 0, wm, hm);
  for (let i = 0; i < 14; i++) { const y = hm * Q(i, k + 2), hh = hm * (0.06 + 0.14 * H(i, k, 4)); g.fillStyle = rgba(H(i, k, 5) < 0.5 ? dk : lt, 0.06 + 0.07 * H(i, k, 6)); g.fillRect(0, y, wm, hh); }
  for (let i = 0; i < (o.grain ?? 40); i++) {
    const y = hm * Q(i, k + 3), x0 = wm * H(i, k, 7) * 0.95, L = Math.min(wm, 0.15 + (wm * 0.5) * H(i, k, 8)), w = 0.0018 + 0.0045 * H(i, k, 9), a = 0.22 + 0.36 * H(i, k, 10), col = H(i, k, 11) < 0.78 ? dk : lt;
    g.strokeStyle = rgba(col, a); g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y);
    for (let s = 1; s <= 6; s++) g.lineTo(x0 + (L * s) / 6, y + (H(i, k, 12 + s) - 0.5) * hm * 0.03);
    g.stroke();
  }
  for (let i = 0; i < (o.knots ?? 2); i++) {   // knots: little concentric rings the grain flows round
    const x = wm * (0.1 + 0.8 * H(i, k, 30)), y = hm * (0.2 + 0.6 * H(i, k, 31)), r = hm * (0.06 + 0.07 * H(i, k, 32));
    for (let j = 3; j >= 0; j--) { g.strokeStyle = rgba(dk, 0.22 + 0.12 * j); g.lineWidth = Math.max(1 / X.ppm, r * 0.12); g.beginPath(); g.ellipse(x, y, r * (1 + j * 0.55) * 1.8, r * (1 + j * 0.55) * 0.8, 0, 0, TAU); g.stroke(); }
    g.fillStyle = rgba(dk, 0.7); g.beginPath(); g.ellipse(x, y, r * 0.8, r * 0.45, 0, 0, TAU); g.fill();
  }
  for (let i = 0; i < (o.scuffs ?? 8); i++) { const x = wm * H(i, k, 40), y = hm * H(i, k, 41), L = 0.03 + 0.12 * H(i, k, 42); line(g, x, y, x + L, y + (H(i, k, 43) - 0.5) * 0.01, 0.003 + 0.006 * H(i, k, 44), lt, 0.16 + 0.22 * H(i, k, 45)); }
  for (let i = 0; i < (o.splits ?? 3); i++) { const x = wm * H(i, k, 50), y = hm * (0.1 + 0.8 * H(i, k, 51)); crackLine(X, jag(x, y, x + 0.12 + 0.3 * H(i, k, 52), y + (H(i, k, 53) - 0.5) * 0.02, i + k * 7, 6, 0.004), 0.0035, 0.75); }
}
// set uv from position and normal: fn(x, y, z, nx, ny, nz) -> [u, v]
function wrapUV(geo, fn) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const r = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); uv[i * 2] = r[0]; uv[i * 2 + 1] = r[1]; }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return geo;
}
// a grid mesh f(u, v) -> [x, y, z] with uv 0..1 and vertex colours c(u, v) -> [r, g, b] (0..1)
function gridMesh(nu, nv, f, col = null) {
  const geo = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), cc = new Float32Array(n * 3), idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const k = i * (nv + 1) + j, p = f(i / nu, j / nv); pos.set(p, k * 3); uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv;
    const c = col ? col(i / nu, j / nv, p) : [1, 1, 1]; cc.set(c, k * 3);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("color", new THREE.BufferAttribute(cc, 3)); geo.setIndex(idx);
  geo.computeVertexNormals(); return geo;
}
const tubeGeo = (pts, r, seg = 6, closed = false, nseg = null) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), nseg ?? Math.max(8, pts.length * 3), r, seg, closed);
// value noise on a lattice (hashed), 0..1
const vn = (x, y, s = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(H(ix, iy, s), H(ix + 1, iy, s), u), lerp(H(ix, iy + 1, s), H(ix + 1, iy + 1, s), u), v);
};

// a twisted rope map: three strands slanting across the tube, drawn once, repeated along the length (a rope is its own repeat)
let ROPE_TEX = null;
function ropeTex() {
  if (ROPE_TEX) return ROPE_TEX;
  const c = document.createElement("canvas"); c.width = 128; c.height = 64; const g = c.getContext("2d");
  g.fillStyle = rgba(C.rope2, 1); g.fillRect(0, 0, 128, 64);
  for (let s = -2; s < 8; s++) {   // slanted strands, each its own width and tone
    const x0 = s * 21.3, w = 14 + 5 * H(s, 3), col = mixc(C.rope, C.scuff, 0.25 * H(s, 4)), k = 0.85 + 0.25 * H(s, 5);
    g.fillStyle = rgba(sh(col, k), 1); g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w + 40, 64); g.lineTo(x0 + 40, 64); g.closePath(); g.fill();
    g.strokeStyle = rgba(C.rope2, 0.75); g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0 + w, 0); g.lineTo(x0 + w + 40, 64); g.stroke();
    g.strokeStyle = rgba(sh(C.scuff, 1.15), 0.5); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0 + 3, 0); g.lineTo(x0 + 43, 64); g.stroke();
  }
  for (let i = 0; i < 60; i++) { const x = 128 * H(i, 9), y = 64 * H(i, 10); g.strokeStyle = rgba(sh(C.scuff, 1.1), 0.22 + 0.3 * H(i, 11)); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + 8 * H(i, 12), y + 10 * (H(i, 13) - 0.2)); g.stroke(); }
  ROPE_TEX = tex(c); ROPE_TEX.wrapS = ROPE_TEX.wrapT = THREE.RepeatWrapping; return ROPE_TEX;
}
// a rope along points, radius r; `len` the rope's length so the twist is 0.11 m per turn
function ropeMesh(pts, r, parent, len, closed = false, nseg = null) {
  const t = ropeTex().clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, len / 0.11), 1);
  const m = mat("#ffffff", { map: t, roughness: 0.95 }); return mesh(tubeGeo(pts, r, 7, closed, nseg), m, parent);
}

// ===========================================================================================================================
// the sledge and its ropes (DESIGN section 6 Saqqara)
const SL = { L: 2.82, runX: 0.505, runW: 0.2, runH: 0.115, nose: 0.07, noseL: 0.21, beamW: 1.37, beamH: 0.075, beamD: 0.17, beamZ: [-0.92, -0.32, 0.32, 0.92], deck: 0.19, eye: [-1.32, 0.11] };
const noseLift = (z) => SL.nose * smooth((-(SL.L / 2 - SL.noseL) - z) / SL.noseL);   // z < -1.2 rises to 0.07 at -1.41
// the haul rope's path (shared by the sledge's ropes and the haul crowd's hands): file f (-1 left, +1 right), distance s ahead of the
// tow point, 0..len; x from 0.505 to 0.57, height from the eye (0.11) to spec.ropeEnd, sagging spec.sag below the chord, never into the sand
const ropeAt = (S, f, s) => {
  const len = S.ropeLen ?? 12, e = clamp(s / len), end = S.ropeEnd ?? 0.42, sag = S.sag ?? 0.27;
  return [f * lerp(0.505, 0.57, e), Math.max(0.02, lerp(0.105, end, e) - sag * 4 * e * (1 - e)), -1.47 - s];
};
function runnerGeo() {
  const b = 0.012, s = new THREE.Shape(), z0 = SL.L / 2, zn = z0 - SL.noseL;
  s.moveTo(z0 - 0.02, 0); s.lineTo(-zn, 0);
  for (let j = 1; j <= 8; j++) { const z = -zn - (SL.noseL * j) / 8; s.lineTo(z, noseLift(z)); }
  s.lineTo(-z0 + 0.004, SL.runH + SL.nose - 0.012); s.lineTo(-z0 + 0.02, SL.runH + SL.nose);
  for (let j = 7; j >= 0; j--) { const z = -zn - (SL.noseL * j) / 8; s.lineTo(z, SL.runH + noseLift(z)); }
  s.lineTo(z0 - 0.02, SL.runH); s.lineTo(z0, SL.runH - 0.02); s.lineTo(z0, 0.02); s.closePath();
  const hole = new THREE.Path(); hole.absellipse(SL.eye[0], 0.105, 0.0225, 0.0225, 0, TAU, true); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: SL.runW - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 10 });
  g.rotateY(-Math.PI / 2); g.translate((SL.runW - 2 * b) / 2, 0, 0); g.computeVertexNormals();
  return wrapUV(g, (x, y, z, nx) => (Math.abs(nx) > 0.5 ? [(z + z0) / SL.L, y / 0.3] : [(z + z0) / SL.L, 0.55 + 0.4 * (x / SL.runW) + 0.0 * y]));
}
function buildSledge(P) {
  const S = P.spec, G = P.whole;
  // runners: one wood map each, hand-placed grain, knots, scuffs at the lifted noses, splits, bottom wear
  const rw = cv(SL.L, 0.3, 240);
  paintWood(rw, { base: C.hull, dark: C.joint, light: C.scuff, k: 1, grain: 70, knots: 3, scuffs: 14, splits: 4 });
  for (let i = 0; i < 26; i++) { const x = SL.L * H(i, 70), L = 0.05 + 0.2 * H(i, 71); line(rw.g, x, 0.012 + 0.012 * H(i, 72), x + L, 0.012 + 0.012 * H(i, 73), 0.006 + 0.01 * H(i, 74), sh(C.scuff, 1.1), 0.25 + 0.3 * H(i, 75)); }   // the worn, polished bottom edge
  for (let i = 0; i < 12; i++) { const x = SL.L * (0.02 + 0.2 * H(i, 76)), y = 0.04 + 0.2 * H(i, 77); chipMark(rw, x, y, 0.012 + 0.03 * H(i, 78), i + 90, 0.55); }   // the nose gets the knocks
  rw.g.fillStyle = rgba(C.joint, 0.45); rw.g.fillRect(SL.L * 0.36, 0, 0.012, 0.3); rw.g.fillRect(SL.L * 0.66, 0, 0.012, 0.3);   // the joints of the two spliced lengths
  const runM = mat("#ffffff", { map: tex(rw.c), roughness: 0.85 });
  for (const s of [-1, 1]) mesh(runnerGeo(), runM, G, s * SL.runX, 0, 0);
  // four crossbeams across the runners, pegged
  const bw = cv(SL.beamW, SL.beamD, 260);
  paintWood(bw, { base: C.deck, dark: hex("#7b4f33"), light: C.scuff, k: 5, grain: 40, knots: 2, scuffs: 12, splits: 2 });
  for (let i = 0; i < 6; i++) blob(bw.g, SL.beamW * (0.2 + 0.6 * H(i, 80)), SL.beamD * H(i, 81), 0.1 + 0.1 * H(i, 82), 0.03, 0, hex("#3b2519"), 0.14);   // the box's weight: dark bearing marks on top
  const beamM = mat("#ffffff", { map: tex(bw.c), roughness: 0.85 });
  const peg = new THREE.CylinderGeometry(0.0155, 0.0175, 0.012, 10), pegM = mat("#D2A97B", { roughness: 0.8 });
  SL.beamZ.forEach((z, i) => {
    const g = new RoundedBoxGeometry(SL.beamW, SL.beamH, SL.beamD, 2, 0.011);
    wrapUV(g, (x, y, zz, nx, ny, nz) => (Math.abs(ny) > 0.5 ? [(x + SL.beamW / 2) / SL.beamW, (zz + SL.beamD / 2) / SL.beamD] : [(x + SL.beamW / 2) / SL.beamW, 0.5 + 0.4 * (y / SL.beamH)]));
    mesh(g, beamM, G, 0, SL.runH + SL.beamH / 2, z);
    for (const s of [-1, 1]) { const p = mesh(peg, pegM, G, s * SL.runX, SL.deck + 0.003, z + (H(i, s + 3) - 0.5) * 0.02); p.rotation.y = H(i, s + 5) * 3; }
  });
  // four lashings, three turns each, on the outer beams where they overhang the runners (x +-0.635, the box clears them)
  for (const z of [-0.92, 0.92]) for (const s of [-1, 1]) {
    for (let t = 0; t < 3; t++) {
      const x = s * (0.608 + t * 0.027), y0 = SL.runH - 0.017, y1 = SL.deck + 0.017, hz = SL.beamD / 2 + 0.017;
      ropeMesh([[x, y0, z - hz], [x, y0, z + hz], [x, y1, z + hz], [x, y1, z - hz]], 0.017, G, 0.5, true, 24);
    }
  }
  // tow eyes: a rope ring through the hole in each nose and round the front bridge; the haul rope leaves the ring's front
  if (S.ropes ?? true) {
    const len = S.ropeLen ?? 12;
    for (const f of [-1, 1]) {
      const ex = f * SL.runX, ring = [];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ring.push([ex + Math.cos(a) * 0.13, 0.105, -1.395 + Math.sin(a) * 0.075]); }
      ropeMesh(ring, 0.017, G, 0.9, true, 36);
      const pts = []; for (let i = 0; i <= 48; i++) pts.push(ropeAt(S, f, (len * i) / 48));
      pts[0][1] = 0.105; pts[1][1] = Math.max(pts[1][1], 0.06);
      ropeMesh(pts, 0.017, G, len, false, 120).castShadow = false;
      const e = pts[pts.length - 1];   // the free end: frayed fibres
      for (let i = 0; i < 9; i++) mesh(tubeGeo([[e[0], e[1], e[2]], [e[0] + (H(i, f + 5) - 0.5) * 0.05, Math.max(0.004, e[1] - 0.01 - 0.02 * H(i, 7)), e[2] - 0.03 - 0.05 * H(i, 8)]], 0.0016, 3, false, 3), mat("#E3C392"), G, 0, 0, 0, false, false);
    }
  }
  return { grip: 0, apply() {} };
}

// ===========================================================================================================================
// saqqara: the desert, the cliff and the rock-cut tunnel mouth
const FR = { W: 2.19, H: 2.62, D: 0.31, cw: 1.405, ch: 2.08, lint: 0.32 };
const CBLK = (() => { const out = []; for (let s = 0; s < 6; s++) { const arr = []; let x = -15; while (x < 15) { const w = 0.9 + 1.8 * H(arr.length, s, 91); arr.push({ x0: x, x1: Math.min(15, x + w), dz: (H(arr.length, s, 92) - 0.5) * 0.13, t: 0.9 + 0.2 * H(arr.length, s, 93) }); x += w; } out.push(arr); } return out; })();
const blk = (s, x) => CBLK[s].find((b) => x < b.x1) || CBLK[s][CBLK[s].length - 1];
const CLIFF = { X: 15, Y: 4.2, Z0: -3.4, strata: [0.74, 0.81, 0.69, 0.38, 0.78, 0.8], off: [0, -0.025, 0.02, -0.03, 0.02, -0.025], tone: [1.0, 0.9, 1.07, 0.84, 1.03, 0.94] };
// weathered limestone: tone drift, stains, chisel cuts, chips, cracks; counts are per canvas
function paintRock(X, o) {
  const { g, wm, hm } = X, k = o.k ?? 0, base = o.base ?? C.lime;
  g.fillStyle = rgba(base, 1); g.fillRect(0, 0, wm, hm);
  for (let i = 0; i < (o.blobs ?? 24); i++) blob(g, wm * H(i, k, 1), hm * H(i, k, 2), (0.1 + 0.5 * H(i, k, 3)) * Math.min(wm, 2.4), (0.05 + 0.22 * H(i, k, 4)) * Math.min(hm, 2.4), (H(i, k, 5) - 0.5) * 0.5, H(i, k, 6) < 0.5 ? C.limeSh : C.chip, 0.05 + 0.08 * H(i, k, 7));
  for (let i = 0; i < (o.stains ?? 6); i++) blob(g, wm * Q(i, k + 4), hm * H(i, k, 8), 0.03 + 0.1 * H(i, k, 9), 0.1 + 0.5 * H(i, k, 10) * Math.min(hm, 2), (H(i, k, 11) - 0.5) * 0.12, C.stain, 0.14 + 0.16 * H(i, k, 12), 0.6);
  for (let i = 0; i < (o.cuts ?? 30); i++) cutMark(X, wm * Q(i, k), hm * H(i, k, 13), 0.04 + 0.17 * H(i, k, 14), 0.002 + 0.008 * H(i, k, 15), (18 + 60 * H(i, k, 16)) * DEG * (H(i, k, 17) < 0.5 ? 1 : -1) * (o.flat ? 0.3 : 1), 0.42);
  for (let i = 0; i < (o.chips ?? 4); i++) chipMark(X, wm * Q(i, k + 2), hm * H(i, k, 18), 0.03 + 0.08 * H(i, k, 19), i + k, 0.8);
  for (let i = 0; i < (o.cracks ?? 1); i++) { const x = wm * H(i, k, 20), y = hm * H(i, k, 21), L = 0.25 + 0.7 * H(i, k, 22); crackLine(X, jag(x, y, x + (H(i, k, 23) - 0.5) * L * 0.5, y - L, i + k * 3, 8, 0.02), 0.0045 + 0.004 * H(i, k, 24), 0.85); }
}
let FRAME_TEX = null;
function frameTextures() {
  if (FRAME_TEX) return FRAME_TEX;
  const a = cv(FR.W, FR.H, 300), g = a.g, hw = FR.W / 2, cw2 = FR.cw / 2, stones = [];
  g.fillStyle = rgba(C.lime, 1); g.fillRect(0, 0, FR.W, FR.H);
  const jt = [0, 0.416, 0.832, 1.248, 1.664, 2.08];   // five jamb courses
  for (const s of [-1, 1]) for (let c = 0; c < 5; c++) {
    const y0 = jt[c] + (c ? (H(c, s + 3) - 0.5) * 0.012 : 0), y1 = jt[c + 1] + (c < 4 ? (H(c + 1, s + 3) - 0.5) * 0.012 : 0), x0 = s < 0 ? -hw : cw2, x1 = s < 0 ? -cw2 : hw;
    stones.push({ x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }
  stones.push({ x0: -hw, x1: hw, y0: 2.08, y1: 2.4, w: FR.W, h: 0.32, cx: 0, cy: 2.24 }); stones.push({ x0: -hw, x1: hw, y0: 2.4, y1: 2.62, w: FR.W, h: 0.22, cx: 0, cy: 2.51 });
  stones.forEach((st, j) => {
    const k = 19 * j, tone = 0.9 + 0.2 * H(j, 3), X = { g, ppm: 300 };
    g.save(); g.beginPath(); g.rect(st.x0 + hw, st.y0, st.w, st.h); g.clip(); g.translate(hw, 0);
    g.fillStyle = rgba(sh(C.lime, tone), 1); g.fillRect(st.x0, st.y0, st.w, st.h);
    for (let i = 0; i < 6; i++) blob(g, st.x0 + st.w * H(i, k, 1), st.y0 + st.h * H(i, k, 2), st.w * (0.12 + 0.3 * H(i, k, 3)), st.h * (0.1 + 0.3 * H(i, k, 4)), (H(i, k, 5) - 0.5) * 0.6, H(i, k, 6) < 0.5 ? C.limeSh : C.chip, 0.08 + 0.1 * H(i, k, 7));
    if (st.cy < 2.2) blob(g, st.cx, st.y0, st.w * 0.55, 0.12, 0, C.stain, 0.2);   // sand-stained feet
    for (let i = 0; i < 2; i++) blob(g, st.x0 + st.w * H(i, k, 8), st.cy + st.h * 0.3, 0.02 + 0.03 * H(i, k, 9), st.h * (0.3 + 0.4 * H(i, k, 10)), 0, C.stain, 0.2);
    for (let i = 0; i < 18; i++) cutMark(X, st.x0 + st.w * Q(i, k), st.y0 + st.h * H(i, k, 11), 0.04 + 0.17 * H(i, k, 12), 0.002 + 0.008 * H(i, k, 13), (18 + 60 * H(i, k, 14)) * DEG * (H(i, k, 15) < 0.5 ? 1 : -1), 0.46);   // 18 chisel cuts
    for (let i = 0; i < 4; i++) chipMark(X, st.x0 + st.w * (0.1 + 0.8 * H(i, k, 16)), st.y0 + st.h * (0.12 + 0.76 * H(i, k, 17)), 0.03 + 0.08 * H(i, k, 18), i + k, 0.85);   // 4 chips
    g.restore();
    // the joint round the stone: a dark gap with a pale lip
    g.save(); g.translate(hw, 0); for (const [xa, ya, xb, yb] of [[st.x0, st.y0, st.x1, st.y0], [st.x0, st.y1, st.x1, st.y1], [st.x0, st.y0, st.x0, st.y1], [st.x1, st.y0, st.x1, st.y1]]) {
      const pts = jag(xa, ya, xb, yb, j * 5 + xa * 7, Math.ceil(Math.hypot(xb - xa, yb - ya) / 0.12), 0.0025); crackLine({ g, ppm: 300 }, pts, 0.0055, 0.8); }
    g.restore();
  });
  const rev = cv(1.4, 2.1, 240); paintRock(rev, { k: 301, blobs: 40, stains: 12, cuts: 70, chips: 6, cracks: 2 });
  return (FRAME_TEX = { atlas: tex(a.c), reveal: tex(rev.c) });
}
function buildFrame(P) {
  const T = frameTextures(), atlasM = setRole(mat("#ffffff", { map: T.atlas, roughness: 0.92 })), revM = setRole(mat("#ffffff", { map: T.reveal, roughness: 0.92 }));
  const mats = [revM, revM, revM, revM, atlasM, atlasM], hw = FR.W / 2, cw2 = FR.cw / 2, parts = [];
  const add = (x0, x1, y0, y1, j) => {
    const w = x1 - x0 - 0.004, h = y1 - y0 - 0.004, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, g = new RoundedBoxGeometry(w, h, FR.D, 2, 0.013);
    wrapUV(g, (x, y, z, nx, ny, nz) => (Math.abs(nz) > 0.5 ? [(x + cx + hw) / FR.W, (y + cy) / FR.H] : Math.abs(nx) > 0.5 ? [(z + 0.155) / 1.4, (y + cy) / 2.1] : [(x + 0.2) / 1.4, (z + 0.155) / 2.1]));
    parts.push({ g, x: cx, y: cy, j });
  };
  const jt = [0, 0.416, 0.832, 1.248, 1.664, 2.08];
  for (const s of [-1, 1]) for (let c = 0; c < 5; c++) add(s < 0 ? -hw : cw2, s < 0 ? -cw2 : hw, jt[c], jt[c + 1], c);
  add(-hw, hw, 2.08, 2.4, 10); add(-hw - 0.012, hw + 0.012, 2.4, 2.62, 11);
  for (const p of parts) { const m = mesh(p.g, mats, P.whole, p.x, p.y, 0); m.rotation.z = (H(p.j, 4) - 0.5) * 0.002; }
}
// the tunnel behind the frame: four walls and a back, painted rock, darkening with depth
function buildTunnel(P) {
  const w2 = FR.cw / 2, ch = FR.ch, z0 = -FR.D / 2, z1 = CLIFF.Z0, D = z0 - z1;
  const mk = (k, wm, hm, o = {}) => { const X = cv(wm, hm, 180); paintRock(X, { k, blobs: 30, stains: 8, cuts: 50, chips: 5, cracks: 2, base: o.base ?? C.tunnel, ...o }); return mat("#ffffff", { map: tex(X.c), vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }); };
  const dark = (z) => lerp(1, 0.1, smooth((z0 - z - 0.15) / 2.4));
  const wall = (side, k) => gridMesh(14, 4, (u, v) => [side * w2, v * ch, lerp(z0, z1, u)], (u, v, p) => { const d = dark(p[2]) * (0.9 + 0.1 * v), j = 0.94 + 0.12 * H(Math.round(u * 14), Math.round(v * 4), k); return [d * j, d * j, d * j]; });
  mesh(wall(-1, 1), mk(21, D, ch), P.whole, 0, 0, 0, false, true); mesh(wall(1, 2), mk(22, D, ch), P.whole, 0, 0, 0, false, true);
  mesh(gridMesh(14, 4, (u, v) => [lerp(-w2, w2, v), ch, lerp(z0, z1, u)], (u, v, p) => { const d = dark(p[2]) * 0.85; return [d, d, d]; }), mk(23, D, FR.cw), P.whole, 0, 0, 0, false, true);
  mesh(gridMesh(14, 4, (u, v) => [lerp(-w2, w2, v), 0, lerp(z0, z1, u)], (u, v, p) => { const d = dark(p[2]) * (1 - 0.15 * Math.abs(v - 0.5)); return [d, d, d]; }), mk(24, D, FR.cw, { base: C.tunnel, cuts: 10, chips: 12, blobs: 50 }), P.whole, 0, 0, 0, false, true);
  mesh(gridMesh(4, 4, (u, v) => [lerp(-w2, w2, u), v * ch, z1], () => [0.1, 0.1, 0.1]), mk(25, FR.cw, ch), P.whole, 0, 0, 0, false, true);
}
// the cliff: six strata, each its own rough grid with its own ledge; the frame zone is left open (the frame covers it)
let CLIFF_TEX = null;
function cliffTexture() {
  if (CLIFF_TEX) return CLIFF_TEX;
  const X = cv(30, CLIFF.Y, 70), g = X.g, W = 30, Hh = CLIFF.Y;
  g.fillStyle = "#F2E8D6"; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 170; i++) blob(g, W * H(i, 1), Hh * H(i, 2), 0.5 + 2.4 * H(i, 3), 0.12 + 0.5 * H(i, 4), (H(i, 5) - 0.5) * 0.2, H(i, 6) < 0.5 ? C.limeSh : H(i, 6) < 0.8 ? C.chip : C.stain, 0.08 + 0.12 * H(i, 7));
  for (let i = 0; i < 900; i++) {   // hewn facets: each its own place and size, a pale top edge and a dark lower edge
    const cx = W * Q(i, 1), cy = Hh * H(i, 70), w = 0.2 + 0.5 * H(i, 71), h = 0.14 + 0.28 * H(i, 72), j = (a) => (H(i, a) - 0.5) * 0.2;
    const pts = [[cx - w / 2 * (1 + j(73)), cy - h / 2 * (1 + j(74))], [cx + w / 2 * (1 + j(75)), cy - h / 2 * (1 + j(76))], [cx + w / 2 * (1 + j(77)), cy + h / 2 * (1 + j(78))], [cx - w / 2 * (1 + j(79)), cy + h / 2 * (1 + j(80))]];
    g.beginPath(); pts.forEach((p, q) => (q ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = rgba(H(i, 81) < 0.5 ? C.limeSh : C.chip, 0.07 + 0.1 * H(i, 82)); g.fill();
    line(g, pts[3][0], pts[3][1], pts[2][0], pts[2][1], 0.01 + 0.01 * H(i, 83), C.limeSh, 0.3); line(g, pts[0][0], pts[0][1] - 0.008, pts[1][0], pts[1][1] - 0.008, 0.008, sh(C.chip, 1.1), 0.28);
  }
  let yb = 0; for (let s = 0; s < 5; s++) {   // the strata joints: wavy, broken, a dark line with a pale one below it
    yb += CLIFF.strata[s]; let x = 0;
    while (x < W) { const L = 0.5 + 2.2 * H(Math.round(x * 3), s, 41); if (H(Math.round(x * 5), s, 42) < 0.78) crackLine(X, jag(x, yb - 0.02, x + L, yb - 0.02 + (H(Math.round(x * 7), s, 43) - 0.5) * 0.08, Math.round(x * 11) + s * 9, Math.ceil(L / 0.15), 0.014), 0.008 + 0.006 * H(Math.round(x), s, 44), 0.55); x += L; }
  }
  { let y0 = 0; for (let s = 0; s < 6; s++) { const y1 = y0 + CLIFF.strata[s]; for (const b of CBLK[s]) if (b.x1 < 15) crackLine(X, jag(b.x1, y0 + 0.03, b.x1 + (H(s, b.x1 * 3, 5) - 0.5) * 0.1, y1 - 0.03, Math.round(b.x1 * 13) + s, Math.ceil((y1 - y0) / 0.14), 0.015), 0.01, 0.7); y0 = y1; } }   // vertical joints between the blocks of each bed
  for (let i = 0; i < 56; i++) blob(g, W * H(i, 50), Hh * H(i, 51), 0.03 + 0.08 * H(i, 52), 0.2 + 0.8 * H(i, 53), 0, C.stain, 0.1 + 0.12 * H(i, 54), 0.6);   // vertical weathering streaks
  for (let i = 0; i < 700; i++) cutMark(X, W * Q(i, 3), Hh * H(i, 55), 0.04 + 0.2 * H(i, 56), 0.003 + 0.01 * H(i, 57), (H(i, 58) - 0.5) * 1.4, 0.26);   // chisel dashes
  for (let i = 0; i < 90; i++) chipMark(X, W * Q(i, 5), Hh * H(i, 59), 0.04 + 0.14 * H(i, 60), i, 0.5);
  for (let i = 0; i < 26; i++) { const x = W * H(i, 61), y = Hh * H(i, 62), L = 0.25 + 0.6 * H(i, 63); crackLine(X, jag(x, y, x + (H(i, 64) - 0.5) * 0.5, y - L, i + 5, 8, 0.03), 0.004 + 0.003 * H(i, 65), 0.7); }
  const sd = g.createLinearGradient(0, 0, 0, 0.55); sd.addColorStop(0, "rgba(240,205,150,0.9)"); sd.addColorStop(1, "rgba(240,205,150,0)"); g.fillStyle = sd; g.fillRect(0, 0, W, 0.55);   // drifted sand at the foot
  for (let i = 0; i < 90; i++) blob(g, W * H(i, 66), 0.05 + 0.5 * H(i, 67), 0.2 + 0.6 * H(i, 68), 0.05 + 0.12 * H(i, 69), 0, hex("#F0D0A0"), 0.3);
  return (CLIFF_TEX = tex(X.c));
}
function cliffGeo() {
  const hw = FR.W / 2, xs = [], pos = [], col = [], uv = [], idx = [];
  for (let i = 0; i <= 56; i++) xs.push(lerp(-CLIFF.X, -hw, i / 56)); for (let i = 1; i < 9; i++) xs.push(lerp(-hw, hw, i / 9)); for (let i = 0; i <= 56; i++) xs.push(lerp(hw, CLIFF.X, i / 56));
  const NX = xs.length, inFrame = (xa, xb, yb) => xa >= -hw - 1e-6 && xb <= hw + 1e-6 && yb <= FR.H + 1e-6;
  const zf = (s, x, y) => CLIFF.off[s] + blk(s, x).dz + 0.06 * 2 * (vn(x * 1.3, y * 2.2, s) - 0.5) + 0.018 * (H(Math.round(x * 4), Math.round(y * 8), s) - 0.5);
  const tone = (s, x, y, v) => { const k = CLIFF.tone[s] * (0.86 + 0.28 * vn(x * 0.8, y * 2, s + 9)) * (0.86 + 0.24 * v) * 1.22 * blk(s, x).t; return C.lime.map((c) => (c / 255) * k); };
  let y0 = 0;
  const edge = [];   // per stratum: its bottom and top z along xs, for the ledge strips
  CLIFF.strata.forEach((h, s) => {
    const NR = Math.max(2, Math.ceil(h / 0.17)), base = pos.length / 3;
    for (let r = 0; r <= NR; r++) for (let c = 0; c < NX; c++) {
      const y = y0 + (h * r) / NR, x = xs[c], z = zf(s, x, y) + 0.02 * (r / NR), cc = tone(s, x, y, r / NR);
      pos.push(x, y, z); col.push(cc[0], cc[1], cc[2]); uv.push((x + CLIFF.X) / 30, y / CLIFF.Y);
    }
    for (let r = 0; r < NR; r++) for (let c = 0; c < NX - 1; c++) { if (inFrame(xs[c], xs[c + 1], y0 + (h * (r + 1)) / NR)) continue; const a = base + r * NX + c, b = a + 1, d = a + NX, e = d + 1; idx.push(a, b, e, a, e, d); }
    edge.push({ lo: (c) => pos[(base + c) * 3 + 2], hi: (c) => pos[(base + NR * NX + c) * 3 + 2], yl: y0, yh: y0 + h }); y0 += h;
  });
  for (let s = 0; s < 5; s++) {   // the ledge: the strip between the top of s and the foot of s + 1
    const yb = edge[s].yh, base = pos.length / 3;
    for (let c = 0; c < NX; c++) { const x = xs[c], cc = tone(s, x, yb, 1).map((q) => q * 1.1); pos.push(x, yb, edge[s].hi(c)); col.push(cc[0], cc[1], cc[2]); uv.push((x + CLIFF.X) / 30, yb / CLIFF.Y); pos.push(x, yb, edge[s + 1].lo(c)); col.push(cc[0] * 0.85, cc[1] * 0.85, cc[2] * 0.85); uv.push((x + CLIFF.X) / 30, yb / CLIFF.Y); }
    for (let c = 0; c < NX - 1; c++) { if (inFrame(xs[c], xs[c + 1], yb)) continue; const a = base + c * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  }
  // the top: a rough sandy plateau, and the two ends
  { const base = pos.length / 3, NZ = 6; for (let r = 0; r <= NZ; r++) for (let c = 0; c < NX; c++) { const x = xs[c], z = lerp(0.0, CLIFF.Z0, r / NZ), y = CLIFF.Y + 0.1 * (vn(x * 0.5, z * 0.9, 31) - 0.5) + 0.03 * (H(c, r, 5) - 0.5); pos.push(x, y, z); const k = 0.95 + 0.1 * H(c, r, 6); col.push(0.86 * k, 0.76 * k, 0.58 * k); uv.push((x + CLIFF.X) / 30, 0.97); }
    for (let r = 0; r < NZ; r++) for (let c = 0; c < NX - 1; c++) { const a = base + r * NX + c; idx.push(a, a + NX, a + NX + 1, a, a + NX + 1, a + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// low wind ridges: an elongated crest, gentle windward flank, steeper lee, vertex-shaded
function ridgeGeo(L, W, Hh, seed) {
  const gnd = rgb("#FCDEA0"), lee = mixc(rgb("#B58B62"), rgb("#FCDEA0"), 0.25);
  return gridMesh(26, 9, (u, v) => {
    const prof = v < 0.4 ? smooth(v / 0.4) ** 1.3 : 1 - smooth((v - 0.4) / 0.6) ** 0.85, ends = Math.sin(Math.PI * u) ** 0.8, nz = 0.85 + 0.3 * vn(u * 5, v * 3, seed);
    return [(v - 0.5) * W, -0.03 + (Hh + 0.03) * prof * ends * nz, (u - 0.5) * L];
  }, (u, v, p) => {   // the rim is the ground's own colour, the windward flank a little lighter, the lee darker
    const t = smooth((p[1] + 0.03) / (0.03 + Hh * 0.35)), shade = v < 0.4 ? 1.04 : 1.04 - 0.4 * smooth((v - 0.4) / 0.3), k = shade * (0.96 + 0.08 * H(Math.round(u * 26), Math.round(v * 9), seed));
    const c = mixc(gnd, mixc(lee, gnd, clamp(shade - 0.64, 0, 0.4) / 0.4), v < 0.4 ? 1 : 0.0); void c;
    const base = v < 0.4 ? gnd : mixc(gnd, lee, smooth((v - 0.4) / 0.3));
    const m = mixc(gnd, base, t); return [Math.min(1, m[0] * k), Math.min(1, m[1] * k), Math.min(1, m[2] * k)];
  });
}
function groundTextures() {
  const g1 = cv(64, 58, 24), g = g1.g, gp = (x, z) => [x + 32, 29 - z];
  g.fillStyle = rgba(sh(C.desert, 1.32), 1); g.fillRect(0, 0, 64, 58);
  for (let i = 0; i < 140; i++) blob(g, 64 * H(i, 1), 58 * H(i, 2), 1 + 5 * H(i, 3), 0.5 + 2.2 * H(i, 4), (H(i, 5) - 0.5) * 0.7, H(i, 6) < 0.55 ? sh(C.ridge, 1.1) : hex("#FFE2B0"), 0.14 + 0.14 * H(i, 7));
  for (let i = 0; i < 900; i++) { const x = 64 * H(i, 8), y = 58 * H(i, 9), L = 0.3 + 1.3 * H(i, 10), a = (H(i, 11) - 0.5) * 0.5; line(g, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, 0.012 + 0.03 * H(i, 12), H(i, 13) < 0.5 ? sh(C.ridge, 1.05) : hex("#FFEBC0"), 0.16 + 0.2 * H(i, 14)); }
  const lane = cv(10, 29.6, 64), lg = lane.g;
  for (let i = 0; i < 1100; i++) {   // fine wind ripples: each its own place, length, width, strength
    const x = 10 * H(i, 20), y = 29.6 * H(i, 21), L = 0.1 + 0.5 * H(i, 22), a = (H(i, 23) - 0.5) * 0.4, w = 0.004 + 0.011 * H(i, 24);
    line(lg, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, w, hex("#FFF0C8"), 0.25 + 0.35 * H(i, 25)); line(lg, x, y - w * 1.3, x + Math.cos(a) * L, y - w * 1.3 + Math.sin(a) * L, w * 0.9, sh(C.ridge, 0.8), 0.22 + 0.25 * H(i, 26));
  }
  for (let i = 0; i < 240; i++) blob(lg, 10 * H(i, 27), 29.6 * H(i, 28), 0.04 + 0.1 * H(i, 29), 0.03 + 0.06 * H(i, 30), 0, hex("#7a5a40"), 0.12 + 0.12 * H(i, 31), 0.7);   // pits and pebble shadows
  for (const [tx, z0] of [[-1.3, 24], [0.15, 25], [1.35, 23]]) for (let i = 0; i < 20; i++) {   // sandal prints, walking toward the mouth
    const x = 5 + tx + (i % 2 ? 0.13 : -0.13) + (H(i, tx * 9, 3) - 0.5) * 0.05, y = 25.9 - (z0 - i * 1.0 - H(i, tx * 7, 4) * 0.2);
    blob(lg, x, y, 0.05, 0.12, (H(i, tx, 5) - 0.5) * 0.3, hex("#7a5a40"), 0.3, 0.6); blob(lg, x + 0.012, y + 0.02, 0.045, 0.1, 0, hex("#F0D7A8"), 0.2, 0.6);
  }
  const edgeG = lg.createLinearGradient(0, 0, 10, 0); void edgeG;
  return { ground: tex(g1.c), lane: tex(lane.c), gp };
}
function buildSaqqara(P) {
  const S = P.spec, G = P.whole, T = groundTextures();
  // the ground slab 64 x 0.22 x 58, top at y 0
  { const side = quiet(mat("#B58B62", { roughness: 1 })), top = quiet(mat("#ffffff", { map: T.ground, roughness: 1 })), m = mesh(new THREE.BoxGeometry(64, 0.22, 58), [side, side, top, side, side, side], G, 0, -0.11, 0, false, true); void m; }
  if (S.apron ?? true) { const ap = new THREE.PlaneGeometry(700, 700); ap.rotateX(-Math.PI / 2); mesh(ap, quiet(mat("#F2D095", { roughness: 1 })), G, 0, -0.012, 0, false, true); }
  // the haul lane: ripples, pits, prints (an overlay a hair above the slab)
  { const ln = new THREE.PlaneGeometry(10, 29.6); ln.rotateX(-Math.PI / 2); const m = quiet(mat("#ffffff", { map: T.lane, roughness: 1, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false })); lookOnly(mesh(ln, m, G, 0, 0.002, -3.7 + 14.8, false, true)); }
  // thirteen ridges outside the lanes, .03 to .21 high
  for (let i = 0; i < 13; i++) {
    const side = i % 2 ? -1 : 1, L = 6 + 15 * H(i, 40), W = 1.2 + 2.4 * H(i, 41), Hh = 0.03 + (0.18 * ((i * 5) % 13)) / 12, rot = (H(i, 42) - 0.5) * 0.5;
    const x = side * (3.4 + L * 0.13 + W + 20 * H(i, 43) ** 1.2), z = lerp(-24, 24, H(i, 44));
    const r = lookOnly(mesh(ridgeGeo(L, W, Hh, i), quiet(mat("#ffffff", { vertexColors: true, roughness: 1 })), G, x, 0, z, false, true)); r.rotation.y = rot;
  }
  // pebbles on the lane: real small stones
  { const ig = new THREE.IcosahedronGeometry(1, 0), im = new THREE.InstancedMesh(ig, quiet(mat("#ffffff", { roughness: 0.95, flatShading: true })), 150), M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), E = new THREE.Euler(), col = new THREE.Color();
    for (let i = 0; i < 150; i++) {
      const s = 0.008 + 0.04 * H(i, 50) ** 2.2; E.set(H(i, 51) * 3, H(i, 52) * 6, H(i, 53) * 3); Qn.setFromEuler(E);
      M.compose(V.set(lerp(-4.5, 4.5, H(i, 54)), s * 0.35, lerp(-2.4, 25, H(i, 55))), Qn, Sc.set(s * (1 + 0.4 * H(i, 56)), s * 0.7, s)); im.setMatrixAt(i, M); im.setColorAt(i, col.set(["#B58B62", "#CAB093", "#9a7a5a", "#C9A576"][Math.floor(H(i, 57) * 4)]));
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; lookOnly(im); G.add(im); }
  // the cliff across x +-15, front plane z 0, 4.2 high
  if (S.cliff ?? true) { const m = quiet(mat("#ffffff", { map: cliffTexture(), vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })); mesh(cliffGeo(), m, G, 0, 0, 0, false, true); }
  if (S.mouth ?? true) { buildFrame(P); buildTunnel(P); }
  return { grip: 0, apply() {} };
}

// ===========================================================================================================================
// djoser: the step pyramid, six tiers (DESIGN section 6, "Djoser 121 x 109 x 60 m at .11")
const DJ = { X: [13.31, 11.52, 9.73, 7.95, 6.16, 4.38], Z: [11.99, 10.32, 8.66, 6.99, 5.33, 3.67], H: [1.21, 1.18, 1.13, 1.1, 1.03, 0.95], batter: Math.tan(6 * DEG), bevel: 0.042 };
// one face of one tier: eight courses (seven course lines .015 wide, each course +-8% tone), block joints, 11 chips .04-.19, stains
function paintDjFace(wm, hm, k) {
  const ppm = Math.min(70, 900 / wm), X = cv(wm, hm, ppm), g = X.g, base = C.lime;
  g.fillStyle = rgba(base, 1); g.fillRect(0, 0, wm, hm);
  for (let c = 0; c < 8; c++) { g.fillStyle = rgba(sh(C.lime, 1 + 0.16 * (H(c, k, 1) - 0.5)), 1); g.fillRect(0, (hm * c) / 8, wm, hm / 8 + 0.002); }
  for (let c = 0; c < 8; c++) {   // block joints within the course
    let x = wm * H(c, k, 2) * 0.2; while (x < wm) { line(g, x, (hm * c) / 8, x + (H(Math.round(x * 9), k, c) - 0.5) * 0.02, (hm * (c + 1)) / 8, 0.01, sh(C.limeSh, 1.05), 0.55); x += (0.3 + 0.7 * H(Math.round(x * 7) + c, k, 3)) * Math.max(0.4, wm / 14); }
  }
  for (let c = 1; c < 8; c++) line(g, 0, (hm * c) / 8, wm, (hm * c) / 8, 0.015, C.limeSh, 0.7);   // the seven course lines
  for (let i = 0; i < 40; i++) blob(g, wm * H(i, k, 4), hm * H(i, k, 5), wm * (0.04 + 0.12 * H(i, k, 6)), hm * (0.08 + 0.25 * H(i, k, 7)), 0, H(i, k, 8) < 0.5 ? C.limeSh : C.chip, 0.06 + 0.08 * H(i, k, 9));
  for (let i = 0; i < 11; i++) chipMark(X, wm * Q(i, k), hm * H(i, k, 10), 0.04 + 0.15 * H(i, k, 11), i + k, 0.8);   // 11 chips .04-.19
  for (let i = 0; i < 5; i++) blob(g, wm * H(i, k, 12), hm * 0.3 * H(i, k, 13), 0.1 + 0.4 * H(i, k, 14), 0.05, 0, C.stain, 0.2);
  return { tex: tex(X.c) };
}
function buildDjoser(P) {
  const S = P.spec, K = (S.s ?? 0.11) / 0.11, G = new THREE.Group(); G.scale.setScalar(K); P.whole.add(G);
  const c = DJ.bevel; let y0 = 0;
  const ringPts = (y, a, b) => [[-(a - c), y, b], [a - c, y, b], [a, y, b - c], [a, y, -(b - c)], [a - c, y, -b], [-(a - c), y, -b], [-a, y, -(b - c)], [-a, y, b - c]];
  DJ.H.forEach((h, t) => {
    const a0 = DJ.X[t] / 2, b0 = DJ.Z[t] / 2, ab = (y) => [a0 - y * DJ.batter, b0 - y * DJ.batter], hb = h - 0.035, A = ab(0), Bq = ab(hb), Tq = ab(h);
    const R0 = ringPts(y0, A[0], A[1]), R1 = ringPts(y0 + hb, Bq[0], Bq[1]), R2 = ringPts(y0 + h, Tq[0] - 0.03, Tq[1] - 0.03);
    const slant = hb / Math.cos(6 * DEG);
    for (let f = 0; f < 4; f++) {   // the four faces, each with its own painted marks (k = face + 19 tier)
      const i = f * 2, a = R0[i], b = R0[i + 1], d = R1[i + 1], e = R1[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...d, ...e], 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      mesh(geo, quiet(mat("#ffffff", { map: paintDjFace(L, slant, f + 19 * t).tex, roughness: 0.95 })), G, 0, 0, 0, false, true);
    }
    // the corner facets, the top bevel and the top (a ledge of the next tier) in one vertex-coloured mesh
    const pos = [], col = [], idx = [], tone = (0.92 + 0.12 * H(t, 5)), push = (p, k) => { pos.push(...p); col.push(0.72 * tone * k, 0.6 * tone * k, 0.45 * tone * k); return pos.length / 3 - 1; };
    for (let i = 1; i < 8; i += 2) { const q = [push(R0[i], 0.85), push(R0[(i + 1) % 8], 0.85), push(R1[(i + 1) % 8], 0.9), push(R1[i], 0.9)]; idx.push(q[0], q[1], q[2], q[0], q[2], q[3]); }
    for (let i = 0; i < 8; i++) { const q = [push(R1[i], 1.0), push(R1[(i + 1) % 8], 1.0), push(R2[(i + 1) % 8], 1.12), push(R2[i], 1.12)]; idx.push(q[0], q[1], q[2], q[0], q[2], q[3]); }
    const cIdx = R2.map((p, i) => push(p, 1.1 + 0.06 * H(i, t))), mid = push([0, y0 + h, 0], 1.1); for (let i = 0; i < 8; i++) idx.push(mid, cIdx[i], cIdx[(i + 1) % 8]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    mesh(geo, quiet(mat("#ffffff", { vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })), G, 0, 0, 0, false, true);
    y0 += h;
  });
  return { grip: 0, apply() {} };
}

// ===========================================================================================================================
// waterjar: the clay jar, 0.38 high, and its pour
const JAR = { pivot: 0.3 };
function jarProfile() {
  return [[0, 0], [0.058, 0], [0.064, 0.012], [0.098, 0.04], [0.135, 0.09], [0.155, 0.14], [0.15, 0.19], [0.118, 0.245], [0.075, 0.285], [0.0525, 0.31], [0.0505, 0.345], [0.0575, 0.365], [0.0675, 0.38], [0.0595, 0.3835], [0.0455, 0.372], [0.0425, 0.345], [0.045, 0.3]].map(([r, y]) => new THREE.Vector2(r, y));
}
function jarTexture() {
  const wm = TAU * 0.155, X = cv(wm, 0.38, 420), g = X.g;
  g.fillStyle = rgba(C.jar, 1); g.fillRect(0, 0, wm, 0.38);
  for (let i = 0; i < 40; i++) blob(g, wm * H(i, 1), 0.38 * H(i, 2), 0.04 + 0.12 * H(i, 3), 0.01 + 0.04 * H(i, 4), (H(i, 5) - 0.5) * 0.4, H(i, 6) < 0.5 ? C.jar2 : hex("#C9784F"), 0.1 + 0.12 * H(i, 7));
  const wetg = g.createLinearGradient(0, 0, 0, 0.17); wetg.addColorStop(0, rgba(C.jar2, 0.55)); wetg.addColorStop(1, rgba(C.jar2, 0)); g.fillStyle = wetg; g.fillRect(0, 0, wm, 0.17);   // the lower third darkened by water
  for (const [y, w] of [[0.255, 0.006], [0.24, 0.003], [0.108, 0.004], [0.097, 0.006]]) line(g, 0, y, wm, y, w, C.jar2, 0.7);   // slip bands
  for (let i = 0; i < 6; i++) {   // six hand-drawn arcs, 0.004 wide, swagged round the belly
    const x0 = wm * (i / 6) + 0.03, x1 = wm * ((i + 1) / 6) - 0.03, ya = 0.225 + (H(i, 20) - 0.5) * 0.008;
    g.strokeStyle = rgba(C.jar2, 0.9); g.lineWidth = 0.004; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, ya); g.quadraticCurveTo((x0 + x1) / 2, ya - 0.07 - 0.01 * H(i, 21), x1, ya); g.stroke();
    for (let d = 0; d < 3; d++) { g.fillStyle = rgba(C.jar2, 0.85); g.beginPath(); g.arc(lerp(x0, x1, 0.3 + 0.2 * d), ya - 0.05 - 0.004 * H(i, 22 + d), 0.0042, 0, TAU); g.fill(); }
  }
  for (let i = 0; i < 28; i++) { const x = wm * H(i, 30), y = 0.38 * H(i, 31); line(g, x, y, x + 0.01 + 0.03 * H(i, 32), y + (H(i, 33) - 0.5) * 0.02, 0.0015 + 0.002 * H(i, 34), hex("#E0A27A"), 0.25 + 0.3 * H(i, 35)); }   // scratches
  for (let i = 0; i < 2; i++) chipMark({ g, ppm: 420 }, wm * (0.2 + 0.5 * H(i, 40)), 0.34 + 0.04 * H(i, 41), 0.012 + 0.01 * H(i, 42), i + 3, 0.7);
  for (let i = 0; i < 6; i++) blob(g, wm * H(i, 43), 0.3 - 0.1 * H(i, 44), 0.008, 0.04 + 0.04 * H(i, 45), 0, hex("#C9784F"), 0.3);   // slip drips
  return tex(X.c);
}
function buildJar(P) {
  const S = P.spec, G = P.whole, jar = new THREE.Group(); jar.position.set(0, JAR.pivot, 0); G.add(jar);
  const clay = mat("#ffffff", { map: jarTexture(), roughness: 0.78 }), inside = mat("#2a1810", { roughness: 1, side: THREE.DoubleSide });
  const lg = new THREE.LatheGeometry(jarProfile(), 44); wrapUV(lg, (x, y, z) => [Math.atan2(x, z) / TAU + 0.5, y / 0.38]);
  const body = mesh(lg, clay, jar, 0, -JAR.pivot, 0);
  void inside;
  for (const s of [-1, 1]) {   // two handles .095 high, from the neck to the shoulder, on +-z
    const pts = [[0, 0.347, 0.049], [0, 0.357, 0.075], [0, 0.338, 0.101], [0, 0.295, 0.121], [0, 0.262, 0.123], [0, 0.248, 0.112]].map(([x, y, z]) => [x, y - JAR.pivot, z * s]);
    mesh(tubeGeo(pts, 0.0115, 8, false, 24), clay, jar, 0, 0, 0);
  }
  // the water: four streams .007-.014 across, eleven drops, a small splash, in the prop's own frame (they do not tilt with the jar)
  const waterM = new THREE.MeshBasicMaterial({ color: "#ABC8CE", transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }); waterM.userData.noOutline = true;
  const R = [0.0035, 0.0055, 0.0068, 0.0045], ZO = [-0.022, -0.008, 0.007, 0.021];
  const streams = R.map(() => steamy(new THREE.Mesh(new THREE.BufferGeometry(), waterM), 7));
  const dropG = new THREE.SphereGeometry(0.003, 6, 5), drops = Array.from({ length: 11 }, () => steamy(new THREE.Mesh(dropG, waterM), 7)), splash = Array.from({ length: 7 }, () => steamy(new THREE.Mesh(dropG, waterM), 7));
  for (const o of [...streams, ...drops, ...splash]) { G.add(o); o.visible = false; }
  const fall = S.fall ?? 0.26, reach = S.reach ?? 0.21;
  return {
    grip: 0,
    apply(ps, t = 0) {
      const pour = clamp(num(ps, S, "pour")), phi = pour * 68 * DEG; jar.rotation.z = -phi;
      // the lowest rim point after the tilt (pivot at the handles)
      const rx = 0.0675 * Math.cos(phi) + (0.38 - JAR.pivot) * Math.sin(phi), ry = JAR.pivot - 0.0675 * Math.sin(phi) + (0.38 - JAR.pivot) * Math.cos(phi);
      const flow = smooth((pour - 0.48) / 0.25), path = (s, zo, i) => [rx + reach * s + 0.004 * Math.sin(s * 13 - t * 17 + i * 1.7) * s, ry - fall * s * s, zo + 0.003 * Math.sin(s * 9 - t * 13 + i * 2.3) * s];
      streams.forEach((m, i) => {
        m.visible = flow > 0.01; if (!m.visible) return;
        const n = 14, pts = []; for (let j = 0; j <= n; j++) pts.push(path((flow * j) / n, ZO[i] * (1 + 0.5 * flow * j / n), i));
        m.geometry.dispose(); m.geometry = tubeGeo(pts, R[i] * (0.8 + 0.2 * Math.sin(t * 21 + i)), 5, false, n);
      });
      drops.forEach((m, i) => {
        const s = (i / 11 + t * (0.9 + 0.3 * H(i, 1)) + H(i, 2)) % 1; m.visible = flow > 0.05 && s < flow; if (!m.visible) return;
        const p = path(s, (H(i, 3) - 0.5) * 0.06, i); m.position.set(p[0] + (H(i, 4) - 0.5) * 0.03, p[1], p[2]);
      });
      splash.forEach((m, i) => {
        m.visible = flow > 0.95; if (!m.visible) return;
        const ph = (t * 2.4 + H(i, 5)) % 1, a = (i / 7) * TAU, r = 0.015 + 0.05 * ph;
        m.position.set(rx + reach + Math.cos(a) * r, ry - fall + 0.045 * Math.sin(Math.PI * ph) , Math.sin(a) * r);
      });
    },
  };
}

// ===========================================================================================================================
// wetsand: two dark wet patches in the sand ahead of the runners, and the dark runner tracks left behind
const WET = { w: 0.61, l: 2.02, cx: 0.34, feather: 0.047, scallop: 0.023 };
function wetCanvas(side) {
  const X = cv(WET.w, WET.l, 400), g = X.g, a = WET.w / 2 - WET.feather - WET.scallop, b = WET.l / 2 - WET.feather - WET.scallop, pts = [];
  for (let i = 0; i < 21; i++) { const th = (i / 21) * TAU + (H(i, side, 1) - 0.5) * 0.18, k = 1 + 0.05 * (H(i, side, 2) - 0.5); pts.push([WET.w / 2 + Math.cos(th) * a * k, WET.l / 2 + Math.sin(th) * b * k, th]); }
  const path = () => {   // 21 edge points joined by outward scallops
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < 21; i++) { const p = pts[i], n = pts[(i + 1) % 21], mx = (p[0] + n[0]) / 2, my = (p[1] + n[1]) / 2, dx = mx - WET.w / 2, dy = my - WET.l / 2, d = Math.hypot(dx / (WET.w / 2), dy / (WET.l / 2)) || 1, bx = (dx / (WET.w / 2)) / d, by = (dy / (WET.l / 2)) / d, s = WET.scallop * 2 * (0.7 + 0.5 * H(i, side, 3)); g.quadraticCurveTo(mx + bx * s * 0.5, my + by * s, n[0], n[1]); }
    g.closePath();
  };
  for (let k = 0; k < 6; k++) { path(); g.strokeStyle = rgba(sh(C.wet, 0.62), 0.12); g.lineWidth = WET.feather * 2 * (1 - k / 6); g.lineJoin = "round"; g.stroke(); }   // the feathered rim
  path(); g.fillStyle = rgba(sh(C.wet, 0.62), 0.88); g.fill();   // darker than the sand in the sledge's shade too (EG04 Sol r1: #896249 at .8 vanished there)
  path(); g.save(); g.clip();
  for (let i = 0; i < 18; i++) blob(g, WET.w * H(i, side, 4), WET.l * H(i, side, 5), 0.06 + 0.12 * H(i, side, 6), 0.1 + 0.3 * H(i, side, 7), 0, sh(C.wet, 0.45), 0.25);   // deeper wet in the middle
  for (let i = 0; i < 34; i++) { const x = WET.w * H(i, side, 8), y = WET.l * H(i, side, 9); line(g, x, y, x + (H(i, side, 10) - 0.5) * 0.04, y + 0.05 + 0.2 * H(i, side, 11), 0.003 + 0.004 * H(i, side, 12), H(i, side, 13) < 0.5 ? sh(C.wet, 0.6) : hex("#B89270"), 0.3); }   // wet ripples and glints
  g.restore();
  return tex(X.c);
}
function trackCanvas(side) {
  const wm = 0.2, hm = 1.83, X = cv(wm, hm, 300), g = X.g;
  g.fillStyle = rgba(sh(C.wet, 0.82), 0.86); g.fillRect(0.01, 0, wm - 0.02, hm);
  for (let i = 0; i < 4; i++) { const x = 0.03 + 0.14 * (i / 3); const pts = []; for (let j = 0; j <= 30; j++) pts.push([x + (H(j, i + side, 1) - 0.5) * 0.006, (hm * j) / 30]); g.strokeStyle = rgba(sh(C.wet, 0.55), 0.5); g.lineWidth = 0.004; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
  for (const x of [0.008, wm - 0.008]) { for (let j = 0; j < 60; j++) blob(g, x + (H(j, side, 2) - 0.5) * 0.01, hm * H(j, side, 3), 0.012, 0.04 + 0.05 * H(j, side, 4), 0, hex("#E6C896"), 0.5); }   // the little berms the runners pushed up
  const fade = g.createLinearGradient(0, 0, 0, 0.08); fade.addColorStop(0, rgba(C.wet, 0)); fade.addColorStop(1, rgba(C.wet, 0)); void fade;
  return tex(X.c);
}
function buildWet(P) {
  const S = P.spec, G = P.whole, L = S.trackLen ?? 1.83, patches = [], tracks = [];
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const g = new THREE.PlaneGeometry(WET.w, WET.l); g.rotateX(-Math.PI / 2); g.translate(0, 0, -WET.l / 2);   // origin at the +z end, where the jar pours: it grows from there
    const m = quiet(mat("#ffffff", { map: wetCanvas(i), roughness: 0.67, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    const p = lookOnly(mesh(g, m, G, s * WET.cx, 0.004, WET.l / 2, false, true)); p.renderOrder = 2; patches.push(p);
    const tg = new THREE.PlaneGeometry(0.2, L); tg.rotateX(-Math.PI / 2);
    const tm = quiet(mat("#ffffff", { map: trackCanvas(i), roughness: 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    const tr = lookOnly(mesh(tg, tm, G, s * 0.505, 0.006, 0.95 - L / 2, false, true)); tr.renderOrder = 3; tracks.push(tr);
  }
  return {
    grip: 0,
    apply(ps) {
      const wet = clamp(num(ps, S, "wet")), tk = clamp(num(ps, S, "track"));
      // each patch grows from its +z end (where the water lands) down the track; the +x patch (the jar's side, spec.first) first, the
      // other once the pour reaches it (scale only: an opacity tween stuck at its first value in a sequential render, EG04 19 Nov)
      const first = S.first ?? 1;
      patches.forEach((p, i) => { const w = (i === 0 ? -1 : 1) === first ? clamp(wet / 0.6) : clamp((wet - 0.4) / 0.6), k = lerp(0.1, 1, smooth(w)); p.visible = w > 0.001; p.scale.set(lerp(0.35, 1, smooth(w)), 1, k); });
      for (const t of tracks) { t.visible = tk > 0.001; t.scale.z = Math.max(0.001, tk); t.position.z = 0.95 - (L * tk) / 2; }
    },
  };
}

// ===========================================================================================================================
// pounder: the round dolerite hand pounder, .19 x .21 x .15
function pounderGeo() {
  const g = new THREE.SphereGeometry(1, 44, 30), p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), d = new THREE.Vector3();
  const dirOf = (i, a, b) => { const th = H(i, a, 1) * TAU, z = H(i, b, 2) * 2 - 1, r = Math.sqrt(1 - z * z); return new THREE.Vector3(Math.cos(th) * r, z, Math.sin(th) * r); };
  const facets = Array.from({ length: 9 }, (_, i) => ({ n: dirOf(i, 1, 2), c: 0.84 + 0.1 * H(i, 3) })), pits = Array.from({ length: 36 }, (_, i) => ({ n: dirOf(i, 5, 6), rho: 0.05 + 0.1 * H(i, 7), dep: 0.03 + 0.05 * H(i, 8) }));
  const R = [0.095, 0.105, 0.075];
  for (let i = 0; i < n; i++) {
    d.fromBufferAttribute(p, i).normalize(); let r = 1 + 0.05 * (vn(d.x * 2.1 + 5, d.y * 2.1 + d.z * 1.3, 3) - 0.5), chalk = 0, pitd = 0;
    for (const f of facets) { const dt = d.dot(f.n); if (dt > f.c) { r *= f.c / dt; chalk = Math.max(chalk, smooth((dt - f.c) / 0.06) * 0 + 1); } }
    for (const q of pits) { const a = Math.acos(clamp(d.dot(q.n), -1, 1)), w = Math.exp(-((a / q.rho) ** 2) * 2); r *= 1 - q.dep * w; pitd = Math.max(pitd, w); }
    p.setXYZ(i, d.x * r * R[0], d.y * r * R[1], d.z * r * R[2]);
    const mott = 0.86 + 0.28 * vn(d.x * 13 + 2, d.y * 13 + d.z * 9, 9), k = mott * (1 - 0.35 * pitd) * (1 + 0.08 * chalk), c = mixc(rgb("#4b4e54"), rgb("#7d7b78"), chalk * 0.3);
    col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0);
  return wrapUV(g, (x, y, z) => [Math.atan2(x, z) / TAU + 0.5, y / 0.21]);
}
function pounderTexture() {
  const X = cv(0.6, 0.21, 420), g = X.g;
  g.fillStyle = "#cfcfd2"; g.fillRect(0, 0, 0.6, 0.21);
  for (let i = 0; i < 190; i++) { const x = 0.6 * Q(i, 2), y = 0.21 * H(i, 3), r = 0.0012 + 0.0032 * H(i, 4) ** 1.5; g.fillStyle = rgba(H(i, 5) < 0.6 ? hex("#e8e4d8") : hex("#26282c"), 0.4 + 0.45 * H(i, 6)); g.beginPath(); g.ellipse(x, y, r * 1.2, r, H(i, 7) * 3, 0, TAU); g.fill(); }   // feldspar and dark specks
  for (let i = 0; i < 14; i++) { const x = 0.6 * H(i, 8), y = 0.21 * H(i, 9); line(g, x, y, x + 0.02 + 0.05 * H(i, 10), y + (H(i, 11) - 0.5) * 0.03, 0.0012 + 0.0015 * H(i, 12), hex("#f2efe6"), 0.28 + 0.3 * H(i, 13)); }
  for (let i = 0; i < 8; i++) blob(g, 0.6 * H(i, 14), 0.21 * H(i, 15), 0.012 + 0.02 * H(i, 16), 0.008 + 0.014 * H(i, 17), 0, hex("#f5f2e8"), 0.35);   // pale bruises where it has struck
  return tex(X.c);
}
function buildPounder(P) {
  const m = mat("#ffffff", { map: pounderTexture(), vertexColors: true, roughness: 0.88 });
  mesh(pounderGeo(), m, P.whole, 0, 0, 0, true, true);
  return { grip: 0.105, apply() {} };
}

// ===========================================================================================================================
// lever: the 1.22 m wooden lever on its fulcrum block, pry and snap
const LV = { tip: -0.23, butt: 0.99, r0: 0.0235, r1: 0.0325, brk: 0.49, snapT: 0.74, nz: 20, nth: 14 };
const leverR = (z) => lerp(LV.r0, LV.r1, (z - LV.tip) / (LV.butt - LV.tip));
const LV_BREAK = LV.tip + LV.brk;   // the break is .49 from the tip
function leverTexture(seed) {
  const X = cv(1.22, 0.18, 420), k = seed * 5;
  paintWood(X, { base: hex("#9a6d43"), dark: hex("#5e3d24"), light: hex("#cfa571"), k, grain: 6, knots: 2, scuffs: 10, splits: 1 });
  for (let i = 0; i < 16; i++) { const y = 0.18 * H(i, k, 60), x = 1.22 * H(i, k, 61); line(X.g, x, y, x + 0.05 + 0.2 * H(i, k, 62), y, 0.0014, hex("#5e3d24"), 0.14 + 0.1 * H(i, k, 63)); }   // fine faint streaks
  blob(X.g, 1.0, 0.09, 0.11, 0.1, 0, hex("#3d2615"), 0.28, 0.7);   // two hand-polished patches, 0.21 apart
  blob(X.g, 0.79, 0.09, 0.09, 0.1, 0, hex("#3d2615"), 0.24, 0.7);
  blob(X.g, 0.1, 0.09, 0.08, 0.1, 0, hex("#2f1d10"), 0.3, 0.7);   // the worn tip
  return tex(X.c);
}
// one half of the lever (z za..zb), axis along z at y 0; a jagged end shared exactly with its partner
function leverHalf(za, zb, breakAt, seed) {
  const NZ = LV.nz, NT = LV.nth, jg = Array.from({ length: NT }, (_, j) => (H(j, seed * 0 + 77) - 0.5) * 0.07), grains = Array.from({ length: 6 }, (_, i) => H(i, seed, 90) * TAU);
  const zAt = (i, j) => { let z = za + ((zb - za) * i) / NZ; if (breakAt === "b") z += jg[j % NT] * smooth((i / NZ - 0.8) / 0.2); if (breakAt === "a") z += jg[j % NT] * smooth((0.2 - i / NZ) / 0.2); return z; };
  const rad = (z, th) => { let r = leverR(z) * (1 + 0.03 * (vn(z * 6, th, seed) - 0.5)); for (const a of grains) { let d = th - a; d = Math.atan2(Math.sin(d), Math.cos(d)); r *= 1 - 0.012 * Math.exp(-((d / 0.09) ** 2)); } return r * (1 + 0.025 * Math.cos(2 * th + seed)); };
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NT; j++) {
    const th = (j / NT) * TAU, z = zAt(i, j % NT); let r = rad(z, th);
    if (za === LV.tip && i === 0) r *= 0.82; if (zb === LV.butt && i === NZ) r *= 0.9;   // rounded tip and butt
    pos.push(Math.cos(th) * r, Math.sin(th) * r + Math.sin(Math.PI * (z - LV.tip) / (LV.butt - LV.tip)) * 0.004, z); uv.push((z - LV.tip) / 1.22, j / NT);
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + NT + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // caps: a fan to a centre point; the break cap is pale split wood
  const cap = (i, dz, centreZ) => {
    const cp = [], ci = [];
    for (let j = 0; j < NT; j++) { const k = (i * (NT + 1) + j) * 3; cp.push(pos[k], pos[k + 1], pos[k + 2]); }
    const mx = cp.reduce((s, v, q) => s + (q % 3 === 1 ? v : 0), 0) / NT; cp.push(0, mx, centreZ);
    for (let j = 0; j < NT; j++) { const a = j, b = (j + 1) % NT, c = NT; if (dz > 0) ci.push(a, b, c); else ci.push(b, a, c); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); cg.computeVertexNormals(); return cg;
  };
  const endCap = breakAt === "b" ? cap(NZ, 1, zb - 0.012) : breakAt === "a" ? cap(0, -1, za + 0.012) : null;
  const sideCap = breakAt === "b" ? cap(0, -1, za - 0.004) : breakAt === "a" ? cap(NZ, 1, zb + 0.004) : null;
  return { g, endCap, sideCap, ring: (i, j) => [pos[(i * (NT + 1) + j) * 3], pos[(i * (NT + 1) + j) * 3 + 1], pos[(i * (NT + 1) + j) * 3 + 2]] };
}
function buildLever(P) {
  const S = P.spec, G = P.whole, seed = S.seed ?? 1, snapAt = S.snapAt ?? 39.32;
  if (S.fulcrum ?? true) {
    const fx = cv(0.23, 0.23, 520); paintRock(fx, { k: 60 + seed, blobs: 8, stains: 3, cuts: 14, chips: 3, cracks: 1 });
    mesh(new RoundedBoxGeometry(0.23, 0.14, 0.23, 2, 0.012), mat("#ffffff", { map: tex(fx.c), roughness: 0.95 }), G, 0, 0.07, 0);
  }
  const wood = mat("#ffffff", { map: leverTexture(seed), roughness: 0.82 }), pale = mat("#D2A97B", { roughness: 0.9, side: THREE.DoubleSide });
  const mk = (za, zb, br) => {
    const h = leverHalf(za, zb, br, seed), holder = new THREE.Group(), inner = new THREE.Group(); G.add(holder); holder.add(inner);
    const zc = (za + zb) / 2; inner.position.set(0, 0, -zc);
    mesh(h.g, wood, inner, 0, 0, 0); if (h.endCap) mesh(h.endCap, pale, inner, 0, 0, 0); if (h.sideCap) mesh(h.sideCap, pale, inner, 0, 0, 0);
    const fib = [];   // seven splinters .021-.092 on the break face
    if (br) for (let i = 0; i < 7; i++) {
      const L = 0.021 + 0.071 * H(i, seed, br === "b" ? 3 : 4), j = Math.floor(H(i, seed, 5) * LV.nth), ii = br === "b" ? LV.nz : 0, p = h.ring(ii, j), dir = br === "b" ? 1 : -1;
      const cg = new THREE.ConeGeometry(0.0034, L, 4); cg.translate(0, L / 2, 0); cg.rotateX(dir * Math.PI / 2 * -1); cg.rotateX((H(i, seed, 6) - 0.5) * 0.4);
      const f = mesh(cg, pale, inner, p[0] * 0.8, p[1] * 0.8, p[2]); f.visible = false; f.castShadow = false; f.userData.len = L; fib.push(f);
    }
    return { holder, inner, zc, fib };
  };
  const tipH = mk(LV.tip, LV_BREAK, "b"), hndH = mk(LV_BREAK, LV.butt, "a");
  const axisY = leverR(0) + 0.0, end = { tip: { x: -0.07, y: 0.0245, z: -0.12, yaw: 43 * DEG, flip: 1 }, hnd: { x: 0.1, y: 0.03, z: 0.19, yaw: -63 * DEG, flip: -1 } };
  const place = (h, e, th, u) => {
    const piv = new THREE.Vector3(0, 0.14, 0), c = new THREE.Vector3(0, axisY, h.zc).applyAxisAngle(new THREE.Vector3(1, 0, 0), th).add(piv);
    const ease = 1 - (1 - u) ** 3, fallK = u * u, bounce = 0.04 * Math.sin(Math.PI * clamp((u - 0.5) / 0.4)) * (1 - u * 0.5);
    const y = lerp(c.y, e.y, fallK) + (u > 0.5 && u < 0.9 ? bounce : 0);
    h.holder.position.set(lerp(c.x, e.x, ease), Math.max(e.y, y), lerp(c.z, e.z + h.zc, ease));
    h.holder.rotation.set(th * (1 - ease) + e.flip * 0.45 * Math.sin(Math.PI * u), e.yaw * ease, e.flip * 0.2 * Math.sin(Math.PI * u), "YXZ");
  };
  return {
    grip: 0,
    apply(ps, t = 0) {
      const pry = clamp(num(ps, S, "pry")), th = lerp(-11, 9, pry) * DEG, snap = num(ps, S, "snap") >= 0.5, u = snap ? clamp((t - snapAt) / LV.snapT) : 0;
      place(tipH, end.tip, th, u); place(hndH, end.hnd, th, u);
      for (const h of [tipH, hndH]) for (const f of h.fib) { f.visible = snap; f.scale.setScalar(Math.max(0.001, snap ? smooth((t - snapAt) / 0.08 + 0.2) : 0)); }
    },
  };
}

// ===========================================================================================================================
// dustcloud: a soft drifting cloud of lobes and grains, size 1 = the jam dust of panel 15, size 0.3 = the cough puff of panel 23
let PUFF = null;
function puffTextures() {
  if (PUFF) return PUFF;
  PUFF = [0, 1, 2].map((v) => {
    const c = document.createElement("canvas"); c.width = c.height = 192; const g = c.getContext("2d"), lumps = [[0.5, 0.52, 0.27]];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + H(i, v, 1) * 0.5, d = 0.2 + 0.07 * H(i, v, 2); lumps.push([0.5 + Math.cos(a) * d, 0.52 + Math.sin(a) * d * 0.9, 0.15 + 0.07 * H(i, v, 3)]); }
    for (const [x, y, r] of lumps) {   // shadow side first (low right), then the body, then a pale top-left
      for (const [ox, oy, col, al, kr] of [[0.02, 0.025, C.dustSh, 0.85, 1.0], [0, 0, C.dust, 1, 0.92], [-0.035, -0.04, sh(C.dust, 1.14), 0.55, 0.6]]) {
        const gr = g.createRadialGradient((x + ox) * 192, (y + oy) * 192, 0, (x + ox) * 192, (y + oy) * 192, r * kr * 192);
        gr.addColorStop(0, rgba(col, al)); gr.addColorStop(0.65, rgba(col, al * 0.8)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc((x + ox) * 192, (y + oy) * 192, r * kr * 192, 0, TAU); g.fill();
      }
    }
    for (let i = 0; i < 9; i++) { const a = 0.3 + 2.4 * H(i, v, 5), d = 0.28 + 0.12 * H(i, v, 6); g.strokeStyle = rgba(C.dustSh, 0.4); g.lineWidth = 1.6; g.beginPath(); g.arc(0.5 * 192 + 4, 0.52 * 192 + 4, d * 192, a, a + 0.5); g.stroke(); }   // hand-drawn lower contour
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 15);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.6, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  PUFF.grain = new THREE.CanvasTexture(c); PUFF.grain.colorSpace = THREE.SRGBColorSpace; return PUFF;
}
function buildDust(P) {
  const S = P.spec, G = P.whole, size = S.size ?? 1, big = size >= 0.6, T = puffTextures();
  const nL = big ? 11 : 7, nG = big ? 37 : 21, spread = S.spread ?? (big ? 0.44 : 0.1), rise = S.rise ?? (big ? 0.48 : 0.09), drift = S.drift ?? (big ? [0, 0, 0] : [0.32, 0, 0]), peak = big ? 0.34 : 0.31, floorY = S.floorY ?? (big ? -0.21 : -0.5);
  const sp = (map, order) => { const m = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }); m.userData.noOutline = true; const s = steamy(new THREE.Sprite(m), order); G.add(s); s.visible = false; return s; };
  const lobes = Array.from({ length: nL }, (_, i) => ({ s: sp(T[i % 3], 8), a: (i / nL) * TAU + (H(i, 1) - 0.5) * 0.9, el: 0.15 + 0.85 * H(i, 2), d: 0.22 * H(i, 3), k: 0.8 + 0.4 * H(i, 4), w: 0.45 + 0.55 * H(i, 5) }));
  const grainCol = [C.dust, C.dustSh];
  const grains = Array.from({ length: nG }, (_, i) => { const s = sp(T.grain, 9); s.material.color.setRGB(...grainCol[i % 2].map((v) => v / 255)); return { s, a: H(i, 6) * TAU, el: H(i, 7), r: 0.4 + 0.9 * H(i, 8), dia: lerp(0.003, big ? 0.02 : 0.01, H(i, 9) ** 1.5), d: 0.2 * H(i, 10) }; });
  const chips = !big ? [] : Array.from({ length: 6 }, (_, i) => {
    const sz = 0.025 + 0.037 * H(i, 11), g = new THREE.IcosahedronGeometry(sz / 2, 0), p = g.attributes.position; for (let q = 0; q < p.count; q++) p.setXYZ(q, p.getX(q) * (0.7 + 0.5 * H(q, i, 3)), p.getY(q) * (0.7 + 0.5 * H(q, i, 4)), p.getZ(q) * (0.7 + 0.5 * H(q, i, 5))); g.computeVertexNormals();
    const m = mesh(g, mat(["#A68A6C", "#CAB093", "#84654C"][i % 3], { roughness: 0.95, flatShading: true }), G, 0, 0, 0, false, false); m.visible = false;
    return { m, vx: (H(i, 12) - 0.5) * 1.3, vy: 0.9 + 0.9 * H(i, 13), vz: (H(i, 14) - 0.5) * 1.3, sz };
  });
  const LIFE = 1.57;
  return {
    grip: 0,
    apply(ps) {
      const age = clamp(num(ps, S, "age")), env = smooth(age / 0.12) * (1 - smooth((age - 0.12) / 0.88));
      const live = age > 0.001;
      lobes.forEach((l) => {
        l.s.visible = live; if (!live) return;
        const a = clamp((age - l.d * 0.5) / (1 - l.d * 0.5)), e = 1 - (1 - a) ** 2.2, dia = lerp(0.16, 0.51, e) * size * l.k;
        const r = spread * e * l.w, up = rise * e * (0.5 + 0.5 * l.el) * (0.6 + 0.4 * l.k);
        l.s.position.set(Math.cos(l.a) * r + drift[0] * age, 0.04 * size + up + drift[1] * age, Math.sin(l.a) * r + drift[2] * age); l.s.scale.set(dia, dia, 1); l.s.material.rotation = l.a; l.s.material.opacity = peak * env * (0.65 + 0.35 * l.w);
      });
      grains.forEach((q) => {
        q.s.visible = live; if (!live) return;
        const a = clamp((age - q.d * 0.5) / (1 - q.d * 0.5)), e = 1 - (1 - a) ** 2, r = spread * 1.3 * q.r * e;
        const y = Math.max(floorY, (0.04 * size + rise * 0.9 * q.el * e) - (big ? 0.5 : 0.16) * a * a);
        q.s.position.set(Math.cos(q.a) * r + drift[0] * age * (big ? 0 : 1.1), y + drift[1] * age, Math.sin(q.a) * r + drift[2] * age); q.s.scale.set(q.dia, q.dia, 1);
        q.s.material.opacity = 0.55 * (age < 0.82 ? 1 : 1 - smooth((age - 0.82) / 0.18)) * smooth(age / 0.04);
      });
      chips.forEach((c, i) => {
        c.m.visible = live; if (!live) return;
        const fl = floorY + c.sz / 2, tl = (c.vy + Math.sqrt(c.vy * c.vy - 19.6 * fl)) / 9.8, tau = Math.min(age * LIFE, tl * (0.85 + 0.15 * H(i, 15))), y = c.vy * tau - 4.9 * tau * tau, land = Math.max(fl, y);
        const stop = age * LIFE >= tl * 0.85;
        c.m.position.set(c.vx * tau * 0.6, stop ? floorY + c.sz / 2 : land, c.vz * tau * 0.6); c.m.rotation.set(stop ? 0.4 * i : tau * 5 * (1 + i * 0.3), tau * 3 * (stop ? 0.2 : 1) + i, stop ? 0.2 * i : tau * 4);
      });
    },
  };
}

// ===========================================================================================================================
// egypthaul: the forty haulers of panel 11 (a far-figure kit, copied in spirit from props-sh-far.js haulteam: instanced golden potatoes)
const colored = (g, c) => {
  g = g.index ? g.toNonIndexed() : g; g.deleteAttribute("uv");
  const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3), flat = typeof c !== "function", cc = flat ? (Array.isArray(c) ? c : rgb(c)) : null;
  for (let i = 0; i < p.count; i++) { const q = flat ? cc : c(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
};
const merged = (list) => mergeGeometries(list.map((g) => { if (g.attributes.uv) g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; }));
const charm = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.9, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "char"; return m; };
const HW = { rx: 0.31, ry: 0.4, rz: 0.28, cy: 0.44 };
let HUNITS = null;
function haulUnits() {
  if (HUNITS) return HUNITS;
  const { rx, ry, rz, cy } = HW, GOLD = rgb("#E0A655"), GSH = rgb("#B47A3C"), LIN = rgb("#EDE1C9"), LSH = rgb("#B5A086");
  const egg = new THREE.SphereGeometry(1, 18, 14), ep = egg.attributes.position;
  for (let i = 0; i < ep.count; i++) { const k = 1 + 0.05 * (H(Math.round(ep.getX(i) * 40), Math.round(ep.getY(i) * 40), Math.round(ep.getZ(i) * 40)) - 0.5); ep.setXYZ(i, ep.getX(i) * k * rx, ep.getY(i) * k * ry + cy, ep.getZ(i) * k * rz); }
  egg.computeVertexNormals();
  const body = colored(egg, (x, y) => { const k = 0.93 + 0.14 * clamp((y - 0.1) / 0.7); return [1 * k, 1 * k, 1 * k]; });
  // the short linen kilt: a flared skirt with pleats, a belt, a wrapped front panel
  const kg = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true), kp = kg.attributes.position;
  for (let i = 0; i < kp.count; i++) {
    const a = Math.atan2(kp.getX(i), kp.getZ(i)), t = kp.getY(i) + 0.5, r = lerp(0.84, 1.0, t) * (1 + 0.012 * (1 - t) * Math.cos(a * 12));
    kp.setXYZ(i, Math.sin(a) * rx * 1.03 * r, 0.12 + t * 0.25 - (t < 0.1 ? 0.012 * H(i, 3) : 0), Math.cos(a) * rz * 1.04 * r);
  }
  kg.computeVertexNormals();
  const kilt = colored(kg, (x, y, z) => { const a = Math.atan2(x, z), p = Math.cos(a * 12), k = 0.96 + 0.06 * (y - 0.1) / 0.27; const c = p < -0.3 ? LSH : LIN; return [c[0] * k, c[1] * k, c[2] * k]; });
  const belt = new THREE.TorusGeometry(1, 0.028, 6, 24); belt.rotateX(Math.PI / 2); belt.scale(rx * 0.86, 1, rz * 0.86); belt.translate(0, 0.375, 0);
  const flap = new THREE.BoxGeometry(0.17, 0.25, 0.022); flap.rotateX(-0.12); flap.translate(0.03, 0.25, rz * 0.9 + 0.02);
  // the white headcloth: a cap round the crown, open at the face, two lappets behind the neck
  const cap = new THREE.SphereGeometry(1, 18, 8, Math.PI / 2 + 0.6, TAU - 1.2, 0, 0.82), cpz = cap.attributes.position;
  for (let i = 0; i < cpz.count; i++) cpz.setXYZ(i, cpz.getX(i) * rx * 1.07, cpz.getY(i) * ry * 1.06 + cy, cpz.getZ(i) * rz * 1.09);
  cap.computeVertexNormals();
  const cloth = colored(cap, (x, y, z) => { const a = Math.atan2(x, z), c = Math.cos(a * 6 + y * 5) < -0.93 ? LSH : LIN, k = 0.97 + 0.05 * Math.sin(y * 22); return [c[0] * k, c[1] * k, c[2] * k]; });
  const nape = new THREE.SphereGeometry(1, 14, 5, Math.PI / 2 + 0.55 + Math.PI - 1.2, 2.4, 0.8, 0.3), np = nape.attributes.position;
  for (let i = 0; i < np.count; i++) np.setXYZ(i, np.getX(i) * rx * 1.08, np.getY(i) * ry * 1.07 + cy, np.getZ(i) * rz * 1.1);
  nape.computeVertexNormals(); const lap = [colored(nape, LSH)];
  // face: dot eyes, strain brows, an open mouth; legs and bare feet are separate
  const faceP = [];
  for (const x of [-0.11, 0.11]) { const e = new THREE.SphereGeometry(0.034, 7, 5); e.translate(x, cy + 0.12, rz * 0.9); faceP.push(colored(e, "#2b1d14")); const b = new THREE.BoxGeometry(0.075, 0.014, 0.014); b.rotateZ(x > 0 ? 0.35 : -0.35); b.translate(x, cy + 0.19, rz * 0.9 + 0.01); faceP.push(colored(b, "#8a5a2a")); }
  { const m = new THREE.SphereGeometry(1, 8, 5); m.scale(0.05, 0.026, 0.03); m.translate(0, cy - 0.045, rz * 0.97); faceP.push(colored(m, "#6a2e22")); }
  const legP = []; for (const s of [-1, 1]) { const l = new THREE.CylinderGeometry(0.036, 0.032, 0.12, 6); l.translate(s * 0.13, 0.08, 0.02); legP.push(colored(l, GSH)); }
  const det = merged([kilt, colored(belt, "#AA906E"), colored(flap, (x, y, z, nx, ny, nz) => (Math.abs(nz) > 0.5 ? [LIN[0] * 0.97, LIN[1] * 0.97, LIN[2] * 0.97] : LSH)), cloth, ...lap, ...faceP, ...legP]);
  const foot = (() => { const g = new THREE.SphereGeometry(1, 8, 6); g.scale(0.058, 0.034, 0.1); g.translate(0, 0.034, 0.04); return colored(g, GSH); })();
  const arm = (() => { const c = new THREE.CylinderGeometry(0.034, 0.03, 1, 5); c.translate(0, 0.5, 0); return colored(c, GOLD); })();
  const hand = colored(new THREE.SphereGeometry(0.055, 8, 6), GOLD);
  return (HUNITS = { body, det, foot, arm, hand });
}
function armMat(a, b, th = 1) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 0.001, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), q, new THREE.Vector3(th, L, th));
}
function buildHaulCrowd(P) {
  const S = P.spec, G = P.whole, U = haulUnits(), crowd = new THREE.Group(); G.add(crowd);
  const per = S.n ?? 20, step = S.spacing ?? 0.55, first = S.first ?? 1.98, travel = S.travel ?? 1.83, lean0 = (S.lean ?? 23) * DEG, h = S.h ?? 0.82, sc = h / 0.84;
  const F = []; for (const f of [-1, 1]) for (let i = 0; i < per; i++) F.push({ f, z: -(first + step * i) - (S.stagger ?? 0) * (f > 0 ? step / 2 : 0), x: f * 0.57, s: sc * (0.97 + 0.06 * H(i, f, 1)), ph: H(i, f, 2) * TAU, tone: 0.93 + 0.14 * H(i, f, 3), lean: lean0 + 0.04 * (H(i, f, 4) - 0.5) });
  const N = F.length, mk = (geo, m, count) => { const im = new THREE.InstancedMesh(geo, m, count); im.frustumCulled = false; lookOnly(im); crowd.add(im); return im; };
  const bodyIM = mk(U.body, charm({ vertexColors: true }), N), detIM = mk(U.det, charm({ vertexColors: true, side: THREE.DoubleSide }), N), footIM = mk(U.foot, charm({ vertexColors: true }), N * 2), armIM = mk(U.arm, charm({ vertexColors: true }), N * 2), handIM = mk(U.hand, charm({ vertexColors: true }), N * 2);
  const Cc = new THREE.Color(); F.forEach((q, i) => { bodyIM.setColorAt(i, Cc.set("#E0A655").multiplyScalar(q.tone)); detIM.setColorAt(i, Cc.set("#ffffff")); for (let s = 0; s < 2; s++) { footIM.setColorAt(i * 2 + s, Cc.set("#ffffff")); armIM.setColorAt(i * 2 + s, Cc.set("#ffffff")); handIM.setColorAt(i * 2 + s, Cc.set("#ffffff")); } });
  for (const m of [bodyIM, detIM, footIM, armIM, handIM]) m.instanceColor.needsUpdate = true;
  const V = new THREE.Vector3(), Qt = new THREE.Quaternion(), Sv = new THREE.Vector3(), E = new THREE.Euler(0, 0, 0, "YXZ"), M = new THREE.Matrix4();
  const frame = (t) => {
    F.forEach((q, i) => {
      const phi = t * 1.15 * TAU + q.ph, heave = Math.sin(2 * phi), bob = 0.022 * (0.5 + 0.5 * heave), lean = q.lean + 0.04 * heave, roll = 0.05 * Math.sin(phi), dz = 0.035 * Math.cos(2 * phi + 0.8), s = q.s;
      E.set(0, 0, 0); E.set(lean, Math.PI, roll, "YXZ"); Qt.setFromEuler(E);   // faces -z (the kit faces +z, turned 180 deg), top tipped toward -z
      V.set(q.x, bob, q.z + dz); const Mb = new THREE.Matrix4().compose(V, Qt, Sv.set(s, s, s));
      bodyIM.setMatrixAt(i, Mb); detIM.setMatrixAt(i, Mb);
      const zh = q.z - 0.32;   // the hands: on the rope a little ahead of the body, one behind the other
      for (let k = 0; k < 2; k++) {
        const sg = k ? 1 : -1, fp = phi + (k ? 0 : Math.PI), swing = 0.14 * s * Math.sin(fp), lift = 0.05 * Math.max(0, Math.cos(fp));
        E.set(0, Math.PI, 0); Qt.setFromEuler(E); footIM.setMatrixAt(i * 2 + k, new THREE.Matrix4().compose(V.set(q.x + sg * 0.13 * s, lift, q.z - swing), Qt, Sv.set(s, s, s)));
        const sh2 = new THREE.Vector3(sg * 0.29, 0.5, 0.03).applyMatrix4(Mb), zk = zh + (k ? -0.12 : 0.05), r = ropeAt(S, q.f, -(zk) - 0.15 + 0.0), hp = [r[0], r[1] + 0.02, zk];
        armIM.setMatrixAt(i * 2 + k, armMat(sh2.toArray(), hp, s)); handIM.setMatrixAt(i * 2 + k, new THREE.Matrix4().compose(V.set(hp[0], hp[1], hp[2]), Qt.identity(), Sv.set(s, s, s)));
      }
    });
    for (const m of [bodyIM, detIM, footIM, armIM, handIM]) m.instanceMatrix.needsUpdate = true;
  };
  frame(0);
  return { grip: 0, apply(ps, t = 0) { crowd.position.z = -clamp(num(ps, S, "along")) * travel; frame(t); } };
}

export const EG_SAQQARA_KINDS = { saqqara: buildSaqqara, saqqaramouth: buildSaqqara, djoser: buildDjoser, sledge: buildSledge, waterjar: buildJar, wetsand: buildWet, pounder: buildPounder, lever: buildLever, dustcloud: buildDust, egypthaul: buildHaulCrowd };
// grips: the jar by its two handles (on +-z, at the tilt axis, so a hand there stays put while `pour` tips the jar), the pounder in the fist,
// the lever's two hands 0.21 apart on the handle half (lever frame: origin on the fulcrum's ground point, the rod along z, tip toward -z)
export const EG_SAQQARA_GRIPS = {
  waterjar: { handleL: [0, 0.3, 0.121], handleR: [0, 0.3, -0.121], hold: [0, 0.19, 0] },
  pounder: { hold: [0, 0.105, 0] },
  lever: { handA: [0, 0.2, 0.62], handB: [0, 0.2, 0.83] },
};
