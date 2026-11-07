// The drawn 2D layer's automatic marks ("anime2d", opt-in; look-2d-layer-01, 7 Nov 2026). Anime and manga draw a
// character's feeling as marks next to the head (manpu): a throbbing cross vein when annoyed, a big sweat drop when
// nervous, short shock lines when startled, vertical gloom lines over the forehead when crushed; an inked star on a
// hit (act.impact), drawn dust where a landing meets the floor. Drawn by hand on top
// of the 3D picture in anime studios, and here by engine/page/fx2d.js on the 2D layer.
//
//   "anime2d": true                         every mark below, from the storyboard's own expressions and landings
//   "anime2d": { "vein": true, "drop": true, "shock": true, "gloom": true, "dust": true, "burst": true, "smear": true }
//                                           pick (false turns one off); "smear" is the drawn smear frame (fx2d.js)
//
// anime2dFx(sb) reads the flat storyboard (after compile) and returns the fx items to add: each is an ordinary fx item
// ({ do: "vein", who, at, dur }), so a storyboard can also write them by hand, and every qa/ tool and the frame cache see
// the same list. An item written by hand for the same character within 1.5 s wins over an automatic one.

export const ANIME2D_KINDS = ["vein", "drop", "shock", "gloom", "dust", "burst"];

// which mark a facial expression draws (face.js EXPRESSIONS plus the presets clips use)
const MARK = {
  annoyed: "vein", angry: "vein", stern: "vein", furious: "vein",
  worried: "drop", nervous: "drop", terrified: "drop", scared: "drop", dizzy: "drop",
  shocked: "shock", surprised: "shock",
  sad: "gloom", defeated: "gloom", deadpan: null,
};
const DUR = { vein: 1.1, drop: 1.3, shock: 0.5, gloom: 1.4, dust: 0.6 };

export function anime2dOn(sb) {
  const o = sb && sb.anime2d;
  if (!o) return null;
  const all = { vein: true, drop: true, shock: true, gloom: true, dust: true, burst: true, smear: true };
  return o === true ? all : { ...all, ...o };
}

export function anime2dFx(sb) {
  const on = anime2dOn(sb);
  if (!on) return [];
  const acts = (sb.actions || []).filter((a) => a.who).sort((a, b) => a.at - b.at), out = [];
  const hand = (sb.fx || []).filter((f) => ANIME2D_KINDS.includes(f.do));
  const taken = (who, kind, at) => hand.some((f) => f.who === who && f.do === kind && Math.abs(f.at - at) < 1.5)
    || out.some((f) => f.who === who && f.do === kind && at - f.at < f.dur + 0.4);
  const nextExpr = (a) => acts.find((b) => b.who === a.who && b.do === "expr" && b.at > a.at + 0.05);
  for (const a of acts) {
    // a pose the clip opens in (a move of 0.01 s at t = 0, cleanStart) is the frame-0 state, not a reaction
    if (a.at < 0.05) continue;
    let kind = null, at = a.at, dur;
    if (a.do === "expr") kind = MARK[a.expr] ?? null;
    else if (a.do === "talk" && a.tone === "angry") kind = "vein";
    else if (a.do === "land" || (a.do === "hop" && (a.height ?? 0) >= 0.28)) { kind = "dust"; at = a.at + (a.do === "hop" ? a.dur ?? 0.4 : (a.dur ?? 0.14) * 0.9); }
    if (!kind || on[kind] === false || taken(a.who, kind, at)) continue;
    if (kind === "vein" || kind === "drop" || kind === "gloom") {
      // the mark stays while the face does: until the next expression (at least 0.6 s, at most 1.8 s)
      const n = nextExpr(a), hold = n ? n.at - a.at : DUR[kind];
      dur = Math.min(1.8, Math.max(0.6, hold));
      if (kind === "drop") at += 0.08;
    } else dur = DUR[kind];
    if (at + 0.1 > (sb.storyDuration ?? sb.duration ?? Infinity)) continue;
    // a whole row startled at once: the marks on three faces read, five turn the frame into noise (the leads keep theirs:
    // cast order)
    if (out.filter((f) => f.do === kind && Math.abs(f.at - at) < 0.15).length >= 3) continue;
    out.push({ do: kind, who: a.who, at: Math.round(at * 1000) / 1000, dur: Math.round(dur * 1000) / 1000, auto: true });
  }
  // a hit (act.impact: an "impact" frame and a deep squash on who was hit) gets an inked impact star on that head
  if (on.burst !== false) for (const f of (sb.fx || []).filter((x) => x.do === "impact")) {
    const q = acts.find((a) => a.do === "squash" && (a.amount ?? 0) >= 0.2 && Math.abs(a.at - f.at) < 0.1);
    if (q && !taken(q.who, "burst", f.at)) out.push({ do: "burst", who: q.who, where: "top", size: 0.7, at: f.at, dur: 0.2, auto: true });
  }
  if (on.smear !== false) out.push({ do: "smear2d", at: 0, dur: sb.storyDuration ?? sb.duration ?? 60, ...(typeof on.smear === "object" ? on.smear : {}), auto: true });
  return out;
}
