import { EXPRESSIONS, blendExpr } from "./face.js";
import { clamp, lerp, lerp3, ease, prog, wobble, rng } from "./util.js";

// Turns a storyboard into per-frame state. Everything is a pure function of time t:
// each actor starts from its cast entry and the actions up to t are applied in order.

const YAW = { camera: 0, front: 0, right: Math.PI / 2, left: -Math.PI / 2, "3q-right": 0.62, "3q-left": -0.62, back: Math.PI };
const yawOf = (v) => (typeof v === "number" ? (v * Math.PI) / 180 : YAW[v] ?? 0);

export function actorState(sb, actor, def, t) {
  const c = actor;
  const st = {
    x: c.at[0], z: c.at[1], y: 0, yaw: yawOf(c.face ?? "camera"), lean: 0, squash: 1,
    expr: { ...(EXPRESSIONS[c.expr || (def.face && def.face.default) || "kind"] || EXPRESSIONS.kind) },
    look: [0, 0], blink: 0, talk: 0,
    arms: { R: { from: c.arms?.R || "rest", pose: c.arms?.R || "rest", p: 1 }, L: { from: c.arms?.L || "rest", pose: c.arms?.L || "rest", p: 1 } },
    walk: 0, walkAmt: 0, tuck: 0, droop: 0, charge: 0, form: "potato", friesPop: 1,
    hatOff: [0, 0, 0], hatSpin: [0, 0, 0], hatOn: true, visible: true,
  };
  let autoBlink = true;
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
        if (p < 1) {
          st.y += h * 4 * q * (1 - q);
          st.squash *= q < 0.12 ? 1 - 0.18 * Math.sin((q / 0.12) * Math.PI) : 1 + 0.12 * Math.sin(q * Math.PI);
          st.tuck = Math.sin(q * Math.PI);
        } else {
          const after = t - (a.at + d);
          if (after < 0.16) st.squash *= 1 - 0.2 * Math.sin((after / 0.16) * Math.PI);
        }
        break;
      }
      case "turn": st.yaw = lerp(st.yaw, yawOf(a.to), e); break;
      case "lean": st.lean = lerp(st.lean, ((a.to ?? 0) * Math.PI) / 180, e); break;
      case "expr": st.expr = blendExpr(st.expr, EXPRESSIONS[a.expr] || st.expr, ease("out")(prog(t, a.at, a.dur ?? 0.15))); break;
      case "look": st.look = [lerp(st.look[0], a.to[0], e), lerp(st.look[1], a.to[1], e)]; break;
      case "talk": {
        if (t < a.at + d) {
          const k = t - a.at, syl = Math.abs(Math.sin(k * 6.283 * (a.rate ?? 3.2))) * (0.55 + 0.45 * Math.abs(Math.sin(k * 6.283 * 1.13 + 1)));
          st.talk = Math.max(st.talk, 0.1 + 0.5 * syl);
        }
        break;
      }
      case "arm": {
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.arms[s] = { from: st.arms[s].pose, pose: a.pose, p: e };
        break;
      }
      case "blink": if (p < 1) st.blink = Math.sin(p * Math.PI); break;
      case "noblink": autoBlink = false; break;
      case "charge": st.charge = lerp(st.charge, a.to ?? 1, e); break;
      case "droop": st.droop = lerp(st.droop, a.to ?? 1, e); break;
      case "swap": st.form = a.form || "fries"; st.friesPop = ease("back")(p); break;
      case "hat": {
        st.hatOff = lerp3(st.hatOff, a.off || [0, 0, 0], e);
        st.hatSpin = lerp3(st.hatSpin, (a.spin || [0, 0, 0]).map((x) => (x * Math.PI) / 180), e);
        break;
      }
      case "hide": st.visible = false; break;
      case "show": st.visible = true; break;
      case "squash": if (p < 1) st.squash *= 1 - (a.amount ?? 0.2) * Math.sin(p * Math.PI); break;
    }
  }
  // idle life: breathing, a little sway, automatic blinks
  const seed = c.seed ?? c.id.length * 3.1;
  st.squash *= 1 + 0.012 * Math.sin(t * 6.283 * 0.8 + seed);
  st.lean += 0.012 * wobble(t, seed, 0.35);
  if (autoBlink && st.blink === 0) {
    const r = rng(Math.floor(seed * 1000)), period = 2.6 + r() * 1.2, off = r() * period, ph = ((t + off) % period) / period, bl = 0.13 / period;
    if (ph < bl) st.blink = Math.sin((ph / bl) * Math.PI);
  }
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
    shake = [shake[0] + amp * wobble(t, 1.3, 9), shake[1] + amp * wobble(t, 2.7, 11), 0];
  }
  return { pos: [pos[0] + shake[0], pos[1] + shake[1], pos[2]], look: [look[0] + shake[0] * 0.5, look[1] + shake[1] * 0.5, look[2]], fov, shotIndex: shots.length - 1 };
}

export function flashAt(sb, t) {
  let o = 0;
  for (const f of sb.fx || []) {
    if (f.do !== "flash" || t < f.at) continue;
    const d = f.dur ?? 0.35, k = (t - f.at) / d;
    if (k <= 1) o = Math.max(o, (f.peak ?? 1) * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85));
  }
  return clamp(o);
}

export function captionsAt(sb, t) {
  return (sb.captions || []).filter((c) => t >= c.from && t < c.to).map((c) => {
    const k = t - c.from;
    const pop = c.pop === false ? 1 : k < 0.14 ? 0.82 + 0.18 * ease("back")(k / 0.14) : 1.0;
    return { ...c, scale: pop };
  });
}
