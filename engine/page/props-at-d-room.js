// props-at-d-room.js: Plato's room in Athens at night, with the window view (Ancient aliens EP03 Atlantis, block D, panels 39, 47, 48).
// Design: /mnt/project-files/videos/ancient-aliens/03-atlantis/DESIGNS.md sections 0 and 8; look target: plates/plate-39-plato-room-night.png.
// Real 3D at the painting's level: Plato and Spud stand IN the room, not in front of a picture. Every mesh is lookOnly scenery (no hand ray,
// no contact oval, no outline) and surfaceOnly. No Math.random, no wall clock: every mark comes from a hash of its index, every motion from t.
// Exports AT_D_ROOM_KINDS and AT_D_ROOM_GRIPS = {} (nothing here is held).
//
// AXES: +y up, +x screen right from the default camera, the cameras stand on +z looking -z, metres, Spud 0.88. Light: the storyboard's AT_NIGHT
// (kit/at-kit.mjs; far 9000, near 0.05, wide frame). The room is drawn with its own baked-and-live light (cool moon ambient + the lamp, a warm
// pool of r ~1.2 with soft moving shadows + the moonlight patch the window throws in); a real warm PointLight lights the characters.
//
// platoroom   ORIGIN = floor centre of the room, floor y 0 (the whole floor is standable). Room 4.0 (x -2..2) x 3.2 (z -1.6..1.6) x 2.6 high, open on
//             +z (no front wall; the floor runs on to z 3.2 and the side walls to z 3.4 so a camera at z 2.5-3.2 stands inside). Walls are 0.3 thick.
//             BACK WALL (z -1.6, outer face z -1.9): the window 1.2 x 1.1 (x -1.3..-0.1, sill top y 0.95, head y 2.05, centre x -0.7), deep reveal, two
//             plank shutters open into the room, an olive branch with olives across the upper left corner outside (stirs with t); right part:
//             two plank shelves on brackets (y 1.30 and 1.80, x 0.55..1.85) with 14 rolls and 2 pots. Black-figure jars (potato silhouettes): 0.7 high on the
//             floor right (1.62, -1.28), 0.5 on the floor left (-1.68, -1.30). Whitewash with cracks, worn patches, soot over the lamp, a flagstone floor.
//   DESK      oak 1.5 x 0.7 x 0.72, centre (0.45, -0.70): x -0.30..1.20, z -1.05..-0.35, DESK-TOP y 0.72. Front edge z -0.35, back edge z -1.05.
//   ON IT     open papyrus 0.9 x 0.5 with rolled ends, CENTRE (0.66, 0.725, -0.58) (it runs x 0.21..1.11); 3 spare rolls tied with cord (one at (-0.12, -0.60),
//             two at (1.04, -0.50) and (1.05, -0.63)); a reed pen at (0.20, -0.45); ink stains left front; the bronze LAMP at (0.02, 0.72, -0.80): stem 0.25,
//             bowl and spout top at y 0.97, the flame's root at (0.13, 1.00, -0.80); a moth round the flame.
//   WHERE PLATO SITS  klismos at (0.66, 0, -1.35) rot 0 (faces +z), c.A(t, id, "sit", { seat: "<klismos id>", hands: "keep" }). His belly then
//             reaches the desk's back edge (z -1.05); the writing hand (WRITE pose of make-at-plato.mjs, o [-0.2, 0.283, 0.68]) lands on the papyrus.
//   OUTSIDE   a lane at y 0.40 (standable) from z -1.75 to -3.0 (x -6..6) behind the window, wall stones to its left and right, a low wall at its far
//             edge (z -3.0, top 0.75) and a clay pot with a bush at (-1.32, -2.05). SPUD on the lane: cast y 0.40 at (-0.7, -2.25), face camera: head and
//             shoulders show over the sill (his head top at 1.28, the sill top at 0.95). Then Athens in three real 3D layers: near roofs 20-150 m (tile roofs,
//             plaster, 3 warm windows, cypresses, olive trees, 3 more warm windows far), the Acropolis rock with its walls, the Parthenon (69 x 31 m, 8 x 17
//             columns) and the small temple (Erechtheion-like) 420-700 m, far hills (Hymettus and Lycabettus) 3-8 km; full moon (right of the window, 13 deg up),
//             ~700 stars, a few clouds. Depth: beyond 300 m the surfaces are 1.5 m or more apart. The view holds when a camera moves 0.5 m.
//   spec      light 1 (0..1 the lamp at the start), flame 1 (flame flicker strength: 0 steady .. 2 wild), moth true, branch true (olive branch),
//             outside true (false: the room only, window dark blue), moon true, seed 1, occ [] (extra soft-shadow spheres [x, y, z, r] in the lamp's light,
//             e.g. Plato's head [0.66, 1.35, -1.3, 0.3]: the wall behind him then takes his soft moving shadow), key 1 (moon patch strength 0..2).
//   NOTE      the plain set's floor mask (r 60 at the world origin, hides y < 0) is hidden by this prop when it stands within 200 m of the origin (the town lies below y 0).
//   params    lamp 0..1 (spec.light: 1 lit, 0 out: flame, glow, light and the pool all fade together), flame (spec.flame 1: the flicker strength), tween both
//             with c.prop(t, id, { lamp: 0 }, dur); seed them with a dur-0 set first when they start away from the default.
//   cameras (relative to the origin, default fov 30; the director owns the episode cameras):
//     39  wide, the plate's layout: pos [0.05, 1.30, 2.00] look [0.00, 1.20, -1.60] fov 38 (Spud at the window left, Plato at the desk right).
//     47  Plato close, the window behind left: pos [0.62, 1.30, 1.15] look [0.58, 1.22, -1.50] fov 26.
//     48  Spud in front of the desk, Plato behind: pos [0.30, 1.20, 2.30] look [0.40, 1.10, -1.50] fov 33.
//
// klismos     Plato's chair (curved oak, splayed sabre legs, the curved back rail). ORIGIN = the floor under the middle of the seat, the sitter faces +z, the back
//             at z -0.2. Seat top at SEAT_Y 0.42 (a wool pad included), so c.A(t, who, "sit", { seat: id, hands: "keep" }) works exactly as for `chair`.
//             spec: color "#8a5a34" (oak), pad "#cfc3a4" (the pad). Size 0.46 x 0.44 seat, back top at 0.88. Returns grip SEAT_Y.
import * as THREE from "three";
import { flameMesh, glowMesh } from "./props-candle.js";

export const AT_D_ROOM_GRIPS = {};
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file's registry)

// ================================================================================================================ small tools
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const rng = (seed) => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vn = (x, z, s = 0) => {   // smooth value noise, 0..1
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const h = (a, b) => hs(a * 17.13 + b * 91.7 + s * 7.31);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
};
const fbm = (x, z, s = 0, o = 4) => { let a = 0, w = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { a += w * vn(x * f, z * f, s + i * 3.1); t += w; w *= 0.5; f *= 2.03; } return a / t; };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; return t;
}
const hex2 = (c, a = 1) => { const k = new THREE.Color(c).convertLinearToSRGB(); return `rgba(${Math.round(k.r * 255)},${Math.round(k.g * 255)},${Math.round(k.b * 255)},${a})`; };
const css = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
// a colour string from "#rrggbb" with a multiplier and an alpha (canvas colours are sRGB, so plain hex maths is right here)
function shade(hex, k, a = 1) { const n = parseInt(hex.slice(1), 16); return css(clamp(((n >> 16) & 255) * k, 0, 255), clamp(((n >> 8) & 255) * k, 0, 255), clamp((n & 255) * k, 0, 255), a); }

// ================================================================================================================ a triangle soup with per-vertex colour (baked shade)
class Soup {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.xf = null; this.nm = null; }
  setXf(m) { this.xf = m; this.nm = m ? new THREE.Matrix3().getNormalMatrix(m) : null; return this; }
  tri(A, B, C, uA, uB, uC, cA, cB, cC) {
    const V = this.xf ? [A, B, C].map((p) => new THREE.Vector3(...p).applyMatrix4(this.xf).toArray()) : [A, B, C];
    const [a, b, c] = V;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    V.forEach((p, i) => { this.p.push(p[0], p[1], p[2]); this.n.push(nx, ny, nz); const u = [uA, uB, uC][i], cc = [cA, cB, cC][i]; this.u.push(u[0], u[1]); this.c.push(cc[0], cc[1], cc[2]); });
  }
  quad(a, b, c, d, uv, col = [1, 1, 1]) {
    const cs = Array.isArray(col[0]) ? col : [col, col, col, col];
    this.tri(a, b, c, uv[0], uv[1], uv[2], cs[0], cs[1], cs[2]); this.tri(a, c, d, uv[0], uv[2], uv[3], cs[0], cs[2], cs[3]);
  }
  // a grid of nu x nv cells from origin o along du and dv, uv from (u0, v0) along (ud, vd) over the whole patch; colFn(x, y, z) -> [r, g, b]
  grid(o, du, dv, nu, nv, uv0, uvU, uvV, colFn) {
    const P = (i, j) => [o[0] + du[0] * i / nu + dv[0] * j / nv, o[1] + du[1] * i / nu + dv[1] * j / nv, o[2] + du[2] * i / nu + dv[2] * j / nv];
    const U = (i, j) => [uv0[0] + uvU[0] * i / nu + uvV[0] * j / nv, uv0[1] + uvU[1] * i / nu + uvV[1] * j / nv];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      this.quad(a, b, c, d, [U(i, j), U(i + 1, j), U(i + 1, j + 1), U(i, j + 1)], colFn ? [colFn(...a), colFn(...b), colFn(...c), colFn(...d)] : [1, 1, 1]);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    return g;
  }
  get empty() { return !this.p.length; }
}

// ================================================================================================================ textures (drawn once per spec, cached)
// plaster: whitewash with blotches, worn patches down to the brown lime coat, cracks with a lit lip, stains, soot, hatching; world rect mw x mh metres
function plasterTex(seed, W, H, mw, mh, o = {}) {
  return once(`pl|${seed}|${W}|${mw}|${mh}|${JSON.stringify(o)}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed), px = W / mw, py = H / mh;
    g.fillStyle = o.base ?? "#d8d0bb"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {   // big soft blotches of older and newer wash
      const x = R() * W, y = R() * H, r = (30 + R() * 190) * (W / 2048), k = 0.84 + R() * 0.26;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, shade("#d8d0bb", k, 0.34)); gr.addColorStop(1, shade("#d8d0bb", k, 0));
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 34; i++) {   // trowel sweeps: long low arcs of a slightly different tone
      const x = R() * W, y = R() * H, l = 80 + R() * 240; g.strokeStyle = shade("#d8d0bb", 0.9 + R() * 0.2, 0.2); g.lineWidth = 8 + R() * 22; g.lineCap = "round";
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y + (R() - 0.5) * 50, x + l, y + (R() - 0.5) * 40); g.stroke();
    }
    for (let i = 0; i < 18000; i++) {   // fine grit
      const x = R() * W, y = R() * H, k = R(); g.fillStyle = k < 0.55 ? `rgba(70,58,40,${0.05 + R() * 0.12})` : `rgba(255,252,240,${0.05 + R() * 0.14})`; const s = 1 + R() * 2.2; g.fillRect(x, y, s, s);
    }
    // damp near the floor, water stains running down from the top
    if (o.damp !== false) {
      const gr = g.createLinearGradient(0, H, 0, H * 0.7); gr.addColorStop(0, "rgba(96,78,52,0.42)"); gr.addColorStop(1, "rgba(96,78,52,0)"); g.fillStyle = gr; g.fillRect(0, H * 0.7, W, H * 0.3);
      for (let i = 0; i < 9; i++) { const x = R() * W, l = H * (0.2 + R() * 0.4), w = 6 + R() * 26; const gr2 = g.createLinearGradient(0, 0, 0, l); gr2.addColorStop(0, "rgba(110,92,64,0.1)"); gr2.addColorStop(1, "rgba(110,92,64,0)"); g.fillStyle = gr2; g.fillRect(x - w / 2, 0, w, l); }
    }
    // worn patches: the whitewash gone, the brown lime coat and bits of brick under it, a shadow on the lower lip and a lit upper lip
    const hole = (cx, cy, r, ex = 1) => {
      const n = 14 + (R() * 8) | 0, pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * TAU, rr = r * (0.6 + R() * 0.7); pts.push([cx + Math.cos(a) * rr * ex, cy + Math.sin(a) * rr]); }
      const path = () => { g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
      g.save(); g.translate(2.5, 3.5); path(); g.fillStyle = "rgba(40,30,20,0.2)"; g.fill(); g.restore();
      path(); g.fillStyle = R() < 0.3 ? "#bba98c" : "#c6b69a"; g.fill();
      g.save(); path(); g.clip();
      for (let k = 0; k < 40; k++) { g.fillStyle = shade("#9a8668", 0.8 + R() * 0.4, 0.5); const s = 2 + R() * 9; g.fillRect(cx + (R() - 0.5) * r * 2, cy + (R() - 0.5) * r * 2, s, s * (0.5 + R())); }
      g.restore();
      path(); g.lineWidth = 2; g.strokeStyle = "rgba(255,250,235,0.35)"; g.stroke();
    };
    const holes = o.holes ?? 10;
    for (let i = 0; i < holes; i++) hole(R() * W, R() * H, (10 + R() * 30) * (W / 2048), 1 + R() * 0.8);
    for (const [x, y, r] of o.worn || []) hole(x * px, (mh - y) * py, r * px, 1.2);
    // cracks: random walks with side branches, a dark line and a lit lip
    const crack = (x, y, ang, len, w, depth = 0) => {
      const pts = [[x, y]]; let a = ang; const seg = 9 + R() * 8;
      for (let d = 0; d < len; d += seg) { a += (R() - 0.5) * 0.7; x += Math.cos(a) * seg; y += Math.sin(a) * seg; pts.push([x, y]); if (depth < 2 && R() < 0.07) crack(x, y, a + (R() < 0.5 ? 1 : -1) * (0.5 + R() * 0.7), len * 0.3 * R() + 20, w * 0.6, depth + 1); }
      g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = "rgba(255,250,236,0.45)"; g.lineWidth = w + 1.2; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0] + 1.3, p[1] + 1.3) : g.moveTo(p[0] + 1.3, p[1] + 1.3)); g.stroke();
      g.strokeStyle = `rgba(52,42,30,${0.65 + R() * 0.25})`; g.lineWidth = w; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    };
    for (let i = 0; i < (o.cracks ?? 12); i++) crack(R() * W, R() * H, R() * TAU, (120 + R() * 380) * (W / 2048), 1.2 + R() * 1.8);
    for (const [x, y, ang, len] of o.crackAt || []) crack(x * px, (mh - y) * py, ang, len * px, 2.6);
    // soot, rising in a plume from the lamp, torn at the edge, with fine dark streaks
    for (const [x, y, rx, ry, a] of o.soot || []) {
      const cx = x * px, cy = (mh - y) * py;
      for (let k = 0; k < 120; k++) {
        const t = k / 120, ox = (R() - 0.5) * rx * px * (0.5 + t), oy = -t * ry * py * 1.3 + (R() - 0.5) * 30, r = (30 + R() * 80) * (0.5 + 0.8 * t) * (W / 2048);
        const gr = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, `rgba(30,24,18,${a * (0.15 - 0.11 * t)})`); gr.addColorStop(1, "rgba(30,24,18,0)"); g.fillStyle = gr; g.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
      }
      for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(28,22,16,${0.08 + R() * 0.12})`; g.lineWidth = 1 + R() * 2.5; const sx = cx + (R() - 0.5) * rx * px, sl = ry * py * (0.3 + R() * 0.8); g.beginPath(); g.moveTo(sx, cy); g.bezierCurveTo(sx + (R() - 0.5) * 20, cy - sl * 0.3, sx + (R() - 0.5) * 30, cy - sl * 0.7, sx + (R() - 0.5) * 30, cy - sl); g.stroke(); }
    }
    // hand-drawn ink hatching: short parallel strokes in clusters, like the painted sheets' wall shading
    for (let i = 0; i < 70; i++) {
      const x = R() * W, y = R() * H, n = 4 + (R() * 7) | 0, a = 0.9 + R() * 0.5, l = 14 + R() * 30; g.strokeStyle = `rgba(70,56,40,${0.07 + R() * 0.1})`; g.lineWidth = 1.1;
      for (let k = 0; k < n; k++) { g.beginPath(); g.moveTo(x + k * 5, y); g.lineTo(x + k * 5 + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    }
    return ctex(cv);
  });
}
// flagstones: irregular slabs, dark joints, wear, chips, a few cracks and hatching; the rectangle is mw x mh metres
function floorTex(seed, W, H, mw, mh) {
  return once(`fl|${seed}|${W}|${mw}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed), px = W / mw, py = H / mh;
    g.fillStyle = "#4a4338"; g.fillRect(0, 0, W, H);
    const rows = []; let y = 0; while (y < mh) { const h = 0.42 + R() * 0.3; rows.push([y, Math.min(mh, y + h)]); y += h; }
    const tones = ["#8f897a", "#9a937f", "#7d786a", "#a39b86", "#857f70", "#948c78", "#a8a08a"];
    rows.forEach(([y0, y1], ri) => {
      let x = -R() * 0.5; while (x < mw) {
        const w = 0.5 + R() * 0.55, x0 = x, x1 = Math.min(mw + 0.5, x + w); x += w;
        const j = () => (R() - 0.5) * 0.03, pts = [[x0 + j(), y0 + j()], [x1 + j(), y0 + j()], [x1 + j(), y1 + j()], [x0 + j(), y1 + j()]];
        const path = () => { g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0] * px, p[1] * py) : g.moveTo(p[0] * px, p[1] * py)); g.closePath(); };
        const t = tones[(R() * tones.length) | 0]; path(); g.fillStyle = t; g.fill();
        g.save(); path(); g.clip();
        const gr = g.createRadialGradient(((x0 + x1) / 2) * px, ((y0 + y1) / 2) * py, 0, ((x0 + x1) / 2) * px, ((y0 + y1) / 2) * py, 0.45 * px);   // worn smoother in the middle, darker at the joints
        gr.addColorStop(0, "rgba(255,248,226,0.18)"); gr.addColorStop(1, "rgba(30,24,16,0.34)"); g.fillStyle = gr; g.fillRect(x0 * px, y0 * py, (x1 - x0) * px, (y1 - y0) * py);
        for (let k = 0; k < 60; k++) { g.fillStyle = R() < 0.5 ? "rgba(40,32,22,0.14)" : "rgba(255,250,230,0.12)"; const s = 1 + R() * 4; g.fillRect(x0 * px + R() * (x1 - x0) * px, y0 * py + R() * (y1 - y0) * py, s, s); }
        for (let k = 0; k < 9; k++) {   // hatching
          const hx = x0 * px + R() * (x1 - x0) * px, hy = y0 * py + R() * (y1 - y0) * py; g.strokeStyle = "rgba(40,32,22,0.2)"; g.lineWidth = 1;
          for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(hx + q * 4, hy); g.lineTo(hx + q * 4 + 12, hy + 10); g.stroke(); }
        }
        if (R() < 0.35) { g.strokeStyle = "rgba(30,24,16,0.55)"; g.lineWidth = 1.3; g.beginPath(); let cx = x0 * px + R() * (x1 - x0) * px, cy = y0 * py; g.moveTo(cx, cy); for (let k = 0; k < 6; k++) { cx += (R() - 0.5) * 30; cy += ((y1 - y0) * py) / 6; g.lineTo(cx, cy); } g.stroke(); }
        g.restore();
        path(); g.lineWidth = 3.2; g.strokeStyle = "rgba(22,18,12,0.85)"; g.stroke();   // the joint
        g.save(); g.translate(1.5, 1.5); path(); g.lineWidth = 1.2; g.strokeStyle = "rgba(255,248,226,0.2)"; g.stroke(); g.restore();
      }
    });
    for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H, r = (10 + R() * 26) * (W / 1280); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(30,24,16,0.28)"); gr.addColorStop(1, "rgba(30,24,16,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }   // old stains
    return ctex(cv);
  });
}
// oak: long grain lines, rings, knots, scratches, optional ink blots and worn (paler) edges. u runs along the grain. mw x mh metres.
function woodTex(seed, W, H, base, o = {}) {
  return once(`wd|${seed}|${W}|${H}|${base}|${JSON.stringify(o)}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const plank = o.planks ?? 0;   // across-grain boards: n of them
    for (let i = 0; i < 40; i++) { const y = R() * H, h = 4 + R() * 26; g.fillStyle = shade(base, 0.82 + R() * 0.36, 0.45); g.fillRect(0, y, W, h); }
    for (let i = 0; i < H * 0.7; i++) {   // grain
      const y = R() * H, a = R(); g.strokeStyle = a < 0.55 ? shade(base, 0.5 + R() * 0.25, 0.18 + R() * 0.3) : shade(base, 1.2 + R() * 0.3, 0.12 + R() * 0.2); g.lineWidth = 0.6 + R() * 1.7;
      g.beginPath(); let yy = y; g.moveTo(0, yy); const l = (W / 6) * (1 + R() * 3); for (let x = 0; x < W; x += l / 6) { yy += (R() - 0.5) * 2.4; g.lineTo(x, yy); } g.stroke();
    }
    for (let i = 0; i < (o.knots ?? 3); i++) {   // knots: rings flowing round
      const x = R() * W, y = R() * H, r = 8 + R() * 18; for (let k = 0; k < 7; k++) { g.strokeStyle = shade(base, 0.45 + k * 0.05, 0.5); g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y, r * (1 + k * 0.5) * 1.8, r * (1 + k * 0.5) * 0.6, 0, 0, TAU); g.stroke(); }
      g.fillStyle = shade(base, 0.3, 0.8); g.beginPath(); g.ellipse(x, y, r * 0.8, r * 0.4, 0, 0, TAU); g.fill();
    }
    for (let i = 0; i < (o.scratches ?? 40); i++) { const x = R() * W, y = R() * H, a = (R() - 0.5) * 1.6, l = 12 + R() * 70; g.strokeStyle = R() < 0.6 ? "rgba(235,205,160,0.38)" : "rgba(30,20,10,0.4)"; g.lineWidth = 0.8 + R() * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let i = 0; i < (o.dents ?? 14); i++) { const x = R() * W, y = R() * H, r = 2 + R() * 6; g.fillStyle = "rgba(25,15,6,0.35)"; g.beginPath(); g.ellipse(x, y, r * 1.4, r, R(), 0, TAU); g.fill(); g.strokeStyle = "rgba(240,215,170,0.35)"; g.lineWidth = 1; g.beginPath(); g.ellipse(x + 0.8, y + 0.8, r * 1.4, r, 0, 0.1, 3); g.stroke(); }
    for (const [x, y, r] of o.ink || []) {   // ink stains, a blot with spatter and a tail
      const cx = x * W, cy = y * H;
      g.fillStyle = "rgba(14,12,22,0.86)"; g.beginPath(); for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU, rr = r * (0.5 + R() * 0.9); k ? g.lineTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr); } g.closePath(); g.fill();
      for (let k = 0; k < 14; k++) { const a = R() * TAU, d = r * (1.4 + R() * 3); g.beginPath(); g.arc(cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d, 1 + R() * 3.5, 0, TAU); g.fill(); }
      g.strokeStyle = "rgba(14,12,22,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + r * 3, cy + r, cx + r * 5, cy - r); g.stroke();
    }
    if (o.wear) {   // worn, paler edges: along the top and bottom of the texture
      const w = o.wear * H; let gr = g.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, "rgba(214,172,120,0.55)"); gr.addColorStop(1, "rgba(214,172,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, w);
      gr = g.createLinearGradient(0, H, 0, H - w); gr.addColorStop(0, "rgba(214,172,120,0.55)"); gr.addColorStop(1, "rgba(214,172,120,0)"); g.fillStyle = gr; g.fillRect(0, H - w, W, w);
      for (let i = 0; i < 60; i++) { const x = R() * W, top = R() < 0.5; g.fillStyle = "rgba(226,190,140,0.5)"; g.beginPath(); g.ellipse(x, top ? w * 0.2 : H - w * 0.2, 6 + R() * 22, 2 + R() * 3, 0, 0, TAU); g.fill(); }
    }
    if (plank) for (let k = 1; k < plank; k++) { const y = (k / plank) * H; g.strokeStyle = "rgba(20,12,6,0.85)"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.strokeStyle = "rgba(240,215,170,0.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 2.5); g.lineTo(W, y + 2.5); g.stroke(); }
    return ctex(cv);
  });
}
// the unrolled papyrus: fibres, stains, 21 lines of unreadable text in small hand-written marks, a title line, a ragged edge (alpha) all round
function papyrusTex(seed) {
  return once(`pp|${seed}`, () => {
    const W = 1152, H = 640, [cv, g] = canvas(W, H), R = rng(seed);
    const edge = []; for (let i = 0; i <= 60; i++) edge.push(i);
    const mx = 22, my = 18;
    g.beginPath();   // ragged outline
    for (let i = 0; i <= 60; i++) { const x = mx + (W - 2 * mx) * (i / 60), y = my + R() * 7 + (i % 2) * 2; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    for (let i = 0; i <= 40; i++) { const y = my + (H - 2 * my) * (i / 40), x = W - mx - R() * 8; g.lineTo(x, y); }
    for (let i = 60; i >= 0; i--) { const x = mx + (W - 2 * mx) * (i / 60), y = H - my - R() * 7 - (i % 2) * 2; g.lineTo(x, y); }
    for (let i = 40; i >= 0; i--) { const y = my + (H - 2 * my) * (i / 40), x = mx + R() * 8; g.lineTo(x, y); }
    g.closePath(); g.save(); g.clip();
    g.fillStyle = "#e7d5a2"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, r = 30 + R() * 110, k = 0.86 + R() * 0.2; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, shade("#e7d5a2", k, 0.4)); gr.addColorStop(1, shade("#e7d5a2", k, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 160; i++) { const y = R() * H; g.strokeStyle = `rgba(140,112,60,${0.06 + R() * 0.1})`; g.lineWidth = 1 + R(); g.beginPath(); g.moveTo(0, y); for (let x = 0; x < W; x += 40) g.lineTo(x, y + (R() - 0.5) * 3); g.stroke(); }   // horizontal fibres
    for (let i = 0; i < 70; i++) { const x = R() * W; g.strokeStyle = `rgba(150,120,70,${0.04 + R() * 0.06})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 8, H); g.stroke(); }
    // the lines: words of small marks. Left margin, 21 lines, the last shorter.
    const ink = "#3b2d1f", L = 21, y0 = 96, dy = (H - 150) / L;
    const word = (x, y, n) => {   // n glyph marks: little hooks, loops and strokes of one hand
      for (let k = 0; k < n; k++) {
        const gx = x + k * 11 + R() * 2, s = 5 + R() * 3, t = R(); g.strokeStyle = ink; g.lineWidth = 1.5 + R() * 0.7; g.lineCap = "round"; g.beginPath();
        if (t < 0.25) { g.moveTo(gx, y); g.lineTo(gx + R() * 3, y - s * 1.8); } else if (t < 0.5) { g.arc(gx + 2, y - s * 0.7, s * 0.55, 0.3, TAU * 0.85); } else if (t < 0.75) { g.moveTo(gx - 2, y - s); g.quadraticCurveTo(gx + 4, y - s * 2, gx + 5, y); } else { g.moveTo(gx, y - s * 1.4); g.lineTo(gx + 3, y); g.lineTo(gx + 6, y - s * 1.2); }
        g.stroke();
      }
      return n * 11 + 9;
    };
    g.fillStyle = ink; g.save(); g.font = "bold 40px serif"; g.restore();
    { let x = 250, y = 62; for (let k = 0; k < 4; k++) x += word(x, y, 3 + ((R() * 4) | 0)) * 1.5; g.strokeStyle = "rgba(60,40,20,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(240, 76); g.lineTo(x, 76); g.stroke(); }   // the title
    for (let l = 0; l < L; l++) {
      const y = y0 + l * dy, end = l === L - 1 ? W * 0.45 : W - 70 - R() * 70; let x = 62 + (l === 3 || l === 11 ? 30 : 0);
      while (x < end) { x += word(x, y, 2 + ((R() * 6) | 0)); }
    }
    for (let i = 0; i < 5; i++) { const x = R() * W, y = R() * H; g.fillStyle = "rgba(14,12,20,0.55)"; g.beginPath(); g.arc(x, y, 1 + R() * 2.5, 0, TAU); g.fill(); }   // ink spatter
    g.strokeStyle = "rgba(110,80,40,0.35)"; g.lineWidth = 2; g.stroke();
    g.restore();
    // a thin darker rim along the ragged edge
    return ctex(cv);
  });
}
// a black-figure jar: orange clay, black glaze, a frieze of walking potato silhouettes (FIX: potatoes, not people), chips where the glaze flaked
function jarTex(seed, W = 1024, H = 1024) {
  return once(`jar|${seed}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed);
    const CLAY = "#cc7330", BLK = "#1c1818";
    g.fillStyle = CLAY; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { const x = R() * W, y = R() * H, r = 20 + R() * 90, k = 0.82 + R() * 0.3; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, shade(CLAY, k, 0.4)); gr.addColorStop(1, shade(CLAY, k, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const band = (t0, t1) => g.fillRect(0, t0 * H, W, (t1 - t0) * H);   // t: 0 top .. 1 bottom
    g.fillStyle = BLK; band(0, 0.16);    // neck and lip
    g.fillStyle = BLK; band(0.9, 1.0);   // the foot
    // tongues on the neck: orange stripes pointing up from the shoulder line
    g.fillStyle = CLAY; for (let i = 0; i < 28; i++) { const x = (i + 0.5) * (W / 28); g.beginPath(); g.moveTo(x - 14, 0.16 * H); g.lineTo(x, 0.09 * H); g.lineTo(x + 14, 0.16 * H); g.fill(); }
    // meander band
    g.strokeStyle = BLK; g.lineWidth = 7; g.lineJoin = "miter"; const my0 = 0.2 * H, mh = 0.06 * H;
    g.beginPath(); for (let x = 0; x < W; x += mh * 1.3) { g.moveTo(x, my0 + mh); g.lineTo(x, my0); g.lineTo(x + mh, my0); g.lineTo(x + mh, my0 + mh * 0.75); g.lineTo(x + mh * 0.35, my0 + mh * 0.75); g.lineTo(x + mh * 0.35, my0 + mh * 0.35); g.lineTo(x + mh * 0.7, my0 + mh * 0.35); } g.stroke();
    g.fillStyle = BLK; g.fillRect(0, 0.185 * H, W, 6); g.fillRect(0, 0.27 * H, W, 6); g.fillRect(0, 0.3 * H, W, 12);   // fillets
    g.fillRect(0, 0.74 * H, W, 12); g.fillRect(0, 0.77 * H, W, 6);
    // the frieze: 7 potato figures walking (body ellipse, a tuft of leaf, two legs mid-stride, two arms), with orange incised detail
    const fy0 = 0.33 * H, fh = 0.4 * H, N = 7;
    for (let i = 0; i < N; i++) {
      const cx = (i + 0.5) * (W / N) + (R() - 0.5) * 8, cy = fy0 + fh * 0.5, bh = fh * 0.34, bw = bh * 0.82, stride = 0.5 + R() * 0.4, flip = i % 3 === 2;
      g.save(); g.translate(cx, cy); if (flip) g.scale(-1, 1);
      g.fillStyle = BLK; g.strokeStyle = BLK; g.lineCap = "round";
      g.beginPath(); g.ellipse(0, -bh * 0.1, bw, bh, 0, 0, TAU); g.fill();
      // bumps on the outline (a potato)
      for (let k = 0; k < 5; k++) { const a = R() * TAU; g.beginPath(); g.arc(Math.cos(a) * bw * 0.95, -bh * 0.1 + Math.sin(a) * bh * 0.95, 4 + R() * 6, 0, TAU); g.fill(); }
      g.lineWidth = 11; g.beginPath(); g.moveTo(-bw * 0.3, bh * 0.7); g.lineTo(-bw * 0.3 - stride * 20, bh * 1.55); g.stroke(); g.beginPath(); g.moveTo(bw * 0.3, bh * 0.7); g.lineTo(bw * 0.3 + stride * 24, bh * 1.5); g.stroke();   // legs
      g.lineWidth = 9; const up = R() < 0.5; g.beginPath(); g.moveTo(-bw * 0.85, -bh * 0.1); g.quadraticCurveTo(-bw * 1.5, up ? -bh * 0.8 : bh * 0.2, -bw * 1.3, up ? -bh * 1.1 : bh * 0.5); g.stroke(); g.beginPath(); g.moveTo(bw * 0.85, -bh * 0.1); g.quadraticCurveTo(bw * 1.5, up ? bh * 0.3 : -bh * 0.5, bw * 1.5, up ? bh * 0.7 : -bh * 0.9); g.stroke();   // arms
      g.lineWidth = 6; g.beginPath(); g.moveTo(0, -bh * 1.0); g.quadraticCurveTo(bw * 0.2, -bh * 1.5, bw * 0.55, -bh * 1.45); g.stroke(); g.beginPath(); g.moveTo(0, -bh * 1.0); g.quadraticCurveTo(-bw * 0.1, -bh * 1.55, -bw * 0.45, -bh * 1.55); g.stroke();   // the sprout
      g.strokeStyle = CLAY; g.lineWidth = 2.2; g.beginPath(); g.arc(bw * 0.2, -bh * 0.3, bh * 0.35, 3.6, 5.5); g.stroke(); g.beginPath(); g.moveTo(-bw * 0.4, bh * 0.35); g.lineTo(bw * 0.1, bh * 0.45); g.stroke();   // incised lines
      g.fillStyle = CLAY; g.beginPath(); g.arc(bw * 0.38, -bh * 0.38, 4.5, 0, TAU); g.fill();   // one eye
      g.restore();
    }
    // rays pointing up from the foot
    g.fillStyle = BLK; band(0.8, 0.9); g.fillStyle = CLAY; for (let i = 0; i < 24; i++) { const x = (i + 0.5) * (W / 24); g.beginPath(); g.moveTo(x - 17, 0.9 * H); g.lineTo(x, 0.8 * H); g.lineTo(x + 17, 0.9 * H); g.fill(); }
    // chips: orange scars in the glaze, scuffs, a long crack
    for (let i = 0; i < 70; i++) { const x = R() * W, y = (R() < 0.7 ? 0.8 + R() * 0.2 : R()) * H; g.fillStyle = R() < 0.6 ? shade(CLAY, 0.85 + R() * 0.3, 0.9) : "rgba(0,0,0,0.5)"; g.beginPath(); g.ellipse(x, y, 2 + R() * 9, 1.5 + R() * 5, R() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { g.strokeStyle = "rgba(30,20,12,0.5)"; g.lineWidth = 1.3; g.beginPath(); let x = R() * W, y = R() * H * 0.3; g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (R() - 0.5) * 22; y += 20 + R() * 25; g.lineTo(x, y); } g.stroke(); }
    return ctex(cv);
  });
}
// stone courses for the outer wall: rough blocks, mortar, moss, chips; mw x mh metres
function stoneTex(seed, W, H, mw, mh) {
  return once(`st|${seed}|${W}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed), px = W / mw, py = H / mh;
    g.fillStyle = "#3b372f"; g.fillRect(0, 0, W, H);
    let y = 0; const tones = ["#8f8a79", "#a29a85", "#7a7566", "#aaa28b", "#868170", "#98907c"];
    while (y < mh) {
      const h = 0.22 + R() * 0.18; let x = -R() * 0.4;
      while (x < mw) {
        const w = 0.28 + R() * 0.4, x0 = x, x1 = x + w, y1 = Math.min(mh + 0.2, y + h); x += w; const j = () => (R() - 0.5) * 0.025;
        const path = () => { g.beginPath(); g.moveTo((x0 + j()) * px, (y + j()) * py); g.lineTo((x1 + j()) * px, (y + j()) * py); g.lineTo((x1 + j()) * px, (y1 + j()) * py); g.lineTo((x0 + j()) * px, (y1 + j()) * py); g.closePath(); };
        path(); g.fillStyle = tones[(R() * tones.length) | 0]; g.fill(); g.save(); path(); g.clip();
        const gr = g.createLinearGradient(0, y * py, 0, y1 * py); gr.addColorStop(0, "rgba(255,250,232,0.2)"); gr.addColorStop(1, "rgba(20,16,10,0.3)"); g.fillStyle = gr; g.fillRect(x0 * px, y * py, w * px, (y1 - y) * py);
        for (let k = 0; k < 40; k++) { g.fillStyle = R() < 0.5 ? "rgba(30,24,16,0.15)" : "rgba(255,250,230,0.12)"; g.fillRect(x0 * px + R() * w * px, y * py + R() * (y1 - y) * py, 1 + R() * 4, 1 + R() * 3); }
        if (R() < 0.18) { g.fillStyle = "rgba(80,104,52,0.45)"; g.beginPath(); g.ellipse(x0 * px + R() * w * px, y1 * py - 3, 8 + R() * 22, 3 + R() * 5, 0, 0, TAU); g.fill(); }
        g.restore(); path(); g.lineWidth = 3; g.strokeStyle = "rgba(18,14,8,0.85)"; g.stroke();
      }
      y += h;
    }
    return ctex(cv);
  });
}
// one cobble lane surface
function laneTex(seed, W, H, mw, mh) {
  return once(`ln|${seed}`, () => {
    const [cv, g] = canvas(W, H), R = rng(seed), px = W / mw, py = H / mh;
    g.fillStyle = "#4a443a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 520; i++) { const x = R() * W, y = R() * H, r = (0.07 + R() * 0.11) * px, k = 0.6 + R() * 0.5; g.fillStyle = shade("#9a927c", k); g.beginPath(); g.ellipse(x, y, r, r * (0.6 + R() * 0.3), R() * 3, 0, TAU); g.fill(); g.strokeStyle = "rgba(20,16,10,0.7)"; g.lineWidth = 2; g.stroke(); g.fillStyle = "rgba(255,250,230,0.16)"; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.55, r * 0.3, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H; g.fillStyle = "rgba(70,96,46,0.35)"; g.beginPath(); g.ellipse(x, y, 6 + R() * 16, 3 + R() * 6, 0, 0, TAU); g.fill(); }
    return ctex(cv);
  });
}
const whiteTex = () => once("white", () => { const [cv, g] = canvas(4, 4); g.fillStyle = "#fff"; g.fillRect(0, 0, 4, 4); return ctex(cv); });

// ================================================================================================================ the room's own light (one shader, many textures)
// All lighting is computed in the prop's LOCAL space: a cool moon ambient, the moonlight patch the window throws, and the lamp (warm, falls off with
// distance, soft moving shadows from a list of spheres, a hint of gloss). Output is already in display colour; the engine's grade leaves it alone.
const RM_V = `varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying vec3 vC;
void main() { vP = position; vN = normal; vUv = uv; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const NOCC = 16;
const RM_F = `uniform sampler2D map; uniform vec3 uLampP; uniform float uLamp; uniform float uGloss; uniform float uEmit;
uniform mat4 uInv; uniform vec4 uOcc[${NOCC}]; uniform vec3 uMoonDir; uniform vec4 uWin; uniform float uMoonK; uniform float uTime; uniform float uAmb;
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying vec3 vC;
void main() {
  vec4 tx = texture2D(map, vUv); if (tx.a < 0.5) discard;
  vec3 alb = tx.rgb * vC;
  vec3 cam = (uInv * vec4(cameraPosition, 1.0)).xyz;
  vec3 V = normalize(cam - vP), n = normalize(vN); if (dot(n, V) < 0.0) n = -n;
  // cool moonlit ambient from the window side, a little brighter facing up
  vec3 amb = vec3(0.07, 0.10, 0.25) * (0.8 + 0.2 * n.y) * uAmb;
  // the moonlight patch: the ray from here toward the moon must pass through the window opening
  vec3 moon = vec3(0.0);
  if (vP.z > uWin.z + 0.001 && uMoonDir.z < -0.01) {
    float s = (uWin.z - vP.z) / uMoonDir.z; vec3 h = vP + uMoonDir * s;
    float ins = smoothstep(-1.30, -1.27, h.x) * (1.0 - smoothstep(-0.13, -0.10, h.x)) * smoothstep(0.95, 0.99, h.y) * (1.0 - smoothstep(2.02, 2.05, h.y));
    moon = vec3(0.30, 0.42, 0.74) * ins * max(dot(n, uMoonDir), 0.0) * uMoonK * 1.5;
  }
  // the lamp
  vec3 Lv = uLampP - vP; float d = length(Lv); Lv /= d;
  float nd = dot(n, Lv); float w = clamp(nd * 0.78 + 0.22, 0.0, 1.0);
  float att = 1.0 / (1.0 + pow(d / 0.58, 2.1));
  float sh = 1.0;
  for (int i = 0; i < ${NOCC}; i++) {
    vec4 o = uOcc[i]; if (o.w > 0.0) {
      float t = clamp(dot(o.xyz - vP, Lv), 0.0, d); vec3 q = vP + Lv * t; float dist = length(o.xyz - q);
      float soft = o.w * 0.55 + 0.045 * t + 0.02;
      float m = smoothstep(0.03, 0.14, t) * smoothstep(0.03, 0.14, d - t);
      sh *= 1.0 - m * (1.0 - smoothstep(o.w - soft, o.w + soft, dist)) * 0.92;
    }
  }
  vec3 lampC = vec3(1.0, 0.68, 0.30) * 3.6 * uLamp * att * w * sh;
  vec3 Hh = normalize(Lv + V); float spec = pow(max(dot(n, Hh), 0.0), 26.0) * uGloss * uLamp * att * sh;
  vec3 col = alb * (amb + lampC + moon) + vec3(1.0, 0.8, 0.5) * spec * 0.7 + alb * uEmit;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
function roomShared() {
  return {
    uLampP: { value: new THREE.Vector3(0.075, 1.0, -0.8) }, uLamp: { value: 1 }, uInv: { value: new THREE.Matrix4() }, uOcc: { value: Array.from({ length: NOCC }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uMoonDir: { value: new THREE.Vector3(0.42, 0.52, -0.74).normalize() }, uWin: { value: new THREE.Vector4(-1.3, -0.1, -1.6, 0) }, uMoonK: { value: 1 }, uTime: { value: 0 },
  };
}
function roomMat(U, map, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, map: { value: map }, uGloss: { value: o.gloss ?? 0 }, uEmit: { value: o.emit ?? 0 }, uAmb: { value: o.amb ?? 1 } }, vertexShader: RM_V, fragmentShader: RM_F,
    vertexColors: true, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
  m.userData.noOutline = true; return m;
}

// ================================================================================================================ geometry makers on a Soup
const WORLD_DIM = {};
// one box: faces routed to named soups. mats: a name or { px, nx, py, ny, pz, nz }. UV = world metres on the face's two axes (tw x th per repeat,
// origin ox / oz, oy = the top for y so v runs down); grain = the axis the texture's u runs along when the face spans it. col: [r,g,b] or fn(x,y,z)
function box(Sp, x0, y0, z0, x1, y1, z1, mats, o = {}) {
  const f = typeof mats === "string" ? { px: mats, nx: mats, py: mats, ny: mats, pz: mats, nz: mats } : mats, tw = o.tw ?? 1, th = o.th ?? 1, ox = o.ox ?? 0, oy = o.oy ?? 0, oz = o.oz ?? 0;
  const grain = { x: 0, y: 1, z: 2 }[o.grain ?? "x"], col = o.col ?? [1, 1, 1], cf = typeof col === "function" ? col : () => col, nu = o.n ?? 1;
  const axOf = (d) => (Math.abs(d[0]) > 1e-9 ? 0 : Math.abs(d[1]) > 1e-9 ? 1 : 2);
  const face = (mat, p0, du, dv) => {
    if (!mat) return;
    const q = o.ts?.[mat] ?? o, val = (p, ax) => (ax === 1 ? ((q.oy ?? oy) - p[1]) / (q.th ?? th) : ax === 0 ? (p[0] - (q.ox ?? ox)) / (q.tw ?? tw) : (p[2] - (q.oz ?? oz)) / (q.tz ?? q.tw ?? tw));
    let ua = axOf(du), va = axOf(dv); if (va === grain && ua !== grain) [ua, va] = [va, ua];
    const P = (d) => [p0[0] + d[0], p0[1] + d[1], p0[2] + d[2]], T = (p) => [val(p, ua), val(p, va)], t0 = T(p0), t1 = T(P(du)), t2 = T(P(dv));
    Sp(mat).grid(p0, du, dv, nu, nu, t0, [t1[0] - t0[0], t1[1] - t0[1]], [t2[0] - t0[0], t2[1] - t0[1]], cf);
  };
  const X = x1 - x0, Y = y1 - y0, Z = z1 - z0;
  face(f.pz, [x0, y0, z1], [X, 0, 0], [0, Y, 0]); face(f.nz, [x1, y0, z0], [-X, 0, 0], [0, Y, 0]);
  face(f.px, [x1, y0, z1], [0, 0, -Z], [0, Y, 0]); face(f.nx, [x0, y0, z0], [0, 0, Z], [0, Y, 0]);
  face(f.py, [x0, y1, z1], [X, 0, 0], [0, 0, -Z]); face(f.ny, [x0, y0, z0], [X, 0, 0], [0, 0, Z]);
}
// a tapered tube along points (a Catmull-Rom curve), radii r0..r1, `sides` round; uv: u along (per metre / tw), v round
function tube(S, pts, r0, r1, sides, col, o = {}) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), N = o.seg ?? 10, P = cv.getPoints(N), tw = o.tw ?? 1;
  const ring = (i) => {
    const p = P[i], tg = cv.getTangent(i / N).normalize(), up = Math.abs(tg.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), s = new THREE.Vector3().crossVectors(tg, up).normalize(), u = new THREE.Vector3().crossVectors(s, tg).normalize();
    const r = lerp(r0, r1, i / N), out = []; for (let k = 0; k < sides; k++) { const a = (k / sides) * TAU; out.push(p.clone().addScaledVector(s, Math.cos(a) * r).addScaledVector(u, Math.sin(a) * r).toArray()); } return out;
  };
  let prev = ring(0), len = 0;
  for (let i = 1; i <= N; i++) {
    const cur = ring(i), l1 = len + P[i].distanceTo(P[i - 1]);
    for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; S.quad(prev[k], cur[k], cur[k2], prev[k2], [[len / tw, k / sides], [l1 / tw, k / sides], [l1 / tw, (k + 1) / sides], [len / tw, (k + 1) / sides]], typeof col === "function" ? [col(...prev[k]), col(...cur[k]), col(...cur[k2]), col(...prev[k2])] : col); }
    prev = cur; len = l1;
  }
  return cv;
}
// a vertical lathe solid from a profile r(y) between y0 and y1, centred at (cx, cz). profile: fn(t 0..1 bottom..top) -> radius. uv.v 0 at the TOP (the texture's top row).
function lathe(S, cx, cz, y0, y1, prof, segs, steps, col, o = {}) {
  const colf = typeof col === "function" ? col : () => col;
  const pt = (i, k) => { const t = i / steps, r = prof(t), a = (k / segs) * TAU + (o.rot ?? 0); return [cx + Math.sin(a) * r, lerp(y0, y1, t), cz + Math.cos(a) * r]; };
  for (let i = 0; i < steps; i++) for (let k = 0; k < segs; k++) {
    const a = pt(i, k), b = pt(i, k + 1), c = pt(i + 1, k + 1), d = pt(i + 1, k), ta = 1 - i / steps, tb = 1 - (i + 1) / steps;
    S.quad(a, b, c, d, [[k / segs, ta], [(k + 1) / segs, ta], [(k + 1) / segs, tb], [k / segs, tb]], [colf(...a), colf(...b), colf(...c), colf(...d)]);
  }
}
function disc(S, cx, y, cz, r, segs, col, up = true) {
  for (let k = 0; k < segs; k++) { const a0 = (k / segs) * TAU, a1 = ((k + 1) / segs) * TAU; S.tri([cx, y, cz], [cx + Math.sin(a0) * r, y, cz + Math.cos(a0) * r], [cx + Math.sin(a1) * r, y, cz + Math.cos(a1) * r], [0.5, 0.5], [0.5 + Math.sin(a0) * 0.5, 0.5 + Math.cos(a0) * 0.5], [0.5 + Math.sin(a1) * 0.5, 0.5 + Math.cos(a1) * 0.5], col, col, col); }
}
// a rolled papyrus from a to b along x: body, spiral end caps (rings), a cord loop in the middle
function roll(Sp, c, len, r, ang, o = {}) {
  const [cx, cy, cz] = c, ca = Math.cos(ang), sa = Math.sin(ang), dir = [ca, 0, sa], k = o.k ?? 1;
  const body = Sp("papyrus"), cap = Sp("white"), segs = 14;
  const at = (s, a, rr) => { const px = cx + ca * s, pz = cz + sa * s, ox = -sa * Math.sin(a) * rr, oz = ca * Math.sin(a) * rr; return [px + ox, cy + Math.cos(a) * rr, pz + oz]; };
  for (let i = 0; i < 2; i++) for (let j = 0; j < segs; j++) {
    const s0 = -len / 2 + (i * len) / 2, s1 = s0 + len / 2, a0 = (j / segs) * TAU, a1 = ((j + 1) / segs) * TAU;
    body.quad(at(s0, a0, r), at(s1, a0, r), at(s1, a1, r), at(s0, a1, r), [[(i / 2), j / segs], [(i + 1) / 2, j / segs], [(i + 1) / 2, (j + 1) / segs], [i / 2, (j + 1) / segs]], mul3(o.col ?? [1, 0.98, 0.9], k * (0.85 + 0.15 * Math.cos(a0))));
  }
  for (const [sgn, s] of [[1, len / 2], [-1, -len / 2]]) for (let ring = 0; ring < 6; ring++) {   // spiral: concentric bands, alternating
    const r0 = r * (1 - ring / 6), r1 = r * (1 - (ring + 1) / 6), cc = mul3(ring % 2 ? [0.78, 0.66, 0.4] : [0.93, 0.83, 0.55], k);
    for (let j = 0; j < segs; j++) { const a0 = (j / segs) * TAU, a1 = ((j + 1) / segs) * TAU; cap.quad(at(s + sgn * 0.001, a0, r0), at(s + sgn * 0.001, a1, r0), at(s + sgn * 0.001, a1, r1), at(s + sgn * 0.001, a0, r1), [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], cc); }
  }
  if (o.cord !== false) for (const s of o.cordAt ?? [-len * 0.12, len * 0.12]) {   // cord: two thin rings and a loop end
    const ring = (rr, kk) => { for (let j = 0; j < 12; j++) { const a0 = (j / 12) * TAU, a1 = ((j + 1) / 12) * TAU; cap.quad(at(s - 0.004, a0, rr), at(s + 0.004, a0, rr), at(s + 0.004, a1, rr), at(s - 0.004, a1, rr), [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], mul3([0.62, 0.42, 0.2], kk * k)); } };
    ring(r * 1.07, 1);
  }
}

// ================================================================================================================ pots: black-figure jars (a lathe with the painted frieze)
const JAR_K = [[0, 0.16], [0.04, 0.19], [0.2, 0.25], [0.5, 0.285], [0.7, 0.21], [0.82, 0.125], [0.9, 0.11], [0.96, 0.14], [1, 0.165]];
const jarProf = (h) => (t) => { let i = 0; while (i < JAR_K.length - 2 && t > JAR_K[i + 1][0]) i++; const [t0, r0] = JAR_K[i], [t1, r1] = JAR_K[i + 1], k = clamp((t - t0) / (t1 - t0)); return h * lerp(r0, r1, 0.5 - 0.5 * Math.cos(k * Math.PI)); };
function jar(Sp, name, cx, y0, cz, h, rot, seed) {
  const prof = jarProf(h);
  lathe(Sp(name), cx, cz, y0, y0 + h, prof, 40, 44, (x, y, z) => { const k = 0.9 + 0.1 * hs(Math.floor(y * 40) + seed, Math.floor(Math.atan2(x - cx, z - cz) * 4)); return [k, k, k]; }, { rot });
  disc(Sp("white"), cx, y0 + h - 0.004, cz, prof(1) * 0.78, 24, [0.05, 0.035, 0.03]);   // the dark mouth
  for (const s of [-1, 1]) {   // two loop handles from neck to shoulder
    const a = rot + Math.PI / 2 * s + Math.PI, dx = Math.sin(a), dz = Math.cos(a), r1 = h * 0.12, r2 = h * 0.2;
    tube(Sp("white"), [[cx + dx * r1, y0 + h * 0.88, cz + dz * r1], [cx + dx * (h * 0.2), y0 + h * 0.86, cz + dz * (h * 0.2)], [cx + dx * (h * 0.26), y0 + h * 0.72, cz + dz * (h * 0.26)], [cx + dx * r2 * 1.02, y0 + h * 0.66, cz + dz * r2 * 1.02]], h * 0.028, h * 0.028, 7, [0.07, 0.05, 0.045], { seg: 8 });
  }
}

// ================================================================================================================ the room
const LAMP = { x: 0.02, z: -0.8, top: 0.72 }, FLAME = [0.13, 1.0, -0.8], DESK = { x0: -0.3, x1: 1.2, z0: -1.05, z1: -0.35, y: 0.72 };
function buildRoom(P, S, U) {
  const sp = {}, Sp = (n) => (sp[n] ??= new Soup()), seed = S.seed ?? 1, W = whiteTex();
  const ts = {
    plB: { tw: 4, th: 2.6, ox: -2, oy: 2.6, tz: 4 }, plL: { tw: 4.8, th: 2.6, oz: -1.6, oy: 2.6 }, plR: { tw: 4.8, th: 2.6, oz: -1.6, oy: 2.6 }, plC: { tw: 4.6, tz: 5.3, ox: -2.3, oz: -1.9, th: 2.6, oy: 2.6 },
    floor: { tw: 4.6, tz: 5.3, ox: -2.3, oz: -1.9 }, stone: { tw: 2.4, th: 1.6, ox: 0, oy: 3.4 }, stoneO: { tw: 2.4, th: 1.6, ox: 0, oy: 3.4 }, lane: { tw: 12, tz: 1.25, ox: -6, oz: -3.0 }, oak: { tw: 1.2, th: 1.2 }, oakD: { tw: 1.2, th: 1.2 },
    deskTop: { tw: 1.5, tz: 0.7, ox: DESK.x0, oz: DESK.z0 }, papyrus: { tw: 1, th: 1 },
  };
  // light-baked occlusion in the vertex colours (corners, floor line, ceiling, the desk's footprint on the floor)
  const wallAO = (x, y, z) => { const a = (1 - 0.36 * Math.exp(-y / 0.3)) * (1 - 0.34 * Math.exp(-(2.6 - y) / 0.32)) * (1 - 0.3 * Math.exp(-(2 - Math.abs(x)) / 0.32)) * (1 - 0.26 * Math.exp(-(z + 1.6) / 0.3) * (z > -1.59 ? 1 : 0)); const n = 0.93 + 0.07 * vn(x * 5, y * 5, 3); return [a * n, a * n, a * n]; };
  const floorAO = (x, y, z) => {
    let a = (1 - 0.34 * Math.exp(-(2 - Math.abs(x)) / 0.3)) * (1 - 0.34 * Math.exp(-(z + 1.6) / 0.3) * (z > -1.59 ? 1 : 0));
    const dx = Math.max(DESK.x0 - x, 0, x - DESK.x1), dz = Math.max(DESK.z0 - z, 0, z - DESK.z1), d = Math.hypot(dx, dz);
    a *= 1 - 0.55 * Math.exp(-d / 0.28); const n = 0.92 + 0.08 * vn(x * 4, z * 4, 5); return [a * n, a * n, a * n];
  };
  const ceilAO = (x, y, z) => { const a = (1 - 0.3 * Math.exp(-(2 - Math.abs(x)) / 0.4)) * (1 - 0.3 * Math.exp(-(z + 1.6) / 0.4)); return [a * 0.8, a * 0.8, a * 0.8]; };
  const WALLN = 12;
  // ---- floor, ceiling, side walls, back wall with the window
  box(Sp, -2.3, -0.06, -1.9, 2.3, 0, 3.4, { py: "floor" }, { ts, col: floorAO, n: 16, tw: 4.6 });
  box(Sp, -2.3, 2.6, -1.9, 2.3, 2.7, 3.4, { ny: "plC" }, { ts, col: ceilAO, n: 10 });
  box(Sp, -2.3, 0, -1.9, -2.0, 2.7, 3.4, { px: "plL" }, { ts, col: wallAO, n: WALLN });
  box(Sp, 2.0, 0, -1.9, 2.3, 2.7, 3.4, { nx: "plR" }, { ts, col: wallAO, n: WALLN });
  const BW = { pz: "plB", nz: "stoneO", px: "plB", nx: "plB", py: "plB", ny: "plB" };
  box(Sp, -2.3, 0, -1.9, -1.3, 2.7, -1.6, BW, { ts, col: wallAO, n: WALLN });
  box(Sp, -0.1, 0, -1.9, 2.3, 2.7, -1.6, BW, { ts, col: wallAO, n: WALLN });
  box(Sp, -1.3, 0, -1.9, -0.1, 0.95, -1.6, { ...BW, py: "stone" }, { ts, col: wallAO, n: 6 });
  box(Sp, -1.3, 2.05, -1.9, -0.1, 2.7, -1.6, BW, { ts, col: wallAO, n: 6 });
  box(Sp, -6, 0, -1.9, -2.3, 3.0, -1.6, "stoneO", { ts, n: 4 }); box(Sp, 2.3, 0, -1.9, 6, 3.0, -1.6, "stoneO", { ts, n: 4 });
  // the lane outside (top y 0.40, z -1.75..-3.0), its low far wall (top 0.75), the drop below, a clay pot with a bush
  box(Sp, -6, -2.5, -3.0, 6, 0.4, -1.9, { py: "lane", nz: "stoneO", pz: "stoneO", px: "stoneO", nx: "stoneO" }, { ts, n: 3 });
  box(Sp, -6, -2.5, -3.2, 6, 0.75, -3.0, "stoneO", { ts, n: 3, oy: 0.75 });
  { const pot = (t) => 0.09 + 0.07 * Math.sin(t * Math.PI * 0.9) - 0.03 * t * t; lathe(Sp("clay"), -1.32, -2.05, 0.4, 0.62, pot, 18, 10, (x, y) => { const k = 0.8 + 0.25 * vn(x * 30, y * 30, 3); return [0.72 * k, 0.4 * k, 0.24 * k]; });
    disc(Sp("clay"), -1.32, 0.615, -2.05, 0.1, 16, [0.12, 0.08, 0.05]);
    for (let i = 0; i < 46; i++) { const a = hs(i, 1) * TAU, rr = 0.03 + 0.14 * hs(i, 2), h = 0.18 + 0.3 * hs(i, 3), x = -1.32 + Math.cos(a) * rr * 0.6, z = -2.05 + Math.sin(a) * rr * 0.6, tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr, k = 0.7 + 0.5 * hs(i, 4); const g = mix3([0.18, 0.4, 0.22], [0.36, 0.55, 0.4], hs(i, 5)); const L = 0.1 + 0.08 * hs(i, 6), b = [x, 0.62, z], tp = [tx, 0.62 + h, tz], pp = [tx + Math.sin(a) * L * 0.35, 0.62 + h - 0.01, tz - Math.cos(a) * L * 0.35], pq = [tx - Math.sin(a) * L * 0.35, 0.62 + h - 0.01, tz + Math.cos(a) * L * 0.35], tt = [tx + Math.cos(a) * L, 0.62 + h + L * 0.3, tz + Math.sin(a) * L];
      Sp("clay").tri(b, tp, pp, [0, 0], [0, 0], [0, 0], mul3(g, 0.6 * k), mul3(g, 0.8 * k), mul3(g, 0.7 * k)); Sp("clay").tri(pp, tt, pq, [0, 0], [0, 0], [0, 0], mul3(g, 0.9 * k), mul3(g, 1.2 * k), mul3(g, 0.8 * k)); Sp("clay").tri(tp, pp, pq, [0, 0], [0, 0], [0, 0], mul3(g, 0.9 * k), mul3(g, 0.9 * k), mul3(g, 0.9 * k)); } }
  box(Sp, -6, 3.0, -2.2, 6, 3.14, -1.5, "roofc", { ts, col: [0.5, 0.26, 0.19] });   // the eave over the lane
  box(Sp, -1.42, 0.915, -1.62, 0.02, 0.97, -1.46, "stone", { ts });   // the inner sill, a worn lip
  box(Sp, -1.46, 2.05, -1.62, 0.06, 2.2, -1.52, "oak", { ts, grain: "x" });   // lintel beam
  for (const x of [-1.2, -0.45, 0.35, 1.15, 1.8]) box(Sp, x - 0.08, 2.42, -1.9, x + 0.08, 2.6, 3.4, "oak", { ts, grain: "z", col: (xx, yy, zz) => { const a = 1 - 0.15 * (zz > 2 ? 1 : 0); return [a, a, a]; } });   // ceiling beams
  // ---- two plank shutters open into the room
  const shutter = (hx, dirx, ang) => {
    const M = new THREE.Matrix4().makeTranslation(hx, 0, -1.62).multiply(new THREE.Matrix4().makeRotationY(ang)); Sp("oak").setXf(M); Sp("white").setXf(M);
    for (let b = 0; b < 4; b++) { const x0 = dirx * (0.015 + b * 0.147), x1 = dirx * (0.015 + b * 0.147 + 0.139); box(Sp, Math.min(x0, x1), 0.95, 0, Math.max(x0, x1), 2.05, 0.034, "oak", { ts, grain: "y", tw: 1.1, th: 1.1, ox: b * 0.37, col: [0.82 + 0.18 * hs(b, seed), 0.82 + 0.18 * hs(b, seed), 0.8] }); }
    for (const y of [1.06, 1.93]) box(Sp, Math.min(0, dirx * 0.6), y - 0.07, 0.034, Math.max(0, dirx * 0.6), y + 0.07, 0.064, "oak", { ts, grain: "x", col: [0.78, 0.76, 0.72] });   // battens
    for (let k = 0; k < 7; k++) { const t = k / 6; box(Sp, dirx * (0.1 + 0.4 * t) - 0.012, 1.1 + 0.8 * (dirx > 0 ? t : 1 - t) - 0.012, 0.064, dirx * (0.1 + 0.4 * t) + 0.012, 1.1 + 0.8 * (dirx > 0 ? t : 1 - t) + 0.012, 0.072, "white", { col: [0.09, 0.08, 0.075] }); }   // nails of the brace
    for (const y of [1.06, 1.93]) box(Sp, Math.min(0, dirx * 0.2), y - 0.012, 0.064, Math.max(0, dirx * 0.2), y + 0.012, 0.074, "white", { col: [0.08, 0.075, 0.07] });   // strap hinges
    Sp("oak").setXf(null); Sp("white").setXf(null);
  };
  shutter(-1.3, 1, -70 * DEG); shutter(-0.1, -1, 52 * DEG);
  // ---- the desk
  const top = DESK.y, dkc = (x, y, z) => { const a = 0.82 + 0.18 * vn(x * 7, z * 7 + y * 5, 9); return [a, a, a]; };
  box(Sp, DESK.x0, 0.65, DESK.z0, DESK.x1, top, DESK.z1, { py: "deskTop", pz: "oakD", nz: "oakD", px: "oakD", nx: "oakD", ny: "oakD" }, { ts, grain: "x", col: dkc });
  box(Sp, DESK.x0 + 0.08, 0.53, DESK.z0 + 0.07, DESK.x1 - 0.08, 0.65, DESK.z1 - 0.07, "oakD", { ts, grain: "x", col: [0.72, 0.7, 0.68] });
  for (const lx of [DESK.x0 + 0.05, DESK.x1 - 0.13]) for (const lz of [DESK.z0 + 0.05, DESK.z1 - 0.13]) box(Sp, lx, 0, lz, lx + 0.08, 0.65, lz + 0.08, "oakD", { ts, grain: "y", col: (x, y, z) => { const a = 0.55 + 0.4 * sstep(0, 0.5, y); return [a, a, a]; } });
  box(Sp, DESK.x0 + 0.05, 0.2, DESK.z1 - 0.1, DESK.x1 - 0.05, 0.26, DESK.z1 - 0.06, "oakD", { ts, grain: "x", col: [0.55, 0.53, 0.5] });
  box(Sp, DESK.x0 + 0.08, 0.2, DESK.z0 + 0.1, DESK.x0 + 0.12, 0.26, DESK.z1 - 0.1, "oakD", { ts, grain: "z", col: [0.5, 0.48, 0.46] }); box(Sp, DESK.x1 - 0.12, 0.2, DESK.z0 + 0.1, DESK.x1 - 0.08, 0.26, DESK.z1 - 0.1, "oakD", { ts, grain: "z", col: [0.5, 0.48, 0.46] });
  box(Sp, 0.32, 0.545, DESK.z1 - 0.058, 0.78, 0.635, DESK.z1 - 0.045, "oak", { ts, grain: "x", col: [0.9, 0.88, 0.85] });   // the drawer front
  box(Sp, 0.535, 0.585, DESK.z1 - 0.046, 0.565, 0.595, DESK.z1 - 0.02, "bronze", { col: [0.55, 0.42, 0.2] });
  // ---- papyrus open on the desk, rolled up at both ends
  { const x0 = 0.21, x1 = 1.11, z0 = -0.8, z1 = -0.36, NX = 36, NZ = 8, s = Sp("papyrus"), yy = (x, z) => top + 0.004 + 0.0022 * Math.sin(x * 14 + z * 6) + 0.012 * sstep(0.1, 0, x - x0) + 0.012 * sstep(0.1, 0, x1 - x);
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const xa = lerp(x0, x1, i / NX), xb = lerp(x0, x1, (i + 1) / NX), za = lerp(z0, z1, j / NZ), zb = lerp(z0, z1, (j + 1) / NZ), c = (x, z) => { const k = 0.94 + 0.06 * vn(x * 9, z * 9, 4); const e = 1 - 0.18 * sstep(0.09, 0, x - x0) - 0.18 * sstep(0.09, 0, x1 - x); return [k * e, k * e * 0.99, k * e * 0.95]; };
      s.quad([xa, yy(xa, za), za], [xb, yy(xb, za), za], [xb, yy(xb, zb), zb], [xa, yy(xa, zb), zb], [[i / NX, j / NZ], [(i + 1) / NX, j / NZ], [(i + 1) / NX, (j + 1) / NZ], [i / NX, (j + 1) / NZ]], [c(xa, za), c(xb, za), c(xb, zb), c(xa, zb)]);
    } }
  roll(Sp, [0.2, top + 0.036, -0.58], 0.46, 0.036, Math.PI / 2, { cord: false }); roll(Sp, [1.12, top + 0.036, -0.58], 0.46, 0.036, Math.PI / 2, { cord: false });
  roll(Sp, [-0.12, top + 0.034, -0.6], 0.3, 0.034, 0.18, { k: 0.95 }); roll(Sp, [1.04, top + 0.034, -0.485], 0.3, 0.034, -0.1); roll(Sp, [1.06, top + 0.034 + 0.054, -0.55], 0.3, 0.034, 0.12, { k: 1.03 });
  // the reed pen: a pale reed with a cut, ink-black nib
  tube(Sp("white"), [[0.2, top + 0.006, -0.43], [0.28, top + 0.007, -0.46], [0.37, top + 0.007, -0.5]], 0.004, 0.0045, 6, [0.62, 0.5, 0.25], { seg: 3 }); tube(Sp("white"), [[0.2, top + 0.006, -0.43], [0.17, top + 0.005, -0.415]], 0.004, 0.0015, 6, [0.08, 0.06, 0.07], { seg: 2 });
  // ---- shelves on brackets with 14 rolls and 2 pots
  const SH = [{ y: 1.3, x0: 0.55, x1: 1.85 }, { y: 1.8, x0: 0.55, x1: 1.85 }];
  const shelfY = SH.map((q) => q.y + 0.02);
  for (const q of SH) {
    box(Sp, q.x0, q.y - 0.02, -1.6, q.x1, q.y + 0.02, -1.28, "oak", { ts, grain: "x", col: dkc });
    for (const bx of [q.x0 + 0.14, q.x1 - 0.14]) {
      box(Sp, bx - 0.03, q.y - 0.24, -1.6, bx + 0.03, q.y - 0.02, -1.56, "oak", { ts, grain: "y" }); box(Sp, bx - 0.03, q.y - 0.06, -1.6, bx + 0.03, q.y - 0.02, -1.34, "oak", { ts, grain: "z" });
      Sp("oak").setXf(new THREE.Matrix4().makeTranslation(0, q.y - 0.12, -1.47).multiply(new THREE.Matrix4().makeRotationX(0.78))); box(Sp, bx - 0.025, -0.012, -0.17, bx + 0.025, 0.012, 0.17, "oak", { ts, grain: "z" }); Sp("oak").setXf(null);
    }
  }
  const rl = (x, y, z, len = 0.3, r = 0.034, ang = 0, o = {}) => roll(Sp, [x, y, z], len, r, ang, { k: 0.88 + 0.12 * hs(x * 31 + y, seed), ...o });
  { const y = shelfY[0]; rl(0.78, y + 0.034, -1.52, 0.3, 0.034, 0.05); rl(0.8, y + 0.034, -1.44, 0.28, 0.034, -0.04); rl(0.79, y + 0.034 + 0.058, -1.48, 0.3, 0.034, 0.02); rl(1.2, y + 0.034, -1.5, 0.26, 0.032, 0.1); rl(1.24, y + 0.034, -1.42, 0.28, 0.034, -0.06); }
  { const y = shelfY[1]; rl(0.76, y + 0.034, -1.52, 0.3, 0.034, 0.03); rl(0.78, y + 0.034, -1.44, 0.3, 0.034, -0.05); rl(0.77, y + 0.034 + 0.058, -1.48, 0.28, 0.034, 0.04); rl(1.14, y + 0.034, -1.52, 0.3, 0.034, -0.03); rl(1.15, y + 0.034, -1.44, 0.28, 0.034, 0.05); rl(1.15, y + 0.034 + 0.058, -1.48, 0.3, 0.034, 0); for (let k = 0; k < 3; k++) { Sp("papyrus"); const s = Sp("papyrus"); roll(Sp, [1.38 + k * 0.07, y + 0.15, -1.46 + (k % 2) * 0.02], 0.3, 0.032, 0, { k: 0.9 }); } }
  jar(Sp, "jarS1", 1.6, shelfY[0], -1.44, 0.3, 0.3, 21); jar(Sp, "jarS2", 1.62, shelfY[1], -1.44, 0.28, -0.4, 22);
  // ---- the two floor jars: 0.7 right, 0.5 left (potato figures)
  jar(Sp, "jarA", 1.62, 0, -1.26, 0.7, 0.35, 11); jar(Sp, "jarB", -1.68, 0, -1.3, 0.5, -0.5, 12);
  // ---- the bronze lamp on the desk: foot, stem with beads, shallow bowl with a pinched spout, handle ring, verdigris in the hollows
  { const bz = (x, y, z) => { const v = hs(Math.floor(y * 90) * 7 + Math.floor(Math.atan2(x - LAMP.x, z - LAMP.z) * 3), 5), g = v > 0.62 ? (v - 0.62) * 2.2 : 0, a = 0.78 + 0.22 * vn(x * 60, y * 60, 2); return mix3([0.62 * a, 0.4 * a, 0.16 * a], [0.22, 0.46, 0.34], clamp(g * 0.7, 0, 0.7)); };
    const sprof = (t) => 0.018 + 0.05 * Math.exp(-t * 16) + 0.012 * Math.exp(-Math.pow((t - 0.5) / 0.05, 2)) + 0.009 * Math.exp(-Math.pow((t - 0.72) / 0.04, 2)) + 0.004 * Math.sin(t * 60);
    lathe(Sp("bronze"), LAMP.x, LAMP.z, top, top + 0.235, sprof, 20, 30, bz);
    disc(Sp("bronze"), LAMP.x, top + 0.001, LAMP.z, 0.07, 20, [0.5, 0.33, 0.14], false);
    const bowl = (t) => 0.02 + 0.058 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) + 0.004 * t;   // shallow dish
    lathe(Sp("bronze"), LAMP.x, LAMP.z, top + 0.235, top + 0.285, bowl, 22, 8, bz); disc(Sp("bronze"), LAMP.x, top + 0.274, LAMP.z, 0.066, 20, [0.18, 0.12, 0.06]);   // oil
    tube(Sp("bronze"), [[LAMP.x + 0.07, top + 0.272, LAMP.z], [LAMP.x + 0.1, top + 0.278, LAMP.z], [LAMP.x + 0.13, top + 0.283, LAMP.z]], 0.016, 0.008, 8, [0.7, 0.46, 0.2], { seg: 4 });   // the spout
    tube(Sp("bronze"), [[LAMP.x - 0.06, top + 0.275, LAMP.z], [LAMP.x - 0.115, top + 0.31, LAMP.z], [LAMP.x - 0.12, top + 0.25, LAMP.z], [LAMP.x - 0.075, top + 0.225, LAMP.z]], 0.007, 0.007, 8, bz, { seg: 10 });   // the handle ring
  }
  // ---- build the meshes: one per soup, one shader material per texture
  const TEX = {
    plB: plasterTex(100 + seed, 2048, 1331, 4, 2.6, { soot: [[2.2, 1.05, 1.1, 1.5, 1.1], [2.3, 2.5, 0.8, 0.0, 0.5]], crackAt: [[0.7, 2.05, 0.35, 1.0], [0.7, 0.95, 3.8, 0.9], [1.9, 2.05, -0.5, 1.1], [1.9, 0.95, 0.4, 0.8], [3.9, 0.4, -2.0, 1.0]], worn: [[1.5, 0.45, 0.2], [3.6, 2.2, 0.17], [2.7, 0.3, 0.14]], holes: 18, cracks: 14 }),
    plL: plasterTex(200 + seed, 1536, 1024, 4.8, 2.6, { holes: 12, cracks: 9 }), plR: plasterTex(300 + seed, 1536, 1024, 4.8, 2.6, { holes: 12, cracks: 10, }),
    plC: plasterTex(400 + seed, 1024, 1024, 4.6, 5.3, { base: "#9d927d", holes: 8, cracks: 6, damp: false, soot: [[2.3, 1.5, 1.2, 0.0, 0.0]] }),
    floor: floorTex(500 + seed, 1280, 1472, 4.6, 5.3), stone: stoneTex(600 + seed, 1024, 704, 2.4, 1.6), stoneO: stoneTex(600 + seed, 1024, 704, 2.4, 1.6), lane: laneTex(650 + seed, 1536, 160, 12, 1.25), clay: W,
    oak: woodTex(700 + seed, 1024, 512, "#7a5230", { knots: 3 }), oakD: woodTex(710 + seed, 1024, 512, "#5c3c22", { knots: 4, scratches: 60, dents: 30 }),
    deskTop: woodTex(720 + seed, 1536, 716, "#6a4a2e", { planks: 4, knots: 5, scratches: 120, dents: 40, wear: 0.07, ink: [[0.16, 0.7, 12], [0.55, 0.9, 5], [0.9, 0.2, 7]] }),
    papyrus: papyrusTex(800 + seed), white: W, bronze: W, roofc: W, jarA: jarTex(11 + seed), jarB: jarTex(12 + seed), jarS1: jarTex(21 + seed), jarS2: jarTex(22 + seed),
  };
  const AMB = { stone: 1.8, stoneO: 3.2, lane: 3.0, roofc: 3.0, clay: 1.4 }, mats = {}, GL = { bronze: 0.95, deskTop: 0.12, oak: 0.06, oakD: 0.06, jarA: 0.25, jarB: 0.25, jarS1: 0.25, jarS2: 0.25, floor: 0.08, stone: 0.04, papyrus: 0.05 };
  const roofCol = null;
  const out = new THREE.Group(); P.whole.add(out);
  for (const [name, soup] of Object.entries(sp)) {
    if (soup.empty) continue; const m = mats[name] = roomMat(U, TEX[name], { gloss: GL[name] ?? 0, amb: AMB[name] ?? 1 });
    const me = new THREE.Mesh(soup.geo(), m); me.frustumCulled = false; me.castShadow = false; me.receiveShadow = false; out.add(me);
  }
  return { group: out, mats };
}

// ================================================================================================================ the moth (two wings, fluttering round the flame)
function mothMesh() {
  const S2 = new Soup(), wing = (sgn) => {
    const c1 = [0.78, 0.7, 0.52], c2 = [0.46, 0.36, 0.24], c3 = [0.93, 0.88, 0.7];
    S2.tri([0, 0, 0], [sgn * 0.02, 0.003, -0.012], [sgn * 0.016, 0.0, 0.014], [0, 0], [1, 0], [0, 1], c3, c1, c1);
    S2.tri([sgn * 0.02, 0.003, -0.012], [sgn * 0.034, 0.002, 0.002], [sgn * 0.016, 0.0, 0.014], [0, 0], [1, 0], [0, 1], c1, c2, c1);
  };
  wing(1); wing(-1); S2.tri([0, 0.001, 0.012], [0.003, 0.001, -0.012], [-0.003, 0.001, -0.012], [0, 0], [1, 0], [0, 1], [0.2, 0.15, 0.1], [0.2, 0.15, 0.1], [0.2, 0.15, 0.1]);
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); m.userData.noOutline = true;
  const me = new THREE.Mesh(S2.geo(), m); me.scale.setScalar(1.7); me.frustumCulled = false; return me;
}

// ================================================================================================================ kinds
export const AT_D_ROOM_KINDS = {
  platoroom(P) {
    const S = P.spec, U = roomShared();
    const { group } = buildRoom(P, S, U);
    const outside = S.outside === false ? null : buildOutside(P, S);
    // soft-shadow spheres in the lamp's light (the pieces on the desk, the jars, the shelf things), then the spec's own
    const occ = [[-0.12, 0.755, -0.6, 0.05], [1.04, 0.755, -0.485, 0.05], [1.06, 0.8, -0.55, 0.04], [0.2, 0.756, -0.58, 0.05], [1.12, 0.756, -0.58, 0.05], [1.62, 0.35, -1.26, 0.2], [-1.68, 0.25, -1.3, 0.15], [1.6, 1.46, -1.44, 0.14], [1.62, 1.94, -1.44, 0.13], [0.79, 1.38, -1.48, 0.09], [1.22, 1.37, -1.46, 0.08], [0.77, 1.88, -1.48, 0.09], [1.15, 1.88, -1.48, 0.09], [1.45, 1.96, -1.46, 0.1], [0.28, 0.73, -0.46, 0.015]];
    (S.occ || []).forEach((o) => occ.push(o));
    occ.slice(0, NOCC).forEach((o, i) => U.uOcc.value[i].set(o[0], o[1], o[2], o[3]));
    U.uMoonK.value = S.moon === false ? 0 : (S.key ?? 1);
    // the flame, its glow and the light on the characters
    const flame = flameMesh(P.whole, FLAME[1]), glow = glowMesh(P.whole, FLAME[1] + 0.02); flame.position.x = glow.position.x = FLAME[0]; flame.position.z = glow.position.z = FLAME[2];
    const light = new THREE.PointLight("#ffc66a", 0, 4.2, 1.5); light.position.set(FLAME[0] - 0.02, FLAME[1] + 0.06, FLAME[2] + 0.08); P.whole.add(light);
    const moth = S.moth === false ? null : mothMesh(); if (moth) P.whole.add(moth);
    // everything here is scenery
    P.whole.traverse((o) => { if (o.isMesh && !o.userData.steam) { o.userData.lookOnly = true; o.userData.surfaceOnly = true; } });
    let maskDone = false;
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, lamp = clamp(num(ps, S, "lamp", S.light ?? 1)), fs = num(ps, S, "flame", 1);
        const fl = 1 + fs * (0.045 * Math.sin(tt * 7.3) + 0.035 * Math.sin(tt * 12.1 + 1) + 0.03 * Math.sin(tt * 3.3 + 2) + 0.07 * (vn(tt * 9, 0, 1) - 0.5));
        P.root.updateMatrixWorld(true); U.uInv.value.copy(P.root.matrixWorld).invert();
        U.uLamp.value = lamp * fl; U.uTime.value = tt;
        U.uLampP.value.set(FLAME[0] + 0.012 * fs * Math.sin(tt * 5.1) + 0.006 * Math.sin(tt * 13), FLAME[1] + 0.03 + 0.006 * fs * Math.sin(tt * 9), FLAME[2] + 0.012 * fs * Math.cos(tt * 4.3));
        const u = flame.material.uniforms; u.uTime.value = tt; u.uH.value = 0.05 * fl * lamp; u.uW.value = 0.0105 * lamp; u.uA.value = lamp; u.uBend.value = 0.25 * fs * Math.sin(tt * 2.3); flame.visible = lamp > 0.01;
        const g = glow.material.uniforms; g.uR.value = 0.1; g.uA.value = 0.5 * lamp * fl; glow.visible = lamp > 0.01;
        light.intensity = 4.2 * lamp * fl;
        if (moth) {
          const a = tt * 2.3 + 1.5 * Math.sin(tt * 0.7), r = 0.1 + 0.035 * Math.sin(tt * 1.9), b = 0.5 * Math.sin(tt * 1.3 + 1);
          moth.position.set(FLAME[0] - 0.03 + Math.cos(a) * r, FLAME[1] + 0.02 + 0.05 * Math.sin(tt * 3.1) + 0.02 * b, FLAME[2] + Math.sin(a) * r * 0.8);
          moth.rotation.set(0.6 * Math.sin(tt * 2.2), -a + Math.PI / 2, 0.4 * Math.sin(tt * 3.7)); moth.scale.y = 0.4 + 0.9 * Math.abs(Math.sin(tt * 29)) ; moth.visible = lamp > 0.05;
        }
        if (outside) outside.apply(tt);
        if (!maskDone) { let sc = P.root; while (sc.parent) sc = sc.parent; const mk = sc.getObjectByName ? sc.getObjectByName("set-floor-mask") : null; if (mk) { const w = P.root.getWorldPosition(new THREE.Vector3()); if (Math.hypot(w.x, w.z) < 200) mk.visible = false; maskDone = true; } }   // the plain set's depth mask would hide the town below y 0
      },
    };
  },

  klismos(P) {
    const S = P.spec, Sk = new Soup(), oak = S.color ?? "#8a5a34", c = rgb(oak), wood = new THREE.MeshStandardMaterial({ map: woodTex(930, 512, 256, "#8a5a34", { knots: 2, scratches: 20 }), vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
    const col = [c[0] / 0.25, c[1] / 0.25, c[2] / 0.25].map((v) => clamp(v, 0.7, 1.15));
    const legs = [[[-0.19, 0.36, 0.17], [-0.215, 0.2, 0.24], [-0.255, 0.0, 0.33]], [[0.19, 0.36, 0.17], [0.215, 0.2, 0.24], [0.255, 0.0, 0.33]]];
    for (const l of legs) tube(Sk, l, 0.021, 0.013, 8, col, { seg: 8, tw: 0.4 });
    for (const sg of [-1, 1]) tube(Sk, [[sg * 0.24, 0.0, -0.36], [sg * 0.205, 0.2, -0.27], [sg * 0.19, 0.4, -0.2], [sg * 0.19, 0.65, -0.24], [sg * 0.2, 0.9, -0.31]], 0.014, 0.019, 8, col, { seg: 14, tw: 0.4 });
    const bx = (x0, y0, z0, x1, y1, z1, cc) => { const q = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], r = [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]; const uv = [[0, 0], [1, 0], [1, 0.3], [0, 0.3]]; Sk.quad(...q, uv, cc); Sk.quad(...r, uv, cc); Sk.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], uv, cc); Sk.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], uv, cc); Sk.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], uv, cc); Sk.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], uv, cc); };
    bx(-0.23, 0.345, -0.22, 0.23, 0.385, 0.22, col);   // seat board
    const pad = rgb(S.pad ?? "#cfc3a4"), pc = mul3(pad, 1.0 / 0.6); bx(-0.21, 0.385, -0.2, 0.21, SEAT_Y, 0.2, pc.map((v) => clamp(v, 0, 1.2)));
    // the curved back rail: a concave board from upright to upright, and a thin lower rail
    const rail = (y0, y1, sag) => { const N = 12, cs = (x) => -0.255 - sag * (1 - (x / 0.2) * (x / 0.2)); for (let i = 0; i < N; i++) { const xa = -0.2 + 0.4 * i / N, xb = -0.2 + 0.4 * (i + 1) / N, za = cs(xa), zb = cs(xb); Sk.quad([xa, y0, za], [xb, y0, zb], [xb, y1, zb], [xa, y1, za], [[i / N, 0], [(i + 1) / N, 0], [(i + 1) / N, 0.5], [i / N, 0.5]], col); Sk.quad([xa, y0, za - 0.022], [xb, y0, zb - 0.022], [xb, y1, zb - 0.022], [xa, y1, za - 0.022], [[i / N, 0], [(i + 1) / N, 0], [(i + 1) / N, 0.5], [i / N, 0.5]], mul3(col, 0.8)); Sk.quad([xa, y1, za], [xb, y1, zb], [xb, y1, zb - 0.022], [xa, y1, za - 0.022], [[0, 0], [1, 0], [1, 1], [0, 1]], mul3(col, 1.1)); } };
    rail(0.7, 0.86, 0.045); rail(0.52, 0.575, 0.03);
    const me = new THREE.Mesh(Sk.geo(), wood); me.castShadow = true; me.receiveShadow = true; P.whole.add(me);
    return { grip: SEAT_Y };
  },
};

// ================================================================================================================ outside: Athens at night in real 3D layers
// coordinates are the room's own: the window at z -1.6, the camera looks toward -z. dz = -z. Light is baked: cool sky ambient, moonlight from upper right, haze toward the horizon blue.
const NL = { amb: [0.2, 0.28, 0.58], moon: [0.5, 0.56, 0.74], dir: (() => { const v = [0.5, 0.72, 0.48], l = Math.hypot(...v); return v.map((q) => q / l); })(), hz: rgb("#182c60"), D: 3200 };
const litc = (alb, n, d, k = 1) => {
  const m = Math.max(0, n[0] * NL.dir[0] + n[1] * NL.dir[1] + n[2] * NL.dir[2]), h = 0.62 + 0.38 * (0.5 + 0.5 * n[1]);
  const c = [alb[0] * (NL.amb[0] * h + NL.moon[0] * m) * k, alb[1] * (NL.amb[1] * h + NL.moon[1] * m) * k, alb[2] * (NL.amb[2] * h + NL.moon[2] * m) * k];
  return mix3(c, NL.hz, (1 - Math.exp(-d / NL.D)) * 0.88);
};
const hazeOnly = (c, d, f = 0.88) => mix3(c, NL.hz, (1 - Math.exp(-d / NL.D)) * f);
const nrm = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l; const mx = (a[0] + b[0] + c[0]) / 3, my = (a[1] + b[1] + c[1]) / 3 - 1.4, mz = (a[2] + b[2] + c[2]) / 3; if (x * -mx + y * -my + z * -mz < 0) { x = -x; y = -y; z = -z; } return [x, y, z]; };
// a lit quad / triangle (normal facing the viewer, baked) into soup S; alb linear; d the distance for haze
const lq = (S, a, b, c, d, alb, dist, k = 1) => { const n = nrm(a, b, c), col = litc(alb, n, dist, k); S.quad(a, b, c, d, [[0, 0], [1, 0], [1, 1], [0, 1]], col); };
const lt = (S, a, b, c, alb, dist, k = 1) => { const n = nrm(a, b, c), col = litc(alb, n, dist, k); S.tri(a, b, c, [0, 0], [1, 0], [0, 1], col, col, col); };
// ground height (m) at x, dz: the lane's step down, the town on its slope, the plain, the Acropolis rock (plateau 95 m, cliffs round it)
const ROCK = { x: 40, z: 560, rx: 190, rz: 130, h: 95 };
const hBase = (dz) => (dz <= 1.4 ? 0.4 : dz < 40 ? 0.4 - 0.35 * (dz - 1.4) : dz < 200 ? -13.1 - 0.05 * (dz - 40) : dz < 520 ? -21.1 - 0.02 * (dz - 200) : -27.5);
const rockR = (x, dz) => Math.hypot((x - ROCK.x) / ROCK.rx, (dz - ROCK.z) / ROCK.rz);
const H = (x, dz) => {
  const n = (fbm(x / 45, dz / 45, 3) - 0.5) * Math.min(7, dz * 0.06), r = rockR(x, dz) + 0.06 * (fbm(x / 60, dz / 60, 8) - 0.5);
  const p = 1 - sstep(0.6, 0.93, r), rock = ROCK.h * Math.pow(p, 0.85) + (p > 0.02 ? 22 * (fbm(x / 13, dz / 13, 5) - 0.5) * sstep(0.02, 0.3, p) * (1 - sstep(0.85, 1, p)) * (1 - sstep(0.95, 1, p)) : 0) + 14 * (1 - sstep(0.0, 1.0, r * 0.62 + 0.4)) * 0;
  return hBase(dz) + n * (1 - p) + rock;
};
const hnormal = (x, dz, e = 3) => { const gx = (H(x + e, dz) - H(x - e, dz)) / (2 * e), gz = (H(x, dz + e) - H(x, dz - e)) / (2 * e), l = Math.hypot(gx, 1, gz); return [-gx / l, 1 / l, gz / l]; };   // z = -dz: d/dz = -d/d(dz)

function buildOutside(P, S) {
  const O = new Soup(), WN = new Soup(), HALO = new Soup(), seed = S.seed ?? 1, R = rng(900 + seed);
  const grp = new THREE.Group(); grp.userData.lookOnly = true; P.whole.add(grp);
  const matO = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false }); matO.userData.noOutline = true;
  const addMesh = (soup, mat, order = 0) => { if (soup.empty) return null; const m = new THREE.Mesh(soup.geo(), mat); m.frustumCulled = false; m.renderOrder = order; m.userData.lookOnly = true; m.userData.surfaceOnly = true; grp.add(m); return m; };
  const WIN_ON = rgb("#ffb04a"), WIN_OFF = rgb("#0c1534");
  const skyCol = (el) => mix3(mix3(rgb("#2c4a8c"), rgb("#14286a"), sstep(-6, 14, el)), rgb("#070f33"), sstep(10, 70, el));
  // ---------------------------------------------------------------- sky dome (gradient), moon, stars, clouds
  { const SK = new Soup(), N = 40, M = 24, RAD = 8900;
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
      const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU, e0 = -12 + (j / M) * 102, e1 = -12 + ((j + 1) / M) * 102;
      const P3 = (a, e) => [Math.sin(a) * Math.cos(e * DEG) * RAD, Math.sin(e * DEG) * RAD, -Math.cos(a) * Math.cos(e * DEG) * RAD];
      SK.quad(P3(a0, e0), P3(a1, e0), P3(a1, e1), P3(a0, e1), [[0, 0], [1, 0], [1, 1], [0, 1]], [skyCol(e0), skyCol(e0), skyCol(e1), skyCol(e1)]);
    }
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, fog: false }); m.userData.noOutline = true; addMesh(SK, m, -20); }
  { const ST = new Soup(), N = S.stars ?? 720;   // stars: tiny camera-facing quads on the dome, most near the zenith, a few bright
    for (let i = 0; i < N; i++) {
      const az = (hs(i, 1) - 0.5) * 2.6, el = 2 + 82 * Math.pow(hs(i, 2), 0.8), RAD = 8800, big = hs(i, 3) > 0.95, sz = RAD * (big ? 0.0011 : 0.00045 + 0.0004 * hs(i, 4)), b = (big ? 1 : 0.35 + 0.55 * hs(i, 5)) * (0.7 + 0.3 * sstep(2, 30, el)), c = mix3([0.75, 0.82, 1.0], [1, 0.95, 0.85], hs(i, 6));
      const cx = Math.sin(az) * Math.cos(el * DEG) * RAD, cy = Math.sin(el * DEG) * RAD, cz = -Math.cos(az) * Math.cos(el * DEG) * RAD, col = mul3(c, b);
      ST.quad([cx - sz, cy, cz], [cx, cy - sz, cz], [cx + sz, cy, cz], [cx, cy + sz, cz], [[0, 0], [1, 0], [1, 1], [0, 1]], col);
    }
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, fog: false }); m.userData.noOutline = true; addMesh(ST, m, -19); }
  const moonDir = (az, el) => [Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];
  if (S.moon !== false) {
    const md = moonDir(9, 13), RAD = 8700, mc = md.map((v) => v * RAD), mR = 240;
    const [cv, g] = canvas(512, 512), r = rng(93);
    { const rad = g.createRadialGradient(256, 256, 0, 256, 256, 256); rad.addColorStop(0, "#f7f2de"); rad.addColorStop(0.94, "#e6e0c8"); rad.addColorStop(1, "rgba(230,224,200,0)"); g.fillStyle = rad; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 34; i++) { const x = 256 + (r() - 0.5) * 360, y = 256 + (r() - 0.5) * 360, rr = 22 + r() * 60; if (Math.hypot(x - 256, y - 256) + rr > 244) continue; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(165,160,146,${0.12 + r() * 0.12})`); gr.addColorStop(1, "rgba(150,146,130,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 60; i++) { const x = 256 + (r() - 0.5) * 440, y = 256 + (r() - 0.5) * 440, rr = 3 + r() * 9; if (Math.hypot(x - 256, y - 256) + rr > 244) continue; g.strokeStyle = "rgba(120,116,102,0.2)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); g.strokeStyle = "rgba(255,252,240,0.5)"; g.beginPath(); g.arc(x + 1, y + 1, rr, 3.4, 5.4); g.stroke(); } }
    const tex = ctex(cv), mm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false }); mm.userData.noOutline = true;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(mR * 2, mR * 2), mm); q.position.set(...mc); q.renderOrder = -17; q.frustumCulled = false; q.userData.lookOnly = true; grp.add(q);
    const [cv2, g2] = canvas(256, 256); { const rad = g2.createRadialGradient(128, 128, 0, 128, 128, 128); rad.addColorStop(0, "rgba(190,205,255,0.5)"); rad.addColorStop(0.2, "rgba(120,150,230,0.25)"); rad.addColorStop(1, "rgba(60,90,180,0)"); g2.fillStyle = rad; g2.fillRect(0, 0, 256, 256); }
    const hm = new THREE.MeshBasicMaterial({ map: ctex(cv2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }); hm.userData.noOutline = true;
    const hq = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), hm); hq.position.set(mc[0], mc[1], mc[2] - 40); hq.renderOrder = -18; hq.frustumCulled = false; hq.userData.lookOnly = true; grp.add(hq);
  }
  // clouds: dark banks with a lit rim toward the moon, three on the left, one on the right, one high
  { const [cv, g] = canvas(1024, 256), r = rng(55);
    for (let i = 0; i < 70; i++) { const x = 100 + r() * 824, y = 150 + (r() - 0.5) * 60 - Math.abs(x - 512) * 0.1, rr = 30 + r() * 62; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(34,50,96,0.9)"); gr.addColorStop(0.7, "rgba(34,50,96,0.55)"); gr.addColorStop(1, "rgba(34,50,96,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 46; i++) { const x = 140 + r() * 760, y = 110 + (r() - 0.5) * 50 - Math.abs(x - 512) * 0.1, rr = 18 + r() * 34; const gr = g.createRadialGradient(x + 10, y - 10, 0, x + 10, y - 10, rr); gr.addColorStop(0, "rgba(120,146,210,0.5)"); gr.addColorStop(1, "rgba(120,146,210,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    const cm = new THREE.MeshBasicMaterial({ map: ctex(cv), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false }); cm.userData.noOutline = true;
    [[-17, 5.5, 3600, 6900], [-9, 8.5, 2400, 7200], [-26, 3.5, 3000, 7000], [22, 7, 2600, 7100], [4, 26, 3400, 7300]].forEach(([az, el, w, d], i) => { const p = moonDir(az, el), q = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), cm); q.position.set(p[0] * d, p[1] * d, p[2] * d); q.renderOrder = -16 + i * 0.01; q.frustumCulled = false; q.userData.lookOnly = true; grp.add(q); }); }
  // ---------------------------------------------------------------- far hills: three ridge cards (Hymettus, Pentelikon, Lycabettus), haze rising with distance
  [[3300, 330, "#162a54", 0.5, -1500], [5300, 520, "#12224a", 0.66, 900], [7700, 800, "#101e44", 0.82, -300]].forEach(([D, hh, hex, haze, off], j) => {
    const RG = new Soup(), N = 90, x0 = -D * 1.3, x1 = D * 1.3, base = rgb(hex);
    const prof = (x) => { const u = (x + off) / (D * 0.5); return (-60 + hh * (0.25 + 0.75 * Math.pow(fbm(u * 1.4, j * 4.7, 20 + j, 4), 1.2)) * (0.65 + 0.35 * Math.sin(u * 0.9 + j))) ; };
    for (let i = 0; i < N; i++) {
      const xa = lerp(x0, x1, i / N), xb = lerp(x0, x1, (i + 1) / N), ya = prof(xa), yb = prof(xb), zz = -D - j * 3, up = (y) => mix3(mul3(base, 0.7), mix3(base, rgb("#3a5088"), 0.5 * clamp(y / hh)), clamp(y / hh));
      const lo = hazeOnly(mul3(base, 0.8), D * 2, haze), ca = hazeOnly(up(ya), D * 2, haze), cb = hazeOnly(up(yb), D * 2, haze);
      RG.quad([xa, -60, zz], [xb, -60, zz], [xb, yb, zz], [xa, ya, zz], [[0, 0], [1, 0], [1, 1], [0, 1]], [lo, lo, cb, ca]);
      RG.quad([xa, ya, zz], [xb, yb, zz], [xb, yb, zz - 400], [xa, ya, zz - 400], [[0, 0], [1, 0], [1, 1], [0, 1]], [ca, cb, cb, ca]);
    }
    addMesh(RG, matO, -10 + j * 0.1); });
  // ---------------------------------------------------------------- terrain (three meshes: the town slope, the rock, the plain), vertex-shaded by slope and height
  const groundCol = (x, dz, y, n) => {
    const slope = 1 - n[1], rk = rockR(x, dz), grain = 0.8 + 0.35 * fbm(x / 9, dz / 9, 11);
    let c = mix3([0.2, 0.25, 0.17], [0.3, 0.3, 0.22], fbm(x / 70, dz / 70, 4));   // dry grass and earth
    if (dz < 80) c = mix3(c, [0.24, 0.3, 0.18], 0.3);
    if (rk < 1.12) { const band = 0.7 + 0.5 * hs(Math.floor(y / 3.2), 4) * (0.7 + 0.5 * fbm(x / 7, y / 2.5, 6)), rockC = mul3([0.3, 0.27, 0.26], band * (hs(Math.floor(y / 3.2), 8) < 0.3 ? 0.55 : 1) * (0.6 + 0.8 * Math.pow(fbm(x / 3, y / 20, 17), 2)) * grain * (0.7 + 0.55 * fbm(x / 5, y / 11, 13))), top = mul3([0.42, 0.42, 0.4], 0.9 + 0.2 * grain); const rm = sstep(0.18, 0.5, slope) * sstep(1.12, 0.6, rk); c = mix3(c, rockC, clamp(rm * 1.3)); c = mix3(c, top, (1 - sstep(0.55, 0.64, rk)) * 0.9); c = mul3(c, 1 + 0.9 * Math.exp(-Math.pow((rk - 0.62) / 0.025, 2))); c = mix3(c, [0.17, 0.27, 0.19], (0.5 * sstep(0.6, 0.78, rk) * (1 - sstep(0.18, 0.3, slope)))); }
    return mul3(c, grain);
  };
  const buildTerrain = (rowsDz, colsFn, ncol) => {
    const T = new Soup(), V = rowsDz.map((dz) => { const [xa, xb] = colsFn(dz); return Array.from({ length: ncol + 1 }, (_, i) => { const x = lerp(xa, xb, i / ncol), y = H(x, dz); return { x, dz, y, c: (() => { const nn = hnormal(x, dz, Math.max(2, dz * 0.01)); return litc(groundCol(x, dz, y, nn), nn, dz + 1.7); })() }; }); });
    for (let r = 0; r < V.length - 1; r++) for (let i = 0; i < ncol; i++) { const a = V[r][i], b = V[r][i + 1], c = V[r + 1][i + 1], d = V[r + 1][i], P3 = (v) => [v.x, v.y, -v.dz]; T.quad(P3(a), P3(b), P3(c), P3(d), [[0, 0], [1, 0], [1, 1], [0, 1]], [a.c, b.c, c.c, d.c]); }
    return T;
  };
  { const rows = [3.2, 5, 7.5, 11, 15, 20, 26, 33, 41, 50, 62, 76, 92, 110, 130, 155, 185, 220, 260, 300, 340, 380]; addMesh(buildTerrain(rows, (dz) => [-(1.1 * dz + 30), 1.1 * dz + 30], 44), matO, 0); }
  { const rows = []; for (let dz = 380; dz <= 750; dz += 7.5) rows.push(dz); addMesh(buildTerrain(rows, () => [-330, 410], 100), matO, 0); }
  { const rows = [750, 800, 870, 960, 1080, 1250, 1500, 1850, 2400, 3000]; addMesh(buildTerrain(rows, (dz) => [-1.3 * dz, 1.3 * dz], 36), matO, 0); }
  // ---------------------------------------------------------------- the near town: houses with tile roofs (each tile its own tone), plaster walls, windows, 3 warm ones
  const WALLS = [[0.88, 0.85, 0.76], [0.84, 0.8, 0.7], [0.9, 0.88, 0.82], [0.8, 0.74, 0.62], [0.86, 0.84, 0.8]];
  const house = (cx, cz, w, d, h, rotY, o = {}) => {   // cz = -dz of the centre; the base follows the ground
    const dz = -cz, cr = Math.cos(rotY), sr = Math.sin(rotY), loc = (lx, lz) => [cx + lx * cr + lz * sr, cz - lx * sr + lz * cr];
    const yb = Math.min(H(...loc(-w / 2, -d / 2).map((v, i) => (i ? -v : v))), H(...loc(w / 2, -d / 2).map((v, i) => (i ? -v : v))), H(...loc(-w / 2, d / 2).map((v, i) => (i ? -v : v))), H(...loc(w / 2, d / 2).map((v, i) => (i ? -v : v)))) - 0.25;
    const idx = o.i ?? 0, wall = mul3(WALLS[(hs(idx, 3) * WALLS.length) | 0], 0.9 + 0.12 * hs(idx, 4)), P3 = (lx, y, lz) => { const [x, z] = loc(lx, lz); return [x, y, z]; };
    const y0 = yb - 3, y1 = yb + h, pitch = 0.3 + 0.12 * hs(idx, 5), hip = hs(idx, 6) < 0.35, rh = (hip ? Math.min(w, d) : d) / 2 * pitch * 1.4, ov = 0.45;
    for (const [a, b, c, e] of [[[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]].flatMap((q) => q.map((p, i) => [p, q[(i + 1) % 4]]).map(([p, q2]) => [p, q2, 0, 0]))) lq(O, P3(a[0], y0, a[1]), P3(b[0], y0, b[1]), P3(b[0], y1, b[1]), P3(a[0], y1, a[1]), wall, dz, 0.86 + 0.14 * hs(idx, 8));
    // roof: gable along local x (ridge) or hip; tile grid with its own tone per tile
    const rr = (nrow, ncol, p0, p1, p2, p3) => {   // a slope from p0..p1 (eave) to p3..p2 (ridge); quads in rows
      for (let r = 0; r < nrow; r++) for (let q = 0; q < ncol; q++) {
        const f = (u, v) => [lerp(lerp(p0[0], p1[0], u), lerp(p3[0], p2[0], u), v), lerp(lerp(p0[1], p1[1], u), lerp(p3[1], p2[1], u), v), lerp(lerp(p0[2], p1[2], u), lerp(p3[2], p2[2], u), v)];
        const tone = 0.6 + 0.3 * hs(idx * 31 + r * 7 + q * 13, 9) + (r % 2 ? -0.05 : 0.04), alb = mul3(mix3([0.74, 0.34, 0.22], [0.6, 0.28, 0.2], hs(idx, 10)), tone);
        { const A = f(q / ncol, r / nrow), B = f((q + 1) / ncol, r / nrow), C = f((q + 1) / ncol, (r + 1) / nrow), D5 = f(q / ncol, (r + 1) / nrow), n = nrm(A, B, C), c = litc(alb, n, dz), lo = mul3(c, 0.62), hi = mul3(c, 1.12); O.quad(A, B, C, D5, [[0, 0], [1, 0], [1, 1], [0, 1]], [lo, lo, hi, hi]); if (near && q % 2 === 0) O.quad(f((q + 0.9) / ncol, r / nrow), f((q + 1.05) / ncol, r / nrow), f((q + 1.05) / ncol, (r + 1) / nrow), f((q + 0.9) / ncol, (r + 1) / nrow), [[0, 0], [1, 0], [1, 1], [0, 1]], mul3(c, 0.5)); }
      }
    };
    const near = dz < 90, nr = near ? Math.max(3, Math.round(Math.hypot(d / 2 + ov, rh) / 0.34)) : dz < 220 ? 3 : 1, nc = near ? Math.max(3, Math.round((w + 2 * ov) / 0.4)) : dz < 220 ? 5 : 1;
    if (!hip) {
      const rf = (zs, zr) => rr(nr, nc, P3(-w / 2 - ov, y1 - 0.2, zs), P3(w / 2 + ov, y1 - 0.2, zs), P3(w / 2 + ov, y1 + rh, zr), P3(-w / 2 - ov, y1 + rh, zr));
      rf(-d / 2 - ov, 0); rf(d / 2 + ov, 0);
      lq(O, P3(-w / 2 - ov, y1 + rh, -0.15), P3(w / 2 + ov, y1 + rh, -0.15), P3(w / 2 + ov, y1 + rh + 0.22, 0), P3(-w / 2 - ov, y1 + rh + 0.22, 0), [0.8, 0.42, 0.3], dz, 1.2);
      lt(O, P3(-w / 2, y1, -d / 2), P3(-w / 2, y1, d / 2), P3(-w / 2, y1 + rh, 0), wall, dz); lt(O, P3(w / 2, y1, -d / 2), P3(w / 2, y1, d / 2), P3(w / 2, y1 + rh, 0), wall, dz);
    } else {
      const rx = w / 2 - Math.min(w, d) * 0.3;
      const f4 = (zs, a0, a1, rz, b0, b1) => rr(nr, nc, P3(a0, y1 - 0.2, zs), P3(a1, y1 - 0.2, zs), P3(b1, y1 + rh, rz), P3(b0, y1 + rh, rz));
      f4(-d / 2 - ov, -w / 2 - ov, w / 2 + ov, -0.0, -rx, rx); f4(d / 2 + ov, -w / 2 - ov, w / 2 + ov, 0.0, -rx, rx);
      rr(Math.max(2, nr - 1), 3, P3(-w / 2 - ov, y1 - 0.2, -d / 2 - ov), P3(-w / 2 - ov, y1 - 0.2, d / 2 + ov), P3(-rx, y1 + rh, 0), P3(-rx, y1 + rh, 0)); rr(Math.max(2, nr - 1), 3, P3(w / 2 + ov, y1 - 0.2, -d / 2 - ov), P3(w / 2 + ov, y1 - 0.2, d / 2 + ov), P3(rx, y1 + rh, 0), P3(rx, y1 + rh, 0));
    }
    // windows on the face toward the viewer (local z = +d/2): dark, or warm; a door at the foot
    const nw = Math.max(1, Math.round(w / 3.4)), lit = o.lit ?? (hs(idx, 12) < 0.07);
    for (let k = 0; k < nw; k++) {
      const lx = -w / 2 + (w * (k + 0.5)) / nw, wy = yb + 0.25 + h * 0.5, ww = (o.litSet ? 0.8 : 0.55) + 0.1 * hs(idx * 5 + k, 13), wh = o.litSet ? 1.4 : 1.0, on = o.litSet ? o.litSet.includes(k) : lit && k === 0;
      const A = P3(lx - ww, wy, d / 2 + 0.05), B = P3(lx + ww, wy, d / 2 + 0.05), C = P3(lx + ww, wy + wh, d / 2 + 0.05), D4 = P3(lx - ww, wy + wh, d / 2 + 0.05);
      if (on) { WN.quad(A, B, C, D4, [[0, 0], [1, 0], [1, 1], [0, 1]], hazeOnly(mul3(WIN_ON, 1.15), dz, 0.3)); const c = P3(lx, wy + wh / 2, d / 2 + 0.2), s = Math.max(3.2, dz * 0.05); HALO.quad([c[0] - s, c[1] - s, c[2]], [c[0] + s, c[1] - s, c[2]], [c[0] + s, c[1] + s, c[2]], [c[0] - s, c[1] + s, c[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]); }
      else if (near) lq(O, A, B, C, D4, WIN_OFF, dz, 1);
    }
    if (near) { const lx = -w / 2 + w * (0.25 + 0.5 * hs(idx, 14)); lq(O, P3(lx - 0.5, yb + 0.1, d / 2 + 0.06), P3(lx + 0.5, yb + 0.1, d / 2 + 0.06), P3(lx + 0.5, yb + 2.1, d / 2 + 0.06), P3(lx - 0.5, yb + 2.1, d / 2 + 0.06), [0.2, 0.12, 0.08], dz); }
  };
  const hero = [[-11, -50, 12, 9, 6.5, 0.08, [0, 1, 2]], [5, -62, 12, 9, 6, -0.12, [0, 1]], [-26, -76, 12, 9, 6, 0.15, [1, 0]]];
  hero.forEach(([x, z, w, d, h, ry, ls], i) => house(x, z, w, d, h, ry, { i: 900 + i, litSet: ls }));
  { let idx = 0;   // the rest of the town: rows climbing away, each row a little coarser
    for (let dz = 30; dz < 560; dz += dz < 90 ? 11 + dz * 0.12 : 12 + dz * 0.05) {
      const step = 11 + dz * 0.09, X = 1.15 * dz + 40;
      for (let x = -X; x < X; x += step) {
        idx++; const xx = x + (hs(idx, 1) - 0.5) * step * 0.7, zz = dz + (hs(idx, 2) - 0.5) * 6;
        if (hs(idx, 20) < (dz < 100 ? 0.32 : 0.16) || (dz > 380 && rockR(xx, zz) < 1.12) || hero.some(([hx, hz]) => Math.hypot(xx - hx, -zz - hz) < 15)) continue;
        const w = 6 + 5 * hs(idx, 21), d = 6 + 4 * hs(idx, 22);
        house(xx, -zz, w * (dz > 150 ? 1.5 : 1), d * (dz > 150 ? 1.4 : 1), 4 + 3 * hs(idx, 23), (hs(idx, 24) - 0.5) * 0.6, { i: idx });
      }
    } }
  // far Athens: thousands of little lights on the plain and cheap white boxes with dark roofs
  { let idx = 4000; for (let k = 0; k < 520; k++) { const dz = 620 + 2000 * Math.pow(hs(k, 31), 1.6), x = (hs(k, 32) - 0.5) * 2.2 * dz, y = H(x, dz); if (rockR(x, dz) < 1.15) continue;
      const w = 12 + 8 * hs(k, 33), hh = 5 + 4 * hs(k, 34), c = hazeOnly(mul3(WALLS[k % 5], 0.8), dz, 0.8), rc = hazeOnly([0.38, 0.19, 0.13], dz, 0.85);
      O.quad([x - w, y, -dz], [x + w, y, -dz], [x + w, y + hh, -dz], [x - w, y + hh, -dz], [[0, 0], [1, 0], [1, 1], [0, 1]], mul3(c, 0.7)); O.tri([x - w * 1.1, y + hh, -dz], [x + w * 1.1, y + hh, -dz], [x, y + hh + w * 0.35, -dz], [0, 0], [1, 0], [0, 1], rc, rc, rc);
      if (hs(k, 35) < 0.3) { const s = Math.max(2, dz * 0.0016), wc = hazeOnly(mul3(WIN_ON, 1.0), dz, 0.35); WN.quad([x - s, y + hh * 0.4, -dz + 0.4], [x + s, y + hh * 0.4, -dz + 0.4], [x + s, y + hh * 0.4 + s * 1.4, -dz + 0.4], [x - s, y + hh * 0.4 + s * 1.4, -dz + 0.4], [[0, 0], [1, 0], [1, 1], [0, 1]], wc); } } }
  // ---------------------------------------------------------------- trees: cypresses (tall spindles), olive and pine blobs
  const cypress = (x, dz, hgt, i) => { const y = H(x, dz) - 0.4, r = hgt * 0.1, N = 7, steps = 5, col = [0.07, 0.17, 0.11].map((v) => v * (0.8 + 0.4 * hs(i, 2)));
    for (let s = 0; s < steps; s++) { const t0 = s / steps, t1 = (s + 1) / steps, rad = (t) => r * Math.sin(Math.PI * Math.pow(t, 0.6) * 0.98) * (1 - 0.2 * t), r0 = rad(t0 + 0.02), r1 = rad(t1);
      for (let k = 0; k < N; k++) { const a0 = (k / N) * TAU, a1 = ((k + 1) / N) * TAU, p = (a, r, t) => [x + Math.sin(a) * r, y + t * hgt, -dz + Math.cos(a) * r]; lq(O, p(a0, r0, t0), p(a1, r0, t0), p(a1, r1, t1), p(a0, r1, t1), col, dz, 0.9 + 0.3 * hs(i + k, 3)); } } };
  const blob = (x, y, z, rx, ry, rz, base, dz, i, n = 6) => { const m = n, P3 = (a, e) => [x + Math.cos(e) * Math.sin(a) * rx * (0.8 + 0.35 * hs(i + a * 7 + e * 3, 5)), y + Math.sin(e) * ry, z + Math.cos(e) * Math.cos(a) * rz * (0.8 + 0.35 * hs(i + a * 5 + e * 9, 6))];
    for (let k = 0; k < m; k++) for (let j = 0; j < 4; j++) { const a0 = (k / m) * TAU, a1 = ((k + 1) / m) * TAU, e0 = -0.2 + j * 0.42, e1 = e0 + 0.42, g = mul3(base, 0.8 + 0.5 * hs(i * 7 + k * 3 + j, 7)); lq(O, P3(a0, e0), P3(a1, e0), P3(a1, e1), P3(a0, e1), g, dz); } };
  for (let i = 0; i < 300; i++) { const dz = 26 + 300 * Math.pow(hs(i, 41), 1.8), x = (hs(i, 42) - 0.5) * 2.0 * (dz + 40), rk = rockR(x, dz); if (rk < 0.58) continue; const hg = (6 + 10 * hs(i, 43) * (1 + dz / 400)) * (dz < 110 ? 0.42 : 1); if (hs(i, 44) < 0.6) cypress(x, dz, hg, i); else if (dz > 45) { const y = H(x, dz); blob(x, y + 1.6 + 0.2 * hg * 0.3, -dz, 2.8 + 2.4 * hs(i, 45), 1.8 + 1.2 * hs(i, 46), 2.8 + 2.2 * hs(i, 47), [0.09, 0.18, 0.15], dz, i); } }
  for (let i = 0; i < 160; i++) { const dz = 10 + 40 * hs(i, 61), x = (hs(i, 62) - 0.5) * 120; if (Math.abs(x + 0.7) < 6 && dz < 20) continue; blob(x, H(x, dz) + 0.6, -dz, 0.8 + 0.8 * hs(i, 63), 0.6 + 0.4 * hs(i, 64), 0.8 + 0.8 * hs(i, 65), [0.1, 0.2, 0.17], dz, 500 + i, 5); }   // olive shrubs on the near slope
  for (let i = 0; i < 190; i++) { const ang = hs(i, 71) * TAU, rr = (0.66 + 0.34 * hs(i, 72)), x = ROCK.x + Math.cos(ang) * ROCK.rx * rr, dz = ROCK.z + Math.sin(ang) * ROCK.rz * rr; if (dz > ROCK.z + 30) continue; if (hs(i, 73) < 0.5) cypress(x, dz, 14 + 8 * hs(i, 74), 800 + i); else blob(x, H(x, dz) + 1.5, -dz, 4.5, 2.4, 4.5, [0.07, 0.15, 0.12], dz, 900 + i, 6); }
  // ---------------------------------------------------------------- the Acropolis: wall round the top, the Parthenon (8 x 17 columns, 69.5 x 31 m) and the small temple
  const topY = H(ROCK.x, ROCK.z), MARB = [1.1, 1.14, 1.2];
  { const rimN = 56, ptsR = []; for (let k = 0; k < rimN; k++) { const a = (k / rimN) * TAU, x = ROCK.x + Math.cos(a) * ROCK.rx * 0.62, dz = ROCK.z + Math.sin(a) * ROCK.rz * 0.62; ptsR.push([x, dz]); }
    for (let k = 0; k < rimN; k++) { const [x0, d0] = ptsR[k], [x1, d1] = ptsR[(k + 1) % rimN], b0 = H(x0, d0) - 8, b1 = H(x1, d1) - 8, top0 = H(x0, d0) + 6, top1 = H(x1, d1) + 6, wc = mul3([0.62, 0.58, 0.52], 0.95 + 0.15 * hs(k, 5)); lq(O, [x0, b0, -d0], [x1, b1, -d1], [x1, top1, -d1], [x0, top0, -d0], wc, (d0 + d1) / 2); lq(O, [x0, top0, -d0], [x1, top1, -d1], [x1, top1, -d1 - 2.5], [x0, top0, -d0 - 2.5], mul3(wc, 1.1), (d0 + d1) / 2); } }
  const temple = (cx, dzc, ry, L, Wd, ncolS, ncolF, colH, sc) => {
    const dist = dzc * 0.3, M = new THREE.Matrix4().makeTranslation(cx, H(cx, dzc) + 0.2, -dzc).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeScale(sc, sc, sc)); O.setXf(M);
    const hz = (c, k = 1) => mul3(c, k), steps = [[0, 0.5], [0.5, 1.0], [1.0, 1.6]];
    steps.forEach(([ya, yb], i) => { const inset = i * 0.7, x0 = -Wd / 2 + inset, x1 = Wd / 2 - inset, z0 = -L / 2 + inset, z1 = L / 2 - inset, c = hz(MARB, 0.95 - i * 0.04); lq(O, [x0, ya, z1], [x1, ya, z1], [x1, yb, z1], [x0, yb, z1], c, dist); lq(O, [x1, ya, z1], [x1, ya, z0], [x1, yb, z0], [x1, yb, z1], c, dist); lq(O, [x0, ya, z0], [x0, ya, z1], [x0, yb, z1], [x0, yb, z0], c, dist); lq(O, [x0, yb, z1], [x1, yb, z1], [x1, yb, z0], [x0, yb, z0], hz(MARB, 1.0), dist); });
    const y0 = 1.6, y1 = y0 + colH, cr = colH * 0.092, inW = Wd / 2 - 1.7, inL = L / 2 - 1.7, cols = [];
    for (let i = 0; i < ncolF; i++) { const x = -inW + (2 * inW * i) / (ncolF - 1); cols.push([x, inL], [x, -inL]); }
    for (let i = 1; i < ncolS - 1; i++) { const z = -inL + (2 * inL * i) / (ncolS - 1); cols.push([inW, z], [-inW, z]); }
    cols.forEach(([x, z], ci) => { const N = 6; for (let k = 0; k < N; k++) { const a0 = (k / N) * TAU, a1 = ((k + 1) / N) * TAU, p = (a, r, y) => [x + Math.sin(a) * r, y, z + Math.cos(a) * r]; lq(O, p(a0, cr, y0), p(a1, cr, y0), p(a1, cr * 0.82, y1), p(a0, cr * 0.82, y1), MARB, dist, 0.9 + 0.2 * hs(ci + k, 9)); } lq(O, [x - cr * 1.4, y1, z + cr * 1.4], [x + cr * 1.4, y1, z + cr * 1.4], [x + cr * 1.4, y1 + 0.55, z + cr * 1.4], [x - cr * 1.4, y1 + 0.55, z + cr * 1.4], MARB, dist); });
    const ex = Wd / 2 - 0.6, ez = L / 2 - 0.6, ya = y1 + 0.55, yb2 = ya + colH * 0.3;   // entablature, a ring of four bands
    const band = (x0, z0, x1, z1) => lq(O, [x0, ya, z0], [x1, ya, z1], [x1, yb2, z1], [x0, yb2, z0], hz(MARB, 0.88), dist);
    band(-ex, ez, ex, ez); band(ex, ez, ex, -ez); band(ex, -ez, -ex, -ez); band(-ex, -ez, -ex, ez);
    lq(O, [-ex, yb2, ez], [ex, yb2, ez], [ex, yb2, -ez], [-ex, yb2, -ez], hz(MARB, 0.8), dist);
    const rise = Wd * 0.11; lt(O, [-ex - 0.4, yb2, ez + 0.4], [ex + 0.4, yb2, ez + 0.4], [0, yb2 + rise, ez + 0.4], hz(MARB, 0.96), dist); lt(O, [-ex - 0.4, yb2, -ez - 0.4], [ex + 0.4, yb2, -ez - 0.4], [0, yb2 + rise, -ez - 0.4], hz(MARB, 0.8), dist);
    lt(O, [-ex + 1.6, yb2, ez + 0.1], [ex - 1.6, yb2, ez + 0.1], [0, yb2 + rise * 0.75, ez + 0.1], [0.5, 0.56, 0.66], dist);   // the shadowed tympanum
    lq(O, [-ex - 0.4, yb2, ez + 0.4], [ex + 0.4, yb2, ez + 0.4], [ex + 0.4, yb2 + 0.0, -ez - 0.4], [-ex - 0.4, yb2, -ez - 0.4], hz(MARB, 0.8), dist);
    for (const sg of [-1, 1]) lq(O, [sg * (ex + 0.4), yb2, ez + 0.4], [0, yb2 + rise, ez + 0.4], [0, yb2 + rise, -ez - 0.4], [sg * (ex + 0.4), yb2, -ez - 0.4], hz(MARB, sg < 0 ? 0.78 : 1.02), dist);   // the roof's two slopes
    const cw = inW - 3.2, cl = inL - 3.0; for (const [x0, z0, x1, z1] of [[-cw, cl, cw, cl], [cw, cl, cw, -cl], [cw, -cl, -cw, -cl], [-cw, -cl, -cw, cl]]) lq(O, [x0, y0, z0], [x1, y0, z1], [x1, ya, z1], [x0, ya, z0], [0.62, 0.66, 0.72], dist);   // the cella wall behind the colonnade
    O.setXf(null);
  };
  temple(ROCK.x + 6, ROCK.z + 6, 0.42, 69.5, 31, 17, 8, 10.4, 1.7);
  temple(ROCK.x - 62, ROCK.z - 18, 0.3, 24, 12, 6, 4, 6.2, 1.6);
  // ---------------------------------------------------------------- the lane's own bush and the olive branch (a swaying group)
  const branch = new THREE.Group(); { const BR = new Soup(), root = [-1.95, 2.3, -2.0]; branch.position.set(...root);
    const main = [[0, 0, 0], [0.42, -0.1, -0.05], [0.8, -0.3, -0.1], [1.12, -0.52, -0.1], [1.4, -0.8, -0.05]], bc = [0.16, 0.12, 0.1];
    tube(BR, main, 0.016, 0.004, 6, bc, { seg: 12 });
    const cv = new THREE.CatmullRomCurve3(main.map((p) => new THREE.Vector3(...p))), leaf = (p, dir, i) => { const L = 0.075 + 0.02 * hs(i, 3), Wd = 0.0135, up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(dir, up).normalize(), nrm2 = new THREE.Vector3().crossVectors(side, dir).normalize(), tip = p.clone().addScaledVector(dir, L).addScaledVector(nrm2, -0.01 * hs(i, 4)), mid = p.clone().addScaledVector(dir, L * 0.45);
      const silver = hs(i, 5) < 0.4, c1 = silver ? [0.4, 0.5, 0.52] : [0.2, 0.36, 0.26], c2 = silver ? [0.52, 0.62, 0.62] : [0.28, 0.46, 0.34]; const l = mid.clone().addScaledVector(side, Wd), r = mid.clone().addScaledVector(side, -Wd), m2 = mid.clone().addScaledVector(nrm2, 0.003);
      BR.tri(p.toArray(), l.toArray(), tip.toArray(), [0, 0], [1, 0], [0, 1], c1, c2, c2); BR.tri(p.toArray(), tip.toArray(), r.toArray(), [0, 0], [1, 0], [0, 1], c1, c2, mul3(c2, 0.8)); };
    const twig = (p0, dir, len, i) => { const pts = [p0.toArray(), p0.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3(0, -0.02, 0)).toArray(), p0.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, -0.05, 0)).toArray()]; tube(BR, pts, 0.005, 0.002, 5, bc, { seg: 4 });
      const nl = 7; for (let k = 0; k < nl; k++) { const t = 0.25 + (0.75 * k) / nl, p = new THREE.Vector3().copy(p0).addScaledVector(dir, len * t).add(new THREE.Vector3(0, -0.05 * t * t, 0)); for (const s of [-1, 1]) { const a = s * (0.8 + 0.4 * hs(i * 9 + k, 11)), d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a).add(new THREE.Vector3(0, (hs(i * 9 + k, 12) - 0.7) * 0.5, 0)).normalize(); leaf(p, d, i * 40 + k * 2 + (s > 0 ? 1 : 0)); } } leaf(p0.clone().addScaledVector(dir, len), dir.clone(), i * 40 + 39); };
    for (let k = 0; k < 7; k++) { const t = 0.12 + 0.13 * k, p = cv.getPoint(Math.min(0.98, t)); for (const s of [-1, 1]) { const d = new THREE.Vector3(0.45, (s > 0 ? 0.5 : -0.7) * (0.5 + hs(k, 21)), s * 0.45 * (0.5 + hs(k, 22))).normalize(); twig(p, d, 0.22 + 0.14 * hs(k * 2 + (s > 0), 23), k * 2 + (s > 0 ? 1 : 0)); } }
    for (let k = 0; k < 24; k++) { const p = cv.getPoint(0.1 + 0.88 * (k / 24)), d = new THREE.Vector3(1, (hs(k, 24) - 0.5), (hs(k, 25) - 0.5) * 1.4).normalize(); leaf(p, d, 300 + k); }
    // olives: small dark-green and a few violet ovoids on short stalks
    for (let k = 0; k < 14; k++) { const p = cv.getPoint(0.25 + 0.7 * hs(k, 31)), hang = 0.07 + 0.05 * hs(k, 32), c = k % 5 === 3 ? [0.22, 0.12, 0.2] : [0.3, 0.42, 0.2], base = [p.x + (hs(k, 33) - 0.5) * 0.1, p.y - 0.02, p.z + (hs(k, 34) - 0.5) * 0.1]; tube(BR, [[p.x, p.y, p.z], [base[0], base[1] - hang * 0.5, base[2]]], 0.0015, 0.0015, 4, bc, { seg: 2 });
      const cy = base[1] - hang * 0.5 - 0.016; for (let a = 0; a < 6; a++) for (let e = 0; e < 3; e++) { const a0 = (a / 6) * TAU, a1 = ((a + 1) / 6) * TAU, e0 = -1.2 + e * 0.8, e1 = e0 + 0.8, q = (aa, ee) => [base[0] + Math.sin(aa) * Math.cos(ee) * 0.011, cy + Math.sin(ee) * 0.017, base[2] + Math.cos(aa) * Math.cos(ee) * 0.011]; BR.quad(q(a0, e0), q(a1, e0), q(a1, e1), q(a0, e1), [[0, 0], [1, 0], [1, 1], [0, 1]], mul3(c, 0.7 + 0.7 * Math.max(0, Math.sin(a0 + 0.8)) * (e + 1) / 3)); } }
    const bm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false }); bm.userData.noOutline = true; const me = new THREE.Mesh(BR.geo(), bm); me.frustumCulled = false; me.userData.lookOnly = true; branch.add(me); branch.visible = S.branch !== false; grp.add(branch); }
  addMesh(O, matO, 0);
  const wm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); wm.userData.noOutline = true; addMesh(WN, wm, 1);
  { const [cv, g] = canvas(128, 128), rad = g.createRadialGradient(64, 64, 0, 64, 64, 64); rad.addColorStop(0, "rgba(255,190,90,0.55)"); rad.addColorStop(0.35, "rgba(255,160,60,0.18)"); rad.addColorStop(1, "rgba(255,140,40,0)"); g.fillStyle = rad; g.fillRect(0, 0, 128, 128);
    const hm = new THREE.MeshBasicMaterial({ map: ctex(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide, fog: false }); hm.userData.noOutline = true; addMesh(HALO, hm, 2); }
  return { apply(t) { branch.rotation.z = 0.02 * Math.sin(t * 0.7) + 0.009 * Math.sin(t * 1.9 + 1); branch.rotation.x = 0.014 * Math.sin(t * 1.1 + 2); branch.rotation.y = 0.012 * Math.sin(t * 0.5 + 0.5); } };
}
