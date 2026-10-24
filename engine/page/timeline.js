import { EXPRESSIONS, blendExpr } from "./face.js";
import { clamp, lerp, lerp3, ease, prog, wobble, rng, armNow, hopCrouch } from "./util.js";
import { planSyllables, mouthAt } from "../shared/syllables.js";
import { isDance, applyDance } from "./dance.js";
import { SEAT_Y } from "./props3d.js";

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

export function actorState(sb, actor, def, t, raw = false) {
  const c = actor;
  const st = {
    x: c.at[0], z: c.at[1], y: c.y ?? 0, yaw: yawOf(c.face ?? "camera"), lean: 0, pitch: 0, wings: 0, flap: 0, squash: 1,
    expr: { ...(EXPRESSIONS[c.expr || (def.face && def.face.default) || "kind"] || EXPRESSIONS.kind) },
    look: [0, 0], blink: 0, talk: 0, round: 0,
    arms: { R: { from: c.arms?.R || "rest", pose: c.arms?.R || "rest", p: 1 }, L: { from: c.arms?.L || "rest", pose: c.arms?.L || "rest", p: 1 } },
    walk: 0, walkAmt: 0, tuck: 0, droop: 0, charge: 0, form: "potato", friesPop: 1, flip: 0,
    hatOff: [0, 0, 0], hatSpin: [0, 0, 0], hatOn: true, visible: true, scale: c.scale ?? 1,
  };
  let autoBlink = true, airSince = null;   // airSince: when the last fly or hover ended (it then hovers until a drop)
  let idle = 1, sink = 0, holdBlink = true;   // a "still" turns the idle breathing and sway down (see below the loop)
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
      case "expr": st.expr = blendExpr(st.expr, EXPRESSIONS[a.expr] || st.expr, ease("out")(prog(t, a.at, a.dur ?? 0.15))); break;
      case "look": st.look = [lerp(st.look[0], a.to[0], e), lerp(st.look[1], a.to[1], e)]; break;
      case "talk": {
        // mouth follows the same syllables the voice synth speaks (engine/shared/syllables.js)
        if (t < a.at + (a.dur ?? 1)) {
          const m = mouthAt(planFor(a, typeof def.voice === "object" ? def.voice : {}), t);
          if (m.open > st.talk) { st.talk = m.open * 0.75; st.round = m.round; }
        }
        break;
      }
      case "arm": {
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.arms[s] = { from: armNow(st.arms[s]), pose: a.pose, p: e };
        break;
      }
      case "blink": if (p < 1) st.blink = Math.sin(p * Math.PI); break;
      case "noblink": autoBlink = false; break;
      // purposeful stillness: idle breathing and sway fade down to `idle` (default 0.25, 0 = dead still) and back up
      // over `fade` s at either end, while the body sinks a little (`sink`) so the hold doesn't read as frozen;
      // blink: false also holds the automatic blinks
      case "still": {
        const f = a.fade ?? 0.15, dd = a.dur ?? 1, k = clamp((t - a.at) / f) * (1 - clamp((t - a.at - dd) / f));
        idle = Math.min(idle, lerp(1, a.idle ?? 0.25, k));
        sink = Math.max(sink, (a.sink ?? 0.008) * k * clamp((t - a.at) / dd));
        if (a.blink === false && k > 0) holdBlink = false;
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
        st.x = lerp(st.x, to.x ?? st.x, k); st.y = lerp(st.y, to.y ?? st.y, k);
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
        st.tuck = p < 1 ? lerp(Math.max(st.tuck, 0.4), 0.4, clamp((t - a.at) / 0.1)) : 0.4 * (1 - clamp((t - a.at - d) / 0.12));
        if (p < 1) st.squash *= 1 + 0.08 * k; else { const after = t - (a.at + d); if (after < 0.22) st.squash *= 1 - 0.28 * Math.sin((after / 0.22) * Math.PI); }
        break;
      }
      // sitting on a chair prop (seat: its id) until "stand"; hands: lap, table or hold (the right hand holds)
      case "sit": {
        const ch = (sb.props || []).find((q) => q.id === a.seat) || { x: st.x, z: st.z, rot: 0, scale: 1 };
        const k = ease("inOut")(prog(t, a.at, a.dur ?? 0.35)), sc = ch.scale ?? 1, yaw = ((ch.rot ?? 0) * Math.PI) / 180;
        st.x = lerp(st.x, ch.x + Math.sin(yaw) * 0.03, k); st.z = lerp(st.z, ch.z + Math.cos(yaw) * 0.03, k);
        st.y = lerp(st.y, (ch.y ?? 0) + SEAT_Y * sc - 0.12, k) + 0.08 * Math.sin(Math.PI * k); st.yaw = lerp(st.yaw, yaw, k); st.sit = k; st.seat = a.seat;
        const hands = a.hands || "lap", pose = { R: hands === "hold" ? "hold" : hands, L: hands === "hold" ? "lap" : hands };
        for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: pose[s], p: k };
        break;
      }
      case "stand": {
        const k = e;
        st.y = lerp(st.y, 0, k) + 0.06 * Math.sin(Math.PI * k); st.sit = (st.sit || 0) * (1 - k); st.z = lerp(st.z, st.z + 0.12, k);
        for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: c.arms?.[s] || "rest", p: k };
        break;
      }
      // a single-hand grab lifts that arm to hold (both hands: use holdout or offer for the arms)
      // hand "tip": the prop hangs from the point of the character's own prop (Reaper's scythe), the arm stays as it is
      case "grab": if (a.hand && a.hand !== "both" && a.hand !== "tip") st.arms[a.hand] = { from: armNow(st.arms[a.hand]), pose: "hold", p: ease("out")(prog(t, a.at, a.dur ?? 0.25)) }; break;
      case "release": break;
      // the held prop's angle in degrees, [forward, outward], instead of the one the arm pose gives; to: null hands it back
      case "tilt": st.propTilt = { from: st.propTilt || null, to: a.to ? a.to.map((d) => (d * Math.PI) / 180) : null, k: e }; break;
      default: if (isDance(a.do)) applyDance(sb, a, t, st);   // dance.js: moves on the music's beat
    }
  }
  // still in the air after a fly: hover with a gentle bob that fades in, wings beating slower
  if (airSince != null && st.y > 0.01) {
    st.y += hoverBob(t - airSince); st.wings = Math.max(st.wings, 1); st.flap = Math.max(st.flap, hoverFlap(t - airSince)); st.tuck = Math.max(st.tuck, 0.7);
  }
  // a pitch action turns the body about its middle, not its feet, so a flip in the air doesn't swing the head down
  // through whatever the character is jumping over (dance tips, like a nod, stay on the feet)
  if (st.flip) {
    const c = 0.5 * (st.scale ?? 1), f = c * Math.sin(st.flip);
    st.y += c * (1 - Math.cos(st.flip)); st.x -= f * Math.sin(st.yaw); st.z -= f * Math.cos(st.yaw);
    st.pitch += st.flip;
  }
  // idle life: breathing, a little sway, automatic blinks
  const seed = c.seed ?? c.id.length * 3.1;
  st.squash *= (1 + 0.012 * idle * Math.sin(t * 6.283 * 0.8 + seed)) * (1 - sink);
  st.lean += 0.012 * idle * wobble(t, seed, 0.35);
  if (autoBlink && holdBlink && st.blink === 0) {
    const r = rng(Math.floor(seed * 1000)), period = 2.6 + r() * 1.2, off = r() * period, ph = ((t + off) % period) / period, bl = 0.13 / period;
    if (ph < bl) st.blink = Math.sin((ph / bl) * Math.PI);
  }
  if (!raw) Object.assign(st, phases(sb, actor, def, t));
  return st;
}

export function cameraState(sb, t) {
  const shots = (sb.shots || []).filter((s) => s.at <= t).sort((a, b) => a.at - b.at);
  const s = shots[shots.length - 1] || { pos: [0, 1, 6], look: [0, 0.7, 0], fov: 32 };
  let pos = s.pos, look = s.look, fov = s.fov ?? 32;
  if (s.to) {
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
