// Legend (the kelpie of Loch Sunart): the loch shore at night, the underwater drag, Grandma's stone croft, the kelpie,
// three village kids, and the props (nine-finger hand, finger-on-nose close-up, the torn weed bridle).
// Design only. Same conventions as legend.mjs / legend-sea.mjs: metres, X right, Y up, Z into the picture, P(c, X, Y, Z).
// Every frame: L.resetIds(); SCO.resetIds(); SCO.mood(m); then SCO.defs(), layers, SCO.grade(), SCO.vignette().
// Nothing uses Math.random: all wobble is seeded, frames render in any order.
//
// API
//   MOOD { loch: 0, under: 1, croft: 2 }; mood(m) (fractions blend, 0.5 = wading in), defs(), grade(), vignette(), resetIds()
//   loch(c, t, { moon: [x, y, r] px, props: true, mist: 1, haze: [x, y, r] px (pale mist behind the kelpie) })      -> { back, front }     LOCH = places + cameras, shoreZ(X)
//   under(c, t, { depth 0..1, surface: true })                    -> { back, front }     UNDER = places + cameras (bed is Y = 0)
//   croft(c, t, { open 0..1 (door), glow 0..1 (peat fire), moon }) -> { back, front }    CROFT = places + cameras
//   boulder(c, { X, Z, size, seed }), heather(c, { X, Z, size, seed }), frond(c, { X, Z, h, seed, dark }, t)
//   kelpie(c, st, t) -> { svg, seats[4] {X, Y, Z}, nose, eye, ring, withers (screen px), noseW {X, Y, Z}, p }
//     st: { X, Y (hoof height, 0), Z, dir 1 right | -1 left, size 1,
//           kneel 0..1, len 1..4 (riders the back fits; fractions animate the stretch), turn 0..1 (head to camera),
//           walk phase (null = stand), water (world Y of the surface: clips below it, rings + reflection; null = none),
//           bridle 1 on | 0 off, obey 0..1 (head bowed, eye dim), nod deg (lowers the neck), glint 0..1 (eye glow),
//           float 0..1 (mane and tail drift, underwater), pitch deg (nose down +), drip 0..1, reflect true, reflectTo px (screen y where the mirror image stops; default the loch shoreline) }
//   villager(c, st, t) -> { svg, p }   three Highland kids, kind 0 tweed cap boy | 1 plaid shawl girl | 2 small tam boy
//     st: { X, Y, Z, kind, fx -0.8..0.8, sit 0|1 (astride: pass a kelpie seat), stuck 0..1 (hands glued down, leaning back),
//           hands 0..1 (raised to the face, standing), shock, grin, talk, blink, look, lean deg, size }
//   hostRide(c, seat) -> { cam, X, Z } for L.kid (draw the kid BEFORE the kelpie), riderLeg(c, seat) his near leg AFTER it
//   kidHand(kd, reachL, lean) -> screen px of L.kid's bell hand (aim the kelpie's nose there: st.nod)
//   nineHand(x, y, k, { missing 0 index..3 pinky, rot, spread, warm 0..1, arm cm }) Grandma's open hand, k px per cm
//   keeperRaise(kp, { k, warm }) the same hand raised from L.keeper's shoulder (use instead of kp.arm)
//   stuckFinger(x, y, k, { pull 0..1, dir -1 from screen right }, t) close-up hand, fingertip glued at (x, y) = kelpie().nose
//   bridleLoose(x, y, k, { rot, drip }, t) the torn weed bridle with its silver rings, k px per cm
import { W, H, INK, n, lerp, clamp, hash, mix, P, PAL, defs as baseDefs, place, toScreen, limb, eye, headPath, talkMouth } from "./legend.mjs";

const NEAR = 0.3;
const vis = (c, Z) => Z - c.z > NEAR;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const LW = (k) => n(Math.min(3, Math.max(0.7, k * 0.011)));
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
const ring = (x, y, r, seed, wob = 0.07, N = 16, sq = 1) => blob(Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2, rr = r * (1 + jit(seed + i, wob)); return { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * sq }; }));
const shp = (d, fill, lw = 1, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round" ${extra}/>`;
const flat = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" stroke="none" ${extra}/>`;
const ln = (d, col, w, extra = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ell = (x, y, rx, ry, fill, extra = "") => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${extra}/>`;
function board(c, X, Y, Z, size = 1) { const p = P(c, X, Y, Z), k = p.s * size; return { p, k, lw: LW(k), x: (x) => p.x + x * k, y: (y) => p.y - y * k, pt: (x, y) => `${n(p.x + x * k)},${n(p.y - y * k)}` }; }
function hd(b, a, seed = 1, amp = 0.012, per = 0.3, close = true) {
  const out = [];
  a.forEach((A, i) => {
    if (!close && i === a.length - 1) { out.push(b.pt(A[0], A[1])); return; }
    const B = a[(i + 1) % a.length], len = Math.hypot(B[0] - A[0], B[1] - A[1]), kk = Math.max(1, Math.round(len / per));
    for (let j = 0; j < kk; j++) { const u = j / kk, id = seed * 131 + i * 17 + j, am = j ? amp : amp * 0.35; out.push(b.pt(lerp(A[0], B[0], u) + jit(id, am), lerp(A[1], B[1], u) + jit(id + 0.5, am))); }
  });
  return "M" + out.join(" L") + (close ? " Z" : "");
}
const wline = (y, seed, amp = 14, step = 120) => Array.from({ length: Math.ceil((W + 80) / step) + 1 }, (_, i) => ({ x: -40 + i * step, y: y + jit(seed * 37 + i, amp) }));
const band = (a, fill, extra = "") => `<path d="M-40,${H + 40} L${a.map(pt).join(" L")} L${W + 40},${H + 40} Z" fill="${fill}" ${extra}/>`;
function lightBlobs(x, y, radii, col, alphas, seed, sq = 1) { return radii.map((r, j) => flat(ring(x, y, r, seed + j * 31, 0.08, 18, sq), col, `opacity="${n(alphas[j])}" style="mix-blend-mode:screen"`)).join(""); }
// Catmull-Rom through [x, y] points
function spline(a, closed = true) {
  const N = a.length, g = (i) => closed ? a[(i + N) % N] : a[Math.max(0, Math.min(N - 1, i))];
  let d = `M${n(a[0][0])},${n(a[0][1])}`;
  for (let i = 0; i < (closed ? N : N - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += ` C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`; }
  return d + (closed ? " Z" : "");
}
// a ribbon along centre points with a width at each
function ribbon(cs, ws) {
  const A = [], B = [];
  cs.forEach((p, i) => { const a = cs[Math.max(0, i - 1)], b = cs[Math.min(cs.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = ws[i] / 2; A.push([p[0] - dy / l * w, p[1] + dx / l * w]); B.push([p[0] + dy / l * w, p[1] - dx / l * w]); });
  return spline([...A, ...B.reverse()], true);
}
function taper(a, b, wa, wb, fill, extra = "") {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return `<path d="M${n(a[0] + nx * wa / 2)},${n(a[1] + ny * wa / 2)} L${n(b[0] + nx * wb / 2)},${n(b[1] + ny * wb / 2)} A${n(wb / 2)},${n(wb / 2)} 0 0 0 ${n(b[0] - nx * wb / 2)},${n(b[1] - ny * wb / 2)} L${n(a[0] - nx * wa / 2)},${n(a[1] - ny * wa / 2)} A${n(wa / 2)},${n(wa / 2)} 0 0 0 ${n(a[0] + nx * wa / 2)},${n(a[1] + ny * wa / 2)} Z" fill="${fill}" ${extra}/>`;
}

// ---------------------------------------------------------------- colour: one mood number
// 0 the loch shore at night, 1 under the water, 2 the croft door. Fractions blend the grade and the kelpie's wet light.
export const MOOD = { loch: 0, under: 1, croft: 2 };
const KC = {      // [loch, under, croft]
  coat: ["#090c17", "#06191b", "#0c0a15"], far: ["#182238", "#0f3536", "#201a2c"], edge: ["#22304e", "#1a4a48", "#2c2640"],
  rim: ["#5682bc", "#62b89e", "#7286b4"], hi: ["#d6ebff", "#e2fff2", "#ffe6c0"],
  mane: ["#16363f", "#124a44", "#1a2f38"], maneHi: ["#bdf3e6", "#d8ffe9", "#cfe9dc"], weed: ["#3fb265", "#4ccf7c", "#4a9a58"], weedHi: ["#a4f5ae", "#c4ffc8", "#b6e6a4"], weedS: ["#16553a", "#1a6a48", "#1c4a34"],
  eye: ["#f2fff0", "#f4fff4", "#fff4dc"], hoof: ["#2c3446", "#234a4a", "#342c3c"],
  vig: ["#02040f", "#021612", "#070410"], tint: ["#c6d4ff", "#b6ead6", "#ffe6d0"],
};
const LC = { sky0: "#060a22", sky1: "#0c1a44", sky2: "#173564", sky3: "#2a5682", moon: "#eef6ff", moonS: "#c2d4ec", cloud: "#1f3a66", star: "#dfeaff",
  hillF: "#14274c", hillN: "#0a1430", w0: "#294a78", w1: "#16294e", w2: "#0b1630", w3: "#060b1c", glint: "#4a70a4", mist: "#a8c8e8",
  shore: "#0d131f", shoreL: "#1c2a40", wet: "#4f78ac", peb: "#27344c", pebL: "#6f8fb8",
  rock: "#2b3854", rockS: "#151d30", rockL: "#6482ae", rockH: "#b4cef0", heath: "#14262a", heathL: "#24443a", bloom: "#a05cc8", bloomL: "#e29af2" };
const UC = { w0: "#c2ecd2", w1: "#74c0a2", w2: "#35897a", w3: "#165256", w4: "#072a32", surf: "#f0fff4", shaft: "#e8fff0", bed: "#0c3a3a", bedN: "#051f24", kelp: "#0e5244", kelpL: "#2f9a70", kelpF: "#2a7a6a", kelpN: "#031a1c", rock: "#123f40" };
const CC = { turf: "#0e161a", turfL: "#1a2a26", path: "#252a36", mortar: "#161b28", stone: ["#4a5368", "#596176", "#3d455a", "#686e80", "#525a64"], stoneL: "#8ea0c0",
  thatch: "#35342a", thatchL: "#5c604e", thatchS: "#1c1c18", rope: "#a09474", wood: "#5a3c26", woodS: "#33200f", woodL: "#8a5e3a", iron: "#1a1a22",
  fire: "#ff9a3a", fireL: "#ffe08a", fireD: "#c2401a", room: "#6a2412", peat: "#2a1c18", peatL: "#4a3024", smoke: "#8088a4" };
export const M = {};
let MV = 0, UID = 0;
export function resetIds() { UID = 0; }
const seg3 = (a, m) => m <= 1 ? mix(a[0], a[1], m) : mix(a[1], a[2], m - 1);
export function mood(m = 0) {
  if (typeof m === "string") m = MOOD[m];
  MV = Math.max(0, Math.min(2, m));
  for (const k in KC) M[k] = seg3(KC[k], MV);
  PAL.sco = { sky: [LC.sky0, LC.sky1, LC.sky2, LC.sky3, LC.sky3], fog: LC.w1, fogC: LC.mist, hills: [LC.hillF, LC.hillN], pag: [LC.hillF, LC.hillN], moon: false, stars: false };
  return M;
}
mood(0);
const wUnder = () => clamp(1 - Math.abs(MV - 1)), wCroft = () => clamp(MV - 1), wLoch = () => clamp(1 - MV);
export function defs() {
  return baseDefs("sco") + `<defs>
  <radialGradient id="vgk" cx="0.5" cy="0.5" r="0.8"><stop offset="0.5" stop-color="${M.vig}" stop-opacity="0"/><stop offset="1" stop-color="${M.vig}" stop-opacity="0.62"/></radialGradient>
  <radialGradient id="softk"><stop offset="0" stop-color="#02030a" stop-opacity="0.6"/><stop offset="1" stop-color="#02030a" stop-opacity="0"/></radialGradient>
</defs>`;
}
export function grade() {
  let s = `<rect width="${W}" height="${H}" fill="${mix("#ffffff", M.tint, 0.55)}" style="mix-blend-mode:multiply"/>`;
  if (wUnder() > 0.02) s += `<rect width="${W}" height="${H}" fill="#2a8a70" opacity="${n(wUnder() * 0.12)}" style="mix-blend-mode:screen"/>`;
  return s;
}
export const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vgk)"/>`;
const shadow = (p, w) => `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(w * p.s)}" ry="${n(w * 0.2 * p.s)}" fill="url(#softk)"/>`;

// ---------------------------------------------------------------- night sky + far hills (shared by the loch and the croft)
const ridge = (x, seed, amp) => amp * (0.5 + 0.3 * Math.sin(x * 0.004 + seed) + 0.2 * Math.sin(x * 0.011 + seed * 2.3) + 0.07 * Math.sin(x * 0.037 + seed * 5));
function hillPath(c, base, seed, amp, par) {
  let d = `M-40,${n(base)}`;
  for (let x = -40; x <= W + 40; x += 36) d += ` L${x},${n(base - ridge(x + c.x * par, seed, amp) + jit(seed * 91 + x, 3))}`;
  return d + ` L${W + 40},${n(base)} Z`;
}
function nightSky(c, t, o = {}) {
  const hy = P(c, 0, 0, 4000).y, [mx, my, mr] = o.moon || [800, hy * 0.36, 58];
  let s = `<rect width="${W}" height="${H}" fill="${LC.sky0}"/>`;
  [0.3, 0.6, 0.84].forEach((f, i) => { s += band(wline(hy * f, 11 + i, 16, 150), LC["sky" + (i + 1)]); });
  for (let i = 0; i < 70; i++) { const x = hash(i * 3.1) * W, y = hash(i * 7.7 + 2) * hy * 0.9, tw = 0.55 + 0.45 * Math.sin(t * (1 + hash(i) * 2) + i); s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1 + hash(i + 0.4) * 1.8)}" fill="${LC.star}" opacity="${n(tw * (0.4 + 0.6 * hash(i + 9)))}"/>`; }
  if (o.moon !== false) {
    s += flat(ring(mx, my, mr * 2.8, 5, 0.06), LC.moon, `opacity="0.08"`) + flat(ring(mx, my, mr * 1.7, 9, 0.06), LC.moon, `opacity="0.16"`) + flat(ring(mx, my, mr, 3, 0.02, 20), LC.moon);
    s += flat(ring(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 4, 0.1, 10), LC.moonS) + flat(ring(mx + mr * 0.25, my + mr * 0.3, mr * 0.15, 6, 0.1, 10), LC.moonS) + flat(ring(mx + mr * 0.3, my - mr * 0.4, mr * 0.1, 8, 0.1, 8), LC.moonS);
  }
  [[0.2, 0.5, 250], [0.7, 0.66, 320], [0.45, 0.24, 200]].forEach(([fx, fy, r], i) => { s += flat(ring(((fx * W + t * 4 * (i + 1)) % (W + 600)) - 100, hy * fy, r, 20 + i, 0.14, 14, 0.12), LC.cloud, `opacity="0.6"`); });
  return { svg: s, hy, mx, my, mr };
}

// ---------------------------------------------------------------- the loch shore
// The camera stands on the shore looking out: ground until shoreZ(X), black glass beyond, the far shore at Z = 90.
export const LOCH = { shore: 4.7, horse: { X: -0.55, Y: -0.2, Z: 6.6 }, kid: { X: 1.55, Z: 4.3 }, keeper: { X: 2.2, Z: 4.1 },
  kids: [{ X: -1.7, Z: 4.4, kind: 0 }, { X: -1.05, Z: 4.25, kind: 1 }, { X: -0.5, Z: 4.4, kind: 2 }],
  props: [{ kind: "boulder", X: -2.9, Z: 4.5, size: 0.62, seed: 3 }, { kind: "heather", X: -3.4, Z: 3.6, size: 0.9, seed: 5 }, { kind: "boulder", X: 3.1, Z: 4.4, size: 0.42, seed: 8 }, { kind: "heather", X: 3.2, Z: 3.5, size: 0.8, seed: 9 }, { kind: "heather", X: 2.3, Z: 4.5, size: 0.5, seed: 12 }, { kind: "boulder", X: -1.2, Z: 5.4, size: 0.24, seed: 14 }],
  cam: { wide: { x: 0, y: 1.35, z: -1.3, h0: 1090 }, hero: { x: -0.25, y: 1.15, z: 2.3, h0: 1100 }, long: { x: -1.0, y: 1.25, z: 0.6, h0: 1090 }, two: { x: 0.7, y: 1.1, z: 1.4, h0: 1120 } } };
export const shoreZ = (X) => LOCH.shore + 0.3 * Math.sin(X * 0.7 + 1) + 0.12 * Math.sin(X * 2.1);
export function boulder(c, o = {}) {
  const Z = o.Z ?? 4; if (!vis(c, Z)) return "";
  const b = board(c, o.X ?? 0, 0, Z, o.size ?? 0.5), sd = o.seed ?? 1, r = b.k;
  const d = ring(b.p.x, b.p.y - r * 0.52, r, sd, 0.14, 10, 0.66);
  return ell(b.p.x, b.p.y, r * 1.15, r * 0.16, "url(#softk)") + shp(d, LC.rock, b.lw) +
    flat(ring(b.p.x + r * 0.1, b.p.y - r * 0.3, r * 0.8, sd + 3, 0.14, 10, 0.5), LC.rockS, `opacity="0.75"`) +
    flat(ring(b.p.x - r * 0.18, b.p.y - r * 0.78, r * 0.6, sd + 5, 0.16, 9, 0.42), LC.rockL) +
    ln(`M${n(b.p.x - r * 0.7)},${n(b.p.y - r * 0.82)} Q${n(b.p.x - r * 0.2)},${n(b.p.y - r * 1.2)} ${n(b.p.x + r * 0.35)},${n(b.p.y - r * 1.04)}`, LC.rockH, Math.max(1.5, r * 0.035)) +
    [0, 1, 2].map((i) => ell(b.p.x + jit(sd + i * 3, r * 0.5), b.p.y - r * (0.3 + hash(sd + i) * 0.4), r * 0.07, r * 0.04, LC.heathL, `opacity="0.8"`)).join("");
}
export function heather(c, o = {}) {
  const Z = o.Z ?? 4; if (!vis(c, Z)) return "";
  const b = board(c, o.X ?? 0, 0, Z, o.size ?? 0.8), sd = o.seed ?? 1, r = b.k * 0.5;
  let s = flat(ring(b.p.x, b.p.y - r * 0.38, r, sd, 0.16, 14, 0.5), LC.heath) + flat(ring(b.p.x - r * 0.1, b.p.y - r * 0.5, r * 0.75, sd + 2, 0.18, 12, 0.42), LC.heathL, `opacity="0.7"`);
  for (let i = 0; i < 34; i++) {
    const x = b.p.x + jit(sd * 7 + i, r * 0.9), y = b.p.y - r * (0.25 + hash(sd * 3 + i) * 0.55) * (1 - 0.5 * Math.abs(x - b.p.x) / r), h = r * (0.16 + hash(sd + i * 2) * 0.16), lx = jit(sd + i * 5, r * 0.07);
    s += ln(`M${n(x)},${n(y)} L${n(x + lx)},${n(y - h)}`, hash(sd + i * 9) > 0.35 ? LC.bloom : LC.bloomL, Math.max(1.6, r * 0.045));
  }
  return s;
}
export function loch(c, t, o = {}) {
  const sk = nightSky(c, t, o), wy = P(c, 0, 0, 90).y, sy = P(c, c.x, 0, LOCH.shore).y, mist = o.mist ?? 1;
  let s = sk.svg;
  const hf = hillPath(c, wy, 2, 150, 2), hn = hillPath(c, wy, 7, 95, 6);
  s += flat(hf, LC.hillF) + flat(hn, LC.hillN);
  // the water: lighter under the far shore, black glass at our feet
  s += `<rect x="-40" y="${n(wy)}" width="${W + 80}" height="${n(H - wy + 40)}" fill="${LC.w0}"/>`;
  [0.1, 0.32, 0.62].forEach((f, i) => { s += band(wline(wy + (sy - wy) * f, 31 + i, 2.5, 220), LC["w" + (i + 1)]); });
  s += `<g transform="translate(0,${n(wy)}) scale(1,-0.75) translate(0,${n(-wy)})" opacity="0.55">${flat(hf, LC.w3)}${flat(hn, LC.w3)}</g>`;
  for (let i = 0; i < 14; i++) { const y = wy + 8 + hash(i * 5.3) * (sy - wy), x = hash(i * 2.9 + 1) * W; s += ln(`M${n(x)},${n(y)} h${n(120 + hash(i) * 260)}`, LC.glint, 1.6, `opacity="${n(0.2 + hash(i + 4) * 0.25)}"`); }
  if (o.moon !== false) for (let i = 0; i < 24; i++) {   // the moon's road
    const f = i / 23, y = wy + 5 + f ** 1.4 * (sy - wy + 60), w = sk.mr * (0.45 + 2.3 * f) * (0.45 + hash(i * 1.7)), x = sk.mx + jit(i * 4.1, sk.mr * f * 1.3) + Math.sin(t * 0.9 + i * 1.3) * 4;
    s += ell(x, y, w, 1.6 + 5 * f, LC.moon, `opacity="${n(0.9 - 0.45 * f)}"`);
  }
  s += lightBlobs(W / 2, wy, [620, 420], LC.mist, [0.1 * mist, 0.14 * mist], 41, 0.07);
  for (let i = 0; i < 2; i++) s += flat(ring(((i * 620 + t * 9 * (i ? 1 : -1)) % (W + 700) + W + 700) % (W + 700) - 350, lerp(wy, sy, 0.12 + i * 0.2), 300 + 50 * i, 50 + i, 0.1, 16, 0.09), LC.mist, `opacity="${n(0.16 * mist)}" style="mix-blend-mode:screen"`);
  if (o.haze) s += lightBlobs(o.haze[0], o.haze[1], [o.haze[2], o.haze[2] * 0.62], LC.mist, [0.1, 0.13], 45, 0.5);
  // the shore we stand on
  const top = []; for (let X = c.x - 9; X <= c.x + 9; X += 0.45) top.push(P(c, X, 0, Math.max(shoreZ(X), c.z + NEAR + 0.05)));
  const lap = top.map((p, i) => ({ x: p.x, y: p.y - 3 - 2.5 * Math.sin(t * 1.1 + i * 0.7) }));
  s += ln("M" + lap.map(pt).join(" L"), LC.wet, 2.4, `opacity="0.55"`);
  s += `<path d="M-40,${H + 40} L${top.map(pt).join(" L")} L${W + 40},${H + 40} Z" fill="${LC.shore}"/>` + ln("M" + top.map(pt).join(" L"), LC.wet, 3.2);
  for (let i = 0; i < 70; i++) {
    const X = c.x + jit(i * 3.7, 5), Zs = shoreZ(X), Z = lerp(c.z + 0.8, Zs - 0.04, hash(i * 1.9 + 3)); if (!vis(c, Z)) continue;
    const p = P(c, X, 0, Z), r = p.s * (0.025 + hash(i) * 0.04);
    s += ell(p.x, p.y, r, r * 0.5, LC.peb) + ln(`M${n(p.x - r * 0.6)},${n(p.y - r * 0.3)} q${n(r * 0.5)},${n(-r * 0.3)} ${n(r)},0`, LC.pebL, Math.max(1, r * 0.14), `opacity="0.7"`);
  }
  if (o.props !== false) [...LOCH.props].sort((a, b) => b.Z - a.Z).forEach((q) => { s += q.kind === "boulder" ? boulder(c, q) : heather(c, q); });
  let f = "";
  for (let i = 0; i < 3; i++) f += flat(ring(((i * 470 + 200 + t * 14 * (i % 2 ? 1 : -1)) % (W + 800) + W + 800) % (W + 800) - 400, lerp(wy, sy, 0.5 + i * 0.2), 330 + 40 * i, 60 + i, 0.1, 16, 0.085), LC.mist, `opacity="${n(0.13 * mist)}" style="mix-blend-mode:screen"`);
  if (o.props !== false) f += `<g opacity="0.92">${heather(c, { X: c.x - 1.0, Z: c.z + 2.5, size: 1.1, seed: 21 })}${heather(c, { X: c.x + 1.1, Z: c.z + 2.3, size: 0.9, seed: 23 })}</g>`;
  return { back: s, front: f };
}

// ---------------------------------------------------------------- under the loch (cold silver-green; the bed is Y = 0)
export const UNDER = { horse: { X: -0.7, Y: 1.3, Z: 6 }, kid: { X: 1.3, Y: 1.9, Z: 5.6 }, cam: { main: { x: 0, y: 2.2, z: 0, h0: 1000 } } };
export function frond(c, o = {}, t = 0) {
  const Z = o.Z ?? 6; if (!vis(c, Z)) return "";
  const p = P(c, o.X ?? 0, 0, Z), k = p.s, h = (o.h ?? 2) * k, sd = o.seed ?? 1, N = 7, ws = [0.1, 0.15, 0.15, 0.13, 0.1, 0.07, 0.02].map((w) => w * k * (o.w ?? 1));
  let s = "";
  for (let b = 0; b < 3; b++) {
    const hh = h * (1 - b * 0.22), x0 = p.x + (b - 1) * k * 0.16;
    const cs = Array.from({ length: N }, (_, j) => { const u = j / (N - 1); return [x0 + (Math.sin(t * 0.9 + sd + b * 1.7 + u * 3.2) * 0.2 + (b - 1) * 0.25 * u) * k * u * (0.6 + (o.h ?? 2) * 0.2), p.y - hh * u]; });
    s += flat(ribbon(cs, ws), o.dark ? UC.kelpN : b === 1 ? UC.kelp : mix(UC.kelp, UC.kelpF, 0.5)) + (o.dark ? "" : ln(spline(cs, false), UC.kelpL, Math.max(1.2, k * 0.012), `opacity="0.7"`));
  }
  return s;
}
export function under(c, t, o = {}) {
  const dp = clamp(o.depth ?? 0.4);
  let s = `<rect width="${W}" height="${H}" fill="${UC.w0}"/>`;
  [0.13, 0.33, 0.56, 0.8].forEach((f, i) => { s += band(wline(H * f * (1 - dp * 0.45), 11 + i, 26, 160), UC["w" + (i + 1)]); });
  if (o.surface !== false) {
    const a = wline(64 - dp * 80, 3, 16, 90).map((q, i) => ({ x: q.x, y: q.y + Math.sin(t * 1.4 + i * 0.9) * 8 }));
    s += `<path d="M-40,-40 L${a.map(pt).join(" L")} L${W + 40},-40 Z" fill="${UC.surf}" opacity="0.9"/>`;
    for (let i = 0; i < 9; i++) s += flat(ring(hash(i * 3.3) * W, 110 - dp * 80 + hash(i) * 70, 40 + hash(i + 2) * 60, 70 + i, 0.2, 10, 0.22), UC.surf, `opacity="0.35"`);
  }
  for (let i = 0; i < 6; i++) {
    const x0 = 40 + i * 185 + Math.sin(t * 0.35 + i) * 24, w0 = 46 + hash(i * 2.2) * 70, yb = H * (0.62 + hash(i + 5) * 0.3), sl = 250 + hash(i) * 80;
    s += `<path d="M${n(x0)},-20 L${n(x0 + w0)},-20 L${n(x0 + w0 * 2.2 - sl)},${n(yb)} L${n(x0 - w0 * 0.6 - sl)},${n(yb)} Z" fill="${UC.shaft}" opacity="${n((0.1 + hash(i * 7) * 0.12) * (1 - dp * 0.5))}" style="mix-blend-mode:screen"/>`;
  }
  s += band(wline(P(c, 0, 0, 16).y, 5, 12, 130), UC.bed) + `<g opacity="0.55">${[-5, -3.2, -1, 1.4, 3.6, 5.5].map((X, i) => frond(c, { X, Z: 11 + (i % 2), h: 2.2 + hash(i) * 1.6, seed: i * 3 }, t)).join("")}</g>`;
  s += band(wline(P(c, 0, 0, 8.6).y, 8, 14, 120), mix(UC.bed, UC.bedN, 0.5));
  [[-2.6, 8.2, 0.5], [2.9, 7.6, 0.6], [0.6, 8.4, 0.3]].forEach(([X, Z, r], i) => { const p = P(c, X, 0, Z); s += shp(ring(p.x, p.y - r * p.s * 0.4, r * p.s, 80 + i, 0.14, 10, 0.6), UC.rock, 1.5) + flat(ring(p.x - r * p.s * 0.2, p.y - r * p.s * 0.65, r * p.s * 0.55, 84 + i, 0.14, 9, 0.4), UC.w3, `opacity="0.7"`); });
  s += [-3.2, -2.1, 2.2, 3.4].map((X, i) => frond(c, { X, Z: 7.4 + (i % 2) * 0.5, h: 2.4 + hash(i + 3) * 1.4, seed: 10 + i * 2 }, t)).join("");
  let f = band(wline(P(c, 0, 0, 3.9).y, 9, 16, 110), UC.bedN);
  f += [-1.75, -1.2, 1.3, 1.85].map((X, i) => frond(c, { X: c.x + X, Z: c.z + 3 + (i % 2) * 0.4, h: 1.5 + hash(i + 7) * 1.1, seed: 30 + i * 2, dark: true, w: 1.3 }, t)).join("");
  for (let i = 0; i < 46; i++) { const x = hash(i * 1.3) * W + Math.sin(t * 0.6 + i) * 10, y = ((hash(i * 4.7) * H - t * 16 * (0.4 + hash(i))) % H + H) % H; f += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1.4 + hash(i + 2) * 3)}" fill="${UC.shaft}" opacity="${n(0.2 + hash(i + 8) * 0.3)}"/>`; }
  return { back: s, front: f };
}
export function bubble(x, y, r) { return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${UC.surf}" fill-opacity="0.16" stroke="${UC.surf}" stroke-width="${n(Math.max(1.4, r * 0.14))}" opacity="0.85"/><path d="M${n(x - r * 0.5)},${n(y - r * 0.2)} q${n(r * 0.1)},${n(-r * 0.4)} ${n(r * 0.45)},${n(-r * 0.45)}" stroke="#fff" stroke-width="${n(Math.max(1.2, r * 0.16))}" fill="none" stroke-linecap="round"/>`; }
// a trail of bubbles rising from a screen point
export function bubbles(x, y, t, N = 9, seed = 1, spread = 60) { let s = ""; for (let i = 0; i < N; i++) { const f = ((t * (0.25 + hash(seed + i) * 0.2) + hash(seed * 3 + i)) % 1 + 1) % 1; s += bubble(x + jit(seed * 7 + i, spread) + Math.sin(t * 2 + i) * 8, y - f * 620, 5 + hash(seed + i * 5) * 15 * (0.5 + f)); } return s; }

// ---------------------------------------------------------------- Grandma's croft (a low drystone blackhouse, thatch roped down with stones)
export const CROFT = { z: 7.2, x0: -3.3, x1: 3.3, wallH: 2.0, door: { x0: 0.5, x1: 1.42, h: 1.62 }, win: { x0: -1.8, x1: -1.2, y0: 0.85, y1: 1.38 },
  step: { X: 0.96, Z: 7.0 }, kid: { X: -0.6, Z: 5.2 }, horse: { X: -1.4, Z: 5.6 },
  cam: { wide: { x: 0.2, y: 1.3, z: 0.4, h0: 1150 }, door: { x: 0.75, y: 1.05, z: 3.5, h0: 1090 } } };
export function croft(c, t, o = {}) {
  const K = CROFT, op = clamp(o.open ?? 1), gl = (o.glow ?? 1) * (1 + 0.05 * Math.sin(t * 9) + 0.04 * Math.sin(t * 14.3 + 1)), D = K.door, Wn = K.win;
  const sk = nightSky(c, t, { moon: o.moon || [230, 300, 54] }), gy = P(c, 0, 0, 40).y;
  let s = sk.svg + flat(hillPath(c, gy, 4, 200, 3), LC.hillF) + flat(hillPath(c, gy, 9, 110, 8), LC.hillN) + lightBlobs(W / 2, gy, [600], LC.mist, [0.1], 43, 0.08);
  s += band(wline(gy, 3, 4, 200), CC.turf) + band(wline(P(c, 0, 0, K.z + 3).y, 6, 5, 160), mix(CC.turf, "#000000", 0.25));
  const b = board(c, 0, 0, K.z), dcx = (D.x0 + D.x1) / 2;
  const warm = (col, x, y, amt = 0.75) => mix(col, CC.fire, gl * op * amt * clamp(1 - Math.hypot(x - dcx, (y - 0.7) * 0.8) / 1.7));
  // roof
  const rf = [[K.x0 - 0.3, 1.9], [K.x0 - 0.12, 2.5], [K.x0 + 0.7, 3.15], [K.x0 + 1.7, 3.42], [0, 3.48], [K.x1 - 1.7, 3.42], [K.x1 - 0.7, 3.15], [K.x1 + 0.12, 2.5], [K.x1 + 0.3, 1.9]];
  const rfd = spline(rf.map(([x, y]) => [b.x(x), b.y(y)]), false) + " Z";
  const chx = K.x1 - 1.25;
  for (let i = 0; i < 6; i++) { const f = ((t * 0.11 + i / 6) % 1 + 1) % 1; s += flat(ring(b.x(chx + f * 1.1 + Math.sin(t * 0.7 + i) * 0.08), b.y(3.85 + f * 2.3), b.k * (0.16 + f * 0.42), 90 + i, 0.14, 12), CC.smoke, `opacity="${n((1 - f) * 0.4)}"`); }
  s += shp(hd(b, [[chx - 0.28, 3.2], [chx + 0.28, 3.2], [chx + 0.24, 3.84], [chx - 0.24, 3.84]], 7, 0.012), CC.stone[2], b.lw) + ln(`M${b.pt(chx - 0.26, 3.52)} L${b.pt(chx + 0.26, 3.5)} M${b.pt(chx - 0.02, 3.52)} L${b.pt(chx - 0.02, 3.82)}`, CC.mortar, b.lw);
  s += shp(rfd, CC.thatch, b.lw * 1.2) + flat(spline([[K.x0 + 0.5, 2.9], [K.x0 + 1.7, 3.36], [0, 3.42], [K.x1 - 2.2, 3.3], [K.x1 - 3, 3.05], [0, 3.12], [K.x0 + 1.6, 2.98]].map(([x, y]) => [b.x(x), b.y(y)])), CC.thatchL, `opacity="0.8"`);
  for (let i = 0; i < 90; i++) { const x = lerp(K.x0, K.x1, hash(i * 1.9)), ed = Math.min(1, (Math.min(x - K.x0, K.x1 - x) + 0.3) / 1.6), y = lerp(2.0, 1.95 + 1.4 * Math.sqrt(ed), hash(i * 4.3 + 1)); s += ln(`M${b.pt(x, y)} L${b.pt(x + jit(i, 0.03), y - 0.14 - hash(i) * 0.1)}`, hash(i + 3) > 0.5 ? CC.thatchL : CC.thatchS, b.lw, `opacity="0.7"`); }
  for (let i = 0; i < 9; i++) {   // ropes over the thatch, a stone on each end
    const x = lerp(K.x0 + 0.25, K.x1 - 0.25, i / 8), ed = Math.min(1, (Math.min(x - K.x0, K.x1 - x) + 0.3) / 1.6), ty = 1.95 + 1.45 * Math.sqrt(ed);
    s += ln(`M${b.pt(x + 0.1, ty)} L${b.pt(x, 1.72)}`, CC.rope, b.lw * 1.2) + shp(ring(b.x(x), b.y(1.64), b.k * 0.085, 100 + i, 0.14, 8, 0.85), CC.stone[i % 4], b.lw);
  }
  s += ln(spline([[K.x0 - 0.1, 2.42], [K.x0 + 1.5, 2.6], [0, 2.66], [K.x1 - 1.5, 2.6], [K.x1 + 0.1, 2.42]].map(([x, y]) => [b.x(x), b.y(y)]), false), CC.rope, b.lw * 1.2);
  // the wall, stone by stone
  s += shp(hd(b, [[K.x0, 0], [K.x1, 0], [K.x1, K.wallH], [K.x0, K.wallH]], 3, 0.02, 0.4), CC.mortar, b.lw * 1.2);
  let y = 0, row = 0;
  while (y < K.wallH - 0.05) {
    const h = Math.min(K.wallH - y, 0.2 + hash(row * 3.1) * 0.12); let x = K.x0 - hash(row * 1.7) * 0.3, i = 0;
    while (x < K.x1 - 0.04) {
      const w = 0.28 + hash(row * 17 + i * 3.3) * 0.42, xa = Math.max(K.x0 + 0.02, x), xb = Math.min(K.x1 - 0.02, x + w), cx = (xa + xb) / 2, cy = y + h / 2, g = 0.014;
      const inDoor = cx > D.x0 - 0.12 && cx < D.x1 + 0.12 && cy < D.h + 0.12, inWin = cx > Wn.x0 - 0.08 && cx < Wn.x1 + 0.08 && cy > Wn.y0 - 0.06 && cy < Wn.y1 + 0.06;
      if (!inDoor && !inWin && xb - xa > 0.1) {
        const col = warm(mix(CC.stone[Math.floor(hash(row * 5 + i * 7.7) * 5)], LC.hillN, 0.18 + 0.2 * (1 - y / K.wallH)), cx, cy);
        s += shp(hd(b, [[xa + g, y + g], [xb - g, y + g], [xb - g, y + h - g], [xa + g, y + h - g]], row * 31 + i, 0.014, 0.16), col, b.lw * 0.8) + ln(`M${b.pt(xa + 0.04, y + h - 0.04)} L${b.pt(xb - 0.06, y + h - 0.035)}`, CC.stoneL, b.lw, `opacity="0.35"`);
      }
      x += w; i++;
    }
    y += h; row++;
  }
  s += flat(hd(b, [[K.x0 - 0.3, 1.9], [K.x1 + 0.3, 1.9], [K.x1, 1.7], [K.x0, 1.7]], 5, 0.01, 0.5), "#04050c", `opacity="0.5"`);
  // window
  s += shp(hd(b, [[Wn.x0 - 0.07, Wn.y0 - 0.06], [Wn.x1 + 0.07, Wn.y0 - 0.06], [Wn.x1 + 0.07, Wn.y1 + 0.06], [Wn.x0 - 0.07, Wn.y1 + 0.06]], 11, 0.01), CC.stone[2], b.lw) +
    shp(hd(b, [[Wn.x0, Wn.y0], [Wn.x1, Wn.y0], [Wn.x1, Wn.y1], [Wn.x0, Wn.y1]], 12, 0.006), mix("#1a1020", CC.fire, 0.75 * gl), b.lw) + flat(hd(b, [[Wn.x0 + 0.05, Wn.y0 + 0.04], [Wn.x1 - 0.05, Wn.y0 + 0.04], [Wn.x1 - 0.1, Wn.y0 + 0.3], [Wn.x0 + 0.1, Wn.y0 + 0.3]], 13, 0.01), CC.fireL, `opacity="${n(0.6 * gl)}"`) +
    ln(`M${b.pt((Wn.x0 + Wn.x1) / 2, Wn.y0)} L${b.pt((Wn.x0 + Wn.x1) / 2, Wn.y1)} M${b.pt(Wn.x0, (Wn.y0 + Wn.y1) / 2)} L${b.pt(Wn.x1, (Wn.y0 + Wn.y1) / 2)}`, CC.woodS, b.lw * 2.4) +
    lightBlobs(b.x((Wn.x0 + Wn.x1) / 2), b.y((Wn.y0 + Wn.y1) / 2), [b.k * 0.75, b.k * 0.45], CC.fire, [0.1 * gl, 0.16 * gl], 47);
  // the doorway: lintel, jambs, the room and its peat fire, then the door leaf
  const id = `cd${UID++}`, dw = D.x1 - D.x0;
  s += shp(hd(b, [[D.x0 - 0.22, D.h], [D.x1 + 0.22, D.h], [D.x1 + 0.2, D.h + 0.22], [D.x0 - 0.2, D.h + 0.22]], 15, 0.012), warm(CC.stone[1], dcx, D.h, 0.5), b.lw) +
    shp(hd(b, [[D.x0 - 0.1, 0], [D.x0, 0], [D.x0, D.h], [D.x0 - 0.1, D.h]], 16, 0.01), warm(CC.stone[2], D.x0, 0.8, 0.9), b.lw) + shp(hd(b, [[D.x1, 0], [D.x1 + 0.1, 0], [D.x1 + 0.1, D.h], [D.x1, D.h]], 17, 0.01), warm(CC.stone[2], D.x1, 0.8, 0.9), b.lw);
  const hole = `M${b.pt(D.x0, 0)} L${b.pt(D.x1, 0)} L${b.pt(D.x1, D.h)} L${b.pt(D.x0, D.h)} Z`;
  let room = `<path d="${hole}" fill="${mix("#0a0608", CC.room, gl)}"/>`;
  const fx = b.x(D.x0 + dw * 0.56), fy = b.y(0.2);
  room += lightBlobs(fx, fy, [b.k * 1.1, b.k * 0.7, b.k * 0.42], CC.fire, [0.35 * gl, 0.45 * gl, 0.55 * gl], 51) + flat(hd(b, [[D.x0, 0], [D.x1, 0], [D.x1, 0.14], [D.x0, 0.14]], 18, 0.01), CC.peat);
  room += ln(`M${n(fx)},${b.y(D.h)} L${n(fx)},${b.y(0.78)}`, CC.iron, b.lw * 1.6) + `<path d="M${b.pt(D.x0 + dw * 0.56 - 0.16, 0.78)} q${n(b.k * 0.16)},${n(b.k * 0.34)} ${n(b.k * 0.32)},0 Z" fill="${CC.iron}"/>`;
  [[-0.13, 0.3, 1], [0.02, 0.42, 2.1], [0.15, 0.27, 3.3]].forEach(([dx, hh, ph]) => { const x = fx + dx * b.k, h2 = hh * b.k * gl * (1 + 0.14 * Math.sin(t * 11 + ph)), w2 = 0.085 * b.k; room += `<path d="M${n(x)},${n(fy - h2)} Q${n(x + w2 * 1.3)},${n(fy - h2 * 0.3)} ${n(x + w2 * 0.4)},${n(fy + 4)} L${n(x - w2 * 0.6)},${n(fy + 4)} Q${n(x - w2 * 1.3)},${n(fy - h2 * 0.35)} ${n(x)},${n(fy - h2)} Z" fill="${CC.fire}"/><path d="M${n(x)},${n(fy - h2 * 0.6)} Q${n(x + w2 * 0.6)},${n(fy - h2 * 0.2)} ${n(x)},${n(fy + 2)} Q${n(x - w2 * 0.6)},${n(fy - h2 * 0.2)} ${n(x)},${n(fy - h2 * 0.6)} Z" fill="${CC.fireL}"/>`; });
  [[0.3, 0.04], [0.5, 0.03], [0.72, 0.05]].forEach(([u, yy], i) => { room += shp(hd(b, [[D.x0 + dw * u - 0.12, yy], [D.x0 + dw * u + 0.12, yy], [D.x0 + dw * u + 0.1, yy + 0.11], [D.x0 + dw * u - 0.1, yy + 0.11]], 19 + i, 0.01), CC.peatL, b.lw * 0.8); });
  const lw2 = dw * Math.cos(op * 1.35), far = 1 - 0.1 * Math.sin(op * 1.35);   // the leaf swings in on the left jamb
  const lf = [[D.x0, 0.02], [D.x0 + lw2, 0.02 + (1 - far) * 0.5], [D.x0 + lw2, D.h * far], [D.x0, D.h - 0.02]];
  let leaf = shp(hd(b, lf, 20, 0.006), mix(CC.wood, CC.woodS, op * 0.5), b.lw);
  for (let i = 1; i < 4; i++) leaf += ln(`M${b.pt(D.x0 + lw2 * i / 4, 0.03)} L${b.pt(D.x0 + lw2 * i / 4, D.h * lerp(1, far, i / 4) - 0.03)}`, CC.woodS, b.lw * 1.2);
  [0.32, 1.25].forEach((yy) => { leaf += ln(`M${b.pt(D.x0, yy)} L${b.pt(D.x0 + lw2 * 0.8, yy * lerp(1, far, 0.8) + (1 - far) * 0.2)}`, CC.iron, b.lw * 3); });
  if (op < 0.4) leaf += `<circle cx="${n(b.x(D.x0 + lw2 * 0.86))}" cy="${n(b.y(0.82))}" r="${n(b.k * 0.03)}" fill="${CC.iron}" stroke="${CC.woodL}" stroke-width="${b.lw}"/>`;
  s += `<clipPath id="${id}"><path d="${hole}"/></clipPath><g clip-path="url(#${id})">${room}${leaf}</g>` + ln(hole, INK, b.lw * 1.4);
  // doorstep, path, peat stack, the light on the ground
  const gp = (X, Z) => pt(P(c, X, 0, Math.max(Z, c.z + NEAR + 0.05)));
  s += `<path d="M${gp(D.x0 - 0.1, K.z)} L${gp(D.x1 + 0.1, K.z)} L${gp(D.x1 + 1.0, c.z + 0.6)} L${gp(D.x0 - 1.2, c.z + 0.6)} Z" fill="${CC.path}"/>`;
  for (let i = 0; i < 9; i++) { const Z = K.z - 0.35 - i * 0.55, X = dcx + jit(i * 3.3, 0.3) * (1 + i * 0.3), p = P(c, X, 0, Z); if (vis(c, Z)) s += shp(ring(p.x, p.y, p.s * (0.24 + hash(i) * 0.1), 120 + i, 0.14, 9, 0.3), mix(CC.stone[i % 4], LC.hillN, 0.45), LW(p.s)); }
  s += shp(`M${gp(D.x0 - 0.16, K.z)} L${gp(D.x1 + 0.16, K.z)} L${gp(D.x1 + 0.2, K.z - 0.28)} L${gp(D.x0 - 0.2, K.z - 0.28)} Z`, warm(CC.stone[3], dcx, 0.3, 0.8), b.lw);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const x = D.x1 + 0.55 + r * 0.1 + i * 0.24, yy = r * 0.15; s += shp(hd(b, [[x, yy], [x + 0.22, yy], [x + 0.22, yy + 0.13], [x, yy + 0.13]], 200 + r * 9 + i, 0.012), warm(hash(r * 7 + i) > 0.5 ? CC.peat : CC.peatL, x - 0.5, yy, 0.5), b.lw * 0.8); }
  if (op * gl > 0.02) {
    s += `<path d="M${gp(D.x0, K.z)} L${gp(D.x1, K.z)} L${gp(D.x1 + 1.7, K.z - 4.2)} L${gp(D.x0 - 1.5, K.z - 4.2)} Z" fill="${CC.fire}" opacity="${n(0.24 * op * gl)}" style="mix-blend-mode:screen"/><path d="M${gp(D.x0 + 0.08, K.z)} L${gp(D.x1 - 0.08, K.z)} L${gp(D.x1 + 0.6, K.z - 2.6)} L${gp(D.x0 - 0.5, K.z - 2.6)} Z" fill="${CC.fireL}" opacity="${n(0.2 * op * gl)}" style="mix-blend-mode:screen"/>`;
    s += lightBlobs(b.x(dcx), b.y(0.75), [b.k * 1.9, b.k * 1.25], CC.fire, [0.09 * op * gl, 0.13 * op * gl], 53);
  }
  s += heather(c, { X: K.x0 + 0.9, Z: K.z - 0.25, size: 0.7, seed: 31 }) + heather(c, { X: -0.5, Z: K.z - 0.2, size: 0.5, seed: 33 }) + boulder(c, { X: K.x0 + 2.2, Z: K.z - 0.5, size: 0.3, seed: 35 });
  const f = `<g opacity="0.95">${heather(c, { X: c.x - 1.2, Z: c.z + 1.7, size: 0.9, seed: 37 })}${boulder(c, { X: c.x + 1.35, Z: c.z + 1.9, size: 0.3, seed: 39 })}</g>`;
  return { back: s, front: f };
}

// ---------------------------------------------------------------- the kelpie
// Local units: cm, hooves at 0, up = -y, facing +x (dir flips it). The barrel stretches behind the withers: len riders.
const braid = (d, w, k = 1) => `<path d="${d}" stroke="${INK}" stroke-width="${n(w + 1.4 * k)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${M.weedS}" stroke-width="${n(w)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${M.weed}" stroke-width="${n(w * 0.72)}" fill="none" stroke-dasharray="${n(w * 0.7)} ${n(w * 0.5)}"/><path d="${d}" stroke="${M.weedHi}" stroke-width="${n(w * 0.22)}" fill="none" stroke-dasharray="${n(w * 0.35)} ${n(w * 0.85)}" stroke-dashoffset="${n(w * 0.2)}"/>`;
const silverRing = (x, y, r) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="${INK}" stroke-width="${n(r * 0.75)}"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="#dfe8f4" stroke-width="${n(r * 0.48)}"/><path d="M${n(x - r * 0.9)},${n(y - r * 0.45)} A${n(r)},${n(r)} 0 0 1 ${n(x + r * 0.2)},${n(y - r)}" stroke="#ffffff" stroke-width="${n(r * 0.3)}" fill="none" stroke-linecap="round"/>`;
const drop = (x, y, r, col, op = 1) => `<path d="M${n(x)},${n(y - r * 2.2)} Q${n(x + r * 1.3)},${n(y + r * 0.2)} ${n(x)},${n(y + r)} Q${n(x - r * 1.3)},${n(y + r * 0.2)} ${n(x)},${n(y - r * 2.2)} Z" fill="${col}" opacity="${n(op)}"/>`;
export function kelpie(c, st = {}, t = 0) {
  const Z = st.Z ?? 6; if (!vis(c, Z)) return { svg: "", seats: [], p: null };
  const size = st.size ?? 1, dir = st.dir ?? 1, X0 = st.X ?? 0, Y0 = st.Y ?? 0, p = P(c, X0, Y0, Z), k = p.s / 100 * size;
  const K = clamp(st.kneel || 0), E = Math.max(0, (st.len ?? 1) - 1) * 36, ob = clamp(st.obey || 0), turn = clamp(st.turn || 0), fl = clamp(st.float || 0);
  const pitch = st.pitch || 0, wk = st.walk == null ? 0 : 1, walk = st.walk ?? 0, drip = st.drip ?? 1, glint = (st.glint ?? 1) * (1 - ob * 0.85);
  const bob = wk * Math.abs(Math.cos(walk * Math.PI * 2)) * 2.5;
  const hipX = -52 - E, a = Math.asin(K * 26 / (92 + E)), ca = Math.cos(a), sa = Math.sin(a), dropY = K * 28 - bob;
  const T = (x, y) => { const dx = x - hipX, dy = y + 100; return [hipX + dx * ca - dy * sa, -100 + dx * sa + dy * ca + dropY]; };
  const back = (x) => { const u = clamp((36 - x) / (36 - hipX)); return lerp(-152, -151, u) + Math.sin(Math.PI * u) * (7 + E * 0.05); };
  const belly = (x) => { const u = clamp((34 - x) / (34 - hipX - 8)); return lerp(-88, -91, u) + Math.sin(Math.PI * Math.min(1, u * 1.15)) * (6 + E * 0.03); };
  const coat = M.coat, es = `stroke="${M.edge}" stroke-width="0.9" stroke-linejoin="round"`;
  // legs: [upper joint, knee/hock, fetlock, hoof], near and far
  function leg(front, far) {
    const ph = wk ? walk * Math.PI * 2 + (front ? 0 : Math.PI) + (far ? Math.PI * 0.5 : 0) : 0, sw = wk * Math.sin(ph), lift = wk * Math.max(0, Math.cos(ph)) * 10, off = far ? (front ? 10 : 11) : 0;
    let J;
    if (front) {
      const el = T(40 + off * 0.6, -100), kn = [lerp(41, 62, K) + off + sw * 9 + lift * 0.7, lerp(-52, -7, K) - lift * 0.6], fe = [lerp(41, 37, K) + off + sw * 15, lerp(-13, -7, K) - lift], hf = [lerp(44, 23, K) + off + sw * 17, lerp(0, -5, K) - lift];
      J = [el, kn, fe, hf];
    } else {
      const sf = T(hipX + 2 + off * 0.6, -100), hk = [lerp(hipX - 18, hipX - 22, K) + off + sw * 9, lerp(-54, -36, K) - lift * 0.5], fe = [lerp(hipX - 10, hipX - 8, K) + off + sw * 15, lerp(-13, -10, K) - lift], hf = [hipX - 6 + off + sw * 17, -lift];
      J = [sf, hk, fe, hf];
    }
    const col = far ? M.far : coat, ha = front ? K * 105 : 0;
    let s = taper(J[0], J[1], front ? 19 : 25, front ? 10.5 : 11.5, col, es) + taper(J[1], J[2], front ? 9 : 10, 7.5, col, es) + `<circle cx="${n(J[1][0])}" cy="${n(J[1][1])}" r="${front ? 5.8 : 6.2}" fill="${col}" ${es}/>` + taper(J[2], [J[3][0] - 1, J[3][1] - 6], 8, 7.5, col, es);
    s += `<g transform="translate(${n(J[3][0])},${n(J[3][1])}) rotate(${n(-ha)})"><path d="M-6.5,0 L7.5,0 L5.2,-9.5 L-3.6,-9.5 Z" fill="${M.hoof}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-4,-8 L5,-8" stroke="${M.rim}" stroke-width="1" opacity="0.8"/></g>`;
    if (!far) s += ln(`M${n(J[0][0] + (front ? 7 : 9))},${n(J[0][1] + 10)} L${n(J[1][0] + 4)},${n(J[1][1] - 4)} M${n(J[1][0] + 3)},${n(J[1][1] + 6)} L${n(J[2][0] + 2.6)},${n(J[2][1] - 2)}`, M.rim, 1.5, `opacity="0.75"`);
    return s;
  }
  // barrel
  const NB = 4 + Math.round(E / 24), top = [], bot = [];
  for (let j = 0; j <= NB; j++) { const x = lerp(36, hipX + 2, j / NB); top.push(T(x, back(x))); }
  for (let j = 0; j <= NB; j++) { const x = lerp(hipX + 8, 30, j / NB); bot.push(T(x, belly(x))); }
  const body = spline([...top, T(hipX - 15, -145), T(hipX - 26, -127), T(hipX - 25, -104), T(hipX - 12, -91), ...bot, T(44, -94), T(58, -112), T(58, -132), T(48, -147)]);
  let sheen = ln(spline(top.map(([x, y]) => [x, y + 2.6]), false), M.rim, 2.6) + ln(spline(top.slice(1, -1).map(([x, y]) => [x - 2, y + 5.5]), false), M.hi, 1.1, `opacity="0.9" stroke-dasharray="14 9 5 12"`);
  const rp = T(hipX - 6, -128), shd = T(40, -122);
  sheen += ln(`M${n(rp[0] - 14)},${n(rp[1] - 6)} Q${n(rp[0] + 2)},${n(rp[1] - 20)} ${n(rp[0] + 20)},${n(rp[1] - 12)}`, M.rim, 3.2, `opacity="0.85"`) + ln(`M${n(rp[0] - 6)},${n(rp[1] - 9)} q8,-5 16,-3`, M.hi, 1.4);
  sheen += ln(`M${n(shd[0] - 12)},${n(shd[1] - 12)} Q${n(shd[0] + 6)},${n(shd[1] - 10)} ${n(shd[0] + 10)},${n(shd[1] + 12)}`, M.rim, 2.6, `opacity="0.7"`) + ln(`M${n(shd[0] + 2)},${n(shd[1] - 9)} q6,5 6,13`, M.hi, 1.2, `opacity="0.9"`);
  for (let x = 14; x > hipX + 16; x -= 13) { const q = T(x, back(x) + 16), q2 = T(x - 5, belly(x) - 12); sheen += ln(`M${n(q[0])},${n(q[1])} Q${n(q[0] - 9)},${n((q[1] + q2[1]) / 2)} ${n(q2[0])},${n(q2[1])}`, M.rim, 1, `opacity="${n(0.1 + Math.min(0.2, E * 0.003))}"`); }
  for (let i = 0; i < 6 + NB; i++) { const x = lerp(30, hipX - 8, hash(i * 2.3 + 1)), q = T(x, lerp(back(x) + 12, belly(x) - 8, hash(i * 5.1))); sheen += ln(`M${n(q[0])},${n(q[1])} l${n(1 + hash(i) * 2)},${n(5 + hash(i + 2) * 6)}`, M.hi, 0.9, `opacity="${n(0.35 + 0.3 * hash(i + 7))}"`); }
  // tail (hangs; drifts back and up when floating)
  const dock = T(hipX - 22, -137), td = [lerp(-0.22, -0.95, fl), lerp(1, -0.32, fl)], tl = Math.hypot(td[0], td[1]), tdx = td[0] / tl, tdy = td[1] / tl;
  const tailC = [0, 0.2, 0.45, 0.72, 1].map((u) => { const sv = Math.sin(t * (1.3 + fl) + u * 3) * (5 + fl * 9) * u; return [dock[0] + tdx * 104 * u - tdy * sv + (u > 0 ? -6 * Math.sin(u * Math.PI) * (1 - fl) : 0), dock[1] + tdy * 104 * u + tdx * sv]; });
  let tail = `<path d="${ribbon(tailC, [9, 16, 19, 15, 2])}" fill="${M.mane}" ${es}/>` + ln(spline(tailC.slice(0, 4).map(([x, y]) => [x - 3, y]), false), M.maneHi, 1.5, `opacity="0.85"`) + ln(spline(tailC.slice(1).map(([x, y], i) => [x + 3 + (i % 2) * 2, y]), false), M.weed, 2.2) + ln(spline(tailC.slice(1, 4).map(([x, y]) => [x + 1, y + 4]), false), M.weedHi, 0.8);
  // neck + head
  const bT = T(24, -151), bB = T(58, -118), bC = T(44, -136);
  const A = (lerp(58 - 18 * K, -14, ob) - (st.nod || 0) + wk * Math.sin(walk * Math.PI * 4) * 3) * Math.PI / 180, dA = [Math.cos(A), -Math.sin(A)], nA = [-Math.sin(A), -Math.cos(A)];
  const poll = [bC[0] + dA[0] * 76, bC[1] + dA[1] * 76], pT = [poll[0] + nA[0] * 9, poll[1] + nA[1] * 9], thr = [poll[0] - nA[0] * 14 - dA[0] * 5, poll[1] - nA[1] * 14 - dA[1] * 5];
  const cT = [(bT[0] + pT[0]) / 2 + nA[0] * 11, (bT[1] + pT[1]) / 2 + nA[1] * 11], cB = [(bB[0] + thr[0]) / 2 + nA[0] * 7, (bB[1] + thr[1]) / 2 + nA[1] * 7];
  const neck = `<path d="M${n(bT[0])},${n(bT[1])} Q${n(cT[0])},${n(cT[1])} ${n(pT[0])},${n(pT[1])} L${n(thr[0])},${n(thr[1])} Q${n(cB[0])},${n(cB[1])} ${n(bB[0])},${n(bB[1])} Z" fill="${coat}" ${es}/>` +
    ln(`M${n(thr[0] + 1)},${n(thr[1] + 3)} Q${n(cB[0] + 1)},${n(cB[1] + 1)} ${n(bB[0] - 2)},${n(bB[1] - 6)}`, M.rim, 1.6, `opacity="0.6"`);
  const theta = lerp(lerp(40, 4, ob), 8, turn) + (st.headTilt || 0), th = theta * Math.PI / 180;
  const hpt = (x, y, sx = 1) => [poll[0] + x * sx * Math.cos(th) + y * Math.sin(th), poll[1] - x * sx * Math.sin(th) + y * Math.cos(th)];   // head-local -> horse-local
  const eyeCol = mix(M.eye, "#55667a", ob * 0.8), bridleOn = (st.bridle ?? 1) > 0.5;
  const earR = ob * 55;
  let head, ringL, noseL, eyeL;
  const glow = (x, y) => glint > 0.02 ? `<circle cx="${x}" cy="${y}" r="15" fill="${M.eye}" opacity="${n(0.1 * glint)}" stroke="none"/><circle cx="${x}" cy="${y}" r="8.5" fill="${M.eye}" opacity="${n(0.24 * glint)}" stroke="none"/>` : "";
  if (turn < 0.5) {       // profile
    const sx = 1 - turn * 0.8;
    const hs = spline([[-3, -7], [6, -3], [10.5, 8], [11.5, 24], [10.5, 40], [12.5, 51], [11.5, 59], [5, 64.5], [-2.5, 63.5], [-6.5, 57], [-7, 46], [-13, 36], [-18.5, 25], [-19.5, 12], [-14, 1], [-8, -6]]);
    const ear = (x, r, col) => `<g transform="translate(${x},-4) rotate(${n(r - earR)})"><path d="M-4.5,2 Q-7,-12 -1.5,-24 Q4.5,-12 4,2 Z" fill="${col}" ${es}/><path d="M-1.6,-3 Q-2.6,-11 -1.2,-18" stroke="${M.rim}" stroke-width="1" fill="none" opacity="0.7"/></g>`;
    let br = "";
    if (bridleOn) br = braid("M12,41 Q3,45.5 -7.5,45", 3.6) + braid("M-4,44 Q-9,22 -8,-3", 3.2) + braid("M-9,5 Q0,7.5 10,5", 3) + silverRing(-4.5, 44.5, 3) + silverRing(-8.6, 4.6, 2.3) + `<path d="M3,46 q-1,5 1,8 M8,43.5 q1.5,4 0,7" stroke="${M.weed}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    head = `<g transform="translate(${n(poll[0])},${n(poll[1])}) rotate(${n(-theta)}) scale(${n(sx * 100) / 100},1)">${ear(3.5, 16, M.far)}${ear(-3.5, -8, coat)}
      <path d="${hs}" fill="${coat}" ${es}/>
      <path d="M8,-1 Q12.5,22 11.5,40 Q11.5,48 13.5,52" stroke="${M.rim}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M10,10 Q12,24 10.8,36" stroke="${M.hi}" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M-16,13 Q-17,27 -9,36" stroke="${M.rim}" stroke-width="1.6" fill="none" opacity="0.6" stroke-linecap="round"/>
      <ellipse cx="7.6" cy="55" rx="2.6" ry="3.6" transform="rotate(-18 7.6 55)" fill="#010206" stroke="${M.rim}" stroke-width="0.9"/><path d="M11.5,59.5 Q4,60.5 -2,57" stroke="${M.edge}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      ${br}${glow(2.4, 13.2)}
      <path d="M-3.4,14 Q1.6,8 7.4,12.4 Q3,17.6 -3.4,14 Z" fill="${eyeCol}" stroke="${INK}" stroke-width="0.8"/><path d="M-0.6,13 L4.6,12.6" stroke="${mix(eyeCol, "#274a44", 0.6)}" stroke-width="1.1" stroke-linecap="round"/>
      ${ob > 0.05 ? `<path d="M-3.8,14 Q1.6,7.6 7.8,12.2 Q2,${n(9.5 + ob * 5)} -3.8,14 Z" fill="${coat}" stroke="none"/>` : ""}<path d="M-4.4,${n(13.2 + ob)} Q1.6,${n(7 + ob * 2)} 8.2,${n(11.4 + ob)}" stroke="${M.edge}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </g>`;
    ringL = hpt(-4.5, 44.5, sx); noseL = hpt(13, 55, sx); eyeL = hpt(2.4, 13.2, sx);
  } else {                // front on: the long face, both eyes
    const sx = lerp(0.62, 1, (turn - 0.5) * 2);
    const hs = spline([[0, -7], [9, -5], [13.5, 4], [14.5, 15], [11, 28], [7.8, 42], [9.8, 53], [8, 61.5], [0, 65], [-8, 61.5], [-9.8, 53], [-7.8, 42], [-11, 28], [-14.5, 15], [-13.5, 4], [-9, -5]]);
    const ear = (sgn) => `<g transform="translate(${sgn * 8.5},-3) rotate(${n(sgn * (14 + earR))})"><path d="M-4.6,3 Q-6,-12 0,-25 Q6,-12 4.6,3 Z" fill="${coat}" ${es}/><path d="M0,0 Q-1.6,-10 0,-18 Q1.6,-10 0,0 Z" fill="${M.far}" stroke="none"/></g>`;
    const fe = (sgn) => `${glow(sgn * 11.8, 14.5)}<path d="M${sgn * 8},15.5 Q${sgn * 11.5},9.5 ${sgn * 15.2},13.6 Q${sgn * 12.2},18.6 ${sgn * 8},15.5 Z" fill="${eyeCol}" stroke="${INK}" stroke-width="0.8"/><path d="M${sgn * 10},14.4 L${sgn * 13.6},14" stroke="${mix(eyeCol, "#274a44", 0.6)}" stroke-width="1.1" stroke-linecap="round"/>${ob > 0.05 ? `<path d="M${sgn * 7.6},15.5 Q${sgn * 11.5},9 ${sgn * 15.6},13.4 Q${sgn * 11.5},${n(11 + ob * 5)} ${sgn * 7.6},15.5 Z" fill="${coat}" stroke="none"/>` : ""}<path d="M${sgn * 7.4},${n(14.8 + ob)} Q${sgn * 11.5},${n(8.4 + ob * 2)} ${sgn * 15.8},${n(12.6 + ob)}" stroke="${M.edge}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    let br = "";
    if (bridleOn) br = braid("M-8.6,43 Q0,46.5 8.6,43", 3.6) + braid("M-9,42 Q-13,24 -13.6,4", 3) + braid("M9,42 Q13,24 13.6,4", 3) + braid("M-13,4.5 Q0,8 13,4.5", 3) + silverRing(-9.2, 43.4, 2.8) + silverRing(9.2, 43.4, 2.8) + silverRing(0, 6.6, 2.2);
    head = `<g transform="translate(${n(poll[0])},${n(poll[1])}) rotate(${n(-theta)}) scale(${n(sx * 100) / 100},1)">${ear(-1)}${ear(1)}
      <path d="${hs}" fill="${coat}" ${es}/>
      <path d="M12,3 Q13.4,15 9.8,29 Q7,41 9,52" stroke="${M.rim}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-12,3 Q-13.4,15 -9.8,29" stroke="${M.rim}" stroke-width="1.3" fill="none" opacity="0.6" stroke-linecap="round"/>
      <path d="M1.5,16 Q3,34 2,50" stroke="${M.rim}" stroke-width="2.4" fill="none" opacity="0.55" stroke-linecap="round"/><path d="M2.4,22 Q3,32 2.6,40" stroke="${M.hi}" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <ellipse cx="-4.4" cy="55.5" rx="2.2" ry="3.4" transform="rotate(16 -4.4 55.5)" fill="#010206" stroke="${M.rim}" stroke-width="0.9"/><ellipse cx="4.4" cy="55.5" rx="2.2" ry="3.4" transform="rotate(-16 4.4 55.5)" fill="#010206" stroke="${M.rim}" stroke-width="0.9"/>
      <path d="M-5,62 Q0,63.6 5,62" stroke="${M.edge}" stroke-width="1" fill="none"/>
      ${br}${fe(-1)}${fe(1)}
    </g>`;
    ringL = hpt(9.2, 43.4, sx); noseL = hpt(0, 58, sx); eyeL = hpt(11.8, 14.5, sx);
  }
  // mane: wet locks and weed ribbons hanging from the crest (they are the brightest thing on the frame), a forelock, drips
  const md = [lerp(0.1, -0.92, fl), lerp(1, -0.4, fl)], ml = Math.hypot(md[0], md[1]), mdx = md[0] / ml, mdy = md[1] / ml;
  let mane = "", drips = "";
  const NL = 11;
  const lock = (s0, L, i, weed) => {
    const cs = [0, 0.34, 0.68, 1].map((u) => { const sv = (Math.sin(t * (1.2 + fl) + i * 1.9 + u * 2.6) * (2.2 + fl * 6) + jit(i * 3 + 7, 3)) * u; return [s0[0] + mdx * L * u - mdy * sv, s0[1] + mdy * L * u + mdx * sv]; });
    const tip = cs[3];
    if (weed) return { svg: `<path d="${ribbon(cs, [3.4, 5, 4.2, 0.6])}" fill="${M.weed}" stroke="${M.weedS}" stroke-width="0.8"/>` + ln(spline(cs.slice(0, 3), false), M.weedHi, 1.1), tip };
    return { svg: `<path d="${ribbon(cs, [7.5, 8.5, 6, 0.6])}" fill="${M.mane}" ${es}/>` + ln(spline(cs.slice(0, 3).map(([x, y]) => [x - 1.2, y]), false), M.maneHi, 1.9) + ln(spline(cs.slice(1).map(([x, y]) => [x + 1.6, y]), false), M.rim, 0.9, `opacity="0.8"`), tip };
  };
  for (let i = 0; i < NL; i++) {
    const u = 0.04 + i / (NL - 1) * 0.92, q = [(1 - u) ** 2 * pT[0] + 2 * u * (1 - u) * cT[0] + u * u * bT[0], (1 - u) ** 2 * pT[1] + 2 * u * (1 - u) * cT[1] + u * u * bT[1]];
    const L = (30 + Math.sin(u * Math.PI) * 22 + hash(i * 2.7) * 10) * (1 - turn * 0.15), lk = lock(q, L, i, false);
    mane += lk.svg;
    if (i % 2 === 1) { const wd = lock([q[0] + 2, q[1] + 1], L * (1.05 + hash(i) * 0.3), i + 20, true); mane += wd.svg; }
    if (drip > 0 && fl < 0.3) { const f = ((t * (0.7 + hash(i) * 0.5) + hash(i * 9.1)) % 1 + 1) % 1; if (hash(i * 4.4) < 0.75) drips += drop(lk.tip[0], lk.tip[1] + 3 + f * f * 60, 1.5, M.hi, drip * (1 - f) * 0.95); }
  }
  // forelock (in horse-local, falls over the brow)
  const fo = turn < 0.5 ? hpt(5, -3, 1 - turn * 0.8) : hpt(0, -4);
  [[-3, 20, 0], [2, 26, 1], [6, 17, 2]].forEach(([dx, L, i]) => { const lk = lock([fo[0] + dx * (turn < 0.5 ? 0.6 : 1.4), fo[1]], L, 40 + i, i === 1 && false); mane += lk.svg; });
  mane += lock([fo[0] + 1, fo[1] + 1], 30, 47, true).svg;
  if (drip > 0 && fl < 0.3) { const f = ((t * 0.8 + 0.3) % 1 + 1) % 1, ch = turn < 0.5 ? hpt(0, 64, 1 - turn * 0.8) : hpt(0, 65); drips += drop(ch[0], ch[1] + 3 + f * f * 50, 1.6, M.hi, drip * (1 - f)); }
  // rein of the bridle: a loose braid from the cheek ring back to the withers
  const rein = bridleOn ? braid(`M${n(ringL[0])},${n(ringL[1])} Q${n((ringL[0] + bT[0]) / 2 + 4)},${n(Math.max(ringL[1], bT[1]) + 26)} ${n(bT[0] + 8)},${n(bT[1] + 5)}`, 2.6) : "";
  const inner = `${leg(true, true)}${leg(false, true)}${tail}<path d="${body}" fill="${coat}" ${es}/>${sheen}${leg(false, false)}${leg(true, false)}${neck}${rein}${mane}${head}${drips}`;
  const xf = `translate(${n(p.x)},${n(p.y)}) scale(${(k * dir).toFixed(4)},${k.toFixed(4)}) rotate(${n(pitch)} 0 -100)`;
  // local cm -> world metres / screen px (pitch included)
  const pr = pitch * Math.PI / 180;
  const loc = (q) => { const x = q[0], y = q[1] + 100; return [x * Math.cos(pr) - y * Math.sin(pr), -100 + x * Math.sin(pr) + y * Math.cos(pr)]; };
  const world = (q) => { const r = loc(q); return { X: X0 + dir * r[0] * size / 100, Y: Y0 - r[1] * size / 100, Z }; };
  const scr = (q) => { const r = loc(q); return { x: p.x + dir * r[0] * k, y: p.y + r[1] * k }; };
  let svg;
  if (st.water != null) {
    const wy = P(c, X0, st.water, Z).y, id = `kw${UID++}`, dcm = (st.water - Y0) / size * 100;
    svg = `<clipPath id="${id}a"><rect x="-200" y="-400" width="${W + 400}" height="${n(wy + 400)}"/></clipPath><clipPath id="${id}b"><rect x="-200" y="${n(wy)}" width="${W + 400}" height="${n(Math.max(0, (st.reflectTo ?? P(c, X0, st.water, Math.max(c.z + 0.4, Math.min(Z, shoreZ(X0)))).y - 5) - wy))}"/></clipPath>`;
    if (st.reflect !== false) svg += `<g clip-path="url(#${id}b)" opacity="0.5"><g transform="translate(0,${n(wy * 2)}) scale(1,-1)"><g transform="${xf}">${inner}</g></g></g>`;
    svg += `<g clip-path="url(#${id}a)"><g transform="${xf}">${inner}</g></g>`;
    const spots = dcm < 88 ? [44, 54, hipX - 6, hipX + 5].map((x) => [x, 14]) : dcm < 150 ? [[(hipX + 40) / 2, (60 - hipX) / 2 + 20]] : [[poll[0], 30]];
    spots.forEach(([lx, w], i) => { for (let j = 0; j < 2; j++) { const f = ((t * 0.45 + j * 0.5 + hash(i * 3.3)) % 1 + 1) % 1, rx = (w + 4 + f * 22) * k; svg += `<ellipse cx="${n(p.x + dir * lx * k)}" cy="${n(wy)}" rx="${n(rx)}" ry="${n(Math.max(2, rx * 0.13))}" fill="none" stroke="${M.rim}" stroke-width="${n(Math.max(1.4, 2.4 * k))}" opacity="${n((1 - f) * 0.85)}"/>`; } });
    if (dcm < 150) svg += ln(`M${n(p.x + dir * (hipX - 34) * k)},${n(wy)} L${n(p.x + dir * 70 * k)},${n(wy)}`, M.hi, Math.max(1.2, 1.4 * k), `opacity="0.5" stroke-dasharray="${n(18 * k)} ${n(9 * k)}"`);
  } else svg = (st.shadow === false || fl > 0.3 ? "" : shadow({ x: p.x + dir * (hipX + 40) / 2 * k, y: p.y, s: p.s * size }, (100 + E) / 100 * 0.62)) + `<g transform="${xf}">${inner}</g>`;
  const seats = [0, 1, 2, 3].map((i) => { const x = 20 - i * 36; return world(T(x, back(x) - 1)); });
  return { svg, seats, p, nose: scr(noseL), eye: scr(eyeL), ring: scr(ringL), withers: scr(bT), noseW: world(noseL) };
}

// ---------------------------------------------------------------- three village kids (the kid() rig, Highland 1800s wool)
const VK = [
  { size: 1, skin: "#f1c9aa", top: "#7c5c3e", topS: "#5a402a", topL: "#a8845a", legs: "#3f3d52", legsS: "#33314a", boots: "#2a2026", hair: "#c8602a", hat: "#77805c", hatS: "#555e42", iris: "#3a6a4a" },   // tweed cap, wool jacket, mustard muffler
  { size: 0.96, skin: "#f6d6bc", top: "#e6dcc4", topS: "#c8bca0", topL: "#f6f0e0", legs: "#3d4a72", legsS: "#2f3a5c", boots: "#2a2026", hair: "#e6c06a", hat: "#b8383a", hatS: "#1f4a3c", iris: "#3a5a8a" },   // plaid shawl, braid, long skirt
  { size: 0.82, skin: "#eec4a0", top: "#4f7c4c", topS: "#3a5e3a", topL: "#7aa870", legs: "#6a5440", legsS: "#544232", boots: "#eec4a0", hair: "#211b26", hat: "#27356e", hatS: "#c23a3a", iris: "#3a2418" },   // knitted jumper, tam, bare feet
];
export function villager(c, st = {}, t = 0) {
  const Z = st.Z ?? 4; if (!vis(c, Z)) return { svg: "", p: null };
  const kd = st.kind || 0, V = VK[kd], p = P(c, st.X ?? 0, st.Y ?? 0, Z), S = 0.8 * (st.size ?? V.size), LS = 0.74, DY = 78 * (1 - LS), HS = 1.32;
  const fx = st.fx ?? 0.7, d = fx < 0 ? -1 : 1, stuck = st.stuck || 0, sit = st.sit || 0, shock = Math.max(st.shock || 0, stuck * 0.9), open = (1 - (st.blink || 0)) * lerp(1, 1.4, shock), hands = st.hands || 0;
  const hx = fx * 1.5, hy = -138, ex = hx + fx * 4.5, hp = (x, y) => [x * HS, -127 + (y + 127) * HS];
  let mouth;
  if (shock > 0.4 && !(st.talk > 0.12)) mouth = `<path d="M${n(ex - 2.2)},${n(hy + 8)} Q${n(ex)},${n(hy + 5.4)} ${n(ex + 2.2)},${n(hy + 8)} Q${n(ex)},${n(hy + 12.4)} ${n(ex - 2.2)},${n(hy + 8)} Z" fill="#5a1f30"/>`;
  else if (st.grin > 0.5 && !(st.talk > 0.12)) mouth = `<path d="M${n(ex - 2.8)},${n(hy + 7.2)} Q${n(ex)},${n(hy + 10.6)} ${n(ex + 2.8)},${n(hy + 7)} Z" fill="#fff" stroke="#6a2a38" stroke-width="0.7"/>`;
  else mouth = talkMouth(ex, hy + 8, 2.1, st.talk || 0);
  const browY = shock > 0.4 ? hy - 9.4 : hy - 7.6, wr = shock * 1.3;
  const hairCap = `<path d="M${n(hx - 10.8)},${n(hy + 1)} Q${n(hx - 12.5)},${n(hy - 16)} ${n(hx - 2)},${n(hy - 17.5)} Q${n(hx + 9)},${n(hy - 19)} ${n(hx + 11.2)},${n(hy - 6)} L${n(hx + 10.4)},${n(hy + 1)} Q${n(hx + 8 - fx * 3)},${n(hy - 8)} ${n(hx - fx * 3)},${n(hy - 10)} Q${n(hx - 8 - fx * 3)},${n(hy - 8)} ${n(hx - 10.8)},${n(hy + 1)} Z" fill="${V.hair}"/>`;
  let hat = "", backHair = "", extraTorso = "";
  if (kd === 0) {
    hat = hairCap + [-8, -4, 1, 5].map((x, i) => `<path d="M${n(hx + x + fx * 2)},${n(hy - 11)} l${n(1.5 + (i % 2))},${n(4 + (i % 2) * 2)} l2,-4.6 Z" fill="${V.hair}"/>`).join("") +
      `<path d="M${n(hx - 12.4)},${n(hy - 9)} Q${n(hx - 13.5)},${n(hy - 22)} ${n(hx)},${n(hy - 22.5)} Q${n(hx + 13.5)},${n(hy - 22)} ${n(hx + 12.4)},${n(hy - 9)} Q${n(hx)},${n(hy - 13.5)} ${n(hx - 12.4)},${n(hy - 9)} Z" fill="${V.hat}"/>` +
      `<path d="M${n(hx + fx * 5 - d * 4)},${n(hy - 11.4)} Q${n(hx + fx * 5 + d * 9)},${n(hy - 13)} ${n(hx + fx * 5 + d * 15)},${n(hy - 7.6)} Q${n(hx + fx * 5 + d * 6)},${n(hy - 8.4)} ${n(hx + fx * 5 - d * 4)},${n(hy - 9)} Z" fill="${V.hatS}"/>` +
      [-8, -3, 2, 7].map((x) => `<path d="M${n(hx + x - 1.4)},${n(hy - 15.6)} l1.4,-1.6 l1.4,1.6 M${n(hx + x + 1.1)},${n(hy - 18.8)} l1.4,-1.6 l1.4,1.6" stroke="${V.hatS}" stroke-width="0.6" fill="none"/>`).join("") + `<circle cx="${n(hx)}" cy="${n(hy - 22.4)}" r="1.3" fill="${V.hatS}"/>`;
    extraTorso = [-113, -103, -93, -83].map((y) => [-10, -4.5, 1, 6.5].map((x) => `<path d="M${x - 1.5},${y + 1.6} L${x},${y} L${x + 1.5},${y + 1.6}" stroke="${V.topL}" stroke-width="0.55" fill="none"/>`).join("")).join("") +
      `<path d="M${n(-1 + fx * 3)},-126 L${n(-1.4 + fx * 3)},-74" stroke="${V.topS}" stroke-width="0.9"/>` + [-112, -98, -84].map((y) => `<circle cx="${n(1.6 + fx * 3)}" cy="${y}" r="1.1" fill="#2a2026" stroke="none"/>`).join("") +
      `<path d="M-8.5,-125 Q0,-119.5 8.5,-125 L8,-130.5 Q0,-127 -8,-130.5 Z" fill="#d8a83a"/><path d="M${n(d * 3)},-124 L${n(d * 7.5)},-124 L${n(d * 8.5)},-108 L${n(d * 3.6)},-108 Z" fill="#d8a83a"/><path d="M${n(d * 3.8)},-112 h${n(d * 4.4)} M${n(d * 3.6)},-116 h${n(d * 4.4)}" stroke="#a87a1a" stroke-width="0.6"/>`;
  } else if (kd === 1) {
    hat = hairCap + `<path d="M${n(hx - fx * 3)},${n(hy - 10)} Q${n(hx - 1)},${n(hy - 15)} ${n(hx)},${n(hy - 17.8)}" stroke="#b08a3a" stroke-width="0.7" fill="none"/><path d="M${n(hx - 7)},${n(hy - 12.5)} Q${n(hx - 1)},${n(hy - 16.6)} ${n(hx + 6)},${n(hy - 12)}" stroke="#fff0b0" stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round"/>`;
    const b0 = hp(hx - d * 9.5, hy + 6);
    backHair = [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${n(b0[0] - d * (1 + Math.sin(i * 0.7) * 1.5))}" cy="${n(b0[1] + 3 + i * 5.2)}" rx="3.1" ry="3.5" transform="rotate(${i % 2 ? 22 : -22} ${n(b0[0] - d)} ${n(b0[1] + 3 + i * 5.2)})" fill="${V.hair}"/>`).join("") + `<path d="M${n(b0[0] - d * 1 - 3)},${n(b0[1] + 33)} l3,2.4 l3,-2.4 l-1,5 l-2,-2 l-2,2 Z" fill="#2f7a4a"/>`;
    const id = `vk${UID++}`, sh = `M-17.5,-124.5 Q0,-131 17.5,-124.5 L20,-101 Q9,-92.5 ${n(d * 2)},-86 Q-9,-92.5 -20,-101 Z`;
    extraTorso = `<clipPath id="${id}"><path d="${sh}"/></clipPath><path d="${sh}" fill="${V.hat}"/><g clip-path="url(#${id})" stroke="none">` + [-15, -8, -1, 6, 13].map((x) => `<rect x="${x}" y="-132" width="2.6" height="48" fill="${V.hatS}" opacity="0.8"/><rect x="${x + 4.2}" y="-132" width="0.6" height="48" fill="#f2d470"/>`).join("") + [-121, -113, -105, -97, -90].map((y) => `<rect x="-21" y="${y}" width="42" height="2.6" fill="${V.hatS}" opacity="0.8"/><rect x="-21" y="${y + 4.2}" width="42" height="0.6" fill="#f2d470"/>`).join("") + `</g><path d="${sh}" fill="none"/><path d="M-20,-101 Q-9,-92.5 ${n(d * 2)},-86 Q9,-92.5 20,-101" stroke="#7a1f24" stroke-width="1" fill="none" stroke-dasharray="1.2 1.4"/><circle cx="${n(d * 2)}" cy="-103" r="2" fill="#dfe8f4"/>`;
  } else {
    hat = hairCap + [-10, -6.5, 7, 10.5, -11.5, 11.5].map((x, i) => `<circle cx="${n(hx + x)}" cy="${n(hy - 6 + (i > 3 ? 4 : i % 2 * 2))}" r="3" fill="${V.hair}"/>`).join("") + [-7, -3, 2, 6].map((x, i) => `<circle cx="${n(hx + x + fx * 2)}" cy="${n(hy - 10.5 + (i % 2))}" r="2.6" fill="${V.hair}"/>`).join("") +
      `<ellipse cx="${n(hx - fx * 1.5)}" cy="${n(hy - 17)}" rx="15.5" ry="6.6" transform="rotate(${n(-fx * 9)} ${n(hx)} ${n(hy - 17)})" fill="${V.hat}"/><path d="M${n(hx - 11.4)},${n(hy - 11.6)} Q${n(hx)},${n(hy - 15.4)} ${n(hx + 11.4)},${n(hy - 11.6)} L${n(hx + 11)},${n(hy - 9)} Q${n(hx)},${n(hy - 12.8)} ${n(hx - 11)},${n(hy - 9)} Z" fill="${V.hatS}"/><circle cx="${n(hx - fx * 1.5)}" cy="${n(hy - 23)}" r="2.8" fill="${V.hatS}"/>`;
    extraTorso = [-116, -108, -100, -92, -84].map((y) => `<path d="M-15.5,${y} Q0,${y + 2.2} 15.5,${y}" stroke="${V.topS}" stroke-width="0.7" fill="none"/>`).join("") + [-10, -5, 0, 5, 10].map((x) => `<path d="M${x},-122 L${x},-76" stroke="${V.topL}" stroke-width="0.4" fill="none" opacity="0.6"/>`).join("") + `<path d="M-8,-124.5 Q0,-120.5 8,-124.5 L7.6,-129.5 Q0,-126.5 -7.6,-129.5 Z" fill="${V.topL}"/>`;
  }
  // legs
  let legs;
  const boot = (x, f) => `<path d="M${x - 5.5},-1 Q${x - 5.5},-7 ${x - 2.5},-8.5 L${x + 3},-8.5 Q${x + 5.5 + f * 2},-6 ${x + 5.5 + f * 2.5},-1 Z" fill="${V.boots}"/>`;
  if (sit) {
    const kn = [d * 10, -50], an = [d * 3.5, -24];
    legs = (kd === 1 ? `<path d="M-13,-78 L13,-78 L${n(d * 17)},-40 Q${n(d * 4)},-33 ${n(-d * 9)},-42 Z" fill="${V.legs}"/><path d="M${n(d * 2)},-74 L${n(d * 6)},-38" stroke="${V.legsS}" stroke-width="0.8"/>` + limb([[d * 6, -40], an], 5.5, "#d8d0c8") : limb([[d * 1, -74], kn, kd === 2 ? [d * 7, -44] : an], 8.5, V.legs, V.legsS) + (kd === 2 ? limb([[d * 7, -44], an], 5.5, V.skin) : "")) +
      `<path d="M${n(an[0] - 3)},${n(an[1] - 1)} Q${n(an[0] - 3.5)},${n(an[1] + 6)} ${n(an[0] + d * 1)},${n(an[1] + 7)} L${n(an[0] + d * 8)},${n(an[1] + 7)} Q${n(an[0] + d * 8)},${n(an[1] + 2)} ${n(an[0] + 3)},${n(an[1] - 1)} Z" fill="${V.boots}"/>`;
  } else if (kd === 1) legs = `<path d="M3,-30 L8,-30 L8,-8 L3.5,-8 Z M-8,-30 L-3,-30 L-3.5,-8 L-8,-8 Z" fill="#d8d0c8"/>${boot(6, 1)}${boot(-6, 0)}<path d="M-13,-78 L13,-78 L18,-26 Q0,-21 -18,-26 Z" fill="${V.legs}"/><path d="M-6,-74 L-9,-27 M4,-74 L6,-25 M11,-72 L14,-28" stroke="${V.legsS}" stroke-width="0.8" fill="none"/>`;
  else if (kd === 2) legs = `<path d="M2.5,-44 L8,-44 L8,-8 L3.5,-8 Z M-8,-44 L-2.5,-44 L-3.5,-8 L-8,-8 Z" fill="${V.skin}"/>${boot(6, 1)}${boot(-6, 0)}<path d="M1,-78 L10,-78 L10,-42 L1.5,-42 Z" fill="${V.legsS}"/><path d="M-10,-78 L-1,-78 L-1.5,-42 L-10,-42 Z" fill="${V.legs}"/>`;
  else legs = `<path d="M1.5,-78 L9,-78 L8.5,-8 L3,-8 Z" fill="${V.legsS}"/><path d="M-9,-78 L-1.5,-78 L-3,-8 L-8.5,-8 Z" fill="${V.legs}"/>${boot(6, 1)}${boot(-6, 0)}`;
  // arms: hang | hands on the back in front (sit / stuck) | hands up at the face
  const slv = kd === 1 ? V.topS : V.top, slvF = kd === 1 ? V.topS : V.topS;
  let aN, aF;   // near (front side) and far arm: shoulder, elbow, wrist
  if (sit || stuck) { const px = stuck * 3; aN = [[d * 12.5, -120], [d * (19 - px), -99], [d * 17, -74]]; aF = [[-d * 12.5, -120], [-d * 3, -100], [d * 9, -73]]; }
  else if (hands > 0.02) { aN = [[d * 12.5, -120], [d * lerp(16, 20, hands), lerp(-99, -112, hands)], [d * lerp(17, 12, hands), lerp(-80, -131, hands)]]; aF = [[-d * 12.5, -120], [-d * lerp(16, 20, hands), lerp(-99, -112, hands)], [-d * lerp(17, 8, hands), lerp(-80, -131, hands)]]; }
  else { aN = [[d * 12.5, -120], [d * 16, -99], [d * 17, -80]]; aF = [[-d * 12.5, -120], [-d * 15.5, -100], [-d * 16, -80]]; }
  const arm = (J, col) => limb(J, 7.5, col) + `<circle cx="${n(J[2][0])}" cy="${n(J[2][1] + 2)}" r="3.6" fill="${V.skin}"/>`;
  const upper = `${backHair}${arm(aF, slvF)}
    <path d="M-13,-124 Q-16.5,-110 -15.5,-96 Q-16.5,-84 -14.5,-74 Q0,-70.5 14.5,-74 Q16.5,-84 15.5,-96 Q16.5,-110 13,-124 Q0,-128 -13,-124 Z" fill="${V.top}"/>
    <path d="M${n(d * 3)},-126 Q${n(d * 13)},-126 ${n(d * 13)},-124 Q${n(d * 16.5)},-110 ${n(d * 15.5)},-96 Q${n(d * 16.5)},-84 ${n(d * 14.5)},-74 Q${n(d * 9)},-72.5 ${n(d * 5)},-72.3 Q${n(d * 7)},-100 ${n(d * 3)},-126 Z" fill="${V.topS}" stroke="none" opacity="0.55"/>
    <path d="M-3,-131 L3,-131 L2.6,-126 L-2.6,-126 Z" fill="${mix(V.skin, "#a8704a", 0.25)}"/>
    ${extraTorso}
    <g transform="translate(0,-127) scale(${HS}) translate(0,127)">
    ${Math.abs(fx) > 0.3 ? `<path d="M${n(hx - fx * 9.6)},${n(hy - 3)} q${n(-fx * 4)},-0.5 ${n(-fx * 3.4)},4.5 q${n(fx * 0.4)},3 ${n(fx * 3.4)},2.6 Z" fill="${V.skin}"/>` : ""}
    <path d="${headPath(hx, hy, 10.6, 11.4, fx, 1.06)}" fill="${V.skin}"/>
    ${hat}
    <path d="M${n(ex - 7)},${n(browY + wr)} L${n(ex - 2.2)},${n(browY - wr)} M${n(ex + 2.2)},${n(browY - wr)} L${n(ex + 7)},${n(browY + wr)}" stroke="${mix(V.hair, INK, 0.4)}" stroke-width="1.1" stroke-linecap="round"/>
    ${eye(ex - 4.3, hy - 1.5, fx < -0.3 ? 2.3 : 2.8, 2.9, st.look ?? fx, open, -1, V.iris)}${eye(ex + 4.3, hy - 1.5, fx > 0.3 ? 2.3 : 2.8, 2.9, st.look ?? fx, open, 1, V.iris)}
    <path d="M${n(ex + fx * 1.5)},${n(hy + 1.5)} q${n(fx * 1.2)},2.2 ${n(-fx * 0.6)},3" stroke="#c48a74" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="${n(ex - 6.5)}" cy="${n(hy + 4.5)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.5" stroke="none"/><ellipse cx="${n(ex + 6.5)}" cy="${n(hy + 4.5)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.5" stroke="none"/>
    ${kd === 0 ? [-6, -4.6, -7.6, 5, 6.6, 3.8].map((x, i) => `<circle cx="${n(ex + x)}" cy="${n(hy + 3 + (i % 3) * 0.9)}" r="0.4" fill="#b8704a" stroke="none"/>`).join("") : ""}
    ${mouth}
    </g>${arm(aN, slv)}`;
  const lean = (st.lean || 0) - d * stuck * 9;
  const svg = sit
    ? `<g class="ol" transform="${place(p, lean)} scale(${S}) translate(0,76)">${legs}${upper}</g>`
    : shadow(p, 0.26) + `<g class="ol" transform="${place(p, lean)} scale(${S})"><g transform="scale(1,${LS})">${legs}</g><g transform="translate(0,${n(DY)})">${upper}</g></g>`;
  return { svg, p };
}

// ---------------------------------------------------------------- the host kid on the kelpie, and his hands
// L.kid stands on Y = 0: lift the camera so his hips sit on a kelpie seat, draw him BEFORE the kelpie, then riderLeg AFTER it.
export function hostRide(c, seat) { return { cam: { ...c, y: c.y - (seat.Y - 0.44) }, X: seat.X, Z: seat.Z }; }
export function riderLeg(c, seat, o = {}) {
  const p = P(c, seat.X, seat.Y, seat.Z), d = o.dir ?? 1;
  return `<g class="ol" transform="${place(p)} scale(0.8)">${limb([[d * 1, 4], [d * 10, 26], [d * 4, 50]], 8.5, "#ece0c4", "#d9cba9")}<path d="M${d * 0.5},49 Q${d * 0},57 ${d * 4},58 L${d * 13},58 Q${d * 13},52 ${d * 7},49 Z" fill="#f2eff6"/><path d="M${d * 1},56.4 L${d * 13},56.4 L${d * 13},58 L${d * 3},58 Z" fill="#c23a52"/></g>`;
}
// where L.kid's bell hand is on screen (kd = the object kid() returned)
export function kidHand(kd, reachL = 1, lean = 0) { return toScreen(kd.p, lean, lerp(-16, -36, reachL) * 0.8, (lerp(-80, -108, reachL) + 78 * 0.26 + 6) * 0.8); }

// ---------------------------------------------------------------- Grandma's hand: nine fingers (one clean old stump, no blood)
// Open palm to the camera, fingers up; origin = the wrist; k px per cm.
export function nineHand(x, y, k, o = {}) {
  const miss = o.missing ?? 0, sp = o.spread ?? 1, warm = o.warm ?? 0, lw = n(Math.min(0.3, 3.2 / k));
  const skin = mix("#e6bf9e", "#ffb46a", warm * 0.3), skS = mix("#c2906e", "#c8602a", warm * 0.4), skL = mix("#f6dcc4", "#ffe0a0", warm * 0.6);
  const F = [[-3.5, -9.3, -13, 6.6, 2.2], [-1.15, -10, -4, 7.7, 2.25], [1.25, -9.8, 5, 7.1, 2.15], [3.5, -8.9, 15, 5.4, 1.85]];
  const st = `stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round"`;
  const fingers = F.map(([fx, fy, a, len, w], i) => {
    const gone = i === miss, L = gone ? 2.3 : len;
    return `<g transform="translate(${fx},${fy}) rotate(${n(a * sp)})"><rect x="${n(-w / 2)}" y="${n(-L)}" width="${w}" height="${n(L + 2)}" rx="${n(w / 2)}" fill="${gone ? mix(skin, "#d89a8a", 0.45) : skin}" ${st}/>` +
      (gone ? `<path d="M${n(-w * 0.32)},${n(-L * 0.62)} Q0,${n(-L * 0.95)} ${n(w * 0.32)},${n(-L * 0.62)}" stroke="${skS}" stroke-width="${n(lw * 0.8)}" fill="none" stroke-linecap="round"/>`
        : `<path d="M${n(-w * 0.3)},${n(-L * 0.36)} h${n(w * 0.6)} M${n(-w * 0.3)},${n(-L * 0.66)} h${n(w * 0.6)}" stroke="${skS}" stroke-width="${n(lw * 0.7)}" fill="none" stroke-linecap="round"/><path d="M${n(w * 0.26)},${n(-L + w * 0.5)} L${n(w * 0.26)},${n(-L * 0.2)}" stroke="${skL}" stroke-width="${n(w * 0.16)}" stroke-linecap="round" opacity="0.8"/>`) + `</g>`;
  }).join("");
  const arm = o.arm ?? 14;
  return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(o.rot || 0)}) scale(${k.toFixed(3)})">
    <path d="M-5.6,0.6 L5.6,0.6 L8,${arm} L-8,${arm} Z" fill="#2b2f6b" ${st}/><path d="M1.5,0.6 L5.6,0.6 L8,${arm} L3.4,${arm} Z" fill="#20234f"/><path d="M-5.8,-0.4 L5.8,-0.4 L6.1,1.6 L-6.1,1.6 Z" fill="#f2a93b" ${st}/>
    ${fingers}
    <g transform="translate(-4.3,-3.4) rotate(${n(-50 * sp)})"><rect x="-1.35" y="-6.2" width="2.7" height="8" rx="1.35" fill="${skin}" ${st}/><path d="M-0.8,-3.2 h1.6" stroke="${skS}" stroke-width="${n(lw * 0.7)}"/></g>
    <path d="M-4.7,-9.6 Q-5.4,-4 -3.9,0 L3.7,0 Q5,-4 4.6,-9 Q0,-11.6 -4.7,-9.6 Z" fill="${skin}" ${st}/>
    <path d="M-4.4,-5.4 Q-5,-2.5 -3.6,-0.3 L-0.6,-0.3 Q-1.2,-4 -4.4,-5.4 Z" fill="${skL}" opacity="0.55"/>
    <path d="M-3.6,-6.6 Q-0.5,-5 -0.6,-0.6 M-3.2,-7.8 Q0.5,-8.4 3.9,-6.4 M-1.4,-5.4 Q1.4,-5.6 3.6,-3.6" stroke="${skS}" stroke-width="${n(lw * 0.75)}" fill="none" stroke-linecap="round"/>
    <path d="M-3,-9.3 q0.6,0.5 1.4,0 M-0.6,-9.9 q0.7,0.5 1.5,0 M1.8,-9.7 q0.7,0.5 1.5,0" stroke="${skS}" stroke-width="${n(lw * 0.6)}" fill="none"/>
  </g>`;
}
// the same hand raised from L.keeper's shoulder (kp = what keeper() returned): use this instead of kp.arm
export function keeperRaise(kp, o = {}) {
  const k = kp.p.s / 100, sh = toScreen(kp.p, 0, -14, -94), hand = toScreen(kp.p, 0, -34 - (o.out || 0), -118 - (o.up || 0)), el = { x: lerp(sh.x, hand.x, 0.55) - 6 * k, y: sh.y + 10 * k };
  const d = `M${n(sh.x)},${n(sh.y)} Q${n(el.x)},${n(el.y)} ${n(hand.x)},${n(hand.y + 4 * k)}`;
  return `<path d="${d}" stroke="${INK}" stroke-width="${n(12.2 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#2b2f6b" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/>` + nineHand(hand.x, hand.y, k * (o.k ?? 1.25), { ...o, arm: 3, rot: o.rot ?? -8 });
}

// ---------------------------------------------------------------- close-up: one finger on the wet nose, and it will not come off
// Draw the kelpie with a close camera, then this hand with its fingertip on kelpie().nose. k px per cm; dir -1 = the hand
// comes from screen right (the host kid stands right of a right-facing kelpie). pull 0..1 strains the hand away, the tip stays.
export function stuckFinger(x, y, k, o = {}, t = 0) {
  const pull = clamp(o.pull ?? 0), dir = o.dir ?? -1, sk = "#f3cdb0", skS = "#e0b294", ik = `stroke="${INK}" stroke-width="0.4" stroke-linejoin="round"`;
  const hx = -pull * 4.5 + Math.sin(t * 26) * pull * 0.3;
  const h = taper([-76, 30], [-44, 9], 24, 20.5, "#e8476a", ik) + taper([-48.5, 12], [-43, 8.4], 21.5, 21, "#a8284a", ik) +
    `<path d="${spline([[-44, -2], [-36, -10], [-25, -11.5], [-17.6, -7], [-16, 3], [-19.6, 14], [-29.6, 19], [-40.4, 16], [-44.6, 7.4]])}" fill="${sk}" ${ik}/>` + ln("M-33,18.4 Q-30,12 -32.2,6.6 M-25.6,17.6 Q-22.6,12 -24.6,7 M-20.4,13 Q-19,9 -20,5.4", skS, 0.5);
  const thumb = `<path d="${spline([[-39, 1], [-32, 0], [-23, 4], [-19.6, 8], [-23, 11], [-32, 8], [-39.4, 6.6]])}" fill="${sk}" ${ik}/>`;
  let s = `<g transform="translate(${n(hx)},0)">${h}</g>` + taper([-21 + hx, -1.6], [-2.6, 0], 7, 5.8, sk, ik) + ln(`M${n(-12 + hx * 0.7)},-4.4 q0.4,3 -0.2,5.8 M${n(-1 + hx * 0.2) - 5},-3.6 q0.4,2.6 0,5.2`, skS, 0.4) + `<g transform="translate(${n(hx)},0)">${thumb}</g>`;
  s += `<path d="M-3,-3 Q3,-3.9 2.6,0 Q3,3.9 -3,3 Z" fill="${sk}" ${ik}/>`;   // the tip, pressed flat
  [-3.4, -1.2, 1.2, 3.4].forEach((dy) => { s += ln(`M0,${n(dy * 0.7)} Q2.2,${n(dy * (0.9 - pull * 0.3))} 4.6,${n(dy * 1.3)}`, M.coat, 0.9 - pull * 0.3) + ln(`M0.4,${n(dy * 0.72)} Q2.2,${n(dy * (0.86 - pull * 0.3))} 3.8,${n(dy * 1.15)}`, M.rim, 0.22, `opacity="0.8"`); });
  if (pull > 0.05) [[-1, -0.1], [-0.82, -0.6], [-0.5, -0.9], [-0.8, 0.55], [-0.45, 0.9]].forEach(([a, b], i) => { const r0 = 8.5 + (i % 2) * 1.5, r1 = r0 + 3.5 + pull * 3; s += ln(`M${n(a * r0)},${n(b * r0)} L${n(a * r1)},${n(b * r1)}`, "#ffffff", 0.7, `opacity="${n(0.5 + pull * 0.4)}"`); });
  return `<g transform="translate(${n(x)},${n(y)}) scale(${(-dir * k * 0.42).toFixed(3)},${(k * 0.42).toFixed(3)})">${s}</g>`;
}

// ---------------------------------------------------------------- the torn bridle: braided water weed, three small silver rings
export function bridleLoose(x, y, k, o = {}, t = 0) {
  const sw = Math.sin(t * 2.2) * 4;
  let s = braid(`M0,0 Q-13,10 -11,26 Q-8,40 3,41 Q14,40 13,25 Q12,10 0,0`, 3.4) + braid(`M-11,26 Q-4,30 13,25`, 3) + braid(`M3,41 Q${n(5 + sw * 0.4)},52 ${n(1 + sw)},62`, 2.6) + braid(`M-9,14 Q${n(-18 + sw * 0.3)},24 ${n(-17 + sw * 0.6)},40`, 2.4);
  s += silverRing(-11, 26, 2.8) + silverRing(13, 25, 2.8) + silverRing(3, 41.5, 2.4);
  s += `<path d="M${n(1 + sw)},62 q-3,4 -1,8 M${n(-17 + sw * 0.6)},40 q-3,5 0,9 M8,36 q3,4 1,8" stroke="${M.weed}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  if ((o.drip ?? 1) > 0) [[1 + sw, 72, 0.1], [-17, 50, 0.55], [13, 30, 0.8]].forEach(([dx, dy, ph]) => { const f = ((t * 0.9 + ph) % 1 + 1) % 1; s += drop(dx, dy + f * f * 40, 1.4, M.hi, 1 - f); });
  return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(o.rot || 0)}) scale(${(k * 0.6).toFixed(3)})">${s}</g>`;
}
