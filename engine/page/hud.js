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
// pos "top" (default): DAY in the safe zone's top-left corner and the clock + battery in its top-right, y 214-284, the
// middle left free for Jonny's in-app title. "bottom": the same strip at y 1288-1356 (clear of one-line subtitles at
// 1180). "y" puts its top anywhere. Boxes go to the layout as cards, so qa/framing.mjs sees a face under one.
import { clamp, ease, lerp } from "./util.js";

const SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 };
const CH = 70, PAD = 22, FONT = '900 44px "CapBlack"', SMALL = '800 22px "CapBold"', TAG = '900 30px "CapBlack"';
const CHIP = "rgba(18,16,24,0.66)", EDGE = "rgba(255,255,255,0.16)", TXT = "#fff8ec";

// [[t, v, dur], ...] at t: the value, how far into its count it is, and when the key started
function keyed(spec, t, parse = (v) => v) {
  if (spec == null) return null;
  const K = (Array.isArray(spec) ? spec : [[0, spec]]).map((k) => [k[0], parse(k[1]), k[2] ?? 0]).sort((a, b) => a[0] - b[0]);
  let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j;
  if (i < 0) return { v: K[0][1], since: -Infinity, i: 0, K };
  const [t0, v, d] = K[i], prev = i > 0 ? K[i - 1][1] : v;
  const k = d > 0 ? clamp((t - t0) / d) : 1;
  return { v: d > 0 ? lerp(prev, v, ease("inOut")(k)) : v, since: t - t0, i, K, prev, counting: k < 1 };
}
const minutes = (s) => { if (typeof s === "number") return s; const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };
const hhmm = (m) => { const x = ((Math.floor(m + 1e-6) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const gap = (d) => (d >= 60 ? `+${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60} min` : ""}` : `+${d} min`);

const shown = (H, t) => !H.show || (t >= H.show[0] && t < H.show[1]);

// what the HUD shows at t (also the frame cache's key for it)
export function hudState(sb, t) {
  const H = sb.hud;
  if (!H || !shown(H, t)) return null;
  const day = keyed(H.day, t), clock = keyed(H.clock, t, minutes), bat = keyed(H.battery, t);
  const out = { pos: H.pos || "top", y: H.y };
  if (day) out.day = { n: Math.round(day.v), since: day.since };
  if (H.part != null) out.part = H.part;
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
  ctx.restore();
  const clockW = S.clock ? 34 + 12 + dig * 4 + colon : 0, batW = S.battery ? 56 + 10 + pctW : 0;
  const rw = (clockW && batW ? clockW + 26 + batW : clockW + batW) + PAD * 2;
  const hL = S.part != null ? CH + 22 : CH;
  return {
    y, dig, colon, clockW, batW,
    left: S.day || S.part != null ? [SAFE.x0 + 12, y, Math.max(dayW, 150), hL] : null,
    right: S.clock || S.battery ? [SAFE.x1 - 12 - rw, y, rw, CH] : null,
  };
}
export function hudBoxes(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return [];
  const L = layout(ctx, S);
  return [L.left, L.right].filter(Boolean).map((b) => ({ text: "hud", box: b.map(Math.round), card: true }));
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
  const h = (((mins / 60) % 24) + 24) % 24;
  ctx.save(); ctx.translate(cx, cy);
  if (h >= 6.5 && h < 17) {
    ctx.fillStyle = "#ffd25a"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffd25a"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke(); }
  } else if ((h >= 17 && h < 20) || (h >= 5 && h < 6.5)) {
    ctx.fillStyle = "#ff9a4a"; ctx.beginPath(); ctx.arc(0, 4, 12, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#ff9a4a"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.stroke();
  } else {
    ctx.fillStyle = "#e9e4ff"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(6, -4, 11, 0, Math.PI * 2); ctx.fill();
  }
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
    if (S.part != null) { ctx.font = SMALL; ctx.letterSpacing = "2px"; ctx.fillStyle = "#ffd25a"; ctx.fillText(`PART ${S.part}`, x + w / 2, y + h - 18); }
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
    }
    ctx.restore();
    // the clock's jump tag: a yellow pill that slides out to the left of the chip on the same row, then fades
    if (S.clock && S.clock.tag) {
      const k = S.clock.tag.since, a = Math.min(1, k / 0.1) * (1 - clamp((k - 0.9) / 0.3)), dx = 24 * (1 - ease("back")(clamp(k / 0.22)));
      ctx.save(); ctx.globalAlpha = a; ctx.font = TAG; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const tw = ctx.measureText(S.clock.tag.text).width + 32, th = 46, tx = x - 14 - tw + dx, ty = y + (h - th) / 2;
      ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fillStyle = "#ffd25a"; ctx.fill();
      ctx.fillStyle = "#1a1720"; ctx.fillText(S.clock.tag.text, tx + tw / 2, ty + th / 2 + 2);
      ctx.restore();
    }
  }
  ctx.restore();
}
