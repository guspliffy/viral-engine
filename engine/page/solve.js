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
  hand: [3.5, 0.65, 1], body: [4, 0.6, -0.3],   // f (Hz), zeta, r
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
  return { body: [st.yaw, st.pitch || 0, st.lean || 0], bodyFree, hands };
}

const CACHE = new WeakMap();
const zero3 = () => [0, 0, 0];
// the overlap offsets at story time t: body [yaw, pitch, lean] to add, and per hand { nudge, elbowNudge } for potato.js
export function overlapAt(sb, actor, def, t, H) {
  const L = layerOf(sb), O = OVERLAP, dt = O.dt;
  if (!L || !def?.body) return null;
  const doBody = !!L.overlap?.body, doHands = !!L.overlap?.hands, breaking = !!L.timing?.breaking;
  if (!doBody && !doHands) return null;
  let per = CACHE.get(sb); if (!per) { per = new Map(); CACHE.set(sb, per); }
  let C = per.get(actor.id);
  if (!C) {
    const tune = L.overlap.tune || {};
    C = { out: [], K: { hand: sodK(...(tune.hand || O.hand)), body: sodK(...(tune.body || O.body)) }, B: null, Hs: null, prev: null, S: spansOf(sb, actor.id, H.timedActions(sb)) };
    per.set(actor.id, C);
  }
  const k = Math.max(0, Math.floor(t / dt) + 1);
  for (let i = C.out.length; i <= k; i++) {
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
      }
    }
    C.out.push({ body, arms });
    C.prev = T;
  }
  // between two steps: a straight blend (the steps are 1/120 s, four to a frame)
  const i = Math.min(Math.floor(t / dt), C.out.length - 2), r = clamp(t / dt - i), a = C.out[Math.max(0, i)], b = C.out[Math.max(0, i) + 1] || a;
  const mix = (p, q) => (p && q ? p.map((v, j) => lerp(v, q[j], r)) : p || q || null);
  const out = { body: mix(a.body, b.body), arms: {} };
  for (const s of ["R", "L"]) if (a.arms[s]) out.arms[s] = { nudge: mix(a.arms[s].nudge, b.arms[s].nudge), ...(a.arms[s].elbowNudge && { elbowNudge: mix(a.arms[s].elbowNudge, b.arms[s].elbowNudge) }) };
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
