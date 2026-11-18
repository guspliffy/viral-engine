// "scorewall": Spud's hall wall of "I could see everyone's happiness score" (Happiness 03, panel 13, painting plates/painted/SF.webp).
// REAL 3D geometry with hand-painted canvas textures (the painting is only the look target): a small flat's hall in cool morning light:
// a blue-grey plaster wall (cracks, chips, trowel marks, a faint seam), a dark panelled door at the left with brass knob and casing, a grey
// conduit pipe, a wooden coat-hook board with a plaid scarf and a rust wool coat on iron hooks, a bracket shelf with a trailing pothos,
// a framed picture of a town at the right above a little console table with books, a potted plant and a wicker basket, a dark skirting board
// and floorboards. THE WALL'S MIDDLE IS EMPTY for the 3D `wallmirror` prop (props-score-items.js, hung at WALL.mirror).
//
// COORDINATES (metres, y up). The wall is the plane z 0 and faces +z; you stand in the hall in front of it (z > 0) looking toward -z.
//   wall plane      z 0, x -3.4 .. 3.6, y 0 .. 3.4 (a side wall each end, a ceiling at 3.4, so a pan never shows the void)
//   floor           y 0, z 0 .. 4.6, boards 0.11 wide running along x (SOLID, a potato stands on y 0)
//   skirting        0.13 high, 0.03 proud, along the whole wall
//   door            leaf x -2.75 .. -1.75 (1.0 wide), 2.15 tall, at z 0.03 .. 0.075; casing to x -1.64; knob at x -1.84, y 1.0
//   conduit pipe    x -1.44, z 0.02 (r 0.014), floor to ceiling
//   hook board      x -1.55 .. -0.95, y 2.0 .. 2.14, z 0 .. 0.03; hooks at x -1.42 (the plaid scarf, hangs to y 1.0), -1.25, -1.08 (the rust coat, hangs to y 1.15)
//   shelf + plant   x -1.0 .. -0.28, board top y 2.6 (z 0 .. 0.2); pothos in a pot at x -0.65, trailing to y 2.0
//   empty middle    x -0.85 .. 1.4, y 0.2 .. 2.2: nothing on it. The mirror hangs at WALL.mirror = { x 0.3, y 1.1, z 0 }: its frame spans y 0.7 .. 1.5 (0.55 x 0.80),
//                   its glass centre is about y 1.08, a potato's eye height (0.95) plus the lift to the tape strip; Spud stands at WALL.stand.mirror.
//   picture         x 1.9 .. 2.55, y 1.95 .. 2.75 (frame 0.65 x 0.8, z 0 .. 0.04)
//   console table   x 1.5 .. 2.55, top y 0.62, z 0 .. 0.4 (SOLID); books on it at x 1.7; a potted plant at x 2.25; a wicker basket on its lower shelf (y 0.2)
// WALL (exported) has the numbers: the mirror's place, the stand spots, the painting's camera camA.
//
// spec (every key optional):
//   seed 5        the painted textures and the layout of leaves
//   coats true    the scarf and the coat on the hooks (false: bare hooks)
//   plants true   the shelf plant and the table plant
// Light: leave the set's default cool daylight (no "light" key: the key from the left, looks.js), "key": [-3, 4, 3] gives long soft shadows of the hooks, shelf and frame on the plaster.
// Deterministic: util.js rng only. Triangles: about 25k. Solid for the checks: wall, floor, skirting, door, table.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";
import { canvas } from "./set-porch.js";

// ================================================================================================================ helpers
// (copied from set-score-street.js, the approved quality bar: canvas textures, merged quad buffers, leaf-card foliage)
const DEG = Math.PI / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const hash2 = (i, j, s) => { let h = Math.imul(i * 374761393 + j * 668265263 + s * 1274126177, 1103515245) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, s = 1) {
  const i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
  const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x, y, s = 1) => 0.55 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.1 + 3, y * 2.1 + 7, s + 1) + 0.15 * vnoise(x * 4.3 + 9, y * 4.3 + 1, s + 2);

function ctex(c, rx = 1, ry = 1, repeat = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry); return t;
}
const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }); m.userData.noOutline = true; return m; };
const lam = (color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };

// ================================================================================================================ painters
// All tile exactly (rows and blocks are scaled to fit the canvas), so a repeat only shows as a repeat of hand-laid stone.
function fitRun(rnd, total, lo, hi) {   // random lengths between lo and hi that add up to exactly `total`
  const a = []; let s = 0;
  while (s < total - hi) { const v = lo + rnd() * (hi - lo); a.push(v); s += v; }
  a.push(total - s); if (a[a.length - 1] < lo * 0.6 && a.length > 1) { const l = a.pop(); a[a.length - 1] += l; }
  return a;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); const o = { r: Math.round(c.r ** (1 / 2.2) * 255 * k), g: Math.round(c.g ** (1 / 2.2) * 255 * k), b: Math.round(c.b ** (1 / 2.2) * 255 * k) }; return `rgb(${Math.min(255, o.r)},${Math.min(255, o.g)},${Math.min(255, o.b)})`; };

// dressed ashlar in warm gold-grey sandstone: ~8 courses to a door height (0.22-0.30 m), blocks 0.3-0.95 m long, every joint
// staggered against the course below, each block its own tone (gold, ochre, brown, grey), softly rough edges, mottled and
// pitted, a soft lit top and shaded foot, a thin mortar joint. M metres square (the facades use 3.2).
function stoneCanvas(rnd, S = 2048, mortar = "#6b5a42", pal = null, M = 4.8) {
  const [c, g] = canvas(S, S), ppm = S / M, m = Math.max(1.5, S / 700), j = (a) => (rnd() - 0.5) * a;
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  pal = pal || ["#c9aa72", "#bf9d66", "#d0b583", "#b79c78", "#c4ae88", "#a8957c", "#cdb07a", "#b4966a", "#c7a47c", "#aa9a80", "#d4bb8c", "#b8a07c", "#bb9a60"];
  let y = 0, prev = [];
  for (const rh of fitRun(rnd, S, 0.22 * ppm, 0.3 * ppm)) {
    let run = null;
    for (let t = 0; t < 10; t++) {   // stagger: no joint within 0.12 m of one in the course below
      const r = fitRun(rnd, S, 0.3 * ppm, 0.95 * ppm); let x = 0, ok = true;
      for (const w of r) { x += w; for (const q of prev) { const dd = Math.abs(x - q); if (Math.min(dd, S - dd) < 0.12 * ppm) ok = false; } }
      run = r; if (ok) break;
    }
    let x = 0; prev = [];
    for (const w of run) {
      prev.push(x + w);
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.88 + rnd() * 0.22, x0 = x + m, y0 = y + m, bw = w - 2 * m, bh = rh - 2 * m;
      const gr = g.createLinearGradient(0, y0, 0, y0 + bh); gr.addColorStop(0, shade(base, k * 1.08)); gr.addColorStop(1, shade(base, k * 0.9));
      g.fillStyle = gr; g.beginPath();   // a softly irregular block outline
      g.moveTo(x0 + j(m), y0 + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + j(m * 0.6)); g.lineTo(x0 + bw + j(m), y0 + j(m));
      g.lineTo(x0 + bw + j(m), y0 + bh * 0.5 + j(m)); g.lineTo(x0 + bw + j(m), y0 + bh + j(m)); g.lineTo(x0 + bw * 0.5 + j(m), y0 + bh + j(m * 0.6));
      g.lineTo(x0 + j(m), y0 + bh + j(m)); g.lineTo(x0 + j(m), y0 + bh * 0.5 + j(m)); g.closePath(); g.fill();
      g.save(); g.beginPath(); g.rect(x0, y0, bw, bh); g.clip();
      for (let i = 0; i < 9; i++) {   // soft mottling: ochre, brown, grey, pale
        const tc = [[150, 112, 62], [120, 98, 76], [150, 144, 132], [255, 240, 200], [196, 150, 84]][Math.floor(rnd() * 5)], cx = x0 + rnd() * bw, cy = y0 + rnd() * bh, rr = (0.12 + rnd() * 0.3) * Math.min(bw, bh * 2.2);
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr), al = 0.1 + rnd() * 0.14; rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${al})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
      }
      for (let i = 0; i < Math.round(bw * bh / 380); i++) { g.fillStyle = rnd() < 0.7 ? `rgba(76,58,38,${0.14 + rnd() * 0.22})` : `rgba(255,246,220,${0.12 + rnd() * 0.16})`; g.fillRect(x0 + rnd() * bw, y0 + rnd() * bh, 1 + rnd() * 2.2, 1 + rnd() * 2.2); }   // pitting and grain
      if (rnd() < 0.35) { g.strokeStyle = `rgba(74,58,40,${0.14 + rnd() * 0.1})`; g.lineWidth = 1.2; const yy = y0 + rnd() * bh, xx = x0 + rnd() * bw * 0.5; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + bw * (0.15 + rnd() * 0.3), yy + j(5)); g.stroke(); }   // a chisel mark
      const lt = g.createLinearGradient(0, y0, 0, y0 + Math.min(bh * 0.35, 9)); lt.addColorStop(0, "rgba(255,246,218,0.42)"); lt.addColorStop(1, "rgba(255,246,218,0)"); g.fillStyle = lt; g.fillRect(x0, y0, bw, Math.min(bh * 0.35, 9));   // soft lit top
      const bt = g.createLinearGradient(0, y0 + bh, 0, y0 + bh - Math.min(bh * 0.3, 9)); bt.addColorStop(0, "rgba(52,38,24,0.4)"); bt.addColorStop(1, "rgba(52,38,24,0)"); g.fillStyle = bt; g.fillRect(x0, y0 + bh - Math.min(bh * 0.3, 9), bw, Math.min(bh * 0.3, 9));   // shaded foot
      g.fillStyle = "rgba(255,244,214,0.16)"; g.fillRect(x0, y0, 2, bh); g.fillStyle = "rgba(52,38,24,0.2)"; g.fillRect(x0 + bw - 2, y0, 2, bh);
      g.restore();
      x += w;
    }
    y += rh;
  }
  return c;
}

function grassCanvas(rnd, S = 1024) {
  const [c, g] = canvas(S, S);
  g.fillStyle = "#88a84a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const cx = rnd() * S, cy = rnd() * S, r = 40 + rnd() ** 2 * 170, col = ["#6f9a3e", "#a6b84c", "#c2b04a", "#5d8a3a"][i % 4];
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, col + "70"); gr.addColorStop(1, col + "00"); g.fillStyle = gr; g.fillRect(cx + ox - r, cy + oy - r, 2 * r, 2 * r); }
  }
  for (let i = 0; i < 12000; i++) {
    const x = rnd() * S, y = rnd() * S, l = 6 + rnd() * 12, a = -Math.PI / 2 + (rnd() - 0.5) * 0.9, u = rnd();
    g.strokeStyle = u < 0.4 ? "rgba(52,100,44,0.4)" : u < 0.8 ? "rgba(214,232,130,0.38)" : "rgba(222,176,70,0.3)"; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}

// a five-lobed maple leaf: near-white with soft darker veins, cut out by its alpha (tinted by vertex colour)
function mapleCanvas() {
  const S = 128, [c, g] = canvas(S, S), cx = 64, cy = 66;
  const gr = g.createLinearGradient(20, 20, 108, 108); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#cfcfcf");
  g.fillStyle = gr; g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) {
    const t = a - Math.PI / 2, lobe = Math.abs(Math.cos(2.5 * t)) ** 0.75, tooth = 1 + 0.07 * Math.sin(a * 22), r = 55 * (0.34 + 0.66 * lobe) * tooth;
    const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * 0.98; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fill();
  g.strokeStyle = "rgba(90,90,90,0.5)"; g.lineWidth = 2.2;
  for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + k * (Math.PI * 2 / 5); g.beginPath(); g.moveTo(cx, cy + 10); g.lineTo(cx + Math.cos(t) * 42, cy + Math.sin(t) * 42); g.stroke(); }
  g.strokeStyle = "rgba(90,90,90,0.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx, 126); g.stroke();
  return c;
}

// ================================================================================================================ geometry builders
// A growing buffer of quads / boxes with position, normal, uv and vertex colour: one mesh per material.
function Buf() { return { p: [], n: [], uv: [], c: [], i: [] }; }
function bufMesh(B, mat, cast = true, recv = true) {
  if (!B.p.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(B.c, 3)); g.setIndex(B.i);
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = recv; return m;
}
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _n = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
const WHITE = new THREE.Color(1, 1, 1);
// a box centred at (x,y,z), size w,h,d, turned ry about y then rz about z; uv = world metres / uvK on each face
function addBox(B, x, y, z, w, h, d, col = WHITE, ry = 0, rz = 0, uvK = 1.2) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, rz, "YXZ")), _one);
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const faces = [   // normal, then 4 corners (ccw seen from outside), uv axes
    [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], 2, 1], [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], 2, 1],
    [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], 0, 2], [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], 0, 2],
    [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], 0, 1], [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], 0, 1],
  ];
  for (const [nm, cs, ua, va] of faces) {
    const b = B.p.length / 3; _n.set(...nm).transformDirection(_m);
    for (const cc of cs) { _v.set(...cc).applyMatrix4(_m); B.p.push(_v.x, _v.y, _v.z); B.n.push(_n.x, _n.y, _n.z); B.uv.push((cc[ua] + (ua === 0 ? x : ua === 2 ? z : y)) / uvK, (cc[va] + (va === 1 ? y : va === 2 ? z : x)) / uvK); B.c.push(col.r, col.g, col.b); }
    B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
}
// a flat card: centre, two edge axes (unit), size, a normal (for shading), colour, uv rect
const UVFULL = [0, 0, 1, 1];
function addCard(B, cx, cy, cz, t1, t2, w, h, nrm, col, uv = UVFULL) {
  const b = B.p.length / 3, hw = w / 2, hh = h / 2;
  const c4 = [[-1, -1, uv[0], uv[1]], [1, -1, uv[2], uv[1]], [1, 1, uv[2], uv[3]], [-1, 1, uv[0], uv[3]]];
  for (const [a, d, u, v] of c4) { B.p.push(cx + t1.x * a * hw + t2.x * d * hh, cy + t1.y * a * hw + t2.y * d * hh, cz + t1.z * a * hw + t2.z * d * hh); B.n.push(nrm.x, nrm.y, nrm.z); B.uv.push(u, v); B.c.push(col.r, col.g, col.b); }
  B.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
// leaf card frame: a normal and a random spin about it
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _alt = new THREE.Vector3(1, 0, 0);
function frameOf(n, spin) {
  _t1.crossVectors(Math.abs(n.y) > 0.95 ? _alt : _up, n).normalize(); _t2.crossVectors(n, _t1).normalize();
  const c = Math.cos(spin), s = Math.sin(spin), a = _t1.clone().multiplyScalar(c).addScaledVector(_t2, s), b = _t2.clone().multiplyScalar(c).addScaledVector(_t1, -s);
  return [a, b];
}
const tint = (hex, rnd, dh = 0.012, ds = 0.06, dl = 0.07) => new THREE.Color(hex).offsetHSL((rnd() - 0.5) * dh * 2, (rnd() - 0.5) * ds * 2, (rnd() - 0.5) * dl * 2);

// a ribbon along the street's centreline: s samples x lateral offsets q, y from yFn, vertex colour from colFn
function ribbon(F, ss, qs, yFn, uvK, colFn) {
  const B = Buf(), nq = qs.length;
  ss.forEach((s, si) => {
    const f = F.at(s);
    qs.forEach((q) => {
      B.p.push(f.x + q * f.nx, yFn(s, q), f.z + q * f.nz); B.n.push(0, 1, 0); B.uv.push(s / uvK, q / uvK);
      const k = colFn ? colFn(s, q) : 1; B.c.push(k, k, k);
    });
    if (si) for (let j = 0; j < nq - 1; j++) { const a = (si - 1) * nq + j, b = a + 1, c = si * nq + j, d = c + 1; B.i.push(a, b, c, b, d, c); }
  });
  return B;
}
function mergedGeo(parts, mat, cast = true) {
  if (!parts.length) return null;
  const geo = mergeGeometries(parts.map(([g, M]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(M); for (const k of Object.keys(q.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") q.deleteAttribute(k); return q; }));
  const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = true; return o;
}
const M4 = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const Yaxis = new THREE.Vector3(0, 1, 0);
function segMat(a, b, r0, r1) {   // [geometry, matrix] of a tapered cylinder from a to b
  const d = b.clone().sub(a), L = d.length();
  return [new THREE.CylinderGeometry(r1, r0, L, 7), new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Yaxis, d.normalize()), new THREE.Vector3(1, 1, 1))];
}

// weathered grey-brown timber, grain along the canvas's x (vert: turned so the grain runs up)
function woodCanvas(rnd, vert) {
  const S = 512, [c0, g0] = canvas(S, S);
  const gr = g0.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#9a8670"); gr.addColorStop(0.5, "#867260"); gr.addColorStop(1, "#6e5c4e"); g0.fillStyle = gr; g0.fillRect(0, 0, S, S);
  for (let i = 0; i < 14; i++) { g0.fillStyle = i % 2 ? "rgba(190,170,140,0.14)" : "rgba(60,46,38,0.16)"; g0.beginPath(); g0.ellipse(rnd() * S, rnd() * S, 60 + rnd() * 200, 6 + rnd() * 26, 0, 0, 7); g0.fill(); }
  for (let i = 0; i < 70; i++) { const y0 = rnd() * S, len = S * (0.3 + rnd() * 0.7), x0 = rnd() * S * 0.6, amp = 1 + rnd() * 3, fr = 0.01 + rnd() * 0.02, ph = rnd() * 6; g0.strokeStyle = i % 4 ? `rgba(54,42,34,${0.14 + rnd() * 0.3})` : `rgba(214,198,172,${0.1 + rnd() * 0.14})`; g0.lineWidth = 0.8 + rnd() * 1.8; g0.beginPath(); for (let k = 0; k <= len; k += 12) { const px = x0 + k, py = y0 + amp * Math.sin(px * fr + ph); k ? g0.lineTo(px, py) : g0.moveTo(px, py); } g0.stroke(); }
  for (let i = 0; i < 3; i++) { const kx = rnd() * S, ky = rnd() * S; for (let r = 3; r < 15; r += 3) { g0.strokeStyle = `rgba(48,36,30,${0.5 - r * 0.025})`; g0.lineWidth = 1.4; g0.beginPath(); g0.ellipse(kx, ky, r * 1.6, r, 0, 0, 7); g0.stroke(); } }
  for (let i = 0; i < 2; i++) { g0.strokeStyle = "rgba(40,30,26,0.55)"; g0.lineWidth = 2.2; g0.beginPath(); let x = rnd() * S, y = rnd() * S; g0.moveTo(x, y); g0.lineTo(x + 120 + rnd() * 140, y + (rnd() - 0.5) * 10); g0.stroke(); }
  for (let i = 0; i < 60; i++) { g0.fillStyle = `rgba(150,160,120,${0.2 + rnd() * 0.2})`; g0.fillRect(rnd() * S, rnd() * S, 3 + rnd() * 8, 2); }   // lichen flecks
  if (!vert) return c0;
  const [c1, g1] = canvas(S, S); g1.translate(S, 0); g1.rotate(Math.PI / 2); g1.drawImage(c0, 0, 0); return c1;
}

// ================================================================================================================ painters
// the plaster: dusty periwinkle blue-grey, broad cool and warm mottling, trowel arcs, hairline cracks, chips down to pale plaster, damp low down, a faint seam
function plasterWallCanvas(rnd, W = 2048, H = 1024) {
  const [c, g] = canvas(W, H), ppm = W / 7.0;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#74829f"); gr.addColorStop(0.5, "#8290ab"); gr.addColorStop(1, "#8190a8"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const cx = rnd() * W, cy = rnd() * H, rr = 60 + rnd() * 240, tc = [[110, 122, 160], [150, 160, 190], [124, 118, 150], [170, 174, 192], [96, 112, 146]][i % 5], rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${0.12 + rnd() * 0.14})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) { const cx = rnd() * W, cy = rnd() * H, r = 50 + rnd() * 150, a0 = rnd() * 6.28; g.strokeStyle = rnd() < 0.5 ? `rgba(220,226,244,${0.03 + rnd() * 0.04})` : `rgba(60,70,110,${0.03 + rnd() * 0.04})`; g.lineWidth = 8 + rnd() * 18; g.beginPath(); g.arc(cx, cy, r, a0, a0 + 0.8 + rnd() * 1.2); g.stroke(); }   // trowel swirls
  for (let i = 0; i < 16000; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(240,244,255,${0.05 + rnd() * 0.1})` : `rgba(50,60,110,${0.05 + rnd() * 0.1})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }   // grain
  const crack = (x, y, len, ang, w) => { g.strokeStyle = "rgba(40,48,86,0.8)"; g.lineWidth = w * 1.5; g.beginPath(); g.moveTo(x, y); let px = x, py = y; for (let k = 0; k < len / 14; k++) { ang += (rnd() - 0.5) * 0.7; px += Math.cos(ang) * 14; py += Math.sin(ang) * 14; g.lineTo(px, py); if (rnd() < 0.09) crack(px, py, len * 0.3, ang + (rnd() - 0.5) * 1.6, w * 0.6); } g.stroke(); g.strokeStyle = "rgba(220,226,250,0.3)"; g.lineWidth = 1; g.stroke(); };
  crack(W * 0.43, 0, 330, 1.7, 2.4); crack(W * 0.77, H * 0.06, 260, 1.3, 2.2); crack(W * 0.62, H * 0.5, 210, 2.2, 2); crack(W * 0.55, H * 0.78, 190, 1.2, 1.8); crack(W * 0.3, H * 0.4, 120, 0.4, 1.6);
  for (let i = 0; i < 9; i++) { const x = rnd() * W, y = H * (0.2 + rnd() * 0.7), s = 5 + rnd() * 9; g.fillStyle = "#b8b4b0"; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; g.lineTo(x + Math.cos(a) * s * (0.6 + rnd() * 0.7), y + Math.sin(a) * s * (0.6 + rnd() * 0.7)); } g.closePath(); g.fill(); g.strokeStyle = "rgba(60,70,120,0.6)"; g.lineWidth = 1.4; g.stroke(); }   // chips
  const dg = g.createLinearGradient(0, H * 0.86, 0, H); dg.addColorStop(0, "rgba(70,70,120,0)"); dg.addColorStop(1, "rgba(60,60,110,0.3)"); g.fillStyle = dg; g.fillRect(0, H * 0.86, W, H * 0.14);
  const sx = (-0.85 + 3.4) * ppm; g.fillStyle = "rgba(255,255,255,0.1)"; g.fillRect(sx, 0, 2, H); g.fillStyle = "rgba(40,50,110,0.22)"; g.fillRect(sx + 2, 0, 3, H);   // the seam
  return c;
}
// floorboards: 0.11 m rows running along x, butt joints staggered every 0.7-1.5 m, red-brown wood with grain, a dark joint, a soft sheen. 3.5 m square.
function floorCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), ppm = S / 3.5, rowH = 0.11 * ppm, rows = Math.round(S / rowH), rh = S / rows;
  g.fillStyle = "#2a1812"; g.fillRect(0, 0, S, S);
  const pal = ["#7a4a36", "#6e4232", "#84543a", "#5e382c", "#7e4c38", "#6a4030", "#8a5a40"];
  for (let r = 0; r < rows; r++) {
    for (const w of fitRun(rnd, S, 0.7 * ppm, 1.5 * ppm)) {
      const x = (c._x = (c._x || 0)), y = r * rh, base = pal[Math.floor(rnd() * pal.length)], k = 0.9 + rnd() * 0.2;
      const gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, shade(base, k * 1.08)); gr.addColorStop(1, shade(base, k * 0.92)); g.fillStyle = gr; g.fillRect(x + 2, y + 1.5, w - 4, rh - 3);
      for (let i = 0; i < 9; i++) { g.strokeStyle = i % 3 ? `rgba(48,26,20,${0.14 + rnd() * 0.2})` : `rgba(210,150,110,${0.1 + rnd() * 0.14})`; g.lineWidth = 0.8 + rnd() * 1.2; const yy = y + 4 + rnd() * (rh - 8), a = (rnd() - 0.5) * 3; g.beginPath(); g.moveTo(x + 2, yy); g.bezierCurveTo(x + w * 0.3, yy + a, x + w * 0.6, yy - a, x + w - 2, yy + (rnd() - 0.5) * 2); g.stroke(); }
      if (rnd() < 0.25) { const kx = x + w * (0.2 + rnd() * 0.6), ky = y + rh / 2; for (let q = 3; q < 10; q += 2.5) { g.strokeStyle = `rgba(40,20,16,${0.4 - q * 0.03})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(kx, ky, q * 1.7, q * 0.8, 0, 0, 7); g.stroke(); } }
      g.fillStyle = "rgba(255,226,196,0.22)"; g.fillRect(x + 2, y + 1.5, w - 4, 2);
      c._x = x + w;
    }
    c._x = 0;
  }
  const sh = g.createLinearGradient(0, 0, S, S * 0.2); sh.addColorStop(0.3, "rgba(255,240,220,0)"); sh.addColorStop(0.5, "rgba(255,240,220,0.1)"); sh.addColorStop(0.7, "rgba(255,240,220,0)"); g.fillStyle = sh; g.fillRect(0, 0, S, S);
  return c;
}
// the door: dark brown panelled leaf, painted grain
function doorCanvas(rnd) {
  const [c, g] = canvas(512, 1024);
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#4a2c22"); gr.addColorStop(0.5, "#56342a"); gr.addColorStop(1, "#442820"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 80; i++) { const x = rnd() * 512, y0 = rnd() * 1024, len = 120 + rnd() * 500; g.strokeStyle = i % 4 ? `rgba(26,14,10,${0.16 + rnd() * 0.3})` : `rgba(160,110,80,${0.08 + rnd() * 0.1})`; g.lineWidth = 0.8 + rnd() * 2; g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + (rnd() - 0.5) * 10, y0 + len * 0.3, x + (rnd() - 0.5) * 10, y0 + len * 0.6, x + (rnd() - 0.5) * 6, y0 + len); g.stroke(); }
  for (let i = 0; i < 4; i++) { const kx = rnd() * 512, ky = rnd() * 1024; for (let r = 3; r < 14; r += 3) { g.strokeStyle = `rgba(24,12,8,${0.5 - r * 0.025})`; g.lineWidth = 1.4; g.beginPath(); g.ellipse(kx, ky, r * 0.8, r * 1.8, 0, 0, 7); g.stroke(); } }
  return c;
}
function leafCanvas() {   // a pothos leaf: a heart with a pointed tip, white (tinted), veins
  const S = 128, [c, g] = canvas(S, S); const gr = g.createLinearGradient(20, 20, 108, 108); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#d0d0d0"); g.fillStyle = gr; g.beginPath();
  g.moveTo(64, 124); g.bezierCurveTo(10, 100, 2, 50, 36, 28); g.bezierCurveTo(52, 18, 62, 24, 64, 36); g.bezierCurveTo(66, 24, 76, 18, 92, 28); g.bezierCurveTo(126, 50, 118, 100, 64, 124); g.fill();
  g.strokeStyle = "rgba(80,100,70,0.6)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(64, 126); g.lineTo(64, 36); for (const s of [-1, 1]) for (const y of [96, 76, 58]) { g.moveTo(64, y); g.lineTo(64 + s * 34, y - 18); } g.stroke();
  return c;
}
// a hanging cloth, drawn on an alpha card: kind "coat" (shoulders, body, two sleeves, collar, buttons) or "scarf" (two plaid strands with fringe)
function clothCanvas(rnd, kind) {
  const W = kind === "coat" ? 320 : 160, H = kind === "coat" ? 420 : 520, [c, g] = canvas(W, H);
  if (kind === "coat") {
    g.beginPath(); g.moveTo(W * 0.36, 10); g.lineTo(W * 0.64, 10); g.quadraticCurveTo(W * 0.78, 26, W * 0.9, 70); g.lineTo(W * 0.98, 330); g.lineTo(W * 0.85, 336); g.lineTo(W * 0.8, 140); g.lineTo(W * 0.78, H - 8); g.lineTo(W * 0.22, H - 8); g.lineTo(W * 0.2, 140); g.lineTo(W * 0.15, 336); g.lineTo(W * 0.02, 330); g.lineTo(W * 0.1, 70); g.quadraticCurveTo(W * 0.22, 26, W * 0.36, 10); g.closePath();
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#8a5a38"); gr.addColorStop(0.5, "#a46c40"); gr.addColorStop(1, "#7c4e30"); g.fillStyle = gr; g.fill(); g.save(); g.clip();
    for (let x = 0; x < W; x += 14) { const k = 0.5 + 0.5 * Math.sin(x * 0.31 + (x * x) % 7), lg = g.createLinearGradient(x, 0, x + 14, 0); lg.addColorStop(0, `rgba(255,214,170,${0.16 * k})`); lg.addColorStop(1, `rgba(40,20,10,${0.22 * k})`); g.fillStyle = lg; g.fillRect(x, 0, 14, H); }
    for (let i = 0; i < 2200; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,220,180,0.1)" : "rgba(40,20,10,0.12)"; g.fillRect(rnd() * W, rnd() * H, 1.4, 4); }   // wool nap
    g.strokeStyle = "rgba(40,20,12,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.2, 140); g.lineTo(W * 0.2, 400); g.moveTo(W * 0.8, 140); g.lineTo(W * 0.8, 400); g.moveTo(W * 0.5, 40); g.lineTo(W * 0.5, H - 8); g.stroke();
    g.fillStyle = "rgba(50,28,16,0.8)"; g.beginPath(); g.moveTo(W * 0.36, 10); g.lineTo(W * 0.5, 74); g.lineTo(W * 0.64, 10); g.lineTo(W * 0.7, 40); g.lineTo(W * 0.5, 100); g.lineTo(W * 0.3, 40); g.closePath(); g.fill();
    for (const y of [150, 220, 290, 350]) { g.fillStyle = "#2a1a10"; g.beginPath(); g.arc(W * 0.46, y, 7, 0, 7); g.fill(); g.fillStyle = "rgba(255,230,190,0.4)"; g.beginPath(); g.arc(W * 0.46 - 2, y - 2, 2.6, 0, 7); g.fill(); }
    g.restore();
  } else {
    for (const [x0, w, len] of [[10, 70, H - 10], [78, 70, H - 70]]) {
      g.fillStyle = "#7d8088"; g.fillRect(x0, 6, w, len - 36);
      g.save(); g.beginPath(); g.rect(x0, 6, w, len - 36); g.clip();
      for (let y = 0; y < H; y += 22) { g.fillStyle = y % 44 ? "rgba(40,44,56,0.4)" : "rgba(210,205,190,0.4)"; g.fillRect(x0, y, w, 8); }
      for (let x = x0; x < x0 + w; x += 16) { g.fillStyle = "rgba(40,50,70,0.35)"; g.fillRect(x, 0, 6, H); }
      for (let i = 0; i < 700; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(30,30,40,0.14)"; g.fillRect(x0 + rnd() * w, rnd() * H, 1.4, 4); }
      g.restore();
      g.strokeStyle = "#6a6c74"; g.lineWidth = 2.4; for (let x = x0 + 3; x < x0 + w; x += 6) { g.beginPath(); g.moveTo(x, len - 30); g.lineTo(x + (rnd() - 0.5) * 3, len - 4 + rnd() * 6); g.stroke(); }
    }
  }
  return c;
}
function pictureCanvas(rnd) {   // a small painting of a hill town at dusk (framed in the hall)
  const W = 256, H = 320, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H * 0.6); gr.addColorStop(0, "#5a7ec0"); gr.addColorStop(1, "#f0b878"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "#486a8a"; g.beginPath(); g.moveTo(0, 170); for (let x = 0; x <= W; x += 8) g.lineTo(x, 150 + 25 * Math.sin(x * 0.04) + 10 * Math.sin(x * 0.13)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  for (let i = 0; i < 16; i++) { const x = 10 + rnd() * 220, y = 160 + rnd() * 110, w = 22 + rnd() * 30, h = 26 + rnd() * 40; g.fillStyle = ["#e8c890", "#d8a870", "#f0d8a8", "#c89870"][i % 4]; g.fillRect(x, y, w, h); g.fillStyle = ["#c0502c", "#b04024", "#d06838"][i % 3]; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w / 2, y - 16 - rnd() * 8); g.lineTo(x + w + 3, y); g.fill(); g.fillStyle = "#f6d070"; g.fillRect(x + w * 0.3, y + h * 0.3, 5, 7); }
  g.fillStyle = "#5a8a4a"; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(rnd() * W, 270 + rnd() * 40, 10 + rnd() * 14, 0, 7); g.fill(); }
  g.fillStyle = "#e8d070"; g.beginPath(); g.moveTo(180, 70); g.lineTo(190, 70); g.lineTo(188, 150); g.lineTo(182, 150); g.fill();
  return c;
}
function wickerCanvas(rnd) {
  const S = 256, [c, g] = canvas(S, S); g.fillStyle = "#6a4a28"; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 16) for (let x = 0; x < S; x += 16) { const o = ((x + y) / 16) % 2; g.fillStyle = o ? "#c0955a" : "#a87a42"; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = "rgba(255,230,180,0.3)"; g.fillRect(x + 1, y + 1, 14, 2); g.fillStyle = "rgba(50,28,10,0.35)"; g.fillRect(x + 1, y + 13, 14, 2); }
  return c;
}

// ================================================================================================================ the set
export const WALL = {
  wallZ: 0, wallX: [-3.4, 3.6], wallH: 3.4, floorY: 0, doorX: [-2.75, -1.75],
  mirror: { x: 0.3, y: 1.1, z: 0, spec: { kind: "wallmirror", x: 0.3, y: 1.1, z: 0, cover: 0.7 } },   // the wallmirror prop's origin: the middle of its 0.55 x 0.80 frame, back on the wall
  // stand spots (x, z, y): Spud faces the wall (face 180); his body is 0.66 deep, so z 0.5 leaves 0.17 to the wall at his belly; hand grips are the director's
  stand: { mirror: [0.15, 0.52, 0], mirrorFar: [0.3, 1.2, 0], door: [-1.6, 0.9, 0], hooks: [-1.1, 0.6, 0], table: [1.9, 0.75, 0] },
  camA: { pos: [0.2, 1.1, 4.4], look: [0.2, 1.1, 0], fov: 44 },   // the painting's camera: square on to the wall (the bench's shot (a))
};

export function buildScoreWall(scene, S = {}) {
  const seed = S.seed ?? 5, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scorewall"; scene.add(set);
  const A = WALL;
  scene.background = new THREE.Color("#7384b0"); scene.fog = null;
  const add = (o) => { if (o) set.add(o); return o; };
  const rI = rng(seed * 211 + 9), rK = rng(seed * 3 + 5);
  const flat = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), COOL = new THREE.Color("#1c2238");
  const wood = (tx, o = {}) => std("#ffffff", { map: tx, roughness: 0.7, vertexColors: true, ...o });
  const woodDark = ctex(woodCanvas(rnd, false)), woodDarkV = ctex(woodCanvas(rnd, true));

  // ---------------------------------------------------------------- wall, side walls, ceiling, floor, skirting
  {
    const wmap = ctex(plasterWallCanvas(rnd), 1, 1, false), W = A.wallX[1] - A.wallX[0];
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(W, A.wallH), std("#ffffff", { map: wmap, roughness: 0.95, emissive: COOL.clone().multiplyScalar(0.25) }));
    wm.position.set((A.wallX[0] + A.wallX[1]) / 2, A.wallH / 2, 0); wm.receiveShadow = true; wm.name = "set-wall"; add(wm);
    const sideMat = std("#ffffff", { map: ctex(plasterWallCanvas(rnd), 1, 1, false), roughness: 0.95, emissive: COOL.clone().multiplyScalar(0.4) });
    for (const sd of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(6, A.wallH), sideMat); sw.rotation.y = -sd * Math.PI / 2; sw.position.set(sd < 0 ? A.wallX[0] : A.wallX[1], A.wallH / 2, 3); sw.receiveShadow = true; sw.userData.solid = false; add(sw); }
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, 6), std("#c8cde0", { roughness: 1, emissive: COOL.clone().multiplyScalar(0.5) })); ce.rotation.x = Math.PI / 2; ce.position.set((A.wallX[0] + A.wallX[1]) / 2, A.wallH, 3); ce.userData.solid = false; add(ce);
    const ft = ctex(floorCanvas(rnd), W / 3.5, 4.6 / 3.5), fl = new THREE.Mesh(new THREE.PlaneGeometry(W, 4.6), std("#ffffff", { map: ft, roughness: 0.42, metalness: 0.05, emissive: new THREE.Color("#241410") }));
    fl.rotation.x = -Math.PI / 2; fl.position.set((A.wallX[0] + A.wallX[1]) / 2, 0, 2.3); fl.receiveShadow = true; fl.name = "set-floor"; add(fl);
    const SB = Buf(), dk = new THREE.Color("#8a8a8a"), x0 = A.wallX[0], x1 = A.wallX[1];
    addBox(SB, (x0 + x1) / 2, 0.065, 0.016, W, 0.13, 0.034, dk, 0, 0, 1.0); addBox(SB, (x0 + x1) / 2, 0.14, 0.012, W, 0.022, 0.026, dk.clone().multiplyScalar(1.2), 0, 0, 1.0);
    const sk = bufMesh(SB, wood(woodDark, { emissive: new THREE.Color("#1a0e0a") })); sk.name = "set-skirting"; add(sk);
  }

  // ---------------------------------------------------------------- the door, its casing, knob, keyhole; the conduit pipe
  {
    const [d0, d1] = A.doorX, dw = d1 - d0, dh = 2.15, DB = Buf(), CB = Buf(), lt = new THREE.Color("#a8a8a8"), md = new THREE.Color("#8a8a8a"), dk = new THREE.Color("#6a6a6a");
    addBox(DB, (d0 + d1) / 2, dh / 2, 0.052, dw, dh, 0.045, md, 0, 0, 1.0);   // the slab
    const px = (a, b) => d0 + dw * a + (dw * (b - a)) / 2;
    for (const [a, b, y0, y1] of [[0.12, 0.88, 1.35, 2.0], [0.12, 0.88, 0.2, 1.05]]) {   // the raised mouldings of two big panels, each framed
      const w = dw * (b - a), h = y1 - y0, cx = px(a, b), cy = (y0 + y1) / 2;
      addBox(DB, cx, cy, 0.078, w - 0.08, h - 0.08, 0.012, dk, 0, 0, 1.0);
      for (const sd of [-1, 1]) { addBox(DB, cx + sd * (w / 2 - 0.02), cy, 0.082, 0.04, h, 0.02, lt, 0, 0, 1.0); addBox(DB, cx, cy + sd * (h / 2 - 0.02), 0.082, w, 0.04, 0.02, lt, 0, 0, 1.0); }
    }
    addBox(DB, (d0 + d1) / 2, 1.2, 0.082, dw - 0.12, 0.16, 0.02, lt, 0, 0, 1.0);   // the lock rail
    const dm = bufMesh(DB, wood(woodDarkV, { emissive: new THREE.Color("#200e0a") })); dm.name = "set-door"; add(dm);
    addBox(CB, d1 + 0.05, dh / 2 + 0.05, 0.04, 0.1, dh + 0.1, 0.05, md, 0, 0, 1.0); addBox(CB, d0 - 0.05, dh / 2 + 0.05, 0.04, 0.1, dh + 0.1, 0.05, md, 0, 0, 1.0); addBox(CB, (d0 + d1) / 2, dh + 0.07, 0.044, dw + 0.3, 0.14, 0.058, lt, 0, 0, 1.0);
    addBox(CB, (d0 + d1) / 2, dh + 0.17, 0.05, dw + 0.4, 0.04, 0.07, md, 0, 0, 1.0);
    add(bufMesh(CB, wood(woodDarkV, { emissive: new THREE.Color("#1a0c08") })));
    const brass = std("#c8a040", { roughness: 0.28, metalness: 0.85, emissive: new THREE.Color("#3a2a08") });
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), brass); kn.position.set(d1 - 0.1, 1.0, 0.13); kn.scale.z = 1.1; kn.castShadow = true; add(kn);
    const kp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.012), brass); kp.position.set(d1 - 0.1, 1.04, 0.078); add(kp);
    const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8).rotateX(Math.PI / 2), brass); nk.position.set(d1 - 0.1, 1.0, 0.1); add(nk);
    const kh = new THREE.Mesh(new THREE.CircleGeometry(0.01, 12), std("#1a1210")); kh.position.set(d1 - 0.1, 1.2, 0.0765); add(kh);
    const hg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.02), std("#2a2220", { roughness: 0.5, metalness: 0.5 })); for (const y of [0.4, 1.0, 1.9]) { const h2 = hg.clone(); h2.position.set(d0 + 0.015, y, 0.08); add(h2); }
    // the conduit: a pale grey pipe floor to ceiling, clips every 0.8 m
    const P = []; P.push([new THREE.CylinderGeometry(0.014, 0.014, A.wallH, 8), M4(-1.44, A.wallH / 2, 0.02)]); for (let y = 0.35; y < A.wallH; y += 0.8) P.push([new THREE.BoxGeometry(0.05, 0.03, 0.02), M4(-1.44, y, 0.013)]);
    add(mergedGeo(P, std("#b4b8c0", { roughness: 0.5, metalness: 0.4 })));
  }

  // ---------------------------------------------------------------- the hook board, hooks, the scarf and the coat
  {
    const BB = Buf(), bx0 = -1.55, bx1 = -0.95;
    addBox(BB, (bx0 + bx1) / 2, 2.07, 0.016, bx1 - bx0, 0.14, 0.032, new THREE.Color("#9a9a9a"), 0, 0, 1.0); addBox(BB, (bx0 + bx1) / 2, 2.07, 0.034, bx1 - bx0 - 0.04, 0.1, 0.008, new THREE.Color("#b0b0b0"), 0, 0, 1.0);
    add(bufMesh(BB, wood(woodDark, { emissive: new THREE.Color("#1a0e0a") })));
    const iron = std("#1c1a1c", { roughness: 0.4, metalness: 0.6 }), HK = [];
    const hookGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.02, 0.03), new THREE.Vector3(0, 0.0, 0.085), new THREE.Vector3(0, -0.045, 0.1), new THREE.Vector3(0, -0.085, 0.075), new THREE.Vector3(0, -0.075, 0.045)]), 12, 0.009, 6);
    for (const x of [-1.42, -1.25, -1.08]) HK.push([hookGeo, M4(x, 2.07, 0)], [new THREE.CylinderGeometry(0.02, 0.02, 0.012, 10).rotateX(Math.PI / 2), M4(x, 2.07, 0.034)]);
    const hm = mergedGeo(HK, iron); hm.name = "set-hooks"; add(hm);
    if (S.coats !== false) {
      const cloth = (kind, cx, cy, w, h, z, fold, phase) => { fold *= 1.8;   // a hanging cloth: a segmented card, its z folded by sines, an alpha silhouette
        const g = new THREE.PlaneGeometry(w, h, 14, 20), ps = g.attributes.position;
        for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i), v = (y + h / 2) / h; ps.setZ(i, z + fold * Math.sin(x / w * 9 + phase + (1 - v) * 1.5) * (0.25 + 0.75 * (1 - v)) + 0.04 * (1 - v) * (kind === "coat" ? 1 : 0.4)); }
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, std("#ffffff", { map: ctex(clothCanvas(rnd, kind), 1, 1, false), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95, emissive: new THREE.Color("#1a1210") }));
        m.position.set(cx, cy, 0); m.castShadow = m.receiveShadow = true; m.name = `set-${kind}`; add(m); return m;
      };
      cloth("scarf", -1.42, 1.57, 0.26, 1.0, 0.1, 0.012, 0.3);
      cloth("coat", -1.08, 1.6, 0.52, 0.86, 0.11, 0.02, 1.7);
      const hl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), std("#4a3020")); hl.position.set(-1.08, 2.03, 0.1); hl.rotation.z = 0; add(hl);   // the coat's hanging loop
    }
  }

  // ---------------------------------------------------------------- the shelf with its pothos, the picture, the console table with books, plant and basket
  const leafT = ctex(leafCanvas(), 1, 1, false), leafMat = lam("#ffffff", { map: leafT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#1a2a0a") });
  const LQ = Buf(), greens = ["#6fa83a", "#8cc040", "#4f8a30", "#a8c850", "#5f9a38", "#c8d868"];
  const leafBunch = (cx, cy, cz, rx, ry, n, trailY = 0, trailX = 0) => {
    for (let i = 0; i < n; i++) {
      const u = rI() * 6.28, rr = Math.sqrt(rI()), x = cx + Math.cos(u) * rr * rx, y = cy + rI() * ry, z = cz + Math.sin(u) * rr * rx * 0.8, nrm = new THREE.Vector3(Math.cos(u) * 0.4, 0.5 + rI() * 0.5, 0.7 + Math.sin(u) * 0.3).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = 0.08 + rI() * 0.06;
      addCard(LQ, x, y, z, a, b, sz, sz, nrm, tint(greens[Math.floor(rI() * greens.length)], rI, 0.012, 0.08, 0.08));
    }
    for (let v = 0; v < Math.round(n / 14); v++) {   // trailing vines: leaves in a line down and out
      const vx = cx + (rI() - 0.5) * rx * 1.4, len = trailY * (0.5 + rI() * 0.5), steps = Math.round(len / 0.07);
      for (let k = 0; k < steps; k++) { const t = k / steps, x = vx + trailX * t + Math.sin(t * 5 + v) * 0.03, y = cy - t * len, z = cz + 0.07 + Math.sin(t * 3 + v * 2) * 0.03, nrm = new THREE.Vector3((rI() - 0.5) * 0.4, 0.1, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = 0.07 + rI() * 0.04; addCard(LQ, x, y, z, a, b, sz, sz, nrm, tint(greens[Math.floor(rI() * greens.length)], rI, 0.012, 0.08, 0.08)); }
    }
  };
  {
    const SBf = Buf(), sx0 = -1.0, sx1 = -0.28, sy = 2.6, c = new THREE.Color("#9a9a9a");
    addBox(SBf, (sx0 + sx1) / 2, sy - 0.02, 0.1, sx1 - sx0, 0.04, 0.22, c, 0, 0, 1.0); addBox(SBf, (sx0 + sx1) / 2, sy - 0.05, 0.215, sx1 - sx0, 0.03, 0.02, c.clone().multiplyScalar(0.8), 0, 0, 1.0);
    add(bufMesh(SBf, wood(woodDark, { emissive: new THREE.Color("#1a0e0a") })));
    const br = []; for (const x of [sx0 + 0.1, sx1 - 0.1]) { br.push([new THREE.BoxGeometry(0.028, 0.27, 0.028), M4(x, sy - 0.17, 0.1, 1, 1, 1, 0.66, 0, 0)], [new THREE.BoxGeometry(0.04, 0.12, 0.016), M4(x, sy - 0.1, 0.008)]); }   // diagonal braces
    add(mergedGeo(br, std("#6a4a30", { roughness: 0.8 })));
    const lathe = (pts, seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    const pot = new THREE.Mesh(lathe([[0.07, 0], [0.1, 0.03], [0.12, 0.14], [0.125, 0.19], [0.11, 0.19], [0.1, 0.15]]), std("#cfc2a8", { roughness: 0.8, emissive: new THREE.Color("#2a2418") })); pot.position.set(-0.64, sy, 0.1); pot.castShadow = pot.receiveShadow = true; add(pot);
    if (S.plants !== false) leafBunch(-0.64, sy + 0.14, 0.1, 0.12, 0.26, 150, 0.7, -0.05);
    // the picture
    const PBf = Buf(), px = 2.22, py = 2.35, pw = 0.65, ph = 0.8, fc = new THREE.Color("#9a9a9a");
    addBox(PBf, px, py, 0.02, pw, ph, 0.04, fc, 0, 0, 1.0);
    const pm = bufMesh(PBf, wood(woodDarkV, { emissive: new THREE.Color("#1a0e0a") })); pm.name = "set-frame"; add(pm);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.1, ph - 0.1), std("#e8e6e0", { roughness: 1 })); mat.position.set(px, py, 0.0425); add(mat);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.22, ph - 0.24), std("#ffffff", { map: ctex(pictureCanvas(rnd), 1, 1, false), roughness: 0.9, emissive: new THREE.Color("#302820") })); pic.position.set(px, py, 0.044); add(pic);
    const cord = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px - 0.2, py + ph / 2 - 0.03, 0.03), new THREE.Vector3(px, py + ph / 2 + 0.12, 0.02), new THREE.Vector3(px + 0.2, py + ph / 2 - 0.03, 0.03)]), new THREE.LineBasicMaterial({ color: "#3a3028" })); add(cord);
    // the console table: top, legs, lower shelf, books, a potted plant, a basket
    const TB = Buf(), tx0 = 1.5, tx1 = 2.55, tc = new THREE.Color("#9a9a9a");
    addBox(TB, (tx0 + tx1) / 2, 0.6, 0.2, tx1 - tx0, 0.04, 0.4, tc, 0, 0, 1.0); addBox(TB, (tx0 + tx1) / 2, 0.2, 0.2, tx1 - tx0 - 0.1, 0.03, 0.36, tc.clone().multiplyScalar(0.9), 0, 0, 1.0);
    for (const x of [tx0 + 0.05, tx1 - 0.05]) for (const z of [0.04, 0.36]) addBox(TB, x, 0.3, z, 0.07, 0.6, 0.07, tc.clone().multiplyScalar(0.85), 0, 0, 1.0);
    addBox(TB, (tx0 + tx1) / 2, 0.55, 0.04, tx1 - tx0 - 0.1, 0.07, 0.03, tc.clone().multiplyScalar(0.85), 0, 0, 1.0);
    const tm = bufMesh(TB, wood(woodDark, { emissive: new THREE.Color("#1a0e0a") })); tm.name = "set-table"; add(tm);
    const BK = Buf(), bc = ["#2f6a3a", "#2a4a8a", "#8a3a3a", "#b08a40"];
    [[1.74, 0.62, 0.0, 0.22, 0.046], [1.76, 0.666, 0.03, 0.2, 0.04], [1.73, 0.706, -0.02, 0.21, 0.044]].forEach(([x, y, rot, l, h], i) => { addBox(BK, x, y + h / 2 - 0.02 + 0.0, 0.16, l, h, 0.15, new THREE.Color(bc[i % 4]), rot, 0, 0.3); addBox(BK, x, y + h / 2 - 0.02, 0.16, l - 0.01, h - 0.012, 0.152, new THREE.Color("#ece0c4"), rot, 0, 0.3); addBox(BK, x, y + h / 2 - 0.02, 0.087, l + 0.004, h + 0.002, 0.018, new THREE.Color(bc[i % 4]).multiplyScalar(0.8), rot, 0, 0.3); });
    add(bufMesh(BK, std("#ffffff", { vertexColors: true, roughness: 0.7 })));
    const pot2 = new THREE.Mesh(lathe([[0.07, 0], [0.12, 0.03], [0.14, 0.16], [0.145, 0.22], [0.13, 0.22], [0.12, 0.17]]), std("#d8cdb4", { roughness: 0.8, emissive: new THREE.Color("#2a2418") })); pot2.position.set(2.25, 0.62, 0.17); pot2.castShadow = pot2.receiveShadow = true; add(pot2);
    if (S.plants !== false) leafBunch(2.25, 0.8, 0.17, 0.16, 0.34, 230, 0.55, 0.06);
    const bas = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.3), std("#ffffff", { map: ctex(wickerCanvas(rnd), 2, 1, true), roughness: 0.9 })); bas.position.set(2.0, 0.315, 0.2); bas.castShadow = bas.receiveShadow = true; add(bas);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.32), std("#8a6232")); rim.position.set(2.0, 0.425, 0.2); add(rim);
    const lm = bufMesh(LQ, leafMat, true, true); if (lm) { lm.frustumCulled = false; lm.name = "set-leaves"; add(lm); }
  }
  return set;
}
