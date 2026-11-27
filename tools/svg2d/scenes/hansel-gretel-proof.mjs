// Legend "Hansel and Gretel" design proof: 13 one-second shots, no sound. Not story, just the look of every set and pose.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/hansel-gretel-proof.mjs out/hg/proof.mp4 --stills 0,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5 --dir out/hg
// 0 hook (frame 0) · 1 forest night, crumbs + birds · 2 house close · 3 interior · 4 3 a.m. · 5 cage · 6 bony hand + bone
// 7 oven glow · 8 the shove · 9 Gretel poses · 10 witch poses (+ both hosts for size) · 11 dawn, duck, pearls · 12 small things
// env HG_TITLE = grimm | lebkuchen | scherenschnitt (+ HG_TEASER = T1 | T2 | T3) lays a story banner and a sample
// subtitle line (y 580) over shot 0.
import * as L from "../lib/legend.mjs";
import * as HS from "../lib/legend-hesse.mjs";
import { titleSvg } from "../lib/legend-hesse-title.mjs";
const { P, blinkAmt, ease, clamp, lerp } = L;
export const W = 1080, H = 1920, FPS = 30, DUR = 13;
const TITLE = process.env.HG_TITLE || "", TEASER = process.env.HG_TEASER || "T1";
const svg = (b, vig = 0.8) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HS.defs()}${b}${HS.vignette(vig)}</svg>`;
const sub = (txt) => `<text x="540" y="580" text-anchor="middle" font-family="Inter" font-weight="900" font-size="62" fill="#fff" stroke="#0a0612" stroke-width="12" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
const label = (txt) => `<text x="40" y="1880" font-family="Inter" font-weight="700" font-size="30" fill="#fff" stroke="#000" stroke-width="7" paint-order="stroke">${txt}</text>`;

function hook(t) {            // frame 0: one warm house deep in a black forest; two red eyes open in the sugar window
  const u = ease(clamp(t / 1)), c = { x: 0.15, y: 1.5, z: lerp(0, 0.8, u) }, hz = 12.5;
  const f = HS.forest(c, t, 0, { clear: { X: 0.2, Z: hz, r: 3.3 }, split: 5 });
  const h = HS.house(c, { X: 0.2, Z: hz, eyes: 1, eyeK: 2.0, look: lerp(-0.6, 0.8, u) }, t);
  return f.back + h.svg + f.front + HS.grade() + h.light + (TITLE ? titleSvg(TITLE, t + 0.4, { teaser: TEASER }) + sub("If you smell gingerbread...") : "");
}
function forestNight(t) {
  const c = { x: 0.1, y: 1.25, z: 0 }, tr = HS.trail(8, 2.6, 11, 4);
  const f = HS.forest(c, t, 0, { split: 3.2 }), fire = HS.campfire(c, { X: -1.25, Z: 5.6, level: 0.9 }, t);
  const kd = L.kid(c, { X: -0.35, Z: 4.4, fx: 0.7, worry: 1, blink: blinkAmt(t, [0.3]) }, t);
  const gr = HS.gretel(c, { X: 0.55, Z: 4.1, fx: 0.7, sniff: 1, point: 0.9 }, t);
  const birds = HS.bird(P(c, 0.75, 0, 6.3), { peck: 0.5 + 0.5 * Math.sin(t * 14), dir: -1 }) + HS.bird(P(c, 0.1, 0, 7.6), { peck: 0.5 + 0.5 * Math.sin(t * 14 + 2) }) + HS.bird(P(c, 0.5, 0, 3.0), { dir: -1, peck: 1 }) + HS.bird(P(c, 1.25, 1.75, 6.5), { white: true, fly: t * 3, k: 1.3 });
  return f.back + fire.svg + HS.crumbs(c, tr, { eaten: 3.5 }) + HS.pebbles(c, [{ X: -0.9, Z: 3.1 }, { X: -1.3, Z: 3.9 }, { X: 1.3, Z: 3.3 }], t) + birds + kd.svg + gr.svg + f.front + HS.grade(0, 0.6) + fire.light;
}
function houseClose(t) {
  const c = { x: 0.25, y: 1.15, z: 0 }, hz = 5.6;
  const f = HS.forest(c, t, 0, { clear: { X: 0, Z: hz, r: 3.5 }, split: 2 });
  const h = HS.house(c, { X: 0, Z: hz, door: 0.85, bite: 1 }, t);
  const wi = HS.witch(c, { X: 0.1, Z: hz - 0.25, dir: 1, sweet: 1, bend: 0.5 }, t);
  const kd = L.kid(c, { X: 1.55, Z: 4.4, fx: -0.7, shock: 0.6 }, t), gr = HS.gretel(c, { X: 0.95, Z: 4.0, fx: -0.6, worry: 1 }, t);
  const pc = L.toScreen(kd.p, 0, -30, -92);
  // someone in the doorway: the lit panes go under her, the spill of light over everybody
  return f.back + h.svg + f.front + HS.grade(0, 1) + h.panes + wi.svg + kd.svg + HS.piece({ x: pc.x, y: pc.y, s: kd.p.s * 0.9 }, { rot: -14 }) + gr.svg + `<rect width="${W}" height="${H}" fill="#8a7a8a" opacity="0.5" style="mix-blend-mode:multiply"/>` + h.spill;
}
function interior(t) {
  const c = { x: 0, y: 1.3, z: -0.6 }, R = HS.ROOM, r = HS.room(c, t, {});
  const wi = HS.witch(c, { X: -1.2, Z: 4.7, dir: 1, sweet: 1, talk: 0.5 + 0.5 * Math.sin(t * 20) }, t);
  const kd = L.kid(c, { ...R.kid, fx: -0.6, grin: 1 }, t), gr = HS.gretel(c, { ...R.gretel, fx: -0.5, talk: 0.6 }, t);
  return r.back + wi.svg + kd.svg + gr.svg + r.light;
}
function threeAm(t) {
  const c = { x: 0.6, y: 1.3, z: 0.4 }, r = HS.room(c, t, { lamp: 0, dark: 0.9, oven: { fire: 0.15 } });
  const wi = HS.witch(c, { X: 0.3, Z: 4.75, dir: 1, sweet: 0, sniff: 1, eyeGlow: 1 }, t);
  return r.back + wi.svg + r.light + wi.light;
}
function cageShot(t) {
  const c = { x: 0, y: 1.1, z: 0.4 }, sb = HS.stable(c, t, {}), cg = HS.cage(c, { X: 0.45, Z: 3.9 });
  const kd = L.kid(c, { X: 0.5, Z: 4.4, fx: -0.7, worry: 1, shock: 0.5 }, t);
  const wi = HS.witch(c, { X: -0.72, Z: 3.95, dir: 1, sweet: 0, reach: 1, reachX: 56, reachY: -84, eyeGlow: 0.9, bend: 0.6 }, t);
  const gr = HS.gretel(c, { X: -1.45, Z: 3.3, fx: 0.6, small: 1 }, t);
  return sb.back + cg.back + kd.svg + cg.front + wi.svg + gr.svg + sb.light + wi.light;
}
function handShot(t) {
  const cb = HS.closeBars(t, {}), hd = HS.bonyHand({ x: 190, y: 1010, s: 9, rot: -5, pinch: 1, feel: t * 2 }), kf = HS.kidFist({ x: 985, y: 1085, s: 9, rot: 3 });
  return cb.back + `<rect width="${W}" height="${H}" fill="#3a2a4a" opacity="0.35"/>` + HS.redEyes(250, 560, 34, { look: 0.5, glow: 1 }) + cb.bars + kf.svg + hd.svg;
}
function ovenShot(t, sh) {
  const c = { x: -0.75, y: 1.2, z: 1.3 }, r = HS.room(c, t, { lamp: 0.25, red: 0.75, oven: { door: 1, fire: 1 }, dawn: 0.6 }), sp = r.oven.spot;
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: sh ? 0.7 : 1, shoved: sh, bend: 0.3 }, t);
  const gr = HS.gretel(c, { X: sp.X + (sh ? 0.5 : 0.85), Z: sp.Z - 0.05, fx: -0.7, small: sh ? 0 : 1, shove: sh }, t);
  return r.back + wi.svg + gr.svg + r.light;
}
const sheetBg = (col) => `<rect width="${W}" height="${H}" fill="${col}"/><rect y="930" width="${W}" height="60" fill="#00000030"/><rect y="990" width="${W}" height="800" fill="#f4a6c0"/><rect y="1790" width="${W}" height="130" fill="#00000030"/>`;
function gretelPoses(t) {
  const a = { x: 0, y: 0, z: 0, h0: 950 }, b = { ...a, h0: 1810 }, Z = 2.6;
  const g = (c, X, st) => HS.gretel(c, { X, Z, ...st }, t).svg;
  const kst = { X: 0.62, Z, run: 0.3, fx: 0.7 }, kd = L.kid(b, kst, t), kh = HS.kidHand(b, kst);
  return sheetBg("#2f5a4a") + g(a, -0.75, { fx: 0.5 }) + g(a, -0.2, { fx: 0.7, walk: 0.3, talk: 1 }) + g(a, 0.42, { fx: 0.7, sniff: 1, point: 1 })
    + g(b, -0.78, { fx: 0.6, small: 1 }) + g(b, -0.3, { fx: 0.7, shove: 1 }) + g(b, 0.2, { fx: 0.7, run: 0.3, holdTo: kh }) + kd.svg + label("Gretel: stand, walk+talk, sniff+point / small, shove, run holding hands");
}
function witchPoses(t) {
  const a = { x: 0, y: 0, z: 0, h0: 950 }, b = { ...a, h0: 1810 }, Z = 3.3;
  const w = (c, X, st) => { const r = HS.witch(c, { X, Z, ...st }, t); return r.svg + r.light; };
  const kd = L.kid(a, { X: 0.2, Z, fx: -0.7 }, t), kp = L.keeper(a, { X: 0.85, Z, fx: -0.7, stern: 1, open: 1 }, t, kd.sleeve);
  return sheetBg("#2f5a4a") + w(a, -1.05, { sweet: 1 }) + w(a, -0.45, { sweet: 0, sniff: 1, eyeGlow: 0.6 }) + kd.svg + kp.svg + kp.arm
    + w(b, -1.15, { sweet: 0, reach: 1, bone: true }) + w(b, -0.3, { sweet: 0, lean: 1, bend: 0.3 }) + w(b, 0.4, { sweet: 0, shoved: 1, lean: 0.5 }) + label("Witch: sweet, sniff (+ hosts for size) / reach+bone, lean, shoved");
}
function dawn(t) {
  const c = { x: 0, y: 1.3, z: 0 }, f = HS.forest(c, t, 1, { split: 3 }), wz = { z0: 6.2, z1: 13 };
  const kst = { X: 0.45, Z: 4.2, run: t * 2.2, fx: 0.7, grin: 1 }, kd = L.kid(c, kst, t);
  const gr = HS.gretel(c, { X: -0.3, Z: 4.25, fx: 0.7, run: t * 2.2 + 0.5, grin: 1, holdTo: HS.kidHand(c, kst) }, t);
  return f.back + HS.water(c, t, wz) + HS.duck(P(c, -1.5, 0, 8.4), { k: 1.8 }, t) + HS.pearls(P(c, -1.2, 0, 3.6), { k: 1.5 }) + HS.bird(P(c, 1.4, 2.3, 6), { white: true, fly: t * 3, k: 1.4 }) + gr.svg + kd.svg + f.front + HS.grade(1, 0.6);
}
function smalls(t) {
  const p = (x, y, s) => ({ x, y, s });
  return sheetBg("#16332a") + HS.bird(p(200, 520, 900), { dir: 1 }) + HS.bird(p(480, 520, 900), { peck: 1 }) + HS.bird(p(800, 420, 900), { fly: 0.2 }) + HS.bird(p(260, 900, 900), { white: true }) + HS.bird(p(720, 800, 900), { white: true, fly: 0.7 })
    + `<rect y="1180" width="${W}" height="200" fill="${HS.D.water}"/>` + HS.duck(p(300, 1290, 420), {}, t) + HS.bone(p(760, 1250, 2200), { rot: -20 }) + HS.pearls(p(300, 1740, 1300), {}) + HS.piece(p(800, 1700, 1100), {}) + label("birds, white bird, duck, bone, pearls, cake piece");
}
const SHOTS = [hook, forestNight, houseClose, interior, threeAm, cageShot, handShot, (t) => ovenShot(t, 0), (t) => ovenShot(t, 1), gretelPoses, witchPoses, dawn, smalls];
export function draw(t) {
  L.resetIds(); HS.resetIds(); HS.night(0);
  const i = Math.min(SHOTS.length - 1, Math.floor(t));
  return svg(SHOTS[i](t - i), [9, 10, 12].includes(i) ? 0 : i === 0 ? 0.9 : 0.6);
}
