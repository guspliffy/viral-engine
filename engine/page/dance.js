import { clamp, armNow } from "./util.js";

// Dance moves for the 3D engine, on the music's beat (sb.music: { bpm, offset }). The same names as the puppet
// renderer's move library (puppet/page/moves.js), so one choreography reads the same in both.
//
//   { who, at, dur, do: "bounce" | "groove" | "point" | "floss" | "clap" | "roof" | "wave2" | "nod" | "tada" | "flare" | "wobble",
//     amp (1 = normal, 0.3 = a half-hearted copy), speed (beat multiple) }
//   added on top of anything: "spin" (turns, dir), "shake" (amp)
// A move blends in over 0.12 s and out over 0.18 s after its end. Arms are hand targets (potato.js handTarget):
//   { o: [out, up, fwd] }  mirrored per side: out past the body's edge, up as a share of the body height, fwd forward
//   { x: [x, up, fwd] }    an absolute x in the character's own space (for hands that cross the middle)
const TAU = Math.PI * 2;
const pulse = (b) => 0.5 + 0.5 * Math.cos(TAU * b);
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

const MOVES = {
  bounce({ b, amp }) { const k = pulse(b) * amp; return { y: 0.045 * (1 - pulse(b)) * amp, squash: 1 - 0.09 * k, arms: { R: { o: [0.1, 0.55 - 0.1 * k, 0.26] }, L: { o: [0.1, 0.55 - 0.1 * k, 0.26] } } }; },
  groove({ b, amp }) { const s = Math.sin(Math.PI * b) * amp; return { lean: 0.1 * s, x: 0.035 * s, squash: 1 - 0.05 * pulse(b) * amp, arms: { R: { o: [0.08 + 0.07 * s, 0.32, 0.14] }, L: { o: [0.08 - 0.07 * s, 0.32, 0.14] } } }; },
  point({ b, amp }) {
    const up = Math.floor(b + 0.25) % 2 === 0, k = sm(((b + 0.25) % 1) * 4);
    const hi = [0.22 + 0.12 * amp, 0.75 + 0.5 * amp, 0.2], lo = [-0.3 * amp, 0.25, 0.32], r = (p, q) => p.map((v, i) => v + (q[i] - v) * k);
    // body lean and turn swing with the arm (they used to flip in one frame on every beat)
    const lean = (up ? -0.07 + 0.14 * (1 - k) : 0.07 - 0.14 * (1 - k)) * amp, yaw = (up ? 0.15 - 0.25 * (1 - k) : -0.1 + 0.25 * (1 - k)) * amp;
    return { lean, yaw, squash: 1 - 0.04 * amp, arms: { R: { o: up ? r(lo, hi) : r(hi, lo) }, L: "hips" } };
  },
  floss({ b, amp }) {
    const s = Math.sin(Math.PI * b), c = Math.cos(Math.PI * b), X = 0.5 * s * amp;
    return { x: -0.05 * s * amp, lean: -0.06 * s * amp, arms: { R: { x: [X - 0.12, 0.16, 0.22 * c * amp + 0.06] }, L: { x: [X + 0.12, 0.16, -0.22 * c * amp + 0.06] } } };
  },
  clap({ b, amp }) { const k = pulse(b), w = 0.07 + 0.3 * (1 - k) * amp; return { squash: 1 - 0.05 * k * amp, arms: { R: { x: [-w, 0.5, 0.38] }, L: { x: [w, 0.5, 0.38] } } }; },
  roof({ b, amp }) { const k = pulse(b); return { squash: 1 - 0.06 * k * amp, arms: { R: { o: [-0.04, 1.05 + 0.15 * (1 - k) * amp, 0.1] }, L: { o: [-0.04, 1.05 + 0.15 * (1 - k) * amp, 0.1] } } }; },
  wave2({ b, amp }) { return { squash: 1 - 0.04 * pulse(b) * amp, arms: { R: { o: [0.3, 0.6 + 0.28 * Math.sin(Math.PI * b) * amp, 0.05] }, L: { o: [0.3, 0.6 + 0.28 * Math.sin(Math.PI * b - 1.4) * amp, 0.05] } } }; },
  nod({ b, amp }) { return { pitch: 0.14 * pulse(b) * amp, squash: 1 - 0.03 * pulse(b) * amp }; },
  tada({ k }) { const e = sm(k * 5); return { squash: 1 + 0.05 * e, wings: e, arms: { R: { o: [0.08 + 0.2 * e, 0.4 + 0.85 * e, 0.06] }, L: { o: [0.08 + 0.2 * e, 0.4 + 0.85 * e, 0.06] } } }; },
  flare({ k }) { const e = sm(k * 4); return { wings: e, arms: { R: { o: [0.4 * e + 0.08, 0.3 + 0.45 * e, 0.0] }, L: { o: [0.4 * e + 0.08, 0.3 + 0.45 * e, 0.0] } } }; },
  wobble({ u }) {
    const d = Math.exp(-u * 1.2), s = Math.sin(u * 9);
    return { lean: 0.28 * s * d, yaw: 0.3 * Math.sin(u * 6) * d, squash: 0.96, arms: { R: { o: [0.35, 0.7 + 0.1 * s * d, 0.05] }, L: { o: [0.35, 0.7 - 0.1 * s * d, 0.05] } } };
  },
  // poses for the comedy clips (not on the beat); they hold for `dur`
  kneel({ k }) { return { kneel: 1, lean: 0.06, pitch: 0.12, arms: { R: { o: [0.06, 0.3, 0.2] }, L: { o: [0.06, 0.3, 0.2] } } }; },
  offer({ u }) { return { kneel: 1, pitch: 0.16, arms: { R: { x: [-0.14, 0.62 + 0.02 * Math.sin(u * 3), 0.5] }, L: { x: [0.14, 0.62 + 0.02 * Math.sin(u * 3), 0.5] } } }; },
  holdout({ u }) { return { pitch: 0.05, arms: { R: { x: [-0.14, 0.5 + 0.015 * Math.sin(u * 3), 0.5] }, L: { x: [0.14, 0.5 + 0.015 * Math.sin(u * 3), 0.5] } } }; },
  show({ u }) { const e = sm(u * 4); return { squash: 1 + 0.03 * e, arms: { R: { o: [0.12, 0.6 + 0.55 * e, 0.22] }, L: "hips" } }; },
  // Reaper's scythe: wind up high, sweep the blade across the front, settle back
  swing({ k }) {
    const w = sm(k / 0.3), s = sm((k - 0.3) / 0.3), back = sm((k - 0.65) / 0.35), up = w * (1 - s), sweep = s * (1 - back);
    return {
      yaw: 0.35 * up - 0.55 * sweep, lean: -0.08 * up + 0.1 * sweep, squash: 1 + 0.04 * up - 0.05 * sweep, propSpin: 0.7 * up - 2.0 * sweep,
      arms: { R: { o: [0.1 + 0.05 * up - 0.3 * sweep, 0.4 + 0.75 * up - 0.05 * sweep, 0.16 + 0.3 * sweep] } },
    };
  },
};
const ADDS = {
  // a sine ease: its top speed is 1.6x the average (the cubic one's is 3x, which strobes front/back/front at 30 fps)
  spin({ k, a }) { return { yaw: TAU * (a.turns ?? 1) * (0.5 - 0.5 * Math.cos(Math.PI * k)) * (a.dir ?? 1), y: 0.14 * Math.sin(Math.PI * k) }; },
  // a tremble at 7.5 Hz, a quarter of the frame rate: 0, +1, 0, -1 on successive frames, an even vibration
  // (11 Hz sampled at 30 fps came out as an irregular jitter with odd single frames)
  shake({ u, amp }) { return { x: 0.014 * Math.sin(u * Math.PI * 15) * amp }; },
};
export const isDance = (name) => !!(MOVES[name] || ADDS[name]);

// apply one dance action to the actor state at t (called from timeline.js in action order)
export function applyDance(sb, a, t, st) {
  const d = a.dur ?? 1, end = a.at + d, rel = a.release ?? 0.18;
  // a spin of 1.5 turns ends facing the other way, and stays that way (instead of snapping back)
  if (a.do === "spin" && t > end) { st.yaw += TAU * ((a.turns ?? 1) % 1) * (a.dir ?? 1); return; }
  if (t > end + rel) return;
  const add = !!ADDS[a.do];
  const env = add ? (t <= end ? 1 : 0) : Math.min(clamp((t - a.at) / (a.blend ?? 0.12)), t <= end ? 1 : 1 - sm((t - end) / rel));
  if (env <= 0) return;
  const m = sb.music || {}, u = clamp(t, a.at, end) - a.at;
  const b = ((Math.min(t, end) - (m.offset || 0)) * (m.bpm || 120) / 60) * (a.speed || 1);
  const r = (add ? ADDS : MOVES)[a.do]({ a, u, k: d > 0 ? u / d : 1, b, amp: a.amp ?? 1 });
  st.y += (r.y || 0) * env; st.x += (r.x || 0) * env; st.lean += (r.lean || 0) * env; st.yaw += (r.yaw || 0) * env;
  st.pitch = (st.pitch || 0) + (r.pitch || 0) * env;
  if (r.squash) st.squash *= 1 + (r.squash - 1) * env;
  if (r.kneel) st.kneel = Math.max(st.kneel || 0, r.kneel * env);
  if (r.propSpin) st.propSpin = (st.propSpin || 0) + r.propSpin * env;
  if (r.wings != null) st.wings = Math.max(st.wings || 0, r.wings * env);
  if (r.arms) for (const s of ["R", "L"]) if (r.arms[s]) st.arms[s] = { from: armNow(st.arms[s]), pose: r.arms[s], p: env };
}
