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
//
// What if EP09 (13 Nov 2026) adds one more opt-in part: "steps": { "keys": [[t, n, dur?]], "pulse": [from, to] } (a
// footsteps counter: a chip [704, 214, 204, 96] in the safe zone's top-right, two shoe prints and round(n) in two fixed
// digit cells; cream, amber at 6 or less, red at 3 or less; a 5 px kick up on every drop of the number; from..to it
// beats twice a second with a red ring and a dark red fill). Alone it is the only chip; with a right chip it sits under it.
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

const STEPS = { w: 204, h: 96, r: 26, font: '900 68px "CapBlack"', end: 180, icon: 24, kick: 0.2, beat: 0.5 };
const inOut = ease("inOut");   // = keyed()'s count (shared/sky.js)
// when the shown number (round of the keyed value) last dropped, at or before t; null if it never has. Pure in (K, t):
// a counting key crosses n + 0.5 at a time found by bisection on its ease.
function lastDrop(K, i, t) {
  for (let j = i; j > 0; j--) {
    const [t0, v, d] = K[j], prev = K[j - 1][1];
    if (!(v < prev)) continue;
    const k = d > 0 ? clamp((t - t0) / d) : 1, n = Math.round(prev + (v - prev) * inOut(k));
    if (n >= Math.round(prev)) continue;
    if (!(d > 0)) return t0;
    const f = (n + 0.5 - prev) / (v - prev);
    let a = 0, b = 1;
    for (let m = 0; m < 40; m++) { const c = (a + b) / 2; if (inOut(c) < f) a = c; else b = c; }
    return t0 + b * d;
  }
  return null;
}
const stepColour = (n) => (n <= 3 ? "#ff4d4d" : n <= 6 ? "#ffb02e" : TXT);

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
  const stp = H.steps ? keyed(H.steps.keys, t) : null;
  if (stp) {
    const n = Math.round(stp.v), dt = stp.since === -Infinity ? null : lastDrop(stp.K, stp.i, t), P = H.steps.pulse;
    out.steps = { n, kick: dt != null && t - dt >= 0 && t - dt < STEPS.kick ? t - dt : null,
      pulse: P && t >= P[0] && t < P[1] ? (((t - P[0]) / STEPS.beat) % 1 + 1) % 1 : null };
  }
  if (gau) out.gauge = { kind: H.gauge.kind || "warmth", v: gau.v };
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
  const parts = [clockW, batW, gauW].filter((w) => w > 0);
  const rw = parts.reduce((a, w) => a + w, 0) + 26 * Math.max(0, parts.length - 1) + PAD * 2;
  const hL = S.part != null || S.label ? CH + 22 : CH;
  const left = S.day || S.part != null || S.label ? [SAFE.x0 + 12, y, Math.max(dayW, 150), hL] : null;
  return {
    y, dig, colon, clockW, batW, gauW,
    left,
    threat: S.threat ? [SAFE.x0 + 12, y + (left ? hL + 10 : 0), thrW, THR_H] : null,
    right: S.clock || S.battery || S.gauge ? [SAFE.x1 - 12 - rw, y, rw, CH] : null,
    steps: S.steps ? [SAFE.x1 - 12 - STEPS.w, y + (S.clock || S.battery || S.gauge ? CH + 10 : 0), STEPS.w, STEPS.h] : null,
  };
}
export function hudBoxes(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return [];
  const L = layout(ctx, S);
  return [L.left, L.threat, L.right, L.steps].filter(Boolean).map((b) => ({ text: "hud", box: b.map(Math.round), card: true }));
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
// a shoe print: a sole 16 x 30 and a heel 14 x 12 under it, turned by deg about its middle; (cx, top) its top centre
function shoe(ctx, cx, top, deg) {
  ctx.save(); ctx.translate(cx, top + 22); ctx.rotate((deg * Math.PI) / 180);
  ctx.beginPath(); ctx.ellipse(0, -7, 8, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-7, 10, 14, 12, [3, 3, 7, 7]); ctx.fill();
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
    const [x, y, w, h] = L.right, kick = S.battery && S.battery.kick != null && S.battery.kick < 0.18 ? Math.sin((S.battery.kick / 0.18) * Math.PI) : 0;
    ctx.save(); ctx.translate(kick * 5, 0);
    chip(ctx, L.right);
    let cx = x + PAD;
    const mid = y + h / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0px"; ctx.fillStyle = TXT;
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
  if (L.steps) {
    const T = S.steps, [x, y, w, h] = L.steps, cx = x + w / 2, cy = y + h / 2, col = stepColour(T.n);
    const kick = T.kick != null ? Math.sin((T.kick / STEPS.kick) * Math.PI) : 0, k = T.pulse;
    const sc = k != null ? 1 + 0.14 * Math.sin(Math.PI * Math.min(1, k / 0.36)) : 1;
    ctx.save(); ctx.translate(0, -kick * 5);
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, STEPS.r);
    ctx.fillStyle = k != null ? "rgba(60,14,18,0.78)" : CHIP; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
    if (k != null) {
      const g = 16 * k;
      ctx.save(); ctx.globalAlpha = 0.85 * (1 - k); ctx.lineWidth = 6; ctx.strokeStyle = "#ff4d4d";
      ctx.beginPath(); ctx.roundRect(x - g, y - g, w + 2 * g, h + 2 * g, STEPS.r + g); ctx.stroke(); ctx.restore();
    }
    // the icon: two prints in a 58 px box from x + 24, the right one 14 px higher
    ctx.fillStyle = col;
    shoe(ctx, x + STEPS.icon + 15, cy - 15, -12); shoe(ctx, x + STEPS.icon + 43, cy - 29, 12);
    // the number, right-aligned in two fixed digit cells ending at x + 180
    ctx.font = STEPS.font; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.fillStyle = col;
    const dig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), s = String(T.n);
    digits(ctx, s, x + STEPS.end - dig * s.length, cy + 3, dig, dig);
    ctx.restore();
  }
  ctx.restore();
}
