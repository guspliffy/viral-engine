// Directed camera: shots chosen from the story instead of typed in by hand. A beat storyboard with a "direct" block
// gets a camera from each beat's kind and who acts in it (docs/STORYBOARD.md, "Directed camera"):
//
//   setup (hook, try, escalation, a beat with no kind)  medium on everyone in the scene
//   payoff                                              snap-in: a fast push from wherever the camera is to a
//                                                       medium close-up on the payoff's actor, starting on its action
//   reaction                                            close-up on who reacts, with a slow 4 % push
//   reveal                                              wide
//   the last beat of a loop clip                        the opening shot again, so the last frame runs into the first
//   insert                                              the prop the beat is about (or the hand on it), 0.5 m of picture,
//                                                       0.4-0.8 s, then back to the wider shot; never in the first 3 s
//   threat                                              low angle on who acts: the camera at knee height looking up
//                                                       10-15 degrees, a wider lens; once per clip
//   chaos                                               medium with a dutch tilt (10 degrees; "roll" sets 8-15)
//   (by size) ots, top, establishing                    over the shoulder of `over` onto `who`; straight down on a prop;
//                                                       a painted exterior for 0.5 s (never at frame 0)
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
//             "shot": { "size": "insert", "on": "cupcake", "at": [0, 0.12, 0] }   (at: the point on the prop, its own frame)
//             "shot": { "size": "medium", "angle": "low" }   "shot": { "size": "mcu", "roll": -12 }
//             "shot": { "size": "ots", "who": "wiz", "over": "dra" }   "shot": { "size": "top", "on": "cupcake" }
//             "shot": { "size": "establishing", "plate": "assets/plates/autumn-sidewalk.png" }
//
// Runs after compile (engine/load.mjs), so the renderer and every qa/ tool see the same resolved shots.
import fs from "node:fs";
import { actorState } from "./page/timeline.js";
import { propState, gripWorld } from "./page/props3d.js";
import { handTarget } from "./page/potato.js";
import { ease } from "./page/util.js";
import { lockMusic, payoffOf } from "./music.mjs";

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
  // a prop (or the hand on it) filling the frame: picture height at the prop, where the prop's point sits (from the top)
  insert: { V: 0.52, at: 0.45 },
  // over the shoulder: the picture at the far face, its eye line, where it sits across (away from the near one), and
  // how much of the frame the near one's shoulder and head take
  ots: { V: 1.75, eye: 0.36, across: 0.64, near: 0.33 },
  // straight down on a table: the picture at the prop and how far from vertical the camera looks down (degrees)
  top: { V: 0.95, pitch: 80, at: 0.5 },
};
const KIND_SIZE = { payoff: "mcu", reaction: "close", reveal: "wide", insert: "insert", threat: "medium", chaos: "medium" };
const ROLL = [8, 15, 10];   // a dutch tilt's range and default (degrees)
const EST = [0.4, 0.6];     // an establishing shot's length (s)
const INSERT = [0.4, 0.8], INSERT_FROM = 3.0;   // an insert's length (s), and the earliest it may start (more cuts in 0-3 s lost viewers)
const LOW = { tilts: [12, 11, 13, 10, 14, 15], feet: 0.72, maxFov: 64 };   // low angle: degrees up, the lowest the feet may sit, the widest lens
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

// where a hand is at t (world metres): the hand target potato.js draws, through the body's turn, pitch, lean and scale
function handWorld(sb, c, def, t, side) {
  const st = actorState(sb, c, def, t), a = st.arms[side], sx = side === "R" ? -1 : 1, rx = def.body.width / 2, H = def.body.height;
  const f = handTarget(a.from, sx, rx, H, t), g = handTarget(a.pose, sx, rx, H, t), s = st.scale ?? 1;
  let [x, y, z] = f.map((v, i) => v + (g[i] - v) * a.p);
  y = LEG_H + (y - LEG_H) * (st.squash ?? 1); [x, y, z] = [x * s, y * s, z * s];
  const yaw = st.yaw ?? 0, pitch = st.pitch || 0, lean = st.lean || 0;
  [x, y] = [x * Math.cos(lean) - y * Math.sin(lean), x * Math.sin(lean) + y * Math.cos(lean)];
  [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
  [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  return [st.x + x, st.y - 0.1 * (st.kneel || 0) + y, st.z + z];
}

// a point on a prop at t (world): `at` in its own frame (scaled and turned with it); a held prop is where its hand is
function propPoint(sb, ctx, id, at, t) {
  const spec = (sb.props || []).find((p) => p.id === id); if (!spec) return null;
  const ps = propState(sb, spec, t), h = ps.hold;
  if (h && ctx.cast[h.who]) {
    const c = ctx.cast[h.who], def = ctx.chars[c.character], hands = h.hand === "both" ? ["R", "L"] : [h.hand];
    const ws = hands.map((s) => handWorld(sb, c, def, t, s)), w = ws[0].map((_, i) => ws.reduce((m, q) => m + q[i], 0) / ws.length);
    return h.k < 1 && h.to ? h.to.map((v, i) => v + (w[i] - v) * h.k) : w;
  }
  return gripWorld(spec, at || [0, 0.05, 0], [ps.x, ps.y, ps.z], ps.rot, ps.scale, ps.tilt, ps.tip);
}
// does something move on the prop over [t0, t1)? (a tween on it, a grab or release, a hand aimed at it, an effect)
function movesOn(sb, id, t0, t1) {
  const live = (a) => a.at < t1 && a.at + (a.dur ?? 0.3) > t0;
  const aims = (q) => q && (q.prop === id || aims(q.mix?.pose));
  return (sb.actions || []).some((a) => live(a) && ((a.do === "prop" && a.id === id) || a.prop === id || aims(a.pose))) ||
    (sb.props || []).some((p) => p.target === id && (sb.actions || []).some((a) => live(a) && a.do === "prop" && a.id === p.id));
}

const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// where a world point lands in a camera's picture: [across from the left, down from the top] (shares of the frame)
function project(pos, look, fov, p) {
  const f = unit(sub(look, pos)), r = unit(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, pos), z = dot(d, f), k = 2 * Math.tan((fov * Math.PI) / 360);
  return [0.5 + dot(d, r) / z / (k * 9 / 16), 0.5 - dot(d, u) / z / k, z];
}

// does the picture stay on the set's painted plate? (a low or wide lens would show past its edges) The four corner
// rays must meet the floor, or the plate's plane inside the picture; true without a plate
const plateSize = (src) => { try { const b = fs.readFileSync(new URL(`../${src}`, import.meta.url)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; } catch { return null; } };
function onPlate(sb, pos, look, fov, roll = 0) {
  const P = sb.set?.plate, wh = P?.src && plateSize(P.src); if (!wh) return true;
  const h = P.height ?? 3.2, w = (h * wh[0]) / wh[1], [cx, cy] = P.center || [0, h / 2], z = P.z ?? -2.2;
  const f = unit(sub(look, pos)), r0 = unit(cross(f, [0, 1, 0])), u0 = cross(r0, f), k = Math.tan((fov * Math.PI) / 360);
  const q = (roll * Math.PI) / 180, r = r0.map((v, i) => v * Math.cos(q) - u0[i] * Math.sin(q)), u = u0.map((v, i) => v * Math.cos(q) + r0[i] * Math.sin(q));
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const d = f.map((v, i) => v + r[i] * a * k * 9 / 16 + u[i] * b * k);
    if (d[2] >= -1e-6) return false;
    const s = (z - pos[2]) / d[2], x = pos[0] + d[0] * s, y = pos[1] + d[1] * s;
    if (y < 0) continue;   // it meets the floor first
    if (Math.abs(x - cx) > w / 2 || y > cy + h / 2) return false;
  }
  return true;
}

// an insert: the prop's point (median over the shot) at `at` from the top, from the master's side but at least 18
// degrees down onto it, a picture of SIZES.insert.V (more when the point travels)
function frameInsert(sb, ctx, { on, at, t0, t1, size }) {
  const pts = [];
  for (let t = t0 + 0.02; t < t1 - 1e-6 || !pts.length; t += 0.05) { const p = propPoint(sb, ctx, on, at, Math.min(t, t1 - 0.01)); if (p) pts.push(p); else break; }
  if (!pts.length) return null;
  const med = (i) => { const v = pts.map((p) => p[i]).sort((a, b) => a - b); return v[v.length >> 1]; }, P = [med(0), med(1), med(2)];
  const span = (i) => Math.max(...pts.map((p) => p[i])) - Math.min(...pts.map((p) => p[i]));
  const Z = SIZES.insert, V = Math.max(Z.V, span(1) + 0.25, (span(0) + 0.2) * 16 / 9), { fov } = ctx, k = 2 * Math.tan((fov * Math.PI) / 360);
  const el = Math.max(Math.asin(ctx.D[1]), (18 * Math.PI) / 180), h = unit([ctx.D[0], 0, ctx.D[2]]);
  const D = [h[0] * Math.cos(el), Math.sin(el), h[2] * Math.cos(el)], look = [P[0], P[1] - (0.5 - Z.at) * V, P[2]], d = V / k;
  return { pos: look.map((v, i) => r3(v + D[i] * d)), look: look.map(r3), fov, V, size, who: [], on, focus: P.map(r3) };
}

// straight down on a prop (a table scene): its point (median over the shot) in the middle, the camera on the master's
// side tipped SIZES.top.pitch degrees down from level, so the top of the picture is the far side of the table
function frameTop(sb, ctx, { on, at, t0, t1, size }) {
  const pts = [];
  for (let t = t0 + 0.02; t < t1 - 1e-6 || !pts.length; t += 0.05) { const p = propPoint(sb, ctx, on, at, Math.min(t, t1 - 0.01)); if (p) pts.push(p); else break; }
  if (!pts.length) return null;
  const med = (i) => { const v = pts.map((p) => p[i]).sort((a, b) => a - b); return v[v.length >> 1]; }, P = [med(0), med(1), med(2)];
  const Z = SIZES.top, { fov } = ctx, k = 2 * Math.tan((fov * Math.PI) / 360), el = (Z.pitch * Math.PI) / 180, h = unit([ctx.D[0], 0, ctx.D[2]]);
  const D = [h[0] * Math.cos(el), Math.sin(el), h[2] * Math.cos(el)], d = Z.V / k;
  return { pos: P.map((v, i) => r3(v + D[i] * d)), look: P.map(r3), fov, V: Z.V, size, who: [], on, focus: P.map(r3), angle: "top" };
}

// over the shoulder of `over` (near, back to us, a third of the frame and soft) onto `who` (far, the face we read).
// The camera stays on the master's side of the line between the two, behind and beside the near one at its eye
// height; the far face's eye line on the upper third, across from the near one; the near one never covers the far
// face. Searched over how far behind and beside the near one the camera sits; the near one's share nearest a third wins
function frameOts(sb, ctx, { who, over, t0, t1, caps, size }) {
  const A = ctx.cast[who], B = ctx.cast[over]; if (!A || !B) return null;
  const tm = (t0 + Math.min(t1, t0 + 1.2)) / 2, a = anchors(sb, A, ctx.chars[A.character], tm), b0 = anchors(sb, B, ctx.chars[B.character], tm);
  // the near one by its body's middle (anchors' x and z sit on the face, in front of it)
  const bs = actorState(sb, B, ctx.chars[B.character], tm), b = { ...b0, x: bs.x, z: bs.z };
  const u = unit([b.x - a.x, 0, b.z - a.z]), n0 = [-u[2], 0, u[0]], n = dot(n0, ctx.D) >= 0 ? n0 : n0.map((v) => -v), Z = SIZES.ots;
  const capBottom = Math.max(0, ...caps.filter((q) => q.from < t1 && q.to > t0).map((q) => (q.pos ?? 250) + 90 * Math.max(1, Math.ceil(String(q.text).length / 20)) + 20)) / 1920;
  const others = Object.values(ctx.cast).filter((c) => c.id !== who && c.id !== over).map((c) => anchors(sb, c, ctx.chars[c.character], tm));
  let best = null;
  for (let back = 0.2; back <= 1.6 + 1e-6; back += 0.1) for (let side = 0.15; side <= 1.4 + 1e-6; side += 0.05) for (const lift of [0.04, 0.12]) {
    const C = [b.x + u[0] * back + n[0] * side, b.eye + lift, b.z + u[2] * back + n[2] * side];
    if (Math.hypot(C[0] - b.x, C[2] - b.z) < b.half + 0.12 || others.some((o) => Math.hypot(C[0] - o.x, C[2] - o.z) < o.half + 0.12)) continue;
    const E = [a.x, a.eye, a.z], dist = Math.hypot(...sub(E, C)), fov = (2 * Math.atan(Z.V / 2 / dist) * 180) / Math.PI;
    if (fov < 18 || fov > 50) continue;
    // which side the near one lands on with the far face centred, then the far face across from it
    const f0 = unit(sub(E, C)), r0 = unit(cross(f0, [0, 1, 0])), nearLeft = dot(sub([b.x, b.eye, b.z], C), r0) < 0;
    const W = (Z.V * 9) / 16, across = nearLeft ? Z.across : 1 - Z.across, up0 = cross(r0, f0);
    const look = E.map((v, i) => v - r0[i] * (across - 0.5) * W - up0[i] * (0.5 - Z.eye) * Z.V);
    // (like a close-up it may crop a tall hat: the top of the body keeps the headroom)
    const fa = project(C, look, fov, E), top = project(C, look, fov, [a.x, Math.min(a.hat, a.body + 0.1), a.z])[1];
    if (Math.abs(fa[1] - Z.eye) > 0.03 || top < Math.max(HEADROOM, capBottom)) continue;
    // the near one's inner edge over its whole height (body sides, head, hat), and the far face's near edge
    const pts = [];
    for (const y of [b.feet + 0.2, (b.feet + b.eye) / 2, b.eye, b.body, b.hat]) for (let k = 0; k < 16; k++) {
      const g = (k * Math.PI) / 8, rr = (y > b.body ? 0.4 : 0.85) * b.half;   // the body round (tapered: 0.85 of its widest), the hat narrower
      const q = project(C, look, fov, [b.x + rr * Math.cos(g), y, b.z + rr * Math.sin(g)]); if (q[2] > 0.05) pts.push(q);
    }
    if (!pts.length) continue;
    const inner = nearLeft ? Math.max(...pts.map((q) => q[0])) : 1 - Math.min(...pts.map((q) => q[0]));
    const faceEdge = (nearLeft ? fa[0] : 1 - fa[0]) - FACE / W;
    if (inner > faceEdge - 0.03 || inner < 0.15) continue;
    // on the plate first, then the near one's share nearest a third, from close to the line (about 30 degrees off it)
    const off = (Math.atan2(side, back) * 180) / Math.PI;
    const score = Math.abs(inner - Z.near) + 0.002 * Math.abs(fov - 30) + 0.002 * Math.abs(off - 30) + (onPlate(sb, C, look, fov) ? 0 : 1);
    if (!best || score < best.score) best = { score, pos: C.map(r3), look: look.map(r3), fov: r3(fov), V: Z.V, size, who: [who], over, focus: E.map(r3), angle: "ots", near: r3(inner) };
  }
  if (!best) return null;
  const { score, ...fr } = best;
  return fr;
}

// a low angle on `id`: the camera low on the master's side of the line (from the knees to a quarter of the body up:
// on a potato with 14 cm legs, human knee height is about there), looking up 10-15 degrees (12 when it can), the eye
// line on the upper third (or a little under it), the hat under its headroom (and under a caption that is up), the feet above the app's
// caption bar or out of the picture, the picture on the set's plate. The narrowest lens that works wins, then the
// lowest camera, then the smallest turn off the master's direction (up to 30 degrees, never across the line), then the
// tilt nearest 12
function frameLow(sb, ctx, { who, t0, t1, caps, size }) {
  const id = who[0], c = ctx.cast[id]; if (!c) return null;
  // the eye line where it spends the shot, the hat at its highest and the feet at their lowest over it
  const def = ctx.chars[c.character], ts = [];
  for (let t = t0 + 0.05; t < t1 - 1e-6 || !ts.length; t += 0.1) ts.push(Math.min(t, t1 - 0.01));
  const all = ts.map((t) => anchors(sb, c, def, t)), mid = all[all.length >> 1], eyes = all.map((q) => q.eye).sort((p, q) => p - q);
  const a = { ...mid, eye: eyes[eyes.length >> 1], hat: Math.max(...all.map((q) => q.hat)), feet: Math.min(...all.map((q) => q.feet)), half: Math.max(...all.map((q) => q.half)) };
  const s = actorState(sb, c, def, ts[ts.length >> 1]).scale ?? 1, h0 = unit([ctx.D[0], 0, ctx.D[2]]);
  const lo = a.feet + 0.5 * LEG_H * s, hi = a.feet + 0.25 * (a.hat - a.feet), heights = [0, 0.25, 0.5, 0.75, 1].map((q) => lo + (hi - lo) * q);
  const capBottom = Math.max(0, ...caps.filter((q) => q.from < t1 && q.to > t0).map((q) => (q.pos ?? 250) + 90 * Math.max(1, Math.ceil(String(q.text).length / 20)) + 20)) / 1920;
  const E = [a.x, a.eye, a.z], turns = [0, ...[5, 10, 15, 20, 25, 30].flatMap((v) => [v, -v])];
  // the eye line drops below the third only as far as the headroom needs (as frame() does, up to EYE_GIVE)
  const eyesAt = [0, 0.25, 0.5, 0.75, 1].map((q) => Z(size).eye + EYE_GIVE * q);
  for (let fov = Math.round(ctx.fov); fov <= LOW.maxFov; fov++) for (const cy of heights) for (const want of eyesAt) for (const az of turns) for (const tilt of LOW.tilts) {
    const g = (az * Math.PI) / 180, h = [h0[0] * Math.cos(g) + h0[2] * Math.sin(g), 0, -h0[0] * Math.sin(g) + h0[2] * Math.cos(g)];
    const th = (tilt * Math.PI) / 180, k = 2 * Math.tan((fov * Math.PI) / 360), dy = a.eye - cy, q = k * (0.5 - want);
    // the horizontal distance that puts the eye line on `want`: (dy cos - x sin) / (x cos + dy sin) = q
    const x = (dy * (Math.cos(th) - q * Math.sin(th))) / (Math.sin(th) + q * Math.cos(th));
    if (!(x > 0.6)) continue;
    const pos = [E[0] + h[0] * x, cy, E[2] + h[2] * x], dir = [-h[0] * Math.cos(th), Math.sin(th), -h[2] * Math.cos(th)];
    const dist = x / Math.cos(th), look = pos.map((v, i) => v + dir[i] * dist);
    const top = project(pos, look, fov, [a.x, a.hat, a.z])[1], feet = project(pos, look, fov, [a.x, a.feet, a.z + 0.15])[1];
    const side = [-1, 1].map((m) => project(pos, look, fov, [a.x + m * a.half * h[2], a.eye, a.z - m * a.half * h[0]])[0]).sort((p, q) => p - q);
    if (top < Math.max(HEADROOM, capBottom) || (feet > LOW.feet && feet < 1.02) || side[0] < 0.02 || side[1] > 0.98 || !onPlate(sb, pos, look, fov)) continue;
    return { pos: pos.map(r3), look: look.map(r3), fov, V: k * dist, size, who, angle: "low", tilt, turn: az, height: r3(cy - a.feet) };
  }
  return null;
}
const Z = (size) => SIZES[size] || SIZES.medium;

// the camera state a shot list gives at t (timeline.js cameraState without the shake)
function camAt(shots, t) {
  const s = [...shots].filter((q) => q.at <= t + 1e-6).pop(); if (!s) return null;
  if (!s.to) return s;
  const e = ease(s.ease || "inOut")(Math.min(1, Math.max(0, (t - s.at) / (s.dur ?? 1))));
  const L = (a, b) => a.map((v, i) => v + ((b ?? a)[i] - v) * e);
  return { pos: L(s.pos, s.to.pos), look: L(s.look, s.to.look), fov: (s.fov ?? 32) + ((s.to.fov ?? s.fov ?? 32) - (s.fov ?? 32)) * e, roll: (s.roll ?? 0) + ((s.to.roll ?? s.roll ?? 0) - (s.roll ?? 0)) * e };
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

// a cut moved onto a music beat. A cut on action: a beat within two frames of it, still one to four frames into the
// move and inside [lo, hi], wins. A cut with no move to ride on (at the beat start t0): a beat within four frames.
// The cut lands on the frame that shows the beat. Returns { c, onBeat }
const nearest = (grid, t) => grid.reduce((b, g) => (b == null || Math.abs(g - t) < Math.abs(b - t) ? g : b), null);
function toBeat(cut, t0, grid, fps, lo, hi, snap = true) {
  if (!grid.length || !snap) return { c: cut?.c ?? t0, onBeat: false };
  const c = cut?.c ?? t0, b = nearest(grid, c), f = Math.round(b * fps) / fps, t = Math.floor(f * 1000 + 1e-6) / 1000;   // never past the frame
  const ok = cut ? Math.abs(b - c) <= 2 / fps + 1e-6 && f >= cut.at + 1 / fps - 1e-6 && f <= cut.at + 4 / fps + 1e-6 : Math.abs(b - c) <= 4 / fps + 1e-6;
  return ok && t >= lo - 1e-6 && t <= hi + 1e-6 ? { c: t, onBeat: true } : { c, onBeat: false };
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
    const size = d.size || KIND_SIZE[kind] || "medium", angle = d.angle || (kind === "threat" ? "low" : null);
    const r = d.roll ?? (kind === "chaos" ? ROLL[2] : 0), roll = r ? Math.sign(r) * Math.min(ROLL[1], Math.max(ROLL[0], Math.abs(r))) : 0;
    // a medium or wide shot holds everyone in the scene, a medium close-up (the payoff) the faces of who acts, a
    // close-up only the lead, a low angle the one who acts, an insert no one (its prop: `on`, else the first prop
    // something happens to in the beat)
    const lead = acting.length ? acting.slice(0, 1) : all.slice(0, 1);
    const who = d.frame ? [].concat(d.frame) : size === "insert" || size === "top" || size === "establishing" ? [] : size === "ots" ? (d.who ? [].concat(d.who) : lead) : angle === "low" ? (d.who ? [].concat(d.who) : lead) : size === "medium" || size === "wide" ? all : (size === "close" ? acting.slice(0, 1) : acting.slice(0, 2)).concat(acting.length ? [] : all.slice(0, 1));
    const inBeat = (sb.actions || []).filter((a) => a.at >= s.at - 1e-6 && a.at < s.end);
    const on = size === "insert" || size === "top" ? d.on ?? inBeat.map((a) => a.prop ?? (a.do === "prop" ? a.id : null)).find(Boolean) : null;
    // over the shoulder of: `over`, else whoever in the scene is nearest the one we read
    const near = (id) => { const c = ctx.cast[id], p = c?.at || [0, 0]; return all.filter((q) => q !== id).sort((x, y) => Math.hypot(ctx.cast[x].at[0] - p[0], ctx.cast[x].at[1] - p[1]) - Math.hypot(ctx.cast[y].at[0] - p[0], ctx.cast[y].at[1] - p[1]))[0]; };
    const over = size === "ots" ? d.over ?? near(who[0]) : null;
    return { s, kind, size, angle, roll, over, plate: d.plate, who, on, at: d.at, eyeOf: acting[0] || who[0], snap: d.snap ?? (kind === "payoff" ? cfg.snap ?? 0.22 : null), push: d.push ?? (size === "close" ? cfg.push ?? 0.04 : 0), loopTail, acting };
  });

  // 2. the shots, beat by beat: a cut on action to a new framing, a reframe where a cut would be a jump cut
  const out = [], directed = [];
  const cam = (f) => ({ pos: f.pos, look: f.look, fov: f.fov });
  let lastCut = 0, lows = 0;
  const pay = payoffOf(sb);
  want.forEach((w, i) => {
    if (w.fixed) { const { end, ...s } = w.s; out.push(s); lastCut = s.at; return; }
    if (w.s.direct.keep) return;
    const t0 = w.s.at, t1 = w.s.end, note = (o) => directed.push({ at: r3(o.at ?? t0), beat: i, kind: w.kind, size: w.size, ...o, at: r3(o.at ?? t0) });
    if (w.loopTail && out.length) {
      const first = out[0], lo = lastCut + MIN_SHOT, hi = t1 - 0.3, b = toBeat(onAction(sb, all, t0, lo, hi, fps), t0, grid, fps, lo, hi, snapBeats), cut = b.c;
      out.push({ at: r3(cut), pos: first.pos, look: first.look, fov: first.fov });
      note({ at: cut, size: "opening", why: "loop: back to the opening shot", onBeat: b.onBeat, ...beatMs(grid, cut) }); lastCut = cut; return;
    }
    const movers = w.acting.length ? w.acting : w.who;
    let fr = null;
    if (w.size === "establishing") {
      // a painted exterior for about half a second as a setup cut: never at frame 0 (frame 0 is action), never from the
      // payoff on; the 3D camera stays where it is under it, and the shot before comes back after it
      const why = !w.plate ? "no plate to show" : t0 < 1 / fps ? "frame 0 is action, never an establishing shot" : pay != null && t0 >= pay - 1e-6 ? "no establishing shot from the payoff on" : !out.length ? "nothing to come back to" : null;
      if (why) { note({ why: `kept the shot (${why})` }); return; }
      const prev = camAt(out, t0), cut = Math.max(t0, lastCut + EST[0]), next = want.slice(i + 1).find((q) => q.fixed || !q.s.direct.keep)?.s.at ?? dur;
      out.push({ at: r3(cut), pos: prev.pos.map(r3), look: prev.look.map(r3), fov: r3(prev.fov), plate: w.plate, push: w.s.direct.push ?? 0.04, angle: "establishing" });
      note({ at: cut, plate: w.plate, ...beatMs(grid, cut), ...(next - cut < EST[0] - 1e-6 && { warn: `the establishing shot lasts ${r3(next - cut)} s (at least ${EST[0]})` }) });
      const back = Math.floor(Math.round((cut + 0.5) * fps) / fps * 1000 + 1e-6) / 1000;
      if (next > cut + EST[1] + 1e-6) { out.push({ at: back, pos: prev.pos.map(r3), look: prev.look.map(r3), fov: r3(prev.fov), ...(prev.roll && { roll: prev.roll }) }); note({ at: back, size: "back", why: "back from the establishing shot to the shot before it" }); lastCut = back; }
      else lastCut = cut - MIN_SHOT + EST[0];
      return;
    }
    if (w.size === "top") {
      fr = w.on ? frameTop(sb, ctx, { on: w.on, at: w.at, t0, t1, size: w.size }) : null;
      if (!fr) note({ why: "no prop to look down on: a medium instead" });
    } else if (w.size === "ots") {
      fr = w.over ? frameOts(sb, ctx, { who: w.who[0], over: w.over, t0, t1, caps, size: w.size }) : null;
      if (!fr) note({ why: "no over-the-shoulder fits (camera inside someone, the near one over the face): a close-up instead" });
    } else if (w.size === "insert") {
      // an insert only sets up (before the payoff), never in the first 3 s, and needs something moving in it
      const why = !w.on ? "no prop to insert on" : t0 < (cfg.insertFrom ?? INSERT_FROM) - 1e-6 ? `no insert before ${cfg.insertFrom ?? INSERT_FROM} s` : pay != null && t0 >= pay - 1e-6 ? "no insert from the payoff on" : null;
      if (why) { note({ why: `kept the shot (${why})` }); return; }
      fr = frameInsert(sb, ctx, { on: w.on, at: w.at, t0, t1: Math.min(t1, t0 + INSERT[1]), size: w.size });
    } else if (w.angle === "low") {
      if (lows++ < 1) fr = frameLow(sb, ctx, { who: w.who, t0, t1, caps, size: w.size });
      if (!fr) note({ why: lows > 1 ? "one low angle per clip: a straight shot instead" : "no low angle fits (headroom, feet, width): a straight shot instead" });
    }
    fr ||= frame(sb, ctx, { who: w.who.length ? w.who : all, size: w.size === "ots" ? "close" : SIZES[w.size]?.eye ? w.size : "medium", eyeOf: w.eyeOf, t0, t1, caps });
    if (!fr) return;
    if (w.roll) {
      // a dutch tilt: a little more picture, so the turned frame keeps the heads and feet in their places
      const g = 1 + 0.6 * Math.sin((Math.abs(w.roll) * Math.PI) / 180), L = fr.look;
      fr = { ...fr, pos: fr.pos.map((v, q) => r3(L[q] + (v - L[q]) * g)), V: fr.V * g, roll: w.roll };
    }
    if (w.snap && out.length) {
      // the snap-in starts on the payoff's first big action and moves on from wherever the camera is (no cut)
      const go = (sb.actions || []).filter((a) => w.acting.includes(a.who) && (WEIGHT[a.do] ?? 0) >= 2 && a.at >= t0 - 1e-6 && a.at < t0 + 0.6).map((a) => a.at)[0] ?? t0;
      // after an insert or a low angle the camera is somewhere else entirely: cut on the action to the payoff's framing
      // 15 % wider and snap in from there
      const up = camAt(out, go), other = !!out.findLast((q) => q.at <= go + 1e-6)?.angle;
      const L = fr.look, from = other ? { pos: fr.pos.map((v, q) => L[q] + (v - L[q]) * 1.15), look: L, fov: fr.fov } : up;
      out.push({ at: r3(go), pos: from.pos.map(r3), look: from.look.map(r3), fov: r3(from.fov), ...(from.roll && { roll: r3(from.roll) }), to: { ...cam(fr), ...(from.roll && { roll: 0 }) }, dur: w.snap, ease: "out" });
      note({ at: go, who: w.who, why: `snap-in to ${w.size} on ${w.who.join(" + ")} (${w.snap} s)` }); return;
    }
    const prev = out.length ? camAt(out, t0) : null, newAngle = fr.size === "insert" || !!fr.angle || Math.abs((fr.roll ?? 0) - (prev?.roll ?? 0)) >= ROLL[0];
    if (prev && !w.push && !newAngle && jump(prev, fr)) {
      // too close to the shot already up for a cut: keep it, or ease it over with the action when the beat needs room
      const Vp = heightOf(prev), Vf = heightOf(fr);
      if (Math.max(Vp, Vf) / Math.min(Vp, Vf) < 1.08 && Math.hypot(prev.look[0] - fr.look[0], prev.look[1] - fr.look[1]) < 0.04 * Vp) { note({ why: "kept the shot (a cut would be a jump cut)" }); return; }
      const go = onAction(sb, movers, t0, t0 - 0.35, t1 - 0.6, fps)?.c ?? t0, from = camAt(out, go), d = r3(Math.min(1.2, t1 - go - 0.2));
      out.push({ at: r3(go), pos: from.pos.map(r3), look: from.look.map(r3), fov: r3(from.fov), ...(from.roll && { roll: r3(from.roll) }), to: { ...cam(fr), ...((from.roll || fr.roll) && { roll: fr.roll ?? 0 }) }, dur: d, ease: "inOut" });
      note({ at: go, who: w.who, why: `reframed with the action over ${d} s (a cut would be a jump cut)` }); return;
    }
    const lo = lastCut + MIN_SHOT, hi = t1 - MIN_SHOT, move = out.length ? onAction(sb, movers, t0, lo, hi, fps) : null;
    const b = out.length ? toBeat(move, t0, grid, fps, lo, hi, snapBeats) : { c: 0, onBeat: false };
    const cut = b.c;
    const shot = { at: r3(cut), ...cam(fr), ...(fr.focus && { focus: fr.focus }), ...(fr.roll && { roll: fr.roll }), ...(fr.size === "insert" ? { angle: "insert" } : fr.angle && { angle: fr.angle }) };
    if (w.push) {
      const k = 1 - w.push, L = fr.look, end = want.slice(i + 1).find((q) => q.fixed || !q.s.direct.keep)?.s.at ?? dur;
      shot.to = { pos: fr.pos.map((v, q) => r3(L[q] + (v - L[q]) * k)), ...(fr.roll && { roll: fr.roll }) };
      shot.dur = r3(end - cut); shot.ease = "linear";
    }
    out.push(shot); lastCut = cut;
    const past = (fr.roll || fr.angle === "ots") && !onPlate(sb, fr.pos, fr.look, fr.fov, fr.roll ?? 0) ? { warn: "the picture shows past the set's plate" } : {};
    const extra = fr.angle === "ots" ? { over: fr.over, near: fr.near, fov: fr.fov } : fr.angle === "top" ? { on: fr.on } : fr.roll ? { roll: fr.roll } : fr.size === "insert" ? { on: fr.on, ...(!movesOn(sb, fr.on, cut, Math.min(t1, cut + INSERT[1])) && { warn: "nothing moves in the insert" }) } : fr.angle === "low" ? { angle: "low", tilt: fr.tilt, turn: fr.turn, height: fr.height, fov: fr.fov } : {};
    note({ at: cut, who: w.who, eyeOf: w.eyeOf, ...(move && { cutOnAction: r3(cut - t0) }), ...(w.push && { push: w.push }), ...(out.length > 1 && { onBeat: b.onBeat, ...beatMs(grid, cut) }), ...extra, ...past });
    if (fr.size === "insert") {
      // 0.4-0.8 s, then back to the shot before it (wider) unless the next beat cuts first; the next cut may come 0.4 s in
      const back = cut + INSERT[1], next = want.slice(i + 1).find((q) => q.fixed || !q.s.direct.keep)?.s.at ?? dur;
      if (next - cut < INSERT[0] - 1e-6) directed[directed.length - 1].warn = `the insert lasts ${r3(next - cut)} s (at least ${INSERT[0]})`;
      if (next > back + 1e-6 && prev) {
        const t = Math.floor(Math.round(back * fps) / fps * 1000 + 1e-6) / 1000;
        out.push({ at: t, pos: prev.pos.map(r3), look: prev.look.map(r3), fov: r3(prev.fov) });
        note({ at: t, size: "back", why: `back from the insert to the shot before it (${INSERT[1]} s at most)`, ...beatMs(grid, t) }); lastCut = t;
      } else lastCut = cut - MIN_SHOT + INSERT[0];
    }
  });
  return { ...sb, shots: out, directed };
}
