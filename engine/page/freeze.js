// Freeze frames (fx "freeze"): the story's clock stops for `hold` seconds of video (engine/shared/holds.js) and this
// file gives the stopped picture its look, in render time, so the frozen frame still moves:
//
//   { "fx": "freeze", "at": 2.4, "hold": 1.2, "on": "phx", "push": 0.05, "tone": "warm", "flash": 0.35,
//     "label": { "title": "PHOENIX", "sub": "up since 4 am", "who": "phx", "side": "left", "y": 1010 } }
//
//   on      a cast id: the slow push-in centres on that character's head (else "xy": [x, y] px, else the frame centre)
//   push    how far the frozen picture pushes in over the hold (0.05 = 5 %; 0 keeps it still)
//   tone    "warm" (default: colour drained by 40 %, a little contrast and a warm vignette, like a paused film), "cool",
//           "mono", or false (the picture as it was)
//   flash   a white flash on the freeze's first frames (peak, 0.35 by default; 0: none)
//   label   a name tag that slides in on a slanted ink ribbon: "title" big, "sub" under it in the character's caption
//           colour ("who"), from the "side" ("left" or "right"), its top at "y" (px, default 940: clear of the subtitles at 1180, inside the safe zone)
//
// A pure function of the render time and the storyboard (no state between frames), so shards, stills and the frame
// cache agree. freezeKey() is what the cache keys on.
import { clamp, ease, lerp } from "./util.js";

const W = 1080, H = 1920, SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 };
const IN = 0.12, OUT = 0.16;   // the look eases in and out over this many seconds of video

// the freeze on screen at render time tv: { f, u (seconds into the hold), hold, k (0..1) } or null
export function freezeAt(sb, tv) {
  const holds = sb && sb.holds;
  if (!holds || !holds.length) return null;
  let shift = 0;
  for (const h of holds) {
    const a = h.at + shift;
    if (tv < a) break;
    if (h.freeze && tv < a + h.dur) {
      const f = (sb.fx || []).find((q) => q.do === "freeze" && Math.abs(Math.round(q.at * (sb.fps ?? 30)) / (sb.fps ?? 30) - h.at) < 1e-6);
      if (!f) return null;
      const u = tv - a;
      return { f, u, hold: h.dur, k: u / h.dur };
    }
    shift += h.dur - (h.len || 0);
  }
  return null;
}

// how strongly the freeze look is on (eases in and out at the ends of the hold)
const amount = (fz) => Math.min(ease("out")(clamp(fz.u / IN)), ease("out")(clamp((fz.hold - fz.u) / OUT)));

export const freezeKey = (fz) => (fz ? JSON.stringify([fz.f, Math.round(fz.u * 1e4)]) : "");

const TONES = {
  warm: { sat: 0.6, con: 1.08, bri: 0.98, sep: 0.12, vig: "rgba(46,24,8,", vigA: 0.42 },
  cool: { sat: 0.45, con: 1.08, bri: 0.97, sep: 0, vig: "rgba(10,18,40,", vigA: 0.42 },
  mono: { sat: 0, con: 1.12, bri: 1.0, sep: 0.08, vig: "rgba(0,0,0,", vigA: 0.45 },
};

// the frozen 3D picture: pushed in about the anchor, toned, with a vignette and the entry flash. Draws in place of
// the plain drawImage of the 3D canvas.
export function drawFrozen(ctx, src, fz, anchor) {
  const f = fz.f, a = amount(fz), tone = f.tone === false ? null : TONES[f.tone || "warm"] || TONES.warm;
  const push = 1 + (f.push ?? 0.05) * ease("inOut")(clamp(fz.k));
  const cx = clamp(anchor ? anchor.x : W / 2, W * 0.2, W * 0.8), cy = clamp(anchor ? anchor.y : H / 2, H * 0.2, H * 0.8);
  ctx.save();
  if (tone) ctx.filter = `saturate(${lerp(1, tone.sat, a).toFixed(3)}) contrast(${lerp(1, tone.con, a).toFixed(3)}) brightness(${lerp(1, tone.bri, a).toFixed(3)})${tone.sep ? ` sepia(${(tone.sep * a).toFixed(3)})` : ""}`;
  ctx.translate(cx, cy); ctx.scale(push, push); ctx.translate(-cx, -cy);
  ctx.drawImage(src, 0, 0, W, H);
  ctx.restore();
  if (tone && a > 0) {
    const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.28, W / 2, H * 0.46, H * 0.72);
    g.addColorStop(0, `${tone.vig}0)`); g.addColorStop(1, `${tone.vig}${(tone.vigA * a).toFixed(3)})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const fl = (f.flash ?? 0.35) * (1 - clamp(fz.u / 0.12));
  if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

const INK = "#16151c";
// the label's ribbon box [x, y, w, h] (without the slide), for the layout's safe-zone check
export function labelBox(ctx, f) {
  const L = typeof f.label === "string" ? { title: f.label } : f.label;
  if (!L || !L.title) return null;
  ctx.save();
  ctx.font = '900 92px "CapBlack"'; ctx.letterSpacing = "1px";
  const tw = ctx.measureText(L.title).width;
  ctx.font = '800 44px "CapBold"'; ctx.letterSpacing = "0px";
  const sw = L.sub ? ctx.measureText(L.sub).width : 0;
  ctx.restore();
  const w = Math.min(SAFE.x1 - SAFE.x0 - 20, Math.max(tw, sw) + 120), h = L.sub ? 176 : 124;
  const y = clamp(L.y ?? 940, SAFE.y0 + 10, SAFE.y1 - 10 - h), x = (L.side || "left") === "right" ? SAFE.x1 - 10 - w : SAFE.x0 + 10;
  return { L, box: [Math.round(x), Math.round(y), Math.round(w), h], tw, sw };
}

// the name tag: slides in from its side 0.06 s in (0.2 s, a little overshoot), holds, slides back out at the end
export function drawFreezeLabel(ctx, fz, accentOf) {
  const B = labelBox(ctx, fz.f);
  if (!B) return;
  const { L, box: [x, y, w, h] } = B, right = (L.side || "left") === "right";
  const kin = clamp((fz.u - 0.06) / 0.2), kout = clamp((fz.u - (fz.hold - 0.18)) / 0.16);
  if (kin <= 0 || kout >= 1) return;
  const dx = (1 - ease("back")(kin)) * (right ? 1 : -1) * (w + 80) + ease("in")(kout) * (right ? 1 : -1) * (w + 80);
  const accent = accentOf(L.who || fz.f.on);
  ctx.save();
  ctx.translate(x + dx, y);
  ctx.transform(1, 0, -0.14, 1, 0, 0);   // the ribbon leans forward
  // hard shadow, the ink ribbon, an accent stripe along its leading edge
  ctx.fillStyle = "rgba(10,8,16,0.45)"; ctx.fillRect(12, 12, w, h);
  ctx.fillStyle = INK; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent; ctx.fillRect(right ? w - 18 : 0, 0, 18, h);
  ctx.transform(1, 0, 0.14, 1, 0, 0);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = right ? "right" : "left";
  const tx = right ? w - 52 : 52;
  ctx.font = '900 92px "CapBlack"'; ctx.letterSpacing = "1px"; ctx.fillStyle = "#fff";
  ctx.fillText(L.title, tx, 98);
  if (L.sub) { ctx.font = '800 44px "CapBold"'; ctx.letterSpacing = "0px"; ctx.fillStyle = accent; ctx.fillText(L.sub, tx - (right ? 14 : -14), 152); }
  ctx.restore();
}
