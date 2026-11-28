// Legend "The Fisherman and his Wife" (Grimm KHM 19): the Baltic shore of Pomerania, Grandma's tar-black hut and its
// three wish versions, the sea as the counter (one mood number), the flounder, the kid's fishing rod. Design only.
// Same conventions as legend.mjs / legend-sea.mjs: metres, X right, Y up, Z into the picture, P(c, X, Y, Z).
// Every frame: L.resetIds(); BAL.resetIds(); BAL.mood(m); then BAL.defs(), layers, BAL.grade(), BAL.vignette().
// Nothing uses Math.random or a clock: all wobble is seeded, frames render in any order. No lettering anywhere.
//
//   mood(m)                       0 green-and-yellow evening calm | 1 grey and purple | 2 dark blue, thick, oily | 3 black |
//                                 4 black storm. Fractions blend neighbours. Fills M (the palette) for everything below.
//   defs(), grade(), vignette()   page defs (includes legend.mjs defs for the hosts); a light mood wash; the vignette
//   sky(c, t, { sun: [x, y, r] | false, bolt: 0..1, boltX })          bands, low sun (calm only), cloud shelves, gulls, lightning
//   sea(c, t, { glitter: x | false })                                  far coast with a church spire, water bands, swell, oil sheen, whitecaps
//   towers(c, t, { amt: 0..1, n: 5 })                                  the storm waves standing up "like church towers" (amt = how far up)
//   shore(c, t, { tufts: true })                                       sand, wet edge, foam line, dune ridges, marram tufts, pebbles
//   marram(c, { X, Z, size, seed }, t)                                 one tuft of beach grass, blade by blade
//   driftwood(c, { X, Z, size, rot, seed })                            a bleached log with stubs and grain
//   jetty(c, t) -> { svg, cam }                                        the weathered jetty (JETTY); cam = a camera that stands a host ON the deck:
//                                                                      L.kid(jetty.cam, { X: JETTY.X, Z: 11.5, ... })  (or deckCam(c))
//   home(c, { X, Z, stage, light, smoke }, t) -> { svg, door, top }    stage 0 the pot-shaped tar hut | 1 brick cottage, red tiles |
//                                                                      2 stone castle | 3 brick-Gothic Hanseatic palace, green copper, gold banners. Fractions cross-fade.
//   near(c, t)                                                         foreground dune corners with big grass (draw last, before rain)
//   rain(t, amt)                                                       storm rain streaks + spray (screen space)
//   coast(c, t, { stage, towers, bolt, sun, glitter, drift: true, light, rain }) -> { back, front, jetty }   the whole set in order
//   flounder(x, y, len, { rot, flip, open, mood, look: [dx, dy], crown, blink, wet })   screen space; rot 0 = head left, 90 = head up.
//                                 open 0..1 = the talking mouth, mood 1 friendly smile .. 0 cold, crown = opacity of the gold mark
//   flounderOnLine(end, len, o)   hanging head-up from the hook at `end` (rod().end); o.swing deg
//   flounderHeld(kd, len, o)      lying in the kid's two hands at chest height (kd = L.kid() result); draw after the kid
//   flounderUnder(x, y, len, o)   lying flat under the surface, seen from above through the water (o.depth 0..1)
//   flounderRise(x, y, len, o)    head out of the waves at waterline y (o.out 0..1 how far out), foam collar
//   eyeShot(t, { open, look, cx, cy, r })   FRAME 0: full-frame black storm water, the huge gold eye opening under it
//   kidHand(kd, reachL)           screen point of the kid's bell hand for that reachL; rod(hand, kd.p.s / 100, { ang, len, bend, line, swing })
//                                 -> { svg, tip, end }: a hazel rod and its line (ang deg from vertical, minus = towards screen left)
//   BALTIC                        where things stand + cameras (wide, far, door, jetty, two, storm)
import { W, H, INK, n, lerp, clamp, hash, mix, P, PAL, defs as baseDefs, toScreen } from "./legend.mjs";

const NEAR = 0.3;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const LW = (k) => n(Math.min(3, Math.max(0.7, k * 0.011)));
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
const curve = (a) => `M${pt(a[0])} ` + a.slice(1, -1).map((p, i) => { const q = a[i + 2], e = i === a.length - 3 ? q : { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; return `Q${pt(p)} ${pt(e)}`; }).join(" ");
const ring = (x, y, r, seed, wob = 0.07, N = 16, sq = 1) => blob(Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2, rr = r * (1 + jit(seed + i, wob)); return { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * sq }; }));
const shp = (d, fill, lw = 1, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round" ${extra}/>`;
const flat = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" stroke="none" ${extra}/>`;
const ln = (d, col, w, extra = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
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
const wline = (y, seed, amp = 14, step = 120, ph = 0) => Array.from({ length: Math.ceil((W + 80) / step) + 1 }, (_, i) => ({ x: -40 + i * step, y: y + jit(seed * 37 + i, amp) * (ph ? 0.6 + 0.4 * Math.sin(ph + i * 1.9) : 1) }));
const band = (a, fill, extra = "") => `<path d="M-40,${H + 40} L${a.map(pt).join(" L")} L${W + 40},${H + 40} Z" fill="${fill}" ${extra}/>`;
const shelf = (a, fill, extra = "") => `<path d="M-40,-40 L${a.map(pt).join(" L")} L${W + 40},-40 Z" fill="${fill}" ${extra}/>`;

// ---------------------------------------------------------------- colour: one mood number, five states
export const MOOD = { calm: 0, grey: 1, blue: 2, black: 3, storm: 4 };
const SEAPAL = {   // [0 calm, 1 grey-purple, 2 oily blue, 3 black, 4 storm]
  sky0: ["#12947e", "#3a2c8e", "#080d5a", "#05030e", "#020108"], sky1: ["#74cc62", "#6a50b6", "#14249a", "#130a2c", "#0b061e"],
  sky2: ["#f6dc44", "#a27ccc", "#2a44be", "#2e0f4e", "#220c48"], sky3: ["#ff9c2e", "#eaa6c6", "#5a7ae6", "#8c1a5e", "#6420b0"],
  sea0: ["#078664", "#44328e", "#060c56", "#020207", "#020207"], sea1: ["#15b072", "#644eae", "#0a1a88", "#05050f", "#04040e"],
  sea2: ["#62d056", "#8a72c6", "#0e2eae", "#0a0a1c", "#07071a"], sea3: ["#d6e640", "#b4a0da", "#1a46d0", "#12122e", "#0c0c26"],
  seaInk: ["#075c4c", "#2a1e66", "#030634", "#000000", "#000000"], seaL: ["#fff48c", "#efe2ff", "#7c9eff", "#3c2a80", "#2c3ce6"],
  foam: ["#fffbe0", "#f4eeff", "#b4c6ff", "#7a72b2", "#e4ffe6"],
  sand: ["#ffe494", "#d2c2e0", "#5466b6", "#262248", "#1a183a"], sandS: ["#f0b450", "#a892c4", "#3a4a9a", "#18153a", "#100f2c"],
  sandL: ["#fff6c8", "#eee2f6", "#7c8ed6", "#3a3464", "#2a2a58"], sandW: ["#b8b848", "#8876b4", "#28368a", "#0f0d2c", "#090920"],
  grass: ["#3f9a38", "#586a98", "#20368c", "#141838", "#0e102a"], grassL: ["#d4e652", "#aab2d6", "#4a6ace", "#2c306c", "#2a3288"], grassS: ["#1c6a3a", "#3a4674", "#12205e", "#0a0c22", "#07081a"],
  wood: ["#bc7636", "#8c7498", "#38448a", "#1e1c3e", "#161530"], woodS: ["#7a4422", "#5c487a", "#202a66", "#100f28", "#0a0a1e"], woodL: ["#eeb060", "#bea8c8", "#6278c4", "#3a3668", "#363c80"],
  drift: ["#f6e0ac", "#d6cae0", "#7080c4", "#3a3662", "#2e2c56"], driftS: ["#c89c5c", "#9c8cb4", "#44509a", "#1e1c40", "#181636"],
  far: ["#237a52", "#4c3c88", "#0a1466", "#090514", "#05030c"],
  cloud: ["#ffc86a", "#8a72ba", "#1a2a8e", "#0f0822", "#0b0618"], cloudS: ["#ff7c50", "#5a4696", "#0d186a", "#050310", "#04020c"],
  amb: ["#ffcf6a", "#8a7cc2", "#1a2aa2", "#0c0a2c", "#080622"], vig: ["#5a3a0a", "#2a1a5a", "#02062a", "#000000", "#000000"],
};
const AMBK = [0.06, 0.22, 0.36, 0.5, 0.56];
export const M = {};
let MV = 0, UID = 0, AK = 0;
export function resetIds() { UID = 0; }
const pick = (arr, m, f = mix) => { const i = Math.min(3, Math.floor(m)); return f(arr[i], arr[i + 1], m - i); };
export function mood(m = 0) {
  if (typeof m === "string") m = MOOD[m];
  MV = Math.max(0, Math.min(4, m));
  for (const k in SEAPAL) M[k] = pick(SEAPAL[k], MV);
  AK = pick(AMBK, MV, lerp);
  PAL.baltic = { sky: [M.sky0, M.sky1, M.sky2, M.sky3, M.sky3], fog: M.sea1, fogC: M.sky3, hills: [M.far, M.far], pag: [M.far, M.far], moon: false, stars: false };
  return M;
}
mood(0);
const tc = (col, k = 1) => mix(col, M.amb, AK * k);        // a local colour seen in this mood's light
const wCalm = () => clamp(1 - MV), wOil = () => clamp(1 - Math.abs(MV - 2)), wStorm = () => clamp(MV - 3), wOver = () => clamp(MV);
export function defs() {
  return baseDefs("baltic") + `<defs>
  <radialGradient id="vgb" cx="0.5" cy="0.5" r="0.8"><stop offset="0.6" stop-color="${M.vig}" stop-opacity="0"/><stop offset="1" stop-color="${M.vig}" stop-opacity="0.4"/></radialGradient>
  <radialGradient id="softb"><stop offset="0" stop-color="${mix(M.sandW, INK, 0.6)}" stop-opacity="0.5"/><stop offset="1" stop-color="${M.sandW}" stop-opacity="0"/></radialGradient>
</defs>`;
}
// a light wash over the cast so the hosts sit in the mood (draw after the cast, before near())
export const grade = () => AK > 0.12 ? `<rect width="${W}" height="${H}" fill="${mix("#ffffff", M.amb, AK * 0.55)}" style="mix-blend-mode:multiply"/>` : "";
export const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vgb)"/>`;
const horizon = (c) => P(c, 0, 0, 4000).y;

// ---------------------------------------------------------------- sky
function streak(x, y, w, h, seed, col, op = 1) { return flat(blob([{ x: x - w, y }, { x: x - w * 0.3, y: y - h * (1 + jit(seed, 0.4)) }, { x: x + w * 0.4, y: y - h * 0.6 }, { x: x + w, y: y + jit(seed + 1, h * 0.4) }, { x: x + w * 0.2, y: y + h * 0.7 }, { x: x - w * 0.5, y: y + h * (0.8 + jit(seed + 2, 0.3)) }]), col, `opacity="${n(op)}"`); }
export function sky(c, t, o = {}) {
  const hy = horizon(c), cw = wCalm(), ov = wOver(), st = wStorm();
  const gid = "skyb" + (UID++);
  let s = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${n(hy)}"><stop offset="0" stop-color="${M.sky0}"/><stop offset="0.36" stop-color="${M.sky1}"/><stop offset="0.68" stop-color="${M.sky2}"/><stop offset="0.93" stop-color="${M.sky3}"/></linearGradient><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
  [0.3, 0.55, 0.8].forEach((f, i) => { s += band(wline(hy * f, 11 + i, 26, 130), M["sky" + (i + 1)], `opacity="0.3"`) + flat(blob(wline(hy * (f + 0.07), 14 + i, 22, 180).slice(1 + i, 6 + i).concat([{ x: 500 + i * 120, y: hy * (f + 0.14) }])), M["sky" + (i + 1)], `opacity="0.3"`); });
  if (cw > 0.02 && o.sun !== false) {      // the low evening sun, cut by hand, sinking behind the water
    const [sx, sy, sr] = o.sun || [330, hy - 30, 78];
    s += `<g opacity="${n(cw)}">` + flat(ring(sx, sy, sr * 2.3, 5, 0.07, 18, 0.7), "#fff3a0", `opacity="0.22"`) + flat(ring(sx, sy, sr * 1.5, 9, 0.07, 18, 0.8), "#fff3a0", `opacity="0.4"`) + flat(ring(sx, sy, sr, 3, 0.025, 22), "#fffbd0") + `</g>`;
  }
  // thin evening streaks (calm) turning into heavy shelves hanging from the top (every wish adds a layer)
  for (let i = 0; i < 6; i++) { const x = ((hash(i + 4) * 1500 + t * (4 + 3 * hash(i))) % 1500) - 200, y = hy * (0.4 + 0.5 * hash(i + 21)); s += streak(x, y, 130 + 170 * hash(i + 7), 9 + 10 * hash(i + 9), i * 5, i % 2 ? M.cloudS : M.cloud, 0.9 * (1 - 0.6 * ov)); }
  if (ov < 0.98) for (let i = 0; i < 4; i++) {      // a few hand-cut evening clouds: lit top, burning underside
    const w = 150 + 150 * hash(i + 33), x = ((hash(i + 31) * 1400 + t * (3 + 2 * hash(i + 2))) % 1500) - 220, y = hy * (0.2 + 0.16 * i + 0.06 * hash(i + 35)), top = [], N = 7;
    for (let j = 0; j <= N; j++) { const u = j / N; top.push({ x: x + u * w * 2, y: y - Math.sin(u * Math.PI) ** 0.7 * w * (0.2 + 0.14 * hash(i * 9 + j)) - (j % 2) * w * 0.05 }); }
    const d = blob([...top, { x: x + w * 1.7, y: y + w * 0.07 }, { x: x + w, y: y + w * 0.04 + jit(i + 37, 6) }, { x: x + w * 0.3, y: y + w * 0.08 }]);
    s += `<g opacity="${n(1 - ov)}">${flat(d, M.cloudS, `transform="translate(0,${n(w * 0.05)})"`)}${flat(d, mix(M.cloud, "#fff3b0", 0.35))}${ln(curve(top.slice(1, 6).map((q) => ({ x: q.x, y: q.y + w * 0.07 }))), "#fff8d0", 3, `opacity="0.8"`)}</g>`;
  }
  if (ov > 0.02) {
    const drift = t * (6 + 22 * st);
    [[0.5, M.cloud, 0.75], [0.36, mix(M.cloud, M.cloudS, 0.5), 0.9], [0.2, M.cloudS, 1]].forEach(([f, col, op], i) => {
      const lvl = hy * (f + 0.1 * clamp(MV - 1 - i * 0.6)) * (0.55 + 0.45 * ov), a = [];
      for (let x = -80; x <= W + 80; x += 54) { const u = (x + drift * (1 + i * 0.4)) / 54, k0 = Math.floor(u), fr = u - k0, e = lerp(hash(k0 + i * 50), hash(k0 + 1 + i * 50), fr * fr * (3 - 2 * fr)); a.push({ x, y: lvl + (e - 0.5) * (70 + 30 * i) + Math.abs(Math.sin(u * 1.7 + i)) * 26 }); }
      s += `<path d="M-90,-40 L-90,${n(a[0].y)} ${curve(a).replace("M", "L")} L${W + 90},-40 Z" fill="${col}" opacity="${n(op * ov)}"/>`;
      for (let j = 0; j < 9; j++) { const q = a[(j * 3 + i * 2) % a.length]; s += ln(`M${n(q.x - 40)},${n(q.y - 26 - 30 * hash(j + i * 9))} q${n(34)},${n(16)} ${n(84)},${n(-2)}`, i === 2 ? M.cloud : M.cloudS, 3, `opacity="${n(0.6 * ov)}"`); }
    });
  }
  if (o.bolt > 0.02) {
    let x = o.boltX ?? 760, y = -10; const a = [`${x},${y}`], b2 = [];
    for (let i = 0; y < hy - 20; i++) { x += jit(i * 3.3 + 70, 60) + (i % 2 ? 18 : -14); y += 50 + 60 * hash(i + 90); a.push(`${n(x)},${n(Math.min(y, hy - 6))}`); if (i === 2) b2.push(`M${n(x)},${n(y)} l${n(-70)},${n(80)} l${n(20)},${n(60)} l${n(-50)},${n(70)}`); }
    s += `<g opacity="${n(o.bolt)}">${ln("M" + a.join(" L"), "#7a3cff", 16, `opacity="0.5" stroke-linejoin="miter"`)}${ln("M" + a.join(" L"), "#f4ff8a", 6, `stroke-linejoin="miter"`)}${ln(b2.join(" "), "#f4ff8a", 3)}</g>`;
  }
  if (MV < 1.6) for (let i = 0; i < 4; i++) { const x = 420 + i * 140 + 90 * hash(i + 60) + Math.sin(t * 0.5 + i) * 30, y = hy * (0.5 + 0.22 * hash(i + 70)), w = 12 + 8 * hash(i + 80), fl = Math.sin(t * 5 + i * 2) * 4;
    s += ln(`M${n(x - w)},${n(y - fl)} Q${n(x - w * 0.4)},${n(y - 8)} ${n(x)},${n(y)} Q${n(x + w * 0.4)},${n(y - 8)} ${n(x + w)},${n(y - fl)}`, INK, 2, `opacity="${n(clamp(1.6 - MV))}"`); }
  return s;
}

// ---------------------------------------------------------------- sea
const SHORE = 8.6;
export const shoreZ = (X) => SHORE + 0.45 * Math.sin(X * 0.6 + 1) + 0.2 * Math.sin(X * 1.9 + 0.4);
const waterZ = (X, t) => shoreZ(X) - 0.2 * MV + (0.36 + 0.12 * MV) * Math.sin(t * (0.85 + 0.25 * MV) + X * 0.3) + 0.1 * Math.sin(X * 3.1 + t * 0.4);
const shoreLine = (c, f, x0 = -22, x1 = 22, step = 0.4) => { const a = []; for (let X = x0; X <= x1; X += step) a.push(P(c, X, 0, Math.max(c.z + NEAR, f(X)))); return a; };
export function sea(c, t, o = {}) {
  const hy = horizon(c), chop = 1 + MV * 0.55, st = wStorm(), oil = wOil();
  // the far low coast: a strip of land, a village church spire, a mill
  let s = `<path d="M${n(430)},${n(hy + 2)} ${curve(Array.from({ length: 12 }, (_, i) => ({ x: 430 + i * 62, y: hy - (i === 0 || i === 11 ? 0 : 7 + 9 * hash(i + 3)) }))).replace("M", "L")} L${W + 40},${n(hy + 2)} Z" fill="${M.far}"/>`;
  s += `<path d="M812,${n(hy - 12)} l0,-16 l5,-22 l5,22 l0,16 Z M786,${n(hy - 10)} l0,-9 l26,0 M930,${n(hy - 12)} l4,-15 l4,15 Z M934,${n(hy - 27)} l-11,-8 M934,${n(hy - 27)} l11,-7 M934,${n(hy - 27)} l-7,11 M934,${n(hy - 27)} l8,10" fill="${M.far}" stroke="${M.far}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<rect x="-40" y="${n(hy)}" width="${W + 80}" height="${H}" fill="${M.sea0}"/>`;
  [[52, "sea1", 4], [24, "sea2", 6], [13, "sea3", 8]].forEach(([Z, k, am], i) => { s += band(wline(P(c, 0, 0, Z).y, 31 + i, am * chop * (1 + 2.2 * st), 100 - 30 * st, st > 0 || MV > 1 ? t * 1.3 + i : 0), M[k]); });
  for (let r = 0, Z = SHORE + 1.4; r < 17; r++, Z *= 1.19) for (let j = 0; j < 8; j++) {
    const id = r * 23 + j, X = c.x + (hash(id) - 0.5) * Z * 1.6 + Math.sin(t * 0.6 + id) * 0.25, p = P(c, X, 0, Z + hash(id + 5) * Z * 0.15);
    if (Z < shoreZ(X) + 0.9) continue;
    const len = Math.max(7, (0.25 + 0.5 * hash(id + 9)) * p.s * (1 + 0.5 * oil)), h = Math.max(1.4, 0.05 * p.s * chop), w = Math.max(1.2, Math.min(4 + 3 * oil, (0.022 + 0.03 * oil) * p.s)), lit = id % 3 === 0;
    s += ln(`M${n(p.x - len)},${n(p.y)} q${n(len * 0.5)},${n(-h)} ${n(len)},0 q${n(len * 0.5)},${n(h)} ${n(len)},0`, lit ? M.seaL : M.seaInk, w, `opacity="${lit ? 0.8 : 0.5}"`);
    if (false && st > 0.1 && id % 4 === 1) s += flat(ring(p.x, p.y - h, Math.max(2, 0.07 * p.s), id, 0.3, 7, 0.45), M.foam, `opacity="${n(0.85 * st)}"`);
  }
  if (oil > 0.05) {      // thick water: slow fat swells, big lenses of light, a rainbow skin
    for (let i = 0; i < 7; i++) { const Z = SHORE + 1.6 + i * i * 1.5, p = P(c, c.x, 0, Z), a = wline(p.y + Math.sin(t * 0.5 + i * 1.3) * p.s * 0.05, 240 + i, Math.max(3, p.s * 0.05), 160, t * 0.4 + i), th = Math.max(5, p.s * 0.2);
      s += `<path d="${curve(a)} ${curve(a.map((q, j) => ({ x: q.x, y: q.y + th * (0.5 + 0.5 * Math.sin(j * 1.1 + i)) })).reverse()).replace("M", "L")} Z" fill="${i % 2 ? M.seaInk : M.sea3}" opacity="${n((i % 2 ? 0.55 : 0.5) * oil)}"/>`; }
    for (let i = 0; i < 20; i++) { const Z = SHORE + 1.0 + i * i * 0.2, X = c.x + jit(i + 500, Z * 0.55) + Math.sin(t * 0.25 + i) * 0.3, p = P(c, X, 0, Z), w = (0.9 + 1.3 * hash(i + 510)) * p.s, h = Math.max(4, 0.14 * p.s), d = blob([{ x: p.x - w, y: p.y }, { x: p.x - w * 0.3, y: p.y - h }, { x: p.x + w * 0.5, y: p.y - h * 0.5 }, { x: p.x + w, y: p.y + jit(i, h * 0.3) }, { x: p.x + w * 0.1, y: p.y + h }]);
      s += flat(d, i % 3 ? M.seaL : "#0a1250", `opacity="${n((i % 3 ? 0.5 : 0.8) * oil)}"`);
      if (i % 3) s += ln(d, i % 2 ? "#e040d8" : "#22e0c0", Math.max(2, h * 0.22), `opacity="${n(0.7 * oil)}"`) + ln(`M${n(p.x - w * 0.5)},${n(p.y - h * 0.2)} q${n(w * 0.4)},${n(-h * 0.5)} ${n(w * 0.8)},0`, "#fff6a0", Math.max(1.5, h * 0.14), `opacity="${n(0.6 * oil)}"`); }
  }
  if (wCalm() > 0.05 && o.glitter !== false) { const gx = o.glitter ?? 330; for (let i = 0; i < 26; i++) { const Z = SHORE + 2 + i * i * 0.22, p = P(c, 0, 0, Z), x = gx + jit(i + 300, 16 + 500 / Z), on = Math.sin(t * 3 + i * 1.7) > -0.3; if (on) s += ln(`M${n(x - 6 - 240 / Z)},${n(p.y)} h${n(12 + 500 / Z)}`, "#fff6b0", Math.max(1.5, 26 / Z), `opacity="${n(0.85 * wCalm())}"`); } }
  return s;
}
// one wave standing up: a wall of water rising to a point like a spire, leaning in, foam pouring down its face
function tower(x, y, h, dir, seed, t) {
  const sw = Math.sin(t * 0.9 + seed) * 0.025 + 0.085, mp = (q) => ({ x: x + dir * (q[0] + sw * q[1] * q[1] + jit(seed * 7 + q[1] * 9, 0.008)) * h, y: y + q[1] * h });
  // a flared foot (it spreads into the water sheet), concave flanks, the point leaning forward
  const Lr = [[-0.78, 0.06], [-0.5, 0.0], [-0.34, -0.1], [-0.24, -0.28], [-0.17, -0.5], [-0.11, -0.7], [-0.06, -0.86], [-0.01, -0.96], [0.05, -1.04]].map(mp);
  const Rr = [[0.05, -1.04], [0.09, -0.95], [0.08, -0.85], [0.11, -0.68], [0.17, -0.48], [0.25, -0.28], [0.37, -0.12], [0.56, -0.02], [0.82, 0.06]].map(mp), tip = Lr[Lr.length - 1];
  const at = (a, u) => { const k = u * (a.length - 1), i = Math.min(a.length - 2, Math.floor(k)); return { x: lerp(a[i].x, a[i + 1].x, k - i), y: lerp(a[i].y, a[i + 1].y, k - i) }; };
  const mid = (u, v) => { const a = at(Lr, u), b2 = at(Rr, 1 - u); return { x: lerp(a.x, b2.x, v), y: lerp(a.y, b2.y, v) }; };
  const water = mix(M.sea1, "#0a1258", 0.6), gid = "tw" + (UID++);
  let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3cc0"/><stop offset="0.62" stop-color="#1a2690"/><stop offset="1" stop-color="${water}"/></linearGradient></defs><path d="${curve(Lr)} ${curve(Rr).replace("M", "L")} Z" fill="url(#${gid})"/>`;
  s += `<path d="${curve([0, 0.2, 0.4, 0.6, 0.8, 1].map((u) => mid(u, 0.56)))} ${curve(Rr).replace("M", "L")} Z" fill="#070b3c" opacity="0.85"/>` + ln(curve(Lr.slice(2)), "#5a74ff", Math.max(2.5, h * 0.012));
  // foam pouring down the face from the point, like the ribs of a spire, ending in trails that run back into the surface
  [0.14, 0.3, 0.46, 0.64, 0.82].forEach((v, i) => { const low = 0.3 + 0.3 * hash(seed + i * 3) + 0.05 * Math.sin(t * 1.2 + i), a = [1, 0.92, 0.8, 0.66, low].map((u) => mid(u, lerp(0.5, v, clamp((1 - u) * 3.2)))), w = h * (0.005 + 0.005 * hash(seed + i));
    s += `<path d="${curve(a.map((q) => ({ x: q.x - w * (0.2 + (tip.y - q.y) / (tip.y - a[4].y)), y: q.y })))} ${curve(a.map((q) => ({ x: q.x + w * (0.2 + (tip.y - q.y) / (tip.y - a[4].y)), y: q.y })).reverse()).replace("M", "L")} Z" fill="${M.foam}" opacity="${v > 0.56 ? 0.5 : 0.8}"/>`;
    s += ln(`M${n(a[4].x)},${n(a[4].y)} q${n(dir * h * 0.05)},${n(h * 0.05)} ${n(dir * h * (0.1 + 0.08 * hash(seed + i + 5)))},${n(y - a[4].y + h * 0.01)}`, M.foam, Math.max(1, w * 0.8), `opacity="0.45"`); });
  // foam swept forward along the crest: a ribbon down the leading edge
  const lead = (dir > 0 ? Rr : Lr), edge = dir > 0 ? [0.55, 0.62, 0.7, 0.78, 0.85, 0.92, 1].map((u) => at(Rr, 1 - u)) : [0.55, 0.62, 0.7, 0.78, 0.85, 0.92, 1].map((u) => at(Lr, u));
  s += ln(curve(edge), M.foam, Math.max(2, h * 0.01), `opacity="0.85"`);
  // the foot: water colour swallows the base, foam trails thin out along the surface to both sides (smooth strokes, no dots)
  s += flat(blob([{ x: x - h * 0.9, y: y + h * 0.06 }, { x: x - h * 0.4, y: y - h * 0.05 }, { x: x + h * 0.4, y: y - h * 0.05 }, { x: x + h * 0.95, y: y + h * 0.06 }, { x, y: y + h * 0.1 }]), water, `opacity="0.92"`);
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s += ln(`M${n(x + sd * h * (0.08 + 0.05 * i))},${n(y + h * (0.012 + 0.012 * i))} q${n(sd * h * 0.3)},${n(-h * 0.01 + jit(seed + i, h * 0.01))} ${n(sd * h * (0.55 + 0.12 * i))},${n(h * 0.004)}`, M.foam, Math.max(1.5, h * (0.014 - 0.003 * i)), `opacity="${n(0.6 - 0.15 * i)}"`);
  // the crest curls forward: a hook of foam leaning over from the point
  s += flat(blob([{ x: tip.x, y: tip.y - h * 0.02 }, { x: tip.x + dir * h * 0.035, y: tip.y - h * 0.03 }, { x: tip.x + dir * h * 0.07, y: tip.y + h * 0.0 }, { x: tip.x + dir * h * 0.06, y: tip.y + h * 0.04 }, { x: tip.x + dir * h * 0.045, y: tip.y + h * 0.02 }, { x: tip.x + dir * h * 0.02, y: tip.y + h * 0.01 }]), M.foam);
  return s;
}
const TOWERS = [{ X: 3.5, Z: 62, h: 30, d: -1 }, { X: -15, Z: 60, h: 27, d: 1 }, { X: -12.6, Z: 42, h: 26, d: 1 }, { X: 5.2, Z: 38, h: 22, d: -1 }, { X: -3.4, Z: 33, h: 21, d: 1 }, { X: 9.3, Z: 29, h: 16, d: -1 }];
export function towers(c, t, o = {}) {
  const amt = o.amt ?? 1; if (amt < 0.02) return "";
  const hy = horizon(c), wall = wline(hy - 190 * amt, 77, 70 * amt, 96, t * 1.1);     // the wall of water behind them
  return band(wall, mix(M.sea1, "#0a1258", clamp(amt * 2))) + ln("M" + wall.map(pt).join(" L"), M.foam, 3, `opacity="${n(0.35 * clamp(amt * 2))}"`) + TOWERS.slice(0, o.n ?? 6).map((w, i) => { const p = P(c, w.X + c.x, 0, w.Z), up = clamp(amt * 1.3 - i * 0.05); return tower(p.x, p.y + 4, w.h * p.s * up * (1 + 0.04 * Math.sin(t * 1.1 + i)), w.d, i + 3, t); }).join("");
}

// ---------------------------------------------------------------- shore: sand, dunes, grass, driftwood
export function marram(c, o = {}, t = 0) {
  if (o.Z - c.z < NEAR + 0.2) return "";
  const p = P(c, o.X, 0, o.Z), k = p.s * (o.size || 1), seed = o.seed || 1, N = 11, wind = (0.1 + 0.11 * MV) * (1 + 0.5 * Math.sin(t * (1.3 + 0.5 * MV) + seed)) + 0.04 * Math.sin(t * 3.1 + seed * 2);
  let s = "";
  for (let i = 0; i < N; i++) {
    const id = seed * 19 + i, bx = p.x + jit(id, 0.13) * k, h = (0.42 + 0.5 * hash(id + 1)) * k, bend = (jit(id + 2, 0.22) + wind * (0.6 + hash(id + 3))) * k, w = Math.max(1, 0.02 * k), col = i % 3 === 0 ? M.grassL : i % 3 === 1 ? M.grass : M.grassS;
    s += `<path d="M${n(bx - w)},${n(p.y)} Q${n(bx + bend * 0.15 - w)},${n(p.y - h * 0.62)} ${n(bx + bend)},${n(p.y - h)} Q${n(bx + bend * 0.25 + w)},${n(p.y - h * 0.55)} ${n(bx + w)},${n(p.y)} Z" fill="${col}"/>`;
    if (i % 4 === 2) s += flat(ring(bx + bend * 0.93, p.y - h * 0.95, Math.max(1.4, 0.022 * k), id, 0.3, 6, 2.2), M.sandS);
  }
  return s;
}
export function driftwood(c, o = {}) {
  const b = board(c, o.X, 0, o.Z, o.size || 1), sd = o.seed || 1, lw = b.lw;
  const g = `<g transform="rotate(${n(o.rot || 0)} ${n(b.p.x)} ${n(b.p.y)})">`;
  let s = shp(hd(b, [[0.2, 0.02], [0.28, 0.2], [0.34, 0.42], [0.3, 0.44], [0.2, 0.24], [0.12, 0.1]], sd + 2, 0.01, 0.12), M.drift, lw);
  s += shp(hd(b, [[-0.7, 0.0], [-0.74, 0.1], [-0.6, 0.17], [-0.1, 0.2], [0.4, 0.17], [0.72, 0.1], [0.78, 0.05], [0.7, 0.0]], sd, 0.012, 0.16), M.drift, lw);
  s += flat(hd(b, [[-0.66, 0.0], [-0.64, 0.05], [0.0, 0.07], [0.7, 0.03], [0.7, 0.0]], sd + 4, 0.008, 0.2), M.driftS, `opacity="0.75"`);
  for (let i = 0; i < 5; i++) s += ln(hd(b, [[-0.6 + i * 0.05, 0.08 + i * 0.02], [-0.1 + jit(sd + i, 0.1), 0.1 + i * 0.018], [0.5 - i * 0.04, 0.07 + i * 0.016]], sd + 10 + i, 0.008, 0.12, false), M.driftS, lw * 0.8);
  s += shp(ring(b.x(-0.3), b.y(0.12), b.k * 0.03, sd, 0.2, 7), M.driftS, lw * 0.7) + shp(hd(b, [[-0.5, 0.15], [-0.56, 0.3], [-0.5, 0.31], [-0.42, 0.17]], sd + 7, 0.008, 0.1), M.drift, lw);
  return `<ellipse cx="${n(b.p.x)}" cy="${n(b.p.y)}" rx="${n(b.k * 0.8)}" ry="${n(b.k * 0.07)}" fill="url(#softb)"/>` + g + s + `</g>`;
}
export function shore(c, t, o = {}) {
  const dry = shoreLine(c, (X) => shoreZ(X) - 0.5), wet = shoreLine(c, (X) => waterZ(X, t));
  const under = (a, fill, extra = "") => `<path d="M-40,${H + 40} L${a.map(pt).join(" L")} L${W + 40},${H + 40} Z" fill="${fill}" ${extra}/>`;
  let s = under(shoreLine(c, (X) => waterZ(X, t) - 0.05 - 0.14 * (0.5 + 0.5 * Math.sin(t * 0.85 + X * 0.3))), M.foam) + under(wet.map((p, i) => ({ x: p.x, y: p.y + Math.max(2, p.s * 0.012) + jit(i, 1.5) })), M.sandW) + under(dry, M.sand);
  for (let i = 0; i < 26; i++) { const X = c.x + jit(i + 800, 5), Z = waterZ(X, t) + 0.25 + 0.6 * hash(i + 810), p = P(c, X, 0, Z); s += flat(ring(p.x, p.y, Math.max(1.5, p.s * (0.02 + 0.03 * hash(i))), i, 0.3, 7, 0.4), M.foam, `opacity="0.8"`); }
  // dune ridges: light crest, shadow slip face
  [SHORE - 1.6, SHORE - 2.9, SHORE - 4.1, SHORE - 5.2].forEach((Z, i) => { if (Z - c.z < 0.7) return; const y = P(c, 0, 0, Z).y, a = wline(y, 61 + i, 16 + i * 10, 150); s += band(a.map((p) => ({ x: p.x, y: p.y - 5 - i * 2 })), M.sandL) + band(a, i % 2 ? M.sand : mix(M.sand, M.sandS, 0.4));
    for (let j = 0; j < 7; j++) { const q = a[(j + 1) % a.length]; s += ln(`M${n(q.x - 50)},${n(q.y + 22 + j % 3 * 13)} q${n(40)},${n(-7)} ${n(90 + 40 * hash(j + i * 9))},${n(2)}`, M.sandS, 2.2, `opacity="0.7"`); } });
  for (let i = 0; i < 46; i++) { const X = c.x + jit(i + 900, 4.5), Z = c.z + 1.5 + hash(i + 910) * (SHORE - c.z - 2.2), p = P(c, X, 0, Z); s += flat(ring(p.x, p.y, Math.max(1.2, p.s * (0.008 + 0.014 * hash(i + 3))), i, 0.3, 6, 0.6), i % 5 === 0 ? M.sandL : i % 5 === 1 ? tc("#7a6a86") : M.sandS); }
  if (o.tufts !== false) TUFTS.forEach(([X, Z, sz], i) => { s += marram(c, { X, Z, size: sz, seed: i + 5 }, t); });
  return s;
}
const TUFTS = [[-3.4, 7.3, 1], [-2.9, 7.6, 0.8], [0.55, 7.5, 0.9], [2.9, 7.6, 1], [3.5, 7.2, 1.1], [2.6, 5.4, 1], [3.1, 5.0, 1.2], [0.4, 4.3, 1], [-0.3, 4.0, 0.8], [-2.8, 4.2, 1.1], [-2.2, 3.9, 0.9], [2.2, 3.2, 1.1], [-1.2, 2.9, 1]];
export function near(c, t) {
  let s = "";
  [[-90, 0.42, 21, 1], [W + 90, 0.5, 23, -1]].forEach(([x0, wd, seed, d]) => {
    const a = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return { x: x0 + d * u * W * wd, y: H - 250 * Math.cos(u * Math.PI / 2) ** 1.3 + jit(seed + i, 14) }; });
    s += `<path d="M${n(x0)},${H + 40} L${a.map(pt).join(" L")} L${n(x0 + d * W * wd)},${H + 40} Z" fill="${mix(M.sandS, M.grassS, 0.25)}"/>` + ln("M" + a.map(pt).join(" L"), M.sandL, 3, `opacity="0.7"`);
    for (let i = 0; i < 30; i++) { const u = hash(seed + i * 3) * 0.8, bx = x0 + d * u * W * wd, by = H - 250 * Math.cos(u * Math.PI / 2) ** 1.3 + 16, h = 210 + 230 * hash(seed + i + 9), wind = (0.12 + 0.1 * MV) * (1 + 0.5 * Math.sin(t * (1.3 + 0.5 * MV) + i)), bend = (jit(seed + i + 4, 0.2) + wind) * h, w = 5 + 4 * hash(i);
      s += `<path d="M${n(bx - w)},${n(by)} Q${n(bx + bend * 0.15 - w)},${n(by - h * 0.62)} ${n(bx + bend)},${n(by - h)} Q${n(bx + bend * 0.25 + w)},${n(by - h * 0.55)} ${n(bx + w)},${n(by)} Z" fill="${i % 3 === 0 ? M.grass : i % 3 === 1 ? M.grassS : mix(M.grass, M.grassL, 0.5)}"/>`;
      if (i % 4 === 1) s += flat(ring(bx + bend * 0.94, by - h * 0.95, 5, i, 0.3, 6, 2.6), M.sandS); }
  });
  return s;
}
export function rain(t, amt = 1) {
  let s = "";
  for (let i = 0; i < 90; i++) { const sp = 1500 + 900 * hash(i + 2), y = ((hash(i) * 2200 + t * sp) % 2200) - 140, x = ((hash(i + 40) * 1500 - y * 0.32 + 300) % 1500) - 200, L = 50 + 80 * hash(i + 7); s += ln(`M${n(x)},${n(y)} l${n(-L * 0.32)},${n(L)}`, i % 3 ? "#8a96ff" : "#e4ffe6", 1.6 + 1.6 * hash(i + 9), `opacity="${n((0.25 + 0.4 * hash(i + 11)) * amt)}"`); }
  return s;
}

// ---------------------------------------------------------------- the jetty
export const JETTY = { X: 1.5, w: 1.1, z0: 7.3, z1: 16.2, Y: 0.5 };
export const deckCam = (c) => ({ ...c, y: c.y - JETTY.Y });
export function jetty(c, t = 0) {
  const J = JETTY, z0 = Math.max(J.z0, c.z + 0.6), xl = J.X - J.w / 2, xr = J.X + J.w / 2, Q = (X, Y, Z) => P(c, X, Y, Z);
  let s = "", posts = [];
  for (let Z = J.z1, i = 0; Z >= z0 - 0.01; Z -= 1.48, i++) for (const sd of [-1, 1]) posts.push({ X: J.X + sd * (J.w / 2 + 0.08), Z: Z + jit(i * 2 + sd, 0.12), top: J.Y + 0.16 + 0.34 * hash(i * 5 + sd + 2), lean: jit(i * 7 + sd, 0.05), id: i * 2 + sd });
  const post = (q) => { const b = board(c, q.X, 0, q.Z), w = 0.075, tp = q.top, sunk = q.Z > shoreZ(q.X) ? -0.5 : 0, col = q.id % 3 ? M.wood : mix(M.wood, M.woodS, 0.5);
    let g = shp(hd(b, [[-w, sunk], [-w + q.lean, tp], [w * 0.2 + q.lean, tp + 0.04], [w + q.lean, tp - 0.01], [w, sunk]], q.id + 40, 0.008, 0.3), col, b.lw);
    g += flat(hd(b, [[w * 0.2, sunk], [w * 0.3 + q.lean, tp], [w + q.lean, tp - 0.01], [w, sunk]], q.id + 41, 0.006, 0.3), M.woodS, `opacity="0.7"`) + ln(`M${b.pt(-w * 0.4, sunk + 0.1)} L${b.pt(-w * 0.4 + q.lean, tp - 0.06)}`, M.woodL, b.lw * 0.9, `opacity="0.8"`);
    if (sunk) g += flat(hd(b, [[-w, 0.16], [w, 0.14], [w, -0.02], [-w, -0.02]], q.id + 43, 0.006, 0.1), tc("#1c3a2a"), `opacity="0.8"`) + flat(ring(b.p.x, b.p.y, b.k * 0.16, q.id, 0.25, 9, 0.3), M.foam, `opacity="0.8"`);
    return g; };
  posts.filter((q) => q.id % 2 === 0 || true).forEach((q) => { if (q.X < J.X) s += post(q); });       // left row first (behind the deck's far edge)
  // deck: a side fascia, then planks one by one (no two alike, one missing, one sprung)
  s += shp(`M${pt(Q(xl, J.Y, z0))} L${pt(Q(xl, J.Y, J.z1))} L${pt(Q(xl, J.Y - 0.12, J.z1))} L${pt(Q(xl, J.Y - 0.12, z0))} Z`, M.woodS, 1);
  s += flat(`M${pt(Q(xl, J.Y, z0))} L${pt(Q(xl, J.Y, J.z1))} L${pt(Q(xr, J.Y, J.z1))} L${pt(Q(xr, J.Y, z0))} Z`, tc("#0c0a14"));
  for (let Z = J.z1, i = 0; Z > z0; i++) {
    const d = 0.2 + 0.07 * hash(i + 300), Zb = Math.max(z0, Z - d); if (i === 9) { Z = Zb - 0.03; continue; }
    const o1 = jit(i + 310, 0.05), o2 = jit(i + 320, 0.05), sk = i === 17 ? 0.05 : 0, a = Q(xl - 0.05 + o1, J.Y, Z), b2 = Q(xr + 0.05 + o2, J.Y + sk, Z), c2 = Q(xr + 0.05 + o2, J.Y + sk, Zb), d2 = Q(xl - 0.05 + o1, J.Y, Zb), col = [M.wood, M.woodL, mix(M.wood, M.woodS, 0.45), mix(M.wood, M.woodL, 0.5)][Math.floor(hash(i + 330) * 4)];
    s += shp(`M${pt(a)} L${pt(b2)} L${pt(c2)} L${pt(d2)} Z`, col, Math.max(0.6, a.s * 0.006));
    if (wStorm() > 0.3) s += ln(`M${pt(a)} L${pt(b2)}`, "#9db0f0", Math.max(0.8, a.s * 0.007), `opacity="${n(0.4 * clamp(wStorm()))}"`);   // a thin light edge on each step in the storm (Sol R2 B13)
    if (a.s > 60) { for (let j = 0; j < 2; j++) { const v = 0.3 + 0.4 * j + jit(i + j, 0.1); s += ln(`M${n(lerp(a.x, d2.x, v) + 6)},${n(lerp(a.y, d2.y, v))} Q${n((a.x + b2.x) / 2)},${n(lerp(a.y, d2.y, v) + jit(i * 3 + j, 2))} ${n(lerp(b2.x, c2.x, v) - 8)},${n(lerp(b2.y, c2.y, v))}`, M.woodS, Math.max(0.7, a.s * 0.005), `opacity="0.7"`); }
      s += `<circle cx="${n(lerp(a.x, b2.x, 0.08))}" cy="${n((a.y + d2.y) / 2)}" r="${n(a.s * 0.008)}" fill="${M.woodS}"/><circle cx="${n(lerp(a.x, b2.x, 0.92))}" cy="${n((b2.y + c2.y) / 2)}" r="${n(a.s * 0.008)}" fill="${M.woodS}"/>`; }
    Z = Zb - 0.025;
  }
  posts.forEach((q) => { if (q.X > J.X) s += post(q); });
  return { svg: s, cam: deckCam(c) };
}

// ---------------------------------------------------------------- Grandma's home: hut, cottage, castle, palace
const WARM = "#ffc23c";
const smokeWisp = (b, x, y, t, seed, amt = 1) => { let s = ""; for (let i = 0; i < 5; i++) { const u = ((t * 0.16 + i / 5) % 1), yy = y + u * 0.95, xx = x + 0.1 * Math.sin(u * 5 + seed) + u * u * (0.3 + 0.2 * MV); s += flat(ring(b.x(xx), b.y(yy), b.k * (0.05 + 0.1 * u), seed + i, 0.2, 8), tc("#f2e9da", 0.7), `opacity="${n(0.6 * (1 - u) * amt)}"`); } return s; };
function hut(b, st, t) {
  const lw = b.lw, tar = tc("#2c2434", 0.6), tarD = tc("#120d18", 0.5), tarL = tc("#6a5c82", 0.5), scuff = tc("#7a5238", 0.6), lit = st.light ?? 0.8;
  const dome = Array.from({ length: 15 }, (_, i) => { const a = i / 14 * Math.PI, sx = Math.cos(a); return [1.1 * sx * (1 + (sx < 0 ? 0.03 : 0)), 0.82 + (sx < 0 ? 0.84 : 0.9) * Math.sin(a) ** 0.72 + jit(i + 400, 0.012)]; });
  // the driftwood bough leaning on the wall (the handle), with a net and cork floats hung on it
  const arch = [[0.92, 1.42], [1.36, 1.4], [1.62, 1.08], [1.58, 0.66], [1.1, 0.5]].map(([x, y]) => ({ x: b.x(x), y: b.y(y) }));
  let net = ""; for (let i = 0; i < 7; i++) net += ln(`M${b.pt(1.16 + i * 0.07, 1.26 - i * 0.02)} L${b.pt(1.2 + i * 0.075 + jit(i + 420, 0.03), 0.12 + jit(i + 425, 0.06))}`, tc("#c8a05a"), lw * 0.7, `opacity="0.85"`);
  for (let i = 0; i < 6; i++) net += ln(`M${b.pt(1.13, 1.12 - i * 0.18)} Q${b.pt(1.4, 1.04 - i * 0.18 + jit(i + 430, 0.04))} ${b.pt(1.66, 1.1 - i * 0.19)}`, tc("#c8a05a"), lw * 0.7, `opacity="0.85"`);
  [[1.3, 1.1], [1.5, 0.82], [1.36, 0.5]].forEach(([x, y], i) => { net += shp(ring(b.x(x), b.y(y), b.k * 0.055, i + 440, 0.12, 9, 0.8), tc(i % 2 ? "#e8964a" : "#d8b070"), lw * 0.8); });
  let s = net + ln(curve(arch), INK, b.k * 0.135) + ln(curve(arch), tar, b.k * 0.105) + ln(curve(arch.map((p) => ({ x: p.x - b.k * 0.012, y: p.y - b.k * 0.014 }))), tarL, b.k * 0.022, `opacity="0.8"`);   // one silhouette with the hut: both ends in the body, the same tar-wood
  // the footing: a turf-and-stone bank that flares out like a rim
  s += shp(hd(b, [[-1.38, 0], [-1.32, 0.15], [-1.12, 0.25], [1.12, 0.24], [1.3, 0.15], [1.36, 0]], 401, 0.012, 0.16), tc("#3c3246", 0.6), lw);
  // wall and dome
  s += shp(hd(b, [[-1.13, 0.2], [-1.13, 0.84], [1.1, 0.84], [1.12, 0.2]], 402, 0.01, 0.25), tar, lw);
  s += shp(hd(b, [...dome, [-1.16, 0.8], [1.16, 0.8]], 403, 0.008, 0.2), tc("#241d2c", 0.6), lw);
  for (let i = -5; i <= 5; i++) { const x = i * 0.2 + jit(i + 460, 0.03), a = Math.acos(clamp(Math.abs(x * 0.55) / 1.1) * Math.sign(x) || 0), tx = 1.1 * Math.cos(a) * 0.5 + x * 0.25, ty = 0.82 + 0.86 * Math.sin(Math.acos(Math.max(-1, Math.min(1, tx / 1.1)))) ** 0.72 - 0.03;
    s += ln(`M${b.pt(x * 1.08, 0.84)} Q${b.pt(x * 1.02, 0.84 + (ty - 0.84) * 0.6)} ${b.pt(tx, ty)}`, tarD, lw * 1.1);
    s += ln(`M${b.pt(x + 0.02, 0.8)} L${b.pt(x + jit(i + 470, 0.02), 0.24)}`, tarD, lw * 1.1); }
  for (let i = 0; i < 14; i++) { const x = jit(i + 480, 1.0), y = 0.3 + 0.48 * hash(i + 481); s += ln(`M${b.pt(x, y)} q${n(b.k * 0.012)},${n(-b.k * 0.05)} ${n(b.k * jit(i, 0.01))},${n(-b.k * (0.08 + 0.08 * hash(i)))}`, i % 3 ? tarL : scuff, lw * 0.8, `opacity="0.7"`); }
  s += ln(curve(dome.slice(8, 14).map(([x, y]) => ({ x: b.x(x * 0.94), y: b.y(0.82 + (y - 0.82) * 0.93) }))), tarL, lw * 1.6, `opacity="0.85"`);
  // eave board + tar drips with a wet highlight
  s += shp(hd(b, [[-1.2, 0.87], [1.19, 0.9], [1.2, 0.79], [-1.19, 0.77]], 404, 0.01, 0.2), tc("#3a3044", 0.6), lw);
  for (let i = 0; i < 13; i++) { const x = -1.08 + i * 0.18 + jit(i + 490, 0.06), L = 0.06 + 0.2 * hash(i + 491), w = 0.016 + 0.014 * hash(i + 492); if (x > 0.02 && x < 0.66) continue;
    s += flat(`M${b.pt(x - w, 0.79)} L${b.pt(x - w * 0.6, 0.79 - L)} Q${b.pt(x, 0.79 - L - w * 2.4)} ${b.pt(x + w * 0.7, 0.79 - L)} L${b.pt(x + w, 0.79)} Z`, tarD) + `<circle cx="${n(b.x(x - w * 0.2))}" cy="${n(b.y(0.79 - L - w * 0.2))}" r="${n(Math.max(0.6, b.k * 0.006))}" fill="${tarL}"/>`; }
  for (let i = 0; i < 5; i++) { const a = (0.18 + i * 0.16) * Math.PI, x = 1.1 * Math.cos(a) * 0.9, y = 0.82 + 0.86 * Math.sin(a) ** 0.72 - 0.08, L = 0.1 + 0.16 * hash(i + 495); s += ln(`M${b.pt(x, y)} L${b.pt(x + jit(i, 0.01), y - L)}`, tarD, lw * 2.2) + `<circle cx="${n(b.x(x))}" cy="${n(b.y(y - L))}" r="${n(b.k * 0.014)}" fill="${tarD}"/>`; }
  // flat cap + crooked stovepipe
  s += shp(hd(b, [[-0.34, 1.66], [-0.3, 1.78], [0.3, 1.8], [0.36, 1.68]], 405, 0.008, 0.2), tc("#3a3044", 0.6), lw);
  s += smokeWisp(b, 0.5, 2.12, t, 3, st.smoke ?? 1) + shp(hd(b, [[0.36, 1.58], [0.4, 1.92], [0.5, 2.08], [0.6, 2.06], [0.54, 1.9], [0.52, 1.56]], 406, 0.006, 0.2), tc("#4a4254", 0.6), lw) + shp(hd(b, [[0.42, 2.07], [0.44, 2.13], [0.66, 2.1], [0.64, 2.04]], 407, 0.005, 0.2), tc("#2a2230", 0.6), lw);
  // window (four small panes) and the plank door, ajar, light in the gap
  s += shp(hd(b, [[-0.78, 0.38], [-0.8, 0.7], [-0.44, 0.72], [-0.43, 0.39]], 408, 0.006, 0.2), mix(tarD, WARM, lit), lw) + ln(`M${b.pt(-0.61, 0.38)} L${b.pt(-0.62, 0.71)} M${b.pt(-0.79, 0.54)} L${b.pt(-0.44, 0.56)}`, INK, lw * 1.6);
  s += shp(hd(b, [[-0.84, 0.36], [-0.84, 0.31], [-0.38, 0.33], [-0.38, 0.38]], 409, 0.004, 0.2), M.drift, lw);
  s += shp(hd(b, [[0.06, 0.08], [0.04, 0.78], [0.2, 0.86], [0.5, 0.86], [0.64, 0.77], [0.64, 0.08]], 410, 0.006, 0.2), mix(tarD, WARM, lit), lw);
  s += shp(hd(b, [[0.16, 0.08], [0.15, 0.76], [0.28, 0.83], [0.5, 0.84], [0.62, 0.76], [0.63, 0.08]], 411, 0.006, 0.2), tc("#5a3c2c", 0.6), lw);
  for (let i = 1; i < 4; i++) s += ln(`M${b.pt(0.16 + i * 0.118, 0.1)} L${b.pt(0.165 + i * 0.118 + jit(i + 412, 0.008), 0.8)}`, tc("#2a1a16", 0.6), lw);
  s += ln(`M${b.pt(0.17, 0.3)} L${b.pt(0.62, 0.34)} M${b.pt(0.17, 0.62)} L${b.pt(0.62, 0.66)}`, tc("#2a1a16", 0.6), lw * 2) + `<circle cx="${n(b.x(0.24))}" cy="${n(b.y(0.46))}" r="${n(b.k * 0.022)}" fill="${tc("#c8a05a")}" stroke="${INK}" stroke-width="${lw * 0.7}"/>`;
  s += shp(hd(b, [[-0.02, 0], [0.0, 0.08], [0.7, 0.08], [0.74, 0]], 413, 0.006, 0.2), M.drift, lw);
  return { svg: `<g transform="translate(${n(b.p.x)},${n(b.p.y)}) skewX(-3.5) rotate(-1.2) translate(${n(-b.p.x)},${n(-b.p.y)})">${s}</g>`, door: [0.38, 0], top: 2.1 };
}
const litWin = (b, x, y, w, h, seed, lit, arch = false, frame = "#f4ecd8") => shp(hd(b, arch ? [[x, y], [x, y + h * 0.7], [x + w * 0.5, y + h], [x + w, y + h * 0.7], [x + w, y]] : [[x, y], [x, y + h], [x + w, y + h], [x + w, y]], seed, 0.005, 0.2), mix(tc("#1c1a3a"), WARM, lit), b.lw) + ln(`M${b.pt(x + w / 2, y)} L${b.pt(x + w / 2, y + h * (arch ? 0.95 : 1))} M${b.pt(x, y + h * 0.5)} L${b.pt(x + w, y + h * 0.5)}`, tc(frame), b.lw * 1.3);
function cottage(b, st, t) {
  const lw = b.lw, brick = tc("#d2532a"), brickS = tc("#a83a22"), brickL = tc("#ee7a3c"), mortar = tc("#f6d2a4"), tile = tc("#ea2c1c"), tileS = tc("#aa1420"), tileL = tc("#ff6a3c"), lit = st.light ?? 0.8;
  let s = smokeWisp(b, 0.92, 3.3, t, 5, st.smoke ?? 1) + shp(hd(b, [[0.74, 2.3], [0.75, 3.22], [0.7, 3.26], [0.72, 3.34], [1.12, 3.33], [1.12, 3.25], [1.07, 3.22], [1.08, 2.3]], 500, 0.008, 0.25), brick, lw);
  s += shp(hd(b, [[-1.6, 0], [-1.6, 1.62], [1.58, 1.6], [1.6, 0]], 501, 0.01, 0.3), brick, lw);
  for (let r = 0; r < 12; r++) { const y = 0.13 * (r + 1); s += ln(hd(b, [[-1.58, y], [1.58, y + jit(r + 510, 0.01)]], 520 + r, 0.006, 0.3, false), mortar, lw * 0.8, `opacity="0.8"`);
    for (let j = 0; j < 11; j++) { const x = -1.6 + (j + (r % 2) * 0.5 + jit(r * 13 + j, 0.08)) * 0.3; if (x < -1.55 || x > 1.5) continue; s += ln(`M${b.pt(x, y)} L${b.pt(x, y - 0.13)}`, mortar, lw * 0.8, `opacity="0.8"`); if (hash(r * 17 + j) > 0.72) s += flat(hd(b, [[x + 0.015, y - 0.015], [x + 0.285, y - 0.015], [x + 0.285, y - 0.115], [x + 0.015, y - 0.115]], r * 31 + j, 0.004, 0.3), hash(r + j) > 0.5 ? brickS : brickL); } }
  // roof: sagging ridge, tile rows, each tile a scallop
  const roof = [[-1.86, 1.52], [-1.3, 2.86], [-0.2, 2.78], [1.28, 2.9], [1.88, 1.54]];
  s += shp(hd(b, roof, 502, 0.012, 0.3), tile, lw);
  for (let r = 0; r < 8; r++) { const u = (r + 0.6) / 8.4, xl = lerp(-1.86, -1.3, u), xr = lerp(1.88, 1.28, u), y = lerp(1.53, 2.84, u) + (r % 2 ? 0.01 : 0), N = Math.round((xr - xl) / 0.2);
    let d = `M${b.pt(xl, y)}`; for (let j = 0; j < N; j++) { const x0 = lerp(xl, xr, j / N), x1 = lerp(xl, xr, (j + 1) / N); d += ` Q${b.pt((x0 + x1) / 2, y - 0.075 + jit(r * 9 + j, 0.012))} ${b.pt(x1, y + jit(r * 9 + j + 0.5, 0.008))}`; if (hash(r * 23 + j) > 0.78) s += flat(hd(b, [[x0 + 0.01, y], [(x0 + x1) / 2, y - 0.07], [x1 - 0.01, y], [x1 - 0.01, y + 0.13], [x0 + 0.01, y + 0.13]], r * 7 + j, 0.004, 0.3), hash(j + r) > 0.5 ? tileS : tileL, `opacity="0.85"`); }
    s += ln(d, tileS, lw * 1.2); }
  s += ln(hd(b, [[-1.32, 2.87], [-0.2, 2.79], [1.3, 2.91]], 503, 0.008, 0.3, false), tileL, lw * 3) + shp(hd(b, [[-1.9, 1.5], [-1.9, 1.6], [1.92, 1.62], [1.92, 1.5]], 504, 0.008, 0.3), tc("#f4ecd8"), lw);
  // door, two windows with shutters, a flower box
  s += shp(hd(b, [[-0.36, 0], [-0.36, 1.12], [0.24, 1.14], [0.24, 0]], 505, 0.006, 0.3), tc("#f4ecd8"), lw) + shp(hd(b, [[-0.29, 0], [-0.29, 1.05], [0.17, 1.06], [0.17, 0]], 506, 0.006, 0.3), tc("#0f8a62"), lw) + ln(`M${b.pt(-0.06, 0.03)} L${b.pt(-0.06, 1.03)}`, tc("#075a44"), lw) + `<circle cx="${n(b.x(0.1))}" cy="${n(b.y(0.52))}" r="${n(b.k * 0.025)}" fill="${WARM}" stroke="${INK}" stroke-width="${lw * 0.7}"/>`;
  [[-1.22, 506], [0.62, 507]].forEach(([x, sd]) => { s += shp(hd(b, [[x - 0.05, 0.56], [x - 0.05, 1.2], [x + 0.55, 1.2], [x + 0.55, 0.56]], sd + 10, 0.005, 0.3), tc("#f4ecd8"), lw) + litWin(b, x, 0.62, 0.5, 0.52, sd, lit);
    s += shp(hd(b, [[x - 0.24, 0.6], [x - 0.24, 1.16], [x - 0.07, 1.17], [x - 0.07, 0.6]], sd + 20, 0.005, 0.3), tc("#2456dc"), lw) + shp(hd(b, [[x + 0.57, 0.6], [x + 0.57, 1.16], [x + 0.74, 1.17], [x + 0.74, 0.6]], sd + 30, 0.005, 0.3), tc("#2456dc"), lw);
    s += shp(hd(b, [[x - 0.06, 0.44], [x - 0.08, 0.56], [x + 0.58, 0.56], [x + 0.56, 0.44]], sd + 40, 0.005, 0.3), tc("#8a5230"), lw);
    for (let i = 0; i < 6; i++) s += flat(ring(b.x(x + 0.02 + i * 0.1), b.y(0.6 + jit(i + sd, 0.02)), b.k * 0.04, i + sd, 0.25, 7), tc(i % 2 ? "#ffd23c" : "#ff5a8a")); });
  s += shp(hd(b, [[-0.46, 0], [-0.44, 0.07], [0.34, 0.07], [0.36, 0]], 508, 0.005, 0.3), tc("#b8b0c0"), lw);
  return { svg: `<g transform="translate(${n(b.p.x)},${n(b.p.y)}) skewX(-1) translate(${n(-b.p.x)},${n(-b.p.y)})">${s}</g>`, door: [-0.06, 0], top: 3.35 };
}
function stones(b, x0, x1, y0, y1, seed, col, lw) { let s = ""; for (let r = 0, y = y0 + 0.2; y < y1 - 0.05; r++, y += 0.24) for (let j = 0; j < Math.ceil((x1 - x0) / 0.38); j++) { if (hash(seed + r * 13 + j) < 0.45) continue; const x = x0 + (j + (r % 2) * 0.5) * 0.38 + jit(seed + r + j, 0.04); if (x > x1 - 0.3) continue; s += ln(`M${b.pt(x, y)} l${n(b.k * 0.3)},${n(b.k * jit(seed + j, 0.01))} M${b.pt(x + 0.14, y)} l0,${n(b.k * 0.2)}`, col, lw * 0.9, `opacity="0.75"`); } return s; }
const crenel = (x0, x1, y, hh = 0.16, w = 0.2) => { const a = [[x0, y]]; for (let x = x0, i = 0; x < x1 - 0.01; x += w, i++) { const e = Math.min(x1, x + w); if (i % 2 === 0) a.push([x, y + hh], [e, y + hh], [e, y]); else a.push([e, y]); } return a; };
function castle(b, st, t) {
  const lw = b.lw, stone = tc("#b6aed6"), stoneS = tc("#7a70a6"), stoneL = tc("#dcd6f0"), slate = tc("#2c32a0"), slateL = tc("#5a68d8"), lit = st.light ?? 0.8;
  let s = "";
  // right turret, keep, then the big round tower in front on the left
  s += shp(hd(b, [[1.0, 0], [1.02, 3.3], ...crenel(0.94, 1.76, 3.3).slice(1), [1.7, 3.3], [1.72, 0]], 600, 0.01, 0.35), stoneS, lw) + stones(b, 1.02, 1.7, 0, 3.3, 601, INK, lw) + litWin(b, 1.24, 2.5, 0.2, 0.4, 602, lit, true, "#7a70a6");
  s += shp(hd(b, [[-1.5, 0], [-1.5, 2.9], ...crenel(-1.56, 1.16, 2.9, 0.18, 0.22).slice(1), [1.1, 2.9], [1.1, 0]], 603, 0.012, 0.35), stone, lw) + stones(b, -1.45, 1.1, 0, 2.9, 604, stoneS, lw);
  s += flat(hd(b, [[0.7, 0], [0.72, 2.9], [1.1, 2.9], [1.1, 0]], 605, 0.01, 0.35), stoneS, `opacity="0.55"`);
  s += shp(hd(b, [[-0.62, 0], [-0.62, 0.98], [-0.42, 1.32], [-0.14, 1.44], [0.14, 1.32], [0.34, 0.98], [0.34, 0]], 606, 0.008, 0.2), tc("#1a1430"), lw);
  for (let i = 0; i < 5; i++) s += ln(`M${b.pt(-0.5 + i * 0.18, 0.02)} L${b.pt(-0.5 + i * 0.18, 1.0 + (i === 2 ? 0.4 : i % 2 ? 0.3 : 0.05))}`, tc("#6a5a4a"), lw * 1.6);
  s += ln(`M${b.pt(-0.6, 0.5)} L${b.pt(0.32, 0.5)} M${b.pt(-0.6, 0.9)} L${b.pt(0.32, 0.9)}`, tc("#6a5a4a"), lw * 1.6);
  s += litWin(b, -0.3, 1.9, 0.24, 0.5, 607, lit, true, "#7a70a6") + litWin(b, 0.5, 1.7, 0.2, 0.42, 608, lit * 0.6, true, "#7a70a6") + flat(hd(b, [[-1.0, 1.4], [-1.0, 1.9], [-0.94, 1.9], [-0.94, 1.4]], 609, 0.004, 0.3), INK);
  s += shp(hd(b, [[-2.2, 0], [-2.18, 3.5], [-2.3, 3.62], [-2.3, 3.8], [-1.1, 3.82], [-1.1, 3.64], [-1.22, 3.5], [-1.2, 0]], 610, 0.012, 0.35), stoneL, lw) + flat(hd(b, [[-1.5, 0], [-1.5, 3.5], [-1.22, 3.5], [-1.2, 0]], 611, 0.01, 0.35), stoneS, `opacity="0.6"`) + stones(b, -2.15, -1.25, 0, 3.5, 612, stoneS, lw);
  s += shp(hd(b, [[-2.34, 3.8], [-1.74, 4.75], [-1.68, 4.75], [-1.06, 3.82]], 613, 0.01, 0.3), slate, lw) + ln(`M${b.pt(-2.1, 3.9)} L${b.pt(-1.74, 4.6)} M${b.pt(-1.8, 3.88)} L${b.pt(-1.7, 4.6)}`, slateL, lw * 1.4) + flat(hd(b, [[-1.6, 3.84], [-1.69, 4.7], [-1.08, 3.84]], 614, 0.008, 0.3), tc("#1a1e70"), `opacity="0.7"`);
  s += litWin(b, -1.84, 2.6, 0.24, 0.5, 615, lit, true, "#7a70a6") + flat(hd(b, [[-1.74, 1.3], [-1.74, 1.8], [-1.68, 1.8], [-1.68, 1.3]], 616, 0.004, 0.3), INK);
  return { svg: s, door: [-0.14, 0], top: 4.75 };
}
function banner(b, x, y, L, t, seed, col, colS) {
  const N = 7, top = [], bot = []; for (let i = 0; i <= N; i++) { const u = i / N, wv = Math.sin(t * 5 - u * 6 + seed) * 0.05 * u * (1 + MV * 0.3); top.push(b.pt(x + u * L, y + wv - u * 0.05)); bot.push(b.pt(x + u * L * (i === N ? 0.78 : 1), y - 0.2 + wv - u * 0.02 + (i === N ? 0.1 : 0))); }
  return ln(`M${b.pt(x, y - 0.5)} L${b.pt(x, y + 0.06)}`, INK, b.lw * 2) + shp(`M${top.join(" L")} L${b.pt(x + L * 0.8, y - 0.1 + Math.sin(t * 5 - 6 + seed) * 0.05)} L${bot.reverse().join(" L")} Z`, col, b.lw) + ln(`M${b.pt(x, y - 0.1)} L${b.pt(x + L * 0.75, y - 0.12 + Math.sin(t * 5 - 5 + seed) * 0.04)}`, colS, b.lw * 2);
}
// stage 3: a Hanseatic brick-Gothic palace (Backsteingotik): stepped gables, white blind niches, a tall pointed tower, green copper, gold banners
function palace(b, st, t) {
  const lw = b.lw, brick = tc("#cc4426"), brickS = tc("#96301e"), brickL = tc("#ea6a36"), white = tc("#f6eeda"), glaze = tc("#3a2440"), cop = tc("#38b890"), copS = tc("#1c7c68"), copL = tc("#8ae6c0"), gold = tc("#ffc21c", 0.5), goldS = tc("#d07a12", 0.6), lit = st.light ?? 1;
  let s = "";
  const lancet = (x, y, w, h, seed, on = 1) => shp(hd(b, [[x, y], [x, y + h * 0.78], [x + w / 2, y + h], [x + w, y + h * 0.78], [x + w, y]], seed, 0.004, 0.25), on < 0 ? white : mix(tc("#1c1a3a"), WARM, lit * on), lw * 0.8) + (on < 0 ? "" : ln(`M${b.pt(x + w / 2, y)} L${b.pt(x + w / 2, y + h * 0.95)}`, glaze, lw));
  const spire = (x, y, w, h, seed) => shp(hd(b, [[x - w / 2, y], [x - 0.02, y + h], [x + 0.02, y + h], [x + w / 2, y]], seed, 0.006, 0.3), cop, lw) + flat(hd(b, [[x + w * 0.1, y], [x + 0.01, y + h * 0.96], [x + w / 2, y]], seed + 1, 0.005, 0.3), copS, `opacity="0.8"`) + ln(`M${b.pt(x - w * 0.28, y + 0.04)} L${b.pt(x - 0.03, y + h * 0.9)}`, copL, lw * 1.3) + `<circle cx="${n(b.x(x))}" cy="${n(b.y(y + h + 0.04))}" r="${n(b.k * 0.035)}" fill="${gold}" stroke="${INK}" stroke-width="${n(lw * 0.7)}"/>`;
  const courses = (x0, x1, y0, y1, seed) => { let g = ""; for (let y = y0 + 0.12, r = 0; y < y1 - 0.04; y += 0.12, r++) { g += ln(`M${b.pt(x0 + 0.03, y)} L${b.pt(x1 - 0.03, y + jit(seed + r, 0.008))}`, brickS, lw * 0.7, `opacity="0.75"`); for (let j = 0; j < 3; j++) { const x = lerp(x0 + 0.05, x1 - 0.3, hash(seed + r * 7 + j)); if (hash(seed + r * 3 + j) > 0.6) g += flat(hd(b, [[x, y - 0.1], [x + 0.22, y - 0.1], [x + 0.22, y - 0.02], [x, y - 0.02]], seed + r * 5 + j, 0.003, 0.3), j % 2 ? brickL : brickS, `opacity="0.8"`); } } return g; };
  const gable = (cx, w, y0, h, steps, seed) => { const a = [[cx - w / 2, y0]]; for (let i = 0; i < steps; i++) { const x = cx - w / 2 + i * (w / 2 - 0.12) / steps, y = y0 + (i + 1) * h / steps; a.push([x, y], [x + (w / 2 - 0.12) / steps, y]); } for (let i = steps - 1; i >= 0; i--) { const x = cx + w / 2 - i * (w / 2 - 0.12) / steps, y = y0 + (i + 1) * h / steps; a.push([x - (w / 2 - 0.12) / steps, y], [x, y]); } a.push([cx + w / 2, y0]);
    let g = shp(hd(b, a, seed, 0.006, 0.3), brick, lw) + courses(cx - w / 2, cx + w / 2, y0, y0 + h * 0.5, seed + 3);
    [-1, 0, 1].forEach((i) => { g += lancet(cx + i * w * 0.24 - w * 0.07, y0 + 0.12, w * 0.14, h * (i ? 0.5 : 0.72), seed + 10 + i, i ? -1 : 1); });
    return g + shp(ring(b.x(cx), b.y(y0 + h * 0.86), b.k * w * 0.05, seed + 20, 0.05, 10), white, lw * 0.8) + ln(`M${b.pt(cx - w / 2, y0)} L${b.pt(cx + w / 2, y0)}`, glaze, lw * 2.4); };
  // the hall behind: a steep green copper roof with a ridge turret
  s += shp(hd(b, [[-1.95, 2.1], [-1.5, 3.25], [1.6, 3.28], [1.95, 2.1]], 700, 0.01, 0.35), cop, lw) + flat(hd(b, [[0.6, 2.1], [0.7, 3.26], [1.6, 3.28], [1.95, 2.1]], 701, 0.01, 0.35), copS, `opacity="0.7"`);
  for (let i = 0; i < 12; i++) s += ln(`M${b.pt(-1.8 + i * 0.32, 2.14)} L${b.pt(-1.42 + i * 0.27, 3.22)}`, i % 3 ? copS : copL, lw, `opacity="0.8"`);
  s += spire(0.2, 3.26, 0.34, 0.95, 704) + banner(b, 0.2, 4.56, 0.6, t, 5, gold, goldS);
  // main block: pointed arcade on the ground, a row of tall lit windows, glazed dark bands
  s += shp(hd(b, [[-2.0, 0], [-2.0, 2.12], [2.0, 2.12], [2.0, 0]], 710, 0.012, 0.4), brick, lw) + flat(hd(b, [[1.25, 0], [1.25, 2.12], [2.0, 2.12], [2.0, 0]], 711, 0.01, 0.4), brickS, `opacity="0.5"`) + courses(-2.0, 2.0, 0, 2.12, 712);
  s += ln(`M${b.pt(-2.0, 1.0)} L${b.pt(2.0, 1.02)}`, glaze, lw * 2.6) + ln(`M${b.pt(-2.0, 1.07)} L${b.pt(2.0, 1.09)}`, white, lw * 1.4);
  for (let i = 0; i < 7; i++) { const x = -1.78 + i * 0.52; s += shp(hd(b, [[x, 0], [x, 0.55], [x + 0.19, 0.84], [x + 0.38, 0.55], [x + 0.38, 0]], 720 + i, 0.005, 0.25), i === 3 ? tc("#7a1420") : glaze, lw) + (i === 3 ? ln(`M${b.pt(x + 0.19, 0.02)} L${b.pt(x + 0.19, 0.8)}`, gold, lw * 1.4) : "") + lancet(x + 0.07, 1.24, 0.24, 0.7, 730 + i, i % 3 === 1 ? 0.55 : 1); }
  // the show front: three stepped gables with copper spirelets between
  s += gable(-1.18, 1.3, 2.12, 1.25, 4, 740) + gable(0.2, 1.5, 2.12, 1.7, 5, 750) + gable(1.42, 1.1, 2.12, 1.05, 4, 760);
  s += spire(-0.5, 2.12, 0.16, 1.5, 770) + spire(0.92, 2.12, 0.16, 1.35, 772) + shp(hd(b, [[-0.66, 0], [-0.58, 0.09], [0.6, 0.09], [0.68, 0]], 742, 0.005, 0.3), white, lw);
  // the tall tower on the left: brick shaft, white blind niches, gallery, a needle of green copper, the gold banner
  const tx = -2.3, tw = 0.86, th = 3.7;
  s += shp(hd(b, [[tx - tw / 2, 0], [tx - tw / 2, th], [tx + tw / 2, th], [tx + tw / 2, 0]], 780, 0.01, 0.35), brick, lw) + flat(hd(b, [[tx + tw * 0.2, 0], [tx + tw * 0.2, th], [tx + tw / 2, th], [tx + tw / 2, 0]], 781, 0.008, 0.35), brickS, `opacity="0.7"`) + courses(tx - tw / 2, tx + tw / 2, 0, th, 782);
  [0.5, 1.5, 2.5].forEach((y, i) => { s += lancet(tx - 0.3, y, 0.2, 0.75, 784 + i, -1) + lancet(tx + 0.1, y, 0.2, 0.75, 788 + i, i === 2 ? 1 : -1) + ln(`M${b.pt(tx - tw / 2, y - 0.12)} L${b.pt(tx + tw / 2, y - 0.12)}`, glaze, lw * 2); });
  s += shp(hd(b, crenel(tx - tw / 2 - 0.08, tx + tw / 2 + 0.08, th, 0.14, 0.17).concat([[tx + tw / 2 + 0.08, th - 0.08], [tx - tw / 2 - 0.08, th - 0.08]]), 790, 0.004, 0.5), white, lw * 0.8);
  [-1, 1].forEach((d) => { s += spire(tx + d * tw * 0.42, th + 0.1, 0.14, 0.5, 792 + d); });
  s += spire(tx, th + 0.12, tw * 0.8, 1.7, 795) + banner(b, tx, th + 2.25, 0.7, t, 9, gold, goldS);
  // small stair turret on the right
  s += shp(hd(b, [[1.86, 0], [1.86, 2.6], [2.36, 2.6], [2.36, 0]], 796, 0.008, 0.35), brickS, lw) + lancet(2.02, 1.7, 0.18, 0.5, 797, 1) + spire(2.11, 2.6, 0.62, 1.0, 798);
  return { svg: s, door: [0, 0], top: 5.6 };
}
const STAGES = [hut, cottage, castle, palace];
export function home(c, st = {}, t = 0) {
  const stage = clamp((st.stage || 0) / 3) * 3, i0 = Math.floor(stage), fr = stage - i0, X = st.X ?? BALTIC.home.X, Z = st.Z ?? BALTIC.home.Z;
  if (Z - c.z < NEAR + 0.3) return { svg: "", door: null, top: 0 };
  const b = board(c, X, 0, Z, st.size || 1), A = STAGES[i0](b, st, t), B = fr > 0.01 ? STAGES[i0 + 1](b, st, t) : null, wd = 2.2;   // one shoreline footprint for every stage (Sol R2 B21)
  const mound = flat(blob([[-wd - 0.5, -0.06], [-wd, 0.1], [0, 0.16], [wd, 0.1], [wd + 0.6, -0.04], [0, -0.22]].map(([x, y], i) => ({ x: b.x(x + jit(i + 380, 0.08)), y: b.y(y) }))), M.sandL) + flat(blob([[-wd - 0.3, -0.1], [0, -0.02], [wd + 0.5, -0.08], [0, -0.26]].map(([x, y]) => ({ x: b.x(x), y: b.y(y) }))), M.sandS, `opacity="0.55"`);
  const who = B && fr > 0.5 ? B : A;
  return { svg: ((st.alpha ?? 1) < 0.999 ? `<g opacity="${n(clamp(st.alpha))}">` : "") + mound + (B ? `<g opacity="${n(1 - fr)}">${A.svg}</g><g opacity="${n(fr)}">${B.svg}</g>` : A.svg) + (st.tufts === false ? "" : marram(c, { X: X - wd - 0.2, Z: Z - 0.05, size: 0.9, seed: 71 }, t) + marram(c, { X: X + wd + 0.25, Z: Z - 0.1, size: 1, seed: 73 }, t)) + ((st.alpha ?? 1) < 0.999 ? "</g>" : ""), door: { X: X + who.door[0], Z: Z - 0.1 }, top: who.top };
}

// ---------------------------------------------------------------- the whole set
export const BALTIC = { home: { X: -1.15, Z: 6.6 }, kid: { X: JETTY.X - 0.05, Z: 11.4 }, keeper: { X: -0.45, Z: 5.9 }, drift: { X: 0.9, Z: 4.7 },
  cam: { wide: { x: 0, y: 3.0, z: 0.6, h0: 760 }, far: { x: 0.1, y: 2.6, z: -2.2, h0: 900 }, door: { x: -0.95, y: 1.0, z: 2.2, h0: 1020 }, jetty: { x: 1.2, y: 1.5, z: 8.0, h0: 1000 }, two: { x: -0.1, y: 1.25, z: 1.0, h0: 1040 }, storm: { x: 2.9, y: 2.0, z: 1.5, h0: 1000 } } };
// o: { stage, towers 0..1, bolt, boltX, sun, glitter, drift: true, light, smoke, rain 0..1, tufts }. Returns { back, front, home, cam }:
// draw back, then the cast (hosts on the jetty use cam = deckCam(c)), then grade(), then front.
export function coast(c, t, o = {}) {
  const hm = home(c, { stage: o.stage || 0, light: o.light, smoke: o.smoke }, t), jt = jetty(c, t);
  const back = sky(c, t, o) + sea(c, t, o) + towers(c, t, { amt: o.towers ?? wStorm() }) + shore(c, t, o) + hm.svg + (o.drift === false ? "" : driftwood(c, { ...BALTIC.drift, rot: -4, seed: 3 })) + jt.svg;
  const r = o.rain ?? wStorm();
  return { back, front: near(c, t) + (r > 0.02 ? rain(t, r) : ""), home: hm, cam: jt.cam };
}

// ---------------------------------------------------------------- the flounder
// Local design on a 100-long fish, head at -x. Both eyes sit on this (the upper, coloured) side, close together on the head.
function fishBody(o, t) {
  const md = o.mood ?? 1, op = clamp(o.open || 0), cold = 1 - md, sd = o.seed || 1, look = o.look || [-0.3, 0], bl = o.blink || 0;
  const body = mix("#b46a24", "#586a7c", cold * 0.35), bodyS = mix("#7a3e1c", "#34425a", cold * 0.4), bodyL = mix("#e89c3c", "#8a9aac", cold * 0.35), fin = mix("#e2562a", "#5a5e8a", cold * 0.4), finS = mix("#9c2a22", "#34365e", cold * 0.4), belly = "#f6e2b4";
  const P2 = (x, y) => `${n(x)},${n(y)}`, rip = (i) => Math.sin(t * 6 + i * 0.9) * 1.1;
  // fringe fins (dorsal above, anal below): scalloped edge + one ray per scallop
  let fins = "", rays = "";
  for (const sg of [-1, 1]) { const a = [], N = 13; a.push({ x: -31, y: sg * 15 }); for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(-30, 37, u), out = 23.5 * Math.sin(Math.PI * clamp(u * 0.92 + 0.08)) ** 0.55 + (i % 2 ? 2.2 : 0) + rip(i + sg * 3); a.push({ x, y: sg * (11 + out) }); rays += `M${P2(lerp(-26, 34, u), sg * 14)} L${P2(x, sg * (9 + out))} `; } a.push({ x: 38, y: sg * 6 }, { x: 0, y: sg * 6 }); fins += shp("M" + a.map(pt).join(" L") + " Z", fin, 1.1); }
  const tail = shp(`M36,-5 Q44,-8 ${P2(55, -14 + rip(2))} Q${P2(59, rip(5) * 1.5)} ${P2(55, 14 + rip(7))} Q44,8 36,5 Z`, fin, 1.1) + ln(`M40,-3 L${P2(54, -10 + rip(2))} M41,0 L${P2(57, rip(5))} M40,3 L${P2(54, 10 + rip(7))} M40,-1.5 L55,-5 M40,1.5 L55,5`, finS, 0.8);
  const outline = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2, cx = Math.cos(a), hd2 = Math.max(0, -cx); return { x: 41.5 * cx - 1 + jit(sd * 9 + i, 0.5), y: 25.5 * Math.sin(a) * (1 - 0.2 * hd2 ** 2) + (cx < -0.6 ? 1.5 : 0) + jit(sd * 9 + i + 0.5, 0.5) }; });
  let s = fins + ln(rays, finS, 0.8) + tail + shp(blob(outline), body, 1.3);
  s += flat(blob([{ x: -30, y: 8 }, { x: -8, y: 15 }, { x: 22, y: 12 }, { x: 34, y: 4 }, { x: 20, y: 21 }, { x: -10, y: 24 }, { x: -31, y: 16 }]), bodyS, `opacity="0.55"`) + flat(blob([{ x: -24, y: -16 }, { x: 0, y: -22 }, { x: 22, y: -16 }, { x: 4, y: -18 }, { x: -14, y: -14 }]), bodyL, `opacity="0.6"`);
  for (let i = 0; i < 26; i++) { const a = hash(sd + i * 3.7) * Math.PI * 2, r = Math.sqrt(hash(sd + i * 5.1)) * 0.86, x = 3 + Math.cos(a) * 34 * r, y = Math.sin(a) * 20 * r; s += flat(ring(x, y, 0.7 + 1.1 * hash(i + sd), i, 0.3, 6), bodyS, `opacity="0.7"`); }
  [[-8, 8], [10, -10], [22, 6], [8, 12], [-14, -12], [26, -6], [-2, -15], [16, 15]].forEach(([x, y], i) => { s += flat(ring(x, y, 3 + 0.9 * hash(i + sd), i + 30, 0.18, 9), finS) + flat(ring(x - 0.2, y - 0.2, 2.1, i + 40, 0.18, 9), mix("#ff8a1c", "#8a8ec0", cold * 0.5)); });
  s += ln(`M-22,-1 Q-8,-9 8,-3 Q24,2 37,0`, bodyS, 0.9, `stroke-dasharray="3 1.6"`) + ln(`M-21,-13 Q-15,0 -22,14`, bodyS, 1.1) + shp(`M-15,3 Q-6,1 -2,7 Q-7,12 -14,9 Z`, fin, 0.9) + ln(`M-13,5 L-4,6.5 M-13,7 L-6,9.5`, finS, 0.7);
  // the faint gold crown on its back (an enchanted prince)
  const cr = o.crown ?? 0.5;
  if (cr > 0.02) s += `<g opacity="${n(cr)}" transform="translate(9,0) rotate(-6)"><path d="M-8.5,4.5 L-9.6,-3.4 L-4.7,0.6 L-0.2,-6.2 L4.4,0.4 L9.4,-3.8 L8.6,4.6 Q0,6.2 -8.5,4.5 Z" fill="#ffd838" stroke="#fff3a0" stroke-width="0.7" stroke-linejoin="round"/><path d="M-8,2.6 Q0,4.2 8.2,2.7" stroke="#c8861c" stroke-width="0.8" fill="none"/><circle cx="-9.6" cy="-4" r="1" fill="#fff3a0"/><circle cx="-0.2" cy="-6.9" r="1.1" fill="#fff3a0"/><circle cx="9.4" cy="-4.4" r="1" fill="#fff3a0"/></g>`;
  // mouth: the lower jaw drops with `open`; the corner lifts with mood (smile) or sinks (cold)
  const jaw = op * 10, cx = -30.5, cy = 7 - md * 3.4 + cold * 2.4;
  if (op > 0.06) s += shp(`M-42.6,2.2 Q-37,${n(4.2 - md)} ${P2(cx, cy)} Q-37.5,${n(6.5 + jaw)} ${P2(-42 + op, 3.4 + jaw)} Q-43.6,${n(3 + jaw * 0.5)} -42.6,2.2 Z`, "#4a1226", 0.9) + flat(`M-41,${n(3.6 + jaw * 0.7)} Q-38,${n(5 + jaw * 0.75)} -35.4,${n(5.4 + jaw * 0.5)} Q-38,${n(6.4 + jaw)} -41,${n(3.6 + jaw * 0.7)} Z`, "#f0627c");
  else s += ln(`M-42.8,2.4 Q-37.5,${n(5 + md * 2.4 - cold * 2.2)} ${P2(cx, cy)}`, INK, 1.7);
  s += ln(`M-42.4,0.9 Q-37,${n(2.6 - md)} ${P2(cx - 1, cy - 1.8)}`, bodyL, 1.1, `opacity="0.9"`);
  if (md > 0.6) s += ln(`M${P2(cx - 0.4, cy - 1.6)} q1.6,0.6 1.4,2.6`, INK, 0.8);
  // two bulging eyes, one behind and above the other, both on this side
  [[-29.5, -3.4, 5.2], [-21.5, -11.6, 4.6]].forEach(([ex, ey, r], i) => {
    const lid = clamp(bl + cold * 0.42), px = ex + look[0] * r * 0.32, py = ey + look[1] * r * 0.32 + cold * 0.3;
    s += shp(ring(ex, ey, r + 1.6, i + 60, 0.05, 12), bodyS, 1) + shp(ring(ex, ey, r, i + 62, 0.03, 14), "#ffd21c", 0.9) + flat(ring(ex, ey, r * 0.72, i + 64, 0.06, 10), "#ffec7a") + flat(ring(px, py, r * (0.5 - cold * 0.1), i + 66, 0.05, 10, 0.86), "#120a12") + `<circle cx="${n(px - r * 0.2)}" cy="${n(py - r * 0.22)}" r="${n(r * 0.14)}" fill="#fffbe0"/>`;
    if (lid > 0.03) s += shp(`M${P2(ex - r - 0.8, ey)} Q${P2(ex, ey - r * 1.7)} ${P2(ex + r + 0.8, ey)} Q${P2(ex, ey - r * 1.3 + lid * r * 2.3)} ${P2(ex - r - 0.8, ey)} Z`, bodyS, 0.9);
  });
  return s;
}
// screen space. o: { rot deg (0 head left, 90 head up), flip, open 0..1, mood 1 friendly..0 cold, look [dx, dy], crown, blink, seed, t }
export function flounder(x, y, len, o = {}) {
  const k = len / 100;
  return `<g transform="translate(${n(x)},${n(y)}) rotate(${n(o.rot || 0)}) scale(${n(k * (o.flip ? -1 : 1) * 100) / 100},${n(k * 100) / 100})">${fishBody(o, o.t || 0)}</g>`;
}
export function flounderOnLine(end, len, o = {}) {
  const rot = 90 + (o.swing || 0), a = rot * Math.PI / 180, mx = -0.43 * len, my = 0.03 * len, cx = end.x - (mx * Math.cos(a) - my * Math.sin(a)), cy = end.y - (mx * Math.sin(a) + my * Math.cos(a));
  const hook = `<path d="M${n(end.x)},${n(end.y - len * 0.05)} l0,${n(len * 0.06)} q${n(len * 0.004)},${n(len * 0.035)} ${n(len * 0.03)},${n(len * 0.02)}" fill="none" stroke="#d8dcea" stroke-width="${n(Math.max(1.5, len * 0.009))}" stroke-linecap="round"/>`;
  return { svg: flounder(cx, cy, len, { ...o, rot }) + hook, x: cx, y: cy };
}
export function flounderHeld(kd, len, o = {}) {
  const k = kd.p.s / 100, cpt = toScreen(kd.p, 0, -1, -72), skin = "#f3cdb0";
  const hand = (dx) => `<path d="${ring(cpt.x + dx * len, cpt.y + len * 0.2, 5.2 * k, dx * 10 + 3, 0.1, 10, 0.8)}" fill="${skin}" stroke="${INK}" stroke-width="${n(0.6 * k)}"/>` + ln(`M${n(cpt.x + dx * len - 2 * k)},${n(cpt.y + len * 0.2 - 3.6 * k)} l0,${n(3 * k)} M${n(cpt.x + dx * len + 1.5 * k)},${n(cpt.y + len * 0.2 - 3.8 * k)} l0,${n(3 * k)}`, "#c48a74", 0.5 * k);
  return { svg: flounder(cpt.x, cpt.y, len, { rot: -6, ...o }) + hand(-0.22) + hand(0.2), x: cpt.x, y: cpt.y };
}
export function flounderUnder(x, y, len, o = {}) {
  const d = o.depth ?? 0.5, t = o.t || 0;
  let s = flat(ring(x + len * 0.04, y + len * 0.06, len * 0.52, 91, 0.08, 16, 0.62), M.seaInk, `opacity="0.4"`) + `<g opacity="${n(1 - d * 0.35)}">${flounder(x, y, len, o)}</g>` + flat(ring(x, y, len * 0.66, 93, 0.06, 18, 0.66), M.sea2, `opacity="${n(0.25 + d * 0.4)}"`);
  for (let i = 0; i < 7; i++) { const yy = y + (i - 3) * len * 0.11 + jit(i + 95, len * 0.02), w = len * (0.3 + 0.3 * hash(i + 96)), xx = x + jit(i + 97, len * 0.3) + Math.sin(t * 0.8 + i) * len * 0.03; s += ln(`M${n(xx - w)},${n(yy)} q${n(w * 0.5)},${n(-len * 0.025)} ${n(w)},0 q${n(w * 0.5)},${n(len * 0.025)} ${n(w)},0`, i % 2 ? M.seaL : M.seaInk, Math.max(1.5, len * 0.012), `opacity="${i % 2 ? 0.7 : 0.5}"`); }
  return s;
}
export function flounderRise(x, y, len, o = {}) {
  const out = o.out ?? 0.5, id = "fr" + (UID++), rot = 62 + (o.swing || 0), cy = y + len * (0.3 - out * 0.5), t = o.t || 0;
  let s = `<clipPath id="${id}"><rect x="${n(x - len)}" y="${n(y - len * 1.5)}" width="${n(len * 2)}" height="${n(len * 1.5)}"/></clipPath><g clip-path="url(#${id})">${flounder(x, cy, len, { ...o, rot })}</g>`;
  const fk = o.foamK ?? 1;
  s += flat(blob(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return { x: x + Math.cos(a) * len * (0.42 + jit(i + 99, 0.05)), y: y + Math.sin(a) * len * 0.06 + Math.sin(t * 3 + i) * 1.5 }; })), M.foam, `opacity="${n(fk)}"`);
  s += ln(`M${n(x - len * 0.62)},${n(y + len * 0.05)} q${n(len * 0.3)},${n(len * 0.06)} ${n(len * 0.62)},${n(len * 0.02)} q${n(len * 0.3)},${n(-len * 0.02)} ${n(len * 0.6)},${n(-len * 0.03)}`, M.seaL, Math.max(2, len * 0.014), `opacity="${n(0.8 * fk)}"`);
  for (let i = 0; i < 8; i++) s += flat(ring(x + jit(i + 110, len * 0.45), y - len * 0.03 - hash(i + 111) * len * 0.1, Math.max(2, len * (0.012 + 0.014 * hash(i))), i, 0.3, 7), M.foam, `opacity="${n(fk)}"`);
  return s;
}
// FRAME 0. The huge gold eye opening under black storm water. o: { open 0..1, look [dx, dy], cx, cy, r }
export function eyeShot(t, o = {}) {
  const open = clamp(o.open ?? 1), cx = o.cx ?? 540, cy = o.cy ?? 1160, r = o.r ?? 300, look = o.look || [0, -0.1], id = "ey" + (UID++);
  let s = `<rect width="${W}" height="${H}" fill="#02020a"/>`;
  // storm sky strip and black crests on top (the title sits here)
  s += `<rect width="${W}" height="420" fill="#0b061e"/>` + shelf(wline(120, 5, 40, 90, t * 1.2), "#04020c") + band(wline(250, 7, 16, 140), "#3a1470") + band(wline(292, 8, 12, 120), "#6a22b8");
  [[330, 60, 3, "#04051a"], [395, 44, 4, "#02020a"]].forEach(([y, am, sd, col], i) => { const a = wline(y, sd, am, 78, t * 1.6 + i); s += band(a, col) + ln("M" + a.map(pt).join(" L"), i ? "#2436e0" : "#3c50ff", 3, `opacity="0.7"`); a.forEach((p, j) => { if (j % 3 === i) s += flat(ring(p.x, p.y - 4, 10 + 8 * hash(j + sd), j, 0.3, 7, 0.5), "#e4ffe6", `opacity="0.85"`); }); });
  for (let i = 0; i < 30; i++) { const y = 470 + i * 50 + jit(i + 130, 14), x = hash(i + 131) * W + Math.sin(t * 0.7 + i) * 24, w = 90 + 220 * hash(i + 132); s += ln(`M${n(x - w)},${n(y)} q${n(w * 0.5)},${n(-9)} ${n(w)},0 q${n(w * 0.5)},${n(9)} ${n(w)},0`, i % 3 ? "#0c0c2e" : "#1a1c6a", 4 + 5 * hash(i + 133), `opacity="0.9"`); }
  // the flounder's back, barely there: a flat dark shape with dull spots
  s += flat(ring(cx + 60, cy + 50, r * 2.25, 141, 0.05, 20, 0.86), "#3a1a0e") + flat(ring(cx + 60, cy + 50, r * 2.02, 143, 0.05, 20, 0.84), "#4a2410");
  for (let i = 0; i < 16; i++) { const a = hash(i + 150) * Math.PI * 2, rr = r * (1.25 + 0.7 * hash(i + 151)); s += flat(ring(cx + 60 + Math.cos(a) * rr, cy + 50 + Math.sin(a) * rr * 0.84, 16 + 26 * hash(i + 152), i + 153, 0.2, 9), i % 3 ? "#1c2a1a" : "#40200e"); }
  // socket bump, lids, then the eye cut to the lid opening
  s += flat(ring(cx, cy, r * 1.2, 161, 0.03, 22), "#2a140a") + ln(ring(cx, cy, r * 1.2, 161, 0.03, 22), "#7a3a16", 5);
  const hh = r * 2.25 * open, lens = `M${n(cx - r * 1.12)},${n(cy)} Q${n(cx)},${n(cy - hh)} ${n(cx + r * 1.12)},${n(cy + 8)} Q${n(cx + 10)},${n(cy + hh * 0.96)} ${n(cx - r * 1.12)},${n(cy)} Z`;
  let e = flat(ring(cx, cy, r, 163, 0.012, 30), "#ffbe0a") + flat(ring(cx, cy, r * 0.8, 165, 0.03, 24), "#ffdc2a") + flat(ring(cx, cy, r * 0.56, 167, 0.05, 20), "#fff07a");
  for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2 + jit(i + 170, 0.05), r0 = r * (0.44 + 0.1 * hash(i + 171)), r1 = r * (0.8 + 0.17 * hash(i + 172)), w = 3 + 7 * hash(i + 173); e += ln(`M${n(cx + Math.cos(a) * r0)},${n(cy + Math.sin(a) * r0)} L${n(cx + Math.cos(a + jit(i + 174, 0.04)) * r1)},${n(cy + Math.sin(a) * r1)}`, i % 3 === 0 ? "#fffbd0" : i % 3 === 1 ? "#d87a00" : "#ff9a0a", w, `opacity="0.8"`); }
  e += ln(ring(cx, cy, r * 0.985, 163, 0.012, 30), "#7a3c00", 12);
  const px = cx + look[0] * r * 0.3, py = cy + look[1] * r * 0.3, pr = r * (0.36 + 0.05 * Math.sin(t * 2.2));
  e += flat(ring(px, py, pr * 1.12, 181, 0.04, 16), "#8a4a00") + flat(blob(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return { x: px + Math.cos(a) * pr * (1 + jit(i + 183, 0.04)) * (i === 12 ? 0.82 : 1), y: py + Math.sin(a) * pr * 0.9 * (i === 12 ? 0.8 : 1) }; })), "#050308");
  e += flat(blob([{ x: px - pr * 1.25, y: py - pr * 1.5 }, { x: px - pr * 0.6, y: py - pr * 1.75 }, { x: px - pr * 0.45, y: py - pr * 1.2 }, { x: px - pr * 1.1, y: py - pr * 0.95 }]), "#fffdf0") + `<circle cx="${n(px + pr * 0.5)}" cy="${n(py + pr * 0.55)}" r="${n(pr * 0.1)}" fill="#fff07a"/>`;
  s += `<clipPath id="${id}"><path d="${lens}"/></clipPath><g clip-path="url(#${id})">${e}</g>` + (open > 0.03 ? ln(lens, "#1a0c00", 9) + ln(`M${n(cx - r * 1.12)},${n(cy)} Q${n(cx)},${n(cy - hh)} ${n(cx + r * 1.12)},${n(cy + 8)}`, "#3a4a2a", 5, `transform="translate(0,-12)"`) : ln(`M${n(cx - r * 1.1)},${n(cy)} Q${n(cx)},${n(cy + 26)} ${n(cx + r * 1.1)},${n(cy + 8)}`, "#22301e", 7));
  // water over it: dark ripples crossing, gold broken on the surface (hand-cut dashes, no glow)
  for (let i = 0; i < 12; i++) { const y = cy - r * 1.3 + i * r * 0.24 + jit(i + 190, 12), x = cx + jit(i + 191, r * 0.9) + Math.sin(t * 0.9 + i * 1.3) * 26, w = r * (0.35 + 0.5 * hash(i + 192)); s += ln(`M${n(x - w)},${n(y)} q${n(w * 0.5)},${n(-12)} ${n(w)},0 q${n(w * 0.5)},${n(12)} ${n(w)},0`, i % 4 === 0 ? "#2436e0" : "#04051a", i % 4 === 0 ? 4 : 9 + 8 * hash(i + 193), `opacity="${i % 4 === 0 ? 0.6 : 0.42}"`); }
  for (let i = 0; i < 16; i++) { const a = hash(i + 200) * Math.PI * 2, rr = r * (1.3 + 0.55 * hash(i + 201)), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.8, on = Math.sin(t * 4 + i * 2.1) > -0.4; if (on && open > 0.3) s += ln(`M${n(x - 16 - 20 * hash(i))},${n(y)} q${n(14)},${n(-5)} ${n(34 + 30 * hash(i + 202))},0`, "#ffbe0a", 4 + 3 * hash(i + 203), `opacity="${n(0.5 * open)}"`); }
  for (let i = 0; i < 22; i++) s += flat(ring(hash(i + 210) * W, 520 + hash(i + 211) * 1380, 3 + 6 * hash(i + 212), i, 0.3, 7, 0.5), "#e4ffe6", `opacity="${n(0.25 + 0.3 * hash(i + 213))}"`);
  return s;
}

// ---------------------------------------------------------------- the kid's rod
export function kidHand(kd, reachL = 1) { return toScreen(kd.p, 0, lerp(-16, -36, reachL) * 0.8, (lerp(-80, -108, reachL) + 20.28 + 6) * 0.8); }
// hand: screen point; k: px per cm (kd.p.s / 100). o: { ang deg from vertical (minus = screen left), len cm, bend, line cm, swing deg }
export function rod(hand, k, o = {}) {
  const a = (o.ang ?? -35) * Math.PI / 180, L = (o.len ?? 150) * k, bend = (o.bend ?? 0.12) * L, dx = Math.sin(a), dy = -Math.cos(a);
  const butt = { x: hand.x - dx * 16 * k, y: hand.y - dy * 16 * k }, tip = { x: hand.x + dx * L + dy * bend * -0.6, y: hand.y + dy * L + Math.abs(dx) * bend }, mid = { x: hand.x + dx * L * 0.55 - dy * bend * 0.25, y: hand.y + dy * L * 0.55 - Math.abs(dx) * bend * 0.3 };
  const d = `M${pt(butt)} L${pt(hand)} Q${pt(mid)} ${pt(tip)}`, sw = (o.swing || 0) * Math.PI / 180, ll = (o.line ?? 60) * k, end = { x: tip.x + Math.sin(sw) * ll, y: tip.y + Math.cos(sw) * ll }, lc = MV < 1.5 ? "#2a1d24" : "#eae6f4";
  let s = ln(d, INK, 2.6 * k + 1.6) + ln(d, "#9a6a34", 2.6 * k) + ln(`M${pt(hand)} Q${pt(mid)} ${pt(tip)}`, "#d8a45a", 0.8 * k, `transform="translate(${n(-0.5 * k)},${n(-0.5 * k)})" opacity="0.8"`);
  [0.3, 0.52, 0.78].forEach((u, i) => { const x = lerp(hand.x, tip.x, u) - dy * bend * 0.2 * Math.sin(u * 3), y = lerp(hand.y, tip.y, u) - Math.abs(dx) * bend * 0.3 * Math.sin(u * 3); s += ln(`M${n(x - 1.6 * k)},${n(y - 0.6 * k)} l${n(3.2 * k)},${n(1.2 * k)}`, "#5a3418", 0.7 * k); });
  s += ln(`M${pt(butt)} L${n(hand.x + dx * 5 * k)},${n(hand.y + dy * 5 * k)}`, "#3a2a2a", 3.4 * k, `stroke-dasharray="${n(1.4 * k)} ${n(0.9 * k)}" stroke-linecap="butt"`);
  s += ln(`M${pt(tip)} Q${n(lerp(tip.x, end.x, 0.5) + ll * 0.03)},${n(lerp(tip.y, end.y, 0.5))} ${pt(end)}`, lc, Math.max(1.4, 0.45 * k));
  return { svg: s, tip, end };
}
