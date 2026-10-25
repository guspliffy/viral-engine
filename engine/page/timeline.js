import { EXPRESSIONS, blendExpr } from "./face.js";
import { clamp, lerp, lerp3, ease, prog, wobble, rng, armNow, hopCrouch } from "./util.js";
import { planSyllables, mouthAt } from "../shared/syllables.js";
import { isDance, applyDance } from "./dance.js";
import { SEAT_Y, propState, gripWorld } from "./props3d.js";

// syllable plans are pure functions of (action, voice): cache them per action object
const PLANS = new WeakMap();
const planFor = (a, voice) => { let p = PLANS.get(a); if (!p) { p = planSyllables(a, voice); PLANS.set(a, p); } return p; };

// Turns a storyboard into per-frame state. Everything is a pure function of time t:
// each actor starts from its cast entry and the actions up to t are applied in order.

const YAW = { camera: 0, front: 0, right: Math.PI / 2, left: -Math.PI / 2, "3q-right": 0.62, "3q-left": -0.62, back: Math.PI };
const yawOf = (v) => (typeof v === "number" ? (v * Math.PI) / 180 : YAW[v] ?? 0);

// hovering after a fly: a gentle bob that fades in, and a wing beat that settles from full to 60 %
const hoverBob = (u) => 0.035 * Math.sin(u * 5.5) * clamp(u / 0.3);
const hoverFlap = (u) => 0.6 + 0.4 * (1 - clamp(u / 0.25));

// Wing beats and a charged staff's sparkles speed up and slow down. Their phase is the integral of the speed over
// time: t × speed would jump whenever the speed changes. The integral is summed in fixed steps from 0 and cached,
// so it is the same whatever order frames are drawn in (stills, drafts and full renders agree).
// fine face controls on top of the expression (face.js Face.set): per-eye lid closing, per-side brow height and tilt,
// per-side mouth corners and pressed lips. All 0 by default; "face" actions blend them.
const neutralExpr = (def) => { const n = def.face?.neutral || {}, o = {}; for (const k in EXPRESSIONS.kind) if (n[k] != null) o[k] = n[k]; return o; };
export const FACE_KEYS = ["lidL", "lidR", "browL", "browR", "tiltL", "tiltR", "cornerL", "cornerR", "press"];
const FACE_BOTH = { lid: ["lidL", "lidR"], brow: ["browL", "browR"], tilt: ["tiltL", "tiltR"], corner: ["cornerL", "cornerR"] };
// mitten hand shapes (potato.js): curl of the fingers, the index finger and the thumb, 0 straight .. 1 closed
export const GRIPS = {
  open:  { curl: 0.15, index: 0.12, thumb: 0.1 },
  hold:  { curl: 0.95, index: 0.95, thumb: 0.85 },   // wrapped round a handle, a staff or a jar
  fist:  { curl: 1.2,  index: 1.2,  thumb: 1.0 },
  pinch: { curl: 0.7,  index: 0.85, thumb: 1.0 },    // thumb and index meet: a cup handle, a lid
  point: { curl: 1.15, index: 0.0,  thumb: 0.9 },
  cup:   { curl: 0.5,  index: 0.45, thumb: 0.35, up: 1 },   // palm up, cradling something from below: an orb, a jar's base
  flat:  { curl: 0.0,  index: 0.0,  thumb: 0.0 },    // open palm
  // a teacup or mug handle: the fist closes round the handle's upright bar (axis: up), thumb on top of the handle, the
  // curled fingers under and round it, lying against the cup body in front
  teacup: { curl: 0.95, index: 0.95, thumb: 0.9, axis: [0, 1, 0], fwd: 0.7 },
};
// up: how far the palm turns to face the sky (1 for a cupped hand carrying something from below)
// axis: a handle held without a costume prop (the teacup), in the actor's root space; the fist only turns onto it once
// the hand is closing, so taking it from either end of the blend never pops. fwd: how far the fist turns its
// knuckles to face forward (0 along the forearm, 1 straight ahead)
const blendGrip = (a, b, t) => ({ curl: lerp(a.curl, b.curl, t), index: lerp(a.index, b.index, t), thumb: lerp(a.thumb, b.thumb, t), up: lerp(a.up || 0, b.up || 0, t), fwd: lerp(a.fwd || 0, b.fwd || 0, t), axis: (t < 0.5 ? a.axis || b.axis : b.axis || a.axis) || null });

// a blink at 30 fps: closes over about 2.5 frames, shut for one, reopens over about 4 (u: seconds since it began)
export const BLINK_LEN = 0.26;
export const blinkAt = (u) => (u < 0 || u > BLINK_LEN ? 0 : u < 0.08 ? Math.sin((u / 0.08) * Math.PI / 2) : u < 0.11 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.11) / 0.15) * Math.PI));

const PHASES = new WeakMap(), STEP = 1 / 120;
function phases(sb, actor, def, t) {
  let per = PHASES.get(sb); if (!per) { per = new Map(); PHASES.set(sb, per); }
  let P = per.get(actor.id);
  if (!P) { P = { flap: [0], charge: [0], need: (sb.actions || []).some((a) => a.who === actor.id && ["fly", "hover", "drop", "charge"].includes(a.do)) }; per.set(actor.id, P); }
  if (!P.need) return { flapPhase: 7 * t, chargePhase: 0 };
  const k = Math.max(0, Math.floor(t / STEP));
  const rate = (u) => { const s = actorState(sb, actor, def, u, true); return [7 + 17 * (s.flap || 0), s.charge || 0]; };
  for (let i = P.flap.length; i <= k; i++) { const [f, c] = rate((i - 1) * STEP); P.flap.push(P.flap[i - 1] + f * STEP); P.charge.push(P.charge[i - 1] + c * STEP); }
  const [f, c] = rate(k * STEP), r = t - k * STEP;
  return { flapPhase: P.flap[k] + f * r, chargePhase: P.charge[k] + c * r };
}

// where the eyes look at time u, from the look actions alone (the body's follow reads it a little in the past)
function lookAt(looks, u) {
  let l = [0, 0];
  for (const a of looks) {
    if (a.at > u) break;
    const e = ease(a.ease || "inOut")(prog(u, a.at, a.dur ?? 0.3));
    l = [lerp(l[0], a.to[0], e), lerp(l[1], a.to[1], e)];
  }
  return l;
}

// where a "ride" action puts its rider at time u: the prop's position plus the offset turned with the prop
function rideAt(sb, a, u) {
  const spec = (sb.props || []).find((q) => q.id === a.prop); if (!spec) return { x: 0, y: 0, z: 0, yaw: 0 };
  const ps = propState(sb, spec, u), r = (ps.rot * Math.PI) / 180, s = ps.scale ?? 1, [ox, oy, oz] = (a.off || [0, 0, 0]).map((v) => v * s);
  return { x: ps.x + Math.cos(r) * ox + Math.sin(r) * oz, y: ps.y + oy, z: ps.z - Math.sin(r) * ox + Math.cos(r) * oz, yaw: r + ((a.yaw ?? 0) * Math.PI) / 180 };
}

export function actorState(sb, actor, def, t, raw = false) {
  const c = actor;
  const st = {
    x: c.at[0], z: c.at[1], y: c.y ?? 0, yaw: yawOf(c.face ?? "camera"), lean: 0, pitch: 0, wings: 0, flap: 0, squash: 1,
    // the character's designed neutral face (face.neutral in its file) sits on top of its default expression; an
    // explicit c.expr or an "expr" action is acting and replaces it
    expr: { ...(EXPRESSIONS[c.expr || (def.face && def.face.default) || "kind"] || EXPRESSIONS.kind), ...(c.expr ? {} : neutralExpr(def)) },
    look: [0, 0], blink: 0, talk: 0, round: 0,
    arms: { R: { from: c.arms?.R || def?.arms?.R || "rest", pose: c.arms?.R || def?.arms?.R || "rest", p: 1 }, L: { from: c.arms?.L || def?.arms?.L || "rest", pose: c.arms?.L || def?.arms?.L || "rest", p: 1 } },
    walk: 0, walkAmt: 0, tuck: 0, droop: 0, charge: 0, form: "potato", friesPop: 1, flip: 0,
    hatOff: [0, 0, 0], hatSpin: [0, 0, 0], hatOn: true, visible: true, scale: c.scale ?? 1,
    face: Object.fromEntries(FACE_KEYS.map((k) => [k, def.face?.neutral?.[k] ?? 0])),
    grip: { R: { ...(GRIPS[c.grip?.R || def.hands?.grip?.R] || GRIPS.open) }, L: { ...(GRIPS[c.grip?.L || def.hands?.grip?.L] || GRIPS.open) } },
    hatTip: [0, 0], hatBrim: 0,
  };
  let autoBlink = true, airSince = null, riding = null, unsit = null;   // airSince: when the last fly or hover ended (it then hovers until a drop)
  let idle = 1, sink = 0, shakeDx = 0;   // a "still" turns the idle breathing and sway down (see below the loop)
  const acts = (sb.actions || []).filter((a) => a.who === c.id && a.at <= t).sort((a, b) => a.at - b.at);
  for (const a of acts) {
    const d = a.dur ?? 0.3, p = prog(t, a.at, d), e = ease(a.ease || "inOut")(p);
    switch (a.do) {
      case "move": {
        st.x = lerp(st.x, a.to[0], e); st.z = lerp(st.z, a.to[1], e);
        if (p < 1) { st.walkAmt = Math.min(1, Math.min(p, 1 - p) * 8); st.walk = (t - a.at) * (a.steps ?? 2.2); }
        break;
      }
      case "hop": {
        const n = a.count ?? 1, h = a.height ?? 0.3, local = clamp((t - a.at) / d) * n, k = Math.min(n - 1, Math.floor(local)), q = local - k;
        // anticipation: the body crouches on the ground first (at least 0.1 s, shallower when it is shorter than
        // 0.2 s), then takes off and lands at the hop's end. The crouch, the stretch in the air and the landing squash
        // are sin² curves that start and end at rest, so they join without a kink and no frame steps out, wherever
        // the frames fall
        const qa = hopCrouch(d, n), dip = 0.14 * Math.min(1, (qa * d) / n / 0.2);
        if (p < 1) {
          const air = q < qa ? 0 : (q - qa) / (1 - qa);
          st.y += h * 4 * air * (1 - air);
          st.squash *= q < qa ? 1 - dip * Math.sin((q / qa) * Math.PI) ** 2 : 1 + 0.1 * Math.sin(air * Math.PI) ** 2;
          st.tuck = Math.sin(air * Math.PI);
        } else {
          const after = t - (a.at + d);
          if (after < 0.2) st.squash *= 1 - 0.18 * Math.sin((after / 0.2) * Math.PI) ** 2;
        }
        break;
      }
      case "turn": {
        // the short way round (back to left is a quarter turn, not three quarters)
        let to = yawOf(a.to);
        while (to - st.yaw > Math.PI + 0.01) to -= 2 * Math.PI;
        while (to - st.yaw < -Math.PI - 0.01) to += 2 * Math.PI;
        st.yaw = lerp(st.yaw, to, e); break;
      }
      case "lean": st.lean = lerp(st.lean, ((a.to ?? 0) * Math.PI) / 180, e); break;
      // tip forward (+) or back about the body's middle; 360 is a flip (see the pivot below the loop)
      case "pitch": st.flip = lerp(st.flip, ((a.to ?? 0) * Math.PI) / 180, e); break;
      // set: change only some of the face's numbers (face.js), e.g. one brow up ({ raise }) or the mouth tightening
      // ({ curve, smirk }), on top of the named expression or of the face as it is
      case "expr": st.expr = blendExpr(st.expr, a.set ? { ...(EXPRESSIONS[a.expr] || st.expr), ...a.set } : EXPRESSIONS[a.expr] || st.expr, ease("out")(prog(t, a.at, a.dur ?? 0.15))); break;
      case "look": {
        // a big change of attention starts with a blink (a.blink: false turns it off)
        if (a.blink !== false && Math.hypot(a.to[0] - st.look[0], a.to[1] - st.look[1]) > 0.6) st.blink = Math.max(st.blink, blinkAt(t - a.at));
        st.look = [lerp(st.look[0], a.to[0], e), lerp(st.look[1], a.to[1], e)]; break;
      }
      case "talk": {
        // mouth follows the same syllables the voice synth speaks (engine/shared/syllables.js)
        if (t < a.at + (a.dur ?? 1)) {
          const m = mouthAt(planFor(a, typeof def.voice === "object" ? def.voice : {}), t);
          if (m.open > st.talk) { st.talk = m.open * 0.75; st.round = m.round; }
        }
        break;
      }
      case "arm": {
        // "rest" is the character's own resting pose when it has one (the Wizard's hand on his staff)
        const own = (s) => (a.pose === "rest" ? c.arms?.[s] || def?.arms?.[s] || "rest" : a.pose);
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.arms[s] = { from: armNow(st.arms[s]), pose: own(s), p: e };
        break;
      }
      case "blink": if (p < 1) st.blink = a.dur ? Math.sin(p * Math.PI) : blinkAt(t - a.at); break;
      case "noblink": autoBlink = false; break;
      // purposeful stillness: idle breathing and sway fade down to `idle` (default 0.25, 0 = dead still) and back up
      // over `fade` s at either end, while the body sinks a little (`sink`) so the hold doesn't read as frozen;
      // blink: false also holds the automatic blinks
      case "still": {
        const f = a.fade ?? 0.15, dd = a.dur ?? 1, k = clamp((t - a.at) / f) * (1 - clamp((t - a.at - dd) / f));
        idle = Math.min(idle, lerp(1, a.idle ?? 0.25, k));
        sink = Math.max(sink, (a.sink ?? 0.008) * k * clamp((t - a.at) / dd));
        break;
      }
      case "charge": st.charge = lerp(st.charge, a.to ?? 1, e); break;
      case "droop": st.droop = lerp(st.droop, a.to ?? 1, e); break;
      case "swap": st.form = a.form || "fries"; st.friesPop = ease("back")(p); break;
      case "hat": {
        st.hatOff = lerp3(st.hatOff, a.off || [0, 0, 0], e);
        st.hatSpin = lerp3(st.hatSpin, (a.spin || [0, 0, 0]).map((x) => (x * Math.PI) / 180), e);
        break;
      }
      // { do: "face", lidL, lidR, browL, browR, tiltL, tiltR, cornerL, cornerR, press } (or lid, brow, tilt, corner for
      // both sides): blends the given controls to the given values; the ones left out keep theirs
      case "face": {
        for (const k of FACE_KEYS) if (a[k] != null) st.face[k] = lerp(st.face[k], a[k], e);
        for (const k in FACE_BOTH) if (a[k] != null) for (const kk of FACE_BOTH[k]) st.face[kk] = lerp(st.face[kk], a[k], e);
        break;
      }
      // { do: "grip", side: "R" | "L" | "both", shape: "open" | "hold" | "fist" | "pinch" | "point" } (mitten hands)
      case "grip": {
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.grip[s] = blendGrip(st.grip[s], GRIPS[a.shape] || GRIPS.hold, e);
        break;
      }
      // the Wizard hat's secondary motion: tip: [forward, sideways] in degrees bends the top of the cone, brim tips the brim
      // (+ front up); "hatwobble" adds a decaying wobble (amount in degrees, freq in Hz) over its dur
      case "hatsway": {
        const tip = (a.tip || [0, 0]).map((x) => (x * Math.PI) / 180);
        st.hatTip = [lerp(st.hatTip[0], tip[0], e), lerp(st.hatTip[1], tip[1], e)]; st.hatBrim = lerp(st.hatBrim, a.brim ?? 0, e);
        break;
      }
      case "hatwobble": {
        if (p < 1) {
          const u = t - a.at, k = (1 - p) ** 2 * clamp(u / 0.06), w = ((a.amount ?? 8) * Math.PI / 180) * Math.sin(u * 6.283 * (a.freq ?? 3)) * k;
          st.hatTip = [st.hatTip[0] + 0.5 * w, st.hatTip[1] + w]; st.hatBrim += 0.6 * w;
        }
        break;
      }
      case "grow": st.scale = lerp(st.scale, a.to ?? 1, e); break;
      case "hide": st.visible = false; break;
      case "show": st.visible = true; break;
      case "squash": if (p < 1) st.squash *= 1 - (a.amount ?? 0.2) * Math.sin(p * Math.PI); break;
      case "wings": st.wings = lerp(st.wings, a.to ?? 1, e); break;   // Phoenix: 0 folded, 1 spread
      // flying (Phoenix's wings flap; anyone else just floats): fly to { x, y }, hover in place, drop like a stone
      case "fly": {
        // already hovering (a fly after a fly): start from where the bob had it and from the wing beat it had
        const hov = airSince != null ? a.at - airSince : null;
        if (hov != null) st.y += hoverBob(hov);
        const to = a.to || {}, k = ease(a.ease || "inOut")(p), dir = Math.sign((to.x ?? st.x) - st.x);
        st.x = lerp(st.x, to.x ?? st.x, k); st.y = lerp(st.y, to.y ?? st.y, k); st.z = lerp(st.z, to.z ?? st.z, k);
        // wings, wing beat and tucked feet ease in over a few frames (a step from one frame to the next reads as a glitch)
        const k0 = clamp((t - a.at) / 0.15);
        st.wings = Math.max(st.wings, Math.min(1, (t - a.at) / 0.12)); st.tuck = Math.max(st.tuck, 0.7 * k0);
        if (p < 1) { st.flap = Math.max(st.flap, lerp(hov != null ? hoverFlap(hov) : 0, 1, k0)); st.lean += -0.12 * Math.sin(Math.PI * p) * dir; airSince = null; } else airSince = a.at + d;
        break;
      }
      case "hover": {
        const k0 = clamp((t - a.at) / 0.15);
        st.wings = Math.max(st.wings, Math.min(1, (t - a.at) / 0.12)); st.flap = Math.max(st.flap, 0.6 * k0); st.tuck = Math.max(st.tuck, 0.7 * k0); airSince = airSince ?? a.at; break;
      }
      case "drop": {
        // it starts from where the hover bob had it, with the wing beat it had, and both fade out over 0.12 s
        const bob0 = airSince != null ? hoverBob(a.at - airSince) : 0, f0 = airSince != null ? hoverFlap(a.at - airSince) : st.flap;
        const y0 = st.y + bob0, to = a.to ?? 0, k = clamp((t - a.at) / d), out = 1 - clamp((t - a.at) / 0.12);
        airSince = null; st.flap = f0 * out;
        st.y = lerp(y0, to, k * k);   // speeds up like a falling stone
        st.wings = st.wings * (1 - clamp((t - a.at) / 0.15));
        st.tuck = p < 1 ? lerp(st.tuck, 0.4, clamp((t - a.at) / 0.1)) : 0.4 * (1 - clamp((t - a.at - d) / 0.12));   // eases into the tuck (it used to snap from 0)
        if (p < 1) st.squash *= 1 + 0.08 * k; else { const after = t - (a.at + d); if (after < 0.22) st.squash *= 1 - 0.28 * Math.sin((after / 0.22) * Math.PI); }
        break;
      }
      // climbing hand over hand (a tree): to { y, x?, z? } in `steps` pulls (default 4), arms reaching up in turn; it
      // stays up there (no hover) until the next climb or a drop
      case "climb": {
        const to = a.to || {}, n = a.steps ?? 4, local = Math.min(p, 0.9999) * n, j = Math.floor(local), q = local - j;
        const k = p >= 1 ? 1 : (j + ease("inOut")(q)) / n;
        // from a hover it starts at the bob's height and the wing beat fades out (as a drop does)
        const bob0 = airSince != null ? hoverBob(a.at - airSince) : 0, f0 = airSince != null ? hoverFlap(a.at - airSince) : st.flap;
        st.x = lerp(st.x, to.x ?? st.x, k); st.y = lerp(st.y + bob0, to.y ?? st.y, k); st.z = lerp(st.z, to.z ?? st.z, k);
        airSince = null; st.flap = f0 * (1 - clamp((t - a.at) / 0.12));
        if (p < 1) {
          const [up, dn] = j % 2 ? ["L", "R"] : ["R", "L"];
          st.arms[up] = { from: "hold", pose: "up", p: Math.sin(q * Math.PI * 0.5) };
          st.arms[dn] = { from: "up", pose: "hold", p: Math.sin(q * Math.PI * 0.5) };
          st.squash *= 1 - 0.05 * Math.sin(q * Math.PI);
        } else {   // keep the last pull's arms (one up, one holding) so the next "arm" tweens from there
          const [up, dn] = (n - 1) % 2 ? ["L", "R"] : ["R", "L"];
          st.arms[up] = { from: "up", pose: "up", p: 1 }; st.arms[dn] = { from: "hold", pose: "hold", p: 1 };
        }
        break;
      }
      // sitting on a chair prop (seat: its id) until "stand"; hands: lap, table or hold (the right hand holds)
      case "sit": {
        const ch = (sb.props || []).find((q) => q.id === a.seat) || { x: st.x, z: st.z, rot: 0, scale: 1 };
        const k = ease("inOut")(prog(t, a.at, a.dur ?? 0.35)), sc = ch.scale ?? 1, yaw = ((ch.rot ?? 0) * Math.PI) / 180;
        const along = (a.along ?? 0) * sc;   // along the seat (its own x), e.g. at one end of a bench
        st.x = lerp(st.x, ch.x + Math.cos(yaw) * along + Math.sin(yaw) * 0.03, k); st.z = lerp(st.z, ch.z - Math.sin(yaw) * along + Math.cos(yaw) * 0.03, k);
        st.y = lerp(st.y, (ch.y ?? 0) + SEAT_Y * sc - 0.12, k) + 0.08 * Math.sin(Math.PI * k); st.yaw = lerp(st.yaw, yaw, k); st.sit = k; st.seat = a.seat;
        const hands = a.hands || "lap", pose = { R: hands === "hold" ? "hold" : hands, L: hands === "hold" ? "lap" : hands };
        for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: pose[s], p: k };
        break;
      }
      case "stand": {
        const k = e;
        st.y = lerp(st.y, 0, k) + 0.06 * Math.sin(Math.PI * k); st.sit = (st.sit || 0) * (1 - k); st.z = lerp(st.z, st.z + 0.12, k);
        for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: c.arms?.[s] || def?.arms?.[s] || "rest", p: k };
        break;
      }
      // a single-hand grab lifts that arm to hold, or to its own pose; pose: null leaves the arm where it is (the hand
      // closes on the prop where it stands, and a later arm action lifts it). Both hands: use holdout or offer.
      // hand "tip": the prop hangs from the point of the character's own prop (Reaper's scythe); "hat": it sticks to
      // the hat (use keep: true); the arms stay as they are
      case "grab": if ((a.hand === "R" || a.hand === "L") && a.pose !== null) st.arms[a.hand] = { from: armNow(st.arms[a.hand]), pose: a.pose ?? "hold", p: ease("out")(prog(t, a.at, a.dur ?? 0.25)) }; break;
      case "release": break;
      // the held prop's angle in degrees, [forward, outward], instead of the one the arm pose gives; to: null hands it back
      case "tilt": st.propTilt = { from: st.propTilt || null, to: a.to ? a.to.map((d) => (d * Math.PI) / 180) : null, k: e }; break;
      // riding a prop (a car, a bike, a cart, a bus roof): from here on x / y / z / yaw follow the prop, at `off`
      // [x, y, z] in the prop's own frame and `yaw` degrees from its heading, eased in over dur; actions after it
      // (hops, turns) still add on top. { do: "ride", prop: null } gets off where the prop has carried it.
      case "ride": {
        if (riding) { const T = rideAt(sb, riding.a, a.at); [st.x, st.y, st.z, st.yaw] = [T.x, T.y + (st.y - riding.from.y), T.z, T.yaw]; if (riding.a.sit) unsit = a.at; riding = null; }
        if (a.prop) riding = { a, from: { x: st.x, y: st.y, z: st.z, yaw: st.yaw } };
        break;
      }
      default: if (isDance(a.do)) { const x0 = st.x; applyDance(sb, a, t, st); if (a.do === "shake") shakeDx += st.x - x0; }   // dance.js: moves on the music's beat
    }
  }
  // getting off a seat: the sitting pose eases out over 0.25 s instead of snapping to standing
  if (unsit != null && !(riding && riding.a.sit)) st.sit = Math.max(st.sit || 0, 1 - ease("inOut")(prog(t, unsit, 0.25)));
  if (riding) {
    const { a, from } = riding, T = rideAt(sb, a, t), k = ease(a.ease || "inOut")(prog(t, a.at, a.dur ?? 0.3));
    st.x = lerp(from.x, T.x, k) + (st.x - from.x); st.y = lerp(from.y, T.y, k) + (st.y - from.y); st.z = lerp(from.z, T.z, k) + (st.z - from.z);
    st.yaw = lerp(from.yaw, T.yaw, k) + (st.yaw - from.yaw);
    if (a.sit) st.sit = Math.max(st.sit || 0, k);
  }
  // planted feet: the feet stay where the last step left them (a move, a turn, a dance step). What the body does on
  // top of that (pitch, lean, the follow below, a shake, breathing) doesn't slide them. potato.js draws them there.
  const plant = { x: st.x - shakeDx, y: st.y - 0.1 * (st.kneel || 0), z: st.z, yaw: st.yaw };
  // still in the air after a fly: hover with a gentle bob that fades in, wings beating slower
  if (airSince != null && st.y > 0.01) {
    st.y += hoverBob(t - airSince); st.wings = Math.max(st.wings, 1); st.flap = Math.max(st.flap, hoverFlap(t - airSince)); st.tuck = Math.max(st.tuck, 0.7);
  }
  // the body follows the eyes (cast "follow", 0..1): it turns and tips toward where they look, by about a fifth of
  // the look, averaged over the last 0.3 s so it trails the eyes by a few frames and arrives softly
  if (c.follow) {
    const looks = acts.filter((a) => a.do === "look");
    let lx = 0, ly = 0;
    for (let i = 0; i < 6; i++) { const l = lookAt(looks, t - 0.05 - i * 0.05); lx += l[0] / 6; ly += l[1] / 6; }
    st.yaw += c.follow * 0.14 * lx; st.flip -= c.follow * 0.12 * ly;
  }
  // a pitch action turns the body about its middle, not its feet, so a flip in the air doesn't swing the head down
  // through whatever the character is jumping over (dance tips, like a nod, stay on the feet)
  if (st.flip) {
    const c = 0.5 * (st.scale ?? 1), f = c * Math.sin(st.flip);
    st.y += c * (1 - Math.cos(st.flip)); st.x -= f * Math.sin(st.yaw); st.z -= f * Math.cos(st.yaw);
    st.pitch += st.flip;
  }
  // in the air, sitting, or tipped far over (a flip) the feet go with the body instead, blended so nothing pops
  plant.w = Math.max(clamp(plant.y / 0.03), st.sit || 0, clamp((Math.abs(st.flip) - 0.5) / 0.3));
  st.plant = plant;
  // idle life: breathing, a little sway, automatic blinks
  const seed = c.seed ?? c.id.length * 3.1;
  st.squash *= (1 + 0.012 * idle * Math.sin(t * 6.283 * 0.8 + seed)) * (1 - sink);
  st.lean += 0.012 * idle * wobble(t, seed, 0.35);
  if (autoBlink && st.blink === 0) {
    const r = rng(Math.floor(seed * 1000)), period = 2.6 + r() * 1.2, off = r() * period, ph = (t + off) % period;
    if (blinkFree(sb, c.id, t - ph)) st.blink = blinkAt(ph);
  }
  if (!raw) { Object.assign(st, phases(sb, actor, def, t)); resolveArms(sb, st, def, t); }
  return st;
}

// an automatic blink starting at tb is skipped, whole, when it would land on a key beat: inside a still hold
// (unless it says blink: true), or on an expression change or a look (an eye-blink there kills the moment)
function blinkFree(sb, id, tb) {
  for (const a of sb.actions || []) {
    if (a.who !== id) continue;
    if (a.do === "still" && a.blink !== true && tb + 0.13 > a.at && tb < a.at + (a.dur ?? 1) + (a.fade ?? 0.15)) return false;
    if (a.do === "expr" && tb > a.at - 0.3 && tb < a.at + 0.25) return false;
    if (a.do === "look" && tb > a.at - 0.15 && tb < a.at + (a.dur ?? 0.3)) return false;
  }
  return true;
}

// arm poses aimed at the world: { prop, grip, at?, off? } puts the hand on that grip point of the prop (where the prop
// stands, or where it would stand with its bottom at `at`: carrying it there), { world: [x, y, z] } on a point. They
// become ordinary local poses here, for the body as it is posed right now, so the hand stays on target while the
// body leans, turns or breathes.
const LEG_H = 0.14;   // potato.js
function resolveArms(sb, st, def, t) {
  const H = def.body.height, sc = st.scale ?? 1;
  const T = [st.x, st.y - 0.1 * (st.kneel || 0), st.z], yaw = st.yaw, pitch = st.pitch || 0, lean = st.lean || 0;
  const toLocal = (W) => {
    // potato.js turns the body by yaw, then pitch, then lean (Euler YXZ); undo them in the reverse order
    let [x, y, z] = [W[0] - T[0], W[1] - T[1], W[2] - T[2]];
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) + z * Math.sin(pitch), -y * Math.sin(pitch) + z * Math.cos(pitch)];
    [x, y] = [x * Math.cos(lean) + y * Math.sin(lean), -x * Math.sin(lean) + y * Math.cos(lean)];
    [x, y, z] = [x / sc, y / sc, z / sc];
    // potato.js squashes hand heights with the body; aim so the squashed hand lands on the point
    return { x: [x, (LEG_H + (y - LEG_H) / st.squash - LEG_H) / H, z] };
  };
  const world = (q) => {
    if (q.world) return q.world;
    const spec = (sb.props || []).find((p) => p.id === q.prop);
    if (!spec) throw new Error(`arm pose aims at unknown prop: ${q.prop}`);
    const ps = propState(sb, spec, t), o = q.off || [0, 0, 0];
    const w = gripWorld(spec, q.grip ?? [0, 0.05, 0], q.at || [ps.x, ps.y, ps.z], ps.rot, ps.scale, ps.tilt, ps.tip);
    return [w[0] + o[0], w[1] + o[1], w[2] + o[2]];
  };
  // palm: the point the palm turns to face (mitten hands): true for the prop's own axis at the grip's height, or a point
  // on the prop ([x, y, z] in its own space; a world point for a world pose). "wrap": the axis too, with the fingers
  // going round it level (a jar held from the side or behind) instead of along the forearm
  const palmWorld = (q) => {
    if (q.world) return Array.isArray(q.palm) ? q.palm : null;
    const spec = (sb.props || []).find((p) => p.id === q.prop), ps = propState(sb, spec, t), g = q.grip ?? [0, 0.05, 0];
    return gripWorld(spec, Array.isArray(q.palm) ? q.palm : [0, g[1], 0], q.at || [ps.x, ps.y, ps.z], ps.rot, ps.scale, ps.tilt, ps.tip);
  };
  const aim = (q) => {
    const w = q.palm ? palmWorld(q) : null;
    return w ? { ...toLocal(world(q)), palm: toLocal(w).x, ...(q.palm === "wrap" ? { wrap: true } : {}) } : toLocal(world(q));
  };
  const res = (q) => (q && q.mix ? { mix: { ...q.mix, from: res(q.mix.from), pose: res(q.mix.pose) } } : q && (q.prop || q.world) ? aim(q) : q);
  for (const s of ["R", "L"]) { const a = st.arms[s]; if (a) st.arms[s] = { ...a, from: res(a.from), pose: res(a.pose) }; }
}

// a camera path: sb.camera = [{ at, pos, look, fov, stop? }, ...] keys the camera through one continuous move. Between
// keys it follows a smooth curve (cubic Hermite, Catmull-Rom tangents in time), so a push, a tilt and a rise blend into
// each other with no corner; `stop: true` (and the first and last key) eases into and out of that key, as a hold.
// Two keys with the same pos/look in a row hold the camera still between them.
function pathAt(keys, t) {
  const K = [...keys].sort((a, b) => a.at - b.at);
  if (t <= K[0].at) return K[0];
  if (t >= K[K.length - 1].at) return K[K.length - 1];
  let i = 0; while (K[i + 1].at < t) i++;
  const a = K[i], b = K[i + 1], h = b.at - a.at, u = (t - a.at) / h;
  const tan = (j, f) => {
    const k = K[j]; if (k.stop || j === 0 || j === K.length - 1) return 0;
    const p = K[j - 1], n = K[j + 1]; return (f(n) - f(p)) / (n.at - p.at);
  };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const herm = (f) => h00 * f(a) + h10 * h * tan(i, f) + h01 * f(b) + h11 * h * tan(i + 1, f);
  const fov0 = (k) => k.fov ?? 32;
  return { pos: [0, 1, 2].map((c) => herm((k) => k.pos[c])), look: [0, 1, 2].map((c) => herm((k) => k.look[c])), fov: herm(fov0) };
}

export function cameraState(sb, t) {
  const shots = (sb.shots || []).filter((s) => s.at <= t).sort((a, b) => a.at - b.at);
  const s = shots[shots.length - 1] || { pos: [0, 1, 6], look: [0, 0.7, 0], fov: 32 };
  let pos = s.pos, look = s.look, fov = s.fov ?? 32;
  if (Array.isArray(sb.camera) && sb.camera.length) ({ pos, look, fov } = pathAt(sb.camera, t));
  else if (s.to) {
    const e = ease(s.ease || "inOut")(prog(t, s.at, s.dur ?? 1));
    pos = lerp3(s.pos, s.to.pos || s.pos, e); look = lerp3(s.look, s.to.look || s.look, e); fov = lerp(fov, s.to.fov ?? fov, e);
  }
  let shake = [0, 0, 0];
  for (const f of sb.fx || []) {
    if (f.do !== "shake" || t < f.at || t > f.at + (f.dur ?? 0.3)) continue;
    const k = 1 - (t - f.at) / (f.dur ?? 0.3), amp = (f.amp ?? 0.05) * k;
    // two sines under 15 Hz: anything faster than half the frame rate aliases into random-looking jitter
    shake = [shake[0] + amp * (0.65 * Math.sin(t * 45.9 + 1.3) + 0.35 * Math.sin(t * 74.8 + 4.1)), shake[1] + amp * (0.65 * Math.sin(t * 52.2 + 2.7) + 0.35 * Math.sin(t * 69.1 + 0.6)), 0];
  }
  return { pos: [pos[0] + shake[0], pos[1] + shake[1], pos[2]], look: [look[0] + shake[0] * 0.5, look[1] + shake[1] * 0.5, look[2]], fov, shotIndex: shots.length - 1 };
}

export function flashAt(sb, t) {
  let o = 0;
  for (const f of sb.fx || []) {
    if (f.do !== "flash" || t < f.at) continue;
    const d = f.dur ?? 0.35, k = (t - f.at) / d;
    // default peak 0.8: a full-white frame reads as a glitch and blanks the picture for a frame
    // a flash hits at full strength on its first frame (so a cut or a swap on that frame is covered) and fades out
    if (k <= 1) o = Math.max(o, (f.peak ?? 0.8) * (k < 0.15 ? 1 : 1 - (k - 0.15) / 0.85));
  }
  return clamp(o);
}

// the room's lights: "lights" effects fade the set's lights (to) and its lamp (lamp, else the same as to) to a level,
// 1 being as built. sb.set.lights starts the room at another level (0.1: the lights are off)
export function lightsAt(sb, t) {
  let room = sb.set?.lights ?? 1, lamp = room;
  for (const f of [...(sb.fx || [])].filter((q) => q.do === "lights" && q.at <= t).sort((a, b) => a.at - b.at)) {
    const e = ease(f.ease || "inOut")(prog(t, f.at, f.dur ?? 0.15));
    const r = f.to ?? room, l = f.lamp ?? f.to ?? lamp;
    room = lerp(room, r, e); lamp = lerp(lamp, l, e);
  }
  return { room, lamp };
}

export function captionsAt(sb, t) {
  return (sb.captions || []).filter((c) => t >= c.from && t < c.to).map((c) => {
    const k = t - c.from;
    const pop = c.pop === false ? 1 : k < 0.14 ? 0.82 + 0.18 * ease("back")(k / 0.14) : 1.0;
    return { ...c, scale: pop };
  });
}
