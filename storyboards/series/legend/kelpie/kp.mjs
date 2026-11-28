// Legend: The Kelpie (Loch Sunart, Scotland), code-drawn ROUGH DRAFT 1 (shot list: SHOTS.md, lines: lines.json, music: Sol's answer.md).
//   node storyboards/series/legend/kelpie/kp-render.mjs <out-subs.mp4> <out-nosubs.mp4> [--from s --to s]   (both exports in one pass)
//   TITLE=<style> picks the opening banner when tools/svg2d/lib/legend-scotland-title.mjs exists (default style = its default);
//   TITLE=none or a missing lib = no banner. Only frames 0..~75 depend on it: see kp-head.sh.
// Voice-led like cw.mjs: every line starts when the previous line's last sound has ended (+ a gap); no voice is cut off.
import { readFileSync, existsSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as SCO from "../../../../tools/svg2d/lib/legend-scotland.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
export const TITLE = process.env.TITLE || "";
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
export const DUR = +(LINE.L28.at + LINE.L28.len + 0.4).toFixed(2);   // hard end: the last sound + 0.4 s
export const TL_LINES = ORDER.map((id) => LINE[id]);
const prevEnd = (id) => { const i = ORDER.indexOf(id); return i ? LINE[ORDER[i - 1]].end : 0; };

// ---------------------------------------------------------------- faces: every drawn face / kelpie eye registers a circle, captions keep clear of them
let FACES = [];
const face = (x, y, r) => { FACES.push({ x, y, r }); };
const K_ = (c, st, t) => { const kd = L.kid(c, st, t); if (kd.p) face(kd.p.x + (st.fx ?? -0.8) * 0.02 * kd.p.s, kd.p.y - 1.1 * kd.p.s, 0.17 * kd.p.s); return kd; };
const G_ = (c, st, t, sl) => { const g = L.keeper(c, st, t, sl); if (g.p) face(g.p.x + (st.fx ?? -0.7) * 0.02 * g.p.s, g.p.y - 1.3 * g.p.s, 0.2 * g.p.s); return g; };
const VL_ = (c, st, t) => { const v = SCO.villager(c, st, t); if (v.p) face(v.p.x, v.p.y - (st.sit ? 0.78 : 1.05) * v.p.s, 0.16 * v.p.s); return v; };
const KP_ = (c, st, t) => { const h = SCO.kelpie(c, st, t); if (h.eye && h.p) face(h.eye.x, h.eye.y, 0.09 * h.p.s * (st.size ?? 1) + 18); return h; };

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
    s += VL_(c, { ...h.seats[i], kind: KINDS[i], sit: 1, fx: 0.7, grin: o.grin ?? 1, stuck: o.stuck ?? 0, shock: o.shock ?? 0, talk: o.talk ?? 0, blink: bl(t, i * 0.3) }, t).svg;
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
  return `<g transform="translate(${n(x)},${n(y)}) scale(${k.toFixed(3)})">${hand ? `<path d="M-22,-4 Q-24,16 -18,34 L22,34 Q26,14 20,-6 Q10,-14 -22,-4 Z" fill="#e6bf9e" stroke="#16101c" stroke-width="1.2"/><path d="M-20,2 Q-8,8 14,4" stroke="#c2906e" stroke-width="1.4" fill="none"/>` : ""}
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
  return `<g transform="translate(${n(tx)},${n(ty)}) rotate(${rot} ${n(hand.x)} ${n(hand.y)})">${kd.svg}</g>`;
}
// kid at the kelpie's nose (kelpie screen-left, kid right), the loch surface drawn in front of both at world height W (m)
function wading(c, u, o = {}) {
  const ox = o.ox ?? 0, W_ = o.W ?? 0, kX = (o.kX ?? 1.25) + ox, kZ = o.kZ ?? 4.9, rc = o.reach ?? 1;
  const kd = K_(c, { X: kX, Z: kZ, fx: -0.8, reachL: rc, shock: o.shock ?? 0.6, worry: o.worry ?? 0.8, talk: o.talk ?? 0, blink: o.blink ?? 0, lean: o.lean ?? 0, hop: o.hop ?? 0, run: o.run ?? null }, u);
  const hand = SCO.kidHand(kd, rc, o.lean ?? 0); hand.y -= (o.hop ?? 0) * kd.p.s / 100;
  const hp = { X: (o.hX ?? kX - 2.0 - ox) + ox, Y: o.hY ?? -0.15, Z: o.hZ ?? 5.3, dir: 1, turn: 1, nod: o.nod ?? 30, drip: 1, water: W_, kneel: o.kneel ?? 0, len: o.len ?? 1, walk: o.walk ?? null, bridle: o.bridle ?? 1, obey: o.obey ?? 0 };
  const h0 = SCO.kelpie(c, hp, u), snap = o.snap ?? 1;
  const dx = snap ? hand.x - h0.nose.x : 0, dy = snap ? hand.y - h0.nose.y : 0;
  if (h0.eye && h0.p) face(h0.eye.x + dx, h0.eye.y + dy, 0.09 * h0.p.s + 18);
  const rd = o.riders ? riders(c, h0, 3, { stuck: 1, grin: 0, shock: 0.8, talk: 0.6 }, u) : "";
  const wy = L.P(c, kX, W_, kZ).y;
  return { kd, hand, h: h0, svg: `<g transform="translate(${n(dx)},${n(dy)})">${h0.svg}${rd}</g>` + kd.svg + (W_ > 0 ? waterOver(wy, u, o.wa ?? 0.55) : "") };
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
  return END(s.back + h.svg + s.front);
});
// 5a L04 wide shore: three village kids at the water, the kelpie standing in the shallows; slow pan
shot("5a", "L04", () => LN("L04").at - 0.05, (u) => {
  SCO.mood(0); const c = { ...LO.cam.wide, x: lerp(-0.45, 0.45, u / 5) }, s = SCO.loch(c, u, { moon: [820, 330, 62], haze: [720, 1130, 260] });
  const h = KP_(c, { ...LO.horse, X: 0.9, water: 0, turn: 1, kneel: 0 }, u);
  return END(s.back + h.svg + LO.kids.map((q, i) => VL_(c, { ...q, fx: 0.7, grin: i === 0 ? 1 : 0, hands: i === 2 ? 1 : 0, shock: i === 2 ? 0.6 : 0, blink: bl(u, i * 0.4) }, u).svg).join("") + s.front);
});
// 5b "Three kids from the village": the three at the water, closer
shot("5b", "L04", () => WD("L04", "three") - 0.05, (u) => {
  SCO.mood(0); const c = { x: -1.05, y: 1.1, z: lerp(1.2, 1.9, u / 3), h0: 1100 }, s = SCO.loch(c, u, { moon: [840, 330, 60], haze: [760, 1100, 300] });
  const h = KP_(c, { ...LO.horse, X: 0.8, water: 0, turn: 1 }, u);
  return END(s.back + h.svg + LO.kids.map((q, i) => VL_(c, { ...q, fx: 0.7, grin: i === 0 ? 1 : 0, hands: i === 2 ? 0.8 : 0, blink: bl(u, i * 0.4) }, u).svg).join("") + s.front);
});
// 5c "found it waiting in the water": the kelpie's head turns to the kids, eye glints
shot("5c", "L04", () => WD("L04", "found") - 0.05, (u) => {
  SCO.mood(0); const c = { x: -0.1, y: 1.15, z: lerp(2.5, 3.2, u / 3), h0: 1100 }, s = SCO.loch(c, u, SKY);
  const h = KP_(c, { ...LO.horse, X: -0.2, Y: -0.15, water: 0, turn: tr([[0, 0.3], [1.5, 1]], u), kneel: 0.3, glint: 1 }, u);
  return END(s.back + h.svg + s.front);
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
  return END(s.back + h.svg + s.front) + jar(1010, 1600, 5.5, tr([[0, 1], [0.8, 1], [1.1, 0.35], [1.6, 0.7], [2.5, 0.9]], u), u) ;
});
// 6  L05 villager 0 grinning, MED, pointing at the horse (an arm drawn over the rig's own arms)
shot("6", "L05", () => LN("L05").at - 0.05, (u, x) => {
  SCO.mood(0); const c = { x: -1.7, y: 1.0, z: lerp(2.0, 2.4, u / 2), h0: 1000 }, s = SCO.loch(c, u, { moon: [820, 330, 62], haze: [700, 1100, 300], props: false });
  const v = VL_(c, { ...LO.kids[0], X: -1.5, Z: 4.3, fx: 0.8, grin: 1, hands: 0, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.5), lean: -3 }, u), q = v.p, k = q.s;
  const sx = q.x + 0.1 * k, sy = q.y - 0.86 * k, hx = q.x + (0.62 + 0.04 * Math.sin(u * 6)) * k, hy = q.y - 0.99 * k;
  const arm = `<path d="M${n(sx)},${n(sy)} L${n(hx)},${n(hy)}" stroke="#16101c" stroke-width="${n(0.15 * k)}" stroke-linecap="round"/><path d="M${n(sx)},${n(sy)} L${n(hx)},${n(hy)}" stroke="#7a5a34" stroke-width="${n(0.125 * k)}" stroke-linecap="round"/><circle cx="${n(hx)}" cy="${n(hy)}" r="${n(0.055 * k)}" fill="#f0c8a4" stroke="#16101c" stroke-width="2"/><path d="M${n(hx)},${n(hy)} L${n(hx + 0.14 * k)},${n(hy - 0.01 * k)}" stroke="#f0c8a4" stroke-width="${n(0.04 * k)}" stroke-linecap="round"/>`;
  return END(s.back + v.svg + arm + s.front);
});
// 7  L06 the kelpie kneels, the kids climb on one by one (cuts on "second", "third")
const CLIMB = (cnt, tag) => (u) => {
  SCO.mood(0); const c = { x: -1.0, y: 1.15, z: 2.4, h0: 1090 }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const h = KP_(c, { ...LO.horse, X: -0.75, len: cnt, kneel: 1, water: 0, nod: 20, turn: 0 }, u);
  return END(s.back + h.svg + riders(c, h, cnt, {}, u) + s.front);
};
shot("7a", "L06", () => LN("L06").at - 0.05, CLIMB(1));
shot("7b", "L06", () => WD("L06", "second") - 0.15, CLIMB(2));
shot("7c", "L06", () => WD("L06", "third") - 0.15, CLIMB(3));
// 8  L07 side wide: the back stretches len 3 -> 4 while they sit; too long; slow push
shot("8", "L07", () => LN("L07").at - 0.05, (u, x) => {
  SCO.mood(0.25); const c = { x: -1.3, y: 1.2, z: lerp(1.4, 2.2, u / 4.5), h0: 1090 }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [540, 1130, 420] });
  const len = lerp(3, 4, ease(clamp((x.lu - 0.2) / 3.2)));
  const h = KP_(c, { ...LO.horse, X: -0.3, len, water: 0, kneel: 0 }, u);
  return END(s.back + h.svg + riders(c, h, 3, { stuck: 0.5 }, u) + s.front);
});
// 9  L08 MED our kid on the shore, hanging back
shot("9", "L08", () => LN("L08").at - 0.05, (u, x) => {
  SCO.mood(0.2); const c = LO.cam.two, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const h = KP_(c, { X: -1.7, Y: -0.15, Z: 7.2, len: 4, water: 0, turn: 0, size: 0.9 }, u);
  const kd = K_(c, { X: 1.4, Z: 4.0, fx: -0.6, lean: -3, shock: 0.4, worry: 0.9, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  return END(s.back + h.svg + kd.svg + s.front);
});
// 10 L09 Grandma close, whispering, a small candle jar in her hand, cold memory tint; then our kid's eyes open
const COLD = () => `<rect width="${W}" height="${H}" fill="#6f95d0" opacity="0.34" style="mix-blend-mode:color"/><rect width="${W}" height="${H}" fill="#0a1830" opacity="0.2"/>`;
const GRAN = (z0, z1) => (u, x) => {
  SCO.mood(0.05); const c = { x: 2.0, y: 1.2, z: lerp(z0, z1, clamp(u / 3)), h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kp = G_(c, { X: 2.4, Z: 5.2, fx: -0.6, stern: 0.3, flame: 0.4, talk: talkAt(x.ln, x.lu) * 0.7, blink: bl(u) }, u), fl = 0.7 + 0.3 * Math.sin(u * 9) * Math.sin(u * 3.1);
  return END(s.back + kp.svg + s.front) + jar(kp.p.x - 0.22 * kp.p.s, kp.p.y - 0.55 * kp.p.s, kp.p.s / 100 * 0.9, fl, u, true) + COLD();
};
shot("10a", "L09", () => LN("L09").at - 0.05, GRAN(2.8, 3.2));
shot("10b", "L09", () => WD("L09", "and") - 0.1, GRAN(3.3, 3.7));
shot("10c", "L09", () => WD("L09", "find") - 0.15, (u, x) => {
  SCO.mood(0.1); const c = { x: 1.3, y: 0.95, z: lerp(3.0, 3.3, clamp(u / 3)), h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kd = K_(c, { X: 1.45, Z: 4.6, fx: -0.2, worry: 0.9, blink: 1 - clamp(u / 0.5) }, u);
  return END(s.back + kd.svg + s.front);
});
// 11 L10 the kelpie turns its wet face to the kid, waits, drips
shot("11", "L10", () => LN("L10").at - 0.05, (u) => {
  SCO.mood(0); const c = LO.cam.two, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const h = KP_(c, { X: -0.75, Y: -0.1, Z: 5.2, water: 0, turn: tr([[0, 0], [1.2, 1]], u), nod: tr([[0, 0], [1.4, 24]], u), bridle: 1, drip: 1 }, u);
  const kd = K_(c, { X: 1.3, Z: 4.2, fx: -0.8, reachL: 0, shock: 0.3, worry: 0.6, blink: bl(u) }, u);
  return END(s.back + h.svg + kd.svg + s.front);
});
// 12a L11 "Just to be polite": the kid reaches, the nose lowers to him
shot("12a", "L11", () => LN("L11").at - 0.05, (u, x) => {
  SCO.mood(0); const c = LO.cam.two, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const r = reachPair(c, u, { kX: 1.0, hX: -0.9, reach: tr([[0, 0.2], [1.8, 0.9]], u), nod: 30, talk: talkAt(x.ln, x.lu), snap: 0, blink: bl(u) });
  return END(s.back + r.svg + r.kd.svg + s.front);
});
// 12b L12 "One finger." the hand closes in
shot("12b", "L12", () => LN("L12").at - 0.05, (u) => {
  SCO.mood(0); const c = { x: 0.6, y: 1.0, z: lerp(2.0, 2.8, u / 2), h0: 1050 }, s = SCO.loch(c, u, { moon: [240, 300, 58], props: false });
  const r = reachPair(c, u, { reach: 1, nod: 30, snap: 1, shock: 0.3, kX: 1.1, kZ: 4.2 });
  return END(s.back + r.svg + r.kd.svg + s.front);
});
// 13 L12 "On its nose": the close-up, finger on the nose
const FING = (pull, k0 = 0, shake = 0) => (u, x) => {
  SCO.mood(0); const c = { x: 0.62, y: 0.95, z: 5.2, h0: 960 }, s = SCO.loch(c, u, { props: false, moon: [200, 300, 70], haze: [560, 900, 420] });
  const h = KP_(c, { X: -0.75, Y: -0.2, Z: 6.6, water: 0, nod: 48, reflect: false, drip: 1 }, u);
  const p = typeof pull === "function" ? pull(u, x) : pull;
  return END(s.back + h.svg + SCO.stuckFinger(h.nose.x, h.nose.y, 1300 / 1.4 / 100, { pull: p }, u + 0));
};
shot("13a", "L12", () => WD("L12", "on") - 0.05, FING(0));
shot("13b", "L13", () => LN("L13").at - 0.05, FING((u) => clamp(u / 1.2) * 0.95));
// 13c L13 second "sticky!": the kid's face, panic
shot("13c", "L13", () => WD("L13", "it's", 1) - 0.05, (u, x) => {
  SCO.mood(0); const c = { x: 1.3, y: 0.95, z: 3.0, h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const kd = K_(c, { X: 1.45, Z: 4.6, fx: -0.5, reachL: 1, shock: 1, worry: 1, talk: talkAt(x.ln, x.lu), lean: Math.sin(u * 20) * 1.5, blink: 0 }, u);
  return END(s.back + kd.svg + s.front);
});
// 14 L14 wide: the kelpie with three kids on its back, sticky sheen, slow pull-out
shot("14", "L14", () => LN("L14").at - 0.05, (u) => {
  SCO.mood(0.3); const c = { ...LO.cam.wide, z: lerp(1.6, -0.6, u / 4.5) }, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const h = KP_(c, { ...LO.horse, X: -0.5, len: 3, water: 0, kneel: 0 }, u);
  return END(s.back + h.svg + riders(c, h, 3, { stuck: 1, grin: 0, shock: 0.6 }, u) + s.front);
});
// 15 L15 MED villager 1 screaming, hands stuck to the coat
shot("15", "L15", () => LN("L15").at - 0.05, (u, x) => {
  SCO.mood(0.3); const c = { x: -0.3, y: 1.05, z: 1.6, h0: 1060 }, s = SCO.loch(c, u, { moon: [820, 320, 62], haze: [500, 1150, 400] });
  const h = KP_(c, { ...LO.horse, X: -0.2, len: 3, water: 0, kneel: 0, nod: 0 }, u);
  const v = VL_(c, { ...h.seats[0], kind: 1, sit: 1, fx: 0.4, stuck: 1, shock: 1, talk: talkAt(x.ln, x.lu), blink: 0 }, u);
  return END(s.back + h.svg + v.svg + s.front);
});
// 16 L16 the kelpie turns and walks into the loch; the kid is dragged along at its nose, the loch rising on him
const WC = (ox, z = -0.3) => ({ x: 0.1 + ox, y: 1.2, z, h0: 1090 });
shot("16", "L16", () => LN("L16").at - 0.05, (u, x) => {
  SCO.mood(0.3); const ox = 0.3 * u, c = WC(ox), s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const w = wading(c, u, { ox, kX: 1.3, W: lerp(0.05, 0.4, clamp(x.lu / 3.2)), len: 3, riders: true, walk: (u * 0.45) % 1, run: (u * 1.1) % 1, lean: 8, shock: 1, worry: 1 });
  return END(s.back + w.svg + s.front);
});
// 17 L17 close kid, the water at his chest, the kelpie's nose at his finger
shot("17", "L17", () => LN("L17").at - 0.05, (u, x) => {
  SCO.mood(0.45); const c = { x: 1.1, y: 1.0, z: 3.0, h0: 1000 }, s = SCO.loch(c, u, { moon: [220, 330, 64], haze: [400, 1100, 400], props: false });
  const w = wading(c, u, { kX: 1.5, kZ: 4.6, hZ: 5.0, W: 0.95, talk: talkAt(x.ln, x.lu), lean: Math.sin(u * 7) * 2, shock: 1, worry: 1 });
  return END(s.back + w.svg + s.front);
});
// 18 L18 knees -> chest -> under
const WADE = (w0, w1, dur) => (u, x) => {
  SCO.mood(0.4); const c = WC(0.9 + 0.08 * u, 0.0), s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const w = wading(c, u, { ox: 0.9 + 0.08 * u, kX: 1.3, W: lerp(w0, w1, ease(clamp(u / dur))), len: 3, riders: true, walk: (u * 0.45) % 1, run: (u * 1.2) % 1, lean: 10, shock: 1, worry: 1, talk: 0.6 });
  return END(s.back + w.svg + s.front);
};
shot("18a", "L18", () => LN("L18").at - 0.05, WADE(0.4, 0.55, 2.0));
shot("18b", "L18", () => WD("L18", "to", 1) - 0.05, WADE(0.6, 1.0, 1.6));
shot("18c", "L18", () => WD("L18", "kids") - 0.1, (u, x) => {
  SCO.mood(1); const c = SCO.UNDER.cam.main, s = SCO.under(c, u, { depth: 0.35 });
  const h = KP_(c, { ...SCO.UNDER.horse, pitch: 22, float: 1, walk: (u * 0.4) % 1, len: 3, shadow: false }, u);
  const kc = { ...c, y: c.y - h.noseW.Y }, kd = L.kid(kc, { X: h.noseW.X + 0.3, Z: 5.99, fx: -0.8, reachL: 1, shock: 1 }, u);
  const hand = SCO.kidHand(kd, 1, 0), dx = h.nose.x - hand.x, dy = h.nose.y - hand.y;
  return END(s.back + h.svg + riders(c, h, 3, { stuck: 1, grin: 0, shock: 1, talk: 1 }, u) + `<g transform="translate(${dx},${dy}) rotate(38 ${hand.x} ${hand.y})">${kd.svg}</g>` + SCO.bubbles(h.nose.x + 60, h.nose.y - 40, u, 10, 3, 90) + s.front);
});
// 19 L19 UNDER close: the free hand under the mane finds the braided bridle, the silver rings glint (three cuts, tighter each time)
const RINGS = (z0, z1, gl0) => (u, x) => {
  SCO.mood(1); const c = { x: 0.15, y: 2.0, z: lerp(z0, z1, clamp(u / 3)), h0: 1000 }, s = SCO.under(c, u, { depth: 0.5 });
  const h = KP_(c, { ...SCO.UNDER.horse, pitch: 10, float: 1, size: 1, len: 1.2, shadow: false }, u);
  const gl = gl0 * (0.6 + 0.4 * Math.sin(u * 14));
  const hand = swimKid(c, h.ring, u, 0.8);
  const glint = `<g opacity="${n(gl)}" style="mix-blend-mode:screen"><circle cx="${n(h.ring.x)}" cy="${n(h.ring.y)}" r="${n(30 + 20 * gl)}" fill="#e8f4ff" opacity="0.5"/><path d="M${n(h.ring.x - 50)},${n(h.ring.y)} H${n(h.ring.x + 50)} M${n(h.ring.x)},${n(h.ring.y - 50)} V${n(h.ring.y + 50)}" stroke="#fff" stroke-width="4"/></g>`;
  return END(s.back + h.svg + hand + glint + SCO.bubbles(h.nose.x, h.nose.y - 100, u, 8, 5, 120) + s.front);
};
shot("19a", "L19", () => LN("L19").at - 0.05, RINGS(2.0, 2.4, 0));
shot("19b", "L19", () => WD("L19", "cold") - 0.1, RINGS(2.8, 3.3, 0.4));
shot("19c", "L19", () => WD("L19", "little") - 0.1, RINGS(3.3, 3.7, 1));
// 20 L20 close kid underwater, floating at the nose, whisper
shot("20", "L20", () => LN("L20").at - 0.05, (u, x) => {
  SCO.mood(1); const c = { x: 1.3, y: 1.0, z: 3.2, h0: 1000 }, s = SCO.under(c, u, { depth: 0.55 });
  const kd = L.kid(c, { X: 1.45, Z: 5.2, fx: -0.4, reachL: 1, worry: 0.9, shock: 0.5, talk: talkAt(x.ln, x.lu) * 0.6, blink: bl(u + 1) }, u);
  const T = [-40 + Math.sin(u * 2) * 8, -320 + Math.sin(u * 1.4) * 10], a = -16 * Math.PI / 180, cx0 = 540, cy0 = 1250, fx0 = kd.p.x - 0.02 * kd.p.s, fy0 = kd.p.y - 1.1 * kd.p.s, dx = fx0 - cx0, dy = fy0 - cy0;
  face(cx0 + dx * Math.cos(a) - dy * Math.sin(a) + T[0], cy0 + dx * Math.sin(a) + dy * Math.cos(a) + T[1], 0.17 * kd.p.s);
  return END(s.back + `<g transform="translate(${n(T[0])},${n(T[1])}) rotate(-16 ${cx0} ${cy0})">${kd.svg}</g>` + SCO.bubbles(900, 1200, u, 9, 7, 80) + s.front);
});
const CS = { x: -0.3, y: 1.15, z: 0.3, h0: 1100 };
// 21 L21 he pulls hard underwater; then he bursts up at the surface with the torn bridle
shot("21a", "L21", () => LN("L21").at - 0.05, (u, x) => {
  SCO.mood(1); const c = { x: 0.1, y: 2.0, z: 2.6, h0: 1000 }, s = SCO.under(c, u, { depth: 0.5 });
  const pull = clamp(u / 0.9), h = KP_(c, { ...SCO.UNDER.horse, pitch: 10, float: 1, len: 1.2, shadow: false }, u);
  return END(s.back + `<g transform="translate(${n(Math.sin(u * 40) * 4 * pull)},${n(Math.sin(u * 33) * 3 * pull)})">${h.svg}${swimKid(c, h.ring, u, 1)}</g>` + SCO.bubbles(h.nose.x, h.nose.y - 100, u, 8, 5, 120) + s.front);
});
shot("21b", "L21", () => WD("L21", "hard") - 0.03, (u, x) => {
  SCO.mood(tr([[0, 0.6], [0.7, 0.3]], u)); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const hop = 46 * ease(clamp(u / 0.22)) * (u < 0.6 ? 1 : 0.8), w = wading(c, u, { W: 0.75, bridle: 0, snap: 0, reach: 1, hop, lean: -8, shock: 0.6, worry: 0.3, kX: 1.1, hX: -0.9, hZ: 5.4, nod: -8, ox: 0 });
  let sp = ""; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.35, r = 30 + 160 * clamp(u * 2.2) * (0.6 + 0.4 * ((i * 37) % 5) / 5); sp += `<circle cx="${n(w.hand.x + Math.cos(a) * r)}" cy="${n(w.hand.y + 40 + Math.sin(a) * r)}" r="${n(7 - 4 * clamp(u * 1.5))}" fill="#cfe6ff" opacity="${n(0.8 * (1 - clamp(u * 1.4)))}"/>`; }
  return END(s.back + w.svg + SCO.bridleLoose(w.hand.x - 6, w.hand.y - 4, w.kd.p.s / 100 * 1.7, { rot: 8 }, u) + sp + s.front);
});
// 22 L22 the kelpie freezes, then kneels in the shallows for him, he beside it in the water (eye dims)
shot("22a", "L22", () => LN("L22").at - 0.05, (u) => {
  SCO.mood(0); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { W: 0.45, bridle: 0, snap: 0, reach: 0.5, kneel: 0, obey: tr([[0, 0], [1, 0.3]], u), shock: 0.6, kX: 1.2, hX: -0.9, hZ: 5.4, nod: 8 });
  return END(s.back + w.svg + s.front);
});
shot("22b", "L22", () => WD("L22", "then") - 0.05, (u) => {
  SCO.mood(0); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const k = tr([[0, 0], [1.6, 1]], u), w = wading(c, u, { W: lerp(0.45, 0.3, ease(clamp(u / 1.6))), bridle: 0, snap: 0, reach: 0.3, kneel: ease(k), obey: lerp(0.3, 1, ease(k)), shock: 0.2, worry: 0.2, blink: bl(u), kX: 1.2, hX: -0.9, hZ: 5.4, nod: 8 });
  return END(s.back + w.svg + s.front);
});
// 23 L23 the kids slide off into the shallows; the finger comes loose
shot("23a", "L23", () => LN("L23").at - 0.05, (u) => {
  SCO.mood(0); const c = LO.cam.long, s = SCO.loch(c, u, { moon: [860, 300, 56], haze: [560, 1130, 380] });
  const h = KP_(c, { ...LO.horse, X: -0.75, len: 3, kneel: 1, water: 0.3, obey: 1, bridle: 0 }, u);
  let kids = ""; [0, 1, 2].forEach((i) => { const a = clamp((u - i * 0.25) / 0.8), seat = h.seats[i]; kids += VL_(c, { X: lerp(seat.X, seat.X + 0.7 + i * 0.5, a), Y: lerp(seat.Y, -0.15, a), Z: lerp(seat.Z, seat.Z - 1.0 - i * 0.2, a), kind: KINDS[i], sit: a < 0.8 ? 1 : 0, fx: 0.7, grin: 0, shock: 0.3, blink: bl(u, i) }, u).svg; });
  return END(s.back + h.svg + kids + waterOver(L.P(c, 0, 0.3, 5.6).y, u, 0.5) + s.front);
});
shot("23b", "L23", () => WD("L23", "finger") - 0.1, (u) => {
  SCO.mood(0); const c = { x: 0.62, y: 0.95, z: 5.2, h0: 960 }, s = SCO.loch(c, u, { props: false, moon: [200, 300, 70], haze: [560, 900, 420] });
  const h = KP_(c, { X: -0.75, Y: -0.2, Z: 6.6, water: 0, nod: 48, reflect: false, bridle: 0 }, u);
  const fing = SCO.stuckFinger(h.nose.x, h.nose.y, 1300 / 1.4 / 100, { pull: 1 }, u);
  return END(s.back + h.svg + `<g transform="translate(${n(lerp(0, 160, ease(clamp((u - 0.4) / 0.8))))},${n(lerp(0, -60, ease(clamp((u - 0.4) / 0.8))))})">${fing}</g>`);
});
// 24 L24 he stands in the shallows holding the bridle, the kelpie bowed; then he rides it
shot("24a", "L24", () => LN("L24").at - 0.05, (u, x) => {
  SCO.mood(0); const c = CS, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const w = wading(c, u, { W: 0.22, bridle: 0, snap: 0, reach: 0.6, kneel: 1, obey: 1, shock: 0, worry: 0, talk: talkAt(x.ln, x.lu), blink: bl(u), kX: 1.2, hX: -0.85, hZ: 5.3, nod: 8, wa: 0.5 });
  return END(s.back + w.svg + SCO.bridleLoose(w.hand.x - 4, w.hand.y - 2, w.kd.p.s / 100 * 1.1, { rot: 4 }, u) + s.front);
});
shot("24b", "L24", () => WD("L24", "carry") - 0.1, (u) => {
  SCO.mood(0.2); const c = LO.cam.two, s = SCO.loch(c, u, { moon: [240, 300, 58] });
  const h = KP_(c, { X: -0.75, Y: -0.1, Z: 5.2, water: 0, bridle: 0, obey: 0.8, kneel: tr([[0, 1], [0.8, 0]], u), walk: u > 1 ? ((u - 1) * 0.4) % 1 : null }, u);
  const r = SCO.hostRide(c, h.seats[0]), kd = K_(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 0, grin: 1 }, u);
  return END(s.back + kd.svg + h.svg + SCO.riderLeg(c, h.seats[0]) + s.front);
});
// 25 L25 wide croft at midnight: the kid rides up, peat-fire light from the door
shot("25", "L25", () => LN("L25").at - 0.05, (u) => {
  SCO.mood(2); const c = CR.cam.wide, s = SCO.croft(c, u, { open: 1 });
  const hx = lerp(-3.2, CR.horse.X, ease(clamp(u / 2.8)));
  const h = KP_(c, { ...CR.horse, X: hx, bridle: 0, obey: 0.6, walk: (u * 0.5) % 1 }, u), r = SCO.hostRide(c, h.seats[0]);
  const kd = K_(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 0, grin: 1 }, u);
  return END(s.back + kd.svg + h.svg + SCO.riderLeg(c, h.seats[0]) + s.front);
});
// 26 L26 MED Grandma in the doorway, furious, candle jar
shot("26", "L26", () => LN("L26").at - 0.05, (u, x) => {
  SCO.mood(2); const c = CR.cam.door, s = SCO.croft(c, u, { open: 1 });
  const kp = G_(c, { X: 1.0, Z: 6.6, fx: -0.6, stern: 1, flame: 1, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  return END(s.back + kp.svg + s.front);
});
// 27 L27 MED the kid on the kelpie, holding the bridle up, proud
shot("27", "L27", () => LN("L27").at - 0.05, (u, x) => {
  SCO.mood(2); const c = { x: -0.2, y: 1.2, z: 2.6, h0: 1100 }, s = SCO.croft(c, u, { open: 1 });
  const h = KP_(c, { ...CR.horse, X: -0.6, bridle: 0, obey: 0.6 }, u), r = SCO.hostRide(c, h.seats[0]);
  const kd = K_(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 1, grin: 1, talk: talkAt(x.ln, x.lu) }, u), hand = SCO.kidHand(kd, 1, 0);
  return END(s.back + h.svg + kd.svg + SCO.riderLeg(c, h.seats[0]) + SCO.bridleLoose(hand.x, hand.y - 30, kd.p.s / 100 * 1.4, { rot: 8 }, u) + s.front);
});
// 28 L28 CLOSE: Grandma raises her hand, NINE fingers big in frame, her calm face behind it (hard cut on the last word + 0.4 s)
shot("28", "L28", () => LN("L28").at - 0.1, (u, x) => {
  SCO.mood(2); const c = CR.cam.door, s = SCO.croft(c, u, { open: 1 });
  const kp = G_(c, { X: 1.0, Z: 6.6, fx: -0.6, stern: 0.05, flame: 0.3, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  const rise = ease(clamp((x.lu - 0.0) / 0.6)), y = lerp(2600, 1590, rise);
  return END(s.back + kp.svg + SCO.nineHand(330 + Math.sin(u * 2) * 2, y, 52, { warm: 0.7, rot: -6, arm: 50 }) + s.front);
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
const OPT = { key: KEY, keyColor: "#ffc04a", maxFs: 100, width: 980, wrapAt: 15, reveal: true };
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
  for (const y of CAPY) { const b = capBox(ph, y); if (t0 < 2.75 && b.y0 < 514) continue; const bad = fs.filter((f) => hit(b, f)).length; if (!bad) { best = y; break; } if (bad < bs) { bs = bad; best = y; } }
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
  const title = titleCard && time < 2.75 ? titleCard(time, TITLE ? { style: TITLE } : {}) : "";
  const dbg = process.env.DEBUGFACES ? fcs.map((f) => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}" fill="none" stroke="#0f0" stroke-width="3"/>`).join("") : "";
  return { pic: frame(b.body) + title + dbg, cap: captions(time), shot: b.shot, faces: fcs };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
