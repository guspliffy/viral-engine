// Ancient aliens shared kit (13 Nov 2026), ship: the aliens' machines and the Aswan quarry. DESIGN: storyboards/series/ancient-aliens/kit/BOARD.md.
// Metres; origin bottom centre and front +z unless said; every animated value is a param 0..1 unless said. A param that propState
// has no default for is undefined until its first set: seed it with a dur-0 set at 0 (the prop also reads spec.<name> as its
// start value). Bench: storyboards/series/ancient-aliens/kit/bench (make-aa-ship.mjs, aa-ship-sheet.png).
// Look: hand-drawn Ghibli, every seam, scuff, speckle and rivet is its own mark from a hash of its index (no tiling texture,
// no Math.random). Colours: BOARD section 1. The beams are see-through (userData.steam) and soft: the shader works out how
// much light a sight line crosses in the column, so the rim fades to nothing, the core is brighter, and a look straight up
// the column stays a soft glow (no hard cone edge, no bands). Pale dust motes drift through them on the clip clock.
//
//   ringship    the lift ship, an OPEN RING (never a saucer with a dome) lying flat, 30 m across: outer r 15, hole r 8.4, tube 6.6 wide
//               x 3.6 high (a flattened torus with a flatter underside). Origin the ring's centre at MID HEIGHT (top y +1.8, underside
//               y -1.8). Three pods (6.5 long, r 2.6) on the rim at 0, 120 and 240 deg (angle from +x toward +z), the pod's middle at
//               r 14.2 and y +1.7 (half above the ring's top edge, long axis along the rim), white with ONE orange band each (0.7).
//               From the ground it reads WHITE: the hull is matte off-white ceramic #ece8df (the underside drawn a little brighter so the
//               look's shading keeps it white) in hand drawn panels (seams #b9b4a8, hatches, rivet dots, scuffs); ONE burnt-orange stripe
//               #d9682a 0.8 wide on the lower outer quarter of the tube's underside (radial 1.9..2.7 from the tube's middle); only the
//               INNER 35 % of the underside, the band next to the hole, is graphite #3a3d42, with a circle of 18 round lenses #9fded6
//               (r 0.5, ring r 9.9) in it. No windows, no dome, no legs.
//               spec.s (1) uniform scale (the block threads use 0.2 for wide shots; the beam and everything else scale with it).
//               beam 0..1 (seed) a straight soft column of pale turquoise light #8fe6dc, r spec.beamR (3.5), from the hole's centre at the ring's mid height
//               straight down spec.beamLen (40) m (its top 3 m fade in inside the hole, its last 1.5 m thin a little), rendered as a
//               saturated turquoise (core #66e6d6 to #94faeb, so it reads turquoise on blue sky and on sand), brighter in the core,
//               soft at the edge, see-through; spec.motes (70) pale dust motes drift up (0.2-0.6 m/s) and sideways inside it; a soft pool of
//               light r 3 lies on whatever is below, 6 cm over the foot (it goes with beam). The beam hangs straight down from the
//               hole's centre and does NOT bob or sway with the ship. The carried block is NOT part of the ship: the clip hangs a
//               `limeblock` in the beam. Beam coordinates for a clip: x/z = the ship's, y = ship y - spec.beamLen at the foot.
//               lit 0..1 (propState default 0, which means spec.lit, default 0.4) the lenses' glow (0.4 = #9fded6, 1 = nearly white;
//               to switch them off pass 0.001). wobble 0..1 (propState default 0) a slow hover bob (0.25 m, 0.9 rad/s) and sway
//               (1 deg) of the hull, on the clip clock. SOLID: the ring, the pods (top y +1.8; the pods' tops +1.9; no standable
//               top is intended). Not solid: the beam, its motes, the pool.
//   cargoship   the small carrier: a half ring, a U from above, 12 wide (x) x 7 deep (z), tube 2.2 wide x 1.5 high, same ceramic,
//               a 0.4 stripe round the outer equator and a graphite underside. The U is open toward -z (its curve on +z, which is
//               the side a camera in front sees), one rounded pod (3.2 long, r 1.2, one orange band) at the end of each arm, at
//               x +-4.9, z -3.5..-0.3. Origin its middle at mid height (top +0.75, underside -0.75). spec.s (1) uniform scale.
//               beam 0..1 (seed): two thin columns (r 0.25, len spec.beamLen 3.0, a few motes each) down from two lenses under the
//               curve, 7.0 apart along x (x +-3.5, z 1.59, from y -0.75); they move with the hull. lit, wobble as the ringship.
//               The beam hung under it: a granitespan with its middle at x 0, its TOP 3 m under the ship's underside (y ship -0.75
//               -3 -2.2). SOLID.
//   granitespan one King's Chamber ceiling beam of Aswan red granite, 8.0 long (x) x 1.5 wide (z) x 2.2 high, origin the middle of
//               its bottom. #a8554d with hand-placed speckles (#7d3b38, #d08f84), the four long faces flat and smooth-cut #b8635a,
//               the two ends rough (pitted, up to 7 cm). SOLID and standable: top y 2.2 (1.5 wide strip). NOTE: (named granitespan, not "beam": the engine treats /beam/ kind names as effects).
//   roughgranite a raw quarry block 5.0 (x) x 1.7 (y) x 1.7 (z), origin bottom centre, rough bulging faces with chips, #a8554d, fine granite grain (1-3 cm marks, dense).
//               cut 0..1 (propState default 0; spec.cut is NOT read: seed it with a dur-0 set at 0) a dead-straight vertical cut at
//               x = spec.cutX (0.8): the cut opens from the TOP downward as a wedge (the part beyond it tips off 3.4 deg about the
//               cut's foot, gap at the top 0..6 cm over cut 0..0.6), then from 0.6 to 1 the whole part beyond shifts 6 cm away
//               (+x) and drops 2 cm; at cut 1 the perfectly flat smooth face #b8635a (cap) stands bare. SOLID; top y 1.7.
//   granitecutter a tripod gantry over a roughgranite: three splayed off-white ceramic legs with wide round pad feet (footprint
//               triangle r 2.6: feet at (-2.25,-1.3), (2.25,-1.3) and (0,2.6), the two back legs held out by arms so all three
//               clear a 5 m block lying along x under the rail), joined by a straight horizontal graphite rail 3.2 long (x) at
//               y 3.0 (legs meet it at 2.9). A boxy burnt-orange head 0.5 x 0.45 x 0.4 (centre y 3.0) rides the rail: slide 0..1
//               (default 0.5 = spec.slide, propState has none) puts it at x = -1.4 + 2.8 slide.
//               cut 0..1 (propState default 0): 0 is off; above 0.05 ONE hair-thin vertical line of turquoise light falls from the
//               head's nozzle (y 2.7) straight down to y 3.0 - spec.drop (1.3) = 1.7, the top of a roughgranite 1.7 high, where a dull
//               orange hot spot #e07a3a (6 cm) glows and a small plume of grey stone dust drifts toward +x (clip clock). Put the
//               stone with its origin at x = (head x - cutX), z 0 (slide 1: stone x 0.6 spans -1.9..3.1 and clears the pedestal).
//               Beside it at spec.pedestal [-2.4, 0, 0.9] a waist-high pedestal for a 0.6-1.05 m alien: plinth 0.06, column 0.45
//               high, a large graphite control slab 0.5 x 0.35 x 0.05 tilted 30 deg toward the operator (+z), with a pale palm
//               plate on it; AA_SHIP_PARTS.slab = its centre [-2.4, 0.57, 0.9] in the cutter's local frame (the palm aims there;
//               with another spec.pedestal add the difference). SOLID: legs, pads, rail, head, pedestal.
//   aswanquarry the red granite quarry, a terraced hillside backdrop 70 wide (x +-35), up to 26 high, 18 deep (z -18..0), origin the middle
//               of its foot, facing +z. Built from big natural masses (rounded bluffs and boulder shoulders 4-10 m across, tops weathered
//               #7d3b38, flanks #a8554d, eight deep cracks on the back bluff) with three working terraces CUT into them: flat treads and
//               walls that are one flat straight-cut plane per segment (13-17 m long, 3.6-6.2 m high, stepping at the notches between
//               segments, a row of dark wedge slots along the top of most), walls at 3.6, 7.8 and 11.6 m back; a natural bluff above the
//               last tread; ~26 loose angular blocks and ~100 chips at the foot; speckles sparse. The colours are tuned slightly dark so the
//               look's daylight lifts them to #a8554d. The sand floor is a disc r 40 centred (0, 0, 8) at y 0, pale warm sand #d9c49a hand
//               dotted with grit, red chips, cart tracks: an UNLIT material (MeshBasic, painted colour), so it reads the same in any
//               light; it assumes bright daylight and takes no cast shadow (the look's contact shadows still land on it). All meshes of
//               the quarry are marked userData.steam: the look draws a dark ground oval under a prop's whole footprint, which for a 70 m
//               prop would blacken the sand (the first bench did). Consequence: the checks see the quarry as see-through scenery.
//               No spec keys. SOLID in looks, scenery in the checks.
// No grips (AA_SHIP_GRIPS = {}). Every kind skips lights: none has a light.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const sp = (q, n) => Math.sign(q) * Math.abs(q) ** (2 / n);   // superellipse power
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, repeat = true) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;

export const AA_SHIP_PARTS = { slab: [-2.4, 0.57, 0.9] };   // the cutter's control slab centre, the cutter's local frame

// ---- value noise (a hash of the lattice corners), 3D
const h3 = (x, y, z, s) => rnd(x * 12.9898 + y * 78.233 + z * 37.719 + s * 11.13);
function vn(x, y, z, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi);
  const c = (a, b, d) => h3(xi + a, yi + b, zi + d, s);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy), lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
}

// ---- grids (u along the first count, v along the second)
function gridGeo(nu, nv) {
  const geo = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = i * (nv + 1) + j; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  return geo;
}
function fill(geo, nu, nv, f) {
  const pos = geo.attributes.position.array;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = (i * (nv + 1) + j) * 3, p = f(i / nu, j / nv); pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2]; }
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
}
function flipGrid(geo) { const ix = geo.index.array; for (let a = 0; a < ix.length; a += 3) { const t = ix[a + 1]; ix[a + 1] = ix[a + 2]; ix[a + 2] = t; } geo.index.needsUpdate = true; geo.computeVertexNormals(); }
// the first and last column (u) and row (v) of a wrapped grid are one seam: average their normals so no line shows
function weldGrid(geo, nu, nv, wrapU, wrapV) {
  const n = geo.attributes.normal.array, avg = (a, b) => { for (let k = 0; k < 3; k++) { const v = (n[a * 3 + k] + n[b * 3 + k]) / 2; n[a * 3 + k] = n[b * 3 + k] = v; } };
  if (wrapV) for (let i = 0; i <= nu; i++) avg(i * (nv + 1), i * (nv + 1) + nv);
  if (wrapU) for (let j = 0; j <= nv; j++) avg(j, nu * (nv + 1) + j);
  geo.attributes.normal.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------------------------
// hull profiles: a closed cross-section (half width A radial, half height B), a rounder top (n 2.6) over a flatter underside
// (n 5.5), tabulated by arc length so the texture's v is true metres. phi0 -pi/2 starts v at the middle of the underside.
function profTable(A, B, nTop, nBot) {
  const prof = (phi) => { const c = Math.cos(phi), s = Math.sin(phi), n = s >= 0 ? nTop : nBot; return [A * sp(c, n), B * sp(s, n)]; };
  const N = 2400, phi0 = -Math.PI / 2, xy = [], cum = [0];
  for (let i = 0; i <= N; i++) { xy.push(prof(phi0 + (i / N) * TAU)); if (i) cum.push(cum[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1])); }
  const L = cum[N];
  return {
    L, A, B, nBot,
    at(v) {
      const s = clamp(v) * L; let lo = 0, hi = N;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
      const k = (s - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]); return [lerp(xy[lo][0], xy[hi][0], k), lerp(xy[lo][1], xy[hi][1], k)];
    },
    // the underside height at a radial offset x (|x| < the flat part)
    under(x) { const c = Math.abs(x / A) ** (nBot / 2); return -B * Math.sqrt(Math.max(0, 1 - c * c)) ** (2 / nBot); },
  };
}
// a sweep of a profile along a path: pathAt(i / nu) -> { x, z, nx, nz } (n the outward horizontal normal)
function sweepGeo(nu, nv, pathAt, tab, wrapU) {
  const geo = gridGeo(nu, nv);
  fill(geo, nu, nv, (u, v) => { const P = pathAt(u), q = tab.at(v); return [P.x + P.nx * q[0], q[1], P.z + P.nz * q[0]]; });
  { // faces outward? compare one normal with the way out of the tube's middle
    const i = Math.floor(nu * 0.3), j = Math.floor(nv * 0.3), k = (i * (nv + 1) + j) * 3, P = pathAt(i / nu), pa = geo.attributes.position.array, na = geo.attributes.normal.array;
    if ((pa[k] - P.x) * na[k] + pa[k + 1] * na[k + 1] + (pa[k + 2] - P.z) * na[k + 2] < 0) flipGrid(geo);
  }
  weldGrid(geo, nu, nv, wrapU, true);
  return geo;
}

// ---------------------------------------------------------------------------------------------------------------
// the ceramic painter. Draws in metres (u across `uLen`, v across `vLen`) so every mark has its true size: panels with their
// own seams (staggered per band), rivet dots along the seams, hatches, scuffs, stains. row(v01) -> "c" ceramic | "g" graphite |
// "s" orange stripe. o: nU panels across, seamV [fractions of v] long seams, hatches, scuffs, stains.
const CER = { c: "#ece8df", g: "#3a3d42", s: "#d9682a", w: "#fbf9f4" }, SEAM = { c: "#b9b4a8", g: "#585c63", s: "#b4531d", w: "#c9c4b6" };   // w: ceramic painted a little brighter where the look shades it (an underside)
function paintCeramic(W, H, uLen, vLen, seed, o) {
  const [cv, g] = canvas(W, H), r = (k) => rnd(seed * 1000 + k), kind = (v) => o.row(clamp(v / vLen));
  for (let j = 0; j < H; j++) { g.fillStyle = CER[o.row((j + 0.5) / H)]; g.fillRect(0, j, W, 1); }
  // a thin ink line where the colour changes
  for (let j = 1; j < H; j++) if (o.row((j + 0.5) / H) !== o.row((j - 0.5) / H)) { g.fillStyle = "rgba(34,36,40,0.55)"; g.fillRect(0, j - 1, W, 2); }
  g.save(); g.scale(W / uLen, H / vLen);
  const R = (x, y, w, h, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const E = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const cut = [...(o.seamV || []).map((f) => f * vLen)];   // long seams: the asked ones and every place the colour changes
  for (let j = 1; j < H; j++) if (o.row((j + 0.5) / H) !== o.row((j - 0.5) / H)) cut.push((j / H) * vLen);
  const sv = [0, ...cut.sort((p, q) => p - q), vLen], pw = uLen / o.nU;
  for (let b = 0; b < sv.length - 1; b++) {
    const v0 = sv[b], v1 = sv[b + 1], vm = (v0 + v1) / 2, k = kind(vm), hb = v1 - v0;
    for (let i = 0; i < o.nU; i++) {   // each panel its own tone, seam place and width
      const ua = (i + 0.2 * (r(b * 131 + i) - 0.5)) * pw, ub = (i + 1 + 0.2 * (r(b * 131 + i + 1) - 0.5)) * pw;
      R(ua, v0, ub - ua, hb, r(b * 7 + i * 3) < 0.5 ? "#ffffff" : "#c9b98f", 0.02 + 0.05 * r(b * 17 + i));
      const sw = 0.022 + 0.022 * r(b * 59 + i * 11);
      R(ua - sw / 2, v0, sw, hb, SEAM[k], 0.5 + 0.3 * r(b * 61 + i));
      if (k !== "s") for (let y = v0 + 0.12 + 0.1 * r(b * 71 + i); y < v1 - 0.06; y += 0.34 + 0.12 * r(b * 73 + i + y * 9)) {   // rivet dots both sides of the seam
        if (r(b * 83 + i * 19 + y * 31) < 0.12) continue;
        for (const dx of [-0.07, 0.07]) E(ua + dx, y, 0.017, 0.017, k === "g" ? "#7c8088" : "#9d988a", 0.9);
      }
    }
    R(0, v0 - 0.012, uLen, 0.024, SEAM[k], 0.85);   // the long seam at this band's edge
  }
  for (let i = 0; i < (o.hatches || 0); i++) {   // hatch plates: an outlined rectangle, four rivets, a recessed handle slot
    const u = r(500 + i) * uLen, v = lerp(0.1, 0.9, r(520 + i)) * vLen, hw = 0.28 + 0.2 * r(540 + i), hh = 0.17 + 0.1 * r(560 + i);
    if (kind(v) !== "c") continue;
    R(u - hw, v - hh, 2 * hw, 0.02, "#a39e90"); R(u - hw, v + hh, 2 * hw, 0.02, "#a39e90"); R(u - hw, v - hh, 0.02, 2 * hh, "#a39e90"); R(u + hw - 0.02, v - hh, 0.02, 2 * hh, "#a39e90");
    R(u - hw, v - hh, 2 * hw, 2 * hh, "#8a846f", 0.06);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) E(u + dx * (hw - 0.06), v + dy * (hh - 0.05), 0.016, 0.016, "#8f8a7c", 0.9);
    R(u - 0.09, v - 0.015, 0.18, 0.03, "#6f6a5c", 0.7);
  }
  for (let i = 0; i < (o.stains || 14); i++) E(r(600 + i) * uLen, r(620 + i) * vLen, 0.2 + 0.7 * r(640 + i), 0.08 + 0.3 * r(660 + i), kind(r(620 + i) * vLen) === "g" ? "#1c1d20" : "#8a7f66", 0.05 + 0.05 * r(680 + i));
  for (let i = 0; i < (o.scuffs ?? 220); i++) {   // scuffs: short pale or dark strokes
    const u = r(1000 + i * 3) * uLen, v = r(1001 + i * 3) * vLen, len = 0.08 + 0.4 * r(1002 + i * 3) ** 2, w = 0.008 + 0.02 * r(1003 + i * 3), a = (r(1004 + i * 3) - 0.5) * 0.5, dark = r(1005 + i * 3) < 0.45;
    g.save(); g.translate(u, v); g.rotate(a); g.globalAlpha = dark ? 0.22 + 0.2 * r(1006 + i) : 0.4 + 0.3 * r(1006 + i); g.fillStyle = dark ? "#6f6a5c" : "#fffaf0"; g.fillRect(0, 0, len, w); g.restore();
  }
  g.restore(); g.globalAlpha = 1;
  return cv;
}
const ceramicTex = (W, H, uLen, vLen, seed, o) => tex(paintCeramic(W, H, uLen, vLen, seed, o));

// the speckled red granite: base colour, soft mottle, speckles dark (#7d3b38) and pale (#d08f84), a few thin veins. u x v in metres.
function paintGranite(W, H, uLen, vLen, seed, o) {
  const [cv, g] = canvas(W, H), r = (k) => rnd(seed * 1000 + k);
  g.fillStyle = o.base; g.fillRect(0, 0, W, H);
  g.save(); g.scale(W / uLen, H / vLen);
  const E = (x, y, rx, ry, col, a, rot = 0) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  for (let i = 0; i < 40; i++) E(r(i) * uLen, r(i + 50) * vLen, 0.3 + 0.9 * r(i + 100), 0.2 + 0.5 * r(i + 150), r(i + 200) < 0.5 ? "#7d3b38" : "#d08f84", (0.03 + 0.03 * r(i + 250)) * (o.mot ?? 1), r(i + 300) * 3);
  const n = o.speck;
  for (let i = 0; i < n; i++) {
    const c = r(1000 + i * 5), dark = c < 0.5, s = (dark ? 0.007 : 0.005) * (0.5 + 1.8 * r(1001 + i * 5) ** 2) * o.size;
    E(r(1002 + i * 5) * uLen, r(1003 + i * 5) * vLen, s, s * (0.6 + 0.6 * r(1004 + i * 5)), dark ? "#7d3b38" : "#d08f84", 0.45 + 0.5 * r(1004 + i * 5), r(1004 + i * 5) * 6);
  }
  g.strokeStyle = "#d9a89a"; g.lineWidth = 0.012;
  for (let i = 0; i < (o.veins ?? 4); i++) { g.globalAlpha = 0.22; g.beginPath(); let x = r(3000 + i) * uLen, y = r(3010 + i) * vLen; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (0.2 + 0.4 * r(3100 + i * 9 + k)) * uLen * 0.1; y += (r(3200 + i * 9 + k) - 0.5) * 0.12; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < (o.saw || 0); i++) { const y = r(4000 + i) * vLen; g.globalAlpha = 0.07 + 0.05 * r(4100 + i); g.fillStyle = "#5c2825"; g.fillRect(0, y, uLen, 0.004 + 0.004 * r(4200 + i)); }   // faint saw lines
  g.restore(); g.globalAlpha = 1;
  return cv;
}

// ---------------------------------------------------------------------------------------------------------------
// a capsule (hemisphere caps, a straight middle), axis y, resampled by arc length so the texture's v is true metres
function podGeo(r, straight, nu = 36) {
  const L = Math.PI * r + straight, N = 70, q = (Math.PI / 2) * r, pts = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * L; let y, rr;
    if (s < q) { const a = s / r; rr = r * Math.sin(a); y = -straight / 2 - r * Math.cos(a); }
    else if (s <= q + straight) { rr = r; y = -straight / 2 + (s - q); }
    else { const a = (s - q - straight) / r; rr = r * Math.cos(a); y = straight / 2 + r * Math.sin(a); }
    pts.push(new THREE.Vector2(Math.max(rr, 1e-4), y));
  }
  return { geo: new THREE.LatheGeometry(pts, nu), L };
}
function podMaterial(r, straight, bandW, seed) {
  const L = Math.PI * r + straight, band = bandW / 2 / L;
  const map = ceramicTex(1024, 512, TAU * r, L, seed, { nU: 5, seamV: [0.27, 0.73], row: (v) => (Math.abs(v - 0.5) < band ? "s" : "c"), hatches: 1, scuffs: 40, stains: 6 });
  return mat("#ffffff", { map, roughness: 0.6 });
}

// ---------------------------------------------------------------------------------------------------------------
// the light: a soft column, drawn only by the light a sight line crosses (see the file header), plus drifting motes
function beamMaterial(density, top, bot, len) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uD: { value: -Math.log(1 - density) }, uTop: { value: top }, uBot: { value: bot }, uL: { value: len }, uC0: { value: new THREE.Color(0.30, 0.86, 0.80) }, uC1: { value: new THREE.Color(0.58, 0.98, 0.92) } },
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    vertexShader: "varying vec3 vW; varying vec3 vC; varying float vY; void main() { vY = position.y; vW = (modelMatrix * vec4(position, 1.0)).xyz; vC = (modelMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }",
    fragmentShader: "uniform float uA, uD, uTop, uBot, uL; uniform vec3 uC0, uC1; varying vec3 vW; varying vec3 vC; varying float vY;\n" +
      "void main() { vec3 D = normalize(vW - cameraPosition); vec2 ph = vW.xz - vC.xz, Dh = D.xz; float R = max(length(ph), 1e-4), dh2 = dot(Dh, Dh);\n" +
      "float chord = dh2 < 1e-5 ? 10.0 * R : min(-2.0 * dot(ph, Dh) / dh2, 10.0 * R); if (chord <= 0.0) discard;\n" +
      "float a = 1.0 - exp(-uD * chord / (2.0 * R)); float e = clamp(chord * sqrt(dh2) / (2.0 * R), 0.0, 1.0);\n" +
      "float d = -vY; a *= uA * smoothstep(0.0, uTop, d) * (1.0 - 0.5 * smoothstep(uL - uBot, uL, d)); if (a < 0.002) discard;\n" +
      "gl_FragColor = vec4(mix(uC0, uC1, e * e * e * 0.8), a); }",
  });
  m.userData.noOutline = true; return m;
}
let MOTE_TEX = null;
function moteTex() {
  if (MOTE_TEX) return MOTE_TEX;
  const [c, x] = canvas(64, 64), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,250,232,1)"); gr.addColorStop(0.3, "rgba(255,250,232,0.9)"); gr.addColorStop(0.6, "rgba(255,250,232,0.3)"); gr.addColorStop(1, "rgba(255,250,232,0)");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (MOTE_TEX = t);
}
let POOL_TEX = null;
function poolTex() {
  if (POOL_TEX) return POOL_TEX;
  const [c, x] = canvas(256, 256), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (let i = 0; i <= 12; i++) { const k = i / 12; gr.addColorStop(k, `rgba(190,255,245,${(0.62 * (1 - smooth(k)) ** 1.4).toFixed(3)})`); }
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (POOL_TEX = t);
}
// a column from the group's origin straight down `len`; { beam: { r, len, motes, density, top, seed, pool } }. update(amount, t)
function makeBeam(parent, o) {
  const g = new THREE.Group(); parent.add(g);
  const geo = new THREE.CylinderGeometry(o.r, o.r, o.len, 40, 1, true); geo.translate(0, -o.len / 2, 0);
  const bm = beamMaterial(o.density ?? 0.55, o.top ?? 3, o.bot ?? 1.5, o.len), col = steamy(new THREE.Mesh(geo, bm), 5); g.add(col);
  const motes = [];
  for (let i = 0; i < o.motes; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex(), transparent: true, depthWrite: false, opacity: 0, toneMapped: false, color: "#fff6dc" })); m.material.userData.noOutline = true;
    steamy(m, 6); g.add(m); const r = (k) => rnd(o.seed * 101 + i * 13 + k);
    motes.push({ m, rr: o.r * 0.88 * Math.sqrt(r(1)), a0: r(2) * TAU, y0: r(3) * o.len, v: (0.2 + 0.4 * r(4)) * (o.r / 2) ** 0.5, sz: (0.1 + 0.16 * r(5)) * (o.r / 2), ph: r(6) * TAU, w: 0.25 + 0.4 * r(7), dr: 0.15 + 0.3 * r(8), bright: 0.55 + 0.45 * r(9) });
  }
  let pool = null;
  if (o.pool) {
    const pm = new THREE.MeshBasicMaterial({ map: poolTex(), transparent: true, depthWrite: false, toneMapped: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); pm.userData.noOutline = true;
    pool = steamy(new THREE.Mesh(new THREE.PlaneGeometry(o.pool * 2, o.pool * 2), pm), 4); pool.rotation.x = -Math.PI / 2; pool.position.y = -o.len + 0.06; g.add(pool);
  }
  return {
    g,
    update(amount, t) {
      const a = smooth(amount); g.visible = a > 0.004; if (!g.visible) return;
      bm.uniforms.uA.value = a; if (pool) pool.material.opacity = 0.9 * a;
      for (const k of motes) {
        const d = (((k.y0 - k.v * t) % o.len) + o.len) % o.len, y = -d, edge = smooth(Math.min(d, o.len - d) / Math.max(1, o.len * 0.06));   // d down from the top; falls to 0 at both ends
        const ang = k.a0 + k.dr * t * 0.4, sx = 0.12 * o.r * Math.sin(t * k.w + k.ph);
        k.m.position.set(Math.cos(ang) * k.rr + sx, y, Math.sin(ang) * k.rr + 0.5 * sx); k.m.scale.setScalar(k.sz);
        k.m.material.opacity = a * edge * k.bright * smooth(d / Math.max(0.5, o.top)) * 0.9;
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// the lenses: round, flat, a graphite bezel; one colour for all of them (lit)
const lensMat = () => { const m = new THREE.MeshBasicMaterial({ color: "#9fded6", toneMapped: false, transparent: true, opacity: 1 }); m.userData.noOutline = true; return m; };
const LENS_DIM = new THREE.Color("#2e4846"), LENS_MID = new THREE.Color("#9fded6"), LENS_HI = new THREE.Color("#e2fff9");
function lensColor(c, lit) { if (lit <= 0.4) c.copy(LENS_DIM).lerp(LENS_MID, clamp(lit / 0.4)); else c.copy(LENS_MID).lerp(LENS_HI, clamp((lit - 0.4) / 0.6)); return c; }
function lens(parent, lm, bezelM, r, x, y, z) {
  mesh(new THREE.CylinderGeometry(r * 1.28, r * 1.34, r * 0.3, 24), bezelM, parent, x, y - r * 0.05, z);   // bottom at y - 0.2 r
  const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, r * 0.12, 24), lm); l.position.set(x, y - r * 0.2, z); l.castShadow = false; parent.add(l);   // proud of the bezel by 0.04 r
}

// ---------------------------------------------------------------------------------------------------------------
const RING = { r0: 11.7, A: 3.3, B: 1.8, R: 15, hole: 8.4 };
const CARGO = { A: 1.1, B: 0.75, arm: 4.9, z0: -0.3, zA: 2.7, zEnd: -2.0 };
// the U's centreline, resampled by arc length: arms along z, a half ellipse on +z; n the outward horizontal normal
function cargoPath(nu) {
  const raw = [];
  for (let k = 0; k <= 20; k++) raw.push([CARGO.arm, lerp(CARGO.zEnd, CARGO.z0, k / 20)]);
  for (let k = 1; k <= 120; k++) { const t = (k / 120) * Math.PI; raw.push([CARGO.arm * Math.cos(t), CARGO.z0 + CARGO.zA * Math.sin(t)]); }
  for (let k = 1; k <= 20; k++) raw.push([-CARGO.arm, lerp(CARGO.z0, CARGO.zEnd, k / 20)]);
  const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const L = cum[cum.length - 1], pts = [];
  for (let i = 0; i <= nu; i++) {
    const s = (i / nu) * L; let lo = 0, hi = raw.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const k = (s - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]); pts.push([lerp(raw[lo][0], raw[hi][0], k), lerp(raw[lo][1], raw[hi][1], k)]);
  }
  return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(nu, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return { x: p[0], z: p[1], nx: tz / l, nz: -tx / l }; }).concat([L]);
}

// the hull's own state: bob and sway on the clip clock
function hover(g, ps, S, t) {
  const w = clamp(num(ps, S, "wobble")), tt = t ?? 0;
  g.position.y = 0.25 * w * Math.sin(tt * 0.9); g.rotation.set(rad(1) * w * Math.sin(tt * 0.7 + 1), 0, rad(1) * w * Math.sin(tt * 0.9 + 2));
}
const litOf = (ps, S) => ((ps.lit ?? 0) > 0 ? ps.lit : S.lit ?? 0.4);

// the shared hull parts
function hullMaterial(tab, uLen, seed, nU, W, H, o) {
  const row = o.row ? (v) => { const [x, y] = tab.at(v); return o.row(x, y); } : (v) => { const [x, y] = tab.at(v); return Math.abs(y) < o.stripe / 2 && x > 0 ? "s" : y < o.graphY ? "g" : "c"; };
  return mat("#ffffff", { map: ceramicTex(W, H, uLen, tab.L, seed, { nU: o.nU ?? nU, seamV: o.seamV, row, hatches: o.hatches, scuffs: o.scuffs, stains: o.stains }), roughness: 0.6 });
}

export const AA_SHIP_GRIPS = {};

export const AA_SHIP_KINDS = {
  // -------------------------------------------------------------------------------------------------------------
  ringship(P) {
    const S = P.spec, sc = new THREE.Group(); sc.scale.setScalar(S.s ?? 1); P.whole.add(sc);
    const hv = new THREE.Group(); sc.add(hv);
    const tab = profTable(RING.A, RING.B, 2.6, 5.5);
    const hullM = hullMaterial(tab, TAU * RING.r0, 11, 40, 4096, 1024, { row: (x, y) => (y < -1.4 && x > 1.9 && x < 2.7 ? "s" : x < -1.0 && y < -1.2 ? "g" : y < -0.3 ? "w" : "c"), seamV: [0.2, 0.5, 0.8], hatches: 14, scuffs: 70, stains: 14, nU: 30 });
    mesh(sweepGeo(240, 72, (u) => ({ x: RING.r0 * Math.cos(u * TAU), z: RING.r0 * Math.sin(u * TAU), nx: Math.cos(u * TAU), nz: Math.sin(u * TAU) }), tab, true), hullM, hv);
    // pods: three, on the rim, long axis along the rim, one orange band each
    const pod = podGeo(2.6, 1.3, 40), podM = podMaterial(2.6, 1.3, 0.7, 21);
    for (let k = 0; k < 3; k++) {
      const a = (k * TAU) / 3, g = new THREE.Group(); g.position.set(14.2 * Math.cos(a), 1.7, 14.2 * Math.sin(a)); g.rotation.y = -a; hv.add(g);
      const m = mesh(pod.geo, podM, g); m.rotation.x = Math.PI / 2;
    }
    // 18 lenses round the hole on the underside, in graphite bezels
    const lm = lensMat(), bz = mat("#26282c", { roughness: 0.7 }), yb = tab.under(9.9 - RING.r0);
    for (let k = 0; k < 18; k++) { const a = ((k + 0.5) * TAU) / 18; lens(hv, lm, bz, 0.5, 9.9 * Math.cos(a), yb, 9.9 * Math.sin(a)); }
    const beam = makeBeam(sc, { r: S.beamR ?? 3.5, len: S.beamLen ?? 40, motes: S.motes ?? 70, seed: 5, density: 0.6, top: 3, bot: 1.5, pool: 3 });
    return { grip: 0, apply(ps, t) { hover(hv, ps, S, t); lensColor(lm.color, litOf(ps, S)); beam.update(num(ps, S, "beam"), t ?? 0); } };
  },

  // -------------------------------------------------------------------------------------------------------------
  cargoship(P) {
    const S = P.spec, sc = new THREE.Group(); sc.scale.setScalar(S.s ?? 1); P.whole.add(sc);
    const hv = new THREE.Group(); sc.add(hv);
    const tab = profTable(CARGO.A, CARGO.B, 2.4, 5), NU = 160, path = cargoPath(NU), ulen = path[path.length - 1];
    const hullM = hullMaterial(tab, ulen, 33, 14, 2048, 512, { stripe: 0.4, graphY: -0.32, seamV: [0.13, 0.3, 0.4, 0.6, 0.7, 0.87], hatches: 5, scuffs: 130, stains: 10 });
    mesh(sweepGeo(NU, 40, (u) => path[Math.round(u * NU)], tab, false), hullM, hv);
    const pod = podGeo(1.2, 0.8, 28), podM = podMaterial(1.2, 0.8, 0.35, 41);
    for (const s of [-1, 1]) { const m = mesh(pod.geo, podM, hv, s * CARGO.arm, 0, -1.9); m.rotation.x = Math.PI / 2; }
    const lm = lensMat(), bz = mat("#26282c", { roughness: 0.7 }), zb = CARGO.z0 + CARGO.zA * Math.sqrt(1 - (3.5 / CARGO.arm) ** 2);
    const beams = [-1, 1].map((s, i) => { lens(hv, lm, bz, 0.3, s * 3.5, -CARGO.B + 0.01, zb); const b = makeBeam(hv, { r: 0.25, len: S.beamLen ?? 3.0, motes: 6, seed: 9 + i, density: 0.6, top: 0.4, bot: 0.5 }); b.g.position.set(s * 3.5, -CARGO.B + 0.02, zb); return b; });
    return { grip: 0, apply(ps, t) { hover(hv, ps, S, t); lensColor(lm.color, litOf(ps, S)); for (const b of beams) b.update(num(ps, S, "beam"), t ?? 0); } };
  },

  // -------------------------------------------------------------------------------------------------------------
  granitespan(P) {
    const L = 8.0, W = 1.5, Hh = 2.2, g = new THREE.BoxGeometry(L, Hh, W, 32, 22, 15);
    const pa = g.attributes.position, endAmp = (x) => smooth((Math.abs(x) - (L / 2 - 0.26)) / 0.26);
    g.translate(0, Hh / 2, 0);
    for (let i = 0; i < pa.count; i++) {   // the two ends rough: only x moves, so the long faces stay flat
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), w = endAmp(x); if (w <= 0) continue;
      const d = 0.07 * (vn(y * 2.6, z * 2.6, Math.sign(x) * 3, 1) - 0.5) * 2 + 0.03 * (vn(y * 9, z * 9, Math.sign(x), 2) - 0.5) * 2, edge = smooth(Math.min(W / 2 - Math.abs(z), 0.25) / 0.25) * smooth(Math.min(y, Hh - y, 0.25) / 0.25);
      pa.setX(i, x + Math.sign(x) * d * w * (0.35 + 0.65 * edge));
    }
    g.computeVertexNormals();
    const smoothM = mat("#ffffff", { map: tex(paintGranite(2048, 512, 8, 2.2, 3, { base: "#b8635a", speck: 9000, size: 0.8, saw: 5, veins: 3, mot: 0.4 })), roughness: 0.85 });
    const roughM = mat("#ffffff", { map: tex(paintGranite(512, 512, 1.5, 2.2, 4, { base: "#a8554d", speck: 3500, size: 1.1, veins: 5, mot: 0.5 })), roughness: 1 });
    const m = mesh(g, [roughM, roughM, smoothM, smoothM, smoothM, smoothM], P.whole);   // +x, -x, +y, -y, +z, -z
    void m;
    return { grip: Hh };
  },

  // -------------------------------------------------------------------------------------------------------------
  roughgranite(P) {
    const S = P.spec, CX = S.cutX ?? 0.8, W = 2.5, H = 0.85, D = 0.85, n = 6.5, NP = 72, NV = 30;
    const roughM = mat("#ffffff", { map: tex(paintGranite(1024, 512, 5, 3.6, 7, { base: "#a8554d", speck: 12000, size: 0.85, veins: 3, mot: 0.3 })), roughness: 1 });
    const capM = mat("#ffffff", { map: tex(paintGranite(512, 512, 1.9, 1.9, 8, { base: "#b8635a", speck: 4000, size: 0.8, saw: 3, veins: 0, mot: 0.3 })), roughness: 0.55 });
    const chips = Array.from({ length: 14 }, (_, i) => ({ c: [(rnd(i * 5 + 1) - 0.5) * 4.6, 0.1 + 1.5 * rnd(i * 5 + 2), (rnd(i * 5 + 3) - 0.5) * 1.6], r: 0.15 + 0.3 * rnd(i * 5 + 4), d: 0.03 + 0.06 * rnd(i * 5 + 5) }));
    const cosC = Math.sign(CX) * Math.abs(CX / W) ** (n / 2), thC = Math.acos(clamp(cosC, -1, 1));   // the latitude where the body's x = CX
    // one piece: latitude th0..th1 (0 is the +x pole), the noise faded out toward the plane so the rim lies exactly on it
    function piece(th0, th1, side) {
      const geo = gridGeo(NP, NV);
      fill(geo, NP, NV, (u, v) => { const th = lerp(th0, th1, v), ph = u * TAU, c = Math.cos(th), s = Math.sin(th); return [W * sp(c, n), H * sp(s * Math.cos(ph), n) + H, D * sp(s * Math.sin(ph), n)]; });
      { const k = (Math.floor(NP * 0.25) * (NV + 1) + Math.floor(NV / 2)) * 3, p = geo.attributes.position.array, nr = geo.attributes.normal.array; if (p[k] * nr[k] + (p[k + 1] - H) * nr[k + 1] + p[k + 2] * nr[k + 2] < 0) flipGrid(geo); }
      const pa = geo.attributes.position.array, na = geo.attributes.normal.array;
      for (let k = 0; k < (NP + 1) * (NV + 1); k++) {
        const x = pa[k * 3], y = pa[k * 3 + 1], z = pa[k * 3 + 2], fade = smooth(Math.abs(x - CX) / 0.3);
        let d = 0.09 * (vn(x * 0.9, y * 0.9, z * 0.9, 3) - 0.4) + 0.045 * (vn(x * 3, y * 3, z * 3, 4) - 0.5) + 0.016 * (vn(x * 11, y * 11, z * 11, 5) - 0.5);
        for (const ch of chips) { const dd = Math.hypot(x - ch.c[0], y - ch.c[1], z - ch.c[2]) / ch.r; if (dd < 1) d -= ch.d * (1 - dd * dd) ** 2; }
        d *= fade; pa[k * 3] = x + na[k * 3] * d; pa[k * 3 + 1] = Math.max(0, y + na[k * 3 + 1] * d); pa[k * 3 + 2] = z + na[k * 3 + 2] * d;
      }
      const uvs = geo.attributes.uv.array;   // a sheared planar projection in metres: speckles keep their size on every face
      for (let k = 0; k < (NP + 1) * (NV + 1); k++) { const x = pa[k * 3], y = pa[k * 3 + 1], z = pa[k * 3 + 2]; uvs[k * 2] = (x + 0.45 * z) / 5 + 0.5; uvs[k * 2 + 1] = (y + 0.8 * z + 0.3 * x) / 3.6; }
      geo.attributes.uv.needsUpdate = true;
      const rim = side > 0 ? NV : 0; let cy = 0, cz = 0;
      for (let i = 0; i < NP; i++) { const k = (i * (NV + 1) + rim) * 3; pa[k] = CX; cy += pa[k + 1]; cz += pa[k + 2]; }
      cy /= NP; cz /= NP;
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); weldGrid(geo, NP, NV, true, false);
      const n2 = geo.attributes.normal.array, pole = side > 0 ? 0 : NV;   // the far pole row points along x
      for (let i = 0; i <= NP; i++) { const k = (i * (NV + 1) + pole) * 3; n2[k] = side > 0 ? 1 : -1; n2[k + 1] = n2[k + 2] = 0; }
      geo.computeBoundingBox(); geo.computeBoundingSphere();
      // the flat cap: a fan from the rim's middle (its own smooth material and flat normal)
      const cp = [CX, cy, cz], cu = [0.5, 0.5], ci = [];
      for (let i = 0; i <= NP; i++) { const k = (i * (NV + 1) + rim) * 3; cp.push(CX, pa[k + 1], pa[k + 2]); cu.push(0.5 + (pa[k + 2] - cz) / 1.9, 0.5 + (pa[k + 1] - cy) / 1.9); }
      for (let i = 0; i < NP; i++) ci.push(0, i + 1, i + 2);
      const want = side > 0 ? -1 : 1, nxv = (cp[4] - cp[1]) * (cp[8] - cp[2]) - (cp[5] - cp[2]) * (cp[7] - cp[1]);   // x of the first triangle's normal
      if (nxv * want < 0) for (let q = 0; q < ci.length; q += 3) { const t = ci[q + 1]; ci[q + 1] = ci[q + 2]; ci[q + 2] = t; }
      const cap = new THREE.BufferGeometry(); cap.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cap.setAttribute("uv", new THREE.Float32BufferAttribute(cu, 2));
      cap.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: cp.length / 3 }, () => [want, 0, 0]).flat(), 3)); cap.setIndex(ci); cap.computeBoundingBox(); cap.computeBoundingSphere();
      return { geo, cap };
    }
    const gA = new THREE.Group(), gB = new THREE.Group(); gB.position.x = CX; P.whole.add(gA, gB);
    for (const [g, th0, th1, side] of [[gA, thC, Math.PI, -1], [gB, 0, thC, 1]]) { const { geo, cap } = piece(th0, th1, side); mesh(geo, roughM, g, -g.position.x, 0, 0); mesh(cap, capM, g, -g.position.x, 0, 0); }
    return {
      grip: 1.7,
      apply(ps) {
        const c = clamp(ps.cut ?? 0), top = 0.06 * smooth(c / 0.6), rig = smooth((c - 0.6) / 0.4), sep = 0.06 * rig, drop = 0.02 * rig;
        gB.position.set(CX + sep, -drop, 0); gB.rotation.z = -Math.atan2(top - sep + 0.0, 1.7);   // the wedge: the top gap `top`, the foot gap `sep`
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  granitecutter(P) {
    const S = P.spec, PED = S.pedestal ?? [-2.4, 0, 0.9], DROP = S.drop ?? 1.3, NOZ = 2.7, HEADY = 3.0, HOT = HEADY - DROP, LEN = NOZ - HOT;
    const cer = mat("#ffffff", { map: ceramicTex(512, 512, 1.2, 1.2, 51, { nU: 3, seamV: [0.5], row: () => "c", hatches: 0, scuffs: 40, stains: 4 }), roughness: 0.6 });
    const graph = mat("#ffffff", { map: ceramicTex(1024, 64, 3.2, 0.3, 52, { nU: 8, row: () => "g", scuffs: 24, stains: 3 }), roughness: 0.5, metalness: 0.2 });
    const orange = mat("#ffffff", { map: ceramicTex(256, 256, 0.5, 0.45, 53, { nU: 2, seamV: [0.35, 0.7], row: () => "s", scuffs: 20, stains: 2 }), roughness: 0.5 });
    const dark = mat("#26282c", { roughness: 0.7 });
    const rod = (a, b, r0, r1, m) => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), len = d.length(), o = mesh(new THREE.CylinderGeometry(r0, r1, len, 14), m, P.whole);
      o.position.copy(va).add(vb).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return o;
    };
    const legs = [[-2.25, -1.3, -1.6, -0.95], [2.25, -1.3, 1.6, -0.95], [0, 2.6, 0, 0.95]];
    for (const [fx, fz, tx, tz] of legs) {
      rod([tx, 2.9, tz], [fx, 0.1, fz], 0.11, 0.075, cer);
      mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 14), cer, P.whole, tx, 2.82, tz);                    // collar at the top
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 14), dark, P.whole, tx, 2.68, tz);
      const lx = lerp(tx, fx, 0.55), lz = lerp(tz, fz, 0.55); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), dark, P.whole, lx, lerp(2.9, 0.1, 0.55), lz).quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(fx - tx, -2.8, fz - tz).normalize());
      mesh(new THREE.SphereGeometry(0.13, 14, 10), cer, P.whole, fx, 0.14, fz);                              // the ball joint on its pad
      mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.08, 28), cer, P.whole, fx, 0.04, fz);                     // the wide round pad foot
      mesh(new THREE.CylinderGeometry(0.43, 0.45, 0.03, 28), dark, P.whole, fx, 0.015, fz);
    }
    // the arms that hold the back legs out from the rail's ends, and the front leg from its middle
    for (const sx of [-1.6, 1.6]) mesh(new THREE.BoxGeometry(0.2, 0.2, 0.98), cer, P.whole, sx, 2.9, -0.47);
    mesh(new THREE.BoxGeometry(0.22, 0.2, 0.98), cer, P.whole, 0, 2.9, 0.47);
    for (const sx of [-1.6, 1.6]) mesh(new THREE.BoxGeometry(0.28, 0.26, 0.26), cer, P.whole, sx, 3.0, 0);
    mesh(new THREE.BoxGeometry(3.2, 0.13, 0.13), graph, P.whole, 0, 3.0, 0);                                  // the rail
    mesh(new THREE.BoxGeometry(3.2, 0.03, 0.15), dark, P.whole, 0, 3.075, 0);
    // the cutting head on the rail, with its nozzle
    const head = new THREE.Group(); P.whole.add(head); head.position.set(0, HEADY, 0);
    mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), orange, head);
    mesh(new THREE.BoxGeometry(0.54, 0.05, 0.44), dark, head, 0, -0.2, 0); mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), dark, head, 0, 0.235, 0);
    mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 12), dark, head, 0, -0.275, 0);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10), basic("#c9fff6", { opacity: 1 }), head, 0, -0.33, 0).castShadow = false;
    // the line, the hot spot, the dust
    const lineM = basic("#5fe8d6", { opacity: 0.98 }), haloM = basic("#3fd8c4", { opacity: 0.5 });
    const line = steamy(new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, LEN, 6), lineM), 6), halo = steamy(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, LEN, 8), haloM), 5);
    line.position.y = halo.position.y = (NOZ + HOT) / 2; P.whole.add(line, halo);
    const hot = steamy(new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), basic("#e07a3a", { opacity: 0.95 })), 6), hotR = steamy(new THREE.Mesh(new THREE.RingGeometry(0.03, 0.07, 18), basic("#e07a3a", { opacity: 0.3 })), 5);
    for (const h of [hot, hotR]) { h.rotation.x = -Math.PI / 2; h.position.y = HOT + 0.006; P.whole.add(h); }
    const dust = Array.from({ length: 12 }, (_, i) => {
      const m = new THREE.SpriteMaterial({ map: moteTex(), color: "#a8a29a", transparent: true, depthWrite: false, opacity: 0 }); m.userData.noOutline = true;
      const s = steamy(new THREE.Sprite(m), 4); P.whole.add(s); return { s, ph: i / 12 + 0.02 * rnd(i), dz: (rnd(i + 40) - 0.5) * 0.12, vx: 0.7 + 0.5 * rnd(i + 50), up: 0.3 + 0.35 * rnd(i + 60), sz: 0.28 + 0.2 * rnd(i + 70) };
    });
    // the pedestal: plinth, column, a tilted graphite slab with a pale palm plate
    const ped = new THREE.Group(); ped.position.set(PED[0], PED[1], PED[2]); P.whole.add(ped);
    mesh(new THREE.BoxGeometry(0.52, 0.06, 0.42), dark, ped, 0, 0.03, 0); mesh(new THREE.BoxGeometry(0.4, 0.39, 0.3), cer, ped, 0, 0.255, 0);
    const slab = new THREE.Group(); slab.position.y = 0.57; slab.rotation.x = rad(30); ped.add(slab);
    mesh(new THREE.BoxGeometry(0.5, 0.05, 0.35), graph, slab);
    const [pc, pg] = canvas(256, 180); pg.fillStyle = "#3a3d42"; pg.fillRect(0, 0, 256, 180);
    pg.fillStyle = "#2c2e32"; pg.beginPath(); pg.roundRect(46, 20, 164, 140, 26); pg.fill(); pg.strokeStyle = "#9fded6"; pg.globalAlpha = 0.7; pg.lineWidth = 4; pg.beginPath(); pg.roundRect(46, 20, 164, 140, 26); pg.stroke();
    pg.globalAlpha = 0.55; pg.lineWidth = 3; for (let f = 0; f < 4; f++) { pg.beginPath(); pg.roundRect(70 + f * 31, 38, 22, 52, 10); pg.stroke(); } pg.beginPath(); pg.roundRect(66, 98, 120, 44, 20); pg.stroke();
    for (let i = 0; i < 5; i++) { pg.globalAlpha = 0.9; pg.fillStyle = i === 1 ? "#9fded6" : "#6f747c"; pg.beginPath(); pg.arc(20 + i * 6, 90, 2.4, 0, TAU); pg.fill(); }
    const plate = mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ map: tex(pc), roughness: 0.5 }), slab, 0, 0.0262, 0); plate.rotation.x = -Math.PI / 2; plate.castShadow = false;
    return {
      grip: 3.0,
      apply(ps, t) {
        const sl = clamp(ps.slide ?? S.slide ?? 0.5), cut = clamp(((ps.cut ?? 0) - 0.0) / 0.05), tt = t ?? 0, hx = -1.4 + 2.8 * sl;
        head.position.x = hx; for (const o of [line, halo, hot, hotR]) o.position.x = hx;
        line.visible = halo.visible = hot.visible = hotR.visible = cut > 0.001; lineM.opacity = 0.95 * cut; haloM.opacity = 0.5 * cut;
        hot.material.opacity = 0.95 * cut * (0.88 + 0.12 * Math.sin(tt * 23)); hotR.material.opacity = 0.3 * cut;
        for (const d of dust) {
          const a = (((tt * 0.45 + d.ph) % 1) + 1) % 1, k = smooth(a / 0.1) * (1 - a);
          d.s.visible = cut > 0.001; d.s.position.set(hx + 0.05 + a * d.vx * 1.1, HOT + 0.05 + a * d.up, d.dz * (1 + 2 * a)); d.s.scale.setScalar(d.sz * (0.3 + 1.3 * a)); d.s.material.opacity = 0.5 * cut * k;
        }
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  aswanquarry(P) { return buildQuarry(P); },
};

// ---------------------------------------------------------------------------------------------------------------
// the quarry: big natural granite masses (a smooth max of rounded bluffs and boulder shoulders 4-10 m across, a few deep cracks) with
// three working terraces CUT into them (min of the mass and a staircase: flat treads, each wall one flat straight-cut plane 5 m
// high, stepping at notches 13-17 m apart), a natural bluff above the last tread; a height field of 0.15 m cells coloured by the
// vertex (weathered dark tops, #a8554d flanks, dark cracks), the cut walls as fine 0.1 m panels (a row of wedge slots along each
// top edge), loose angular blocks and chips merged into one mesh, a pale sand disc (unlit, see the header)
const QX = 35, WALL = [{ d: 3.6, seg: 14, off: 0 }, { d: 7.8, seg: 17, off: 5.1 }, { d: 11.6, seg: 13, off: 9.3 }];
const sst = (x) => smooth(x);
const wallD = (k, x) => { const w = WALL[k], xi = Math.floor((x + 60 + w.off) / w.seg); return w.d + (rnd(xi * 7 + k * 31 + 5) - 0.5) * 2.0; };   // one plane per straight segment
const BUMPS = Array.from({ length: 16 }, (_, i) => ({ x: (rnd(i * 7 + 1) - 0.5) * 62, d: 10 + 7 * rnd(i * 7 + 2), r: 4 + 5 * rnd(i * 7 + 3), a: (rnd(i * 7 + 4) - 0.3) * 9 }));
const SIDEMASS = [[-29, 7, 7, 9], [30, 9, 8, 10], [-18, 14, 6, 6], [17, 13, 6, 5], [-33, 14, 6, 8], [34, 15, 6, 9], [-8, 17, 7, 5], [9, 17, 8, 6], [-26, 16, 6, 6], [24, 16, 6, 5]];   // x, d, radius, height
const CRACKS = Array.from({ length: 8 }, (_, i) => { const x0 = (rnd(i * 11 + 1) - 0.5) * 54, d0 = 14.6 + 1.4 * rnd(i * 11 + 2); return { x0, d0, x1: x0 + (rnd(i * 11 + 3) - 0.5) * 4, d1: d0 + 2.5 + 2 * rnd(i * 11 + 4), depth: 1.2 + 1.6 * rnd(i * 11 + 5) }; });
function crackD(x, d) {
  let c = 0;
  for (const k of CRACKS) {
    const vx = k.x1 - k.x0, vd = k.d1 - k.d0, t = clamp(((x - k.x0) * vx + (d - k.d0) * vd) / (vx * vx + vd * vd)), dist = Math.hypot(x - (k.x0 + t * vx), d - (k.d0 + t * vd)) + 0.14 * (vn(x * 2, d * 2, 3, 35) - 0.5);
    c = Math.max(c, k.depth * (1 - 0.6 * t) * Math.exp(-((dist / 0.26) ** 2)));
  }
  return c;
}
function massH(x, d) {
  let m = 22 * Math.pow(clamp(d / 16), 0.7) * (1 - 0.92 * sst((Math.abs(x) - 23) / 11)) * (0.86 + 0.14 * vn(x * 0.07, d * 0.1, 0, 31));
  for (const b of BUMPS) m += b.a * Math.exp(-((x - b.x) ** 2 + (d - b.d) ** 2) / (b.r * b.r)) * clamp(d / 8);
  for (const [sx, sd, sr, sh] of SIDEMASS) m += sh * Math.exp(-((x - sx) ** 2 + (d - sd) ** 2) / (sr * sr));
  m += 0.5 * (vn(x * 0.35, d * 0.35, 0, 32) - 0.5) + 0.12 * (vn(x * 1.7, d * 1.7, 0, 33) - 0.5);
  return Math.min(26, Math.max(0, m));
}
function stairH(x, d) {   // three 5 m steps, then a steep natural slope behind the last tread
  let h = 0; for (let k = 0; k < 3; k++) h += (3.6 + 2.6 * rnd(Math.floor((x + 60 + WALL[k].off) / WALL[k].seg) * 5 + k * 17 + 9)) * sst((d - wallD(k, x)) / 0.12 + 0.5);
  const w3 = wallD(2, x) + 3.2; if (d > w3) h += (1.0 + 0.7 * vn(x * 0.12, 0.5, 0, 37)) * (d - w3) + 3 * (vn(x * 0.2, d * 0.45, 0, 34) - 0.5) * sst((d - w3) / 2);
  return h;
}
const quarryH = (x, z) => { const d = -z, m = massH(x, d) - crackD(x, d); return Math.max(0, Math.min(m, stairH(x, d))) + 0.02; };
function buildQuarry(P) {
  const NX = 460, NZ = 120, QD = 18, geo = gridGeo(NX, NZ);
  fill(geo, NX, NZ, (u, v) => { const x = (u - 0.5) * 2 * QX, z = -v * QD; return [x, quarryH(x, z), z]; });
  if (geo.attributes.normal.array[(Math.floor(NX / 2) * (NZ + 1) + 10) * 3 + 1] < 0) flipGrid(geo);
  const pa = geo.attributes.position.array, na = geo.attributes.normal.array, col = new Float32Array(pa.length), C = (h) => new THREE.Color(h);
  const topC = C("#7d3b38"), topL = C("#8f4741"), main = C("#9a4e47"), cutC = C("#a04d46"), crackC = C("#4a2220"), dustc = C("#c9a98e"), tread = C("#9b5049"), spD = C("#7d3b38"), spL = C("#d08f84"), tmp = new THREE.Color();
  for (let k = 0; k < pa.length / 3; k++) {
    const x = pa[k * 3], y = pa[k * 3 + 1], z = pa[k * 3 + 2], d = -z, ny = na[k * 3 + 1], cr = crackD(x, d), M = massH(x, d) - cr, S = stairH(x, d), w3 = wallD(2, x) + 3.2, natural = M <= S + 0.02 || d > w3;
    if (natural) {
      tmp.copy(topC).lerp(topL, 0.8 * vn(x * 0.5, z * 0.5, 1, 14)).lerp(main, smooth((0.82 - ny) / 0.3));
      tmp.lerp(C("#6a302e"), 0.35 * smooth(vn(x * 0.9, y * 0.4, z * 0.9, 16) - 0.55));
    } else if (ny > 0.9) {
      tmp.copy(tread).lerp(main, 0.3 * vn(x * 0.4, z * 0.4, 2, 17)).lerp(dustc, 0.15 + 0.4 * smooth(vn(x * 0.6, z * 0.6, 3, 18) - 0.4));
    } else tmp.copy(cutC);
    tmp.lerp(crackC, smooth(cr / 0.5) * 0.85);
    const hv = rnd(k * 1.7 + 3); if (hv < 0.035) tmp.lerp(spD, 0.5); else if (hv > 0.992) tmp.lerp(spL, 0.25);   // sparse speckle
    col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const rockM = mat("#ffffff", { vertexColors: true, roughness: 0.95 });
  mesh(geo, rockM, P.whole).castShadow = false;   // a backdrop: it must not shade the sand in front of it
  // the cut walls: one flat plane per straight segment, 0.1 m cells; a row of wedge slots along the top edge of most of them
  for (let k = 0; k < 3; k++) {
    const w = WALL[k];
    for (let x0 = -QX; x0 < QX - 0.01;) {
      const xi = Math.floor((x0 + 60 + w.off) / w.seg), x1 = Math.min(QX, (xi + 1) * w.seg - 60 - w.off), d = wallD(k, (x0 + x1) / 2), nx = Math.max(2, Math.round((x1 - x0) / 0.1)), ny = 50, seg = k * 40 + xi;
      const g = gridGeo(nx, ny), colA = new Float32Array((nx + 1) * (ny + 1) * 3), ex = (u) => x0 + u * (x1 - x0), slots = rnd(seg + 7) < 0.8, s0 = x0 + rnd(seg + 8) * (x1 - x0) * 0.4, s1 = s0 + (0.4 + 0.5 * rnd(seg + 9)) * (x1 - x0);
      fill(g, nx, ny, (u, v) => { const x = ex(u), hf = quarryH(x, -(d - 0.12)), hb = quarryH(x, -(d + 0.12)), y = lerp(hf, hb, v); return [x, y, -(d - 0.09) + 0.012 * (vn(x * 1.2, y * 1.2, k, 21) - 0.5)]; });
      { const na2 = g.attributes.normal.array, m = ((Math.floor(nx / 2)) * (ny + 1) + Math.floor(ny / 2)) * 3; if (na2[m + 2] < 0) flipGrid(g); }
      const pp = g.attributes.position.array;
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
        const q = i * (ny + 1) + j, x = ex(i / nx), y = pp[q * 3 + 1], hv = j / ny, top = quarryH(x, -(d + 0.12)), hm = (y - quarryH(x, -(d - 0.12)));
        const c = cutC.clone().lerp(main, 0.25 + 0.3 * vn(x * 0.25, y * 0.25, k, 15)).offsetHSL(0, 0, (vn(x * 0.5, y * 0.5, seg, 36) - 0.5) * 0.04);
        c.lerp(dustc, 0.45 * Math.exp(-hm / 0.6)); if (hv > 0.9) c.lerp(topC, (hv - 0.9) / 0.1 * 0.55);
        const dx = (((x / 0.42) % 1) + 1) % 1, dTop = top - y;
        if (slots && x > s0 && x < s1 && dx < 0.3 && dTop > 0.1 && dTop < 0.62) c.lerp(crackC, 0.65);                    // wedge-slot row
        const hr = rnd(q * 1.3 + seg); if (hr < 0.03) c.lerp(spD, 0.45); else if (hr > 0.996) c.lerp(spL, 0.25);
        colA[q * 3] = c.r; colA[q * 3 + 1] = c.g; colA[q * 3 + 2] = c.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(colA, 3)); g.deleteAttribute("uv");
      mesh(g, rockM, P.whole).castShadow = false; x0 = x1;
    }
  }
  // loose angular blocks and chips at the foot, one merged mesh
  const parts = [], reds = ["#a8554d", "#9a4d46", "#8d4a44", "#b05d54", "#7d3b38", "#a05048"], q = new THREE.Quaternion(), e = new THREE.Euler(), mtx = new THREE.Matrix4();
  const addBox = (w, h, d, x, y, z, ry, tx, tz, color, seed) => {
    const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const px = Math.round(p.getX(i) * 1000) / 1000, py = Math.round(p.getY(i) * 1000) / 1000, pz = Math.round(p.getZ(i) * 1000) / 1000, s = 0.1 * Math.min(w, h, d); p.setXYZ(i, px + s * (h3(px, py, pz, seed) - 0.5) * 2, py + s * (h3(px, py, pz, seed + 1) - 0.5) * 2, pz + s * (h3(px, py, pz, seed + 2) - 0.5) * 2); }
    e.set(tx, ry, tz); q.setFromEuler(e); mtx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); g.applyMatrix4(mtx); g.computeVertexNormals();
    const c = new THREE.Color(color).offsetHSL(0, 0, (rnd(seed) - 0.5) * 0.06), cc = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(cc, 3)); g.deleteAttribute("uv"); parts.push(g.toNonIndexed());
  };
  for (let i = 0; i < 26; i++) {
    const r = (kk) => rnd(i * 17 + kk), w = 0.6 + 1.4 * r(1), h = 0.4 + 0.9 * r(2), d = 0.6 + 1.2 * r(3), x = (r(4) - 0.5) * 56, z = 0.5 + 2.6 * r(5) ** 1.3;
    addBox(w, h, d, x, h / 2 - 0.05, z, r(6) * TAU, (r(7) - 0.5) * 0.2, (r(8) - 0.5) * 0.2, reds[Math.floor(r(9) * reds.length)], 200 + i * 4);
    if (r(10) < 0.3) addBox(w * 0.6, h * 0.7, d * 0.6, x + 0.1, h + h * 0.35 - 0.1, z, r(11) * TAU, 0.08, 0.06, reds[Math.floor(r(12) * reds.length)], 400 + i * 4);
  }
  for (let i = 0; i < 100; i++) { const r = (kk) => rnd(i * 13 + 1000 + kk), s = 0.08 + 0.2 * r(1) ** 2; addBox(s * 1.3, s, s, (r(2) - 0.5) * 62, s * 0.4, 0.3 + 6 * r(3) ** 1.3, r(4) * TAU, r(5), r(6), reds[Math.floor(r(7) * reds.length)], 600 + i * 4); }
  const loose = mergeGeometries(parts, false); if (loose) mesh(loose, rockM, P.whole);
  // the sand floor: a disc r 40 centred (0, 0, 8), hand-dotted (grit, red chips, cart tracks)
  const [cv, g] = canvas(2048, 2048), M = 2048 / 80, rr = (k) => rnd(9000 + k);
  g.fillStyle = "#d9c49a"; g.fillRect(0, 0, 2048, 2048); g.save(); g.scale(M, M);
  const E = (x, y, rx, ry, c, a, ro = 0) => { g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, ro, 0, TAU); g.fill(); };
  for (let i = 0; i < 90; i++) E(rr(i) * 80, rr(i + 100) * 80, 1 + 4 * rr(i + 200), 0.6 + 2.2 * rr(i + 300), i % 3 ? "#b79f73" : "#e6d6ae", 0.1 + 0.1 * rr(i + 400), rr(i + 500) * 3);
  for (let i = 0; i < 90; i++) E(40 + (rr(i + 600) - 0.5) * 60, 32 + 30 * rr(i + 700), 1 + 3 * rr(i + 800), 0.5 + 1.4 * rr(i + 900), "#c58b7a", 0.08 + 0.1 * rr(i + 1000), rr(i + 1100) * 3);   // red dust near the foot
  for (let i = 0; i < 7000; i++) E(rr(i * 4 + 2000) * 80, rr(i * 4 + 2001) * 80, 0.025 + 0.06 * rr(i * 4 + 2002), 0.02 + 0.05 * rr(i * 4 + 2002), rr(i * 4 + 2003) < 0.5 ? "#b79f73" : rr(i * 4 + 2003) < 0.8 ? "#e9dcb9" : "#b8635a", 0.5 + 0.4 * rr(i * 4 + 2002));
  for (let i = 0; i < 160; i++) { const x = 4 + rr(i * 3 + 40000) * 72, y = 30 + rr(i * 3 + 40001) * 32, s = 0.05 + 0.18 * rr(i * 3 + 40002) ** 2; E(x, y, s * 1.2, s, reds[i % reds.length], 0.95, rr(i + 41000) * 3); E(x + s * 0.2, y + s * 0.4, s * 1.3, s * 0.5, "#6f3a34", 0.35, rr(i + 41000) * 3); }
  g.strokeStyle = "#a88f64"; g.lineWidth = 0.14; g.globalAlpha = 0.28; for (const off of [0, 1.6]) { g.beginPath(); for (let k = 0; k <= 30; k++) { const y = 18 + k * 1.4, x = 30 + off + 6 * Math.sin(k * 0.12) + k * 0.25; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.restore(); g.globalAlpha = 1;
  const discM = new THREE.MeshBasicMaterial({ map: tex(cv), toneMapped: false }); discM.userData.noOutline = true;
  const disc = mesh(new THREE.CircleGeometry(40, 96), discM, P.whole, 0, 0, 8); disc.rotation.x = -Math.PI / 2; disc.castShadow = false;
  // scenery: out of the look's ground-shadow box (a prop 70 m wide would get a dark oval 130 m wide under the sand) and the light fit
  P.whole.traverse((o) => { if (o.isMesh) o.userData.steam = true; });
  return { grip: 0 };
}
