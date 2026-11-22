// Krampus myth 01 "One night a year he checks your boots" (storyboards/series/krampus-myth/01-boots/DESIGN.md section D): SAINT NICK'S THINGS.
// The GOLDEN BOOK, the CROOK and the SACK. PICTURES ONLY: no letters or digits anywhere (the book's writing is rows of small ink pictures; the
// roll is 52 fries cartons). GOLD is the GOLD LEAF rule of egypt-myth 01: base #e2b04a, shade #9a6a1e, deep #6b4612, ONE long light band #fff0b8
// on every round part, leaf seams every 85 mm at 6 %, wear rubbed to bronze #6b4612 (red bole #8a4a2a in 1 spot of 4). Metres, degrees, scale 1;
// a pure function of spec, state and t (every mark from its index; no Math.random, no clock). Hand-drawn look: ink on hard edges, steam/noOutline on glow.
//
// KIND goldenbook   Origin: the FOOT OF THE SPINE, on the spine's outer line (x 0, y 0, z 0 shut); the cover faces +z at rot 0, the spine is on the left.
//   Shut: x -0.019 (the rounded spine) .. +0.285 (fore-edge) = 0.30 wide, 0.40 tall, 0.09 thick (z -0.045 .. +0.045). Open 150 deg (`open` 1): the leaves
//   make a V opening toward +z, 0.62 wide about x 0 (the middle = the gutter = the origin's x), the back leaf 15 deg and the front leaf 165 deg from +x.
//   Covers: GOLD boards 0.008 proud of the pages, a raised frame 0.03 with a rope moulding of 64 twists, 4 corner bosses (8 lobes, r 0.022), a medallion
//   r 0.07 (3 balls over a boot in relief), 16 tooled vine scrolls (4 a quarter, 3 leaves each), worn to bronze on the corners and the lower outer edge.
//   Spine: 5 raised bands, a rosette in each of the 4 panels, head and tail bands of 12 red and gold stripes. Page edges gilded (5 mm lattice), 2 clasps
//   0.02 wide that hang open while it is open, a crimson silk ribbon 0.012 hanging 0.10 below the foot (forked end), a chain of 16 small links from the
//   spine's foot. Pages: parchment #f6ecd2, 2 stacks with a gutter curve, 3 loose edges a side (~180 leaves); each page 2 columns x 6 ink pictures of
//   0.035 between thin red rules (a gold-leaf flower where an initial would be), from a kit of 10 small potato deeds.
//   STATE (tween with c.prop; seed with a dur-0 set; spec key = start value)        default
//     open 0..1      0 shut .. 1 open 150 degrees (the clasps swing open in the first 12 %)   0
//     page (count)   each +1 turns one leaf right to left (lift, bend 30 %, fall): tween it over 8 frames (0.267 s) per leaf; whole numbers rest   0
//     glow 0..1      the open pages emissive #fff0c0 (ink stays dark), a glow card r 0.5 at 0.40 behind the book, one real light #ffe2a0 range 1.6 at the
//                    gutter (set `nick.glow` with it); it shows from open 0.25   0
//     run 0..1       the long roll: paid-out length 3.20 x run, measured from the foot of the right page (see below)   0
//     spread         "plain" | "good" | "long", or an array by page count ["plain","good","long"]. A string is the spread at page 0 (later pages are
//                    ordinary); it may also be set with c.prop (a string tweens as a step).   "plain"
//                    plain: 12 pictures a page. good: left ordinary, right = THE GOOD PAGE: only the top third, 4 pictures of a one-leaf teal potato
//                    (watering a plant, carrying an old potato's firewood, sharing a sandwich with a small yellow two-leaf potato, holding a door), a
//                    gold-leaf line under them, clean parchment below. long: left ordinary, right = 8 pictures and a clear foot where the roll lies.
//   SPEC KEYS (no tween): drop0 (0.30) world metres from the page foot down to the ground: lower when the book is held lower;
//     roll [dx, dz] ([0.15, 1]) the roll's WORLD direction on the ground (alias rollDir: use it if the book is ever held, see NOTES);
//     apron [dist, drop] ([0.96, 0.16]) metres from where the sheet first lies on the ground to the apron's step edge, and the step's height;
//     chain true (false hides it); chainTo [x, y, z] in the book's frame (default: hangs by gravity from the foot, 0.17 long; with chainTo it sags to
//     that point, the rope belt, and is taut at 0.17).
//   THE LONG ROLL (spread "long", open, run): one sheet 0.26 wide of 3.20 m: 13 rows 0.24 apart of 4 pictures = 52 fries cartons (red and white
//     stripes, 6-8 yellow fries), a small yellow two-leaf potato reaching into each in 4 poses; the 4th carton of the last row is only an ink outline
//     (he is still on it). At run 0 it lies wound on its wooden spindle (0.075 across) over the foot of the right page. As run grows the sheet leaves the
//     page's lower edge, hangs and sways 3 degrees, drops 0.30 (WORLD, from the lower edge) to the ground (run 0.09), runs along `roll`, drapes over the
//     step (`apron`), crosses the lower ground, the printed side up and upright to a camera on the `roll` side, while the head coil rolls on and shrinks
//     to the bare spindle at run 1. The 0.30 drop and the apron are world lengths: the book keeps its rot, tip and tilt from the prop's own state.
//   HOLD POINTS (own frame, scale 1; KRAMPUS_NICK_GRIPS): spineL (-0.022, 0.22, 0) the left palm on the spine; foreR (0.30, 0.22, 0) the right palm on
//     the fore-edge: TWO-HAND HOLD at the chest = grips.box with SIZE goldenbook { w 0.30, h 0.40, d 0.09 } and the centre OFFSET cx 0.133 (the box
//     hold assumes an origin at the middle: see NOTES); thumbR (0.255, 0.075, 0.05) the right thumb on the worn lower outer edge of the cover;
//     underL (0.04, 0.05, -0.06) the left palm under the open book; chain (-0.02, 0.003, 0) the chain's top.
//
// KIND nickcrook   Origin: the TIP of the iron spike (y 0), the volute opens toward +z (drawn in the y-z plane, 0.24 across); 1.50 tall.
//   GOLD shaft 0.030 with ring knops at y 0.50, 0.95, 1.12; a 6-lobed knop r 0.04 at y 1.15 with 6 small red stones; the volute 1.6 turns tapering 0.030 -> 0.012
//   (centre y 1.365, z +0.12), 7 leaf crockets on its outer edge, a curled leaf end, a 6-petal flower r 0.03 in the curl; an iron spike 0.10 (rust at the
//   joint) under a gold ferrule. Worn to bronze at y 0.50-0.75 and on the knops. No state keys. spec `planted` (false; also a state key set to true):
//   a snow collar r 0.06 at y 0.10 round the shaft (the director sets y = snow level - 0.10 and tilt -4).
//   HOLD POINTS: fist (0, 0.60, 0) = grips.mug with SIZE nickcrook { r 0.015, h 0.909 } (the fist at y 0.60, the shaft in front of the forearm);
//     planted (0, 0.10, 0); knop (0, 1.12, 0); top (0, 1.30, 0).
//
// KIND nicksack   Origin: the bottom centre (y 0), 0.30 tall x 0.22 wide full, the mouth 0.14 across at y 0.30.
//   Unbleached linen #d9c9a3 (3 round bulges, 5 coin edges under the cloth), a darker patch with 12 stitches on the front (+z), tied with a twisted red
//   and gold cord (2 turns, a knot, 2 ends with tassels) at y 0.262; the mouth with a rolled rim shows 3 coins, 1 mandarin and 2 walnuts at full.
//   STATE: full 0.4..1 (1) as it empties it slumps (height 0.21, the neck folds over, wider at the foot) and the pieces in the mouth sink and go (6 -> 1).
//   HOLD POINTS: neck (0, 0.262, 0) the tie / the rope; bellyL (-0.11, 0.11, 0.02), bellyR (0.11, 0.11, 0.02) both hands for the pour; base (0, 0, 0).
//   What falls out is E's `ktreat` pieces (the pieces in the mouth are drawn here at E's sizes).
//
// COUNTS (the bench sheet): cartons 52 in 13 rows of 4; cover scrolls 16 (4 a quarter); spine bands 5; chain links 16; crockets 7; twists 64; bosses 4
//   of 8 lobes; page pictures 12 a page; clasps 2; stones 6; sack stitches 12.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp } from "./util.js";
import { taperedTube } from "./geo.js";

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);

function canvasTex(w, h, draw, rep = false) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const quiet = (m) => { m.userData.noOutline = true; return m; };
const paper = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.92, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const decal = (tex, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const soft = (o = {}) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const flat = (o) => { o.castShadow = false; o.userData.solid = false; o.userData.steam = true; return o; };

// ---------------------------------------------------------------- GOLD LEAF (egypt-myth 01 DESIGN): never flat yellow
const GOLD = { base: "#e2b04a", shade: "#9a6a1e", deep: "#6b4612", light: "#fff0b8", bole: "#8a4a2a" };
const GC = { base: col(GOLD.base), shade: col(GOLD.shade), deep: col(GOLD.deep), light: col(GOLD.light), bole: col(GOLD.bole) };
const KEY = V3(-0.38, 0.62, 0.69).normalize();   // the painted light: upper left, from the viewer
// Paint a geometry's vertices as gold leaf: base -> shade away from the light, ONE long light band #fff0b8 on every round part,
// deep in the recesses, wear (0..1 by position) rubbed through to bronze #6b4612 with red bole in 1 rubbed spot of 4, and a +-3 % tone per 85 mm leaf.
function paintGold(geo, wear = null, flipZ = false) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const Pp = geo.attributes.position, Nn = geo.attributes.normal, n = Pp.count, cs = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = Pp.getX(i), y = Pp.getY(i), z = Pp.getZ(i), d = Nn.getX(i) * KEY.x + Nn.getY(i) * KEY.y + Nn.getZ(i) * KEY.z * (flipZ ? -1 : 1);
    c.copy(GC.base);
    if (d < 0.42) c.lerp(GC.shade, clamp((0.42 - d) / 0.9) * 0.9);
    if (d < -0.3) c.lerp(GC.deep, clamp((-0.3 - d) / 0.6) * 0.6);
    if (d > 0.72) c.lerp(GC.light, sstep(0.72, 0.92, d) * 0.95);
    const leaf = rr(Math.floor(x / 0.085) * 7.1 + Math.floor(y / 0.085) * 13.3 + 1.7); c.multiplyScalar(0.97 + 0.06 * leaf);
    const w = wear ? wear(x, y, z) : 0;
    if (w > 0.02) { c.lerp(GC.deep, Math.min(0.8, w * 0.85)); if (w > 0.55 && rr(Math.floor(x * 40) * 3.3 + Math.floor(y * 40) * 5.9 + 4) < 0.25) c.lerp(GC.bole, 0.4); }
    cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); return geo;
}
let GOLD_VC = null;
const goldMat = () => GOLD_VC || (GOLD_VC = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.34, metalness: 0.12, emissive: new THREE.Color("#5a4018"), emissiveIntensity: 0.22 }));
const IRON = { base: col("#1f2126"), shade: col("#101114"), edge: col("#5a6270"), rust: col("#6a3a22") };
function paintIron(geo, rustAt = null) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const Pp = geo.attributes.position, Nn = geo.attributes.normal, n = Pp.count, cs = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const d = Nn.getX(i) * KEY.x + Nn.getY(i) * KEY.y + Nn.getZ(i) * KEY.z; c.copy(IRON.base);
    if (d < 0.2) c.lerp(IRON.shade, clamp((0.2 - d) / 0.8)); if (d > 0.78) c.lerp(IRON.edge, sstep(0.78, 0.95, d) * 0.9);
    const r = rustAt ? rustAt(Pp.getX(i), Pp.getY(i), Pp.getZ(i)) : 0; if (r > 0) c.lerp(IRON.rust, Math.min(0.9, r));
    cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); return geo;
}
const solid = (geo) => { let g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute("uv"); if (!g.attributes.normal) g.computeVertexNormals(); return g; };
const place = (geo, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => { const m = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), V3(...(Array.isArray(s) ? s : [s, s, s]))); geo.applyMatrix4(m); return geo; };
function rrect(x0, y0, w, h, r) { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false); s.lineTo(x0 + w, y0 + h - r); s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false); s.lineTo(x0 + r, y0 + h); s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false); return s; }
const ext = (shape, depth, bev = 0.0008, o = {}) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 10, ...o });
// a geometry from a (nu+1) x (nv+1) grid of [x, y, z, u, v], its faces turned toward `hint` (a Vector3)
function gridGeo(nu, nv, fn, hint) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = fn(i, j); pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * row + i, b = a + 1, c = a + row, d = c + 1; idx.push(a, b, c, b, d, c); }
  const A = V3(pos[0], pos[1], pos[2]), B = V3(pos[3], pos[4], pos[5]), C = V3(pos[row * 3], pos[row * 3 + 1], pos[row * 3 + 2]);
  const nrm = B.clone().sub(A).cross(C.clone().sub(A));
  if (hint && nrm.dot(hint) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- THE PICTURES (the book's writing: PICTURES ONLY, never letters)
// A tiny ink-and-wash kit. Unit space: the picture's box is [-0.5, 0.5]^2, y down, ink = the brown line #5a3a22, 2 washes (colour, then a shade crescent).
const INK = "#5a3a22", SKIN = "#e8b865", SKIN_SH = "#b9803a", LEAFC = "#7fa04a", RED = "#a3232b", TEAL = "#2f8f8a", YEL = "#f2b824", YELP = "#ffd95a", WOOD = "#a87242", GREY = "#cfcbc0";
const wash = (g, c, a = 0.8) => { g.globalAlpha = a; g.fillStyle = c; g.fill(); g.globalAlpha = 1; };
const inkW = (g, w = 0.03) => { g.strokeStyle = INK; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; };
const line = (g, pts, w = 0.03) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); inkW(g, w); g.stroke(); };
function leafAt(g, x, y, L, ang, c = LEAFC, lw = 0.02) {   // a leaf from (x, y) pointing at ang (0 = up), length L
  const ca = Math.cos(ang), sa = Math.sin(ang), w = L * 0.34, tx = x + sa * L, ty = y - ca * L, mx = x + sa * L * 0.5, my = y - ca * L * 0.5;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx - ca * w, my - sa * w, tx, ty); g.quadraticCurveTo(mx + ca * w, my + sa * w, x, y); wash(g, c, 0.85); inkW(g, lw); g.stroke();
  line(g, [[x, y], [mx + sa * L * 0.08, my - ca * L * 0.08]], lw * 0.6);
}
// a potato: bottom centre (x, y), height h. o: skin, cloth (a sweater colour), leaves 0|1|2, lean, eyes "dot"|"arc"|"shut", mouth "smile"|"o"|"flat"|"none", look (-1..1), armL / armR [dx, dy] in h from the shoulder, handC, hat
function pot(g, x, y, h, o = {}) {
  const w = h * (o.wide ?? 0.84), cy = y - h / 2, lw = (o.lw ?? 0.024) * (o.lwk ?? 1), skin = o.skin ?? SKIN, lean = o.lean ?? 0;
  g.save(); g.translate(x, y); g.rotate(lean); g.translate(-x, -y);
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * w * 0.2, y - h * 0.015, w * 0.14, h * 0.05, 0, 0, TAU); wash(g, "#8a5a30", 0.9); inkW(g, lw * 0.8); g.stroke(); }
  const nl = o.leaves ?? 1;
  if (nl === 1) leafAt(g, x + w * 0.04, y - h * 0.97, h * 0.34, 0.35, o.leafC);
  else if (nl === 2) { leafAt(g, x - w * 0.03, y - h * 0.97, h * 0.3, -0.62, o.leafC); leafAt(g, x + w * 0.03, y - h * 0.97, h * 0.3, 0.62, o.leafC); }
  g.beginPath(); g.ellipse(x, cy, w / 2, h / 2, 0, 0, TAU); wash(g, skin, 0.88);
  g.save(); g.clip();
  g.beginPath(); g.rect(x - w, y - h * 1.2, w * 2, h * 1.5); g.ellipse(x - w * 0.12, cy - h * 0.05, w * 0.62, h * 0.57, 0, 0, TAU); g.fillStyle = o.shadeC ?? SKIN_SH; g.globalAlpha = 0.4; g.fill("evenodd"); g.globalAlpha = 1;
  if (o.cloth) { g.beginPath(); g.moveTo(x - w, y - h * 0.5); g.quadraticCurveTo(x, y - h * 0.44, x + w, y - h * 0.5); g.lineTo(x + w, y + h * 0.1); g.lineTo(x - w, y + h * 0.1); g.closePath(); wash(g, o.cloth, 0.92); inkW(g, lw * 0.9); g.stroke(); for (let k = -2; k <= 2; k++) line(g, [[x + k * w * 0.16, y - h * 0.42], [x + k * w * 0.16, y - h * 0.02]], lw * 0.35); }
  g.restore();
  g.beginPath(); g.ellipse(x, cy, w / 2, h / 2, 0, 0, TAU); inkW(g, lw); g.stroke();
  const ey = y - h * 0.62, ex = w * 0.2, lk = (o.look ?? 0) * w * 0.04, eyes = o.eyes ?? "dot";
  for (const s of [-1, 1]) {
    if (eyes === "dot") { g.beginPath(); g.ellipse(x + s * ex + lk, ey, w * 0.055, h * 0.07, 0, 0, TAU); g.fillStyle = "#2a1a10"; g.fill(); g.beginPath(); g.arc(x + s * ex + lk + w * 0.015, ey - h * 0.025, w * 0.015, 0, TAU); g.fillStyle = "#fff"; g.fill(); }
    else if (eyes === "arc") { g.beginPath(); g.arc(x + s * ex, ey + h * 0.03, w * 0.07, Math.PI * 1.1, Math.PI * 1.9); inkW(g, lw * 0.9); g.stroke(); }
    else { line(g, [[x + s * ex - w * 0.06, ey], [x + s * ex + w * 0.06, ey]], lw * 0.9); }
    g.beginPath(); g.ellipse(x + s * w * 0.3, y - h * 0.5, w * 0.07, h * 0.035, 0, 0, TAU); g.fillStyle = "#ff8f8f"; g.globalAlpha = 0.45; g.fill(); g.globalAlpha = 1;
  }
  const my = y - h * 0.44, mo = o.mouth ?? "smile";
  if (mo === "smile") { g.beginPath(); g.arc(x, my - h * 0.03, w * 0.1, Math.PI * 0.15, Math.PI * 0.85); inkW(g, lw * 0.8); g.stroke(); }
  else if (mo === "o") { g.beginPath(); g.ellipse(x, my, w * 0.05, h * 0.045, 0, 0, TAU); g.fillStyle = "#7a2a22"; g.fill(); }
  else if (mo === "flat") line(g, [[x - w * 0.07, my], [x + w * 0.07, my]], lw * 0.8);
  if (o.hat) { g.beginPath(); g.moveTo(x - w * 0.34, y - h * 0.84); g.quadraticCurveTo(x, y - h * 1.22, x + w * 0.34, y - h * 0.84); g.closePath(); wash(g, RED, 0.9); inkW(g, lw); g.stroke(); g.beginPath(); g.arc(x, y - h * 1.1, w * 0.07, 0, TAU); wash(g, "#f4f1ea", 1); g.stroke(); }
  for (const [s, a] of [[-1, o.armL], [1, o.armR]]) {
    if (!a) continue;
    const sx = x + s * w * 0.47, sy = y - h * 0.36, ex2 = sx + a[0] * h, ey2 = sy + a[1] * h, mx = (sx + ex2) / 2 + s * h * 0.06, my2 = (sy + ey2) / 2 + h * 0.07;
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my2, ex2, ey2); inkW(g, lw * 3.1); g.stroke(); g.strokeStyle = o.cloth && !o.bare ? o.cloth : skin; g.lineWidth = lw * 1.9; g.stroke();
    g.beginPath(); g.arc(ex2, ey2, h * 0.052, 0, TAU); wash(g, o.handC ?? "#f3ede0", 1); inkW(g, lw * 0.8); g.stroke();
  }
  g.restore();
}
const bag = (g, f) => { g.save(); f(); g.restore(); };
// the ten small deeds of an ordinary page, in a box [-0.5, 0.5]
const DEEDS = [
  (g) => { /* 0 sweeping the step */ g.beginPath(); g.rect(-0.46, 0.38, 0.92, 0.07); wash(g, "#9a9aa4", 0.8); inkW(g, 0.022); g.stroke(); pot(g, -0.14, 0.38, 0.62, { armR: [0.17, 0.1], eyes: "dot", look: 1 }); line(g, [[0.12, 0.08], [0.3, 0.4]], 0.032); g.beginPath(); g.moveTo(0.22, 0.34); g.lineTo(0.4, 0.4); g.lineTo(0.37, 0.46); g.lineTo(0.27, 0.43); g.closePath(); wash(g, "#c9a45a", 0.9); inkW(g, 0.02); g.stroke(); },
  (g) => { /* 1 feeding a bird */ pot(g, -0.16, 0.42, 0.66, { armR: [0.3, 0.12], look: 1 }); g.beginPath(); g.ellipse(0.31, 0.37, 0.1, 0.072, 0, 0, TAU); wash(g, "#8a7a6a", 0.9); inkW(g, 0.02); g.stroke(); g.beginPath(); g.arc(0.4, 0.31, 0.045, 0, TAU); wash(g, "#8a7a6a", 0.9); g.stroke(); line(g, [[0.44, 0.31], [0.5, 0.33], [0.44, 0.34]], 0.02); line(g, [[0.22, 0.37], [0.12, 0.43]], 0.025); for (const [a, b] of [[0.1, 0.45], [0.2, 0.47], [0.3, 0.46]]) { g.beginPath(); g.arc(a, b, 0.012, 0, TAU); g.fillStyle = INK; g.fill(); } },
  (g) => { /* 2 carrying a pail */ pot(g, -0.1, 0.42, 0.68, { armR: [0.14, 0.2], look: 1, mouth: "flat" }); const px = 0.2, py = 0.46; g.beginPath(); g.moveTo(px - 0.12, py - 0.2); g.lineTo(px + 0.12, py - 0.2); g.lineTo(px + 0.09, py); g.lineTo(px - 0.09, py); g.closePath(); wash(g, "#8a9aa6", 0.9); inkW(g, 0.024); g.stroke(); g.beginPath(); g.ellipse(px, py - 0.2, 0.12, 0.03, 0, 0, TAU); wash(g, "#6fa4cc", 0.9); g.stroke(); g.beginPath(); g.arc(px, py - 0.2, 0.12, Math.PI, 0); g.stroke(); line(g, [[px - 0.09, py - 0.1], [px + 0.09, py - 0.1]], 0.016); },
  (g) => { /* 3 a hug */ pot(g, 0.12, 0.43, 0.46, { skin: "#f0c878", leaves: 2, armR: [-0.3, -0.04], eyes: "arc", mouth: "smile" }); pot(g, -0.14, 0.43, 0.68, { leaves: 1, armR: [0.34, -0.06], armL: [0.08, -0.14], eyes: "shut", lean: 0.06, mouth: "smile" }); },
  (g) => { /* 4 lighting a candle */ pot(g, -0.1, 0.43, 0.7, { armR: [0.26, -0.02], look: 1, mouth: "o" }); g.beginPath(); g.rect(0.2, 0.08, 0.075, 0.23); wash(g, "#f4ecd2", 1); inkW(g, 0.022); g.stroke(); g.beginPath(); g.moveTo(0.238, -0.1); g.quadraticCurveTo(0.31, 0.02, 0.238, 0.08); g.quadraticCurveTo(0.17, 0.02, 0.238, -0.1); wash(g, "#ffb45a", 0.95); inkW(g, 0.018); g.stroke(); g.beginPath(); g.ellipse(0.238, 0.02, 0.02, 0.04, 0, 0, TAU); g.fillStyle = "#fff0c0"; g.fill(); },
  (g) => { /* 5 mending a sock */ pot(g, -0.06, 0.43, 0.66, { cloth: "#b9503a", armL: [-0.04, 0.16], armR: [0.2, 0.08], look: 1 }); g.beginPath(); g.moveTo(0.18, 0.1); g.lineTo(0.32, 0.1); g.lineTo(0.32, 0.3); g.quadraticCurveTo(0.46, 0.34, 0.44, 0.42); g.lineTo(0.18, 0.42); g.closePath(); wash(g, "#c8d4de", 0.9); inkW(g, 0.022); g.stroke(); for (const yy of [0.15, 0.2]) line(g, [[0.18, yy], [0.32, yy]], 0.012); g.beginPath(); g.moveTo(0.3, 0.25); g.bezierCurveTo(0.46, 0.18, 0.4, 0.4, 0.5, 0.36); inkW(g, 0.014); g.strokeStyle = RED; g.stroke(); },
  (g) => { /* 6 shovelling snow */ g.beginPath(); g.ellipse(0.28, 0.4, 0.22, 0.12, 0, Math.PI, 0); wash(g, "#e6eefc", 0.95); inkW(g, 0.022); g.stroke(); g.beginPath(); g.ellipse(0.3, 0.35, 0.12, 0.05, 0, 0, Math.PI); wash(g, "#9fb2dc", 0.5); pot(g, -0.18, 0.43, 0.66, { cloth: "#4a6078", armR: [0.18, 0.12], look: 1 }); line(g, [[0.0, 0.05], [0.18, 0.42]], 0.03); g.beginPath(); g.moveTo(0.14, 0.4); g.lineTo(0.3, 0.4); g.lineTo(0.27, 0.49); g.lineTo(0.15, 0.49); g.closePath(); wash(g, "#8a9aa6", 0.95); inkW(g, 0.02); g.stroke(); },
  (g) => { /* 7 giving a hat */ pot(g, -0.18, 0.43, 0.68, { armR: [0.3, -0.12], look: 1 }); g.beginPath(); g.moveTo(0.17, 0.03); g.quadraticCurveTo(0.24, -0.16, 0.31, 0.03); g.closePath(); wash(g, RED, 0.92); inkW(g, 0.02); g.stroke(); g.beginPath(); g.arc(0.24, -0.14, 0.03, 0, TAU); wash(g, "#f4f1ea", 1); g.stroke(); pot(g, 0.3, 0.43, 0.4, { skin: "#f0c878", leaves: 1, armL: [-0.1, -0.14], eyes: "arc" }); },
  (g) => { /* 8 petting a cat */ g.beginPath(); g.ellipse(0.22, 0.34, 0.2, 0.11, 0, 0, TAU); wash(g, "#9a8a7a", 0.9); inkW(g, 0.022); g.stroke(); g.beginPath(); g.arc(0.06, 0.26, 0.085, 0, TAU); wash(g, "#9a8a7a", 0.9); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0.06 + s * 0.08, 0.22); g.lineTo(0.06 + s * 0.07, 0.15); g.lineTo(0.06 + s * 0.02, 0.19); wash(g, "#9a8a7a", 0.9); g.stroke(); } g.beginPath(); g.moveTo(0.4, 0.33); g.bezierCurveTo(0.52, 0.28, 0.5, 0.12, 0.44, 0.1); inkW(g, 0.03); g.stroke(); for (const yy of [0.37, 0.44]) line(g, [[0.12 + (yy - 0.37) * 3, 0.42], [0.12 + (yy - 0.37) * 3, 0.46]], 0.025); pot(g, -0.28, 0.45, 0.66, { armR: [0.28, -0.06], look: 1 }); },
  (g) => { /* 9 ringing a bell */ line(g, [[-0.4, -0.46], [0.4, -0.46]], 0.035); line(g, [[0.12, -0.46], [0.12, -0.2]], 0.02); g.beginPath(); g.moveTo(0.04, -0.04); g.quadraticCurveTo(0.04, -0.2, 0.12, -0.2); g.quadraticCurveTo(0.2, -0.2, 0.2, -0.04); g.closePath(); wash(g, "#d9a43a", 0.95); inkW(g, 0.022); g.stroke(); g.beginPath(); g.arc(0.12, -0.02, 0.025, 0, TAU); g.fillStyle = INK; g.fill(); line(g, [[0.04, -0.04], [0.2, -0.04]], 0.022); line(g, [[0.12, -0.2], [0.0, 0.12]], 0.014); pot(g, -0.1, 0.45, 0.62, { armR: [0.1, -0.3], eyes: "arc", mouth: "o" }); },
];
// the 4 GOOD pictures of 55 s: a one-leaf potato in teal (Spud)
const GOOD = [
  (g) => { /* watering a plant */ g.beginPath(); g.moveTo(0.14, 0.2); g.lineTo(0.4, 0.2); g.lineTo(0.36, 0.45); g.lineTo(0.18, 0.45); g.closePath(); wash(g, "#c9724a", 0.95); inkW(g, 0.024); g.stroke(); line(g, [[0.27, 0.2], [0.27, -0.05]], 0.025); leafAt(g, 0.27, 0.05, 0.2, -0.9); leafAt(g, 0.27, 0.0, 0.2, 0.9); leafAt(g, 0.27, -0.05, 0.16, 0.1); g.beginPath(); g.arc(0.27, -0.2, 0.04, 0, TAU); wash(g, "#e8c84a", 1); g.stroke(); pot(g, -0.22, 0.45, 0.64, { cloth: TEAL, armR: [0.2, 0.0], look: 1, mouth: "smile" }); g.beginPath(); g.moveTo(-0.0, -0.04); g.lineTo(0.12, -0.02); g.lineTo(0.1, 0.12); g.lineTo(-0.02, 0.1); g.closePath(); wash(g, "#8a9aa6", 0.95); inkW(g, 0.02); g.stroke(); line(g, [[0.12, 0.0], [0.17, 0.0]], 0.02); for (const k of [0, 1, 2]) line(g, [[0.2 + k * 0.012, 0.04 + k * 0.05], [0.21 + k * 0.012, 0.09 + k * 0.05]], 0.012); },
  (g) => { /* carrying an old potato's firewood */ pot(g, 0.22, 0.44, 0.6, { skin: "#d8d0c0", shadeC: "#9a9488", leaves: 0, eyes: "arc", mouth: "smile", armR: [0.0, 0.18] }); line(g, [[0.4, 0.0], [0.4, 0.44]], 0.03); g.beginPath(); g.moveTo(0.1, -0.1); g.quadraticCurveTo(0.22, -0.2, 0.34, -0.1); g.quadraticCurveTo(0.22, -0.14, 0.1, -0.1); wash(g, "#f4f1ea", 0.95); g.stroke(); pot(g, -0.2, 0.44, 0.64, { cloth: TEAL, armR: [0.14, 0.04], armL: [0.12, 0.04], look: 1 }); for (const [a, b, r] of [[-0.02, 0.18, 0.05], [0.04, 0.2, 0.05], [-0.04, 0.1, 0.05], [0.03, 0.12, 0.05]]) { g.beginPath(); g.ellipse(a, b, r * 1.5, r, 0, 0, TAU); wash(g, WOOD, 0.95); inkW(g, 0.018); g.stroke(); g.beginPath(); g.arc(a + r, b, r * 0.4, 0, TAU); wash(g, "#d9b382", 1); g.stroke(); } },
  (g) => { /* sharing a sandwich with a small yellow two-leaf potato */ pot(g, -0.24, 0.44, 0.64, { cloth: TEAL, armR: [0.2, -0.06], look: 1, mouth: "smile" }); pot(g, 0.3, 0.44, 0.42, { skin: YEL, shadeC: "#b9861a", leaves: 2, armL: [-0.16, -0.08], eyes: "dot", mouth: "o" }); for (const [x0, rot] of [[-0.03, -0.08], [0.1, 0.1]]) { g.save(); g.translate(x0 + 0.05, 0.06); g.rotate(rot); g.beginPath(); g.rect(-0.06, -0.05, 0.12, 0.03); wash(g, "#d9b382", 1); inkW(g, 0.018); g.stroke(); g.beginPath(); g.rect(-0.06, -0.02, 0.12, 0.025); wash(g, "#7fa04a", 0.95); g.stroke(); g.beginPath(); g.rect(-0.06, 0.005, 0.12, 0.03); wash(g, "#d9b382", 1); g.stroke(); g.restore(); } },
  (g) => { /* holding a door */ g.beginPath(); g.moveTo(0.04, 0.45); g.lineTo(0.04, -0.3); g.quadraticCurveTo(0.24, -0.5, 0.44, -0.3); g.lineTo(0.44, 0.45); g.closePath(); wash(g, "#3c2616", 0.85); inkW(g, 0.026); g.stroke(); g.beginPath(); g.moveTo(-0.08, 0.45); g.lineTo(0.06, 0.4); g.lineTo(0.06, -0.3); g.lineTo(-0.08, -0.24); g.closePath(); wash(g, WOOD, 0.95); g.stroke(); line(g, [[-0.02, 0.0], [-0.02, 0.06]], 0.03); pot(g, -0.28, 0.45, 0.62, { cloth: TEAL, armR: [0.2, -0.12], look: 1 }); pot(g, 0.26, 0.45, 0.34, { skin: YEL, shadeC: "#b9861a", leaves: 2, eyes: "arc", mouth: "smile" }); },
];
// the fries picture of the long roll: Chip's small yellow two-leaf potato reaching into a carton, 4 poses. Box about 1 wide x 2.9 tall (y -1.7 .. 1.25); outline: only the ink
function friesPicture(g, pose, k, outline) {
  const lw = 0.03, tilt = (rr(k * 3.1) - 0.5) * 0.1, nf = 6 + Math.floor(rr(k * 5.7 + 1) * 3);
  g.save(); g.rotate(tilt);
  const cx = 0, top = 0.1, bot = 1.22, wt = 0.46, wb = 0.36;   // the carton: half widths at the rim and at the foot
  if (!outline) {
    const po = { skin: YEL, shadeC: "#b9861a", leaves: 2, lw: 0.026, eyes: pose === 2 ? "arc" : "dot", mouth: pose === 1 ? "o" : "smile", look: 0 };
    if (pose === 0) { po.armR = [0.1, 0.5]; po.armL = [-0.2, 0.2]; }
    if (pose === 1) { po.armR = [0.02, 0.62]; po.armL = [-0.02, 0.62]; po.lean = 0.05; }
    if (pose === 2) { po.armR = [0.14, -0.22]; po.armL = [-0.06, 0.66]; }
    if (pose === 3) { po.armR = [0.2, 0.9]; po.armL = [-0.2, 0.9]; po.lean = -0.06; po.eyes = "arc"; }
    po.wide = 0.64; pot(g, 0, 0.4, 1.55, po);
  } else {
    g.beginPath(); g.ellipse(0, -0.35, 0.62, 0.75, 0, 0, TAU); inkW(g, lw * 0.8); g.setLineDash([0.04, 0.05]); g.stroke(); g.setLineDash([]);
  }
  for (let i = 0; i < nf; i++) {   // the fries, standing in the carton, poking over the rim
    const fx = -0.34 + 0.68 * (i + 0.5) / nf + (rr(k * 7 + i) - 0.5) * 0.08, fh = 0.26 + 0.3 * rr(k * 11 + i * 3), fa = (rr(k * 13 + i * 5) - 0.5) * 0.5;
    g.save(); g.translate(fx, top + 0.08); g.rotate(fa); g.beginPath(); g.rect(-0.05, -fh, 0.1, fh + 0.2); if (!outline) { wash(g, i % 3 === 0 ? "#f2c64a" : YELP, 0.95); } inkW(g, lw * 0.7); g.stroke(); if (!outline) line(g, [[-0.02, -fh + 0.04], [-0.02, -0.04]], 0.012); g.restore();
  }
  g.beginPath(); g.moveTo(cx - wt, top); g.lineTo(cx + wt, top); g.lineTo(cx + wb, bot); g.lineTo(cx - wb, bot); g.closePath();
  if (!outline) {
    wash(g, "#f4f1ea", 1); g.save(); g.clip();
    for (let s = 0; s < 5; s++) { g.beginPath(); g.moveTo(-wt + s * 2 * wt / 5, top - 0.05); g.lineTo(-wt + (s + 1) * 2 * wt / 5, top - 0.05); g.lineTo(-wb + (s + 1) * 2 * wb / 5, bot + 0.05); g.lineTo(-wb + s * 2 * wb / 5, bot + 0.05); g.closePath(); if (s % 2 === 0) wash(g, "#c8322e", 0.95); }
    g.restore();
    g.beginPath(); g.moveTo(cx - wt, top); g.lineTo(cx + wt, top); g.lineTo(cx + wb, bot); g.lineTo(cx - wb, bot); g.closePath();
  }
  inkW(g, lw); g.stroke();
  if (!outline) { g.beginPath(); g.moveTo(cx - wt, top); g.lineTo(cx + wt, top); inkW(g, lw * 1.2); g.stroke(); }
  g.restore();
}
// a gold-leaf flower (6 petals, a pearl centre) where an initial would be, and a gold-leaf line with curled ends
function goldFlower(g, x, y, r) {
  for (let i = 0; i < 6; i++) { g.save(); g.translate(x, y); g.rotate(i * TAU / 6); g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.3, r * 0.42, 0, 0, TAU); const q = g.createLinearGradient(-r * 0.3, 0, r * 0.3, 0); q.addColorStop(0, GOLD.shade); q.addColorStop(0.45, GOLD.base); q.addColorStop(0.62, GOLD.light); q.addColorStop(1, GOLD.base); g.fillStyle = q; g.fill(); g.strokeStyle = GOLD.deep; g.lineWidth = r * 0.07; g.stroke(); g.restore(); }
  g.beginPath(); g.arc(x, y, r * 0.2, 0, TAU); g.fillStyle = "#f4f1ea"; g.fill(); g.strokeStyle = GOLD.deep; g.lineWidth = r * 0.06; g.stroke();
}
function goldLine(g, x0, x1, y, w) {
  const q = g.createLinearGradient(0, y - w, 0, y + w); q.addColorStop(0, GOLD.base); q.addColorStop(0.4, GOLD.light); q.addColorStop(1, GOLD.shade);
  g.fillStyle = q; g.fillRect(x0, y - w / 2, x1 - x0, w); g.strokeStyle = GOLD.deep; g.lineWidth = w * 0.18; g.strokeRect(x0, y - w / 2, x1 - x0, w);
  for (const [x, s] of [[x0, -1], [x1, 1]]) { g.beginPath(); g.arc(x + s * w * 1.4, y, w * 1.4, s > 0 ? Math.PI : 0, s > 0 ? Math.PI * 2.6 : Math.PI * 1.6 - Math.PI * 2, s < 0); g.lineWidth = w * 0.5; g.strokeStyle = GOLD.base; g.stroke(); }
}

// ---------------------------------------------------------------- CANVASES: parchment, pages, edges, cover, spine, the roll's tiles
const PARCH = "#f6ecd2", PARCH_SH = "#d9c9a3", RULE = "#a3232b";
function parchment(g, W, H, seed, ppm, gutter = null) {   // the sheet: base, soft stains, fibres, a shade into the gutter and at the edges
  g.fillStyle = PARCH; g.fillRect(0, 0, W, H);
  for (let n = 0; n < Math.round(W * H / 60000); n++) { const r = (20 + 60 * rr(n * 2.1 + seed)) * ppm / 4, x = rr(n * 1.7 + seed * 3) * W, y = rr(n * 2.9 + seed * 5) * H, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(217,201,163,${0.12 + 0.12 * rr(n + seed)})`); q.addColorStop(1, "rgba(217,201,163,0)"); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  g.lineWidth = Math.max(1, ppm * 0.18); for (let n = 0; n < Math.round(W * H / 5000); n++) { g.strokeStyle = `rgba(150,120,80,${0.05 + 0.08 * rr(n * 3.7 + seed)})`; const x = rr(n * 1.3 + seed) * W, y = rr(n * 4.1 + seed * 2) * H, a = rr(n + 9) * TAU, l = (2 + 5 * rr(n * 7)) * ppm; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  if (gutter) { const q = g.createLinearGradient(gutter === "L" ? 0 : W, 0, gutter === "L" ? 34 * ppm : W - 34 * ppm, 0); q.addColorStop(0, "rgba(160,128,80,0.55)"); q.addColorStop(1, "rgba(160,128,80,0)"); g.fillStyle = q; g.fillRect(0, 0, W, H); }
  const e = 3 * ppm; for (const [x0, y0, x1, y1] of [[0, 0, e, 0], [W, 0, W - e, 0], [0, 0, 0, e], [0, H, 0, H - e]]) { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, "rgba(160,128,80,0.28)"); q.addColorStop(1, "rgba(160,128,80,0)"); g.fillStyle = q; g.fillRect(0, 0, W, H); }
}
const PX = 4, PAGE_W = 273, PAGE_H = 384, COL_W = 96, COL_GAP = 10, ROW_H = 52, TOP = 30;
function drawCell(g, f, mmx, mmy, mmsize, flip = false) { g.save(); g.translate(mmx * PX, mmy * PX); g.scale(mmsize * PX * (flip ? -1 : 1), mmsize * PX); f(g); g.restore(); }
const PAGE_CACHE = new Map();
// kind "plain": 2 columns of 6 ink pictures (35 mm) between thin red rules, a gold-leaf flower where an initial would be;
// "good": only the top third, 4 teal pictures, a gold-leaf line under them, clean parchment below; "long": 4 rows of pictures, the foot clear for the roll
function pageTex(kind, seed, side) {
  const key = `${kind}:${seed}:${side}`; if (PAGE_CACHE.has(key)) return PAGE_CACHE.get(key);
  const t = canvasTex(PAGE_W * PX, PAGE_H * PX, (g, W, H) => {
    parchment(g, W, H, seed + 1, PX, side === "R" ? "L" : "R");
    const x0 = side === "R" ? 32 : 39, rows = kind === "good" ? 2 : kind === "long" ? 4 : 6, yEnd = TOP + rows * ROW_H;
    g.strokeStyle = RULE; g.globalAlpha = 0.8; g.lineWidth = 0.6 * PX; g.lineCap = "butt";
    for (const xx of [x0 - 2, x0 + COL_W + 3.2, x0 + COL_W + 6.8, x0 + 2 * COL_W + COL_GAP + 2]) { g.beginPath(); g.moveTo(xx * PX, (TOP - 5) * PX); g.lineTo(xx * PX, (yEnd + 2) * PX); g.stroke(); }
    for (let r = 0; r <= rows; r++) { const y = TOP + r * ROW_H; for (const [a, b] of [[x0 - 2, x0 + COL_W + 3.2], [x0 + COL_W + 6.8, x0 + 2 * COL_W + COL_GAP + 2]]) { g.beginPath(); g.moveTo(a * PX, y * PX); g.lineTo(b * PX, y * PX); g.stroke(); } }
    g.globalAlpha = 1;
    let prev = -1; const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) cells.push([c, r]);
    cells.forEach(([c, r], i) => {
      const cx = x0 + c * (COL_W + COL_GAP) + COL_W / 2, cy = TOP + r * ROW_H + ROW_H / 2, first = i === 0, dx = first ? 14 : 0;
      let f;
      if (kind === "good") f = GOOD[i]; else { let d = Math.floor(rr(seed * 17.3 + i * 3.1 + 2) * 10); if (d === prev) d = (d + 3) % 10; prev = d; f = DEEDS[d]; }
      drawCell(g, f, cx + dx, cy, 35, kind !== "good" && rr(seed * 5.1 + i * 9.7) < 0.35);
      if (first) goldFlower(g, (x0 + 14) * PX, cy * PX, 10.5 * PX);
    });
    if (kind === "good" || kind === "long") goldLine(g, (x0 + 8) * PX, (x0 + 2 * COL_W + COL_GAP - 8) * PX, (yEnd + 8) * PX, 2.0 * PX);
  });
  PAGE_CACHE.set(key, t); return t;
}
let EDGE_V = null, EDGE_H = null;
function edgeTex(wmm, hmm, vertical) {   // gilded page edges: gold leaf with a 5 mm lattice and the fine line of the 180 leaves
  return canvasTex(Math.round(wmm * 4), Math.round(hmm * 4), (g, W, H) => {
    const q = g.createLinearGradient(0, 0, W, H); q.addColorStop(0, GOLD.base); q.addColorStop(0.5, "#eec562"); q.addColorStop(1, GOLD.base); g.fillStyle = q; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,240,184,0.35)"; g.lineWidth = 1; for (let k = 0; k < (vertical ? W : H) / 1.64; k++) { g.beginPath(); if (vertical) { g.moveTo(k * 1.64, 0); g.lineTo(k * 1.64, H); } else { g.moveTo(0, k * 1.64); g.lineTo(W, k * 1.64); } g.stroke(); }
    const p = 20;   // 5 mm
    g.strokeStyle = "rgba(154,106,30,0.75)"; g.lineWidth = 1.6; for (let k = -H; k < W + H; k += p) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke(); g.beginPath(); g.moveTo(k, H); g.lineTo(k + H, 0); g.stroke(); }
    g.fillStyle = "rgba(154,106,30,0.8)"; for (let x = 0; x < W; x += p) for (let y = 0; y < H; y += p) { g.beginPath(); g.arc(x + p / 2, y + p / 2, 1.5, 0, TAU); g.fill(); }
    g.fillStyle = "rgba(107,70,18,0.28)"; for (let n = 0; n < 40; n++) { g.beginPath(); g.ellipse(rr(n * 1.9) * W, rr(n * 3.3) * H, 3 + 8 * rr(n), 2 + 6 * rr(n + 4), rr(n) * 3, 0, TAU); g.fill(); }
  });
}
// ---- the cover (D space: x from the spine edge, y up from the foot; the canvas is 285 x 400 mm, 4 px per mm)
const COV_W = 285, COV_H = 400;
function coverWear(x, y) {   // 0..1 in mm: the four corners, the lower outer edge where the thumbs rest, a thin rub on every edge
  const cd = Math.min(Math.hypot(x, y), Math.hypot(COV_W - x, y), Math.hypot(x, COV_H - y), Math.hypot(COV_W - x, COV_H - y));
  const w1 = Math.exp(-((cd / 15) ** 2)), w2 = Math.exp(-(((COV_W - x) / 20) ** 2)) * Math.exp(-(((y - 80) / 40) ** 2)) * 0.95;
  const e = Math.min(x, COV_W - x, y, COV_H - y), w3 = 0.4 * Math.exp(-((e / 4) ** 2));
  return clamp(Math.max(w1, w2, w3) * (0.72 + 0.5 * rr(Math.floor(x / 5) * 3.1 + Math.floor(y / 5) * 7.7)));
}
function scrollMark(g, s, k) {   // one tooled vine scroll in [0, s]^2: a stem entering at the lower left into a 1.5-turn spiral, a counter-curl at its foot, 3 leaves; deep gold with a light edge
  const spiral = (cx, cy, r0, r1, turns, a0, dir, N = 44) => { const out = []; for (let i = 0; i <= N; i++) { const f = i / N, th = a0 + dir * f * turns * TAU, r = r0 + (r1 - r0) * f; out.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]); } return out; };
  const main = spiral(s * 0.6, s * 0.4, s * 0.3, s * 0.07, 1.5, Math.PI * 0.95, 1), foot = spiral(s * 0.2, s * 0.8, s * 0.13, s * 0.035, 1.1, -Math.PI * 0.1, -1, 24);
  const stem = [[s * 0.02, s * 0.98], [s * 0.1, s * 0.78], [s * 0.26, s * 0.62], main[0]];
  const trace = (pts, dx, dy, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + dx, pts[i][1] + dy); g.stroke(); };
  const stemPts = []; for (let i = 0; i <= 14; i++) { const f = i / 14, a = 1 - f; stemPts.push([a * a * a * stem[0][0] + 3 * a * a * f * stem[1][0] + 3 * a * f * f * stem[2][0] + f * f * f * stem[3][0], a * a * a * stem[0][1] + 3 * a * a * f * stem[1][1] + 3 * a * f * f * stem[2][1] + f * f * f * stem[3][1]]); }
  const path = [...stemPts, ...main];
  for (const [pts, w] of [[path, s * 0.058], [foot, s * 0.042]]) { trace(pts, 0.9, 0.9, "rgba(255,240,184,0.85)", w * 0.8); trace(pts, 0, 0, GOLD.deep, w); trace(pts, -0.5, -0.5, "rgba(255,240,184,0.45)", w * 0.35); }
  for (const [pts, i, side, Lk] of [[main, 10, 1, 0.3], [main, 24, -1, 0.26], [main, 36, 1, 0.2], [foot, 10, -1, 0.17]]) {   // leaves
    const [px, py] = pts[i], q = pts[i + 1], p0 = pts[i - 1], ang = Math.atan2(q[1] - p0[1], q[0] - p0[0]) + side * 1.0, L = s * Lk;
    g.save(); g.translate(px, py); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -L * 0.36, L, 0); g.quadraticCurveTo(L * 0.5, L * 0.36, 0, 0); g.fillStyle = "rgba(255,240,184,0.3)"; g.fill(); g.strokeStyle = GOLD.deep; g.lineWidth = s * 0.04; g.stroke(); g.beginPath(); g.moveTo(L * 0.1, 0); g.lineTo(L * 0.85, 0); g.lineWidth = s * 0.02; g.stroke(); g.restore();
  }
  for (const [pts] of [[main], [foot]]) { const e = pts[pts.length - 1]; g.fillStyle = GOLD.deep; g.beginPath(); g.arc(e[0], e[1], s * 0.05, 0, TAU); g.fill(); g.fillStyle = GOLD.light; g.beginPath(); g.arc(e[0] - 0.8, e[1] - 0.8, s * 0.02, 0, TAU); g.fill(); }
}
function coverTex() {
  return canvasTex(COV_W * 4, COV_H * 4, (g, W, H) => {
    const P = 4, q = g.createLinearGradient(0, 0, W, H); q.addColorStop(0, "#e8b955"); q.addColorStop(0.45, GOLD.base); q.addColorStop(1, "#d39f3e"); g.fillStyle = q; g.fillRect(0, 0, W, H);
    // leaf seams every 85 mm (6 % contrast, each wobbled), both ways
    g.lineWidth = 1.6; for (let k = 1; k <= 4; k++) for (const vert of [true, false]) { const base = k * 85 * P; g.strokeStyle = k % 2 ? "rgba(107,70,18,0.12)" : "rgba(255,240,184,0.16)"; g.beginPath(); for (let t = 0; t <= 40; t++) { const a = t / 40 * (vert ? H : W), w = (rr(k * 9 + t * 0.7 + (vert ? 3 : 8)) - 0.5) * 3.2; if (vert) { if (base > W) break; t ? g.lineTo(base + w, a) : g.moveTo(base + w, a); } else { if (base > H) break; t ? g.lineTo(a, base + w) : g.moveTo(a, base + w); } } g.stroke(); }
    // a faint leaf mottling
    for (let n = 0; n < 160; n++) { const x = rr(n * 1.7) * W, y = rr(n * 2.9 + 1) * H, r = (6 + 22 * rr(n + 7)) * P; const c = rr(n + 3) < 0.5 ? "255,240,184" : "154,106,30", qq = g.createRadialGradient(x, y, 0, x, y, r); qq.addColorStop(0, `rgba(${c},0.07)`); qq.addColorStop(1, `rgba(${c},0)`); g.fillStyle = qq; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // the field inside the frame (x 42..243, y 42..358 from the top): a deeper tooled ground with a punched dot pattern, and 16 vine scrolls, 4 a quarter
    g.fillStyle = "rgba(154,106,30,0.16)"; g.fillRect(42 * P, 42 * P, 201 * P, 316 * P);
    g.fillStyle = "rgba(107,70,18,0.30)"; for (let y = 44; y < 358; y += 4.5) for (let x = 44 + ((Math.round(y / 4.5) % 2) ? 2.25 : 0); x < 243; x += 4.5) { if (Math.hypot(x - 142.5, y - 200) < 72) continue; g.beginPath(); g.arc(x * P, y * P, 0.45 * P, 0, TAU); g.fill(); }
    let n = 0;
    for (const [fy, yy] of [[false, 46], [true, 46]]) for (const fx of [false, true]) for (const [c, r] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const sx = 48 + c * 46, sy = yy + r * 40;   // the quarter's 2 x 2 cells, drawn in the top left quarter, then mirrored
      g.save(); g.translate(142.5 * P, 200 * P); g.scale(fx ? -1 : 1, fy ? -1 : 1); g.translate(-142.5 * P, -200 * P); g.translate(sx * P, sy * P);
      scrollMark(g, 38 * P, n); g.restore(); n++;
    }
    // frame shading: shade lines at the frame's two edges and a light line (the relief itself is geometry)
    for (const [inset, wd, c] of [[12, 0.8, "rgba(107,70,18,0.5)"], [42, 0.8, "rgba(107,70,18,0.55)"], [11, 0.5, "rgba(255,240,184,0.7)"], [43, 0.5, "rgba(255,240,184,0.5)"]]) { g.strokeStyle = c; g.lineWidth = wd * P; g.strokeRect(inset * P, inset * P, (COV_W - 2 * inset) * P, (COV_H - 2 * inset) * P); }
    // WEAR: bronze #6b4612 on the corners and the lower outer edge, soft rubbed patches, red bole in 1 rubbed spot of 4
    for (let i = 0; i < 2600; i++) {
      const x = rr(i * 1.7 + 0.3) * COV_W, y = rr(i * 2.9 + 1.1) * COV_H, w = coverWear(x, COV_H - y); if (rr(i * 5.3 + 2) > w * 0.9) continue;
      const bole = rr(Math.floor(x / 22) * 4.1 + Math.floor(y / 22) * 8.3 + 5) < 0.25, r = (2.5 + 5 * rr(i * 7.1)) * P, c = bole ? "138,74,42" : "107,70,18", q = g.createRadialGradient(x * P, y * P, 0, x * P, y * P, r);
      q.addColorStop(0, `rgba(${c},${0.22 + 0.3 * w})`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x * P - r, y * P - r, 2 * r, 2 * r);
    }
  });
}
// ---- the spine: 100 mm of arc x 400 mm, 6 px per mm; 5 raised bands (y up 20, 110, 200, 290, 380), a rosette in each of the 4 panels between
function spineTex() {
  return canvasTex(600, 2400, (g, W, H) => {
    const P = 6, q = g.createLinearGradient(0, 0, W, 0); q.addColorStop(0, GOLD.base); q.addColorStop(0.5, "#eec562"); q.addColorStop(1, "#d39f3e"); g.fillStyle = q; g.fillRect(0, 0, W, H);
    for (let n = 0; n < 60; n++) { const x = rr(n * 1.7) * W, y = rr(n * 2.9 + 1) * H, r = (5 + 14 * rr(n + 7)) * P; const c = rr(n + 3) < 0.5 ? "255,240,184" : "154,106,30", qq = g.createRadialGradient(x, y, 0, x, y, r); qq.addColorStop(0, `rgba(${c},0.08)`); qq.addColorStop(1, `rgba(${c},0)`); g.fillStyle = qq; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    const yi = (up) => (COV_H - up) * P;
    for (const up of [20, 110, 200, 290, 380]) { for (const d of [-7.5, 7.5, -10, 10]) { g.strokeStyle = Math.abs(d) < 8 ? "rgba(107,70,18,0.7)" : "rgba(255,240,184,0.5)"; g.lineWidth = 0.8 * P; g.beginPath(); g.moveTo(0, yi(up + d)); g.lineTo(W, yi(up + d)); g.stroke(); } }
    for (const up of [65, 155, 245, 335]) {   // the rosette: 8 petals and an inner ring of 8 dots, a pearl at the heart
      const cx = W / 2, cy = yi(up), R = 22 * P;
      g.strokeStyle = GOLD.deep; g.lineWidth = 0.9 * P; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, TAU); g.stroke(); g.strokeStyle = "rgba(255,240,184,0.7)"; g.lineWidth = 0.5 * P; g.beginPath(); g.arc(cx - 1, cy - 1, R * 1.12, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { g.save(); g.translate(cx, cy); g.rotate(i * TAU / 8); g.beginPath(); g.ellipse(0, -R * 0.62, R * 0.24, R * 0.4, 0, 0, TAU); g.fillStyle = "rgba(255,240,184,0.22)"; g.fill(); g.strokeStyle = GOLD.deep; g.lineWidth = 0.8 * P; g.stroke(); g.beginPath(); g.moveTo(0, -R * 0.3); g.lineTo(0, -R * 0.9); g.lineWidth = 0.4 * P; g.stroke(); g.restore(); g.fillStyle = GOLD.deep; g.beginPath(); g.arc(cx + Math.cos(i * TAU / 8 + TAU / 16) * R * 0.98, cy + Math.sin(i * TAU / 8 + TAU / 16) * R * 0.98, 0.9 * P, 0, TAU); g.fill(); }
      g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(cx, cy, R * 0.16, 0, TAU); g.fill(); g.strokeStyle = GOLD.deep; g.lineWidth = 0.6 * P; g.stroke();
    }
    for (let i = 0; i < 380; i++) { const x = rr(i * 1.7 + 0.3) * W, y = rr(i * 2.9 + 1.1) * H, up = COV_H - y / P, e = Math.min(up, COV_H - up), w = 0.8 * Math.exp(-((e / 14) ** 2)) + 0.08; if (rr(i * 5.3 + 2) > w) continue; const bole = rr(Math.floor(x / 120) * 4.1 + Math.floor(y / 120) * 8.3 + 5) < 0.25, r = (3 + 6 * rr(i * 7)) * P, c = bole ? "138,74,42" : "107,70,18", q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${c},0.4)`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  });
}
// ---- the long roll: 13 tiles of 4 pictures (3 px per mm, 260 x 240 mm), the margin tiles, and the back of the sheet
const ROLL_W = 0.26, ROW = 0.24, ROLL_TOP = 0.04, ROLL_LEN = 3.2, SP = 0.052;
const ROLL_CACHE = new Map();
function rollTex(row) {   // row -1: the head margin, 13: the tail margin
  if (ROLL_CACHE.has(row)) return ROLL_CACHE.get(row);
  const tall = row < 0 || row > 12 ? ROLL_TOP : ROW, PP = 3, W = 260 * PP, H = Math.round(tall * 1000 * PP);
  const t = canvasTex(W, H, (g) => {
    parchment(g, W, H, 40 + row, PP);
    g.strokeStyle = RULE; g.globalAlpha = 0.85; g.lineWidth = 0.6 * PP;
    for (const xx of [9, 11.2, 248.8, 251]) { g.beginPath(); g.moveTo(xx * PP, 0); g.lineTo(xx * PP, H); g.stroke(); }
    g.beginPath(); g.moveTo(9 * PP, row === 13 ? 0.5 : H - 0.5); g.lineTo(251 * PP, row === 13 ? 0.5 : H - 0.5); g.stroke(); if (row >= 0 && row <= 12) { g.beginPath(); g.moveTo(9 * PP, 0.5); g.lineTo(251 * PP, 0.5); g.stroke(); } g.globalAlpha = 1;
    if (row >= 0 && row <= 12) for (let c = 0; c < 4; c++) {   // 52 cartons: 13 rows of 4; the last row's 4th is only an ink outline: he is still on it
      const cx = (13 + 58.5 * (c + 0.5)) * PP, S = SP * 1000 * PP;
      g.save(); g.translate(cx, H / 2 + 0.2 * S); g.scale(S, S); friesPicture(g, c, row * 4 + c, row === 12 && c === 3); g.restore();
    }
  });
  ROLL_CACHE.set(row, t); return t;
}
let ROLL_BACK = null;
const rollBack = () => ROLL_BACK || (ROLL_BACK = canvasTex(256, 256, (g, W, H) => { parchment(g, W, H, 77, 1.2); g.fillStyle = "rgba(217,201,163,0.35)"; g.fillRect(0, 0, W, H); }, true));

// ================================================================ THE GOLDEN BOOK
const LB = 0.285, BH = 0.40, BT = 0.008, PT = 0.074, GAP = 0.034, SPINE_S = 0.10, X0 = 0.004, X1 = 0.277, Y0 = 0.008, Y1 = 0.392, OPEN_DEG = 150, DEPTH = 0.09;
const BAND_Y = [0.02, 0.11, 0.20, 0.29, 0.38];
// the cover's reliefs in D space (x from the spine edge, y up from the foot, z outward), gold-painted and merged in one mesh:
// a raised frame 0.03 with a rope moulding of 64 twists, 4 corner bosses of 8 lobes (r 0.022), a medallion r 0.07 (3 balls over a boot)
function coverRelief() {
  const parts = [], wear = (x, y) => coverWear(x * 1000, y * 1000);
  const outer = rrect(0.012, 0.012, 0.261, 0.376, 0.010); outer.holes.push(rrect(0.042, 0.042, 0.201, 0.316, 0.006));
  parts.push(solid(ext(outer, 0.0025, 0.0008)));
  const cr = 0.012, cx0 = 0.027, cy0 = 0.027, cw = 0.231, ch = 0.346, loop = [];   // the rope's centre line: a rounded rectangle
  const seg = [[cx0 + cr, cy0, 1, 0, cw - 2 * cr], [cx0 + cw, cy0 + cr, 0, 1, ch - 2 * cr], [cx0 + cw - cr, cy0 + ch, -1, 0, cw - 2 * cr], [cx0, cy0 + ch - cr, 0, -1, ch - 2 * cr]];
  const arcs = [[cx0 + cw - cr, cy0 + cr, -90], [cx0 + cw - cr, cy0 + ch - cr, 0], [cx0 + cr, cy0 + ch - cr, 90], [cx0 + cr, cy0 + cr, 180]];
  for (let s = 0; s < 4; s++) {
    const [sx, sy, dx, dy, len] = seg[s]; for (let k = 0; k < 20; k++) loop.push([sx + dx * len * k / 20, sy + dy * len * k / 20, Math.atan2(dy, dx)]);
    const [ax, ay, a0] = arcs[s]; for (let k = 0; k < 8; k++) { const a = (a0 + 90 * k / 8) * DEG; loop.push([ax + cr * Math.cos(a), ay + cr * Math.sin(a), a + Math.PI / 2]); }
  }
  let tot = 0; const cum = [0]; for (let i = 1; i <= loop.length; i++) { const a = loop[i - 1], b = loop[i % loop.length]; tot += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(tot); }
  for (let k = 0; k < 64; k++) {   // 64 twists: each an oblique bead across the rope
    const sTarget = (k + 0.5) / 64 * tot; let i = 1; while (i < cum.length - 1 && cum[i] < sTarget) i++;
    const a = loop[(i - 1) % loop.length], b = loop[i % loop.length], f = clamp((sTarget - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])), x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, tan = Math.atan2(b[1] - a[1], b[0] - a[0]);
    parts.push(solid(place(new THREE.SphereGeometry(1, 12, 8), x, y, 0.0033, 0, 0, tan + 52 * DEG, [0.0098, 0.0031, 0.0031])));
  }
  const lobe = (R) => { const s = new THREE.Shape(); for (let i = 0; i <= 128; i++) { const a = i / 128 * TAU, r = R * (0.80 + 0.2 * Math.cos(8 * a)); i ? s.lineTo(r * Math.cos(a), r * Math.sin(a)) : s.moveTo(r, 0); } return s; };
  for (const [bx, by] of [[0.027, 0.027], [0.258, 0.027], [0.027, 0.373], [0.258, 0.373]]) {   // 4 corner bosses: 8 lobes, r 0.022, a dome and a pearl each
    parts.push(solid(place(ext(lobe(0.022), 0.0035, 0.0012), bx, by, 0.0025)));
    parts.push(solid(place(new THREE.SphereGeometry(0.0085, 16, 10), bx, by, 0.0068, 0, 0, 0, [1, 1, 0.62])));
    parts.push(solid(place(new THREE.TorusGeometry(0.0125, 0.0013, 6, 24), bx, by, 0.0062)));
  }
  const mx = LB / 2, my = BH / 2;   // the medallion
  parts.push(solid(place(new THREE.TorusGeometry(0.066, 0.0036, 8, 72), mx, my, 0.0036)));
  parts.push(solid(place(new THREE.TorusGeometry(0.057, 0.0016, 6, 64), mx, my, 0.0028)));
  parts.push(solid(place(new THREE.CylinderGeometry(0.063, 0.063, 0.0018, 56), mx, my, 0.0021, Math.PI / 2, 0, 0)));
  for (const [bx, by] of [[-0.019, 0.047], [0.019, 0.047], [0, 0.026]]) parts.push(solid(place(new THREE.SphereGeometry(0.0095, 16, 12), mx + bx, my + by, 0.0105, 0, 0, 0, [1, 1, 0.78])));   // 3 balls
  const boot = new THREE.Shape(); boot.moveTo(-0.012, 0.05); boot.lineTo(0.01, 0.05); boot.lineTo(0.01, 0.022); boot.bezierCurveTo(0.016, 0.017, 0.03, 0.017, 0.033, 0.008); boot.quadraticCurveTo(0.036, 0.0, 0.03, -0.002); boot.lineTo(-0.012, -0.002); boot.closePath();
  parts.push(solid(place(ext(boot, 0.0032, 0.0009), mx - 0.009, my - 0.044, 0.0028)));   // the boot
  parts.push(solid(place(ext(rrect(-0.0135, 0.039, 0.0245, 0.0115, 0.002), 0.0016, 0.0006), mx - 0.009, my - 0.044, 0.0058)));   // its rolled cuff
  parts.push(solid(place(ext(rrect(-0.012, -0.002, 0.014, 0.008, 0.001), 0.0014, 0.0005), mx - 0.009, my - 0.044, 0.0056)));   // its heel
  const g = mergeGeometries(parts.map((p) => paintGold(p, wear))); return g;
}
const goldenbook = (P) => {
  const S = P.spec, W = P.whole, root = new THREE.Group(); W.add(root);
  const gm = goldMat(), chipEdge = mat("#8a1f2c");
  const coverT = coverTex(), spineT = spineTex(), edgeF = edgeTex(74, 384, true), edgeH = edgeTex(273, 74, false);
  // ---------- the two leaves: each a board (GOLD, 0.008) with its cover art and reliefs outside, an endpaper, a gilded page stack inside, clasp parts.
  // A leaf is built in D space (x along the leaf from the hinge, y up, z OUTWARD); the back leaf's group is mirrored in z so its outside faces -z.
  const reliefGeo = coverRelief();
  function makeLeaf(isBack) {
    const group = new THREE.Group(), D = new THREE.Group(); D.scale.z = isBack ? -1 : 1; group.add(D); root.add(group);
    const bodyG = solid(ext(rrect(0, 0, LB, BH, 0.004), BT, 0.0012)); place(bodyG, 0, 0, -BT); paintGold(bodyG, (x, y) => coverWear(x * 1000, y * 1000));
    const body = new THREE.Mesh(bodyG, gm); body.castShadow = body.receiveShadow = true; D.add(body);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(LB, BH), new THREE.MeshStandardMaterial({ map: coverT, roughness: 0.42, metalness: 0.1, emissive: new THREE.Color("#ffffff"), emissiveMap: coverT, emissiveIntensity: 0.13 })); art.position.set(LB / 2, BH / 2, 0.0014); art.receiveShadow = true; art.material.userData.noOutline = true; D.add(art);
    const rel = new THREE.Mesh(reliefGeo, gm); rel.position.z = 0.0014; rel.castShadow = rel.receiveShadow = true; rel.material.userData.noHatch = true; D.add(rel);
    const endp = new THREE.Mesh(new THREE.PlaneGeometry(LB - 0.002, BH - 0.002), paper({ color: "#7a1f2a", roughness: 0.5 })); endp.rotation.y = Math.PI; endp.position.set(LB / 2, BH / 2, -BT - 0.0014); D.add(endp);
    // the page stack: top (the printed leaf), fore-edge, head and tail (gilded, 5 mm lattice)
    const topM = paper({ color: "#ffffff", map: null }), foreM = paper({ map: edgeF, roughness: 0.4, metalness: 0.15 }), headM = paper({ map: edgeH, roughness: 0.4, metalness: 0.15 });
    const mesh = (m) => { const o = new THREE.Mesh(new THREE.BufferGeometry(), m); o.castShadow = false; o.receiveShadow = true; D.add(o); return o; };
    const top = mesh(topM), fore = mesh(foreM), head = mesh(headM), tail = mesh(headM);
    const loose = [0, 1, 2].map((k) => { const o = new THREE.Mesh(new THREE.BoxGeometry(0.03, Y1 - Y0 - 0.006 - 0.004 * k, 0.0005), paper({ color: k === 1 ? PARCH_SH : "#ecdfbd" })); o.castShadow = false; D.add(o); return o; });
    const zTop = (T, x, x0 = st.X0) => -(BT + T - 0.4 * Math.min(T, 0.037) * Math.exp(-(x - x0) / 0.03));
    let lastT = -1;
    const setT = (T, x0) => {
      const key = T + x0 * 7.31; if (Math.abs(key - lastT) < 1e-6) return; lastT = key; const NX = 26, xAt = (i) => x0 + (X1 - x0) * i / NX, uOf = (x) => { const u = clamp((x - X0) / (X1 - X0)); return isBack ? u : 1 - u; };
      for (const [o, g] of [[top, gridGeo(NX, 1, (i, j) => [xAt(i), Y0 + (Y1 - Y0) * j, zTop(T, xAt(i)), uOf(xAt(i)), j], V3(0, 0, -1))], [fore, gridGeo(1, 1, (i, j) => [X1, Y0 + (Y1 - Y0) * j, i ? zTop(T, X1) : -BT, i, j], V3(1, 0, 0))], [head, gridGeo(NX, 1, (i, j) => [xAt(i), Y1, j ? zTop(T, xAt(i)) : -BT, (xAt(i) - x0) / (X1 - x0), j], V3(0, 1, 0))], [tail, gridGeo(NX, 1, (i, j) => [xAt(i), Y0, j ? zTop(T, xAt(i)) : -BT, (xAt(i) - x0) / (X1 - x0), j], V3(0, -1, 0))]]) { o.geometry.dispose(); o.geometry = g; }
      loose.forEach((o, k) => { const ext_ = [0.0046, 0.0029, 0.0063][k]; o.scale.x = (0.016 + ext_) / 0.03; o.position.set(X1 - 0.016 + (0.016 + ext_) / 2, (Y0 + Y1) / 2 + 0.001 * (k - 1), zTop(T, X1) + 0.0011 * (k + 1)); o.rotation.z = (k - 1) * 0.0015; o.visible = T > 0.003; });
      top.visible = fore.visible = head.visible = tail.visible = T > 0.003;
    };
    // clasps and catches
    const clasps = [];
    if (isBack) for (const yc of [0.10, 0.30]) {
      const par = new THREE.Group(), cl = new THREE.Group(); par.position.set(LB + 0.0015, yc, 0.0035); par.add(cl); D.add(par);
      const parts = [solid(place(new THREE.BoxGeometry(0.003, 0.02, 0.095), 0, 0, -0.0475)), solid(place(new THREE.BoxGeometry(0.024, 0.02, 0.003), -0.0105, 0, -0.0965)), solid(place(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 14), 0, 0, 0.0005, Math.PI / 2, 0, 0)), solid(place(new THREE.SphereGeometry(0.0042, 10, 8), 0.0, 0, 0.003)), solid(place(new THREE.BoxGeometry(0.003, 0.02, 0.02), 0, 0, -0.01))];
      const cg = mergeGeometries(parts.map((p) => paintGold(p, null))); const m = new THREE.Mesh(cg, gm); m.castShadow = true; cl.add(m); clasps.push({ par, cl });
    } else for (const yc of [0.10, 0.30]) {
      const pg = mergeGeometries([solid(place(new THREE.BoxGeometry(0.026, 0.022, 0.0026), LB - 0.016, yc, 0.0027)), solid(place(new THREE.CylinderGeometry(0.0035, 0.004, 0.0048, 12), LB - 0.0165, yc, 0.0062, Math.PI / 2, 0, 0)), solid(place(new THREE.SphereGeometry(0.0034, 10, 8), LB - 0.0165, yc, 0.0088))].map((p) => paintGold(p, null)));
      const m = new THREE.Mesh(pg, gm); m.castShadow = true; D.add(m);
    }
    return { group, D, setT, clasps, topM, zTop, top, fore, head, tail, loose };
  }
  const back = makeLeaf(true), front = makeLeaf(false);
  const st = { X0, u: -1, hxB: 0, hzB: 0, aB: 0, hxF: 0, hzF: 0, aF: 0, apex: V3(), spineMid: V3(), spineN: V3(), TF: 0, TB: PT };
  const leafPt = (isBack, x, y, zD) => { const L = isBack ? { hx: st.hxB, hz: st.hzB, ang: st.aB } : { hx: st.hxF, hz: st.hzF, ang: st.aF }, lz = isBack ? -zD : zD, c = Math.cos(L.ang), s = Math.sin(L.ang); return V3(L.hx + x * c - lz * s, y, L.hz + x * s + lz * c); };
  // ---------- the spine: one rounded back of fixed arc length 0.10 between the two hinges; 5 raised bands; a rosette in each panel; head and tail bands of 12 red and gold stripes
  const spineM = new THREE.MeshStandardMaterial({ map: spineT, roughness: 0.4, metalness: 0.1, emissive: new THREE.Color("#ffffff"), emissiveMap: spineT, emissiveIntensity: 0.13 }); spineM.userData.noHatch = true;
  const spine = new THREE.Mesh(new THREE.BufferGeometry(), spineM); spine.castShadow = spine.receiveShadow = true; root.add(spine);
  const bandM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6 }); bandM.userData.noOutline = true;
  const bands = [0.0045, 0.3955].map((y) => { const o = new THREE.Mesh(new THREE.BufferGeometry(), bandM); o.castShadow = true; root.add(o); return [o, y]; });
  function buildSpine(u) {
    st.hxB = GAP * u; st.hzB = -DEPTH / 2 * (1 - u); st.hxF = -GAP * u; st.hzF = DEPTH / 2 * (1 - u);
    st.aB = 15 * DEG * u; st.aF = 165 * DEG * u;
    for (const lf of [back, front]) { lf.group.position.set(lf === back ? st.hxB : st.hxF, 0, lf === back ? st.hzB : st.hzF); lf.group.rotation.y = -(lf === back ? st.aB : st.aF); }
    const cx = st.hxB - st.hxF, cz = st.hzB - st.hzF, cl = Math.hypot(cx, cz), pxn = cz / cl, pzn = -cx / cl, ux = cx / cl, uz = cz / cl, ratio = cl / SPINE_S;
    let lo = 1e-4, hi = Math.PI - 1e-3; for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (Math.sin(m) / m > ratio) lo = m; else hi = m; }
    const th = (lo + hi) / 2, R = cl / (2 * Math.sin(th)), mx = (st.hxB + st.hxF) / 2, mz = (st.hzB + st.hzF) / 2, ccx = mx - pxn * R * Math.cos(th), ccz = mz - pzn * R * Math.cos(th);
    const arc = (phi, r = R) => [ccx + r * (pxn * Math.cos(phi) + ux * Math.sin(phi)), ccz + r * (pzn * Math.cos(phi) + uz * Math.sin(phi)), pxn * Math.cos(phi) + ux * Math.sin(phi), pzn * Math.cos(phi) + uz * Math.sin(phi)];
    const NA = 28, NJ = 160, bump = (y) => { let b = 0; for (const yb of BAND_Y) b += 0.0042 * Math.exp(-(((y - yb) / 0.0042) ** 2)); return b; };
    const g = gridGeo(NA, NJ, (i, j) => { const phi = -th + 2 * th * i / NA, y = BH * j / NJ, q = arc(phi), k = bump(y) * clamp(Math.sin(Math.PI * i / NA) * 3); return [q[0] + q[2] * k, y, q[1] + q[3] * k, 1 - i / NA, j / NJ]; }, V3(pxn, 0, pzn));
    spine.geometry.dispose(); spine.geometry = g;
    for (const [o, y] of bands) {   // 12 red and gold stripes along the band
      const pts = []; for (let i = 0; i <= 36; i++) { const q = arc(-th + 2 * th * i / 36, R - 0.003); pts.push(V3(q[0], y, q[1])); }
      const tg = taperedTube(new THREE.CatmullRomCurve3(pts), 0.0058, 0.0058, 36, 10), n = tg.attributes.position.count, cs = new Float32Array(n * 3), c1 = col("#a3232b"), c2 = col(GOLD.base), c3 = col(GOLD.light);
      for (let i = 0; i < n; i++) { const t = Math.floor(i / 11) / 36, stripe = Math.floor(t * 12 - 1e-6) % 2; const c = stripe ? c1 : c2; cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b; }
      tg.setAttribute("color", new THREE.BufferAttribute(cs, 3)); o.geometry.dispose(); o.geometry = tg; void c3;
    }
    const a0 = arc(0); st.apex = V3(a0[0], 0, a0[1]); st.spineN = V3(pxn, 0, pzn);
    st.TF = PT / 2 * sstep(0.12, 0.88, u); st.TB = PT - st.TF;
    st.X0 = X0 - 0.037 * u; back.setT(st.TB, st.X0); front.setT(st.TF, st.X0);
  }
  // ---------- a texture per page, the turning leaf, the glow
  const ph = pageTex("plain", 0, "R");
  for (const lf of [back, front]) { lf.topM.map = ph; lf.topM.emissive = col("#fff0c0"); lf.topM.emissiveMap = ph; lf.topM.emissiveIntensity = 0; lf.topM.roughness = 0.9; }
  const NXL = 16;
  const TX0 = X0 - 0.037, turnU = (i) => clamp(((TX0 + (X1 - TX0) * i / NXL) - X0) / (X1 - X0));
  const turnGeo = (mirror, hint) => gridGeo(NXL, 1, (i, j) => [TX0 + (X1 - TX0) * i / NXL, j ? Y1 : Y0, 0, mirror ? 1 - turnU(i) : turnU(i), j], hint);
  const tlA = paper({ map: ph, emissive: col("#fff0c0"), emissiveMap: ph, emissiveIntensity: 0 }), tlB = paper({ map: ph, emissive: col("#fff0c0"), emissiveMap: ph, emissiveIntensity: 0 });
  const tlF = new THREE.Mesh(turnGeo(false, V3(-Math.sin(15 * DEG), 0, Math.cos(15 * DEG))), tlA), tlK = new THREE.Mesh(turnGeo(true, V3(Math.sin(15 * DEG), 0, -Math.cos(15 * DEG))), tlB);
  for (const o of [tlF, tlK]) { o.frustumCulled = false; o.visible = false; o.receiveShadow = true; root.add(o); }
  const glowTex = canvasTex(128, 128, (g, w, h) => { const q = g.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, "rgba(255,240,192,1)"); q.addColorStop(0.35, "rgba(255,226,160,0.55)"); q.addColorStop(1, "rgba(255,226,160,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
  const glowCard = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); glowCard.scale.set(1.0, 1.0, 1); glowCard.position.set(0, 0.22, -0.07); glowCard.material.userData.noOutline = true; glowCard.userData.steam = true; glowCard.castShadow = false; root.add(glowCard);
  const light = new THREE.PointLight("#ffe2a0", 0, 1.6, 1.4); light.position.set(0, 0.2, 0.12); root.add(light);
  // ---------- the silk ribbon (crimson, 0.012, hanging 0.10 below the foot, a forked end) and the chain (16 small links)
  const ribM = new THREE.MeshStandardMaterial({ color: "#a8203a", roughness: 0.32, side: THREE.DoubleSide, emissive: col("#3a0a14"), emissiveIntensity: 0.4 }); ribM.userData.noOutline = true;
  const NR = 22, ribbon = new THREE.Mesh(gridGeo(2, NR, (i, j) => [i * 0.006 - 0.006, -j * 0.02, 0, i / 2, j / NR], V3(0, 0, 1)), ribM); ribbon.frustumCulled = false; ribbon.castShadow = false; root.add(ribbon);
  const linkG = new THREE.TorusGeometry(0.0034, 0.00105, 6, 14), linkM = mat("#2a2f38", { roughness: 0.45, metalness: 0.4 }); linkM.userData.noOutline = true;
  const links = []; for (let k = 0; k < 16; k++) { const o = new THREE.Mesh(linkG, linkM); o.scale.set(1.5, 1, 1); o.matrixAutoUpdate = true; o.castShadow = true; o.visible = S.chain !== false; root.add(o); links.push(o); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0048, 0.0013, 6, 14), linkM); ring.visible = S.chain !== false; root.add(ring);
  // ---------- the long roll: 13 row tiles of 4 fries pictures + 2 margin tiles on one sheet 0.26 wide, a wooden spindle with the sheet wound on it
  const NS = 10, tiles = [];
  const marginM = paper({ map: rollTex(-1), side: THREE.FrontSide }), rowMs = [];
  for (let r = -1; r <= 13; r++) {
    const rt = rollTex(r), m = paper({ map: rt, emissive: col("#fff0c0"), emissiveMap: rt, emissiveIntensity: 0, side: THREE.FrontSide }), mb = paper({ map: rollBack(), side: THREE.FrontSide });
    const g = gridGeo(2, NS, (i, j) => [i, j, 0, i / 2, 1 - j / NS], V3(0, 0, -1)), gb = gridGeo(2, NS, (i, j) => [i, j, 0, i / 2, j / NS], V3(0, 0, 1));
    const a = new THREE.Mesh(g, m), b = new THREE.Mesh(gb, mb); for (const o of [a, b]) { o.frustumCulled = false; o.visible = false; o.receiveShadow = true; o.castShadow = false; root.add(o); }
    tiles.push({ r, a, b, m0: r < 0 ? 0 : r > 12 ? ROLL_TOP + 13 * ROW : ROLL_TOP + r * ROW, m1: r < 0 ? ROLL_TOP : r > 12 ? ROLL_LEN : ROLL_TOP + (r + 1) * ROW });
  }
  void marginM; void rowMs;
  const capTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#e9d9b0"; g.fillRect(0, 0, w, h); const r0 = 0.32; g.strokeStyle = "rgba(110,80,45,0.75)"; g.lineWidth = 1.1; g.beginPath(); for (let i = 0; i <= 2200; i++) { const f = i / 2200, th = f * TAU * 20, r = (r0 + (1 - r0) * f) * 128; i ? g.lineTo(128 + r * Math.cos(th), 128 + r * Math.sin(th)) : g.moveTo(128 + r * Math.cos(th), 128 + r * Math.sin(th)); } g.stroke(); g.fillStyle = "#8a5a30"; g.beginPath(); g.arc(128, 128, 128 * r0, 0, TAU); g.fill(); g.strokeStyle = "#4a2e18"; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(128 - 128 * r0 * 0.8, 128); g.lineTo(128 + 128 * r0 * 0.8, 128); g.moveTo(128, 128 - 128 * r0 * 0.8); g.lineTo(128, 128 + 128 * r0 * 0.8); g.stroke(); });
  capTex.center.set(0.5, 0.5);
  const coil = new THREE.Group(), spin = new THREE.Group(); coil.add(spin); coil.visible = false; root.add(coil); coil.matrixAutoUpdate = false;
  const windM = paper({ map: rollBack(), color: "#f1e3bd" }), capM = paper({ map: capTex });
  const wound = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, ROLL_W, 44, 1, true).rotateZ(Math.PI / 2), windM); wound.castShadow = true; spin.add(wound);
  const capL = new THREE.Mesh(new THREE.CircleGeometry(1, 44).rotateY(-Math.PI / 2), capM), capR = new THREE.Mesh(new THREE.CircleGeometry(1, 44).rotateY(Math.PI / 2), capM); capL.position.x = -ROLL_W / 2 - 0.0006; capR.position.x = ROLL_W / 2 + 0.0006; spin.add(capL, capR);
  const woodM = mat("#8a5a30", { roughness: 0.55 }); const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ROLL_W + 0.05, 16).rotateZ(Math.PI / 2), woodM); spindle.castShadow = true; spin.add(spindle);
  for (const s of [-1, 1]) { const kn = new THREE.Mesh(new THREE.SphereGeometry(0.0185, 14, 10), woodM); kn.position.x = s * (ROLL_W / 2 + 0.03); kn.scale.x = 0.8; spin.add(kn); const ne = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0016, 6, 16).rotateY(Math.PI / 2), woodM); ne.position.x = s * (ROLL_W / 2 + 0.012); spin.add(ne); }
  const Q = new THREE.Quaternion(), Qi = new THREE.Quaternion();
  const rollCache = { key: "", pts: null };
  // the sheet's path in the book's frame, from the anchor (the foot of the right page) to the head at arc length Lrun
  function rollPath(Lrun, t, rollDir, apron, sc, drop0 = 0.30) {
    Q.copy(P.root.quaternion); Qi.copy(Q).invert();
    const up = V3(0, 1, 0).applyQuaternion(Qi), d = V3(rollDir[0], 0, rollDir[1]).normalize().applyQuaternion(Qi);
    const h = drop0 / sc, rb = 0.04 / sc, re = 0.02 / sc, D1 = apron[0] / sc, drop = apron[1] / sc, thick = 0.0012 / sc;
    const A = leafPt(true, 0.15, Y0, back.zTop(st.TB, 0.15) - 0.0006);   // the foot of the right page, on its face
    const poly = [A.clone()]; const add = (v) => poly.push(v.clone().add(A));
    const o = V3(); const nd = up.clone().multiplyScalar(-1);
    for (let k = 1; k <= 12; k++) add(nd.clone().multiplyScalar((h - rb) * k / 12));   // the hanging part
    const C = d.clone().multiplyScalar(rb).addScaledVector(up, -(h - rb));
    for (let k = 1; k <= 8; k++) { const f = k / 8 * Math.PI / 2; add(C.clone().addScaledVector(d, -rb * Math.cos(f)).addScaledVector(up, -rb * Math.sin(f))); }
    const g0 = d.clone().multiplyScalar(rb).addScaledVector(up, -h + thick);
    const ground = (x0, y0) => V3().addScaledVector(d, x0).addScaledVector(up, y0);
    const e = rb + D1;
    for (let k = 1; k <= 40; k++) add(ground(rb + (D1 - re) * k / 40, -h + thick));   // along the ground, to the step
    const Cc = ground(e - re, -h - re + thick);
    for (let k = 1; k <= 8; k++) { const f = k / 8 * Math.PI / 2; add(Cc.clone().addScaledVector(up, re * Math.cos(f)).addScaledVector(d, re * Math.sin(f))); }
    const re2 = 0.03 / sc;
    for (let k = 1; k <= 14; k++) add(ground(e + 0.004 / sc * Math.sin(k / 14 * Math.PI), -h - re - (drop - re - re2) * k / 14 + thick));   // down the step face, bowed a little
    const Cd = ground(e + re2, -h - drop + re2 + thick);
    for (let k = 1; k <= 8; k++) { const f = k / 8 * Math.PI / 2; add(Cd.clone().addScaledVector(d, -re2 * Math.cos(f)).addScaledVector(up, -re2 * Math.sin(f))); }
    const lastP = poly[poly.length - 1].clone();
    for (let k = 1; k <= 160; k++) poly.push(lastP.clone().addScaledVector(d, 0.02 / sc * k));
    void o; void g0;
    // arc length table
    const cum = [0]; for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + poly[i].distanceTo(poly[i - 1]));
    const swayA = 3 * DEG * Math.sin(TAU * 0.55 * t + 0.7), axis = V3().crossVectors(up, d).normalize();
    const at = (m) => {
      m = Math.min(m, cum[cum.length - 1]); let i = 1; while (i < cum.length - 1 && cum[i] < m) i++;
      const f = clamp((m - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])), p = poly[i - 1].clone().lerp(poly[i], f), tg = poly[i].clone().sub(poly[i - 1]).normalize();
      const wS = (1 - sstep(0.13, 0.35, m * sc)) * swayA;   // the hanging part sways 3 degrees, fading to nothing on the ground
      if (Math.abs(wS) > 1e-6) { p.sub(A).applyAxisAngle(axis, wS).add(A); tg.applyAxisAngle(axis, wS); }
      return { p, t: tg };
    };
    const npage = V3(-Math.sin(st.aB), 0, Math.cos(st.aB)), wpage = V3(Math.cos(st.aB), 0, Math.sin(st.aB));
    return { at, up, d, npage, wpage, A, axis, total: cum[cum.length - 1] };
  }
  const frameAt = (R, m) => {
    const { p, t: tg } = R.at(m), b = sstep(0, 0.35, m * (P.root.scale.y || 1)), upN = R.up;
    // hanging: the face toward d; on the ground: up. N follows the path's own turn, blended from the page's face at the anchor
    const Np = R.d.clone().multiplyScalar(-tg.dot(upN)).addScaledVector(upN, tg.dot(R.d)), N1 = R.npage.clone().lerp(Np, b).normalize();
    N1.addScaledVector(tg, -N1.dot(tg)).normalize(); const Wv = V3().crossVectors(N1, tg).normalize();
    return { p, t: tg, N: N1, W: Wv };
  };
  const frameForPage = (isBack) => isBack;
  void frameForPage;
  const spreadAt = (sp, p) => { const name = Array.isArray(sp) ? sp[Math.min(p, sp.length - 1)] : (p === 0 ? sp : "plain"); return { L: { kind: "plain", seed: 2 * p }, R: { kind: name, seed: 2 * p + 1 }, name }; };
  const setPage = (m, key, side, gl) => { const tx = pageTex(key.kind, key.seed, side); m.map = tx; m.emissiveMap = tx; m.emissiveIntensity = 0.30 * gl; };
  const tmpA = V3(), tmpB = V3();
  let ribbonLast = "";
  return {
    grip: 0,
    apply(ps, t) {
      if (Array.isArray(ps.roll)) P.root.rotation.z = -(ps.tilt ?? 0) * DEG;   // spec.roll is the sheet's direction here, not the z lean the engine reads
      const u = clamp(ps.open ?? 0), pg = Math.max(0, ps.page ?? 0), gl = clamp(ps.glow ?? 0), run = clamp(ps.run ?? 0), sc = Math.max(0.0001, P.root.scale.y || 1);
      if (Math.abs(u - st.u) > 1e-5) { buildSpine(u); st.u = u; }
      Q.copy(P.root.quaternion); Qi.copy(Q).invert();
      const co = sstep(0.0, 0.12, u);   // the clasps hang open while the book is open
      for (const lf of [back]) lf.clasps.forEach(({ par, cl }, k) => { cl.rotation.y = -Math.PI / 2 * co; par.rotation.z = -(0.28 * co + 0.02 * Math.sin(TAU * 0.5 * t + k * 2)) * co; });
      // ---- the pages: the spread, a turning leaf
      const sp = ps.spread ?? S.spread ?? "plain", f0 = Math.floor(pg + 1e-6), fr = pg - f0, turning = fr > 0.001 && fr < 0.999, pRest = fr >= 0.999 ? f0 + 1 : f0;
      const cur = spreadAt(sp, turning ? f0 : pRest), nxt = spreadAt(sp, f0 + 1), glo = gl * sstep(0.25, 0.7, u);
      if (!turning) { setPage(back.topM, cur.R, "R", glo); setPage(front.topM, cur.L, "L", glo); tlF.visible = tlK.visible = false; }
      else {
        setPage(back.topM, nxt.R, "R", glo); setPage(front.topM, cur.L, "L", glo);
        setPage(tlA, cur.R, "R", glo); setPage(tlB, nxt.L, "L", glo);
        const e = fr * fr * (3 - 2 * fr), psiR = (15 + 150 * e) * DEG, lag = 0.30 * Math.sin(Math.PI * fr) * 150 * DEG, G = leafPt(true, st.X0, 0, back.zTop(st.TB, st.X0)), dx = (X1 - st.X0) / NXL;
        const posF = tlF.geometry.attributes.position, posK = tlK.geometry.attributes.position; let px = G.x + 0.0005, pz = G.z + 0.0006;
        for (let i = 0; i <= NXL; i++) {
          if (i > 0) { const x = (i - 0.5) / NXL, psi = psiR - lag * Math.pow(x, 1.4); px += dx * Math.cos(psi); pz += dx * Math.sin(psi); }
          for (let j = 0; j < 2; j++) { const k = j * (NXL + 1) + i, y = j ? Y1 : Y0; posF.setXYZ(k, px, y, pz); posK.setXYZ(k, px, y, pz); }
        }
        posF.needsUpdate = posK.needsUpdate = true; tlF.geometry.computeVertexNormals(); tlK.geometry.computeVertexNormals(); tlF.visible = tlK.visible = u > 0.5;
      }
      glowCard.material.opacity = 0.4 * glo; glowCard.visible = glo > 0.001; light.intensity = 1.4 * glo;
      // ---- the ribbon: down the gutter, then 0.10 below the foot with the forked end
      const rk = `${u.toFixed(4)}|${t.toFixed(3)}`;
      if (rk !== ribbonLast) {
        ribbonLast = rk; const pa = ribbon.geometry.attributes.position, tot = 0.392 + 0.10, sw = Math.sin(TAU * 0.6 * t + 0.3);
        const gut = (y) => { const B = leafPt(true, st.X0, y, back.zTop(st.TB, st.X0)), F = leafPt(false, st.X0, y, front.zTop(st.TF, st.X0)); return B.add(F).multiplyScalar(0.5); };
        const G0 = gut(0);
        for (let j = 0; j <= NR; j++) {
          const y = 0.392 - tot * j / NR; let c;
          if (y >= 0) { c = gut(y); c.z += 0.0014; } else { const f = -y / 0.10; c = G0.clone(); c.z += 0.0014 + 0.003 * f * f; c.x += 0.004 * sw * f * f; c.y = y; }
          for (let i = 0; i < 3; i++) { let yy = y; if (j === NR && i === 1) yy += 0.008; pa.setXYZ(j * 3 + i, c.x + (i - 1) * 0.006, yy, c.z); }
        }
        pa.needsUpdate = true; ribbon.geometry.computeVertexNormals(); ribbon.visible = true;
      }
      // ---- the chain: 16 links from the spine's foot, hanging by gravity or drawn to spec.chainTo (the rope belt)
      if (S.chain !== false) {
        const dnL = V3(0, -1, 0).applyQuaternion(Qi).normalize(), S0 = V3(st.apex.x, 0.003, st.apex.z), Lc = 0.17, tsw = Math.sin(TAU * 0.7 * t + 1.1);
        let Ev = null, sag = 0; if (S.chainTo) { Ev = V3(...S.chainTo); const dd = Ev.distanceTo(S0); if (dd > Lc) Ev = S0.clone().lerp(Ev, Lc / dd); else sag = Math.sqrt((Lc * Lc - dd * dd) * 3 / 16); }
        const pt = (tau) => { const o = Ev ? S0.clone().lerp(Ev, tau).addScaledVector(dnL, sag * 4 * tau * (1 - tau)) : S0.clone().addScaledVector(dnL, Lc * tau); if (!Ev) o.x += 0.002 * tsw * tau * tau; return o; };
        links.forEach((o, k) => {
          const a = pt(k / 16), b = pt((k + 1) / 16), mid = a.clone().add(b).multiplyScalar(0.5), tg = b.clone().sub(a).normalize();
          o.position.copy(mid); const qa = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), tg); const roll = new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), k % 2 ? Math.PI / 2 : 0); o.quaternion.copy(qa.multiply(roll));
        });
        ring.position.copy(pt(1));
      }
      // ---- the long roll
      const longOn = (turning ? cur.name : cur.name) === "long", rollOn = u > 0.5 && (run > 0.0005 || longOn), Lrun = ROLL_LEN * run;
      for (const tl of tiles) { tl.a.visible = tl.b.visible = false; } coil.visible = false;
      if (rollOn) {
        const rd = S.rollDir ?? (Array.isArray(ps.roll) ? ps.roll : Array.isArray(S.roll) ? S.roll : [0.15, 1]), apron = S.apron ?? [0.96, 0.16], R = rollPath(Lrun, t, rd, apron, sc, S.drop0 ?? 0.30);
        const thick = 0.0006;
        for (const tl of tiles) {
          const vis = Lrun > tl.m0 + 1e-4; tl.a.visible = tl.b.visible = vis; if (!vis) continue;
          const mEnd = Math.min(tl.m1, Lrun), frac = (mEnd - tl.m0) / (tl.m1 - tl.m0);
          const pa = tl.a.geometry.attributes.position, pb = tl.b.geometry.attributes.position, ua = tl.a.geometry.attributes.uv, ub = tl.b.geometry.attributes.uv;
          for (let j = 0; j <= NS; j++) {
            const m = tl.m0 + (mEnd - tl.m0) * j / NS, F = frameAt(R, m);
            for (let i = 0; i < 3; i++) {
              const k = j * 3 + i; tmpA.copy(F.p).addScaledVector(F.W, (i - 1) * ROLL_W / 2); tmpB.copy(tmpA).addScaledVector(F.N, -thick); tmpA.addScaledVector(F.N, thick);
              pa.setXYZ(k, tmpA.x, tmpA.y, tmpA.z); pb.setXYZ(k, tmpB.x, tmpB.y, tmpB.z); ua.setXY(k, i / 2, 1 - frac * j / NS); ub.setXY(k, i / 2, frac * j / NS);
            }
          }
          tl.a.material.emissiveIntensity = 0.3 * glo;
          pa.needsUpdate = pb.needsUpdate = ua.needsUpdate = ub.needsUpdate = true; tl.a.geometry.computeVertexNormals(); tl.b.geometry.computeVertexNormals();
        }
        // the coil: the rest of the sheet wound on its spindle, rolling (R from 0.0375 to the bare spindle 0.012)
        const w = ROLL_LEN * (1 - run), Rc = Math.sqrt(0.012 * 0.012 + (0.0375 * 0.0375 - 0.012 * 0.012) * w / ROLL_LEN), F = frameAt(R, Lrun), c = F.p.clone().addScaledVector(F.N, Rc);
        coil.matrix.makeBasis(F.W, F.N, F.t).setPosition(c); coil.matrixWorldNeedsUpdate = true; coil.visible = true;
        wound.scale.set(1, Rc, Rc); wound.visible = Rc > 0.0125; capL.scale.set(1, Rc, Rc); capR.scale.set(1, Rc, Rc);
        const kk = Rc / 0.0375; capTex.repeat.set(kk, kk); capTex.offset.set(0.5 * (1 - kk), 0.5 * (1 - kk));
        spin.rotation.x = -(2 / ((0.0375 * 0.0375 - 0.012 * 0.012) / ROLL_LEN)) * (0.0375 - Rc);
      }
    },
  };
};

// ================================================================ THE CROOK (origin: the spike's tip; the volute opens toward +z, drawn in the y-z plane)
const CROOK = { H: 1.50, yc: 1.365, zc: 0.12, R0: 0.12, Rend: 0.055, turns: 1.6 };
const crookWear = (x, y, z) => {
  const hand = sstep(0.47, 0.53, y) * (1 - sstep(0.73, 0.79, y)) * 0.8;   // worn to bronze at y 0.50-0.75
  let k = 0; for (const yk of [0.50, 0.95, 1.12, 1.15]) k = Math.max(k, 0.7 * Math.exp(-(((y - yk) / 0.012) ** 2)));   // and on the knops
  const volute = Math.max(0, 0.45 * Math.exp(-(((Math.hypot(z - CROOK.zc, y - CROOK.yc) - 0.12) / 0.02) ** 2)) * (z > 0.14 ? 1 : 0));   // the outer curve where a hand might lie
  return clamp(Math.max(hand, k, volute) * (0.75 + 0.5 * rr(Math.floor(y * 90) * 1.7 + Math.floor(z * 90) * 3.3)));
};
const voluteAt = (th) => { const f = th / (CROOK.turns * TAU), r = CROOK.R0 + (CROOK.Rend - CROOK.R0) * f; return { y: CROOK.yc + r * Math.sin(th), z: CROOK.zc - r * Math.cos(th), r, ny: Math.sin(th), nz: -Math.cos(th), ty: Math.cos(th), tz: Math.sin(th) }; };
function leafShape(L, w) { const s = new THREE.Shape(); s.moveTo(0, -w / 2); s.bezierCurveTo(0.35 * L, -w * 0.95, 0.95 * L, -w * 0.45, L, -0.4 * L); s.bezierCurveTo(0.8 * L, -0.02 * L, 0.5 * L, w * 0.95, 0, w / 2); s.closePath(); return s; }
function flatLeaf(L, w, y, z, psi, thick = 0.0045) {   // a leaf in the y-z plane: a along (cos psi -> z, sin psi -> y), thickness along x
  const g = ext(leafShape(L, w), thick, 0.0007); g.translate(0, 0, -thick / 2); g.rotateY(-Math.PI / 2);   // shape (a, b) -> (z, y)
  const m = new THREE.Matrix4().makeRotationX(-psi), q = g.clone(); q.applyMatrix4(m); q.translate(0, y, z); return q;   // rotate about x: (z, y) turns by psi
}
const nickcrook = (P) => {
  const S = P.spec, W = P.whole, root = new THREE.Group(); W.add(root);
  const gm = goldMat(), parts = [];
  const prof = (pts) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  // the shaft 0.030 (r 0.015) from the ferrule to the volute: ONE tube with the stem
  const sp = []; for (let i = 0; i <= 30; i++) sp.push(V3(0, 0.12 + (CROOK.yc - 0.12) * i / 30, 0));
  const NT = 150; for (let i = 1; i <= NT; i++) { const v = voluteAt(i / NT * CROOK.turns * TAU); sp.push(V3(0, v.y, v.z)); }
  const curve = new THREE.CatmullRomCurve3(sp, false, "centripetal"), fs = (CROOK.yc - 0.12) / curve.getLength();
  const rAt = (t) => t < fs ? 0.015 : lerp(0.015, 0.006, Math.pow((t - fs) / (1 - fs), 0.85));
  parts.push(solid(taperedTube(curve, 0.015, 0.006, 260, 14, rAt)));
  // 3 ring knops (y 0.50, 0.95, 1.12): a turned bead between two fillets
  for (const yk of [0.50, 0.95, 1.12]) parts.push(solid(place(prof([[0.0149, -0.016], [0.0185, -0.013], [0.0182, -0.009], [0.0235, -0.006], [0.0252, 0], [0.0235, 0.006], [0.0182, 0.009], [0.0185, 0.013], [0.0149, 0.016]]), 0, yk, 0)));
  // the 6-lobed knop r 0.04 at y 1.15 with 6 small red stones
  const kn = new THREE.SphereGeometry(1, 48, 28), kp = kn.attributes.position;
  for (let i = 0; i < kp.count; i++) { const x = kp.getX(i), y = kp.getY(i), z = kp.getZ(i), az = Math.atan2(z, x), lobe = 1 + 0.15 * Math.cos(6 * az) * Math.hypot(x, z); kp.setXYZ(i, x * 0.04 * lobe, y * 0.036, z * 0.04 * lobe); }
  kn.computeVertexNormals(); parts.push(solid(place(kn, 0, 1.15, 0)));
  parts.push(solid(place(prof([[0.0149, -0.04], [0.019, -0.034], [0.026, -0.027], [0.03, -0.02]]), 0, 1.15, 0)), solid(place(prof([[0.03, 0.02], [0.026, 0.027], [0.019, 0.034], [0.0149, 0.04]]), 0, 1.15, 0)));
  const stones = []; for (let k = 0; k < 6; k++) { const az = k * Math.PI / 3, rx = Math.cos(az) * 0.0465, rz = -Math.sin(az) * 0.0465, q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), V3(rx, 0, rz).normalize()), e = new THREE.Euler().setFromQuaternion(q, "YXZ"); parts.push(solid(place(new THREE.TorusGeometry(0.0082, 0.0014, 6, 18), rx, 1.15, rz, e.x, e.y, e.z))); stones.push([rx * 1.003, rz * 1.003, e]); }
  // the leaf crockets (7), the curled leaf end, the 6-petal flower inside the curl
  for (let k = 0; k < 7; k++) { const th = (0.34 + 1.62 * k / 6) * Math.PI, v = voluteAt(th), tr = rAt(fs + (1 - fs) * th / (CROOK.turns * TAU)), L = 0.040 - 0.016 * (th / (CROOK.turns * TAU)) * 1.6, psi = Math.atan2(v.ny, v.nz); parts.push(solid(flatLeaf(L, L * 0.5, v.y + v.ny * tr * 0.7, v.z + v.nz * tr * 0.7, psi))); }
  const te = voluteAt(CROOK.turns * TAU); parts.push(solid(flatLeaf(0.05, 0.024, te.y, te.z, Math.atan2(te.ty, te.tz), 0.005)));
  for (let k = 0; k < 6; k++) { const pg = ext((() => { const s = new THREE.Shape(); s.absellipse(0, 0.016, 0.0095, 0.0155, 0, TAU, false, 0); return s; })(), 0.004, 0.0008); pg.translate(0, 0, -0.002); pg.rotateZ(k * Math.PI / 3); pg.rotateY(-Math.PI / 2); parts.push(solid(pg.translate(0, CROOK.yc, CROOK.zc))); }
  parts.push(solid(place(new THREE.SphereGeometry(0.0065, 14, 10), 0, CROOK.yc, CROOK.zc, 0, 0, 0, [1.4, 1, 1])));   // the flower's pearl
  const stalk = taperedTube(new THREE.CatmullRomCurve3([V3(0, te.y, te.z), V3(0, (te.y + CROOK.yc) / 2 - 0.004, (te.z + CROOK.zc) / 2), V3(0, CROOK.yc, CROOK.zc)]), 0.0035, 0.0035, 8, 8); parts.push(solid(stalk));
  const ferrule = prof([[0.0108, 0.096], [0.0175, 0.1], [0.0178, 0.112], [0.0215, 0.115], [0.0215, 0.121], [0.0178, 0.124], [0.0172, 0.136], [0.0155, 0.142], [0.0149, 0.148]]);
  parts.push(solid(ferrule));
  const gold = mergeGeometries(parts.map((p) => paintGold(p, crookWear))), body = new THREE.Mesh(gold, gm); body.castShadow = body.receiveShadow = true; root.add(body);
  // the iron spike 0.10 with rust at its joint
  const spike = paintIron(solid(prof([[0.0005, 0], [0.0018, 0.004], [0.004, 0.028], [0.0078, 0.066], [0.0108, 0.1]])), (x, y) => clamp((y - 0.07) / 0.03) * 0.8);
  const sm = new THREE.Mesh(spike, new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, metalness: 0.2 })); sm.castShadow = true; root.add(sm);
  const ruby = new THREE.MeshStandardMaterial({ color: "#b3202e", roughness: 0.16, emissive: col("#5a0c14"), emissiveIntensity: 0.5 }); ruby.userData.noOutline = true;
  for (const [rx, rz, e] of stones) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.0066, 12, 9), ruby); o.scale.set(1, 1, 0.55); o.position.set(rx, 1.15, rz); o.rotation.set(e.x, e.y, e.z); root.add(o); const hl = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 6, 5), soft({ color: "#ffd0d0" })); hl.position.set(rx + (rz > 0 ? 0.0015 : 0.0015) - 0.0025, 1.1535, rz * 1.04); hl.userData.steam = true; root.add(hl); }
  // PLANTED: a snow collar r 0.06 round the shaft at the ground (y 0.10) with a dimple; hidden while it is carried
  const snowM = mat("#e9f0fc", { roughness: 1 }); snowM.userData.noOutline = true;
  const collar = new THREE.Group(); const mound = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, Math.PI / 2), snowM); mound.scale.y = 0.34; mound.position.y = 0.1; mound.receiveShadow = true; collar.add(mound);
  const dimple = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.006, 8, 24).rotateX(Math.PI / 2), mat("#b9cdf0", { roughness: 1 })); dimple.position.y = 0.1; dimple.userData.steam = true; collar.add(dimple); root.add(collar);
  return { grip: 0, apply(ps) { collar.visible = !!(ps.planted ?? S.planted); } };
};

// ================================================================ THE SACK (origin: the bottom centre; the mouth at y 0.30)
const SACK_PROF = [[0, 0], [0.05, 0.004], [0.085, 0.02], [0.108, 0.06], [0.112, 0.11], [0.1, 0.16], [0.078, 0.21], [0.058, 0.245], [0.049, 0.262], [0.054, 0.276], [0.066, 0.29], [0.07, 0.30]];   // [r, y]
let LINEN_T = null;
const linenTex = () => LINEN_T || (LINEN_T = canvasTex(1024, 512, (g, W, H) => {   // u 0..1 round (0.5 = the front), v up 0..0.30; 1625 px per metre
  g.fillStyle = "#d9c9a3"; g.fillRect(0, 0, W, H);
  g.lineWidth = 1; for (let y = 0; y < H; y += 2.4) { g.strokeStyle = `rgba(120,96,56,${0.10 + 0.12 * rr(y * 1.3)})`; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let x = 0; x < W; x += 2.4) { g.strokeStyle = `rgba(255,248,226,${0.10 + 0.14 * rr(x * 1.7 + 3)})`; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let n = 0; n < 90; n++) { g.fillStyle = `rgba(140,110,64,${0.05 + 0.08 * rr(n * 3.3)})`; g.beginPath(); g.ellipse(rr(n * 1.7) * W, rr(n * 2.9 + 1) * H, 3 + 12 * rr(n + 5), 1 + 4 * rr(n + 8), 0, 0, TAU); g.fill(); }
  const pw = 0.07 * 1625, ph = 0.075 * 1700, px = W / 2 - pw / 2 + 36, py = H * (1 - 0.40) - ph / 2;   // a darker patch with 12 stitches (3 a side)
  g.fillStyle = "#c4ad7c"; g.fillRect(px, py, pw, ph); g.strokeStyle = "rgba(90,62,34,0.7)"; g.lineWidth = 2; g.strokeRect(px, py, pw, ph);
  g.strokeStyle = "#4a3020"; g.lineWidth = 3.2; g.lineCap = "round";
  for (let k = 0; k < 3; k++) { const f = (k + 0.5) / 3; for (const [x0, y0, x1, y1] of [[px + pw * f - 8, py + 7, px + pw * f + 8, py + 7], [px + pw * f - 8, py + ph - 7, px + pw * f + 8, py + ph - 7], [px + 7, py + ph * f - 8, px + 7, py + ph * f + 8], [px + pw - 7, py + ph * f - 8, px + pw - 7, py + ph * f + 8]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } }
}));
const nicksack = (P) => {
  const S = P.spec, W = P.whole, root = new THREE.Group(); W.add(root);
  const cloth = new THREE.MeshStandardMaterial({ map: linenTex(), roughness: 1, side: THREE.DoubleSide }); cloth.userData.noHatch = true;
  const NAZ = 44, NY = 56, bodyGeo = new THREE.BufferGeometry(), body = new THREE.Mesh(bodyGeo, cloth); body.castShadow = body.receiveShadow = true; root.add(body);
  const lin = (y) => { for (let i = 1; i < SACK_PROF.length; i++) if (y <= SACK_PROF[i][1]) { const [r0, y0] = SACK_PROF[i - 1], [r1, y1] = SACK_PROF[i]; const f = (y - y0) / (y1 - y0), s = f * f * (3 - 2 * f); return r0 + (r1 - r0) * (0.5 * f + 0.5 * s); } return SACK_PROF[SACK_PROF.length - 1][0]; };
  const BULGE = [[30, 0.10, 0.013], [-52, 0.165, 0.011], [95, 0.075, 0.012]], EDGES = [[-22, 0.05], [12, 0.07], [60, 0.125], [-78, 0.12], [118, 0.095]];   // 3 round bulges, 5 coin edges (az degrees from the front, y)
  const cordM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6 }); cordM.userData.noOutline = true;
  const cordMesh = new THREE.Mesh(new THREE.BufferGeometry(), cordM); cordMesh.castShadow = true; root.add(cordMesh);
  const rimM = new THREE.MeshStandardMaterial({ map: linenTex(), roughness: 1, color: "#e9dcb6" }); rimM.userData.noHatch = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.0085, 8, 40).rotateX(Math.PI / 2), rimM); rim.castShadow = true; root.add(rim);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(0.066, 32).rotateX(-Math.PI / 2), paper({ color: "#2a1c12" })); root.add(dark);
  const coinM = mat("#f2c64a", { roughness: 0.3, metalness: 0.35 }), mandM = mat("#f08a1e", { roughness: 0.5 }), nutM = mat("#b08a5a", { roughness: 0.8 }), leafM = mat("#4f7a3a", { roughness: 0.6 });
  const items = [];   // 3 coins, 1 mandarin, 2 walnuts (E's pieces at their sizes: coin 0.048 x 0.007, mandarin 0.058, walnut 0.036 x 0.030)
  const coin = (x, z, ry, rx, order) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.007, 28), coinM); o.rotation.set(rx, ry, 0.0); o.userData = { x, z, order }; o.castShadow = true; root.add(o); items.push(o); return o; };
  coin(-0.03, 0.012, 0.3, 1.15, 5); coin(0.028, -0.02, -0.5, 0.95, 4); coin(0.0, 0.034, 1.0, 1.35, 2);
  const mand = new THREE.Mesh(new THREE.SphereGeometry(0.029, 20, 14), mandM); mand.scale.y = 0.88; mand.userData = { x: 0.012, z: -0.004, order: 0 }; mand.castShadow = true; root.add(mand); items.push(mand);
  const cal = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.007, 0.003, 5), leafM); cal.userData.steam = true; mand.add(cal); cal.position.y = 0.0255;
  for (const [x, z, o2] of [[-0.036, -0.026, 3], [0.04, 0.03, 1]]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), nutM); w.scale.set(1, 0.83, 0.9); w.userData = { x, z, order: o2 }; w.castShadow = true; root.add(w); items.push(w); }
  let last = -1;
  function build(s) {   // s 0 (full) .. 1 (emptied to 0.4)
    const hs = 1 - 0.3 * s, pos = new Float32Array((NAZ + 1) * (NY + 1) * 3), uv = new Float32Array((NAZ + 1) * (NY + 1) * 2), idx = [];
    const shape = (y) => { const f = y / 0.30; return { x: 0.05 * s * f * f * f, r: 1 + 0.12 * s * Math.pow(1 - f, 2) - 0.22 * s * sstep(0.7, 1, f) }; };
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NAZ; i++) {
      const yv = 0.30 * j / NY, az = (i / NAZ - 0.5) * TAU, r0 = lin(yv), sh = shape(yv);
      let d = 0; for (const [a, by, amp] of BULGE) { const da = Math.atan2(Math.sin(az - a * DEG), Math.cos(az - a * DEG)) * r0 / 0.035, dy = (yv - by * hs) / 0.035; d += amp * (1 - 0.4 * s) * Math.exp(-(da * da + dy * dy)); }
      for (const [a, by] of EDGES) { const da = Math.atan2(Math.sin(az - a * DEG), Math.cos(az - a * DEG)) * r0 / 0.03, dy = (yv - by * hs) / 0.006; d += 0.0055 * (1 - 0.4 * s) * Math.exp(-(da * da + dy * dy)); }
      d += (0.003 + 0.007 * s) * Math.sin(az * 7 + yv * 26 + rr(i % 5) * 0.4) * sstep(0.12, 0.28, yv) + 0.002 * Math.sin(az * 3 + yv * 9);
      const r = (r0 * sh.r + d) * (yv < 0.004 ? yv / 0.004 : 1), yy = yv * hs, k = j * (NAZ + 1) + i;
      pos[k * 3] = Math.sin(az) * r + sh.x; pos[k * 3 + 1] = yy; pos[k * 3 + 2] = Math.cos(az) * r; uv[k * 2] = i / NAZ; uv[k * 2 + 1] = yv / 0.30;
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NAZ; i++) { const a = j * (NAZ + 1) + i, b = a + 1, c = a + NAZ + 1, e = c + 1; idx.push(a, c, b, b, c, e); }
    bodyGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); bodyGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); bodyGeo.setIndex(idx); bodyGeo.computeVertexNormals(); bodyGeo.computeBoundingSphere();
    const yM = 0.30 * hs, xM = shape(0.30).x, rM = 0.07 * (1 - 0.22 * s); rim.position.set(xM, yM, 0); rim.scale.set(rM / 0.07, 1, rM / 0.07); dark.position.set(xM, yM - 0.012, 0); dark.scale.set(rM / 0.07, 1, rM / 0.07);
    // the cord: 2 turns round the neck (y 0.262), a knot at the front, 2 ends with tassels; red and gold strands twisted
    const yn = 0.262 * hs, xn = shape(0.262).x, rn = lin(0.262) * shape(0.262).r + 0.0035, pts = [];
    for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 2 + Math.PI / 2 + 0.2; pts.push(V3(xn + Math.sin(a) * (rn + 0.0007 * (i / 60)), yn - 0.004 + 0.0075 * (i / 60) + 0.0015 * Math.sin(i * 1.3), Math.cos(a) * (rn + 0.0007 * (i / 60)))); }
    const ends = []; for (const [sx, len, cur] of [[-1, 0.075, 0.012], [1, 0.058, -0.01]]) { const e = []; for (let i = 0; i <= 14; i++) { const f = i / 14; e.push(V3(xn + sx * (0.008 + cur * f * f), yn + 0.0045 - len * f * 0.98, rn + 0.004 + 0.012 * Math.sin(f * 3) * 0.3)); } ends.push(e); }
    const geoParts = [[taperedTube(new THREE.CatmullRomCurve3(pts), 0.0034, 0.0034, 120, 8), "twist"], ...ends.map((e) => [taperedTube(new THREE.CatmullRomCurve3(e), 0.0034, 0.0030, 20, 8), "twist"]), [place(new THREE.SphereGeometry(0.0072, 12, 9), xn, yn + 0.003, rn + 0.004, 0, 0, 0, [1.2, 0.9, 0.9]), "gold"]];
    for (const e of ends) { const q = e[e.length - 1]; geoParts.push([place(new THREE.SphereGeometry(0.0056, 10, 8), q.x, q.y - 0.004, q.z), "gold"]); for (let f = 0; f < 5; f++) geoParts.push([place(new THREE.CylinderGeometry(0.0009, 0.0007, 0.02, 4), q.x + (f - 2) * 0.0022, q.y - 0.016, q.z), "red"]); }
    const CR = col("#a3232b"), CG = col(GOLD.base), CL = col(GOLD.light);
    const cg = mergeGeometries(geoParts.map(([p, kind]) => { const g = p, n = g.attributes.position.count, cs = new Float32Array(n * 3); if (!g.attributes.normal) g.computeVertexNormals(); for (let i = 0; i < n; i++) { const c = kind === "twist" ? ((Math.floor(i / 9) % 2) ? CR : CG) : kind === "red" ? CR : CG, lit = clamp(g.attributes.normal.getX(i) * KEY.x + g.attributes.normal.getY(i) * KEY.y + g.attributes.normal.getZ(i) * KEY.z), cc = c.clone(); if (lit > 0.8) cc.lerp(CL, 0.4); else if (lit < 0.2) cc.multiplyScalar(0.75); cs[i * 3] = cc.r; cs[i * 3 + 1] = cc.g; cs[i * 3 + 2] = cc.b; } g.setAttribute("color", new THREE.BufferAttribute(cs, 3)); return solid(g); }));
    cordMesh.geometry.dispose(); cordMesh.geometry = cg;
    // what shows in the mouth: 6 at full, fewer as it empties, sinking
    const shown = Math.max(1, Math.round(6 - 5 * s)), sink = 0.03 * s;
    for (const o of items) { const ud = o.userData; o.visible = ud.order < shown; const yI = yM + (o === mand ? 0.002 : o.geometry.type === "CylinderGeometry" ? 0.008 : 0.0) - sink; o.position.set(xM + ud.x * (rM / 0.07), yI + (o.geometry.type === "SphereGeometry" ? 0.01 : 0), ud.z * (rM / 0.07)); }
  }
  return { grip: 0, apply(ps) { const full = clamp(ps.full ?? 1, 0.4, 1), s = clamp((1 - full) / 0.6); if (Math.abs(s - last) > 1e-4) { last = s; build(s); } } };
};

export const KRAMPUS_NICK_KINDS = { goldenbook, nickcrook, nicksack };
// hand points in each prop's own frame (metres from its origin, before rot and scale), for arm poses { prop, grip: "name" }
export const KRAMPUS_NICK_GRIPS = {
  goldenbook: { spineL: [-0.022, 0.22, 0], foreR: [0.30, 0.22, 0], thumbR: [0.255, 0.075, 0.05], underL: [0.04, 0.05, -0.06], chain: [-0.02, 0.003, 0] },
  nickcrook: { fist: [0, 0.60, 0], planted: [0, 0.10, 0], knop: [0, 1.12, 0], top: [0, 1.30, 0] },
  nicksack: { neck: [0, 0.262, 0], bellyL: [-0.11, 0.11, 0.02], bellyR: [0.11, 0.11, 0.02], base: [0, 0.0, 0] },
};
export const KRAMPUS_NICK_STATE = { goldenbook: { open: 0, page: 0, glow: 0, run: 0 }, nickcrook: {}, nicksack: { full: 1 } };
