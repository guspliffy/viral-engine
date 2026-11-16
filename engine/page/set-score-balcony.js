// "scorebalcony": the night balcony of "I could see everyone's happiness score" (Happiness 03, panel 23, painting plates/painted/BA.webp).
// REAL 3D geometry with hand-painted canvas textures (the painting is only the look target): a small flagstone balcony on a stone
// house (ashlar wall with ivy, a glazed double door glowing amber behind curtains, a stone step, a drainpipe, a terracotta pot with
// a red maple seedling), a wrought-iron railing of knuckled balusters on a stone plinth, a stone parapet with stepped coping on the
// right, a red maple (3D trunk, branches, leaf cards) rising behind the railing, golden trees below, then the town of dark slate
// roofs with lit windows (3D houses to 40 m, then one painted far backdrop card cut from BA.webp: the town, the church tower and the
// hills), a starry sky dome. Fallen maple leaves on the flags, the door's warm glow spilled on the floor and the wall.
//
// COORDINATES (metres, y up; the view looks toward -z, the town). The house wall is the plane z 0 (faces +z); you stand on the balcony in front of it.
//   floor            y 0, x -4.1 .. 3.3, z 0 .. 4.4 (big flagstones)
//   house wall       x -3.8 .. 0.05, front plane z 0 (0.45 thick), ashlar; corner quoins on its right end
//   double door      opening x -1.85 .. -0.7 (1.15 wide), 2.3 tall, dark wood leaves with 2 x 6 glazed panes each, amber glass behind curtains; hinged flush at z -0.18
//   the step         x -2.0 .. -0.58, z 0 .. 0.5, TOP y 0.14 (a potato may stand on it)
//   drainpipe        x -0.15, z 0.08, up the wall to 6 m
//   pot              terracotta at x -2.75, z 0.7 (r 0.3, 0.55 tall) with the red seedling (to 1.1 m)
//   plinth + railing x 0.05 .. 3.3: plinth z -0.05 .. 0.5, y 0 .. 0.3; iron railing on it, top rail y 1.0, balusters every 0.26 (SOLID: stands at z 0.25)
//   right parapet    x 3.3 .. 3.85, z -0.05 .. 4.4, ashlar 0.9 high + stepped coping to 1.02 (SOLID)
//   left parapet     x -4.35 .. -4.1 (a low wall; seen only from the right)
//   below            golden trees' crowns reach y 0.9 beyond the railing (z -2 .. -7), the ground at y -6, the town's roofs at y -2 .. -4 (z -18 .. -40)
// BALCONY (exported) has the numbers: stand spots per panel, the painting's camera camA.
//
// spec (every key optional):
//   seed 5        the painted textures and the layout of leaves, ivy and windows
//   wind 1        leaves shiver (0 off)
//   trees true    the red maple, the golden trees, the pot's seedling and the ivy
//   town false    true adds 14 near 3D houses with lit windows (default off: the painted town card from BA.webp fills the view past the rail)
//   backdrop true the painted far card (backdropK 1.5 scale, backdropX -0.65, backdropLift 0.1; upright cards 165 m out) (needs plates/painted/BA.webp served from the repo root)
//   glow 1        the door's warm spill on floor and wall, a multiplier (0 none)
// Light: "night": true (looks.js: the night palette) and a cool key from the left and above, e.g. "key": [-3, 4, 3]; nothing here casts
// the door light for real: it is painted (glow decals) and the glass is emissive. Solid for the checks: wall, step, plinth, railing,
// parapets, floor; the maple, the trees, the town, the card and the dome are scenery.
// Triangles: about 150k (leaf cards 65 %).  Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks).

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

// ================================================================================================================ foliage
// Leaf-card trees as on the street: a dark core, many overlapping clumps of maple-leaf cards, 3D trunks and branches.
const TONES = {
  red: ["#c8301c", "#d9461c", "#b72a1a", "#e2601e", "#a8221a"], orange: ["#e8751e", "#dd5f1c", "#f08a22", "#d9531c", "#f29a28"],
  gold: ["#f0b21e", "#e9a01e", "#f6cc3a", "#e08c1e", "#f2c038"], mix: ["#d9461c", "#e8751e", "#f0b21e", "#c8301c", "#f6cc3a", "#e08c1e"], green: ["#6f9a3a", "#8aa83a", "#b9b02a", "#5a8a3a", "#d8a82a"],
  pink: ["#e0506a", "#d9406a", "#ee7088", "#c93a52", "#f08a7a"], rose: ["#d9461c", "#e0506a", "#c8301c", "#ee6a4a", "#f08a22"], wine: ["#8a2a2a", "#a63a2a", "#7a2230", "#b84a2a", "#6a1c2a"],
};
function makeFoliage(rT, groundY) {
  const treeWood = [], leafQ = Buf(), coreQ = Buf();
  // dens: card count multiplier (far trees use fewer, bigger cards)
  function clump(c, r, tone, scaleY = 0.78, cards = null, cardSz = 0.27, dens = 1) {
    const pal = TONES[tone].map((h) => new THREE.Color(h)), n = Math.max(12, Math.round((cards ?? Math.round(80 + 240 * r)) * dens)), dark = pal[0].clone().lerp(pal[1], 0.5).multiplyScalar(0.5), kc = 0.72 + rT() * 0.5;
    cardSz *= 1 / Math.sqrt(dens);
    const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = coreQ.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); coreQ.p.push(c.x + x * r * 0.5, c.y + y * r * 0.5 * scaleY, c.z + z * r * 0.5); _n.set(x, y, z).normalize(); coreQ.n.push(_n.x, _n.y, _n.z); coreQ.uv.push(0, 0); coreQ.c.push(dark.r, dark.g, dark.b); coreQ.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = new THREE.Vector3(rr * Math.cos(th), u * scaleY, rr * Math.sin(th));
      const rad = r * (0.7 + rT() * 0.32), p = new THREE.Vector3(c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad);
      const nrm = new THREE.Vector3(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = cardSz * (0.75 + rT() * 0.5);
      addCard(leafQ, p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
    }
  }
  // o: trunk (share of h), R (crown radius), r (trunk radius), branches, tones, y0, lean [dx, dz] (trunk-top offset in m), dens
  function maple(x, z, h, tone, o = {}) {
    const y0 = o.y0 ?? groundY(x, z) + 0.05, lx = o.lean ? o.lean[0] : (rT() - 0.5) * 0.12 * h * 0.5, lz = o.lean ? o.lean[1] : 0, R = o.R ?? h * 0.36, dens = o.dens ?? 1;
    const Rc = R * (o.clumpK ?? 1), trunkH = h * (o.trunk ?? 0.5), pts = [0, 0.25, 0.5, 0.75, 1].map((k) => new THREE.Vector3(x + lx * k * k + Math.sin(k * 3 + x) * 0.05, y0 + k * trunkH, z + lz * k * k));
    const r0 = o.r ?? 0.09 + h * 0.014;
    pts.forEach((p, i) => { if (i) treeWood.push(segMat(pts[i - 1], p, r0 * (1 - (i - 1) * 0.15), r0 * (1 - i * 0.15))); });
    treeWood.push([new THREE.ConeGeometry(r0 * 1.9, 0.5, 8), M4(x, y0 + 0.2, z)]);
    const top = pts[4], nb = (o.branches ?? 6) + 1, bias = o.bias || [0, 0];
    const tn = () => (o.tones ? o.tones[Math.floor(rT() * o.tones.length)] : tone);
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * 6.28 + rT() * 0.7, el = 0.45 + rT() * 0.5, f = 0.35 + (b % 3) * 0.2, st = pts[Math.min(4, Math.round(f * 4))].clone(), L = R * (0.75 + rT() * 0.45);
      st.y = y0 + trunkH * (0.55 + 0.45 * f);
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el) + bias[0], Math.sin(el), Math.sin(a) * Math.cos(el) + bias[1]).normalize(), mid = st.clone().addScaledVector(dir, L * 0.5), tip = st.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, L * 0.18, 0));
      const rb = r0 * (0.5 - b * 0.02);
      treeWood.push(segMat(st, mid, rb, rb * 0.62)); treeWood.push(segMat(mid, tip, rb * 0.62, 0.025));
      if (rT() < 0.85) { const d2 = dir.clone().applyAxisAngle(Yaxis, (rT() < 0.5 ? -1 : 1) * (0.6 + rT() * 0.5)), e2 = mid.clone().addScaledVector(d2, L * 0.55).add(new THREE.Vector3(0, L * 0.12, 0)); treeWood.push(segMat(mid, e2, rb * 0.4, 0.02)); clump(e2, Rc * (0.3 + rT() * 0.14), tn(), 0.78, null, o.cardSz ?? 0.27, dens); }
      clump(tip, Rc * (0.34 + rT() * 0.16), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
      clump(tip.clone().add(new THREE.Vector3((rT() - 0.5) * R * 0.5, R * (0.2 + rT() * 0.2), (rT() - 0.5) * R * 0.5)), Rc * (0.26 + rT() * 0.12), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
      clump(mid.clone().addScaledVector(dir, L * 0.18).add(new THREE.Vector3(0, 0.2, 0)), Rc * (0.26 + rT() * 0.1), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
    }
    clump(top.clone().add(new THREE.Vector3(0, R * 0.55, 0)), Rc * 0.42, tone, 0.78, null, o.cardSz ?? 0.27, dens);
    clump(top.clone().add(new THREE.Vector3(R * 0.3, R * 0.2, -R * 0.2)), Rc * 0.36, tone, 0.78, null, o.cardSz ?? 0.27, dens);
  }
  function shrub(x, z, r, tone, y0 = null, cardSz = 0.17) { const y = (y0 ?? groundY(x, z)) + r * 0.55; clump(new THREE.Vector3(x, y, z), r, tone, 0.72, Math.round(70 + 170 * r), cardSz); }
  return { clump, maple, shrub, treeWood, leafQ, coreQ };
}

// ================================================================================================================ painters
// pale stone flags, laid in an irregular bond, a bevel on each, moss in the joints, pits and cracks. 6 m square.
function flagCanvas(rnd, S = 2048, pal0 = null, mortar = "#6d6157") {
  const [c, g] = canvas(S, S), ppm = S / 6;
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  const pal = pal0 || ["#c9ad94", "#bea48e", "#d1b69c", "#b5a090", "#c4ae9c", "#cfb8a0", "#b9a294"];
  let y = 0;
  for (const rh of fitRun(rnd, S, 0.42 * ppm, 0.85 * ppm)) {
    let x = 0;
    for (const w of fitRun(rnd, S, 0.8 * ppm, 1.8 * ppm)) {
      const base = pal[Math.floor(rnd() * pal.length)], k = 0.95 + rnd() * 0.1;
      g.fillStyle = shade(base, k); g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, rh - 8, 14); g.fill();
      for (let i = 0; i < 18; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(90,70,60,${0.05 + rnd() * 0.08})` : `rgba(255,236,214,${0.06 + rnd() * 0.1})`; g.beginPath(); g.ellipse(x + rnd() * w, y + rnd() * rh, 16 + rnd() * w * 0.16, 8 + rnd() * rh * 0.2, rnd() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(80,64,54,${0.12 + rnd() * 0.18})`; g.beginPath(); g.arc(x + 8 + rnd() * (w - 16), y + 8 + rnd() * (rh - 16), 1 + rnd() * 2.2, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,240,222,0.32)"; g.fillRect(x + 8, y + 5, w - 16, 3); g.fillRect(x + 5, y + 8, 3, rh - 16);
      g.fillStyle = "rgba(52,40,34,0.34)"; g.fillRect(x + 8, y + rh - 8, w - 16, 3); g.fillRect(x + w - 8, y + 8, 3, rh - 16);
      if (rnd() < 0.3) { g.strokeStyle = "rgba(60,48,40,0.35)"; g.lineWidth = 1.5; g.beginPath(); let px = x + rnd() * w, py = y + 6; g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * 40; py += rh / 4.5; g.lineTo(px, py); } g.stroke(); }
      if (rnd() < 0.5) for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(104,138,56,${0.35 + rnd() * 0.3})`; g.beginPath(); g.ellipse(x + rnd() * w, y + 1 + rnd() * 3, 5 + rnd() * 12, 2 + rnd() * 3, 0, 0, 7); g.fill(); }
      x += w;
    }
    y += rh;
  }
  return c;
}
function slateCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S), N = 10, h = S / N;
  g.fillStyle = "#1c2236"; g.fillRect(0, 0, S, S);
  for (let r = 0; r < N; r++) for (let q = -1; q < 8; q++) {
    const w = S / 8, x = q * w + (r % 2) * w / 2, k = 0.8 + rnd() * 0.4;
    g.fillStyle = shade(["#46506e", "#3d4663", "#515b7c", "#434d6c"][Math.floor(rnd() * 4)], k); g.fillRect(x + 2, r * h + 1, w - 4, h - 2);
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(x + 2, r * h + h - 5, w - 4, 4);
    g.fillStyle = "rgba(190,200,240,0.14)"; g.fillRect(x + 2, r * h + 1, w - 4, 3);
  }
  return c;
}
function plasterCanvas(rnd, base, S = 256) {
  const [c, g] = canvas(S, S); g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(20,24,50,${0.06 + rnd() * 0.1})` : `rgba(200,200,230,${0.04 + rnd() * 0.06})`; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 8 + rnd() * 34, 5 + rnd() * 16, rnd() * 3, 0, 7); g.fill(); }
  return c;
}
// an ivy leaf: three soft lobes and a stalk, white (tinted by vertex colour)
function ivyCanvas() {
  const S = 128, [c, g] = canvas(S, S);
  const gr = g.createLinearGradient(20, 20, 108, 108); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#c8c8c8"); g.fillStyle = gr; g.beginPath();
  g.moveTo(64, 120); g.bezierCurveTo(30, 104, 6, 86, 12, 62); g.bezierCurveTo(14, 48, 30, 54, 36, 58); g.bezierCurveTo(26, 36, 40, 14, 64, 6); g.bezierCurveTo(88, 14, 102, 36, 92, 58); g.bezierCurveTo(98, 54, 114, 48, 116, 62); g.bezierCurveTo(122, 86, 98, 104, 64, 120); g.fill();
  g.strokeStyle = "rgba(90,90,90,0.55)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(64, 124); g.lineTo(64, 20); g.moveTo(64, 96); g.lineTo(26, 66); g.moveTo(64, 96); g.lineTo(102, 66); g.moveTo(64, 60); g.lineTo(46, 34); g.moveTo(64, 60); g.lineTo(82, 34); g.stroke();
  return c;
}
// the lit double door: warm amber behind curtains, folds of gathered cloth, a soft bright centre, one leaf (w x h px)
function doorGlassCanvas(rnd) {
  const W = 256, H = 512, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#ffd47a"); gr.addColorStop(0.5, "#ffc25e"); gr.addColorStop(1, "#f0a23c"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 16) { const k = 0.5 + 0.5 * Math.sin(x * 0.4 + (x * x) % 5), lg = g.createLinearGradient(x, 0, x + 16, 0); lg.addColorStop(0, `rgba(255,236,170,${0.18 * k})`); lg.addColorStop(0.5, "rgba(255,255,255,0)"); lg.addColorStop(1, `rgba(190,100,20,${0.2 * k})`); g.fillStyle = lg; g.fillRect(x, 0, 16, H); }
  const rg = g.createRadialGradient(W * 0.5, H * 0.45, 10, W * 0.5, H * 0.45, H * 0.6); rg.addColorStop(0, "rgba(255,246,200,0.35)"); rg.addColorStop(1, "rgba(255,246,200,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const lw = g.createLinearGradient(0, H * 0.78, 0, H); lw.addColorStop(0, "rgba(120,50,10,0)"); lw.addColorStop(1, "rgba(120,50,10,0.3)"); g.fillStyle = lw; g.fillRect(0, H * 0.78, W, H * 0.22);
  return c;
}
function glowCanvas(rgb) {
  const S = 256, [c, g] = canvas(S, S), rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  rg.addColorStop(0, `rgba(${rgb},0.9)`); rg.addColorStop(0.45, `rgba(${rgb},0.38)`); rg.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = rg; g.fillRect(0, 0, S, S); return c;
}
// the sky all round: equirect, u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z (the town). Deep blue night, stars, a blue-violet glow at the horizon, far dark hills, the town's glow.
function skyCanvas(rnd) {
  const W = 4096, H = 2048, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#08143f"); gr.addColorStop(0.5, "#122561"); gr.addColorStop(0.85, "#26407e"); gr.addColorStop(1, "#46568f");
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2); g.fillStyle = "#121a38"; g.fillRect(0, hz, W, hz);
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * W, y = rnd() ** 1.3 * hz * 0.97, r = 0.7 + rnd() ** 4 * 2.6, a = 0.45 + rnd() * 0.55;
    const rg = g.createRadialGradient(x, y, 0, x, y, r * 3); rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(0.3, `rgba(220,230,255,${a * 0.5})`); rg.addColorStop(1, "rgba(220,230,255,0)"); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * 3, 0, 7); g.fill();
    if (r > 2.2) { g.fillStyle = `rgba(255,255,255,${a * 0.6})`; g.fillRect(x - r * 3.4, y - 0.6, r * 6.8, 1.2); g.fillRect(x - 0.6, y - r * 3.4, 1.2, r * 6.8); }
  }
  [["#2a3868", 56, 0.7], ["#202c58", 40, 1.2], ["#18224a", 24, 2.0]].forEach(([col, hgt, f], li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 6) g.lineTo(x, hz - Math.max(2, hgt * (0.55 + 0.45 * Math.sin(x * 0.0035 * f + li * 2) * Math.sin(x * 0.0013 + li)) + (hash2(Math.floor(x / 7), li, 3) - 0.5) * 8));
    g.lineTo(W, hz + 4); g.fill();
  });
  const hg = g.createLinearGradient(0, hz - 40, 0, hz + 10); hg.addColorStop(0, "rgba(120,120,190,0)"); hg.addColorStop(0.8, "rgba(150,130,170,0.35)"); hg.addColorStop(1, "rgba(150,130,170,0)"); g.fillStyle = hg; g.fillRect(0, hz - 40, W, 50);
  return c;
}

// ================================================================================================================ the set
export const BALCONY = {
  floor: { x: [-5.5, 3.3], z: [0, 4.4], y: 0 }, wallZ: 0, doorX: [-1.85, -0.7], doorH: 2.3, stepTop: 0.14, stepX: [-2.0, -0.58], stepZ: [0, 0.5],
  railing: { x: [0.05, 3.3], z: 0.25, top: 1.0 }, parapetX: 3.3, parapetTop: 0.95, pot: { x: -2.75, z: 0.7 },
  // stand spots (x, z, y): panel 23 Spud by the door looking right at the town, hands in pockets; at the railing; on the step
  stand: { panel23: [-0.35, 1.05, 0], railing: [1.5, 0.85, 0], step: [-1.3, 0.25, 0.14], doorway: [-1.3, 0.9, 0] },
  camA: { pos: [1.0, 2.0, 4.8], yaw: 0, pitch: 8, fov: 50 },   // the painting's camera (the bench's shot (a)): yaw degrees right of -z, pitch degrees down, vertical fov
};

const groundZ = (z) => (z > -14 ? -6.3 : Math.max(-90, -6.3 - (-14 - z) * 0.32));
export function buildScoreBalcony(scene, S = {}) {
  const seed = S.seed ?? 5, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scorebalcony"; scene.add(set);
  const A = BALCONY, wind = S.wind ?? 1;
  scene.background = new THREE.Color("#0c1840"); scene.fog = null;
  const add = (o) => { if (o) set.add(o); return o; };
  const rT = rng(seed * 57 + 2), rG = rng(seed * 113 + 4), rI = rng(seed * 211 + 9), rH = rng(seed * 17 + 8), rK = rng(seed * 3 + 5);
  const flat = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);

  // ---------------------------------------------------------------- materials
  const NIGHT = new THREE.Color("#14122a");
  const stonePal = ["#575166", "#4f4a5e", "#5e586c", "#4a4558", "#59536a", "#544e64", "#625b70", "#4c475a"];
  const stoneT = ctex(stoneCanvas(rnd, 2048, "#4a4048", stonePal, 3.2)), stoneT2 = ctex(stoneCanvas(rnd, 1024, "#4a4048", stonePal, 1.6));
  const copeT = ctex(stoneCanvas(rnd, 1024, "#6a6070", ["#8a8296", "#7e788e", "#948ca0", "#837c92", "#9a92a2"], 1.6));
  const flagT = ctex(flagCanvas(rnd, 2048, ["#4c475e", "#454058", "#524c64", "#403b52", "#4e4860", "#48435a", "#575166"], "#3a3440"));
  const stoneM = std("#ffffff", { map: stoneT, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.35) });
  const iron = std("#1b2030", { roughness: 0.45, metalness: 0.4 });
  const mapleT = ctex(mapleCanvas(), 1, 1, false), ivyT = ctex(ivyCanvas(), 1, 1, false), dotT = ctex(glowCanvas("255,230,160"), 1, 1, false);
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#2a0e06") });
  if (wind) leafMat.userData.wind = { amp: 0.04 * wind, h: 0, flutter: 1.7 };
  const ivyMat = lam("#ffffff", { map: ivyT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#2a2a08") });
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color("#3a1808") });

  // ---------------------------------------------------------------- sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), basic({ map: ctex(skyCanvas(rnd), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sky.position.set(0, 0, -20); sky.renderOrder = -1000; sky.frustumCulled = false; sky.userData.solid = false; sky.name = "set-scorebalcony-sky"; add(sky);

  // ---------------------------------------------------------------- the house wall with the door opening (extruded), the quoins, the floor
  const dx0 = A.doorX[0], dx1 = A.doorX[1], WALL_X0 = -5.5, WALL_X1 = 0.05, WALL_T = 0.45, WALL_H = 6.6;
  {
    const wall = new THREE.Shape(); wall.moveTo(WALL_X0, -0.3); wall.lineTo(WALL_X1, -0.3); wall.lineTo(WALL_X1, WALL_H); wall.lineTo(WALL_X0, WALL_H); wall.closePath();
    const h = new THREE.Path(); h.moveTo(dx0, 0); h.lineTo(dx0, A.doorH); h.lineTo(dx1, A.doorH); h.lineTo(dx1, 0); h.closePath(); wall.holes.push(h);
    const g = new THREE.ExtrudeGeometry(wall, { depth: WALL_T, bevelEnabled: false }); g.translate(0, 0, -WALL_T);
    const uv = g.attributes.uv, ps = g.attributes.position;
    for (let j = 0; j < uv.count; j++) { const front = Math.abs(ps.getZ(j)) < 1e-4 || Math.abs(ps.getZ(j) + WALL_T) < 1e-4; uv.setXY(j, (front ? ps.getX(j) : ps.getX(j) + ps.getZ(j)) / 3.2, ps.getY(j) / 3.2); }
    const m = new THREE.Mesh(g, std("#ffffff", { map: stoneT, emissive: NIGHT.clone().multiplyScalar(0.35) })); m.castShadow = m.receiveShadow = true; m.name = "set-wall"; add(m);
    // corner quoins up the wall's right end: long and short blocks alternating, a little proud
    const QB = Buf(); for (let k = 0; k < 24; k++) { const long = k % 2, c = 0.88 + rK() * 0.2; addBox(QB, WALL_X1 - (long ? 0.28 : 0.2), 0.14 + k * 0.28, 0.025, long ? 0.56 : 0.4, 0.27, 0.05, new THREE.Color(c, c * 0.97, c * 0.92), 0, 0, 1.2); }
    add(bufMesh(QB, std("#ffffff", { map: copeT, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.35) })));
    // the floor: a slab of flagstones (the front edge has a thick lip), the door step
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 4.4), std("#ffffff", { map: flagT, roughness: 0.9, emissive: NIGHT.clone().multiplyScalar(0.4) }));
    fl.material.map = ctex(flagCanvas(rnd, 2048, ["#4c475e", "#454058", "#524c64", "#403b52", "#4e4860", "#48435a", "#575166"], "#3a3440"), 8.8 / 6, 4.4 / 6);
    fl.rotation.x = -Math.PI / 2; fl.position.set((WALL_X0 + 3.3) / 2, 0, 2.2); fl.receiveShadow = true; fl.name = "set-floor"; add(fl);
    const SB = Buf(); addBox(SB, (WALL_X0 + 3.3) / 2, -0.15, 2.2, 8.8, 0.3, 4.4, WHITE, 0, 0, 1.6); add(bufMesh(SB, std("#ffffff", { map: stoneT2, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.35) })));
    const STB = Buf(); addBox(STB, (A.stepX[0] + A.stepX[1]) / 2, A.stepTop / 2, (A.stepZ[0] + A.stepZ[1]) / 2, A.stepX[1] - A.stepX[0], A.stepTop, A.stepZ[1] - A.stepZ[0], WHITE, 0, 0, 1.2);
    const stp = bufMesh(STB, std("#ffffff", { map: copeT, vertexColors: true, emissive: new THREE.Color("#3a2a1a") })); stp.name = "set-step"; add(stp);
  }

  // ---------------------------------------------------------------- the double door: frame, leaves, glazing bars, amber glass, handle
  {
    const FB = Buf(), woodC = new THREE.Color("#4a2e20"), woodD = new THREE.Color("#33201a"), w = dx1 - dx0, hh = A.doorH, zf = -0.2;
    const bx = (x, y, z, ww, h2, d, c = woodC) => addBox(FB, x, y, z, ww, h2, d, c, 0, 0, 1);
    bx((dx0 + dx1) / 2, hh + 0.07, zf, w + 0.3, 0.14, 0.22); bx(dx0 - 0.07, hh / 2, zf, 0.14, hh, 0.22); bx(dx1 + 0.07, hh / 2, zf, 0.14, hh, 0.22);   // the outer frame
    bx((dx0 + dx1) / 2, 0.14, zf + 0.02, w, 0.28, 0.1, woodD);   // the bottom rails
    for (const [a, b] of [[dx0, (dx0 + dx1) / 2], [(dx0 + dx1) / 2, dx1]]) {
      const cx = (a + b) / 2, lw = b - a;
      bx(a + 0.035, hh / 2, zf + 0.02, 0.07, hh, 0.09); bx(b - 0.035, hh / 2, zf + 0.02, 0.07, hh, 0.09); bx(cx, hh - 0.035, zf + 0.02, lw, 0.07, 0.09);   // stiles and the top rail
      for (let r = 1; r <= 6; r++) bx(cx, 0.28 + (hh - 0.28) * r / 7 - 0.01, zf + 0.025, lw, 0.03, 0.05, woodD);   // 7 panes high
      bx(cx, 0.28 + (hh - 0.28) / 2, zf + 0.025, 0.03, hh - 0.28, 0.05, woodD);   // the middle bar of the leaf
    }
    bx((dx0 + dx1) / 2, hh / 2, zf + 0.04, 0.05, hh, 0.1, woodD);   // the meeting stile
    add(bufMesh(FB, std("#ffffff", { vertexColors: true, roughness: 0.6, emissive: new THREE.Color("#241408") })));
    const gm = basic({ map: ctex(doorGlassCanvas(rnd), 1, 1, false), toneMapped: false });
    for (const [a, b] of [[dx0, (dx0 + dx1) / 2], [(dx0 + dx1) / 2, dx1]]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.08, hh - 0.34), gm); q.position.set((a + b) / 2, 0.28 + (hh - 0.28) / 2 + 0.04, zf - 0.02); q.name = "set-doorglass"; add(q); }
    const brass = std("#2a2420", { roughness: 0.35, metalness: 0.8 });
    const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), brass); hd.position.set((dx0 + dx1) / 2 - 0.07, 1.05, zf + 0.12); add(hd);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.026, 0.026), brass); hl.position.set((dx0 + dx1) / 2 - 0.17, 1.05, zf + 0.2); add(hl);
    for (const sd of [-1, 1]) for (const yy of [0.3, 1.1, 1.9]) { const hg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), brass); hg.position.set(sd < 0 ? dx0 - 0.005 : dx1 + 0.005, yy, zf + 0.1); add(hg); }
  }

  // ---------------------------------------------------------------- the drainpipe, the plinth, the railing, the parapets
  {
    const P = []; const pipe = (y0, y1) => P.push([new THREE.CylinderGeometry(0.05, 0.05, y1 - y0, 12), M4(-0.15, (y0 + y1) / 2, 0.08)]);
    pipe(-0.3, 6.6); for (const y of [0.4, 1.7, 3.0, 4.3, 5.6]) P.push([new THREE.CylinderGeometry(0.068, 0.068, 0.07, 12), M4(-0.15, y, 0.08)], [new THREE.BoxGeometry(0.06, 0.07, 0.1), M4(-0.15, y, 0.02)]);
    add(mergedGeo(P, std("#22262e", { roughness: 0.5, metalness: 0.4 })));
    const PB = Buf(), rx0 = A.railing.x[0], rx1 = A.railing.x[1];
    addBox(PB, (rx0 + rx1) / 2, 0.14, 0.22, rx1 - rx0, 0.28, 0.56, WHITE, 0, 0, 1.2);   // the plinth
    for (let x = rx0; x < rx1 - 0.2; x += 0.55 + rK() * 0.45) { const L = Math.min(0.5 + rK() * 0.4, rx1 - x); addBox(PB, x + L / 2, 0.315, 0.22, L - 0.01, 0.07, 0.6, new THREE.Color(0.95 + rK() * 0.1, 0.95 + rK() * 0.1, 0.9 + rK() * 0.1), 0, 0, 1.2); }   // a coping course
    add(bufMesh(PB, std("#ffffff", { map: copeT, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.35) })));
    // the railing: a lathe baluster (shaft, three knuckles, collars), bottom rail with bolts, top rail, end posts with ball caps
    const rz = A.railing.z, topY = A.railing.top, y0 = 0.35, RP = [], n = Math.round((rx1 - rx0 - 0.2) / 0.26);
    const H = topY - y0 - 0.04;
    const bal = new THREE.LatheGeometry([[0.03, 0], [0.03, 0.04], [0.045, 0.06], [0.02, 0.1], [0.02, H * 0.3], [0.038, H * 0.32], [0.046, H * 0.35], [0.038, H * 0.38], [0.02, H * 0.41], [0.02, H * 0.55], [0.04, H * 0.58], [0.05, H * 0.62], [0.04, H * 0.66], [0.02, H * 0.69], [0.02, H * 0.9], [0.03, H * 0.93], [0.03, H]].map(([r, y]) => new THREE.Vector2(r, y)), 10);
    for (let k = 0; k <= n; k++) RP.push([bal, M4(rx0 + 0.13 + k * ((rx1 - rx0 - 0.26) / n), y0 + 0.02, rz)]);
    for (const x of [rx0 + 0.07, rx1 - 0.07]) RP.push([new THREE.BoxGeometry(0.1, topY - y0 + 0.06, 0.1), M4(x, (topY + y0) / 2, rz)], [new THREE.SphereGeometry(0.07, 12, 8), M4(x, topY + 0.1, rz)]);
    RP.push([new THREE.BoxGeometry(rx1 - rx0, 0.07, 0.08), M4((rx0 + rx1) / 2, y0 + 0.01, rz)], [new THREE.BoxGeometry(rx1 - rx0, 0.05, 0.1), M4((rx0 + rx1) / 2, topY - 0.02, rz)], [new THREE.CylinderGeometry(0.04, 0.04, rx1 - rx0, 10).rotateZ(Math.PI / 2), M4((rx0 + rx1) / 2, topY + 0.04, rz)]);
    for (let k = 0; k <= n; k++) RP.push([new THREE.SphereGeometry(0.03, 8, 6), M4(rx0 + 0.13 + k * ((rx1 - rx0 - 0.26) / n), y0 + 0.01, rz + 0.045)]);   // bolt heads on the bottom rail
    const rm = mergedGeo(RP, iron); rm.name = "set-railing"; add(rm);
    // the right parapet: ashlar 0.9 high, stepped coping stones (two courses, the upper one narrower), the left low wall
    const AB = Buf(), CB = Buf(), px = A.parapetX, pw = 0.55;
    addBox(AB, px + pw / 2, A.parapetTop / 2 - 0.05, 2.2, pw, A.parapetTop - 0.1, 4.5, WHITE, 0, 0, 1.6);
    for (let z = -0.05; z < 4.4; z += 0.5 + rK() * 0.35) { const L = Math.min(0.55 + rK() * 0.35, 4.4 - z), c = 0.9 + rK() * 0.15; addBox(CB, px + pw / 2, A.parapetTop - 0.01, z + L / 2, pw + 0.2, 0.17, L - 0.02, new THREE.Color(c, c * 0.98, c * 0.94), 0, 0, 1.3); addBox(CB, px + pw / 2, A.parapetTop + 0.13, z + L / 2 + 0.02, pw + 0.04, 0.16, L - 0.1, new THREE.Color(c * 1.06, c * 1.03, c * 0.98), 0, 0, 1.3); }
    addBox(AB, -5.65, 0.35, 2.2, 0.28, 0.7, 4.5, WHITE, 0, 0, 1.6);
    const pm = bufMesh(AB, std("#ffffff", { map: stoneT, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.35) })); pm.name = "set-parapet"; add(pm);
    const cm = bufMesh(CB, std("#ffffff", { map: copeT, vertexColors: true, emissive: NIGHT.clone().multiplyScalar(0.7) })); cm.name = "set-coping"; add(cm);
  }

  // ---------------------------------------------------------------- the door's light, painted: warm spill on the flags and on the wall, a glow in the air
  if ((S.glow ?? 1) > 0) {
    const gm = (rgb, op) => { const m = new THREE.MeshBasicMaterial({ map: ctex(glowCanvas(rgb), 1, 1, false), transparent: true, opacity: op * (S.glow ?? 1), depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; return m; };
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.4), gm("255,160,60", 0.55)); fl.rotation.x = -Math.PI / 2; fl.position.set(-1.25, 0.012, 1.55); fl.renderOrder = 2; fl.userData.solid = false; add(fl);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.8), gm("255,170,70", 0.4)); wl.position.set(-1.28, 1.3, 0.012); wl.renderOrder = 2; wl.userData.solid = false; add(wl);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), gm("255,190,90", 0.45)); st.rotation.x = -Math.PI / 2; st.position.set(-1.3, A.stepTop + 0.01, 0.55); st.renderOrder = 2; st.userData.solid = false; add(st);
  }

  // ---------------------------------------------------------------- foliage
  const FO = makeFoliage(rT, () => 0);
  if (S.trees !== false) {
    // the red maple behind the railing: its trunk rises from the garden 6 m below, left of the rail's start, leaning out over the rail; the crown fills the upper middle
    FO.maple(-0.5, -3.4, 12.0, "red", { y0: -6.2, trunk: 0.78, R: 2.3, clumpK: 0.5, r: 0.17, tones: ["red", "red", "orange", "wine", "red"], branches: 6, dens: 0.8, cardSz: 0.3, lean: [-0.9, 0.3], bias: [-0.15, 0.0] });
    // golden trees below the railing: their crowns reach just under the top rail and show through the balusters
    const gold = ["gold", "orange", "gold", "mix", "orange", "gold", "red", "gold"];
    [[-1.2, -2.3], [1.0, -2.5], [2.7, -2.1], [4.4, -3.2], [0.1, -5.0], [2.3, -5.4], [3.9, -6.6], [-2.8, -4.4], [5.8, -4.6], [-4.0, -3.0]].forEach(([x, z], k) => FO.maple(x, z, 6.4 + rT() * 0.7, gold[k % gold.length], { y0: -6.1, trunk: 0.38, R: 2.3 + rT() * 0.5, r: 0.14, branches: 5, tones: [gold[k % gold.length], "gold", "orange"], dens: 0.85 }));
    // the pot's red seedling: a bunch of maple leaves on thin stems rising from the pot
    const PS = Buf(), pot = A.pot, reds = ["#d9331f", "#e0561c", "#c8281c", "#e8751e", "#b01e1a"];
    for (let i = 0; i < 190; i++) {
      const u = rI() * 6.28, rr = Math.sqrt(rI()) * 0.38, hgt = 0.5 + rI() * 0.62 * (1 - rr * 0.5), nrm = new THREE.Vector3(Math.cos(u) * 0.5, 0.5 + rI() * 0.5, Math.sin(u) * 0.5 + 0.4).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = 0.13 + rI() * 0.1;
      addCard(PS, pot.x + Math.cos(u) * rr, hgt, pot.z + Math.sin(u) * rr * 0.9, a, b, sz, sz, nrm, tint(reds[Math.floor(rI() * reds.length)], rI, 0.012, 0.08, 0.08));
    }
    const pm = bufMesh(PS, leafMat, true, true); if (pm) { pm.frustumCulled = false; add(pm); }
    const stems = []; for (let i = 0; i < 9; i++) { const u = rI() * 6.28, rr = rI() * 0.2; stems.push(segMat(new THREE.Vector3(pot.x, 0.35, pot.z), new THREE.Vector3(pot.x + Math.cos(u) * rr, 0.75 + rI() * 0.3, pot.z + Math.sin(u) * rr), 0.012, 0.007)); }
    add(mergedGeo(stems, std("#4a2a22")));
    const lathe = new THREE.LatheGeometry([[0.2, 0], [0.26, 0.04], [0.32, 0.2], [0.34, 0.4], [0.31, 0.5], [0.34, 0.54], [0.34, 0.58], [0.3, 0.58], [0.28, 0.5]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
    const potM = std("#a8552e", { roughness: 0.8, emissive: new THREE.Color("#3a1a0c") }), pt = new THREE.Mesh(lathe, potM); pt.position.set(pot.x, 0, pot.z); pt.castShadow = pt.receiveShadow = true; add(pt);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), std("#2a1a14")); soil.rotation.x = -Math.PI / 2; soil.position.set(pot.x, 0.5, pot.z); add(soil);
    // ivy up the left wall: dense clusters of three-lobed leaves climbing from the floor to the top of the frame, round the door's left side, a few trailing at the top
    const IV = Buf(), iv = ["#a8b830", "#8fa83a", "#c8c840", "#6f9a3a", "#d8d048", "#b8a830", "#5f8a3a"], g3 = () => (rI() + rI() + rI() - 1.5) / 1.5;
    const cluster = (cx, cy, rx, ry, n, size = 1) => { for (let i = 0; i < n; i++) { const x = cx + g3() * rx, y = Math.max(0.1, cy + g3() * ry), nrm = new THREE.Vector3((rI() - 0.5) * 0.5, (rI() - 0.5) * 0.4, 1).normalize(), [a, b] = frameOf(nrm, rI() * 6.28), sz = (0.13 + rI() * 0.1) * size; addCard(IV, x, y, 0.03 + rI() * 0.12, a, b, sz, sz, nrm, tint(iv[Math.floor(rI() * iv.length)], rI, 0.012, 0.07, 0.08)); } };
    cluster(-2.55, 2.3, 0.35, 2.4, 520); cluster(-3.1, 4.2, 0.5, 1.8, 330); cluster(-2.3, 3.4, 0.2, 1.4, 160); cluster(-3.0, 0.7, 0.55, 0.7, 150); cluster(-2.05, 2.6, 0.12, 0.9, 80); cluster(-3.7, 2.0, 0.4, 1.8, 120);
    cluster(-2.9, 5.6, 0.7, 0.5, 90); cluster(-1.5, 2.6, 0.5, 0.18, 70); cluster(-1.2, 2.5, 0.65, 0.12, 50);
    add(bufMesh(IV, ivyMat, true, false));
    const wm = mergedGeo(FO.treeWood, std("#3a2a30", { roughness: 0.95 })); if (wm) { wm.name = "set-trunks"; add(wm); }
    const lm = bufMesh(FO.leafQ, leafMat, false, true); if (lm) { lm.frustumCulled = false; lm.name = "set-leaves"; add(lm); }
    const cm = bufMesh(FO.coreQ, coreMat, false, true); if (cm) { cm.frustumCulled = false; add(cm); }
  }

  // ---------------------------------------------------------------- the garden ground, and the town: dark slate roofs, lit windows, street lights
  {
    const mk = (w, h, y, z, col) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std(col, { roughness: 1 })); p.rotation.x = -Math.PI / 2; p.position.set(20, y, z); p.userData.solid = false; p.receiveShadow = true; add(p); return p; };
    mk(400, 14, -6.3, -8, "#161e38");
    // the slope down to the town: a strip of ground that falls 0.32 m per metre from z -14 to -22 m deep
    const GB = Buf(), zs = []; for (let z = -13; z > -160; z -= 4) zs.push(z);
    zs.forEach((z, i) => { for (const x of [-150, -40, 0, 40, 150]) { GB.p.push(x, groundZ(z), z); GB.n.push(0, 1, 0); GB.uv.push(0, 0); GB.c.push(1, 1, 1); } if (i) for (let j = 0; j < 4; j++) { const a0 = (i - 1) * 5 + j, c0 = i * 5 + j; GB.i.push(a0, a0 + 1, c0, a0 + 1, c0 + 1, c0); } });
    const gm = bufMesh(GB, std("#182038", { roughness: 1, vertexColors: true }), false, true); gm.userData.solid = false; add(gm);
    mk(1400, 800, -91, -500, "#12182c");
  }
  if (S.town === true) {   // the near 3D houses are off by default: the painted town fills the view past the rail
    const WB = Buf(), RB = Buf(), LW = Buf(), DW = Buf(), tones = ["#6a6482", "#645e84", "#746c88", "#5e587a", "#58648a", "#7a7090"];
    const house = (x, z, w, d, h, ry) => {
      const y0 = groundZ(z) - 0.1;
      const c = new THREE.Color(tones[Math.floor(rH() * tones.length)]).multiplyScalar(0.55 + rH() * 0.3), ca = Math.cos(ry), sa = Math.sin(ry);
      addBox(WB, x, y0 + h / 2, z, w, h, d, c, ry, 0, 1.0);
      const ang = 0.66 + rH() * 0.1, half = w / 2 + 0.3, L = half / Math.cos(ang), rise = Math.tan(ang) * half, rc = new THREE.Color("#8a94bc").multiplyScalar(0.7 + rH() * 0.4);
      for (const sd of [-1, 1]) { const lx = sd * half / 2, ly = h + rise / 2; addBox(RB, x + lx * ca, y0 + ly, z - lx * sa, L, 0.18, d + 0.7, rc, ry, -sd * ang, 1.5); }
      addBox(WB, x + (w * 0.2) * ca, y0 + h + rise + 0.5, z - (w * 0.2) * sa, 0.9, 1.6, 0.9, c.clone().multiplyScalar(0.55), ry, 0, 1.0);   // a chimney
      const nx = Math.max(2, Math.round(w / 2.1)), nyy = h > 5.4 ? 2 : 1;
      for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < nyy; iy++) {
        const lx = -w / 2 + (ix + 0.5) * (w / nx), ly = 1.7 + iy * 2.7, on = rH() < 0.62, wc = on ? tint(["#ffd070", "#ffbf50", "#ffe090", "#ffc060"][Math.floor(rH() * 4)], rH, 0.01, 0.05, 0.06) : new THREE.Color("#1c2440");
        const nrm = new THREE.Vector3(sa, 0, ca), t1 = new THREE.Vector3(ca, 0, -sa), cx = x + lx * ca + (d / 2 + 0.02) * sa, cz = z - lx * sa + (d / 2 + 0.02) * ca;
        addCard(on ? LW : DW, cx, y0 + ly, cz, t1, Y, 0.85, 1.25, nrm, wc);
        if (on && rH() < 0.5) addCard(LW, cx, y0 + ly, cz, t1, Y, 0.3, 0.4, nrm, new THREE.Color("#ffe8b0"));
      }
    };
    // 22 houses on the slope between 16 and 62 m, nearer ones lower and bigger on screen
    const spots = [[3, -19], [10, -22], [17, -27], [-3, -24], [-9, -22], [-14, -29], [24, -31], [30, -26], [6, -33], [-6, -36], [14, -38], [22, -42], [-15, -42], [36, -36]];
    spots.forEach(([x, z], i) => house(x + (rH() - 0.5) * 3, z + (rH() - 0.5) * 2, 7 + rH() * 4.5, 6.5 + rH() * 3, 4.6 + rH() * 2.2, (rH() - 0.5) * 0.5));
    add(bufMesh(WB, std("#ffffff", { vertexColors: true, roughness: 1, emissive: new THREE.Color("#12162a") }), true, true));
    add(bufMesh(RB, std("#ffffff", { map: ctex(slateCanvas(rnd), 1.2, 1.2), vertexColors: true, roughness: 0.8, emissive: new THREE.Color("#10142a") }), true, true));
    const lw = bufMesh(LW, basic({ vertexColors: true, toneMapped: false }), false, false); if (lw) { lw.userData.solid = false; add(lw); }
    const dw = bufMesh(DW, basic({ vertexColors: true }), false, false); if (dw) { dw.userData.solid = false; add(dw); }
    // street lights: warm dots along the lanes between the houses
    const DOT = Buf(); for (let i = 0; i < 260; i++) { const x = -26 + rH() * 70, z = -16 - rH() * 28, y = groundZ(z); addCard(DOT, x, y + 0.4, z, X, Y, 0.55, 0.55, Z, tint("#ffd08a", rH, 0.01, 0.05, 0.08)); }
    const dm = bufMesh(DOT, new THREE.MeshBasicMaterial({ map: dotT, vertexColors: true, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }), false, false); if (dm) { dm.userData.solid = false; dm.frustumCulled = false; add(dm); }
  }

  // ---------------------------------------------------------------- fallen leaves on the flags
  {
    const LD = Buf(), cols = ["#d9331f", "#e0561c", "#c8281c", "#e8751e", "#f0a21f", "#a8221a"], g2 = () => (rG() + rG() + rG() - 1.5) / 1.5;
    for (let i = 0; i < 90; i++) {
      const pile = i < 60, x = pile ? [-2.9, 0.6, 3.0, -0.4, 2.1][i % 5] + g2() * 0.9 : -4.5 + rG() * 7.8, z = pile ? [0.5, 0.4, 3.6, 3.3, 0.7][i % 5] + g2() * 0.5 : 0.3 + rG() * 4;
      if (x > -2.0 && x < -0.58 && z < 0.52) continue;
      const [a, b] = frameOf(flat, rG() * 6.28), s = 0.12 + rG() * 0.08; addCard(LD, x, 0.008 + rG() * 0.004, z, a, b, s, s, flat, tint(cols[Math.floor(rG() * cols.length)], rG, 0.014, 0.08, 0.08));
    }
    const lm = bufMesh(LD, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, emissive: new THREE.Color("#3a1408") }), false, true); if (lm) { lm.userData.solid = false; add(lm); }
    const nD = 10, geo = new THREE.PlaneGeometry(0.15, 0.15), drift = [], dm = cols.map((c) => lam(new THREE.Color(c), { map: mapleT, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#3a1408") }));
    for (let i = 0; i < nD; i++) { const o = new THREE.Mesh(geo, dm[i % dm.length]); o.userData.solid = false; set.add(o); drift.push({ o, T: 9 + (i * 5 % 6), ph: (i * 0.618) % 1, x0: -1 + 5 * ((i * 0.381966) % 1), z0: -1 + 4 * ((i * 0.7548776) % 1), sw: 0.5 + (i % 4) * 0.3, sp: 1.2 + (i % 5) * 0.5 }); }
    const tick = (t) => { for (const d of drift) { const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28; d.o.position.set(d.x0 + 1.2 * u + d.sw * Math.sin(ang), 3.6 * (1 - u) + 0.04, d.z0 + 0.5 * Math.cos(ang * 0.8)); d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8); } };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }

  // ---------------------------------------------------------------- the painted far backdrop (the town, the church tower, the hills)
  if (S.backdrop !== false) {
    const CA = A.camA, ya = CA.yaw * DEG, DC = 165, CP = new THREE.Vector3(...CA.pos);
    // the crop of the 1536 x 1024 painting: the town, the church tower and the hills right of the maple (the maple's red leaves are keyed out)
    const SX = 740, SY = 140, SW = 796, SH = 450, HZ = 262, KB = S.backdropK ?? 1.5, AX = S.backdropX ?? -0.65, DYB = S.backdropLift ?? 0.1, NQ = 5;
    const tV = Math.tan(THREE.MathUtils.degToRad(CA.fov / 2)), tH = tV * 16 / 9, PA = 1.5 / (16 / 9);   // the painting fills the frame's width; it is 1/PA screens high
    // KB times the painting's own size about its horizon row, which sits on the true horizon; the cards stand upright and square-on to their own ray
    const ndcX = (px) => AX + KB * ((px / 1536) * 2 - 1), ndcY = (py) => KB * ((1 - (2 * py) / 1024) - (1 - (2 * HZ) / 1024)) / PA + DYB;
    const x0 = ndcX(SX), x1 = ndcX(SX + SW), y0 = ndcY(SY), y1 = ndcY(SY + SH), hN = y0 - y1, yc = (y0 + y1) / 2;
    const az0 = Math.atan(tH * x0), az1 = Math.atan(tH * x1), dphi = az1 - az0, azc = (az0 + az1) / 2, ce = Math.cos(dphi / 2), mats = [];
    const Wm = 2 * DC * Math.tan(dphi / 2), Hm = DC * tV * hN / ce;   // both cards at a join stand the same distance from the camera, so the join is seamless
    for (let k = 0; k < NQ; k++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: "#ffffff" }); mat.userData.noOutline = true; mats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 1.004, Hm), mat); mesh.name = "set-backdrop"; mesh.renderOrder = -1; mesh.userData.solid = false; mesh.frustumCulled = false;
      const hd = ya + azc + k * dphi, fk = new THREE.Vector3(Math.sin(hd), 0, -Math.cos(hd)), rk = new THREE.Vector3(Math.cos(hd), 0, Math.sin(hd));
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(rk, Y, fk.clone().negate()));
      mesh.position.copy(CP).addScaledVector(fk, DC).addScaledVector(Y, DC * tV * yc / ce); add(mesh);
    }
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/BA.webp").then((img) => {
      for (let k = 0; k < NQ; k++) {
        const [c, g] = canvas(SW * 2, SH * 2); g.imageSmoothingQuality = "high"; if (k % 2) { g.translate(SW * 2, 0); g.scale(-1, 1); }
        g.drawImage(img, SX, SY, SW, SH, 0, 0, SW * 2, SH * 2); g.setTransform(1, 0, 0, 1, 0, 0);
        const id = g.getImageData(0, 0, c.width, c.height), d = id.data, Wc = c.width, Hc = c.height;
        for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
          const i = (y * Wc + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2], L = 0.3 * R + 0.59 * G + 0.11 * B, px = SX + (k % 2 ? Wc - 1 - x : x) / 2;
          let a = 1;
          if (k === 0 || k === 1) { const red = Math.min(1, Math.max(0, (R - G - 60) / 50)) * Math.min(1, Math.max(0, (R - B - 70) / 40)); a *= 1 - red * Math.min(1, Math.max(0, (950 - px) / 120)); }   // the maple's red leaves on the painting's left
          d[i] = Math.min(255, L + (R - L) * 1.25); d[i + 1] = Math.min(255, L + (G - L) * 1.2); d[i + 2] = Math.min(255, (L + (B - L) * 1.25) * 1.04);   // a little more colour
          const et = Math.min(1, y / 100); a *= et * et * (3 - 2 * et);
          if (k === 0) { const e = Math.min(1, x / 260); a *= e * e * (3 - 2 * e); } if (k === NQ - 1) { const e = Math.min(1, (Wc - 1 - x) / 200); a *= e * e * (3 - 2 * e); }
          const eb = Math.min(1, (Hc - 1 - y) / 120); a *= eb * eb * (3 - 2 * eb); d[i + 3] = Math.round(a * 255);
        }
        g.putImageData(id, 0, 0);
        const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; mats[k].map = tx; mats[k].needsUpdate = true;
      }
    }));
  }
  return set;
}
