// Legend channel, the Night Marchers (huaka'i po), O'ahu: the hillside set + the hosts' new poses, in the legend.mjs
// style (flat fills, thin dark outline, one shade tone; light = flat screen-blend shapes, never a glossy gradient).
// World: metres, X right, Y up, Z away from the camera; camera c = { x, y, z, h0?, f? } as in legend.mjs.
// RESPECT RULE: nothing here draws a marcher. They exist only as far torch points on the ridge (torchLine), light
// (torchWash, stopDark), shadows of legs and bare feet on the ground (feetShadows) and flames in a puddle (puddle).
// Every shape is seeded (hash), so a frame is a pure function of (camera, t, palette).
import * as L from "./legend.mjs";
const { W, H, INK, P, n, lerp, clamp, hash, mix } = L;

// ---------------------------------------------------------------- palettes: the four moods
// sky = 8 flat bands, top -> horizon. blade = 3 grass tones, lit = the same blades in torchlight.
// mulChar / mulProp = multiply tints for the cast (filter #hchar) and for props that keep their own colours.
export const HPAL = {
  night: {
    sky: ["#090726", "#100c3c", "#1a1258", "#2a1a7a", "#44239a", "#6a2fae", "#9a3fae", "#cf5a9c"], star: 1,
    moon: "#fff1c9", moonSh: "#d9c6e6", halo: "#8a6fe0", cloud: "#3a2a86", cloudRim: "#b9a6ff",
    ridgeFar: "#2b2478", ridge: "#0b2226", ridgeLit: "#17414a", rim: "#7fd6e0", foot: "#0c1a30", mist: "#8f86e6",
    soil: "#181650", soil2: "#2a2a80", fold: "#1c2068", haze: "#4a3f9c",
    blade: ["#1d2470", "#2a3a9c", "#3d55c0"], tip: "#9fa6ff", lit: ["#c2491c", "#f0822a", "#ffc45a"],
    stone: "#5a5aa0", stoneSh: "#2a2862", stoneEdge: "#b3b8ff", moss: "#2f8a7a",
    water: "#241c6e", shadow: "#070418", mulChar: "#cfc9f6", mulProp: "#8f92dc",
  },
  torch: {
    sky: ["#090726", "#150a3a", "#34104a", "#6a154a", "#a81f38", "#dc3c1e", "#ff7218", "#ffb43a"], star: 0.35,
    moon: "#ffd9a0", moonSh: "#e0a070", halo: "#c0482a", cloud: "#5a1640", cloudRim: "#ff8a3a",
    ridgeFar: "#4a123e", ridge: "#170810", ridgeLit: "#4a1418", rim: "#ff7a2a", foot: "#1c0810", mist: "#ff6a3a",
    soil: "#3a0c16", soil2: "#7a1c16", fold: "#55101a", haze: "#8a2030",
    blade: ["#4f0e18", "#93201a", "#d6481a"], tip: "#ffc85a", lit: ["#e8551a", "#ff8f24", "#ffd870"],
    stone: "#b8562c", stoneSh: "#55181a", stoneEdge: "#ffd58a", moss: "#7a6a1e",
    water: "#3a0a1a", shadow: "#16040c", mulChar: "#ffb692", mulProp: "#f2835a",
  },
  stop: {
    sky: ["#030208", "#040209", "#05030b", "#06030c", "#07040d", "#09040e", "#0b050f", "#0d0610"], star: 0,
    moon: "#3a2a30", moonSh: "#2a1c22", halo: "#0d0610", cloud: "#07040c", cloudRim: "#120a12",
    ridgeFar: "#050308", ridge: "#030206", ridgeLit: "#070409", rim: "#1c0c0c", foot: "#030206", mist: "#120810",
    soil: "#07040b", soil2: "#0c0610", fold: "#06040a", haze: "#0a0610",
    blade: ["#0b0612", "#130918", "#1e0d1c"], tip: "#3a1c20", lit: ["#b8431a", "#f07a22", "#ffc862"],
    stone: "#2a141c", stoneSh: "#0c0610", stoneEdge: "#5a2a22", moss: "#1c1a10",
    water: "#07030c", shadow: "#020106", mulChar: "#ffb088", mulProp: "#d8693c",
  },
  after: {
    sky: ["#0b0e3a", "#141c58", "#1f2c78", "#31458f", "#4d62a2", "#7a85ad", "#b3a99c", "#ecd08e"], star: 0.9,
    moon: "#fff7dc", moonSh: "#e6d5a8", halo: "#e8cf8a", cloud: "#3d4f94", cloudRim: "#f5e2a6",
    ridgeFar: "#3a4a8c", ridge: "#0e262c", ridgeLit: "#2a5458", rim: "#f0e0a8", foot: "#12243a", mist: "#e0d2a0",
    soil: "#1a2658", soil2: "#3a5a86", fold: "#243a72", haze: "#6a7aa8",
    blade: ["#213a76", "#356a8c", "#6a9c8c"], tip: "#f2e4a4", lit: ["#c2491c", "#f0822a", "#ffc45a"],
    stone: "#7a7c9e", stoneSh: "#34366a", stoneEdge: "#f6e8b4", moss: "#4a9a7a",
    water: "#2a3a7a", shadow: "#080a20", mulChar: "#e9e2d8", mulProp: "#b9b8cc",
  },
};
const isHex = (v) => typeof v === "string" && v[0] === "#";
// a palette between two moods (u 0..1); takes names or palette objects
export function mixPal(a, b, u) {
  const A = pp(a), B = pp(b), o = {};
  for (const k of Object.keys(A)) o[k] = Array.isArray(A[k]) ? A[k].map((v, i) => mix(v, B[k][i], u)) : isHex(A[k]) ? mix(A[k], B[k], u) : lerp(A[k], B[k], clamp(u));
  return o;
}
const pp = (pal) => (typeof pal === "string" ? HPAL[pal] : pal);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mul = (a, b) => { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(v * B[i] / 255).toString(16).padStart(2, "0")).join(""); };

// ---------------------------------------------------------------- the hand: wobbly lines and blobs
const h2 = (a, b) => hash(a * 12.9898 + b * 78.233 + 0.5);
const pt = (p) => `${n(p.x)},${n(p.y)}`;
// a smooth path through points [{x,y}], each nudged by a seeded amount (amp px)
function wob(ps, seed = 0, amp = 0, close = false) {
  const q = ps.map((p, i) => ({ x: p.x + (h2(seed, i) - 0.5) * 2 * amp, y: p.y + (h2(seed + 9, i) - 0.5) * 2 * amp }));
  if (q.length < 3) return "M" + q.map(pt).join(" L");
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  if (close) {
    let d = "M" + pt(mid(q[q.length - 1], q[0]));
    for (let i = 0; i < q.length; i++) d += ` Q${pt(q[i])} ${pt(mid(q[i], q[(i + 1) % q.length]))}`;
    return d + " Z";
  }
  let d = "M" + pt(q[0]);
  for (let i = 1; i < q.length - 1; i++) d += ` Q${pt(q[i])} ${pt(i === q.length - 2 ? q[i + 1] : mid(q[i], q[i + 1]))}`;
  return d;
}
function blob(cx, cy, rx, ry, seed = 0, amp = 0.12, k = 12, rot = 0) {
  const ps = [];
  for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2 + rot, r = 1 + (h2(seed, i) - 0.5) * 2 * amp; ps.push({ x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r }); }
  return wob(ps, 0, 0, true);
}
const poly = (a, fill, extra = "") => `<polygon points="${a.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;
const bil = (q, u, v) => { const a = { x: lerp(q[0].x, q[1].x, u), y: lerp(q[0].y, q[1].y, u) }, b = { x: lerp(q[3].x, q[2].x, u), y: lerp(q[3].y, q[2].y, u) }; return { x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v) }; };
const vis = (c, Z) => Z - c.z > 0.24;
const litAt = (lights, X, Z) => { let a = 0; for (const l of lights) a = Math.max(a, clamp(1 - Math.hypot(X - l.X, Z - l.Z) / l.r) * (l.k ?? 1)); return a; };
// the flame flicker, stepped at 12 a second like drawn animation
export const flick = (t, seed = 0) => 0.8 + 0.2 * hash(Math.floor(t * 12) * 7.3 + seed * 3.1) + 0.06 * Math.sin(t * 5 + seed);

// ---------------------------------------------------------------- where things are (the builder may move them)
export const SPOT = {
  tent: { X: 1.9, Z: 5.5 }, fern: { X: 0.84, Z: 4.58 }, puddle: { X: 0.5, Z: 3.68, rx: 0.2, rz: 0.075 },
  kidDown: { X: 0.6, Z: 4.0, dir: -1 }, keeperDown: { X: -0.08, Z: 4.38, dir: -1 }, staff: { X: 0.98, Z: 4.2, dir: -1 },
  kidUp: { X: -0.1, Z: 3.6 }, keeperUp: { X: 0.5, Z: 3.74 },
};
// trampled grass: the camp clearing, and the two bodies lying in it (h = how much blade height is left)
export const CAMP_FLAT = [{ X: 0.5, Z: 4.25, rx: 2.0, rz: 1.5, h: 0.42 }];
export const DOWN_FLAT = [{ X: 0.0, Z: 3.75, rx: 1.7, rz: 1.0, h: 0.3 }, { X: 0.5, Z: 3.68, rx: 0.25, rz: 0.11, h: 0 }];

// ---------------------------------------------------------------- defs (call first in every frame; includes legend.mjs defs)
let HID = 0;
export function hdefs(pal) {
  const p = pp(pal), m = rgb(p.mulChar).map((v) => (v / 255).toFixed(3));
  HID = 0;
  return L.defs("night") + `<defs>
  <filter id="hchar" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="${m[0]} 0 0 0 0  0 ${m[1]} 0 0 0  0 0 ${m[2]} 0 0  0 0 0 1 0"/></filter>
  <filter id="hsh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="hrefl" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="5 9"/></filter>
  <filter id="hfar" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.8"/></filter>
</defs>`;
}
// the cast under the mood's light: wrap kid()/keeper()/prone svg in this
export const tint = (svg) => (svg ? `<g filter="url(#hchar)">${svg}</g>` : "");

// ---------------------------------------------------------------- sky + moon
const BAND = [-2400, -975, -815, -665, -525, -395, -275, -165];
export function hsky(c, t, pal) {
  const p = pp(pal), hy = c.h0 ?? 1140, dy = hy + (c.y - 1.3) * 16;
  let s = `<rect width="${W}" height="${H}" fill="${p.sky[0]}"/>`;
  for (let i = 1; i < 8; i++) {
    const y = BAND[i] + dy, ps = [];
    for (let x = -60; x <= W + 60; x += 95) ps.push({ x, y: y + (h2(i * 11, x) - 0.5) * 34 });
    s += `<path d="${wob(ps)} L${W + 60},${H} L-60,${H} Z" fill="${p.sky[i]}"/>`;
  }
  // stars: dots, a few four-point ones, and the little cluster of Makali'i (the Pleiades) left of the moon
  if (p.star > 0.02) {
    for (let i = 0; i < 95; i++) {
      const x = hash(i) * W - c.x * 6, y = dy - 330 - hash(i + 50) ** 0.8 * 880, r = 0.9 + hash(i + 99) ** 3 * 3.4;
      const tw = 0.6 + 0.4 * Math.sin(t * (1.2 + hash(i + 3) * 2.6) + i), op = n((0.3 + 0.6 * hash(i + 7)) * tw * p.star);
      s += r > 2.5 ? `<path d="M${n(x)},${n(y - r * 2)} Q${n(x + r * 0.2)},${n(y - r * 0.2)} ${n(x + r * 1.7)},${n(y)} Q${n(x + r * 0.2)},${n(y + r * 0.2)} ${n(x)},${n(y + r * 2.1)} Q${n(x - r * 0.2)},${n(y + r * 0.2)} ${n(x - r * 1.8)},${n(y)} Q${n(x - r * 0.2)},${n(y - r * 0.2)} ${n(x)},${n(y - r * 2)} Z" fill="#fff6e0" opacity="${op}"/>`
        : `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#fff6e0" opacity="${op}"/>`;
    }
    [[0, 0, 2.6], [13, -7, 2.1], [24, 3, 2.4], [9, 11, 1.7], [-9, 9, 1.9], [19, 17, 1.5], [33, -4, 1.4]].forEach(([x, y, r], i) => { s += `<circle cx="${n(330 + x - c.x * 6)}" cy="${n(dy - 900 + y)}" r="${r}" fill="#e6ecff" opacity="${n(p.star * (0.7 + 0.3 * Math.sin(t * 2 + i)))}"/>`; });
  }
  const R = 98, mx = 806 - c.x * 10, my = Math.max(dy - 842, R + 56);   // Sol r2: never graze the top edge, keep the whole disc
  s += `<path d="${blob(mx, my, R * 2.9, R * 2.9, 31, 0.03, 18)}" fill="${p.halo}" opacity="0.1"/><path d="${blob(mx, my, R * 1.85, R * 1.85, 32, 0.035, 16)}" fill="${p.halo}" opacity="0.16"/>`;
  s += `<path d="${blob(mx, my, R, R, 33, 0.012, 22)}" fill="${p.moon}"/>`;
  s += `<path d="M${n(mx - R * 0.3)},${n(my - R * 0.94)} Q${n(mx - R * 1.3)},${n(my)} ${n(mx - R * 0.25)},${n(my + R * 0.95)} Q${n(mx - R * 0.86)},${n(my)} ${n(mx - R * 0.3)},${n(my - R * 0.94)} Z" fill="${p.moonSh}" opacity="0.55"/>`;
  for (const [ddx, ddy, rx, ry, sd] of [[-22, -30, 26, 19, 1], [26, 14, 21, 26, 2], [-34, 30, 14, 11, 3], [36, -44, 12, 9, 4], [-2, 52, 17, 9, 5], [8, -12, 8, 7, 6], [52, -8, 6, 8, 7]])
    s += `<path d="${blob(mx + ddx, my + ddy, rx, ry, 40 + sd, 0.22, 9)}" fill="${p.moonSh}" opacity="0.6"/>`;
  // trade-wind clouds: flat, a lit upper edge toward the moon
  for (let i = 0; i < 5; i++) {
    const w = 300 + 280 * hash(i + 4), y = dy - 940 + i * 122 + 40 * hash(i + 9), x = ((hash(i + 13) * 1700 + t * (5 + 5 * hash(i))) % 1900) - 420 - c.x * 9, hh = 26 + 22 * hash(i + 21);
    const top = [];
    for (let k = 0; k <= 7; k++) top.push({ x: x + w * k / 7, y: y - hh * Math.sin(k / 7 * Math.PI) * (0.55 + 0.75 * h2(i, k)) });
    const d = wob(top);
    s += `<path d="${d} Q${n(x + w * 0.6)},${n(y + hh * 0.35)} ${n(x)},${n(y)} Z" fill="${p.cloud}" opacity="${n(0.5 + 0.25 * hash(i + 2))}"/><path d="${d}" fill="none" stroke="${p.cloudRim}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${n(40 + 60 * hash(i))} ${n(18 + 30 * hash(i + 1))}" opacity="0.4"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- the Ko'olau: a fluted green-black wall (ridge space: u px, height px above its base)
const prof = (u) => (u <= 770 ? 430 + 150 * Math.cos(Math.PI * clamp((u - 150) / 620)) : 280 + 190 * clamp((u - 770) / 420) ** 1.3) + 30 * Math.sin(u * 0.013 + 1);
// big buttresses, each one pleated into flutes that fan out downward from its peak
const MAJ = [];
for (let u = -360, i = 0; u < 1480; i++) { const sp = 84 + 100 * hash(i + 700); MAJ.push({ u, sp, h: prof(u) + 150 * hash(i + 710) ** 1.6 - 45, i }); u += sp; }
MAJ.forEach((m, k) => {
  const nx = MAJ[k + 1], pv = MAJ[k - 1];
  m.ls = { x: m.u - 0.2 * (pv ? pv.sp : m.sp), h: m.h - 8 - 16 * hash(m.i + 720) };
  m.rs = { x: m.u + 0.22 * m.sp, h: m.h - 8 - 18 * hash(m.i + 730) };
  m.sd = { x: m.u + (0.5 + 0.14 * hash(m.i + 735)) * m.sp, h: Math.min(m.h, nx ? nx.h : m.h) - 26 - 80 * hash(m.i + 740) ** 2 };
});
MAJ.forEach((m, k) => { m.crest = [k ? MAJ[k - 1].sd : { x: m.u - m.sp * 0.5, h: m.h - 90 }, m.ls, { x: m.u, h: m.h }, m.rs, m.sd]; });
const crestAt = (m, v) => { const cr = m.crest, x = lerp(cr[0].x, cr[4].x, v); let i = 1; while (i < 4 && cr[i].x < x) i++; const u = clamp((x - cr[i - 1].x) / Math.max(1e-6, cr[i].x - cr[i - 1].x)); return { x, y: -lerp(cr[i - 1].h, cr[i].h, u) }; };
const TRIB = MAJ.reduce((a, r) => (Math.abs(r.u - 250) < Math.abs(a.u - 250) ? r : a));
const ridgeBase = (c) => (c.h0 ?? 1140) + 16 + (c.y - 1.3) * 18;
export function ridge(c, t, pal) {
  const p = pp(pal), by = ridgeBase(c), ox = -c.x * 16;
  // the far wall, paler, behind
  let far = "M-340,300";
  for (let u = -340, i = 0; u < 1500; i++) { const sp = 50 + 70 * hash(i + 800); far += " L" + n(u) + "," + n(-(prof(u * 0.8 + 420) * 0.72 + 50 + 50 * hash(i + 810))) + " L" + n(u + sp * 0.55) + "," + n(-(prof(u * 0.8 + 420) * 0.72 + 20 + 30 * hash(i + 820))); u += sp; }
  let s = '<g transform="translate(' + n(-c.x * 9) + "," + n(by) + ')" filter="url(#hfar)"><path d="' + far + ' L1500,300 Z" fill="' + p.ridgeFar + '"/></g>';
  let sil = "M-380,400", faces = "", lines = "", rim = "";
  const dk = mix(p.ridge, "#000000", 0.45);
  MAJ.forEach((m, k) => {
    // the skyline: craggy, a little knob on each peak
    const cr = m.crest;
    for (let q = 1; q < 5; q++) { const a = cr[q - 1], b = cr[q], j = (h2(m.i * 5 + q, 1) - 0.5) * 12; sil += " L" + n(lerp(a.x, b.x, 0.5) + j * 0.4) + "," + n(-lerp(a.h, b.h, 0.5) - j) + (q === 2 ? " L" + n(b.x - 6) + "," + n(-b.h + 6) + " Q" + n(b.x) + "," + n(-b.h - 3) + " " + n(b.x + 5) + "," + n(-b.h + 5) : " L" + n(b.x) + "," + n(-b.h)); }
    const nf = 4 + Math.floor(hash(m.i + 750) * 3), x0 = cr[0].x - 10, x1 = cr[4].x + 10;
    for (let j = 0; j < nf; j++) {
      const v = (j + 0.5 + (h2(m.i, j) - 0.5) * 0.3) / nf, vg = Math.min(0.99, (j + 1) / nf), S = crestAt(m, v), G = crestAt(m, vg), id = m.i * 9 + j;
      S.y += 2; G.y += 10 + 14 * hash(id + 1);
      const Sb = { x: lerp(x0, x1, v) + (v - 0.5) * 30, y: 44 }, Gb = { x: lerp(x0, x1, vg) + (vg - 0.5) * 30, y: 44 }, bow = (v - 0.5) * 26;
      // the moonlit side of the pleat (the moon is to the right)
      faces += '<path d="M' + pt(S) + " L" + pt(G) + " Q" + n(lerp(G.x, Gb.x, 0.5) + bow) + "," + n(G.y * 0.5) + " " + pt(Gb) + " L" + pt(Sb) + " Q" + n(lerp(S.x, Sb.x, 0.5) + bow) + "," + n(S.y * 0.5) + " " + pt(S) + ' Z" fill="' + mix(p.ridgeLit, p.ridge, 0.15 + 0.6 * hash(id + 2)) + '"/>';
      lines += '<path d="M' + pt(G) + " Q" + n(lerp(G.x, Gb.x, 0.5) + bow) + "," + n(G.y * 0.5) + " " + pt(Gb) + '" stroke="' + dk + '" stroke-width="' + n(1.4 + 2.2 * hash(id + 3)) + '" fill="none" stroke-linecap="round"/>';
      // a thinner fold inside the lit side, bushes clinging on, and the bright spine near the top
      if (hash(id + 4) > 0.3) { const M = { x: lerp(S.x, G.x, 0.55), y: lerp(S.y, G.y, 0.5) + 30 + 60 * hash(id + 5) }; lines += '<path d="M' + pt(M) + " Q" + n(M.x + bow * 0.5) + "," + n(M.y * 0.5) + " " + n(lerp(Sb.x, Gb.x, 0.55)) + ',40" stroke="' + p.ridge + '" stroke-width="' + n(1 + hash(id + 6)) + '" fill="none" opacity="0.8"/>'; }
      for (let q = 0; q < 2; q++) { const w = 0.25 + 0.3 * q + 0.15 * hash(id * 3 + q), x = lerp(S.x, Sb.x, w) + bow * w * (1 - w) * 2 + 5 + 6 * hash(id + q), y = S.y * (1 - w); lines += '<path d="' + blob(x, y, 4 + 6 * hash(id + q * 7), 2.4 + 2.4 * hash(id + q), id + q, 0.3, 6) + '" fill="' + p.ridge + '" opacity="0.8"/>'; }
      const top = hash(id + 8);
      rim += '<path d="M' + pt(S) + " Q" + n(lerp(S.x, Sb.x, 0.2) + bow * 0.3) + "," + n(S.y * 0.8) + " " + n(lerp(S.x, Sb.x, 0.3 + 0.25 * top) + bow * 0.45) + "," + n(S.y * (0.7 - 0.25 * top)) + '" stroke="' + p.rim + '" stroke-width="' + n(1.2 + top * 1.2) + '" fill="none" stroke-linecap="round" opacity="' + n(0.3 + 0.4 * top) + '"/>';
    }
    // the moon on the right-hand shoulders of the skyline
    rim += '<path d="M' + n(cr[2].x - 3) + "," + n(-cr[2].h + 4) + " Q" + n(cr[2].x) + "," + n(-cr[2].h - 2) + " " + n(cr[3].x) + "," + n(-cr[3].h) + " L" + n(lerp(cr[3].x, cr[4].x, 0.6)) + "," + n(-lerp(cr[3].h, cr[4].h, 0.6)) + '" stroke="' + p.rim + '" stroke-width="' + n(2 + hash(m.i + 3) * 1.4) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="' + n(0.6 + 0.35 * hash(m.i + 8)) + '"/>';
  });
  s += '<g transform="translate(' + n(ox) + "," + n(by) + ')"><path d="' + sil + ' L1480,400 Z" fill="' + p.ridge + '"/>' + faces + lines + rim;
  // mist caught in the gullies, then the dark foothill trees (kukui and koa crowns)
  for (let i = 0; i < 5; i++) { const x = ((hash(i + 60) * 1500 + t * (3 + 2 * hash(i))) % 1700) - 300; s += '<path d="' + blob(x, -(80 + 130 * hash(i + 61)), 300 + 200 * hash(i + 62), 30 + 22 * hash(i + 63), 64 + i, 0.35, 14) + '" fill="' + p.mist + '" opacity="' + n(0.05 + 0.05 * hash(i + 65)) + '" filter="url(#hsh)"/>'; }   // soft banks, not lines (Sol r1: the thin mist read as layer seams)
  for (const [amp, base, col, sd] of [[34, 52, mix(p.foot, p.ridgeLit, 0.35), 900], [26, 20, p.foot, 950]]) {
    let d = "M-320,300 L-320," + (-base), hi = "";
    for (let u = -320, k = 0; u < 1440; k++) { const w = 22 + 30 * hash(k + sd), hgt = base + amp * hash(k + sd + 1) + 18 * Math.sin(u * 0.006 + sd); d += " Q" + n(u + w * 0.5) + "," + n(-hgt - w * 0.42) + " " + n(u + w) + "," + n(-hgt + 6 * hash(k + sd + 2)); if (hash(k + sd + 3) > 0.55) hi += '<path d="M' + n(u + w * 0.45) + "," + n(-hgt - w * 0.2) + " q" + n(w * 0.25) + ",-1 " + n(w * 0.42) + "," + n(w * 0.16) + '" stroke="' + p.rim + '" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.3"/>'; u += w; }
    s += '<path d="' + d + ' L1440,300 Z" fill="' + col + '"/>' + hi;
  }
  return s + "</g>";
}

// the torch line coming down a pleat of the ridge. o: { head 0..1 (how far down the first torch is), count, gap, amt }.
// Returns { svg, pts: [{x, y, r}] } (screen). Indistinct on purpose: points of flame, a few tall dark standards.
const TP = [[4, 0.01], [28, 0.13], [0, 0.26], [46, 0.4], [14, 0.54], [72, 0.67], [44, 0.8], [104, 0.9]].map(([du, f]) => [TRIB.u + du, TRIB.h - 4 - f * (TRIB.h - 110)])
  .concat([[TRIB.u + 92, 64], [TRIB.u + 150, 34], [TRIB.u + 214, 12], [TRIB.u + 300, -4]]);
const TPL = [0]; for (let i = 1; i < TP.length; i++) TPL.push(TPL[i - 1] + Math.hypot(TP[i][0] - TP[i - 1][0], TP[i][1] - TP[i - 1][1]));
function tpAt(q) { const d = clamp(q) * TPL[TPL.length - 1]; let i = 1; while (i < TPL.length - 1 && TPL[i] < d) i++; const u = (d - TPL[i - 1]) / (TPL[i] - TPL[i - 1]); return [lerp(TP[i - 1][0], TP[i][0], u), lerp(TP[i - 1][1], TP[i][1], u)]; }
export function torchLine(c, t, pal, o = {}) {
  const by = ridgeBase(c), ox = -c.x * 16, head = o.head ?? 0.5, cnt = o.count ?? 18, gap = o.gap ?? 0.052, amt = o.amt ?? 1;
  let glow = "", poles = "", fl = "";
  const pts = [];
  for (let i = cnt - 1; i >= 0; i--) {
    const q = head - i * gap - 0.012 * hash(i + 300);
    if (q < 0 || q > 1) continue;
    const [u, hgt] = tpAt(q), f = flick(t, i), r = lerp(3.0, 7.4, q) * (0.85 + 0.3 * hash(i + 310));
    const x = ox + u + (hash(i + 320) - 0.5) * 7, y = by - hgt - r * 3.2 + Math.sin(t * 4.4 + i * 1.7) * 0.9;
    pts.push({ x, y, r });
    glow += `<path d="${blob(x, y, r * 4.4 * f, r * 4 * f, i + Math.floor(t * 6), 0.12, 9)}" fill="#ff5a1a" opacity="${n(0.2 * amt)}"/><path d="${blob(x, y, r * 2.3 * f, r * 2.2 * f, i + 40 + Math.floor(t * 6), 0.12, 8)}" fill="#ffa02e" opacity="${n(0.32 * amt)}"/>`;
    if (i % 4 === 2) poles += `<path d="M${n(x + r * 1.7)},${n(y + r * 4.5)} L${n(x + r * 1.9)},${n(y - r * 4.2)}" stroke="#12060c" stroke-width="${n(Math.max(1, r * 0.3))}" stroke-linecap="round"/><ellipse cx="${n(x + r * 1.95)}" cy="${n(y - r * 5.2)}" rx="${n(r * 0.5)}" ry="${n(r * 1.3)}" fill="#12060c"/>`;
    const sw = (hash(Math.floor(t * 10) + i * 9) - 0.5) * r * 0.9;
    fl += `<path d="M${n(x + sw)},${n(y - r * 1.9 * f)} Q${n(x + r * 0.95)},${n(y - r * 0.2)} ${n(x)},${n(y + r * 0.75)} Q${n(x - r * 0.95)},${n(y - r * 0.2)} ${n(x + sw)},${n(y - r * 1.9 * f)} Z" fill="#ffb640"/><ellipse cx="${n(x)}" cy="${n(y + r * 0.1)}" rx="${n(r * 0.36)}" ry="${n(r * 0.55)}" fill="#fff3c4"/>`;
  }
  return { svg: `<g opacity="${n(clamp(amt))}"><g style="mix-blend-mode:screen">${glow}</g>${poles}${fl}</g>`, pts };
}

// ---------------------------------------------------------------- the old path of fitted stones (far -> near, the way they come)
const CP = [[10, 64], [8, 42], [5.6, 26], [3.9, 15], [2.8, 9], [2.15, 6.4], [1.9, 5.5], [1.5, 4.1], [1.05, 3.0], [0.2, 1.9], [-1.2, 0.9], [-3.5, -0.2]];
const PS = [];
{
  const cr = (a, b, c2, d, u) => 0.5 * ((2 * b) + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
  const raw = [];
  for (let i = 0; i < CP.length - 1; i++) for (let k = 0; k < 40; k++) { const a = CP[Math.max(0, i - 1)], b = CP[i], c2 = CP[i + 1], d = CP[Math.min(CP.length - 1, i + 2)], u = k / 40; raw.push([cr(a[0], b[0], c2[0], d[0], u), cr(a[1], b[1], c2[1], d[1], u)]); }
  raw.push(CP[CP.length - 1]);
  let acc = 0, next = 0;
  for (let i = 1; i < raw.length; i++) {
    const seg = Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
    while (next <= acc + seg) { const u = (next - acc) / seg; PS.push({ X: lerp(raw[i - 1][0], raw[i][0], u), Z: lerp(raw[i - 1][1], raw[i][1], u), tx: (raw[i][0] - raw[i - 1][0]) / seg, tz: (raw[i][1] - raw[i - 1][1]) / seg, s: next }); next += 0.2; }
    acc += seg;
  }
}
export const PATH_LEN = PS[PS.length - 1].s, PATH_HALF = 0.56;
// the path at arc length s (0 = far end): { X, Z, tx, tz } (t = unit tangent, the way the march walks)
export function pathAt(s) { const f = clamp(s / PATH_LEN) * (PS.length - 1), i = Math.min(PS.length - 2, Math.floor(f)), u = f - i, a = PS[i], b = PS[i + 1]; return { X: lerp(a.X, b.X, u), Z: lerp(a.Z, b.Z, u), tx: lerp(a.tx, b.tx, u), tz: lerp(a.tz, b.tz, u) }; }
// distance from (X, Z) to the path's centre line, and the arc length there
export function pathNear(X, Z) { let best = 1e9, bs = 0; for (const q of PS) { const d = (q.X - X) ** 2 + (q.Z - Z) ** 2; if (d < best) { best = d; bs = q.s; } } return { d: Math.sqrt(best), s: bs }; }
export function stonePath(c, t, pal, o = {}) {
  const p = pp(pal), lights = o.lights || [];
  let s = "";
  for (let sa = 0, r = 0; sa < PATH_LEN - 0.2; r++) {
    const len = 0.36 + 0.24 * hash(r + 500), a = pathAt(sa), b = pathAt(sa + len);
    const far = Math.min(a.Z, b.Z) - c.z;
    sa += len;
    if (far < 0.3 || far > 60) continue;
    const k = 2 + (hash(r + 510) > 0.45 ? 1 : 0), cuts = [-PATH_HALF];
    for (let j = 1; j < k; j++) cuts.push(-PATH_HALF + 2 * PATH_HALF * (j + (hash(r * 7 + j) - 0.5) * 0.5) / k);
    cuts.push(PATH_HALF);
    for (let j = 0; j < k; j++) {
      const id = r * 13 + j, g = 0.018, jit = (q) => (h2(id, q) - 0.5) * 0.07;
      const W3 = (base, v, e) => ({ X: base.X - base.tz * v + base.tx * e, Z: base.Z + base.tx * v + base.tz * e });
      const cs = [W3(a, cuts[j] + g + jit(1), g + jit(2)), W3(a, cuts[j + 1] - g + jit(3), g + jit(4)), W3(b, cuts[j + 1] - g + jit(5), -g + jit(6)), W3(b, cuts[j] + g + jit(7), -g + jit(8))];
      if (cs.some((q) => q.Z - c.z < 0.26)) continue;
      const top = cs.map((q) => P(c, q.X, 0.035, q.Z)), bot = cs.map((q) => P(c, q.X, 0, q.Z));
      if (top.every((q) => q.x < -80) || top.every((q) => q.x > W + 80) || top.every((q) => q.y > H + 80)) continue;
      const cx = (cs[0].X + cs[2].X) / 2, cz = (cs[0].Z + cs[2].Z) / 2, la = litAt(lights, cx, cz), hz = clamp((far - 7) / 40) * 0.75;
      const col = mix(mix(mix(p.stone, p.stoneSh, 0.55 * hash(id + 1)), p.lit[1], la * 0.7), p.haze, hz), sh = mix(mix(p.stoneSh, p.lit[0], la * 0.5), p.haze, hz);
      // the side that faces the camera (thickness), then the top
      const ord = top.map((q, i) => i).sort((i, j2) => bot[j2].y - bot[i].y), i0 = ord[0], i1 = [(i0 + 1) % 4, (i0 + 3) % 4].sort((x, y) => bot[y].y - bot[x].y)[0];
      s += poly([top[i0], top[i1], bot[i1], bot[i0]], sh) + `<path d="M${[0, 1, 2, 3].map((q) => { const a2 = top[q], b2 = top[(q + 1) % 4], j2 = (h2(id + 20, q) - 0.5) * 0.09; return `${pt(a2)} L${n(lerp(a2.x, b2.x, 0.45) + (b2.y - a2.y) * j2)},${n(lerp(a2.y, b2.y, 0.45) - (b2.x - a2.x) * j2)}`; }).join(" L")} Z" fill="${col}" stroke-linejoin="round" stroke="${mix(p.stoneSh, "#000000", 0.35)}" stroke-width="${n(clamp(top[0].s / 500) * 1.4 + 0.4)}"/>`;
      if (top[0].s < 70) continue;
      // moonlit (or torch-lit) edge, a crack, moss in a corner, a chip
      s += `<path d="M${pt(bil(top, 0.08, 0.14))} L${pt(bil(top, 0.9, 0.12))}" stroke="${mix(p.stoneEdge, p.lit[2], la)}" stroke-width="${n(Math.max(1, top[0].s * 0.006))}" stroke-linecap="round" opacity="${n(0.35 + 0.4 * hash(id + 2))}"/>`;
      if (hash(id + 3) > 0.5) { const u0 = 0.2 + 0.5 * hash(id + 4); s += `<path d="M${pt(bil(top, u0, 0.05))} L${pt(bil(top, u0 + 0.08, 0.38))} L${pt(bil(top, u0 - 0.04, 0.6))} L${pt(bil(top, u0 + 0.1, 0.95))}" stroke="${sh}" stroke-width="${n(Math.max(0.8, top[0].s * 0.004))}" fill="none" stroke-linejoin="round"/>`; }
      if (hash(id + 5) > 0.42) { const m = bil(top, hash(id + 6) > 0.5 ? 0.18 : 0.8, 0.25 + 0.5 * hash(id + 7)), rr = top[0].s * (0.035 + 0.04 * hash(id + 8)); s += `<path d="${blob(m.x, m.y, rr * 1.5, rr * 0.5, id, 0.35, 8)}" fill="${mix(mix(p.moss, p.lit[0], la * 0.4), p.haze, hz)}" opacity="0.85"/>`; }
      if (hash(id + 9) > 0.7) { const m = bil(top, 0.5 + 0.3 * (hash(id + 10) - 0.5), 0.7); s += `<path d="${blob(m.x, m.y, top[0].s * 0.03, top[0].s * 0.01, id + 3, 0.3, 6)}" fill="${sh}" opacity="0.6"/>`; }
    }
  }
  return s;
}

// ---------------------------------------------------------------- hillside ground + tall grass
export function hground(c, t, pal, o = {}) {
  const p = pp(pal), hy = c.h0 ?? 1140, lights = o.lights || [];
  let s = `<rect x="0" y="${n(hy - 2)}" width="${W}" height="${n(H - hy + 4)}" fill="${p.soil}"/>`;
  // a fold of the hill behind the camp, its top fringed with grass
  const fold = [], fx0 = -c.x * 26;
  for (let x = -80; x <= W + 80; x += 58) fold.push({ x: x + fx0 * 0.2, y: hy + 10 - 64 * Math.exp(-(((x + fx0 - 760) / 520) ** 2)) - 22 * Math.exp(-(((x + fx0 - 130) / 260) ** 2)) + (h2(77, x) - 0.5) * 9 });
  s += `<path d="${wob(fold)} L${W + 80},${n(hy + 60)} L-80,${n(hy + 60)} Z" fill="${p.fold}"/>`;
  for (let k = 0; k < fold.length - 1; k++) for (let j = 0; j < 5; j++) { const u = (j + hash(k * 5 + j)) / 5, x = lerp(fold[k].x, fold[k + 1].x, u), y = lerp(fold[k].y, fold[k + 1].y, u) + 3, sw = Math.sin(t * 1.4 + x * 0.01) * 2; s += `<path d="M${n(x - 2)},${n(y + 3)} L${n(x + sw)},${n(y - 7 - 8 * hash(k * 7 + j))} L${n(x + 2.4)},${n(y + 3)} Z" fill="${mix(p.fold, p.tip, 0.14 + 0.2 * hash(k + j))}"/>`; }
  // far field: moonlit sweeps and grass ticks, placed in the world so a camera move slides them right
  for (let k = 0; k < 420; k++) {
    const Z = 5 + 56 * hash(k + 1000) ** 1.4, X = (hash(k + 2000) - 0.5) * 80;
    if (!vis(c, Z)) continue;
    const q = P(c, X, 0, Z);
    if (q.x < -60 || q.x > W + 60) continue;
    const la = litAt(lights, X, Z), hz = clamp((Z - c.z - 7) / 40) * 0.7;
    { const w = (0.5 + 1.6 * hash(k + 5)) * q.s; s += `<path d="M${n(q.x - w)},${n(q.y)} Q${n(q.x)},${n(q.y - 0.05 * q.s - 1)} ${n(q.x + w)},${n(q.y + 0.4)}" stroke="${mix(mix(p.soil2, p.lit[0], la), p.haze, hz)}" stroke-width="${n(Math.max(1.2, 0.07 * q.s))}" fill="none" stroke-linecap="round" opacity="0.7"/>`; }
  }
  return s;
}
// individually placed blades between two depths (zFar > zNear), far to near. Blades thin out with distance from the
// camera on a fixed world grid, each one fading in as the camera comes close, so a dolly never pops.
// o: { flat: [{X, Z, rx, rz, h}] trampled zones, lights: [{X, Z, r, k}] torchlight on the blades, wind 0..2, noPath }
const DX0 = 0.034, DZ0 = 0.058;
const tz2 = (i) => { if (i === 0) return 7; let m = 0; while ((i & 1) === 0 && m < 7) { i >>= 1; m++; } return m; };
export function grass(c, t, pal, zFar, zNear, o = {}) {
  const p = pp(pal), flat = o.flat || [], lights = o.lights || [], wind = o.wind ?? 1, F = c.f || 1300;
  const j1 = Math.floor(Math.min(zFar, c.z + 46) / DZ0), j0 = Math.floor(Math.max(zNear, c.z + 0.25) / DZ0) + 1;
  let s = "";
  for (let j = j1; j >= j0; j--) {
    const Z = j * DZ0, d = Z - c.z, lf = Math.max(0, Math.log2(d / 0.75)), step = 1 << Math.floor(lf);
    if (((j % step) + step) % step) continue;
    const mj = tz2(j), sc = F / d, hw = (W / 2 + 90) / sc;
    const i0 = Math.ceil((c.x - hw) / DX0 / step) * step, i1 = Math.floor((c.x + hw) / DX0 / step) * step;
    for (let i = i0; i <= i1; i += step) {
      const m = Math.min(mj, tz2(i)), fade = clamp((m + 1 - lf) * 3);
      if (fade < 0.03) continue;
      const id = i * 71.37 + j * 113.11, own = 1 << Math.min(m, 4);
      const X = (i + (hash(id) - 0.5) * 0.9 * own) * DX0, Zb = Z + (hash(id + 1) - 0.5) * 0.9 * own * DZ0;
      if (Zb - c.z < 0.25) continue;
      let hm = 1;
      if (!o.noPath && Zb < 70) { const pd = pathNear(X, Zb).d; if (pd < PATH_HALF + 0.05) { if (hash(id + 4) > 0.13) continue; hm = 0.4; } else if (pd < PATH_HALF + 0.3) hm = 0.75; }
      for (const f of flat) { const e = ((X - f.X) / f.rx) ** 2 + ((Zb - f.Z) / f.rz) ** 2; if (e < 1) hm *= lerp(f.h ?? 0.3, 1, e * e); }
      hm *= lerp(0.5, 1, clamp((d - 0.35) / 1.2));   // the camera stands in a little clearing of its own
      const b = P(c, X, 0, Zb), hgt = (0.24 + 0.34 * hash(id + 2)) * (1 + 0.14 * lf) * hm * (0.4 + 0.6 * fade), hpx = hgt * b.s;
      if (hpx < 3) continue;
      const wpx = Math.min((0.007 + 0.007 * hash(id + 3)) * 2 ** (lf * 0.85) * b.s * fade, hpx * 0.11);
      const sway = wind * (0.11 * Math.sin(t * 1.9 + X * 1.7 + Zb * 0.9 + hash(id) * 2.5) + 0.09 * Math.sin(t * 0.7 + X * 0.4 - Zb * 0.3));
      const lean = (hash(id + 6) - 0.5) * 0.8 + sway, tx = b.x + lean * hpx, ty = b.y - hpx * (1 - 0.3 * lean * lean), mx = b.x + lean * hpx * 0.22, my = b.y - hpx * 0.58;
      const k = Math.floor(hash(id + 5) * 3), la = litAt(lights, X, Zb), hz = clamp((d - 7) / 40) * 0.7;
      const col = mix(mix(mix(p.blade[k], p.blade[(k + 1) % 3], 0.4 * hash(id + 7)), p.lit[k], la), p.haze, hz);
      const dd = `M${n(b.x - wpx)},${n(b.y)} Q${n(mx - wpx * 0.8)},${n(my)} ${n(tx)},${n(ty)} Q${n(mx + wpx * 0.9)},${n(my)} ${n(b.x + wpx)},${n(b.y)} Z`;
      s += b.s > 380 ? `<path d="${dd}" fill="${col}" stroke="${mix(col, "#05030f", 0.4)}" stroke-width="${n(clamp(b.s / 1400) * 1.2 + 0.5)}" stroke-linejoin="round"/>` : `<path d="${dd}" fill="${col}"/>`;
      // the moon (or the torches) on one edge of some blades; a seed head on a few
      if (hash(id + 8) > 0.62 && hpx > 14) s += `<path d="M${n(lerp(b.x + wpx, mx + wpx * 0.9, 0.5))},${n(lerp(b.y, my, 0.6))} Q${n(mx + wpx * 0.75)},${n(my)} ${n(tx)},${n(ty)}" stroke="${mix(mix(p.tip, p.lit[2], la), p.haze, hz)}" stroke-width="${n(Math.max(0.9, wpx * 0.3))}" fill="none" stroke-linecap="round" opacity="${n(0.4 + 0.5 * hash(id + 9))}"/>`;
      if (hash(id + 10) > 0.9 && hpx > 30 && hm > 0.6) { const sx = b.x + (lean - 0.25) * hpx * 1.1, sy = b.y - hpx * 1.12; s += `<path d="M${n(b.x)},${n(b.y)} Q${n(b.x + lean * hpx * 0.2)},${n(b.y - hpx * 0.7)} ${n(sx)},${n(sy)}" stroke="${col}" stroke-width="${n(Math.max(1, wpx * 0.25))}" fill="none"/>` + [0.72, 0.8, 0.88, 0.96].map((u, q) => `<ellipse cx="${n(lerp(b.x, sx, u) + (q % 2 ? 1 : -1) * wpx * 0.35)}" cy="${n(lerp(b.y - hpx * 0.2, sy, u))}" rx="${n(wpx * 0.42)}" ry="${n(wpx * 1.1)}" fill="${mix(col, p.tip, 0.45)}"/>`).join(""); }
    }
  }
  return s;
}
// props and cast between layers of grass: items [{ Z, svg }]; the grass in front of each one overlaps it
export function stack(c, t, pal, items, o = {}) {
  const its = items.filter((x) => x && x.svg).sort((a, b) => b.Z - a.Z);
  let s = "", zf = o.zFar ?? 60;
  for (const it of its) { s += grass(c, t, pal, zf, it.Z, o) + it.svg; zf = Math.min(zf, it.Z); }
  return s + grass(c, t, pal, zf, o.zNear ?? -50, o);
}

// ---------------------------------------------------------------- the tent (sun-faded mustard canvas, on the old path)
// st: { X, Z, lit 0..1 (the candle inside) }; faded seams, one sewn patch, guy ropes and pegs
export function tent(c, t, pal, st = SPOT.tent) {
  const p = pp(pal), lit = st.lit || 0, a = pathAt(pathNear(st.X, st.Z).s), ax = [a.tx, a.tz], nx = [-a.tz, a.tx];
  const HL = 0.86, HW = 0.72, HT = 1.14;
  const G = (e, v, y) => ({ X: st.X + ax[0] * e + nx[0] * v, Z: st.Z + ax[1] * e + nx[1] * v, Y: y });
  const w = { FL: G(HL, HW, 0), FR: G(HL, -HW, 0), FA: G(HL, 0, HT), BL: G(-HL, HW, 0), BR: G(-HL, -HW, 0), BA: G(-HL, 0, HT), FC: G(HL, 0, 0) };
  if (Object.values(w).some((q) => !vis(c, q.Z))) return "";
  const S = Object.fromEntries(Object.entries(w).map(([k, q]) => [k, P(c, q.X, q.Y, q.Z)])), k = S.FC.s;
  const T = (col) => mix(mul(col, p.mulProp), "#ffb45a", lit * 0.5), canvas = "#dba63f", canvasS = "#a9722c", seam = T("#6e4320"), sw = Math.max(0.8, k * 0.004);
  let s = `<path d="${blob((S.FL.x + S.BR.x) / 2, (S.FL.y + S.BR.y) / 2 + 0.03 * k, 1.25 * k, 0.16 * k, 5, 0.1)}" fill="${p.shadow}" opacity="0.5"/>`;
  const stitch = (q0, q1, cnt, sd) => { let d = ""; for (let i = 0; i < cnt; i++) { const u = (i + 0.2 + 0.2 * h2(sd, i)) / cnt, v = u + 0.45 / cnt; d += `M${n(lerp(q0.x, q1.x, u))},${n(lerp(q0.y, q1.y, u) + (h2(sd + 1, i) - 0.5) * sw * 1.5)} L${n(lerp(q0.x, q1.x, v))},${n(lerp(q0.y, q1.y, v))} `; } return `<path d="${d}" stroke="${seam}" stroke-width="${n(sw * 1.3)}" stroke-linecap="round" fill="none" opacity="0.85"/>`; };
  // guy ropes + pegs (behind the cloth)
  const rope = (from, e, v, sd) => { const g = G(e, v, 0), q = P(c, g.X, 0, g.Z), mid = { x: lerp(from.x, q.x, 0.5) + 3, y: lerp(from.y, q.y, 0.5) + 0.03 * k }; return `<path d="M${pt(from)} Q${pt(mid)} ${pt(q)}" stroke="${T("#e9dcc0")}" stroke-width="${n(sw * 1.6)}" fill="none" stroke-linecap="round"/><path d="M${n(q.x - 0.03 * k)},${n(q.y - 0.11 * k)} L${n(q.x + 0.015 * k)},${n(q.y + 0.01 * k)}" stroke="${T("#8a5a37")}" stroke-width="${n(0.028 * k)}" stroke-linecap="round"/><path d="M${n(q.x - 0.03 * k)},${n(q.y - 0.11 * k)} l${n(0.02 * k)},${n(-0.006 * k)}" stroke="${T("#c9a26a")}" stroke-width="${n(0.02 * k)}" stroke-linecap="round"/>`; };
  s += rope(S.BA, -HL - 0.9, 0.1, 1);
  const panel = (q, sd, shade) => {   // q = [front base, back base, back apex, front apex]
    let g = `<path d="${wob(q, sd, k * 0.004, true).replace(/Q[^ ]+ /g, "L")}" fill="${T(mix(canvas, canvasS, shade))}" stroke="${INK}" stroke-width="${n(sw * 1.4)}" stroke-linejoin="round"/>`;
    g += poly([bil(q, 0, 0), bil(q, 1, 0), bil(q, 1, 0.13), bil(q, 0, 0.11)], T(mix(canvasS, "#5a3a1c", 0.3)), `opacity="0.7"`);   // the damp hem
    for (const u of [0.34, 0.68]) g += `<path d="M${pt(bil(q, u, 0.02))} L${pt(bil(q, u + 0.015, 0.98))}" stroke="${seam}" stroke-width="${n(sw)}" opacity="0.6"/>` + stitch(bil(q, u + 0.025, 0.04), bil(q, u + 0.04, 0.97), 13, sd + u * 10);
    g += stitch(bil(q, 0.02, 0.955), bil(q, 0.98, 0.955), 22, sd + 3);
    for (let i = 0; i < 4; i++) { const u = 0.08 + 0.26 * i + 0.1 * h2(sd, i + 20); g += `<path d="M${pt(bil(q, u, 0.08))} Q${pt(bil(q, u + 0.03, 0.5))} ${pt(bil(q, u + 0.01 + 0.05 * h2(sd, i), 0.86))}" stroke="${T(mix(canvasS, canvas, shade * 0.5))}" stroke-width="${n(sw * 1.8)}" fill="none" opacity="0.5" stroke-linecap="round"/>`; }
    // the sewn patch, a little crooked, cross-stitched at the corners
    const pq = [bil(q, 0.44, 0.4), bil(q, 0.6, 0.42), bil(q, 0.59, 0.62), bil(q, 0.45, 0.6)];
    g += poly(pq, T("#c2573a"), `stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"`) + stitch(bil(pq, 0.1, 0.12), bil(pq, 0.9, 0.12), 5, sd + 5) + stitch(bil(pq, 0.1, 0.88), bil(pq, 0.9, 0.88), 5, sd + 6) + stitch(bil(pq, 0.1, 0.15), bil(pq, 0.1, 0.85), 4, sd + 7) + stitch(bil(pq, 0.9, 0.15), bil(pq, 0.9, 0.85), 4, sd + 8);
    if (lit > 0.02) g += `<path d="${blob(bil(q, 0.2, 0.3).x, bil(q, 0.2, 0.3).y, 0.42 * k, 0.3 * k, sd, 0.18, 10)}" fill="#ffd27a" opacity="${n(0.3 * lit * flick(t, 3))}" style="mix-blend-mode:screen"/>`;
    return g;
  };
  const left = panel([S.FL, S.BL, S.BA, S.FA], 11, 0.55), right = panel([S.FR, S.BR, S.BA, S.FA], 12, 0.12);
  s += (S.FL.s < S.FR.s ? left + right : right + left);
  // the front: left flap shut, right flap rolled back and tied
  const O = [bil([S.FA, S.FA, S.FR, S.FC], 0, 0.14), bil([S.FA, S.FA, S.FR, S.FC], 1, 0.5), { x: lerp(S.FC.x, S.FR.x, 0.7), y: lerp(S.FC.y, S.FR.y, 0.7) }, S.FC];
  s += poly([S.FL, S.FR, S.FA], T(mix(canvas, canvasS, 0.3)), `stroke="${INK}" stroke-width="${n(sw * 1.4)}" stroke-linejoin="round"`);
  s += poly(O, mix(mul("#2a1836", p.mulProp), "#ffcf7a", lit * 0.85), `stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"`);
  const iq = bil([O[0], O[1], O[2], O[3]], 0.55, 0.86);   // inside: the rolled sleeping bag and a tin mug
  s += `<path d="${blob(iq.x, iq.y - 0.07 * k, 0.17 * k, 0.085 * k, 3, 0.1, 10)}" fill="${mix(mul("#3f6f8f", p.mulProp), "#b06a2a", lit * 0.6)}" stroke="${INK}" stroke-width="${n(sw)}"/><path d="M${n(iq.x - 0.05 * k)},${n(iq.y - 0.15 * k)} q${n(0.02 * k)},${n(0.08 * k)} ${n(-0.01 * k)},${n(0.16 * k)}" stroke="${INK}" stroke-width="${n(sw)}" fill="none"/>`;
  s += `<path d="M${pt(S.FA)} L${pt(S.FC)}" stroke="${seam}" stroke-width="${n(sw * 1.6)}" stroke-dasharray="${n(sw * 3)} ${n(sw * 2.4)}"/>`;
  const r0 = bil([S.FA, S.FA, S.FR, S.FC], 1, 0.52), r1 = { x: lerp(S.FC.x, S.FR.x, 0.74), y: lerp(S.FC.y, S.FR.y, 0.74) };   // the rolled flap
  s += `<path d="M${pt(r0)} L${pt(r1)}" stroke="${INK}" stroke-width="${n(0.105 * k)}" stroke-linecap="round"/><path d="M${pt(r0)} L${pt(r1)}" stroke="${T(mix(canvas, "#f0c868", 0.4))}" stroke-width="${n(0.085 * k)}" stroke-linecap="round"/>`;
  for (const u of [0.3, 0.68]) { const q = { x: lerp(r0.x, r1.x, u), y: lerp(r0.y, r1.y, u) }; s += `<path d="M${n(q.x - 0.05 * k)},${n(q.y - 0.015 * k)} L${n(q.x + 0.05 * k)},${n(q.y + 0.02 * k)}" stroke="${T("#e9dcc0")}" stroke-width="${n(sw * 1.8)}"/><path d="M${n(q.x + 0.05 * k)},${n(q.y + 0.02 * k)} q${n(0.03 * k)},${n(0.04 * k)} ${n(0.012 * k)},${n(0.08 * k)}" stroke="${T("#e9dcc0")}" stroke-width="${n(sw * 1.2)}" fill="none"/>`; }
  s += stitch({ x: lerp(S.FL.x, S.FA.x, 0.03), y: lerp(S.FL.y, S.FA.y, 0.03) + 0.03 * k }, { x: lerp(S.FL.x, S.FA.x, 0.95) + 0.02 * k, y: lerp(S.FL.y, S.FA.y, 0.95) }, 16, 31);
  // frayed threads at the apex and the corners, the ridge pole tip
  for (const [q, sd] of [[S.FA, 1], [S.FL, 2], [S.FR, 3]]) for (let i = 0; i < 4; i++) s += `<path d="M${pt(q)} q${n((h2(sd, i) - 0.5) * 0.06 * k)},${n(-0.02 * k)} ${n((h2(sd + 4, i) - 0.5) * 0.11 * k)},${n((h2(sd + 8, i) - 0.7) * 0.07 * k)}" stroke="${T("#f0d9a0")}" stroke-width="${n(sw * 0.8)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(S.FA.x)},${n(S.FA.y + 0.02 * k)} l0,${n(-0.09 * k)}" stroke="${T("#8a5a37")}" stroke-width="${n(0.024 * k)}" stroke-linecap="round"/>` + rope({ x: S.FA.x, y: S.FA.y - 0.05 * k }, HL + 0.85, 0.12, 2) + rope(S.FL, HL + 0.05, HW + 0.3, 3) + rope(S.FR, HL + 0.05, -HW - 0.3, 4);
  if (lit > 0.02) s += `<path d="${blob(S.FC.x + 0.1 * k, S.FC.y + 0.05 * k, 0.7 * k, 0.16 * k, 9, 0.15, 10)}" fill="#ffb35c" opacity="${n(0.3 * lit * flick(t, 3))}" style="mix-blend-mode:screen"/>`;
  return s;
}

// ---------------------------------------------------------------- grandma's plastic fern in its pot (the only "ti plant" they have)
// st: { X, Z, k size }. It is plastic: while the grass moves, it barely does.
export function fern(c, t, pal, st = SPOT.fern) {
  if (!vis(c, st.Z)) return "";
  const p = pp(pal), b = P(c, st.X, 0, st.Z), k = b.s * (st.k || 1), T = (col) => mul(col, mix(p.mulProp, "#ffffff", 0.25));
  const pot = T("#e2632e"), potS = T("#a83f1e"), g1 = T("#44b862"), g2 = T("#2a8048"), hi = T("#ffa276"), ol = `stroke="${INK}" stroke-width="${n(Math.max(0.8, k * 0.006))}" stroke-linejoin="round"`;
  const X = (x) => n(b.x + x * k), Y = (y) => n(b.y - y * k);
  let s = `<path d="${blob(b.x + 0.02 * k, b.y + 0.005 * k, 0.2 * k, 0.04 * k, 2, 0.1)}" fill="${p.shadow}" opacity="0.5"/>`;
  let back = "", front = "";
  for (let i = 0; i < 9; i++) {
    const a = -1.25 + i * 0.31 + (hash(i + 40) - 0.5) * 0.16, len = 0.3 + 0.12 * hash(i + 41), wig = Math.sin(t * 1.1 + i) * 0.006;
    const x0 = Math.sin(a) * 0.03, y0 = 0.2, x2 = Math.sin(a) * len * 1.05 + wig, y2 = y0 + Math.cos(a) * len * 0.75 - Math.abs(Math.sin(a)) * 0.1, x1 = Math.sin(a) * len * 0.45, y1 = y0 + len * 0.95;
    const B = (u) => ({ x: (1 - u) ** 2 * x0 + 2 * u * (1 - u) * x1 + u * u * x2, y: (1 - u) ** 2 * y0 + 2 * u * (1 - u) * y1 + u * u * y2 });
    let f = `<path d="M${X(x0)},${Y(y0)} Q${X(x1)},${Y(y1)} ${X(x2)},${Y(y2)}" stroke="${g2}" stroke-width="${n(Math.max(1, k * 0.008))}" fill="none" stroke-linecap="round"/>`;
    const np = k > 260 ? 9 : 5;
    for (let j = 1; j <= np; j++) {
      const u = j / (np + 0.6), q = B(u), q2 = B(u + 0.03), ang = Math.atan2(-(q2.y - q.y), q2.x - q.x) * 180 / Math.PI, ll = 0.075 * (1 - u * 0.75) * (0.85 + 0.3 * hash(i * 9 + j));
      for (const sd of [-1, 1]) f += `<path d="M0,0 Q${n(ll * 0.5 * k)},${n(-ll * 0.34 * k)} ${n(ll * k)},0 Q${n(ll * 0.5 * k)},${n(ll * 0.3 * k)} 0,0 Z" fill="${(i + j) % 3 ? g1 : g2}" ${ol} transform="translate(${X(q.x)},${Y(q.y)}) rotate(${n(ang + sd * (62 + 14 * hash(i + j * 3 + sd)))})"/>`;
    }
    if (i % 2) back += f; else front += f;
  }
  s += back;
  s += `<path d="M${X(-0.105)},${Y(0.2)} L${X(0.105)},${Y(0.2)} L${X(0.08)},${Y(0)} L${X(-0.08)},${Y(0)} Z" fill="${pot}" ${ol}/><path d="M${X(0.045)},${Y(0.2)} L${X(0.105)},${Y(0.2)} L${X(0.08)},${Y(0)} L${X(0.036)},${Y(0)} Z" fill="${potS}"/>`;
  s += `<path d="M${X(-0.066)},${Y(0.16)} L${X(-0.056)},${Y(0.03)}" stroke="${hi}" stroke-width="${n(k * 0.013)}" stroke-linecap="round" opacity="0.8"/>`;   // the tell-tale plastic shine
  s += `<path d="M${X(-0.118)},${Y(0.235)} L${X(0.118)},${Y(0.235)} L${X(0.112)},${Y(0.19)} L${X(-0.112)},${Y(0.19)} Z" fill="${pot}" ${ol}/><path d="M${X(0.05)},${Y(0.235)} L${X(0.118)},${Y(0.235)} L${X(0.112)},${Y(0.19)} L${X(0.05)},${Y(0.19)} Z" fill="${potS}"/>`;
  // the price sticker nobody peeled off
  s += `<g transform="translate(${X(-0.012)},${Y(0.1)}) rotate(-7)"><rect x="${n(-0.032 * k)}" y="${n(-0.024 * k)}" width="${n(0.064 * k)}" height="${n(0.048 * k)}" rx="${n(0.005 * k)}" fill="${T("#fff6d8")}" ${ol}/>${[-0.02, -0.012, -0.006, 0.002, 0.012, 0.02].map((x, i) => `<path d="M${n(x * k)},${n(0.002 * k)} v${n(0.014 * k)}" stroke="${INK}" stroke-width="${n(k * (i % 2 ? 0.0035 : 0.002))}"/>`).join("")}<path d="M${n(-0.02 * k)},${n(-0.011 * k)} h${n(0.03 * k)}" stroke="${T("#d8443a")}" stroke-width="${n(k * 0.007)}"/></g>`;
  return s + front;
}

// ---------------------------------------------------------------- the puddle by his face: night sky, then flames going by
// st: { X, Z, rx, rz }; o: { flames 0..1, speed (how fast the reflections travel), lights }
export function puddle(c, t, pal, st = SPOT.puddle, o = {}) {
  if (!vis(c, st.Z - st.rz)) return "";
  const p = pp(pal), fl = o.flames ?? 0, ring = (kx, kz, sd, amp = 0.1) => { const ps = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 1 + (h2(sd, i) - 0.5) * 2 * amp; ps.push(P(c, st.X + Math.cos(a) * st.rx * kx * r, 0.004, st.Z + Math.sin(a) * st.rz * kz * r)); } return ps; };
  const out = ring(1, 1, 5), id = `hp${HID++}`, cx = P(c, st.X, 0, st.Z), nearE = P(c, st.X, 0, st.Z - st.rz), farE = P(c, st.X, 0, st.Z + st.rz), wpx = st.rx * cx.s, hpx = nearE.y - farE.y;
  let s = `<path d="${wob(ring(1.06, 1.12, 6, 0.12), 0, 0, true)}" fill="${mix(p.soil, "#000000", 0.3)}" opacity="0.7"/><clipPath id="${id}"><path d="${wob(out, 0, 0, true)}"/></clipPath><path d="${wob(out, 0, 0, true)}" fill="${p.water}"/><g clip-path="url(#${id})">`;
  s += `<path d="M${n(cx.x - wpx)},${n(farE.y + hpx * 0.42)} Q${n(cx.x)},${n(farE.y + hpx * 0.3)} ${n(cx.x + wpx)},${n(farE.y + hpx * 0.5)} L${n(cx.x + wpx)},${n(nearE.y + 5)} L${n(cx.x - wpx)},${n(nearE.y + 5)} Z" fill="${mix(p.water, p.sky[1], 0.35)}" opacity="0.3"/>`;
  if (fl > 0.01) {
    s += `<g filter="url(#hrefl)" style="mix-blend-mode:screen">`;
    for (let i = 0; i < 7; i++) {
      const u = ((i / 7 + t * (o.speed ?? 0.11) + hash(i + 70) * 0.08) % 1 + 1) % 1, x = cx.x + (u * 2.6 - 1.3) * wpx, f = flick(t, i + 20), hh = hpx * (0.75 + 0.5 * hash(i + 71)) * f, wob2 = Math.sin(t * 6 + i * 2) * wpx * 0.02;
      s += `<path d="M${n(x - wpx * 0.085)},${n(farE.y + hpx * 0.1)} Q${n(x + wob2 * 2)},${n(farE.y + hh * 0.6)} ${n(x - wob2)},${n(farE.y + hh)} Q${n(x + wpx * 0.11 + wob2)},${n(farE.y + hh * 0.5)} ${n(x + wpx * 0.085)},${n(farE.y + hpx * 0.1)} Z" fill="#ff7a1e" opacity="${n(fl * 0.95)}"/><ellipse cx="${n(x)}" cy="${n(farE.y + hh * 0.34)}" rx="${n(wpx * 0.04)}" ry="${n(hh * 0.2)}" fill="#ffe7a0" opacity="${n(fl)}"/>`;
    }
    s += `</g>`;
  }
  for (let i = 0; i < 3; i++) { const ph = (t * 0.45 + i / 3) % 1, rr = 0.2 + ph * 0.75; s += `<path d="${wob(ring(rr, rr, 80 + i, 0.03), 0, 0, true)}" fill="none" stroke="${mix(p.tip, "#ffd08a", fl)}" stroke-width="${n(Math.max(1, cx.s * 0.0018))}" opacity="${n(0.5 * (1 - ph))}"/>`; }
  s += `</g><path d="${wob(out.slice(9, 15))}" stroke="${mix(p.tip, "#ffc45a", fl)}" stroke-width="${n(Math.max(1.2, cx.s * 0.0022))}" fill="none" stroke-linecap="round" opacity="0.75"/>`;
  for (const [a, sz] of [[0.7, 0.016], [2.6, 0.012], [4.4, 0.014]]) { const q = P(c, st.X + Math.cos(a) * st.rx * 1.12, 0.006, st.Z + Math.sin(a) * st.rz * 1.2); s += `<path d="${blob(q.x, q.y, sz * q.s, sz * 0.45 * q.s, a * 10, 0.2, 7)}" fill="${mix(p.stone, p.stoneSh, 0.4)}" stroke="${mix(p.stoneSh, "#000000", 0.3)}" stroke-width="1"/>`; }
  return s;
}

// ---------------------------------------------------------------- light and shadow: all that is ever seen of the march
// torchlight washing over the ground and whatever lies on it: flat banded pools, screen blend, boiling at 8 a second.
// o: { amt 0..1, lights: [{X, Z, r}] (ground pools), spots: [{x, y, r}] (screen, e.g. on a standing figure) }
export function torchWash(c, t, pal, o = {}) {
  const amt = o.amt ?? 1, f = flick(t, 1), boil = Math.floor(t * 8);
  if (amt < 0.01) return "";
  let s = `<g style="mix-blend-mode:screen"><rect width="${W}" height="${H}" fill="#ff4a12" opacity="${n(0.1 * amt * f)}"/>`;
  for (const [li, l] of (o.lights || []).entries()) for (const [kr, col, op] of [[1, "#ff4a14", 0.2], [0.68, "#ff7a1e", 0.2], [0.4, "#ffb23c", 0.18]]) {
    const ps = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = l.r * kr * (1 + (h2(boil + li * 9 + kr * 5, i) - 0.5) * 0.16); ps.push(P(c, l.X + Math.cos(a) * r, 0, Math.max(c.z + 0.2, l.Z + Math.sin(a) * r))); }
    s += `<path d="${wob(ps, 0, 0, true)}" fill="${col}" opacity="${n(op * amt * f * (l.k ?? 1))}"/>`;
  }
  for (const [si, sp] of (o.spots || []).entries()) for (const [kr, col, op] of [[1, "#ff5a18", 0.2], [0.62, "#ff9a2e", 0.2], [0.34, "#ffd070", 0.16]])
    s += `<path d="${blob(sp.x, sp.y, sp.r * kr, sp.r * kr * (sp.ky ?? 0.8), boil + si * 7 + kr * 10, 0.09, 14)}" fill="${col}" opacity="${n(op * amt * f * (sp.k ?? 1))}"/>`;
  return s + `</g>`;
}
// the "stop" beat: the frame goes near-black, only the flame light rests where spot says (screen x, y, r)
export function stopDark(t, spot, amt = 0.95) {
  const id = "hs" + HID++, f = flick(t, 5) * 0.4 + 0.6, boil = Math.floor(t * 6), B = (k, sd) => blob(spot.x, spot.y, spot.r * k * f, spot.r * k * f * (spot.ky ?? 0.8), boil + sd, 0.07, 14);
  return '<filter id="' + id + 'f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="' + n(spot.r * 0.09) + '"/></filter><mask id="' + id + '"><rect width="' + W + '" height="' + H + '" fill="#fff"/><g filter="url(#' + id + 'f)"><path d="' + B(1.55, 1) + '" fill="#000" opacity="0.45"/><path d="' + B(1.05, 2) + '" fill="#000" opacity="0.8"/></g></mask>' +
    '<rect width="' + W + '" height="' + H + '" fill="#040208" opacity="' + n(amt) + '" mask="url(#' + id + ')"/>';
}
// shadows of lower legs and bare feet walking by, thrown flat across the grass and over whoever lies there.
// The walkers themselves are never drawn. o: { from: [X, Z], to: [X, Z] (the line the feet travel), away: [dx, dz]
// (the way the shadows fall, away from the torches), count, speed m/s, stretch, amt 0..1, spread m (side to side) }
const LEG = [[-0.065, 0], [-0.07, 0.035], [-0.035, 0.085], [-0.05, 0.2], [-0.085, 0.33], [-0.07, 0.47], [-0.05, 0.62], [0.075, 0.62], [0.085, 0.47], [0.06, 0.3], [0.04, 0.13], [0.07, 0.085], [0.15, 0.05], [0.2, 0.028], [0.2, 0], [0.12, -0.004]];
export function feetShadows(c, t, pal, o = {}) {
  const p = pp(pal), A = o.from || [1.3, 7], B = o.to || [0.9, 2.2], len = Math.hypot(B[0] - A[0], B[1] - A[1]), T = [(B[0] - A[0]) / len, (B[1] - A[1]) / len];
  const aw = o.away || [-1, 0.12], al = Math.hypot(aw[0], aw[1]), D = [aw[0] / al, aw[1] / al], cnt = o.count ?? 7, v = o.speed ?? 0.85, stretch = o.stretch ?? 1.9, amt = o.amt ?? 0.6, spread = o.spread ?? 0.22, stride = 0.62, span = len + 2;
  let s = "";
  for (let w = 0; w < cnt; w++) for (const side of [0, 1]) {
    const body = ((w / cnt * span + hash(w + 90) * 0.5 + t * v) % span) - 1, ph = ((body / stride + side * 0.5 + hash(w + 91)) % 1 + 1) % 1;
    const rel = ph < 0.5 ? stride * (0.25 - ph) : stride * (-0.25 + (ph - 0.5)), lift = ph < 0.5 ? 0 : Math.sin((ph - 0.5) * 2 * Math.PI) * 0.09, pitch = ph < 0.5 ? 0 : Math.sin((ph - 0.5) * 2 * Math.PI) * 0.55 * (ph < 0.75 ? 1 : -0.4);
    const sl = body + rel, lat = (hash(w + 92) - 0.5) * 2 * spread + (side ? 0.06 : -0.06);
    const cx = A[0] + T[0] * sl - T[1] * lat, cz = A[1] + T[1] * sl + T[0] * lat, ps = [];
    for (const [a0, b0] of LEG) {
      const a = b0 < 0.1 ? a0 * Math.cos(pitch) + b0 * Math.sin(pitch) : a0, b = (b0 < 0.1 ? b0 * Math.cos(pitch) - a0 * Math.sin(pitch) * 0.6 : b0) + lift;
      const X = cx + T[0] * a + D[0] * b * stretch * (1 + b * 0.5), Z = cz + T[1] * a + D[1] * b * stretch * (1 + b * 0.5);
      ps.push(P(c, X, 0.012, Math.max(c.z + 0.19, Z)));
    }
    if (ps.every((q) => q.x < -100) || ps.every((q) => q.x > W + 100) || ps.every((q) => q.y < 0) || ps.every((q) => q.y > H + 200)) continue;
    const edge = clamp(Math.min(body + 1, span - 1 - body) / 0.8);
    s += `<path d="${wob(ps, 0, 0, true)}" fill="${p.shadow}" opacity="${n(edge)}"/>`;
  }
  return `<g style="mix-blend-mode:multiply" opacity="${n(amt)}" filter="url(#hsh)">${s}</g>`;
}
// the same legs as an upright shadow play: thrown by torches behind the camera onto the kid and the grass wall behind
// him, walking across the frame. o: { Z (the plane they fall on), dirX (-1 right to left), count, speed m/s,
// mag (size; the steps scale with it), baseY (metres: lifts the feet up onto him), amt 0..1, x0, x1 (world X span they cross), fadeY [from, to] metres up: the shadow fades out between them (default: feet and shins only) }
const LEG2 = [[-0.065, 0], [-0.07, 0.035], [-0.035, 0.085], [-0.05, 0.2], [-0.085, 0.33], [-0.07, 0.47], [-0.06, 0.56], [-0.1, 0.95], [0.11, 0.95], [0.08, 0.56], [0.085, 0.47], [0.06, 0.3], [0.04, 0.13], [0.07, 0.085], [0.15, 0.05], [0.2, 0.028], [0.2, 0], [0.12, -0.004]];
export function legShadows(c, t, pal, o = {}) {
  const p = pp(pal), Z = o.Z ?? 4, dx = o.dirX ?? -1, cnt = o.count ?? 5, v = o.speed ?? 0.8, mag = o.mag ?? 1, amt = o.amt ?? 0.55, x0 = o.x0 ?? c.x - 1.6, x1 = o.x1 ?? c.x + 1.6, span = x1 - x0;
  if (!vis(c, Z)) return "";
  const TH = 0.38, HIP = 0.95, period = 4 * HIP * Math.sin(TH) * mag / v, y0 = o.baseY ?? 0, fy = o.fadeY || [0.2, 0.4], id = "hl" + HID++;
  let s = "";
  for (let w = 0; w < cnt; w++) for (const side of [0, 1]) {
    const trav = ((w / cnt + hash(w + 90) * 0.5 / cnt) * span + t * v) % span, hipX = dx < 0 ? x1 - trav : x0 + trav, ph = ((t / period + side * 0.5 + hash(w + 91)) % 1 + 1) % 1;
    const sw = ph < 0.5 ? 0 : Math.sin((ph - 0.5) * 2 * Math.PI), ang = ph < 0.5 ? lerp(TH, -TH, ph * 2) : lerp(-TH, TH, (ph - 0.5) * 2), drop = HIP * (1 - Math.cos(ang)) - sw * 0.08, ca = Math.cos(ang), sa = Math.sin(ang), toe = ph < 0.5 ? 0 : -sw * 0.5;
    const ps = LEG2.map(([a, b]) => {
      let x = a, y = b;
      if (b < 0.1) { const xr = a * Math.cos(-ang + toe) - b * Math.sin(-ang + toe), yr = a * Math.sin(-ang + toe) + b * Math.cos(-ang + toe); x = xr; y = yr; }   // the sole stays flat while it stands
      const yy = y - HIP, X = x * ca - yy * sa, Y = HIP + x * sa + yy * ca - drop;
      return P(c, hipX + dx * X * mag, y0 + Math.max(0, Y) * mag, Z);
    });
    s += '<path d="' + wob(ps, 0, 0, true) + '" fill="' + p.shadow + '" opacity="' + n(side ? 0.75 : 1) + '"/>';
  }
  const yk = P(c, 0, y0 + fy[0], Z).y, yh = P(c, 0, y0 + fy[1], Z).y;
  return '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="' + n(yh) + '" x2="0" y2="' + n(yk) + '"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'g)"/></mask>' +
    '<g style="mix-blend-mode:multiply" opacity="' + n(amt) + '" mask="url(#' + id + ')"><g filter="url(#hsh)">' + s + "</g></g>";
}
// dust in the light, and a few moths round a flame (screen space). o: { amt, at: {x, y} for the moths, moths }
export function motes(t, pal, o = {}) {
  const amt = o.amt ?? 1, warm = o.warm ?? 0;
  let s = "";
  for (let i = 0; i < 46; i++) {
    const sp = 14 + 30 * hash(i + 20), x = ((hash(i + 60) * 1200 + 26 * Math.sin(t * 0.7 + i * 2.1) + t * sp * 0.5) % 1200) - 60, y = H - ((t * sp + hash(i + 40) * 2100) % 2100) + 60, r = 1.2 + 2.6 * hash(i + 80) ** 2;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${mix("#cfd6ff", "#ffd27a", warm)}" opacity="${n(amt * (0.18 + 0.4 * hash(i + 81)) * (0.6 + 0.4 * Math.sin(t * 2 + i)))}"/>`;
  }
  if (o.at) for (let i = 0; i < (o.moths ?? 3); i++) {
    const a = t * (1.6 + 0.5 * i) + i * 2.1, rr = 46 + 30 * i + 14 * Math.sin(t * 2.3 + i), x = o.at.x + Math.cos(a) * rr, y = o.at.y + Math.sin(a * 1.3) * rr * 0.55, fl = Math.abs(Math.sin(t * 34 + i)), sz = 7 + 2 * i;
    s += `<g transform="translate(${n(x)},${n(y)}) rotate(${n(Math.cos(a) * 30)})"><path d="M0,0 L${n(-sz)},${n(-sz * fl)} L${n(-sz * 0.7)},${n(sz * 0.3)} Z M0,0 L${n(sz)},${n(-sz * fl)} L${n(sz * 0.7)},${n(sz * 0.3)} Z" fill="#efe6d0" stroke="${INK}" stroke-width="0.6" opacity="0.9"/><ellipse rx="1.3" ry="${n(sz * 0.35)}" fill="#6a5a4a"/></g>`;
  }
  return s;
}

// ---------------------------------------------------------------- cast helpers (the legend.mjs line style)
function limb(ptsL, w, col, shade) {
  const d = "M" + ptsL.map(([x, y]) => `${n(x)},${n(y)}`).join(" L");
  return `<path d="${d}" stroke="${INK}" stroke-width="${n(w + 1.2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    (shade ? `<path d="${d}" stroke="${shade}" stroke-width="${n(w * 0.4)}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(0,${n(w * 0.28)})"/>` : "");
}
function headPath(hx, hy, rx, ry, fx, chin = 1) {
  const jx = hx + fx * rx * 0.38;
  return `M${n(hx - rx)},${n(hy - ry * 0.15)} C${n(hx - rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx)},${n(hy - ry * 0.15)} C${n(hx + rx * 0.98)},${n(hy + ry * 0.45)} ${n(jx + rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(jx)},${n(hy + ry * chin)} C${n(jx - rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(hx - rx * 0.98)},${n(hy + ry * 0.45)} ${n(hx - rx)},${n(hy - ry * 0.15)} Z`;
}
// an eye that is shut tight (open 0), opened a crack (0.2..0.5) or open; squeeze 0..1 adds the creases of a scrunched lid
let LW = 1;
function lidEye(x, y, w, open, dir, look = 0, squeeze = 0, iris = "#2a1d24") {
  if (open < 0.06) {
    let s = '<path d="M' + n(x - w) + "," + n(y - 0.5) + " Q" + n(x - w * 0.1 * dir) + "," + n(y + 1.5) + " " + n(x + w) + "," + n(y - 0.5) + '" stroke="' + INK + '" stroke-width="' + n(0.85 * LW) + '" fill="none" stroke-linecap="round"/>';
    for (const u of [0.25, 0.6, 0.92]) s += '<path d="M' + n(x + dir * u * w) + "," + n(y + 0.75 - u * u * 1.1) + " l" + n(dir * (0.35 + u * 0.6)) + "," + n(1 - u * 0.5) + '" stroke="' + INK + '" stroke-width="' + n(0.5 * LW) + '" stroke-linecap="round"/>';
    if (squeeze > 0.2) s += '<path d="M' + n(x + dir * (w + 0.7)) + "," + n(y - 1) + " l" + n(dir * 1.3) + ",-0.7 M" + n(x + dir * (w + 0.9)) + "," + n(y + 0.1) + " l" + n(dir * 1.4) + ',0.25" stroke="#b5786a" stroke-width="0.4" fill="none" stroke-linecap="round" opacity="' + n(squeeze) + '"/>';
    return s;
  }
  const h = 3.3 * open, id = "he" + HID++, shape = "M" + n(x - w) + "," + n(y + 0.2) + " Q" + n(x) + "," + n(y - h * 1.5) + " " + n(x + w) + "," + n(y) + " Q" + n(x) + "," + n(y + h * 0.95) + " " + n(x - w) + "," + n(y + 0.2) + " Z", ix = x + look * w * 0.42, ir = Math.min(w * 0.5, 2.4), iy = y - h * 0.18;
  return '<clipPath id="' + id + '"><path d="' + shape + '"/></clipPath><path d="' + shape + '" fill="#fbf4ea" stroke="none"/><g clip-path="url(#' + id + ')" stroke="none"><circle cx="' + n(ix) + '" cy="' + n(iy) + '" r="' + n(ir) + '" fill="' + iris + '"/><circle cx="' + n(ix) + '" cy="' + n(iy) + '" r="' + n(ir * 0.5) + '" fill="#0b0710"/><circle cx="' + n(ix + ir * 0.45) + '" cy="' + n(iy - ir * 0.2) + '" r="' + n(ir * 0.3) + '" fill="#ffc97a"/><path d="M' + n(x - w) + "," + n(y - h * 1.6) + " h" + n(w * 2) + " v" + n(h * 0.75) + " Q" + n(x) + "," + n(y - h * 1.25) + " " + n(x - w) + "," + n(y - h * 0.7) + ' Z" fill="#1a1328" opacity="0.22"/></g>' +
    '<path d="M' + n(x - w) + "," + n(y + 0.2) + " Q" + n(x) + "," + n(y - h * 1.5) + " " + n(x + w) + "," + n(y) + '" stroke="' + INK + '" stroke-width="' + n(0.8 * LW) + '" fill="none" stroke-linecap="round"/><path d="M' + n(x - w * 0.85) + "," + n(y + 0.45) + " Q" + n(x) + "," + n(y + h * 0.95) + " " + n(x + w * 0.85) + "," + n(y + 0.3) + '" stroke="' + INK + '" stroke-width="0.35" fill="none" stroke-linecap="round"/>' +
    '<path d="M' + n(x + dir * w) + "," + n(y) + " l" + n(dir * 0.9) + ',-0.5" stroke="' + INK + '" stroke-width="0.5" stroke-linecap="round"/>';
}
function sleeveArm(sh, elbow, hand, k, col, colS, cuffCol, skin) {
  const d = `M${n(sh.x)},${n(sh.y)} Q${n(elbow.x)},${n(elbow.y)} ${n(hand.x)},${n(hand.y)}`, cuff = { x: lerp(elbow.x, hand.x, 0.78), y: lerp(elbow.y, hand.y, 0.78) }, ang = Math.atan2(hand.y - elbow.y, hand.x - elbow.x) * 180 / Math.PI;
  return `<path d="${d}" stroke="${INK}" stroke-width="${n(12.2 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${colS}" stroke-width="${n(3.5 * k)}" stroke-linecap="round" fill="none" transform="translate(0,${n(3 * k)})"/>
    <g transform="translate(${n(cuff.x)},${n(cuff.y)}) rotate(${n(ang)}) scale(${k.toFixed(4)})"><ellipse rx="2.6" ry="6.2" fill="${cuffCol}" stroke="${INK}" stroke-width="0.6"/></g>
    <g transform="translate(${n(hand.x)},${n(hand.y)}) rotate(${n(ang)}) scale(${k.toFixed(4)})"><path d="M-3,-4.4 Q4,-6 6.5,-2.4 Q8,2 4,4.8 Q-3,5 -3.5,0 Z" fill="${skin}" stroke="${INK}" stroke-width="0.6"/><path d="M2.5,-4.6 Q5,-1.6 4,0.8 M4.8,-3 Q6.6,-0.4 5.4,2" stroke="${INK}" stroke-width="0.45" fill="none"/></g>`;
}
const softShadow = (x, y, rx, ry) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#soft)"/>`;
const KID = { skin: "#f3cdb0", jac: "#e8476a", jacS: "#bd2f50", jacL: "#f27a93", jacD: "#a8284a", hair: "#1d1829" };

// ---------------------------------------------------------------- the kid, flat in the grass, face down, head turned to us
// st: { X, Z (the ground under his head), dir (+1 body to the right of the head, -1 to the left), eye 0..1 (the upper
//       eye: 0 shut, 0.4 = opened a crack), eye2 (the eye by the grass, default shut), look -1..1, squeeze 0..1,
//       worry 0..1, mouth 0..1 (open: the sneeze coming), breath 0..1 }
// Returns { svg, face: {x, y, r}, eyePt, back, hand, p } in screen px.
const olw = (s) => n(clamp(0.6 * (480 / s) ** 0.5, 0.3, 0.6));   // the outline thins a little as the camera comes close
export function kidProne(c, st, t) {
  if (!vis(c, st.Z)) return { svg: "", face: null };
  const p = P(c, st.X, 0, st.Z), k = p.s / 100, dir = st.dir ?? 1, { skin, jac, jacS, jacL, jacD, hair } = KID;
  const br = 1 + 0.035 * Math.sin(t * 2.6) * (st.breath ?? 1), worry = st.worry ?? 1, sq = st.squeeze ?? 0.8, open = st.eye ?? 0, mo = st.mouth || 0, fx = 0.25, ex = fx * 4.5;
  const SP = (lx, ly) => ({ x: p.x + dir * lx * k, y: p.y + ly * k });
  LW = olw(p.s) / 0.6;
  const legs = limb([[52, -9.5], [73, -6.5], [94, -6]], 6.5, "#d9cba9") +
    '<path d="M93,-10 Q100,-12 104,-8.5 Q106,-4 103.5,-0.6 L96,-0.8 Q94,-5 93,-10 Z" fill="#e4e0ea"/><path d="M103.6,-9 Q106.4,-4 103.5,-0.6 L101.6,-0.9 Q104.2,-4.6 102,-8.6 Z" fill="#b8344c"/>' +
    limb([[52, -6], [75, -3.8], [96, -3.8]], 6.5, "#ece0c4", "#d9cba9") + '<path d="M74,-6.6 q1.5,1.6 0.6,3.4 M61,-8.4 q1.2,1.4 0.4,3" stroke="#bfae8a" stroke-width="0.6" fill="none"/>' +
    '<path d="M92.6,-7.2 L96.4,-7.2 L96.4,-0.6 L92.6,-0.6 Z" fill="#f6f3ee"/><path d="M96,-8.2 Q103,-10.4 107,-7 Q109,-3 106.5,0 L98.6,-0.2 Q96.6,-4 96,-8.2 Z" fill="#f2eff6"/><path d="M106.6,-7.4 Q109.4,-3 106.5,0 L104.5,-0.3 Q107.2,-3.6 105,-7 Z" fill="#c23a52"/><path d="M99,-6.4 l3,-0.5 M99.4,-4.6 l3,-0.4" stroke="#b9b4c4" stroke-width="0.5"/>';
  const torso = '<g transform="translate(35,0) scale(1,' + br.toFixed(4) + ') translate(-35,0)">' +
    '<path d="M13,-16 Q17,-24 28,-25.6 Q42,-26 54,-18 Q57.5,-12 56,-1.5 Q35,0.6 15,-1.5 Q12,-8 13,-16 Z" fill="' + jac + '"/>' +
    '<path d="M15,-1.5 Q35,0.6 56,-1.5 Q56.9,-7 55.6,-10.5 Q35,-6.4 13,-9.4 Q12.8,-5 15,-1.5 Z" fill="' + jacS + '" stroke="none"/>' +
    '<path d="M20,-21.4 Q30,-24 42,-22.4" stroke="' + jacL + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    [[31, -25.4], [40, -25], [48.6, -21.6]].map(([x, y]) => '<path d="M' + x + "," + y + " Q" + (x + 2.4) + ",-12 " + (x + 0.6) + ',-1.2" stroke="' + jacD + '" stroke-width="0.6" fill="none"/>').join("") +
    '<path d="M30,-15.6 Q43,-16.4 55.4,-11.6 M33,-7.4 Q45,-7.6 56,-5.6" stroke="' + jacD + '" stroke-width="0.35" fill="none" opacity="0.7"/>' +
    '<path d="M51.4,-19.6 Q57.6,-12 56,-1.5 L52.6,-1.2 Q54,-11 49,-18.6 Z" fill="' + jacD + '"/>' +
    // the hood, slumped on his shoulders
    '<path d="M12.4,-17 Q14,-27.6 24,-28.6 Q31,-27 30.4,-20.6 Q24,-15.6 13.6,-13.6 Z" fill="' + jac + '"/><path d="M15.6,-18.6 Q20,-24.6 27.6,-23.6" stroke="' + jacD + '" stroke-width="0.6" fill="none"/><path d="M24.6,-28.4 Q31,-27 30.4,-20.6 Q28,-18.8 26,-17.8 Q28,-23 24.6,-28.4 Z" fill="' + jacS + '" stroke="none"/></g>';
  // the head: drawn upright (crown up), then laid over on its cheek. In head space, gravity pulls toward -x.
  const browY = -7.4;
  const head = '<g transform="translate(0.6,-12) rotate(-48) scale(1.06)">' +
    '<path d="M9.4,-3 q4.2,-0.5 3.6,4.5 q-0.4,3 -3.6,2.6 Z" fill="' + skin + '"/><path d="M10.6,-1 q1.5,0.6 0.9,2.4" stroke="#c48a74" stroke-width="0.5" fill="none"/>' +
    '<path d="' + headPath(0, 0, 10.6, 11.4, fx, 1.04) + '" fill="' + skin + '"/>' +
    '<path d="M-10.2,-3 Q-11.6,3 -7.6,8.6 Q-9.2,3 -8.8,-3 Z" fill="#e2b89c" stroke="none"/>' +
    '<path d="M-10.8,1 Q-12.5,-16 -2,-17.5 Q9,-19 11.2,-6 L10.4,1 Q8.4,-7.6 1,-9.6 Q-8.6,-8.6 -10.8,1 Z" fill="' + hair + '"/>' +
    [[-8.4, 0], [-4.4, 1], [-0.4, 0], [3.6, 1], [7.2, 0]].map(([x, o]) => '<path d="M' + (x + 0.6) + ",-13 Q" + (x - 2.4) + ",-8 " + n(x - 4.4 - o) + "," + n(-3.4 - o * 2.4) + " L" + (x + 3.2) + ',-11.6 Z" fill="' + hair + '"/>').join("") +
    '<path d="M-5,-15.5 Q1,-17 6,-14" stroke="#463e66" stroke-width="1.1" fill="none"/><path d="M0,-17.8 q0.6,-3.4 3,-3.8 q-1.4,1.6 -1,3.6 Z" fill="' + hair + '"/>' +
    '<path d="M-7,-12.5 Q-1,-16.8 6,-12" stroke="#5b5280" stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round"/>' +
    '<path d="M' + n(ex - 6.8) + "," + n(browY + worry * 0.9) + " Q" + n(ex - 4.4) + "," + n(browY - 0.6) + " " + n(ex - 2) + "," + n(browY - worry * 1.2) + " M" + n(ex + 2) + "," + n(browY - worry * 1.2) + " Q" + n(ex + 4.6) + "," + n(browY - 0.6) + " " + n(ex + 7.2) + "," + n(browY + worry * 0.9) + '" stroke="' + hair + '" stroke-width="' + n(1.05 * LW) + '" stroke-linecap="round" fill="none"/>' +
    lidEye(ex - 4.3, -1.2, 2.4, st.eye2 ?? 0, -1, st.look ?? 0, sq) + lidEye(ex + 4.4, -1.2, 2.8, open, 1, st.look ?? 0, open > 0.06 ? 0 : sq) +
    '<path d="M' + n(ex + 0.4) + ",1.6 q0.9,2 -0.3,3" + (mo > 0.3 ? " M" + n(ex - 1.3) + ",2.6 l-0.9,-0.7 M" + n(ex + 1.9) + ",2.6 l0.9,-0.7" : "") + '" stroke="#c48a74" stroke-width="' + n(0.75 * LW) + '" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="' + n(ex - 6.4) + '" cy="4.4" rx="2.1" ry="1.2" fill="#f08a96" opacity="0.5" stroke="none"/><ellipse cx="' + n(ex + 6.6) + '" cy="4.4" rx="2.2" ry="1.25" fill="#f08a96" opacity="0.5" stroke="none"/>' +
    (mo > 0.12 ? '<path d="M' + n(ex - 1.9) + ",8 Q" + n(ex) + "," + n(8 - 1.2 - mo) + " " + n(ex + 1.9) + ",8 Q" + n(ex) + "," + n(8 + 1 + mo * 3) + " " + n(ex - 1.9) + ',8 Z" fill="#5a1f30"/>' : '<path d="M' + n(ex - 2.1) + ",8.1 q1,-0.8 2.1,-0.1 q1.1,0.7 2.1,-0.2" + '" stroke="#6a2a38" stroke-width="' + n(0.8 * LW) + '" fill="none" stroke-linecap="round"/>') +
    // a blade of grass and a seed caught in his hair
    '<path d="M-7,-19.4 Q-2,-18 3,-13.6" stroke="#7fae6a" stroke-width="0.8" stroke-linecap="round" fill="none"/><path d="M6,-18.2 l1.8,2.6" stroke="#d6c47a" stroke-width="0.7" stroke-linecap="round"/></g>';
  // the near arm: elbow out, forearm along the ground, the hand by his chin, the brass bell tipped over on its side
  const arm = '<path d="M14,-8.4 L30,-9.6 Q36.4,-9.4 36.6,-5 Q36.4,-0.6 31,-0.5 L14,-0.5 Z" fill="' + jac + '"/><path d="M14,-0.5 L31,-0.5 Q36,-0.8 36.5,-4.4 Q30,-3 14,-3.2 Z" fill="' + jacS + '" stroke="none"/>' +
    '<path d="M22,-21 Q33,-20 35.4,-9.6 M20,-8.8 l0.4,8 M27,-9.3 l0.4,8.6 M15,-6.4 Q25,-7.4 35,-6.6" stroke="' + jacD + '" stroke-width="0.45" fill="none"/>' +
    '<path d="M11.2,-7.6 L14.8,-7.4 L15,-0.2 L11.4,-0.2 Z" fill="' + jacD + '"/>' +
    '<path d="M11.4,-6.6 Q6,-7.4 3.4,-4.4 Q2.4,-1.4 4.6,-0.4 L11.4,-0.4 Z" fill="' + skin + '"/><path d="M4,-4 l3,-0.5 M3.6,-2.4 l3.2,-0.2 M9,-6.6 q-1.6,1 -1.4,2.6" stroke="' + INK + '" stroke-width="0.4" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(13,-7.2) rotate(' + n(14 + Math.sin(t * 9) * 3 * (st.breath ?? 1)) + ') scale(0.85)"><path d="M0,0 L0,2.4" stroke="#a82c2a" stroke-width="0.8"/><path d="M-2.6,6 Q-2.8,2.2 0,2 Q2.8,2.2 2.6,6 Z" fill="#e0b040"/><path d="M-1.2,3.4 Q0,2.6 1,3.4" stroke="#fff3b0" stroke-width="0.5" fill="none"/><circle cy="6.2" r="0.7" fill="#6b4a10"/></g>';
  const mid = SP(46, 0);
  const svg = softShadow(mid.x, mid.y + 1.5 * k, 66 * k, 7 * k) + '<g stroke="' + INK + '" stroke-width="' + olw(p.s) + '" stroke-linejoin="round" transform="translate(' + n(p.x) + "," + n(p.y) + ") scale(" + (dir * k).toFixed(4) + "," + k.toFixed(4) + ')">' + legs + torso + arm + head + "</g>";
  return { svg, p, face: { ...SP(1, -13), r: 15 * k }, eyePt: SP(-1.5, -18), back: SP(38, -25.5), hand: SP(7, -3) };
}

// ---------------------------------------------------------------- grandma, flat beside him, one arm over his back
// st: { X, Z (under her head), dir, eye 0..1 (0 shut), hold: {x, y} screen point her hand presses on (kidProne().back) }
// Returns { svg, arm (draw after the kid), p }
export function keeperProne(c, st, t) {
  if (!vis(c, st.Z)) return { svg: "", arm: "" };
  const p = P(c, st.X, 0, st.Z), k = p.s / 100, dir = st.dir ?? 1;
  const skin = "#e6bf9e", cloak = "#2b2f6b", cloakS = "#20234f", lining = "#f2a93b", white = "#efebe3", fx = 0.15, ex = fx * 4.5, br = 1 + 0.02 * Math.sin(t * 1.9 + 1);
  const SP = (lx, ly) => ({ x: p.x + dir * lx * k, y: p.y + ly * k });
  LW = olw(p.s) / 0.6;
  const body = `<path d="M99,-7.5 Q106,-9 109,-4.6 Q109.4,-1 105,-0.5 L98,-1 Z" fill="#3a2a2a"/>
    <g transform="translate(50,0) scale(1,${br.toFixed(4)}) translate(-50,0)">
    <path d="M10.6,-12 Q16,-28 34,-32 Q60,-34 84,-21 Q98,-13 103,-2.5 Q55,2 9,-2 Q8,-7 10.6,-12 Z" fill="${cloak}"/>
    <path d="M9,-2 Q55,2 103,-2.5 Q101.5,-7.4 97.6,-10.6 Q55,-5.4 9.8,-8.6 Z" fill="${cloakS}" stroke="none"/>
    <path d="M31,-30 Q45,-19 50,-3 M53,-31.6 Q65,-19 70,-3 M72.6,-26 Q83,-17 88,-4.4" stroke="#1c1f48" stroke-width="0.8" fill="none"/>
    <path d="M9,-2 Q30,0.8 52,-0.2 Q54,-3.2 57,-0.2 Q80,0.4 103,-2.5 L101.8,-5.6 Q80,-2.8 58,-3.4 Q54.6,-6 51.4,-3.4 Q30,-2.4 9.4,-5.2 Z" fill="${lining}"/>
    <path d="M8.6,-13.6 Q16,-26 27.6,-28.4 Q25,-15 20.6,-5 Q12,-5 8.6,-13.6 Z" fill="#363a7d"/><path d="M11,-12.6 Q17,-21.6 25.6,-25" stroke="${lining}" stroke-width="1.2" fill="none"/></g>`;
  const head = `<g transform="translate(0.4,-11.3) rotate(-48)">
    <path d="M9.2,-2.6 q3.4,0.4 2.8,4.6 q-0.8,2 -3,1.2 Z" fill="${skin}"/>
    <path d="${headPath(0, 0, 10.5, 11.5, fx, 0.98)}" fill="${skin}"/>
    <path d="M-11,-1 Q-12.5,-15 1,-15 Q12.5,-15 11,-1 L9.8,2 Q8.5,-8 2,-9.5 Q-6,-10 -10,2 Z" fill="${white}"/>
    <path d="M-6,-13 Q0,-11 6,-13.5 M-9,-8 Q-6,-11 -2,-11.5" stroke="#c9c1b3" stroke-width="0.6" fill="none"/>
    <circle cx="4" cy="-17" r="6.2" fill="${white}"/><path d="M0,-19 Q4,-14 8.5,-18" stroke="#c9c1b3" stroke-width="0.6" fill="none"/>
    <path d="M-1.5,-15 Q4,-12.5 10,-16" stroke="#d8443a" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M6,-22 L13,-26" stroke="#4e2f1d" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M-12,-3 Q-13.6,3 -11,6" stroke="${white}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M${n(ex - 7)},-5.4 Q${n(ex - 4.5)},-8 ${n(ex - 1.5)},-7.6 M${n(ex + 1.5)},-7.6 Q${n(ex + 4.5)},-8 ${n(ex + 7)},-5.4" stroke="#d9d2c4" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    ${lidEye(ex - 4, -1.8, 2.1, st.eye ?? 0, -1, st.look ?? -0.5, 1, "#3a2418")}${lidEye(ex + 4, -1.8, 2.3, st.eye ?? 0, 1, st.look ?? -0.5, 1, "#3a2418")}
    <path d="M${n(ex + 0.2)},0 q0.9,3 -0.4,3.8" stroke="#b07e64" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    <path d="M${n(ex - 5)},3 Q${n(ex - 5.5)},6 ${n(ex - 3.5)},7.5 M${n(ex + 4)},3 Q${n(ex + 4.5)},6 ${n(ex + 3)},7.5" stroke="#c09078" stroke-width="0.5" fill="none"/>
    <path d="M${n(ex - 2.2)},7 Q${n(ex)},6 ${n(ex + 2.2)},7" stroke="#7a4a3a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    <ellipse cx="${n(ex - 6.5)}" cy="4" rx="2.2" ry="1.2" fill="#e08a80" opacity="0.4" stroke="none"/></g>`;
  const mid = SP(52, 0), sh = SP(24, -27), hand = st.hold || SP(-12, -3), elbow = { x: lerp(sh.x, hand.x, 0.5), y: Math.min(sh.y, hand.y) - 7 * k };
  return { svg: softShadow(mid.x, mid.y + 2 * k, 70 * k, 8 * k) + `<g stroke="${INK}" stroke-width="${olw(p.s)}" stroke-linejoin="round" transform="translate(${n(p.x)},${n(p.y)}) scale(${(dir * k).toFixed(4)},${k.toFixed(4)})">${body}${head}</g>`, arm: sleeveArm(sh, elbow, hand, k, cloak, cloakS, lining, skin), p };
}
// her staff laid in the grass, the candle jar stood upright at its end. st: { X, Z (the jar), dir (+1 staff runs right), flame 0..1 }
// Returns { svg, jar: {x, y} } (the candle is the fear meter: flame 1 calm .. 0.15 nearly out)
export function staffDown(c, st, t) {
  if (!vis(c, st.Z)) return { svg: "", jar: null };
  const p = P(c, st.X, 0, st.Z), k = p.s / 100, dir = st.dir ?? 1, fl = (st.flame ?? 1) * (1 + 0.07 * Math.sin(t * 21) + 0.05 * Math.sin(t * 33 + 1));
  const cord = (x) => `<path d="M${x - 1},-4.6 L${x},-0.6 M${x + 1},-4.6 L${x + 2},-0.6" stroke="#d6b071" stroke-width="0.9"/><path d="M${x + 1},-0.8 q4,2.4 9,1.4" stroke="#c9463e" stroke-width="0.8" fill="none"/><circle cx="${x + 10.4}" cy="0.6" r="1" fill="#c9463e" stroke="none"/>`;
  const svg = `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${(dir * k).toFixed(4)},${k.toFixed(4)})"><circle cx="0" cy="-10" r="${n(8 + 34 * fl)}" fill="url(#flame)"/></g>
  <g class="ol" transform="translate(${n(p.x)},${n(p.y)}) scale(${(dir * k).toFixed(4)},${k.toFixed(4)})">
    <path d="M8,-4.4 L150,-5.2 L150,-1.6 L8,-0.8 Z" fill="#6f4528"/><path d="M8,-4.4 L150,-5.2 L150,-4 L8,-3.2 Z" fill="#8a5a37" stroke="none"/>
    <path d="M9,-2.8 Q3,-3 2,-9 L1,-12" stroke="#4e2f1d" stroke-width="2.2" fill="none" stroke-linecap="round"/>${cord(38)}${cord(104)}
    <path d="M-6,-13.5 Q-7.6,-7 -6,-0.6 Q0,1 6,-0.6 Q7.6,-7 6,-13.5 Z" fill="#cfe6ff" fill-opacity="0.35" stroke="#e9f3ff" stroke-width="0.8"/>
    <path d="M-6.5,-16.5 L6.5,-16.5 L6,-13.5 L-6,-13.5 Z" fill="#3a2a2a"/><path d="M-1.4,-1 L1.4,-1 L1.4,-6 L-1.4,-6 Z" fill="#fff4e0"/>
    <path d="M0,${n(-6 - 8 * fl)} Q${n(2.8 * fl)},${n(-7 - 2 * fl)} 0,-6 Q${n(-2.8 * fl)},${n(-7 - 2 * fl)} 0,${n(-6 - 8 * fl)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/>
    <path d="M-4.4,-11 q-1,4 -0.2,8" stroke="#ffffff" stroke-width="0.7" fill="none" opacity="0.6"/></g>`;
  return { svg, jar: { x: p.x, y: p.y - 10 * k } };
}

// ---------------------------------------------------------------- the kid from behind, holding his phone up at the ridge
// st: { X, Z, raise 0..1 (the phone arm), tilt deg (head back), lean, rec 0..1 (the screen shows the torch points) }
// Returns { svg (body), phone (arm + phone: draw after grandma's arm so her hand is behind it), lens: {x, y, s} (the
// screen point her hand goes to: pass it to keeper() as the sleeve), fingers(amt) (her fingertips over the top edge) }
export function kidFilming(c, st, t) {
  if (!vis(c, st.Z)) return { svg: "", phone: "", lens: null, fingers: () => "" };
  const p = P(c, st.X, 0, st.Z), S = 0.8, LS = 0.74, DY = 78 * (1 - LS), HS = 1.32, k = p.s / 100, { skin, jac, jacS, jacL, jacD, hair } = KID;
  const ra = st.raise ?? 1, hx = 1.5, hy = -138, bellSw = Math.sin(t * 7) * 2;
  const el = [lerp(16, 21.5, ra), lerp(-99, -131, ra)], wr = [lerp(17, 19.5, ra), lerp(-80, -148, ra)], ph = [wr[0] + 1.5 * ra, wr[1] - 12.5], tiltP = 7 + Math.sin(t * 1.3) * 1.5;
  const legs = `<path d="M1.5,-78 L9,-78 L8.5,-8 L3,-8 Z" fill="#d9cba9"/><path d="M-9,-78 L-1.5,-78 L-3,-8 L-8.5,-8 Z" fill="#ece0c4"/><path d="M-7,-44 Q-5,-46.5 -3,-44 M4.5,-48 Q6.5,-50.4 8,-48" stroke="#bfae8a" stroke-width="0.6" fill="none"/>
    <path d="M2.6,-1 Q2,-7.4 4,-8.5 L8.6,-8.5 Q10.6,-6 10.4,-1 Z" fill="#e4e0ea"/><path d="M2.6,-1 L10.4,-1 L10.4,-2.5 L2.6,-2.5 Z" fill="#b8344c"/><path d="M-10.4,-1 Q-10.6,-6 -8.6,-8.5 L-4,-8.5 Q-2,-7.4 -2.6,-1 Z" fill="#f2eff6"/><path d="M-10.4,-1 L-2.6,-1 L-2.6,-2.5 L-10.4,-2.5 Z" fill="#c23a52"/>
    <path d="M-7.6,-8.5 L-5,-8.5 L-5,-4 L-7.6,-4 Z M5.2,-8.5 L7.6,-8.5 L7.6,-4 L5.2,-4 Z" fill="#c9c4d4" stroke="none"/>`;
  const body = `<g class="ol" transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(st.lean || 0)}) scale(${(k * S).toFixed(4)})">
    <g transform="scale(1,${LS})">${legs}</g>
    <g transform="translate(0,${n(DY)})">
    ${limb([[-12.5, -120], [-15.5, -100], [-16, -80]], 7.5, jac)}
    <path d="M-19.4,-81 L-12.8,-81 L-13,-77.5 L-19.2,-77.5 Z" fill="${jacD}"/><path d="M-18.6,-77.5 Q-19,-71 -16,-70 Q-13,-71 -13.4,-77.5 Z" fill="${skin}"/>
    <g transform="translate(-16,-77.5) rotate(${n(bellSw)})"><path d="M0,0 L0,3" stroke="#a82c2a" stroke-width="0.8"/><path d="M-2.6,6.6 Q-2.8,2.8 0,2.6 Q2.8,2.8 2.6,6.6 Z" fill="#e0b040"/><path d="M-1.2,4 Q0,3.2 1,4" stroke="#fff3b0" stroke-width="0.5" fill="none"/><circle cy="6.8" r="0.7" fill="#6b4a10"/></g>
    <path d="M-13,-124 Q-16.5,-110 -15.5,-96 Q-16.5,-84 -14.5,-74 Q0,-70.5 14.5,-74 Q16.5,-84 15.5,-96 Q16.5,-110 13,-124 Q0,-128 -13,-124 Z" fill="${jac}"/>
    <path d="M3,-126 Q13,-126 13,-124 Q16.5,-110 15.5,-96 Q16.5,-84 14.5,-74 Q9,-72.5 5,-72.3 Q7,-100 3,-126 Z" fill="${jacS}" stroke="none"/>
    <path d="M-12,-122 Q-14.5,-108 -13.5,-97" stroke="${jacL}" stroke-width="1.4" fill="none"/>
    ${[-102, -91, -81].map((y) => `<path d="M-15.5,${y} Q0,${y + 2.2} 15.5,${y}" stroke="${jacD}" stroke-width="0.6" fill="none"/>`).join("")}
    ${[-10, -3, 4, 11].map((x) => `<path d="M${x},-108 L${x + (x < 0 ? -1 : 1)},-74" stroke="${jacD}" stroke-width="0.35" fill="none" opacity="0.7"/>`).join("")}
    <path d="M-14.5,-76 Q0,-72 14.5,-76 L14.5,-73 Q0,-69.5 -14.5,-73 Z" fill="${jacD}"/>
    <path d="M-10.5,-125 Q-13,-111 0,-106.5 Q13,-111 10.5,-125 Q0,-121 -10.5,-125 Z" fill="${jac}"/><path d="M2,-107 Q13,-111 10.5,-125 Q7,-123.4 4,-122.8 Q7,-114 2,-107 Z" fill="${jacS}" stroke="none"/><path d="M-7,-121 Q-6,-112 0,-110" stroke="${jacD}" stroke-width="0.6" fill="none"/>
    <path d="M-7.5,-125 L-7.5,-131 Q0,-133.5 7.5,-131 L7.5,-125 Q0,-122.5 -7.5,-125 Z" fill="${jac}"/>
    <path d="M-3,-131 L3,-131 L2.6,-127 L-2.6,-127 Z" fill="#e2b89c"/>
    <g transform="translate(0,-127) scale(${HS}) translate(0,127) rotate(${n(st.tilt ?? 5)} 0 -128)">
      <path d="M${n(hx - 9.8)},${n(hy - 3)} q-3.6,-0.3 -3.2,4.2 q0.4,2.8 3.2,2.6 Z" fill="${skin}"/><path d="M${n(hx + 9.8)},${n(hy - 3)} q3.6,-0.3 3.2,4.2 q-0.4,2.8 -3.2,2.6 Z" fill="${skin}"/>
      <path d="${headPath(hx, hy, 10.6, 11.4, 0, 1.0)}" fill="${skin}"/>
      <path d="M${n(hx - 11)},${n(hy + 3)} Q${n(hx - 12.8)},${n(hy - 17)} ${n(hx - 1)},${n(hy - 18)} Q${n(hx + 12.5)},${n(hy - 18)} ${n(hx + 11.2)},${n(hy + 3)} Q${n(hx + 9)},${n(hy + 8.4)} ${n(hx + 5.4)},${n(hy + 9.8)} L${n(hx + 3.2)},${n(hy + 7.4)} L${n(hx + 1.2)},${n(hy + 10.6)} L${n(hx - 1.4)},${n(hy + 7.6)} L${n(hx - 4)},${n(hy + 10)} Q${n(hx - 9)},${n(hy + 8)} ${n(hx - 11)},${n(hy + 3)} Z" fill="${hair}"/>
      <path d="M${n(hx + 1)},${n(hy - 9)} q-6,-1 -8.6,5 M${n(hx + 1)},${n(hy - 9)} q6.4,0.4 8,6.6 M${n(hx + 1)},${n(hy - 9)} q-1.6,6 -5,10 M${n(hx + 1)},${n(hy - 9)} q2.4,6.6 1,13 M${n(hx + 1)},${n(hy - 9)} q-3,-4.6 -1.4,-7.6" stroke="#3a3354" stroke-width="0.55" fill="none"/>
      <path d="M${n(hx - 7.5)},${n(hy - 12)} Q${n(hx - 1)},${n(hy - 16.8)} ${n(hx + 6)},${n(hy - 13)}" stroke="#5b5280" stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round"/>
      <path d="M${n(hx)},${n(hy - 17.8)} q0.6,-3.4 3,-3.8 q-1.4,1.6 -1,3.6 Z" fill="${hair}"/><path d="M${n(hx - 4)},${n(hy - 17.4)} q-1,-2.4 -3,-2.4 q1.4,1 1.4,2.6 Z" fill="${hair}"/>
    </g></g></g>`;
  const scr = st.rec ?? 1;
  const phone = `<g class="ol" transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(st.lean || 0)}) scale(${(k * S).toFixed(4)}) translate(0,${n(DY)})">
    ${limb([[12.5, -120], el, wr], 7.5, jac, jacS)}
    <g transform="translate(${n(wr[0])},${n(wr[1])}) rotate(${n(lerp(0, -8, ra))})"><path d="M-3.6,3.6 L3.6,3.6 L3.4,0.2 L-3.4,0.2 Z" fill="${jacD}"/><path d="M-3,0.2 Q-3.6,-6 0,-6.6 Q3.6,-6 3,0.2 Z" fill="${skin}"/></g>
    <g transform="translate(${n(ph[0])},${n(ph[1])}) rotate(${n(tiltP)})">
      <rect x="-5" y="-10" width="10" height="20" rx="1.4" fill="#17131f"/>
      <rect x="-4.2" y="-9" width="8.4" height="18" rx="0.6" fill="#4a52c8" stroke="none"/><path d="M-4.2,-9 h8.4 v5 q-4,1.6 -8.4,0.4 Z" fill="#6f58d6" stroke="none"/>
      <g opacity="${n(scr)}"><path d="M-4.2,1 L-2.6,-2.6 L-1.4,-0.4 L0.4,-4.4 L1.8,-1.6 L3,-3.4 L4.2,-0.6 L4.2,9 L-4.2,9 Z" fill="#0b2a30" stroke="none"/>
      ${[[-2.4, -0.6], [-1.5, 0.9], [-0.9, 2.2], [0, 3.2], [0.5, 4.5], [1.5, 5.6]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${n(0.5 + 0.12 * i)}" fill="#ffb640" stroke="none" opacity="${n(flick(t, i + 30))}"/>`).join("")}
      <circle cx="-2.9" cy="-7.4" r="0.7" fill="#ff3b30" stroke="none" opacity="${n(Math.sin(t * 5) > -0.2 ? 1 : 0.2)}"/><path d="M-3.6,-5.4 h1.3 M-3.6,-5.4 v1.3 M3.6,7.6 h-1.3 M3.6,7.6 v-1.3" stroke="#ffffff" stroke-width="0.35" fill="none" opacity="0.8"/></g>
      <path d="M-5.4,4.6 Q-7.2,5.4 -6.6,7.2 Q-5.4,8.4 -4,7.4 M-5.4,1.2 Q-7,1.8 -6.6,3.4 Q-5.6,4.4 -4.2,3.8" fill="${skin}"/><path d="M5,6 Q3,3.4 3.6,0.6 Q5.6,0.4 6,3 Z" fill="${skin}"/>
    </g></g>`;
  const toS = (lx, ly) => L.toScreen(p, st.lean || 0, lx * S, (ly + DY) * S), top = toS(ph[0] + 1.2, ph[1] - 10.5), ang = tiltP + (st.lean || 0);
  const fingers = (amt = 1) => (amt < 0.5 ? "" : `<g transform="translate(${n(top.x)},${n(top.y)}) rotate(${n(ang)}) scale(${(k * 0.8).toFixed(4)})">${[[-3.3, 3.2], [-1.1, 4], [1.1, 3.8], [3.2, 2.8]].map(([x, len]) => `<path d="M${x - 1},-2.4 Q${x - 1.2},${len} ${x},${len + 0.8} Q${x + 1.2},${len} ${x + 1},-2.4 Z" fill="#e6bf9e" stroke="${INK}" stroke-width="0.6"/><path d="M${x - 0.7},${n(len * 0.45)} h1.4" stroke="#b07e64" stroke-width="0.4"/>`).join("")}</g>`);
  return { svg: softShadow(p.x, p.y, 0.26 * p.s, 0.052 * p.s) + body, phone, lens: { x: top.x + 1.5 * k, y: top.y - 5.5 * k, s: p.s }, fingers, p };
}
