// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section D2): the WELL, its WATER states and the
// WELL FLOOR with Odin's old eye. Two kinds, one file. Metres, degrees, x right, y up, +z toward the default camera. A pure function of the
// spec, the state and the clip time t (every mark comes from an index; no random numbers, no clock). Bench: bench/make-well-bench.mjs -> well-sheet.png.
//
// ===== KIND norsewell   Origin: the centre of the well on the cave floor (y 0). Place at the cave's (0, 0, 0), rot 0. Faces nothing: a ring.
//   SIZE  plinth y 0..0.06 r 1.44 | knot band y 0.06..0.26 r 1.39 | cap y 0.26..0.30, inner r 1.15, outer 1.42 | water y 0.22, r 1.15 (painted to 1.17)
//         | inner wall course y 0.22..0.30. Solid for contact: the plinth, the 16 blocks and the 14 cap slabs only (water, glints, spray are not).
//   MADE OF (bench counts)  16 blocks of 0.546 (joints 0.01) = 12 with a 2-strand interlace of 6 crossings (72) + blocks 1, 5, 9, 13 with a 3-loop
//     knot roundel 0.16 across (3 crossings each, 12) = 84 crossings, no two blocks worn alike; 14 cap slabs of 20-32 degrees (27 24 31 22 29 25 32 21
//     28 26 23 30 20 22), 2 hand hollows toward +z (slabs 14 and 1), 2 cracked slabs (4, 12), 1 chipped corner (slab 6) with its chip on the floor,
//     moss on the back half and the joints, 9 fern crowns in the back joints, 20 lichen discs, a dark wet band 0.05 on the inner edge; the SIP STONE
//     (slab 10, 100 degrees round from +z toward -x): a scoop to y 0.235, 0.34 wide, the water lapping 0.18 into it (to r 1.33), ONE mark M6, 0.07 tall,
//     worn nearly flat; 7 lily pads r 0.03-0.06 (a notch, veins); 100 gold glints (60 on the inner rim, 40 scattered), each swapping 3 drawn shapes
//     6 x a second; 5 trains of ripple lines from 3 drip points (spec dripAt); 40 gold motes of 0.01 rising 0.5; an upward glow r 1.2, 1.0 high;
//     22 splash tongues, 60 drops, 18 wall drops (6 a ring), a lap film over the cap's inner edge.
//   SPEC KEYS (all optional)
//     light 0     1 adds the well's two real lights (#8fdcea up-light at (0, 0.45, 0), range 7, 6 % flicker, and the small gold one at (0.4, 0.3, 0.6), range 3.5),
//                 both x glow. Leave 0 when the cave builder or the light plan owns them (default: no real lights).
//     dripAt [[x, z] x3]   the 3 drip points (default [[-0.42, -0.12], [0.4, 0.22], [0.04, 0.56]])
//     ringAt [t, ...]      clip times of the head's syllables: one ring each, 0.8 s to the rim (then 0.45 s of wall drops). Without it `rings` counts them.
//     dipAt [x, z], payAt [x, z]   where the cup goes in (dip) and where the potato eye sinks (pay)
//   STATE (c.prop tweens; seed with a dur-0 set; defaults are the NORSE_WELL_STATE ones, also a spec key = its start value)
//     glow 1      water light and halo; 1.3 at the bulge, 0.8 colder
//     gold 0      hue from blue-gold to full gold #ffd45a (water, halo, motes, light)
//     glints 1    the 100 glints; 0 hides them (cold water at 43.0 s)
//     ripple 0.3  height of the ambient ripples (surface +-4.5 mm at 0.3, the drawn ripple arcs and drip trains follow)
//     bulge 0     a smooth dome of water r 0.95 up to 0.28 high (8.5 s); contour lines, a bright crescent; the scattered glints slide off it
//     splash 0    TWEEN 0 -> 1 over about 1.5 s: the dome breaks (bulge is forced to 0 by splash 0.12), a crown of 22 cel tongues 0.3-0.6 high at r 0.9
//                 (up by 0.25, hold, fall back by 0.85), 60 drops falling back, water lapping 0.01 over the cap's inner edge (0.15-0.8)
//     rings 0     COUNT: tween it up one whole number per syllable at 0.8 s a unit with ease "linear" (rings 0 -> 1 -> 2 ...): ring k travels while the count
//                 goes (k-1) -> k, reaches the rim at k with 6 small drops at the wall; at a whole number nothing is showing. (spec ringAt is exact instead)
//     swirl 0     -1..1 the wake of the head's turn: 5 spiral arms, the pads carried round
//     dip 0       0 -> 1 over about 0.8 s at spec dipAt: a dimple and one ring train
//     pay 0       0 -> 1 over about 0.8 s at spec payAt: a plop ring and a gold bloom r 0.3 just under the surface (peak 0.05-0.4)
//     rise 0      mirror of the head's `rise` (tween both): the pads are pushed to the rim, one heave ring leaves (0, -0.2). 0 = untouched
//   For the head (C): the surface is y 0.22; at the centre the water is opaque from above; the head stands at (0, 0.22, -0.20). Pads and bulge as above.
//   HOLD POINTS: none. Nothing here is held by a hand (NORSE_WELL_GRIPS is empty).
//
// ===== KIND norsefloor   Origin: the centre of the pebble floor (y 0 = the floor). Its own small set: place it 300 m or more from the cave
//   (the bench uses x 300). The camera is under water near the floor looking up; the real Chip stands on the ledge and leans over the rim.
//   SIZE  shaft r 1.15, floor y 0, water surface y 2.40 (12 dry-stone courses of 0.2), dark rim ring y 2.48 (r 1.15..1.42), ledge ring r 1.42..2.60 at
//         y 2.18 (SOLID: Chip stands on its top at y 2.18, move action { y: 2.18 }, 0.36 m off the rim, rim top 0.30 over his feet). The ledge is open to the sky.
//   MADE OF  260 pebbles of 0.03-0.14 (202 plain: blue-grey #5f7f8f, teal #3f8f8a, slate #3a4a5a, 1 in 9 ochre; 38 GOLD glowing from inside, core #ffd45a rim
//     #ff9f2a, halo 0.05; 20 pale CYAN #9fe6f0), piled deepest at the wall; 9 of the plain ones are the eye's nest. ODIN'S EYE at (0.25, 0.09, 0.15), orb r 0.055
//     half sunk: ivory #f3efe2 / #cfc9b8, his iris #7d8a99 (ring #4a5563, 14 flecks), pupil #14181d, ONE catch-light, a moving light line across it; no
//     veins, no red; 2 stone lids (upper curved over its top, lower under it, WET STONE with grain) and 7 weed lashes on the upper one; 12 ribbon weeds
//     0.3-0.8 at the wall swaying 10 degrees at 0.4 Hz; the shaft wall 12 courses, 13-15 stones a course, weed in the joints, glints; water light: height tint
//     (#0f4f6a / #1f86a8 / #7fdcec), a fade into the water by 3.5 m, a moving net of bright lines #dff8fb at 0.5, 0.25 apart, 0.12 m/s over pebbles, orb and wall;
//     9 slanting rays (2 cards each) swaying 3 degrees; 70 drifting motes; a thread of 5 bubbles every 1.6 s; a bright rippling surface disc at y 2.40 with the
//     cave's ceiling soft through it (4 dark root shapes and one bright gap patch, a painted disc r 6 at y 9.2); the head from below: a dark boulder r 0.95 at
//     (-0.35, 2.40, -0.2) (0.55 of open water on the +x side) with 14 beard strands hanging 0.6-1.6, swaying.
//   SPEC KEYS  light 1  (0 drops the floor's one PointLight #bfeaf0 at (0.6, 2.7, 0.2), range 6); blinkAt [t, ...] clip times of the blinks (silt and bubbles
//     follow from there; without it they follow the blink value)
//   STATE  blink 0   the upper stone slides down over the orb (0 open .. 1 shut, 58 degrees): the director gives 3 frames down, 1 shut, 2 up; 5 silt motes and 3 bubbles rise
//          lookX, lookY 0  -1..1 the iris turns up to 30 degrees: lookX toward +x (at 13 s toward Chip), lookY toward -z (up the frame for the default camera); the eye rests
//                          tilted 18 degrees toward +z so the default floor camera sees his iris
//          plunge 0   the dive: 30 bubbles streaming up the shaft, gone at 1
//          headShadow 1  the head's underside and beard (0 hides them)
//          peek 0     fallback if the real Chip cannot lean: a small dark round head with two leaf tips on the bright disc, no face
//   NOTE Lights: only the floor's one PointLight (norsefloor) and, with spec light 1, the well's two. Everything else is painted (unlit, own shading).
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// ---------------------------------------------------------------------------------------------------------------------
// helpers: hashes, colours, canvases, baked geometry. Nothing random, nothing on a clock: every mark comes from an index.
// ---------------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const H3 = (a, b, c) => hh(a * 17.13 + b * 91.7 + c * 51.3 + 7.7);
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const fract = (x) => x - Math.floor(x);
const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const rgba = (c, a) => { const A = hexA(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };

// the shared palette (DESIGN, top)
const K = {
  stone: "#7b8284", stoneS: "#4a5357", stoneL: "#a9b3b2", glint: "#d9eef0", joint: "#1d2527", ground: "#3a4447",
  moss: "#6f9140", mossH: "#9aa83e", mossS: "#3f5a28", mossL: "#a9c456", mossHL: "#c9cf6a",
  lichen: "#b9c7a6", lichenO: "#c9a93a", lichenR: "#8fa088", lichenL: "#dfe8cf",
  water: "#2f9fc6", waterD: "#1a6f9a", waterL: "#7fdcec", wGlint: "#ffd86a", wHot: "#fff3c4", wRipple: "#c9f2f7", gold: "#ffd45a",
  goldBase: "#e6b13c", goldDeep: "#a8741c", pad: "#6f9a4a", padS: "#4d7634",
  fern1: "#6fa83f", fern2: "#4f8a3a", fern3: "#8fbf4f",
};

function canvasTex(w, h, draw, name = "", aniso = 8) {
  const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, Math.round(h));
  const g = cv.getContext("2d"); draw(g, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name;
  if (typeof window !== "undefined" && window.__TEXDUMP) (window.__TEX ||= {})[name || `t${Object.keys(window.__TEX || {}).length}`] = cv;
  return t;
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const paintMat = (map, o = {}) => noLine(new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false, ...o }));
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, ...o }));
const stdMat = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.6, ...o }); m.userData.noHatch = true; return m; };
const steamy = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };
const flat = (o) => { o.castShadow = false; o.userData.solid = false; return o; };
const radialTex = (stops, n = 128) => canvasTex(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);

const V3 = THREE.Vector3;
// a nu x nv surface from f(u, v) -> [x, y, z]; u, v in 0..1; uv kept (u, v) unless uvf says otherwise
function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; pos.push(...f(u, v)); uv.push(...(uvf ? uvf(u, v) : [u, v])); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const colorize = (geo, fn) => {
  const p = geo.attributes.position, n = geo.attributes.normal, c = new Float32Array(p.count * 3), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) { tmp.set(fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i)); c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo;
};
// value noise
const vn = (x, y, z, s, sd) => {
  x *= s; y *= s; z *= s; const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const f = (a, b, c) => H3(ix + a + sd * 13, iy + b, iz + c);
  const l = (a, b, t) => a + (b - a) * t, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  return l(l(l(f(0, 0, 0), f(1, 0, 0), u), l(f(0, 1, 0), f(1, 1, 0), u), v), l(l(f(0, 0, 1), f(1, 0, 1), u), l(f(0, 1, 1), f(1, 1, 1), u), v), w);
};

// ---------------------------------------------------------------------------------------------------------------------
// 2D painters. Every one draws in METRES on a canvas whose transform is already set (y up): flat colours inside a dark line.
// ---------------------------------------------------------------------------------------------------------------------
const ellP = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
const polyP = (g, pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };
function line(g, pts, lw, col) { polyP(g, pts, false); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); }
function smoothP(g, pts, close = true) {
  const n = pts.length; g.beginPath();
  if (close) { const m = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2]; g.moveTo(...m(n - 1)); for (let i = 0; i < n; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i)); g.closePath(); }
  else { g.moveTo(...pts[0]); for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(...pts[n - 1]); }
}
const dot = (g, x, y, r, col) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col; g.fill(); };

// a cushion of moss: an uneven body, shade low, light on top, a stippled edge (seeded)
function mossPatch(g, cx, cy, rx, ry, seed, dens = 1) {
  const k = 13, pts = []; for (let i = 0; i < k; i++) { const a = (i / k) * TAU, r = 0.78 + 0.32 * H2(seed, i); pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  smoothP(g, pts); g.fillStyle = K.moss; g.fill();
  const dr = Math.max(0.0012, Math.min(rx, ry) * 0.075), n = Math.round(46 * dens);
  for (let i = 0; i < n; i++) {
    const a = H2(seed + 3, i) * TAU, d = Math.sqrt(H2(seed + 5, i)), up = Math.sin(a) > -0.1, edge = d > 0.78;
    const x = cx + Math.cos(a) * rx * (0.2 + 0.95 * d), y = cy + Math.sin(a) * ry * (0.2 + 0.95 * d);
    dot(g, x, y, dr * (0.7 + 0.8 * H2(seed + 7, i)), edge ? (i % 3 ? K.moss : K.mossS) : up ? (i % 2 ? K.mossL : K.moss) : (i % 2 ? K.mossS : K.moss));
  }
}
// a lichen disc with a paler rim (1 in 4 ochre)
function lichen(g, x, y, r, seed) {
  const o = H2(seed, 1) < 0.25, base = o ? K.lichenO : K.lichen, k = 11, pts = [];
  for (let i = 0; i < k; i++) { const a = (i / k) * TAU; pts.push([x + Math.cos(a) * r * (0.88 + 0.2 * H2(seed, i + 2)), y + Math.sin(a) * r * (0.88 + 0.2 * H2(seed, i + 9))]); }
  smoothP(g, pts); g.fillStyle = base; g.fill(); g.strokeStyle = K.lichenL; g.lineWidth = r * 0.22; g.stroke();
  for (let i = 0; i < 6; i++) { const a = H2(seed, 20 + i) * TAU, d = r * 0.55 * Math.sqrt(H2(seed, 30 + i)); dot(g, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.09, o ? "#8a7424" : K.lichenR); }
}

// ---- the knot band: 16 blocks of 0.5459 x 0.20 (22.5 degrees at r 1.39) ----------------------------------------------
const BW = 0.5459, BH = 0.20, BPX = 940;
const ROUNDEL = [1, 5, 9, 13];
const D_X = BW / 6, LAM = 2 * D_X, AMP = 0.050, CY = 0.10, STW = 0.034;   // 6 crossings, 3 periods a block
const sA = (x) => CY + AMP * Math.sin((TAU * (x - D_X / 2)) / LAM);
const sB = (x) => CY - AMP * Math.sin((TAU * (x - D_X / 2)) / LAM);
// the trefoil (3 crossings): sample, find the self-crossings, alternate over / under
const TREF = (() => {
  const N = 360, P = [];
  for (let k = 0; k < N; k++) { const t = (k / N) * TAU; P.push([Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t)]); }
  const ext = Math.max(...P.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))), s = 0.073 / ext;
  const xs = []; // crossings: t values on both passes
  for (let a = 0; a < N; a++) for (let b = a + 2; b < N; b++) {
    if (a === 0 && b === N - 1) continue;
    const [p, q] = [P[a], P[(a + 1) % N]], [r, u] = [P[b], P[(b + 1) % N]];
    const d = (q[0] - p[0]) * (u[1] - r[1]) - (q[1] - p[1]) * (u[0] - r[0]); if (Math.abs(d) < 1e-9) continue;
    const ta = ((r[0] - p[0]) * (u[1] - r[1]) - (r[1] - p[1]) * (u[0] - r[0])) / d, tb = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
    if (ta >= 0 && ta < 1 && tb >= 0 && tb < 1) xs.push([(a + ta) / N * TAU, (b + tb) / N * TAU]);
  }
  const all = xs.flatMap(([a, b]) => [a, b]).sort((p, q) => p - q), over = all.filter((_, i) => i % 2 === 0);
  return { pt: (t) => [(Math.sin(t) + 2 * Math.sin(2 * t)) * s, (Math.cos(t) - 2 * Math.cos(2 * t)) * s], crossings: xs.length, over };
})();

function strokeStrand(g, pts, w, mode) {
  if (mode === "bump") {
    line(g, pts, w + 0.008, "#1c1c1c"); line(g, pts, w, "#6a6a6a"); line(g, pts, w * 0.7, "#929292"); line(g, pts, w * 0.42, "#bcbcbc"); line(g, pts, w * 0.12, "#7c7c7c");
  } else {
    line(g, pts, w + 0.008, K.joint); line(g, pts, w, K.stone);
    line(g, pts.map(([x, y]) => [x, y + w * 0.27]), w * 0.3, K.stoneL); line(g, pts.map(([x, y]) => [x, y - w * 0.3]), w * 0.26, "#5d676a");
    line(g, pts, w * 0.1, K.stoneS);
  }
}
function paintBlock(i, mode) {
  const w = Math.round(BW * BPX), h = Math.round(BH * BPX), col = mode === "col", round = ROUNDEL.includes(i);
  return canvasTex(w, h, (g) => {
    g.setTransform(BPX, 0, 0, -BPX, 0, h);
    g.fillStyle = col ? K.ground : "#222222"; g.fillRect(0, 0, BW, BH);
    if (col) {   // the ground: darker than the strands, speckled, mossy
      for (let k = 0; k < 150; k++) dot(g, H2(i, k) * BW, H2(i, k + 400) * BH, 0.0015 + 0.0025 * H2(i, k + 800), k % 3 ? "#2c3538" : "#566064");
      const lg = g.createLinearGradient(0, BH, 0, 0); lg.addColorStop(0, "rgba(20,26,28,0.28)"); lg.addColorStop(0.35, "rgba(20,26,28,0)"); lg.addColorStop(1, "rgba(20,26,28,0.22)"); g.fillStyle = lg; g.fillRect(0, 0, BW, BH);
    }
    // the frame lines top and bottom
    for (const y of [0.0135, BH - 0.0135]) strokeStrand(g, [[0.0, y], [BW, y]], 0.015, mode);
    const xs = (a, b, n = 70) => Array.from({ length: n + 1 }, (_, q) => a + ((b - a) * q) / n);
    if (!round) {
      const P = (f, a, b) => xs(a, b).map((x) => [x, f(x)]);
      strokeStrand(g, P(sA, 0, BW), STW, mode); strokeStrand(g, P(sB, 0, BW), STW, mode);
      for (let k = 0; k < 6; k++) { const xk = D_X / 2 + k * D_X, f = k % 2 === 0 ? sA : sB; strokeStrand(g, P(f, xk - D_X * 0.42, xk + D_X * 0.42), STW, mode); }
    } else {
      const R0 = 0.094;
      // plain tails run in to the ring; the roundel is a ring and the three-loop knot
      for (const [a, b] of [[0.0, BW / 2 - R0], [BW / 2 + R0, BW]]) strokeStrand(g, [[a, CY - 0.021], [b, CY - 0.021]], 0.028, mode), strokeStrand(g, [[a, CY + 0.021], [b, CY + 0.021]], 0.028, mode);
      g.save(); g.translate(BW / 2, CY);
      ellP(g, 0, 0, R0, R0); g.strokeStyle = col ? K.joint : "#1c1c1c"; g.lineWidth = 0.02; g.stroke(); g.strokeStyle = col ? K.stone : "#8a8a8a"; g.lineWidth = 0.0115; g.stroke();
      if (col) { ellP(g, 0, 0, R0, R0); g.strokeStyle = K.stoneS; g.lineWidth = 0.0025; g.stroke(); }
      const T = (t0, t1, n = 120) => Array.from({ length: n + 1 }, (_, q) => TREF.pt(t0 + ((t1 - t0) * q) / n));
      strokeStrand(g, T(0, TAU, 400), 0.0225, mode);
      for (const tc of TREF.over) strokeStrand(g, T(tc - 0.17, tc + 0.17, 24), 0.0225, mode);
      g.restore();
    }
    // wear, seeded per block: no two alike
    const nm = 2 + Math.floor(3 * H2(i, 90)), nc = 3 + Math.floor(4 * H2(i, 91));
    if (col) {
      for (let k = 0; k < nm; k++) mossPatch(g, 0.04 + 0.46 * H2(i, 100 + k), (k % 2 ? 0.035 : 0.17) + 0.03 * H2(i, 120 + k), 0.025 + 0.03 * H2(i, 140 + k), 0.014 + 0.014 * H2(i, 160 + k), i * 13 + k, 0.7);
      for (let k = 0; k < 3; k++) { const x = 0.05 + 0.45 * H2(i, 200 + k), L = 0.03 + 0.08 * H2(i, 210 + k); line(g, [[x, BH], [x + 0.004 * (H2(i, 220 + k) - 0.5), BH - L]], 0.004, "rgba(20,30,34,0.35)"); }
    }
    for (let k = 0; k < nc; k++) {   // chips on the strands and the ground: a dark notch under a pale lip
      const x = 0.03 + 0.48 * H2(i, 300 + k), y = 0.03 + 0.14 * H2(i, 310 + k), s = 0.003 + 0.004 * H2(i, 320 + k), a = H2(i, 330 + k) * TAU;
      const poly = Array.from({ length: 5 }, (_, q) => [x + Math.cos(a + q * 1.26) * s * (0.7 + 0.5 * H2(i, 340 + k * 5 + q)), y + Math.sin(a + q * 1.26) * s * (0.7 + 0.5 * H2(i, 340 + k * 5 + q))]);
      polyP(g, poly); g.fillStyle = col ? "#252d30" : "#101010"; g.fill();
      if (col) { polyP(g, poly.map(([px, py]) => [px - 0.0012, py + 0.0016])); g.strokeStyle = K.stoneL; g.lineWidth = 0.0016; g.stroke(); }
    }
    if (!col) return;
    // the wet glints on the lit upper strand edges
    for (let k = 0; k < 6; k++) dot(g, 0.02 + 0.5 * H2(i, 400 + k), 0.04 + 0.13 * H2(i, 410 + k), 0.0016, K.glint);
  }, `knot${i}${mode}`);
}

// ---- the cap's slabs: the top of each slab painted in (arc metres, radial metres from the inner edge) ------------------
const SLAB = [27, 24, 31, 22, 29, 25, 32, 21, 28, 26, 23, 30, 20, 22];   // degrees, 14 of them, 360 in all
const SLAB_OFF = 8;                                                        // so slab 10 is centred on 260 degrees (100 round toward -x)
const SLAB_AT = (() => { const a = []; let c = SLAB_OFF; for (const w of SLAB) { a.push([c, c + w]); c += w; } return a; })();
const R_IN = 1.15, R_OUT = 1.42, CAP_W = R_OUT - R_IN;
const SIP = 9, CRACKED = [3, 11], CHIPPED = 5, HOLLOW = [13, 0];   // slab indices (0-based): the sip stone, 2 cracked, the chipped one, the 2 hollows at the front
function paintCap(i) {
  const [a0, a1] = SLAB_AT[i], arc = (a1 - a0) * DEG * 1.285, px = 760, w = Math.round(arc * px), h = Math.round(CAP_W * px);
  const mid = (a0 + a1) / 2, back = clamp(1 - Math.abs(((mid % 360) - 180)) / 95);   // the back half carries the moss
  return canvasTex(w, h, (g) => {
    g.setTransform(px, 0, 0, -px, 0, h);
    const lg = g.createLinearGradient(0, 0, 0, CAP_W); lg.addColorStop(0, "#8d9696"); lg.addColorStop(0.45, K.stone); lg.addColorStop(1, "#6d7678"); g.fillStyle = lg; g.fillRect(0, 0, arc, CAP_W);
    for (let k = 0; k < 60; k++) dot(g, H2(i, k) * arc, H2(i, k + 100) * CAP_W, 0.0016 + 0.003 * H2(i, k + 200), k % 2 ? "#5f6a6d" : "#9aa5a5");   // 60 speckles a slab (worn grit)
    for (let k = 0; k < 14; k++) { const x = H2(i, 500 + k) * arc, y = H2(i, 520 + k) * CAP_W, L = 0.04 + 0.08 * H2(i, 540 + k); g.save(); g.translate(x, y); g.rotate((H2(i, 560 + k) - 0.5) * 1.2); ellP(g, 0, 0, L, L * 0.34); g.fillStyle = "rgba(190,205,205,0.10)"; g.fill(); g.restore(); }
    if (HOLLOW.includes(i)) {   // a hollow where hands have leaned: toward +z, polished
      const cx = arc * (i === 0 ? 0.33 : 0.62), cy = 0.095; g.save(); g.translate(cx, cy); g.scale(1, 0.4); const q = g.createRadialGradient(0, 0, 0, 0, 0, 0.2); q.addColorStop(0, "rgba(70,80,84,0.38)"); q.addColorStop(0.7, "rgba(80,92,96,0.22)"); q.addColorStop(1, "rgba(80,92,96,0)"); g.fillStyle = q; g.beginPath(); g.arc(0, 0, 0.2, 0, TAU); g.fill(); g.restore();
      line(g, [[cx - 0.12, cy + 0.045], [cx - 0.02, cy + 0.065], [cx + 0.1, cy + 0.045]], 0.004, "rgba(217,238,240,0.4)");
    }
    // moss: the back half and the joints (about 35 % of the cap)
    const nMoss = Math.round(0.8 + back * 5.2), mark = [];
    for (let k = 0; k < nMoss; k++) { const x = (0.08 + 0.84 * H2(i, 600 + k)) * arc, y = (k % 2 ? 0.2 : 0.07) + 0.05 * H2(i, 620 + k), rx = 0.035 + 0.075 * H2(i, 640 + k), ry = 0.02 + 0.03 * H2(i, 660 + k); mossPatch(g, x, y, rx, ry, i * 31 + k, 1); mark.push([x, y, rx]); }
    for (const [ex, sg] of [[0.0, 1], [arc, -1]]) if (H2(i, 700 + sg) < 0.35 + 0.6 * back) for (let k = 0; k < 2; k++) mossPatch(g, ex - sg * 0.004, 0.05 + 0.2 * H2(i, 710 + k + sg), 0.02 + 0.02 * H2(i, 720 + k), 0.016 + 0.02 * H2(i, 730 + k), i * 47 + k + (sg > 0 ? 5 : 0), 0.8);
    const nl = i < 6 ? 2 : 1; for (let k = 0; k < nl; k++) lichen(g, (0.15 + 0.7 * H2(i, 800 + k)) * arc, 0.05 + 0.17 * H2(i, 810 + k), 0.013 + 0.026 * H2(i, 820 + k), i * 11 + k);   // 20 discs in all
    for (let k = 0; k < 3; k++) { const x = H2(i, 900 + k) * arc, y = 0.03 + 0.2 * H2(i, 910 + k); line(g, [[x, y], [x + 0.05 * (H2(i, 920 + k) - 0.5), y + 0.07], [x + 0.03 * (H2(i, 930 + k) - 0.5), y + 0.12 + 0.05 * H2(i, 940 + k)]], 0.0016, "rgba(40,48,50,0.7)"); }   // hairline cracks
    if (CRACKED.includes(i)) {   // a cracked slab: one long crack right across, a pale lip along it
      const x0 = arc * (0.35 + 0.3 * H2(i, 950)), pts = [[x0, 0], [x0 + 0.03, 0.05], [x0 - 0.015, 0.1], [x0 + 0.045, 0.16], [x0 + 0.01, 0.21], [x0 + 0.05, CAP_W]];
      line(g, pts.map(([x, y]) => [x - 0.003, y]), 0.003, "rgba(205,222,222,0.5)"); line(g, pts, 0.0042, "#1e2628");
      line(g, [[x0 + 0.03, 0.05], [x0 + 0.075, 0.075], [x0 + 0.09, 0.1]], 0.0022, "#222b2d");
    }
    if (i === CHIPPED) { polyP(g, [[arc * 0.7, CAP_W + 0.002], [arc + 0.002, CAP_W + 0.002], [arc + 0.002, CAP_W - 0.1], [arc * 0.9, CAP_W - 0.075], [arc * 0.8, CAP_W - 0.035]]); g.fillStyle = "#b4bfbd"; g.fill(); line(g, [[arc * 0.7, CAP_W], [arc * 0.8, CAP_W - 0.035], [arc * 0.9, CAP_W - 0.075], [arc, CAP_W - 0.1]], 0.003, "#2a3335"); }
    if (i === SIP) {   // the sip stone: a worn scoop, the wet edge, ONE mark M6 worn nearly flat
      const cx = arc / 2; g.save(); g.beginPath(); g.moveTo(cx - 0.17, 0); g.lineTo(cx - 0.17, 0.12); g.quadraticCurveTo(cx - 0.17, 0.185, cx, 0.19); g.quadraticCurveTo(cx + 0.17, 0.185, cx + 0.17, 0.12); g.lineTo(cx + 0.17, 0); g.closePath();
      const q = g.createLinearGradient(0, 0, 0, 0.19); q.addColorStop(0, "#556064"); q.addColorStop(0.8, "#6a7679"); q.addColorStop(1, "#7b8789"); g.fillStyle = q; g.fill(); g.strokeStyle = "rgba(34,44,46,0.55)"; g.lineWidth = 0.004; g.stroke(); g.restore();
      line(g, [[cx - 0.15, 0.13], [cx - 0.07, 0.178], [cx + 0.05, 0.185], [cx + 0.15, 0.135]], 0.003, K.glint);
      const MK = [[[0, 0.3], [0.8, 1.7]], [[0, 1.7], [0.8, 0.3]]], u = 0.035, ox = cx + 0.23 - 0.014, oy = 0.12;   // M6: 0.07 tall
      for (const [a, b] of MK) { line(g, [[ox + a[0] * u + 0.0012, oy + a[1] * u + 0.0016], [ox + b[0] * u + 0.0012, oy + b[1] * u + 0.0016]], 0.0042, "rgba(217,238,240,0.28)"); line(g, [[ox + a[0] * u, oy + a[1] * u], [ox + b[0] * u, oy + b[1] * u]], 0.0042, "rgba(48,58,60,0.5)"); }
    }
    // the dark wet band 0.05 along the inner edge, a bright wet line at the lip
    const wb = g.createLinearGradient(0, 0, 0, 0.055); wb.addColorStop(0, "rgba(34,46,50,0.88)"); wb.addColorStop(0.8, "rgba(46,60,64,0.55)"); wb.addColorStop(1, "rgba(60,74,78,0)"); g.fillStyle = wb; g.fillRect(0, 0, arc, 0.055);
    for (let k = 0; k < 7; k++) dot(g, H2(i, 1000 + k) * arc, 0.006 + 0.03 * H2(i, 1010 + k), 0.0017, K.glint);
    g.fillStyle = "rgba(20,26,28,0.65)"; g.fillRect(0, 0, 0.004, CAP_W); g.fillRect(arc - 0.004, 0, 0.004, CAP_W);   // the joints
    return mark;
  }, `cap${i}`);
}

// the inner course above the water: dark, wet, glints; 22 stones round
function paintInner() {
  return canvasTex(2048, 64, (g, w, h) => {
    const sx = w / (TAU * 1.17), sy = h / 0.04; g.setTransform(sx, 0, 0, -sy / 1 * 1, 0, h); const L = TAU * 1.17;
    g.fillStyle = "#2c3638"; g.fillRect(0, 0, L, 0.04);
    for (let k = 0; k < 22; k++) { const x0 = (k / 22) * L, wd = L / 22; const sh = 0.78 + 0.3 * H2(k, 4); g.fillStyle = cmul("#3d4a4d", sh); g.fillRect(x0 + 0.004, 0.002, wd - 0.008, 0.036); line(g, [[x0 + 0.01, 0.034], [x0 + wd * 0.5, 0.036], [x0 + wd - 0.01, 0.033]], 0.002, "rgba(169,179,178,0.35)"); g.fillStyle = "#12191a"; g.fillRect(x0, 0, 0.004, 0.04); }
    g.fillStyle = "#12191a"; g.fillRect(0, 0, L, 0.003);
    for (let k = 0; k < 40; k++) dot(g, H2(k, 8) * L, 0.004 + 0.03 * H2(k, 9), 0.0012 + 0.0016 * H2(k, 10), K.glint);
    for (let k = 0; k < 9; k++) mossPatch(g, H2(k, 12) * L, 0.002, 0.03 + 0.03 * H2(k, 13), 0.008, k + 91, 0.6);
  }, "inner", 4);
}

// ---- ferns, pads, glints: small painted cards ---------------------------------------------------------------------------
function paintFrond() {   // a fern frond pointing up: 13 pairs of leaflets, white with a dark line (tinted per frond)
  return canvasTex(128, 320, (g, w, h) => {
    g.setTransform(w, 0, 0, -w, w / 2, h); const L = h / w - 0.08;
    const rx = (s) => 0.1 * s * s, ry = (s) => 0.05 + (L - 0.05) * s;
    line(g, Array.from({ length: 20 }, (_, q) => [rx(q / 19), ry(q / 19)]), 0.03, "#26331c");
    for (let k = 0; k < 13; k++) for (const sd of [-1, 1]) {
      const s = 0.06 + (k / 13) * 0.9, px = rx(s), py = ry(s), len = 0.4 * (1 - 0.8 * s) * (k === 0 ? 0.6 : 1), a = (62 - 30 * s) * DEG;
      g.save(); g.translate(px, py); g.rotate(-sd * (Math.PI / 2 - a)); ellP(g, 0, len * 0.5, len * 0.2, len * 0.5); g.fillStyle = cmix("#ffffff", "#9aa58f", 0.18 * (1 - s)); g.fill(); g.strokeStyle = "#26331c"; g.lineWidth = 0.014; g.stroke(); g.restore();
    }
    const tp = [rx(1), ry(1)]; ellP(g, tp[0], tp[1] + 0.06, 0.07, 0.12); g.fillStyle = "#ffffff"; g.fill(); g.strokeStyle = "#26331c"; g.lineWidth = 0.014; g.stroke();
  }, "frond", 4);
}
function paintPad() {   // a lily pad with a notch, veins and a dark rim
  return canvasTex(128, 128, (g, w, h) => {
    g.setTransform(w / 2.2, 0, 0, -w / 2.2, w / 2, h / 2); const n0 = (-90 - 14) * DEG, n1 = (-90 + 14) * DEG;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1, n1, n0 + TAU); g.closePath(); g.fillStyle = K.pad; g.fill(); g.strokeStyle = "#2e4a22"; g.lineWidth = 0.085; g.stroke();
    g.save(); g.clip(); ellP(g, 0.2, 0.25, 0.7, 0.55, 0.4); g.fillStyle = "rgba(160,205,110,0.5)"; g.fill(); g.restore();
    for (let k = 0; k < 11; k++) { const a = n1 + ((k + 0.5) / 11) * (TAU - 28 * DEG); line(g, [[0, 0], [Math.cos(a) * 0.9, Math.sin(a) * 0.9]], 0.04, K.padS); }
  }, "pad", 4);
}
const GL_SHAPES = [
  (g, c) => { polyP(g, [[0, 0.95], [0.16, 0.16], [0.95, 0], [0.16, -0.16], [0, -0.95], [-0.16, -0.16], [-0.95, 0], [-0.16, 0.16]]); g.fillStyle = K.wGlint; g.fill(); dot(g, 0, 0, 0.17, K.wHot); },
  (g, c) => { g.save(); g.rotate(0.6); ellP(g, 0, 0, 0.85, 0.2); g.fillStyle = K.wGlint; g.fill(); ellP(g, 0, 0, 0.5, 0.1); g.fillStyle = K.wHot; g.fill(); g.restore(); dot(g, 0.4, 0.55, 0.12, K.wGlint); },
  (g, c) => { for (const [x, y, r] of [[-0.45, -0.3, 0.26], [0.5, -0.15, 0.2], [0.05, 0.5, 0.3]]) { dot(g, x, y, r, K.wGlint); dot(g, x, y, r * 0.5, K.wHot); } },
];
const glintTex = (k) => canvasTex(64, 64, (g, w, h) => { g.setTransform(w / 2.1, 0, 0, -h / 2.1, w / 2, h / 2); const q = g.createRadialGradient(0, 0, 0, 0, 0, 1); q.addColorStop(0, "rgba(255,216,106,0.35)"); q.addColorStop(1, "rgba(255,216,106,0)"); g.fillStyle = q; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); GL_SHAPES[k](g); }, `glint${k}`, 1);

// ---- geometry --------------------------------------------------------------------------------------------------------
function outward(geo, cx = 0, cz = 0) {
  const p = geo.attributes.position, n = geo.attributes.normal; let s = 0;
  for (let i = 0; i < p.count; i++) s += n.getX(i) * (p.getX(i) - cx) + n.getZ(i) * (p.getZ(i) - cz);
  if (s < 0) { const ix = geo.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } geo.computeVertexNormals(); }
  return geo;
}
const ang3 = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a)];   // angle from +z toward +x

function buildPlinth() {   // y 0..0.06, r 1.44: rough wet stone, moss at its foot
  const prof = [[1.376, 0.0605], [1.425, 0.0585], [1.447, 0.046], [1.443, 0.024], [1.452, 0.0]], nu = 120;
  const g = surf(nu, prof.length - 1, (u, v) => {
    const a = u * TAU, q = v * (prof.length - 1), j = Math.min(prof.length - 2, Math.floor(q)), f = q - j;
    const r = lerp(prof[j][0], prof[j + 1][0], f) + 0.007 * (vn(Math.sin(a) * 3, 0, Math.cos(a) * 3, 2, 1) - 0.5) + 0.004 * (H2(Math.round(u * nu), j) - 0.5);
    return ang3(r, a, lerp(prof[j][1], prof[j + 1][1], f));
  });
  outward(g);
  return colorize(g, (x, y, z) => {
    const m = vn(x, y, z, 14, 3), foot = 1 - sm(y / 0.034), mm = vn(x, 0, z, 9, 5) * 0.7 + vn(x, 0, z, 26, 6) * 0.3;
    let c = cmix(cmix(K.stoneS, K.stone, 0.35 + 0.5 * m), K.stoneL, y > 0.052 ? 0.35 : 0);
    if (foot * mm > 0.38) c = cmix(c, mm > 0.62 ? K.mossL : K.moss, clamp((foot * mm - 0.38) * 5));
    return c;
  });
}
function buildBand() {   // the 16 blocks: curved faces with their own relief; returns [{geo, i}]
  return Array.from({ length: 16 }, (_, k) => {
    const i = k + 1, phi = k * 22.5 * DEG, half = (22.5 - 0.42) * 0.5 * DEG;
    const g = surf(40, 12, (u, v) => {
      const edge = Math.min(u * BW, (1 - u) * BW, v * BH, (1 - v) * BH), n = vn(u * 3 + i * 7, v * 2, i, 1.3, 2), r = 1.39 + 0.0045 * (n - 0.5) - 0.0045 * (1 - sm(edge / 0.014));
      return ang3(r, phi + (u - 0.5) * 2 * half, 0.06 + BH * v);
    });
    return { geo: outward(g), i };
  });
}
// one cap slab: a closed block, the top worn smooth with its hollows, scoop, chip
function buildSlab(i) {
  const [a0, a1] = SLAB_AT[i], gap = 0.0045 / 1.28, A0 = a0 * DEG + gap, A1 = a1 * DEG - gap, arcW = (A1 - A0) * 1.285, nu = 26, nv = 9;
  const hAt = (u, v) => {
    const r = R_IN + CAP_W * v, edge = Math.min(u * arcW, (1 - u) * arcW, v * CAP_W, (1 - v) * CAP_W);
    let y = 0.30 - 0.0075 * (1 - sm(edge / 0.022)) - 0.0028 * vn(u * 4 + i * 5, v * 3, i, 1.4, 4) - 0.0012 * vn(u * 14, v * 9, i, 1, 9);
    if (HOLLOW.includes(i)) { const cx = i === 0 ? 0.33 : 0.62, d = ((u - cx) * arcW / 0.2) ** 2 + ((v * CAP_W - 0.095) / 0.075) ** 2; y -= 0.0075 * Math.pow(Math.max(0, 1 - d), 2); }
    if (i === SIP) { const across = Math.abs(u - 0.5) * arcW / 0.17; y -= 0.065 * sm((1 - across) / 0.4) * sm((1.335 - r) / 0.05); }
    if (i === CHIPPED) { const p = (u - 0.7) / 0.3, q = (1 - v) * CAP_W / 0.1; if (p > 0) y -= 0.027 * sm((p - q) * 3); }
    if (CRACKED.includes(i)) { const x0 = 0.35 + 0.3 * H2(i, 950); y -= 0.0014 * sm((u - x0) * 14); }
    return y;
  };
  const pos = [], uv = [], idx = [], gridI = (a, b) => b * (nu + 1) + a;
  for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) { const u = a / nu, v = b / nv; pos.push(...ang3(R_IN + CAP_W * v, lerp(A0, A1, u), hAt(u, v))); uv.push(u, v); }
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) idx.push(gridI(a, b), gridI(a, b + 1), gridI(a + 1, b), gridI(a + 1, b), gridI(a, b + 1), gridI(a + 1, b + 1));
  // skirts
  const skirt = (cells, want, vfix = null) => {   // cells: [[a, b], ...] along an edge; want: the outward direction (x, z)
    const s0 = pos.length / 3; for (const [a, b] of cells) { const q = gridI(a, b); const vv = vfix ?? uv[q * 2 + 1]; pos.push(pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2], pos[q * 3], Math.min(0.258, pos[q * 3 + 1] - 0.012), pos[q * 3 + 2]); uv.push(uv[q * 2], vv, uv[q * 2], vv); }
    const tri = [], n = cells.length; for (let k = 0; k < n - 1; k++) { const t0 = s0 + 2 * k, b0 = t0 + 1, t1 = t0 + 2, b1 = t0 + 3; tri.push(t0, b0, t1, t1, b0, b1); }
    const pa = [0, 1, 2].map((q) => new V3(pos[tri[q] * 3], pos[tri[q] * 3 + 1], pos[tri[q] * 3 + 2])), nrm = new V3().crossVectors(pa[1].clone().sub(pa[0]), pa[2].clone().sub(pa[0]));
    if (nrm.x * want[0] + nrm.z * want[1] < 0) for (let k = 0; k < tri.length; k += 3) { const t = tri[k + 1]; tri[k + 1] = tri[k + 2]; tri[k + 2] = t; }
    idx.push(...tri);
  };
  const mid = (A0 + A1) / 2, rad = [Math.sin(mid), Math.cos(mid)], tan = [Math.cos(mid), -Math.sin(mid)];
  skirt(Array.from({ length: nu + 1 }, (_, a) => [a, 0]), [-rad[0], -rad[1]]);
  skirt(Array.from({ length: nu + 1 }, (_, a) => [a, nv]), rad, 0.5);
  skirt(Array.from({ length: nv + 1 }, (_, b) => [0, b]), [-tan[0], -tan[1]]);
  skirt(Array.from({ length: nv + 1 }, (_, b) => [nu, b]), tan);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// the water's painting: a disc of r 1.17 redrawn every frame from the state (a pure function of state and t)
// ---------------------------------------------------------------------------------------------------------------------
const WR = 1.17, WC = 1024, WSC = WC / 2 / WR;
const DRIPS = [[-0.42, -0.12], [0.4, 0.22], [0.04, 0.56]];
const TRAINS = [[0, 4.4, 0.3], [0, 4.4, 2.5], [1, 4.4, 1.2], [1, 4.4, 3.4], [2, 4.4, 0.0]];   // 5 trains: drip point, period, phase
function arcsRing(g, cx, cy, r, seed, lw, col, alpha, gaps = 0.18) {   // a hand-drawn ring: 6 arcs with a few gaps, a wobble
  if (r < 0.004 || alpha < 0.01) return;
  const n = 6; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.globalAlpha = clamp(alpha);
  for (let k = 0; k < n; k++) {
    if (H2(seed, k + 40) < gaps) continue;
    g.beginPath(); const a0 = (k / n) * TAU + (H2(seed, k) - 0.5) * 0.3, a1 = ((k + 1) / n) * TAU - 0.05 + (H2(seed, k + 9) - 0.5) * 0.2;
    for (let s = 0; s <= 6; s++) { const a = lerp(a0, a1, s / 6), rr = r * (1 + 0.018 * (H2(seed, k * 7 + s + 70) - 0.5) * 2); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; s ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
}
function drawWater(g, st, t, S) {
  const { glow, gold, ripple, bulge, rings, swirl, dip, pay, splash, rise } = st, mx = (a, b) => cmix(a, b, gold);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, WC, WC); g.save(); g.beginPath(); g.arc(WC / 2, WC / 2, WC / 2, 0, TAU); g.clip();
  g.setTransform(WSC, 0, 0, WSC, WC / 2, WC / 2);
  const bg = g.createRadialGradient(0, 0, 0, 0, 0, WR);
  bg.addColorStop(0, mx(K.waterD, K.goldDeep)); bg.addColorStop(0.5, mx(cmix(K.waterD, K.water, 0.55), cmix(K.goldDeep, K.goldBase, 0.55))); bg.addColorStop(0.86, mx(K.water, K.goldBase)); bg.addColorStop(1, mx("#46b8d8", "#f0c860"));
  g.fillStyle = bg; g.fillRect(-WR, -WR, 2 * WR, 2 * WR);
  // bright patches: 16 cel blobs drifting on slow orbits
  for (let k = 0; k < 16; k++) {
    const bx = (H2(k, 1) - 0.5) * 1.9, bz = (H2(k, 2) - 0.5) * 1.9, ox = 0.11 * Math.sin(t * (0.1 + 0.08 * H2(k, 3)) + k * 2.1), oz = 0.11 * Math.cos(t * (0.09 + 0.08 * H2(k, 4)) + k * 1.3);
    const cx = bx + ox, cz = bz + oz; if (Math.hypot(cx, cz) > 1.05) continue;
    const rx = 0.1 + 0.16 * H2(k, 5), rz = 0.05 + 0.08 * H2(k, 6), rot = H2(k, 7) * Math.PI;
    g.save(); g.translate(cx, cz); g.rotate(rot);
    smoothP(g, Array.from({ length: 7 }, (_, q) => [Math.cos((q / 7) * TAU) * rx * (0.82 + 0.3 * H2(k, 10 + q)), Math.sin((q / 7) * TAU) * rz * (0.82 + 0.3 * H2(k, 20 + q))])); g.fillStyle = rgba(mx(K.waterL, K.wHot), 0.3 + 0.12 * glow); g.fill();
    smoothP(g, Array.from({ length: 6 }, (_, q) => [Math.cos((q / 6) * TAU) * rx * 0.5 * (0.8 + 0.3 * H2(k, 30 + q)), Math.sin((q / 6) * TAU) * rz * 0.45 * (0.8 + 0.3 * H2(k, 40 + q))])); g.fillStyle = rgba(mx(K.wRipple, K.wHot), 0.3); g.fill();
    g.restore();
  }
  // ambient ripple arcs: 30 short curved lines, drifting; their number of strokes and weight follow `ripple`
  for (let k = 0; k < 30; k++) {
    const cx = (H2(k, 50) - 0.5) * 2 * 1.0 + 0.05 * Math.sin(t * 0.5 + k), cz = (H2(k, 51) - 0.5) * 2 * 1.0 + 0.05 * Math.cos(t * 0.4 + k * 1.3), a = H2(k, 52) * Math.PI, L = 0.05 + 0.09 * H2(k, 53);
    if (Math.hypot(cx, cz) > 1.08 || H2(k, 54) > 0.4 + 2.6 * ripple) continue;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * L, cz - Math.sin(a) * L); g.quadraticCurveTo(cx + Math.sin(a) * L * 0.5, cz - Math.cos(a) * L * 0.5, cx + Math.cos(a) * L, cz + Math.sin(a) * L);
    g.strokeStyle = rgba(mx(K.wRipple, K.wHot), 0.2 + 0.7 * clamp(ripple * 1.4)); g.lineWidth = 0.005 + 0.004 * ripple; g.lineCap = "round"; g.stroke();
  }
  const rip = mx(K.wRipple, K.wHot);
  // 5 trains of ripple lines from 3 drip points, each line drawn
  TRAINS.forEach(([pt, per, ph], k) => {
    const c = Math.floor((t - ph) / per), age = t - ph - c * per, d = DRIPS[pt], ox = d[0] + 0.1 * (H2(c, k + 3) - 0.5), oz = d[1] + 0.1 * (H2(c, k + 8) - 0.5);
    for (let j = 0; j < 4; j++) { const a = age - 0.42 * j, r = 0.045 + 0.15 * a; if (a <= 0 || r > 0.74) continue; arcsRing(g, ox, oz, r, c * 11 + k * 5 + j, 0.0065 - 0.001 * j, rip, (1 - r / 0.74) * 0.95 * (0.55 + 0.45 * clamp(ripple * 3))); }
  });
  // the head's syllable rings, centred: 3 lines each, reaching the rim in 0.8 s
  for (const q of rings) { const R0 = WR * Math.min(q.u, 1), fade = q.u <= 1 ? 1 : 1 - clamp((q.u - 1) / 0.12); for (let j = 0; j < 3; j++) arcsRing(g, 0, 0, R0 - 0.08 * j, q.k * 13 + j, 0.011 - 0.002 * j, rip, (1 - 0.28 * j) * fade, 0.1); }
  // the head rises: one heave ring from where it comes up
  if (rise > 0.001 && rise < 0.999) for (let j = 0; j < 2; j++) arcsRing(g, 0, -0.2, 0.2 + 0.85 * rise - 0.1 * j, 700 + j, 0.01, rip, (1 - rise) * 0.9, 0.12);
  // swirl: 5 spiral arms, drawn lines
  if (Math.abs(swirl) > 0.01) for (let a = 0; a < 5; a++) {
    const pts = []; for (let s = 0; s <= 18; s++) { const u = s / 18, ang = (a / 5) * TAU + swirl * (1.4 + 3.0 * u) + t * 0.15 * Math.sign(swirl); pts.push([Math.cos(ang) * (0.1 + 1.0 * u), Math.sin(ang) * (0.1 + 1.0 * u)]); }
    g.globalAlpha = clamp(Math.abs(swirl) * 0.8); line(g, pts, 0.008, rip); g.globalAlpha = 1;
  }
  // the bulge: contour lines, a bright crescent, a dark foot
  if (bulge > 0.005) {
    for (const l of [0.2, 0.45, 0.72]) arcsRing(g, 0, 0, 0.95 * Math.sqrt(1 - Math.sqrt(l)), 900 + l * 10, 0.007, rip, 0.55 * bulge, 0.12);
    g.beginPath(); g.arc(0, 0, 0.66, 200 * DEG, 290 * DEG); g.strokeStyle = rgba(mx("#ffffff", K.wHot), 0.55 * bulge); g.lineWidth = 0.04; g.lineCap = "round"; g.stroke();
    g.beginPath(); g.arc(0, 0, 0.95, 0, TAU); g.strokeStyle = rgba(mx(K.waterD, K.goldDeep), 0.35 * bulge); g.lineWidth = 0.05; g.stroke();
  }
  // where the cup goes in: a dimple and one train
  if (dip > 0.001 && dip < 0.999 && S.dipAt) {
    const [dx, dz] = S.dipAt, p = dip; if (p < 0.7) { ellP(g, dx, dz, 0.05, 0.03); g.fillStyle = rgba(mx(K.waterD, K.goldDeep), 0.6 * Math.sin((p / 0.7) * Math.PI)); g.fill(); }
    for (let j = 0; j < 3; j++) arcsRing(g, dx, dz, 0.85 * clamp((p - 0.04) / 0.96) - 0.08 * j, 1200 + j, 0.008, rip, (1 - p) * 0.95, 0.1);
  }
  // where the potato eye sinks: a plop ring and a gold bloom r 0.3 just under the surface
  if (pay > 0.001 && pay < 0.999 && S.payAt) {
    const [px, pz] = S.payAt, p = pay, a = sm(p / 0.12) * (1 - sm((p - 0.4) / 0.5));
    for (let j = 0; j < 2; j++) arcsRing(g, px, pz, 0.7 * clamp(p) - 0.09 * j, 1300 + j, 0.009, rip, (1 - p) * 0.95, 0.1);
    const q = g.createRadialGradient(px, pz, 0, px, pz, 0.3); q.addColorStop(0, rgba(K.wHot, 0.95 * a)); q.addColorStop(0.35, rgba(K.gold, 0.75 * a)); q.addColorStop(1, rgba(K.gold, 0)); g.fillStyle = q; g.beginPath(); g.arc(px, pz, 0.3, 0, TAU); g.fill();
  }
  // wet edge: a darker line at the wall, a bright thread inside it
  g.beginPath(); g.arc(0, 0, WR - 0.012, 0, TAU); g.strokeStyle = rgba(mx("#0c4a66", "#7a4e0e"), 0.5); g.lineWidth = 0.05; g.stroke();
  g.beginPath(); g.arc(0, 0, WR - 0.055, 0, TAU); g.strokeStyle = rgba(mx(K.waterL, K.wHot), 0.5); g.lineWidth = 0.006; g.stroke();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (glow < 1) { g.fillStyle = `rgba(6,40,60,${(1 - glow) * 0.45})`; g.fillRect(0, 0, WC, WC); } else if (glow > 1) { g.fillStyle = `rgba(255,255,255,${Math.min(0.4, (glow - 1) * 0.3)})`; g.fillRect(0, 0, WC, WC); }
  g.restore();
}

function facing(geo, dir, cx = 0, cz = 0) {   // dir +1 normals out of (cx, cz), -1 toward it
  const p = geo.attributes.position, n = geo.attributes.normal; let s = 0;
  for (let i = 0; i < p.count; i++) s += n.getX(i) * (p.getX(i) - cx) + n.getZ(i) * (p.getZ(i) - cz);
  if (s * dir < 0) { const ix = geo.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } geo.computeVertexNormals(); }
  return geo;
}
const tongueGeo = (() => {   // a cel tongue of water, unit height, curving outward (+z), cut in three tones
  const g = surf(10, 12, (u, v) => { const a = u * TAU, rho = 0.27 * Math.pow(1 - Math.pow(v, 2.4), 0.6) * (1 - 0.3 * v), cz = 0.22 * v * v; return [Math.cos(a) * rho, v, cz + Math.sin(a) * rho * 0.8]; });
  facing(g, 1, 0, 0.1);
  return colorize(g, (x, y) => (y > 0.86 ? "#e4fafd" : y > 0.5 ? K.waterL : K.water));
})();
const dropGeo = new THREE.IcosahedronGeometry(1, 1), moteGeo = new THREE.IcosahedronGeometry(1, 0);

export const NORSE_WELL_GRIPS = {};
export const NORSE_WELL_STATE = {
  norsewell: { glow: 1, gold: 0, glints: 1, ripple: 0.3, bulge: 0, splash: 0, rings: 0, swirl: 0, dip: 0, pay: 0, rise: 0 },
};

export const NORSE_WELL_KINDS = {
  norsewell(P) {
    const S = P.spec, root = P.whole;
    const M = (geo, mat, parent = root, solid = false, name = "") => { const o = new THREE.Mesh(geo, mat); o.castShadow = false; o.receiveShadow = false; o.userData.solid = solid; if (name) o.name = name; parent.add(o); return o; };
    const grp = (parent = root) => { const g = new THREE.Group(); parent.add(g); return g; };
    const T = new THREE.Object3D(), C = new THREE.Color();
    const counts = { blocks: 16, crossings: 0, slabs: 0, glints: 0, pads: 0, ferns: 0, lichen: 0, moss: 0 };

    // ---------------------------------------------------------------- plinth, band of 16 knot blocks, cap of 14 slabs, inner course
    M(buildPlinth(), stdMat({ vertexColors: true, roughness: 0.92 }), root, true, "plinth");
    M(facing(surf(64, 1, (u, v) => ang3(1.384, u * TAU, 0.058 + 0.2 * v)), 1), stdMat({ color: K.joint, roughness: 1 }), root, false, "band-core");
    for (const { geo, i } of buildBand()) {
      const map = paintBlock(i, "col"), bump = paintBlock(i, "bump"); bump.colorSpace = THREE.NoColorSpace;
      M(geo, stdMat({ map, bumpMap: bump, bumpScale: 3.5, roughness: 0.82 }), root, true, `block${i}`);
      counts.crossings += ROUNDEL.includes(i) ? TREF.crossings : 6;
    }
    for (let i = 0; i < 14; i++) { M(buildSlab(i), stdMat({ map: paintCap(i), roughness: 0.85 }), root, true, `slab${i + 1}`); counts.slabs++; }
    { const g = facing(surf(88, 1, (u, v) => ang3(1.17, u * TAU, 0.218 + 0.044 * v)), -1); M(g, stdMat({ map: paintInner(), roughness: 0.55 }), root, false, "inner-course"); }

    // ---------------------------------------------------------------- moss cushions (cap joints and plinth foot), the chip, ferns in the back joints
    {
      const list = [];
      for (let k = 0; k < 28; k++) { const j = SLAB_AT[Math.floor(H2(k, 5) * 14)][0] * DEG, a = j + (H2(k, 6) - 0.5) * 0.05, back = clamp(1 - Math.abs((((j / DEG) % 360) - 180)) / 120); if (H2(k, 7) > 0.25 + back * 0.9) continue; const r = 1.17 + 0.23 * H2(k, 8); list.push({ p: ang3(r, a, 0.297), s: [0.014 + 0.026 * H2(k, 9), 0.006 + 0.005 * H2(k, 10)], a: H2(k, 11) * TAU }); }
      for (let k = 0; k < 46; k++) { const a = H2(k, 20) * TAU, back = clamp(1 - Math.abs(((a / DEG) % 360) - 180) / 140); if (H2(k, 21) > 0.35 + back * 0.8) continue; list.push({ p: ang3(1.44 + 0.01 * H2(k, 22), a, 0.012), s: [0.03 + 0.045 * H2(k, 23), 0.016 + 0.012 * H2(k, 24)], a: H2(k, 25) * TAU }); }
      for (let k = 0; k < 14; k++) { const a = H2(k, 30) * TAU; list.push({ p: ang3(1.4, a, 0.058), s: [0.02 + 0.03 * H2(k, 31), 0.01], a: H2(k, 32) * TAU }); }   // where the plinth meets the band
      const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), stdMat({ color: "#ffffff", roughness: 0.95 }), list.length);
      list.forEach((m, k) => { T.position.set(...m.p); T.rotation.set(0, m.a, 0); T.scale.set(m.s[0], m.s[1], m.s[0] * 0.8); T.updateMatrix(); im.setMatrixAt(k, T.matrix); C.set(cmix(cmix(K.mossS, K.moss, 0.5 + 0.5 * H2(k, 40)), K.mossL, 0.3 * H2(k, 41))); im.setColorAt(k, C); });
      im.userData.solid = false; root.add(im); counts.moss = list.length;
      // the chipped corner lies on the floor, pale where it broke
      const cg = new THREE.IcosahedronGeometry(1, 1), cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) { const f = 0.75 + 0.5 * H3(cp.getX(i) * 4, cp.getY(i) * 4, cp.getZ(i) * 4); cp.setXYZ(i, cp.getX(i) * f, cp.getY(i) * f, cp.getZ(i) * f); } cg.computeVertexNormals();
      colorize(cg, (x, y, z, nx, ny) => (ny > 0.5 ? "#a9b3b2" : cmix(K.stone, K.stoneL, 0.3 + 0.3 * H3(x * 9, y * 9, z * 9))));
      const ch = M(cg, stdMat({ vertexColors: true, roughness: 0.9, flatShading: true }), root, false, "cap-chip"); ch.position.set(...ang3(1.6, 171 * DEG, 0.032)); ch.scale.set(0.085, 0.034, 0.06); ch.rotation.set(0.1, 0.8, 0.12);
    }
    {   // 9 small ferns in the back joints
      const fr = paintFrond(), mat = noLine(new THREE.MeshBasicMaterial({ map: fr, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false, fog: false }));
      const geo = new THREE.PlaneGeometry(0.4, 1); geo.translate(0, 0.5, 0); const joints = SLAB_AT.map(([a], k) => ({ a, k, d: Math.abs((((a % 360) + 360) % 360) - 180) })).sort((p, q) => p.d - q.d).slice(0, 9);
      const fronds = []; joints.forEach((j, n) => { const nf = 5 + Math.floor(H2(n, 70) * 5) % 5, base = ang3(1.2 + 0.18 * H2(n, 71), j.a * DEG, 0.298); for (let f = 0; f < nf; f++) fronds.push({ base, yaw: (f / nf) * TAU + 0.5 * H2(n, 80 + f), tilt: (30 + 34 * H2(n, 90 + f)) * DEG, len: 0.07 + 0.06 * H2(n, 100 + f), col: [K.fern1, K.fern2, K.fern3][(n + f) % 3] }); });
      const im = new THREE.InstancedMesh(geo, mat, fronds.length); im.userData.solid = false; im.frustumCulled = false;
      fronds.forEach((f, k) => { T.position.set(...f.base); T.rotation.set(0, 0, 0); T.quaternion.setFromEuler(new THREE.Euler(f.tilt, f.yaw, 0, "YXZ")); T.scale.set(f.len, f.len, f.len); T.updateMatrix(); im.setMatrixAt(k, T.matrix); C.set(f.col); im.setColorAt(k, C); });
      root.add(im); counts.ferns = joints.length; counts.fronds = fronds.length;
    }
    counts.lichen = Array.from({ length: 14 }, (_, i) => (i < 6 ? 2 : 1)).reduce((a, b) => a + b, 0);

    // ---------------------------------------------------------------- water: a polar mesh with a redrawn painting
    const wcv = document.createElement("canvas"); wcv.width = wcv.height = WC; const wg = wcv.getContext("2d");
    const wtex = new THREE.CanvasTexture(wcv); wtex.colorSpace = THREE.SRGBColorSpace; wtex.anisotropy = 8;
    const NR = 40, NA = 96, wx = [], wz = [], wpos = new Float32Array((NR + 1) * (NA + 1) * 3), wuv = [], widx = [];
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) { const r = WR * Math.pow(j / NR, 0.9), a = (i / NA) * TAU, x = r * Math.cos(a), z = r * Math.sin(a); wx.push(x); wz.push(z); wuv.push((x / WR + 1) / 2, 1 - (z / WR + 1) / 2); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; widx.push(a, b, c, b, d, c); }
    const wgeo = new THREE.BufferGeometry(); wgeo.setAttribute("position", new THREE.BufferAttribute(wpos, 3)); wgeo.setAttribute("uv", new THREE.Float32BufferAttribute(wuv, 2)); wgeo.setIndex(widx);
    { const tp = [0, 1, 2].map((q) => [wx[widx[q]], wz[widx[q]]]); const nz = (tp[1][0] - tp[0][0]) * (tp[2][1] - tp[0][1]) - (tp[1][1] - tp[0][1]) * (tp[2][0] - tp[0][0]); if (nz > 0) for (let k = 0; k < widx.length; k += 3) { const t = widx[k + 1]; widx[k + 1] = widx[k + 2]; widx[k + 2] = t; } wgeo.setIndex(widx); }
    wgeo.boundingSphere = new THREE.Sphere(new V3(0, 0.3, 0), 2);
    const water = M(wgeo, paintMat(wtex), root, false, "water"); water.frustumCulled = false;

    // the sip stone's lapping tongue: a film in the scoop, to r 1.33
    const lapG = grp(); lapG.rotation.y = -100 * DEG;
    { const g = surf(14, 8, (u, v) => { const hw = 0.15 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, v - 0.7) / 0.3, 2))) + 0.015 * (1 - v); return [(u - 0.5) * 2 * hw, 0, v * 0.215]; }); if (g.attributes.normal.getY(0) < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
      colorize(g, (x, y, z) => cmix("#3ca9cf", "#a8e6f2", clamp(z / 0.215) * 0.6 + 0.2 * H2(Math.round(x * 90), Math.round(z * 90)))); const lap = M(g, softMat({ vertexColors: true, opacity: 0.92 }), lapG, false, "sip-lap"); lap.position.set(0, 0.2368, 1.12); lap.renderOrder = 2; lap.userData.solid = false;
      var lapMesh = lap; }

    // ---------------------------------------------------------------- 100 glints (60 along the rim, 40 scattered), 3 drawn shapes swapped 6 x a second
    const GN = 100, glDef = Array.from({ length: GN }, (_, k) => k < 60 ? { r: 1.02 + 0.1 * H2(k, 1), a: (k / 60) * TAU + (H2(k, 2) - 0.5) * 0.06, s: 0.022 + 0.03 * H2(k, 3), slide: false } : { r: 0.12 + 0.83 * Math.sqrt(H2(k, 4)), a: H2(k, 5) * TAU, s: 0.025 + 0.035 * H2(k, 6), slide: true });
    const glMeshes = [0, 1, 2].map((s) => { const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2); const im = new THREE.InstancedMesh(pg, softMat({ map: glintTex(s), blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), GN); steamy(im, 5); im.frustumCulled = false; root.add(im); return im; });
    counts.glints = GN;

    // ---------------------------------------------------------------- glow, motes, pads, splash crown, drops
    const glowTex = canvasTex(8, 128, (g, w, h) => { const q = g.createLinearGradient(0, h, 0, 0); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.35, "rgba(255,255,255,0.45)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "glow", 1);
    const gcg = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 56, 1, true); gcg.translate(0, 0.5, 0);
    const glowM = steamy(new THREE.Mesh(gcg, softMat({ map: glowTex, color: "#8fdcea", opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 4); glowM.position.y = 0.22; root.add(glowM);
    const motes = new THREE.InstancedMesh(moteGeo, softMat({ color: K.gold, blending: THREE.AdditiveBlending }), 40); steamy(motes, 5); motes.frustumCulled = false; root.add(motes);
    const padTex = paintPad(), padM = noLine(new THREE.MeshBasicMaterial({ map: padTex, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    const padG = new THREE.PlaneGeometry(1, 1); padG.rotateX(-Math.PI / 2);
    const pads = Array.from({ length: 7 }, (_, k) => { const o = M(padG, padM, root, false, `pad${k + 1}`); o.userData.solid = false; return { o, a: (150 + (60 * k) / 6 + 7 * (H2(k, 1) - 0.5)) * DEG, r: 1.0 + 0.07 * H2(k, 2), s: 0.06 + 0.06 * H2(k, 3), yaw: H2(k, 4) * TAU, ph: H2(k, 5) * TAU }; });
    counts.pads = pads.length;
    const crown = Array.from({ length: 22 }, (_, k) => { const o = M(tongueGeo, stdMat({ vertexColors: true, roughness: 0.4 }), root, false, `tongue${k + 1}`); o.visible = false; o.userData.solid = false; o.rotation.order = "YXZ"; return { o, a: (k / 22) * TAU + 0.12 * (H2(k, 1) - 0.5), H: 0.3 + 0.3 * H2(k, 2), d: H2(k, 3), w: 0.75 + 0.5 * H2(k, 4), lean: (16 + 14 * H2(k, 5)) * DEG }; });
    counts.tongues = crown.length;
    const drops = new THREE.InstancedMesh(dropGeo, noLine(new THREE.MeshBasicMaterial({ color: "#8fdcee", toneMapped: false })), 60); drops.userData.solid = false; drops.frustumCulled = false; root.add(drops);
    const dropDef = Array.from({ length: 60 }, (_, k) => ({ a: H2(k, 1) * TAU, t0: 0.05 + 0.3 * H2(k, 2), apex: 0.25 + 0.4 * H2(k, 3), sp: 0.04 + 0.2 * H2(k, 4), s: 0.007 + 0.007 * H2(k, 5), y0: 0.2 + 0.3 * H2(k, 6) }));
    const wallDrops = new THREE.InstancedMesh(dropGeo, noLine(new THREE.MeshBasicMaterial({ color: "#d4f4fa", toneMapped: false })), 18); wallDrops.userData.solid = false; wallDrops.frustumCulled = false; root.add(wallDrops);
    const lapRing = M(new THREE.RingGeometry(1.146, 1.2, 72), softMat({ color: "#5fc0dc", opacity: 0.9 }), root, false, "cap-lap"); lapRing.rotation.x = -Math.PI / 2; lapRing.position.y = 0.3022; lapRing.visible = false; lapRing.renderOrder = 3;

    // real lights only when asked (spec light: 1): the cave's light plan owns the rest
    const lights = [];
    if (S.light) { const a = new THREE.PointLight("#8fdcea", 0, 7, 2); a.position.set(0, 0.45, 0); const b = new THREE.PointLight("#ffd45a", 0, 3.5, 2); b.position.set(0.4, 0.3, 0.6); root.add(a, b); lights.push([a, 10], [b, 4]); }
    root.userData.counts = counts;

    return {
      grip: 0, counts,
      apply(ps, t) {
        t = t ?? 0;
        const g0 = (k, d) => ps[k] ?? S[k] ?? d, glow = g0("glow", 1), gold = clamp(g0("gold", 0)), glK = clamp(g0("glints", 1)), ripple = Math.max(0, g0("ripple", 0.3));
        const splash = clamp(g0("splash", 0)), bulge = clamp(g0("bulge", 0)) * (1 - sm(splash * 8)), rc = g0("rings", 0), swirl = clamp(g0("swirl", 0), -1, 1), dip = clamp(g0("dip", 0)), pay = clamp(g0("pay", 0)), rise = clamp(g0("rise", 0));
        const rings = [];
        if (Array.isArray(S.ringAt)) S.ringAt.forEach((a, k) => { const u = (t - a) / 0.8; if (u > 0 && u < 1.6) rings.push({ k: k + 1, u, drop: (u - 1) / 0.55 }); });
        else for (let k = Math.max(1, Math.floor(rc)); k <= Math.floor(rc) + 1; k++) { const u = rc - (k - 1); if (u > 0.001 && u < 0.999) rings.push({ k, u, drop: (u - 0.85) / 0.15 }); }
        const st = { glow, gold, ripple, bulge, rings, swirl, dip, pay, splash, rise };
        const amp = 0.0045 * ripple / 0.3, chop = 0.014 * sm(splash * 10) * (1 - sm((splash - 0.5) / 0.5));
        const dipP = S.dipAt, payP = S.payAt;
        const hAt = (x, z) => {
          const r = Math.hypot(x, z), edge = sm((WR - r) / 0.12);
          let h = amp * (0.5 * Math.sin(3.1 * x + 2.3 * z + t * 1.2) + 0.35 * Math.sin(-2.2 * x + 4.1 * z - t * 0.9) + 0.25 * Math.sin(5.3 * x + 1.7 * z + t * 1.7)) * edge;
          if (bulge > 0.002) { const q = Math.max(0, 1 - (r / 0.95) ** 2); h += 0.28 * bulge * q * q; }
          for (const q of rings) { const d = r - WR * Math.min(q.u, 1), f = q.u <= 1 ? 1 : 1 - clamp((q.u - 1) / 0.12); h += (0.013 * Math.exp(-((d / 0.06) ** 2)) + 0.006 * Math.exp(-(((d + 0.075) / 0.05) ** 2))) * f * edge; }
          if (chop > 0) h += chop * Math.sin(r * 24 - splash * 40) * Math.exp(-r * 0.8) * edge;
          if (rise > 0.001 && rise < 0.999) { const d = Math.hypot(x, z + 0.2) - (0.2 + 0.85 * rise); h += 0.02 * (1 - rise) * Math.exp(-((d / 0.07) ** 2)) * edge; }
          if (dipP && dip > 0.001 && dip < 0.999) { const d = Math.hypot(x - dipP[0], z - dipP[1]), p = dip; if (p < 0.7) h -= 0.02 * Math.sin((p / 0.7) * Math.PI) * Math.exp(-((d / 0.06) ** 2)); h += 0.007 * Math.exp(-(((d - 0.85 * p) / 0.05) ** 2)) * (1 - p) * edge; }
          if (payP && pay > 0.001 && pay < 0.999) { const d = Math.hypot(x - payP[0], z - payP[1]); h += 0.008 * Math.exp(-(((d - 0.7 * pay) / 0.05) ** 2)) * (1 - pay) * edge - 0.012 * Math.exp(-((d / 0.05) ** 2)) * (1 - sm(pay * 5)); }
          return h;
        };
        // the painting and the surface
        drawWater(wg, st, t, S); wtex.needsUpdate = true;
        for (let k = 0; k < wx.length; k++) { wpos[k * 3] = wx[k]; wpos[k * 3 + 1] = 0.22 + hAt(wx[k], wz[k]); wpos[k * 3 + 2] = wz[k]; }
        wgeo.attributes.position.needsUpdate = true;
        lapMesh.scale.z = 1 + 0.07 * Math.sin(t * 1.3) * (0.4 + ripple * 2) + 0.02 * Math.sin(t * 3.1); lapMesh.position.y = 0.2368 + 0.0007 * Math.sin(t * 2.2);
        // glow, halo
        const gcol = cmix("#8fdcea", K.gold, gold); glowM.material.color.set(gcol); glowM.material.opacity = 0.12 * glow; glowM.visible = glow > 0.01;
        lights.forEach(([l, base], i) => { l.intensity = base * glow * (1 + 0.06 * Math.sin(t * (6 + 2 * i))); l.color.set(i ? K.gold : cmix("#8fdcea", K.gold, gold)); });
        // glints: 100, three shapes, 6 swaps a second; the scattered ones slide off a bulge
        const fr = Math.floor(t * 6 + 1e-6), vis = sm(glK * 3);
        for (let s = 0; s < 3; s++) glMeshes[s].count = GN;
        glDef.forEach((d, k) => {
          let r = d.r; if (d.slide && bulge > 0.002 && r < 0.95) r = lerp(r, 1.0 + 0.1 * H2(k, 8), sm(bulge * 2.4));
          const x = r * Math.cos(d.a), z = r * Math.sin(d.a), on = vis > 0.01 && H2(k + fr * 0.37, 9) > 0.16, shape = (fr + k) % 3;
          for (let s = 0; s < 3; s++) { const sc = on && s === shape ? d.s * vis * (0.85 + 0.3 * H2(fr, k)) : 0.00001; T.position.set(x, 0.22 + hAt(x, z) + 0.006, z); T.rotation.set(0, H2(k, 12) * TAU, 0); T.scale.set(sc, sc, sc); T.updateMatrix(); glMeshes[s].setMatrixAt(k, T.matrix); }
        });
        for (const im of glMeshes) im.instanceMatrix.needsUpdate = true;
        // 40 gold motes rise 0.5 and shrink away
        for (let k = 0; k < 40; k++) { const ph = fract(t * (0.12 + 0.1 * H2(k, 1)) + H2(k, 2)), r = 0.95 * Math.sqrt(H2(k, 3)), a = H2(k, 4) * TAU + 0.4 * Math.sin(t * 0.5 + k), s = 0.01 * (1 - ph) ** 0.8 * (0.6 + 0.4 * H2(k, 5)) * smv(glow); T.position.set(r * Math.cos(a), 0.24 + 0.5 * ph, r * Math.sin(a)); T.rotation.set(0, 0, 0); T.scale.setScalar(Math.max(s, 0.00001)); T.updateMatrix(); motes.setMatrixAt(k, T.matrix); }
        motes.instanceMatrix.needsUpdate = true;
        // pads drift, are carried round by the swirl, and are pushed to the rim when the head rises
        for (const p of pads) {
          const push = sm(rise * 1.8), a = p.a + swirl * 0.9 * (1.25 - p.r) + 0.12 * push * (H2(p.ph, 1) - 0.5) * 2, r = lerp(p.r, 1.095 - p.s * 0.2, push);
          const x = r * Math.sin(a) + 0.02 * Math.sin(t * 0.21 + p.ph) * (1 - push), z = r * Math.cos(a) + 0.02 * Math.cos(t * 0.17 + p.ph * 1.7) * (1 - push);
          p.o.position.set(x, 0.22 + hAt(x, z) + 0.003, z); p.o.rotation.y = p.yaw + swirl * 1.4 + 0.3 * Math.sin(t * 0.3 + p.ph); p.o.scale.set(p.s * 2, 1, p.s * 2);
        }
        // the splash: 22 tongues, 60 drops, the lap over the cap
        const sp = splash;
        for (const c of crown) {
          const q = (sp - 0.03 * c.d) / 0.9, f = q <= 0 ? 0 : q < 0.25 ? 1 - Math.pow(1 - q / 0.25, 3) : q < 0.55 ? 1 - 0.1 * ((q - 0.25) / 0.3) : q < 1 ? 0.9 * (1 - sm((q - 0.55) / 0.45)) : 0;
          c.o.visible = f > 0.01; if (!c.o.visible) continue;
          const x = 0.9 * Math.sin(c.a), z = 0.9 * Math.cos(c.a);
          c.o.position.set(x, 0.22 + hAt(x, z) - 0.01, z); c.o.rotation.set(c.lean + 0.25 * q, c.a, 0); c.o.scale.set(c.H * c.w * (1.1 - 0.35 * f), c.H * f, c.H * c.w * (1.1 - 0.35 * f));
        }
        for (let k = 0; k < 60; k++) {
          const d = dropDef[k], tau = (sp - d.t0) / (0.88 - d.t0), vis2 = tau > 0 && tau < 1, r = 0.9 + d.sp * 2 * tau * (k % 2 ? 1 : -0.8), y = lerp(0.22 + d.y0 * 0.6, 0.22, tau) + d.apex * 4 * tau * (1 - tau) * 0.55;
          T.position.set(r * Math.sin(d.a), y, r * Math.cos(d.a)); T.rotation.set(0, 0, 0); T.scale.set(vis2 ? d.s : 0.00001, vis2 ? d.s * 1.3 : 0.00001, vis2 ? d.s : 0.00001); T.updateMatrix(); drops.setMatrixAt(k, T.matrix);
        }
        drops.instanceMatrix.needsUpdate = true;
        lapRing.visible = sp > 0.15 && sp < 0.8; if (lapRing.visible) { const w = Math.sin(((sp - 0.15) / 0.65) * Math.PI); lapRing.scale.set(1 + 0.04 * w, 1 + 0.04 * w, 1); lapRing.material.opacity = 0.92 * clamp(w * 2.5); }
        // 6 small drops at the wall for each ring that arrives
        let wd = 0; for (const q of rings) for (let j = 0; j < 6; j++) { const v = clamp(q.drop), on = q.drop > 0 && q.drop < 1, a = H2(q.k * 7 + j, 3) * TAU, s = on ? 0.009 + 0.004 * H2(q.k, j) : 0.00001; if (wd >= 18) break; T.position.set((1.12 - 0.03 * v) * Math.sin(a), 0.22 + 0.075 * 4 * v * (1 - v), (1.12 - 0.03 * v) * Math.cos(a)); T.rotation.set(0, 0, 0); T.scale.setScalar(s); T.updateMatrix(); wallDrops.setMatrixAt(wd++, T.matrix); }
        for (; wd < 18; wd++) { T.position.set(0, 0, 0); T.scale.setScalar(0.00001); T.updateMatrix(); wallDrops.setMatrixAt(wd, T.matrix); }
        wallDrops.instanceMatrix.needsUpdate = true;
      },
    };
  },
  norsefloor(P) { return buildFloor(P); },
};
const smv = (x) => sm(x * 2);

// ---------------------------------------------------------------------------------------------------------------------
// THE WELL FLOOR (kind `norsefloor`): its own small set. Unlit painted materials with their own water light: the height
// tint (#0f4f6a near the floor, #1f86a8 mid, #7fdcec under the surface), a fade into the water by 3.5 m, the moving net of
// light lines (0.25 apart, 0.12 m/s) on everything it falls on, and a fake sky light from above.
// ---------------------------------------------------------------------------------------------------------------------
const UW = { t: { value: 0 } };
const UW_GLSL_F = /* glsl */`
uniform float uUwT; uniform float uUwNet; uniform float uUwSpec; uniform float uUwLit; uniform float uUwGlow; uniform float uUwFog; uniform float uUwSpeck; uniform vec3 uUwCore; uniform vec3 uUwRim;
varying vec3 vUwP; varying vec3 vUwN; varying float vUwD;
vec2 uwH2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float uwCaus(vec2 uv, float t) {   // a net of cell edges, 0.25 m cells, drifting 0.12 m/s, the cell points breathing
  vec2 p = uv * 4.0 + t * vec2(0.29, 0.38), ip = floor(p), fp = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 h = uwH2(ip + g); vec2 o = 0.5 + 0.42 * sin(t * 0.9 + 6.2831 * h); float d = length(g + o - fp); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  return 1.0 - smoothstep(0.0, 0.1, d2 - d1);
}
vec3 uwWater(float y) { vec3 d = vec3(0.0588, 0.3098, 0.4157), m = vec3(0.1216, 0.5255, 0.6588), b = vec3(0.4980, 0.8627, 0.9255); return y < 1.2 ? mix(d, m, clamp(y / 1.2, 0.0, 1.0)) : mix(m, b, clamp((y - 1.2) / 1.2, 0.0, 1.0)); }`;
const UW_GLSL_MAIN = /* glsl */`
{
  vec3 N = normalize(vUwN); vec3 V = normalize(cameraPosition - vUwP); vec3 c = gl_FragColor.rgb;
  if (uUwGlow > 0.5) {
    float fr = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 1.5);
    c = mix(uUwCore, uUwRim, fr) * (0.94 + 0.06 * sin(uUwT * 2.3 + vUwP.x * 31.0 + vUwP.z * 17.0));
  } else {
    float lit = mix(1.0, 0.36 + 0.64 * clamp(N.y * 0.6 + 0.55, 0.0, 1.0), uUwLit);
    c *= lit * mix(0.62, 1.0, clamp(vUwP.y / 2.2, 0.0, 1.0));
    c *= 1.0 - 0.22 * pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.0);
    c = mix(c, uwWater(vUwP.y), 0.16 * min(1.0, uUwFog * 3.0));
    if (uUwNet > 0.0) {
      vec2 uv = abs(N.y) > 0.5 ? vUwP.xz : vec2(vUwP.x + vUwP.z, vUwP.y * 1.1);
      float nt = uwCaus(uv, uUwT);
      c = mix(c, vec3(0.875, 0.973, 0.984), nt * uUwNet * (0.4 + 0.6 * clamp(N.y * 0.5 + 0.6, 0.0, 1.0)));
    }
    if (uUwSpec > 0.0) { vec3 L = normalize(vec3(0.2, 1.0, 0.3)); vec3 Hh = normalize(L + V); c += vec3(1.0) * pow(max(dot(N, Hh), 0.0), 140.0) * uUwSpec; }
  }
  float f = smoothstep(0.8, 3.5, vUwD) * 0.8 * uUwFog; c = mix(c, uwWater(vUwP.y), f);
  gl_FragColor.rgb = c;
}`;
function uwMat(base, o = {}) {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false, fog: false, ...base }); noLine(m);
  const U = { uUwNet: { value: o.net ?? 0 }, uUwSpec: { value: o.spec ?? 0 }, uUwLit: { value: o.lit ?? 1 }, uUwGlow: { value: o.glow ? 1 : 0 }, uUwFog: { value: o.fog ?? 1 }, uUwSpeck: { value: o.speck ?? 0 }, uUwCore: { value: new THREE.Vector3(...(o.core ? hexA(o.core).map((v) => v / 255) : [1, 1, 1])) }, uUwRim: { value: new THREE.Vector3(...(o.rim ? hexA(o.rim).map((v) => v / 255) : [1, 1, 1])) } };
  m.userData.uw = U;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uUwT = UW.t; Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 vUwP; varying vec3 vUwN; varying float vUwD;\nvoid main() {")
      .replace("#include <project_vertex>", `#include <project_vertex>
  vec4 uwp = vec4(transformed, 1.0); vec3 uwn = normal;
  #ifdef USE_INSTANCING
    uwp = instanceMatrix * uwp; uwn = mat3(instanceMatrix) * uwn;
  #endif
  uwp = modelMatrix * uwp; vUwP = uwp.xyz; vUwN = mat3(modelMatrix) * uwn; vUwD = length(mvPosition.xyz);`);
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", `${UW_GLSL_F}\nvoid main() {`).replace("#include <dithering_fragment>", `${UW_GLSL_MAIN}\n#include <dithering_fragment>`);
  };
  m.customProgramCacheKey = () => "norse-uw-1";
  return m;
}
// the shaft wall: 12 courses of dry stone, 13-15 stones a course, each stone with its own bulge
const W_L = TAU * 1.15, COURSE_H = 0.2;
const COURSES = Array.from({ length: 12 }, (_, c) => {
  const n = 13 + (c % 3), ws = Array.from({ length: n }, (_, k) => 0.65 + 0.7 * H2(c, k + 50)), sum = ws.reduce((a, b) => a + b, 0); let x = 0;
  const cum = [0]; ws.forEach((w) => { x += (w / sum) * W_L; cum.push(x); });
  return { cum, off: W_L * H2(c, 99), n, pr: Array.from({ length: n }, (_, k) => 0.5 + 0.5 * H3(c, k, 5)) };
});
function stoneAt(c, s) {
  const C = COURSES[c], q = (((s - C.off) % W_L) + W_L) % W_L; let k = 0; while (k < C.n - 1 && C.cum[k + 1] <= q) k++;
  return { k, a: q - C.cum[k], b: C.cum[k + 1] - q, pr: C.pr[k] };
}
const wallBump = (s, y) => { const c = Math.min(11, Math.max(0, Math.floor(y / COURSE_H))), st = stoneAt(c, s), yy = y - c * COURSE_H, e = Math.min(st.a, st.b, yy, COURSE_H - yy); return 0.05 * st.pr * sm(e / 0.045) * (0.8 + 0.2 * vn(s * 5, y * 5, c, 1, 3)); };
function paintWall() {
  const w = 2048, h = 1280, sx = w / W_L, sy = h / 2.4;
  return canvasTex(w, h, (g) => {
    g.setTransform(sx, 0, 0, -sy, 0, h); g.fillStyle = "#0a2a36"; g.fillRect(0, 0, W_L, 2.4);
    const pal = ["#557c8c", "#3a817f", "#3a4c5d", "#628090"];
    for (let c = 0; c < 12; c++) {
      const C = COURSES[c];
      for (let k = 0; k < C.n; k++) {
        const x0 = C.cum[k] + 0.013, x1 = C.cum[k + 1] - 0.013, y0 = c * COURSE_H + 0.012, y1 = (c + 1) * COURSE_H - 0.012, col = H3(c, k, 9) < 0.11 ? "#8a7442" : pal[Math.floor(H3(c, k, 8) * 4)], sh = 0.78 + 0.3 * H3(c, k, 7);
        for (const dx of [C.off, C.off - W_L]) {
          g.save(); g.translate(dx, 0);
          const wob = (i) => 0.01 * (H3(c, k, 20 + i) - 0.5);
          smoothP(g, [[x0 + wob(0), y0 + wob(1)], [(x0 + x1) / 2, y0 + wob(2)], [x1 + wob(3), y0 + wob(4)], [x1 + wob(5), (y0 + y1) / 2], [x1 + wob(6), y1 + wob(7)], [(x0 + x1) / 2, y1 + wob(8)], [x0 + wob(9), y1 + wob(10)], [x0 + wob(11), (y0 + y1) / 2]]);
          g.fillStyle = cmul(col, sh); g.fill();
          g.save(); g.clip(); const q = g.createLinearGradient(0, y1, 0, y0); q.addColorStop(0, "rgba(255,255,255,0.18)"); q.addColorStop(0.3, "rgba(255,255,255,0)"); q.addColorStop(1, "rgba(0,20,30,0.35)"); g.fillStyle = q; g.fillRect(x0, y0, x1 - x0, y1 - y0);
          for (let i = 0; i < 16; i++) dot(g, x0 + (x1 - x0) * H3(c, k, 40 + i), y0 + (y1 - y0) * H3(c, k, 60 + i), 0.003 + 0.004 * H3(c, k, 80 + i), i % 2 ? "rgba(10,40,52,0.5)" : "rgba(210,240,245,0.22)");
          g.restore(); g.restore();
        }
      }
    }
    for (let k = 0; k < 34; k++) { const x = H2(k, 301) * W_L, y0 = 0.25 + 2.0 * H2(k, 302), L = 0.12 + 0.35 * H2(k, 303); for (const dx of [0]) { const pts = [[x, y0], [x + 0.015 * (H2(k, 304) - 0.5), y0 - L * 0.5], [x + 0.03 * (H2(k, 305) - 0.5), y0 - L]]; line(g, pts, 0.011, "#1f5a4c"); line(g, pts, 0.0065, k % 3 ? "#3f8f7a" : "#5fb59a"); } }   // weed in the joints
    for (let k = 0; k < 90; k++) { const x = H2(k, 310) * W_L, y = H2(k, 311) * 2.4; line(g, [[x, y], [x + 0.02 + 0.03 * H2(k, 312), y + 0.004]], 0.004, "rgba(223,248,251,0.7)"); }
  }, "floorwall", 8);
}
function paintIris() {
  return canvasTex(256, 256, (g, w, h) => {
    g.setTransform(w / 2, 0, 0, -h / 2, w / 2, h / 2);   // the iris is the unit disc
    dot(g, 0, 0, 1, "#4a5563"); const q = g.createRadialGradient(0, 0, 0.3, 0, 0, 0.93); q.addColorStop(0, "#6c7a8a"); q.addColorStop(0.6, "#7d8a99"); q.addColorStop(1, "#8a97a6"); g.beginPath(); g.arc(0, 0, 0.93, 0, TAU); g.fillStyle = q; g.fill();
    for (let k = 0; k < 64; k++) { const a = (k / 64) * TAU + 0.05 * H2(k, 1); line(g, [[Math.cos(a) * 0.38, Math.sin(a) * 0.38], [Math.cos(a + 0.03) * (0.78 + 0.14 * H2(k, 2)), Math.sin(a + 0.03) * (0.78 + 0.14 * H2(k, 2))]], 0.016, k % 3 ? "rgba(168,182,196,0.5)" : "rgba(60,74,90,0.4)"); }
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU + 0.2 * H2(k, 3), r = 0.5 + 0.3 * H2(k, 4); ellP(g, Math.cos(a) * r, Math.sin(a) * r, 0.05 + 0.04 * H2(k, 5), 0.02, a); g.fillStyle = k % 2 ? "#a9b5c1" : "#5a6677"; g.fill(); }   // 14 flecks
    g.beginPath(); g.arc(0, 0, 0.93, 0, TAU); g.strokeStyle = "#4a5563"; g.lineWidth = 0.1; g.stroke(); g.beginPath(); g.arc(0, 0, 0.36, 0, TAU); g.fillStyle = "#14181d"; g.fill();
  }, "iris", 4);
}
function paintLid() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#6f777a"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 26; k++) { const y = (k / 26) * h + 2 * H2(k, 1); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + 3 * Math.sin(x * 0.05 + k) + 2 * (H2(k, x) - 0.5)); g.strokeStyle = k % 2 ? "rgba(46,58,62,0.28)" : "rgba(170,186,186,0.2)"; g.lineWidth = 1.2; g.stroke(); }   // grain along the lid
    for (let k = 0; k < 40; k++) dot(g, H2(k, 3) * w, H2(k, 4) * h, 1 + 2 * H2(k, 5), "rgba(34,46,50,0.5)");
    for (let k = 0; k < 6; k++) dot(g, H2(k, 8) * w, H2(k, 9) * h, 3 + 4 * H2(k, 6), "rgba(63,143,122,0.55)");
  }, "lid", 4);
}
const bandTex = () => { const t = canvasTex(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); for (const [x, wd, a] of [[0.35, 0.05, 0.85], [0.52, 0.025, 0.6], [0.66, 0.012, 0.5]]) { const q = g.createLinearGradient((x - wd) * w, 0, (x + wd) * w, 0); q.addColorStop(0, "rgba(223,248,251,0)"); q.addColorStop(0.5, `rgba(223,248,251,${a})`); q.addColorStop(1, "rgba(223,248,251,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); } }, "band", 1); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

function lidGeo(upper) {   // a stone slab bent over the orb: a shell sector with a rolled edge
  const psiM = (upper ? 100 : 78) * DEG, thF = upper ? 1.95 : 1.95, sg = upper ? -1 : 1, e0 = upper ? 0.34 : 1.2, e1 = upper ? 0.74 : 0.3;
  const edge = (psi) => e0 + e1 * Math.sin(psi) ** 2;
  const P = (u, v, ro) => { const psi = (u - 0.5) * 2 * psiM, th = lerp(edge(psi), thF, v), r = ro; return [r * Math.sin(th) * Math.sin(psi), r * Math.cos(th), sg * r * Math.sin(th) * Math.cos(psi)]; };
  const th = (v) => 0.0605 + 0.0095 * Math.pow(1 - v, 3) + 0.006 * (1 - v) + 0.0016 * Math.sin(v * 9);
  const outer = surf(30, 12, (u, v) => P(u, v, th(v) + 0.004 * vn(u * 6, v * 5, upper ? 1 : 2, 1, 7)), (u, v) => [u * 3, v]);
  const inner = surf(30, 12, (u, v) => P(u, v, 0.0605), (u, v) => [u, v]);
  facing(outer, 1); facing(inner, -1);
  const edgeG = surf(30, 2, (u, v) => P(u, 0, 0.0605 + v * (th(0) - 0.0605)), (u, v) => [u * 3, 0.02]); facing(edgeG, 0, 0, 0); if (sg < 0 ? false : false) { }
  return [outer, inner, edgeG];
}

NORSE_WELL_STATE.norsefloor = { blink: 0, lookX: 0, lookY: 0, plunge: 0, headShadow: 1, peek: 0 };
const EYE = [0.25, 0.09, 0.15];
const pileH = (r) => 0.14 * sm((r - 0.35) / 0.7);
function genPebbles() {   // 260: 9 nest, 38 gold, 20 cyan, 193 plain
  const out = [];
  for (let i = 0; i < 260; i++) {
    let kind = "plain", x, z, s, y;
    if (i < 9) {
      if (i < 3) { const a = 1.1 + i * 2.1; x = EYE[0] + Math.cos(a) * 0.045; z = EYE[2] + Math.sin(a) * 0.045; s = 0.05; y = 0.016; }
      else { const a = ((i - 3) / 6) * TAU + 0.3, d = 0.108 + 0.03 * H2(i, 1); x = EYE[0] + Math.cos(a) * d; z = EYE[2] + Math.sin(a) * d; s = 0.032 + 0.02 * H2(i, 2); y = s * 0.55; }
    } else if (i < 67) {
      kind = i < 47 ? "gold" : "cyan"; const a = H2(i, 1) * TAU, d = 0.22 + 0.72 * Math.pow(H2(i, 2), 0.9); x = EYE[0] + Math.cos(a) * d; z = EYE[2] + Math.sin(a) * d;
      const r = Math.hypot(x, z); if (r > 1.02) { x *= 1.02 / r; z *= 1.02 / r; }
      s = 0.04 + 0.06 * H2(i, 3); y = pileH(Math.hypot(x, z)) * H2(i, 4) + s * 0.4;
    } else {
      for (let tryN = 0; tryN < 6; tryN++) { const a = H2(i, 10 + tryN) * TAU, r = 1.1 * Math.pow(H2(i, 20 + tryN), 0.55); x = r * Math.cos(a); z = r * Math.sin(a); s = 0.03 + 0.11 * Math.pow(H2(i, 30 + tryN), 1.6); if (Math.hypot(x - EYE[0], z - EYE[2]) > 0.17 + s * 0.6) break; }
      y = pileH(Math.hypot(x, z)) * H2(i, 4) + s * 0.4;
    }
    const col = kind !== "plain" ? kind : H2(i, 6) < 1 / 9 ? "#b58a46" : ["#5f7f8f", "#3f8f8a", "#3a4a5a"][Math.floor(H2(i, 7) * 3)];
    out.push({ kind, x, z, y, s, col: kind === "plain" ? cmul(col, 0.88 + 0.24 * H2(i, 8)) : col, sx: s * (0.9 + 0.4 * H2(i, 9)), sy: s * (0.5 + 0.3 * H2(i, 11)), sz: s * (0.9 + 0.4 * H2(i, 12)), rot: H2(i, 13) * TAU, tx: (H2(i, 14) - 0.5) * 0.4, tz: (H2(i, 15) - 0.5) * 0.4 });
  }
  return out;
}
const pebbleGeo = (() => {
  const g0 = new THREE.IcosahedronGeometry(1, 3); g0.deleteAttribute("normal"); g0.deleteAttribute("uv"); const g = mergeVertices(g0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const f = 0.86 + 0.28 * vn(p.getX(i), p.getY(i), p.getZ(i), 1.7, 5); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); }
  g.computeVertexNormals(); return g;
})();
const flatPlane = (w, h) => { const g = new THREE.PlaneGeometry(w, h); return g; };

function buildFloor(P) {
  const S = P.spec, root = P.whole, T = new THREE.Object3D(), C = new THREE.Color();
  const M = (geo, mat, parent = root, solid = false, name = "") => { const o = new THREE.Mesh(geo, mat); o.castShadow = false; o.receiveShadow = false; o.userData.solid = solid; if (name) o.name = name; parent.add(o); return o; };
  const grp = (parent = root) => { const g = new THREE.Group(); parent.add(g); return g; };
  const counts = { pebbles: 0, gold: 0, cyan: 0, weeds: 0, rays: 0, courses: 12, beard: 14, lidBlades: 7, bubbles: 5, motes: 70 };

  // ---- floor, shaft (12 courses of dry stone), rim and ledge
  { const g = new THREE.CircleGeometry(1.2, 56); g.rotateX(-Math.PI / 2); M(g, uwMat({ color: "#12404f" }, { net: 0.6 }), root, false, "floor"); }
  { const g = facing(surf(220, 120, (u, v) => ang3(1.15 - wallBump(u * W_L, v * 2.4), u * TAU, v * 2.4)), -1); M(g, uwMat({ map: paintWall() }, { net: 0.5 }), root, false, "shaft"); }
  const flag = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#1c2629"; g.fillRect(0, 0, w, h); const n = 9;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = (i + 0.06 * (H2(i, j) - 0.5)) * (w / n), y0 = (j + 0.06 * (H2(j, i + 9) - 0.5)) * (h / n), c = cmul("#43565a", 0.8 + 0.4 * H2(i, j + 30)); g.fillStyle = c; g.beginPath(); g.moveTo(x0 + 6, y0 + 6); g.lineTo(x0 + w / n - 6 + 10 * (H2(i, j + 1) - 0.5), y0 + 6 + 8 * (H2(i, j + 2) - 0.5)); g.lineTo(x0 + w / n - 6, y0 + h / n - 6 + 10 * (H2(i, j + 3) - 0.5)); g.lineTo(x0 + 6 + 8 * (H2(i, j + 4) - 0.5), y0 + h / n - 6); g.closePath(); g.fill(); for (let k = 0; k < 10; k++) dot(g, x0 + (w / n) * H2(i * 7 + k, j), y0 + (h / n) * H2(j * 5 + k, i), 2 + 3 * H2(k, i + j), "rgba(20,30,34,0.35)"); }
  }, "flag", 4);
  const dark = (extra = {}) => uwMat({ map: flag }, { fog: 0, lit: 1, ...extra });
  { const g = facing(surf(96, 1, (u, v) => ang3(1.15, u * TAU, 2.4 + 0.08 * v)), -1); M(g, dark(), root, true, "rim-inner"); }
  { const g = new THREE.RingGeometry(1.15, 1.42, 72, 1); g.rotateX(-Math.PI / 2); const m = M(g, dark(), root, true, "rim-top"); m.position.y = 2.48; }
  { const g = facing(surf(96, 1, (u, v) => ang3(1.42, u * TAU, 2.18 + 0.3 * v)), 1); M(g, dark(), root, true, "rim-outer"); }
  { const g = new THREE.RingGeometry(1.42, 2.6, 72, 1); g.rotateX(-Math.PI / 2); const m = M(g, dark(), root, true, "ledge"); m.position.y = 2.18; }

  // ---- 260 pebbles: 202 plain (9 of them the nest), 38 gold and 20 cyan that glow from inside, each with a halo
  const peb = genPebbles(), by = { plain: [], gold: [], cyan: [] }; peb.forEach((p) => by[p.kind].push(p));
  const mats = { plain: uwMat({ color: "#ffffff" }, { net: 0.55 }), gold: uwMat({ color: "#ffffff" }, { glow: true, core: "#ffd45a", rim: "#ff9f2a" }), cyan: uwMat({ color: "#ffffff" }, { glow: true, core: "#9fe6f0", rim: "#5cc3d4" }) };
  const halo = radialTex([[0, "rgba(255,255,255,0.9)"], [0.45, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]], 64);
  for (const kd of ["plain", "gold", "cyan"]) {
    const im = new THREE.InstancedMesh(pebbleGeo, mats[kd], by[kd].length); im.userData.solid = false; im.name = `pebbles-${kd}`;
    by[kd].forEach((p, k) => { T.position.set(p.x, p.y, p.z); T.rotation.set(p.tx, p.rot, p.tz); T.scale.set(p.sx, p.sy, p.sz); T.updateMatrix(); im.setMatrixAt(k, T.matrix); C.set(p.col.startsWith("#") ? p.col : "#ffffff"); im.setColorAt(k, C);
      if (kd !== "plain") { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: kd === "gold" ? "#ff9f2a" : "#7fdcec", transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })); sp.position.set(p.x, p.y + p.sy * 0.2, p.z); const d = 2 * (Math.max(p.sx, p.sz) + 0.05); sp.scale.set(d, d, 1); sp.userData.steam = true; sp.userData.solid = false; sp.renderOrder = 6; root.add(sp); } });
    root.add(im); counts.pebbles += by[kd].length; if (kd !== "plain") counts[kd] = by[kd].length;
  }

  // ---- ODIN'S EYE: an ivory orb, his own iris, one catch-light, a moving light line; two stone lids with 7 weed lashes
  const eyeG = grp(); eyeG.position.set(...EYE); const ball = grp(eyeG);
  { const g = new THREE.SphereGeometry(0.055, 44, 30); colorize(g, (x, y, z, nx, ny) => cmix("#cfc9b8", "#f3efe2", clamp(ny * 1.2 + 0.35))); M(g, uwMat({ vertexColors: true }, { lit: 0.35, spec: 0.22, net: 0.2 }), ball, false, "sclera"); }
  const capUV = (g, rad) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) / rad) * 0.5 + 0.5, (p.getZ(i) / rad) * 0.5 + 0.5); uv.needsUpdate = true; return g; };
  { const th = 0.5, g = capUV(new THREE.SphereGeometry(0.0556, 40, 12, 0, TAU, 0, th), 0.0556 * Math.sin(th)); M(g, uwMat({ map: paintIris() }, { lit: 0.3, spec: 0.35, net: 0.2 }), ball, false, "iris"); }
  const lineTex = bandTex();
  { const g = capUV(new THREE.SphereGeometry(0.0585, 40, 18, 0, TAU, 0, 0.82), 0.0585 * Math.sin(0.82)); const m = M(g, softMat({ map: lineTex, blending: THREE.AdditiveBlending, opacity: 0.45 }), eyeG, false, "light-line"); steamy(m, 5); var lineMesh = m; }
  { const g = new THREE.CircleGeometry(0.0046, 20); const m = M(g, noLine(new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, fog: false })), eyeG, false, "catch-light"); const n = new V3(-0.3, 0.9, -0.32).normalize(); m.position.copy(n.clone().multiplyScalar(0.0592)); m.lookAt(n.clone().multiplyScalar(2)); }
  const lidTex = paintLid(), lidMat = uwMat({ map: lidTex, side: THREE.DoubleSide }, { net: 0.45, speck: 0.15 });
  const upperG = grp(eyeG), lowerG = grp(eyeG);
  lidGeo(true).forEach((g, i) => M(g, lidMat, upperG, false, `upper-lid${i}`)); lidGeo(false).forEach((g, i) => M(g, lidMat, lowerG, false, `lower-lid${i}`));
  const lashes = [];
  for (let k = 0; k < 7; k++) {   // 7 weed blades along the upper stone's edge
    const psi = ((k - 3) / 3) * 66 * DEG, th = 0.3 + 0.68 * Math.sin(psi) ** 2, n = new V3(Math.sin(th) * Math.sin(psi), Math.cos(th), -Math.sin(th) * Math.cos(psi)), pos = n.clone().multiplyScalar(0.0675);
    const L = 0.026 + 0.014 * H2(k, 1), g = surf(1, 4, (u, v) => [(u - 0.5) * 0.007 * (1 - 0.8 * v), v * L, 0.006 * v * v * 2], (u, v) => [u, v]); g.rotateX(0);
    const holder = grp(upperG); holder.position.copy(pos); holder.quaternion.setFromUnitVectors(new V3(0, 1, 0), n.clone().add(new V3(0, 0, 0.35)).normalize());
    colorize(g, (x, y) => cmix("#2c6a58", "#4fb08e", clamp(y / L))); M(g, uwMat({ vertexColors: true, side: THREE.DoubleSide }, { lit: 0.3 }), holder, false, `lash${k + 1}`); lashes.push({ holder, ph: H2(k, 2) * TAU, q: holder.quaternion.clone() });
  }

  // ---- weeds: 12 ribbons 0.3-0.8 at the wall, swaying 10 degrees at 0.4 Hz
  const weeds = Array.from({ length: 12 }, (_, k) => ({ a: ((k + 0.4 * H2(k, 1)) / 12) * TAU, L: 0.3 + 0.5 * H2(k, 2), w: 0.04 + 0.025 * H2(k, 3), ph: H2(k, 4) * TAU, dirA: H2(k, 5) * TAU }));
  const NSEG = 10, wpos = new Float32Array(12 * (NSEG + 1) * 2 * 3), wcol = new Float32Array(wpos.length), widx = [], wn = new Float32Array(wpos.length);
  weeds.forEach((w, k) => { for (let j = 0; j <= NSEG; j++) for (let sd = 0; sd < 2; sd++) { const q = (k * (NSEG + 1) + j) * 2 + sd; C.set(cmix("#2a6d5c", "#63c4a6", j / NSEG * 0.8 + 0.1 * sd)); wcol.set([C.r, C.g, C.b], q * 3); wn[q * 3 + 1] = 0.3; wn[q * 3 + 2] = 1; } for (let j = 0; j < NSEG; j++) { const a = (k * (NSEG + 1) + j) * 2; widx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const wgeo = new THREE.BufferGeometry(); wgeo.setAttribute("position", new THREE.BufferAttribute(wpos, 3)); wgeo.setAttribute("color", new THREE.BufferAttribute(wcol, 3)); wgeo.setAttribute("normal", new THREE.BufferAttribute(wn, 3)); wgeo.setIndex(widx); wgeo.boundingSphere = new THREE.Sphere(new V3(0, 0.5, 0), 3);
  const weedMesh = M(wgeo, uwMat({ vertexColors: true, side: THREE.DoubleSide }, { lit: 0.5, net: 0.3 }), root, false, "weeds"); weedMesh.frustumCulled = false; counts.weeds = 12;

  // ---- the surface from below: a bright rippling disc, through it the cave's ceiling as 4 dark roots and one bright gap
  const scv = document.createElement("canvas"); scv.width = scv.height = 512; const sg = scv.getContext("2d"); const stex = new THREE.CanvasTexture(scv); stex.colorSpace = THREE.SRGBColorSpace;
  { const g = new THREE.CircleGeometry(1.15, 64); g.rotateX(Math.PI / 2); const m = M(g, softMat({ map: stex, opacity: 1, side: THREE.DoubleSide }), root, false, "surface"); m.position.y = 2.4; m.renderOrder = 4; m.userData.steam = true; }
  { const ctex = canvasTex(1024, 1024, (g, w, h) => {
      g.setTransform(w / 12, 0, 0, w / 12, w / 2, h / 2); const bg = g.createRadialGradient(0, 0, 0, 0, 0, 6); bg.addColorStop(0, "#35616c"); bg.addColorStop(1, "#14303a"); g.fillStyle = bg; g.fillRect(-6, -6, 12, 12);
      const roots = [[[-6, -2.4], [-2, -1.6], [2, -2.2], [6, -0.8]], [[-6, 1.8], [-1, 2.4], [3, 1.2], [6, 2.6]], [[-3.5, -6], [-2.5, -1], [-3.2, 3], [-2, 6]], [[3, -6], [2.2, -2], [4, 2], [3.6, 6]]];
      roots.forEach((r, i) => { smoothP(g, r, false); g.strokeStyle = "#0c1a20"; g.lineWidth = 1.5 - 0.15 * i; g.lineCap = "round"; g.stroke(); smoothP(g, r, false); g.strokeStyle = "#2c3f2e"; g.lineWidth = 0.35; g.stroke(); });
      const gp = g.createRadialGradient(0.6, -0.4, 0, 0.6, -0.4, 2.6); gp.addColorStop(0, "#ffffff"); gp.addColorStop(0.4, "#fff3c8"); gp.addColorStop(1, "rgba(240,215,140,0)"); g.fillStyle = gp; g.beginPath(); g.ellipse(0.6, -0.4, 2.7, 2.0, 0.3, 0, TAU); g.fill();
    }, "ceiling", 4); const g = new THREE.CircleGeometry(6, 48); g.rotateX(Math.PI / 2); const m = M(g, paintMat(ctex, { side: THREE.DoubleSide }), root, false, "ceiling-disc"); m.position.y = 9.2; m.userData.steam = true; }

  // ---- the head from below: a dark boulder r 0.95 at the surface, 14 beard strands hanging 0.6-1.6
  const headG = grp(); headG.position.set(-0.35, 2.4, -0.2);
  { const g = new THREE.SphereGeometry(0.95, 40, 20, 0, TAU, Math.PI / 2, Math.PI / 2); g.scale(1, 0.58, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + 0.035 * (vn(p.getX(i), p.getY(i), p.getZ(i), 3, 8) - 0.5); p.setXYZ(i, p.getX(i) * f, p.getY(i), p.getZ(i) * f); } g.computeVertexNormals();
    colorize(g, (x, y, z) => { const m = vn(x, y, z, 5, 4), q = vn(x, y, z, 17, 2); return q > 0.74 ? "#2f5e3c" : m > 0.62 ? "#3d6a5c" : cmix("#1a3a46", "#2c5560", m * (0.6 + 0.6 * vn(x, y, z, 11, 9))); }); M(g, uwMat({ vertexColors: true }, { lit: 0.8, fog: 0.35 }), headG, false, "head-boulder"); }
  const strands = Array.from({ length: 14 }, (_, k) => { const a = ((k - 6.5) / 6.5) * 80 * DEG, r = 0.5 + 0.3 * H2(k, 1); return { x: r * Math.sin(a), z: r * Math.cos(a) * 0.9 + 0.1, y: -0.58 * Math.sqrt(Math.max(0, 1 - (r / 0.95) ** 2)), L: 0.6 + 1.0 * H2(k, 2), ph: H2(k, 3) * TAU, dir: H2(k, 4) * Math.PI, w: 0.026 + 0.012 * H2(k, 5) }; });
  const BS = 9, bpos = new Float32Array(14 * BS * 2 * 3), bcol = new Float32Array(bpos.length), bn = new Float32Array(bpos.length), bidx = [];
  strands.forEach((st, k) => { for (let j = 0; j < BS; j++) for (let sd = 0; sd < 2; sd++) { const q = (k * BS + j) * 2 + sd; C.set(cmix("#cfdcc0", "#7fb08a", j / (BS - 1))); bcol.set([C.r, C.g, C.b], q * 3); bn[q * 3 + 2] = 1; } for (let j = 0; j < BS - 1; j++) { const a = (k * BS + j) * 2; bidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute("color", new THREE.BufferAttribute(bcol, 3)); bgeo.setAttribute("normal", new THREE.BufferAttribute(bn, 3)); bgeo.setIndex(bidx); bgeo.boundingSphere = new THREE.Sphere(new V3(0, -1, 0), 3);
  const beard = M(bgeo, uwMat({ vertexColors: true, side: THREE.DoubleSide }, { lit: 0.8, fog: 0.15 }), headG, false, "head-beard"); beard.frustumCulled = false;
  // peek: the fallback when the real Chip cannot lean: a small dark round head with two leaf tips on the bright disc, no face
  const peekG = grp(); peekG.position.set(0.86, 2.395, 0.05);
  { const g = new THREE.SphereGeometry(0.2, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2); g.scale(1, 0.55, 1); M(g, uwMat({ color: "#1c3d49" }, { lit: 0.6, fog: 0.2 }), peekG, false, "peek-head");
    for (const sd of [-1, 1]) { const lg = new THREE.CircleGeometry(0.07, 14); lg.scale(0.45, 1, 1); lg.translate(0, 0.07, 0); const lm = M(lg, uwMat({ color: "#2e5a3e", side: THREE.DoubleSide }, { lit: 0.5, fog: 0.2 }), peekG, false, "peek-leaf"); lm.position.set(sd * 0.07, 0.13, 0); lm.rotation.z = -sd * 0.5; lm.rotation.x = Math.PI / 2 - 0.2; } }
  peekG.visible = false;

  // ---- light: 9 slanting rays, 70 motes, a thread of 5 bubbles, silt and bubbles on the blink, 30 bubbles on the plunge
  const rayTex = canvasTex(16, 128, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "rgba(223,248,251,0.9)"); q.addColorStop(1, "rgba(223,248,251,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); const hz = g.createLinearGradient(0, 0, w, 0); hz.addColorStop(0, "rgba(0,0,0,0.9)"); hz.addColorStop(0.5, "rgba(0,0,0,0)"); hz.addColorStop(1, "rgba(0,0,0,0.9)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = hz; g.fillRect(0, 0, w, h); }, "ray", 1);
  const rays = Array.from({ length: 9 }, (_, k) => { const h = grp(); const a = (k / 9) * TAU + 0.4 * H2(k, 1), r = 0.15 + 0.7 * H2(k, 2); h.position.set(r * Math.cos(a), 2.39, r * Math.sin(a)); const L = 2.1 + 0.25 * H2(k, 3), w = 0.12 + 0.2 * H2(k, 4);
    for (const ry of [0, Math.PI / 2]) { const pg = new THREE.PlaneGeometry(w, L); pg.translate(0, -L / 2, 0); const pm = steamy(new THREE.Mesh(pg, softMat({ map: rayTex, color: "#dff8fb", opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 5); pm.rotation.y = ry; h.add(pm); }
    return { h, tx: (0.16 + 0.2 * H2(k, 5)) * (H2(k, 6) < 0.5 ? -1 : 1), tz: (0.1 + 0.2 * H2(k, 7)) * (H2(k, 8) < 0.5 ? -1 : 1), ph: H2(k, 9) * TAU }; });
  counts.rays = rays.length;
  const moteIm = new THREE.InstancedMesh(moteGeo, softMat({ color: "#dff8fb", opacity: 0.8, blending: THREE.AdditiveBlending }), 70); steamy(moteIm, 5); moteIm.frustumCulled = false; root.add(moteIm);
  const bubbleMat = softMat({ color: "#dff8fb", opacity: 0.7 });
  const mkBub = (n) => { const im = new THREE.InstancedMesh(dropGeo, bubbleMat, n); steamy(im, 5); im.frustumCulled = false; root.add(im); return im; };
  const thread = mkBub(5), silt = new THREE.InstancedMesh(moteGeo, softMat({ color: "#b9d4d6", opacity: 0.55 }), 5), blinkBub = mkBub(3), plungeBub = mkBub(30);
  steamy(silt, 5); silt.frustumCulled = false; root.add(silt);
  if (S.light !== 0) { const l = new THREE.PointLight("#bfeaf0", 0, 6, 2); l.position.set(0.6, 2.7, 0.2); root.add(l); var lamp = l; }
  root.userData.counts = counts;

  const scd = (g, st, t) => {   // the surface painting, 512 px = 2.3 m
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 512, 512); g.save(); g.beginPath(); g.arc(256, 256, 256, 0, TAU); g.clip(); g.setTransform(256 / 1.15, 0, 0, 256 / 1.15, 256, 256);
    const q = g.createRadialGradient(0, 0, 0, 0, 0, 1.15); q.addColorStop(0, "rgba(127,220,236,0.22)"); q.addColorStop(0.7, "rgba(150,230,242,0.3)"); q.addColorStop(1, "rgba(223,248,251,0.55)"); g.fillStyle = q; g.fillRect(-1.2, -1.2, 2.4, 2.4);
    for (let k = 0; k < 9; k++) { const cx = (H2(k, 1) - 0.5) * 1.6 + 0.06 * Math.sin(t * 0.4 + k), cz = (H2(k, 2) - 0.5) * 1.6 + 0.06 * Math.cos(t * 0.35 + k * 1.7); for (let j = 0; j < 4; j++) { const r = 0.08 + 0.1 * j + 0.04 * Math.sin(t * 0.8 + k + j); ellP(g, cx, cz, r, r * (0.8 + 0.15 * H2(k, 3))); g.strokeStyle = `rgba(223,248,251,${0.4 - 0.08 * j})`; g.lineWidth = 0.014; g.stroke(); } }
    for (let k = 0; k < 5; k++) { const a = H2(k, 7) * Math.PI, o = (H2(k, 8) - 0.5) * 2.2 + 0.1 * Math.sin(t * 0.5 + k), L = 0.4 + 0.5 * H2(k, 9); line(g, [[Math.cos(a) * -L + -Math.sin(a) * o, Math.sin(a) * -L + Math.cos(a) * o], [Math.cos(a) * L + -Math.sin(a) * o, Math.sin(a) * L + Math.cos(a) * o]], 0.01, "rgba(255,255,255,0.45)"); }
    g.restore();
  };

  return {
    grip: 0, counts,
    apply(ps, t) {
      t = t ?? 0; UW.t.value = t;
      const g0 = (k, d) => ps[k] ?? S[k] ?? d, blink = clamp(g0("blink", 0)), lookX = clamp(g0("lookX", 0), -1, 1), lookY = clamp(g0("lookY", 0), -1, 1), plunge = clamp(g0("plunge", 0)), hs = clamp(g0("headShadow", 1)), peek = clamp(g0("peek", 0));
      ball.rotation.set((18 - lookY * 30) * DEG, 0, -lookX * 30 * DEG);
      upperG.rotation.x = blink * 1.02; lowerG.rotation.x = -blink * 0.06;
      lineTex.center.set(0.5, 0.5); lineTex.rotation = 0.75; lineTex.offset.set(fract(t * 0.27), 0);
      for (const l of lashes) l.holder.quaternion.copy(l.q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18 * Math.sin(t * 2.1 + l.ph), 0, 0.12 * Math.sin(t * 1.7 + l.ph * 1.3))));
      // weeds sway 10 degrees at 0.4 Hz
      weeds.forEach((w, k) => {
        const bx = 1.1 * Math.cos(w.a), bz = 1.1 * Math.sin(w.a), by0 = pileH(1.1) * 0.8;
        for (let j = 0; j <= NSEG; j++) {
          const s = j / NSEG, sw = 10 * DEG * Math.sin(TAU * 0.4 * t + w.ph) * s * s, sw2 = 6 * DEG * Math.sin(TAU * 0.33 * t + w.ph * 1.7) * s * s;
          const y = by0 + w.L * s * Math.cos(sw), ox = Math.sin(sw) * w.L * s, oz = Math.sin(sw2) * w.L * s * 0.6, wd = w.w * (1 - 0.7 * s) * 0.5;
          const ix = -Math.cos(w.a) * 0.06 * s, iz = -Math.sin(w.a) * 0.06 * s;
          for (let sd = 0; sd < 2; sd++) { const q = ((k * (NSEG + 1) + j) * 2 + sd) * 3, sgn = sd ? 1 : -1; wpos[q] = bx + ox * Math.cos(w.dirA) + ix + sgn * wd * -Math.sin(w.a); wpos[q + 1] = y; wpos[q + 2] = bz + ox * Math.sin(w.dirA) + oz + iz + sgn * wd * Math.cos(w.a); }
        }
      });
      wgeo.attributes.position.needsUpdate = true;
      // the head from below
      headG.visible = hs > 0.01; headG.scale.setScalar(hs);
      strands.forEach((st, k) => { for (let j = 0; j < BS; j++) { const s = j / (BS - 1), sx = 0.06 * s * s * Math.sin(t * 0.8 + st.ph), sz = 0.05 * s * s * Math.cos(t * 0.6 + st.ph * 1.3), wd = st.w * (1 - 0.8 * s) * 0.5;
        for (let sd = 0; sd < 2; sd++) { const q = ((k * BS + j) * 2 + sd) * 3, sgn = sd ? 1 : -1; bpos[q] = st.x + sx + sgn * wd * Math.cos(st.dir); bpos[q + 1] = st.y - st.L * s; bpos[q + 2] = st.z + sz + sgn * wd * Math.sin(st.dir); } } });
      bgeo.attributes.position.needsUpdate = true;
      peekG.visible = peek > 0.01; peekG.scale.setScalar(Math.max(peek, 0.001));
      scd(sg, null, t); stex.needsUpdate = true;
      // rays
      rays.forEach((r, k) => { r.h.rotation.set(r.tz + 3 * DEG * Math.sin(t * 0.5 + r.ph), 0, r.tx + 3 * DEG * Math.cos(t * 0.45 + r.ph)); });
      for (let k = 0; k < 70; k++) { const a = H2(k, 1) * TAU + 0.15 * Math.sin(t * 0.2 + k), r = 1.0 * Math.sqrt(H2(k, 2)), y = 0.1 + fract(H2(k, 3) + t * (0.01 + 0.012 * H2(k, 4))) * 2.2, s = 0.007 * (0.6 + 0.8 * H2(k, 5)) * (0.7 + 0.3 * Math.sin(t * 1.5 + k)); T.position.set(r * Math.cos(a) + 0.04 * Math.sin(t * 0.3 + k), y, r * Math.sin(a)); T.rotation.set(0, 0, 0); T.scale.setScalar(s); T.updateMatrix(); moteIm.setMatrixAt(k, T.matrix); }
      moteIm.instanceMatrix.needsUpdate = true;
      for (let j = 0; j < 5; j++) { const ph = fract(t / 1.6 - j * 0.07), s = 0.012 + 0.006 * (j % 2); T.position.set(-0.55 + 0.03 * Math.sin(t * 3 + j), 0.1 + 2.2 * ph, -0.45 + 0.02 * Math.cos(t * 2.4 + j)); T.scale.setScalar(s * (ph < 0.97 ? 1 : 0.0001)); T.updateMatrix(); thread.setMatrixAt(j, T.matrix); }
      thread.instanceMatrix.needsUpdate = true;
      // blink: silt and bubbles rise from the eye (from the blink's time when the spec gives them, else from the blink value)
      const bAt = Array.isArray(S.blinkAt) ? S.blinkAt.filter((a) => a <= t).pop() : undefined, age = bAt !== undefined ? t - bAt : blink > 0.02 ? 0.25 + 0.7 * blink : -1, bk = age >= 0 && age < 1.4 ? age / 1.4 : -1;
      for (let j = 0; j < 5; j++) { const on = bk >= 0; T.position.set(EYE[0] + 0.05 * (j - 2) + 0.01 * Math.sin(t * 4 + j), EYE[1] + 0.03 + 0.3 * bk * (0.6 + 0.4 * H2(j, 1)), EYE[2] + 0.04 * Math.sin(j * 2.1)); T.scale.setScalar(on ? 0.005 * (1 - bk * 0.5) : 0.00001); T.updateMatrix(); silt.setMatrixAt(j, T.matrix); }
      silt.instanceMatrix.needsUpdate = true;
      for (let j = 0; j < 3; j++) { const on = bk >= 0 && bk > j * 0.08; T.position.set(EYE[0] + 0.06 * (j - 1), EYE[1] + 0.07 + 0.7 * Math.max(0, bk - j * 0.08), EYE[2] - 0.05 + 0.04 * j); T.scale.setScalar(on ? 0.011 + 0.003 * j : 0.00001); T.updateMatrix(); blinkBub.setMatrixAt(j, T.matrix); }
      blinkBub.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < 30; k++) { const on = plunge > 0.001 && plunge < 0.999, y = -0.2 + fract(H2(k, 1) + plunge * (1.3 + H2(k, 2))) * 3.0, a = H2(k, 3) * TAU, r = 0.95 * Math.sqrt(H2(k, 4)), s = (0.012 + 0.02 * H2(k, 5)) * (1 - sm((plunge - 0.85) / 0.15)); T.position.set(r * Math.cos(a) + 0.03 * Math.sin(plunge * 20 + k), y, r * Math.sin(a)); T.scale.setScalar(on ? s : 0.00001); T.updateMatrix(); plungeBub.setMatrixAt(k, T.matrix); }
      plungeBub.instanceMatrix.needsUpdate = true;
      if (lamp) lamp.intensity = 14;
    },
  };
}
