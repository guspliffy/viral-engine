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
};
export const ease = (name) => EASE[name] || EASE.inOut;

// progress of an action that starts at `at` and lasts `dur`, at time t
export const prog = (t, at, dur) => (dur > 0 ? clamp((t - at) / dur) : t >= at ? 1 : 0);

// smooth deterministic wobble, for idle motion and camera shake
export function wobble(t, seed, freq = 1) {
  const s = seed * 12.9898;
  return (Math.sin(t * freq * 6.283 + s) * 0.6 + Math.sin(t * freq * 2.71 * 6.283 + s * 1.7) * 0.3 + Math.sin(t * freq * 5.13 * 6.283 + s * 2.3) * 0.1);
}
