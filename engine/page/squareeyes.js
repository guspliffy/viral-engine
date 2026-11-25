import * as THREE from "three";

// SQUARE EYES (Kid vs Dad 03 "Square eyes", design: storyboards/series/kid-vs-dad/03-square-eyes/DESIGN.md sections 0, 1).
// A face layer on the frost.js pattern: not a face.js option and not a costume. Built with the character, only for an
// actor whose storyboard keys one of the four face keys below (potato.js setRig / constructor / apply, like frost), so
// every other clip draws exactly as before. Four face keys (timeline.js FACE_KEYS), all 0..1, default 0, blended like lidL:
//   { "who", "do": "face", "square": 0..1, "sqCorner": 0..1, "sqTall": 0..1, "sqPhone": 0..1, "dur" }
//   square    0 = the rig's eyes .. 1 = fully square (0.5 = a soft TV-tube box)
//   sqCorner  ONE corner: the character's LEFT eye (screen right), upper outer corner, 0 round .. 1 square (use with
//             square 0.02: the H3 flicker). The rig's lash flick on that corner fades with (1 - sqCorner)
//   sqTall    0 = 1:1 .. 1 = 1:2 tall (the brief's aspect = 1 + sqTall); must rest at 0
//   sqPhone   the phone dressing on tall eyes: dark bezel, notch, home bar, glowing screen (square 1, sqTall 1, sqPhone 1)
// On/off: on any frame where one of the four is above 0.001 the layer draws BOTH eyes and hides the rig's two eyes
// (eye.root.visible), otherwise the rig's eyes show untouched. Switch only on a cut or under shut lids; a shot with a
// visible morph or flicker holds square 0.02 from its first frame (looks round, layer on).
//
// Size, where the origin is: the layer reads every size and colour from the BUILT face (eye r = 0.08 x face size, the
// eye's oval, iris share, lash, flick, the white, iris, ink and skin materials), never the character file. Origin of each
// eye = the rig eye's own root (its place and turn copied every frame), z = metres out of that plane. Half-width
// a = mix(0.9 r, mix(0.82 b0, 0.50 b0, T), q), half-height b = mix(b0, mix(0.82 b0, b0, T), q), b0 = 0.9 r x oval
// (q = square, T = sqTall). At q 1 T 0 a sheet-cast eye is 0.121 m (Mash) / 0.111 m (Tato) square, Dad's phone eyes
// 0.110 x 0.221 m. Outline = a rounded rectangle with elliptical corners (q 0 is the rig's exact ellipse), each straight
// edge bulging 0.03 of its length x q x (1 - T); the two eyes are not copies (right eye corners x 0.9, left x 1.1; the
// top line thickest at 45 % / 55 % across). No hand holds it (nothing here is a prop).
// Parts (z in r, back to front): white 0.16 (rim rounded back over 0.05, walls to -0.30), frame ink tube on its front edge,
// iris +0.006, pupil +0.012, catch light +0.018 (q 1: a 4:3 TV reflection `#EAF4FF`, unlit), lids two skin plates 0.03 above
// the white (a flat roller blind from q 0.5), lid line (from upper closure 0.12), phone notch + home bar + screen glow.
// Lids, blink, gaze, pupil size, iris shrink and the wide-eye factors are read from the rig eye after face.set, so the acting
// carries over. Not supported: tears (face.shown keeps the rig's number), the rig's lower-lash tick (face.eye.corner) and lid tilt.
// Deterministic: every frame is a pure function of the face state and the rig eye (no clock, no random).

// the actor ids whose face actions key one of the four (potato.js builds the layer only for them)
export const SQ_KEYS = ["square", "sqCorner", "sqTall", "sqPhone"];
export function squareActors(sb) {
  const out = new Set();
  for (const a of sb?.actions || []) if (a && a.do === "face" && SQ_KEYS.some((k) => a[k] != null)) for (const w of [].concat(a.who)) out.add(w);
  return out;
}

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a, b, k) => a + (b - a) * k;
const DEG = Math.PI / 180;
const INK_PHONE = new THREE.Color("#23242C"), SCREEN = new THREE.Color("#E3EEFB"), SCREEN_LIGHT = "#8FD0FF", BAR = "#6A7080", TV = new THREE.Color("#EAF4FF"), WHITE = new THREE.Color("#ffffff");

// ---- the outline: 4 elliptical corner arcs (K + 1 points each) joined by 4 straight edges (M inner points each), CCW
const K = 8, M = 4, N = 4 * (K + 1) + 4 * M, R_TUBE = 8;
const SX = [1, -1, -1, 1], SY = [1, 1, -1, -1], TH0 = [0, 90, 180, 270].map((d) => d * DEG);   // corners: upper right, upper left, lower left, lower right
const EDGE_N = [[0, 1], [-1, 0], [0, -1], [1, 0]];   // the outward side of the edge after each corner
// fills xs, ys (length N); rx, ry: the four corner radii; bul: the edge bulge (share of the edge's length)
function outline(xs, ys, a, b, rx, ry, bul) {
  let n = 0;
  const arcEnd = [], arcStart = [];
  for (let c = 0; c < 4; c++) {
    const cx = SX[c] * (a - rx[c]), cy = SY[c] * (b - ry[c]);
    for (let j = 0; j <= K; j++) {
      const th = TH0[c] + (Math.PI / 2) * (j / K);
      xs[n] = cx + rx[c] * Math.cos(th); ys[n] = cy + ry[c] * Math.sin(th);
      if (j === 0) arcStart[c] = [xs[n], ys[n]];
      if (j === K) arcEnd[c] = [xs[n], ys[n]];
      n++;
    }
    // the straight edge after this corner, to the start of the next corner's arc (computed after all arcs: the next
    // corner's start is known from its own centre and radii)
    const c2 = (c + 1) % 4, th2 = TH0[c2], p1 = [SX[c2] * (a - rx[c2]) + rx[c2] * Math.cos(th2), SY[c2] * (b - ry[c2]) + ry[c2] * Math.sin(th2)];
    const p0 = [cx + rx[c] * Math.cos(TH0[c] + Math.PI / 2), cy + ry[c] * Math.sin(TH0[c] + Math.PI / 2)];
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    for (let m = 0; m < M; m++) {
      const t = (m + 1) / (M + 1), s = bul * len * 4 * t * (1 - t);
      xs[n] = mix(p0[0], p1[0], t) + EDGE_N[c][0] * s; ys[n] = mix(p0[1], p1[1], t) + EDGE_N[c][1] * s; n++;
    }
  }
  return n;
}
// outward unit normals (right of the tangent for a CCW loop); the tangent skips coincident points (a full ellipse
// leaves four edge points on one spot)
function normals(xs, ys, nx, ny) {
  for (let i = 0; i < N; i++) {
    let j = (i + 1) % N, k = (i + N - 1) % N, g = 0;
    while (g++ < N && Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) < 1e-9) j = (j + 1) % N;
    g = 0; while (g++ < N && Math.hypot(xs[k] - xs[i], ys[k] - ys[i]) < 1e-9) k = (k + N - 1) % N;
    const tx = xs[j] - xs[k], ty = ys[j] - ys[k], l = Math.hypot(tx, ty) || 1;
    nx[i] = ty / l; ny[i] = -tx / l;
  }
}
// the vertical extent of a loop at x (xs, ys scaled by s): [min y, max y], x kept just inside the loop's width
function extent(xs, ys, x, s, out) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, x0 = xs[i] * s, x1 = xs[j] * s;
    if ((x0 - x) * (x1 - x) > 0 || x0 === x1) continue;
    const y = (ys[i] + (ys[j] - ys[i]) * ((x - x0) / (x1 - x0))) * s;
    if (y < lo) lo = y; if (y > hi) hi = y;
  }
  if (lo > hi) { lo = hi = 0; }
  out[0] = lo; out[1] = hi;
}

// ---- dynamic geometry of fixed topology (positions and normals rewritten per frame)
function dyn(nV, index, { col = false, uv = false } = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  if (col) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nV * 3).fill(1), 3));
  if (uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(nV * 2), 2));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(index), 1));
  return g;
}
const touch = (g) => { for (const k in g.attributes) g.attributes[k].needsUpdate = true; };
const put = (g, i, x, y, z, nx, ny, nz) => { const P = g.attributes.position.array, Nn = g.attributes.normal.array; P[3 * i] = x; P[3 * i + 1] = y; P[3 * i + 2] = z; Nn[3 * i] = nx; Nn[3 * i + 1] = ny; Nn[3 * i + 2] = nz; };
const paint = (g, i0, n, c) => { const C = g.attributes.color.array; for (let i = 0; i < n; i++) { C[3 * (i0 + i)] = c.r; C[3 * (i0 + i) + 1] = c.g; C[3 * (i0 + i) + 2] = c.b; } };

// a flat fan over the loop: vertex 0 the centre, 1..N the loop
const FAN = []; for (let i = 0; i < N; i++) FAN.push(0, 1 + i, 1 + ((i + 1) % N));
const fanGeo = (opts) => dyn(N + 1, FAN, opts);
function fillFan(g, xs, ys, z, cx = 0, cy = 0) {
  put(g, 0, cx, cy, z, 0, 0, 1);
  for (let i = 0; i < N; i++) put(g, 1 + i, xs[i], ys[i], z, 0, 0, 1);
  touch(g);
}

// the white: front fan + 3 rim rings + wall ring, rings of N points. ring k vertex i = 1 + k N + i
const WHITE_RINGS = 5;
const WHITE_IDX = (() => {
  const idx = [...FAN];
  for (let k = 0; k < WHITE_RINGS - 1; k++) for (let i = 0; i < N; i++) {
    const A = 1 + k * N + i, A1 = 1 + k * N + ((i + 1) % N), B = 1 + (k + 1) * N + i, B1 = 1 + (k + 1) * N + ((i + 1) % N);
    idx.push(A, B, B1, A, B1, A1);
  }
  return idx;
})();
const RIM = [90, 60, 30, 0].map((d) => d * DEG);
function fillWhite(g, xs, ys, nx, ny, r, col) {
  const zf = 0.16 * r;
  put(g, 0, 0, 0, zf, 0, 0, 1);
  for (let k = 0; k < RIM.length; k++) {
    const cs = Math.cos(RIM[k]), sn = Math.sin(RIM[k]), inset = 0.05 * r * (1 - cs), z = 0.11 * r + 0.05 * r * sn;
    for (let i = 0; i < N; i++) put(g, 1 + k * N + i, xs[i] - nx[i] * inset, ys[i] - ny[i] * inset, z, nx[i] * cs, ny[i] * cs, sn);
  }
  for (let i = 0; i < N; i++) put(g, 1 + 4 * N + i, xs[i], ys[i], -0.3 * r, nx[i], ny[i], 0);
  paint(g, 0, 1 + WHITE_RINGS * N, col);
  touch(g);
}

// a tube round a closed loop (N points x R_TUBE), or an open polyline (np points, capped)
const TUBE_LOOP_IDX = (() => {
  const idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < R_TUBE; j++) {
    const a = i * R_TUBE + j, b = i * R_TUBE + (j + 1) % R_TUBE, c = ((i + 1) % N) * R_TUBE + j, d = ((i + 1) % N) * R_TUBE + (j + 1) % R_TUBE;
    idx.push(a, c, d, a, d, b);
  }
  return idx;
})();
const tubeOpenIdx = (np) => {
  const idx = [];
  for (let i = 0; i < np - 1; i++) for (let j = 0; j < R_TUBE; j++) {
    const a = i * R_TUBE + j, b = i * R_TUBE + (j + 1) % R_TUBE, c = (i + 1) * R_TUBE + j, d = (i + 1) * R_TUBE + (j + 1) % R_TUBE;
    idx.push(a, c, d, a, d, b);
  }
  const s = np * R_TUBE, e = s + 1;
  for (let j = 0; j < R_TUBE; j++) { idx.push(s, j, (j + 1) % R_TUBE); idx.push(e, (np - 1) * R_TUBE + (j + 1) % R_TUBE, (np - 1) * R_TUBE + j); }
  return idx;
};
// one ring of a tube: centre (x, y, z), in-plane normal (nx, ny), radius r
function ring(g, base, x, y, z, nx, ny, r, col) {
  for (let j = 0; j < R_TUBE; j++) {
    const ph = (j / R_TUBE) * Math.PI * 2, c = Math.cos(ph), s = Math.sin(ph);
    put(g, base + j, x + r * c * nx, y + r * c * ny, z + r * s, c * nx, c * ny, s);
  }
  if (col) paint(g, base, R_TUBE, col);
}
function fillLoopTube(g, xs, ys, nx, ny, inset, z, rad, col) {
  for (let i = 0; i < N; i++) ring(g, i * R_TUBE, xs[i] - nx[i] * inset, ys[i] - ny[i] * inset, z, nx[i], ny[i], rad[i], col);
  touch(g);
}
// an open polyline: px, py (np points), radii rad (np); caps at both ends
function fillOpenTube(g, px, py, np, z, rad, col) {
  for (let i = 0; i < np; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(np - 1, i + 1);
    let tx = px[i1] - px[i0], ty = py[i1] - py[i0]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    ring(g, i * R_TUBE, px[i], py[i], z, ty, -tx, rad[i], col);
  }
  const s = np * R_TUBE, e = s + 1;
  let t0x = px[1] - px[0], t0y = py[1] - py[0], l0 = Math.hypot(t0x, t0y) || 1; t0x /= l0; t0y /= l0;
  let t1x = px[np - 1] - px[np - 2], t1y = py[np - 1] - py[np - 2], l1 = Math.hypot(t1x, t1y) || 1; t1x /= l1; t1y /= l1;
  put(g, s, px[0], py[0], z, -t0x, -t0y, 0); put(g, e, px[np - 1], py[np - 1], z, t1x, t1y, 0);
  if (col) paint(g, s, 2, col);
  touch(g);
}
const openGeo = (np) => dyn(np * R_TUBE + 2, tubeOpenIdx(np), { col: true });

// the lid plates: a strip over C + 1 columns, vertex 2 j the lower edge, 2 j + 1 the upper edge
const C_LID = 32;
const STRIP_IDX = (() => { const idx = []; for (let j = 0; j < C_LID; j++) { const a = 2 * j, b = 2 * j + 1, c = 2 * j + 2, d = 2 * j + 3; idx.push(a, c, d, a, d, b); } return idx; })();
const C_LINE = 24, N_FLICK = 7;

const glowTexture = () => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const cx = cv.getContext("2d");
  const gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

const mk = (geo, mat, parent) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.matrixAutoUpdate = true; parent.add(m); return m; };
const flat = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };

export class SquareEyes {
  constructor(ch) {
    this.ch = ch; this.F = ch.face; this.on = null; this.eyes = [];
    const F = this.F, E = F.eyeStyle, skin = ch.skin;
    // the character's own materials, copied: the white (own colour as emissive at 0.15), the iris (its map when it has
    // the shaded bands), the pupil, the ink; the skin is the rig's lid material itself, so it follows skin tints
    const first = F.eyes[0];
    this.whiteSrc = first.white.material;
    this.mat = {
      white: flat(Object.assign(this.whiteSrc.clone(), { vertexColors: true, emissive: this.whiteSrc.color.clone(), emissiveIntensity: 0.15 })),
      ink: flat(Object.assign(F.inkMat.clone(), { vertexColors: true })),
      iris: flat(first.iris.material.clone()), pupil: flat(first.pupil.material.clone()),
      glint: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      notch: flat(new THREE.MeshStandardMaterial({ color: INK_PHONE, roughness: 0.5 })), bar: flat(new THREE.MeshStandardMaterial({ color: BAR, roughness: 0.5 })),
      screen: new THREE.MeshBasicMaterial({ color: SCREEN_LIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      glow: new THREE.MeshBasicMaterial({ color: SCREEN_LIGHT, map: glowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    };
    this.mat.white.color.set("#ffffff"); this.mat.ink.color.set("#ffffff");
    this.mat.glint.userData.noOutline = true; this.mat.screen.userData.noOutline = true; this.mat.glow.userData.noOutline = true; this.mat.glow.userData.glow = true;
    this.skin = skin; this.lidMat = first.lidPivot?.children?.[0]?.material || skin;
    // scratch loops
    this.t = { xs: new Float64Array(N), ys: new Float64Array(N), nx: new Float64Array(N), ny: new Float64Array(N), rad: new Float64Array(N), ex: [0, 0] };
    for (const re of F.eyes) {
      const root = new THREE.Group(); root.name = "squareEye"; root.visible = false; F.group.add(root);
      const body = new THREE.Group(); root.add(body);   // scaled with the rig's wide-eye factors
      const e = { re, side: re.side, root, body, key: "", g: {}, m: {} };
      const add = (name, geo, mat, extra = {}) => { const m = mk(geo, mat, body); Object.assign(m.userData, extra); e.g[name] = geo; e.m[name] = m; return m; };
      add("white", dyn(1 + WHITE_RINGS * N, WHITE_IDX, { col: true }), this.mat.white);
      add("frame", dyn(N * R_TUBE, TUBE_LOOP_IDX, { col: true }), this.mat.ink);
      add("flick", openGeo(N_FLICK), this.mat.ink);
      add("lidLine", openGeo(C_LINE + 1), this.mat.ink);
      add("iris", fanGeo({ uv: true }), this.mat.iris);
      add("pupil", fanGeo(), this.mat.pupil);
      add("glint", fanGeo(), this.mat.glint);
      add("screen", fanGeo(), this.mat.screen);
      for (const nm of ["lidU", "lidL"]) { const m = add(nm, dyn(2 * (C_LID + 1), STRIP_IDX), this.lidMat); m.userData.bareLook = true; }
      add("notch", fanGeo(), this.mat.notch); add("bar", fanGeo(), this.mat.bar);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat.glow); glow.castShadow = false; glow.frustumCulled = false; glow.userData.glow = true; body.add(glow); e.m.glow = glow;
      this.eyes.push(e);
    }
    this.tmp = { c1: new THREE.Color(), c2: new THREE.Color() };
  }

  apply(st, t, fries) {
    const f = st.face || {}, q = clamp(f.square || 0), c = clamp(f.sqCorner || 0), T = clamp(f.sqTall || 0), P = clamp(f.sqPhone || 0);
    const on = Math.max(q, c, T, P) > 0.001 && !fries;
    if (on !== this.on) { this.on = on; for (const e of this.eyes) { e.root.visible = on; e.re.root.visible = !on; } }
    if (!on) return;
    for (const e of this.eyes) this._eye(e, q, c, T, P);
  }

  _eye(e, q, c, T, P) {
    const re = e.re, F = this.F, E = F.eyeStyle, r = re.r, side = e.side, lidless = re.shut === undefined;
    // the root: the rig eye's place and turn, every frame
    e.root.position.copy(re.root.position); e.root.quaternion.copy(re.root.quaternion);
    // the rig's own widening (face expression eye > 1): at q 1 both axes take the mean of the two factors
    const wx = lidless ? 1 : re.lid.scale.x, wy = lidless ? 1 : re.lid.scale.y, wm = (wx + wy) / 2;
    const sx = mix(wx, wm, q), sy = mix(wy, wm, q);
    e.body.scale.set(sx, sy, 1);
    const kU = clamp(lidless ? 1 - re.lid.scale.y : re.shut), kL = clamp(lidless ? kU : re.shutLow ?? kU);
    const oval = E.oval, b0 = 0.9 * r * oval, a0 = 0.9 * r;
    const a = mix(a0, mix(0.82 * b0, 0.5 * b0, T), q), b = mix(b0, mix(0.82 * b0, b0, T), q);
    const Rr = 0.14 * b0 * (side < 0 ? 0.9 : 1.1);
    const rx = [0, 1, 2, 3].map(() => mix(a, Rr, q)), ry = [0, 1, 2, 3].map(() => mix(b, Rr, q));
    if (side > 0) { rx[0] = mix(rx[0], Rr, c); ry[0] = mix(ry[0], Rr, c); }   // the left eye's upper outer corner
    const bul = 0.03 * q * (1 - T);
    const lk = sstep(0.12, 0.14, kU);   // the lid line is down from closure 0.12 (full by 0.14: the rig rests at about 0.15)
    const lash = r * E.lash, flick = E.flick ?? 0, open = 1 - sstep(0.1, 0.9, kU);
    // gaze, pupil, iris size and catch light from the rig eye
    const px0 = re.look.position.x, py0 = re.look.position.y, ik = re.iris.scale.x, pupil = re.pupil.scale.x, ia = E.irisAspect ?? 1;
    const gl = re.glints[0], gx = gl ? gl.position.x : 0, gy = gl ? gl.position.y : 0, gs = gl && gl.visible ? gl.scale.x : 0;
    const irisOn = re.look.visible;
    const key = [q, c, T, P, kU, kL, r, side, px0, py0, ik, pupil, gx, gy, gs, irisOn ? 1 : 0, open, lk, E.oval, this.whiteSrc.color.getHex(), F.inkMat.color.getHex()].map((v) => (typeof v === "number" ? Math.round(v * 1e5) : v)).join("|");
    if (key === e.key) return;
    e.key = key;
    const { xs, ys, nx, ny, rad, ex } = this.t;
    outline(xs, ys, a, b, rx, ry, bul); normals(xs, ys, nx, ny);

    // white (its own colour tinted to the screen with the phone) + the screen's glow plate
    const wc = this.tmp.c1.copy(this.whiteSrc.color).lerp(SCREEN, P);
    fillWhite(e.g.white, xs, ys, nx, ny, r, wc);
    const sx_ = new Float64Array(N), sy_ = new Float64Array(N);
    for (let i = 0; i < N; i++) { sx_[i] = xs[i] - nx[i] * 0.05 * r; sy_[i] = ys[i] - ny[i] * 0.05 * r; }
    fillFan(e.g.screen, sx_, sy_, 0.162 * r); e.m.screen.visible = P > 0.001; this.mat.screen.opacity = 0.45 * P;

    // the frame: ink, the phone's body with sqPhone. Radius: the lash line across the top (thickest at 45 % / 55 %
    // across, 40 % at the top corners) while the lid line is up, the sides and bottom mix(0.012, 0.040, q) r
    const side0 = mix(0.012, 0.04, q) * r, u0 = side < 0 ? 0.45 : 0.55;
    for (let i = 0; i < N; i++) {
      const u = clamp((xs[i] + a) / (2 * a)), w = u < u0 ? 0.5 * u / u0 : 0.5 + 0.5 * (u - u0) / (1 - u0);
      const top = lash * 0.086 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * w), 0.75)), wt = sstep(0.55, 0.95, ys[i] / b) * (1 - lk);
      rad[i] = mix(mix(side0, top, wt), 0.07 * r, P);
    }
    const ink = this.tmp.c2.copy(F.inkMat.color).lerp(INK_PHONE, P);
    fillLoopTube(e.g.frame, xs, ys, nx, ny, 0.0146 * r, 0.145 * r, rad, ink);

    // the rig's lash flick on the upper outer corner, fading with q (and, on the left eye, with sqCorner)
    const fk = flick > 0 ? (1 - q) * (side > 0 ? 1 - c : 1) : 0;
    e.m.flick.visible = fk > 0.01;
    if (fk > 0.01) {
      const fx = new Float64Array(N_FLICK), fy = new Float64Array(N_FLICK), fr = new Float64Array(N_FLICK);
      const x0 = side * 0.8 * a, y0 = b * Math.sqrt(Math.max(0, 1 - 0.64)), tipX = side * a * (1.07 + 0.15 * flick), tipY = 0.987 * b0 * (0.55 - 0.21 * flick);
      const u = clamp((x0 + a) / (2 * a)), w = u < u0 ? 0.5 * u / u0 : 0.5 + 0.5 * (u - u0) / (1 - u0), r0 = lash * 0.086 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * w), 0.75));
      for (let i = 0; i < N_FLICK; i++) { const s = i / (N_FLICK - 1); fx[i] = mix(x0, tipX, s); fy[i] = mix(y0, tipY, s) + 0.05 * r * Math.sin(Math.PI * s); fr[i] = Math.max(1e-5, r0 * fk * (1 - 0.9 * s)); }
      fillOpenTube(e.g.flick, fx, fy, N_FLICK, 0.145 * r, fr, ink);
    }

    // lids: the rig's own lid heights; the edge across is the rig's arch at q 0 and a dead straight shutter from q 0.5
    const hU = b * Math.sin((90 - 92.9 * kU) * DEG), wL = sstep(0, 1, clamp((kL - 0.5) / 0.37)), hL = -b * Math.sin((90 - 87.1 * wL) * DEG), flatK = Math.min(1, q / 0.5);
    // the arch follows the outline's own top (and bottom): the ellipse's sqrt at q 0, so a pulled-out corner (sqCorner) is
    // not covered by the lid; a dead straight shutter from q 0.5
    const archU = (x) => { extent(xs, ys, x, 1, ex); return mix(clamp(ex[1] / b), 1, flatK); }, archL = (x) => { extent(xs, ys, x, 1, ex); return mix(clamp(-ex[0] / b), 1, flatK); };
    const zl = 0.19 * r, UP = e.g.lidU.attributes.position.array, LO = e.g.lidL.attributes.position.array;
    for (let j = 0; j <= C_LID; j++) {
      const x = -1.02 * a * 0.9995 * Math.cos((Math.PI * j) / C_LID);
      const au = archU(x), al = archL(x); extent(xs, ys, x, 1.02, ex);
      const yU = clamp(hU * au, ex[0], ex[1]), yL = clamp(hL * al, ex[0], ex[1]);
      for (const [g, arr, lo, hi] of [[e.g.lidU, UP, yU, ex[1]], [e.g.lidL, LO, ex[0], yL]]) {
        arr[3 * (2 * j)] = x; arr[3 * (2 * j) + 1] = lo; arr[3 * (2 * j) + 2] = zl;
        arr[3 * (2 * j + 1)] = x; arr[3 * (2 * j + 1) + 1] = hi; arr[3 * (2 * j + 1) + 2] = zl;
      }
    }
    for (const g of [e.g.lidU, e.g.lidL]) { const Nn = g.attributes.normal.array; for (let i = 0; i < 2 * (C_LID + 1); i++) { Nn[3 * i] = 0; Nn[3 * i + 1] = 0; Nn[3 * i + 2] = 1; } touch(g); }
    e.m.lidU.visible = kU > 0.103; e.m.lidL.visible = wL > 0.001;

    // the lid line along the upper lid's edge from closure 0.12 (the lash thickness)
    e.m.lidLine.visible = lk > 0.01;
    if (lk > 0.01) {
      const lx = new Float64Array(C_LINE + 1), ly = new Float64Array(C_LINE + 1), lr = new Float64Array(C_LINE + 1);
      for (let j = 0; j <= C_LINE; j++) {
        const x = -a * 0.999 * Math.cos((Math.PI * j) / C_LINE);
        extent(xs, ys, x, 1, ex);
        lx[j] = x; ly[j] = clamp(hU * archU(x), ex[0], ex[1]);
        const u = clamp((x + a) / (2 * a)), w = u < u0 ? 0.5 * u / u0 : 0.5 + 0.5 * (u - u0) / (1 - u0);
        lr[j] = Math.max(1e-5, lash * 0.086 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * w), 0.75)) * lk);
      }
      fillOpenTube(e.g.lidLine, lx, ly, C_LINE + 1, zl, lr, ink);
    }

    // iris, pupil, catch light: the rig's fitted offset, held 0.05 r inside the white on every side; the phone's eyes
    // keep the iris within 0.15 r up or down so it never crosses the notch or the bar
    const iw0 = Math.min(mix(1, 0.92, q) * E.iris * r, a - 0.16 * r), ih0 = mix(1.12 * ia * iw0, iw0, q) * (1 + 0.5 * T * q);
    const iw = iw0 * ik, ih = ih0 * ik;
    const mx = Math.max(0, a - 0.05 * r - iw), my = Math.max(0, Math.min(b - 0.05 * r - ih, mix(1e9, 0.15 * r, P)));
    const ox = clamp(px0, -mx, mx), oy = clamp(py0, -my, my);
    const show = irisOn;
    e.m.iris.visible = e.m.pupil.visible = show;
    const lx = new Float64Array(N), ly = new Float64Array(N);
    const sh = (w, h, rw, rh, cx, cy, z, geo, uvs) => {
      const rxx = [rw, rw, rw, rw], ryy = [rh, rh, rh, rh];
      outline(lx, ly, w, h, rxx, ryy, 0);
      for (let i = 0; i < N; i++) { lx[i] += cx; ly[i] += cy; }
      fillFan(geo, lx, ly, z, cx, cy);
      if (uvs) { const U = geo.attributes.uv.array; U[0] = 0.5; U[1] = 0.5; for (let i = 0; i < N; i++) { U[2 + 2 * i] = (lx[i] - cx) / w / 2 + 0.5; U[3 + 2 * i] = (ly[i] - cy) / h / 2 + 0.5; } geo.attributes.uv.needsUpdate = true; }
    };
    if (show && iw > 1e-6) {
      sh(iw, ih, mix(iw, 0.25 * iw, q), mix(ih, 0.25 * iw, q), ox, oy, 0.166 * r, e.g.iris, true);
      const pw = 0.52 * iw0 * pupil, ph = pw * (ih0 / iw0);
      sh(Math.max(pw, 1e-6), Math.max(ph, 1e-6), mix(pw, 0.25 * pw, q), mix(ph, 0.25 * pw, q), ox, oy, 0.172 * r, e.g.pupil, false);
    }
    // catch light: q 0 the rig's dot, q 1 a 4:3 TV reflection (T 1: 0.20 r x 0.34 r), unlit
    const gw = mix(0.14 * (E.glintSize ?? 1) * r * gs, mix(0.18, 0.1, T) * r, q), gh = mix(0.14 * (E.glintSize ?? 1) * r * 1.1 * gs, mix(0.135, 0.17, T) * r, q);
    const gShow = show && gl && gs > 0.01;
    e.m.glint.visible = !!gShow;
    if (gShow) {
      sh(Math.max(gw, 1e-6), Math.max(gh, 1e-6), mix(gw, 0.06 * r, q), mix(gh, 0.06 * r, q), ox + gx, oy + gy, 0.178 * r, e.g.glint, false);
      this.mat.glint.color.copy(WHITE).lerp(TV, q);
    }

    // phone dressing: the notch pill and the home bar grow from nothing with sqPhone; the glow card
    e.m.notch.visible = e.m.bar.visible = P > 0.01;
    if (P > 0.01) {
      const pill = (w, h, cy, geo) => { sh(w * P, h * P, h * P, h * P, 0, cy, 0.175 * r, geo, false); };
      pill(0.15 * r, 0.035 * r, b - 0.12 * r, e.g.notch); pill(0.17 * r, 0.0175 * r, -b + 0.10 * r, e.g.bar);
    }
    e.m.glow.visible = P > 0.01;
    if (P > 0.01) { e.m.glow.scale.set(3 * a, 2.4 * b, 1); e.m.glow.position.set(0, 0, 0.2 * r); this.mat.glow.opacity = 0.2 * P * open; }
  }
}
