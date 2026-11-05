// The motion layer's stepped parts (quality plan items 8, 9 and 12; storyboard "motion": { "overlap", "timing",
// "solve" }, util.js layerOf). Opt-in: a storyboard without them never reaches this file.
//
// Overlap (item 8). What real bodies do, written down before building it (our movement rule; references: Richard
// Williams' "The Animator's Survival Kit" on overlapping action and successive breaking of joints, Ghibli walk and
// reach cycles frame by frame, slow-motion footage of people reaching, pointing, turning and stopping):
//   - nothing starts or stops on the same frame: the body turns first, the shoulder follows, the hand arrives a frame
//     or two after the arm has stopped and settles (a small overshoot, then still)
//   - a turn of the head and body follows the eyes a beat late, with a slight wind-up the other way on a big one and
//     a small swing past the end
//   - a hand that holds, pushes or rests on something has no lag: the contact stays exact, the rest of the arm bends
//   - loose parts (a hat tip, a cape) trail the most and settle last (timeline.js follow-through spring)
// Adapted to potatoes: the face is on the body, so "the head" is the whole body's turn (f 4 Hz, zeta 0.6, r -0.3:
// about two frames late, a small wind-up, one soft overshoot; its tip and lean keep the natural lead into a reach); the hands follow their targets in the body's own
// frame (f 3.5 Hz, zeta 0.65, r 1: on a stop they arrive about two frames late, overshoot a centimetre or two and
// settle within a quarter second). The elbow keeps its place without the lag (timing.breaking), so the elbow leads and
// the hand trails: successive breaking.
//
// Everything here is stepped at 120 Hz from t = 0 and cached per storyboard and actor (like timeline.js FT), so a frame
// is the same whichever frames were drawn before it, in a still, a draft, a full render, the frame cache or a farm
// shard. A hard cut or a re-placement starts each spring again at its target, so nothing swings across a cut.
import { clamp, lerp, sodK, sodStep, softMax, layerOf, hashStr, loopRad } from "./util.js";
import { handTarget } from "./potato.js";
import { isDance } from "./dance.js";

export const OVERLAP = {
  dt: 1 / 120,
  hand: [3.5, 0.65, 1], body: [4, 0.6, -0.3], prop: [6, 0.5, 1],   // f (Hz), zeta, r
  propArm: 0.15, propMax: 0.14,   // a held prop swings like a pendulum this long (m) from the grip, at most 8 degrees
  handMax: 0.09, yawMax: 0.3,   // the largest lag: metres for a hand, radians for the body's turn
  snapHand: 0.12, snapYaw: 0.4,   // a target moving further than this in one step was re-placed: the spring starts again there
};
const REST_ON = new Set(["table", "lap", "hips", "cheeks"]);   // poses where the hand rests on something
const LEG_H = 0.14;   // potato.js

// how much of an arm pose is on a contact (a prop, a point in the world, a resting place), 0..1, from the raw arm
const onContact = (q) => {
  if (q && q.mix) { const p = clamp(q.mix.p); return onContact(q.mix.from) * (1 - p) + onContact(q.mix.pose) * p; }
  if (q && typeof q === "object") return q.prop || q.world ? 1 : 0;
  return REST_ON.has(q) ? 1 : 0;
};
const ramp = (u, a, b) => { const x = clamp((u - a) / (b - a)); return x * x * (3 - 2 * x); };
const inSpan = (u, spans, pre = 0.1, post = 0.2) => { let w = 0; for (const [a, b] of spans) w = Math.max(w, ramp(u, a - pre, a) * (1 - ramp(u, b, b + post))); return w; };

// the spans that pin a hand or the body, per storyboard and actor: a hand holding a prop (grab .. release), dances (on
// the music's beat: no lag), climbs, rides
const SPANS = new WeakMap();
function spansOf(sb, id, acts) {
  let per = SPANS.get(sb); if (!per) { per = new Map(); SPANS.set(sb, per); }
  let S = per.get(id); if (S) return S;
  S = { R: [], L: [], dance: [], climb: [], ride: [] };
  const all = [...acts].sort((a, b) => a.at - b.at);
  for (const a of all) {
    if (a.who !== id) continue;
    const end = a.at + (a.dur ?? 0.3);
    if (a.do === "grab" && (a.hand == null || a.hand === "R" || a.hand === "L" || a.hand === "both")) {
      const rel = all.find((b) => b.at > a.at && b.prop === a.prop && (b.do === "release" || (b.do === "grab" && b.who !== id)));
      for (const s of a.hand === "both" ? ["R", "L"] : [a.hand || "R"]) S[s].push([a.at, rel ? rel.at + (rel.dur ?? 0.3) : Infinity]);
    }
    else if (isDance(a.do)) S.dance.push([a.at, a.at + (a.dur ?? 1) + (a.release ?? 0.18)]);
    else if (a.do === "climb") S.climb.push([a.at, end]);
    else if (a.do === "ride" && a.prop) { const off = all.find((b) => b.who === id && b.do === "ride" && b.at > a.at); S.ride.push([a.at, off ? off.at : Infinity]); }
  }
  per.set(id, S);
  return S;
}

// one step's targets: the body's turn, tip and lean, each hand's target in the body's own frame, and how free each is
function targets(sb, actor, def, u, H, S) {
  const st = H.actorState(sb, actor, def, u, true);
  const dance = inSpan(u, S.dance), climb = inSpan(u, S.climb, 0.05, 0.1), ride = inSpan(u, S.ride, 0.05, 0.3);
  const flip = clamp((Math.abs(st.flip || 0) - 0.3) / 0.3);
  const bodyFree = (1 - dance) * (1 - climb) * (1 - ride) * (1 - flip) * (st.visible === false ? 0 : 1);
  const contact = { R: onContact(st.arms.R.from) * (1 - clamp(st.arms.R.p)) + onContact(st.arms.R.pose) * clamp(st.arms.R.p), L: onContact(st.arms.L.from) * (1 - clamp(st.arms.L.p)) + onContact(st.arms.L.pose) * clamp(st.arms.L.p) };
  H.resolve(sb, st, def, u);
  const rx = def.body.width / 2, Hh = def.body.height, hands = {};
  for (const [s, sx] of [["R", -1], ["L", 1]]) {
    const a = st.arms[s], f = handTarget(a.from, sx, rx, Hh, u), g = handTarget(a.pose, sx, rx, Hh, u);
    const free = (1 - contact[s]) * (1 - inSpan(u, S[s], 0.08, 0.15)) * (1 - clamp(st.grip?.[s]?.down || 0)) * (1 - dance) * (1 - climb) * (st.visible === false ? 0 : 1);
    hands[s] = { x: f.map((v, i) => v + (g[i] - v) * a.p), free };
  }
  return { body: [st.yaw, st.pitch || 0, st.lean || 0], bodyFree, hands, st };
}

const CACHE = new WeakMap();
const zero3 = () => [0, 0, 0];
// the overlap offsets at story time t: body [yaw, pitch, lean] to add, and per hand { nudge, elbowNudge } for potato.js
export function overlapAt(sb, actor, def, t, H) {
  const L = layerOf(sb), O = OVERLAP, dt = O.dt;
  if (!L || !def?.body) return null;
  const doBody = !!L.overlap?.body, doHands = !!L.overlap?.hands, breaking = !!L.timing?.breaking, doSolve = !!L.solve;
  if (!doBody && !doHands && !doSolve) return null;
  let per = CACHE.get(sb); if (!per) { per = new Map(); CACHE.set(sb, per); }
  let C = per.get(actor.id);
  if (!C) {
    const tune = L.overlap?.tune || {};
    C = { out: [], K: { hand: sodK(...(tune.hand || O.hand)), body: sodK(...(tune.body || O.body)), prop: sodK(...(tune.prop || O.prop)) }, B: null, Hs: null, Ps: {}, prev: null, S: spansOf(sb, actor.id, H.timedActions(sb)) };
    per.set(actor.id, C);
  }
  const k = Math.max(0, Math.floor(t / dt) + 1), need = k + (doSolve ? 2 * SOLVE.win + 2 : 0);
  for (let i = C.out.length; i <= need; i++) {
    const u = i * dt, T = targets(sb, actor, def, u, H, C.S), P = C.prev;
    const cut = i > 0 && H.cutBetween(sb, u - dt, u);
    // the body's turn follows its target (its tip and lean are left alone: the natural lead leans the body into a
    // reach before the hand moves, and a lag there would undo it)
    let body = null;
    if (doBody) {
      const x = [T.body[0]], xd = [P ? (x[0] - P.body[0]) / dt : 0];
      if (!C.B || cut || (P && Math.abs(x[0] - P.body[0]) > O.snapYaw)) C.B = { y: x.slice(), v: [0] };
      else {
        sodStep(C.B, C.K.body, x, xd, dt);
        // pinned (a dance, a climb, a ride, a flip): the follow is held on its target, moving with it
        const w = T.bodyFree;
        C.B.y[0] = x[0] + w * (C.B.y[0] - x[0]); C.B.v[0] = xd[0] + w * (C.B.v[0] - xd[0]);
      }
      body = [softMax(C.B.y[0] - x[0], O.yawMax), 0, 0];
    }
    // the hands: each follows its target in the body's own frame; a hand on a contact is held on its target
    const arms = {};
    if (doHands) {
      C.Hs = C.Hs || {};
      for (const s of ["R", "L"]) {
        const x = T.hands[s].x, xp = P?.hands[s].x, xd = xp ? x.map((v, j) => (v - xp[j]) / dt) : zero3();
        let Q = C.Hs[s];
        if (!Q || cut || (xp && Math.hypot(x[0] - xp[0], x[1] - xp[1], x[2] - xp[2]) > O.snapHand)) Q = C.Hs[s] = { y: x.slice(), v: zero3() };
        else {
          sodStep(Q, C.K.hand, x, xd, dt);
          const w = T.hands[s].free;
          for (let j = 0; j < 3; j++) { Q.y[j] = x[j] + w * (Q.y[j] - x[j]); Q.v[j] = xd[j] + w * (Q.v[j] - xd[j]); }
        }
        const d = [Q.y[0] - x[0], Q.y[1] - x[1], Q.y[2] - x[2]], m = Math.hypot(...d), sc = m > 1e-9 ? softMax(m, O.handMax) / m : 0;
        const nudge = d.map((v) => v * sc);
        arms[s] = { nudge, ...(breaking && { elbowNudge: nudge.map((v) => -0.5 * v) }) };
        // a held prop's swing (stage.js holds: a turn about the grip): a pendulum on the hand's path, so a mug tips a few
        // degrees as the hand starts and stops and settles; only while the hand holds something
        const held = inSpan(u, C.S[s], 0.08, 0.15);
        let G = C.Ps[s];
        if (!G || cut || !held) G = C.Ps[s] = { y: x.slice(), v: xd.slice() };
        else sodStep(G, C.K.prop, x, xd, dt);
        if (held > 0 && L.overlap.props) { const La = O.propArm; arms[s].propSway = [softMax(held * Math.atan2(G.y[2] - x[2], La), O.propMax), softMax(held * Math.atan2(G.y[0] - x[0], La), O.propMax)]; }
      }
    }
    // the contact solver's raw push this step (smoothed below, with a look ahead, so it is in place before the contact)
    const push = doSolve ? solveStep(sb, actor, def, u, T, arms, body, H, L.solve) : null;
    C.out.push({ body, arms, push });
    C.prev = T;
  }
  // between two steps: a straight blend (the steps are 1/120 s, four to a frame)
  const i = Math.min(Math.floor(t / dt), C.out.length - 2), r = clamp(t / dt - i), a = C.out[Math.max(0, i)], b = C.out[Math.max(0, i) + 1] || a;
  const mix = (p, q) => (p && q ? p.map((v, j) => lerp(v, q[j], r)) : p || q || null);
  const out = { body: mix(a.body, b.body), arms: {} };
  for (const s of ["R", "L"]) if (a.arms[s]) {
    out.arms[s] = { nudge: mix(a.arms[s].nudge, b.arms[s].nudge), ...(a.arms[s].elbowNudge && { elbowNudge: mix(a.arms[s].elbowNudge, b.arms[s].elbowNudge) }) };
    const ps = mix(a.arms[s].propSway, b.arms[s].propSway);
    if (ps) (out.propSway = out.propSway || {})[s] = ps;
  }
  if (doSolve) {
    const i0 = Math.max(0, i), pa = smoothPush(C, i0), pb = smoothPush(C, i0 + 1);
    for (const s of ["R", "L"]) {
      const h = mix(pa[`h${s}`], pb[`h${s}`]), e = mix(pa[`e${s}`], pb[`e${s}`]);
      if (!h && !e) continue;
      const A = (out.arms[s] = out.arms[s] || {});
      if (h) A.nudge = A.nudge ? A.nudge.map((v, j) => v + h[j]) : h;
      if (e) A.elbowNudge = A.elbowNudge ? A.elbowNudge.map((v, j) => v + e[j]) : e;
    }
  }
  return out;
}

// Moving holds (item 12 c). Real people never stand perfectly still: the weight goes from one foot to the other every
// few seconds (a slow lean over the standing leg, the hip sliding a centimetre toward it), and a body that has held a
// while sinks a touch into a more relaxed pose. Seeded per actor; fades out around anything the body does (busy spans)
// and with a "still" (idle). Loop-safe: with loop-safe idle (LD) the shifts turn a whole number of times over the clip.
export function holdShift(sb, c, st, t, idle, busy, LD) {
  let near = Infinity;
  for (const [a, b] of busy) near = Math.min(near, t < a ? a - t : t > b ? t - b : 0);
  const w = ramp(near, 0.15, 0.7) * idle;
  if (w <= 0) return;
  // a shift every 2.6 s or so (seeded per actor), a smooth swing from side to side: about 0.5 s moving, the rest held
  const h = hashStr(c.id), per = 2.3 + ((h % 1000) / 1000) * 0.7, ph0 = ((h >>> 10) % 1000) / 1000;
  const wv = loopRad(Math.PI / per, LD), x = Math.sin(wv * t + ph0 * 2 * Math.PI), side = Math.tanh(2.5 * x) / Math.tanh(2.5);
  const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), sway = 0.007 * side * w;
  st.x -= sway * cy; st.z += sway * sy;   // the body's own -x is its right: over the right foot
  st.lean += 0.022 * side * w;
  st.squash *= 1 - 0.006 * w;   // settled a touch lower in the hold
}

// ---------- the contact solver (item 9) --------------------------------------------------------------------------
// Solve, don't fail: each step, every hand and each arm's pull point (the elbow guide) found inside a character's body
// is pushed out along the body's surface normal, a hand to 1 cm clear of another body and to the surface of its own
// (a hand on a belly, a hip or a cheek is meant to touch it), an arm's pull point so the arm tube clears another body.
// Bodies are the ellipsoids the contact checks measure (stage.js reach: the body mesh's box), posed from each actor's
// state; bodies never move. A push the beat needs (an allowClip window between the two) is left alone, and a push over
// 6 cm is not made at all: that pose is wrong and gets re-written, the checks still fail it (solveWarnings lists them).
// The pushes are smoothed with a look ahead (a running maximum over 0.15 s either side, then a Hann window of the
// same width), so a push is in place before the contact and eases off after it, and never pops. Other characters
// come from registerCast (timeline.js; stage.js registers them before the first frame), so the solve is the same on
// every machine; without it only a character's own body counts.
// pad: the body mesh's box (what the checks measure: its lumps) reaches about 1 cm past the smooth ellipsoid of
// def.body (measured on the gestures bench: the checks' depth against the drawn hands, gloves of size 1.7)
export const SOLVE = { win: 18, clear: 0.01, hand: 0.06, cap: 0.06, capTo: 0.075, limbW: 0.045, pad: 0.01 };
const rotYXZ = (v, yaw, pitch, lean) => {   // three.js Euler YXZ: lean (z), then pitch (x), then yaw (y)
  let [x, y, z] = v;
  [x, y] = [x * Math.cos(lean) - y * Math.sin(lean), x * Math.sin(lean) + y * Math.cos(lean)];
  [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
  [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  return [x, y, z];
};
const unrotYXZ = (v, yaw, pitch, lean) => {
  let [x, y, z] = v;
  [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
  [y, z] = [y * Math.cos(pitch) + z * Math.sin(pitch), -y * Math.sin(pitch) + z * Math.cos(pitch)];
  [x, y] = [x * Math.cos(lean) + y * Math.sin(lean), -x * Math.sin(lean) + y * Math.cos(lean)];
  return [x, y, z];
};
// a posed body: its root (potato.js apply: position, YXZ turn, scale) and its body ellipsoid in root space
function bodyOf(st, def) {
  const sq = st.squash || 1, B = def.body, sc = st.scale ?? 1, ry = B.height / 2;
  return { pos: [st.x, st.y - 0.1 * (st.kneel || 0), st.z], yaw: st.yaw, pitch: st.pitch || 0, lean: st.lean || 0, sc, sq,
    c: [0, (LEG_H + ry) * sq, 0], r: [(B.width / 2) / Math.sqrt(sq), ry * sq, (B.depth / 2) / Math.sqrt(sq)] };
}
const toWorld = (b, p) => { const q = rotYXZ(p.map((v) => v * b.sc), b.yaw, b.pitch, b.lean); return [q[0] + b.pos[0], q[1] + b.pos[1], q[2] + b.pos[2]]; };
const toRoot = (b, w) => unrotYXZ([w[0] - b.pos[0], w[1] - b.pos[1], w[2] - b.pos[2]], b.yaw, b.pitch, b.lean).map((v) => v / b.sc);
// how far a world point is outside body b's ellipsoid (metres, negative inside; measured as the checks do, along the
// line from the centre) and the outward normal there, in the world
function signedOut(b, w) {
  const p = toRoot(b, w), v = [p[0] - b.c[0], p[1] - b.c[1], p[2] - b.c[2]];
  const e = Math.hypot(v[0] / b.r[0], v[1] / b.r[1], v[2] / b.r[2]);
  const d = Math.hypot(...v) * b.sc * (1 - 1 / Math.max(e, 1e-6)) - SOLVE.pad;
  let n = [v[0] / b.r[0] ** 2, v[1] / b.r[1] ** 2, v[2] / b.r[2] ** 2];
  const nl = Math.hypot(...n) || 1; n = rotYXZ(n.map((x) => x / nl), b.yaw, b.pitch, b.lean);
  return { d, n };
}
// the push (world) that takes a ball of radius rad at w to `clear` outside body b; null when it is clear already
function pushOut(b, w, rad, clear) {
  let p = w.slice(), tot = [0, 0, 0];
  for (let it = 0; it < 3; it++) {
    const { d, n } = signedOut(b, p), need = rad + clear - d;
    if (need <= 1e-4) break;
    for (let j = 0; j < 3; j++) { p[j] += n[j] * need; tot[j] += n[j] * need; }
  }
  return Math.hypot(...tot) > 1e-4 ? tot : null;
}
// allowClip windows between two actors (by story time), with a 0.1 s ease at each end
function allowedAt(sb, a, b, u) {
  let w = 0;
  for (const q of sb.allowClip || []) {
    const pair = (q.who === a && q.with === b) || (q.who === b && q.with === a);
    if (pair && q.reason) w = Math.max(w, ramp(u, q.from - 0.1, q.from) * (1 - ramp(u, q.to, q.to + 0.1)));
  }
  return w;
}
const WARN = new WeakMap();
// a push the solver would need but doesn't make (over 6 cm): [{ t, who, part, with, need }] per storyboard
export function solveWarnings(sb) { return WARN.get(sb) || []; }
function warn(sb, u, who, part, withId, need) {
  let W = WARN.get(sb); if (!W) { W = []; WARN.set(sb, W); }
  const last = W.findLast?.((x) => x.who === who && x.part === part && x.with === withId);
  if (last && u - last.t1 < 0.1) { last.t1 = u; last.need = Math.max(last.need, need); return; }
  W.push({ t: u, t1: u, who, part, with: withId, need });
}
function solveStep(sb, actor, def, u, T, arms, body, H, opt) {
  const st = T.st, me = bodyOf({ ...st, yaw: st.yaw + (body ? body[0] : 0) }, def), out = {};
  const others = [];
  for (const o of H.cast(sb) || []) {
    if (o.c.id === actor.id || !o.def?.body) continue;
    const so = H.actorState(sb, o.c, o.def, u, true);
    if (so.visible === false) continue;
    others.push({ id: o.c.id, b: bodyOf(so, o.def) });
  }
  const rx = def.body.width / 2, Hh = def.body.height, ry = Hh / 2;
  const local = (h) => [h[0], LEG_H + (h[1] - LEG_H) * me.sq, h[2]];   // potato.js: hand heights squash with the body
  // a world push back into this body's unscaled hand frame
  const back = (pw) => { const r = unrotYXZ(pw, me.yaw, me.pitch, me.lean).map((v) => v / me.sc); return [r[0], r[1] / me.sq, r[2]]; };
  for (const [s, sx] of [["R", -1], ["L", 1]]) {
    if (st.visible === false) continue;
    const h0 = T.hands[s].x, n = arms[s]?.nudge || [0, 0, 0], hl = [h0[0] + n[0], h0[1] + n[1], h0[2] + n[2]];
    const hw = toWorld(me, local(hl)), rad = SOLVE.hand * (def.hands?.size ?? 1.3) * me.sc;   // the checks' ball: 6 cm times the glove's size
    // the hand: out of every other body, then not past the surface of its own
    if (opt.hands) {
      let tot = [0, 0, 0], any = false;
      for (const o of others) {
        const pw = pushOut(o.b, hw.map((v, j) => v + tot[j]), rad, SOLVE.clear); if (!pw) continue;
        const m = Math.hypot(...pw), w = (1 - allowedAt(sb, actor.id, o.id, u)) * (1 - ramp(m, SOLVE.cap, SOLVE.capTo));
        if (m > SOLVE.cap) warn(sb, u, actor.id, `hand${s}`, o.id, m);
        for (let j = 0; j < 3; j++) tot[j] += pw[j] * w; any = any || w > 0;
      }
      const own = pushOut(me, hw.map((v, j) => v + tot[j]), 0, 0);
      if (own) { const m = Math.hypot(...own), w = 1 - ramp(m, SOLVE.cap, SOLVE.capTo); if (m > SOLVE.cap) warn(sb, u, actor.id, `hand${s}`, actor.id, m); for (let j = 0; j < 3; j++) tot[j] += own[j] * w; any = any || w > 0; }
      if (any) out[`h${s}`] = back(tot);
    }
    // the arm: the tube from the shoulder through its pull point (the elbow guide, potato.js elbowFor) to the hand is a
    // quadratic curve; where a point of it (as the checks sample it) sinks into another body, the pull point moves out
    // by the depth over that point's share of it (2u(1 - u)), so the tube clears
    if (opt.elbows && others.length) {
      const sh = [sx * rx * Math.sin(1.38), LEG_H + ry * 1.02, (def.body.depth / 2) * Math.cos(1.38)];   // potato.js surf(sx 1.38, 0.02)
      const hand = local(hl), mid = [(sh[0] + hand[0]) / 2 + sx * 0.13, (sh[1] + hand[1]) / 2 - 0.06, (sh[2] + hand[2]) / 2 + 0.02];   // potato.js elbowFor
      const shw = toWorld(me, local(sh)), cw = toWorld(me, local(mid)), rad2 = (def.limbs?.width ?? SOLVE.limbW) * me.sc;
      let tot = [0, 0, 0], any = false;
      for (const o of others) {
        let best = null;
        for (const uu of [0.3, 0.42, 0.54, 0.66, 0.78]) {
          const k0 = (1 - uu) ** 2, k1 = 2 * uu * (1 - uu), k2 = uu * uu;
          const pw = pushOut(o.b, shw.map((v, j) => k0 * v + k1 * (cw[j] + tot[j]) + k2 * hw[j]), rad2, SOLVE.clear);
          if (!pw) continue;
          const c = pw.map((v) => v / k1), m = Math.hypot(...pw);   // m: how deep the tube is in (the cap reads it)
          if (!best || m > best.m) best = { c, m };
        }
        if (!best) continue;
        const w = (1 - allowedAt(sb, actor.id, o.id, u)) * (1 - ramp(best.m, SOLVE.cap, SOLVE.capTo));
        if (best.m > SOLVE.cap) warn(sb, u, actor.id, `arm${s}`, o.id, best.m);
        for (let j = 0; j < 3; j++) tot[j] += best.c[j] * w; any = any || w > 0;
      }
      if (any) out[`e${s}`] = back(tot);
    }
  }
  return out;
}
// the smoothed push at step i: per part and axis, the largest push within the window either side (sign kept), then a
// Hann-weighted average over the same window, so the push is in place before a contact and eases out after it
const HANN = (() => { const W = SOLVE.win, w = []; let s = 0; for (let j = -W; j <= W; j++) { const v = 0.5 + 0.5 * Math.cos((Math.PI * j) / (W + 1)); w.push(v); s += v; } return w.map((v) => v / s); })();
function smoothPush(C, i) {
  if (!C.sm) C.sm = new Map();
  if (C.sm.has(i)) return C.sm.get(i);
  const W = SOLVE.win, n = C.out.length, res = {};
  const at = (j) => C.out[Math.min(n - 1, Math.max(0, j))].push || {};
  for (const part of ["hR", "hL", "eR", "eL"]) {
    let any = false; for (let j = i - 2 * W; j <= i + 2 * W && !any; j++) any = !!at(j)[part];
    if (!any) continue;
    const dil = (j) => { const v = [0, 0, 0]; for (let q = j - W; q <= j + W; q++) { const p = at(q)[part]; if (p) for (let c = 0; c < 3; c++) if (Math.abs(p[c]) > Math.abs(v[c])) v[c] = p[c]; } return v; };
    const v = [0, 0, 0];
    for (let j = -W; j <= W; j++) { const d = dil(i + j), w = HANN[j + W]; for (let c = 0; c < 3; c++) v[c] += w * d[c]; }
    res[part] = v;
  }
  C.sm.set(i, res);
  return res;
}
