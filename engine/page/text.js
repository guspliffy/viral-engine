// The 2D text drawn over the 3D frame: captions and text pops. stage.js binds the output canvas's context once.
//
// Captions come in two styles. "classic" (the default) shows the whole line with a small pop-in. "kinetic"
// (storyboard "captionStyle": "kinetic") is the CapCut/TikTok look: each word pops in as it is said
// (engine/shared/captions.js times them), the word being said is lit in the speaker's colour, ALL CAPS or *starred*
// words punch in bigger in that colour, a hard drop shadow gives depth, and the caption shrinks out instead of
// cutting (unless the next caption carries it on). The layout is the same in both styles, so the QA boxes agree.
//
// Text pops (fx "pop"): one comic word ("GULP", "BONK!") that slams in beside a character's head (or at "xy" in
// output pixels), holds, and puffs out: { "fx": "pop", "text": "GULP", "who": "rea", "dur": 0.8, "color": "#ffd60a",
// "angle": -8, "size": 120, "burst": "#ffffff", "dx": 0.55, "dy": -0.3 }. It is kept inside the safe zone.
import { clamp, ease } from "./util.js";
import { isPunch, shown } from "../shared/captions.js";

const W = 1080;
let ctx, sb;
export function bindText(c, storyboard) { ctx = c; sb = storyboard; }

const CAP = {
  main: { font: '900 74px "CapBlack"', size: 74, stroke: 14 },
  sub: { font: '800 60px "CapBold"', size: 60, stroke: 12 },
  // a title plate: white letters on a dark box (the "each character vs X" format's pinned word)
  label: { font: '900 96px "CapBlack"', size: 96, stroke: 0, pad: 34, box: "#24232b" },
};
// a "\n" in the text forces a line break (to keep a word from sitting alone on the last line)
function wrap(text, maxW) {
  if (text.includes("\n")) return text.split("\n").flatMap((t) => wrap(t, maxW));
  const words = text.split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  return lines;
}
// "size" (px) scales a caption's style down or up: a long pinned title that would wrap at the label's 96 px
function capStyle(c) {
  const st = CAP[c.style] || CAP.main;
  if (!c.size || c.size === st.size) return st;
  const k = c.size / st.size;
  return { ...st, size: c.size, font: st.font.replace(/\d+px/, `${c.size}px`), stroke: Math.round(st.stroke * k), ...(st.pad && { pad: Math.round(st.pad * k) }) };
}
function captionLayout(c) {
  const st = capStyle(c), pos = c.pos || "top";
  const top = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
  // full width at the top; lower down, keep clear of TikTok's right-hand buttons
  const cx = c.x ?? (pos === "top" ? W / 2 : 480), maxW = pos === "top" ? 860 : 780;
  ctx.font = st.font; ctx.letterSpacing = "-0.5px";
  // kinetic words pop in one by one, outlined and shadowed: a wider gap keeps them from running together
  ctx.wordSpacing = kinetic(c) ? "14px" : "0px";
  const lines = wrap(shown(c.text), maxW), lh = st.size * 1.12;
  return { st, top, cx, lines, lh };
}
// the caption's ink box in output pixels [x, y, w, h], stroke included
export function captionBox(c) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c);
  const pad = st.pad ?? 0, w = Math.max(...lines.map((ln) => ctx.measureText(ln).width)) + st.stroke + pad * 2;
  ctx.restore();
  return [Math.round(cx - w / 2), Math.round(top - st.stroke / 2 - pad / 2), Math.round(w), Math.round(lines.length * lh + st.stroke + pad)];
}
const kinetic = (c) => sb.captionStyle === "kinetic" && c.kinetic !== false && c.words && !capStyle(c).box;
export function drawCaption(c, t) {
  if (kinetic(c)) return drawKinetic(c, t);
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c), cy = top + (lines.length * lh) / 2;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.miterLimit = 2;
  ctx.translate(cx, cy); ctx.scale(c.scale, c.scale); ctx.translate(-cx, -cy);
  if (st.box) { const [bx, by, bw, bh] = captionBox(c); ctx.fillStyle = st.box; ctx.fillRect(bx, by, bw, bh); }
  lines.forEach((ln, i) => {
    const y = top + lh * (i + 0.5);
    if (st.stroke) { ctx.lineWidth = st.stroke; ctx.strokeStyle = "#111"; ctx.strokeText(ln, cx, y); }
    ctx.fillStyle = "#fff"; ctx.fillText(ln, cx, y);
  });
  ctx.restore();
}

// each fighter's caption colour: bright enough to read against white words and the dark outline
const ACCENT = { phoenix: "#ff9f1c", reaper: "#b28dff", wizard: "#4fc3ff", samurai: "#6ee86a", viking: "#ffcf33", astronaut: "#7fe3ff", gunslinger: "#ffb347", dragon: "#ff6b5b", sorcerer: "#d17bff", allfather: "#ffe066" };
const DEFAULT_ACCENT = "#ffd60a", INK = "#111", SHADOW = "rgba(10,8,16,0.5)";
function accentOf(who) {
  const c = who && (sb.cast || []).find((x) => x.id === who);
  return (c && ACCENT[c.character.split("/").pop()]) || DEFAULT_ACCENT;
}
const POP_IN = 0.16, EXIT = 0.14;
function drawKinetic(c, t) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c), cy = top + (lines.length * lh) / 2;
  const speaker = (c.words.find((w) => w.who) || {}).who, ex = c.cont ? 0 : clamp((t - (c.to - EXIT)) / EXIT);
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round"; ctx.miterLimit = 2;
  if (ex > 0) { const s = 1 - 0.1 * ease("in")(ex); ctx.globalAlpha = 1 - ease("in")(ex); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
  const base = ctx.globalAlpha;
  let wi = 0;
  lines.forEach((ln, li) => {
    const toks = ln.split(" "), y = top + lh * (li + 0.5), x0 = cx - ctx.measureText(ln).width / 2;
    toks.forEach((tok, i) => {
      const w = c.words[wi++] || { at: c.from };
      if (t < w.at) return;
      const pre = i ? ctx.measureText(toks.slice(0, i).join(" ") + " ").width : 0, wx = x0 + pre + ctx.measureText(tok).width / 2;
      const k = w.at < c.from ? 1 : clamp((t - w.at) / POP_IN), punch = isPunch(c.text.split(/\s+/).filter(Boolean)[wi - 1] || tok);
      // back ease: overshoots and settles; a punch word starts smaller, lands bigger and rocks once
      const e = ease("back")(k), sc = punch ? 0.35 + 0.65 * e : 0.6 + 0.4 * e;
      const rise = (1 - ease("out")(k)) * 24, rot = punch ? Math.sin(k * Math.PI * 2) * 0.07 * (1 - k) : 0;
      const live = w.end != null && t < w.end;
      ctx.globalAlpha = base * Math.min(1, k * 4);
      ctx.save(); ctx.translate(wx, y + rise); ctx.rotate(rot); ctx.scale(sc, sc);
      // hard drop shadow, then the outline, then the fill
      ctx.lineWidth = st.stroke; ctx.strokeStyle = SHADOW; ctx.fillStyle = SHADOW;
      ctx.strokeText(tok, 0, 7); ctx.fillText(tok, 0, 7);
      ctx.strokeStyle = INK; ctx.strokeText(tok, 0, 0);
      ctx.fillStyle = punch ? accentOf(w.who || speaker) : live ? accentOf(w.who) : "#fff";
      ctx.fillText(tok, 0, 0);
      ctx.restore();
    });
  });
  ctx.restore();
}

// --- text pops
const POP_SIZE = 120, POP_GROW = 1.15, SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 };
const popIn = 0.12, popOut = 0.16;
// where a pop sits at time t (its anchor is a point beside the head, from stage.js), pushed inside the safe zone so
// that even at its biggest the word stays clear of the app's buttons. [x, y, w, h] at that biggest size.
export function popBox(f, anchor) {
  if (!anchor) return null;
  const size = f.size ?? POP_SIZE;
  ctx.save(); ctx.font = `900 ${size}px "CapBlack"`; ctx.letterSpacing = "1px";
  const w = (ctx.measureText(f.text).width + size * 0.2) * POP_GROW, h = size * 1.15 * POP_GROW;
  ctx.restore();
  const x = clamp(anchor.x - w / 2, SAFE.x0 + 8, SAFE.x1 - 8 - w), y = clamp(anchor.y - h / 2, SAFE.y0 + 8, SAFE.y1 - 8 - h);
  return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
}
function burst(rx, ry, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, q = i % 2 ? 0.62 + 0.12 * ((i * 7) % 3) / 2 : 1; ctx.lineTo(Math.cos(a) * rx * q, Math.sin(a) * ry * q); }
  ctx.closePath();
}
export function drawPop(f, t, anchor) {
  const d = f.dur ?? 0.8, k = t - f.at;
  if (k < 0 || k > d || !anchor) return;
  const box = popBox(f, anchor), size = f.size ?? POP_SIZE, cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
  const kin = clamp(k / popIn), kout = clamp((k - (d - popOut)) / popOut);
  const sc = 0.2 + 0.8 * ease("back")(kin) + 0.04 * (k / d) + 0.11 * ease("out")(kout);
  const ang = ((f.angle ?? -7) + (1 - ease("out")(kin)) * -14) * (Math.PI / 180);
  ctx.save();
  ctx.globalAlpha = 1 - ease("in")(kout);
  ctx.translate(cx, cy - 12 * (k / d)); ctx.rotate(ang); ctx.scale(sc, sc);
  ctx.font = `900 ${size}px "CapBlack"`; ctx.letterSpacing = "1px"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  const tw = ctx.measureText(f.text).width;
  if (f.burst) { burst(tw * 0.68, size * 0.95, 11); ctx.fillStyle = f.burst; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); }
  // letter by letter on a jaunty baseline (fixed per letter, so it never jitters), hard shadow, thick outline
  const letters = [...f.text], xs = letters.map((_, i) => ctx.measureText(letters.slice(0, i).join("")).width - tw / 2);
  for (const pass of ["shadow", "ink", "fill"]) letters.forEach((ch, i) => {
    const y = Math.sin(i * 1.7 + 0.6) * size * 0.05, off = pass === "shadow" ? size * 0.07 : 0;
    ctx.lineWidth = size * 0.17;
    if (pass === "fill") { ctx.fillStyle = f.color || DEFAULT_ACCENT; ctx.fillText(ch, xs[i], y); }
    else { ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.strokeText(ch, xs[i] + off, y + off); if (off) ctx.fillText(ch, xs[i] + off, y + off); }
  });
  ctx.restore();
}
