// Legend channel, "The Golem of Prague" (27 Nov 2026): moods, five sets, the cast and props, and the clay TITLE CARD.
// Same conventions as lib/legend-paw.mjs: world in metres (X right, Y up, Z into the picture), characters in cm with the
// feet at 0, every colour pushed onto a mood ramp with tone(), every edge cut with a seeded wobble (wpath), light drawn
// as flat stepped shapes. The hosts (L.kid, L.keeper) come from lib/legend.mjs; kidUp() below raises the kid's arms.
// No lettering anywhere but the title card (this episode's trial): the word on the slip is abstract ink strokes.
import * as L from "./legend.mjs";
const { W, H, INK, P, n, lerp, clamp, hash, mix, ease, toScreen, place, shadow, limb, eye, headPath, talkMouth, blinkAmt } = L;

// ---------------------------------------------------------------- moods: a dark-to-light ramp the picture is mapped onto
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = hex(h); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
export const MOODS = {
  friday:  { ramp: ["#1d0f3d", "#47226f", "#8b3b8c", "#dc5f7c", "#ffb04a", "#ffe9a8"], k: 0.74, kc: 0.2, g: 0.9, mul: "#c98ad8", mulA: 0.2 },    // today: violet-rose dusk + candle gold
  river:   { ramp: ["#04262f", "#0b4a55", "#22867f", "#d2983a", "#f6cf72", "#fdf4cc"], k: 0.78, kc: 0.24, g: 0.95, mul: "#8fd0c0", mulA: 0.2 },   // 1600 dawn mist: teal + ochre
  lane:    { ramp: ["#0a0930", "#1b1d6c", "#3b3caa", "#c8672a", "#ffb040", "#ffe8a4"], k: 0.8, kc: 0.3, g: 1.0, mul: "#7f86e8", mulA: 0.26 },     // 1600 night: indigo + lamp amber
  sabbath: { ramp: ["#2a0e12", "#702414", "#bb551a", "#ec9a22", "#ffd052", "#fff4be"], k: 0.74, kc: 0.2, g: 0.85, mul: "#ffb050", mulA: 0.16 },   // candles: warm gold
  rampage: { ramp: ["#07030c", "#250a3c", "#5c1252", "#b3142c", "#f0482c", "#ffba90"], k: 0.86, kc: 0.46, g: 1.2, mul: "#c8243a", mulA: 0.36 },   // cold threat: red/black + bruised violet
  attic:   { ramp: ["#160c09", "#3a2114", "#6c4326", "#9c7652", "#a3bacb", "#e6f0f6"], k: 0.8, kc: 0.34, g: 0.95, mul: "#b89878", mulA: 0.24 },   // dusty brown + one blade of grey-blue light
  dust:    { ramp: ["#3c3a40", "#69665f", "#98928a", "#c2baac", "#e2dccf", "#f6f2e8"], k: 0.9, kc: 0.55, g: 1.0, mul: "#c9c2b4", mulA: 0.4 },     // pale, drained
};
for (const [k, v] of Object.entries(MOODS)) { v.name = k; v.light = v.ramp[4]; v.hot = v.ramp[5]; v.dark = v.ramp[0]; v.cache = new Map(); }
export const mood = (name) => MOODS[name] || MOODS.friday;
export function moodMix(a, b, u) {
  a = typeof a === "string" ? mood(a) : a; b = typeof b === "string" ? mood(b) : b;
  if (u <= 0) return a; if (u >= 1) return b;
  const m = { name: `${a.name}>${b.name}`, ramp: a.ramp.map((x, i) => mix(x, b.ramp[i], u)), k: lerp(a.k, b.k, u), kc: lerp(a.kc, b.kc, u), g: lerp(a.g, b.g, u), mul: mix(a.mul, b.mul, u), mulA: lerp(a.mulA, b.mulA, u), cache: new Map() };
  m.light = m.ramp[4]; m.hot = m.ramp[5]; m.dark = m.ramp[0]; return m;
}
// a local colour pushed onto the mood ramp by its brightness; k = how far (0 = keep the local colour)
export function tone(m, col, k = m.k) {
  const key = col + k; let v = m.cache.get(key); if (v) return v;
  const R = m.ramp, x = clamp(lum(col) ** m.g) * (R.length - 1), i = Math.min(R.length - 2, Math.floor(x));
  v = mix(col, mix(R[i], R[i + 1], x - i), k); m.cache.set(key, v); return v;
}
// a flat wash over finished characters that were not drawn with st.m (the two hosts): put it after them
export const grade = (m, a = 1) => `<rect width="${W}" height="${H}" fill="${m.mul}" opacity="${n(m.mulA * a)}" style="mix-blend-mode:multiply"/>`;

// ---------------------------------------------------------------- hand-drawn primitives (as in legend-paw.mjs)
const jit = (seed, a) => (hash(seed) - 0.5) * 2 * a;
export function wpath(p, seed = 1, k = 3, close = true, amp = 1) {
  let d = ""; const N = p.length;
  for (let i = 0; i < (close ? N : N - 1); i++) {
    const a = p[i], b = p[(i + 1) % N], len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len, A = clamp(len * 0.009 / 4) * 4 * amp;
    if (i === 0) d += `M${n(a.x)},${n(a.y)}`;
    for (let j = 1; j <= k; j++) { const u = j / k, o = j < k ? jit(seed * 13.7 + i * 7.1 + j * 3.3, A) : 0; d += `L${n(lerp(a.x, b.x, u) + nx * o)},${n(lerp(a.y, b.y, u) + ny * o)}`; }
  }
  return d + (close ? "Z" : "");
}
const pt = (x, y) => ({ x, y });
const wp = (a, seed, k = 2, close = true, amp = 1) => wpath(a.map(([x, y]) => pt(x, y)), seed, k, close, amp);
const blobPts = (cx, cy, rx, ry, seed, N = 14, irr = 0.12, rot = 0) => Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2, r = 1 + jit(seed * 7.3 + i * 3.1, irr), x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r, cr = Math.cos(rot), sr = Math.sin(rot); return pt(cx + x * cr - y * sr, cy + x * sr + y * cr); });
const blob = (cx, cy, rx, ry, fill, seed, o = {}) => `<path d="${wpath(blobPts(cx, cy, rx, ry, seed, o.N, o.irr, o.rot), seed, o.k ?? 1)}" fill="${fill}" ${o.ex || ""}/>`;
const vis = (c, Z) => Z - c.z > 0.3;
const zc = (c, Z) => Math.max(Z, c.z + 0.26);
const PZ = (c, X, Y, Z) => P(c, X, Y, zc(c, Z));
const pj = (c, a) => a.map(([X, Y, Z]) => PZ(c, X, Y, Z));
const LW = (s) => n(clamp(s * 0.0055, 0.9, 7));
const pg = (a, fill, ex = "") => `<polygon points="${a.map((p) => `${n(p.x)},${n(p.y)}`).join(" ")}" fill="${fill}" ${ex}/>`;
const off = (q) => q.every((p) => p.x < -80) || q.every((p) => p.x > W + 80) || q.every((p) => p.y < -80) || q.every((p) => p.y > H + 80);
function sh(q, fill, seed, o = {}) {
  if (off(q)) return "";
  return `<path d="${wpath(q, seed, o.k ?? 3, true, o.amp ?? 1)}" fill="${fill}" stroke="${o.stroke ?? INK}" stroke-width="${o.lw ?? LW(q[0].s)}" stroke-linejoin="round" ${o.ex || ""}/>`;
}
const face = (c, a3, fill, seed, o) => sh(pj(c, a3), fill, seed, o);
const flat = (c, a3, fill, seed, ex = "") => { const q = pj(c, a3); return off(q) ? "" : `<path d="${wpath(q, seed, 2)}" fill="${fill}" ${ex}/>`; };   // no outline
function ln3(c, a3, col, w, seed = 1, ex = "") { const q = pj(c, a3); if (off(q)) return ""; return `<path d="${wpath(q, seed, 2, false)}" fill="none" stroke="${col}" stroke-width="${n(Math.max(0.7, w * q[0].s))}" stroke-linecap="round" stroke-linejoin="round" ${ex}/>`; }
const pl = (c, O, U, V) => (u, v) => PZ(c, O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v, O[2] + U[2] * u + V[2] * v);
const pq = (f, u0, u1, v0, v1) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)];
function box(c, x0, x1, y0, y1, z0, z1, cols, seed, o = {}) {
  if (z1 < c.z + 0.32) return "";
  const [cf, ct = mix(cols[0], "#ffffff", 0.16), cs = mix(cols[0], "#000000", 0.3)] = cols;
  let s = "";
  if (c.x < x0) s += face(c, [[x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [x0, y0, z1]], cs, seed + 1, o);
  if (c.x > x1) s += face(c, [[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], cs, seed + 2, o);
  if (c.y > y1) s += face(c, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], ct, seed + 3, o);
  if (c.y < y0) s += face(c, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], cs, seed + 4, o);
  if (z0 > c.z + 0.27) s += face(c, [[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], cf, seed, o);
  return s;
}
// a flat, stepped pool of light (screen blend): a hand-cut blob, never a gradient
export function pool(cx, cy, rx, ry, col, op, seed, steps = 3, t = 0) {
  let s = "";
  for (let k = 0; k < steps; k++) {
    const f = 1 - k * (0.62 / steps), pts = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 1 + jit(seed + i * 3 + k * 31 + Math.floor(t * 6) * 0.37, 0.07); pts.push({ x: cx + Math.cos(a) * rx * f * r, y: cy + Math.sin(a) * ry * f * r }); }
    s += `<path d="${wpath(pts, seed + k, 1)}" fill="${col}" opacity="${n(op)}" style="mix-blend-mode:screen"/>`;
  }
  return s;
}
function boards(c, m, x0, x1, z0, z1, cols, seed, bw = 0.3) {
  let s = "", i = 0;
  for (let x = x0; x < x1 - 0.01; i++) {
    const w = Math.min(x1 - x, bw * (0.8 + 0.45 * hash(i + seed))), col = tone(m, mix(cols[0], cols[1], hash(i * 3 + seed)));
    const q = pj(c, [[x, 0, z1], [x + w, 0, z1], [x + w, 0, z0], [x, 0, z0]]);
    s += pg(q, col, `stroke="${tone(m, cols[2])}" stroke-width="${LW(q[0].s)}"`);
    for (let k = 0; k < 2; k++) {
      const z = lerp(z0, z1, hash(i * 7 + k * 13 + seed)); if (!vis(c, z)) continue;
      s += ln3(c, [[x, 0, z], [x + w, 0, z]], tone(m, cols[2]), 0.006, i + k);
    }
    const gz = lerp(z0, z1, 0.2 + 0.5 * hash(i + 90 + seed)), gl = 0.5 + hash(i + 70) * 1.2;
    if (vis(c, gz)) s += ln3(c, [[x + w * 0.5, 0, gz], [x + w * (0.4 + 0.2 * hash(i)), 0, gz + gl * 0.5], [x + w * 0.55, 0, gz + gl]], tone(m, mix(cols[0], cols[2], 0.5)), 0.004, i + 5);
    x += w;
  }
  return s;
}
// cobbles: rows of uneven stones between xa(z) and xb(z); lit(x, z) 0..1 lifts a stone toward cols[2]
function cobbles(c, m, xa, xb, z0, z1, cols, seed, lit) {
  let s = "", row = 0;
  for (let z = z0; z < z1; row++) {
    const dz = 0.13 + z * 0.06, zz = z; z += dz;
    if (zz < c.z + 0.3) continue;
    const vw = 600 * (zz + dz - c.z) / (c.f || 1300) + 0.3, a = Math.max(xa(zz), c.x - vw), b = Math.min(xb(zz), c.x + vw), o = hash(row + seed) * 0.3;
    for (let x = Math.floor(a / 0.3) * 0.3 - o, j = Math.floor(a / 0.3); x < b; j++) {
      const sw = 0.24 + 0.2 * hash(row * 17 + j + seed), g = 0.012 + 0.0025 * zz, x0 = Math.max(a, x + g), x1 = Math.min(b, x + sw - g); x += sw;
      if (x1 <= x0) continue;
      const sk = jit(row * 31 + j + seed, 0.02);
      const q = [P(c, x0 + sk, 0, zz + dz - g), P(c, x1 - sk * 0.5, 0, zz + dz - g), P(c, x1, 0, zz + g), P(c, x0, 0, zz + g)];
      if (off(q)) continue;
      const id = row * 31 + j + seed, l = lit ? lit((x0 + x1) / 2, zz) : 0;
      let col = mix(cols[0], cols[1], hash(id)); if (l > 0) col = mix(col, cols[2], l);
      s += pg(q, col);
      if (zz - c.z < 9 && hash(id + 5) > 0.45) s += pg([q[3], q[2], { x: lerp(q[2].x, q[1].x, 0.22), y: lerp(q[2].y, q[1].y, 0.22) }, { x: lerp(q[3].x, q[0].x, 0.3), y: lerp(q[3].y, q[0].y, 0.3) }], cols[3] || cols[2], `opacity="${n(0.25 + 0.5 * l)}"`);
    }
  }
  return s;
}
// flat sky bands with hand-cut edges; ys = top of each band (ys[0] ignored)
function bands(cols, ys, seed, amp = 12) {
  let s = `<rect width="${W}" height="${H}" fill="${cols[0]}"/>`;
  for (let i = 1; i < cols.length; i++) {
    const p = []; for (let k = 0; k <= 9; k++) p.push(pt(-20 + k * 125, ys[i] + jit(seed + i * 17 + k * 3, amp)));
    s += `<path d="${wpath([...p, pt(W + 20, H), pt(-20, H)], seed + i, 2)}" fill="${cols[i]}"/>`;
  }
  return s;
}
const cloud = (x, y, w, h, col, seed, op = 1) => `<path d="${wp([[x, y], [x + w * 0.18, y - h * (0.5 + 0.4 * hash(seed))], [x + w * 0.42, y - h * 0.35], [x + w * 0.6, y - h * (0.7 + 0.3 * hash(seed + 1))], [x + w * 0.82, y - h * 0.3], [x + w, y], [x + w * 0.7, y + h * 0.22], [x + w * 0.3, y + h * 0.18]], seed, 2)}" fill="${col}" opacity="${op}"/>`;
const star4 = (x, y, r, col, op = 1) => `<path d="M${n(x)},${n(y - r)} L${n(x + r * 0.22)},${n(y - r * 0.2)} L${n(x + r)},${n(y)} L${n(x + r * 0.2)},${n(y + r * 0.24)} L${n(x)},${n(y + r)} L${n(x - r * 0.24)},${n(y + r * 0.2)} L${n(x - r)},${n(y)} L${n(x - r * 0.2)},${n(y - r * 0.22)} Z" fill="${col}" opacity="${n(op)}"/>`;
// a jagged crack on a wall plane f(u, v): from (u, v) wandering down; returns a path d
function crackD(f, u, v, len, seed, dir = -1) {
  let d = "", a = pt(u, v); const N = 6;
  for (let i = 0; i <= N; i++) { const q = f(a.x, a.y); d += (i ? "L" : "M") + `${n(q.x)},${n(q.y)}`; if (i === 3) { const b = f(a.x + len * 0.16 * (hash(seed + 9) > 0.5 ? 1 : -1), a.y + dir * len * 0.1); d += `L${n(b.x)},${n(b.y)}M${n(q.x)},${n(q.y)}`; } a = pt(a.x + jit(seed + i * 5, len * 0.09), a.y + dir * len / N * (0.6 + 0.8 * hash(seed + i))); }
  return d;
}
// individual dust motes drifting around a screen point; each has its own size, path and flicker
export function dust(t, m, lp, o = {}) {
  let s = ""; const N = o.n ?? 46, R = o.r ?? 520;
  for (let i = 0; i < N; i++) {
    const a = hash(i + 3) * Math.PI * 2 + t * 0.05 * (hash(i + 8) - 0.5), r = R * Math.sqrt(hash(i + 11)) * (0.2 + 0.8 * hash(i + 5));
    const x = lp.x + Math.cos(a) * r * (o.sx ?? 1) + 14 * Math.sin(t * (0.3 + hash(i) * 0.5) + i), y = lp.y + Math.sin(a) * r * 0.9 + 40 - ((t * (5 + 9 * hash(i + 2)) + hash(i + 30) * 80) % 80) + 10 * Math.sin(t * 0.7 + i * 2);
    const near = clamp(1 - r / R), sz = 1.6 + 3.4 * hash(i + 17) ** 2, tw = 0.6 + 0.4 * Math.sin(t * (1 + hash(i + 4) * 2) + i * 5);
    s += `<path d="M${n(x - sz)},${n(y)} L${n(x)},${n(y - sz * 0.7)} L${n(x + sz * 0.8)},${n(y + sz * 0.2)} L${n(x - sz * 0.1)},${n(y + sz * 0.7)} Z" fill="${i % 4 ? m.hot : m.light}" opacity="${n((0.18 + 0.6 * near) * tw * (o.k ?? 1))}"/>`;
  }
  return s;
}

// ================================================================ SET A: today, the Old-New Synagogue at Friday dusk
// The back wall faces the camera at Z = wall. Plaster below, the stepped brick gable above (peak off-centre to the
// right, so the upper left of a wide shot is calm sky), the iron rungs start at rung0 (out of reach) and climb to the
// small attic door. The hosts stand at its foot. Camera presets: wide (the opening: kid small, rungs over him, sky in the
// upper left), medium (both hosts, rungs just above), keeperClose / kidClose, rungs (looking up the wall).
// Heights on the wall in real metres: SYN.Y(v) (v = the drawing's own value): eave 3.7, peak 7.1, first rung 2.3, top
// rung 3.9, attic door 4.3 to 5.0.
export const SYN = { VS: 0.74, Y: (v) => v * 0.74, rungY: (i) => (3.1 + i * 0.31) * 0.74, wall: 8, x0: -0.9, x1: 6.3, eave: 5.0, peak: 9.6, rungX: 1.0, rung0: 3.1, rungN: 8, rungStep: 0.31, door: { X: 1.0, y0: 5.78, y1: 6.8, w: 0.74 },
  kid: { X: 1.0, Z: 7.3 }, keeper: { X: -0.1, Z: 6.9 }, lamp: { X: -2.3, Z: 8.3 }, tower: { X: -9.4, Z: 30 },
  CAM: { wide: { x: 0.3, y: 2.9, z: 0.9 }, medium: { x: 0.42, y: 1.42, z: 3.7 }, keeperClose: { x: -0.02, y: 0.98, z: 5.7 }, kidClose: { x: 0.95, y: 1.0, z: 5.5 }, rungs: { x: 1.0, y: 3.1, z: 3.6 } } };
// the gable's stepped outline: half-open stair from the eave corners to the peak; returns [xl, xr] at height y
const GST = 9;
function gableX(y) {
  const S = SYN, xc = (S.x0 + S.x1) / 2, k = clamp((y - S.eave) / (S.peak - S.eave)), i = Math.min(GST - 1, Math.floor(k * GST)), hw = (xc - S.x0) * (1 - i / GST) - 0.02 - (i === GST - 1 ? 0.08 : 0);
  return [xc - hw + jit(i + 3, 0.03), xc + hw + jit(i + 31, 0.03)];
}
export function todaySynagogue(c, t, m, o = {}) {
  const S = SYN, wz = S.wall, T = (col, k) => tone(m, col, k), hy = c.h0 ?? 1140, R = m.ramp;
  const w = (X, Y) => PZ(c, X, Y, wz), f = (u, v) => w(u, v);
  // sky: flat bands, a few long clouds low down, one early star
  let s = bands([R[1], mix(R[1], R[2], 0.55), R[2], mix(R[2], R[3], 0.6), R[3], mix(R[3], R[4], 0.75)], [0, hy - 880, hy - 610, hy - 390, hy - 220, hy - 90], 5);
  s += cloud(-60 - c.x * 6, hy - 330, 520, 46, mix(R[3], R[4], 0.5), 3, 0.9) + cloud(380 - c.x * 6, hy - 470, 430, 34, mix(R[2], R[3], 0.7), 8, 0.9) + cloud(120 - c.x * 6, hy - 190, 700, 40, R[4], 12, 0.8);
  s += star4(212 - c.x * 4, hy - 900, 9, R[5], 0.7 + 0.3 * Math.sin(t * 2)) + star4(668 - c.x * 4, hy - 1020, 5, R[5], 0.6);
  // far roofs of Josefov and the Jewish Town Hall's clock turret (plain marks on the dial)
  { const far = []; let x = -40, i = 0; far.push(pt(-40, hy + 30));
    while (x < W + 60) { const wd = 50 + 80 * hash(i + 60), h = 60 + 90 * hash(i + 70); far.push(pt(x, hy - h * 0.6), pt(x + wd * 0.5, hy - h), pt(x + wd, hy - h * 0.62)); x += wd + 4; i++; }
    far.push(pt(W + 60, hy + 30));
    s += `<path d="${wpath(far.map((p) => pt(p.x - c.x * 9, p.y)), 21, 1)}" fill="${mix(R[1], R[2], 0.5)}"/>`;
    for (let k = 0; k < 16; k++) s += `<rect x="${n(hash(k + 80) * W - c.x * 9)}" y="${n(hy - 14 - hash(k + 90) * 50)}" width="${n(4 + hash(k) * 3)}" height="${n(6 + hash(k + 2) * 4)}" fill="${R[4]}" opacity="${hash(k + 5) > 0.4 ? 0.9 : 0.35}"/>`;
    const tw = S.tower, b = P(c, tw.X, 0, tw.Z), k = b.s, X = (dx) => n(b.x + dx * k), Y = (yy) => n(b.y - yy * k), dk = mix(R[0], R[1], 0.7), md = mix(R[1], R[2], 0.45);
    s += `<path d="${wp([[b.x - 3.4 * k, b.y], [b.x - 3.4 * k, b.y - 8.6 * k], [b.x + 3.4 * k, b.y - 8.6 * k], [b.x + 3.4 * k, b.y]], 31)}" fill="${md}"/>`;
    s += `<path d="${wp([[b.x - 3.9 * k, b.y - 8.5 * k], [b.x - 2.6 * k, b.y - 11.3 * k], [b.x + 2.6 * k, b.y - 11.3 * k], [b.x + 3.9 * k, b.y - 8.5 * k]], 32)}" fill="${dk}"/>`;
    for (const [dx, yy] of [[-2.2, 6.6], [-0.8, 6.7], [0.9, 6.5], [2.2, 6.6], [-1.6, 4.2], [1.4, 4.3]]) s += `<path d="${wp([[b.x + (dx - 0.32) * k, b.y - yy * k], [b.x + (dx + 0.32) * k, b.y - (yy + 0.04) * k], [b.x + (dx + 0.3) * k, b.y - (yy - 1.1) * k], [b.x + (dx - 0.3) * k, b.y - (yy - 1.1) * k]], dx * 7 + yy)}" fill="${hash(dx + 9) > 0.4 ? R[4] : dk}"/>`;
    s += `<path d="${wp([[b.x - 1.5 * k, b.y - 11.2 * k], [b.x - 1.5 * k, b.y - 15.4 * k], [b.x + 1.5 * k, b.y - 15.4 * k], [b.x + 1.5 * k, b.y - 11.2 * k]], 33)}" fill="${md}"/>`;
    s += `<path d="M${X(-1.8)},${Y(15.3)} Q${X(-1.7)},${Y(17.2)} ${X(-0.5)},${Y(17.6)} L${X(-0.45)},${Y(18.4)} Q${X(0)},${Y(19.3)} ${X(0.45)},${Y(18.4)} L${X(0.5)},${Y(17.6)} Q${X(1.7)},${Y(17.2)} ${X(1.8)},${Y(15.3)} Z" fill="${mix(R[1], "#3fae9a", 0.45)}"/><path d="M${X(0)},${Y(19.1)} L${X(0)},${Y(20.6)}" stroke="${dk}" stroke-width="${n(0.12 * k)}"/>`;
    const cy = b.y - 13.4 * k, r = 1.12 * k;
    s += `<path d="${wpath(blobPts(b.x, cy, r, r, 4, 16, 0.02), 4, 1)}" fill="${R[5]}" stroke="${dk}" stroke-width="${n(0.14 * k)}"/>`;
    for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; s += `<path d="M${n(b.x + Math.sin(a) * r * 0.74)},${n(cy - Math.cos(a) * r * 0.74)} L${n(b.x + Math.sin(a) * r * 0.9)},${n(cy - Math.cos(a) * r * 0.9)}" stroke="${dk}" stroke-width="${n((h % 3 ? 0.07 : 0.12) * k)}" stroke-linecap="round"/>`; }
    s += `<path d="M${n(b.x)},${n(cy)} L${n(b.x + r * 0.42)},${n(cy + r * 0.3)} M${n(b.x)},${n(cy)} L${n(b.x - r * 0.1)},${n(cy - r * 0.66)}" stroke="${dk}" stroke-width="${n(0.11 * k)}" stroke-linecap="round"/>`;
  }
  // the houses across the lane on the left (plaster fronts, steep roofs, lit windows)
  const HS_ = [[-15.5, -12.2, 4.6, "#c9a089", 15.5], [-12.2, -9.2, 5.3, "#a8869a", 15], [-9.2, -6.3, 4.3, "#d2b08a", 14.4], [-6.3, -3.2, 4.9, "#b98f8a", 13.8]];
  for (const [xa, xb, h, col, z] of HS_) {
    s += flat(c, [[xa - 0.2, h, z], [(xa + xb) / 2 + jit(xa, 0.4), h + 2.3, z], [xb + 0.2, h, z]], T(mix(col, "#5a2a3a", 0.6)), xa);
    s += flat(c, [[xa, h, z], [xb, h, z], [xb, 0, z], [xa, 0, z]], T(col), xa + 1);
    for (let k = 0; k < 4; k++) { const wx = xa + 0.5 + (k % 2) * ((xb - xa) - 1.7) + jit(xa + k, 0.12), wy = 1.3 + (k >> 1) * 1.7 + jit(xa + k + 4, 0.1), lit = hash(xa * 3 + k) > 0.45;
      s += flat(c, [[wx, wy + 1.0, z], [wx + 0.7, wy + 1.0, z], [wx + 0.7, wy, z], [wx, wy, z]], lit ? R[4] : T("#3a2a4a"), k + xa) + ln3(c, [[wx + 0.35, wy + 1.0, z], [wx + 0.35, wy, z]], T("#4a3040"), 0.05, k); }
    s += flat(c, [[(xa + xb) / 2 - 0.5, 2.1, z], [(xa + xb) / 2 + 0.5, 2.1, z], [(xa + xb) / 2 + 0.5, 0, z], [(xa + xb) / 2 - 0.5, 0, z]], T("#4a2a3a"), xa + 7);
  }
  // cobbles: the lane running back on the left, then the square in front of the wall
  const cb = [T("#7a5a80"), T("#8a6a8a"), R[4], T("#a888a8")], lz = S.lamp, lit = (x, z) => clamp(1 - Math.hypot((x - lz.X) / 2.2, (z - lz.Z + 0.9) / 1.6)) * 0.75;
  s += `<path d="M0,${n(hy - 2)} L${W},${n(hy - 2)} L${W},${H} L0,${H} Z" fill="${T("#4a3258")}"/>`;
  s += cobbles(c, m, () => -16, () => S.x0, wz, 14, cb, 7, lit) + cobbles(c, m, () => -16, () => 9, Math.max(1.6, c.z + 0.4), wz, cb, 3, lit);
  // the low annex at the left of the hall: plaster, a tile roof leaning on the big wall
  { const z = wz + 0.5, a0 = -3.4, a1 = S.x0;
    s += face(c, [[a0, 2.5, z], [a1, 2.5, z], [a1, 0, z], [a0, 0, z]], T("#b98f86"), 41);
    s += face(c, [[a0 - 0.15, 2.45, z - 0.25], [a1, 2.45, z - 0.25], [a1, 3.3, z + 0.9], [a0 - 0.15, 3.3, z + 0.9]], T("#8a3a3a"), 42);
    for (let k = 1; k < 5; k++) s += ln3(c, [[a0 - 0.15, 2.45 + k * 0.17, z - 0.25 + k * 0.23], [a1, 2.45 + k * 0.17, z - 0.25 + k * 0.23]], T("#5a2030"), 0.02, k + 40);
    for (let k = 0; k < 11; k++) s += ln3(c, [[a0 + k * 0.23, 2.46, z - 0.25], [a0 + k * 0.23 + jit(k, 0.03), 2.62, z - 0.03]], T("#5a2030"), 0.014, k);
    s += face(c, [[-2.75, 1.95, z], [-2.5, 2.15, z], [-2.25, 1.95, z], [-2.25, 0, z], [-2.75, 0, z]], T("#3a2238"), 43) + ln3(c, [[-2.5, 2.1, z], [-2.5, 0, z]], T("#2a1528"), 0.02, 3);
    s += face(c, [[-1.65, 1.9, z], [-1.3, 1.9, z], [-1.3, 1.3, z], [-1.65, 1.3, z]], R[4], 44) + ln3(c, [[-1.475, 1.9, z], [-1.475, 1.3, z]], T("#3a2238"), 0.03, 4);
  }
  // ---- the big wall: plaster, stone plinth. Everything on the wall is drawn at 1/VS height and squashed (legend scale:
  // the real hall is far taller; this keeps the kid readable and the sky open in the wide)
  { const yg = P(c, 0, 0, wz).y; s += `<g transform="translate(0,${n(yg)}) scale(1,${SYN.VS}) translate(0,${n(-yg)})">`; }
  const pla = T("#c59a8c"), plaD = T("#a67a78"), plaL = T("#e2bca0"), brick = ["#a8483a", "#b85a3e", "#96382f", "#c26a48", "#7a2c2c"].map((x) => T(x)), mortar = T("#5a2f3a");
  s += face(c, [[S.x0, S.eave, wz], [S.x1, S.eave, wz], [S.x1, 0, wz], [S.x0, 0, wz]], pla, 11);
  // big uneven patches of older plaster (flat, lighter or darker)
  for (const [u, v, ru, rv, d] of [[0.2, 4.2, 0.9, 0.55, 1], [2.1, 1.4, 1.1, 0.6, 0], [4.9, 2.6, 0.8, 1.2, 1], [1.9, 3.9, 0.7, 0.4, 0], [5.6, 4.4, 0.6, 0.4, 1], [-0.3, 1.9, 0.5, 0.9, 0]]) {
    const cp = w(u, v); s += blob(cp.x, cp.y, ru * cp.s, rv * cp.s, d ? plaD : plaL, u * 9 + v, { N: 11, irr: 0.22, ex: `opacity="0.55"` }); }
  // chipped plaster: the brick shows through, a few single bricks drawn in each hole
  for (const [u, v, r] of [[-0.45, 0.95, 0.42], [2.3, 0.85, 0.5], [0.35, 2.55, 0.34], [3.55, 3.3, 0.3], [5.75, 1.3, 0.55], [1.75, 4.55, 0.26], [4.9, 4.6, 0.3], [5.9, 3.3, 0.22]]) {
    const cp = w(u, v), sd = u * 13 + v * 7, id = `ch${Math.round(sd * 10)}`;
    s += `<clipPath id="${id}"><path d="${wpath(blobPts(cp.x, cp.y, r * cp.s, r * 0.72 * cp.s, sd, 10, 0.3), sd, 1)}"/></clipPath>` + blob(cp.x + 0.02 * cp.s, cp.y + 0.025 * cp.s, r * 1.06 * cp.s, r * 0.76 * cp.s, plaL, sd, { N: 10, irr: 0.3 }) + `<g clip-path="url(#${id})"><rect x="${n(cp.x - r * cp.s * 1.4)}" y="${n(cp.y - r * cp.s)}" width="${n(r * cp.s * 2.8)}" height="${n(r * cp.s * 2)}" fill="${mortar}"/>`;
    for (let ry = -3; ry <= 3; ry++) for (let rx = -2; rx <= 2; rx++) { const bx = u + rx * 0.3 + (ry & 1) * 0.15, by = v + ry * 0.11; if (hash(sd + rx * 5 + ry * 11) < 0.15) continue; s += pg([w(bx - 0.14, by + 0.045), w(bx + 0.14, by + 0.05), w(bx + 0.138, by - 0.045), w(bx - 0.138, by - 0.04)], brick[Math.floor(hash(sd + rx + ry * 7) * 5)]); }
    s += `</g>`;
  }
  // cracks, rain streaks, the stone plinth
  for (const [u, v, l, sd] of [[0.3, 5.0, 1.5, 3], [3.4, 5.0, 1.1, 7], [5.3, 2.4, 1.3, 12], [-0.6, 3.2, 0.9, 16], [2.0, 2.6, 0.8, 22]]) s += `<path d="${crackD(f, u, v, l, sd)}" fill="none" stroke="${T("#5a3048")}" stroke-width="${n(Math.max(1, 0.012 * w(u, v).s))}" stroke-linejoin="round" stroke-linecap="round"/>`;
  for (let k = 0; k < 9; k++) { const u = S.x0 + 0.5 + hash(k + 200) * 6.4, l = 0.5 + hash(k + 210) * 1.3; s += pg([w(u, S.eave - 0.05), w(u + 0.05 + hash(k) * 0.05, S.eave - 0.05), w(u + 0.03, S.eave - l)], plaD, `opacity="0.7"`); }
  { let x = S.x0, i = 0; while (x < S.x1 - 0.01) { const wd = Math.min(S.x1 - x, 0.45 + 0.5 * hash(i + 300)), h = 0.5 + jit(i + 310, 0.05); s += sh([w(x, h), w(x + wd, h + jit(i, 0.03)), w(x + wd, 0), w(x, 0)], T(["#8a6a78", "#7a5a70", "#96788a"][i % 3]), i + 320, { lw: LW(w(x, 0).s) * 0.7 }); x += wd; i++; } }
  // grass and a weed in the joint at the wall's foot (hand-placed)
  for (const [u, h, sd] of [[-0.6, 0.16, 1], [0.25, 0.1, 2], [1.7, 0.22, 3], [2.05, 0.12, 4], [3.3, 0.15, 5], [5.2, 0.2, 6], [5.9, 0.1, 7]]) for (let k = 0; k < 4; k++) s += pg([PZ(c, u + k * 0.035, 0, wz - 0.03), PZ(c, u + k * 0.035 + 0.03, 0, wz - 0.03), PZ(c, u + k * 0.035 + jit(sd + k, 0.06), h * (0.6 + 0.6 * hash(sd * 3 + k)), wz - 0.03)], T(k % 2 ? "#5a8a5a" : "#3f6f55"));
  // a pointed window with candle light behind it, and a small one further right
  for (const [u, y0, y1, hw, sd] of [[2.95, 1.9, 4.3, 0.27, 1], [5.35, 2.5, 3.9, 0.2, 2]]) {
    const arch = (g, yy = 0) => [[u - hw - g, y0 - g], [u - hw - g, y1 - 0.5 + yy], [u - hw * 0.5 - g * 0.6, y1 - 0.14 + g * 0.5], [u, y1 + g], [u + hw * 0.5 + g * 0.6, y1 - 0.14 + g * 0.5], [u + hw + g, y1 - 0.5 + yy], [u + hw + g, y0 - g]].map(([a, b]) => w(a, b));
    s += sh(arch(0.13), T("#b8a0a0"), sd + 50) + sh(arch(0), mix(R[3], R[4], 0.7), sd + 52, { lw: LW(w(u, y0).s) * 0.7 });
    s += `<path d="${wpath([w(u - hw * 0.55, y0 + 0.1), w(u - hw * 0.55, y1 - 0.6), w(u, y1 - 0.25), w(u + hw * 0.5, y1 - 0.62), w(u + hw * 0.5, y0 + 0.1)], sd + 54, 2)}" fill="${R[5]}" opacity="0.8"/>`;
    for (let k = 1; k < 5; k++) s += ln3(c, [[u - hw, lerp(y0, y1 - 0.4, k / 5), wz], [u + hw, lerp(y0, y1 - 0.4, k / 5) + jit(k + sd, 0.02), wz]], T("#3a2238"), 0.018, k);
    s += ln3(c, [[u, y0, wz], [u, y1 - 0.05, wz]], T("#3a2238"), 0.022, sd) + sh([w(u - hw - 0.22, y0 - 0.1), w(u + hw + 0.22, y0 - 0.1), w(u + hw + 0.18, y0 - 0.24), w(u - hw - 0.18, y0 - 0.24)], T("#a08a92"), sd + 56);
  }
  // a stepped buttress
  s += box(c, 3.95, 4.6, 0, 2.5, wz - 0.55, wz, [T("#b08a86"), T("#d0a898"), T("#8a6470")], 61) + box(c, 4.02, 4.53, 2.5, 4.0, wz - 0.3, wz, [T("#b89088"), T("#d0a898"), T("#8a6470")], 66);
  s += face(c, [[3.95, 2.5, wz - 0.55], [4.6, 2.5, wz - 0.55], [4.53, 2.78, wz - 0.3], [4.02, 2.78, wz - 0.3]], T("#8a3a3a"), 71) + face(c, [[4.02, 4.0, wz - 0.3], [4.53, 4.0, wz - 0.3], [4.5, 4.4, wz], [4.05, 4.4, wz]], T("#8a3a3a"), 72);
  for (const [u, v] of [[4.1, 0.7], [4.4, 1.5], [4.15, 2.1], [4.3, 3.3]]) s += ln3(c, [[u, v, wz - (v < 2.5 ? 0.55 : 0.3)], [u + 0.22, v + jit(u + v, 0.03), wz - (v < 2.5 ? 0.55 : 0.3)]], T("#6a4458"), 0.012, u * 3 + v);
  // ---- the brick gable: every brick, the stepped edge, blind pointed niches
  const xc = (S.x0 + S.x1) / 2, out = [], RH = 0.17;
  for (let i = 0; i < GST; i++) { const y0 = S.eave + (S.peak - S.eave) * i / GST, y1 = S.eave + (S.peak - S.eave) * (i + 1) / GST, [xl] = gableX(y0 + 0.01); out.push([xl, y0 - (i ? 0.0 : 0.05)], [xl - 0.02, y1 - 0.2], [xl + 0.2, y1 + 0.03]); }
  out.push([xc - 0.12, S.peak + 0.5], [xc + 0.12, S.peak + 0.5]);
  for (let i = GST - 1; i >= 0; i--) { const y0 = S.eave + (S.peak - S.eave) * i / GST, y1 = S.eave + (S.peak - S.eave) * (i + 1) / GST, xr = gableX(y0 + 0.01)[1]; out.push([xr - 0.2, y1 + 0.03], [xr + 0.02, y1 - 0.2], [xr, y0 - (i ? 0 : 0.05)]); }
  const outP = out.map(([a, b]) => w(a, b));
  s += `<clipPath id="gab"><path d="${wpath(outP, 81, 1)}"/></clipPath><path d="${wpath(outP, 81, 1)}" fill="${mortar}" stroke="${INK}" stroke-width="${LW(outP[0].s)}" stroke-linejoin="round"/><g clip-path="url(#gab)">`;
  for (let r = 0, y = S.eave; y < S.peak + 0.5; r++, y += RH) {
    const [xl, xr] = gableX(y + RH * 0.5);
    for (let x = xl - 0.3 + (r & 1) * 0.2 - hash(r) * 0.08, j = 0; x < xr + 0.2; j++) {
      const bw = 0.36 + 0.07 * hash(r * 13 + j), id = r * 37 + j; const x1 = x + bw - 0.03; 
      if (hash(id + 2) > 0.035) s += pg([w(x, y + RH - 0.022 + jit(id, 0.008)), w(x1, y + RH - 0.022 + jit(id + 1, 0.008)), w(x1 + jit(id + 3, 0.006), y + 0.012), w(x, y + 0.012)], brick[hash(id) > 0.9 ? 4 : Math.floor(hash(id + 7) * 4)]);
      x += bw;
    }
  }
  // the evening sun still on the upper gable: one flat step of light with a hard slanted edge
  s += pg([w(S.x0 - 1, 7.25), w(S.x1 + 1, 6.3), w(S.x1 + 1, 12), w(S.x0 - 1, 12)], R[4], `opacity="0.3" style="mix-blend-mode:screen"`) + pg([w(S.x0 - 1, 8.35), w(S.x1 + 1, 7.4), w(S.x1 + 1, 12), w(S.x0 - 1, 12)], R[5], `opacity="0.16" style="mix-blend-mode:screen"`);
  s += `</g>`;
  // stone caps on the steps
  for (let i = 0; i < GST; i++) for (const sd of [0, 1]) { const y1 = S.eave + (S.peak - S.eave) * (i + 1) / GST, xx = gableX(y1 - 0.3)[sd], d = sd ? -1 : 1; s += sh([w(xx - d * 0.07, y1 - 0.2), w(xx + d * 0.26, y1 + 0.06), w(xx + d * 0.26, y1 - 0.06), w(xx - d * 0.07, y1 - 0.32)], T("#b89aa0"), i * 2 + sd + 90, { lw: LW(outP[0].s) * 0.7 }); }
  const niche = (u, y0, y1, hw, sd, fill) => sh([[u - hw, y0], [u - hw, y1 - hw * 1.3], [u, y1], [u + hw, y1 - hw * 1.3], [u + hw, y0]].map(([a, b]) => w(a, b)), fill, sd, { lw: LW(outP[0].s) * 0.8 });
  for (const [u, y0, y1, hw, sd] of [[2.75, 5.7, 8.5, 0.3, 1], [4.3, 5.6, 7.15, 0.27, 2], [-0.05, 5.35, 5.95, 0.2, 3], [5.45, 5.35, 6.0, 0.2, 4], [1.95, 6.2, 7.6, 0.2, 5], [3.5, 6.6, 7.9, 0.2, 6]]) {
    s += niche(u, y0, y1, hw, sd + 100, T("#5a2030")) + pg([w(u - hw, y0), w(u - hw, y1 - hw * 1.3), w(u - hw * 0.45, y1 - hw * 1.1), w(u - hw * 0.45, y0)], T("#3a1428"), `opacity="0.8"`) + sh([w(u - hw - 0.06, y0 + 0.02), w(u + hw + 0.06, y0 + 0.02), w(u + hw + 0.04, y0 - 0.09), w(u - hw - 0.04, y0 - 0.09)], T("#b89aa0"), sd + 110, { lw: 1 });
  }
  s += face(c, [[S.x0 - 0.12, S.eave + 0.06, wz - 0.06], [S.x1 + 0.12, S.eave + 0.06, wz - 0.06], [S.x1 + 0.12, S.eave - 0.12, wz - 0.06], [S.x0 - 0.12, S.eave - 0.12, wz - 0.06]], T("#a88a92"), 120);
  // ---- the attic door (small, iron-strapped, shut) and the iron rungs: U-shaped staples, each a little different
  const D = S.door, iron = T("#2a1a2e"), rust = T("#8a3a2a");
  s += niche(D.X, D.y0 - 0.1, D.y1 + 0.42, D.w / 2 + 0.12, 130, T("#4a1a2a"));
  s += sh([[D.X - D.w / 2, D.y0], [D.X - D.w / 2, D.y1 - 0.18], [D.X, D.y1 + 0.12], [D.X + D.w / 2, D.y1 - 0.18], [D.X + D.w / 2, D.y0]].map(([a, b]) => w(a, b)), T("#5a3a2e"), 131);
  for (const dx of [-0.19, -0.02, 0.17]) s += ln3(c, [[D.X + dx, D.y0, wz], [D.X + dx + jit(dx, 0.015), D.y1 - 0.08, wz]], T("#2f1a1e"), 0.014, dx * 9 + 3);
  for (const yy of [D.y0 + 0.2, D.y1 - 0.34]) s += sh([w(D.X - D.w / 2, yy + 0.04), w(D.X + D.w / 2 - 0.12, yy + 0.05), w(D.X + D.w / 2 - 0.06, yy), w(D.X + D.w / 2 - 0.12, yy - 0.04), w(D.X - D.w / 2, yy - 0.04)], iron, yy * 5, { lw: 0.8 });
  { const q = w(D.X + 0.2, D.y0 + 0.5); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(0.045 * q.s)}" fill="none" stroke="${iron}" stroke-width="${n(0.02 * q.s)}"/>`; }
  s += sh([w(D.X - D.w / 2 - 0.2, D.y0), w(D.X + D.w / 2 + 0.2, D.y0), w(D.X + D.w / 2 + 0.16, D.y0 - 0.12), w(D.X - D.w / 2 - 0.16, D.y0 - 0.12)], T("#b89aa0"), 135);
  for (let i = 0; i < S.rungN; i++) {
    const y = S.rung0 + i * S.rungStep + jit(i + 500, 0.02), hw = 0.2 + jit(i + 510, 0.015), tl = jit(i + 520, 0.022) + (i === 2 ? 0.05 : 0), x = S.rungX + jit(i + 530, 0.02), zo = wz - 0.15;
    const a = w(x - hw, y - tl), b = w(x + hw, y + tl), a2 = PZ(c, x - hw, y - tl - 0.02, zo), b2 = PZ(c, x + hw, y + tl - 0.02, zo), lw = Math.max(1.6, 0.034 * a.s);
    // rust weeping down the plaster under each staple, and the staple's flat shadow
    for (const q of [[x - hw, y - tl], [x + hw, y + tl]]) s += pg([w(q[0] - 0.022, q[1]), w(q[0] + 0.022, q[1]), w(q[0] + jit(i + q[0], 0.02), q[1] - 0.22 - hash(i + q[0] * 3) * 0.3)], rust, `opacity="0.6"`);
    s += `<path d="M${n(a.x + lw)},${n(a.y + lw * 1.6)} L${n(b.x + lw * 1.4)},${n(b.y + lw * 1.6)}" stroke="${T("#5a3048")}" stroke-width="${n(lw)}" stroke-linecap="round" opacity="0.55"/>`;
    s += `<path d="M${n(a.x)},${n(a.y)} L${n(a2.x)},${n(a2.y)} L${n(b2.x)},${n(b2.y)} L${n(b.x)},${n(b.y)}" fill="none" stroke="${INK}" stroke-width="${n(lw + 2)}" stroke-linejoin="round" stroke-linecap="round"/><path d="M${n(a.x)},${n(a.y)} L${n(a2.x)},${n(a2.y)} L${n(b2.x)},${n(b2.y)} L${n(b.x)},${n(b.y)}" fill="none" stroke="${iron}" stroke-width="${n(lw)}" stroke-linejoin="round" stroke-linecap="round"/><path d="M${n(a2.x + lw)},${n(a2.y - lw * 0.2)} L${n(b2.x - lw)},${n(b2.y - lw * 0.2)}" stroke="${T("#8a6a8a")}" stroke-width="${n(lw * 0.3)}" stroke-linecap="round"/>`;
    for (const q of [a, b]) s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(lw * 0.9)}" fill="${rust}" stroke="${INK}" stroke-width="0.8"/>`;
  }
  // a drainpipe and a small blank brass plate (today)
  s += ln3(c, [[S.x0 + 0.22, S.eave, wz - 0.08], [S.x0 + 0.22, 0.2, wz - 0.08], [S.x0 + 0.05, 0.05, wz - 0.2]], T("#3a2a48"), 0.09, 140) + ln3(c, [[S.x0 + 0.2, S.eave, wz - 0.1], [S.x0 + 0.2, 0.25, wz - 0.1]], T("#6a5a80"), 0.02, 141);
  for (const yy of [1.3, 3.2, 4.7]) s += ln3(c, [[S.x0 + 0.13, yy, wz - 0.08], [S.x0 + 0.31, yy, wz - 0.08]], INK, 0.03, yy);
  s += face(c, [[1.85, 1.75, wz - 0.02], [2.3, 1.76, wz - 0.02], [2.3, 1.45, wz - 0.02], [1.85, 1.46, wz - 0.02]], T("#c9a24a"), 150) + ln3(c, [[1.92, 1.67, wz - 0.03], [2.22, 1.67, wz - 0.03]], T("#8a6a2a"), 0.012, 1) + ln3(c, [[1.92, 1.6, wz - 0.03], [2.16, 1.6, wz - 0.03]], T("#8a6a2a"), 0.012, 2) + ln3(c, [[1.92, 1.53, wz - 0.03], [2.2, 1.53, wz - 0.03]], T("#8a6a2a"), 0.012, 3);
  // the wall's lower part already in the lane's shadow: one flat violet step with a hard slanted edge
  s += pg([w(S.x0, 0), w(S.x0, 3.0), w(S.x1, 4.55), w(S.x1, 0)], R[1], `opacity="0.32" style="mix-blend-mode:multiply"`);
  s += `</g>`;
  // ---- the old street lamp: iron post, six-sided lantern, a flat pool of gold
  if (vis(c, lz.Z)) {
    const ft = P(c, lz.X, 0, lz.Z), hd = P(c, lz.X, 3.1, lz.Z), k = ft.s, fl = 1 + 0.05 * Math.sin(t * 17) + 0.03 * Math.sin(t * 29);
    const pp = P(c, lz.X + 0.5, 0, lz.Z - 0.9); s += pool(pp.x, pp.y, 2.6 * pp.s, 0.62 * pp.s, R[4], 0.13 * fl, 9, 3, t);
    s += `<path d="${wp([[ft.x - 0.16 * k, ft.y], [ft.x - 0.09 * k, ft.y - 0.5 * k], [ft.x - 0.045 * k, ft.y - 0.56 * k], [hd.x - 0.04 * k, hd.y + 0.34 * k], [hd.x + 0.04 * k, hd.y + 0.34 * k], [ft.x + 0.05 * k, ft.y - 0.56 * k], [ft.x + 0.1 * k, ft.y - 0.5 * k], [ft.x + 0.17 * k, ft.y]], 160)}" fill="${iron}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
    s += `<path d="M${n(hd.x - 0.3 * k)},${n(hd.y + 1.0 * k)} L${n(hd.x + 0.3 * k)},${n(hd.y + 1.0 * k)}" stroke="${iron}" stroke-width="${n(0.05 * k)}" stroke-linecap="round"/>`;
    s += pool(hd.x, hd.y, 1.5 * k, 1.5 * k, R[4], 0.12 * fl, 12, 3, t);
    s += `<path d="${wp([[hd.x - 0.15 * k, hd.y + 0.34 * k], [hd.x - 0.26 * k, hd.y - 0.24 * k], [hd.x + 0.26 * k, hd.y - 0.24 * k], [hd.x + 0.15 * k, hd.y + 0.34 * k]], 161)}" fill="${R[5]}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
    s += `<path d="${wp([[hd.x - 0.06 * k, hd.y + 0.2 * k], [hd.x - 0.1 * k, hd.y - 0.1 * k], [hd.x + 0.02 * k, hd.y - 0.2 * k], [hd.x + 0.1 * k, hd.y - 0.04 * k], [hd.x + 0.06 * k, hd.y + 0.2 * k]], 162)}" fill="${R[4]}"/>`;
    s += `<path d="M${n(hd.x - 0.09 * k)},${n(hd.y + 0.34 * k)} L${n(hd.x - 0.14 * k)},${n(hd.y - 0.24 * k)} M${n(hd.x + 0.09 * k)},${n(hd.y + 0.34 * k)} L${n(hd.x + 0.14 * k)},${n(hd.y - 0.24 * k)}" stroke="${iron}" stroke-width="${n(0.025 * k)}"/>`;
    s += `<path d="${wp([[hd.x - 0.34 * k, hd.y - 0.22 * k], [hd.x - 0.1 * k, hd.y - 0.46 * k], [hd.x, hd.y - 0.62 * k], [hd.x + 0.1 * k, hd.y - 0.46 * k], [hd.x + 0.34 * k, hd.y - 0.22 * k]], 163)}" fill="${iron}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
  }
  // fallen leaves on the cobbles (hand-placed)
  for (const [X, Z, r, sd] of [[-0.9, 6.4, 20, 1], [0.5, 5.9, 60, 2], [1.9, 6.9, 130, 3], [2.6, 5.6, 200, 4], [-1.9, 7.2, 300, 5], [3.4, 7.3, 40, 6], [0.1, 4.9, 250, 7], [1.5, 4.4, 95, 8]]) if (vis(c, Z)) { const q = P(c, X, 0, Z), k = q.s * 0.07; s += `<path d="M0,${n(-k)} Q${n(k * 0.8)},${n(-k * 0.2)} 0,${n(k)} Q${n(-k * 0.7)},${n(k * 0.1)} 0,${n(-k)} Z" fill="${sd % 3 ? R[4] : R[3]}" transform="translate(${n(q.x)},${n(q.y)}) rotate(${r}) scale(1,0.45)"/>`; }
  return s;
}

// ================================================================ SET B: the Vltava bank, around 1600, at dawn
// Wet red-brown clay bank in front (the golem lies on it), reeds at the water's edge, mist in flat strips, the castle
// on its hill and the stone bridge far off. opts: { mist 0..1, pit 0..1 (the dug hollow the clay came from) }.
export const RIVER = { edge: 9.2, golem: { X: 0.25, Z: 6.4 }, rabbi: { X: -1.75, Z: 6.0 }, lantern: { X: -2.5, Z: 6.9 }, bucket: { X: 2.3, Z: 7.3 },
  CAM: { wide: { x: 0, y: 2.1, z: 0.6 }, shape: { x: -0.9, y: 1.25, z: 2.6 }, face: { x: -1.1, y: 0.95, z: 4.2 }, stand: { x: 0.2, y: 1.7, z: 0.9 } } };
const bankZ = (x) => RIVER.edge + 0.5 * Math.sin(x * 0.7 + 1) + 0.25 * Math.sin(x * 1.9);
export function river(c, t, m, o = {}) {
  const T = (col, k) => tone(m, col, k), R = m.ramp, hy = c.h0 ?? 1140, V = RIVER, mist = o.mist ?? 1;
  let s = bands([R[1], mix(R[1], R[2], 0.6), R[2], mix(R[2], R[3], 0.55), mix(R[3], R[4], 0.6), R[4]], [0, hy - 900, hy - 640, hy - 420, hy - 250, hy - 120], 15);
  // the low sun: a flat disc and two hand-cut rings
  const sx = 800 - c.x * 6, sy = hy - 96;
  s += blob(sx, sy, 190, 150, R[5], 3, { N: 16, irr: 0.05, ex: `opacity="0.22"` }) + blob(sx, sy, 120, 100, R[5], 4, { N: 16, irr: 0.05, ex: `opacity="0.3"` }) + blob(sx, sy, 62, 60, R[5], 5, { N: 16, irr: 0.03 });
  s += cloud(40 - c.x * 5, hy - 300, 460, 36, mix(R[3], R[4], 0.5), 5, 0.85) + cloud(560 - c.x * 5, hy - 520, 380, 30, mix(R[2], R[3], 0.5), 9, 0.8);
  // the castle on the hill (silhouette, far left) and the stone bridge with its gate tower
  { const px = -c.x * 7, far = mix(R[1], R[2], 0.75), X = (v) => v + px, hill = [[-60, hy + 10], [-60, hy - 150], [120, hy - 210], [330, hy - 225], [520, hy - 170], [700, hy - 80], [830, hy - 40], [940, hy + 10]];
    s += `<path d="${wp(hill.map(([a, b]) => [X(a), b]), 31, 3)}" fill="${far}"/>`;
    const blk = (x0, x1, y0, sd, col = far) => `<path d="${wp([[X(x0), hy - 150], [X(x0), hy - y0], [X(x1), hy - y0 - jit(sd, 4)], [X(x1), hy - 150]], sd)}" fill="${col}"/>`, dk = mix(R[1], R[2], 0.45);
    s += blk(60, 470, 262, 1, dk) + blk(40, 110, 285, 2, dk) + blk(420, 500, 280, 3, dk);
    s += `<path d="${wp([[X(40), hy - 284], [X(75), hy - 330], [X(110), hy - 284]], 4)}" fill="${dk}"/><path d="${wp([[X(420), hy - 279], [X(460), hy - 318], [X(500), hy - 279]], 5)}" fill="${dk}"/>`;
    // the cathedral: a tall tower with a bulbed cap and a spiky choir
    s += `<path d="${wp([[X(232), hy - 255], [X(232), hy - 370], [X(224), hy - 378], [X(238), hy - 402], [X(252), hy - 420], [X(259), hy - 452], [X(266), hy - 420], [X(280), hy - 402], [X(294), hy - 378], [X(286), hy - 370], [X(286), hy - 255]], 6)}" fill="${dk}"/>`;
    s += `<path d="${wp([[X(286), hy - 255], [X(286), hy - 318], [X(300), hy - 352], [X(312), hy - 318], [X(326), hy - 346], [X(338), hy - 316], [X(352), hy - 340], [X(364), hy - 310], [X(364), hy - 255]], 7)}" fill="${dk}"/>`;
    for (let k = 0; k < 14; k++) s += `<rect x="${n(X(74 + k * 28 + jit(k, 5)))}" y="${n(hy - 236 + jit(k + 3, 6))}" width="5" height="9" fill="${k % 5 === 2 ? R[4] : far}" opacity="0.9"/>`;
    for (let k = 0; k < 9; k++) s += `<path d="${wp([[X(150 + k * 62 + jit(k, 18)), hy - 150 + k * 9], [X(170 + k * 62), hy - 172 + k * 9 - hash(k) * 14], [X(196 + k * 62), hy - 150 + k * 9]], k + 40, 1)}" fill="${mix(far, R[2], 0.3)}"/>`;
    const by = hy - 30, bc = mix(R[0], R[1], 0.55);
    s += `<path d="M${n(X(250))},${n(by - 30)} L${n(X(1200))},${n(by - 30)} L${n(X(1200))},${n(by + 16)} ${[6, 5, 4, 3, 2, 1, 0].map((k) => `L${n(X(330 + k * 128 + 104))},${n(by + 16)} Q${n(X(330 + k * 128 + 52))},${n(by - 30 + jit(k, 3))} ${n(X(330 + k * 128))},${n(by + 16)}`).join(" ")} L${n(X(250))},${n(by + 16)} Z" fill="${bc}"/>`;
    s += `<path d="${wp([[X(262), by + 16], [X(262), by - 84], [X(252), by - 92], [X(280), by - 138], [X(300), by - 150], [X(320), by - 138], [X(348), by - 92], [X(338), by - 84], [X(338), by + 16]], 8)}" fill="${bc}"/><path d="${wp([[X(288), by + 16], [X(288), by - 22], [X(300), by - 34], [X(312), by - 22], [X(312), by + 16]], 9, 1)}" fill="${R[1]}"/>`;
  }
  // the river: flat bands, the sun's broken reflection, drifting mist strips
  const wy = hy - 8;
  s += `<path d="M0,${n(wy)} L${W},${n(wy)} L${W},${H} L0,${H} Z" fill="${mix(R[1], R[2], 0.7)}"/>`;
  for (let k = 0; k < 7; k++) { const y = wy + 14 + k * k * 5.5 + k * 9; s += `<path d="${wp([[-20, y], [300 + jit(k, 60), y + jit(k + 2, 6)], [700, y + jit(k + 5, 6)], [W + 20, y], [W + 20, y + 10 + k * 3], [600 + jit(k + 9, 80), y + 14 + k * 4], [-20, y + 9 + k * 3]], k + 60, 2)}" fill="${k % 2 ? R[2] : mix(R[1], R[2], 0.45)}" opacity="0.7"/>`; }
  for (let k = 0; k < 9; k++) { const y = wy + 10 + k * 15 + k * k * 1.6, wd = 30 + hash(k + 70) * 90 + k * 10, x = sx - wd / 2 + jit(k + 75, 40) + 8 * Math.sin(t * 1.3 + k); s += `<path d="${wp([[x, y], [x + wd, y + jit(k, 2)], [x + wd * 0.9, y + 6 + k * 0.7], [x + wd * 0.1, y + 5 + k * 0.7]], k + 80, 1)}" fill="${k % 3 ? R[4] : R[5]}" opacity="0.85"/>`; }
  const mistS = (y, sd, op, sp) => { let r = ""; for (let k = 0; k < 4; k++) { const wd = 520 + hash(sd + k) * 420, x = ((hash(sd + k * 7) * 1700 + t * sp * (0.6 + hash(sd + k + 2))) % 1900) - 500 - c.x * 20, h = 26 + hash(sd + k * 3) * 30; r += `<path d="${wp([[x, y + jit(sd + k, 18)], [x + wd * 0.25, y - h * 0.6], [x + wd * 0.6, y - h], [x + wd, y - h * 0.2], [x + wd * 0.8, y + h * 0.5], [x + wd * 0.3, y + h * 0.7]], sd + k, 3)}" fill="${R[5]}" opacity="${n(op * mist)}"/>`; } return r; };
  s += mistS(wy - 12, 100, 0.34, 9) + mistS(wy + 60, 120, 0.26, 14);
  // ---- the clay bank
  const clay = ["#a4472a", "#b9562f", "#7a2f20", "#d27a48", "#551c1a"].map((x) => tone(m, x, 0.26));
  const eP = []; for (let x = -9; x <= 9; x += 0.75) eP.push(P(c, x, 0, bankZ(x)));
  const bankD = `M${n(eP[0].x - 200)},${n(eP[0].y)} ` + eP.map((p) => `L${n(p.x)},${n(p.y + jit(p.x * 0.01, 3))}`).join(" ") + ` L${W + 200},${n(eP[eP.length - 1].y)} L${W + 200},${H + 50} L-200,${H + 50} Z`;
  s += `<path d="${bankD}" fill="${clay[2]}" transform="translate(0,-9)"/><path d="${bankD}" fill="${clay[0]}"/>`;
  // wet sheen at the waterline, darker and lighter flats of clay, puddles holding the sky
  const patch = (X, Z, rx, rz, col, sd, op = 1) => { if (!vis(c, Z - rz)) return ""; const q = P(c, X, 0, Z), ry = Math.max(3, (P(c, X, 0, Math.max(c.z + 0.3, Z - rz)).y - P(c, X, 0, Z + rz).y) / 2); return blob(q.x, q.y, rx * q.s, ry, col, sd, { N: 12, irr: 0.2, ex: `opacity="${op}"` }); };
  for (const [X, Z, rx, rz, ci, sd] of [[-3.5, 8.3, 2.4, 0.5, 2, 1], [1.5, 8.5, 3.2, 0.45, 2, 2], [5.5, 8.2, 2.0, 0.5, 2, 3], [-2.6, 6.6, 1.8, 0.7, 1, 4], [2.9, 5.6, 2.2, 0.8, 1, 5], [-0.4, 4.3, 2.6, 0.7, 1, 6], [-4.4, 4.9, 1.5, 0.6, 2, 7], [4.6, 7.0, 1.3, 0.5, 3, 8], [0.6, 3.1, 2.0, 0.5, 2, 9], [-2.0, 3.0, 1.2, 0.4, 3, 10], [3.6, 3.6, 1.4, 0.45, 2, 11]]) s += patch(X, Z, rx, rz, clay[ci], sd + 200, 0.85);
  for (const [X, Z, rx, rz, sd] of [[-3.9, 7.5, 0.7, 0.2, 1], [3.7, 8.0, 0.9, 0.22, 2], [1.9, 4.4, 0.55, 0.2, 3], [-1.2, 3.5, 0.4, 0.14, 4]]) s += patch(X, Z, rx * 1.12, rz * 1.25, clay[4], sd + 230) + patch(X, Z, rx, rz, mix(R[2], R[3], 0.4), sd + 240) + patch(X + rx * 0.2, Z + rz * 0.2, rx * 0.5, rz * 0.4, R[4], sd + 250, 0.8);
  // the hollow the clay was dug from: scoops with finger furrows
  const pit = o.pit ?? 1;
  if (pit > 0) for (const [X, Z, r, sd] of [[2.6, 6.6, 0.75, 1], [3.5, 6.1, 0.5, 2], [1.9, 7.4, 0.42, 3]]) {
    s += patch(X, Z, r, r * 0.42, clay[4], sd + 260, pit) + patch(X + 0.06, Z - 0.06, r * 0.8, r * 0.3, clay[2], sd + 270, pit);
    for (let k = 0; k < 4; k++) s += ln3(c, [[X - r * 0.5 + k * r * 0.3, 0, Z + r * 0.25], [X - r * 0.4 + k * r * 0.3 + jit(k + sd, 0.05), 0, Z - r * 0.2]], clay[4], 0.03, k + sd * 5, `opacity="${n(0.8 * pit)}"`);
  }
  // footprints of a man walking to the water and back, pebbles, finger-smears
  for (let k = 0; k < 9; k++) { const X = -3.1 + k * 0.16 + (k % 2) * 0.24, Z = 8.6 - k * 0.45; if (!vis(c, Z)) continue; const q = P(c, X, 0, Z); s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(0.07 * q.s)}" ry="${n(0.035 * q.s)}" fill="${clay[4]}" opacity="0.75" transform="rotate(${n(-20 + jit(k, 10))} ${n(q.x)} ${n(q.y)})"/>`; }
  for (let k = 0; k < 26; k++) { const X = -5 + hash(k + 300) * 10, Z = 2.6 + hash(k + 310) * 6; if (!vis(c, Z)) continue; const q = P(c, X, 0, Z), r = (0.03 + hash(k + 320) * 0.06) * q.s; s += blob(q.x, q.y, r, r * 0.6, k % 3 ? T("#8a7a78") : T("#c8b8a8"), k + 330, { N: 7, irr: 0.25 }) + `<path d="M${n(q.x - r)},${n(q.y + r * 0.5)} q${n(r)},${n(r * 0.5)} ${n(r * 2)},0" stroke="${clay[4]}" stroke-width="${n(Math.max(1, r * 0.25))}" fill="none"/>`; }
  for (const [X, Z, a, sd] of [[-0.9, 5.0, 0.3, 1], [1.6, 5.2, -0.4, 2], [-3.0, 5.6, 0.9, 3], [4.2, 4.6, 0.2, 4], [0.2, 7.9, -0.2, 5], [-1.6, 7.8, 0.5, 6]]) for (let k = 0; k < 4; k++) s += ln3(c, [[X + k * 0.07, 0, Z + k * 0.04 * a], [X + k * 0.07 + 0.25 * a, 0, Z - 0.35], [X + k * 0.07 + 0.5 * a + jit(sd + k, 0.05), 0, Z - 0.7]], k % 2 ? clay[4] : clay[3], 0.022, sd * 9 + k, `opacity="0.7"`);
  // reeds and cattails at the water's edge, each clump planted by hand; they lean with a slow wind
  for (const [X, nb, h, sd] of [[-5.6, 9, 1.5, 1], [-4.3, 6, 1.1, 2], [-1.9, 5, 0.9, 3], [1.0, 4, 0.7, 4], [3.1, 8, 1.4, 5], [4.4, 5, 1.0, 6], [6.2, 9, 1.6, 7], [-7.4, 7, 1.3, 8]]) {
    const Z = bankZ(X) - 0.15; if (!vis(c, Z)) continue;
    for (let k = 0; k < nb; k++) { const x0 = X + (k - nb / 2) * 0.09 + jit(sd * 7 + k, 0.04), hh = h * (0.55 + 0.6 * hash(sd * 11 + k)), bend = jit(sd * 5 + k, 0.3) + 0.06 * Math.sin(t * 1.1 + sd + k * 0.7), a = P(c, x0 - 0.022, 0, Z), b = P(c, x0 + 0.022, 0, Z), md = P(c, x0 + bend * 0.4, hh * 0.6, Z), tp = P(c, x0 + bend, hh, Z);
      s += `<path d="M${n(a.x)},${n(a.y)} Q${n(md.x - 2)},${n(md.y)} ${n(tp.x)},${n(tp.y)} Q${n(md.x + 2)},${n(md.y)} ${n(b.x)},${n(b.y)} Z" fill="${T(k % 3 ? "#4f7a4a" : "#7a8f3f")}" stroke="${INK}" stroke-width="0.8"/>`;
      if (k % 3 === 0) { const ct = P(c, x0 + bend * 0.8, hh * 0.86, Z); s += `<path d="M0,${n(-0.13 * ct.s)} L0,${n(0.13 * ct.s)}" stroke="${INK}" stroke-width="${n(0.062 * ct.s)}" stroke-linecap="round" transform="translate(${n(ct.x)},${n(ct.y)}) rotate(${n(bend * 30)})"/><path d="M0,${n(-0.12 * ct.s)} L0,${n(0.12 * ct.s)}" stroke="${T("#6a3a22")}" stroke-width="${n(0.045 * ct.s)}" stroke-linecap="round" transform="translate(${n(ct.x)},${n(ct.y)}) rotate(${n(bend * 30)})"/>`; }
    }
  }
  // the rabbi's things: a horn lantern on the clay, a wooden bucket and a spade
  if (vis(c, V.lantern.Z)) { const q = P(c, V.lantern.X, 0, V.lantern.Z), k = q.s / 100, fl = 1 + 0.06 * Math.sin(t * 19);
    s += pool(q.x, q.y - 4 * k, 150 * k, 40 * k, R[4], 0.16 * fl, 41, 3, t);
    s += `<g class="ol" transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(4)})"><path d="${wp([[-9, 0], [-8, -24], [8, -24], [9, 0]], 3)}" fill="${R[5]}"/><path d="${wp([[-4, -4], [-5, -14], [0, -21], [5, -13], [4, -4]], 4)}" fill="${R[4]}" stroke="none"/><path d="M-9,0 L9,0 L9,-3 L-9,-3 Z M-9,-24 L9,-24 L6,-30 L-6,-30 Z" fill="${T("#3a2a2a")}"/><path d="M-3,-24 L-3,0 M3,-24 L3,0" stroke="${T("#3a2a2a")}" stroke-width="1.2"/><path d="M-5,-30 Q0,-42 5,-30" stroke="${T("#3a2a2a")}" stroke-width="1.4" fill="none"/></g>`; }
  if (vis(c, V.bucket.Z)) { const q = P(c, V.bucket.X, 0, V.bucket.Z), k = q.s / 100;
    s += `<g class="ol" transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(4)})"><path d="${wp([[-15, 0], [-18, -30], [18, -30], [15, 0]], 5)}" fill="${T("#8a5a37")}"/><path d="M-18,-30 Q0,-24 18,-30 Q0,-36 -18,-30 Z" fill="${clay[2]}"/><path d="M-9,-1 L-11,-29 M0,0 L0,-27 M9,-1 L11,-29" stroke="${T("#5a3520")}" stroke-width="0.8"/><path d="M-16.4,-9 L16.4,-9 M-17.6,-22 L17.6,-22" stroke="${T("#3a2a2a")}" stroke-width="2.2"/><path d="M-18,-30 Q0,-58 18,-30" stroke="${T("#3a2a2a")}" stroke-width="1.6" fill="none"/>
      <path d="M30,-2 L58,-74" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M30,-2 L58,-74" stroke="${T("#8a5a37")}" stroke-width="3.4" stroke-linecap="round"/><path d="${wp([[22, 4], [38, 2], [36, -18], [26, -19]], 7)}" fill="${T("#6a6a78")}"/><path d="M26,-3 q5,3 9,0" stroke="${clay[0]}" stroke-width="3" fill="none"/></g>`; }
  return s;
}
// mist in front of the actors (flat strips, screen space): call after the cast
export function riverMist(c, t, m, k = 1) {
  let r = ""; const R = m.ramp, hy = c.h0 ?? 1140;
  for (let i = 0; i < 3; i++) { const wd = 700 + hash(i + 400) * 400, x = ((hash(i + 410) * 1800 + t * (16 + 8 * i)) % 2100) - 700, y = hy + 250 + i * 190, h = 34 + i * 12; r += `<path d="${wp([[x, y], [x + wd * 0.3, y - h], [x + wd * 0.7, y - h * 0.6], [x + wd, y + h * 0.1], [x + wd * 0.6, y + h * 0.8], [x + wd * 0.2, y + h * 0.6]], i + 420, 3)}" fill="${R[5]}" opacity="${n(0.2 * k)}"/>`; }
  return r;
}

// ================================================================ SET C: a lane in the Jewish Town, around 1600, night
// Timber and plaster houses leaning in over a cobbled lane, shutters, hanging lanterns, a closing house with an arch at
// the far end. The well and the cart are separate props (well(), cart()) so they sort with the cast and can be carried
// off or thrown. opts: { doors: 0..1 or [per door] (0 whole .. 1 split), lamps 0..1, wreck 0..1 (splinters, a torn
// shutter, a toppled barrel) }. LANE.doors lists the doors (side, z) in the order of opts.doors.
export const LANE = { hw: 2.15, end: 19, well: { X: 1.05, Z: 8.4 }, cart: { X: -1.15, Z: 6.6 }, golem: { X: 0.1, Z: 7.6 },
  doors: [{ side: -1, z: 5.6 }, { side: 1, z: 6.6 }, { side: -1, z: 10.6 }, { side: 1, z: 12.2 }],
  CAM: { wide: { x: 0, y: 1.75, z: 0.3 }, golem: { x: 0.1, y: 1.9, z: 1.6 }, low: { x: -0.3, y: 0.9, z: 2.6 }, door: { x: -1.0, y: 1.3, z: 2.6 } } };
const LH = { [-1]: [[3.6, 7.4, 2.7, 5.6, 0.42, "#c9b48a", 0], [7.4, 9.4, 2.4, 4.7, 0.3, "#b8a0a8", 1], [9.4, 13.2, 2.8, 5.9, 0.45, "#d0b890", 2], [13.2, 19, 2.6, 5.2, 0.35, "#b0a0b0", 3]],
  1: [[4.2, 8.6, 2.6, 5.2, 0.38, "#bca8b0", 4], [8.6, 10.6, 2.9, 6.2, 0.5, "#cdb68c", 5], [10.6, 14.4, 2.5, 5.0, 0.36, "#c4a890", 6], [14.4, 19, 2.7, 5.7, 0.4, "#b4a4b4", 7]] };
// a plank door on a wall plane g(u 0..1, v 0..1 from the top): whole, or split in two with the halves knocked askew
function doorG(g, T, split, seed, m) {
  const wood = T("#7a4a2c"), woodD = T("#4a2a1c"), iron = T("#2a1c2a"), Q = (a) => a.map(([u, v]) => g(u, v));
  let s = `<path d="${wpath(Q([[-0.08, -0.06], [1.08, -0.06], [1.08, 1], [-0.08, 1]]), seed, 2)}" fill="${T("#5a4050")}" stroke="${INK}" stroke-width="1.4"/><path d="${wpath(Q([[0, 0], [1, 0], [1, 1], [0, 1]]), seed + 1, 2)}" fill="${split > 0.05 ? mix(m.ramp[0], m.ramp[3], 0.25 * split) : woodD}"/>`;
  const planks = (pts, dx, dy, rot, sd) => { const c0 = g(0.5 + dx, 0.5 + dy), P_ = pts.map(([u, v]) => g(u + dx, v + dy)); let r = `<g transform="rotate(${n(rot)} ${n(c0.x)} ${n(c0.y)})"><path d="${wpath(P_, sd, 2)}" fill="${wood}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`; const us = pts.map((p) => p[0]), vs = pts.map((p) => p[1]), u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
    for (const u of [0.26, 0.5, 0.76]) if (u > u0 + 0.04 && u < u1 - 0.04) { const a = g(u + dx, v0 + 0.03 + dy), b = g(u + dx + jit(sd + u, 0.015), v1 - 0.03 + dy); r += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${woodD}" stroke-width="1.4"/>`; }
    for (const v of [0.2, 0.74]) if (v > v0 + 0.05 && v < v1 - 0.05) { const a = g(u0 + dx, v + dy), b = g(Math.min(u1, u0 + 0.72) + dx, v + 0.01 + dy); r += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${iron}" stroke-width="${n(Math.max(2, Math.abs(g(0, 0.05).y - g(0, 0).y)))}" stroke-linecap="round"/>`; }
    return r + `</g>`; };
  if (split <= 0.05) { s += planks([[0.02, 0.02], [0.98, 0.02], [0.98, 0.99], [0.02, 0.99]], 0, 0, 0, seed + 2); const k = g(0.84, 0.52); s += `<circle cx="${n(k.x)}" cy="${n(k.y)}" r="${n(Math.max(2, Math.abs(g(0, 0.03).y - g(0, 0).y)))}" fill="${iron}"/>`; }
  else {
    const e = ease(split, "out"), J = [[0.56, 0.02], [0.44, 0.2], [0.6, 0.34], [0.4, 0.5], [0.57, 0.66], [0.42, 0.82], [0.52, 0.99]];
    s += planks([[0.02, 0.02], ...J, [0.02, 0.99]], -0.07 * e, 0.02 * e, -7 * e, seed + 3) + planks([...J.slice().reverse(), [0.98, 0.99], [0.98, 0.02]], 0.1 * e, 0.05 * e, 13 * e, seed + 4);
    for (let k = 0; k < 7; k++) { const a = g(0.5 + jit(seed + k, 0.5) * e, 0.15 + 0.12 * k + jit(seed + k + 9, 0.05)), l = (8 + hash(seed + k * 3) * 16) * e, an = hash(seed + k * 5) * 6.3; s += `<path d="M${n(a.x)},${n(a.y)} L${n(a.x + Math.cos(an) * l)},${n(a.y + Math.sin(an) * l)} L${n(a.x + Math.cos(an + 0.5) * l * 0.4)},${n(a.y + Math.sin(an + 0.5) * l * 0.4)} Z" fill="${k % 2 ? wood : m.ramp[4]}" stroke="${INK}" stroke-width="0.7"/>`; }
  }
  return s;
}
export function lane(c, t, m, o = {}) {
  const T = (col, k) => tone(m, col, k), R = m.ramp, hy = c.h0 ?? 1140, V = LANE, lamps = o.lamps ?? 1, wreck = o.wreck || 0;
  const dS = (i) => Array.isArray(o.doors) ? (o.doors[i] || 0) : (o.doors || 0);
  // night sky: flat bands, hand-placed stars, a thin moon
  let s = bands([R[0], mix(R[0], R[1], 0.6), R[1], mix(R[1], R[2], 0.5)], [0, hy - 840, hy - 520, hy - 250], 25);
  for (const [x, y, r] of [[120, 130, 6], [300, 300, 4], [470, 90, 5], [640, 220, 7], [820, 120, 4], [930, 330, 5], [560, 420, 4], [220, 480, 3.5], [760, 470, 3.5], [400, 560, 3], [980, 560, 3]]) s += star4(x - c.x * 5, y + (hy - 1140), r, R[5], 0.55 + 0.35 * Math.sin(t * 1.7 + x));
  { const mx = 610 - c.x * 8, my = hy - 760; s += `<path d="M${n(mx)},${n(my - 44)} A44,44 0 1 1 ${n(mx - 30)},${n(my + 32)} A36,36 0 1 0 ${n(mx)},${n(my - 44)} Z" fill="${R[5]}"/>`; }
  // the house that closes the lane: arch gate, one lit window, steep roof
  { const z = V.end, f = (X, Y) => PZ(c, X, Y, z);
    s += sh([f(-4.2, 6.4), f(-0.3, 9.2), f(3.9, 6.4)], T("#4a2a4a"), 501) + sh([f(-4, 6.5), f(4, 6.5), f(4, 0), f(-4, 0)], T("#8a7a9a"), 502);
    s += sh([f(-0.9, 0), f(-0.9, 1.9), f(-0.5, 2.6), f(0, 2.85), f(0.5, 2.6), f(0.9, 1.9), f(0.9, 0)], R[0], 503);
    for (const [X, Y] of [[-2.4, 3.9], [1.9, 4.1], [-0.2, 4.4]]) s += sh([f(X, Y + 1), f(X + 0.75, Y + 1), f(X + 0.75, Y), f(X, Y)], X < -1 ? R[4] : T("#2a2050"), X * 5 + 510, { lw: 1 });
    for (const X of [-3.2, -1.5, 1.4, 3.1]) s += `<path d="${wpath([f(X - 0.1, 6.4), f(X + 0.1, 6.4), f(X + 0.1, 0), f(X - 0.1, 0)], X + 520, 2)}" fill="${T("#3a2a3a")}"/>`;
    s += `<path d="${wpath([f(-4, 3.25), f(4, 3.25), f(4, 3.02), f(-4, 3.02)], 530, 3)}" fill="${T("#3a2a3a")}"/>`; }
  // the cobbles, lit where the lanterns hang
  const LP = [[-1.55, 3.0, 6.2], [1.5, 2.9, 9.6], [-1.6, 3.1, 12.6], [1.45, 2.8, 16]];
  const lit = (x, z) => lamps * Math.max(...LP.map(([lx, , lzz]) => clamp(1 - Math.hypot((x - lx * 0.5) / 2.0, (z - lzz) / 1.9)))) * 0.8;
  s += `<path d="M0,${n(hy)} L${W},${n(hy)} L${W},${H} L0,${H} Z" fill="${T("#2a2458")}"/>` + cobbles(c, m, () => -V.hw, () => V.hw, Math.max(1.4, c.z + 0.4), V.end, [T("#4a4488"), T("#585298"), R[4], T("#7a74b8")], 11, lit);
  // a gutter down the middle with a thread of water
  s += ln3(c, [[0.1, 0.004, Math.max(c.z + 0.5, 2)], [-0.1, 0.004, 6], [0.15, 0.004, 11], [0, 0.004, V.end]], T("#221c4c"), 0.05, 540) + ln3(c, [[0.1, 0.006, Math.max(c.z + 0.5, 2)], [-0.1, 0.006, 6], [0.15, 0.006, 11], [0, 0.006, V.end]], R[2], 0.02, 541, `opacity="0.7"`);
  // ---- the houses, far to near on each side
  let di = { [-1]: [0, 2], 1: [1, 3] };
  for (const side of [-1, 1]) {
    const list = LH[side], X0 = side * V.hw;
    for (let i = list.length - 1; i >= 0; i--) {
      let [z0, z1, h1, h2, jet, col, id] = list[i];
      if (z1 < c.z + 0.5) continue; const zn = Math.max(z0, c.z + 0.34), sd = id * 50 + 600, lean = 0.22 + 0.1 * hash(id + 3);
      const XJ = X0 - side * jet, XT = XJ - side * lean, tim = T("#3a2430"), pls = T(mix(col, "#3a3a70", 0.5 - 0.12 * (id % 3))), plsD = T(mix(col, "#2a2a60", 0.68)), stone = T(mix(col, "#6a6088", 0.55));
      // roof (steep, tiled) and chimney
      const rf = [[XT - side * 0.25, h2 - 0.1, zn], [XT - side * 0.25, h2 - 0.1, z1], [X0 + side * 2.2, h2 + 2.6, z1], [X0 + side * 2.2, h2 + 2.6, zn]];
      s += face(c, rf, T("#3a2648"), sd + 1); for (let k = 1; k < 6; k++) s += ln3(c, [[lerp(rf[0][0], rf[3][0], k / 6), lerp(rf[0][1], rf[3][1], k / 6), zn], [lerp(rf[0][0], rf[3][0], k / 6), lerp(rf[0][1], rf[3][1], k / 6), z1]], T("#241838"), 0.02, sd + k);
      // ground storey: stone and plaster; upper storey: timber frame jettied out and leaning in
      const g0 = pl(c, [X0, h1, z0], [0, 0, z1 - z0], [0, -h1, 0]), u0 = (zn - z0) / (z1 - z0);
      s += sh(pq(g0, u0, 1, 0, 1), stone, sd + 2);
      for (let k = 0; k < 7; k++) { const u = hash(sd + k * 3), v = 0.55 + hash(sd + k * 7) * 0.4; if (u < u0 + 0.05 || u > 0.92) continue; s += `<path d="${wpath(pq(g0, u, u + 0.4 / (z1 - z0), v, v + 0.07), sd + k, 1)}" fill="${T(mix(col, "#5a5078", 0.7))}" opacity="0.8"/>`; }
      const g1 = pl(c, [XJ, h2, z0], [0, 0, z1 - z0], [side * lean * -1 * -1 * 0, -(h2 - h1), 0]);
      const gU = (u, v) => PZ(c, lerp(XT, XJ, v), lerp(h2, h1, v), lerp(z0, z1, u));
      s += face(c, [[X0, h1, zn], [X0, h1, z1], [XJ, h1, z1], [XJ, h1, zn]], T("#2a1c30"), sd + 3);
      s += sh(pq(gU, u0, 1, 0, 1), pls, sd + 4);
      // chipped plaster and stains
      for (let k = 0; k < 4; k++) { const u = 0.1 + hash(sd + k * 11) * 0.8, v = 0.15 + hash(sd + k * 13) * 0.7; if (u < u0 + 0.04) continue; const q = gU(u, v); s += blob(q.x, q.y, 0.24 * q.s * Math.abs(gU(0.1, 0).x - gU(0, 0).x) / (0.1 * (z1 - z0) * q.s + 1e-6) + 6, 0.16 * q.s, plsD, sd + k, { N: 9, irr: 0.3, ex: `opacity="0.7"` }); }
      // timbers: sill, plate, posts, a brace or two (never the same twice)
      const beam = (ua, va, ub, vb, wd, sdd) => { if (Math.max(ua, ub) < u0) return ""; ua = Math.max(ua, u0); const a = gU(ua, va), b = gU(ub, vb), k = wd * a.s * 0.5, k2 = wd * b.s * 0.5, vert = Math.abs(ub - ua) < 0.001; return `<path d="${wpath(vert ? [pt(a.x - k * 0.5, a.y), pt(a.x + k * 0.5, a.y), pt(b.x + k2 * 0.5, b.y), pt(b.x - k2 * 0.5, b.y)] : [pt(a.x, a.y - k), pt(b.x, b.y - k2), pt(b.x, b.y + k2), pt(a.x, a.y + k)], sdd, 2)}" fill="${tim}" stroke="${INK}" stroke-width="0.9"/>`; };
      s += beam(0, 0.02, 1, 0.02, 0.2, sd + 5) + beam(0, 0.97, 1, 0.97, 0.24, sd + 6) + beam(0, 0.5 + jit(sd, 0.05), 1, 0.5 + jit(sd + 1, 0.05), 0.14, sd + 7);
      const np = Math.max(2, Math.round((z1 - z0) / 1.1));
      for (let k = 0; k <= np; k++) { const u = clamp(k / np + (k && k < np ? jit(sd + k, 0.03) : 0)); s += beam(u === 0 ? 0.012 : u === 1 ? 0.988 : u, 0, u === 0 ? 0.012 : u === 1 ? 0.988 : u, 1, 0.3, sd + 10 + k); }
      for (let k = 0; k < np; k++) if (hash(sd + k * 17) > 0.45) { const dn = hash(sd + k) > 0.5; s += beam(k / np + 0.02, dn ? 0.52 : 0.95, (k + 1) / np - 0.02, dn ? 0.95 : 0.52, 0.11, sd + 30 + k); }
      // windows in the upper storey: shutters (one hangs crooked), lit or dark
      for (let k = 0; k < np; k++) { if (hash(sd + k * 23) < 0.3) continue; const ua = k / np + 0.26 / np, ub = (k + 1) / np - 0.26 / np; if (ua < u0 + 0.02) continue; const lt = hash(sd + k * 29) > 0.55 && lamps > 0.3;
        s += sh(pq(gU, ua, ub, 0.14, 0.42), lt ? R[4] : T("#1c1848"), sd + 40 + k, { lw: 1.2 }); if (lt) s += `<path d="${wpath(pq(gU, lerp(ua, ub, 0.2), lerp(ua, ub, 0.75), 0.2, 0.4), sd + 45 + k, 1)}" fill="${R[5]}" opacity="0.6"/>`;
        const a = gU((ua + ub) / 2, 0.14), b = gU((ua + ub) / 2, 0.42); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${tim}" stroke-width="1.6"/>`;
        const shw = (ub - ua) * 0.55, crook = hash(sd + k * 31) > 0.7 || (wreck > 0.5 && k === 0);
        for (const e of [0, 1]) { const q = e ? pq(gU, ub + 0.004, ub + shw, 0.13, 0.43) : pq(gU, ua - shw, ua - 0.004, 0.13, 0.43); if (!e && ua - shw < u0) continue; const cc = q[e ? 0 : 1]; s += `<g transform="rotate(${crook && e ? 14 + wreck * 20 : 0} ${n(cc.x)} ${n(cc.y)})">${sh(q, T(["#3f6f6a", "#8a3a3a", "#4a5a8a", "#6a5a3a"][id % 4]), sd + 50 + k + e, { lw: 1 })}<path d="M${n(lerp(q[0].x, q[3].x, 0.33))},${n(lerp(q[0].y, q[3].y, 0.33))} L${n(lerp(q[1].x, q[2].x, 0.33))},${n(lerp(q[1].y, q[2].y, 0.33))} M${n(lerp(q[0].x, q[3].x, 0.66))},${n(lerp(q[0].y, q[3].y, 0.66))} L${n(lerp(q[1].x, q[2].x, 0.66))},${n(lerp(q[1].y, q[2].y, 0.66))}" stroke="${INK}" stroke-width="0.8"/></g>`; }
      }
      // the jetty's beam ends
      for (let z = Math.ceil(zn * 2) / 2 + 0.2; z < z1; z += 0.55) s += face(c, [[XJ - side * 0.03, h1 + 0.02, z], [XJ - side * 0.03, h1 + 0.02, z + 0.14], [XJ - side * 0.03, h1 - 0.16, z + 0.14], [XJ - side * 0.03, h1 - 0.16, z]], tim, sd + z, { lw: 0.9 });
      // a small ground-floor window with bars
      { const ua = 0.12, ub = ua + 0.7 / (z1 - z0); if (ua > u0 + 0.03 && (id % 2 || z1 - z0 > 3.5)) { s += sh(pq(g0, ua, ub, 0.3, 0.56), T("#1c1848"), sd + 70, { lw: 1.2 }); for (const k of [0.33, 0.66]) { const a = g0(lerp(ua, ub, k), 0.3), b = g0(lerp(ua, ub, k), 0.56); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${T("#3a3460")}" stroke-width="1.6"/>`; } } }
      // the door of this house (if it has one)
      V.doors.forEach((d, k) => { if (d.side !== side || d.z < z0 || d.z > z1 || d.z - 0.5 < c.z + 0.4) return; const ua = (d.z - 0.5 - z0) / (z1 - z0), ub = (d.z + 0.5 - z0) / (z1 - z0), vt = 1 - 2.0 / h1; s += doorG((u, v) => g0(lerp(ua, ub, u), lerp(vt, 1, v)), T, dS(k), sd + 80 + k, m) + face(c, [[X0 - side * 0.22, 0.12, d.z - 0.62], [X0 - side * 0.22, 0.12, d.z + 0.62], [X0, 0.12, d.z + 0.62], [X0, 0.12, d.z - 0.62]], T("#7a7098"), sd + 90 + k, { lw: 1 }); });
      // house corner post
      if (z0 > c.z + 0.4) s += ln3(c, [[X0, h1, z0], [X0, 0, z0]], INK, 0.03, sd + 95);
    }
  }
  // hanging lanterns on iron brackets: flat pools, a flame that leans
  for (const [lx, ly, lz2] of LP) { if (!vis(c, lz2)) continue; const side = lx < 0 ? -1 : 1, a = P(c, side * (V.hw - 0.4), ly + 0.45, lz2), q = P(c, lx, ly, lz2), k = q.s / 100, sw = Math.sin(t * 1.6 + lz2) * 5 * (1 + wreck * 2), fl = lamps * (1 + 0.07 * Math.sin(t * 18 + lz2));
    const gp = P(c, lx * 0.5, 0, lz2 - 0.3); s += pool(gp.x, gp.y, 2.0 * gp.s, 0.5 * gp.s, R[4], 0.12 * fl, lz2, 3, t) + pool(q.x, q.y, 120 * k, 120 * k, R[4], 0.1 * fl, lz2 + 1, 3, t);
    s += `<path d="M${n(a.x)},${n(a.y)} L${n(q.x)},${n(a.y)} L${n(q.x)},${n(q.y - 22 * k)}" stroke="${T("#1c1430")}" stroke-width="${n(3 * k)}" fill="none" stroke-linecap="round"/><path d="M${n(a.x)},${n(a.y + 30 * k)} L${n(lerp(a.x, q.x, 0.6))},${n(a.y)}" stroke="${T("#1c1430")}" stroke-width="${n(2 * k)}"/>`;
    s += `<g class="ol" transform="translate(${n(q.x)},${n(q.y - 22 * k)}) rotate(${n(sw)}) scale(${k.toFixed(4)})"><path d="${wp([[-9, 6], [-11, 30], [11, 30], [9, 6]], lz2)}" fill="${lamps > 0.3 ? R[5] : T("#4a4070")}"/><path d="${wp([[-3.5, 27], [-4.5, 17], [0.5, 9], [4.5, 18], [3.5, 27]], lz2 + 2)}" fill="${R[4]}" stroke="none" opacity="${n(clamp(lamps))}"/><path d="M-11,30 L11,30 L9,34 L-9,34 Z M-9,6 L9,6 L4,0 L-4,0 Z" fill="${T("#1c1430")}"/><path d="M-3.5,6 L-4.5,30 M3.5,6 L4.5,30" stroke="${T("#1c1430")}" stroke-width="1.1"/></g>`; }
  // what the giant leaves behind: splinters, a torn shutter on the stones, a toppled barrel
  if (wreck > 0.02) {
    for (let k = 0; k < 16; k++) { const X = jit(k + 700, 1.8), Z = 4.2 + hash(k + 710) * 7; if (!vis(c, Z)) continue; const q = P(c, X, 0, Z), l = (0.12 + hash(k + 720) * 0.3) * q.s, an = hash(k + 730) * 3.14; s += `<path d="M${n(q.x)},${n(q.y)} L${n(q.x + Math.cos(an) * l)},${n(q.y + Math.sin(an) * l * 0.3)} L${n(q.x + Math.cos(an) * l * 0.5 + 4)},${n(q.y + Math.sin(an) * l * 0.3 + 0.03 * q.s)} Z" fill="${T(k % 3 ? "#7a4a2c" : "#c9a070")}" stroke="${INK}" stroke-width="0.8" opacity="${n(clamp(wreck * 2))}"/>`; }
    if (vis(c, 5.2)) { const q = P(c, 1.55, 0, 5.2), k = q.s / 100; s += `<g class="ol" opacity="${n(clamp(wreck * 2))}" transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(4)}) rotate(-8)"><path d="${wp([[-34, -2], [-36, -34], [30, -40], [34, -4]], 741)}" fill="${T("#7a4a2c")}"/><path d="M-12,-3 L-13,-37 M10,-4 L9,-39" stroke="${T("#2a1c2a")}" stroke-width="3"/><path d="${wp([[30, -40], [38, -22], [34, -4]], 742)}" fill="${T("#4a2a1c")}"/><path d="M36,-10 q14,6 30,4 q10,2 16,8" stroke="${R[2]}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`; }
  }
  return s;
}
// the stone well with its windlass and bucket (a set piece that sorts with the cast). st: { gone 0/1 (ripped out: a
// wet ring of rubble is left), m }
export function well(c, st = {}, t = 0) {
  const X = st.X ?? LANE.well.X, Z = st.Z ?? LANE.well.Z, m = st.m; if (!vis(c, Z)) return "";
  const q = P(c, X, 0, Z), k = q.s / 100, T = (col) => m ? tone(m, col, m.k * 0.8) : col;
  if (st.gone) { let s = `<g transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(4)})">${blob(0, 2, 62, 15, T("#1c1848"), 3, { N: 14, irr: 0.15 })}${blob(4, 3, 40, 9, m ? m.ramp[2] : "#3b6aa6", 4, { N: 12, irr: 0.2 })}`; for (let i = 0; i < 9; i++) s += blob(Math.cos(i * 0.7) * 58 + jit(i, 6), Math.sin(i * 0.7) * 13 + 2, 7 + hash(i) * 6, 5 + hash(i + 2) * 3, T(i % 2 ? "#8a84a8" : "#6a6490"), i + 9, { N: 7, irr: 0.25, ex: `stroke="${INK}" stroke-width="0.8"` }); return s + `</g>`; }
  return shadow(q, 0.6) + `<g class="ol" transform="translate(${n(q.x)},${n(q.y)}) scale(${k.toFixed(4)})">
    <path d="M-52,-150 L-46,0 M52,-150 L46,0" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M-52,-150 L-46,0 M52,-150 L46,0" stroke="${T("#6a4428")}" stroke-width="7.6" stroke-linecap="round"/>
    ${tubG(T, t, 0)}
    <path d="${wp([[-66, -150], [0, -186], [66, -150], [60, -144], [0, -174], [-60, -144]], 21)}" fill="${T("#4a2a3a")}"/>
    <path d="M-50,-128 L50,-128" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-50,-128 L50,-128" stroke="${T("#8a5a37")}" stroke-width="6.6" stroke-linecap="round"/><path d="M50,-128 L64,-128 L64,-112" stroke="${T("#2a1c2a")}" stroke-width="3" fill="none"/>
    <path d="M-8,-128 q3,6 6,0 M-2,-128 q3,6 6,0 M4,-128 q3,6 6,0" stroke="${T("#d6b071")}" stroke-width="1.6" fill="none"/><path d="M2,-124 L${n(2 + Math.sin(t * 1.3) * 2)},-84" stroke="${T("#d6b071")}" stroke-width="1.6"/>
    <g transform="translate(${n(2 + Math.sin(t * 1.3) * 2)},-84)"><path d="M-9,4 Q0,-10 9,4" stroke="${T("#2a1c2a")}" stroke-width="1.6" fill="none"/><path d="${wp([[-10, 4], [-8, 24], [8, 24], [10, 4]], 23)}" fill="${T("#8a5a37")}"/><path d="M-9.4,11 L9.4,11" stroke="${T("#2a1c2a")}" stroke-width="1.8"/></g></g>`;
}
// the stone ring of the well (local cm, base at 0): every stone its own; carried = 1 adds torn-off roots of masonry
// underneath and water slopping over the rim
function tubG(T, t, carried) {
  let s = `<path d="${wp([[-56, -4], [-58, -52], [58, -52], [56, -4], [30, 3], [-30, 3]], 31, 3)}" fill="${T("#6a6490")}"/>`;
  for (let r = 0; r < 3; r++) for (let j = 0; j < 6; j++) { const x = -56 + j * 19 + (r & 1) * 9 + jit(r * 7 + j, 2), y = -50 + r * 16; if (x > 44) continue; s += `<path d="${wp([[x, y + 1], [x + 15 + jit(j + r, 2), y + 0.5], [x + 15, y + 13], [x + 1, y + 13.5]], r * 9 + j + 40, 1)}" fill="${T(["#8a84a8", "#7a7498", "#9a94b4", "#6e688e"][(r * 3 + j) % 4])}" stroke-width="0.5"/>`; }
  s += `<path d="M-58,-52 Q0,-38 58,-52 Q0,-68 -58,-52 Z" fill="${T("#9a94b4")}"/><path d="M-44,-53 Q0,-43 44,-53 Q0,-63 -44,-53 Z" fill="${T("#2a4a8a")}"/><path d="M-20,-55 q10,3 22,0 M6,-50 q8,2 16,-1" stroke="${T("#9ac0e8")}" stroke-width="1.2" fill="none"/>`;
  s += `<path d="M-40,-22 q4,5 9,1 M16,-30 q5,-3 8,2" stroke="${T("#4f7a4a")}" stroke-width="2.4" fill="none"/>`;
  if (carried) { s += `<path d="${wp([[-50, 0], [-38, 16], [-22, 6], [-6, 22], [10, 8], [28, 18], [46, 2], [30, 3], [-30, 3]], 55, 1)}" fill="${T("#4a4470")}"/>`;
    for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i * 0.37) % 1, x = -50 + i * 26 + jit(i, 5); s += `<path d="M${n(x)},${n(-50 + ph * 70)} q-2.4,5 0,7 q2.4,-2 0,-7 Z" fill="${T("#9ac0e8")}" stroke-width="0.4" opacity="${n(1 - ph)}"/>`; }
    s += `<path d="M-58,-52 q-6,10 -3,24 M58,-52 q5,8 2,20" stroke="${T("#9ac0e8")}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
  return s;
}
// the well ring as a carried thing, at a screen point: k = px per cm
export const wellTubAt = (x, y, k, st = {}, t = 0) => { const m = st.m, T = (col) => m ? tone(m, col, m.k * 0.8) : col; return `<g class="ol" transform="translate(${n(x)},${n(y)}) rotate(${n(st.rot || 0)}) scale(${k.toFixed(4)})">${tubG(T, t, 1)}<path d="M-52,-52 L-60,-96 L-50,-92 L-46,-52 Z" fill="${T("#6a4428")}"/><path d="M-60,-96 l4,-9 l3,10 l5,-6 l-2,9" fill="${T("#8a5a37")}" stroke-width="0.6"/></g>`; };
// the hand cart: st { X, Y (m off the ground), Z, rot deg, spin deg (wheels), broken 0..1, load 0/1 (sacks), m }
export function cart(c, st = {}, t = 0) {
  const X = st.X ?? LANE.cart.X, Z = st.Z ?? LANE.cart.Z, Y = st.Y || 0, m = st.m; if (!vis(c, Z)) return "";
  const q = P(c, X, Y, Z), g = P(c, X, 0, Z), k = q.s / 100, T = (col) => m ? tone(m, col, m.k * 0.7) : col, br = st.broken || 0, sp = st.spin || 0;
  const wheel = (x, y, r, sd, loose) => `<g transform="translate(${n(x + loose * 46)},${n(y + loose * 20)}) rotate(${n(sp + loose * 70)})"><path d="${wpath(blobPts(0, 0, r, r, sd, 16, 0.03), sd, 1)}" fill="${T("#5a3a26")}"/><path d="${wpath(blobPts(0, 0, r * 0.76, r * 0.76, sd + 1, 14, 0.04), sd + 1, 1)}" fill="${T("#2a1c30")}" stroke-width="0.6"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M0,0 L${n(Math.cos(i * 1.047 + 0.2) * r * 0.8)},${n(Math.sin(i * 1.047 + 0.2) * r * 0.8)}" stroke="${T("#8a5a37")}" stroke-width="3.2" stroke-linecap="round"/>`).join("")}<circle r="${n(r * 0.2)}" fill="${T("#8a5a37")}"/></g>`;
  const body = `${wheel(22, -30, 30, 61, 0)}
    <path d="${wp([[-62, -44], [70, -48], [66, -34], [-58, -31]], 63)}" fill="${T("#7a4a2c")}"/>
    <path d="${wp([[-60, -44], [-66, -78], [-56, -80], [-52, -45]], 64, 1)}" fill="${T("#8a5a37")}"/><path d="${wp([[60, -47], [66, -84], [76, -82], [70, -47]], 65, 1)}" fill="${T("#8a5a37")}"/>
    <path d="${wp([[-64, -72], [72, -77], [72, -66], [-63, -61]], 66)}" fill="${T("#9a6a40")}"/><path d="${wp([[-62, -57], [71, -62], [70, -52], [-61, -47]], 67)}" fill="${T("#8a5a37")}"/>
    <path d="M-20,-70 L-19,-46 M22,-73 L23,-49" stroke="${T("#3a2418")}" stroke-width="2.2"/><path d="M-40,-66 l8,1 M0,-58 l12,-1 M40,-70 l10,0" stroke="${T("#5a3520")}" stroke-width="0.9"/>
    <path d="M66,-40 L128,-58 M66,-36 L128,-52" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M66,-40 L128,-58 M66,-36 L128,-52" stroke="${T("#8a5a37")}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M-50,-31 L-54,0" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M-50,-31 L-54,0" stroke="${T("#6a4428")}" stroke-width="4" stroke-linecap="round"/>
    ${st.load === 0 ? "" : `<path d="${wp([[-50, -74], [-46, -100], [-20, -106], [-8, -76]], 68, 2)}" fill="${T("#c9b48a")}"/><path d="${wp([[-12, -76], [-4, -98], [26, -102], [40, -78]], 69, 2)}" fill="${T("#b8a070")}"/><path d="M-34,-100 q4,-8 10,-4 M8,-98 q6,-7 12,-3" stroke="${T("#8a6a3a")}" stroke-width="1.6" fill="none"/>`}
    ${wheel(-8, -28, 32, 62, br)}`;
  return (Y < 1.5 ? `<ellipse cx="${n(g.x)}" cy="${n(g.y)}" rx="${n(0.8 * g.s * (1 - Y * 0.3))}" ry="${n(0.14 * g.s)}" fill="${m ? m.ramp[0] : "#0a0718"}" opacity="0.45"/>` : "") + `<g class="ol" transform="translate(${n(q.x)},${n(q.y)}) rotate(${n(st.rot || 0)} 0 ${n(-40 * k)}) scale(${k.toFixed(4)})">${body}</g>`;
}

// ================================================================ SET D: inside the synagogue, Friday evening
// A Gothic hall seen from the back: plastered walls, the five-rib vault, hanging candle wheels, benches along the walls,
// the raised platform (bimah) with its iron grille in the middle, and at the far right the door a woman bursts through.
// The worshippers are worshippers(): quiet shapes seen from behind. bimahFront() goes over whoever stands on the platform.
// opts: { door 0..1 (flung open), candles 0..1 }.
export const HALL = { hw: 3.3, back: 13, spring: 4.6, apex: 7.6, bimah: { X: -0.2, Y: 0.55, Z: 8.4, hw: 1.25, hd: 0.9 }, rabbi: { X: -0.2, Y: 0.55, Z: 8.4 }, door: { X: 2.2, Z: 13, w: 1.2, h: 2.5 }, woman: { X: 2.1, Z: 12.3 },
  lamps: [[-1.5, 4.0, 6.2], [1.3, 4.3, 9.4], [-0.6, 4.6, 11.6]],
  CAM: { wide: { x: 0, y: 1.9, z: 0.4 }, rabbi: { x: -0.2, y: 2.0, z: 4.6 }, door: { x: 1.9, y: 1.5, z: 7.8 } } };
export function synagogueInside(c, t, m, o = {}) {
  const T = (col, k) => tone(m, col, k), R = m.ramp, V = HALL, hw = V.hw, bz = V.back, cand = o.candles ?? 1, dOpen = o.door || 0;
  const wall = T("#b88a5a"), wallD = T("#8a5a3a"), stone = T("#d8b888"), dk = T("#3a1c18"), zn = Math.max(c.z + 0.34, 0.5);
  let s = `<rect width="${W}" height="${H}" fill="${R[1]}"/>`;
  // the vault: plaster cells between the ribs (flat), ribs drawn after
  const bays = [[zn, 4.2], [4.2, 8.6], [8.6, bz]], arch = (z, yy = 0) => { const a = PZ(c, -hw, V.spring, z), k = PZ(c, 0, V.apex + yy, z), b = PZ(c, hw, V.spring, z), l = PZ(c, -hw * 0.62, V.spring + (V.apex - V.spring) * 0.72, z), r = PZ(c, hw * 0.62, V.spring + (V.apex - V.spring) * 0.72, z); return { a, k, b, d: `M${n(a.x)},${n(a.y)} Q${n(l.x)},${n(l.y)} ${n(k.x)},${n(k.y)} Q${n(r.x)},${n(r.y)} ${n(b.x)},${n(b.y)}` }; };
  { const A = arch(zn), B = arch(bz); s += `<path d="${A.d} L${n(B.b.x)},${n(B.b.y)} L${n(B.a.x)},${n(B.a.y)} Z" fill="${T("#7a4a30")}"/><path d="${A.d} L${W + 50},-50 L-50,-50 Z" fill="${T("#5a3020")}"/>`; }
  // back wall with its pointed top, two lancets holding the blue dusk, a plain curtained niche, the door
  { const B = arch(bz), f = (X, Y) => PZ(c, X, Y, bz);
    s += `<path d="${B.d} L${n(f(hw, 0).x)},${n(f(hw, 0).y)} L${n(f(-hw, 0).x)},${n(f(-hw, 0).y)} Z" fill="${wall}" stroke="${INK}" stroke-width="1.4"/>`;
    for (const [u, v, ru, rv, d] of [[-2.2, 2.2, 0.9, 0.6, 1], [0.6, 4.6, 1.0, 0.5, 0], [2.4, 3.6, 0.5, 0.8, 1], [-0.8, 1.0, 0.8, 0.4, 0]]) { const q = f(u, v); s += blob(q.x, q.y, ru * q.s, rv * q.s, d ? wallD : stone, u * 5 + v, { N: 10, irr: 0.25, ex: `opacity="0.4"` }); }
    for (const X of [-1.9, 1.3]) { s += sh([f(X - 0.36, 2.5), f(X - 0.36, 4.6), f(X, 5.3), f(X + 0.36, 4.6), f(X + 0.36, 2.5)], stone, X + 3) + sh([f(X - 0.22, 2.62), f(X - 0.22, 4.55), f(X, 5.05), f(X + 0.22, 4.55), f(X + 0.22, 2.62)], "#27348c", X + 5, { lw: 1 }) + `<path d="${wpath([f(X - 0.22, 2.62), f(X - 0.22, 3.4), f(X + 0.22, 3.1), f(X + 0.22, 2.62)], X + 7, 1)}" fill="#4a3a9a"/>`; for (const yy of [3.1, 3.7, 4.3]) s += ln3(c, [[X - 0.22, yy, bz], [X + 0.22, yy, bz]], dk, 0.02, yy); s += ln3(c, [[X, 2.62, bz], [X, 5, bz]], dk, 0.02, X); }
    s += sh([f(-0.95, 0.5), f(-0.95, 2.7), f(-0.3, 3.35), f(0.35, 2.7), f(0.35, 0.5)], stone, 11) + sh([f(-0.75, 0.5), f(-0.75, 2.6), f(-0.3, 3.05), f(0.15, 2.6), f(0.15, 0.5)], T("#8a2a3a"), 12, { lw: 1 });
    for (const dx of [-0.6, -0.42, -0.2, 0, 0.1]) s += ln3(c, [[-0.3 + dx * 0.9, 2.7, bz], [-0.3 + dx + jit(dx, 0.02), 0.52, bz]], T("#5a1424"), 0.016, dx * 9); s += ln3(c, [[-0.78, 2.45, bz], [0.18, 2.45, bz]], R[4], 0.03, 13);
    s += box(c, -1.2, 0.6, 0, 0.25, bz - 0.7, bz, [T("#a07a50"), T("#c8a070"), T("#7a5a3a")], 14) + box(c, -1.0, 0.4, 0.25, 0.5, bz - 0.4, bz, [T("#a07a50"), T("#c8a070"), T("#7a5a3a")], 18);
    // the door: stone frame with a pointed head; flung open it shows the red-violet night outside
    const D = V.door, x0 = D.X - D.w / 2, x1 = D.X + D.w / 2;
    s += sh([f(x0 - 0.2, 0), f(x0 - 0.2, D.h - 0.2), f(D.X, D.h + 0.75), f(x1 + 0.2, D.h - 0.2), f(x1 + 0.2, 0)], stone, 21);
    const hole = [f(x0, 0), f(x0, D.h - 0.25), f(D.X, D.h + 0.45), f(x1, D.h - 0.25), f(x1, 0)];
    if (dOpen > 0.03) { const out = o.outside || MOODS.rampage; s += sh(hole, out.ramp[1], 22) + `<path d="${wpath([f(x0, 0), f(x0, 1.1), f(x0 + 0.5, 1.5), f(x1, 1.0), f(x1, 0)], 23, 2)}" fill="${out.ramp[2]}"/><path d="${wpath([f(x0, 0), f(x0, 0.35), f(x1, 0.3), f(x1, 0)], 24, 2)}" fill="${out.ramp[3]}"/>` + star4(f(x0 + 0.3, 2.0).x, f(0, 2.0).y, 5, out.ramp[5], 0.8);
      const e = ease(dOpen, "out"), lx = x0 + D.w * (1 - e) * 0.9 + 0.08; s += sh([f(x0, 0), f(x0, D.h - 0.25), PZ(c, lx, D.h - 0.25 + 0.12 * e, bz - e * 0.7), PZ(c, lx, -0.03 * e, bz - e * 0.7)], T("#6a3a22"), 25) + ln3(c, [[lerp(x0, lx, 0.5), D.h - 0.2, bz - e * 0.35], [lerp(x0, lx, 0.5), 0, bz - e * 0.35]], dk, 0.02, 26);
      // the cold light it lets in: one flat wedge on the floor
      s += `<path d="${wpath(pj(c, [[x0, 0.01, bz], [x1, 0.01, bz], [x1 + 0.6, 0.01, bz - 3.2], [x0 - 1.6, 0.01, bz - 3.2]]), 27, 2)}" fill="${out.ramp[3]}" opacity="${n(0.4 * e)}"/>`;
    } else { s += sh(hole, T("#6a3a22"), 22); for (const dx of [0.3, 0.6, 0.9]) s += ln3(c, [[x0 + dx, 0, bz], [x0 + dx, D.h - 0.05, bz]], dk, 0.02, dx * 7); for (const yy of [0.6, 1.9]) s += ln3(c, [[x0, yy, bz], [x1 - 0.2, yy, bz]], T("#2a1418"), 0.05, yy * 3); }
  }
  // side walls: plaster, lancets, corbels where the ribs spring, a long bench with a high back
  for (const sd of [-1, 1]) {
    const X = sd * hw; s += face(c, [[X, V.spring, zn], [X, V.spring, bz], [X, 0, bz], [X, 0, zn]], sd < 0 ? T("#a87a50") : T("#96683f"), 31 + sd);
    for (const z of [5.2, 9.6]) { if (z < zn + 0.5) continue; s += face(c, [[X, 1.9, z - 0.3], [X, 3.6, z - 0.3], [X, 4.2, z], [X, 3.6, z + 0.3], [X, 1.9, z + 0.3]], stone, z + sd) + face(c, [[X, 2.05, z - 0.17], [X, 3.55, z - 0.17], [X, 3.95, z], [X, 3.55, z + 0.17], [X, 2.05, z + 0.17]], "#27348c", z + sd + 3, { lw: 1 }); }
    for (let k = 0; k < 5; k++) { const z = 2.5 + hash(k + sd * 9 + 40) * 9, y = 0.8 + hash(k + sd * 5 + 50) * 3; if (z < zn + 0.6) continue; s += flat(c, [[X, y + 0.5, z - 0.6], [X, y + 0.6, z + 0.5], [X, y, z + 0.7], [X, y - 0.3, z - 0.3]], k % 2 ? wallD : stone, k + sd * 3 + 60, `opacity="0.35"`); }
    s += box(c, sd < 0 ? X : X - 0.5, sd < 0 ? X + 0.5 : X, 0, 0.5, Math.max(zn, 2.4), bz - 1.5, [T("#6a3a22"), T("#8a5230"), T("#4a2616")], 70 + sd * 5) + face(c, [[X - sd * -0.06, 1.5, Math.max(zn, 2.4)], [X - sd * -0.06, 1.5, bz - 1.5], [X - sd * -0.06, 0.5, bz - 1.5], [X - sd * -0.06, 0.5, Math.max(zn, 2.4)]], T("#5a3020"), 80 + sd);
    for (let z = 3; z < bz - 1.6; z += 0.9) if (z > zn + 0.2) s += ln3(c, [[X + sd * -0.07, 1.5, z], [X + sd * -0.07, 0.5, z]], dk, 0.015, z);
  }
  // the floor: stone flags, worn lighter down the middle
  { let row = 0; for (let z = Math.max(zn, 1.4); z < bz; row++) { const dz = 0.7 + 0.15 * hash(row + 90); let x = -hw - hash(row + 91) * 0.5, j = 0; while (x < hw) { const wd = 0.8 + 0.5 * hash(row * 7 + j + 92), x0 = Math.max(-hw, x), x1 = Math.min(hw, x + wd); x += wd; j++; if (x1 - x0 < 0.05) continue; const q = pj(c, [[x0 + 0.02, 0, Math.min(bz, z + dz) - 0.02], [x1 - 0.02, 0, Math.min(bz, z + dz) - 0.02], [x1 - 0.02, 0, z + 0.02], [x0 + 0.02, 0, z + 0.02]]); if (off(q)) continue; s += pg(q, mix(T("#8a5a3a"), T("#c08a52"), clamp(1 - Math.abs((x0 + x1) / 2) / 2.2) * (0.5 + 0.5 * hash(row * 13 + j)))); } z += dz; } s = s.replace(`<rect width="${W}" height="${H}" fill="${R[1]}"/>`, `<rect width="${W}" height="${H}" fill="${T("#4a2616")}"/>`); }
  // ---- the ribs: wall arches, transverse arches, and in every bay four diagonals plus the odd fifth rib
  const rib = (A, B, lift, wd, sd) => { const a = PZ(c, ...A), b = PZ(c, ...B), mm = PZ(c, (A[0] + B[0]) / 2, Math.max(A[1], B[1]) * lift + (A[1] + B[1]) / 2 * (1 - lift), (A[2] + B[2]) / 2), cx = 2 * mm.x - (a.x + b.x) / 2, cy = 2 * mm.y - (a.y + b.y) / 2, k = Math.max(3, wd * (a.s + b.s) / 2), d = `M${n(a.x)},${n(a.y)} Q${n(cx + jit(sd, 4))},${n(cy)} ${n(b.x)},${n(b.y)}`; return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(k + 2.4)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${stone}" stroke-width="${n(k)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T("#a8804f")}" stroke-width="${n(k * 0.3)}" stroke-linecap="round" transform="translate(${n(k * 0.22)},${n(k * 0.2)})"/>`; };
  for (let i = bays.length - 1; i >= 0; i--) {
    const [z0, z1] = bays[i], zm = (z0 + z1) / 2, K = [jit(i + 7, 0.25), V.apex - 0.1, zm + jit(i, 0.3)];
    if (z1 < zn + 0.3) continue;
    for (const [X, Z] of [[-hw, z1], [hw, z1], [-hw, z0], [hw, z0]]) s += rib([X, V.spring, Math.max(Z, zn)], K, 0.82, 0.17, i * 5 + X + Z);
    s += rib([(i % 2 ? -hw : hw), V.spring + 1.1, zm + 0.2], K, 0.9, 0.14, i + 50);          // the fifth rib
    { const q = PZ(c, ...K), r = 0.26 * q.s; s += `<path d="${wpath(blobPts(q.x, q.y, r, r * 0.8, i + 60, 10, 0.08), i + 60, 1)}" fill="${stone}" stroke="${INK}" stroke-width="1.4"/>` + blob(q.x, q.y, r * 0.5, r * 0.4, T("#a8804f"), i + 62, { N: 8 }); }
    if (i > 0) { const A = arch(z0); s += `<path d="${A.d}" fill="none" stroke="${INK}" stroke-width="${n(0.26 * A.a.s + 2.4)}"/><path d="${A.d}" fill="none" stroke="${stone}" stroke-width="${n(0.26 * A.a.s)}"/>`; for (const sd of [-1, 1]) s += box(c, sd < 0 ? -hw : hw - 0.22, sd < 0 ? -hw + 0.22 : hw, V.spring - 0.45, V.spring + 0.05, z0 - 0.2, z0 + 0.2, [stone, stone, T("#a8804f")], i * 9 + sd + 70); }
  }
  // ---- candle wheels on chains: iron ring, candles, flat stepped light
  for (const [X, Y, Z] of V.lamps) { if (!vis(c, Z)) continue; const q = P(c, X, Y, Z), top = P(c, X, V.apex - 0.4, Z), k = q.s / 100, id = Z * 3;
    s += `<path d="M${n(q.x)},${n(top.y)} L${n(q.x)},${n(q.y - 46 * k)}" stroke="${dk}" stroke-width="${n(Math.max(1.4, 1.6 * k))}" stroke-dasharray="${n(5 * k)} ${n(2.4 * k)}"/><path d="M${n(q.x)},${n(q.y - 46 * k)} L${n(q.x - 44 * k)},${n(q.y)} M${n(q.x)},${n(q.y - 46 * k)} L${n(q.x + 44 * k)},${n(q.y)} M${n(q.x)},${n(q.y - 46 * k)} L${n(q.x)},${n(q.y + 9 * k)}" stroke="${dk}" stroke-width="${n(Math.max(1, 1.2 * k))}"/>`;
    s += pool(q.x, q.y - 10 * k, 230 * k, 200 * k, R[4], 0.1 * cand, id, 3, t);
    s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(46 * k)}" ry="${n(10 * k)}" fill="none" stroke="${INK}" stroke-width="${n(6.4 * k)}"/><ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(46 * k)}" ry="${n(10 * k)}" fill="none" stroke="${T("#b8862a")}" stroke-width="${n(4.4 * k)}"/>`;
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + 0.4 + id, x = q.x + Math.cos(a) * 46 * k, y = q.y + Math.sin(a) * 10 * k, h = (12 + hash(i + id) * 8) * k, fl = Math.sin(t * (9 + i) + i * 2 + id) * 1.6 * k;
      s += `<path d="${wp([[x - 2.2 * k, y], [x - 2 * k, y - h], [x + 2 * k, y - h], [x + 2.2 * k, y]], i + id, 1)}" fill="${R[5]}" stroke="${INK}" stroke-width="0.7"/>` + (cand > 0.05 ? `<path d="M${n(x)},${n(y - h - 11 * k * cand)} Q${n(x + 3.4 * k + fl)},${n(y - h - 3 * k)} ${n(x)},${n(y - h)} Q${n(x - 3.4 * k + fl)},${n(y - h - 3 * k)} ${n(x)},${n(y - h - 11 * k * cand)} Z" fill="${R[4]}" stroke="${R[3]}" stroke-width="0.6"/>` : ""); } }
  // ---- the platform: steps, boards, the back half of the iron grille, the reading desk
  { const B = V.bimah, x0 = B.X - B.hw, x1 = B.X + B.hw, z0 = B.Z - B.hd, z1 = B.Z + B.hd, wd = [T("#7a4426"), T("#9a5e34"), T("#532a16")];
    s += box(c, x0 - 0.2, x1 + 0.2, 0, 0.28, z0 - 0.35, z1 + 0.1, wd, 301) + box(c, x0, x1, 0.28, B.Y, z0, z1, wd, 306);
    for (let k = 1; k < 7; k++) s += ln3(c, [[lerp(x0, x1, k / 7), B.Y + 0.004, z0], [lerp(x0, x1, k / 7) + jit(k, 0.02), B.Y + 0.004, z1]], T("#532a16"), 0.012, k + 310);
    s += grille(c, m, z1, 0) + box(c, B.X + 0.45, B.X + 1.0, B.Y, B.Y + 1.0, B.Z + 0.25, B.Z + 0.6, [T("#6a3a22"), T("#8a5230"), T("#4a2616")], 320) + face(c, [[B.X + 0.38, B.Y + 1.22, B.Z + 0.62], [B.X + 1.07, B.Y + 1.22, B.Z + 0.62], [B.X + 1.07, B.Y + 0.98, B.Z + 0.2], [B.X + 0.38, B.Y + 0.98, B.Z + 0.2]], T("#8a2a3a"), 325); }
  return s;
}
// the iron grille of the platform at depth z: posts with knobs, thin bars, a Gothic top rail with small points
function grille(c, m, z, front) {
  const B = HALL.bimah, T = (col) => tone(m, col), iron = T("#2a1a1e"), hi = T("#b8862a"), x0 = B.X - B.hw, x1 = B.X + B.hw, y0 = B.Y, top = B.Y + (front ? 1.0 : 2.5);
  let s = "", f = (X, Y) => PZ(c, X, Y, z); if (!vis(c, z)) return "";
  const lw = Math.max(1.2, 0.02 * f(0, 0).s);
  for (let k = 0; k <= 16; k++) { const x = lerp(x0, x1, k / 16), gap = front && k > 5 && k < 11; if (gap) continue; const a = f(x, y0), b = f(x + jit(k + front * 20, 0.012), top - (k % 4 ? 0.12 : 0)); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${iron}" stroke-width="${n(k % 4 ? lw : lw * 2.4)}" stroke-linecap="round"/>`; if (k % 4 === 0) s += `<circle cx="${n(b.x)}" cy="${n(b.y - lw * 2)}" r="${n(lw * 2.6)}" fill="${hi}" stroke="${INK}" stroke-width="0.8"/>`; }
  for (const yy of front ? [top - 0.1, y0 + 0.2] : [top - 0.12, y0 + 1.0, y0 + 0.2]) for (const [a, b] of front ? [[x0, lerp(x0, x1, 5 / 16)], [lerp(x0, x1, 11 / 16), x1]] : [[x0, x1]]) s += ln3(c, [[a, yy, z], [(a + b) / 2, yy + jit(yy + front, 0.012), z], [b, yy, z]], iron, 0.035, yy * 7 + front);
  if (!front) for (let k = 0; k < 8; k++) { const a = f(lerp(x0, x1, k / 8), top - 0.12), b = f(lerp(x0, x1, (k + 0.5) / 8), top + 0.28 + (k % 2) * 0.08), d = f(lerp(x0, x1, (k + 1) / 8), top - 0.12); s += `<path d="M${n(a.x)},${n(a.y)} Q${n(a.x)},${n(b.y)} ${n(b.x)},${n(b.y)} Q${n(d.x)},${n(b.y)} ${n(d.x)},${n(d.y)}" fill="none" stroke="${iron}" stroke-width="${n(lw * 1.3)}"/>`; }
  return s;
}
export const bimahFront = (c, m) => grille(c, m, HALL.bimah.Z - HALL.bimah.hd, 1);
// the congregation, from behind: dark coats, caps and hats, here and there a pale striped shawl over the shoulders; they
// sway a little with the song. st: { turn 0..1 (heads turn to the door), m, rows: [[X, Z, seed], ...] to override }.
const PEW = [[-2.3, 4.6, 1], [-1.3, 4.3, 2], [1.0, 4.4, 3], [2.2, 4.7, 4], [-2.5, 6.6, 5], [-1.6, 6.3, 6], [1.5, 6.4, 7], [2.4, 6.9, 8], [-2.4, 9.0, 9], [2.3, 9.2, 10], [-2.2, 10.9, 11], [1.3, 11.0, 12]];
HALL.pews = PEW;
export function worshippers(c, t, st = {}) {
  const m = st.m, T = (col) => m ? tone(m, col, m.k * 0.8) : col, turn = st.turn || 0;
  return (st.rows || PEW).filter(([, Z]) => vis(c, Z)).sort((a, b) => b[1] - a[1]).map(([X, Z, sd]) => {
    const p = P(c, X, 0, Z), h = 0.92 + 0.12 * hash(sd + 3), sway = Math.sin(t * 1.5 + sd * 1.7) * 1.6 * (1 - turn), coat = T(["#2a2030", "#3a2a26", "#26263a", "#3f2a34"][sd % 4]), shawl = sd % 3 === 0, hd = turn * (HALL.door.X > X ? 1 : -1);
    let g = `<path d="${wp([[-24, 0], [-22, -100], [-17, -132], [0, -139], [17, -132], [22, -100], [24, 0]], sd, 2)}" fill="${coat}"/><path d="M-9,-60 L-10,-2 M8,-70 L10,-2" stroke="${T("#1a1420")}" stroke-width="0.8" fill="none"/>`;
    if (shawl) g += `<path d="${wp([[-21, -96], [-19, -131], [0, -139], [19, -131], [21, -96], [0, -88]], sd + 5, 2)}" fill="${T("#efe6d0")}"/><path d="M-20,-104 Q0,-95 20,-104 M-20.5,-99 Q0,-90.5 20.5,-99" stroke="${T("#3a3a6a")}" stroke-width="1.3" fill="none"/>` + [-16, -10, -4, 2, 8, 14].map((x) => `<path d="M${x},-91 l${n(jit(x + sd, 1))},5" stroke="${T("#efe6d0")}" stroke-width="0.8"/>`).join("");
    g += `<path d="M-5,-139 L5,-139 L4.5,-147 L-4.5,-147 Z" fill="${T("#c8a084")}"/>`;
    // the head: hair from behind; turned, a cheek, an eye and a nose come round
    g += `<g transform="translate(${n(hd * 2)},0)"><path d="${headPath(0, -157, 11, 12.4, hd * 0.9, 1)}" fill="${T(hd ? "#e6c4a6" : ["#3a2a22", "#8a8480", "#2a2020", "#5a4030"][sd % 4])}"/>`;
    if (Math.abs(hd) > 0.3) g += `<path d="M${n(-hd * 12)},-160 Q${n(-hd * 13)},-172 0,-171 Q${n(hd * 6)},-171 ${n(hd * 5)},-165 Q${n(-hd * 3)},-160 ${n(-hd * 5)},-146 Q${n(-hd * 11)},-148 ${n(-hd * 12)},-160 Z" fill="${T(["#3a2a22", "#8a8480", "#2a2020", "#5a4030"][sd % 4])}"/>` + `<ellipse cx="${n(hd * 6.6)}" cy="-158" rx="1.5" ry="2" fill="${INK}"/><path d="M${n(hd * 4)},-162.4 q${n(hd * 2.6)},-1.4 ${n(hd * 5)},0" stroke="${INK}" stroke-width="1" fill="none"/>` + `<path d="M${n(hd * 10.4)},-156 q${n(hd * 2.4)},3 ${n(-hd * 0.4)},4.4" stroke="${T("#a8705a")}" stroke-width="0.8" fill="none"/><path d="M${n(hd * 5)},-149.4 q${n(hd * 2)},1.2 ${n(hd * 3.4)},-0.4" stroke="#5a1f30" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    g += sd % 2 ? `<path d="${wp([[-11.6, -163], [-9, -172], [0, -174.6], [9, -172], [11.6, -163], [0, -165.6]], sd + 9, 1)}" fill="${T("#1c1820")}"/>` : `<path d="${wp([[-14, -165], [-10, -175], [0, -178], [10, -176], [15, -166], [0, -163]], sd + 9, 1)}" fill="${T("#221a2a")}"/>`;
    return shadow(p, 0.3) + `<g class="ol" transform="${place(p, sway)} scale(${n(h * 1.22)},${n(h)})">${g}</g></g>`;
  }).join("");
}

// ================================================================ SET E: the synagogue's attic (1600 and 1920)
// Inside the steep roof: rafters, collar beams, boards thick with dust, a small door in the brick gable that lets in one
// blade of grey-blue light, and the low heap of red clay with something like a huge shoulder in it. The ladder hatch
// is where the reporter comes up. opts: { blade 0..1, pile 0..1 (how much clay), hatch 0/1, dustK }.
export const GATTIC = { hw: 3.4, ridge: 4.6, back: 11.5, pile: { X: 0.45, Z: 7.6 }, hatch: { X: -1.55, Z: 5.6 }, reporter: { X: -1.55, Z: 5.75 }, gap: { X: 1.3, Y: 2.5 },
  CAM: { wide: { x: 0, y: 1.6, z: 0.4 }, pile: { x: 0.3, y: 1.0, z: 3.6 }, hatch: { x: -1.2, y: 1.25, z: 2.2 } } };
export function golemAttic(c, t, m, o = {}) {
  const T = (col, k) => tone(m, col, k), R = m.ramp, V = GATTIC, hw = V.hw, bz = V.back, zn = Math.max(c.z + 0.34, 0.6), blade = o.blade ?? 1;
  const roofX = (y) => hw * (1 - y / V.ridge);
  let s = `<rect width="${W}" height="${H}" fill="${T("#2a1810")}"/>`;
  // roof planes (boards between the rafters), the brick gable at the back
  for (const sd of [-1, 1]) { s += face(c, [[sd * hw, 0, zn], [sd * hw, 0, bz], [0, V.ridge, bz], [0, V.ridge, zn]], sd < 0 ? T("#4a2c18") : T("#3a2012"), 3 + sd);
    for (let k = 1; k < 9; k++) { const y = V.ridge * k / 9; s += ln3(c, [[sd * roofX(y), y, zn], [sd * roofX(y), y + jit(k + sd, 0.03), bz]], T("#24140c"), 0.012, k + sd * 20 + 40); } }
  const f = (X, Y) => PZ(c, X, Y, bz), gb = [f(-hw, 0), f(0, V.ridge), f(hw, 0)];
  s += `<clipPath id="agab"><path d="${wpath(gb, 5, 3)}"/></clipPath>` + sh(gb, T("#3a1c18"), 5) + `<g clip-path="url(#agab)">`;
  for (let r = 0; r < 26; r++) { const y = r * 0.18, xr = roofX(y) + 0.3; for (let x = -xr + (r & 1) * 0.2, j = 0; x < xr; j++) { const bw = 0.36 + 0.08 * hash(r * 11 + j); if (hash(r * 17 + j + 3) > 0.08) s += pg([f(x, y + 0.16), f(x + bw - 0.03, y + 0.16 + jit(r + j, 0.01)), f(x + bw - 0.03, y + 0.015), f(x, y + 0.015)], T(["#6a2c22", "#7a3626", "#5a241e", "#84402c"][Math.floor(hash(r * 31 + j) * 4)])); x += bw; } }
  s += `</g>`;
  // the small door in the gable, ajar: the only daylight
  const G = V.gap, sky = mix(R[4], R[5], 0.5);
  s += sh([f(G.X - 0.42, G.Y - 0.75), f(G.X - 0.42, G.Y + 0.3), f(G.X, G.Y + 0.72), f(G.X + 0.42, G.Y + 0.3), f(G.X + 0.42, G.Y - 0.75)], T("#2a1410"), 61) + sh([f(G.X - 0.3, G.Y - 0.66), f(G.X - 0.3, G.Y + 0.26), f(G.X, G.Y + 0.56), f(G.X + 0.05, G.Y + 0.5), f(G.X + 0.05, G.Y - 0.66)], T("#4a2c18"), 62) + `<path d="${wpath([f(G.X + 0.07, G.Y - 0.66), f(G.X + 0.07, G.Y + 0.48), f(G.X + 0.3, G.Y + 0.26), f(G.X + 0.3, G.Y - 0.66)], 63, 2)}" fill="${sky}" opacity="${n(0.25 + 0.75 * blade)}"/>`;
  // floor boards, then dust lying on them in flat pale drifts
  s += boards(c, m, -hw, hw, zn, bz, ["#6a4428", "#7a5232", "#2a1810"], 71, 0.34);
  for (const [X, Z, rx, rz, sd] of [[-2.2, 8.6, 1.0, 0.5, 1], [2.3, 6.0, 0.9, 0.6, 2], [-0.6, 10.2, 1.6, 0.5, 3], [1.9, 9.6, 1.0, 0.4, 4], [-2.4, 4.2, 0.8, 0.5, 5], [0.9, 4.0, 1.3, 0.45, 6], [2.6, 3.0, 0.7, 0.4, 7]]) { if (!vis(c, Z - rz)) continue; const q = P(c, X, 0, Z), ry = Math.max(3, (P(c, X, 0, Math.max(c.z + 0.3, Z - rz)).y - P(c, X, 0, Z + rz).y) / 2); s += blob(q.x, q.y, rx * q.s, ry, T("#a89078"), sd + 80, { N: 11, irr: 0.25, ex: `opacity="0.4"` }); }
  // the blade of light: flat nested wedges from the door down to the boards (screen blend), its patch on the floor
  if (blade > 0.02) { const a0 = f(G.X + 0.07, G.Y + 0.46), a1 = f(G.X + 0.3, G.Y - 0.66), L1 = PZ(c, V.pile.X - 1.5, 0, V.pile.Z - 0.2), L2 = PZ(c, V.pile.X + 0.5, 0, V.pile.Z - 1.1), L3 = PZ(c, V.pile.X + 0.2, 0, V.pile.Z + 1.2);
    s += `<path d="${wpath([L1, L2, L3, PZ(c, V.pile.X - 1.1, 0, V.pile.Z + 1.1)], 91, 2)}" fill="${R[4]}" opacity="${n(0.42 * blade)}"/>`;
    s += `<path d="${wpath([a0, a1, L2, L1], 92, 2)}" fill="${R[4]}" opacity="${n(0.2 * blade)}" style="mix-blend-mode:screen"/><path d="${wpath([pt(lerp(a0.x, a1.x, 0.3), lerp(a0.y, a1.y, 0.3)), pt(lerp(a0.x, a1.x, 0.85), lerp(a0.y, a1.y, 0.85)), pt(lerp(L2.x, L1.x, 0.25), lerp(L2.y, L1.y, 0.25)), pt(lerp(L2.x, L1.x, 0.75), lerp(L2.y, L1.y, 0.75))], 93, 2)}" fill="${R[5]}" opacity="${n(0.16 * blade)}" style="mix-blend-mode:screen"/>`;
    // motes: only inside the blade, each on its own slow path
    for (let i = 0; i < 44; i++) { const u = (hash(i + 500) + t * 0.012 * (0.5 + hash(i + 510))) % 1, v = hash(i + 520), x = lerp(lerp(a0.x, a1.x, v), lerp(L1.x, L2.x, v), u) + 6 * Math.sin(t * 0.6 + i), y = lerp(lerp(a0.y, a1.y, v), lerp(L1.y, L2.y, v), u) + 5 * Math.sin(t * 0.45 + i * 2), sz = 1.5 + 3.2 * hash(i + 530) ** 2; s += `<path d="M${n(x - sz)},${n(y)} L${n(x)},${n(y - sz * 0.7)} L${n(x + sz * 0.8)},${n(y + sz * 0.2)} L${n(x - sz * 0.1)},${n(y + sz * 0.7)} Z" fill="${R[5]}" opacity="${n((0.35 + 0.5 * Math.sin(t * (0.8 + hash(i) * 1.5) + i) ** 2) * blade * (o.dustK ?? 1))}"/>`; } }
  // rafters, collar beams, king posts, one cracked beam, cobwebs (near frames last so they overlap properly)
  const tim = [T("#5a3820"), T("#7a5030"), T("#2a1810")];
  for (let z = bz - 1.3; z > zn + 0.2; z -= 2.1) {
    const id = Math.round(z * 10), cy = 2.7 + jit(id, 0.12);
    for (const sd of [-1, 1]) { s += face(c, [[sd * hw, 0, z], [sd * (hw - 0.26), 0, z], [0, V.ridge - 0.24, z], [0, V.ridge, z]], tim[sd < 0 ? 1 : 0], id + sd) + ln3(c, [[sd * (hw - 0.5), 0.5, z], [sd * 0.6, V.ridge - 0.9, z]], tim[2], 0.012, id + sd + 5); }
    s += face(c, [[-roofX(cy) + 0.1, cy + 0.12, z], [roofX(cy) - 0.1, cy + 0.12 + jit(id + 3, 0.05), z], [roofX(cy) - 0.2, cy - 0.12, z], [-roofX(cy) + 0.2, cy - 0.12, z]], tim[1], id + 9) + face(c, [[-0.11, V.ridge - 0.2, z], [0.11, V.ridge - 0.2, z], [0.1, cy + 0.1, z], [-0.1, cy + 0.1, z]], tim[0], id + 11);
    s += ln3(c, [[-1.2, cy + 0.02, z], [-0.3, cy + 0.04, z], [0.5, cy - 0.02, z]], tim[2], 0.012, id + 13);
    const q = PZ(c, -roofX(cy) + 0.15, cy - 0.1, z); s += `<path d="M${n(q.x)},${n(q.y)} q${n(0.3 * q.s)},${n(0.1 * q.s)} ${n(0.5 * q.s)},${n(0.42 * q.s)} M${n(q.x)},${n(q.y)} q${n(0.12 * q.s)},${n(0.2 * q.s)} ${n(0.1 * q.s)},${n(0.6 * q.s)} M${n(q.x + 0.1 * q.s)},${n(q.y + 0.3 * q.s)} q${n(0.12 * q.s)},${n(0.05 * q.s)} ${n(0.22 * q.s)},${n(-0.06 * q.s)}" stroke="${T("#c8b8a8")}" stroke-width="1" fill="none" opacity="0.5"/>`;
  }
  // the ladder hatch
  if (o.hatch !== 0 && vis(c, V.hatch.Z)) { const h = V.hatch; s += face(c, [[h.X - 0.5, 0.004, h.Z + 0.5], [h.X + 0.5, 0.004, h.Z + 0.5], [h.X + 0.5, 0.004, h.Z - 0.4], [h.X - 0.5, 0.004, h.Z - 0.4]], R[0], 201); }
  return s;
}
// the ladder's top poking out of the hatch (draw before the reporter)
export function atticLadder(c, m) {
  const h = GATTIC.hatch, T = (col) => tone(m, col), z = h.Z + 0.25; if (!vis(c, z)) return "";
  let s = ""; for (const dx of [-0.28, 0.28]) s += ln3(c, [[h.X + dx, 0, z], [h.X + dx, 1.25 + (dx > 0 ? 0.08 : 0), z]], INK, 0.085, dx * 9) + ln3(c, [[h.X + dx, 0, z], [h.X + dx, 1.25 + (dx > 0 ? 0.08 : 0), z]], T("#8a5a37"), 0.06, dx * 9);
  for (const y of [0.3, 0.72, 1.12]) s += ln3(c, [[h.X - 0.28, y, z], [h.X + 0.28, y + jit(y, 0.02), z]], INK, 0.06, y * 5) + ln3(c, [[h.X - 0.28, y, z], [h.X + 0.28, y + jit(y, 0.02), z]], T("#9a6a40"), 0.04, y * 5);
  return s;
}

// ================================================================ PROPS held in a hand (local cm, origin = the grip)
// the slip: a scrap of paper with the word on it. The word is NOT lettering: three abstract ink strokes and two dabs.
export function slipG(T = (x) => x, wd = 12, sd = 1) {
  const h = wd * 0.62, pts = [[-wd / 2, -h / 2 + 0.6], [-wd * 0.2, -h / 2 - 0.4], [wd * 0.15, -h / 2 + 0.5], [wd / 2, -h / 2 - 0.2], [wd / 2 + 0.5, h * 0.1], [wd / 2 - 0.4, h / 2], [wd * 0.1, h / 2 + 0.6], [-wd * 0.25, h / 2 - 0.3], [-wd / 2 - 0.3, h / 2 + 0.2], [-wd / 2 + 0.4, 0]];
  const ink = T("#1c1830"), u = wd / 12;
  return `<path d="${wp(pts, sd + 3, 2, true, 3)}" fill="${T("#f1e3c2")}" stroke="${INK}" stroke-width="0.5"/><path d="${wp([[wd * 0.1, h / 2 + 0.6], [wd / 2 - 0.4, h / 2], [wd / 2 + 0.5, h * 0.1], [wd * 0.28, h * 0.2]], sd + 4, 1)}" fill="${T("#d8c49a")}"/>` +
    `<path d="M${n(-4.2 * u)},${n(-0.6 * u)} q${n(1.2 * u)},${n(-2.2 * u)} ${n(2.6 * u)},${n(0.2 * u)} q${n(0.9 * u)},${n(1.6 * u)} ${n(2.2 * u)},${n(-0.4 * u)} M${n(1.6 * u)},${n(-1.6 * u)} l${n(1.4 * u)},${n(2.6 * u)} M${n(-3 * u)},${n(1.7 * u)} q${n(2.4 * u)},${n(0.8 * u)} ${n(4.6 * u)},${n(-0.2 * u)}" stroke="${ink}" stroke-width="${n(0.8 * u)}" fill="none" stroke-linecap="round"/><circle cx="${n(3.8 * u)}" cy="${n(-0.2 * u)}" r="${n(0.5 * u)}" fill="${ink}"/><circle cx="${n(-1 * u)}" cy="${n(-2.2 * u)}" r="${n(0.4 * u)}" fill="${ink}"/>`;
}
export const slipAt = (x, y, k, st = {}) => `<g transform="translate(${n(x)},${n(y)}) rotate(${n(st.rot || 0)}) scale(${k.toFixed(4)})">${slipG(st.m ? (col) => tone(st.m, col, st.m.kc * 0.5) : undefined, st.wd || 12)}</g>`;
const HELD = {
  slip: (T) => `<g transform="translate(1,-7) rotate(-8)">${slipG((col) => T(col, 0.4), 13)}</g>`,
  book: (T) => `<g transform="translate(2,-2)"><path d="${wp([[-8, -11], [9, -12], [10, 9], [-7, 10]], 3)}" fill="${T("#5a2030")}"/><path d="${wp([[9, -12], [11.6, -10.6], [12.4, 9.6], [10, 9]], 4, 1)}" fill="${T("#efe6d0")}" stroke-width="0.4"/><path d="M-4.6,-7.4 L5.6,-8 L6,5.6 L-4.2,6 Z" fill="none" stroke="${T("#c9a24a")}" stroke-width="0.7"/></g>`,
  // an open prayer book held in both hands: the lines on the page are plain rules, not writing
  bookOpen: (T) => `<path d="${wp([[-15, -8], [-1, -5], [0, 6], [-14, 4]], 5)}" fill="${T("#f4ecd8")}"/><path d="${wp([[15, -8], [1, -5], [0, 6], [14, 4]], 6)}" fill="${T("#e6dcc4")}"/><path d="M-15,-8 L-14,4 L0,6 L14,4 L15,-8 L16.4,-6.6 L15.2,5.6 L0,8 L-15.2,5.6 L-16.4,-6.6 Z" fill="${T("#5a2030")}"/>` + [-5, -2.6, -0.2, 2.2].map((y, i) => `<path d="M-12.4,${n(y - 1)} L-3,${n(y + 1)} M3,${n(y + 1)} L${n(12.4 - (i === 3 ? 4 : 0))},${n(y - 1)}" stroke="${T("#8a8070")}" stroke-width="0.7" fill="none"/>`).join("") + `<path d="M0,6 q1.4,5 0.4,10" stroke="${T("#a8323a")}" stroke-width="1" fill="none"/>`,
  // the reporter's 1920 storm lantern
  lantern: (T, t) => { const fl = Math.sin(t * 17) * 0.8; return `<g transform="translate(3,3)"><path d="M-6.4,5 Q0,-7 6.4,5" stroke="${T("#2a2a32")}" stroke-width="1.3" fill="none"/><path d="${wp([[-5.6, 9], [-6.6, 24], [6.6, 24], [5.6, 9]], 7)}" fill="${T("#fff0b8", 0.3)}"/><path d="M0,${n(11.6 + fl * 0.4)} Q${n(3 + fl)},17 0,22.4 Q${n(-3 + fl)},17 0,${n(11.6 + fl * 0.4)} Z" fill="#ffb040" stroke="#e8742a" stroke-width="0.4"/><path d="M-6.6,24 L6.6,24 L7.6,29 L-7.6,29 Z M-5.6,9 L5.6,9 L3.4,4.6 L-3.4,4.6 Z" fill="${T("#3a3a44")}"/><path d="M-6.2,13 L-9,11 L-9.6,24 M6.2,13 L9,11 L9.6,24" stroke="${T("#3a3a44")}" stroke-width="0.9" fill="none"/></g>`; },
  notebook: (T) => `<g transform="translate(2,-4) rotate(-12)"><path d="${wp([[-6, -8], [6, -8.6], [6.6, 8], [-5.6, 8.4]], 8)}" fill="${T("#f1e8d2")}"/><path d="M-6,-8 L6,-8.6 L6.1,-6 L-5.9,-5.4 Z" fill="${T("#3a3a44")}"/><path d="M-3.6,-2.6 L3.8,-3 M-3.6,0.4 L2.6,0 M-3.4,3.4 L3.6,3" stroke="${T("#8a8070")}" stroke-width="0.6"/></g>`,
  loaf: (T) => `<g transform="translate(4,-3)"><path d="${wp([[-10, 2], [-8, -6], [4, -8], [12, -3], [11, 4], [-2, 6]], 9, 2)}" fill="${T("#c98a48")}"/><path d="M-5,-4 l3,5 M0,-6 l3,6 M5,-6 l3,5" stroke="${T("#8a5226")}" stroke-width="0.9"/></g>`,
};

// ================================================================ THE PEOPLE: one rig (after legend-paw's figure)
// st common: { X, Y, Z, fx -1..1, scale, lean, m (mood: tones the figure),
//   legs:  sit 0..1 + seat (m), kneel 0..1 + kneelBend, crawl 0..1, walk phase, run phase (long stride, leans in),
//          climb phase (ladder: knees and fists alternate), tiptoe 0..1
//   face:  talk 0..1, blink 0..1 (auto), look -1..1, wide 0..1, brow -1 (raised) .. 1 (angry), smile -1..1, tears, sweat,
//          tilt / nod deg, bend deg (waist)
//   arms:  reach 0..1 (+ reachTo [x, y] cm, or reachAt {x, y} a SCREEN point, e.g. the golem's mouth), point 0..1,
//          finger 0..1 (index finger raised: the rule), shape 0..1 (both hands kneading, shapeTo [x, y] cm), book 0..1
//          (open prayer book in both hands), up 0..1 (both hands high), face 0..1 (hands to the face), throw 0..1,
//          hold "slip"|"book"|"lantern"|"notebook"|"loaf" in the leading hand + holdUp 0..1 (holdTo [x, y]), hold2 (other
//          hand), handL / handR [x, y] cm to override.
// Each returns { svg, p, handL, handR, held, head (screen points), k (px per cm) }.
const rad = Math.PI / 180;
function ik(S, T, a, b, side) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy) || 0.01;
  const mx = a + b - 0.4; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const mn = Math.abs(a - b) + 0.5; if (d < mn) { dx *= mn / d; dy *= mn / d; d = mn; }
  const u = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - u * u));
  const cand = [1, -1].map((k) => [S[0] + dx * u / d - dy / d * h * k, S[1] + dy * u / d + dx / d * h * k]);
  const sc = (e) => side * (e[0] - S[0]) * 0.45 + (e[1] - S[1]) * 1.6;
  const E = sc(cand[0]) >= sc(cand[1]) ? cand[0] : cand[1];
  return [[S[0], S[1]], E, [S[0] + dx, S[1] + dy]];
}
function handG(kind, skin, dk) {
  if (kind === "fist") return `<path d="M-1,-3.8 Q4,-5.2 7.4,-3.2 Q9.4,0 7.4,3.6 Q3,5.2 -1,3.8 Z" fill="${skin}"/><path d="M3.2,-4.2 L3.6,4 M5.6,-3.6 L6,3.2" stroke="${dk}" stroke-width="0.45" fill="none"/>`;
  if (kind === "point") return `<path d="M-1,-3.6 Q3,-4.8 6,-3.6 L15,-2.8 Q16.8,-1.5 15,-0.3 L7.4,0.6 Q8.6,3.2 5.4,4.2 Q2,4.8 -1,3.6 Z" fill="${skin}"/><path d="M3.6,0.8 L7,0.6 M4.2,2.6 l2.2,-0.2" stroke="${dk}" stroke-width="0.45" fill="none"/>`;
  return `<path d="M2,-3.6 Q2.6,-7.8 5.6,-7 Q6.4,-5.2 4.8,-3.6 Z" fill="${skin}"/><path d="M-1,-3.6 Q3,-4.8 6.6,-3.8 L11,-3 Q12.2,-1 11,1.8 L6.6,3.8 Q3,4.8 -1,3.6 Z" fill="${skin}"/><path d="M7.4,-2 l3.2,0.3 M7.4,0 l3.4,0.2 M7,2 l3,-0.5" stroke="${dk}" stroke-width="0.45" fill="none"/>`;
}
function faceOn(x, o) {
  const { st, fx, T, t, dir } = x, hy = -158, hx = fx * 2, ex = hx + fx * 5.2, ey = hy - 1.6 + (o.eyeY || 0), afx = Math.abs(fx);
  const wide = st.wide || 0, bl = st.blink ?? blinkAmt((t + o.seed * 1.3) % (3.1 + o.seed * 0.43), [1.2]), open = (1 - bl) * (1 + 0.32 * wide);
  const look = st.look ?? fx * 0.85, brow = st.brow ?? o.brow ?? 0, smile = st.smile ?? o.smile ?? 0, sk = T(o.skin, 0.6), skD = T(mix(o.skin, "#8a3a2a", 0.4), 0.6);
  const dxe = o.eyeDX ?? 5, w = o.eyeW ?? 2.9, h = (o.eyeH ?? 2.9), pup = lerp(0.45, 0.24, wide);
  let head = "";
  if (afx > 0.3) head += `<path d="M${n(hx - fx * o.rx * 0.9)},${n(hy - 3)} q${n(-fx * 4.4)},-0.6 ${n(-fx * 3.8)},5 q${n(fx * 0.4)},3.4 ${n(fx * 3.8)},3 Z" fill="${sk}"/><path d="M${n(hx - fx * o.rx)},${n(hy - 0.6)} q${n(-fx * 1.6)},0.7 ${n(-fx * 0.9)},2.8" stroke="${skD}" stroke-width="0.5" fill="none"/>`;
  head += `<path d="${headPath(hx, hy, o.rx, o.ry, fx, o.chin)}" fill="${sk}"/>`;
  let f = "";
  if (o.blush) f += `<ellipse cx="${n(ex - dxe - 2)}" cy="${n(hy + 5)}" rx="2.6" ry="1.5" fill="${T(o.blush, 0.6)}" opacity="0.5" stroke="none"/><ellipse cx="${n(ex + dxe + 2)}" cy="${n(hy + 5)}" rx="2.6" ry="1.5" fill="${T(o.blush, 0.6)}" opacity="0.5" stroke="none"/>`;
  if (o.bags || st.grief) f += `<path d="M${n(ex - dxe - 2.4)},${n(ey + 3.4)} q2.4,1.5 4.8,0 M${n(ex + dxe - 2.4)},${n(ey + 3.4)} q2.4,1.5 4.8,0" stroke="${skD}" stroke-width="0.6" fill="none"/>`;
  f += eye(ex - dxe, ey, w * (fx > 0.3 ? 0.84 : 1), h, look, open, -1, o.iris || "#3a2418", pup) + eye(ex + dxe, ey, w * (fx < -0.3 ? 0.84 : 1), h, look, open, 1, o.iris || "#3a2418", pup);
  const by = ey - 6 - wide * 1.4 + (o.browY || 0), bw = o.browW ?? 1.3;
  f += `<path d="M${n(ex - dxe - 3.6)},${n(by + brow * 1.3)} Q${n(ex - dxe)},${n(by - 1.2)} ${n(ex - dxe + 3)},${n(by - brow * 1.7)} M${n(ex + dxe - 3)},${n(by - brow * 1.7)} Q${n(ex + dxe)},${n(by - 1.2)} ${n(ex + dxe + 3.6)},${n(by + brow * 1.3)}" stroke="${T(o.browCol)}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
  if (o.old) f += `<path d="M${n(ex - dxe - 4)},${n(ey - 0.6)} l-1.7,-1 M${n(ex - dxe - 4)},${n(ey + 0.8)} l-1.8,0.4 M${n(ex + dxe + 4)},${n(ey - 0.6)} l1.7,-1 M${n(ex + dxe + 4)},${n(ey + 0.8)} l1.8,0.4 M${n(ex - 4)},${n(hy - 12.6)} q4,-1 8,0 M${n(ex - 3)},${n(hy - 10.6)} q3,-0.8 6,0" stroke="${skD}" stroke-width="0.5" fill="none" stroke-linecap="round"/>`;
  const nl = o.nose ?? 1, nd = afx < 0.15 ? dir * 0.5 : fx;
  f += `<path d="M${n(ex + nd * 1.2)},${n(ey + 2.4)} q${n(nd * 3 * nl)},${n(3.6 * nl)} ${n(-nd * 0.8)},${n(5 * nl)}" stroke="${o.noseCol ? T(o.noseCol, 0.6) : skD}" stroke-width="${o.noseW ?? 0.9}" fill="none" stroke-linecap="round"/>`;
  if (o.old) f += `<path d="M${n(ex - 4.6)},${n(hy + 4)} Q${n(ex - 5.6)},${n(hy + 7)} ${n(ex - 4)},${n(hy + 9.4)} M${n(ex + 4.6)},${n(hy + 4)} Q${n(ex + 5.6)},${n(hy + 7)} ${n(ex + 4)},${n(hy + 9.4)}" stroke="${skD}" stroke-width="0.5" fill="none"/>`;
  const my = hy + (o.mouthY ?? 8.6), mw = o.mouthW ?? 2.6, talk = st.talk || 0;
  if (talk > 0.12) f += talkMouth(ex, my, mw, talk, "#4a1a26");
  else if (smile > 0.6 && o.teeth) f += `<path d="M${n(ex - mw - 0.6)},${n(my - 1)} Q${n(ex)},${n(my + 0.6)} ${n(ex + mw + 0.6)},${n(my - 1.2)} Q${n(ex)},${n(my + 4.4)} ${n(ex - mw - 0.6)},${n(my - 1)} Z" fill="#f6f0e4"/><path d="M${n(ex - mw)},${n(my + 0.9)} Q${n(ex)},${n(my + 2.2)} ${n(ex + mw)},${n(my + 0.7)}" stroke="${INK}" stroke-width="0.35" fill="none"/>`;
  else f += `<path d="M${n(ex - mw)},${n(my - smile * 1)} Q${n(ex)},${n(my + smile * 2.4)} ${n(ex + mw)},${n(my - smile * 1.1)}" stroke="#6a2a34" stroke-width="1" fill="none" stroke-linecap="round"/>` + (smile < -0.4 ? `<path d="M${n(ex - 1.4)},${n(my + 2.6)} q1.4,-0.9 2.8,0" stroke="${skD}" stroke-width="0.5" fill="none"/>` : "");
  if (st.tears) f += [-1, 1].map((d) => `<path d="M${n(ex + d * dxe + d * 0.6)},${n(ey + 2.6)} q${n(d * 1.4)},${n(4 * st.tears)} ${n(d * 0.4)},${n(8 * st.tears)}" stroke="#cfe6ff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.9"/><path d="M${n(ex + d * dxe + d * 1)},${n(ey + 3 + 8 * st.tears)} q-1.3,2.2 0,3 q1.3,-0.8 0,-3 Z" fill="#dff0ff" stroke-width="0.3"/>`).join("");
  if (st.sweat) f += `<path d="M${n(hx - dir * (o.rx - 2.6))},${n(hy - 9 + ((t * 5) % 5) * st.sweat)} q-1.5,2.6 0,3.6 q1.5,-1 0,-3.6 Z" fill="#dff0ff" stroke-width="0.3" opacity="${n(clamp(st.sweat))}"/>`;
  return { head, f, hx, hy, ex, ey, my };
}
function figure(c, st, t, sp) {
  if (!vis(c, st.Z)) return { svg: "", p: null, handL: null, handR: null, head: null, held: null };
  const p = P(c, st.X, st.Y || 0, st.Z), sc = sp.scale * (st.scale || 1), w = sp.wid, m = st.m, pk = p.s / 100 * sc;
  const T = m ? (col, f = 1) => tone(m, col, m.kc * f) : (col) => col;
  const fx = st.fx ?? 0.5, dir = fx >= 0 ? 1 : -1, afx = Math.abs(fx);
  const sit = st.sit || 0, kn = st.kneel || 0, cr = st.crawl || 0, seat = (st.seat ?? 0.5) * 100 / sc;
  const rn = st.run, wk = st.walk ?? rn, amp = rn == null ? 1 : sp.skirt ? 1.25 : 1.9, sw = wk == null ? 0 : Math.sin(wk * Math.PI * 2) * amp, bob = wk == null ? 0 : Math.abs(Math.cos(wk * Math.PI * 2)) * 2.5 * amp, cl = st.climb == null ? null : Math.sin(st.climb * Math.PI * 2);
  const HS = sp.headS ?? 1.2, hipY = -74 + sit * (74 - seat - 5) + kn * 30 + cr * 36 - (st.tiptoe || 0) * 6 - bob, hipX = -cr * dir * 18;
  const bend = dir * ((st.bend ?? sp.stoop ?? 0) * (1 - cr) + sit * (st.leanIn || 0) + kn * (st.kneelBend ?? 10)) + cr * dir * 72;
  const cb = Math.cos(bend * rad), sb = Math.sin(bend * rad), X2 = (x, y) => [hipX + x * cb - (y + 84) * sb, hipY + x * sb + (y + 84) * cb];
  const x = { st, t, T, fx, dir, afx, w, c };
  const skin = T(sp.skin, 0.6), skD = T(mix(sp.skin, "#8a3a2a", 0.4), 0.6);
  // legs
  const B = (a, s2, k2, c2) => a + sit * (s2 - a) + kn * (k2 - a) + cr * (c2 - a);
  const leg = (sd) => {
    const hx0 = hipX + sd * 6 * w, kS = [sd * 6 * w + sw * sd * 7 * dir, -38], fS = [sd * 7 * w + sw * sd * 13 * dir, -4 - Math.max(0, sw * sd) * 5 - (st.tiptoe || 0) * 3];
    const kSit = [sd * 9 * w + fx * 14, hipY + 4], fSit = [kSit[0] + fx * 4, -4], kK = [sd * 6 * w + dir * 8, -5], fK = [kK[0] - dir * 34 * Math.max(0.4, afx) + sd * 2, -3.4], kC = [hipX + sd * 4 + dir * 5, -5], fC = [kC[0] - dir * 38 + sd * 3, -3.4];
    if (rn != null) { kS[0] += dir * 7; fS[1] -= Math.max(0, -sw * sd * dir) * 7; }
    if (cl != null) { const lf = Math.max(0, sd * cl); kS[0] = sd * 8 * w + dir * 9 * lf; kS[1] = -38 - 15 * lf; fS[0] = sd * 8 * w + dir * 3 * lf; fS[1] = -4 - 28 * lf; }
    return [[hx0, hipY], [B(kS[0], kSit[0], kK[0], kC[0]), B(kS[1], kSit[1], kK[1], kC[1])], [B(fS[0], fSit[0], fK[0], fC[0]), B(fS[1], fSit[1], fK[1], fC[1])]];
  };
  const lL = leg(-1), lR = leg(1), down = kn + cr;
  const shoe = (f, sd) => down > 0.5 ? `<ellipse cx="${n(f[0] - dir * 4)}" cy="${n(f[1])}" rx="7" ry="3.4" fill="${T(sp.shoe)}"/>` : sp.shoeG ? `<g transform="translate(${n(f[0])},${n(f[1] + 4)})">${sp.shoeG(x, sd)}</g>` : `<path d="M${n(f[0] - 5.4 + fx * 2)},${n(f[1] + 3.6)} Q${n(f[0] - 6 + fx * 2)},${n(f[1] - 3)} ${n(f[0])},${n(f[1] - 3.6)} Q${n(f[0] + 6 + fx * 5)},${n(f[1] - 3)} ${n(f[0] + 6 + fx * 6)},${n(f[1] + 3.6)} Z" fill="${T(sp.shoe)}"/>`;
  let legs = "";
  if (sp.skirt) {
    const sk = [X2(-11.5 * w, -100), X2(11.5 * w, -100), [lR[1][0] + 10, lR[1][1] - 2 * sit], [lR[2][0] + 13 + down * 6, -1.5], [lL[2][0] - 13 - down * 6, -1.5], [lL[1][0] - 10, lL[1][1] - 2 * sit]];
    legs += shoe(lL[2], -1) + shoe(lR[2], 1);
    legs += `<path d="M${sk.map((q) => `${n(q[0])},${n(q[1])}`).join(" L")} Z" fill="${T(sp.skirt)}"/>` + (sp.skirtG ? sp.skirtG(x, sk) : "");
  } else {
    const far = dir > 0 ? lL : lR, near = dir > 0 ? lR : lL;
    legs += limb(far, 13 * w, T(mix(sp.legs, "#000000", 0.2))) + shoe(far[2], dir > 0 ? -1 : 1) + limb(near, 13 * w, T(sp.legs), T(mix(sp.legs, "#000000", 0.2))) + shoe(near[2], dir > 0 ? 1 : -1) + (sp.legG ? sp.legG(x, near, far) : "");
  }
  // arms: targets, then two-bone IK
  const SL = X2(-15 * w, -135), SR = X2(15 * w, -135), Hd = X2(fx * 2 * HS, -143 - 15 * HS), lead = dir > 0 ? "R" : "L";
  const S = { L: SL, R: SR }, tg = {}, kind = { L: "open", R: "open" }, rest = { L: true, R: true };
  for (const k of ["L", "R"]) {
    const sd = k === "L" ? -1 : 1, kneeP = k === "L" ? lL[1] : lR[1];
    let q = [S[k][0] + sd * 3 + (wk == null ? 0 : -sw * sd * 8 * dir), S[k][1] + 50];
    if (sit > 0) q = [lerp(q[0], kneeP[0] - fx * 4, sit), lerp(q[1], kneeP[1] - 6, sit)];
    if (cr > 0) q = [lerp(q[0], S[k][0] + dir * (k === lead ? 14 : -2), cr), lerp(q[1], -3, cr)];
    tg[k] = q;
  }
  const to = (k, q, a) => { if (a > 0.001) { tg[k] = [lerp(tg[k][0], q[0], a), lerp(tg[k][1], q[1], a)]; if (a > 0.3) rest[k] = false; } };
  const SLd = S[lead];
  const other = lead === "L" ? "R" : "L";
  if (st.hold2) { to(other, [S[other][0] - dir * 2, S[other][1] + 34], 1); kind[other] = "fist"; }
  if (st.hold) { to(lead, [SLd[0] + dir * 15, SLd[1] + 30], 1 - cr * 0.6); to(lead, st.holdTo || [SLd[0] + dir * 22, SLd[1] - 12], st.holdUp || 0); kind[lead] = "fist"; }
  if (sp.both) sp.both(x, to, X2, kind);
  if (!st.reachAt) to(lead, st.reachTo || (cr > 0.5 ? [SLd[0] + dir * 46, -9] : [SLd[0] + dir * 46, SLd[1] + 6]), st.reach || 0);
  if (st.point) { to(lead, [SLd[0] + dir * 50, SLd[1] - 5], st.point); if (st.point > 0.5) kind[lead] = "point"; }
  if (st.throw) { const u = st.throw; if (u < 0.5) to(lead, [SLd[0] - dir * 10, SLd[1] - 46], ease(u * 2)); else { to(lead, [SLd[0] - dir * 10, SLd[1] - 46], 1); to(lead, [SLd[0] + dir * 48, SLd[1] + 14], ease((u - 0.5) * 2, "out")); } }
  if (st.finger) { to(lead, [SLd[0] + dir * 27, SLd[1] - 35], st.finger); if (st.finger > 0.5) kind[lead] = "point"; }
  if (st.shape) { const q = st.shapeTo || [SLd[0] + dir * 30, -24], j = Math.sin(t * 5) * 2.5 * st.shape; to("L", [q[0] - 8, q[1] + j], st.shape); to("R", [q[0] + 9, q[1] - j], st.shape); }
  if (st.book) { to("L", X2(-7.5 + fx * 7, -109), st.book); to("R", X2(7.5 + fx * 7, -109), st.book); kind.L = kind.R = "fist"; }
  if (cl != null) { to("L", [Hd[0] - 21 + dir * 5, Hd[1] + 2 - 18 * Math.max(0, cl)], 1); to("R", [Hd[0] + 21 + dir * 5, Hd[1] + 2 - 18 * Math.max(0, -cl)], 1); kind.L = kind.R = "fist"; }
  if (st.reachAt) to(lead, [(st.reachAt.x - p.x) / pk, (st.reachAt.y - p.y) / pk], st.reach ?? 1);
  if (st.offer) to(lead, [SLd[0] + dir * 44, SLd[1] + 16], st.offer);
  if (st.face) { to("L", [Hd[0] - 8.5 * HS + fx * 3, Hd[1] + 8 * HS], st.face); to("R", [Hd[0] + 8.5 * HS + fx * 3, Hd[1] + 8 * HS], st.face); }
  if (st.up) { const ux = st.upX ?? dir * 8; to("L", [Hd[0] + ux - 7, Hd[1] - 44], st.up); to("R", [Hd[0] + ux + 7, Hd[1] - 46], st.up); kind.L = kind.R = st.up > 0.7 ? "fist" : "open"; }
  if (st.handL) { tg.L = st.handL; rest.L = false; } if (st.handR) { tg.R = st.handR; rest.R = false; }
  const sl = sp.sleeve, arm = {}, wristP = {};
  for (const k of ["L", "R"]) {
    const sd = k === "L" ? -1 : 1, pts = ik(S[k], tg[k], 27, 24, sd), [s0, e, wr] = pts, ang = Math.atan2(wr[1] - e[1], wr[0] - e[0]) / rad;
    const col = T(k === lead || sit ? sl.col : mix(sl.col, "#000000", 0.14)), hc = [wr[0] + Math.cos(ang * rad) * 5, wr[1] + Math.sin(ang * rad) * 5];
    let a = "";
    const hk = k === lead ? st.hold : st.hold2;
    if (hk && HELD[hk]) a += `<g transform="translate(${n(hc[0])},${n(hc[1] - 1)}) rotate(${n(st.holdRot ?? dir * 6)}) scale(${st.holdSize ?? 1})">${HELD[hk](T, t, st, dir)}</g>`;
    if (sl.roll) a += limb([e, wr], 7.4 * Math.min(1.15, w), skin) + limb([s0, e], 9.4 * w, col) + `<circle cx="${n(e[0])}" cy="${n(e[1])}" r="${n(5.4 * w)}" fill="${T(mix(sl.col, "#ffffff", 0.2))}"/>`;
    else a += limb(pts, 9.4 * w, col, T(mix(sl.col, "#000000", 0.22))) + `<g transform="translate(${n(lerp(e[0], wr[0], 0.9))},${n(lerp(e[1], wr[1], 0.9))}) rotate(${n(ang)})"><path d="M-2.2,${n(-5.2 * w)} L2.2,${n(-5.2 * w)} L2.2,${n(5.2 * w)} L-2.2,${n(5.2 * w)} Z" fill="${T(sl.cuff)}"/></g>`;
    if (sp.armG) a += sp.armG(x, k, s0, e, wr);
    const flip = (k === "L") !== (Math.abs(ang) > 90) ? 1 : -1;
    a += `<g transform="translate(${n(wr[0])},${n(wr[1])}) rotate(${n(ang)}) scale(${n(sp.hand ?? 1)},${n((sp.hand ?? 1) * flip)})">${handG(kind[k], skin, skD)}</g>`;
    arm[k] = a; wristP[k] = hc;
  }
  const hr = (st.tilt || 0) - bend * (cr > 0.5 ? 0.82 : 0.5) + (st.nod || 0);
  const torso = `<g transform="translate(${n(hipX)},${n(hipY + 84)}) rotate(${n(bend)} 0 -84)">${sp.torso(x)}<path d="M${n(-4.4 * w)},-147 L${n(4.4 * w)},-147 L${n(4 * w)},-137 L${n(-4 * w)},-137 Z" fill="${T(mix(sp.skin, "#8a3a2a", 0.14), 0.6)}"/>${sp.collar ? sp.collar(x) : ""}<g transform="rotate(${n(hr)} 0 -143) translate(0,-143) scale(${HS}) translate(0,143)">${sp.head(x)}</g></g>`;
  const behind = rest[other] && sit < 0.5 && !sp.both2;
  const body = (sit > 0.5 || sp.skirt ? "" : legs) + (sp.skirt && sit <= 0.5 ? legs : "") + (behind ? arm[other] : "") + torso + (sit > 0.5 ? legs : "") + (behind ? "" : arm[other]) + (sp.frontG ? sp.frontG(x, wristP, tg) : "") + (st.book > 0.5 ? `<g transform="translate(${n((wristP.L[0] + wristP.R[0]) / 2)},${n((wristP.L[1] + wristP.R[1]) / 2 - 3)})">${HELD.bookOpen(T, t, st, dir)}</g>` : "") + arm[lead];
  const lean = st.lean ?? (rn != null ? dir * 9 : 0), k = sc, scr = (q) => toScreen(p, lean, q[0] * k, q[1] * k);
  return { svg: shadow(p, 0.3 * sc * (1 + cr * 0.8)) + `<g class="ol" transform="${place(p, lean)} scale(${sc})">${body}</g>`, p, handL: scr(wristP.L), handR: scr(wristP.R), held: scr(wristP[lead]), head: scr(Hd), k: pk };
}
const torsoPath = (w, col) => `<path d="M${n(-15 * w)},-138 Q${n(-17.4 * w)},-112 ${n(-13.6 * w)},-83 L${n(13.6 * w)},-83 Q${n(17.4 * w)},-112 ${n(15 * w)},-138 Q0,-144.5 ${n(-15 * w)},-138 Z" fill="${col}"/>`;

// ---- Rabbi Loew: old, tall, long white beard, long dark gown with a wine sash, a soft dark cap. Kind eyes under heavy
// white brows; st.brow 0.5 makes him stern. Poses the story needs: kneel + shape (kneading the clay), hold "slip" +
// holdUp (shows the word), reachAt (puts the slip in / pulls it out of the golem's mouth) + tiptoe, finger (the rule),
// book (singing), run.
const RABBI = {
  scale: 1.03, wid: 1.0, stoop: 4, skin: "#e8c2a2", skirt: "#2b2647", shoe: "#1a1420", seed: 5, headS: 1.2,
  sleeve: { col: "#2b2647", cuff: "#4a4470" },
  skirtG: ({ T }, sk) => { const a = sk[0], b = sk[1], hl = sk[4], hr = sk[3]; return `<path d="M${n((a[0] + b[0]) / 2 - 2.4)},${n(a[1])} L${n((a[0] + b[0]) / 2 + 2.4)},${n(b[1])} L${n((hl[0] + hr[0]) / 2 + 4.4)},${n(hr[1])} L${n((hl[0] + hr[0]) / 2 - 3.4)},${n(hl[1])} Z" fill="${T("#3f3a66")}" stroke-width="0.4"/><path d="M${n(hl[0] + 1)},${n(hl[1] - 3.4)} Q${n((hl[0] + hr[0]) / 2)},${n(hl[1] - 1)} ${n(hr[0] - 1)},${n(hr[1] - 3.4)}" stroke="${T("#5a5488")}" stroke-width="1.6" fill="none"/>`; },
  torso: ({ T, w, fx }) => torsoPath(w, T("#2b2647")) + `<path d="M${n(5 + fx * 2)},-140 L${n(15 * w)},-138 Q${n(17.4 * w)},-112 ${n(13.6 * w)},-83 L${n(8 + fx * 2)},-83 Q${n(10)},-110 ${n(5 + fx * 2)},-140 Z" fill="${T("#1e1a36")}" stroke="none"/>` +
    `<path d="M${n(-2.4 + fx * 2)},-141 L${n(2.4 + fx * 2)},-141 L${n(2.4 + fx * 2)},-83 L${n(-2.4 + fx * 2)},-83 Z" fill="${T("#3f3a66")}" stroke-width="0.4"/>` +
    `<path d="M${n(-13.4 * w)},-101 Q0,-97 ${n(13.4 * w)},-101 L${n(13.6 * w)},-95.4 Q0,-91.6 ${n(-13.6 * w)},-95.4 Z" fill="${T("#8a2a3a")}"/><path d="M${n(-6 + fx * 2)},-96 q-2.4,8 -1,17 M${n(-3.6 + fx * 2)},-95 q1,8 2.6,14" stroke="${T("#8a2a3a")}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  collar: ({ T, fx }) => `<path d="M${n(-6 + fx)},-142 Q${n(fx * 2)},-137 ${n(6 + fx)},-142 L${n(5.4 + fx)},-137.6 Q${n(fx * 2)},-133.4 ${n(-5.4 + fx)},-137.6 Z" fill="${T("#efe9da")}"/>`,
  head: (x) => {
    const { T, fx, st, t } = x, o = { rx: 12.2, ry: 13.6, chin: 1.0, skin: RABBI.skin, browCol: "#f4f1ea", browW: 2.4, old: 1, nose: 1.3, noseW: 1.1, seed: 5, iris: "#3a2a1c", smile: 0.15, mouthY: 8.8, eyeH: 2.7, eyeW: 3.0, blush: "#dc8f80", bags: 1 }, F = faceOn(x, o), { hx, hy, ex } = F, wh = T("#f4f1ea", 0.5), whS = T("#c8c0b0", 0.5), cap = T("#231d33"), sw = Math.sin(t * 1.4) * 0.7 + (st.run != null ? -fx * 5 : 0);
    const beard = `<path d="M${n(hx - 12.6)},${n(hy - 3)} Q${n(hx - 15)},${n(hy + 9)} ${n(hx - 10.6 + fx * 2)},${n(hy + 21)} Q${n(hx - 8 + fx * 3 + sw)},${n(hy + 35)} ${n(ex + sw * 2 - 1.4)},${n(hy + 46)} Q${n(hx + 8.6 + fx * 3 + sw)},${n(hy + 34)} ${n(hx + 10.6 + fx * 2)},${n(hy + 21)} Q${n(hx + 15)},${n(hy + 9)} ${n(hx + 12.6)},${n(hy - 3)} Q${n(hx + 9.4 + fx * 2)},${n(hy + 5)} ${n(ex + 4.4)},${n(hy + 5.2)} Q${n(ex)},${n(hy + 3.6)} ${n(ex - 4.4)},${n(hy + 5.2)} Q${n(hx - 9.4 + fx * 2)},${n(hy + 5)} ${n(hx - 12.6)},${n(hy - 3)} Z" fill="${wh}"/>` +
      [[-7, 12, -5, 30], [-2.4, 13, -2, 39], [2.6, 13, 1.6, 40], [7, 12, 5.4, 30], [-10.4, 6, -9, 19], [10.4, 6, 9.4, 19]].map(([a, b, c2, d]) => `<path d="M${n(ex + a)},${n(hy + b)} Q${n(ex + a + sw * 0.5 - 1)},${n(hy + (b + d) / 2)} ${n(ex + c2 + sw * 1.4)},${n(hy + d)}" stroke="${whS}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`).join("");
    const tache = `<path d="M${n(ex)},${n(hy + 5.6)} Q${n(ex - 4)},${n(hy + 4.4)} ${n(ex - 8)},${n(hy + 9.4)} Q${n(ex - 4)},${n(hy + 8.2)} ${n(ex)},${n(hy + 7.2)} Q${n(ex + 4)},${n(hy + 8.2)} ${n(ex + 8)},${n(hy + 9.4)} Q${n(ex + 4)},${n(hy + 4.4)} ${n(ex)},${n(hy + 5.6)} Z" fill="${wh}"/>`;
    const side = (sd) => `<path d="M${n(hx + sd * 11.4)},${n(hy - 9)} Q${n(hx + sd * 15)},${n(hy - 4)} ${n(hx + sd * 13.6)},${n(hy + 3)} L${n(hx + sd * 10.4 + fx)},${n(hy + 1)} Q${n(hx + sd * 10 + fx)},${n(hy - 5)} ${n(hx + sd * 11.4)},${n(hy - 9)} Z" fill="${wh}"/>`;
    const hat = `<path d="M${n(hx - 13.6)},${n(hy - 8.6)} Q${n(hx - 18.6 - fx * 3)},${n(hy - 16.6)} ${n(hx - 8 - fx * 3)},${n(hy - 20.6)} Q${n(hx + 4 - fx * 4)},${n(hy - 23.6)} ${n(hx + 15 - fx * 3)},${n(hy - 18)} Q${n(hx + 19.4)},${n(hy - 13)} ${n(hx + 13.6)},${n(hy - 8.6)} Q${n(hx + fx * 2)},${n(hy - 14.6)} ${n(hx - 13.6)},${n(hy - 8.6)} Z" fill="${cap}"/><path d="M${n(hx - 13.6)},${n(hy - 8.6)} Q${n(hx + fx * 2)},${n(hy - 14.6)} ${n(hx + 13.6)},${n(hy - 8.6)} L${n(hx + 13)},${n(hy - 11.6)} Q${n(hx + fx * 2)},${n(hy - 17.6)} ${n(hx - 13)},${n(hy - 11.6)} Z" fill="${T("#3f3a66")}" stroke-width="0.4"/><path d="M${n(hx - 9 - fx * 3)},${n(hy - 17.6)} q5,-2.6 11,-1.8" stroke="${T("#4a4470")}" stroke-width="0.8" fill="none"/>`;
    return F.head + side(-1) + side(1) + beard + F.f + (st.talk > 0.12 ? "" : tache) + hat;
  },
};
export const rabbi = (c, st, t = 0) => figure(c, st, t, RABBI);

// ---- the townswoman: madder-red dress, apron, a teal shawl over head and shoulders. Bursts in shouting: run, point,
// wide, brow (fear = brow -0.6), talk.
const TOWNSWOMAN = {
  scale: 0.94, wid: 0.95, skin: "#eec6a8", skirt: "#8a3038", shoe: "#2a1a1c", seed: 6, headS: 1.22,
  sleeve: { col: "#8a3038", cuff: "#efe6d0" },
  skirtG: ({ T }, sk) => { const a = sk[0], b = sk[1], hl = sk[4], hr = sk[3]; return `<path d="M${n(a[0] + 4)},${n(a[1] + 1)} L${n(b[0] - 4)},${n(b[1] + 1)} L${n(lerp(b[0], hr[0], 0.7) - 7)},${n(lerp(b[1], hr[1], 0.78))} Q${n((hl[0] + hr[0]) / 2)},${n(lerp(a[1], hl[1], 0.84))} ${n(lerp(a[0], hl[0], 0.7) + 7)},${n(lerp(a[1], hl[1], 0.78))} Z" fill="${T("#e9dfc8")}"/><path d="M${n((a[0] + b[0]) / 2 - 6)},${n(a[1] + 30)} l7,1 l-1,8 l-6.4,-0.6 Z" fill="${T("#c9b89a")}" stroke-width="0.4"/><path d="M${n(hl[0] + 2)},${n(hl[1] - 4.6)} Q${n((hl[0] + hr[0]) / 2)},${n(hl[1] - 2)} ${n(hr[0] - 2)},${n(hr[1] - 4.6)}" stroke="${T("#5a1a24")}" stroke-width="1.4" fill="none"/>`; },
  torso: ({ T, w, fx }) => torsoPath(w, T("#8a3038")) + `<path d="M${n(-11.5 * w)},-100 L${n(11.5 * w)},-100 L${n(11.8 * w)},-96 L${n(-11.8 * w)},-96 Z" fill="${T("#e9dfc8")}"/>` +
    `<path d="M${n(-17 * w)},-136 Q-8,-147 0,-143 Q8,-147 ${n(17 * w)},-136 Q${n(20 * w)},-118 ${n(15.4 * w)},-106 L${n(3 + fx * 2)},-116 L${n(-3 + fx * 2)},-104 L${n(-15.4 * w)},-108 Q${n(-20 * w)},-120 ${n(-17 * w)},-136 Z" fill="${T("#2f6f6c")}"/><path d="M${n(-14 * w)},-128 l6,6 M${n(-15 * w)},-119 l7,6 M${n(14 * w)},-128 l-6,6 M${n(15 * w)},-119 l-6,5" stroke="${T("#1c4a4c")}" stroke-width="0.5" fill="none"/>` +
    [-13, -9, -5, 6, 10, 14].map((dx, i) => `<path d="M${n(dx * w)},${n(-107 - (i % 2))} l${n((i % 2) - 0.5)},4.4" stroke="${T("#2f6f6c")}" stroke-width="0.8" stroke-linecap="round"/>`).join(""),
  head: (x) => {
    const { T, fx, st } = x, o = { rx: 11.8, ry: 12.8, chin: 0.98, skin: TOWNSWOMAN.skin, browCol: "#5a3a2a", browW: 1.2, nose: 0.9, blush: "#ee8f8f", seed: 6, iris: "#4a3424", smile: 0, mouthY: 8.4, eyeH: 3.1, eyeW: 3.1 }, F = faceOn(x, o), { hx, hy } = F, sh = T("#2f6f6c"), shD = T("#1c4a4c");
    return `<path d="M${n(hx - 15 - fx * 2)},${n(hy + 13)} Q${n(hx - 19 - fx * 3)},${n(hy - 22)} ${n(hx - fx * 3)},${n(hy - 25)} Q${n(hx + 19 - fx * 3)},${n(hy - 22)} ${n(hx + 15 - fx * 2)},${n(hy + 13)} Z" fill="${sh}"/>` + F.head +
      `<path d="M${n(hx - 11.4)},${n(hy - 3)} Q${n(hx - 12)},${n(hy - 13.6)} ${n(hx + fx * 3)},${n(hy - 13)} Q${n(hx + 12)},${n(hy - 13.6)} ${n(hx + 11.4)},${n(hy - 3)} Q${n(hx + 8 + fx * 2)},${n(hy - 9.6)} ${n(hx + fx * 3)},${n(hy - 10.4)} Q${n(hx - 8 + fx * 2)},${n(hy - 9.6)} ${n(hx - 11.4)},${n(hy - 3)} Z" fill="${T("#4a2c1e")}"/>` +
      `<path d="M${n(hx - 13.4)},${n(hy + 10)} Q${n(hx - 15.4)},${n(hy - 14)} ${n(hx + fx * 2)},${n(hy - 16.4)} Q${n(hx + 15.4)},${n(hy - 14)} ${n(hx + 13.4)},${n(hy + 10)} L${n(hx + 15 - fx * 2)},${n(hy + 13)} Q${n(hx + 19 - fx * 3)},${n(hy - 22)} ${n(hx - fx * 3)},${n(hy - 25)} Q${n(hx - 19 - fx * 3)},${n(hy - 22)} ${n(hx - 15 - fx * 2)},${n(hy + 13)} Z" fill="${sh}"/><path d="M${n(hx - 10)},${n(hy - 19)} q2,5 0.6,10 M${n(hx + 6)},${n(hy - 21)} q-2,5 -0.4,9" stroke="${shD}" stroke-width="0.6" fill="none"/>` + F.f;
  },
};
export const townswoman = (c, st, t = 0) => figure(c, st, t, TOWNSWOMAN);

// ---- the baker: stout, floury apron, rolled sleeves, a soft white cap, a big moustache. Flees: run, wide, hold "loaf".
const BAKER = {
  scale: 0.98, wid: 1.22, skin: "#ecc0a0", legs: "#4a4458", shoe: "#2a2028", seed: 7, headS: 1.18,
  sleeve: { col: "#d8ccb4", cuff: "#d8ccb4", roll: 1 },
  torso: ({ T, w, fx }) => torsoPath(w, T("#d8ccb4")) + `<path d="M${n(-9 * w)},-128 L${n(9 * w)},-128 L${n(13.2 * w)},-70 Q0,-64 ${n(-13.2 * w)},-70 Z" fill="${T("#f4eee0")}"/><path d="M${n(-9 * w)},-128 L${n(-4 * w)},-141 M${n(9 * w)},-128 L${n(4 * w)},-141" stroke="${T("#f4eee0")}" stroke-width="2.4"/><path d="M${n(-12.6 * w)},-98 Q0,-94 ${n(12.6 * w)},-98" stroke="${T("#b8a888")}" stroke-width="1.4" fill="none"/><path d="M-6,-110 q3,2 5,-1 M4,-84 q3,2 6,0" stroke="${T("#c8b898")}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  head: (x) => {
    const { T, fx, st } = x, o = { rx: 13.4, ry: 13, chin: 0.96, skin: BAKER.skin, browCol: "#5a3a22", browW: 1.8, nose: 1.2, blush: "#e88a7a", seed: 7, iris: "#3a2a1c", smile: 0, mouthY: 9.4 }, F = faceOn(x, o), { hx, hy, ex } = F, wh = T("#f4eee0");
    return F.head + F.f + (st.talk > 0.12 ? "" : `<path d="M${n(ex)},${n(hy + 6)} Q${n(ex - 5)},${n(hy + 4.6)} ${n(ex - 9.6)},${n(hy + 9)} Q${n(ex - 4)},${n(hy + 9.6)} ${n(ex)},${n(hy + 7.6)} Q${n(ex + 4)},${n(hy + 9.6)} ${n(ex + 9.6)},${n(hy + 9)} Q${n(ex + 5)},${n(hy + 4.6)} ${n(ex)},${n(hy + 6)} Z" fill="${T("#5a3a22")}"/>`) +
      `<path d="M${n(hx - 13.6)},${n(hy - 8)} Q${n(hx - 20)},${n(hy - 24)} ${n(hx - 6)},${n(hy - 27)} Q${n(hx + 8)},${n(hy - 31)} ${n(hx + 17)},${n(hy - 21)} Q${n(hx + 19)},${n(hy - 12)} ${n(hx + 13.6)},${n(hy - 8)} Q${n(hx)},${n(hy - 13)} ${n(hx - 13.6)},${n(hy - 8)} Z" fill="${wh}"/><path d="M${n(hx - 13.6)},${n(hy - 8)} Q${n(hx)},${n(hy - 13)} ${n(hx + 13.6)},${n(hy - 8)} L${n(hx + 13)},${n(hy - 11.4)} Q${n(hx)},${n(hy - 16.4)} ${n(hx - 13)},${n(hy - 11.4)} Z" fill="${T("#d8ccb4")}" stroke-width="0.4"/>`;
  },
};
export const baker = (c, st, t = 0) => figure(c, st, t, BAKER);

// ---- a small boy of the lane: big head, cap, ochre tunic. Flees: run, wide, up (arms in the air).
const BOY = {
  scale: 0.66, wid: 0.92, skin: "#f0caa8", legs: "#5a4a3a", shoe: "#3a2a22", seed: 8, headS: 1.5,
  sleeve: { col: "#c98a32", cuff: "#a86a22" },
  torso: ({ T, w, fx }) => torsoPath(w, T("#c98a32")) + `<path d="M${n(-13.6 * w)},-83 L${n(13.6 * w)},-83 L${n(15 * w)},-70 Q0,-66 ${n(-15 * w)},-70 Z" fill="${T("#c98a32")}"/><path d="M${n(-13.4 * w)},-96 Q0,-92 ${n(13.4 * w)},-96" stroke="${T("#5a3a22")}" stroke-width="2" fill="none"/><path d="M${n(fx * 2 - 2.4)},-140 L${n(fx * 2)},-128 L${n(fx * 2 + 2.4)},-140" stroke="${T("#a86a22")}" stroke-width="0.9" fill="none"/>`,
  head: (x) => {
    const { T, fx } = x, o = { rx: 12.2, ry: 12.4, chin: 1.04, skin: BOY.skin, browCol: "#3a2a22", browW: 1.1, nose: 0.6, blush: "#f08a96", seed: 8, iris: "#3a2a1c", smile: 0, mouthY: 8, eyeH: 3.3, eyeW: 3.1 }, F = faceOn(x, o), { hx, hy } = F, hair = T("#3a2a22");
    return F.head + `<path d="M${n(hx - 12.4)},${n(hy)} Q${n(hx - 13.6)},${n(hy - 15)} ${n(hx + fx * 2)},${n(hy - 15.6)} Q${n(hx + 13.6)},${n(hy - 15)} ${n(hx + 12.4)},${n(hy)} Q${n(hx + 9 + fx * 3)},${n(hy - 8)} ${n(hx + 3 + fx * 4)},${n(hy - 9)} L${n(hx + fx * 4)},${n(hy - 6)} L${n(hx - 3 + fx * 4)},${n(hy - 9.4)} Q${n(hx - 9 + fx * 3)},${n(hy - 8)} ${n(hx - 12.4)},${n(hy)} Z" fill="${hair}"/>` + F.f +
      `<path d="M${n(hx - 13)},${n(hy - 10)} Q${n(hx - 15)},${n(hy - 21)} ${n(hx)},${n(hy - 22.6)} Q${n(hx + 15)},${n(hy - 21)} ${n(hx + 13)},${n(hy - 10)} Q${n(hx)},${n(hy - 15)} ${n(hx - 13)},${n(hy - 10)} Z" fill="${T("#6a3a3a")}"/><path d="M${n(hx + fx * 8 - 6)},${n(hy - 11.6)} Q${n(hx + fx * 14)},${n(hy - 12)} ${n(hx + fx * 18 + 4 * (fx >= 0 ? 1 : -1))},${n(hy - 8.4)} L${n(hx + fx * 8 + 6)},${n(hy - 11)} Z" fill="${T("#4a2828")}"/>`;
  },
};
export const boy = (c, st, t = 0) => figure(c, st, t, BOY);

// ---- the reporter, 1920: flat cap, belted trench coat, round glasses, a clipped moustache; storm lantern in the
// leading hand (hold "lantern", holdUp), notebook in the other (hold2 "notebook"). climb = coming up the ladder.
const REPORTER = {
  scale: 1.0, wid: 1.0, skin: "#ecc6a6", legs: "#4a4640", shoe: "#2a2420", seed: 9, headS: 1.2,
  sleeve: { col: "#b89a6a", cuff: "#96784c" },
  torso: ({ T, w, fx }) => `<path d="M${n(-13.6 * w)},-84 L${n(13.6 * w)},-84 L${n(16.4 * w)},-46 Q${n(8)},-43 ${n(fx * 2 + 1)},-45 L${n(fx * 2)},-62 L${n(fx * 2 - 1)},-45 Q-8,-43 ${n(-16.4 * w)},-46 Z" fill="${T("#b89a6a")}"/>` + torsoPath(w, T("#b89a6a")) +
    `<path d="M${n(5 + fx * 2)},-140 L${n(15 * w)},-138 Q${n(17.4 * w)},-112 ${n(13.6 * w)},-83 L${n(16.4 * w)},-46 L${n(9)},-44.6 Q${n(11)},-100 ${n(5 + fx * 2)},-140 Z" fill="${T("#96784c")}" stroke="none"/>` +
    `<path d="M${n(-13.8 * w)},-100 Q0,-96 ${n(13.8 * w)},-100 L${n(13.8 * w)},-94.6 Q0,-90.6 ${n(-13.8 * w)},-94.6 Z" fill="${T("#7a5e38")}"/><rect x="${n(fx * 2 - 3)}" y="-100.4" width="6" height="7" rx="0.8" fill="none" stroke="${T("#3a2a1a")}" stroke-width="0.9"/>` +
    `<path d="M${n(-11 * w)},-139 L${n(fx * 2 - 1)},-114 L${n(-8 * w)},-108 L${n(-14 * w)},-128 Z" fill="${T("#c8ac7c")}"/><path d="M${n(11 * w)},-139 L${n(fx * 2 + 1)},-114 L${n(8 * w)},-108 L${n(14 * w)},-128 Z" fill="${T("#a88a5a")}"/>` +
    [-108, -88, -72].map((y) => `<circle cx="${n(fx * 2 - 4.4)}" cy="${y}" r="1" fill="${T("#5a4426")}" stroke="none"/><circle cx="${n(fx * 2 + 4.4)}" cy="${y}" r="1" fill="${T("#5a4426")}" stroke="none"/>`).join(""),
  collar: ({ T, fx }) => `<path d="M${n(-5 + fx)},-141 Q${n(fx * 2)},-136 ${n(5 + fx)},-141 L${n(4.6 + fx)},-137 Q${n(fx * 2)},-133 ${n(-4.6 + fx)},-137 Z" fill="${T("#efe9da")}"/><path d="M${n(fx * 2 - 1.4)},-136 L${n(fx * 2 + 1.4)},-136 L${n(fx * 2 + 1)},-124 L${n(fx * 2 - 1)},-124 Z" fill="${T("#3a4a6a")}" stroke-width="0.3"/>`,
  head: (x) => {
    const { T, fx, st } = x, o = { rx: 11.8, ry: 13.2, chin: 1.02, skin: REPORTER.skin, browCol: "#4a3424", browW: 1.4, nose: 1.1, seed: 9, iris: "#3a4a5a", smile: 0, mouthY: 9, eyeH: 2.8 }, F = faceOn(x, o), { hx, hy, ex, ey } = F, cap = T("#5a5a4a"), capD = T("#3f3f34");
    return F.head + `<path d="M${n(hx - 12)},${n(hy - 2)} Q${n(hx - 12.6)},${n(hy - 10)} ${n(hx - 9)},${n(hy - 10)} L${n(hx - 9.6 + fx)},${n(hy + 1)} Z M${n(hx + 12)},${n(hy - 2)} Q${n(hx + 12.6)},${n(hy - 10)} ${n(hx + 9)},${n(hy - 10)} L${n(hx + 9.6 + fx)},${n(hy + 1)} Z" fill="${T("#4a3424")}"/>` + F.f +
      `<circle cx="${n(ex - 5)}" cy="${n(ey + 0.2)}" r="4.4" fill="#ffffff" fill-opacity="0.14" stroke="${T("#2a2a32")}" stroke-width="0.8"/><circle cx="${n(ex + 5)}" cy="${n(ey + 0.2)}" r="4.4" fill="#ffffff" fill-opacity="0.14" stroke="${T("#2a2a32")}" stroke-width="0.8"/><path d="M${n(ex - 0.6)},${n(ey - 0.4)} q0.6,-1 1.2,0" stroke="${T("#2a2a32")}" stroke-width="0.8" fill="none"/>` +
      (st.talk > 0.12 ? "" : `<path d="M${n(ex - 4.4)},${n(hy + 7.4)} Q${n(ex)},${n(hy + 5)} ${n(ex + 4.4)},${n(hy + 7.4)} Q${n(ex)},${n(hy + 7)} ${n(ex - 4.4)},${n(hy + 7.4)} Z" fill="${T("#4a3424")}"/>`) +
      `<path d="M${n(hx - 13.4)},${n(hy - 8.6)} Q${n(hx - 16)},${n(hy - 21)} ${n(hx - 2 - fx * 3)},${n(hy - 22.6)} Q${n(hx + 14 - fx * 3)},${n(hy - 23)} ${n(hx + 14.4)},${n(hy - 9)} Q${n(hx + fx * 3)},${n(hy - 14.6)} ${n(hx - 13.4)},${n(hy - 8.6)} Z" fill="${cap}"/><path d="M${n(hx + fx * 6 - 8)},${n(hy - 10.6)} Q${n(hx + fx * 13)},${n(hy - 12.6)} ${n(hx + fx * 19 + 5 * (fx >= 0 ? 1 : -1))},${n(hy - 7)} Q${n(hx + fx * 12)},${n(hy - 8.6)} ${n(hx + fx * 6 + 8)},${n(hy - 9.6)} Z" fill="${capD}"/><path d="M${n(hx - 8 - fx * 2)},${n(hy - 19)} q6,-3 14,-1.6 M${n(hx - 2 - fx * 3)},${n(hy - 22.4)} l0.6,8" stroke="${capD}" stroke-width="0.6" fill="none"/>`;
  },
};
export const reporter = (c, st, t = 0) => figure(c, st, t, REPORTER);
// the flat stepped pool of a hand lantern (screen blend) around a screen point, e.g. reporter(...).held
export const lanternPool = (pt_, m, k = 1, t = 0, r = 420) => !pt_ || k <= 0.01 ? "" : pool(pt_.x, pt_.y + 30, r, r * 0.85, m.ramp[3], 0.11 * k * (1 + 0.07 * Math.sin(t * 19)), 77, 3, t) + pool(pt_.x, pt_.y + 30, r * 0.42, r * 0.36, "#ffcf7a", 0.1 * k, 78, 2, t);

// ---- the host kid with his arms up (jumping for the rungs): L.kid() with both arms redrawn. st as L.kid, plus
// up 0..1 (arms raise), upX cm (where the hands go, default a little to the side he faces). Returns L.kid's result
// plus hands (screen) and back (a screen point on his jacket for the grandmother's grab: pass it to L.keeper as sleeve).
export function kidUp(c, st, t) {
  const r = L.kid(c, st, t); if (!r.svg) return r;
  const up = st.up ?? 1, fx = st.fx ?? -0.8, rl = st.reachL || 0, tug = (st.tug || 0) * 3.5, S = 0.8, DY = 78 * (1 - 0.74), jac = "#e8476a", jacS = "#bd2f50", skin = "#f3cdb0";
  const eL = [lerp(-15.5, -24, rl), lerp(-100, -110, rl)], wL = [lerp(-16, -36, rl), lerp(-80, -108, rl)];
  const a0 = limb([[-12.5, -120], eL, wL], 7.5, jac), b0 = limb([[12.5, -120], [16 + tug * 0.5, -99], [17 + tug, -80]], 7.5, jacS);
  let svg = r.svg; const ia = svg.lastIndexOf(a0), ib = svg.indexOf(b0), ic = svg.indexOf(`<path d="M-13,-124 Q-16.5,-110`);
  const ux = st.upX ?? fx * 7, str = st.stretch ?? 0;
  const arm = (sd, col) => { const Sx = sd * 12.5, W_ = [lerp(sd * 17, sd * 9 + ux, up), lerp(-80, -171 - str, up)], E = [lerp(sd * 16, sd * 21 + ux * 0.4, up), lerp(-99, -143, up)], an = Math.atan2(W_[1] - E[1], W_[0] - E[0]) * 180 / Math.PI;
    return { s: limb([[Sx, -120], E, W_], 7.5, col) + `<g transform="translate(${n(W_[0])},${n(W_[1])}) rotate(${n(an - 90)})"><path d="M-3.4,-1.5 L3.4,-1.5 L3.2,2 L-3.2,2 Z" fill="#a8284a"/><path d="M-2.8,2 Q-3.6,8 -1.4,10 L1.6,10 Q3.6,8 2.8,2 Z" fill="${skin}"/><path d="M-0.8,6 L-0.8,9.6 M1,6 L1,9.6" stroke="#c48a74" stroke-width="0.4"/></g>`, W_ }; };
  const A = arm(-1, jac), B = arm(1, jacS);
  if (ia > 0 && ib > 0 && ic > ib) svg = svg.slice(0, ib) + svg.slice(ic, ia) + B.s + A.s + `</g></g>`;
  const lean = st.lean || 0, scr = (q) => toScreen(r.p, lean, q[0] * S, (q[1] + DY - (st.hop || 0)) * S);
  return { ...r, svg, hands: [scr(A.W_), scr(B.W_)], back: scr([fx < 0 ? 14 : -14, -98]) };
}

// ================================================================ THE GOLEM
// River clay shaped by two hands: lumps pressed together, finger smears, handprints, drying cracks, a pebble and a reed
// stalk still stuck in it. About 2.6 m; st.grow 0..1 takes it to about 3.6 m. Local cm, feet at 0.
// st: { X, Y, Z, fx -1..1 (which way it faces and leans), grow 0..1, m,
//   pose: "stand" (default) or "lie" (on its back on the bank, head to the left for fx > 0) with sit 0..1 (sits up),
//   awake 0..1 (the two thumb-holes open: dark and wet, no glow), look -1..1, anger 0..1 (brow), slip 0/1 (the paper in
//   the slot mouth), tilt deg (head),
//   walk phase (heavy cycle), bend 0..1 (bows right down so a man can reach the mouth), carry 0..1 (the well ring on
//   its shoulder, one arm up), smash 0..1 (wind up, then the arm comes down), reach 0..1, handL / handR [x, y] cm,
//   crumble 0..1 (cracks open, the lumps let go and drop, a heap is left) }
// Returns { svg, p, k (px per cm), mouth, head, chest, handL, handR, top (screen points) }.
const CLAYC = { base: "#a8492b", lit: "#cc6d3e", dark: "#782f1f", deep: "#3f151a", wet: "#f0b08a", dry: "#b8917a" };
let GUID = 0;
const smooth = (p) => { const N = p.length, md = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let m0 = md(p[N - 1], p[0]), d = `M${n(m0[0])},${n(m0[1])}`; for (let i = 0; i < N; i++) { const q = md(p[i], p[(i + 1) % N]); d += `Q${n(p[i][0])},${n(p[i][1])} ${n(q[0])},${n(q[1])}`; } return d + "Z"; };
const lumpy = (pts, seed, a = 2.2) => pts.map(([x, y], i) => [x + jit(seed * 3.1 + i * 7.7, a), y + jit(seed * 5.3 + i * 9.1, a)]);
// a pressed handprint: palm and four fingers and a thumb, each a dark dent with a lit lower lip
function handprint(x, y, r, rot, C, flip = 1) {
  const dent = (dx, dy, rx, ry, a) => `<ellipse cx="${n(dx + 0.7)}" cy="${n(dy + 0.9)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.lit}" transform="rotate(${a} ${n(dx)} ${n(dy)})"/><ellipse cx="${n(dx)}" cy="${n(dy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.dark}" transform="rotate(${a} ${n(dx)} ${n(dy)})"/>`;
  return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(rot)}) scale(${n(r / 10 * flip)},${n(r / 10)})" stroke="none">${dent(0, 2, 6, 6.6, 0)}${dent(-5.6, -8.6, 1.7, 4.6, -14)}${dent(-1.9, -10.6, 1.8, 5.4, -4)}${dent(2.2, -10.4, 1.8, 5.2, 5)}${dent(5.9, -8, 1.6, 4.2, 16)}${dent(8.6, 0.4, 1.9, 4.2, 62)}</g>`;
}
// finger drags: a few parallel grooves, dark with a light edge
const smear = (x, y, len, rot, C, k = 3, gap = 3.4) => `<g transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})" fill="none" stroke-linecap="round">` + Array.from({ length: k }, (_, i) => `<path d="M0,${n(i * gap + 0.9)} q${n(len * 0.5)},${n(-2.4 + jit(x + i, 1))} ${n(len * (0.8 + 0.2 * hash(x + y + i)))},0" stroke="${C.lit}" stroke-width="1.5"/><path d="M0,${n(i * gap)} q${n(len * 0.5)},${n(-2.4 + jit(x + i, 1))} ${n(len * (0.8 + 0.2 * hash(x + y + i)))},0" stroke="${C.dark}" stroke-width="1.5"/>`).join("") + `</g>`;
const crk = (pts, C, w = 1.3) => `<path d="M${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" L")}" fill="none" stroke="${C.deep}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
// a limb lump from a to b (local cm), widths wa -> wb: lumpy outline, shaded underside, one smear
function lump(a, b, wa, wb, seed, C, o = {}) {
  const L_ = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, h0 = wa / 2, h1 = wb / 2, bul = o.bulge ?? 1.12;
  const top = [[-h0 * 0.7, -h0 * 0.75], [L_ * 0.25, -h0 * bul], [L_ * 0.6, -lerp(h0, h1, 0.6) * bul], [L_ + h1 * 0.7, -h1 * 0.75]], bot = [[L_ + h1 * 0.95, h1 * 0.2], [L_ + h1 * 0.5, h1 * 0.9], [L_ * 0.6, lerp(h0, h1, 0.6) * 1.04], [L_ * 0.2, h0 * 1.08], [-h0 * 0.6, h0 * 0.85], [-h0 * 1.0, 0]];
  const P_ = lumpy([...top, ...bot], seed, Math.min(2.4, wa * 0.05)), d = smooth(P_), sh_ = smooth(lumpy([[L_ + h1 * 0.9, h1 * 0.1], [L_ + h1 * 0.5, h1 * 0.9], [L_ * 0.6, lerp(h0, h1, 0.6) * 1.04], [L_ * 0.2, h0 * 1.08], [-h0 * 0.6, h0 * 0.85], [-h0 * 0.5, h0 * 0.42], [L_ * 0.3, h0 * 0.5], [L_ * 0.8, h1 * 0.46]], seed + 9, 1));
  const id = `gl${GUID++}`;
  return `<g transform="translate(${n(a[0])},${n(a[1])}) rotate(${n(ang)})"><clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${C.base}" stroke="${INK}" stroke-width="1.5"/><g clip-path="url(#${id})"><path d="${sh_}" fill="${C.dark}" stroke="none"/><path d="M${n(L_ * 0.1)},${n(-h0 * 0.62)} Q${n(L_ * 0.4)},${n(-h0 * 0.9)} ${n(L_ * 0.75)},${n(-h1 * 0.66)}" stroke="${C.lit}" stroke-width="${n(wa * 0.11)}" fill="none" stroke-linecap="round"/>${o.detail ? o.detail(L_, h0, h1) : smear(L_ * (0.3 + 0.2 * hash(seed)), -h0 * 0.2, L_ * 0.3, 70 + jit(seed, 30), C, 3, 3)}</g></g>`;
}
function fistG(q, ang, r, seed, C, open = 0) {
  const d = smooth(lumpy([[-r * 0.9, -r * 0.7], [0, -r], [r * 0.9, -r * 0.8], [r * 1.25, 0], [r * 0.9, r * 0.85], [0, r], [-r * 0.9, r * 0.7], [-r * 1.1, 0]], seed, 1.6));
  return `<g transform="translate(${n(q[0])},${n(q[1])}) rotate(${n(ang)})"><path d="${d}" fill="${C.base}" stroke="${INK}" stroke-width="1.5"/><path d="${smooth([[r * 0.2, r * 0.3], [r * 1.0, r * 0.2], [r * 0.8, r * 0.8], [0, r * 0.92], [-r * 0.7, r * 0.6]])}" fill="${C.dark}" stroke="none"/><path d="M${n(r * 0.5)},${n(-r * 0.74)} L${n(r * 0.6)},${n(r * 0.6)} M${n(r * 0.05)},${n(-r * 0.86)} L${n(r * 0.12)},${n(r * 0.7)} M${n(-r * 0.4)},${n(-r * 0.8)} L${n(-r * 0.34)},${n(r * 0.66)}" stroke="${C.deep}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="${smooth(lumpy([[-r * 0.5, -r * 1.3], [r * 0.3, -r * 1.34], [r * 0.5, -r * 0.8], [-r * 0.4, -r * 0.7]], seed + 4, 1))}" fill="${C.lit}" stroke="${INK}" stroke-width="1.2"/></g>`;
}
function golemHead(st, C, t, fx, awake, id) {
  const fo = fx * 7, anger = st.anger || 0, look = st.look ?? fx * 0.5;
  const out = smooth(lumpy([[-25, 15], [-28, -5], [-23, -24], [-9, -31], [10, -30], [24, -21], [27, -2], [23, 16], [9, 25], [-10, 24]], 71, 1.6));
  let s = `<clipPath id="${id}"><path d="${out}"/></clipPath><path d="${out}" fill="${C.base}" stroke="${INK}" stroke-width="1.6"/><g clip-path="url(#${id})"><path d="${smooth([[8, -32], [26, -22], [30, 0], [24, 18], [8, 27], [14, 6], [16, -12]])}" fill="${C.dark}" stroke="none"/><path d="M-20,-14 Q-16,-26 -4,-28" stroke="${C.lit}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  // finger grooves over the crown, a thumb-pinched nose, the brow pressed in with the side of a hand
  s += smear(-12 + fo * 0.4, -27, 14, 82, C, 4, 4.4) + `</g>`;
  const by = -10.4, bt = anger * 4.4;
  s += `<path d="M${n(-19 + fo)},${n(by - bt + 1.4)} Q${n(-9 + fo)},${n(by - 3.4 + bt * 0.3 + 1.4)} ${n(-1.6 + fo)},${n(by + bt + 1.4)} M${n(1.6 + fo)},${n(by + bt + 1.4)} Q${n(9 + fo)},${n(by - 3.4 + bt * 0.3 + 1.4)} ${n(19 + fo)},${n(by - bt + 1.4)}" stroke="${C.lit}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${n(-19 + fo)},${n(by - bt)} Q${n(-9 + fo)},${n(by - 3.4 + bt * 0.3)} ${n(-1.6 + fo)},${n(by + bt)} M${n(1.6 + fo)},${n(by + bt)} Q${n(9 + fo)},${n(by - 3.4 + bt * 0.3)} ${n(19 + fo)},${n(by - bt)}" stroke="${C.deep}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s += `<path d="${smooth(lumpy([[fo - 2.6, -6], [fo + 2.4, -6.4], [fo + 4.4, 4.6], [fo, 7], [fo - 4.2, 4.4]], 73, 0.6))}" fill="${C.lit}" stroke="${C.dark}" stroke-width="0.9"/>`;
  // the eyes: two thumb-holes. Shut = shallow dents; awake = deep, dark, with a wet fleck that follows the look
  for (const sd of [-1, 1]) {
    const ex = sd * 10.6 + fo, ey = -1.4 + (sd > 0 ? 0.6 : 0), rx = 5.6 + (sd > 0 ? 0.5 : 0), ry = lerp(1.7, 6.4, awake) * (1 - anger * 0.22), hole = `M${n(ex - rx)},${n(ey)} Q${n(ex - rx * 0.6)},${n(ey - ry * 1.25)} ${n(ex + rx * 0.2)},${n(ey - ry)} Q${n(ex + rx * 1.1)},${n(ey - ry * 0.5)} ${n(ex + rx)},${n(ey + ry * 0.2)} Q${n(ex + rx * 0.5)},${n(ey + ry * 1.15)} ${n(ex - rx * 0.3)},${n(ey + ry)} Q${n(ex - rx * 1.05)},${n(ey + ry * 0.6)} ${n(ex - rx)},${n(ey)} Z`, cid = `${id}e${sd + 1}`;
    s += `<path d="${hole}" fill="${C.lit}" transform="translate(1,1.5)" stroke="none"/><path d="${hole}" fill="${mix(C.dark, C.deep, 0.35 + 0.65 * awake)}" stroke="${C.deep}" stroke-width="0.9"/>`;
    if (awake > 0.3) s += `<clipPath id="${cid}"><path d="${hole}"/></clipPath><g clip-path="url(#${cid})"><ellipse cx="${n(ex + look * 2.2)}" cy="${n(ey + 0.6)}" rx="3.6" ry="4" fill="#0c0508"/><path d="M${n(ex - rx)},${n(ey + ry * 0.55)} Q${n(ex)},${n(ey + ry * 1.3)} ${n(ex + rx)},${n(ey + ry * 0.45)} L${n(ex + rx)},${n(ey + ry * 1.4)} L${n(ex - rx)},${n(ey + ry * 1.4)} Z" fill="${C.dark}" opacity="0.8"/><ellipse cx="${n(ex + look * 2.2 - 1.5)}" cy="${n(ey - 1.5)}" rx="1.3" ry="1" fill="${C.wet}" opacity="${n(awake)}"/><path d="M${n(ex - 2.6)},${n(ey + ry * 0.62)} q2.6,1.3 5,-0.2" stroke="${C.wet}" stroke-width="0.7" fill="none" opacity="${n(awake * 0.8)}"/></g>`;
    s += `<path d="M${n(ex - rx - 2.4)},${n(ey - 1)} q-1.2,2.4 0.2,5 M${n(ex + rx + 2.2)},${n(ey - 1.6)} q1.4,2.6 0,5.4" stroke="${C.dark}" stroke-width="0.7" fill="none"/>`;
  }
  // the slot mouth, cut with a stick; the slip sits in it
  const my = 14.6, mw = 10.5;
  s += `<path d="M${n(-mw + fo)},${n(my + 1.9)} Q${n(fo)},${n(my + 4.3)} ${n(mw + fo)},${n(my + 1.5)}" stroke="${C.lit}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="${smooth([[-mw + fo, my - 0.4], [fo - 3, my - 2 - anger], [fo + 4, my - 1.8 - anger], [mw + fo, my - 0.8], [fo + 5, my + 1.9], [fo - 5, my + 2.1]])}" fill="${C.deep}" stroke="${C.deep}" stroke-width="0.8"/>`;
  if (st.slip) s += `<g transform="translate(${n(fo + 1 + Math.sin(t * 2.3) * 0.3)},${n(my + 4.6)}) rotate(${n(4 + Math.sin(t * 1.9) * 2)})"><g transform="rotate(90) scale(0.74)">${slipG(st.m ? (c2) => tone(st.m, c2, st.m.kc * 0.5) : undefined, 13, 2)}</g></g><path d="M${n(-mw + fo + 2)},${n(my + 0.4)} Q${n(fo)},${n(my + 2)} ${n(mw + fo - 2)},${n(my + 0.2)}" stroke="${C.deep}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  s += crk([[-22 + fo * 0.3, 6], [-17, 9], [-18, 14], [-13, 18]], C, 1) + crk([[14, -29], [12, -23], [16, -19]], C, 1);
  return s;
}
const TORSO = [[-44, 8], [-51, -22], [-46, -52], [-66, -84], [-90, -102], [-92, -122], [-72, -136], [-40, -138], [-22, -128], [22, -128], [44, -140], [76, -133], [91, -116], [85, -97], [64, -80], [48, -50], [52, -22], [46, 8], [0, 13]];
function golemTorso(C, id) {
  const out = smooth(lumpy(TORSO, 81, 1.8));
  let s = `<clipPath id="${id}"><path d="${out}"/></clipPath><path d="${out}" fill="${C.base}" stroke="${INK}" stroke-width="1.7"/><g clip-path="url(#${id})">`;
  s += `<path d="${smooth([[22, -128], [44, -142], [80, -135], [96, -116], [88, -95], [66, -78], [50, -50], [54, -20], [48, 12], [20, 14], [30, -30], [34, -70], [52, -100], [40, -122]])}" fill="${C.dark}" stroke="none"/>`;
  s += `<path d="M-84,-108 Q-80,-128 -58,-132" stroke="${C.lit}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-44,-44 Q-48,-28 -44,-8" stroke="${C.lit}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // the seam where the chest was pressed onto the belly, and the navel: one thumb
  s += `<path d="M-48,-52 Q-20,-44 6,-50 Q30,-55 49,-49" stroke="${C.deep}" stroke-width="1.7" fill="none"/><path d="M-47,-49.6 Q-20,-41.6 6,-47.6 Q30,-52.6 49,-46.6" stroke="${C.lit}" stroke-width="1.5" fill="none" opacity="0.9"/><ellipse cx="2" cy="-17" rx="4.4" ry="5.4" fill="${C.lit}" transform="translate(0.8,1.2)"/><ellipse cx="2" cy="-17" rx="4.4" ry="5.4" fill="${C.deep}"/>`;
  s += handprint(-30, -92, 15, -22, C) + handprint(26, -28, 12, 152, C, -1) + handprint(58, -112, 10, 38, C);
  s += smear(-70, -98, 22, 62, C, 4, 4) + smear(4, -112, 26, 8, C, 3, 4.6) + smear(-34, -36, 20, -70, C, 3, 4) + smear(28, -76, 16, 100, C, 3, 3.6);
  s += crk([[-4, -128], [-7, -116], [-1, -108], [-6, -98], [-3, -90]], C) + crk([[-1, -108], [8, -103]], C, 1) + crk([[50, -40], [42, -34], [44, -24], [36, -18]], C) + crk([[-48, -20], [-40, -14], [-42, -4]], C) + crk([[-80, -118], [-70, -112], [-66, -102]], C, 1);
  // river things still in the clay: two pebbles, a snail shell, a reed stalk
  s += `<ellipse cx="-14" cy="-62" rx="4" ry="3" fill="#a8a0a0" stroke="${C.deep}" stroke-width="0.8"/><ellipse cx="40" cy="-92" rx="3" ry="2.4" fill="#d8ccc0" stroke="${C.deep}" stroke-width="0.8"/><path d="M-58,-66 q4,-4 7,0 q1,4 -3,4.6 q-3,-0.4 -2.4,-2.8" fill="#e8dcc0" stroke="${C.deep}" stroke-width="0.8"/>`;
  s += `</g><path d="M66,-134 L78,-166 L84,-164 L73,-131 Z" fill="#6a8a4a" stroke="${INK}" stroke-width="1"/><path d="M78,-166 q8,-7 13,-2 q-6,0 -9,4" fill="#7a8f3f" stroke="${INK}" stroke-width="0.8"/>`;
  return s;
}
// the heap of clay that is left (local cm, about 3 m wide at k = 1): something like a huge shoulder and the dome of a
// head still in it; dry 0..1 turns it pale and dusty
function pileG(C, k, dry = 0, seed = 1) {
  const sx = 0.55 + 0.45 * k, P_ = [[-150, 2], [-146, -10], [-118, -30], [-90, -60], [-58, -76], [-32, -60], [-10, -52], [12, -66], [36, -62], [54, -40], [86, -34], [120, -18], [152, 2], [60, 7], [-70, 7]].map(([x, y]) => [x * sx, y * k]);
  const out = smooth(lumpy(P_, seed + 90, 2 * k)), id = `gp${GUID++}`;
  let s = `<clipPath id="${id}"><path d="${out}"/></clipPath><path d="${out}" fill="${C.base}" stroke="${INK}" stroke-width="1.6"/><g clip-path="url(#${id})" transform="scale(${n(sx)},${n(k)})">`;
  s += `<path d="${smooth([[30, -70], [60, -44], [100, -34], [160, 0], [20, 12], [40, -20]])}" fill="${C.dark}" stroke="none"/><path d="${smooth([[-150, 10], [-120, -8], [-60, -14], [10, -6], [60, 10]])}" fill="${C.dark}" stroke="none" opacity="0.7"/>`;
  s += `<path d="M-112,-32 Q-88,-62 -58,-70" stroke="${C.lit}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M4,-58 Q14,-66 30,-60" stroke="${C.lit}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M-34,-60 Q-22,-40 -30,-16 M-10,-52 Q-2,-30 6,-8 M56,-40 Q60,-22 54,-4" stroke="${C.deep}" stroke-width="1.6" fill="none"/>` + handprint(-74, -40, 13, -30, C) + smear(72, -24, 22, 20, C, 3, 4);
  s += `<path d="M10,-48 q5,-3 10,0 q-5,3.4 -10,0 Z" fill="${C.deep}"/><path d="M11,-46 q5,2.6 9,-0.4" stroke="${C.lit}" stroke-width="1.2" fill="none"/>` + crk([[-120, -20], [-104, -18], [-96, -8]], C) + crk([[96, -28], [104, -14], [118, -10]], C) + `</g>`;
  // loose lumps around the foot of it
  for (const [x, r, sd] of [[-168, 11, 1], [-132, 7, 2], [128, 9, 3], [164, 12, 4], [176, 5, 5], [-186, 5, 6], [20, 8, 7], [-40, 6, 8]]) s += `<path d="${smooth(lumpy([[x * sx - r, 2], [x * sx - r * 0.6, -r * 1.1 * k], [x * sx + r * 0.6, -r * 1.2 * k], [x * sx + r, 2], [x * sx, 5]], sd + seed, 1.2))}" fill="${sd % 2 ? C.base : C.lit}" stroke="${INK}" stroke-width="1.2"/>`;
  return s;
}
const clayCols = (m, dry = 0, kc) => { const C = {}; for (const [k, v] of Object.entries(CLAYC)) { const d = mix(v, k === "deep" ? "#5a3a34" : k === "dark" ? "#8a6a5a" : k === "lit" ? "#d8c0a8" : "#b8947c", dry * 0.8); C[k] = m ? tone(m, d, kc ?? m.kc * 0.55) : d; } return C; };
export function clayPile(c, st = {}) {
  const Z = st.Z ?? GATTIC.pile.Z, X = st.X ?? GATTIC.pile.X; if (!vis(c, Z)) return "";
  const p = P(c, X, st.Y || 0, Z), k = st.k ?? 1; if (k <= 0.01) return "";
  return shadow(p, 1.3 * (0.55 + 0.45 * k) * (st.size ?? 1)) + `<g transform="${place(p)} scale(${n(st.size ?? 1)})">${pileG(clayCols(st.m, st.dry || 0), k, st.dry || 0)}</g>`;
}
export function golem(c, st, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", p: null };
  const p = P(c, st.X, st.Y || 0, st.Z), G = 1 + 0.385 * (st.grow || 0), k = p.s / 100 * G, m = st.m, C = clayCols(m, st.dry || 0);
  const fx = st.fx ?? 0.4, dir = fx >= 0 ? 1 : -1, cr = st.crumble || 0, awake = (st.awake ?? 1) * clamp(1 - cr * 2.6), id = `g${GUID++}`;
  const scr = (q) => toScreen(p, st.lean || 0, q[0] * G, q[1] * G);
  const rot2 = (q, a, o) => { const r = a * Math.PI / 180, x = q[0], y = q[1]; return [o[0] + x * Math.cos(r) - y * Math.sin(r), o[1] + x * Math.sin(r) + y * Math.cos(r)]; };
  const armG = (Sh, Tg, sd, seed) => { const pts = ik(Sh, Tg, 60, 58, sd), [s0, e, wr] = pts, an = Math.atan2(wr[1] - e[1], wr[0] - e[0]) * 180 / Math.PI; return { s: lump(s0, e, 46, 38, seed, C) + lump(e, wr, 36, 40, seed + 1, C, { bulge: 1.05 }) + fistG([wr[0] + Math.cos(an * Math.PI / 180) * 12, wr[1] + Math.sin(an * Math.PI / 180) * 12], an, 21, seed + 2, C), wr, mid: e }; };
  if (st.pose === "lie") {
    // on its back on the ground, seen from a little above: the frontal body laid over (width squashed into depth);
    // sitting up, the torso swings to upright while the legs stay down
    const e = ease(st.sit || 0), sdn = dir, ML = [0, -sdn * 0.42, sdn, 0, sdn * 130, -26], MS = [0.9, 0, 0, 1, sdn * 26, 104 - 34], M = ML.map((v, i) => lerp(v, MS[i], e)), ap = (Mx, q) => [Mx[0] * q[0] + Mx[2] * q[1] + Mx[4], Mx[1] * q[0] + Mx[3] * q[1] + Mx[5]], mat = (Mx) => `matrix(${Mx.map((v) => v.toFixed(4)).join(" ")})`;
    const legs = [-1, 1].map((sd) => lump([sd * 26, -104], [sd * 30, -58], 46, 40, 20 + sd, C) + lump([sd * 30, -58], [sd * 32, -12], 40, 44, 23 + sd, C)).join("");
    const feet = [-1, 1].map((sd) => { const q = ap(ML, [sd * 32, -6]); return `<path d="${smooth(lumpy([[q[0] - 15, q[1] + 8], [q[0] - 13, q[1] - 30], [q[0] + 4, q[1] - 38], [q[0] + 17, q[1] - 26], [q[0] + 15, q[1] + 8]], 30 + sd, 1.5))}" fill="${sd * sdn > 0 ? C.base : C.dark}" stroke="${INK}" stroke-width="1.5"/>`; }).join("");
    const hc = ap(M, [fx * 4 * e, -246]), ha = lerp(-sdn * 78, st.tilt || 0, e);
    const head = `<g transform="translate(${n(hc[0])},${n(hc[1])}) rotate(${n(ha)}) scale(1.34)">${golemHead(st, C, t, fx * e, awake, id + "h")}</g>`;
    const arm = (sd, seed) => { const Sh = ap(M, [sd * 78, -212]), lieT = ap(ML, [sd * 86, -100]), sitT = [Sh[0] + sd * 30 - sdn * 10, -12], tg = sd < 0 ? st.handL : st.handR; return armG(Sh, tg || [lerp(lieT[0], sitT[0], e), lerp(lieT[1] - 4, sitT[1], e)], sd, seed); };
    const aL = arm(-1, 40), aR = arm(1, 44), nearFirst = ap(M, [-78, -212])[1] > ap(M, [78, -212])[1];
    const far = nearFirst ? aR : aL, near = nearFirst ? aL : aR;
    const body = `<g transform="${mat(ML)}">${legs}</g>${feet}${far.s}<g transform="${mat(M)}"><g transform="translate(0,-104)">${golemTorso(C, id + "t")}</g></g>${head}${near.s}`;
    const mo = rot2([fx * 9.4 * e, 20], ha, hc);
    return { svg: `<ellipse cx="${n(p.x)}" cy="${n(p.y + 2)}" rx="${n(1.75 * p.s * G)}" ry="${n(0.2 * p.s * G)}" fill="${m ? m.ramp[0] : "#0a0718"}" opacity="0.4"/><g transform="${place(p, st.lean || 0)} scale(${n(G)})">${body}</g>`, p, k, mouth: scr(mo), head: scr(hc), chest: scr(ap(M, [0, -190])), handL: scr(aL.wr), handR: scr(aR.wr), top: scr([hc[0], hc[1] - 44]) };
  }
  // ---- standing family
  const wk = st.walk, sw = wk == null ? 0 : Math.sin(wk * Math.PI * 2), cw = wk == null ? 0 : Math.cos(wk * Math.PI * 2), bend = st.bend || 0, sm = st.smash || 0, wind = ease(clamp(sm / 0.45)), hit = ease(clamp((sm - 0.45) / 0.3), "in"), carry = st.carry || 0;
  const hip = [dir * bend * -14 + sw * 3, -104 + Math.abs(sw) * 5 + bend * 8], A = dir * (bend * 72 - wind * 12 + hit * 34) + sw * 2.5 + (wk != null ? dir * 4 : 0);
  const tp = (q) => rot2(q, A, hip);
  const foot = (sd) => { const ph = sd * sw, lift = Math.max(0, sd * cw) * 16 * (wk == null ? 0 : 1); return [sd * 32 + dir * ph * 26, -12 - lift]; };
  const legG = (sd, seed) => { const f = foot(sd), h = [hip[0] + sd * 27, hip[1] + 4], kn = [(h[0] + f[0]) / 2 + dir * (6 + (f[1] < -14 ? 12 : 0)), (h[1] + f[1]) / 2 - 2]; return { s: lump(h, kn, 50, 42, seed, C) + lump(kn, f, 40, 48, seed + 1, C) + `<path d="${smooth(lumpy([[f[0] - 27 + dir * 6, 0], [f[0] - 26 + dir * 4, f[1] + 2], [f[0] - 8, f[1] - 9], [f[0] + 14 + dir * 8, f[1] - 4], [f[0] + 29 + dir * 10, f[1] + 6], [f[0] + 27 + dir * 10, 0]].map(([x, y]) => [x, y + (f[1] + 12)]), seed + 2, 1.6))}" fill="${C.base}" stroke="${INK}" stroke-width="1.5"/>`, c: kn }; };
  const lF = legG(-dir, 10), lN = legG(dir, 14);
  const SL = tp([-80, -112]), SR = tp([80, -112]), Sh = { [-1]: SL, 1: SR }, cs = st.carrySide ?? -dir;
  const tubB = tp([cs * 60, -138]);
  const tgt = (sd) => { let q = [Sh[sd][0] + sd * 9 - dir * sw * sd * 20, Math.min(-22, Sh[sd][1] + 112)];
    if (bend > 0) q = [lerp(q[0], Sh[sd][0] + sd * 6 + dir * 10, bend), Math.min(-20, lerp(q[1], Sh[sd][1] + 108, bend))];
    if (carry > 0 && sd === cs) q = [lerp(q[0], tubB[0] + cs * 56, carry), lerp(q[1], tubB[1] - 30, carry)];
    if (carry > 0 && sd !== cs) q = [lerp(q[0], Sh[sd][0] - sd * 10, carry * 0.5), lerp(q[1], q[1] + 0, carry)];
    if (sm > 0 && sd === dir) { q = [lerp(q[0], Sh[sd][0] - dir * 26, wind), lerp(q[1], Sh[sd][1] - 104, wind)]; q = [lerp(q[0], Sh[sd][0] + dir * 96, hit), lerp(q[1], Sh[sd][1] + 44, hit)]; }
    if (st.reach && sd === dir) q = [lerp(q[0], Sh[sd][0] + dir * 104, st.reach), lerp(q[1], Sh[sd][1] + 4, st.reach)];
    const ov = sd < 0 ? st.handL : st.handR; return ov || q; };
  const aL = armG(SL, tgt(-1), -1, 40), aR = armG(SR, tgt(1), 1, 44), aFar = dir > 0 ? aL : aR, aNear = dir > 0 ? aR : aL;
  const hc = tp([fx * 9, -147]), ha = A * 0.55 + (st.tilt || 0) - bend * dir * 8;
  const mo = rot2([fx * 9.4, 20], ha, hc);
  // crumbling: every lump lets go on its own beat, drops, shrinks into the heap
  const gY = -6, part = (svg, ctr, i) => { if (cr <= 0) return svg; const d0 = 0.08 + hash(i + 3) * 0.14 + clamp((-ctr[1]) / 280) * 0.16, u = clamp((cr - d0) / 0.42), f = u * u; if (u >= 1) return ""; return `<g transform="translate(${n(jit(i + 7, 46) * u)},${n((gY - ctr[1]) * f * 0.92)}) rotate(${n(jit(i + 11, 70) * u)} ${n(ctr[0])} ${n(ctr[1])})" opacity="${n(clamp((1 - u) * 5))}"><g transform="translate(${n(ctr[0])},${n(ctr[1])}) scale(${n(1 - 0.3 * u)}) translate(${n(-ctr[0])},${n(-ctr[1])})">${svg}</g></g>`; };
  let body = part(lF.s, lF.c, 1) + part(lN.s, lN.c, 2) + part(aFar.s, aFar.mid, 3);
  let tor = `<g transform="translate(${n(hip[0])},${n(hip[1])}) rotate(${n(A)})">${golemTorso(C, id + "t")}`;
  if (cr > 0.02) { const o = clamp(cr * 5); tor += `<g opacity="${n(o)}">` + crk([[-60, -128], [-44, -100], [-52, -76], [-30, -56], [-36, -30], [-18, -8]], C, 2.6 + cr * 4) + crk([[70, -126], [50, -104], [58, -84], [34, -62], [40, -36], [20, -10]], C, 2.4 + cr * 4) + crk([[-44, -100], [-10, -96], [8, -84], [34, -62]], C, 2.2 + cr * 3) + `</g>`; }
  body += part(tor + `</g>`, tp([0, -66]), 4);
  body += part(`<g transform="translate(${n(hc[0])},${n(hc[1])}) rotate(${n(ha)}) scale(1.34)">${golemHead(st, C, t, fx, awake, id + "h")}${cr > 0.02 ? crk([[-6, -30], [-2, -14], [-8, -2], [2, 12]], C, 2 + cr * 3) : ""}</g>`, hc, 5);
  if (carry > 0.5 && cr <= 0) body += `<g class="ol" transform="translate(${n(tubB[0])},${n(tubB[1])}) rotate(${n(A * 0.6 + Math.sin(t * 2) * 1.5 + (st.tubRot || 0))}) scale(${n(1 / G)})">${tubG(m ? (col) => tone(m, col, m.k * 0.8) : (x) => x, t, 1)}</g>`;
  body += part(aNear.s, aNear.mid, 6);
  if (cr > 0) {
    // loose chunks and dust: seeded, each on its own fall
    for (let i = 0; i < 26; i++) { const x0 = jit(i + 100, 80), y0 = -30 - hash(i + 110) * 230, d0 = hash(i + 120) * 0.5, u = clamp((cr - d0) / 0.4); if (u <= 0 || u >= 1) continue; const y = y0 + (gY - y0) * u * u, x = x0 + jit(i + 130, 70) * u, r = 5 + hash(i + 140) * 11; body += `<path d="${smooth(lumpy([[x - r, y], [x - r * 0.4, y - r], [x + r * 0.7, y - r * 0.7], [x + r, y + r * 0.2], [x, y + r * 0.8]], i + 150, 1.4))}" fill="${i % 3 ? C.base : i % 2 ? C.lit : C.dark}" stroke="${INK}" stroke-width="1.2" transform="rotate(${n(u * jit(i, 300))} ${n(x)} ${n(y)})"/>`; }
    for (let i = 0; i < 7; i++) { const u = clamp((cr - 0.25 - i * 0.06) / 0.5); if (u <= 0 || u >= 1) continue; const x = jit(i + 200, 150) * (0.5 + u), r = (22 + hash(i + 210) * 26) * (0.5 + u); body += `<path d="${smooth(lumpy([[x - r, -6], [x - r * 0.7, -r * 0.9], [x, -r * 1.3], [x + r * 0.8, -r * 0.8], [x + r, -6]], i + 220, 3))}" fill="${m ? m.ramp[4] : "#e8c8a8"}" opacity="${n(0.5 * (1 - u))}"/>`; }
    const pk = ease(clamp((cr - 0.3) / 0.6));
    if (pk > 0.01) body += pileG(C, pk, 0, 1);
  }
  const svg = shadow(p, 0.75 * G) + `<g transform="${place(p, st.lean || 0)} scale(${n(G)})">${body}</g>`;
  return { svg, p, k, mouth: scr(mo), head: scr(hc), chest: scr(tp([0, -90])), handL: scr(aL.wr), handR: scr(aR.wr), top: scr([hc[0], hc[1] - 44]), tub: scr(tubB) };
}

// ================================================================ THE TITLE CARD (this episode's trial), four styles
// titleCard(t, { style, appear, crumble, teaser }) -> SVG for the upper third (screen space, over everything but the
// subtitle). style: "clay" (A, default) | "stone" (B) | "ink" (C) | "relief" (D); more can be added to TITLE_STYLES.
// With no appear / crumble given, the card runs its own clock from t (seconds from the video's start): in at 0.25,
// gone by 2.6 (TITLE_STYLES[style].time). appear 0..1 = the way in, crumble 0..1 = the way out (1 = nothing left).
// Hand-cut capitals: polygons on a 100-high box, wedge serifs, a few stepped shoulders from the brick gable. Not a font.
const CAPS = {
  T: [78, [[0, 0], [78, 0], [78, 30], [69, 22], [57, 22], [57, 29], [50, 29], [50, 86], [59, 100], [19, 100], [28, 86], [28, 29], [21, 29], [21, 22], [9, 22], [0, 30]]],
  H: [90, [[0, 0], [28, 0], [25, 8], [25, 40], [65, 40], [65, 8], [62, 0], [90, 0], [87, 8], [87, 92], [90, 100], [62, 100], [65, 92], [65, 58], [25, 58], [25, 92], [28, 100], [0, 100], [3, 92], [3, 8]]],
  E: [73, [[0, 0], [71, 0], [71, 28], [63, 20], [25, 20], [25, 40], [53, 40], [59, 35], [59, 63], [53, 57], [25, 57], [25, 80], [65, 80], [73, 70], [73, 100], [0, 100], [3, 92], [3, 8]]],
  G: [88, [[28, 0], [64, 0], [84, 12], [84, 32], [64, 32], [58, 21], [36, 21], [23, 34], [23, 66], [36, 79], [62, 79], [62, 62], [48, 62], [48, 46], [86, 46], [86, 100], [72, 100], [68, 91], [58, 100], [28, 100], [0, 74], [0, 26]]],
  O: [88, [[28, 1], [44, -3], [60, 1], [88, 26], [88, 74], [60, 99], [44, 103], [28, 99], [0, 74], [0, 26]], [[36, 21], [52, 21], [65, 34], [65, 66], [52, 79], [36, 79], [23, 66], [23, 34]]],
  L: [69, [[0, 0], [28, 0], [25, 8], [25, 74], [31, 74], [31, 80], [61, 80], [69, 68], [69, 100], [0, 100], [3, 92], [3, 8]]],
  M: [110, [[0, 0], [27, 0], [55, 44], [83, 0], [110, 0], [107, 8], [107, 92], [110, 100], [82, 100], [85, 92], [85, 36], [61, 74], [49, 74], [25, 36], [25, 92], [28, 100], [0, 100], [3, 92], [3, 8]]],
};
// lay out a line of capitals: returns [{ ch, d (path), x, y, w, h, i }], total width; amp = how rough the cut is
function capsLine(text, x, y, cap, o = {}) {
  const k = cap / 100, tr = (o.track ?? 12) * k, out = []; let cx = x, i = 0;
  for (const ch of text) {
    if (ch === " ") { cx += (o.space ?? 34) * k; continue; }
    const [w, outer, hole] = CAPS[ch], sd = (o.seed ?? 1) * 17 + i * 5, jy = jit(sd + 1, o.jy ?? 0), rot = jit(sd + 2, o.jr ?? 0) * Math.PI / 180;
    const map = (a) => a.map(([px, py]) => { const lx = (px - w / 2) * k, ly = (py - 50) * k; return [cx + w * k / 2 + lx * Math.cos(rot) - ly * Math.sin(rot), y + cap / 2 + jy + lx * Math.sin(rot) + ly * Math.cos(rot)]; });
    const d = wp(map(outer), sd, 2, true, o.amp ?? 1.6) + (hole ? wp(map(hole).reverse(), sd + 3, 2, true, o.amp ?? 1.6) : "");
    out.push({ ch, d, x: cx, y, w: w * k, h: cap, i }); cx += w * k + tr; i++;
  }
  return { g: out, w: cx - tr - x };
}
const capsWidth = (text, cap, o = {}) => capsLine(text, 0, 0, cap, o).w;
// handwriting: one-stroke lowercase letters (baseline 0, x-height 19), written with a pen, not a font
const HAND = {
  i: [8, "M1,-18 L1,-4 Q1,0 5,0 M1,-26.6 L1.4,-26"], t: [13, "M5,-31 L5,-4 Q5,0 10,0 M-1,-19 L11,-20"], o: [17, "M8,-19 Q0,-19 0,-9 Q0,0 8,0 Q15,0 15,-10 Q15,-19 8,-19"],
  n: [18, "M1,-19 L1,0 M1,-13 Q6,-20 11,-18 Q14,-17 14,-10 L14,-3 Q14,0 17,0"], l: [9, "M2,-35 L2,-4 Q2,0 6,0"], y: [16, "M1,-19 L1,-8 Q1,-1 7,-1 Q13,-1 13,-9 M13,-19 L13,6 Q13,14 5,13 Q1,12 -1,9"],
  r: [12, "M1,-19 L1,0 M1,-12 Q5,-20 11,-18"], e: [17, "M1,-9 L13,-10 Q13,-19 7,-19 Q0,-19 0,-9 Q0,0 8,0 Q12,0 14,-3"], s: [14, "M11,-17 Q6,-21 2,-17 Q-1,-12 6,-9 Q13,-6 10,-2 Q6,2 0,-2"],
  F: [20, "M3,-33 L3,0 M-1,-33 Q9,-36 19,-32 M3,-18 L14,-19"], d: [19, "M13,-12 Q11,-19 6,-19 Q0,-19 0,-9 Q0,0 6,0 Q11,0 13,-6 M13,-35 L13,-4 Q13,0 17,0"],
  a: [18, "M12,-12 Q10,-19 6,-19 Q0,-19 0,-9 Q0,0 6,0 Q10,0 12,-6 M12,-19 L12,-4 Q12,0 16,0"], g: [16, "M12,-12 Q10,-19 6,-19 Q0,-19 0,-9 Q0,0 6,0 Q10,0 12,-6 M12,-19 L12,6 Q12,14 5,13 Q1,12 0,9"],
  h: [18, "M1,-35 L1,0 M1,-12 Q6,-20 11,-18 Q14,-17 14,-10 L14,-3 Q14,0 17,0"], "…": [26, "M1,-1 L1.6,-0.6 M10,-1 L10.6,-0.6 M19,-1 L19.6,-0.6"], " ": [11, ""],
};
// u 0..1 writes it on from the left; returns { s, w }
function handLine(text, x, y, k, col, u = 1, sw = 2.5, seed = 1) {
  let cx = 0, s = ""; const chars = [...text], tot = chars.reduce((a, ch) => a + HAND[ch][0] + 3, 0); let acc = 0;
  for (const [i, ch] of chars.entries()) { const [w, d] = HAND[ch], a0 = acc / tot, a1 = (acc + w + 3) / tot, lu = clamp((u - a0) / (a1 - a0)); acc += w + 3;
    if (d && lu > 0) s += `<path d="${d}" pathLength="1" stroke-dasharray="${n(lu * 1.02)} 2" transform="translate(${n(cx)},${n(jit(seed + i, 1.1))}) rotate(${n(jit(seed + i * 3, 3))}) skewX(-9)"/>`; cx += w + 3; }
  return { s: `<g transform="translate(${n(x)},${n(y)}) scale(${k})" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`, w: (cx - 3) * k };
}
const handWidth = (text, k) => [...text].reduce((a, ch) => a + HAND[ch][0] + 3, -3) * k;
const TEASER = "…it only rests on Friday nights";
// a torn strip of paper (centre cx, cy)
function tornPaper(cx, cy, w, h, seed, col = "#f1e3c2", shade = "#d8c49a") {
  const p = []; const N = 9;
  for (let i = 0; i <= N; i++) p.push([cx - w / 2 + w * i / N, cy - h / 2 + jit(seed + i, 3)]);
  for (let i = 0; i <= 5; i++) p.push([cx + w / 2 + jit(seed + 20 + i, 7) + (i % 2) * 5, cy - h / 2 + h * i / 5]);
  for (let i = N; i >= 0; i--) p.push([cx - w / 2 + w * i / N, cy + h / 2 + jit(seed + 40 + i, 3.4)]);
  for (let i = 5; i >= 0; i--) p.push([cx - w / 2 + jit(seed + 60 + i, 8) - (i % 2) * 6, cy - h / 2 + h * i / 5]);
  return `<path d="${wp(p, seed, 2, true, 2.4)}" fill="${shade}" transform="translate(3,5)"/><path d="${wp(p, seed, 2, true, 2.4)}" fill="${col}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
}
const fingerprint = (x, y, r, rot, col, op = 0.6) => `<g transform="translate(${n(x)},${n(y)}) rotate(${rot})" fill="none" stroke="${col}" stroke-width="${n(Math.max(1.2, r * 0.07))}" stroke-linecap="round" opacity="${op}">` + [0.2, 0.36, 0.52, 0.68, 0.84, 1].map((f, i) => `<path d="M${n(-r * f * 0.74)},${n(r * f * 0.5)} Q${n(-r * f * 0.9)},${n(-r * f * 1.2)} ${n(r * f * 0.1)},${n(-r * f * 1.25)} Q${n(r * f * 0.95)},${n(-r * f * 1.1)} ${n(r * f * 0.76)},${n(r * f * (0.5 + (i % 2) * 0.2))}"/>`).join("") + `</g>`;

// ---- A "clay": THE GOLEM pressed into a slab of wet river clay; it cracks and falls to dust
function titleClay(t, ap, cr) {
  if (ap <= 0 || cr >= 1) return "";
  const C = CLAYC, x0 = 104, x1 = 976, y0 = 630, y1 = 818, e = ease(clamp(ap / 0.45), "out"), set = (1 - e);
  // the slab: a hand-patted strip, thick lower edge, wet highlight
  const edge = []; for (let i = 0; i <= 12; i++) edge.push([x0 + (x1 - x0) * i / 12, y0 + jit(i + 1, 7) + (i === 0 || i === 12 ? 12 : 0)]);
  edge.push([x1 + 9, (y0 + y1) / 2 + 6]); for (let i = 12; i >= 0; i--) edge.push([x0 + (x1 - x0) * i / 12, y1 + jit(i + 30, 6) - (i === 0 || i === 12 ? 12 : 0)]); edge.push([x0 - 10, (y0 + y1) / 2 - 4]);
  const sd = smooth(lumpy(edge, 3, 3));
  let art = `<path d="${sd}" fill="${C.deep}" transform="translate(4,13)"/><path d="${sd}" fill="${C.dark}" transform="translate(1,8)"/><path d="${sd}" fill="${C.base}" stroke="${INK}" stroke-width="2.4"/><clipPath id="tAs"><path d="${sd}"/></clipPath><g clip-path="url(#tAs)">`;
  art += `<path d="${smooth([[x0, y0 + 60], [x0 + 200, y1 - 50], [x0 + 520, y1 - 22], [x1 + 10, y1 - 60], [x1 + 10, y1 + 20], [x0 - 10, y1 + 20]])}" fill="${C.dark}" opacity="0.5"/><path d="${smooth([[x0 + 30, y0 + 22], [x0 + 300, y0 + 10], [x0 + 560, y0 + 18], [x0 + 500, y0 + 34], [x0 + 200, y0 + 30]])}" fill="${C.lit}" opacity="0.8"/><path d="${smooth([[x0 + 80, y0 + 16], [x0 + 230, y0 + 12], [x0 + 220, y0 + 20], [x0 + 100, y0 + 23]])}" fill="${C.wet}" opacity="0.7"/>`;
  // finger drags across it, two thumbprints, grit
  art += smear(x0 + 22, y0 + 60, 64, 28, C, 4, 9) + smear(x1 - 150, y1 - 46, 110, -6, C, 4, 8) + smear(x0 + 330, y0 + 8, 90, 4, C, 3, 7) + smear(x0 + 180, y1 - 30, 70, -10, C, 3, 7);
  art += fingerprint(x1 - 46, y0 + 44, 26, 18, C.deep, 0.55) + fingerprint(x0 + 232, y1 - 30, 21, -30, C.deep, 0.5);
  for (let i = 0; i < 16; i++) art += `<circle cx="${n(x0 + 20 + hash(i + 5) * (x1 - x0 - 40))}" cy="${n(y0 + 12 + hash(i + 25) * (y1 - y0 - 24))}" r="${n(1.6 + hash(i + 45) * 2.6)}" fill="${i % 3 ? C.dark : "#d8ccc0"}"/>`;
  art += `</g>`;
  // the letters: recessed, dark inner edge up-left, lit lip down-right; each one presses in on its own beat
  const big = 126, small = 70, gw = capsWidth("GOLEM", big, { track: 11 }), tw = capsWidth("THE", small, { track: 9 }), gap = 30, sx = 540 - (tw + gap + gw) / 2, ty = y0 + 26;
  const gl = [...capsLine("THE", sx, ty + 6, small, { track: 9, seed: 2, amp: 3, jy: 3, jr: 2 }).g, ...capsLine("GOLEM", sx + tw + gap, ty, big, { track: 11, seed: 5, amp: 3.4, jy: 4, jr: 1.6 }).g];
  gl.forEach((g, i) => { const lu = ease(clamp((ap * 1.25 - i * 0.07) / 0.45), "out"); if (lu <= 0) return; const d = lu * (g.h > 100 ? 10 : 7), id = `tA${i}`;
    art += `<path d="${g.d}" fill="${C.wet}" fill-rule="evenodd" transform="translate(${n(d * 0.34)},${n(d * 0.42)})" stroke="${C.wet}" stroke-width="${n(lu * 5)}" stroke-linejoin="round"/><path d="${g.d}" fill="${C.lit}" fill-rule="evenodd" stroke="${C.lit}" stroke-width="${n(lu * 7)}" stroke-linejoin="round" opacity="0.9"/>`;
    art += `<clipPath id="${id}"><path d="${g.d}" clip-rule="evenodd"/></clipPath><path d="${g.d}" fill="${C.deep}" fill-rule="evenodd" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><g clip-path="url(#${id})"><path d="${g.d}" fill="${mix(C.dark, C.deep, 0.25)}" fill-rule="evenodd" transform="translate(${n(d)},${n(d)})"/>${smear(g.x + g.w * 0.2, g.y + g.h * 0.55, g.w * 0.5, 80, { lit: C.dark, dark: C.deep }, 2, g.w * 0.3)}</g>`; });
  // the paper strip, held down by a pressed dab of clay
  const pu = clamp((ap - 0.5) / 0.5), py = 860, hw = handWidth(TEASER, 1.62);
  let paper = `<g transform="rotate(-1.6 540 ${py})">${tornPaper(540, py, hw + 110, 66, 9)}${handLine(TEASER, 540 - hw / 2 + 16, py + 14, 1.62, "#1c1830", 1, 2.7, 4).s}<path d="${smooth(lumpy([[540 - hw / 2 - 52, py - 26], [540 - hw / 2 - 22, py - 30], [540 - hw / 2 - 6, py - 8], [540 - hw / 2 - 16, py + 16], [540 - hw / 2 - 46, py + 20], [540 - hw / 2 - 62, py - 2]], 12, 2))}" fill="${C.base}" stroke="${INK}" stroke-width="1.8"/>${fingerprint(540 - hw / 2 - 33, py + 2, 13, 10, C.deep, 0.7)}</g>`;
  let s = "";
  if (cr <= 0) s += `<g transform="translate(0,${n(-16 * set)}) translate(540,724) scale(${n(1 + 0.06 * set)},${n(1 + 0.06 * set)}) translate(-540,-724)" opacity="${n(clamp(ap * 8))}">${art}</g>` + (pu > 0 ? `<g transform="translate(${n(-60 * (1 - ease(pu, "out")))},0)" opacity="${n(clamp(pu * 4))}">${paper}</g>` : "");
  else {
    // crumbling: the slab is cut into seeded shards (clip paths over one drawing); cracks first, then each shard drops
    const NX = 9, NY = 3, vx = (i, j) => [x0 - 20 + (x1 - x0 + 40) * i / NX + (i && i < NX ? jit(i * 7 + j * 13, 26) : 0), y0 - 24 + (y1 - y0 + 52) * j / NY + (j && j < NY ? jit(i * 11 + j * 5 + 3, 20) : 0)];
    s += `<defs><g id="tAart">${art}</g></defs>`; let cracks = "";
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const q = [vx(i, j), vx(i + 1, j), vx(i + 1, j + 1), vx(i, j + 1)], mid = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], id = `tAc${i}_${j}`, d0 = 0.1 + hash(i * 5 + j * 9) * 0.3 + (NY - 1 - j) * 0.03, u = clamp((cr - d0) / 0.5); if (u >= 1) continue;
      const pd = `M${q.map(([a, b]) => `${n(a)},${n(b)}`).join(" L")} Z`; cracks += pd;
      s += `<clipPath id="${id}"><path d="${pd}"/></clipPath><g transform="translate(${n(jit(i + j * 3 + 50, 70) * u)},${n(430 * u * u + 14 * u)}) rotate(${n(jit(i * 3 + j + 70, 60) * u)} ${n(mid[0])} ${n(mid[1])})" opacity="${n(clamp((1 - u) * 2.2))}"><g clip-path="url(#${id})"><use href="#tAart"/></g></g>`;
    }
    s += `<path d="${cracks}" fill="none" stroke="${C.deep}" stroke-width="${n(1.5 + cr * 4)}" stroke-linejoin="round" opacity="${n(clamp(cr * 9) * clamp(1.6 - cr * 3.2))}"/>`;
    for (let i = 0; i < 46; i++) { const d0 = hash(i + 300) * 0.5, u = clamp((cr - d0) / 0.5); if (u <= 0 || u >= 1) continue; const x = x0 + hash(i + 310) * (x1 - x0) + jit(i + 320, 40) * u, y = y0 + hash(i + 330) * (y1 - y0) + 380 * u * u, r = 3 + hash(i + 340) * 9; s += `<path d="${smooth(lumpy([[x - r, y], [x, y - r], [x + r, y], [x, y + r * 0.8]], i + 350, r * 0.2))}" fill="${i % 3 ? C.base : i % 2 ? C.lit : C.dark}" stroke="${INK}" stroke-width="1" opacity="${n(1 - u * u)}"/>`; }
    for (let i = 0; i < 6; i++) { const u = clamp((cr - 0.12 - i * 0.07) / 0.55); if (u <= 0 || u >= 1) continue; const x = x0 + 80 + i * 140 + jit(i + 400, 40), r = 40 + 50 * u; s += blob(x, y1 + 20 + 140 * u, r * 1.5, r * 0.7, "#f0d4b8", i + 410, { N: 11, irr: 0.2, ex: `opacity="${n(0.42 * (1 - u))}"` }); }
    const pu2 = clamp(cr / 0.75); if (pu2 < 1) s += `<g transform="translate(${n(300 * pu2 * pu2 + 30 * Math.sin(pu2 * 9))},${n(-150 * pu2 + 40 * Math.sin(pu2 * 7))}) rotate(${n(-24 * pu2 + 10 * Math.sin(pu2 * 11))} 540 ${py})" opacity="${n(clamp((1 - pu2) * 3))}">${paper}</g>`;
  }
  return s;
}
// ---- B "stone": chiselled into an old weathered plaque; the Friday sunset slides across it, then leaves it to the dark
function titleStone(t, ap, cr) {
  if (ap <= 0 || cr >= 1) return "";
  const x0 = 150, x1 = 930, y0 = 626, y1 = 896, sink = ease(clamp((cr - 0.35) / 0.65));
  const out = [[x0 + 6, y1], [x0, y0 + 60], [x0 + 26, y0 + 22], [x0 + 150, y0 + 6], [540, y0 - 2], [x1 - 160, y0 + 5], [x1 - 22, y0 + 20], [x1 - 40, y0 + 44], [x1 - 6, y0 + 58], [x1 + 2, y1 - 70], [x1 - 14, y1 - 52], [x1 - 4, y1]];
  const od = wp(out, 21, 3, true, 3.2);
  const big = 112, small = 44, gw = capsWidth("GOLEM", big, { track: 14 }), tw = capsWidth("THE", small, { track: 12 }), hw = handWidth(TEASER, 1.22);
  const gl = [...capsLine("THE", 540 - tw / 2, y0 + 26, small, { track: 12, seed: 3, amp: 2 }).g, ...capsLine("GOLEM", 540 - gw / 2, y0 + 82, big, { track: 14, seed: 7, amp: 2.2, jy: 1.5 }).g];
  // one drawing in two lights: pal = [stone, shade, light, cut dark, cut facet, moss, moss2, teaser]
  const draw = (pal, lit) => { let a = `<path d="${od}" fill="${pal[0]}"/><g clip-path="url(#tBs)">`;
    for (const [bx, by, rx, ry, k, sd] of [[250, 690, 120, 50, 1, 1], [720, 660, 150, 40, 2, 2], [560, 850, 220, 44, 1, 3], [860, 800, 70, 90, 1, 4], [200, 840, 60, 60, 2, 5], [430, 740, 90, 30, 2, 6]]) a += blob(bx, by, rx, ry, pal[k], sd + 30, { N: 11, irr: 0.25, ex: `opacity="0.4"` });
    for (let i = 0; i < 40; i++) a += `<circle cx="${n(x0 + hash(i + 60) * (x1 - x0))}" cy="${n(y0 + hash(i + 70) * (y1 - y0))}" r="${n(1 + hash(i + 80) * 2.4)}" fill="${pal[i % 2 ? 1 : 2]}" opacity="0.7"/>`;
    // moss creeping in from the lower left and along the top, lichen spots, a crack
    for (const [bx, by, rx, ry, sd] of [[x0 + 6, y1 - 4, 70, 22, 1], [x0 + 90, y1 + 6, 60, 12, 2], [x0 + 2, y1 - 110, 22, 60, 3], [x1 - 30, y1, 70, 14, 4], [x0 + 170, y0 + 8, 60, 13, 5], [x1 - 220, y0 + 6, 46, 10, 6]]) a += blob(bx, by, rx, ry, pal[5], sd + 90, { N: 13, irr: 0.3 }) + blob(bx + 8, by + 4, rx * 0.55, ry * 0.5, pal[6], sd + 96, { N: 9, irr: 0.3 });
    for (const [bx, by, r, sd] of [[x1 - 96, y0 + 96, 12, 1], [x1 - 70, y0 + 112, 7, 2], [x0 + 60, y0 + 100, 9, 3], [612, y1 - 20, 8, 4]]) a += blob(bx, by, r, r * 0.8, lit ? "#e0b860" : "#8a7a6a", sd + 110, { N: 8, irr: 0.3, ex: `opacity="0.85"` });
    a += `<path d="M${x1 - 190},${y0} l14,34 l-10,22 l18,30 l-6,18 M${x1 - 186},${y0 + 56} l-22,12" fill="none" stroke="${pal[3]}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x0 + 4},${y0 + 150} l30,10 l16,24" fill="none" stroke="${pal[3]}" stroke-width="2" stroke-linejoin="round"/>`;
    // the letters: a V-cut, shadow wall up-left, lit wall down-right, a bright arris under each stroke
    gl.forEach((g, i) => { const d = g.h > 100 ? 7 : 4, id = `tB${lit}${i}`; a += `<path d="${g.d}" fill="${pal[2]}" fill-rule="evenodd" transform="translate(${n(d * 0.4)},${n(d * 0.5)})"/><clipPath id="${id}"><path d="${g.d}" clip-rule="evenodd"/></clipPath><path d="${g.d}" fill="${pal[3]}" fill-rule="evenodd"/><g clip-path="url(#${id})"><path d="${g.d}" fill="${pal[4]}" fill-rule="evenodd" transform="translate(${d},${d})"/></g>`; });
    a += `<path d="M${n(540 - hw / 2 - 20)},${y1 - 66} L${n(540 + hw / 2 + 20)},${y1 - 68}" stroke="${pal[3]}" stroke-width="2.4" stroke-linecap="round"/>` + handLine(TEASER, 540 - hw / 2 + 12 + 1.6, y1 - 28 + 1.6, 1.22, pal[2], 1, 2.9, 6).s + handLine(TEASER, 540 - hw / 2 + 12, y1 - 28, 1.22, pal[7], 1, 2.9, 6).s;
    // chips knocked off the edge
    for (const [cx, cy, r, sd] of [[x0 + 30, y0 + 24, 16, 1], [x1 - 34, y0 + 44, 20, 2], [x1 - 4, y1 - 64, 16, 3], [x0 + 2, y1 - 30, 12, 4], [470, y0 + 2, 10, 5]]) a += blob(cx, cy, r, r * 0.7, pal[1], sd + 130, { N: 7, irr: 0.35 }) + blob(cx + 2, cy + 2, r * 0.6, r * 0.4, pal[3], sd + 136, { N: 6, irr: 0.3, ex: `opacity="0.6"` });
    return a + `</g><path d="${od}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`; };
  const dark = ["#5a4f78", "#453a66", "#74689a", "#241a40", "#3a2f5c", "#3f5a4a", "#4f6a50", "#2a2048"], sun = ["#e2ae8e", "#c08a80", "#ffe2b4", "#3a1630", "#743a4c", "#6f8f3a", "#9aae48", "#3a1630"];
  // the light: a slanted band; its leading edge crosses on the way in, its trailing edge on the way out
  const e = ease(ap), lead = lerp(x0 - 240, x1 + 260, e), trail = lerp(x0 - 300, x1 + 240, ease(clamp(cr / 0.6))), sl = 150;
  const band = `M${n(trail)},${y0 - 40} L${n(lead)},${y0 - 40} L${n(lead - sl)},${y1 + 40} L${n(trail - sl)},${y1 + 40} Z`;
  let s = `<g transform="translate(0,${n(34 * sink)})" opacity="${n(clamp(ap * 6) * (1 - sink))}"><clipPath id="tBs"><path d="${od}"/></clipPath><path d="${od}" fill="#1d0f3d" opacity="0.55" transform="translate(7,11)"/>${draw(dark, 0)}`;
  if (lead > trail) s += `<clipPath id="tBl"><path d="${band}"/></clipPath><g clip-path="url(#tBl)">${draw(sun, 1)}<path d="M${n(lead - 60 - ((t * 26) % 60))},${y0 - 40} l-60,0 l${-sl},${y1 - y0 + 80} l60,0 Z" fill="#fff1c8" opacity="0.16" style="mix-blend-mode:screen" clip-path="url(#tBs)"/></g><path d="M${n(lead)},${y0 - 40} L${n(lead - sl)},${y1 + 40}" stroke="#ffe9a8" stroke-width="3" opacity="${n(e < 1 ? 0.8 : 0)}" clip-path="url(#tBs)"/>`;
  return s + `</g>`;
}
// ---- C "ink": written with a quill in iron-gall ink on the slip itself; it leaves by being pulled up out of the frame
const QUILL = { T: [80, "M4,7 Q40,-3 78,9 M41,6 Q36,50 41,98"], H: [80, "M9,2 Q4,50 10,98 M71,2 Q76,50 70,98 M9,53 Q40,44 71,50"], E: [68, "M63,7 Q30,-1 9,6 Q4,50 10,94 Q36,101 66,91 M9,50 Q30,44 51,48"], G: [84, "M77,23 Q58,-5 30,6 Q2,22 6,56 Q10,97 44,96 Q73,94 77,58 L49,59"], O: [88, "M44,4 Q4,6 6,52 Q8,98 44,96 Q82,94 81,48 Q78,3 44,4 Q35,6 29,13"], L: [66, "M11,2 Q6,50 11,94 Q36,101 64,90"], M: [98, "M7,98 Q4,50 11,4 Q30,40 49,71 Q66,36 87,4 Q93,50 91,98"], " ": [40, ""] };
function titleInk(t, ap, cr) {
  if (ap <= 0 || cr >= 1) return "";
  const ink = "#241a36", pull = cr <= 0 ? 0 : (cr < 0.18 ? 14 * Math.sin(cr / 0.18 * Math.PI / 2) : 14 - 1400 * ease((cr - 0.18) / 0.82, "in")), cy = 760, wPap = 880, hPap = 262;
  const chars = [..."THE GOLEM"], cap = 104, k = cap / 100, tot = chars.reduce((a, ch) => a + QUILL[ch][0] + 11, -11), sx = 540 - tot * k / 2, wu = clamp(ap / 0.72);
  let s = tornPaper(540, cy, wPap, hPap, 31), acc = 0, cx = 0;
  // the paper's life: fibres, a crease, a stain of red clay on the lower edge (it has been in the mouth)
  for (let i = 0; i < 26; i++) { const x = 540 - wPap / 2 + 30 + hash(i + 500) * (wPap - 60), y = cy - hPap / 2 + 16 + hash(i + 510) * (hPap - 32), a = hash(i + 520) * 3.14, l = 6 + hash(i + 530) * 12; s += `<path d="M${n(x)},${n(y)} l${n(Math.cos(a) * l)},${n(Math.sin(a) * l)}" stroke="#c9b48a" stroke-width="1.2" stroke-linecap="round"/>`; }
  s += `<path d="${wp([[540 - wPap / 2 + 10, cy + 52], [540 - 120, cy + 60], [540 + 200, cy + 54], [540 + wPap / 2 - 10, cy + 62]], 33, 3, false, 2)}" fill="none" stroke="#d8c49a" stroke-width="2"/>`;
  s += blob(540 - wPap / 2 + 90, cy + hPap / 2 - 16, 80, 26, CLAYC.lit, 34, { N: 12, irr: 0.3, ex: `opacity="0.75"` }) + blob(540 - wPap / 2 + 70, cy + hPap / 2 - 10, 44, 14, CLAYC.base, 35, { N: 10, irr: 0.3, ex: `opacity="0.9"` }) + fingerprint(540 + wPap / 2 - 70, cy + hPap / 2 - 50, 24, 20, CLAYC.base, 0.5);
  // the title: each stroke is drawn on in order; a broad nib = the stroke twice, the thin copy shifted
  let strokes = "";
  for (const [i, ch] of chars.entries()) { const [w, d] = QUILL[ch], a0 = acc / tot, a1 = (acc + w + 11) / tot, lu = clamp((wu - a0) / (a1 - a0)); acc += w + 11;
    if (d && lu > 0) { const tf = `translate(${n(sx + cx * k)},${n(cy - hPap / 2 + 34 + jit(i + 40, 4))}) scale(${k}) rotate(${n(jit(i + 50, 2.4))} ${w / 2} 50)`, da = `pathLength="1" stroke-dasharray="${n(lu * 1.03)} 2"`; strokes += `<g transform="${tf}"><path d="${d}" ${da} stroke-width="15"/><path d="${d}" ${da} stroke-width="6" transform="translate(4.4,-4)"/><path d="${d}" ${da} stroke-width="5" transform="translate(-3.6,3.4)"/></g>`; } cx += w + 11; }
  s += `<g fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>`;
  // blots and spatter where the quill was loaded, a flourish under the word
  const bl = clamp((wu - 0.2) * 3);
  if (bl > 0) s += blob(sx - 26, cy - hPap / 2 + 60, 9 * bl, 7 * bl, ink, 41, { N: 9, irr: 0.3 }) + [[20, -8, 3], [34, 6, 2], [-6, 22, 2.4], [tot * k + 40, 70, 4], [tot * k + 54, 58, 2]].map(([dx, dy, r]) => `<circle cx="${n(sx - 26 + dx)}" cy="${n(cy - hPap / 2 + 60 + dy)}" r="${n(r * bl)}" fill="${ink}"/>`).join("");
  const fu = clamp((ap - 0.66) / 0.14); if (fu > 0) s += `<path d="M${n(sx + 10)},${cy + 30} Q${n(540 - 100)},${cy + 16} ${n(540 + 40)},${cy + 28} T${n(sx + tot * k - 20)},${cy + 22}" pathLength="1" stroke-dasharray="${n(fu * 1.02)} 2" fill="none" stroke="${ink}" stroke-width="4.6" stroke-linecap="round"/>`;
  const hk = 1.55, hw = handWidth(TEASER, hk), tu = clamp((ap - 0.74) / 0.26); if (tu > 0) s += handLine(TEASER, 540 - hw / 2 + 12, cy + hPap / 2 - 36, hk, ink, tu, 2.9, 8).s;
  return `<g transform="translate(0,${n(pull)}) rotate(${n(-2.2 + (cr > 0.18 ? (cr - 0.18) * 9 : 0))} 540 ${cy})" opacity="${n(clamp(ap * 9))}">${s}</g>`;
}
// ---- D "relief" (the lettering advisor's spec): raised terracotta capitals floating in clear sky, no slab. Teaser
// "Something walks in the attic." Centre x 500, cap height 66, top y 598, teaser baseline 701. Out: each word cracks
// in two, then everything drops behind a fixed edge at y = 710.
function titleRelief(t, ap, cr, o = {}) {
  if (ap <= 0 || cr >= 1) return "";
  const cap = 66, top = 598, face = "#F3A17E", bev = "#FFCB96", shd = "#472637", tw = capsWidth("THE GOLEM", cap, { track: 13, space: 44 }), sx = 500 - tw / 2;
  const gl = capsLine("THE GOLEM", sx, top, cap, { track: 13, space: 44, seed: 9, amp: 2.2, jy: 1.2, jr: 0.8 }).g, settle = -8 * (1 - ease(ap, "out"));
  const split = ease(clamp(cr / 0.28), "out") * 2, drop = 125 * ease(clamp((cr - 0.2) / 0.8), "in");
  const letter = (g) => { const id = `tD${g.i}`; return `<path d="${g.d}" fill="${shd}" fill-rule="evenodd" transform="translate(4,4)"/><path d="${g.d}" fill="${bev}" fill-rule="evenodd" stroke="${bev}" stroke-width="1.6" stroke-linejoin="round" transform="translate(-1.8,-1.8)"/><clipPath id="${id}"><path d="${g.d}" clip-rule="evenodd"/></clipPath><path d="${g.d}" fill="${face}" fill-rule="evenodd"/><g clip-path="url(#${id})">${g.i % 3 === 1 ? fingerprint(g.x + g.w * 0.6, g.y + g.h * 0.72, 12, 20 + g.i * 30, "#D9825F", 0.75) : ""}<path d="M${n(g.x + g.w * 0.1)},${n(g.y + g.h * (0.3 + 0.1 * (g.i % 3)))} q${n(g.w * 0.4)},${n(-3 + g.i % 2 * 5)} ${n(g.w * 0.8)},1 M${n(g.x + g.w * 0.16)},${n(g.y + g.h * (0.36 + 0.1 * (g.i % 3)))} q${n(g.w * 0.3)},${n(-2 + g.i % 2 * 4)} ${n(g.w * 0.6)},1" stroke="#E08E6A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/><circle cx="${n(g.x + g.w * hash(g.i + 3))}" cy="${n(g.y + g.h * hash(g.i + 7))}" r="1.8" fill="#C97654"/></g>`; };
  // the two words, each cut by a jagged crack through its middle
  const words = [gl.slice(0, 3), gl.slice(3)]; let s = "";
  words.forEach((wd, wi) => { const xa = wd[0].x - 10, xb = wd[wd.length - 1].x + wd[wd.length - 1].w + 12, xm = (xa + xb) / 2 + (wi ? 14 : -4), art = wd.map(letter).join(""), jag = [[xm + 5, top - 14], [xm - 6, top + 14], [xm + 7, top + 30], [xm - 5, top + 48], [xm + 4, top + 62], [xm - 3, top + 84]];
    if (cr <= 0) { s += art; return; }
    const cl = `M${xa - 10},${top - 14} L${jag.map(([a, b]) => `${n(a)},${n(b)}`).join(" L")} L${xa - 10},${top + 84} Z`, crr = `M${xb + 10},${top - 14} L${jag.map(([a, b]) => `${n(a)},${n(b)}`).join(" L")} L${xb + 10},${top + 84} Z`;
    s += `<clipPath id="tDl${wi}"><path d="${cl}"/></clipPath><clipPath id="tDr${wi}"><path d="${crr}"/></clipPath><g transform="translate(${n(-split)},${n(drop + split * 0.4)}) rotate(${n(-split * 0.35)} ${n(xm)} ${top + 80})"><g clip-path="url(#tDl${wi})">${art}</g></g><g transform="translate(${n(split)},${n(drop * (1 + 0.06 * (wi ? 1 : -1)))}) rotate(${n(split * 0.3)} ${n(xm)} ${top + 80})"><g clip-path="url(#tDr${wi})">${art}</g></g>`; });
  const tz = o.teaser ?? 1, txt = "Something walks in the attic.";
  const teaser = tz ? `<g font-family="Carlito, 'DejaVu Sans', sans-serif" font-size="36" text-anchor="middle" letter-spacing="0.6"><text x="502" y="703" fill="${shd}">${txt}</text><text x="500" y="701" fill="#F7DBBE" stroke="#F7DBBE" stroke-width="0.7">${txt}</text></g>` : "";
  return `<clipPath id="tDm"><rect x="0" y="0" width="${W}" height="710"/></clipPath><g clip-path="url(#tDm)"><g transform="translate(0,${n(settle)})">${s}</g><g transform="translate(0,${n(drop)})">${teaser}</g></g>`;
}
// the registry: add a style here ({ fn(t, appear, crumble, opts), time: { in: [a, b], out: [a, b], teaser } })
export const TITLE_STYLES = {
  clay: { fn: titleClay, time: { in: [0.25, 0.58], out: [2.02, 2.6] } },
  stone: { fn: titleStone, time: { in: [0.25, 0.75], out: [1.95, 2.6] } },
  ink: { fn: titleInk, time: { in: [0.25, 0.85], out: [2.2, 2.6] } },
  relief: { fn: titleRelief, time: { in: [0.25, 0.4], out: [2.25, 2.6], teaser: 0.48 } },
};
export function titleCard(t, o = {}) {
  const S = TITLE_STYLES[o.style || "clay"] || TITLE_STYLES.clay, T_ = S.time, own = o.appear == null && o.crumble == null;
  const ap = o.appear ?? clamp((t - T_.in[0]) / (T_.in[1] - T_.in[0])), cr = o.crumble ?? clamp((t - T_.out[0]) / (T_.out[1] - T_.out[0]));
  return S.fn(t, ap, cr, { ...o, teaser: o.teaser ?? (own && T_.teaser != null ? (t >= T_.teaser ? 1 : 0) : 1) });
}
