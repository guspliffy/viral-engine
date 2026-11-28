// Legend channel, The Pied Piper of Hamelin: the designs, code-drawn. Two worlds.
//   TODAY  Bungelosenstrasse at dusk, in the legend.mjs projection (metres, X right, Y up, Z into the lane), so the hosts
//          L.kid / L.keeper stand in it unchanged (same spots and cameras as ep 1: kid X -0.1 Z 3.7, keeper X 0.5 Z 2.9).
//   1284   the legend as panes of a stained-glass window (our own homage to the lost Marktkirche window, not a copy):
//          flat jewel panes, dark lead between colour areas, painted (grisaille) faces. A flat panel 1080 x 1920 with its
//          own 2D camera (glass(view, inner)). Figure units: cm, feet at 0, up = -y; st.s = px per cm in the panel.
// Colour: dusk(cold) for today, mood(a[, b, u]) for the glass. Call both before drawing a frame that uses them.
// Hand-made: every wobble, chip, crack, strand and pane tint is seeded with hash(); no Math.random, no clock.
import { W, H, INK, P, PAL, n, lerp, clamp, ease, hash, mix, toScreen, defs as baseDefs } from "./legend.mjs";

const NEAR = 0.24, TAU = Math.PI * 2;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const poly = (a, fill, extra = "") => `<polygon points="${a.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const pick = (arr, seed) => arr[Math.floor(hash(seed) * arr.length) % arr.length];
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
// painted light: nested hand-cut flat shapes, screen blend (never a smooth glow)
function lightBlobs(x, y, radii, col, alphas, seed, squash = 1) {
  let s = "";
  radii.forEach((r, j) => {
    const a = Array.from({ length: 16 }, (_, i) => { const an = i / 16 * TAU, rr = r * (1 + jit(seed + j * 31 + i, 0.08)); return { x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * squash }; });
    s += `<path d="${blob(a)}" fill="${col}" opacity="${n(alphas[j] * 100) / 100}" style="mix-blend-mode:screen"/>`;
  });
  return s;
}
let UID = 0;
export function resetIds() { UID = 0; }

// ================================================================= TODAY: Bungelosenstrasse at dusk
// dusk(cold): 0 = warm amber dusk, 1 = the cold flicker (lamps dip, blue creeps in). D = the palette for this frame.
const DUSK = {
  sky: [["#4a2f6e", "#1d2a5a"], ["#8a4a7e", "#2f4a80"], ["#d9664f", "#4f6f9a"], ["#f59a3e", "#7f9aa8"], ["#ffcf7a", "#b9c8b8"]],
  haze: ["#e08a4a", "#4f6a90"], cobble: ["#6a4a50", "#3f4560"], cobble2: ["#8a5f50", "#4f5a78"], cobbleD: ["#3f2a3a", "#262c48"], moss: ["#5f6a3a", "#3a5a5a"],
  lamp: ["#ffb84a", "#9ab8d8"], lamp2: ["#ff8a2a", "#6a8ab8"], win: ["#ffc24a", "#e0a858"], win2: ["#ff9a2e", "#c88a50"], winD: ["#3a3550", "#27304f"],
  roof: ["#5a2f3a", "#2a2f4a"], roof2: ["#7a3f3a", "#3a4460"], iron: ["#1f1620", "#141826"], spire: ["#7a4a6a", "#3a4a70"],
};
export const D = {};
let COLD = 0;
export function dusk(cold = 0) {
  COLD = clamp(cold);
  for (const k in DUSK) D[k] = Array.isArray(DUSK[k][0]) ? DUSK[k].map((p) => mix(p[0], p[1], COLD)) : mix(DUSK[k][0], DUSK[k][1], COLD);
  PAL.hamelin = { sky: D.sky, fog: D.haze, fogC: D.haze, hills: [D.spire, D.spire], pag: [D.spire, D.spire], moon: false, stars: false };
  return D;
}
dusk(0);
const fade = (col, z) => mix(mix(col, "#2a3050", COLD * 0.45), D.haze, clamp((z - 7) / 30) * 0.72);
export function defs() {
  return baseDefs("hamelin") + `<defs><filter id="hmsoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="hmgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 -1.1 0.62"/></filter></defs>`;
}

// the lane: ground half-width, the houses [side, z0, z1, storey heights, jetty per storey, lean (m per m, toward the lane),
// plaster, timber, seed, kind]. "stone" = the Rattenfaengerhaus side wall with the long carved beam.
export const LANE = { xw: 2.25, end: 27.5, kid: { X: -0.08, Z: 3.7 }, keeper: { X: 0.52, Z: 2.9 }, beamY: 2.9, beamZ: [5.0, 10.6],
  lamps: [[-1, 6.6, 3.15], [1, 11.5, 3.3], [-1, 16.5, 3.2], [1, 22.5, 3.3]] };
const HOUSES = [
  [-1, -1.5, 5.0, [2.7, 2.4, 2.2], 0.22, 0.022, "#e8c27a", "#3a2418", 1, "fach"],
  [-1, 5.0, 10.6, [2.9, 2.5, 2.3], 0.2, 0.01, "#d8c09a", "#33201a", 2, "stone"],
  [-1, 10.6, 15.6, [2.6, 2.3, 2.3], 0.24, 0.03, "#c9553a", "#2f1d18", 3, "fach"],
  [-1, 15.6, 21.2, [2.8, 2.4, 2.1], 0.2, 0.016, "#efdcb0", "#3a2418", 4, "fach"],
  [-1, 21.2, 27.4, [2.7, 2.4, 2.3], 0.22, 0.026, "#dba24a", "#33201a", 5, "fach"],
  [1, -1.5, 4.3, [2.8, 2.4, 2.2], 0.22, 0.016, "#efdcb0", "#33201a", 6, "fach"],
  [1, 4.3, 9.6, [2.6, 2.4, 2.3], 0.24, 0.03, "#c75a3c", "#2f1d18", 7, "fach"],
  [1, 9.6, 14.9, [2.8, 2.3, 2.2], 0.2, 0.012, "#e6b85e", "#3a2418", 8, "fach"],
  [1, 14.9, 20.6, [2.7, 2.5, 2.2], 0.22, 0.024, "#ead2a8", "#33201a", 9, "fach"],
  [1, 20.6, 27.4, [2.8, 2.3, 2.3], 0.2, 0.018, "#cf6a44", "#2f1d18", 10, "fach"],
];

// hand-cut dusk sky: flat bands with wobbling edges, torn cloud strips, a few swifts
export function sky(c, t) {
  const dy = (c.y - 1.3) * 30 + ((c.h0 ?? 1140) - 1140);
  let s = `<rect width="${W}" height="${H}" fill="${D.sky[0]}"/>`;
  [200, 430, 640, 820].forEach((y0, i) => {
    let d = `M-20,${H} L-20,${n(y0 + dy)}`;
    for (let x = 0; x <= W + 60; x += 90) d += ` L${x},${n(y0 + dy + jit(i * 37 + x * 0.13, 26))}`;
    s += `<path d="${d} L${W + 20},${H} Z" fill="${D.sky[i + 1]}"/>`;
  });
  for (let i = 0; i < 7; i++) {
    const y = 240 + i * 92 + jit(i + 9, 30) + dy, x = ((hash(i + 13) * 1500 + t * (5 + 4 * hash(i))) % 1700) - 320, w = 260 + 280 * hash(i + 4), h = 16 + 22 * hash(i + 8);
    const a = Array.from({ length: 9 }, (_, k) => ({ x: x + w * (k < 5 ? k / 4 : (8 - k) / 4 + 0.06), y: y + (k < 5 ? -h * (0.4 + hash(i * 9 + k)) : h * 0.5 * hash(i * 9 + k)) }));
    s += `<path d="${blob(a)}" fill="${mix(D.sky[Math.min(4, 2 + (i % 3))], i % 2 ? "#ffd9a0" : "#7a3a6a", 0.45)}" opacity="0.8"/>`;
  }
  for (let i = 0; i < 5; i++) { const x = 330 + hash(i + 70) * 420 + Math.sin(t * 0.7 + i) * 30, y = 150 + hash(i + 75) * 420 + dy + Math.cos(t * 0.9 + i * 2) * 16, w = 7 + 5 * hash(i + 3), f = Math.sin(t * 9 + i * 2) * 3; s += `<path d="M${n(x - w)},${n(y - f)} Q${n(x - w * 0.4)},${n(y - 4)} ${n(x)},${n(y)} Q${n(x + w * 0.4)},${n(y - 4)} ${n(x + w)},${n(y - f)}" stroke="${D.iron}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`; }
  return s;
}

// worn cobbles, a centre gutter of long stones, moss in the joints, petals under the flower boxes, lamp-warmed patches
export function ground(c, t) {
  const xw = LANE.xw, hz = P(c, 0, 0, 90).y;
  let s = `<rect x="0" y="${n(Math.min(H, hz))}" width="${W}" height="${H}" fill="${fade(D.cobbleD, 30)}"/>`;
  const lit = (x, z) => { let m = 0; for (const [sd, lz] of LANE.lamps) m = Math.max(m, 1 - Math.hypot(x - sd * 1.35, (z - lz) * 0.6) / 2.4); return clamp(m) * (1 - COLD * 0.7); };
  let row = 0;
  for (let z = 0.4; z < 27; z += Math.max(0.16, z * 0.045), row++) {
    const dz = Math.max(0.16, z * 0.045);
    if (z < c.z + NEAR + 0.02) continue;
    const g = 0.012 + 0.0016 * z, near = z - c.z < 7;
    for (let x = -xw - hash(row + 400) * 0.25, j = 0; x < xw; j++) {
      const gut = Math.abs(x + 0.12) < 0.16, sw = gut ? 0.36 : 0.15 + 0.13 * hash(row * 17 + j), x0 = Math.max(-xw, x + g), x1 = Math.min(xw, x + sw - g), id = row * 31 + j; x += sw;
      if (x1 - x0 < 0.03) continue;
      const k = (i, a) => jit(id * 5 + i, a);
      const q = [P(c, x0 + k(0, 0.012), 0, z + dz - g + k(1, 0.014)), P(c, x1 + k(2, 0.012), 0, z + dz - g + k(3, 0.014)), P(c, x1 + k(4, 0.012), 0, z + g + k(5, 0.014)), P(c, x0 + k(6, 0.012), 0, z + g + k(7, 0.014))];
      if (q[3].y < -40 || q[0].y > H + 40 || q[1].x < -40 || q[0].x > W + 40) continue;
      let col = mix(D.cobble, D.cobble2, hash(id));
      if (gut) col = mix(col, D.cobbleD, 0.5); else if (hash(id + 7) > 0.86) col = mix(col, "#a8806a", 0.4);
      col = fade(mix(col, D.lamp2, lit((x0 + x1) / 2, z) * 0.5), z);
      s += poly(q, col, `stroke="${col}" stroke-width="${n(Math.min(5, q[0].s * 0.012))}" stroke-linejoin="round"`);
      if (near) {
        const h = hash(id + 3), a = q[0], b = q[1], d = q[3];
        s += `<path d="M${n(lerp(a.x, b.x, 0.12))},${n(lerp(a.y, d.y, 0.2))} L${n(lerp(a.x, b.x, 0.55 + 0.3 * h))},${n(lerp(a.y, d.y, 0.14))}" stroke="${mix(col, "#ffd9a0", 0.35)}" stroke-width="${n(a.s * 0.008)}" stroke-linecap="round" opacity="0.7" fill="none"/>`;
        if (h > 0.8) s += `<path d="M${n(lerp(a.x, b.x, 0.3))},${n(lerp(a.y, d.y, 0.3))} l${n(a.s * 0.03)},${n(a.s * 0.012)} l${n(a.s * 0.012)},${n(a.s * 0.02)}" stroke="${D.cobbleD}" stroke-width="${n(a.s * 0.004)}" fill="none" opacity="0.8"/>`;
        if (h < 0.13) s += `<ellipse cx="${n(d.x)}" cy="${n(d.y)}" rx="${n(a.s * 0.03)}" ry="${n(a.s * 0.009)}" fill="${D.moss}" opacity="0.85"/>`;
      }
    }
  }
  for (let i = 0; i < 26; i++) {   // fallen geranium petals near the walls
    const sd = i % 2 ? 1 : -1, z = 2.4 + hash(i + 200) * 12, x = sd * (xw - 0.12 - hash(i + 220) * 0.55);
    if (z < c.z + NEAR + 0.1) continue;
    const p = P(c, x, 0.005, z), r = p.s * 0.016;
    s += `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(r)}" ry="${n(r * 0.45)}" fill="${fade(i % 3 ? "#e23a4a" : "#f6a0b0", z)}" transform="rotate(${n(hash(i) * 180)} ${n(p.x)} ${n(p.y)})"/>`;
  }
  return s;
}

// illegible carved marks: seeded minims, bows and ticks on a baseline. Returns a path d. to(u along, v up) -> screen point.
function carvedMarks(to, len, seed, unit = 0.1) {
  let d = "", u = unit * 1.5, g = 0, word = 3 + Math.floor(hash(seed) * 4);
  const M = (a, b) => `M${pt(to(a[0], a[1]))} L${pt(to(b[0], b[1]))} `;
  while (u < len - unit * 1.5) {
    const h = hash(seed * 13 + g * 7.3), k = hash(seed * 5 + g * 3.1), top = h > 0.82 ? 1.45 : 1, bot = h < 0.1 ? -0.4 : 0;
    d += M([u, bot], [u + unit * 0.06, top]);                                          // the minim
    d += M([u - unit * 0.14, top - 0.08], [u + unit * 0.22, top + 0.06]);              // head serif
    if (k > 0.45) d += M([u - unit * 0.1, 0.02], [u + unit * 0.3, 0.2]);               // foot
    if (k < 0.3) d += M([u + unit * 0.08, 0.55], [u + unit * 0.52, 0.72]) + M([u + unit * 0.52, 0.72], [u + unit * 0.5, 0.1]);   // a bow
    else if (k > 0.8) d += M([u + unit * 0.1, 0.95], [u + unit * 0.5, 0.5]);
    u += unit * (k < 0.3 ? 0.95 : 0.55); g++;
    if (--word <= 0) { u += unit * 0.45; d += M([u, 0.42], [u + unit * 0.12, 0.6]) + M([u + unit * 0.12, 0.6], [u + unit * 0.24, 0.42]) + M([u + unit * 0.24, 0.42], [u + unit * 0.12, 0.26]) + M([u + unit * 0.12, 0.26], [u, 0.42]); u += unit * 0.75; word = 2 + Math.floor(hash(seed + g) * 5); }
  }
  return d;
}

function house(c, t, hs) {
  const [side, z0r, z1r, floors, jet, lean, plaster, timber, seed, kind] = hs;
  const zn = c.z + NEAR + 0.06;
  if (z1r < zn + 0.15) return { svg: "", glow: "" };
  const tilt = jit(seed * 3, 0.012), sag = (z) => Math.sin((z - z0r) / (z1r - z0r) * Math.PI) * -0.035 * (seed % 3);
  const X = (k, y) => side * (LANE.xw - k * jet - lean * y);
  const wp = (k, z, y) => P(c, X(k, y), y + (y > 2 ? sag(z) : 0), Math.max(zn, z + tilt * y));
  const zmid = (z0r + z1r) / 2, f = (col, z = zmid) => fade(col, z), nearCam = (z) => z - c.z < 13;
  // a member in the wall plane: z range, y range, seeded wobble
  const q = (k, za, zb, ya, yb, sd = 0, a = 0.014) => [[za, yb], [zb, yb], [zb, ya], [za, ya]].map(([z, y], i) => wp(k, z + (sd ? jit(sd * 7 + i, a) : 0), y + (sd ? jit(sd * 7 + i + 0.5, a) : 0)));
  const tim = (k, za, zb, ya, yb, sd) => zb < zn ? "" : poly(q(k, za, zb, ya, yb, sd), f(mix(timber, hash(sd) > 0.5 ? "#5a3a26" : "#1a100c", 0.28 * hash(sd + 1)), (za + zb) / 2));
  let s = "", glow = "", y0 = 0;
  const nb = Math.max(2, Math.round((z1r - z0r) / 1.22)), bz = (j) => z0r + (z1r - z0r) * j / nb + (j > 0 && j < nb ? jit(seed * 41 + j, 0.07) : 0);
  const doorBay = 1 + Math.floor(hash(seed * 7) * (nb - 2));
  const top = floors.reduce((a, b) => a + b, 0);
  // roof behind the top storey, tile rows, a ragged eave
  { const K = floors.length - 1, e0 = wp(K, z0r, top - 0.05), e1 = wp(K, z1r, top - 0.05), b0 = P(c, X(K, top) + side * 2.4, top + 2.7, Math.max(zn, z0r)), b1 = P(c, X(K, top) + side * 2.4, top + 2.7, Math.max(zn, z1r));
    const o0 = P(c, X(K, top) - side * 0.32, top - 0.16, Math.max(zn, z0r)), o1 = P(c, X(K, top) - side * 0.32, top - 0.16, Math.max(zn, z1r));
    s += poly([o0, o1, b1, b0], f(mix(D.roof, D.roof2, hash(seed + 2))));
    for (let r = 1; r < 9; r++) { const u = r / 9; s += `<path d="M${pt({ x: lerp(o0.x, b0.x, u), y: lerp(o0.y, b0.y, u) })} L${pt({ x: lerp(o1.x, b1.x, u), y: lerp(o1.y, b1.y, u) })}" stroke="${f(D.roof)}" stroke-width="${n(Math.max(1, e1.s * 0.02))}" opacity="0.6" stroke-dasharray="${n(10 + 20 * hash(seed + r))} ${n(3 + 4 * hash(seed * 2 + r))}"/>`; }
    s += poly([o0, o1, e1, e0], f("#2a1a1a")); }
  floors.forEach((fh, k) => {
    const y1 = y0 + fh, stone = kind === "stone" && k === 0;
    const pl = k === 0 && kind !== "stone" ? mix(plaster, "#b89a7a", 0.25) : plaster;
    if (k > 0) {   // the jetty: dark soffit, brackets under each post
      s += poly([wp(k - 1, z0r, y0), wp(k - 1, z1r, y0), wp(k, z1r, y0), wp(k, z0r, y0)], f("#1c1210"));
      for (let j = 0; j <= nb; j++) { const z = bz(j); if (z < zn + 0.1) continue; const a = wp(k - 1, z, y0 - 0.38), b = wp(k - 1, z, y0), d = wp(k, z, y0), w = b.s * 0.07; s += `<path d="M${pt(a)} Q${n(lerp(a.x, d.x, 0.2))},${n(lerp(a.y, d.y, 0.75))} ${pt(d)} L${pt(b)} Z" fill="${f(mix(timber, "#5a3a26", 0.3), z)}" stroke="${f("#140c0a", z)}" stroke-width="${n(w * 0.15)}"/>`; }
    }
    s += poly(q(k, z0r, z1r, y0, y1), f(pl));
    if (stone) {   // ashlar courses, each block its own tone, worn arrises
      for (let r = 0, yy = y0; yy < y1 - 0.05; r++) { const bh = 0.36 + 0.08 * hash(seed + r * 3), yb = Math.min(y1, yy + bh);
        for (let z = z0r - hash(seed * 9 + r) * 0.5, j = 0; z < z1r; j++) { const bl = 0.55 + 0.5 * hash(seed * 23 + r * 11 + j), za = Math.max(z0r, z), zb = Math.min(z1r, z + bl); z += bl; if (zb < zn || zb - za < 0.05) continue;
          const id = seed * 53 + r * 17 + j, col = mix(mix("#c9a877", "#a8845e", hash(id)), "#8a7a70", 0.3 * hash(id + 1));
          s += poly(q(k, za + 0.012, zb - 0.012, yy + 0.012, yb - 0.012, id, 0.008), f(col, (za + zb) / 2));
          if (nearCam(za) && hash(id + 5) > 0.72) { const a = wp(k, lerp(za, zb, 0.3), lerp(yy, yb, 0.7)); s += `<path d="M${pt(a)} l${n(a.s * 0.05)},${n(-a.s * 0.02)} l${n(a.s * 0.03)},${n(a.s * 0.03)}" stroke="#5a4636" stroke-width="${n(a.s * 0.006)}" fill="none" opacity="0.7"/>`; } }
        yy = yb; }
    } else if (k === 0) {   // rubble plinth under the timber frame
      for (let z = z0r, j = 0; z < z1r; j++) { const bl = 0.4 + 0.35 * hash(seed * 29 + j), zb = Math.min(z1r, z + bl); if (zb > zn) s += poly(q(0, z + 0.01, zb - 0.01, 0, 0.42 + 0.06 * hash(seed + j), seed * 61 + j, 0.012), f(mix("#8a7468", "#6a5a58", hash(seed * 3 + j)), z)); z += bl; }
    }
    // bays: plaster panel with its own tone, chips and cracks, then a window / brace / cross / rail
    for (let j = 0; j < nb; j++) {
      const za = bz(j), zb = bz(j + 1), id = seed * 97 + k * 13 + j, h = hash(id), zc = (za + zb) / 2;
      if (zb < zn + 0.05) continue;
      const base = k === 0 && !stone ? 0.45 : 0;
      if (!stone) {
        s += poly(q(k, za, zb, y0 + base, y1, id, 0.01), f(mix(pl, hash(id + 1) > 0.5 ? "#fff0d0" : "#7a5a48", 0.16 * hash(id + 2)), zc));
        if (nearCam(za)) {
          if (hash(id + 3) > 0.55) { const a = wp(k, lerp(za, zb, 0.15 + 0.6 * hash(id + 4)), y0 + base + (fh - base) * (0.25 + 0.6 * hash(id + 5))), r = a.s * (0.06 + 0.09 * hash(id + 6));   // a chip: the daub shows
            const ch = Array.from({ length: 7 }, (_, i) => ({ x: a.x + Math.cos(i / 7 * TAU) * r * (0.6 + 0.6 * hash(id * 3 + i)), y: a.y + Math.sin(i / 7 * TAU) * r * (0.5 + 0.5 * hash(id * 5 + i)) }));
            s += poly(ch, f(mix("#9a6a4a", "#b8553a", hash(id + 8)), zc)) + `<path d="M${pt(ch[3])} L${pt(ch[4])} L${pt(ch[5])}" stroke="${f(mix(pl, "#ffffff", 0.3), zc)}" stroke-width="${n(a.s * 0.006)}" fill="none"/>`; }
          if (hash(id + 9) > 0.5) { const a = wp(k, lerp(za, zb, 0.2 + 0.6 * hash(id + 10)), y1 - 0.2), L = a.s * 0.14; s += `<path d="M${pt(a)} l${n(jit(id + 11, L * 0.4))},${n(L)} l${n(jit(id + 12, L * 0.5))},${n(L * 0.8)} l${n(jit(id + 13, L * 0.3))},${n(L * 0.9)}" stroke="${f(mix(pl, "#3a2418", 0.55), zc)}" stroke-width="${n(a.s * 0.005)}" fill="none"/>`; }
        }
      }
      const isDoor = k === 0 && j === doorBay, isWin = !isDoor && (stone ? j % 2 === 1 : k === 0 ? h > 0.3 : h > 0.5);
      if (isDoor) {
        const dz0 = za + 0.18, dz1 = zb - 0.14, dy = Math.min(2.15, fh - 0.4), a = q(0, dz0, dz1, 0.12, dy, id);
        s += poly(q(0, dz0 - 0.08, dz1 + 0.08, 0, dy + 0.12, id + 1), f(stone ? "#8a6a4a" : timber, zc)) + poly(a, f(mix("#3f6a5a", "#7a2f2a", seed % 2), zc));
        for (let v = 1; v < 4; v++) { const m0 = wp(0, lerp(dz0, dz1, v / 4), 0.12), m1 = wp(0, lerp(dz0, dz1, v / 4), dy); s += `<path d="M${pt(m0)} L${pt(m1)}" stroke="${f("#1a1210", zc)}" stroke-width="${n(m0.s * 0.008)}" opacity="0.7"/>`; }
        const kn = wp(0, lerp(dz0, dz1, side < 0 ? 0.82 : 0.18), 1.05); s += `<circle cx="${n(kn.x)}" cy="${n(kn.y)}" r="${n(kn.s * 0.03)}" fill="${f("#d9a441", zc)}"/>`;
        s += poly(q(0, dz0 - 0.2, dz1 + 0.2, 0, 0.13, id + 2), f("#8a7a70", zc));
      } else if (isWin) {
        const wz0 = za + (stone ? 0.28 : 0.2), wz1 = zb - (stone ? 0.28 : 0.2), wy0 = y0 + (k === 0 ? 1.05 : 0.82), wy1 = Math.min(y1 - 0.34, wy0 + (stone ? 1.25 : 1.02));
        const lit = hash(id + 20) > 0.26, wq = q(k, wz0, wz1, wy0, wy1, id + 21, 0.006);
        s += poly(q(k, wz0 - 0.09, wz1 + 0.09, wy0 - 0.09, wy1 + 0.09, id + 22), f(stone ? "#b89a70" : timber, zc));
        if (wz1 > zn + 0.05) {
          s += poly(wq, f(lit ? D.win2 : D.winD, zc));
          const cols = 3, rows = 4;
          if (nearCam(za) && lit) for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {   // every small pane its own amber
            const u0 = wz0 + (wz1 - wz0) * a / cols, u1 = wz0 + (wz1 - wz0) * (a + 1) / cols, v0 = wy0 + (wy1 - wy0) * b / rows, v1 = wy0 + (wy1 - wy0) * (b + 1) / rows;
            if (u1 < zn) continue;
            s += poly(q(k, u0 + 0.012, u1 - 0.012, v0 + 0.012, v1 - 0.012), f(mix(mix(D.win, D.win2, hash(id * 3 + a * 5 + b)), "#fff2c0", 0.5 * hash(id * 7 + a + b * 3) ** 3), zc));
          }
          let gd = ""; for (let a = 1; a < cols; a++) { const zz = wz0 + (wz1 - wz0) * a / cols; if (zz > zn) gd += `M${pt(wp(k, zz, wy0))} L${pt(wp(k, zz, wy1))} `; }
          for (let b = 1; b < rows; b++) gd += `M${pt(wp(k, wz0, wy0 + (wy1 - wy0) * b / rows))} L${pt(wp(k, wz1, wy0 + (wy1 - wy0) * b / rows))} `;
          const ws = wp(k, zc, wy0).s;
          s += `<path d="${gd}" stroke="${f(lit ? "#6a3a1a" : "#1a1420", zc)}" stroke-width="${n(Math.max(0.8, ws * 0.016))}" fill="none"/>`;
          if (lit && hash(id + 23) > 0.5) s += poly([wp(k, wz0, wy1), wp(k, lerp(wz0, wz1, 0.55), wy1), wp(k, wz0, lerp(wy0, wy1, 0.35))], f("#fff0d0", zc), `opacity="0.5"`);   // a half curtain
          if (lit) { const gc = wp(k, zc, (wy0 + wy1) / 2); if (nearCam(za)) glow += lightBlobs(gc.x - side * gc.s * 0.25, gc.y, [gc.s * 0.75], D.win2, [0.07 * (1 - COLD * 0.5)], id, 1.3); }
        }
        if (k <= 1 && hash(id + 24) > 0.42 && wz1 > zn + 0.1) {   // flower box: geraniums placed one by one, leaves hanging over
          s += poly(q(k, wz0 - 0.12, wz1 + 0.12, wy0 - 0.3, wy0 - 0.08, id + 25), f("#5a3a26", zc));
          const N = nearCam(za) ? 16 : 7;
          for (let i = 0; i < N; i++) { const zz = lerp(wz0 - 0.1, wz1 + 0.1, hash(id * 11 + i)); if (zz < zn) continue; const a = wp(k, zz, wy0 - 0.1 + hash(id * 13 + i) * 0.22 - (i % 4 === 0 ? 0.3 : 0)), r = a.s * (0.04 + 0.035 * hash(id * 17 + i)), sw = Math.sin(t * 1.3 + i + id) * a.s * 0.006;
            s += i % 4 === 0 ? `<path d="M${n(a.x)},${n(a.y - r * 3)} q${n(r + sw)},${n(r * 2)} ${n(sw * 2)},${n(r * 4)}" stroke="${f("#3f6a3a", zc)}" stroke-width="${n(r * 0.9)}" fill="none" stroke-linecap="round"/>` : `<circle cx="${n(a.x + sw)}" cy="${n(a.y)}" r="${n(r)}" fill="${f(i % 4 === 1 ? "#4f7f3f" : pick(["#e2303f", "#f25a5a", "#ffe6e0", "#d8284a"], id + i), zc)}"/>`; }
        }
      } else if (!stone && k > 0) {
        if (h < 0.17) s += poly([wp(k, za + 0.02, y0 + 0.2), wp(k, za + 0.2, y0 + 0.2), wp(k, zb - 0.02, y1 - 0.12), wp(k, zb - 0.2, y1 - 0.12)], f(timber, zc));
        else if (h < 0.34) s += poly([wp(k, zb - 0.02, y0 + 0.2), wp(k, zb - 0.2, y0 + 0.2), wp(k, za + 0.02, y1 - 0.12), wp(k, za + 0.2, y1 - 0.12)], f(timber, zc));
        else if (h < 0.42) s += poly([wp(k, za + 0.02, y0 + 0.2), wp(k, za + 0.17, y0 + 0.2), wp(k, zb - 0.02, y1 - 0.12), wp(k, zb - 0.17, y1 - 0.12)], f(timber, zc)) + poly([wp(k, zb - 0.02, y0 + 0.2), wp(k, zb - 0.17, y0 + 0.2), wp(k, za + 0.02, y1 - 0.12), wp(k, za + 0.17, y1 - 0.12)], f(mix(timber, "#5a3a26", 0.2), zc));
        else s += tim(k, za, zb, y0 + fh * 0.5 - 0.07, y0 + fh * 0.5 + 0.07, id + 30);
      }
    }
    if (!stone) {
      for (let j = 0; j <= nb; j++) { const z = bz(j); s += tim(k, z - 0.085, z + 0.085, y0 + (k === 0 ? 0.42 : 0), y1, seed * 71 + k * 7 + j); }
      s += tim(k, z0r, z1r, y1 - 0.15, y1, seed * 73 + k);
    }
    if (k > 0) {   // the bressummer: a carved, painted beam
      const bh = 0.27; s += tim(k, z0r, z1r, y0 - 0.02, y0 + bh, seed * 79 + k);
      const a0 = wp(k, Math.max(zn, z0r), y0 + bh), a1 = wp(k, z1r, y0 + bh); s += `<path d="M${pt(a0)} L${pt(a1)}" stroke="${f("#7a5236")}" stroke-width="${n(Math.max(1, a0.s * 0.01))}" opacity="0.8"/>`;
      if (z1r - c.z < 17) {
        const zA = Math.max(zn + 0.1, z0r + 0.15), to = (u, v) => wp(k, zA + u, y0 + 0.07 + v * 0.11);
        if (z1r - 0.2 - zA > 0.6) { const d = carvedMarks(to, z1r - 0.2 - zA, seed * 5 + k, kind === "stone" ? 0.1 : 0.12), w = to(0, 0).s; s += `<path d="${d}" stroke="${f("#d9a441")}" stroke-width="${n(Math.max(0.8, w * 0.011))}" fill="none" stroke-linecap="round" opacity="0.75" transform="translate(0,${n(Math.max(0.6, w * 0.005))})"/><path d="${d}" stroke="${f("#150c08")}" stroke-width="${n(Math.max(0.8, w * 0.011))}" fill="none" stroke-linecap="round"/>`; }
        if (kind !== "stone") for (let j = 0; j <= nb; j++) {   // painted fan rosettes at the foot of each post
          const z = bz(j); if (z < zn + 0.35 || hash(seed * 83 + k * 3 + j) < 0.3) continue;
          const R = 0.3, cy = y0 + bh;
          for (let w = 0; w < 7; w++) { const a0 = Math.PI * w / 7, a1 = Math.PI * (w + 1) / 7; s += poly([wp(k, z, cy), wp(k, z + Math.cos(a0) * R, cy + Math.sin(a0) * R), wp(k, z + Math.cos((a0 + a1) / 2) * R * 1.06, cy + Math.sin((a0 + a1) / 2) * R * 1.06), wp(k, z + Math.cos(a1) * R, cy + Math.sin(a1) * R)], f(["#b8322a", "#e0a83a", "#3f6f4a"][w % 3], z), `stroke="${f("#1a100c", z)}" stroke-width="${n(wp(k, z, cy).s * 0.006)}"`); }
        }
      }
    }
    y0 = y1;
  });
  return { svg: s, glow };
}

// the far end of the lane: a Weser-Renaissance stone gable (banded ashlar, scrolls, obelisks) and the church spire behind
function gableEnd(c) {
  const Z = LANE.end, f = (col) => fade(col, Z + 6), g = (X, Y) => P(c, X, Y, Z);
  if (Z - c.z < 1) return "";
  let s = "";
  const sp = P(c, 5.5, 0, Z + 30);
  s += `<path d="M${n(sp.x - 2.2 * sp.s)},${n(sp.y - 20 * sp.s)} L${n(sp.x - 2 * sp.s)},${n(sp.y - 30 * sp.s)} L${n(sp.x + 0.2 * sp.s)},${n(sp.y - 58 * sp.s)} L${n(sp.x + 2.2 * sp.s)},${n(sp.y - 30 * sp.s)} L${n(sp.x + 2.5 * sp.s)},${n(sp.y - 20 * sp.s)} L${n(sp.x + 2.5 * sp.s)},${n(sp.y)} L${n(sp.x - 2.2 * sp.s)},${n(sp.y)} Z" fill="${mix(D.spire, D.sky[2], 0.35)}"/>`;
  const out = [[-3.7, 0], [-3.7, 8.6], [-3.3, 8.7], [-3.25, 10.2], [-2.5, 10.3], [-2.45, 12], [-1.6, 12.1], [-1.55, 13.9], [-0.7, 14], [-0.62, 15.5], [0, 16.1], [0.62, 15.5], [0.7, 14], [1.55, 13.9], [1.6, 12.1], [2.45, 12], [2.5, 10.3], [3.25, 10.2], [3.3, 8.7], [3.7, 8.6], [3.7, 0]];
  s += poly(out.map(([x, y], i) => g(x + jit(i + 5, 0.04), y)), f("#b8946a"));
  for (let r = 0; r < 34; r++) { const y = r * 0.47, half = y < 8.6 ? 3.7 : Math.max(0.3, 3.7 - (y - 8.6) * 0.47), band = r % 4 === 2;
    for (let x = -half + hash(r) * 0.3, j = 0; x < half; j++) { const bl = 0.7 + 0.6 * hash(r * 13 + j), x1 = Math.min(half, x + bl); s += poly([g(x + 0.03, y + 0.44), g(x1 - 0.03, y + 0.44), g(x1 - 0.03, y + 0.03), g(x + 0.03, y + 0.03)], f(band ? mix("#8a6a4a", "#a07a52", hash(r * 7 + j)) : mix("#d2b080", "#b8926a", hash(r * 7 + j)))); x += bl; }
    if (band) { let d = ""; for (let x = -half + 0.2; x < half - 0.2; x += 0.34) d += `M${pt(g(x, y + 0.1))} L${pt(g(x + 0.17, y + 0.36))} L${pt(g(x + 0.34, y + 0.1))} `; s += `<path d="${d}" stroke="${f("#5a4030")}" stroke-width="1.2" fill="none"/>`; } }
  for (const [x, y] of [[-3.5, 8.7], [3.5, 8.7], [-2.85, 10.3], [2.85, 10.3], [-2, 12.1], [2, 12.1], [-1.1, 14], [1.1, 14], [0, 16.1]]) { const a = g(x, y), k = a.s; s += `<path d="M${n(a.x - 0.16 * k)},${n(a.y)} L${n(a.x)},${n(a.y - 1.15 * k)} L${n(a.x + 0.16 * k)},${n(a.y)} Z" fill="${f("#a8845e")}"/><circle cx="${n(a.x)}" cy="${n(a.y - 1.2 * k)}" r="${n(0.11 * k)}" fill="${f("#a8845e")}"/>`; }
  for (const [x, y, d] of [[-3.0, 9.4, 1], [3.0, 9.4, -1], [-2.2, 11.1, 1], [2.2, 11.1, -1], [-1.3, 13, 1], [1.3, 13, -1]]) { const a = g(x, y), k = a.s; s += `<path d="M${n(a.x - d * 0.45 * k)},${n(a.y + 0.6 * k)} q${n(d * 0.1 * k)},${n(-1.0 * k)} ${n(d * 0.6 * k)},${n(-0.9 * k)} q${n(d * 0.3 * k)},${n(0.3 * k)} ${n(d * 0.05 * k)},${n(0.5 * k)} q${n(-d * 0.25 * k)},${n(0.05 * k)} ${n(-d * 0.2 * k)},${n(-0.2 * k)}" stroke="${f("#7a5a40")}" stroke-width="${n(0.13 * k)}" fill="none" stroke-linecap="round"/>`; }
  for (let r = 0; r < 5; r++) for (let j = 0; j < (r < 3 ? 4 : r === 3 ? 2 : 1); j++) {
    const cnt = r < 3 ? 4 : r === 3 ? 2 : 1, x = (j - (cnt - 1) / 2) * (r < 3 ? 1.7 : 1.5), y = r < 3 ? 1.4 + r * 2.5 + (r === 0 ? 0.4 : 0) : r === 3 ? 9.3 : 12.5;
    if (r === 0 && (j === 1 || j === 2)) continue;
    const lit = hash(r * 9 + j + 3) > 0.35;
    s += poly([g(x - 0.52, y + 1.5), g(x + 0.52, y + 1.5), g(x + 0.52, y), g(x - 0.52, y)], f("#8a6a4a")) + poly([g(x - 0.42, y + 1.4), g(x + 0.42, y + 1.4), g(x + 0.42, y + 0.1), g(x - 0.42, y + 0.1)], lit ? mix(D.win, D.haze, 0.25) : f(D.winD));
    s += `<path d="M${pt(g(x, y + 1.4))} L${pt(g(x, y + 0.1))} M${pt(g(x - 0.42, y + 0.9))} L${pt(g(x + 0.42, y + 0.9))}" stroke="${f("#8a6a4a")}" stroke-width="${n(g(0, 0).s * 0.07)}"/>`;
  }
  const d0 = g(0, 0), k = d0.s;   // the portal
  s += `<path d="M${n(d0.x - 0.95 * k)},${n(d0.y)} L${n(d0.x - 0.95 * k)},${n(d0.y - 2.1 * k)} Q${n(d0.x)},${n(d0.y - 3.4 * k)} ${n(d0.x + 0.95 * k)},${n(d0.y - 2.1 * k)} L${n(d0.x + 0.95 * k)},${n(d0.y)} Z" fill="${f("#7a5a40")}"/><path d="M${n(d0.x - 0.72 * k)},${n(d0.y)} L${n(d0.x - 0.72 * k)},${n(d0.y - 2.05 * k)} Q${n(d0.x)},${n(d0.y - 3.05 * k)} ${n(d0.x + 0.72 * k)},${n(d0.y - 2.05 * k)} L${n(d0.x + 0.72 * k)},${n(d0.y)} Z" fill="${f("#2f1d18")}"/>`;
  return s;
}

// one wrought-iron hanging lamp: scrolled bracket, chain, a six-pane lantern that sways
function hangLamp(c, t, [side, z, y], i, level) {
  if (z - c.z < NEAR + 0.2) return { svg: "", glow: "" };
  const wallX = side * (LANE.xw - 0.22 - 0.02 * y), a = P(c, wallX, y, z), b = P(c, wallX - side * 0.85, y, z), k = a.s, sw = Math.sin(t * 1.1 + i * 2.3) * 3.5, fl = level * (0.92 + 0.08 * Math.sin(t * 13 + i * 5) * Math.sin(t * 7.3 + i));
  const iron = fade(D.iron, z), w = Math.max(1.5, k * 0.035), d = -side;
  let s = `<path d="M${pt(a)} L${pt(b)} M${n(a.x)},${n(a.y + 0.55 * k)} Q${n(a.x + d * 0.5 * k)},${n(a.y + 0.5 * k)} ${n(a.x + d * 0.62 * k)},${n(a.y + 0.04 * k)} M${n(a.x + d * 0.2 * k)},${n(a.y)} q${n(d * 0.12 * k)},${n(-0.3 * k)} ${n(d * 0.3 * k)},${n(-0.2 * k)} q${n(d * 0.1 * k)},${n(0.1 * k)} ${n(-d * 0.02 * k)},${n(0.14 * k)} M${n(b.x)},${n(b.y)} q${n(d * 0.16 * k)},${n(-0.02 * k)} ${n(d * 0.14 * k)},${n(-0.16 * k)} q${n(-d * 0.1 * k)},${n(-0.08 * k)} ${n(-d * 0.14 * k)},${n(0.04 * k)}" stroke="${iron}" stroke-width="${n(w)}" fill="none" stroke-linecap="round"/>`;
  const L = (x, yy) => `${n(x * k)},${n(yy * k)}`;
  s += `<g transform="translate(${n(b.x)},${n(b.y)}) rotate(${n(sw)})"><path d="M0,0 L0,${n(0.2 * k)}" stroke="${iron}" stroke-width="${n(w * 0.6)}" stroke-dasharray="${n(k * 0.03)} ${n(k * 0.02)}"/>
    <path d="M${L(-0.2, 0.3)} L${L(0, 0.17)} L${L(0.2, 0.3)} Z" fill="${iron}"/>
    <path d="M${L(-0.17, 0.3)} L${L(-0.06, 0.3)} L${L(-0.05, 0.68)} L${L(-0.12, 0.68)} Z" fill="${mix(D.lamp2, "#3a2a2a", 1 - fl)}"/><path d="M${L(-0.06, 0.3)} L${L(0.07, 0.3)} L${L(0.06, 0.68)} L${L(-0.05, 0.68)} Z" fill="${mix("#fff0b8", "#4a3a3a", 1 - fl)}"/><path d="M${L(0.07, 0.3)} L${L(0.17, 0.3)} L${L(0.12, 0.68)} L${L(0.06, 0.68)} Z" fill="${mix(D.lamp, "#3a2a2a", 1 - fl)}"/>
    <path d="M${L(-0.17, 0.3)} L${L(0.17, 0.3)} L${L(0.12, 0.68)} L${L(-0.12, 0.68)} Z M${L(-0.06, 0.3)} L${L(-0.05, 0.68)} M${L(0.07, 0.3)} L${L(0.06, 0.68)}" stroke="${iron}" stroke-width="${n(w * 0.7)}" fill="none" stroke-linejoin="round"/>
    <path d="M${L(-0.09, 0.68)} L${L(0, 0.78)} L${L(0.09, 0.68)} Z" fill="${iron}"/></g>`;
  const hx = b.x + Math.sin(sw * Math.PI / 180) * -0.5 * k, hy = b.y + 0.5 * k, g = P(c, wallX - side * 0.85, 0, z);
  const glow = lightBlobs(hx, hy, [0.42 * k, 0.9 * k, 1.7 * k], D.lamp, [0.22 * fl, 0.09 * fl, 0.04 * fl], i * 7 + 1) + lightBlobs(g.x, g.y, [0.9 * k, 1.7 * k], D.lamp2, [0.12 * fl, 0.06 * fl], i * 7 + 3, 0.2);
  return { svg: s, glow };
}

// the whole street. o: { lamps 0..1 (lamp level, default 1) }. Returns { back, glow }: draw back, the cast, then glow.
export function street(c, t, o = {}) {
  let back = `<g filter="url(#haze)">${sky(c, t)}</g>` + gableEnd(c) + ground(c, t), glow = "";
  const order = HOUSES.map((h, i) => i).sort((a, b) => HOUSES[b][1] - HOUSES[a][1]);
  for (const i of order) { const h = house(c, t, HOUSES[i]); back += h.svg; glow += h.glow; }
  LANE.lamps.map((l, i) => [l, i]).sort((a, b) => b[0][1] - a[0][1]).forEach(([l, i]) => { const h = hangLamp(c, t, l, i, (o.lamps ?? 1) * (1 - COLD * 0.6)); back += h.svg; glow += h.glow; });
  return { back, glow };
}
// dust in the lamp light + the grade (amber wash; cold = a blue multiply). Last layers before the vignette.
export function dust(t, count = 46, col = "#ffe2a8") {
  let s = "";
  for (let i = 0; i < count; i++) { const sp = 12 + 22 * hash(i + 5), x = (hash(i + 20) * W + Math.sin(t * 0.6 + i * 1.7) * 40 + t * sp * 0.4) % W, y = H - ((hash(i + 40) * H + t * sp) % H), r = 1.2 + 2.6 * hash(i + 60) ** 2;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${col}" opacity="${n((0.12 + 0.4 * hash(i + 80)) * (0.6 + 0.4 * Math.sin(t * 2 + i * 3)))}"/>`; }
  return `<g style="mix-blend-mode:screen">${s}</g>`;
}
export function grade() {
  return COLD > 0.02 ? `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#9fb8e6", COLD)}" style="mix-blend-mode:multiply"/>` : `<rect width="${W}" height="${H}" fill="#ff9a3a" opacity="0.07" style="mix-blend-mode:screen"/>`;
}
export const vignette = (a = 1) => `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${a}"/>`;

// ---------------------------------------------------------------- today props (screen space: p = {x, y}, k = px per cm)
// where the kid's mouth is on screen for a given kid state (use with hand2face: 1), so the whistle sits at his lips
export function kidMouth(c, st) {
  const p = P(c, st.X, 0, st.Z), fx = st.fx ?? -0.8, bob = st.run == null ? 0 : Math.abs(Math.cos(st.run * TAU)) * 4;
  const q = toScreen(p, st.lean || 0, fx * 7.9 * 0.8, (-110.7 - (st.hop || 0) - bob) * 0.8);
  return { x: q.x, y: q.y, k: p.s / 100, dir: fx < 0 ? -1 : 1 };
}
// a small tin whistle: nickel tube, six holes, a green mouthpiece. o: { k, rot deg (0 = pointing right), dir, grip (fingers over it) }
export function tinWhistle(p, o = {}) {
  const k = o.k ?? 4, dir = o.dir ?? 1;
  let s = `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(dir * k * 100) / 100},${n(k * 100) / 100}) rotate(${n(o.rot ?? 24)})" stroke="${INK}" stroke-width="0.22" stroke-linejoin="round">
    <path d="M4.6,-0.72 L29.6,-0.55 Q30.3,0 29.6,0.55 L4.6,0.72 Z" fill="#c9d3da"/><path d="M4.6,0.2 L29.6,0.18 Q30.2,0.3 29.6,0.55 L4.6,0.72 Z" fill="#8f9cab" stroke="none"/>
    <path d="M5.5,-0.42 L28.8,-0.32" stroke="#ffffff" stroke-width="0.2" opacity="0.9"/>
    <path d="M-0.4,-0.5 Q-0.9,0 -0.4,0.6 L5,0.95 L5,-0.95 Z" fill="#2f9a6e"/><path d="M-0.4,0.25 L5,0.4 L5,0.95 L-0.4,0.6 Z" fill="#1f6f52" stroke="none"/><path d="M2.6,-0.9 L4.1,-0.9 L3.9,-0.2 L2.8,-0.2 Z" fill="#0f2a22"/>`;
  [10.5, 13.2, 15.9, 19.4, 22.1, 24.8].forEach((x, i) => { s += `<ellipse cx="${x}" cy="-0.12" rx="${0.42 + (i % 3) * 0.05}" ry="0.3" fill="#1f2530" stroke="none"/>`; });
  s += `<path d="M7.2,-0.7 L7.2,0.7 M28.2,-0.56 L28.2,0.56" stroke="#7f8a98" stroke-width="0.18"/>`;
  if (o.grip) for (const x of [11.8, 14.6, 20.6]) s += `<path d="M${x - 1},1.6 Q${x - 1.2},-1.3 ${x},-1.5 Q${x + 1.2},-1.3 ${x + 1},1.6" fill="#f3cdb0" stroke-width="0.25"/><path d="M${x - 0.5},-0.9 Q${x},-1.15 ${x + 0.5},-0.9" stroke="#c48a74" stroke-width="0.18" fill="none"/>`;
  return s + `</g>`;
}
// a worn coin (no lettering: a gate stamp and ticks). o: { k, flip 0..1 turns (edge-on at 0.25), rot, seed }
export function coin(p, o = {}) {
  const k = o.k ?? 6, sq = Math.cos((o.flip || 0) * TAU), ry = Math.max(0.12, Math.abs(sq)), back = sq < 0, sd = o.seed || 1;
  let s = `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(o.rot || 0)}) scale(${n(k * 100) / 100})"><g transform="scale(1,${n(ry * 100) / 100})">`;
  const rim = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * TAU, r = 1.5 + jit(sd * 9 + i, 0.045); return { x: Math.cos(a) * r, y: Math.sin(a) * r }; });
  s += `<path d="${blob(rim)}" fill="#8a5a1a" transform="translate(0,${n(0.22 / ry * (1 - ry) + 0.1)})" stroke="${INK}" stroke-width="0.14"/><path d="${blob(rim)}" fill="${back ? "#d9a030" : "#f0bf3f"}" stroke="${INK}" stroke-width="0.14"/>`;
  s += `<circle r="1.18" fill="none" stroke="#a8721c" stroke-width="0.1" stroke-dasharray="0.22 0.16"/>`;
  s += back ? `<path d="M-0.7,0 L0.7,0 M0,-0.7 L0,0.7 M-0.45,-0.45 L0.45,0.45 M0.45,-0.45 L-0.45,0.45" stroke="#a8721c" stroke-width="0.14" stroke-linecap="round"/>`
    : `<path d="M-0.75,0.6 L-0.75,-0.25 L-0.5,-0.25 L-0.5,-0.55 L-0.25,-0.55 L-0.25,-0.25 L0.25,-0.25 L0.25,-0.55 L0.5,-0.55 L0.5,-0.25 L0.75,-0.25 L0.75,0.6 Z M-0.22,0.6 L-0.22,0.2 Q0,-0.1 0.22,0.2 L0.22,0.6" fill="none" stroke="#a8721c" stroke-width="0.13" stroke-linejoin="round"/>`;
  s += `<path d="M-1.05,-0.75 Q-0.5,-1.3 0.4,-1.2" stroke="#fff3c0" stroke-width="0.16" fill="none" stroke-linecap="round"/><path d="M0.6,0.9 l0.25,0.2 M-1.1,0.3 l-0.2,0.25" stroke="#7a4a12" stroke-width="0.08"/>`;
  return s + `</g></g>`;
}
// the grandmother's open hand, palm up, for the close insert (her cloak cuff, her skin). o: { k, rot, dir, cup 0..1 (fingers curl) }
// The palm centre is the origin, so a coin drawn at p lies in it.
export function palm(p, o = {}) {
  const k = o.k ?? 14, cup = o.cup || 0, skin = "#e6bf9e", sh = "#b98a6c", st = `stroke="${INK}" stroke-width="0.2" stroke-linejoin="round"`;
  let s = `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(o.rot || 0)}) scale(${n((o.dir ?? 1) * k * 100) / 100},${n(k * 100) / 100})">
    <path d="M-26,-3 Q-17,-8.6 -9,-6.2 L-8.6,6.4 Q-17,9.6 -26,6 Z" fill="#2b2f6b" ${st}/><path d="M-26,3 Q-17,6 -8.7,4 L-8.6,6.4 Q-17,9.6 -26,6 Z" fill="#20234f"/>
    <path d="M-20,-4.6 Q-19,0 -20.6,5 M-14,-6 Q-13,0 -14.4,7" stroke="#1c1f48" stroke-width="0.25" fill="none"/>
    <path d="M-10.6,-6.6 Q-8.2,-7.2 -7.6,-6 L-7.2,6.2 Q-8.2,7.4 -10.2,6.8 Z" fill="#f2a93b" ${st}/>`;
  [[-3.5, 8.4, -5, 1.2], [-1.15, 9.8, -1, 1.25], [1.25, 9.2, 3, 1.2], [3.5, 7, 8, 1.05]].forEach(([y, len, a, hw]) => {   // four fingers, knuckle creases
    const L = len * (1 - cup * 0.35);
    s += `<g transform="translate(5,${y}) rotate(${a - cup * 16})"><path d="M-1.4,${-hw} L${n(L * 0.6)},${n(-hw * 0.92)} Q${n(L + 0.3)},${n(-hw * 0.8)} ${n(L + 0.3)},0 Q${n(L + 0.3)},${n(hw * 0.8)} ${n(L * 0.6)},${n(hw * 0.92)} L-1.4,${hw} Z" fill="${skin}" ${st}/><path d="M${n(L * 0.36)},${n(-hw * 0.6)} q0.3,${n(hw * 0.6)} 0,${n(hw * 1.2)} M${n(L * 0.66)},${n(-hw * 0.55)} q0.26,${n(hw * 0.55)} 0,${n(hw * 1.1)}" stroke="${sh}" stroke-width="0.16" fill="none"/></g>`; });
  s += `<path d="M-7.8,-5 Q-3,-6.4 2,-5.6 Q5.4,-5 6,-3.6 L6.2,4 Q4,6 -2,5.8 Q-6,5.8 -7.6,5 Z" fill="${skin}" ${st}/>
    <path d="M-6,-4.8 Q-6.6,-9.4 -2,-11.6 Q1.6,-12.6 2.6,-10.4 Q2.4,-8.6 0,-7.6 Q-1.6,-6 -1.6,-3 Q-4,-1.6 -6,-4.8 Z" fill="${skin}" ${st}/><path d="M0.6,-10.6 q1,0.4 1.2,1.4 M-1.8,-8.6 q0.8,0.6 0.8,1.6" stroke="${sh}" stroke-width="0.16" fill="none"/>
    <path d="M-5.6,-2 Q-2,-1 1.4,-4.4 M-6.4,1.6 Q-1,-0.4 5,0.4 M-5.6,3.8 Q-0.6,2.2 5,2.8 M-2.2,-3 Q-0.8,0 -3.4,4.6" stroke="${sh}" stroke-width="0.2" fill="none" stroke-linecap="round"/>
    <path d="M-7.2,-1 q0.5,0.6 0.1,1.4 M-6.8,2.4 q0.5,0.5 0.2,1.1 M3,-2.6 q0.6,0.2 0.8,0.9 M3.2,4 q0.6,-0.1 0.9,-0.6" stroke="${sh}" stroke-width="0.14" fill="none"/></g>`;
  return s;
}

// close insert: the carved beam of the house, flat on. view { x (0..1 pan along the beam), zoom }; o { light 0..1 (a lamp patch
// that travels with x), seed }. The inscription is drawn as carved marks that read as old letters and say nothing.
export function beamInsert(view = {}, t = 0, o = {}) {
  const z = view.zoom ?? 1, L = 3400, bx = lerp(0, L - W / z, clamp(view.x ?? 0)), bh = 520, by = 700;
  let s = `<rect width="${W}" height="${H}" fill="#3a2a22"/><g transform="translate(${W / 2},${H / 2}) scale(${z}) translate(${n(-bx - W / (2 * z))},${-H / 2})">`;
  s += `<rect x="-200" y="-400" width="${L + 400}" height="${by + 400}" fill="#e2c28a"/>`;   // plaster above, chipped
  for (let i = 0; i < 60; i++) { const x = hash(i + 5) * L, y = by - 40 - hash(i + 9) * 620, r = 18 + 60 * hash(i + 3); const a = Array.from({ length: 7 }, (_, j) => ({ x: x + Math.cos(j / 7 * TAU) * r * (0.5 + hash(i * 7 + j)), y: y + Math.sin(j / 7 * TAU) * r * 0.5 * (0.5 + hash(i * 11 + j)) })); s += poly(a, i % 3 ? "#d4b078" : "#b0764e", `opacity="${i % 3 ? 0.6 : 0.9}"`); }
  for (let i = 0; i < 14; i++) { const x = hash(i + 50) * L, y = by - 80 - hash(i + 55) * 500; s += `<path d="M${n(x)},${n(y)} l${n(jit(i, 30))},60 l${n(jit(i + 1, 40))},70 l${n(jit(i + 2, 25))},50" stroke="#8a6a4a" stroke-width="2.5" fill="none"/>`; }
  s += `<rect x="-200" y="${by + bh}" width="${L + 400}" height="900" fill="#b8946a"/>`;   // stone below
  for (let r = 0; r < 4; r++) for (let x = -200 - hash(r) * 200, j = 0; x < L + 200; j++) { const w = 300 + 260 * hash(r * 9 + j); s += `<rect x="${n(x + 5)}" y="${by + bh + 20 + r * 175}" width="${n(w - 10)}" height="165" fill="${mix("#c9a877", "#a8845e", hash(r * 31 + j))}"/>`; x += w; }
  s += `<rect x="-200" y="${by}" width="${L + 400}" height="${bh}" fill="#4a2f1f"/><rect x="-200" y="${by}" width="${L + 400}" height="26" fill="#6a4630"/><rect x="-200" y="${by + bh - 30}" width="${L + 400}" height="30" fill="#2a1810"/>`;
  for (let i = 0; i < 90; i++) { const x = hash(i + 100) * L, y = by + 30 + hash(i + 130) * (bh - 60), w = 120 + 500 * hash(i + 160); s += `<path d="M${n(x)},${n(y)} q${n(w * 0.5)},${n(jit(i, 10))} ${n(w)},${n(jit(i + 1, 6))}" stroke="${i % 4 ? "#3a2418" : "#6a4630"}" stroke-width="${n(1.5 + 3 * hash(i))}" fill="none" opacity="0.7"/>`; }
  for (let i = 0; i < 9; i++) { const x = 150 + hash(i + 200) * (L - 300), y = by + 60 + hash(i + 210) * (bh - 120); s += `<path d="M${n(x)},${n(y)} l${n(60 + 160 * hash(i))},${n(jit(i, 8))} l${n(40 + 80 * hash(i + 1))},${n(jit(i + 2, 14))}" stroke="#1a0e08" stroke-width="${n(3 + 4 * hash(i + 3))}" fill="none" stroke-linecap="round"/>`; }
  for (let i = 0; i < 8; i++) { const x = 200 + i * 430 + jit(i + 300, 60); s += `<circle cx="${n(x)}" cy="${by + 60}" r="13" fill="#1f120c"/><circle cx="${n(x + 3)}" cy="${by + 57}" r="9" fill="#5a3a26"/><circle cx="${n(x + jit(i, 30))}" cy="${by + bh - 70}" r="12" fill="#1f120c"/>`; }
  for (let row = 0; row < 2; row++) {   // two rows of carved marks: shadow side, gilt remains, lit lower edge
    const d = carvedMarks((u, v) => ({ x: 430 + u, y: by + 240 + row * 190 - v * 105 }), L - 560, 91 + row * 7 + (o.seed || 0), 78);
    s += `<path d="${d}" stroke="#7a5a36" stroke-width="15" fill="none" stroke-linecap="round" transform="translate(3,6)" opacity="0.9"/><path d="${d}" stroke="#140a06" stroke-width="13" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#c9963a" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-dasharray="26 34 9 50" transform="translate(1.5,3)" opacity="0.85"/>`;
  }
  for (const x of [200, L - 200]) for (let w = 0; w < 9; w++) { const a0 = Math.PI * 2 * w / 9, a1 = Math.PI * 2 * (w + 1) / 9, R = 170; s += `<path d="M${x},${by + bh / 2} L${n(x + Math.cos(a0) * R)},${n(by + bh / 2 + Math.sin(a0) * R)} Q${n(x + Math.cos((a0 + a1) / 2) * R * 1.16)},${n(by + bh / 2 + Math.sin((a0 + a1) / 2) * R * 1.16)} ${n(x + Math.cos(a1) * R)},${n(by + bh / 2 + Math.sin(a1) * R)} Z" fill="${["#a8322a", "#d9a03a", "#3f6f4a"][w % 3]}" stroke="#140a06" stroke-width="6" stroke-linejoin="round"/>`; }
  const lx = bx + W / (2 * z) + Math.sin(t * 0.8) * 30;
  s += `<rect x="-200" y="-400" width="${L + 400}" height="2600" fill="#2a1a3a" opacity="${n(0.45 - 0.33 * (o.light ?? 1))}" style="mix-blend-mode:multiply"/>` + lightBlobs(lx, by + 220, [360, 640], "#ffb24a", [0.1, 0.06].map((a) => a * (o.light ?? 1)), 5, 0.9);
  return s + `</g>`;
}
// close insert: an old chronicle page. Illegible script, one painted initial, a small pen drawing of a hill. view { y 0..1, zoom }
export function chronicle(view = {}, t = 0, o = {}) {
  const z = view.zoom ?? 1, cy = lerp(700, 1500, clamp(view.y ?? 0));
  let s = `<rect width="${W}" height="${H}" fill="#2a1c18"/><g transform="translate(${W / 2},${H / 2}) scale(${z}) translate(-540,${n(-cy)})">`;
  const edge = Array.from({ length: 40 }, (_, i) => { const u = i / 40, per = u * 4, sd = Math.floor(per), v = per - sd, a = 14, x = sd === 0 ? lerp(70, 1010, v) : sd === 1 ? 1010 : sd === 2 ? lerp(1010, 70, v) : 70, y = sd === 0 ? 120 : sd === 1 ? lerp(120, 2120, v) : sd === 2 ? 2120 : lerp(2120, 120, v); return { x: x + jit(i + 3, a), y: y + jit(i + 9, a) }; });
  s += poly(edge, "#e6cf9a") + poly(edge.map((p) => ({ x: lerp(p.x, 540, 0.05), y: lerp(p.y, 1120, 0.03) })), "#f0dfb2");
  for (let i = 0; i < 30; i++) { const x = 100 + hash(i + 5) * 880, y = 150 + hash(i + 9) * 1900, r = 20 + 90 * hash(i + 2); const a = Array.from({ length: 8 }, (_, j) => ({ x: x + Math.cos(j / 8 * TAU) * r * (0.5 + hash(i * 7 + j)), y: y + Math.sin(j / 8 * TAU) * r * (0.5 + hash(i * 3 + j)) })); s += `<path d="${blob(a)}" fill="${i % 4 ? "#d9bd84" : "#b88a5a"}" opacity="${n(0.18 + 0.2 * hash(i))}"/>`; }
  s += `<rect x="150" y="250" width="170" height="190" fill="#a8282a" stroke="#3a1a12" stroke-width="5"/><path d="M185,345 q50,-92 100,0 q-50,92 -100,0 M235,288 q-62,57 0,114 q62,-57 0,-114" stroke="#f0c040" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="235" cy="345" r="10" fill="#2f6a8a"/><path d="M165,265 q24,10 14,34 M305,425 q-24,-10 -14,-34" stroke="#2f6a8a" stroke-width="6" fill="none"/>`;
  for (let r = 0; r < 24; r++) {
    const y = 300 + r * 70, x0 = r < 3 ? 350 : 150, len = (r === 23 ? 420 : 780 - (r < 3 ? 200 : 0)) + jit(r + 40, 20);
    if (r > 11 && r < 16) continue;
    const d = carvedMarks((u, v) => ({ x: x0 + u, y: y + jit(Math.floor(u / 90) + r * 9, 2) - v * 24 }), len, 300 + r * 3, 19);
    s += `<path d="${d}" stroke="${r === 7 ? "#8a2420" : "#3a2418"}" stroke-width="4.2" fill="none" stroke-linecap="round" opacity="${n(0.7 + 0.25 * hash(r))}"/>`;
  }
  s += `<path d="M190,1380 Q380,1130 540,1180 Q720,1120 900,1380" stroke="#3a2418" stroke-width="4" fill="none"/><path d="M300,1380 Q420,1320 470,1250 Q520,1210 540,1185" stroke="#3a2418" stroke-width="3" fill="none" stroke-dasharray="14 9"/>`;
  for (let i = 0; i < 9; i++) { const x = 300 + i * 26 + jit(i, 5), y = 1372 - i * 15; s += `<path d="M${n(x)},${n(y)} l0,${n(-13 + i * 0.6)} M${n(x - 4)},${n(y - 8)} l8,0" stroke="#3a2418" stroke-width="2.6" stroke-linecap="round"/><circle cx="${n(x)}" cy="${n(y - 17 + i * 0.6)}" r="3.4" fill="#3a2418"/>`; }
  s += `</g><rect width="${W}" height="${H}" fill="#3a1a2a" opacity="0.3" style="mix-blend-mode:multiply"/>` + lightBlobs(540 + Math.sin(t) * 20, 900, [420, 700], "#ffb24a", [0.16, 0.1], 9);
  return s;
}

// ================================================================= 1284: THE GLASS
// A flat window panel, PW x PH panel px (some sets are wider). Everything is a pane: a flat jewel colour with its own seeded
// tint, a lighter hand-cut core (light coming through), a streak or seed bubble, and a lead line of uneven width around it.
// Faces and small detail are painted on the glass in dark trace lines, the way the old glaziers did it.
export const PW = 1080, PH = 1920, LEAD = "#15101c", PAINT = "#2a1418", PIED = { red: "#e8141e", yellow: "#ffe21a", orange: "#ff7a14", crimson: "#b00f2a" };
const LW = 7;
const MOODS = {
  rats: { sky0: "#2f6f52", sky1: "#6f9a3a", sky2: "#c9cf3a", gnd0: "#5f7f3a", gnd1: "#8a9440", wall0: "#b9b84a", wall1: "#8faa5a", wall2: "#d0c070", roof0: "#3f5a3a", roof1: "#5a6a2a", stone0: "#8a9a6a", stone1: "#a8b070", water0: "#2f7a6a", water1: "#4f9a7a", water2: "#b9e0a0", leaf0: "#3f7a3a", leaf1: "#6a9a2a", wood0: "#6a5a2a", wood1: "#8a6f30", win: "#e6e06a", dark: "#1f3a2a", dpA: "#3f7a4a", dpB: "#7fa03a", back: "#e6f08a", rim: "#2f6f52", rim2: "#c9cf3a", cloth: "#a8c8a0" },
  gold: { sky0: "#c2481e", sky1: "#ee8a22", sky2: "#ffc83a", gnd0: "#b85a26", gnd1: "#d98030", wall0: "#f6b23a", wall1: "#e88a2a", wall2: "#ffd27a", roof0: "#8f2a2a", roof1: "#b8402a", stone0: "#d9a05a", stone1: "#eebc6a", water0: "#2a6ab0", water1: "#3f8ad0", water2: "#bfe0ff", leaf0: "#5a8a2a", leaf1: "#8aa82a", wood0: "#8a4a22", wood1: "#a8622a", win: "#fff0a0", dark: "#5a2a2a", dpA: "#c81e34", dpB: "#f29a1e", back: "#fff0b0", rim: "#a8202a", rim2: "#2a4ab0", cloth: "#ffe0a0" },
  brass: { sky0: "#27495f", sky1: "#4f7a72", sky2: "#b8a03a", gnd0: "#4a5a50", gnd1: "#6a7458", wall0: "#a8963a", wall1: "#7f8a5a", wall2: "#c8b45a", roof0: "#2f4050", roof1: "#3f5a5a", stone0: "#7a8a80", stone1: "#98a088", water0: "#2a5a7a", water1: "#3f7a8a", water2: "#b0d0c8", leaf0: "#3f6a5a", leaf1: "#5a8060", wood0: "#5a4a2a", wood1: "#75602e", win: "#d8c860", dark: "#1f2f3a", dpA: "#2f5a6a", dpB: "#8a8a3a", back: "#d8e0c0", rim: "#27495f", rim2: "#b8a03a", cloth: "#c8c8a0" },
  moon: { sky0: "#101a66", sky1: "#1f3fae", sky2: "#3f7fd8", gnd0: "#243a8a", gnd1: "#3558b0", wall0: "#2f4aa8", wall1: "#4268c8", wall2: "#5a86dc", roof0: "#161f5c", roof1: "#24307a", stone0: "#5a66d0", stone1: "#7a88e6", water0: "#1a3a9a", water1: "#2f5fc0", water2: "#a8d0ff", leaf0: "#1f4a7a", leaf1: "#2f6a8a", wood0: "#2a2f6a", wood1: "#3a4288", win: "#ffc23a", dark: "#0c1240", dpA: "#1a2a8a", dpB: "#3f5fc0", back: "#cfe0ff", rim: "#101a66", rim2: "#8ab0f0", cloth: "#a8c0f0" },
  fog: { sky0: "#b8c6e0", sky1: "#dfe6f2", sky2: "#f6f2ea", gnd0: "#a8b2d0", gnd1: "#c4cce0", wall0: "#c0c8e0", wall1: "#aab4d4", wall2: "#e0e2f0", roof0: "#8a94c0", roof1: "#a0a8d0", stone0: "#b4bcd8", stone1: "#ccd2e6", water0: "#9ab8e0", water1: "#b8d0f0", water2: "#f0f8ff", leaf0: "#9ab0b8", leaf1: "#b4c8c4", wood0: "#9a90a8", wood1: "#b0a6ba", win: "#ffe9b0", dark: "#6a70a0", dpA: "#a8b0d8", dpB: "#d8dcf0", back: "#ffffff", rim: "#8a94c0", rim2: "#f6f2ea", cloth: "#e0e4f0" },
  dawn: { sky0: "#7fa8e0", sky1: "#f0b8c8", sky2: "#ffe2a8", gnd0: "#b89ab8", gnd1: "#d8b4c0", wall0: "#eab8a0", wall1: "#d8a0b0", wall2: "#f6d8b8", roof0: "#8a6a9a", roof1: "#a8809a", stone0: "#c8b0c0", stone1: "#e0c8cc", water0: "#7ab0e0", water1: "#a0c8f0", water2: "#fff0e0", leaf0: "#8ab88a", leaf1: "#b4d09a", wood0: "#a07a70", wood1: "#b89080", win: "#fff0c0", dark: "#5a4a80", dpA: "#e8a0b0", dpB: "#ffd8a0", back: "#fff4e0", rim: "#7fa8e0", rim2: "#f0b8c8", cloth: "#fff0e0" },
};
MOODS.river = { ...MOODS.gold, sky0: "#e8862a", sky1: "#ffc23a", sky2: "#fff0a0", water0: "#1a4fc8", water1: "#2f7ce6", water2: "#c8ecff", leaf0: "#3f9a3a", leaf1: "#7ac23a", gnd0: "#a8622a", gnd1: "#c8843a", rim: "#1a4fc8", rim2: "#ffc23a", dark: "#12307a", back: "#fff6d0" };
export const G = {};
// mood("rats") or mood("gold", "brass", 0.4): the glass palette for this frame. Names: rats, gold, river (gold sky, blue water), brass, moon, fog, dawn.
export function mood(a = "gold", b = null, u = 0) {
  const A = MOODS[a], B = b ? MOODS[b] : A;
  for (const k in A) G[k] = b ? mix(A[k], B[k], u) : A[k];
  return G;
}
mood("gold");

let LS = 1;   // px per local unit of the figure being drawn, so lead stays one width in panel px
const lw = (k = 1) => n(LW * k / LS);
const vary = (col, seed, amt = 0.17) => { const r = hash(seed * 1.37 + 5), c = r < 0.5 ? mix(col, "#fff6e0", (0.5 - r) * 2 * amt) : mix(col, "#120a2a", (r - 0.5) * 2 * amt * 0.85); return mix(c, G.back, 0.07 * hash(seed + 9)); };
const P2 = (a) => "M" + a.map((p) => `${n(p[0])},${n(p[1])}`).join(" L") + " Z";
// light through the middle of a pane, a brush streak, now and then a seed bubble
function mottle(a, c, seed) {
  let cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of a) { cx += p[0]; cy += p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  cx /= a.length; cy /= a.length;
  const r = Math.min(x1 - x0, y1 - y0) / 2;
  if (r * LS < 13) return "";
  const k = 0.5 + 0.14 * hash(seed + 2), ox = jit(seed + 3, r * 0.12), oy = jit(seed + 4, r * 0.12);
  let s = "";
  if (hash(seed + 2.5) > 0.22) { const b = []; a.forEach((p, i) => { const q = a[(i + 1) % a.length], kk = k * (0.7 + 0.5 * hash(seed * 3 + i)); b.push({ x: lerp(cx + ox, p[0], kk), y: lerp(cy + oy, p[1], kk) }, { x: lerp(cx + ox, (p[0] + q[0]) / 2, kk * (0.75 + 0.4 * hash(seed * 5 + i))), y: lerp(cy + oy, (p[1] + q[1]) / 2, kk * (0.75 + 0.4 * hash(seed * 7 + i))) }); });
    s += `<path d="${blob(b)}" fill="${mix(c, "#fffbe8", 0.26)}" opacity="0.42"/>`; }
  const an = -0.5 + jit(seed + 5, 0.5), L = r * (0.5 + 0.5 * hash(seed + 6)), sx = cx + jit(seed + 7, r * 0.35), sy = cy + jit(seed + 8, r * 0.35);
  s += `<path d="M${n(sx - Math.cos(an) * L)},${n(sy - Math.sin(an) * L)} Q${n(sx + jit(seed + 10, L * 0.2))},${n(sy + jit(seed + 11, L * 0.2))} ${n(sx + Math.cos(an) * L)},${n(sy + Math.sin(an) * L)}" stroke="${mix(c, "#150a2a", 0.3)}" stroke-width="${lw(0.22)}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  if (hash(seed + 12) > 0.7) s += `<circle cx="${n(cx + jit(seed + 13, r * 0.6))}" cy="${n(cy + jit(seed + 14, r * 0.6))}" r="${n(r * 0.05 + 1.5 / LS)}" fill="none" stroke="#fffbe8" stroke-width="${lw(0.14)}" opacity="0.6"/>`;
  return s;
}
// a polygon pane. pts [[x, y], ...]; o { w lead width factor, amp vertex wobble, v tint range, plain (no mottle), lead colour }
function gp(pts, col, seed = 1, o = {}) {
  const amp = (o.amp ?? 1.8) / LS, w = (o.w ?? 1) * (0.72 + 0.62 * hash(seed * 3.1 + 1));
  const a = pts.map(([x, y], i) => [x + jit(seed * 17 + i, amp), y + jit(seed * 17 + i + 0.5, amp)]), c = o.v === 0 ? col : vary(col, seed, o.v);
  return `<path d="${P2(a)}" fill="${c}" stroke="${o.lead || LEAD}" stroke-width="${lw(w)}" stroke-linejoin="round"/>` + (o.plain ? "" : mottle(a, c, seed));
}
// a curved pane from a path d (local units). o as gp; o.c [x, y, r] puts a light core there
function gd(d, col, seed = 1, o = {}) {
  const c = o.v === 0 ? col : vary(col, seed, o.v), w = (o.w ?? 1) * (0.8 + 0.4 * hash(seed * 3.1 + 1));
  let s = `<path d="${d}" fill="${c}" stroke="${o.lead || LEAD}" stroke-width="${lw(w)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (o.c) { const [x, y, r] = o.c, a = Array.from({ length: 9 }, (_, i) => ({ x: x + Math.cos(i / 9 * TAU) * r * (0.7 + 0.5 * hash(seed * 7 + i)), y: y + Math.sin(i / 9 * TAU) * r * (o.c[3] ?? 1) * (0.7 + 0.5 * hash(seed * 11 + i)) })); s += `<path d="${blob(a)}" fill="${mix(c, "#fffbe8", 0.32)}" opacity="0.5"/>`; }
  return s;
}
// painted trace line on the glass
const pl = (d, w = 0.5, col = PAINT, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
// a field of cut panes in courses. o { cw, ch, seed, col(u, v, id, row, j), skip(cx, cy), deco(cx, cy, w, h, id, row, j), w, v }
function field(x0, y0, x1, y1, o) {
  const R = Math.max(1, Math.round((y1 - y0) / o.ch)), sd = o.seed || 1;
  const ly = (r, x) => y0 + (y1 - y0) * r / R + (r > 0 && r < R ? Math.sin(x * 0.013 + r * 1.9 + sd) * o.ch * 0.1 : 0);
  let s = "", id = 0;
  for (let r = 0; r < R; r++) {
    const xs = [x0]; let x = x0 + o.cw * (o.grid ? 1 : 0.45 + 0.75 * hash(sd * 3 + r * 7.7));
    for (let j = 0; x < x1 - o.cw * 0.35; j++) { xs.push(x); x += o.cw * (o.grid ? 1 : 0.68 + 0.68 * hash(sd * 5 + r * 31 + j)); }
    xs.push(x1);
    for (let j = 0; j < xs.length - 1; j++, id++) {
      const sl = (q, v) => (q === 0 || q === xs.length - 1 ? 0 : jit(sd * 7 + r * 13 + q * 3 + v, o.cw * 0.07));
      const a = [[xs[j] + sl(j, 0), 0], [xs[j + 1] + sl(j + 1, 0), 0], [xs[j + 1] + sl(j + 1, 1), 1], [xs[j] + sl(j, 1), 1]].map(([px, v]) => [px, ly(r + v, px)]);
      const cx = (xs[j] + xs[j + 1]) / 2, cy = (ly(r, cx) + ly(r + 1, cx)) / 2;
      if (o.skip && o.skip(cx, cy)) continue;
      s += gp(a, o.col((cx - x0) / (x1 - x0), (r + 0.5) / R, id, r, j), sd * 101 + id, { w: o.w, v: o.v, amp: o.amp ?? 0.6 });
      if (o.deco) s += o.deco(cx, cy, xs[j + 1] - xs[j], (y1 - y0) / R, id, r, j);
    }
  }
  return s;
}

// ---------------------------------------------------------------- the window: camera, light behind, bars, border
// view { x, y (panel point at screen centre), zoom, roll }. o { light 0..1 (the light behind the glass; 0 = night falls on it),
//   sun [x, y] screen px (where the light comes through strongest), bars (false = no iron saddle bars), w (panel width) }
export function glass(view, inner, t = 0, o = {}) {
  const v = { x: PW / 2, y: PH / 2, zoom: 1, roll: 0, ...view }, li = o.light ?? 1, sun = o.sun || [W * 0.62, H * 0.3];
  let bars = "";
  if (o.bars !== false) for (const y of [478, 962, 1441]) bars += `<path d="M-400,${y} L${(o.w || PW) + 400},${y + 3}" stroke="#0c0812" stroke-width="13"/><path d="M-400,${y - 4} L${(o.w || PW) + 400},${y - 1}" stroke="#3a3040" stroke-width="2" opacity="0.6"/>`;
  const sx = sun[0] + Math.sin(t * 0.5) * 50, sy = sun[1] + Math.cos(t * 0.37) * 40;
  return `<rect width="${W}" height="${H}" fill="#0b0810"/><g transform="translate(${W / 2},${H / 2}) scale(${n(v.zoom * 1000) / 1000}) rotate(${n(v.roll)}) translate(${n(-v.x)},${n(-v.y)})">${inner}${bars}</g>
    <rect width="${W}" height="${H}" filter="url(#hmgrain)" opacity="0.08" style="mix-blend-mode:multiply"/>
    ${lightBlobs(sx, sy, [330, 620, 980], G.back, [0.07 * li, 0.05 * li, 0.035 * li], 77)}
    <rect width="${W}" height="${H}" fill="${mix("#ffffff", "#0a0618", 1 - li)}" style="mix-blend-mode:multiply"/>`;
}
// a border of small panes and pearls round a panel area (the frame of the window light)
export function border(x0, y0, x1, y1, seed = 3, bw = 46) {
  let s = "";
  const run = (ax, ay, bx, by, k) => { const len = Math.hypot(bx - ax, by - ay), N = Math.round(len / 96), hz = ay === by;
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, p = (u) => [lerp(ax, bx, u), lerp(ay, by, u)], a = p(u0), b = p(u1);
      const q = hz ? [[a[0], a[1]], [b[0], b[1]], [b[0], b[1] + bw], [a[0], a[1] + bw]] : [[a[0], a[1]], [a[0] + bw, a[1]], [b[0] + bw, b[1]], [b[0], b[1]]];
      s += gp(q, i % 2 ? G.rim : G.rim2, seed * 31 + k * 97 + i, { amp: 0.8 });
      const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2; s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(9 + 2 * hash(seed + i + k))}" fill="${vary("#f6f0dc", seed + i * 3 + k, 0.1)}" stroke="${LEAD}" stroke-width="4"/>`; } };
  run(x0, y0, x1, y0, 1); run(x0, y1 - bw, x1, y1 - bw, 2); run(x0, y0 + bw, x0, y1 - bw, 3); run(x1 - bw, y0 + bw, x1 - bw, y1 - bw, 4);
  return s;
}
// today -> 1284. u 0..1; from [x, y] = the candle flame on screen. Draw it OVER the picture: the today frame while u < 0.5,
// the glass frame after. 0..0.5 the glow grows in flat hand-cut rings until it fills the frame; 0.5..0.7 lead lines cut the
// gold into panes; 0.65..1 the panes clear one by one (seeded order) and the scene shows through.
export function glowToGlass(u, from = [W / 2, H / 2]) {
  u = clamp(u); if (u <= 0 || u >= 1) return "";
  let s = "";
  if (u < 0.5) {
    const e = ease(u / 0.5, "in"), R = lerp(30, 2500, e);
    [1, 0.72, 0.5, 0.3].forEach((k, j) => { const a = Array.from({ length: 18 }, (_, i) => { const an = i / 18 * TAU, rr = R * k * (1 + jit(j * 31 + i, 0.09)); return { x: from[0] + Math.cos(an) * rr, y: from[1] + Math.sin(an) * rr }; }); s += `<path d="${blob(a)}" fill="${["#ffb23a", "#ffc85a", "#ffe08a", "#fff4c8"][j]}" opacity="${n(clamp(u * 5) * [0.75, 0.85, 0.9, 1][j])}"/>`; });
    return s;
  }
  const lead = clamp((u - 0.5) / 0.18), clear = (u - 0.64) / 0.36, cw = 190, ch = 150, R = Math.ceil((H + 20) / ch);
  const yl = (r, x) => -10 + r * ch + (r > 0 && r < R ? Math.sin(x * 0.013 + r * 1.9) * 14 : 0);
  for (let r = 0; r < R; r++) {
    const xs = [-10]; let x = -10 + cw * (0.45 + 0.75 * hash(23 + r * 7.7));
    while (x < W - 50) { xs.push(x); x += cw * (0.68 + 0.68 * hash(51 + r * 31 + xs.length)); }
    xs.push(W + 10);
    for (let j = 0; j < xs.length - 1; j++) {
      const id = hash(r * 17.3 + j * 5.1 + 2), sl = (q, v) => (q === 0 || q === xs.length - 1 ? 0 : jit(r * 13 + q * 3 + v, 13));
      const a = [[xs[j] + sl(j, 0), 0], [xs[j + 1] + sl(j + 1, 0), 0], [xs[j + 1] + sl(j + 1, 1), 1], [xs[j] + sl(j, 1), 1]].map(([px, v]) => [px, yl(r + v, px)]);
      s += `<path d="${P2(a)}" fill="${["#ffd26a", "#ffe9a0", "#ffb23a", "#fff4c8", "#ffc24a"][Math.floor(id * 5) % 5]}" fill-opacity="${n(clamp((id * 0.75 + 0.25 - clear) * 6))}" stroke="${LEAD}" stroke-width="${n(2 + 7 * lead * (0.7 + 0.6 * id))}" stroke-opacity="${n(lead * clamp((1.25 - clear) * 3))}" stroke-linejoin="round"/>`;
    }
  }
  return s;
}

// ---------------------------------------------------------------- rats: one at a time, never a texture
// rat(x, y, s, o): s = px per unit (a rat is about 30 units nose to rump). o { pose "run"|"sit"|"sniff"|"leap", dir, seed, ph (leg/tail
//   phase), rot deg }
export function rat(x, y, s, o = {}) {
  const dir = o.dir ?? 1, sd = o.seed ?? 1, pose = o.pose || "run", ph = o.ph || 0, sw = Math.sin(ph * TAU);
  const col = vary(pick(["#6a5560", "#7a6250", "#5a5068", "#806a5c", "#4f4656"], sd * 3.3), sd, 0.2), pink = "#e89aa6";
  LS = s; let g = "";
  const tail = (d) => `<path d="${d}" fill="none" stroke="${LEAD}" stroke-width="${n(1.5 + LW * 0.5 / s)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${pink}" stroke-width="1.1" stroke-linecap="round"/>`;
  const leg = (x0, y0, x1, y1) => `<path d="M${n(x0)},${n(y0)} L${n(x1)},${n(y1)}" stroke="${LEAD}" stroke-width="${n(1.6 + LW * 0.4 / s)}" stroke-linecap="round"/><path d="M${n(x0)},${n(y0)} L${n(x1)},${n(y1)}" stroke="${pink}" stroke-width="1.2" stroke-linecap="round"/>`;
  if (pose === "sit") {
    g += tail(`M-5,-1.5 Q-15,2 -19,-3 Q${n(-21 + sw)},-7 ${n(-16 + sw)},-8`);
    g += gd("M-6,0 Q-9.5,-8 -4,-14.5 Q-1,-19.5 4,-18.6 Q9,-17.6 10.2,-13.4 Q12.6,-12.2 13,-10.4 Q10.4,-8.6 7.2,-9.4 Q8.6,-4 5.4,0 Z", col, sd, { c: [0, -8, 4] });
    g += `<circle cx="2.6" cy="-18.6" r="2.7" fill="${pink}" stroke="${LEAD}" stroke-width="${lw(0.45)}"/>`;
    g += pl("M7.4,-13.6 l0.1,0", 1.9, "#fff0b0") + pl("M7.6,-13.6 l0.1,0", 0.9, "#0a0610") + `<circle cx="13" cy="-10.5" r="0.9" fill="${pink}"/>`;
    g += pl("M11.6,-10.6 L17,-13 M11.6,-10.2 L17.4,-10 M11.4,-9.8 L16.4,-7.4", 0.22, PAINT, 0.9);
    g += leg(5.6, -9.4, 8.6, -7.6 + sw * 0.4) + leg(4, -8.6, 7, -6.2) + leg(2, -0.4, 6.6, 0.2);
    g += pl("M-5,-8 q1.4,-1 1.8,-3 M-2.4,-4.6 q1.6,-0.6 2.2,-2.4 M1,-12.4 q1.4,0.4 2.2,-0.6", 0.3, mix(col, "#fff", 0.4));
  } else {
    const leap = pose === "leap", st = 1 + 0.07 * sw;
    g += tail(leap ? `M-10,-3 Q-19,-5 -27,${n(-4 + sw * 2)} Q-31,-3.5 -34,${n(-6 - sw * 2)}` : `M-10,-2.5 Q-18,${n(-3 + sw * 2)} -23,${n(-7 - sw)} Q-27,${n(-10 + sw * 2)} -33,${n(-7 + sw * 2)}`);
    if (leap) g += leg(9, -1.5, 16.5, 2.4) + leg(7, -1, 13.6, 3.4) + leg(-6, -1, -14, 2) + leg(-4.6, -0.6, -11.6, 3.4);
    else g += leg(8, -1.2, 9 + sw * 3.6, 1.8) + leg(6.2, -1, 6.4 - sw * 3.2, 1.8) + leg(-6, -1.2, -7 - sw * 3.6, 1.8) + leg(-4, -1, -3.6 + sw * 3.2, 1.8);
    const up = pose === "sniff" ? -2.4 : 0;
    g += `<g transform="scale(${n(st)},1)">` + gd(`M-10,-2 Q-10,-9.4 -1,-10 Q7,-10 12,${n(-6.4 + up)} Q16,${n(-5.4 + up)} 19.4,${n(-2.6 + up)} Q16,${n(-0.2 + up * 0.6)} 12,-0.8 Q4,0.4 -6,0.2 Q-10,0.2 -10,-2 Z`, col, sd, { c: [-1, -5, 4, 0.5] });
    g += `<circle cx="10.4" cy="${n(-8.8 + up)}" r="2.7" fill="${pink}" stroke="${LEAD}" stroke-width="${lw(0.45)}"/>`;
    g += pl(`M14.6,${n(-4.6 + up)} l0.1,0`, 1.9, "#fff0b0") + pl(`M14.8,${n(-4.6 + up)} l0.1,0`, 0.9, "#0a0610") + `<circle cx="19.4" cy="${n(-2.7 + up)}" r="0.9" fill="${pink}"/>`;
    g += pl(`M17.6,${n(-2.8 + up)} L23,${n(-5.6 + up)} M17.6,${n(-2.4 + up)} L23.6,${n(-2.4 + up)} M17.4,${n(-2 + up)} L22.6,${n(0.4 + up)}`, 0.22, PAINT, 0.9);
    g += pl("M-6.6,-6 q1.6,-1.6 3.6,-1.8 M-1.6,-7.6 q1.8,-0.8 3.8,-0.2 M-7.4,-3 q1.4,-0.8 2.8,-0.6 M2,-4.4 q1.6,-0.6 3,0", 0.3, mix(col, "#fff", 0.4)) + `</g>`;
  }
  LS = 1;
  return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(o.rot || 0)}) scale(${n(dir * s * 100) / 100},${n(s * 100) / 100})">${g}</g>`;
}
// a swarm inside a box, each rat placed by seed, scurrying in stop-and-go bursts, drawn back to front.
// o { n, seed, box [x0, y0, x1, y1], t, flow [vx, vy] px/s, size [far, near] (px per unit at the top / bottom of the box),
//     sit 0..1 (share that sits), amount 0..1 (how many have arrived) }
export function ratSwarm(o) {
  const [x0, y0, x1, y1] = o.box, sd = o.seed || 1, t = o.t || 0, [vx, vy] = o.flow || [120, 0], w = x1 - x0, h = y1 - y0, list = [];
  const N = Math.round(o.n * (o.amount ?? 1));
  for (let i = 0; i < N; i++) {
    const sit = hash(sd * 7 + i * 3.3) < (o.sit ?? 0.15), sp = 0.6 + 0.8 * hash(sd + i * 5.1), f = 0.7 + 0.9 * hash(sd * 3 + i), p = t * f + hash(sd * 9 + i) * 9;
    const go = sit ? 0 : Math.floor(p) + ease(clamp((p % 1) * 1.7)), moving = !sit && (p % 1) < 0.59;
    const x = x0 + ((hash(sd * 11 + i * 1.7) * w + vx * sp * go / f) % w + w) % w, yy = ((hash(sd * 13 + i * 2.9) * h + vy * sp * go / f) % h + h) % h;
    const dir = sit ? (hash(i + sd) > 0.5 ? 1 : -1) : (vx >= 0 ? 1 : -1) * (hash(sd * 17 + i + Math.floor(p)) > 0.12 ? 1 : -1);
    list.push({ x, y: y0 + yy, s: lerp(o.size?.[0] ?? 1.6, o.size?.[1] ?? 2.6, yy / h), o: { pose: sit ? "sit" : moving ? "run" : "sniff", dir, seed: sd * 31 + i, ph: sit ? t * 0.7 + i : p * 3.2, rot: sit || !vy ? 0 : Math.atan2(vy, Math.abs(vx)) * 57.3 * dir * 0.6 } });
  }
  return list.sort((a, b) => a.y - b.y).map((r) => rat(r.x, r.y, r.s, r.o)).join("");
}
// rats running nose to tail along a path [[x, y, s], ...] (for the river of rats behind the piper)
export function ratStream(o) {
  const pth = o.path, sd = o.seed || 1, t = o.t || 0, list = [], N = Math.round(o.n * (o.amount ?? 1));
  for (let i = 0; i < N; i++) {
    const u = (hash(sd * 3 + i * 1.3) + t * (o.speed ?? 0.12) * (0.8 + 0.4 * hash(sd + i))) % 1, f = u * (pth.length - 1), k = Math.min(pth.length - 2, Math.floor(f)), a = pth[k], b = pth[k + 1], v = f - k;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, off = jit(sd * 7 + i, o.width ?? 60), s = lerp(a[2], b[2], v);
    list.push({ x: lerp(a[0], b[0], v) + nx * off, y: lerp(a[1], b[1], v) + ny * off * 0.5, s, o: { pose: "run", dir: b[0] >= a[0] ? 1 : -1, seed: sd * 31 + i, ph: t * 3.4 + i * 0.37, rot: Math.atan2(b[1] - a[1], Math.abs(b[0] - a[0])) * 57.3 * (b[0] >= a[0] ? 1 : -1) * 0.7 } });
  }
  return list.sort((a, b) => a.y - b.y).map((r) => rat(r.x, r.y, r.s, r.o)).join("");
}
// a splash: a crown of drop panes and two rings. u 0..1 life
export function splash(x, y, s, u, seed = 1) {
  if (u <= 0 || u >= 1) return "";
  let g = "", sv = LS; LS = 1;
  for (let r = 0; r < 2; r++) { const rr = s * (0.5 + r * 0.6) * (0.3 + u * 1.4); g += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rr)}" ry="${n(rr * 0.26)}" fill="none" stroke="${LEAD}" stroke-width="${n(LW * 0.9)}" opacity="${n(1 - u)}"/><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rr)}" ry="${n(rr * 0.26)}" fill="none" stroke="${G.water2}" stroke-width="${n(LW * 0.35)}" opacity="${n(1 - u)}"/>`; }
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.12 + 0.76 * (i + 0.5) / 7) + jit(seed + i, 0.1), v = s * (1.1 + 0.6 * hash(seed * 3 + i)), dx = Math.cos(a) * v * u, dy = Math.sin(a) * v * u * 1.5 + s * 2.2 * u * u, r = s * (0.13 + 0.09 * hash(seed + i * 5)) * (1 - u * 0.5);
    g += `<path d="M${n(x + dx)},${n(y + dy - r * 1.6)} Q${n(x + dx + r)},${n(y + dy)} ${n(x + dx)},${n(y + dy + r)} Q${n(x + dx - r)},${n(y + dy)} ${n(x + dx)},${n(y + dy - r * 1.6)} Z" fill="${i % 3 ? "#ffffff" : G.water2}" stroke="${LEAD}" stroke-width="${n(LW * 0.45)}"/>`; }
  LS = sv; return g;
}

// ---------------------------------------------------------------- glass figures (cm, feet at 0, up = -y; st.s = px per cm)
const ik = (ax, ay, bx, by, L1, L2, sgn) => { let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6; const D = Math.min(d, L1 + L2 - 0.01); dx *= D / d; dy *= D / d; const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)); return [ax + dx * a / D - sgn * dy * h / D, ay + dy * a / D + sgn * dx * h / D, ax + dx, ay + dy]; };
// a tapered limb segment as its own pane
const seg = (ax, ay, bx, by, wa, wb, col, seed, o = {}) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; return gp([[ax + nx * wa, ay + ny * wa], [bx + nx * wb, by + ny * wb], [bx - nx * wb, by - ny * wb], [ax - nx * wa, ay - ny * wa]], col, seed, { amp: 0.4, w: 0.8, ...o }); };
// a painted almond eye: pale glass, a small iris, a smaller pupil, a heavy upper lid
function gEye(cx, cy, w, h, look, open, iris = "#c79a1e", pupil = 0.36) {
  if (open < 0.22) return pl(`M${n(cx - w)},${n(cy)} Q${n(cx)},${n(cy + h * 0.7)} ${n(cx + w)},${n(cy - 0.2)}`, 0.5);
  const hh = h * open, id = `g${UID++}`, d = `M${n(cx - w)},${n(cy + 0.25)} Q${n(cx - w * 0.15)},${n(cy - hh * 1.55)} ${n(cx + w)},${n(cy - 0.35)} Q${n(cx + w * 0.1)},${n(cy + hh * 1.05)} ${n(cx - w)},${n(cy + 0.25)} Z`;
  const ix = cx + look * w * 0.42, ir = Math.min(h * 0.95, w * 0.42);
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="#fdf7e6"/><g clip-path="url(#${id})"><circle cx="${n(ix)}" cy="${n(cy - hh * 0.2)}" r="${n(ir)}" fill="${iris}" stroke="${PAINT}" stroke-width="0.22"/><circle cx="${n(ix)}" cy="${n(cy - hh * 0.2)}" r="${n(ir * pupil)}" fill="#0a0610"/><circle cx="${n(ix + ir * 0.4)}" cy="${n(cy - hh * 0.2 - ir * 0.4)}" r="${n(ir * 0.2)}" fill="#fff"/></g>` +
    pl(`M${n(cx - w - 0.5)},${n(cy + 0.5)} Q${n(cx - w * 0.15)},${n(cy - hh * 1.6)} ${n(cx + w)},${n(cy - 0.35)} l1,-0.6`, 0.62) + pl(`M${n(cx - w * 0.7)},${n(cy + hh * 0.55)} Q${n(cx + w * 0.1)},${n(cy + hh * 1.08)} ${n(cx + w * 0.8)},${n(cy + 0.1)}`, 0.24);
}

// THE PIPER: a tall, long-limbed man in a pied coat (red and yellow panes: the loudest colour in the film), a feathered
// hat, a wooden pipe. He faces +x (dir -1 flips him).
// st: { x, y, s, dir, handF [x, y], handB [x, y] (hand targets, cm), pipe 0 in the back hand .. 1 at the lips, finger 0..1 (one
//   finger up), palm 0..1 (open hand offered), coin (true: a coin between finger and thumb), turn 0 front | 1 walking away,
//   walk phase (null = standing), look -1..1, blink 0..1, smile -1..1, tilt deg (head), lean deg, sway (coat, feather), play
//   0..1 (cheeks and fingers working), shadow { len cm, ang deg (0 = to the right, 90 = toward the viewer), col } }
export const PIPER = {
  stand: { handF: [17, -103], handB: [-16, -102], pipe: 0, finger: 0, palm: 0, turn: 0, tilt: 0, lean: 0, smile: 0 },
  walk: { handF: [19, -106], handB: [-17, -104], pipe: 0, finger: 0, palm: 0, turn: 0, tilt: 0, lean: 3, smile: 0 },
  play: { handF: [27, -165], handB: [17, -173], pipe: 1, finger: 0, palm: 0, turn: 0, tilt: 4, lean: 2, smile: 0 },
  offer: { handF: [47, -126], handB: [-16, -102], pipe: 0, finger: 0, palm: 1, turn: 0, tilt: -3, lean: 4, smile: 0.5 },
  finger: { handF: [25, -186], handB: [-16, -102], pipe: 0, finger: 1, palm: 0, turn: 0, tilt: -2, lean: 0, smile: 0.2 },
  away: { handF: [16, -103], handB: [-17, -102], pipe: 0, finger: 0, palm: 0, turn: 1, tilt: 0, lean: 2, smile: 0 },
};
export function piperPose(a, b, u) {
  const A = PIPER[a] || a, B = PIPER[b] || b, o = {}; u = clamp(u);
  for (const k in PIPER.stand) o[k] = Array.isArray(A[k]) ? A[k].map((v, i) => lerp(v, B[k][i], u)) : k === "turn" ? (u < 0.5 ? A[k] : B[k]) : lerp(A[k] ?? 0, B[k] ?? 0, u);
  return o;
}
export function piper(st, t = 0) {
  const s = st.s ?? 3, dir = st.dir ?? 1, P0 = { ...PIPER.stand, ...st }, back = P0.turn > 0.5, R = PIED.red, Y = PIED.yellow, skin = "#f4dcc2";
  const w = st.walk, sw = w == null ? 0 : Math.sin(w * TAU), cw_ = w == null ? 0 : Math.cos(w * TAU), bob = w == null ? 0 : Math.abs(cw_) * 2.2, sway = (st.sway ?? Math.sin(t * 1.3)) + sw * 1.5;
  LS = s; let g = "";
  // long shadow: three dark panes laid out from the feet
  let sh = "";
  if (st.shadow) { const L = st.shadow.len ?? 300, a = (st.shadow.ang ?? 20) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a) * 0.45, nx = -uy, ny = ux, col = st.shadow.col || G.dark;
    const at = (u, wd) => [ux * L * u + nx * wd, uy * L * u + ny * wd * 0.5];
    [[0, 0.3, 9, 13], [0.3, 0.62, 13, 15], [0.62, 0.82, 15, 9], [0.82, 1, 9, 0.5]].forEach(([u0, u1, w0, w1], i) => { sh += gp([at(u0, w0), at(u1, w1), at(u1, -w1), at(u0, -w0)], col, 900 + i, { amp: 0.5, w: 0.7 }); }); }
  // legs: mi-parti hose, pointed shoes
  const hipY = -96, legs = [[-5.5, 0, R, Y, 11], [5.5, 0.5, Y, R, 12]].map(([hx, off, c1, c2, sd]) => {
    const ph = w == null ? 0 : Math.sin((w + off) * TAU), lift = w == null ? 0 : Math.max(0, Math.cos((w + off) * TAU)) * 7, fx = hx + ph * 21;
    const [kx, ky, ax, ay] = ik(hx, hipY, fx, -3 - lift, 47.5, 47.5, -1);
    return seg(hx, hipY, kx, ky, 4.6, 3.6, c1, sd) + seg(kx, ky, ax, ay, 3.5, 2.5, c1, sd + 5) +
      `<g transform="translate(${n(ax)},${n(ay)}) rotate(${n(lift * 3)})">${gd("M-3.4,-3 L3,-3.6 Q11,-2.6 17.5,2.2 Q8,3.6 -3.4,3 Z", c2, sd + 9, { w: 0.8 })}</g>`;
  });
  g += back ? legs[1] + legs[0] : legs[0] + legs[1];
  // arms: shoulder, elbow, hand
  const hF = P0.handF, hB = P0.handB, shF = [12.5, -165], shB = [-12.5, -165];
  const arm = (sh_, h, c1, c2, sd, sgn) => { const [ex, ey, hx, hy] = ik(sh_[0], sh_[1], h[0], h[1], 27.5, 27.5, sgn); return { svg: seg(sh_[0], sh_[1], ex, ey, 4.4, 3.5, c1, sd) + seg(ex, ey, hx, hy, 3.4, 2.5, c2, sd + 3), hx, hy, ex, ey }; };
  const aF = arm(shF, [hF[0] + (st.pump || 0), hF[1]], R, Y, 21, hF[1] < -150 ? 1 : -1), aB = arm(shB, hB, Y, R, 31, hB[0] > 0 ? 1 : 1);
  const hand = (a, kind) => { const ang = Math.atan2(a.hy - a.ey, a.hx - a.ex) * 57.3;
    let h = `<g transform="translate(${n(a.hx)},${n(a.hy)}) rotate(${n(ang)})">`;
    if (kind === "finger") h += (st.coin ? gcoinLocal(14.6, -3.4, 3.3) + gd("M3,-2.2 Q8,-6 12.6,-5.2 Q12.4,-3.2 6,-1.4 Z", skin, 46, { w: 0.5, plain: 1 }) : "") + gd("M-1,-2.6 L4.4,-2.4 Q6.4,-1.4 6.2,1 Q5,3 2,3 L-1,2.6 Z", skin, 41, { w: 0.6 }) + gd("M3,-2.2 L12.6,-1.5 Q13.6,-0.7 12.6,0.2 L4,0.4 Z", skin, 42, { w: 0.6 }) + pl("M4.6,0.6 q1.6,0.4 1.4,2 M3.2,1 q1.4,0.6 1,2.2 M9,-1.6 l0,1.6", 0.3);
    else if (kind === "palm") h += gd("M-1,-2.4 Q4,-3.4 8,-2.6 L15,-1.6 Q16,-0.6 15,0.4 L8.6,1.2 Q5,3.4 -1,2.6 Z", skin, 43, { w: 0.6 }) + gd("M2.6,-2.8 Q4,-6.4 6.6,-6 Q7,-4.4 5.6,-2.6 Z", skin, 44, { w: 0.5 }) + pl("M8.6,-1.4 L14,-0.6 M8.8,-0.2 L14.4,0 M3,0 Q5.6,1.4 8,0.2", 0.3);
    else h += gd("M-1,-2.6 L3.6,-2.8 Q6.6,-1.6 6.4,1 Q5.4,3.2 2,3.2 L-1,2.6 Z", skin, 45, { w: 0.6 }) + pl("M2.6,-1.6 q1.6,0.2 2.2,1.2 M2.4,0 q1.6,0 2.4,0.8 M2.2,1.5 q1.2,0 2,0.4", 0.3);
    return h + `</g>`; };
  // the coat: a clipped patchwork of red and yellow lozenges, every seam a lead line; dagged hem
  const hem = []; for (let i = 0; i <= 10; i++) hem.push([21 - i * 4.2 + sway * 1.2 * (i < 5 ? 1 : 0.6), i % 2 ? -73 + jit(i + 3, 1.2) : -82]);
  const coat = [[-13, -171], [13, -171], [15.4, -150], [11.4, -128], ...hem, [-11.4, -128], [-15.4, -150]];
  const cid = `g${UID++}`, cd = P2(coat);
  let patch = "";
  const lat = (m, r) => [m * 5.2 + jit(m * 31 + r * 17 + (back ? 9 : 0), 1.1), -180 + r * 6.6 + jit(m * 13 + r * 29, 1.1)];
  for (let r = 0; r < 17; r++) for (let m = -5; m <= 5; m++) {
    if ((m + r) % 2 === 0) continue;
    const id = m * 7 + r * 53 + (back ? 400 : 0), h = hash(id), col = h > 0.9 ? PIED.orange : h < 0.07 ? PIED.crimson : (((m + r + 99) >> 1) % 2 ? R : Y);
    patch += gp([lat(m, r - 1), lat(m + 1, r), lat(m, r + 1), lat(m - 1, r)], col, id, { amp: 0, w: 0.55, v: 0.1 });
  }
  const torso = `<clipPath id="${cid}"><path d="${cd}"/></clipPath><g clip-path="url(#${cid})"><path d="${cd}" fill="${R}"/>${patch}</g><path d="${cd}" fill="none" stroke="${LEAD}" stroke-width="${lw(1.1)}" stroke-linejoin="round"/>` +
    gp([[-12, -131], [12, -131], [11.6, -125.6], [-11.6, -125.6]], "#1c2f6e", 51, { amp: 0.3, w: 0.6 }) + (back ? "" : gp([[-2, -131.6], [2, -131.6], [2, -125], [-2, -125]], "#ffc21a", 52, { amp: 0.2, w: 0.5, plain: 1 }) + gd("M5,-125.6 L11,-125.6 L11.6,-116 Q8,-113.6 4.4,-116 Z", "#7a4a22", 53, { w: 0.6 }));
  // the dagged shoulder cape, half red, half yellow
  const c1 = back ? R : Y, c2 = back ? Y : R;
  const cape = gd("M-17.6,-171 Q-13,-174 -9,-175 L-9,-156.6 L-14,-151 L-20.4,-157 Z", c1, 61, { w: 0.8 }) + gd("M-9,-175 Q-4,-175.6 0,-175.4 L0.6,-156 L-4,-150.6 L-9,-156.6 Z", c2, 62, { w: 0.8 }) + gd("M0,-175.4 Q5,-175.8 9,-175 L9,-156.6 L4,-150.6 L0.6,-156 Z", c1, 63, { w: 0.8 }) + gd("M9,-175 Q13,-174 17.6,-171 L20.4,-157 L14,-151 L9,-156.6 Z", c2, 64, { w: 0.8 }) +
    pl("M-14.6,-170 q-1.4,7 -1,13 M-5,-173 q-0.6,8 0.4,15 M5,-173 q0.8,8 -0.2,15 M14.6,-170 q1.4,7 1.6,12", 0.3, PAINT, 0.5);
  // the head
  let head = gd("M-3.4,-172 L3.6,-172 L3.2,-180 L-3,-180 Z", skin, 70, { w: 0.6, plain: 1 });
  const hairD = "M-7.6,-204 Q-12.6,-192 -10.6,-171 L-3.6,-171.6 Q-6.4,-184 -5.6,-197 Z";
  const feather = (() => { const fs = sway * 1.4; let f = gd(`M-5.4,-207 Q-12,${n(-226 + fs)} ${n(-35 + fs)},${n(-246 + fs)} Q${n(-21 + fs)},${n(-225 + fs)} -8.6,-206 Z`, "#fbf5e2", 80, { w: 0.6 });
    for (let i = 0; i < 13; i++) { const u = 0.1 + i * 0.066, x = lerp(-7, -33 + fs, u ** 1.15), y = lerp(-207, -244 + fs, u ** 0.8), L = (3.6 - 2.2 * u) * (0.8 + 0.4 * hash(i + 80)); f += pl(`M${n(x)},${n(y)} l${n(-L * 0.9)},${n(-L * 0.2)} M${n(x)},${n(y)} l${n(L * 0.5)},${n(L * 0.9)}`, i % 4 === 2 ? 0.75 : 0.26, i % 4 === 2 ? "#3a1c12" : PAINT); }
    return f + pl(`M-6.6,-206 Q-13,${n(-225 + fs)} ${n(-34 + fs)},${n(-245 + fs)}`, 0.4); })();
  const hat = gd("M-9,-200.6 Q-7.6,-215 -17.6,-225 Q-1,-222.6 9.6,-201.6 Z", R, 81, { w: 0.9, c: [-4, -210, 4] }) + pl("M-8,-206 Q0,-209.6 10,-205.6", 1.5, Y) + pl("M-8,-207.2 Q0,-210.8 10.2,-206.8 M-8,-204.8 Q0,-208.4 9.6,-204.4", 0.3) +
    gd(back ? "M-12.6,-199 Q0,-205.6 13,-199.6 Q4,-195.6 -12.6,-195 Z" : "M-11.6,-199.4 Q0,-204.8 11.6,-200.6 L19.6,-196.4 Q5,-195.6 -11.6,-195.6 Z", Y, 82, { w: 0.9 });
  if (back) {
    head += gd("M-9,-200 Q-11.6,-186 -10,-172 Q0,-168.6 10,-172 Q11.6,-186 9,-200 Q0,-205 -9,-200 Z", "#3a1c14", 71, { w: 0.8 });
    for (let i = 0; i < 9; i++) { const x = -8 + i * 2 + jit(i + 5, 0.5); head += pl(`M${n(x)},-198 Q${n(x + jit(i, 1.4))},-186 ${n(x + jit(i + 20, 1))},${n(-172 - hash(i) * 2)}`, 0.3, "#8a5a36", 0.9); }
  } else {
    const look = st.look ?? 0.25, open = 1 - (st.blink || 0), sm = P0.smile || 0, puff = (st.play || 0) * (P0.pipe > 0.6 ? 1 : 0);
    head += gd(hairD, "#3a1c14", 71, { w: 0.7 });
    head += gd(`M-6.6,-200 Q-8.2,-190 -5.6,-183 Q-2,-176.4 3.6,-175.2 Q8,-176.4 9.8,-183 Q${n(11.4 + puff * 0.8)},-188 10.8,-193 Q10.2,-200 6,-203.4 Q0,-205.4 -6.6,-200 Z`, skin, 72, { w: 0.9, c: [1, -190, 5.5, 1.3], v: 0.05 });
    for (let i = 0; i < 6; i++) { const x = -7.4 + i * 0.75; head += pl(`M${n(x + 0.6)},-202 Q${n(x - 1.4 + jit(i, 0.6))},-190 ${n(x - 1 + jit(i + 9, 0.8))},${n(-174 - hash(i) * 3)}`, 0.28, "#8a5a36", 0.9); }
    head += pl("M-5.6,-200.4 Q-2,-202.6 1.6,-200.6 M-4.6,-199 Q-3,-196.4 -5.4,-193.6", 0.3, "#3a1c14");
    head += gEye(-0.6, -191.6, 3.2, 1.5, look, open) + gEye(6.9, -191.8, 2.3, 1.4, look, open);
    head += pl(`M-4.6,${n(-195.6 - sm * 0.3)} Q-0.6,-197.6 3,-195.6 M5,-195.6 Q7.4,-197.2 9.8,${n(-195.9 - sm * 0.3)}`, 0.55);
    head += pl("M3.9,-194 L4.9,-186.2 Q5.9,-184.6 3.7,-184.3 M2.6,-184.8 q0.6,0.7 1.4,0.5", 0.45);
    head += P0.pipe > 0.6 ? pl("M2.4,-180.6 Q4.6,-181.6 6.6,-180.8 M2.6,-179.4 Q4.6,-178.4 6.4,-179.6", 0.45, "#7a2a26")
      : pl(`M0.8,${n(-180.7 - sm * 0.7)} Q3.8,${n(-179.6 + sm * 0.5)} 7,${n(-181 - sm * 0.8)}`, 0.5, "#7a2a26") + pl("M2.6,-178.6 Q4,-178.1 5.4,-178.7", 0.28);
    head += pl("M-4.6,-188 l1.6,3 M-3.4,-188.6 l1.6,3 M-2.2,-189 l1.4,2.6 M8.6,-188.6 l-0.8,2.4", 0.22, PAINT, 0.65) + pl("M-3.6,-189.6 Q-0.6,-188.6 2,-189.8 M5.6,-189.9 Q7.2,-189 8.8,-190", 0.2, PAINT, 0.7) + pl("M0,-176.6 Q3.6,-174.6 6.6,-176.8", 0.22, PAINT, 0.6);
  }
  head = `<g transform="rotate(${n(P0.tilt || 0)} 0 -176)">${head}${hat}${feather}</g>`;
  // the pipe: turned wood, two brass rings, finger holes
  const pu = clamp(P0.pipe), m0 = [7.4, -180.4], m1 = [38, -152], h0 = [hB[0], hB[1] + 1], h1 = [hB[0] - 5, hB[1] + 45];
  const pa = [lerp(h0[0], m0[0], pu), lerp(h0[1], m0[1], pu)], pb = [lerp(h1[0], m1[0], pu), lerp(h1[1], m1[1], pu)];
  const pang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 57.3, pipe = `<g transform="translate(${n(pa[0])},${n(pa[1])}) rotate(${n(pang)})">${gd("M0,-0.9 L38,-1.5 L42.6,-3 L43,3 L38,1.5 L0,0.9 Z", "#b8762e", 90, { w: 0.6, v: 0.06 })}${pl("M9,-1.2 L9,1.2 M30,-1.5 L30,1.5", 0.9, "#ffd24a")}${pl("M14,0 l0.1,0 M18,0 l0.1,0 M22,0 l0.1,0 M26,0 l0.1,0 M34,0 l0.1,0", 0.9)}</g>`;
  const kindF = P0.finger > 0.5 ? "finger" : P0.palm > 0.5 ? "palm" : "fist";
  const bFront = hB[0] > -6 && !back;
  const body = (bFront ? "" : aB.svg + hand(aB, "fist")) + (pu < 0.5 ? pipe : "") + torso + cape + head + (bFront ? aB.svg : "") + (pu >= 0.5 ? pipe : "") + (bFront ? hand(aB, "fist") : "") + aF.svg + hand(aF, kindF);
  LS = 1;
  return `<g transform="translate(${n(st.x)},${n(st.y)}) scale(${n(dir * s * 1000) / 1000},${n(s * 1000) / 1000})">${sh}<g transform="translate(0,${n(-bob)}) rotate(${n(P0.lean || 0)})">${g}${body}</g></g>`;
}
const gcoinLocal = (x, y, r, flip = 0) => `<g transform="translate(${n(x)},${n(y)}) scale(1,${n(Math.max(0.15, Math.abs(Math.cos(flip * TAU))))})"><circle r="${r}" fill="#ffb81a" stroke="${LEAD}" stroke-width="${lw(0.6)}"/><circle r="${n(r * 0.68)}" fill="none" stroke="#8a4a10" stroke-width="${n(r * 0.09)}"/><path d="M${n(-r * 0.4)},0 L${n(r * 0.4)},0 M0,${n(-r * 0.4)} L0,${n(r * 0.4)}" stroke="#8a4a10" stroke-width="${n(r * 0.13)}" stroke-linecap="round"/><path d="M${n(-r * 0.7)},${n(-r * 0.45)} Q${n(-r * 0.3)},${n(-r * 0.85)} ${n(r * 0.3)},${n(-r * 0.75)}" stroke="#fff6c8" stroke-width="${n(r * 0.1)}" fill="none" stroke-linecap="round"/></g>`;
// a glass coin in the panel (the mayor's three). o { r px, flip 0..1 turns }
export function gcoin(x, y, o = {}) { LS = 1; return gcoinLocal(x, y, o.r ?? 16, o.flip || 0); }

// THE MAYOR: round, pompous, fur-trimmed violet robe, a gold chain of office. Faces +x.
// st: { x, y, s, dir, shake 0..1 (front arm out), pump cm (hand shake offset), laugh 0..1, drop 0..1 (hand tipped, palm down),
//   talk 0..1, blink, look, tilt deg }
export function mayor(st, t = 0) {
  const s = st.s ?? 3, dir = st.dir ?? 1, la = st.laugh || 0, robe = "#5a2ab0", robe2 = "#7a3fd6", fur = "#f8f0dc", skin = "#f7d0b6", gold = "#ffc21a";
  const bounce = la * Math.sin(t * 15) * 1.2, sh = st.shake || 0, dr = st.drop || 0;
  LS = s; let g = "";
  const ermine = (pts) => pts.map(([x, y]) => pl(`M${n(x)},${n(y)} l0,2.2 M${n(x - 0.7)},${n(y + 2.6)} l0.7,-0.8 l0.7,0.8`, 0.5, "#1a1018")).join("");
  g += gd("M-9,-2 L-20,-2 Q-21,3 -15,3.4 L-8,3 Z", "#3a1a5a", 100, { w: 0.6 }) + gd("M9,-2 L20,-2 Q22,3 16,3.4 L8,3 Z", "#3a1a5a", 101, { w: 0.6 });
  g += `<g transform="translate(0,${n(bounce)})">`;
  g += gd("M-22,-112 Q-46,-70 -43,-13 L-10,-13 L-7.4,-114 Z", robe, 102, { c: [-25, -62, 11, 1.8] }) + gd("M22,-112 Q46,-70 43,-13 L10,-13 L7.4,-114 Z", robe2, 103, { c: [25, -62, 11, 1.8] });
  g += pl("M-30,-88 Q-36,-50 -35,-16 M-18,-96 Q-21,-50 -20,-16 M30,-88 Q36,-50 35,-16 M19,-96 Q22,-50 21,-16", 0.5, "#2a1060", 0.8);
  g += gd("M-7.4,-114 L7.4,-114 L10,-13 L-10,-13 Z", fur, 104, { w: 0.8 }) + ermine([[-3, -84], [3.4, -70], [-3.6, -55], [3.6, -41], [-3, -27], [2, -99]]);
  g += gd("M-44,-14 Q0,-8 44,-14 L43,-2 Q0,3 -43,-2 Z", fur, 105, { w: 0.8 }) + ermine([[-34, -11], [-22, -9.4], [-9, -8.4], [5, -8.4], [18, -9], [31, -10.6]]);
  // arms: wide sleeves, fur cuffs
  const aim = (rest, out, u) => [lerp(rest[0], out[0], u), lerp(rest[1], out[1], u)];
  const hf = aim(aim([14, -68], [50 + (st.pump || 0), -90 + Math.abs(st.pump || 0) * 0.5], sh), [46, -98], dr), hb = [-15, -67 - la * 6];
  const arm = (sx, sy, h, col, sd, sgn) => { const [ex, ey, hx, hy] = ik(sx, sy, h[0], h[1], 25, 24, sgn), ang = Math.atan2(hy - ey, hx - ex) * 57.3;
    return seg(sx, sy, ex, ey, 9, 8, col, sd) + seg(ex, ey, lerp(ex, hx, 0.78), lerp(ey, hy, 0.78), 8, 9.6, col, sd + 1) + `<g transform="translate(${n(hx)},${n(hy)}) rotate(${n(ang + dr * 50 * (sgn < 0 ? 1 : 0))})">${gd("M-6.4,-7 L-1.6,-7.6 L-1.6,7.6 L-6.4,7 Z", fur, sd + 2, { w: 0.6, plain: 1 })}${gd("M-1.6,-4 Q4,-5.4 7,-2.6 Q8.4,0.6 6.4,3.6 Q2,5 -1.6,4 Z", skin, sd + 3, { w: 0.6 })}${pl("M3,-2.6 q2,0.4 2.6,1.6 M3,-0.4 q2,0.2 3,1 M2.6,1.8 q1.6,0 2.6,0.4", 0.35)}</g>`; };
  const armB = arm(-24, -104, hb, robe, 110, 1), armF = arm(24, -104, hf, robe2, 114, -1);
  g += armB;
  g += gd("M-29,-106 Q0,-90 29,-106 Q24,-124 0,-126 Q-24,-124 -29,-106 Z", fur, 106, { w: 0.9, c: [0, -112, 7, 0.5] }) + ermine([[-20, -111], [-11, -105.6], [-1, -103.6], [9.4, -105], [19, -110.6], [-5, -117], [8, -117.6]]);
  // the chain of office: every link its own little pane
  for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(-23, 23, u), y = -111 + Math.sin(u * Math.PI) * 27; g += `<circle cx="${n(x)}" cy="${n(y)}" r="${i % 2 ? 2.5 : 2.9}" fill="${vary(gold, 130 + i, 0.12)}" stroke="${LEAD}" stroke-width="${lw(0.5)}"/>${i % 2 ? "" : `<circle cx="${n(x)}" cy="${n(y)}" r="0.9" fill="#b0202a"/>`}`; }
  g += gd("M0,-84 L6.4,-78 L0,-70.6 L-6.4,-78 Z", gold, 150, { w: 0.6, plain: 1 }) + pl("M0,-81 L0,-74 M-3,-78 L3,-78", 0.7, "#8a4a10") + `<circle cx="0" cy="-78" r="1.5" fill="#1c2f9e"/>`;
  // the head: no neck, jowls, a small pleased face
  const tilt = (st.tilt || 0) - la * 13, look = st.look ?? 0.3, open = 1 - (st.blink || 0), tk = st.talk || 0;
  let h = gd("M-15.6,-135 Q-17.6,-153 0,-156 Q17.6,-153 15.6,-135 Q15,-121 1,-118.6 Q-14,-121 -15.6,-135 Z", skin, 160, { w: 0.9, c: [1, -139, 8], v: 0.05 });
  h += `<circle cx="-7.6" cy="-132" r="3.6" fill="#e8686a" opacity="0.5"/><circle cx="11.6" cy="-132.4" r="3.2" fill="#e8686a" opacity="0.5"/>` + pl("M-10,-133 q2.4,-1.6 4.8,0 M9.6,-133.4 q2,-1.4 4,0", 0.25, "#a8403a", 0.8);
  if (la > 0.5) h += pl("M-6.6,-141 Q-3.6,-144.4 -0.6,-141 M4.6,-141.2 Q7.2,-144.4 9.8,-141.2", 0.7);
  else h += gEye(-3.4, -140.6, 2.7, 1.15, look, open, "#4a6a9a", 0.42) + gEye(7.4, -140.8, 2.1, 1.1, look, open, "#4a6a9a", 0.42) + pl("M-6.4,-138.6 q3,1.2 5.8,0 M5.2,-138.8 q2.2,1 4.4,0", 0.22, PAINT, 0.7);
  h += pl(`M-7.4,${n(-146.4 - la)} Q-3.6,-149.4 0,-146.8 M4.6,-147 Q7.6,-149.4 10.6,${n(-146.6 - la)}`, 0.65);
  h += pl("M3.2,-140 Q6.4,-134.6 3.4,-133.2 Q1.2,-132.8 0.6,-134.6", 0.5) + pl("M2.6,-131.6 Q-1,-129.6 -3.6,-131.8 q-1.6,-0.4 -1.4,-2 M3.4,-131.6 Q7,-129.6 9.4,-131.8 q1.6,-0.4 1.4,-2", 0.6, "#5a3020");
  if (la > 0.3 || tk > 0.15) { const o = Math.max(la, tk); h += `<path d="M-3.6,-129 Q3,-131 9.4,-129 Q3,${n(-128 + o * 8)} -3.6,-129 Z" fill="#5a1420" stroke="${PAINT}" stroke-width="0.5"/>` + (o > 0.5 ? pl("M-1.6,-128.6 L7.6,-128.6", 1.1, "#fbf4e2") : ""); }
  else h += pl("M-2.6,-128.6 Q3,-126 9,-129.2 M8.6,-130 q1.2,0.4 1,1.6", 0.55, "#7a2a26");
  h += pl("M-10,-123.4 Q2,-116.6 12.6,-123.6 M-4,-124.6 Q2,-122.4 8,-124.8", 0.3, PAINT, 0.7);
  h += gd("M-19,-148 Q-24,-168 -4,-172 Q18,-175 22.4,-159 Q23.4,-150 18,-146.6 Q0,-154 -19,-148 Z", "#2a1a8a", 161, { w: 0.9, c: [0, -162, 8, 0.5] }) + gd("M-19.6,-148.6 Q0,-155.6 18.6,-147 L18,-143.4 Q0,-151 -19,-144.6 Z", fur, 162, { w: 0.6, plain: 1 });
  h += `<circle cx="11" cy="-160" r="2.8" fill="${gold}" stroke="${LEAD}" stroke-width="${lw(0.5)}"/><circle cx="11" cy="-160" r="1" fill="#b0202a"/>` + gd("M11,-162 Q14,-176 24,-178 Q20,-168 13.6,-160.6 Z", "#fbf5e2", 163, { w: 0.5, plain: 1 }) + pl("M12.6,-164 l3.6,-1 M14,-168 l3.6,-1.6 M16,-172 l3.4,-2", 0.25);
  g += `<g transform="rotate(${n(tilt)} 0 -122)">${h}</g>` + armF + `</g>`;
  LS = 1;
  return `<g transform="translate(${n(st.x)},${n(st.y)}) scale(${n(dir * s * 1000) / 1000},${n(s * 1000) / 1000})">${g}</g>`;
}
// a council member: a plain long robe, a simple painted face. st { x, y, s, dir, seed, h cm (150..185), laugh 0..1, look }
export function councillor(st, t = 0) {
  const s = st.s ?? 3, dir = st.dir ?? 1, sd = st.seed ?? 1, hh = st.h ?? 160 + hash(sd) * 22, la = st.laugh || 0, k = hh / 170, skin = pick(["#f3d6bc", "#ecc8a8", "#f6dcc8"], sd + 2);
  const robe = pick(["#1f7a72", "#8a2248", "#2f4a9a", "#6a7a2a", "#7a4a9a"], sd * 1.7), bz = la * Math.sin(t * 13 + sd) * 1;
  LS = s * k; let g = "";
  g += gd(`M-13,-134 Q-22,-70 -24,-2 L24,-2 Q22,-70 13,-134 Q0,-139 -13,-134 Z`, robe, sd * 7, { c: [0, -66, 9, 2.4] }) + pl("M-9,-110 Q-12,-50 -13,-6 M8,-112 Q10,-50 11,-6 M0,-128 L0,-6", 0.5, mix(robe, "#000000", 0.5), 0.8);
  g += gd("M-14,-134 Q0,-126 14,-134 L12,-140 Q0,-144 -12,-140 Z", sd % 2 ? "#f8f0dc" : mix(robe, "#000000", 0.35), sd * 7 + 1, { w: 0.6, plain: 1 });
  g += gd("M-11,-96 Q0,-88 11,-96 L10,-88 Q0,-80 -10,-88 Z", mix(robe, "#ffffff", 0.2), sd * 7 + 2, { w: 0.6, plain: 1 }) + gd("M-4,-93 Q0,-96 5,-93 Q5,-88 0,-87 Q-4,-88 -4,-93 Z", skin, sd * 7 + 3, { w: 0.5, plain: 1 });
  let h = gd("M-9.6,-152 Q-10.6,-166 0,-167.4 Q10.6,-166 9.6,-152 Q8.6,-141 1,-140 Q-8.6,-141 -9.6,-152 Z", skin, sd * 7 + 4, { w: 0.8, c: [1, -154, 5] });
  if (la > 0.5) h += pl("M-5,-155.6 Q-2.6,-158 -0.2,-155.6 M3.4,-155.8 Q5.4,-158 7.6,-155.8", 0.6) + `<path d="M-2.6,-147 Q2,-148.4 6.6,-147 Q2,${n(-146 + la * 5)} -2.6,-147 Z" fill="#5a1420" stroke="${PAINT}" stroke-width="0.4"/>`;
  else h += gEye(-2.6, -155.4, 2.3, 1, st.look ?? 0.4, 1, "#5a4a2a", 0.45) + gEye(5.4, -155.6, 1.8, 0.95, st.look ?? 0.4, 1, "#5a4a2a", 0.45) + pl("M-1.6,-146.6 Q2,-145.6 5.6,-147", 0.5, "#7a2a26");
  h += pl("M-5.6,-159 Q-2.6,-160.6 0.2,-159 M3.6,-159.2 Q5.6,-160.6 7.8,-159.2", 0.5) + pl("M2.4,-155 L3.2,-150 Q3.8,-149 2.2,-148.8", 0.4);
  h += sd % 3 === 0 ? gd("M-10.6,-156 Q-12,-170 0,-171 Q12,-170 10.6,-156 Q0,-163 -10.6,-156 Z", "#f6f0dc", sd * 7 + 5, { w: 0.6, plain: 1 }) + pl("M-9.6,-152 Q-11,-144 -7,-140", 0.8, "#f6f0dc")
    : sd % 3 === 1 ? gd("M-12,-160 Q-10,-172 2,-172 Q15,-171 14,-161 Q0,-166 -12,-160 Z", mix(robe, "#000000", 0.3), sd * 7 + 5, { w: 0.7 })
      : gd("M-11,-152 Q-13,-172 0,-173 Q13,-172 11,-152 L9,-158 Q0,-166 -9,-158 Z", mix(robe, "#ffffff", 0.15), sd * 7 + 5, { w: 0.7 }) + gd("M-9,-170 Q-18,-172 -20,-158 Q-14,-162 -9,-162 Z", mix(robe, "#ffffff", 0.15), sd * 7 + 6, { w: 0.5, plain: 1 });
  g += `<g transform="translate(0,${n(bz)}) rotate(${n(-la * 9)} 0 -142)">${h}</g>`;
  LS = 1;
  return `<g transform="translate(${n(st.x)},${n(st.y)}) scale(${n(dir * s * k * 1000) / 1000},${n(s * k * 1000) / 1000})">${g}</g>`;
}

// A CHILD OF 1284, seen from behind: tunic, hood or cap or braids, wooden shoes. No face unless look is set.
// st: { x, y, s, h cm (default by seed 86..128), seed, walk phase (null = standing), kind "boy"|"girl"|"crutch" (default by seed),
//   look -1..1 (head turned to that side: a calm profile, one painted eye), lean deg, toy (true: the wooden horse under one arm) }
export function child(st, t = 0) {
  const sd = st.seed ?? 1, hh = st.h ?? 86 + hash(sd * 3.7) * 42, k = hh / 105, s = (st.s ?? 3) * k, kind = st.kind || (hash(sd * 5.1) > 0.55 ? "girl" : "boy"), crutch = kind === "crutch", girl = kind === "girl";
  const w = crutch ? null : st.walk, sw = w == null ? 0 : Math.sin(w * TAU), bob = w == null ? 0 : Math.abs(Math.cos(w * TAU)) * 1.4;
  const tun = mix(pick(["#3f6fc0", "#3f9a6a", "#c8607a", "#c89a3a", "#7a5ab0", "#2f8a9a", "#b85a3a"], sd * 2.3), G.sky1, 0.22), hose = mix(pick(["#6a4a3a", "#3a4a6a", "#5a5a3a"], sd * 4.1), G.sky0, 0.3);
  const hair = pick(["#e6c46a", "#7a4a26", "#2a1a1a", "#c8642a", "#b89a5a"], sd * 6.3), skin = "#f3d2b6", clog = "#ecd08a", look = st.look || 0;
  LS = s; let g = "";
  const foot = (hx, ph, sd2, up = 0) => { const fx = hx + ph * 5.5, fy = -Math.max(0, ph) * 2.4 - up; return seg(hx, -36, fx, fy - 4.6, 3.4, 2.8, hose, sd2) + `<g transform="translate(${n(fx)},${n(fy)})">${gd("M-4,-0.2 Q-4.6,-5.4 0,-5.6 Q4.6,-5.4 4,-0.2 Z", clog, sd2 + 1, { w: 0.7, plain: 1 })}${pl("M-2.6,-3.6 Q0,-2.4 2.6,-3.6", 0.35, "#8a6a2a")}</g>`; };
  g += foot(-4.4, sw, sd * 11) + (crutch ? seg(4.4, -36, 6.4, -17, 3.4, 2.8, hose, sd * 11 + 3) + gd("M3.6,-17.6 L9.4,-17 L9,-9.6 L4,-10 Z", "#f6f0dc", sd * 11 + 4, { w: 0.6, plain: 1 }) + pl("M4,-14.6 L9.2,-13.6 M4,-12 L9,-11.4", 0.3) : foot(4.4, -sw, sd * 11 + 3));
  const hem = girl ? -20 : -33, hw = girl ? 16 : 13;
  g += gp([[-9, -80], [9, -80], [hw + sw * 1.2, hem], [0.6, hem + 1.4], [-hw + sw * 1.2, hem]], tun, sd * 13, { amp: 0.5 });
  g += pl(`M-10.6,-56 Q0,-53.6 10.6,-56`, 0.9, mix(tun, "#000000", 0.5)) + pl(`M-4,-52 Q-5,${n(hem + 12)} -6,${hem + 2} M4.6,-52 Q5.6,${n(hem + 12)} 6.4,${hem + 2}`, 0.4, mix(tun, "#000000", 0.4), 0.8);
  if (hash(sd * 8.9) > 0.6) g += gp([[-6, -70], [-0.6, -70.6], [-0.4, -63], [-5.6, -62.4]], mix(tun, hash(sd) > 0.5 ? "#f6d8a0" : "#4a2a2a", 0.5), sd * 13 + 2, { amp: 0.3, w: 0.5, plain: 1 });   // a mended patch
  const armL = seg(-9, -78, -12.4 - sw * 3, -52, 3, 2.5, mix(tun, "#000000", 0.14), sd * 15) + `<circle cx="${n(-12.6 - sw * 3.3)}" cy="-49.6" r="2.5" fill="${skin}" stroke="${LEAD}" stroke-width="${lw(0.5)}"/>`;
  const armR = crutch ? seg(9, -78, 15, -60, 3, 2.5, mix(tun, "#000000", 0.14), sd * 15 + 2) + `<circle cx="15.4" cy="-58" r="2.5" fill="${skin}" stroke="${LEAD}" stroke-width="${lw(0.5)}"/>`
    : seg(9, -78, 12.4 - sw * 3, -52, 3, 2.5, mix(tun, "#000000", 0.14), sd * 15 + 2) + `<circle cx="${n(12.6 - sw * 3.3)}" cy="-49.6" r="2.5" fill="${skin}" stroke="${LEAD}" stroke-width="${lw(0.5)}"/>`;
  if (crutch) g += gp([[12.4, -74], [15, -74], [18.6, 0], [16.4, 0]], "#b8843a", sd * 17, { amp: 0.2, w: 0.6, plain: 1 }) + gp([[8, -77], [19, -76], [19, -73], [8, -74]], "#9a6a2a", sd * 17 + 1, { amp: 0.2, w: 0.6, plain: 1 });
  g += armL + armR;
  if (st.toy) g += `<g transform="translate(-15,-52) rotate(-70) scale(0.9)">${horseParts(sd)}</g>`;
  // the head from behind
  let h = "";
  const style = girl ? 3 : Math.floor(hash(sd * 9.7) * 3);
  h += gd(`M-8.6,-90 Q-9.6,-101 0,-101.6 Q9.6,-101 8.6,-90 Q${n(8 - Math.abs(look) * 3)},-82.6 0,-82 Q${n(-8 + Math.abs(look) * 3)},-82.6 -8.6,-90 Z`, hair, sd * 19 + 1, { w: 0.8 });
  for (let i = 0; i < 6; i++) { const x = -6 + i * 2.4 + jit(sd + i, 0.5); h += pl(`M${n(x * 0.5)},-100 Q${n(x)},-93 ${n(x + jit(sd * 3 + i, 0.8))},${n(-84 - hash(sd + i * 3) * 2)}`, 0.3, mix(hair, "#000000", 0.45), 0.85); }
  if (Math.abs(look) > 0.15) { const d = look > 0 ? 1 : -1; h += `<g transform="scale(${d},1)">` + gd("M1,-99.4 Q8.6,-99 9.6,-91.6 Q11,-89.6 9.4,-88.6 Q9,-84 3,-83 Z", skin, sd * 19, { w: 0.6, plain: 1 }) + pl("M5.6,-92.6 l0.1,0", 1.3) + pl("M4,-94 Q5.8,-95.2 7.6,-94 M3.6,-96.6 Q5.6,-97.4 7.6,-96.4", 0.32) + pl("M6.4,-86.6 Q7.4,-86.2 8.2,-86.6", 0.32, "#7a2a26") + `<circle cx="5" cy="-88.6" r="1.6" fill="#e8787a" opacity="0.45"/></g>`; }
  if (style === 0) h += gd("M-9.4,-88 Q-11,-103 0,-104 Q11,-103 9.4,-88 Q0,-80.6 -9.4,-88 Z", tun, sd * 19 + 2, { w: 0.8 }) + gd("M-3,-103 Q0,-112 7,-112.6 Q4,-108 3,-103 Z", tun, sd * 19 + 3, { w: 0.5, plain: 1 }) + pl("M-9,-84 Q0,-78 9,-84", 0.5, mix(tun, "#000000", 0.4));
  else if (style === 1) h += gd("M-9,-94 Q-9.6,-102.6 0,-103 Q9.6,-102.6 9,-94 Q0,-98 -9,-94 Z", "#f6f0dc", sd * 19 + 2, { w: 0.7, plain: 1 });
  else if (style === 3) { for (const d of [-1, 1]) h += gp([[d * 4.6, -86], [d * 7.6, -86], [d * 7 + sw, -62], [d * 5 + sw, -62]], hair, sd * 19 + 4 + d, { amp: 0.3, w: 0.6, plain: 1 }) + pl(`M${d * 4.8},-80 l${d * 2.6},1.4 M${d * 4.8},-74 l${d * 2.6},1.4 M${d * 5},-68 l${d * 2.2},1.4`, 0.3, mix(hair, "#000000", 0.5)) + `<circle cx="${n(d * 6 + sw)}" cy="-61" r="1.5" fill="${PIED.crimson}" stroke="${LEAD}" stroke-width="${lw(0.35)}"/>`;
    if (hash(sd * 2.2) > 0.5) h += gd("M-9.4,-93 Q-9.6,-103 0,-103.6 Q9.6,-103 9.4,-93 Q0,-97.6 -9.4,-93 Z", mix("#f6f0dc", tun, 0.25), sd * 19 + 7, { w: 0.7, plain: 1 }); }
  g += `<g transform="rotate(${n(look * 6)} 0 -82)">${h}</g>`;
  LS = 1;
  return `<g transform="translate(${n(st.x)},${n(st.y - bob * s)}) rotate(${n((st.lean || 0) + (crutch ? 5 : 0))}) scale(${n(s * 1000) / 1000})">${g}</g>`;
}
// the line of children along a path [[x, y, s], ...] (s = px per cm at that point). They enter at the first point and walk on.
// o { path, n, t, seed, gap (path fraction between two children), speed (path fraction per second), lead (how far the first one is, 0..1+) }
export function childrenLine(o) {
  const pth = o.path, sd = o.seed || 1, t = o.t || 0, gap = o.gap ?? 0.07, list = [];
  for (let i = 0; i < o.n; i++) {
    const u = (o.lead ?? t * (o.speed ?? 0.05)) - i * gap * (0.82 + 0.36 * hash(sd * 3 + i));
    if (u < 0 || u > 1) continue;
    const f = u * (pth.length - 1), k = Math.min(pth.length - 2, Math.floor(f)), a = pth[k], b = pth[k + 1], v = f - k;
    list.push({ x: lerp(a[0], b[0], v) + jit(sd * 7 + i, 14) * lerp(a[2], b[2], v) / 3, y: lerp(a[1], b[1], v), s: lerp(a[2], b[2], v), seed: sd * 13 + i, walk: t * (1.5 + 0.4 * hash(sd + i)) + hash(sd * 5 + i), kind: hash(sd * 5.1 * 13 + i * 66.3) > 0.55 ? "girl" : "boy", toy: o.toy === i });
  }
  return list.sort((a, b) => a.y - b.y).map((c) => child(c, t)).join("");
}
// the small wooden horse on wheels
function horseParts(sd = 1) {
  const wood = "#d9a04a", wood2 = "#b8762e";
  let g = gp([[-13, -5], [13, -5], [13.4, -2.6], [-13.4, -2.6]], "#a8322a", 700, { amp: 0.25, w: 0.6, plain: 1 });
  for (const x of [-8.6, 8.6]) g += `<circle cx="${x}" cy="-1.4" r="3.1" fill="${vary("#7a4a22", 701 + x, 0.1)}" stroke="${LEAD}" stroke-width="${lw(0.6)}"/><circle cx="${x}" cy="-1.4" r="0.9" fill="#ffd24a"/>` + pl(`M${x - 2},-1.4 L${x + 2},-1.4 M${x},-3.4 L${x},0.6`, 0.3, "#3a2010", 0.8);
  g += gp([[-8.6, -12], [-6, -12], [-6.4, -5], [-9.4, -5]], wood2, 703, { amp: 0.2, w: 0.5, plain: 1 }) + gp([[5.6, -12], [8.2, -12], [9, -5], [6, -5]], wood2, 704, { amp: 0.2, w: 0.5, plain: 1 });
  g += gd("M-10.6,-13 Q-11.6,-19.6 -6,-20 L5,-20 Q9.6,-19 9.6,-13.6 Q9,-11 6,-11 L-7,-11 Q-10,-11 -10.6,-13 Z", wood, 705, { w: 0.7, c: [-1, -15.6, 3.4, 0.5] });
  g += gd("M3.6,-19 Q5.6,-28.6 9.6,-30.4 Q13.6,-31 17,-26 L16,-23.4 Q12.6,-24 11.6,-21 Q10.6,-16 8,-13.6 Z", wood, 706, { w: 0.7 }) + gd("M8.6,-30 L9.4,-34 L11.4,-30.6 Z", wood2, 707, { w: 0.4, plain: 1 });
  g += gd("M-4.6,-20.4 L2.4,-20.4 L3,-15.6 Q-1,-14.6 -5,-15.6 Z", "#2a5ab8", 708, { w: 0.5, plain: 1 }) + pl("M-3.6,-17.6 L2,-17.6", 0.4, "#ffd24a");
  g += pl("M13.4,-27.4 l0.1,0", 1.1) + pl("M15.4,-25 l1.2,0.4", 0.3);
  for (let i = 0; i < 6; i++) g += pl(`M${n(4.6 + i * 0.9)},${n(-20.6 - i * 1.7)} l${n(-2.4 - hash(i + sd))},${n(1.4 + hash(i * 3))}`, 0.5, "#4a2a16");
  for (let i = 0; i < 4; i++) g += pl(`M-10.4,-17 q${n(-3 - i * 0.6)},${n(1 + i)} ${n(-3.4 + i * 0.5)},${n(6 + i * 0.8)}`, 0.4, "#4a2a16");
  g += pl("M-2,-13 l1.2,0.6 M6.6,-17 l0.9,1 M12,-22.4 l0.8,0.8", 0.3, "#f6e0b0", 0.9);
  return g;
}
// o { s px per cm (the toy is about 30 cm long), tip 0..1 (fallen on its side), string (false = none), dir }
export function horseToy(x, y, o = {}) {
  const s = o.s ?? 8, tip = o.tip || 0; LS = s;
  const str = o.string === false ? "" : `<path d="M13,-4 Q22,-3 27,0.4 Q33,3.4 40,1 Q45,-1 47,2" fill="none" stroke="${LEAD}" stroke-width="${n(0.5 + LW * 0.3 / s)}" stroke-linecap="round"/><path d="M13,-4 Q22,-3 27,0.4 Q33,3.4 40,1 Q45,-1 47,2" fill="none" stroke="#f0e0b8" stroke-width="0.45" stroke-linecap="round"/>`;
  const sh = gd("M-16,0.6 Q0,-2.4 17,0.6 Q0,3.6 -16,0.6 Z", G.dark, 720, { w: 0.5, plain: 1 });
  const g = `${sh}${str}<g transform="rotate(${n(tip * 84)} 13 0)">${horseParts(3)}</g>`;
  LS = 1;
  return `<g transform="translate(${n(x)},${n(y)}) scale(${n((o.dir ?? 1) * s * 100) / 100},${n(s * 100) / 100})">${g}</g>`;
}

// ================================================================= glass sets (panel px; each returns the svg of one panel)
const skyCol = (v) => v < 0.45 ? mix(G.sky0, G.sky1, v / 0.45) : mix(G.sky1, G.sky2, (v - 0.45) / 0.55);
function gsky(y1, seed, o = {}) {
  let s = field(0, 0, o.w || PW, y1, { cw: 185, ch: 106, seed, col: (u, v) => skyCol(v) });
  if (o.stars) for (let i = 0; i < 16; i++) { const x = 50 + hash(seed + i * 3) * ((o.w || PW) - 100), y = 40 + hash(seed + i * 5) * (y1 * 0.7), r = 9 + 9 * hash(seed + i * 7); s += gp([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], "#fff8dc", seed + i, { amp: 0.5, w: 0.5, plain: 1 }); }
  if (o.moon) { const [mx, my, r] = o.moon;
    for (let i = 0; i < 11; i++) { const a0 = i / 11 * TAU, a1 = (i + 1) / 11 * TAU; s += gp([[mx + Math.cos(a0) * r, my + Math.sin(a0) * r], [mx + Math.cos(a0) * r * 1.62, my + Math.sin(a0) * r * 1.62], [mx + Math.cos(a1) * r * 1.62, my + Math.sin(a1) * r * 1.62], [mx + Math.cos(a1) * r, my + Math.sin(a1) * r]], mix(G.sky2, "#fff8dc", 0.4), seed + 40 + i, { amp: 1 }); }
    s += `<circle cx="${mx}" cy="${my}" r="${r}" fill="#fff6d8" stroke="${LEAD}" stroke-width="${LW}"/>` + pl(`M${mx - r * 0.4},${my - r * 0.3} q${r * 0.2},-${r * 0.2} ${r * 0.34},0 M${mx + r * 0.1},${my + r * 0.3} q${r * 0.24},${r * 0.1} ${r * 0.3},-${r * 0.16} M${mx - r * 0.5},${my + r * 0.36} q${r * 0.1},${r * 0.14} ${r * 0.24},${r * 0.04}`, 3, "#c8b68a", 0.8); }
  return s;
}
// a gabled house front in panes. o { door 0..1 (opening: warm light behind), lit (windows), wins }
function ghouse(x, yb, w, h, seed, o = {}) {
  const lean = jit(seed * 3, 1.3), gh = w * (0.5 + 0.28 * hash(seed)), wall = seed % 2 ? G.wall0 : G.wall1, lit = o.lit ?? 0.5;
  let s = `<g transform="rotate(${n(lean)} ${n(x + w / 2)} ${yb})">`;
  s += field(x, yb - h, x + w, yb, { cw: w / 2.6, ch: h / Math.max(2, Math.round(h / 84)), seed, col: (u, v, id) => (id * 7 + seed) % 5 === 0 ? G.wall2 : wall });
  const ax = x + w / 2 + jit(seed, w * 0.06), ay = yb - h - gh, lx = x - 14, rx = x + w + 14, ty = yb - h;
  s += gp([[lx, ty], [lerp(lx, rx, 0.36), ty], [ax, ay]], G.roof0, seed + 1) + gp([[lerp(lx, rx, 0.36), ty], [lerp(lx, rx, 0.68), ty], [ax, ay]], G.roof1, seed + 2) + gp([[lerp(lx, rx, 0.68), ty], [rx, ty], [ax, ay]], G.roof0, seed + 3);
  for (let i = 1; i < 4; i++) { const u = i / 4.4; s += pl(`M${n(lerp(lx, ax, u) + 8)},${n(lerp(ty, ay, u))} Q${n(ax)},${n(lerp(ty, ay, u) + 14)} ${n(lerp(rx, ax, u) - 8)},${n(lerp(ty, ay, u))}`, 2.4, PAINT, 0.5); }
  s += pl(`M${n(x + 6)},${n(yb - h * 0.52)} L${n(x + w - 6)},${n(yb - h * 0.5)} M${n(x + w * 0.5)},${n(yb - h + 6)} L${n(x + w * 0.5)},${n(yb - h * 0.52)}`, 7, mix(G.wood0, "#000000", 0.35), 0.9);
  const ww = w * 0.22, wh = h * 0.2;
  for (const [u, v, k] of o.wins || [[0.14, 0.2, 0], [0.64, 0.2, 1]]) { const wx = x + w * u, wy = yb - h + h * v, on = hash(seed * 5 + k) < lit; s += gp([[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], on ? G.win : G.dark, seed * 9 + k, { amp: 0.8, w: 0.9 }) + `<path d="M${n(wx + ww / 2)},${n(wy)} L${n(wx + ww / 2)},${n(wy + wh)} M${n(wx)},${n(wy + wh / 2)} L${n(wx + ww)},${n(wy + wh / 2)}" stroke="${LEAD}" stroke-width="${LW * 0.55}"/>`; }
  const dw = w * 0.3, dh = Math.min(h * 0.46, 150), dx = x + w * (0.34 + 0.2 * hash(seed + 7)), op = clamp(o.door || 0);
  s += gp([[dx - 9, yb - dh - 9], [dx + dw + 9, yb - dh - 9], [dx + dw + 9, yb], [dx - 9, yb]], G.wood0, seed + 20, { amp: 0.8, plain: 1 });
  if (op > 0.02) s += gp([[dx, yb - dh], [dx + dw, yb - dh], [dx + dw, yb], [dx, yb]], "#ffd24a", seed + 21, { amp: 0.5, w: 0.7 });
  const cwid = dw * (1 - op * 0.82);
  s += gp([[dx + dw - cwid, yb - dh + op * 8], [dx + dw, yb - dh], [dx + dw, yb], [dx + dw - cwid, yb - op * 5]], G.wood1, seed + 22, { amp: 0.5, w: 0.7, plain: 1 }) + pl(`M${n(dx + dw - cwid * 0.5)},${n(yb - dh + 8)} L${n(dx + dw - cwid * 0.5)},${n(yb - 6)}`, 2, PAINT, 0.6);
  return { svg: s + `</g>`, door: [dx + dw * 0.4, yb] };
}
const loaf = (x, y, s, seed, bitten) => { const sv = LS; LS = s; const g = gd(bitten ? "M-11,0 Q-13,-8 -4,-9.6 Q3,-10 6,-8 L5,-5.6 L7.4,-4.6 L6.4,-2 L9,0 Z" : "M-11,0 Q-13,-8 -4,-9.6 Q8,-10.6 11,-4 Q12,0 9,0 Z", "#e8a83a", seed, { w: 0.8, c: [-2, -5, 3, 0.5], v: 0.12 }) + pl("M-7,-7.6 l2.6,4 M-2.6,-8.6 l2.6,4.4 M2,-8.4 l2.4,4", 0.6, "#8a4a14"); LS = sv; return `<g transform="translate(${n(x)},${n(y)}) scale(${s})">${g}</g>`; };

// THE MARKET SQUARE (sick grey-green mood "rats"). o { rats 0..1 (how far the plague has come), border }
export function square(t = 0, o = {}) {
  const am = o.rats ?? 1;
  let s = gsky(600, 11);
  for (const [x, w, h, sd] of [[26, 262, 400, 3], [296, 240, 480, 4], [540, 258, 420, 5], [806, 250, 460, 6]]) s += ghouse(x, 1050, w, h, sd, { lit: 0.3 }).svg;
  s += field(0, 1050, PW, PH, { cw: 150, ch: 96, seed: 13, col: (u, v, id) => id % 3 ? G.gnd0 : G.gnd1 });
  const stall = (x0, x1, ty, sd) => { let g = "";
    for (const px of [x0 + 14, x1 - 34]) g += gp([[px, ty - 300], [px + 20, ty - 300], [px + 20, ty + 190], [px, ty + 190]], G.wood0, sd + px, { amp: 1, plain: 1 });
    const N = 6; for (let i = 0; i < N; i++) { const a = lerp(x0 - 30, x1 + 30, i / N), b = lerp(x0 - 30, x1 + 30, (i + 1) / N), sg = Math.sin(t * 1.4 + i) * 4; g += gp([[lerp(a, (x0 + x1) / 2, 0.16), ty - 380], [lerp(b, (x0 + x1) / 2, 0.16), ty - 380], [b, ty - 290], [(a + b) / 2, ty - 262 + sg], [a, ty - 290]], i % 2 ? G.cloth : G.roof1, sd + 10 + i, { amp: 1.2 }); }
    g += gp([[x0, ty], [x1, ty], [x1 + 8, ty + 34], [x0 - 8, ty + 34]], G.wood1, sd + 20, { amp: 1 }) + field(x0 + 4, ty + 34, x1 - 4, ty + 176, { cw: 130, ch: 142, seed: sd + 30, col: (u, v, id) => id % 2 ? G.cloth : G.wall2 });
    return g; };
  s += stall(96, 506, 1320, 100) + stall(590, 1000, 1290, 200);
  [[150, 1320, 0], [226, 1322, 1], [306, 1320, 0], [392, 1321, 1], [460, 1320, 0], [640, 1290, 1], [724, 1291, 0], [812, 1290, 0], [900, 1291, 1], [960, 1290, 0]].forEach(([x, y, b], i) => { s += loaf(x, y, 3.3, 300 + i, b && am > 0.3); });
  const fixed = [[190, 1320, 2.7, "sit", 1], [352, 1321, 2.6, "sniff", -1], [436, 1298, 2.4, "run", 1], [684, 1290, 2.7, "sit", -1], [860, 1291, 2.6, "sniff", 1], [940, 1268, 2.3, "sit", -1], [300, 938, 2.2, "run", 1], [760, 908, 2.2, "sniff", -1], [528, 1150, 2.3, "run", -1], [70, 1230, 2.4, "sit", 1]];
  fixed.slice(0, Math.round(fixed.length * am)).forEach(([x, y, sc, pose, d], i) => { s += rat(x, y, sc, { pose, dir: d, seed: 400 + i, ph: t * (pose === "run" ? 3 : 0.8) + i }); });
  if (am > 0.2) { s += rat(118, 1150, 2.3, { pose: "run", dir: 1, seed: 420, ph: t * 3, rot: -78 }) + rat(978, 1140, 2.3, { pose: "run", dir: 1, seed: 421, ph: t * 3 + 0.4, rot: -80 }); }
  s += ratSwarm({ n: 20, seed: 5, box: [30, 1500, 1050, 1640], t, flow: [150, 0], size: [2.1, 2.5], amount: am, sit: 0.12 });
  s += loaf(330, 1740, 7.4, 320, am > 0.5) + ratSwarm({ n: 22, seed: 9, box: [30, 1650, 1050, 1880], t, flow: [-170, 0], size: [2.7, 3.5], amount: am, sit: 0.2 });
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 3));
}

// THE CRADLE-BED: rats sitting on the quilt, the sleeper only a slow-breathing bump (nobody is touched). o { rats 0..1 }
export function bedroom(t = 0, o = {}) {
  const am = o.rats ?? 1, br = Math.sin(t * 1.6) * 7;
  let s = field(0, 0, PW, 1190, { cw: 210, ch: 132, seed: 21, col: (u, v, id) => id % 4 === 1 ? G.wall1 : G.wall0 });
  s += gp([[676, 236], [964, 236], [964, 596], [676, 596]], G.wood0, 500, { plain: 1 });
  [[700, 260, 820, 416, G.sky0], [820, 260, 940, 416, G.sky1], [700, 416, 820, 572, G.sky1], [820, 416, 940, 572, G.sky0]].forEach(([a, b, c, d, col], i) => { s += gp([[a, b], [c, b], [c, d], [a, d]], col, 501 + i, { amp: 1 }); });
  s += gp([[100, 650], [470, 644], [476, 676], [96, 680]], G.wood1, 510) + gp([[214, 520], [246, 520], [250, 648], [210, 648]], "#f6f0dc", 511, { plain: 1 }) + gd(`M230,516 Q${n(206 + Math.sin(t * 9) * 5)},470 ${n(230 + Math.sin(t * 7) * 6)},${n(426 + Math.sin(t * 11) * 6)} Q254,474 230,516 Z`, "#ffd24a", 512, { w: 0.6, plain: 1 }) + gd("M330,646 Q300,580 340,540 L334,516 L396,516 L390,540 Q430,580 400,646 Z", G.cloth, 513);
  s += field(0, 1190, PW, PH, { cw: 310, ch: 104, seed: 23, col: (u, v, id) => id % 2 ? G.wood0 : G.wood1 });
  s += gd("M96,1570 Q540,1690 984,1570 L990,1626 Q540,1750 90,1626 Z", G.wood1, 520, { c: [540, 1660, 60, 0.3] });
  s += gp([[140, 950], [256, 918], [256, 1580], [140, 1580]], G.wood0, 521) + gp([[140, 950], [352, 880], [372, 1000], [256, 1040]], G.wood1, 522) + pl("M176,1120 q22,-40 44,0 q-22,40 -44,0 M198,1090 l0,60 M172,1120 l52,0", 4, PAINT, 0.7);
  s += gp([[846, 1120], [940, 1120], [940, 1580], [846, 1580]], G.wood0, 523) + gd("M846,1120 Q893,1060 940,1120 Z", G.wood1, 524, { plain: 1 });
  s += gd("M262,1196 Q330,1128 426,1170 Q440,1250 404,1276 L270,1276 Z", "#f8f2e4", 525, { c: [340, 1220, 40, 0.5] });
  const top = (x) => 1262 - Math.sin(clamp((x - 380) / 470) * Math.PI) ** 1.5 * (118 + br) + (x - 380) * 0.02;
  const qc = [G.cloth, G.wall2, G.leaf1, mix("#d86a6a", G.sky1, 0.35), G.water1];
  for (let x = 380, i = 0; x < 846; i++) { const wd = 74 + 18 * hash(i + 530), x1 = Math.min(846, x + wd), mid = lerp(top((x + x1) / 2), 1410, 0.5) + jit(i + 540, 10);
    s += gp([[x, top(x)], [x1, top(x1)], [x1, mid], [x, mid]], qc[(i * 2) % 5], 550 + i, { amp: 1 }) + gp([[x, mid], [x1, mid], [x1, 1410], [x, 1410]], qc[(i * 2 + 3) % 5], 570 + i, { amp: 1 });
    s += pl(`M${n(x + 14)},${n(mid + 22)} l${n(wd - 30)},0 M${n((x + x1) / 2)},${n(mid + 10)} l0,26`, 2.2, PAINT, 0.35); x = x1; }
  s += gp([[256, 1410], [846, 1410], [846, 1484], [256, 1484]], G.wood0, 590) + pl("M300,1446 L800,1446", 3, PAINT, 0.4);
  const rs = [[520, top(520) + 6, 3.4, "sit", 1], [640, top(640) + 5, 3.2, "sniff", -1], [760, top(760) + 6, 3.0, "sit", -1], [300, 918, 2.8, "sniff", 1], [893, 1096, 2.8, "sit", -1], [420, 648, 2.4, "sit", 1], [440, top(440) + 8, 2.8, "run", 1]];
  rs.slice(0, Math.round(rs.length * am)).forEach(([x, y, sc, pose, d], i) => { s += rat(x, y, sc, { pose, dir: d, seed: 600 + i, ph: t * (pose === "run" ? 2.6 : 0.7) + i }); });
  s += ratSwarm({ n: 9, seed: 14, box: [40, 1700, 1040, 1880], t, flow: [130, 0], size: [3, 3.6], amount: am, sit: 0.25 });
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 5));
}

// THE TOWN GATE. o { open 0..1 (the leaves), border }. Stand the piper at GATE.spot (in the arch) or GATE.front.
export const GATE = { spot: [540, 1492], s: 2.25, front: [540, 1800], sFront: 3.2 };
export function gate(t = 0, o = {}) {
  const op = o.open ?? 1, inArch = (x, y) => Math.abs(x - 540) < 150 && y > 800, inTower = (x) => (x > 180 && x < 410) || (x > 670 && x < 900);
  let s = gsky(720, 31, { moon: o.moon });
  s += gd("M-20,640 Q200,520 420,600 Q700,500 1100,620 L1100,760 L-20,760 Z", G.leaf0, 700, { c: [300, 640, 80, 0.3] });
  for (let x = 14; x < PW; x += 118) if (!inTower(x + 40)) s += gp([[x, 486], [x + 76, 486], [x + 76, 570], [x, 570]], G.stone1, 710 + x);
  s += field(0, 562, PW, 1500, { cw: 150, ch: 86, seed: 33, col: (u, v, id) => id % 3 ? G.stone0 : G.stone1, skip: (x, y) => inArch(x, y) || inTower(x) });
  for (const [x0, x1, sd] of [[186, 404, 35], [676, 894, 37]]) {
    s += field(x0, 336, x1, 1500, { cw: 112, ch: 82, seed: sd, col: (u, v, id) => id % 3 ? G.stone1 : G.stone0, skip: (x, y) => inArch(x, y) });
    const cx = (x0 + x1) / 2; s += gp([[x0 - 22, 336], [lerp(x0 - 22, x1 + 22, 0.38), 336], [cx, 96]], G.roof0, sd + 1) + gp([[lerp(x0 - 22, x1 + 22, 0.38), 336], [lerp(x0 - 22, x1 + 22, 0.7), 336], [cx, 96]], G.roof1, sd + 2) + gp([[lerp(x0 - 22, x1 + 22, 0.7), 336], [x1 + 22, 336], [cx, 96]], G.roof0, sd + 3);
    const fl = Math.sin(t * 3 + sd) * 8; s += `<path d="M${cx},100 L${cx},30" stroke="${LEAD}" stroke-width="${LW}"/>` + gp([[cx, 34], [cx + 70, 50 + fl], [cx, 74]], G.rim2, sd + 4, { amp: 0.5, plain: 1 });
    s += gp([[cx - 11, 520], [cx + 11, 520], [cx + 11, 640], [cx - 11, 640]], G.dark, sd + 5, { amp: 0.5, plain: 1 }) + gp([[cx - 11, 900], [cx + 11, 900], [cx + 11, 1010], [cx - 11, 1010]], G.dark, sd + 6, { amp: 0.5, plain: 1 });
  }
  // through the arch: the road out, a hill, the low sky
  s += gd("M394,1180 L394,960 Q400,800 540,736 Q680,800 686,960 L686,1180 Z", G.sky2, 720, { c: [540, 960, 70, 1.4] }) + gd("M394,1180 Q500,1080 686,1150 L686,1336 L394,1336 Z", G.leaf1, 721) + gp([[394, 1336], [686, 1336], [686, 1500], [394, 1500]], G.gnd1, 722) + pl("M540,1500 Q500,1400 560,1330 Q600,1270 560,1200", 5, PAINT, 0.35);
  const bz = (u, k) => { const a = [400, 960], c = [400, 800], b = [540, 740], q = (i) => (1 - u) ** 2 * a[i] + 2 * u * (1 - u) * c[i] + u * u * b[i]; return [540 + (q(0) - 540) * k, 960 + (q(1) - 960) * k]; };
  for (const m of [1, -1]) { for (let i = 0; i < 4; i++) { const p = [bz(i / 4, 1), bz((i + 1) / 4, 1), bz((i + 1) / 4, 1.34), bz(i / 4, 1.34)].map(([x, y]) => [540 + (x - 540) * m, y]); s += gp(p, i % 2 ? G.stone1 : G.wall2, 730 + i + m * 5, { amp: 1 }); }
    for (let i = 0; i < 3; i++) s += gp([[540 - m * 140, 960 + i * 180], [540 - m * 188, 960 + i * 180], [540 - m * 188, 1140 + i * 180], [540 - m * 140, 1140 + i * 180]], i % 2 ? G.wall2 : G.stone1, 740 + i + m * 5, { amp: 1 }); }
  for (let i = 0; i < 5; i++) { const x = 440 + i * 50, y = 742 + (Math.abs(x - 540) / 140) ** 1.7 * 216; s += gp([[x - 13, y], [x + 13, y], [x, y + 58]], G.dark, 750 + i, { amp: 0.5, w: 0.6, plain: 1 }); }
  const lwid = lerp(140, 30, op);
  for (const m of [1, -1]) { const x0 = 540 - m * 140, x1 = x0 + m * lwid; s += gp([[x0, 930], [x1, 930 - (1 - op) * 0 + op * 26], [x1, 1500 + op * 12], [x0, 1500]], G.wood0, 760 + m, { amp: 1 }) + pl(`M${x0},1040 L${n(x1)},${n(1040 + op * 16)} M${x0},1340 L${n(x1)},${n(1340 + op * 6)}`, 6, PAINT, 0.7); }
  s += field(0, 1500, PW, PH, { cw: 172, ch: 92, seed: 39, col: (u, v, id) => Math.abs(u - 0.5) < 0.16 + v * 0.14 ? G.gnd1 : G.gnd0 });
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 7));
}

// THE WESER. Rats run along the near bank, leap, and are gone in a splash (nothing else is shown).
// o { rats (count, default 16), amount 0..1, border }. Stand the piper at RIVER.spot, facing left (dir -1).
export const RIVER = { spot: [905, 1850], s: 2.5, bankY: (x) => 1385 + x * 0.3 };
export function river(t = 0, o = {}) {
  let s = gsky(580, 41);
  s += gd("M-20,560 Q160,470 380,540 Q560,470 760,530 Q940,480 1100,540 L1100,700 L-20,700 Z", G.leaf0, 800, { c: [500, 590, 90, 0.25] });
  [[640, 70, 90], [716, 60, 124], [782, 76, 84], [866, 64, 110], [936, 80, 76]].forEach(([x, w, h], i) => { s += gp([[x, 640 - h], [x + w / 2, 640 - h - w * 0.6], [x + w, 640 - h], [x + w, 640], [x, 640]], i % 2 ? G.wall0 : G.wall1, 810 + i, { amp: 1 }); });
  s += gp([[744, 480], [758, 380], [772, 480]], G.roof0, 816, { amp: 0.5, plain: 1 });
  s += gp([[150, 640], [176, 640], [182, 500], [160, 500]], G.wood0, 820, { plain: 1 }) + gd("M60,520 Q50,400 170,380 Q290,400 280,520 Q230,570 170,540 Q110,570 60,520 Z", G.leaf1, 821, { c: [170, 460, 50] }) + pl("M110,430 q-14,60 -4,110 M150,410 q-8,70 0,130 M196,410 q10,60 4,130 M236,440 q10,50 2,90", 3, PAINT, 0.4);
  const yb = (i, x) => 640 + i * 104 + (i > 0 ? Math.sin(x * 0.0085 + i * 1.3 + t * 1.1) * 17 + Math.sin(x * 0.021 + i * 2.1 - t * 0.7) * 7 : 0);
  for (let i = 0; i < 10; i++) for (let x = -hash(i + 830) * 180 - 20, j = 0; x < PW; j++) { const wd = 170 + 110 * hash(i * 13 + j + 840), x1 = x + wd, top = [0, 0.33, 0.66, 1].map((u) => [lerp(x, x1, u), yb(i, lerp(x, x1, u))]), bot = [1, 0.66, 0.33, 0].map((u) => [lerp(x, x1, u) + jit(i * 7 + j, 8) * (u === 1 || u === 0 ? 1 : 0), yb(i + 1, lerp(x, x1, u))]);
    const id = i * 17 + j; s += gp([...top, ...bot], id % 7 === 3 ? G.water2 : (i + j) % 2 ? G.water0 : G.water1, 850 + id, { amp: 0 }); if (hash(id + 860) > 0.5) { const wx = lerp(x, x1, 0.2 + 0.4 * hash(id)), wy = yb(i, wx) + 52; s += pl(`M${n(wx)},${n(wy)} q16,-16 32,0 q16,14 32,0 q8,-7 14,-6`, 3, "#ffffff", 0.55); } x = x1; }
  const N = Math.round((o.rats ?? 16) * (o.amount ?? 1)), by = RIVER.bankY;
  let splashes = "", rats = "";
  for (let i = 0; i < N; i++) {
    const cyc = (t * 0.42 + hash(i * 3.7 + 1)) % 1, tx = 190 + hash(i * 5.3) * 520, lx = tx + 110 + hash(i * 7.1) * 150, ly = by(tx) - 190 - hash(i * 9.7) * 330;
    if (cyc > 0.74) splashes += splash(lx, ly, 74 * (0.7 + 0.5 * (ly - 800) / 600), (cyc - 0.74) / 0.26, i);
    else if (cyc > 0.42) { const u = (cyc - 0.42) / 0.32, x = lerp(tx, lx, u), y = lerp(by(tx) - 10, ly, u) - Math.sin(u * Math.PI) * 150, dy = (ly - by(tx)) - Math.cos(u * Math.PI) * 150 * Math.PI, dx = lx - tx; rats += rat(x, y, lerp(2.7, 1.9, u), { pose: "leap", dir: 1, seed: 900 + i, ph: cyc * 4, rot: Math.atan2(dy, dx) * 57.3 }); }
  }
  s += splashes + rats;
  for (let x = 0, i = 0; x < PW; i++) { const wd = 150 + 80 * hash(i + 870), x1 = Math.min(PW, x + wd); s += gp([[x, by(x)], [x1, by(x1)], [x1, by(x1) + 96], [x, by(x) + 96]], i % 2 ? G.leaf0 : G.leaf1, 880 + i, { amp: 2 }) + gp([[x, by(x) + 96], [x1, by(x1) + 96], [x1, by(x1) + 300 + jit(i + 5, 30)], [x, by(x) + 300 + jit(i + 4, 30)]], i % 2 ? G.gnd1 : G.gnd0, 890 + i, { amp: 2 }) + gp([[x, by(x) + 300 + jit(i + 4, 30)], [x1, by(x1) + 300 + jit(i + 5, 30)], [x1, PH], [x, PH]], i % 2 ? G.gnd0 : G.gnd1, 895 + i * 3, { amp: 2 }); x = x1; }
  for (let i = 0; i < 17; i++) { const x = 20 + hash(i + 910) * 1040, y = by(x) + 14, h = 80 + 110 * hash(i + 920), sw = Math.sin(t * 1.5 + i) * 9; s += gp([[x - 6, y], [x + 6, y], [x + sw + jit(i, 14), y - h]], G.leaf1, 930 + i, { amp: 0.4, w: 0.6, plain: 1 }); if (i % 5 === 0) s += gd(`M${n(x + sw - 7)},${n(y - h - 44)} q7,-12 14,0 l0,40 q-7,10 -14,0 Z`, G.wood0, 950 + i, { w: 0.6, plain: 1 }); }
  for (let i = 0; i < N; i++) { const cyc = (t * 0.42 + hash(i * 3.7 + 1)) % 1; if (cyc <= 0.42) { const u = cyc / 0.42, tx = 190 + hash(i * 5.3) * 520, x = lerp(-80, tx, u); s += rat(x, by(x) - 6 + 40 * hash(i + 3) * (1 - u), 2.7, { pose: "run", dir: 1, seed: 900 + i, ph: cyc * 14, rot: 16 }); } }
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 9));
}

// THE COUNCIL HALL: a diapered ground under a canopy arch, a tiled floor, the town's chest. o { chest (false = none), border }
export const HALL = { floor: 1560, piper: [330, 1590], mayor: [745, 1590], s: 3.4 };
function diaper(x0, y0, x1, y1, seed, cell = 64) {
  return field(x0, y0, x1, y1, { cw: cell, ch: cell, grid: 1, seed, amp: 0.4, w: 0.7, col: (u, v, id, r, j) => (r + j) % 2 ? G.dpA : G.dpB,
    deco: (cx, cy, w) => { const r = w * 0.2; return pl(`M${n(cx - r)},${n(cy)} q${n(r * 0.5)},${n(-r)} ${n(r)},0 q${n(r)},${n(r * 0.5)} 0,${n(r)} q${n(-r * 0.5)},${n(r)} ${n(-r)},0 q${n(-r)},${n(-r * 0.5)} 0,${n(-r)}`, 1.5, PAINT, 0.5) + `<circle cx="${n(cx)}" cy="${n(cy)}" r="2.6" fill="${PAINT}" opacity="0.5"/>`; } });
}
export function hall(t = 0, o = {}) {
  let s = field(0, 0, PW, 380, { cw: 150, ch: 96, seed: 51, col: (u, v, id) => id % 2 ? G.rim : G.rim2 }) + diaper(128, 150, 952, 1340, 53);
  const bz = (u, k) => { const a = [128, 400], c = [150, 190], b = [540, 96], q = (i) => (1 - u) ** 2 * a[i] + 2 * u * (1 - u) * c[i] + u * u * b[i]; return [540 + (q(0) - 540) * k, 400 + (q(1) - 400) * k]; };
  for (const m of [1, -1]) { for (let i = 0; i < 6; i++) { const p = [bz(i / 6, 1), bz((i + 1) / 6, 1), bz((i + 1) / 6, 1.17), bz(i / 6, 1.17)].map(([x, y]) => [540 + (x - 540) * m, y]); s += gp(p, i % 2 ? G.stone1 : G.stone0, 960 + i + m * 9, { amp: 1 }); }
    const x0 = m > 0 ? 58 : 952, x1 = x0 + 70;
    s += gp([[x0 - 12, 386], [x1 + 12, 386], [x1, 450], [x0, 450]], G.wall2, 970 + m, { amp: 1 }) + gp([[x0, 1270], [x1, 1270], [x1 + 14, 1340], [x0 - 14, 1340]], G.wall2, 972 + m, { amp: 1 });
    for (let i = 0; i < 4; i++) s += gp([[x0 + 6, 450 + i * 205], [x1 - 6, 450 + i * 205], [x1 - 6, 655 + i * 205], [x0 + 6, 655 + i * 205]], i % 2 ? G.stone1 : G.stone0, 974 + i + m * 7, { amp: 1 }); }
  s += field(0, 1340, PW, PH, { cw: 136, ch: 116, grid: 1, seed: 55, col: (u, v, id, r, j) => (r + j) % 2 ? G.stone1 : G.roof0 });
  if (o.chest !== false) { s += gp([[820, 1420], [1010, 1420], [1010, 1550], [820, 1550]], G.wood0, 980) + gd("M812,1420 Q915,1330 1018,1420 Z", G.wood1, 981) + pl("M820,1470 L1010,1470 M915,1420 L915,1550", 5, PAINT, 0.6);
    for (let i = 0; i < 9; i++) s += gcoin(846 + (i % 5) * 34 + jit(i + 990, 8), 1404 - Math.floor(i / 5) * 20 + jit(i + 995, 5), { r: 13, flip: 0.06 + hash(i) * 0.08 }); }
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 11));
}
// a plain diapered ground for close-ups: draw the figure big over it (st.s 9..14), so the lead stays fine and the paint gets bold
export function backdrop(t = 0, o = {}) { return diaper(0, 0, o.w || PW, PH, o.seed || 57, o.cell || 90) + (o.border === false ? "" : border(0, 0, o.w || PW, PH, 13)); }

// THE CHURCH AND THE STREET AT NIGHT (mood "moon"). o { lit 0..1 (church windows), doors 0..n (houses' doors opening one by
// one: 1.5 = first open, second halfway), border }. CHURCH.doors = where the children step out, CHURCH.far = the piper's
// spot at the far end, CHURCH.line = the path the children take.
export const CHURCH = { far: [1004, 1318], sFar: 0.95, doors: [], line: [[70, 1760, 3.0], [330, 1700, 2.8], [640, 1560, 2.3], [880, 1400, 1.6], [1010, 1322, 1.05]] };
export function church(t = 0, o = {}) {
  const lit = o.lit ?? 1, win = mix(G.dark, G.win, lit);
  let s = gsky(930, 61, { stars: 1, moon: [872, 226, 66] });
  s += gp([[60, 262], [190, -50], [320, 262]], G.roof0, 1000) + gp([[124, 262], [190, -50], [256, 262]], G.roof1, 1001, { amp: 0.5 }) + pl("M190,-50 l0,-50 M172,-80 l36,0", 7, LEAD);
  s += field(86, 262, 296, 1010, { cw: 108, ch: 84, seed: 63, col: (u, v, id) => id % 3 ? G.stone0 : G.stone1 });
  s += field(270, 396, 880, 540, { cw: 124, ch: 72, seed: 65, col: (u, v, id) => id % 2 ? G.roof0 : G.roof1 }) + field(296, 540, 860, 1010, { cw: 150, ch: 94, seed: 67, col: (u, v, id) => id % 3 ? G.stone1 : G.stone0 });
  const lancet = (x, y0, y1, w, sd, heads) => { const fl = 0.9 + 0.1 * Math.sin(t * 5 + sd); let g = gd(`M${x},${y0 + w * 0.7} Q${x},${y0} ${x + w / 2},${y0 - w * 0.25} Q${x + w},${y0} ${x + w},${y0 + w * 0.7} Z`, mix(win, "#ff8a2a", 0.3 * fl), sd, { w: 0.9, c: [x + w / 2, y0 + w * 0.3, w * 0.22] });
    const m = (y0 + w * 0.7 + y1) / 2; g += gp([[x, y0 + w * 0.7], [x + w, y0 + w * 0.7], [x + w, m], [x, m]], win, sd + 1, { amp: 0.6 }) + gp([[x, m], [x + w, m], [x + w, y1], [x, y1]], mix(win, "#ffe9a0", 0.35), sd + 2, { amp: 0.6 }) + `<path d="M${x + w / 2},${y0 - w * 0.2} L${x + w / 2},${y1}" stroke="${LEAD}" stroke-width="${LW * 0.6}"/>`;
    if (heads && lit > 0.4) for (let i = 0; i < 3; i++) { const hx = x + w * (0.2 + 0.3 * i) + jit(sd + i, 4), hy = y1 - 6; g += `<path d="M${n(hx - 13)},${hy} q1,-20 13,-21 q12,1 13,21 Z M${n(hx)},${hy - 20} m-8,-9 a8,9 0 1 0 16,0 a8,9 0 1 0 -16,0" fill="${PAINT}" opacity="0.75"/>`; }
    return g; };
  [340, 472, 604, 736].forEach((x, i) => { s += lancet(x, 620, 900, 84, 1010 + i * 5, true); });
  s += lancet(158, 380, 520, 60, 1040) + gd("M146,1010 L146,880 Q190,810 236,880 L236,1010 Z", G.wood0, 1045, { w: 0.9 }) + pl("M190,836 L190,1010", 4, PAINT, 0.6);
  CHURCH.doors = [];
  [[14, 250, 230, 71], [276, 236, 280, 72], [560, 244, 240, 73], [816, 250, 270, 74]].forEach(([x, w, h, sd], i) => { const hs = ghouse(x, 1270, w, h, sd, { door: clamp((o.doors || 0) - i), lit: 0.15 }); s += hs.svg; CHURCH.doors.push(hs.door); });
  s += field(0, 1270, PW, PH, { cw: 160, ch: 94, seed: 69, col: (u, v, id) => id % 3 ? G.gnd0 : G.gnd1 });
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 15));
}

// THE KOPPEN: a hill, a winding path, a dark cleft at the top. Fog rolls in low from both sides and CLOSES like a door.
// o { fog 0..1 (1 = shut: all white, one seam down the middle), open 0..1 (the cleft), moon, border }
export const HILL = { path: [[540, 1900, 3.4], [470, 1640, 2.7], [612, 1380, 2.0], [482, 1150, 1.4], [574, 962, 0.95], [544, 820, 0.6]], foot: [300, 1790], girl: [770, 1820], cleft: [544, 800] };
export function hill(t = 0, o = {}) {
  const fog = clamp(o.fog || 0), hy = (x) => 610 + ((x - 540) / 560) ** 2 * 540;
  let s = gsky(900, 81, { moon: o.moon, stars: o.stars });
  s += gd("M-20,860 Q120,640 330,760 L330,1000 L-20,1000 Z", G.leaf0, 1100) + gd("M760,790 Q950,620 1100,800 L1100,1000 L760,1000 Z", G.leaf0, 1101);
  const xs = [-20, 150, 330, 470, 610, 760, 930, 1100];
  for (let b = 0; b < 4; b++) for (let i = 0; i < xs.length - 1; i++) { const sh = (b % 2) * 60, xa = Math.max(-20, xs[i] + (i ? sh : 0)), xb = Math.min(1100, xs[i + 1] + (i < xs.length - 2 ? sh : 0)), ya = (x, f) => lerp(hy(x), 1310, f);
    if (ya(xa, (b + 1) / 4) - ya(xa, b / 4) < 8 && ya(xb, (b + 1) / 4) - ya(xb, b / 4) < 8) continue;
    const xm = (xa + xb) / 2; s += gp([[xa, ya(xa, b / 4)], [xm, ya(xm, b / 4)], [xb, ya(xb, b / 4)], [xb, ya(xb, (b + 1) / 4)], [xm, ya(xm, (b + 1) / 4)], [xa, ya(xa, (b + 1) / 4)]], (b + i) % 2 ? G.leaf0 : G.leaf1, 1110 + b * 10 + i, { amp: 2 }); }
  s += field(0, 1310, PW, PH, { cw: 190, ch: 104, seed: 83, col: (u, v, id) => id % 3 ? G.leaf0 : G.gnd0 });
  [[150, 1210, 1], [250, 1060, 0.8], [860, 1180, 1], [940, 1010, 0.75], [770, 900, 0.6], [330, 880, 0.6], [80, 1430, 1.3], [990, 1480, 1.3]].forEach(([x, y, k], i) => { s += gp([[x - 9 * k, y], [x + 9 * k, y], [x + 9 * k, y + 40 * k], [x - 9 * k, y + 40 * k]], G.wood0, 1150 + i, { amp: 0.5, plain: 1 }) + gp([[x - 52 * k, y], [x + 52 * k, y], [x, y - 96 * k]], G.roof0, 1160 + i, { amp: 1.5 }) + gp([[x - 40 * k, y - 70 * k], [x + 40 * k, y - 70 * k], [x, y - 160 * k]], G.roof1, 1170 + i, { amp: 1.5 }); });
  const pth = HILL.path, wd = [170, 120, 86, 58, 36, 20];
  for (let i = 0; i < pth.length - 1; i++) s += gp([[pth[i][0] - wd[i] / 2, pth[i][1]], [pth[i][0] + wd[i] / 2, pth[i][1]], [pth[i + 1][0] + wd[i + 1] / 2, pth[i + 1][1]], [pth[i + 1][0] - wd[i + 1] / 2, pth[i + 1][1]]], i % 2 ? G.gnd1 : G.stone1, 1180 + i, { amp: 2 });
  const ow = 26 * (o.open ?? 1); if (ow > 1) s += gd(`M${544 - ow},826 Q${544 - ow * 0.4},716 548,694 Q${544 + ow * 0.9},730 ${544 + ow},826 Z`, "#07050f", 1190, { w: 0.9, v: 0 });
  if (fog > 0) s += fogDoors(fog, t);
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 17));
}
// the fog as two doors of pale panes. fog 0..1; lower rows lead (it rolls along the ground), at 1 the seam is straight and shut
export function fogDoors(fog, t = 0, w = PW) {
  const R = 10, rh = PH / R, cols = ["#f8f6f0", "#e8ecf6", "#dce2f2", "#efe9f6", "#ffffff"]; let s = "";
  for (let r = 0; r < R; r++) {
    const pr = ease(clamp(fog * 1.36 - (1 - r / (R - 1)) * 0.36)), yT = r * rh, yB = yT + rh + 2;
    if (pr <= 0) continue;
    for (const m of [1, -1]) {
      const edge = lerp(-80, w / 2, pr), bulge = (1 - pr) * (56 + 26 * Math.sin(t * 0.9 + r * 1.7 + m)) + 0.5, X = (x) => (m > 0 ? x : w - x), x0 = -30;
      const lead = [[edge - 60, yT], [edge - 10, yT], [edge + bulge * 0.7, yT + rh * 0.22], [edge + bulge, yT + rh * 0.5], [edge + bulge * 0.6, yT + rh * 0.8], [edge - 10, yB], [edge - 60, yB]].map(([x, y]) => [X(x), y]);
      s += gp(lead, cols[(r * 2 + (m > 0 ? 0 : 3)) % 5], 1200 + r * 7 + m, { amp: 0, v: 0.06 });
      for (let x = edge - 60, j = 0; x > x0; j++) { const wd = 190 + 110 * hash(r * 11 + j + (m > 0 ? 0 : 50)), xa = Math.max(x0, x - wd); s += gp([[X(xa), yT], [X(x), yT], [X(x), yB], [X(xa), yB]], cols[(r + j * 2 + (m > 0 ? 1 : 2)) % 5], 1300 + r * 13 + j * 3 + m, { amp: 1.5, v: 0.06 }); x = xa; }
    }
  }
  return s;
}

// THE TOY: a small wooden horse left on the cobbles. o { fog 0..1 (wisps slide across), tip 0..1, border }
export const TOY = { spot: [520, 1120], s: 13 };
export function toy(t = 0, o = {}) {
  let s = field(0, 0, PW, PH, { cw: 250, ch: 174, seed: 91, col: (u, v, id) => id % 4 === 0 ? G.stone0 : id % 2 ? G.gnd0 : G.gnd1 });
  for (let i = 0; i < 12; i++) { const x = 60 + hash(i + 1400) * 960, y = 80 + hash(i + 1410) * 1760; s += pl(`M${n(x)},${n(y)} q${n(jit(i, 30))},${n(20 + 20 * hash(i))} ${n(jit(i + 1, 50))},${n(50 + 30 * hash(i + 2))}`, 2.4, PAINT, 0.35); }
  s += horseToy(TOY.spot[0], TOY.spot[1], { s: o.s ?? TOY.s, tip: o.tip || 0 });
  const f = clamp(o.fog || 0);
  if (f > 0) for (let i = 0; i < 7; i++) { const y = 1260 + i * 96 + (i % 2) * 30, e = lerp(-200, 1300, ease(clamp(f * 1.5 - i * 0.07))), m = i % 2 ? 1 : -1, X = (x) => (m > 0 ? x : PW - x), b = 50 + 20 * Math.sin(t + i);
    s += gp([[-40, y + 8], [e - 120, y], [e - 20, y + 10], [e + b * 0.7, y + 30], [e + b, y + 52], [e + b * 0.6, y + 78], [e - 40, y + 96], [-40, y + 100]].map(([x, yy]) => [X(x), yy]), ["#f8f6f0", "#e8ecf6", "#dce2f2"][i % 3], 1420 + i, { amp: 0, v: 0.06 }); }
  return s + (o.border === false ? "" : border(0, 0, PW, PH, 19));
}
