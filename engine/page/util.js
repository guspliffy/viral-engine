// Small deterministic helpers. Nothing in the engine may use Math.random or the wall clock:
// every frame is a pure function of (storyboard, time), so a re-render gives the same video.

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const EASE = {
  linear: (x) => x,
  in: (x) => x * x * x,
  out: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  elastic: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  // acting eases, gentler than back: settle overshoots the target by about 4 % and eases back (follow-through),
  // antic pulls back about 4 % before it goes (anticipation), anticSettle does both
  settle: (x) => 1 + 2 * Math.pow(x - 1, 3) + Math.pow(x - 1, 2),
  antic: (x) => 2 * Math.pow(x, 3) - x * x,
  anticSettle: (x) => (x < 0.5 ? 0.5 * EASE.antic(2 * x) : 0.5 + 0.5 * EASE.settle(2 * x - 1)),
};
export const ease = (name) => EASE[name] || EASE.inOut;

// Natural motion (movement study, 31 Oct 2026; storyboard "motion"): opt-in, off by default so old clips render the
// same. "motion": "natural" turns on every part; an object turns them all on except the keys set false
// ({ "arcs": false }). Parts: gait (a walk that keeps its feet on the floor: cruise speed, feet locked while they
// stand, bob, weight shift over the standing foot, lean into the walk, arm swing), arcs (hands travel on arcs between
// poses), lead (the body leans into a reach a few frames before the hand gets there), turn (eyes lead, a dip and a
// small overshoot), sit (lean forward before standing up, a bounce on the seat), jiggle (the body squashes a little
// when it stops or lands, from the follow-through spring)
export const NATURAL_PARTS = ["gait", "arcs", "lead", "turn", "sit", "jiggle"];
const NAT = new WeakMap();
export function naturalOf(sb) {
  const m = sb && sb.motion;
  if (!m) return null;
  let n = NAT.get(sb);
  if (!n) { n = {}; for (const k of NATURAL_PARTS) n[k] = m === "natural" || m === true || (typeof m === "object" && m[k] !== false); NAT.set(sb, n); }
  return n;
}
// a walk's speed over its trip (natural gait): it speeds up over the first ramp q (a share of the trip's time), cruises
// at one speed, and slows over the last q. vel: speed as a share of the cruise speed (smoothstep ramps, so the
// acceleration starts and ends at 0); dist: the share of the way covered at progress p (the integral of vel)
export const cruiseVel = (p, q) => { if (q <= 0) return 1; const sm = (u) => u * u * (3 - 2 * u); return p < q ? sm(clamp(p / q)) : p > 1 - q ? sm(clamp((1 - p) / q)) : 1; };
export function cruiseDist(p, q) {
  if (q <= 0) return clamp(p);
  const ramp = (u) => q * (u * u * u - (u * u * u * u) / 2), tot = 1 - q;
  p = clamp(p);
  if (p < q) return ramp(p / q) / tot;
  if (p <= 1 - q) return (q / 2 + (p - q)) / tot;
  return 1 - ramp((1 - p) / q) / tot;
}
// a soft bump from 0 up to 1 and back to 0: rises over [a, b], falls over [b, c] (sin² edges, no kink anywhere)
export const bump = (t, a, b, c) => (t <= a || t >= c ? 0 : t < b ? Math.sin((Math.PI / 2) * (t - a) / (b - a)) ** 2 : Math.cos((Math.PI / 2) * (t - b) / (c - b)) ** 2);

// an arm's current target for a new arm action to start from: the pose it is on, or, while it is still moving, the
// blend it is in (potato.js resolves { mix }), so a new move never makes the hand jump
// (an acting ease can overshoot past 1 or start below 0, and that in-between blend is where the next move starts)
export const armNow = (a) => (a.p === 1 ? a.pose : a.p === 0 ? a.from : { mix: a });
// the share of each hop spent crouching on the ground before take-off (at least 0.1 s); the sound follows it
export const hopCrouch = (d, n = 1) => clamp(0.1 / (d / n), 0.15, 0.35);

// progress of an action that starts at `at` and lasts `dur`, at time t
export const prog = (t, at, dur) => (dur > 0 ? clamp((t - at) / dur) : t >= at ? 1 : 0);

// Loop-safe idle (storyboard "loop": true plus "loopIdle": true): a loop closes exactly when every rhythm turns a whole
// number of times over the clip, so its last frame runs into its first with no jump and no crossfade. loopLen(sb) is
// the clip length when that is on (else 0); loopRad(w, D) nudges an angular speed (rad/s) to the nearest one that turns
// a whole number of times (at least once) in D seconds, and leaves it as it is when D is 0, so other clips don't change.
export const loopLen = (sb) => (sb && sb.loop === true && sb.loopIdle === true && sb.duration > 0 ? sb.duration : 0);
export const loopRad = (w, D) => (D ? (Math.sign(w) * 2 * Math.PI * Math.max(1, Math.round((Math.abs(w) * D) / (2 * Math.PI)))) / D : w);
// the same for the page's drawing code (costumes, props, sets), which gets the frame time but not the storyboard:
// stage.js calls setLoop(sb) when it loads a clip, and rad(w) is loopRad(w, that clip's loop length)
let LOOP = 0;
export const setLoop = (sb) => { LOOP = loopLen(sb); };
export const loopNow = () => LOOP;
export const rad = (w) => loopRad(w, LOOP);

// smooth deterministic wobble, for idle motion and camera shake; D (a loop length, see loopLen) makes each of its
// three rhythms turn a whole number of times over the clip
export function wobble(t, seed, freq = 1, D = 0) {
  const s = seed * 12.9898;
  if (D) { const T = 2 * Math.PI; return Math.sin(t * loopRad(freq * T, D) + s) * 0.6 + Math.sin(t * loopRad(freq * 2.71 * T, D) + s * 1.7) * 0.3 + Math.sin(t * loopRad(freq * 5.13 * T, D) + s * 2.3) * 0.1; }
  return (Math.sin(t * freq * 6.283 + s) * 0.6 + Math.sin(t * freq * 2.71 * 6.283 + s * 1.7) * 0.3 + Math.sin(t * freq * 5.13 * 6.283 + s * 2.3) * 0.1);
}
