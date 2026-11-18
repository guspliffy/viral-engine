// "scoreroad": the hill road of "I could see everyone's happiness score" (Happiness 03, panel 38, painting plates/painted/HR.webp).
// REAL 3D geometry with hand-painted canvas textures (the painting is only the look target): a winding country road of
// packed dirt and gravel (wheel ruts, pebbles, grass spilling in from the edges), a dry-stone wall of 3D boulders on the left with a grassy bank, shrubs and
// big maples (3D trunks and branches, leaf cards) leaning over it, a weathered wooden post-and-rail fence on the right and the
// meadow falling away below it into the valley (round autumn trees, then one painted far backdrop card cut from HR.webp: the
// town, its church towers and the far hills; the sky is a painted dome). Fallen leaves in drifts at the road edges and the wall foot,
// grass tufts, a few leaves drifting down.
//
// COORDINATES (metres, y up). The road runs from the camera away DOWN the hill, bending right (+x). ROAD.at(s, q) gives any point:
// s = metres along the centre line from the origin (the bikes ride toward smaller s, i.e. toward the camera, which stands near
// s -3 and looks along -z), q = metres to the RIGHT of the centre line (+q is the fence side, -q the wall side).
//   centre line   (0,0) at s 0; heading (degrees from -z toward +x, the road bends right): 6 at s 0, 7 at s 5, 11 at s 10, 23 at s 20, 40 at s 40, 56 at s 60 (ROAD.at(s, q) gives x, y, z, heading)
//   road surface  q -1.5 .. 1.5 (3.0 m wide, a dirt and gravel lane, ruts at q +-0.7, the edge fades into grass to q +-1.7), y 0 up to s 10 (FLAT where the bikes ride, as the design asks), then it falls: y = -(0.09 d + 0.0012 d^2), d = s - 10
//   no kerb       (spec kerb: true adds the old setts)
//   dry-stone wall  face q -2.25, 0.5 deep, 1.1-1.25 m high (3 courses of boulders and a cap), the bank rises behind it (grass, shrubs, maples)
//   fence         q +3.3: posts 0.13 sq, 1.1 m, every 2.2 m, two rails (y 0.55, 0.92); grass verge q 1.7 .. 3.3
//   meadow        beyond the fence the ground falls away (0.22 m per m, steeper further out) to the valley 24 m below at q 46
//   far backdrop  one card 165 m out cut from plates/painted/HR.webp (the town and hills right of the trees), aligned to the painting's camera CAM_A
// ROAD (exported) has the numbers: ROAD.at(s, q) -> {x, y, z, heading}, ROAD.lanes (bike lane offsets q: left -0.6, right +0.7), ROAD.camA (the painting's camera).
//
// spec (every key optional):
//   seed 5          the painted textures and the layout of leaves, tufts and shrubs
//   wind 1          leaves shiver (0 off)
//   leaves 24       leaves drifting down past the camera (0 none)
//   trees true      the maples, shrubs and the valley trees
//   backdrop true   the painted far card (needs plates/painted/HR.webp served from the repo root)
//   fallen 1        fallen-leaf multiplier (0 none)
// Light: "light": "golden", a key like [5, 3.6, 3] (the late sun from the right and behind the camera, so the wall face and the fence
// are lit and the trees' shadows fall up the bank) and "shadowSize": 12 (looks.js: half the shadow map in metres, centred on the origin).
// Nothing but the wall, the fence, the kerb and the road is solid for the checks; trees, tufts and the card are scenery.
// Triangles: about 200k (leaf cards 70 %).  Deterministic: util.js rng and pure functions of the frame time (globalThis.__setTicks).

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
    g.strokeStyle = u < 0.4 ? "rgba(52,100,44,0.16)" : u < 0.8 ? "rgba(214,232,130,0.16)" : "rgba(222,176,70,0.14)"; g.lineWidth = 1.4;
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
  function clump(c, r, tone, scaleY = 0.78, cards = null, cardSz = 0.27, dens = 1, coreK = 0.5) {
    const pal = TONES[tone].map((h) => new THREE.Color(h)), n = Math.max(12, Math.round((cards ?? Math.round(80 + 240 * r)) * dens)), dark = pal[0].clone().lerp(pal[1], 0.5).multiplyScalar(0.5), kc = 0.72 + rT() * 0.5;
    cardSz *= 1 / Math.sqrt(dens);
    const ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ip = ico.attributes.position, b0 = coreQ.p.length / 3;
    for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i); coreQ.p.push(c.x + x * r * coreK, c.y + y * r * coreK * scaleY, c.z + z * r * coreK); _n.set(x, y, z).normalize(); coreQ.n.push(_n.x, _n.y, _n.z); coreQ.uv.push(0, 0); coreQ.c.push(dark.r, dark.g, dark.b); coreQ.i.push(b0 + i); }
    ico.dispose();
    for (let i = 0; i < n; i++) {
      const u = rT() * 2 - 1, th = rT() * 6.2832, rr = Math.sqrt(1 - u * u), d = new THREE.Vector3(rr * Math.cos(th), u * scaleY, rr * Math.sin(th));
      const rad = r * (i % 3 === 0 ? 0.3 + rT() * 0.45 : 0.7 + rT() * 0.32), p = new THREE.Vector3(c.x + d.x * rad, c.y + d.y * rad, c.z + d.z * rad);
      const nrm = new THREE.Vector3(d.x, d.y / scaleY * 0.9 + 0.15, d.z).normalize(), [a, b] = frameOf(nrm, rT() * 6.28), s = cardSz * (0.75 + rT() * 0.5);
      addCard(leafQ, p.x, p.y, p.z, a, b, s, s, nrm, tint(TONES[tone][Math.floor(rT() * TONES[tone].length)], rT, 0.014, 0.08, 0.09).multiplyScalar(kc * (0.62 + 0.62 * (u * 0.5 + 0.5))));
    }
  }
  // o: trunk (share of h), R (crown radius), r (trunk radius), branches, tones, y0, lean [dx, dz] (trunk-top offset in m), dens
  function maple(x, z, h, tone, o = {}) {
    const y0 = o.y0 ?? groundY(x, z) + 0.05, lx = o.lean ? o.lean[0] : (rT() - 0.5) * 0.12 * h * 0.5, lz = o.lean ? o.lean[1] : 0, R = o.R ?? h * 0.36, dens = o.dens ?? 1;
    const trunkH = h * (o.trunk ?? 0.5), pts = [0, 0.25, 0.5, 0.75, 1].map((k) => new THREE.Vector3(x + lx * k * k + Math.sin(k * 3 + x) * 0.05, y0 + k * trunkH, z + lz * k * k));
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
      if (rT() < 0.85) { const d2 = dir.clone().applyAxisAngle(Yaxis, (rT() < 0.5 ? -1 : 1) * (0.6 + rT() * 0.5)), e2 = mid.clone().addScaledVector(d2, L * 0.55).add(new THREE.Vector3(0, L * 0.12, 0)); treeWood.push(segMat(mid, e2, rb * 0.4, 0.02)); clump(e2, R * (0.3 + rT() * 0.14), tn(), 0.78, null, o.cardSz ?? 0.27, dens); }
      clump(tip, R * (0.34 + rT() * 0.16), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
      clump(tip.clone().add(new THREE.Vector3((rT() - 0.5) * R * 0.5, R * (0.2 + rT() * 0.2), (rT() - 0.5) * R * 0.5)), R * (0.26 + rT() * 0.12), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
      clump(mid.clone().addScaledVector(dir, L * 0.18).add(new THREE.Vector3(0, 0.2, 0)), R * (0.26 + rT() * 0.1), tn(), 0.78, null, o.cardSz ?? 0.27, dens);
    }
    clump(top.clone().add(new THREE.Vector3(0, R * 0.55, 0)), R * 0.42, tone, 0.78, null, o.cardSz ?? 0.27, dens);
    clump(top.clone().add(new THREE.Vector3(R * 0.3, R * 0.2, -R * 0.2)), R * 0.36, tone, 0.78, null, o.cardSz ?? 0.27, dens);
  }
  function shrub(x, z, r, tone, y0 = null, cardSz = 0.17) { const y = (y0 ?? groundY(x, z)) + r * 0.55; clump(new THREE.Vector3(x, y, z), r, tone, 0.72, Math.round(200 + 420 * r), cardSz * 0.78, 1, 0.16); }
  return { clump, maple, shrub, treeWood, leafQ, coreQ };
}

// ================================================================================================================ painters
const lerpc = (a, b, t) => a + (b - a) * t;
// packed dirt and gravel lane: warm brown-grey earth, two wheel ruts (q +-0.7) with a worn hump between, pebbles and fine gravel, grass and
// olive moss creeping in from the edges (|q| > 1.2), the dapple of leaf shadows. 6 m square: x along the road, y across it (canvas y = S (1 - q/6), wrapped).
function roadCanvas(rnd, S = 2048) {
  const [c, g] = canvas(S, S), ppm = S / 6, qOf = (y) => { const v = 1 - y / S, w = ((v % 1) + 1) % 1; return (w > 0.5 ? w - 1 : w) * 6; };
  const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const dirt = [150, 124, 100], rut = [112, 90, 74], hump = [166, 140, 108], grassE = [128, 132, 62];
  for (let y = 0; y < S; y += 2) {
    const q = qOf(y), aq = Math.abs(q), r = Math.exp(-(((aq - 0.7) / 0.2) ** 2)), h = Math.exp(-((aq / 0.32) ** 2)), e = Math.min(1, Math.max(0, (aq - 1.12) / 0.4));
    let col = mixc(mixc(dirt, rut, r * 0.9), hump, h * 0.6); col = mixc(col, grassE, e * e * 0.75);
    g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; g.fillRect(0, y, S, 2);
  }
  const wrap = (x, y, rr, fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const gx = x + ox, gy = y + oy; if (gx < -rr || gx > S + rr || gy < -rr || gy > S + rr) continue; fn(gx, gy); } };
  // earth mottling: big soft patches of lighter and darker dirt
  for (let i = 0; i < 260; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 30 + rnd() * 110, tc = [[196, 164, 124], [96, 76, 62], [170, 140, 112], [128, 112, 100]][i % 4], a = 0.1 + rnd() * 0.12; wrap(cx, cy, rr, (gx, gy) => { const rg = g.createRadialGradient(gx, gy, 0, gx, gy, rr); rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${a})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(gx - rr, gy - rr, 2 * rr, 2 * rr); }); }
  // fine gravel grit
  for (let i = 0; i < 52000; i++) { const x = rnd() * S, y = rnd() * S, q = Math.abs(qOf(y)); if (q > 1.5) continue; g.fillStyle = rnd() < 0.5 ? `rgba(70,54,44,${0.2 + rnd() * 0.3})` : `rgba(232,210,176,${0.14 + rnd() * 0.3})`; g.fillRect(x, y, 1.5 + rnd() * 3, 1.5 + rnd() * 3); }
  // pebbles: light tops, dark shadow edge; more in the ruts' shoulders and at the edges
  for (let i = 0; i < 2200; i++) {
    const x = rnd() * S, y = rnd() * S, q = Math.abs(qOf(y)); if (q > 1.5) continue;
    const big = rnd() < 0.05, rr = (big ? 7 : 2.5) + rnd() * (big ? 8 : 4.5), tone = [[170, 148, 124], [150, 130, 110], [182, 154, 120], [128, 112, 100], [160, 134, 104]][Math.floor(rnd() * 5)], k = 0.8 + rnd() * 0.35;
    wrap(x, y, rr * 2, (gx, gy) => { g.fillStyle = "rgba(60,44,34,0.3)"; g.beginPath(); g.ellipse(gx + rr * 0.25, gy + rr * 0.32, rr * 1.1, rr * 0.8, 0, 0, 7); g.fill(); g.fillStyle = `rgb(${Math.round(tone[0] * k)},${Math.round(tone[1] * k)},${Math.round(tone[2] * k)})`; g.beginPath(); g.ellipse(gx, gy, rr * 1.05, rr * 0.78, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,236,206,0.14)"; g.beginPath(); g.ellipse(gx - rr * 0.22, gy - rr * 0.25, rr * 0.5, rr * 0.3, 0, 0, 7); g.fill(); });
  }
  // grass blades and moss spilling in from both edges, and a few thin tufts on the hump
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * S, sgn = rnd() < 0.5 ? 1 : -1, d = rnd() * rnd() * 0.75 + 0.02, q = sgn * (1.5 - d), y = S * (1 - ((q / 6) % 1 + 1) % 1), L = 8 + rnd() * 26, a = -1.57 + (rnd() - 0.5) * 1.5 + (sgn > 0 ? 0 : 3.14), gc = [[132, 150, 58], [176, 168, 62], [96, 126, 52], [204, 170, 64], [150, 134, 54]][Math.floor(rnd() * 5)];
    wrap(x, y, L + 6, (gx, gy) => { g.strokeStyle = `rgba(${gc[0]},${gc[1]},${gc[2]},${0.55 + rnd() * 0.4})`; g.lineWidth = 1.4 + rnd() * 1.8; g.beginPath(); g.moveTo(gx, gy); g.quadraticCurveTo(gx + Math.cos(a) * L * 0.5 + (rnd() - 0.5) * 8, gy + Math.sin(a) * L * 0.5, gx + Math.cos(a) * L, gy + Math.sin(a) * L); g.stroke(); });
  }
  for (let i = 0; i < 90; i++) { const x = rnd() * S, y = S * (1 - ((((rnd() - 0.5) * 0.5) / 6) % 1 + 1) % 1), L = 10 + rnd() * 22; wrap(x, y, L + 6, (gx, gy) => { for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(${150 + k * 8},${150 + rnd() * 20},64,0.7)`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(gx + k * 2, gy); g.lineTo(gx + k * 2 + (rnd() - 0.5) * 12, gy - L * (0.5 + rnd() * 0.6)); g.stroke(); } }); }
  // dapple: soft violet-brown patches of leaf shadow in loose groups
  for (let k = 0; k < 20; k++) {
    const cx = rnd() * S, cy = rnd() * S, n = 12 + Math.floor(rnd() * 12), sp = 90 + rnd() * 110;
    for (let i = 0; i < n; i++) { const px = cx + (rnd() - 0.5) * sp * 3, py = cy + (rnd() - 0.5) * sp * 2, rr = 14 + rnd() * 38; wrap(px, py, rr, (gx, gy) => { const rg = g.createRadialGradient(gx, gy, 0, gx, gy, rr); rg.addColorStop(0, `rgba(76,52,70,${0.13 + rnd() * 0.08})`); rg.addColorStop(0.7, "rgba(76,52,70,0.07)"); rg.addColorStop(1, "rgba(76,52,70,0)"); g.fillStyle = rg; g.fillRect(gx - rr, gy - rr, 2 * rr, 2 * rr); }); }
  }
  return c;
}
// the kerb: a row of rounded setts (0.2-0.3 m long), a dark joint, a lit top. 2 m long x 0.36 m wide.
function settCanvas(rnd) {
  const W = 1024, H = 192, [c, g] = canvas(W, H);
  g.fillStyle = "#4a4048"; g.fillRect(0, 0, W, H);
  const pal = ["#a39aa0", "#948c96", "#b2a8a8", "#857f8c", "#bcaea6", "#9a929a", "#c2b2a4"];
  for (const w of fitRun(rnd, W, 100, 150)) {
    const x = (c._x = (c._x || 0)), base = pal[Math.floor(rnd() * pal.length)], k = 0.92 + rnd() * 0.16;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(base, k * 1.14)); gr.addColorStop(1, shade(base, k * 0.84));
    g.fillStyle = gr; g.beginPath(); g.roundRect(x + 5, 8, w - 10, H - 16, 26); g.fill();
    g.fillStyle = "rgba(255,246,236,0.22)"; g.beginPath(); g.ellipse(x + w * 0.42, 52, w * 0.3, 20, 0, 0, 7); g.fill();
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(48,40,56,${0.1 + rnd() * 0.14})`; g.beginPath(); g.arc(x + 12 + rnd() * (w - 24), 14 + rnd() * (H - 28), 1 + rnd() * 2.4, 0, 7); g.fill(); }
    c._x = x + w;
  }
  return c;
}
// a boulder of the dry-stone wall: warm grey-lilac stone, mottled, lichen and a little moss, pitted
function rockCanvas(rnd, S = 512) {
  const [c, g] = canvas(S, S);
  const gr = g.createLinearGradient(0, 0, S * 0.4, S); gr.addColorStop(0, "#c2b5a8"); gr.addColorStop(1, "#9a8f8e"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) { const tc = [[130, 112, 110], [214, 196, 170], [150, 150, 140], [176, 150, 130], [96, 92, 100]][i % 5], cx = rnd() * S, cy = rnd() * S, rr = 30 + rnd() * 120, rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(${tc[0]},${tc[1]},${tc[2]},${0.18 + rnd() * 0.2})`); rg.addColorStop(1, `rgba(${tc[0]},${tc[1]},${tc[2]},0)`); g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }
  for (let i = 0; i < 20; i++) { const cx = rnd() * S, cy = rnd() * S, rr = 8 + rnd() * 30; g.fillStyle = `rgba(${rnd() < 0.5 ? "168,176,110" : "108,140,70"},${0.25 + rnd() * 0.25})`; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(cx + (rnd() - 0.5) * rr * 1.6, cy + (rnd() - 0.5) * rr, 2 + rnd() * rr * 0.4, 0, 7); g.fill(); } }   // lichen and moss
  for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < 0.7 ? `rgba(70,56,52,${0.14 + rnd() * 0.22})` : `rgba(255,244,226,${0.12 + rnd() * 0.16})`; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.4, 1 + rnd() * 2.4); }
  g.strokeStyle = "rgba(66,52,50,0.3)"; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 90; y += (rnd() - 0.2) * 60; g.lineTo(x, y); } g.stroke(); }
  return c;
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
// a tuft of grass blades fanning up from the bottom middle (white; the vertex colour tints it)
function tuftCanvas(rnd) {
  const S = 128, [c, g] = canvas(S, S);
  for (let i = 0; i < 30; i++) {
    const a = (i / 29 - 0.5) * 1.7 + (rnd() - 0.5) * 0.2, L = 62 + rnd() * 58, bend = (rnd() - 0.5) * 36, x0 = 64 + (rnd() - 0.5) * 16, w = 2.0 + rnd() * 1.8;
    const tx = x0 + Math.sin(a) * L + bend, ty = S - 2 - Math.cos(a) * L;
    const gr = g.createLinearGradient(0, S, 0, ty); gr.addColorStop(0, "#9a9a9a"); gr.addColorStop(1, "#ffffff"); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x0 - w, S); g.quadraticCurveTo(x0 + Math.sin(a) * L * 0.5, S - Math.cos(a) * L * 0.55, tx, ty); g.quadraticCurveTo(x0 + Math.sin(a) * L * 0.5 + w * 1.2, S - Math.cos(a) * L * 0.5, x0 + w, S); g.fill();
  }
  return c;
}
// the sky all round: equirect, u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z. Blue to a warm peach horizon, lilac-pink clouds, far blue hills along the horizon.
function skyCanvas(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), hz = H / 2;
  const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#5d90cf"); gr.addColorStop(0.4, "#8cb6dc"); gr.addColorStop(0.68, "#c4d4d8"); gr.addColorStop(0.88, "#ecdcc4"); gr.addColorStop(1, "#f2d4a6");
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2); { const lg = g.createLinearGradient(0, hz, 0, H); lg.addColorStop(0, "#c9bd8a"); lg.addColorStop(0.15, "#aaa56a"); lg.addColorStop(1, "#8e9456"); g.fillStyle = lg; g.fillRect(0, hz, W, hz); }
  const puff = (cx, cy, r, sx, col) => { for (const ox of [-W, 0, W]) { const q = g.createRadialGradient(cx + ox - r * 0.25, cy - r * 0.3, r * 0.1, cx + ox, cy, r); q.addColorStop(0, col + "b8"); q.addColorStop(0.7, col + "88"); q.addColorStop(1, col + "00"); g.fillStyle = q; g.beginPath(); g.ellipse(cx + ox, cy, r * sx, r, 0, 0, 7); g.fill(); } };
  for (let k = 0; k < 12; k++) { const u = (k + rnd() * 0.8) / 12 * W, base = hz - (60 + rnd() * 250), n = 7 + Math.floor(rnd() * 10), big = 0.6 + rnd(); for (let i = 0; i < n; i++) puff(u + (rnd() - 0.5) * 170 * big, base - rnd() * 24 * big, (14 + rnd() * 26) * big, 1.7, rnd() < 0.5 ? "#f6e4d6" : "#ecd6dc"); }
  [["#b7c2c4", 30, 0.7], ["#98aeb0", 22, 1.2], ["#7f9c94", 12, 2.0]].forEach(([col, hgt, f], li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, hz - Math.max(2, hgt * (0.55 + 0.45 * Math.sin(x * 0.006 * f + li * 2) * Math.sin(x * 0.0023 + li)) + (hash2(Math.floor(x / 5), li, 3) - 0.5) * 6));
    g.lineTo(W, hz + 4); g.fill();
  });
  const hg = g.createLinearGradient(0, hz - 24, 0, hz + 10); hg.addColorStop(0, "rgba(246,220,176,0)"); hg.addColorStop(0.7, "rgba(246,200,140,0.5)"); hg.addColorStop(1, "rgba(246,220,176,0)"); g.fillStyle = hg; g.fillRect(0, hz - 24, W, 34);
  return c;
}

// ================================================================================================================ the road's line
// Centre line by integrating a heading a(s) (0 = toward -z, positive turns right, toward +x). Gentle enough (radius > 50 m) that a ribbon
// of ground 76 m wide never folds. ROAD.at(s, q) is the one place the numbers live.
const S_MIN = -14, S_MAX = 175, FLAT_S = 10;
const headingAt = (s) => 0.1 + 0.55 * smooth(s / 38) + 0.5 * smooth((s - 30) / 50) - 0.95 * smooth((s - 100) / 60);
const roadY = (s) => { const d = Math.max(0, s - FLAT_S); return -(0.09 * d + 0.0012 * d * d); };
const FR = (() => {
  const ds = 0.25, N = Math.round((S_MAX - S_MIN) / ds) + 1, xs = new Float64Array(N), zs = new Float64Array(N), th = new Float64Array(N);
  let x = 0, z = 0;
  for (let i = 0; i < N; i++) { const s = S_MIN + i * ds, a = headingAt(s); xs[i] = x; zs[i] = z; th[i] = a; x += Math.sin(a) * ds; z -= Math.cos(a) * ds; }
  const k0 = Math.round(-S_MIN / ds), ox = xs[k0], oz = zs[k0];
  const at = (s, q = 0) => {
    const k = Math.min(N - 1.001, Math.max(0, (s - S_MIN) / ds)), i = Math.floor(k), f = k - i, a = headingAt(s);
    const px = xs[i] + (xs[i + 1] - xs[i]) * f - ox, pz = zs[i] + (zs[i + 1] - zs[i]) * f - oz, nx = Math.cos(a), nz = Math.sin(a);
    return { x: px + q * nx, z: pz + q * nz, y: roadY(s), heading: a / DEG, th: a, nx, nz, tx: Math.sin(a), tz: -Math.cos(a) };
  };
  return { at };
})();
// the ground profile across the road: height above the road's own level at lateral offset q (the bank rises on the wall side, the meadow
// falls away on the fence side). Noise is added by the builder.
const WALL_Q = -2.25, FENCE_Q = 3.3;
function lift(q) {
  if (q < 0) {
    if (q > -2.4) return -0.05;
    if (q > -2.75) return -0.05 + 0.95 * smooth((-q - 2.4) / 0.35);
    if (q > -3.3) return 0.9 + 0.25 * ((-q - 2.75) / 0.55);
    const u = -q - 3.3; return 1.15 + 7 * (1 - Math.exp(-u / 11));
  }
  if (q < 2.4) return -0.05;
  if (q < FENCE_Q) return -0.05 - 0.03 * (q - 2.4);
  const d = q - FENCE_Q; return -0.08 - Math.min(40, 0.35 * d + 0.02 * d * d);
}
export const ROAD = {
  at: (s, q = 0) => { const p = FR.at(s, q); return { x: +p.x.toFixed(3), y: +(roadY(s)).toFixed(3), z: +p.z.toFixed(3), heading: +p.heading.toFixed(2) }; },
  width: 3.0, wallQ: WALL_Q, fenceQ: FENCE_Q, flatS: FLAT_S, lanes: { left: -0.6, right: 0.7 },
  camA: { pos: [-0.5, 1.0, 2.6], yaw: 5, pitch: 13, fov: 60 },   // the painting's camera (the bench's shot (a)): yaw degrees right of -z, pitch degrees down, vertical fov
};

// ================================================================================================================ the set
export function buildScoreRoad(scene, S = {}) {
  const seed = S.seed ?? 5, rnd = rng(seed * 7919 + 13), set = new THREE.Group(); set.name = "set-scoreroad"; scene.add(set);
  const wind = S.wind ?? 1, F = FR;
  scene.background = new THREE.Color("#a8cfe8"); scene.fog = null;
  const add = (o) => { if (o) set.add(o); return o; };
  const rT = rng(seed * 57 + 2), rG = rng(seed * 113 + 4), rK = rng(seed * 3 + 5), rW = rng(seed * 31 + 1), rF = rng(seed * 91 + 3);
  const flat = new THREE.Vector3(0, 1, 0);

  // ---------------------------------------------------------------- materials
  const grassT = ctex(grassCanvas(rnd)), roadT = ctex(roadCanvas(rnd)), settT = ctex(settCanvas(rnd)), rockT = ctex(rockCanvas(rnd), 1, 1, true), tuftT = ctex(tuftCanvas(rnd), 1, 1, false);
  const woodH = ctex(woodCanvas(rnd, false)), woodV = ctex(woodCanvas(rnd, true));
  const mapleT = ctex(mapleCanvas(), 1, 1, false);
  const leafMat = lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#4a2308") });
  if (wind) leafMat.userData.wind = { amp: 0.045 * wind, h: 0, flutter: 1.7 };
  const coreMat = lam("#ffffff", { vertexColors: true, emissive: new THREE.Color("#4a2208") });
  const tuftMat = lam("#ffffff", { map: tuftT, vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, emissive: new THREE.Color("#2e2a0c") });
  if (wind) tuftMat.userData.wind = { amp: 0.03 * wind, h: 0, flutter: 1.1 };

  // ---------------------------------------------------------------- sky, far ground
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 64, 32), basic({ map: ctex(skyCanvas(rnd), 1, 1, false), side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sky.position.set(20, 0, -40); sky.renderOrder = -1000; sky.frustumCulled = false; sky.userData.solid = false; sky.name = "set-scoreroad-sky"; add(sky);
  const farM = std("#aaa56a", { roughness: 1, emissive: new THREE.Color("#4a4418") }); farM.map = ctex(grassCanvas(rnd), 70, 70);
  const farGround = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), farM);
  farGround.rotation.x = -Math.PI / 2; farGround.position.set(60, -75, -110); farGround.renderOrder = -2; farGround.receiveShadow = true; farGround.userData.solid = false; add(farGround);

  // ---------------------------------------------------------------- ground: a ribbon along the road, 76 m wide, fine near the road
  const ss = []; for (let s = S_MIN; s < 44; s += 0.75) ss.push(s); for (let s = 44; s < 100; s += 2) ss.push(s); for (let s = 100; s <= S_MAX; s += 4) ss.push(s);
  const groundQ = [-30, -24, -18, -14, -11, -8.5, -6.8, -5.4, -4.4, -3.8, -3.3, -3.0, -2.75, -2.4, 2.4, 2.8, FENCE_Q, 4.0, 4.9, 6, 7.5, 9, 11, 14, 17.5, 22, 27, 34];
  const bankAmp = (s) => 1 - 0.6 * smooth((s - 110) / 50);
  const noiseAt = (s, q) => { const w = F.at(s, q); return { x: w.x, z: w.z }; };
  const groundH = (s, q) => {   // y of the ground at (s, q)
    const w = F.at(s, q), base = roadY(s), L = lift(q), a = Math.abs(q);
    let n = 0;
    if (q < -3.4) n = (fbm(w.x * 0.07, w.z * 0.07, 7) - 0.45) * 2.2 * smooth((a - 3.4) / 5) * bankAmp(s);
    else if (q > 4.2) n = (fbm(w.x * 0.06, w.z * 0.06, 9) - 0.45) * 2.0 * smooth((q - 4.2) / 8);
    return base + L * (q < -3.3 ? bankAmp(s) : 1) + n;
  };
  {
    const B = Buf(), nq = groundQ.length, col = new THREE.Color();
    ss.forEach((s, si) => {
      groundQ.forEach((q) => {
        const w = F.at(s, q), y = groundH(s, q); B.p.push(w.x, y, w.z); B.n.push(0, 1, 0); B.uv.push(w.x / 9, w.z / 9);
        const n = fbm(w.x * 0.08, w.z * 0.08, 3), au = fbm(w.x * 0.04 + 5, w.z * 0.04, 5), band = 0.5 + 0.5 * Math.sin(y * 0.7 + fbm(w.x * 0.05, w.z * 0.05, 15) * 8);
        col.set("#cdc88a").lerp(new THREE.Color("#e6b858"), smooth((au - 0.3) * 3.2) * 0.7).lerp(new THREE.Color("#9fb060"), smooth((0.45 - au) * 3) * 0.5).lerp(new THREE.Color("#f0b858"), smooth((q < 0 ? 0.35 : 0.2) * Math.abs(q) / 12) * 0.5).multiplyScalar((0.82 + n * 0.3) * (0.85 + 0.3 * band));
        B.c.push(col.r, col.g, col.b);
      });
      if (si) for (let j = 0; j < nq - 1; j++) { const a = (si - 1) * nq + j, b = a + 1, c = si * nq + j, d = c + 1; B.i.push(a, b, c, b, d, c); }
    });
    const m = bufMesh(B, std("#ffffff", { map: grassT, vertexColors: true, roughness: 1, emissive: new THREE.Color("#4a3a14") }), false, true); m.geometry.computeVertexNormals(); m.name = "set-scoreroad-ground"; m.userData.solid = false; m.frustumCulled = false; add(m);
  }

  // ---------------------------------------------------------------- the road surface, the kerb setts
  const ssR = ss.filter((s) => s <= S_MAX), tone = (s, q) => (0.9 + 0.2 * fbm(s * 0.3 + 4, q * 0.4, 13)) * (1 - 0.06 * smooth((Math.abs(q) - 1.1) / 0.4));
  const road = bufMesh(ribbon(F, ssR, [-1.7, -1.5, -1.125, -0.75, -0.375, 0, 0.375, 0.75, 1.125, 1.5, 1.7], (s, q) => roadY(s) - 0.045 * smooth((Math.abs(q) - 1.45) / 0.25), 6, tone), std("#ffffff", { map: roadT, vertexColors: true, emissive: new THREE.Color("#3a2614") }), false, true);
  road.name = "set-floor"; road.userData.surface = "dirt"; add(road);
  for (const sd of S.kerb ? [-1, 1] : []) {
    const qs = sd < 0 ? [-1.76, -1.84, -2.06, -2.14] : [1.76, 1.84, 2.06, 2.14], ys = [0.0, 0.06, 0.06, 0.0];
    const B = Buf(), nq = qs.length;
    ssR.forEach((s, si) => { const f = F.at(s); qs.forEach((q, k) => { B.p.push(f.x + q * f.nx, roadY(s) + ys[k] + 0.002, f.z + q * f.nz); B.n.push(0, 1, 0); B.uv.push(s / 2, (k / (nq - 1))); const t = 0.92 + 0.14 * fbm(s * 0.4, sd, 21); B.c.push(t, t, t); }); if (si) for (let j = 0; j < nq - 1; j++) { const a = (si - 1) * nq + j, b = a + 1, c = si * nq + j, d = c + 1; B.i.push(a, b, c, b, d, c); } });
    const m = bufMesh(B, std("#ffffff", { map: settT, vertexColors: true, emissive: new THREE.Color("#30242c") }), false, true); m.name = "set-kerb"; add(m);
  }

  // ---------------------------------------------------------------- the dry-stone wall: 3D boulders (rounded boxes) in staggered courses
    {
    const RB = Buf(), proto = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2).toNonIndexed(), pp = proto.attributes.position, nn = proto.attributes.normal;
    const rock = (cx, cy, cz, w, h, d, col, ry, rz, id) => {
      const b0 = RB.p.length / 3; _m.compose(_v.set(cx, cy, cz), _q.setFromEuler(_e.set((hash2(id, 3, 1) - 0.5) * 0.14, ry, rz, "YXZ")), _one);
      const u0 = hash2(id, 5, 2), v0 = hash2(id, 6, 2);
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), L = Math.hypot(x, y, z) || 1, sx = x / L, sy = y / L, sz = z / L, mix = 0.34;
        const rr = 1 + (hash2(Math.round(x * 4 + id * 7), Math.round(y * 4 + 9), Math.round(z * 4 + 3)) - 0.5) * 0.2;   // lumpy: each corner pushed in or out
        const X = (x * (1 - mix) + sx * 0.52 * mix) * rr, Y = (y * (1 - mix) + sy * 0.52 * mix) * rr, Z = (z * (1 - mix) + sz * 0.52 * mix) * rr;
        _v.set(X * w, Y * h, Z * d).applyMatrix4(_m); RB.p.push(_v.x, _v.y, _v.z);
        _n.set(nn.getX(i) * 0.55 + sx * 0.85, nn.getY(i) * 0.55 + sy * 0.85, nn.getZ(i) * 0.55 + sz * 0.85).normalize().transformDirection(_m); RB.n.push(_n.x, _n.y, _n.z);
        RB.uv.push(u0 + X * w / 1.0, v0 + Y * h / 1.0);
        const edge = Math.min(1, Math.max(Math.abs(X), Math.abs(Y), Math.abs(Z)) / 0.5), kk = (1 - 0.34 * edge ** 4) * (0.86 + 0.2 * (Y + 0.5));   // dark rims and a darker foot: reads as separate stones
        RB.c.push(col.r * kk, col.g * kk, col.b * kk); RB.i.push(b0 + i);
      }
    };
    const rockCols = ["#ffffff", "#f1e6e0", "#e6dccf", "#f4ece2", "#d9d0cc", "#f0e0cc"].map((h) => new THREE.Color(h));
    let id = 1;
    const courses = [[0.15, 0.27, 0.5], [0.40, 0.26, 0.48], [0.65, 0.27, 0.48], [0.89, 0.25, 0.48], [1.1, 0.2, 0.62]];
    courses.forEach(([cy, ch, cd], ci) => {
      let s = S_MIN + rK() * 0.4 - (ci % 2) * 0.3;
      while (s < 172) {
        const w = (ci === 4 ? 0.5 : 0.3) + rK() * (ci === 4 ? 0.5 : 0.45), h = ch * (0.88 + rK() * 0.3), d = cd * (0.9 + rK() * 0.2), sm = s + w / 2, f = F.at(sm), yy = roadY(sm);
        const q = WALL_Q - d / 2 + (rK() - 0.5) * 0.06 - (ci === 4 ? 0.05 : 0), k = 0.85 + rK() * 0.25, cc = rockCols[Math.floor(rK() * rockCols.length)].clone().multiplyScalar(k);
        rock(f.x + q * f.nx, yy + cy + (rK() - 0.5) * 0.03 + h / 2 - ch / 2, f.z + q * f.nz, w * 1.03, h, d, cc, -f.th + (rK() - 0.5) * 0.14, (rK() - 0.5) * 0.06, id++);
        s += w * 0.97;
      }
    });
    // dark backing behind the boulders, so the gaps read as shadow, not as ground
    const bk = Buf(); ssR.forEach((s, si) => { const f = F.at(s); const top = roadY(s) + 1.0; [[-2.45, 0], [-2.45, top - roadY(s)]].forEach(([q, h]) => { bk.p.push(f.x + q * f.nx, roadY(s) + h, f.z + q * f.nz); bk.n.push(-f.nx, 0, -f.nz); bk.uv.push(0, 0); bk.c.push(1, 1, 1); }); if (si) { const a = (si - 1) * 2, b = a + 1, c = si * 2, d = c + 1; bk.i.push(a, c, b, b, c, d); } });
    const bm = bufMesh(bk, std("#2e2630", { side: THREE.DoubleSide, roughness: 1 }), false, true); if (bm) { bm.userData.solid = false; add(bm); }
    const wm = bufMesh(RB, std("#ffffff", { map: rockT, vertexColors: true, roughness: 0.95, emissive: new THREE.Color("#2a2022") })); wm.name = "set-wall"; wm.geometry.computeBoundingSphere(); wm.frustumCulled = false; add(wm);
  }

  // ---------------------------------------------------------------- the wooden fence: posts and two rails, along q 3.3
  {
    const PB = Buf(), RB = Buf(), step = 2.2, ps = [];
    for (let s = S_MIN + 0.5; s < 172; s += step) ps.push(s);
    ps.forEach((s, i) => {
      const f = F.at(s, FENCE_Q), y = groundH(s, FENCE_Q), ht = 1.08 + (hash2(i, 1, 5) - 0.5) * 0.1, k = 0.88 + hash2(i, 2, 5) * 0.2, cc = new THREE.Color(k, k * 0.98, k * 0.95), lean = (hash2(i, 3, 5) - 0.5) * 0.05;
      addBox(PB, f.x, y + ht / 2 - 0.06, f.z, 0.18, ht + 0.12, 0.16, cc, -f.th + (hash2(i, 4, 5) - 0.5) * 0.12, lean, 1.0);
      addBox(PB, f.x, y + ht + 0.03, f.z, 0.21, 0.05, 0.19, cc.clone().multiplyScalar(0.92), -f.th, lean, 1.0);   // a weathered cap
      if (i + 1 < ps.length) { const g = F.at(ps[i + 1], FENCE_Q), y2 = groundH(ps[i + 1], FENCE_Q), L = Math.hypot(g.x - f.x, g.z - f.z, y2 - y); for (const [hh, th] of [[0.52, 0.15], [0.9, 0.14]]) addBox(RB, (f.x + g.x) / 2 + f.nx * 0.1, (y + y2) / 2 + hh, (f.z + g.z) / 2 + f.nz * 0.1, L, th, 0.07, cc, Math.atan2(-(g.z - f.z), g.x - f.x), Math.atan2(y2 - y, Math.hypot(g.x - f.x, g.z - f.z)) + (hash2(i, 5, 5) - 0.5) * 0.012, 1.0); }
    });
    const pm = bufMesh(PB, std("#ffffff", { map: woodV, vertexColors: true, roughness: 0.95, emissive: new THREE.Color("#241a12") })); pm.name = "set-fence-posts"; add(pm);
    const rm = bufMesh(RB, std("#ffffff", { map: woodH, vertexColors: true, roughness: 0.95, emissive: new THREE.Color("#241a12") })); rm.name = "set-fence-rails"; add(rm);
  }

  // ---------------------------------------------------------------- trees, shrubs, valley trees
  const FO = makeFoliage(rT, () => 0);
  if (S.trees !== false) {
    // the big maples on the bank, leaning over the road: base at (s, q), trunk top pushed toward +q
    const bigMaple = (s, q, h, tn, tones, lean, R, r, trunk = 0.58) => { const f = F.at(s, q), y = groundH(s, q); FO.maple(f.x, f.z, h, tn, { y0: y, trunk, R, r, tones, branches: 7, dens: 1.5, lean: [f.nx * lean + f.tx * 0.2, f.nz * lean + f.tz * 0.2], bias: [f.nx * 0.55, f.nz * 0.55] }); };
    bigMaple(4, -5.0, 7.5, "orange", ["orange", "gold", "red"], 3.0, 3.4, 0.2, 0.42);
    bigMaple(12.5, -6.2, 8.5, "red", ["red", "orange", "gold", "mix"], 3.2, 3.6, 0.22, 0.45);
    bigMaple(-5, -6.5, 10, "orange", ["orange", "gold", "red", "orange"], 2.6, 3.8, 0.22);
    bigMaple(1.5, -8.5, 11, "red", ["red", "orange", "gold", "red", "mix"], 3.2, 4.0, 0.24);
    bigMaple(7, -6.2, 10, "gold", ["gold", "orange", "mix", "gold"], 2.4, 3.8, 0.2);
    bigMaple(14, -9, 10, "orange", ["orange", "red", "gold"], 2.2, 3.8, 0.2);
    bigMaple(24, -7, 9, "red", ["red", "mix", "orange"], 2.0, 3.4, 0.18);
    bigMaple(-11, -10, 10, "gold", ["gold", "orange"], 2.0, 3.6, 0.2);
    // further maples up the bank and behind (lower density)
    for (let k = 0; k < 9; k++) { const s = 6 + k * 12 + rT() * 4, q = -12 - rT() * 10, f = F.at(s, q); FO.maple(f.x, f.z, 8 + rT() * 3, ["orange", "gold", "red", "mix"][k % 4], { y0: groundH(s, q), trunk: 0.5, R: 3.2, r: 0.16, tones: ["mix", ["orange", "gold", "red", "gold"][k % 4]], branches: 5, dens: 0.55, cardSz: 0.34 }); }
    // shrubs on the bank behind the wall: pink-reds, golds, oranges in groups, as the painting
    const shr = ["pink", "gold", "orange", "red", "gold", "rose", "green", "wine"], pos = [];
    for (let k = 0; k < 44; k++) { const s = -10 + k * 2.2 + rT() * 1.2, q = -3.9 - rT() * 4.5, r = 0.65 + rT() * 0.9; pos.push([s, q, r, shr[(k * 3 + (k >> 2)) % shr.length]]); }
    for (let k = 0; k < 10; k++) { const s = -9 + k * 3.5 + rT() * 2, q = -3.5 - rT() * 1.2; pos.push([s, q, 0.45 + rT() * 0.35, ["red", "orange", "gold", "pink"][k % 4]]); }
    for (const [s, q, r, tn] of pos) { const f = F.at(s, q); FO.shrub(f.x, f.z, r, tn, groundH(s, q) - 0.1, 0.19); }
    // the far bank and the shrubs along the fence and in the meadow below
    for (let k = 0; k < 16; k++) { const s = -8 + k * 5.5 + rT() * 2, q = FENCE_Q + 1.2 + rT() * 2.5, r = 0.5 + rT() * 0.5, f = F.at(s, q); FO.shrub(f.x, f.z, r, ["gold", "orange", "red", "green"][k % 4], groundH(s, q) - 0.05, 0.19); }
    // valley trees: round, below the fence, lower density bigger cards
    for (let k = 0; k < 26; k++) { const s = -10 + k * 4.4 + (rT() - 0.5) * 3, q = 15 + rT() * 14 + (k % 3) * 1.5, f = F.at(s, q), tn = ["orange", "gold", "red", "mix", "green", "gold"][k % 6]; FO.maple(f.x, f.z, 5 + rT() * 2.5, tn, { y0: groundH(s, q) - 0.1, trunk: 0.35, R: 2.2 + rT() * 0.8, r: 0.1, branches: 4, tones: [tn, "mix", tn], dens: 0.3, cardSz: 0.3 }); }
    for (let k = 0; k < 14; k++) { const s = 30 + k * 7 + rT() * 3, q = 17 + rT() * 12, f = F.at(s, q), tn = ["orange", "gold", "red", "mix"][k % 4]; FO.maple(f.x, f.z, 6 + rT() * 3, tn, { y0: groundH(s, q) - 0.1, trunk: 0.35, R: 2.8, r: 0.12, branches: 4, tones: [tn, "mix"], dens: 0.22, cardSz: 0.45 }); }
    // a left bank beyond the near trees, far up the road
    for (let k = 0; k < 8; k++) { const s = 40 + k * 10 + rT() * 3, q = -5 - rT() * 8, f = F.at(s, q); FO.maple(f.x, f.z, 7 + rT() * 2, ["orange", "gold", "red", "mix"][k % 4], { y0: groundH(s, q), trunk: 0.45, R: 3.0, r: 0.14, branches: 4, tones: ["mix", "orange", "gold"], dens: 0.3, cardSz: 0.42 }); }
  }
  {
    const wm = mergedGeo(FO.treeWood, std("#4a352a", { roughness: 0.95 })); if (wm) { wm.name = "set-trunks"; add(wm); }
    const lm = bufMesh(FO.leafQ, leafMat, true, true); if (lm) { lm.frustumCulled = false; lm.name = "set-leaves"; add(lm); }
    const cm = bufMesh(FO.coreQ, coreMat, false, true); if (cm) { cm.frustumCulled = false; add(cm); }
  }

  // ---------------------------------------------------------------- grass tufts: verges, wall foot, bank, meadow
  {
    const TF = Buf(), gcols = ["#8fa83a", "#b6b43a", "#d2b53e", "#6f9a3e", "#e0a838", "#a4b040", "#c8a030"];
    const tuft = (s, q, sz) => {
      const w = F.at(s, q), y = groundH(s, q) - 0.02, a0 = rG() * 3.14, col = tint(gcols[Math.floor(rG() * gcols.length)], rG, 0.012, 0.08, 0.07), wd = sz * (0.8 + rG() * 0.5), ht = sz * (0.7 + rG() * 0.6);
      for (let k = 0; k < 3; k++) { const a = a0 + k * 1.047, t1 = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); addCard(TF, w.x, y + ht / 2 - 0.02, w.z, t1, new THREE.Vector3(0, 1, 0), wd, ht, new THREE.Vector3(-t1.z, 0.4, t1.x).normalize(), col); }
    };
    const dense = (s0, s1, q0, q1, perM, sz) => { for (let s = s0; s < s1; s += 1 / perM) tuft(s + (rG() - 0.5) * 0.8, q0 + rG() * (q1 - q0), sz * (0.8 + rG() * 0.6)); };
    dense(-12, 50, 1.55, 3.15, 6, 0.46); dense(-12, 50, 1.4, 1.75, 3, 0.26); dense(-12, 50, -1.75, -1.4, 3, 0.26); dense(-12, 50, -2.2, -1.7, 4, 0.34);    // the fence verge
    dense(-12, 50, 3.4, 7, 4, 0.6);       // the meadow below the fence
    dense(-12, 50, -2.45, -2.18, 3.5, 0.34);  // the wall foot
    dense(-12, 50, -9, -3.4, 4.0, 0.62);       // the bank
    dense(-12, 20, -9, -3.4, 2.5, 0.8);      // the bank's big clumps
    dense(50, 110, 2.15, 3.2, 1.2, 0.7); dense(50, 110, -2.5, -2.2, 1.0, 0.55); dense(50, 110, -8, -3.4, 1.1, 0.95); dense(50, 100, 3.4, 9, 0.8, 1.0);
    const tm = bufMesh(TF, tuftMat, false, true); if (tm) { tm.userData.solid = false; tm.frustumCulled = false; tm.name = "set-tufts"; add(tm); }
  }

  // ---------------------------------------------------------------- fallen leaves in drifts at the kerbs and the wall foot, on the road, on the verge; drifting leaves
  {
    const LD = Buf(), nF = Math.round(2600 * (S.fallen ?? 1)), cols = ["#d9772b", "#c8341f", "#e8a21f", "#b8551f", "#f0c43a", "#a8321a", "#e0902a"];
    const g2 = () => (rG() + rG() + rG() - 1.5) / 1.5;
    const piles = []; for (let k = 0; k < 40; k++) { const sd = k % 3; piles.push([-8 + rG() * 62, sd === 0 ? -1.5 : sd === 1 ? 1.5 : -2.3 + rG() * 0.1, 1.1 + rG() * 0.9]); }
    for (let i = 0; i < nF; i++) {
      const pl = i < nF * 0.62 ? piles[Math.floor(rG() * piles.length)] : null;
      const s = pl ? pl[0] + g2() * pl[2] * 1.4 : -9 + rG() * 60, q = pl ? pl[1] + g2() * (Math.abs(pl[1]) > 2.2 ? 0.2 : 0.36) : -1.8 + rG() * 3.6 + (rG() < 0.4 ? (rG() < 0.5 ? -1 : 1.4) : 0);
      const w = F.at(s, q), sc = 0.09 + rG() * 0.08, y = roadY(s) + (Math.abs(q) < 1.5 ? 0.006 : -0.045) + rG() * 0.004;
      if (q < -2.14 && q > -2.7) continue;
      const [a, b] = frameOf(flat, rG() * 6.28);
      addCard(LD, w.x, y + 0.004, w.z, a, b, sc, sc, flat, tint(cols[Math.floor(rG() * cols.length)], rG, 0.014, 0.08, 0.08));
    }
    const lm = bufMesh(LD, lam("#ffffff", { map: mapleT, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), false, true); if (lm) { lm.userData.solid = false; lm.frustumCulled = false; add(lm); }
    const nD = S.leaves ?? 24, geo = new THREE.PlaneGeometry(0.15, 0.15), drift = [], dm = cols.map((c) => lam(new THREE.Color(c), { map: mapleT, alphaTest: 0.5, side: THREE.DoubleSide }));
    for (let i = 0; i < nD; i++) {
      const o = new THREE.Mesh(geo, dm[i % dm.length]); o.castShadow = true; o.userData.solid = false; set.add(o);
      drift.push({ o, T: 8 + (i * 7 % 6) + (i % 3), ph: (i * 0.6180339) % 1, x0: -5 + 8 * ((i * 0.381966) % 1), z0: -6 + 12 * ((i * 0.7548776) % 1), sw: 0.7 + (i % 4) * 0.35, sp: 1.2 + (i % 5) * 0.5 });
    }
    const tick = (t) => { for (const d of drift) { const u = ((t / d.T) + d.ph) % 1, ang = u * d.sp * 6.28; d.o.position.set(d.x0 + 1.6 * u + d.sw * Math.sin(ang), 6.5 * (1 - u) + 0.04, d.z0 + 0.6 * Math.cos(ang * 0.8)); d.o.rotation.set(1.1 + Math.sin(ang * 1.3) * 0.7, ang * 1.1, Math.cos(ang) * 0.8); } };
    tick(0); (globalThis.__setTicks ||= []).push(tick);
  }

  // ---------------------------------------------------------------- the painted far backdrop (town, church towers, hills)
  if (S.backdrop !== false) {
    const CA = ROAD.camA, ya = CA.yaw * DEG, pi = 0,   // pi 0: the cards stand upright (a tilted card joins the next one at an angle); the painting's horizon row is put on the true horizon
       CAM = { p: new THREE.Vector3(...CA.pos), l: new THREE.Vector3(CA.pos[0] + Math.sin(ya) * Math.cos(pi) * 20, CA.pos[1] - Math.sin(pi) * 20, CA.pos[2] - Math.cos(ya) * Math.cos(pi) * 20), fov: CA.fov, asp: 16 / 9 }, DC = 165;
    const SX = 1000, SY = 56, SW = 536, SH = 350, HZ = 52, KB = S.backdropK ?? 1.5, AX = 0.3 + (S.backdropShift ?? -0.4), DYB = S.backdropLift ?? 0.5;   // KB: the card is KB times the painting's own size about the horizon, so the town fills the right third   // the crop of the 1536 x 1024 painting (right of the trees, above the meadow)
    const f = CAM.l.clone().sub(CAM.p).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f).normalize();
    const tV = Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2)), tH = tV * CAM.asp, PA = 1.5 / CAM.asp;   // the painting fills the frame's width; it is 1/PA screens high
    const yH = Math.tan(pi) / tV, ndcX = (px) => AX + KB * ((px / 1536) * 2 - 1 - 0.3), ndcY = (py) => KB * ((1 - (2 * py) / 1024) - (1 - (2 * HZ) / 1024)) / PA + yH + DYB;   // the painting's horizon row sits on this camera's horizon
    const x0 = ndcX(SX), x1 = ndcX(SX + SW), y0 = ndcY(SY), y1 = ndcY(SY + SH), wN = x1 - x0, hN = y0 - y1;
    const az0 = Math.atan(tH * x0), az1 = Math.atan(tH * x1), dphi = az1 - az0, azc = (az0 + az1) / 2, ce = Math.cos(dphi / 2), NQ = 6, xc0 = (x0 + x1) / 2, yc = (y0 + y1) / 2;
    const Wm = 2 * DC * Math.tan(dphi / 2), Hm = DC * tV * hN / ce;   // each card is square-on to its own ray; both cards at a join stand the same distance from the camera, so the join is seamless
    const mats = [];
    // NQ quads on a circle of radius DC round the painting camera, each one crop (alternately mirrored, so the joins are seamless): the hills carry on to the right at 165 m whatever the shot
    for (let k = 0; k < NQ; k++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: "#fff2e0" }); mat.userData.noOutline = true; mats.push(mat);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 1.004, Hm), mat); mesh.name = "set-backdrop"; mesh.renderOrder = -1; mesh.userData.solid = false; mesh.frustumCulled = false;
      const hd = ya + azc + k * dphi, fk = new THREE.Vector3(Math.sin(hd), 0, -Math.cos(hd)), rk = new THREE.Vector3(Math.cos(hd), 0, Math.sin(hd)), uk = new THREE.Vector3(0, 1, 0);
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(rk, uk, fk.clone().negate()));
      mesh.position.copy(CAM.p).addScaledVector(fk, DC).addScaledVector(uk, DC * tV * yc / ce); add(mesh);
    }
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/storyboards/series/happiness/03-happiness-score/plates/painted/HR.webp").then((img) => {
      for (let k = 0; k < NQ; k++) {
        const [c, g] = canvas(SW * 2, SH * 2); g.imageSmoothingQuality = "high";
        if (k % 2) { g.translate(SW * 2, 0); g.scale(-1, 1); }
        g.drawImage(img, SX, SY, SW, SH, 0, 0, SW * 2, SH * 2); g.setTransform(1, 0, 0, 1, 0, 0);
        const id = g.getImageData(0, 0, c.width, c.height), d = id.data, Wc = c.width, Hc = c.height;
        for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
          const i = (y * Wc + x) * 4, R = d[i], B = d[i + 2], blue = B - R, yy = y / 2, G = d[i + 1], L = 0.3 * R + 0.59 * G + 0.11 * B;
          d[i] = Math.min(255, (L + (R - L) * 1.3) * 1.05); d[i + 1] = Math.min(255, (L + (G - L) * 1.3) * 1.0); d[i + 2] = Math.min(255, (L + (B - L) * 1.3) * 0.9);   // more colour, warmer
          let a = 1 - Math.min(1, Math.max(0, (blue - 46) / 24)) * Math.min(1, Math.max(0, (150 - yy) / 40));   // pure sky blue near the top only
          const et = Math.min(1, yy / 80); a *= et * et * (3 - 2 * et);
          if (k === 0) { const e = Math.min(1, x / 260); a *= e * e * (3 - 2 * e); }
          if (k === NQ - 1) { const e = Math.min(1, (Wc - 1 - x) / 260); a *= e * e * (3 - 2 * e); }
          const eb = Math.min(1, (Hc - 1 - y) / 240); a *= eb * eb * (3 - 2 * eb);
          d[i + 3] = Math.round(a * 255);
        }
        g.putImageData(id, 0, 0);
        const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; mats[k].map = tx; mats[k].needsUpdate = true;
      }
    }));
  }
  return set;
}
