// A series HUD (opt-in, top-level "hud"): the day, a clock and a phone battery in two small chips, for numbered
// parts ("Survive it" day 1, 18:05, 41 %). Story time, so a hit-stop or freeze frame stops the clock with the picture.
//
//   "hud": { "day": [[0, 1]], "clock": [[0, "18:05"], [4.2, "18:31", 0.5]],
//            "battery": [[0, 41], [5.0, 30, 0.12], [5.8, 1, 0.12], [6.4, 0]], "part": 1, "pos": "top" }
//
// Each key is [t, value, dur?]: from t the value counts from the previous key's value to its own over dur seconds (no
// dur: it jumps). day and battery also take a plain number, clock a plain "HH:MM". A clock jump shows a small "+26 min"
// tag beside it for a second ("clockTag": false turns it off). The battery is green, amber under 20 %, red under 10 %,
// and at 0 reads DEAD and blinks twice; its chip gives a little kick on every drop. "part" adds a small PART line
// under the day. "show": [from, to] limits it to part of the clip.
//
// Survive it EP1 (9 Nov 2026) adds three opt-in parts, nothing changes without them: "label": "SURVIVE IT" (a small
// yellow line under DAY, like "part"); "threat": { "kind": "snow", "keys": [[t, metres, dur?]] } (a second chip under
// the day chip: a little house whose blue fill rises with the snow, buried at 7 m, "SNOW 2.0 m", red text from 7 m,
// a kick on every rise); "gauge": { "kind": "warmth", "keys": [[t, celsius, dur?]] } (a thermometer and "12 °C" after
// the clock in the right chip: green, amber under 8, blue under 0).
// You wake up mid EP03 (13 Nov 2026) adds "ammo": { "keys": [[t, rounds]], "max": 6 } (opt-in): a row of cartridges
// first in the right chip, brass while loaded, a faint outline once fired; a drop kicks the chip and the slot just
// fired glows red for 0.4 s. A counter that needs no English (82 % of the TikTok viewers are DACH).
//
// Skip remote (Happiness EP02) adds two opt-in parts, nothing changes without them (design: DESIGN.md section 3). A clip
// without "age" or "pills" draws exactly as before.
//   "age": { "keys": [[0, 25], [4.1, 31], [9.0, 61], [15.2, 25, 1.5]], "fade": [40.2, 1.0] }
//   "pills": { "show": [17.2, 19.4] }
// age = the video's clock, no English: a birthday-cake icon (3 candle flames under 50, 1 from 50), the number in big
// digits and a life bar (90 - age) / 90 (green over 50 %, amber 25-50, red under 25) in a chip at x 72-372, y 214-332
// (the y key moves it). Keys [t, value, dur?]: a RISE counts up over dur (default 0.4 s) from the key's time, the chip
// kicks 6 px, the number flashes yellow and scales 1.18 -> 1, the lost chunk of the bar flashes for 0.35 s and a
// "+N" tag shows right of the chip for 0.9 s. A FALL (the roll-back) counts down over dur (default 1.5 s, eased in,
// one whole number per frame, the bar refilling) and a green "-N" tag shows for 1.0 s from the moment it lands. dur 0 jumps.
// "fade": [from, dur = 1] fades the chip out. The "+N" tag is 388-490 px wide: keep a jump key clear of the pills.
// pills = the "YES" / "NO" question pills x 420-900, y 214-332 (green YES, red NO, a small "or" between): fade in over
// 0.2 s at show[0], out over 0.2 s ending at show[1]. "pills": [from, to] works too.
//
// pos "top" (default): DAY in the safe zone's top-left corner and the clock + battery in its top-right, y 214-284, the
// middle left free for Jonny's in-app title. "bottom": the same strip at y 1288-1356 (clear of one-line subtitles at
// 1180). "y" puts its top anywhere. Boxes go to the layout as cards, so qa/framing.mjs sees a face under one.
import { clamp, ease, lerp } from "./util.js";
import { keyed, minutes, nightOf } from "../shared/sky.js";

const SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 };
const CH = 70, PAD = 22, FONT = '900 44px "CapBlack"', SMALL = '800 22px "CapBold"', TAG = '900 30px "CapBlack"';
const THR_FONT = '900 34px "CapBlack"', THR_H = 56;
const CHIP = "rgba(18,16,24,0.66)", EDGE = "rgba(255,255,255,0.16)", TXT = "#fff8ec";

const hhmm = (m) => { const x = ((Math.floor(m + 1e-6) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const gap = (d) => (d >= 60 ? `+${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `+${d} min`);

const shown = (H, t) => !H.show || (t >= H.show[0] && t < H.show[1]);

// what the HUD shows at t (also the frame cache's key for it)
export function hudState(sb, t) {
  const H = sb.hud;
  if (!H || !shown(H, t)) return null;
  const day = keyed(H.day, t), clock = keyed(H.clock, t, minutes), bat = keyed(H.battery, t);
  const out = { pos: H.pos || "top", y: H.y };
  if (day) out.day = { n: Math.round(day.v), since: day.since };
  if (H.part != null) out.part = H.part;
  if (H.label) out.label = String(H.label);
  const thr = H.threat ? keyed(H.threat.keys, t) : null, gau = H.gauge ? keyed(H.gauge.keys, t) : null;
  if (thr) { const rose = thr.i > 0 && thr.K[thr.i][1] > thr.K[thr.i - 1][1]; out.threat = { kind: H.threat.kind || "snow", v: thr.v, kick: rose && thr.since >= 0 ? thr.since : null }; }
  if (gau) out.gauge = { kind: H.gauge.kind || "warmth", v: gau.v };
  const am = H.ammo ? keyed(H.ammo.keys, t) : null;
  if (am) { const fell = am.i > 0 && am.K[am.i][1] < am.K[am.i - 1][1]; out.ammo = { n: Math.max(0, Math.round(am.v)), max: H.ammo.max || 6, kick: fell && am.since >= 0 && am.since < 0.4 ? am.since : null }; }
  if (clock) {
    out.clock = { text: hhmm(clock.v), mins: clock.v };
    // the jump tag: a key that moves the clock on by a minute or more shows "+N min" for a second from its start
    const d = clock.i > 0 ? Math.round(clock.K[clock.i][1] - clock.K[clock.i - 1][1]) : 0;
    if (H.clockTag !== false && d >= 1 && clock.since >= 0 && clock.since < 1.2) out.clock.tag = { text: gap(d), since: clock.since };
  }
  if (bat) {
    const v = clamp(bat.v, 0, 100), dropped = bat.i > 0 && bat.K[bat.i][1] < bat.K[bat.i - 1][1];
    out.battery = { v, pct: Math.round(v), dead: v <= 0.001 && !bat.counting, since: bat.since - (bat.K[bat.i][2] || 0), kick: dropped ? bat.since : null };
  }
  const age = H.age ? ageState(H.age, t) : null;
  if (age) out.age = age;
  const pl = H.pills ? pillsState(H.pills, t) : null;
  if (pl) out.pills = pl;
  return out;
}
export const hudKey = (sb, t) => { const s = hudState(sb, t); return s ? JSON.stringify(s, (k, v) => (typeof v === "number" ? Math.round(v * 1e3) / 1e3 : v)) : ""; };

// ---- age (the skip remote's clock) and the YES / NO pills ----
const AGE_RISE = 0.4, AGE_FALL = 1.5, AGE_MAX = 90;
// the age at t from keys [t, value, dur?]: a rise eases out, a fall (the roll-back) eases in
function ageEval(spec, t) {
  const K = (Array.isArray(spec) ? spec : [[0, spec]]).map((k) => [k[0], +k[1], k[2]]).sort((a, b) => a[0] - b[0]);
  K.forEach((k, i) => { const prev = i > 0 ? K[i - 1][1] : k[1]; if (k[2] == null) k[2] = i === 0 || k[1] === prev ? 0 : k[1] > prev ? AGE_RISE : AGE_FALL; });
  let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j;
  if (i < 0) return { v: K[0][1], i: -1 };
  const [t0, to, dur] = K[i], prev = i > 0 ? K[i - 1][1] : to, k = dur > 0 ? clamp((t - t0) / dur) : 1;
  const e = to >= prev ? ease("out")(k) : k * k;
  return { v: dur > 0 ? prev + (to - prev) * e : to, i, since: t - t0, dur, prev, to };
}
function ageState(A, t) {
  const spec = Array.isArray(A) ? A : A.keys ?? A;
  const f = Array.isArray(A) || !A.fade ? null : A.fade, fo = f ? (Array.isArray(f) ? f : [f, 1]) : null;
  const fade = fo ? 1 - clamp((t - fo[0]) / (fo[1] || 1)) : 1;
  if (fade <= 0) return null;
  const e = ageEval(spec, t), out = { v: e.v, fade };
  if (e.i > 0 && e.since >= 0 && Math.abs(e.to - e.prev) >= 0.5) {
    const rise = e.to > e.prev, end = rise ? 0.9 : e.dur + 1.0;
    if (e.since < Math.max(end, 0.4) + 0.05) out.key = { rise, since: e.since, dur: e.dur, prev: e.prev, to: e.to };
  }
  return out;
}
function pillsState(P, t) {
  const sh = Array.isArray(P) ? P : P.show;
  if (!sh || t < sh[0] || t >= sh[1]) return null;
  const a = Math.min(clamp((t - sh[0]) / 0.2), clamp((sh[1] - t) / 0.2));
  return { a, pop: t - sh[0] < 0.2 ? t - sh[0] : null };
}
const AGE_BOX = [72, 214, 300, 118], PILLS_BOX = [420, 214, 480, 118];
const AGE_GREEN = "#8fd14f", AGE_AMBER = "#ffb23d", AGE_RED = "#ff4d4d";
const ageColour = (v) => { const f = (AGE_MAX - v) / AGE_MAX; return f > 0.5 ? AGE_GREEN : f >= 0.25 ? AGE_AMBER : AGE_RED; };

// the chips' boxes in output px: { left: [x, y, w, h], right: [...] }
function layout(ctx, S) {
  const y = S.y ?? (S.pos === "bottom" ? 1288 : 214);
  ctx.save(); ctx.font = FONT; ctx.letterSpacing = "0.5px";
  const dayW = S.day ? ctx.measureText(`DAY ${S.day.n}`).width + PAD * 2 : 0;
  const dig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), colon = ctx.measureText(":").width;
  const pctW = Math.max(dig * 3 + ctx.measureText("%").width, ctx.measureText("DEAD").width);
  const gauW = S.gauge ? 26 + 10 + dig * 3 + ctx.measureText("-").width + ctx.measureText(" °C").width : 0;
  ctx.font = THR_FONT; const thrW = S.threat ? 40 + 12 + ctx.measureText("SNOW 0.0 m").width + PAD * 2 : 0;
  ctx.restore();
  const clockW = S.clock ? 34 + 12 + dig * 4 + colon : 0, batW = S.battery ? 56 + 10 + pctW : 0;
  const ammoW = S.ammo ? S.ammo.max * AMMO_STEP - (AMMO_STEP - AMMO_W) : 0;
  const parts = [ammoW, clockW, batW, gauW].filter((w) => w > 0);
  const rw = parts.reduce((a, w) => a + w, 0) + 26 * Math.max(0, parts.length - 1) + PAD * 2;
  const hL = S.part != null || S.label ? CH + 22 : CH;
  const left = S.day || S.part != null || S.label ? [SAFE.x0 + 12, y, Math.max(dayW, 150), hL] : null;
  return {
    y, dig, colon, clockW, batW, gauW, ammoW,
    left,
    threat: S.threat ? [SAFE.x0 + 12, y + (left ? hL + 10 : 0), thrW, THR_H] : null,
    right: S.clock || S.battery || S.gauge || S.ammo ? [SAFE.x1 - 12 - rw, y, rw, S.ammo ? AMMO_H + 26 : CH] : null,
  };
}
export function hudBoxes(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return [];
  const L = layout(ctx, S);
  const oy = (S.y ?? 214) - 214;
  const extra = [S.age && AGE_BOX, S.pills && PILLS_BOX].filter(Boolean).map((b) => [b[0], b[1] + oy, b[2], b[3]]);
  return [L.left, L.threat, L.right, ...extra].filter(Boolean).map((b) => ({ text: "hud", box: b.map(Math.round), card: true }));
}

function chip(ctx, [x, y, w, h]) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 20);
  ctx.fillStyle = CHIP; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
}
// digits in fixed cells, so a changing clock or battery never jiggles sideways
function digits(ctx, s, x, y, cell, colon) {
  for (const ch of s) {
    const w = ch === ":" ? colon : ch === "%" ? ctx.measureText("%").width : cell;
    ctx.fillText(ch, x + w / 2, y); x += w;
  }
  return x;
}
// a small sun, sunset or moon for the hour
function sky(ctx, cx, cy, mins) {
  const h = (((mins / 60) % 24) + 24) % 24, night = nightOf(mins) >= 0.5;   // the moon when the window is mostly night (shared/sky.js)
  ctx.save(); ctx.translate(cx, cy);
  if (!night && h >= 6.5 && h < 17) {
    ctx.fillStyle = "#ffd25a"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffd25a"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke(); }
  } else if (!night) {
    ctx.fillStyle = "#ff9a4a"; ctx.beginPath(); ctx.arc(0, 4, 12, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#ff9a4a"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.stroke();
  } else {
    ctx.fillStyle = "#e9e4ff"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(6, -4, 11, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// a little house buried to `fill` (0..1) in blue snow
function house(ctx, x, y, fill) {
  const w = 30, h = 28, roof = 12;
  ctx.save();
  const path = () => { ctx.beginPath(); ctx.moveTo(x, y + roof); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + roof); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); };
  if (fill > 0) { path(); ctx.save(); ctx.clip(); ctx.fillStyle = "#7cc4ff"; ctx.fillRect(x - 2, y + h - (h + 2) * fill, w + 4, (h + 2) * fill + 2); ctx.restore(); }
  path(); ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.strokeStyle = TXT; ctx.stroke();
  ctx.restore();
}
const warmColour = (v) => (v < 0 ? "#7cc4ff" : v < 8 ? "#ffb02e" : "#5fe07a");
// a small thermometer: the stem fills with the warmth's colour
function thermo(ctx, cx, cy, v) {
  const col = warmColour(v), k = clamp((v + 45) / 60);
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = TXT;
  ctx.beginPath(); ctx.roundRect(cx - 5, cy - 18, 10, 26, 5); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy + 12, 8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(cx - 2, cy + 6 - 20 * k, 4, 20 * k + 2);
  ctx.restore();
}
const AMMO_W = 26, AMMO_H = 74, AMMO_STEP = 38;
// one revolver cartridge standing up, centred on cy: a brass case and a copper nose; spent = a faint outline
function cartridge(ctx, x, cy, live, glow) {
  const w = AMMO_W, h = AMMO_H, nose = 24, y = cy - h / 2;
  const shape = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + nose); ctx.quadraticCurveTo(x, y, x + w / 2, y); ctx.quadraticCurveTo(x + w, y, x + w, y + nose); ctx.lineTo(x + w, y + h); ctx.closePath(); };
  ctx.save();
  if (live) {
    shape(); ctx.fillStyle = "#e0ac46"; ctx.fill();
    ctx.save(); shape(); ctx.clip(); ctx.fillStyle = "#c56f3e"; ctx.fillRect(x - 1, y - 1, w + 2, nose + 1); ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x + 4, y + nose + 4, 4, h - nose - 12); ctx.restore();
    ctx.fillStyle = "#b9862f"; ctx.fillRect(x - 1, y + h - 7, w + 2, 7);
  } else {
    shape(); ctx.lineWidth = 3; ctx.strokeStyle = glow > 0 ? `rgba(255,77,77,${0.35 + 0.65 * glow})` : "rgba(255,248,236,0.32)"; ctx.stroke();
  }
  ctx.restore();
}
const batColour = (v) => (v < 10 ? "#ff4d4d" : v < 20 ? "#ffb02e" : "#5fe07a");

// a birthday cake in a 64 px box at (x, y): candles lit by age (3 flames under 50, 1 from 50, the others burnt out)
function cake(ctx, x, y, v) {
  const lit = v < 50 ? 3 : 1, cx = [20, 32, 44];
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = "round";
  ctx.fillStyle = "#e9dcb4"; ctx.beginPath(); ctx.roundRect(1, 56, 62, 7, 3.5); ctx.fill();
  ctx.fillStyle = "#ff8fb1"; ctx.beginPath(); ctx.roundRect(6, 38, 52, 19, 5); ctx.fill();
  ctx.fillStyle = "#ff6f9a"; ctx.beginPath(); ctx.roundRect(15, 26, 34, 13, 4); ctx.fill();
  ctx.fillStyle = TXT; ctx.beginPath(); ctx.roundRect(6, 38, 52, 8, 4); ctx.fill();   // icing band with three drips
  for (const dx of [14, 30, 46]) { ctx.beginPath(); ctx.roundRect(dx - 3, 42, 6, 9, 3); ctx.fill(); }
  ctx.beginPath(); ctx.roundRect(15, 26, 34, 6, 3); ctx.fill();
  cx.forEach((x0, i) => {
    const on = lit === 3 || i === 1;
    ctx.fillStyle = i === 1 ? "#ffd25a" : "#7cc4ff"; ctx.beginPath(); ctx.roundRect(x0 - 2.5, 15, 5, 12, 1.5); ctx.fill();
    if (on) {
      ctx.fillStyle = "#ffb23d"; ctx.beginPath(); ctx.moveTo(x0, 1); ctx.quadraticCurveTo(x0 + 5.5, 8, x0, 14); ctx.quadraticCurveTo(x0 - 5.5, 8, x0, 1); ctx.fill();
      ctx.fillStyle = "#fff0a0"; ctx.beginPath(); ctx.ellipse(x0, 10, 1.9, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else { ctx.strokeStyle = "rgba(255,248,236,0.4)"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, 14); ctx.lineTo(x0 + 1, 9); ctx.stroke(); }
  });
  ctx.restore();
}
// the number in fixed 50 px cells from x: always one whole integer (a count over dur shows 82, 81, ... one per frame)
function ageNumber(ctx, v, x, y, cell, col) {
  const a = String(Math.max(0, Math.round(v)));
  ctx.fillStyle = col;
  for (let j = 0; j < a.length; j++) ctx.fillText(a[j], x + j * cell + cell / 2, y);
}
function drawAge(ctx, S) {
  const A = S.age, K = A.key, oy = (S.y ?? 214) - 214, [bx, by, bw, bh] = AGE_BOX;
  const kick = K && K.rise && K.since < 0.18 ? Math.sin((K.since / 0.18) * Math.PI) * 6 : 0;
  ctx.save(); ctx.globalAlpha = A.fade; ctx.translate(0, oy); ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.letterSpacing = "0px";
  ctx.save(); ctx.translate(kick, 0);
  chip(ctx, AGE_BOX);
  cake(ctx, 94, 230, A.v);
  // the number: yellow flash and 1.18 -> 1 on a rise
  const fl = K && K.rise && K.since < 0.4 ? K.since / 0.4 : null, sc = fl != null ? 1 + 0.18 * (1 - ease("out")(fl)) : 1;
  const col = fl != null ? (fl < 0.7 ? "#ffd25a" : TXT) : TXT, len = String(Math.max(0, Math.round(A.v))).length, ncx = 176 + (len * 50) / 2;
  ctx.font = '900 84px "CapBlack"';
  ctx.save(); ctx.translate(ncx, 266); ctx.scale(sc, sc); ctx.translate(-ncx, -266);
  ageNumber(ctx, A.v, 176, 266, 50, col);
  ctx.restore();
  // the life bar
  const f = clamp((AGE_MAX - A.v) / AGE_MAX), tx = 94, tw = 256, ty = 308, th = 12;
  ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 6); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 6); ctx.clip();
  if (K && K.rise && K.since < 0.35) {   // the lost chunk flashes cream
    const f0 = clamp((AGE_MAX - K.prev) / AGE_MAX);
    ctx.globalAlpha = A.fade * (1 - K.since / 0.35); ctx.fillStyle = TXT; ctx.fillRect(tx + tw * f, ty, tw * (f0 - f), th); ctx.globalAlpha = A.fade;
  }
  ctx.fillStyle = ageColour(A.v); ctx.fillRect(tx, ty, tw * f, th);
  ctx.restore();
  ctx.restore();
  // the tag right of the chip: "+N" for 0.9 s on a rise, a green "-N" for 1.0 s once the roll-back has landed
  if (K) {
    const k = K.rise ? K.since : K.since - K.dur, span = K.rise ? 0.9 : 1.0;
    if (k >= 0 && k < span) {
      const text = `${K.rise ? "+" : "-"}${Math.round(Math.abs(K.to - K.prev))}`, a = Math.min(1, k / 0.1) * (1 - clamp((k - (span - 0.2)) / 0.2));
      const dx = 18 * (1 - ease("back")(clamp(k / 0.22)));
      ctx.font = '900 40px "CapBlack"'; const tw2 = ctx.measureText(text).width + 36, th2 = 58;
      ctx.globalAlpha = A.fade * a;
      ctx.beginPath(); ctx.roundRect(bx + bw + 16 - dx, by + 48 - th2 / 2 + 0.5, tw2, th2, 20); ctx.fillStyle = "rgba(18,16,24,0.78)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
      ctx.fillStyle = K.rise ? AGE_AMBER : AGE_GREEN; ctx.fillText(text, bx + bw + 16 - dx + tw2 / 2, by + 50);
    }
  }
  ctx.restore();
}
// the YES / NO pills: two pills with a small "or" between, x 420-900
function drawPills(ctx, S) {
  const P = S.pills, oy = (S.y ?? 214) - 214, [x0, y0, w, h] = PILLS_BOX, cy = y0 + h / 2, pop = P.pop != null ? 0.92 + 0.08 * ease("out")(P.pop / 0.2) : 1;
  ctx.save(); ctx.globalAlpha = P.a; ctx.translate(0, oy); ctx.translate(x0 + w / 2, cy); ctx.scale(pop, pop); ctx.translate(-(x0 + w / 2), -cy);
  ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.letterSpacing = "0px"; ctx.lineJoin = "round";
  const shape = (x, text, fill) => {
    ctx.beginPath(); ctx.roundRect(x, y0, 220, h, 20); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
    ctx.font = '900 88px "CapBlack"'; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(18,16,24,0.55)"; ctx.strokeText(text, x + 110, cy + 4);
    ctx.fillStyle = TXT; ctx.fillText(text, x + 110, cy + 4);
  };
  shape(x0, "YES", "rgba(143,209,79,0.85)"); shape(x0 + w - 220, "NO", "rgba(255,77,77,0.85)");
  ctx.font = '900 40px "CapBlack"'; ctx.lineWidth = 7; ctx.strokeStyle = "rgba(18,16,24,0.7)"; ctx.strokeText("or", 660, cy + 3); ctx.fillStyle = TXT; ctx.fillText("or", 660, cy + 3);
  ctx.restore();
}

export function drawHud(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return;
  const L = layout(ctx, S);
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  if (L.left) {
    // a new day pops the chip
    const pop = S.day && S.day.since >= 0 && S.day.since < 0.25 && S.day.since !== -Infinity ? 1 + 0.12 * Math.sin((S.day.since / 0.25) * Math.PI) : 1;
    const [x, y, w, h] = L.left;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.left);
    ctx.fillStyle = TXT; ctx.font = FONT; ctx.letterSpacing = "0.5px";
    if (S.day) ctx.fillText(`DAY ${S.day.n}`, x + w / 2, y + CH / 2 + 2);
    if (S.part != null || S.label) { ctx.font = SMALL; ctx.letterSpacing = "2px"; ctx.fillStyle = "#ffd25a"; ctx.fillText(S.label || `PART ${S.part}`, x + w / 2, y + h - 18); }
    ctx.restore();
  }
  if (L.threat) {
    const T = S.threat, [x, y, w, h] = L.threat, kick = T.kick != null && T.kick < 0.2 ? Math.sin((T.kick / 0.2) * Math.PI) : 0;
    ctx.save(); ctx.translate(0, -kick * 4);
    chip(ctx, L.threat);
    house(ctx, x + PAD, y + (h - 28) / 2 - 1, clamp(T.v / 7));
    ctx.font = THR_FONT; ctx.letterSpacing = "0.5px"; ctx.textAlign = "left"; ctx.fillStyle = T.v >= 7 ? "#ff6b5e" : TXT;
    ctx.fillText(`SNOW ${T.v < 10 ? (Math.round(T.v * 10) / 10).toFixed(1) : Math.round(T.v)} m`, x + PAD + 30 + 12, y + h / 2 + 2);
    ctx.restore();
  }
  if (L.right) {
    const [x, y, w, h] = L.right, kick = S.battery && S.battery.kick != null && S.battery.kick < 0.18 ? Math.sin((S.battery.kick / 0.18) * Math.PI)
      : S.ammo && S.ammo.kick != null && S.ammo.kick < 0.18 ? Math.sin((S.ammo.kick / 0.18) * Math.PI) : 0;
    ctx.save(); ctx.translate(kick * 5, 0);
    chip(ctx, L.right);
    let cx = x + PAD;
    const mid = y + h / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0px"; ctx.fillStyle = TXT;
    if (S.ammo) {
      const A = S.ammo, glow = A.kick != null ? 1 - clamp(A.kick / 0.4) : 0;
      for (let i = 0; i < A.max; i++) cartridge(ctx, cx + i * AMMO_STEP, mid - 2, i < A.n, i === A.n ? glow : 0);
      cx += L.ammoW + 26;
    }
    if (S.clock) {
      sky(ctx, cx + 17, mid - 2, S.clock.mins); cx += 34 + 12;
      digits(ctx, S.clock.text, cx, mid, L.dig, L.colon); cx += L.clockW - 46 + 26;
    }
    if (S.battery) {
      const B = S.battery, dead = B.dead, blink = dead && B.since >= 0 && B.since < 0.6 && Math.floor(B.since / 0.15) % 2 === 1;
      if (!blink) {
        const col = dead ? "#ff4d4d" : batColour(B.v), bx = cx, by = mid - 14;
        ctx.lineWidth = 3.5; ctx.strokeStyle = dead ? col : TXT;
        ctx.beginPath(); ctx.roundRect(bx, by, 46, 26, 6); ctx.stroke();
        ctx.fillStyle = dead ? col : TXT; ctx.beginPath(); ctx.roundRect(bx + 47, by + 8, 5, 10, 2); ctx.fill();
        if (B.v > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, Math.max(3, 38 * (B.v / 100)), 18, 3); ctx.fill(); }
        ctx.textAlign = "left"; ctx.fillStyle = dead ? col : B.v < 10 ? "#ff7a7a" : TXT;
        if (dead) ctx.fillText("DEAD", bx + 56 + 10, mid);
        else { ctx.textAlign = "center"; digits(ctx, `${B.pct}%`, bx + 56 + 10, mid, L.dig, L.colon); }
      }
      cx += L.batW + 26;
    }
    if (S.gauge) {
      const v = Math.round(S.gauge.v);
      thermo(ctx, cx + 12, mid - 4, S.gauge.v); cx += 26 + 10;
      ctx.textAlign = "left"; ctx.fillStyle = v < 0 ? "#bfe3ff" : TXT;
      ctx.fillText(`${v} °C`, cx, mid);
    }
    ctx.restore();
    // the clock's jump tag: a yellow pill that slides out to the left of the chip on the same row, then fades
    if (S.clock && S.clock.tag) {
      const k = S.clock.tag.since, a = Math.min(1, k / 0.1) * (1 - clamp((k - 0.9) / 0.3)), dx = 24 * (1 - ease("back")(clamp(k / 0.22)));
      ctx.save(); ctx.globalAlpha = a; ctx.font = TAG; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // left of the clock chip, never over the day chip (with no room there it sits just under the clock chip)
      const tw = ctx.measureText(S.clock.tag.text).width + 32, th = 46, room = x - 14 - tw >= (L.left ? L.left[0] + L.left[2] + 12 : SAFE.x0);
      const tx = room ? x - 14 - tw + dx : x + w - tw, ty = room ? y + (h - th) / 2 : y + h + 8 - dx / 3;
      ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fillStyle = "#ffd25a"; ctx.fill();
      ctx.fillStyle = "#1a1720"; ctx.fillText(S.clock.tag.text, tx + tw / 2, ty + th / 2 + 2);
      ctx.restore();
    }
  }
  ctx.restore();
  if (S.age) drawAge(ctx, S);
  if (S.pills) drawPills(ctx, S);
}
