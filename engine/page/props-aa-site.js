// Ancient aliens shared kit (13 Nov 2026), site: the real-scale building-site pieces Spud stands beside (task T2,
// storyboards/series/ancient-aliens/kit/briefs/T2.md; palette and sizes in kit/BOARD.md). Metres; origin the bottom centre and
// the front +z unless said; world axes for Giza: north -z, south +z, east +x. Every stone mark (chisel strokes, pits,
// holes, chips, stains, fossil specks) is drawn once from a hash of its index: no tiling texture, no Math.random, no clock.
// Stone faces come from three hand-drawn atlases (core, weathered, casing; 36 different faces each, mirrored at random)
// and every block also has its own chipped or rounded geometry and its own tint. Bench: storyboards/series/ancient-aliens/
// kit/bench (make-aa-site.mjs, aa-site-sheet.png). A param propState has no default for (dust, draw) is undefined until
// its first set: seed it with a dur-0 set at 0 (the prop also reads spec.<name> as its start value).
//
//   limeblock   one limestone block. spec.size [1.3, 1.05, 1.3] (w x, h, d z), spec.look "core" (fresh rough-sawn yellowish
//               #d8bd7a, chisel marks, chipped edges) | "weathered" (#b89a6a, rounded pitted edges, a few holes) | "casing"
//               (white #f2efe6, five smooth faces, the front face +z sloped at 51.84 deg from the ground: the bottom is d
//               deep, the top d - h / tan 51.84 = 0.475 deep at the default size, flush with the back), spec.seed (1).
//               Origin the middle of its bottom. SOLID; the top is standable at y h (1.05). GRIPS none (a ship's beam carries
//               it: tween the engine's own y). dust 0..1 (seed it): a ring of pale stone dust puffs rolls out from under it
//               along the ground from 0.72 to 1.6 m (an inner ring lags to 1.37), grows, then thins to nothing at 1; it is
//               drawn at the block's foot, so use it with y 0 (the landing: tween y down, then dust 0 -> 1 over ~1.2 s).
//               The puffs are see-through sprites (userData.steam).
//   pyramidbase a 36 m wide (x -18..18) section of the Great Pyramid's bottom, origin the middle of its foot line (y 0, z 0),
//               the face rising away toward -z. SOLID.
//               spec.state "today" (default): spec.courses (8) stepped courses of weathered blocks, each block its own
//               chipped box: course 0 is 1.5 high, the rest 0.9..1.2; each course is set back by the height below it /
//               tan 51.84 (course 1 front at z -1.18), so 8 courses reach about y 8.9 and z -7. Joints 3 cm open.
//               Sand drifts (up to 0.35 high) lie in the steps against each riser and along the foot (to z +1.0); the
//               drifts are soft (userData.solid false, feet may sink into them). spec.gap [x] leaves the course-0 slot
//               x-0.7..x+0.7 empty, 1.45 deep from the foot line: a limeblock (default size) stands in it at
//               { x: gapX, z: -0.72 } with ~5 cm clear at the sides and back; the slot is open above in front of course 1
//               (z > -1.18) and roofed by course 1 (y 1.5) behind that. Fallen
//               blocks (4, 0.8..1.4 m) lie at x about -15.2, -9.6, 7.8, 13.6 (z 1.3..2.4) and rubble (about 60 stones,
//               6..32 cm) at z 0.15..3; nothing lies on the ground within 3 m of the gap x (fallen blocks move 7 m away
//               from it) and beyond z 3.2. spec.rubble false drops the fallen blocks and rubble. spec.seed (1).
//               spec.state "past": smooth white Tura casing, one plane at 51.84 deg from the foot line (z 0, y 0) to y 9
//               (z -7.07), hairline joints (1 px lines #cfc9ba) on every 1.5 m course and staggered verticals (stones
//               1.4..2.4 wide), a crisp foot edge (a gizapavement's top at 0.12 cuts it cleanly). Above it, as on the half-built
//               pyramid (panel 09), spec.core (3) courses of fresh stepped core blocks 1.05 high (0 for none): a 0.35 ledge
//               on the casing's top, then 0.825 back per course. spec.gap is ignored in "past".
//   worktop     the flat working top during building: 20 x 20 m of fitted core blocks 1.3 deep rows, widths 1.1..1.7, 1.5 cm
//               joints, the top dead level at y 0 (origin its middle, on the top). Its south edge (+z, z 10) is the stepped
//               edge of the course; two more courses below step out 0.8 each (course -1 y -2.1..-1.05 front at z 10.8,
//               course -2 y -3.15..-2.1 front at z 11.6), so the whole piece stands 3.15 tall: set the prop's y 3.15 to stand
//               it on the ground. The west, east and north sides are plain cut ends. spec.gap [x, z] one empty block slot
//               1.345 x 1.345 (a 1.3 block fits with ~2 cm all round), 1.05 deep, centred at (x, z) within 1 cm: the next
//               limeblock lands at { x, y: prop y - 1.05, z }. spec.seed (1). SOLID; the top is standable at y 0.
//   casingpair  the hairline close-up: two white casing stones side by side, each 1.6 w x 1.5 h x 0.9 d (x -1.6..0 and 0..1.6,
//               z -0.45..0.45, the vertical front at z 0.45), a third stone 3.2 w x 1.2 h on top spanning both (y 1.5..2.7).
//               The joints (the 0.5 mm vertical one at x 0 and the horizontal one at y 1.5) are drawn as 1 px dark lines,
//               the thinnest that survive at 360 px and no wider, on one continuous stone surface (no ink line at the
//               joint); one tiny chip (about 8 x 14 mm) on the vertical joint at y 0.93. spec.state "today" (default: a
//               slight cream weathering, stains and pits) | "past" (pure white). spec.seed (1). SOLID; the top is at 2.7.
//               The front texture is 1280 px per metre (sharp at 1.2 m with fov 40 at 1080 wide).
//   blockrows   waiting blocks on the ground: spec.rows (3) x spec.cols (10) core limeblocks, spec.spacing [2.1, 2.3] (x between
//               columns, z between rows), each with seeded size differences (+-6 % per axis) and turn (+-3 deg). Origin the
//               middle of the grid; row 0 is the north row (-z), column 0 the west one (-x). spec.missing [[row, col], ...]
//               leaves those out. spec.seed (1). SOLID, tops about 1.05 (0.99..1.11).
//   gizapavement the pyramid's levelled limestone platform: spec.size [14, 10] (x, z), a slab floor of large fitted pale slabs
//               (2..3 m, joints drawn), its top dead flat at y 0.12 with a clean 0.12 step on every side (the +z and +x ones are
//               the ones to show; slide its -z edge 0.3 under a pyramidbase). Origin the middle of its bottom. spec.state
//               "today" (default: worn, rounded corners, scuffs, sand in the joints and corners) | "past" (fresh, crisp
//               joints). spec.seed (1). SOLID; standable at 0.12.
//   northline   one perfectly straight thin line of light lying on the ground from the origin toward -z (north): spec.len (120),
//               spec.width (0.05), spec.color (#8fe6dc), a faint glow 0.3 wide on the ground round it, both see-through
//               (userData.steam), no haze wider than 0.3. One quad each: no wobble. draw 0..1 (seed it; 0 hides it) grows it
//               from the origin to len. The engine's own y lifts it (y 0.125 lays it on a gizapavement).
// Colour on screen (daylight bench, measured): core faces land near #d8bd7a, weathered near #b89a6a (the drawn hexes are
// pre-compensated for the toon light). Fresh white Tura casing (pyramidbase "past", casingpair "past", limeblock "casing",
// gizapavement "past") is clean: stone-to-stone and wash variation under 3 % brightness, a few tiny specks, the hairline
// joints stay; "today" versions carry a light cream weathering at half the first-pass blotch strength.
// Contact ovals: pyramidbase, worktop, blockrows and gizapavement are userData.lookOnly (no ground oval under them, no hand-
// shadow ray onto them; still solid for the contact checks). limeblock and casingpair keep theirs.
// GRIPS: none (AA_SITE_GRIPS is empty: nothing here is held in a hand).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, SLOPE = (51.84 * Math.PI) / 180, COT = 1 / Math.tan(SLOPE);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${clamp(a).toFixed(3)})`; };
// a seeded run of numbers: every mark takes its own from its index
const runOf = (seed) => { let n = 0; return () => rnd(seed + (n++) * 1.6180339); };
// smooth 3D value noise 0..1 on a hashed lattice
function vnoise(x, y, z, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => rnd(a * 12.9898 + b * 78.233 + c * 37.719 + s * 4.581);
  const x00 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u), x10 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u);
  const x01 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), x11 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
// an irregular closed blob path (rx, ry radii, k its seed)
function blob(g, cx, cy, rx, ry, k, n = 9, rot = 0) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, f = 0.68 + 0.32 * rnd(k + i * 3.7), px = Math.cos(a) * rx * f, py = Math.sin(a) * ry * f;
    const x = cx + px * Math.cos(rot) - py * Math.sin(rot), y = cy + px * Math.sin(rot) + py * Math.cos(rot);
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}
function gridGeo(nu, nv) {
  const geo = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1), idx = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setIndex(idx);
  return geo;
}

// ---------------------------------------------------------------------------------------------------------------
// stone palettes (BOARD section 1) and the hand-drawn face atlases: 6 x 6 faces of 340 px in a 2048 canvas per look
const PAL = {
  // base, light, dark are the BOARD hexes (core #d8bd7a, weathered #b89a6a) pre-compensated for the toon lighting so the lit
  // faces land at the BOARD hex on screen in the daylight bench (measured 13 Nov: core faces #d8bd7a, weathered #b89a6a)
  core: { base: "#d5bf89", light: "#e5d3a9", dark: "#bfa670", mark: "#a88f58", pit: "#86703f", hi: "#f2e2b4" },
  weathered: { base: "#b2976f", light: "#c4ac8a", dark: "#9a7f5b", mark: "#8f7650", pit: "#6f5a3c", hi: "#d6c196" },
  casing: { base: "#f2efe6", light: "#fbfaf6", dark: "#e3ded0", mark: "#cfc9ba", pit: "#d2cbba", hi: "#ffffff" },
};
const AT = { N: 6, S: 340, PAD: 4, W: 2048 };
// a chipped stone edge: a few irregular bites along each border of a face, darker, with a pale lip inside
function edgeChips(g, P, r, S, n, depth) {
  for (let e = 0; e < 4; e++) for (let i = 0, m = n + Math.floor(r() * 3); i < m; i++) {
    const t = r() * S, w = 8 + 22 * r(), dp = depth * (0.4 + 0.6 * r()), pts = [];
    for (let k = 0; k <= 5; k++) { const s = t - w / 2 + (w * k) / 5, d = k === 0 || k === 5 ? 0 : dp * (0.5 + 0.5 * r()); pts.push([s, d]); }
    const map = ([s, d]) => (e === 0 ? [s, d] : e === 1 ? [S - d, s] : e === 2 ? [s, S - d] : [d, s]);
    g.beginPath(); pts.forEach((p, k) => { const [x, y] = map(p); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
    g.fillStyle = rgba(P.dark, 0.55); g.fill();
    g.strokeStyle = rgba(P.mark, 0.6); g.lineWidth = 1.2; g.stroke();
  }
}
function drawStoneTile(g, look, id) {
  const P = PAL[look], S = AT.S, r = runOf(id * 97.31 + (look === "core" ? 11 : look === "weathered" ? 23 : 37));
  g.fillStyle = P.base; g.fillRect(0, 0, S, S);
  const washes = look === "casing" ? 6 : look === "core" ? 18 : 24, wa = look === "casing" ? 0.1 : 0.2, w0 = look === "casing" ? 0.05 : 0.08;   // fresh casing: a wash is under 1.5 % brightness
  for (let i = 0; i < washes; i++) { g.fillStyle = rgba(r() < 0.5 ? P.light : P.dark, w0 + wa * r()); blob(g, r() * S, r() * S, S * (0.08 + 0.3 * r()), S * (0.05 + 0.18 * r()), id * 31 + i, 9, r() * 3); g.fill(); }
  if (look === "core") {
    // bedding lines in the stone
    for (let i = 0; i < 4; i++) {
      const y0 = S * (0.1 + 0.8 * r()), ph = r() * 6, amp = 2 + 4 * r(); g.strokeStyle = rgba(P.dark, 0.25 + 0.2 * r()); g.lineWidth = 1 + 3 * r();
      g.beginPath(); for (let x = 0; x <= S; x += 10) { const y = y0 + amp * Math.sin(x * 0.025 + ph) + 2 * Math.sin(x * 0.11 + ph * 2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
    // rough-sawn chisel marks: groups of short parallel strokes, each incised (dark) with a lit lip
    for (let i = 0; i < 500; i++) { g.fillStyle = rgba(r() < 0.6 ? P.mark : P.hi, 0.15 + 0.2 * r()); g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r()); }   // grain
    for (let i = 0; i < 16; i++) {
      const cx = r() * S, cy = r() * S, a = (r() - 0.5) * 1.1 + (r() < 0.5 ? 0.75 : -0.75), cnt = 4 + Math.floor(6 * r()), sp = 4 + 3 * r(), len = 14 + 24 * r();
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let j = 0; j < cnt; j++) {
        const off = (j - cnt / 2) * sp + (r() - 0.5) * 2, l = len * (0.7 + 0.5 * r()), ox = cx - sa * off, oy = cy + ca * off;
        g.strokeStyle = rgba(P.mark, 0.5 + 0.25 * r()); g.lineWidth = 1.4 + 1.2 * r();
        g.beginPath(); g.moveTo(ox - (ca * l) / 2, oy - (sa * l) / 2); g.lineTo(ox + (ca * l) / 2, oy + (sa * l) / 2); g.stroke();
        g.strokeStyle = rgba(P.hi, 0.55); g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(ox - (ca * l) / 2 + 1.4, oy - (sa * l) / 2 + 1.4); g.lineTo(ox + (ca * l) / 2 + 1.4, oy + (sa * l) / 2 + 1.4); g.stroke();
      }
    }
    for (let i = 0; i < 34; i++) { const x = r() * S, y = r() * S, rr = 0.8 + 1.8 * r(); g.fillStyle = rgba(P.pit, 0.55); g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.strokeStyle = rgba(P.hi, 0.5); g.lineWidth = 0.8; g.beginPath(); g.arc(x, y + 0.6, rr, 0.2, Math.PI - 0.2); g.stroke(); }
    if (r() < 0.6) { // a hairline crack in from one border
      let x = r() * S, y = 0, a = Math.PI / 2 + (r() - 0.5); g.strokeStyle = rgba(P.pit, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 9; k++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); } g.stroke();
    }
    edgeChips(g, P, r, S, 4, 14);
    g.strokeStyle = rgba(P.mark, 0.35); g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
  } else if (look === "weathered") {
    // stone grain: tiny dark and pale specks, each its own place
    for (let i = 0; i < 700; i++) { g.fillStyle = rgba(r() < 0.6 ? P.pit : P.hi, 0.18 + 0.25 * r()); g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r()); }
    // spalls: shallow flakes of the face gone, a dark step on their upper side
    for (let i = 0, m = 2 + Math.floor(2 * r()); i < m; i++) {
      const x = r() * S, y = r() * S, rx = 25 + 45 * r(), ry = 14 + 26 * r(), k = id * 53 + i * 7, rot = (r() - 0.5) * 0.6;
      g.fillStyle = rgba(r() < 0.5 ? P.light : P.dark, 0.45); blob(g, x, y, rx, ry, k, 11, rot); g.fill();
      g.save(); blob(g, x, y, rx, ry, k, 11, rot); g.clip(); g.strokeStyle = rgba(P.pit, 0.55); g.lineWidth = 3; blob(g, x, y + 2.5, rx, ry, k, 11, rot); g.stroke(); g.restore();
    }
    // erosion grooves along the bedding: broken runs, each its own length and width, a lit lip under each
    for (let i = 0; i < 9; i++) {
      const y0 = S * (0.05 + 0.9 * r()), x0 = r() * S * 0.8, len = 40 + 130 * r(), ph = r() * 6, wdt = 1 + 3.5 * r(), pts = [];
      for (let x = x0; x <= Math.min(S, x0 + len); x += 6) pts.push([x, y0 + 2.5 * Math.sin(x * 0.04 + ph) + (r() - 0.5) * 1.5]);
      const path = (dy) => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy))); };
      g.strokeStyle = rgba(P.pit, 0.35 + 0.25 * r()); g.lineWidth = wdt; path(0); g.stroke(); g.strokeStyle = rgba(P.hi, 0.45); g.lineWidth = 1; path(wdt * 0.6 + 1); g.stroke();
    }
    for (let i = 0; i < 7; i++) { const x = r() * S, y = r() * S * 0.6, w = 4 + 9 * r(), h = 40 + 120 * r(); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgba(P.pit, 0.16)); gr.addColorStop(1, rgba(P.pit, 0)); g.fillStyle = gr; g.fillRect(x, y, w, h); }
    // pits, most tiny, a few large: dark with a lit lower lip
    for (let i = 0; i < 170; i++) {
      const x = r() * S, y = r() * S, rr = 0.6 + 3.2 * Math.pow(r(), 3);
      g.fillStyle = rgba(P.pit, 0.5 + 0.3 * r()); g.beginPath(); g.ellipse(x, y, rr * (0.8 + 0.5 * r()), rr, r() * 3, 0, TAU); g.fill();
      if (rr > 1.4) { g.strokeStyle = rgba(P.hi, 0.6); g.lineWidth = 0.9; g.beginPath(); g.arc(x, y + 0.7, rr, 0.3, Math.PI - 0.3); g.stroke(); }
    }
    // now and then a hole: irregular, an inner shadow and a lit lower rim
    for (let i = 0, m = r() < 0.55 ? 1 + Math.floor(2 * r()) : 0; i < m; i++) {
      const x = 24 + r() * (S - 48), y = 24 + r() * (S - 48), rr = 5 + 14 * r(), k = id * 71 + i * 13;
      g.fillStyle = rgba(P.hi, 0.6); blob(g, x + 1.5, y + 2, rr * 1.15, rr * 0.85, k, 10); g.fill();
      g.fillStyle = "#6a5538"; blob(g, x, y, rr, rr * 0.75, k, 10); g.fill();
      g.fillStyle = "rgba(40,30,20,0.5)"; blob(g, x - rr * 0.15, y - rr * 0.2, rr * 0.6, rr * 0.38, k + 5, 8); g.fill();
    }
    edgeChips(g, P, r, S, 3, 11);
    g.strokeStyle = rgba(P.pit, 0.16); g.lineWidth = 10; g.strokeRect(0, 0, S, S); g.strokeStyle = rgba(P.pit, 0.3); g.lineWidth = 2.5; g.strokeRect(1, 1, S - 2, S - 2);
  } else {
    // fine Tura limestone: tiny fossil specks, faint polish strokes
    for (let i = 0; i < 60; i++) { g.fillStyle = rgba(r() < 0.6 ? P.mark : P.hi, 0.12 + 0.15 * r()); g.fillRect(r() * S, r() * S, 1 + r(), 1 + r()); }   // grain
    for (let i = 0; i < 12; i++) { const x = r() * S, y = r() * S; g.fillStyle = rgba(P.mark, 0.3 + 0.2 * r()); g.beginPath(); g.ellipse(x, y, 0.8 + 1.4 * r(), 0.6 + 0.8 * r(), r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 8; i++) { const x = r() * S, y = r() * S, a = (r() - 0.5) * 0.5, l = 40 + 90 * r(); g.strokeStyle = rgba(P.hi, 0.35); g.lineWidth = 1 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    g.strokeStyle = rgba(P.mark, 0.15); g.lineWidth = 1; g.strokeRect(0.5, 0.5, S - 1, S - 1);
  }
}
const ATLAS = {};
function atlasTex(look) {
  if (ATLAS[look]) return ATLAS[look];
  const [c, g] = canvas(AT.W, AT.W); g.fillStyle = PAL[look].base; g.fillRect(0, 0, AT.W, AT.W);
  for (let id = 0; id < AT.N * AT.N; id++) {
    g.save(); g.translate(AT.PAD + (id % AT.N) * AT.S, AT.PAD + Math.floor(id / AT.N) * AT.S); g.beginPath(); g.rect(0, 0, AT.S, AT.S); g.clip();
    drawStoneTile(g, look, id); g.restore();
  }
  return (ATLAS[look] = tex(c));
}
// a face's uv (0..1) into tile id of the atlas
function tileUV(id, u, v) {
  const px = AT.PAD + (id % AT.N) * AT.S + 5 + u * (AT.S - 10), py = AT.PAD + Math.floor(id / AT.N) * AT.S + 5 + (1 - v) * (AT.S - 10);
  return [px / AT.W, 1 - py / AT.W];
}
const MATS = {};
const stoneMat = (look) => (MATS[look] ??= mat("#ffffff", { map: atlasTex(look), vertexColors: true, roughness: look === "casing" ? 0.6 : 0.92 }));
const sandMat = () => (MATS.sand ??= (() => { const m = mat("#ffffff", { vertexColors: true, roughness: 1, side: THREE.DoubleSide }); m.userData.noShine = true; return m; })());

// one stone block w x h x d centred on the origin: a subdivided box whose edges are rounded (R), chipped (chip: bites
// along the edges from noise) and its faces roughened (rough), all as a function of position, so the faces stay
// joined; each face takes its own atlas tile (mirrored or not) and the block its own tint. o.slope: the +z face leans
// back at 51.84 deg (a casing stone). Returns an indexed geometry with position, normal, uv, color.
const BLK = { core: { R: 0.025, chip: 0.09, rough: 0.006, zone: 0.13 }, weathered: { R: 0.11, chip: 0.06, rough: 0.022, zone: 0.2 }, casing: { R: 0.006, chip: 0, rough: 0, zone: 0.1 } };
function blockGeo(w, h, d, o) {
  const B = BLK[o.look], seg = o.seg ?? 0.2, seed = o.seed ?? 1;
  const g = new THREE.BoxGeometry(w, h, d, Math.max(1, Math.ceil(w / seg)), Math.max(1, Math.ceil(h / seg)), Math.max(1, Math.ceil(d / seg)));
  g.clearGroups();
  const pos = g.attributes.position, nrm = g.attributes.normal, uv = g.attributes.uv, n = pos.count, col = new Float32Array(n * 3);
  const hx = w / 2, hy = h / 2, hz = d / 2, R = Math.max(0.003, Math.min(B.R, hx * 0.8, hy * 0.8, hz * 0.8));
  const tint = 1 + (rnd(seed * 3.3 + 1) - 0.5) * (o.look === "casing" ? 0.03 : 0.12), warm = (rnd(seed * 5.7 + 2) - 0.5) * 2;
  const cr = tint * (1 + warm * 0.03), cg = tint, cb = tint * (1 - warm * 0.04);
  const tiles = [0, 1, 2, 3, 4, 5].map((f) => [Math.floor(rnd(seed * 31.7 + f * 5.3) * AT.N * AT.N), rnd(seed * 13.1 + f * 2.9) < 0.5]);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const nx = nrm.getX(i), ny = nrm.getY(i), nz = nrm.getZ(i);
    const f = Math.abs(nx) > 0.5 ? (nx > 0 ? 0 : 1) : Math.abs(ny) > 0.5 ? (ny > 0 ? 2 : 3) : nz > 0 ? 4 : 5;
    const [tid, mir] = tiles[f], [U, V] = tileUV(tid, mir ? 1 - uv.getX(i) : uv.getX(i), uv.getY(i)); uv.setXY(i, U, V);
    p.fromBufferAttribute(pos, i);
    const ix = clamp(p.x, -(hx - R), hx - R), iy = clamp(p.y, -(hy - R), hy - R), iz = clamp(p.z, -(hz - R), hz - R);
    let dx = p.x - ix, dy = p.y - iy, dz = p.z - iz; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    p.set(ix + dx * R, iy + dy * R, iz + dz * R);
    // chips: only where two faces meet (the second-largest closeness to a face)
    const e = [smooth((Math.abs(p.x) - (hx - B.zone)) / B.zone), smooth((Math.abs(p.y) - (hy - B.zone)) / B.zone), smooth((Math.abs(p.z) - (hz - B.zone)) / B.zone)].sort((a, b) => b - a)[1];
    const chip = B.chip * e * clamp((vnoise(p.x * 3.1, p.y * 3.1, p.z * 3.1, seed) - 0.42) / 0.58);
    const rough = B.rough * vnoise(p.x * 7.3 + 9, p.y * 7.3, p.z * 7.3, seed + 3);
    p.x -= dx * (chip + rough); p.y -= dy * (chip + rough); p.z -= dz * (chip + rough);
    if (o.slope) { const zf = hz - (p.y + hy) * COT; p.z = -hz + ((p.z + hz) * (zf + hz)) / (2 * hz); }
    pos.setXYZ(i, p.x, p.y, p.z);
    const shade = 1 - 0.06 * clamp(chip / 0.05);   // a bitten edge reads a touch darker
    col[i * 3] = cr * shade; col[i * 3 + 1] = cg * shade; col[i * 3 + 2] = cb * shade;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
// a block placed: turned yaw (rad) about y, then its bottom centre at (x, y, z)
function placed(g, h, x, y, z, yaw = 0, tiltX = 0, tiltZ = 0) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y + h / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, yaw, tiltZ, "YXZ")), new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(m); return g;
}
// a piece far bigger than a character: no contact oval under it (looks.js sizes the oval to 1.9 x its box: 70 m dark
// under a pyramidbase) and no hand-shadow ray onto it; it stays solid for the contact checks (they ignore lookOnly)
const big = (P) => P.whole.traverse((o) => { if (o.isMesh) o.userData.lookOnly = true; });
const merged = (list) => { const g = mergeGeometries(list, false); for (const x of list) x.dispose(); return g; };
// a plain box (a hidden core mass, seen only in the joints): position, normal, uv (one atlas tile), color
function fillerGeo(x0, x1, y0, y1, z0, z1, shade = 0.62) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.clearGroups(); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const [U, V] = tileUV(7, uv.getX(i), uv.getY(i)); uv.setXY(i, U, V); }
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(shade), 3));
  return g;
}
// fill x0..x1 with blocks of seeded widths (lo..lo+span); returns [[x, w], ...]
function rowWidths(x0, x1, k, lo = 1.15, span = 0.75) {
  const out = []; let x = x0, j = 0;
  while (x < x1 - 0.05) { let w = lo + span * rnd(k + j * 3.1); if (x1 - x - w < 0.7) w = x1 - x; out.push([x, w]); x += w; j++; }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// dust: a ring of hand-drawn cel puffs (a shadow tone, a lit cel band, a highlight), see-through sprites
const PUFFS = [];
function puffTex(i) {
  if (PUFFS[i]) return PUFFS[i];
  const [c, g] = canvas(128, 128), r = runOf(500 + i * 17), circ = [];
  for (let k = 0; k < 7; k++) { const a = r() * TAU, d = 10 + 22 * r(); circ.push([64 + Math.cos(a) * d * 1.2, 70 + Math.sin(a) * d * 0.7, 16 + 14 * r()]); }
  const draw = (dx, dy, s, col) => { g.fillStyle = col; for (const [x, y, rr] of circ) { g.beginPath(); g.arc(64 + (x - 64) * s + dx, 70 + (y - 70) * s + dy, rr * s, 0, TAU); g.fill(); } };
  draw(0, 0, 1, "rgba(190,170,128,0.8)"); draw(-3, -6, 0.82, "rgba(221,204,166,0.9)"); draw(-7, -12, 0.45, "rgba(236,224,196,0.85)");
  return (PUFFS[i] = tex(c));
}
function dustRing(parent, r0, r1, seed) {
  const N = 34, puffs = [];
  for (let i = 0; i < N; i++) {
    const m = new THREE.SpriteMaterial({ map: puffTex(i % 4), transparent: true, depthWrite: false, opacity: 0, toneMapped: false }); m.userData.noOutline = true;
    const s = steamy(new THREE.Sprite(m), 6); s.visible = false; parent.add(s);
    puffs.push({ s, m, a: ((i >> 1) / (N / 2)) * TAU + (i % 2) * 0.18 + (rnd(seed * 7 + i) - 0.5) * 0.3, lag: i % 2 ? 0.74 : 1, sz: 0.7 + 0.6 * rnd(seed * 9 + i), rot: (rnd(seed * 11 + i) - 0.5) * 1.4, op: 0.6 + 0.4 * rnd(seed * 13 + i) });
  }
  let last = -1;
  return (k) => {
    if (k === last) return; last = k;
    const fade = smooth(k / 0.1) * (1 - smooth((k - 0.4) / 0.6)), e = 1 - Math.pow(1 - k, 3);
    for (const p of puffs) {
      p.s.visible = fade > 0.003; if (!p.s.visible) continue;
      const kk = e * p.lag, r = lerp(r0, r1, kk), size = (0.22 + 0.55 * kk) * p.sz;
      p.s.position.set(Math.cos(p.a) * r, size * 0.34, Math.sin(p.a) * r); p.s.scale.set(size * 1.5, size, 1);
      p.m.rotation = p.rot * k; p.m.opacity = 0.7 * fade * p.op;
    }
  };
}

// ---------------------------------------------------------------------------------------------------------------
// sand drifts lying against a riser (z zr, from height y0) along x0..x1: up to Hmax high, out to maxD; fade(x) 0..1
function driftGeo(x0, x1, y0, zr, maxD, Hmax, seed, fade) {
  const NX = Math.ceil((x1 - x0) / 0.25), NV = 5, geo = gridGeo(NX, NV), pos = geo.attributes.position.array, col = new Float32Array((NX + 1) * (NV + 1) * 3);
  // a touch darker than the BOARD's sand (#d9c49a, crest, hollow #c9b388): the prop shading lifts it to match the set's floor
  const sand = rgb("#c4ad82").map((v) => v / 255), crest = rgb("#cfba90").map((v) => v / 255), hollow = rgb("#b39d72").map((v) => v / 255);
  for (let i = 0; i <= NX; i++) {
    const x = lerp(x0, x1, i / NX), hs = Hmax * clamp((vnoise(x * 0.38, 0.5, seed * 3.3, seed) - 0.3) / 0.7) * fade(x), ds = Math.min(maxD, hs * 1.8 + 0.04);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV, k = i * (NV + 1) + j;
      pos[k * 3] = x; pos[k * 3 + 1] = y0 + 0.004 + hs * Math.pow(1 - v, 1.6); pos[k * 3 + 2] = zr - 0.06 + v * (ds + 0.06);
      const c = v < 0.25 ? crest : v > 0.8 ? hollow : sand, t = 0.96 + 0.08 * rnd(seed * 17 + i * 1.3 + j);
      col[k * 3] = c[0] * t; col[k * 3 + 1] = c[1] * t; col[k * 3 + 2] = c[2] * t;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}
// a loose stone: a lumpy icosahedron, its own size and turn; uv in one atlas tile
function rubbleGeo(s, seed) {
  const g = new THREE.IcosahedronGeometry(1, 1), pos = g.attributes.position, uv = g.attributes.uv, tid = Math.floor(rnd(seed * 2.1) * 36);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 0.75 + 0.45 * vnoise(x * 1.7 + 3, y * 1.7, z * 1.7, seed);
    pos.setXYZ(i, x * k * s, y * k * s * 0.62, z * k * s * 0.85); const [U, V] = tileUV(tid, clamp(uv.getX(i)), clamp(uv.getY(i))); uv.setXY(i, U, V);
  }
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(0.92 + 0.12 * rnd(seed * 4.4)), 3));
  g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------------------------------------------------------
// pyramidbase "today": stepped weathered courses, sand in the steps, fallen blocks and rubble
function baseToday(P, S) {
  const seed = S.seed ?? 1, NC = S.courses ?? 8, HW = 18, J = 0.03, gx = Array.isArray(S.gap) ? S.gap[0] : S.gap ?? null;
  const hs = [], y0 = [0], zf = [0];
  for (let i = 0; i < NC; i++) hs.push(i ? 0.9 + 0.3 * rnd(seed * 17 + i) : 1.5);
  for (let i = 1; i < NC; i++) { y0.push(y0[i - 1] + hs[i - 1]); zf.push(zf[i - 1] - hs[i - 1] * COT); }
  const zBack = zf[NC - 1] - 4.5, blocks = [], fill = [], sand = [];
  for (let i = 0; i < NC; i++) {
    const tread = i < NC - 1 ? zf[i] - zf[i + 1] : 1.4, d = i === 0 ? Math.max(tread + 0.6, 1.45) : tread + 0.6;
    const spans = i === 0 && gx != null ? [[-HW, gx - 0.7], [gx + 0.7, HW]] : [[-HW, HW]];
    spans.forEach(([a, b], si) => rowWidths(a, b, seed * 1000 + i * 37 + si * 11, 1.15, 0.75).forEach(([x, w], j) => {
      if (w < 0.08) return;
      const k = seed * 5000 + i * 97 + si * 53 + j, h = hs[i] - 0.035 * rnd(k * 1.7), dz = (rnd(k * 2.3) - 0.5) * 0.1;
      blocks.push(placed(blockGeo(w - J, h, d, { look: "weathered", seed: k, seg: 0.3 }), h, x + w / 2, y0[i], zf[i] - d / 2 + dz, (rnd(k * 3.1) - 0.5) * 0.02));
    }));
    if (i === NC - 1) for (let row = 1; row <= 2; row++) rowWidths(-HW, HW, seed * 3000 + row * 7, 1.15, 0.75).forEach(([x, w], j) => {
      const k = seed * 7000 + row * 97 + j, h = hs[i] - 0.03 * rnd(k);
      blocks.push(placed(blockGeo(w - J, h, 1.4 - J, { look: "weathered", seed: k, seg: 0.35 }), h, x + w / 2, y0[i], zf[i] - d - (row - 1) * 1.4 - 0.7, 0));
    });
    const zFill = i === NC - 1 ? zf[i] - d - 2.8 + 0.02 : zf[i] - d + 0.04;
    if (zFill > zBack) fill.push(fillerGeo(-HW + 0.01, HW - 0.01, y0[i], y0[i] + hs[i] - 0.06, zBack, zFill));
    if (i < NC - 1) sand.push(driftGeo(-HW + 0.2, HW - 0.2, y0[i] + hs[i] - 0.035, zf[i + 1], (zf[i] - zf[i + 1]) * 0.85, Math.min(0.35, hs[i + 1] * 0.32), seed * 10 + i, () => 1));
  }
  // in the slot: the core mass behind it
  if (gx != null) fill.push(fillerGeo(gx - 0.72, gx + 0.72, 0, 1.47, -1.47 - 0.4, -1.45));
  const gapFade = (x) => (gx == null ? 1 : smooth((Math.abs(x - gx) - 1.0) / 0.8));
  sand.push(driftGeo(-HW - 0.5, HW + 0.5, 0, 0.0, 1.0, 0.3, seed * 10 + 99, gapFade));
  mesh(merged(blocks), stoneMat("weathered"), P.whole);
  mesh(merged(fill), stoneMat("weathered"), P.whole).castShadow = false;
  const sm = mesh(merged(sand), sandMat(), P.whole); sm.userData.solid = false; sm.castShadow = false;
  if (S.rubble !== false) {
    const fallen = [], rub = [], away = (x) => (gx != null && Math.abs(x - gx) < 3.5 ? x + (x >= gx ? 7 : -7) : x);
    [[-15.2, 1.6], [-9.6, 2.4], [7.8, 1.9], [13.6, 1.3]].forEach(([x0, z], i) => {
      const k = seed * 900 + i, w = 0.9 + 0.5 * rnd(k), h = 0.7 + 0.3 * rnd(k + 1), d = 0.8 + 0.4 * rnd(k + 2), x = clamp(away(x0), -HW + 1, HW - 1);
      fallen.push(placed(blockGeo(w, h, d, { look: "weathered", seed: k, seg: 0.25 }), h, x, -0.12, z, rnd(k + 3) * TAU, (rnd(k + 4) - 0.5) * 0.4, (rnd(k + 5) - 0.5) * 0.4));
    });
    for (let i = 0, m = 0; i < 90 && m < 62; i++) {
      const k = seed * 400 + i, x = -HW + 0.5 + (2 * HW - 1) * rnd(k), onTread = NC > 1 && i % 6 === 5;
      if (gx != null && Math.abs(x - gx) < 3) continue;
      m++;
      const s = onTread ? 0.06 + 0.12 * rnd(k + 1) : 0.06 + 0.26 * Math.pow(rnd(k + 1), 2.2);
      let y = s * 0.25, z = 0.15 + 2.8 * Math.pow(rnd(k + 2), 1.6);
      if (onTread) { const c = 1 + Math.floor(rnd(k + 3) * Math.min(4, NC - 1)); y = y0[c] + s * 0.3; z = lerp(zf[c], zf[c - 1], 0.3 + 0.5 * rnd(k + 4)); }
      const g = rubbleGeo(s, k); g.rotateY(rnd(k + 5) * TAU); g.translate(x, y, z); rub.push(g);
    }
    mesh(merged(fallen), stoneMat("weathered"), P.whole);
    mesh(merged(rub), stoneMat("weathered"), P.whole);
  }
}

// the Tura casing plane's stones: per course (1.5 m high) the x boundaries, staggered
const CASE_H = 9, CASE_C = 1.5, CASE_SL = CASE_H / Math.sin(SLOPE);
function casingLayout(seed, W) {
  const rows = [];
  for (let c = 0; c < Math.round(CASE_H / CASE_C); c++) { const xs = []; let x = -W / 2 - 1.5 * rnd(seed * 41 + c), j = 0; while (x < W / 2) { if (x > -W / 2 + 0.2) xs.push(x); x += 1.4 + rnd(seed * 61 + c * 13 + j++); } rows.push(xs); }
  return rows;
}
function casingPlaneTex(seed, W, rows) {
  const PX = 4096 / W, CW = 4096, CH = Math.round(CASE_SL * PX), [c, g] = canvas(CW, CH), P = PAL.casing;
  g.fillStyle = P.base; g.fillRect(0, 0, CW, CH);
  const cs = CASE_C / Math.sin(SLOPE);   // a course along the slope
  rows.forEach((xs, ci) => {
    const bounds = [-W / 2, ...xs, W / 2], y1 = CH - ci * cs * PX, y0 = y1 - cs * PX;
    for (let b = 0; b + 1 < bounds.length; b++) {
      const x0 = (bounds[b] + W / 2) * PX, x1 = (bounds[b + 1] + W / 2) * PX, r = runOf(seed * 300 + ci * 41 + b * 7), w = x1 - x0, h = y1 - y0;
      const t = (r() - 0.5) * 3; g.fillStyle = `rgb(${242 + t},${239 + t},${230 + t})`; g.fillRect(x0, y0, w, h);
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
      for (let i = 0; i < 4; i++) { g.fillStyle = rgba(r() < 0.5 ? P.light : P.dark, 0.04 + 0.08 * r()); blob(g, x0 + r() * w, y0 + r() * h, w * (0.1 + 0.3 * r()), h * (0.08 + 0.25 * r()), ci * 97 + b * 13 + i, 9, r()); g.fill(); }
      for (let i = 0; i < 10; i++) { g.fillStyle = rgba(P.mark, 0.25 + 0.2 * r()); g.beginPath(); g.ellipse(x0 + r() * w, y0 + r() * h, 0.6 + 0.8 * r(), 0.4 + 0.5 * r(), r() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 4; i++) { const x = x0 + r() * w, y = y0 + r() * h, l = 30 + 70 * r(); g.strokeStyle = rgba(P.hi, 0.45); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 6); g.stroke(); }
      g.restore();
    }
  });
  return tex(c);
}
// 1 px hairline joints (#cfc9ba by default): LineSegments, segments as [[x, y, z], [x, y, z]] pairs
function hairlines(parent, segs, color = "#cfc9ba") {
  const a = new Float32Array(segs.length * 6); segs.forEach(([p, q], i) => { a.set(p, i * 6); a.set(q, i * 6 + 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  const m = new THREE.LineBasicMaterial({ color, toneMapped: false }); m.userData.noOutline = true;
  const l = new THREE.LineSegments(g, m); l.castShadow = false; l.userData.steam = true; l.renderOrder = 2; parent.add(l); return l;
}
function basePast(P, S) {
  const seed = S.seed ?? 1, W = 36, HW = 18, zTop = -CASE_H * COT, ca = Math.cos(SLOPE), sa = Math.sin(SLOPE), rows = casingLayout(seed, W);
  const plane = new THREE.PlaneGeometry(W, CASE_SL); plane.rotateX(-(Math.PI / 2 - SLOPE)); plane.translate(0, CASE_H / 2, zTop / 2);
  mesh(plane, mat("#ffffff", { map: casingPlaneTex(seed, W, rows), roughness: 0.55, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), P.whole);
  // the wedge's two cut ends
  const capM = mat("#e9e4d6", { roughness: 0.7, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([s * HW, 0, 0, s * HW, CASE_H, zTop, s * HW, 0, zTop]), 3)); g.computeVertexNormals(); mesh(g, capM, P.whole); }
  // hairline joints on the plane (2 mm proud along its normal)
  const at = (x, s) => [x, s * sa + ca * 0.003, -s * ca + sa * 0.003], cs = CASE_C / sa, segs = [];
  for (let c = 1; c < rows.length; c++) segs.push([at(-HW, c * cs), at(HW, c * cs)]);
  rows.forEach((xs, c) => xs.forEach((x) => segs.push([at(x, c * cs), at(x, (c + 1) * cs)])));
  hairlines(P.whole, segs);
  // the flat top of the casing course and the stepped fresh core above it (panel 09)
  const NCore = S.core ?? 3, blocks = [], fill = [], zc0 = zTop - 0.35, zEnd = zc0 - 0.825 * NCore - 3;
  const ledge = new THREE.BoxGeometry(W, 0.3, zTop - zEnd); ledge.translate(0, CASE_H - 0.15, (zTop + zEnd) / 2); mesh(ledge, capM, P.whole);
  for (let k = 0; k < NCore; k++) {
    const y = CASE_H + 1.05 * k, zf = zc0 - 0.825 * k, d = k < NCore - 1 ? 0.825 + 0.6 : 1.4;
    rowWidths(-HW, HW, seed * 8000 + k * 31, 1.1, 0.6).forEach(([x, w], j) => { const kk = seed * 9000 + k * 97 + j; blocks.push(placed(blockGeo(w - 0.015, 1.05, d, { look: "core", seed: kk, seg: 0.3 }), 1.05, x + w / 2, y, zf - d / 2, 0)); });
    if (k === NCore - 1) rowWidths(-HW, HW, seed * 8800, 1.1, 0.6).forEach(([x, w], j) => blocks.push(placed(blockGeo(w - 0.015, 1.05, 1.3, { look: "core", seed: seed * 9900 + j, seg: 0.35 }), 1.05, x + w / 2, y, zf - d - 0.66, 0)));
    fill.push(fillerGeo(-HW + 0.01, HW - 0.01, y, y + 1.0, zEnd, zf - d + 0.03, 0.62));
  }
  if (blocks.length) mesh(merged(blocks), stoneMat("core"), P.whole);
  if (fill.length) mesh(merged(fill), stoneMat("core"), P.whole).castShadow = false;
}

// ---------------------------------------------------------------------------------------------------------------
// casingpair: one continuous stone surface (3.2 x 2.7 front) with the joints as 1 px lines, a 1280 px/m front texture
function casingFrontTex(seed, today, W, H, PX) {
  const CW = Math.round(W * PX), CH = Math.round(H * PX), [c, g] = canvas(CW, CH), P = PAL.casing;
  const X = (x) => (x + W / 2) * PX, Y = (y) => CH - y * PX;
  const stones = [[-1.6, 0, 0, 1.5], [0, 0, 1.6, 1.5], [-1.6, 1.5, 1.6, 2.7]];
  stones.forEach(([x0, y0, x1, y1], si) => {
    const r = runOf(seed * 77 + si * 19), L = X(x0), T = Y(y1), w = X(x1) - L, h = Y(y0) - T;
    const t = (r() - 0.5) * 3; g.fillStyle = today ? `rgb(${238 + t},${233 + t},${219 + t})` : `rgb(${243 + t},${240 + t},${232 + t})`; g.fillRect(L, T, w, h);
    g.save(); g.beginPath(); g.rect(L, T, w, h); g.clip();
    const wk = today ? 0.5 : 0.15;   // blotch strength: today half of the first pass, fresh casing barely visible
    for (let i = 0; i < 26; i++) { g.fillStyle = rgba(r() < 0.5 ? P.light : P.dark, wk * (0.08 + 0.14 * r())); blob(g, L + r() * w, T + r() * h, w * (0.06 + 0.22 * r()), h * (0.05 + 0.2 * r()), si * 300 + i, 11, r() * 3); g.fill(); }
    // nummulite fossils: tiny ovals with a darker spiral line, each its own place and size
    for (let i = 0, nf = today ? 120 : 30; i < nf; i++) { const x = L + r() * w, y = T + r() * h, a = (today ? 1.2 : 0.8) + (today ? 3.5 : 1.6) * r(), b = a * (0.45 + 0.3 * r()), rot = r() * 3; g.fillStyle = rgba("#ddd6c4", today ? 0.4 : 0.3); g.beginPath(); g.ellipse(x, y, a, b, rot, 0, TAU); g.fill(); g.strokeStyle = rgba("#bdb5a1", today ? 0.45 : 0.3); g.lineWidth = 0.7; g.beginPath(); g.ellipse(x, y, a * 0.6, b * 0.5, rot, 0.3, 5.4); g.stroke(); }
    for (let i = 0, ng = today ? 2000 : 300; i < ng; i++) { g.fillStyle = rgba(r() < 0.5 ? "#c9c2b0" : "#ffffff", today ? 0.1 + 0.1 * r() : 0.12 + 0.1 * r()); g.fillRect(L + r() * w, T + r() * h, 1 + r(), 1 + r()); }
    for (let i = 0; i < 14; i++) { const x = L + r() * w, y = T + r() * h, l = 60 + 200 * r(), a = (r() - 0.5) * 0.4; g.strokeStyle = rgba(P.hi, 0.3); g.lineWidth = 2 + 3 * r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    if (today) {
      // cream weathering: soft stains run down from the top edge, a few small pits
      for (let i = 0; i < 9; i++) { const x = L + r() * w, wd = 20 + 90 * r(), hh = h * (0.2 + 0.6 * r()), gr = g.createLinearGradient(0, T, 0, T + hh); gr.addColorStop(0, rgba("#d9c9a2", 0.14)); gr.addColorStop(1, rgba("#d9c9a2", 0)); g.fillStyle = gr; blob(g, x, T + hh / 2, wd / 2, hh / 2, si * 50 + i, 12); g.fill(); }
      for (let i = 0; i < 50; i++) { const x = L + r() * w, y = T + r() * h, rr = 1 + 2.2 * r(); g.fillStyle = rgba("#b9ae94", 0.32); g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.strokeStyle = rgba("#ffffff", 0.6); g.lineWidth = 1; g.beginPath(); g.arc(x, y + 0.8, rr, 0.3, Math.PI - 0.3); g.stroke(); }
      const gr = g.createLinearGradient(0, Y(y0) - 60, 0, Y(y0)); gr.addColorStop(0, rgba("#cdbb93", 0)); gr.addColorStop(1, rgba("#cdbb93", 0.11)); g.fillStyle = gr; g.fillRect(L, Y(y0) - 60, w, 60);
    }
    g.restore();
  });
  // the one tiny chip on the vertical joint at y 0.93: a notch about 8 x 14 mm, shadowed above, a lit facet below
  const cx = X(0), cy = Y(0.93), s = PX / 1000;
  g.fillStyle = "#b3ab97"; g.beginPath(); g.moveTo(cx - 5 * s, cy - 7 * s); g.lineTo(cx + 3 * s, cy - 8 * s); g.lineTo(cx + 4 * s, cy + 1 * s); g.lineTo(cx + 1 * s, cy + 7 * s); g.lineTo(cx - 4 * s, cy + 5 * s); g.closePath(); g.fill();
  g.fillStyle = "#8d8573"; g.beginPath(); g.moveTo(cx - 5 * s, cy - 7 * s); g.lineTo(cx + 3 * s, cy - 8 * s); g.lineTo(cx + 1 * s, cy - 3 * s); g.lineTo(cx - 3 * s, cy - 2 * s); g.closePath(); g.fill();
  g.fillStyle = "#fbf8f0"; g.beginPath(); g.moveTo(cx - 4 * s, cy + 5 * s); g.lineTo(cx + 1 * s, cy + 7 * s); g.lineTo(cx + 1.5 * s, cy + 4 * s); g.closePath(); g.fill();
  return tex(c);
}
function plainCasingTex(seed, today, wM, hM) {
  const PX = 256, [c, g] = canvas(Math.max(64, Math.round(wM * PX)), Math.max(64, Math.round(hM * PX))), r = runOf(seed * 13 + wM * 7 + hM), W = c.width, H = c.height;
  g.fillStyle = today ? "#ece5d4" : "#f2efe6"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { g.fillStyle = rgba(r() < 0.5 ? PAL.casing.light : PAL.casing.dark, (today ? 0.5 : 0.15) * (0.1 + 0.15 * r())); blob(g, r() * W, r() * H, W * (0.05 + 0.2 * r()), H * (0.05 + 0.2 * r()), seed * 11 + i, 9, r()); g.fill(); }
  for (let i = 0, ns = today ? 140 : 25; i < ns; i++) { g.fillStyle = rgba(PAL.casing.mark, today ? 0.25 + 0.2 * r() : 0.2 + 0.15 * r()); g.beginPath(); g.ellipse(r() * W, r() * H, 0.6 + 0.8 * r(), 0.4 + 0.6 * r(), r() * 3, 0, TAU); g.fill(); }
  return tex(c);
}

// ---------------------------------------------------------------------------------------------------------------
// pavement: one flat slab of 0.12, the slab layout drawn on its top, the joints carried down its step edges
function paveLayout(W, D, seed) {
  const slabs = []; let z = -D / 2, r = 0;
  while (z < D / 2 - 0.05) {
    let d = 2 + rnd(seed * 19 + r); if (D / 2 - z - d < 1.2) d = D / 2 - z;
    let x = -W / 2, j = 0;
    while (x < W / 2 - 0.05) { let w = 2 + rnd(seed * 23 + r * 17 + j); if (W / 2 - x - w < 1.2) w = W / 2 - x; slabs.push([x, z, w, d, r * 50 + j]); x += w; j++; }
    z += d; r++;
  }
  return slabs;
}
function paveTop(W, D, slabs, today, seed) {
  const PX = Math.min(4096 / W, 4096 / D), CW = Math.round(W * PX), CH = Math.round(D * PX), [c, g] = canvas(CW, CH);
  const base = today ? "#d9caa6" : "#e6dcc4", light = today ? "#e6d9ba" : "#f0e8d6", dark = today ? "#c4b38c" : "#d6cab0";
  g.fillStyle = base; g.fillRect(0, 0, CW, CH);
  for (const [x, z, w, d, k] of slabs) {
    const L = (x + W / 2) * PX, T = (z + D / 2) * PX, ww = w * PX, hh = d * PX, r = runOf(seed * 1000 + k * 7.7), t = (r() - 0.5) * (today ? 7 : 3);
    const [br, bg, bb] = rgb(base); g.fillStyle = `rgb(${br + t},${bg + t},${bb + t * 0.8})`; g.fillRect(L, T, ww, hh);
    g.save(); g.beginPath(); g.rect(L, T, ww, hh); g.clip();
    for (let i = 0; i < 16; i++) { g.fillStyle = rgba(r() < 0.5 ? light : dark, (today ? 0.5 : 0.12) * (0.12 + 0.2 * r())); blob(g, L + r() * ww, T + r() * hh, ww * (0.06 + 0.25 * r()), hh * (0.05 + 0.2 * r()), k * 31 + i, 10, r() * 3); g.fill(); }
    for (let i = 0, nd = today ? 70 : 25; i < nd; i++) { g.fillStyle = rgba(today ? "#8f7650" : "#b9aa86", today ? 0.2 + 0.2 * r() : 0.15 + 0.15 * r()); g.beginPath(); g.arc(L + r() * ww, T + r() * hh, 0.6 + 1.6 * r(), 0, TAU); g.fill(); }
    if (today) {
      for (let i = 0; i < 10; i++) { const x0 = L + r() * ww, y0 = T + r() * hh, a = r() * 3, l = 20 + 80 * r(); g.strokeStyle = rgba(light, 0.3); g.lineWidth = 2 + 4 * r(); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * l * 0.5 + 8, y0 + Math.sin(a) * l * 0.5, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); g.stroke(); }   // scuffs
      if (r() < 0.5) { let x0 = L + r() * ww, y0 = T, a = Math.PI / 2 + (r() - 0.5); g.strokeStyle = rgba("#7d6646", 0.55); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x0, y0); for (let i = 0; i < 12; i++) { a += (r() - 0.5) * 0.7; x0 += Math.cos(a) * 16; y0 += Math.sin(a) * 16; g.lineTo(x0, y0); } g.stroke(); }   // a crack
      // worn corners: rounded, paler
      for (const [cx, cy] of [[L, T], [L + ww, T], [L, T + hh], [L + ww, T + hh]]) { g.fillStyle = rgba(light, 0.6); blob(g, cx, cy, 8 + 12 * r(), 8 + 12 * r(), k * 7 + cx, 8); g.fill(); }
      // sand blown into a corner
      if (r() < 0.6) { g.fillStyle = rgba("#d9c49a", 0.45); blob(g, L + (r() < 0.5 ? 6 : ww - 6), T + (r() < 0.5 ? 6 : hh - 6), 20 + 50 * r(), 12 + 30 * r(), k * 13, 11, r()); g.fill(); }
    } else {
      for (let i = 0; i < 3; i++) { const x0 = L + r() * ww, y0 = T + r() * hh; g.strokeStyle = rgba(dark, 0.2); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 30 + 40 * r(), y0 + (r() - 0.5) * 20); g.stroke(); }   // tool marks
    }
    g.restore();
  }
  // the joints
  for (const [x, z, w, d] of slabs) {
    const L = (x + W / 2) * PX, T = (z + D / 2) * PX, ww = w * PX, hh = d * PX;
    if (today) { g.strokeStyle = "#cdb68a"; g.lineWidth = 5; g.strokeRect(L, T, ww, hh); g.strokeStyle = rgba("#8f7650", 0.55); g.lineWidth = 1.2; g.strokeRect(L + 2.5, T + 2.5, ww - 5, hh - 5); }
    else { g.strokeStyle = rgba("#9f8f6c", 0.85); g.lineWidth = 2; g.strokeRect(L, T, ww, hh); }
  }
  return tex(c);
}
function paveSide(len, cuts, today) {
  const PX = 2048 / len, [c, g] = canvas(2048, 32), base = today ? "#cbbb95" : "#ddd2b8";
  g.fillStyle = base; g.fillRect(0, 0, 2048, 32); g.fillStyle = rgba(today ? "#e3d5b4" : "#f0e8d6", 0.8); g.fillRect(0, 0, 2048, 4);
  for (let i = 0; i < 120; i++) { g.fillStyle = rgba("#8f7650", 0.3); g.fillRect(rnd(i * 3.3 + len) * 2048, 6 + rnd(i * 5.1) * 24, 2, 1.5); }
  g.strokeStyle = today ? "#a98f62" : "#a39372"; g.lineWidth = 2; for (const s of cuts) { g.beginPath(); g.moveTo(s * PX, 0); g.lineTo(s * PX, 32); g.stroke(); }
  return tex(c);
}

// ---------------------------------------------------------------------------------------------------------------
export const AA_SITE_KINDS = {
  limeblock(P) {
    const S = P.spec, [w, h, d] = S.size ?? [1.3, 1.05, 1.3], look = PAL[S.look] ? S.look : "core", seed = S.seed ?? 1;
    const g = blockGeo(w, h, d, { look, seed: seed * 101 + 7, seg: 0.11, slope: look === "casing" }); g.translate(0, h / 2, 0);
    mesh(g, stoneMat(look), P.whole);
    const dust = dustRing(P.whole, Math.max(w, d) * 0.55, 1.6, seed);
    return { grip: h, apply(ps) { dust(clamp(num(ps, S, "dust"))); } };
  },

  pyramidbase(P) {
    const S = P.spec;
    if (S.state === "past") basePast(P, S); else baseToday(P, S);
    big(P); return { grip: 0 };
  },

  worktop(P) {
    const S = P.spec, seed = S.seed ?? 1, HW = 10, J = 0.015, PZ = 1.3 + J, H = 1.05, gap = Array.isArray(S.gap) ? S.gap : null;
    const gz = gap ? gap[1] : 0, gx = gap ? gap[0] : 0, blocks = [], fill = [];
    for (let k = -20; k <= 20; k++) {
      const zc = gz + k * PZ, z0 = Math.max(-HW, zc - 0.65), z1 = Math.min(HW, zc + 0.65); if (z1 - z0 < 0.04) continue;
      const spans = gap && k === 0 ? [[-HW, gx - 0.665], [gx + 0.665, HW]] : [[-HW, HW]], off = rnd(seed * 3 + k) * 0.6;
      spans.forEach(([a, b], si) => {
        const list = gap && k === 0 ? rowWidths(a, b, seed * 200 + k * 13 + si, 1.1, 0.6) : rowWidths(a - off, b, seed * 200 + k * 13, 1.1, 0.6).map(([x, w]) => (x < a ? [a, w - (a - x)] : [x, w]));
        list.forEach(([x, w], j) => {
          if (w < 0.1) return;
          const kk = seed * 4000 + (k + 20) * 61 + si * 31 + j, wE = w - J;
          blocks.push(placed(blockGeo(wE, H, z1 - z0 - (z1 < HW ? J : 0), { look: "core", seed: kk, seg: 0.33 }), H, x + wE / 2, -H, (z0 + z1 - (z1 < HW ? J : 0)) / 2, 0));
        });
      });
    }
    // the two courses below the south edge, each stepping out 0.8
    for (let c = 1; c <= 2; c++) {
      const zf = HW + 0.8 * c, d = 1.4, y = -H * (c + 1);
      rowWidths(-HW, HW, seed * 600 + c * 17, 1.1, 0.6).forEach(([x, w], j) => blocks.push(placed(blockGeo(w - J, H, d, { look: "core", seed: seed * 6000 + c * 97 + j, seg: 0.3 }), H, x + w / 2, y, zf - d / 2, 0)));
    }
    fill.push(fillerGeo(-HW + 0.01, HW - 0.01, -3 * H, -H - 0.004, -HW + 0.01, HW + 0.3, 0.6));
    mesh(merged(blocks), stoneMat("core"), P.whole);
    mesh(merged(fill), stoneMat("core"), P.whole).castShadow = false;
    big(P); return { grip: 0 };
  },

  casingpair(P) {
    const S = P.spec, seed = S.seed ?? 1, today = S.state !== "past", W = 3.2, H = 2.7, D = 0.9, PX = 1280;
    const front = casingFrontTex(seed, today, W, H, PX);
    const side = plainCasingTex(seed + 1, today, D, H), top = plainCasingTex(seed + 2, today, W, D);
    const mk = (t) => mat("#ffffff", { map: t, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const sideM = mk(side), topM = mk(top);
    const box = new THREE.BoxGeometry(W, H, D); box.translate(0, H / 2, 0);
    mesh(box, [sideM, sideM, topM, topM, mk(front), sideM], P.whole);
    const e = 0.0004, zF = D / 2 + e, color = today ? "#7f786a" : "#8a8476";
    hairlines(P.whole, [
      [[0, 0, zF], [0, 1.5, zF]], [[-W / 2, 1.5, zF], [W / 2, 1.5, zF]],
      [[W / 2 + e, 1.5, -D / 2], [W / 2 + e, 1.5, D / 2]], [[-W / 2 - e, 1.5, -D / 2], [-W / 2 - e, 1.5, D / 2]],
      [[0, 0, -D / 2 - e], [0, 1.5, -D / 2 - e]], [[-W / 2, 1.5, -D / 2 - e], [W / 2, 1.5, -D / 2 - e]],
    ], color);
    return { grip: H };
  },

  blockrows(P) {
    const S = P.spec, seed = S.seed ?? 1, rows = S.rows ?? 3, cols = S.cols ?? 10, [sx, sz] = S.spacing ?? [2.1, 2.3], miss = new Set((S.missing ?? []).map(([r, c]) => `${r},${c}`)), list = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (miss.has(`${r},${c}`)) continue;
      const k = seed * 700 + r * 37 + c, f = (i) => 1 + (rnd(k * 1.9 + i) - 0.5) * 0.12, w = 1.3 * f(1), h = 1.05 * f(2), d = 1.3 * f(3);
      list.push(placed(blockGeo(w, h, d, { look: "core", seed: k, seg: 0.2 }), h, (c - (cols - 1) / 2) * sx, 0, (r - (rows - 1) / 2) * sz, ((rnd(k * 2.7) - 0.5) * 6 * Math.PI) / 180));
    }
    if (list.length) mesh(merged(list), stoneMat("core"), P.whole);
    big(P); return { grip: 1.05 };
  },

  gizapavement(P) {
    const S = P.spec, [W, D] = S.size ?? [14, 10], Hh = 0.12, today = S.state !== "past", seed = S.seed ?? 1, slabs = paveLayout(W, D, seed);
    const cutsX = [...new Set(slabs.filter(([, z, , d]) => Math.abs(z + d - D / 2) < 1e-6).map(([x]) => x + W / 2).filter((s) => s > 0.01))];   // joints met by the +z edge
    const cutsZ = [...new Set(slabs.filter(([x, , w]) => Math.abs(x + w - W / 2) < 1e-6).map(([, z]) => D / 2 - z).filter((s) => s > 0.01 && s < D - 0.01))];   // by the +x edge (from +z)
    const mk = (t) => mat("#ffffff", { map: t, roughness: 0.9 });
    const topM = mk(paveTop(W, D, slabs, today, seed)), sxM = mk(paveSide(D, cutsZ, today)), szM = mk(paveSide(W, cutsX, today));
    const box = new THREE.BoxGeometry(W, Hh, D); box.translate(0, Hh / 2, 0);
    mesh(box, [sxM, sxM, topM, topM, szM, szM], P.whole);
    big(P); return { grip: Hh };
  },

  northline(P) {
    const S = P.spec, L = S.len ?? 120, Wd = S.width ?? 0.05, col = S.color ?? "#8fe6dc";
    const q = (w) => { const g = new THREE.PlaneGeometry(w, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, -0.5); return g; };
    const [c, g] = canvas(64, 4); for (let i = 0; i < 64; i++) { const u = Math.abs((i + 0.5) / 32 - 1); g.fillStyle = `rgba(255,255,255,${(0.9 * Math.pow(1 - u, 2.2)).toFixed(3)})`; g.fillRect(i, 0, 1, 4); }
    const glow = steamy(mesh(q(0.3), basic(col, { map: tex(c), opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), P.whole, 0, 0.006, 0), 5);
    const line = steamy(mesh(q(Wd), basic(col, { opacity: 0.97, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), P.whole, 0, 0.009, 0), 6);
    return {
      grip: 0,
      apply(ps) { const k = clamp(num(ps, S, "draw")), on = k > 0.0005; line.visible = glow.visible = on; if (on) line.scale.z = glow.scale.z = L * k; },
    };
  },
};
export const AA_SITE_GRIPS = {};
