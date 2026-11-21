import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp, lerp } from "./util.js";
import { canvas, tex } from "./set-porch.js";
import { sunAt, moonAt, night, flicker, storm, P, S, weight } from "./spin-tracks.js";

// "spinroom": fact what-if 03 "What if Earth spun faster every second?" (21 Nov 2026): Spud's top-floor flat in an old Quito
// house (storyboards/series/facts/03-spin/DESIGN.md section A, B5). Lime plaster, dark timber, clay pots, wool, books.
// The moving parts are props (props-spinroom.js: swindow, scrt, sclock, spendant, smug, scrisps, squilt, sroomlight); this file is
// everything that never moves, the lights, and the helpers both files share. Seed 31703. The sky outside is another builder's.
//
// spec: { type: "spinroom", bare: false }
//   bare  false (default): the flat, the lights and the background. true: ONLY the lights and the sky-less background.
// The storyboard asks for "far": 6000 (the outside is kilometres away).
//
// WORLD (metres, x right, +z toward the camera, y up; the gravroom frame, mirrored furniture; -z out of the window is NORTH):
//   room         x -2.10..2.10, z -2.65..3.45 (no front wall), y 0..3.55. Window wall at z -2.65, the opening x -1.95..1.95, y .09..3.43
//                (EMPTY here: the insert is the prop swindow). Floor boards #79513D as gravity. Left wall lime plaster #E3CFB0 (2048 x 1024
//                canvas: 14 blotches, 5 hairline cracks, scuff band, a nail hole in a lighter .30 x .40 rectangle), right wall 30 timber
//                planks .14 m #8A5A3C, ceiling boards #9A6B4A + 5 beams .14 x .18 at x -1.68 -.84 0 .84 1.68 (y 3.37..3.55), baseboards #5B3A2A.
//   sofa         origin (-1.00, 0, -2.03), spans x -2.02..+.02, z -2.485..-1.575, seat top y .45, back top .87; oatmeal linen #C8B091,
//                legs #5B3A2A, pillows red #B5352B (cream stepped diamond) left, mustard #D9A441 right; the MANTA over its right arm.
//   rug          centre (.10, 0, -.35) r 1.03 (red Andean, three rings, braided edge)
//   bookshelf    x 1.78..2.10, z -1.75..-.85, 2.05 tall, 5 shelves, 64 books, llama, brass bell, photo frame, DESK GLOBE d .16 axis 23 deg on
//                shelf 3, shelf-top pothos (5 vines, 38 heart leaves)
//   pictures     framed snow-cone picture on the right wall (2.09, 1.80, -2.22) .46 x .58; tapestry on the left wall (-2.09, 1.75, -.20) .50 x .80
//   plants       floor plant (-1.82, 0, -1.28) (11 stems), sill plants (-1.55, .48, -2.57) rubber plant and (-1.18, .48, -2.57) succulent
//   lamp point   (.33, .88, -2.32) #FFD19A range 2.6 (the table lamp's glow; never dims)
//   lights       all inside the set's own group (the look's relight keeps them): "spinroom-key" (the first directional light; shadows), "spinroom-moon"
//                (no shadow), "spinroom-fill" (hemisphere), "spinroom-bounce", "spinroom-lamp". Driven by the prop sroomlight (B5); at t = 0 without it.
//   Open SLAM LANE: floor x .45..1.80, z -2.47..-1.85 stays empty (Spud walks the sash pull); nothing here stands in it.
// Wind (D): the prop swindow swings every node that has userData.windDeg (the three sill/floor plants' leaf groups, the manta's two
// fringes): rotation about the node's own origin, +-windDeg at 3 Hz, from windAt(t, slamAt, open).
// Budget (measured in node, this file alone): 16,680 triangles, 26 draw calls, 0 transparent (merged by surface: one mesh per texture or vertex-colour family).
// With every prop, frustum-culled per DESIGN J camera: P1 52 / P4 50 / P5 33 / P6 43 / P7 55 / P8 40 draw calls (limit 64), worst 22,644 triangles (limit 48,000),
// <= 11 transparent, 54 small opaque instances (crisps, crumbs, drops).
export const SPINROOM = {
  x0: -2.10, x1: 2.10, wallZ: -2.65, frontZ: 3.45, h: 3.55, win: { x0: -1.95, x1: 1.95, y0: 0.09, y1: 3.43 },
  sofa: [-1.00, -2.03], sideTable: [0.23, -2.22], clock: [0.15, 0.52, -2.12], lamp: [0.33, 0.52, -2.32], lampLight: [0.33, 0.88, -2.32],
  shelf: { x0: 1.78, x1: 2.10, z0: -1.75, z1: -0.85, h: 2.05 }, picture: [2.09, 1.80, -2.22], tapestry: [-2.09, 1.75, -0.20],
  crt: [1.45, -0.25, -48], pendant: [0, 1.93, -0.45], rug: [0.10, -0.35], plant: [-1.82, -1.28], sill: [[-1.55, 0.48, -2.57], [-1.18, 0.48, -2.57]],
  beams: [-1.68, -0.84, 0, 0.84, 1.68], wet: [1.40, -2.20], slamAt: 14.0,
};
export const SEED = 31703;

// ------------------------------------------------------------------------------------------------ helpers shared with props-spinroom.js
const memo = new Map();
export const once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
export const rad = (d) => (d * Math.PI) / 180;
// (userData.lineColor: the ink of a white-based, textured material is the room's ink, not white)
const INK = "#2A2226";
export const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }); m.userData.lineColor = INK; return m; };
export const canvasMap = (c, o = {}) => { const t = tex(c); t.wrapS = t.wrapT = o.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; return t; };
export function ctxFor(w, h) { return canvas(w, h); }
export function setShadows(o, cast = true, recv = true) { o.castShadow = cast; o.receiveShadow = recv; return o; }
export function mesh(geo, m, parent, x = 0, y = 0, z = 0, cast = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; if (parent) parent.add(o); return o; }
export const flat = (o, solid = false) => { o.castShadow = false; o.receiveShadow = false; o.userData.solid = solid; o.userData.steam = true; return o; };
// a box whose UVs are world-scale (tile metres per repeat), on each face by its normal
export function wbox(w, h, d, tile = 0.5) {
  const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    if (ay > 0.5) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile); else if (ax > 0.5) uv.setXY(i, p.getZ(i) / tile, p.getY(i) / tile); else uv.setXY(i, p.getX(i) / tile, p.getY(i) / tile);
  }
  return g;
}
// a vertex-coloured merged mesh builder: add(geometry, colour, position, euler (YXZ), scale) ... mesh(material)
export class Bag {
  constructor() { this.parts = []; this.tris = 0; }
  add(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz)));
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); this.parts.push(g); this.tris += n / 3; return g;
  }
  // per-vertex colours already on the geometry (a leaf with a midrib)
  addColoured(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz)));
    this.parts.push(g); this.tris += g.attributes.position.count / 3; return g;
  }
  geometry() { return mergeGeometries(this.parts, false); }
  mesh(m, parent, cast = true, recv = true) { const o = new THREE.Mesh(this.geometry(), m); o.castShadow = cast; o.receiveShadow = recv; if (parent) parent.add(o); return o; }
}
export const vcMat = (map = null, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, map, roughness: 0.8, ...o }); m.userData.lineColor = INK; return m; };

// a woven or grained neutral map (values near white), tiles 0.5 m; the vertex colour does the colour
export function grainMap(kind) {
  return once("grain:" + kind, () => {
    const [c, g] = canvas(256, 256), rnd = rng(SEED + (kind === "wood" ? 1 : kind === "wool" ? 2 : 3));
    g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, 256, 256);
    if (kind === "wood") {
      for (let i = 0; i < 90; i++) { const y = rnd() * 256; g.strokeStyle = rnd() < 0.5 ? "rgba(60,30,12,0.14)" : "rgba(255,235,210,0.18)"; g.lineWidth = 0.8 + rnd() * 1.6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (rnd() - 0.5) * 8, 170, y + (rnd() - 0.5) * 8, 256, y + (rnd() - 0.5) * 5); g.stroke(); }
    } else if (kind === "wool") {
      for (let i = 0; i < 2400; i++) { const k = 0.84 + rnd() * 0.3, x = rnd() * 256, y = rnd() * 256, hor = rnd() < 0.5, len = 3 + rnd() * 5; g.fillStyle = `rgba(${Math.round(242 * k)},${Math.round(242 * k)},${Math.round(242 * k)},0.6)`; if (hor) g.fillRect(x, y, len, 1.6); else g.fillRect(x, y, 1.6, len); }
      for (let i = 0; i < 220; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"; g.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5); }
    } else {
      for (let i = 0; i < 700; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.12)"; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    }
    const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  });
}

// a rounded box with a fine grid (every vertex projected onto the rounded surface), UVs world-scale triplanar (gravity's roundBox)
export function roundBox(w, h, d, r, sx, sy, sz, tile = 0.5) {
  const g = new THREE.BoxGeometry(1, 1, 1, sx, sy, sz), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, hx = w / 2, hy = h / 2, hz = d / 2;
  const remap = (c, half) => { const t = Math.abs(c) * 2, s = Math.sign(c), inner = half - r; return s * (t <= 0.75 ? (t / 0.75) * inner : inner + ((t - 0.75) / 0.25) * r); };
  const v = new THREE.Vector3(), q = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(remap(p.getX(i), hx), remap(p.getY(i), hy), remap(p.getZ(i), hz)); q.set(clamp(v.x, -(hx - r), hx - r), clamp(v.y, -(hy - r), hy - r), clamp(v.z, -(hz - r), hz - r));
    dir.copy(v).sub(q); const l = dir.length(); if (l > 1e-7) { dir.divideScalar(l); v.copy(q).addScaledVector(dir, r); n.setXYZ(i, dir.x, dir.y, dir.z); }
    p.setXYZ(i, v.x, v.y, v.z);
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, v.x / tile, v.z / tile); else if (ax >= az) uv.setXY(i, v.z / tile, v.y / tile); else uv.setXY(i, v.x / tile, v.y / tile);
  }
  return g;
}
export function pillowGeo(w, h, d, r, puff) {
  const g = roundBox(w, h, d, r, 10, 10, 4, 0.5), p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) { const k = (1 - Math.pow(p.getX(i) / (w / 2), 2)) * (1 - Math.pow(p.getY(i) / (h / 2), 2)), nz = n.getZ(i); if (Math.abs(nz) > 0.5) p.setZ(i, p.getZ(i) + Math.sign(nz) * puff * Math.max(0, k)); }
  g.computeVertexNormals(); return g;
}
// a lathe from [[r, y], ...]
export const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// a flat leaf: length along +y from the base, width across x, curled back (-z) by `curl`, vertex-coloured: edge, midrib line (rib colour), light tip.
// Returned with a second, reversed copy in the underside colour so a FrontSide material shows both faces.
export function leafGeo(len, wid, curl, top, light, rib, under, nu = 5, nv = 6) {
  const pos = [], col = [], idx = [], U = [-1, -0.07, 0, 0.07, 1], c0 = new THREE.Color(top), c1 = new THREE.Color(light), cr = new THREE.Color(rib), cu = new THREE.Color(under);
  const place = (ux, v) => { const prof = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.7)), 0.8); return [ux * wid * prof * 0.5, v * len, -curl * v * v * len - Math.abs(ux) * wid * 0.08 * prof]; };
  for (let j = 0; j <= nv; j++) { const v = j / nv; for (let i = 0; i < nu; i++) { const q = place(U[i], v), mid = Math.abs(U[i]) < 0.1; const k = clamp(v * 0.8 + (1 - Math.abs(U[i])) * 0.1 - 0.15); const c = mid ? cr : c0.clone().lerp(c1, k * 0.7); pos.push(...q); col.push(c.r, c.g, c.b); } }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu - 1; i++) { const a = j * nu + i, b = a + nu; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const n0 = pos.length / 3, back = [];
  for (let k = 0; k < n0; k++) { pos.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2] - 0.0006); col.push(cu.r, cu.g, cu.b); }
  for (let t = 0; t < idx.length; t += 3) back.push(idx[t] + n0, idx[t + 2] + n0, idx[t + 1] + n0);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex([...idx, ...back]); g.computeVertexNormals(); return g;
}
// a soft round glow texture (additive sprites and glows)
export function glowTex(c0 = "255,220,150", a0 = 0.9) {
  return once("glow:" + c0 + a0, () => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, `rgba(${c0},${a0})`); gr.addColorStop(0.4, `rgba(${c0},${a0 * 0.35})`); gr.addColorStop(1, `rgba(${c0},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c); });
}
export const glowMat = (c0, op, color = "#ffffff") => { const m = new THREE.SpriteMaterial({ map: glowTex(c0), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.noOutline = true; return m; };

// wind (D, P5): 1 while the sash stands open in the storm, 0 at the slam + .4 s. spec: slamAt (the slam starts), open (resting, .86)
export function windAt(t, slamAt = 1e9, open = 0.86) {
  const calm = 1 - P(t, slamAt + 0.2, slamAt + 0.6);
  return storm(t) * calm * clamp(open / 0.86);
}

// ------------------------------------------------------------------------------------------------ canvases
// lime plaster, mW x mH metres on a W x H canvas, y 0 at the bottom edge
function plasterCanvas(seed, W, H, mW, mH, nail) {
  const [c, g] = canvas(W, H), r = rng(seed), px = W / mW, py = H / mH;
  g.fillStyle = "#E3CFB0"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, rr = (0.2 + r() * 0.4) * px, up = r() < 0.5, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, up ? "rgba(255,248,232,0.10)" : "rgba(120,90,60,0.09)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 5200; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,250,240,0.12)" : "rgba(110,85,60,0.07)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 1.5); }
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rr = (0.05 + r() * 0.1) * px; g.strokeStyle = "rgba(120,90,60,0.05)"; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, rr, r() * 6, r() * 6 + 1.6); g.stroke(); }   // trowel arcs
  for (let i = 0; i < 5; i++) {   // hairline cracks .3-.9 m
    let x = r() * W, y = r() * H * 0.8, a = r() * 6.28; const L = (0.3 + r() * 0.6) * px; g.strokeStyle = "#B79C7A"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 7; k++) { a += (r() - 0.5) * 1.1; x += (Math.cos(a) * L) / 7; y += (Math.sin(a) * L) / 7 + L / 40; g.lineTo(x, y); } g.stroke();
  }
  const by = H - 0.075 * py;   // the scuff band, 4 cm above the baseboard
  const sg = g.createLinearGradient(0, by - 0.04 * py, 0, by); sg.addColorStop(0, "rgba(205,181,146,0)"); sg.addColorStop(0.35, "rgba(205,181,146,0.85)"); sg.addColorStop(1, "rgba(205,181,146,0.95)"); g.fillStyle = sg; g.fillRect(0, by - 0.04 * py, W, 0.04 * py);
  if (nail) { const [nx, ny] = nail; g.fillStyle = "rgba(255,248,236,0.30)"; g.fillRect((nx - 0.15) * px, H - (ny + 0.20) * py, 0.30 * px, 0.40 * py); g.fillStyle = "#6A5A48"; g.beginPath(); g.arc(nx * px, H - (ny + 0.15) * py, 2.2, 0, 6.3); g.fill(); g.fillStyle = "rgba(60,45,30,0.25)"; g.fillRect(nx * px - 1, H - (ny + 0.15) * py + 2, 2, 5); }
  return canvasMap(c);
}
// the right wall: 30 vertical planks .14 m, one repeat = 4.2 m of wall (tiled along z)
function plankCanvas() {
  const [c, g] = canvas(1024, 1024), r = rng(SEED + 5), n = 30, pw = 1024 / n;
  for (let p = 0; p < n; p++) {
    const k = 0.93 + r() * 0.14, x0 = p * pw; g.fillStyle = `rgb(${Math.round(138 * k)},${Math.round(90 * k)},${Math.round(60 * k)})`; g.fillRect(x0, 0, pw + 1, 1024);
    for (let i = 0; i < 16; i++) { const gx = x0 + 3 + r() * (pw - 6); g.strokeStyle = r() < 0.6 ? "rgba(60,30,14,0.16)" : "rgba(255,225,190,0.12)"; g.lineWidth = 0.8 + r() * 1.2; g.beginPath(); g.moveTo(gx, 0); g.bezierCurveTo(gx + 3, 340, gx - 3, 680, gx + (r() - 0.5) * 4, 1024); g.stroke(); }
    const kn = 2 + Math.floor(r() * 3);
    for (let q = 0; q < kn; q++) { const kx = x0 + pw * (0.3 + r() * 0.4), ky = 80 + r() * 860, rx = 3 + r() * 2.5, ry = rx * 1.7; for (let ring = 3; ring >= 0; ring--) { g.fillStyle = ring % 2 ? "rgba(70,38,20,0.22)" : "rgba(40,22,12,0.30)"; g.beginPath(); g.ellipse(kx, ky, rx * (0.45 + ring * 0.2), ry * (0.45 + ring * 0.2), 0, 0, 6.3); g.fill(); } }
    g.fillStyle = "#5B3A2A"; g.fillRect(x0 - 1.5, 0, 3, 1024);
  }
  const t = canvasMap(c, { repeat: true }); return t;
}
function ceilingCanvas() {
  const [c, g] = canvas(2048, 1024), r = rng(SEED + 6), rows = 30, rh = 1024 / rows;   // x 4.2 m wide, z 6.1 m: boards run along x
  for (let p = 0; p < rows; p++) {
    const k = 0.94 + r() * 0.12, y0 = p * rh; g.fillStyle = `rgb(${Math.round(154 * k)},${Math.round(107 * k)},${Math.round(74 * k)})`; g.fillRect(0, y0, 2048, rh + 1);
    for (let i = 0; i < 7; i++) { const gy = y0 + 2 + r() * (rh - 4); g.strokeStyle = r() < 0.6 ? "rgba(60,30,14,0.14)" : "rgba(255,225,190,0.12)"; g.lineWidth = 0.8 + r() * 1.1; g.beginPath(); g.moveTo(0, gy); g.bezierCurveTo(680, gy + 2, 1360, gy - 2, 2048, gy + (r() - 0.5) * 3); g.stroke(); }
    g.fillStyle = "#6E4A33"; g.fillRect(0, y0, 2048, 1.6);
  }
  return canvasMap(c);
}
// a beam: u along its length (1.5 m per repeat), v across the section; lit edge on top and bottom, 3 rows of adze marks
function beamCanvas() {
  const [c, g] = canvas(1024, 128), r = rng(SEED + 7);
  g.fillStyle = "#5B3A2A"; g.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 34; i++) { const y = r() * 128; g.strokeStyle = r() < 0.5 ? "rgba(20,10,4,0.28)" : "rgba(160,110,74,0.16)"; g.lineWidth = 0.8 + r() * 1.3; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + (r() - 0.5) * 6, 700, y + (r() - 0.5) * 6, 1024, y + (r() - 0.5) * 4); g.stroke(); }
  g.fillStyle = "#7A5238"; g.fillRect(0, 0, 1024, 14); g.fillRect(0, 114, 1024, 14);
  for (const row of [34, 64, 94]) for (let x = r() * 40; x < 1024; x += 34 + r() * 40) { g.strokeStyle = "rgba(20,10,4,0.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, row - 8); g.quadraticCurveTo(x + 8, row, x, row + 8); g.stroke(); g.strokeStyle = "rgba(190,140,96,0.35)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 3, row - 8); g.quadraticCurveTo(x + 11, row, x + 3, row + 8); g.stroke(); }
  return canvasMap(c, { repeat: true });
}
function floorTex(W, D) {
  const PX = 480, cw = Math.round(W * PX), ch = Math.round(D * PX * 0.7), [c, g] = canvas(cw, ch), rnd = rng(26031);
  g.fillStyle = "#79513D"; g.fillRect(0, 0, cw, ch);
  let x = 0;
  while (x < cw) {
    const bw = Math.round((0.15 + rnd() * 0.07) * PX), tone = 0.93 + rnd() * 0.14; let y = -Math.round(rnd() * 1.2 * PX * 0.7);
    while (y < ch) {
      const len = Math.round((1.2 + rnd() * 1.4) * PX * 0.7), t2 = tone * (0.97 + rnd() * 0.06);
      g.fillStyle = `rgb(${Math.round(121 * t2)},${Math.round(81 * t2)},${Math.round(61 * t2)})`; g.fillRect(x, y, bw, len); g.strokeStyle = "rgba(60,36,24,0.16)"; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const gx = x + 4 + rnd() * (bw - 8); g.beginPath(); g.moveTo(gx, y); g.bezierCurveTo(gx + 3, y + len * 0.3, gx - 3, y + len * 0.6, gx + 1, y + len); g.stroke(); }
      g.fillStyle = "#4B332A"; g.fillRect(x, y, bw, 1); y += len;
    }
    g.fillStyle = "#4B332A"; g.fillRect(x, 0, 1, ch); x += bw;
  }
  return canvasMap(c);
}
// the sun's patches on the floor: straight bands from the window (x +-3.2 m canvas), sheared by the texture matrix; canvas top = the window wall
const SHEEN_W = 6.4;
function sheenCanvas(D) {
  const cw = 512, ch = 512, [c, g] = canvas(cw, ch), X = (x) => ((x + SHEEN_W / 2) / SHEEN_W) * cw;
  g.fillStyle = "#222222"; g.fillRect(0, 0, cw, ch);
  const fade = g.createLinearGradient(0, 0, 0, ch); fade.addColorStop(0, "rgba(255,255,255,0.95)"); fade.addColorStop(0.5, "rgba(255,255,255,0.62)"); fade.addColorStop(1, "rgba(255,255,255,0.30)");
  g.filter = "blur(4px)"; g.fillStyle = fade;
  for (const [a, b] of [[-1.77, -0.30], [-0.22, 0.66], [0.78, 1.77]]) g.fillRect(X(a), 0, X(b) - X(a), ch);
  g.filter = "none";
  return canvasMap(c);
}

// manta: 17 stripes, widths as shares of the long side, mirrored about the centre diamond band
function mantaCanvas() {
  const [c, g] = canvas(1024, 672);
  const RED = "#B5352B", CREAM = "#F0E2C4", ORG = "#E0902F", BLUE = "#1F4E79", PINK = "#C2356B", YEL = "#F2C230", TEAL = "#2F6E7A", DARK = "#3B2F2A";
  const first = [["red", 0.09], ["cream", 0.012], ["orange", 0.05], ["zig", 0.07], ["pink", 0.04], ["yellow", 0.03], ["teal", 0.05], ["diamond", 0.09], ["cream", 0.012]];
  const seq = [...first, ...first.slice(0, 8).reverse()], total = seq.reduce((s, a) => s + a[1], 0);
  let x = 0; const H = 672;
  for (const [kind, w0] of seq) {
    const w = (w0 / total) * 1024;
    if (kind === "red") { g.fillStyle = RED; g.fillRect(x, 0, w + 1, H); } else if (kind === "cream") { g.fillStyle = CREAM; g.fillRect(x, 0, w + 1, H); } else if (kind === "orange") { g.fillStyle = ORG; g.fillRect(x, 0, w + 1, H); } else if (kind === "pink") { g.fillStyle = PINK; g.fillRect(x, 0, w + 1, H); } else if (kind === "yellow") { g.fillStyle = YEL; g.fillRect(x, 0, w + 1, H); } else if (kind === "teal") { g.fillStyle = TEAL; g.fillRect(x, 0, w + 1, H); }
    else if (kind === "zig") { g.fillStyle = CREAM; g.fillRect(x, 0, w + 1, H); g.fillStyle = BLUE; const n = 14, th = H / n; g.beginPath(); g.moveTo(x, 0); for (let i = 0; i < n; i++) { g.lineTo(x + w, i * th + th / 2); g.lineTo(x, (i + 1) * th); } g.lineTo(x - 1, H); g.lineTo(x - 1, 0); g.fill(); g.beginPath(); g.moveTo(x + w + 1, 0); for (let i = 0; i < n; i++) { g.lineTo(x, i * th + th / 2); g.lineTo(x + w, (i + 1) * th); } g.lineTo(x + w + 1, H); g.fill(); }
    else if (kind === "diamond") { g.fillStyle = DARK; g.fillRect(x, 0, w + 1, H); const n = 9, th = H / n; for (let i = 0; i < n; i++) { const cy = i * th + th / 2; g.fillStyle = i % 2 ? YEL : RED; g.beginPath(); g.moveTo(x + w / 2, cy - th * 0.46); g.lineTo(x + w * 0.9, cy); g.lineTo(x + w / 2, cy + th * 0.46); g.lineTo(x + w * 0.1, cy); g.fill(); g.fillStyle = i % 2 ? RED : YEL; g.beginPath(); g.moveTo(x + w / 2, cy - th * 0.18); g.lineTo(x + w * 0.66, cy); g.lineTo(x + w / 2, cy + th * 0.18); g.lineTo(x + w * 0.34, cy); g.fill(); } }
    x += w;
  }
  g.fillStyle = "rgba(0,0,0,0.08)"; for (let y = 0; y < H; y += 3) g.fillRect(0, y, 1024, 1);   // weft lines
  return canvasMap(c);
}
function pillowCanvas() {   // red pillow, one cream stepped diamond
  const [c, g] = canvas(256, 256), r = rng(SEED + 9); g.fillStyle = "#B5352B"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.10)"; g.fillRect(r() * 256, r() * 256, 1.6, 4); }
  g.fillStyle = "#F0E2C4"; const cx = 128, cy = 128, st = 14;
  for (let k = -4; k <= 4; k++) { const w = (5 - Math.abs(k)) * st; g.fillRect(cx - w, cy + k * st - st / 2, w * 2, st); }
  g.fillStyle = "#B5352B"; for (let k = -2; k <= 2; k++) { const w = (3 - Math.abs(k)) * st; g.fillRect(cx - w + 6, cy + k * st - st / 2 + 6, Math.max(0, w * 2 - 12), st - 12); }
  g.fillStyle = "#E0902F"; g.fillRect(cx - st / 2, cy - st / 2, st, st);
  return canvasMap(c);
}
function rugCanvas() {
  const [c, g] = canvas(1024, 1024), r = rng(SEED + 11), cx = 512, R = 512, m = R / 1.03;   // px per metre
  g.fillStyle = "#8E2F2A"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { const a = r() * 6.2832, rr = Math.sqrt(r()) * R; g.fillStyle = r() < 0.5 ? "rgba(255,230,205,0.08)" : "rgba(40,10,8,0.12)"; g.fillRect(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr, 2, 2); }
  // ring 1 .55 and ring 3 .95: cream zigzag (36 teeth); ring 2 .78: 16 stepped diamonds blue / orange
  g.save(); g.beginPath(); g.arc(cx, cx, 0.62 * m, 0, 6.3); g.arc(cx, cx, 0.48 * m, 0, 6.3, true); g.clip(); g.fillStyle = "#F0E2C4"; g.fillRect(0, 0, 1024, 1024); g.restore();
  g.fillStyle = "#8E2F2A"; for (let i = 0; i < 36; i++) { const a = ((i + 0.5) / 36) * 6.2832, a1 = (i / 36) * 6.2832; g.beginPath(); g.moveTo(cx + Math.cos(a1) * 0.48 * m, cx + Math.sin(a1) * 0.48 * m); g.lineTo(cx + Math.cos(a) * 0.62 * m, cx + Math.sin(a) * 0.62 * m); g.lineTo(cx + Math.cos(a1 + 6.2832 / 36) * 0.48 * m, cx + Math.sin(a1 + 6.2832 / 36) * 0.48 * m); g.fill(); }
  g.save(); g.beginPath(); g.arc(cx, cx, 1.02 * m, 0, 6.3); g.arc(cx, cx, 0.88 * m, 0, 6.3, true); g.clip(); g.fillStyle = "#F0E2C4"; g.fillRect(0, 0, 1024, 1024); g.restore();
  g.fillStyle = "#8E2F2A"; for (let i = 0; i < 36; i++) { const a = ((i + 0.5) / 36) * 6.2832, a1 = (i / 36) * 6.2832; g.beginPath(); g.moveTo(cx + Math.cos(a1) * 0.88 * m, cx + Math.sin(a1) * 0.88 * m); g.lineTo(cx + Math.cos(a) * 1.02 * m, cx + Math.sin(a) * 1.02 * m); g.lineTo(cx + Math.cos(a1 + 6.2832 / 36) * 0.88 * m, cx + Math.sin(a1 + 6.2832 / 36) * 0.88 * m); g.fill(); }
  for (let i = 0; i < 16; i++) {   // stepped diamonds at r .70
    const a = (i / 16) * 6.2832, dx = cx + Math.cos(a) * 0.70 * m, dy = cx + Math.sin(a) * 0.70 * m; g.save(); g.translate(dx, dy); g.rotate(a + Math.PI / 2);
    const col = i % 2 ? "#E0902F" : "#1F4E79", s = 0.045 * m; g.fillStyle = col; for (let k = -2; k <= 2; k++) { const w = (3 - Math.abs(k)) * s; g.fillRect(-w, k * s * 0.8 - s * 0.4, w * 2, s * 0.8); }
    g.fillStyle = i % 2 ? "#1F4E79" : "#E0902F"; g.fillRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8); g.restore();
  }
  for (const rr of [0.69, 0.82]) { g.strokeStyle = "#3B2F2A"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cx, rr * m, 0, 6.3); g.stroke(); }
  // the braided edge r .98 -> 1.03
  g.fillStyle = "#3B2F2A"; g.beginPath(); g.arc(cx, cx, R, 0, 6.3); g.arc(cx, cx, 0.98 * m, 0, 6.3, true); g.fill();
  g.strokeStyle = "#7A5A44"; g.lineWidth = 2.2; for (let i = 0; i < 150; i++) { const a = (i / 150) * 6.2832; g.beginPath(); g.moveTo(cx + Math.cos(a) * 0.985 * m, cx + Math.sin(a) * 0.985 * m); g.lineTo(cx + Math.cos(a + 0.05) * 1.028 * m, cx + Math.sin(a + 0.05) * 1.028 * m); g.stroke(); }
  return canvasMap(c);
}
export function llamaPath(g, x, y, s, col) {   // a llama silhouette, feet at (x, y), height s
  g.fillStyle = col; g.beginPath();
  const P2 = [[0, 0.0], [0, 0.32], [-0.02, 0.36], [0.06, 0.4], [0.3, 0.42], [0.36, 0.5], [0.42, 0.75], [0.44, 0.9], [0.4, 0.97], [0.46, 1.0], [0.52, 0.96], [0.56, 0.9], [0.5, 0.88], [0.5, 0.7], [0.5, 0.45], [0.54, 0.35], [0.54, 0.0], [0.47, 0.0], [0.46, 0.3], [0.4, 0.34], [0.18, 0.32], [0.14, 0.0]];
  g.moveTo(x + 0.06 * s * 0, y); for (const [px, py] of P2) g.lineTo(x + (px - 0.28) * s * 0.9, y - py * s); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(x + (0.26 - 0.28) * s * 0.9, y - 0.3 * s, 0.26 * s * 0.45, 0.14 * s * 0.8, 0, 0, 6.3); g.fill();
}
function tapestryCanvas() {
  const [c, g] = canvas(512, 820), r = rng(SEED + 13);
  const bands = [["#B5352B", 90], ["#E0902F", 70], ["#F0E2C4", 80], ["#2F6E7A", 190], ["#F2C230", 80], ["#33506B", 130], ["#8E2F2A", 180]];   // 7 bands
  let y = 0; bands.forEach(([col, h], i) => {
    g.fillStyle = col; g.fillRect(0, y, 512, h);
    if (i === 3) { for (let k = 0; k < 5; k++) llamaPath(g, 54 + k * 100, y + h - 22, 98, "#F0E2C4"); g.fillStyle = "#F0E2C4"; g.fillRect(0, y + 6, 512, 6); g.fillRect(0, y + h - 12, 512, 6); }
    else if (i === 1 || i === 5) { g.fillStyle = i === 1 ? "#B5352B" : "#F0E2C4"; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(k * 37 + 4, y + h - 10); g.lineTo(k * 37 + 22, y + 10); g.lineTo(k * 37 + 40, y + h - 10); g.fill(); } }
    else if (i === 0 || i === 6) { g.fillStyle = "#F2C230"; for (let k = 0; k < 9; k++) { const cx = 30 + k * 56, cy = y + h / 2; g.beginPath(); g.moveTo(cx, cy - 20); g.lineTo(cx + 22, cy); g.lineTo(cx, cy + 20); g.lineTo(cx - 22, cy); g.fill(); } }
    else if (i === 2 || i === 4) { g.fillStyle = i === 2 ? "#2F6E7A" : "#B5352B"; for (let k = 0; k < 16; k++) g.fillRect(k * 32 + 8, y + 22, 16, h - 44); }
    y += h;
  });
  g.fillStyle = "rgba(0,0,0,0.08)"; for (let yy = 0; yy < 820; yy += 3) g.fillRect(0, yy, 512, 1);
  for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(r() * 512, r() * 820, 3, 1.4); }
  return canvasMap(c);
}
function pictureCanvas() {   // a snow cone at dawn
  const [c, g] = canvas(368, 464), r = rng(SEED + 15), sky = g.createLinearGradient(0, 0, 0, 340); sky.addColorStop(0, "#9DB9E0"); sky.addColorStop(1, "#F2C9A0"); g.fillStyle = sky; g.fillRect(0, 0, 368, 464);
  g.fillStyle = "rgba(255,255,255,0.4)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(40 + r() * 290, 40 + r() * 130, 38 + r() * 40, 5 + r() * 4, 0, 0, 6.3); g.fill(); }
  g.fillStyle = "#7C86A8"; g.beginPath(); g.moveTo(0, 300); g.lineTo(60, 250); g.lineTo(120, 286); g.lineTo(0, 330); g.fill();
  g.fillStyle = "#5A6C8A"; g.beginPath(); g.moveTo(40, 340); g.lineTo(180, 110); g.lineTo(208, 120); g.lineTo(350, 340); g.closePath(); g.fill();
  g.fillStyle = "#F4F1EA"; g.beginPath(); g.moveTo(180, 110); g.lineTo(208, 120); g.lineTo(250, 190); g.lineTo(226, 178); g.lineTo(206, 200); g.lineTo(190, 176); g.lineTo(160, 196); g.lineTo(148, 170); g.closePath(); g.fill();
  g.fillStyle = "#4A5A78"; g.beginPath(); g.moveTo(208, 120); g.lineTo(350, 340); g.lineTo(250, 340); g.lineTo(226, 178); g.fill();
  const pg = g.createLinearGradient(0, 300, 0, 464); pg.addColorStop(0, "#6E8A4E"); pg.addColorStop(1, "#4F6A38"); g.fillStyle = pg; g.beginPath(); g.moveTo(0, 340); for (let x = 0; x <= 368; x += 23) g.lineTo(x, 330 + Math.sin(x * 0.04) * 10 + r() * 6); g.lineTo(368, 464); g.lineTo(0, 464); g.fill();
  llamaPath(g, 270, 420, 56, "#2E3A26");
  return canvasMap(c);
}
// the bookshelf's spines: one 2048 x 1280 atlas = 5 strips of 2048 x 256 (a strip per shelf); spine layout comes from bookLayout()
const SPINE = ["#8C2F2B", "#C9572E", "#E0A63C", "#2F6E7A", "#33506B", "#5B3A5E", "#7A8B4A", "#E6D7B5", "#3B2F2A"];
function bookLayout() {
  return once("books", () => {
    const r = rng(SEED + 17), shelves = [], counts = [14, 12, 13, 11, 14], gaps = [[0.12, 0.5], [0.10, 0.35], [0.22, 0.45], [0, 0], [0.13, 0.6]], z0 = SPINROOM.shelf.z0 + 0.07;   // 64 books
    for (let s = 0; s < 5; s++) {
      const list = []; let z = z0, gapZ = null;
      for (let i = 0; i < counts[s]; i++) {
        const [gw, ga] = gaps[s]; if (gw && i === Math.round(counts[s] * ga)) { gapZ = z + gw / 2; z += gw; }
        const w = 0.022 + r() * 0.033, h = 0.17 + r() * 0.1, d = 0.15 + r() * 0.06; list.push({ w, h, d, z, col: Math.floor(r() * 9), lean: r() < 0.2 ? (6 + r() * 8) * (r() < 0.5 ? -1 : 1) : 0 }); z += w + 0.002;
      }
      shelves.push({ list, end: z, gapZ });
    }
    return shelves;
  });
}
function spineAtlas() {
  return once("spines", () => {
    const [c, g] = canvas(2048, 1280), L = bookLayout(), r = rng(SEED + 19); g.fillStyle = "#3B2F2A"; g.fillRect(0, 0, 2048, 1280);
    for (let s = 0; s < 5; s++) {
      let x = 8; const y0 = s * 256;
      for (const b of L[s].list) {
        const w = Math.round(b.w * 1000 / 0.9 * 1.9), h = Math.round(b.h * 800 * 0.9), base = SPINE[b.col]; b.px = [x, y0, w, h];
        g.fillStyle = base; g.fillRect(x, y0, w, 256);
        // 2 title bars, a band and a publisher dot (no letters)
        const light = b.col === 7 || b.col === 2; g.fillStyle = light ? "#3B2F2A" : "#E6D7B5"; g.fillRect(x + w * 0.2, y0 + h * 0.14, w * 0.6, h * 0.05); g.fillRect(x + w * 0.28, y0 + h * 0.23, w * 0.44, h * 0.035);
        g.fillStyle = light ? "#8C2F2B" : "#E0A63C"; g.fillRect(x, y0 + h * 0.55, w, h * 0.06); g.beginPath(); g.arc(x + w / 2, y0 + h * 0.86, w * 0.17, 0, 6.3); g.fill();
        g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(x, y0, 2, 256); g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x + w - 3, y0, 2, 256);
        for (let k = 0; k < 14; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"; g.fillRect(x + r() * w, y0 + r() * h, 2, 5); }
        x += w + 6;
      }
    }
    return canvasMap(c);
  });
}

// ------------------------------------------------------------------------------------------------ lights (B5)
const DAY = { sky: new THREE.Color("#B9C4E8"), ground: new THREE.Color("#6A4A3A"), k: 0.74 }, NIGHT = { sky: new THREE.Color("#3A4A80"), ground: new THREE.Color("#2A2030"), k: 0.42 };
const KEY_LOW = new THREE.Color("#FFB36B"), KEY_HIGH = new THREE.Color("#FFE2B8"), MOON_COL = new THREE.Color("#8FA6D8");
const dirOf = (azDeg, elDeg) => { const a = rad(azDeg), e = rad(elDeg); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };
const KEY_AIM = new THREE.Vector3(0, 0.8, 0.3);
// WHAT THE LOOK DOES WITH LIGHT (looks.js patchToon): the anime-pro toon shader prints base x mix(shade, lit, litK) and nothing else, where litK is the
// direct diffuse of ALL lights divided by what the FIRST directional light alone would give. So (1) only the first directional light shapes the bands and
// the cast shadow; a second directional light, or a first one at intensity 0, makes litK saturate; (2) the hemisphere never shows; (3) the room gets dark
// by multiplying the materials' own colours. Therefore: the "key" light carries the sun by day and the moon by night (direction, colour, a floor of
// intensity .5; the moon is folded in with weight wMoon = N(0) x A), "spinroom-moon" stays at intensity 0 for the contract's sake, and the night is a tint
// of every set and prop material (tintRoom): day (1,1,1) to night (.66,.74,.96), halfway when the flicker is fast. The lamp, pendant and CRT never dim.
const SHEEN_WARM = new THREE.Color("#FF9C58");
const NIGHT_TINT = new THREE.Color(0.66, 0.74, 0.96);
// everything B5 says as numbers, a pure function of the clip time t
export function roomLightAt(t) {
  const s = sunAt(t), m = moonAt(t), N0 = night(t, 0), A = flicker(t);
  const azk = clamp(2.6 * s.az, -39, 39), elk = clamp(14 + 1.4 * s.el, 14, 35);
  const azm = clamp(2.6 * m.az, -39, 39), elm = clamp(14 + 1.4 * m.el, 14, 35);
  const keyGain = 2.10 * lerp(0.56, 1 - N0, A), moonGain = 0.55 * N0 * A;
  const hw = 0.5 + A * (N0 - 0.5);   // 0 = day .. 1 = night, halfway when the flicker is fast
  const wMoon = clamp(moonGain / (moonGain + keyGain / 3.8 + 1e-6)), sunDir = dirOf(azk, elk), moonDir = dirOf(azm, elm);
  return {
    keyDir: sunDir.clone().lerp(moonDir, wMoon).normalize(), keyGain, keyColor: new THREE.Color().copy(KEY_LOW).lerp(KEY_HIGH, clamp(s.el / 12)).lerp(MOON_COL, wMoon),
    keyI: Math.max(0.5, keyGain + moonGain * 3.8), moonDir, moonGain, slant: -Math.tan(rad(lerp(azk, azm, wMoon))), sheenK: clamp(0.45 * (keyGain / 2.1) + 0.2 * wMoon, 0, 0.6),
    hemiK: lerp(DAY.k, NIGHT.k, hw), hemiSky: new THREE.Color().copy(DAY.sky).lerp(NIGHT.sky, hw), hemiGround: new THREE.Color().copy(DAY.ground).lerp(NIGHT.ground, hw),
    tint: new THREE.Color(1, 1, 1).lerp(NIGHT_TINT, hw), N0, A, hw,
  };
}
// stage.js multiplies every room light by lightsAt().room each frame from the intensity it read right after the set was built (its "base");
// a driven light therefore reads 1 at that moment, and its real gain lives in __drive: intensity = __drive x (what stage.js writes)
function drivable(l) {
  l.__drive = 1; l.__I = 1;
  Object.defineProperty(l, "intensity", { configurable: true, get() { return this.__I; }, set(v) { this.__I = this.__drive * v; } });
  return l;
}
// every set and prop mesh that takes the room's tint (the look swaps materials after the first frame, so the base colour lives on the mesh)
function tintList(scene) {
  if (scene.userData.__spinTint) return scene.userData.__spinTint;
  const list = []; scene.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material) || o.userData.noTint) return;
    let q = o, ok = false; while (q) { if (q.name === "spinroom" || q.userData.spinroomProp) { ok = true; break; } q = q.parent; }
    const m = o.material; if (!ok || !(m.isMeshStandardMaterial || m.isMeshToonMaterial) || m.userData.noTint) return;
    o.userData.tintBase = m.color.clone(); list.push(o);
  });
  scene.userData.__spinTint = list; return list;
}
export function tintRoom(scene, tint) {
  for (const o of tintList(scene)) { const m = o.material; if (m.color) m.color.copy(o.userData.tintBase).multiply(tint); }
}
// puts a roomLightAt(t) onto the set's lights and floor sheen (live = group.userData.live)
export function applyRoomLight(live, t, withTint = true) {
  const L = roomLightAt(t);
  live.key.position.copy(KEY_AIM).addScaledVector(L.keyDir, 9); live.key.color.copy(L.keyColor); live.key.__drive = L.keyI;
  live.moon.position.copy(KEY_AIM).addScaledVector(L.moonDir, 9); live.moon.__drive = 0;
  live.hemi.color.copy(L.hemiSky); live.hemi.groundColor.copy(L.hemiGround); live.hemi.__drive = L.hemiK;
  live.bounce.__drive = 0.15 * L.keyI; live.bounce.color.copy(L.keyColor).lerp(new THREE.Color("#E6A06B"), 0.5);
  const fm = live.floorMat, W = live.W, Zlen = live.Zlen, k = (L.slant * Zlen) / SHEEN_W;
  fm.emissive.copy(L.keyColor).lerp(SHEEN_WARM, 0.45); fm.emissiveIntensity = L.sheenK;
  live.sheen.matrix.set(W / SHEEN_W, k, 0.5 - (0.5 * W) / SHEEN_W - k, 0, 1, 0, 0, 0, 1);
  if (withTint && live.group) tintRoom(rootOfGroup(live.group), L.tint);
  return L;
}
const rootOfGroup = (o) => { while (o.parent) o = o.parent; return o; };

function buildLights(g) {
  const key = new THREE.DirectionalLight("#FFB36B", 1); key.name = "spinroom-key"; key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -4.4, right: 4.4, top: 4.4, bottom: -4.4, near: 1, far: 18 }); key.target.position.copy(KEY_AIM); g.add(key); g.add(key.target);
  const moon = new THREE.DirectionalLight("#8FA6D8", 1); moon.name = "spinroom-moon"; moon.castShadow = false; moon.target.position.copy(KEY_AIM); g.add(moon); g.add(moon.target);
  const hemi = new THREE.HemisphereLight("#B9C4E8", "#6A4A3A", 1); hemi.name = "spinroom-fill"; g.add(hemi);
  const bounce = new THREE.DirectionalLight("#E6A06B", 1); bounce.name = "spinroom-bounce"; bounce.position.set(0.3, -6, -1.5); bounce.target.position.set(0, 0, 0); bounce.castShadow = false; g.add(bounce); g.add(bounce.target);
  const lamp = new THREE.PointLight("#FFD19A", 1.7, 2.6, 2); lamp.name = "spinroom-lamp"; lamp.position.set(...SPINROOM.lampLight); lamp.castShadow = false; g.add(lamp);
  for (const l of [key, moon, hemi, bounce]) drivable(l);
  return { key, moon, hemi, bounce, lamp };
}

// ------------------------------------------------------------------------------------------------ the set
export function buildSpinroom(scene, S0 = {}) {
  const g = new THREE.Group(); g.name = "spinroom"; scene.add(g);
  scene.background = new THREE.Color("#6c5a7c");   // a dusk violet where no sky is built (the sky is another builder's)
  const lights = buildLights(g), R = SPINROOM, WZ = R.wallZ, Z0 = WZ - 0.12, Zlen = R.frontZ - Z0, Zc = (R.frontZ + Z0) / 2, W = R.x1 - R.x0, win = R.win;
  g.userData.live = { ...lights, W, Zlen, group: g };
  if (S0.bare) { g.userData.live.floorMat = new THREE.MeshStandardMaterial(); g.userData.live.sheen = new THREE.Texture(); g.userData.live.group = null; applyRoomLight(g.userData.live, 0); return g; }

  // ---------- the shell
  const sheen = sheenCanvas(Zlen); sheen.matrixAutoUpdate = false;
  const floorMat = std("#ffffff", { map: floorTex(W, Zlen), roughness: 0.42, emissive: "#FF9C58", emissiveMap: sheen, emissiveIntensity: 0.45 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Zlen), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, Zc); floor.receiveShadow = true; g.add(floor);
  g.userData.live.floorMat = floorMat; g.userData.live.sheen = sheen;
  // walls as thick boxes outside the room (they cast and take shadow), the inner face carrying the canvas by planar UVs
  const planar = (geo, f) => { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) { const [u, v] = f(p.getX(i), p.getY(i), p.getZ(i)); uv.setXY(i, u, v); } return geo; };
  const leftM = std("#ffffff", { map: plasterCanvas(SEED + 1, 2048, 1024, Zlen, R.h, [1.15 - Z0, 1.75]) }), backM = std("#ffffff", { map: plasterCanvas(SEED + 2, 1024, 512, W, R.h, null) });
  const rightM = std("#ffffff", { map: (() => { const t = plankCanvas(); t.repeat.set(Zlen / 4.2, 1); return t; })() }), ceilM = std("#ffffff", { map: ceilingCanvas() });
  const left = new THREE.Mesh(planar(new THREE.BoxGeometry(0.1, R.h, Zlen), (x, y, z) => [(z - Z0) / Zlen, y / R.h]), leftM); left.position.set(R.x0 - 0.05, R.h / 2, Zc); setShadows(left); g.add(left);
  const right = new THREE.Mesh(planar(new THREE.BoxGeometry(0.1, R.h, Zlen), (x, y, z) => [(z - Z0) / Zlen, y / R.h]), rightM); right.position.set(R.x1 + 0.05, R.h / 2, Zc); setShadows(right); g.add(right);
  const ceil = new THREE.Mesh(planar(new THREE.BoxGeometry(W + 0.2, 0.1, Zlen), (x, y, z) => [(x + (W + 0.2) / 2) / (W + 0.2), (z - Z0) / Zlen]), ceilM); ceil.position.set(0, R.h + 0.05, Zc); setShadows(ceil); g.add(ceil);
  // back wall: two piers, the head and the strip under the opening (.12 deep, so the opening has a reveal)
  const bb = new Bag(), pw = R.x1 - win.x1;
  const bwall = (w, h, d, x, y, z) => { const geo = planar(new THREE.BoxGeometry(w, h, d), (px, py, pz) => [(px + x + W / 2) / W, (py + y) / R.h]); bb.add(geo, "#ffffff", x, y, z); };
  for (const s of [-1, 1]) bwall(pw, R.h, 0.12, s * (win.x1 + pw / 2), R.h / 2, WZ - 0.06);
  bwall(win.x1 - win.x0, R.h - win.y1, 0.12, 0, (win.y1 + R.h) / 2, WZ - 0.06); bwall(win.x1 - win.x0, win.y0, 0.12, 0, win.y0 / 2, WZ - 0.06);
  bb.mesh(vcMat(backM.map, { roughness: 0.9 }), g);

  // ---------- timber (one mesh, vertex colours): baseboards, bookshelf carcass, frames, sofa legs, the picture's moulding
  const wood = new Bag(), BASE = "#5B3A2A", bh = 0.075, bt = 0.02;
  wood.add(wbox(W - 0.0, bh, bt, 0.5), BASE, 0, bh / 2, WZ + bt / 2);
  for (const s of [-1, 1]) wood.add(wbox(bt, bh, R.frontZ - WZ, 0.5), BASE, s * (R.x1 - bt / 2), bh / 2, (R.frontZ + WZ) / 2);
  const sh = R.shelf, shW = sh.z1 - sh.z0, shD = sh.x1 - sh.x0, shCx = (sh.x0 + sh.x1) / 2, shCz = (sh.z0 + sh.z1) / 2, CARC = "#6B4531", EDGE = "#8A5E42";
  for (const z of [sh.z0 + 0.015, sh.z1 - 0.015]) wood.add(wbox(shD, sh.h, 0.03, 0.5), CARC, shCx, sh.h / 2, z);
  wood.add(wbox(0.012, sh.h, shW, 0.5), CARC, sh.x1 - 0.006, sh.h / 2, shCz);   // back panel
  wood.add(wbox(shD, 0.07, shW, 0.5), CARC, shCx, 0.035, shCz); wood.add(wbox(shD + 0.02, 0.03, shW + 0.04, 0.5), EDGE, shCx - 0.01, sh.h + 0.015, shCz);
  const SHELF_Y = [0.07, 0.45, 0.83, 1.21, 1.59];   // the five boards; compartments are .35 clear
  for (const y of SHELF_Y) { wood.add(wbox(shD, 0.025, shW - 0.06, 0.5), CARC, shCx, y + 0.0125, shCz); wood.add(wbox(0.012, 0.03, shW - 0.06, 0.5), EDGE, sh.x0 + 0.006, y + 0.0135, shCz); }
  wood.add(wbox(shD, 0.03, shW - 0.06, 0.5), CARC, shCx, 1.97, shCz);
  // sofa legs (4, tapered would be nicer: a cylinder pair)
  const legG = new THREE.CylinderGeometry(0.03, 0.018, 0.14, 10);
  for (const [x, z] of [[-0.82, -0.34], [0.82, -0.34], [-0.82, 0.34], [0.82, 0.34]]) wood.add(legG, "#5B3A2A", R.sofa[0] + x, 0.07, R.sofa[1] + z);
  // picture frame (moulding .035 #3E2A20, gold fillet .006 #C9A24A), .46 x .58 on the right wall, a hook above
  const [px, py, pz] = R.picture, FW = 0.46, FH = 0.58, MO = "#3E2A20", GOLD = "#C9A24A";
  wood.add(wbox(0.03, 0.035, FW, 0.5), MO, px - 0.015, py + FH / 2 - 0.0175, pz); wood.add(wbox(0.03, 0.035, FW, 0.5), MO, px - 0.015, py - FH / 2 + 0.0175, pz);
  for (const s of [-1, 1]) wood.add(wbox(0.03, FH - 0.07, 0.035, 0.5), MO, px - 0.015, py, pz + s * (FW / 2 - 0.0175));
  wood.add(wbox(0.006, 0.006, FW - 0.07, 0.5), GOLD, px - 0.031, py + FH / 2 - 0.0365, pz); wood.add(wbox(0.006, 0.006, FW - 0.07, 0.5), GOLD, px - 0.031, py - FH / 2 + 0.0365, pz);
  for (const s of [-1, 1]) wood.add(wbox(0.006, FH - 0.073, 0.006, 0.5), GOLD, px - 0.031, py, pz + s * (FW / 2 - 0.0365));
  // tapestry dowel (left wall) .56 wide; the fringe cords are cloth
  const [tx, ty, tz] = R.tapestry, TW = 0.5, TH = 0.8;
  { const d = new THREE.CylinderGeometry(0.012, 0.012, TW + 0.1, 10); d.rotateX(Math.PI / 2); wood.add(d, "#5B3A2A", tx + 0.02, ty + TH / 2 + 0.012, tz); for (const s of [-1, 1]) wood.add(new THREE.SphereGeometry(0.018, 8, 6), "#C9A24A", tx + 0.02, ty + TH / 2 + 0.012, tz + s * (TW / 2 + 0.05)); }
  // a ceramic llama, brass bell, photo frame and the desk globe's stand on the shelves (see below)
  const timber = wood.mesh(vcMat(grainMap("wood"), { roughness: 0.62 }), g);

  // ceiling beams .14 x .18, u along the length
  const beamG = new THREE.BoxGeometry(0.14, 0.18, Zlen), bp = beamG.attributes.position, bn = beamG.attributes.normal, buv = beamG.attributes.uv;
  for (let i = 0; i < bp.count; i++) { const onX = Math.abs(bn.getX(i)) > 0.5; buv.setXY(i, bp.getZ(i) / 1.5, onX ? bp.getY(i) / 0.18 + 0.5 : bp.getX(i) / 0.14 + 0.5); }
  const beams = new Bag(); for (const x of R.beams) beams.add(beamG, "#ffffff", x, R.h - 0.09, Zc);
  beams.mesh(vcMat(beamCanvas(), { roughness: 0.7 }), g);

  // ---------- the sofa (one linen mesh, the red pillow on its own)
  const sofa = new Bag(), [sx0, sz0] = R.sofa, LIN = "#C8B091", SHD = "#9C8468", WELT = "#8A6F55";
  const put = (geo, col, x, y, z, rx = 0, ry = 0, rz = 0) => sofa.add(geo, col, sx0 + x, y, sz0 + z, rx, ry, rz);
  put(roundBox(2.0, 0.12, 0.86, 0.03, 12, 1, 5), SHD, 0, 0.2, 0);
  for (const s of [-1, 1]) put(roundBox(0.22, 0.48, 0.91, 0.085, 4, 8, 8), LIN, s * 0.91, 0.38, 0);
  put(roundBox(1.62, 0.54, 0.08, 0.03, 10, 3, 1), WELT, 0, 0.53, -0.415);
  for (const s of [-1, 1]) { put(roundBox(0.79, 0.42, 0.13, 0.055, 10, 6, 3), LIN, s * 0.4, 0.66, -0.31, -0.09); put(roundBox(0.795, 0.19, 0.71, 0.06, 14, 4, 10), LIN, s * 0.4025, 0.355, 0.1); }
  const pil = pillowGeo(0.39, 0.38, 0.13, 0.05, 0.03); put(pil, "#D9A441", 0.78, 0.64, -0.29, -0.12, 0, rad(19));
  sofa.mesh(vcMat(grainMap("wool"), { roughness: 1 }), g);
  const pillL = new THREE.Mesh(pillowGeo(0.39, 0.38, 0.13, 0.05, 0.03), std("#ffffff", { map: pillowCanvas(), roughness: 1 })); pillL.position.set(sx0 - 0.68, 0.64, sz0 - 0.26); pillL.rotation.set(-0.12, 0, rad(-16)); setShadows(pillL); g.add(pillL);

  // ---------- the manta over the right arm (cloth 1.30 m of weave, folded: flat .66, bend, hang), 12 x 8 segments, 3 baked folds
  {
    const NU = 12, NV = 8, cross = new THREE.CatmullRomCurve3([[-0.50, 0.466, 0], [-0.30, 0.466, 0], [-0.222, 0.50, 0], [-0.218, 0.632, 0], [-0.10, 0.640, 0], [0.0, 0.640, 0], [0.034, 0.60, 0], [0.042, 0.42, 0]].map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.2);
    const pos = [], uvs = [], idx = [], zStart = -2.24, flatL = 0.66, Rb = 0.06, zf = zStart + flatL, hang = 0.30;
    const along = (a) => {   // a 0..1 of the long side -> [z offset, dy]
      const L = flatL + (Rb * Math.PI) / 2 + hang, d = a * L;
      if (d <= flatL) return [zStart + d, 0, 0];
      if (d <= flatL + (Rb * Math.PI) / 2) { const th = (d - flatL) / Rb; return [zf + Rb * Math.sin(th), -Rb * (1 - Math.cos(th)), th]; }
      return [zf + Rb, -Rb - (d - flatL - (Rb * Math.PI) / 2), Math.PI / 2];
    };
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const a = i / NU, v = j / NV, cp = cross.getPoint(v), [z, dy, th] = along(a);
      const fold = 0.012 * Math.sin(a * 3 * Math.PI * 2 + v * 2.2) + 0.008 * Math.sin(v * 9 + a * 5);   // three baked folds
      let x = cp.x, y = cp.y;
      pos.push(x + fold * 0.6, y + dy + (th > 0.1 ? 0 : fold), z + (th > 0.1 ? fold * 0.8 : 0)); uvs.push(a, 1 - v);
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const manta = new THREE.Mesh(geo, std("#ffffff", { map: mantaCanvas(), roughness: 1, side: THREE.DoubleSide })); setShadows(manta); manta.userData.solid = false; g.add(manta);
    // fringe: 46 tassels .04 m on each short end, a thin cream quad each; the mesh's origin is the middle of its edge (wind swings it about that)
    for (const end of [0, 1]) {
      const fb = new Bag(), flat1 = new THREE.PlaneGeometry(0.0036, 0.04), n = 46, [ez, edy] = along(end), E = cross.getPoint(0.5), ey = E.y + edy;
      for (let k = 0; k < n; k++) {
        const v = (k + 0.5) / n, cp = cross.getPoint(v);
        if (end === 0) fb.add(flat1, "#F0E2C4", cp.x - E.x, cp.y - ey - 0.02, -0.004, 0, 0, 0); else fb.add(flat1, "#F0E2C4", cp.x - E.x, cp.y + edy - ey - 0.02, 0.003, 0, Math.PI / 2, 0);
      }
      const fm = fb.mesh(vcMat(null, { roughness: 1, side: THREE.DoubleSide }), g, false); fm.position.set(E.x, ey, ez); fm.userData.windDeg = 20; fm.userData.windPhase = end * 1.7; fm.userData.solid = false; fm.name = "manta-fringe-" + end;
    }
  }

  // ---------- rug and the two wall textiles
  const rugM = new THREE.Mesh(new THREE.CircleGeometry(1.03, 96), std("#ffffff", { map: rugCanvas(), roughness: 1 })); rugM.rotation.x = -Math.PI / 2; rugM.position.set(R.rug[0], 0.016, R.rug[1]); rugM.receiveShadow = true; rugM.userData.solid = false; g.add(rugM);
  const rugEdge = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 0.016, 96, 1, true), std("#3B2F2A", { roughness: 1 })); rugEdge.position.set(R.rug[0], 0.008, R.rug[1]); rugEdge.userData.solid = false; g.add(rugEdge);
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), std("#ffffff", { map: tapestryCanvas(), roughness: 1 })); tap.rotation.y = Math.PI / 2; tap.position.set(tx + 0.012, ty, tz); setShadows(tap, false, true); tap.userData.solid = false; g.add(tap);
  { const fb = new Bag(), q = new THREE.PlaneGeometry(0.006, 0.07); for (let k = 0; k < 12; k++) fb.add(q, k % 3 === 1 ? "#E0902F" : "#F0E2C4", tx + 0.014, ty - TH / 2 - 0.035, tz - TW / 2 + 0.02 + (k * (TW - 0.04)) / 11, 0, Math.PI / 2, 0); fb.mesh(vcMat(null, { roughness: 1, side: THREE.DoubleSide }), g, false).userData.solid = false; }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(FW - 0.07, FH - 0.07), std("#ffffff", { map: pictureCanvas(), roughness: 0.5 })); pic.rotation.y = -Math.PI / 2; pic.position.set(px - 0.012, py, pz); setShadows(pic, false, true); g.add(pic);

  // ---------- books: 64 spines from the atlas, in the five compartments (spine faces -x, the room)
  {
    const L = bookLayout(), atlas = spineAtlas(), bk = new THREE.BufferGeometry(), pos = [], nor = [], uvs = [], idx = []; let vi = 0, nbooks = 0;
    const r = rng(SEED + 21);
    L.forEach((sv, s) => {
      const y0 = SHELF_Y[s] + 0.025;   // the gaps (llama, bell, globe, frame) come from bookLayout
      sv.list.forEach((b) => {
        const [ux, uy, uw, uh] = b.px, lean = rad(b.lean), cz = b.z + b.w / 2;
        const x1 = sh.x0 + 0.012 + b.d * 0.5 * 0, xf = sh.x0 + 0.015;   // spine plane at the front of the shelf
        const hw = b.w / 2, hd = b.d, hh = b.h;
        // box corners in local (x depth into the shelf +x, y up, z along the shelf), leaned about its base corner about x
        const rot = (y, zz) => [y * Math.cos(lean) - zz * Math.sin(lean), y * Math.sin(lean) + zz * Math.cos(lean)];
        const P0 = (dx, y, zz) => { const [yy, z2] = rot(y, zz); return [xf + dx, y0 + yy, cz + z2]; };
        // faces: spine (-x), top (+y), cover sides (+-z), bottom skipped; atlas uv: spine window, other faces sample the spine's own colour
        const u0 = (ux + 1) / 2048, u1 = (ux + uw - 1) / 2048, vTop = 1 - (uy + 3) / 1280, vBot = 1 - (uy + uh * 0.5) / 1280, uc = (ux + uw * 0.5) / 2048, vc = 1 - (uy + uh * 0.72) / 1280;
        const face = (corners, nrm, uvq) => { corners.forEach((c, k) => { pos.push(...c); nor.push(...nrm); uvs.push(...uvq[k]); }); idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4; };
        const nS = [-1, 0, 0];
        face([P0(0, 0, -hw), P0(0, 0, hw), P0(0, hh, hw), P0(0, hh, -hw)], nS, [[u0, 1 - (uy + uh) / 1280], [u1, 1 - (uy + uh) / 1280], [u1, vTop], [u0, vTop]]);
        face([P0(0, hh, -hw), P0(0, hh, hw), P0(hd, hh, hw), P0(hd, hh, -hw)], [0, 1, 0], Array(4).fill([uc, vc]));
        face([P0(0, 0, hw), P0(hd, 0, hw), P0(hd, hh, hw), P0(0, hh, hw)], [0, 0, 1], Array(4).fill([uc, vc]));
        face([P0(hd, 0, -hw), P0(0, 0, -hw), P0(0, hh, -hw), P0(hd, hh, -hw)], [0, 0, -1], Array(4).fill([uc, vc]));
        nbooks++;
      });
    });
    bk.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); bk.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); bk.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); bk.setIndex(idx);
    const books = new THREE.Mesh(bk, std("#ffffff", { map: atlas, roughness: 0.7 })); setShadows(books); g.add(books); void r; g.userData.books = nbooks;
  }
  // ---------- bric-a-brac (one vertex-colour mesh): llama, brass bell, photo frame, flat stacks of 3-4 books, pots, the globe's stand
  const bric = new Bag(), CREAM = "#F0E2C4", BRASS = "#C9A24A";
  { // ceramic llama .11 tall on shelf 0
    const lx = sh.x0 + 0.1, lz = bookLayout()[0].gapZ, ly = SHELF_Y[0] + 0.025;
    const body = new THREE.SphereGeometry(1, 12, 8), b2 = (x, y, z, sx, sy, sz, c) => bric.add(body, c, lx + x, ly + y, lz + z, 0, 0, 0, sx, sy, sz);
    b2(0, 0.058, 0, 0.026, 0.026, 0.034, CREAM); b2(0, 0.088, 0.032, 0.012, 0.03, 0.012, CREAM); b2(0, 0.108, 0.04, 0.016, 0.012, 0.017, CREAM);
    b2(0.014, 0.121, 0.04, 0.004, 0.011, 0.004, CREAM); b2(-0.014, 0.121, 0.04, 0.004, 0.011, 0.004, CREAM);
    b2(0, 0.062, 0, 0.0285, 0.013, 0.036, "#B5352B");   // the red saddle cloth
    for (const [dx, dz] of [[-0.014, -0.022], [0.014, -0.022], [-0.014, 0.022], [0.014, 0.022]]) bric.add(new THREE.CylinderGeometry(0.005, 0.004, 0.04, 6), CREAM, lx + dx, ly + 0.02, lz + dz);
  }
  { // brass hand bell on shelf 1
    const bx = sh.x0 + 0.1, bz = bookLayout()[1].gapZ, by = SHELF_Y[1] + 0.025;
    bric.add(lathe([[0.003, 0.0], [0.034, 0.0], [0.03, 0.01], [0.022, 0.04], [0.012, 0.062], [0.006, 0.07], [0.003, 0.07]], 14), BRASS, bx, by, bz);
    bric.add(new THREE.CylinderGeometry(0.006, 0.008, 0.045, 8), "#3E2A20", bx, by + 0.088, bz); bric.add(new THREE.SphereGeometry(0.009, 8, 6), BRASS, bx, by + 0.068, bz);
  }
  { // photo frame .10 x .15 on shelf 4, leaning back a little
    const fx = sh.x0 + 0.1, fz = bookLayout()[4].gapZ, fy = SHELF_Y[4] + 0.025; const lean = -0.18;
    bric.add(wbox(0.012, 0.15, 0.10, 0.5), "#3E2A20", fx, fy + 0.075, fz, 0, 0, lean); bric.add(wbox(0.004, 0.126, 0.076, 0.5), "#C9B79A", fx - 0.0075, fy + 0.075 + 0.0012, fz, 0, 0, lean);
    bric.add(new THREE.SphereGeometry(0.02, 8, 6), "#7A5238", fx - 0.0095, fy + 0.085, fz, 0, 0, 0, 0.2, 1, 0.9); bric.add(new THREE.SphereGeometry(0.01, 8, 6), "#E3B58A", fx - 0.0095, fy + 0.108, fz);
    bric.add(wbox(0.05, 0.004, 0.02, 0.5), "#3E2A20", fx + 0.03, fy + 0.04, fz, 0, 0, 0.9);
  }
  { // 3 flat stacks of 3-4 books on shelves 2, 3, 4 (their ends); pots for the pothos and a vase
    const stacks = [[3, 0.88, "#8C2F2B"], [4, 0.84, "#2F6E7A"], [3, 0.85, "#E0A63C"]];
    stacks.forEach(([n, zEnd, c], k) => { const s = [2, 3, 4][k]; let y = SHELF_Y[s] + 0.025; for (let i = 0; i < n; i++) { const hh = 0.03 + 0.006 * ((i + k) % 3); bric.add(wbox(0.19 - 0.01 * i, hh, 0.14 - 0.006 * i, 0.5), [c, "#E6D7B5", "#33506B", "#7A8B4A"][i % 4], sh.x0 + 0.13 + 0.004 * i, y + hh / 2, sh.z1 - 0.1 - 0.012 * (i % 2), 0, rad(((i * 7 + k * 5) % 9) - 4), 0); y += hh; } });
    // globe stand (shelf 3 = index 2): a brass ring + foot; the globe itself is a textured sphere below
    const gx = sh.x0 + 0.13, gz = bookLayout()[2].gapZ, gy = SHELF_Y[2] + 0.025;
    bric.add(lathe([[0.001, 0.0], [0.045, 0.0], [0.045, 0.006], [0.016, 0.012], [0.012, 0.03], [0.008, 0.04]], 16), "#3E2A20", gx, gy, gz);
  }
  { // the pothos' pot on top of the bookshelf
    const tx0 = sh.x0 + 0.16, tz0 = shCz;
    bric.add(lathe([[0.001, 0.0], [0.05, 0.0], [0.07, 0.07], [0.074, 0.1], [0.066, 0.1], [0.002, 0.012]], 20), "#2F6E7A", tx0, sh.h + 0.03, tz0); bric.add(wbox(0.001, 0.001, 0.001, 1), "#2F6E7A", 0, 0, 0);
    bric.add(new THREE.CylinderGeometry(0.064, 0.064, 0.004, 16), "#3B2A20", tx0, sh.h + 0.03 + 0.092, tz0);
  }
  // pots of the three plants (the sill plants' pots and the floor plant's), vertex-coloured; bands and zigzags as thin patches
  const potBand = (cx, cy, cz, r0, r1, y0, y1, c) => bric.add(new THREE.CylinderGeometry(r1 + 0.0007, r0 + 0.0007, y1 - y0, 20, 1, true), c, cx, cy + (y0 + y1) / 2, cz);
  { // sill 1: terracotta pot r .085 -> .065 .14 tall, rim band, one white zigzag
    const [cx, cy, cz] = R.sill[0];
    bric.add(lathe([[0.001, 0.0], [0.062, 0.0], [0.074, 0.06], [0.083, 0.115], [0.085, 0.14], [0.079, 0.14], [0.002, 0.012]], 20), "#B8643C", cx, cy, cz);
    bric.add(lathe([[0.083, 0.115], [0.0875, 0.122], [0.0875, 0.14], [0.085, 0.14]], 20), "#9A4F30", cx, cy, cz);
    const zz = new Bag(); void zz;
    for (let i = 0; i < 9; i++) { const a = rad(-50 + i * 12.5) , up = i % 2; const rr = 0.0765; bric.add(new THREE.PlaneGeometry(0.01, 0.014), "#F5F0E6", cx + Math.sin(a) * rr * 1.0, cy + 0.075 + (up ? 0.011 : 0), cz + Math.cos(a) * rr, 0, a, 0); }
    bric.add(new THREE.CylinderGeometry(0.078, 0.078, 0.004, 16), "#3B2A20", cx, cy + 0.125, cz);
  }
  { // sill 2: glazed teal pot with a cream band; the succulent sits in it
    const [cx, cy, cz] = R.sill[1];
    bric.add(lathe([[0.001, 0.0], [0.05, 0.0], [0.064, 0.05], [0.07, 0.09], [0.066, 0.09], [0.002, 0.012]], 20), "#2F6E7A", cx, cy, cz);
    potBand(cx, cy, cz, 0.062, 0.067, 0.04, 0.06, CREAM); bric.add(new THREE.CylinderGeometry(0.066, 0.066, 0.004, 16), "#3B2A20", cx, cy + 0.085, cz);
  }
  { // floor plant: pot repainted terracotta (gravity's lathe), cream band, 9 red diamonds
    const [cx, , cz] = [R.plant[0], 0, R.plant[1]];
    bric.add(lathe([[0.001, 0.0], [0.12, 0.0], [0.13, 0.01], [0.16, 0.22], [0.18, 0.33], [0.19, 0.34], [0.175, 0.34], [0.002, 0.02]], 28), "#B8643C", cx, 0, cz);
    potBand(cx, 0, cz, 0.158, 0.168, 0.15, 0.24, CREAM); bric.add(new THREE.TorusGeometry(0.182, 0.008, 6, 32), "#9A4F30", cx, 0.337, cz, Math.PI / 2, 0, 0);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 0.1675; bric.add(new THREE.PlaneGeometry(0.036, 0.062), "#B5352B", cx + Math.sin(a) * rr, 0.195, cz + Math.cos(a) * rr, 0, a, 0.78 * 0); }
    bric.add(new THREE.CylinderGeometry(0.175, 0.175, 0.004, 24), "#4a3628", cx, 0.31, cz);
  }
  bric.mesh(vcMat(grainMap("plain"), { roughness: 0.55 }), g).userData.solid = false;
  // the desk globe on shelf 3: diameter .16, axis tilted 23 deg (the plant for the ending)
  {
    const [c, gg] = canvas(512, 256), r = rng(SEED + 23); const og = gg.createLinearGradient(0, 0, 0, 256); og.addColorStop(0, "#F2F0EE"); og.addColorStop(0.12, "#1E5A9A"); og.addColorStop(0.9, "#1E5A9A"); og.addColorStop(1, "#F2F0EE"); gg.fillStyle = og; gg.fillRect(0, 0, 512, 256);
    gg.fillStyle = "#4E7A3A"; for (const [x, y, w, h] of [[60, 70, 90, 70], [170, 120, 60, 90], [290, 60, 120, 60], [330, 130, 70, 60], [420, 160, 40, 30]]) { gg.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.28; gg.lineTo(x + Math.cos(a) * w * (0.6 + r() * 0.4), y + Math.sin(a) * h * (0.6 + r() * 0.4)); } gg.fill(); }
    gg.fillStyle = "#B99A5E"; for (const [x, y] of [[200, 90], [340, 80]]) gg.fillRect(x, y, 30, 18);
    const glb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 16), std("#ffffff", { map: canvasMap(c), roughness: 0.5 })); setShadows(glb); glb.userData.solid = false;
    const gp = new THREE.Group(); gp.position.set(sh.x0 + 0.13, SHELF_Y[2] + 0.025 + 0.12, bookLayout()[2].gapZ); gp.rotation.z = rad(23); gp.add(glb); g.add(gp); g.userData.globe = glb;
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.19, 6), std("#C9A24A", { metalness: 0.4, roughness: 0.4 })); gp.add(axis);
  }

  // ---------- plants: leaf groups (wind swings them about their own origin), one vertex-coloured mesh each
  const leafMat = (o = {}) => vcMat(null, { roughness: 0.55, ...o });
  { // sill 1: rubber plant, 9 leaves .16-.24 m
    const [cx, cy, cz] = R.sill[0], rr = rng(SEED + 31), pl = new THREE.Group(); pl.position.set(cx, cy + 0.13, cz); pl.userData.windDeg = 12; pl.userData.windPhase = 0.4; g.add(pl);
    const lb = new Bag(), stem = new THREE.CylinderGeometry(0.004, 0.006, 0.3, 6);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39996 + rr() * 0.3, h = 0.25 + i * 0.07 + rr() * 0.05, tilt = 0.5 + rr() * 0.4, len = 0.16 + rr() * 0.08, wid = len * (0.55 + rr() * 0.1);
      lb.add(stem, "#5b6b3a", Math.cos(a) * 0.012, h / 2 - 0.02, Math.sin(a) * 0.012, 0, 0, 0, 1, h / 0.3, 1);
      lb.addColoured(leafGeo(len, wid, 0.15, "#3F6B3A", "#6E9A4A", "#2F5A2D", "#2E4F2E"), Math.cos(a) * 0.02, h, Math.sin(a) * 0.02, -tilt, a + Math.PI / 2 + Math.PI, 0);
    }
    lb.mesh(leafMat({ side: THREE.FrontSide }), pl).userData.solid = false;
  }
  { // sill 2: a succulent rosette of 12 leaves r .07
    const [cx, cy, cz] = R.sill[1], pl = new THREE.Group(); pl.position.set(cx, cy + 0.085, cz); pl.userData.windDeg = 4; pl.userData.windPhase = 1.1; g.add(pl);
    const lb = new Bag(), rr = rng(SEED + 33);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.2832 + ring * 0.5 + rr() * 0.2, up = ring ? 0.35 : 0.9; lb.addColoured(leafGeo(0.07 - ring * 0.012, 0.03, 0.2, ring ? "#7FA487" : "#6E9677", "#A9C8A6", "#7FA487", "#5C8368", 3, 4), Math.cos(a) * 0.012, 0.01 + ring * 0.012, Math.sin(a) * 0.012, -(1.35 - up * 0.9), a + Math.PI, 0); }
    lb.mesh(leafMat(), pl).userData.solid = false;
  }
  { // floor plant: 11 stems, big leaves (gravity's colours)
    const pl = new THREE.Group(); pl.position.set(R.plant[0], 0.32, R.plant[1]); pl.userData.windDeg = 5; pl.userData.windPhase = 2.0; g.add(pl);
    const lb = new Bag(), rr = rng(SEED + 35), stemG = new THREE.CylinderGeometry(0.005, 0.008, 1, 6);
    for (let i = 0; i < 11; i++) {
      const a = i * 2.39996 + rr() * 0.3, ro = i === 0 ? 0.02 : 0.07 + rr() * 0.15, th = i === 0 ? 0.81 : 0.42 + rr() * 0.3 - ro * 0.8, len = 0.30 + rr() * 0.07, wid = 0.17 + rr() * 0.03;
      const lean = Math.atan2(ro, th); lb.add(stemG, "#5b6b3a", Math.cos(a) * ro * 0.5, th / 2, Math.sin(a) * ro * 0.5, 0, 0, 0, 1, th, 1);
      const dirv = i === 0 ? new THREE.Vector3(0.1, 1, 0.05).normalize() : new THREE.Vector3(Math.cos(a) * 0.75, 0.5 + rr() * 0.25, Math.sin(a) * 0.75).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirv), e = new THREE.Euler().setFromQuaternion(q, "YXZ"); void lean;
      lb.addColoured(leafGeo(len, wid, 0.3 + rr() * 0.25, i % 2 ? "#81823C" : "#476039", i % 2 ? "#A8A653" : "#6E8C52", "#33472A", "#2E4020"), Math.cos(a) * ro, th, Math.sin(a) * ro, e.x, e.y, e.z);
    }
    lb.mesh(leafMat(), pl).userData.solid = false;
  }
  { // shelf-top pothos: 5 vines .5-.9 m over the shelf front, 38 heart leaves, 30 % splashed
    const rr = rng(SEED + 37), lb = new Bag(), vb = new Bag(), sx = sh.x0 + 0.04, startY = sh.h + 0.04, base = new THREE.Vector3(sh.x0 + 0.16, startY + 0.06, shCz);
    const heart = (() => { const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.7, -0.1, -0.5, 0.55, 0, 0.3); s.bezierCurveTo(0.5, 0.55, 0.7, -0.1, 0, -0.5); return new THREE.ShapeGeometry(s, 6); })();
    const heartBack = heart.clone(); heartBack.scale(1, 1, -1);
    let leaves = 0; const lens = [0.9, 0.7, 0.55, 0.8, 0.5], per = [8, 8, 7, 8, 7];
    for (let v = 0; v < 5; v++) {
      const zz = sh.z0 + 0.12 + v * 0.17 + (rr() - 0.5) * 0.04, L = lens[v], pts = [base.clone().setZ(shCz + (zz - shCz) * 0.4)];
      pts.push(new THREE.Vector3(sh.x0 + 0.06, startY + 0.1, zz), new THREE.Vector3(sx - 0.03, startY - 0.02, zz + (rr() - 0.5) * 0.05), new THREE.Vector3(sx - 0.05, startY - L * 0.45, zz + (rr() - 0.5) * 0.1), new THREE.Vector3(sx - 0.03 - rr() * 0.04, startY - L * 0.95, zz + (rr() - 0.5) * 0.12));
      const curve = new THREE.CatmullRomCurve3(pts); vb.add(new THREE.TubeGeometry(curve, 16, 0.0035, 5), "#4E6B33");
      for (let k = 0; k < per[v] && leaves < 38; k++, leaves++) {
        const u = (k + 0.7) / per[v], p = curve.getPoint(Math.min(0.98, u)), sz = 0.05 + rr() * 0.03, splash = rr() < 0.3, ang = rr() * 6.28;
        lb.add(heart, splash ? "#A9C46A" : "#4E7F3F", p.x - 0.012, p.y, p.z, 0.15, -Math.PI / 2 + (rr() - 0.5) * 0.9, (rr() - 0.5) * 0.6, sz, sz, sz); lb.add(heartBack, "#2E4F2E", p.x - 0.0125, p.y, p.z, 0.15, -Math.PI / 2 + (rr() - 0.5) * 0.9, 0, sz, sz, sz); void ang;
        if (splash) lb.add(heart, "#4E7F3F", p.x - 0.0135, p.y - sz * 0.05, p.z, 0.15, -Math.PI / 2, 0, sz * 0.5, sz * 0.5, sz * 0.5);
      }
    }
    vb.mesh(vcMat(null, { roughness: 0.7 }), g, false).userData.solid = false; lb.mesh(vcMat(null, { roughness: 0.6, side: THREE.DoubleSide }), g, false).userData.solid = false;
  }
  applyRoomLight(g.userData.live, 0, false);   // t = 0 until a sroomlight prop drives it
  return g;
}
