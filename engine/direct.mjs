// Directed camera: shots chosen from the story instead of typed in by hand. A beat storyboard with a "direct" block
// gets a camera from each beat's kind and who acts in it (docs/STORYBOARD.md, "Directed camera"):
//
//   setup (hook, try, escalation, a beat with no kind)  medium on everyone in the scene
//   payoff                                              snap-in: a fast push from wherever the camera is to a
//                                                       medium close-up on the payoff's actor, starting on its action
//   reaction                                            close-up on who reacts, with a slow 4 % push
//   reveal                                              wide
//   the last beat of a loop clip                        the opening shot again, so the last frame runs into the first
//
// Framing comes from where the characters are (timeline.js, the same state the renderer draws): the acting face's
// eye line sits on the upper third, the top of every head in shot (hat or crest included) keeps its headroom and
// stays under a caption, feet stay above the app's caption bar, and a close-up leaves look room on the side the
// character faces. Every shot keeps the master camera's direction, so the camera never crosses the line.
// Cuts land on action: a cut moves to two frames into the nearest move, turn or reach of who acts (within 0.35 s of
// the beat), and two shots that would differ by less than a jump-cut's worth stay one shot. When a music beat is within
// two frames of that cut and still between one and four frames into the move, the cut goes onto the beat (the grid
// comes from music.mjs lockMusic, the same one the render locks the music to); action beats beat-sync.
//
//   "direct": { "master": { "pos": [...], "look": [...], "fov": 36 }, "push": 0.04, "snap": 0.22, "beatCuts": true }
//   a beat:   "kind": "reaction", "who": "wiz"                 (who: optional, else the actor who does the most)
//             "shot": { "size": "close", "who": "wiz", "push": 0.05 } or "shot": "keep" or a plain camera
//
// Runs after compile (engine/load.mjs), so the renderer and every qa/ tool see the same resolved shots.
import { actorState } from "./page/timeline.js";
import { ease } from "./page/util.js";
import { lockMusic } from "./music.mjs";

const r3 = (x) => Math.round(x * 1000) / 1000;
const LEG_H = 0.14, EYE_K = 0.56;   // potato.js: legs, and the eyes' height on the body (measured from the layout)
// what sits above the body top: the wizard hat, Phoenix's crest, helmets and hoods (measured from the layout)
const ABOVE = { wizard: 0.64, phoenix: 0.28, allfather: 0.3, astronaut: 0.22, cowboy: 0.2, viking: 0.25, samurai: 0.15, reaper: 0.15, sorcerer: 0.2, dragon: 0.2 };

// shot sizes: V = the height of the picture at the subject (metres), eye = where the eye line goes (share of the
// frame from the top), feet = the lowest the feet may sit (the app's caption bar covers the bottom ~29 %),
// head = which top keeps its headroom ("hat": hat included, "body": a close-up may crop a tall hat), fit = everyone
// in it fits the width ("faces": every face fits and the outer sides of the bodies may crop; a close-up crops)
export const SIZES = {
  wide:   { V: 3.6, eye: 1 / 3, feet: 0.72, head: "hat", fit: true },
  medium: { V: 2.7, eye: 1 / 3, feet: 0.72, head: "hat", fit: true },
  mcu:    { V: 2.0, eye: 0.35, feet: null, head: "hat", fit: "faces" },
  close:  { V: 1.55, eye: 0.36, feet: null, head: "body" },
};
const KIND_SIZE = { payoff: "mcu", reaction: "close", reveal: "wide" };
const HEADROOM = 0.03, EYE_GIVE = 0.08, SIDE = 0.08, FACE = 0.3;   // headroom (share of the frame), how far the eye line may drop to keep it, side margin (m)
const JUMP = 1.4;    // two framings closer than this in size (and centre) would be a jump cut: keep one shot
const MIN_SHOT = 0.7;   // seconds: never cut sooner than this after the last cut
// actions a cut can ride on (a body movement, not an eye or face change)
const MOTION = new Set(["move", "run", "turn", "crouch", "stand", "sit", "hop", "fly", "land", "grab", "arm", "drop", "kneel", "throw", "swing", "slash", "charge"]);
// how much each kind of action counts toward "who acts" in a beat
const WEIGHT = { talk: 4, expr: 3, move: 2, crouch: 2, grab: 2, fly: 2, sit: 2, hop: 2, land: 2, turn: 1, arm: 1, face: 1, squash: 0.5, look: 0.5 };

// one character's anchors at time t (world metres): eyes, top (hat or body), feet, half width, facing
function anchors(sb, c, def, t) {
  const st = actorState(sb, c, def, t), s = st.scale ?? 1, H = def.body.height, q = st.squash ?? 1;
  const eyeY = st.y + s * (LEG_H + EYE_K * H * q), bodyTop = st.y + s * (LEG_H + H * q);
  const fwd = 0.33 * s, yaw = st.yaw ?? 0;
  return {
    x: st.x + Math.sin(yaw) * fwd * 0.3, z: st.z + Math.cos(yaw) * fwd, eye: eyeY, body: bodyTop,
    hat: st.hatOn === false ? bodyTop : bodyTop + s * (ABOVE[def.costume?.type] ?? 0.1), feet: st.y,
    half: s * (def.body.width / 2 + (def.costume?.type === "phoenix" ? 0.08 + 0.3 * (st.span ?? 1) * Math.min(1, st.wings ?? 0) : 0.05)),
    yaw, visible: st.visible !== false,
  };
}

// who acts in [t0, t1): the actors whose actions add up to most of the beat
function actorsIn(sb, t0, t1) {
  const score = {};
  for (const a of sb.actions || []) if (a.who && a.at >= t0 - 1e-6 && a.at < t1 - 1e-6) score[a.who] = (score[a.who] || 0) + (WEIGHT[a.do] ?? 0.5);
  const best = Math.max(0, ...Object.values(score));
  return Object.keys(score).filter((k) => score[k] >= 0.6 * best).sort((a, b) => score[b] - score[a]);
}

// the camera that frames `who` over [t0, t1) at a size; `eyeOf` is the actor whose eye line goes on the third
function frame(sb, ctx, { who, size, eyeOf, t0, t1, caps }) {
  const Z = SIZES[size] || SIZES.medium, { D, fov } = ctx, k = 2 * Math.tan((fov * Math.PI) / 360);
  const samples = [];
  for (let t = t0 + 0.05; t < t1 - 1e-6 || samples.length === 0; t += 0.1) for (const id of who) {
    const c = ctx.cast[id]; if (!c) continue;
    const a = anchors(sb, c, ctx.chars[c.character], Math.min(t, t1 - 0.01)); if (a.visible) samples.push({ id, t, ...a });
  }
  if (!samples.length) return null;
  const mine = samples.filter((s) => s.id === eyeOf), lead = mine.length ? mine : samples;
  // the eye line: where the faces spend the shot (medians, so a brief hop doesn't move the frame); in a group shot
  // the highest face sits on the third and the others below it
  const median = (id) => { const e = samples.filter((s) => s.id === id).map((s) => s.eye).sort((a, b) => a - b); return e[e.length >> 1]; };
  const E = who.length > 1 ? Math.max(...who.filter((id) => samples.some((s) => s.id === id)).map(median)) : median(lead[0].id);
  const T = Math.max(...samples.map((s) => (Z.head === "body" && s.id === eyeOf ? s.body : s.hat)));
  const F = Math.min(...samples.map((s) => s.feet));
  const half = (s) => (Z.fit === "faces" ? FACE : s.half);
  const x0 = Math.min(...samples.map((s) => s.x - half(s))), x1 = Math.max(...samples.map((s) => s.x + half(s)));
  const zc = samples.reduce((m, s) => m + s.z, 0) / samples.length;
  // a caption over the shot: heads (and a hat's brim) stay under its box; a hat's tip may reach into it
  const capBottom = Math.max(0, ...caps.filter((c) => c.from < t1 && c.to > t0).map((c) => (c.pos ?? 250) + 90 * Math.max(1, Math.ceil(String(c.text).length / 20)) + 20)) / 1920;
  const Tc = Math.max(...samples.map((s) => Math.min(s.hat, s.body + 0.1)));
  // the smallest picture that fits: the size's own, the width of everyone in it, the head and feet room
  let V = Math.max(Z.V, Z.fit && who.length > 1 ? ((x1 - x0) + 2 * SIDE) * 16 / 9 : 0);
  V = Math.max(V, (T - E) / (Z.eye + EYE_GIVE - HEADROOM));
  if (capBottom) V = Math.max(V, (Tc - E) / (Z.eye + EYE_GIVE - capBottom));
  if (Z.feet != null) V = Math.max(V, (T - F) / (Z.feet - HEADROOM), (E - F) / (Z.feet - Z.eye));
  const top = Math.max(HEADROOM + (T - E) / V, capBottom ? capBottom + (Tc - E) / V : 0);
  // the eye line, dropped as little as the headroom needs; a wide picture (set by the width) also drops it until the
  // feet are near the bottom of the safe zone rather than leaving half the frame to the floor
  const f = Math.max(Z.eye, top, Z.feet != null ? Math.min(0.45, 0.6 - (E - F) / V) : 0);
  // look room: a single face in a close-up sits a little off centre, away from where it faces
  const W = V * 9 / 16, single = who.length === 1 && Z.head === "body";
  const yaw = single ? lead[0].yaw : 0, cx = single ? lead[0].x + Math.max(-1, Math.min(1, 1.6 * Math.sin(yaw))) * (W / 6) * 0.8 : (x0 + x1) / 2;
  const look = [cx, E - (0.5 - f) * V, zc], d = V / k;
  return { pos: look.map((v, i) => r3(v + D[i] * d)), look: look.map(r3), fov, V, size, who };
}

// the camera state a shot list gives at t (timeline.js cameraState without the shake)
function camAt(shots, t) {
  const s = [...shots].filter((q) => q.at <= t + 1e-6).pop(); if (!s) return null;
  if (!s.to) return s;
  const e = ease(s.ease || "inOut")(Math.min(1, Math.max(0, (t - s.at) / (s.dur ?? 1))));
  const L = (a, b) => a.map((v, i) => v + ((b ?? a)[i] - v) * e);
  return { pos: L(s.pos, s.to.pos), look: L(s.look, s.to.look), fov: (s.fov ?? 32) + ((s.to.fov ?? s.fov ?? 32) - (s.fov ?? 32)) * e };
}

// the height of the picture at the look point (metres)
const heightOf = (c) => Math.hypot(...c.pos.map((v, i) => v - c.look[i])) * 2 * Math.tan(((c.fov ?? 32) * Math.PI) / 360);
// is b a jump cut from a? (same axis, size and centre too close)
const jump = (a, b) => {
  const Va = heightOf(a), Vb = heightOf(b), ratio = Math.max(Va, Vb) / Math.min(Va, Vb), shift = Math.hypot(a.look[0] - b.look[0], a.look[1] - b.look[1]);
  return ratio < JUMP && shift < 0.15 * Math.min(Va, Vb);
};

// the start of the nearest body movement of `who` near t: a cut rides on it, two frames in ({ c: the cut, at: the
// move's start }, or null)
function onAction(sb, who, t, lo, hi, fps) {
  let best = null;
  for (const a of sb.actions || []) {
    if (!who.includes(a.who) || !MOTION.has(a.do)) continue;
    const c = a.at + 2 / fps;
    if (a.at < t - 0.35 || a.at > t + 0.35 + 1e-6 || c < lo || c > hi) continue;
    if (!best || Math.abs(c - t) < Math.abs(best.c - t)) best = { c, at: a.at };
  }
  return best;
}

// the music's beat times over the clip (seconds), from the grid music.mjs locks the bed to; [] without a grid (no
// music, a trend sound, a file bed with a pinned skip)
export function beatGrid(sb) {
  const m = lockMusic(sb), dur = sb.duration;
  const bpm = m && (m.lock?.bpm ?? (m.file ? null : m.bpm)), off = m && (m.lock?.offset ?? m.offset);
  if (!bpm || off == null) return [];
  const spb = 60 / bpm, out = [], from = m.from ?? 0, until = m.until ?? dur;
  for (let k = Math.ceil((from - off) / spb - 1e-9); off + k * spb <= until + 1e-9; k++) out.push(off + k * spb);
  return out;
}

// a cut on action moved onto a music beat: a beat within two frames of the cut, still one to four frames into the move
// and inside [lo, hi], wins; the cut lands on the frame that shows the beat. Returns { c, onBeat }
const nearest = (grid, t) => grid.reduce((b, g) => (b == null || Math.abs(g - t) < Math.abs(b - t) ? g : b), null);
function toBeat(cut, grid, fps, lo, hi, snap = true) {
  if (!cut || !grid.length || !snap) return { c: cut?.c, onBeat: false };
  const b = nearest(grid, cut.c), f = Math.round(b * fps) / fps, t = Math.floor(f * 1000 + 1e-6) / 1000;   // never past the frame
  if (Math.abs(b - cut.c) <= 2 / fps + 1e-6 && f >= cut.at + 1 / fps - 1e-6 && f <= cut.at + 4 / fps + 1e-6 && t >= lo - 1e-6 && t <= hi + 1e-6) return { c: t, onBeat: true };
  return { c: cut.c, onBeat: false };
}
// a cut's distance to the nearest beat in ms (for reviews), or nothing without a grid
const beatMs = (grid, t) => (grid.length ? { beatMs: Math.round((t - nearest(grid, t)) * 1000) } : {});

// resolves the directed shots ({ direct, at } placeholders from compile.mjs) into cameras. Returns sb with
// sb.shots replaced and sb.directed listing what was chosen (for reviews and qa).
export function direct(sb, chars) {
  if (!sb.direct || !(sb.shots || []).some((s) => s.direct)) return sb;
  const fps = sb.fps ?? 30, dur = sb.duration, cfg = sb.direct === true ? {} : sb.direct;
  const master = cfg.master || (sb.shots || []).find((s) => s.pos) || { pos: [0, 0.97, 5.9], look: [0, 0.76, 0], fov: 36 };
  const dv = master.pos.map((v, i) => v - master.look[i]), n = Math.hypot(...dv);
  const ctx = { D: dv.map((v) => v / n), fov: master.fov ?? 36, cast: Object.fromEntries((sb.cast || []).map((c) => [c.id, c])), chars };
  const caps = sb.captions || [], all = (sb.cast || []).map((c) => c.id);
  const plan = [...sb.shots].sort((a, b) => a.at - b.at).map((s, i, L) => ({ ...s, end: L[i + 1]?.at ?? dur }));
  const grid = beatGrid(sb), snapBeats = cfg.beatCuts !== false;

  // 1. what each beat wants: a size, a subject, how it moves
  const want = plan.map((s, i) => {
    if (!s.direct) return { s, fixed: true };
    const d = s.direct, kind = d.kind;
    // the payoff: everyone who does something big in its first 0.6 s (the joke and the reaction to it), first first
    const quick = kind === "payoff" ? [...new Set((sb.actions || []).filter((a) => a.who && (WEIGHT[a.do] ?? 0) >= 2 && a.at >= s.at - 1e-6 && a.at < s.at + 0.6).map((a) => a.who))] : [];
    const acting = d.who ? [].concat(d.who) : quick.length ? quick : actorsIn(sb, s.at, s.end);
    const loopTail = sb.loop && i === plan.length - 1 && i > 0 && !d.size && !kind?.match(/payoff|reaction|reveal/);
    const size = d.size || KIND_SIZE[kind] || "medium";
    // a medium or wide shot holds everyone in the scene, a medium close-up (the payoff) the faces of who acts, a
    // close-up only the lead
    const who = d.frame ? [].concat(d.frame) : size === "medium" || size === "wide" ? all : (size === "close" ? acting.slice(0, 1) : acting.slice(0, 2)).concat(acting.length ? [] : all.slice(0, 1));
    return { s, kind, size, who, eyeOf: acting[0] || who[0], snap: d.snap ?? (kind === "payoff" ? cfg.snap ?? 0.22 : null), push: d.push ?? (size === "close" ? cfg.push ?? 0.04 : 0), loopTail, acting };
  });

  // 2. the shots, beat by beat: a cut on action to a new framing, a reframe where a cut would be a jump cut
  const out = [], directed = [];
  const cam = (f) => ({ pos: f.pos, look: f.look, fov: f.fov });
  let lastCut = 0;
  want.forEach((w, i) => {
    if (w.fixed) { const { end, ...s } = w.s; out.push(s); lastCut = s.at; return; }
    if (w.s.direct.keep) return;
    const t0 = w.s.at, t1 = w.s.end, note = (o) => directed.push({ at: r3(o.at ?? t0), beat: i, kind: w.kind, size: w.size, ...o, at: r3(o.at ?? t0) });
    if (w.loopTail && out.length) {
      const first = out[0], lo = lastCut + MIN_SHOT, hi = t1 - 0.3, b = toBeat(onAction(sb, all, t0, lo, hi, fps), grid, fps, lo, hi, snapBeats), cut = b.c ?? t0;
      out.push({ at: r3(cut), pos: first.pos, look: first.look, fov: first.fov });
      note({ at: cut, size: "opening", why: "loop: back to the opening shot", onBeat: b.onBeat, ...beatMs(grid, cut) }); lastCut = cut; return;
    }
    const fr = frame(sb, ctx, { who: w.who, size: w.size, eyeOf: w.eyeOf, t0, t1, caps });
    if (!fr) return;
    const movers = w.acting.length ? w.acting : w.who;
    if (w.snap && out.length) {
      // the snap-in starts on the payoff's first big action and moves on from wherever the camera is (no cut)
      const go = (sb.actions || []).filter((a) => w.acting.includes(a.who) && (WEIGHT[a.do] ?? 0) >= 2 && a.at >= t0 - 1e-6 && a.at < t0 + 0.6).map((a) => a.at)[0] ?? t0;
      const from = camAt(out, go);
      out.push({ at: r3(go), pos: from.pos.map(r3), look: from.look.map(r3), fov: r3(from.fov), to: cam(fr), dur: w.snap, ease: "out" });
      note({ at: go, who: w.who, why: `snap-in to ${w.size} on ${w.who.join(" + ")} (${w.snap} s)` }); return;
    }
    const prev = out.length ? camAt(out, t0) : null;
    if (prev && !w.push && jump(prev, fr)) {
      // too close to the shot already up for a cut: keep it, or ease it over with the action when the beat needs room
      const Vp = heightOf(prev), Vf = heightOf(fr);
      if (Math.max(Vp, Vf) / Math.min(Vp, Vf) < 1.08 && Math.hypot(prev.look[0] - fr.look[0], prev.look[1] - fr.look[1]) < 0.04 * Vp) { note({ why: "kept the shot (a cut would be a jump cut)" }); return; }
      const go = onAction(sb, movers, t0, t0 - 0.35, t1 - 0.6, fps)?.c ?? t0, from = camAt(out, go), d = r3(Math.min(1.2, t1 - go - 0.2));
      out.push({ at: r3(go), pos: from.pos.map(r3), look: from.look.map(r3), fov: r3(from.fov), to: cam(fr), dur: d, ease: "inOut" });
      note({ at: go, who: w.who, why: `reframed with the action over ${d} s (a cut would be a jump cut)` }); return;
    }
    const lo = lastCut + MIN_SHOT, hi = t1 - MIN_SHOT, b = out.length ? toBeat(onAction(sb, movers, t0, lo, hi, fps), grid, fps, lo, hi, snapBeats) : { c: 0, onBeat: false };
    const cut = b.c ?? t0;
    const shot = { at: r3(cut), ...cam(fr) };
    if (w.push) {
      const k = 1 - w.push, L = fr.look, end = want.slice(i + 1).find((q) => q.fixed || !q.s.direct.keep)?.s.at ?? dur;
      shot.to = { pos: fr.pos.map((v, q) => r3(L[q] + (v - L[q]) * k)) };
      shot.dur = r3(end - cut); shot.ease = "linear";
    }
    out.push(shot); lastCut = cut;
    note({ at: cut, who: w.who, eyeOf: w.eyeOf, ...(cut !== t0 && { cutOnAction: r3(cut - t0) }), ...(w.push && { push: w.push }), ...(out.length > 1 && { onBeat: b.onBeat, ...beatMs(grid, cut) }) });
  });
  return { ...sb, shots: out, directed };
}
