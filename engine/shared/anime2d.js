// The drawn 2D layer's automatic touches ("anime2d", opt-in; look-2d-layer-01, 7 Nov 2026): drawn dust where a landing
// meets the floor, and drawn smear frames on fast moves, drawn by engine/page/fx2d.js on the 2D layer over the 3D
// picture, the way anime studios finish a 3D shot by hand.
//
//   "anime2d": true                         both, from the storyboard's own landings and moves
//   "anime2d": { "dust": false, "smear": { "trail": 3.2, "cap": 1.6, "min": 42 } }   turn one off, or tune the smear
//
// Reaction signs (anger veins, sweat drops, shock lines, gloom, impact stars) were built here first and taken out:
// Jonny, 8 Nov 2026, "i dont like these extra signs everywhere". Feelings stay on the faces.
//
// anime2dFx(sb) reads the flat storyboard (after compile) and returns the fx items to add: each is an ordinary fx item
// ({ do: "dust", who, at, dur }), so a storyboard can also write them by hand, and every qa/ tool and the frame cache see
// the same list. A dust item written by hand for the same character within 1.5 s wins over an automatic one.

export const ANIME2D_KINDS = ["dust"];

export function anime2dOn(sb) {
  const o = sb && sb.anime2d;
  if (!o) return null;
  const all = { dust: true, smear: true };
  return o === true ? all : { ...all, ...o };
}

export function anime2dFx(sb) {
  const on = anime2dOn(sb);
  if (!on) return [];
  const acts = (sb.actions || []).filter((a) => a.who).sort((a, b) => a.at - b.at), out = [];
  const hand = (sb.fx || []).filter((f) => ANIME2D_KINDS.includes(f.do));
  const taken = (who, at) => hand.some((f) => f.who === who && Math.abs(f.at - at) < 1.5) || out.some((f) => f.who === who && at - f.at < f.dur + 0.4);
  if (on.dust !== false) for (const a of acts) {
    // a pose the clip opens in (a move of 0.01 s at t = 0, cleanStart) is the frame-0 state, not a landing
    if (a.at < 0.05) continue;
    if (!(a.do === "land" || (a.do === "hop" && (a.height ?? 0) >= 0.28))) continue;
    const at = a.at + (a.do === "hop" ? a.dur ?? 0.4 : (a.dur ?? 0.14) * 0.9);
    if (at + 0.1 > (sb.storyDuration ?? sb.duration ?? Infinity) || taken(a.who, at)) continue;
    out.push({ do: "dust", who: a.who, at: Math.round(at * 1000) / 1000, dur: 0.6, auto: true });
  }
  if (on.smear !== false) out.push({ do: "smear2d", at: 0, dur: sb.storyDuration ?? sb.duration ?? 60, ...(typeof on.smear === "object" ? on.smear : {}), auto: true });
  return out;
}
