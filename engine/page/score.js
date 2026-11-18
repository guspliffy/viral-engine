// The happiness-score overlay (2D, drawn after the grade): the glasses view mask and the glowing score tags.
// "I could see everyone's happiness score" (storyboards/series/happiness/03-happiness-score/DESIGN.md sections 2-3).
// Pure function of story time, the storyboard keys and the anchors env.head returns: no state kept between frames.
//
// STORYBOARD (opt-in, top-level "score"; nothing changes without it):
//   "score": {
//     "view": [[3.2, 5.0], [41.0, 41.9]],             // glasses view ON in [from, to) seconds; hard cut in and out
//     "tags": [
//       { "who": "mash",                               // character id: the tag floats over the leaf tip + 0.10 m
//         "keys": [[3.2, 88], [84.0, 86], [86.0, 84]], // [t, score, dur?]: at t the score jumps (a tick: odometer);
//                                                      //   with dur it counts from the previous value, ease out
//         "minus": true,                               // Spud only: a "-1" leaves the tag on every drop; or [t, ...]
//         "minusCard": [42.0],                         // drops (key times) that show the 150 px text card instead
//         "minusTo": [960, 170],                       // card end point (default wide [W/2, 170], tall [W/2, 300])
//         "show": [3.2, 9.0],                          // optional window (the tag exists only in it); hard cut
//         "free": true,                                // draw also outside the glasses view (29 memory, 45 lens)
//         "size": "wide|medium|close",                 // default: by the body height on screen (see SIZE)
//         "k": 1.0,                                    // size multiplier (default 1; "mash" 1.15; extras, dog: give 0.85)
//         "dx": 0, "dy": 0,                            // px offsets of the anchor
//         "xy": [x, y],                                // fixed pill CENTRE in output px (no who needed, no bob)
//         "style": "pencil",                           // 29: same pill with a pencil line (ink #6b5a3a 3 px, 2 px wobble)
//         "lens": { "ell": [cx, cy, rx, ry, rotDeg] }  // 45: clip the tag to a screen ellipse, or
//                 { "world": { "c": [x,y,z], "n": [nx,ny,nz], "r": 0.04 } }   // a world circle (centre, normal, radius m),
//                                                      //   projected with env.project; or { "poly": [[x,y], ...] } in px
//       } ] }
// Scores run 0-999 (digits are drawn right-aligned in fixed 0.62 em cells; only the digits that change roll).
// Tags pop in over 3 frames (scale 0.8 -> 1), 2 frames apart left to right (by screen x at the window start).
//
// WHAT IS DRAWN (numbers from the DESIGN, px at 1920x1080 / 1080x1920; the wide frame is the default look):
//   mask wide: discs r 500 at (520, 540) and (1400, 540); tall: one disc r 520 at (540, 880). Flat #1d1c1b outside the
//   union. Rim 40 px (#3b3936, grey tortoise blotches #2a2826 hashed by disc and blotch index, a 2 px inner bevel
//   #cfcac2 at 0.4), bridge bar 150 x 70 (wide only, y 262-332), a 46 px x 3 px scratch #d8d4cc at 10 o'clock on the
//   right disc (the only disc on tall). Vignette 0 at r < 380 up to 18 % at r 460. The mask seats in over the first
//   4 frames (scale 1.06 and 10 px low -> rest). The grade (E2) is not done here.
//   tag: pill 2.14 : 1, radius 0.45 h, ink line #5a4520 2 px. SIZE: body px <= 300 120x56 (36 px digits), <= 600
//   170x80 (52), else 236x110 (72). Fill by score: <= 35 #cbb98a, <= 60 #e6cf8a, <= 85 #f3dc8c, else #ffe9a3, stepping
//   at tick frame 3. Painted glow: a 3 px inner rim #fff4cf; from 61 a hard outer band 6 px (10 px from 86) of
//   #f3dc8c at 0.35. Bob +-3 px at 0.5 Hz (hashed phase). Anchor lag: the mean of the head at t, t-1/fps, t-2/fps.
//   tick: old digit slides DOWN 0.4 h and fades over 5 frames, the new one comes from above. The -1: "−1" #e6cf8a,
//   0.75 x digit size, leaves behind the tag's top edge at the tick's frame 3, rises 90 px in 0.9 s (ease out), greys
//   to #9a9a9a from 0.4 s, fades over the last 0.3 s. The card: 150 px, rises to minusTo in 0.6 s, holds 1.2 s,
//   greys and fades in 0.4 s.
//
// HOOK (stage.js, director applies; see the report): drawScore(ctx, sb, t, env) after the 3D frame, grade and pause
// grade and before the captions; scoreKey(sb, t, env) goes into the 2D layer key. env:
//   { W, H,
//     head(who, tt) -> { x, y, body } | null   // screen px of the leaf tip + 0.10 m of `who` posed at time tt (camera
//                                              //   of the current frame) and the body height in px; null: no tag
//     project([x,y,z]) -> { x, y }             // world -> screen px (only for lens.world) }
import { clamp, ease, hashStr, lerp } from "./util.js";
import { isWide } from "../shared/frame.js";

const EPS = 1e-4, DARK = "#1d1c1b", RIM = "#3b3936", BLOT = "#2a2826", BEVEL = "#cfcac2", SCRATCH = "#d8d4cc";
const DISCS = { wide: [{ x: 520, y: 540, r: 500 }, { x: 1400, y: 540, r: 500 }], tall: [{ x: 540, y: 880, r: 520 }] };
const RIMW = 40, INK = "#5a4520", DIGIT = "#3a2c12", PENCIL = "#6b5a3a";
const SIZE = { wide: { w: 120, h: 56, fs: 36 }, medium: { w: 170, h: 80, fs: 52 }, close: { w: 236, h: 110, fs: 72 } };
const colorOf = (s) => (s <= 35 ? "#cbb98a" : s <= 60 ? "#e6cf8a" : s <= 85 ? "#f3dc8c" : "#ffe9a3");
const bandOf = (s) => (s >= 86 ? 10 : s >= 61 ? 6 : 0);
const unit = (s) => (hashStr(s) % 100000) / 100000;   // 0..1, a pure function of a string

// the score at time t from keys [[t, v, dur?]]: a jump at t, or a count over dur (ease out)
function scoreAt(keys, t) {
  let v = keys[0][1];
  for (const [kt, kv, kd] of keys) {
    if (t < kt - EPS) break;
    if (kd > 0 && t < kt + kd) return lerp(v, kv, ease("out")((t - kt) / kd));
    v = kv;
  }
  return v;
}
const str = (keys, t) => String(Math.max(0, Math.round(scoreAt(keys, t))));

// everything one frame draws, as plain data (also the frame cache's key)
export function planScore(sb, t, env) {
  const S = sb.score; if (!S) return null;
  const fps = sb.fps || 30, fr = 1 / fps, wide = isWide(sb), W = env?.W ?? (wide ? 1920 : 1080), H = env?.H ?? (wide ? 1080 : 1920);
  const win = (S.view || []).find(([a, b]) => t >= a - EPS && t < b - EPS);
  const plan = { wide, W, H, view: win ? { p: clamp(((t - win[0]) * fps) / 4, 0, 1) } : null, tags: [], minus: [] };
  if (!env) return plan;
  const tags = S.tags || [], nLeft = (i) => { const h = env.head(tags[i].who, win[0]); return h ? h.x : 1e9; };
  tags.forEach((tag, i) => {
    const sh = tag.show;
    if (!(win || tag.free) || (sh && (t < sh[0] - EPS || t >= sh[1] - EPS))) return;
    const keys = typeof tag.keys === "number" ? [[0, tag.keys]] : tag.keys; if (!keys?.length) return;
    // where it sits: the mean of the head at t, t-1 and t-2 frames (not across a cut: a jump over 150 px drops the older ones)
    let cx, bot, body = null;
    if (tag.xy) { cx = tag.xy[0]; bot = tag.xy[1] + 0.5 * (SIZE[tag.size || "close"].h * (tag.k ?? 1)); }
    else {
      const h0 = env.head(tag.who, t); if (!h0) return;
      let sx = h0.x, sy = h0.y, n = 1;
      for (let j = 1; j <= 2; j++) { const h = env.head(tag.who, t - j * fr); if (h && Math.hypot(h.x - h0.x, h.y - h0.y) < 150) { sx += h.x; sy += h.y; n++; } }
      cx = sx / n; bot = sy / n; body = h0.body;
    }
    const cls = tag.size || (body == null ? "medium" : body <= 300 ? "wide" : body <= 600 ? "medium" : "close");
    const k = tag.k ?? (tag.who === "mash" ? 1.15 : 1), w = SIZE[cls].w * k, h = SIZE[cls].h * k, fs = SIZE[cls].fs * k;
    const pencil = tag.style === "pencil";
    // pop in: 3 frames from the window start (or the tag's own start), 2 frames apart left to right
    let start = tag.free || !win ? (sh ? sh[0] : -1e9) : Math.max(win[0], sh ? sh[0] : -1e9);
    if (!tag.free && win && t - start < (tags.length * 2 + 3) * fr && (!sh || sh[0] <= win[0] + EPS)) {
      const mine = nLeft(i); let rank = 0;
      tags.forEach((o, j) => { if (j !== i && !o.free && !(o.show && o.show[0] > win[0] + EPS) && (nLeft(j) < mine || (nLeft(j) === mine && j < i))) rank++; });
      start += rank * 2 * fr;
    }
    const f = Math.floor((t - start) / fr + EPS); if (f < 0) return;
    const pop = clamp((f + 1) / 3, 0, 1);
    const cy = (tag.xy ? tag.xy[1] : bot - h / 2 + (tag.dy || 0)) + (pencil || tag.xy ? 0 : 3 * Math.sin(Math.PI * t + unit("bob" + i) * 6.2832));
    const x = cx + (tag.dx || 0), sc = lerp(0.8, 1, pop);
    // the number: right-aligned fixed cells, each digit that changed in the last 4 frames rolls
    const L = str(keys, t).length, cells = [];
    for (let c = 0; c < L; c++) {
      const r = L - 1 - c, dig = (tt) => str(keys, tt)[str(keys, tt).length - 1 - r] || " ";
      let old = null, p = 1;
      for (let j = 0; j <= 3; j++) if (dig(t - j * fr) !== dig(t - (j + 1) * fr)) { old = dig(t - (j + 1) * fr); p = (j + 1) / 5; break; }
      cells.push({ d: dig(t), old, p });
    }
    const vc = Math.round(scoreAt(keys, t - 3 * fr));
    // the polygon the tag is clipped to (45: the lens)
    let lens = null;
    if (tag.lens?.ell) { const [ex, ey, rx, ry, rot] = tag.lens.ell, a = ((rot || 0) * Math.PI) / 180; lens = Array.from({ length: 48 }, (_, q) => { const th = (q / 48) * 6.2832, px = Math.cos(th) * rx, py = Math.sin(th) * ry; return [ex + px * Math.cos(a) - py * Math.sin(a), ey + px * Math.sin(a) + py * Math.cos(a)]; }); }
    else if (tag.lens?.poly) lens = tag.lens.poly;
    else if (tag.lens?.world && env.project) {
      const { c, n, r } = tag.lens.world, nl = Math.hypot(...n) || 1, N = n.map((v) => v / nl);
      let a = [N[2], 0, -N[0]]; if (Math.hypot(...a) < 1e-6) a = [1, 0, 0];   // N x up
      const al = Math.hypot(...a); a = a.map((v) => v / al);
      const b = [N[1] * a[2] - N[2] * a[1], N[2] * a[0] - N[0] * a[2], N[0] * a[1] - N[1] * a[0]];
      lens = Array.from({ length: 48 }, (_, q) => { const th = (q / 48) * 6.2832, P = env.project([0, 1, 2].map((m) => c[m] + r * (Math.cos(th) * a[m] + Math.sin(th) * b[m]))); return [P.x, P.y]; });
    }
    plan.tags.push({ i, x, cy, w, h, fs, sc, alpha: pop, fill: colorOf(vc), band: pencil ? 0 : bandOf(vc), cells, pencil, lens });
    // the -1 (and the card) of every drop of this tag
    if (tag.minus || tag.minusCard) keys.forEach(([kt, kv, kd], q) => {
      const prev = q ? keys[q - 1][1] : kv; if (kd > 0 || kv >= prev) return;
      const T = kt + 3 * fr, a = t - T, text = `−${prev - kv}`, card = (tag.minusCard || []).some((c) => Math.abs(c - kt) < 1e-3);
      if (!card && !(tag.minus === true || (Array.isArray(tag.minus) && tag.minus.some((c) => Math.abs(c - kt) < 1e-3)))) return;
      if (a < -EPS) return;
      if (card) {
        const to = tag.minusTo || [W / 2, wide ? 170 : 300];
        if (a > 2.2) return; const e = ease("out")(clamp(a / 0.6, 0, 1)), g = clamp((a - 1.8) / 0.4, 0, 1);
        plan.minus.push({ text, x: lerp(x, to[0], e), y: lerp(cy - h / 2, to[1], e), size: 150, color: lerp3("#e6cf8a", "#9a9a9a", g), alpha: 1 - g, card: true });
      } else {
        if (a > 0.9) return;
        plan.minus.push({ text, x, y: cy - h / 2 - 90 * ease("out")(a / 0.9), size: fs * 0.75, color: lerp3("#e6cf8a", "#9a9a9a", clamp((a - 0.4) / 0.3, 0, 1)), alpha: 1 - clamp((a - 0.6) / 0.3, 0, 1) });
      }
    });
  });
  return plan;
}
function lerp3(a, b, k) { const c = (s, i) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16); return `rgb(${[0, 1, 2].map((i) => Math.round(lerp(c(a, i), c(b, i), k))).join(",")})`; }

export const scoreKey = (sb, t, env) => { const p = planScore(sb, t, env); return p ? JSON.stringify(p, (k, v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v)) : ""; };

export function drawScore(ctx, sb, t, env) {
  const p = planScore(sb, t, env); if (!p) return;
  ctx.save(); ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  if (p.view) drawMask(ctx, p);
  for (const m of p.minus) drawMinus(ctx, m);
  for (const g of p.tags) drawTag(ctx, g);
  ctx.restore();
}

function drawMask(ctx, { wide, W, H, view }) {
  const D = DISCS[wide ? "wide" : "tall"], s = lerp(1.06, 1, view.p), dy = 10 * (1 - view.p);
  ctx.save(); ctx.translate(W / 2, H / 2 + dy); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  // outside the union: the frame minus disc A, minus disc B (two nested clips)
  ctx.save();
  for (const d of D) { ctx.beginPath(); ctx.rect(-W, -H, 3 * W, 3 * H); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.clip("evenodd"); }
  ctx.fillStyle = DARK; ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
  D.forEach((d) => {   // vignette: 0 at r 380, 18 % at r 460 (r scaled to the disc)
    ctx.save(); ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.76, d.x, d.y, d.r * 0.92); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = g; ctx.fillRect(d.x - d.r, d.y - d.r, 2 * d.r, 2 * d.r); ctx.restore();
  });
  D.forEach((d, di) => {   // rim: ring, grey blotches, bevel
    ctx.save(); ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.arc(d.x, d.y, d.r - RIMW, 0, Math.PI * 2, true); ctx.clip();
    ctx.fillStyle = RIM; ctx.fillRect(d.x - d.r, d.y - d.r, 2 * d.r, 2 * d.r); ctx.fillStyle = BLOT;
    for (let b = 0; b < 22; b++) {
      const u = (n) => unit(`rim${di}:${b}:${n}`), a = u(0) * 6.2832, rr = d.r - RIMW * (0.15 + 0.7 * u(1));
      ctx.beginPath(); ctx.ellipse(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr, 8 + 20 * u(2), 5 + 9 * u(3), a + 1.57 + u(4), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = BEVEL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.x, d.y, d.r - RIMW + 1, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });
  if (wide) {   // the bridge over the top cusp
    ctx.fillStyle = RIM; ctx.beginPath(); ctx.roundRect(960 - 75, 262, 150, 70, 20); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = BEVEL; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(960 - 74, 263, 148, 68, 19); ctx.stroke(); ctx.restore();
  }
  // the scratch: on the right disc's rim (wearer's left) at 10 o'clock, a little off the radial
  const d = D[D.length - 1], a = (-150 * Math.PI) / 180, ra = a + (20 * Math.PI) / 180, rr = d.r - RIMW / 2;
  ctx.strokeStyle = SCRATCH; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath();
  ctx.moveTo(d.x + Math.cos(a) * rr - Math.cos(ra) * 23, d.y + Math.sin(a) * rr - Math.sin(ra) * 23); ctx.lineTo(d.x + Math.cos(a) * rr + Math.cos(ra) * 23, d.y + Math.sin(a) * rr + Math.sin(ra) * 23); ctx.stroke();
  ctx.restore();
}

// a rounded rectangle (radius 0.45 h) as a closed path; wob: a pencil line, sampled every ~7 px and shifted by hashed +-1 px
function pillPath(ctx, cx, cy, w, h, grow = 0, wob = null) {
  const W = w + 2 * grow, Hh = h + 2 * grow, r = 0.45 * h + grow, x0 = cx - W / 2, y0 = cy - Hh / 2;
  ctx.beginPath();
  if (!wob) { ctx.roundRect(x0, y0, W, Hh, r); return; }
  const pts = [], sx = W - 2 * r, sy = Hh - 2 * r, arc = (Math.PI / 2) * r, P = 2 * sx + 2 * sy + 4 * arc, n = Math.max(24, Math.round(P / 7));
  for (let q = 0; q < n; q++) {
    let s = (q / n) * P, px, py;
    const seg = [sx, arc, sy, arc, sx, arc, sy, arc]; let m = 0; while (m < 7 && s > seg[m]) { s -= seg[m]; m++; }
    const u = s / seg[m], a = u * Math.PI / 2;
    if (m === 0) { px = x0 + r + u * sx; py = y0; } else if (m === 1) { px = x0 + W - r + Math.sin(a) * r; py = y0 + r - Math.cos(a) * r; }
    else if (m === 2) { px = x0 + W; py = y0 + r + u * sy; } else if (m === 3) { px = x0 + W - r + Math.cos(a) * r; py = y0 + Hh - r + Math.sin(a) * r; }
    else if (m === 4) { px = x0 + W - r - u * sx; py = y0 + Hh; } else if (m === 5) { px = x0 + r - Math.sin(a) * r; py = y0 + Hh - r + Math.cos(a) * r; }
    else if (m === 6) { px = x0; py = y0 + Hh - r - u * sy; } else { px = x0 + r - Math.cos(a) * r; py = y0 + r - Math.sin(a) * r; }
    pts.push([px + (unit(`${wob}:${q}x`) * 2 - 1), py + (unit(`${wob}:${q}y`) * 2 - 1)]);
  }
  pts.forEach(([px, py], q) => (q ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
}

function drawTag(ctx, g) {
  const { x, cy, w, h, fs, fill, band, cells, pencil } = g;
  ctx.save(); ctx.translate(x, cy); ctx.scale(g.sc, g.sc); ctx.translate(-x, -cy); ctx.globalAlpha = g.alpha;
  if (g.lens) { ctx.restore(); ctx.save(); ctx.beginPath(); g.lens.forEach(([px, py], q) => (q ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip(); ctx.translate(x, cy); ctx.scale(g.sc, g.sc); ctx.translate(-x, -cy); ctx.globalAlpha = g.alpha; }
  if (band) { ctx.globalAlpha = g.alpha * 0.35; ctx.fillStyle = "#f3dc8c"; pillPath(ctx, x, cy, w, h, band); ctx.fill(); ctx.globalAlpha = g.alpha; }
  ctx.fillStyle = fill; if (pencil) ctx.globalAlpha = g.alpha * 0.9; pillPath(ctx, x, cy, w, h); ctx.fill(); ctx.globalAlpha = g.alpha;
  if (pencil) { ctx.strokeStyle = PENCIL; ctx.lineWidth = 3; ctx.lineJoin = "round"; pillPath(ctx, x, cy, w, h, 0, "pencil" + g.i); ctx.stroke(); }
  else {
    ctx.strokeStyle = "#fff4cf"; ctx.lineWidth = 3; pillPath(ctx, x, cy, w, h, -2.5); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; pillPath(ctx, x, cy, w, h); ctx.stroke();
  }
  // the digits, each in a fixed 0.62 em cell; the pill is the odometer's window
  ctx.save(); pillPath(ctx, x, cy, w, h, -1); ctx.clip();
  ctx.font = `900 ${fs}px "CapBlack"`; ctx.fillStyle = pencil ? PENCIL : DIGIT; ctx.textAlign = "center";
  const cw = 0.62 * fs, base = cy + 0.364 * fs;
  cells.forEach((c, q) => {
    const dx = x + (q - (cells.length - 1) / 2) * cw;
    if (c.old == null) { ctx.fillText(c.d, dx, base); return; }
    const e = ease("out")(c.p), ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * (1 - c.p); ctx.fillText(c.old, dx, base + 0.4 * h * e);
    ctx.globalAlpha = ga * c.p; ctx.fillText(c.d, dx, base - 0.4 * h * (1 - e)); ctx.globalAlpha = ga;
  });
  ctx.restore(); ctx.restore();
}

function drawMinus(ctx, m) {
  ctx.save(); ctx.globalAlpha = m.alpha; ctx.font = `900 ${Math.round(m.size)}px "CapBlack"`; ctx.textAlign = "center";
  ctx.lineJoin = "round"; ctx.lineWidth = m.card ? 8 : 3; ctx.strokeStyle = "rgba(58,44,18,0.85)";
  const y = m.y + 0.364 * m.size; ctx.strokeText(m.text, m.x, y); ctx.fillStyle = m.color; ctx.fillText(m.text, m.x, y); ctx.restore();
}
