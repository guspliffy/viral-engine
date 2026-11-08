// Cards over the picture (opt-in effects; beat items or c.at() items, storyboards/lib/overlay.mjs):
//
//   { "fx": "rule", "at": 3.1, "dur": 1.6, "title": "RULE 1", "text": "Never let Dragon cook", "who": "dra" }
//       a rule slammed in after a failure: an ink plate, the title in the accent colour (who's caption colour, else
//       yellow), the rule in white; slams in tilted, holds with a slow drift, shrinks out
//
//   { "fx": "vote", "at": 14.0, "dur": 3.0, "question": "PART 2: who goes into the jungle for food?",
//     "options": [{ "key": "A", "text": "Viking", "who": "vik" }, { "key": "B", "text": "Reaper", "who": "rea" }],
//     "prompt": "Comment A or B" }
//       the comment-vote end card: a warm white sticker with the question, one pill per option (2-4; "who" colours its
//       letter in that character's caption colour) and a speech bubble with the prompt that keeps beating. It pops in,
//       the options follow one by one, and it drifts gently while it holds. A card that runs to the clip's end stays
//       to the last frame (no exit), so the loop starts again under it.
//
// Both sit centred in the safe zone (x 490) at "y" (the top edge, px: rule 300, vote 330). Their boxes go to the layout
// as cards (stage.js), so qa/check.mjs keeps them in the safe zone and qa/framing.mjs sees a face under one.
// Story time, so a hit-stop holds them with the picture.
import { clamp, ease } from "./util.js";

const SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 }, CX = (SAFE.x0 + SAFE.x1) / 2;
const INK = "#16151c", PAPER = "#fff8ec", SHADOW = "rgba(10,8,16,0.45)", DEFAULT_ACCENT = "#ffd60a";

function wrap(ctx, text, maxW) {
  if (text.includes("\n")) return text.split("\n").flatMap((t) => wrap(ctx, t, maxW));
  const words = text.split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  return lines;
}
const on = (f, t, end) => t >= f.at && t < Math.min(f.at + (f.dur ?? 2), end + 1e-6);
const lasts = (f, end) => f.at + (f.dur ?? 2) >= end - 1e-6;   // runs to the clip's last frame: no exit

// --- the rule card
const RULE = { title: '900 46px "CapBlack"', text: '900 64px "CapBlack"', lh: 70, pad: 34, maxW: 700 };
function ruleLayout(ctx, f) {
  ctx.save();
  ctx.font = RULE.text; ctx.letterSpacing = "0px";
  const lines = wrap(ctx, f.text || "", RULE.maxW), tw = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
  ctx.font = RULE.title; ctx.letterSpacing = "4px";
  const hw = f.title ? ctx.measureText(f.title).width : 0;
  ctx.restore();
  const w = Math.min(SAFE.x1 - SAFE.x0 - 24, Math.max(tw, hw) + RULE.pad * 2), h = RULE.pad * 2 + (f.title ? 56 : 0) + lines.length * RULE.lh;
  const y = clamp(f.y ?? 300, SAFE.y0 + 12, SAFE.y1 - 12 - h);
  return { lines, box: [Math.round(CX - w / 2), Math.round(y), Math.round(w), Math.round(h)] };
}
function drawRule(ctx, f, t, end, accentOf) {
  const L = ruleLayout(ctx, f), [x, y, w, h] = L.box, d = f.dur ?? 1.6, k = t - f.at;
  const kin = clamp(k / 0.16), kout = lasts(f, end) ? 0 : clamp((k - (d - 0.14)) / 0.14);
  const sc = (1.35 - 0.35 * ease("back")(kin)) * (1 - 0.25 * ease("in")(kout));
  const shake = kin >= 1 ? Math.exp(-(k - 0.16) * 18) : 0, ang = ((f.angle ?? -3) + shake * 2.5 * Math.sin(k * 90)) * (Math.PI / 180);
  const drift = 4 * Math.sin(k * 2.2);
  const accent = f.who ? accentOf(f.who) : f.color || DEFAULT_ACCENT;
  ctx.save();
  ctx.globalAlpha = Math.min(1, kin * 3) * (1 - ease("in")(kout));
  ctx.translate(x + w / 2, y + h / 2 + drift); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = SHADOW; ctx.beginPath(); ctx.roundRect(10, 12, w, h, 24); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 24); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = accent; ctx.beginPath(); ctx.roundRect(9, 9, w - 18, h - 18, 17); ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let ty = RULE.pad;
  if (f.title) { ctx.font = RULE.title; ctx.letterSpacing = "4px"; ctx.fillStyle = accent; ctx.fillText(f.title, w / 2, ty + 24); ty += 56; }
  ctx.font = RULE.text; ctx.letterSpacing = "0px"; ctx.fillStyle = "#fff";
  L.lines.forEach((ln, i) => ctx.fillText(ln, w / 2, ty + RULE.lh * (i + 0.5)));
  ctx.restore();
}

// --- the vote card
const VOTE = { q: '900 52px "CapBlack"', qlh: 60, opt: '900 54px "CapBlack"', key: '900 46px "CapBlack"', prompt: '900 44px "CapBlack"', pad: 36, w: 800, optH: 92, gap: 16 };
function voteLayout(ctx, f) {
  ctx.save(); ctx.font = VOTE.q; ctx.letterSpacing = "0px";
  const q = wrap(ctx, f.question || "", VOTE.w - VOTE.pad * 2);
  ctx.restore();
  const n = (f.options || []).length, hasPrompt = f.prompt !== false;
  const h = VOTE.pad + q.length * VOTE.qlh + 22 + n * VOTE.optH + Math.max(0, n - 1) * VOTE.gap + (hasPrompt ? 22 + 56 : 0) + VOTE.pad;
  const y = clamp(f.y ?? 330, SAFE.y0 + 12, SAFE.y1 - 12 - h), w = Math.min(VOTE.w, SAFE.x1 - SAFE.x0 - 24);
  return { q, box: [Math.round(CX - w / 2), Math.round(y), Math.round(w), Math.round(h)] };
}
// a comic speech bubble (the comments icon), centred on 0, 0, r px across
function bubble(ctx, r, fill) {
  ctx.beginPath(); ctx.ellipse(0, -2, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.moveTo(-r * 0.45, r * 0.55); ctx.lineTo(-r * 0.75, r * 1.05); ctx.lineTo(-r * 0.05, r * 0.7);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; for (const dx of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.arc(dx * r, -2, r * 0.11, 0, Math.PI * 2); ctx.fill(); }
}
function drawVote(ctx, f, t, end, accentOf) {
  const L = voteLayout(ctx, f), [x, y, w, h] = L.box, d = f.dur ?? 3, k = t - f.at;
  const kin = clamp(k / 0.22), kout = lasts(f, end) ? 0 : clamp((k - (d - 0.16)) / 0.16);
  const sc = (0.6 + 0.4 * ease("back")(kin)) * (1 - 0.2 * ease("in")(kout)), drift = 5 * Math.sin(k * 2.6) * Math.min(1, k / 0.4);
  ctx.save();
  ctx.globalAlpha = Math.min(1, kin * 2.5) * (1 - ease("in")(kout));
  ctx.translate(x + w / 2, y + h / 2 + drift); ctx.rotate(((f.angle ?? -1.5) * Math.PI) / 180); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
  // the sticker: hard shadow, warm paper, a thick ink edge
  ctx.fillStyle = SHADOW; ctx.beginPath(); ctx.roundRect(12, 14, w, h, 34); ctx.fill();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 34); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  let cy = VOTE.pad;
  ctx.font = VOTE.q; ctx.letterSpacing = "0px"; ctx.fillStyle = INK;
  L.q.forEach((ln, i) => ctx.fillText(ln, w / 2, cy + VOTE.qlh * (i + 0.5)));
  cy += L.q.length * VOTE.qlh + 22;
  (f.options || []).forEach((o, i) => {
    // each option slides up into place 0.09 s after the one before
    const ko = clamp((k - 0.14 - i * 0.09) / 0.2), e = ease("back")(ko), oy = cy + (1 - e) * 26, accent = o.who ? accentOf(o.who) : o.color || ["#ff9f1c", "#4fc3ff", "#6ee86a", "#d17bff"][i % 4];
    ctx.save(); ctx.globalAlpha *= clamp(ko * 2);
    const px = 26, pw = w - 52;
    ctx.fillStyle = "#efe6d6"; ctx.beginPath(); ctx.roundRect(px, oy, pw, VOTE.optH, VOTE.optH / 2); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // the letter in a coloured disc
    const r = VOTE.optH / 2 - 10, kx = px + 10 + r, ky = oy + VOTE.optH / 2;
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(kx, ky, r, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.font = VOTE.key; ctx.fillStyle = INK; ctx.fillText(o.key ?? String.fromCharCode(65 + i), kx, ky + 2);
    ctx.font = VOTE.opt; ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.fillText(o.text ?? "", kx + r + 24, ky + 2);
    ctx.restore();
    cy += VOTE.optH + VOTE.gap;
  });
  if (f.prompt !== false) {
    cy += 22 - VOTE.gap;
    const kp = clamp((k - 0.35) / 0.2), beat = 1 + 0.12 * Math.max(0, Math.sin(Math.max(0, k - 0.5) * Math.PI * 2.5)) ** 4;
    ctx.save(); ctx.globalAlpha *= kp;
    ctx.font = VOTE.prompt; ctx.letterSpacing = "0px";
    const text = f.prompt || `Comment ${(f.options || []).map((o, i) => o.key ?? String.fromCharCode(65 + i)).join(" or ")}`;
    const tw = ctx.measureText(text).width, bx = w / 2 - (tw + 76) / 2 + 26;
    ctx.save(); ctx.translate(bx, cy + 28); ctx.scale(beat, beat); bubble(ctx, 26, "#ffd60a"); ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = "#2b2733"; ctx.fillText(text, bx + 46, cy + 30);
    ctx.restore();
  }
  ctx.restore();
}

export const isCard = (f) => f.do === "rule" || f.do === "vote";

// every card on screen at t, drawn in storyboard order
export function drawCards(ctx, sb, t, accentOf) {
  const end = sb.storyDuration ?? sb.duration ?? Infinity;
  for (const f of sb.fx || []) {
    if (!isCard(f) || !on(f, t, end)) continue;
    if (f.do === "rule") drawRule(ctx, f, t, end, accentOf); else drawVote(ctx, f, t, end, accentOf);
  }
}
// their boxes for the layout (the biggest the card gets: its place without the pop or drift)
export function cardBoxes(ctx, sb, t) {
  const end = sb.storyDuration ?? sb.duration ?? Infinity;
  return (sb.fx || []).filter((f) => isCard(f) && on(f, t, end)).map((f) => ({ text: f.do === "rule" ? f.title || f.text : f.question, box: (f.do === "rule" ? ruleLayout(ctx, f) : voteLayout(ctx, f)).box, card: true }));
}
// what the frame cache keys on: which cards are up and how far into each
export const cardKey = (sb, t) => { const end = sb.storyDuration ?? sb.duration ?? Infinity; const a = (sb.fx || []).filter((f) => isCard(f) && on(f, t, end)).map((f) => Math.round((t - f.at) * 1e4)); return a.length ? a.join(",") : ""; };
