// Ancient aliens EP03 Atlantis, block C4 (brief block-c/briefs/C4.md): the edge road of Atlantis on its last evening, panel 29 (plate 29).
// Design: DESIGNS.md sections 0 and 1 (C evening: copper #b3683a under slate #4a4650, hard low light, sea #3d4f5e, wet stone; "Edge road (29, the match of 28)").
// Bench: storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-c-road.mjs (+ at-c-road-sheet.png, at-c-road-vs.png). Exports C_ROAD_KINDS, C_ROAD_GRIPS = {} (nothing here is held).
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, sea level y 0. No Math.random, no wall clock: everything that moves
// comes from the clip clock t or from a param. Every mesh is scenery (lookOnly, surfaceOnly); only the road's near slabs are solid. Colour is baked (unlit):
// the evening light is part of the paint, as in the kit's near city. Put the place away from the stage origin (the bench uses x 100000).
//
//   edgeroad2   the causeway of panel 29 (the match of the Bimini road 28): 3.6 wide (x -1.8..1.8), top y 0.8 (STANDABLE, solid for z -40..7.3), runs along -z from z +14.6 to the
//               side gate at z about -104 (33 slabs of 3.6 with a 0.05 cross joint every 3.65: the Bimini gaps). Each slab is one of six painted setts (0.3 x 0.2, running
//               bond), every sett with its own wear, tone, chips and pits; the stone is wet: copper sky streaks and sky puddles mirrored in it, dark joints with weed strands,
//               kelp fronds and barnacles in them and on the edge faces. The right edge (x +1.8) is open: the sea water runs over it in sheets (moving on t, about 90 falls of
//               0.2..1.6 wide, 0.35 m high into the sea) with foam where they land; the left edge is washed by small waves (lace that comes and goes on t).
//               spec.water 0..1 (default 0.6; param water, seed it with a dur-0 set to tween): how much water runs across the road (a 0..0.15 m sheet that slides to +x)
//               and over the edge. spec.seed 1. Origin: Spud's spot on the road's centre line, y 0 = sea level (the road top is +0.8 above it).
//   stormcity   the Atlantis edge for this shot, real 3D at its real distance, in the evening storm light. The brass ring wall (12 high, 4 thick, plates 3 x 4 with rivets,
//               patina, verdigris under the cornice, ribs every 9 m, gold cornice and rail) curves on a ring of radius 600 about 100 m away, its nearest point at x +95, running
//               left (-x) away from us out to x -420; stone towers 5.4 wide with gold cupolas and red pennants that snap on t every 22 m; the arched gate (8 wide, 10.5 high,
//               stone ring, a tunnel lit warm inside) at x 0 where the road ends; the rocky headland with green shrubs and foam at the wall's foot; the green hill behind with
//               trees, terraces, white houses with tile roofs and gold domes, and the white palace with its gold spires on top; and the storm sky: a pinned dome of slate
//               clouds with copper rifts and a low sun left, drifting slowly on t. spec.sky true (false: no sky, for a clip with its own), spec.seed 1, spec.sun 35 (degrees
//               left of straight ahead, where the glow sits). No params. Origin: the road's centre line at the shore, y 0 = sea level; the wall stands about 100 m toward -z.
//   Use with: a `sea` (grade "storm", horizon true) at the same x, z; the light AT_EVE (kit/at-kit.mjs). The sea's own colours are the kit owner's; spec.hi/skyH/skyZ/haze
//   are worth setting on it (bench).
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const hx = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cs = (h, k = 1, a = 1) => { const c = typeof h === "string" ? hx(h) : h; return `rgba(${Math.min(255, Math.round(c[0] * k * 255))},${Math.min(255, Math.round(c[1] * k * 255))},${Math.min(255, Math.round(c[2] * k * 255))},${a})`; };
const lin = (v) => Math.pow(Math.max(v, 0), 2.2);
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; else { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; } return t; }

// ---------------------------------------------------------------------------------------------------------------------------------- the light, baked
// the low storm sun sits left and behind the wall: faces turned left catch copper, the rest is slate-warm fill
const SUN = (() => { const v = [-0.8, 0.32, -0.28], l = Math.hypot(...v); return v.map((q) => q / l); })();
const WARM = [1.06, 0.86, 0.74], FILL = [0.84, 0.78, 0.84];
function litK(n, amb) { const d = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]); return [amb * FILL[0] + (1 - amb) * d * WARM[0] * 1.1, amb * FILL[1] + (1 - amb) * d * WARM[1] * 1.1, amb * FILL[2] + (1 - amb) * d * WARM[2] * 1.1]; }

// ---------------------------------------------------------------------------------------------------------------------------------- a soup of quads
class Geo {
  constructor(alpha = false) { this.P = []; this.C = []; this.U = []; this.I = []; this.N = 0; this.alpha = alpha; }
  // corners a b c d counter-clockwise seen from the front; col [r,g,b] (sRGB 0..1) or four of them; uv [u0,v0,u1,v1] or four pairs;
  // o.lit amb: shade by the face normal; o.a alpha (or four); o.k brightness
  quad(a, b, c, d, col, uv = [0, 0, 1, 1], o = {}) {
    const p = [a, b, c, d];
    let sh = [1, 1, 1];
    if (o.lit != null) {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = o.n ?? [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l]; sh = litK(n, o.lit);
    }
    const u = uv.length === 4 && typeof uv[0] === "number" ? [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]] : uv;
    const k = o.k ?? 1;
    for (let i = 0; i < 4; i++) {
      const t = Array.isArray(col[0]) ? col[i] : col, kk = Array.isArray(o.kk) ? o.kk[i] : 1;
      this.P.push(p[i][0], p[i][1], p[i][2]); this.U.push(u[i][0], u[i][1]);
      this.C.push(lin(t[0] * sh[0] * k * kk), lin(t[1] * sh[1] * k * kk), lin(t[2] * sh[2] * k * kk));
      if (this.alpha) this.C.push(Array.isArray(o.a) ? o.a[i] : (o.a ?? 1));
    }
    this.I.push(this.N, this.N + 1, this.N + 2, this.N, this.N + 2, this.N + 3); this.N += 4; return this;
  }
  tri(a, b, c, col, o = {}) { return this.quad(a, b, c, c, col, [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], o); }
  // axis box; faces t f b r l (+ d with o.bottom); o.tm metres per texture repeat; o.hide letters to skip
  box(x0, y0, z0, x1, y1, z1, col, o = {}) {
    const T = o.tm ?? 8, h = o.hide ?? "", L = o.lit ?? 0.7;
    const F = (f, a, b, c, d, u0, v0, u1, v1) => { if (!h.includes(f)) this.quad(a, b, c, d, col, o.uv ?? [u0 / T, v0 / T, u1 / T, v1 / T], { lit: L, k: o.k, kk: o.kk }); };
    F("t", [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], x0, z0, x1, z1);
    F("f", [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], x0, y0, x1, y1);
    F("b", [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], -x1, y0, -x0, y1);
    F("r", [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], -z1, y0, -z0, y1);
    F("l", [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], z0, y0, z1, y1);
    if (o.bottom) F("d", [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], x0, z0, x1, z1);
    return this;
  }
  // lathe about the vertical axis at (cx, cz): profile [[r, y], ...] bottom to top
  lathe(prof, n, cx, cz, col, o = {}) {
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, pr = dy / l, py = -dr / l;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2;
        this.quad([cx + r0 * c1, y0, cz + r0 * s1], [cx + r0 * c0, y0, cz + r0 * s0], [cx + r1 * c0, y1, cz + r1 * s0], [cx + r1 * c1, y1, cz + r1 * s1],
          Array.isArray(col[0]) && col.length > 3 ? col[(i + j) % col.length] : col, [i / n, j / (prof.length - 1), (i + 1) / n, (j + 1) / (prof.length - 1)],
          { lit: o.lit ?? 0.6, n: [pr * Math.cos(am), py, pr * Math.sin(am)], k: o.k });
      }
    }
    return this;
  }
  mesh(parent, map, o = {}) {
    if (!this.N) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.C, this.alpha ? 4 : 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.U, 2)); g.setIndex(this.I); g.computeBoundingSphere();
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, map: map ?? null, toneMapped: false, side: THREE.DoubleSide, transparent: !!this.alpha, depthWrite: !this.alpha, fog: false, ...(o.mat ?? {}) });
    m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false };
    if (o.offset) { m.polygonOffset = true; m.polygonOffsetFactor = -o.offset; m.polygonOffsetUnits = -o.offset; }
    const me = new THREE.Mesh(g, m); me.name = o.name ?? "road-c4"; me.frustumCulled = false; me.renderOrder = o.order ?? 0;
    me.userData.lookOnly = true; me.userData.solid = !!o.solid; me.userData.surfaceOnly = true; me.userData.steam = true; me.castShadow = false; me.receiveShadow = false;
    parent.add(me); return me;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------- textures
const SLAB_W = 3.6, SLAB_L = 3.6;
// the wet setts: six slabs in one atlas, 3 x 2 cells of 640 px = 3.6 m x 3.6 m (178 px per metre)
function settAtlas() {
  return once("setts", () => {
    const CW = 768, [c, g] = canvas(CW * 3, CW * 2), ppm = CW / 3.6;
    const BASE = ["#3a3640", "#443a3c", "#52443c", "#2e2c36", "#4a3e3c", "#3c3a46", "#5a4a3e", "#35333c"];
    const SKY = ["#f0a05a", "#e8803a", "#ffb878", "#d07048", "#f4c088"];
    for (let v = 0; v < 6; v++) {
      const ox = (v % 3) * CW, oy = Math.floor(v / 3) * CW, sd = v * 977 + 13;
      g.save(); g.beginPath(); g.rect(ox, oy, CW, CW); g.clip(); g.translate(ox, oy);
      g.fillStyle = "#1c1a22"; g.fillRect(0, 0, CW, CW);
      // setts: 12 across (0.3 m), 18 rows (0.2 m), running bond
      const rows = 36, rh = CW / rows, cols = 24, cw = CW / cols, rects = [];
      for (let r = 0; r < rows; r++) {
        const off = (rnd(sd + r * 3.1) > 0.5 ? 0.5 : 0) * cw * (r % 2 ? 1 : 0.4) + (rnd(sd + r * 7) - 0.5) * cw * 0.3;
        for (let k = -1; k <= cols; k++) {
          const key = sd * 31 + r * 101 + k * 7, x0 = k * cw + off, y0 = r * rh, w = cw * (0.9 + 0.1 * rnd(key + 1)), h = rh * (0.88 + 0.1 * rnd(key + 2)), gx = 1.1 + 0.8 * rnd(key + 3), gy = 1.1 + 0.7 * rnd(key + 4);
          const base = BASE[Math.floor(rnd(key + 5) * BASE.length)], kk = 0.82 + 0.4 * rnd(key + 6);
          const gr = g.createLinearGradient(x0, y0, x0 + w * 0.7, y0 + h); gr.addColorStop(0, cs(base, kk * 1.12)); gr.addColorStop(1, cs(base, kk * 0.82));
          g.fillStyle = gr; g.beginPath(); g.roundRect(x0 + gx, y0 + gy, w - 2 * gx, h - 2 * gy, 1.5); g.fill(); rects.push([x0 + gx, y0 + gy, w - 2 * gx, h - 2 * gy]);
          // wear: a worn bright edge on the left/top, pits, a chip, a crack
          g.fillStyle = cs("#a89484", 1, 0.1 + 0.12 * rnd(key + 9)); g.fillRect(x0 + gx + 2, y0 + gy + 1, (w - 2 * gx) * 0.9, 2);
          for (let q = 0; q < 2; q++) { g.fillStyle = cs("#18141a", 1, 0.32); g.beginPath(); g.arc(x0 + gx + 5 + (w - 2 * gx - 10) * rnd(key + 10 + q), y0 + gy + 4 + (h - 2 * gy - 8) * rnd(key + 20 + q), 0.6 + 1.0 * rnd(key + 30 + q), 0, TAU); g.fill(); }
          if (rnd(key + 40) > 0.78) { g.strokeStyle = cs("#18141a", 1, 0.6); g.lineWidth = 1.2; g.beginPath(); const sx = x0 + gx + (w - 2 * gx) * rnd(key + 41); g.moveTo(sx, y0 + gy); g.lineTo(sx + 6 * (rnd(key + 42) - 0.5), y0 + h * 0.5); g.lineTo(sx + 9 * (rnd(key + 43) - 0.5), y0 + h - gy); g.stroke(); }
          if (rnd(key + 50) > 0.88) { g.fillStyle = cs("#2e2a30", 1, 0.8); g.beginPath(); g.moveTo(x0 + w - gx, y0 + gy); g.lineTo(x0 + w - gx - 7, y0 + gy); g.lineTo(x0 + w - gx, y0 + gy + 6); g.fill(); }
        }
      }
      // the wet: copper sky streaks, long in the direction of the view (down the slab), clipped later by the joints we redraw on top
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 34; i++) {
        const key = sd + i * 17, cx = CW * rnd(key), cy = CW * rnd(key + 1), rx = 8 + 34 * rnd(key + 2) ** 1.4, ry = 140 + 420 * rnd(key + 3), hue = SKY[Math.floor(rnd(key + 4) * SKY.length)], a = 0.24 + 0.42 * rnd(key + 5);
        g.save(); g.translate(cx, cy); g.scale(rx / ry, 1); const rg = g.createRadialGradient(0, 0, 0, 0, 0, ry); rg.addColorStop(0, cs(hue, 1, a)); rg.addColorStop(0.55, cs(hue, 0.9, a * 0.45)); rg.addColorStop(1, cs(hue, 0.8, 0)); g.fillStyle = rg; g.fillRect(-ry, -ry, 2 * ry, 2 * ry); g.restore();
      }
      g.globalCompositeOperation = "source-over";
      // sett-wise glints: some setts take the sky as a patch (each its own)
      for (let i = 0; i < 70; i++) {
        const key = sd + i * 23 + 5000, r = Math.floor(rnd(key) * rows), x = CW * rnd(key + 1), y = r * rh + rh * 0.2, w = cw * (0.5 + 0.5 * rnd(key + 2)), hue = SKY[Math.floor(rnd(key + 3) * SKY.length)];
        const gr = g.createLinearGradient(x, y, x, y + rh * 0.6); gr.addColorStop(0, cs(hue, 1.05, 0.45 * rnd(key + 4) + 0.1)); gr.addColorStop(1, cs(hue, 0.8, 0)); g.fillStyle = gr; g.fillRect(x, y, w, rh * 0.62);
      }
      // dark grit lines (the joints between setts again, over the glow)
      g.strokeStyle = cs("#120e14", 1, 0.85); g.lineWidth = 1.7; for (const [rx0, ry0, rw0, rh0] of rects) g.strokeRect(rx0 - 0.5, ry0 - 0.5, rw0 + 1, rh0 + 1);
      // puddles: irregular sky mirrors with a lighter rim
      const nP = 1 + (v % 3 === 0 ? 1 : 0) + (v === 4 ? 1 : 0);
      for (let q = 0; q < nP; q++) {
        const key = sd + q * 91 + 9000, cx = CW * (0.2 + 0.6 * rnd(key)), cy = CW * (0.2 + 0.6 * rnd(key + 1)), rx = 50 + 70 * rnd(key + 2), ry = 22 + 32 * rnd(key + 3);
        g.save(); g.translate(cx, cy); g.beginPath(); for (let a = 0; a <= 24; a++) { const t = (a / 24) * TAU, rr = 1 + 0.18 * Math.sin(t * 3 + key) + 0.1 * Math.sin(t * 5 + key * 2); g.lineTo(Math.cos(t) * rx * rr, Math.sin(t) * ry * rr); } g.closePath();
        const gr = g.createLinearGradient(0, -ry, 0, ry); gr.addColorStop(0, "#7d7894"); gr.addColorStop(0.45, "#c88a74"); gr.addColorStop(1, "#f2a460"); g.fillStyle = gr; g.globalAlpha = 0.86; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = cs("#e8a870", 1, 0.5); g.lineWidth = 3; g.stroke();
        g.fillStyle = cs("#ffe2b0", 1, 0.5); g.beginPath(); g.ellipse(-rx * 0.2, ry * 0.15, rx * 0.34, ry * 0.12, 0, 0, TAU); g.fill();
        g.restore();
      }
      // moss and slime in the joints, wet-dark rims
      for (let i = 0; i < 90; i++) { const key = sd + i * 13 + 777, r = Math.floor(rnd(key) * rows); g.fillStyle = cs(rnd(key + 1) > 0.5 ? "#4a5a2a" : "#2e4a2e", 1, 0.55); g.beginPath(); g.ellipse(CW * rnd(key + 2), r * rh, 3 + 7 * rnd(key + 3), 1.6 + 1.6 * rnd(key + 4), 0, 0, TAU); g.fill(); }
      // the slab's own edge: a darker rim all round
      g.strokeStyle = cs("#0e0a12", 1, 0.9); g.lineWidth = 16; g.strokeRect(0, 0, CW, CW);
      g.restore();
    }
    void ppm;
    const t = tex(c); t.anisotropy = 8;
    return { map: t, cw: CW };
  });
}
// the edge faces: stone courses, slime, barnacle spots, drips
function edgeTex() {
  return once("edge", () => {
    const [c, g] = canvas(512, 384); g.fillStyle = "#3c3a40"; g.fillRect(0, 0, 512, 384);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
      const key = r * 31 + k * 7, x0 = k * 90 + (r % 2) * 45 - 40, y0 = r * 96, w = 88, h = 94, base = ["#4a4650", "#56504a", "#3e3c46", "#625a50"][Math.floor(rnd(key) * 4)];
      const gr = g.createLinearGradient(x0, y0, x0, y0 + h); gr.addColorStop(0, cs(base, 1.05)); gr.addColorStop(1, cs(base, 0.78)); g.fillStyle = gr; g.beginPath(); g.roundRect(x0 + 2, y0 + 2, w - 4, h - 4, 6); g.fill();
      for (let q = 0; q < 4; q++) { g.fillStyle = cs("#16141a", 1, 0.4); g.beginPath(); g.arc(x0 + w * rnd(key + q), y0 + h * rnd(key + q + 9), 1 + 2 * rnd(key + q + 3), 0, TAU); g.fill(); }
    }
    for (let i = 0; i < 160; i++) { const x = rnd(i) * 512, y = 40 + rnd(i + 1) * 344; g.fillStyle = cs(rnd(i + 2) > 0.45 ? "#4f5f2a" : "#7a6a2e", 1, 0.22 + 0.3 * (y / 384)); g.beginPath(); g.ellipse(x, y, 5 + 16 * rnd(i + 3), 2 + 6 * rnd(i + 4), 0, 0, TAU); g.fill(); }
    const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "rgba(255,150,80,0.16)"); gr.addColorStop(0.5, "rgba(20,24,30,0)"); gr.addColorStop(1, "rgba(18,40,40,0.5)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
    g.strokeStyle = cs("#14121a", 1, 0.85); g.lineWidth = 3; for (let r = 0; r <= 4; r++) { g.beginPath(); g.moveTo(0, r * 96); g.lineTo(512, r * 96); g.stroke(); }
    for (let i = 0; i < 26; i++) { g.strokeStyle = cs("#c8d6d8", 1, 0.18 + 0.2 * rnd(i + 5)); g.lineWidth = 1 + 2 * rnd(i + 6); const x = rnd(i + 7) * 512; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6 * (rnd(i + 8) - 0.5), 384); g.stroke(); }
    return tex(c, { wrap: true });
  });
}
// running water: pale streaks and lace, alpha (the sheet over the road, scrolled along u)
function flowTex() {
  return once("flow", () => {
    const [c, g] = canvas(512, 512), im = g.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { im.data[(y * 512 + x) * 4 + 3] = 0; }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 90; i++) {
      const y = rnd(i) * 512, x = rnd(i + 1) * 512, len = 60 + 220 * rnd(i + 2), w = 1 + 3.2 * rnd(i + 3), hue = rnd(i + 4) > 0.5 ? "#f6dcc0" : "#cfe6ee", a = 0.12 + 0.34 * rnd(i + 5);
      for (const dx of [-512, 0, 512]) { const gr = g.createLinearGradient(x + dx, 0, x + dx + len, 0); gr.addColorStop(0, cs(hue, 1, 0)); gr.addColorStop(0.3, cs(hue, 1, a)); gr.addColorStop(1, cs(hue, 1, 0)); g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x + dx, y); g.bezierCurveTo(x + dx + len * 0.3, y + 4 * Math.sin(i), x + dx + len * 0.7, y - 4 * Math.cos(i), x + dx + len, y + 3 * Math.sin(i * 2)); g.stroke(); }
    }
    for (let i = 0; i < 40; i++) { const x = rnd(i + 200) * 512, y = rnd(i + 201) * 512, r = 3 + 11 * rnd(i + 202); g.strokeStyle = cs("#ffffff", 1, 0.12 + 0.22 * rnd(i + 203)); g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y, r * 2.2, r * 0.6, 0, 0, TAU); g.stroke(); }
    return tex(c, { wrap: true });
  });
}
// a falling sheet: vertical pale streaks, alpha (scrolled down in v)
function fallTex() {
  return once("fall", () => {
    const [c, g] = canvas(256, 512);
    for (let i = 0; i < 70; i++) { const x = rnd(i) * 256, y = rnd(i + 1) * 512, len = 70 + 300 * rnd(i + 2), w = 1.5 + 5 * rnd(i + 3), a = 0.18 + 0.5 * rnd(i + 4); for (const dy of [-512, 0, 512]) { const gr = g.createLinearGradient(0, y + dy, 0, y + dy + len); gr.addColorStop(0, "rgba(240,248,250,0)"); gr.addColorStop(0.3, cs("#f2f8f8", 1, a)); gr.addColorStop(1, "rgba(220,236,240,0)"); g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x, y + dy); g.lineTo(x + 3 * Math.sin(i), y + dy + len); g.stroke(); } }
    g.fillStyle = "rgba(180,210,214,0.12)"; g.fillRect(0, 0, 256, 512);
    return tex(c, { wrap: true });
  });
}
// soft foam: clumps of white bubbles with lace holes, alpha
function foamTex() {
  return once("foam", () => {
    const [c, g] = canvas(512, 256);
    for (let i = 0; i < 260; i++) { const x = rnd(i) * 512, y = rnd(i + 1) * 256, r = 3 + 14 * rnd(i + 2) ** 2, a = 0.2 + 0.6 * rnd(i + 3); for (const dx of [-512, 0, 512]) { const rg = g.createRadialGradient(x + dx, y, 0, x + dx, y, r); rg.addColorStop(0, cs("#fbfdfc", 1, a)); rg.addColorStop(0.7, cs("#e2eeee", 1, a * 0.6)); rg.addColorStop(1, cs("#d6e6e8", 1, 0)); g.fillStyle = rg; g.beginPath(); g.arc(x + dx, y, r, 0, TAU); g.fill(); } }
    for (let i = 0; i < 70; i++) { g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,0.5)"; g.beginPath(); g.ellipse(rnd(i + 300) * 512, rnd(i + 301) * 256, 3 + 8 * rnd(i + 302), 2 + 4 * rnd(i + 303), 0, 0, TAU); g.fill(); }
    g.globalCompositeOperation = "source-over";
    return tex(c, { wrap: true });
  });
}
// one soft round blob for puffs, spray, shrub fringes
function softTex() {
  return once("soft", () => { const [c, g] = canvas(64, 64), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.5, "rgba(255,255,255,0.5)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return tex(c); });
}

// ================================================================================================================ EDGEROAD2
const ROAD_Z0 = 14.6, ROAD_END = -112, TOPY = 0.8, W = 1.8;
// a ribbon lying on the road: points [[x, y, z], ...] width taper, colour variation along
function ribbon(geo, pts, w0, col, o = {}) {
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i], q = pts[i + 1], t0 = 1 - i / (n - 1), t1 = 1 - (i + 1) / (n - 1), dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    const wa = w0 * (0.25 + 0.75 * t0), wb = w0 * (0.15 + 0.85 * t1) * (i === n - 2 ? 0.2 : 1);
    const c0 = mul(col, 0.8 + 0.3 * t0), c1 = mul(col, 0.8 + 0.3 * t1);
    geo.quad([p[0] - nx * wa, p[1], p[2] - nz * wa], [p[0] + nx * wa, p[1], p[2] + nz * wa], [q[0] + nx * wb, q[1], q[2] + nz * wb], [q[0] - nx * wb, q[1], q[2] - nz * wb], [c0, c0, c1, c1], [0, 0, 1, 1], { k: o.k });
  }
}
function barnacle(geo, x, y, z, r, h, axis, sd) {
  const cream = [0.82, 0.78, 0.68], n = 6, m = (px, py, pz) => (axis === "x" ? [x + py, y + pz, z + px] : [x + px, y + py, z + pz]);   // axis x: grows toward +x
  const sw = rnd(sd) * 0.3;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, rt = r * 0.55;
    geo.quad(m(Math.cos(a1) * r, 0, Math.sin(a1) * r), m(Math.cos(a0) * r, 0, Math.sin(a0) * r), m(Math.cos(a0) * rt, h, Math.sin(a0) * rt), m(Math.cos(a1) * rt, h, Math.sin(a1) * rt), mul(cream, 0.82 + 0.3 * rnd(sd + i) + sw * 0.2), [0, 0, 1, 1], { k: 0.92 });
  }
  geo.quad(m(-rt0(r), h * 1.001, -rt0(r)), m(rt0(r), h * 1.001, -rt0(r)), m(rt0(r), h * 1.001, rt0(r)), m(-rt0(r), h * 1.001, rt0(r)), [0.12, 0.1, 0.1], [0, 0, 1, 1]);
}
const rt0 = (r) => r * 0.3;

function edgeroad2(P) {
  const S = P.spec, sd = (S.seed ?? 1) * 31, A = settAtlas(), ED = edgeTex();
  const nSlab = Math.ceil((ROAD_Z0 - ROAD_END) / 3.65);
  const near = new Geo(), far = new Geo(), edgeG = new Geo(), gapG = new Geo(), weed = new Geo(), barn = new Geo();
  const cell = (v) => { const cx = (v % 3) / 3, cy = Math.floor(v / 3) / 2; return [cx + 0.004, cy + 0.006, cx + 1 / 3 - 0.004, cy + 0.5 - 0.006]; };
  for (let k = 0; k < nSlab; k++) {
    const zt = ROAD_Z0 - 3.65 * k, zb = zt - SLAB_L, solid = zt <= 7.4 && zb >= -40.6, G = solid ? near : far;
    const v = Math.floor(rnd(sd + k * 3.7) * 6), c = cell(v), flipU = rnd(sd + k + 9) > 0.5, flipV = rnd(sd + k + 4) > 0.5;
    const dy = solid ? 0 : (rnd(sd + k + 17) - 0.5) * 0.04, dy2 = solid ? 0 : (rnd(sd + k + 19) - 0.5) * 0.03, yaw = solid ? 0 : (rnd(sd + k + 21) - 0.5) * 0.03, kk = 0.92 + 0.12 * rnd(sd + k + 23);
    const y = TOPY + dy, yb = TOPY + dy2;   // front (z+) and back edge height
    const u0 = flipU ? c[2] : c[0], u1 = flipU ? c[0] : c[2], v0 = flipV ? c[3] : c[1], v1 = flipV ? c[1] : c[3];
    // the top: texture row 0 of the cell is its top edge in the canvas (flipY puts canvas y down = v 1), so the cell's v1 is the canvas top; the slab's far end (zb) takes the top
    G.quad([-W, y, zt], [W, y, zt + yaw], [W + 0, yb, zb + yaw], [-W, yb, zb], [kk, kk, kk], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    // the slab's two long sides and the cross-joint faces (a small bevel then the black gap)
    const bevel = 0.04;
    G.quad([-W, y, zt], [-W + 0.0, y - 0.5, zt], [-W, yb - 0.5, zb], [-W, yb, zb], [0.2, 0.19, 0.22], [0, 0, 1, 1]);
    // gap between this slab's back end and the next slab's front end
    const gz = zb, gz2 = zb - 0.05;
    gapG.quad([-W, yb - bevel, gz], [W, yb - bevel, gz], [W, yb - 0.3, gz], [-W, yb - 0.3, gz], [[0.12, 0.1, 0.12], [0.12, 0.1, 0.12], [0.04, 0.04, 0.05], [0.04, 0.04, 0.05]], [0, 0, 1, 1]);
    gapG.quad([-W, TOPY - 0.12, gz], [W, TOPY - 0.12, gz], [W, TOPY - 0.12, gz2], [-W, TOPY - 0.12, gz2], [0.1, 0.09, 0.08], [0, 0, 1, 1]);
    // lower faces of the road body (below the top edge): the left and right sides in slime-streaked stone, a course every 0.4
    for (const sg of [-1, 1]) {
      const xa = sg * W, ya = TOPY, yb2 = -1.3, u = rnd(sd + k * 5 + sg) * 3;
      edgeG.quad(sg > 0 ? [xa, yb2, zt] : [xa, yb2, zb], sg > 0 ? [xa, yb2, zb] : [xa, yb2, zt], sg > 0 ? [xa, ya, zb] : [xa, ya, zt], sg > 0 ? [xa, ya, zt] : [xa, ya, zb], [[0.55, 0.62, 0.66], [0.55, 0.62, 0.66], [1.05, 0.95, 0.9], [1.05, 0.95, 0.9]], [u, 0, u + 0.95, 1.35]);
    }
    // weed strands in the joint and spilling onto both slabs
    const nW = 4 + Math.floor(rnd(sd + k * 11) * 5);
    for (let q = 0; q < nW; q++) {
      const key = sd + k * 53 + q * 7, x = -W + 0.15 + (2 * W - 0.3) * rnd(key), up = rnd(key + 1) > 0.5 ? 1 : -1, len = 0.35 + 0.9 * rnd(key + 2), ang = (rnd(key + 3) - 0.5) * 1.2;
      const pts = []; for (let j = 0; j < 9; j++) { const s = j / 8; pts.push([x + Math.sin(ang) * len * s + 0.05 * Math.sin(s * 3.2 + key), TOPY + 0.012 + 0.02 * Math.sin(Math.PI * s) * rnd(key + 4), gz - 0.025 + up * Math.cos(ang) * len * s + 0.035 * Math.sin(s * 4.1 + key * 2)]); }
      const hue = [[0.34, 0.28, 0.1], [0.42, 0.34, 0.12], [0.24, 0.3, 0.12], [0.4, 0.24, 0.1]][Math.floor(rnd(key + 5) * 4)];
      ribbon(weed, pts, 0.014 + 0.022 * rnd(key + 6), hue);
    }
    // a kelp cluster here and there (fronds fanning out of one root)
    if (rnd(sd + k * 13 + 3) > 0.55) {
      const key = sd + k * 71, x = -W + 0.5 + (2 * W - 1.0) * rnd(key), nF = 6 + Math.floor(rnd(key + 1) * 5), base = rnd(key + 2) * TAU;
      for (let f = 0; f < nF; f++) {
        const a = base + (f / nF) * 2.4 - 1.2 + (rnd(key + f) - 0.5) * 0.3, len = 0.45 + 0.7 * rnd(key + f + 9), pts = [];
        for (let j = 0; j < 9; j++) { const s = j / 8; pts.push([x + Math.cos(a) * len * s + 0.04 * Math.sin(s * 3 + f), TOPY + 0.014 + 0.03 * Math.sin(Math.PI * s), gz + Math.sin(a) * len * s + 0.03 * Math.cos(s * 4 + f)]); }
        ribbon(weed, pts, 0.03 + 0.025 * rnd(key + f + 3), [[0.4, 0.28, 0.08], [0.48, 0.36, 0.1], [0.32, 0.24, 0.08]][f % 3]);
      }
    }
    // barnacles along the right edge face and in the joints
    const nB = 14 + Math.floor(rnd(sd + k * 17) * 12);
    for (let q = 0; q < nB; q++) {
      const key = sd + k * 301 + q * 13, clu = Math.floor(q / 4), cz = zt - 0.2 - (SLAB_L - 0.4) * rnd(sd + k * 7 + clu), cy = 0.02 + 0.6 * rnd(sd + k * 9 + clu * 2) ** 1.5;
      barnacle(barn, W + 0.002, cy + 0.14 * (rnd(key + 1) - 0.5), cz + 0.12 * (rnd(key + 2) - 0.5), 0.012 + 0.022 * rnd(key + 3), 0.01 + 0.022 * rnd(key + 4), "x", key);
    }
    for (let q = 0; q < 8; q++) { const key = sd + k * 211 + q * 19; barnacle(barn, -W + 0.1 + (2 * W - 0.2) * rnd(key), TOPY + 0.002, gz - 0.015 + 0.03 * (rnd(key + 1) - 0.5) + (rnd(key + 5) > 0.5 ? 0.13 : -0.13) * rnd(key + 6), 0.01 + 0.018 * rnd(key + 2), 0.008 + 0.014 * rnd(key + 3), "y", key); }
  }
  // the road body behind: the slabs' far end closing wall inside the gate is the tunnel's (stormcity); nothing more here
  const R = P.whole;
  const mNear = near.mesh(R, A.map, { name: "road-near", solid: true }), mFar = far.mesh(R, A.map, { name: "road-far" });
  gapG.mesh(R, null, { name: "road-gaps" });
  edgeG.mesh(R, ED, { name: "road-edges" });
  weed.mesh(R, null, { name: "road-weed", offset: 2 });
  barn.mesh(R, null, { name: "road-barnacles", offset: 1 });
  void mNear; void mFar;

  // ---------------------------------------------------------------- the water: the sheet over the road, the falls off the right edge, foam where they land, lace on the left
  const wl = ROAD_Z0 - ROAD_END, FT = flowTex(), FL = fallTex(), FM = foamTex();
  const sheetG = new Geo(true);
  const nS = 28, ds = wl / nS;
  for (let i = 0; i < nS; i++) {
    const za = ROAD_Z0 - i * ds, zb = za - ds, uvz = wl / 4;
    // clearer at the left, thicker toward the right edge
    sheetG.quad([-W, 0, za], [W, 0, za], [W, 0, zb], [-W, 0, zb], [[0.9, 0.62, 0.46], [0.9, 0.86, 0.84], [0.9, 0.86, 0.84], [0.9, 0.62, 0.46]], [[0, i * ds / 4], [1, i * ds / 4], [1, (i + 1) * ds / 4], [0, (i + 1) * ds / 4]].map((q) => [q[0] * 1.0, q[1]]), { a: [0.0, 1, 1, 0.0], k: 1 });
    void uvz;
  }
  const sheet = sheetG.mesh(R, FT, { name: "road-sheet", order: 5, offset: 3, mat: { opacity: 1 } });
  // the falls
  const fallG = new Geo(true), nF = 96, fallsAt = [];
  for (let i = 0; i < nF; i++) {
    const t = rnd(sd + i * 3), z = ROAD_Z0 - 2 - (i / nF) ** 1.12 * (wl - 4) + (rnd(sd + i * 5) - 0.5) * 1.1, w = (0.2 + 1.3 * rnd(sd + i * 7) ** 1.6) * (1 + 0.8 * clamp(-z / 60)), amt = 0.55 + 0.45 * rnd(sd + i * 11);
    fallsAt.push({ z, w, amt, t });
    const u0 = rnd(sd + i * 13) * 4;
    const steps = 4;
    for (let j = 0; j < steps; j++) {
      const ya = TOPY + 0.02 - (j / steps) * (TOPY - 0.12), yb = TOPY + 0.02 - ((j + 1) / steps) * (TOPY - 0.12), xa = W + 0.02 + 0.26 * (j / steps) ** 1.4 * 1.0, xb = W + 0.02 + 0.26 * ((j + 1) / steps) ** 1.4;
      const al = 0.9 * amt;
      fallG.quad([xa, ya, z - w / 2], [xa, ya, z + w / 2], [xb, yb, z + w / 2], [xb, yb, z - w / 2], [[0.84, 0.88, 0.9], [0.84, 0.88, 0.9], [0.92, 0.96, 0.96], [0.92, 0.96, 0.96]], [u0, j / steps, u0 + w * 0.8, (j + 1) / steps], { a: [al * (j ? 1 : 0.8), al * (j ? 1 : 0.8), al, al] });
    }
  }
  const falls = fallG.mesh(R, FL, { name: "road-falls", order: 6, offset: 2 });
  // foam where the falls land and the lace on the left edge, the crest foam along the right edge's lip
  const foamG = new Geo(true);
  for (const f of fallsAt) {
    const n = 2 + (f.w > 0.7 ? 2 : 0);
    for (let q = 0; q < n; q++) {
      const key = f.z * 17 + q * 3, r = 0.4 + 1.1 * rnd(key) + f.w * 0.8, x = W + 0.45 + 1.2 * rnd(key + 1), z = f.z + (rnd(key + 2) - 0.5) * f.w * 1.4, rot = rnd(key + 3) * 0.6, FY = 0.2;
      foamG.quad([x - r, FY, z + r * 0.7], [x + r, FY, z + r * 0.7 + rot * 0.1], [x + r, FY, z - r * 0.7], [x - r, FY, z - r * 0.7 - rot * 0.1], [0.96, 0.98, 0.98], [rnd(key + 4), rnd(key + 5) * 0.5, rnd(key + 4) + 0.35, rnd(key + 5) * 0.5 + 0.4], { a: 0.5 + 0.4 * f.amt });
    }
  }
  for (let i = 0; i < 40; i++) {   // the lip where the sheet leaves the stone
    const z = ROAD_Z0 - rnd(sd + i * 5) * wl, w = 0.2 + 0.7 * rnd(sd + i * 7), l = 0.3 + 0.9 * rnd(sd + i * 9);
    foamG.quad([W - 0.5, TOPY + 0.045, z + l], [W + 0.06, TOPY + 0.045, z + l], [W + 0.06, TOPY + 0.045, z - l], [W - 0.5, TOPY + 0.045, z - l], [0.95, 0.97, 0.97], [rnd(i) * 0.6, 0.1 + rnd(i + 1) * 0.4, rnd(i) * 0.6 + w * 0.5, 0.5 + rnd(i + 1) * 0.4], { a: [0, 0.6, 0.6, 0] });
  }
  for (let i = 0; i < 60; i++) {   // the foam line where the sheet meets the sea along the right edge
    const z = ROAD_Z0 - (i + rnd(sd + i)) * (wl / 60), l = 1.2 + 1.8 * rnd(sd + i * 3), w = 0.5 + 0.7 * rnd(sd + i * 5);
    foamG.quad([W - 0.1, 0.2, z + l], [W + w + 0.4, 0.2, z + l], [W + w + 0.4, 0.2, z - l], [W - 0.1, 0.2, z - l], [0.97, 0.98, 0.98], [rnd(i + 77), rnd(i + 78) * 0.5, rnd(i + 77) + 0.4, rnd(i + 78) * 0.5 + 0.45], { a: [0.9, 0.5, 0.5, 0.9] });
  }
  const foam = foamG.mesh(R, FM, { name: "road-foam", order: 7, offset: 1 });
  const laceG = new Geo(true);
  for (let i = 0; i < 70; i++) {
    const z = ROAD_Z0 + 2 - (i / 70) * (wl + 4) + (rnd(sd + i) - 0.5) * 1.2, w = 0.8 + 1.6 * rnd(sd + i * 3), l = 0.7 + 1.6 * rnd(sd + i * 5);
    laceG.quad([-W - w, 0.2, z + l], [-W + 0.02, 0.2, z + l], [-W + 0.02, 0.2, z - l], [-W - w, 0.2, z - l], [0.95, 0.97, 0.97], [rnd(i + 4), rnd(i + 5) * 0.5, rnd(i + 4) + 0.4, rnd(i + 5) * 0.5 + 0.45], { a: [0, 0.75, 0.75, 0] });
  }
  const lace = laceG.mesh(R, FM, { name: "road-lace", order: 7, offset: 1 });
  const tongG = new Geo(true), tongB = new Geo(true);
  for (const [G2, ph] of [[tongG, 0], [tongB, 1]]) for (let i = 0; i < 26; i++) {
    const z = ROAD_Z0 - (i + rnd(sd + i * 3 + ph * 50)) * (wl / 26), l = 0.5 + 1.2 * rnd(sd + i * 5 + ph), key = i + ph * 40;
    G2.quad([-W - 0.03, 0, z + l], [-W - 0.03, 0, z - l], [-W - 0.03, 1, z - l], [-W - 0.03, 1, z + l], [0.96, 0.98, 0.98], [rnd(key) * 0.6, 0.1, rnd(key) * 0.6 + 0.3, 0.55], { a: [0.9, 0.9, 0.0, 0.0] });
    G2.quad([-W - 0.03, 1, z + l], [-W - 0.03, 1, z - l], [-W + 0.9, 1.02, z - l], [-W + 0.9, 1.02, z + l], [0.96, 0.98, 0.98], [rnd(key + 7) * 0.6, 0.1, rnd(key + 7) * 0.6 + 0.3, 0.55], { a: [0.0, 0.0, 0.0, 0.0] });
  }
  const tongues = [tongG.mesh(R, FM, { name: "road-tongues-a", order: 8, offset: 1 }), tongB.mesh(R, FM, { name: "road-tongues-b", order: 8, offset: 1 })];
  tongues.forEach((m) => { m.geometry.translate(0, 0, 0); });


  return { grip: 0, apply(ps, t) {
    const w = clamp(num(ps, S, "water", 0.6)), tt = t ?? 0, on = w > 0.01;
    sheet.visible = on; falls.visible = on; foam.visible = on;
    if (on) {
      sheet.position.y = TOPY + 0.025 + 0.12 * w; sheet.material.opacity = clamp(0.3 + 0.85 * w, 0, 1); sheet.material.map.offset.x = -tt * (0.35 + 0.5 * w);
      falls.material.opacity = clamp(0.25 + 0.9 * w, 0, 1); falls.material.map.offset.y = tt * (1.2 + 0.8 * w);
      foam.material.opacity = clamp(0.25 + 0.7 * w, 0, 1) * (0.85 + 0.15 * Math.sin(tt * 3.1)); foam.material.map.offset.x = tt * 0.06;
    }
    tongues.forEach((m, q) => { const ph = Math.max(0, Math.sin(tt * 1.5 + q * 3.14159)); m.scale.y = 0.05 + 0.75 * ph; m.position.y = TOPY - 1 + 0; m.material.opacity = 0.9 * Math.min(1, ph * 2.5); m.position.y = 0; });
    lace.material.opacity = 0.55 + 0.35 * Math.sin(tt * 1.7); lace.position.x = 0.35 * Math.sin(tt * 1.7 - 0.6); lace.material.map.offset.x = tt * 0.03;
  } };
}

// ================================================================================================================ STORMCITY
// the wall is one straight diagonal run: u along it (0 where it crosses x 0), w out toward the camera. It runs from about (-260, -330) to (+75, -55).
const WALLH = 12, WALLT = 4, TXX = 0.7767, TZZ = 0.6299, NX = -0.6299, NZ = 0.7767, WZ_X0 = -119.2, GATE_Z = -105;
const wp = (u, w = 0) => [u * TXX + w * NX, WZ_X0 + u * TZZ + w * NZ];
const wallZ = (x) => WZ_X0 + Math.max(-262, Math.min(78, x)) * (TZZ / TXX) + (x < -262 ? 0 : 0);

function brassTex() {
  return once("brass", () => {
    const [c, g] = canvas(1024, 1024);   // 9 m x 12 m: 3 x 3 plates of 3 x 4 m
    const BR = ["#b8923a", "#a8842e", "#c29c42", "#9c7a30", "#b08a3a"];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const key = r * 7 + q * 3, x0 = q * 341.3, y0 = r * 341.3, w = 341.3, h = 341.3, base = BR[Math.floor(rnd(key) * BR.length)], k = 0.86 + 0.26 * rnd(key + 1);
      const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h); gr.addColorStop(0, cs(base, k * 1.15)); gr.addColorStop(0.5, cs(base, k * 0.98)); gr.addColorStop(1, cs(base, k * 0.8)); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      // dents and patina blotches
      for (let b = 0; b < 7; b++) { const bx = x0 + w * rnd(key + b + 3), by = y0 + h * rnd(key + b + 9), br = 14 + 40 * rnd(key + b + 15), rg = g.createRadialGradient(bx, by, 0, bx, by, br); const dark = rnd(key + b + 21) > 0.4; rg.addColorStop(0, dark ? "rgba(70,40,20,0.3)" : "rgba(255,230,150,0.2)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(bx - br, by - br, br * 2, br * 2); }
      // verdigris at the bottom and at seams
      const vg = g.createLinearGradient(0, y0 + h * 0.7, 0, y0 + h); vg.addColorStop(0, "rgba(95,138,106,0)"); vg.addColorStop(1, "rgba(95,138,106,0.35)"); g.fillStyle = vg; g.fillRect(x0, y0 + h * 0.7, w, h * 0.3);
      // rivets round the edge, a hot highlight on each, a rust run under each
      const nr = 16;
      for (let s = 0; s < 4; s++) for (let i = 0; i < nr; i++) {
        const f = (i + 0.5) / nr, px = s === 0 ? x0 + f * w : s === 1 ? x0 + w - 11 : s === 2 ? x0 + f * w : x0 + 11, py = s === 0 ? y0 + 11 : s === 1 ? y0 + f * h : s === 2 ? y0 + h - 11 : y0 + f * h;
        if (s === 1 && i === 0) continue;
        const rg = g.createRadialGradient(px - 1.5, py - 1.5, 0, px, py, 5.5); rg.addColorStop(0, "#fff0b0"); rg.addColorStop(0.5, "#c79a3e"); rg.addColorStop(1, "#5a4018"); g.fillStyle = rg; g.beginPath(); g.arc(px, py, 5, 0, TAU); g.fill();
        if (rnd(key + s * 31 + i) > 0.55) { const gr2 = g.createLinearGradient(0, py, 0, py + 22 + 28 * rnd(key + i)); gr2.addColorStop(0, "rgba(110,60,28,0.45)"); gr2.addColorStop(1, "rgba(110,60,28,0)"); g.fillStyle = gr2; g.fillRect(px - 1.8, py, 3.6, 50); }
      }
      g.strokeStyle = "rgba(34,22,10,0.85)"; g.lineWidth = 5; g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    }
    // rib every 9 m = the left edge of the tile
    g.fillStyle = "rgba(80,52,20,0.55)"; g.fillRect(0, 0, 14, 1024); g.fillStyle = "rgba(240,200,110,0.35)"; g.fillRect(14, 0, 4, 1024);
    return tex(c, { wrap: true });
  });
}
function ashlarTex() {
  return once("ashlar", () => {
    const [c, g] = canvas(512, 512), STO = ["#c9bba0", "#bdae92", "#d3c6ab", "#b3a58a", "#c2b49a"];   // 4 m x 4 m, 10 rows of 0.4
    g.fillStyle = "#6a6050"; g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 10; r++) for (let k = -1; k < 6; k++) {
      const key = r * 31 + k * 7 + 3, bw = 512 / 5, x0 = k * bw + (r % 2) * bw * 0.5, y0 = r * 51.2, base = STO[Math.floor(rnd(key) * 5)], kk = 0.9 + 0.22 * rnd(key + 1);
      const gr = g.createLinearGradient(x0, y0, x0, y0 + 51); gr.addColorStop(0, cs(base, kk * 1.08)); gr.addColorStop(1, cs(base, kk * 0.88)); g.fillStyle = gr; g.beginPath(); g.roundRect(x0 + 2, y0 + 2, bw - 4, 47, 4); g.fill();
      for (let q = 0; q < 5; q++) { g.fillStyle = cs("#5a4e3c", 1, 0.3); g.beginPath(); g.arc(x0 + bw * rnd(key + q + 5), y0 + 51 * rnd(key + q + 9), 0.8 + 1.8 * rnd(key + q + 12), 0, TAU); g.fill(); }
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = cs(rnd(i) > 0.5 ? "#7a8a50" : "#8a7a58", 1, 0.2); g.beginPath(); g.ellipse(rnd(i + 1) * 512, rnd(i + 2) * 512, 6 + 14 * rnd(i + 3), 2 + 4 * rnd(i + 4), 0, 0, TAU); g.fill(); }
    return tex(c, { wrap: true });
  });
}
// a white palace / house facade bay: 4 m x 4 m, arched windows, a gold string course
function facadeTex() {
  return once("facade", () => {
    const [c, g] = canvas(512, 512); g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 512, 512);
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(120,100,90,0.14)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    for (const [yy, hh] of [[48, 150], [276, 150]]) for (let q = 0; q < 2; q++) {
      const x = 56 + q * 256, w = 144, lit = rnd(yy + q * 5 + 1) > 0.55;
      g.fillStyle = lit ? "#e8a860" : "#4e5062"; g.beginPath(); g.moveTo(x, yy + hh); g.lineTo(x, yy + w / 2); g.arc(x + w / 2, yy + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, yy + hh); g.closePath(); g.fill();
      g.strokeStyle = "#c8c0ac"; g.lineWidth = 7; g.stroke(); g.fillStyle = "rgba(240,236,224,0.8)"; g.fillRect(x + w / 2 - 2, yy + w / 2, 4, hh - w / 2);
    }
    g.fillStyle = "#c9a040"; g.fillRect(0, 238, 512, 14); g.fillRect(0, 480, 512, 16); g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 252, 512, 8);
    for (let i = 0; i < 25; i++) { g.fillStyle = cs("#8a7a68", 1, 0.12); g.beginPath(); g.ellipse(rnd(i) * 512, rnd(i + 1) * 512, 6 + 12 * rnd(i + 2), 2 + 3 * rnd(i + 3), 0, 0, TAU); g.fill(); }
    return tex(c, { wrap: true });
  });
}
// the storm sky, a dome of 4096 x 1024: u = 0.75 straight ahead (-z), growing to the left, v from the zenith to just below the horizon
function skyTex(sunAz) {
  return once("sky" + sunAz, () => {
    const W = 4096, H = 1024, [c, g] = canvas(W, H), TH = Math.PI / 2 + 0.08;
    const yOf = (el) => ((Math.PI / 2 - el * DEG) / TH) * H, xOf = (a) => (((0.75 + a / 360) % 1) + 1) % 1 * W, ppd = W / 360;
    const gr = g.createLinearGradient(0, 0, 0, H);
    for (const [el, col] of [[90, "#2a2432"], [55, "#3e3446"], [32, "#6a4a52"], [18, "#a85c44"], [8, "#d4743a"], [2, "#f09444"], [0, "#f8b060"], [-4, "#b0703c"]]) gr.addColorStop(clamp(yOf(el) / H), col);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the low sun's glow left, the whole horizon warm
    g.globalCompositeOperation = "lighter";
    for (const [da, el, rx, ry, col, a] of [[0, 3, 62, 14, "#ffb060", 0.7], [0, 2, 30, 6, "#ffd890", 0.7], [0, 1, 110, 22, "#d8703a", 0.45], [-40, 4, 70, 12, "#c06030", 0.3], [60, 3, 70, 12, "#c06030", 0.3]]) {
      const x = xOf(sunAz + da), y = yOf(el); for (const dx of [-W, 0, W]) { g.save(); g.translate(x + dx, y); g.scale(rx * ppd / (ry * ppd), 1); const rg = g.createRadialGradient(0, 0, 0, 0, 0, ry * ppd); rg.addColorStop(0, cs(col, 1, a)); rg.addColorStop(1, cs(col, 1, 0)); g.fillStyle = rg; g.fillRect(-ry * ppd, -ry * ppd, 2 * ry * ppd, 2 * ry * ppd); g.restore(); }
    }
    g.globalCompositeOperation = "source-over";
    const sx = xOf(sunAz), sy = yOf(3);
    // a cloud puff: its copper rim towards the sun, a slate body, a darker belly; lit k 0..1
    const puff = (x, y, r, lit, dark) => {
      const dx = sx - x, dy = sy - y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, rimC = mixc(hx("#7a5a6a"), hx("#ff9a48"), lit);
      const body = mixc(hx("#26222e"), hx("#5a4a5a"), clamp(0.1 + 0.45 * (1 - dark) + 0.25 * lit));
      let rg = g.createRadialGradient(x, y, r * 0.2, x, y, r); rg.addColorStop(0, cs(mul(body, 0.85), 1, 0.96)); rg.addColorStop(0.75, cs(body, 1, 0.8)); rg.addColorStop(1, cs(body, 1, 0)); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      const cx = x + ux * r * 0.42, cy = y + uy * r * 0.42; rg = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.62); rg.addColorStop(0, cs(rimC, 1, 0.62 * lit + 0.04)); rg.addColorStop(1, cs(rimC, 1, 0)); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * 0.98, 0, TAU); g.fill();
    };
    const bank = (a, el, wd, ht, n, seed, lit0, dark) => {
      for (let i = 0; i < n; i++) {
        const key = seed * 977 + i * 13, aa = a + (rnd(key) - 0.5) * wd, ee = el + (rnd(key + 1) - 0.5) * ht * (0.5 + rnd(key + 2)), r = (ht * ppd) * (0.3 + 0.55 * rnd(key + 3) ** 1.5) * (1 + 0.2 * Math.sin(i));
        const x = xOf(aa), y = yOf(Math.max(ee, 0.4)), da = Math.abs(((aa - sunAz + 540) % 360) - 180), lit = clamp(lit0 * (1 - da / 90) * (1 - ee / 40) + 0.12 * rnd(key + 4));
        for (const dx of [-W, 0, W]) puff(x + dx, y, r, lit, dark);
      }
    };
    // far low banks along the horizon first, then the big ones overhead (painter's order, far to near)
    for (let b = 0; b < 26; b++) { if (Math.abs(-150 + b * 14 - sunAz) < 30 && b % 3) continue; bank(-150 + b * 14, 1.6 + 1.5 * rnd(b), 18, 2.8, 16, b + 1, 0.9, 0.5); }
    for (let b = 0; b < 30; b++) { const a = -160 + b * 12 + rnd(b) * 8, el = 5 + 7 * rnd(b + 3); if (Math.abs(a - sunAz) < 45 && rnd(b + 4) > 0.2) continue; bank(a, el, 22, 6.5, 22, b + 40, 0.85, 0.7); }
    for (let b = 0; b < 30; b++) { if (rnd(b + 61) < 0.45) continue; const a = -170 + b * 12 + rnd(b + 9) * 6, el = 14 + 10 * rnd(b + 5); if (Math.abs(a - sunAz) < 30 && rnd(b + 6) > 0.35) continue; bank(a, el, 24, 9, 30, b + 100, 0.6, 0.85); }
    for (let b = 0; b < 36; b++) { if (rnd(b + 71) < 0.3) continue; const a = -180 + b * 10 + rnd(b + 12) * 6, el = 26 + 22 * rnd(b + 7); bank(a, el, 26, 12, 30, b + 160, 0.3, 0.9); }
    for (let b = 0; b < 20; b++) { const a = -180 + b * 18, el = 55 + 20 * rnd(b + 8); bank(a, el, 30, 16, 26, b + 230, 0.1, 1); }
    // long thin lit streaks in the rifts at the left, copper on slate
    g.globalCompositeOperation = "source-over";
    for (let i = 0; i < 80; i++) { const key = i * 17 + 5, a = sunAz + (rnd(key) - 0.5) * 100, el = 2 + 16 * rnd(key + 1) ** 1.3, x = xOf(a), y = yOf(el), l = (4 + 16 * rnd(key + 2)) * ppd, th = (0.2 + 0.5 * rnd(key + 3)) * ppd, lit = clamp(1 - Math.abs(a - sunAz) / 60);
      for (const dx of [-W, 0, W]) { const lg = g.createLinearGradient(x + dx - l / 2, 0, x + dx + l / 2, 0); lg.addColorStop(0, cs("#ffb060", 1, 0)); lg.addColorStop(0.5, cs("#ffb868", 1, 0.55 * lit + 0.1)); lg.addColorStop(1, cs("#ffb060", 1, 0)); g.fillStyle = lg; g.beginPath(); g.ellipse(x + dx, y, l / 2, th, 0, 0, TAU); g.fill(); } }
    // painted hatch: short dark strokes on the clouds, a rain veil far right
    g.lineCap = "round";
    for (let i = 0; i < 1400; i++) { const key = i * 11 + 3, a = -180 + 360 * rnd(key), el = 4 + 60 * rnd(key + 1) ** 1.2, x = xOf(a), y = yOf(el); g.strokeStyle = rnd(key + 2) > 0.3 ? cs("#16121c", 1, 0.03 + 0.05 * rnd(key + 3)) : cs("#f0a060", 1, 0.03 + 0.03 * (1 - el / 60)); g.lineWidth = 2 + 4 * rnd(key + 4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (10 + 22 * rnd(key + 5)), y + 6 * (rnd(key + 6) - 0.5)); g.stroke(); }
    // the sea's own haze comes from the sea prop; here a thin warm line right at the horizon
    const hg = g.createLinearGradient(0, yOf(2.5), 0, yOf(-3)); hg.addColorStop(0, "rgba(240,160,90,0)"); hg.addColorStop(0.6, "rgba(240,160,90,0.5)"); hg.addColorStop(1, "rgba(150,80,50,0.6)"); g.fillStyle = hg; g.fillRect(0, yOf(2.5), W, yOf(-3) - yOf(2.5));
    const t = tex(c, { wrap: true }); t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; return t;
  });
}

// ---- small builders for the city
function boulder(geo, cx, cy, cz, rx, ry, rz, seed, col, o = {}) {
  const n = o.n ?? 7, m = o.m ?? 5, pt = (i, j) => { const a = (i / n) * TAU, p = (j / m) * Math.PI - Math.PI / 2, k = 0.8 + 0.4 * rnd(seed + i * 5 + j * 11); return [cx + Math.cos(p) * Math.cos(a) * rx * k, cy + Math.sin(p) * ry * (0.7 + 0.5 * rnd(seed + j * 3)), cz + Math.cos(p) * Math.sin(a) * rz * k]; };
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
    const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], mid = [(q[0][0] + q[2][0]) / 2 - cx, (q[0][1] + q[2][1]) / 2 - cy, (q[0][2] + q[2][2]) / 2 - cz], l = Math.hypot(...mid) || 1;
    const top = clamp(mid[1] / l * 1.4 + 0.2), cc = o.moss ? mixc(col, [0.3, 0.42, 0.2], top * o.moss) : col;
    geo.quad(q[1], q[0], q[3], q[2], mul(cc, 0.84 + 0.3 * rnd(seed + i * 7 + j * 13)), [0, 0, 1, 1], { lit: o.lit ?? 0.62, n: [mid[0] / l, mid[1] / l, mid[2] / l] });
  }
}
function tree(geo, x, y, z, h, seed, cyp) {
  const g1 = [[0.2, 0.36, 0.18], [0.26, 0.42, 0.2], [0.17, 0.3, 0.17]][Math.floor(rnd(seed) * 3)];
  if (cyp) { geo.lathe([[h * 0.16, y], [h * 0.14, y + h * 0.5], [h * 0.07, y + h * 0.9], [0.01, y + h]], 5, x, z, g1, { lit: 0.6 }); return; }
  const r = h * 0.42;
  for (let q = 0; q < 2; q++) boulder(geo, x + (rnd(seed + q) - 0.5) * r * 0.6, y + h * 0.62 + (q - 0.5) * r * 0.4, z + (rnd(seed + q + 4) - 0.5) * r * 0.6, r * (0.8 + 0.3 * rnd(seed + q + 8)), r * 0.72, r * (0.8 + 0.3 * rnd(seed + q + 2)), seed * 7 + q, mul(g1, 0.9 + 0.3 * q / 3), { lit: 0.58, n: 5, m: 3 });
}
// a gold dome / spire on a drum: lathe in the evening gold
function goldCap(geo, x, y, z, r, h, sp, sd) {
  const g1 = [0.93, 0.72, 0.24];
  geo.lathe([[r * 0.98, y], [r * 1.12, y + h * 0.12], [r * 1.04, y + h * 0.3], [r * 0.7, y + h * 0.62], [r * 0.3, y + h * 0.88], [r * 0.12, y + h]], 12, x, z, g1, { lit: 0.62 });
  geo.lathe([[r * 0.1, y + h], [r * 0.14, y + h + sp * 0.18], [r * 0.06, y + h + sp * 0.5], [0.012, y + h + sp]], 6, x, z, [1.0, 0.82, 0.34], { lit: 0.7 });
  void sd;
}

function stormcity(P) {
  const S = P.spec, sd = (S.seed ?? 1) * 17, R = P.whole, sunAz = S.sun ?? 35;
  const brassG = new Geo(), stoneG = new Geo(), plain = new Geo(), gold = new Geo(), roof = new Geo(), facG = new Geo(), rockG = new Geo(), tunG = new Geo(), grassG = new Geo(), flagG = new Geo(), gateG = new Geo();
  const flags = [], N3 = [NX, 0, NZ], ASH = ashlarTex();
  const U0 = -335, U1 = 100, step = 4;
  // ---------------------------------------------------------------- the brass wall, a straight diagonal run: far and small on the left, near on the right
  for (let u = U0; u < U1; u += step) {
    const a = wp(u), b = wp(u + step), uA = (u - U0) / 9, uB = uA + step / 9, key = Math.floor((u - U0) / step), kk = 0.92 + 0.14 * rnd(sd + key), FY0 = 2.2;
    stoneG.quad([a[0], -1.2, a[1]], [b[0], -1.2, b[1]], [b[0], FY0, b[1]], [a[0], FY0, a[1]], [0.82, 0.78, 0.74], [uA * 9 / 4, 0, uB * 9 / 4, (FY0 + 1.2) / 4], { lit: 0.7, n: N3 });
    brassG.quad([a[0], FY0, a[1]], [b[0], FY0, b[1]], [b[0], WALLH, b[1]], [a[0], WALLH, a[1]], mul([1, 0.97, 0.92], kk), [uA, FY0 / 12, uB, 1], { lit: 0.8, n: N3 });
    const cj = 0.7, c0 = [a[0] + NX * cj, a[1] + NZ * cj], c1 = [b[0] + NX * cj, b[1] + NZ * cj];
    gold.quad([a[0], WALLH - 0.9, a[1]], [b[0], WALLH - 0.9, b[1]], [c1[0], WALLH - 0.5, c1[1]], [c0[0], WALLH - 0.5, c0[1]], [0.94, 0.76, 0.3], [0, 0, 1, 1], { lit: 0.7, n: [NX, -0.5, NZ] });
    gold.quad([c0[0], WALLH - 0.5, c0[1]], [c1[0], WALLH - 0.5, c1[1]], [c1[0], WALLH + 0.5, c1[1]], [c0[0], WALLH + 0.5, c0[1]], [0.97, 0.79, 0.32], [0, 0, 1, 1], { lit: 0.75, n: N3 });
    gold.quad([c0[0], WALLH + 0.5, c0[1]], [c1[0], WALLH + 0.5, c1[1]], [b[0] - NX * WALLT, WALLH + 0.5, b[1] - NZ * WALLT], [a[0] - NX * WALLT, WALLH + 0.5, a[1] - NZ * WALLT], [0.84, 0.66, 0.28], [0, 0, 1, 1], { lit: 0.9, n: [0, 1, 0] });
    for (let p = 0; p < 6; p++) { const f = (p + 0.5) / 6, px = lerp(a[0], b[0], f) + NX * 0.3, pz = lerp(a[1], b[1], f) + NZ * 0.3; gold.quad([px - TXX * 0.07, WALLH + 0.5, pz - TZZ * 0.07], [px + TXX * 0.07, WALLH + 0.5, pz + TZZ * 0.07], [px + TXX * 0.05, WALLH + 1.5, pz + TZZ * 0.05], [px - TXX * 0.05, WALLH + 1.5, pz - TZZ * 0.05], [0.9, 0.7, 0.28], [0, 0, 1, 1], { lit: 0.75, n: N3 }); }
    for (const yy of [0.7, 1.5]) gold.quad([a[0] + NX * 0.3, WALLH + yy, a[1] + NZ * 0.3], [b[0] + NX * 0.3, WALLH + yy, b[1] + NZ * 0.3], [b[0] + NX * 0.3, WALLH + yy + 0.15, b[1] + NZ * 0.3], [a[0] + NX * 0.3, WALLH + yy + 0.15, a[1] + NZ * 0.3], [1, 0.82, 0.34], [0, 0, 1, 1], { lit: 0.8, n: N3 });
  }
  // ---------------------------------------------------------------- towers: slender pale stone, balconies, gold cupolas, red pennants, every 40 m along the wall
  const TU = [-14000]; TU.length = 0;
  for (let i = 0; i < 9; i++) TU.push(34 + 40 * i - 40 * 0, -(46 + 40 * i)); // 34, 74 ... and -46, -86 ...
  TU.push(...[]);
  TU.filter((u) => u <= 96 && u > U0 + 8).forEach((u, ti) => {
    const b = wp(u), ang = Math.atan2(NX, NZ), cosA = Math.cos(ang), sinA = Math.sin(ang), hw = 2.2, key = sd + ti * 9, TH = 37 + 3 * rnd(key);
    const tr = (px, py, pz) => [b[0] + px * cosA + pz * sinA, py, b[1] - px * sinA + pz * cosA];
    const face = (a, bb, c, d, col, uv, nrm) => { const q = [tr(...a), tr(...bb), tr(...c), tr(...d)]; stoneG.quad(q[0], q[1], q[2], q[3], col, uv, { lit: 0.72, n: [nrm[0] * cosA + nrm[2] * sinA, nrm[1], -nrm[0] * sinA + nrm[2] * cosA] }); };
    const zf = 1.9, zbk = -3.4, y0 = 1.0, h = TH - 6;
    face([-hw, y0, zf], [hw, y0, zf], [hw, h, zf], [-hw, h, zf], [1, 0.97, 0.92], [0, y0 / 4, 2 * hw / 4, h / 4], [0, 0, 1]);
    face([hw, y0, zf], [hw, y0, zbk], [hw, h, zbk], [hw, h, zf], [0.8, 0.76, 0.78], [0, y0 / 4, 5.3 / 4, h / 4], [1, 0, 0]);
    face([-hw, y0, zbk], [-hw, y0, zf], [-hw, h, zf], [-hw, h, zbk], [1.08, 0.94, 0.82], [0, y0 / 4, 5.3 / 4, h / 4], [-1, 0, 0]);
    for (const sx of [-1, 1]) face([sx * hw, y0, zf + 0.02], [sx * (hw - 0.45), y0, zf + 0.02], [sx * (hw - 0.45), h, zf + 0.02], [sx * hw, h, zf + 0.02], [0.84, 0.78, 0.68], [0, 0, 1, 1], [0, 0, 1]);
    for (const wy of [h * 0.3, h * 0.55, h * 0.78]) face([-0.25, wy, zf + 0.03], [0.25, wy, zf + 0.03], [0.25, wy + 1.9, zf + 0.03], [-0.25, wy + 1.9, zf + 0.03], [0.1, 0.1, 0.13], [0, 0, 1, 1], [0, 0, 1]);
    // balconies: a gold-edged slab sticking out with a rail, at two levels and at the top
    for (const by of [h * 0.62, h]) { const bw = hw + 0.7, bz = zf + 0.7; face([-bw, by, bz], [bw, by, bz], [bw, by + 0.4, bz], [-bw, by + 0.4, bz], [0.92, 0.74, 0.3], [0, 0, 1, 1], [0, 0, 1]); face([-bw, by + 0.4, bz], [bw, by + 0.4, bz], [bw, by + 0.4, zf - 1], [-bw, by + 0.4, zf - 1], [0.78, 0.7, 0.58], [0, 0, 1, 1], [0, 1, 0]); face([-bw, by + 1.2, bz], [bw, by + 1.2, bz], [bw, by + 1.35, bz], [-bw, by + 1.35, bz], [1, 0.82, 0.34], [0, 0, 1, 1], [0, 0, 1]); for (let q = -3; q <= 3; q++) face([q * bw / 3.2 - 0.05, by + 0.4, bz], [q * bw / 3.2 + 0.05, by + 0.4, bz], [q * bw / 3.2 + 0.05, by + 1.2, bz], [q * bw / 3.2 - 0.05, by + 1.2, bz], [0.9, 0.7, 0.28], [0, 0, 1, 1], [0, 0, 1]); }
    const c0 = tr(0, 0, -0.7), lanR = 1.6;
    plain.lathe([[lanR * 1.2, h + 0.4], [lanR * 1.2, h + 0.7], [lanR, h + 0.7], [lanR, h + 4.2]], 8, c0[0], c0[2], [0.84, 0.76, 0.64], { lit: 0.65 });
    for (let a = 0; a < 8; a++) { const th = (a / 8) * TAU + 0.39, px = c0[0] + Math.cos(th) * lanR * 1.01, pz = c0[2] + Math.sin(th) * lanR * 1.01, tx2 = -Math.sin(th) * 0.35, tz2 = Math.cos(th) * 0.35; plain.quad([px - tx2, h + 1.2, pz - tz2], [px + tx2, h + 1.2, pz + tz2], [px + tx2, h + 3.6, pz + tz2], [px - tx2, h + 3.6, pz - tz2], [0.2, 0.17, 0.2], [0, 0, 1, 1], { lit: 0.8, n: [Math.cos(th), 0, Math.sin(th)] }); }
    goldCap(gold, c0[0], h + 4.2, c0[2], lanR * 1.2, 3.8, 2.6, key);
    const py = h + 4.2 + 3.8 + 2.6;
    plain.quad([c0[0] - 0.03, py, c0[2]], [c0[0] + 0.03, py, c0[2]], [c0[0] + 0.03, py + 3.6, c0[2]], [c0[0] - 0.03, py + 3.6, c0[2]], [0.3, 0.26, 0.24], [0, 0, 1, 1], { lit: 0.8, n: [0, 0, 1] });
    const fl = { vi: flagG.N, x: c0[0] + 0.03, y: py + 1.9, z: c0[2], L: 3.8 + 0.8 * rnd(key + 2), H: 1.6, ph: rnd(key + 3) * TAU, amp: 0.55, cols: 10 };
    for (let i = 0; i < fl.cols; i++) flagG.quad([0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [[0.78, 0.18, 0.14], [0.66, 0.12, 0.1]][i % 2], [0, 0, 1, 1], { k: 1 });
    flags.push(fl);
    face([-hw - 0.5, -1.2, zf + 0.9], [hw + 0.5, -1.2, zf + 0.9], [hw + 0.5, y0 + 0.4, zf + 0.9], [-hw - 0.5, y0 + 0.4, zf + 0.9], [0.82, 0.78, 0.72], [0, 0, 1.5, 1], [0, 0, 1]);
    face([-hw - 0.5, y0 + 0.4, zf + 0.9], [hw + 0.5, y0 + 0.4, zf + 0.9], [hw, y0 + 0.4, zf], [-hw, y0 + 0.4, zf], [0.7, 0.66, 0.6], [0, 0, 1, 1], [0, 1, 0]);
  });
  // ---------------------------------------------------------------- the gatehouse: a frontal stone block on the wall where the road ends, the arch, the tunnel lit warm
  {
    const ZF = GATE_Z, GR = 4.0, SP = TOPY + 6.4, ringO = 5.5, HH = 15, HW = 11, DEP = 26;
    const GA = ashlarTex();
    const gq = (a, b, c, d, col, uv, n) => gateG.quad(a, b, c, d, col, uv, { lit: 0.72, n });
    // side faces and top
    gq([HW, -1.2, ZF], [HW, -1.2, ZF - DEP], [HW, HH, ZF - DEP], [HW, HH, ZF], [0.78, 0.74, 0.76], [0, 0, DEP / 4, (HH + 1.2) / 4], [1, 0, 0]);
    gq([-HW, -1.2, ZF - DEP], [-HW, -1.2, ZF], [-HW, HH, ZF], [-HW, HH, ZF - DEP], [1.06, 0.92, 0.8], [0, 0, DEP / 4, (HH + 1.2) / 4], [-1, 0, 0]);
    gq([-HW, HH, ZF], [HW, HH, ZF], [HW, HH, ZF - DEP], [-HW, HH, ZF - DEP], [0.8, 0.72, 0.6], [0, 0, 1, 1], [0, 1, 0]);
    // the front, column by column round the arch
    const nC = 44, xs0 = -HW;
    for (let i = 0; i < nC; i++) {
      const xa = xs0 + (2 * HW * i) / nC, xb = xs0 + (2 * HW * (i + 1)) / nC, xm = (xa + xb) / 2, ring = ringO * ringO - xm * xm, yb = ring > 0 ? SP + Math.sqrt(ring) - 0.02 : -1.2;
      if (yb < HH) gq([xa, yb, ZF], [xb, yb, ZF], [xb, HH, ZF], [xa, HH, ZF], mul([1, 0.97, 0.92], 0.92 + 0.12 * rnd(sd + i)), [xa / 4, yb / 4, xb / 4, HH / 4], [0, 0, 1]);
    }
    const nR = 20;
    for (let i = 0; i < nR; i++) {
      const a0 = Math.PI * (i / nR), a1 = Math.PI * ((i + 1) / nR), key = sd + i * 5, c = mul([0.74, 0.68, 0.58], 0.84 + 0.32 * rnd(key)), r1 = ringO + 0.05 * rnd(key + 2);
      gq([Math.cos(a1) * GR, SP + Math.sin(a1) * GR, ZF + 0.08], [Math.cos(a0) * GR, SP + Math.sin(a0) * GR, ZF + 0.08], [Math.cos(a0) * r1, SP + Math.sin(a0) * r1, ZF + 0.08], [Math.cos(a1) * r1, SP + Math.sin(a1) * r1, ZF + 0.08], c, [0, 0, 1, 1], [0, 0, 1]);
    }
    for (const sg of [-1, 1]) for (let j = 0; j < 7; j++) { const key = sd + j * 7 + sg * 3, c = mul([0.76, 0.7, 0.6], 0.84 + 0.3 * rnd(key)), x0 = sg * GR, x1 = sg * ringO, y0 = 1.0 + j * 0.9; gq(sg > 0 ? [x0, y0, ZF + 0.08] : [x1, y0, ZF + 0.08], sg > 0 ? [x1, y0, ZF + 0.08] : [x0, y0, ZF + 0.08], sg > 0 ? [x1, y0 + 0.9, ZF + 0.08] : [x0, y0 + 0.9, ZF + 0.08], sg > 0 ? [x0, y0 + 0.9, ZF + 0.08] : [x1, y0 + 0.9, ZF + 0.08], c, [0, 0, 1, 1], [0, 0, 1]); }
    // gold cornice, rail and two corner turrets with cupolas
    gold.box(-HW - 0.6, HH - 0.9, ZF - DEP, HW + 0.6, HH + 0.4, ZF + 0.7, [0.94, 0.76, 0.3], { tm: 4, lit: 0.72 });
    for (let q = -10; q <= 10; q++) gold.box(q * 1.05 - 0.07, HH + 0.4, ZF + 0.3, q * 1.05 + 0.07, HH + 1.5, ZF + 0.44, [0.9, 0.7, 0.28], { lit: 0.75 });
    gold.box(-HW - 0.2, HH + 1.5, ZF + 0.3, HW + 0.2, HH + 1.66, ZF + 0.46, [1, 0.82, 0.34], { lit: 0.8 });
    for (const sg of [-1, 1]) { plain.lathe([[2.2, HH], [2.0, HH + 7], [2.2, HH + 7.4]], 8, sg * (HW - 1.4), ZF - 3.4, [0.88, 0.8, 0.68], { lit: 0.7 }); goldCap(gold, sg * (HW - 1.4), HH + 7.4, ZF - 3.4, 2.5, 4.4, 3.2, sg); }
    goldCap(gold, 0, HH + 0.4, ZF - 12, 5.5, 8, 6, 9);
    // the tunnel: walls, a vault, the road's floor at the road's height, warm light toward the court
    const zIn = ZF, zEnd = ZF - DEP + 0.5, warm = (t) => mixc([0.16, 0.12, 0.14], [1.0, 0.7, 0.4], t);
    for (let s = 0; s < 7; s++) {
      const za = lerp(zIn, zEnd, s / 7), zb = lerp(zIn, zEnd, (s + 1) / 7), ta = (s / 7) ** 1.6, tb = ((s + 1) / 7) ** 1.6;
      for (const sg of [-1, 1]) tunG.quad(sg > 0 ? [GR, TOPY, zb] : [-GR, TOPY, za], sg > 0 ? [GR, TOPY, za] : [-GR, TOPY, zb], sg > 0 ? [GR, SP, za] : [-GR, SP, zb], sg > 0 ? [GR, SP, zb] : [-GR, SP, za], sg > 0 ? [warm(tb), warm(ta), warm(ta), warm(tb)] : [warm(ta), warm(tb), warm(tb), warm(ta)], [0, 0, 1, 1]);
      for (let i = 0; i < 10; i++) { const a0 = Math.PI * (i / 10), a1 = Math.PI * ((i + 1) / 10); tunG.quad([Math.cos(a1) * GR, SP + Math.sin(a1) * GR, za], [Math.cos(a1) * GR, SP + Math.sin(a1) * GR, zb], [Math.cos(a0) * GR, SP + Math.sin(a0) * GR, zb], [Math.cos(a0) * GR, SP + Math.sin(a0) * GR, za], [warm(ta * 0.9), warm(tb * 0.9), warm(tb * 0.9), warm(ta * 0.9)], [0, 0, 1, 1]); }
      const fa = warm(ta).map((v, i) => v * [0.8, 0.7, 0.6][i]), fb = warm(tb).map((v, i) => v * [0.8, 0.7, 0.6][i]);
      tunG.quad([-GR, TOPY, za], [GR, TOPY, za], [GR, TOPY, zb], [-GR, TOPY, zb], [fa, fa, fb, fb], [0, 0, 1, 1]);
    }
    tunG.quad([-GR, TOPY, zEnd - 0.2], [GR, TOPY, zEnd - 0.2], [GR, SP + GR, zEnd - 0.2], [-GR, SP + GR, zEnd - 0.2], [[1, 0.76, 0.46], [1, 0.76, 0.46], [1, 0.9, 0.7], [1, 0.9, 0.7]], [0, 0, 1, 1]);
    tunG.quad([-2.4, TOPY + 0.05, zEnd - 0.3], [2.4, TOPY + 0.05, zEnd - 0.3], [2.4, TOPY + 5.8, zEnd - 0.3], [-2.4, TOPY + 5.8, zEnd - 0.3], [[0.95, 0.88, 0.76], [0.95, 0.88, 0.76], [1, 0.95, 0.85], [1, 0.95, 0.85]], [0, 0, 1, 1]);
    for (let q = -2; q <= 2; q++) tunG.quad([q - 0.18, TOPY + 0.05, zEnd - 0.4], [q + 0.18, TOPY + 0.05, zEnd - 0.4], [q + 0.18, TOPY + 4.4, zEnd - 0.4], [q - 0.18, TOPY + 4.4, zEnd - 0.4], [0.62, 0.42, 0.3], [0, 0, 1, 1]);
    void GA;
  }
  // ---------------------------------------------------------------- the rocky headland at the wall's foot, shrubs, surf foam
  const foamG = new Geo(true);
  {
    const rockC = [[0.4, 0.37, 0.36], [0.5, 0.44, 0.38], [0.36, 0.36, 0.4], [0.54, 0.45, 0.36]];
    for (let i = 0; i < 420; i++) {
      const key = sd + i * 7, u = U0 + 20 + (U1 - U0 - 20) * rnd(key), off = 0.5 + (rnd(key + 1) ** 1.4) * 15, [x, z] = wp(u, off);
      if (Math.abs(x) < 10 && z > -135) continue;
      const r = 1.5 + 3.4 * rnd(key + 2) * (1 - off / 19), top = Math.max(0.3, 4.4 - off * 0.26 + rnd(key + 3) * 1.3);
      boulder(rockG, x, top - r * 0.6, z, r * (1 + rnd(key + 4)), r * 0.9, r * (0.8 + 0.5 * rnd(key + 5)), key, rockC[Math.floor(rnd(key + 6) * 4)], { moss: 0.3, lit: 0.62 });
      if (rnd(key + 7) > 0.55 && top > 1.2) { const sr = 0.6 + 1.2 * rnd(key + 8); boulder(grassG, x + (rnd(key + 9) - 0.5), top + sr * 0.2, z + (rnd(key + 10) - 0.5) * 1.2, sr * 1.3, sr * 0.8, sr, key * 3, [[0.24, 0.4, 0.2], [0.3, 0.46, 0.22], [0.2, 0.34, 0.2], [0.4, 0.46, 0.2]][Math.floor(rnd(key + 11) * 4)], { lit: 0.58, n: 5, m: 3 }); }
      if (off > 2) foamG.quad([x - r * 2.6, 0.2, z + r * 2.4], [x + r * 2.6, 0.2, z + r * 2.4], [x + r * 2.6, 0.2, z + r * 0.1], [x - r * 2.6, 0.2, z + r * 0.1], [0.96, 0.98, 0.98], [rnd(key + 12), 0.1, rnd(key + 12) + 0.4, 0.6], { a: [0, 0, 0.95, 0.95] });
    }
    for (let u = U0 + 10; u < U1; u += 6) { const key = sd + u * 3, [x, z] = wp(u, 14 + 5 * rnd(key)); if (Math.abs(x) < 12 && z > -135) continue; foamG.quad([x - 5, 0.22, z + 1.4], [x + 5, 0.22, z + 1.4], [x + 5, 0.22, z - 1.4], [x - 5, 0.22, z - 1.4], [0.94, 0.97, 0.97], [rnd(key), 0.1, rnd(key) + 0.4, 0.5], { a: [0.4, 0.4, 0.8, 0.8] }); }
    // a stone apron in front of the gatehouse where the road ends
    stoneG.quad([-12, 0.5, GATE_Z + 6], [12, 0.5, GATE_Z + 6], [12, 0.5, GATE_Z], [-12, 0.5, GATE_Z], [0.5, 0.46, 0.42], [0, 0, 1, 1]);
  }
  // ---------------------------------------------------------------- the land behind: the green hill, trees, houses, the palace of white halls and gold spires
  const HX = 30, HZ = -380;
  const hgt = (x, z) => {
    const wz = wallZ(x);
    if (z > wz - WALLT) return 5.5;
    const d = ((x - HX) / 190) ** 2 + ((z - HZ) / 180) ** 2, hill = 42 * Math.exp(-d * 1.0), ter = 3.2 * Math.sin(z * 0.045 + x * 0.02) + 2 * Math.sin(x * 0.03 - z * 0.02), far = clamp((-z - 150) / 250) * 14 * Math.exp(-(((x + 280) / 260) ** 2));
    return 5.5 + hill + ter * 0.5 + far;
  };
  {
    const gx0 = -560, gx1 = 400, gz1 = -660, nx = 72, nz = 60, cols = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = lerp(gx0, gx1, i / nx), z = lerp(wallZ(x) - 3, gz1, j / nz); cols.push([x, hgt(x, z), z]); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = cols[j * (nx + 1) + i], b = cols[j * (nx + 1) + i + 1], c = cols[(j + 1) * (nx + 1) + i + 1], d = cols[(j + 1) * (nx + 1) + i], key = sd + i * 13 + j * 29;
      if (Math.abs((a[0] + b[0]) / 2) < 13 && (a[2] + c[2]) / 2 > GATE_Z - 40) continue;
      const hh = (a[1] + c[1]) / 2, gcol = mixc([0.26, 0.42, 0.2], [0.46, 0.56, 0.26], clamp(hh / 60)), pat = 0.82 + 0.3 * rnd(key), haze = clamp((-a[2] - 150) / 500) * 0.35;
      grassG.quad(d, c, b, a, mixc(mul(gcol, pat), [0.52, 0.42, 0.5], haze), [0, 0, 1, 1], { lit: 0.6, n: [0, 1, 0] });
    }
    for (let i = 0; i < 900; i++) {
      const key = sd + i * 11, rr = rnd(key + 1), x = lerp(-460, 360, rnd(key)), z = lerp(wallZ(clamp(x, -260, 75)) - 12, -600, rr ** 0.8), y = hgt(x, z);
      if (Math.abs(x) < 16 && z > GATE_Z - 45) continue;
      if (y > 36 && Math.abs(x - HX) < 70 && z < -330 && z > -430 && rnd(key + 5) > 0.3) continue;
      tree(grassG, x, y - 0.3, z, 6 + 6 * rnd(key + 2), key, rnd(key + 3) > 0.7);
    }
    for (let i = 0; i < 90; i++) {
      const key = sd + i * 19, x = lerp(-250, 70, rnd(key)), dz = 24 + 100 * rnd(key + 1) ** 1.2, z = wallZ(x) - WALLT - dz;
      if (Math.abs(x) < 16 && dz < 60) continue;
      const y = hgt(x, z) - 0.4, w = 4 + 5 * rnd(key + 2), d = 4 + 4 * rnd(key + 3), h = 4 + 6 * rnd(key + 4), wc = mul([0.95, 0.92, 0.86], 0.86 + 0.18 * rnd(key + 5));
      facG.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, wc, { tm: 9, hide: "d", lit: 0.7 });
      const rh = 2 + 2 * rnd(key + 6), rc = [[0.76, 0.38, 0.22], [0.7, 0.34, 0.2], [0.82, 0.44, 0.26]][Math.floor(rnd(key + 7) * 3)];
      roof.quad([x - w / 2 - 0.4, y + h, z + d / 2 + 0.3], [x + w / 2 + 0.4, y + h, z + d / 2 + 0.3], [x + w / 2 + 0.4, y + h + rh, z], [x - w / 2 - 0.4, y + h + rh, z], rc, [0, 0, 3, 1], { lit: 0.62, n: [0, 0.6, 0.8] });
      roof.quad([x + w / 2 + 0.4, y + h, z - d / 2 - 0.3], [x - w / 2 - 0.4, y + h, z - d / 2 - 0.3], [x - w / 2 - 0.4, y + h + rh, z], [x + w / 2 + 0.4, y + h + rh, z], mul(rc, 0.8), [0, 0, 3, 1], { lit: 0.62, n: [0, 0.6, -0.8] });
      if (rnd(key + 8) > 0.75) goldCap(gold, x, y + h + rh, z, 1.1 + rnd(key + 9), 2.4, 1.6, key);
    }
    // the palace: long white halls with a great gold-domed centre, wings, and a crowd of slender gold spires
    const py = hgt(HX, HZ) - 1.5, K = 1.6, PX = HX, PZ = HZ, Y = (v) => py + v * K;
    const hall = (cx, cz, w, d, y0, h, rc) => { facG.box(PX + cx * K - w * K / 2, Y(y0), PZ + cz * K - d * K / 2, PX + cx * K + w * K / 2, Y(y0 + h), PZ + cz * K + d * K / 2, [0.98, 0.95, 0.9], { tm: 26, hide: "d", lit: 0.74 }); roof.box(PX + cx * K - w * K / 2 - 0.6, Y(y0 + h), PZ + cz * K - d * K / 2 - 0.6, PX + cx * K + w * K / 2 + 0.6, Y(y0 + h) + 1.2, PZ + cz * K + d * K / 2 + 0.6, rc ?? [0.6, 0.66, 0.74], { lit: 0.8 }); };
    hall(0, 0, 100, 30, 0, 20); hall(0, -2, 70, 26, 20, 10); hall(0, -3, 34, 24, 30, 14); hall(-62, -4, 26, 22, 4, 22); hall(62, -4, 26, 22, 4, 22);
    goldCap(gold, PX, Y(44) + 1.2, PZ - 3 * K, 7 * K, 12 * K, 14 * K, 3);
    for (const sg of [-1, 1]) { goldCap(gold, PX + sg * 62 * K, Y(26) + 1.2, PZ - 4 * K, 5.5 * K, 9 * K, 9 * K, 5 + sg); goldCap(gold, PX + sg * 24 * K, Y(30) + 1.2, PZ - 3 * K, 3 * K, 6 * K, 7 * K, 7 + sg); }
    for (let i = -7; i <= 7; i++) { const x = PX + i * 11 * K, h0 = 20 + (Math.abs(i) > 3 ? 0 : 10 * (i % 2 ? 0 : 0.6)), r = 1.4 * K; plain.lathe([[r, Y(h0) + 1.2], [r * 0.95, Y(h0 + 8) + 1.2]], 8, x, PZ + 8 * K, [0.96, 0.93, 0.86], { lit: 0.72 }); goldCap(gold, x, Y(h0 + 8) + 1.2, PZ + 8 * K, r * 1.1, 4 * K, (7 + 3 * rnd(i + 40)) * K, i); }
    for (const [dx, dz, h0, r, hh] of [[-40, 8, 20, 3, 18], [40, 8, 20, 3, 18], [-24, 9, 30, 2.6, 14], [24, 9, 30, 2.6, 14], [-84, 6, 4, 3, 18], [84, 6, 4, 3, 18]]) { plain.lathe([[r * K, Y(h0) + 1.2], [r * K * 0.92, Y(h0 + hh) + 1.2]], 10, PX + dx * K, PZ + dz * K, [0.96, 0.93, 0.86], { lit: 0.72 }); goldCap(gold, PX + dx * K, Y(h0 + hh) + 1.2, PZ + dz * K, r * K * 1.05, 5 * K, 12 * K, dx); }
  }
  // ---------------------------------------------------------------- meshes
  brassG.mesh(R, brassTex(), { name: "city-brass" });
  stoneG.mesh(R, ashlarTex(), { name: "city-stone" });
  gateG.mesh(R, ashlarTex(), { name: "city-gatehouse" });
  plain.mesh(R, null, { name: "city-plain" }); gold.mesh(R, null, { name: "city-gold" }); roof.mesh(R, null, { name: "city-roofs" });
  facG.mesh(R, facadeTex(), { name: "city-facades" }); rockG.mesh(R, null, { name: "city-rocks" }); grassG.mesh(R, null, { name: "city-hill" }); tunG.mesh(R, null, { name: "city-gate-tunnel" });
  const foamMesh = foamG.mesh(R, foamTex(), { name: "city-foam", order: 3, offset: 1 });
  const flagMesh = flagG.mesh(R, null, { name: "city-flags" });
  const upd = (t) => {
    if (!flagMesh) return;
    const a = flagMesh.geometry.attributes.position.array;
    for (const f of flags) for (let i = 0; i < f.cols; i++) {
      const s0 = i / f.cols, s1 = (i + 1) / f.cols, h0 = f.H * (1 - 0.8 * s0) * 0.5, h1 = f.H * (1 - 0.8 * s1) * 0.5;
      const ws = (s) => f.amp * s * Math.sin(15.6 * s - t * 9 + f.ph), dy = (s) => -0.3 * s * s * f.L + 0.12 * f.L * s * Math.sin(t * 7 + f.ph + 2 * s);
      const pts = [[s0, -h0], [s1, -h1], [s1, h1], [s0, h0]];
      for (let v = 0; v < 4; v++) { const o = (f.vi + i * 4 + v) * 3, s = pts[v][0]; a[o] = f.x + s * f.L; a[o + 1] = f.y + pts[v][1] + dy(s); a[o + 2] = f.z + ws(s); }
    }
    flagMesh.geometry.attributes.position.needsUpdate = true;
  };
  upd(0);
  // ---------------------------------------------------------------- the sky dome: the plate's own sky (cleaned, tiled, feathered) once it loads, a painted one until then
  let dome = null;
  if (S.sky !== false) {
    const m = new THREE.MeshBasicMaterial({ map: skyTex(sunAz), side: THREE.BackSide, depthWrite: false, depthTest: false, toneMapped: false, fog: false });
    m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false };
    dome = new THREE.Mesh(new THREE.SphereGeometry(1200, 64, 32, 0, TAU, 0, Math.PI / 2 + 0.08), m);
    dome.name = "city-sky"; dome.renderOrder = -1000; dome.frustumCulled = false;
    dome.userData.lookOnly = true; dome.userData.solid = false; dome.userData.surfaceOnly = true; dome.userData.steam = true; dome.castShadow = dome.receiveShadow = false;
    R.add(dome);
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/assets/props/atlantis/c/road-sky.png").then((img) => {
      const W = 4096, H = 1024, [c, g] = canvas(W, H), TH = Math.PI / 2 + 0.08, yOf = (el) => ((Math.PI / 2 - el * DEG) / TH) * H, xOf = (a) => (((0.75 + a / 360) % 1) + 1) % 1 * W;
      const top = g.createLinearGradient(0, 0, 0, yOf(0)); top.addColorStop(0, "#241e2a"); top.addColorStop(clamp(yOf(36) / yOf(0)), "#3c3042"); top.addColorStop(1, "#e89a50"); g.fillStyle = top; g.fillRect(0, 0, W, H);
      const tw = (W / 360) * 52, th = yOf(0) - yOf(36), sp = tw * 0.72, [tc, tg] = canvas(Math.round(tw), Math.round(th));
      for (let k = 0; k < Math.ceil(W / sp) + 1; k++) {
        tg.clearRect(0, 0, tc.width, tc.height); tg.save(); if (k % 2) { tg.translate(tc.width, 0); tg.scale(-1, 1); } tg.drawImage(img, 0, 0, tc.width, tc.height); tg.restore();
        tg.globalCompositeOperation = "destination-in"; const fe = tg.createLinearGradient(0, 0, tc.width, 0); fe.addColorStop(0, "rgba(0,0,0,0)"); fe.addColorStop(0.28, "rgba(0,0,0,1)"); fe.addColorStop(0.72, "rgba(0,0,0,1)"); fe.addColorStop(1, "rgba(0,0,0,0)"); tg.fillStyle = fe; tg.fillRect(0, 0, tc.width, tc.height);
        const fv = tg.createLinearGradient(0, 0, 0, tc.height); fv.addColorStop(0, "rgba(0,0,0,0)"); fv.addColorStop(0.18, "rgba(0,0,0,1)"); fv.addColorStop(1, "rgba(0,0,0,1)"); tg.fillStyle = fv; tg.fillRect(0, 0, tc.width, tc.height); tg.globalCompositeOperation = "source-over";
        const x0 = xOf(sunAz + 62) + k * sp; for (const dx of [0, -W]) g.drawImage(tc, x0 + dx, yOf(36));
      }
      const bot = g.createLinearGradient(0, yOf(0), 0, yOf(-4.6)); bot.addColorStop(0, "rgba(240,150,80,0.9)"); bot.addColorStop(1, "rgba(120,70,50,1)"); g.fillStyle = bot; g.fillRect(0, yOf(0), W, H - yOf(0));
      const t = tex(c, { wrap: true }); t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; m.map = t; m.needsUpdate = true;
    }).catch(() => {}));
    let s = R; while (s.parent) s = s.parent;
    if (s.isScene) {
      const reg = (s.userData.cRoadHooks ||= { list: new Set(), on: false });
      if (!reg.on) { reg.on = true; const prev = s.onBeforeRender; s.onBeforeRender = function (rn, sc, cam) { if (prev) prev.apply(this, arguments); for (const f of reg.list) f(cam); }; }
      reg.list.add((cam) => { if (cam && cam.isPerspectiveCamera) { const p = R.worldToLocal(cam.getWorldPosition(new THREE.Vector3())); dome.position.set(p.x, 0, p.z); } });
    }
  }
  return { grip: 0, apply(ps, t) {
    const tt = t ?? 0; upd(tt);
    if (dome) dome.material.map.offset.x = tt * 0.0009;
    if (foamMesh) foamMesh.material.opacity = 0.75 + 0.2 * Math.sin(tt * 1.3);
  } };
}

// ================================================================================================================ STORMSURF
// our own storm water for the first 200 m round the road: teal swell, big on the right (the open sea side), small on the left, crests with white foam, a foam
// band where it breaks on the road. Deterministic: uTime only. spec.rx 210, rz 150, cz -110 (extent and centre in z, local).
const SURF_V = `uniform float uTime; varying vec3 vW; varying float vH; varying float vA; varying vec2 vXZ; varying vec3 vN;
float ampAt(float x){ return mix(0.3, 0.8, smoothstep(2.5, 20.0, -x)) + 1.2 * smoothstep(2.0, 14.0, x); }
void main(){
  vec2 p = position.xz; float A = ampAt(p.x);
  vec2 d1 = normalize(vec2(-0.95, 0.3)), d2 = normalize(vec2(-0.7, -0.6)), d3 = normalize(vec2(-0.5, 0.85)), d4 = normalize(vec2(-0.9, -0.2));
  float f1 = dot(d1, p) * 0.22 - uTime * 1.5, f2 = dot(d2, p) * 0.5 - uTime * 2.1 + 1.3, f3 = dot(d3, p) * 1.05 - uTime * 2.8 + 2.2, f4 = dot(d4, p) * 1.9 - uTime * 3.6 + 0.7;
  float s = 0.4 * sin(f1) + 0.3 * sin(f2) + 0.2 * sin(f3) + 0.1 * sin(f4);
  float h = A * (0.5 + 0.5 * s);
  vec2 g = A * 0.5 * (0.4 * cos(f1) * 0.22 * d1 + 0.3 * cos(f2) * 0.5 * d2 + 0.2 * cos(f3) * 1.05 * d3 + 0.1 * cos(f4) * 1.9 * d4);
  vN = normalize(vec3(-g.x, 1.0, -g.y)); vH = h / A; vXZ = p; vA = A;
  vec3 pos = vec3(p.x, h, p.y); vec4 w = modelMatrix * vec4(pos, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SURF_F = `uniform float uTime; uniform vec3 uDeep, uLit, uFoam, uCopper, uSlate; uniform vec4 uExt; varying vec3 vW; varying float vH; varying float vA; varying vec2 vXZ; varying vec3 vN;
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float hn = clamp(vH, 0.0, 1.0);
  vec3 c = mix(uDeep, uLit, smoothstep(0.1, 0.8, hn));
  c = mix(c, c * 1.5 + vec3(0.02, 0.05, 0.05), smoothstep(0.45, 0.95, hn) * 0.5);
  float n1 = vn(vXZ * vec2(0.9, 0.5) + vec2(uTime * 0.7, 0.0)), n2 = vn(vXZ * 2.6 + vec2(uTime * 1.4, uTime * 0.3)), n3 = vn(vXZ * 7.0 - vec2(uTime * 2.0, 0.0));
  float bigWave = smoothstep(0.8, 3.0, vA);
  float crest = smoothstep(0.55, 0.9, hn + 0.2 * (n1 - 0.5)) * (0.55 + 0.45 * bigWave);
  float foam = crest * smoothstep(0.25, 0.7, n2 * 0.7 + n3 * 0.5);
  float lace = smoothstep(0.55, 0.8, n2 * 0.6 + n3 * 0.5) * smoothstep(0.35, 0.7, hn) * 0.5 * bigWave;
  float roadBand = (1.0 - smoothstep(1.0, 4.0, abs(vXZ.x))) * smoothstep(0.35, 0.65, vn(vec2(vXZ.x * 1.2 + uTime * 0.5, vXZ.y * 0.8)) * 0.6 + n3 * 0.4);
  foam = clamp(foam + lace + roadBand * 0.8, 0.0, 1.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 sky = mix(uSlate, uCopper, smoothstep(0.0, 1.0, 0.5 - 0.6 * N.x + 0.35 * (n1 - 0.5)));
  c = mix(c, sky, clamp(fres * 0.4, 0.0, 0.5));
  c = mix(c, uFoam, foam);
  float fade = 1.0 - smoothstep(0.82, 1.0, length(vec2((vXZ.x - uExt.x) / uExt.z, (vXZ.y - uExt.y) / uExt.w)));
  gl_FragColor = vec4(c, fade);
  #include <colorspace_fragment>
}`;
function stormsurf(P) {
  const S = P.spec, rx = S.rx ?? 210, rz = S.rz ?? 150, cz = S.cz ?? -110;
  const U = { uTime: { value: 0 }, uDeep: { value: new THREE.Color("#1a3a4a") }, uLit: { value: new THREE.Color("#33707a") }, uFoam: { value: new THREE.Color("#eaf2f0") }, uCopper: { value: new THREE.Color("#d9884f") }, uSlate: { value: new THREE.Color("#5a4c5c") }, uExt: { value: new THREE.Vector4(0, cz, rx, rz) } };
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SURF_V, fragmentShader: SURF_F, transparent: true, depthWrite: true, side: THREE.DoubleSide });
  m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false };
  const me = new THREE.Mesh(new THREE.PlaneGeometry(2 * rx, 2 * rz, 240, 150).rotateX(-Math.PI / 2).translate(0, 0, cz), m);
  me.name = "stormsurf"; me.frustumCulled = false; me.renderOrder = 1;
  me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; me.userData.steam = true; me.castShadow = me.receiveShadow = false;
  P.whole.add(me);
  return { grip: 0, apply(ps, t) { U.uTime.value = t ?? 0; } };
}

export const C_ROAD_KINDS = { edgeroad2, stormcity, stormsurf };
export const C_ROAD_GRIPS = {};
