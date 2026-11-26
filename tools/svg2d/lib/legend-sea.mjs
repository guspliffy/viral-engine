// Legend ep 03 (Urashima Taro): the Tango coast, the dive, the Dragon Palace, the village 300 years on, the cast
// (Urashima with an age parameter, Otohime, the sea turtle) and the props (tamatebako, smoke, loose staff).
// Design only. Same conventions as legend.mjs / legend-mexico.mjs: metres, X right, Y up, Z into the picture, P(c, X, Y, Z).
// Every frame: L.resetIds(); SEA.resetIds(); SEA.mood(m); then SEA.defs(), layers, SEA.grade(), SEA.vignette().
// Nothing uses Math.random: all wobble is seeded, frames render in any order.
import { W, H, INK, n, lerp, clamp, hash, mix, P, PAL, defs as baseDefs } from "./legend.mjs";

const NEAR = 0.3;
const vis = (c, Z) => Z - c.z > NEAR;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const LW = (k) => n(Math.min(3, Math.max(0.7, k * 0.011)));          // ink weight for k px per metre
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
const ring = (x, y, r, seed, wob = 0.07, N = 16, sq = 1) => blob(Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2, rr = r * (1 + jit(seed + i, wob)); return { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * sq }; }));
const shp = (d, fill, lw = 1, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round" ${extra}/>`;
const flat = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" stroke="none" ${extra}/>`;
const ln = (d, col, w, extra = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
// a billboard in local metres standing on a world point: b.pt(x, y) -> "sx,sy" (y up)
function board(c, X, Y, Z, size = 1) { const p = P(c, X, Y, Z), k = p.s * size; return { p, k, lw: LW(k), x: (x) => p.x + x * k, y: (y) => p.y - y * k, pt: (x, y) => `${n(p.x + x * k)},${n(p.y - y * k)}` }; }
// hand-wobbled polygon / polyline in board units (corners stay nearly put, the edges wander)
function hd(b, a, seed = 1, amp = 0.012, per = 0.3, close = true) {
  const out = [];
  a.forEach((A, i) => {
    if (!close && i === a.length - 1) { out.push(b.pt(A[0], A[1])); return; }
    const B = a[(i + 1) % a.length], len = Math.hypot(B[0] - A[0], B[1] - A[1]), kk = Math.max(1, Math.round(len / per));
    for (let j = 0; j < kk; j++) { const u = j / kk, id = seed * 131 + i * 17 + j, am = j ? amp : amp * 0.35; out.push(b.pt(lerp(A[0], B[0], u) + jit(id, am), lerp(A[1], B[1], u) + jit(id + 0.5, am))); }
  });
  return "M" + out.join(" L") + (close ? " Z" : "");
}
// world polygon on the ground (or any plane) with wobbling edges
function wpoly(c, a, seed, amp = 0.015, per = 0.5) {
  const out = [];
  a.forEach((A, i) => { const B = a[(i + 1) % a.length], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), kk = Math.max(1, Math.round(len / per));
    for (let j = 0; j < kk; j++) { const u = j / kk, id = seed * 131 + i * 17 + j; out.push(pt(P(c, lerp(A[0], B[0], u) + jit(id, amp), lerp(A[1], B[1], u) + jit(id + 0.5, amp), Math.max(c.z + NEAR, lerp(A[2], B[2], u))))); } });
  return "M" + out.join(" L") + " Z";
}
// a wandering horizontal edge in screen space, and the band below it
const wline = (y, seed, amp = 14, step = 120) => Array.from({ length: Math.ceil((W + 80) / step) + 1 }, (_, i) => ({ x: -40 + i * step, y: y + jit(seed * 37 + i, amp) }));
const band = (a, fill, extra = "") => `<path d="M-40,${H + 40} L${a.map(pt).join(" L")} L${W + 40},${H + 40} Z" fill="${fill}" ${extra}/>`;
// painted light: nested hand-cut flat shapes (no smooth glow)
function lightBlobs(x, y, radii, col, alphas, seed, sq = 1) { return radii.map((r, j) => flat(ring(x, y, r, seed + j * 31, 0.08, 18, sq), col, `opacity="${n(alphas[j])}" style="mix-blend-mode:screen"`)).join(""); }

// ---------------------------------------------------------------- colour: one mood number
// 0 sunny beach, 1 the dive, 2 the palace, 3 the return (300 years on, the warmth gone), 4 golden-hour beach.
// Fractions blend neighbours (0.5 = wading in, 2.6 = the palace cooling at the farewell, 3.5 = the sun coming back).
export const MOOD = { beach: 0, dive: 1, palace: 2, ret: 3, gold: 4 };
const COAST = {   // [beach 0, return 3, gold 4]
  sky0: ["#1672e0", "#5a7498", "#4a48c0"], sky1: ["#35a0f2", "#7a92ae", "#c04f9c"], sky2: ["#78c8f6", "#9fb3c8", "#ff7438"], sky3: ["#c4ecf6", "#c4d0dc", "#ffc434"],
  sea0: ["#0a62c4", "#3a5678", "#5a36a4"], sea1: ["#0f9ccc", "#3c8492", "#b84a8e"], sea2: ["#1ccfc2", "#58aeb0", "#ff7e48"], sea3: ["#84ecd6", "#a2d4d0", "#ffcf6a"],
  seaInk: ["#0a4a9c", "#34465a", "#44207c"], foam: ["#ffffff", "#dde2e4", "#fff2cc"], foamS: ["#a9e6ea", "#b4c0c6", "#ffb478"],
  sand: ["#fff1d0", "#c6cacb", "#ffbe6e"], sandS: ["#efcf92", "#9ca6ac", "#ee8648"], sandW: ["#dcc088", "#8c9592", "#d65e4c"], sandL: ["#fffbee", "#dadfe2", "#ffe09a"],
  rock: ["#4c5080", "#5a646f", "#7c2e6c"], rockS: ["#2d2f58", "#3c444f", "#4a1a56"], rockL: ["#8088b8", "#838e98", "#d0567a"],
  pine: ["#0c5a48", "#42564e", "#15384a"], pineL: ["#22a062", "#667b6e", "#2e7058"], trunk: ["#3a2742", "#494550", "#421a40"], trunkL: ["#8a5258", "#777079", "#b84a40"],
  hill: ["#2a9a94", "#7c8d98", "#a23e80"], hill2: ["#5ab8c8", "#98a6b0", "#d0607a"], cloud: ["#ffffff", "#d6dade", "#ffb270"], cloudS: ["#b4def4", "#b2bbc5", "#f2607c"], sun: ["#fff7c4", "#e6e7e0", "#fff2a4"],
  wood: ["#cc8c4c", "#8f8a85", "#e27c3c"], woodS: ["#8c5432", "#636067", "#9c403c"], woodL: ["#eab674", "#aaa69d", "#ffb454"],
  thatch: ["#e2b252", "#9c9684", "#f29c3c"], thatchS: ["#aa7a30", "#6f6c62", "#b25a30"], moss: ["#58ac3c", "#9ad27c", "#8c9c3c"], mossS: ["#2f7a3a", "#4f9460", "#5a6c34"],
  stone: ["#aaabba", "#8e969b", "#ca8c8c"], stoneS: ["#74768e", "#636c73", "#8a5072"], tile: ["#3a4c7e", "#55606c", "#5c306c"], tileL: ["#6a80b4", "#7c8894", "#a0508a"], plaster: ["#f6eedb", "#c5c7c3", "#ffca92"], plasterS: ["#d2c4b2", "#a2a6a6", "#e88a6a"],
};
const DEEP = {    // [dive 1, palace 2, palace gone sad 3]
  w0: ["#3ab8f4", "#2c8ee4", "#7090b0"], w1: ["#1676e4", "#1a62d2", "#587a9e"], w2: ["#0d44c6", "#1240b2", "#44628a"], w3: ["#0a2494", "#0c2a8c", "#324a70"], w4: ["#070f5a", "#081a62", "#223654"],
  shaft: ["#c4f2ff", "#ffeab4", "#cad8e6"], wInk: ["#06104a", "#081250", "#1a2a44"],
  lac: ["#e23c2c", "#ea3420", "#a85c5a"], lacS: ["#a8202c", "#a6162a", "#74424c"], lacL: ["#ff6c4c", "#ff7040", "#c8827a"],
  gold: ["#f2c244", "#ffc832", "#c8b47c"], goldS: ["#c2822c", "#da8a20", "#96886a"], goldL: ["#fff0a0", "#fff2a4", "#e6dcb8"],
  jade: ["#20c2a2", "#1aba96", "#70a89c"], jadeS: ["#0f8282", "#0e807a", "#4a7a78"], jadeL: ["#7af0d0", "#84f2d2", "#a8ccc2"],
  coral: ["#ff5a6c", "#ff4e60", "#b87c86"], coralS: ["#c8304f", "#c22a4a", "#8a5668"], coralP: ["#ff9ca2", "#ffa4a4", "#d0aaae"], coralO: ["#ff8c3c", "#ff8c2c", "#c09c7c"],
  pwall: ["#ff6e58", "#ff7256", "#aa8482"], pwallS: ["#d8404c", "#dc4048", "#866068"], pwallL: ["#ffa078", "#ffa678", "#c8a49c"],
  floor: ["#0f607c", "#0e6c74", "#3e6672"], floorS: ["#0a4062", "#0a4a5c", "#2e4c5c"], floorL: ["#1f90a2", "#22a698", "#608c8c"],
  kelp: ["#0f906c", "#10a072", "#4e8272"], kelpS: ["#0a605c", "#0a6a5a", "#34585c"], bed: ["#1a34a8", "#102070", "#283a5c"], bedS: ["#0e1e74", "#0a144c", "#1a2840"],
};
const VIG = ["#0a4a8a", "#020830", "#5a0a2a", "#2a3038", "#7a1a3a"];
export const ACC = { cord: "#e8321e", cordS: "#a81a22", lacquer: "#17131f", lacquerL: "#3a3250", gold: "#f2b82e", smoke: "#f6f3ea", smokeS: "#cfd0e6" };
export const M = {};
let MV = 0, UID = 0;
export function resetIds() { UID = 0; }
const seg = (arr, xs, m) => { for (let i = 1; i < xs.length; i++) if (m <= xs[i]) return mix(arr[i - 1], arr[i], (m - xs[i - 1]) / (xs[i] - xs[i - 1])); return arr[arr.length - 1]; };
export function mood(m = 0) {
  if (typeof m === "string") m = MOOD[m];
  MV = Math.max(0, Math.min(4, m));
  for (const k in COAST) M[k] = seg(COAST[k], [0, 3, 4], MV);
  for (const k in DEEP) M[k] = seg(DEEP[k], [1, 2, 3], MV);
  M.vig = seg(VIG, [0, 1, 2, 3, 4], MV);
  PAL.sea = { sky: [M.sky0, M.sky1, M.sky2, M.sky3, M.sky3], fog: M.sea1, fogC: M.sky3, hills: [M.hill, M.hill2], pag: [M.hill, M.hill2], moon: false, stars: false };
  return M;
}
mood(0);
const wDive = () => clamp(1 - Math.abs(MV - 1)), wRet = () => clamp(1 - Math.abs(MV - 3)), wGold = () => clamp(MV - 3);
export function defs() {
  return baseDefs("sea") + `<defs>
  <style>.sk path:not([stroke]), .sk ellipse:not([stroke]), .sk circle:not([stroke]), .sk polygon:not([stroke]), .sk rect:not([stroke]) { stroke: ${INK}; stroke-width: 0.6; stroke-linejoin: round; stroke-linecap: round; }</style>
  <filter id="wb" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="wbs" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="sat" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values="${n(1 - 0.25 * wRet())}"/></filter>
  <radialGradient id="vgs" cx="0.5" cy="0.5" r="0.8"><stop offset="0.55" stop-color="${M.vig}" stop-opacity="0"/><stop offset="1" stop-color="${M.vig}" stop-opacity="0.42"/></radialGradient>
  <radialGradient id="softs"><stop offset="0" stop-color="${mix(M.vig, INK, 0.5)}" stop-opacity="0.5"/><stop offset="1" stop-color="${M.vig}" stop-opacity="0"/></radialGradient>
</defs>`;
}
// the return's washed colour: wrap whatever should lose its warmth (set + cast); draw the box after it to keep the cord red
export const wash = (svg) => wRet() > 0.02 ? `<g filter="url(#sat)">${svg}</g>` : svg;
// optional line boil for screen-space set layers (fine on held shots; on a camera move the wobble crawls a little)
export const boil = (svg) => `<g filter="url(#wbs)">${svg}</g>`;
export function grade() {
  let s = "";
  if (wDive() > 0.02) s += `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#b4d6ff", wDive())}" style="mix-blend-mode:multiply"/>`;
  if (wRet() > 0.02) s += `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#d6dfea", wRet())}" style="mix-blend-mode:multiply"/>`;
  if (wGold() > 0.02) s += `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#ffe0c0", wGold())}" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="#ff7a1a" opacity="${n(wGold() * 0.13)}" style="mix-blend-mode:screen"/>`;
  return s;
}
export const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vgs)"/>`;
const shadow = (p, w) => `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(w * p.s)}" ry="${n(w * 0.2 * p.s)}" fill="url(#softs)"/>`;

// ---------------------------------------------------------------- the coast: sky, sea, shore, sand
const horizon = (c) => P(c, 0, 0, 4000).y;
function cumulus(x, y, w, seed) {
  let d = `M${n(x)},${n(y)}`, d2 = "", cx = x; const rs = [];
  for (let i = 0, left = w; left > w * 0.08; i++) { const r = Math.min(left / 2, w * (0.09 + 0.1 * hash(seed + i))); rs.push(r); left -= r * 2; }
  rs.forEach((r, i) => { d += ` a${n(r)},${n(r * (0.8 + 0.5 * Math.sin((i + 0.5) / rs.length * Math.PI)))} 0 0 1 ${n(r * 2)},0`; cx += r * 2; });
  d += ` q${n(-(cx - x) / 2)},${n(w * 0.05)} ${n(-(cx - x))},0 Z`;
  let ax = x + rs[0] * 1.2;
  rs.slice(1, -1).forEach((r, i) => { d2 += `M${n(ax)},${n(y - r * 0.5)} a${n(r * 0.8)},${n(r * 0.7)} 0 0 1 ${n(r * 1.3)},${n(-r * 0.1)} `; ax += r * 2; });
  return `<path d="${d}" fill="${M.cloudS}" transform="translate(0,${n(w * 0.035)})"/><path d="${d}" fill="${M.cloud}" stroke="${M.cloudS}" stroke-width="2"/>${ln(d2, M.cloudS, 2.4)}`;
}
// o: { sun: [x, y, r] screen px or false, clouds: true }
export function sky(c, t, o = {}) {
  const hy = horizon(c);
  let s = `<rect width="${W}" height="${H}" fill="${M.sky0}"/>`;
  [0.34, 0.62, 0.84].forEach((f, i) => { s += band(wline(hy * f, 11 + i, 18, 150), M["sky" + (i + 1)]); });
  if (o.sun !== false) {
    const [sx, sy, sr] = o.sun || [800, hy * 0.26, 62];
    s += flat(ring(sx, sy, sr * 2.5, 5, 0.06), M.sun, `opacity="0.14"`) + flat(ring(sx, sy, sr * 1.65, 9, 0.06), M.sun, `opacity="0.26"`) + flat(ring(sx, sy, sr, 3, 0.02, 20), M.sun);
  }
  if (o.clouds !== false) for (let i = 0; i < 5; i++) {
    const w = 190 + 230 * hash(i + 4), x = ((hash(i + 13) * 1500 + t * (5 + 4 * hash(i)) - c.x * 14) % 1600) - 330, y = hy * (0.2 + 0.62 * hash(i + 21)) + (i === 0 ? hy * 0.2 : 0);
    s += cumulus(x, Math.min(y, hy - 30), w, i * 7 + 3);
  }
  for (let i = 0; i < 4; i++) { const x = 260 + i * 150 + 90 * hash(i + 60) + Math.sin(t * 0.5 + i) * 30, y = hy * (0.42 + 0.2 * hash(i + 70)), w = 12 + 8 * hash(i + 80), fl = Math.sin(t * 5 + i * 2) * 4;
    s += ln(`M${n(x - w)},${n(y - fl)} Q${n(x - w * 0.4)},${n(y - 8)} ${n(x)},${n(y)} Q${n(x + w * 0.4)},${n(y - 8)} ${n(x + w)},${n(y - fl)}`, INK, 2); }
  return s;
}
const SHORE = 9.3;
export const shoreZ = (X) => SHORE + 0.5 * Math.sin(X * 0.62 + 1) + 0.22 * Math.sin(X * 1.9 + 0.4);
const waterZ = (X, t) => shoreZ(X) + 0.42 * Math.sin(t * 0.85 + X * 0.3) + 0.1 * Math.sin(X * 3.1 + t * 0.4);
const shoreLine = (c, f, x0 = -22, x1 = 22, step = 0.4) => { const a = []; for (let X = x0; X <= x1; X += step) a.push(P(c, X, 0, Math.max(c.z + NEAR, f(X)))); return a; };
export function sea(c, t, o = {}) {
  const hy = horizon(c);
  let s = `<rect x="-40" y="${n(hy)}" width="${W + 80}" height="${H}" fill="${M.sea0}"/>`;
  [[46, "sea1", 5], [22, "sea2", 7], [13.2, "sea3", 9]].forEach(([Z, k, am], i) => { s += band(wline(P(c, 0, 0, Z).y, 31 + i, am, 100), M[k]); });
  for (let r = 0, Z = 11; r < 16; r++, Z *= 1.2) for (let j = 0; j < 8; j++) {
    const id = r * 23 + j, X = c.x + (hash(id) - 0.5) * Z * 1.5 + Math.sin(t * 0.6 + id) * 0.25, p = P(c, X, 0, Z + hash(id + 5) * Z * 0.15);
    if (Z < shoreZ(X) + 1.2) continue;
    const len = Math.max(7, (0.25 + 0.5 * hash(id + 9)) * p.s), h = Math.max(1.4, 0.05 * p.s), w = Math.max(1.2, Math.min(4, 0.022 * p.s));
    s += ln(`M${n(p.x - len)},${n(p.y)} q${n(len * 0.5)},${n(-h)} ${n(len)},0 q${n(len * 0.5)},${n(h)} ${n(len)},0`, id % 3 === 0 ? M.foam : M.seaInk, w, `opacity="${id % 3 === 0 ? 0.85 : 0.5}"`);
  }
  if (o.glitter) { const [gx] = o.glitter; for (let i = 0; i < 26; i++) { const Z = 12 + i * i * 0.22, p = P(c, 0, 0, Z), x = gx + jit(i + 300, 16 + 500 / Z) , on = Math.sin(t * 3 + i * 1.7) > -0.3; if (on) s += ln(`M${n(x - 6 - 60 / Z * 4)},${n(p.y)} h${n(12 + 500 / Z)}`, M.sun, Math.max(1.5, 26 / Z), `opacity="0.85"`); } }
  return s;
}
function shell(b, kind, seed) {
  const k = b.k, x = b.p.x, y = b.p.y, r = k * 0.045, rot = jit(seed, 60), lw = Math.max(0.6, b.lw * 0.7), cols = ["#ffd9c4", "#fff6e6", "#ffb8a8", "#e8d6f4"], col = cols[seed % 4];
  let g = "";
  if (kind === 0) {       // scallop: fan + ribs
    g = shp(`M0,${n(r * 0.75)} L${n(-r * 0.35)},${n(r * 0.75)} L${n(-r * 0.3)},${n(r * 0.45)} Q${n(-r * 1.25)},${n(-r * 0.2)} ${n(-r * 0.7)},${n(-r * 0.8)} Q0,${n(-r * 1.25)} ${n(r * 0.7)},${n(-r * 0.8)} Q${n(r * 1.25)},${n(-r * 0.2)} ${n(r * 0.3)},${n(r * 0.45)} L${n(r * 0.35)},${n(r * 0.75)} Z`, col, lw);
    for (let i = -3; i <= 3; i++) g += ln(`M0,${n(r * 0.5)} L${n(i * r * 0.27)},${n(-r * (0.95 - Math.abs(i) * 0.09))}`, "#c8806a", lw * 0.7);
  } else if (kind === 1) { // turban snail: cone + spiral
    g = shp(`M${n(-r)},${n(r * 0.5)} Q${n(-r * 0.9)},${n(-r * 0.3)} ${n(r * 0.9)},${n(-r * 0.9)} Q${n(r * 0.6)},${n(r * 0.6)} ${n(-r * 0.2)},${n(r * 0.8)} Z`, col, lw) + ln(`M${n(-r * 0.6)},${n(r * 0.55)} Q${n(-r * 0.3)},${n(-r * 0.1)} ${n(-r * 0.1)},${n(r * 0.7)} M${n(-r * 0.05)},${n(-r * 0.2)} Q${n(r * 0.2)},${n(-r * 0.1)} ${n(r * 0.3)},${n(r * 0.45)} M${n(r * 0.45)},${n(-r * 0.6)} Q${n(r * 0.6)},${n(-r * 0.4)} ${n(r * 0.62)},${n(-r * 0.05)}`, "#b06a7a", lw * 0.8);
  } else if (kind === 2) { // clam, open pair
    g = shp(`M0,0 Q${n(-r * 1.3)},${n(-r * 0.2)} ${n(-r * 1.1)},${n(-r * 0.9)} Q${n(-r * 0.3)},${n(-r * 1.1)} 0,0 Z`, col, lw) + shp(`M0,0 Q${n(r * 1.3)},${n(-r * 0.1)} ${n(r * 1.15)},${n(-r * 0.8)} Q${n(r * 0.4)},${n(-r * 1.15)} 0,0 Z`, "#fff6e6", lw) + ln(`M${n(-r * 0.3)},${n(-r * 0.3)} Q${n(-r * 0.8)},${n(-r * 0.4)} ${n(-r * 0.9)},${n(-r * 0.75)}`, "#c8806a", lw * 0.7);
  } else {                // starfish
    const a = Array.from({ length: 10 }, (_, i) => { const an = i / 10 * Math.PI * 2, rr = r * (i % 2 ? 0.42 : 1.25) * (1 + jit(seed + i, 0.12)); return `${n(Math.cos(an) * rr)},${n(Math.sin(an) * rr * 0.6)}`; });
    g = shp(`M${a.join(" L")} Z`, "#ff7a4a", lw) + [0, 2, 4, 6, 8].map((i) => `<circle cx="${n(Math.cos(i / 10 * 6.283) * r * 0.5)}" cy="${n(Math.sin(i / 10 * 6.283) * r * 0.3)}" r="${n(r * 0.07)}" fill="#ffd0a0"/>`).join("");
  }
  return `<ellipse cx="${n(x + r * 0.2)}" cy="${n(y + r * 0.25)}" rx="${n(r * 1.1)}" ry="${n(r * 0.3)}" fill="${M.sandS}" opacity="0.7"/><g transform="translate(${n(x)},${n(y)}) rotate(${n(kind === 3 ? 0 : rot * 0.4)})">${g}</g>`;
}
const SHELLS = [[-1.5, 3.3, 0], [0.9, 3.0, 1], [1.7, 4.0, 2], [-0.9, 5.3, 3], [2.4, 5.6, 0], [-2.6, 4.6, 1], [0.5, 6.4, 0], [-1.9, 6.9, 2], [3.3, 7.2, 1], [1.3, 7.7, 3], [-3.4, 6.1, 0], [-0.3, 2.3, 2], [1.5, 2.2, 0], [-0.25, 7.9, 1], [3.9, 4.4, 2], [-4.2, 3.6, 3]];
export function shore(c, t, o = {}) {
  const wl = shoreLine(c, (X) => waterZ(X, t)), dl = shoreLine(c, (X) => shoreZ(X) - 0.95 - 0.18 * Math.sin(X * 2.3));
  let s = band(wl, M.sandW);
  s += band(shoreLine(c, (X) => waterZ(X, t) - 0.38), mix(M.sandW, M.sea3, 0.35));
  // foam lace: a scalloped band on the waterline, holes cut in it, two broken lines further out
  const far = [], near = [];
  for (let X = -22, i = 0; X <= 22; X += 0.22, i++) { const z = waterZ(X, t); far.push(P(c, X, 0, z + 0.2 + (i % 2 ? 0.16 : 0) + jit(i + 900, 0.05))); near.push(P(c, X, 0, Math.max(c.z + NEAR, z - 0.1 - (i % 3 === 0 ? 0.12 : 0)))); }
  s += flat(`M${pt(far[0])} ` + far.slice(1).map((p, i) => `Q${n((far[i].x + p.x) / 2)},${n((far[i].y + p.y) / 2 - (i % 2 ? 0.05 : 0.02) * p.s)} ${pt(p)}`).join(" ") + " L" + near.reverse().map(pt).join(" L") + " Z", M.foam, `transform="translate(0,${n(0.03 * far[50].s)})" opacity="0.9"`).replace(M.foam, M.foamS);
  s += `<path d="M${pt(far[0])} ` + far.slice(1).map((p, i) => `Q${n((far[i].x + p.x) / 2)},${n((far[i].y + p.y) / 2 - (i % 2 ? 0.05 : 0.02) * p.s)} ${pt(p)}`).join(" ") + " L" + near.map(pt).join(" L") + ` Z" fill="${M.foam}"/>`;
  for (let i = 0; i < 150; i++) { const X = -15 + i * 0.2 + jit(i + 40, 0.07), z = waterZ(X, t) + 0.05 + 0.12 * hash(i + 77), p = P(c, X, 0, z), r = (0.012 + 0.022 * hash(i + 5)) * p.s; if (r > 0.7) s += `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(r * 1.5)}" ry="${n(r * 0.6)}" fill="${M.sea3}"/>`; }
  for (const [off, dash, op] of [[0.95, 0.5, 0.9], [2.1, 0.32, 0.7]]) for (let X = -18, i = 0; X < 18; X += 0.7, i++) { if (hash(i + off * 50) < 0.3) continue; const z = waterZ(X, t * 1 + off) + off, a = P(c, X, 0, z), b2 = P(c, X + dash + 0.3 * hash(i), 0, z + jit(i, 0.05)); s += ln(`M${pt(a)} Q${n((a.x + b2.x) / 2)},${n(a.y - 0.03 * a.s)} ${pt(b2)}`, M.foam, Math.max(1.2, 0.03 * a.s), `opacity="${op}"`); }
  s += band(dl, M.sand);
  // ripples, light scuffs, pebbles
  for (let r = 0, Z = Math.max(1.2, c.z + 0.7); Z < 8.2; r++, Z += 0.2 + Z * 0.035) for (let j = 0; j < 9; j++) {
    const id = r * 19 + j + 500, X = c.x + (hash(id) - 0.5) * (4 + Z * 1.3); if (Z > shoreZ(X) - 1.15) continue;
    const p = P(c, X, 0, Z), len = (0.12 + 0.3 * hash(id + 3)) * p.s, hh = 0.015 * p.s;
    s += ln(`M${n(p.x - len)},${n(p.y)} q${n(len * 0.5)},${n(-hh * 2)} ${n(len)},0 q${n(len * 0.5)},${n(hh * 2)} ${n(len)},0`, id % 4 === 0 ? M.sandL : M.sandS, Math.max(1, 0.012 * p.s), `opacity="${n(0.5 + 0.4 * hash(id + 8))}"`);
    if (id % 5 === 0) { const q = P(c, X + 0.3, 0, Z + 0.07); s += flat(ring(q.x, q.y, 0.014 * q.s, id, 0.3, 7, 0.6), id % 2 ? M.rock : M.stone); }
  }
  // the wrack line: seaweed and bits where the last high wave stopped
  for (let i = 0; i < 26; i++) { const X = -9 + i * 0.72 + jit(i + 61, 0.25), Z = shoreZ(X) - 1.05 + jit(i + 62, 0.12); if (!vis(c, Z) || hash(i + 63) < 0.35) continue; const p = P(c, X, 0, Z), k = p.s;
    s += ln(`M${n(p.x)},${n(p.y)} q${n(0.06 * k)},${n(-0.03 * k)} ${n(0.13 * k)},${n(0.005 * k)} q${n(0.05 * k)},${n(0.03 * k)} ${n(0.12 * k)},${n(-0.01 * k)} M${n(p.x + 0.07 * k)},${n(p.y - 0.01 * k)} q${n(0.02 * k)},${n(-0.04 * k)} ${n(0.07 * k)},${n(-0.035 * k)}`, i % 3 ? M.pine : M.rockS, Math.max(1.2, 0.016 * k)); }
  if (o.shells !== false) for (const [i, [X, Z, kind]] of SHELLS.entries()) if (vis(c, Z + 0.3)) s += shell(board(c, X, 0, Z), kind, i * 3 + 1);
  return s;
}

// ---------------------------------------------------------------- rocks, pines, boat
export function rock(c, o = {}) {
  const { X = 3, Z = 12, w = 2, h = 1.4, seed = 1, wet = false, t = 0 } = o;
  if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z), N = 9, a = [];
  for (let i = 0; i <= N; i++) { const an = i / N * Math.PI; a.push([Math.cos(an) * w / 2 * (0.82 + 0.3 * hash(seed * 9 + i)), Math.sin(an) ** 0.75 * h * (0.75 + 0.35 * hash(seed * 13 + i)) * (i === 0 || i === N ? 0 : 1)]); }
  const top = a.reduce((m, q) => q[1] > m[1] ? q : m, a[0]), ti = a.indexOf(top);
  let s = shp(hd(b, a, seed, w * 0.012, w * 0.16), M.rock, b.lw);
  s += flat(hd(b, [...a.slice(0, ti + 1), [top[0] + w * 0.1, top[1] * 0.55], [top[0] + w * 0.22, top[1] * 0.3], [w * 0.2, 0]], seed + 3, w * 0.01, w * 0.2), M.rockS);
  s += flat(hd(b, [a[ti + 1] || top, a[Math.min(N, ti + 2)], [a[Math.min(N, ti + 2)][0] + w * 0.12, a[Math.min(N, ti + 2)][1] * 0.6], [top[0] - w * 0.1, top[1] * 0.75]], seed + 5, w * 0.008, w * 0.2), M.rockL, `opacity="0.75"`);
  for (let i = 0; i < 4; i++) { const x = jit(seed * 5 + i, w * 0.3), y = h * (0.2 + 0.45 * hash(seed + i * 3)); s += ln(`M${b.pt(x, y)} L${b.pt(x + jit(i + seed, 0.1 * w), y - 0.14 * h)} L${b.pt(x + jit(i + seed + 2, 0.12 * w), y - 0.3 * h)}`, INK, b.lw * 0.7, `opacity="0.7"`); }
  for (let i = 0; i < 12; i++) { const x = jit(seed * 7 + i, w * 0.4), y = h * 0.06 + hash(seed + i * 11) * h * 0.16; s += `<circle cx="${n(b.x(x))}" cy="${n(b.y(y))}" r="${n(Math.max(0.8, 0.018 * b.k))}" fill="${M.foam}" stroke="${INK}" stroke-width="${n(b.lw * 0.4)}"/>`; }
  if (wet) for (let i = 0; i < 9; i++) { const x = -w * 0.6 + i * w * 0.15 + 0.04 * Math.sin(t * 1.3 + i), r = w * (0.07 + 0.04 * hash(seed + i + 40)); s += `<path d="M${b.pt(x - r, 0)} A${n(r * b.k)},${n(r * 0.5 * b.k)} 0 0 1 ${b.pt(x + r, 0)} Z" fill="${M.foam}" stroke="${M.foamS}" stroke-width="${b.lw}"/>`; }
  return s;
}
// a crooked black pine. o: { X, Z, h (m), seed, lean (-1..1), giant 0|1 (fat old trunk, more pads), t }
export function pine(c, o = {}) {
  const { X = 2.8, Z = 7.2, h = 4.8, seed = 1, lean = 0.22, giant = 0, t = 0 } = o;
  if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z), lw = b.lw;
  const cx = (u) => h * (lean * u + 0.11 * Math.sin(u * 5.1 + seed) * u + 0.045 * Math.sin(u * 11 + seed * 2.3) * u);
  const wd = (u) => h * lerp(giant ? 0.075 : 0.042, 0.011, u ** 0.7) * (u < 0.06 ? 1.5 - u * 8 : 1);
  const L = [], R = [], NN = 16;
  for (let i = 0; i <= NN; i++) { const u = i / NN; L.push([cx(u) - wd(u) + jit(seed * 3 + i, wd(u) * 0.15), u * h]); R.push([cx(u) + wd(u) + jit(seed * 5 + i, wd(u) * 0.15), u * h]); }
  const dT = (a) => "M" + a.map((q) => b.pt(q[0], q[1])).join(" L");
  let trunk = shp(dT([...L, ...R.slice().reverse()]) + " Z", M.trunk, lw);
  trunk += flat(dT([...L.map((q, i) => [lerp(q[0], R[i][0], 0.08), q[1]]), ...L.map((q, i) => [lerp(q[0], R[i][0], 0.34 + 0.12 * Math.sin(i * 1.7)), q[1]]).reverse()]) + " Z", M.trunkL, `opacity="0.8"`);
  for (let i = 0, nb = giant ? 90 : 30; i < nb; i++) {     // bark plates, one by one
    const u = 0.02 + hash(seed * 17 + i) * 0.9, v = jit(seed * 19 + i, 0.75), x = cx(u) + v * wd(u), y = u * h, l = h * (0.012 + 0.02 * hash(i + seed)) * (giant ? 0.7 : 1), dx = (cx(u + 0.02) - cx(u)) * (l / (0.02 * h));
    trunk += ln(`M${b.pt(x, y)} L${b.pt(x + dx + jit(i, 0.004 * h), y + l)}`, v > 0.35 ? INK : mix(M.trunk, INK, 0.6), lw * (0.7 + 0.8 * hash(i + 3)), `opacity="${v < -0.3 ? 0.45 : 0.8}"`);
  }
  if (giant) for (let i = 0; i < 5; i++) { const x = jit(seed + i * 9, 0.09 * h); trunk += shp(hd(b, [[x - 0.03 * h, 0], [x - 0.01 * h, 0.05 * h + 0.02 * h * hash(i)], [x + 0.03 * h, 0.03 * h], [x + 0.06 * h, 0]], seed + i, 0.004 * h), M.trunk, lw); }
  // a needle pad: flat underside, a row of mounds, every mound bristling with its own needles
  const pad = (px, py, w, sd) => {
    px += Math.sin(t * 1.1 + sd) * 0.006 * h;
    const m = w > h * 0.3 ? 6 : 5, parts = [], dk = mix(M.pine, INK, 0.5);
    for (let i = 0; i < m; i++) { const f = (i + 0.5) / m, r = w * (0.17 + 0.08 * Math.sin(f * Math.PI)) * (0.85 + 0.3 * hash(sd + i * 3)); parts.push([px - w / 2 + f * w + jit(sd + i, w * 0.03), r, r * (0.55 + 0.4 * Math.sin(f * Math.PI)) * (0.85 + 0.3 * hash(sd + i * 5))]); }
    const half = ([x, r, ry], f = 1, dx = 0, dy = 0) => `M${b.pt(x + dx - r * f, py + dy)} A${n(r * f * b.k)},${n(ry * f * b.k)} 0 0 1 ${b.pt(x + dx + r * f, py + dy)} Z`;
    let s = "";
    for (const [i, [x, r, ry]] of parts.entries()) for (let j = 0; j < 12; j++) { const an = Math.PI * (0.04 + 0.92 * (j + hash(sd + i * 13 + j) * 0.6) / 12), nl = w * (0.035 + 0.03 * hash(sd + i * 7 + j)); s += ln(`M${b.pt(x + Math.cos(an) * r * 0.9, py + Math.sin(an) * ry * 0.9)} L${b.pt(x + Math.cos(an) * (r + nl), py + Math.sin(an) * (ry + nl))}`, dk, lw * 0.9); }
    s += parts.map((q) => `<path d="${half(q)}" fill="${M.pine}" stroke="${INK}" stroke-width="${n(lw * 2)}" stroke-linejoin="round"/>`).join("") + parts.map((q) => flat(half(q), M.pine)).join("");
    s += parts.map((q, i) => flat(half(q, 0.62, -q[1] * 0.16, q[2] * 0.3), i % 2 ? M.pineL : mix(M.pineL, M.pine, 0.35))).join("");
    for (const [i, [x, r, ry]] of parts.entries()) for (let j = 0; j < 3; j++) { const fx2 = x + jit(sd + i * 9 + j, r * 0.6), fy = py + ry * (0.12 + 0.4 * hash(sd + i * 11 + j)), u2 = w * 0.03; s += ln(`M${b.pt(fx2 - u2, fy + u2 * 1.1)} L${b.pt(fx2, fy)} L${b.pt(fx2 + u2 * 1.1, fy + u2)} M${b.pt(fx2, fy)} L${b.pt(fx2 + u2 * 0.1, fy + u2 * 1.5)}`, dk, lw * 0.7, `opacity="0.85"`); }
    return s + ln(`M${b.pt(px - w * 0.56, py)} L${b.pt(px + w * 0.56, py + jit(sd, w * 0.01))}`, INK, lw * 1.1);
  };
  let back = "", front = "";
  for (let j = 0, nb = giant ? 10 : 6; j < nb; j++) {
    const u = lerp(giant ? 0.5 : 0.4, 0.97, j / (nb - 1)), side = (j + seed) % 2 ? 1 : -1, len = h * (0.44 - 0.27 * u) * (0.8 + 0.5 * hash(seed * 7 + j)), x0 = cx(u), y0 = u * h, x1 = x0 + side * len, y1 = y0 + len * (0.05 + 0.3 * hash(seed + j * 5));
    const d = `M${b.pt(x0, y0)} Q${b.pt(x0 + side * len * 0.35, y0 + len * 0.42)} ${b.pt(x0 + side * len * 0.62, y0 + len * 0.16)} T${b.pt(x1, y1)}`, bw = Math.max(1.5, wd(u) * 0.6 * b.k);
    const br = ln(d, INK, bw + lw * 1.6) + ln(d, M.trunk, bw) + pad(x0 + side * len * 0.5, y0 + len * 0.3, len * 0.8, seed * 11 + j) + pad(x1, y1, len * (0.95 + 0.3 * hash(j + seed)), seed * 13 + j);
    if (hash(seed * 3 + j) < 0.4) back += br; else front += br;
  }
  const top = pad(cx(1), h * 1.0, h * 0.26, seed * 29);
  return shadow(b.p, 0.1 * h) + back + trunk + front + top;
}
// the small wooden boat pulled up on the sand. o: { X, Z, dir 1|-1 (bow), size, net: true }
export function boat(c, o = {}) {
  const { X = -2.3, Z = 7.5, dir = 1, size = 1 } = o;
  if (!vis(c, Z)) return "";
  const b0 = board(c, X, 0, Z, size), b = { ...b0, x: (x) => b0.p.x + dir * x * b0.k, pt: (x, y) => `${n(b0.p.x + dir * x * b0.k)},${n(b0.p.y - y * b0.k)}` }, lw = b.lw;
  const top = [[-1.78, 0.6], [-1.0, 0.5], [0, 0.47], [0.9, 0.55], [1.5, 0.72], [2.02, 1.02]], bot = [[1.74, 0.6], [1.32, 0.2], [0.6, 0.05], [-0.6, 0.03], [-1.46, 0.09], [-1.66, 0.32]];
  let s = `<ellipse cx="${n(b.x(0))}" cy="${n(b.p.y)}" rx="${n(1.9 * b.k)}" ry="${n(0.12 * b.k)}" fill="${M.sandS}"/>`;
  s += `<g transform="rotate(${n(-4 * dir)} ${n(b.p.x)} ${n(b.p.y)})">`;
  s += shp(hd(b, [...top.map(([x, y]) => [x - 0.04, y + 0.12 + (x > 1.4 ? 0.04 : 0)]), ...top.slice().reverse()], 4, 0.008, 0.5), M.woodS, lw);
  s += shp(hd(b, [...top, ...bot], 2, 0.01, 0.4), M.wood, lw);
  s += flat(hd(b, [[-1.66, 0.32], [-0.6, 0.26], [0.6, 0.27], [1.36, 0.4], [1.74, 0.6], ...bot.slice(1)], 6, 0.01, 0.4), M.woodS, `opacity="0.75"`);
  for (const off of [0.15, 0.3]) s += ln("M" + top.map(([x, y], i) => b.pt(x * (1 - off * 0.2), y - off * (1 + i * 0.12) + jit(i + off * 40, 0.006))).join(" L"), INK, lw * 0.8);
  for (let i = 0; i < 26; i++) { const x = -1.6 + i * 0.13 + jit(i + 7, 0.04), y = 0.12 + 0.36 * hash(i + 31) + Math.max(0, x - 0.9) * 0.25, l = 0.1 + 0.2 * hash(i + 9); s += ln(`M${b.pt(x, y)} q${n(l * 0.5 * b.k * dir)},${n(-0.012 * b.k)} ${n(l * b.k * dir)},${n(-jit(i, 0.01) * b.k)}`, i % 4 === 0 ? M.woodL : mix(M.woodS, INK, 0.3), lw * 0.6, `opacity="0.7"`); }
  for (let i = 0; i < 9; i++) { const x = -1.5 + i * 0.4; s += `<circle cx="${n(b.x(x))}" cy="${n(b.y(0.4 + Math.max(0, x - 0.6) ** 2 * 0.14))}" r="${n(Math.max(0.8, 0.012 * b.k))}" fill="${INK}"/>`; }
  s += shp(hd(b, [[1.62, 0.5], [2.02, 1.02], [2.1, 1.16], [1.98, 1.14], [1.52, 0.55]], 9, 0.006), M.trunk, lw);                        // bow post
  s += shp(hd(b, [[-1.84, 0.66], [-1.72, 0.66], [-1.6, 0.3], [-1.7, 0.28]], 11, 0.006), M.woodS, lw);                                        // transom
  for (const [x, col] of [[-0.9, M.woodL], [0.35, M.woodL]]) s += shp(hd(b, [[x, 0.6], [x + 0.16, 0.6], [x + 0.14, 0.51], [x + 0.02, 0.5]], 13 + x, 0.005), col, lw);  // thwarts
  if (o.net !== false) {     // the net thrown over the stern, knot by knot
    const A = [[-1.5, 0.66], [-0.55, 0.6], [-0.42, 0.3], [-0.62, 0.1], [-1.42, 0.12], [-1.6, 0.4]];
    s += shp(hd(b, A, 21, 0.02, 0.15), mix(M.wood, M.sea1, 0.55), lw, `opacity="0.92"`);
    for (let i = 0; i < 9; i++) s += ln(`M${b.pt(-1.5 + i * 0.12, 0.63)} L${b.pt(-1.42 + i * 0.12 + 0.1, 0.13)}`, INK, lw * 0.45, `opacity="0.7"`) + ln(`M${b.pt(-0.5 - i * 0.12, 0.6)} L${b.pt(-0.62 - i * 0.12 - 0.08, 0.12)}`, INK, lw * 0.45, `opacity="0.7"`);
    for (const [x, y] of [[-1.25, 0.3], [-0.8, 0.22]]) s += `<circle cx="${n(b.x(x))}" cy="${n(b.y(y))}" r="${n(0.055 * b.k)}" fill="${M.jade || "#1aba96"}" stroke="${INK}" stroke-width="${lw}"/><path d="M${b.pt(x - 0.03, y + 0.02)} q${n(0.02 * b.k)},${n(-0.03 * b.k)} ${n(0.05 * b.k)},${n(-0.02 * b.k)}" stroke="#fff" stroke-width="${lw}" fill="none"/>`;
  }
  s += ln(`M${b.pt(-1.9, 0.86)} L${b.pt(1.1, 0.58)}`, INK, 0.05 * b.k + lw * 1.4) + ln(`M${b.pt(-1.9, 0.86)} L${b.pt(1.1, 0.58)}`, M.woodL, 0.05 * b.k) + shp(hd(b, [[-1.9, 0.92], [-2.5, 1.02], [-2.52, 0.9], [-1.9, 0.8]], 15, 0.006), M.woodL, lw);   // oar
  s += `</g>`;
  // the mooring rope: bow to a stake, frayed end, a coil on the sand
  const rope = `M${b.pt(1.95, 0.9)} Q${b.pt(2.3, 0.1)} ${b.pt(2.75, 0.34)}`;
  s += ln(rope, INK, 0.03 * b.k + lw) + ln(rope, M.thatch, 0.03 * b.k) + ln(rope, M.thatchS, 0.012 * b.k, `stroke-dasharray="${n(0.03 * b.k)} ${n(0.035 * b.k)}"`);
  s += shp(hd(b, [[2.7, 0], [2.72, 0.46], [2.82, 0.47], [2.83, 0]], 17, 0.006), M.woodS, lw);
  for (let i = 0; i < 4; i++) s += ln(`M${b.pt(2.78, 0.34)} l${n((0.05 + 0.03 * i) * b.k * dir)},${n((0.05 + jit(i, 0.03)) * b.k)}`, M.thatch, lw);
  for (let i = 0; i < 3; i++) s += `<ellipse cx="${n(b.x(2.2))}" cy="${n(b.y(0.03 + i * 0.022))}" rx="${n((0.2 - i * 0.03) * b.k)}" ry="${n(0.05 * b.k)}" fill="none" stroke="${INK}" stroke-width="${n(0.03 * b.k + lw)}"/><ellipse cx="${n(b.x(2.2))}" cy="${n(b.y(0.03 + i * 0.022))}" rx="${n((0.2 - i * 0.03) * b.k)}" ry="${n(0.05 * b.k)}" fill="none" stroke="${M.thatch}" stroke-width="${n(0.03 * b.k)}"/>`;
  return s;
}
function farCoast(c) {
  const hy = horizon(c), px = -c.x * 5;
  const ridge = (x0, x1, hh, seed, col) => { const a = []; for (let i = 0; i <= 14; i++) { const u = i / 14; a.push(`${n(lerp(x0, x1, u) + px)},${n(hy - hh * Math.sin(u * Math.PI) ** 0.6 * (0.55 + 0.6 * hash(seed + i)))}`); } return `<path d="M${n(x0 + px)},${n(hy + 3)} L${a.join(" L")} L${n(x1 + px)},${n(hy + 3)} Z" fill="${col}"/>`; };
  let s = ridge(-200, 470, 120, 3, M.hill2) + ridge(720, 1000, 46, 8, M.hill2) + ridge(-260, 300, 78, 5, M.hill);
  for (let i = 0; i < 9; i++) { const x = -40 + i * 36 + px + jit(i + 20, 8), y = hy - 52 - 22 * Math.sin(i / 9 * 3) - 10 * hash(i + 2); s += ln(`M${n(x)},${n(y + 16)} l${n(jit(i, 3))},-16`, M.pine, 2) + flat(`M${n(x - 10)},${n(y)} q10,-9 20,0 q-10,3 -20,0 Z M${n(x - 6)},${n(y - 7)} q7,-7 14,0 Z`, M.pine); }
  return s;
}

// beach grass: every blade its own tapered stroke
export function grass(c, o = {}) {
  const { X = 2, Z = 1.5, size = 1, seed = 1, t = 0 } = o; if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z, size); let s = "";
  for (let i = 0; i < 17; i++) { const x0 = jit(seed * 7 + i, 0.22), l = 0.35 + 0.5 * hash(seed + i * 3), bendx = jit(seed + i * 5, 0.34) + Math.sin(t * 1.3 + i) * 0.03, w = 0.022 + 0.014 * hash(seed + i);
    s += `<path d="M${b.pt(x0 - w, 0)} Q${b.pt(x0 - w + bendx * 0.3, l * 0.6)} ${b.pt(x0 + bendx, l)} Q${b.pt(x0 + w + bendx * 0.3, l * 0.55)} ${b.pt(x0 + w, 0)} Z" fill="${[M.pineL, M.moss, mix(M.thatch, M.moss, 0.5)][i % 3]}" stroke="${INK}" stroke-width="${n(b.lw * 0.8)}" stroke-linejoin="round"/>`; }
  return s + flat(ring(b.x(0), b.y(0), 0.3 * b.k, seed, 0.2, 9, 0.22), M.sandS);
}
function driftwood(c, X, Z, seed = 1) {
  if (!vis(c, Z)) return ""; const b = board(c, X, 0, Z), lw = b.lw, col = mix(M.stone, M.sandL, 0.5);
  let s = `<ellipse cx="${n(b.x(0.05))}" cy="${n(b.y(0))}" rx="${n(0.85 * b.k)}" ry="${n(0.07 * b.k)}" fill="${M.sandS}"/>` + shp(hd(b, [[-0.8, 0.02], [-0.76, 0.16], [-0.2, 0.2], [0.1, 0.17], [0.34, 0.3], [0.44, 0.27], [0.3, 0.14], [0.78, 0.13], [0.82, 0.03]], seed, 0.01, 0.14), col, lw);
  s += flat(hd(b, [[-0.8, 0.02], [-0.78, 0.08], [0.8, 0.07], [0.82, 0.03]], seed + 2, 0.006, 0.2), mix(col, M.rockS, 0.4));
  for (let i = 0; i < 9; i++) { const x = -0.7 + i * 0.16; s += ln(`M${b.pt(x, 0.1 + jit(i + seed, 0.03))} q${n(0.06 * b.k)},${n(-0.012 * b.k)} ${n(0.12 * b.k)},${n(jit(i, 0.01) * b.k)}`, mix(col, INK, 0.5), lw * 0.6); }
  return s + `<ellipse cx="${n(b.x(-0.3))}" cy="${n(b.y(0.12))}" rx="${n(0.03 * b.k)}" ry="${n(0.022 * b.k)}" fill="none" stroke="${INK}" stroke-width="${n(lw * 0.7)}"/>` + shp(ring(b.x(-0.79), b.y(0.09), 0.065 * b.k, seed, 0.08, 9), mix(col, M.sandL, 0.5), lw) + ln(`M${b.pt(-0.81, 0.09)} q${n(0.02 * b.k)},${n(-0.02 * b.k)} ${n(0.04 * b.k)},0`, INK, lw * 0.6);
}
// footprints in the sand from [X0,Z0] to [X1,Z1]
export function prints(c, a, b2, small = false) {
  let s = ""; const N = Math.round(Math.hypot(b2[0] - a[0], b2[1] - a[1]) / (small ? 0.3 : 0.38));
  for (let i = 0; i < N; i++) { const u = i / N, X = lerp(a[0], b2[0], u) + (i % 2 ? 0.09 : -0.09), Z = lerp(a[1], b2[1], u); if (!vis(c, Z)) continue; const q = P(c, X, 0, Z), r = (small ? 0.06 : 0.08) * q.s;
    s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(r * 0.45)}" ry="${n(r * 0.42)}" fill="${M.sandS}" opacity="0.6"/><ellipse cx="${n(q.x + r * 0.05)}" cy="${n(q.y - r * 0.42)}" rx="${n(r * 0.4)}" ry="${n(r * 0.2)}" fill="${M.sandS}" opacity="0.6"/><path d="M${n(q.x - r * 0.45)},${n(q.y + r * 0.1)} q${n(r * 0.45)},${n(r * 0.5)} ${n(r * 0.9)},0" stroke="${mix(M.sandS, M.sandW, 0.6)}" stroke-width="${n(Math.max(1, r * 0.08))}" fill="none" opacity="0.7"/>`; }
  return s;
}
// ---------------------------------------------------------------- set (a): the beach, present day (also the fisherman's own shore)
export const BEACH = { kid: { X: -0.36, Z: 4.5 }, keeper: { X: 0.52, Z: 4.42 }, box: { X: 0.06, Y: 0, Z: 4.12 }, boat: { X: -2.5, Z: 7.4 }, pine: { X: 2.9, Z: 7.0 }, turtle: { X: 0.2, Z: 7.6 },
  cam: { wide: { x: 0, y: 1.55, z: -1.6, h0: 800 }, two: { x: 0.12, y: 0.78, z: 2.5, h0: 1010 }, faces: { x: 0.04, y: 0.98, z: 2.95, h0: 1020 }, box: { x: 0.1, y: 0.42, z: 2.9, h0: 1000 }, close: { x: 0.0, y: 1.03, z: 3.74, h0: 940 } },
  // head-and-shoulders two-shot: spread these into the hosts' states with cam.close (each face about 40 % of the frame width); draw the keeper first, the kid over her
  closeAt: { kid: { X: -0.15, Z: 4.5 }, keeper: { X: 0.2, Z: 4.62 } } };
// o: { sun, glitter, boat: true, shells: true, pines: true, prints: true }. Returns { back, front }: back, the cast and props, front.
export function beach(c, t, o = {}) {
  let back = sky(c, t, o) + farCoast(c) + sea(c, t, o);
  back += rock(c, { X: -7.2, Z: 17, w: 10, h: 2.3, seed: 4, wet: true, t }) + pine(c, { X: -8.6, Z: 17, h: 3.6, seed: 5, lean: 0.3, t }).replace(/<ellipse[^>]*softs[^>]*>/, "") + pine(c, { X: -5.4, Z: 16.8, h: 2.9, seed: 8, lean: -0.25, t }).replace(/<ellipse[^>]*softs[^>]*>/, "");
  back += rock(c, { X: 4.4, Z: 14.5, w: 2.4, h: 2.1, seed: 2, wet: true, t }) + rock(c, { X: 6.3, Z: 13.6, w: 1.5, h: 1.0, seed: 7, wet: true, t });
  back += shore(c, t, o);
  if (o.pines !== false) back += rock(c, { X: 4.3, Z: 7.4, w: 2.2, h: 0.75, seed: 12 }) + pine(c, { ...BEACH.pine, h: 5.2, seed: 1, lean: -0.3, t }) + pine(c, { X: -4.9, Z: 8.3, h: 4.1, seed: 4, lean: 0.34, t });
  if (o.boat !== false) back += boat(c, BEACH.boat);
  back += rock(c, { X: 2.3, Z: 5.4, w: 0.7, h: 0.3, seed: 15 });
  if (o.prints !== false) back += prints(c, [0.9, 0.2], [BEACH.keeper.X, BEACH.keeper.Z - 0.1]) + prints(c, [-1.6, 0.4], [BEACH.kid.X, BEACH.kid.Z - 0.1], true);
  back += driftwood(c, -1.25, 2.5, 3) + grass(c, { X: 1.15, Z: 1.5, seed: 2, t }) + grass(c, { X: 0.95, Z: 0.6, seed: 5, size: 1.15, t }) + grass(c, { X: -0.9, Z: 0.55, seed: 8, size: 1.1, t }) + grass(c, { X: -1.3, Z: 1.2, seed: 11, size: 0.8, t }) + grass(c, { X: -3.2, Z: 3.9, seed: 14, size: 0.8, t });
  return { back, front: near(c, t) };
}
// foreground: a pine bough hanging into the top corner, out of focus
export function near(c, t) {
  const sw = Math.sin(t * 0.9) * 5, col = mix(M.pine, INK, 0.62), tr2 = mix(M.trunk, INK, 0.45); let s = "", nd = "";
  const pad = (px, py, w, sd) => { for (let i = 0; i < 5; i++) { const f = (i + 0.5) / 5, x = px - w / 2 + f * w, r = w * (0.17 + 0.08 * Math.sin(f * Math.PI)) * (0.85 + 0.3 * hash(sd + i)), ry = r * (0.5 + 0.4 * Math.sin(f * Math.PI));
      s += `<path d="M${n(x - r)},${n(py)} A${n(r)},${n(ry)} 0 0 1 ${n(x + r)},${n(py)} Z" fill="${col}"/>`;
      for (let j = 0; j < 12; j++) { const an = Math.PI * (0.03 + 0.94 * (j + hash(sd + i * 13 + j) * 0.6) / 12), nl = w * (0.05 + 0.04 * hash(sd + i * 7 + j)); nd += `M${n(x + Math.cos(an) * r * 0.9)},${n(py - Math.sin(an) * ry * 0.9)} L${n(x + Math.cos(an) * (r + nl))},${n(py - Math.sin(an) * (ry + nl))} `; } }
    s += `<path d="M${n(px - w * 0.56)},${n(py)} h${n(w * 1.12)}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`; };
  const br = `M1120,-30 Q960,50 800,74 Q700,90 640,150 M930,56 Q900,130 840,176 M800,74 Q760,40 700,34`;
  pad(650, 150, 330, 3); pad(850, 180, 250, 9); pad(700, 40, 230, 15); pad(985, 78, 210, 21);
  return `<g transform="translate(${n(sw - c.x * 60)},${n(-sw * 0.3)})">${ln(br, tr2, 15)}${ln(nd, col, 2.6)}${s}</g>`;
}

// ---------------------------------------------------------------- sea life (screen px; shared by the dive and the palace)
// kind 0 red sea bream (tai), 1 yellow striped, 2 silver sardine. L = length px, dir 1 swims right, ph = tail phase.
export function fish(x, y, L, dir = 1, kind = 0, ph = 0, tint = 0) {
  const wag = Math.sin(ph) * 16, lw = Math.max(0.6, Math.min(2.2, 110 / L)), T = (col) => tint ? mix(col, M.w2, tint) : col;
  let g;
  if (kind === 0) {
    g = `<g transform="rotate(${n(wag)} -34 0)">${shp("M-30,0 Q-44,-10 -58,-22 Q-52,-4 -53,2 Q-54,12 -60,22 Q-44,12 -30,2 Z", T("#e02a3c"), lw)}${ln("M-36,-2 L-52,-14 M-36,2 L-53,12 M-38,0 L-50,0", T("#8a1428"), lw * 0.7)}</g>`;
    g += shp("M-8,-24 L-2,-34 L4,-27 L10,-35 L15,-27 L21,-32 L24,-22 L30,-25 L30,-16 Q10,-28 -8,-22 Z", T("#e02a3c"), lw);
    g += shp("M46,2 Q40,-22 8,-26 Q-22,-22 -36,-2 Q-22,20 6,24 Q36,22 46,2 Z", T("#ff5846"), lw) + flat("M44,6 Q30,20 6,22 Q-18,19 -32,2 Q-10,12 12,11 Q32,10 44,6 Z", T("#ffd2c2"));
    for (let r = 0; r < 4; r++) for (let j = 0; j < 7 - r; j++) { const sx = -24 + j * 8.5 + r * 4, sy = -15 + r * 7.5; g += ln(`M${n(sx)},${n(sy - 3.2)} q4.6,3.2 0,6.6`, T("#b81c34"), lw * 0.75); }
    for (const [bx, by] of [[-6, -14], [6, -17], [16, -12], [-14, -7], [2, -6]]) g += `<circle cx="${bx}" cy="${by}" r="1.5" fill="${T("#3ad0f0")}" stroke="none"/>`;
    g += shp("M14,4 Q4,8 0,18 Q10,16 18,8 Z", T("#ff9a6a"), lw) + shp("M-12,20 L-6,30 L2,23 Z", T("#e02a3c"), lw);
    g += `<circle cx="32" cy="-6" r="5.4" fill="#fff6e0" stroke="${INK}" stroke-width="${lw}"/><circle cx="33" cy="-6" r="2.8" fill="${INK}" stroke="none"/><circle cx="34" cy="-7.2" r="1" fill="#fff" stroke="none"/>` + ln("M45,3 Q41,6 37,5 M22,-12 Q25,-2 22,8", INK, lw);
  } else if (kind === 1) {
    g = `<g transform="rotate(${n(wag)} -36 0)">${shp("M-34,0 L-56,-14 Q-50,0 -56,14 Z", T("#ffe04a"), lw)}</g>` + shp("M46,0 Q26,-17 -6,-15 Q-28,-10 -38,0 Q-28,11 -6,14 Q26,15 46,0 Z", T("#ffd230"), lw) + flat("M-4,-14 L6,-15 L2,13 L-8,13 Z M16,-14 L24,-12 L21,11 L13,12 Z", T("#1a3a8a")) + flat("M44,1 Q26,13 -6,13 Q-26,10 -36,1 Q-10,7 12,7 Z", T("#fff3b0"));
    g += shp("M-2,-15 Q8,-26 22,-13 Z", T("#ffe04a"), lw) + `<circle cx="34" cy="-3" r="4" fill="#fff" stroke="${INK}" stroke-width="${lw}"/><circle cx="35" cy="-3" r="2" fill="${INK}" stroke="none"/>`;
  } else {
    g = `<g transform="rotate(${n(wag)} -38 0)">${shp("M-36,0 L-56,-11 L-50,0 L-56,11 Z", T("#7fb4e6"), lw)}</g>` + shp("M48,0 Q24,-12 -8,-10 Q-30,-6 -40,0 Q-30,7 -8,9 Q24,10 48,0 Z", T("#e8f6ff"), lw) + flat("M46,-1 Q24,-11 -8,-9 Q-28,-6 -38,-1 Q-10,-4 14,-4 Z", T("#3a7ad0")) + `<circle cx="36" cy="-1.5" r="3" fill="${INK}" stroke="none"/>` + ln("M26,-6 Q29,0 26,6", INK, lw * 0.7);
  }
  return `<g transform="translate(${n(x)},${n(y)}) scale(${n(dir * L / 100)},${n(L / 100)})">${g}</g>`;
}
export function bubble(x, y, r) {
  const lw = Math.max(1, Math.min(2.4, r * 0.12));
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${M.w0}" fill-opacity="0.25" stroke="#eaffff" stroke-width="${n(lw)}"/><path d="M${n(x - r * 0.6)},${n(y - r * 0.15)} A${n(r * 0.62)},${n(r * 0.62)} 0 0 1 ${n(x - r * 0.1)},${n(y - r * 0.62)}" fill="none" stroke="#fff" stroke-width="${n(lw * 1.3)}" stroke-linecap="round"/><circle cx="${n(x + r * 0.35)}" cy="${n(y + r * 0.4)}" r="${n(r * 0.1)}" fill="#fff"/>`;
}
function bubbles(t, count, seed, r0, r1, x0 = 0, x1 = W) {
  let s = "";
  for (let i = 0; i < count; i++) { const sp = 90 + 140 * hash(seed + i * 3), y = H + 60 - ((t * sp + hash(seed + i) * (H + 200)) % (H + 200)), x = lerp(x0, x1, hash(seed + i * 7)) + Math.sin(t * 1.6 + i) * 16; s += bubble(x, y, lerp(r0, r1, hash(seed + i * 5) ** 2)); }
  return s;
}
function kelp(x, y0, hgt, seed, t, w = 26) {
  const L = [], R = [], N = 9;
  for (let i = 0; i <= N; i++) { const u = i / N, sx = x + Math.sin(u * 4.2 + seed + t * 0.9) * hgt * 0.07 * u + jit(seed + i, 3), ww = w * (1 - u * 0.75) * (0.8 + 0.35 * Math.sin(u * 9 + seed)); L.push(`${n(sx - ww)},${n(y0 - u * hgt)}`); R.push(`${n(sx + ww)},${n(y0 - u * hgt)}`); }
  const mid = L.map((q, i) => { const a = q.split(",").map(Number), b2 = R[i].split(",").map(Number); return `${n((a[0] + b2[0]) / 2)},${n(a[1])}`; });
  return shp(`M${L.join(" L")} L${R.reverse().join(" L")} Z`, M.kelp, 1.6) + ln(`M${mid.join(" L")}`, M.kelpS, 3);
}
// a branching coral, every branch its own stroke. x, y = root (px), size px
export function coral(x, y, size, seed, col = M.coral, colS = M.coralS) {
  let under = "", over = ""; const lw = Math.max(0.8, Math.min(2, size * 0.008));
  const rec = (x0, y0, ang, len, w, d, id) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 - Math.sin(ang) * len, dd = `M${n(x0)},${n(y0)} Q${n((x0 + x1) / 2 + jit(id, len * 0.2))},${n((y0 + y1) / 2 + jit(id + 1, len * 0.1))} ${n(x1)},${n(y1)}`;
    under += ln(dd, INK, w + lw * 2); over += ln(dd, col, w) + ln(dd, colS, w * 0.28, `transform="translate(${n(w * 0.26)},0)"`);
    if (d <= 0) { under += `<circle cx="${n(x1)}" cy="${n(y1)}" r="${n(w * 0.75 + lw)}" fill="${INK}"/>`; over += `<circle cx="${n(x1)}" cy="${n(y1)}" r="${n(w * 0.75)}" fill="${col}"/><circle cx="${n(x1 - w * 0.2)}" cy="${n(y1 - w * 0.2)}" r="${n(w * 0.22)}" fill="#fff" opacity="0.7"/>`; return; }
    const nb = hash(id + 2) < 0.3 ? 3 : 2;
    for (let i = 0; i < nb; i++) rec(x1, y1, ang + (i - (nb - 1) / 2) * (0.8 + jit(id + 3 + i, 0.2)) + jit(id + 7 + i, 0.18), len * (0.6 + 0.22 * hash(id + 11 + i)), w * 0.74, d - 1, id * 3 + i + 1);
  };
  rec(x, y, Math.PI / 2 + jit(seed, 0.15), size * 0.3, size * 0.075, 4, seed * 7 + 1);
  return under + over;
}
// a fan coral: a lattice of thin veins
function seaFan(x, y, size, seed, col = M.coralO) {
  let s = ""; const lw = Math.max(1, size * 0.012);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.18 + 0.08 * i) + jit(seed + i, 0.03), l = size * (0.75 + 0.25 * Math.sin(i / 8 * Math.PI)); s += ln(`M${n(x)},${n(y)} Q${n(x + Math.cos(a) * l * 0.5 + jit(seed + i * 3, size * 0.05))},${n(y - Math.sin(a) * l * 0.5)} ${n(x + Math.cos(a) * l)},${n(y - Math.sin(a) * l)}`, INK, lw * 2.6) ; }
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.18 + 0.08 * i) + jit(seed + i, 0.03), l = size * (0.75 + 0.25 * Math.sin(i / 8 * Math.PI)); s += ln(`M${n(x)},${n(y)} Q${n(x + Math.cos(a) * l * 0.5 + jit(seed + i * 3, size * 0.05))},${n(y - Math.sin(a) * l * 0.5)} ${n(x + Math.cos(a) * l)},${n(y - Math.sin(a) * l)}`, col, lw * 1.5); }
  for (let r = 1; r <= 4; r++) s += `<path d="M${n(x + Math.cos(Math.PI * 0.2) * size * r * 0.2)},${n(y - Math.sin(Math.PI * 0.2) * size * r * 0.2)} A${n(size * r * 0.2)},${n(size * r * 0.2)} 0 0 0 ${n(x + Math.cos(Math.PI * 0.8) * size * r * 0.2)},${n(y - Math.sin(Math.PI * 0.8) * size * r * 0.2)}" fill="none" stroke="${col}" stroke-width="${n(lw)}" stroke-dasharray="${n(size * 0.03)} ${n(size * 0.015)}"/>`;
  return s;
}
// a jellyfish that works as a lantern. o: { x, y, r px, seed, lit 0..1 }
export function jelly(o, t) {
  const { x, y, r, seed = 1, lit = 1 } = o, ph = t * 1.7 + seed, sq = 1 + 0.08 * Math.sin(ph), lw = Math.max(0.8, Math.min(2, r * 0.03));
  let s = lit > 0 ? lightBlobs(x, y, [r * 2.6, r * 1.7], M.gold, [0.1 * lit, 0.16 * lit], seed) : "";
  for (let i = 0; i < 7; i++) { const tx = x + (i - 3) * r * 0.24; s += ln(`M${n(tx)},${n(y + r * 0.2)} q${n(Math.sin(ph + i) * r * 0.25)},${n(r * 0.5)} 0,${n(r)} q${n(-Math.sin(ph + i * 1.3) * r * 0.25)},${n(r * 0.5)} 0,${n(r * (0.7 + 0.5 * hash(seed + i)))}`, i % 2 ? M.coralP : M.goldL, lw * 1.2, `opacity="0.9"`); }
  for (let i = 0; i < 3; i++) { const tx = x + (i - 1) * r * 0.4; s += shp(`M${n(tx - r * 0.12)},${n(y + r * 0.2)} q${n(r * 0.3 * Math.sin(ph + i))},${n(r * 0.5)} ${n(r * 0.05)},${n(r * 1.1)} q${n(r * 0.2)},${n(-r * 0.5)} ${n(r * 0.18)},${n(-r * 1.1)} Z`, M.coralP, lw); }
  let rim = `M${n(x - r * sq)},${n(y + r * 0.15)} Q${n(x - r * 1.05 * sq)},${n(y - r * 0.95 / sq)} ${n(x)},${n(y - r / sq)} Q${n(x + r * 1.05 * sq)},${n(y - r * 0.95 / sq)} ${n(x + r * sq)},${n(y + r * 0.15)}`;
  for (let i = 0; i < 6; i++) rim += ` q${n(-r * sq / 6)},${n(r * 0.2)} ${n(-r * sq / 3)},0`;
  s += shp(rim + " Z", M.coral, lw) + flat(`M${n(x - r * 0.75 * sq)},${n(y)} Q${n(x - r * 0.8 * sq)},${n(y - r * 0.8 / sq)} ${n(x - r * 0.1)},${n(y - r * 0.88 / sq)} Q${n(x - r * 0.5)},${n(y - r * 0.5)} ${n(x - r * 0.75 * sq)},${n(y)} Z`, M.coralP);
  s += flat(ring(x, y - r * 0.25, r * 0.36, seed, 0.1, 10), M.goldL, `opacity="${n(0.5 + 0.5 * lit)}"`) + flat(ring(x, y - r * 0.25, r * 0.18, seed + 3, 0.1, 9), "#fff");
  for (let i = -2; i <= 2; i++) s += ln(`M${n(x + i * r * 0.3 * sq)},${n(y + r * 0.12)} Q${n(x + i * r * 0.33 * sq)},${n(y - r * 0.5)} ${n(x + i * r * 0.1)},${n(y - r * 0.93 / sq)}`, M.coralS, lw * 0.7, `opacity="0.7"`);
  return s;
}
function shafts(t, seed, count, op = 1) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = hash(seed + i * 3) * (W + 300) - 60 + Math.sin(t * 0.4 + i) * 22, w = 50 + 170 * hash(seed + i * 5), len = H * (0.55 + 0.4 * hash(seed + i * 7)), dx = -len * 0.32, tw = w * 1.7;
    const q = (l, ww) => `M${n(x)},-20 L${n(x + ww)},-20 L${n(x + dx * l + ww * 1.7 + jit(seed + i, 14))},${n(len * l)} L${n(x + dx * l + jit(seed + i + 1, 14))},${n(len * l + 30)} Z`;
    s += flat(q(1, w), M.shaft, `opacity="${n(0.1 * op)}" style="mix-blend-mode:screen"`) + flat(q(0.62, w * 0.55), M.shaft, `opacity="${n(0.13 * op)}" style="mix-blend-mode:screen"`);
  }
  return s;
}
// the Dragon Palace from far off: stacked gold roofs with upturned eaves, vermilion walls, coral at its foot
export function palaceFar(x, y, k, tint = 0.3) {
  const T = (col) => mix(col, M.w2, tint), lw = Math.max(0.8, k * 0.012); let s = "";
  const roof = (cx, cy, w, hh) => shp(`M${n(cx - w * 0.62)},${n(cy - hh * 0.1)} Q${n(cx - w * 0.5)},${n(cy)} ${n(cx - w * 0.3)},${n(cy - hh * 0.55)} Q${n(cx - w * 0.12)},${n(cy - hh)} ${n(cx)},${n(cy - hh * 1.05)} Q${n(cx + w * 0.12)},${n(cy - hh)} ${n(cx + w * 0.3)},${n(cy - hh * 0.55)} Q${n(cx + w * 0.5)},${n(cy)} ${n(cx + w * 0.62)},${n(cy - hh * 0.1)} L${n(cx + w * 0.5)},${n(cy + hh * 0.16)} L${n(cx - w * 0.5)},${n(cy + hh * 0.16)} Z`, T(M.gold), lw)
    + flat(`M${n(cx - w * 0.5)},${n(cy + hh * 0.16)} L${n(cx + w * 0.5)},${n(cy + hh * 0.16)} L${n(cx + w * 0.56)},${n(cy)} Q${n(cx)},${n(cy + hh * 0.05)} ${n(cx - w * 0.56)},${n(cy)} Z`, T(M.goldS))
    + Array.from({ length: 9 }, (_, i) => ln(`M${n(cx + (i - 4) * w * 0.035)},${n(cy - hh * (0.95 - Math.abs(i - 4) * 0.05))} Q${n(cx + (i - 4) * w * 0.07)},${n(cy - hh * 0.5)} ${n(cx + (i - 4) * w * 0.115)},${n(cy + hh * 0.02)}`, T(M.goldS), lw * 0.8)).join("");
  const tier = (cy, w, hh) => { let g = shp(`M${n(x - w / 2)},${n(cy)} L${n(x + w / 2)},${n(cy)} L${n(x + w / 2)},${n(cy - hh)} L${n(x - w / 2)},${n(cy - hh)} Z`, T(M.pwall), lw); for (let i = 0; i <= 6; i++) g += ln(`M${n(x - w / 2 + i * w / 6)},${n(cy)} v${n(-hh)}`, T(M.lac), k * 0.035) ; for (let i = 0; i < 6; i++) if (i % 2 === 0 || i === 3) g += flat(`M${n(x - w / 2 + (i + 0.3) * w / 6)},${n(cy - hh * 0.25)} h${n(w / 15)} v${n(-hh * 0.45)} h${n(-w / 15)} Z`, T(M.goldL)); return g; };
  s += shp(ring(x, y + k * 0.25, k * 1.25, 3, 0.12, 14, 0.36), T(M.bed), lw);
  for (let i = 0; i < 7; i++) s += coral(x + (i - 3) * k * 0.34 + jit(i, k * 0.06), y + k * 0.12, k * (0.3 + 0.2 * hash(i + 4)), i + 20, T([M.coral, M.coralO, M.coralP][i % 3]), T(M.coralS));
  s += tier(y, k * 1.5, k * 0.42) + roof(x, y - k * 0.42, k * 1.55, k * 0.3) + tier(y - k * 0.62, k * 1.0, k * 0.34) + roof(x, y - k * 0.96, k * 1.08, k * 0.27) + tier(y - k * 1.14, k * 0.6, k * 0.28) + roof(x, y - k * 1.42, k * 0.72, k * 0.3);
  s += shp(`M${n(x - k * 0.03)},${n(y - k * 1.72)} L${n(x)},${n(y - k * 2.0)} L${n(x + k * 0.03)},${n(y - k * 1.72)} Z`, T(M.gold), lw) + `<circle cx="${n(x)}" cy="${n(y - k * 1.86)}" r="${n(k * 0.045)}" fill="${T(M.jade)}" stroke="${INK}" stroke-width="${lw}"/>`;
  return s;
}

// ---------------------------------------------------------------- set (b): the dive
// o: { depth 0 (just under the surface) .. 1 (the sea floor), palace 0..1 (the palace comes into view far below) }
// Returns { back, front }. The turtle and rider go between. World Z still works: put the turtle at Z 5..7.
export const DIVE = { turtle: { X: 0, Y: 1.4, Z: 6 }, cam: { main: { x: 0, y: 1.5, z: 0, h0: 960 } } };
export function dive(c, t, o = {}) {
  const dp = o.depth ?? 0.4;
  let s = `<rect width="${W}" height="${H}" fill="${M.w0}"/>`;
  for (let i = 1; i <= 4; i++) { const y = (i * 0.26 + 0.12 - dp * 0.78) * H; if (y < H + 40) s += band(wline(y + Math.sin(t * 0.5 + i) * 8, 50 + i, 26, 140), M["w" + i]); }
  if (dp < 0.55) {              // the surface from below: a net of light
    const yy = (0.05 - dp * 0.2) * H;
    for (let r = 0; r < 4; r++) for (let j = 0; j < 9; j++) { const id = r * 13 + j, x = j * 140 - 60 + (r % 2) * 70 + Math.sin(t * 0.8 + id) * 14, y = yy + r * 46 + jit(id, 12), w = 70 + 50 * hash(id + 3); s += ln(`M${n(x)},${n(y)} q${n(w * 0.5)},${n(26 + 10 * hash(id))} ${n(w)},0 q${n(w * 0.4)},${n(-20)} ${n(w * 0.9)},${n(6)}`, "#fff", 5 - r, `opacity="${n(0.75 - r * 0.15)}"`); }
  }
  s += shafts(t, 3, 7, 1 - dp * 0.35);
  for (let i = 0; i < 46; i++) { const x = (hash(i + 200) * W + t * 6 * (hash(i) - 0.5)) % W, y = (hash(i + 240) * H + t * 14) % H; s += `<path d="M${n(x)},${n(y)} l${n(2 + 4 * hash(i))},${n(3 * hash(i + 3))}" stroke="#dff6ff" stroke-width="${n(1 + 1.6 * hash(i + 9))}" stroke-linecap="round" opacity="${n(0.25 + 0.4 * hash(i + 5))}"/>`; }
  for (let i = 0; i < 16; i++) { const x = ((hash(i + 90) * 1500 + t * 46) % 1500) - 200, y = H * (0.3 + 0.2 * hash(i + 91)) + Math.sin(t + i) * 10 + (i % 4) * 26; s += fish(x, y, 46 + 18 * hash(i + 92), 1, 2, t * 9 + i, 0.45); }
  if (dp > 0.5) {               // the sea floor rises into frame
    const by = H * (1.62 - dp * 0.72);
    if (o.palace) s += `<g opacity="${n(clamp(o.palace))}">${palaceFar(o.palaceAt?.[0] ?? 690, by + 40, o.palaceAt?.[1] ?? 270, 0.12)}</g>`;
    s += flat(`M-40,${H + 40} L-40,${n(by + 60)} ` + wline(by + 50, 71, 46, 90).map((p, i) => `L${n(p.x)},${n(p.y - (i % 4 === 1 ? 70 : 0))}`).join(" ") + ` L${W + 40},${H + 40} Z`, M.bed);
    for (let i = 0; i < 6; i++) s += kelp(60 + i * 190 + jit(i + 5, 40), by + 120, 260 + 220 * hash(i + 7), i * 3, t);
    for (let i = 0; i < 5; i++) s += coral(140 + i * 215 + jit(i + 15, 40), by + 130, 130 + 90 * hash(i + 17), i + 40, mix([M.coral, M.coralO, M.coralP][i % 3], M.w2, 0.2), mix(M.coralS, M.w3, 0.2));
    s += band(wline(by + 150, 73, 30, 110), M.bedS);
  }
  for (let i = 0; i < 6; i++) { const x = ((hash(i + 30) * 1400 - t * 60 + 1400) % 1400) - 150, y = H * (0.5 + 0.3 * hash(i + 31)) + Math.sin(t * 1.2 + i) * 14; s += fish(x, y, 70 + 40 * hash(i + 32), -1, 1, t * 8 + i, 0.2); }
  s += bubbles(t, 16, 5, 5, 16);
  let front = bubbles(t, 7, 44, 14, 38) + `<g filter="url(#dof)">${bubbles(t * 1.2, 3, 81, 50, 80)}</g>`;
  front += flat(`M${n(820 + Math.sin(t * 0.3) * 20)},-20 L1140,-20 L760,${H} L420,${H} Z`, M.shaft, `opacity="0.07" style="mix-blend-mode:screen"`);
  return { back: s, front };
}

// ---------------------------------------------------------------- set (c): Ryugu-jo, the great hall
export const HALL = { px: 1.55, zs: [4, 6.8, 9.6], back: 12.5, h: 6.2, gate: { Y: 2.35, r: 1.3 }, otohime: { X: 0.1, Y: 0.45, Z: 11.9 }, guest: { X: -0.55, Z: 7.6 }, feast: { X: 0, Z: 7 },
  cam: { wide: { x: 0, y: 1.5, z: 0.2, h0: 1190 }, meet: { x: 0.0, y: 1.35, z: 4.9, h0: 1150 } } };
function pillar(c, X, Z, h, seed) {
  if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z), r = 0.21, lw = b.lw, wd = "#d89a58";
  let s = shadow(b.p, 0.5);
  s += shp(hd(b, [[-r, 0.28], [-r, h], [r, h], [r, 0.28]], seed, 0.01, 0.6), M.lac, lw) + flat(hd(b, [[r * 0.3, 0.28], [r * 0.24, h], [r, h], [r, 0.28]], seed + 1, 0.012, 0.5), M.lacS) + flat(hd(b, [[-r * 0.78, 0.3], [-r * 0.8, h], [-r * 0.52, h], [-r * 0.56, 0.3]], seed + 2, 0.008, 0.7), M.lacL);
  for (let i = 0; i < 16; i++) { const x = jit(seed * 7 + i, r * 0.85), y = 0.6 + hash(seed * 9 + i) * (h - 1.4), w = 0.02 + 0.035 * hash(seed + i * 3), hh = 0.03 + 0.09 * hash(seed + i * 5);   // chipped lacquer, chip by chip
    s += flat(hd(b, [[x, y], [x + w, y + hh * 0.3], [x + w * 0.7, y + hh], [x - w * 0.3, y + hh * 0.6]], seed + i, 0.004, 0.05), i % 3 === 0 ? wd : mix(M.lacS, INK, 0.45)); }
  for (let i = 0; i < 5; i++) { const x = -r * 0.5 + i * r * 0.25; s += ln(`M${b.pt(x, 0.9 + hash(seed + i) * 1.2)} L${b.pt(x + jit(i + seed, 0.01), 2.2 + hash(seed + i * 2) * (h - 3.2))}`, M.lacS, lw * 0.6, `opacity="0.6"`); }
  for (const [y0, y1] of [[0.28, 0.62], [h - 0.75, h - 0.42]]) {
    s += shp(hd(b, [[-r * 1.07, y0], [-r * 1.07, y1], [r * 1.07, y1], [r * 1.07, y0]], seed + y0 * 5, 0.006, 0.3), M.gold, lw) + flat(hd(b, [[r * 0.3, y0 + 0.01], [r * 0.3, y1 - 0.01], [r * 1.04, y1 - 0.01], [r * 1.04, y0 + 0.01]], seed + 4, 0.004, 0.3), M.goldS);
    s += ln(`M${b.pt(-r, y0 + 0.07)} L${b.pt(r, y0 + 0.07)} M${b.pt(-r, y1 - 0.07)} L${b.pt(r, y1 - 0.07)}`, INK, lw * 0.6);
    for (let i = 0; i < 5; i++) s += `<circle cx="${n(b.x(-r * 0.8 + i * r * 0.4))}" cy="${n(b.y((y0 + y1) / 2))}" r="${n(Math.max(0.8, 0.022 * b.k))}" fill="${M.goldL}" stroke="${INK}" stroke-width="${n(lw * 0.5)}"/>`;
  }
  s += shp(hd(b, [[-r * 1.5, 0], [-r * 1.38, 0.28], [r * 1.38, 0.28], [r * 1.5, 0]], seed + 6, 0.008, 0.3), M.jade, lw) + flat(hd(b, [[r * 0.4, 0.01], [r * 0.4, 0.27], [r * 1.36, 0.27], [r * 1.48, 0.01]], seed + 7, 0.005, 0.3), M.jadeS);
  for (let i = 0; i < 5; i++) s += ln(`M${b.pt(-r * 1.3 + i * r * 0.65, 0.27)} q${n(r * 0.32 * b.k)},${n(0.2 * b.k)} ${n(r * 0.65 * b.k)},0`, INK, lw * 0.7);
  // bracket block under the beam
  s += shp(hd(b, [[-r * 2.1, h + 0.02], [-r * 1.2, h - 0.38], [r * 1.2, h - 0.38], [r * 2.1, h + 0.02]], seed + 8, 0.008, 0.3), M.jade, lw) + shp(hd(b, [[-r * 1.5, h - 0.36], [-r * 1.5, h - 0.44], [r * 1.5, h - 0.44], [r * 1.5, h - 0.36]], seed + 9, 0.004, 0.3), M.gold, lw);
  return s;
}
// o: { fish: true, lanterns 0..1 (how brightly the jellyfish burn) }. Returns { back, front }.
export function palace(c, t, o = {}) {
  const A = HALL, ZB = A.back, lit = o.lanterns ?? 1, Q = (X, Y, Z) => P(c, X, Y, Math.max(c.z + NEAR, Z));
  // open water behind and beside the hall
  let s = `<rect width="${W}" height="${H}" fill="${M.w1}"/>` + band(wline(H * 0.3, 60, 24, 140), M.w2) + band(wline(H * 0.52, 61, 24, 140), M.w3) + shafts(t, 9, 5, 0.8);
  for (let i = 0; i < 8; i++) { const sd = i % 2 ? 1 : -1, q = Q(sd * (4.6 + 1.6 * hash(i + 3)), 0, 13 + i * 1.4); s += coral(q.x, q.y, q.s * (1.6 + 1.6 * hash(i + 5)), i + 60, mix([M.coral, M.coralO, M.coralP][i % 3], M.w2, 0.45), mix(M.coralS, M.w3, 0.45)); }
  for (let i = 0; i < 12; i++) { const x = ((hash(i + 110) * 1500 + t * 40) % 1500) - 200, y = H * (0.18 + 0.4 * hash(i + 111)); s += fish(x, y, 34 + 14 * hash(i), 1, 2, t * 9 + i, 0.5); }
  // the back wall, the moon gate, the gold gable
  const bw = board(c, 0, 0, ZB), lw = bw.lw, G = A.gate;
  if (vis(c, ZB)) {
    const gid = `sg${UID++}`, gcx = bw.x(0), gcy = bw.y(G.Y), gr = G.r * bw.k;
    s += `<defs><clipPath id="${gid}"><path d="${ring(gcx, gcy, gr, 5, 0.012, 24)}"/></clipPath><mask id="m${gid}"><rect x="-100" y="-200" width="${W + 200}" height="${H + 400}" fill="#fff"/><path d="${ring(gcx, gcy, gr, 5, 0.012, 24)}" fill="#000"/></mask></defs>`;
    let wall = shp(hd(bw, [[-3.4, 0], [-3.4, 7.6], [3.4, 7.6], [3.4, 0]], 3, 0.02, 0.8), M.pwall, lw);
    wall += flat(hd(bw, [[-3.4, 5.0], [-3.4, 7.6], [3.4, 7.6], [3.4, 5.2]], 5, 0.03, 0.6), M.pwallS);
    for (let i = 0; i < 40; i++) { const x = jit(i + 400, 3.2), y = 1.9 + hash(i + 440) * 3.2, l = 0.12 + 0.3 * hash(i + 3); wall += ln(`M${bw.pt(x, y)} l${n(l * bw.k)},${n(jit(i, 0.03) * bw.k)}`, i % 3 ? M.pwallL : M.pwallS, (0.02 + 0.03 * hash(i + 9)) * bw.k, `opacity="${n(0.4 + 0.3 * hash(i + 6))}"`); }
    for (const [x, y, sc, fl] of [[-2.35, 4.25, 1, 1], [2.3, 3.9, 0.85, -1], [-2.5, 2.3, 0.7, -1], [2.45, 2.2, 0.9, 1], [-1.9, 5.6, 0.7, 1], [2.0, 5.75, 0.6, -1]]) {     // gold cloud curls, each drawn by hand
      const u = 0.3 * sc * bw.k, X0 = bw.x(x), Y0 = bw.y(y), d = `M${n(X0 - u * 1.5 * fl)},${n(Y0)} q${n(u * 0.7 * fl)},${n(-u * 0.9)} ${n(u * 1.3 * fl)},${n(-u * 0.2)} q${n(u * 0.5 * fl)},${n(-u * 0.9)} ${n(u * 1.2 * fl)},${n(-u * 0.1)} q${n(u * 0.5 * fl)},${n(u * 0.6)} ${n(-u * 0.15 * fl)},${n(u * 0.7)} q${n(-u * 0.5 * fl)},${n(0.1 * u)} ${n(-u * 0.45 * fl)},${n(-u * 0.3)} M${n(X0 - u * 1.5 * fl)},${n(Y0)} q${n(u * 1.2 * fl)},${n(u * 0.35)} ${n(u * 2.6 * fl)},${n(u * 0.3)}`;
      wall += ln(d, M.goldS, 0.05 * bw.k) + ln(d, M.gold, 0.028 * bw.k);
    }
    // seigaiha dado: every wave scale is three arcs
    wall += shp(hd(bw, [[-3.4, 0], [-3.4, 1.55], [3.4, 1.55], [3.4, 0]], 7, 0.012, 0.8), M.jadeS, lw);
    const sr = 0.24;
    for (let r = 0; r < 7; r++) for (let j = -15; j <= 15; j++) { const x = j * sr * 2 + (r % 2) * sr, y = 1.5 - r * sr * 0.98; if (Math.abs(x) > 3.3 || y < 0.05) continue;
      wall += `<path d="M${bw.pt(x - sr, y - sr)} A${n(sr * bw.k)},${n(sr * bw.k)} 0 0 1 ${bw.pt(x + sr, y - sr)} Z" fill="${(r + j) % 5 === 0 ? M.jadeL : M.jade}" stroke="${INK}" stroke-width="${n(lw * 0.7)}"/>` + [0.66, 0.34].map((f) => `<path d="M${bw.pt(x - sr * f, y - sr)} A${n(sr * f * bw.k)},${n(sr * f * bw.k)} 0 0 1 ${bw.pt(x + sr * f, y - sr)}" fill="none" stroke="${f > 0.5 ? M.jadeS : M.gold}" stroke-width="${n(lw * 0.9)}"/>`).join(""); }
    wall += shp(hd(bw, [[-3.4, 1.5], [-3.4, 1.68], [3.4, 1.68], [3.4, 1.5]], 8, 0.008, 0.8), M.gold, lw);
    s += `<g mask="url(#m${gid})">${wall}</g>`;
    // through the gate: deeper water, a shaft, far fish
    let gate = `<rect x="${n(gcx - gr - 5)}" y="${n(gcy - gr - 5)}" width="${n(gr * 2 + 10)}" height="${n(gr * 2 + 10)}" fill="${M.w0}"/>` + band(wline(gcy - gr * 0.1, 66, gr * 0.06, gr * 0.5), M.w1) + band(wline(gcy + gr * 0.5, 67, gr * 0.06, gr * 0.5), M.w2);
    gate += flat(`M${n(gcx - gr * 0.2)},${n(gcy - gr)} L${n(gcx + gr * 0.5)},${n(gcy - gr)} L${n(gcx - gr * 0.3)},${n(gcy + gr)} L${n(gcx - gr * 0.9)},${n(gcy + gr)} Z`, M.shaft, `opacity="0.3"`);
    for (let i = 0; i < 5; i++) gate += fish(gcx + ((hash(i + 130) * 3 + t * 0.12) % 3 - 1.5) * gr, gcy + jit(i + 131, gr * 0.6), gr * 0.2, 1, 2, t * 9 + i, 0.35);
    gate += coral(gcx + gr * 0.55, gcy + gr * 1.0, gr * 0.9, 77, mix(M.coralP, M.w1, 0.3), mix(M.coralS, M.w2, 0.3));
    s += `<g clip-path="url(#${gid})">${gate}</g>`;
    s += `<path d="${ring(gcx, gcy, gr * 1.06, 5, 0.012, 24)}" fill="none" stroke="${INK}" stroke-width="${n(0.26 * bw.k)}"/><path d="${ring(gcx, gcy, gr * 1.06, 5, 0.012, 24)}" fill="none" stroke="${M.gold}" stroke-width="${n(0.26 * bw.k - lw * 2)}"/><path d="${ring(gcx, gcy, gr * 1.0, 5, 0.012, 24)}" fill="none" stroke="${M.lac}" stroke-width="${n(0.09 * bw.k)}"/><path d="${ring(gcx, gcy, gr * 1.12, 6, 0.012, 24)}" fill="none" stroke="${M.goldS}" stroke-width="${n(0.03 * bw.k)}"/>`;
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + 0.2; s += `<circle cx="${n(gcx + Math.cos(a) * gr * 1.09)}" cy="${n(gcy + Math.sin(a) * gr * 1.09)}" r="${n(0.035 * bw.k)}" fill="${M.goldL}" stroke="${INK}" stroke-width="${n(lw * 0.6)}"/>`; }
    // the gold gable and jade tiles over it
    const gy = 3.95;
    for (let r = 0; r < 4; r++) for (let j = -14; j <= 14; j++) s += `<path d="M${bw.pt(j * 0.24 + (r % 2) * 0.12 - 0.12, gy + 1.5 - r * 0.2)} q${n(0.12 * bw.k)},${n(0.16 * bw.k)} ${n(0.24 * bw.k)},0" fill="${(j + r) % 4 ? M.jade : M.jadeS}" stroke="${INK}" stroke-width="${n(lw * 0.7)}"/>`;
    const gab = `M${bw.pt(-3.1, gy + 0.2)} Q${bw.pt(-1.9, gy + 0.12)} ${bw.pt(-1.15, gy + 0.72)} Q${bw.pt(0, gy + 1.5)} ${bw.pt(1.15, gy + 0.72)} Q${bw.pt(1.9, gy + 0.12)} ${bw.pt(3.1, gy + 0.2)} L${bw.pt(3.3, gy + 0.62)} Q${bw.pt(1.9, gy + 0.56)} ${bw.pt(1.2, gy + 1.14)} Q${bw.pt(0, gy + 1.96)} ${bw.pt(-1.2, gy + 1.14)} Q${bw.pt(-1.9, gy + 0.56)} ${bw.pt(-3.3, gy + 0.62)} Z`;
    s += shp(gab, M.gold, lw) + ln(`M${bw.pt(-3.05, gy + 0.3)} Q${bw.pt(-1.9, gy + 0.24)} ${bw.pt(-1.15, gy + 0.84)} Q${bw.pt(0, gy + 1.62)} ${bw.pt(1.15, gy + 0.84)} Q${bw.pt(1.9, gy + 0.24)} ${bw.pt(3.05, gy + 0.3)}`, M.goldS, 0.07 * bw.k) + ln(`M${bw.pt(-3.2, gy + 0.55)} Q${bw.pt(-1.9, gy + 0.49)} ${bw.pt(-1.2, gy + 1.07)} Q${bw.pt(0, gy + 1.88)} ${bw.pt(1.2, gy + 1.07)} Q${bw.pt(1.9, gy + 0.49)} ${bw.pt(3.2, gy + 0.55)}`, M.goldL, 0.03 * bw.k);
    s += shp(`M${bw.pt(0, gy + 1.42)} Q${bw.pt(-0.42, gy + 1.1)} ${bw.pt(-0.3, gy + 0.72)} Q${bw.pt(-0.1, gy + 0.86)} ${bw.pt(0, gy + 0.5)} Q${bw.pt(0.1, gy + 0.86)} ${bw.pt(0.3, gy + 0.72)} Q${bw.pt(0.42, gy + 1.1)} ${bw.pt(0, gy + 1.42)} Z`, M.lac, lw) + `<circle cx="${n(bw.x(0))}" cy="${n(bw.y(gy + 1.02))}" r="${n(0.1 * bw.k)}" fill="${M.goldL}" stroke="${INK}" stroke-width="${lw}"/>`;
  }
  // floor: tiles one by one, the vermilion runner
  for (let zi = Math.floor(ZB / 0.8); zi >= 0; zi--) { const z0 = zi * 0.8, z1 = z0 + 0.8; if (z1 <= c.z + NEAR + 0.05 || z0 >= ZB) continue;
    for (let xi = -6; xi < 6; xi++) { const x0 = xi * 0.8, id = zi * 31 + xi, gj = (X, Z) => Q(X + jit(X * 7 + Z * 13, 0.012), 0, Math.min(ZB, Z) + jit(X * 3 + Z * 5, 0.012)), q = [gj(x0, z1), gj(x0 + 0.8, z1), gj(x0 + 0.8, z0), gj(x0, z0)];
      if (q[1].x < -60 || q[0].x > W + 60 && q[3].x > W + 60) continue;
      const col = (xi + zi) % 2 ? M.floor : M.floorS;
      s += `<polygon points="${q.map(pt).join(" ")}" fill="${mix(col, M.floorL, hash(id) * 0.18)}" stroke="${INK}" stroke-width="${n(Math.min(1.6, q[3].s * 0.004))}"/>`;
      if ((xi + zi) % 2 && z0 > c.z + 0.6) { const m = Q(x0 + 0.4, 0, z0 + 0.4), r = 0.13 * m.s; s += `<path d="M${n(m.x - r)},${n(m.y)} L${n(m.x)},${n(m.y - r * 0.32)} L${n(m.x + r)},${n(m.y)} L${n(m.x)},${n(m.y + r * 0.32)} Z" fill="${hash(id + 5) < 0.3 ? M.gold : M.floorL}" opacity="0.85"/>`; }
    } }
  s += `<path d="${wpoly(c, [[-0.62, 0.004, 1.5], [-0.62, 0.004, 11], [0.62, 0.004, 11], [0.62, 0.004, 1.5]], 21, 0.012, 0.7)}" fill="${M.lac}" stroke="${INK}" stroke-width="1.4"/>`;
  for (const sd of [-1, 1]) s += `<path d="${wpoly(c, [[sd * 0.5, 0.005, 1.5], [sd * 0.5, 0.005, 11], [sd * 0.56, 0.005, 11], [sd * 0.56, 0.005, 1.5]], 23 + sd, 0.004, 0.9)}" fill="${M.gold}"/>`;
  for (let i = 0; i < 26; i++) { const Z = 1.9 + i * 0.36; if (!vis(c, Z)) continue; const X = jit(i + 600, 0.34), q = Q(X, 0, Z), u = 0.1 * q.s; s += ln(`M${n(q.x - u)},${n(q.y)} q${n(u * 0.5)},${n(-u * 0.22)} ${n(u)},0 q${n(u * 0.5)},${n(u * 0.22)} ${n(u)},0`, i % 3 ? M.lacS : M.gold, Math.max(1, 0.012 * q.s)); }
  // the dais
  for (const [hw, z0, y0, y1, sd] of [[1.7, 11.0, 0, 0.22, 31], [1.2, 11.5, 0.22, 0.45, 35]]) if (vis(c, z0)) {
    s += `<path d="${wpoly(c, [[-hw, y1, z0], [-hw, y1, ZB], [hw, y1, ZB], [hw, y1, z0]], sd, 0.01, 0.6)}" fill="${M.jade}" stroke="${INK}" stroke-width="${lw}"/>`;
    s += `<path d="${wpoly(c, [[-hw, y0, z0], [-hw, y1, z0], [hw, y1, z0], [hw, y0, z0]], sd + 1, 0.006, 0.6)}" fill="${M.lac}" stroke="${INK}" stroke-width="${lw}"/><path d="${wpoly(c, [[-hw, y1 - 0.05, z0], [-hw, y1, z0], [hw, y1, z0], [hw, y1 - 0.05, z0]], sd + 2, 0.004, 0.6)}" fill="${M.gold}" stroke="${INK}" stroke-width="${n(lw * 0.6)}"/>`;
  }
  for (const [X, sz, sd, col] of [[-2.45, 3.3, 3, M.coral], [2.5, 2.9, 8, M.coralO], [-1.55, 1.5, 12, M.coralP], [1.72, 1.7, 15, M.coral]]) { const q = Q(X, 0, 11.6); if (vis(c, 11.6)) s += coral(q.x, q.y, sz * q.s, sd, col, M.coralS); }
  { const q = Q(-2.9, 0, 10.6); if (vis(c, 10.6)) s += seaFan(q.x, q.y, 1.5 * q.s, 4) ; const q2 = Q(3.0, 0, 10.4); if (vis(c, 10.4)) s += seaFan(q2.x, q2.y, 1.2 * q2.s, 9, M.coralP); }
  // pillars, beams, ceiling: far to near; lantern jellyfish and fish drift between the rows
  const row = (Z, i) => {
    if (!vis(c, Z)) return "";
    const b = board(c, 0, 0, Z), l2 = b.lw; let g = "";
    const Zn = A.zs[i - 1] ?? Math.max(c.z + NEAR, Z - 2.8);
    g += `<polygon points="${[Q(-3.6, A.h + 0.45, Z), Q(3.6, A.h + 0.45, Z), Q(3.6, A.h + 0.45, Zn), Q(-3.6, A.h + 0.45, Zn)].map(pt).join(" ")}" fill="${mix(M.lacS, INK, 0.45)}"/>`;
    for (let j = -4; j <= 4; j++) { const a = Q(j * 0.8, A.h + 0.44, Z), b2 = Q(j * 0.8, A.h + 0.44, Zn); g += ln(`M${pt(a)} L${pt(b2)}`, M.lacS, Math.max(2, 0.07 * a.s)); }
    g += pillar(c, -A.px, Z, A.h, 3 + i * 5) + pillar(c, A.px, Z, A.h, 4 + i * 5);
    g += shp(hd(b, [[-3.8, A.h], [-3.8, A.h + 0.46], [3.8, A.h + 0.46], [3.8, A.h]], 40 + i, 0.012, 0.5), M.lac, l2) + flat(hd(b, [[-3.8, A.h + 0.01], [-3.8, A.h + 0.14], [3.8, A.h + 0.14], [3.8, A.h + 0.01]], 44 + i, 0.01, 0.5), M.lacS);
    for (let j = -4; j <= 4; j++) { const x = j * 0.62; g += shp(`M${b.pt(x - 0.1, A.h + 0.23)} L${b.pt(x, A.h + 0.36)} L${b.pt(x + 0.1, A.h + 0.23)} L${b.pt(x, A.h + 0.1)} Z`, j % 2 ? M.gold : M.jade, l2 * 0.7); }
    return g;
  };
  const rows = A.zs.map((Z, i) => row(Z, i));
  const lan = (X, Y, Z, r, sd) => { if (!vis(c, Z)) return ""; const q = Q(X, Y + 0.12 * Math.sin(t * 0.9 + sd), Z); return jelly({ x: q.x, y: q.y, r: r * q.s, seed: sd, lit }, t); };
  s += rows[2] + lan(-0.95, 4.3, 9.0, 0.3, 2) + lan(1.05, 3.7, 8.6, 0.26, 5);
  if (o.fish !== false) for (let i = 0; i < 3; i++) { const X = ((t * 0.35 + i * 2.1) % 7) - 3.5, q = Q(X, 3.0 + i * 0.8 + 0.2 * Math.sin(t + i), 8.2); s += fish(q.x, q.y, (0.5 + 0.12 * i) * q.s, 1, i === 1 ? 1 : 0, t * 7 + i); }
  s += rows[1] + lan(0.85, 4.9, 6.2, 0.26, 7) + lan(-0.9, 5.2, 5.4, 0.22, 9);
  let front = rows[0];
  if (o.fish !== false) { const q = Q(1.2 - ((t * 0.3) % 4), 3.9 + 0.15 * Math.sin(t * 1.1), 3.6); front += fish(q.x, q.y, 0.62 * q.s, -1, 0, t * 7); }
  front += bubbles(t, 8, 12, 4, 13);
  return { back: s, front };
}

// ---------------------------------------------------------------- the four-season windows
// One bold colour each: 0 spring (cherry pink), 1 summer (green), 2 autumn (maple crimson), 3 winter (snow white).
// seasonView paints one season into a screen box (use it full-frame too: seasonView(k, 0, 0, W, H, t)).
export const SEASON_COL = [["#ff7fae", "#ffb6cf", "#e2528c"], ["#10ac58", "#86e268", "#0a7a48"], ["#d81c2c", "#ff7a1c", "#9c0e2c"], ["#d6e6f6", "#ffffff", "#aac2de"]];
export function seasonView(k, x, y, w, h, t = 0) {
  const X = (u) => x + u * w, Y = (v) => y + v * h, [bg, bg2, far] = SEASON_COL[k], lw = Math.max(1, w * 0.004), tw = "#2e1a2c";
  const edge = (v, sd, am) => `M${n(X(-0.05))},${n(Y(1.05))} L` + Array.from({ length: 9 }, (_, i) => `${n(X(-0.05 + i * 0.14))},${n(Y(v + jit(sd + i, am)))}`).join(" L") + ` L${n(X(1.05))},${n(Y(1.05))} Z`;
  const hill = (v, sd, hh) => `M${n(X(-0.05))},${n(Y(1.05))} L` + Array.from({ length: 11 }, (_, i) => `${n(X(-0.05 + i * 0.11))},${n(Y(v - hh * Math.sin(i / 10 * Math.PI) ** 0.7 * (0.6 + 0.6 * hash(sd + i))))}`).join(" L") + ` L${n(X(1.05))},${n(Y(1.05))} Z`;
  // a branch as a tapering stroke chain; returns the points along it for the flowers/leaves
  const branch = (pts2, w0) => { let g = ""; for (let i = 1; i < pts2.length; i++) { const a = pts2[i - 1], b2 = pts2[i], ww = w0 * (1 - (i - 1) / pts2.length * 0.8) * w; g += ln(`M${n(X(a[0]))},${n(Y(a[1]))} L${n(X(b2[0]))},${n(Y(b2[1]))}`, INK, ww + lw * 2) ; } for (let i = 1; i < pts2.length; i++) { const a = pts2[i - 1], b2 = pts2[i], ww = w0 * (1 - (i - 1) / pts2.length * 0.8) * w; g += ln(`M${n(X(a[0]))},${n(Y(a[1]))} L${n(X(b2[0]))},${n(Y(b2[1]))}`, tw, ww); } return g; };
  const main = [[-0.05, 0.78], [0.12, 0.7], [0.27, 0.6], [0.4, 0.55], [0.55, 0.44], [0.7, 0.4], [0.84, 0.3], [1.05, 0.24]], tA = [[0.27, 0.6], [0.3, 0.46], [0.4, 0.36], [0.44, 0.24]], tB = [[0.55, 0.44], [0.6, 0.58], [0.72, 0.66], [0.8, 0.76]], tC = [[0.7, 0.4], [0.74, 0.26], [0.84, 0.16]];
  const spots = (cnt, sd) => Array.from({ length: cnt }, (_, i) => { const br = [main, tA, tB, tC][i % 4], u = hash(sd + i) * (br.length - 1), j = Math.min(br.length - 2, Math.floor(u)), f = u - j; return [lerp(br[j][0], br[j + 1][0], f) + jit(sd + i * 3, 0.05), lerp(br[j][1], br[j + 1][1], f) + jit(sd + i * 5, 0.05)]; });
  const fall = (i, sp) => { const yy = (hash(i + 70) + t * sp * (0.6 + 0.6 * hash(i))) % 1.1 - 0.05; return [hash(i + 80) + Math.sin(t * 1.2 + i) * 0.04 + yy * 0.1, yy]; };
  let s = `<rect x="${n(x - 2)}" y="${n(y - 2)}" width="${n(w + 4)}" height="${n(h + 4)}" fill="${bg}"/>`;
  if (k === 0) {
    s += flat(edge(0.3, 3, 0.03), mix(bg, bg2, 0.5)) + flat(hill(0.72, 5, 0.16), far) + flat(edge(0.82, 7, 0.02), bg2) + `<circle cx="${n(X(0.78))}" cy="${n(Y(0.14))}" r="${n(w * 0.1)}" fill="#fff4e0"/>`;
    s += branch(main, 0.035) + branch(tA, 0.018) + branch(tB, 0.018) + branch(tC, 0.014);
    for (const [i, [u, v]] of spots(30, 11).entries()) { const r = w * (0.026 + 0.016 * hash(i + 3)), rot = hash(i) * 72, col = i % 3 ? "#fff2f6" : "#ffd0e0";
      s += `<g transform="translate(${n(X(u))},${n(Y(v))}) rotate(${n(rot)})">` + [0, 72, 144, 216, 288].map((a) => `<path d="M0,0 Q${n(-r * 0.6)},${n(-r * 0.7)} ${n(-r * 0.12)},${n(-r * 1.15)} L0,${n(-r * 0.95)} L${n(r * 0.12)},${n(-r * 1.15)} Q${n(r * 0.6)},${n(-r * 0.7)} 0,0 Z" fill="${col}" stroke="${INK}" stroke-width="${n(lw * 0.6)}" transform="rotate(${a})"/>`).join("") + `<circle r="${n(r * 0.22)}" fill="#e02868"/>` + [0, 120, 240].map((a) => `<circle cx="${n(Math.cos(a) * r * 0.4)}" cy="${n(Math.sin(a) * r * 0.4)}" r="${n(r * 0.07)}" fill="#ffd23a"/>`).join("") + `</g>`; }
    for (let i = 0; i < 18; i++) { const [u, v] = fall(i, 0.16), r = w * 0.016; s += `<path d="M0,0 Q${n(-r)},${n(-r)} 0,${n(-r * 1.8)} Q${n(r)},${n(-r)} 0,0 Z" fill="#fff2f6" stroke="${INK}" stroke-width="${n(lw * 0.5)}" transform="translate(${n(X(u))},${n(Y(v))}) rotate(${n(t * 90 * (i % 2 ? 1 : -1) + i * 50)})"/>`; }
  } else if (k === 1) {
    s += flat(edge(0.34, 3, 0.03), mix(bg, bg2, 0.55)) + `<circle cx="${n(X(0.74))}" cy="${n(Y(0.17))}" r="${n(w * 0.13)}" fill="#fff8a8"/>` + flat(ring(X(0.74), Y(0.17), w * 0.2, 3, 0.06), "#fff8a8", `opacity="0.3"`) + flat(hill(0.8, 5, 0.2), far) + flat(edge(0.88, 7, 0.02), "#0a6a40");
    for (const [i, bx] of [0.14, 0.33, 0.62, 0.9].entries()) {       // bamboo: every joint, every leaf
      const lean = jit(i + 3, 0.05), bwid = w * (0.03 + 0.012 * hash(i));
      for (let j = 0; j < 8; j++) { const v0 = 1.02 - j * 0.14, v1 = v0 - 0.132, xx = (v) => X(bx + lean * (1 - v)); s += `<path d="M${n(xx(v0) - bwid / 2)},${n(Y(v0))} L${n(xx(v1) - bwid / 2)},${n(Y(v1))} L${n(xx(v1) + bwid / 2)},${n(Y(v1))} L${n(xx(v0) + bwid / 2)},${n(Y(v0))} Z" fill="${i % 2 ? "#0c7c46" : "#0a6a3e"}" stroke="${INK}" stroke-width="${lw}"/>` + ln(`M${n(xx(v0) - bwid * 0.22)},${n(Y(v0 - 0.01))} L${n(xx(v1) - bwid * 0.22)},${n(Y(v1 + 0.01))}`, "#5fd07a", bwid * 0.16);
        if (j > 1 && (j + i) % 2) { const sd = (j + i) % 4 < 2 ? 1 : -1, ox = xx(v1) + sd * bwid / 2, oy = Y(v1); for (let m = 0; m < 4; m++) { const a = (sd > 0 ? -0.2 : Math.PI + 0.2) + sd * (m - 1.2) * 0.42, l = w * (0.13 + 0.05 * hash(i * 9 + j + m)), ex = ox + Math.cos(a) * l, ey = oy + Math.sin(a) * l + l * 0.25, nx = -Math.sin(a) * l * 0.13, ny = Math.cos(a) * l * 0.13; s += `<path d="M${n(ox)},${n(oy)} Q${n((ox + ex) / 2 + nx)},${n((oy + ey) / 2 + ny)} ${n(ex)},${n(ey)} Q${n((ox + ex) / 2 - nx)},${n((oy + ey) / 2 - ny)} ${n(ox)},${n(oy)} Z" fill="${m % 2 ? "#b6f07c" : "#12a050"}" stroke="${INK}" stroke-width="${n(lw * 0.7)}"/>`; } }
      }
    }
    const dx = X(0.5 + 0.08 * Math.sin(t * 1.3)), dy = Y(0.36 + 0.03 * Math.sin(t * 2.1)), u = w * 0.05;     // one dragonfly
    s += `<g transform="translate(${n(dx)},${n(dy)}) rotate(-18)">${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b2]) => `<ellipse cx="${n(a * u * 0.75)}" cy="${n(b2 * u * 0.12 - u * 0.1)}" rx="${n(u * 0.75)}" ry="${n(u * 0.17)}" fill="#eafff0" fill-opacity="0.8" stroke="${INK}" stroke-width="${n(lw * 0.5)}" transform="rotate(${a * b2 * 14 + Math.sin(t * 40) * 6})"/>`).join("")}<path d="M0,${n(-u * 0.3)} L0,${n(u * 1.5)}" stroke="${INK}" stroke-width="${n(u * 0.2)}" stroke-linecap="round"/><path d="M0,${n(-u * 0.3)} L0,${n(u * 1.5)}" stroke="#e8321e" stroke-width="${n(u * 0.1)}" stroke-linecap="round"/><circle cy="${n(-u * 0.36)}" r="${n(u * 0.16)}" fill="${INK}"/></g>`;
  } else if (k === 2) {
    s += flat(edge(0.36, 3, 0.03), mix(bg, bg2, 0.45)) + flat(hill(0.74, 5, 0.18), far) + flat(edge(0.84, 7, 0.02), bg2);
    s += branch(main, 0.03) + branch(tA, 0.016) + branch(tB, 0.016) + branch(tC, 0.012);
    const leaf = (cx, cy, r, rot, col) => { const a = []; for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2 - Math.PI / 2, tip = i % 2 === 0, lobe = [1, 0.92, 0.7, 0.42][Math.min(3, Math.min(i / 2, 7 - i / 2) | 0)] ?? 0.4; a.push(`${n(Math.cos(an) * r * (tip ? lobe : 0.3))},${n(Math.sin(an) * r * (tip ? lobe : 0.3))}`); } return `<g transform="translate(${n(cx)},${n(cy)}) rotate(${n(rot)})"><path d="M${a.join(" L")} Z" fill="${col}" stroke="${INK}" stroke-width="${n(lw * 0.6)}"/>${[0, 2, 4, 10, 12].map((i) => { const an = (i / 14) * Math.PI * 2 - Math.PI / 2; return `<path d="M0,0 L${n(Math.cos(an) * r * 0.7)},${n(Math.sin(an) * r * 0.7)}" stroke="#8a1020" stroke-width="${n(lw * 0.5)}"/>`; }).join("")}<path d="M0,0 L0,${n(r * 0.75)}" stroke="${tw}" stroke-width="${n(lw)}"/></g>`; };
    const cols = ["#ffb41e", "#ff6a1e", "#ffe24c", "#8c0e26", "#ff8a1e"];
    for (const [i, [u, v]] of spots(34, 23).entries()) s += leaf(X(u), Y(v), w * (0.04 + 0.022 * hash(i + 3)), hash(i) * 360, cols[i % 5]);
    for (let i = 0; i < 12; i++) { const [u, v] = fall(i, 0.13); s += leaf(X(u), Y(v), w * 0.032, t * 70 * (i % 2 ? 1 : -1) + i * 40, cols[(i + 1) % 5]); }
  } else {
    s += flat(edge(0.3, 3, 0.03), "#c0d6ee") + flat(hill(0.7, 5, 0.2), far) + flat(hill(0.82, 9, 0.08), bg2) + ln(`M${n(X(0.1))},${n(Y(0.9))} q${n(w * 0.2)},${n(-h * 0.03)} ${n(w * 0.4)},0 M${n(X(0.5))},${n(Y(0.95))} q${n(w * 0.15)},${n(-h * 0.02)} ${n(w * 0.35)},0`, far, lw * 1.4);
    s += branch(main, 0.03) + branch(tA, 0.016) + branch(tB, 0.016) + branch(tC, 0.012);
    for (const br of [main, tA, tB, tC]) for (let i = 1; i < br.length; i++) { const a = br[i - 1], b2 = br[i], cx = X((a[0] + b2[0]) / 2), cy = Y((a[1] + b2[1]) / 2) - w * 0.022, rw = Math.hypot(X(b2[0]) - X(a[0]), Y(b2[1]) - Y(a[1])) * 0.42, an = Math.atan2(Y(b2[1]) - Y(a[1]), X(b2[0]) - X(a[0])) * 180 / Math.PI;   // snow lying on the branch
      if (Math.abs(an) < 60) s += `<path d="M${n(-rw)},${n(w * 0.012)} Q${n(-rw * 0.9)},${n(-w * 0.04)} ${n(-rw * 0.3)},${n(-w * 0.03)} Q${n(rw * 0.2)},${n(-w * 0.055)} ${n(rw * 0.8)},${n(-w * 0.024)} Q${n(rw * 1.1)},${n(0)} ${n(rw)},${n(w * 0.012)} Z" fill="#fff" stroke="${far}" stroke-width="${lw}" transform="translate(${n(cx)},${n(cy)}) rotate(${n(an)})"/>`; }
    for (const [u, v] of [[0.42, 0.27], [0.82, 0.19], [0.78, 0.74]]) for (let i = 0; i < 6; i++) s += `<circle cx="${n(X(u) + jit(i + u * 50, w * 0.03))}" cy="${n(Y(v) + jit(i + v * 60, w * 0.03))}" r="${n(w * 0.012)}" fill="#e8221e" stroke="${INK}" stroke-width="${n(lw * 0.5)}"/>`;
    for (let i = 0; i < 46; i++) { const [u, v] = fall(i, 0.1), r = w * (0.006 + 0.01 * hash(i + 5)); s += `<circle cx="${n(X(u))}" cy="${n(Y(v))}" r="${n(r)}" fill="#fff" stroke="${far}" stroke-width="${n(lw * 0.6)}"/>`; }
  }
  return s;
}
export const SEASONS = { z: 7, w: 1.5, h: 1.95, wins: [{ k: 0, X: -0.92, Y: 2.72 }, { k: 1, X: 0.92, Y: 2.72 }, { k: 2, X: -0.92, Y: 0.42 }, { k: 3, X: 0.92, Y: 0.42 }],
  cam: { all: { x: 0, y: 2.55, z: 1.9, h0: 960 } }, camOf: (k) => ({ x: [-0.92, 0.92][k % 2], y: k < 2 ? 3.7 : 1.4, z: 4.9, h0: 960 }) };
// the wall of four windows. o: { open: [1,1,1,1] (0 = shutter closed, per window), focus: k (the others dim) }
export function seasons(c, t, o = {}) {
  const A = SEASONS, b = board(c, 0, 0, A.z), lw = b.lw, open = o.open || [1, 1, 1, 1];
  let s = `<rect width="${W}" height="${H}" fill="${M.pwallS}"/>` + shp(hd(b, [[-3.4, 0], [-3.4, 8.6], [3.4, 8.6], [3.4, 0]], 3, 0.012, 0.7), M.pwall, lw);
  for (let i = 0; i < 60; i++) { const x = jit(i + 400, 3.2), y = 0.3 + hash(i + 440) * 8, l = 0.1 + 0.25 * hash(i + 3); s += ln(`M${b.pt(x, y)} l${n(l * b.k)},${n(jit(i, 0.02) * b.k)}`, i % 3 ? M.pwallL : M.pwallS, (0.016 + 0.024 * hash(i + 9)) * b.k, `opacity="${n(0.35 + 0.3 * hash(i + 6))}"`); }
  for (const x of [-1.92, 0, 1.92]) s += shp(hd(b, [[x - 0.09, 0], [x - 0.09, 8.6], [x + 0.09, 8.6], [x + 0.09, 0]], 7 + x, 0.008, 0.7), M.lac, lw) + flat(hd(b, [[x + 0.02, 0], [x + 0.02, 8.6], [x + 0.085, 8.6], [x + 0.085, 0]], 9 + x, 0.006, 0.7), M.lacS);
  // above the windows: gold cloud curls; below: the jade floor
  for (const [x, y, sc2, fl] of [[-1.0, 5.75, 1, 1], [1.05, 5.9, 0.85, -1], [-0.9, 6.9, 0.7, -1], [0.9, 7.1, 0.8, 1]]) { const u = 0.3 * sc2 * b.k, X0 = b.x(x), Y0 = b.y(y), d = `M${n(X0 - u * 1.5 * fl)},${n(Y0)} q${n(u * 0.7 * fl)},${n(-u * 0.9)} ${n(u * 1.3 * fl)},${n(-u * 0.2)} q${n(u * 0.5 * fl)},${n(-u * 0.9)} ${n(u * 1.2 * fl)},${n(-u * 0.1)} q${n(u * 0.5 * fl)},${n(u * 0.6)} ${n(-u * 0.15 * fl)},${n(u * 0.7)} q${n(-u * 0.5 * fl)},${n(0.1 * u)} ${n(-u * 0.45 * fl)},${n(-u * 0.3)} M${n(X0 - u * 1.5 * fl)},${n(Y0)} q${n(u * 1.2 * fl)},${n(u * 0.35)} ${n(u * 2.6 * fl)},${n(u * 0.3)}`; s += ln(d, M.goldS, 0.05 * b.k) + ln(d, M.gold, 0.028 * b.k); }
  for (let zi = 0; zi < 8; zi++) for (let xi = -5; xi < 5; xi++) { const z0 = A.z - (zi + 1) * 0.7, z1 = z0 + 0.7; if (z0 < c.z + NEAR) continue; const q = [P(c, xi * 0.7, 0, z1), P(c, xi * 0.7 + 0.7, 0, z1), P(c, xi * 0.7 + 0.7, 0, z0), P(c, xi * 0.7, 0, z0)]; s += `<polygon points="${q.map(pt).join(" ")}" fill="${(xi + zi) % 2 ? M.floor : M.floorS}" stroke="${INK}" stroke-width="1"/>`; }
  for (const y of [0.16, 2.48, 4.94]) s += shp(hd(b, [[-3.4, y - 0.08], [-3.4, y + 0.08], [3.4, y + 0.08], [3.4, y - 0.08]], 11 + y, 0.008, 0.7), M.lac, lw) + [-1.92, 0, 1.92].map((x) => shp(hd(b, [[x - 0.14, y - 0.12], [x - 0.14, y + 0.12], [x + 0.14, y + 0.12], [x + 0.14, y - 0.12]], 13 + x + y, 0.006, 0.2), M.gold, lw) + `<circle cx="${n(b.x(x))}" cy="${n(b.y(y))}" r="${n(0.045 * b.k)}" fill="${M.goldL}" stroke="${INK}" stroke-width="${n(lw * 0.6)}"/>`).join("");
  for (const wn of A.wins) {
    const hw = A.w / 2, hh = A.h, x0 = wn.X, y0 = wn.Y, id = `sw${UID++}`;
    // a bell-shaped (katomado) opening
    const sh2 = [[-hw, 0], [-hw, hh * 0.56], [-hw * 0.9, hh * 0.7], [-hw * 0.56, hh * 0.8], [-hw * 0.22, hh * 0.9], [0, hh], [hw * 0.22, hh * 0.9], [hw * 0.56, hh * 0.8], [hw * 0.9, hh * 0.7], [hw, hh * 0.56], [hw, 0]].map(([x, y]) => [x0 + x, y0 + y]);
    const d = hd(b, sh2, 20 + wn.k, 0.006, 0.4), X0 = b.x(x0 - hw), Y0 = b.y(y0 + hh), ww = A.w * b.k, hp = hh * b.k, dim = o.focus != null && o.focus !== wn.k;
    s += `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${seasonView(wn.k, X0, Y0, ww, hp, t)}`;
    s += `<path d="M${n(X0)},${n(Y0)} h${n(ww)} v${n(hp * 0.07)} L${n(X0)},${n(Y0 + hp * 0.16)} Z" fill="${INK}" opacity="0.16"/>`;
    const op = open[wn.k] ?? 1;
    if (op < 0.99) for (const sd of [-1, 1]) { const sx = sd < 0 ? X0 - op * ww * 0.5 : X0 + ww * 0.5 + op * ww * 0.5; s += `<rect x="${n(sx)}" y="${n(Y0)}" width="${n(ww * 0.5)}" height="${n(hp)}" fill="${M.jadeS}" stroke="${INK}" stroke-width="${lw}"/>` + Array.from({ length: 5 }, (_, i) => ln(`M${n(sx + (i + 0.5) * ww * 0.1)},${n(Y0)} v${n(hp)}`, M.jade, ww * 0.02)).join(""); }
    if (dim) s += `<rect x="${n(X0)}" y="${n(Y0)}" width="${n(ww)}" height="${n(hp)}" fill="${M.pwallS}" opacity="0.6"/>`;
    s += `</g>`;
    s += ln(d, INK, 0.2 * b.k) + ln(d, M.lac, 0.2 * b.k - lw * 2) + ln(d, M.lacL, 0.03 * b.k, `transform="translate(${n(-0.04 * b.k)},${n(-0.04 * b.k)})" opacity="0.8"`) + ln(d, M.gold, 0.035 * b.k) ;
    s += shp(hd(b, [[x0 - hw - 0.2, y0 - 0.14], [x0 - hw - 0.16, y0 + 0.02], [x0 + hw + 0.16, y0 + 0.02], [x0 + hw + 0.2, y0 - 0.14]], 30 + wn.k, 0.006, 0.4), M.jade, lw) + flat(hd(b, [[x0 - hw - 0.19, y0 - 0.13], [x0 - hw - 0.18, y0 - 0.07], [x0 + hw + 0.18, y0 - 0.07], [x0 + hw + 0.19, y0 - 0.13]], 34 + wn.k, 0.004, 0.4), M.jadeS);
    for (const sd of [-1, 1]) s += shp(hd(b, [[x0 + sd * (hw + 0.11), y0 + 0.03], [x0 + sd * (hw + 0.11), y0 + 0.34], [x0 + sd * (hw - 0.1), y0 + 0.34], [x0 + sd * (hw - 0.1), y0 + 0.22], [x0 + sd * (hw - 0.3), y0 + 0.03]], 38 + sd + wn.k, 0.005, 0.2), M.gold, lw) + `<circle cx="${n(b.x(x0 + sd * hw))}" cy="${n(b.y(y0 + 0.2))}" r="${n(0.03 * b.k)}" fill="${M.goldL}" stroke="${INK}" stroke-width="${n(lw * 0.6)}"/>`;
    s += shp(ring(b.x(x0), b.y(y0 + hh + 0.14), 0.085 * b.k, 3 + wn.k, 0.05, 10), M.gold, lw) + flat(ring(b.x(x0), b.y(y0 + hh + 0.14), 0.04 * b.k, 5, 0.05, 8), SEASON_COL[wn.k][0]);
  }
  return s;
}

// ---------------------------------------------------------------- set (d): the fishing village, then and 300 years on
export const VILLAGE = { hut: { X: -2.5, Z: 9.2 }, grave: { X: 0.75, Z: 5.4 }, stand: { X: -0.35, Z: 5.0 }, pines: [{ X: 2.9, Z: 7.0 }, { X: -4.9, Z: 8.3 }],
  cam: { wide: { x: 0, y: 1.55, z: -1.6, h0: 800 }, grave: { x: 0.25, y: 1.0, z: 2.0, h0: 1010 } } };
function straws(b, x0, x1, y0, y1, count, seed, cols, len = 0.3) {
  let s = "";
  for (let i = 0; i < count; i++) { const u = hash(seed + i * 3), v = hash(seed + i * 5), x = lerp(x0, x1, u), y = lerp(y1, y0, v), l = len * (0.6 + 0.7 * hash(seed + i * 7)); s += ln(`M${b.pt(x, y)} L${b.pt(x + jit(seed + i, 0.03), y - l)}`, cols[i % cols.length], b.lw * (0.7 + 0.6 * hash(i)), `opacity="0.85"`); }
  return s;
}
function hut(c, o) {
  const { X, Z } = o; if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z), lw = b.lw;
  let s = shadow(b.p, 2.1);
  s += shp(hd(b, [[1.5, 0], [1.5, 1.5], [2.1, 1.62], [2.1, 0.1]], 2, 0.012), M.woodS, lw);
  s += shp(hd(b, [[-1.6, 0], [-1.6, 1.55], [1.5, 1.55], [1.5, 0]], 1, 0.014, 0.4), M.wood, lw);
  for (let i = 0; i < 13; i++) { const x = -1.6 + i * 0.24 + jit(i + 3, 0.02); s += ln(`M${b.pt(x, 0.02)} L${b.pt(x + jit(i, 0.015), 1.54)}`, INK, lw * 0.7) + ln(`M${b.pt(x + 0.08, 0.3 + hash(i) * 0.5)} l${n(jit(i + 9, 0.01) * b.k)},${n(-(0.2 + 0.3 * hash(i + 4)) * b.k)}`, i % 3 ? M.woodS : M.woodL, lw * 0.7); }
  s += shp(hd(b, [[-0.4, 0], [-0.4, 1.25], [0.45, 1.25], [0.45, 0]], 5, 0.01), mix(M.woodS, INK, 0.6), lw);
  for (let i = 0; i < 12; i++) { const x = -0.38 + i * 0.07; s += ln(`M${b.pt(x, 1.25)} L${b.pt(x + jit(i + 20, 0.015), 0.62 + 0.14 * hash(i + 21))}`, i % 2 ? M.thatch : M.thatchS, lw * 1.3); }
  s += shp(hd(b, [[0.8, 0.7], [0.8, 1.15], [1.25, 1.15], [1.25, 0.7]], 7, 0.008), mix(M.woodS, INK, 0.6), lw) + ln(`M${b.pt(0.95, 0.7)} L${b.pt(0.95, 1.15)} M${b.pt(1.1, 0.7)} L${b.pt(1.1, 1.15)} M${b.pt(0.8, 0.92)} L${b.pt(1.25, 0.92)}`, M.wood, lw * 1.6);
  const roof = [[-2.0, 1.42], [-1.15, 2.72], [1.3, 2.72], [2.5, 1.5], [2.1, 1.4], [1.5, 1.36]];
  s += shp(hd(b, roof, 9, 0.03, 0.2), M.thatch, lw) + flat(hd(b, [[1.3, 2.72], [2.5, 1.5], [2.1, 1.4], [1.25, 2.4]], 11, 0.02, 0.2), M.thatchS) + flat(hd(b, [[-2.0, 1.42], [-1.9, 1.6], [1.5, 1.55], [1.5, 1.36]], 13, 0.015, 0.2), M.thatchS);
  s += straws(b, -1.7, 1.4, 1.6, 2.6, 110, 31, [M.thatchS, mix(M.thatch, "#ffffff", 0.35), mix(M.thatchS, INK, 0.4)], 0.26) + straws(b, -1.95, 1.5, 1.34, 1.44, 40, 37, [M.thatchS, INK], 0.12);
  s += shp(hd(b, [[-1.3, 2.68], [-1.3, 2.84], [1.42, 2.84], [1.42, 2.68]], 15, 0.01), M.woodS, lw);
  for (const x of [-1.0, -0.2, 0.6, 1.2]) s += ln(`M${b.pt(x - 0.22, 2.5)} L${b.pt(x + 0.1, 3.02)} M${b.pt(x + 0.22, 2.5)} L${b.pt(x - 0.1, 3.02)}`, INK, 0.07 * b.k + lw * 1.6) + ln(`M${b.pt(x - 0.22, 2.5)} L${b.pt(x + 0.1, 3.02)} M${b.pt(x + 0.22, 2.5)} L${b.pt(x - 0.1, 3.02)}`, M.woodL, 0.07 * b.k);
  // fish drying on a rack by the door
  const rx = -1.25; s += ln(`M${b.pt(rx - 0.5, 0)} L${b.pt(rx - 0.42, 1.1)} M${b.pt(rx + 0.5, 0)} L${b.pt(rx + 0.44, 1.1)} M${b.pt(rx - 0.56, 1.02)} L${b.pt(rx + 0.56, 1.06)}`, INK, 0.05 * b.k + lw * 1.4) + ln(`M${b.pt(rx - 0.5, 0)} L${b.pt(rx - 0.42, 1.1)} M${b.pt(rx + 0.5, 0)} L${b.pt(rx + 0.44, 1.1)} M${b.pt(rx - 0.56, 1.02)} L${b.pt(rx + 0.56, 1.06)}`, M.woodL, 0.05 * b.k);
  for (let i = 0; i < 5; i++) { const x = rx - 0.36 + i * 0.18; s += `<g transform="translate(${n(b.x(x))},${n(b.y(0.86))}) rotate(${n(90 + jit(i, 6))})">${fish(0, 0, 0.3 * b.k, -1, 2, 0)}</g>`; }
  return s;
}
function tileHouse(c, o) {
  const { X, Z, w = 4.2, seed = 1 } = o; if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z), lw = b.lw, hw = w / 2;
  const roof = (y, rw, hh) => { let g = shp(hd(b, [[-rw / 2 - 0.35, y - 0.06], [-rw / 2 - 0.2, y + 0.1], [-rw * 0.3, y + hh], [rw * 0.3, y + hh], [rw / 2 + 0.2, y + 0.1], [rw / 2 + 0.35, y - 0.06]], seed + y, 0.012, 0.4), M.tile, lw);
    for (let r = 0; r < 4; r++) for (let j = 0; j < 18; j++) { const f = r / 4, xw = lerp(rw / 2 + 0.2, rw * 0.3, f), x = lerp(-xw, xw, (j + 0.5 * (r % 2)) / 18); g += `<path d="M${b.pt(x - 0.07, y + 0.08 + f * (hh - 0.1))} q${n(0.07 * b.k)},${n(0.09 * b.k)} ${n(0.14 * b.k)},0" fill="none" stroke="${(j + r) % 5 ? INK : M.tileL}" stroke-width="${n(lw * 0.8)}"/>`; }
    return g + shp(hd(b, [[-rw * 0.32, y + hh - 0.03], [-rw * 0.32, y + hh + 0.1], [rw * 0.32, y + hh + 0.1], [rw * 0.32, y + hh - 0.03]], seed + 2, 0.008, 0.4), M.tileL, lw) + ln(`M${b.pt(-rw / 2 - 0.33, y - 0.03)} L${b.pt(rw / 2 + 0.33, y - 0.03)}`, M.tileL, lw * 2); };
  let s = shadow(b.p, hw * 1.1);
  s += shp(hd(b, [[-hw, 0], [-hw, 2.3], [hw, 2.3], [hw, 0]], seed, 0.012, 0.5), M.plaster, lw) + flat(hd(b, [[-hw, 0], [-hw, 0.55], [hw, 0.55], [hw, 0]], seed + 1, 0.01, 0.5), M.woodS) + flat(hd(b, [[hw * 0.5, 0.56], [hw * 0.55, 2.28], [hw - 0.02, 2.28], [hw - 0.02, 0.56]], seed + 3, 0.02, 0.4), M.plasterS, `opacity="0.6"`);
  for (let i = 0; i <= 5; i++) s += shp(hd(b, [[-hw + i * w / 5 - 0.05, 0], [-hw + i * w / 5 - 0.05, 2.3], [-hw + i * w / 5 + 0.05, 2.3], [-hw + i * w / 5 + 0.05, 0]], seed + 5 + i, 0.006, 0.6), M.trunk, lw * 0.7);
  for (const [x0, x1] of [[-hw + w / 5 + 0.08, -hw + 2 * w / 5 - 0.08], [-hw + 3 * w / 5 + 0.08, -hw + 4 * w / 5 - 0.08]]) { s += shp(hd(b, [[x0, 0.02], [x0, 1.75], [x1, 1.75], [x1, 0.02]], seed + x0, 0.006), mix(M.plaster, M.tile, 0.4), lw); for (let j = 1; j < 9; j++) s += ln(`M${b.pt(lerp(x0, x1, j / 9), 0.04)} L${b.pt(lerp(x0, x1, j / 9) + jit(j + x0, 0.006), 1.73)}`, M.trunk, lw * 1.3); }
  s += roof(2.25, w, 0.55) + shp(hd(b, [[-hw * 0.72, 2.75], [-hw * 0.72, 3.7], [hw * 0.72, 3.7], [hw * 0.72, 2.75]], seed + 20, 0.01, 0.5), M.plaster, lw);
  for (let i = 0; i < 9; i++) s += ln(`M${b.pt(-hw * 0.5 + i * hw * 0.125, 2.95)} L${b.pt(-hw * 0.5 + i * hw * 0.125, 3.5)}`, M.trunk, lw * 1.3);
  s += ln(`M${b.pt(-hw * 0.56, 2.92)} L${b.pt(hw * 0.56, 2.92)} M${b.pt(-hw * 0.56, 3.52)} L${b.pt(hw * 0.56, 3.52)}`, M.trunk, lw * 2) + roof(3.66, w * 0.76, 0.75);
  return s;
}
// the grave: a rough stone under moss. No inscription, only weather.
export function grave(c, o = {}) {
  const { X = VILLAGE.grave.X, Z = VILLAGE.grave.Z, size = 1 } = o; if (!vis(c, Z)) return "";
  const b = board(c, X, 0, Z, size), lw = b.lw;
  let s = shadow(b.p, 0.5 * size);
  s += shp(hd(b, [[-0.42, 0], [-0.46, 0.16], [-0.3, 0.24], [0.34, 0.25], [0.47, 0.14], [0.44, 0]], 3, 0.012, 0.12), M.stoneS, lw) + flat(hd(b, [[-0.4, 0.14], [-0.3, 0.23], [0.3, 0.24], [0.1, 0.13]], 5, 0.01, 0.12), M.stone);
  const body = [[-0.22, 0.22], [-0.25, 0.7], [-0.2, 1.02], [-0.08, 1.14], [0.08, 1.15], [0.2, 1.04], [0.25, 0.72], [0.23, 0.22]];
  s += shp(hd(b, body, 7, 0.012, 0.1), M.stone, lw) + flat(hd(b, [[0.08, 0.23], [0.1, 0.7], [0.04, 1.1], [0.2, 1.03], [0.24, 0.72], [0.22, 0.23]], 9, 0.01, 0.1), M.stoneS);
  s += ln(`M${b.pt(-0.06, 1.12)} L${b.pt(-0.02, 0.92)} L${b.pt(-0.07, 0.8)} L${b.pt(-0.03, 0.66)} M${b.pt(-0.02, 0.92)} L${b.pt(0.05, 0.86)} M${b.pt(0.2, 0.5)} L${b.pt(0.12, 0.44)} L${b.pt(0.14, 0.34)}`, INK, lw * 0.8);
  for (const [x, y, r, sd] of [[-0.12, 1.06, 0.13, 1], [-0.2, 0.74, 0.09, 2], [0.14, 0.9, 0.08, 3], [-0.14, 0.32, 0.12, 4], [0.18, 0.3, 0.09, 5], [-0.3, 0.2, 0.12, 6], [0.3, 0.22, 0.1, 7], [0.0, 0.52, 0.06, 8]]) {   // moss, tuft by tuft
    s += shp(ring(b.x(x), b.y(y), r * b.k, sd * 7, 0.22, 11, 0.7), sd % 3 ? M.moss : M.mossS, lw * 0.7);
    for (let i = 0; i < 6; i++) { const mx = x + jit(sd * 11 + i, r * 0.7), my = y + jit(sd * 13 + i, r * 0.4); s += ln(`M${b.pt(mx, my)} l${n(jit(i + sd, 0.012) * b.k)},${n(-0.035 * b.k)} M${b.pt(mx + 0.015, my)} l${n(0.012 * b.k)},${n(-0.028 * b.k)}`, sd % 3 ? M.mossS : M.moss, lw * 0.8); }
  }
  for (let i = 0; i < 9; i++) s += `<circle cx="${n(b.x(jit(i + 50, 0.2)))}" cy="${n(b.y(0.35 + hash(i + 51) * 0.7))}" r="${n((0.008 + 0.012 * hash(i + 52)) * b.k)}" fill="${i % 2 ? "#e6e2c8" : M.stoneS}" stroke="none"/>`;
  for (let i = 0; i < 14; i++) { const x = -0.6 + i * 0.09 + jit(i + 60, 0.03), l = 0.12 + 0.22 * hash(i + 61); if (Math.abs(x) < 0.12) continue; s += ln(`M${b.pt(x, 0)} q${n(jit(i, 0.05) * b.k)},${n(-l * 0.6 * b.k)} ${n(jit(i + 3, 0.09) * b.k)},${n(-l * b.k)}`, i % 2 ? M.mossS : M.moss, lw * 1.4); }
  // an old offering cup, tipped over, and a dry stalk
  s += shp(hd(b, [[0.5, 0.0], [0.47, 0.1], [0.62, 0.13], [0.64, 0.02]], 21, 0.004, 0.1), M.plaster, lw * 0.8) + ln(`M${b.pt(0.56, 0.1)} q${n(0.06 * b.k)},${n(-0.2 * b.k)} ${n(0.02 * b.k)},${n(-0.34 * b.k)} M${b.pt(0.59, 0.3)} l${n(0.05 * b.k)},${n(-0.04 * b.k)} M${b.pt(0.58, 0.38)} l${n(-0.05 * b.k)},${n(-0.03 * b.k)}`, M.thatchS, lw * 1.2);
  return s;
}
// o: { era 0 (his own time: thatched hut, young pines, nets) | 1 (300 years on: giant pines, tiled houses, the grave), sun, people: true }
export function village(c, t, o = {}) {
  const era = o.era ?? 1, V = VILLAGE;
  let back = sky(c, t, { clouds: true, ...o }) + farCoast(c) + sea(c, t, o) + rock(c, { X: 5.4, Z: 15, w: 2.6, h: 1.7, seed: 2, wet: true, t }) + shore(c, t, { shells: era === 0 });
  // the grassy bank the village stands on
  back += `<path d="${wpoly(c, [[-16, 0, 11.2], [-0.6, 0, 10.4], [0.3, 0, 8.6], [-0.9, 0, 6.6], [-4, 0, 5.6], [-16, 0, 5.2]], 9, 0.08, 0.7)}" fill="${mix(M.moss, M.sand, 0.35)}" stroke="${INK}" stroke-width="1.2"/>`;
  for (let i = 0; i < 60; i++) { const X = -9 + hash(i + 700) * 8.6, Z = 5.8 + hash(i + 710) * 4.6; if (X > -0.8 - (Z - 6.6) * -0.2 && Z < 8) continue; const q = P(c, X, 0, Math.max(c.z + NEAR, Z)); back += ln(`M${pt(q)} l${n(-0.03 * q.s)},${n(-0.1 * q.s)} M${pt(q)} l${n(0.02 * q.s)},${n(-0.13 * q.s)} M${pt(q)} l${n(0.06 * q.s)},${n(-0.08 * q.s)}`, i % 2 ? M.mossS : M.moss, Math.max(1, 0.012 * q.s)); }
  if (era < 0.5) {
    back += pine(c, { ...V.pines[1], h: 2.6, seed: 4, lean: 0.34, t }) + hut(c, V.hut) + pine(c, { ...V.pines[0], h: 3.0, seed: 1, lean: -0.3, t }) + boat(c, { X: 1.4, Z: 7.9, dir: -1 });
  } else {
    back += tileHouse(c, { X: -5.6, Z: 12.5, w: 3.8, seed: 5 }) + pine(c, { ...V.pines[1], h: 12.5, seed: 4, lean: 0.12, giant: 1, t }) + tileHouse(c, { X: V.hut.X - 0.4, Z: V.hut.Z + 0.6, w: 4.4, seed: 2 });
    // a low stone wall and a stone lantern: someone else's garden now
    const b = board(c, -0.9, 0, 8.9);
    for (let i = 0; i < 9; i++) back += shp(ring(b.x(-1.6 + i * 0.36 + jit(i, 0.04)), b.y(0.14 + (i % 2) * 0.03), 0.2 * b.k, i + 3, 0.14, 9, 0.75), i % 3 ? M.stone : M.stoneS, b.lw);
    back += pine(c, { ...V.pines[0], h: 14, seed: 1, lean: -0.1, giant: 1, t });
    if (o.people !== false) for (const [X, Z, sd, hh] of [[-1.5, 9.9, 1, 1], [-2.25, 10.3, 2, 0.9]]) {     // two strangers, far off, walking away: straw hats, a carrying pole
      const q = board(c, X, 0, Z, hh), col = sd === 1 ? M.tile : mix(M.thatchS, M.stoneS, 0.5), lean = sd === 1 ? 0.03 : -0.02;
      back += shadow(q.p, 0.3) + ln(`M${q.pt(-0.07, 0.3)} L${q.pt(-0.1, 0.02)} M${q.pt(0.07, 0.3)} L${q.pt(0.12, 0.03)}`, INK, 0.07 * q.k) + ln(`M${q.pt(-0.07, 0.3)} L${q.pt(-0.1, 0.03)} M${q.pt(0.07, 0.3)} L${q.pt(0.12, 0.04)}`, "#d8b494", 0.045 * q.k);
      back += shp(hd(q, [[-0.19, 0.26], [-0.2, 0.9], [-0.25, 1.0], [-0.17 + lean, 1.33], [0.17 + lean, 1.33], [0.26, 1.0], [0.2, 0.9], [0.2, 0.28]], sd * 5, 0.012, 0.2), col, q.lw) + flat(hd(q, [[0.05, 0.28], [0.07, 1.31], [0.17 + lean, 1.31], [0.25, 1.0], [0.19, 0.9], [0.19, 0.29]], sd * 7, 0.008, 0.25), mix(col, INK, 0.3));
      back += ln(`M${q.pt(-0.19, 0.84)} L${q.pt(0.2, 0.82)}`, sd === 1 ? M.plaster : M.tile, 0.07 * q.k) + ln(`M${q.pt(-0.02 + lean, 1.3)} L${q.pt(lean, 0.9)}`, mix(col, INK, 0.4), q.lw);
      back += shp(ring(q.x(lean), q.y(1.43), 0.105 * q.k, sd, 0.04, 10), "#1d1829", q.lw) + shp(`M${q.pt(-0.36 + lean, 1.47)} Q${q.pt(lean - 0.1, 1.62)} ${q.pt(lean, 1.74)} Q${q.pt(lean + 0.1, 1.62)} ${q.pt(0.36 + lean, 1.47)} Q${q.pt(lean, 1.53)} ${q.pt(-0.36 + lean, 1.47)} Z`, M.thatch, q.lw) + [-0.2, -0.07, 0.07, 0.2].map((x) => ln(`M${q.pt(lean, 1.72)} L${q.pt(lean + x, 1.5)}`, M.thatchS, q.lw * 0.6)).join("");
      if (sd === 1) { back += ln(`M${q.pt(-0.62, 1.26)} L${q.pt(0.6, 1.3)}`, INK, 0.05 * q.k) + ln(`M${q.pt(-0.62, 1.26)} L${q.pt(0.6, 1.3)}`, M.woodL, 0.03 * q.k); for (const x of [-0.58, 0.56]) back += ln(`M${q.pt(x, 1.27)} L${q.pt(x - 0.1, 0.7)} M${q.pt(x, 1.27)} L${q.pt(x + 0.1, 0.7)}`, INK, q.lw * 0.7) + shp(hd(q, [[x - 0.15, 0.7], [x - 0.12, 0.42], [x + 0.12, 0.42], [x + 0.15, 0.7]], 9 + x, 0.008, 0.2), M.wood, q.lw) + ln(`M${q.pt(x - 0.14, 0.6)} L${q.pt(x + 0.14, 0.6)}`, INK, q.lw * 0.6); }
    }
    back += grave(c);
  }
  back += driftwood(c, 1.2, 2.3, 6) + grass(c, { X: -0.95, Z: 0.6, seed: 21, size: 1.2, t }) + grass(c, { X: -1.2, Z: 1.5, seed: 23, t }) + grass(c, { X: 0.95, Z: 0.55, seed: 25, size: 1.1, t }) + grass(c, { X: 1.7, Z: 5.2, seed: 27, size: 0.7, t });
  return { back, front: near(c, t) };
}

// ================================================================ the cast (local units: cm, feet at 0, up = -y, like legend.mjs)
const ease = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
const place = (p, rot = 0, sc = 1) => `translate(${n(p.x)},${n(p.y)}) rotate(${n(rot)}) scale(${(p.s / 100 * sc).toFixed(4)})`;
const L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
function limb(a, w, col, shade) {
  const d = "M" + a.map(([x, y]) => `${n(x)},${n(y)}`).join(" L");
  return ln(d, INK, w + 1.2) + ln(d, col, w) + (shade ? ln(d, shade, w * 0.36, `transform="translate(${n(w * 0.27)},0)"`) : "");
}
function eye(x, y, w, h, look, open, dir, iris = "#2a1d24", pupil = 0.45, lid = 1.1) {
  h *= Math.max(0.08, open);
  const id = `se${UID++}`;
  const shape = `M${n(x - w * dir)},${n(y + h * 0.1)} Q${n(x - w * 0.25 * dir)},${n(y - h * 1.05)} ${n(x + w * dir)},${n(y - h * 0.25)} Q${n(x + w * 0.2 * dir)},${n(y + h * 0.75)} ${n(x - w * dir)},${n(y + h * 0.1)} Z`;
  if (open < 0.25) return `<path d="M${n(x - w * dir)},${n(y)} Q${n(x)},${n(y + 1)} ${n(x + w * dir)},${n(y - 0.3)}" stroke="${INK}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  const ix = x + look * w * 0.45, ir = Math.min(w * 0.42, 2.6);
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#f3ede6" stroke="none"/>` +
    `<g clip-path="url(#${id})"><circle cx="${n(ix)}" cy="${n(y - h * 0.15)}" r="${n(ir)}" fill="${iris}" stroke="none"/><circle cx="${n(ix)}" cy="${n(y - h * 0.15)}" r="${n(ir * pupil)}" fill="#0b0710" stroke="none"/><circle cx="${n(ix + ir * 0.35)}" cy="${n(y - h * 0.15 - ir * 0.35)}" r="${n(ir * 0.28)}" fill="#fff" stroke="none"/></g>` +
    `<path d="M${n(x - w * dir)},${n(y + h * 0.1)} Q${n(x - w * 0.25 * dir)},${n(y - h * 1.05)} ${n(x + w * dir)},${n(y - h * 0.25)} l${n(0.9 * dir)},-0.7" stroke="${INK}" stroke-width="${lid}" fill="none" stroke-linecap="round"/>`;
}
function headPath(hx, hy, rx, ry, fx, chin = 1) {
  const jx = hx + fx * rx * 0.38;
  return `M${n(hx - rx)},${n(hy - ry * 0.15)} C${n(hx - rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx)},${n(hy - ry * 0.15)} C${n(hx + rx * 0.98 - (fx < 0 ? 0 : fx * 1.5))},${n(hy + ry * 0.45)} ${n(jx + rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(jx)},${n(hy + ry * chin)} C${n(jx - rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(hx - rx * 0.98 - (fx > 0 ? 0 : fx * 1.5))},${n(hy + ry * 0.45)} ${n(hx - rx)},${n(hy - ry * 0.15)} Z`;
}
const mouthOf = (x, y, w, open, sad = 0, col = "#5a1f30") => open > 0.12
  ? `<path d="M${n(x - w)},${n(y)} Q${n(x)},${n(y - 0.6)} ${n(x + w)},${n(y)} Q${n(x)},${n(y + 1 + open * 3.4)} ${n(x - w)},${n(y)} Z" fill="${col}"/>`
  : `<path d="M${n(x - w)},${n(y + sad * 0.7)} Q${n(x)},${n(y + 0.8 - sad * 1.8)} ${n(x + w)},${n(y - 0.2 + sad * 0.8)}" stroke="#6a2a38" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
const sk = (p, rot, inner, sc = 1) => `<g class="sk" filter="url(#wb)" transform="${place(p, rot, sc)}">${inner}</g>`;

// ---------------------------------------------------------------- Urashima Taro, young fisherman .. ancient man
// st: { X, Y, Z, age 0..1, fx (-1..1, sign = which way he faces), blink, talk, look, sad, shock, reach 0..1 (both hands forward,
//       holding the box), pull 0..1 (one hand tugs the cord), kneel 0..1, ride 0|1 (astride the turtle: X/Y/Z = turtle.seat),
//       bow deg, lean deg, hat: true (straw hat on his back), mino: false (straw raincoat as a cape on shoulders and back; replaces the hat), rod: false (fishing rod on the shoulder) }
// returns { svg, hold: {X, Y, Z} (where the box sits in his hands), head: screen point }
export function urashima(c, st = {}, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", hold: null };
  const Y0 = st.Y || 0, p = P(c, st.X, Y0, st.Z), u = clamp(st.age || 0), fx = st.fx ?? 0.75, dir = fx < 0 ? -1 : 1, e = ease(u);
  const kn = st.kneel || 0, ride = st.ride || 0, reach = st.reach || 0, pull = st.pull || 0, sad = st.sad || 0, shock = st.shock || 0;
  const hairC = mix("#1d1829", "#efece4", e), skin = mix("#f0c49c", "#dccbbd", u), skinS = mix("#d09a72", "#ae9c92", u), thin = 1 - 0.24 * u;
  const cloth = mix("#2850b8", "#66769a", u * 0.7), clothS = mix("#18307e", "#465270", u * 0.7), clothL = mix("#e6eeff", "#d0d4dc", u), straw = mix("#ecc058", "#c4b68e", u * 0.8), strawS = mix("#b4802c", "#8c826a", u * 0.8), strawL = mix("#fff0a8", "#e0d8c0", u * 0.8);
  const bend = (25 * e + (st.bow || 0)) * dir, hipY = ride ? -6 : lerp(lerp(-88, -76, e), -36, kn);
  // legs: thigh in short white work trousers, bare knee, calf with its muscle, ankle, waraji
  const trou = mix("#f3eee2", "#cfcdc8", u), trouS = mix("#cfc6b6", "#a9a8a6", u);
  const seg = (a, b2, w0, w1, col, bf = 0, bb = 0) => {      // tapered limb piece; bf / bb = bulge on the front / back edge
    const dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx * dir < 0) { nx = -nx; ny = -ny; }
    const mx = lerp(a[0], b2[0], 0.36), my = lerp(a[1], b2[1], 0.36), wm = lerp(w0, w1, 0.36) / 2;
    return `<path d="M${n(a[0] + nx * w0 / 2)},${n(a[1] + ny * w0 / 2)} Q${n(mx + nx * (wm + bf))},${n(my + ny * (wm + bf))} ${n(b2[0] + nx * w1 / 2)},${n(b2[1] + ny * w1 / 2)} L${n(b2[0] - nx * w1 / 2)},${n(b2[1] - ny * w1 / 2)} Q${n(mx - nx * (wm + bb))},${n(my - ny * (wm + bb))} ${n(a[0] - nx * w0 / 2)},${n(a[1] - ny * w0 / 2)} Z" fill="${col}"/>`;
  };
  let legs = "";
  for (const sd of [-dir, dir]) {                            // far leg first
    const farL = sd !== dir, hx0 = sd * 5.2 + (farL ? -dir * 1.5 : dir * 0.5), hip = [hx0, hipY];
    let knee = L2([hx0 + dir * (2.4 + 7.5 * e) + (farL ? -dir * 1 : 0), hipY * 0.5 - 1], [hx0 + dir * 25, -6], kn), foot = L2([hx0 - dir * (1.2 + 2 * e) + (farL ? -dir * 3.5 : dir * 1), -4.2], [hx0 - dir * 14, -4], kn);
    if (ride) { knee = [hx0 + dir * 21 + sd * 2, hipY - 3]; foot = [hx0 + dir * 11 + sd * 2, hipY + 33]; }
    const sc2 = farL ? mix(skin, skinS, 0.5) : skin, tc = farL ? trouS : trou, cuff = L2(hip, knee, 0.84);
    legs += seg(hip, knee, 9 * thin, 7.4 * thin, sc2, 0.4, 0.6);                                           // thigh
    legs += seg(knee, foot, 7.2 * thin, 4.3 * thin, sc2, 0.5, 2.1 * thin);                                 // shin and calf
    legs += `<ellipse cx="${n(knee[0])}" cy="${n(knee[1])}" rx="${n(3.3 * thin)}" ry="${n(3.6 * thin)}" fill="${sc2}" stroke="none"/><path d="M${n(knee[0] + dir * 1 - 1.8)},${n(knee[1] + 2)} q2,1.4 3.8,-0.2 M${n(knee[0] + dir * 2.6)},${n(knee[1] - 1.6)} q${n(dir * 1)},1.6 0,3" stroke="${skinS}" stroke-width="0.6" fill="none"/>`;
    legs += `<path d="M${n(lerp(knee[0], foot[0], 0.2) - dir * 2.6)},${n(lerp(knee[1], foot[1], 0.2))} Q${n(lerp(knee[0], foot[0], 0.45) - dir * 3.4)},${n(lerp(knee[1], foot[1], 0.45))} ${n(lerp(knee[0], foot[0], 0.7) - dir * 1.2)},${n(lerp(knee[1], foot[1], 0.7))}" stroke="${skinS}" stroke-width="0.7" fill="none"/>`;
    legs += seg(hip, cuff, 11.4 * thin, 10 * thin, tc, 0.5, 0.8);                                          // the trouser leg, loose, to just above the knee
    legs += `<path d="M${n(cuff[0] - 5.2 * thin)},${n(cuff[1] - 0.4)} Q${n(cuff[0])},${n(cuff[1] + 2)} ${n(cuff[0] + 5.2 * thin)},${n(cuff[1] - 0.4)}" stroke="${clothS}" stroke-width="1.1" fill="none"/><path d="M${n(lerp(hip[0], cuff[0], 0.3) + dir * 1.5)},${n(lerp(hip[1], cuff[1], 0.3))} L${n(lerp(hip[0], cuff[0], 0.85) + dir * 0.6)},${n(lerp(hip[1], cuff[1], 0.85))}" stroke="${trouS}" stroke-width="0.6" fill="none"/>`;
    legs += `<g transform="translate(${n(foot[0])},${n(foot[1])}) rotate(${n(ride ? 60 * dir : -75 * dir * kn)}) scale(${dir},1)"><path d="M-2.6,-2.6 Q-4.8,2.6 -1,4 L9.8,4.2 Q13,3.6 12.4,1.4 Q8.4,0 4.6,-3.2 Q1,-4.6 -2.6,-2.6 Z" fill="${sc2}"/><path d="M-5,3.8 L13.4,4.4 L13.4,5.8 L-5,5.4 Z" fill="${straw}"/><path d="M-1.4,-2.6 L3,4 M4.2,-3 L3,4 M-3.4,-3.6 Q0.4,-1.8 4.8,-3.8 M-3,-5.4 Q0.6,-3.8 4.4,-5.6" stroke="${strawS}" stroke-width="0.9" fill="none"/><path d="M7.8,1.6 l0,2.4 M9.9,1.9 l0,2.2 M11.6,2.4 l0,1.6" stroke="${INK}" stroke-width="0.35"/><circle cx="-0.2" cy="-1.6" r="1.1" fill="none" stroke="${skinS}" stroke-width="0.5"/></g>`;
    if (u > 0.2 && !ride) legs += `<path d="M${n(knee[0] - 2.6)},${n(knee[1] - 2.4)} q2.6,-1.6 5.2,0 M${n(lerp(knee[0], foot[0], 0.5) + dir * 1)},${n(lerp(knee[1], foot[1], 0.5) - 3)} l${n(dir * 0.6)},6" stroke="${skinS}" stroke-width="0.55" fill="none" opacity="${n(u)}"/>`;
  }
  // arms: [shoulder, elbow, wrist] per side
  const arms = [-1, 1].map((sd) => {
    const near = sd === dir, S = [sd * 13, -136], E = L2([sd * 17.5, -112], [sd * 9 + dir * 13, -113], reach), Wr = L2([sd * 18.5 + dir * 2 * e, -89], [dir * 27 + sd * 7, -103], reach);
    if (near && pull) { Wr[0] += dir * 7 * pull; Wr[1] -= 15 * pull; E[1] -= 4 * pull; }
    const ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]) * 180 / Math.PI;
    let g = limb([E, Wr], 5.6 * thin, near ? skin : skinS, near ? skinS : null);
    g += `<g transform="translate(${n(Wr[0])},${n(Wr[1])}) rotate(${n(ang)})"><path d="M-2,-3.2 Q4,-4.4 7.6,-2.2 Q9.4,0 7.8,2.6 Q3,4.2 -2,3 Z" fill="${skin}"/><path d="M0.5,-3.4 Q3.6,-6 5.4,-4.2 Q4.4,-2.6 2.6,-2.6" fill="${skin}"/><path d="M4.4,-0.9 L8,-0.7 M4.2,1 L7.9,1.1" stroke="${INK}" stroke-width="0.4" fill="none"/>` +
      `<g opacity="${n(u)}"><path d="M1.2,-1.6 q1,1 0.2,2.2 M2.8,-1.8 q1,1.2 0.2,2.6 M-1.4,-1 L1.8,0.4 M-1.4,1 L1.6,1.8" stroke="${skinS}" stroke-width="0.45" fill="none"/><circle cx="0.4" cy="-1.4" r="0.55" fill="#9a7a66" stroke="none"/><circle cx="2.4" cy="2" r="0.45" fill="#9a7a66" stroke="none"/><path d="M4,-2.4 q0.8,0.5 0.4,1.2 M4.2,-0.2 q0.9,0.3 0.5,1" stroke="${INK}" stroke-width="0.35" fill="none"/></g></g>`;
    g += limb([S, E], 9.4 * (1 - 0.1 * u), near ? cloth : clothS, near ? clothS : null);
    g += `<path d="M${n(E[0] - 5)},${n(E[1] - 1)} Q${n(E[0])},${n(E[1] + 3.4)} ${n(E[0] + 5)},${n(E[1] - 1)}" stroke="${clothL}" stroke-width="1.5" fill="none"/>` + (u > 0.3 ? `<path d="M${n(E[0] - 3)},${n(E[1] + 2.4)} l-0.8,2.4 M${n(E[0] + 1)},${n(E[1] + 3)} l0.4,2.6 M${n(E[0] + 3.6)},${n(E[1] + 2)} l1.2,2" stroke="${clothS}" stroke-width="0.6" opacity="${n(u)}"/>` : "");
    return { g, near, Wr };
  });
  // the jacket's skirt below the rope belt (hanten tails), white hem stitch
  let skirt = `<path d="M${n(-14 * thin)},-104 L${n(14 * thin)},-104 Q${n(17.5 * thin)},-90 ${n(17 * thin)},${n(-74 + e * 2)} Q0,${n(-71 + e * 2)} ${n(-17 * thin)},${n(-74 + e * 2)} Q${n(-17.5 * thin)},-90 ${n(-14 * thin)},-104 Z" fill="${cloth}"/><path d="M${n(dir * 6)},-104 L${n(dir * 14 * thin)},-104 Q${n(dir * 17.5 * thin)},-90 ${n(dir * 17 * thin)},${n(-74 + e * 2)} L${n(dir * 9)},${n(-72.6 + e * 2)} Q${n(dir * 10)},-90 ${n(dir * 6)},-104 Z" fill="${clothS}" stroke="none"/>`;
  skirt += `<path d="M${n(-16 * thin)},${n(-77 + e * 2)} Q0,${n(-74 + e * 2)} ${n(16 * thin)},${n(-77 + e * 2)}" stroke="${clothL}" stroke-width="0.8" stroke-dasharray="1.6 1.2" fill="none"/><path d="M${n(dir * 2.4)},-102 Q${n(dir * 4)},-88 ${n(dir * 1.4)},${n(-72.8 + e * 2)}" stroke="${clothL}" stroke-width="1.4" fill="none"/><path d="M${n(-dir * 8)},-100 q${n(-dir * 1.6)},10 ${n(-dir * 0.6)},22" stroke="${clothS}" stroke-width="0.6" fill="none"/>`;
  for (let i = 0; i < 6; i++) { const x = -11 + i * 4.6 + jit(i + 33, 0.8), y = -96 + (i % 2) * 8 + jit(i + 37, 1); if (Math.abs(x - dir * 3) < 2.4) continue; skirt += `<path d="M${n(x - 1.3)},${n(y)} h2.6 M${n(x)},${n(y - 1.3)} v2.6" stroke="${clothL}" stroke-width="0.55" opacity="0.85"/>`; }
  // optional straw raincoat (mino): a cape on the shoulders and back only, strand by strand, in two tiers
  let mino = "";
  if (st.mino) for (const [tier, y0, len, hw, cnt] of [[0, -122, 44, 21, 20], [1, -140, 26, 18.5, 18]]) for (let i = 0; i < cnt; i++) {
    const f = i / (cnt - 1), x = lerp(-hw, hw, f) - dir * 3, w = 1.7 + 0.9 * hash(i + tier * 40), l = len * (0.84 + 0.25 * hash(i * 3 + tier * 7)), bx = x * 1.16 + jit(i + tier * 9, 1.2) + Math.sin(t * 2 + i) * 0.3, yy = y0 + Math.abs(f - 0.5) * 7;
    mino += `<path d="M${n(x - w / 2)},${n(yy)} L${n(x + w / 2)},${n(yy)} L${n(bx + w * 0.4)},${n(yy + l)} L${n(bx - w * 0.6)},${n(yy + l - 1.2)} Z" fill="${[straw, strawS, strawL, straw][(i + tier) % 4]}" stroke-width="0.3"/>`;
  }
  const minoTie = st.mino ? `<path d="M-13.5,-138 Q0,-131 13.5,-138" stroke="${INK}" stroke-width="2.6" fill="none"/><path d="M-13.5,-138 Q0,-131 13.5,-138" stroke="${straw}" stroke-width="1.6" fill="none"/>` + [-13, 13].map((x) => [-2, 0, 2].map((d) => `<path d="M${x},-139 l${d},-5.5" stroke="${strawS}" stroke-width="0.7"/>`).join("")).join("") : "";
  // rope belt: twist by twist, a knot, two frayed ends
  let belt = `<path d="M-14.5,-106 Q0,-103.4 14.5,-106 L14.6,-101.8 Q0,-99.2 -14.6,-101.8 Z" fill="${straw}"/>`;
  for (let i = 0; i < 12; i++) belt += `<path d="M${n(-13.4 + i * 2.4)},-101.6 l1.9,-4" stroke="${strawS}" stroke-width="0.7"/>`;
  belt += `<path d="M${n(dir * 5 - 2.6)},-106.4 Q${n(dir * 5)},-108.4 ${n(dir * 5 + 2.6)},-106 Q${n(dir * 5 + 3.2)},-102.4 ${n(dir * 5)},-101 Q${n(dir * 5 - 3.4)},-102.4 ${n(dir * 5 - 2.6)},-106.4 Z" fill="${strawL}"/>`;
  for (const [dx, l] of [[-1.4, 15], [1.8, 11]]) { const x = dir * 5 + dx, sw = Math.sin(t * 2.2 + dx) * 0.8; belt += ln(`M${n(x)},-101.4 Q${n(x + dx * 0.8 + sw)},${n(-101 + l * 0.6)} ${n(x + dx + sw * 1.6)},${n(-101 + l)}`, INK, 2.6) + ln(`M${n(x)},-101.4 Q${n(x + dx * 0.8 + sw)},${n(-101 + l * 0.6)} ${n(x + dx + sw * 1.6)},${n(-101 + l)}`, straw, 1.6) + [-1.3, 0, 1.3].map((f) => `<path d="M${n(x + dx + sw * 1.6)},${n(-101 + l)} l${n(f)},3.2" stroke="${strawS}" stroke-width="0.5"/>`).join(""); }
  // the straw hat on his back
  const hatX = -dir * 7, hat = st.hat === false || st.mino ? "" : `<ellipse cx="${n(hatX)}" cy="-124" rx="17.5" ry="19.5" fill="${straw}"/><ellipse cx="${n(hatX)}" cy="-124" rx="11" ry="12.5" fill="none" stroke="${strawS}" stroke-width="0.6"/><ellipse cx="${n(hatX)}" cy="-124" rx="5" ry="5.8" fill="${strawL}" stroke="${strawS}" stroke-width="0.6"/>` + Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283 + 0.1; return `<path d="M${n(hatX + Math.cos(a) * 5)},${n(-124 + Math.sin(a) * 5.8)} L${n(hatX + Math.cos(a + jit(i, 0.05)) * 17)},${n(-124 + Math.sin(a) * 19)}" stroke="${strawS}" stroke-width="0.5"/>`; }).join("") + `<path d="M${n(hatX - dir * 13)},-112 l${n(-dir * 3)},3 M${n(hatX - dir * 16)},-128 l${n(-dir * 3.4)},-1" stroke="${strawS}" stroke-width="0.7"/>`;
  const rod = st.rod ? ln(`M${n(-dir * 6)},-96 L${n(-dir * 46)},-236`, INK, 2.4) + ln(`M${n(-dir * 6)},-96 L${n(-dir * 46)},-236`, "#a8c048", 1.4) + ln(`M${n(-dir * 46)},-236 q${n(-dir * 6)},40 ${n(-dir * 2 + Math.sin(t * 1.5) * 3)},86`, "#f4f0e0", 0.5) : "";
  // sashiko stitches on the jacket, hand-placed
  let stitch = "";
  for (let i = 0; i < 16; i++) { const x = -10.5 + (i % 4) * 7 + jit(i + 3, 1.2), y = -133 + Math.floor(i / 4) * 7.4 + jit(i + 9, 1); if (Math.abs(x) < 4.2 && y < -118) continue; stitch += `<path d="M${n(x - 1.3)},${n(y)} h2.6 M${n(x)},${n(y - 1.3)} v2.6" stroke="${clothL}" stroke-width="0.55" opacity="0.85"/>`; }
  // head
  const hx = fx * 2, hy = -152, ex = hx + fx * 5, open = (1 - (st.blink || 0)) * (1 - 0.32 * u) * (1 + 0.4 * shock), iris = mix("#2a1d24", "#76828e", u * 0.7), hl = lerp(-9, -16.5, e);
  const brow = (d) => `<path d="M${n(ex + d * 7.2)},${n(hy - 6.2 + sad * -1.2)} Q${n(ex + d * 4.5)},${n(hy - 8 - shock * 1.4)} ${n(ex + d * 1.8)},${n(hy - 6.6 - sad * 1.8)}" stroke="${mix(INK, "#f2efe8", e)}" stroke-width="${n(1.7 + u * 0.7)}" fill="none" stroke-linecap="round"/>` + (u > 0.3 ? [2.4, 4.2, 6].map((q) => `<path d="M${n(ex + d * q)},${n(hy - 7.4)} l${n(d * 0.5)},${n(1.9)}" stroke="#f2efe8" stroke-width="0.6" opacity="${n(u)}"/>`).join("") : "");
  const wr = `<g opacity="${n(e)}" fill="none" stroke="${skinS}" stroke-width="0.55">
    <path d="M${n(ex - 6.5)},${n(hy - 11)} q6.5,-1.6 13,0 M${n(ex - 5.5)},${n(hy - 13.2)} q5.5,-1.4 11,0 M${n(ex - 4)},${n(hy - 15.2)} q4,-1 8,0"/>
    <path d="M${n(ex - 7.6)},${n(hy + 1.6)} q3,1.8 5.6,0.4 M${n(ex + 2)},${n(hy + 2)} q2.6,1.4 5.6,-0.4 M${n(ex - 7.4)},${n(hy + 3.4)} q2.6,1.2 4.6,0.4 M${n(ex + 2.6)},${n(hy + 3.6)} q2.4,1 4.6,-0.2"/>
    <path d="M${n(ex - 3.4)},${n(hy + 3)} Q${n(ex - 5.6)},${n(hy + 7)} ${n(ex - 4.6)},${n(hy + 10)} M${n(ex + 3.4)},${n(hy + 3)} Q${n(ex + 5.6)},${n(hy + 7)} ${n(ex + 4.6)},${n(hy + 10)}"/>
    <path d="M${n(ex + dir * 8)},${n(hy - 2.6)} l${n(dir * 2.2)},-1 M${n(ex + dir * 8)},${n(hy - 1.4)} l${n(dir * 2.4)},0.2 M${n(ex - dir * 8.4)},${n(hy - 2.4)} l${n(-dir * 1.6)},-0.8"/>
    <path d="M${n(hx - 9)},${n(hy + 3)} Q${n(hx - 7)},${n(hy + 7)} ${n(hx - 7.4)},${n(hy + 10)} M${n(hx + 9)},${n(hy + 3)} Q${n(hx + 7)},${n(hy + 7)} ${n(hx + 7.4)},${n(hy + 10)}" stroke-width="0.8"/></g>
    <g opacity="${n(u * 0.9)}"><circle cx="${n(hx - 6)}" cy="${n(hy - 12)}" r="0.8" fill="#a08270" stroke="none"/><circle cx="${n(hx + 7.4)}" cy="${n(hy + 3)}" r="0.65" fill="#a08270" stroke="none"/><circle cx="${n(hx + 4)}" cy="${n(hy - 14)}" r="0.5" fill="#a08270" stroke="none"/></g>`;
  // old man's hair: thin side wisps to the shoulder, a long beard, a drooping moustache (all grow with age)
  let oldHair = "";
  if (u > 0.05) {
    for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { const x = hx + sd * (10.6 - i * 0.5), l = (14 + 9 * hash(i + sd + 5)) * e; oldHair += ln(`M${n(x)},${n(hy - 5 + i)} q${n(sd * (2 + i * 0.6))},${n(l * 0.5)} ${n(sd * (0.6 + jit(i, 1.4)) + Math.sin(t * 1.4 + i) * 0.5)},${n(l)}`, i % 2 ? hairC : mix(hairC, "#9a96a0", 0.5), 1.1); }
    const bl = 27 * e, by = hy + 11.4;
    oldHair += `<path d="M${n(ex - 5.4)},${n(by - 2.6)} Q${n(ex - 6.4)},${n(by + bl * 0.5)} ${n(ex - 2.4)},${n(by + bl * 0.84)} L${n(ex - 0.6)},${n(by + bl)} L${n(ex + 0.9)},${n(by + bl * 0.8)} L${n(ex + 2.6)},${n(by + bl * 0.93)} Q${n(ex + 6.2)},${n(by + bl * 0.5)} ${n(ex + 5.4)},${n(by - 2.6)} Q${n(ex)},${n(by + 0.4)} ${n(ex - 5.4)},${n(by - 2.6)} Z" fill="${hairC}"/>`;
    for (let i = 0; i < 6; i++) oldHair += `<path d="M${n(ex - 3.8 + i * 1.5)},${n(by + 0.4)} q${n(jit(i + 3, 1.2))},${n(bl * 0.4)} ${n(jit(i + 7, 1))},${n(bl * (0.62 + 0.2 * hash(i)))}" stroke="#a9a6b2" stroke-width="0.45" fill="none"/>`;
    for (const d of [-1, 1]) oldHair += ln(`M${n(ex + d * 0.6)},${n(hy + 6.9)} Q${n(ex + d * 3.6)},${n(hy + 6.6)} ${n(ex + d * 4.8)},${n(hy + 7 + 5.5 * e)}`, INK, 1.9 * e + 0.01) + ln(`M${n(ex + d * 0.6)},${n(hy + 6.9)} Q${n(ex + d * 3.6)},${n(hy + 6.6)} ${n(ex + d * 4.8)},${n(hy + 7 + 5.5 * e)}`, hairC, 1.2 * e + 0.01);
  }
  const knotR = lerp(5.2, 2.6, e), kx = hx - dir * 3.5, ky = hy - 20.5 + e * 2;
  const head = `<g transform="rotate(${n(-bend * 0.62 + (st.tilt || 0))} 0 -140)">
    <path d="M${n(-3.6 * thin)},-147 L${n(3.6 * thin)},-147 L${n(3.2 * thin)},-136.5 L${n(-3.2 * thin)},-136.5 Z" fill="${skinS}"/>${u > 0.3 ? `<path d="M-1.4,-146 L-1,-138 M1.6,-146 L1.2,-138" stroke="${mix(skinS, INK, 0.3)}" stroke-width="0.5" opacity="${n(u)}"/>` : ""}
    <ellipse cx="${n(kx)}" cy="${n(ky)}" rx="${n(knotR * 0.85)}" ry="${n(knotR)}" fill="${hairC}"/><path d="M${n(kx - knotR * 0.7)},${n(ky + knotR * 0.75)} h${n(knotR * 1.4)}" stroke="${straw}" stroke-width="1.3"/>
    <ellipse cx="${n(hx - dir * 10.6)}" cy="${n(hy + 0.5)}" rx="2.2" ry="3.4" fill="${skin}"/>
    <path d="${headPath(hx, hy, 11, 13.5, fx, 1.05 + 0.03 * u)}" fill="${skin}"/>
    <path d="M${n(hx + dir * 3)},${n(hy + 5)} Q${n(hx + dir * 9.4)},${n(hy + 5)} ${n(hx + dir * 9.8)},${n(hy - 1)} Q${n(hx + dir * 10)},${n(hy + 8)} ${n(hx + dir * 4.4)},${n(hy + 12.6)} Z" fill="${skinS}" stroke="none" opacity="${n(0.35 + 0.4 * u)}"/>
    <path d="M${n(hx - 12)},${n(hy - 1 - e * 3)} Q${n(hx - 13.2)},${n(hy - 19)} ${n(hx + fx * 2)},${n(hy - 18.8)} Q${n(hx + 13.2)},${n(hy - 19)} ${n(hx + 12)},${n(hy - 1 - e * 3)} L${n(hx + 10.4)},${n(hy + hl + 4)} L${n(hx + 7 + fx * 2)},${n(hy + hl)} L${n(hx + 4.4 + fx * 2)},${n(hy + hl + 2.4 * (1 - e))} L${n(hx + 1 + fx * 2)},${n(hy + hl - 0.6)} L${n(hx - 2.4 + fx * 2)},${n(hy + hl + 2 * (1 - e))} L${n(hx - 6.4 + fx * 2)},${n(hy + hl - 0.2)} L${n(hx - 10.4)},${n(hy + hl + 4)} Z" fill="${hairC}"/><path d="M${n(hx - dir * 11.6)},${n(hy - 4)} q${n(-dir * 0.8)},5 ${n(dir * 1.2)},${n(8 * (1 - e * 0.5))} l${n(dir * 1.6)},${n(-7 * (1 - e * 0.5))} Z" fill="${hairC}"/>
    ${u > 0.45 ? `<path d="M${n(hx - 7.4 + fx * 2)},${n(hy - 15.4)} Q${n(hx + fx * 2)},${n(hy - 19.4)} ${n(hx + 7.4 + fx * 2)},${n(hy - 15.4)} Q${n(hx + fx * 2)},${n(hy - 12.6)} ${n(hx - 7.4 + fx * 2)},${n(hy - 15.4)} Z" fill="${skin}" stroke="none" opacity="${n(clamp((u - 0.45) * 2.4))}"/>` : ""}
    ${[-5, -1, 3].map((d, i) => `<path d="M${n(hx + d + fx * 2)},${n(hy - 18)} q${n(1 + i * 0.4)},${n(3)} ${n(0.4)},${n(6 * (1 - e * 0.6))}" stroke="${mix(hairC, "#6a6480", 0.4)}" stroke-width="0.5" fill="none"/>`).join("")}
    ${brow(-1)}${brow(1)}
    <ellipse cx="${n(ex - 6.4)}" cy="${n(hy + 4.6)}" rx="2.6" ry="1.5" fill="#f09a86" stroke="none" opacity="${n(0.45 * (1 - u))}"/><ellipse cx="${n(ex + 6.4)}" cy="${n(hy + 4.6)}" rx="2.6" ry="1.5" fill="#f09a86" stroke="none" opacity="${n(0.45 * (1 - u))}"/>
    ${eye(ex - 4.5, hy - 1.3, 2.9 * (Math.abs(fx) > 0.3 ? (dir > 0 ? 0.85 : 1) : 1), 2.9, st.look ?? dir * 0.35, open, -1, iris, 0.45, 1.3)}${eye(ex + 4.5, hy - 1.3, 2.9 * (Math.abs(fx) > 0.3 ? (dir > 0 ? 1 : 0.85) : 1), 2.9, st.look ?? dir * 0.35, open, 1, iris, 0.45, 1.3)}
    <path d="M${n(ex + dir * 0.6)},${n(hy + 0.6)} q${n(dir * 2.4)},${n(3.2 + u)} ${n(dir * 0.2)},${n(4.6 + u)}" stroke="${mix(skinS, INK, 0.45)}" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    ${shock > 0.4 && !(st.talk > 0.12) ? `<path d="M${n(ex - 1.9)},${n(hy + 9)} Q${n(ex)},${n(hy + 6.8)} ${n(ex + 1.9)},${n(hy + 9)} Q${n(ex)},${n(hy + 12.6)} ${n(ex - 1.9)},${n(hy + 9)} Z" fill="#5a1f30"/>` : mouthOf(ex, hy + 8.6, 2.9, st.talk || 0, sad + u * 0.5 - 0.55 * (1 - u) * (1 - sad))}<path d="M${n(ex - 1.3)},${n(hy + 11.2)} q1.3,0.7 2.6,0" stroke="${skinS}" stroke-width="0.6" fill="none"/>
    ${wr}${oldHair}</g>`;
  const upper = `${hat}${mino}${rod}${arms.filter((a) => !a.near).map((a) => a.g).join("")}
    <path d="M-13,-141 L13,-141 Q${n(16.5 * thin)},-120 ${n(13.6 * thin)},-102 L${n(15 * thin)},-86 L${n(-15 * thin)},-86 L${n(-13.6 * thin)},-102 Q${n(-16.5 * thin)},-120 -13,-141 Z" fill="${cloth}"/>
    <path d="M${n(dir * 5)},-141 L${n(dir * 13)},-141 Q${n(dir * 16.5 * thin)},-120 ${n(dir * 13.6 * thin)},-102 L${n(dir * 15 * thin)},-86 L${n(dir * 8)},-86 Q${n(dir * 10)},-110 ${n(dir * 5)},-141 Z" fill="${clothS}" stroke="none"/>
    ${stitch}
    <path d="M-5.4,-141.5 L0,-123 L5.4,-141.5 Z" fill="${skin}"/>${u > 0.3 ? `<path d="M-3.4,-137 q3.4,1.6 6.8,0 M-1.6,-132 q1.6,1 3.2,0" stroke="${skinS}" stroke-width="0.5" fill="none" opacity="${n(u)}"/>` : ""}
    <path d="M-8,-141.5 L-5,-141.5 L${n(1.4)},-121 L${n(4.6)},-106 L0.6,-106 L-2,-118 Z" fill="${clothL}"/><path d="M8,-141.5 L5,-141.5 L${n(-0.2)},-124 L${n(-1.6)},-119 Z" fill="${mix(clothL, cloth, 0.25)}"/>
    ${skirt}${belt}${minoTie}
    ${arms.filter((a) => a.near).map((a) => a.g).join("")}${head}`;
  const inner = `${legs}<g transform="translate(0,${n(hipY + 88)}) rotate(${n(bend)} 0 -88)">${upper}</g>`;
  // where the box sits: between the hands, carried through the bend
  const a = bend * Math.PI / 180, lx = dir * 28, ly = -98 - 5, rx = lx * Math.cos(a) - (ly + 88) * Math.sin(a), ry = lx * Math.sin(a) + (ly + 88) * Math.cos(a) - 88 + hipY + 88;
  const hxw = (fx * 2) * Math.cos(a) - (-152 + 88) * Math.sin(a), hyw = (fx * 2) * Math.sin(a) + (-152 + 88) * Math.cos(a) + hipY;
  return { svg: (ride ? "" : shadow(p, 0.3)) + sk(p, st.lean || 0, inner), hold: { X: st.X + rx / 100, Y: Y0 - ry / 100, Z: st.Z - 0.03 }, head: { x: p.x + hxw * p.s / 100, y: p.y + hyw * p.s / 100 }, p };
}

// ---------------------------------------------------------------- Princess Otohime
// st: { X, Y, Z, fx, sad 0..1, blink, talk, look, give 0..1 (both sleeves forward, offering the box), bow deg, lean deg }
// returns { svg, hold: {X, Y, Z} }
export function otohime(c, st = {}, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", hold: null };
  const Y0 = st.Y || 0, p = P(c, st.X, Y0, st.Z), fx = st.fx ?? -0.6, dir = fx < 0 ? -1 : 1, sad = st.sad ?? 0.4, g = st.give || 0, bow = (st.bow || 0) * dir;
  const skin = "#f7e2d4", hair = "#15101f", white = "#fff7ee", whiteS = "#f2c6cc", pink = "#ff8fa8", jade = "#19b894", jadeS = "#0e807a", verm = "#e8321e", gold = "#f2b82e", vio = "#7a56c4";
  const sw = (k) => Math.sin(t * 1.1 + k), back = -dir;
  // the long hair behind, down past the knees, floating a little
  let s = `<path d="M${n(-12 + fx)},-164 Q${n(-19 + back * 4)},-110 ${n(-15 + back * 10 + sw(1) * 2)},-38 Q${n(back * 12 + sw(2) * 3)},-26 ${n(13 + back * 12 + sw(3) * 2)},-40 Q${n(18 + back * 4)},-110 ${n(12 + fx)},-164 Z" fill="${hair}"/>`;
  for (let i = 0; i < 7; i++) { const x = -10 + i * 3.4; s += `<path d="M${n(x)},-150 Q${n(x * 1.2 + back * 4)},-100 ${n(x * 1.1 + back * 10 + sw(i) * 2)},${n(-44 - hash(i) * 8)}" stroke="#3b3358" stroke-width="0.55" fill="none"/>`; }
  s += `<path d="M${n(back * 9 - 6)},-74 L${n(back * 9 + 6)},-73 L${n(back * 9 + 5.4)},-68.6 L${n(back * 9 - 5.6)},-69.4 Z" fill="${white}"/><path d="M${n(back * 9 - 6)},-71.4 h12" stroke="${verm}" stroke-width="0.9"/>`;
  // the feather-light scarf drifting behind her shoulders
  const sc = `M${n(dir * 50 + sw(1) * 3)},${n(-96 + sw(1) * 4)} Q${n(dir * 30)},${n(-78 + sw(2) * 3)} ${n(dir * 30)},${n(-112)} Q${n(dir * 30)},${n(-140)} ${n(dir * 12)},${n(-143)} Q${n(back * 6)},${n(-150 + sw(3) * 2)} ${n(back * 24)},${n(-136)} Q${n(back * 46)},${n(-120 + sw(5) * 4)} ${n(back * 42 + sw(6) * 3)},${n(-84)} Q${n(back * 40)},${n(-58)} ${n(back * 62 + sw(7) * 4)},${n(-70 + sw(4) * 5)}`;
  s = ln(sc, INK, 5.2) + ln(sc, "#ffc2cf", 4.2) + ln(sc, "#fff4f6", 1.1, `stroke-dasharray="7 6"`) + s;
  // robes: the white outer robe over the hems of four more
  const hem = (dy, col, wdt) => `<path d="M${n(-23 - wdt)},${n(-dy)} Q0,${n(3 - dy)} ${n(25 + wdt)},${n(-dy)} L${n(back * (44 + wdt * 2))},${n(1 - dy * 0.4)} L${n(back * (30 + wdt))},${n(-9 - dy)} Z" fill="${col}"/>`;
  s += hem(0, verm, 3) + hem(2.6, jade, 2) + hem(5.2, vio, 1) + hem(7.6, pink, 0);
  s += `<path d="M${n(back * 11.5)},-106 Q${n(back * 19)},-58 ${n(back * 41)},-7 Q0,-3.6 ${n(dir * 24)},-9 Q${n(dir * 17.5)},-60 ${n(dir * 11.5)},-106 Z" fill="${white}"/>`;
  s += `<path d="M${n(dir * 5)},-104 Q${n(dir * 13)},-60 ${n(dir * 14)},-8.4 L${n(dir * 23)},-9 Q${n(dir * 17)},-60 ${n(dir * 11.5)},-106 Z" fill="${whiteS}" stroke="none"/>`;
  s += `<path d="M${n(dir * 1.5)},-96 Q${n(dir * 6)},-50 ${n(dir * 3)},-8" stroke="${verm}" stroke-width="1.6" fill="none"/><path d="M${n(dir * 3.2)},-96 Q${n(dir * 7.8)},-50 ${n(dir * 4.8)},-8" stroke="${jade}" stroke-width="1.2" fill="none"/><path d="M${n(dir * 4.6)},-96 Q${n(dir * 9.2)},-50 ${n(dir * 6.2)},-8" stroke="${gold}" stroke-width="0.8" fill="none"/>`;
  for (const [x, y, sz] of [[-13, -30, 1], [-7, -58, 0.8], [13, -44, 0.9], [-16, -16, 0.7], [16, -20, 0.8], [back * 26, -22, 1], [back * 20, -52, 0.7], [-3, -24, 0.7]]) s += `<path d="M${n(x - 3 * sz)},${n(y)} q${n(1.5 * sz)},${n(-2.4 * sz)} ${n(3 * sz)},0 q${n(1.5 * sz)},${n(-2.4 * sz)} ${n(3 * sz)},0 M${n(x - 1.5 * sz)},${n(y - 2.2 * sz)} q${n(1.5 * sz)},${n(-2.4 * sz)} ${n(3 * sz)},0" stroke="${gold}" stroke-width="0.7" fill="none"/>`;
  for (const [x1, x2] of [[-16, -19], [9, 12], [back * 17, back * 28]]) s += `<path d="M${n(x1)},-92 Q${n((x1 + x2) / 2 - 2)},-50 ${n(x2)},-11" stroke="${whiteS}" stroke-width="0.7" fill="none"/>`;
  const up = [];
  // torso, the five collars one inside the other
  up.push(`<path d="M-12.5,-141 L12.5,-141 Q15,-120 11.5,-104 L-11.5,-104 Q-15,-120 -12.5,-141 Z" fill="${white}"/>`);
  [[verm, 0], [gold, 1], [jade, 2], [vio, 3], [white, 4]].reverse().forEach(([col, i]) => { const w = 10.6 - i * 1.5, d = -112 - i * 2.6; up.push(`<path d="M${n(-w)},-142 L${n(dir * 0.5)},${n(d)} L${n(w)},-142" stroke="${INK}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M${n(-w)},-142 L${n(dir * 0.5)},${n(d)} L${n(w)},-142" stroke="${col}" stroke-width="2.1" fill="none" stroke-linejoin="round"/>`); });
  up.push(`<path d="M-4.2,-142 L${n(dir * 0.4)},-128 L4.2,-142 Z" fill="${skin}"/>`);
  // sash, cord and its two tassels
  up.push(`<path d="M-12.4,-112 Q0,-110 12.4,-112 L11.8,-99 Q0,-97 -11.8,-99 Z" fill="${jade}"/><path d="M${n(dir * 4)},-111 L${n(dir * 12.2)},-112 L${n(dir * 11.6)},-99 L${n(dir * 5)},-98.2 Z" fill="${jadeS}" stroke="none"/>` + [-8, -3, 2, 7].map((x) => `<path d="M${n(x - 2)},-104.6 q1,-1.8 2,0 q1,-1.8 2,0" stroke="${gold}" stroke-width="0.6" fill="none"/>`).join("") + `<path d="M-12,-105.6 Q0,-103.6 12,-105.6" stroke="${INK}" stroke-width="2.2" fill="none"/><path d="M-12,-105.6 Q0,-103.6 12,-105.6" stroke="${verm}" stroke-width="1.4" fill="none"/><circle cx="${n(dir * 1)}" cy="-104.4" r="2" fill="${verm}"/>`);
  for (const [dx, l] of [[-1.6, 30], [2.2, 24]]) { const x = dir * 1 + dx, q = sw(dx) * 1.2; up.push(ln(`M${n(x)},-103 Q${n(x + dx + q)},${n(-103 + l * 0.5)} ${n(x + dx * 1.6 + q * 2)},${n(-103 + l)}`, INK, 1.9) + ln(`M${n(x)},-103 Q${n(x + dx + q)},${n(-103 + l * 0.5)} ${n(x + dx * 1.6 + q * 2)},${n(-103 + l)}`, verm, 1.1) + `<circle cx="${n(x + dx * 1.6 + q * 2)}" cy="${n(-103 + l + 1)}" r="1.4" fill="${gold}"/>` + [-1.4, -0.5, 0.5, 1.4].map((f) => `<path d="M${n(x + dx * 1.6 + q * 2)},${n(-103 + l + 2)} l${n(f)},5" stroke="${verm}" stroke-width="0.5"/>`).join("")); }
  // sleeves: rest (hanging wide) .. give (both forward under the box)
  const slv = (sd) => {
    const rest = [[sd * 12, -139], [sd * 25, -129], [sd * 31, -84], [sd * 23, -56], [sd * 11, -62], [sd * 12.5, -104]], giv = [[sd * 12, -139], [dir * 20 + sd * 5, -127], [dir * 37 + sd * 3, -111], [dir * 35 + sd * 3, -72], [dir * 21 + sd * 3, -70], [sd * 9 + dir * 4, -103]];
    const q = rest.map((a, i) => L2(a, giv[i], g)), near = sd === dir, col = near ? white : whiteS;
    let o = `<path d="M${q.map((a) => `${n(a[0])},${n(a[1])}`).join(" L")} Z" fill="${col}"/>`;
    [verm, jade, vio, pink].forEach((cc, i) => { const f = 0.05 + i * 0.07, a = L2(q[2], q[1], f * 0.5), b2 = L2(q[3], q[4], f * 1.6); o += `<path d="M${n(a[0])},${n(a[1])} L${n(b2[0])},${n(b2[1])}" stroke="${cc}" stroke-width="1.5"/>`; });
    o += `<path d="M${n(lerp(q[0][0], q[2][0], 0.5))},${n(lerp(q[0][1], q[2][1], 0.35))} Q${n(q[5][0] + sd * 4)},${n(q[5][1] + 8)} ${n(lerp(q[3][0], q[4][0], 0.5))},${n(lerp(q[3][1], q[4][1], 0.5) - 6)}" stroke="${whiteS}" stroke-width="0.7" fill="none"/>`;
    const mx = lerp(q[1][0], q[4][0], 0.45), my = lerp(q[1][1], q[4][1], 0.45); o += `<path d="M${n(mx - 3)},${n(my)} q1.5,-2.4 3,0 q1.5,-2.4 3,0 M${n(mx - 1.5)},${n(my - 2.2)} q1.5,-2.4 3,0" stroke="${gold}" stroke-width="0.7" fill="none"/>`;
    const hd2 = L2([sd * 27, -70], [dir * 37 + sd * 4.5, -108], g);
    o += `<path d="M${n(hd2[0] - 2.6)},${n(hd2[1] - 2)} Q${n(hd2[0])},${n(hd2[1] - 5.6 - g * 1.4)} ${n(hd2[0] + 2.6)},${n(hd2[1] - 2)} L${n(hd2[0] + 2)},${n(hd2[1] + 2)} L${n(hd2[0] - 2)},${n(hd2[1] + 2)} Z" fill="${skin}" opacity="${n(clamp(g * 3))}"/>`;
    return o;
  };
  up.push(slv(-dir));
  // head
  const hx = fx * 2, hy = -152, ex = hx + fx * 5, open = (1 - (st.blink || 0)) * (0.88 - 0.3 * sad);
  let head = `<path d="M-3.2,-147 L3.2,-147 L2.9,-137 L-2.9,-137 Z" fill="#e8cbbb"/>`;
  head += `<path d="${headPath(hx, hy, 10.6, 13.2, fx, 1.05)}" fill="${skin}"/>`;
  head += `<ellipse cx="${n(ex - 6.2)}" cy="${n(hy + 4.4)}" rx="2.6" ry="1.5" fill="#ffb0b8" stroke="none" opacity="0.6"/><ellipse cx="${n(ex + 6.2)}" cy="${n(hy + 4.4)}" rx="2.6" ry="1.5" fill="#ffb0b8" stroke="none" opacity="0.6"/>`;
  head += `<path d="M${n(hx - 11.8)},${n(hy - 2)} Q${n(hx - 12.8)},${n(hy - 19.4)} ${n(hx + fx * 2)},${n(hy - 19)} Q${n(hx + 12.8)},${n(hy - 19.4)} ${n(hx + 11.8)},${n(hy - 2)} L${n(hx + 10 + fx * 2)},${n(hy - 6.4)} Q${n(hx + fx * 6)},${n(hy - 9.4)} ${n(hx + fx * 4)},${n(hy - 13)} Q${n(hx + fx * 2)},${n(hy - 9.4)} ${n(hx - 10 + fx * 2)},${n(hy - 6.4)} Z" fill="${hair}"/>`;
  for (const sd of [-1, 1]) head += `<path d="M${n(hx + sd * 11.8)},${n(hy - 6)} Q${n(hx + sd * 13.2)},${n(hy + 12)} ${n(hx + sd * 12.4)},${n(hy + 31)} L${n(hx + sd * 8)},${n(hy + 31.4)} Q${n(hx + sd * 9.2)},${n(hy + 10)} ${n(hx + sd * 9.2 + fx)},${n(hy - 4.4)} Z" fill="${hair}"/><path d="M${n(hx + sd * 8)},${n(hy + 26.6)} h${n(sd * 4.6)}" stroke="${verm}" stroke-width="1.1"/>`;
  head += `<path d="M${n(hx - 6 + fx * 2)},${n(hy - 16)} Q${n(hx - 2 + fx * 2)},${n(hy - 12.6)} ${n(hx + 3 + fx * 2)},${n(hy - 16.4)}" stroke="#3b3358" stroke-width="1.2" fill="none"/>`;
  for (const d of [-1, 1]) head += `<path d="M${n(ex + d * 7)},${n(hy - 6 + sad * 1.3)} Q${n(ex + d * 4.5)},${n(hy - 7.6)} ${n(ex + d * 2)},${n(hy - 6.8 - sad * 1.6)}" stroke="${INK}" stroke-width="0.75" fill="none" stroke-linecap="round"/>`;
  head += eye(ex - 4.4, hy - 1.2, 2.7 * (dir > 0 ? 0.85 : 1), 2.4, st.look ?? dir * 0.35, open, -1, "#3a1c2c", 0.45, 1.4) + eye(ex + 4.4, hy - 1.2, 2.7 * (dir > 0 ? 1 : 0.85), 2.4, st.look ?? dir * 0.35, open, 1, "#3a1c2c", 0.45, 1.4);
  head += `<path d="M${n(ex + dir * 0.5)},${n(hy + 1.4)} q${n(dir * 1.6)},2.6 ${n(dir * 0.1)},3.6" stroke="#c89a8a" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  head += st.talk > 0.12 ? mouthOf(ex, hy + 8.4, 1.7, st.talk, 0, "#7a1428") : `<path d="M${n(ex - 1.9)},${n(hy + 8.2 + sad * 0.4)} Q${n(ex - 0.9)},${n(hy + 7.1)} ${n(ex)},${n(hy + 7.7)} Q${n(ex + 0.9)},${n(hy + 7.1)} ${n(ex + 1.9)},${n(hy + 8.2 + sad * 0.4)} Q${n(ex)},${n(hy + 10 - sad * 0.8)} ${n(ex - 1.9)},${n(hy + 8.2 + sad * 0.4)} Z" fill="#d8283c" stroke-width="0.4"/>`;
  // the crown: gold band, three prongs, a coral sprig, pearls on strings
  head += `<path d="M${n(hx - 8.4 + fx)},${n(hy - 16.6)} Q${n(hx + fx * 2)},${n(hy - 21.4)} ${n(hx + 8.4 + fx)},${n(hy - 16.6)} L${n(hx + 7.6 + fx)},${n(hy - 13.6)} Q${n(hx + fx * 2)},${n(hy - 18)} ${n(hx - 7.6 + fx)},${n(hy - 13.6)} Z" fill="${gold}"/>`;
  for (const [dx, hh] of [[-5, 7], [0, 11], [5, 7]]) head += `<path d="M${n(hx + dx + fx * 2 - 1.5)},${n(hy - 18.4 + Math.abs(dx) * 0.3)} L${n(hx + dx + fx * 2)},${n(hy - 18.4 - hh)} L${n(hx + dx + fx * 2 + 1.5)},${n(hy - 18.4 + Math.abs(dx) * 0.3)} Z" fill="${gold}"/><circle cx="${n(hx + dx + fx * 2)}" cy="${n(hy - 19.4 - hh)}" r="${dx ? 1.3 : 1.8}" fill="${dx ? jade : verm}"/>`;
  head += `<g transform="translate(${n(hx + fx * 2)},${n(hy - 28)}) scale(0.1)">${coral(0, 0, 90, 5, "#ff4e60", "#c22a4a")}</g>`;
  for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) head += `<circle cx="${n(hx + sd * 10.6 + fx + sw(i * 0.4 + sd) * 0.5 * i * 0.3)}" cy="${n(hy - 12 + i * 3)}" r="${i === 4 ? 1.3 : 0.85}" fill="${i === 4 ? verm : "#fffdf4"}" stroke-width="0.4"/>`;
  up.push(`<g transform="rotate(${n((st.tilt ?? sad * 5 * dir) - bow * 0.4)} 0 -140)">${head}</g>`);
  up.push(slv(dir));
  const inner = `${s}<g transform="rotate(${n(bow)} 0 -100)">${up.join("")}</g>`;
  return { svg: shadow(p, 0.4) + sk(p, st.lean || 0, inner), hold: { X: st.X + dir * 0.37, Y: Y0 + 1.1, Z: st.Z - 0.03 }, p };
}

// ---------------------------------------------------------------- the sea turtle (side view; shell plates drawn one by one)
// st: { X, Y, Z (belly point), size (1 = 1.9 m shell, big enough to carry a man; 0.45 on the beach), dir 1|-1, swim phase (radians),
//       pitch deg (nose down +), blink, look, tuck 0..1 (head and flippers pulled in: being beaten) }
// returns { svg, front (near flipper: draw after the rider), seat: {X, Y, Z} }
export function turtle(c, st = {}, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", front: "", seat: null };
  const size = st.size ?? 1, Y0 = st.Y || 0, p = P(c, st.X, Y0, st.Z), dir = st.dir ?? 1, ph = st.swim ?? t * 2.4, tuck = st.tuck || 0, pitch = (st.pitch || 0);
  const shellA = "#d08a30", shellB = "#b06a2a", shellL = "#f4c058", seam = "#5c2a24", skinC = "#9ccc8c", skinS = "#5c9c78", scale = "#2f7062", belly = "#f4e4b0";
  const top = (s) => -24 - 58 * Math.sin(Math.PI * clamp(s)) ** 0.62, rimB = (s) => -9 + 5 * Math.sin(Math.PI * s), rimT = (s) => rimB(s) - 13, X = (s) => lerp(-94, 88, s);
  const at = (s, v) => [X(s) + jit(Math.round(s * 97 + v * 31), 0.9), lerp(rimT(s), top(s), v) + jit(Math.round(s * 53 + v * 71), 0.9)];
  const cell = (pts2, sd) => {
    const cx = pts2.reduce((a, q) => a + q[0], 0) / pts2.length, cy = pts2.reduce((a, q) => a + q[1], 0) / pts2.length, sh = (f) => pts2.map((q) => `${n(cx + (q[0] - cx) * f)},${n(cy + (q[1] - cy) * f)}`).join(" L");
    return `<path d="M${sh(0.93)} Z" fill="${mix(shellA, hash(sd) < 0.5 ? shellB : shellL, hash(sd + 3) * 0.55)}" stroke-width="0.7"/><path d="M${sh(0.66)} Z" fill="none" stroke="${shellB}" stroke-width="0.7"/><path d="M${sh(0.4)} Z" fill="${shellL}" fill-opacity="0.5" stroke="${shellB}" stroke-width="0.6"/><path d="M${n(cx - 3)},${n(cy - 2)} l4,-2.4" stroke="#fff0b0" stroke-width="1" stroke-linecap="round"/>`;
  };
  let shell = `<path d="M${Array.from({ length: 21 }, (_, i) => `${n(X(i / 20))},${n(top(i / 20))}`).join(" L")} L${Array.from({ length: 11 }, (_, i) => `${n(X(1 - i / 10))},${n(rimB(1 - i / 10))}`).join(" L")} Z" fill="${seam}" stroke-width="1"/>`;
  const vS = [0.05, 0.23, 0.42, 0.6, 0.78, 0.95], cS = [0.07, 0.3, 0.52, 0.73, 0.93], vb = 0.6;
  for (let i = 0; i < 5; i++) { const a = vS[i], b2 = vS[i + 1], m = (a + b2) / 2; shell += cell([at(a + 0.015, vb), at(m, vb - 0.07), at(b2 - 0.015, vb), at(b2 - 0.02, 0.98), at(m, 1), at(a + 0.02, 0.98)], i + 1); }
  for (let i = 0; i < 4; i++) { const a = cS[i], b2 = cS[i + 1], m = (a + b2) / 2; shell += cell([at(a + 0.012, 0.03), at(b2 - 0.012, 0.03), at(b2 - 0.01, vb - 0.05), at(m + 0.04, vb - 0.1), at(m - 0.04, vb - 0.1), at(a + 0.02, vb - 0.05)].map((q, j) => j > 1 ? [q[0], Math.max(q[1], top((q[0] + 94) / 182) + 4)] : q), i + 11); }
  for (let i = 0; i < 12; i++) { const a = i / 12, b2 = (i + 1) / 12; shell += `<path d="M${n(X(a) + 0.8)},${n(rimT(a))} L${n(X(b2) - 0.8)},${n(rimT(b2))} L${n(X(b2) - 1.2)},${n(rimB(b2) - 1)} Q${n(X((a + b2) / 2))},${n(rimB((a + b2) / 2) + 2.4)} ${n(X(a) + 1.2)},${n(rimB(a) - 1)} Z" fill="${i % 2 ? shellB : shellA}" stroke-width="0.7"/><path d="M${n(X(a) + 4)},${n(rimT(a) + 4)} L${n(X(b2) - 4)},${n(rimT(b2) + 4)}" stroke="${shellL}" stroke-width="0.9"/>`; }
  // age on the shell: a chipped plate, barnacles, a tuft of weed
  shell += `<path d="M-52,-58 l5,3 l-2,5 l-6,-1 Z" fill="${seam}" stroke-width="0.5"/>` + [[-70, -30], [-64, -26], [-74, -24], [30, -18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#f4f0e4" stroke-width="0.5"/><circle cx="${x}" cy="${y}" r="0.9" fill="${seam}" stroke="none"/>`).join("") + [0, 1, 2, 3].map((i) => `<path d="M${-84 + i * 2},-20 q${-6 - i * 2},${-4 + Math.sin(ph + i) * 3} ${-12 - i * 3},${2 + i * 2}" stroke="#2f8f5a" stroke-width="1.2" fill="none"/>`).join("");
  const flip = (len, wd, sd, shade) => {     // a paddle with its scales placed one by one
    let g = `<path d="M0,-6 Q${n(len * 0.5)},${n(-wd * 0.9)} ${n(len)},${n(-2)} Q${n(len * 0.62)},${n(wd * 0.75)} ${n(len * 0.2)},${n(wd * 0.5)} Q-4,6 0,-6 Z" fill="${shade ? skinS : skinC}" stroke-width="0.8"/>`;
    for (let i = 0; i < 9; i++) { const f = 0.12 + i * 0.095, x = len * f, y = -wd * 0.42 * Math.sin(f * 3) - 1, r = (5.4 - i * 0.36) * (wd / 26); g += `<path d="M${n(x - r)},${n(y)} L${n(x)},${n(y - r * 0.8)} L${n(x + r)},${n(y + r * 0.2)} L${n(x)},${n(y + r)} Z" fill="${scale}" stroke-width="0.4"/>`; }
    for (let i = 0; i < 9; i++) { const x = len * (0.2 + hash(sd + i) * 0.55), y = wd * (0.02 + hash(sd + i * 3) * 0.34), r = 1.6 + hash(sd + i * 5) * 2; g += `<path d="M${n(x - r)},${n(y)} L${n(x)},${n(y - r * 0.7)} L${n(x + r)},${n(y)} L${n(x)},${n(y + r * 0.7)} Z" fill="${shade ? scale : skinS}" stroke-width="0.35"/>`; }
    return g;
  };
  const fa = lerp(52 + Math.sin(ph) * 30, 150, tuck), ra = lerp(150 + Math.sin(ph + 1.2) * 16, 170, tuck);
  const farFlip = `<g transform="translate(46,-12) rotate(${n(fa - 26 + Math.sin(ph + 0.6) * 8)})">${flip(84, 24, 3, true)}</g><g transform="translate(-74,-10) rotate(${n(ra + 10)})">${flip(46, 20, 9, true)}</g>`;
  const nearFlip = `<g transform="translate(54,-8) rotate(${n(fa)}) scale(${n(1 - tuck * 0.4)})">${flip(96, 28, 5, false)}</g><g transform="translate(-70,-6) rotate(${n(ra)})">${flip(52, 22, 7, false)}</g>`;
  // neck and head: kind, heavy-lidded eye
  const hd3 = lerp(0, -34, tuck), blink = st.blink || 0, nod = Math.sin(ph * 0.5) * 2 + (st.headUp || 0);
  let head = `<path d="M70,-30 Q96,-40 118,-44 L122,-22 Q98,-12 72,-10 Z" fill="${skinC}" stroke-width="0.8"/><path d="M76,-12 Q98,-13 120,-24 L121,-22 Q98,-12 74,-10 Z" fill="${belly}" stroke="none"/>` + [84, 92, 100, 108].map((x, i) => `<path d="M${x},${-34 - i} q3,9 ${-1 + i * 0.3},${18 - i}" stroke="${skinS}" stroke-width="0.7" fill="none"/>`).join("");
  head += `<g transform="rotate(${n(-nod)} 116 -34)"><path d="M108,-50 Q124,-62 144,-52 Q158,-44 157,-34 Q154,-25 142,-22 Q122,-18 110,-26 Q104,-38 108,-50 Z" fill="${skinC}" stroke-width="0.8"/><path d="M112,-27 Q126,-21 142,-23.5 Q150,-25 154,-29 Q140,-25.6 128,-26.6 Z" fill="${belly}" stroke="none"/>
    ${[[118, -51, 5], [128, -55, 5.4], [138, -52, 4.6], [122, -44, 3.6], [112, -42, 3.4], [146, -47, 3]].map(([x, y, r], i) => `<path d="M${x - r},${y} L${x - r * 0.3},${y - r * 0.8} L${x + r * 0.8},${y - r * 0.6} L${x + r},${y + r * 0.3} L${x},${y + r * 0.8} Z" fill="${scale}" stroke-width="0.4"/>`).join("")}
    <path d="M157,-35 Q151,-31.6 144,-31.6 Q140,-32 137.4,-34" stroke="${INK}" stroke-width="0.8" fill="none" stroke-linecap="round"/><path d="M152,-43 l1.6,1.2" stroke="${INK}" stroke-width="0.7" stroke-linecap="round"/>
    <ellipse cx="136" cy="-41" rx="6.6" ry="${n(6.2 * (1 - blink * 0.9))}" fill="#fff8e4" stroke-width="0.7"/>${blink < 0.6 ? `<circle cx="${n(137 + (st.look || 0) * 1.6)}" cy="-40.4" r="4.7" fill="#2a1c14" stroke="none"/><circle cx="${n(138.4 + (st.look || 0) * 1.6)}" cy="-42.2" r="1.3" fill="#fff" stroke="none"/><circle cx="${n(135.6 + (st.look || 0) * 1.6)}" cy="-39" r="0.6" fill="#fff" stroke="none" opacity="0.8"/>` : ""}
    <path d="M129,-42.4 Q135,-49.4 143.4,-43.6" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M130,-36.4 Q136,-33.4 142,-37" stroke="${skinS}" stroke-width="0.7" fill="none"/><path d="M128,-46.6 Q134,-51.6 141,-48.4" stroke="${skinS}" stroke-width="0.6" fill="none"/></g>`;
  head = `<g transform="translate(-26,10) scale(1.24)">${head}</g>`;
  const body = `<path d="M-80,-12 Q-40,6 0,5 Q44,4 74,-12 L70,-16 L-78,-16 Z" fill="${belly}" stroke-width="0.8"/>` + [-50, -22, 6, 34].map((x) => `<path d="M${x},-12 l1,${x > -40 && x < 30 ? 15 : 10}" stroke="#c8b078" stroke-width="0.6"/>`).join("") + `<path d="M-90,-14 Q-106,-12 -112,-4 Q-100,-6 -88,-9 Z" fill="${skinC}" stroke-width="0.7"/>`;
  const tf = `${place(p, pitch * dir, size)} scale(${dir},1)`;
  const g = (inner) => `<g class="sk" filter="url(#wb)" transform="${tf}">${inner}</g>`;
  const a = pitch * dir * Math.PI / 180, sx = dir * -6 * size, sy = -80 * size, wx = sx * Math.cos(a) - sy * Math.sin(a), wy = sx * Math.sin(a) + sy * Math.cos(a);
  return { svg: (Y0 < 0.05 ? shadow(p, 1.0 * size) : "") + g(`${farFlip}<g transform="translate(${n(hd3)},0)">${head}</g>${body}${shell}`), front: g(nearFlip), seat: { X: st.X + wx / 100, Y: Y0 - wy / 100, Z: st.Z - 0.01 }, p };
}

// ================================================================ props
// the tamatebako. st: { X, Y, Z, size (1 = 30 cm wide), lid 0 (shut) .. 1 (open), cord 0 (tied) .. 1 (untied, lying loose),
//   worn 0..1 (washed up: chips, barnacles, weed), held: true (in someone's hands: the untied cord dangles instead of lying on the sand), rot deg }. returns { svg, mouth: {X, Y, Z} (where the smoke comes out), top: screen pt }
export function box(c, st = {}, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", mouth: null };
  const size = st.size ?? 1, Y0 = st.Y || 0, p = P(c, st.X, Y0, st.Z), o = clamp(st.lid || 0), cu = clamp(st.cord || 0), worn = st.worn || 0;
  const K = ACC.lacquer, KL = ACC.lacquerL, G = ACC.gold, R = ACC.cord, RS = ACC.cordS;
  let s = `<path d="M-15,0 L-15,-17 L15,-17 L15,0 Z" fill="${K}" stroke="${INK}" stroke-width="0.7"/><path d="M15,0 L23,-7 L23,-24 L15,-17 Z" fill="#0d0a14" stroke="${INK}" stroke-width="0.7"/>`;
  s += `<path d="M-13.6,-1.4 L-13.6,-15.4 L13.6,-15.4 L13.6,-1.4 Z" fill="none" stroke="${G}" stroke-width="0.45"/><path d="M-14.6,-16.2 L14.4,-16.2" stroke="${KL}" stroke-width="0.6"/>`;
  for (const [x, y, r] of [[-10, -1.6, 3.4], [-4.4, -1.6, 3], [-7.2, -4, 2.8], [8.6, -1.6, 2.6], [11.6, -3, 1.8]]) s += [1, 0.62, 0.3].map((f) => `<path d="M${n(x - r * f)},${n(y)} A${n(r * f)},${n(r * f)} 0 0 1 ${n(x + r * f)},${n(y)}" fill="none" stroke="${G}" stroke-width="0.5"/>`).join("");
  // a gold pine sprig, needle by needle, and gold dust
  s += `<path d="M2,-3.4 Q5,-8 4.4,-13" stroke="${G}" stroke-width="0.7" fill="none"/>` + [[3.4, -6, -1], [4.6, -8.6, 1], [4.2, -11, -1], [4.5, -13, 1]].map(([x, y, sd]) => [-0.5, 0, 0.5, 1].map((a) => `<path d="M${x},${y} l${n(sd * 3.4 * Math.cos(a))},${n(-3.4 * Math.sin(a) - 0.6)}" stroke="${G}" stroke-width="0.4"/>`).join("")).join("");
  for (let i = 0; i < 22; i++) s += `<circle cx="${n(-12.4 + hash(i + 3) * 24.6)}" cy="${n(-5.4 - hash(i + 9) * 9.4)}" r="${n(0.22 + 0.3 * hash(i))}" fill="${G}" stroke="none" opacity="${n(0.5 + 0.5 * hash(i + 5))}"/>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="${n(16.5 + hash(i + 23) * 5)}" cy="${n(-5 - hash(i + 29) * 14 - (hash(i + 23) * 5) * 0.9)}" r="0.3" fill="${G}" stroke="none" opacity="0.7"/>`;
  if (o > 0.02) s += `<path d="M-13.8,-17.4 L13.8,-17.4 L21.4,-23.6 L-6.2,-23.6 Z" fill="#06040a" stroke="${INK}" stroke-width="0.5"/><path d="M-13,-17.8 L13,-17.8" stroke="${RS}" stroke-width="0.7"/>`;
  // lid: lifts and tips back
  let lid = `<path d="M-15.8,-16.4 L-15.8,-22 L15.8,-22 L15.8,-16.4 Z" fill="${K}" stroke="${INK}" stroke-width="0.7"/><path d="M15.8,-16.4 L23.8,-23.4 L23.8,-29 L15.8,-22 Z" fill="#0d0a14" stroke="${INK}" stroke-width="0.7"/><path d="M-15.8,-22 L15.8,-22 L23.8,-29 L-7.8,-29 Z" fill="${KL}" stroke="${INK}" stroke-width="0.7"/>`;
  lid += `<path d="M-11,-23.2 L9,-23.2 L7,-25 L-9.6,-25 Z" fill="#5a5078" stroke="none" opacity="0.8"/><path d="M-15,-17.6 L15,-17.6 M-15,-20.8 L15,-20.8" stroke="${G}" stroke-width="0.4"/>` + [[-2, -26.6, 2.4], [3.6, -26.6, 2], [12, -25.6, 2.2], [15.4, -27, 1.6]].map(([x, y, r]) => [1, 0.55].map((f) => `<path d="M${n(x - r * f)},${n(y)} A${n(r * f)},${n(r * f * 0.5)} 0 0 1 ${n(x + r * f)},${n(y)}" fill="none" stroke="${G}" stroke-width="0.45"/>`).join("")).join("");
  for (let i = 0; i < 9; i++) s += "";
  if (worn > 0) {      // chipped lacquer: red undercoat, bare wood at the heart of the chip; barnacles; a strand of weed
    const chip = (x, y, r, sd) => `<path d="M${n(x - r)},${n(y)} L${n(x - r * 0.2)},${n(y - r * 0.9)} L${n(x + r)},${n(y - r * 0.3)} L${n(x + r * 0.5)},${n(y + r * 0.8)} Z" fill="#8a2832" stroke="none" opacity="${n(worn)}"/><path d="M${n(x - r * 0.4)},${n(y)} L${n(x)},${n(y - r * 0.4)} L${n(x + r * 0.5)},${n(y + r * 0.1)} Z" fill="#d2a874" stroke="none" opacity="${n(worn)}"/>`;
    s += chip(-13.6, -1.6, 1.5, 1) + chip(13.4, -15, 1.2, 2) + chip(20, -9, 1.1, 4);
    lid += chip(-14.4, -20.6, 1.1, 6) + chip(5, -27.8, 1.0, 8);
    s += `<g opacity="${n(worn)}">` + [[-11, -8.4, 1.5], [-9, -10.6, 1.1], [-12.4, -11.4, 0.9], [19, -15, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f1ecdc" stroke="${INK}" stroke-width="0.35"/><circle cx="${x}" cy="${y}" r="${n(r * 0.4)}" fill="#5c5466" stroke="none"/>`).join("") + `<path d="M-6,-9 l7,2.4 M-3,-12.4 l4.6,1" stroke="#4a4266" stroke-width="0.35"/><path d="M-17,0.6 Q-8,-1.4 0,0.8 Q9,-1 18,0.4 L24,-4.6" stroke="${M.sand}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>`;
    lid += `<path d="M10,-29 Q14,-24 17,-21.6 Q19.6,-17 18,-11.6 M17,-21.6 q3.4,0.4 4.6,3.4" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round" opacity="${n(worn)}"/><path d="M10,-29 Q14,-24 17,-21.6 Q19.6,-17 18,-11.6 M17,-21.6 q3.4,0.4 4.6,3.4" stroke="#2f8f5a" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="${n(worn)}"/>`;
  }
  // the red cord: two bands, a bow, two tasselled tails. cord 0..0.5 the bow comes undone, 0.5..1 the bands slide off and lie loose
  const v = clamp((cu - 0.45) / 0.55), bw = 1 - clamp(cu / 0.5), e2 = ease(v);
  const strand = (a, b2, cp, wav = 0) => { const d = `M${n(a[0])},${n(a[1])} C${n(cp[0] - wav)},${n(cp[1] - wav * 0.7)} ${n(cp[0] + wav)},${n(cp[1] + wav * 0.7)} ${n(b2[0])},${n(b2[1])}`; return ln(d, INK, 1.5) + ln(d, R, 1.0) + ln(d, "#ff8a6a", 0.3, `stroke-dasharray="0.9 1.5"`) + ln(d, RS, 0.35, `stroke-dasharray="0.5 1.9" stroke-dashoffset="1.2"`); };
  const tassel = (x, y, rot) => `<g transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})"><circle r="1.7" fill="${R}" stroke="${INK}" stroke-width="0.5"/><path d="M-1.2,1 h2.4" stroke="${G}" stroke-width="0.7"/>${[-1.8, -1.1, -0.4, 0.4, 1.1, 1.8].map((f, i) => `<path d="M${n(f * 0.6)},1.4 L${n(f + jit(i + x, 0.3))},${n(7 + hash(i + 3) * 1.6)}" stroke="${i % 2 ? R : RS}" stroke-width="0.55" stroke-linecap="round"/>`).join("")}</g>`;
  let cordFront = "", cordLid = "";
  // vertical band (front face) and horizontal band; untied they drop to the sand either side
  const hl = st.held, sw2 = Math.sin(t * 2.3) * 1.5;
  const vA = L2([0.6, 0], hl ? [-11, -1] : [-21, 2.4], e2), vB = L2([0.6, -16.4], hl ? [-13 + sw2, 21] : [-52, 4.4], e2), vC = L2([0.6, -8], hl ? [-14, 9] : [-28, -1.6 - 3 * Math.sin(e2 * Math.PI)], e2);
  const hA = L2([-15, -9.4], hl ? [13, -1] : [18, 3], e2), hB = L2([15, -9.4], hl ? [16 - sw2, 25] : [56, 3.4], e2), hC = L2([0, -9.4], hl ? [18, 10] : [29, -1 - 5 * Math.sin(e2 * Math.PI)], e2);
  cordFront += strand(hA, hB, hC, hl ? 0 : 13 * e2) + (v < 0.3 ? strand([15, -9.4], [23, -16.4], [19, -13]) : "") + strand(vA, vB, vC, hl ? 0 : -12 * e2);
  if (v > 0.5) cordFront += tassel(vB[0], vB[1], hl ? 4 : 80) + tassel(hB[0], hB[1], hl ? -4 : -70);
  if (v < 0.3) cordLid += strand([0.6, -16.4], [0.6, -22], [0.6, -19]) + strand([0.6, -22], [8.6, -29], [4.6, -25.5]);
  if (bw > 0.02) { const bx = 1, by = -22.6, sway = Math.sin(t * 2) * 0.4;
    for (const sd of [-1, 1]) cordLid += `<g transform="translate(${bx},${by}) scale(${n(bw)})"><path d="M0,0 Q${n(sd * 5)},-8.6 ${n(sd * 10.4)},-4.4 Q${n(sd * 11.6)},0.6 0,0 Z" fill="${R}" stroke="${INK}" stroke-width="0.6"/><path d="M${n(sd * 2.4)},-1.4 Q${n(sd * 6)},-5 ${n(sd * 8.6)},-3.4" stroke="${RS}" stroke-width="0.6" fill="none"/></g>`;
    cordLid += strand([bx, by], [bx - 5.4 + sway, by + 13 + (1 - bw) * 5], [bx - 4.6, by + 5]) + strand([bx, by], [bx + 5 - sway, by + 11 + (1 - bw) * 6], [bx + 5, by + 4]) + tassel(bx - 5.4 + sway, by + 14 + (1 - bw) * 5, 8) + tassel(bx + 5 - sway, by + 12 + (1 - bw) * 6, -8);
    cordLid += `<path d="M${bx - 2},${by - 1.6} Q${bx},${by - 3} ${bx + 2},${by - 1.6} Q${bx + 2.4},${by + 1.4} ${bx},${by + 2} Q${bx - 2.4},${by + 1.4} ${bx - 2},${by - 1.6} Z" fill="${R}" stroke="${INK}" stroke-width="0.6"/>`;
  }
  s += cordFront + `<g transform="translate(${n(-o * 5)},${n(-o * 12)}) rotate(${n(-o * 24)} -6 -24)">${lid}${cordLid}</g>`;
  const sc = p.s / 100 * size, rot = st.rot || 0;
  return { svg: `<ellipse cx="${n(p.x + 4 * sc)}" cy="${n(p.y)}" rx="${n(24 * sc)}" ry="${n(5 * sc)}" fill="url(#softs)"/><g filter="url(#wb)" transform="${place(p, rot, size)}">${s}</g>`, mouth: { X: st.X + 0.04 * size, Y: Y0 + 0.2 * size, Z: st.Z - 0.01 }, top: { x: p.x + 4 * sc, y: p.y - 26 * sc }, topW: { X: st.X + 0.04 * size, Y: Y0 + 0.255 * size, Z: st.Z } };
}
// white smoke: hand-cut curls, puff by puff. o: { X, Y, Z (source), amt 0..1 (how far the column has risen), rise m, spread, drift m (wind: how far the top leans in X), seed }
export function smoke(c, o = {}, t = 0) {
  const { X = 0, Y = 0.2, Z = 4, amt = 1, seed = 1, rise = 2.6, spread = 1, drift = 0 } = o;
  if (amt <= 0.01 || !vis(c, Z)) return "";
  const b = board(c, X, Y, Z), N = 12, lw = Math.max(1, b.lw * 0.9), ol = mix(INK, "#8a86b0", 0.55); let s = "";
  for (let i = N - 1; i >= 0; i--) {
    const a = (i + (t * 0.45) % 1) / N; if (a > amt) continue;
    const grow = clamp((amt - a) * 5 + 0.25), r = (0.06 + 0.44 * a ** 0.8) * spread * (0.85 + 0.3 * hash(seed + i * 3)) * grow, x = (Math.sin(a * 5.2 + seed + t * 0.5) * 0.3 * a + jit(seed + i, 0.12) * a) * spread + drift * a * a, y = rise * a ** 0.85;
    const cx = b.x(x), cy = b.y(y), R = r * b.k, fl = i % 2 ? 1 : -1;
    const lobes = Array.from({ length: 9 }, (_, j) => { const an = j / 9 * 6.283 + seed + i, rr = R * (0.78 + 0.4 * hash(seed + i * 7 + j)); return { x: cx + Math.cos(an) * rr, y: cy + Math.sin(an) * rr * 0.86 }; });
    s += `<path d="${blob(lobes)}" fill="${ACC.smokeS}" stroke="${ol}" stroke-width="${lw}"/>` + flat(ring(cx - R * 0.12, cy - R * 0.16, R * 0.74, seed + i * 5, 0.14, 9), ACC.smoke);
    s += ln(`M${n(cx + fl * R * 0.5)},${n(cy + R * 0.1)} q${n(-fl * R * 0.12)},${n(-R * 0.56)} ${n(-fl * R * 0.56)},${n(-R * 0.42)} q${n(-fl * R * 0.36)},${n(R * 0.14)} ${n(-fl * R * 0.2)},${n(R * 0.46)} q${n(fl * R * 0.14)},${n(R * 0.2)} ${n(fl * R * 0.32)},${n(R * 0.04)}`, ol, lw * 1.1);
    if (i % 3 === 0) s += `<path d="M${n(cx - fl * R * 1.05)},${n(cy + R * 0.2)} q${n(-fl * R * 0.4)},${n(-R * 0.1)} ${n(-fl * R * 0.36)},${n(-R * 0.5)} q${n(fl * R * 0.3)},${n(R * 0.16)} ${n(fl * R * 0.36)},${n(R * 0.5)} Z" fill="${ACC.smoke}" stroke="${ol}" stroke-width="${lw}"/>`;
  }
  return s;
}
// the keeper's staff on its own (for the close-up where it slams the lid shut): tip at X, Y, Z; rot deg; flame 0..1
export function staff(c, st = {}, t = 0) {
  if (!vis(c, st.Z)) return "";
  const p = P(c, st.X, st.Y || 0, st.Z), fl = (st.flame ?? 0.8) * (1 + 0.06 * Math.sin(t * 21)), sw = Math.sin(t * 2.2) * 1.5;
  const cordK = (y, q) => `<path d="M-1.8,${y} L1.8,${y + 1} M-1.8,${y + 1.6} L1.8,${y + 2.6}" stroke="#d6b071" stroke-width="0.9"/><path d="M1.8,${y + 1.5} Q${n(3 + q)},${y + 7} ${n(2 + q * 1.5)},${y + 12}" stroke="#c9463e" stroke-width="0.8" fill="none"/><circle cx="${n(2 + q * 1.5)}" cy="${y + 12.5}" r="1" fill="#c9463e" stroke="none"/>`;
  return `<g transform="${place(p, st.rot || 0)}"><circle cx="8" cy="-156" r="${n(14 + 50 * fl)}" fill="url(#flame)"/></g><g class="ol" transform="${place(p, st.rot || 0)}">
    <rect x="-1.8" y="-150" width="3.6" height="150" rx="1.4" fill="url(#wood)"/><path d="M0,-150 Q0,-160 5,-163 L8,-163" stroke="#4e2f1d" stroke-width="2.4" fill="none"/>${cordK(-128, sw)}${cordK(-60, sw * 0.6)}
    <path d="M8,-163 L8,-158" stroke="#3a2a2a" stroke-width="0.8"/><path d="M2,-156 Q0.5,-150 2,-142 Q8,-139.5 14,-142 Q15.5,-150 14,-156 Z" fill="#cfe6ff" fill-opacity="0.35" stroke="#e9f3ff" stroke-width="0.8"/><path d="M1.5,-159 L14.5,-159 L14,-156 L2,-156 Z" fill="#3a2a2a"/><path d="M6.6,-143 L9.4,-143 L9.4,-148 L6.6,-148 Z" fill="#fff4e0"/>
    <path d="M8,${n(-148 - 8 * fl)} Q${n(8 + 2.8 * fl)},${n(-149 - 2 * fl)} 8,-148 Q${n(8 - 2.8 * fl)},${n(-149 - 2 * fl)} 8,${n(-148 - 8 * fl)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/></g>`;
}
