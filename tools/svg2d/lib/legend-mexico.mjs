// Legend channel, episode 2 set + creature (La Lechuza, northern Mexico / South Texas), code-drawn in the ep 1 projection.
// World: metres, X right, Y up, Z into the picture. Creature local units: cm, feet at 0, up = -y (like the cast).
// Colour is beat-driven: call mood(threat) FIRST in every frame (threat -1 relief/warm flood .. 0 calm .. 1 owl close/cold).
// Hand-made feel: every wobble, dab, crack and chip is seeded (hash), so nothing boils from frame to frame.
import { W, H, INK, P, PAL, n, lerp, clamp, hash, mix, defs as baseDefs } from "./legend.mjs";

const NEAR = 0.24;
const vis = (c, Z) => Z - c.z > NEAR;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const pts = (a) => a.map(pt).join(" ");
const poly = (a, fill, extra = "") => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
const quadPt = (q, u, v) => { const top = { x: lerp(q[0].x, q[1].x, u), y: lerp(q[0].y, q[1].y, u) }, bot = { x: lerp(q[3].x, q[2].x, u), y: lerp(q[3].y, q[2].y, u) }; return { x: lerp(top.x, bot.x, v), y: lerp(top.y, bot.y, v) }; };
const sub = (q, u0, u1, v0, v1) => [quadPt(q, u0, v0), quadPt(q, u1, v0), quadPt(q, u1, v1), quadPt(q, u0, v1)];
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const lineD = (a, close = false) => "M" + a.map(pt).join(" L") + (close ? " Z" : "");
// a closed soft shape through points (quadratic through the midpoints)
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
// a world polygon with hand-wobbled edges. pts3 [[X,Y,Z],...]; amp metres; per = metres between wobble points
function wpoly(c, pts3, seed, amp = 0.012, per = 0.4) {
  const out = [];
  pts3.forEach((a, i) => {
    const b = pts3[(i + 1) % pts3.length], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), k = Math.max(1, Math.round(len / per));
    for (let j = 0; j < k; j++) { const u = j / k, id = seed * 131 + i * 17 + j; out.push(P(c, lerp(a[0], b[0], u) + jit(id, amp), lerp(a[1], b[1], u) + jit(id + 0.5, amp), lerp(a[2], b[2], u))); }
  });
  return out;
}
// an ink line whose weight swells and thins (k = px per local unit, so the swells stay glued to the drawing)
function ink(d, w, seed = 1, k = 1, col = INK) {
  const da = Array.from({ length: 6 }, (_, i) => n((7 + hash(seed * 7 + i) * 30) * k)).join(" ");
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w * 1.9)}" stroke-dasharray="${da}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// hand-placed brush dabs on a wall plane
function dabs(c, x0, x1, y0, y1, Z, count, seed, cols, skip) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const X = lerp(x0, x1, hash(seed + i * 3)), Y = lerp(y0, y1, hash(seed + i * 3 + 1));
    if (skip && skip(X, Y)) continue;
    const p = P(c, X, Y, Z), len = (0.1 + 0.3 * hash(seed + i * 3 + 2)) * p.s, a = jit(seed + i * 5, 0.22), w = (0.022 + 0.04 * hash(seed + i * 7)) * p.s;
    s += `<path d="M${pt(p)} l${n(len * Math.cos(a))},${n(len * Math.sin(a))}" stroke="${cols[i % cols.length]}" stroke-width="${n(w)}" stroke-linecap="round" opacity="${n(0.35 + 0.4 * hash(seed + i * 11))}"/>`;
  }
  return s;
}
// painted light: nested hand-cut flat shapes, screen blend (no smooth glow)
function lightBlobs(p, radii, col, alphas, seed, squash = 1) {
  let s = "";
  radii.forEach((r, j) => {
    const a = Array.from({ length: 18 }, (_, i) => { const an = i / 18 * Math.PI * 2, rr = r * p.s * (1 + jit(seed + j * 31 + i, 0.07)); return { x: p.x + Math.cos(an) * rr, y: p.y + Math.sin(an) * rr * squash }; });
    s += `<path d="${blob(a)}" fill="${col}" opacity="${n(alphas[j])}" style="mix-blend-mode:screen"/>`;
  });
  return s;
}

// ---------------------------------------------------------------- beat-driven colour: [relief, calm, threat] or
// [relief, calm, halfway, threat] where a straight blend would go muddy (warm orange to cold blue goes through magenta)
const MOODS = {
  sky0: ["#1a0f4a", "#0c0a3c", "#020c22"], sky1: ["#3a1a8a", "#1b1a80", "#062a4a"], sky2: ["#7a2aa8", "#4a24a6", "#0b4f63"], sky3: ["#d83f8a", "#a8349c", "#1f7f72"], sky4: ["#ff8a3a", "#ff5f4a", "#a8e09a"],
  fog: ["#8a4a9a", "#5a3a9c", "#1f5f6a"], fogC: ["#ffa07a", "#b48ae0", "#9fe6c4"], mesa0: ["#5a2a8f", "#3a2590", "#0e4560"], mesa1: ["#45207a", "#2c1c78", "#0a3550"],
  moon: ["#fff0c0", "#fff3d0", "#eaffd6"], moonS: ["#f2c890", "#e6cfa8", "#b4e6ae"], cloud: ["#a04aa0", "#5a3ab0", "#145a6a"],
  dirt: ["#7a3a86", "#55308a", "#173e5c"], dirt2: ["#a8508a", "#7a44a8", "#24587a"], dirt3: ["#5f2c78", "#432678", "#102f4c"],
  wall: ["#c9507a", "#9a3f8a", "#2a5578"], wall2: ["#e06a7a", "#b3509a", "#356a8c"], wallS: ["#7a2f82", "#5a2a86", "#173a5e"], adobe: ["#b8452f", "#8f3560", "#1f4560"],
  wood: ["#8a4a4a", "#6a3a6a", "#24405a"], woodS: ["#5a2a4a", "#40224f", "#142a44"], turq: ["#1fd6c0", "#14c4b8", "#3fd0c0"], turqS: ["#0f8f9a", "#0c7f96", "#1a7f8a"],
  light: ["#ffb41f", "#ffa51f", "#ffa030"], light2: ["#ff6a1f", "#ff6f24", "#ff5a24"], room: ["#ffb02a", "#ff9a24", "#ff9a24"], roomS: ["#d8502a", "#c9442c", "#a03a50"],
  leaf: ["#3a2a7a", "#2a2472", "#0a3a48"], leaf2: ["#5a3a9a", "#3f3590", "#125262"], nopal: ["#2f8f7a", "#1f7a80", "#14606a"], nopalS: ["#1f5f70", "#164f6c", "#0c4050"], tuna: ["#ff3f8a", "#f02f7a", "#b03f8a"],
  cloth: ["#fff0e0", "#ece6ff", "#c8f0e0"], clothS: ["#d8a8c8", "#a89ae0", "#7fb8b8"], chile: ["#f0283f", "#e0263f", "#ff3048"],
  owlFace: ["#fff6e0", "#f6f0e0", "#f0ffe0"], owlFaceS: ["#f0d0b0", "#d8c8d0", "#b4dcb8"], owlBreast: ["#fff0d8", "#efe6dc", "#e0f4dc"], owlBuff: ["#f0a030", "#e0902f", "#c8a070"], owlBuffS: ["#b05a3a", "#9a4a50", "#6a6a80"], owlGrey: ["#9a6aa0", "#7a5aa0", "#2f6078"], owlDark: ["#4a2350", "#3a2058", "#0e2a40"],
  iwall: ["#ffb030", "#f59a2a", "#c84a8a", "#4a5ab0"], iwallL: ["#ffd060", "#ffc24a", "#ffb060", "#f0a860"], iwallS: ["#e0503a", "#c9403f", "#8a2a8a", "#2a2f7a"], dado: ["#14a8a0", "#0f9a9a", "#1a8a9a", "#2a7a9a"], dadoS: ["#0c6f80", "#0a6078", "#12527a", "#1a3f6a"],
  ceil: ["#a8303f", "#8f2a4a", "#5a2068", "#1a1f50"], floor: ["#e0602f", "#cc522f", "#a03a7a", "#3a4a8a"], floor2: ["#f07a3a", "#dd6a38", "#c05080", "#5a6ab0"], floorS: ["#a83a30", "#96303a", "#6a2470", "#232a60"], grout: ["#7a2238", "#6a1f3c", "#40184f", "#12163c"],
};
export const M = {};
let TH = 0;
// set the colour mood for this frame. threat: -1 (warm relief) .. 0 (calm night) .. 1 (the owl is close: warm drains, cold creeps in)
export function mood(threat = 0) {
  TH = Math.max(-1, Math.min(1, threat));
  for (const k in MOODS) { const m = MOODS[k]; M[k] = TH < 0 ? mix(m[1], m[0], -TH) : m.length === 4 ? (TH < 0.5 ? mix(m[1], m[2], TH * 2) : mix(m[2], m[3], TH * 2 - 1)) : mix(m[1], m[2], TH); }
  PAL.mexico = { sky: [M.sky0, M.sky1, M.sky2, M.sky3, M.sky4], fog: M.fog, fogC: M.fogC, hills: [M.mesa0, M.mesa1], pag: [M.mesa0, M.mesa1], moon: true, stars: true };
  return M;
}
mood(0);
export const defs = () => baseDefs("mexico");
// the grade over the whole picture (cast included), last layer before the vignette
export function grade() {
  if (TH > 0.02) return `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#b6d8f0", TH)}" style="mix-blend-mode:multiply"/>`;
  if (TH < -0.02) return `<rect width="${W}" height="${H}" fill="#ff7a1a" opacity="${n(-TH * 0.2)}" style="mix-blend-mode:screen"/>`;
  return "";
}
const fade = (col, z) => mix(col, M.fog, clamp((z - 9) / 34) * 0.7);
let UID = 0;
export function resetIds() { UID = 0; }

// ---------------------------------------------------------------- sky, mesas, ground, fog
// o: { moon: [x, y, r] in screen px }
export function sky(c, t, o = {}) {
  const [mx0, my0, R] = o.moon || [800, 330, 120], dy = (c.y - 1.3) * 40, mx = mx0 - c.x * 20, my = my0 + dy;
  let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // painted streaks: long hand-laid brush marks across the gradient
  const band = [M.sky1, M.sky2, M.sky3, M.sky2, M.sky3, M.sky4];
  for (let i = 0; i < 30; i++) {
    const y = 120 + hash(i + 200) * 1000 + dy, x = hash(i + 230) * 1300 - 200 - c.x * 10, w = 160 + 420 * hash(i + 260), h = 5 + 13 * hash(i + 290);
    s += `<path d="M${n(x)},${n(y)} q${n(w * 0.3)},${n(-h)} ${n(w * 0.62)},${n(-h * 0.3)} t${n(w * 0.38)},${n(h * 0.5)} q${n(-w * 0.4)},${n(h * 0.9)} ${n(-w)},${n(-h * 0.2)} Z" fill="${band[Math.min(5, Math.floor((y - dy) / 190))]}" opacity="${n(0.28 + 0.3 * hash(i + 320))}"/>`;
  }
  // stars: little hand-cut four-point sparks, no two alike
  for (let i = 0; i < 64; i++) {
    const x = hash(i) * W - c.x * 8, y = hash(i + 50) * 900 + dy, r = 1.6 + hash(i + 99) ** 2 * 5, tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hash(i + 3) * 3) + i), q = r * 0.28, rot = jit(i + 7, 20);
    s += `<path d="M0,${n(-r)} L${n(q)},${n(-q)} L${n(r * (0.8 + 0.4 * hash(i + 5)))},0 L${n(q)},${n(q)} L0,${n(r)} L${n(-q)},${n(q)} L${n(-r)},0 L${n(-q)},${n(-q)} Z" fill="#fff6e0" opacity="${n((0.3 + 0.6 * hash(i + 7)) * tw)}" transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})"/>`;
  }
  // the moon: a hand-cut disc, two flat halo rings, a painted shade side and craters
  const ring = (r, seed) => blob(Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2, rr = r * (1 + jit(seed + i, 0.018)); return { x: mx + Math.cos(a) * rr, y: my + Math.sin(a) * rr }; }));
  s += `<path d="${ring(R * 2.7, 11)}" fill="${M.moon}" opacity="0.035"/><path d="${ring(R * 2.1, 14)}" fill="${M.moon}" opacity="0.04"/><path d="${ring(R * 1.6, 12)}" fill="${M.moon}" opacity="0.05"/><path d="${ring(R * 1.25, 15)}" fill="${M.moon}" opacity="0.07"/><path d="${ring(R, 13)}" fill="${M.moon}"/>`;
  s += `<path d="M${n(mx + R * 0.2)},${n(my - R * 0.97)} Q${n(mx + R * 1.32)},${n(my)} ${n(mx + R * 0.15)},${n(my + R * 0.98)} Q${n(mx + R * 0.82)},${n(my)} ${n(mx + R * 0.2)},${n(my - R * 0.97)} Z" fill="${M.moonS}" opacity="0.75"/>`;
  for (const [ax, ay, r] of [[-0.32, -0.3, 0.17], [0.2, 0.34, 0.12], [-0.42, 0.36, 0.08], [0.32, -0.46, 0.07], [-0.08, 0.08, 0.06], [-0.6, -0.02, 0.05]]) s += `<ellipse cx="${n(mx + ax * R)}" cy="${n(my + ay * R)}" rx="${n(r * R)}" ry="${n(r * R * 0.85)}" fill="${M.moonS}" opacity="0.8" transform="rotate(${n(jit(r * 100, 25))} ${n(mx + ax * R)} ${n(my + ay * R)})"/>`;
  // flat streak clouds drifting across
  for (let i = 0; i < 5; i++) {
    const y = 200 + i * 100 + 30 * hash(i + 9) + dy, x = ((hash(i + 13) * 1500 + t * (9 + 6 * hash(i))) % 1700) - 350, w = 320 + 280 * hash(i + 4);
    s += `<path d="M${n(x)},${n(y)} q${n(w * 0.2)},-30 ${n(w * 0.45)},-10 q${n(w * 0.18)},-26 ${n(w * 0.4)},-2 q${n(w * 0.1)},10 ${n(w * 0.15)},18 q${n(-w * 0.5)},14 ${n(-w)},-6 Z" fill="${M.cloud}" opacity="${n(0.45 + 0.25 * hash(i + 2))}"/>`;
  }
  return s;
}
export function far(c) {
  const hy = c.h0 ?? 1140, k0 = (c.y - 1.3) * 20;
  const mesa = (y, col, k, amp, seed) => {
    let d = `M-80,${n(y + 500)} L-80,${n(y)}`, x = -80 - c.x * k;
    for (let i = 0; i < 12; i++) {
      const w = 80 + 130 * hash(seed + i), flat = hash(seed + i + 40) > 0.42, h = amp * (flat ? 0.5 + 0.5 * hash(seed + i + 80) : 0.12 * hash(seed + i + 80));
      d += ` L${n(x + 14)},${n(y - h)} L${n(x + w * 0.5)},${n(y - h - jit(seed + i, 4))} L${n(x + w - 16)},${n(y - h + 3)} L${n(x + w)},${n(y - h * 0.3)}`; x += w;
    }
    return `<path d="${d} L1200,${n(y + 500)} Z" fill="${col}"/>`;
  };
  let s = mesa(hy - 22 + k0, M.mesa0, 10, 120, 3) + mesa(hy + 8 + k0, M.mesa1, 18, 60, 31);
  // far yucca and ocotillo spikes on the ridge
  for (let i = 0; i < 9; i++) {
    const x = hash(i + 700) * 1200 - 60 - c.x * 18, y = hy + 6 + k0 - 12 * hash(i + 720), h = 22 + 30 * hash(i + 740);
    for (let j = -2; j <= 2; j++) s += `<path d="M${n(x)},${n(y)} q${n(j * 3)},${n(-h * 0.6)} ${n(j * (7 + 4 * hash(i * 9 + j)))},${n(-h * (1 - Math.abs(j) * 0.14))}" stroke="${M.mesa1}" stroke-width="${n(2.4 - Math.abs(j) * 0.4)}" fill="none" stroke-linecap="round"/>`;
  }
  s += `<rect width="${W}" height="560" y="${n(hy - 360)}" fill="url(#fog)"/>`;
  return s;
}
export function ground(c, t) {
  const hy = Math.min(H, P(c, 0, 0, 90).y);
  let s = `<rect x="0" y="${n(hy)}" width="${W}" height="${H}" fill="${fade(M.dirt, 40)}"/>`;
  let row = 0;
  // the dust yard: overlapping hand-laid patches, row by row
  for (let z = 44; z > c.z + NEAR + 0.3; z /= 1.16, row++) {
    const dz = z * 0.16;
    for (let j = 0; j < 7; j++) {
      const X = -9 + j * 3 + jit(row * 13 + j, 1.4) + c.x * 0, w = 1.2 + 1.6 * hash(row * 17 + j), p = P(c, X, 0, z), ry = Math.max(2, (P(c, X, 0, z - dz * 0.5).y - p.y));
      if (p.x < -400 || p.x > W + 400 || p.y > H + 200) continue;
      const col = [M.dirt2, M.dirt3, M.dirt][(row + j * 2) % 3];
      s += `<path d="M${n(p.x - w * p.s)},${n(p.y)} q${n(w * p.s * 0.5)},${n(-ry * (0.6 + hash(row + j)))} ${n(w * p.s)},${n(-ry * 0.2)} t${n(w * p.s)},${n(ry * 0.3)} q${n(-w * p.s * 0.6)},${n(ry * (0.7 + hash(row * 3 + j)))} ${n(-w * p.s * 2)},${n(-ry * 0.1)} Z" fill="${fade(col, z)}" opacity="0.8"/>`;
    }
  }
  // the worn path to the door, pebbles, dry grass
  for (let i = 0; i < 9; i++) { const z = 3 + i * 0.7, p = P(c, -1.75 + jit(i + 5, 0.12) + (8.8 - z) * 0.12, 0, z); if (vis(c, z)) s += `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(0.55 * p.s)}" ry="${n(0.09 * p.s)}" fill="${M.dirt2}" opacity="0.6"/>`; }
  for (let i = 0; i < 16; i++) {   // cracks in the dry dust
    const X = jit(i + 600, 5.5), Z = 2.6 + hash(i + 620) * 6; if (!vis(c, Z)) continue;
    const cr = []; let x = X, zz = Z; for (let j = 0; j < 5; j++) { cr.push(P(c, x, 0, zz)); x += 0.1 + 0.18 * hash(i * 7 + j); zz += jit(i * 9 + j, 0.14); }
    s += `<path d="${lineD(cr)}" stroke="${fade(M.dirt3, Z)}" stroke-width="${n(Math.max(0.8, 0.012 * cr[0].s))}" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M${pt(cr[2])} l${n(0.06 * cr[0].s)},${n(0.03 * cr[0].s)}" stroke="${fade(M.dirt3, Z)}" stroke-width="${n(Math.max(0.7, 0.009 * cr[0].s))}" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 70; i++) {
    const X = jit(i + 900, 6.5), Z = 2.2 + hash(i + 950) * 9; if (!vis(c, Z)) continue;
    const p = P(c, X, 0, Z); if (p.x < -40 || p.x > W + 40 || p.y > H + 30) continue;
    if (i % 3) s += `<path d="M${n(p.x - 0.05 * p.s)},${n(p.y)} q${n(0.02 * p.s)},${n(-0.045 * p.s)} ${n(0.06 * p.s)},${n(-0.03 * p.s)} q${n(0.05 * p.s)},${n(0.005 * p.s)} ${n(0.045 * p.s)},${n(0.03 * p.s)} Z" fill="${fade(i % 2 ? M.wallS : M.dirt2, Z)}" stroke="${INK}" stroke-width="${n(Math.max(0.5, 0.006 * p.s))}"/>`;
    else for (let j = -2; j <= 2; j++) s += `<path d="M${n(p.x + j * 0.015 * p.s)},${n(p.y)} q${n(j * 0.02 * p.s)},${n(-0.1 * p.s)} ${n(j * 0.06 * p.s + Math.sin(t * 1.4 + i) * 0.01 * p.s)},${n(-(0.2 - Math.abs(j) * 0.03 + 0.06 * hash(i * 5 + j)) * p.s)}" stroke="${fade(j % 2 ? M.light2 : M.wall2, Z)}" stroke-width="${n(Math.max(0.6, 0.012 * p.s))}" fill="none" stroke-linecap="round" opacity="0.75"/>`;
  }
  return s;
}
// low drifting fog: flat hand-cut wisps (zs = the depths to lay it at)
export function fog(c, t, zs = [12, 8.2, 6.2]) {
  let s = "";
  zs.forEach((z, i) => {
    if (!vis(c, z)) return;
    for (let j = 0; j < 3; j++) {
      const X = ((hash(i * 7 + j) * 16 + t * (0.12 + 0.08 * hash(i + j * 3))) % 16) - 8, p = P(c, X, 0.22 + 0.2 * hash(i + j), z), w = (2.2 + 2 * hash(i * 3 + j)) * p.s, h = (0.2 + 0.16 * hash(i + j * 5)) * p.s;
      s += `<path d="M${n(p.x - w)},${n(p.y)} q${n(w * 0.3)},${n(-h)} ${n(w * 0.7)},${n(-h * 0.5)} q${n(w * 0.4)},${n(-h * 0.9)} ${n(w * 0.8)},${n(-h * 0.1)} q${n(w * 0.4)},${n(h * 0.2)} ${n(w * 0.5)},${n(h * 0.6)} q${n(-w * 0.5)},${n(h * 0.9)} ${n(-w * 1.1)},${n(h * 0.3)} q${n(-w * 0.5)},${n(h * 0.5)} ${n(-w * 0.9)},${n(-h * 0.3)} Z" fill="${M.fogC}" opacity="${n(0.13 + 0.1 * hash(i * 11 + j))}"/>`;
    }
  });
  return s;
}

// ---------------------------------------------------------------- window parts shared by both views
function hole(c, w, zn, zf, behind, cols) {
  const id = `mh${UID++}`;
  const q = (z) => [P(c, w.x0, w.y1, z), P(c, w.x1, w.y1, z), P(c, w.x1, w.y0, z), P(c, w.x0, w.y0, z)];
  const A = q(zn), B = q(zf);
  let s = `<clipPath id="${id}a"><polygon points="${pts(A)}"/></clipPath><clipPath id="${id}b"><polygon points="${pts(B)}"/></clipPath><g clip-path="url(#${id}a)"><g clip-path="url(#${id}b)">${behind}</g>`;
  if (c.x > w.x0) s += poly([A[0], B[0], B[3], A[3]], cols.l);
  if (c.x < w.x1) s += poly([A[1], B[1], B[2], A[2]], cols.r);
  if (c.y < w.y1) s += poly([A[0], A[1], B[1], B[0]], cols.t);
  if (c.y > w.y0) s += poly([A[3], A[2], B[2], B[3]], cols.b);
  return { s: s + `</g>`, A, B };
}
// one shutter leaf: hinge at (hx, hz), swings by ang degrees; dir = +1 leaf runs to the right when closed; swing = -1 toward the camera
function leaf(c, hx, hz, dir, swing, wd, y0, y1, ang, seed, o = {}) {
  const a = ang * Math.PI / 180, fx = hx + dir * wd * Math.cos(a), fz = hz + swing * wd * Math.sin(a);
  if (!vis(c, Math.min(hz, fz))) return { s: "", q: null };
  const q = [P(c, hx, y1, hz), P(c, fx, y1, fz), P(c, fx, y0, fz), P(c, hx, y0, hz)], k = q[0].s;
  let s = "";
  for (let i = 0; i < 3; i++) {
    const pl = sub(q, i / 3 + 0.012, (i + 1) / 3 - 0.012, jit(seed + i, 0.008), 1 - Math.abs(jit(seed + i + 3, 0.012)));
    s += poly(pl, mix(i % 2 ? M.turq : mix(M.turq, M.turqS, 0.35), o.dark ? M.woodS : M.turq, o.dark || 0), `stroke="${INK}" stroke-width="${n(Math.max(0.7, 0.008 * k))}" stroke-linejoin="round"`);
    // wood grain + chipped paint, each chip placed by hand (seeded)
    for (let j = 0; j < 3; j++) { const u = (i + 0.25 + 0.5 * hash(seed + i * 5 + j)) / 3, v0 = 0.06 + 0.8 * hash(seed + i * 9 + j * 3); const a0 = quadPt(q, u, v0), a1 = quadPt(q, u + jit(seed + j, 0.01), v0 + 0.1 + 0.1 * hash(seed + j * 7 + i)); s += `<path d="M${pt(a0)} L${pt(a1)}" stroke="${M.turqS}" stroke-width="${n(Math.max(0.5, 0.006 * k))}" stroke-linecap="round"/>`; }
    for (let j = 0; j < 4; j++) {
      const u = (i + 0.12 + 0.7 * hash(seed + i * 13 + j * 5)) / 3, v = j === 0 ? 0.9 + 0.06 * hash(seed + i) : 0.04 + 0.9 * hash(seed + i * 17 + j * 7), du = 0.035 + 0.04 * hash(seed + j + i * 3), dv = 0.02 + 0.035 * hash(seed + j * 3 + i);
      const ch = [quadPt(q, u, v), quadPt(q, u + du * 0.6, v - dv * 0.4), quadPt(q, u + du, v + dv * 0.3), quadPt(q, u + du * 0.7, v + dv), quadPt(q, u + du * 0.1, v + dv * 0.8)];
      s += poly(ch, j % 2 ? M.wood : M.woodS);
    }
  }
  if (o.battens) for (const v of [0.17, 0.78]) {
    s += poly(sub(q, 0.03, 0.97, v, v + 0.075), M.turqS, `stroke="${INK}" stroke-width="${n(Math.max(0.7, 0.008 * k))}" stroke-linejoin="round"`);
    for (const u of [0.16, 0.5, 0.84]) { const d = quadPt(q, u + jit(seed + u * 10, 0.02), v + 0.037); s += `<circle cx="${n(d.x)}" cy="${n(d.y)}" r="${n(Math.max(1, 0.012 * k))}" fill="${M.woodS}"/>`; }
  }
  // warm light leaking through the cracks when the room behind is lit
  if (o.leak) for (const u of [1 / 3, 2 / 3, 0.995]) { const a0 = quadPt(q, u, 0.03), a1 = quadPt(q, u + jit(seed + u, 0.004), 0.97); s += `<path d="M${pt(a0)} L${pt(a1)}" stroke="${o.leakCol || M.light}" stroke-width="${n(Math.max(1, 0.014 * k) * o.leak)}" stroke-linecap="round" opacity="${n(0.9 * o.leak)}"/>`; }
  s += ink(lineD(q, true), Math.max(0.9, 0.01 * k), seed, k / 100);
  return { s, q };
}
// a poured line of salt on a horizontal surface: from x0 toward x1, amt 0..1 of the way
export function saltLine(c, x0, x1, Y, Z, amt = 1, seed = 5) {
  if (amt <= 0.01 || !vis(c, Z)) return "";
  let s = "", line = [];
  const N = Math.round(Math.abs(x1 - x0) / 0.02);
  for (let i = 0; i <= N * amt; i++) {
    const X = lerp(x0, x1, i / N), p = P(c, X, Y, Z + jit(seed + i, 0.012)); line.push(p);
    for (let j = 0; j < 2; j++) { const g = P(c, X + jit(seed + i * 3 + j, 0.012), Y, Z + jit(seed + i * 5 + j, 0.035)); s += `<circle cx="${n(g.x)}" cy="${n(g.y)}" r="${n(Math.max(0.8, 0.004 * g.s * (0.6 + hash(i + j))))}" fill="#ffffff" opacity="0.9"/>`; }
  }
  return (line.length > 1 ? `<path d="${lineD(line)}" stroke="#f4f1ff" stroke-width="${n(Math.max(1.6, 0.02 * line[0].s))}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : "") + s;
}
// the clay salt jar. st: { X, Y, Z, size (1 = 24 cm tall), tilt deg, pour 0..1 (grains fall from the lip), lid (default: on unless pouring), fall m }
export function saltJar(c, st, t = 0) {
  if (!vis(c, st.Z)) return "";
  const p = P(c, st.X, st.Y || 0, st.Z), k = p.s / 100 * (st.size ?? 1) * 1.35, tilt = st.tilt || 0, pour = st.pour || 0, lid = st.lid ?? pour <= 0;
  const L = (d, x) => `<path d="${d}" transform="translate(${x},-8.6) scale(0.42)" stroke="${M.owlDark}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  let g = `<path d="M-6,0 Q-9.8,-7 -7.2,-13 Q-5,-16 -4.6,-18 L4.6,-18 Q5.2,-16 7,-13.4 Q9.6,-7 6.2,0 Q0,1.2 -6,0 Z" fill="#d8582c" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
    <path d="M2.5,-17.6 Q5,-15 6.6,-12.6 Q8.8,-7 5.6,-0.6 Q4,-6 3.4,-11 Z" fill="#a8383a" opacity="0.8"/>
    <path d="M-8.3,-11.4 Q0,-9.8 8.2,-11.6 L8.6,-5.4 Q0,-3.8 -8.8,-5.6 Z" fill="#f6eeda" stroke="${INK}" stroke-width="0.45"/>
    ${L("M3,-3 Q0,-5.5 -2.4,-3 Q-3.4,-0.8 0,0 Q3.4,1 2,3.4 Q0,5 -3,3", -3.6)}${L("M-3,4.4 L0,-4.4 L3,4.4 M-1.8,1.2 L1.9,1.2", 0.1)}${L("M-2,-4.4 L-2.2,4.2 L3,4", 3.6)}
    <path d="M-7.8,-12.6 q2,1 4,0 t4,0 t4,0 t3.6,-0.4" stroke="#14c4b8" stroke-width="0.8" fill="none"/><path d="M-8.4,-4.4 q2,1 4,0 t4,0 t4,0 t4,-0.2" stroke="#14c4b8" stroke-width="0.8" fill="none"/>
    <path d="M-6.4,-2.2 q1.6,0.8 2.6,0.2 M3,-15 l1.4,1.2" stroke="${INK}" stroke-width="0.4" fill="none"/>
    <ellipse cx="0" cy="-18" rx="4.9" ry="1.3" fill="#7a2a2c" stroke="${INK}" stroke-width="0.6"/>`;
  if (lid) g += `<path d="M-6.4,-16.6 Q-5.4,-21.6 0,-22 Q5.6,-21.4 6.2,-16.8 Q7,-15.4 7.8,-13.6 Q5.4,-15.6 3,-14.4 Q0.4,-16 -2.6,-14.2 Q-5,-15.8 -8,-13.4 Q-7.4,-15.6 -6.4,-16.6 Z" fill="#f02f7a" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/><path d="M-6.2,-17 Q0,-15.4 6,-17.2" stroke="#ffb01f" stroke-width="1" fill="none"/><path d="M5.6,-17 q2.4,1.4 1.6,4" stroke="#ffb01f" stroke-width="0.6" fill="none"/>`;
  else g += `<ellipse cx="0" cy="-17.9" rx="3.6" ry="0.8" fill="#ffffff"/>`;
  let s = `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(tilt)} 0 ${n(-9 * k)}) scale(${k.toFixed(4)})">${g}</g>`;
  if (pour > 0) {
    const a = tilt * Math.PI / 180, d = Math.sign(tilt) || 1, lx = d * 4.6 * k, ly = -18 * k + 9 * k;
    const lip = { x: p.x + lx * Math.cos(a) - ly * Math.sin(a), y: p.y - 9 * k + lx * Math.sin(a) + ly * Math.cos(a) }, fall = (st.fall ?? 0.3) * p.s;
    for (let i = 0; i < 34; i++) {
      if (hash(i + 9) > pour) continue;
      const ph = (t * 1.7 + hash(i)) % 1;
      s += `<circle cx="${n(lip.x + jit(i, 2.4) * k * (0.4 + ph) + d * ph * 3 * k)}" cy="${n(lip.y + ph * ph * fall)}" r="${n(Math.max(0.9, (0.25 + 0.3 * hash(i + 3)) * k))}" fill="#ffffff" opacity="${n(0.95 - ph * 0.3)}"/>`;
    }
  }
  return s;
}

// ---------------------------------------------------------------- EXTERIOR: the adobe house from the dusty yard
export const HOUSE = { x0: -3.1, x1: 1.9, top: 2.5, z: 9, thick: 0.45, win: { x0: 0.42, x1: 1.14, y0: 0.86, y1: 1.6 }, door: { x0: -2.3, x1: -1.45, y1: 1.66 },
  roost: { X: 0.78, Y: 2.5, Z: 8.98 }, kidSpot: { X: 0.78, Z: 9.7, hop: 40 }, sill: { Y: 0.86, Z: 9.2 } };
// Draw glow AFTER grade() so the window stays a warm accent at full threat.
// st: { open 0..1 (shutters; they swing into the room), light 0..1 (the room's lamp), inside: svg drawn in the room behind the
//       window (the kid), salt 0..1 (line on the sill) }. Returns { svg, glow } : draw glow after the actors (screen blend).
export function house(c, t, st = {}) {
  const h = HOUSE, z = h.z, w = h.win, light = (st.light ?? 1) * (1 - 0.15 * Math.max(0, TH)), open = st.open ?? 1;
  if (!vis(c, z)) return { svg: "", glow: "" };
  const k = P(c, 0, 0, z).s;
  let s = "";
  // a lower back room on the left, for mass
  s += poly(wpoly(c, [[-5.4, 0, 10.4], [-5.35, 1.95, 10.4], [-3.0, 2.0, 10.4], [-3.0, 0, 10.4]], 71, 0.02), fade(M.wallS, 14));
  // the wall: battered (wider at the foot), melted corners, an uneven parapet
  const wallPts = [[h.x0 - 0.09, 0, z], [h.x0 - 0.02, 1.2, z], [h.x0 + 0.04, h.top - 0.16, z], [h.x0 + 0.22, h.top, z], [-0.6, h.top + 0.03, z], [h.x1 - 0.24, h.top - 0.01, z], [h.x1 - 0.05, h.top - 0.15, z], [h.x1 + 0.01, 1.2, z], [h.x1 + 0.08, 0, z]];
  const wall = wpoly(c, wallPts, 3, 0.017, 0.42);
  s += `<path d="${lineD(wall, true)}" fill="${M.wall}"/>`;
  // one shade tone: the side away from the moon, and under the parapet
  s += poly(wpoly(c, [[h.x0 - 0.09, 0, z], [h.x0 - 0.02, 1.2, z], [h.x0 + 0.04, h.top - 0.16, z], [h.x0 + 0.22, h.top, z], [h.x0 + 1.5, h.top, z], [h.x0 + 1.05, 1.5, z], [h.x0 + 1.35, 0, z]], 9, 0.03, 0.5), M.wallS, `opacity="0.85"`);
  const skip = (X, Y) => (X > w.x0 - 0.25 && X < w.x1 + 0.3 && Y > w.y0 - 0.25 && Y < w.y1 + 0.3) || (X > h.door.x0 - 0.2 && X < h.door.x1 + 0.2 && Y < h.door.y1 + 0.25);
  s += dabs(c, h.x0 + 0.15, h.x1 - 0.45, 0.3, h.top - 0.3, z, 110, 500, [M.wall2, M.wallS, M.wall2, mix(M.wall, M.light2, 0.25)], skip);
  // patches where the plaster fell and the adobe bricks show
  for (const [bx, by, br, sd] of [[-0.55, 0.42, 0.34, 1], [1.55, 2.0, 0.26, 2], [-2.75, 1.25, 0.26, 3], [0.6, 2.2, 0.2, 4]]) {
    const id = `mb${UID++}`, ring = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2, r = br * (0.7 + 0.5 * hash(sd * 40 + i)); return P(c, bx + Math.cos(a) * r * 1.3, by + Math.sin(a) * r, z); });
    let b = "";
    for (let r = 0; r < 9; r++) {
      const Y = by - br * 1.2 + r * 0.095, a0 = P(c, bx - br * 1.8, Y + jit(sd + r, 0.008), z), a1 = P(c, bx + br * 1.8, Y + jit(sd + r + 9, 0.008), z);
      b += `<path d="M${pt(a0)} L${pt(a1)}" stroke="${M.woodS}" stroke-width="${n(0.016 * k)}"/>`;
      for (let j = 0; j < 6; j++) { const X = bx - br * 1.8 + (j + (r % 2) * 0.5 + jit(r * 7 + j, 0.08)) * 0.27, v0 = P(c, X, Y, z), v1 = P(c, X + jit(j + r, 0.01), Y + 0.095, z); b += `<path d="M${pt(v0)} L${pt(v1)}" stroke="${M.woodS}" stroke-width="${n(0.014 * k)}"/>`; }
    }
    s += `<clipPath id="${id}"><path d="${lineD(ring, true)}"/></clipPath><path d="${lineD(ring, true)}" fill="${M.adobe}"/><g clip-path="url(#${id})">${b}</g><path d="${lineD(ring.slice(0, 6))}" stroke="${M.wall2}" stroke-width="${n(0.022 * k)}" fill="none" stroke-linejoin="round"/><path d="${lineD(ring.slice(5).concat(ring[0]))}" stroke="${M.wallS}" stroke-width="${n(0.02 * k)}" fill="none" stroke-linejoin="round"/>`;
  }
  // cracks, each one drawn by hand
  for (const [cx, cy, len, dir, sd] of [[w.x1 + 0.05, w.y1 + 0.2, 0.85, 1, 1], [h.door.x0 + 0.1, h.door.y1 + 0.2, 0.6, -1, 2], [1.75, 0.2, 0.9, -1, 3], [-1.1, h.top - 0.05, 0.55, 1, 4], [h.x0 + 0.3, 0.25, 0.7, 1, 5]]) {
    const cr = []; let X = cx, Y = cy;
    for (let i = 0; i < 7; i++) { cr.push(P(c, X, Y, z)); X += dir * (0.02 + 0.07 * hash(sd * 30 + i)) * (i % 2 ? -0.4 : 1); Y += (sd === 4 ? -1 : 1) * len / 7 * (0.6 + 0.8 * hash(sd * 50 + i)); }
    s += ink(lineD(cr), Math.max(0.7, 0.007 * k), sd + 20, k / 100, M.woodS) + `<path d="M${pt(cr[3])} l${n(dir * 0.09 * k)},${n(-0.05 * k)}" stroke="${M.woodS}" stroke-width="${n(Math.max(0.6, 0.006 * k))}" stroke-linecap="round"/>`;
  }
  // the foot of the wall, eaten by rain
  const base = [P(c, h.x0 - 0.09, 0, z)];
  for (let X = h.x0 - 0.05; X <= h.x1 + 0.06; X += 0.24) base.push(P(c, X, 0.1 + 0.2 * hash(X * 9 + 2), z));
  base.push(P(c, h.x1 + 0.08, 0, z));
  s += `<path d="${lineD(base, true)}" fill="${mix(M.wallS, M.dirt3, 0.5)}"/>`;
  s += ink(lineD(wall, true), Math.max(1.2, 0.012 * k), 4, k / 100);
  // the door: weathered turquoise planks set back in the wall
  const d = h.door, dq = [P(c, d.x0, d.y1, z + 0.16), P(c, d.x1, d.y1, z + 0.16), P(c, d.x1, 0, z + 0.16), P(c, d.x0, 0, z + 0.16)];
  let door = poly(dq, M.turqS);
  for (let i = 0; i < 5; i++) {
    door += poly(sub(dq, i / 5 + 0.012, (i + 1) / 5 - 0.012, 0.01, 1), mix(M.turq, M.turqS, 0.3 + 0.5 * hash(i + 60)), `stroke="${INK}" stroke-width="${n(Math.max(0.6, 0.006 * k))}"`);
    for (let j = 0; j < 4; j++) { const u = (i + 0.15 + 0.6 * hash(i * 7 + j + 70)) / 5, v = j ? hash(i * 11 + j + 80) * 0.9 : 0.86 + 0.1 * hash(i + 90); door += poly([quadPt(dq, u, v), quadPt(dq, u + 0.05, v + 0.012), quadPt(dq, u + 0.035, v + 0.06 + 0.05 * hash(i + j)), quadPt(dq, u - 0.01, v + 0.04)], j % 2 ? M.wood : M.woodS); }
  }
  const hd = quadPt(dq, 0.84, 0.52);
  door += `<circle cx="${n(hd.x)}" cy="${n(hd.y)}" r="${n(0.045 * k)}" fill="none" stroke="${INK}" stroke-width="${n(0.016 * k)}"/><circle cx="${n(hd.x)}" cy="${n(hd.y - 0.045 * k)}" r="${n(0.014 * k)}" fill="${INK}"/>`;
  s += hole(c, { x0: d.x0, x1: d.x1, y0: 0, y1: d.y1 }, z, z + 0.16, door, { l: M.woodS, r: M.wallS, t: M.woodS, b: M.dirt3 }).s;
  const lintel = (x0, x1, y, sd) => { const q = wpoly(c, [[x0, y + 0.15, z - 0.03], [x1, y + 0.16, z - 0.03], [x1 + 0.01, y, z - 0.03], [x0 - 0.01, y + 0.01, z - 0.03]], sd, 0.008, 0.5); let o = `<path d="${lineD(q, true)}" fill="${M.wood}"/>`; for (let i = 0; i < 4; i++) { const a0 = P(c, x0 + 0.05 + hash(sd + i) * (x1 - x0 - 0.5), y + 0.03 + 0.09 * hash(sd + i + 5), z - 0.03); o += `<path d="M${pt(a0)} l${n((0.15 + 0.25 * hash(sd + i + 9)) * k)},${n(jit(sd + i, 0.012) * k)}" stroke="${M.woodS}" stroke-width="${n(0.012 * k)}" stroke-linecap="round"/>`; } return o + ink(lineD(q, true), Math.max(0.9, 0.009 * k), sd, k / 100); };
  s += lintel(d.x0 - 0.2, d.x1 + 0.18, d.y1, 40);
  const stp = wpoly(c, [[d.x0 - 0.15, 0.07, z - 0.3], [d.x1 + 0.12, 0.08, z - 0.3], [d.x1 + 0.16, 0, z - 0.3], [d.x0 - 0.18, 0, z - 0.3]], 41, 0.008);
  s += poly([P(c, d.x0 - 0.12, 0.07, z), P(c, d.x1 + 0.1, 0.07, z), stp[1], stp[0]], M.wall2) + `<path d="${lineD(stp, true)}" fill="${M.wallS}" stroke="${INK}" stroke-width="${n(0.008 * k)}"/>`;
  // a ristra of dried chiles by the door, and a clay olla
  const rx = d.x1 + 0.34;
  s += `<path d="M${pt(P(c, rx, 1.5, z - 0.04))} L${pt(P(c, rx + 0.01, 0.92, z - 0.04))}" stroke="${M.woodS}" stroke-width="${n(0.012 * k)}"/><circle cx="${n(P(c, rx, 1.5, z).x)}" cy="${n(P(c, rx, 1.5, z).y)}" r="${n(0.02 * k)}" fill="${INK}"/>`;
  for (let i = 0; i < 13; i++) { const p = P(c, rx + jit(i + 33, 0.035), 1.4 - i * 0.04, z - 0.05), a = (i % 2 ? 1 : -1) * (28 + 30 * hash(i + 3)) + 180; s += `<path d="M0,0 q${n(0.035 * k)},${n(0.05 * k)} ${n(0.012 * k)},${n(0.15 * k)} q${n(-0.035 * k)},${n(-0.06 * k)} ${n(-0.012 * k)},${n(-0.15 * k)} Z" fill="${i % 3 ? M.chile : mix(M.chile, M.woodS, 0.45)}" stroke="${INK}" stroke-width="${n(0.005 * k)}" transform="translate(${pt(p)}) rotate(${n(a + 180)})"/>`; }
  const ol = P(c, -1.02, 0, z - 0.32), ok = ol.s / 100;
  s += `<g transform="translate(${pt(ol)}) scale(${ok.toFixed(4)})"><ellipse cx="2" cy="0" rx="24" ry="5" fill="url(#soft)"/><path d="M-10,0 Q-23,-14 -17,-30 Q-12,-40 -8,-43 L-9,-48 L9,-48 L8,-43 Q13,-40 17,-31 Q23,-14 10,0 Q0,2 -10,0 Z" fill="${M.adobe}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/><path d="M4,-43 Q11,-38 14,-30 Q18,-15 8,-1 Q8,-20 4,-43 Z" fill="${M.woodS}" opacity="0.6"/><path d="M-18,-27 q6,3 12,0 t12,0 t11,-1" stroke="${M.cloth}" stroke-width="1.6" fill="none"/><path d="M-19,-21 q6,3 12,0 t12,0 t13,-1" stroke="${M.turq}" stroke-width="1.2" fill="none"/><path d="M-12,-8 q3,2 5,0.5" stroke="${INK}" stroke-width="0.5" fill="none"/></g>`;
  // the vigas: round beam ends through the wall, their slanted moon shadows, the end grain
  for (let i = 0, X = h.x0 + 0.5; X < h.x1 - 0.2; X += 0.6 + jit(i + 4, 0.05), i++) {
    const Y = h.top - 0.42 + jit(i + 20, 0.025), r = 0.075 + 0.02 * hash(i + 30), len = i === 3 ? 0.2 : 0.42 + jit(i + 10, 0.1), a = P(c, X, Y, z), b = P(c, X, Y, z - len);
    s += poly([P(c, X - r, Y, z), P(c, X + r, Y - r, z), P(c, X + r - 0.5, Y - 0.62, z), P(c, X - r - 0.5, Y - 0.5, z)], M.wallS, `opacity="0.8"`);
    s += `<path d="M${pt(a)} L${pt(b)}" stroke="${INK}" stroke-width="${n(2 * r * a.s + 2.4)}"/><path d="M${pt(a)} L${pt(b)}" stroke="${M.woodS}" stroke-width="${n(2 * r * a.s)}"/>`;
    s += `<ellipse cx="${n(b.x)}" cy="${n(b.y)}" rx="${n(r * b.s)}" ry="${n(r * b.s * (0.94 + 0.08 * hash(i)))}" fill="${M.wood}" stroke="${INK}" stroke-width="${n(Math.max(0.9, 0.01 * b.s))}"/>`;
    s += `<path d="M${n(b.x - r * b.s * 0.5)},${n(b.y + jit(i, 2))} q${n(r * b.s * 0.5)},${n(-r * b.s * 0.55)} ${n(r * b.s * 0.95)},${n(-r * b.s * 0.1)} M${n(b.x - r * b.s * 0.2)},${n(b.y + r * b.s * 0.25)} q${n(r * b.s * 0.25)},${n(-r * b.s * 0.3)} ${n(r * b.s * 0.45)},0 M${n(b.x)},${n(b.y)} l${n(jit(i + 2, r * b.s * 0.7))},${n(r * b.s * 0.85)}" stroke="${M.woodS}" stroke-width="${n(Math.max(0.6, 0.007 * b.s))}" fill="none" stroke-linecap="round"/>`;
  }
  // the window: the lit room behind, the kid, the shutters, the deep reveals
  const zi = z + h.thick, zb = zi + 2.2, lit = (a, b) => mix(a, b, light);
  let room = poly([P(c, -4, 4, zb), P(c, 4, 4, zb), P(c, 4, -1, zb), P(c, -4, -1, zb)], lit(M.woodS, M.room));
  room += poly(wpoly(c, [[-4, 2.6, zb], [4, 2.6, zb], [4, 1.62, zb], [1.25, 1.74, zb], [0.2, 1.6, zb], [-4, 1.72, zb]], 81, 0.03, 0.5), lit(M.woodS, M.roomS), `opacity="0.75"`);
  room += poly([P(c, -4, 0.95, zb), P(c, 4, 0.93, zb), P(c, 4, -1, zb), P(c, -4, -1, zb)], lit(M.woodS, M.dado)) + poly([P(c, -4, 0.99, zb), P(c, 4, 0.97, zb), P(c, 4, 0.93, zb), P(c, -4, 0.95, zb)], lit(M.woodS, M.light));
  room += poly([P(c, 0.1, 1.5, zb), P(c, 0.75, 1.51, zb), P(c, 0.75, 1.46, zb), P(c, 0.1, 1.46, zb)], M.woodS);
  { const j = P(c, 0.3, 1.51, zb), jk = j.s / 100; room += `<path d="M${n(j.x - 7 * jk)},${n(j.y)} q${n(-4 * jk)},${n(-9 * jk)} ${n(2 * jk)},${n(-17 * jk)} l${n(10 * jk)},0 q${n(6 * jk)},${n(8 * jk)} ${n(2 * jk)},${n(17 * jk)} Z" fill="${M.woodS}"/><rect x="${n(j.x + 22 * jk)}" y="${n(j.y - 12 * jk)}" width="${n(11 * jk)}" height="${n(12 * jk)}" fill="${M.woodS}"/>`; }
  room += st.inside || "";
  const hw = (w.x1 - w.x0) / 2, ang = open * 82;
  room += leaf(c, w.x0, zi, 1, 1, hw, w.y0, w.y1, ang, 11, { leak: (1 - open) * light }).s + leaf(c, w.x1, zi, -1, 1, hw, w.y0, w.y1, ang, 23, { leak: (1 - open) * light }).s;
  const rv = mix(M.wallS, M.light2, light * 0.55 * open + light * 0.08);
  const hl = hole(c, w, z, zi, room, { l: rv, r: mix(rv, M.woodS, 0.3), t: mix(M.woodS, rv, 0.4), b: mix(M.wall2, M.light, light * 0.5 * open) });
  s += hl.s + saltLine(c, w.x0 + 0.06, w.x1 - 0.06, w.y0, z + 0.2, st.salt || 0, 7);
  // turquoise frame, chipped; a wooden lintel; a sill slab
  for (const [x0, x1] of [[w.x0 - 0.075, w.x0], [w.x1, w.x1 + 0.075]]) {
    const q = wpoly(c, [[x0, w.y1, z - 0.01], [x1, w.y1, z - 0.01], [x1, w.y0, z - 0.01], [x0, w.y0, z - 0.01]], x0 * 10 + 60, 0.005, 0.3);
    s += `<path d="${lineD(q, true)}" fill="${M.turq}"/>`;
    for (let j = 0; j < 5; j++) { const p = P(c, lerp(x0, x1, 0.2 + 0.5 * hash(j + x0 * 7)), lerp(w.y0, w.y1, 0.05 + 0.9 * hash(j * 3 + x1 * 5)), z); s += `<path d="M${pt(p)} l${n(0.03 * k)},${n(0.012 * k)} l${n(-0.012 * k)},${n(0.05 * k)} l${n(-0.03 * k)},${n(-0.02 * k)} Z" fill="${j % 2 ? M.wood : M.woodS}"/>`; }
    s += ink(lineD(q, true), Math.max(0.8, 0.008 * k), 61, k / 100);
  }
  s += lintel(w.x0 - 0.22, w.x1 + 0.2, w.y1, 50);
  const sl = wpoly(c, [[w.x0 - 0.14, w.y0, z - 0.09], [w.x1 + 0.13, w.y0, z - 0.09], [w.x1 + 0.12, w.y0 - 0.08, z - 0.09], [w.x0 - 0.13, w.y0 - 0.075, z - 0.09]], 52, 0.006, 0.5);
  if (c.y > w.y0) s += poly([P(c, w.x0 - 0.14, w.y0, z), P(c, w.x1 + 0.13, w.y0, z), sl[1], sl[0]], mix(M.wall2, M.light, light * 0.35 * open));
  s += `<path d="${lineD(sl, true)}" fill="${M.wood}"/>` + ink(lineD(sl, true), Math.max(0.8, 0.008 * k), 53, k / 100);
  // the light that falls out of the window: flat hand-cut shapes on the wall and the dust, and three moths
  const L = light * (0.25 + 0.75 * open), wc = P(c, (w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, z);
  let pool = "";
  if (L > 0.02) {
    pool += poly(wpoly(c, [[w.x0 - 0.15, 0, z - 0.15], [w.x1 + 0.15, 0, z - 0.15], [w.x1 + 1.0, 0, 7.0], [w.x0 - 0.8, 0, 7.2]], 91, 0.05, 0.6), M.light2, `opacity="${n(0.3 * L)}" style="mix-blend-mode:screen"`);
    pool += poly(wpoly(c, [[w.x0, 0, z - 0.2], [w.x1, 0, z - 0.2], [w.x1 + 0.5, 0, 7.8], [w.x0 - 0.3, 0, 7.9]], 92, 0.04, 0.5), M.light, `opacity="${n(0.32 * L)}" style="mix-blend-mode:screen"`);
  }
  let glow = L > 0.02 ? lightBlobs(wc, [1.9, 1.45, 1.05, 0.68], M.light2, [0.05 * L, 0.06 * L, 0.075 * L, 0.09 * L], 95) : "";
  for (let i = 0; i < 3; i++) {
    const p = P(c, (w.x0 + w.x1) / 2 + Math.cos(t * (1.7 + i * 0.4) + i * 2.1) * (0.45 + 0.1 * i), 1.25 + Math.sin(t * (2.3 + i * 0.3) + i) * 0.36, z - 0.2 - 0.1 * i), f = Math.abs(Math.sin(t * 31 + i * 2)), r = 0.035 * p.s;
    glow += `<path d="M0,0 L${n(-r * (0.3 + f))},${n(-r)} L${n(-r * (0.2 + f * 0.8))},${n(r * 0.5)} Z M0,0 L${n(r * (0.3 + f))},${n(-r)} L${n(r * (0.2 + f * 0.8))},${n(r * 0.5)} Z" fill="${M.cloth}" opacity="${n(0.5 + 0.4 * L)}" transform="translate(${pt(p)}) rotate(${n(Math.sin(t * 3 + i) * 40)})"/>`;
  }
  return { svg: s + pool, glow, win: hl.A };
}
// the clothesline: two forked poles, a sagging rope, a patched sheet (it moves like something breathing), a shirt, a striped cloth
export function clothesline(c, t, o = {}) {
  const Z = o.Z ?? 7.6, x0 = o.x0 ?? -3.95, x1 = o.x1 ?? -1.75;
  if (!vis(c, Z)) return "";
  const k = P(c, 0, 0, Z).s, rope = (X) => 1.72 - 0.16 * Math.sin((X - x0) / (x1 - x0) * Math.PI);
  let s = "";
  for (const [X, sd] of [[x1, 2]]) {
    const a = P(c, X + jit(sd, 0.04), 0, Z), b = P(c, X, 1.74, Z);
    s += `<ellipse cx="${n(a.x)}" cy="${n(a.y)}" rx="${n(0.3 * k)}" ry="${n(0.05 * k)}" fill="url(#soft)"/>`;
    const d = `M${pt(a)} Q${n(a.x + jit(sd + 3, 0.05) * k)},${n((a.y + b.y) / 2)} ${pt(b)} l${n(-0.07 * k)},${n(-0.16 * k)} M${pt(b)} l${n(0.08 * k)},${n(-0.13 * k)}`;
    s += `<path d="${d}" stroke="${INK}" stroke-width="${n(0.075 * k)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${M.wood}" stroke-width="${n(0.052 * k)}" fill="none" stroke-linecap="round"/>`;
  }
  const rp = Array.from({ length: 13 }, (_, i) => { const X = lerp(x0, x1, i / 12); return P(c, X, rope(X), Z); });
  s += `<path d="${lineD(rp)}" stroke="${INK}" stroke-width="${n(Math.max(1.2, 0.012 * k))}" fill="none"/>`;
  const hang = (X0, X1, len, sd, fill, shade, kind) => {
    const sw = Math.sin(t * 1.25 + sd) * 0.05 + Math.sin(t * 2.1 + sd * 2) * 0.02, top = [], bot = [], N = 6;
    for (let i = 0; i <= N; i++) { const X = lerp(X0, X1, i / N); top.push(P(c, X, rope(X) - 0.01, Z)); bot.push(P(c, X + sw * (1 + 0.3 * Math.sin(i + t * 1.6)), rope(X) - len + 0.03 * Math.sin(i * 1.7 + t * 2 + sd) + jit(sd * 9 + i, 0.02), Z)); }
    const shape = top.concat(bot.slice().reverse());
    let o2 = `<path d="${lineD(shape, true)}" fill="${fill}"/>`;
    o2 += poly([top[3], top[N], bot[N], bot[4], { x: (top[3].x + bot[4].x) / 2 + 0.05 * k, y: (top[3].y + bot[4].y) / 2 }], shade, `opacity="0.75"`);
    for (const i of [1, 3, 4]) o2 += `<path d="M${pt(top[i])} Q${n((top[i].x + bot[i].x) / 2 + jit(sd + i, 0.04) * k)},${n((top[i].y + bot[i].y) / 2)} ${n(lerp(top[i].x, bot[i].x, 0.86))},${n(lerp(top[i].y, bot[i].y, 0.86))}" stroke="${shade}" stroke-width="${n(Math.max(0.8, 0.009 * k))}" fill="none"/>`;
    if (kind === "sheet") {   // a stitched patch and a darned tear
      const a = quadPt([top[1], top[3], bot[3], bot[1]], 0.2, 0.5), u = 0.17 * k;
      o2 += `<path d="M${pt(a)} l${n(u)},${n(-u * 0.1)} l${n(u * 0.08)},${n(u * 0.9)} l${n(-u * 1.05)},${n(u * 0.08)} Z" fill="${mix(fill, M.clothS, 0.5)}" stroke="${M.tuna}" stroke-width="${n(Math.max(0.8, 0.008 * k))}" stroke-dasharray="${n(0.018 * k)} ${n(0.016 * k)}"/>`;
      const b = quadPt([top[4], top[5], bot[5], bot[4]], 0.4, 0.3); for (let j = 0; j < 4; j++) o2 += `<path d="M${n(b.x - 0.02 * k)},${n(b.y + j * 0.03 * k)} l${n(0.045 * k)},${n(0.012 * k)}" stroke="${M.owlDark}" stroke-width="${n(Math.max(0.7, 0.006 * k))}"/>`;
    }
    if (kind === "stripe") for (let j = 1; j < 6; j++) { const q0 = quadPt([top[0], top[N], bot[N], bot[0]], 0, j / 6), q1 = quadPt([top[0], top[N], bot[N], bot[0]], 1, j / 6); o2 += `<path d="M${pt(q0)} L${pt(q1)}" stroke="${["#14c4b8", "#f02f7a", "#f6eeda"][j % 3]}" stroke-width="${n((j % 2 ? 0.03 : 0.012) * k)}"/>`; }
    if (kind === "shirt") o2 += poly([top[0], { x: top[0].x - 0.16 * k, y: top[0].y + 0.2 * k }, { x: top[0].x - 0.08 * k, y: top[0].y + 0.27 * k }, { x: top[1].x, y: top[1].y + 0.12 * k }], fill, `stroke="${INK}" stroke-width="${n(0.008 * k)}"`) + poly([top[N], { x: top[N].x + 0.16 * k, y: top[N].y + 0.2 * k }, { x: top[N].x + 0.08 * k, y: top[N].y + 0.27 * k }, { x: top[N - 1].x, y: top[N - 1].y + 0.12 * k }], shade, `stroke="${INK}" stroke-width="${n(0.008 * k)}"`);
    o2 += ink(lineD(shape, true), Math.max(0.9, 0.009 * k), sd, k / 100);
    for (const i of [0, N]) o2 += `<rect x="${n(top[i].x - 0.012 * k)}" y="${n(top[i].y - 0.04 * k)}" width="${n(0.024 * k)}" height="${n(0.075 * k)}" fill="${M.wood}" stroke="${INK}" stroke-width="${n(0.005 * k)}"/>`;
    return o2;
  };
  const span = x1 - x0;
  s += hang(x0 + span * 0.08, x0 + span * 0.45, 1.05, 3, M.cloth, M.clothS, "sheet") + hang(x0 + span * 0.53, x0 + span * 0.7, 0.5, 5, M.tuna, mix(M.tuna, M.owlDark, 0.45), "shirt") + hang(x0 + span * 0.76, x0 + span * 0.93, 0.62, 8, "#ffb01f", "#d8601f", "stripe");
  return s;
}
// the mesquite: a twisted trunk, crooked limbs, feathery leaf clumps placed one by one, a few bean pods
export function mesquite(c, t, o = {}) {
  const X = o.X ?? -4.0, Z = o.Z ?? 8.2, S = o.size ?? 1.15;
  if (!vis(c, Z)) return "";
  const p0 = P(c, X, 0, Z), k = p0.s * S, at = (x, y) => ({ x: p0.x + x * k, y: p0.y - y * k });
  const limbs = [[[0, 0], [-0.12, 0.6], [0.1, 1.15], [-0.05, 1.7]], [[-0.05, 1.7], [-0.6, 2.2], [-1.3, 2.4], [-1.9, 2.9]], [[-0.05, 1.7], [0.3, 2.4], [0.2, 3.0], [0.7, 3.5]], [[0.1, 1.15], [0.8, 1.6], [1.4, 2.3], [2.0, 2.5]], [[-0.6, 2.2], [-0.7, 2.9], [-0.4, 3.4]], [[0.3, 2.4], [-0.3, 3.1], [-0.9, 3.6]], [[1.4, 2.3], [1.5, 3.0], [1.2, 3.5]], [[-1.3, 2.4], [-1.9, 2.3], [-2.4, 2.5]]];
  let s = `<ellipse cx="${n(p0.x)}" cy="${n(p0.y)}" rx="${n(1.1 * k)}" ry="${n(0.12 * k)}" fill="url(#soft)"/>`, wood = "", leaves = "";
  limbs.forEach((lm, i) => {
    const d = lineD(lm.map(([x, y]) => at(x + jit(i * 9 + y * 3, 0.03), y))), w = (i === 0 ? 0.3 : i < 4 ? 0.15 : 0.08) * k;
    wood += `<path d="${d}" stroke="${INK}" stroke-width="${n(w + 2.6)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${fade(M.woodS, Z)}" stroke-width="${n(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${fade(M.wood, Z)}" stroke-width="${n(w * 0.16)}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${n((0.04 + 0.05 * hash(i)) * k)} ${n((0.09 + 0.08 * hash(i + 3)) * k)}" opacity="0.7" transform="translate(${n(w * 0.2)},0)"/>`;
    if (i === 0) return;
    const [ex, ey] = lm[lm.length - 1];
    for (let j = 0; j < 9; j++) {
      const a = at(ex + jit(i * 31 + j, 0.75), ey + jit(i * 37 + j, 0.42) + 0.1), sw = Math.sin(t * 1.1 + i + j) * 3, col = fade((i + j) % 3 ? M.leaf : M.leaf2, Z);
      // a mesquite frond: a thin stem with paired leaflets
      let f = `<path d="M0,0 q${n(0.2 * k)},${n(0.06 * k)} ${n(0.42 * k)},${n(0.2 * k)}" stroke="${col}" stroke-width="${n(0.016 * k)}" fill="none"/>`;
      for (let q = 1; q <= 7; q++) { const fx = q * 0.055 * k, fy = q * q * 0.0042 * k; f += `<ellipse cx="${n(fx)}" cy="${n(fy - 0.045 * k)}" rx="${n(0.022 * k)}" ry="${n(0.06 * k)}" fill="${col}" transform="rotate(${n(18 + q * 2)} ${n(fx)} ${n(fy)})"/><ellipse cx="${n(fx)}" cy="${n(fy + 0.05 * k)}" rx="${n(0.022 * k)}" ry="${n(0.06 * k)}" fill="${col}" transform="rotate(${n(-14 + q * 2)} ${n(fx)} ${n(fy)})"/>`; }
      leaves += `<g transform="translate(${pt(a)}) rotate(${n(hash(i * 5 + j) * 360 + sw)}) scale(${n(0.8 + 0.6 * hash(i + j * 3))})">${f}</g>`;
    }
    if (i % 2) { const a = at(ex - 0.1, ey - 0.15); leaves += `<path d="M${pt(a)} q${n(0.05 * k)},${n(0.2 * k)} ${n(-0.02 * k)},${n(0.36 * k)}" stroke="${fade(M.light2, Z)}" stroke-width="${n(0.03 * k)}" fill="none" stroke-linecap="round" opacity="0.7"/>`; }
  });
  return s + wood + leaves;
}
// prickly pear. o: { X, Z, seed, size }
export function nopal(c, o = {}) {
  const X = o.X ?? 2.6, Z = o.Z ?? 6.6, sd = o.seed ?? 1, S = o.size ?? 1;
  if (!vis(c, Z)) return "";
  const p0 = P(c, X, 0, Z), k = p0.s * S;
  let s = `<ellipse cx="${n(p0.x)}" cy="${n(p0.y)}" rx="${n(0.6 * k)}" ry="${n(0.08 * k)}" fill="url(#soft)"/>`;
  const pad = (x, y, rot, r, depth, id) => {
    const ring = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2, rr = r * (1 + jit(sd * 50 + id * 13 + i, 0.07)); return { x: Math.sin(a) * rr * 0.72 * k, y: (-r - Math.cos(a) * rr) * k * 1.05 }; });
    let g = `<path d="${blob(ring)}" fill="${fade(M.nopal, Z)}"/><path d="M${n(0.1 * r * k)},${n(-0.1 * r * k)} Q${n(0.85 * r * k)},${n(-r * k)} ${n(0.1 * r * k)},${n(-2 * r * k)} Q${n(0.5 * r * k)},${n(-r * k)} ${n(0.1 * r * k)},${n(-0.1 * r * k)} Z" fill="${fade(M.nopalS, Z)}"/>` + ink(blob(ring), Math.max(0.9, 0.012 * k), sd + id, k / 100);
    for (let i = 0; i < 9; i++) { const sx = jit(sd + id * 7 + i, 0.48) * r * k, sy = (-0.3 - 1.4 * hash(sd + id * 11 + i)) * r * k; g += `<path d="M${n(sx)},${n(sy)} l${n(-0.012 * k)},${n(-0.03 * k)} M${n(sx)},${n(sy)} l${n(0.02 * k)},${n(-0.024 * k)}" stroke="${M.cloth}" stroke-width="${n(Math.max(0.6, 0.006 * k))}" stroke-linecap="round"/>`; }
    if (depth === 0) for (let i = 0; i < 2 + (id % 2); i++) { const a = (-0.6 + i * 0.6 + jit(sd + id + i, 0.15)), tx = Math.sin(a) * r * 0.7 * k, ty = (-r - Math.cos(a) * r) * k * 1.05; g += `<ellipse cx="${n(tx)}" cy="${n(ty - 0.04 * k)}" rx="${n(0.04 * k)}" ry="${n(0.065 * k)}" fill="${M.tuna}" stroke="${INK}" stroke-width="${n(Math.max(0.6, 0.006 * k))}" transform="rotate(${n(a * 57)} ${n(tx)} ${n(ty)})"/>`; }
    let kids = "";
    if (depth > 0) for (let i = 0; i < 2; i++) { const a = (i ? 0.75 : -0.6) + jit(sd * 3 + id * 5 + i, 0.25); kids += `<g transform="translate(${n(Math.sin(a) * r * 0.66 * k)},${n((-r - Math.cos(a) * r * 0.92) * k * 1.05)}) rotate(${n(a * 57)})">${pad(0, 0, 0, r * (0.74 + 0.12 * hash(sd + id + i)), depth - 1, id * 2 + i + 1)}</g>`; }
    return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})">${kids}${g}</g>`;
  };
  return s + `<g transform="translate(${pt(p0)})">${pad(-0.22 * k, 0, -24, 0.2, 1, 1)}${pad(0.2 * k, 0, 20, 0.19, 1, 2)}${pad(0, 0, jit(sd, 6), 0.24, 2, 3)}</g>`;
}
// blurred foreground for the yard: nopal pads low on the left, a mesquite twig across the top right (screen space)
export function near(c, t) {
  const z = 1 + Math.max(0, c.z) * 0.1, ox = -c.x * 110;
  let s = `<g filter="url(#dof)">`;
  for (const [x, y, r, rot] of [[70, 1830, 170, -18], [245, 1900, 135, 24], [-30, 1640, 115, 8], [1040, 1880, 120, 14]]) {
    s += `<g transform="translate(${n((x - 540) * z + 540 + ox)},${n(1920 - (1920 - y) * z)}) rotate(${rot}) scale(${n(z)})"><ellipse rx="${n(r * 0.72)}" ry="${r}" fill="${M.nopalS}"/><ellipse cx="${n(r * 0.2)}" rx="${n(r * 0.4)}" ry="${n(r * 0.85)}" fill="${M.nopal}" opacity="0.7"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${n(jit(i + r, r * 0.5))}" cy="${n(jit(i + r + 9, r * 0.75))}" r="4" fill="${M.cloth}" opacity="0.5"/>`;
    s += `<ellipse cx="${n(-r * 0.2)}" cy="${-r}" rx="24" ry="38" fill="${M.tuna}"/><ellipse cx="${n(r * 0.35)}" cy="${n(-r * 0.9)}" rx="20" ry="32" fill="${M.tuna}" transform="rotate(20)"/></g>`;
  }
  // a mesquite twig across the top left
  const bx = -40 + ox * 0.8, sw = Math.sin(t * 0.9) * 6;
  s += `<path d="M${n(bx - 40)},40 Q${n(bx + 170)},${n(100 + sw)} ${n(bx + 360)},${n(230 + sw * 2)}" stroke="${M.owlDark}" stroke-width="${n(18 * z)}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 14; i++) { const u = 0.15 + i * 0.06, x = bx - 40 + 400 * u, y = 40 + 190 * u * u + sw * u * 2; s += `<g transform="translate(${n(x)},${n(y)}) rotate(${n(100 + jit(i, 50) + sw)})">${Array.from({ length: 5 }, (_, q) => `<ellipse cx="${q * 22 + 14}" cy="-14" rx="8" ry="20" fill="${i % 2 ? M.leaf2 : M.leaf}" transform="rotate(16 ${q * 22 + 14} 0)"/><ellipse cx="${q * 22 + 14}" cy="14" rx="8" ry="20" fill="${M.leaf}" transform="rotate(-16 ${q * 22 + 14} 0)"/>`).join("")}</g>`; }
  return s + `</g>`;
}

// ---------------------------------------------------------------- INTERIOR: the kid's corner, the same window from inside
export const ROOM = { x0: -2.0, x1: 2.0, h: 3.6, zw: 4.6, thick: 0.45, win: { x0: -0.52, x1: 0.52, y0: 0.52, y1: 1.42 },
  latch: { X: 0.06, Y: 0.82, Z: 4.56 }, candle: { X: -0.98, Y: 1.27, Z: 4.72 }, shelfJar: { X: -1.66, Y: 1.3, Z: 4.48 }, sill: { Y: 0.52, Z: 4.82 }, owlSpot: { X: 0, Y: 0, Z: 6.4 } };
// the default view through the window (pass your own svg as st.outside to add the owl)
export const outside = (c, t, o = {}) => sky(c, t, o) + far(c) + fog(c, t, [9]);
// st: { open 0..1 (shutters swing into the room), latch 0..1 (0 = bar down and locked, 1 = lifted), candle 0..1, salt 0..1 (line on
//       the sill), jar (false = the salt jar is off the shelf), outside: svg behind the window }.
// Returns { back, light, front }: draw back, then the actors, then light (screen blend + dust motes), then front (blurred).
export function room(c, t, st = {}) {
  const r = ROOM, zw = r.zw, w = r.win, open = st.open || 0, cand = (st.candle ?? 1) * (1 - 0.5 * Math.max(0, TH)), k = P(c, 0, 0, zw).s, zn = c.z + NEAR + 0.02;
  const fl = cand * (1 + 0.06 * Math.sin(t * 19) + 0.04 * Math.sin(t * 31 + 1));
  let s = `<rect width="${W}" height="${H}" fill="${M.ceil}"/>`;
  // ceiling: latillas laid across the vigas
  s += poly([P(c, r.x0, r.h, zn), P(c, r.x1, r.h, zn), P(c, r.x1, r.h, zw), P(c, r.x0, r.h, zw)], M.ceil);
  for (let z = zw - 0.12, i = 0; z > zn; z -= 0.17, i++) s += `<path d="M${pt(P(c, r.x0, r.h, z + jit(i, 0.03)))} L${pt(P(c, r.x1, r.h, z + jit(i + 50, 0.03)))}" stroke="${i % 3 ? M.woodS : mix(M.ceil, M.iwallS, 0.5)}" stroke-width="${n(Math.max(1, 0.03 * P(c, 0, r.h, z).s))}"/>`;
  // side walls with the painted dado
  for (const X of [r.x0, r.x1]) {
    const q = [P(c, X, r.h, zn), P(c, X, r.h, zw), P(c, X, 0, zw), P(c, X, 0, zn)];
    s += poly(q, mix(M.iwallS, M.iwall, X < 0 ? 0.3 : 0.12)) + poly(sub(q, 0, 1, 1 - 0.6 / r.h, 1), M.dadoS) + poly(sub(q, 0, 1, 1 - 0.635 / r.h, 1 - 0.6 / r.h), mix(M.light, M.iwallS, 0.35));
  }
  // floor: saltillo tiles, each a slightly different clay, warmer where the candle reaches
  const fq = [P(c, r.x0, 0, zw), P(c, r.x1, 0, zw), P(c, r.x1, 0, zn), P(c, r.x0, 0, zn)];
  s += poly(fq, M.grout);
  for (let z = zw, row = 0; z > zn; z -= 0.34, row++) for (let X = r.x0, col = 0; X < r.x1 - 0.01; X += 0.34, col++) {
    const z0 = Math.max(zn, z - 0.34 + 0.012); if (z - 0.012 <= z0) continue;
    const id = row * 41 + col, j = (q) => jit(id * 7 + q, 0.006);
    const d = Math.hypot(X + 0.17 - r.candle.X, z - 0.17 - r.candle.Z), lit = Math.round(clamp(1 - d / 2.8) * 3) / 3 * fl;
    let colr = mix(mix(M.floorS, M.floor, 0.35 + 0.65 * hash(id)), M.floor2, lit * 0.85);
    if (hash(id + 5) > 0.9) colr = mix(colr, M.floorS, 0.5);
    const q = [P(c, X + 0.012 + j(1), 0, z - 0.012 + j(2)), P(c, X + 0.328 + j(3), 0, z - 0.012 + j(4)), P(c, X + 0.328 + j(5), 0, z0), P(c, X + 0.012 + j(6), 0, z0)];
    s += poly(q, colr);
    if (z > 1.2 && hash(id + 9) > 0.55) s += poly(sub(q, 0.1 + 0.3 * hash(id + 2), 0.55 + 0.4 * hash(id + 3), 0.2, 0.34 + 0.2 * hash(id + 4)), mix(colr, M.floor2, 0.5), `opacity="0.7"`);
    if (hash(id + 13) > 0.86) s += poly([q[0], quadPt(q, 0.22, 0), quadPt(q, 0, 0.2)], M.grout);
  }
  // the window wall: plaster, one shade tone, the candle's flat light, hand dabs, cracks, the turquoise dado
  const wallQ = wpoly(c, [[r.x0, 0, zw], [r.x0, r.h, zw], [r.x1, r.h, zw], [r.x1, 0, zw]], 201, 0.008, 0.5);
  s += `<path d="${lineD(wallQ, true)}" fill="${M.iwall}"/>`;
  s += poly(wpoly(c, [[r.x0, r.h, zw], [r.x1, r.h, zw], [r.x1, 0.6, zw], [1.3, 0.6, zw], [1.15, 1.7, zw], [0.35, 2.3, zw], [-1.0, 2.5, zw], [-1.7, 2.35, zw], [r.x0, 2.5, zw]], 202, 0.035, 0.45), M.iwallS, `opacity="0.7"`);
  const cp = P(c, r.candle.X, r.candle.Y + 0.12, zw);
  for (const [rad, al, sd] of [[1.05, 0.5, 1], [0.6, 0.75, 2]]) s += `<path d="${blob(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, rr = rad * k * (1 + jit(sd * 60 + i, 0.09)) * (0.45 + 0.55 * clamp(fl)); return { x: cp.x + Math.cos(a) * rr, y: cp.y + Math.sin(a) * rr * 0.92 }; }))}" fill="${M.iwallL}" opacity="${n(al * clamp(fl))}"/>`;
  const skipI = (X, Y) => (X > w.x0 - 0.2 && X < w.x1 + 0.2 && Y > w.y0 - 0.2 && Y < w.y1 + 0.25);
  s += dabs(c, r.x0 + 0.1, r.x1 - 0.5, 0.7, r.h - 0.12, zw, 90, 800, [M.iwallL, M.iwallS, mix(M.iwall, M.iwallL, 0.5), M.iwallS], skipI);
  for (const [cx, cy, len, dir, sd] of [[w.x1 + 0.1, w.y1 + 0.12, 0.6, 1, 11], [1.55, 0.7, 0.7, -1, 12], [-0.3, r.h - 0.03, 0.4, 1, 13]]) {
    const cr = []; let X = cx, Y = cy;
    for (let i = 0; i < 7; i++) { cr.push(P(c, X, Y, zw)); X += dir * (0.02 + 0.06 * hash(sd * 30 + i)) * (i % 2 ? -0.4 : 1); Y += (sd === 13 ? -1 : 1) * len / 7 * (0.6 + 0.8 * hash(sd * 50 + i)); }
    s += ink(lineD(cr), Math.max(0.8, 0.005 * k), sd, k / 100, mix(M.iwallS, M.ceil, 0.6));
  }
  { // a high ledge with clay pots and hanging corn, to dress the tall wall
    const ly = 2.62, lq = wpoly(c, [[-1.55, ly, zw - 0.2], [1.1, ly + 0.01, zw - 0.2], [1.1, ly - 0.05, zw - 0.2], [-1.55, ly - 0.045, zw - 0.2]], 340, 0.005, 0.5);
    s += poly([P(c, -1.55, ly - 0.045, zw - 0.2), P(c, 1.1, ly - 0.05, zw - 0.2), P(c, 1.1, ly - 0.05, zw), P(c, -1.55, ly - 0.045, zw)], M.woodS) + `<path d="${lineD(lq, true)}" fill="${M.wood}"/>` + ink(lineD(lq, true), Math.max(0.9, 0.007 * k), 341, k / 100);
    for (const X of [-1.3, -0.2, 0.9]) s += poly([P(c, X, ly - 0.05, zw), P(c, X, ly - 0.05, zw - 0.17), P(c, X, ly - 0.3, zw)], M.woodS, `stroke="${INK}" stroke-width="${n(0.007 * k)}"`);
    [[-1.2, 1.25, M.adobe, M.cloth], [-0.72, 0.85, M.dado, M.light], [0.1, 1.45, M.adobe, M.turq], [0.62, 0.95, M.ceil, M.cloth]].forEach(([X, sc, col, band], i) => {
      const q = P(c, X, ly, zw - 0.1), u = q.s / 100 * sc;
      s += `<g transform="translate(${pt(q)}) scale(${u.toFixed(4)})"><path d="M-7,0 Q-${14 + i},-9 -11,-20 Q-8,-27 -5.5,-29 L-6,-33 L6,-33 L5.5,-29 Q9,-26 11.5,-20 Q${14 + i},-9 7,0 Q0,1.4 -7,0 Z" fill="${col}" stroke="${INK}" stroke-width="${n(0.8 / sc)}" stroke-linejoin="round"/><path d="M3,-29 Q8,-25 10,-19 Q12,-9 6,-1 Q6,-14 3,-29 Z" fill="${M.ceil}" opacity="0.45"/><path d="M-12,-17 q4,2.4 8,0 t8,0 t7.6,-0.6" stroke="${band}" stroke-width="1.4" fill="none"/><path d="M-12.4,-12.6 q4,2.4 8,0 t8,0 t8.4,-0.4" stroke="${band}" stroke-width="0.8" fill="none" stroke-dasharray="2 1.6"/></g>`;
    });
    for (let i = 0; i < 3; i++) { const q = P(c, -1.02 + i * 0.09, ly - 0.06, zw - 0.2), u = q.s / 100; s += `<g transform="translate(${pt(q)}) scale(${u.toFixed(4)}) rotate(${n(jit(i + 360, 7))})"><path d="M0,0 L0,7" stroke="${INK}" stroke-width="0.6"/><path d="M-3.4,7 Q-4.4,18 0,27 Q4.4,18 3.4,7 Z" fill="${["#ffb01f", "#f6eeda", "#b02f6a"][i]}" stroke="${INK}" stroke-width="0.7"/><path d="M-2.6,10 l5.2,0 M-3.2,14 l6.4,0 M-2.8,18 l5.6,0 M-1.8,22 l3.6,0 M0,8 l0,17" stroke="${INK}" stroke-width="0.35" opacity="0.6"/><path d="M-3,7 q-5,-3 -7,-10 M3,7 q5,-2 6,-9" stroke="#f0d890" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`; }
  }
  { // a straw hat on a peg, high on the wall
    const hp = P(c, 1.2, 1.95, zw - 0.03), u = hp.s / 100;
    s += `<g transform="translate(${pt(hp)}) scale(${u.toFixed(4)}) rotate(-7)"><ellipse cx="0" cy="3" rx="27" ry="24" fill="${mix(M.iwallS, M.ceil, 0.4)}" opacity="0.5" transform="translate(4,4)"/><path d="${blob(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return { x: Math.cos(a) * 26 * (1 + jit(i + 330, 0.04)), y: Math.sin(a) * 23 * (1 + jit(i + 350, 0.04)) }; }))}" fill="#f0c060" stroke="${INK}" stroke-width="0.8"/><path d="M-22,6 Q0,26 23,4 Q10,16 -22,6 Z" fill="#c8803a" opacity="0.7"/><ellipse cx="0" cy="-1" rx="12.5" ry="11" fill="#f6d27a" stroke="${INK}" stroke-width="0.7"/><ellipse cx="0" cy="-1" rx="12.5" ry="11" fill="none" stroke="#f02f7a" stroke-width="2.2" stroke-dasharray="5 2.5"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i / 8 * Math.PI * 2 + 0.2; return `<path d="M${n(Math.cos(a) * 14)},${n(Math.sin(a) * 12.5)} L${n(Math.cos(a) * 24)},${n(Math.sin(a) * 21)}" stroke="#c8903a" stroke-width="0.6"/>`; }).join("")}<path d="M20,14 l3,6 l2,-5" stroke="#c8903a" stroke-width="0.8" fill="none"/><circle cx="0" cy="-24" r="2" fill="${INK}"/></g>`;
  }
  const dadoTop = []; for (let X = r.x0; X <= r.x1 + 0.01; X += 0.25) dadoTop.push(P(c, X, 0.6 + jit(X * 13 + 3, 0.012), zw));
  s += `<path d="${lineD(dadoTop.concat([P(c, r.x1, 0, zw), P(c, r.x0, 0, zw)]), true)}" fill="${M.dado}"/>` + dabs(c, r.x0 + 0.05, r.x1 - 0.4, 0.06, 0.52, zw, 40, 900, [M.dadoS, mix(M.dado, M.turq, 0.5), M.dadoS], null);
  s += `<path d="${lineD(dadoTop.map((p) => ({ x: p.x, y: p.y - 0.018 * k })))}" stroke="${M.light}" stroke-width="${n(0.03 * k)}" fill="none"/>`;
  for (let i = 0; i < 9; i++) { const p = P(c, r.x0 + 0.2 + hash(i + 300) * 3.6, 0.04 + 0.5 * hash(i + 310), zw); s += `<path d="M${pt(p)} l${n(0.05 * k)},${n(0.012 * k)} l${n(-0.015 * k)},${n(0.05 * k)} l${n(-0.045 * k)},${n(-0.02 * k)} Z" fill="${mix(M.iwall, M.iwallS, 0.5)}"/>`; }
  // a row of hand-painted talavera tiles under the sill (no two quite alike)
  for (let i = 0; i < 6; i++) {
    const X = w.x0 - 0.09 + i * 0.203, q = [P(c, X + jit(i + 400, 0.004), 0.5, zw - 0.005), P(c, X + 0.195, 0.5 + jit(i + 410, 0.004), zw - 0.005), P(c, X + 0.195, 0.31, zw - 0.005), P(c, X, 0.31 + jit(i + 420, 0.004), zw - 0.005)], m = quadPt(q, 0.5, 0.5), u = 0.06 * k;
    s += poly(q, "#f6eeda", `stroke="${INK}" stroke-width="${n(Math.max(0.7, 0.006 * k))}"`) + poly([quadPt(q, 0.5, 0.1), quadPt(q, 0.9, 0.5), quadPt(q, 0.5, 0.9), quadPt(q, 0.1, 0.5)], i % 2 ? "#14a8c4" : "#ffb01f") + `<circle cx="${n(m.x)}" cy="${n(m.y)}" r="${n(u * (0.36 + 0.1 * hash(i)))}" fill="${i % 2 ? "#ffb01f" : "#1f3fa8"}"/>`;
    for (const [a, b] of [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]) { const d = quadPt(q, a + jit(i * 5 + a * 7, 0.03), b); s += `<circle cx="${n(d.x)}" cy="${n(d.y)}" r="${n(u * 0.2)}" fill="${i % 2 ? "#f02f7a" : "#14a8c4"}"/>`; }
    if (i === 4) s += poly([q[2], quadPt(q, 0.7, 1), quadPt(q, 1, 0.72)], M.iwallS);
  }
  // the window: outside, the deep reveals, the sill with its salt
  const zo = zw + r.thick, cold = Math.max(0, TH);
  const hl = hole(c, w, zw, zo, st.outside ?? outside(c, t), { l: mix(M.iwallS, M.ceil, 0.35), r: mix(M.iwall, M.fogC, 0.25 + 0.4 * cold), t: mix(M.ceil, M.iwallS, 0.4), b: mix(M.iwallL, M.fogC, 0.3 + 0.5 * cold) });
  s += hl.s + saltLine(c, w.x0 + 0.05, w.x1 - 0.05, w.y0, zw + 0.22, st.salt || 0, 9);
  // frame, chipped turquoise
  for (const [x0, x1, y0, y1, sd] of [[w.x0 - 0.08, w.x0, w.y0 - 0.08, w.y1 + 0.08, 1], [w.x1, w.x1 + 0.08, w.y0 - 0.08, w.y1 + 0.08, 2], [w.x0, w.x1, w.y1, w.y1 + 0.08, 3], [w.x0, w.x1, w.y0 - 0.08, w.y0, 4]]) {
    const q = wpoly(c, [[x0, y1, zw - 0.02], [x1, y1, zw - 0.02], [x1, y0, zw - 0.02], [x0, y0, zw - 0.02]], sd + 600, 0.005, 0.35);
    s += `<path d="${lineD(q, true)}" fill="${sd % 2 ? M.turq : mix(M.turq, M.turqS, 0.4)}"/>`;
    for (let j = 0; j < 5; j++) { const p = P(c, lerp(x0, x1, 0.1 + 0.7 * hash(j + sd * 7)), lerp(y0, y1, 0.08 + 0.84 * hash(j * 3 + sd * 5)), zw - 0.02); s += `<path d="M${pt(p)} l${n(0.03 * k)},${n(0.01 * k)} l${n(-0.01 * k)},${n(0.04 * k)} l${n(-0.03 * k)},${n(-0.02 * k)} Z" fill="${j % 2 ? M.wood : M.woodS}"/>`; }
    s += ink(lineD(q, true), Math.max(0.9, 0.007 * k), sd + 610, k / 100);
  }
  // shutters, hinged on the frame, swinging toward us; the wooden latch bar pivots on the right leaf
  const hw = (w.x1 - w.x0) / 2, ang = open * 80, leak = (1 - open) * (0.35 + 0.65 * cold);
  const lf = leaf(c, w.x0, zw - 0.03, 1, -1, hw, w.y0, w.y1, ang, 31, { battens: true, leak, leakCol: M.fogC }), rf = leaf(c, w.x1, zw - 0.03, -1, -1, hw, w.y0, w.y1, ang, 47, { battens: true, leak: 0 });
  s += lf.s + rf.s;
  if (rf.q) {
    const la = st.latch || 0, v = 1 - (r.latch.Y - w.y0) / (w.y1 - w.y0), pv = quadPt(rf.q, 0.8, v), ks = pv.s || k, len = 0.3 * k * Math.cos(ang * Math.PI / 180 * 0.9), rot = lerp(180, 262, Math.max(la, clamp(open * 4)));
    const hk = lf.q ? quadPt(lf.q, 0.84, v) : pv;
    s += `<path d="M${n(hk.x - 0.03 * k)},${n(hk.y - 0.035 * k)} l0,${n(0.06 * k)} l${n(0.06 * k)},0 l0,${n(-0.03 * k)}" stroke="${INK}" stroke-width="${n(0.02 * k)}" fill="none" stroke-linejoin="round"/>`;
    s += `<g transform="translate(${pt(pv)}) rotate(${n(rot)})"><path d="M${n(-0.03 * k)},${n(-0.022 * k)} L${n(len)},${n(-0.018 * k)} L${n(len + 0.012 * k)},${n(0.02 * k)} L${n(-0.03 * k)},${n(0.024 * k)} Z" fill="${M.wood}" stroke="${INK}" stroke-width="${n(Math.max(0.9, 0.008 * k))}" stroke-linejoin="round"/><path d="M${n(0.04 * k)},0 L${n(len * 0.8)},${n(0.004 * k)}" stroke="${M.woodS}" stroke-width="${n(0.006 * k)}"/><circle r="${n(0.014 * k)}" fill="${INK}"/></g>`;
  }
  // the nicho with the candle
  const nx0 = -1.2, nx1 = -0.76, ny0 = 1.02, ny1 = 1.62, arch = [[nx0, ny0], [nx0, ny1 - 0.16], [nx0 + 0.06, ny1 - 0.05], [(nx0 + nx1) / 2, ny1], [nx1 - 0.06, ny1 - 0.05], [nx1, ny1 - 0.16], [nx1, ny0]];
  const nA = arch.map(([X, Y], i) => P(c, X + jit(i + 700, 0.008), Y + jit(i + 710, 0.006), zw)), nB = arch.map(([X, Y]) => P(c, X, Y, zw + 0.22));
  s += `<path d="${lineD(nA, true)}" fill="${mix(M.ceil, M.iwallS, 0.3)}"/><path d="${lineD(nB, true)}" fill="${mix(M.iwallS, M.iwallL, clamp(fl) * 0.85)}"/>` + poly([nA[0], nA[6], nB[6], nB[0]], mix(M.iwall, M.iwallL, clamp(fl) * 0.7)) + ink(lineD(nA, true), Math.max(1, 0.008 * k), 720, k / 100);
  const cb = P(c, r.candle.X, ny0, zw + 0.1), ck = cb.s / 100;
  const flame = { x: cb.x, y: cb.y - 13.5 * ck, s: cb.s };
  s += `<g transform="translate(${pt(cb)}) scale(${ck.toFixed(4)})"><ellipse cx="0" cy="0" rx="7.5" ry="1.8" fill="${M.adobe}" stroke="${INK}" stroke-width="0.5"/><path d="M-2.3,-0.5 L-2.1,-9 Q0,-9.8 2.2,-8.8 L2.4,-0.5 Z" fill="#f6eeda" stroke="${INK}" stroke-width="0.5"/><path d="M-2.1,-8 q0.3,3 -0.5,5 q1.2,-0.6 1.3,-2.4 M2.2,-8.4 q0.6,2 0.2,3.6" stroke="#d8c8b0" stroke-width="0.7" fill="none"/><path d="M0,-9.3 L0.2,-10.8" stroke="${INK}" stroke-width="0.5"/>
    ${fl > 0.03 ? `<g transform="translate(0.2,-10.8) scale(${n(0.55 + 0.5 * fl)}) skewX(${n(Math.sin(t * 9) * 5)})"><path d="M0,0 Q-2.4,-2.6 0,-7.6 Q2.2,-2.8 0,0 Z" fill="#ff7a1f"/><path d="M0,-0.3 Q-1.2,-2 0,-4.8 Q1.1,-2 0,-0.3 Z" fill="#fff3b0"/></g>` : ""}</g>`;
  // the shelf above the bed: the salt jar, a cup, a braid of garlic
  const sx0 = -1.93, sx1 = -1.36, sy = 1.3, sz = zw - 0.24;
  s += poly([P(c, sx0, sy - 0.035, sz), P(c, sx1, sy - 0.035, sz), P(c, sx1, sy - 0.035, zw), P(c, sx0, sy - 0.035, zw)], M.woodS);
  for (const X of [sx0 + 0.07, sx1 - 0.07]) s += poly([P(c, X, sy - 0.035, zw), P(c, X, sy - 0.035, sz + 0.03), P(c, X, sy - 0.24, zw)], M.woodS, `stroke="${INK}" stroke-width="${n(0.007 * k)}"`);
  const sh = wpoly(c, [[sx0, sy, sz], [sx1, sy, sz], [sx1, sy - 0.035, sz], [sx0, sy - 0.035, sz]], 730, 0.004, 0.3);
  s += `<path d="${lineD(sh, true)}" fill="${M.wood}"/>` + ink(lineD(sh, true), Math.max(0.9, 0.007 * k), 731, k / 100);
  if (st.jar !== false) s += saltJar(c, { ...r.shelfJar, Y: sy }, t);
  { const cu = P(c, -1.47, sy, zw - 0.1), u = cu.s / 100; s += `<path d="M${n(cu.x - 4 * u)},${n(cu.y)} L${n(cu.x - 4.6 * u)},${n(cu.y - 8 * u)} L${n(cu.x + 4.6 * u)},${n(cu.y - 8 * u)} L${n(cu.x + 4 * u)},${n(cu.y)} Z" fill="${M.turq}" stroke="${INK}" stroke-width="${n(0.6 * u)}"/><path d="M${n(cu.x - 4.4 * u)},${n(cu.y - 5.5 * u)} L${n(cu.x + 4.4 * u)},${n(cu.y - 5.5 * u)}" stroke="#f6eeda" stroke-width="${n(1.2 * u)}"/>`; }
  for (let i = 0; i < 5; i++) { const g = P(c, sx0 + 0.16 + jit(i + 740, 0.025), sy - 0.1 - i * 0.075, sz - 0.01), u = g.s / 100; s += `<path d="M${n(g.x)},${n(g.y - 5 * u)} q${n(-5 * u)},${n(3 * u)} ${n(-3.4 * u)},${n(7 * u)} q${n(3.4 * u)},${n(2.4 * u)} ${n(6.8 * u)},0 q${n(1.6 * u)},${n(-4 * u)} ${n(-3.4 * u)},${n(-7 * u)} Z" fill="#f6eeda" stroke="${INK}" stroke-width="${n(0.5 * u)}"/><path d="M${n(g.x)},${n(g.y - 4 * u)} l0,${n(5 * u)}" stroke="${M.clothS}" stroke-width="${n(0.5 * u)}"/>`; }
  // the bed and its woven blanket: stripes, stitches, a row of diamonds, a knotted fringe
  const bx0 = r.x0, bx1 = -1.02, bh = 0.5, bz0 = Math.max(zn, 2.95), bz1 = zw - 0.04, low = 0.15;
  if (bz1 > bz0 + 0.1) {
    const top = [P(c, bx0, bh, bz1), P(c, bx1, bh, bz1), P(c, bx1, bh, bz0), P(c, bx0, bh, bz0)], side = [P(c, bx1, bh, bz1), P(c, bx1, bh, bz0), P(c, bx1, low, bz0), P(c, bx1, low, bz1)], front = [P(c, bx0, bh, bz0), P(c, bx1, bh, bz0), P(c, bx1, low, bz0), P(c, bx0, low, bz0)];
    s += poly([P(c, bx0, low, bz0), P(c, bx1, low, bz0), P(c, bx1, 0, bz0), P(c, bx0, 0, bz0)], M.grout) + poly([P(c, bx1, low, bz1), P(c, bx1, low, bz0), P(c, bx1, 0, bz0), P(c, bx1, 0, bz1)], M.grout);
    for (const zz of [bz0 + 0.04, bz1 - 0.1]) s += poly([P(c, bx1, low + 0.02, zz), P(c, bx1, low + 0.02, zz + 0.07), P(c, bx1, 0, zz + 0.07), P(c, bx1, 0, zz)], M.woodS, `stroke="${INK}" stroke-width="${n(0.006 * k)}"`);
    const stripes = [["#f02f7a", 0.1], ["#f6eeda", 0.025], ["#ffb01f", 0.07], ["#2b2f9a", 0.03], ["#14c4b8", 0.1], ["#f6eeda", 0.02], ["#f02f7a", 0.19], ["#f6eeda", 0.02], ["#14c4b8", 0.1], ["#2b2f9a", 0.03], ["#ffb01f", 0.07], ["#f6eeda", 0.025], ["#f02f7a", 0.22]];
    let v = 0, cover = "", stitch = "";
    stripes.forEach(([col, wd], i) => {
      const v1 = Math.min(1, v + wd + (i === stripes.length - 1 ? 1 : 0));
      cover += poly(sub(top, 0, 1, v, v1), col) + poly(sub(side, v, v1, 0, 1), mix(col, "#3a1048", 0.3));
      if (wd > 0.05) { const a = quadPt(top, 0, v + 0.008), b = quadPt(top, 1, v + 0.008), d2 = quadPt(side, v + 0.008, 1); stitch += `<path d="M${pt(a)} L${pt(b)} L${pt(d2)}" stroke="${i % 4 ? "#f6eeda" : "#2b2f9a"}" stroke-width="${n(Math.max(0.9, 0.007 * b.s))}" stroke-dasharray="${n(0.022 * b.s)} ${n(0.018 * b.s)}" fill="none"/>`; }
      if (i === 6) { for (let q = 0; q < 5; q++) { const m = quadPt(top, 0.12 + q * 0.19, (v + v1) / 2), u = 0.05 * m.s; stitch += `<path d="M${n(m.x)},${n(m.y - u * 0.5)} L${n(m.x + u)},${n(m.y)} L${n(m.x)},${n(m.y + u * 0.5)} L${n(m.x - u)},${n(m.y)} Z" fill="${q % 2 ? "#ffb01f" : "#f6eeda"}" stroke="#2b2f9a" stroke-width="${n(Math.max(0.8, 0.008 * m.s))}"/>`; } for (let q = 0; q < 2; q++) { const m = quadPt(side, (v + v1) / 2, 0.3 + q * 0.38), u = 0.05 * m.s; stitch += `<path d="M${n(m.x)},${n(m.y - u)} L${n(m.x + u * 0.5)},${n(m.y)} L${n(m.x)},${n(m.y + u)} L${n(m.x - u * 0.5)},${n(m.y)} Z" fill="${q % 2 ? "#f6eeda" : "#ffb01f"}" stroke="#2b2f9a" stroke-width="${n(Math.max(0.8, 0.008 * m.s))}"/>`; } }
      v = v1;
    });
    s += cover + poly(front, mix("#f02f7a", "#3a1048", 0.18));
    for (const vv of [0.2, 0.42, 0.62, 0.84]) s += `<path d="M${pt(quadPt(front, 0, vv))} L${pt(quadPt(front, 1, vv))}" stroke="${vv > 0.5 ? "#ffb01f" : "#14c4b8"}" stroke-width="${n(0.02 * k)}" stroke-dasharray="${vv === 0.42 ? `${n(0.03 * k)} ${n(0.02 * k)}` : "none"}"/>`;
    s += stitch;
    for (let i = 0; i <= 26; i++) { const a = quadPt(side, i / 26, 1), col = ["#f6eeda", "#ffb01f", "#f02f7a"][i % 3]; s += `<path d="M${pt(a)} q${n(jit(i + 760, 0.012) * a.s)},${n(0.04 * a.s)} ${n(jit(i + 770, 0.016) * a.s)},${n((0.07 + 0.02 * hash(i)) * a.s)}" stroke="${col}" stroke-width="${n(Math.max(0.9, 0.009 * a.s))}" fill="none" stroke-linecap="round"/>`; }
    for (let i = 0; i <= 14; i++) { const a = quadPt(front, i / 14, 1); s += `<path d="M${pt(a)} q${n(jit(i + 780, 0.012) * a.s)},${n(0.04 * a.s)} ${n(jit(i + 790, 0.016) * a.s)},${n((0.07 + 0.02 * hash(i + 3)) * a.s)}" stroke="${["#f6eeda", "#ffb01f", "#f02f7a"][i % 3]}" stroke-width="${n(Math.max(0.9, 0.009 * a.s))}" fill="none" stroke-linecap="round"/>`; }
    s += ink(lineD([top[0], top[1], side[1], side[2], side[3]]), Math.max(1, 0.008 * k), 795, k / 100) + ink(lineD([front[0], front[1], front[2], front[3]], true), Math.max(1, 0.01 * k), 796, k / 100);
    // the pillow, with a little embroidered flower
    const pp = P(c, -1.52, bh + 0.09, bz1 - 0.22), u = pp.s / 100;
    s += `<path d="${blob([[-34, 2], [-30, -11], [0, -13], [31, -10], [35, 3], [28, 11], [0, 12], [-29, 11]].map(([x, y], i) => ({ x: pp.x + (x + jit(i + 800, 1.5)) * u, y: pp.y + y * u })))}" fill="#f6eeda" stroke="${INK}" stroke-width="${n(0.8 * u)}"/><path d="M${n(pp.x + 8 * u)},${n(pp.y - 10 * u)} Q${n(pp.x + 30 * u)},${n(pp.y - 4 * u)} ${n(pp.x + 26 * u)},${n(pp.y + 9 * u)} Q${n(pp.x + 16 * u)},${n(pp.y + 2 * u)} ${n(pp.x + 8 * u)},${n(pp.y - 10 * u)} Z" fill="${M.clothS}" opacity="0.6"/>`;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; s += `<ellipse cx="${n(pp.x - 12 * u + Math.cos(a) * 4 * u)}" cy="${n(pp.y + Math.sin(a) * 3 * u)}" rx="${n(2.4 * u)}" ry="${n(1.7 * u)}" fill="#f02f7a"/>`; }
    s += `<circle cx="${n(pp.x - 12 * u)}" cy="${n(pp.y)}" r="${n(1.6 * u)}" fill="#ffb01f"/><path d="M${n(pp.x - 6 * u)},${n(pp.y + 2 * u)} q${n(5 * u)},${n(3 * u)} ${n(10 * u)},${n(1 * u)}" stroke="#14a8a0" stroke-width="${n(0.9 * u)}" fill="none"/>`;
  }
  // light: the candle's flat halo, the cold moon shaft through the open window, dust motes that drift in it
  let light = lightBlobs(flame, [2.0, 1.5, 1.05, 0.62], M.light2, [0.05 * fl, 0.06 * fl, 0.075 * fl, 0.09 * fl], 850);
  if (open > 0.05) light += poly(wpoly(c, [[w.x0, 0, zw - 0.05], [w.x1, 0, zw - 0.05], [w.x1 + 0.5, 0, zw - 2.0], [w.x0 - 0.15, 0, zw - 2.1]], 860, 0.03, 0.5), M.fogC, `opacity="${n(open * (0.12 + 0.3 * cold))}" style="mix-blend-mode:screen"`);
  for (let i = 0; i < 30; i++) {
    const a = hash(i + 870) * 6.28 + t * (0.1 + 0.15 * hash(i + 880)), rr = 0.15 + 0.85 * hash(i + 890), p = P(c, r.candle.X + Math.cos(a) * rr + Math.sin(t * 0.5 + i) * 0.04, r.candle.Y + Math.sin(a * 1.3 + i) * rr * 0.7 - ((t * 0.03 * (0.5 + hash(i))) % 0.3) + 0.1, zw - 0.25 - 0.9 * hash(i + 900));
    light += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(Math.max(1, (0.004 + 0.007 * hash(i + 910)) * p.s))}" fill="${M.iwallL}" opacity="${n(clamp(fl) * (0.25 + 0.5 * hash(i + 920)) * (0.6 + 0.4 * Math.sin(t * 2 + i)))}"/>`;
  }
  // blurred foreground: herbs and a ristra hanging from a viga, top left
  const z = 1 + Math.max(0, c.z) * 0.1, ox = -c.x * 90;
  let front = `<g filter="url(#dof)"><rect x="${n(-80 + ox)}" y="-40" width="${n(620 * z)}" height="${n(90 * z)}" fill="${M.woodS}" transform="rotate(-4)"/>`;
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 105 * z + ox, len = (250 + 110 * hash(i + 950)) * z, sw = Math.sin(t * 0.8 + i) * 3;
    front += `<g transform="translate(${n(x)},30) rotate(${n(sw)})"><path d="M0,0 L0,${n(len * 0.35)}" stroke="${M.owlDark}" stroke-width="6"/>`;
    if (i % 2) for (let j = 0; j < 9; j++) front += `<path d="M0,0 q${n(15 * z)},${n(30 * z)} 0,${n(74 * z)} q${n(-15 * z)},${n(-34 * z)} 0,${n(-74 * z)} Z" fill="${j % 3 ? M.chile : mix(M.chile, M.owlDark, 0.4)}" transform="translate(0,${n(len * 0.3 + j * 20 * z)}) rotate(${n((j % 2 ? 1 : -1) * (25 + 20 * hash(j + i)))})"/>`;
    else for (let j = -3; j <= 3; j++) front += `<path d="M0,${n(len * 0.3)} q${n(j * 10 * z)},${n(len * 0.3)} ${n(j * 26 * z)},${n(len * 0.62)}" stroke="${j % 2 ? M.dadoS : M.owlDark}" stroke-width="${n(12 * z)}" fill="none" stroke-linecap="round"/>`;
    front += `</g>`;
  }
  front += `</g>`;
  // the vigas overhead (drawn last in back so they sit over the wall top)
  for (const X of [-1.45, -0.5, 0.45, 1.4]) {
    const a = 0.06, y0 = r.h - 0.15;
    s += poly([P(c, X - a, y0, zn), P(c, X + a, y0, zn), P(c, X + a, y0, zw), P(c, X - a, y0, zw)], M.wood);
    if (c.x > X + a) s += poly([P(c, X + a, y0, zn), P(c, X + a, r.h, zn), P(c, X + a, r.h, zw), P(c, X + a, y0, zw)], M.woodS);
    if (c.x < X - a) s += poly([P(c, X - a, y0, zn), P(c, X - a, r.h, zn), P(c, X - a, r.h, zw), P(c, X - a, y0, zw)], M.woodS);
    s += `<path d="M${pt(P(c, X - a, y0, zn))} L${pt(P(c, X - a, y0, zw))} M${pt(P(c, X + a, y0, zn))} L${pt(P(c, X + a, y0, zw))}" stroke="${INK}" stroke-width="${n(Math.max(1, 0.006 * k))}"/><path d="M${pt(P(c, X + jit(X * 3, 0.03), y0, zn + 0.3))} L${pt(P(c, X + jit(X * 5, 0.03), y0, zw - 0.4))}" stroke="${M.woodS}" stroke-width="${n(Math.max(0.8, 0.004 * k))}" stroke-dasharray="${n(0.3 * k)} ${n(0.12 * k)}"/>`;
  }
  return { back: s, light, front, flame };
}

// ---------------------------------------------------------------- LA LECHUZA: a barn owl taller than a person
// st: { X, Y (perch height, m), Z, size (1 = about 2 m tall; 0.17 = a real barn owl), facing 1 front | -1 back,
//   turn -2..2 (head: 1 = 90 degrees to her left, 2 = right round to look behind), tilt deg (head roll), look -1..1 (eyes),
//   beak 0..1 (open: the cry), spread 0..1 (0 wings folded, 1 full threat), lift -1..1 (spread wings down..up: flap),
//   puff 0..1 (feathers on end), wide 0..1 (eyes startled), eyes 0..1 (lids), blink 0..1, human 0..1 (1 = human-like almond
//   eyes with whites, 0 = round black owl eyes), lean deg (whole body), crouch 0..1 (before take-off), fly 0..1 (legs tucked,
//   body shortened), eerie 0..1 (default 1: taller, thinner, long legs, hunched, long dark-rimmed face; 0 = the plain bird),
//   shadow (false to drop the contact shadow) }
export function lechuza(c, st, t = 0) {
  if (!vis(c, st.Z)) return "";
  const size = st.size ?? 1, p = P(c, st.X, st.Y || 0, st.Z), k = p.s / 100 * size, sw = 0.75 / Math.sqrt(size);
  const facing = st.facing ?? 1, a = (st.turn || 0) * Math.PI / 2, E = st.eerie ?? 1, LX = 18 * E, puff = st.puff || 0, sp = st.spread || 0, lift = st.lift || 0, beak = st.beak || 0, fly = st.fly || 0, crouch = st.crouch || 0, human = st.human ?? 1, wide = st.wide || 0;
  const breath = Math.sin(t * 1.3) * lerp(0.7, 0.22, E) * (1 - fly), id = UID++, back = facing < 0;
  const O = (d, fill, w = sw) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${n(w)}" stroke-linejoin="round"/>`;
  const ring = (cx, cy, rxf, ry, N, seed, spike) => Array.from({ length: N }, (_, i) => { const an = i / N * Math.PI * 2, r = 1 + jit(seed + i, 0.022) + (i % 2 ? spike : -spike * 0.35) * (0.6 + 0.8 * hash(seed + i + 50)); return { x: cx + Math.sin(an) * rxf(an) * r, y: cy - Math.cos(an) * ry * r }; });
  const feather = (x, y, th, len, wd, fill, bar, seed, bars = true) => `<g transform="translate(${n(x)},${n(y)}) rotate(${n(th - 90)})"><path d="M0,0 Q${n(wd * 0.55)},${n(len * 0.3)} ${n(wd * 0.45)},${n(len * 0.78)} Q${n(wd * 0.25)},${n(len)} ${n(jit(seed, 0.8))},${n(len)} Q${n(-wd * 0.25)},${n(len)} ${n(-wd * 0.45)},${n(len * 0.78)} Q${n(-wd * 0.55)},${n(len * 0.3)} 0,0 Z" fill="${fill}" stroke="${INK}" stroke-width="${n(sw * 0.8)}" stroke-linejoin="round"/><path d="M0,${n(len * 0.1)} L${n(jit(seed + 1, 0.6))},${n(len * 0.92)}" stroke="${bar}" stroke-width="${n(sw * 0.6)}" opacity="0.6"/>${bars ? `<path d="M${n(-wd * 0.4)},${n(len * (0.58 + jit(seed + 2, 0.03)))} Q0,${n(len * 0.66)} ${n(wd * 0.4)},${n(len * 0.58)} M${n(-wd * 0.36)},${n(len * 0.8)} Q0,${n(len * 0.87)} ${n(wd * 0.36)},${n(len * (0.79 + jit(seed + 3, 0.02)))}" stroke="${bar}" stroke-width="${n(1.7)}" fill="none" stroke-linecap="round"/>` : ""}</g>`;
  // ---- wings: 13 flight feathers each, placed one by one, a few loose; coverts over the arm
  const upper = M.owlGrey, flightCol = back ? upper : mix(upper, M.owlBreast, sp), covCol = back ? M.owlBuff : mix(M.owlBuff, M.owlFace, sp * 0.75);
  const wing = (side, seed) => {
    const S = [29, lerp(-128, -137, E)], Wp = [lerp(46, 112, sp), lerp(-88, -166 - lift * 36, sp)], T = [lerp(35, 208, sp), lerp(-38, -146 - lift * 92, sp)];
    const armAng = Math.atan2(T[1] - Wp[1], T[0] - Wp[0]) * 180 / Math.PI, NF = 13;
    const at = (u) => u < 0.45 ? [lerp(S[0], Wp[0], u / 0.45), lerp(S[1], Wp[1], u / 0.45)] : [lerp(Wp[0], T[0], (u - 0.45) / 0.55), lerp(Wp[1], T[1], (u - 0.45) / 0.55)];
    const ang = (u, i) => lerp(lerp(84, 100, u), lerp(86, armAng + 14, u ** 1.5), sp) + (hash(seed * 3 + i) > 0.8 ? jit(seed + i, 8) : jit(seed + i, 2.4)) + puff * jit(seed + i + 70, 8);
    let g = "";
    if (sp < 0.3) {   // at rest: one smooth closed wing, coverts layered on top, the long primaries crossing at the tail
      const x0 = S[0], y0 = S[1], tipX = (back ? -9 : -6) + jit(seed, 1.5), tipY = -5 + jit(seed + 1, 2), inX = back ? 4 : 22, fold = y0 + 58;
      const outer = `M${x0 - 9},${y0 + 3} C${x0 + 12},${y0 - 13} ${x0 + 25},${y0 + 20} ${x0 + 20},${fold}`;
      const whole = `${outer} C${x0 + 16},${fold + 34} ${x0 - 2},${tipY - 30} ${tipX},${tipY} C${inX - 6},${tipY - 26} ${inX},${fold + 26} ${inX - 1},${y0 + 34} C${inX - 1},${y0 + 16} ${x0 - 12},${y0 + 12} ${x0 - 9},${y0 + 3} Z`;
      g += `<path d="${whole}" fill="${M.owlGrey}"/><path d="${outer} Q${n((x0 + 20 + inX) / 2)},${fold + 15} ${inX},${fold - 2} L${inX - 1},${y0 + 34} C${inX - 1},${y0 + 16} ${x0 - 12},${y0 + 12} ${x0 - 9},${y0 + 3} Z" fill="${covCol}"/>`;
      for (let i = 0; i < 4; i++) { const ax = x0 + 17 - i * 6.5, ay = fold + 4 + i * 3, bx = tipX + 3 + i * 3.2, by2 = tipY - 4 - i * 9; g += `<path d="M${n(ax)},${n(ay)} Q${n(ax - 1 + jit(seed + i, 1.5))},${n((ay + by2) / 2 + 6)} ${n(bx)},${n(by2)}" stroke="${M.owlDark}" stroke-width="${n(sw * 0.9)}" fill="none" stroke-linecap="round"/>`; for (const u of [0.35, 0.62]) { const qx = lerp(ax, bx, u) + 3, qy = lerp(ay, by2, u) + 4; g += `<path d="M${n(qx - 3.4)},${n(qy)} q3.4,2.6 6.6,-0.6" stroke="${M.owlDark}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/>`; } }
      for (let r = 0; r < 4; r++) { const y = y0 + 12 + r * 13, xa = Math.max(inX + 3, x0 - 12 + r * 2), xb = x0 + 15 + Math.min(r, 2) * 2.4, cnt = back ? 4 : 2; for (let j = 0; j < cnt; j++) { const x = lerp(xa, xb - 8, cnt > 1 ? j / (cnt - 1) : 0) + jit(seed + r * 5 + j, 1.4), yy = y + jit(seed + r * 7 + j, 1.6) + j * 1.5; g += `<path d="M${n(x)},${n(yy)} q${n(4 + jit(seed + r + j, 0.8))},${n(7 + jit(seed + r * 3 + j, 1.4))} 9,0.4" stroke="${M.owlBuffS}" stroke-width="${n(sw)}" fill="none" stroke-linecap="round"/>`; if ((r + j) % 2) g += `<circle cx="${n(x + 4.4)}" cy="${n(yy + 8)}" r="1" fill="${M.owlFace}"/><circle cx="${n(x + 4.9)}" cy="${n(yy + 9.8)}" r="0.7" fill="${M.owlDark}"/>`; } }
      g += `<path d="M${x0 + 19},${fold - 6} q2.6,5 -0.6,10 M${x0 + 13},${fold + 30} q1,4 -2,7" stroke="${INK}" stroke-width="${n(sw * 0.7)}" fill="none" stroke-linecap="round"/>` + ink(whole, sw, seed, 1);
      return `<g transform="scale(${side},1)"><g transform="rotate(${n(-sp * 75)} ${x0} ${y0})">${g}</g></g>`;
    }
    // primaries and secondaries, tip first so each overlaps the next like shingles
    for (let i = NF - 1; i >= 0; i--) { const u = i / (NF - 1), b = at(u), len = lerp(lerp(44, 20, u), lerp(86, 108, u ** 0.7), sp) * (1 + jit(seed + i + 40, 0.07)) * (hash(seed + i + 90) > 0.9 ? 0.8 : 1); g += feather(b[0], b[1], ang(u, i), len, lerp(lerp(19, 14, u), lerp(16, 11, u), sp), i % 4 === 1 ? mix(flightCol, M.owlBuff, 0.3) : flightCol, M.owlDark, seed + i); }
    // greater coverts, then lesser coverts, each feather on its own
    for (let i = 10; i >= 0; i--) { const u = 0.02 + i * 0.094, b = at(u); g += feather(b[0], b[1], ang(u, i + 20) - 3, lerp(40, 50, sp) * (0.85 + 0.3 * hash(seed + i + 120)), lerp(21, 14, sp), i % 3 ? mix(covCol, M.owlGrey, back || sp < 0.5 ? 0.35 : 0.1) : mix(covCol, M.owlBuffS, 0.35), M.owlBuffS, seed + i + 200, false); }
    for (let i = 8; i >= 0; i--) { const u = 0.02 + i * 0.115, b = at(u); g += feather(b[0], b[1] - 2, ang(u, i + 40) - 5, lerp(33, 27, sp) * (0.85 + 0.3 * hash(seed + i + 150)), lerp(22, 13, sp), i % 3 === 1 ? mix(covCol, M.owlBuffS, 0.3) : covCol, M.owlBuffS, seed + i + 260, false); const bb = at(u + 0.03); if (i % 2) g += `<circle cx="${n(bb[0] + jit(seed + i + 9, 3))}" cy="${n(bb[1] + 7 + jit(seed + i + 19, 3))}" r="1" fill="${M.owlFace}"/><circle cx="${n(bb[0] + jit(seed + i + 9, 3) + 0.5)}" cy="${n(bb[1] + 8.8 + jit(seed + i + 19, 3))}" r="0.7" fill="${M.owlDark}"/>`; }
    // the leading edge of the open wing; folded, only a round shoulder shows
    if (sp > 0.04) { const d = `M${S[0]},${S[1]} Q${n(lerp(S[0], Wp[0], 0.6))},${n(Wp[1] - 10 * sp)} ${n(Wp[0])},${n(Wp[1])} Q${n(lerp(Wp[0], T[0], 0.5))},${n(lerp(Wp[1], T[1], 0.5) - 9 * sp)} ${n(T[0])},${n(T[1])}`; g += `<path d="${d}" stroke="${INK}" stroke-width="${n(9 * sp + sw * 2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${covCol}" stroke-width="${n(9 * sp)}" fill="none" stroke-linecap="round"/>`; }
    g += `<path d="M${S[0] - 9},${S[1] + 4} Q${S[0] - 6},${S[1] - 11} ${S[0] + 6},${S[1] - 8} Q${S[0] + 14},${S[1] - 2} ${S[0] + 10},${S[1] + 9} Q${S[0]},${S[1] + 3} ${S[0] - 9},${S[1] + 4} Z" fill="${covCol}" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/>`;
    return `<g transform="scale(${side},1)">${g}</g>`;
  };
  // ---- tail, legs, talons
  let tail = "";
  for (let i = 0; i < 5; i++) tail += feather(jit(i + 5, 1.5), -40 + fly * 6, 90 + (i - 2) * (9 + 9 * fly + 5 * sp) + jit(i + 30, 2), (back ? 50 : 37) + fly * 14, 13, i % 2 ? M.owlGrey : mix(M.owlGrey, M.owlBuff, 0.4), M.owlDark, i + 300);
  let legs = "";
  if (fly < 0.6) for (const d of [-1, 1]) {
    const x = d * (lerp(13, 10.5, E) + jit(d + 3, 1.2)), LT = -36 - LX, hw = lerp(6.5, 5.6, E);
    legs += O(`M${n(x - hw)},${LT} Q${n(x - hw - 0.6 + d * E * 1.5)},${n(LT * 0.45)} ${n(x - 3.2)},-3 L${n(x + 3.2)},-3 Q${n(x + hw - 0.6 + d * E * 1.5)},${n(LT * 0.45)} ${n(x + hw)},${LT} Z`, M.owlBreast) + `<path d="M${n(x - 3)},${n(LT * 0.66)} q2,3 4,0 M${n(x - 2)},${n(LT * 0.4)} q2,3 4,0 M${n(x - 2.4)},${n(LT * 0.2)} q2,2.6 4,0 M${n(x + 2.4)},${n(LT * 0.85)} Q${n(x + 4.4)},${n(LT * 0.45)} ${n(x + 2.4)},-5" stroke="${M.owlFaceS}" stroke-width="${n(sw)}" fill="none" stroke-linecap="round"/>`;
    for (const [tx, ty] of [[-8, 2.5], [0.5, 4], [8, 2.2]]) legs += `<path d="M${n(x)},-3 Q${n(x + tx * 0.7)},-3 ${n(x + tx)},${ty}" stroke="${INK}" stroke-width="${n(3.6 + sw * 1.6)}" fill="none" stroke-linecap="round"/><path d="M${n(x)},-3 Q${n(x + tx * 0.7)},-3 ${n(x + tx)},${ty}" stroke="#d8a85a" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${n(x + tx)},${ty - 0.5} q${n(tx * 0.12 + 0.6)},3 ${n(-tx * 0.06)},6.4" stroke="${M.owlDark}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  // ---- body: a soft egg, buff flanks, pale breast with scalloped feathers and dark flecks, each placed by hand
  const by = -80, bry = lerp(57, 63, E) * (1 - 0.3 * fly) * (1 - 0.12 * crouch), bw = (an) => (lerp(40, 32.5, E) + lerp(6, 10.5, E) * Math.cos(an)) * (1 + 0.2 * puff);
  const bodyR = ring(0, by, bw, bry, 30, 7, puff * 0.085), bodyD = blob(bodyR);
  let body = O(bodyD, M.owlBuff);
  if (!back) {
    body += `<path d="${blob(ring(0, by + 3, (an) => (lerp(27, 20.5, E) + lerp(4, 6.5, E) * Math.cos(an)) * (1 + 0.2 * puff), bry * 0.9, 22, 19, puff * 0.06))}" fill="${M.owlBreast}"/>`;
    for (let r = 0; r < 9; r++) { const y = by + (-41 + r * 10.5) * bry / 57, half = (25 - Math.abs(r - 3.5) * 1.9) * (1 + 0.2 * puff) * lerp(1, 0.78, E) * (r < 2 ? 1 : lerp(1, 0.9, E)), cnt = 5 - (r % 2); for (let j = 0; j < cnt; j++) { const x = lerp(-half, half, j / (cnt - 1)) + jit(r * 9 + j, 2.2), yy = y + jit(r * 13 + j, 1.7); body += `<path d="M${n(x - 4)},${n(yy)} q4,${n(4.4 + jit(r + j, 1) + puff * 2)} 8,0" stroke="${M.owlFaceS}" stroke-width="${n(sw)}" fill="none" stroke-linecap="round"/>`; if (hash(r * 17 + j) > 0.42) body += `<path d="M${n(x + jit(r + j * 3, 1.5))},${n(yy + 5)} l1,2.8 l-2,0 Z" fill="${M.owlDark}"/>`; } }
  } else {
    for (let r = 0; r < 8; r++) for (let j = 0; j < 5 - (r % 2); j++) { const x = lerp(-26, 26, j / (4 - (r % 2))) + jit(r * 9 + j, 2.5), y = by - 42 + r * 11 + jit(r * 5 + j, 2); body += `<path d="M${n(x - 5)},${n(y)} q5,${n(6 + jit(r + j, 1.2))} 10,0" stroke="${M.owlGrey}" stroke-width="${n(sw * 1.6)}" fill="none" stroke-linecap="round"/><circle cx="${n(x)}" cy="${n(y + 6)}" r="1" fill="${M.owlFace}"/><circle cx="${n(x + 0.4)}" cy="${n(y + 7.6)}" r="0.7" fill="${M.owlDark}"/>`; }
  }
  // one shade tone down the side away from the moon
  body += `<path d="M${pt(bodyR[29])} ${bodyR.slice(16, 30).reverse().map((q) => `L${pt(q)}`).join(" ")} Q${n(-16 - 8 * puff)},${n(by)} ${pt(bodyR[29])} Z" fill="${M.owlBuffS}" opacity="0.45"/>` + ink(bodyD, sw, 8, 1);
  // ---- head: crown with speckles, the heart-shaped face
  const hx = Math.sin(a) * 4 * facing, hy = -158 + 3 * E, cosA = Math.cos(a) * facing, showFace = cosA > 0.08, fcx = hx + Math.sin(a) * 29 * (back ? -1 : 1), sx = Math.max(0.1, cosA) * lerp(1, 0.94, E);
  const headR = ring(hx, hy, () => lerp(41, 38.5, E) * (1 + 0.12 * puff), 35 * (1 + 0.1 * puff), 26, 41, puff * 0.07), headD = blob(headR);
  let head = O(headD, M.owlBuff);
  for (let i = 0; i < 22; i++) { const x = hx + jit(i + 410, 34), y = hy - 34 + hash(i + 420) * (showFace ? 20 : 62); if (((x - hx) / 40) ** 2 + ((y - hy) / 34) ** 2 > 0.82) continue; head += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.9 + 0.5 * hash(i))}" fill="${M.owlFace}"/><circle cx="${n(x + 0.5)}" cy="${n(y + 1.7)}" r="0.7" fill="${M.owlDark}"/>`; }
  head += `<path d="M${pt(headR[25])} ${headR.slice(15, 26).reverse().map((q) => `L${pt(q)}`).join(" ")} Q${n(hx - 24)},${n(hy)} ${pt(headR[25])} Z" fill="${M.owlBuffS}" opacity="0.4"/>` + ink(headD, sw, 42, 1);
  if (showFace) {
    const chin = lerp(38, 47, E) + beak * 7, open = (st.eyes ?? 1) * (1 - (st.blink || 0)), look = st.look || 0;
    const heart = `M0.6,-21 C-8,-34.5 -34.5,-33 -36.5,-8 C-37.5,${n(14 + 3 * E)} ${n(-16 + 3 * E)},${n(31 + 6 * E)} 0.4,${chin} C${n(16.5 - 3 * E)},${n(30 + 6 * E)} 37,${n(13.5 + 3 * E)} 35.6,-8.6 C33.4,-33.6 8.4,-34 0.6,-21 Z`;
    let f = `<path d="${heart}" fill="${M.owlFace}" stroke="${mix(M.owlBuffS, M.owlDark, E)}" stroke-width="${n(lerp(3.4, 4.4, E))}" stroke-linejoin="round"/><path d="${heart}" fill="none" stroke="${M.owlBuffS}" stroke-width="${n(1.1 * E)}" transform="translate(0,0.4) scale(0.925)" opacity="0.8"/><path d="${heart}" fill="none" stroke="${INK}" stroke-width="${n(sw)}" transform="translate(0,-1.1) scale(1.045)"/>`;
    // shade under the brow lobes and the long ridge down to the beak (it reads as a nose)
    f += `<path d="M-33,-12 C-30,-29 -11,-31 -1,-19 C-10,-25 -27,-24 -33,-12 Z M34,-12 C31,-29 11,-31 2,-19 C11,-25 27,-24 34,-12 Z" fill="${M.owlFaceS}" opacity="0.75"/><path d="M-3.4,-17 Q0,-21.5 3.2,-17 L2.6,7 L-2.8,7 Z" fill="${M.owlFaceS}"/>`;
    for (let i = 0; i < 26; i++) { const d = i % 2 ? 1 : -1, an = (hash(i + 500) * 1.5 + 0.1) * Math.PI, r0 = 12.5 + 2 * hash(i + 510), r1 = r0 + 4 + 5 * hash(i + 520), ex = d * 15.5, ey = -5; const x0 = ex + Math.cos(an) * r0 * d, y0 = ey + Math.sin(an) * r0 * 1.1 - 3, x1 = ex + Math.cos(an) * r1 * d, y1 = ey + Math.sin(an) * r1 * 1.1 - 3; if (Math.abs(x1) > 31 || y1 > 26 || y1 < -27 || Math.abs(x0) < 4) continue; f += `<path d="M${n(x0)},${n(y0)} L${n(x1)},${n(y1)}" stroke="${M.owlFaceS}" stroke-width="${n(sw * 0.9)}" stroke-linecap="round"/>`; }
    for (const d of [-1, 1]) {
      const ex = d * (lerp(15.5, 14.6, E) + (d > 0 ? 0.4 : 0)), ey = -5 + (d > 0 ? 0.5 : 0), ew = 8.8 + wide * 1.4, eh = (lerp(5.3, 4.7, E) + 3.4 * wide) * Math.max(0.05, open);
      if (human >= 0.5) f += `<path d="M${n(d * 9)},${n(8 + E)} Q${n(d * 21)},${n(12 + E)} ${n(d * 30)},3 Q${n(d * 23)},${n(19 + 2 * E)} ${n(d * 12)},${n(17 + 2 * E)} Z" fill="${M.owlFaceS}" opacity="${n(0.5 * human)}"/><path d="M${n(d * 9)},${n(8 + E)} Q${n(d * 21)},${n(12 + E)} ${n(d * 30)},3" stroke="${M.owlBuffS}" stroke-width="0.7" fill="none" opacity="0.6" stroke-linecap="round"/>`;
      if (human < 0.5) {   // the real animal: round, all dark
        f += open < 0.2 ? `<path d="M${n(ex - 6)},${n(ey)} q6,3 12,0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="6.6" ry="${n(6.9 * open)}" fill="#140a16" stroke="${M.owlBuffS}" stroke-width="1.2"/><circle cx="${n(ex + 2)}" cy="${n(ey - 2.4)}" r="1.5" fill="#fff"/>`;
        continue;
      }
      const inn = [ex - d * ew, ey + 1.8], out = [ex + d * ew, ey - 1.4];
      const top = `M${n(inn[0])},${n(inn[1])} Q${n(ex - d * ew * 0.15)},${n(ey - eh * 1.55)} ${n(out[0])},${n(out[1])}`;
      // a rusty tear stain from the inner corner, like the real bird, like someone who has been crying
      f += `<path d="M${n(inn[0] + d * 1.5)},${n(inn[1])} Q${n(inn[0] - d * 2.6)},${n(inn[1] + 7)} ${n(inn[0] - d * 1.2)},${n(inn[1] + 15)} Q${n(inn[0] + d * 2.4)},${n(inn[1] + 7)} ${n(inn[0] + d * 4)},${n(inn[1] + 1.5)} Z" fill="${M.owlBuffS}" opacity="0.55"/>`;
      if (open < 0.2) { f += `<path d="M${n(inn[0])},${n(inn[1])} Q${n(ex)},${n(ey + 3)} ${n(out[0])},${n(out[1])}" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; continue; }
      const shape = `${top} Q${n(ex + d * ew * 0.1)},${n(ey + eh * 1.3)} ${n(inn[0])},${n(inn[1])} Z`, ix = ex + look * 2.6, ir = 5.5, pr = ir * clamp((st.pupil ?? 0.5) - wide * 0.24);
      const cid = `oe${id}${d > 0 ? "r" : "l"}`, lid = mix(M.owlFaceS, M.owlBuffS, 0.4), lashC = [ex - d * ew * 0.15, ey - eh * 1.55], creaseC = [ex - d * ew * 0.1, ey - eh * 1.55 - 4.4 - wide * 1.5], low = `M${n(out[0])},${n(out[1])} Q${n(ex + d * ew * 0.1)},${n(ey + eh * 1.3)} ${n(inn[0])},${n(inn[1])}`;
      f += `<path d="M${n(inn[0])},${n(inn[1])} Q${n(creaseC[0])},${n(creaseC[1])} ${n(out[0] + d * 0.6)},${n(out[1] - 1)} Q${n(lashC[0])},${n(lashC[1])} ${n(inn[0])},${n(inn[1])} Z" fill="${lid}"/><path d="M${n(inn[0] + d)},${n(inn[1] - 1)} Q${n(creaseC[0])},${n(creaseC[1])} ${n(out[0] + d * 0.6)},${n(out[1] - 1)}" stroke="${M.owlBuffS}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
      f += `<clipPath id="${cid}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#f4ebe0"/><g clip-path="url(#${cid})"><circle cx="${n(ix)}" cy="${n(ey - 0.2)}" r="${ir}" fill="#3a1826"/><circle cx="${n(ix)}" cy="${n(ey - 0.2)}" r="${n(ir * 0.8)}" fill="#1c0c14"/><circle cx="${n(ix)}" cy="${n(ey - 0.2)}" r="${n(pr)}" fill="#000"/><path d="M${n(inn[0])},${n(inn[1])} Q${n(ex)},${n(ey - eh * 1.15)} ${n(out[0])},${n(out[1])} L${n(out[0])},${n(ey - 12)} L${n(inn[0])},${n(ey - 12)} Z" fill="${INK}" opacity="0.26"/><path d="${low}" stroke="#ffffff" stroke-width="1.7" fill="none" opacity="0.6"/><ellipse cx="${n(ix + 2)}" cy="${n(ey - 2.2)}" rx="1.5" ry="1.25" fill="#fff"/><circle cx="${n(ix - 2.3)}" cy="${n(ey + 1.9)}" r="0.6" fill="#fff" opacity="0.85"/></g>`;
      f += `<path d="${top} l${n(d * 1.6)},-1.3" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${low}" stroke="${INK}" stroke-width="0.6" fill="none"/><path d="M${n(out[0] - d * 1.5)},${n(out[1] + 3.4)} Q${n(ex)},${n(ey + eh * 1.3 + 3.2)} ${n(inn[0] + d * 2.5)},${n(inn[1] + 3)}" stroke="${M.owlBuffS}" stroke-width="0.6" fill="none" opacity="0.7" stroke-linecap="round"/>`;
    }
    // the beak: closed it is a small pale hook; open, a dark mouth drops beneath it
    if (beak > 0.04) f += `<path d="M-3.4,11 Q0,9 3.4,11 Q${n(4.4 + beak * 1.6)},${n(15 + beak * 9)} 0,${n(18.5 + beak * 14)} Q${n(-4.4 - beak * 1.6)},${n(15 + beak * 9)} -3.4,11 Z" fill="#3a1030" stroke="${INK}" stroke-width="${n(sw)}"/><path d="M-1.6,${n(15.5 + beak * 9)} Q0,${n(13.5 + beak * 8)} 1.6,${n(15.5 + beak * 9)} Q0.6,${n(17.5 + beak * 12)} -1.6,${n(15.5 + beak * 9)} Z" fill="#b8607a"/><path d="M${n(-2.8 - beak)},${n(16 + beak * 11.5)} Q0,${n(20.5 + beak * 15.5)} ${n(2.8 + beak)},${n(16 + beak * 11.5)} Q0,${n(18.2 + beak * 13)} ${n(-2.8 - beak)},${n(16 + beak * 11.5)} Z" fill="#e8c8a0" stroke="${INK}" stroke-width="${n(sw * 0.7)}"/>`;
    f += `<g transform="rotate(${n(-beak * 7)} 0 5)"><path d="M-3.5,5.6 Q0,2.6 3.4,5.8 Q2.6,12.6 0.3,17.2 Q-2.6,12.6 -3.5,5.6 Z" fill="#f0d0a8" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/><path d="M0.6,6 Q1.8,11 0.4,16" stroke="#c89a78" stroke-width="0.8" fill="none"/></g>`;
    const fid = `of${id}`;
    head += `<clipPath id="${fid}"><path d="${blob(ring(hx, hy + 4, () => 43 * (1 + 0.12 * puff), 44, 20, 41, 0))}"/></clipPath><g clip-path="url(#${fid})"><g transform="translate(${n(fcx)},${hy}) scale(${n(sx * 100) / 100},1)">${f}</g></g>`;
  }
  // a few loose feathers standing off the crown and shoulder
  let loose = "";
  for (const [x, y, th, len] of [[-13, -192, -100, 7], [-43, -126, 165, 10], [45, -100, 24, 9]]) loose += feather(x * (1 + 0.14 * puff), y, th + jit(x, 6), len * (1 + 1.2 * puff), 4.2, M.owlBuff, M.owlBuffS, x, false);
  const wings = wing(1, 600) + wing(-1, 700);
  const shadow = st.shadow === false || fly > 0.3 ? "" : `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(46 * k)}" ry="${n(7 * k)}" fill="url(#soft)"/>`;
  const up = `translate(0,${n(crouch * 15 + breath - LX * (1 - 0.4 * crouch))})`;
  return shadow + `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(st.lean || 0)}) scale(${k.toFixed(4)})">
    <g transform="${up}">${back ? "" : tail + wings}</g><g transform="scale(1,${n(1 - 0.4 * crouch)})">${legs}</g>
    <g transform="${up}">${back ? body + tail + wings : body}${loose}<g transform="rotate(${n(st.tilt || 0)} 0 -132)">${head}</g></g></g>`;
}
// named poses to blend between: owlPose("perch", "cry", u)
export const OWL = {
  perch: { turn: 0, tilt: 0, beak: 0, spread: 0, lift: 0, puff: 0, wide: 0, lean: 0, crouch: 0, fly: 0 },
  watch: { turn: 0.55, tilt: 9, beak: 0, spread: 0, lift: 0, puff: 0, wide: 0, lean: 0, crouch: 0, fly: 0 },
  cry: { turn: 0, tilt: -7, beak: 1, spread: 0.06, lift: 0, puff: 0.15, wide: 0.15, lean: -3, crouch: 0, fly: 0 },
  threat: { turn: 0, tilt: 0, beak: 0.6, spread: 1, lift: 0.25, puff: 0.35, wide: 0.5, lean: 0, crouch: 0.2, fly: 0 },
  flinch: { turn: -0.25, tilt: -12, beak: 0.35, spread: 0.3, lift: 0.6, puff: 1, wide: 1, lean: -9, crouch: 0.35, fly: 0 },
  flight: { turn: 0, tilt: 0, beak: 0, spread: 1, lift: 0, puff: 0, wide: 0, lean: 0, crouch: 0, fly: 1 },
};
export function owlPose(a, b, u) { const A = OWL[a] || a, B = OWL[b] || b, o = {}; for (const k in OWL.perch) o[k] = lerp(A[k] ?? 0, B[k] ?? 0, u); return o; }
// the real animal, for the proof beat: small, round dark eyes
export const barnOwl = (c, st, t = 0) => lechuza(c, { size: 0.17, human: 0, eerie: 0, ...st }, t);
// loose feathers in the air. list: [{ X, Y, Z, rot, size }]
export function feathers(c, list) {
  return list.map((f, i) => {
    if (!vis(c, f.Z)) return "";
    const p = P(c, f.X, f.Y, f.Z), k = p.s / 100 * (f.size ?? 1);
    return `<g transform="translate(${pt(p)}) rotate(${n(f.rot || 0)}) scale(${k.toFixed(4)})"><path d="M0,-16 Q7,-6 5,8 Q2,15 0,16 Q-3,14 -5.4,7 Q-7,-6 0,-16 Z" fill="${i % 2 ? M.owlBreast : M.owlBuff}" stroke="${INK}" stroke-width="0.8"/><path d="M0,-13 L0,22" stroke="${M.owlBuffS}" stroke-width="0.9"/><path d="M-4.6,4 Q0,6 4.8,3.4" stroke="${M.owlDark}" stroke-width="1.6" fill="none"/><path d="M3,-8 l2.4,-1.6 M-3.4,-3 l-2.4,-1" stroke="${INK}" stroke-width="0.6"/></g>`;
  }).join("");
}
export const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
