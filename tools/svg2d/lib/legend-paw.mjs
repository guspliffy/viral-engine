// Legend channel, "The Monkey's Paw" (W. W. Jacobs, 1902): the sets, the paw and the told-story cast, drawn in code on
// top of lib/legend.mjs (same projection P(c,X,Y,Z), same ink outline, same cm-unit characters). Design only: an episode
// picks a mood, a set, a camera and character states per shot.
//   world: metres, X right, Y up, Z into the picture. Characters: cm, feet at 0, up = -y.
//   every set takes a mood m = mood("name"); every colour goes through tone(m, col) so the whole frame follows the mood.
//   a frame needs L.defs("night") once (the hosts' flame + the soft floor shadow live there).
// Look rules (Jonny): made by hand, never glossy: flat colour, seeded wobble on every edge, irregular hand-placed
// detail, light drawn as flat stepped shapes (no gradient blobs).
import * as L from "./legend.mjs";
const { W, H, INK, P, n, lerp, clamp, hash, mix, ease, toScreen, place, shadow, limb, eye, headPath, talkMouth, blinkAmt } = L;

// ---------------------------------------------------------------- moods: a dark-to-light ramp the picture is mapped onto
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = hex(h); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
export const MOODS = {
  attic:   { ramp: ["#170824", "#3a1250", "#7b2757", "#d2651f", "#ffb63c", "#ffe9a6"], k: 0.72, kc: 0.2, g: 0.85, mul: "#ffb060", mulA: 0.16 },
  parlour: { ramp: ["#2b0c1c", "#6a1d22", "#b4441a", "#ee8a1f", "#ffc247", "#fff1b4"], k: 0.7, kc: 0.2, g: 0.8, mul: "#ffa040", mulA: 0.14 },
  paw:     { ramp: ["#07140f", "#173718", "#476a12", "#9aa915", "#dcd834", "#f8f8a4"], k: 0.82, kc: 0.42, g: 0.9, mul: "#b9d030", mulA: 0.3 },
  grief:   { ramp: ["#0a1230", "#172a63", "#2a4d97", "#5584c9", "#9cc1ec", "#e2eefc"], k: 0.84, kc: 0.4, g: 0.95, mul: "#6f9ae0", mulA: 0.3 },
  knock:   { ramp: ["#080205", "#2c050c", "#740a13", "#bd1519", "#f04a2a", "#ffb68c"], k: 0.86, kc: 0.45, g: 1.25, mul: "#d02a22", mulA: 0.36 },
  road:    { ramp: ["#080f33", "#162868", "#3355ab", "#7198dc", "#b6d1f4", "#f0f7ff"], k: 0.86, kc: 0.4, g: 1.0, mul: "#7aa0ea", mulA: 0.3 },
  blank:   { ramp: ["#060e1a", "#11263a", "#23485c", "#4f8794", "#9bc7c6", "#e2f2ea"], k: 0.9, kc: 0.5, g: 1.05, mul: "#6aa6b0", mulA: 0.4 },
};
for (const [k, v] of Object.entries(MOODS)) { v.name = k; v.light = v.ramp[4]; v.hot = v.ramp[5]; v.dark = v.ramp[0]; v.cache = new Map(); }
export const mood = (name) => MOODS[name] || MOODS.parlour;
// a blend of two moods (e.g. the attic draining to "blank" on the last line)
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

// ---------------------------------------------------------------- hand-drawn primitives
const jit = (seed, a) => (hash(seed) - 0.5) * 2 * a;
// a path through 2D points with a seeded wobble on every edge (the wobble follows the edge, so it never swims)
function wpath(p, seed = 1, k = 3, close = true, amp = 1) {
  let d = ""; const N = p.length;
  for (let i = 0; i < (close ? N : N - 1); i++) {
    const a = p[i], b = p[(i + 1) % N], len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len, A = clamp(len * 0.009 / 4) * 4 * amp;
    if (i === 0) d += `M${n(a.x)},${n(a.y)}`;
    for (let j = 1; j <= k; j++) { const u = j / k, o = j < k ? jit(seed * 13.7 + i * 7.1 + j * 3.3, A) : 0; d += `L${n(lerp(a.x, b.x, u) + nx * o)},${n(lerp(a.y, b.y, u) + ny * o)}`; }
  }
  return d + (close ? "Z" : "");
}
const vis = (c, Z) => Z - c.z > 0.3;
const zc = (c, Z) => Math.max(Z, c.z + 0.26);
const PZ = (c, X, Y, Z) => P(c, X, Y, zc(c, Z));
const pj = (c, a) => a.map(([X, Y, Z]) => PZ(c, X, Y, Z));
const LW = (s) => n(clamp(s * 0.0055, 0.9, 7));
const pg = (a, fill, ex = "") => `<polygon points="${a.map((p) => `${n(p.x)},${n(p.y)}`).join(" ")}" fill="${fill}" ${ex}/>`;
const off = (q) => q.every((p) => p.x < -80) || q.every((p) => p.x > W + 80) || q.every((p) => p.y < -80) || q.every((p) => p.y > H + 80);
// an outlined, wobbly face from projected points
function sh(q, fill, seed, o = {}) {
  if (off(q)) return "";
  return `<path d="${wpath(q, seed, o.k ?? 3, true, o.amp ?? 1)}" fill="${fill}" stroke="${o.stroke ?? INK}" stroke-width="${o.lw ?? LW(q[0].s)}" stroke-linejoin="round" ${o.ex || ""}/>`;
}
const face = (c, a3, fill, seed, o) => sh(pj(c, a3), fill, seed, o);
// an ink line through 3D points
function ln3(c, a3, col, w, seed = 1, ex = "") { const q = pj(c, a3); if (off(q)) return ""; return `<path d="${wpath(q, seed, 2, false)}" fill="none" stroke="${col}" stroke-width="${n(Math.max(0.7, w * q[0].s))}" stroke-linecap="round" stroke-linejoin="round" ${ex}/>`; }
// a plane: (u, v) -> screen, from an origin and two axis vectors
const pl = (c, O, U, V) => (u, v) => PZ(c, O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v, O[2] + U[2] * u + V[2] * v);
const pq = (f, u0, u1, v0, v1) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)];
// a box: only the faces the camera can see; cols = [front, top, side]
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
function pool(cx, cy, rx, ry, col, op, seed, steps = 3, t = 0) {
  let s = "";
  for (let k = 0; k < steps; k++) {
    const f = 1 - k * (0.62 / steps), pts = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 1 + jit(seed + i * 3 + k * 31 + Math.floor(t * 6) * 0.37, 0.07); pts.push({ x: cx + Math.cos(a) * rx * f * r, y: cy + Math.sin(a) * ry * f * r }); }
    s += `<path d="${wpath(pts, seed + k, 1)}" fill="${col}" opacity="${n(op)}" style="mix-blend-mode:screen"/>`;
  }
  return s;
}
// floorboards running into the picture
function boards(c, m, x0, x1, z0, z1, cols, seed, bw = 0.3) {
  let s = "", i = 0;
  for (let x = x0; x < x1 - 0.01; i++) {
    const w = Math.min(x1 - x, bw * (0.8 + 0.45 * hash(i + seed))), col = tone(m, mix(cols[0], cols[1], hash(i * 3 + seed)));
    const q = pj(c, [[x, 0, z1], [x + w, 0, z1], [x + w, 0, z0], [x, 0, z0]]);
    s += pg(q, col, `stroke="${tone(m, cols[2])}" stroke-width="${LW(q[0].s)}"`);
    // butt joints, nails and a line of grain per board
    for (let k = 0; k < 2; k++) {
      const z = lerp(z0, z1, hash(i * 7 + k * 13 + seed)); if (!vis(c, z)) continue;
      s += ln3(c, [[x, 0, z], [x + w, 0, z]], tone(m, cols[2]), 0.006, i + k);
      const a = PZ(c, x + w * 0.2, 0, z + 0.04), b = PZ(c, x + w * 0.8, 0, z + 0.04);
      s += `<circle cx="${n(a.x)}" cy="${n(a.y)}" r="${n(a.s * 0.006)}" fill="${tone(m, cols[2])}"/><circle cx="${n(b.x)}" cy="${n(b.y)}" r="${n(b.s * 0.006)}" fill="${tone(m, cols[2])}"/>`;
    }
    const gz = lerp(z0, z1, 0.2 + 0.5 * hash(i + 90 + seed)), gl = 0.5 + hash(i + 70) * 1.2;
    if (vis(c, gz)) s += ln3(c, [[x + w * 0.5, 0, gz], [x + w * (0.4 + 0.2 * hash(i)), 0, gz + gl * 0.5], [x + w * 0.55, 0, gz + gl]], tone(m, mix(cols[0], cols[2], 0.5)), 0.004, i + 5);
    if (hash(i * 5 + seed) > 0.72 && vis(c, gz - 0.3)) { const k = PZ(c, x + w * 0.5, 0, gz - 0.3); s += `<ellipse cx="${n(k.x)}" cy="${n(k.y)}" rx="${n(k.s * 0.03)}" ry="${n(k.s * 0.012)}" fill="none" stroke="${tone(m, cols[2])}" stroke-width="${n(k.s * 0.005)}"/><ellipse cx="${n(k.x)}" cy="${n(k.y)}" rx="${n(k.s * 0.012)}" ry="${n(k.s * 0.005)}" fill="${tone(m, cols[2])}"/>`; }
    x += w;
  }
  return s;
}
// cobbles: rows of uneven stones; xa/xb = the edges at depth z; lit(x, z) 0..1 lifts a stone toward cols[2]
function cobbles(c, m, xa, xb, z0, z1, cols, seed, lit) {
  let s = "", row = 0;
  for (let z = z0; z < z1; row++) {
    const dz = 0.13 + z * 0.06, zz = z; z += dz;
    if (zz < c.z + 0.3) continue;
    const a = xa(zz), b = xb(zz), o = hash(row + seed) * 0.3;
    for (let x = a - o, j = 0; x < b; j++) {
      const sw = 0.22 + 0.2 * hash(row * 17 + j + seed), g = 0.012 + 0.0025 * zz, x0 = Math.max(a, x + g), x1 = Math.min(b, x + sw - g); x += sw;
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
// individual dust motes drifting in a light (lp = the light on screen {x, y}); each has its own size, path and flicker
export function dust(c, t, m, lp, o = {}) {
  let s = ""; const N = o.n ?? 46, R = o.r ?? 520;
  for (let i = 0; i < N; i++) {
    const a = hash(i + 3) * Math.PI * 2 + t * 0.05 * (hash(i + 8) - 0.5), r = R * Math.sqrt(hash(i + 11)) * (0.2 + 0.8 * hash(i + 5));
    const x = lp.x + Math.cos(a) * r + 14 * Math.sin(t * (0.3 + hash(i) * 0.5) + i), y = lp.y + Math.sin(a) * r * 0.9 + 40 - ((t * (5 + 9 * hash(i + 2)) + hash(i + 30) * 80) % 80) + 10 * Math.sin(t * 0.7 + i * 2);
    const near = clamp(1 - r / R), sz = 1.6 + 3.4 * hash(i + 17) ** 2, tw = 0.6 + 0.4 * Math.sin(t * (1 + hash(i + 4) * 2) + i * 5);
    s += `<path d="M${n(x - sz)},${n(y)} L${n(x)},${n(y - sz * 0.7)} L${n(x + sz * 0.8)},${n(y + sz * 0.2)} L${n(x - sz * 0.1)},${n(y + sz * 0.7)} Z" fill="${i % 4 ? m.hot : m.light}" opacity="${n((0.18 + 0.6 * near) * tw * (o.k ?? 1))}"/>`;
  }
  return s;
}
// the candle's light on the room: flat stepped rings around a screen point (the jar from keeper().jar)
export const candleLight = (lp, m, k = 1, t = 0) => k <= 0.01 ? "" : pool(lp.x, lp.y, 620 * (0.8 + 0.2 * k), 560 * (0.8 + 0.2 * k), m.ramp[3], 0.1 * k * (1 + 0.08 * Math.sin(t * 19)), 77, 3, t);
// a cobweb in a corner: spokes from (x, y) across an angle, sagging threads between them
function cobweb(x, y, r, a0, a1, seed, col, lw = 1) {
  let s = ""; const N = 5, sp = [];
  for (let i = 0; i <= N; i++) { const a = lerp(a0, a1, i / N) + jit(seed + i, 0.05), rr = r * (0.75 + 0.3 * hash(seed + i * 3)); sp.push([Math.cos(a), Math.sin(a), rr]); s += `M${n(x)},${n(y)} L${n(x + Math.cos(a) * rr)},${n(y + Math.sin(a) * rr)}`; }
  for (let k = 1; k <= 4; k++) for (let i = 0; i < N; i++) {
    if (hash(seed + k * 9 + i) > 0.86) continue;   // a torn thread
    const f = k / 4.4, A = sp[i], B = sp[i + 1], ax = x + A[0] * A[2] * f, ay = y + A[1] * A[2] * f, bx = x + B[0] * B[2] * f, by = y + B[1] * B[2] * f;
    s += `M${n(ax)},${n(ay)} Q${n((ax + bx) / 2 + (x - (ax + bx) / 2) * 0.16)},${n((ay + by) / 2 + (y - (ay + by) / 2) * 0.16 + r * 0.02)} ${n(bx)},${n(by)}`;
  }
  return `<path d="${s}" fill="none" stroke="${col}" stroke-width="${n(lw)}" opacity="0.55" stroke-linecap="round"/>`;
}

// ---------------------------------------------------------------- the paw (hero prop)
// Local units cm, origin at the wrist (where a hand grips it), fingers up. Three fingers = three wishes: st.fingers 0..3
// curls them down one by one (the one by the thumb first), st.twist 0..1 writhes it like a snake (needs t), st.glow 0..1
// turns it sickly green-gold with a hand-cut flare behind it. About 26 cm tip to stump at size 1 (bigger than life on
// purpose, so it reads on a phone).
const PAWC = { skin: "#70492a", lit: "#9a6b3a", dark: "#452a1a", fur: "#2c1b13", claw: "#1b1310", tip: "#cdb98e", string: "#d2be90", tag: "#ead9a8" };
export function pawG(st = {}, t = 0) {
  const f = st.fingers || 0, tw = st.twist || 0, gl = st.glow || 0, m = st.m;
  const G = (col) => { let v = gl > 0 ? mix(col, "#b4c42c", gl * 0.4) : col; return m ? tone(m, v, m.kc) : v; };
  const wr = (i, sp = 11) => tw * Math.sin(t * sp + i * 1.9);
  const rad = Math.PI / 180;
  let back = "", s = "";
  if (gl > 0.02) {   // a flare cut out of paper: two spiky stars that jump on twos
    const ph = Math.floor(t * 8);
    for (let k = 0; k < 2; k++) {
      const pts = [];
      for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + k * 0.14 + ph * 0.05, r = (i % 2 ? 8 : 13 + 6 * hash(i * 7 + ph + k * 5)) * (1 - k * 0.32) * (0.6 + 0.4 * gl); pts.push(`${n(Math.cos(a) * r)},${n(-6 + Math.sin(a) * r * 1.15)}`); }
      back += `<polygon points="${pts.join(" ")}" fill="${k ? "#f3f08c" : "#bccb22"}" opacity="${n((k ? 0.5 : 0.42) * gl)}" stroke="none"/>`;
    }
    for (let i = 0; i < 7; i++) { const a = hash(i + ph * 0.13) * 6.28, r = 13 + 8 * hash(i * 3 + ph); back += `<path d="M${n(Math.cos(a) * r)},${n(-6 + Math.sin(a) * r)} l${n(Math.cos(a) * 3)},${n(Math.sin(a) * 3)}" stroke="#f3f08c" stroke-width="0.9" opacity="${n(gl * 0.9)}" stroke-linecap="round"/>`; }
  }
  // the dried forearm stump, ragged where it was cut, with stiff tufts of fur
  const bw = wr(5, 9) * 1.6;
  s += `<path d="M-3.1,0.4 Q${n(-3.6 + bw)},5 -2.7,9.2 L-1.9,10.6 L-1,9.4 L-0.2,11 L0.8,9.5 L1.7,10.5 L2.6,9 Q${n(3.5 + bw)},5 3.1,0.4 Z" fill="${G(PAWC.dark)}"/>`;
  s += `<path d="M-2.2,2.5 l-1.9,1.5 M-2.6,5.2 l-1.7,1.6 M2.3,3 l1.8,1.3 M2.7,6 l1.5,1.7 M-0.6,4 l-0.4,2.2 M1,5.5 l0.5,2 M-1.5,7 l-0.6,1.6" stroke="${G(PAWC.fur)}" stroke-width="0.7" stroke-linecap="round" fill="none"/>`;
  // everything above the wrist writhes
  let up = "";
  up += `<path d="M-4.7,-7.4 Q-5.6,-3.2 -3.2,0.6 L3.2,0.6 Q5.8,-2 5,-7 Q0.4,-9.2 -4.7,-7.4 Z" fill="${G(PAWC.skin)}"/>`;
  up += `<path d="M-3.4,-6.2 Q-1.6,-7.4 0.2,-6.2 Q0.6,-4.2 -1.4,-3.6 Q-3.6,-4 -3.4,-6.2 Z M1.2,-5.6 Q3.2,-6.6 4,-4.8 Q3.6,-3 2,-3.2 Q0.9,-4 1.2,-5.6 Z" fill="${G(PAWC.lit)}" stroke="none"/>`;
  up += `<path d="M-3.8,-2.6 Q-0.6,-1.2 3.6,-2.9 M-3,-1 Q0,0 2.9,-1.2 M-0.8,-3.4 Q-0.2,-2.4 -0.9,-1.4 M-4.2,-5 l1.1,0.5 M4.3,-4 l-1,0.6" stroke="${G(PAWC.dark)}" stroke-width="0.55" fill="none" stroke-linecap="round"/>`;
  const fingers = [[-3.1, -7.1, 7.6, -15, 2], [-0.1, -8.1, 8.9, -3, 1], [2.9, -7.3, 7.3, 11, 0]];
  const one = ([bx, by, Ln, a0, ord], i) => {
    const cu = ease(clamp(f - ord)), segs = [0.42, 0.33, 0.27], ws = [3.1, 2.6, 2.1];
    const ang = [a0 + cu * 72 + wr(i, 13) * 16, a0 + 10 + cu * 158 + wr(i + 3, 15) * 30, a0 + 26 + cu * 236 + wr(i + 6, 17) * 46];
    const pts = [[bx, by]]; ang.forEach((a, k) => { const q = pts[k]; pts.push([q[0] + Math.sin(a * rad) * Ln * segs[k], q[1] - Math.cos(a * rad) * Ln * segs[k]]); });
    let o = "";
    for (let k = 0; k < 3; k++) o += `<path d="M${n(pts[k][0])},${n(pts[k][1])} L${n(pts[k + 1][0])},${n(pts[k + 1][1])}" stroke="${INK}" stroke-width="${ws[k] + 1.3}" stroke-linecap="round" fill="none"/>`;
    for (let k = 0; k < 3; k++) o += `<path d="M${n(pts[k][0])},${n(pts[k][1])} L${n(pts[k + 1][0])},${n(pts[k + 1][1])}" stroke="${G(k === 2 ? mix(PAWC.skin, PAWC.dark, 0.35) : PAWC.skin)}" stroke-width="${ws[k]}" stroke-linecap="round" fill="none"/>`;
    // swollen knuckles with two creases each
    for (let k = 1; k < 3; k++) {
      const a = (ang[k - 1] + ang[k]) / 2 * rad, cx = Math.cos(a), cy = Math.sin(a), [x, y] = pts[k], w = ws[k] * 0.52;
      o += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(ws[k - 1] * 0.56)}" fill="${G(PAWC.lit)}" stroke="none"/>`;
      o += `<path d="M${n(x - cx * w)},${n(y - cy * w)} L${n(x + cx * w)},${n(y + cy * w)} M${n(x - cx * w * 0.8 + cy * 0.8)},${n(y - cy * w * 0.8 - cx * 0.8)} L${n(x + cx * w * 0.8 + cy * 0.8)},${n(y + cy * w * 0.8 - cx * 0.8)}" stroke="${G(PAWC.dark)}" stroke-width="0.5" fill="none" stroke-linecap="round"/>`;
    }
    // the claw: a dark hooked nail with a pale tip
    const a = ang[2] * rad, dx = Math.sin(a), dy = -Math.cos(a), [x, y] = pts[3], px = -dy, py = dx;
    o += `<path d="M${n(x - px * 1)},${n(y - py * 1)} Q${n(x + dx * 2.2 - px * 0.6)},${n(y + dy * 2.2 - py * 0.6)} ${n(x + dx * 3.6 + px * 1.5)},${n(y + dy * 3.6 + py * 1.5)} Q${n(x + dx * 1.4 + px * 1.3)},${n(y + dy * 1.4 + py * 1.3)} ${n(x + px * 1)},${n(y + py * 1)} Z" fill="${G(PAWC.claw)}"/>`;
    o += `<path d="M${n(x + dx * 2.5 + px * 0.6)},${n(y + dy * 2.5 + py * 0.6)} L${n(x + dx * 3.5 + px * 1.45)},${n(y + dy * 3.5 + py * 1.45)}" stroke="${G(PAWC.tip)}" stroke-width="0.6" stroke-linecap="round"/>`;
    return [cu, o];
  };
  const fs = fingers.map(one).sort((a, b) => a[0] - b[0]);
  up += fs.map((x) => x[1]).join("");
  // the thumb: a short crooked stub
  const ta = 62 + wr(9, 12) * 22, tb = 28 + wr(10, 14) * 30, t0 = [4.7, -3.2], t1 = [t0[0] + Math.sin(ta * rad) * 3.6, t0[1] - Math.cos(ta * rad) * 3.6], t2 = [t1[0] + Math.sin(tb * rad) * 2.8, t1[1] - Math.cos(tb * rad) * 2.8];
  up += `<path d="M${n(t0[0])},${n(t0[1])} L${n(t1[0])},${n(t1[1])} L${n(t2[0])},${n(t2[1])}" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M${n(t0[0])},${n(t0[1])} L${n(t1[0])},${n(t1[1])} L${n(t2[0])},${n(t2[1])}" stroke="${G(PAWC.skin)}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  up += `<path d="M${n(t2[0] - 0.9)},${n(t2[1] + 0.3)} Q${n(t2[0] + 0.6)},${n(t2[1] - 2.4)} ${n(t2[0] + 2.2)},${n(t2[1] - 2.6)} Q${n(t2[0] + 1.6)},${n(t2[1] - 0.6)} ${n(t2[0] + 0.9)},${n(t2[1] + 0.5)} Z" fill="${G(PAWC.claw)}"/>`;
  s += `<g transform="rotate(${n(wr(0, 9) * 15)} 0 1)">${up}</g>`;
  // faded string, knotted twice round the wrist, and a little paper tag
  const sway = Math.sin(t * 1.3) * 5 + wr(2, 8) * 20;
  s += `<path d="M-3.5,1 Q0,2.2 3.5,0.8 M-3.5,2.3 Q0,3.4 3.6,2.1" stroke="${G(PAWC.string)}" stroke-width="0.9" fill="none" stroke-linecap="round"/><circle cx="-3.3" cy="1.7" r="1.05" fill="${G(PAWC.string)}"/><path d="M-3.6,2.4 l-1.4,2.3 M-3,2.6 l0.3,2.2" stroke="${G(PAWC.string)}" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  s += `<g transform="translate(-3.6,2) rotate(${n(24 + sway)})"><path d="M0,0 Q-1.6,3 -0.6,5.6" stroke="${G(PAWC.string)}" stroke-width="0.6" fill="none"/><g transform="translate(-0.6,5.6) rotate(-8)"><path d="M-2.3,0 L1.2,-0.5 L2.4,0.6 L2.6,5.7 L0.9,6.4 L0.2,5.6 L-2.6,6 Z" fill="${G(PAWC.tag)}"/><circle cx="0.1" cy="1.1" r="0.55" fill="${G("#7a6238")}" stroke="none"/><path d="M-1.6,2.6 l3.2,-0.3 M-1.7,3.7 l2.3,-0.1 M-1.6,4.7 l3,-0.4" stroke="${G("#6a5230")}" stroke-width="0.4" fill="none"/><path d="M1.6,3.2 q0.5,0.6 0.9,0.1" stroke="${G("#a8623a")}" stroke-width="0.4" fill="none"/></g></g>`;
  return { back, s };
}
// the paw on screen: k = px per cm
export function pawAt(x, y, k, st = {}, t = 0) {
  const g = pawG(st, t);
  return `<g class="ol" transform="translate(${n(x)},${n(y)}) rotate(${n(st.rot ?? -8)}) scale(${k.toFixed(4)})">${g.back}${g.s}</g>`;
}
// the paw in the world: st = { fingers 0..3, twist 0..1, glow 0..1, size (1), rot deg, lying 0|1 (a floor shadow), m }
export function paw(c, X, Y, Z, st = {}, t = 0) {
  if (!vis(c, Z)) return "";
  const p = P(c, X, Y, Z), k = p.s / 100 * (st.size ?? 1);
  return (st.lying ? `<ellipse cx="${n(p.x)}" cy="${n(p.y + 1.5 * k)}" rx="${n(13 * k)}" ry="${n(3 * k)}" fill="${INK}" opacity="0.4"/>` : "") + pawAt(p.x, p.y, k, st, t);
}
// the kid host's left hand on screen (legend.mjs kid(), same numbers), so the paw can sit in it: { x, y, k }
export function kidHand(c, st) {
  const p = P(c, st.X, 0, st.Z), S = 0.8, DY = 78 * (1 - 0.74), r = st.reachL || 0;
  const q = toScreen(p, st.lean || 0, lerp(-16, -36, r) * S, (lerp(-80, -108, r) + DY + 5) * S - (st.hop || 0));
  return { x: q.x, y: q.y, k: p.s / 100 };
}

// ---------------------------------------------------------------- the son's flat cap, dropped on the ground
// st = { size (1 = 30 cm), rot, m }
export function flatCap(c, X, Y, Z, st = {}) {
  if (!vis(c, Z)) return "";
  const p = P(c, X, Y, Z), k = p.s / 100 * (st.size ?? 1), m = st.m, T = (col) => m ? tone(m, col, m.k * 0.6) : col;
  let s = `<ellipse cx="0" cy="1.5" rx="19" ry="4" fill="${INK}" opacity="0.4" stroke="none"/>`;
  s += `<path d="M-15,0 Q-17,-6 -9,-9 Q0,-12.5 9,-9.5 Q16,-7 15.5,-1 Q8,2.6 -2,2.4 Q-10,2.2 -15,0 Z" fill="${T("#6f6d48")}"/>`;
  s += `<path d="M-15,0 Q-10,2.2 -2,2.4 Q8,2.6 15.5,-1 Q20,0.4 19,3 Q8,6.4 -4,5.4 Q-13,4.2 -15,0 Z" fill="${T("#55532f")}"/>`;
  s += `<path d="M-13,-3 Q0,-7 14,-4 M-8,-8 Q-6,-3 -7,1.5 M1,-10.5 Q3,-4 2,2 M9,-9 Q11,-4 10.5,0.5" stroke="${T("#4a4828")}" stroke-width="0.6" fill="none"/>`;
  for (let i = 0; i < 16; i++) { const x = -12 + hash(i + 2) * 24, y = -8 + hash(i + 9) * 8; s += `<path d="M${n(x)},${n(y)} l1.3,-1.2 l1.2,1.3" stroke="${T(i % 3 ? "#8b8960" : "#3f3d22")}" stroke-width="0.45" fill="none"/>`; }
  s += `<circle cx="0.5" cy="-10.4" r="1.3" fill="${T("#55532f")}"/><path d="M-11,2.6 q3,1.6 6,0.6 M6,4 q3,0.4 5,-0.8" stroke="${T("#2c2a18")}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  return `<g class="ol" transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(st.rot ?? -6)}) scale(${k.toFixed(4)})">${s}</g>`;
}

// ---------------------------------------------------------------- shared set pieces
// a flat upright prop drawn in cm like a character (feet at 0, up = -y), outlined by the .ol class
const spr = (c, X, Y, Z, body, rot = 0) => vis(c, Z) ? `<g class="ol" transform="${place(P(c, X, Y, Z), rot)}">${body}</g>` : "";
// a papered wall on a plane f(u, v) (metres): stripes, a hand-stamped sprig pattern, dado, wainscot, picture rail
function wallpaper(c, m, f, u0, u1, cols, seed, o = {}) {
  const C = (k) => tone(m, k), top = o.top ?? 2.7, dado = o.dado ?? 0.95, rail = o.rail ?? 2.28;
  if (u1 <= u0) return "";
  let s = sh(pq(f, u0, u1, top, 0), C(cols[0]), seed);
  for (let u = Math.ceil(u0 / 0.3) * 0.3, i = Math.round(u / 0.3); u < u1; u += 0.3, i++) {
    s += pg(pq(f, u, Math.min(u + 0.14, u1), rail, dado), C(cols[1]));
    for (let v = dado + 0.16 + (i & 1) * 0.17, j = 0; v < rail - 0.08; v += 0.34, j++) {
      const id = seed + i * 13 + j * 7, uu = u + 0.22 + jit(id, 0.012), vv = v + jit(id + 1, 0.012), r = 0.047 * (0.85 + 0.3 * hash(id + 2));
      if (hash(id + 3) > 0.93 || uu + r > u1) continue;
      const a = f(uu, vv + r), b = f(uu + r * 0.72, vv), d = f(uu, vv - r), e = f(uu - r * 0.72, vv), l1 = f(uu - r * 1.2, vv - r * 1.5), l2 = f(uu + r * 1.2, vv - r * 1.5), dt = f(uu, vv + r * 1.7);
      s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)} L${n(d.x)},${n(d.y)} L${n(e.x)},${n(e.y)} Z M${n(d.x)},${n(d.y)} Q${n(e.x)},${n(d.y)} ${n(l1.x)},${n(l1.y)} M${n(d.x)},${n(d.y)} Q${n(b.x)},${n(d.y)} ${n(l2.x)},${n(l2.y)}" fill="${C(cols[2])}" stroke="${C(cols[2])}" stroke-width="${n(a.s * 0.006)}" opacity="${n(0.55 + 0.45 * hash(id + 4))}"/><circle cx="${n(dt.x)}" cy="${n(dt.y)}" r="${n(a.s * 0.009)}" fill="${C(cols[2])}"/>`;
    }
  }
  // a damp stain, a peeled corner and a crack: put by hand, different on every wall
  const su = lerp(u0, u1, 0.2 + 0.6 * hash(seed + 40)), q0 = f(su, rail - 0.05);
  if (su + 0.4 < u1) {
    s += `<path d="${wpath([f(su, rail - 0.02), f(su + 0.36, rail - 0.02), f(su + 0.3, rail - 0.3), f(su + 0.16, rail - 0.46), f(su + 0.05, rail - 0.25)], seed + 41, 2)}" fill="${C(mix(cols[0], "#000000", 0.22))}" opacity="0.5"/>`;
    const pu = lerp(u0, u1 - 0.3, hash(seed + 44)), a = f(pu, dado + 0.07), b = f(pu + 0.16, dado + 0.07), d = f(pu + 0.04, dado + 0.26);
    s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)} L${n(d.x)},${n(d.y)} Z" fill="${C("#d9c9a8")}" stroke="${INK}" stroke-width="${LW(q0.s) * 0.6}"/>`;
  }
  const cu = lerp(u0, u1, hash(seed + 47)), k0 = f(cu, top - 0.02), k1 = f(cu + 0.05, top - 0.22), k2 = f(cu - 0.03, top - 0.3), k3 = f(cu + 0.04, top - 0.52), k4 = f(cu + 0.14, top - 0.3);
  s += `<path d="M${n(k0.x)},${n(k0.y)} L${n(k1.x)},${n(k1.y)} L${n(k2.x)},${n(k2.y)} L${n(k3.x)},${n(k3.y)} M${n(k1.x)},${n(k1.y)} L${n(k4.x)},${n(k4.y)}" fill="none" stroke="${C(mix(cols[0], "#000000", 0.45))}" stroke-width="${n(Math.max(0.8, k0.s * 0.004))}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += sh(pq(f, u0, u1, top, rail), C(mix(cols[0], "#ffffff", 0.14)), seed + 5) + sh(pq(f, u0, u1, rail + 0.03, rail - 0.03), C(cols[4]), seed + 6);
  s += sh(pq(f, u0, u1, dado, 0), C(cols[3]), seed + 7);
  for (let u = Math.ceil(u0 / 0.3) * 0.3; u < u1; u += 0.3) { const a = f(u + 0.02, dado - 0.1), b = f(u + 0.02 + jit(u * 9 + seed, 0.01), 0.16); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${C(mix(cols[3], "#000000", 0.4))}" stroke-width="${n(Math.max(0.8, a.s * 0.006))}" stroke-linecap="round"/>`; }
  s += sh(pq(f, u0, u1, dado + 0.03, dado - 0.04), C(cols[4]), seed + 8) + sh(pq(f, u0, u1, 0.13, 0), C(mix(cols[3], "#000000", 0.28)), seed + 9);
  return s;
}
// a room shell: ceiling, side walls, floor; returns the pieces so a set can order them
function shell(c, m, hw, top, zb, cols, seed) {
  const C = (k) => tone(m, k), zn = c.z + 0.26, cc = mix(cols[0], "#120810", 0.84);
  let s = `<rect width="${W}" height="${H}" fill="${C(cc)}"/>`;
  s += face(c, [[-hw, top, zn], [hw, top, zn], [hw, top, zb], [-hw, top, zb]], C(cc), seed + 20);
  // joists across the ceiling, a crack in the plaster between them
  for (let z = zb - 0.5, i = 0; z > zn + 0.2; z -= 0.82, i++) s += box(c, -hw, hw, top - 0.13, top, z, z + 0.14, [C(mix(cols[0], "#120810", 0.74)), C(cc), C(mix(cols[0], "#120810", 0.92))], seed + 22 + i);
  s += ln3(c, [[-hw * 0.5, top - 0.002, zb - 0.1], [-hw * 0.38, top - 0.002, zb - 0.9], [-hw * 0.46, top - 0.002, zb - 1.5], [-hw * 0.2, top - 0.002, zb - 2.3]], C(mix(cols[0], "#120810", 0.6)), 0.006, seed + 30);
  return s;
}

// ---------------------------------------------------------------- the attic (host frame)
// Room: X -2.5..2.5, knee walls 0.9 m, ridge 3.3 m, gable wall at Z 6.6. The hosts stand around Z 3..4.
// st = { light: {x, y} screen point of the candle (keeper().jar) for the dust, dust: 0..1 }
export const ATTIC = { back: 6.6, ridge: 3.3, kid: { X: -0.25, Z: 4.0 }, keeper: { X: 0.55, Z: 3.5 }, trunk: { X: -1.5, Z: 5.55 }, shelf: { X: 1.3, Y: 1.02, Z: 6.3 }, window: { X: -0.2, Y: 2.2 } };
const jar = (x, w, h, col, fill, lab, seed) => `<path d="M${x - w / 2},0 L${x - w / 2},${-h + 2} Q${x - w / 2},${-h} ${x - w / 2 + 2},${-h} L${x + w / 2 - 2},${-h} Q${x + w / 2},${-h} ${x + w / 2},${-h + 2} L${x + w / 2},0 Z" fill="${col}"/><path d="M${x - w / 2 + 0.8},-0.6 L${x - w / 2 + 0.8},${n(-h * fill)} Q${x},${n(-h * fill - 1.2)} ${x + w / 2 - 0.8},${n(-h * fill + 0.6)} L${x + w / 2 - 0.8},-0.6 Z" fill="${lab[0]}" stroke="none"/><path d="M${x - w / 2 - 0.6},${-h} L${x + w / 2 + 0.6},${-h} L${x + w / 2 + 0.4},${-h - 2.4} L${x - w / 2 - 0.4},${-h - 2.4} Z" fill="${lab[1]}"/><path d="M${x - w / 2 + 1.2},${n(-h * 0.62)} L${x + w / 2 - 1.6},${n(-h * 0.62 - 0.5)} L${x + w / 2 - 1.4},${n(-h * 0.3)} L${x - w / 2 + 1.4},${n(-h * 0.28)} Z" fill="${lab[2]}" stroke-width="0.3"/><path d="M${x - w / 2 + 2.4},${n(-h * 0.5)} l${n(w * 0.45)},-0.3 M${x - w / 2 + 2.4},${n(-h * 0.4)} l${n(w * 0.3)},0" stroke="${INK}" stroke-width="0.35" fill="none"/><path d="M${x - w / 2 + 1.3},${-h + 3} L${x - w / 2 + 1.3},-3" stroke="#ffffff" stroke-width="0.7" opacity="0.35" fill="none"/>`;
export function attic(c, t, m, st = {}) {
  const C = (col, k) => tone(m, col, k), zb = ATTIC.back, zn = c.z + 0.26, rg = ATTIC.ridge;
  let s = `<rect width="${W}" height="${H}" fill="${C("#241528")}"/>`;
  const wood = ["#8b5a38", "#73482c", "#2e1a14"];
  // the two roof slopes with their boards
  for (const sd of [-1, 1]) {
    s += face(c, [[sd * 2.5, 0.9, zn], [sd * 2.5, 0.9, zb], [0, rg, zb], [0, rg, zn]], C(sd < 0 ? "#553828" : "#4a3024"), 11 + sd);
    for (let k = 1; k < 6; k++) { const u = k / 6 + jit(k + sd * 3, 0.02); s += ln3(c, [[sd * 2.5 * (1 - u), 0.9 + (rg - 0.9) * u, zn + 0.2], [sd * 2.5 * (1 - u), 0.9 + (rg - 0.9) * u, zb]], C("#2e1a14"), 0.008, k + sd * 5); }
  }
  // the gable wall: old plaster, cracked, a patch fallen off the bricks
  const gw = pj(c, [[-2.5, 0, zb], [-2.5, 0.9, zb], [0, rg, zb], [2.5, 0.9, zb], [2.5, 0, zb]]);
  s += sh(gw, C("#b98d68"), 21);
  const G = pl(c, [0, 0, zb], [1, 0, 0], [0, 1, 0]);
  s += `<path d="${wpath([G(-2.5, 0), G(-2.5, 0.5), G(-1.6, 0.34), G(-0.4, 0.42), G(0.4, 0.3), G(2.5, 0.46), G(2.5, 0)], 23, 3)}" fill="${C("#8a6248")}" opacity="0.7"/>`;
  s += sh([G(-1.25, 1.62), G(-0.92, 1.7), G(-0.62, 1.58), G(-0.55, 1.3), G(-0.8, 1.16), G(-1.18, 1.22), G(-1.3, 1.4)], C("#7a3a2a"), 25, { k: 2 });
  for (const [bx, by, bw] of [[-1.2, 1.5, 0.24], [-0.93, 1.5, 0.26], [-1.12, 1.38, 0.25], [-0.84, 1.38, 0.22], [-1.16, 1.26, 0.22], [-0.9, 1.25, 0.2]]) s += pg(pq(G, bx, bx + bw, by + 0.1, by), C("#9c4a32"), `stroke="${C("#4a2018")}" stroke-width="${LW(gw[0].s) * 0.6}"`);
  const crack = (a, sd) => `<path d="${wpath(a.map(([x, y]) => G(x, y)), sd, 2, false, 2.4)}" fill="none" stroke="${C("#4a2c20")}" stroke-width="${n(Math.max(0.9, gw[0].s * 0.006))}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += crack([[-0.6, 1.58], [-0.3, 1.82], [-0.36, 2.0], [-0.1, 2.5]], 31) + crack([[-0.3, 1.82], [0.1, 1.74]], 32) + crack([[1.9, 0.9], [1.7, 1.2], [1.76, 1.5]], 33) + crack([[-2.2, 0.6], [-1.9, 0.9], [-2.0, 1.1]], 34) + crack([[0.5, 2.3], [0.42, 2.0], [0.6, 1.8]], 35);
  // the small round window, moonlit, one pane cracked
  const wc = G(ATTIC.window.X, ATTIC.window.Y), wr = 0.37 * wc.s;
  if (vis(c, zb)) {
    s += `<circle cx="${n(wc.x)}" cy="${n(wc.y)}" r="${n(wr * 1.2)}" fill="${C("#5a3a28")}" stroke="${INK}" stroke-width="${LW(wc.s)}"/><circle cx="${n(wc.x)}" cy="${n(wc.y)}" r="${n(wr)}" fill="${C("#7fb2ff", 0.25)}" stroke="${INK}" stroke-width="${LW(wc.s)}"/>`;
    s += `<path d="M${n(wc.x + wr * 0.3)},${n(wc.y - wr * 0.62)} a${n(wr * 0.27)},${n(wr * 0.27)} 0 1 0 ${n(wr * 0.3)},${n(wr * 0.36)} a${n(wr * 0.22)},${n(wr * 0.22)} 0 1 1 ${n(-wr * 0.3)},${n(-wr * 0.36)} Z" fill="${C("#f4f8ff", 0.1)}"/>`;
    s += `<path d="M${n(wc.x - wr * 0.04)},${n(wc.y - wr)} L${n(wc.x + wr * 0.03)},${n(wc.y + wr)} M${n(wc.x - wr)},${n(wc.y + wr * 0.06)} L${n(wc.x + wr)},${n(wc.y - wr * 0.02)}" stroke="${C("#5a3a28")}" stroke-width="${n(wr * 0.13)}"/><path d="M${n(wc.x - wr * 0.04)},${n(wc.y - wr)} L${n(wc.x + wr * 0.03)},${n(wc.y + wr)} M${n(wc.x - wr)},${n(wc.y + wr * 0.06)} L${n(wc.x + wr)},${n(wc.y - wr * 0.02)}" stroke="${INK}" stroke-width="${n(wr * 0.02)}" fill="none" transform="translate(${n(wr * 0.07)},${n(wr * 0.07)})"/>`;
    s += `<path d="M${n(wc.x - wr * 0.7)},${n(wc.y + wr * 0.2)} l${n(wr * 0.3)},${n(wr * 0.22)} l${n(-wr * 0.06)},${n(wr * 0.3)} M${n(wc.x - wr * 0.4)},${n(wc.y + wr * 0.42)} l${n(wr * 0.26)},${n(wr * 0.05)}" stroke="${C("#eaf2ff", 0.1)}" stroke-width="${n(Math.max(0.8, wr * 0.025))}" fill="none"/>`;
    s += cobweb(wc.x - wr * 0.86, wc.y - wr * 0.86, wr * 0.9, 0.1, 1.5, 5, C("#e8dcc8", 0.2), Math.max(0.8, wr * 0.02));
  }
  // knee walls of rough planks
  for (const sd of [-1, 1]) {
    s += face(c, [[sd * 2.5, 0.9, zn], [sd * 2.5, 0.9, zb], [sd * 2.5, 0, zb], [sd * 2.5, 0, zn]], C("#6a4630"), 41 + sd);
    for (let z = zb - 0.35; z > zn + 0.3; z -= 0.42) s += ln3(c, [[sd * 2.5, 0.88, z], [sd * 2.5, 0.02, z + jit(z * 7, 0.03)]], C("#2e1a14"), 0.007, z * 3);
  }
  s += boards(c, m, -2.5, 2.5, -3, zb, wood, 3, 0.34);
  // moonlight from the round window: a flat shaft and its patch on the boards
  const mp = pj(c, [[-0.75, 0, 5.5], [0.05, 0, 5.4], [0.2, 0, 4.7], [-0.7, 0, 4.75]]);
  s += `<path d="${wpath(mp, 51, 2)}" fill="${C("#9cc4ff", 0.15)}" opacity="0.3" style="mix-blend-mode:screen"/><path d="${wpath([{ x: wc.x - wr, y: wc.y }, { x: wc.x + wr, y: wc.y }, mp[1], mp[2], mp[3], mp[0]], 52, 1)}" fill="${C("#9cc4ff", 0.15)}" opacity="0.07" style="mix-blend-mode:screen"/>`;
  // rafters, far to near, each with its lit face and its underside
  for (let z = 5.95, i = 0; z > zn + 0.3; z -= 0.86, i++) for (const sd of [-1, 1]) {
    s += face(c, [[sd * 2.5, 0.9, z + 0.13], [0, rg, z + 0.13], [0, rg, z], [sd * 2.5, 0.9, z]], C("#3a2218"), 60 + i * 2 + sd, { k: 4 });
    s += face(c, [[sd * 2.5, 0.92, z], [0, rg, z], [0, rg - 0.2, z], [sd * 2.5, 0.72, z]], C(sd < 0 ? "#8a5c3a" : "#74482c"), 70 + i * 2 + sd, { k: 4 });
    const u = 0.3 + 0.4 * hash(i * 5 + sd + 2);
    s += ln3(c, [[sd * 2.5 * (1 - u), 0.82 + (rg - 0.9) * u, z], [sd * 2.5 * (1 - u - 0.25), 0.84 + (rg - 0.9) * (u + 0.25), z]], C("#3a2218"), 0.006, i + sd);
  }
  s += face(c, [[-0.09, rg - 0.2, zn], [0.09, rg - 0.2, zn], [0.09, rg - 0.2, zb], [-0.09, rg - 0.2, zb]], C("#5a3a26"), 81);
  // the collar tie with things hung on it: a dead lantern, a bunch of dried herbs
  s += box(c, -1.0, 1.0, 2.3, 2.44, 5.0, 5.12, [C("#7d5134"), C("#8b5a38"), C("#3a2218")], 83);
  s += spr(c, 0.55, 2.3, 5.06, `<path d="M0,0 L0,9" stroke="${INK}" stroke-width="0.8" fill="none"/><path d="M-5,11 Q0,6 5,11 Z" fill="${C("#4a4038")}"/><path d="M-4.4,11 L4.4,11 L5.4,25 L-5.4,25 Z" fill="${C("#8fa6a0", 0.5)}" opacity="0.8"/><path d="M-6,25 L6,25 L5,28.5 L-5,28.5 Z" fill="${C("#4a4038")}"/><path d="M-1.6,11 L-2.2,25 M1.8,11 L2.4,25 M-2,19 l3,-4" stroke="${INK}" stroke-width="0.5" fill="none"/>`, Math.sin(t * 0.9) * 1.5);
  s += spr(c, -0.5, 2.3, 5.06, `<path d="M0,0 L0,7" stroke="${C("#c9b58a")}" stroke-width="0.7" fill="none"/>${[-22, -11, 0, 10, 21].map((a, i) => `<path d="M0,7 Q${a * 0.2},18 ${a * 0.45},${28 + (i % 2) * 5}" stroke="${C("#5a6a30")}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M${a * 0.3},20 l${a > 0 ? 3 : -3},2 M${a * 0.4},26 l${a > 0 ? 3 : -3},1.5 M${a * 0.2},14 l${a > 0 ? -2.5 : 2.5},2" stroke="${C("#7a8a3a")}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`).join("")}<path d="M-2,7 L2,8" stroke="${C("#c9b58a")}" stroke-width="1.4"/>`, Math.sin(t * 0.7 + 1) * 1.2);
  // the shelves against the gable: jars, leaning books, the old box the paw came in
  const sx0 = 0.72, sx1 = 1.9, sz0 = 6.22, sz1 = 6.56, shc = [C("#74482c"), C("#8b5a38"), C("#4a2c1e")];
  s += face(c, [[sx0, 1.46, sz1], [sx1, 1.46, sz1], [sx1, 0, sz1], [sx0, 0, sz1]], C("#2e1a14"), 90);
  const items = {
    0.06: `${jar(-44, 15, 22, C("#a8c0b0", 0.45), 0.55, [C("#6a3a2a"), C("#4a4038"), C("#e6d6a6")])}<path d="M-28,0 L-30,-12 L4,-12 L2,0 Z" fill="${C("#b08a4a")}"/><path d="M-29,-4 L3,-4 M-29.6,-8 L3.6,-8 M-22,-12 L-21,0 M-13,-12 L-12.6,0 M-4,-12 L-4.4,0" stroke="${INK}" stroke-width="0.45" fill="none"/><path d="M12,0 L11,-9 L40,-10 L41,0 Z" fill="${C("#d8caa0")}"/><path d="M11.5,-4 L40.6,-5 M25,-10 L25.5,0 M22,-10.5 q3.5,-3.5 7,0.4" stroke="${C("#8a5a3a")}" stroke-width="0.7" fill="none"/>`,
    0.5: `<path d="M-50,0 L-50,-25 L-44,-25 L-44,0 Z" fill="${C("#7a2a2a")}"/><path d="M-44,0 L-44,-29 L-39,-29 L-39,0 Z" fill="${C("#2f4a5a")}"/><path d="M-39,0 L-39,-22 L-32,-22 L-32,0 Z" fill="${C("#a8742a")}"/><path d="M-32,0 L-26.5,-26 L-21,-25 L-25,0 Z" fill="${C("#3f5a3a")}"/><path d="M-49,-20 l4,0 M-49,-6 l4,0 M-43,-24 l3,0 M-38,-17 l5,0 M-37.6,-5 l4.6,0" stroke="${C("#e0c070")}" stroke-width="0.6" fill="none"/><path d="M-16,0 L-16,-5.6 L12,-6 L12,0 Z" fill="${C("#5a2a3a")}"/><path d="M-15,-6 L-15,-10.6 L10,-11 L10.6,-6 Z" fill="${C("#c8b890")}"/>${jar(27, 13, 17, C("#a8c0b0", 0.45), 0.7, [C("#8a8a3a"), C("#7a5a2a"), C("#e6d6a6")])}${jar(43, 11, 24, C("#a8c0b0", 0.45), 0.35, [C("#3a2a4a"), C("#4a4038"), C("#e6d6a6")])}`,
    0.96: `${jar(-45, 12, 26, C("#a8c0b0", 0.45), 0.8, [C("#8a4a2a"), C("#4a4038"), C("#e6d6a6")])}${jar(-30, 14, 18, C("#a8c0b0", 0.45), 0.45, [C("#c0a040"), C("#7a5a2a"), C("#e6d6a6")])}${jar(-14, 10, 22, C("#a8c0b0", 0.45), 0.6, [C("#5a6a3a"), C("#4a4038"), C("#e6d6a6")])}<path d="M3,0 L3,-13 L39,-13.6 L39,0 Z" fill="${C("#6a3d24")}"/><path d="M2,-13 L4,-22 L39.5,-25 L40,-13.6 Z" fill="${C("#7d4a2c")}"/><path d="M4.4,-21 L39,-23.6" stroke="${C("#3a2014")}" stroke-width="0.6" fill="none"/><path d="M3,-13.2 L39,-13.8" stroke="${INK}" stroke-width="1.1" fill="none"/><path d="M18.6,-15.5 L23.4,-15.6 L23.2,-9.6 L18.8,-9.6 Z" fill="${C("#d8a838")}"/><circle cx="21" cy="-11.6" r="0.8" fill="${INK}" stroke="none"/><path d="M6,-4 q8,-1.6 16,0.4 q7,1.4 15,-0.6 M7,-8.6 q6,1 11,0.2 M27,-8 q5,-1 10,0.4" stroke="${C("#4a2816")}" stroke-width="0.5" fill="none"/><path d="M3.6,-2.2 L5.6,-2.2 L5.6,-0.6 Z M36.6,-2.4 L38.4,-0.6 L36.4,-0.6 Z" fill="${C("#d8a838")}" stroke-width="0.3"/>`,
    1.46: `<path d="M-46,0 Q-48,-17 -37,-17.6 Q-26,-17 -28,0 Z" fill="${C("#9a6a8a")}"/><path d="M-47.6,-5 L-27.6,-5.4 M-40,-17.4 q3,-4 6,0" stroke="${INK}" stroke-width="0.5" fill="none"/><path d="M-12,0 L-11,-3 L4,-3 L5,0 Z" fill="${C("#b08a3a")}"/><path d="M-5.5,-3 L-5.5,-11 L-1.5,-11 L-1.5,-3 Z" fill="${C("#efe6d0")}"/><path d="M-5.5,-8 q-1.4,2 -0.6,4 M-3.5,-11 L-3.4,-13" stroke="${INK}" stroke-width="0.5" fill="none"/><path d="M20,0 L21,-12 L33,-12 L34,0 Z" fill="${C("#4a5a6a")}"/><path d="M33,-9 L41,-13 L41.6,-11.4 L34,-6 Z" fill="${C("#4a5a6a")}"/><path d="M24,-12 L24.6,-15 L30,-15 L30.6,-12" fill="${C("#3a444e")}"/>`,
  };
  for (const [y, body] of Object.entries(items)) {
    const Y = +y;
    s += box(c, sx0, sx1, Y - 0.04, Y, sz0, sz1, shc, 91 + Y * 10);
    s += spr(c, (sx0 + sx1) / 2, Y, sz0 + 0.12, body);
    s += ln3(c, [[sx0 + 0.1, Y + 0.004, sz0 + 0.02], [sx1 - 0.3 * hash(Y * 9), Y + 0.004, sz0 + 0.02]], C("#e8dcc8", 0.3), 0.006, Y * 7, `opacity="0.45"`);
  }
  s += box(c, sx0 - 0.05, sx0, 0, 1.5, sz0, sz1, shc, 96) + box(c, sx1, sx1 + 0.05, 0, 1.5, sz0, sz1, shc, 97);
  const sc0 = PZ(c, sx1 + 0.05, 1.5, sz0);
  s += cobweb(sc0.x, sc0.y, 0.5 * sc0.s, -1.5, -0.15, 9, C("#e8dcc8", 0.2), Math.max(0.8, sc0.s * 0.004));
  const ap = G(0, rg - 0.22);
  s += cobweb(ap.x, ap.y, 0.85 * ap.s, 0.75, 2.4, 17, C("#e8dcc8", 0.2), Math.max(0.8, ap.s * 0.004));
  // a rolled rug in the corner, the open trunk, a crate, hat boxes
  s += spr(c, -2.2, 0, 6.3, `<path d="M-9,0 L-3,-128 Q4,-134 11,-128 L9,0 Z" fill="${C("#8a3a3a")}"/><ellipse cx="4" cy="-129" rx="7" ry="3.4" fill="${C("#c8a070")}"/><path d="M1,-129 q3,-2 5.6,0 q-2,1.6 -3.6,0.4" stroke="${INK}" stroke-width="0.5" fill="none"/><path d="M-7.6,-30 L9.4,-32 M-6.4,-60 L9.8,-62 M-5,-95 L10.4,-96" stroke="${C("#d8a838")}" stroke-width="1.6" fill="none"/><path d="M-6.4,-64 L9.8,-66" stroke="${C("#3a2a4a")}" stroke-width="1" fill="none"/>`, 5);
  const T0 = -2.05, T1 = -1.0, tc = [C("#6a3f2a"), C("#1c0f10"), C("#4a2a1c")];
  s += face(c, [[T0, 1.08, 6.12], [T1, 1.08, 6.12], [T1, 0.48, 5.9], [T0, 0.48, 5.9]], C("#a8804a"), 101);
  const TL = pl(c, [T0, 0.48, 5.9], [1, 0, 0], [0, 0.6, 0.22]);
  for (let u = 0.1; u < 1.0; u += 0.16) s += pg(pq(TL, u, u + 0.06, 0.95, 0.05), C("#8a6238"), `opacity="0.7"`);
  s += `<path d="${wpath([TL(0.05, 0.05), TL(1.0, 0.05), TL(1.0, 0.95), TL(0.05, 0.95)], 103, 2)}" fill="none" stroke="${C("#3a2014")}" stroke-width="${n(TL(0, 0).s * 0.02)}"/>`;
  s += box(c, T0, T1, 0, 0.48, 5.25, 5.9, tc, 105);
  s += spr(c, (T0 + T1) / 2, 0.48, 5.3, `<path d="M-46,0 Q-40,-13 -22,-10 Q-8,-16 6,-9 Q22,-12 30,0 Z" fill="${C("#c8a070")}"/><path d="M-38,-4 q8,-4 16,-2 M-10,-8 q8,-2 16,2" stroke="${C("#8a6238")}" stroke-width="0.6" fill="none"/><path d="M30,0 L33,-15 L47,-13 L46,0 Z" fill="${C("#3f5a3a")}"/><path d="M34,-10 l11,1.4" stroke="${C("#e0c070")}" stroke-width="0.7"/><path d="M-30,1 Q-33,14 -27,22 Q-24,12 -25,1" fill="${C("#9a3a4a")}"/>`);
  const TF = pl(c, [T0, 0, 5.25], [1, 0, 0], [0, 1, 0]);
  for (const u of [0.2, 0.82]) s += sh(pq(TF, u, u + 0.09, 0.48, 0), C("#3a2014"), 107 + u * 10, { k: 1 });
  for (const [u, v] of [[0, 0], [0.97, 0], [0, 0.4], [0.97, 0.4]]) s += pg([TF(u, v), TF(u + 0.08, v), TF(u + 0.08, v + 0.08), TF(u, v + 0.08)], C("#c89a38"), `stroke="${INK}" stroke-width="${LW(TF(0, 0).s) * 0.5}"`);
  s += sh(pq(TF, 0.47, 0.6, 0.46, 0.33), C("#c89a38"), 109, { k: 1 }) + `<circle cx="${n(TF(0.535, 0.38).x)}" cy="${n(TF(0.535, 0.38).y)}" r="${n(TF(0, 0).s * 0.012)}" fill="${INK}"/>`;
  s += `<path d="${wpath([TF(0.3, 0.3), TF(0.42, 0.24), TF(0.38, 0.12)], 110, 2, false, 2)}" fill="none" stroke="${C("#9a6a48")}" stroke-width="${n(Math.max(0.8, TF(0, 0).s * 0.004))}"/>`;
  s += box(c, 1.85, 2.42, 0, 0.3, 4.55, 5.1, [C("#9a4a5a"), C("#b05a6a"), C("#6a2a3a")], 111) + box(c, 1.92, 2.36, 0.3, 0.52, 4.62, 5.04, [C("#4a6a7a"), C("#5a7a8a"), C("#2a4a5a")], 113);
  const hb = PZ(c, 2.14, 0.4, 4.62); s += `<ellipse cx="${n(hb.x)}" cy="${n(hb.y)}" rx="${n(hb.s * 0.09)}" ry="${n(hb.s * 0.06)}" fill="${C("#e6d6a6")}" stroke="${INK}" stroke-width="${LW(hb.s) * 0.6}"/>`;
  s += box(c, -2.45, -1.85, 0, 0.42, 4.0, 4.6, [C("#8b5a38"), C("#9a6a44"), C("#5a3a26")], 115);
  const CF = pl(c, [-2.45, 0, 4.0], [1, 0, 0], [0, 1, 0]);
  for (const v of [0.13, 0.28]) s += `<path d="M${n(CF(0, v).x)},${n(CF(0, v).y)} L${n(CF(0.6, v + 0.01).x)},${n(CF(0.6, v + 0.01).y)}" stroke="${C("#3a2218")}" stroke-width="${n(Math.max(0.8, CF(0, 0).s * 0.006))}"/>`;
  s += dust(c, t, m, st.light || PZ(c, 0.9, 1.45, 3.4), { k: st.dust ?? 1 });
  return s;
}

// ---------------------------------------------------------------- the Whites' parlour, about 1900
// Room: X -2.4..2.4, ceiling 2.7, back wall Z 6.5. Fire in the chimney breast (centre X -1.2), window right of it.
// Seats (cushion top 0.5 m, use st.seat 0.5): mother's low chair, the father's red armchair, the son's green one; the
// chess table stands between the two armchairs. PARLOUR.fire = where the paw lands in the coals.
// st = { fire 0..1 (1 live, 0 cold embers), lamp 0..1, noTable (draw parlourTable() yourself, in front of the sitters) }
export const PARLOUR = { back: 6.5, fire: { X: -1.2, Y: 0.34, Z: 6.1 }, hearth: { X: -1.2, Z: 5.55 }, mother: { X: -1.74, Z: 5.3 }, father: { X: -0.22, Z: 5.3 }, sonSeat: { X: 1.55, Z: 5.3 }, table: { X: 0.66, Y: 0.7, Z: 5.02 }, window: { X: 1.5, Y: 1.6 }, door: { X: -2.4, Z: 4.15 }, lamp: { X: 2.13, Y: 0.74, Z: 6.12 }, mantel: { X: -1.2, Y: 1.27, Z: 6.05 } };
function armchair(c, m, X, Z, col, seed, o = {}) {
  const C = (k) => tone(m, k), w = o.w ?? 0.36, hi = o.h ?? 1.12, cs = [C(col), C(mix(col, "#ffffff", 0.14)), C(mix(col, "#000000", 0.32))];
  let s = "";
  for (const sx of [-1, 1]) s += box(c, X + sx * (w + 0.02) - 0.03, X + sx * (w + 0.02) + 0.03, 0, 0.12, Z + 0.22, Z + 0.3, [C("#3a2014")], seed + 30 + sx);
  s += box(c, X - w, X + w, 0.4, hi, Z + 0.2, Z + 0.34, cs, seed);
  const B = pl(c, [X, 0, Z + 0.2], [1, 0, 0], [0, 1, 0]);
  if (vis(c, Z + 0.2)) {
    for (const [u, v] of [[-0.16, 0.8], [0.15, 0.82], [0, 0.68], [-0.15, 0.57], [0.16, 0.58]]) { const q = B(u * w / 0.36, v * hi / 1.12); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(q.s * 0.014)}" fill="${C(mix(col, "#000000", 0.4))}"/><path d="M${n(q.x - q.s * 0.05)},${n(q.y - q.s * 0.03)} L${n(q.x)},${n(q.y)} L${n(q.x + q.s * 0.05)},${n(q.y - q.s * 0.035)}" stroke="${C(mix(col, "#000000", 0.3))}" stroke-width="${n(q.s * 0.005)}" fill="none"/>`; }
    // the lace antimacassar, a little crooked
    const a = [B(-w * 0.72, hi + 0.012), B(w * 0.66, hi + 0.012), B(w * 0.68, hi - 0.2), B(w * 0.4, hi - 0.27), B(w * 0.12, hi - 0.21), B(-w * 0.18, hi - 0.28), B(-w * 0.46, hi - 0.22), B(-w * 0.74, hi - 0.25)];
    s += sh(a, C("#efe6d0"), seed + 3, { k: 2 });
    for (let i = 0; i < 7; i++) { const q = B(-w * 0.6 + i * w * 0.2, hi - 0.13 - (i % 2) * 0.04); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(q.s * 0.012)}" fill="none" stroke="${C("#b8a888")}" stroke-width="${n(q.s * 0.004)}"/>`; }
  }
  s += box(c, X - w - 0.04, X + w + 0.04, 0.1, 0.42, Z - 0.3, Z + 0.2, cs, seed + 5);
  const F = pl(c, [X, 0, Z - 0.3], [1, 0, 0], [0, 1, 0]);
  for (let i = 0; i < 9; i++) { const q = F(-w + 0.04 + i * w * 0.22, 0.1), q2 = F(-w + 0.04 + i * w * 0.22 + jit(i + seed, 0.01), 0.1 - 0.03 - 0.03 * hash(i + seed)); s += `<path d="M${n(q.x)},${n(q.y)} L${n(q2.x)},${n(q2.y)}" stroke="${C("#c8a050")}" stroke-width="${n(q.s * 0.008)}" stroke-linecap="round"/>`; }
  s += box(c, X - w + 0.06, X + w - 0.06, 0.42, 0.5, Z - 0.33, Z + 0.2, [C(mix(col, "#ffffff", 0.08)), C(mix(col, "#ffffff", 0.2)), cs[2]], seed + 7);
  if (!o.noArms) for (const sx of [-1, 1]) {
    s += box(c, X + sx * (w + 0.02) - 0.085, X + sx * (w + 0.02) + 0.085, 0.1, 0.7, Z - 0.3, Z + 0.3, cs, seed + 9 + sx);
    const q = [F(sx * (w + 0.02) - 0.05, 0.62), F(sx * (w + 0.02) + 0.045, 0.64), F(sx * (w + 0.02) + 0.05, 0.5), F(sx * (w + 0.02) - 0.03, 0.47)];
    s += `<path d="${wpath(q, seed + 12 + sx, 2)}" fill="${C(mix(col, "#e8c8a0", 0.45))}"/><path d="M${n(q[3].x)},${n(q[3].y)} l${n(q[0].s * 0.02)},${n(q[0].s * 0.03)} M${n(q[2].x)},${n(q[2].y)} l${n(-q[0].s * 0.01)},${n(q[0].s * 0.035)}" stroke="${C("#e8c8a0")}" stroke-width="${n(q[0].s * 0.004)}"/>`;
  }
  return s;
}
const PIECES = [[0, 7, "r", 1], [4, 7, "k", 1], [5, 7, "b", 1], [1, 6, "p", 1], [2, 5, "p", 1], [5, 6, "p", 1], [6, 6, "p", 1], [3, 4, "n", 1], [4, 3, "p", 0], [2, 2, "n", 0], [5, 2, "q", 0], [0, 1, "p", 0], [1, 1, "p", 0], [6, 1, "p", 0], [4, 0, "k", 0], [7, 0, "r", 0]];
function piece(kind, col, dk) {
  const h = { p: 4.2, r: 5.2, n: 5.6, b: 6.2, q: 7, k: 7.8 }[kind];
  let s = `<path d="M-1.7,0 L1.7,0 L1.1,${-h * 0.25} L0.8,${-h * 0.7} L-0.8,${-h * 0.7} L-1.1,${-h * 0.25} Z" fill="${col}" stroke-width="0.3"/>`;
  if (kind === "p") s += `<circle cy="${-h * 0.82}" r="1" fill="${col}" stroke-width="0.3"/>`;
  else if (kind === "r") s += `<path d="M-1.3,${-h * 0.7} L-1.3,${-h} L-0.5,${-h} L-0.5,${-h + 0.6} L0.5,${-h + 0.6} L0.5,${-h} L1.3,${-h} L1.3,${-h * 0.7} Z" fill="${col}" stroke-width="0.3"/>`;
  else if (kind === "n") s += `<path d="M-1,${-h * 0.7} Q-1.6,${-h} 0.2,${-h} L1.6,${-h * 0.78} L1.2,${-h * 0.68} L0.8,${-h * 0.7} Z" fill="${col}" stroke-width="0.3"/>`;
  else s += `<path d="M-1,${-h * 0.7} Q-1.5,${-h * 0.9} 0,${-h} Q1.5,${-h * 0.9} 1,${-h * 0.7} Z" fill="${col}" stroke-width="0.3"/>` + (kind === "k" ? `<path d="M0,${-h} L0,${-h - 1.6} M-0.7,${-h - 1} L0.7,${-h - 1}" stroke="${dk}" stroke-width="0.45" fill="none"/>` : kind === "q" ? `<circle cy="${-h - 0.5}" r="0.5" fill="${col}" stroke-width="0.3"/>` : `<path d="M-0.4,${-h * 0.92} l0.9,0.7" stroke="${dk}" stroke-width="0.3" fill="none"/>`);
  return s;
}
// the chess table (mid-game: white is losing), a cup gone cold beside the board
export function parlourTable(c, t, m) {
  const C = (k) => tone(m, k), T = PARLOUR.table, x0 = T.X - 0.34, x1 = T.X + 0.34, z0 = T.Z - 0.26, z1 = T.Z + 0.26;
  if (!vis(c, z0)) return "";
  let s = "";
  const g = PZ(c, T.X, 0, T.Z); s += `<ellipse cx="${n(g.x)}" cy="${n(g.y)}" rx="${n(0.42 * g.s)}" ry="${n(0.08 * g.s)}" fill="${INK}" opacity="0.3"/>`;
  for (const [dx, dz] of [[-0.2, 0.12], [0.2, 0.12], [0, -0.16]]) s += ln3(c, [[T.X, 0.2, T.Z], [T.X + dx, 0.01, T.Z + dz]], INK, 0.06) + ln3(c, [[T.X, 0.2, T.Z], [T.X + dx, 0.01, T.Z + dz]], C("#5a3220"), 0.04);
  s += box(c, T.X - 0.04, T.X + 0.04, 0.16, 0.66, T.Z - 0.04, T.Z + 0.04, [C("#6a3d24"), C("#6a3d24"), C("#3a2014")], 201);
  s += box(c, x0, x1, 0.66, 0.7, z0, z1, [C("#7d4a2c"), C("#96603a"), C("#4a2a18")], 203);
  const B = pl(c, [T.X - 0.2, 0.703, T.Z + 0.2], [0.4, 0, 0], [0, 0, -0.4]);
  s += sh(pq(B, -0.06, 1.06, -0.06, 1.06), C("#4a2a18"), 205, { k: 1 }) + pg(pq(B, 0, 1, 0, 1), C("#ead9a8"));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) s += pg(pq(B, i / 8, (i + 1) / 8, j / 8, (j + 1) / 8), C("#6a2a22"));
  const cream = C("#f6ead0"), red = C("#3a1418");
  for (const [f, r, k, side] of [...PIECES].sort((a, b) => b[1] - a[1])) { const u = (f + 0.5) / 8, v = 1 - (r + 0.5) / 8; s += spr(c, T.X - 0.2 + 0.4 * u + jit(f * 9 + r, 0.006), 0.703, T.Z + 0.2 - 0.4 * v, piece(k, side ? red : cream, side ? cream : red)); }
  s += spr(c, T.X + 0.27, 0.703, T.Z - 0.12, `<g transform="rotate(84)">${piece("p", cream, red)}</g><g transform="translate(3.4,-1) rotate(-70)">${piece("b", cream, red)}</g>`);
  s += spr(c, T.X - 0.28, 0.703, T.Z - 0.14, `<ellipse cx="0" cy="-0.6" rx="5" ry="1.5" fill="${C("#e6dcc8")}"/><path d="M-3,-0.8 L-3.4,-5.6 L3.4,-5.6 L3,-0.8 Z" fill="${C("#efe6d6")}"/><path d="M3.3,-4.6 q2.6,0.4 0.2,2.8" fill="none"/><ellipse cx="0" cy="-5.6" rx="3.4" ry="0.9" fill="${C("#6a3a1a")}"/><path d="M-2.6,-3 q2.6,1 5.2,0" stroke="${C("#3f5a8a")}" stroke-width="0.5" fill="none"/>`);
  return s;
}
export function parlour(c, t, m, st = {}) {
  const C = (col, k) => tone(m, col, k), zb = PARLOUR.back, zn = c.z + 0.26, fire = st.fire ?? 1, lamp = st.lamp ?? 1;
  const paper = ["#8a3d3a", "#7a3030", "#d8a05a", "#4a2a1c", "#3a2014"];
  const fl = Math.floor(t * 12), fk = fire * (0.84 + 0.16 * hash(fl * 1.7));
  let s = shell(c, m, 2.4, 2.7, zb, ["#c8a888"], 300);
  s += wallpaper(c, m, pl(c, [0, 0, zb], [1, 0, 0], [0, 1, 0]), -2.4, 2.4, paper, 301);
  const um = zb - zn;
  s += wallpaper(c, m, pl(c, [-2.4, 0, zb], [0, 0, -1], [0, 1, 0]), 0, um, paper, 311) + wallpaper(c, m, pl(c, [2.4, 0, zb], [0, 0, -1], [0, 1, 0]), 0, um, paper, 321);
  // the door to the hall, in the left wall
  const D = pl(c, [-2.4, 0, 4.6], [0, 0, -1], [0, 1, 0]);
  if (zn < 4.5) {
    s += sh(pq(D, -0.08, 0.98, 2.1, 0), C("#3a2014"), 331) + sh(pq(D, 0, 0.9, 2.02, 0), C("#6a4a2c"), 332);
    for (const [u0, u1, v0, v1] of [[0.1, 0.4, 1.9, 1.1], [0.5, 0.8, 1.9, 1.1], [0.1, 0.4, 0.92, 0.2], [0.5, 0.8, 0.92, 0.2]]) s += sh(pq(D, u0, u1, v0, v1), C("#5a3c22"), 333 + u0 * 10 + v0, { k: 1 });
    const kb = D(0.12, 1.0); s += `<circle cx="${n(kb.x)}" cy="${n(kb.y)}" r="${n(kb.s * 0.035)}" fill="${C("#d8a838")}" stroke="${INK}" stroke-width="${LW(kb.s)}"/>`;
  }
  s += boards(c, m, -2.4, 2.4, -3, zb, ["#6a3f28", "#5a3420", "#2a1610"], 340, 0.26);
  // the window: night, wind in a bare branch, rain driven across the glass
  const WN = pl(c, [1.0, 1.0, zb], [1, 0, 0], [0, 1, 0]), w0 = WN(0, 1.18), w1 = WN(1, 0), ww = w1.x - w0.x, wh = w1.y - w0.y, sw = Math.sin(t * 1.7) * 0.6 + Math.sin(t * 4.3 + 1) * 0.4;
  s += sh(pq(WN, -0.07, 1.07, 1.25, -0.06), C("#3a2014"), 350);
  s += `<clipPath id="pwin"><rect x="${n(w0.x)}" y="${n(w0.y)}" width="${n(ww)}" height="${n(wh)}"/></clipPath><g clip-path="url(#pwin)"><rect x="${n(w0.x)}" y="${n(w0.y)}" width="${n(ww)}" height="${n(wh)}" fill="${C("#1c2c6a", 0.35)}"/>`;
  s += `<circle cx="${n(w0.x + ww * 0.3)}" cy="${n(w0.y + wh * 0.24)}" r="${n(ww * 0.09)}" fill="${C("#dce8ff", 0.2)}"/><path d="M${n(w0.x)},${n(w0.y + wh * 0.3)} q${n(ww * 0.3)},${n(-wh * 0.08)} ${n(ww * 0.55)},${n(wh * 0.02)} q${n(ww * 0.2)},${n(-wh * 0.05)} ${n(ww * 0.5)},${n(wh * 0.03)} l0,${n(wh * 0.1)} L${n(w0.x)},${n(w0.y + wh * 0.42)} Z" fill="${C("#3a4a8a", 0.35)}" opacity="0.8"/>`;
  s += `<g transform="rotate(${n(sw * 3.5)} ${n(w1.x)} ${n(w0.y + wh * 0.7)})"><path d="M${n(w1.x)},${n(w0.y + wh * 0.72)} Q${n(w0.x + ww * 0.6)},${n(w0.y + wh * 0.6)} ${n(w0.x + ww * 0.28)},${n(w0.y + wh * 0.42)} M${n(w0.x + ww * 0.62)},${n(w0.y + wh * 0.61)} L${n(w0.x + ww * 0.5)},${n(w0.y + wh * 0.3)} M${n(w0.x + ww * 0.44)},${n(w0.y + wh * 0.52)} L${n(w0.x + ww * 0.2)},${n(w0.y + wh * 0.62)} M${n(w0.x + ww * 0.55)},${n(w0.y + wh * 0.44)} L${n(w0.x + ww * 0.7)},${n(w0.y + wh * 0.3)} M${n(w0.x + ww * 0.8)},${n(w0.y + wh * 0.68)} L${n(w0.x + ww * 0.86)},${n(w0.y + wh * 0.46)}" stroke="${C("#0c1230", 0.3)}" stroke-width="${n(Math.max(1.5, ww * 0.022))}" fill="none" stroke-linecap="round"/></g>`;
  for (let i = 0; i < 16; i++) { const u = ((hash(i + 3) + t * (0.5 + hash(i) * 0.5)) % 1), x = w0.x + ww * (1.2 - 1.4 * u) + hash(i + 9) * ww * 0.3, y = w0.y + wh * (hash(i + 5) * 0.3 + u * 0.9); s += `<path d="M${n(x)},${n(y)} l${n(-ww * 0.07)},${n(wh * 0.045)}" stroke="${C("#bcd0ff", 0.2)}" stroke-width="${n(Math.max(1, ww * 0.008))}" opacity="0.6" stroke-linecap="round"/>`; }
  s += `</g>`;
  for (const u of [0.5]) s += sh(pq(WN, u - 0.025, u + 0.025, 1.18, 0), C("#4a2a1c"), 351, { k: 1 });
  for (const v of [0.42, 0.8]) s += sh(pq(WN, 0, 1, v + 0.022, v - 0.022), C("#4a2a1c"), 352 + v, { k: 1 });
  // a lace half-curtain, the sill, an aspidistra
  s += `<path d="${wpath([WN(0, 0.42), WN(1, 0.42), WN(1, 0), WN(0, 0)], 354, 2)}" fill="${C("#efe6d0")}" opacity="0.5"/>`;
  for (let i = 0; i < 11; i++) for (let j = 0; j < 3; j++) { const q = WN(0.07 + i * 0.087 + (j % 2) * 0.04, 0.07 + j * 0.12); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(q.s * 0.012)}" fill="none" stroke="${C("#fff8e8")}" stroke-width="${n(q.s * 0.004)}" opacity="0.8"/>`; }
  s += box(c, 0.9, 2.1, 0.94, 1.0, 6.36, zb, [C("#5a3420"), C("#74482c"), C("#3a2014")], 356);
  s += spr(c, 1.3, 1.0, 6.42, `<path d="M-7,0 L-9,-13 L9,-13 L7,0 Z" fill="${C("#b05a34")}"/><path d="M-9.6,-13 L9.6,-13 L9.6,-16 L-9.6,-16 Z" fill="${C("#c26a40")}"/>${[[-26, -44, -6], [-12, -56, -2], [4, -60, 2], [20, -48, 5], [30, -34, 7], [-30, -30, -7]].map(([x, y, b], i) => `<path d="M${b},-16 Q${x * 0.3},${y * 0.7} ${x},${y} Q${x * 0.75 + 5},${y * 0.5} ${b + 2},-16 Z" fill="${C(i % 2 ? "#2f5a34" : "#3f6a3a")}" transform="rotate(${n(sw * (1 + i * 0.3))} 0 -16)"/><path d="M${b + 1},-17 Q${x * 0.4 + 2},${y * 0.7} ${x},${y}" stroke="${C("#1f3a22")}" stroke-width="0.5" fill="none" transform="rotate(${n(sw * (1 + i * 0.3))} 0 -16)"/>`).join("")}`);
  // heavy curtains on a brass pole; the draught moves their hems
  for (const sd of [-1, 1]) {
    const cx = 1.5 + sd * 0.52, hem = sw * 0.02 * sd, pts = [[cx - 0.2, 2.28], [cx + 0.2, 2.28], [cx + 0.2 - (sd > 0 ? 0 : 0.1), 1.3], [cx + 0.24 + hem, 0.5], [cx + 0.08 + hem * 1.4, 0.46], [cx - 0.1 + hem, 0.52], [cx - 0.25 + hem * 0.6, 0.48], [cx - 0.2 + (sd > 0 ? 0.1 : 0), 1.3]];
    s += sh(pts.map(([x, y]) => PZ(c, x, y, zb - 0.06)), C("#5a2030"), 360 + sd, { k: 3 });
    for (let k = 0; k < 4; k++) { const fx = cx - 0.13 + k * 0.09; s += ln3(c, [[fx, 2.24, zb - 0.06], [fx + (sd > 0 ? 0.03 : -0.03) * (k - 1.5), 1.32, zb - 0.06], [fx + hem + jit(k + sd, 0.02), 0.55, zb - 0.06]], C("#3a1220"), 0.008, 362 + k + sd); }
    s += ln3(c, [[cx - 0.2 + (sd > 0 ? 0.1 : 0), 1.3, zb - 0.07], [cx + 0.2 - (sd > 0 ? 0 : 0.1), 1.3, zb - 0.07]], C("#d8a838"), 0.03, 366 + sd);
  }
  s += ln3(c, [[0.84, 2.3, zb - 0.07], [2.16, 2.31, zb - 0.07]], INK, 0.05) + ln3(c, [[0.84, 2.3, zb - 0.07], [2.16, 2.31, zb - 0.07]], C("#d8a838"), 0.032);
  // two pictures: a cut-paper portrait and a cross-stitch sampler, neither quite straight
  s += spr(c, 0.35, 1.5, zb - 0.02, `<path d="M-13,0 L-13,-34 L13,-34 L13,0 Z" fill="${C("#3a2014")}"/><ellipse cx="0" cy="-17" rx="9.5" ry="13" fill="${C("#ead9a8")}"/><path d="M-3,-8 Q-5,-14 -3,-17 Q-6,-21 -2,-25 Q3,-28 5,-23 Q6.6,-21 5,-19 L6.4,-17 L4.6,-16.4 Q5,-13 2,-12.4 L2,-8 Z" fill="${INK}" stroke="none"/><path d="M0,-34 L-3,-44 M0,-34 L4,-44" stroke="${C("#8a6238")}" stroke-width="0.5" fill="none"/>`, -2.5);
  // the chimney breast, the mantelpiece, the grate
  const bx0 = -2.0, bx1 = -0.4, bz = 6.15;
  s += box(c, bx0, bx1, 0, 2.7, bz, zb, [C(paper[0]), C(paper[0]), C("#5a2424")], 370);
  s += wallpaper(c, m, pl(c, [0, 0, bz], [1, 0, 0], [0, 1, 0]), bx0, bx1, paper, 371);
  s += spr(c, -1.2, 1.56, bz - 0.01, `<path d="M-40,0 L-40,-52 L40,-52 L40,0 Z" fill="${C("#b8862a")}"/><path d="M-34,-6 L-34,-46 L34,-46 L34,-6 Z" fill="${C("#7aa8c8", 0.5)}"/><path d="M-34,-6 L-34,-20 Q-16,-30 0,-20 Q16,-12 34,-24 L34,-6 Z" fill="${C("#4a6a4a", 0.6)}"/><path d="M-34,-6 L-34,-12 Q-10,-18 10,-11 Q24,-8 34,-13 L34,-6 Z" fill="${C("#2f4a34", 0.6)}"/><circle cx="16" cy="-36" r="4.6" fill="${C("#f6e2a0", 0.4)}"/><path d="M-16,-19 L-16,-27 L-8,-21 Z M-16,-19 l9,0" fill="${C("#efe6d0")}" stroke-width="0.4"/><path d="M0,-52 L-14,-70 M0,-52 L16,-70" stroke="${C("#8a6238")}" stroke-width="0.5" fill="none"/>`, 1.8);
  const FP = pl(c, [-1.2, 0, bz - 0.07], [1, 0, 0], [0, 1, 0]);
  s += box(c, -1.95, -0.45, 0, 1.2, bz - 0.07, bz, [C("#2f3a34"), C("#3f4a44"), C("#1a221e")], 380);
  s += pg(pq(FP, -0.42, 0.42, 0.9, 0), C("#120808"));
  for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) s += pg(pq(FP, -0.4 + i * 0.2 + (j % 2) * 0.1, -0.22 + i * 0.2 + (j % 2) * 0.1, 0.86 - j * 0.15, 0.74 - j * 0.15), mix(C("#3a1a14"), C("#ff8a2a", 0.3), 0.35 * fk * (1 - j * 0.12)));
  // tiles down both sides: one cracked, one long gone
  const tcol = ["#2f6a6a", "#3a7a5a", "#2f5a7a"];
  for (const sd of [-1, 1]) for (let j = 0; j < 5; j++) {
    const u0 = sd < 0 ? -0.62 : 0.44, v0 = 0.1 + j * 0.16, id = j * 3 + sd;
    if (sd > 0 && j === 1) { s += pg(pq(FP, u0, u0 + 0.18, v0 + 0.15, v0), C("#1a1410")); continue; }
    s += sh(pq(FP, u0, u0 + 0.18, v0 + 0.15, v0), C(tcol[(j + (sd > 0 ? 1 : 0)) % 3]), 382 + id, { k: 1 });
    const q = FP(u0 + 0.09, v0 + 0.075); s += `<path d="M${n(q.x)},${n(q.y - q.s * 0.045)} L${n(q.x + q.s * 0.035)},${n(q.y)} L${n(q.x)},${n(q.y + q.s * 0.045)} L${n(q.x - q.s * 0.035)},${n(q.y)} Z" fill="${C("#e8c868")}"/>`;
    if (sd < 0 && j === 3) { const a = FP(u0 + 0.02, v0 + 0.15), b = FP(u0 + 0.1, v0 + 0.07), d = FP(u0 + 0.18, v0 + 0.03); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)} L${n(d.x)},${n(d.y)}" stroke="${INK}" stroke-width="${n(Math.max(0.8, a.s * 0.004))}" fill="none"/>`; }
  }
  const ro = FP(0.02, 1.05); s += `<circle cx="${n(ro.x)}" cy="${n(ro.y)}" r="${n(ro.s * 0.06)}" fill="${C("#3f4a44")}" stroke="${INK}" stroke-width="${LW(ro.s)}"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${n(ro.x)},${n(ro.y)} l${n(Math.cos(i * 1.05) * ro.s * 0.05)},${n(Math.sin(i * 1.05) * ro.s * 0.05)}" stroke="${INK}" stroke-width="${n(Math.max(0.7, ro.s * 0.004))}"/>`).join("");
  s += ln3(c, [[-1.86, 1.12, bz - 0.071], [-0.56, 1.13, bz - 0.071]], C("#1a221e"), 0.012, 384) + ln3(c, [[-1.86, 0.98, bz - 0.071], [-0.56, 0.975, bz - 0.071]], C("#1a221e"), 0.008, 385);
  // the fire itself: coals in an iron basket, flames redrawn on twos
  if (vis(c, bz - 0.1)) {
    const fb = FP(0, 0.14), k = fb.s / 100;
    let f = "";
    const coal = [[-26, -6, 9], [-12, -9, 10], [3, -7, 11], [18, -9, 9], [28, -5, 8], [-18, -16, 8], [-3, -18, 9], [12, -17, 8], [24, -14, 6]];
    for (const [x, y, r] of coal) f += `<path d="M${x - r},${y + r * 0.5} L${x - r * 0.6},${y - r * 0.6} L${x + r * 0.3},${y - r * 0.8} L${x + r},${y - r * 0.1} L${x + r * 0.6},${y + r * 0.6} Z" fill="${mix("#1a0c0c", "#ff5a1a", 0.12 + 0.3 * fk * hash(x + fl * 0.1))}"/>`;
    for (let i = 0; i < 8; i++) { const [x, y, r] = coal[i]; f += `<path d="M${x - r * 0.4},${y} l${n(r * 0.4)},${n(-r * 0.3)} l${n(r * 0.3)},${n(r * 0.4)}" stroke="${mix("#a8301a", "#ffd23a", fk * hash(i + fl * 0.3))}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`; }
    if (fire > 0.12) {
      const tongue = (x, w, h, sd, col) => { const lean = jit(sd + fl * 0.61, 5) + Math.sin(t * 3 + sd) * 2, tip = h * (0.75 + 0.5 * hash(sd * 3 + fl * 0.9)) * fire; return `<path d="M${n(x - w)},-14 Q${n(x - w * 1.1)},${n(-14 - tip * 0.5)} ${n(x + lean)},${n(-14 - tip)} Q${n(x + w * 0.5)},${n(-14 - tip * 0.55)} ${n(x + w)},-14 Z" fill="${col}" stroke="none"/>`; };
      [[-22, 9, 34], [-9, 11, 52], [5, 12, 60], [19, 10, 44], [28, 7, 26], [-30, 6, 22]].forEach(([x, w, h], i) => { f += tongue(x, w, h, i, C("#f2541a", 0.25)); });
      [[-18, 6, 26], [-6, 8, 38], [7, 8, 44], [19, 6, 30]].forEach(([x, w, h], i) => { f += tongue(x, w, h, i + 10, C("#ffab1f", 0.2)); });
      [[-4, 4.5, 22], [8, 4.5, 26]].forEach(([x, w, h], i) => { f += tongue(x, w, h, i + 20, "#fff0a8"); });
      for (let i = 0; i < 7; i++) { const a = (t * (0.5 + hash(i) * 0.5) + hash(i + 4)) % 1; f += `<path d="M0,-1.6 L1.2,0 L0,1.6 L-1.2,0 Z" fill="#ffd86a" stroke="none" opacity="${n((1 - a) * fire)}" transform="translate(${n(-26 + hash(i + 7) * 52 + Math.sin(t * 2 + i) * 4)},${n(-30 - a * 62)})"/>`; }
    }
    for (const x of [-34, -23, -12, -1, 10, 21, 33]) f += `<path d="M${x},-18 L${x + jit(x, 0.8)},2" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    f += `<path d="M-37,-17 Q0,-13 37,-17 M-37,-4 Q0,0 37,-4" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-36,-4 L-38,14 M36,-4 L38,14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<g transform="translate(${n(fb.x)},${n(fb.y)}) scale(${k.toFixed(4)})">${f}</g>`;
  }
  // hearth stone, fender, coal scuttle, poker
  s += box(c, -2.0, -0.4, 0, 0.035, 5.68, bz, [C("#8a8078"), C("#a09488"), C("#5a5048")], 390);
  s += ln3(c, [[-1.0, 0.037, 5.7], [-0.86, 0.037, 5.9], [-0.9, 0.037, 6.05]], C("#4a4038"), 0.005, 391);
  s += box(c, -1.9, -0.5, 0.035, 0.13, 5.72, 5.75, [C("#c8983a"), C("#e0b050"), C("#8a6420")], 392);
  for (let i = 0; i < 11; i++) { const q = PZ(c, -1.82 + i * 0.125, 0.085, 5.72); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(q.s * 0.016)}" fill="${C("#5a3a10")}"/>`; }
  s += spr(c, -0.56, 0.035, 5.98, `<path d="M-11,0 L-14,-22 L13,-26 L11,0 Z" fill="${C("#4a4a52")}"/><path d="M-14,-22 Q0,-34 13,-26" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M-12,-22 l5,-5 l6,3 l5,-5 l6,3 l3,0 L13,-26 L-14,-22 Z" fill="${C("#1a1418")}"/><path d="M-12.6,-12 L12,-14" stroke="${C("#2a2a30")}" stroke-width="0.8" fill="none"/>`);
  s += ln3(c, [[-1.9, 0.04, 6.0], [-1.98, 0.95, 6.07]], INK, 0.03) + ln3(c, [[-1.9, 0.04, 6.0], [-1.98, 0.95, 6.07]], C("#6a6a72"), 0.016);
  // the mantel shelf and what lives on it
  s += box(c, -2.06, -0.34, 1.2, 1.27, 5.96, bz, [C("#2f3a34"), C("#46544c"), C("#1a221e")], 395);
  const pend = Math.sin(t * Math.PI) * 14;
  s += spr(c, -1.2, 1.27, 6.04, `<path d="M-13,0 L-13,-20 Q-13,-34 0,-34 Q13,-34 13,-20 L13,0 Z" fill="${C("#6a3d24")}"/><path d="M-15,0 L15,0 L15,-3 L-15,-3 Z" fill="${C("#4a2816")}"/><circle cx="0" cy="-21" r="9" fill="${C("#f2e8cc")}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${n(Math.sin(i * 0.5236) * 7)},${n(-21 - Math.cos(i * 0.5236) * 7)} L${n(Math.sin(i * 0.5236) * 8.2)},${n(-21 - Math.cos(i * 0.5236) * 8.2)}" stroke="${INK}" stroke-width="${i % 3 ? 0.35 : 0.7}"/>`).join("")}<path d="M0,-21 L-4.6,-24.4 M0,-21 L-1.2,-28.4" stroke="${INK}" stroke-width="0.8" stroke-linecap="round"/><path d="M-3,-10 L3,-10 L3,-4 L-3,-4 Z" fill="${C("#2a1610")}"/><g transform="rotate(${n(pend)} 0 -11)"><path d="M0,-10 L0,-6" stroke="${C("#d8a838")}" stroke-width="0.5"/><circle cx="0" cy="-5.6" r="1.3" fill="${C("#d8a838")}" stroke-width="0.3"/></g>`);
  s += spr(c, -1.75, 1.27, 6.04, `<path d="M-6,0 Q-8,-6 -5,-10 Q-7,-15 -3,-18 L-4,-22 L-1,-20 Q3,-21 4,-17 L7,-15.6 L4.6,-13.6 Q6,-8 4,-4 L6,0 Z" fill="${C("#efe6d6")}"/><circle cx="1.4" cy="-17" r="0.7" fill="${INK}" stroke="none"/><path d="M-4.6,-10 q3.6,1.6 7.4,-0.4" stroke="${C("#c8983a")}" stroke-width="0.8" fill="none"/><path d="M-3,-5 l1,-1 M0,-4 l1,-1.2 M-2,-13 l1.2,-0.6" stroke="${C("#a85a3a")}" stroke-width="0.6" fill="none"/>`);
  s += spr(c, -1.48, 1.27, 6.06, `<path d="M-5,0 L-5,-11 L5,-11 L5,0 Z" fill="${C("#8a3a3a")}"/><path d="M-5.6,-11 L5.6,-11 L4.6,-14 L-4.6,-14 Z" fill="${C("#a84a44")}"/><path d="M-3,-3 L3,-3 L3,-8 L-3,-8 Z" fill="${C("#e8c868")}" stroke-width="0.3"/>`);
  s += spr(c, -0.86, 1.27, 6.08, `<path d="M-6,0 L-7,-15 L6,-16 L7,0 Z" fill="${C("#b8862a")}"/><path d="M-4.4,-2.4 L-5,-12.6 L4.2,-13.4 L4.8,-2.4 Z" fill="${C("#d8c8a0")}"/><circle cx="-0.6" cy="-9.6" r="2" fill="${C("#7a5a4a")}" stroke-width="0.3"/><path d="M-3.4,-2.6 Q-0.6,-9 2.6,-2.6 Z" fill="${C("#4a3a4a")}" stroke-width="0.3"/>`, 3);
  s += spr(c, -0.58, 1.27, 6.04, `<path d="M-5,0 L5,0 L3,-2.4 L1,-3 L1,-12 L3,-13.4 L-3,-13.4 L-1,-12 L-1,-3 L-3,-2.4 Z" fill="${C("#c8983a")}"/><path d="M-1.6,-13.4 L-1.6,-22 L1.6,-21 L1.6,-13.4 Z" fill="${C("#f2ead8")}"/><path d="M1.6,-18 q1.4,2 0.6,4.4 M0,-21.6 l0,-2" stroke="${INK}" stroke-width="0.45" fill="none"/>`);
  // a little table with the oil lamp by the window
  const LP = PARLOUR.lamp;
  s += box(c, LP.X - 0.03, LP.X + 0.03, 0, 0.7, LP.Z - 0.03, LP.Z + 0.03, [C("#5a3220")], 400) + box(c, LP.X - 0.2, LP.X + 0.2, 0.7, 0.74, LP.Z - 0.17, LP.Z + 0.17, [C("#7d4a2c"), C("#96603a"), C("#4a2a18")], 402);
  s += spr(c, LP.X, 0.74, LP.Z - 0.02, `<path d="M-13,0.6 L13,0.6 L10,3.4 L5,2 L0,4 L-6,2.2 L-10,3.6 Z" fill="${C("#efe6d0")}" stroke-width="0.4"/><path d="M-7,0 L7,0 L5,-3 L2,-4 L3,-9 Q9,-12 8,-18 L-8,-18 Q-9,-12 -3,-9 L-2,-4 L-5,-3 Z" fill="${C("#c8983a")}"/><path d="M-7.6,-18 Q-8,-14 -3,-11.6 L3,-11.6 Q8,-14 7.6,-18 Z" fill="${C("#7a9a8a", 0.4)}" stroke-width="0.4"/><path d="M-4,-18 L4,-18 L3.4,-21.4 L-3.4,-21.4 Z" fill="${C("#8a6420")}"/><path d="M-3.6,-21.4 Q-7.6,-28 -3.4,-35 L-2.6,-47 L2.6,-47 L3.4,-35 Q7.6,-28 3.6,-21.4 Z" fill="${lamp > 0.1 ? "#fff3c0" : C("#a8c0b0", 0.4)}" opacity="${lamp > 0.1 ? 0.92 : 0.5}"/>${lamp > 0.1 ? `<path d="M0,-22 Q-3,-26 0,-${n(31 + Math.sin(t * 9) * 0.8)} Q3,-26 0,-22 Z" fill="#ff9a2a" stroke="none"/>` : ""}<path d="M5.6,-20 l3.6,-0.4" stroke="${INK}" stroke-width="0.9"/>`);
  if (lamp > 0.1) { const q = P(c, LP.X, 1.03, LP.Z); s += pool(q.x, q.y, 0.75 * q.s, 0.62 * q.s, C("#ffc247", 0.3), 0.1 * lamp, 404, 2, t); }
  // the rug: worn through in front of the fire, a corner turned over, fringes of uneven length
  const R = pl(c, [-1.75, 0.004, 5.92], [3.7, 0, 0], [0, 0, -1.6]);
  s += sh(pq(R, 0, 1, 0, 1), C("#8a2a2a"), 410, { k: 5 }) + pg(pq(R, 0.035, 0.965, 0.08, 0.92), C("#d8a05a")) + pg(pq(R, 0.05, 0.95, 0.115, 0.885), C("#6a1f2a"));
  s += pg([R(0.5, 0.2), R(0.72, 0.5), R(0.5, 0.8), R(0.28, 0.5)], C("#2f4a5a")) + pg([R(0.5, 0.3), R(0.64, 0.5), R(0.5, 0.7), R(0.36, 0.5)], C("#d8a05a")) + pg([R(0.5, 0.4), R(0.57, 0.5), R(0.5, 0.6), R(0.43, 0.5)], C("#8a2a2a"));
  for (const [u, v] of [[0.12, 0.25], [0.88, 0.25], [0.12, 0.75], [0.88, 0.75], [0.2, 0.5], [0.8, 0.5]]) s += pg([R(u, v - 0.09), R(u + 0.035, v), R(u, v + 0.09), R(u - 0.035, v)], C("#d8a05a")) + pg([R(u, v - 0.04), R(u + 0.016, v), R(u, v + 0.04), R(u - 0.016, v)], C("#2f4a5a"));
  for (let i = 0; i < 12; i++) { const u = 0.07 + i * 0.078; s += pg([R(u, 0.14), R(u + 0.02, 0.165), R(u, 0.19), R(u - 0.02, 0.165)], C("#d8a05a")) + pg([R(u, 0.81), R(u + 0.02, 0.835), R(u, 0.86), R(u - 0.02, 0.835)], C("#d8a05a")); }
  s += `<path d="${wpath([R(0.1, 0.1), R(0.2, 0.06), R(0.31, 0.12), R(0.29, 0.26), R(0.18, 0.3), R(0.09, 0.22)], 412, 2, true, 3)}" fill="${C("#b08a6a")}" opacity="0.75"/><path d="${wpath([R(0.6, 0.86), R(0.7, 0.84), R(0.74, 0.93), R(0.63, 0.96)], 413, 2, true, 3)}" fill="${C("#b08a6a")}" opacity="0.7"/>`;
  for (let i = 0; i < 6; i++) { const a = R(0.11 + i * 0.03, 0.12 + hash(i) * 0.14), b = R(0.13 + i * 0.03, 0.16 + hash(i) * 0.14); s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${C("#6a1f2a")}" stroke-width="${n(Math.max(0.7, a.s * 0.004))}"/>`; }
  s += sh([R(1, 1), R(0.955, 1), R(0.985, 0.93), R(1, 0.9)], C("#c8a888"), 414, { k: 1 });
  for (const u of [0, 1]) for (let i = 0; i < 20; i++) { const v = 0.02 + i * 0.05 - (u && i > 17 ? 1 : 0), a = R(u, v), b = R(u + (u ? 1 : -1) * (0.012 + 0.014 * hash(i + u * 30)), v + jit(i + u * 7, 0.012)); if (v < 0) continue; s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" stroke="${C("#e8d8b0")}" stroke-width="${n(Math.max(0.8, a.s * 0.006))}" stroke-linecap="round"/>`; }
  // firelight on the floor and round the grate: flat rings that jump with the flames
  if (fire > 0.05) { const q = P(c, -1.2, 0, 5.3), q2 = P(c, -1.2, 0.5, bz); s += pool(q.x, q.y, 1.5 * q.s, 0.3 * q.s, C("#ff9a2a", 0.3), 0.13 * fk, 420, 3, t) + pool(q2.x, q2.y, 0.8 * q2.s, 0.75 * q2.s, C("#ff9a2a", 0.3), 0.09 * fk, 424, 2, t); }
  // furniture, far to near
  s += armchair(c, m, PARLOUR.mother.X, PARLOUR.mother.Z, "#9a5a6a", 430, { w: 0.27, h: 1.0, noArms: true });
  s += armchair(c, m, PARLOUR.father.X, PARLOUR.father.Z, "#8a2f2a", 440) + armchair(c, m, PARLOUR.sonSeat.X, PARLOUR.sonSeat.Z, "#3f5a3a", 450);
  // the knitting basket: balls of wool, needles, a sock half done, a strand that has wandered off across the rug
  s += spr(c, -1.22, 0, 4.85, `<path d="M-19,0 L-23,-19 L23,-19 L19,0 Z" fill="${C("#b8862a")}"/>${[-15, -10, -5].map((y) => `<path d="M${-19 - (y + 0) * -0.2},${y} Q0,${y + 2.4} ${19 + y * -0.2},${y}" stroke="${C("#7a5418")}" stroke-width="0.7" fill="none"/>`).join("")}${[-16, -9, -2, 5, 12].map((x) => `<path d="M${x},-19 L${x * 0.86},0" stroke="${C("#7a5418")}" stroke-width="0.6" fill="none"/>`).join("")}<path d="M-24,-19 L24,-19 L24,-22.4 L-24,-22.4 Z" fill="${C("#c8983a")}"/><circle cx="-10" cy="-27" r="8" fill="${C("#c8a02a")}"/><path d="M-17,-29 q7,-5 13,1 M-17,-25 q8,-4 14,1 M-13,-34 q5,6 4,14" stroke="${C("#8a6a10")}" stroke-width="0.6" fill="none"/><circle cx="6" cy="-25.6" r="6.6" fill="${C("#a83a3a")}"/><path d="M0.4,-27 q6,-4 11.6,0 M1,-23 q6,3 10.6,-1" stroke="${C("#6a1a1a")}" stroke-width="0.6" fill="none"/><circle cx="16" cy="-23" r="4.6" fill="${C("#5a7a9a")}"/><path d="M-3,-22 L20,-45 M3,-22 L-14,-47" stroke="${C("#e8e0d0")}" stroke-width="1" stroke-linecap="round"/><circle cx="20.4" cy="-45.4" r="1" fill="${C("#e8e0d0")}" stroke-width="0.3"/><path d="M12,-22 L25,-21 L27,-4 Q22,2 16,-3 L15,-10 Z" fill="${C("#a83a3a")}"/><path d="M14,-18 l11.6,0.6 M14.6,-14 l11.4,0.6 M15,-10 l11.4,0.6 M16,-6 l10.6,0.8" stroke="${C("#d88a7a")}" stroke-width="0.5" fill="none" stroke-dasharray="1.2 0.8"/><path d="M17,-3 q2,5 -3,6 q-9,2 -16,-1 q-10,-4 -20,1 q-8,3 -13,-2" stroke="${C("#a83a3a")}" stroke-width="0.8" fill="none" stroke-linecap="round"/><path d="M-22,3 l-2,-2.4 M-12,1.6 l1,-2.6 M2,5 l-1,2.4 M11,5.4 l1.6,2 M-30,3.6 l-0.6,2.6" stroke="${C("#a83a3a")}" stroke-width="0.35" fill="none"/>`);
  if (!st.noTable) s += parlourTable(c, t, m);
  return s;
}

// ---------------------------------------------------------------- the empty road outside the front door
// Origin = the doorstep, looking out (+Z). Garden path and gate, then a cobbled road running away, one gas lamp on the
// left, a hedge, a laburnum on the right, dark cottages far off, mist. Nobody there. st = { lamp 0..1 }
export const ROAD = { lamp: { X: -1.75, Z: 8 }, tree: { X: 2.15, Z: 4.6 }, gate: { Z: 2.3 } };
const rcx = (z) => 0.006 * z * z;
export function road(c, t, m, st = {}) {
  const C = (col, k) => tone(m, col, k), hy = c.h0 ?? 1140, LA = ROAD.lamp;
  const fstep = Math.floor(t * 9), lf = (st.lamp ?? 1) * (hash(fstep * 1.3) > 0.88 ? 0.55 : 0.86 + 0.14 * hash(fstep * 2.1));
  let s = `<rect width="${W}" height="${H}" fill="${C("#16286a")}"/>`;
  const dy = (c.y - 1.3) * 26, mx = 742 - c.x * 16, my = 360 + dy;
  for (let i = 0; i < 38; i++) { const x = hash(i + 2) * W - c.x * 6, y = hash(i + 60) * (hy - 260) + dy, r = 1.2 + 2.4 * hash(i + 9) ** 2; s += `<path d="M${n(x - r)},${n(y)} L${n(x)},${n(y - r * 1.5)} L${n(x + r)},${n(y)} L${n(x)},${n(y + r * 1.5)} Z" fill="${C("#eaf2ff", 0.1)}" opacity="${n(0.35 + 0.5 * hash(i + 4) * (0.7 + 0.3 * Math.sin(t * 2 + i)))}"/>`; }
  s += `<circle cx="${n(mx)}" cy="${n(my)}" r="92" fill="${C("#3a5aae")}" opacity="0.55"/><circle cx="${n(mx)}" cy="${n(my)}" r="62" fill="${C("#f4f8ff", 0.05)}" stroke="${INK}" stroke-width="2.5"/>`;
  for (const [ax, ay, r] of [[-22, -16, 11], [16, 20, 8], [-26, 24, 6], [24, -26, 5], [-4, 4, 4]]) s += `<path d="${wpath(Array.from({ length: 7 }, (_, i) => ({ x: mx + ax + Math.cos(i * 0.9) * r, y: my + ay + Math.sin(i * 0.9) * r })), ax, 1)}" fill="${C("#b6d1f4", 0.2)}"/>`;
  for (let i = 0; i < 4; i++) { const x = ((hash(i + 13) * 1500 + t * (5 + 4 * hash(i))) % 1700) - 320, y = 250 + i * 120 + 30 * hash(i + 9) + dy, w = 380 + 260 * hash(i + 4); s += `<path d="${wpath([{ x, y }, { x: x + w * 0.25, y: y - 30 }, { x: x + w * 0.5, y: y - 14 }, { x: x + w * 0.75, y: y - 34 }, { x: x + w, y: y - 4 }, { x: x + w * 0.8, y: y + 18 }, { x: x + w * 0.3, y: y + 22 }], i + 70, 2, true, 2)}" fill="${C(i % 2 ? "#3355ab" : "#24408c")}" opacity="0.8"/>`; }
  // far hills, a church, the dark cottages down the road
  const hill = (y, col, k, amp, sd) => `<path d="${wpath(Array.from({ length: 14 }, (_, i) => ({ x: -60 + i * 100 - c.x * k, y: y - amp * hash(i * 3 + sd) })).concat([{ x: 1240, y: y + 500 }, { x: -60, y: y + 500 }]), sd, 2)}" fill="${col}"/>`;
  s += hill(hy - 36, C("#1c3378"), 6, 80, 5);
  const ch = P(c, -9, 0, 60); s += `<path d="M${n(ch.x)},${n(ch.y - 9 * ch.s)} L${n(ch.x + 0.9 * ch.s)},${n(ch.y - 5 * ch.s)} L${n(ch.x + 0.9 * ch.s)},${n(ch.y)} L${n(ch.x - 0.9 * ch.s)},${n(ch.y)} L${n(ch.x - 0.9 * ch.s)},${n(ch.y - 5 * ch.s)} Z M${n(ch.x + 0.9 * ch.s)},${n(ch.y - 3.2 * ch.s)} l${n(4 * ch.s)},0 l0,${n(3.2 * ch.s)} l${n(-4 * ch.s)},0 Z" fill="${C("#152a6a")}"/>`;
  s += hill(hy - 6, C("#13235c"), 10, 40, 9);
  s += `<rect x="0" y="${n(hy)}" width="${W}" height="${H}" fill="${C("#1a3a4a")}"/>`;
  for (const [X, Z, w, h, sd] of [[-5.5, 34, 5, 3, 1], [6.5 + rcx(30), 30, 4.4, 2.8, 2], [-6, 24, 4.6, 3, 3], [7 + rcx(21), 21, 4.2, 2.7, 4], [-6.5, 16, 4.6, 2.9, 5]]) {
    if (!vis(c, Z)) continue;
    const b = P(c, X + rcx(Z) * (X < 0 ? 1 : 0), 0, Z), k = b.s, col = C(sd % 2 ? "#1a2f70" : "#172860");
    s += `<path d="${wpath([{ x: b.x - w / 2 * k, y: b.y }, { x: b.x - w / 2 * k, y: b.y - h * k }, { x: b.x - (w / 2 + 0.3) * k, y: b.y - h * k }, { x: b.x - w * 0.12 * k, y: b.y - (h + 1.7) * k }, { x: b.x + (w / 2 + 0.3) * k, y: b.y - h * k }, { x: b.x + w / 2 * k, y: b.y - h * k }, { x: b.x + w / 2 * k, y: b.y }], sd + 80, 2)}" fill="${col}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
    s += `<rect x="${n(b.x + w * 0.2 * k)}" y="${n(b.y - (h + 1.9) * k)}" width="${n(0.5 * k)}" height="${n(1.2 * k)}" fill="${col}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
    for (const [wx, wy] of [[-0.3, 0.62], [0.22, 0.62], [0.22, 0.2]]) s += `<rect x="${n(b.x + wx * w * k)}" y="${n(b.y - wy * h * k - 0.5 * k)}" width="${n(0.6 * k)}" height="${n(0.7 * k)}" fill="${C("#0b1238")}"/><path d="M${n(b.x + wx * w * k + 0.3 * k)},${n(b.y - wy * h * k - 0.5 * k)} v${n(0.7 * k)}" stroke="${col}" stroke-width="${n(0.06 * k)}"/>`;
    s += `<rect x="${n(b.x - 0.32 * w * k)}" y="${n(b.y - 1.5 * k)}" width="${n(0.7 * k)}" height="${n(1.5 * k)}" fill="${C("#0b1238")}"/>`;
  }
  const mist = (y, sd, op, sp) => { const x = ((hash(sd) * 900 + t * sp) % 1500) - 400; return `<path d="${wpath([{ x, y }, { x: x + 240, y: y - 26 }, { x: x + 560, y: y - 12 }, { x: x + 900, y: y - 30 }, { x: x + 1180, y: y }, { x: x + 900, y: y + 24 }, { x: x + 420, y: y + 30 }, { x: x + 120, y: y + 20 }], sd, 2, true, 2)}" fill="${C("#b6d1f4", 0.2)}" opacity="${op}"/>`; };
  s += mist(hy - 4, 31, 0.3, 9) + mist(hy + 26, 32, 0.22, -7);
  // the road: cobbles, brighter and wet under the lamp
  const lx = LA.X + rcx(LA.Z), lit = (x, z) => lf * clamp(1 - Math.hypot((x - lx - 1.0) / 2.3, (z - LA.Z + 0.6) / 3.4)) ** 1.2;
  s += cobbles(c, m, (z) => -1.5 + rcx(z), (z) => 1.5 + rcx(z), 2.3, 42, [C("#27407e"), C("#30509a"), C("#c8dcff", 0.25), C("#9ab8ee", 0.2)], 500, lit);
  for (let i = 0; i < 5; i++) { const z = 5.2 + i * 1.3 + hash(i) * 0.5, x = lx + 0.5 + hash(i + 3) * 1.6, q = pj(c, [[x - 0.05, 0.003, z + 0.5], [x + 0.07, 0.003, z + 0.5], [x + 0.1, 0.003, z], [x - 0.02, 0.003, z]]); s += pg(q, C("#eaf2ff", 0.1), `opacity="${n(0.5 * lf)}"`); }
  for (const [x, z, r] of [[0.6, 4.4, 0.42], [-0.7, 11, 0.6], [1.0, 15, 0.7]]) { const pts = Array.from({ length: 10 }, (_, i) => PZ(c, x + rcx(z) + Math.cos(i * 0.628) * r * (0.8 + 0.4 * hash(i + z)), 0.003, z + Math.sin(i * 0.628) * r * 0.6)); s += `<path d="${wpath(pts, z, 1)}" fill="${C("#6f95da")}" opacity="0.85"/>`; const q = PZ(c, x + rcx(z), 0.003, z); s += `<ellipse cx="${n(q.x + q.s * 0.05)}" cy="${n(q.y)}" rx="${n(q.s * r * 0.4)}" ry="${n(q.s * r * 0.05)}" fill="none" stroke="${C("#dcebfa", 0.15)}" stroke-width="${n(Math.max(0.8, q.s * 0.006))}" opacity="0.7"/>`; }
  // the hedge down the left, clump by clump; a low stone wall on the right
  for (let z = 24, i = 0; z > 2.6; z -= 0.45 + z * 0.045, i++) {
    if (!vis(c, z)) continue;
    const X = -2.75 + rcx(z) + jit(i, 0.12), q = P(c, X, 0, z), k = q.s, hh = 1.05 + 0.3 * hash(i + 5);
    const pts = Array.from({ length: 9 }, (_, j) => { const a = Math.PI + j / 8 * Math.PI, r = 0.85 + 0.3 * hash(i * 9 + j); return { x: q.x + Math.cos(a) * 0.95 * k * r, y: q.y + Math.sin(a) * hh * k * r }; });
    s += `<path d="${wpath(pts.concat([{ x: q.x + 0.95 * k, y: q.y + 0.04 * k }, { x: q.x - 0.95 * k, y: q.y + 0.04 * k }]), i + 600, 2, true, 2.5)}" fill="${C(i % 3 ? "#173a52" : "#1d4660")}" stroke="${INK}" stroke-width="${LW(k)}"/>`;
    if (z - c.z < 14) for (let j = 0; j < 9; j++) { const ax = q.x + (hash(i * 7 + j) - 0.5) * 1.5 * k, ay = q.y - (0.15 + hash(i * 5 + j + 2) * 0.8) * hh * k; s += `<path d="M${n(ax)},${n(ay)} q${n(0.05 * k)},${n(-0.06 * k)} ${n(0.1 * k)},0 q${n(-0.05 * k)},${n(0.04 * k)} ${n(-0.1 * k)},0" fill="${C(lit(X + 1.3, z) > 0.2 ? "#5a8ac0" : "#2a5a74")}"/>`; }
  }
  for (let z = 22; z > 6.2; z -= 1.3) if (vis(c, z)) { const X = 2.3 + rcx(z); s += box(c, X, X + 0.35, 0, 0.62 + 0.08 * hash(z), z, z + 1.32, [C("#3a5a8a"), C("#4a6a9a"), C("#22386a")], 620 + z); for (let k = 0; k < 4; k++) s += ln3(c, [[X, 0.15 + (k % 2) * 0.24, z + 0.1 + k * 0.3], [X, 0.2 + (k % 2) * 0.24, z + 0.36 + k * 0.3]], C("#14244c"), 0.006, z + k); }
  // the gas lamp: a fluted iron post, a four-sided lantern, a small unsteady flame
  if (vis(c, LA.Z)) {
    const g = P(c, lx + 1.0, 0, LA.Z - 0.6), b = P(c, lx, 0, LA.Z);
    s += pool(g.x, g.y, 2.3 * g.s, 0.55 * g.s, C("#cfe2ff", 0.2), 0.1 * lf, 640, 3, t);
    const cone = [{ x: b.x - 0.12 * b.s, y: b.y - 3.0 * b.s }, { x: b.x + 0.12 * b.s, y: b.y - 3.0 * b.s }, { x: g.x + 1.9 * g.s, y: g.y }, { x: g.x - 1.9 * g.s, y: g.y }];
    s += `<path d="${wpath(cone, 641, 2)}" fill="${C("#cfe2ff", 0.2)}" opacity="${n(0.07 * lf)}" style="mix-blend-mode:screen"/>`;
    const iron = C("#0d1638"), ed = C("#3a5aa0");
    s += spr(c, lx, 0, LA.Z, `<path d="M-13,0 L-11,-8 L-7,-10 L-6,-34 L-4.4,-38 L-3.6,-236 L3.6,-236 L4.4,-38 L6,-34 L7,-10 L11,-8 L13,0 Z" fill="${iron}"/><path d="M-1.6,-36 L-1.2,-234 M1.6,-36 L1.3,-234" stroke="${ed}" stroke-width="0.7" fill="none"/><path d="M-7,-10 L7,-10 M-6,-34 L6,-34 M-5,-120 L5,-120 L5,-124 L-5,-124 Z M-6,-236 L6,-236 L6,-241 L-6,-241 Z" fill="${iron}"/><path d="M-22,-226 L22,-226" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M-22,-226 L22,-226" stroke="${iron}" stroke-width="2" stroke-linecap="round"/><path d="M-9,-241 L-17,-286 L17,-286 L9,-241 Z" fill="${lf > 0.7 ? C("#f4f8ff", 0.06) : C("#9cc1ec", 0.15)}"/><path d="M0,-241 L0,-286 M-9,-241 L-17,-286 M9,-241 L17,-286" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M0,-246 Q-3.4,-253 0,-${n(262 + 3 * hash(fstep))} Q3.4,-253 0,-246 Z" fill="${C("#fff6c8", 0.05)}" stroke="${C("#ffc247", 0.1)}" stroke-width="0.8"/><path d="M-21,-286 L21,-286 L11,-300 L5,-302 L4,-309 L-4,-309 L-5,-302 L-11,-300 Z" fill="${iron}"/><circle cx="0" cy="-312" r="3" fill="${iron}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * 0.785 + 0.3, r0 = 34 + (i % 2) * 6, r1 = r0 + 10 + 8 * hash(i + fstep); return `<path d="M${n(Math.cos(a) * r0)},${n(-264 + Math.sin(a) * r0)} L${n(Math.cos(a) * r1)},${n(-264 + Math.sin(a) * r1)}" stroke="${C("#eaf2ff", 0.1)}" stroke-width="1.6" stroke-linecap="round" opacity="${n(0.75 * lf)}"/>`; }).join("")}`);
  }
  // the laburnum: its yellow chains of flowers swing in the wind
  const TR = ROAD.tree;
  if (vis(c, TR.Z)) {
    const wind = Math.sin(t * 1.4) * 5 + Math.sin(t * 3.1 + 1) * 3, bark = C("#152a52"), lf1 = C("#1d4a5a"), lf2 = C("#27607a"), yel = C("#f2d83a", 0.42);
    const br = [[0, -150, -70, -250], [0, -160, 20, -290], [4, -140, 90, -230], [-2, -120, -110, -190], [2, -170, -20, -320], [3, -110, 120, -170]];
    let g = `<path d="M-11,0 Q-6,-60 -9,-120 L-4,-180 L6,-178 L9,-110 Q7,-50 12,0 Z" fill="${bark}"/><path d="M-3,-20 q2,-30 -1,-60 M4,-40 q-2,-30 1,-70 M-6,-8 l3,-10" stroke="${C("#3355ab")}" stroke-width="0.9" fill="none"/>`;
    for (const [x0, y0, x1, y1] of br) g += `<path d="M${x0},${y0} Q${(x0 + x1) / 2 + 10},${(y0 + y1) / 2 - 20} ${x1},${y1}" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x0},${y0} Q${(x0 + x1) / 2 + 10},${(y0 + y1) / 2 - 20} ${x1},${y1}" stroke="${bark}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const blobs = [[-80, -262, 62, 40], [10, -306, 78, 46], [96, -246, 60, 40], [-112, -200, 46, 30], [-24, -338, 52, 30], [124, -182, 44, 28], [40, -250, 50, 30]];
    blobs.forEach(([x, y, rx, ry], i) => { const pts = Array.from({ length: 11 }, (_, j) => ({ x: x + Math.cos(j * 0.571) * rx * (0.82 + 0.32 * hash(i * 11 + j)), y: y + Math.sin(j * 0.571) * ry * (0.82 + 0.32 * hash(i * 13 + j)) })); g += `<path d="${wpath(pts, i + 700, 1)}" fill="${i % 2 ? lf1 : lf2}" transform="rotate(${n(wind * 0.25)} ${x} ${y + 40})"/>`; });
    for (let i = 0; i < 34; i++) {
      const b = blobs[i % blobs.length], x = b[0] + (hash(i + 3) - 0.5) * b[2] * 1.7, y = b[1] + b[3] * (0.2 + 0.7 * hash(i + 11)), len = 5 + Math.floor(hash(i + 20) * 5), a = wind * (0.8 + 0.6 * hash(i + 6)) + jit(i, 4);
      let ch = "";
      for (let j = 0; j < len; j++) ch += `<path d="M${n(((j % 2) - 0.5) * 3.4)},${j * 6.4} q${j % 2 ? 3.4 : -3.4},2.4 0,6 q${j % 2 ? -1.6 : 1.6},-3 0,-6 Z" fill="${yel}" stroke-width="0.4"/>`;
      g += `<g transform="translate(${n(x)},${n(y)}) rotate(${n(a)})"><path d="M0,0 L0,${len * 6.4}" stroke="${C("#27607a")}" stroke-width="0.7"/>${ch}</g>`;
    }
    s += `<ellipse cx="${n(P(c, TR.X, 0, TR.Z).x)}" cy="${n(P(c, TR.X, 0, TR.Z).y)}" rx="${n(1.3 * P(c, TR.X, 0, TR.Z).s)}" ry="${n(0.22 * P(c, TR.X, 0, TR.Z).s)}" fill="${INK}" opacity="0.35"/>` + spr(c, TR.X, 0, TR.Z, g, 3);
    for (let i = 0; i < 16; i++) { const q = PZ(c, TR.X - 1.2 + hash(i + 2) * 2.2, 0.004, TR.Z - 0.9 + hash(i + 8) * 1.6); s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(q.s * 0.022)}" ry="${n(q.s * 0.009)}" fill="${yel}"/>`; }
  }
  // the garden: flagged path, a picket fence with a paling gone, the gate left open
  const gz = ROAD.gate.Z;
  if (vis(c, gz)) {
    s += face(c, [[-6, 0.002, 0], [6, 0.002, 0], [6, 0.002, gz], [-6, 0.002, gz]], C("#17344a"), 720, { stroke: "none" });
    for (const [x0, x1, z0, z1] of [[-0.55, 0.1, 0.05, 0.75], [0.15, 0.6, 0.1, 0.6], [-0.5, 0.52, 0.8, 1.4], [-0.6, -0.05, 1.46, 2.25], [0.0, 0.58, 1.48, 2.2]]) s += face(c, [[x0, 0.004, z1], [x1 - 0.03, 0.004, z1 - 0.02], [x1, 0.004, z0 + 0.02], [x0 + 0.03, 0.004, z0]], C("#4a6aa0"), 722 + x0 * 3 + z0, { k: 2 });
    for (let i = 0; i < 16; i++) { const q = PZ(c, -1.9 + hash(i + 4) * 3.8, 0, 0.3 + hash(i + 14) * 1.8), k = q.s * 0.01; if (Math.abs(q.x - PZ(c, 0, 0, 1).x) < 0.5 * q.s) continue; s += `<path d="M${n(q.x - 4 * k)},${n(q.y)} l${n(1.5 * k)},${n(-9 * k)} l${n(2 * k)},${n(7 * k)} l${n(2.4 * k)},${n(-11 * k)} l${n(1.6 * k)},${n(11 * k)} l${n(2.6 * k)},${n(-7 * k)} l${n(0.6 * k)},${n(9 * k)} Z" fill="${C("#27607a")}"/>`; }
    for (let x = -5.6, i = 0; x < 5.6; x += 0.2, i++) {
      if (Math.abs(x) < 0.66 || i === 9 || i === 44) continue;
      const hh = 0.9 + 0.07 * hash(i + 2), lean = jit(i, 0.02), q = [PZ(c, x - 0.065, 0, gz), PZ(c, x - 0.065 + lean, hh - 0.08, gz), PZ(c, x + lean, hh, gz), PZ(c, x + 0.065 + lean, hh - 0.08, gz), PZ(c, x + 0.065, 0, gz)];
      s += sh(q, C(i % 4 ? "#7a9ad8" : "#6a8ac8"), 730 + i, { k: 1 });
    }
    for (const sd of [-1, 1]) for (const y of [0.28, 0.66]) s += ln3(c, [[sd * 0.66, y, gz + 0.02], [sd * 5.6, y + 0.01, gz + 0.02]], C("#3a56a6"), 0.03, 740 + y + sd);
    for (const sd of [-1, 1]) s += box(c, sd * 0.66 - 0.06, sd * 0.66 + 0.06, 0, 1.12, gz - 0.06, gz + 0.06, [C("#8aaae0"), C("#a8c4f0"), C("#3a56a6")], 744 + sd);
    // the gate, swung inward on its right post, moving a little
    const ga = 1.15 + Math.sin(t * 1.1) * 0.05, GT = pl(c, [0.6, 0, gz - 0.06], [-Math.cos(ga), 0, -Math.sin(ga)], [0, 1, 0]);
    for (let i = 0; i < 6; i++) s += sh([GT(0.06 + i * 0.2, 0), GT(0.06 + i * 0.2, 0.86 + (i % 2) * 0.05), GT(0.12 + i * 0.2, 0.93 + (i % 2) * 0.05), GT(0.18 + i * 0.2, 0.86 + (i % 2) * 0.05), GT(0.18 + i * 0.2, 0)], C("#7a9ad8"), 750 + i, { k: 1 });
    s += `<path d="M${n(GT(0, 0.28).x)},${n(GT(0, 0.28).y)} L${n(GT(1.2, 0.28).x)},${n(GT(1.2, 0.28).y)} M${n(GT(0, 0.66).x)},${n(GT(0, 0.66).y)} L${n(GT(1.2, 0.66).x)},${n(GT(1.2, 0.66).y)} M${n(GT(0, 0.3).x)},${n(GT(0, 0.3).y)} L${n(GT(1.2, 0.64).x)},${n(GT(1.2, 0.64).y)}" stroke="${C("#3a56a6")}" stroke-width="${n(GT(0, 0).s * 0.03)}" stroke-linecap="round"/>`;
  }
  s += mist(hy + 120, 33, 0.14, 14);
  // one leaf blown across
  { const u = (t * 0.22 + 0.3) % 1, x = -80 + u * 1300, y = hy + 330 + Math.sin(u * 14) * 40; s += `<path d="M-9,0 Q0,-7 10,0 Q0,6 -9,0 Z" fill="${C("#5a8ac0")}" stroke="${INK}" stroke-width="1.2" transform="translate(${n(x)},${n(y)}) rotate(${n(t * 260)})"/>`; }
  return s;
}

// ---------------------------------------------------------------- the hall: the inside of the front door
// Hall: X -1..1, ceiling 2.7, the door in the end wall at Z 5 (HALL.Z), 0.96 m wide, hinged on the left, opening inward.
// A heavy bolt at the top (HALL.bolt), a second at the foot, a chain, a rim lock. The son's coat and cap still hang
// on the pegs. st = { knock 0..1 (the door shudders, dust falls), bolt 0..1 (top bolt drawn back), bolt2 0..1 (foot bolt;
// default = bolt), chain 0|1 (default on while shut), open 0..1 (swings in; the empty road shows through),
// outside: mood for the road (default "road") }
export const HALL = { Z: 5, bolt: { X: 0.28, Y: 1.84, Z: 4.96 }, knob: { X: 0.36, Y: 1.0 }, mother: { X: 0.1, Z: 4.55 }, mat: { X: 0, Z: 4.7 } };
export function frontDoor(c, t, m, st = {}) {
  const C = (col, k) => tone(m, col, k), zb = HALL.Z, zn = c.z + 0.26, kn = st.knock || 0, op = st.open || 0, bolt = st.bolt || 0, bolt2 = st.bolt2 ?? bolt, chain = st.chain ?? (op > 0.02 ? 0 : 1);
  const paper = ["#3f6a6a", "#356060", "#a8c8a0", "#4a2a1c", "#3a2014"];
  let s = shell(c, m, 1.0, 2.7, zb, ["#a8b8a0"], 800);
  s += wallpaper(c, m, pl(c, [0, 0, zb], [1, 0, 0], [0, 1, 0]), -1, 1, paper, 801);
  const um = zb - zn;
  s += wallpaper(c, m, pl(c, [-1, 0, zb], [0, 0, -1], [0, 1, 0]), 0, um, paper, 811) + wallpaper(c, m, pl(c, [1, 0, zb], [0, 0, -1], [0, 1, 0]), 0, um, paper, 821);
  // floor: clay tiles laid in a check, a few cracked
  for (let z = zb - 0.25, j = 0; z > zn - 0.25; z -= 0.25, j++) for (let i = 0; i < 8; i++) {
    const x = -1 + i * 0.25, id = i * 7 + j * 13, col = (i + j) % 2 ? mix("#a8482e", "#9a3a26", hash(id)) : mix("#d8c49a", "#c8b088", hash(id));
    const q = pj(c, [[x, 0, z + 0.25], [x + 0.25, 0, z + 0.25], [x + 0.25, 0, z], [x, 0, z]]);
    if (off(q)) continue;
    s += pg(q, C(col), `stroke="${C("#3a2014")}" stroke-width="${LW(q[0].s) * 0.7}"`);
    if (hash(id + 3) > 0.86 && z > zn + 0.1) s += ln3(c, [[x + 0.03, 0.001, z + 0.2], [x + 0.12, 0.001, z + 0.11], [x + 0.22, 0.001, z + 0.06]], C("#3a2014"), 0.004, id);
  }
  // the fanlight over the door and the moonlight it throws on the tiles
  const DW = pl(c, [0, 0, zb], [1, 0, 0], [0, 1, 0]);
  s += sh(pq(DW, -0.62, 0.62, 2.62, 0), C("#2a1810"), 830);
  const fan = [DW(-0.48, 2.12), DW(-0.46, 2.34), DW(-0.3, 2.5), DW(0, 2.56), DW(0.3, 2.5), DW(0.46, 2.34), DW(0.48, 2.12)];
  s += sh(fan, C("#8fb6f2", 0.3), 831, { k: 1 });
  for (const [x, y] of [[-0.44, 2.4], [-0.24, 2.52], [0, 2.56], [0.24, 2.52], [0.44, 2.4]]) s += `<path d="M${n(DW(0, 2.12).x)},${n(DW(0, 2.12).y)} L${n(DW(x, y).x)},${n(DW(x, y).y)}" stroke="${C("#2a1810")}" stroke-width="${n(DW(0, 0).s * 0.022)}"/>`;
  s += `<path d="${wpath(pj(c, [[-0.3, 0.002, 4.2], [0.3, 0.002, 4.25], [0.62, 0.002, 3.1], [-0.52, 0.002, 3.0]]), 833, 2)}" fill="${C("#9cc4ff", 0.2)}" opacity="0.22" style="mix-blend-mode:screen"/>`;
  // through the doorway: the road
  if (op > 0.01) {
    const o = pj(c, [[-0.48, 2.06, zb], [0.48, 2.06, zb], [0.48, 0, zb], [-0.48, 0, zb]]);
    s += `<clipPath id="dway"><polygon points="${o.map((p) => `${n(p.x)},${n(p.y)}`).join(" ")}"/></clipPath><g clip-path="url(#dway)">${road({ ...c, z: c.z - zb }, t, typeof st.outside === "object" ? st.outside : mood(st.outside || "road"), st)}</g>`;
    s += box(c, -0.56, 0.56, 0, 0.05, zb - 0.02, zb + 0.2, [C("#8a8078"), C("#a09488"), C("#5a5048")], 835);
    const sp = pj(c, [[-0.46, 0.003, zb], [0.46, 0.003, zb], [0.46 + 1.1 * op, 0.003, zb - 2.6], [-0.46 - 0.2 * op, 0.003, zb - 2.6]]);
    s += `<path d="${wpath(sp, 836, 2)}" fill="${C("#b6d1f4", 0.15)}" opacity="${n(0.3 * op)}" style="mix-blend-mode:screen"/>`;
  }
  // the door leaf
  const a = op * 1.75, sx = kn * 0.011 * Math.sin(t * 61) + kn * 0.006 * Math.sin(t * 37), DL = pl(c, [-0.48 + sx * (1 - op), 0, zb - 0.01 - Math.abs(sx) * 0.5], [Math.cos(a), 0, -Math.sin(a)], [0, 1, 0]);
  const dcol = "#2f5a4a", ds = DL(0.5, 1).s, lw = LW(ds);
  let d = sh(pq(DL, 0, 0.96, 2.05, 0), C(dcol), 840, { k: 4 });
  if (op > 0.02) d += sh([DL(0.96, 2.05), PZ(c, -0.48 + Math.cos(a) * 0.96 + Math.sin(a) * 0.05, 2.05, zb - Math.sin(a) * 0.96 + Math.cos(a) * 0.05), PZ(c, -0.48 + Math.cos(a) * 0.96 + Math.sin(a) * 0.05, 0, zb - Math.sin(a) * 0.96 + Math.cos(a) * 0.05), DL(0.96, 0)], C("#1c3a30"), 841);
  for (const [u0, u1, v0, v1, sd] of [[0.1, 0.44, 1.72, 1.12, 1], [0.52, 0.86, 1.72, 1.12, 2], [0.1, 0.44, 0.84, 0.24, 3], [0.52, 0.86, 0.84, 0.24, 4]]) {
    d += sh(pq(DL, u0, u1, v0, v1), C("#264a3c"), 842 + sd, { k: 2 });
    d += `<path d="M${n(DL(u0 + 0.02, v1 + 0.025).x)},${n(DL(u0 + 0.02, v1 + 0.025).y)} L${n(DL(u1 - 0.02, v1 + 0.025).x)},${n(DL(u1 - 0.02, v1 + 0.025).y)} L${n(DL(u1 - 0.02, v0 - 0.03).x)},${n(DL(u1 - 0.02, v0 - 0.03).y)}" fill="none" stroke="${C("#4a7a66")}" stroke-width="${n(ds * 0.008)}" stroke-linejoin="round"/>`;
    const g0 = DL(u0 + 0.08 + 0.1 * hash(sd), v0 - 0.08), g1 = DL(u0 + 0.1 + 0.1 * hash(sd), lerp(v0, v1, 0.6)); d += `<path d="M${n(g0.x)},${n(g0.y)} Q${n(g0.x + ds * 0.02)},${n((g0.y + g1.y) / 2)} ${n(g1.x)},${n(g1.y)}" fill="none" stroke="${C("#1c3a30")}" stroke-width="${n(ds * 0.004)}"/>`;
  }
  // chipped paint down to the wood, worst at the foot and round the lock
  for (const [u, v, r, sd] of [[0.06, 0.07, 0.05, 1], [0.3, 0.04, 0.035, 2], [0.62, 0.09, 0.06, 3], [0.9, 0.05, 0.04, 4], [0.47, 0.5, 0.03, 5], [0.82, 0.92, 0.035, 6], [0.05, 1.3, 0.025, 7], [0.48, 1.9, 0.03, 8], [0.91, 1.5, 0.022, 9], [0.2, 0.96, 0.02, 10], [0.7, 1.99, 0.025, 11]])
    d += `<path d="${wpath(Array.from({ length: 6 }, (_, i) => DL(u + Math.cos(i * 1.05 + sd) * r * (0.5 + 0.7 * hash(sd * 7 + i)), v + Math.sin(i * 1.05 + sd) * r * (0.5 + 0.7 * hash(sd * 9 + i)))), sd + 850, 1)}" fill="${C("#b08a5a")}" stroke="${C("#1c3a30")}" stroke-width="${n(ds * 0.004)}"/>`;
  for (let i = 0; i < 5; i++) d += `<path d="M${n(DL(0.8 + hash(i) * 0.06, 0.86 - i * 0.02).x)},${n(DL(0, 0.86 - i * 0.02).y)} l${n(ds * (0.03 + 0.03 * hash(i + 4)))},${n(ds * 0.012)}" stroke="${C("#b08a5a")}" stroke-width="${n(ds * 0.003)}"/>`;
  // letter box, rim lock and knob
  d += sh(pq(DL, 0.3, 0.66, 0.99, 0.91), C("#c8983a"), 861, { k: 1 }) + sh(pq(DL, 0.33, 0.63, 0.97, 0.93), C("#8a6420"), 862, { k: 1 });
  d += sh(pq(DL, 0.72, 0.955, 1.14, 0.93), C("#16161c"), 863, { k: 1 });
  const kb = DL(0.84, 1.07), kh = DL(0.84, 0.975);
  d += `<circle cx="${n(kb.x)}" cy="${n(kb.y)}" r="${n(ds * 0.038)}" fill="${C("#d8a838")}" stroke="${INK}" stroke-width="${lw}"/><circle cx="${n(kb.x - ds * 0.01)}" cy="${n(kb.y - ds * 0.012)}" r="${n(ds * 0.012)}" fill="${C("#fff0b0", 0.3)}"/><path d="M${n(kh.x)},${n(kh.y - ds * 0.012)} l0,${n(ds * 0.03)}" stroke="${C("#d8a838")}" stroke-width="${n(ds * 0.012)}" stroke-linecap="round"/>`;
  // the bolts: an iron bar in two staples, shot into a keeper on the frame
  const boltAt = (v, b, sd, big) => {
    const h = big ? 0.034 : 0.024, o = b * 0.24;
    let r = sh(pq(DL, 0.46, 0.95, v + h * 2.1, v - h * 2.1), C("#22222a"), sd, { k: 1 });
    r += `<path d="M${n(DL(0.56 - o, v).x)},${n(DL(0.56 - o, v).y)} L${n(DL(1.02 - o, v).x)},${n(DL(1.02 - o, v).y)}" stroke="${INK}" stroke-width="${n(ds * h * 2 + lw * 2)}" stroke-linecap="round"/><path d="M${n(DL(0.56 - o, v).x)},${n(DL(0.56 - o, v).y)} L${n(DL(1.02 - o, v).x)},${n(DL(1.02 - o, v).y)}" stroke="${C("#7a7a86")}" stroke-width="${n(ds * h * 2)}" stroke-linecap="round"/><path d="M${n(DL(0.58 - o, v + h * 0.4).x)},${n(DL(0.58 - o, v + h * 0.4).y)} L${n(DL(1.0 - o, v + h * 0.4).x)},${n(DL(1.0 - o, v + h * 0.4).y)}" stroke="${C("#b8b8c4")}" stroke-width="${n(ds * h * 0.5)}" stroke-linecap="round"/>`;
    for (const u of [0.56, 0.86]) r += sh(pq(DL, u, u + 0.05, v + h * 1.7, v - h * 1.7), C("#16161c"), sd + u * 10, { k: 1 });
    const kq = DL(0.72 - o, v), kq2 = DL(0.72 - o, v - h * 3.2);
    r += `<path d="M${n(kq.x)},${n(kq.y)} L${n(kq2.x)},${n(kq2.y)}" stroke="${INK}" stroke-width="${n(ds * h * 1.3 + lw * 2)}" stroke-linecap="round"/><path d="M${n(kq.x)},${n(kq.y)} L${n(kq2.x)},${n(kq2.y)}" stroke="${C("#7a7a86")}" stroke-width="${n(ds * h * 1.3)}" stroke-linecap="round"/><circle cx="${n(kq2.x)}" cy="${n(kq2.y)}" r="${n(ds * h * 1.25)}" fill="${C("#9a9aa6")}" stroke="${INK}" stroke-width="${lw}"/>`;
    return r;
  };
  d += boltAt(HALL.bolt.Y, bolt, 870, true) + boltAt(0.16, bolt2, 880, false);
  // the chain
  const cp = DL(0.88, 1.4), fp = DW(0.55, 1.44), rat = kn * Math.sin(t * 43) * 0.02 * ds;
  d += sh(pq(DL, 0.6, 0.93, 1.43, 1.37), C("#22222a"), 890, { k: 1 });
  const links = (x0, y0, cx, cy, x1, y1) => `<path d="M${n(x0)},${n(y0)} Q${n(cx)},${n(cy)} ${n(x1)},${n(y1)}" fill="none" stroke="${INK}" stroke-width="${n(ds * 0.022)}" stroke-linecap="round"/><path d="M${n(x0)},${n(y0)} Q${n(cx)},${n(cy)} ${n(x1)},${n(y1)}" fill="none" stroke="${C("#a8a8b4")}" stroke-width="${n(ds * 0.012)}" stroke-dasharray="${n(ds * 0.022)} ${n(ds * 0.012)}" stroke-linecap="round"/>`;
  const chainS = chain > 0.5 ? links(cp.x, cp.y, (cp.x + fp.x) / 2 + rat, Math.max(cp.y, fp.y) + ds * 0.09 + Math.abs(rat), fp.x, fp.y) : links(fp.x, fp.y, fp.x + ds * 0.02 + rat, fp.y + ds * 0.12, fp.x + Math.sin(t * 2.2) * ds * 0.012 + rat, fp.y + ds * 0.26);
  // frame, keepers on the frame
  let fr = "";
  for (const sd of [-1, 1]) fr += box(c, sd * 0.56 - 0.08, sd * 0.56 + 0.08, 0, 2.1, zb - 0.07, zb, [C("#5a3a26"), C("#6a4630"), C("#2a1810")], 895 + sd);
  fr += box(c, -0.64, 0.64, 2.06, 2.14, zb - 0.08, zb, [C("#5a3a26"), C("#6a4630"), C("#2a1810")], 898);
  const FR = pl(c, [0, 0, zb - 0.071], [1, 0, 0], [0, 1, 0]);
  for (const v of [HALL.bolt.Y, 0.16]) fr += sh(pq(FR, 0.49, 0.6, v + 0.06, v - 0.06), C("#16161c"), 899 + v, { k: 1 });
  fr += sh(pq(FR, 0.52, 0.6, 1.48, 1.4), C("#22222a"), 902, { k: 1 });
  s += op > 0.02 ? fr + d + chainS : d + fr + chainS;
  // knocking: the blows land as ink marks round the door, grit drops from the lintel
  if (kn > 0.02) {
    const cc = DW(0, 1.25), k = cc.s, ph = Math.floor(t * 10);
    for (let i = 0; i < 8; i++) { const sd = i < 4 ? -1 : 1, yy = (i % 4 - 1.5) * 0.3 + jit(i + ph, 0.06), r0 = 0.72 + 0.06 * hash(i + ph), r1 = r0 + 0.1 + 0.14 * kn * hash(i * 3 + ph); s += `<path d="M${n(cc.x + sd * r0 * k)},${n(cc.y + yy * k)} L${n(cc.x + sd * r1 * k)},${n(cc.y + yy * 1.25 * k)}" stroke="${m.hot}" stroke-width="${n(k * 0.016 * (0.6 + kn))}" stroke-linecap="round" opacity="${n(clamp(kn * 1.3))}"/>`; }
    for (let i = 0; i < 9; i++) { const a2 = (t * (0.9 + hash(i)) + hash(i + 5)) % 1, q = DW(-0.5 + hash(i + 2) * 1.0, 2.08 - a2 * a2 * 1.6); s += `<rect x="${n(q.x)}" y="${n(q.y)}" width="${n(k * 0.008)}" height="${n(k * 0.012)}" fill="${C("#d8c8a8")}" opacity="${n((1 - a2) * kn)}"/>`; }
  }
  // doormat
  const M = pl(c, [-0.42, 0.006, 4.9], [0.84, 0, 0], [0, 0, -0.42]);
  s += sh(pq(M, 0, 1, 0, 1), C("#8a6a3a"), 905, { k: 4, amp: 2.5 }) + pg(pq(M, 0.06, 0.94, 0.12, 0.88), C("#7a5a2e"));
  for (let i = 0; i < 26; i++) { const a2 = M(hash(i + 3), hash(i + 9)), b2 = M(hash(i + 3) + 0.02, hash(i + 9) - 0.07); s += `<path d="M${n(a2.x)},${n(a2.y)} L${n(b2.x)},${n(b2.y)}" stroke="${C(i % 2 ? "#a88a50" : "#5a4020")}" stroke-width="${n(Math.max(0.8, a2.s * 0.005))}"/>`; }
  // the left wall: a peg rail with the son's coat, his scarf, his cap
  const LWl = pl(c, [-1, 0, zb], [0, 0, -1], [0, 1, 0]);
  if (zn < 4.0) {
    s += sh(pq(LWl, 0.2, 1.3, 1.72, 1.64), C("#4a2a1c"), 910, { k: 2 });
    for (const u of [0.35, 0.72, 1.12]) { const q = LWl(u, 1.68), q2 = PZ(c, -0.9, 1.7, zb - u); s += `<path d="M${n(q.x)},${n(q.y)} L${n(q2.x)},${n(q2.y)}" stroke="${INK}" stroke-width="${n(q.s * 0.035)}" stroke-linecap="round"/><path d="M${n(q.x)},${n(q.y)} L${n(q2.x)},${n(q2.y)}" stroke="${C("#c8983a")}" stroke-width="${n(q.s * 0.02)}" stroke-linecap="round"/>`; }
    const CT = pl(c, [-0.92, 0, zb - 0.72], [0, 0, -1], [0, 1, 0]);
    s += sh([CT(-0.02, 1.7), CT(0.04, 1.72), CT(0.2, 1.5), CT(0.26, 0.62), CT(0.14, 0.56), CT(0.02, 0.6), CT(-0.14, 0.55), CT(-0.24, 0.62), CT(-0.2, 1.5)], C("#3a3f5a"), 912, { k: 3 });
    s += `<path d="M${n(CT(0, 1.66).x)},${n(CT(0, 1.66).y)} L${n(CT(0.02, 0.6).x)},${n(CT(0.02, 0.6).y)} M${n(CT(-0.12, 1.2).x)},${n(CT(-0.12, 1.2).y)} L${n(CT(-0.13, 0.9).x)},${n(CT(-0.13, 0.9).y)}" stroke="${C("#1a1e36")}" stroke-width="${n(CT(0, 1).s * 0.008)}" fill="none"/>` + [1.3, 1.1, 0.9].map((v) => `<circle cx="${n(CT(0.05, v).x)}" cy="${n(CT(0.05, v).y)}" r="${n(CT(0, 1).s * 0.014)}" fill="${C("#c8983a")}"/>`).join("");
    const SC = pl(c, [-0.92, 0, zb - 0.35], [0, 0, -1], [0, 1, 0]);
    s += sh([SC(-0.04, 1.7), SC(0.05, 1.7), SC(0.07, 1.0), SC(-0.03, 0.98)], C("#a83a3a"), 914, { k: 3 }) + sh([SC(0.03, 1.7), SC(0.1, 1.68), SC(0.13, 1.2), SC(0.06, 1.18)], C("#8a2a2a"), 915, { k: 2 });
    for (let i = 0; i < 4; i++) s += `<path d="M${n(SC(-0.02 + i * 0.025, 0.99).x)},${n(SC(0, 0.99).y)} l0,${n(SC(0, 1).s * 0.05)}" stroke="${C("#a83a3a")}" stroke-width="${n(SC(0, 1).s * 0.006)}"/>`;
    s += spr(c, -0.9, 1.69, zb - 1.12, `<path d="M-12,2 Q-14,10 -8,16 Q0,20 9,16 Q14,10 12,2 Q0,-3 -12,2 Z" fill="${C("#6f6d48")}"/><path d="M-9,15 Q0,24 10,15 Q4,19 -9,15 Z" fill="${C("#55532f")}"/><path d="M-8,6 l3,-2 l3,2 M2,9 l3,-2 l3,2 M-4,12 l3,-2 l3,2" stroke="${C("#3f3d22")}" stroke-width="0.5" fill="none"/>`);
  }
  // the right wall: a sampler in a frame, an umbrella stand
  if (zn < 4.2) {
    const RW = pl(c, [1, 0, zb - 0.5], [0, 0, -1], [0, 1, 0]);
    s += sh(pq(RW, 0, 0.5, 1.75, 1.3), C("#3a2014"), 920, { k: 1 }) + pg(pq(RW, 0.04, 0.46, 1.71, 1.34), C("#e6d6a6"));
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { const q = RW(0.09 + i * 0.065, 1.63 - j * 0.1); s += `<path d="M${n(q.x - q.s * 0.012)},${n(q.y - q.s * 0.012)} l${n(q.s * 0.024)},${n(q.s * 0.024)} m0,${n(-q.s * 0.024)} l${n(-q.s * 0.024)},${n(q.s * 0.024)}" stroke="${C(j === 1 ? "#a83a3a" : "#3f5a8a")}" stroke-width="${n(q.s * 0.005)}"/>`; }
  }
  s += spr(c, 0.82, 0, 4.72, `<path d="M-11,0 L-12,-52 L12,-52 L11,0 Z" fill="${C("#5a4a3a")}"/><path d="M-12,-52 L12,-52 M-11.6,-30 L11.6,-30 M-11.2,-8 L11.2,-8" stroke="${C("#c8983a")}" stroke-width="1.6" fill="none"/><path d="M-4,-52 L-8,-98 Q-9,-106 -3,-106 Q1,-105 0,-100" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-4,-52 L-8,-98 Q-9,-106 -3,-106 Q1,-105 0,-100" stroke="${C("#8a5a3a")}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M2,-52 L4,-88 L9,-92 L8,-52 Z" fill="${C("#1a1e36")}"/><path d="M6.4,-90 L7.4,-104" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`);
  return s;
}

// ---------------------------------------------------------------- the factory gate (Maw & Meggins)
// A brick wall across at Z 8, iron gates shut, the works and its chimneys behind, wet cobbles, and the son's cap lying
// where it fell (FACTORY.cap). st = { cap: false to leave it out (draw flatCap yourself) }
export const FACTORY = { wall: 8, cap: { X: 0.35, Z: 4.3 } };
export function factoryGate(c, t, m, st = {}) {
  const C = (col, k) => tone(m, col, k), hy = c.h0 ?? 1140, wz = FACTORY.wall;
  let s = `<rect width="${W}" height="${H}" fill="${C("#5f86c4")}"/>`;
  const dy = (c.y - 1.3) * 26;
  for (let i = 0; i < 5; i++) { const x = ((hash(i + 13) * 1500 + t * (7 + 5 * hash(i))) % 1700) - 320, y = 90 + i * 150 + 30 * hash(i + 9) + dy, w = 420 + 300 * hash(i + 4); s += `<path d="${wpath([{ x, y }, { x: x + w * 0.25, y: y - 36 }, { x: x + w * 0.5, y: y - 16 }, { x: x + w * 0.75, y: y - 40 }, { x: x + w, y: y - 4 }, { x: x + w * 0.8, y: y + 22 }, { x: x + w * 0.3, y: y + 28 }], i + 70, 2, true, 2)}" fill="${C(i % 2 ? "#7ea2da" : "#4a70b4")}" opacity="0.85"/>`; }
  // the works: saw-tooth sheds, two stacks, smoke that leans with the wind
  const fb = P(c, 0, 0, 22), k = fb.s, bc = C("#274a8c");
  let roof = [{ x: fb.x - 16 * k, y: fb.y }, { x: fb.x - 16 * k, y: fb.y - 6 * k }];
  for (let i = 0; i < 8; i++) roof.push({ x: fb.x + (-16 + i * 4) * k, y: fb.y - 8.2 * k }, { x: fb.x + (-12 + i * 4) * k, y: fb.y - 6 * k });
  roof.push({ x: fb.x + 16 * k, y: fb.y });
  for (const [X, h, w] of [[-5.5, 19, 1.5], [7.5, 15, 1.3]]) {
    const top = { x: fb.x + X * k, y: fb.y - h * k };
    for (let i = 0; i < 8; i++) { const a = (t * 0.1 + i / 8) % 1, r = (1.1 + a * 3.4) * k, px = top.x + (a * 9 + Math.sin(t + i) * 0.4) * k, py = top.y - (0.6 + a * 6.5) * k; s += `<path d="${wpath(Array.from({ length: 9 }, (_, j) => ({ x: px + Math.cos(j * 0.698) * r * (0.8 + 0.4 * hash(i * 9 + j)), y: py + Math.sin(j * 0.698) * r * 0.72 * (0.8 + 0.4 * hash(i * 7 + j)) })), i + X, 1)}" fill="${C(i % 2 ? "#bcd0ec" : "#9cb6e0")}" opacity="${n(0.9 * (1 - a) ** 0.7)}"/>`; }
    s += `<path d="${wpath([{ x: top.x - w * 0.36 * k, y: top.y }, { x: top.x + w * 0.36 * k, y: top.y }, { x: top.x + w * 0.5 * k, y: fb.y }, { x: top.x - w * 0.5 * k, y: fb.y }], X + 3, 3)}" fill="${bc}" stroke="${INK}" stroke-width="${LW(k) * 1.4}"/>`;
    for (const u of [0.04, 0.12, 0.5]) s += `<path d="M${n(top.x - w * (0.36 + 0.14 * u) * k)},${n(lerp(top.y, fb.y, u))} L${n(top.x + w * (0.36 + 0.14 * u) * k)},${n(lerp(top.y, fb.y, u))}" stroke="${C("#16306a")}" stroke-width="${n(0.22 * k)}"/>`;
  }
  s += `<path d="${wpath(roof, 940, 1)}" fill="${bc}" stroke="${INK}" stroke-width="${LW(k) * 1.4}"/>`;
  for (let i = 0; i < 8; i++) s += pg([{ x: fb.x + (-16 + i * 4) * k, y: fb.y - 8.0 * k }, { x: fb.x + (-15.6 + i * 4) * k, y: fb.y - 8.0 * k }, { x: fb.x + (-12.2 + i * 4) * k, y: fb.y - 6.1 * k }, { x: fb.x + (-16 + i * 4) * k, y: fb.y - 6.1 * k }], C("#16306a"));
  for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) { const id = i * 3 + j; if (hash(id + 2) > 0.9) continue; s += `<rect x="${n(fb.x + (-15 + i * 2.2) * k)}" y="${n(fb.y - (5 - j * 2.3) * k)}" width="${n(1.2 * k)}" height="${n(1.5 * k)}" fill="${hash(id) > 0.8 ? C("#f2d890", 0.45) : C("#12265a")}" stroke="${INK}" stroke-width="${LW(k) * 0.7}"/>`; }
  s += `<rect x="0" y="${n(hy)}" width="${W}" height="${H}" fill="${C("#2a4a86")}"/>`;
  { const x = ((t * 8) % 1500) - 300, y = hy - 30; s += `<path d="${wpath([{ x, y }, { x: x + 300, y: y - 30 }, { x: x + 700, y: y - 10 }, { x: x + 1100, y: y - 26 }, { x: x + 1100, y: y + 30 }, { x: x + 400, y: y + 36 }], 941, 2, true, 2)}" fill="${C("#9cc1ec")}" opacity="0.3"/>`; }
  // the wall: every brick laid a little off, soot under the coping, a torn bill
  if (vis(c, wz)) {
    const WL = pl(c, [0, 0, wz], [1, 0, 0], [0, 1, 0]), wk = WL(0, 0).s, bcols = ["#3a5a9a", "#34508e", "#4468aa", "#2c467e"];
    for (const [x0, x1] of [[-7, -1.3], [1.3, 7]]) {
      s += sh(pq(WL, x0, x1, 3.0, 0), C("#1c2f66"), 950 + x0);
      for (let j = 0; j < 18; j++) for (let x = x0 + 0.02 - (j % 2) * 0.2, i = 0; x < x1 - 0.03; i++) {
        const bw = 0.4 + jit(i * 7 + j * 13 + x0, 0.03), a = Math.max(x0 + 0.02, x), b = Math.min(x1 - 0.02, x + bw - 0.03), id = i * 17 + j * 5 + x0 * 3; x += bw;
        if (b - a < 0.05) continue;
        const y = 0.03 + j * 0.163, q = [WL(a, y + 0.135 + jit(id, 0.008)), WL(b, y + 0.135 + jit(id + 1, 0.008)), WL(b, y), WL(a + jit(id + 2, 0.01), y)];
        if (off(q)) continue;
        s += pg(q, C(hash(id + 9) > 0.93 ? "#5a7ab8" : bcols[Math.floor(hash(id) * 4)]));
        if (hash(id + 4) > 0.9) s += pg([q[0], { x: lerp(q[0].x, q[1].x, 0.3), y: q[0].y }, { x: q[0].x, y: lerp(q[0].y, q[3].y, 0.5) }], C("#1c2f66"));
      }
      s += sh(pq(WL, x0 - 0.05, x1 + 0.05, 3.14, 3.0), C("#7a9ad0"), 952 + x0, { k: 6 });
      for (let i = 0; i < 5; i++) { const u = lerp(x0 + 0.3, x1 - 0.5, hash(i + x0 + 9)), w = 0.3 + 0.5 * hash(i + 3), d = 0.5 + 1.2 * hash(i + x0); s += `<path d="${wpath([WL(u, 3.0), WL(u + w, 3.0), WL(u + w * 0.8, 3.0 - d * 0.5), WL(u + w * 0.45, 3.0 - d), WL(u + w * 0.15, 3.0 - d * 0.6)], i + 955, 2, true, 2)}" fill="${C("#0f1c48")}" opacity="0.45"/>`; }
    }
    s += sh([WL(-4.6, 2.2), WL(-3.5, 2.24), WL(-3.52, 1.1), WL(-3.9, 1.02), WL(-4.1, 1.16), WL(-4.62, 1.08)], C("#c8d4e8"), 960, { k: 2 });
    for (let i = 0; i < 6; i++) s += `<path d="M${n(WL(-4.45, 2.04 - i * 0.14).x)},${n(WL(0, 2.04 - i * 0.14).y)} L${n(WL(-3.66 - 0.3 * hash(i), 2.05 - i * 0.14).x)},${n(WL(0, 2.05 - i * 0.14).y)}" stroke="${C("#2a4a86")}" stroke-width="${n(wk * (i ? 0.02 : 0.05))}"/>`;
    s += sh([WL(-3.5, 2.24), WL(-3.72, 2.02), WL(-3.52, 1.96)], C("#9cb6e0"), 961, { k: 1 });
    // the gates: iron bars with spear heads, one bent; a chain and padlock
    const topY = (x) => 2.55 + 0.45 * (1 - (Math.abs(x) / 1.25) ** 2);
    for (let x = -1.2, i = 0; x <= 1.21; x += 0.15, i++) {
      const bend = i === 5 ? 0.07 : 0, ty = topY(x) + jit(i, 0.03);
      s += ln3(c, [[x, 0.08, wz], [x + bend, 1.2, wz], [x + jit(i + 3, 0.012), ty, wz]], INK, 0.05, i + 970) + ln3(c, [[x, 0.08, wz], [x + bend, 1.2, wz], [x + jit(i + 3, 0.012), ty, wz]], C("#0f1c48"), 0.03, i + 970);
      const q = WL(x + jit(i + 3, 0.012), ty); s += `<path d="M${n(q.x - wk * 0.045)},${n(q.y)} L${n(q.x)},${n(q.y - wk * 0.16)} L${n(q.x + wk * 0.045)},${n(q.y)} Z" fill="${C("#0f1c48")}" stroke="${INK}" stroke-width="${LW(wk)}"/>`;
    }
    for (const y of [0.2, 1.25, 2.45]) s += ln3(c, [[-1.25, y, wz], [-0.02, y + 0.01, wz]], INK, 0.085) + ln3(c, [[0.02, y, wz], [1.25, y - 0.01, wz]], INK, 0.085) + ln3(c, [[-1.25, y, wz], [-0.02, y + 0.01, wz]], C("#16306a"), 0.055) + ln3(c, [[0.02, y, wz], [1.25, y - 0.01, wz]], C("#16306a"), 0.055);
    const pk = WL(0, 1.25); s += `<path d="M${n(pk.x - wk * 0.16)},${n(pk.y - wk * 0.02)} Q${n(pk.x)},${n(pk.y + wk * 0.2)} ${n(pk.x + wk * 0.15)},${n(pk.y - wk * 0.03)}" fill="none" stroke="${C("#9cb6e0")}" stroke-width="${n(wk * 0.03)}" stroke-dasharray="${n(wk * 0.04)} ${n(wk * 0.02)}"/><rect x="${n(pk.x - wk * 0.06)}" y="${n(pk.y + wk * 0.09)}" width="${n(wk * 0.12)}" height="${n(wk * 0.13)}" fill="${C("#c8983a", 0.5)}" stroke="${INK}" stroke-width="${LW(wk)}"/>`;
    // pillars with stone caps, the name board across
    for (const sd of [-1, 1]) {
      s += box(c, sd * 1.52 - 0.27, sd * 1.52 + 0.27, 0, 3.5, wz - 0.25, wz + 0.2, [C("#3a5a9a"), C("#4468aa"), C("#1c2f66")], 980 + sd);
      const PF = pl(c, [sd * 1.52 - 0.27, 0, wz - 0.25], [1, 0, 0], [0, 1, 0]);
      for (let j = 0; j < 21; j++) { const y = 0.03 + j * 0.163; s += pg(pq(PF, 0.02 + (j % 2) * 0.2, 0.3 + (j % 2) * 0.22, y + 0.13, y), C(bcols[(j * 3 + (sd > 0 ? 1 : 0)) % 4])); s += `<path d="M${n(PF(0, y + 0.148).x)},${n(PF(0, y + 0.148).y)} L${n(PF(0.54, y + 0.148).x)},${n(PF(0.54, y + 0.148).y)}" stroke="${C("#1c2f66")}" stroke-width="${n(wk * 0.012)}"/>`; }
      s += box(c, sd * 1.52 - 0.36, sd * 1.52 + 0.36, 3.5, 3.68, wz - 0.34, wz + 0.2, [C("#8aaada"), C("#a8c4ee"), C("#4a6aa0")], 984 + sd);
      const bl = P(c, sd * 1.52, 3.68, wz - 0.07); s += `<circle cx="${n(bl.x)}" cy="${n(bl.y - 0.2 * bl.s)}" r="${n(0.21 * bl.s)}" fill="${C("#8aaada")}" stroke="${INK}" stroke-width="${LW(bl.s)}"/><path d="M${n(bl.x - 0.1 * bl.s)},${n(bl.y - 0.28 * bl.s)} q${n(0.08 * bl.s)},${n(-0.08 * bl.s)} ${n(0.16 * bl.s)},${n(-0.03 * bl.s)}" stroke="${C("#dcebfa")}" stroke-width="${n(0.02 * bl.s)}" fill="none"/>`;
    }
    const SB = pl(c, [0, 0, wz - 0.26], [1, 0, 0], [0, 1, 0]), a0 = SB(-1.3, 3.36), a1 = SB(1.3, 3.36), sk = a0.s;
    s += sh([SB(-1.3, 3.42), SB(-0.6, 3.98), SB(0, 4.1), SB(0.6, 3.98), SB(1.3, 3.42), SB(1.3, 3.0), SB(0.6, 3.52), SB(0, 3.62), SB(-0.6, 3.52), SB(-1.3, 3.0)], C("#12265a"), 990, { k: 2 });
    for (let i = 0; i < 9; i++) { const q = SB(-1.0 + hash(i + 2) * 2, 3.25 + (1 - Math.abs(-1.0 + hash(i + 2) * 2)) * 0.5 + hash(i + 6) * 0.2); s += `<rect x="${n(q.x)}" y="${n(q.y)}" width="${n(sk * (0.02 + 0.04 * hash(i)))}" height="${n(sk * 0.025)}" fill="${C("#12265a")}"/>`; }
    void a1;
  }
  // wet cobbles, cart ruts, a puddle with the drizzle ringing in it
  s += cobbles(c, m, () => -7, () => 7, 1.2, wz - 0.3, [C("#2f4f92"), C("#3a5ea6"), C("#9cc1ec"), C("#7ea2da")], 995, (x, z) => 0.22 * hash(Math.floor(x * 3) + Math.floor(z * 5) * 7) ** 3);
  for (const x of [-0.72, 0.7]) s += ln3(c, [[x, 0.002, wz - 0.3], [x + 0.05, 0.002, 5], [x - 0.04, 0.002, 2.5], [x, 0.002, 1]], C("#1c2f66"), 0.05, x * 9 + 997, `opacity="0.55"`);
  { const px = -1.05, pz = 4.9, pts = Array.from({ length: 12 }, (_, i) => PZ(c, px + Math.cos(i * 0.5236) * 0.8 * (0.75 + 0.4 * hash(i + 2)), 0.003, pz + Math.sin(i * 0.5236) * 0.5 * (0.75 + 0.4 * hash(i + 7)))); s += `<path d="${wpath(pts, 998, 1)}" fill="${C("#86aae0")}" stroke="${C("#1c2f66")}" stroke-width="${LW(pts[0].s)}"/>`;
    for (let i = 0; i < 4; i++) { const a = (t * 0.7 + i * 0.27) % 1, q = PZ(c, px - 0.4 + hash(i + Math.floor(t * 0.7 + i * 0.27)) * 0.8, 0.003, pz - 0.2 + hash(i * 3 + Math.floor(t * 0.7 + i * 0.27)) * 0.4); s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(q.s * 0.12 * a)}" ry="${n(q.s * 0.03 * a)}" fill="none" stroke="${C("#e2eefc")}" stroke-width="${n(Math.max(0.8, q.s * 0.005))}" opacity="${n(1 - a)}"/>`; } }
  if (st.cap !== false) s += flatCap(c, FACTORY.cap.X, 0, FACTORY.cap.Z, { m, size: 1.25, rot: -8 });
  // thin drizzle
  for (let i = 0; i < 46; i++) { const u = (hash(i + 3) + t * (1.5 + hash(i))) % 1, x = hash(i + 20) * 1300 - 100 - u * 90, y = u * 2100 - 100 + hash(i + 40) * 200; s += `<path d="M${n(x)},${n(y)} l-7,44" stroke="${C("#e2eefc")}" stroke-width="1.6" opacity="${n(0.16 + 0.2 * hash(i))}" stroke-linecap="round"/>`; }
  return s;
}

// ---------------------------------------------------------------- the told-story cast
// Built like the hosts: cm units, feet at 0, the .ol ink outline, eyes from legend.mjs. One builder, five people.
// Common st (all optional but X, Z):
//   X, Z, Y        where the feet are (metres)            fx  -0.8 (looks left) .. 0.8 (looks right), 0 = at the lens
//   talk 0..1, blink 0..1 (auto when left out), look -1..1, brow -1 angry .. 1 worried, smile -1 .. 1, wide 0..1,
//   tears 0..1, sweat 0..1, tilt deg (head), lean deg (whole body), bend deg (torso forward), m (mood: tones the figure)
//   poses: sit 0..1 (seat = seat height in m, default 0.5), kneel 0..1, crawl 0..1, walk phase, tiptoe 0..1
//   arms:  reach 0..1 (+ reachTo [x, y] cm), point 0..1, throw 0..1 (wind up, then fling), face 0..1 (both hands to the
//          face), up 0..1 (both hands high: the bolt; upX cm), hold "paw"|"cap"|"envelope"|"piece" in the leading hand,
//          holdUp 0..1 (raise it), paw {fingers, twist, glow} for a held paw, handL / handR [x, y] cm to override.
// Each returns { svg, handL, handR, head, held (screen points), p }.
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
const HELD = {
  cap: (T) => `<path d="M-9,1 Q-11,-5 -4,-7 Q4,-9 9,-5 Q11,-1 9,2 Q0,4 -9,1 Z" fill="${T("#6f6d48")}"/><path d="M-9,1 Q0,4 9,2 Q12,3.6 11,6 Q0,8 -9,1 Z" fill="${T("#55532f")}"/><path d="M-5,-3 l2,-1.6 l2,1.6 M1,-4 l2,-1.6 l2,1.6" stroke="${T("#3f3d22")}" stroke-width="0.4" fill="none"/>`,
  envelope: (T) => `<path d="M-9,-6 L9,-6.6 L9.4,5.4 L-8.6,6 Z" fill="${T("#efe6d0")}"/><path d="M-9,-6 L0.4,1 L9,-6.6" fill="none"/><circle cx="0.4" cy="1.4" r="1.6" fill="${T("#a8323a")}" stroke-width="0.3"/>`,
  piece: (T) => `<g transform="translate(0,2) scale(1.5)">${piece("n", T("#f6ead0"), T("#3a1418"))}</g>`,
};
// the face: eyes, brows, nose, mouth and the marks of age; o = per-person numbers
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
  const p = P(c, st.X, st.Y || 0, st.Z), sc = sp.scale * (st.scale || 1), w = sp.wid, m = st.m;
  const T = m ? (col, f = 1) => tone(m, col, m.kc * f) : (col) => col;
  const fx = st.fx ?? 0.5, dir = fx >= 0 ? 1 : -1, afx = Math.abs(fx);
  const sit = st.sit || 0, kn = st.kneel || 0, cr = st.crawl || 0, seat = (st.seat ?? 0.5) * 100 / sc;
  const wk = st.walk, sw = wk == null ? 0 : Math.sin(wk * Math.PI * 2), bob = wk == null ? 0 : Math.abs(Math.cos(wk * Math.PI * 2)) * 2.5;
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
  if (st.hold) { to(lead, [SLd[0] + dir * 15, SLd[1] + 30], 1 - cr * 0.6); to(lead, st.holdTo || [SLd[0] + dir * 22, SLd[1] - 12], st.holdUp || 0); kind[lead] = "fist"; }
  if (sp.both) sp.both(x, to, X2, kind);
  to(lead, st.reachTo || (cr > 0.5 ? [SLd[0] + dir * 46, -9] : [SLd[0] + dir * 46, SLd[1] + 6]), st.reach || 0);
  if (st.point) { to(lead, [SLd[0] + dir * 50, SLd[1] - 5], st.point); if (st.point > 0.5) kind[lead] = "point"; }
  if (st.throw) { const u = st.throw; if (u < 0.5) to(lead, [SLd[0] - dir * 10, SLd[1] - 46], ease(u * 2)); else { to(lead, [SLd[0] - dir * 10, SLd[1] - 46], 1); to(lead, [SLd[0] + dir * 48, SLd[1] + 14], ease((u - 0.5) * 2, "out")); } }
  if (st.offer) to(lead, [SLd[0] + dir * 44, SLd[1] + 16], st.offer);
  if (st.face) { to("L", [Hd[0] - 8.5 * HS + fx * 3, Hd[1] + 8 * HS], st.face); to("R", [Hd[0] + 8.5 * HS + fx * 3, Hd[1] + 8 * HS], st.face); }
  if (st.up) { const ux = st.upX ?? dir * 8; to("L", [Hd[0] + ux - 7, Hd[1] - 44], st.up); to("R", [Hd[0] + ux + 7, Hd[1] - 46], st.up); kind.L = kind.R = st.up > 0.7 ? "fist" : "open"; }
  if (st.handL) { tg.L = st.handL; rest.L = false; } if (st.handR) { tg.R = st.handR; rest.R = false; }
  const sl = sp.sleeve, arm = {}, wristP = {};
  for (const k of ["L", "R"]) {
    const sd = k === "L" ? -1 : 1, pts = ik(S[k], tg[k], 27, 24, sd), [s0, e, wr] = pts, ang = Math.atan2(wr[1] - e[1], wr[0] - e[0]) / rad;
    const col = T(k === lead || sit ? sl.col : mix(sl.col, "#000000", 0.14)), hc = [wr[0] + Math.cos(ang * rad) * 5, wr[1] + Math.sin(ang * rad) * 5];
    let a = "";
    if (st.hold && k === lead) {
      if (st.hold === "paw") { const g = pawG({ ...(st.paw || {}), m }, t); a += `<g transform="translate(${n(hc[0])},${n(hc[1] - 1)}) rotate(${n(st.pawRot ?? dir * 8)}) scale(${st.pawSize ?? 1.15})">${g.back}${g.s}</g>`; }
      else if (HELD[st.hold]) a += `<g transform="translate(${n(hc[0])},${n(hc[1] - 2)}) rotate(${n(dir * 6)})">${HELD[st.hold](T)}</g>`;
    }
    if (sl.roll) a += limb([e, wr], 7.4 * Math.min(1.15, w), skin) + limb([s0, e], 9.4 * w, col) + `<circle cx="${n(e[0])}" cy="${n(e[1])}" r="${n(5.4 * w)}" fill="${T(mix(sl.col, "#ffffff", 0.2))}"/>`;
    else a += limb(pts, 9.4 * w, col, T(mix(sl.col, "#000000", 0.22))) + `<g transform="translate(${n(lerp(e[0], wr[0], 0.9))},${n(lerp(e[1], wr[1], 0.9))}) rotate(${n(ang)})"><path d="M-2.2,${n(-5.2 * w)} L2.2,${n(-5.2 * w)} L2.2,${n(5.2 * w)} L-2.2,${n(5.2 * w)} Z" fill="${T(sl.cuff)}"/></g>`;
    if (sp.armG) a += sp.armG(x, k, s0, e, wr);
    const flip = (k === "L") !== (Math.abs(ang) > 90) ? 1 : -1;
    a += `<g transform="translate(${n(wr[0])},${n(wr[1])}) rotate(${n(ang)}) scale(${n(sp.hand ?? 1)},${n((sp.hand ?? 1) * flip)})">${handG(kind[k], skin, skD)}</g>`;
    arm[k] = a; wristP[k] = hc;
  }
  const hr = (st.tilt || 0) - bend * (cr > 0.5 ? 0.82 : 0.5) + (st.nod || 0);
  const torso = `<g transform="translate(${n(hipX)},${n(hipY + 84)}) rotate(${n(bend)} 0 -84)">${sp.torso(x)}<path d="M${n(-4.4 * w)},-147 L${n(4.4 * w)},-147 L${n(4 * w)},-137 L${n(-4 * w)},-137 Z" fill="${T(mix(sp.skin, "#8a3a2a", 0.14), 0.6)}"/>${sp.collar ? sp.collar(x) : ""}<g transform="rotate(${n(hr)} 0 -143) translate(0,-143) scale(${HS}) translate(0,143)">${sp.head(x)}</g></g>`;
  const other = lead === "L" ? "R" : "L", behind = rest[other] && sit < 0.5 && !sp.both2;
  const body = (sit > 0.5 || sp.skirt ? "" : legs) + (sp.skirt && sit <= 0.5 ? legs : "") + (behind ? arm[other] : "") + torso + (sit > 0.5 ? legs : "") + (behind ? "" : arm[other]) + (sp.frontG ? sp.frontG(x, wristP, tg) : "") + arm[lead];
  const lean = st.lean || 0, k = sc, scr = (q) => toScreen(p, lean, q[0] * k, q[1] * k);
  return { svg: shadow(p, 0.3 * sc * (1 + cr * 0.8)) + `<g class="ol" transform="${place(p, lean)} scale(${sc})">${body}</g>`, p, handL: scr(wristP.L), handR: scr(wristP.R), held: scr(wristP[lead]), head: scr(Hd) };
}
const torsoPath = (w, col) => `<path d="M${n(-15 * w)},-138 Q${n(-17.4 * w)},-112 ${n(-13.6 * w)},-83 L${n(13.6 * w)},-83 Q${n(17.4 * w)},-112 ${n(15 * w)},-138 Q0,-144.5 ${n(-15 * w)},-138 Z" fill="${col}"/>`;

// ---- Mr White, the father: old, kind, a little foolish. Waistcoat, shirt sleeves with garters, carpet slippers,
// grey side-whiskers, wire spectacles. Poses the story needs: sit (chess), reach (into the fire), hold + holdUp (the
// wish), kneel, crawl + reach (the dark), stand.
const FATHER = {
  scale: 0.95, wid: 1, stoop: 5, skin: "#eec4a4", legs: "#3d3546", shoe: "#a8323a", seed: 1,
  sleeve: { col: "#efe6d6", cuff: "#d8cdb8" },
  shoeG: ({ T, fx }, sd) => `<path d="M${n(-5.6 + fx * 2)},0 Q${n(-6 + fx * 2)},-6.6 0,-7.4 Q${n(6.6 + fx * 5)},-6.6 ${n(6.6 + fx * 6)},0 Z" fill="${T("#a8323a")}"/><path d="M${n(-4 + fx * 3)},-3.4 l${n(9 + fx * 2)},-0.4 M${n(-1 + fx * 3)},-6.6 l0.4,6 M${n(3 + fx * 4)},-6.4 l0.4,6" stroke="${T("#5a1420")}" stroke-width="0.6" fill="none"/><path d="M${n(-5.6 + fx * 2)},0 L${n(6.6 + fx * 6)},0" stroke="${T("#e8d8b0")}" stroke-width="1"/>`,
  armG: ({ T, w }, k, s0, e) => { const a = Math.atan2(e[1] - s0[1], e[0] - s0[0]) / rad; return `<g transform="translate(${n(lerp(s0[0], e[0], 0.62))},${n(lerp(s0[1], e[1], 0.62))}) rotate(${n(a)})"><path d="M-1,-5 L1,-5 L1,5 L-1,5 Z" fill="${T("#3d3546")}" stroke-width="0.3"/></g>`; },
  torso: ({ T, w, fx }) => torsoPath(w, T("#efe6d6")) +
    `<path d="M${n(-12.6 * w)},-136 Q${n(-15.4 * w)},-112 ${n(-12.8 * w)},-88 L${n(-4 + fx * 2)},-83 L${n(fx * 2)},-87 L${n(4 + fx * 2)},-83 L${n(12.8 * w)},-88 Q${n(15.4 * w)},-112 ${n(12.6 * w)},-136 L${n(4 + fx * 2)},-116 L${n(fx * 2)},-112 L${n(-4 + fx * 2)},-116 Z" fill="${T("#9a6a2c")}"/>` +
    `<path d="M${n(5 + fx * 2)},-116 L${n(12.6 * w)},-136 Q${n(15.4 * w)},-112 ${n(12.8 * w)},-88 L${n(8 + fx * 2)},-85 Q${n(10 + fx * 2)},-104 ${n(5 + fx * 2)},-116 Z" fill="${T("#7d5320")}" stroke="none"/>` +
    [-110, -103, -96, -89].map((y, i) => `<circle cx="${n(fx * 2 + (i === 2 ? 0.5 : 0))}" cy="${y}" r="1.1" fill="${T("#3a2414")}" stroke-width="0.3"/>`).join("") +
    `<path d="M${n(fx * 2 + 0.6)},-103 Q${n(fx * 2 + 6)},-95 ${n(fx * 2 + 10.4)},-100" stroke="${T("#d8a838")}" stroke-width="0.8" fill="none"/><path d="M${n(fx * 2 + 7)},-101 L${n(fx * 2 + 12.4)},-101.6 L${n(fx * 2 + 12)},-98" stroke="${T("#5a3a14")}" stroke-width="0.5" fill="none"/><path d="M${n(-11 * w)},-96 l5,0.6" stroke="${T("#5a3a14")}" stroke-width="0.5"/><path d="M${n(-13.6 * w)},-84.4 L${n(13.6 * w)},-84.4" stroke="${T("#3d3546")}" stroke-width="3"/>`,
  collar: ({ T, fx }) => `<path d="M${n(-5 + fx)},-141 Q${n(fx * 2)},-136 ${n(5 + fx)},-141 L${n(4.6 + fx)},-137.6 Q${n(fx * 2)},-133.6 ${n(-4.6 + fx)},-137.6 Z" fill="${T("#f6f0e4")}"/><circle cx="${n(fx * 2)}" cy="-136.4" r="0.7" fill="${T("#d8a838")}" stroke-width="0.25"/>`,
  head: (x) => {
    const { T, fx } = x, o = { rx: 12.4, ry: 13.4, chin: 1.0, skin: FATHER.skin, browCol: "#d8d2c8", browW: 1.9, old: 1, nose: 1.15, blush: "#e89a8a", seed: 1, iris: "#4a5a6a", smile: 0.25, mouthY: 8.8 }, F = faceOn(x, o), { hx, hy, ex, ey } = F, hair = T("#cfc9bf"), hairS = T("#a8a298");
    const chop = (sd) => `<path d="M${n(hx + sd * 11.6)},${n(hy - 9)} Q${n(hx + sd * 15.4)},${n(hy - 6)} ${n(hx + sd * 14.4)},${n(hy - 1)} Q${n(hx + sd * 16.4)},${n(hy + 3)} ${n(hx + sd * 13.6)},${n(hy + 6)} Q${n(hx + sd * 13.4)},${n(hy + 10.4)} ${n(hx + sd * 9 + fx * 3)},${n(hy + 10.6)} Q${n(hx + sd * 7 + fx * 3)},${n(hy + 7)} ${n(hx + sd * 9.4 + fx * 2)},${n(hy + 2)} Q${n(hx + sd * 9.6 + fx)},${n(hy - 4)} ${n(hx + sd * 11.6)},${n(hy - 9)} Z" fill="${hair}"/><path d="M${n(hx + sd * 12.6)},${n(hy - 3)} l${n(-sd * 2)},2 M${n(hx + sd * 13)},${n(hy + 2)} l${n(-sd * 2.4)},1.6 M${n(hx + sd * 11.4)},${n(hy + 6.4)} l${n(-sd * 1.6)},1.4" stroke="${hairS}" stroke-width="0.5" fill="none"/>`;
    return F.head + chop(-1) + chop(1) + `<path d="M${n(hx - 7)},${n(hy - 15.4)} Q${n(hx)},${n(hy - 18.4)} ${n(hx + 8)},${n(hy - 14.6)} M${n(hx - 5)},${n(hy - 13.6)} Q${n(hx + 1)},${n(hy - 16.6)} ${n(hx + 6.4)},${n(hy - 13)}" stroke="${hair}" stroke-width="0.8" fill="none" stroke-linecap="round"/>` + F.f +
      `<circle cx="${n(ex - 5)}" cy="${n(ey + 0.2)}" r="4.5" fill="#ffffff" fill-opacity="0.12" stroke="${T("#b8862a")}" stroke-width="0.7"/><circle cx="${n(ex + 5)}" cy="${n(ey + 0.2)}" r="4.5" fill="#ffffff" fill-opacity="0.12" stroke="${T("#b8862a")}" stroke-width="0.7"/><path d="M${n(ex - 0.6)},${n(ey - 0.4)} q0.6,-1 1.2,0 M${n(ex - 9.4)},${n(ey)} L${n(hx - 12)},${n(ey - 1.4)} M${n(ex + 9.4)},${n(ey)} L${n(hx + 12)},${n(ey - 1.4)}" stroke="${T("#b8862a")}" stroke-width="0.7" fill="none"/>`;
  },
};
export const whiteFather = (c, st, t = 0) => figure(c, st, t, FATHER);

// ---- Mrs White, the mother: small, quick, warm; then all grief. Long plum dress, apron, knitted shawl, lace cap.
// Poses: sit (st.knit 0..1 = needles going), stand, reach (grabs the paw), face (hands to her face), up + tiptoe (the
// bolt), hold "paw". st.grief 0..1 loosens her hair and hollows her eyes.
const MOTHER = {
  scale: 0.9, wid: 0.95, skin: "#f0cdb4", skirt: "#4d2a4a", shoe: "#1c141c", seed: 2, both2: true,
  sleeve: { col: "#4d2a4a", cuff: "#efe6d6" },
  skirtG: ({ T, st }, sk) => { const a = sk[0], b = sk[1], hl = sk[4], hr = sk[3]; return `<path d="M${n(a[0] + 4)},${n(a[1] + 1)} L${n(b[0] - 4)},${n(b[1] + 1)} L${n(lerp(b[0], hr[0], 0.72) - 6)},${n(lerp(b[1], hr[1], 0.8))} Q${n((hl[0] + hr[0]) / 2)},${n(lerp(a[1], hl[1], 0.86))} ${n(lerp(a[0], hl[0], 0.72) + 6)},${n(lerp(a[1], hl[1], 0.8))} Z" fill="${T("#e6dcc8")}"/><path d="M${n((a[0] + b[0]) / 2 + 3)},${n(a[1] + 26)} l8,0.6 l-0.6,7.4 l-7,-0.4 Z" fill="${T("#d8cdb4")}" stroke-width="0.4"/><path d="M${n((a[0] + b[0]) / 2 - 8)},${n(a[1] + 44)} l5,-0.6 l0.6,4.6 l-5,0.4 Z" fill="${T("#c8b8d0")}" stroke-width="0.4" stroke-dasharray="1 0.6"/><path d="M${n(hl[0] + 2)},${n(hl[1] - 5)} Q${n((hl[0] + hr[0]) / 2)},${n(hl[1] - 2.4)} ${n(hr[0] - 2)},${n(hr[1] - 5)}" stroke="${T("#2f1830")}" stroke-width="1.4" fill="none"/><path d="M${n(lerp(a[0], hl[0], 0.3) - 1)},${n(lerp(a[1], hl[1], 0.3))} L${n(hl[0] + 5)},${n(hl[1] - 6)} M${n(lerp(b[0], hr[0], 0.3) + 1)},${n(lerp(b[1], hr[1], 0.3))} L${n(hr[0] - 5)},${n(hr[1] - 6)}" stroke="${T("#2f1830")}" stroke-width="0.6" fill="none"/>`; },
  both: ({ st, fx, t }, to, X2, kind) => { if (st.knit) { const j = Math.sin(t * 9) * 1.2 * st.knit; to("L", X2(-8 + fx * 4, -104 + j), st.knit); to("R", X2(8 + fx * 4, -105 - j), st.knit); kind.L = kind.R = "fist"; } },
  frontG: ({ st, T, t }, wp) => { if (!(st.knit > 0.5)) return ""; const a = wp.L, b = wp.R, j = Math.sin(t * 9) * 2; return `<path d="M${n(a[0] - 4)},${n(a[1] + 5)} L${n(b[0] + 9)},${n(b[1] - 13 + j)} M${n(b[0] + 4)},${n(b[1] + 5)} L${n(a[0] - 9)},${n(a[1] - 13 - j)}" stroke="${T("#e8e0d0")}" stroke-width="1.1" stroke-linecap="round"/><path d="M${n(a[0] + 1)},${n(a[1] + 1)} L${n(b[0] - 1)},${n(b[1] + 1)} L${n(b[0] - 2)},${n(b[1] + 17)} Q${n((a[0] + b[0]) / 2)},${n(a[1] + 21)} ${n(a[0] + 2)},${n(a[1] + 16)} Z" fill="${T("#a83a3a")}"/><path d="M${n(a[0] + 2)},${n(a[1] + 5)} L${n(b[0] - 2)},${n(b[1] + 5)} M${n(a[0] + 2)},${n(a[1] + 9)} L${n(b[0] - 2)},${n(b[1] + 9)} M${n(a[0] + 2)},${n(a[1] + 13)} L${n(b[0] - 2)},${n(b[1] + 13)}" stroke="${T("#d88a7a")}" stroke-width="0.5" fill="none" stroke-dasharray="1.2 0.8"/><path d="M${n(a[0] + 3)},${n(a[1] + 17)} q-6,12 -16,16 q-6,3 -5,9" stroke="${T("#a83a3a")}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`; },
  torso: ({ T, w, fx }) => torsoPath(w, T("#4d2a4a")) +
    [-124, -116, -108].map((y) => `<circle cx="${n(fx * 2)}" cy="${y}" r="0.9" fill="${T("#2a1428")}" stroke-width="0.25"/>`).join("") +
    `<path d="M${n(-11.5 * w)},-100 L${n(11.5 * w)},-100 L${n(11.8 * w)},-96 L${n(-11.8 * w)},-96 Z" fill="${T("#e6dcc8")}"/>` +
    // the shawl: knitted, crossed on the chest, fringed
    `<path d="M${n(-16.4 * w)},-137 Q${n(-8)},-146 0,-142 Q8,-146 ${n(16.4 * w)},-137 Q${n(19 * w)},-120 ${n(15 * w)},-108 L${n(4 + fx * 2)},-112 L${n(1 + fx * 2)},-100 L${n(-5 + fx * 2)},-102 L${n(-3 + fx * 2)},-113 L${n(-15 * w)},-108 Q${n(-19 * w)},-120 ${n(-16.4 * w)},-137 Z" fill="${T("#b5553c")}"/>` +
    `<path d="M${n(4 + fx * 2)},-136 L${n(16.4 * w)},-137 Q${n(19 * w)},-120 ${n(15 * w)},-108 L${n(6 + fx * 2)},-111 Q${n(9)},-124 ${n(4 + fx * 2)},-136 Z" fill="${T("#96402c")}" stroke="none"/>` +
    `<path d="M${n(-15 * w)},-130 l7,6 M${n(-16 * w)},-122 l8,7 M${n(-14 * w)},-116 l5,4 M${n(-8)},-138 l6,7 M${n(-11)},-133 l8,9 M${n(15 * w)},-130 l-7,6 M${n(16 * w)},-122 l-8,7 M${n(8)},-138 l-6,7 M${n(11)},-133 l-8,9" stroke="${T("#7a2c1e")}" stroke-width="0.45" fill="none"/>` +
    [-4.6, -2.6, -0.6, 1.2].map((dx, i) => `<path d="M${n(dx + fx * 2)},-101 l${n(-0.4 + (i % 2) * 0.8)},${n(4 + (i % 3))}" stroke="${T("#b5553c")}" stroke-width="0.7" stroke-linecap="round"/>`).join("") +
    [-14, -11, 11.4, 14].map((dx, i) => `<path d="M${n(dx * w)},-108 l${n((i % 2) - 0.5)},${n(3.4 + (i % 2))}" stroke="${T("#b5553c")}" stroke-width="0.7" stroke-linecap="round"/>`).join(""),
  collar: ({ T, fx }) => `<path d="M${n(-6 + fx)},-142 Q${n(fx * 2)},-136.6 ${n(6 + fx)},-142 L${n(5 + fx)},-137.4 Q${n(fx * 2)},-133 ${n(-5 + fx)},-137.4 Z" fill="${T("#f6f0e4")}"/><ellipse cx="${n(fx * 2)}" cy="-135.6" rx="1.7" ry="2.1" fill="${T("#d88a7a")}" stroke-width="0.35"/>`,
  head: (x) => {
    const { T, fx, st } = x, gr = st.grief || 0, o = { rx: 12, ry: 12.8, chin: 0.98, skin: MOTHER.skin, browCol: "#a8a098", browW: 1.1, old: 1, nose: 0.85, blush: "#ee8f8f", seed: 2, iris: "#4a3424", smile: 0.3 - gr * 1.1, brow: gr * 0.9, mouthY: 8.4, eyeH: 2.8 }, F = faceOn(x, o), { hx, hy } = F, hair = T("#b9b1a8"), cap = T("#f4eee2"), capS = T("#d6cdbc");
    return `<path d="M${n(hx - 13.6 - fx * 2)},${n(hy - 7)} Q${n(hx - 17 - fx * 3)},${n(hy - 26)} ${n(hx - fx * 3)},${n(hy - 28)} Q${n(hx + 17 - fx * 3)},${n(hy - 26)} ${n(hx + 13.6 - fx * 2)},${n(hy - 7)} Z" fill="${cap}"/><path d="M${n(hx - 9 - fx * 3)},${n(hy - 22)} q3,4 2,9 M${n(hx - fx * 3)},${n(hy - 26)} q1,5 -1,10 M${n(hx + 9 - fx * 3)},${n(hy - 22)} q-3,4 -2,9" stroke="${capS}" stroke-width="0.6" fill="none"/>` + F.head +
      `<path d="M${n(hx - 12.2)},${n(hy - 1)} Q${n(hx - 13)},${n(hy - 14)} ${n(hx + fx * 2)},${n(hy - 14.6)} Q${n(hx + 13)},${n(hy - 14)} ${n(hx + 12.2)},${n(hy - 1)} Q${n(hx + 9 + fx * 2)},${n(hy - 9)} ${n(hx + fx * 3)},${n(hy - 11.4)} Q${n(hx - 9 + fx * 2)},${n(hy - 9)} ${n(hx - 12.2)},${n(hy - 1)} Z" fill="${hair}"/><path d="M${n(hx + fx * 3)},${n(hy - 14.4)} L${n(hx + fx * 3)},${n(hy - 11.4)}" stroke="${T("#8a8278")}" stroke-width="0.5"/>` +
      (gr > 0.3 ? `<path d="M${n(hx - 11)},${n(hy - 6)} q-3,6 -1.6,13 M${n(hx + 11.4)},${n(hy - 5)} q2.6,5 1,11 M${n(hx - 6)},${n(hy - 11)} q-2,3 -1,6" stroke="${hair}" stroke-width="0.9" fill="none" stroke-linecap="round"/>` : "") +
      // the cap's frill and ribbon
      [-12, -9, -6, -3, 0, 3, 6, 9, 12].map((dx, i) => `<circle cx="${n(hx + dx)}" cy="${n(hy - 15.6 + Math.abs(dx) * Math.abs(dx) * 0.05 + (i % 2) * 0.4)}" r="${n(2.3 - (i % 3) * 0.15)}" fill="${cap}"/>`).join("") + `<path d="M${n(hx - 13)},${n(hy - 9.4)} Q${n(hx)},${n(hy - 19.6)} ${n(hx + 13)},${n(hy - 9.4)}" stroke="${T("#7a8ab0")}" stroke-width="1.5" fill="none"/>` + F.f;
  },
};
export const whiteMother = (c, st, t = 0) => figure(c, st, t, MOTHER);

// ---- Herbert, the son, about 25: cheerful, never believes a word. Striped work shirt, braces, red neckerchief, flat
// cap (st.cap 0 = bare head). Poses: sit (chess, hold "piece"), stand, walk (off to work), reach, st.smile 1 = his grin.
const SON = {
  scale: 1.0, wid: 1, skin: "#f2c8a8", legs: "#4a3a2c", shoe: "#2a1c14", seed: 3,
  sleeve: { col: "#c8d4dc", cuff: "#c8d4dc", roll: true },
  legG: ({ T }, near) => `<path d="M${n(near[0][0] + 2)},${n(near[0][1] + 6)} L${n(near[1][0] + 2)},${n(near[1][1])} M${n(near[1][0] + 2.4)},${n(near[1][1] + 4)} L${n(near[2][0] + 2)},${n(near[2][1] - 6)}" stroke="${T("#2f241a")}" stroke-width="0.5" fill="none"/>`,
  torso: ({ T, w, fx }) => torsoPath(w, T("#c8d4dc")) +
    [-11, -7.4, -3.8, 3.8, 7.4, 11].map((dx) => `<path d="M${n(dx * w + fx)},-138 Q${n(dx * w * 1.1 + fx)},-112 ${n(dx * w * 0.94 + fx)},-85" stroke="${T("#7a94a8")}" stroke-width="0.6" fill="none"/>`).join("") +
    `<path d="M${n(fx * 2)},-138 L${n(fx * 2)},-85" stroke="${T("#5a7488")}" stroke-width="0.7"/>` + [-126, -114, -102].map((y) => `<circle cx="${n(fx * 2)}" cy="${y}" r="0.8" fill="${T("#f6f0e4")}" stroke-width="0.25"/>`).join("") +
    `<path d="M${n(-10 * w)},-139.6 L${n(-6.6 * w)},-140 L${n(-7.4 * w + fx)},-84 L${n(-10.8 * w + fx)},-84 Z M${n(10 * w)},-139.6 L${n(6.6 * w)},-140 L${n(7.4 * w + fx)},-84 L${n(10.8 * w + fx)},-84 Z" fill="${T("#6a3a22")}"/><path d="M${n(-10.4 * w + fx)},-92 l3.4,0 M${n(7.4 * w + fx)},-92 l3.4,0" stroke="${T("#d8a838")}" stroke-width="1.4"/><path d="M${n(-13.6 * w)},-84.6 L${n(13.6 * w)},-84.6" stroke="${T("#4a3a2c")}" stroke-width="3.4"/>`,
  collar: ({ T, fx }) => `<path d="M${n(-7 + fx)},-142.6 Q${n(fx * 2)},-136 ${n(7 + fx)},-142.6 L${n(6 + fx)},-137 Q${n(fx * 2)},-131.6 ${n(-6 + fx)},-137 Z" fill="${T("#c23a3a")}"/><path d="M${n(fx * 2 - 1.6)},-134.6 L${n(fx * 2 + 1.6)},-134.6 L${n(fx * 2 + 3.4)},-126 L${n(fx * 2 + 0.4)},-128 L${n(fx * 2 - 3)},-125.6 Z" fill="${T("#c23a3a")}"/><path d="M${n(fx * 2 - 0.6)},-131 l0.8,-0.6 M${n(fx * 2 + 1)},-129 l0.8,-0.6 M${n(-3 + fx)},-138.6 l1,-0.6 M${n(3.4 + fx)},-138.4 l1,-0.6" stroke="${T("#f6f0e4")}" stroke-width="0.5"/>`,
  head: (x) => {
    const { T, fx, st, dir } = x, cap = st.cap ?? 1, o = { rx: 11.8, ry: 13.4, chin: 1.06, skin: SON.skin, browCol: "#7a3d1a", browW: 1.4, nose: 1, blush: "#f08a7a", seed: 3, iris: "#4a6a4a", smile: 0.55, teeth: 1, mouthW: 3, mouthY: 8.4 }, F = faceOn(x, o), { hx, hy, ex } = F, hair = T("#8f4a22"), tw = T("#6f6d48"), twS = T("#55532f");
    let s = F.head + `<path d="M${n(hx - 12)},${n(hy + 1.6)} Q${n(hx - 13.6)},${n(hy - 16)} ${n(hx)},${n(hy - 17.6)} Q${n(hx + 13.6)},${n(hy - 16)} ${n(hx + 12)},${n(hy + 1.6)} L${n(hx + 10.2 + fx)},${n(hy - 3)} Q${n(hx + 8 + fx * 3)},${n(hy - 9.6)} ${n(hx + fx * 3)},${n(hy - 9)} Q${n(hx - 8 + fx * 3)},${n(hy - 10)} ${n(hx - 10.2 + fx)},${n(hy - 3)} Z" fill="${hair}"/><path d="M${n(hx - 4 + fx * 3)},${n(hy - 9.4)} l-1.6,3 l2.6,-1.6 l0.6,2.6 l2,-3.2" fill="${hair}" stroke-width="0.4"/>`;
    s += F.f + [[-7.6, 3], [-5.6, 4.4], [-8.4, 5], [6, 3.4], [8, 4.6], [6.6, 5.6], [-1, 2.4]].map(([dx, dy]) => `<circle cx="${n(ex + dx)}" cy="${n(hy + dy)}" r="0.4" fill="${T("#c8805a")}" stroke="none"/>`).join("");
    if (cap > 0.5) s += `<path d="M${n(hx - 13.4 - fx * 2)},${n(hy - 9)} Q${n(hx - 16 - fx * 4)},${n(hy - 21)} ${n(hx - 3 - fx * 4)},${n(hy - 23.6)} Q${n(hx + 13 - fx * 2)},${n(hy - 24)} ${n(hx + 14 - fx)},${n(hy - 10.4)} Q${n(hx + fx * 2)},${n(hy - 15)} ${n(hx - 13.4 - fx * 2)},${n(hy - 9)} Z" fill="${tw}"/><path d="M${n(hx - 8 + fx * 3)},${n(hy - 11.6)} Q${n(hx + fx * 9)},${n(hy - 15.6)} ${n(hx + 9 + fx * 5)},${n(hy - 11.6)} Q${n(hx + dir * 12 + fx * 8)},${n(hy - 8.4)} ${n(hx + fx * 12)},${n(hy - 8.6)} Q${n(hx - 6 + fx * 6)},${n(hy - 9)} ${n(hx - 8 + fx * 3)},${n(hy - 11.6)} Z" fill="${twS}"/><path d="M${n(hx - 8)},${n(hy - 17)} l2,-1.6 l2,1.6 M${n(hx - 1)},${n(hy - 19)} l2,-1.6 l2,1.6 M${n(hx + 6)},${n(hy - 17.6)} l2,-1.6 l2,1.6 M${n(hx - 4.6)},${n(hy - 14.6)} l2,-1.6 l2,1.6 M${n(hx + 3)},${n(hy - 15)} l2,-1.6 l2,1.6" stroke="${twS}" stroke-width="0.5" fill="none"/><circle cx="${n(hx - 1 - fx * 3)}" cy="${n(hy - 23.2)}" r="1.1" fill="${twS}" stroke-width="0.3"/>`;
    return s;
  },
};
export const son = (c, st, t = 0) => figure(c, st, t, SON);

// ---- Sergeant-Major Morris, the soldier: big, brick-red face, a walrus moustache, twenty-one years in India in a
// faded scarlet tunic. Poses: sit, stand, hold "paw" + holdUp (shows it), point, throw (flings it at the fire).
// st.haunted 0..1 = the stare into the fire.
const SOLDIER = {
  scale: 1.08, wid: 1.3, skin: "#e58f6e", legs: "#27304e", shoe: "#16141c", seed: 4, hand: 1.2,
  sleeve: { col: "#b7392f", cuff: "#27304e" },
  legG: ({ T }, near) => `<path d="M${n(near[0][0] + 5.6)},${n(near[0][1] + 2)} L${n(near[1][0] + 5.6)},${n(near[1][1])} L${n(near[2][0] + 5.6)},${n(near[2][1] - 5)}" stroke="${T("#b7392f")}" stroke-width="1.4" fill="none"/>`,
  armG: ({ T }, k, s0, e, wr) => { const a = Math.atan2(e[1] - s0[1], e[0] - s0[0]) / rad, a2 = Math.atan2(wr[1] - e[1], wr[0] - e[0]) / rad; return `<g transform="translate(${n(lerp(s0[0], e[0], 0.55))},${n(lerp(s0[1], e[1], 0.55))}) rotate(${n(a - 90)})">${[0, 3.2, 6.4].map((y) => `<path d="M-4.6,${y - 5} L0,${y - 2} L4.6,${y - 5}" stroke="${T("#e0b850")}" stroke-width="1.3" fill="none" stroke-linejoin="miter"/>`).join("")}</g>` + (k === "L" ? `<g transform="translate(${n(e[0])},${n(e[1])}) rotate(${n(a2)})"><path d="M-1,-3.4 L5,-3.8 L5.4,3.2 L-0.6,3.6 Z" fill="${T("#96302a")}" stroke-width="0.4" stroke-dasharray="1.4 0.8"/></g>` : ""); },
  torso: ({ T, w, fx }) => torsoPath(w, T("#b7392f")) +
    `<path d="M${n(5 + fx * 2)},-141 Q${n(13)},-141 ${n(15 * w)},-138 Q${n(17.4 * w)},-112 ${n(13.6 * w)},-83 L${n(8)},-83 Q${n(11)},-112 ${n(5 + fx * 2)},-141 Z" fill="${T("#96302a")}" stroke="none"/>` +
    `<path d="M${n(fx * 3)},-141 L${n(fx * 3 + 0.6)},-83" stroke="${T("#7a2420")}" stroke-width="0.8"/>` +
    [-132, -122, -112, -92].map((y) => `<circle cx="${n(fx * 3 + 0.2)}" cy="${y}" r="1.5" fill="${T("#e0b850")}" stroke-width="0.35"/>`).join("") + `<path d="M${n(fx * 3 - 1)},-103 l2.4,1.6 M${n(fx * 3 + 0.6)},-102.4 l1.6,3.4" stroke="${T("#e8d8b0")}" stroke-width="0.4" fill="none"/>` +
    `<path d="M${n(-11.6 * w)},-127 l${n(8 * w)},0.4 l0,4.4 l${n(-8 * w)},-0.4 Z" fill="${T("#e0b850")}" stroke-width="0.4"/><path d="M${n(-9 * w)},-126.8 l0,4.2 M${n(-6.4 * w)},-126.6 l0,4.2" stroke="${T("#3a5a8a")}" stroke-width="2"/>` +
    `<path d="M${n(-14.6 * w)},-97 L${n(14.6 * w)},-97 L${n(14.2 * w)},-90.6 L${n(-14.2 * w)},-90.6 Z" fill="${T("#e2d8c4")}"/><path d="M${n(fx * 3 - 3.4)},-98 l6.8,0 l0,8.4 l-6.8,0 Z" fill="${T("#e0b850")}" stroke-width="0.5"/>` +
    `<path d="M${n(-12 * w)},-84 l1,2.4 l1.4,-2 l1,2.6 l1.6,-2.4" stroke="${T("#7a2420")}" stroke-width="0.5" fill="none"/><path d="M${n(9 * w)},-118 q3,6 1,13" stroke="${T("#7a2420")}" stroke-width="0.5" fill="none"/>`,
  collar: ({ T, fx }) => `<path d="M${n(-7.6 + fx)},-146 L${n(fx * 3 - 1)},-143 L${n(fx * 3 - 2)},-136.6 L${n(-8.6 + fx)},-139 Z M${n(7.6 + fx)},-146 L${n(fx * 3 + 1.4)},-143 L${n(fx * 3 + 2.4)},-136.6 L${n(8.6 + fx)},-139 Z" fill="${T("#27304e")}"/><path d="M${n(-6.6 + fx)},-141 l3,1.4 M${n(6.6 + fx)},-141 l-3,1.4" stroke="${T("#e0b850")}" stroke-width="0.7"/>`,
  head: (x) => {
    const { T, fx, st, dir } = x, ha = st.haunted || 0, xx = ha ? { ...x, st: { wide: ha, brow: 0.6 * ha, ...st } } : x;
    const o = { rx: 13.8, ry: 13.6, chin: 0.94, skin: SOLDIER.skin, browCol: "#5a524c", browW: 2.2, brow: -0.35, old: 1, nose: 1.35, noseCol: "#c8503c", noseW: 1.3, blush: "#d8503c", bags: 1, seed: 4, iris: "#3a4a5a", smile: -0.2, mouthY: 11, mouthW: 2.8, eyeW: 2.7, eyeH: 2.6, eyeDX: 5.4, browY: 0.6 }, F = faceOn(xx, o), { hx, hy, ex, ey } = F, hair = T("#8f8a84"), mo = T("#b8ab9c"), moS = T("#8a7a68");
    let s = F.head + `<path d="M${n(hx - 13.4)},${n(hy + 3)} Q${n(hx - 15)},${n(hy - 15)} ${n(hx)},${n(hy - 17.4)} Q${n(hx + 15)},${n(hy - 15)} ${n(hx + 13.4)},${n(hy + 3)} L${n(hx + 12.4 + fx)},${n(hy + 3.6)} Q${n(hx + 13.4 + fx)},${n(hy - 11.6)} ${n(hx + fx * 3)},${n(hy - 14.4)} Q${n(hx - 13.4 + fx)},${n(hy - 11.6)} ${n(hx - 12.4 + fx)},${n(hy + 3.6)} Z" fill="${hair}"/>`;
    s += [[-9, -13], [-5, -15], [0, -15.6], [5, -15], [9, -13], [-11, -8], [11, -8]].map(([dx, dy]) => `<path d="M${n(hx + dx)},${n(hy + dy)} l0.4,-1.8" stroke="${T("#6a655f")}" stroke-width="0.5"/>`).join("");
    s += F.f;
    // the scar through one brow, stubble, the moustache over everything
    s += `<path d="M${n(ex + 3.4)},${n(ey - 9.6)} L${n(ex + 6)},${n(ey - 3.6)} M${n(ex + 4)},${n(ey - 7.4)} l1.6,-0.6 M${n(ex + 4.8)},${n(ey - 5.6)} l1.6,-0.6" stroke="${T("#a8402e", 0.6)}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
    s += [[-9, 9], [-7, 11.4], [-4.6, 12.6], [5, 12.6], [7.4, 11], [9.4, 8.6], [-10.4, 6], [10.6, 5.6], [0, 13.4], [-2, 12.4], [2.6, 12.8]].map(([dx, dy]) => `<circle cx="${n(ex + dx - fx * 2)}" cy="${n(hy + dy)}" r="0.35" fill="${T("#7a4a3c")}" stroke="none"/>`).join("");
    s += `<path d="M${n(ex)},${n(hy + 5.4)} Q${n(ex - 5)},${n(hy + 4)} ${n(ex - 9)},${n(hy + 7.4)} Q${n(ex - 11.4)},${n(hy + 11)} ${n(ex - 11)},${n(hy + 13.4)} Q${n(ex - 7.4)},${n(hy + 11.6)} ${n(ex - 3.4)},${n(hy + 10.4)} Q${n(ex)},${n(hy + 8.8)} ${n(ex + 3.4)},${n(hy + 10.4)} Q${n(ex + 7.4)},${n(hy + 11.6)} ${n(ex + 11)},${n(hy + 13.4)} Q${n(ex + 11.4)},${n(hy + 11)} ${n(ex + 9)},${n(hy + 7.4)} Q${n(ex + 5)},${n(hy + 4)} ${n(ex)},${n(hy + 5.4)} Z" fill="${mo}"/><path d="M${n(ex - 7)},${n(hy + 7)} l-1.4,3 M${n(ex - 4)},${n(hy + 6.4)} l-1,3 M${n(ex + 4)},${n(hy + 6.4)} l1,3 M${n(ex + 7)},${n(hy + 7)} l1.4,3 M${n(ex)},${n(hy + 5.6)} l0,2.6" stroke="${moS}" stroke-width="0.5" fill="none"/>`;
    return s;
  },
};
export const soldier = (c, st, t = 0) => figure(c, st, t, SOLDIER);

// ---- the man from Maw & Meggins, the clerk: thin, pale, dark suit, a high stiff collar, a bowler he would rather
// look at than at them. st.hat 0 = on his head, 1 = in both hands at his chest (st.nervous 0..1 turns it round and
// round, drops his eyes, starts the sweat); offer 0..1 = holds out the envelope (hold "envelope").
const CLERK = {
  scale: 1.02, wid: 0.8, skin: "#ecd3c0", legs: "#2a2c3e", shoe: "#101016", seed: 5,
  sleeve: { col: "#2a2c3e", cuff: "#f6f0e4" },
  legG: ({ T }, near) => `<path d="M${n(near[0][0] - 1)},${n(near[0][1] + 6)} L${n(near[1][0] - 1)},${n(near[1][1])} L${n(near[2][0] - 1)},${n(near[2][1] - 6)}" stroke="${T("#4a4c62")}" stroke-width="0.4" fill="none"/>`,
  both: ({ st, fx, dir }, to, X2, kind) => { const h = st.hat || 0; if (h > 0) { to("L", X2(-8 + dir * 2, -106), h); to("R", X2(8 + dir * 2, -106), h); if (h > 0.5) kind.L = kind.R = "fist"; } },
  frontG: ({ st, T, t }, wp) => { if (!((st.hat || 0) > 0.5)) return ""; const of = (st.offer || 0) > 0.3, hh = (st.fx ?? 0.5) >= 0 ? wp.L : wp.R, a = of ? hh : wp.L, b = of ? hh : wp.R, cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + 1, tw = Math.sin(t * 4.6) * 6 * (st.nervous || 0); return `<g transform="translate(${n(cx)},${n(cy)}) rotate(${n(tw)})">${bowler(T)}</g>`; },
  both2: true,
  torso: ({ T, w, fx }) => torsoPath(w, T("#2a2c3e")) +
    `<path d="M${n(-4 + fx * 2)},-141 L${n(fx * 2)},-118 L${n(4 + fx * 2)},-141 Z" fill="${T("#f6f0e4")}"/><path d="M${n(-1.2 + fx * 2)},-139 L${n(1.2 + fx * 2)},-139 L${n(1.6 + fx * 2)},-124 L${n(fx * 2)},-121 L${n(-1.6 + fx * 2)},-124 Z" fill="${T("#16161c")}"/>` +
    `<path d="M${n(-4 + fx * 2)},-141 L${n(-10 * w)},-132 L${n(-6.6 * w)},-128 L${n(fx * 2)},-116 L${n(6.6 * w)},-128 L${n(10 * w)},-132 L${n(4 + fx * 2)},-141 L${n(fx * 2)},-118 Z" fill="${T("#35384e")}"/>` +
    `<path d="M${n(fx * 2)},-116 L${n(fx * 2 + 0.6)},-83" stroke="${T("#16161c")}" stroke-width="0.7"/>` + [-110, -101, -92].map((y) => `<circle cx="${n(fx * 2 + 2)}" cy="${y}" r="1.1" fill="${T("#16161c")}" stroke="${T("#4a4c62")}" stroke-width="0.35"/>`).join("") +
    `<path d="M${n(-11 * w)},-118 l${n(6 * w)},0.6" stroke="${T("#16161c")}" stroke-width="0.7"/><path d="M${n(-9.6 * w)},-118 l0.6,-4 l1.6,0 l0.4,4.2" fill="${T("#f6f0e4")}" stroke-width="0.35"/><path d="M${n(8 * w)},-96 l${n(4.6 * w)},-0.4" stroke="${T("#16161c")}" stroke-width="0.7"/>`,
  collar: ({ T, fx }) => `<path d="M${n(-5 + fx)},-148 L${n(fx * 2 - 0.6)},-141.6 L${n(-5.6 + fx)},-139.6 Z M${n(5 + fx)},-148 L${n(fx * 2 + 0.6)},-141.6 L${n(5.6 + fx)},-139.6 Z" fill="${T("#f6f0e4")}"/>`,
  head: (x) => {
    const { T, fx, st } = x, nv = st.nervous || 0, xx = { ...x, st: { sweat: nv > 0.4 ? nv : 0, look: nv > 0.5 ? fx * 0.2 - 0.0 : undefined, ...st } };
    const o = { rx: 10.8, ry: 14.2, chin: 1.12, skin: CLERK.skin, browCol: "#1c1a24", browW: 1.1, brow: 0.55 + nv * 0.4, nose: 1.2, seed: 5, iris: "#3a3a4a", smile: -0.25, mouthY: 9.6, mouthW: 2.1, eyeW: 2.9, eyeH: 3.1, eyeDX: 4.6, bags: 1 }, F = faceOn(xx, o), { hx, hy, ex } = F, hair = T("#1c1a24"), hat = (st.hat || 0) < 0.5;
    let s = F.head + `<path d="M${n(hx - 11)},${n(hy + 1)} Q${n(hx - 12.4)},${n(hy - 17)} ${n(hx)},${n(hy - 18.6)} Q${n(hx + 12.4)},${n(hy - 17)} ${n(hx + 11)},${n(hy + 1)} L${n(hx + 9.6 + fx)},${n(hy - 5)} Q${n(hx + 7 + fx * 3)},${n(hy - 13)} ${n(hx + fx * 3)},${n(hy - 13.6)} Q${n(hx - 7 + fx * 3)},${n(hy - 13)} ${n(hx - 9.6 + fx)},${n(hy - 5)} Z" fill="${hair}"/><path d="M${n(hx + fx * 3)},${n(hy - 18.4)} L${n(hx + fx * 3)},${n(hy - 13.6)}" stroke="${T("#4a4c62")}" stroke-width="0.5"/><path d="M${n(hx - 6)},${n(hy - 16)} q3,-0.6 4.6,2" stroke="${T("#4a4c62")}" stroke-width="0.6" fill="none"/>`;
    s += F.f + `<path d="M${n(ex - 3.6)},${n(hy + 7.6)} Q${n(ex - 1.6)},${n(hy + 6.2)} ${n(ex)},${n(hy + 7)} Q${n(ex + 1.6)},${n(hy + 6.2)} ${n(ex + 3.6)},${n(hy + 7.6)}" stroke="${hair}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    if (hat) s += `<g transform="translate(${n(hx - fx * 2)},${n(hy - 12.4)})">${bowler(T)}</g>`;
    return s;
  },
};
const bowler = (T) => `<path d="M-11.4,0 Q-12.6,-15.6 0,-16.4 Q12.6,-15.6 11.4,0 Z" fill="${T("#16161c")}"/><path d="M-16.6,-0.6 Q0,-3.6 16.6,-0.6 Q17.6,1.6 15.6,2.4 Q0,-0.4 -15.6,2.4 Q-17.6,1.6 -16.6,-0.6 Z" fill="${T("#16161c")}"/><path d="M-11.4,-3.4 Q0,-6.2 11.4,-3.4" stroke="${T("#4a4c62")}" stroke-width="1.7" fill="none"/><path d="M-7.6,-12 q3,-2.6 7,-2.2" stroke="${T("#4a4c62")}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
export const clerk = (c, st, t = 0) => figure(c, st, t, CLERK);

// ---------------------------------------------------------------- the grandmother gone wrong (the last line)
// keeper() from legend.mjs with her face painted over: wide pale eyes with nothing in them, a flat mouth a little too
// long, no blink, no brow. st as keeper() plus blank 0..1 (0 = plain keeper). Her "talk" only parts the flat mouth.
export function keeperBlank(c, st, t, sleeve) {
  const b = st.blank ?? 1;
  if (b <= 0.01) return L.keeper(c, st, t, sleeve);
  const k = L.keeper(c, { ...st, talk: 0, stern: 1, open: 1, blink: 0, run: null }, t, sleeve);
  if (!k.p) return k;
  const fx = st.fx ?? -0.7, hx = -2 + fx * 1.5, hy = -112, ex = hx + fx * 4.5, skin = "#e6bf9e", pale = mix(skin, "#d3dcd4", 0.6), white = "#efebe3", talk = st.talk || 0;
  // her own head again, drained, with her own hair, bun, ribbon and pin put back on top
  let o = `<path d="${headPath(hx, hy, 10.5, 11.5, fx, 0.98)}" fill="${pale}"/>`;
  o += `<path d="M${n(hx - 11)},${n(hy - 1)} Q${n(hx - 12.5)},${n(hy - 15)} ${n(hx + 1)},${n(hy - 15)} Q${n(hx + 12.5)},${n(hy - 15)} ${n(hx + 11)},${n(hy - 1)} L${n(hx + 9.8)},${n(hy + 2)} Q${n(hx + 8.5)},${n(hy - 8)} ${n(hx + 2)},${n(hy - 9.5)} Q${n(hx - 6)},${n(hy - 10)} ${n(hx - 10)},${n(hy + 2)} Z" fill="${white}"/>`;
  o += `<path d="M${n(hx - 6)},${n(hy - 13)} Q${n(hx)},${n(hy - 11)} ${n(hx + 6)},${n(hy - 13.5)} M${n(hx - 9)},${n(hy - 8)} Q${n(hx - 6)},${n(hy - 11)} ${n(hx - 2)},${n(hy - 11.5)}" stroke="#c9c1b3" stroke-width="0.6" fill="none"/><circle cx="${n(hx + 4)}" cy="${n(hy - 17)}" r="6.2" fill="${white}"/><path d="M${n(hx)},${n(hy - 19)} Q${n(hx + 4)},${n(hy - 14)} ${n(hx + 8.5)},${n(hy - 18)}" stroke="#c9c1b3" stroke-width="0.6" fill="none"/><path d="M${n(hx - 1.5)},${n(hy - 15)} Q${n(hx + 4)},${n(hy - 12.5)} ${n(hx + 10)},${n(hy - 16)}" stroke="#d8443a" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M${n(hx + 6)},${n(hy - 22)} L${n(hx + 13)},${n(hy - 26)}" stroke="#4e2f1d" stroke-width="1.1" stroke-linecap="round"/>`;
  // the wrong face: eyes wide with nothing in them, no brow to speak of, a flat mouth a little too long
  // (director fix, draft 1: the eye() lid arcs read as happy closed eyes) -> full round stare, pinprick pupils dead centre
  for (const [x, r] of [[ex - 4.3, 3.0], [ex + 4.3, 3.2]]) o += `<ellipse cx="${n(x)}" cy="${n(hy - 1.6)}" rx="${n(r + 0.6)}" ry="${n(r + 0.9)}" fill="#6d5a63" opacity="0.35" stroke="none"/><ellipse cx="${n(x)}" cy="${n(hy - 1.9)}" rx="${n(r)}" ry="${n(r * 1.05)}" fill="#f6f3ea" stroke="${L.INK}" stroke-width="0.9"/><circle cx="${n(x)}" cy="${n(hy - 1.9)}" r="0.55" fill="#0b0710" stroke="none"/>`;
  o += `<path d="M${n(ex - 7)},${n(hy + 2.8)} q2.7,1.3 5.4,0 M${n(ex + 1.6)},${n(hy + 2.8)} q2.7,1.3 5.4,0" stroke="#9a8a80" stroke-width="0.5" fill="none"/>`;
  o += `<path d="M${n(ex - 7)},${n(hy - 8)} L${n(ex - 1.6)},${n(hy - 8)} M${n(ex + 1.6)},${n(hy - 8)} L${n(ex + 7)},${n(hy - 8)}" stroke="#d9d2c4" stroke-width="1" stroke-linecap="round"/>`;
  o += `<path d="M${n(ex + fx * 1.2)},${n(hy + 0.6)} q${n(fx * 1.6)},2.6 ${n(-fx * 0.4)},3.4" stroke="#9a8a80" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  o += talk > 0.12 ? `<path d="M${n(ex - 3.7)},${n(hy + 6.7)} L${n(ex + 3.7)},${n(hy + 6.7)} L${n(ex + 3.6)},${n(hy + 7.4 + talk * 0.9)} L${n(ex - 3.6)},${n(hy + 7.4 + talk * 0.9)} Z" fill="#1a0c14"/>` : `<path d="M${n(ex - 3.8)},${n(hy + 7)} L${n(ex + 3.8)},${n(hy + 7)}" stroke="#3a1c24" stroke-width="1" stroke-linecap="round"/>`;
  return { ...k, svg: k.svg + `<g class="ol" transform="${place(k.p, 0)}" opacity="${n(clamp(b * 1.5))}">${o}</g>` };
}
