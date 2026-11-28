// Legend: The Kelpie (Loch Sunart, Scotland), code-drawn ROUGH DRAFT 1 (shot list: SHOTS.md, lines: lines.json, music: Sol's answer.md).
//   node storyboards/series/legend/kelpie/kp-render.mjs <out-subs.mp4> <out-nosubs.mp4> [--from s --to s]   (both exports in one pass)
//   No opening banner (Jonny 28 Nov: banner videos perform worse). TITLE=<style> (stone|weed|bridle) brings back the
//   tools/svg2d/lib/legend-scotland-title.mjs banner for a test. Only frames 0..~75 depend on it: see kp-head.sh.
// Voice-led like cw.mjs: every line starts when the previous line's last sound has ended (+ a gap); no voice is cut off.
import { readFileSync, existsSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as SCO from "../../../../tools/svg2d/lib/legend-scotland.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
export const TITLE = process.env.TITLE || "none";
const VO = "out/legend-kelpie/vo", SPEC = JSON.parse(readFileSync("storyboards/series/legend/kelpie/lines.json", "utf8"));
const TITLE_LIB = "tools/svg2d/lib/legend-scotland-title.mjs";
let titleCard = null;
if (TITLE !== "none" && existsSync(TITLE_LIB)) titleCard = (await import("../../../../" + TITLE_LIB)).titleCard;
const KEY = /kelpie|bridle|sticky|touch|finger|own/i;
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- voice: lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1)), 0, data.length >> 1) };
}
export const DEV = process.env.KP_DEV === "1";          // dev only: stand-in timing for takes that are not written yet
export const CUTS = {};                                  // no take is trimmed
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
for (const ln of Object.values(LINE)) {
  ln.cuts = [];
  if (!existsSync(`${VO}/${ln.id}.words.json`)) {
    if (!DEV) throw new Error("missing voice " + ln.id);
    const ws = ln.text.split(/\s+/), tt = ws.map((w, i) => [w, i * 0.4, i * 0.4 + 0.35]);
    ln.dur = ws.length * 0.4; ln.env = new Array(Math.ceil(ln.dur * FPS)).fill(0.4); ln.words = tt; ln.phrases = phrases(ln.words, ln.text, SPEC.captions?.[ln.id]); ln.len = ln.dur; continue;
  }
  let { sr, s } = readWav(`${VO}/${ln.id}.wav`);
  // long stretches of REAL silence (< -55 dBFS, >= 0.5 s, strictly between two sounds) are shortened to 0.3 s; no sound is touched
  { const h = Math.round(sr / 100), cuts = []; let st = null, lastLoud = 0, firstLoud = null;
    const db = []; for (let i = 0; i + h <= s.length; i += h) { let a = 0; for (let j = i; j < i + h; j++) a += (s[j] / 32768) ** 2; db.push(10 * Math.log10(a / h + 1e-18)); }
    db.forEach((v, i) => { if (v >= -55) { lastLoud = i; if (firstLoud === null) firstLoud = i; } });
    for (let i = 0; i <= db.length; i++) { const q = i < db.length && db[i] < -55; if (q && st === null) st = i; if (!q && st !== null) { if (i - st >= 50 && st > firstLoud && i - 1 < lastLoud) cuts.push([(st + 15) / 100, (i - 15) / 100]); st = null; } }
    ln.cuts = cuts;
    if (cuts.length) { const keep = []; for (let i = 0; i < s.length; i++) { const t = i / sr; if (!cuts.some(([a, b]) => t >= a && t < b)) keep.push(s[i]); } s = Int16Array.from(keep); } }
  ln.shift = (t) => t - ln.cuts.reduce((a, [c0, c1]) => a + Math.max(0, Math.min(t, c1) - c0), 0);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = []; let last = 0;
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; const r = Math.sqrt(a / hop); env.push(r); if (r > 0.004) last = (i + hop) / sr; }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = align(ln.text.split(/\s+/), JSON.parse(readFileSync(`${VO}/${ln.id}.words.json`, "utf8")).map(([w, a, b]) => [w, ln.shift(a), ln.shift(b)]));
  ln.phrases = phrases(ln.words, ln.text, SPEC.captions?.[ln.id]);
  ln.len = Math.max(last, ln.words[ln.words.length - 1][2]);   // the last sound, or the last word as Whisper heard it
}
const nw = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
// the k-th (0-based) word starting with w
const wordAt = (ln, w, k = 0) => { let xs = ln.words.filter((q) => nw(q[0]) === w); if (xs.length <= k) xs = ln.words.filter((q) => nw(q[0]).startsWith(w)); const x = xs[k]; if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };
const wordEnd = (ln, w, k = 0) => { const xs = ln.words.filter((q) => nw(q[0]).startsWith(w)); return xs[k][2]; };

// order (Sol's note: L01, L04, L02, L03, L05, then L06 on) and the breath between lines (seconds after the previous line's last sound)
export const ORDER = ["L01", "L04", "L02", "L03", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13", "L14", "L15", "L16", "L17", "L18", "L19", "L20", "L21", "L22", "L23", "L24", "L25", "L26", "L27", "L28"];
const GAP = { L04: 0.25, L02: 0.25, L03: 0.12, L05: 0.25, L06: 0.12, L07: 0.12, L08: 0.25, L09: 0.25, L10: 0.25, L11: 0.12, L12: 0.12, L13: 0.12, L14: 0.25, L15: 0.12, L16: 0.25, L17: 0.12, L18: 0.12, L19: 0.25, L20: 0.12, L21: 0.12, L22: 0.25, L23: 0.12, L24: 0.25, L25: 0.25, L26: 0.12, L27: 0.12, L28: 0.45 };
{ let prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? prev.end + GAP[id] : 0; ln.end = ln.at + ln.len; prev = ln; } }
for (let i = 1; i < ORDER.length; i++) if (LINE[ORDER[i]].at < LINE[ORDER[i - 1]].end) throw new Error("voices overlap at " + ORDER[i]);
export const DUR = +(LINE.L28.at + LINE.L28.len + 0.2).toFixed(2);   // hard end: the last sound + 0.2 s
export const TL_LINES = ORDER.map((id) => LINE[id]);
const prevEnd = (id) => { const i = ORDER.indexOf(id); return i ? LINE[ORDER[i - 1]].end : 0; };

// ---------------------------------------------------------------- faces: every drawn face / kelpie eye registers a circle, captions keep clear of them
let FACES = [];
const face = (x, y, r) => { FACES.push({ x, y, r }); };
const K_ = (c, st, t) => { const kd = L.kid(c, st, t); if (kd.p) face(kd.p.x + (st.fx ?? -0.8) * 0.02 * kd.p.s, kd.p.y - 1.1 * kd.p.s, 0.17 * kd.p.s); return kd; };
const G_ = (c, st, t, sl) => { const g = L.keeper(c, st, t, sl); if (g.p) face(g.p.x + (st.fx ?? -0.7) * 0.02 * g.p.s, g.p.y - 1.3 * g.p.s, 0.2 * g.p.s); return g; };
const VL_ = (c, st, t) => { const v = SCO.villager(c, st, t); if (v.p) face(v.p.x, v.p.y - (st.sit ? 0.78 : 1.05) * v.p.s, 0.16 * v.p.s); return v; };
const KP_ = (c, st, t) => { const h = SCO.kelpie(c, st, t); if (h.eye && h.p) { face(h.eye.x, h.eye.y, 0.09 * h.p.s * (st.size ?? 1) + 18); if (h.nose) face(h.nose.x, h.nose.y, 0.1 * h.p.s * (st.size ?? 1) + 20); } return h; };

// ---------------------------------------------------------------- building blocks
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? 0);
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const LO = SCO.LOCH, CR = SCO.CROFT;
const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SCO.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>${inner}${SCO.vignette()}`;
const END = (s) => s + SCO.grade();
const rider = (c, h, i, kinds, o = {}) => VL_(c, { ...h.seats[i], kind: kinds[i], sit: 1, fx: 0.7, grin: 1, ...o }, 0);
const KINDS = [1, 0, 2];
// riders on a kelpie: n kids (fractions fade the last one in); stuck = hands glued
function riders(c, h, cnt, o = {}, t = 0) {
  let s = "";
  for (let i = 0; i < Math.min(3, Math.ceil(cnt)); i++) {
    if (!h.seats[i] || h.seats[i].Y < (o.minY ?? -9)) continue;
    const ar = o.arrive && o.arrive.i === i ? o.arrive.a : 1; if (ar < 0.04) continue;
    s += VL_(c, { ...h.seats[i], Y: h.seats[i].Y + (1 - ar) * 0.3, Z: h.seats[i].Z - (1 - ar) * 0.35, kind: KINDS[i], sit: 1, fx: 0.7, grin: o.grin ?? 1, stuck: o.stuck ?? 0, shock: o.shock ?? 0, talk: o.talk ?? 0, blink: bl(t, i * 0.3) }, t).svg;
  }
  return s;
}
const KID_REACH = { X: LO.kid.X, Z: LO.kid.Z };
// the kelpie nudged so its nose meets the kid's bell hand
function reachPair(c, t, o = {}) {
  const kd = K_(c, { X: o.kX ?? 1.25, Z: o.kZ ?? 4.2, fx: -0.8, reachL: o.reach ?? 1, shock: o.shock ?? 0.2, worry: o.worry ?? 0.5, talk: o.talk ?? 0, blink: o.blink ?? 0 }, t);
  const hand = SCO.kidHand(kd, o.reach ?? 1, 0);
  const h0 = SCO.kelpie(c, { X: o.hX ?? -0.75, Y: o.hY ?? -0.15, Z: o.hZ ?? 5.4, dir: 1, turn: o.turn ?? 1, nod: o.nod ?? 30, drip: 1, glint: o.glint ?? 1, water: 0 }, t);
  const dx = (o.snap ?? 0) * (hand.x - h0.nose.x), dy = (o.snap ?? 0) * (hand.y - h0.nose.y);
  const h = KP_(c, { X: o.hX ?? -0.75, Y: o.hY ?? -0.15, Z: o.hZ ?? 5.4, dir: 1, turn: o.turn ?? 1, nod: o.nod ?? 30, drip: 1, glint: o.glint ?? 1, water: 0 }, t);
  return { kd, hand, h, svg: (o.snap ? `<g transform="translate(${n(dx)},${n(dy)})">${h.svg}</g>` : h.svg), nose: { x: h.nose.x + dx, y: h.nose.y + dy }, dx, dy };
}
// the grandmother's candle jar (the fear meter) in screen space: x, y = jar base, k = px per cm-ish
function jar(x, y, k, flame, t, hand = true) {
  const fk = flame * (0.8 + 0.2 * Math.sin(t * 17) * Math.sin(t * 5.3));
  return `<g transform="translate(${n(x)},${n(y)}) scale(${k.toFixed(3)})">${hand ? `<path d="M-9,-2 Q-11,9 -7,14 L7,14 Q11,9 9,-2 Z" fill="#e6bf9e" stroke="#16101c" stroke-width="0.8"/><path d="M-9,3 Q0,7 9,3" stroke="#c2906e" stroke-width="0.8" fill="none"/>` : ""}
    <path d="M-9,-16 Q-10,-3 -8,0 L8,0 Q10,-3 9,-16 Z" fill="#cfe6ff" opacity="0.4" stroke="#e9f3ff" stroke-width="0.9"/><path d="M-9.4,-18 L9.4,-18 L9,-15 L-9,-15 Z" fill="#3a2a2a"/><path d="M-1.6,0 L1.6,0 L1.6,-7 L-1.6,-7 Z" fill="#fff4e0"/>
    ${fk > 0.03 ? `<ellipse cx="0" cy="${n(-9 - 4 * fk)}" rx="${n(9 * fk)}" ry="${n(12 * fk)}" fill="#ffb450" opacity="0.28" style="mix-blend-mode:screen"/><path d="M0,${n(-7 - 9 * fk)} Q${n(3 * fk)},${n(-8 - 2 * fk)} 0,-7 Q${n(-3 * fk)},${n(-8 - 2 * fk)} 0,${n(-7 - 9 * fk)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/>` : ""}</g>`;
}
const dark = (a) => `<rect width="${W}" height="${H}" fill="#02030a" opacity="${n(a)}"/>`;
// a water surface drawn over a figure: top edge y(x), body tinted, for "water at his chest"
function waterOver(y, t, a = 0.78) {
  let d = `M-20,${H + 20} L-20,${n(y)}`; for (let x = -20; x <= W + 40; x += 60) d += ` L${x},${n(y + Math.sin(x * 0.02 + t * 2.1) * 7 + Math.sin(x * 0.051 + t * 3.3) * 3)}`;
  d += ` L${W + 40},${H + 20} Z`;
  return `<path d="${d}" fill="#0b2a4a" opacity="${a}"/><path d="${d}" fill="none" stroke="#9fc6ea" stroke-width="3" opacity="0.5"/>`;
}

// the kid floating, bell hand on a screen point (underwater reach); the face circle follows the transform
function swimKid(c, pt, u, shock = 0.6, rot = -28, o = {}) {
  const kd = L.kid(c, { X: o.X ?? 1.0, Z: o.Z ?? 5.4, fx: -0.8, reachL: 1, shock, worry: 1, blink: 0, talk: o.talk ?? 0 }, u), hand = SCO.kidHand(kd, 1, 0);
  const tx = pt.x - hand.x, ty = pt.y - hand.y, a = rot * Math.PI / 180, fx0 = kd.p.x - 0.02 * kd.p.s * 0.8, fy0 = kd.p.y - 1.1 * kd.p.s, dx = fx0 - hand.x, dy = fy0 - hand.y;
  face(hand.x + dx * Math.cos(a) - dy * Math.sin(a) + tx, hand.y + dx * Math.sin(a) + dy * Math.cos(a) + ty, 0.17 * kd.p.s);
  let extra = "";
  if (o.free) { const q = { x: o.free.x - hand.x - tx, y: o.free.y - hand.y - ty }, ca = Math.cos(-a), sa = Math.sin(-a), to = { x: hand.x + q.x * ca - q.y * sa, y: hand.y + q.x * sa + q.y * ca };
    extra = freeArm(kd, to) + (o.bridle ? SCO.bridleLoose(to.x, to.y + 4, kd.p.s / 100 * 1.1, { rot: 8 }, u) : ""); }
  return `<g transform="translate(${n(tx)},${n(ty)}) rotate(${rot} ${n(hand.x)} ${n(hand.y)})">${kd.svg}${extra}</g>`;
}
const HK = (h) => (h && h.p ? `<ellipse cx="${n(h.p.x)}" cy="${n(h.p.y - 0.8 * h.p.s)}" rx="${n(1.25 * h.p.s)}" ry="${n(0.6 * h.p.s)}" fill="#a8c8ea" opacity="0.26" filter="url(#gb)" style="mix-blend-mode:screen"/>` : "");   // pale haze behind the black coat
const freeRest = (kd) => L.toScreen(kd.p, 0, 17.5 * 0.8, (-75 + 20.3) * 0.8);
// the kid's free (right) arm from his shoulder to a screen point (in the kid's own screen space)
function freeArm(kd, to) {
  const k = kd.p.s, sh = L.toScreen(kd.p, 0, 12.5 * 0.8, (-120 + 20.3) * 0.8), mid = { x: (sh.x + to.x) / 2 + 0.05 * k, y: (sh.y + to.y) / 2 + 0.06 * k };
  const d = `M${n(sh.x)},${n(sh.y)} Q${n(mid.x)},${n(mid.y)} ${n(to.x)},${n(to.y)}`;
  return `<path d="${d}" stroke="#16101c" stroke-width="${n(0.115 * k)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#bd2f50" stroke-width="${n(0.095 * k)}" fill="none" stroke-linecap="round"/><circle cx="${n(to.x)}" cy="${n(to.y)}" r="${n(0.045 * k)}" fill="#f3cdb0" stroke="#16101c" stroke-width="2"/>`;
}
// kid at the kelpie's nose (kelpie screen-left, kid right), the loch surface drawn in front of both at world height W (m)
function wading(c, u, o = {}) {
  const ox = o.ox ?? 0, W_ = o.W ?? 0, kX = (o.kX ?? 1.25) + ox, kZ = o.kZ ?? 4.9, rc = o.reach ?? 1;
  const kd = K_(c, { X: kX, Z: kZ, fx: -0.8, reachL: rc, shock: o.shock ?? 0.6, worry: o.worry ?? 0.8, talk: o.talk ?? 0, blink: o.blink ?? 0, lean: o.lean ?? 0, hop: o.hop ?? 0, run: o.run ?? null }, u);
  const hand = SCO.kidHand(kd, rc, o.lean ?? 0); hand.y -= (o.hop ?? 0) * kd.p.s / 100;
  const hp = { X: (o.hX ?? kX - 2.0 - ox) + ox, Y: o.hY ?? -0.15, Z: o.hZ ?? 5.3, dir: 1, turn: o.turn ?? 1, nod: o.nod ?? 30, drip: 1, water: W_, kneel: o.kneel ?? 0, len: o.len ?? 1, walk: o.walk ?? null, bridle: o.bridle ?? 1, obey: o.obey ?? 0 };
  const h0 = SCO.kelpie(c, hp, u), snap = o.snap ?? 1;
  const dx = snap ? hand.x - h0.nose.x : 0, dy = snap ? hand.y - h0.nose.y : 0;
  if (h0.eye && h0.p) { face(h0.eye.x + dx, h0.eye.y + dy, 0.09 * h0.p.s + 18); face(h0.nose.x + dx, h0.nose.y + dy, 0.1 * h0.p.s + 20); }
  const rd = o.ridersFn ? o.ridersFn(h0) : o.riders ? riders(c, h0, 3, { stuck: 1, grin: 0, shock: 0.8, talk: 0.6 }, u) : "";
  const wy = L.P(c, kX, W_, kZ).y;
  return { kd, hand, h: h0, svg: `<g transform="translate(${n(dx)},${n(dy)})">${HK(h0)}${h0.svg}${rd}</g>` + kd.svg + (W_ > 0 ? waterOver(wy, u, o.wa ?? 0.55) : "") };
}

// ---------------------------------------------------------------- the shots
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });
const LN = (id) => LINE[id], WD = (id, w, k = 0) => LINE[id].at + wordAt(LINE[id], w, k);
const SKY = { moon: [820, 330, 62], haze: [500, 1250, 420] };

// 1  L01 frame 0: the kelpie kneels in the shallows, moon on its coat, pale eye bright; slow push-in
shot("1", "L01", () => 0, (u) => {
  SCO.mood(0); const c = { x: -0.25, y: 1.15, z: lerp(2.3, 3.1, u / 3.2), h0: 1100 }, s = SCO.loch(c, u, SKY);
  const h = KP_(c, { ...LO.horse, Y: -0.06, kneel: tr([[0, 0.7], [2.4, 1]], u), turn: 0, water: 0, glint: 1, nod: 8 * tr([[0, 0], [2.4, 1]], u) }, u);
  return END(s.back + HK(h) + h.svg + s.front);
});
// 5a L04 wide shore: three village kids at the water, the kelpie standing in the shallows; slow pan
shot("5a", "L04", () => LN("L04").at - 0.05, (u) => {
  SCO.mood(0); const c = { ...LO.cam.wide, x: lerp(-0.45, 0.45, u / 5) }, s = SCO.loch(c, u, { moon: [820, 330, 62], haze: [720, 1130, 260] });
  const h = KP_(c, { ...LO.horse, X: 0.9, water: 0, turn: 1, kneel: 0 }, u);
  return END(s.back + HK(h) + h.svg + LO.kids.map((q, i) => VL_(c, { ...q, fx: 0.7, grin: i === 0 ? 1 : 0, hands: i === 2 ? 1 : 0, shock: i === 2 ? 0.6 : 0, blink: bl(u, i * 0.4) }, u).svg).join("") + s.front);
});
// 5b "Three kids from the village": the three at the water, closer
shot("5b", "L04", () => WD("L04", "eleven") - 0.05, (u) => {
  SCO.mood(0); const c = { x: -1.1, y: 1.05, z: lerp(2.0, 2.5, u / 4), h0: 1100 }, s = SCO.loch(c, u, { moon: [840, 330, 60], haze: [760, 1100, 300] });
  const h = KP_(c, { ...LO.horse, X: 2.6, water: 0, turn: 1 }, u);
  return END(s.back + HK(h) + h.svg + LO.kids.map((q, i) => VL_(c, { ...q, fx: 0.7, grin: i === 0 ? 1 : 0, hands: i === 2 ? 0.8 : 0, blink: bl(u, i * 0.4) }, u).svg).join("") + s.front);
});
// 5c "found it waiting in the water": the kelpie's head turns to the kids, eye glints
shot("5c", "L04", () => WD("L04", "found") - 0.05, (u) => {
  SCO.mood(0); const c = { x: -0.1, y: 1.15, z: lerp(2.5, 3.2, u / 3), h0: 1100 }, s = SCO.loch(c, u, SKY);
  const h = KP_(c, { ...LO.horse, X: -0.2, Y: -0.15, water: 0, turn: tr([[0, 0.3], [1.5, 1]], u), kneel: 0.3, glint: 1 }, u);
  return END(s.back + HK(h) + h.svg + s.front);
});
// 2  L02 close kid, looking at his own finger
shot("2", "L02", () => LN("L02").at - 0.05, (u, x) => {
  SCO.mood(0); const c = { x: 1.3, y: 0.95, z: lerp(2.9, 3.3, u / 2.5), h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kd = K_(c, { X: 1.45, Z: 4.6, fx: -0.2, reachL: 0.5, worry: 0.8, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  return END(s.back + kd.svg + s.front);
});
// 3  L03 close kelpie eye glint; the candle jar in Grandma's hand at the frame edge, the flame dips
shot("3", "L03", () => LN("L03").at - 0.05, (u) => {
  SCO.mood(0); const c = { x: 0.25, y: 1.0, z: lerp(4.0, 4.5, u / 2.5), h0: 1000 }, s = SCO.loch(c, u, { moon: [800, 300, 70], haze: [500, 1100, 400], props: false });
  const h = KP_(c, { X: -0.55, Y: -0.15, Z: 6.4, turn: 1, nod: 10, water: 0, glint: 1, reflect: false }, u);
  const sleeve = `<path d="M1000,2020 L930,1760" stroke="#16101c" stroke-width="120" stroke-linecap="round"/><path d="M1000,2020 L930,1760" stroke="#2b2f6b" stroke-width="108" stroke-linecap="round"/>`;
  return END(s.back + HK(h) + h.svg + s.front) + sleeve + jar(930, 1700, 4.6, tr([[0, 1], [0.8, 1], [1.1, 0.35], [1.6, 0.7], [2.5, 0.9]], u), u);
});
// 6  L05 villager 0 grinning, MED, pointing at the horse (an arm drawn over the rig's own arms)
shot("6", "L05", () => LN("L05").at - 0.05, (u, x) => {
  SCO.mood(0); const c = { x: -1.9, y: 1.0, z: lerp(2.3, 2.7, u / 2), h0: 1000 }, s = SCO.loch(c, u, { moon: [820, 330, 62], haze: [700, 1100, 300], props: false });
  const v = VL_(c, { ...LO.kids[0], X: -1.9, Z: 4.3, fx: 0.8, grin: 1, hands: 0, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.5), lean: -3 }, u), q = v.p, k = q.s;
  const sx = q.x + 0.1 * k, sy = q.y - 0.86 * k, hx = q.x + (0.5 + 0.03 * Math.sin(u * 6)) * k, hy = q.y - 0.97 * k;
  const arm = `<path d="M${n(sx)},${n(sy)} L${n(hx)},${n(hy)}" stroke="#16101c" stroke-width="${n(0.15 * k)}" stroke-linecap="round"/><path d="M${n(sx)},${n(sy)} L${n(hx)},${n(hy)}" stroke="#7a5a34" stroke-width="${n(0.125 * k)}" stroke-linecap="round"/><circle cx="${n(hx)}" cy="${n(hy)}" r="${n(0.055 * k)}" fill="#f0c8a4" stroke="#16101c" stroke-width="2"/><path d="M${n(hx)},${n(hy)} L${n(hx + 0.12 * k)},${n(hy - 0.01 * k)}" stroke="#f0c8a4" stroke-width="${n(0.04 * k)}" stroke-linecap="round"/>`;
  return END(s.back + v.svg + arm + s.front);
});
// 7  L06 the kelpie kneels EMPTY, then the kids climb on one by one (each lands with a small stretch of the back)
const CLIMB = (cnt) => (u) => {
  SCO.mood(0); const c = { x: -0.8, y: 1.15, z: 3.0, h0: 1090 }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const a = ease(clamp(u / 0.5));
  const h = KP_(c, { ...LO.horse, X: -0.75, len: Math.max(1, cnt - 1 + a), kneel: 1, water: 0, nod: 20, turn: 0 }, u);
  return END(s.back + HK(h) + h.svg + riders(c, h, cnt, { arrive: cnt ? { i: cnt - 1, a } : null }, u) + s.front);
};
shot("7z", "L06", () => LN("L06").at - 0.05, CLIMB(0));
shot("7a", "L06", () => WD("L06", "climbed") - 0.1, CLIMB(1));
shot("7b", "L06", () => WD("L06", "second") - 0.15, CLIMB(2));
shot("7c", "L06", () => WD("L06", "third") - 0.15, CLIMB(3));
// 8  L07 the back grows longer: camera and shoulder pinned, both ends of the horse in frame, the rump grows away from the riders
shot("8", "L07", () => LN("L07").at - 0.05, (u, x) => {
  SCO.mood(0.25); const c = { x: -0.8, y: 1.15, z: 3.0, h0: 1090 }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [540, 1130, 420] });
  const g = wordAt(x.ln, "grew") - 0.1, len = lerp(3, 4, ease(clamp((x.lu - g) / 1.5)));
  const h = KP_(c, { ...LO.horse, X: -0.75, len, water: 0, kneel: 1, nod: 20, turn: 0 }, u);
  return END(s.back + HK(h) + h.svg + riders(c, h, 3, { grin: 0.5 }, u) + s.front);
});
// 9  L08 our kid, close, hanging back; the long horse behind him
shot("9", "L08", () => LN("L08").at - 0.05, (u, x) => {
  SCO.mood(0.2); const c = { x: 0.9, y: 1.0, z: lerp(2.4, 2.8, u / 2), h0: 1000 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const h = KP_(c, { X: -1.5, Y: -0.15, Z: 6.6, len: 4, water: 0, turn: 0, kneel: 1, nod: 20 }, u);
  const kd = K_(c, { X: 1.1, Z: 4.2, fx: -0.6, lean: -3, shock: 0.4, worry: 0.9, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  return END(s.back + HK(h) + h.svg + riders(c, h, 3, { grin: 0 }, u) + kd.svg + s.front);
});
// 10 L09 Grandma close, whispering, a small candle jar in her hand, cold memory tint; then our kid's eyes open
const COLD = () => `<rect width="${W}" height="${H}" fill="#6f95d0" opacity="0.34" style="mix-blend-mode:color"/><rect width="${W}" height="${H}" fill="#0a1830" opacity="0.2"/>`;
const GRAN = (z0, z1) => (u, x) => {
  SCO.mood(0.05); const c = { x: 1.95, y: 1.2, z: lerp(z0, z1, clamp(u / 3)), h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kp = G_(c, { X: 1.9, Z: 5.2, fx: -0.6, stern: 0.3, flame: 0.4, talk: talkAt(x.ln, x.lu) * 0.7, blink: bl(u) }, u), fl = 0.7 + 0.3 * Math.sin(u * 9) * Math.sin(u * 3.1);
  return END(s.back + kp.svg + s.front) + jar(kp.p.x - 0.22 * kp.p.s, kp.p.y - 0.55 * kp.p.s, kp.p.s / 100 * 0.55, fl, u, true) + COLD();
};
shot("10a", "L09", () => LN("L09").at - 0.05, GRAN(3.3, 3.6));
shot("10b", "L09", () => WD("L09", "and") - 0.1, GRAN(3.8, 4.1));
shot("10c", "L09", () => WD("L09", "find") - 0.15, (u, x) => {
  SCO.mood(0.1); const c = { x: 1.3, y: 0.95, z: lerp(3.0, 3.3, clamp(u / 3)), h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kd = K_(c, { X: 1.45, Z: 4.6, fx: -0.2, worry: 0.9, blink: 1 - clamp(u / 0.5) }, u);
  return END(s.back + kd.svg + s.front);
});
// 11 L10 the kelpie turns its wet face to the kid, waits; slow push; the riders still on its back
const TWO = { x: 0.95, y: 1.1, z: 0.9, h0: 1100 };
shot("11", "L10", () => LN("L10").at - 0.05, (u) => {
  SCO.mood(0); const c = { ...TWO, x: lerp(0.55, 0.95, u / 4), z: lerp(0.5, 1.1, u / 4) }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0, len: 3, riders: true, snap: 0, hX: -0.5, hZ: 5.2, turn: tr([[0, 0.1], [1.2, 0.7]], u), nod: tr([[0, 0], [1.4, 22]], u), reach: 0, shock: 0.3, worry: 0.6, blink: bl(u) });
  return END(s.back + w.svg + s.front);
});
// 12a L11 the kid reaches, the nose lowers; a sliver of air between finger and nose
shot("12a", "L11", () => LN("L11").at - 0.05, (u, x) => {
  SCO.mood(0); const c = { ...TWO, z: 1.2 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0, len: 3, riders: true, snap: tr([[0, 0.5], [1.5, 0.82]], u), hX: -0.5, hZ: 5.2, nod: 28, reach: tr([[0, 0.3], [1.5, 1]], u), talk: talkAt(x.ln, x.lu), shock: 0.3, worry: 0.7, blink: bl(u) });
  return END(s.back + w.svg + s.front);
});
// 12b L12 "One finger. On its": the air closes
shot("12b", "L12", () => LN("L12").at - 0.05, (u) => {
  SCO.mood(0); const c = { ...TWO, z: lerp(1.2, 1.8, u / 2) }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0, len: 3, riders: true, snap: tr([[0, 0.8], [1.3, 0.9]], u), hX: -0.5, hZ: 5.2, nod: 28, reach: 1, shock: 0.3, worry: 0.7 });
  return END(s.back + w.svg + s.front);
});
// 13 L12 "nose": the contact close-up, the fingertip pressing in, then stuck for good
const FING = (pull, press = 0, land = 0.3) => (u, x) => {
  SCO.mood(0); const c = { x: 0.62, y: 0.95, z: 5.2, h0: 960 }, s = SCO.loch(c, u, { props: false, moon: [200, 300, 70], haze: [560, 900, 420] });
  const h = KP_(c, { X: -0.75, Y: -0.2, Z: 6.6, water: 0, nod: 48, reflect: false, drip: 1 }, u);
  const p = typeof pull === "function" ? pull(u, x) : pull, off = press ? 70 * (1 - ease(clamp((u - (land - 0.28)) / 0.28))) : 0;
  face(h.nose.x, h.nose.y, 150);
  return END(s.back + HK(h) + h.svg + `<g transform="translate(${n(off)},${n(-off * 0.3)})">${SCO.stuckFinger(h.nose.x, h.nose.y, 1300 / 1.4 / 100, { pull: p }, u)}</g>`);
};
shot("13a", "L12", () => WD("L12", "on") - 0.05, FING(0.05, 1, WD("L12", "nose") - WD("L12", "on") + 0.05));
shot("13b", "L13", () => LN("L13").at - 0.05, FING((u) => clamp(u / 1.0) * 0.95));
// 13c L13 second "sticky!": the tight two-shot, the kid peeling, the finger still on the nose
shot("13c", "L13", () => WD("L13", "it's", 1) - 0.05, (u, x) => {
  SCO.mood(0); const c = { ...TWO, z: 1.7 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0, len: 3, riders: true, snap: 1, hX: -0.5, hZ: 5.2, nod: 28, reach: 1, lean: 8 + Math.sin(u * 22) * 2, shock: 1, worry: 1, talk: talkAt(x.ln, x.lu) });
  return END(s.back + w.svg + s.front);
});
// 14 L14 the kid tests the bond (close), then all three riders revealed on "kelpie" (pull-out)
shot("14a", "L14", () => LN("L14").at - 0.05, (u) => {
  SCO.mood(0.2); const c = { ...TWO, z: 1.8 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0, len: 3, riders: true, snap: 1, hX: -0.5, hZ: 5.2, nod: 28, reach: 1, lean: 12 * Math.sin(u * 3), shock: 0.9, worry: 1, blink: bl(u) });
  return END(s.back + w.svg + s.front);
});
shot("14b", "L14", () => WD("L14", "kelpie") - 0.2, (u) => {
  SCO.mood(0.3); const c = { x: -0.2, y: 1.15, z: lerp(0.4, -0.5, u / 3), h0: 1090 }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const w = wading(c, u, { kX: 1.3, W: 0.03, len: 3, riders: true, snap: 1, nod: 28, reach: 1, lean: 6, shock: 0.8, worry: 1 });
  return END(s.back + w.svg + s.front);
});
// 15 L15 villager 1 screaming, hands stuck; closer
shot("15", "L15", () => LN("L15").at - 0.05, (u, x) => {
  SCO.mood(0.3); const c = { x: -0.5, y: 1.15, z: 2.4, h0: 1060 }, s = SCO.loch(c, u, { moon: [820, 320, 62], haze: [500, 1150, 400] });
  const h = KP_(c, { ...LO.horse, X: -0.55, len: 3, water: 0, kneel: 0, nod: 0 }, u);
  const rs = [2, 1, 0].map((i) => VL_(c, { ...h.seats[i], kind: KINDS[i], sit: 1, fx: i === 1 ? 0.4 : 0.7, stuck: 1, shock: i === 1 ? 1 : 0.6, talk: i === 1 ? talkAt(x.ln, x.lu) : 0, blink: 0 }, u).svg).join("");
  return END(s.back + HK(h) + h.svg + rs + s.front);
});
// 16 L16 the muzzle turns, the arm goes taut; then the tracking wide: one step into deeper water, the kid stumbles after it
const WC = (ox, z = -0.3) => ({ x: 0.1 + ox, y: 1.2, z, h0: 1090 });
shot("16a", "L16", () => LN("L16").at - 0.05, (u, x) => {
  SCO.mood(0.3); const c = { ...TWO, z: 1.7 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { kX: 1.6, kZ: 4.3, W: 0.1, len: 3, riders: true, snap: 1, hX: -0.5, hZ: 5.2, nod: 28, reach: 1, turn: lerp(1, 0.4, ease(clamp(u / 0.8))), lean: lerp(4, 16, ease(clamp(u / 1.0))), shock: 1, worry: 1 });
  return END(s.back + w.svg + s.front);
});
shot("16b", "L16", () => WD("L16", "walked") - 0.2, (u, x) => {
  SCO.mood(0.3); const ox = 0.35 * u, c = WC(ox), s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const w = wading(c, u, { ox, kX: 1.3, W: lerp(0.1, 0.4, clamp(u / 2.0)), len: 3, riders: true, walk: (u * 0.5) % 1, run: (u * 1.3) % 1, lean: 12 + 3 * Math.sin(u * 9), shock: 1, worry: 1, turn: 0.5 });
  return END(s.back + w.svg + s.front);
});
// 17 L17 close kid, the water at his waist (entry depth), the nose at his finger
shot("17", "L17", () => LN("L17").at - 0.05, (u, x) => {
  SCO.mood(0.45); const c = { x: 1.1, y: 1.0, z: 3.0, h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const w = wading(c, u, { kX: 1.5, kZ: 4.6, hZ: 5.0, W: 0.25, talk: talkAt(x.ln, x.lu), lean: Math.sin(u * 7) * 2, shock: 1, worry: 1, wa: 0.85 });
  return END(s.back + w.svg + s.front);
});
// 18 L18 knees -> chest (above water through the start of the scream) -> the dive on the splash
const WADE = (w0, w1, dur) => (u, x) => {
  SCO.mood(0.4); const c = WC(0.9 + 0.08 * u, 0.0), s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const w = wading(c, u, { ox: 0.9 + 0.08 * u, kX: 1.3, W: lerp(w0, w1, ease(clamp(u / dur))), len: 3, riders: true, walk: (u * 0.45) % 1, run: (u * 1.2) % 1, lean: 10, shock: 1, worry: 1, talk: 0.6, wa: 0.85, turn: 0.5 });
  return END(s.back + w.svg + s.front);
};
shot("18a", "L18", () => LN("L18").at - 0.05, WADE(0.36, 0.45, 2.0));
shot("18b", "L18", () => WD("L18", "to", 1) - 0.05, WADE(0.55, 0.9, 1.4));
shot("18c", "L18", () => WD("L18", "screamed") - 0.15, (u, x) => {
  SCO.mood(1); const c = { x: -0.45, y: 2.2, z: -0.5, h0: 1000 }, s = SCO.under(c, u, { depth: 0.35 });
  const h = KP_(c, { ...SCO.UNDER.horse, pitch: 14, float: 1, walk: (u * 0.4) % 1, len: 3, shadow: false }, u);
  const kd = L.kid(c, { X: 1.0, Z: 5.4, fx: -0.8, reachL: 1, shock: 1 }, u), hand = SCO.kidHand(kd, 1, 0), dx = h.nose.x - hand.x, dy = h.nose.y - hand.y;
  face(h.nose.x + 60, h.nose.y + 60, 90);
  const sp = clamp(1 - u / 0.35);
  return END(s.back + HK(h) + h.svg + riders(c, h, 3, { stuck: 1, grin: 0, shock: 1, talk: 1 }, u) + `<g transform="translate(${n(dx)},${n(dy)}) rotate(30 ${n(hand.x)} ${n(hand.y)})">${kd.svg}</g>` + SCO.bubbles(h.nose.x + 60, h.nose.y - 40, u, 10, 3, 90) + s.front) + (sp > 0 ? `<rect width="${W}" height="${H}" fill="#e6fff4" opacity="${n(sp * 0.7)}"/>` : "");
});
// 19 L19 UNDER: the FREE hand slips under the mane, finds the braid, the silver ring (catchlight); the stuck hand stays on the nose
const RINGS = (z0, z1, tg, gl0, bx, tg2 = tg, dur = 1.8) => (u, x) => {
  SCO.mood(1); const c = { x: 0.15 + bx, y: 2.0, z: lerp(z0, z1, clamp(u / 3)), h0: 1000 }, s = SCO.under(c, u, { depth: 0.5 });
  const h = KP_(c, { ...SCO.UNDER.horse, pitch: 10, float: 1, size: 1, len: 1.2, shadow: false }, u);
  const gl = gl0 * (0.8 + 0.2 * Math.sin(u * 5)), q = ease(clamp(u / dur)), tgt = { x: h.ring.x + lerp(tg[0], tg2[0], q), y: h.ring.y + lerp(tg[1], tg2[1], q) };
  face(h.ring.x, h.ring.y, 170);
  const hand = swimKid(c, h.nose, u, 0.8, -28, { free: tgt });
  const glint = `<g opacity="${n(gl)}" style="mix-blend-mode:screen"><circle cx="${n(h.ring.x)}" cy="${n(h.ring.y)}" r="${n(30 + 20 * gl)}" fill="#e8f4ff" opacity="0.5"/><path d="M${n(h.ring.x - 50)},${n(h.ring.y)} H${n(h.ring.x + 50)} M${n(h.ring.x)},${n(h.ring.y - 50)} V${n(h.ring.y + 50)}" stroke="#fff" stroke-width="4"/></g>`;
  return END(s.back + HK(h) + h.svg + hand + glint + SCO.bubbles(h.nose.x, h.nose.y - 100, u, 8, 5, 120) + s.front);
};
shot("19a", "L19", () => LN("L19").at - 0.05, RINGS(2.0, 2.4, [-70, -190], 0, 0, [-60, -110], 2.4));
shot("19b", "L19", () => WD("L19", "cold") - 0.1, RINGS(2.8, 3.3, [-55, -100], 0.4, 0, [-25, -40], 2.0));
shot("19c", "L19", () => WD("L19", "little") - 0.1, RINGS(3.3, 3.8, [-25, -40], 1, 0, [0, 0], 0.5));
// 20 L20 close kid underwater, floating, whisper (nose out of frame left, his stuck arm reaching it)
shot("20", "L20", () => LN("L20").at - 0.05, (u, x) => {
  SCO.mood(1); const c = { x: 1.3, y: 1.0, z: 3.2, h0: 1000 }, s = SCO.under(c, u, { depth: 0.55 });
  const kd = L.kid(c, { X: 1.45, Z: 5.2, fx: -0.4, reachL: 1, worry: 0.9, shock: 0.5, talk: talkAt(x.ln, x.lu) * 0.6, blink: bl(u + 1) }, u);
  const T = [-40 + Math.sin(u * 2) * 8, -320 + Math.sin(u * 1.4) * 10], a = -16 * Math.PI / 180, cx0 = 540, cy0 = 1250, fx0 = kd.p.x - 0.02 * kd.p.s, fy0 = kd.p.y - 1.1 * kd.p.s, dx = fx0 - cx0, dy = fy0 - cy0;
  face(cx0 + dx * Math.cos(a) - dy * Math.sin(a) + T[0], cy0 + dx * Math.sin(a) + dy * Math.cos(a) + T[1], 0.36 * kd.p.s);
  return END(s.back + `<g transform="translate(${n(T[0])},${n(T[1])}) rotate(-16 ${cx0} ${cy0})">${kd.svg}</g>` + SCO.bubbles(900, 1200, u, 9, 7, 80) + s.front);
});
// 21 L21 He pulled. (underwater, the free hand drags the braid taut) Hard. (the braid snaps clear in his free hand)
shot("21a", "L21", () => LN("L21").at - 0.05, (u, x) => {
  SCO.mood(1); const c = { x: 0.15, y: 2.0, z: 2.8, h0: 1000 }, s = SCO.under(c, u, { depth: 0.5 });
  const pull = clamp(u / 0.9), h = KP_(c, { ...SCO.UNDER.horse, pitch: 10, float: 1, len: 1.2, shadow: false }, u);
  face(h.ring.x, h.ring.y, 120);
  const tgt = { x: h.ring.x - 30 * pull, y: h.ring.y - 40 * pull };
  return END(s.back + HK(h) + `<g transform="translate(${n(Math.sin(u * 40) * 3 * pull)},${n(Math.sin(u * 33) * 2 * pull)})">${h.svg}${swimKid(c, h.nose, u, 1, -28, { free: tgt })}</g>` + SCO.bubbles(h.nose.x, h.nose.y - 100, u, 8, 5, 120) + s.front);
});
shot("21b", "L21", () => WD("L21", "hard") - 0.03, (u, x) => {
  SCO.mood(1); const c = { x: 0.15, y: 2.0, z: 2.8, h0: 1000 }, s = SCO.under(c, u, { depth: 0.5 });
  const h = KP_(c, { ...SCO.UNDER.horse, pitch: 10, float: 1, len: 1.2, shadow: false, bridle: 0 }, u);
  face(h.ring.x, h.ring.y, 120);
  const tgt = { x: h.ring.x - 60 - 90 * ease(clamp((u - 0.12) / 0.1)) + 20 * ease(clamp((u - 0.22) / 0.2)), y: h.ring.y - 50 - 30 * ease(clamp((u - 0.12) / 0.1)) };
  return END(s.back + HK(h) + h.svg + swimKid(c, h.nose, u, 1, -28, { free: tgt, bridle: true }) + SCO.bubbles(h.nose.x, h.nose.y - 100, u, 12, 6, 140) + s.front);
});
// 22 L22 he bursts up at the surface, bridle in his free hand, finger still on the nose; the kelpie freezes, then kneels for him
const CS = { x: 0.45, y: 1.15, z: 0.5, h0: 1100 };
const spray = (hand, u) => { let sp = ""; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.35, r = 30 + 160 * clamp(u * 2.2) * (0.6 + 0.4 * ((i * 37) % 5) / 5); sp += `<circle cx="${n(hand.x + Math.cos(a) * r)}" cy="${n(hand.y + 40 + Math.sin(a) * r)}" r="${n(7 - 4 * clamp(u * 1.5))}" fill="#cfe6ff" opacity="${n(0.8 * (1 - clamp(u * 1.4)))}"/>`; } return sp; };
const FREE = (w, u, k = 1.25) => { const fr = freeRest(w.kd); return SCO.bridleLoose(fr.x, fr.y + 6, w.kd.p.s / 100 * k, { rot: 8 }, u); };
shot("22a", "L22", () => LN("L22").at - 0.05, (u) => {
  SCO.mood(tr([[0, 0.6], [0.7, 0.2]], u)); const c = { x: 0.6, y: 1.15, z: lerp(0.6, 1.2, u / 2), h0: 1100 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const hop = 30 * (1 - ease(clamp(u / 0.7))), w = wading(c, u, { hY: lerp(-0.95, -0.15, ease(clamp(u / 0.8))), kX: 1.5, kZ: 4.3, W: u < 0.8 ? lerp(1.3, 0.7, ease(clamp(u / 0.8))) : 0.7 - 0.2 * ease(clamp((u - 0.8) / 1.0)), len: 3, riders: true, bridle: 0, snap: 1, hX: -0.5, hZ: 5.2, nod: 14, reach: 1, hop, lean: 6, shock: 0.6, worry: 0.3, obey: tr([[0, 0], [1, 0.3]], u), wa: 0.8 });
  return END(s.back + w.svg + FREE(w, u) + spray(w.hand, u) + s.front);
});
shot("22b", "L22", () => WD("L22", "then") - 0.05, (u) => {
  SCO.mood(0); const c = { x: 0.6, y: 1.15, z: lerp(1.2, 1.5, u / 2), h0: 1100 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const k = ease(clamp(u / 1.6)), w = wading(c, u, { kX: 1.5, kZ: 4.3, W: lerp(0.5, 0.3, k), len: 3, riders: true, bridle: 0, snap: 1, hX: -0.5, hZ: 5.2, nod: 14, reach: 1, kneel: k, obey: lerp(0.3, 1, k), shock: 0.2, worry: 0.2, blink: bl(u), wa: 0.8 });
  return END(s.back + w.svg + FREE(w, u) + s.front);
});
// 23 L23 the kids slide off into the shallows (each to its own spot), then the finger comes loose
const ENDS = [[0.5, 4.9], [-0.1, 4.6], [-0.7, 4.8]];
shot("23a", "L23", () => LN("L23").at - 0.05, (u) => {
  SCO.mood(0); const c = { x: 0.55, y: 1.15, z: 1.2, h0: 1100 }, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const sl = (h0) => [0, 1, 2].map((i) => { const a = ease(clamp((u - i * 0.3) / 0.9)), seat = h0.seats[i]; return VL_(c, { X: lerp(seat.X, ENDS[i][0], a), Y: lerp(seat.Y, -0.05, a), Z: lerp(seat.Z, ENDS[i][1], a), kind: KINDS[i], sit: a < 0.7 ? 1 : 0, fx: 0.7, grin: 0, shock: 0.3, blink: bl(u, i) }, u).svg; }).join("");
  const w = wading(c, u, { kX: 1.5, kZ: 4.3, W: 0.3, len: 3, bridle: 0, snap: tr([[0, 1], [1.6, 1]], u), hX: -0.5, hZ: 5.2, nod: 14, reach: 1, kneel: 1, obey: 1, shock: 0.4, worry: 0.2, wa: 0.6, ridersFn: sl });
  return END(s.back + w.svg + FREE(w, u) + s.front);
});
shot("23b", "L23", () => WD("L23", "finger") - 0.1, (u) => {
  SCO.mood(0); const c = { x: 0.62, y: 0.95, z: 5.2, h0: 960 }, s = SCO.loch(c, u, { props: false, moon: [200, 300, 70], haze: [560, 900, 420] });
  const h = KP_(c, { X: -0.75, Y: -0.2, Z: 6.6, water: 0.15, nod: 48, reflect: false, bridle: 0 }, u);
  const m = ease(clamp((u - 0.4) / 0.8)), fing = SCO.stuckFinger(h.nose.x, h.nose.y, 1300 / 1.4 / 100, { pull: 1 }, u);
  return END(s.back + HK(h) + h.svg + `<g transform="translate(${n(lerp(0, 160, m))},${n(lerp(0, -60, m))})">${fing}</g>`);
});
// 24 L24 he stands in the shallows holding the bridle in his free hand, the kelpie bowed; then he swings up and rides, the three kids safe on the shore
shot("24a", "L24", () => LN("L24").at - 0.05, (u, x) => {
  SCO.mood(0); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const sh = [0, 1, 2].map((i) => VL_(c, { X: ENDS[i][0], Y: -0.05, Z: ENDS[i][1], kind: KINDS[i], fx: -0.6, grin: 0, shock: 0, blink: bl(u, i) }, u).svg).join("");
  const w0 = 0, w = wading(c, u, { kX: 1.2, kZ: 4.3, W: 0.22, bridle: 0, snap: 0, reach: 0.4, kneel: 1, obey: 1, shock: 0, worry: 0, talk: talkAt(x.ln, x.lu), blink: bl(u), hX: -0.85, hZ: 5.3, nod: 8, wa: 0.5 });
  return END(s.back + sh + w.svg + FREE(w, u) + s.front);
});
shot("24b", "L24", () => WD("L24", "carry") - 0.1, (u) => {
  SCO.mood(0.2); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const k = ease(clamp(u / 0.9)), h = KP_(c, { X: -0.85, Y: -0.1, Z: 5.3, water: 0.15, bridle: 0, obey: 0.8, kneel: 1 - k, walk: u > 1.2 ? ((u - 1.2) * 0.4) % 1 : null }, u), r = SCO.hostRide(c, h.seats[0]);
  const a = ease(clamp((u - 0.1) / 0.8)), kc = { ...c, y: lerp(c.y, r.cam.y, a) }, kd = K_(kc, { X: lerp(1.2, r.X, a), Z: lerp(4.3, r.Z, a), fx: lerp(-0.8, 0.7, a), reachL: 0, grin: a, hop: Math.sin(a * Math.PI) * 20 }, u), fr = freeRest(kd);
  const sh = [0, 1, 2].map((i) => VL_(c, { X: ENDS[i][0], Y: -0.05, Z: ENDS[i][1], kind: KINDS[i], fx: -0.6, grin: 0.5, blink: bl(u, i) }, u).svg).join("");
  return END(s.back + HK(h) + sh + kd.svg + h.svg + SCO.riderLeg(c, h.seats[0]) + SCO.bridleLoose(fr.x, fr.y + 6, kd.p.s / 100 * 1.2, { rot: 8 }, u) + waterOver(L.P(c, 0, 0.12, 5.3).y, u, 0.4) + s.front);
});
// 25 L25 wide croft at midnight: the kid rides up (whole horse in frame), the bridle in his free hand, peat-fire light from the door
shot("25", "L25", () => LN("L25").at - 0.05, (u) => {
  SCO.mood(2); const c = CR.cam.wide, s = SCO.croft(c, u, { open: 1 });
  const hx = lerp(-0.9, CR.horse.X + 0.3, ease(clamp(u / 2.8)));
  const h = KP_(c, { ...CR.horse, X: hx, bridle: 0, obey: 0.6, walk: (u * 0.5) % 1 }, u), r = SCO.hostRide(c, h.seats[0]);
  const kd = K_(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 0, grin: 1 }, u), fr = freeRest(kd);
  return END(s.back + kd.svg + h.svg + SCO.riderLeg(c, h.seats[0]) + SCO.bridleLoose(fr.x, fr.y + 6, kd.p.s / 100 * 1.2, { rot: 8 }, u) + s.front);
});
// 26 L26 MED Grandma in the doorway, furious, candle jar
shot("26", "L26", () => LN("L26").at - 0.05, (u, x) => {
  SCO.mood(2); const c = { ...CR.cam.door, z: 4.4 }, s = SCO.croft(c, u, { open: 1 });
  const kp = G_(c, { X: 1.0, Z: 6.6, fx: -0.6, stern: 1, flame: 1, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  return END(s.back + kp.svg + s.front);
});
// 27 L27 MED the kid on the kelpie, holding the bridle up, proud (whole horse in frame)
shot("27", "L27", () => LN("L27").at - 0.05, (u, x) => {
  SCO.mood(2); const c = { x: -0.2, y: 1.2, z: 2.2, h0: 1100 }, s = SCO.croft(c, u, { open: 1 });
  const h = KP_(c, { ...CR.horse, X: -0.2, bridle: 0, obey: 0.6 }, u), r = SCO.hostRide(c, h.seats[0]);
  const kd = K_(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 1, grin: 1, talk: talkAt(x.ln, x.lu) }, u), hand = SCO.kidHand(kd, 1, 0);
  return END(s.back + HK(h) + h.svg + kd.svg + SCO.riderLeg(c, h.seats[0]) + SCO.bridleLoose(hand.x, hand.y - 30, kd.p.s / 100 * 1.4, { rot: 8 }, u) + s.front);
});
// 28 L28 CLOSE on Grandma: her arm rises out of the indigo sleeve into the nine-finger hand (full hand + stump in frame), calm face beside it; hold through "too", hard cut
shot("28", "L28", () => LN("L28").at - 0.1, (u, x) => {
  SCO.mood(2); const c = { x: 0.6, y: 1.3, z: 5.3, h0: 1090 }, s = SCO.croft(c, u, { open: 1 });
  const kp = G_(c, { X: 0.8, Z: 6.6, fx: -0.5, stern: 0.05, flame: 0.3, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  const t0 = wordAt(x.ln, "said") - 0.2, rise = ease(clamp((x.lu - t0) / (wordAt(x.ln, "too") - t0 - 0.05)));
  const k = kp.p.s / 100, up = lerp(-75, 4, rise), out = 14, sh = L.toScreen(kp.p, 0, -14, -94), hand = L.toScreen(kp.p, 0, -34 - out, -118 - up), el = { x: lerp(sh.x, hand.x, 0.55) - 6 * k, y: sh.y + 10 * k };
  const kh = k * 1.9, rot = -8, th = rot * Math.PI / 180, ux = Math.sin(th), uy = -Math.cos(th), end = { x: hand.x + ux * 0.9 * kh, y: hand.y + uy * 0.9 * kh };
  const pts = [], wid = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, a0 = (1 - t) ** 2, a1 = 2 * (1 - t) * t, a2 = t * t; pts.push({ x: a0 * sh.x + a1 * el.x + a2 * end.x, y: a0 * sh.y + a1 * el.y + a2 * end.y }); wid.push(lerp(11 * k, 11.6 * kh, t ** 1.6)); }
  const side = (sg) => pts.map((q, i) => { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(14, i + 1)], dx = p1.x - p0.x, dy = p1.y - p0.y, l = Math.hypot(dx, dy) || 1; return `${n(q.x - sg * dy / l * wid[i] / 2)},${n(q.y + sg * dx / l * wid[i] / 2)}`; });
  const poly = "M" + side(1).join(" L") + " L" + side(-1).reverse().join(" L") + " Z";
  const arm = `<path d="${poly}" fill="#2b2f6b" stroke="#16101c" stroke-width="${n(1.2 * k)}" stroke-linejoin="round"/>`;
  return END(s.back + kp.svg + SCO.nineHand(hand.x, hand.y, kh, { warm: 0.7, rot, arm: 0 }) + arm + s.front);
});
// ---------------------------------------------------------------- the glimpse (re-hook): blurred 0.5 s of the ending, a small hand gripping the wet weed bridle
const GLIMPSES = [{ at: 1.2, frames: 15, blur: "gb2", dark: 0.25 }];
function glimpse(t, g) {
  const u = t - g.at, k = (u * FPS) / g.frames;
  SCO.mood(0); const c = LO.cam.two, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const kd = L.kid(c, { X: 1.15, Z: 4.2, fx: -0.8, reachL: 1, grin: 1 }, u), hand = SCO.kidHand(kd, 1, 0);
  const inner = s.back + kd.svg + SCO.bridleLoose(hand.x - 6, hand.y - 4, kd.p.s / 100 * 2.6, { rot: 8 }, u) + s.front + SCO.grade();
  return `<g filter="url(#${g.blur})">${inner}</g>${dark(g.dark + 0.2 * Math.sin(k * Math.PI))}`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) { const ln = LINE[s.line]; let a = s.off(); if (a < ln.at) a = Math.max(a, prevEnd(s.line)); s.at = Math.max(0, a); }
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
for (const s of SHOTS) if (s.end - s.at < 0.2) throw new Error("shot too short " + s.id + " " + s.at.toFixed(2) + "-" + s.end.toFixed(2));
export const TIMELINE = SHOTS;
export const GLIMPSE_AT = GLIMPSES;
const holdEnd = (i) => Math.min(i + 1 < ORDER.length ? LINE[ORDER[i + 1]].at - 0.02 : 1e9, LINE[ORDER[i]].end + 0.3);
const lineAtTime = (t) => { let k = null; ORDER.forEach((id, i) => { const ln = LINE[id]; if (t >= ln.at - 0.04 && t < holdEnd(i)) k = ln; }); return k; };

// ---------------------------------------------------------------- captions: upper third, centre ~540, off every face and the kelpie's eye
const CAPY = [540, 500, 580, 460, 620, 660, 700, 740, 780];
const OPT = { key: KEY, keyColor: "#ffc04a", maxFs: 74, width: 940, wrapAt: 19, reveal: true };
function capBox(ph, y) {
  const ws = ph.ws.map((q) => q[0]), len = (a) => a.join(" ").length;
  let k = ws.length;
  if (len(ws) > OPT.wrapAt && ws.length > 1) { let best = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(len(ws.slice(0, i)) - len(ws.slice(i))); if (d < best) { best = d; k = i; } } }
  const rows = k < ws.length ? [ws.slice(0, k), ws.slice(k)] : [ws], mx = Math.max(...rows.map(len)), fs = Math.min(OPT.maxFs, Math.round(OPT.width / Math.max(1, mx * 0.6)));
  const w = mx * fs * 0.6 + 24, h = rows.length * fs * 1.08 + 12;
  return { x0: 540 - w / 2, x1: 540 + w / 2, y0: y - h / 2, y1: y + h / 2 };
}
const hit = (b, f) => { const dx = Math.max(b.x0 - f.x, 0, f.x - b.x1), dy = Math.max(b.y0 - f.y, 0, f.y - b.y1); return dx * dx + dy * dy < (f.r + 14) ** 2; };
const facesAt = (t) => { FACES = []; bodyAt(t); const f = FACES; FACES = []; return f; };
const CAPCACHE = new Map();
function capY(ln, pi, ph) {
  const key = ln.id + ":" + pi;
  if (CAPCACHE.has(key)) return CAPCACHE.get(key);
  const t0 = ln.at + ph.at, t1 = pi + 1 < ln.phrases.length ? ln.at + ln.phrases[pi + 1].at : ln.end + 0.3;
  const fs = [t0 + 0.05, (t0 + t1) / 2, t1 - 0.08].map((t) => facesAt(Math.min(t, DUR - 0.01))).flat();
  let best = null, bs = 1e9;
  for (const y of CAPY) { const b = capBox(ph, y); if (titleCard && t0 < 2.75 && b.y0 < 514) continue; const bad = fs.filter((f) => hit(b, f)).length; if (!bad) { best = y; break; } if (bad < bs) { bs = bad; best = y; } }
  CAPCACHE.set(key, best); return best;
}
function captions(t) {
  const ln = lineAtTime(t); if (!ln) return "";
  const u = t - ln.at; let pi = -1; for (let i = 0; i < ln.phrases.length; i++) if (u >= ln.phrases[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  return captionSvg(ln.phrases, u, { ...OPT, y: capY(ln, pi, ln.phrases[pi]) });
}
export const SUBS = { on: true };
function shotAt(time) { let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q; return s; }
function bodyAt(time) {
  L.resetIds(); SCO.resetIds();
  const s = shotAt(time), ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  const g = GLIMPSES.find((q) => t >= q.at - 1e-6 && t < q.at + q.frames / FPS - 1e-6);
  if (g) { const inner = glimpse(t, g); return { body: inner, shot: s.id }; }
  return { body: s.fn(u, { ln, lu: t - ln.at, t }), shot: s.id };
}
export function parts(time) {
  FACES = [];
  const b = bodyAt(time), fcs = FACES.slice();
  const title = titleCard && time < 2.75 ? titleCard(time, { style: TITLE }) : "";
  const dbg = process.env.DEBUGFACES ? fcs.map((f) => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}" fill="none" stroke="#0f0" stroke-width="3"/>`).join("") : "";
  return { pic: frame(b.body) + title + dbg, cap: captions(time), shot: b.shot, faces: fcs };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
