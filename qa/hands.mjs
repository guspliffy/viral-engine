// Hand moves against the numbers in docs/rules/workflow.md "Hands" (9 Nov 2026). Never Has Money 04 passed every check
// while Jonny saw the hands: a hand-turn fails only over 90° in one frame and rig-jump only finds a step much bigger than
// its neighbours, so a hand sent 24-68 cm in 2-3 frames ("And yours?", the pocket slap, the coupon switch, the hug) or a
// palm flipped 81° in one frame went through. The rule is a number, so it is checked as one:
//
//   hand-jump   a hand move (against its own body, so a walk or a car ride doesn't count) gets at least one frame per
//               GATE.handTravel metres it travels: a 66 cm reach is 7 frames, not 3.
//   palm-turn   a hand that turns GATE.palmTurn degrees or more does it over at least GATE.palmFrames frames.
//
// Both judge only what anyone sees: the hand on screen, no cut inside the move, and not smeared by the motion blur
// (GATE.blurPx a frame, engine/render.mjs BLUR; the pocket slap, 66 cm in a frame, is one smear in every cut).
// Measured on the three EP04 cuts (9 Nov), against Jonny's "old has cleaner hands": palm turns old 1, director's cut 12,
// Fable's 12; hand moves 2+ frames short old 13, director's 30, Fable's 21. So palm-turn is a visible glitch
// (GATE.visible: warn at gate 1, fail at "gate": 2 with "rig": { "hand": 2 }, like hand-turn) and hand-jump a warning
// that needs its one-line reason in the delivery. Fix them (more frames, hold to hold, a palm turn spread out), or name
// the beat in an allowClip window ("checks": ["palm-turn"] or ["hand-jump"]) with a reason.
import { GATE, gateLevel, windowFor } from "./gate.mjs";
import { cutIn, proj } from "./rig.mjs";
import { storyTime } from "../engine/shared/holds.js";

const MOVING = 20;     // mm a frame (at 30 fps): below this a hand is holding still, between two moves
const TURNING = 10;    // degrees a frame: below this a hand isn't turning
// a move this many frames short of one frame per GATE.handTravel is reported (one short is easing; tuned on Never Has
// Money 04, 9 Nov: moves 2+ frames short, on screen and unsmeared, old cut 13, director's cut 30, Fable's 21)
const SHORT = 2;

const turn = (p, q) => 2 * Math.acos(Math.min(1, Math.abs(p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3]))) * 180 / Math.PI;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// the hand's position against its own body, in mm (layout contact rows keep world mm in w: hR, hL, b)
const rel = (a, s) => (a?.w?.[`h${s}`] && a.w.b ? a.w[`h${s}`].map((v, j) => v - a.w.b[j]) : null);

// runs of consecutive intervals i (frame i-1 -> i) where pick(i) holds, as [first, last] interval indexes
function runs(n, pick) {
  const out = []; let a = -1;
  for (let i = 1; i < n; i++) { if (pick(i) && a < 0) a = i; if (!pick(i) && a >= 0) { out.push([a, i - 1]); a = -1; } }
  if (a >= 0) out.push([a, n - 1]);
  return out;
}

export function handResults(layout, sb = null) {
  const rows = layout?.contacts || [], out = [];
  if (!rows.length || !sb) return out;
  const fps = layout.fps || 30, n = rows.length, T = (i) => rows[i]?.t ?? i / fps, P = proj(sb);
  const ids = [...new Set(rows.flatMap((r) => (r.actors || []).map((a) => a.id)))];
  const travelLim = GATE.handTravel * 1000 * 30 / fps;   // mm a frame
  const onScreen = (p) => p && p[0] >= 0 && p[0] <= (layout.width || 1080) && p[1] >= 0 && p[1] <= (layout.height || 1920);
  const cut = (i) => cutIn(sb, storyTime(sb.holds, T(i - 1)), storyTime(sb.holds, T(i)));
  const level = gateLevel(sb, "hands");
  const span = (a, b) => `${T(a - 1).toFixed(2)}-${T(b).toFixed(2)}s`;
  for (const id of ids) {
    const st = rows.map((r) => (r.actors || []).find((a) => a.id === id) || null);
    // a move anyone sees: the hand on screen at both ends of each step, no cut inside it, slower than the blur
    const seen = (s, a, b) => {
      let px = 0;
      for (let i = a; i <= b; i++) {
        const x = st[i - 1], y = st[i];
        if (!x || !y || y.on === 0 || cut(i)) return { ok: false };
        const p0 = P(T(i - 1), x.w[`h${s}`]), p1 = P(T(i), y.w[`h${s}`]);
        if (!onScreen(p0) || !onScreen(p1)) return { ok: false };
        px = Math.max(px, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
      }
      return { ok: px < GATE.blurPx, px };
    };
    for (const s of ["R", "L"]) {
      // hand-jump: each move (a run of frames the hand travels against its body) against the frames it needs
      const step = (i) => { const p = rel(st[i - 1], s), q = rel(st[i], s); return p && q ? dist(p, q) : 0; };
      const jumps = [];
      for (const [a, b] of runs(n, (i) => step(i) > MOVING * 30 / fps)) {
        let len = 0, peak = 0; for (let i = a; i <= b; i++) { const d = step(i); len += d; peak = Math.max(peak, d); }
        const frames = b - a + 1, need = Math.ceil(len / travelLim);
        if (need - frames < SHORT || peak <= travelLim) continue;
        const v = seen(s, a, b);
        if (!v.ok || windowFor(sb, "hand-jump", id, T(a))) continue;
        jumps.push({ a, b, len, frames, need });
      }
      if (jumps.length) out.push({ level: "warn", check: "hand-jump", msg: `${id}: hand ${s} moves too far for its frames on screen at ${jumps.slice(0, 6).map((j) => `${span(j.a, j.b)} (${Math.round(j.len / 10)} cm in ${j.frames} frame${j.frames > 1 ? "s" : ""}, needs ${j.need})`).join(", ")}${jumps.length > 6 ? ` … (${jumps.length} moves)` : ""}: give every move one frame per ${Math.round(GATE.handTravel * 100)} cm and go hold to hold (workflow.md "Hands"), or name it in an allowClip window ("checks": ["hand-jump"]) with a reason` });

      // palm-turn: each turn (a run of frames the hand turns) against GATE.palmFrames
      const deg = (i) => (st[i - 1]?.q?.[s] && st[i]?.q?.[s] ? turn(st[i - 1].q[s], st[i].q[s]) : 0);
      const flips = [];
      for (const [a, b] of runs(n, (i) => deg(i) > TURNING)) {
        const total = turn(st[a - 1].q[s], st[b].q[s]), frames = b - a + 2;   // the frames the turn is drawn on, both ends
        if (total < GATE.palmTurn || frames >= GATE.palmFrames) continue;
        const v = seen(s, a, b);
        if (!v.ok || windowFor(sb, "palm-turn", id, T(a))) continue;
        flips.push({ a, b, total, frames });
      }
      if (flips.length) out.push({ level, check: "palm-turn", msg: `${id}: hand ${s} turns too fast on screen at ${flips.slice(0, 6).map((f) => `${span(f.a, f.b)} (${Math.round(f.total)}° in ${f.frames} frames)`).join(", ")}${flips.length > 6 ? ` … (${flips.length} turns)` : ""}: spread a palm turn over ${GATE.palmFrames}-8 frames with the same palm side through it (workflow.md "Hands"); a hand flip on screen is never waived (workflow.md "Check windows")` });
    }
  }
  if (!out.length && rows.some((r) => (r.actors || []).some((a) => a.w?.hR))) out.push({ level: "pass", check: "hand-jump", msg: `hand moves on screen get one frame per ${Math.round(GATE.handTravel * 100)} cm, palm turns ${GATE.palmFrames}+ frames` });
  return out;
}
