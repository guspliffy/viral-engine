import * as THREE from "three";
import { clamp, P, S as smooth, keys, spin as spinOf, peel as peelOf, squash as squashOf, cracks as cracksOf, DISC_CUT } from "./spin-tracks.js";

// props-spinspace.js: fact what-if 03 "Earth spins faster" (21 Nov 2026): space, panels P15-P17 (60-77.5 s). Design: storyboards/series/facts/03-spin/DESIGN.md
// sections 0 and H (H1-H6), cameras J. Bench: storyboards/series/facts/03-spin/bench/make-space-bench.mjs (sheet: bench/space-sheet.jpg).
//
// USAGE HEADER (the director reads only this).  World SP, units = "Earth radius 100", Earth at the origin, +y up, +x camera right, the camera sits on +z and looks
// down -z at Earth. Place every kind at x 0, y 0, z 0, rot 0, scale 1; every number below is a world number. Look-only (not solid, no shadow, no ink line).
// Needs the storyboard key "far": 6000 (nothing here is farther: the starfield is camera-pinned). Registry: SPINSPACE_KINDS (already in props3d.js).
//   ONE TIME PARAM for every kind: `t` = clip seconds. Tween it linear with the clip clock and seed it first so it never jumps:
//       c.prop(0, id, { t: 60 }, 0, "linear");  c.prop(60, id, { t: 60 }, 0, "linear");  c.prop(77.5, id, { t: 77.5 }, 77.5 - 60, "linear");
//   Pure function of t (seed 31703; no Math.random, no clock): any frame in any order is the same picture. All tracks come from spin-tracks.js (peel, squash, cracks,
//   DISC_CUT 73.3, spin). Every kind also takes spec.origin (default [80000, 0, 0]: the world's place in the stage; the cameras below are origin + the local numbers).
//   ASSET: assets/geo/ne_110m_land.geojson (Natural Earth 110 m land, public domain), fetched by the page (the engine waits on it); all maps are painted from it once.
//
//   sstars  H1 the starfield (always on). A camera-pinned dome (it never clips, whatever far is) with the Milky Way painted into the window the cameras look through
//           (28 deg band upper left to lower right, tints #3A2F6A #1F3A6A #5A2F5E, 9 dark dust lanes), 2,400 stars + 600 band micro-stars as ONE point draw:
//           1,800 faint (1 px), 480 mid (1.9 px), 120 bright (2.5-4 px, #FFF4DC #DCE6FF #FFD9B8 #BFD0FF, four-point glint). Stars sit in a 28 deg cone round -z
//           (every shot looks down -z; a whole-sphere scatter would show 50 of them). No spec keys but origin.
//   searth  H2-H4, draws while t < 73.3 (hidden from the cut). Earth radius 100 at the origin, centre of every number.
//           H2 globe: 96 x 56 sphere, map 2048 x 1024 painted from the Natural Earth outline (ocean #123A6B / #1E5A9A, shelf #3F8FC0, lowland, rainforest, dry, steppe,
//           mountains + snow dots on Andes / Rockies / Alps / Himalaya, ice, coast ink, one warm glint at Quito lon -78.5 lat 0), three diffuse bands (.50 / .76 / 1.00 at
//           N.L .13-.23 / .53-.63), key (-.55, .30, .78) #FFF1DC, warm terminator, ocean sun glint, cloud shadows 1 deg off, 900 night-light dots in 24 clusters on the
//           night crescent. Cloud shell r 101.2 (3 comma cyclones 12-18 deg, equator band of 60 chains, 24 fronts, 190 patches, #F6F7F8), redrawn only when the smear
//           x(1 + .25 (s - 18)) moves by .025. Air shell r 103 (limb glow #7FB6FF .55, inward 6, brighter on the sun side; gain 1 / .65 / .35 with peel, streaming off at the
//           equator). Turn west to east 28 deg/s at 20x to 45 deg/s at 22x (continuing +8.5 deg/s per x). P15 opens on South America (point under the camera lon -62, lat -8,
//           the equator rising to the right by 12 deg); the roll eases to 0 by 68 s, the pole tilts to +10 deg by 69 s (the lens shows its top face, as P16).
//           H3 spray (peel 60-66): foam line +-1.5 deg, then a 3-layer annulus (96 x 6, 1.2 apart x 2, canvas 2048 x 512 inner dense #F4F8FA, middle #CFE4F6, outer mist #9FC8F0,
//           layers turning 1.3 / 1.0 / .7 x the globe, arms trail), r 100 -> 150 -> 240 (the right side reaches 1.4 x, the left .6 x: it leaves the frame right), 96 billows
//           over the inner 30 + 80 plume puffs + 60 sparkle glints, dry belt #6A5A4A +-6 -> +-14 deg, glow line #FFD27A 0 / 1.2 / 2 wide. The annulus fades out 67-70.5 s.
//           H4 squash (64.5-73.3) rE / rP 100/100 -> 132/51 (reached 68.9 s) -> 168/9; cracks (66-72): 9 primaries, 26 meridian connectors, 34 plates (Voronoi, 8-22 deg),
//           60 hairlines, baked reveal order, core #FFF2B0, mid #FFB13C, edge #E0481E, halo #FF7A2A; they widen as the track runs; plates lift up to 6 from cracks .6;
//           the belt chars to #4A3A34 and widens to +-30 deg; 26 dust clusters x 5 billows at both limbs (#C9B8A6 / #8A7A6E / #4A4048, rising); 90 rocks (20 triangles,
//           1-6 across, 30 % with one glowing face) leave the belt at 12-30 a second from 66.2 s and settle into the ring orbits.
//   sdisc   H5, draws from t >= 73.3. Disc radius 168, rim 18 thick (y +-9), turns 50 deg/s about its own axis, wobbles 2.5 deg at .4 Hz. Top: the flat-earthers' map (North
//           Pole in the middle, lat to -65 at the edge), thin concentric cloud streaks, ANTARCTICA AS AN ICE WALL 6 wide all round (#F4F6F8, blue shade #B9D2E8, 48
//           buttresses), 14 waterfalls over the rim (ribbons 2-5 wide, 20 long, mist). Rim: soil #6A5548, 8 strata, a fracture every 4-9 deg, lower third glowing, 24 lava
//           drips; underside #2E2628 with a glowing crack web. Ring, tilted off the disc: 3 bands r 215-248 (#C9A46A .8), 254-290 (#A8845A .55), 298-330 (#8A7A6E .3), 5 gaps,
//           canvas 2048 x 256 (6,200 grains, 8 % glints, 5 % embers, 40 faint spokes), layers turning 34 / 26 / 19 deg/s; 160 orbiting rocks (.8-7), 12 hero rocks (6-14, a
//           glowing face), 8 chunks drifting between the camera and Spud, 36 shed from the rim (12 a second, tangent, spiral out to the ring in 2.5 s); 48 glow sprites on the
//           inner band, 40 sparkles, 30 bright arc streaks (8-25 deg long, .9 wide: .3 would be under 1 px). spec: eps 17 (disc tilt toward the camera, deg), roll 13, epsRing 24,
//           rollRing 18, chunkCam [-8.8, -88.3, 1165] (the P17 camera, local: the 8 chunks are placed in screen px at depths 300-780 from it).
//   28 (r1): from 60.5 s the cloud shell fades (gone by 66 s, 3 % left under the hurricanes' eyes) and the ocean dries to seabed #7C6450 (94 % by 66.5 s); the flat disc is painted
//           bare: dried seabed with a crack web where the ocean was, land greens baked toward khaki, no cloud streaks (dust arcs), dry channels for the 14 falls.
//   spec of searth: lon0 -62, lat0 -8, roll0 12 (P15 opening view), lensTilt 10. Nothing else needs setting.
// CAMERAS (the bench's; fov 40, vertical, look straight down -z, local = world minus origin; px at 1080 x 1920; 1 unit = 2638 / D px at distance D):
//   P15  pos (5.77, -23.08, 761)    look (5.77, -23.08, 0)   Earth centre (520, 880), disc 700 px across
//   P16  pos (0, -41.86, 690)       look (0, -41.86, 0)      Earth centre (540, 800); at 68.9 s the lens is 1,010 x 390 px
//   P17  pos (-8.83, -88.34, 1165)  look (-8.83, -88.34, 0)  disc centre (560, 760), ellipse 760 x 190, ring outer ellipse 1,500 x 520
// SPUD (H6; place him at z 0, the depth of Earth's centre; world units are Earth-radius-100, so his scale = units tall / his height in metres):
//   P15  back view, centre (69.2, -178.9, 0), 95.2 units tall (330 px)
//   P16  back view, centre (41.9, -198.8, 0), 99.4 units tall (380 px)
//   P17  front view, centre (17.7, -335.7, 0), 185.5 units tall (420 px; face at y 1440 = 17.7 x, -297.0)
// COUNTS (draft stills): triangles P15 22,000 (globe 10,560, clouds 4,992, air 2,976, 3 annuli 3,456 + sprite quads), P16 +1,800 rocks (about 24,500), P17 about 11,000
//   (disc 576, 3 ring layers 4,608, 216 rocks 4,320, 30 arcs 1,200, falls and sprites); transparent instances P15 241 (96 billows, 80 plume puffs, 60 glints, 3 layers, 2 shells),
//   peak P16 371 (dust 130 added while the spray fades), P17 107; opaque instances 90 (P16), 216 (P17); draw calls 11 (P15, P16), 15 (P17). Spud's 6,000 triangles on top.
// DEPARTURES (all marked): the starfield is a camera-pinned dome, not r 9000 (far is 6000); stars are points, not a 4096 canvas (crisp at any size); plates tip is dropped
//   (they lift only); the globe is a 96 x 56 sphere, not 64 x 40 (the crack plates need the vertices); the arc streaks are .9 wide; the spray fades out 67-70.5 s (P16's sheet has
//   none); Natural Earth kept at its 5,143 vertices (88 KB), not cut to 1,400.

const SEED = 31703, TAU = Math.PI * 2, DEG = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const sst = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const k3 = (a, b, c, u) => (u < 0.5 ? lerp(a, b, u * 2) : lerp(b, c, (u - 0.5) * 2));   // keys at 0 / .5 / 1
const fr = (x) => x - Math.floor(x);
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// h(id, i, k): seeded hash in 0..1 (DESIGN section 0)
const ih = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177) + SEED) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
function vn(x, y, s, px) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), w = (i) => (px ? ((i % px) + px) % px : i);
  const a = ih(w(ix), iy, s), b = ih(w(ix + 1), iy, s), c = ih(w(ix), iy + 1, s), d = ih(w(ix + 1), iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y, s, o = 3, px = 0) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * vn(x * f, y * f, s + i * 17, px ? px * f : 0); a *= 0.5; f *= 2; } return v / (1 - Math.pow(0.5, o)); }
const lin = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d", { willReadFrequently: true })]; }
function ctex(c, srgb = true, wrapS = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = wrapS ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t; }
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const KEY = new THREE.Vector3(-0.55, 0.30, 0.78).normalize();          // H: direction toward the light (world SP)
const KCOL = lin("#FFF1DC"), KSOFT = KCOL.clone().lerp(new THREE.Vector3(1, 1, 1), 0.55), KGLOBE = KCOL.clone().lerp(new THREE.Vector3(1, 1, 1), 0.3);   // KSOFT lights whites (clouds, spray, ring) so they stay white, not cream
const COMMON = `float band3(float nl){ return mix(mix(0.50, 0.76, smoothstep(0.13, 0.23, nl)), 1.0, smoothstep(0.53, 0.63, nl)); }`;

// ================================================================================================================ the map
// Land weights by hand-placed regions (lon, lat, half-width lon, half-width lat) and mountain chains (polylines, half-width in degrees).
const REG = {
  rain: [[-62, -4, 14, 9], [22, -1, 11, 7], [103, 6, 13, 9], [141, -5, 9, 4], [-48, -18, 4, 7], [-76, 7, 4, 5], [113, 1, 7, 4], [-85, 12, 4, 4]],
  dry: [[10, 23, 30, 8], [46, 24, 13, 8], [-70, -23, 2.5, 8], [133, -25, 17, 9], [22, -23, 9, 5], [-110, 31, 9, 6], [58, 32, 10, 6], [100, 42, 16, 5], [-68, -45, 4, 8], [40, 14, 8, 4], [-14, 22, 12, 5]],
  steppe: [[75, 47, 30, 6], [-100, 42, 13, 8], [12, 13, 30, 4], [-62, -33, 7, 6], [28, -12, 14, 8], [78, 21, 8, 6], [118, -22, 10, 6], [30, 48, 12, 4], [-108, 54, 12, 4]],
};
const RANGES = [
  { w: 1.9, snow: 130, p: [[-72, 11], [-76, 6], [-78, 0], [-77, -8], [-73, -15], [-69, -22], [-70, -32], [-71, -42], [-73, -52]] },
  { w: 3.2, snow: 110, p: [[-127, 62], [-120, 54], [-114, 47], [-110, 40], [-107, 34], [-104, 26], [-99, 19]] },
  { w: 1.5, snow: 40, p: [[5, 44.5], [7, 46], [10, 46.6], [13, 47], [16, 47.4]] },
  { w: 2.3, snow: 110, p: [[67, 36], [74, 36], [80, 32.5], [86, 28], [92, 28], [98, 27.5]] },
  { w: 1.6, p: [[59, 51], [60, 57], [61, 63], [63, 68]] }, { w: 1.5, p: [[-9, 32], [-4, 34], [3, 36]] }, { w: 1.8, snow: 20, p: [[5, 59], [10, 62], [14, 66], [20, 69]] },
  { w: 1.6, p: [[-84, 35], [-80, 38], [-76, 41], [-70, 45]] }, { w: 2, p: [[148, -20], [150, -28], [149, -37]] }, { w: 1.4, p: [[40, 43.5], [44, 42.5], [48, 41]] },
  { w: 3, p: [[84, 33], [92, 33], [100, 33]] }, { w: 2.2, p: [[39, 11], [39, 7]] }, { w: 1.4, p: [[29, -24], [28, -30]] }, { w: 1.8, snow: 30, p: [[70, 42], [78, 42.5], [86, 43]] }, { w: 1.5, p: [[47, 34], [51, 31], [55, 28]] },
];
const CITIES = [[2, 48, 40, 3], [-78, 39, 46, 3], [-88, 41, 30, 3], [-120, 35, 26, 2.5], [-99, 19, 26, 2.2], [-46, -23, 40, 2.2], [-58, -34, 24, 2], [-78.5, -0.4, 22, 1.4], [31, 28, 30, 1.6], [3, 6, 28, 2.2], [28, -26, 24, 2.4], [37, 56, 30, 2.8], [78, 27, 44, 3.5], [78, 13, 30, 3], [138, 36, 44, 2.5], [120, 32, 50, 3.5], [116, 40, 30, 2.5], [103, 13, 24, 3], [110, -7, 34, 2.4], [150, -34, 20, 2], [35, 34, 26, 2.8], [50, 27, 22, 2.2], [10, 52, 28, 2.8], [-70, -33, 16, 2]];

function earthAssets() {
  return once("earth", () => {
    const W = 2048, H = 1024, [mapC] = cv(W, H), [landC] = cv(W, H), [lightC, lightG] = cv(1024, 512);
    lightG.fillStyle = "#000"; lightG.fillRect(0, 0, 1024, 512);
    const E = { W, H, mapC, landC, lightC, map: ctex(mapC), land: ctex(landC, false), lights: ctex(lightC), ready: false, geo: null };
    (globalThis.__loads ||= []).push(
      fetch("/assets/geo/ne_110m_land.geojson").then((r) => { if (!r.ok) throw new Error("props-spinspace: assets/geo/ne_110m_land.geojson is missing"); return r.json(); })
        .then((geo) => { E.geo = geo; paintEarth(E, geo); E.ready = true; E.map.needsUpdate = E.land.needsUpdate = E.lights.needsUpdate = true; E.onReady?.(); }));
    return E;
  });
}
const CT = { ldeep: rgb("#123A6B"), mid: rgb("#1E5A9A"), shelf: rgb("#3F8FC0"), low: rgb("#4E7A3A"), rain: rgb("#2F5F34"), dry: rgb("#B99A5E"), steppe: rgb("#8E8A5A"), mtn: rgb("#7A6A50"), ice: rgb("#F4F6F8"), iceB: rgb("#B9D2E8"), taiga: rgb("#3E6A3A"), tundra: rgb("#8A9A7A"), seaice: rgb("#DCE8F2") };
function paintEarth(E, geo) {
  const { W, H } = E, X = (l) => ((l + 180) / 360) * W, Y = (l) => ((90 - l) / 180) * H;
  const polys = []; for (const f of geo.features) { const g = f.geometry; for (const p of g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]) polys.push(p); }
  const lg = E.landC.getContext("2d"); lg.fillStyle = "#000"; lg.fillRect(0, 0, W, H); lg.fillStyle = "#fff";
  const trace = (g, p) => { g.beginPath(); for (const ring of p) { ring.forEach(([lo, la], i) => (i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la)))); g.closePath(); } };
  for (const p of polys) { trace(lg, p); lg.fill("evenodd"); }
  const ld = lg.getImageData(0, 0, W, H).data;
  // shelf: land fraction blurred (512 x 256)
  const bw = 512, bh = 256, A = new Float32Array(bw * bh), B = new Float32Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { let s = 0; for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) s += ld[((y * 4 + dy) * W + x * 4 + dx) * 4]; A[y * bw + x] = s / 4080; }
  for (let it = 0; it < 3; it++) {
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { let a = 0; for (let k = -2; k <= 2; k++) a += A[y * bw + ((x + k + bw) % bw)]; B[y * bw + x] = a / 5; }
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { let a = 0; for (let k = -2; k <= 2; k++) a += B[clamp(y + k, 0, bh - 1) * bw + x]; A[y * bw + x] = a / 5; }
  }
  const shelfAt = (x, y) => { const fx = clamp(x / 4 - 0.5, 0, bw - 1.001), fy = clamp(y / 4 - 0.5, 0, bh - 1.001), x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0; return lerp(lerp(A[y0 * bw + x0], A[y0 * bw + x0 + 1], ax), lerp(A[(y0 + 1) * bw + x0], A[(y0 + 1) * bw + x0 + 1], ax), ay); };
  const mg = E.mapC.getContext("2d"), img = mg.createImageData(W, H), d = img.data, c = [0, 0, 0];
  const mx = (r, g, b, k) => { c[0] += (r - c[0]) * k; c[1] += (g - c[1]) * k; c[2] += (b - c[2]) * k; };
  const mxa = (a, k) => mx(a[0], a[1], a[2], k);
  const ell = (lo, la, e, wp) => { const dx = lo - e[0] + wp, dy = la - e[1]; return clamp(1 - (dx * dx) / (e[2] * e[2]) - (dy * dy) / (e[3] * e[3])); };
  const segs = []; for (const R of RANGES) for (let i = 1; i < R.p.length; i++) segs.push([R.p[i - 1][0], R.p[i - 1][1], R.p[i][0], R.p[i][1], R.w]);
  const segD = (lo, la, s) => { const ax = s[0], ay = s[1], bx = s[2] - ax, by = s[3] - ay, px = lo - ax, py = la - ay, k = clamp((px * bx + py * by) / (bx * bx + by * by || 1)); return Math.hypot(px - bx * k, py - by * k) / s[4]; };
  for (let y = 0; y < H; y++) {
    const lat = 90 - ((y + 0.5) / H) * 180;
    for (let x = 0; x < W; x++) {
      const lon = ((x + 0.5) / W) * 360 - 180, m = ld[(y * W + x) * 4] / 255, n1 = fbm(lon * 0.07 + 3.1, lat * 0.07 + 7.7, 1, 4), n2 = fbm(lon * 0.55, lat * 0.55, 2, 3), i4 = (y * W + x) * 4;
      if (m < 0.5) {
        c[0] = CT.ldeep[0]; c[1] = CT.ldeep[1]; c[2] = CT.ldeep[2];
        mxa(CT.mid, clamp(0.45 + 1.7 * (n1 - 0.5) + 0.25 * Math.cos(lat * DEG * 2) + 0.35 * (n2 - 0.5)));
        const sh = shelfAt(x, y); mxa(CT.shelf, sst(0.05, 0.3, sh) * (0.8 + 0.2 * n2));
        if (m > 0) mxa(CT.shelf, m * 0.3);
        const ice = lat > 77 ? sst(77, 85, lat + (n1 - 0.5) * 8) : lat < -68 ? sst(-68, -76, lat + (n1 - 0.5) * 8) : 0; if (ice > 0) mxa(CT.seaice, ice * 0.9);
      } else {
        c[0] = CT.low[0]; c[1] = CT.low[1]; c[2] = CT.low[2];
        const wp = (n2 - 0.5) * 7;
        if (lat > 50 && lat < 70) mxa(CT.taiga, sst(50, 56, lat) * (1 - sst(64, 70, lat)) * 0.75);
        if (lat > 66) mxa(CT.tundra, sst(66, 72, lat) * 0.8);
        let w = 0; for (const e of REG.steppe) w = Math.max(w, ell(lon, lat, e, wp)); mxa(CT.steppe, sst(0, 0.5, w) * 0.9);
        w = 0; for (const e of REG.dry) w = Math.max(w, ell(lon, lat, e, wp)); mxa(CT.dry, sst(0, 0.45, w));
        w = 0; for (const e of REG.rain) w = Math.max(w, ell(lon, lat, e, wp)); mxa(CT.rain, sst(0, 0.5, w));
        let md = 9; for (const s of segs) { if (lat < Math.min(s[1], s[3]) - 6 || lat > Math.max(s[1], s[3]) + 6) continue; md = Math.min(md, segD(lon + wp * 0.3, lat, s)); }
        mxa(CT.mtn, sst(1.0, 0.25, md) * (0.7 + 0.3 * n2));
        const mt = ell(lon, lat, [88, 33, 10, 4], wp) + ell(lon, lat, [39, 9, 3.5, 3], wp) * 0.8; if (mt > 0) mxa(CT.mtn, sst(0, 0.5, mt) * 0.7);
        let ic = lat < -64 ? 1 : 0; if (lat < -60) ic = Math.max(ic, sst(-60, -66, lat)); if (lat > 76) ic = Math.max(ic, sst(76, 80, lat));
        ic = Math.max(ic, sst(0, 0.35, ell(lon, lat, [-40, 73, 33, 13], wp * 0.5)) * (lon > -75 && lon < -10 && lat > 59 ? 1 : 0));
        if (ic > 0) { mxa(n2 < 0.36 ? CT.iceB : CT.ice, ic); }
        const k = 0.88 + 0.24 * n2; c[0] *= k; c[1] *= k; c[2] *= k;
      }
      d[i4] = c[0]; d[i4 + 1] = c[1]; d[i4 + 2] = c[2]; d[i4 + 3] = 255;
    }
  }
  mg.putImageData(img, 0, 0);
  // snow on the great ranges, coast ink, Quito
  const R = rngOf(SEED + 11); mg.fillStyle = "#F2F0EE";
  for (const Rg of RANGES) { if (!Rg.snow) continue; for (let i = 0; i < Rg.snow; i++) { const si = Math.floor(R() * (Rg.p.length - 1)), k = R(), lo = lerp(Rg.p[si][0], Rg.p[si + 1][0], k) + (R() - 0.5) * Rg.w * 1.1, la = lerp(Rg.p[si][1], Rg.p[si + 1][1], k) + (R() - 0.5) * Rg.w * 1.1, px = X(lo), py = Y(la); if (ld[(Math.floor(py) * W + Math.floor(px)) * 4] < 128) continue; mg.globalAlpha = 0.85; mg.beginPath(); mg.arc(px, py, 0.7 + R() * 1.4, 0, TAU); mg.fill(); } }
  mg.globalAlpha = 1; mg.strokeStyle = "rgba(14,42,74,0.5)"; mg.lineWidth = 0.5; for (const p of polys) { trace(mg, p); mg.stroke(); }
  { const qx = X(-78.5), qy = Y(0), gr = mg.createRadialGradient(qx, qy, 0, qx, qy, 6); gr.addColorStop(0, "rgba(255,230,160,1)"); gr.addColorStop(0.3, "rgba(255,200,115,0.95)"); gr.addColorStop(1, "rgba(255,200,115,0)"); mg.fillStyle = gr; mg.beginPath(); mg.arc(qx, qy, 6, 0, TAU); mg.fill(); }
  // night lights: 900 dots in 24 clusters (kept on land)
  const lg2 = E.lightC.getContext("2d"), Rl = rngOf(SEED + 23); lg2.globalCompositeOperation = "lighter"; let nd = 0;
  const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Rl(); return (s - 2) * 1.7; };
  for (const [lo0, la0, n, sg] of CITIES) for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 8; tries++) {
      const lo = lo0 + gauss() * sg, la = la0 + gauss() * sg * 0.8, px = Math.floor(((lo + 180) / 360) * W), py = Math.floor(((90 - la) / 180) * H); if (px < 0 || px >= W || py < 0 || py >= H) continue;
      if (ld[(py * W + px) * 4] < 128) continue; const x = ((lo + 180) / 360) * 1024, y = ((90 - la) / 180) * 512, rr = 0.8 + Rl() * 1.1;
      const g = lg2.createRadialGradient(x, y, 0, x, y, rr * 2.6); g.addColorStop(0, "rgba(255,214,140,0.95)"); g.addColorStop(0.4, "rgba(255,200,115,0.5)"); g.addColorStop(1, "rgba(255,200,115,0)"); lg2.fillStyle = g; lg2.beginPath(); lg2.arc(x, y, rr * 2.6, 0, TAU); lg2.fill(); nd++; break;
    }
  }
  E.nLights = nd;
}

// ---- clouds (2048 x 1024, alpha), drawn again only when the smear moves by .025: x (1 + .25 (s - 18))
function cloudAssets() {
  return once("clouds", () => {
    const [c, g] = cv(2048, 1024), C = { c, g, tex: ctex(c, true), smear: -1 };
    C.draw = (smear) => {
      const q = Math.round(smear / 0.025) * 0.025; if (q === C.smear) return; C.smear = q; g.clearRect(0, 0, 2048, 1024);
      const X = (l) => ((l + 180) / 360) * 2048, Y = (l) => ((90 - l) / 180) * 1024, R = rngOf(SEED + 41);
      const puff = (x, y, rx, ry, a) => { for (const off of [0, -2048, 2048]) { const xx = x + off; if (xx + rx * q < -10 || xx - rx * q > 2058) continue; g.save(); g.translate(xx, y); g.scale(rx * q / ry, 1); const gr = g.createRadialGradient(0, 0, 0, 0, 0, ry); gr.addColorStop(0, `rgba(246,247,248,${a})`); gr.addColorStop(0.6, `rgba(246,247,248,${a * 0.86})`); gr.addColorStop(1, "rgba(246,247,248,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, ry, 0, TAU); g.fill(); g.restore(); } };
      const cluster = (x, y, n, sx, sy, wx, wy, a0) => { for (let i = 0; i < n; i++) puff(x + (R() + R() - 1) * sx, y + (R() + R() - 1) * sy, wx * (0.55 + 0.9 * R()), wy * (0.6 + 0.8 * R()), a0 * (0.5 + 0.5 * R())); };
      for (const [lo, la, rad, hand] of [[-35, 40, 16, 1], [148, 33, 14, 1], [62, -38, 17, -1]]) {   // 3 comma cyclones, 12-18 deg across
        const cx = X(lo), cy = Y(la), pr = (rad / 360) * 2048;
        for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 34; i++) { const f = i / 33, th = f * 1.6 * Math.PI + arm * (TAU / 3), rr = pr * (0.14 + 0.88 * f), px = cx + hand * Math.cos(th * hand) * rr, py = cy - Math.sin(th * hand) * rr * 0.8; cluster(px, py, 3, pr * 0.05, pr * 0.04, pr * 0.1 * (1.15 - f * 0.6), pr * 0.07 * (1.15 - f * 0.6), 0.85); }
        cluster(cx, cy, 10, pr * 0.2, pr * 0.16, pr * 0.1, pr * 0.07, 0.9);
        g.save(); g.fillStyle = "rgba(0,0,0,1)"; g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(cx, cy, pr * 0.06, 0, TAU); g.fill(); g.restore();   // the eye
      }
      for (let i = 0; i < 12; i++) cluster(R() * 2048, Y((R() - 0.5) * 8), 6, 40, 6, 30, 9, 0.8);       // the broken equator band: 12 chains of 5 puffs, five times
      for (let i = 0; i < 60; i++) cluster(R() * 2048, Y((R() - 0.5) * 9), 5, 32, 7, 24, 8, 0.85);          // = 60 chains of puffs along +-4.5 deg
      for (let i = 0; i < 24; i++) { const la0 = (R() < 0.5 ? 1 : -1) * (24 + 36 * R()), lo0 = R() * 2048, ln = 90 + 260 * R(), ph = R() * TAU; for (let k = 0; k < 16; k++) { const f = k / 15; cluster(lo0 + f * ln, Y(la0) + 14 * Math.sin(f * 4 + ph), 4, 10, 5, 20, 8, 0.78); } }   // fronts
      for (let i = 0; i < 190; i++) { const la = (R() + R() - 1) * 66; cluster(R() * 2048, Y(la), 7, 30, 12, 19, 8, 0.75); }   // 150 patches
      C.tex.needsUpdate = true;
    };
    return C;
  });
}

// ================================================================================================================ the crack network
// 2048 x 1024, three channels = (1 - reveal) x a soft profile: R halo + edge, G mid, B core. A pixel shows while value + cracks > 1, so the cracks appear
// in the baked order (primaries, connectors, plate borders, hairlines) and WIDEN as the track runs. A second map, 256 x 128, holds each plate's lift.
const PLATE_N = 34;
function plateSeeds() { return once("seeds", () => { const s = []; for (let row = 0; row < 2; row++) for (let i = 0; i < 17; i++) s.push({ lon: -180 + (i + (row ? 0.5 : 0)) * (360 / 17) + (ih(i, row, 1) - 0.5) * 9, lat: (row ? 1 : -1) * (11 + (ih(i, row, 2) - 0.5) * 9), lift: 0.25 + 0.75 * ih(i, row, 3) }); return s; }); }
function crackAssets() {
  return once("cracks", () => {
    const W = 2048, H = 1024, [c, g] = cv(W, H), seeds = plateSeeds();
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    const w2 = 1024, h2 = 512, [c2, g2] = cv(w2, h2), im = g2.createImageData(w2, h2), dd = im.data, GW = [1.5, 0.62, 0.26];
    const warp = (lo, la) => [lo + 3.2 * Math.sin(la * 0.55 + lo * 0.09) + 1.8 * Math.sin(lo * 0.23 - la * 0.3), la + 2.4 * Math.sin(lo * 0.31 + la * 0.2)];
    for (let y = 0; y < h2; y++) {
      const lat = 90 - ((y + 0.5) / h2) * 180; if (Math.abs(lat) > 30) continue;
      for (let x = 0; x < w2; x++) {
        const lon = ((x + 0.5) / w2) * 360 - 180, [lw, aw] = warp(lon, lat); let b1 = 1e9, b2 = 1e9, i1 = 0, i2 = 0;
        for (let i = 0; i < PLATE_N; i++) { const s = seeds[i]; let dl = ((lw - s.lon + 540) % 360) - 180; dl *= 0.93; const da = aw - s.lat, dq = dl * dl + da * da; if (dq < b1) { b2 = b1; i2 = i1; b1 = dq; i1 = i; } else if (dq < b2) { b2 = dq; i2 = i; } }
        const gap = Math.sqrt(b2) - Math.sqrt(b1), lim = 1 - sst(20, 28, Math.abs(lat)), rev = 0.5 + 0.45 * ih(Math.min(i1, i2), Math.max(i1, i2), 5), o = (y * w2 + x) * 4;
        for (let k = 0; k < 3; k++) dd[o + k] = 255 * (1 - rev) * clamp(1 - gap / GW[k]) * lim;
        dd[o + 3] = 255;
      }
    }
    g2.putImageData(im, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(c2, 0, 0, W, H);
    // strokes: 9 primaries (lat +-6..22, 40-80 deg long, 5-8 bends), 26 meridian connectors, 60 hairline branches
    const X = (l) => ((l + 180) / 360) * W, Y = (l) => ((90 - l) / 180) * H, R = rngOf(SEED + 67), WID = [[20, 8.5, 3.4], [11, 4.6, 1.9], [6, 2.6, 1.1]], NP = 5;
    g.globalCompositeOperation = "lighten"; g.lineCap = "round"; g.lineJoin = "round";
    const line = (pts, rev, kind) => {
      for (let ch = 0; ch < 3; ch++) for (let j = 0; j < NP; j++) {
        const v = Math.round(255 * (1 - rev) * ((j + 1) / NP)), col = `rgb(${ch === 0 ? v : 0},${ch === 1 ? v : 0},${ch === 2 ? v : 0})`; g.strokeStyle = col; g.lineWidth = WID[kind][ch] * (1 - (j / NP) * 0.8);
        for (const off of [-360, 0, 360]) { g.beginPath(); pts.forEach(([lo, la], i) => (i ? g.lineTo(X(lo + off), Y(la)) : g.moveTo(X(lo + off), Y(la)))); g.stroke(); }
      }
    };
    const prim = [];
    for (let i = 0; i < 9; i++) {
      const sgn = i < 5 ? 1 : -1, lat0 = sgn * (6 + ((i * 3.7) % 16)), n = 5 + Math.floor(R() * 4), len = 40 + R() * 40, lo0 = -180 + i * 40 + R() * 14, pts = [];
      for (let k = 0; k <= n; k++) pts.push([lo0 + (k / n) * len + (R() - 0.5) * 3, lat0 + (R() - 0.5) * 7]);
      prim.push(pts); line(pts, 0.04 + 0.3 * R(), 0);
    }
    for (let i = 0; i < 26; i++) { const lo = (i + R() * 0.6) * (360 / 26) - 180, n = 4 + Math.floor(R() * 2), la0 = 16 + R() * 8, pts = []; for (let k = 0; k <= n; k++) pts.push([lo + (R() - 0.5) * 6, la0 - (k / n) * 2 * la0 + (R() - 0.5) * 2]); line(pts, 0.12 + 0.5 * R(), 1); }
    for (let i = 0; i < 60; i++) {
      const pr = prim[Math.floor(R() * prim.length)], si = Math.floor(R() * (pr.length - 1)), k = R(), lo = lerp(pr[si][0], pr[si + 1][0], k), la = lerp(pr[si][1], pr[si + 1][1], k), dir = (R() < 0.5 ? 1 : -1), a0 = dir * (0.5 + R() * 0.9) + (la > 0 ? 1.57 : -1.57) * 0, pts = [[lo, la]];
      let px = lo, py = la, a = (la > 0 ? 1 : -1) * (0.9 + R() * 0.8) * 1.0; const nb = 2 + Math.floor(R() * 2), step = 2.5 + R() * 3;
      for (let b = 0; b < nb; b++) { a += (R() - 0.5) * 1.1 * dir + a0 * 0.05; px += Math.cos(a) * step * 0.9; py += Math.sin(a) * step * (la > 0 ? 1 : 1); pts.push([px, py]); }
      line(pts, 0.55 + 0.42 * R(), 2);
    }
    g.globalCompositeOperation = "source-over";
    // plate lift: nearest plate's lift, fading out of the belt (256 x 128, linear filter)
    const pw = 256, ph = 128, [pc, pg] = cv(pw, ph), pim = pg.createImageData(pw, ph), pd = pim.data;
    for (let y = 0; y < ph; y++) { const lat = 90 - ((y + 0.5) / ph) * 180, lim = 1 - sst(20, 28, Math.abs(lat)); for (let x = 0; x < pw; x++) {
      const lon = ((x + 0.5) / pw) * 360 - 180, [lw, aw] = warp(lon, lat); let b1 = 1e9, i1 = 0; for (let i = 0; i < PLATE_N; i++) { const s = seeds[i]; let dl = ((lw - s.lon + 540) % 360) - 180; dl *= 0.93; const da = aw - s.lat, dq = dl * dl + da * da; if (dq < b1) { b1 = dq; i1 = i; } }
      const o = (y * pw + x) * 4; pd[o] = 255 * seeds[i1].lift * lim; pd[o + 1] = pd[o + 2] = 0; pd[o + 3] = 255; } }
    pg.putImageData(pim, 0, 0);
    const cr = new THREE.CanvasTexture(c); cr.wrapS = THREE.RepeatWrapping; cr.wrapT = THREE.ClampToEdgeWrapping; cr.generateMipmaps = true; cr.minFilter = THREE.LinearMipmapLinearFilter; cr.anisotropy = 4; cr.needsUpdate = true;
    const pl = new THREE.CanvasTexture(pc); pl.wrapS = THREE.RepeatWrapping; pl.wrapT = THREE.ClampToEdgeWrapping; pl.generateMipmaps = false; pl.minFilter = THREE.LinearFilter; pl.needsUpdate = true;
    return { crack: cr, plate: pl, nPrim: prim.length };
  });
}

// ================================================================================================================ shared GPU pieces
// Instanced camera-facing sprites. kind PUFF: a lobed three-tone billow (c1 shade, c2 body, c3 lit; lit side toward the key); GLOW: a soft disc (c1 core, c2 fringe);
// GLINT: a four-point sparkle. put(x, y, z, w, h, roll, alpha, seed, c1, c2, c3). PUFF is sorted far to near from the camera before every draw.
const SPR_VS = `attribute vec3 aC; attribute vec2 aS; attribute float aR; attribute float aA; attribute float aSd; attribute vec3 aC1; attribute vec3 aC2; attribute vec3 aC3;
varying vec2 vQ; varying float vA; varying float vSd; varying vec3 v1; varying vec3 v2; varying vec3 v3;
void main(){ vec4 mv = modelViewMatrix * vec4(aC, 1.0); float c = cos(aR), s = sin(aR); vec2 q = position.xy * aS; q = vec2(c * q.x - s * q.y, s * q.x + c * q.y); mv.xy += q;
  vQ = position.xy * 2.0; vA = aA; vSd = aSd; v1 = aC1; v2 = aC2; v3 = aC3; gl_Position = projectionMatrix * mv; }`;
const SPR_FS = `uniform vec2 uL; varying vec2 vQ; varying float vA; varying float vSd; varying vec3 v1; varying vec3 v2; varying vec3 v3;
void main(){
  float r = length(vQ);
#if defined(PUFF)
  float a = atan(vQ.y, vQ.x); float lob = 0.84 + 0.05 * sin(a * 4.0 + vSd * 6.283) + 0.05 * sin(a * 7.0 + vSd * 17.0) + 0.04 * sin(a * 11.0 + vSd * 29.0) + 0.03 * sin(a * 17.0 + vSd * 41.0);
  float al = smoothstep(1.0, 0.28, r / lob); al = al * al * (3.0 - 2.0 * al); if (al < 0.01) discard;
  vec2 wq = vQ + 0.10 * vec2(sin(vQ.y * 5.0 + vSd * 20.0), cos(vQ.x * 6.0 + vSd * 13.0));
  float t = 1.0 - length(wq - uL * 0.34) / 1.05;
  vec3 col = mix(v1, v2, smoothstep(0.34, 0.44, t)); col = mix(col, v3, smoothstep(0.74, 0.82, t));
  gl_FragColor = vec4(col, al * vA);
#elif defined(GLOW)
  float g = pow(max(1.0 - r, 0.0), 2.0); float core = exp(-r * r * 9.0); float al = (g * 0.8 + core) * vA; if (al < 0.004) discard;
  gl_FragColor = vec4(mix(v2, v1, core), al);
#else
  float core = exp(-r * r * 26.0); float cr = exp(-abs(vQ.x) * 18.0) * exp(-abs(vQ.y) * 2.2) + exp(-abs(vQ.y) * 18.0) * exp(-abs(vQ.x) * 2.2);
  float al = clamp(core + cr * 0.85, 0.0, 1.0) * (1.0 - smoothstep(0.8, 1.0, r)) * vA; if (al < 0.004) discard;
  gl_FragColor = vec4(mix(v2, v1, core), al);
#endif
  #include <colorspace_fragment>
}`;
function makeSprites(root, cap, o) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  const NAMES = [["aC", 3], ["aS", 2], ["aR", 1], ["aA", 1], ["aSd", 1], ["aC1", 3], ["aC2", 3], ["aC3", 3]], STR = 17, A = {};
  for (const [n, k] of NAMES) { const at = new THREE.InstancedBufferAttribute(new Float32Array(cap * k), k); at.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, at); A[n] = at; }
  geo.instanceCount = 0;
  const stg = new Float32Array(cap * STR), dist = new Float32Array(cap), ord = Array.from({ length: cap }, (_, i) => i);
  const mat = noLine(new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector2(-0.6, 0.8) } }, vertexShader: SPR_VS, fragmentShader: SPR_FS, defines: { [o.kind || "PUFF"]: 1 }, transparent: true, depthWrite: false, depthTest: true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: false }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), o.order ?? 40), tc = new THREE.Vector3(), kv = new THREE.Vector3(), ax = new THREE.Vector3(), inv = new THREE.Matrix4();
  root.add(mesh);
  const me = {
    n: 0, mesh,
    reset() { this.n = 0; },
    put(x, y, z, sx, sy, rot, a, sd, c1, c2, c3) {
      if (this.n >= cap || a <= 0.003) return; const b = this.n++ * STR; stg[b] = x; stg[b + 1] = y; stg[b + 2] = z; stg[b + 3] = sx; stg[b + 4] = sy; stg[b + 5] = rot; stg[b + 6] = a; stg[b + 7] = sd;
      stg[b + 8] = c1.x; stg[b + 9] = c1.y; stg[b + 10] = c1.z; stg[b + 11] = (c2 || c1).x; stg[b + 12] = (c2 || c1).y; stg[b + 13] = (c2 || c1).z; stg[b + 14] = (c3 || c2 || c1).x; stg[b + 15] = (c3 || c2 || c1).y; stg[b + 16] = (c3 || c2 || c1).z;
    },
    // sorted far to near (by distance to spec.cam when given, else along the sight line +z, which every shot of this world looks down) and uploaded HERE, in apply:
    // three uploads buffers before onBeforeRender runs, so a fill done there would draw one frame late
    commit() {
      const n = this.n; mesh.visible = n > 0; geo.instanceCount = n; if (!n) return;
      const par = mesh.parent; par.updateWorldMatrix(true, false); inv.copy(par.matrixWorld).invert();
      if (o.cam) tc.set(...o.cam).applyMatrix4(inv); else ax.set(0, 0, 1).transformDirection(inv);
      for (let i = 0; i < n; i++) { const b = i * STR; dist[i] = o.cam ? (stg[b] - tc.x) ** 2 + (stg[b + 1] - tc.y) ** 2 + (stg[b + 2] - tc.z) ** 2 : -(stg[b] * ax.x + stg[b + 1] * ax.y + stg[b + 2] * ax.z); ord[i] = i; }
      const idx = ord.slice(0, n); if (o.sort !== false) idx.sort((a, b) => dist[b] - dist[a]);
      for (let j = 0; j < n; j++) {
        const b = idx[j] * STR; A.aC.array.set(stg.subarray(b, b + 3), j * 3); A.aS.array.set(stg.subarray(b + 3, b + 5), j * 2); A.aR.array[j] = stg[b + 5]; A.aA.array[j] = stg[b + 6]; A.aSd.array[j] = stg[b + 7];
        A.aC1.array.set(stg.subarray(b + 8, b + 11), j * 3); A.aC2.array.set(stg.subarray(b + 11, b + 14), j * 3); A.aC3.array.set(stg.subarray(b + 14, b + 17), j * 3);
      }
      for (const k in A) A[k].needsUpdate = true;
    },
  };
  mesh.onBeforeRender = (renderer, scene, camera) => { kv.copy(KEY).transformDirection(camera.matrixWorldInverse); const l = Math.hypot(kv.x, kv.y) || 1; mat.uniforms.uL.value.set(kv.x / l, kv.y / l); };
  return me;
}

// 20-triangle rocks, instanced, flat shaded, jittered per instance seed; one face may glow (aGlow = face + 1, 0 = none)
const ROCK_VS = `attribute float faceId; attribute float aGlow; attribute float aSd; varying vec3 vVP; varying float vGl; varying float vSd;
void main(){ vec3 p = position; float j = fract(sin(dot(p * 13.37 + aSd * 91.7, vec3(12.9898, 78.233, 45.164))) * 43758.5453); p *= 0.74 + 0.5 * j;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0); vVP = mv.xyz; vGl = abs(faceId + 1.0 - aGlow) < 0.5 ? 1.0 : 0.0; vSd = aSd; gl_Position = projectionMatrix * mv; }`;
const ROCK_FS = `uniform vec3 uKV; uniform vec3 uKc; uniform vec3 uRock; uniform vec3 uGl1; uniform vec3 uGl2; varying vec3 vVP; varying float vGl; varying float vSd;
${COMMON}
void main(){
  vec3 n = normalize(cross(dFdx(vVP), dFdy(vVP))); if (dot(n, -vVP) < 0.0) n = -n;
  float nl = dot(n, uKV); float cr = 0.86 + 0.28 * fract(sin(dot(floor(n * 4.0), vec3(12.9, 78.2, 45.1)) + vSd * 31.0) * 43758.5); vec3 col = uRock * cr * band3(nl) * uKc + uRock * vec3(0.10, 0.12, 0.2) * (1.0 - band3(nl));
  col += vec3(0.9, 0.35, 0.1) * 0.05 * (1.0 - max(nl, 0.0));
  if (vGl > 0.5) { float k = 0.5 + 0.5 * sin(vVP.x * 3.1 + vVP.y * 4.7 + vSd * 40.0); col = mix(uGl1, uGl2, k) * 1.4; }
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
function makeRocks(root, cap, order = 20) {
  let g = new THREE.IcosahedronGeometry(1, 0).toNonIndexed(); const fid = new Float32Array(60); for (let i = 0; i < 60; i++) fid[i] = Math.floor(i / 3); g.setAttribute("faceId", new THREE.BufferAttribute(fid, 1)); g.deleteAttribute("uv");
  const aGlow = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1), aSd = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1); aGlow.setUsage(THREE.DynamicDrawUsage); g.setAttribute("aGlow", aGlow); g.setAttribute("aSd", aSd);
  const m = noLine(new THREE.ShaderMaterial({ uniforms: { uKV: { value: KEY.clone() }, uKc: { value: KCOL }, uRock: { value: lin("#5E4A40") }, uGl1: { value: lin("#FF9A3C") }, uGl2: { value: lin("#FFE2A9") } }, vertexShader: ROCK_VS, fragmentShader: ROCK_FS, fog: false }));
  const im = new THREE.InstancedMesh(g, m, cap); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lookOnly(im, order); root.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  im.onBeforeRender = (r, s, camera) => { m.uniforms.uKV.value.copy(KEY).transformDirection(camera.matrixWorldInverse); };
  return {
    mesh: im, n: 0, reset() { this.n = 0; },
    // position (x,y,z), size, tumble axis + angle (rad), seed, glow face (0 = none)
    put(x, y, z, size, axx, axy, axz, ang, sd, glow) { if (this.n >= cap) return; const i = this.n++; ax.set(axx, axy, axz).normalize(); q.setFromAxisAngle(ax, ang); m4.compose(ps.set(x, y, z), q, sc.set(size, size, size)); im.setMatrixAt(i, m4); aGlow.array[i] = glow; aSd.array[i] = sd; },
    commit() { im.count = this.n; im.visible = this.n > 0; im.instanceMatrix.needsUpdate = true; aGlow.needsUpdate = true; aSd.needsUpdate = true; },
  };
}

// a flat annulus in the xz plane: radius mix(uR0, uR1, aV), texture u = angle / 2 pi (+ uOff turns), v = mix(uV0, uV1, aV)
function annulusGeo(nu, nv) {
  const pos = [], av = [], au = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = (i / nu) * TAU; pos.push(Math.cos(a), 0, Math.sin(a)); av.push(j / nv); au.push(i / nu); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aV", new THREE.Float32BufferAttribute(av, 1)); g.setAttribute("aU", new THREE.Float32BufferAttribute(au, 1)); g.setIndex(idx); return g;
}
const ANN_VS = `attribute float aV; attribute float aU; uniform float uR0; uniform float uR1; uniform float uY; uniform float uSkew; varying float vU; varying float vV; varying vec3 vN; varying vec3 vVw;
void main(){ float g = (1.0 - uSkew * 0.5) + uSkew * 0.5 * (1.0 + position.x); float r = mix(uR0, uR0 + (uR1 - uR0) * g, aV); vec3 p = vec3(position.x * r, uY, position.z * r); vU = aU; vV = aV; vN = normalMatrix * vec3(0.0, 1.0, 0.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); vVw = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const ANN_FS = `uniform sampler2D uMap; uniform float uOff; uniform float uV0; uniform float uV1; uniform float uAlpha; uniform vec3 uKV; uniform vec3 uKc; uniform float uFlat; uniform float uEdge; varying float vU; varying float vV; varying vec3 vN; varying vec3 vVw;
${COMMON}
void main(){ vec4 t = texture2D(uMap, vec2(fract(vU + uOff), mix(uV0, uV1, vV))); float fc = abs(dot(normalize(vN), normalize(vVw))); float a = t.a * uAlpha * mix(1.0, 0.2 + 0.8 * smoothstep(0.03, 0.45, fc), uEdge); if (a < 0.003) discard;
  float nl = abs(dot(normalize(vN), uKV)); float lit = mix(0.80, 0.80 + 0.20 * band3(nl), uFlat); gl_FragColor = vec4(t.rgb * lit * uKc, a);
  #include <colorspace_fragment>
}`;
function annulusMat(map, o = {}) {
  const m = noLine(new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uR0: { value: 100 }, uR1: { value: 200 }, uY: { value: 0 }, uOff: { value: 0 }, uV0: { value: o.v0 ?? 0 }, uV1: { value: o.v1 ?? 1 }, uAlpha: { value: 1 }, uKV: { value: KEY.clone() }, uKc: { value: KSOFT }, uFlat: { value: o.flat ?? 1 }, uSkew: { value: 0 }, uEdge: { value: o.edge ?? 0 } }, vertexShader: ANN_VS, fragmentShader: ANN_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  return m;
}
const viewKey = (u, camera) => u.copy(KEY).transformDirection(camera.matrixWorldInverse);

// ================================================================================================================ H1 starfield
function milkyTex() {
  return once("mw", () => {
    const W = 2048, H = 1024, [c, g] = cv(W, H), nB = new THREE.Vector3(-0.8, -1, 0).normalize(), tB = new THREE.Vector3(1, -0.8, 0).normalize(), T1 = rgb("#3A2F6A"), T2 = rgb("#1F3A6A"), T3 = rgb("#5A2F5E"), G0 = rgb("#070A1C"), G1 = rgb("#0C1230"), v3 = new THREE.Vector3();
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0C1230"); gr.addColorStop(1, "#070A1C"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the dome is only ever seen toward -z (u .75, equator): paint that window only, 28 deg wide band, 9 dust lanes, mottled tints
    const x0 = Math.floor(W * 0.6), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.22), y1 = Math.floor(H * 0.78), im = g.createImageData(x1 - x0, y1 - y0), d = im.data;
    for (let y = y0; y < y1; y++) { const th = (Math.PI * (y + 0.5)) / H; for (let x = x0; x < x1; x++) {
      const u = (x + 0.5) / W; v3.set(-Math.cos(TAU * u) * Math.sin(th), Math.cos(th), Math.sin(TAU * u) * Math.sin(th));
      const dist = Math.asin(clamp(v3.dot(nB), -1, 1)) / DEG, along = Math.atan2(v3.dot(tB), -v3.z) / DEG, w = Math.exp(-((dist / 9.5) ** 2));
      const n = fbm(u * 95, (y / H) * 48, 5, 4, 95), n2 = fbm(u * 170 + 3, (y / H) * 85, 9, 3, 170), k = clamp((v3.y + 1) / 2);
      let lanes = 0; for (let L = 0; L < 9; L++) { const off = (L - 4) * 2.4 + 1.5 * Math.sin(L * 2.1), wav = 2.2 * Math.sin(along * 0.31 + L * 1.7) + 1.2 * Math.sin(along * 0.83 + L); lanes = Math.max(lanes, Math.exp(-(((dist - off - wav) / 0.7) ** 2)) * (0.3 + 0.7 * ih(L, 0, 7))); }
      const mixT = n2 < 0.4 ? T2 : n2 < 0.62 ? T1 : T3, amt = 0.25 * w * clamp(0.2 + 1.8 * (n - 0.3)) * (1 - 0.6 * lanes), o = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
      for (let ch = 0; ch < 3; ch++) d[o + ch] = clamp((G0[ch] + (G1[ch] - G0[ch]) * k) * (1 - 0.45 * lanes * w) + mixT[ch] * amt * 1.9 + w * 9 * (n - 0.4) * (ch === 2 ? 1.2 : 0.8), 0, 255); d[o + 3] = 255;
    } }
    g.putImageData(im, x0, y0); return ctex(c, true);
  });
}
const PIN_VS = `varying vec2 vUv; void main(){ vUv = uv; vec3 p = mat3(modelViewMatrix) * position * 100.0; gl_Position = projectionMatrix * vec4(p, 1.0); }`;
const STAR_VS = `attribute float aSize; attribute vec4 aCol; attribute float aGl; uniform float uPx; varying vec4 vC; varying float vGl; varying float vCore;
void main(){ vC = aCol; vGl = aGl; float px = max(aSize * uPx, 1.1); float ps = aGl > 0.5 ? max(px, 18.0 * uPx) : px; vCore = px / ps; gl_PointSize = ps; vec3 p = mat3(modelViewMatrix) * position * 4000.0; gl_Position = projectionMatrix * vec4(p, 1.0); }`;
const STAR_FS = `varying vec4 vC; varying float vGl; varying float vCore;
void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); float core = smoothstep(vCore, 0.0, r) ; float a = core;
  if (vGl > 0.5) { float cr = exp(-abs(q.x) * 20.0) * exp(-abs(q.y) * 2.6) + exp(-abs(q.y) * 20.0) * exp(-abs(q.x) * 2.6); a = max(core, cr * 0.9); }
  a *= 1.0 - smoothstep(0.85, 1.0, r); gl_FragColor = vec4(vC.rgb, vC.a * a);
  #include <colorspace_fragment>
}`;
function starsKind(P_) {
  const S = P_.spec, O = S.origin ?? [80000, 0, 0], root = new THREE.Group(); root.position.set(...O); P_.whole.add(root);
  // the background: a camera-pinned sphere (the camera never leaves the middle of it, so nothing clips at far 6000)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), noLine(new THREE.ShaderMaterial({ uniforms: { uMap: { value: milkyTex() } }, vertexShader: PIN_VS, fragmentShader: `uniform sampler2D uMap; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(uMap, vUv).rgb, 1.0);\n#include <colorspace_fragment>\n}`, depthTest: false, depthWrite: false, side: THREE.BackSide, fog: false })));
  lookOnly(dome, -1000); root.add(dome);
  // 2,400 stars + 600 micro-stars inside the cone the camera ever looks through (34 deg round -z)
  const R = rngOf(SEED + 5), CONE = 28 * DEG, cc = Math.cos(CONE), nB = new THREE.Vector3(-0.8, -1, 0).normalize(), P_pos = [], P_sz = [], P_col = [], P_gl = [];
  const dir = () => { const ct = 1 - R() * (1 - cc), st = Math.sqrt(1 - ct * ct), ph = R() * TAU; return [st * Math.cos(ph), st * Math.sin(ph), -ct]; };
  const add = (sz, col, a, gl, bandOnly) => { let d, tries = 0; do { d = dir(); tries++; } while (bandOnly && Math.abs(Math.asin(clamp(d[0] * nB.x + d[1] * nB.y + d[2] * nB.z, -1, 1)) / DEG) > 12 && tries < 40); P_pos.push(...d); P_sz.push(sz); const c = lin(col); P_col.push(c.x, c.y, c.z, a); P_gl.push(gl); };
  for (let i = 0; i < 1800; i++) add(1.25, "#C9D2F2", 0.62 + 0.3 * R(), 0, false);
  for (let i = 0; i < 480; i++) add(1.9, R() < 0.5 ? "#C9D2F2" : "#EEF2FF", 0.8 + 0.2 * R(), 0, false);
  const BR = ["#FFF4DC", "#DCE6FF", "#FFD9B8", "#BFD0FF"]; for (let i = 0; i < 120; i++) add(2.5 + 1.5 * R(), BR[i % 4], 1, 1, false);
  for (let i = 0; i < 600; i++) add(1.1, "#C9D2F2", 0.4 + 0.35 * R(), 0, true);
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(P_pos, 3)); sg.setAttribute("aSize", new THREE.Float32BufferAttribute(P_sz, 1)); sg.setAttribute("aCol", new THREE.Float32BufferAttribute(P_col, 4)); sg.setAttribute("aGl", new THREE.Float32BufferAttribute(P_gl, 1));
  const sm = noLine(new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false })), pts = lookOnly(new THREE.Points(sg, sm), -999), v2 = new THREE.Vector2();
  pts.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(v2); sm.uniforms.uPx.value = v2.y / 1920; };
  root.add(pts);
  return { grip: 0, apply() {} };
}

// ================================================================================================================ H2-H4 the globe
const GLOBE_VS = `uniform sampler2D uPlate; uniform float uLift; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; float h = texture2D(uPlate, uv).r * uLift; vec3 p = position * (1.0 + h * 0.06); vec4 mv = modelViewMatrix * vec4(p, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`;
const GLOBE_FS = `uniform sampler2D uMap; uniform sampler2D uLand; uniform sampler2D uLights; uniform sampler2D uCrack; uniform sampler2D uCloud;
uniform vec3 uKV; uniform vec3 uKc; uniform float uBelt; uniform float uChar; uniform float uCr; uniform float uFoam; uniform float uFoamW; uniform float uGlow; uniform float uGlowW;
uniform float uCl; uniform float uDryO; uniform vec3 uSeabed; uniform vec3 uDry; uniform vec3 uCharC; uniform vec3 uHalo; uniform vec3 uMid; uniform vec3 uCore; uniform vec3 uGlowC;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
${COMMON}
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(vV); float nl = dot(n, uKV);
  vec3 base = texture2D(uMap, vUv).rgb; float land = texture2D(uLand, vUv).r; float lat = (vUv.y - 0.5) * 180.0;
  float rag = 2.4 * sin(vUv.x * 61.8 + 2.0) + 1.6 * sin(vUv.x * 173.0 + lat * 0.3);
  float belt = (1.0 - smoothstep(uBelt - 3.2, uBelt + 3.2, abs(lat) + rag)) * step(0.01, uBelt);
  float lum = dot(base, vec3(0.3, 0.5, 0.2)); base = mix(base, uSeabed * clamp(0.75 + 2.2 * lum, 0.75, 1.3), (1.0 - land) * uDryO);   // 28 (r1): the ocean dries out as the air feeds the ring
  base = mix(base, uDry, belt * 0.85); base = mix(base, uCharC, belt * uChar);
  vec3 cr = texture2D(uCrack, vUv).rgb; vec3 m = clamp((cr + uCr - 1.0) * 5.0, 0.0, 1.0);
  base *= 1.0 - 0.6 * max(m.r * 0.65, max(m.g, m.b));
  vec3 emi = uHalo * m.r * 0.8; emi = mix(emi, uMid * 1.2, m.g); emi = mix(emi, uCore * 1.5, m.b);
  float day = smoothstep(-0.18, 0.04, nl); float lit = mix(0.10, band3(nl), day);
  vec3 col = base * lit * mix(vec3(0.55, 0.62, 1.0), uKc, day);
  col *= mix(vec3(1.0), vec3(1.22, 0.84, 0.58), exp(-pow((nl - 0.10) / 0.12, 2.0)) * 0.9);
  float ocean = (1.0 - land) * (1.0 - belt * 0.8) * (1.0 - uDryO); vec3 hv = normalize(uKV + v); float sp = dot(n, hv);
  col = mix(col, vec3(1.0, 0.95, 0.84), smoothstep(0.984, 0.991, sp) * ocean * 0.7 * day); col += vec3(1.0, 0.93, 0.8) * pow(max(sp, 0.0), 36.0) * 0.18 * ocean * day;
  float cs = texture2D(uCloud, vUv + vec2(0.0028, -0.0028)).a * uCl * (1.0 - belt); col *= 1.0 - 0.24 * cs * day;
  float ca = texture2D(uCloud, vUv).a * uCl;
  col += texture2D(uLights, vUv).rgb * (1.0 - smoothstep(-0.22, -0.02, nl)) * 1.7 * (1.0 - belt) * (1.0 - 0.75 * ca);
  col = mix(col, vec3(0.96, 0.98, 1.0), (1.0 - smoothstep(uFoamW * 0.5, uFoamW, abs(lat))) * uFoam * 0.85);
  col += uGlowC * exp(-pow(lat / max(uGlowW, 0.05), 2.0)) * uGlow * 1.5;
  gl_FragColor = vec4(col + emi, 1.0);
  #include <colorspace_fragment>
}`;
const CLOUD_FS = `uniform sampler2D uCloud; uniform vec3 uKV; uniform vec3 uKc; uniform float uBelt; uniform float uCl; uniform vec3 uShade; uniform vec3 uLitC; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
${COMMON}
void main(){ float a = texture2D(uCloud, vUv).a * uCl; float lat = (vUv.y - 0.5) * 180.0; float rag = 2.4 * sin(vUv.x * 61.8 + 2.0) + 1.6 * sin(vUv.x * 173.0 + lat * 0.3);
  float belt = (1.0 - smoothstep(uBelt - 3.2, uBelt + 3.2, abs(lat) + rag)) * step(0.01, uBelt); a *= 1.0 - belt * 0.94; if (a < 0.004) discard;
  vec3 n = normalize(vN); float nl = dot(n, uKV); float day = smoothstep(-0.18, 0.04, nl); float tone = (band3(nl) - 0.5) / 0.5;
  vec3 col = mix(uShade, uLitC, tone) * mix(vec3(0.16, 0.19, 0.34), uKc, day);
  col *= mix(vec3(1.0), vec3(1.2, 0.8, 0.6), exp(-pow((nl - 0.10) / 0.12, 2.0)) * 0.8);
  gl_FragColor = vec4(col, a); 
  #include <colorspace_fragment>
}`;
const AIR_VS = `varying vec3 vL; varying vec3 vNv; void main(){ vL = position; vNv = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const AIR_FS = `uniform vec3 uCam; uniform vec3 uKV; uniform float uGain; uniform float uStream; uniform vec3 uA1; uniform vec3 uA2; varying vec3 vL; varying vec3 vNv;
void main(){ vec3 rd = normalize(vL - uCam); float d = length(cross(uCam, rd));
  float a = smoothstep(0.913, 0.971, d) * (1.0 - smoothstep(0.971, 1.0, d)); float sunF = 0.45 + 0.55 * smoothstep(-0.3, 0.7, dot(normalize(vNv), uKV));
  float lat = asin(clamp(vL.y, -1.0, 1.0)); float stream = 1.0 - uStream * 0.65 * exp(-pow(lat / 0.16, 2.0));
  float al = a * 0.55 * sunF * uGain * stream; if (al < 0.003) discard;
  gl_FragColor = vec4(mix(uA1, uA2, smoothstep(0.95, 0.975, d)), al);
  #include <colorspace_fragment>
}`;
function bandTex() {
  return once("band", () => {
    const W = 2048, H = 512, [c, g] = cv(W, H), im = g.createImageData(W, H), d = im.data, C0 = rgb("#F4F8FA"), C1 = rgb("#CFE4F6"), C2 = rgb("#9FC8F0");
    for (let y = 0; y < H; y++) {
      const v = (y + 0.5) / H, base = v < 0.25 ? lerp(0.85, 0.6, v / 0.25) : v < 0.6 ? lerp(0.6, 0.28, (v - 0.25) / 0.35) : lerp(0.28, 0, sst(0.6, 1, v)), cm = v < 0.35 ? sst(0, 0.35, v) : 1, cn = sst(0.35, 0.8, v);
      for (let x = 0; x < W; x++) {
        const u = x / W, arm = fbm(u * 16 + v * 6, v * 10, 31, 4, 16), st = fbm(u * 140 + v * 20, v * 3, 47, 3, 140), grain = ih(x, y, 3) > 0.99 ? 0.5 : 0;
        const m = clamp((arm - 0.28) * 2.6, 0, 1) * (0.35 + 0.9 * st), a = clamp(base * (0.12 + 1.1 * m) + grain * base, 0, 1) * (v < 0.012 ? 1.5 : 1), o = (y * W + x) * 4, br = clamp((arm - 0.5) * 2);
        for (let k = 0; k < 3; k++) { const mm = v < 0.35 ? C0[k] + (C1[k] - C0[k]) * cm : C1[k] + (C2[k] - C1[k]) * cn; d[o + k] = mm + (C0[k] - mm) * br * 0.5; }
        d[o + 3] = a * 255;
      }
    }
    g.putImageData(im, 0, 0); return ctex(c, true);
  });
}
function earthKind(P_) {
  const S = P_.spec, O = S.origin ?? [80000, 0, 0], root = new THREE.Group(); root.position.set(...O); P_.whole.add(root);
  const E = earthAssets(), CL = cloudAssets(), CK = crackAssets();
  const roll = new THREE.Group(), tilt = new THREE.Group(), spinG = new THREE.Group(); root.add(roll); roll.add(tilt); tilt.add(spinG);
  const U = (v) => ({ value: v });
  const gu = { uMap: U(E.map), uLand: U(E.land), uLights: U(E.lights), uCrack: U(CK.crack), uCloud: U(CL.tex), uPlate: U(CK.plate), uKV: U(KEY.clone()), uKc: U(KGLOBE), uBelt: U(0), uCl: U(1), uDryO: U(0), uSeabed: U(lin("#7C6450")), uChar: U(0), uCr: U(0), uLift: U(0), uFoam: U(1), uFoamW: U(1.5), uGlow: U(0), uGlowW: U(0.7),
    uDry: U(lin("#6A5A4A")), uCharC: U(lin("#4A3A34")), uHalo: U(lin("#FF7A2A").multiplyScalar(0.9)), uMid: U(lin("#FFB13C")), uCore: U(lin("#FFF2B0")), uGlowC: U(lin("#FFD27A")) };
  const globe = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 56), noLine(new THREE.ShaderMaterial({ uniforms: gu, vertexShader: GLOBE_VS, fragmentShader: GLOBE_FS, fog: false }))), 0); spinG.add(globe);
  const cu = { uCloud: U(CL.tex), uKV: gu.uKV, uKc: U(KSOFT), uBelt: gu.uBelt, uCl: gu.uCl, uShade: U(lin("#8C9CC8")), uLitC: U(lin("#F6F7F8")) };
  const clouds = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), noLine(new THREE.ShaderMaterial({ uniforms: cu, vertexShader: GLOBE_VS.replace("uniform sampler2D uPlate; uniform float uLift;", "").replace("float h = texture2D(uPlate, uv).r * uLift; vec3 p = position * (1.0 + h * 0.06);", "vec3 p = position;"), fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, fog: false }))), 10); spinG.add(clouds);
  const au = { uCam: U(new THREE.Vector3(0, 0, 10)), uKV: gu.uKV, uGain: U(1), uStream: U(0), uA1: U(lin("#7FB6FF")), uA2: U(lin("#BFE0FF")) };
  const air = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), noLine(new THREE.ShaderMaterial({ uniforms: au, vertexShader: AIR_VS, fragmentShader: AIR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))), 20); tilt.add(air);
  air.onBeforeRender = (r, sc, camera) => { au.uCam.value.setFromMatrixPosition(camera.matrixWorld); air.worldToLocal(au.uCam.value); viewKey(gu.uKV.value, camera); };
  // the spray band: 3 annulus layers 1.2 apart (96 x 6 segments); the near half passes in front of the globe, the far half behind it (depth test)
  const bt = bandTex(), layers = [1.3, 1.0, 0.7].map((f, k) => { const m = annulusMat(bt, { edge: 1 }), me = lookOnly(new THREE.Mesh(annulusGeo(96, 6), m), 30 + k); tilt.add(me); return { f, m, me, y: (k - 1) * 2.4 }; });
  layers[0].me.onBeforeRender = (r, sc, camera) => { for (const l of layers) viewKey(l.m.uniforms.uKV.value, camera); };
  const puffs = makeSprites(tilt, 330, { kind: "PUFF", order: 40 }), glints = makeSprites(tilt, 64, { kind: "GLINT", add: true, order: 50, sort: false }), rocks = makeRocks(tilt, 90, 35);
  const wh = [lin("#B4D2F0"), lin("#DCEBFA"), lin("#FFFFFF")], dc = [lin("#4A4048"), lin("#8A7A6E"), lin("#C9B8A6")], gl = [lin("#FFF2C4"), lin("#FFD27A")];
  const R0 = rngOf(SEED + 91), bill = [], dust = [], rk = [];
  for (let i = 0; i < 96; i++) bill.push({ a: R0() * TAU, rf: R0() ** 1.3, y: (R0() - 0.5) * 6, sz: 9 + 12 * R0(), sd: R0(), al: 0.55 + 0.3 * R0() });
  for (let j = 0; j < 26; j++) dust.push({ limb: j % 2, da: (R0() - 0.5) * 0.95, ph: R0(), sp: 0.55 + 0.8 * R0(), up: j % 5 === 4 ? -0.6 : 1, sub: Array.from({ length: 5 }, () => [R0() - 0.5, R0() - 0.5, 0.6 + 0.8 * R0(), R0()]) });
  for (let i = 0; i < 90; i++) rk.push({ t0: 66.2 + 6.3 * R0(), a: R0() * TAU, rEnd: 215 + 115 * R0(), v: 12 + 18 * R0(), sz: 1 + 5 * R0() ** 1.5, ax: [R0() - 0.5, R0() - 0.5, R0() - 0.5], tr: 1 + 3 * R0(), y: (R0() - 0.5) * 3, glow: R0() < 0.3 ? 1 + Math.floor(R0() * 20) : 0, sd: R0() });
  const plume = []; for (let i = 0; i < 80; i++) plume.push({ a: R0() * TAU, rf: 0.2 + 0.8 * R0(), y: (R0() - 0.5) * 2, sz: R0(), al: 0.3 + 0.28 * R0(), sd: R0() });
  const skewG = (a) => 0.61 + 0.78 * (0.5 + 0.5 * Math.cos(a));
  const orbit = (r) => (r < 252 ? 34 : r < 294 ? 26 : 19);
  const glint = []; for (let i = 0; i < 60; i++) glint.push({ a: R0() * TAU, rf: R0() ** 0.8, y: (R0() - 0.5) * 5, sz: 2.4 + 2.4 * R0(), ph: R0() * 40 });
  return {
    grip: 0,
    stats: { puffs: 226, glints: 60, rocks: 90 },
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t < DISC_CUT; root.visible = on; if (!on) return;
      const tc = Math.max(t, 60), pl = peelOf(t), sq = squashOf(t), cr = cracksOf(t), tau = tc - 60, Et = 28 * tau + 1.275 * tau * tau, L = (S.lon0 ?? -62) - Et;
      const rE = k3(100, 132, 168, sq), rP = k3(100, 51, 9, sq), fadeOut = 1 - sst(67, 70.5, t);
      spinG.rotation.y = (-90 - L) * DEG; roll.rotation.z = (S.roll0 ?? 12) * (1 - sst(0, 1, P(tc, 60, 68))) * DEG; tilt.rotation.x = keys(tc, [[60, S.lat0 ?? -8], [66, -2], [69, S.lensTilt ?? 10]]) * DEG;
      globe.scale.set(rE, rP, rE); clouds.scale.set(rE * 1.012, rP * 1.012, rE * 1.012); air.scale.set(rE * 1.03, rP * 1.03, rE * 1.03);
      CL.draw(1 + 0.25 * (spinOf(tc) - 18));
      gu.uCl.value = 1 - 0.97 * sst(60.5, 66, t); gu.uDryO.value = 0.94 * sst(60.5, 66.5, t); clouds.visible = gu.uCl.value > 0.01;   // 28 (r1): the cloud bands + hurricanes and the blue ocean are gone by ~66 s
      gu.uBelt.value = keys(pl, [[0, 0], [0.5, 6], [1, 14]]) + 16 * sst(0.2, 0.9, sq); gu.uChar.value = sst(0, 0.7, cr); gu.uCr.value = cr; gu.uLift.value = sst(0.6, 1, cr);
      gu.uFoam.value = 1 - sst(0, 0.25, pl); gu.uGlow.value = sst(0, 0.08, pl) * (0.25 + 0.75 * fadeOut); gu.uGlowW.value = keys(pl, [[0, 0.1], [0.5, 0.69], [1, 1.15]]);
      au.uGain.value = keys(pl, [[0, 1], [0.5, 0.65], [1, 0.35]]); au.uStream.value = sst(0, 0.5, pl);
      const rOut = rE + keys(pl, [[0, 3], [0.5, 50], [1, 140]]), ba = (0.55 + 0.45 * sst(0, 0.3, pl)) * fadeOut;
      layers.forEach((l) => { const u = l.m.uniforms; u.uR0.value = rE; u.uR1.value = rOut; u.uY.value = l.y * rE / 100; u.uOff.value = (l.f * Et) / 360; u.uAlpha.value = ba * (l.f === 1 ? 0.8 : 0.7); u.uSkew.value = 0.78; l.me.visible = ba > 0.004; });
      // sprites: 96 billows over the inner 30 of the band, then the dust of P16
      puffs.reset(); glints.reset(); rocks.reset();
      const ramp = sst(0.02, 0.4, pl) * fadeOut;
      for (const b of bill) { const a0 = b.a - 1.15 * Et * DEG, r = rE + 2 + b.rf * 28 * (0.6 + 0.8 * sst(0, 1, pl)) * skewG(a0), a = a0 + 0.006 * (r - rE), sz = b.sz * rE / 100 * (0.7 + 0.5 * pl); puffs.put(r * Math.cos(a), b.y * rE / 100, r * Math.sin(a), sz, sz * 0.78, b.sd * TAU, b.al * ramp, b.sd, wh[0], wh[1], wh[2]); }
      for (const p of plume) { const a0 = p.a - 1.05 * Et * DEG, r = rE + 14 + p.rf * (rOut - rE) * skewG(a0) * 0.92, a = a0 + 0.005 * (r - rE), sz = (20 + 44 * p.sz) * (rE / 100) * (0.4 + 0.8 * pl); puffs.put(r * Math.cos(a), p.y * (4 + (r - rE) * 0.14), r * Math.sin(a), sz, sz * 0.7, p.sd * TAU, p.al * ramp * (1 - 0.4 * p.rf), p.sd, wh[0], wh[1], wh[2]); }
      const DU = sst(66.2, 68.8, t) * (1 - sst(72.2, 73.3, t) * 0.3);
      if (DU > 0.003) for (let j = 0; j < dust.length; j++) { const D = dust[j], u = fr((t - 66.2) / (4.2 / D.sp) + D.ph), bell = Math.sin(Math.PI * u) ** 0.8;
        for (const [ox, oy, sk, sd] of D.sub) { const size = lerp(14, 92, u ** 0.8) * sk, r = rE + u * 34 * (0.6 + D.ph) + ox * size * 0.5, a = D.limb * Math.PI + D.da + 0.35 * u * (D.limb ? 1 : -1) * 0 + 0.3 * u, y = D.up * (u * 62 * (0.5 + D.ph) + 2) + oy * size * 0.4; puffs.put(r * Math.cos(a), y, r * Math.sin(a), size, size * 0.85, sd * TAU, DU * bell * 0.88, sd, dc[0], dc[1], dc[2]); } }
      puffs.commit();
      for (const g of glint) { const ga = g.a - 1.1 * Et * DEG, r = rE + 3 + g.rf * (rOut - rE) * 0.8 * skewG(ga), a = ga + 0.004 * (r - rE), tw = 0.5 + 0.5 * Math.sin(t * 9 + g.ph); glints.put(r * Math.cos(a), g.y, r * Math.sin(a), g.sz * rE / 100, g.sz * rE / 100, 0, ramp * (0.35 + 0.65 * tw), g.ph, gl[0], gl[1], gl[1]); }
      glints.commit();
      for (const q of rk) { const age = t - q.t0; if (age <= 0) continue; const r0 = rE * 1.01, k = q.v / Math.max(q.rEnd - r0, 20), r = q.rEnd - (q.rEnd - r0) * Math.exp(-age * k), a = q.a - orbit(q.rEnd) * DEG * age * 0.9; rocks.put(r * Math.cos(a), q.y * (0.4 + age * 0.5), r * Math.sin(a), q.sz * Math.min(1, age * 3), q.ax[0], q.ax[1], q.ax[2], q.tr * age, q.sd, q.glow); }
      rocks.commit();
    },
  };
}

// ================================================================================================================ H5 the flat disc and its ring
const LIT_VS = `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LIT_FS = `uniform sampler2D uMap; uniform vec3 uKV; uniform vec3 uKc; uniform float uAmb; uniform float uGlowK; varying vec2 vUv; varying vec3 vN;
${COMMON}
void main(){ vec4 t = texture2D(uMap, vUv); if (t.a < 0.01) discard; vec3 n = normalize(vN); float nl = dot(n, uKV); float lit = uAmb + (1.0 - uAmb) * band3(nl);
  float glow = clamp((t.r - t.b * 1.5 - 0.28) * 3.0, 0.0, 1.0) * uGlowK; vec3 col = t.rgb * lit * uKc; col = mix(col, t.rgb * 1.35, glow); col += vec3(1.0, 0.45, 0.12) * 0.03 * (1.0 - max(nl, 0.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
function litMat(map, amb, glowK) { return noLine(new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uKV: { value: KEY.clone() }, uKc: { value: KSOFT }, uAmb: { value: amb }, uGlowK: { value: glowK } }, vertexShader: LIT_VS, fragmentShader: LIT_FS, fog: false })); }
const ARC_VS = `attribute vec3 aP; attribute vec3 aArc; uniform float uT; uniform float uY; varying float vA;
void main(){ float ang = aArc.x - aArc.y * uT * 0.0174533 + aP.y; float r = aP.x; vec3 p = vec3(cos(ang) * r, uY, sin(ang) * r); vA = aArc.z * sin(3.14159 * clamp(aP.z, 0.0, 1.0)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const ARC_FS = `uniform vec3 uCol; varying float vA; void main(){ if (vA < 0.004) discard; gl_FragColor = vec4(uCol, vA);\n#include <colorspace_fragment>\n}`;
function discAssets() {
  return once("disc", () => {
    const N = 2048, [topC, tg] = cv(N, N), [rimC, rg] = cv(2048, 256), [underC, ug] = cv(1024, 1024), [ringC, kg] = cv(2048, 256), A = {};
    const edge = 1 - 6 / 168, R = rngOf(SEED + 131), WF = []; for (let i = 0; i < 14; i++) WF.push(((i + 0.2 + 0.6 * ih(i, 1, 21)) / 14) * TAU);
    A.waterfalls = WF; A.edge = edge;
    A.paintTop = (E) => {
      const src = E.mapC.getContext("2d").getImageData(0, 0, 2048, 1024).data, lsrc = E.landC.getContext("2d").getImageData(0, 0, 2048, 1024).data, im = tg.createImageData(N, N), d = im.data;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const dx = (x + 0.5 - 1024) / 1024, dy = (y + 0.5 - 1024) / 1024, rr = Math.hypot(dx, dy); if (rr > edge) continue;
        const lon = (((Math.atan2(-dy, dx) / DEG - 90 + 540) % 360) + 360) % 360 - 180, lat = 90 - (rr / edge) * 155, sx = Math.min(2047, Math.floor(((lon + 180) / 360) * 2048)), sy = Math.min(1023, Math.floor(((90 - lat) / 180) * 1024)), o = (y * N + x) * 4, so = (sy * 2048 + sx) * 4;
        let cr = src[so], cg = src[so + 1], cb = src[so + 2];
        const wet = lsrc[so] < 128, n1 = fbm(dx * 3.2 + 9, dy * 3.2 + 4, 81, 3), k = 0.8 + 0.4 * n1;
        if (wet) { cr = 124 * k; cg = 98 * k; cb = 76 * k; }                                   // 28 (r1): the sea is gone, bare seabed
        else { const l = 0.3 * cr + 0.5 * cg + 0.2 * cb; cr = cr * 0.35 + (150 + 0.25 * l) * 0.65 * k; cg = cg * 0.35 + (124 + 0.2 * l) * 0.65 * k; cb = cb * 0.35 + (88 + 0.1 * l) * 0.65 * k; }   // land baked dry
        const crk = fbm(dx * 7 + 2.3, dy * 7 + 5.1, 83, 3), cw = 1 - sst(0.0, wet ? 0.03 : 0.022, Math.abs(crk - 0.5));   // the crack web
        const cm = cw * (wet ? 0.85 : 0.6); cr = cr * (1 - cm) + 42 * cm; cg = cg * (1 - cm) + 28 * cm; cb = cb * (1 - cm) + 24 * cm;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = 255;
      }
      tg.putImageData(im, 0, 0);
      tg.lineCap = "round"; for (let i = 0; i < 90; i++) { const rr = (0.12 + 0.82 * R()) * 1024, a0 = R() * TAU, ln = (0.12 + 0.6 * R()) * (1.4 - rr / 1024); tg.strokeStyle = `rgba(196,172,148,${0.10 + 0.12 * R()})`; tg.lineWidth = 2 + 5 * R(); tg.beginPath(); tg.arc(1024, 1024, rr, a0, a0 + ln); tg.stroke(); }
      // the ice wall: Antarctica round the whole edge, 6 wide, blue shade on the inside, 48 buttresses, gaps where 14 waterfalls go over
      const ro = 1024, ri = edge * 1024; tg.fillStyle = "#F4F6F8"; tg.beginPath(); tg.arc(1024, 1024, ro, 0, TAU); tg.arc(1024, 1024, ri, 0, TAU, true); tg.fill();
      const gr = tg.createRadialGradient(1024, 1024, ri - 9, 1024, 1024, ri + 14); gr.addColorStop(0, "rgba(185,210,232,0)"); gr.addColorStop(0.5, "rgba(185,210,232,0.9)"); gr.addColorStop(1, "rgba(185,210,232,0)"); tg.fillStyle = gr; tg.beginPath(); tg.arc(1024, 1024, ri + 14, 0, TAU); tg.arc(1024, 1024, ri - 9, 0, TAU, true); tg.fill();
      for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU + (R() - 0.5) * 0.04, w = 0.022 + 0.02 * R(), depth = 12 + 22 * R(); tg.fillStyle = "#F4F6F8"; tg.beginPath(); tg.moveTo(1024 + Math.cos(a - w) * (ri + 6), 1024 + Math.sin(a - w) * (ri + 6)); tg.lineTo(1024 + Math.cos(a - w * 0.3) * (ri - depth), 1024 + Math.sin(a - w * 0.3) * (ri - depth)); tg.lineTo(1024 + Math.cos(a + w * 0.3) * (ri - depth), 1024 + Math.sin(a + w * 0.3) * (ri - depth)); tg.lineTo(1024 + Math.cos(a + w) * (ri + 6), 1024 + Math.sin(a + w) * (ri + 6)); tg.closePath(); tg.fill(); tg.fillStyle = "rgba(185,210,232,0.7)"; tg.beginPath(); tg.moveTo(1024 + Math.cos(a + w) * (ri + 6), 1024 + Math.sin(a + w) * (ri + 6)); tg.lineTo(1024 + Math.cos(a + w * 0.3) * (ri - depth), 1024 + Math.sin(a + w * 0.3) * (ri - depth)); tg.lineTo(1024 + Math.cos(a + w * 0.3) * (ri - depth + 5), 1024 + Math.sin(a + w * 0.3) * (ri - depth + 5)); tg.closePath(); tg.fill(); }
      for (let i = 0; i < 220; i++) { const a = R() * TAU, r0 = ri - 4 + R() * 40; tg.strokeStyle = `rgba(150,185,215,${0.25 + 0.3 * R()})`; tg.lineWidth = 1; tg.beginPath(); tg.moveTo(1024 + Math.cos(a) * r0, 1024 + Math.sin(a) * r0); tg.lineTo(1024 + Math.cos(a + (R() - 0.5) * 0.02) * (r0 + 6 + 14 * R()), 1024 + Math.sin(a + (R() - 0.5) * 0.02) * (r0 + 6 + 14 * R())); tg.stroke(); }
      for (const a of WF) { tg.fillStyle = "#3A2C26"; tg.beginPath(); tg.moveTo(1024 + Math.cos(a - 0.012) * (ri - 30), 1024 + Math.sin(a - 0.012) * (ri - 30)); tg.lineTo(1024 + Math.cos(a - 0.012) * ro, 1024 + Math.sin(a - 0.012) * ro); tg.lineTo(1024 + Math.cos(a + 0.012) * ro, 1024 + Math.sin(a + 0.012) * ro); tg.lineTo(1024 + Math.cos(a + 0.012) * (ri - 30), 1024 + Math.sin(a + 0.012) * (ri - 30)); tg.closePath(); tg.fill(); tg.strokeStyle = "rgba(246,250,252,0.9)"; tg.lineWidth = 3; tg.beginPath(); tg.moveTo(1024 + Math.cos(a) * (ri - 50), 1024 + Math.sin(a) * (ri - 50)); tg.lineTo(1024 + Math.cos(a) * ro, 1024 + Math.sin(a) * ro); tg.stroke(); }
      A.top.needsUpdate = true;
    };
    // rim 2048 x 256: soil, 8 strata, a fracture every 4-9 deg, the lower third glowing, 24 lava drips
    rg.fillStyle = "#6A5548"; rg.fillRect(0, 0, 2048, 256);
    for (let k = 0; k < 8; k++) { const y0 = 26 + k * 18; rg.fillStyle = k % 2 ? "#5E4A40" : "#4A3F3C"; rg.beginPath(); rg.moveTo(0, y0); for (let x = 0; x <= 2048; x += 8) rg.lineTo(x, y0 + 3.5 * Math.sin((x / 2048) * TAU * (3 + k) + k) + 3 * (fbm(x * 0.03, k * 3.7, 3, 2, 0) - 0.5)); rg.lineTo(2048, 256); rg.lineTo(0, 256); rg.closePath(); rg.fill(); }
    for (let i = 0; i < 140; i++) { rg.fillStyle = `rgba(30,22,24,${0.2 + 0.25 * R()})`; rg.fillRect(R() * 2048, 30 + R() * 130, 4 + 18 * R(), 1 + 2 * R()); }
    const gg = rg.createLinearGradient(0, 168, 0, 256); gg.addColorStop(0, "rgba(224,72,30,0)"); gg.addColorStop(0.35, "rgb(224,72,30)"); gg.addColorStop(1, "rgb(255,177,60)"); rg.fillStyle = gg; rg.fillRect(0, 168, 2048, 88);
    for (let x = 0; x < 2048; x += 23 + R() * 28) { rg.strokeStyle = "#1E1618"; rg.lineWidth = 2 + R() * 1.5; rg.beginPath(); let xx = x; rg.moveTo(xx, 26); for (let y = 26; y < 256; y += 18) { xx += (R() - 0.5) * 7; rg.lineTo(xx, y + 18); } rg.stroke(); rg.strokeStyle = "rgba(255,177,60,0.9)"; rg.lineWidth = 1.6; rg.beginPath(); xx = x; rg.moveTo(xx, 190); for (let y = 190; y < 256; y += 14) { xx += (R() - 0.5) * 6; rg.lineTo(xx, y + 14); } rg.stroke(); }
    for (let i = 0; i < 24; i++) { const x = (i + R() * 0.8) * (2048 / 24), y0 = 150 + 30 * R(), ln = 28 + 84 * R(), w = 5 + 5 * R(), g2 = rg.createLinearGradient(0, y0, 0, y0 + ln); g2.addColorStop(0, "rgba(255,177,60,1)"); g2.addColorStop(0.6, "rgba(224,72,30,1)"); g2.addColorStop(1, "rgba(60,22,16,1)"); rg.fillStyle = g2; rg.beginPath(); rg.moveTo(x - w, y0); rg.lineTo(x + w, y0); rg.lineTo(x + w * 0.4, y0 + ln * 0.85); rg.arc(x, y0 + ln * 0.88, w * 0.4, 0, Math.PI); rg.lineTo(x - w * 0.4, y0 + ln * 0.85); rg.closePath(); rg.fill(); }
    // underside 1024^2: dark stone, a glowing crack web
    ug.fillStyle = "#2E2628"; ug.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 260; i++) { ug.fillStyle = `rgba(${R() < 0.5 ? "60,48,50" : "20,14,16"},${0.12 + 0.2 * R()})`; ug.beginPath(); ug.arc(R() * 1024, R() * 1024, 6 + 40 * R(), 0, TAU); ug.fill(); }
    ug.lineCap = "round"; for (const [w, col] of [[7, "#E0481E"], [3.2, "#FFB13C"], [1.2, "#FFF2B0"]]) { const Rr = rngOf(SEED + 133); ug.strokeStyle = col; ug.lineWidth = w; for (let i = 0; i < 46; i++) { let x = 512 + (Rr() - 0.5) * 80, y = 512 + (Rr() - 0.5) * 80, a = Rr() * TAU; ug.beginPath(); ug.moveTo(x, y); for (let k = 0; k < 9; k++) { a += (Rr() - 0.5) * 0.9; x += Math.cos(a) * 52; y += Math.sin(a) * 52; ug.lineTo(x, y); } ug.stroke(); } }
    // ring 2048 x 256 (angle x radius 215..330): 3 bands, 5 gaps, 2,600 grains, 40 spokes
    const vOf = (r) => ((r - 215) / 115) * 256, BANDS = [[215, 248, "#C9A46A", 0.8], [254, 290, "#A8845A", 0.55], [298, 330, "#8A7A6E", 0.3]], GAPS = [[226, 0.9], [270, 1.2], [314, 0.9]];
    const inBand = (r) => { for (const [a, b] of BANDS) if (r >= a && r <= b) { for (const [gr2, w] of GAPS) if (Math.abs(r - gr2) < w / 2) return false; return true; } return false; };
    { const ri = kg.createImageData(2048, 256), rd = ri.data;
      for (let y = 0; y < 256; y++) {
        const r = 215 + (115 * (y + 0.5)) / 256; let bi = -1; BANDS.forEach(([a, b], i) => { if (r >= a && r <= b) bi = i; }); if (bi < 0) continue;
        let gap = 1; for (const [gr2, w] of GAPS) gap = Math.min(gap, sst(w * 0.25, w * 0.6, Math.abs(r - gr2))); const col = rgb(BANDS[bi][2]), a0 = BANDS[bi][3] * gap, edge = sst(0, 2.2, r - BANDS[bi][0]) * sst(0, 2.2, BANDS[bi][1] - r);
        for (let x = 0; x < 2048; x++) { const u = x / 2048, st = fbm(u * 420 + y * 0.3, y * 0.55, 61 + bi, 3, 420), bl = fbm(u * 34, y * 0.2, 71 + bi, 3, 34), a = clamp(a0 * edge * clamp((bl - 0.22) * 3.2, 0, 1) * (0.35 + 1.0 * st), 0, 1), k = 0.8 + 0.5 * st, o = (y * 2048 + x) * 4; rd[o] = col[0] * k; rd[o + 1] = col[1] * k; rd[o + 2] = col[2] * k; rd[o + 3] = a * 255; }
      }
      kg.putImageData(ri, 0, 0); }
    for (let i = 0; i < 6200; i++) { let r; do { r = 215 + 115 * R(); } while (!inBand(r)); const x = R() * 2048, y = vOf(r), k = R(), sz = 1 + 3 * R() ** 2; kg.globalAlpha = 0.5 + 0.45 * R(); kg.fillStyle = k < 0.09 ? "#FFE2A9" : k < 0.14 ? "#FF9A3C" : R() < 0.5 ? "#E8CC96" : "#5A4A3A"; kg.beginPath(); kg.arc(x, y, sz * (k < 0.09 ? 0.85 : 0.62), 0, TAU); kg.fill(); if (k < 0.09) { kg.globalAlpha = 0.35; kg.fillRect(x - sz * 2.4, y - 0.4, sz * 4.8, 0.8); } }
    kg.globalAlpha = 1; for (let i = 0; i < 40; i++) { const x = R() * 2048; kg.fillStyle = R() < 0.5 ? "rgba(40,30,24,0.10)" : "rgba(255,226,169,0.08)"; kg.fillRect(x, 0, 1.5 + 3 * R(), 256); }
    A.top = new THREE.CanvasTexture(topC); A.top.colorSpace = THREE.SRGBColorSpace; A.top.generateMipmaps = true; A.top.minFilter = THREE.LinearMipmapLinearFilter; A.top.anisotropy = 4;
    A.rim = ctex(rimC, true); A.under = ctex(underC, true, false); A.ring = ctex(ringC, true);
    return A;
  });
}
function discKind(P_) {
  const S = P_.spec, O = S.origin ?? [80000, 0, 0], root = new THREE.Group(); root.position.set(...O); P_.whole.add(root);
  const E = earthAssets(), D = discAssets(), prev = E.onReady; E.onReady = () => { prev?.(); D.paintTop(E); };
  const R = 168, TH = 9, NSEG = 96, EPS = S.eps ?? 17, ROLL = S.roll ?? 13, EPSR = S.epsRing ?? 24, ROLLR = S.rollRing ?? 18;
  const qOf = (roll, eps) => new THREE.Quaternion().setFromEuler(new THREE.Euler(eps * DEG, 0, roll * DEG, "ZXY"));
  const discG = new THREE.Group(), spinG = new THREE.Group(), ringG = new THREE.Group(); root.add(discG, ringG); discG.add(spinG);
  // geometry: top fan, underside fan, rim band
  const fan = (y, up) => { const pos = [0, y, 0], uv = [0.5, 0.5], nor = [0, up, 0], idx = []; for (let i = 0; i <= NSEG; i++) { const a = (i / NSEG) * TAU; pos.push(Math.cos(a) * R, y, Math.sin(a) * R); uv.push(0.5 + Math.cos(a) * 0.5, 0.5 - Math.sin(a) * 0.5 * (up > 0 ? 1 : -1)); nor.push(0, up, 0); if (i < NSEG) idx.push(0, up > 0 ? i + 2 : i + 1, up > 0 ? i + 1 : i + 2); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; };
  const rimG = (() => { const pos = [], uv = [], nor = [], idx = [], N = 192; for (let i = 0; i <= N; i++) { const a = (i / N) * TAU, c = Math.cos(a), s = Math.sin(a); pos.push(c * R, TH, s * R, c * R, -TH, s * R); uv.push(i / N, 1, i / N, 0); nor.push(c, 0, s, c, 0, s); if (i < N) { const a0 = i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 2, a0 + 1, a0 + 3); } } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; })();
  const mTop = litMat(D.top, 0.55, 0), mRim = litMat(D.rim, 0.42, 1), mUnd = litMat(D.under, 0.5, 1), top = lookOnly(new THREE.Mesh(fan(TH, 1), mTop), 0), und = lookOnly(new THREE.Mesh(fan(-TH, -1), mUnd), 0), rim = lookOnly(new THREE.Mesh(rimG, mRim), 0);
  mRim.side = THREE.DoubleSide; spinG.add(top, und, rim);
  // 14 waterfalls over the rim: ribbons 1-3 wide, 20 long, ending in mist
  const wfGeo = (() => { const pos = [], uv = [], idx = []; D.waterfalls.forEach((a, i) => { const w = 2 + 3 * ih(i, 2, 22), c = Math.cos(a), s = Math.sin(a), tx = -s, tz = c, b = pos.length / 3; const pts = [[R - 12, TH + 0.25, 0], [R + 0.4, TH + 0.25, 0], [R + 1.2, TH - 4, 0], [R + 3, -TH - 6, 0], [R + 3.8, -TH - 20, 0]]; pts.forEach(([rr, yy], k) => { const ww = w * (1 - 0.15 * (k / 4)); pos.push(c * rr - tx * ww / 2, yy, s * rr - tz * ww / 2, c * rr + tx * ww / 2, yy, s * rr + tz * ww / 2); uv.push(0, k / 4, 1, k / 4); if (k) { const q = b + (k - 1) * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); } }); }); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; })();
  const wfm = noLine(new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: `varying vec2 vUv; void main(){ float a = (1.0 - smoothstep(0.3, 1.0, vUv.y)) * (0.35 + 0.65 * abs(sin(vUv.y * 40.0 + vUv.x * 3.0))) * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.1, vUv.y) ; gl_FragColor = vec4(vec3(0.82, 0.92, 1.0), a * 0.8);\n#include <colorspace_fragment>\n}`, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const falls = lookOnly(new THREE.Mesh(wfGeo, wfm), 6); spinG.add(falls);
  const mist = makeSprites(spinG, 14, { kind: "PUFF", order: 8 }), mc = [lin("#9FC8F0"), lin("#CFE4F6"), lin("#F4F8FA")];
  // the ring: 3 bands as annuli in a plane tilted off the disc; 3 layers turn 34 / 26 / 19 deg per second
  const RB = [[215, 248, 34], [254, 290, 26], [298, 330, 19]], rl = RB.map(([r0, r1, w], k) => { const m = annulusMat(D.ring, { v0: (r0 - 215) / 115, v1: (r1 - 215) / 115 }), me = lookOnly(new THREE.Mesh(annulusGeo(192, 4), m), 12 + k); m.uniforms.uR0.value = r0; m.uniforms.uR1.value = r1; m.uniforms.uY.value = (k - 1) * 0.5; ringG.add(me); return { m, me, w }; });
  rl[0].me.onBeforeRender = (r, sc, camera) => { for (const l of rl) viewKey(l.m.uniforms.uKV.value, camera); };
  const glows = makeSprites(ringG, 48, { kind: "GLOW", add: true, order: 16, sort: false }), gcol = [lin("#FFB13C"), lin("#FF7A2A")];
  const rglint = makeSprites(ringG, 40, { kind: "GLINT", add: true, order: 17, sort: false }), gwh = lin("#FFE2A9");
  const Rg = rngOf(SEED + 151), gl = [], gg = []; for (let i = 0; i < 40; i++) gg.push({ a: Rg() * TAU, r: 216 + 113 * Rg(), sz: 3 + 4 * Rg(), ph: Rg() * 40 }); for (let i = 0; i < 48; i++) gl.push({ a: Rg() * TAU, r: 216 + 32 * Rg(), sz: 8 + 6 * Rg(), al: 0.2 + 0.1 * Rg() });
  const arcs = (() => { const pos = [], arc = [], idx = [], Ra = rngOf(SEED + 161), SEG = 20; for (let i = 0; i < 30; i++) { const r = 218 + 108 * Ra(), len = (8 + 17 * Ra()) * DEG, a0 = Ra() * TAU, sp = r < 252 ? 34 : r < 294 ? 26 : 19, b = pos.length / 3; for (let k = 0; k <= SEG; k++) for (const side of [-1, 1]) { pos.push(r + side * 0.45, (k / SEG) * len, k / SEG); arc.push(a0, sp, 0.6); } for (let k = 0; k < SEG; k++) { const q = b + k * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); } } const g = new THREE.BufferGeometry(); g.setAttribute("aP", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3)); g.setAttribute("aArc", new THREE.Float32BufferAttribute(arc, 3)); g.setIndex(idx); return g; })();
  const arcM = noLine(new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uY: { value: 0.3 }, uCol: { value: lin("#FFE2A9") } }, vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); ringG.add(lookOnly(new THREE.Mesh(arcs, arcM), 18));
  // rocks: 160 orbiting, 12 hero (glowing cracked face), 36 shed from the rim (12 a second), 8 chunks between the lens and Spud
  const rocks = makeRocks(root, 216, 22), Rr = rngOf(SEED + 171), orb = [], hero = [], shed = [], chunks = [];
  for (let i = 0; i < 160; i++) orb.push({ a: Rr() * TAU, r: 216 + 113 * Rr(), y: (Rr() - 0.5) * 4, sz: 0.8 + 6.2 * Rr() ** 2.2, ax: [Rr() - 0.5, Rr() - 0.5, Rr() - 0.5], tr: 0.3 + 1.4 * Rr(), sd: Rr(), glow: Rr() < 0.08 ? 1 + Math.floor(Rr() * 20) : 0 });
  for (let i = 0; i < 12; i++) hero.push({ a: (i / 12) * TAU + Rr() * 0.4, r: 222 + 100 * Rr(), y: (Rr() - 0.5) * 5, sz: 6 + 8 * Rr(), ax: [Rr() - 0.5, Rr() - 0.5, Rr() - 0.5], tr: 0.2 + 0.6 * Rr(), sd: Rr(), glow: 1 + Math.floor(Rr() * 20) });
  for (let j = 0; j < 36; j++) shed.push({ j, sd: ih(j, 0, 51) });
  const CAMP = S.chunkCam ?? [-8.8, -88.3, 1165], CH = [[150, 1250, 520, 66, 1], [950, 1240, 430, 84, 0], [330, 1560, 300, 44, 1], [900, 1610, 640, 74, 0], [440, 1170, 780, 52, 1], [780, 1190, 560, 60, 0], [110, 1700, 380, 90, 0], [985, 1470, 350, 50, 1]];
  CH.forEach(([sx, sy, d, px, gl2], i) => chunks.push({ pos: [CAMP[0] + ((sx - 540) * d) / 2637.7, CAMP[1] - ((sy - 960) * d) / 2637.7, CAMP[2] - d], sz: (px * d) / 2637.7 / 2, v: [(Rr() - 0.5) * 10, (Rr() - 0.5) * 6, (Rr() - 0.5) * 6], ax: [Rr() - 0.5, Rr() - 0.5, Rr() - 0.5], tr: 0.3 + 0.5 * Rr(), sd: Rr(), glow: gl2 ? 1 + Math.floor(Rr() * 20) : 0 }));
  const qD = new THREE.Quaternion(), qR = qOf(ROLLR, EPSR), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  return {
    grip: 0,
    stats: { rocks: 216, glowSprites: 48, arcs: 30, waterfalls: 14, mist: 14 },
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t >= DISC_CUT; root.visible = on; if (!on) return;
      const tau = t - DISC_CUT, wob = 2.5 * Math.sin(TAU * 0.4 * tau);
      qD.setFromEuler(new THREE.Euler((EPS + wob) * DEG, 0, (ROLL + 0.6 * wob) * DEG, "ZXY")); discG.quaternion.copy(qD); ringG.quaternion.copy(qR); spinG.rotation.y = 50 * tau * DEG;
      for (const l of rl) { l.m.uniforms.uOff.value = (l.w * tau) / 360; }
      arcM.uniforms.uT.value = tau;
      glows.reset(); for (const g of gl) { const a = g.a - 34 * tau * DEG; glows.put(Math.cos(a) * g.r, 0.2, Math.sin(a) * g.r, g.sz, g.sz, 0, g.al, g.a, gcol[0], gcol[1], gcol[1]); } glows.commit();
      rglint.reset(); for (const g of gg) { const a = g.a - (g.r < 252 ? 34 : g.r < 294 ? 26 : 19) * tau * DEG, tw = 0.5 + 0.5 * Math.sin(tau * 8 + g.ph); rglint.put(Math.cos(a) * g.r, 0.4, Math.sin(a) * g.r, g.sz, g.sz, 0, 0.35 + 0.65 * tw, g.ph, gwh, gwh, gwh); } rglint.commit();
      mist.reset(); D.waterfalls.forEach((a, i) => { for (let k = 0; k < 2; k++) { const u = fr(tau * 0.6 + ih(i, k, 61)), sz = lerp(3, 9, u); mist.put(Math.cos(a) * (R + 3.8 + 2 * u), -TH - 20 - 3 * u, Math.sin(a) * (R + 3.8 + 2 * u), sz, sz * 0.8, u * 3, 0.55 * Math.sin(Math.PI * u), ih(i, k, 62), mc[0], mc[1], mc[2]); } }); mist.commit();
      rocks.reset();
      const orbitPos = (a0, r, y, w, out) => { const a = a0 - w * DEG * tau; return out.set(Math.cos(a) * r, y, Math.sin(a) * r).applyQuaternion(qR); };
      for (const q of orb) { orbitPos(q.a, q.r, q.y, q.r < 252 ? 34 : q.r < 294 ? 26 : 19, v1); rocks.put(v1.x, v1.y, v1.z, q.sz, q.ax[0], q.ax[1], q.ax[2], q.tr * tau, q.sd, q.glow); }
      for (const q of hero) { orbitPos(q.a, q.r, q.y, q.r < 252 ? 34 : q.r < 294 ? 26 : 19, v1); rocks.put(v1.x, v1.y, v1.z, q.sz, q.ax[0], q.ax[1], q.ax[2], q.tr * tau, q.sd, q.glow); }
      for (const q of shed) { const ph = q.j / 12, n = Math.floor((tau - ph) / 3), age = tau - ph - n * 3; if (tau < ph || age > 2.5) continue; const e = ih(q.j, n, 11) * TAU, rEnd = 216 + 113 * ih(q.j, n, 12), sp = age / 2.5, r = R + (rEnd - R) * (1 - (1 - sp) ** 2), a = e - (50 * age - 5 * age * age) * DEG, y = (ih(q.j, n, 13) - 0.5) * 3, size = (0.8 + 3 * ih(q.j, n, 14)) * Math.min(1, age * 4, (2.5 - age) * 3);
        v1.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(qD); v2.set(Math.cos(a) * r, y, Math.sin(a) * r).applyQuaternion(qR); v1.lerp(v2, sst(0, 1, sp)); rocks.put(v1.x, v1.y, v1.z, size, 1, 0.4, 0.2, 5 * age * (1 + q.sd), q.sd, ih(q.j, n, 15) < 0.3 ? 1 + Math.floor(ih(q.j, n, 16) * 20) : 0); }
      for (const c of chunks) rocks.put(c.pos[0] + c.v[0] * tau, c.pos[1] + c.v[1] * tau, c.pos[2] + c.v[2] * tau, c.sz, c.ax[0], c.ax[1], c.ax[2], c.tr * tau, c.sd, c.glow);
      rocks.commit();
    },
  };
}

export const SPINSPACE_KINDS = { sstars: starsKind, searth: earthKind, sdisc: discKind };
