// Why a hand pops (hands thread, 5 Nov 2026, Jonny: "park the elbow, flag the causes"). With hand rig 2 every hand
// that still turns over 60 degrees in one frame on the ten 4-5 Nov clips was one of three things, none of them fixable
// in the rig, so the hand-pop and hand-turn lines name the cause and its fix:
//
//   body turn   the hand barely moves against the body (under 2 cm a frame) while the whole body turns, or the body
//               turns 20 degrees or more in one frame: the hand turns with it. Fix: turn the body over more frames, or cut
//   hand jump   the hand moves 10 cm or more against the body in one frame (15-58 cm in 13 of the 25), or is in the
//               slower tail of such a move: the move is too short. Fix: give it at least one frame per 10 cm
//   frame 0     the hand moves out of the first frame: a pose written at t = 0 with a short dur. Fix: dur 0
//               ("cleanStart": true, on in the template)
//   wrist       the hold asks for more turn than a wrist has (the layout's dbg lim over 1.5) while the palm or fist
//               weight is still rising, reached at speed. Fix: approach the hold from its own side, or slow the last
//               0.2 s into it
//
// The hand is followed in the body's own space: the layout's world position minus the actor's position, turned back
// by its yaw (timeline.js actorState, the same numbers the page draws from; checked against the layout's cross.x,
// 2 mm median). Pure and deterministic.
import { actorState } from "../engine/page/timeline.js";
import { storyTime } from "../engine/shared/holds.js";

export const CAUSE = { still: 2, jump: 10, perFrame: 10, wrist: 1.5, yaw: 3, bigTurn: 20 };

export const FIX = {
  "frame 0": "set the pose at t = 0 with dur 0 (\"cleanStart\": true does it)",
  "body turn": "turn the body over more frames, or cut",
  "hand jump": "give the move more frames (about 10 cm a frame at most)",
  wrist: "the hold asks for more turn than a wrist has: approach it from its own side, or slow the last 0.2 s into it",
};

// a function (id, side, frame) -> { kind, text } | null, for one layout; null when the storyboard or characters are missing
export function popCauses(sb, rows, chars, fps = 30) {
  if (!sb || !chars) return () => null;
  const cast = new Map((sb.cast || []).map((c) => [c.id, c])), memo = new Map();
  const state = (id, i) => {
    const k = `${id}|${i}`;
    if (!memo.has(k)) {
      const c = cast.get(id), def = c && chars[c.character];
      let st = null;
      try { st = def ? actorState(sb, c, def, storyTime(sb.holds, i / fps)) : null; } catch { st = null; }
      memo.set(k, st);
    }
    return memo.get(k);
  };
  // the hand s of id at frame i in the body's space, in cm; null when it can't be placed
  const local = (id, s, i) => {
    const a = rows[i]?.actors?.find((x) => x.id === id), h = a?.w?.[`h${s}`], st = state(id, i);
    if (!h || !st) return null;
    const dx = h[0] / 1000 - st.x, dy = h[1] / 1000 - (st.y ?? 0), dz = h[2] / 1000 - st.z, y = st.yaw ?? 0;
    return [(Math.cos(y) * dx - Math.sin(y) * dz) * 100, dy * 100, (Math.sin(y) * dx + Math.cos(y) * dz) * 100];
  };
  const step = (id, s, i) => { const p = local(id, s, i - 1), q = local(id, s, i); return p && q ? Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) : null; };
  const dbg = (id, s, i) => rows[i]?.actors?.find((x) => x.id === id)?.dbg?.[s] || null;
  return (id, s, i) => {
    const d = step(id, s, i);
    if (d == null) return null;
    // out of frame 0: a pose written at t = 0 with a short dur (the clean start makes it dur 0)
    // (and the few frames after it, where the hand rig's smoothing still turns the hand toward the new pose)
    if (i === 1 && d >= CAUSE.still) return { kind: "frame 0", size: d, text: `out of frame 0, ${Math.round(d)} cm` };
    if (i <= 4 && (step(id, s, 1) ?? 0) >= CAUSE.jump) return { kind: "frame 0", size: step(id, s, 1), text: "settling after frame 0" };
    // the fast stretch around this frame: the frames moving over half the limit; a hand jump when any of them moves
    // the limit or more (the frame itself may be the stretch's slower tail)
    if (d > CAUSE.perFrame / 2) {
      let a = i, b = i, sum = d, top = d;
      while (a > 1 && (step(id, s, a - 1) ?? 0) > CAUSE.perFrame / 2 && i - a < 15) { a--; sum += step(id, s, a); top = Math.max(top, step(id, s, a)); }
      while ((step(id, s, b + 1) ?? 0) > CAUSE.perFrame / 2 && b - i < 15) { b++; sum += step(id, s, b); top = Math.max(top, step(id, s, b)); }
      if (top >= CAUSE.jump) {
        const need = Math.ceil(sum / CAUSE.perFrame), has = b - a + 1;
        return { kind: "hand jump", size: top, text: `hand jump ${Math.round(d)} cm`, fix: `${Math.round(sum)} cm in ${has} frame${has > 1 ? "s" : ""}: give it ${need} or more` };
      }
    }
    const g = dbg(id, s, i), g0 = dbg(id, s, i - 1);
    const rising = g && g0 && ((g.pal ?? 0) > (g0.pal ?? 0) + 1e-6 || (g.w ?? 0) > (g0.w ?? 0) + 1e-6);
    if (g?.lim > CAUSE.wrist && rising) return { kind: "wrist", size: g.lim, text: `wrist ${g.lim}` };
    const s0 = state(id, i - 1), s1 = state(id, i), yaw = s0 && s1 ? Math.abs(((s1.yaw - s0.yaw + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI : 0;
    // the body turning: with the hand still against it, or turning so fast (bigTurn a frame) the hand's own move is small
    if ((d < CAUSE.still && yaw >= CAUSE.yaw) || yaw >= CAUSE.bigTurn) return { kind: "body turn", size: yaw, text: `body turns ${Math.round(yaw)}°` };
    if (g?.lim > CAUSE.wrist) return { kind: "wrist", size: g.lim, text: `wrist ${g.lim}` };
    return null;
  };
}

// "1.23s (143°, body turns 25°)" for a list of { t, d, cause }
export const popList = (list, n = 6) => list.slice(0, n).map((p) => `${p.t.toFixed(2)}s (${Math.round(p.d)}°${p.cause ? `, ${p.cause.text}` : ""})`).join(", ") + (list.length > n ? ` … (${list.length} frames)` : "");

// the fixes for the causes in a list, one clause each: "body turn: turn the body over more frames, or cut; ..."
export function popFixes(list) {
  const kinds = [...new Set(list.map((p) => p.cause?.kind).filter(Boolean))];
  return kinds.map((k) => {
    if (k === "hand jump") {
      const worst = list.filter((p) => p.cause?.kind === k).sort((a, b) => b.cause.size - a.cause.size)[0];
      return `hand jump: ${FIX[k]} (at ${worst.t.toFixed(2)}s ${worst.cause.fix})`;
    }
    return `${k}: ${FIX[k]}`;
  }).join("; ");
}
