// props-spinstreet.js -- fact 03 "Earth spins faster": the Quito street, the rain and the sea (T4)
//
// WORLD: every kind is built in world coordinates Q and sits at the stage origin (pos 0,0,0, no rotation).
// Street frame: u = -(z + 3); cobbles at y = -9 - .16 u (a 9 degree slope away from the camera, down to -z);
// carriageway x +-2.6, kerbs .14, pavements to x +-3.8, facades at x +-3.8. Left pavement is a stair from
// u 20 to 74 (12 risers of .18). Time is clip seconds: give every prop `t` (propState, seed 0, tween linear to
// the clip end), so each frame is a pure function of t. Seed 31703, no Math.random, no wall clock.
//
// KINDS (spec keys, default):
//   sstreet  E1-E6, ground + 28 house fronts (12 hero) + furniture + puddles + flood sheet. ~11-16k tris, <=58 calls.
//            splash  [[t0, x, u], ...]  up to 3 step splashes, 14 drops each        default []   (bench: [[37.2,-0.2,40.2]])
//            swish   hoop net swish time in clip seconds                            default 33.5
//            t       clip seconds                                                   default 0
//   srain    F1-F5 instanced drop quads (<=384 transparent), splash-up beads, necks, loose things
//            spud    [x,y,z] world position of Spud's sweater drops (H1-H3 hang there)  default L1 + (-.3, 1.2, .05)
//            t       clip seconds                                                   default 0
//   sball    the street basketball, size 0.24 m (radius .12). ORIGIN = BALL CENTRE.
//            float   start time of the flood ride (ball rides the front, rises from 50 s). null = a plain ball
//            fx      x of the ride                                                  default .9
//            up      rise speed scale after 50 s                                    default 1.1
//            t       clip seconds                                                   default 0
//   sblobs   F6 the sea lifting off in blobs, 50-60 s (merged dynamic mesh, 25 blobs)
//            t       clip seconds                                                   default 0
//
// HANDS: the HERO LAMP POST L1 stands on the right pavement at world (+3.2, -17.66, -58), pavement y -17.66.
//   Shaft diameters .130 at .75, .118 at 1.52, .114 at 1.66, .095 at 2.55; collars at .80, 1.25, 1.70, 2.55.
//   ONE HAND (the last to let go, 52.6 s): fist centre 1.52 above the pavement = world y -16.14 (shaft .118).
//   TWO HANDS: lower fist 1.52 (y -16.14), upper fist 1.66 (y -16.00), between collars 1.25 and 1.70.
//   Shaft axis is vertical at x +3.2, z -58. Other lamp posts: L2 left u 28, L3 left u 81, L4 right u 105, L5 left u 123.
//   sball in a hand: origin is the ball centre, so hold "mug" (fist at the origin); SIZE for grips.mjs {r:.12, h:0}.
//
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, P, S, keys, spin, weight, flicker, night, sunAt, seaY, rainV, windX, rainShare, rainFallen, windDrift, lift } from "./spin-tracks.js";

// ================================================================================================ shared helpers
const SEED = 31703;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// h(id, i, k): the seeded hash in 0..1 of an item id, its instance and a channel (DESIGN section 0)
function hh(id, i = 0, k = 0) {
  let x = (Math.imul(id | 0, 374761393) + Math.imul(i | 0, 668265263) + Math.imul(k | 0, 1274126177) + SEED) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; x = Math.imul(x, 2246822519); x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const cv = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, { repeat = false, aniso = 8, srgb = true, nearest = false } = {}) => {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; if (nearest) { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; } return t;
};
// every object of the street is look-only for the contact checks unless it is a body (post, kerb, step) or a held thing
const dress = (o, { steam = false, solid = true, shadow = false, order = 0, cull = true } = {}) => {
  o.castShadow = shadow; o.receiveShadow = shadow; o.renderOrder = order; o.frustumCulled = cull;
  if (steam) o.userData.steam = true; if (!solid) o.userData.solid = false; return o;
};
const flat = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.fog = false; return m; };
const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o });
const ink = (m, k = 0.45, color = "#3A2F33") => { m.userData.lineK = k; m.userData.lineColor = color; return m; };   // near facades, post, hoop: 1.0-1.5 px
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const pw = (x, K) => keys(x, K);

// ------------------------------------------------------------------------------------------------ street metrics
// u = metres down the street (0..127), z = -(3 + u), surface y = -9 - .16 u; pavements x +-2.6..+-3.8, facades at x +-3.8
const Yst = (u) => -9 - 0.16 * u;
const Zu = (u) => -(3 + u);
const U_END = 127;
const SLOPE = 0.16;
// the left pavement is a stair from u 20 to 74: 12 risers of .18 every 4.5 m (treads fall .12 a metre, the street .16)
const riserU = (k) => 20 + 4.5 * k;   // k 1..12
const relL = (u) => (u <= 20 || u >= 74 ? 0.14 : 0.14 + 0.04 * ((u - 20) % 4.5));
const padL = (u) => Yst(u) + relL(u);
const padR = (u) => Yst(u) + 0.14;
const padAt = (side, u) => (side < 0 ? padL(u) : padR(u));
// the street frame: a box given as (x, h above the street line, u) lands in the world as a vertical extrusion on the slope
const FS = (x, h, u) => [x, Yst(u) + h, Zu(u)];
const FW = (x, y, z) => [x, y, z];

// ------------------------------------------------------------------------------------------------ geometry builder
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
class Build {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; this.parts = []; this.tris = 0; }
  // one quad, counter-clockwise a b c d seen from the front, flat normal
  quad(a, b, c, d, col, uv = [0, 0, 1, 0, 1, 1, 0, 1], flip = false) {
    if (flip) { [b, d] = [d, b]; uv = [uv[0], uv[1], uv[6], uv[7], uv[4], uv[5], uv[2], uv[3]]; }
    const ab = sub3(b, a), ad = sub3(d, a); let nx = ab[1] * ad[2] - ab[2] * ad[1], ny = ab[2] * ad[0] - ab[0] * ad[2], nz = ab[0] * ad[1] - ab[1] * ad[0];
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const k = this.p.length / 3, cc = col.length === 4 ? col : [col, col, col, col];
    for (const [v, cl] of [[a, cc[0]], [b, cc[1]], [c, cc[2]], [d, cc[3]]]) { this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); this.c.push(cl[0], cl[1], cl[2]); }
    this.uv.push(...uv); this.i.push(k, k + 1, k + 2, k, k + 2, k + 3); this.tris += 2;
  }
  tri(a, b, c, col) { this.quad(a, b, c, c, col); this.i.length -= 3; this.tris -= 1; }
  // the same, turned so its normal points along `out`
  quadO(a, b, c, d, col, out, uv) {
    const ab = sub3(b, a), ad = sub3(d, a), nx = ab[1] * ad[2] - ab[2] * ad[1], ny = ab[2] * ad[0] - ab[0] * ad[2], nz = ab[0] * ad[1] - ab[1] * ad[0];
    this.quad(a, b, c, d, col, uv, nx * out[0] + ny * out[1] + nz * out[2] < 0);
  }
  triO(a, b, c, col, out) {
    const ab = sub3(b, a), ac = sub3(c, a), nx = ab[1] * ac[2] - ab[2] * ac[1], ny = ab[2] * ac[0] - ab[0] * ac[2], nz = ab[0] * ac[1] - ab[1] * ac[0];
    if (nx * out[0] + ny * out[1] + nz * out[2] < 0) this.tri(a, c, b, col); else this.tri(a, b, c, col);
  }
  // an axis box in the frame f (FW world, FS street): faces oriented outward, `skip` names faces left out
  box(f, x0, x1, y0, y1, z0, z1, col, skip = "") {
    const P8 = (x, y, z) => f(x, y, z), cen = [0, 0, 0], cs = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) cs.push(P8(x, y, z));
    for (const v of cs) { cen[0] += v[0] / 8; cen[1] += v[1] / 8; cen[2] += v[2] / 8; }
    const faces = {
      px: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], nx: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]],
      py: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], ny: [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]],
      pz: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], nz: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]],
    };
    const shade = { px: 0.9, nx: 0.9, py: 1.08, ny: 0.7, pz: 0.96, nz: 0.8 };
    for (const [name, q] of Object.entries(faces)) {
      if (skip.includes(name)) continue;
      const w = q.map((p) => P8(...p)), fc = [(w[0][0] + w[2][0]) / 2, (w[0][1] + w[2][1]) / 2, (w[0][2] + w[2][2]) / 2];
      const ab = sub3(w[1], w[0]), ad = sub3(w[3], w[0]), nrm = [ab[1] * ad[2] - ab[2] * ad[1], ab[2] * ad[0] - ab[0] * ad[2], ab[0] * ad[1] - ab[1] * ad[0]];
      const out = nrm[0] * (fc[0] - cen[0]) + nrm[1] * (fc[1] - cen[1]) + nrm[2] * (fc[2] - cen[2]) >= 0;
      const k = shade[name], cl = col.map((v) => v * k);
      this.quad(w[0], w[1], w[2], w[3], cl, undefined, !out);
    }
  }
  // a THREE primitive, placed and coloured (linear colour array) and merged with the rest
  prim(geo, [x, y, z] = [0, 0, 0], col = [1, 1, 1], { rx = 0, ry = 0, rz = 0, s = [1, 1, 1] } = {}) {
    const g = geo.index ? geo.clone() : mergeVertices(geo.clone(), 1e-5);
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(...s));
    g.applyMatrix4(m);
    const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); this.parts.push(g); this.tris += g.index.count / 3;
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i);
    return this.parts.length ? mergeGeometries([g, ...this.parts]) : g;
  }
}
const vcMat = (o = {}) => ink(std({ vertexColors: true, ...o }));

// a lathe from [radius, y] pairs (bottom up), n sides
const lathe = (prof, n = 12) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), n);

// ================================================================================================ painted textures (each drawn once)
const shade = (hex, k) => { const c = new THREE.Color(hex).convertLinearToSRGB(); const f = (v) => Math.round(clamp(v * k, 0, 1) * 255); return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`; };
const mixHex = (a, b, t) => { const A = new THREE.Color(a), B = new THREE.Color(b); return `#${A.lerp(B, t).getHexString()}`; };
// a soft round blotch
const blot = (g, x, y, r, rgba) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
const poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); };
// a hairline crack: a wandering polyline
function crack(g, R, x, y, len, ang, w, col) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y);
  for (let s = 0; s < len; s += 5 + R() * 6) { ang += (R() - 0.5) * 0.9; x += Math.cos(ang) * (5 + R() * 6); y += Math.sin(ang) * (5 + R() * 6); g.lineTo(x, y); } g.stroke();
}

// E2: one of three DIFFERENT 2048 x 2048 sett tiles (5.2 x 5.2 m); rows run across the street, wheel-track slabs on x +-.85
function paintCobbles(variant) {
  const R = mulberry(SEED + 100 + variant * 17);
  return cv(2048, 2048, (g, W, H) => {
    const PPM = W / 5.2, J = 0.012 * PPM;
    g.fillStyle = "#3A3438"; g.fillRect(0, 0, W, H);
    const GREYS = ["#8A8690", "#7A7682", "#9A948F", "#6E6A76", "#A39C92"];
    const rows = []; let y = 0;
    while (y < H - 1) { let rh = (0.17 + 0.07 * R()) * PPM; if (y + rh > H - 0.17 * PPM) rh = H - y; rows.push([y, rh]); y += rh; }
    const sett = (x, y0, w, h, base) => {
      const k = 0.88 + 0.24 * R(); g.fillStyle = shade(base, k); g.beginPath(); g.roundRect(x + J / 2, y0 + J / 2, w - J, h - J, 4); g.fill();
      g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x + J / 2 + 3, y0 + J / 2 + 3, (w - J) * 0.55, (h - J) * 0.4);
      g.fillStyle = "#B9B4B0"; g.globalAlpha = 0.55; g.fillRect(x + J / 2 + 2, y0 + J / 2, w - J - 4, 1.4); g.fillRect(x + J / 2, y0 + J / 2 + 2, 1.4, h - J - 4);   // lit edge up-left
      g.fillStyle = "#1c181e"; g.globalAlpha = 0.34; g.fillRect(x + J / 2 + 2, y0 + h - J / 2 - 1.4, w - J - 4, 1.4); g.fillRect(x + w - J / 2 - 1.4, y0 + J / 2 + 2, 1.4, h - J - 4);   // shade edge down-right
      g.globalAlpha = 1;
    };
    for (const [ry, rh] of rows) {
      let x = -R() * 0.12 * PPM;
      while (x < W) {
        const sw = (0.11 + 0.05 * R()) * PPM; sett(x, ry, sw, rh, GREYS[Math.floor(R() * 5)]);
        const nearKerb = x < 0.5 * PPM || x > W - 0.5 * PPM;
        if (nearKerb && R() < 0.06) { g.fillStyle = "#5F6B4A"; g.globalAlpha = 0.85; g.fillRect(x + sw * 0.1, ry + rh - J * 0.9, sw * 0.7, J * 0.8); g.fillRect(x + sw - J * 0.9, ry + rh * 0.2, J * 0.8, rh * 0.6); g.globalAlpha = 1; }
        x += sw;
      }
    }
    // wheel tracks of flat slabs .45 x .867 m (Quito's huellas)
    for (const sx of [-0.85, 0.85]) {
      const cx = W / 2 + sx * PPM, sw = 0.45 * PPM, sh = H / 6;
      for (let k = 0; k < 6; k++) {
        const base = R() < 0.5 ? "#A8A29A" : "#9C968E"; g.fillStyle = "#3A3438"; g.fillRect(cx - sw / 2 - J, k * sh, sw + 2 * J, sh);
        g.fillStyle = shade(base, 0.92 + 0.16 * R()); g.beginPath(); g.roundRect(cx - sw / 2, k * sh + J, sw, sh - 2 * J, 6); g.fill();
        g.globalAlpha = 0.5; g.fillStyle = "#C9C4BE"; g.fillRect(cx - sw / 2 + 3, k * sh + J, sw - 6, 2); g.fillStyle = "#2a252b"; g.fillRect(cx - sw / 2 + 3, (k + 1) * sh - J - 2, sw - 6, 2); g.globalAlpha = 1;
        for (let s = 0; s < 14; s++) { g.fillStyle = `rgba(${R() < 0.5 ? "0,0,0" : "255,255,255"},${0.04 + R() * 0.05})`; g.fillRect(cx - sw / 2 + R() * sw, k * sh + R() * sh, 3 + R() * 14, 1 + R() * 2); }
      }
    }
    for (let i = 0; i < 5200; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "20,16,22" : "225,220,214"},${0.05 + R() * 0.12})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  });
}
// pavement flags .6 x .9, canvas covers 1.8 x 1.8 m
function paintFlags() {
  const R = mulberry(SEED + 140);
  return cv(512, 512, (g, W, H) => {
    g.fillStyle = "#5E5A5E"; g.fillRect(0, 0, W, H); const fw = W / 3, fh = H / 2;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
      g.fillStyle = shade("#A39C92", 0.9 + 0.2 * R()); g.fillRect(i * fw + 2, j * fh + 2, fw - 4, fh - 4);
      g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(i * fw + 2, j * fh + 2, fw - 4, 2);
      if (R() < 0.6) crack(g, R, i * fw + R() * fw, j * fh + R() * fh, 40, R() * TAU, 1, "rgba(50,45,50,0.5)");
    }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "20,16,22" : "225,220,214"},${0.05 + R() * 0.1})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  });
}
// terracotta roof tiles (rows of curved tiles), 512 x 512 = 2 x 2 m
function paintTiles() {
  const R = mulberry(SEED + 150);
  return cv(512, 512, (g, W, H) => {
    g.fillStyle = "#8E3F2C"; g.fillRect(0, 0, W, H); const cw = W / 12, rh = H / 8;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 13; i++) {
      const x = i * cw - (j % 2) * cw / 2, y = j * rh, k = 0.85 + 0.3 * R();
      g.fillStyle = shade("#B5523B", k); g.beginPath(); g.roundRect(x + 1, y, cw - 2, rh + 2, [0, 0, cw / 2, cw / 2]); g.fill();
      g.fillStyle = "rgba(255,200,160,0.2)"; g.fillRect(x + 3, y + 1, cw * 0.3, rh - 3);
      g.strokeStyle = "rgba(60,25,18,0.55)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x + cw / 2, y + rh - cw / 2 + 2, cw / 2 - 1, 0.1, Math.PI - 0.1); g.stroke();
    }
  });
}
// E5: the mural, 12 x 6.2 m: 9 wavy bands rising 18 degrees, wear, drips
function paintMural() {
  const R = mulberry(SEED + 200);
  return cv(2048, 1024, (g, W, H) => {
    const PX = W / 12, PY = H / 6.2, T = Math.tan((18 * Math.PI) / 180);
    g.fillStyle = "#D9CDB8"; g.fillRect(0, 0, W, H);
    const COL = ["#F2C230", "#E86A9A", "#2F8C8C", "#7A4FA3", "#E0902F", "#F4EFE4", "#D8432E", "#3F5FA8", "#A9CDB0"];
    const WID = [0.62, 0.55, 0.7, 0.5, 0.8, 0.45, 0.66, 0.6, 0.52];
    const AMP = 0.14, LEN = 2.6, N = 9;
    const yAt = (v, a, ph) => v + T * a + AMP * Math.sin((TAU * a) / LEN + ph);   // metres above the wall foot
    const bands = []; let v = -1.55;
    for (let k = 0; k < 20; k++) { bands.push({ k, v0: v, v1: v + WID[k % N] }); v += WID[k % N]; }
    v = -1.55; for (let k = -1; k >= -12; k--) { const wd = WID[((k % N) + N) % N]; bands.push({ k, v0: v - wd, v1: v }); v -= wd; }
    const px = (a) => a * PX, py = (y) => H - y * PY;
    for (const b of bands) {
      const ci = ((b.k % N) + N) % N, ph0 = b.k * 0.9, ph1 = (b.k + 1) * 0.9;
      g.beginPath(); for (let a = 0; a <= 12.001; a += 0.1) { const y = yAt(b.v0, a, ph0); a ? g.lineTo(px(a), py(y)) : g.moveTo(px(a), py(y)); }
      for (let a = 12; a >= -0.001; a -= 0.1) g.lineTo(px(a), py(yAt(b.v1, a, ph1)));
      g.closePath(); g.fillStyle = COL[ci]; g.fill();
      // 3 cm wobbling brush line on the lower edge
      g.strokeStyle = "#2A2226"; g.lineWidth = 0.03 * PY; g.lineJoin = "round"; g.beginPath();
      for (let a = 0; a <= 12.001; a += 0.1) { const y = yAt(b.v0, a, ph0) + (R() - 0.5) * 0.012; a ? g.lineTo(px(a), py(y)) : g.moveTo(px(a), py(y)); } g.stroke();
      if (b.k >= 0 && b.k < N) {
        const mid = (a) => (yAt(b.v0, a, ph0) + yAt(b.v1, a, ph1)) / 2;
        if (ci === 1) for (let d = 0; d < 38; d++) { const a = 0.15 + (d / 37) * 11.7; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(px(a), py(mid(a) + 0.07 * Math.sin(d * 2.1)), 0.03 * PY, 0, TAU); g.fill(); }
        if (ci === 4) for (let d = 0; d < 24; d++) {   // 24 stepped triangles
          const a = 0.25 + (d / 23) * 11.5, y = mid(a) - 0.17; g.fillStyle = "#F4EFE4"; const s = 0.05 * PY;
          for (let st = 0; st < 3; st++) g.fillRect(px(a) - (3 - st) * s * 0.9, py(y) + st * -s * 0.9 - s * 0.2, (3 - st) * s * 1.8, s * 0.9);
        }
        if (ci === 7) { g.strokeStyle = "#F4EFE4"; g.lineWidth = 0.035 * PY; g.beginPath(); for (let d = 0; d <= 56; d++) { const a = 0.2 + d * 0.21, y = mid(a) + (d % 2 ? 0.1 : -0.1); d ? g.lineTo(px(a), py(y)) : g.moveTo(px(a), py(y)); } g.stroke(); }
      }
    }
    for (let i = 0; i < 12; i++) { const x = R() * W, w = 3 + R() * 6, l = (0.3 + R() * 0.7) * PY; const gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, "rgba(55,45,40,0.35)"); gr.addColorStop(1, "rgba(55,45,40,0)"); g.fillStyle = gr; g.fillRect(x, 0, w, l); }
    for (let i = 0; i < 5; i++) {   // 5 chipped patches showing plaster
      const cx = R() * W, cy = R() * H, rr = (0.2 + R() * 0.4) * 0.5 * PX, pts = []; for (let a = 0; a < 11; a++) pts.push([cx + Math.cos(a * 0.57) * rr * (0.6 + R() * 0.6), cy + Math.sin(a * 0.57) * rr * (0.5 + R() * 0.5) * 0.8]);
      poly(g, pts, "#D9CDB8"); g.strokeStyle = "rgba(60,50,45,0.4)"; g.lineWidth = 1.2; g.stroke();
    }
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "30,24,30" : "255,250,240"},${0.04 + R() * 0.08})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  });
}
// E5: the backboard, 1.20 x .90 m: 7 white planks, a red target .40 x .30
function paintBoard() {
  const R = mulberry(SEED + 210);
  return cv(512, 384, (g, W, H) => {
    const pw7 = W / 7; for (let i = 0; i < 7; i++) { g.fillStyle = shade("#EDE8DC", 0.95 + 0.07 * R()); g.fillRect(i * pw7, 0, pw7, H); g.fillStyle = "#BDB7AC"; g.fillRect(i * pw7, 0, 2, H); }
    for (let i = 0; i < 9; i++) blot(g, R() * W, R() * H, 30 + R() * 50, `rgba(150,130,100,${0.07 + R() * 0.07})`);
    for (let i = 0; i < 6; i++) { const x = R() * W, l = 40 + R() * 90; const gr = g.createLinearGradient(0, H - l, 0, H); gr.addColorStop(0, "rgba(90,80,70,0)"); gr.addColorStop(1, "rgba(90,80,70,0.28)"); g.fillStyle = gr; g.fillRect(x, H - l, 3 + R() * 4, l); }
    g.strokeStyle = "#D8432E"; g.lineWidth = 0.035 * (W / 1.2); const tw = 0.40 * (W / 1.2), th = 0.30 * (H / 0.9), tx = W / 2 - tw / 2, ty = H * 0.5 - th * 0.05;
    g.strokeRect(tx, ty, tw, th); g.strokeStyle = "rgba(216,67,46,0.9)"; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "60,50,45" : "255,255,255"},${0.04 + R() * 0.07})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  });
}
// E5: the net, 12 loops (an alpha card for a tube)
function paintNet() {
  return cv(256, 256, (g, W, H) => {
    g.strokeStyle = "#F4F1EA"; g.lineWidth = 5; g.lineCap = "round";
    for (let i = 0; i < 12; i++) { const x0 = (i / 12) * W, x1 = ((i + 1) / 12) * W; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1 - W / 24 + W / 24, H * 0.52); g.lineTo(x0 + W / 12 * 0, H); g.stroke(); g.beginPath(); g.moveTo(x1, 0); g.lineTo(x0, H * 0.52); g.lineTo(x1, H); g.stroke(); }
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 4); g.lineTo(W, 4); g.stroke(); g.beginPath(); g.moveTo(0, H - 3); g.lineTo(W, H - 3); g.stroke();
  });
}
// E4: a balcony railing card (512 x 256): top and bottom rail, 13 balusters, each with one S-scroll
function paintRailing() {
  return cv(512, 256, (g, W, H) => {
    g.strokeStyle = "#1E1B1F"; g.fillStyle = "#1E1B1F"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath(); g.moveTo(0, 14); g.lineTo(W, 14); g.stroke(); g.beginPath(); g.moveTo(0, H - 12); g.lineTo(W, H - 12); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 42); g.lineTo(W, 42); g.stroke();
    for (let i = 0; i < 13; i++) {
      const x = 14 + (i * (W - 28)) / 12; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 14); g.lineTo(x, H - 12); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.moveTo(x, 90); g.bezierCurveTo(x + 22, 92, x + 22, 130, x, 140); g.bezierCurveTo(x - 22, 150, x - 22, 186, x, 190); g.stroke();
      g.beginPath(); g.arc(x, 15, 6, 0, TAU); g.fill();
    }
  });
}
// E4: geranium flower boxes, 4 variants (256 x 128), leaves #4E7F3F
function paintFlowers(variant) {
  const R = mulberry(SEED + 300 + variant), COLS = ["#D8432E", "#E86A9A", "#D2357A", "#F4EFE4"];
  return cv(256, 128, (g, W, H) => {
    for (let i = 0; i < 26; i++) { const x = R() * W, y = H - 4 - R() * H * 0.55, r = 9 + R() * 9; g.fillStyle = shade("#4E7F3F", 0.8 + R() * 0.45); g.beginPath(); g.ellipse(x, y, r, r * 0.8, R() * 3, 0, TAU); g.fill(); }
    const n = 24 + Math.floor(R() * 17);
    for (let i = 0; i < n; i++) {
      const x = 8 + R() * (W - 16), y = 10 + R() * (H * 0.55), r = 6 + R() * 4; g.fillStyle = COLS[variant]; for (let p = 0; p < 6; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.047) * r * 0.55, y + Math.sin(p * 1.047) * r * 0.55, r * 0.5, 0, TAU); g.fill(); }
      g.fillStyle = shade(COLS[variant], 1.18); g.beginPath(); g.arc(x, y, r * 0.3, 0, TAU); g.fill();
    }
  });
}
// E4: bougainvillea billows, a 3 x 3 sheet of cells, 29 bracts a cell (260 in all), leaves #3F6B3A
function paintBougain(variant) {
  const R = mulberry(SEED + 400 + variant), BR = ["#C2267A", "#E0469A", "#8E1A5A"];
  return cv(1024, 1024, (g, W, H) => {
    let left = 260;
    for (let cy = 0; cy < 3; cy++) for (let cx = 0; cx < 3; cx++) {
      const X0 = cx * 341, Y0 = cy * 341, n = Math.min(left, 29); left -= n;
      for (let i = 0; i < 40; i++) { const a = R() * TAU, d = R() * 120; g.fillStyle = shade("#3F6B3A", 0.7 + R() * 0.5); g.beginPath(); g.ellipse(X0 + 170 + Math.cos(a) * d * 1.3, Y0 + 170 + Math.sin(a) * d, 15 + R() * 9, 8 + R() * 5, a, 0, TAU); g.fill(); }
      for (let i = 0; i < n; i++) {
        const a = R() * TAU, d = Math.sqrt(R()) * 135, x = X0 + 170 + Math.cos(a) * d * 1.2, y = Y0 + 170 + Math.sin(a) * d * 0.95, r = 11 + R() * 7;
        g.fillStyle = BR[Math.floor(R() * 3)]; g.beginPath(); g.ellipse(x, y, r, r * 0.8, R() * 3, 0, TAU); g.fill(); g.fillStyle = "rgba(255,230,240,0.35)"; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.28, 0.6, 0, TAU); g.fill();
      }
    }
  });
}
// E2 decals, drawn once on top of the cobbles: manhole, patches, hopscotch, stains, petal drifts (one 2048 x 1024 sheet)
function paintDecals() {
  const R = mulberry(SEED + 500);
  return cv(2048, 1024, (g, W, H) => {
    // cell A: manhole (0,0,256,256)
    g.save(); g.translate(128, 128); g.fillStyle = "#2c2a2e"; g.beginPath(); g.arc(0, 0, 122, 0, TAU); g.fill(); g.fillStyle = "#4b484d"; g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.fill();
    for (let r = 20; r < 112; r += 18) { g.strokeStyle = "#2f2d31"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
    g.strokeStyle = "#2f2d31"; g.lineWidth = 4; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a * 0.785) * 112, Math.sin(a * 0.785) * 112); g.stroke(); } g.fillStyle = "#6a5a4c"; g.globalAlpha = 0.4; g.beginPath(); g.arc(30, 20, 60, 0, TAU); g.fill(); g.globalAlpha = 1; g.restore();
    // cells B, C: two patched areas 1.2 x .8 (256..768, 0..170 each 256 x 170)
    for (let k = 0; k < 2; k++) {
      const x0 = 256 + k * 300, y0 = 0; g.fillStyle = "#3a3640"; g.fillRect(x0, y0, 290, 194); g.fillStyle = "#4A4650"; for (let i = 0; i < 70; i++) g.fillRect(x0 + 6 + R() * 270, y0 + 6 + R() * 180, 10 + R() * 22, 5 + R() * 9);
      g.strokeStyle = "#252229"; g.lineWidth = 5; g.strokeRect(x0 + 2, y0 + 2, 286, 190);
    }
    // cell D: chalk hopscotch of 8 squares, no digits (3 m x .9 m at 0,256, 1024 x 300)
    g.strokeStyle = "rgba(245,245,235,0.85)"; g.lineWidth = 7; g.lineCap = "round";
    const sq = (x, y, w, h) => { g.beginPath(); for (const [a, b] of [[0, 0], [w, 0], [w, h], [0, h], [0, 0]]) g.lineTo(x + a + (R() - 0.5) * 3, y + b + (R() - 0.5) * 3); g.stroke(); };
    for (let i = 0; i < 8; i++) sq(20 + i * 120, 276 + (i % 3 === 1 ? 16 : 0), 110, 110);
    g.strokeStyle = "rgba(245,245,235,0.8)"; g.beginPath(); g.arc(940, 330, 40, 0.3, Math.PI * 1.7); g.stroke();
    // cells E: 7 rust and oil stains (0, 600, 7 x 160 x 160)
    for (let i = 0; i < 7; i++) { const x = 90 + i * 220, y = 760, rust = i % 2 === 0; for (let k = 0; k < 6; k++) blot(g, x + (R() - 0.5) * 60, y + (R() - 0.5) * 40, 40 + R() * 45, rust ? `rgba(120,60,30,${0.22 + R() * 0.1})` : `rgba(20,18,24,${0.28 + R() * 0.1})`); }
    // cells F: 9 drifts of bougainvillea petals (2 rows)
    for (let i = 0; i < 9; i++) {
      const x = 130 + (i % 5) * 380, y = i < 5 ? 885 : 975;
      for (let p = 0; p < 34; p++) { g.fillStyle = ["#C2267A", "#E0469A", "#8E1A5A"][Math.floor(R() * 3)]; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(x + (R() - 0.5) * 220, y + (R() - 0.5) * 70, 7 + R() * 4, 5 + R() * 3, R() * 3, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
  });
}
// wet streaks (E2: 60 specular strokes under the lamps): 12 on a 512 x 512 sheet, 5 quads share it
function paintWetStrokes() {
  const R = mulberry(SEED + 520);
  return cv(512, 512, (g, W, H) => {
    for (let i = 0; i < 12; i++) {
      const x = R() * W, y = R() * H, l = 28 + R() * 80, w = 4 + R() * 7, gr = g.createLinearGradient(x, y, x + l, y); gr.addColorStop(0, "rgba(255,214,150,0)"); gr.addColorStop(0.5, "rgba(255,226,176,0.85)"); gr.addColorStop(1, "rgba(255,214,150,0)");
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + l / 2, y, l / 2, w / 2, 0, 0, TAU); g.fill();
    }
  });
}

// ================================================================================================ houses (E4)
const WALLS_L = ["#E59A84", "#F2ECDD", "#E2B24A", "#8FB5D6", "#EBD9A8", "#C8654A", "#A9CDB0", "#F2ECDD", "#E59A84", "#B79CC9", "#EBD9A8", "#E2B24A", "#F2ECDD", "#8FB5D6", "#E59A84"];
const WALLS_R = ["#E2B24A", "#F2ECDD", "#E59A84", "#B79CC9", "#EBD9A8", "#A9CDB0", "#F2ECDD", "#C8654A", "#E2B24A", "#8FB5D6", "#F2ECDD", "#EBD9A8", "#E59A84"];
const SHUT = ["#2F6E7A", "#33506B", "#5B3A2A"];
const OLD = ["#C9744F", "#D8B26A", "#8FA9B8", "#B8896A"];
const BALC_SLAB = "#B9B2A8";
// layout: [side, u0, u1, wall, hero, floors]; the right side's u 0-11 is a plain garden wall with a gate, the mural wall holds u 11-23
function layoutHouses() {
  const out = [], R = mulberry(SEED + 600);
  const run = (side, walls, a, b, n, off) => {
    const w = Array.from({ length: n }, () => 7.2 + 1.6 * R()), sum = w.reduce((p, q) => p + q, 0); let u = a;
    return w.map((x, i) => { const u0 = u, u1 = (u += (x / sum) * (b - a)); return { side, u0, u1, wall: walls[off + i], idx: off + i }; });
  };
  const L = [...run(-1, WALLS_L, 0, 96, 12, 0), ...run(-1, WALLS_L, 99, 124, 3, 12)];
  const Rr = [...run(1, WALLS_R, 23, 70, 6, 0), ...run(1, WALLS_R, 73, 124, 7, 6)];
  const heroL = new Set([1, 2, 3, 4, 6, 7]);
  L.forEach((h) => { h.hero = heroL.has(h.idx); h.floors = 2; });
  Rr.forEach((h) => { h.hero = h.idx < 6; h.floors = 2; });
  out.push(...L, ...Rr, { side: 1, u0: 0, u1: 11, wall: "#E2B24A", idx: -1, hero: false, floors: 1, gate: true });
  out.forEach((h, i) => {
    h.id = i; h.W = h.u1 - h.u0; h.flip = hh(i, 0, 1) < 0.5;
    h.yF = (h.side < 0 ? Yst((h.u0 + h.u1) / 2) : Yst((h.u0 + h.u1) / 2)) + 0.44;
    h.yBot = Math.min(padAt(h.side, h.u0), padAt(h.side, h.u1)) - 0.3;
    h.fl = h.yF - h.yBot; h.yE = h.yF + (h.floors === 1 ? 3.4 : 6.5); h.Hf = h.yE - h.yBot;
    h.aDoor = h.flip ? 0.72 * h.W : 0.28 * h.W; h.aWin = h.flip ? 0.28 * h.W : 0.72 * h.W;
    h.shutter = SHUT[Math.floor(hh(i, 0, 2) * 3)]; h.old = OLD[Math.floor(hh(i, 0, 3) * 4)]; h.num = 3 + Math.floor(hh(i, 0, 4) * 96);
    h.uOf = (a) => (h.side < 0 ? h.u0 + a : h.u1 - a);   // a runs left to right as seen from the street
  });
  return out;
}
const HOUSES = layoutHouses();
// balconies: one under the door's French window on every hero house + 2 more (the two houses that hold both)
const HEROES = HOUSES.filter((h) => h.hero);
HOUSES.forEach((h) => { h.balc = h.hero ? [h.aDoor] : []; h.box = false; h.sillBox = false; });
{ const two = [HEROES[2], HEROES[8]]; for (const h of two) h.balc.push(h.aWin); }
{ let n = 0; for (const h of HEROES) for (let k = 0; k < h.balc.length; k++) { h.balcBox = h.balcBox || []; const on = (n * 5 + 3) % 14 < 9; h.balcBox.push(on); n++; } }
{ const sills = [0, 2, 4, 7, 9, 11]; sills.forEach((i) => { HEROES[i].sillBox = true; }); }

function paintFacade(h, px, py, cw, ch, hero) {
  // paints one facade into a canvas region; houses of 7-9 m by ~8 m
  return (g) => {
    const R = mulberry(SEED + 700 + h.id * 31), W = h.W, Hf = h.Hf, sx = cw / W, sy = ch / Hf;
    const X = (a) => px + a * sx, Y = (y) => py + ch - y * sy;
    g.save(); g.beginPath(); g.rect(px, py, cw, ch); g.clip();
    // plaster, 3-tone mottling
    g.fillStyle = h.wall; g.fillRect(px, py, cw, ch);
    for (let i = 0; i < 34; i++) blot(g, px + R() * cw, py + R() * ch, (0.35 + R() * 0.9) * sx, R() < 0.5 ? `rgba(255,248,230,${0.07 + R() * 0.07})` : `rgba(70,50,40,${0.05 + R() * 0.06})`);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "40,30,30" : "255,250,240"},${0.03 + R() * 0.06})`; g.fillRect(px + R() * cw, py + R() * ch, 1 + R() * 2, 1 + R() * 2); }
    // plinth: andesite courses .22 high
    const plT = h.fl + 0.9, courseH = 0.22;
    for (let y = 0; y < plT; y += courseH) {
      let a = -R() * 0.4; const hh2 = Math.min(courseH, plT - y);
      while (a < W) { const bw = 0.5 + R() * 0.4; g.fillStyle = shade("#7C7884", 0.86 + R() * 0.26); g.fillRect(X(a), Y(y + hh2), bw * sx, hh2 * sy); g.fillStyle = "#56525C"; g.fillRect(X(a), Y(y + hh2), bw * sx, Math.max(1, 0.018 * sy)); g.fillRect(X(a), Y(y + hh2), Math.max(1, 0.018 * sx), hh2 * sy); a += bw; }
    }
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(px, Y(plT) - 1, cw, 2.5);
    // damp bloom over the plinth
    { const l = 0.7 * sy, gr = g.createLinearGradient(0, Y(plT), 0, Y(plT) - l); gr.addColorStop(0, "rgba(70,75,50,0.32)"); gr.addColorStop(1, "rgba(70,75,50,0)"); g.fillStyle = gr; g.fillRect(px, Y(plT) - l, cw, l);
      for (let i = 0; i < 14; i++) { const x = px + R() * cw, ll = (0.2 + R() * 0.7) * sy; const g2 = g.createLinearGradient(0, Y(plT), 0, Y(plT) - ll); g2.addColorStop(0, "rgba(60,60,40,0.22)"); g2.addColorStop(1, "rgba(60,60,40,0)"); g.fillStyle = g2; g.fillRect(x, Y(plT) - ll, 3 + R() * 5, ll); } }
    if (h.floors > 1) {   // string course at the upper floor
      const y3 = h.fl + 3.4; g.fillStyle = mixHex(h.wall, "#ffffff", 0.18); g.fillRect(px, Y(y3 + 0.07), cw, 0.14 * sy); g.fillStyle = "rgba(40,25,25,0.28)"; g.fillRect(px, Y(y3 - 0.07), cw, 0.05 * sy);
    }
    const frame = (x0, y0, w, hgt, col, t = 0.06) => { g.fillStyle = col; g.fillRect(X(x0) - t * sx, Y(y0 + hgt) - t * sy, (w + 2 * t) * sx, (hgt + 2 * t) * sy); };
    const sheen = (x0, y0, w, hgt) => { g.save(); g.beginPath(); g.rect(X(x0), Y(y0 + hgt), w * sx, hgt * sy); g.clip(); g.fillStyle = "rgba(255,255,255,0.10)"; g.beginPath(); g.moveTo(X(x0 + w * 0.15), Y(y0)); g.lineTo(X(x0 + w * 0.45), Y(y0)); g.lineTo(X(x0 + w * 0.95), Y(y0 + hgt)); g.lineTo(X(x0 + w * 0.65), Y(y0 + hgt)); g.fill(); g.restore(); };
    const shutters = (x0, y0, w, hgt, col) => {
      for (const side of [-1, 1]) {
        const sw = 0.5, sxx = side < 0 ? x0 - sw - 0.05 : x0 + w + 0.05; g.fillStyle = col; g.fillRect(X(sxx), Y(y0 + hgt), sw * sx, hgt * sy);
        g.fillStyle = "rgba(0,0,0,0.28)"; for (let y = 0; y < hgt; y += 0.075) g.fillRect(X(sxx), Y(y0 + y), sw * sx, Math.max(1, 0.02 * sy));
        g.fillStyle = "rgba(255,255,255,0.16)"; for (let y = 0.03; y < hgt; y += 0.075) g.fillRect(X(sxx), Y(y0 + y), sw * sx, Math.max(1, 0.012 * sy));
      }
    };
    const fillLinear = (x0, y0, w, hgt, c0, c1) => { const gr = g.createLinearGradient(0, Y(y0 + hgt), 0, Y(y0)); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(X(x0), Y(y0 + hgt), w * sx, hgt * sy); };
    // the door: 1.5 x 2.6, arched head, stone surround
    const dw = 1.5, dx = h.aDoor - dw / 2, dy = h.fl;
    const doorPath = (inset) => { const r = dw / 2 - inset, cy = dy + 2.6 - dw / 2; g.beginPath(); g.moveTo(X(dx + inset), Y(dy)); g.lineTo(X(dx + inset), Y(cy)); g.ellipse(X(h.aDoor), Y(cy), r * sx, r * sy, 0, Math.PI, 0); g.lineTo(X(dx + dw - inset), Y(dy)); g.closePath(); };
    if (hero) {
      doorPath(-0.17); g.fillStyle = "#A39C92"; g.fill(); doorPath(0); g.fillStyle = "#3b2418"; g.fill();
      g.save(); doorPath(0); g.clip();
      for (const lf of [0, 1]) {
        const lx = dx + lf * dw / 2, lw = dw / 2; g.fillStyle = shade("#5B3A2A", 0.95 + 0.1 * R()); g.fillRect(X(lx), Y(dy + 2.6), lw * sx, 2.6 * sy);
        for (let row = 0; row < 3; row++) for (let c = 0; c < 2; c++) {   // 6 raised panels a leaf
          const bx = lx + 0.08 + c * 0.32, by = dy + 0.15 + row * (row === 2 ? 0.65 : 0.7), bw = 0.27, bh = row === 2 ? 0.58 : 0.6;
          g.fillStyle = "#3f2619"; g.fillRect(X(bx), Y(by + bh), bw * sx, bh * sy); g.fillStyle = "#74492f"; g.fillRect(X(bx) + 2, Y(by + bh) + 2, bw * sx - 4, bh * sy - 4);
          g.fillStyle = "rgba(255,220,170,0.22)"; g.fillRect(X(bx) + 2, Y(by + bh) + 2, bw * sx - 4, 2); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(X(bx) + 2, Y(by) - 4, bw * sx - 4, 2);
        }
        for (let i = 0; i < 9; i++) { const sxp = lx + 0.12 + (i % 3) * 0.25, syp = dy + 0.4 + Math.floor(i / 3) * 0.78; g.fillStyle = "#1E1B1F"; g.beginPath(); g.arc(X(sxp), Y(syp), 0.026 * sx, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.arc(X(sxp) - 1, Y(syp) - 1, 0.009 * sx, 0, TAU); g.fill(); }
      }
      g.fillStyle = "#1E1B1F"; g.fillRect(X(h.aDoor) - 1.5, Y(dy + 2.6), 3, 2.6 * sy);
      g.restore();
      // voussoirs on the arch
      g.strokeStyle = "#6a655f"; g.lineWidth = 1.6; const cy2 = dy + 2.6 - dw / 2; for (let k = 0; k <= 9; k++) { const an = Math.PI * (k / 9); g.beginPath(); g.moveTo(X(h.aDoor + Math.cos(an) * 0.75), Y(cy2 + Math.sin(an) * 0.75)); g.lineTo(X(h.aDoor + Math.cos(an) * 0.92), Y(cy2 + Math.sin(an) * 0.92)); g.stroke(); }
      // number plate (digits only)
      const nx = h.aDoor + (h.flip ? -1.25 : 1.25), ny = dy + 1.85; g.fillStyle = "#ffffff"; g.fillRect(X(nx - 0.13), Y(ny + 0.1), 0.26 * sx, 0.2 * sy); g.fillStyle = "#33506B"; g.fillRect(X(nx - 0.115), Y(ny + 0.085), 0.23 * sx, 0.17 * sy);
      g.fillStyle = "#ffffff"; g.font = `bold ${0.12 * sy}px Helvetica, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(h.num), X(nx), Y(ny));
      // ground window 1.0 x 1.5 behind a grille, sill .95
      const wx = h.aWin - 0.5, wy = h.fl + 0.95;
      frame(wx, wy, 1.0, 1.5, "#4A2F22"); fillLinear(wx, wy, 1.0, 1.5, "#4a5670", "#1c2434"); sheen(wx, wy, 1.0, 1.5);
      g.fillStyle = "#4A2F22"; g.fillRect(X(wx + 0.48), Y(wy + 1.5), 0.04 * sx, 1.5 * sy); g.fillRect(X(wx), Y(wy + 0.78), 1.0 * sx, 0.04 * sy);
      if (h.id % 2 === 0) { g.fillStyle = "rgba(255,200,130,0.35)"; g.fillRect(X(wx + 0.52), Y(wy + 1.46), 0.44 * sx, 0.64 * sy); }   // a lamp lit inside
      // upper floor: two French doors 1.1 x 2.3 with louvred shutters
      for (const a of [h.aDoor, h.aWin]) {
        const fx = a - 0.55, fy = h.fl + 3.5;
        shutters(fx, fy, 1.1, 2.3, h.shutter); frame(fx, fy, 1.1, 2.3, "#4A2F22", 0.05); fillLinear(fx, fy, 1.1, 2.3, "#8fa3c2", "#4d5a76"); sheen(fx, fy, 1.1, 2.3);
        g.fillStyle = "#4A2F22"; g.fillRect(X(fx + 0.54), Y(fy + 2.3), 0.04 * sx, 2.3 * sy); for (let k = 1; k < 4; k++) g.fillRect(X(fx), Y(fy + k * 0.575), 1.1 * sx, 0.025 * sy); g.fillStyle = "#C9A24A"; g.fillRect(X(fx + 0.5), Y(fy + 1.2), 0.025 * sx, 0.14 * sy); g.fillRect(X(fx + 0.6), Y(fy + 1.2), 0.025 * sx, 0.14 * sy);
      }
      // cracks and flaked patches showing an older colour
      for (let i = 0; i < 2 + Math.floor(R() * 3); i++) crack(g, R, X(R() * W), Y(h.fl + 2.6 + R() * 3.2), 55 + R() * 70, R() * TAU, 1.3, "rgba(55,40,35,0.55)");
      for (let i = 0; i < 1 + Math.floor(R() * 2); i++) { const cx = X(0.8 + R() * (W - 1.6)), cy = Y(h.fl + 1.2 + R() * 4), rr = (0.2 + R() * 0.28) * sx, pts = []; for (let k = 0; k < 9; k++) pts.push([cx + Math.cos(k * 0.7) * rr * (0.6 + R() * 0.7), cy + Math.sin(k * 0.7) * rr * (0.5 + R() * 0.6)]); poly(g, pts, h.old); g.strokeStyle = "rgba(60,45,40,0.35)"; g.lineWidth = 1; g.stroke(); }
    } else if (!h.gate) {
      // plainer house: a door, two ground windows, three upper windows with shutters
      const dwc = ["#5B3A2A", "#2F6E7A", "#33506B", "#7a4a2c"][h.id % 4];
      doorPath(0); g.fillStyle = dwc; g.fill(); g.save(); doorPath(0); g.clip(); g.fillStyle = "rgba(0,0,0,0.22)"; for (let c = 0; c < 4; c++) g.fillRect(X(dx + 0.1 + c * 0.35), Y(dy + 2.4), 0.3 * sx, 1.0 * sy); g.fillRect(X(h.aDoor) - 1.5, Y(dy + 2.6), 3, 2.6 * sy); g.restore();
      doorPath(-0.09); g.strokeStyle = "#A39C92"; g.lineWidth = 0.1 * sx; g.stroke();
      for (const a of [h.aWin, h.aWin + (h.flip ? -2.1 : 2.1)]) if (a > 0.7 && a < W - 0.7) { const wx = a - 0.45, wy = h.fl + 1.0; shutters(wx, wy, 0.9, 1.3, h.shutter); frame(wx, wy, 0.9, 1.3, "#4A2F22"); fillLinear(wx, wy, 0.9, 1.3, "#4a5670", "#1c2434"); sheen(wx, wy, 0.9, 1.3); }
      if (h.floors > 1) for (const a of [W * 0.2, W * 0.5, W * 0.8]) { const wx = a - 0.5, wy = h.fl + 3.6; shutters(wx, wy, 1.0, 1.9, h.shutter); frame(wx, wy, 1.0, 1.9, "#4A2F22"); fillLinear(wx, wy, 1.0, 1.9, "#8fa3c2", "#4d5a76"); sheen(wx, wy, 1.0, 1.9); }
      for (let i = 0; i < 1 + Math.floor(R() * 2); i++) crack(g, R, X(R() * W), Y(h.fl + 2 + R() * 3), 40 + R() * 50, R() * TAU, 1.1, "rgba(55,40,35,0.45)");
    } else {
      // garden wall with a wooden gate
      const gx = W * 0.5 - 0.9; g.fillStyle = "#4A2F22"; g.fillRect(X(gx - 0.12), Y(h.fl + 2.5), 2.04 * sx, 2.5 * sy); g.fillStyle = "#6a4630"; for (let i = 0; i < 8; i++) g.fillRect(X(gx + i * 0.225), Y(h.fl + 2.4), 0.2 * sx, 2.4 * sy); g.fillStyle = "#1E1B1F"; g.fillRect(X(gx + 0.88), Y(h.fl + 1.8), 0.04 * sx, 1.8 * sy);
      for (let i = 0; i < 4; i++) crack(g, R, X(R() * W), Y(h.fl + 1 + R() * 2), 50, R() * TAU, 1.2, "rgba(55,40,35,0.5)");
    }
    // the eave's shadow along the top
    { const l = 0.55 * sy, gr = g.createLinearGradient(0, py, 0, py + l); gr.addColorStop(0, "rgba(40,25,30,0.38)"); gr.addColorStop(1, "rgba(40,25,30,0)"); g.fillStyle = gr; g.fillRect(px, py, cw, l); }
    g.restore();
  };
}

// ================================================================================================ sstreet: build
const STONE = lin("#8E8A8F"), PLINTH = lin("#7C7884"), IRON = lin("#1F2422"), TERRA = lin("#B5523B"), TIMBER = lin("#5B3A2A"), SILL = lin("#A39C92");
// puddles (E3): u, x, size along x, size along u
const PUDDLES = [[9, -1.2, 1.1, 0.7], [14, 0.9, 0.8, 0.5], [21, -0.3, 1.9, 1.0], [27, 1.6, 0.9, 0.6], [34, -1.7, 1.2, 0.6], [41, 0.2, 1.6, 0.9], [49, 1.9, 0.7, 0.5], [56, 1.4, 1.4, 0.8], [63, -0.8, 1.0, 0.7]];
// lamp posts (E6): [side, u, hero]
const LAMPS = [[1, 55, 1], [-1, 28, 0], [-1, 81, 0], [1, 105, 0], [-1, 123, 0]];
const lampPos = (i) => { const [s, u] = LAMPS[i]; return [s * 3.2, padAt(s, u), Zu(u)]; };
const L1 = lampPos(0);
const RIM_Y = Yst(17) + 2.05;   // E5: rim top 2.05 m over the cobbles under the hoop

function houseBox(b, h, a0, a1, y0, y1, d0, d1, col, skip = "") {
  const s = h.side, xa = s * (3.8 + d0), xb = s * (3.8 + d1), za = Zu(h.uOf(a0)), zb = Zu(h.uOf(a1));
  b.box(FW, Math.min(xa, xb), Math.max(xa, xb), y0, y1, Math.min(za, zb), Math.max(za, zb), col, skip);
}

function buildGround(g, parts) {
  // ---- cobbles: 25 tiles of 5.2 m in seeded order with flips, never the same two in a row
  const tiles = [0, 1, 2].map((v) => new Build()), seq = []; let last = -1;
  for (let i = 0; i < 25; i++) { let v = Math.floor(hh(1, i, 0) * 3); if (v === last) v = (v + 1 + Math.floor(hh(1, i, 1) * 2)) % 3; seq.push(v); last = v; }
  seq.forEach((v, i) => {
    const u0 = i * 5.2, u1 = Math.min(U_END, u0 + 5.2), fx = hh(2, i, 0) < 0.5, fu = hh(2, i, 1) < 0.5, vmax = (u1 - u0) / 5.2;
    const ux = (x) => { const t = (x + 2.6) / 5.2; return fx ? 1 - t : t; }, vu = (u) => { const t = (u - u0) / 5.2; return fu ? vmax - t : t; };
    tiles[v].quad(FS(-2.6, 0, u0), FS(2.6, 0, u0), FS(2.6, 0, u1), FS(-2.6, 0, u1), [1, 1, 1], [ux(-2.6), vu(u0), ux(2.6), vu(u0), ux(2.6), vu(u1), ux(-2.6), vu(u1)]);
  });
  const cobTex = [0, 1, 2].map((v) => tex(paintCobbles(v), { repeat: false }));
  tiles.forEach((b, v) => { const m = flat(std({ map: cobTex[v], roughness: 0.9 })); m.userData.noOutline = true; const o = dress(new THREE.Mesh(b.geo(), m), { shadow: false }); o.receiveShadow = true; o.name = `cobbles${v}`; g.add(o); parts.tris += b.tris; parts.calls++; });

  // ---- stone: kerbs, stair risers, carriageway faces, steps in the alleys (vertex colours)
  const st = new Build(), fl = new Build(), K = STONE;
  const kerbR = (u0, u1) => st.box(FS, 2.6, 2.76, -0.12, 0.14, u0, u1, K, "px");
  for (let u = 0; u < U_END; u += 6.35) kerbR(u, Math.min(U_END, u + 6.35));
  for (let u = 0; u < 20; u += 6.67) st.box(FS, -2.76, -2.6, -0.12, 0.14, u, u + 6.67, K, "nx");
  for (let u = 74; u < U_END; u += 6.625) st.box(FS, -2.76, -2.6, -0.12, 0.14, u, Math.min(U_END, u + 6.625), K, "nx");
  // pavements: right ramp, left ramp / stair
  const flagUV = (x, u0, u1) => [(x) / 1.8, u0 / 1.8, (x + 1.04) / 1.8, u0 / 1.8, (x + 1.04) / 1.8, u1 / 1.8, x / 1.8, u1 / 1.8];
  fl.quad(FS(2.76, 0.14, 0), FS(3.8, 0.14, 0), FS(3.8, 0.14, U_END), FS(2.76, 0.14, U_END), [1, 1, 1], [0, 0, 1.04 / 1.8, 0, 1.04 / 1.8, U_END / 1.8, 0, U_END / 1.8]);
  fl.quad(FS(-3.8, 0.14, 0), FS(-2.76, 0.14, 0), FS(-2.76, 0.14, 20), FS(-3.8, 0.14, 20), [1, 1, 1], [0, 0, 1.04 / 1.8, 0, 1.04 / 1.8, 20 / 1.8, 0, 20 / 1.8]);
  fl.quad(FS(-3.8, 0.14, 74), FS(-2.76, 0.14, 74), FS(-2.76, 0.14, U_END), FS(-3.8, 0.14, U_END), [1, 1, 1], [0, 74 / 1.8, 1.04 / 1.8, 74 / 1.8, 1.04 / 1.8, U_END / 1.8, 0, U_END / 1.8]);
  for (let k = 0; k < 12; k++) {
    const a = 20 + 4.5 * k, b = a + 4.5, ha = 0.14, hb = 0.32;
    fl.quad(FS(-3.8, ha, a), FS(-2.76, ha, a), FS(-2.76, hb, b), FS(-3.8, hb, b), [1, 1, 1], [0, a / 1.8, 1.04 / 1.8, a / 1.8, 1.04 / 1.8, b / 1.8, 0, b / 1.8]);
    st.quad(FS(-2.76, ha, a), FS(-2.6, ha, a), FS(-2.6, hb, b), FS(-2.76, hb, b), [K[0] * 1.08, K[1] * 1.08, K[2] * 1.08]);                 // kerb top
    st.quad(FS(-2.6, -0.12, a), FS(-2.6, -0.12, b), FS(-2.6, hb, b), FS(-2.6, ha, a), [K[0] * 0.9, K[1] * 0.9, K[2] * 0.9]);                 // its face on the street
    st.quad(FS(-3.8, hb, b), FS(-2.6, hb, b), FS(-2.6, ha, b), FS(-3.8, ha, b), [K[0] * 0.85, K[1] * 0.85, K[2] * 0.85]);                    // riser, faces downhill
    st.quad(FS(-3.8, ha, a), FS(-3.8, -0.4, a), FS(-3.8, -0.4, b), FS(-3.8, hb, b), K.map((v) => v * 0.5));                                  // (hidden side, keeps the slab closed)
  }
  // alleys: stair alleys right at u 70-73 and left at u 96-99, 12 steps climbing away from the street
  for (const [s, ua, ub] of [[1, 70, 73], [-1, 96, 99]]) {
    st.quad(FS(s * 3.8, 0.14, ua), FS(s * 3.8, 0.14, ub), FS(s * 11, 0.14, ub), FS(s * 11, 0.14, ua), PLINTH.map((v) => v * 0.55), undefined, s > 0);
    for (let i = 0; i < 12; i++) st.box(FS, Math.min(s * (3.8 + i * 0.32), s * 11), Math.max(s * (3.8 + i * 0.32 + 0.32), s * (3.8 + i * 0.32)), 0.1, 0.2 + i * 0.2, ua + 0.1, ub - 0.1, SILL.map((v) => v * (0.8 + 0.03 * (i % 3))), s > 0 ? "nx" : "px");
  }
  // balustrade at the end, u 124-127: 1.0 m across, 16 turned balusters, two piers with stone balls, a 2.2 m opening with 5 steps down
  const bal = lathe([[0.04, 0], [0.05, 0.3], [0.03, 0.55], [0.04, 0.9]], 6);
  for (const s of [-1, 1]) {
    st.box(FS, Math.min(s * 1.3, s * 3.8), Math.max(s * 1.3, s * 3.8), 0.0, 0.1, 124.4, 126.6, SILL, "");
    st.box(FS, Math.min(s * 1.3, s * 3.8), Math.max(s * 1.3, s * 3.8), 0.92, 1.0, 124.45, 126.55, SILL.map((v) => v * 1.06), "");
    for (let i = 0; i < 8; i++) { const x = s * (1.55 + i * 0.3), [wx, wy, wz] = FS(x, 0.1, 125.5); st.prim(bal, [wx, wy, wz], SILL.map((v) => v * 0.97), { s: [1.15, 0.9 / 0.9, 1.15] }); }
  }
  for (const s of [-1, 1]) {
    st.box(FS, s * 1.2 - 0.2, s * 1.2 + 0.2, 0, 1.25, 125.3, 125.7, SILL.map((v) => v * 1.02));
    const [bx, by, bz] = FS(s * 1.2, 1.25, 125.5); st.prim(new THREE.SphereGeometry(0.15, 8, 5), [bx, by + 0.13, bz], SILL.map((v) => v * 1.05));
  }
  for (let i = 0; i < 5; i++) st.box(FS, -1.1, 1.1, -0.2 * (i + 1), 0.0 - 0.2 * i, 125 + i * 0.35, 125.35 + i * 0.35, SILL.map((v) => v * (0.9 + 0.02 * i)));
  // 6 stone bollards .7 m
  const boll = lathe([[0.12, 0], [0.12, 0.62], [0, 0.74]], 8);
  for (const x of [-2.5, -2.0, -1.5, 1.5, 2.0, 2.5]) { const [wx, wy, wz] = FS(x, 0, 122); st.prim(boll, [wx, wy, wz], STONE.map((v) => v * 1.04)); }
  parts.stoneB = st; parts.flagsB = fl;
  const flagMat = std({ map: tex(paintFlags(), { repeat: true }), roughness: 0.9 }); flagMat.userData.noOutline = true; flagMat.userData.outlineParameters = { visible: false };
  const fo = dress(new THREE.Mesh(fl.geo(), flagMat)); fo.receiveShadow = true; fo.name = "flags"; g.add(fo); parts.tris += fl.tris; parts.calls++;
}

// ------------------------------------------------------------------------------------------------ houses
function buildHouses(g, parts) {
  const body = new Build(), det = new Build(), roof = new Build(), rail = new Build(), flo = new Build(), plain = new Build();
  const hero = HOUSES.filter((h) => h.hero), others = HOUSES.filter((h) => !h.hero);
  // facade atlases: 2 x 2 cells of 1024 per 2048 canvas
  const mk = (list) => { const out = []; for (let i = 0; i < list.length; i += 4) { const cvs = document.createElement("canvas"); cvs.width = cvs.height = 2048; out.push({ cvs, g: cvs.getContext("2d"), list: list.slice(i, i + 4) }); } return out; };
  const atlases = [...mk(hero).map((a) => ({ ...a, hero: true })), ...mk(others).map((a) => ({ ...a, hero: false }))];
  const facade = atlases.map(() => new Build());
  atlases.forEach((at, ai) => at.list.forEach((h, k) => {
    const px = (k % 2) * 1024, py = Math.floor(k / 2) * 1024; paintFacade(h, px, py, 1024, 1024, h.hero)(at.g);
    const e = 1.5 / 2048, u0 = px / 2048 + e, u1 = (px + 1024) / 2048 - e, v0 = 1 - (py + 1024) / 2048 + e, v1 = 1 - py / 2048 - e, s = h.side, x = s * 3.8;
    const z0 = Zu(h.uOf(0)), z1 = Zu(h.uOf(h.W));
    facade[ai].quadO([x, h.yBot, z0], [x, h.yBot, z1], [x, h.yE, z1], [x, h.yE, z0], [1, 1, 1], [-s, 0, 0], [u0, v0, u1, v0, u1, v1, u0, v1]);
  }));
  atlases.forEach((at, ai) => {
    const m = std({ map: tex(at.cvs, { aniso: 8 }), roughness: 0.95 }); ink(m, 0.4);
    const o = dress(new THREE.Mesh(facade[ai].geo(), m)); o.name = `facades${ai}`; g.add(o); parts.tris += facade[ai].tris; parts.calls++;
  });
  const flowerSheet = cv(1024, 128, (c) => { for (let v = 0; v < 4; v++) c.drawImage(paintFlowers(v), v * 256, 0); });
  let nBalc = 0, nBox = 0, nSill = 0;
  for (const h of HOUSES) {
    const s = h.side, W = h.W, wall = lin(h.wall, 0.82), yF = h.yF, yE = h.yE, yb = h.yBot;
    // the body behind the facade (its street face is the textured quad)
    houseBox(body, h, 0, W, yb, yE, 0, 7.5, wall, s < 0 ? "px" : "nx");
    // plinth and string course ledges
    if (!h.gate) for (const [a0, a1] of [[-0.02, h.aDoor - 0.95], [h.aDoor + 0.95, W + 0.02]]) houseBox(det, h, a0, a1, yF + 0.86, yF + 0.94, -0.07, 0, PLINTH.map((v) => v * 1.12));
    if (h.floors > 1) houseBox(det, h, -0.02, W + 0.02, yF + 3.34, yF + 3.46, -0.05, 0, lin(h.wall, 1.08));
    // the eave: slab, tile roof, rafter tails, scalloped edge
    houseBox(det, h, -0.1, W + 0.1, yE - 0.12, yE - 0.04, -0.7, 0.05, lin("#7A4A38"), "");
    const ex = s * (3.8 - 0.7), rx = s * (3.8 + 3.8), zA = Zu(h.uOf(-0.1)), zB = Zu(h.uOf(W + 0.1));
    roof.quadO([ex, yE - 0.04, zA], [ex, yE - 0.04, zB], [rx, yE + 2.4, zB], [rx, yE + 2.4, zA], [1, 1, 1], [-s * 0.5, 1, 0], [0, 0, (W + 0.2) / 2, 0, (W + 0.2) / 2, 2.2, 0, 2.2]);
    const endFace = s > 0 ? "px,py,nx,pz,nz" : "nx,py,px,pz,nz";   // keep the bottom and the street end of a tail
    const nTail = h.hero ? 11 : 6; for (let i = 0; i < nTail; i++) { const a = 0.35 + (i * (W - 0.7)) / (nTail - 1); houseBox(det, h, a - 0.035, a + 0.035, yE - 0.22, yE - 0.12, -0.7, -0.05, TIMBER, s > 0 ? "px,py,nz,pz,nx" : "nx,py,nz,pz,px"); }
    if (h.hero) {
      const n = 26, r = (W + 0.2) / n / 2; // scalloped tile edge, 4 triangles each, hanging off the slab's front edge
      for (let i = 0; i < n; i++) {
        const a = -0.1 + (i + 0.5) * (r * 2), x = s * (3.8 - 0.7 - 0.01), y0 = yE - 0.12;
        const P0 = (da, dy) => [x, y0 + dy, Zu(h.uOf(a + da))], c0 = TERRA.map((v) => v * 0.95), c1 = TERRA.map((v) => v * 0.7);
        const pts = [P0(-r, 0), P0(-r * 0.5, -r * 0.85), P0(r * 0.5, -r * 0.85), P0(r, 0)], ctr = P0(0, 0);
        for (let k = 0; k < 3; k++) det.triO(ctr, pts[k], pts[k + 1], c0, [-s, 0, 0]);
      }
    }
    if (h.gate) continue;
    // hero detail: door surround, step, knocker, grille, sill, lintel, balconies, flower boxes
    if (h.hero) {
      const dx0 = h.aDoor - 0.84, dx1 = h.aDoor + 0.84;
      for (const [a0, a1] of [[dx0 - 0.09, dx0 + 0.09], [dx1 - 0.09, dx1 + 0.09]]) houseBox(det, h, a0, a1, yF, yF + 1.85, -0.07, 0.0, SILL.map((v) => v * 1.05));
      const [wx, , wz] = [s * (3.8 - 0.05), 0, Zu(h.uOf(h.aDoor))];
      det.prim(new THREE.TorusGeometry(0.84, 0.085, 3, 9, Math.PI), [wx, yF + 1.85, wz], SILL.map((v) => v * 1.0), { ry: Math.PI / 2 });
      houseBox(det, h, h.aDoor - 0.95, h.aDoor + 0.95, yb, yF - 0.02, -0.4, 0, SILL.map((v) => v * 0.92));
      houseBox(det, h, h.aDoor - (h.flip ? -0.03 : 0.03) - 0.03, h.aDoor + 0.03, yF + 1.2, yF + 1.3, -0.1, -0.04, IRON);
      houseBox(det, h, h.aDoor - 0.07, h.aDoor + 0.07, yF + 1.0, yF + 1.14, -0.12, -0.04, IRON.map((v) => v * 1.4));
      // ground window: sill, lintel, grille of 9 bars
      houseBox(det, h, h.aWin - 0.62, h.aWin + 0.62, yF + 0.88, yF + 0.95, -0.17, 0, SILL.map((v) => v * 1.06));
      houseBox(det, h, h.aWin - 0.62, h.aWin + 0.62, yF + 2.48, yF + 2.58, -0.09, 0, SILL.map((v) => v * 1.02));
      for (let i = 0; i < 9; i++) { const a = h.aWin - 0.46 + i * 0.115; houseBox(det, h, a - 0.011, a + 0.011, yF + 0.95, yF + 2.45, -0.09, -0.068, IRON, "py,ny"); }
      for (const y of [yF + 1.05, yF + 2.0]) houseBox(det, h, h.aWin - 0.5, h.aWin + 0.5, y, y + 0.025, -0.095, -0.065, IRON);
      if (h.sillBox) { houseBox(det, h, h.aWin - 0.45, h.aWin + 0.45, yF + 0.95, yF + 1.1, -0.2, -0.04, lin("#B8643C")); nSill++; const v = nSill % 4; cards(flo, h, h.aWin, yF + 1.1, -0.12, 0.9, 0.26, v, false); }
      // balconies under the French doors
      h.balc.forEach((ab, bi) => {
        const a0 = ab - 0.95, a1 = ab + 0.95;
        houseBox(det, h, a0, a1, yF + 3.3, yF + 3.4, -0.62, 0.0, lin(BALC_SLAB));
        for (const sg of [-1, 1]) { const a = ab + sg * 0.7, x0 = s * 3.8, x1 = s * (3.8 - 0.55), za = Zu(h.uOf(a - 0.03)), zb = Zu(h.uOf(a + 0.03)), c = lin(BALC_SLAB, 0.8);
          det.triO([x0, yF + 3.3, za], [x1, yF + 3.3, za], [x0, yF + 2.75, za], c, [0, 0, za < zb ? -1 : 1]); det.triO([x0, yF + 2.75, zb], [x1, yF + 3.3, zb], [x0, yF + 3.3, zb], c, [0, 0, za < zb ? 1 : -1]);
          det.quadO([x0, yF + 2.75, za], [x0, yF + 2.75, zb], [x1, yF + 3.3, zb], [x1, yF + 3.3, za], c, [-s, -1, 0]); }
        // railing: 3 alpha cards (front and the two ends)
        const ry = yF + 3.4, rh = 0.95, fx = s * (3.8 - 0.6);
        const zl = Zu(h.uOf(a0)), zr = Zu(h.uOf(a1));
        rail.quad([fx, ry, zl], [fx, ry, zr], [fx, ry + rh, zr], [fx, ry + rh, zl], [1, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1], zl < zr ? s < 0 : s > 0);
        for (const [a, w] of [[a0, 0], [a1, 1]]) { const zz = Zu(h.uOf(a)); rail.quad([s * 3.8, ry, zz], [fx, ry, zz], [fx, ry + rh, zz], [s * 3.8, ry + rh, zz], [1, 1, 1], [0, 0, 0.33, 0, 0.33, 1, 0, 1]); }
        nBalc++;
        if (h.balcBox && h.balcBox[bi]) { houseBox(det, h, ab - 0.45, ab + 0.45, yF + 3.4, yF + 3.55, -0.58, -0.4, lin("#B8643C")); nBox++; cards(flo, h, ab, yF + 3.55, -0.49, 0.9, 0.26, (nBox + 1) % 4, true); }
      });
    }
    // 2 wall lanterns on iron brackets (look: small box and arm)
  }
  // ---- the mural wall (E5): u 11-23, 12 x 6.2 m
  { const wx = 3.8;
    body.box(FS, wx, wx + 0.35, -0.5, 6.34, 11, 23, lin("#D9CDB8", 0.8), "nx");
    body.box(FS, wx - 0.08, wx + 0.45, 6.34, 6.46, 10.9, 23.1, lin("#B5523B", 0.9));
    for (const u of [11, 23]) body.box(FS, wx - 0.05, wx + 0.05, -0.5, 6.34, u - 0.12, u + 0.12, lin("#D9CDB8", 0.9));
    const muralT = tex(paintMural(), { aniso: 8 }), mb = new Build();
    mb.quad(FS(wx - 0.003, 0.14, 23), FS(wx - 0.003, 0.14, 11), FS(wx - 0.003, 6.34, 11), FS(wx - 0.003, 6.34, 23), [1, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1]);
    const mm = std({ map: muralT, roughness: 0.95 }); ink(mm, 0.4); const mo = dress(new THREE.Mesh(mb.geo(), mm), { shadow: false }); mo.name = "mural"; g.add(mo); parts.tris += mb.tris; parts.calls++;
  }
  parts.body = body; parts.det = det; parts.roof = roof; parts.rail = rail; parts.flo = flo; parts.flowerSheet = flowerSheet; parts.nBalc = nBalc; parts.nBox = nBox; parts.nSill = nSill;
}
// 3 crossed flower cards (a box's blossoms): v picks one of the 4 variants in the 1024 x 128 sheet; into the Build `b` as textured quads
function cards(b, h, a, y, d, w, hgt, v, front) {
  const s = h.side, u0 = v / 4, u1 = (v + 1) / 4, x = s * (3.8 + d);
  const z0 = Zu(h.uOf(a - w / 2)), z1 = Zu(h.uOf(a + w / 2));
  b.quad([x, y, z0], [x, y, z1], [x, y + hgt, z1], [x, y + hgt, z0], [1, 1, 1], [u0, 0, u1, 0, u1, 1, u0, 1], z0 < z1 ? s < 0 : s > 0);
  for (const k of [-1, 0, 1]) { const zz = Zu(h.uOf(a + k * w * 0.3)), xa = s * (3.8 + d - 0.07), xb = s * (3.8 + d + 0.07); b.quad([xa, y, zz], [xb, y, zz], [xb, y + hgt, zz], [xa, y + hgt, zz], [1, 1, 1], [u0, 0, u0 + 0.12, 0, u0 + 0.12, 1, u0, 1]); }
}

// ================================================================================================ lamp posts, hoop, small things
const Y_UP = new THREE.Vector3(0, 1, 0);
// a thin round bar from A to B (n sides)
function bar(b, A, B, r, col, n = 4) {
  const a = new THREE.Vector3(...A), c = new THREE.Vector3(...B), d = c.clone().sub(a), len = d.length(), q = new THREE.Quaternion().setFromUnitVectors(Y_UP, d.normalize());
  const e = new THREE.Euler().setFromQuaternion(q, "YXZ"), mid = a.clone().add(c).multiplyScalar(0.5);
  b.prim(new THREE.CylinderGeometry(r, r, len, n, 1, true), [mid.x, mid.y, mid.z], col, { rx: e.x, ry: e.y, rz: e.z });
}
// E6: one lamp post, all heights above the pavement at the post (y0)
function post(b, glassB, x, y0, z, hero) {
  const seg = hero ? 12 : 8, sh = [[0.065, 0.75], [0.059, 1.52], [0.057, 1.66], [0.0475, 2.55]], rAt = (y) => { for (let i = 1; i < sh.length; i++) if (y <= sh[i][1]) return lerp(sh[i - 1][0], sh[i][0], (y - sh[i - 1][1]) / (sh[i][1] - sh[i - 1][1])); return sh[3][0]; };
  b.box(FW, x - 0.17, x + 0.17, y0, y0 + 0.3, z - 0.17, z + 0.17, IRON, "ny");
  b.prim(lathe([[0.13, 0.3], [0.145, 0.34], [0.12, 0.37], [0.115, 0.46], [0.135, 0.5], [0.108, 0.53], [0.1, 0.75]], 8), [x, y0, z], IRON.map((v) => v * 1.1));
  // shaft: 12 flutes (24 sides, every other one pulled in) on the posts that sit near the cameras
  const sg = new THREE.LatheGeometry(sh.map(([r, y]) => new THREE.Vector2(r, y)), hero ? 24 : seg);
  if (hero) { const p = sg.attributes.position, n = sh.length; for (let i = 0; i < p.count; i++) if (Math.floor(i / n) % 2) { p.setX(i, p.getX(i) * 0.93); p.setZ(i, p.getZ(i) * 0.93); } }
  b.prim(sg, [x, y0, z], IRON.map((v) => v * 1.25));
  for (const cy of [0.8, 1.25, 1.7, 2.55]) { const r = rAt(cy); b.prim(lathe([[r, cy - 0.02], [r + 0.03, cy], [r, cy + 0.02]], seg), [x, y0, z], IRON.map((v) => v * 1.5)); }
  // ladder bar 2.62, .50 wide, diameter .025, ball ends
  b.prim(new THREE.CylinderGeometry(0.0125, 0.0125, 0.5, 6, 1, true), [x, y0 + 2.62, z], IRON.map((v) => v * 1.3), { rz: Math.PI / 2 });
  for (const sx of [-0.25, 0.25]) b.prim(new THREE.IcosahedronGeometry(0.022, 0), [x + sx, y0 + 2.62, z], IRON.map((v) => v * 1.3));
  // lantern 2.75-3.35: four tapered panes, black bars, plate and frame
  const lo = 0.11, hi = 0.17, yb = y0 + 2.75, yt = y0 + 3.35, C = (sx, sz, y, k) => [x + sx * k, y, z + sz * k];
  for (const [ax, az, bx, bz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]]) {
    glassB.quad(C(ax, az, yb, lo), C(bx, bz, yb, lo), C(bx, bz, yt, hi), C(ax, az, yt, hi), lin("#FFD98A"), [0, 0, 1, 0, 1, 1, 0, 1], false);
    bar(b, C(ax, az, yb, lo), C(ax, az, yt, hi), 0.011, [0.02, 0.02, 0.02], 4);
  }
  glassB.prim(new THREE.IcosahedronGeometry(0.055, 0), [x, y0 + 3.02, z], lin("#FFF2C4"), { s: [1, 1.5, 1] });
  b.box(FW, x - 0.14, x + 0.14, yb - 0.04, yb, z - 0.14, z + 0.14, IRON.map((v) => v * 1.2));
  b.box(FW, x - 0.195, x + 0.195, yt, yt + 0.03, z - 0.195, z + 0.195, IRON.map((v) => v * 1.2));
  b.prim(new THREE.ConeGeometry(0.28, 0.1, 4, 1, true), [x, y0 + 3.38 + 0.05, z], IRON.map((v) => v * 1.3), { ry: Math.PI / 4 });
  b.prim(new THREE.IcosahedronGeometry(0.026, 0), [x, y0 + 3.47, z], IRON.map((v) => v * 1.4));
  b.prim(new THREE.ConeGeometry(0.01, 0.06, 4), [x, y0 + 3.5, z], IRON.map((v) => v * 1.4));
}

function buildFurniture(g, parts) {
  const R = mulberry(SEED + 800), F = { lamps: [], glows: [], lights: [] };
  // ---- posts
  const pb = new Build(), gb = new Build();
  LAMPS.forEach(([s, u, hero], i) => { const [x, y, z] = lampPos(i); post(pb, gb, x, y, z, i < 2); });
  // ---- the hoop (E5)
  const yc = RIM_Y + 0.30, hb = new Build(), hoopG = new THREE.Group();
  hoopG.position.set(3.05, yc, Zu(17)); hoopG.rotation.y = Math.atan2(-0.57, 0.82);
  hb.box(FW, -0.6, 0.6, -0.45, 0.45, -0.045, -0.004, lin("#CFC9BD"), "pz");
  hb.prim(new THREE.TorusGeometry(0.2, 0.018, 5, 16), [0, RIM_Y - 0.018 - yc, 0.30], lin("#E86A1C"), { rx: Math.PI / 2 });
  hb.box(FW, -0.06, 0.06, RIM_Y - 0.03 - yc, RIM_Y - 0.005 - yc, 0.0, 0.1, lin("#E86A1C", 0.8));
  const boardG = new THREE.PlaneGeometry(1.2, 0.9); boardG.translate(0, 0, 0.0);
  const boardM = std({ map: tex(paintBoard()), roughness: 0.9 }); ink(boardM, 0.5);
  const boardO = dress(new THREE.Mesh(boardG, boardM), { shadow: true }); hoopG.add(boardO);
  const hoopO = dress(new THREE.Mesh(hb.geo(), vcMat()), { shadow: true }); hoopG.add(hoopO); parts.tris += hb.tris + 2; parts.calls += 2;
  g.add(hoopG); F.hoopG = hoopG;
  // steel arm and wall plate (world), braces
  const ab = new Build(), yb2 = yc - 0.05;
  ab.box(FW, 3.05, 3.8, yb2 - 0.025, yb2 + 0.025, Zu(17) - 0.025, Zu(17) + 0.025, IRON);
  ab.box(FW, 3.76, 3.8, yc - 0.45, yc + 0.18, Zu(17) - 0.1, Zu(17) + 0.1, IRON.map((v) => v * 1.2));
  bar(ab, [3.8, yc - 0.55, Zu(17)], [3.28, yb2, Zu(17)], 0.016, IRON.map((v) => v * 1.1), 4);
  const armO = dress(new THREE.Mesh(ab.geo(), vcMat()), { shadow: true }); g.add(armO); parts.tris += ab.tris; parts.calls++;
  // the net: 13 columns x 5 rows, a tube with an alpha card (12 loops)
  { const NR = 5, NC = 13, pos = new Float32Array(NR * NC * 3), uv = new Float32Array(NR * NC * 2), idx = [];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { uv[(j * NC + i) * 2] = i / 12; uv[(j * NC + i) * 2 + 1] = 1 - j / (NR - 1); if (i < NC - 1 && j < NR - 1) { const a = j * NC + i; idx.push(a, a + NC, a + 1, a + 1, a + NC, a + NC + 1); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = std({ map: tex(paintNet()), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1 }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const pivot = new THREE.Group(); pivot.position.set(0, RIM_Y - 0.018 - yc, 0.30); hoopG.add(pivot);
    const net = dress(new THREE.Mesh(geo, m), { steam: true, solid: false, shadow: false, cull: false }); pivot.add(net);
    F.net = { pivot, geo, NR, NC }; parts.tris += (NR - 1) * (NC - 1) * 2; parts.calls++;
  }
  // ---- wall lanterns (2), wires (3) with a pair of sneakers on the u 47 wire, bench, handcart, pots
  const sb = new Build();
  for (const [s, u] of [[-1, 9.5], [1, 63.5]]) {
    const h = HOUSES.find((q) => q.side === s && q.u0 <= u && u < q.u1) || HOUSES[0], y = h.yF + 2.9, x = s * 3.8, z = Zu(u);
    sb.box(FW, Math.min(x, x - s * 0.35), Math.max(x, x - s * 0.35), y + 0.15, y + 0.18, z - 0.015, z + 0.015, IRON);
    bar(sb, [x, y - 0.1, z], [x - s * 0.3, y + 0.16, z], 0.012, IRON, 4);
    gbPush(gb, x - s * 0.3, y - 0.1, z, 0.07); sb.box(FW, x - s * 0.3 - 0.085, x - s * 0.3 + 0.085, y - 0.14, y - 0.12, z - 0.085, z + 0.085, IRON); sb.prim(new THREE.ConeGeometry(0.11, 0.07, 4, 1, true), [x - s * 0.3, y + 0.2, z], IRON, { ry: Math.PI / 4 });
    F.glows.push({ x: x - s * 0.3, y: y - 0.05, z, size: 0.9, k: 0.55, wall: true });
  }
  for (const u of [18, 47, 90]) {
    const y0 = Yst(u) + 5.45, pts = [], N = 10;
    for (let i = 0; i <= N; i++) { const t = i / N; pts.push(new THREE.Vector3(lerp(-3.8, 3.8, t), y0 - 0.5 * 4 * t * (1 - t), Zu(u))); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.007, 3, false); sb.prim(tg, [0, 0, 0], [0.05, 0.05, 0.05]);
    if (u === 47) {   // the sneakers, laces knotted over the wire
      const midY = y0 - 0.5, c0 = [[0.02, "#F4EFE4", "#C23A2B"], [0.27, "#C23A2B", "#F4EFE4"]];
      for (const [dx, body, trim] of c0) { const x = dx, y = midY - 0.38; bar(sb, [x, midY, Zu(u)], [x, y + 0.1, Zu(u)], 0.004, [0.9, 0.9, 0.9], 3);
        sb.prim(new THREE.IcosahedronGeometry(0.1, 1), [x, y, Zu(u)], lin(body), { s: [0.55, 0.5, 1.0] }); sb.prim(new THREE.BoxGeometry(0.1, 0.025, 0.28), [x, y - 0.06, Zu(u)], lin(trim)); sb.prim(new THREE.SphereGeometry(0.05, 6, 4), [x, y + 0.04, Zu(u) + 0.07], lin(trim), { s: [0.9, 0.8, 0.9] }); }
    }
  }
  // bench at u 35 on the stair pavement, left
  { const u = 35, y = padL(u), x = -3.35, z = Zu(u), wd = lin("#8A5A3C");
    sb.box(FW, x - 0.2, x + 0.2, y + 0.42, y + 0.47, z - 0.8, z + 0.8, wd); sb.box(FW, x - 0.2, x - 0.17, y + 0.5, y + 0.82, z - 0.8, z + 0.8, wd.map((v) => v * 0.9));
    for (const dz of [-0.7, 0.7]) for (const dx of [-0.15, 0.15]) sb.box(FW, x + dx - 0.025, x + dx + 0.025, y, y + 0.42, z + dz - 0.025, z + dz + 0.025, lin("#5B3A2A")); }
  // green handcart at u 66 right
  { const u = 66, y = padR(u), x = 3.2, z = Zu(u), gr = lin("#4E7F3F");
    sb.box(FW, x - 0.28, x + 0.28, y + 0.3, y + 0.34, z - 0.45, z + 0.45, gr); for (const sx of [-1, 1]) sb.box(FW, x + sx * 0.28 - 0.02, x + sx * 0.28 + 0.02, y + 0.34, y + 0.62, z - 0.45, z + 0.45, gr.map((v) => v * 0.85));
    sb.box(FW, x - 0.28, x + 0.28, y + 0.34, y + 0.62, z - 0.47, z - 0.43, gr.map((v) => v * 0.8));
    for (const sx of [-1, 1]) sb.prim(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 10), [x + sx * 0.3, y + 0.17, z - 0.05], lin("#2A2226"), { rz: Math.PI / 2 });
    for (const sx of [-1, 1]) bar(sb, [x + sx * 0.2, y + 0.4, z + 0.45], [x + sx * 0.2, y + 0.55, z + 1.15], 0.017, lin("#8A5A3C"), 4); }
  // 5 flower pots on the stair pavement
  for (const [u, k] of [[23, 0], [39, 1], [50, 2], [61, 3], [71, 0]]) {
    const y = padL(u), x = -3.45, z = Zu(u); sb.prim(lathe([[0.09, 0], [0.13, 0.26], [0.145, 0.27], [0.12, 0.29]], 8), [x, y, z], lin("#B8643C"));
    sb.prim(new THREE.IcosahedronGeometry(0.16, 0), [x, y + 0.42, z], lin(["#4E7F3F", "#3F6B3A", "#6E9A4A", "#4E7F3F"][k]), { s: [1, 0.9, 1] });
    if (k % 2 === 0) sb.prim(new THREE.IcosahedronGeometry(0.05, 0), [x + 0.05, y + 0.52, z], lin("#D8432E"));
  }
  parts.postsB = pb; parts.glassB = gb; parts.smallB = sb;
  return F;
}
const gbPush = (gb, x, y, z, s) => { gb.box(FW, x - s, x + s, y - 0.1, y + 0.1, z - s, z + s, lin("#FFD98A")); };

// ================================================================================================ shared time tables (pure of t)
// cumulative integrals on a 0.05 s grid: waves (sqrt w) and the gutter chevrons (1.2 sqrt w x rain share)
const rivK = (t) => clamp(rainV(t) / 3.6, 0, 1);
const TAB = (() => { const dt = 0.05, N = 1700, wave = new Float32Array(N + 1), riv = new Float32Array(N + 1); for (let i = 1; i <= N; i++) { const a = (i - 1) * dt, b = i * dt, f = (t) => Math.sqrt(weight(t)), r = (t) => 1.2 * Math.sqrt(weight(t)) * rivK(t); wave[i] = wave[i - 1] + 0.5 * (f(a) + f(b)) * dt; riv[i] = riv[i - 1] + 0.5 * (r(a) + r(b)) * dt; } return { dt, wave, riv }; })();
const tab = (arr, t) => { const x = clamp(t / TAB.dt, 0, arr.length - 1.001), i = Math.floor(x); return lerp(arr[i], arr[i + 1], x - i); };
// the dome's el-35 colour x .85 (B3 keys, linear sRGB): puddles and the flood take their sky from it
const _D = new THREE.Color("#6F78B8"), _N = new THREE.Color("#141C3E"), _T = new THREE.Color("#46508F"), _c = new THREE.Color();
function skyAt(t, out = new THREE.Color()) {
  const N = night(t, 0), A = flicker(t), s = spin(t); out.copy(_D).lerp(_N, N); _c.copy(_T); _c.lerp(out, A); out.copy(_c);
  return out.multiplyScalar(0.85 * keys(s, [[15, 1], [16.5, 0.62], [18.5, 0.8]]));
}
const sunDir = (t, out = new THREE.Vector3()) => { const { az, el } = sunAt(t), a = (az * Math.PI) / 180, e = (el * Math.PI) / 180; return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

// F5.2: 48 beads over the 9 puddles; each slot repeats a cycle: dome, neck, pinch-off (a bead and ONE ring), rise, rest
const PB_COUNT = [4, 3, 8, 4, 5, 7, 3, 8, 6];
const PB = []; PUDDLES.forEach((p, i) => { for (let j = 0; j < PB_COUNT[i]; j++) PB.push({ p: i, j, id: 2000 + i * 16 + j }); });
const PUD_SHRINK = (t) => 1 - 0.7 * P(t, 50, 55);
const T_RISE = 50.0, TP = 0.62;
function beadState(b, t) {
  const T = 3.4 + 1.8 * hh(b.id, 0, 1), t0 = T_RISE + 0.05 + 1.1 * hh(b.id, 0, 2);
  if (t < t0) return null;
  const k = Math.floor((t - t0) / T), tau = t - t0 - k * T; if (tau > 0.78 * T) return null;
  const [u, cx, sx, su] = PUDDLES[b.p], sh = PUD_SHRINK(t);
  const x = cx + (hh(b.id, k, 3) - 0.5) * sx * 0.8 * sh, uu = u + (hh(b.id, k, 4) - 0.5) * su * 0.8 * sh, y0 = Yst(uu) + 0.012, d = 0.014 + 0.012 * hh(b.id, k, 5);
  const up = 0.55 + 0.8 * Math.max(0, -rainV(t)), free = tau >= TP;
  const rise = free ? up * (tau - TP) : 0, y = y0 + (free ? 0.05 + rise : 0), end = clamp((tau - (0.78 * T - 0.4)) / 0.4);
  return { x, z: Zu(uu), y0, y, d: d * (1 - end * 0.6), tau, free, dome: clamp(tau / 0.4), neck: free ? Math.max(0, 1 - (tau - TP) / 0.16) : clamp((tau - 0.4) / 0.22), ring: free ? (tau - TP) / 1.3 : -1, hide: end >= 1 };
}

// ================================================================================================ sstreet: the street itself
function glowTex() {
  return tex(cv(128, 128, (g, W) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,240,190,1)"); gr.addColorStop(0.18, "rgba(255,210,130,0.75)"); gr.addColorStop(0.5, "rgba(255,170,80,0.22)"); gr.addColorStop(1, "rgba(255,150,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, W); }));
}
function lacTex() {
  const R = mulberry(SEED + 900);
  return tex(cv(256, 256, (g, W, H) => { for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, r = 3 + R() * 12; g.strokeStyle = `rgba(255,255,255,${0.35 + R() * 0.5})`; g.lineWidth = 1.5 + R() * 2; g.beginPath(); g.arc(x, y, r, R() * 3, R() * 3 + 2.2); g.stroke(); } for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + R() * 0.5})`; g.beginPath(); g.arc(R() * W, R() * H, 1 + R() * 2.4, 0, TAU); g.fill(); } }), { repeat: true });
}
function chevTex() {
  return tex(cv(64, 128, (g, W, H) => { g.strokeStyle = "rgba(235,245,255,0.95)"; g.lineWidth = 5; g.lineCap = "round"; g.lineJoin = "round"; for (let k = 0; k < 3; k++) { const y = (k + 0.5) * (H / 3); g.beginPath(); g.moveTo(10, y - 12); g.lineTo(32, y + 6); g.lineTo(54, y - 12); g.stroke(); } }), { repeat: true });
}
const PUD_VS = `
attribute vec3 aC; attribute vec2 aLoc; attribute vec2 aLamp; uniform float uShrink; uniform float uPh;
varying vec2 vLoc; varying vec3 vW; varying float vId; varying vec2 vLamp;
void main(){ float r = length(aLoc); float a = atan(aLoc.y, aLoc.x);
  float wob = 1.0 + 0.03 * smoothstep(0.5, 1.0, r) * sin(uPh * 2.6 + a * 3.0 + aC.x * 5.0) + 0.02 * smoothstep(0.5, 1.0, r) * sin(uPh * 4.1 - a * 5.0 + aC.z);
  vec3 p = aC + (position - aC) * uShrink * vec3(wob, 1.0, wob); vLoc = aLoc; vW = p; vId = aC.x * 3.1 + aC.z * 0.7; vLamp = aLamp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const PUD_FS = `
precision highp float; varying vec2 vLoc; varying vec3 vW; varying float vId; varying vec2 vLamp;
uniform vec3 uSky; uniform float uPh, uGain, uN; uniform vec4 uRing[32]; uniform vec3 uWarm;
float h1(float n){ return fract(sin(n * 91.3458) * 47453.5453); }
void main(){
  float r = length(vLoc); if (r > 1.02) discard;
  vec3 c = uSky; float rip = 0.0;
  for (int k = 0; k < 5; k++) { vec2 cc = (vec2(h1(vId + float(k) * 3.7), h1(vId * 1.7 + float(k) * 5.3)) - 0.5) * 1.3; float d = length(vLoc - cc); float ph = fract(uPh * 0.22 + h1(vId + float(k) * 9.1));
    for (int j = 0; j < 2; j++) { float rr = ph * 0.8 - float(j) * 0.17; float v = exp(-pow((d - rr) * 7.0, 2.0)) * (1.0 - ph) * step(0.0, rr); rip += v * (j == 0 ? 1.0 : 0.6); } }
  c += rip * 0.11;
  for (int i = 0; i < 32; i++) { if (i >= int(uN)) break; vec4 e = uRing[i]; float d = distance(vW.xz, e.xy); float rr = 0.025 + e.z * 0.3; c += vec3(0.85, 0.93, 1.0) * exp(-pow((d - rr) * 70.0, 2.0)) * (1.0 - e.z) * e.w; }
  float st = exp(-pow((vLoc.x - vLamp.x) * 3.2, 2.0)) * exp(-pow(vLoc.y * 0.9, 2.0)) * vLamp.y * uGain; c = mix(c, uWarm, clamp(st, 0.0, 0.8));
  c += vec3(0.07, 0.08, 0.1) * smoothstep(0.35, -0.5, vLoc.y + vLoc.x * 0.3);
  c = mix(c, vec3(0.16, 0.13, 0.15), smoothstep(0.78, 1.0, r) * 0.7);
  gl_FragColor = vec4(c, 1.0); }`;
function buildPuddles(g) {
  const pos = [], aC = [], loc = [], lamp = [], idx = []; let n = 0;
  PUDDLES.forEach(([u, cx, sx, su], i) => {
    const hx = sx / 2, hu = su / 2, cy = Yst(u) + 0.012, cz = Zu(u);
    let nl = 0, best = 1e9; LAMPS.forEach(([s, ul], k) => { const d = Math.abs(ul - u); if (d < best) { best = d; nl = k; } });
    const ls = clamp(1 - best / 16), lx = clamp((LAMPS[nl][0] * 3.2 - cx) / hx, -0.7, 0.7) * 0.8;
    const base = n; pos.push(cx, cy, cz); aC.push(cx, cy, cz); loc.push(0, 0); lamp.push(lx, ls); n++;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU, rho = 0.88 + 0.2 * hh(3, i, k), lxn = Math.cos(a) * rho, lun = Math.sin(a) * rho;
      pos.push(cx + lxn * hx, Yst(u + lun * hu) + 0.012, Zu(u + lun * hu)); aC.push(cx, cy, cz); loc.push(lxn, lun); lamp.push(lx, ls); n++;
      idx.push(base, base + 1 + k, base + 1 + ((k + 1) % 12));
    }
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("aC", new THREE.Float32BufferAttribute(aC, 3)); geo.setAttribute("aLoc", new THREE.Float32BufferAttribute(loc, 2)); geo.setAttribute("aLamp", new THREE.Float32BufferAttribute(lamp, 2)); geo.setIndex(idx);
  const U = { uSky: { value: new THREE.Color() }, uPh: { value: 0 }, uGain: { value: 1 }, uShrink: { value: 1 }, uN: { value: 0 }, uRing: { value: Array.from({ length: 32 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uWarm: { value: new THREE.Color("#FFC873") } };
  const m = flat(new THREE.ShaderMaterial({ uniforms: U, vertexShader: PUD_VS, fragmentShader: PUD_FS, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.userData.noOutline = true;
  const o = dress(new THREE.Mesh(geo, m), { steam: true, solid: false, order: 1, cull: false }); o.name = "puddles"; g.add(o);
  return { U, tris: idx.length / 3 };
}

// ---- the flood at the street end (E4 street end, F6): a sloped swash sheet up the cobbles + the level sea behind it
const FL_VS = `varying vec3 vW; varying float vU; uniform float uFront; void main(){ vW = position; vU = -(position.z + 3.0) - uFront; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FL_FS = `precision highp float; varying vec3 vW; varying float vU;
uniform vec3 uSky, uDeep, uShallow, uSun; uniform float uT, uLevel, uSheet; uniform sampler2D uLace;
void main(){
  float dU = vU; float depth = clamp(0.16 * max(dU, 0.0), 0.0, 4.0);
  vec3 col = mix(uShallow, uDeep, 1.0 - exp(-depth * 0.9));
  vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
  col = mix(col, uSky * 1.25, clamp(fr * 0.55, 0.0, 0.7));
  float w1 = sin(vW.x * 1.7 + vW.z * 0.55 + uT * 1.3) * sin(vW.z * 0.9 - uT * 0.9 + vW.x * 0.8); col *= 0.9 + 0.14 * w1;
  float cap = texture2D(uLace, vW.xz * 0.11 + vec2(uT * 0.01, -uT * 0.025)).r * texture2D(uLace, vW.xz * 0.19 + 0.5).r;
  col = mix(col, vec3(0.9, 0.96, 1.0), smoothstep(0.3, 0.75, cap * 2.4) * 0.5 * smoothstep(0.3, 2.0, depth));
  vec3 sd = normalize(uSun); float sp = pow(clamp(dot(reflect(-V, vec3(0.0, 1.0, 0.0)), sd), 0.0, 1.0), 40.0); col += vec3(1.0, 0.8, 0.55) * sp * 0.6;
  vec2 q = vW.xz * 0.45 + vec2(uT * 0.05, -uT * 0.11); float lace = texture2D(uLace, q).r * texture2D(uLace, q * 1.7 + 0.31).r * 2.2;
  float band = smoothstep(1.3, 0.0, dU) * smoothstep(-1.6, -0.1, dU);   // 1.2 m lace strip behind the waterline, the swash in front of it
  float foam = clamp(band * (0.35 + lace * 1.1), 0.0, 1.0); foam = max(foam, smoothstep(0.25, 0.0, abs(dU)) * 0.9);
  col = mix(col, vec3(0.96, 0.98, 1.0), foam);
  float a = clamp(0.32 + depth * 0.9 + foam, 0.0, 0.96); if (uSheet > 0.5 && dU < 0.0) a = clamp(0.5 + foam, 0.0, 0.95);
  gl_FragColor = vec4(col, a); }`;
function buildFlood(g) {
  const NX = 9, NZ = 40, NS = 4, rows = NS + NZ + 1, pos = new Float32Array(NX * rows * 3), idx = [];
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; idx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const U = { uSky: { value: new THREE.Color() }, uDeep: { value: new THREE.Color("#1F6E88") }, uShallow: { value: new THREE.Color("#58B8C4") }, uSun: { value: new THREE.Vector3(0, 0.5, -1) }, uT: { value: 0 }, uLevel: { value: 0 }, uSheet: { value: 0 }, uLace: { value: lacTex() }, uFront: { value: 0 } };
  const m = flat(new THREE.ShaderMaterial({ uniforms: U, vertexShader: FL_VS, fragmentShader: FL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.userData.noOutline = true;
  const o = dress(new THREE.Mesh(geo, m), { steam: true, solid: false, order: 3, cull: false }); o.name = "flood"; o.visible = false; g.add(o);
  return { o, U, pos, geo, NX, NZ, NS, rows, tris: idx.length / 3 };
}
function updateFlood(F, t) {
  const yw = seaY(t) - 6 * lift(t), uF = (-9 - yw) / SLOPE, UB = 134;
  if (!(uF < 130) || uF < 40) { F.o.visible = false; return; }
  F.o.visible = true; F.U.uFront.value = uF; F.U.uT.value = t;
  const amp = 0.05 * (1 + 1.4 * P(t, 43.3, 48)), spd = 1 - 0.65 * P(t, 43.3, 48), sw = 1.5 * (0.5 + 0.5 * Math.sin((TAU * t) / 2.4)), uA = Math.max(0, uF - sw);
  const p = F.pos; let k = 0;
  const row = (u, h, disp) => { for (let i = 0; i < F.NX; i++) { const x = lerp(-3.78, 3.78, i / (F.NX - 1)); p[k++] = x; p[k++] = h + (disp ? amp * disp * (Math.sin(u * 0.55 + t * 1.7 * spd + x * 0.9) + 0.6 * Math.sin(u * 1.3 - t * 2.3 * spd + x * 2.1)) : 0); p[k++] = Zu(u); } };
  for (let s = 0; s < F.NS; s++) { const u = lerp(uA, uF, s / F.NS); row(u, Yst(u) + 0.02, 0); }
  for (let j = 0; j <= F.NZ; j++) { const u = lerp(uF, UB, j / F.NZ); row(u, yw, sm(0, 3, u - uF)); }
  F.geo.attributes.position.needsUpdate = true; F.geo.computeBoundingSphere();
  skyAt(t, F.U.uSky.value); sunDir(t, F.U.uSun.value);
}

// ---- the street kind
function buildStreet(P_) {
  const S_ = P_.spec, g = P_.whole, parts = { tris: 0, calls: 0 };
  buildGround(g, parts);
  buildHouses(g, parts);
  const F = buildFurniture(g, parts);
  const vcM = vcMat(), addVc = (b, name, o = {}) => { const m = new THREE.Mesh(b.geo(), vcM); dress(m, { shadow: false, ...o }); m.name = name; g.add(m); parts.tris += b.tris; parts.calls++; return m; };
  addVc(parts.stoneB, "stone"); addVc(parts.body, "bodies"); addVc(parts.det, "details"); addVc(parts.smallB, "smallthings"); addVc(parts.postsB, "posts", { shadow: true });
  // the roofs, railings, flower cards
  { const m = std({ map: tex(paintTiles(), { repeat: true }), roughness: 0.9 }); ink(m, 0.3); const o = dress(new THREE.Mesh(parts.roof.geo(), m)); o.name = "roofs"; g.add(o); parts.tris += parts.roof.tris; parts.calls++; }
  { const m = std({ map: tex(paintRailing()), alphaTest: 0.4, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; const o = dress(new THREE.Mesh(parts.rail.geo(), m), { steam: true, solid: false }); o.name = "railings"; g.add(o); parts.tris += parts.rail.tris; parts.calls++; }
  { const m = std({ map: tex(parts.flowerSheet), alphaTest: 0.4, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; const o = dress(new THREE.Mesh(parts.flo.geo(), m), { steam: true, solid: false }); o.name = "flowers"; g.add(o); parts.tris += parts.flo.tris; parts.calls++; }
  // the lantern glass (unlit, live colour)
  const glassM = flat(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0xffffff })); glassM.toneMapped = false;
  { const o = dress(new THREE.Mesh(parts.glassB.geo(), glassM), { steam: true, solid: false, order: 2 }); o.name = "lantern-glass"; g.add(o); parts.tris += parts.glassB.tris; parts.calls++; }
  // bougainvillea: two climbers, 9 billow cards each (E4)
  const climbers = [];
  for (const [side, uc, uSpan, variant, hang] of [[-1, 26, 8, 0, false], [1, 58.5, 7.4, 1, true]]) {
    const h = HOUSES.find((q) => q.side === side && q.u0 <= uc && uc < q.u1), b = new Build(), R = mulberry(SEED + 1000 + variant);
    for (let i = 0; i < 9; i++) {
      const cx = i % 3, cy = Math.floor(i / 3), u = uc - uSpan / 2 + (cx + 0.5) * (uSpan / 3) + (R() - 0.5) * 1.0, w = 1.6 + R() * 0.5, hg = 1.4 + R() * 0.5;
      const y = hang ? h.yE - 1.2 - cy * 0.5 - (R() * 0.3) : h.yF + 0.8 + cy * 1.85 + R() * 0.4, d = hang ? -0.2 - R() * 0.7 : -0.18 - R() * 0.3, psi = (R() - 0.5) * 0.8;
      const n0 = [-side, 0, 0], r0 = [0, 0, side], r = [r0[0] * Math.cos(psi) + n0[0] * Math.sin(psi), 0, r0[2] * Math.cos(psi) + n0[2] * Math.sin(psi)];
      const c = [side * (3.8 + d), y, Zu(u)], C = (sr, su) => [c[0] + r[0] * w / 2 * sr, c[1] + su * hg / 2, c[2] + r[2] * w / 2 * sr];
      const u0 = cx / 3 + 0.004, u1 = (cx + 1) / 3 - 0.004, v0 = 1 - (cy + 1) / 3 + 0.004, v1 = 1 - cy / 3 - 0.004;
      b.quad(C(-1, -1), C(1, -1), C(1, 1), C(-1, 1), [1, 1, 1], [u0, v0, u1, v0, u1, v1, u0, v1]);
    }
    const m = std({ map: tex(paintBougain(variant)), alphaTest: 0.3, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const o = dress(new THREE.Mesh(b.geo(), m), { steam: true, solid: false }); o.name = `bougainvillea${variant}`; g.add(o); parts.tris += b.tris; parts.calls++;
  }
  // decals on the cobbles (E2): manhole, patches, hopscotch, stains, petal drifts
  { const dT = tex(paintDecals()), b = new Build(), D = (cx, cy, cw, ch, x, u, w, l, swap) => {
      const u0 = cx / 2048, u1 = (cx + cw) / 2048, v0 = 1 - (cy + ch) / 1024, v1 = 1 - cy / 1024, uvs = swap ? [u0, v1, u0, v0, u1, v0, u1, v1] : [u0, v0, u1, v0, u1, v1, u0, v1];
      b.quad(FS(x - w / 2, 0.006, u - l / 2), FS(x + w / 2, 0.006, u - l / 2), FS(x + w / 2, 0.006, u + l / 2), FS(x - w / 2, 0.006, u + l / 2), [1, 1, 1], uvs); };
    D(0, 0, 256, 256, 0.15, 44, 0.64, 0.64);
    D(256, 0, 290, 194, -1.55, 6.2, 1.2, 0.8); D(556, 0, 290, 194, 0.9, 71, 1.2, 0.8);
    D(0, 256, 1024, 300, -1.5, 13.5, 0.9, 3.0, true);
    for (let i = 0; i < 7; i++) D(90 + i * 220 - 100, 660, 200, 200, -2.0 + 3.8 * hh(7, i, 0), 4 + 112 * hh(7, i, 1), 0.85, 0.85);
    for (let i = 0; i < 9; i++) D(130 + (i % 5) * 380 - 130, i < 5 ? 845 : 935, 260, 80, -2.2 + 4.4 * hh(8, i, 0), 6 + 110 * hh(8, i, 1), 1.1, 0.4);
    const m = flat(new THREE.MeshBasicMaterial({ map: dT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.color.setScalar(0.92);
    const o = dress(new THREE.Mesh(b.geo(), m), { steam: true, solid: false, order: 1 }); o.name = "decals"; g.add(o); parts.tris += b.tris; parts.calls++; F.decal = m; }
  // wet: a dark film over the carriageway (18 % darker from 31 s) and warm strokes under the lamps
  const wetM = flat(new THREE.MeshBasicMaterial({ color: "#0a0d18", transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  { const b = new Build(); b.quad(FS(-2.6, 0.004, 0), FS(2.6, 0.004, 0), FS(2.6, 0.004, U_END), FS(-2.6, 0.004, U_END), [1, 1, 1]); const o = dress(new THREE.Mesh(b.geo(), wetM), { steam: true, solid: false, order: 1 }); o.name = "wet"; g.add(o); parts.tris += 2; parts.calls++; }
  const strokeM = flat(new THREE.MeshBasicMaterial({ map: tex(paintWetStrokes()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  { const b = new Build(); LAMPS.forEach(([s, u]) => { b.quad(FS(-1.6, 0.008, u - 2.2), FS(1.6, 0.008, u - 2.2), FS(1.6, 0.008, u + 2.2), FS(-1.6, 0.008, u + 2.2), [1, 1, 1]); }); const o = dress(new THREE.Mesh(b.geo(), strokeM), { steam: true, solid: false, order: 2 }); o.name = "wet-strokes"; g.add(o); parts.tris += b.tris; parts.calls++; }
  // the gutter rivulet with three highlight chevrons a metre (right kerb, running downhill)
  const chevM = flat(new THREE.MeshBasicMaterial({ map: chevTex(), transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  { const b = new Build(); b.quad(FS(2.33, 0.007, 0), FS(2.58, 0.007, 0), FS(2.58, 0.007, U_END), FS(2.33, 0.007, U_END), [1, 1, 1], [0, 0, 1, 0, 1, U_END, 0, U_END]); const o = dress(new THREE.Mesh(b.geo(), chevM), { steam: true, solid: false, order: 2 }); o.name = "rivulet"; g.add(o); parts.tris += 2; parts.calls++; }
  const pud = buildPuddles(g); parts.tris += pud.tris; parts.calls++;
  const fld = buildFlood(g); parts.tris += fld.tris; parts.calls++;
  // lantern glows (sprites) and the points of light: L1 and L2 only (CPU; the rest are glow only)
  const gT = glowTex(), glows = [];
  const mkGlow = (x, y, z, size, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gT, color: "#FFC873", blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: true, fog: false })); sp.position.set(x, y, z); sp.scale.setScalar(size); sp.userData.steam = true; sp.userData.solid = false; sp.userData.glow = true; sp.renderOrder = 4; g.add(sp); glows.push({ sp, size, k }); };
  LAMPS.forEach((_, i) => { const [x, y, z] = lampPos(i); mkGlow(x, y + 3.05, z, 1.4, 1); });
  F.glows.forEach((q) => mkGlow(q.x, q.y, q.z, q.size, q.k));
  const lights = [0, 1].map((i) => { const [x, y, z] = lampPos(i), l = new THREE.PointLight("#FFC873", 5, 7, 2); l.position.set(x, y + 3.05, z); l.castShadow = false; g.add(l); return l; });
  // step splashes (E3): up to 3 events [t0, x, u] in spec.splash, 14 drops each under gravity 9.81 w at the launch time
  const SP = Array.isArray(S_.splash) ? S_.splash.slice(0, 3) : [];
  const dropGeo = new THREE.IcosahedronGeometry(1, 0), dropM = std({ color: "#BFD6EE", roughness: 0.3 }); dropM.userData.noOutline = true; dropM.userData.outlineParameters = { visible: false };
  const drops = new THREE.InstancedMesh(dropGeo, dropM, 14 * 3); drops.frustumCulled = false; drops.count = 0; dress(drops, { steam: true, solid: false, cull: false }); g.add(drops);
  const arcN = 12, arcPos = new Float32Array(3 * 2 * (arcN + 1) * 2 * 3), arcG = new THREE.BufferGeometry(), arcIdx = [];
  for (let e = 0; e < 6; e++) for (let i = 0; i < arcN; i++) { const a = (e * (arcN + 1) + i) * 2; arcIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  arcG.setAttribute("position", new THREE.BufferAttribute(arcPos, 3)); arcG.setIndex(arcIdx);
  const arcM = flat(new THREE.MeshBasicMaterial({ color: "#CFE3F5", transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  const arcs = dress(new THREE.Mesh(arcG, arcM), { steam: true, solid: false, cull: false, order: 2 }); g.add(arcs); parts.calls += 2; parts.tris += 14 * 3 * 20 + 6 * arcN * 2;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();
  const fp = (a) => { for (let i = 0; i < 4; i++) if (!isFinite(a[i])) return 0; return 1; };
  // lantern flame: +-6 % at 7 Hz (two sines and a slow one, deterministic)
  const flick = (t, i) => 1 + 0.06 * (0.65 * Math.sin(TAU * 7 * t + i * 2.1) + 0.35 * Math.sin(TAU * 11.3 * t + i * 4.7));
  const lampGlassBase = new THREE.Color("#ffffff");
  return {
    grip: 0, parts,
    apply(ps) {
      const t = ps.t ?? S_.t ?? 0, w = weight(t), N = night(t, 0), wet = P(t, 30, 31);
      skyAt(t, pud.U.uSky.value);
      wetM.opacity = 0.18 * wet; strokeM.opacity = 0.7 * wet * (0.6 + 0.4 * N);
      // puddles: ripples run at sqrt(w), the outline wobbles with it; the rings of the splash-up beads
      pud.U.uPh.value = tab(TAB.wave, t) * 6.0; pud.U.uShrink.value = PUD_SHRINK(t); pud.U.uGain.value = 0.55 + 0.45 * N; pud.U.uWarm.value.set("#FFC873").multiplyScalar(flick(t, 9));
      { let n = 0; if (t >= T_RISE) for (const b of PB) { const s = beadState(b, t); if (s && s.free && s.ring >= 0 && s.ring < 1 && n < 32) pud.U.uRing.value[n++].set(s.x, s.z, s.ring, 0.9); } pud.U.uN.value = n; }
      // chevrons
      { const D = tab(TAB.riv, t); chevM.map.offset.y = -(D % 1); chevM.opacity = 0.8 * wet * rivK(t) * (1 - P(t, 50, 50.6)) * (0.35 + 0.65 * rivK(t)); chevM.visible = chevM.opacity > 0.01; }
      // lamps: flame, glow, light, glass
      const fl = flick(t, 1), warm = 0.6 + 0.4 * N;
      glows.forEach((q, i) => { const f = flick(t, i); q.sp.scale.setScalar(q.size * (0.96 + 0.1 * (f - 1) / 0.06 * 0.25) * (0.8 + 0.3 * N)); q.sp.material.opacity = Math.min(1, 0.5 * q.k * warm * f); });
      lights.forEach((l, i) => { l.intensity = 5 * flick(t, i) * (0.55 + 0.45 * N + 0.3); });
      glassM.color.setScalar(0.9 + 0.1 * fl);
      // the net: the swish (bottom opens .26 -> .40 -> .26 in .3 s, then sways +-14 deg, period 1.4 s)
      { const t0 = S_.swish ?? 33.5, tau = t - t0, open = tau >= 0 && tau < 0.3 ? 0.07 * Math.sin((Math.PI * tau) / 0.3) : 0, sway = tau >= 0.3 ? (14 * Math.PI / 180) * Math.exp(-(tau - 0.3) / 1.6) * Math.sin((TAU * (tau - 0.3)) / 1.4) : 0;
        const { geo, NR, NC } = F.net, p = geo.attributes.position.array;
        for (let j = 0; j < NR; j++) { const f = j / (NR - 1), r = lerp(0.19, 0.13 + open, Math.pow(f, 0.8)), y = -0.36 * f; for (let i = 0; i < NC; i++) { const a = (i / 12) * TAU; const k = (j * NC + i) * 3; p[k] = Math.cos(a) * r; p[k + 1] = y; p[k + 2] = Math.sin(a) * r; } }
        geo.attributes.position.needsUpdate = true; if (!geo.boundingSphere) geo.computeBoundingSphere();
        F.net.pivot.rotation.z = sway; F.net.pivot.rotation.x = sway * 0.5; }
      updateFlood(fld, t);
      // splashes
      { let n = 0, an = 0; const ap = arcG.attributes.position.array;
        SP.forEach(([t0, ex, eu], e) => {
          const tau = t - t0; if (tau < 0 || tau > 2.4) return; const wl = weight(t0), g_ = 9.81 * Math.max(wl, 0.03), y0 = Yst(eu) + 0.02;
          for (let j = 0; j < 14; j++) {
            const H = 0.5 + 0.4 * hh(40 + e, j, 0), v0 = Math.sqrt(2 * g_ * H), az = hh(40 + e, j, 1) * TAU, vh = 0.35 + 0.8 * hh(40 + e, j, 2), y = tau * v0 - 0.5 * g_ * tau * tau; if (y < 0) continue;
            const r = 0.007 + 0.011 * hh(40 + e, j, 3); tmpV.set(ex + Math.cos(az) * vh * tau, y0 + y, Zu(eu) + Math.sin(az) * vh * tau); tmpS.setScalar(r); tmpM.compose(tmpV, tmpQ.identity(), tmpS); drops.setMatrixAt(n++, tmpM);
          }
          for (let a = 0; a < 2; a++) { const H = 0.9 - 0.2 * a, v0 = Math.sqrt(2 * g_ * H), az = (a ? 2.3 : 0.7) + e, vh = 0.9, base = an * 2 * (arcN + 1) * 3; if (tau * v0 - 0.5 * g_ * tau * tau < 0) continue;
            const tEnd = Math.min(tau, (2 * v0) / g_), rx = Math.cos(az), rz = Math.sin(az);
            for (let i = 0; i <= arcN; i++) { const s = (i / arcN) * tEnd, y = s * v0 - 0.5 * g_ * s * s, hx = ex + rx * vh * s * 0.7, hz = Zu(eu) + rz * vh * s * 0.7, wdt = 0.012 * (1 - i / arcN * 0.6); for (let sd = 0; sd < 2; sd++) { const k = base + (i * 2 + sd) * 3; ap[k] = hx - rz * wdt * (sd ? 1 : -1); ap[k + 1] = y0 + y; ap[k + 2] = hz + rx * wdt * (sd ? 1 : -1); } }
            an++; }
        });
        drops.count = n; drops.instanceMatrix.needsUpdate = true; arcG.setDrawRange(0, an * arcN * 6); arcG.attributes.position.needsUpdate = true; arcs.visible = an > 0; if (an) arcG.computeBoundingSphere(); }
    },
  };
}

// ================================================================================================ srain: F1-F5
const BOX = { x0: L1[0] - 7, x1: L1[0] + 9, z0: L1[2] - 20, z1: L1[2] + 8, H: 11 };   // x -3.8..12.2, z -78..-50, 11 m over the street
const T_HOLD0 = 47.6, T_HOLD1 = 50.0;
const wrapX = (x) => BOX.x0 + (((x - BOX.x0) % 15.9) + 15.9) % 15.9;
const wrapH = (h) => ((h % BOX.H) + BOX.H) % BOX.H;
const streetY = (z) => Yst(-(z + 3));
const _ps = (() => { const a = Math.atan2(-0.57, 0.82); return a; })();

// P12's camera, for the drops that stand on its line (1.2-3.5 m from it)
const CAM12 = { pos: [2.0, -16.4, -53.0], look: [1.6, -18.6, -75.0] };
function camBasis(c) {
  const d = new THREE.Vector3(...c.look).sub(new THREE.Vector3(...c.pos)).normalize(), r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, d).normalize();
  return { d, r, u, p: new THREE.Vector3(...c.pos) };
}
const CB = camBasis(CAM12);
// the drops: [class, hold position (world) or null, diameter, extras]; positions are pinned so that they sit where F4 puts them from 47.6 to 50.0
function makeDrops(spud) {
  const L = [], H = (dx, dy, dz) => [L1[0] + dx, L1[1] + dy, L1[2] + dz];
  const push = (o) => L.push({ rank: 0.02 + 0.2 * hh(5, L.length, 0), ...o });
  // 24 HERO (30-52 mm): H1-H3, H1's twin (splits at 48.9), 2 that pass the lantern, 5 that leave his sweater, 13 on the P12 camera's line
  push({ cls: 0, hold: H(-0.42, 1.78, 0.30), d: 0.046, id: "H1" }); push({ cls: 0, hold: H(-0.95, 2.25, 0.55), d: 0.05, id: "H2" }); push({ cls: 0, hold: H(0.30, 1.20, 0.80), d: 0.042, id: "H3" });
  push({ cls: 0, hold: H(-0.42, 1.78, 0.30), d: 0.032, id: "H1b" });
  for (const [tc, dx, dz] of [[51.0, -0.1, 0.34], [52.0, 0.12, 0.3]]) { const x = L1[0] + dx, z = L1[2] + dz, hL = L1[1] + 3.05 - streetY(z); push({ cls: 0, hold: [x, streetY(z) + hL + (rainFallen(tc) - rainFallen(T_HOLD0)), z], d: 0.04, id: "LP", tc }); }
  for (let i = 0; i < 5; i++) push({ cls: 0, hold: [spud[0] + (hh(6, i, 0) - 0.5) * 0.4, spud[1] + (hh(6, i, 1) - 0.4) * 0.6, spud[2] + 0.1 + hh(6, i, 2) * 0.12], d: 0.034 + 0.008 * hh(6, i, 3), id: "SW", born: 50.1 + 0.24 * i });
  for (let i = 0; i < 13; i++) { const r = 1.2 + 2.3 * hh(7, i, 0), lat = (-0.24 + 0.27 * hh(7, i, 1)) * r, vert = (-0.2 + 0.55 * hh(7, i, 2)) * r, p = CB.p.clone().addScaledVector(CB.d, r).addScaledVector(CB.r, lat).addScaledVector(CB.u, vert);
    p.y = Math.max(p.y, streetY(p.z) + 0.25); push({ cls: 0, hold: [p.x, p.y, p.z], d: 0.03 + 0.022 * hh(7, i, 3), id: "CL" }); }
  for (let i = 0; i < 96; i++) L.push({ cls: 1, d: 0.016 + 0.01 * hh(8, i, 0), rank: hh(8, i, 1), hair: hh(8, i, 2) < 0.3 ? 1 : 0 });
  for (let i = 0; i < 168; i++) L.push({ cls: 2, d: 0.008 + 0.006 * hh(9, i, 0), rank: hh(9, i, 1), far: i });
  L.forEach((q, i) => {
    q.i = i; q.cell = Math.floor(hh(10, i, 0) * 8); q.phase = hh(10, i, 1) * TAU;
    if (q.hold) { q.x0 = q.hold[0] - windDrift(T_HOLD0); q.z = q.hold[2]; q.h0 = q.hold[1] - streetY(q.z) + rainFallen(T_HOLD0); }
    else { const corr = hh(11, i, 0) < 0.8; q.x0 = corr ? lerp(-3.6, 3.6, hh(11, i, 1)) : lerp(3.8, 12.2, hh(11, i, 1)); q.z = lerp(BOX.z0, BOX.z1, hh(11, i, 2)); q.h0 = hh(11, i, 3) * BOX.H; }
  });
  return L;
}
function atlasDrops() {
  return tex(cv(512, 256, (g) => {
    for (let c = 0; c < 8; c++) {
      const R = mulberry(SEED + 1100 + c), cx = (c % 4) * 128 + 64, cy = Math.floor(c / 4) * 128 + 64, r = 60, tint = [[0.8, 0.9, 1], [0.9, 0.95, 1], [1, 0.97, 0.9], [0.85, 0.95, 0.95]][c % 4];
      g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
      g.fillStyle = "rgba(191,214,238,0.35)"; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const gr = g.createLinearGradient(0, cy - r, 0, cy + r);   // the scene upside down: dark above, light below
      gr.addColorStop(0, `rgba(${30 * tint[0]},${45 * tint[1]},${85 * tint[2]},0.6)`); gr.addColorStop(0.55, "rgba(120,150,190,0.3)"); gr.addColorStop(1, `rgba(${240 * tint[0]},${236 * tint[1]},${225 * tint[2]},0.62)`);
      g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,214,150,${0.1 + R() * 0.12})`; g.fillRect(cx - r + R() * 2 * r, cy + 10 + R() * 40, 8 + R() * 18, 3); }
      g.restore();
      g.strokeStyle = "#2B3A5A"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r - 1.5, 0.1, 1.6); g.stroke();   // dark rim, lower right
      g.globalAlpha = 0.35; g.beginPath(); g.arc(cx, cy, r - 1, 1.6, 3.2); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = "rgba(255,255,255,0.95)"; const a = -2.35 + (R() - 0.5) * 0.4; g.save(); g.translate(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55); g.rotate(a + 1.57); g.beginPath(); g.ellipse(0, 0, r * 0.1, r * 0.26, 0, 0, TAU); g.fill(); g.restore();
      g.beginPath(); g.arc(cx + r * 0.3, cy + r * 0.38, r * 0.07, 0, TAU); g.fill();
    }
  }));
}
const DROP_VS = `
attribute vec3 iPos; attribute vec4 iA; attribute vec4 iB; uniform vec3 uMot; uniform float uSpeed, uRise, uAmp, uTime, uHair; uniform vec3 uLamp;
varying vec2 vQ; varying vec2 vT; varying vec4 vA; varying vec4 vB; varying vec2 vGl; varying float vL; varying float vWm; varying float vHairL;
void main(){
  float d = iA.x; float v = uSpeed;
  float tear = d * (1.0 + 1.6 * v / 3.0), streak = v * 0.046, bead = 0.35 * d;
  float Lt = mix(bead, tear, smoothstep(0.25, 0.55, v)); Lt = mix(Lt, streak, smoothstep(2.6, 3.4, v));
  float wm = mix(1.0, 0.55, smoothstep(2.6, 3.4, v));
  if (uRise > 0.5) Lt = min(Lt, max(iB.z, 0.0));
  float hairL = 0.25 * iB.x * step(0.001, uHair); float back = max(Lt, hairL) + 0.0001;
  float aw = uAmp * sin(6.2831853 * 2.2 * uTime + iB.w) * (1.0 - smoothstep(0.25, 0.55, v));
  vec3 f = normalize(uMot); vec3 vd = normalize(cameraPosition - iPos); vec3 ac = cross(f, vd); float al = length(ac); ac = al > 0.001 ? ac / al : vec3(1.0, 0.0, 0.0);
  float lf = mix(-back, d * 0.5, position.y); float hw = d * 0.5 * wm * (1.0 + aw); float lw = position.x * hw * 1.0;
  vec3 wp = iPos + f * lf + ac * lw;
  vec3 off = wp - iPos; vec2 q = (viewMatrix * vec4(off, 0.0)).xy / d; vQ = q; vT = vec2(lf / d, position.x * (1.0 + aw) * 0.5 * wm); vL = Lt / d; vWm = wm; vHairL = hairL / d;
  vA = iA; vB = iB;
  vec3 lv = (viewMatrix * vec4(uLamp, 1.0)).xyz, pv = (viewMatrix * vec4(iPos, 1.0)).xyz; vGl = normalize(lv.xy - pv.xy + vec2(1e-4));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); }`;
const DROP_FS = `
precision highp float; uniform sampler2D uAtlas; uniform float uSpeed, uRise, uHair; varying vec2 vQ; varying vec2 vT; varying vec4 vA; varying vec4 vB; varying vec2 vGl; varying float vL; varying float vWm; varying float vHairL;
void main(){
  float alpha = vA.z; if (alpha < 0.004) discard;
  float strk = smoothstep(2.6, 3.4, uSpeed);
  vec2 e = vec2(vT.x, vT.y / max(vWm, 0.3)); float inHead = step(length(vec2(vT.x, vT.y)) , 0.5 * vWm + 0.0) ; inHead = 1.0 - smoothstep(0.46, 0.5, length(vec2(e.x, e.y)));
  float tw = 0.5 * vWm * clamp(1.0 + vT.x / max(vL, 0.001), 0.0, 1.0); float inTail = step(vT.x, 0.0) * step(-vL, vT.x) * (1.0 - smoothstep(tw * 0.8, tw, abs(vT.y)));
  float ta = clamp(1.0 + vT.x / max(vL, 0.001), 0.0, 1.0);
  vec3 col = vec3(0.0); float a = 0.0;
  // head: the atlas drop (screen-aligned so the highlight stays upper left)
  float cx = mod(vA.y, 4.0), cy = floor(vA.y / 4.0); vec2 uvc = vec2((cx + 0.5 + vQ.x * 0.94) / 4.0, 1.0 - (cy + 0.5 - vQ.y * 0.94) / 2.0);
  vec4 hd = texture2D(uAtlas, uvc); float hm = inHead * step(abs(vQ.x), 0.55) * step(abs(vQ.y), 0.55);
  vec3 hc = hd.rgb; float ha = max(hd.a, 0.0); hc *= 1.0 + 0.45 * uRise; hc = mix(hc, hc * 0.7 + 0.3, strk);
  float warm = vA.w * smoothstep(0.34, 0.0, length(vQ - vGl * 0.3)); hc = mix(hc, vec3(1.0, 0.78, 0.45), clamp(warm, 0.0, 1.0) * 0.9);
  float flash = vB.y; hc = mix(hc, vec3(1.0, 0.82, 0.5), flash); ha = max(ha, flash * 0.9);
  a = ha * hm; col = hc;
  // tail: glass, fading from the head
  float tailA = inTail * (1.0 - inHead) * mix(0.36 * pow(ta, 0.9), 0.55, strk); vec3 tc = mix(vec3(0.75, 0.84, 0.94), vec3(0.95, 0.98, 1.0), uRise * 0.5 * ta);
  tc = mix(tc, vec3(1.0, 0.82, 0.5), flash);
  col = (col * a + tc * tailA) / max(a + tailA, 0.001); a = a + tailA * (1.0 - a);
  if (uHair > 0.0 && vB.x > 0.5) { float hl = step(-vHairL, vT.x) * step(vT.x, 0.0) * (1.0 - smoothstep(0.0, 0.025, abs(vT.y) - 0.012)); float ha2 = 0.25 * uHair * hl * (1.0 - inHead); col = mix(col, vec3(0.8, 0.88, 1.0), ha2 / max(a + ha2, 0.001)); a = a + ha2 * (1.0 - a); }
  a *= alpha; if (a < 0.01) discard; gl_FragColor = vec4(col, a); }`;
const GLASS = lin("#C9DDF1");
const NECK = new THREE.CylinderGeometry(1, 1, 1, 4, 1, true); NECK.translate(0, 0.5, 0);
const BEAD = new THREE.IcosahedronGeometry(1, 0);

function buildRain(P_) {
  const S_ = P_.spec, g = P_.whole, spud = S_.spud || [L1[0] - 0.3, L1[1] + 1.2, L1[2] + 0.05];
  const D = makeDrops(spud), N = D.length;
  // ---- the drops: one instanced mesh of velocity-aligned quads
  const base = new THREE.PlaneGeometry(2, 1, 1, 1); base.translate(0, 0.5, 0);
  const ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute("position", base.attributes.position); ig.setAttribute("uv", base.attributes.uv);
  const NT = N + 160, aP = new THREE.InstancedBufferAttribute(new Float32Array(NT * 3), 3).setUsage(THREE.DynamicDrawUsage), aA = new THREE.InstancedBufferAttribute(new Float32Array(NT * 4), 4).setUsage(THREE.DynamicDrawUsage), aB = new THREE.InstancedBufferAttribute(new Float32Array(NT * 4), 4).setUsage(THREE.DynamicDrawUsage);
  ig.setAttribute("iPos", aP); ig.setAttribute("iA", aA); ig.setAttribute("iB", aB); ig.instanceCount = N;
  const U = { uMot: { value: new THREE.Vector3(0, -1, 0) }, uSpeed: { value: 0 }, uRise: { value: 0 }, uAmp: { value: 0.06 }, uTime: { value: 0 }, uHair: { value: 0 }, uLamp: { value: new THREE.Vector3(L1[0], L1[1] + 3.05, L1[2]) }, uAtlas: { value: atlasDrops() } };
  const dm = flat(new THREE.ShaderMaterial({ uniforms: U, vertexShader: DROP_VS, fragmentShader: DROP_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  const dmesh = dress(new THREE.Mesh(ig, dm), { steam: true, solid: false, order: 6, cull: false }); dmesh.name = "raindrops"; g.add(dmesh);
  // ---- opaque bits: beads and necks (crowns, drips, splash-up), loose things
  const beadM = std({ color: "#9CC3E6", roughness: 0.25 }); ink(beadM, 0.3, "#2B3A5A"); const neckM = std({ color: "#BFD6EE", roughness: 0.3, side: THREE.DoubleSide }); neckM.userData.noOutline = true; neckM.userData.outlineParameters = { visible: false };
  const NB = 160;
  const beads = new THREE.InstancedMesh(BEAD, beadM, NB), necks = new THREE.InstancedMesh(NECK, neckM, NB);
  for (const m of [beads, necks]) { dress(m, { steam: true, solid: false, cull: false }); m.count = 0; g.add(m); }
  // crowns: 5 on the puddles by the post, 9 beads each (8 round a centre one), .06-.12 m up on thin necks
  const crowns = [[0.95, 56.05], [1.4, 55.8], [1.85, 56.15], [1.9, 49], [-0.8, 63]].map(([x, u], i) => ({ i, x, u, t0: 46.9 + 0.08 * i, tr: 50.1 + 0.27 * i }));
  // drips: 7 stalled on long necks under the balcony and the eave over the post (the cream house, u 55-62)
  const cream = HOUSES.find((h) => h.side === 1 && h.hero && h.u0 <= 58 && 58 < h.u1), drips = [];
  { const ab = cream.balc[0];
    for (let i = 0; i < 3; i++) { const a = ab - 0.6 + i * 0.6; drips.push({ x: 3.8 - 0.57, y: cream.yF + 3.29, z: Zu(cream.uOf(a)), L: 0.22 + 0.2 * hh(12, i, 0), r: 0.016 }); }
    for (let i = 0; i < 4; i++) { const a = 0.35 + (1 + i * 2.2) * (cream.W - 0.7) / 10; drips.push({ x: 3.8 - 0.7, y: cream.yE - 0.22, z: Zu(cream.uOf(a)), L: 0.28 + 0.2 * hh(12, i + 3, 0), r: 0.017 }); } }
  drips.forEach((q, i) => { q.t0 = 46.6 + 0.12 * i; q.tr = 50.25 + 0.3 * i; });
  const up = (t) => 0.55 + 0.8 * Math.max(0, -rainV(t));
  // loose things (F5.5): 14 leaves, 30 petals, 9 pebbles, 2 roof tiles
  const leafG = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.quadraticCurveTo(-0.15, 0.32, 0.5, 0); s.quadraticCurveTo(-0.15, -0.32, -0.5, 0); return new THREE.ShapeGeometry(s, 3); })();
  const cardM = std({ vertexColors: false, color: "#ffffff", roughness: 0.9, side: THREE.DoubleSide }); cardM.userData.lineK = 0.3; cardM.userData.lineColor = "#2A2226";
  const cards = new THREE.InstancedMesh(leafG, cardM, 44), pebM = std({ color: "#8A8690", roughness: 0.95 }); ink(pebM, 0.4);
  const pebs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), pebM, 9), tileM = std({ color: "#9A4630", roughness: 0.9 }); ink(tileM, 0.4); const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.045, 0.17), tileM, 2);
  for (const m of [cards, pebs, tiles]) { dress(m, { steam: true, solid: false, cull: false }); g.add(m); }
  const cream_ = cream, LEAF = ["#6E9A4A", "#4E7F3F", "#A9A24A", "#8A6A3A", "#5E8A3F"], PET = ["#C2267A", "#E0469A", "#8E1A5A"];
  const loose = [];
  for (let i = 0; i < 14; i++) loose.push({ k: "leaf", s: 0.16 + 0.07 * hh(20, i, 0), hold: [lerp(-1.6, 3.2, hh(20, i, 1)), lerp(0.6, 3.6, hh(20, i, 2)), lerp(-61, -54, hh(20, i, 3))], t0: 43.0, cw: 0.9 + 0.1 * hh(20, i, 4), cf: 0.12, up: 0.6 + 1.2 * hh(20, i, 5), rate: (20 + 70 * hh(20, i, 6)) * Math.PI / 180, col: LEAF[i % 5], ax: hh(20, i, 7) * TAU });
  for (let i = 0; i < 30; i++) { const tt = 45.6 + 1.1 * hh(21, i, 0); loose.push({ k: "petal", s: 0.055 + 0.03 * hh(21, i, 1), start: [3.3 + (hh(21, i, 2) - 0.5) * 0.5, cream_.yE - 0.8 - 2.1 * hh(21, i, 3), Zu(cream_.uOf(0.5 + (cream_.W - 1) * hh(21, i, 4)))], t0: tt, cw: 0.95, cf: 0.15, up: 0.6 + 1.2 * hh(21, i, 5), rate: (20 + 70 * hh(21, i, 6)) * Math.PI / 180, col: PET[i % 3], ax: hh(21, i, 7) * TAU }); }
  const lie = []; for (let i = 0; i < 9; i++) lie.push({ r: 0.01 + 0.02 * hh(22, i, 0), x: lerp(-2.2, 2.4, hh(22, i, 1)), z: lerp(-62, -55, hh(22, i, 2)), t0: 50.2 + 0.28 * i, up: 0.6 + 1.2 * hh(22, i, 3), rate: (20 + 70 * hh(22, i, 4)) * Math.PI / 180 });
  const lieT = [[-1.2, -57.2, 0.4], [1.0, -60.1, 1.9]].map(([x, z, ry], i) => ({ x, z, ry, t0: 50.3 + 0.6 * i, up: 0.7 + 0.4 * i, rate: (35 + 30 * i) * Math.PI / 180 }));
  loose.forEach((q, i) => { if (q.hold) { q.start = [q.hold[0] - q.cw * (windDrift(T_HOLD0) - windDrift(q.t0)), streetY(q.hold[2]) + q.hold[1], q.hold[2]]; q.start[1] = q.hold[1] + streetY(q.hold[2]) + q.cf * (rainFallen(T_HOLD0) - rainFallen(q.t0)); } if (q.k === "leaf") { const c = new THREE.Color(q.col); cards.setColorAt(i, c); } else cards.setColorAt(i, new THREE.Color(q.col)); });
  cards.instanceColor.needsUpdate = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), E = new THREE.Euler();
  const rise = (t, up_) => { const T = Math.max(0, t - T_HOLD1); return up_ * (T < 0.5 ? T * T : T - 0.25); };
  const vis = (x, hAbove) => { const inside = 1 - sm(3.6, 3.9, x), above = sm(6.6, 7.2, hAbove); return Math.max(inside, above); };
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S_.t ?? 0, share = rainShare(t), vr = rainV(t), wx = windX(t), spd = Math.hypot(vr, wx), fT = rainFallen(t), wT = windDrift(t), rising = vr < 0 ? 1 : 0;
      const dir = spd > 0.02 ? [wx, -vr, 0] : [0, rising ? 1 : -1, 0], dl = Math.hypot(dir[0], dir[1]) || 1;
      U.uMot.value.set(dir[0] / dl, dir[1] / dl, 0); U.uSpeed.value = spd; U.uRise.value = rising; U.uTime.value = t; U.uAmp.value = lerp(0.06, 0.02, P(t, T_HOLD0, 48.6));
      U.uHair.value = t >= T_HOLD0 && t < 48.6 ? 1 - P(t, T_HOLD0, 48.6) : 0; if (U.uHair.value > 0) U.uHair.value = Math.max(0.0001, U.uHair.value);
      const pa = aP.array, aa = aA.array, ba = aB.array, cut = 168 - 48 * P(t, 50, 50.5);
      for (let i = 0; i < N; i++) {
        const q = D[i]; let x = wrapX(q.x0 + wT), hh_ = wrapH(q.h0 - fT), z = q.z, dia = q.d, al = 1, flash = 0;
        // special drops
        if (q.id === "H1") { z += 0.04 * S(P(t, 48.4, 48.8)); x -= 0.02 * S(P(t, 48.9, 49.4)); dia *= t >= 48.9 ? 0.82 : 1; }
        if (q.id === "H1b") { z += 0.04 * S(P(t, 48.4, 48.8)); x += 0.05 * S(P(t, 48.9, 49.4)); al *= t >= 48.9 ? 1 : 0; dia *= 0.7; }
        if (q.id === "LP") { flash = Math.abs(t - q.tc) < 1 / 30 ? 1 : 0; }
        if (q.id === "SW") { al *= S(P(t, q.born, q.born + 0.3)); dia *= 0.3 + 0.7 * S(P(t, q.born, q.born + 0.35)); }
        const rankVis = q.id === "SW" ? 1 : S(clamp((share - q.rank * 0.94) / 0.06));
        al *= rankVis; if (q.cls === 2 && q.far >= cut) al = 0;
        if (q.cls === 2 && q.far >= 120) al *= 1 - P(t, 50, 50.5);
        const yAbs = streetY(z) + hh_;
        al *= 1 - sm(10.2, 11, hh_); if (!rising) al *= sm(0, 0.35, hh_); al *= vis(x, hh_);
        if (q.hold && q.hold[1] !== undefined) { /* pinned drops stay put through the hold by construction */ }
        pa[i * 3] = x; pa[i * 3 + 1] = yAbs; pa[i * 3 + 2] = z;
        const nearL = clamp(1 - Math.hypot(x - L1[0], yAbs - (L1[1] + 3.05), z - L1[2]) / 6);
        aa[i * 4] = dia; aa[i * 4 + 1] = q.cell; aa[i * 4 + 2] = al; aa[i * 4 + 3] = Math.max(nearL, flash);
        ba[i * 4] = q.hair ? 1 : 0; ba[i * 4 + 1] = flash; ba[i * 4 + 2] = hh_; ba[i * 4 + 3] = q.phase;
      }
      // beads and necks; a bead that has let go is a sprite (the same pipeline as the drops: its tail trails below it as it rises)
      let nb = 0, ne = 0;
      const spr = (x, y, z, dia, gap, k) => { if (ne >= 160) return; const o = N + ne++; pa[o * 3] = x; pa[o * 3 + 1] = y; pa[o * 3 + 2] = z; aa[o * 4] = dia; aa[o * 4 + 1] = Math.floor(hh(14, k, 0) * 8); aa[o * 4 + 2] = 1; aa[o * 4 + 3] = clamp(1 - Math.hypot(x - L1[0], y - (L1[1] + 3.05), z - L1[2]) / 6); ba[o * 4] = 0; ba[o * 4 + 1] = 0; ba[o * 4 + 2] = gap; ba[o * 4 + 3] = 0; };
      const setBead = (x, y, z, sx, sy, sz) => { V.set(x, y, z); Sc.set(sx, sy, sz); M.compose(V, Q.identity(), Sc); beads.setMatrixAt(nb, M); };
      const bi = () => nb;
      let nn = 0; const setNeck = (x, y0, z, y1, r) => { const l = y1 - y0; if (l <= 0.002) return; V.set(x, y0, z); Sc.set(r, l, r); M.compose(V, Q.identity(), Sc); necks.setMatrixAt(nn++, M); };
      // crowns
      for (const c of crowns) {
        const grow = S(P(t, c.t0, c.t0 + 0.8)); if (grow < 0.01 || t < c.t0) continue;
        const y0 = Yst(c.u) + 0.012, z0 = Zu(c.u), rel = t >= c.tr ? up(t) * (t - c.tr) : 0, up_ = rel;
        for (let k = 0; k < 9; k++) {
          const a = (k / 8) * TAU, rr = k === 8 ? 0 : 0.045 + 0.02 * hh(13, c.i * 9 + k, 0), hgt = (k === 8 ? 0.12 : 0.06 + 0.04 * hh(13, c.i * 9 + k, 1)) * grow, d = 0.012 + 0.006 * hh(13, c.i * 9 + k, 2);
          const rk = rel * (0.8 + 0.4 * hh(13, c.i * 9 + k, 3)); if (rk > 8) continue;
          const x = c.x + Math.cos(a) * rr, z = z0 + Math.sin(a) * rr;
          if (t < c.tr) { setBead(x, y0 + hgt, z, d, d * 1.15, d); nb++; setNeck(x, y0, z, y0 + hgt, 0.0022); }
          else { const tau = t - c.tr, neckL = Math.max(0, hgt - 0.6 * tau * 3); spr(x, y0 + hgt + rk, z, d * 2.1, hgt + rk, c.i * 9 + k); setNeck(x, y0, z, y0 + Math.min(hgt + rk, neckL * 0.9 + 0.0), 0.0022 * (1 - sm(0, 0.3, tau))); }
        }
      }
      // drips
      for (const q of drips) {
        const grow = S(P(t, q.t0, q.t0 + 0.9)); if (t < q.t0) continue;
        const L = q.L * grow, r = q.r;
        if (t < q.tr) { setBead(q.x, q.y - L, q.z, r, r * 1.3, r); nb++; setNeck(q.x, q.y - L, q.z, q.y, 0.0028); }
        else { const tau = t - q.tr, y = q.y - L + up(t) * tau * 1.2; if (y > q.y + 9) continue; spr(q.x, y, q.z, r * 2.3, 9, 400 + Math.round(q.z * 10)); if (tau < 0.2) setNeck(q.x, Math.min(y, q.y), q.z, q.y, 0.0028 * (1 - tau / 0.2)); }
      }
      // splash-up: domes on the puddles that neck and pinch off beads of 14-26 mm
      if (t >= T_RISE) for (const b of PB) {
        const s = beadState(b, t); if (!s || s.hide) continue;
        if (!s.free) { const hd = 0.05 * S(s.dome), wd = 0.03 * S(s.dome); setBead(s.x, s.y0 + hd * 0.4, s.z, wd, Math.max(hd, 0.002), wd); nb++; if (s.neck > 0) { setBead(s.x, s.y0 + hd + 0.03 * s.neck, s.z, s.d * 0.7, s.d * 0.9, s.d * 0.7); nb++; setNeck(s.x, s.y0, s.z, s.y0 + hd + 0.03 * s.neck, 0.0035); } }
        else { spr(s.x, s.y, s.z, s.d * 1.2, s.y - s.y0, b.id); if (s.neck > 0) setNeck(s.x, s.y0, s.z, s.y0 + 0.05 + 0.1 * s.neck, 0.003 * s.neck); }
      }
      beads.count = nb; necks.count = nn; beads.instanceMatrix.needsUpdate = necks.instanceMatrix.needsUpdate = true;
      ig.instanceCount = N + ne; aP.needsUpdate = aA.needsUpdate = aB.needsUpdate = true;
      // loose things
      { let nc = 0;
        for (let i = 0; i < loose.length; i++) {
          const q = loose[i]; let sc = 0, x = 0, y = 0, z = 0, ang = 0;
          if (t >= q.t0) {
            x = q.start[0] + q.cw * (wT - windDrift(q.t0)); z = q.start[2]; const fl = 0.04 * Math.sin(TAU * 1.3 * t + q.ax);
            y = q.start[1] - q.cf * ((t < T_HOLD0 ? fT : rainFallen(T_HOLD0)) - rainFallen(q.t0)) + rise(t, q.up) + fl * (t < T_HOLD1 ? 1 : 0.4); 
            const hAbove = y - streetY(z); ang = q.rate * (Math.abs(wT) / 8 + Math.max(0, t - T_HOLD1) * 1.0) + q.ax;
            sc = q.s * vis(x, hAbove) * (t < q.t0 + 0.3 ? S(P(t, q.t0, q.t0 + 0.3)) : 1); if (y - streetY(z) > 14) sc = 0;
          }
          V.set(x, y, z); E.set(ang * 0.6, q.ax, ang, "YXZ"); Q.setFromEuler(E); Sc.set(sc, sc * 0.9, sc); M.compose(V, Q, Sc); cards.setMatrixAt(i, M); nc++;
        }
        cards.count = nc; cards.instanceMatrix.needsUpdate = true;
        lie.forEach((q, i) => { const T = Math.max(0, t - q.t0), up_ = T < 0.5 ? T * T : T - 0.25, y = streetY(q.z) + q.r + (t >= q.t0 ? up_ * q.up : 0), vz = t >= q.t0 ? 1 : 0; V.set(q.x, y, q.z); E.set(q.rate * T, i, q.rate * 0.7 * T, "YXZ"); Q.setFromEuler(E); Sc.setScalar(q.r * (y - streetY(q.z) > 14 ? 0 : 1)); M.compose(V, Q, Sc); pebs.setMatrixAt(i, M); });
        lieT.forEach((q, i) => { const T = Math.max(0, t - q.t0), up_ = T < 0.5 ? T * T : T - 0.25, y = streetY(q.z) + 0.03 + (t >= q.t0 ? up_ * q.up : 0); V.set(q.x, y, q.z); E.set(q.rate * T, q.ry, q.rate * 0.6 * T, "YXZ"); Q.setFromEuler(E); Sc.setScalar(y - streetY(q.z) > 14 ? 0 : 1); M.compose(V, Q, Sc); tiles.setMatrixAt(i, M); });
        pebs.instanceMatrix.needsUpdate = tiles.instanceMatrix.needsUpdate = true; }
      dmesh.visible = share > 0.001 || t >= 44; cards.visible = t >= 42.9;
    },
  };
}

// ================================================================================================ sball: the basketball (E5)
function paintBall() {
  const R = mulberry(SEED + 1200);
  return cv(512, 256, (g, W, H) => {
    g.fillStyle = "#D9692A"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "120,50,15" : "255,170,100"},${0.08 + R() * 0.12})`; g.beginPath(); g.arc(R() * W, R() * H, 0.9 + R() * 1.1, 0, TAU); g.fill(); }
    g.strokeStyle = "#1c1618"; g.lineCap = "round"; g.lineWidth = 7;
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();                                    // equator
    for (const x of [0, W / 2, W]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }           // two meridians (the seam of the sheet is one)
    for (const x0 of [W * 0.25, W * 0.75]) { g.beginPath(); for (let v = 0; v <= 1.001; v += 0.04) { const x = x0 + Math.sin(v * Math.PI * 2) * W * 0.09 * (x0 < W / 2 ? 1 : -1); v ? g.lineTo(x, v * H) : g.moveTo(x, 0); } g.stroke(); }   // two curved channels
  });
}
function buildBall(P_) {
  const S_ = P_.spec, g = P_.whole, r = 0.12;
  const m = std({ map: tex(paintBall()), roughness: 0.85 }); ink(m, 0.7, "#2A2226");
  const o = dress(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m), { shadow: true }); o.name = "sball"; g.add(o);
  return {
    grip: 0, apply(ps, tl) {
      const t = ps.t ?? S_.t ?? tl ?? 0, f0 = S_.float;
      if (f0 == null || t < f0) return;
      // from `float` the ball rides the flood front (E5), and rises with the rain from 50 s
      const yw = seaY(t) - 6 * lift(t), uF = clamp((-9 - yw) / SLOPE, 20, 130), u = uF - 1.0 + 0.4 * Math.sin(TAU * t / 2.4), x = (S_.fx ?? 0.9) + 0.25 * Math.sin(TAU * t / 3.1 + 1);
      const bob = 0.06 * Math.sin(TAU * t / 1.7), up = Math.max(0, t - 50), rs = (S_.up ?? 1.1) * (up < 0.5 ? up * up : up - 0.25);
      P_.root.position.set(x + windDrift(t) * 0.0, Math.max(yw, Yst(u)) + r * 0.7 + bob + rs, Zu(u));
      P_.root.rotation.set(0.6 * (t - f0) * 0.5, 0.4 * (t - f0), 0.3 * Math.sin(t) + 0.5 * up, "YXZ");
    },
  };
}

// ================================================================================================ sblobs: F6, the sea lifting off
const BD = [3.2, 4, 5, 6, 8, 10, 12, 14, 18, 22, 26];
const BLOBS = []; {
  for (let i = 0; i < 22; i++) { const tb = 50.2 + 0.38 * i, x = i === 0 ? -6 : (hh(30, i, 0) - 0.5) * 520, z = i === 0 ? -88 : -(82 + hh(30, i, 1) * 618); BLOBS.push({ i, tb, R: BD[i % 11] / 2, x, z, close: false }); }
  [[1.2, -3.5, -85, 50.6], [1.7, 2.8, -86, 51.4], [2.2, -1.0, -85.5, 52.3]].forEach(([d, x, z, tb], k) => BLOBS.push({ i: 22 + k, tb, R: d / 2, x, z, close: true }));
  for (const b of BLOBS) { b.lobes = Array.from({ length: 3 + (b.i % 3) }, (_, k) => { const a = hh(31, b.i, k) * TAU, e = -0.75 - 0.2 * hh(31, b.i, k + 9); return new THREE.Vector3(Math.cos(a) * Math.sqrt(1 - e * e), e, Math.sin(a) * Math.sqrt(1 - e * e)); }); b.ph = [hh(32, b.i, 0) * TAU, hh(32, b.i, 1) * TAU, hh(32, b.i, 2) * TAU]; b.lod = b.z < -350 ? 1 : 3; }
}
// the free flight: acceleration .9 + .35 (s - 17) m/s^2 = .9 + .105 (t - 50), capped at 14 m/s: height gained tau seconds after release (closed form)
function blobRise(t0f, t) {
  const tau = t - t0f; if (tau <= 0) return 0; const a0 = 0.9 + 0.105 * (t0f - 50), k = 0.0525, tc = (-a0 + Math.sqrt(a0 * a0 + 4 * k * 14)) / (2 * k);
  return tau < tc ? (a0 * tau * tau) / 2 + (k * tau * tau * tau) / 3 : (a0 * tc * tc) / 2 + (k * tc ** 3) / 3 + 14 * (tau - tc);
}
const icoIdx = (d) => { const g0 = new THREE.IcosahedronGeometry(1, d); g0.deleteAttribute("normal"); g0.deleteAttribute("uv"); return mergeVertices(g0, 1e-4); };
const BLOB_VS = `attribute vec3 aDir; varying vec3 vN; varying vec3 vNw; varying vec3 vV; varying vec3 vD;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vNw = normalize(mat3(modelMatrix) * normal); vV = -mv.xyz; vD = aDir; gl_Position = projectionMatrix * mv; }`;
const BLOB_FS = `precision highp float; uniform vec3 uBody, uRim, uVein, uSun, uSunCol; varying vec3 vN; varying vec3 vNw; varying vec3 vV; varying vec3 vD;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(vV); float fr = 1.0 - abs(dot(n, v)); fr = pow(fr, 1.6);
  vec3 col = mix(uBody, uRim, fr); float a = mix(0.42, 0.75, fr);
  float vein = abs(sin(6.0 * (vD.x + 0.6 * vD.y) + 2.5 * sin(4.0 * vD.z + 3.0 * vD.x))); vein = 1.0 - smoothstep(0.0, 0.12, vein); col = mix(col, uVein, vein * 0.35 * (1.0 - fr)); a = mix(a, a + 0.18, vein * 0.35);
  float hl = smoothstep(0.1, 0.0, length(n.xy - vec2(-0.45, 0.5))) + 0.8 * smoothstep(0.07, 0.0, length(n.xy - vec2(-0.15, 0.78))) + 0.7 * smoothstep(0.07, 0.0, length(n.xy - vec2(-0.72, 0.18)));
  col = mix(col, vec3(1.0), clamp(hl, 0.0, 1.0)); a = max(a, clamp(hl, 0.0, 1.0) * 0.95);
  float sun = clamp(dot(normalize(vNw), normalize(uSun)) * 0.8 + 0.2, 0.0, 1.0); col = mix(col, uSunCol, 0.3 * sun * (0.4 + 0.6 * fr)); a += 0.08 * sun;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.95)); }`;
const TEAR_VS = `attribute vec3 iPos; attribute vec2 iA; varying vec2 vUv; varying float vAl;
void main(){ float s = iA.x; vec4 mv = viewMatrix * vec4(iPos, 1.0); vec2 off = vec2(position.x * s * 0.5, position.y * s * 2.4 - s * 0.45); mv.xy += off; vUv = vec2(position.x * 0.5 + 0.5, position.y); vAl = iA.y; gl_Position = projectionMatrix * mv; }`;
const TEAR_FS = `precision highp float; uniform vec3 uBody, uRim; varying vec2 vUv; varying float vAl;
void main(){ float y = vUv.y; float hw = y < 0.2 ? 0.0 : 0.5 * smoothstep(0.0, 0.25, y) * (y > 0.8 ? sqrt(max(0.0, 1.0 - pow((y - 0.8) / 0.2, 2.0))) : (0.25 + 0.75 * smoothstep(0.1, 0.8, y)));
  float x = abs(vUv.x - 0.5); if (x > hw || vAl < 0.01) discard; float e = smoothstep(hw * 0.6, hw, x); vec3 col = mix(uBody, uRim, e); col += vec3(1.0) * smoothstep(0.05, 0.0, length(vUv - vec2(0.38, 0.84))); gl_FragColor = vec4(col, vAl * mix(0.5, 0.8, e)); }`;
function buildBlobs(P_) {
  const S_ = P_.spec, g = P_.whole, HI = icoIdx(3), LO = icoIdx(1), NBL = BLOBS.length;
  const sizes = BLOBS.map((b) => (b.lod === 3 ? HI : LO).attributes.position.count), off = []; let tot = 0; for (const n of sizes) { off.push(tot); tot += n; }
  const pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3), dirA = new Float32Array(tot * 3), idx = []; let tris = 0;
  BLOBS.forEach((b, j) => { const src = b.lod === 3 ? HI : LO, ix = src.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off[j]); b.src = src; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute("aDir", new THREE.BufferAttribute(dirA, 3).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(idx);
  const U = { uBody: { value: new THREE.Color("#3F9FB4") }, uRim: { value: new THREE.Color("#1F5F7A") }, uVein: { value: new THREE.Color("#9FE0E0") }, uSun: { value: new THREE.Vector3(0, 0.3, -1) }, uSunCol: { value: new THREE.Color("#FFB98A") } };
  const bm = flat(new THREE.ShaderMaterial({ uniforms: U, vertexShader: BLOB_VS, fragmentShader: BLOB_FS, transparent: true, depthWrite: false })); bm.userData.noOutline = true;
  const mesh = dress(new THREE.Mesh(geo, bm), { steam: true, solid: false, order: 5, cull: false }); mesh.name = "blobs"; g.add(mesh);
  // 3 trailing teardrops a blob (75 sprites)
  const NT = NBL * 3, tb = new THREE.PlaneGeometry(2, 1, 1, 1); tb.translate(0, 0.5, 0);
  const ig = new THREE.InstancedBufferGeometry(); ig.index = tb.index; ig.setAttribute("position", tb.attributes.position); ig.instanceCount = NT;
  const tP = new THREE.InstancedBufferAttribute(new Float32Array(NT * 3), 3).setUsage(THREE.DynamicDrawUsage), tA = new THREE.InstancedBufferAttribute(new Float32Array(NT * 2), 2).setUsage(THREE.DynamicDrawUsage); ig.setAttribute("iPos", tP); ig.setAttribute("iA", tA);
  const tm = flat(new THREE.ShaderMaterial({ uniforms: { uBody: { value: new THREE.Color("#5FB8C8") }, uRim: { value: new THREE.Color("#1F5F7A") } }, vertexShader: TEAR_VS, fragmentShader: TEAR_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  const tmesh = dress(new THREE.Mesh(ig, tm), { steam: true, solid: false, order: 5, cull: false }); tmesh.name = "teardrops"; g.add(tmesh);
  const q = new THREE.Vector3(), rn = new THREE.Vector3();
  const surfaceY = (t) => seaY(t) - 6 * lift(t);
  return {
    grip: 0, parts: { tris: BLOBS.reduce((s, b) => s + (b.lod === 3 ? 320 : 80), 0), calls: 2 },
    apply(ps) {
      const t = ps.t ?? S_.t ?? 0; sunDir(t, U.uSun.value);
      let anyLive = false;
      BLOBS.forEach((b, j) => {
        const n = sizes[j], o3 = off[j] * 3, tau = t - b.tb, src = b.src.attributes.position.array;
        if (tau < 0 || t < 50.2) { for (let i = 0; i < n; i++) { pos[o3 + i * 3] = 0; pos[o3 + i * 3 + 1] = -1e4; pos[o3 + i * 3 + 2] = 0; } for (let k = 0; k < 3; k++) { tP.array[(j * 3 + k) * 3 + 1] = -1e4; tA.array[(j * 3 + k) * 2 + 1] = 0; } return; }
        anyLive = true;
        const R = b.R, y0 = surfaceY(b.tb), t0f = b.tb + 1.5, rise = blobRise(t0f, t), sdome = S(tau / 0.8), sc = S((tau - 0.8) / 0.7), stalk = tau < 1.5 ? sc : 1 - S((tau - 1.5) / 0.25), free = S((tau - 1.5) / 0.4);
        const k = R * (0.35 + 0.65 * sdome), yc = tau < 0.8 ? y0 + k * 0.25 : lerp(y0 + R * 0.25, y0 + R * 1.7, sc) + (tau >= 1.5 ? rise : 0), spin = (12 * Math.PI / 180) * tau, cs = Math.cos(spin), sn = Math.sin(spin), br = 0.7 * TAU;
        for (let i = 0; i < n; i++) {
          const dx = src[i * 3], dy = src[i * 3 + 1], dz = src[i * 3 + 2], rx = dx * cs - dz * sn, rz = dx * sn + dz * cs;   // the pattern turns, the body is round
          let lob = 0; for (const L of b.lobes) { const c = Math.max(0, (rx * L.x + dy * L.y + rz * L.z - 0.72) / 0.28); lob += c * c; }
          const m1 = (3 * dy * dy - 1) / 2, m2 = 2 * rx * rz, m3 = rx * rx - rz * rz, br_ = 1 + free * 0.12 * (0.45 * Math.sin(br * t + b.ph[0]) * m1 + 0.4 * Math.sin(br * t * 1.3 + b.ph[1]) * m2 + 0.35 * Math.sin(br * t * 1.7 + b.ph[2]) * m3);
          let radial = k * br_, y = dy * k * br_;
          if (dy > 0.55) y *= 0.82;                                                                 // the cap is flattened
          if (dy < 0) { const L = lerp(R, Math.max(R, yc - y0), stalk); y = dy * lerp(k * br_, L, stalk); radial *= 1 - stalk * 0.88 * Math.pow(-dy, 1.2); y -= R * 0.3 * lob * free; }
          let px = dx * (radial), pz = dz * (radial); const hy = yc + y; const py = tau < 0.8 ? Math.max(hy, y0) : hy;
          pos[o3 + i * 3] = b.x + px; pos[o3 + i * 3 + 1] = py; pos[o3 + i * 3 + 2] = b.z + pz;
          dirA[o3 + i * 3] = rx; dirA[o3 + i * 3 + 1] = dy; dirA[o3 + i * 3 + 2] = rz;
        }
        // trailing teardrops from the snap
        for (let kx = 0; kx < 3; kx++) {
          const e = (j * 3 + kx), life = tau - 1.5; if (life < 0 || life > 16) { tA.array[e * 2 + 1] = 0; tP.array[e * 3 + 1] = -1e4; continue; }
          const yy = y0 + R * (0.35 + 0.4 * kx) * 1.7 + 0.6 * rise - R * 0.3 * kx * life * 0.05; tP.array[e * 3] = b.x + (hh(33, b.i, kx) - 0.5) * R * 0.5; tP.array[e * 3 + 1] = yy; tP.array[e * 3 + 2] = b.z; tA.array[e * 2] = Math.max(0.15, R * (0.34 - 0.07 * kx)); tA.array[e * 2 + 1] = S(life / 0.25) * (1 - S((life - 12) / 4));
        }
      });
      mesh.visible = anyLive; tmesh.visible = anyLive;
      if (anyLive) { geo.attributes.position.needsUpdate = geo.attributes.aDir.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); }
      tP.needsUpdate = tA.needsUpdate = true;
    },
  };
}

export const SPINSTREET_KINDS = { sstreet: buildStreet, sball: buildBall, srain: buildRain, sblobs: buildBlobs };
