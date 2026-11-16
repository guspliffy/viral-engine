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
// Happiness score film (16 Nov 2026) adds two opt-in chips, for a clip whose clock is a score and a train (nothing
// changes without them; both also work with the day/clock/battery chips, stacking under them):
//   "own":   keys | { "keys": [[0, 41], [42, 40], [43, 39]], "out": [172, 0.5] }
//   "train": keys | { "keys": [[6, "SUN 19:42"], [100, "09:12"], [150, "00:58", 12], [190, "00:00", 5]],
//                     "out": [194, 1], "day": 3 }
// own: Spud's own score, a glasses glyph (two #e6cf8a rings) + the number. Keys are [t, number]; the chip appears
// (0.25 s pop) at the first key, and every later key that changes the number is a check: odometer tick over 5 frames (old
// number slides down 40 % of the chip height and fades, the new one drops in; the colour steps at frame 3) and the house
// kick (scale 1.06, 0.15 s). The number is coloured by the tag's 4 steps: <= 35 #cbb98a, 36-60 #e6cf8a, 61-85 #f3dc8c,
// >= 86 #ffe9a3. "out": [t, dur = 0.5] fades the chip out for good (the glasses lift); nothing replaces it.
// train: the countdown to Mash's train, a locomotive-front pictogram + text, and 4 day pips (Thu Fri Sat Sun) in a row
// under the text, inside the chip (r 7, 12 px between pips; done days #fff8ec, today #e6cf8a, later ones outline only).
// Keys are [t, value, dur?]. A value with letters ("SUN 19:42") is a label, shown as it is; a "MM:SS" string (or a plain
// number of seconds) is the countdown: from the previous countdown key's value it counts down linearly over dur (no
// dur: it jumps), shown as MM:SS in fixed digit cells. Under 01:00 the text is amber #ffb648. The chip slides in from
// the right over 0.3 s at the first key; a label <-> countdown change rolls the text like the own chip's tick; the
// countdown reaching 00:00 gives one kick (scale 1.08, 0.2 s; the whistle is the director's sound cue); no blink.
// The pips' today is the last label's first three letters (THU FRI SAT SUN); "day": 0-3 sets it for the whole clip
// (default Sunday with no label). "out": [t, dur = 0.5] fades the chip out for good.
//
// Placement follows the frame (shared/frame.js): tall as below; "frame": "wide" (1920 x 1080) puts the same chips in
// frameSafe's corners, y 40 on top (y 888 for "bottom"): own at x 80, train's right edge at x 1840, DAY at x 92.
// Tall own chip: x 60, y 214; train right edge x 920, y 214. A chip's "y" override ("hud": { "y": n }) moves them all.
//
// pos "top" (default): DAY in the safe zone's top-left corner and the clock + battery in its top-right, y 214-284, the
// middle left free for Jonny's in-app title. "bottom": the same strip at y 1288-1356 (clear of one-line subtitles at
// 1180). "y" puts its top anywhere. Boxes go to the layout as cards, so qa/framing.mjs sees a face under one.
import { clamp, ease, lerp } from "./util.js";
import { keyed, minutes, nightOf } from "../shared/sky.js";
import { frameSafe, isWide } from "../shared/frame.js";

const CH = 70, PAD = 22, FONT = '900 44px "CapBlack"', SMALL = '800 22px "CapBold"', TAG = '900 30px "CapBlack"';
const GLYPH = 44, PIP_R = 7, PIP_GAP = 12, PIP_W = 4 * PIP_R * 2 + 3 * PIP_GAP;
const THR_FONT = '900 34px "CapBlack"', THR_H = 56;
const CHIP = "rgba(18,16,24,0.66)", EDGE = "rgba(255,255,255,0.16)", TXT = "#fff8ec";

const hhmm = (m) => { const x = ((Math.floor(m + 1e-6) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const gap = (d) => (d >= 60 ? `+${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `+${d} min`);

// ---- the score film's chips (own, train)
const TICK = 5 / 30, ROLL = 0.4 * CH, AMBER = "#ffb648", GOLD = "#e6cf8a", DAYS = ["THU", "FRI", "SAT", "SUN"];
const specKeys = (s) => (Array.isArray(s) ? s : s && Array.isArray(s.keys) ? s.keys : null);
const fadeOut = (o, t) => (o ? 1 - clamp((t - o[0]) / Math.max(o[1] ?? 0.5, 1e-6)) : 1);
const ownColour = (v) => (v <= 35 ? "#cbb98a" : v <= 60 ? "#e6cf8a" : v <= 85 ? "#f3dc8c" : "#ffe9a3");
const isLabel = (v) => /[A-Za-z]/.test(String(v));
const secsOf = (v) => { if (typeof v === "number") return v; const [m, s = 0] = String(v).split(":").map(Number); return m * 60 + s; };
const mmss = (n) => { const x = Math.max(0, Math.round(n)); return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const idxSorted = (K, t) => { let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j; return i; };
// a train key's end text: a label as it is, a countdown as MM:SS
const trainEnd = (k) => (isLabel(k[1]) ? String(k[1]) : mmss(secsOf(k[1])));

function ownState(H, t) {
  const spec = specKeys(H.own);
  if (!spec || !spec.length) return null;
  const K = spec.map((k) => [k[0], Math.round(Number(k[1]))]).sort((a, b) => a[0] - b[0]);
  const i = idxSorted(K, t), a = fadeOut(H.own.out, t);
  if (i < 0 || a <= 0) return null;
  const since = t - K[i][0], changed = i > 0 && K[i][1] !== K[i - 1][1];
  const nd = Math.max(2, ...K.map((k) => String(k[1]).length));
  return {
    v: K[i][1], nd, a,
    born: t - K[0][0] < 0.25 ? t - K[0][0] : null,
    tick: changed && since < TICK ? since : null, prev: changed && since < TICK ? K[i - 1][1] : null,
    kick: changed && since < 0.15 ? since : null,
  };
}
function trainState(H, t) {
  const spec = specKeys(H.train);
  if (!spec || !spec.length) return null;
  const K = spec.map((k) => [k[0], k[1], k[2] ?? 0]).sort((a, b) => a[0] - b[0]);
  const i = idxSorted(K, t), a = fadeOut(H.train.out, t);
  if (i < 0 || a <= 0) return null;
  const [t0, val, d] = K[i], since = t - t0, label = isLabel(val), prevK = i > 0 ? K[i - 1] : null;
  let text, secs = null;
  if (label) text = String(val);
  else {
    const to = secsOf(val), from = prevK && !isLabel(prevK[1]) ? secsOf(prevK[1]) : to;
    secs = d > 0 ? lerp(from, to, clamp(since / d)) : to;
    text = mmss(Math.ceil(secs - 1e-6));
  }
  const dayOf = (s) => DAYS.indexOf(String(s).slice(0, 3).toUpperCase());
  let day = H.train.day != null ? H.train.day : 3;
  if (H.train.day == null) for (let j = 0; j <= i; j++) if (isLabel(K[j][1]) && dayOf(K[j][1]) >= 0) day = dayOf(K[j][1]);
  const kindChange = prevK && isLabel(prevK[1]) !== label;
  const zero = !label && secsOf(val) === 0 && since >= d && since - d < 0.2;
  return {
    text, count: !label, amber: !label && Math.ceil(secs - 1e-6) < 60, day, a,
    labels: [...new Set(K.filter((k) => isLabel(k[1])).map((k) => String(k[1])))],
    born: t - K[0][0] < 0.3 ? t - K[0][0] : null,
    flip: kindChange && since < 0.2 ? { since, prev: trainEnd(prevK), prevCount: !isLabel(prevK[1]), prevAmber: !isLabel(prevK[1]) && Math.ceil(secsOf(prevK[1])) < 60 } : null,
    kick: zero ? since - d : null,
  };
}

const shown = (H, t) => !H.show || (t >= H.show[0] && t < H.show[1]);

// what the HUD shows at t (also the frame cache's key for it)
export function hudState(sb, t) {
  const H = sb.hud;
  if (!H || !shown(H, t)) return null;
  const day = keyed(H.day, t), clock = keyed(H.clock, t, minutes), bat = keyed(H.battery, t);
  const out = { pos: H.pos || "top", y: H.y };
  if (isWide(sb)) out.wide = true;   // only set on a wide frame, so a tall clip's cache key never changes
  const own = ownState(H, t), train = trainState(H, t);
  if (own) out.own = own;
  if (train) out.train = train;
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
  return out;
}
export const hudKey = (sb, t) => { const s = hudState(sb, t); return s ? JSON.stringify(s, (k, v) => (typeof v === "number" ? Math.round(v * 1e3) / 1e3 : v)) : ""; };

// the chips' boxes in output px: { left, threat, right, own, train }
function layout(ctx, S) {
  const safe = frameSafe(S.wide ? { frame: "wide" } : null);
  const y = S.y ?? (S.pos === "bottom" ? safe.y1 - 72 : S.wide ? safe.y0 : 214);
  ctx.save(); ctx.font = FONT; ctx.letterSpacing = "0.5px";
  const dayW = S.day ? ctx.measureText(`DAY ${S.day.n}`).width + PAD * 2 : 0;
  const dig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), colon = ctx.measureText(":").width;
  const pctW = Math.max(dig * 3 + ctx.measureText("%").width, ctx.measureText("DEAD").width);
  const gauW = S.gauge ? 26 + 10 + dig * 3 + ctx.measureText("-").width + ctx.measureText(" °C").width : 0;
  const ownW = S.own ? PAD * 2 + GLYPH + 10 + S.own.nd * dig : 0;
  const trainTextW = S.train ? Math.max(dig * 4 + colon, ...S.train.labels.map((l) => ctx.measureText(l).width)) : 0;
  const trainW = S.train ? Math.max(PAD * 2 + GLYPH + 12 + trainTextW, PAD * 2 + PIP_W) : 0;
  ctx.font = THR_FONT; const thrW = S.threat ? 40 + 12 + ctx.measureText("SNOW 0.0 m").width + PAD * 2 : 0;
  ctx.restore();
  const clockW = S.clock ? 34 + 12 + dig * 4 + colon : 0, batW = S.battery ? 56 + 10 + pctW : 0;
  const ammoW = S.ammo ? S.ammo.max * AMMO_STEP - (AMMO_STEP - AMMO_W) : 0;
  const parts = [ammoW, clockW, batW, gauW].filter((w) => w > 0);
  const rw = parts.reduce((a, w) => a + w, 0) + 26 * Math.max(0, parts.length - 1) + PAD * 2;
  const hL = S.part != null || S.label ? CH + 22 : CH;
  const left = S.day || S.part != null || S.label ? [safe.x0 + 12, y, Math.max(dayW, 150), hL] : null;
  const threat = S.threat ? [safe.x0 + 12, y + (left ? hL + 10 : 0), thrW, THR_H] : null;
  const right = S.clock || S.battery || S.gauge || S.ammo ? [safe.x1 - 12 - rw, y, rw, S.ammo ? AMMO_H + 26 : CH] : null;
  // the score film's chips sit in the corners themselves (own x 80 / 60, train's right edge 1840 / 920); next to the
  // older chips they stack under them
  const ownY = y + (left ? hL + 10 : 0) + (threat ? THR_H + 10 : 0), trainY = y + (right ? right[3] + 10 : 0);
  return {
    y, dig, colon, clockW, batW, gauW, ammoW, safe, trainTextW,
    left, threat, right,
    own: S.own ? [safe.x0, ownY, ownW, CH] : null,
    train: S.train ? [safe.x1 - trainW, trainY, trainW, CH + 24] : null,
  };
}
export function hudBoxes(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return [];
  const L = layout(ctx, S);
  return [L.left, L.threat, L.right, L.own, L.train].filter(Boolean).map((b) => ({ text: "hud", box: b.map(Math.round), card: true }));
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
// the glasses glyph (two rings and a bridge), GLYPH px wide, centred on (cx, cy)
function glasses(ctx, cx, cy) {
  ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.lineCap = "round";
  for (const dx of [-11, 11]) { ctx.beginPath(); ctx.arc(cx + dx, cy, 9, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy - 1, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 20, cy - 2); ctx.lineTo(cx - 22, cy - 6); ctx.moveTo(cx + 20, cy - 2); ctx.lineTo(cx + 22, cy - 6); ctx.stroke();
  ctx.restore();
}
// a locomotive seen from the front, GLYPH px, centred on (cx, cy): cab, windscreen, two lamps, cowcatcher, rails
function loco(ctx, cx, cy) {
  const x = cx - 22, y = cy - 22;
  ctx.save(); ctx.strokeStyle = TXT; ctx.fillStyle = TXT; ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.roundRect(x + 8, y + 3, 28, 29, 8); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + 13, y + 9, 18, 9, 3); ctx.stroke();
  ctx.fillStyle = "#ffd25a"; for (const dx of [15, 29]) { ctx.beginPath(); ctx.arc(x + dx, y + 25, 2.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(x + 6, y + 40); ctx.lineTo(x + 12, y + 33); ctx.moveTo(x + 38, y + 40); ctx.lineTo(x + 32, y + 33); ctx.moveTo(x + 3, y + 41); ctx.lineTo(x + 41, y + 41); ctx.stroke();
  ctx.restore();
}

const batColour = (v) => (v < 10 ? "#ff4d4d" : v < 20 ? "#ffb02e" : "#5fe07a");

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
      const tw = ctx.measureText(S.clock.tag.text).width + 32, th = 46, room = x - 14 - tw >= (L.left ? L.left[0] + L.left[2] + 12 : L.safe.x0);
      const tx = room ? x - 14 - tw + dx : x + w - tw, ty = room ? y + (h - th) / 2 : y + h + 8 - dx / 3;
      ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fillStyle = "#ffd25a"; ctx.fill();
      ctx.fillStyle = "#1a1720"; ctx.fillText(S.clock.tag.text, tx + tw / 2, ty + th / 2 + 2);
      ctx.restore();
    }
  }
  if (L.own) {
    const O = S.own, [x, y, w, h] = L.own, kick = O.kick != null ? 1 + 0.06 * Math.sin((O.kick / 0.15) * Math.PI) : 1;
    const born = O.born != null ? ease("back")(clamp(O.born / 0.25)) : 1, sc = kick * (0.9 + 0.1 * born);
    ctx.save(); ctx.globalAlpha *= O.a * (O.born != null ? clamp(O.born / 0.12) : 1);
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.own); ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.clip();   // a rolling number stays in the chip
    glasses(ctx, x + PAD + GLYPH / 2, y + h / 2);
    const nx = x + PAD + GLYPH + 10, my = y + h / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0px"; ctx.textAlign = "center";
    const num = (v, col, dy, a) => {
      const str = String(v); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
      digits(ctx, str, nx + ((O.nd - str.length) * L.dig) / 2, my + dy, L.dig, L.colon); ctx.restore();
    };
    if (O.tick != null) {
      const k = clamp(O.tick / TICK), newCol = O.tick >= 3 / 30 ? ownColour(O.v) : ownColour(O.prev);
      num(O.prev, ownColour(O.prev), k * ROLL, 1 - k);
      num(O.v, newCol, -(1 - k) * ROLL, k);
    } else num(O.v, ownColour(O.v), 0, 1);
    ctx.restore();
  }
  if (L.train) {
    const T = S.train, [x, y, w, h] = L.train, kick = T.kick != null ? 1 + 0.08 * Math.sin((T.kick / 0.2) * Math.PI) : 1;
    const slide = T.born != null ? ease("out")(clamp(T.born / 0.3)) : 1;
    ctx.save(); ctx.globalAlpha *= T.a * slide; ctx.translate((1 - slide) * 60, 0);
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(kick, kick); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.train); ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.clip();
    loco(ctx, x + PAD + GLYPH / 2, y + CH / 2);
    // the text area: label or countdown centred in it
    const ax = x + PAD + GLYPH + 12, aw = w - (PAD * 2 + GLYPH + 12), cx = ax + aw / 2, my = y + CH / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0.5px";
    const text = (str, count, amber, dy, a) => {
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = amber ? AMBER : TXT;
      if (count) { ctx.textAlign = "center"; ctx.letterSpacing = "0px"; digits(ctx, str, cx - (L.dig * 4 + L.colon) / 2, my + dy, L.dig, L.colon); }
      else { ctx.textAlign = "center"; ctx.fillText(str, cx, my + dy); }
      ctx.restore();
    };
    if (T.flip) {
      const k = clamp(T.flip.since / 0.2);
      text(T.flip.prev, T.flip.prevCount, T.flip.prevAmber, k * ROLL, 1 - k);
      text(T.text, T.count, T.amber, -(1 - k) * ROLL, k);
    } else text(T.text, T.count, T.amber, 0, 1);
    // 4 day pips: done days filled, today gold, later ones outline only
    const px = x + w / 2 - PIP_W / 2 + PIP_R, py = y + h - 16;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const cxp = px + i * (PIP_R * 2 + PIP_GAP);
      ctx.beginPath(); ctx.arc(cxp, py, PIP_R, 0, Math.PI * 2);
      if (i <= T.day) { ctx.fillStyle = i === T.day ? GOLD : TXT; ctx.fill(); }
      else { ctx.strokeStyle = "rgba(255,248,236,0.55)"; ctx.stroke(); }
    }
    ctx.restore();
  }
  ctx.restore();
}
