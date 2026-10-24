/* The move library: poses for PotatoBrawl's fighters, as functions of time.
   Runs in the game page (puppet/render.mjs splices it into the game's scope next to runtime.js); pure, no game state.

   A move is   (x) => pose   where x = { u, d, k, beat, amp, sk, side }:
     u     seconds since the action started,  d its duration,  k = u / d (0..1)
     beat  the music's beat count at this moment (2.0 = the third beat, 2.5 = halfway to the fourth)
     amp   how big the move is (1 = normal; 0.4 = a half-hearted copy)
     sk    the fighter's size in game units: { w, leg, tor }
   A pose holds any of:
     hF hB fF fB   front / back hand and foot, [x, y] in the fighter's own units (x forward, y up is negative, feet at 0)
     lean          body tilt in radians (+ = forward),  crouch 0..1,  hop (units up),  spin (radians, whole body)
     wingUp 0..1   (Phoenix: wings spread),  dx (units the body is shifted sideways, the feet stay)
     lift          units the whole fighter is raised (sitting on a seat)
   Moves never set the face; faces and the mouth are separate layers (runtime.js). */

const TAU = Math.PI * 2;
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const pulse = (beat) => 0.5 + 0.5 * Math.cos(TAU * beat);   // 1 on every beat, 0 halfway between
const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// where the hands and feet hang when nothing moves them (what the game's pose() does for a standing potato)
function restPose(sk, costume) {
  const { w, leg, tor } = sk;
  return {
    hF: costume === "reaper" ? [w * 0.9, -leg - tor * 0.36 + 4] : [w * 0.75, -leg - tor * 0.52 + 4],
    hB: [-w * 0.53, -leg - tor * 0.42 + 4],
    fF: [w * 0.24, 0], fB: [-w * 0.2, 0],
    lean: 0, crouch: 0, hop: 0, spin: 0, wingUp: 0, dx: 0, lift: 0,
  };
}

// handy heights: shoulder line, top of the head, hip
const lv = (sk) => ({ sh: -sk.leg - sk.tor * 0.5, top: -sk.leg - sk.tor, hip: -sk.leg * 0.6, w: sk.w });

const MOVES = {
  idle: () => ({}),

  // knees dip on every beat, fists pump
  bounce({ beat, amp, sk }) {
    const k = pulse(beat) * amp, L = lv(sk);
    return { crouch: 0.32 * k, hop: 3 * (1 - pulse(beat)) * amp, hF: [L.w * 0.7, L.sh + 8 * k], hB: [-L.w * 0.5, L.sh + 10 * k] };
  },
  // a small nod with the beat (deadpan dancing)
  nod({ beat, amp }) { const k = pulse(beat) * amp; return { lean: 0.1 * k, crouch: 0.08 * k }; },
  // hips sway side to side, one side per beat, arms loose and swinging against it
  groove({ beat, amp, sk }) {
    const s = Math.sin(Math.PI * beat) * amp, L = lv(sk);
    return { lean: 0.14 * s, dx: 4 * s, crouch: 0.15 * pulse(beat) * amp, hF: [L.w * (0.72 - 0.2 * s), L.sh + 6 - 8 * s], hB: [-L.w * (0.55 + 0.2 * s), L.sh + 6 + 8 * s] };
  },
  // raise the roof: both palms push up on every beat
  roof({ beat, amp, sk }) {
    const k = pulse(beat) * amp, L = lv(sk);
    return { crouch: 0.2 * k, hF: [L.w * 0.6, L.top - 6 - 14 * (1 - k) * amp], hB: [-L.w * 0.35, L.top - 4 - 14 * (1 - k) * amp] };
  },
  // disco point: up and out on even beats, down and across on odd ones; the other hand on the hip
  point({ beat, amp, sk }) {
    const L = lv(sk), up = Math.floor(beat + 0.25) % 2 === 0, k = sm((((beat + 0.25) % 1) * 4));
    const hi = [L.w * (0.6 + 0.4 * amp), L.top - 26 * amp], lo = [L.w * 0.15, L.hip + 6];
    return { lean: (up ? -0.08 : 0.1) * amp, crouch: 0.1 * amp, hF: up ? lerpP(lo, hi, k) : lerpP(hi, lo, k), hB: [-L.w * 0.42, L.hip - 4] };
  },
  // the floss: both arms swing low from one side to the other while the hips go the opposite way
  floss({ beat, amp, sk }) {
    const L = lv(sk), s = Math.sin(Math.PI * beat) * amp;
    return { dx: -5 * s, lean: -0.06 * s, hF: [L.w * (0.1 + 0.75 * s), L.hip + 2], hB: [L.w * (-0.1 + 0.75 * s), L.hip + 4] };
  },
  // arm wave: the arms ripple up and down out of phase
  wave2({ beat, amp, sk }) {
    const L = lv(sk), a = Math.sin(Math.PI * beat), b = Math.sin(Math.PI * beat - 1.4);
    return { hF: [L.w * 0.95, L.sh - 4 - 14 * a * amp], hB: [-L.w * 0.85, L.sh - 4 - 14 * b * amp], crouch: 0.12 * pulse(beat) * amp };
  },
  // step-touch: a step to one side every two beats, the feet follow
  step({ beat, amp, sk }) {
    const L = lv(sk), ph = beat % 2, side = ph < 1 ? 1 : -1, k = sm((ph % 1) * 2);
    const x = side * (2 * k - 1) * 6 * amp;
    return { dx: x, crouch: 0.18 * pulse(beat) * amp, fF: [L.w * 0.24 + x + 4 * side * amp, -3 * Math.sin(Math.PI * k) * amp], fB: [-L.w * 0.2 + x, 0], hF: [L.w * 0.7, L.sh + 4], hB: [-L.w * 0.5, L.sh + 4] };
  },
  // claps on the beat, hands meet in front of the belly
  clap({ beat, amp, sk }) {
    const L = lv(sk), k = pulse(beat);
    return { crouch: 0.12 * k * amp, hF: [L.w * (0.55 + 0.3 * (1 - k) * amp), L.sh + 6], hB: [L.w * (0.4 - 0.7 * (1 - k) * amp), L.sh + 6] };
  },
  // a hand up, waving
  wave({ u, amp, sk }) {
    const L = lv(sk);
    return { hF: [L.w * (0.85 + 0.2 * Math.sin(u * 14) * amp), L.top - 12 * amp] };
  },
  // shrug: hands out palm-up, shoulders up a little
  shrug({ k, sk }) {
    const L = lv(sk), e = Math.sin(Math.PI * Math.min(1, k * 1.5));
    return { crouch: 0.1 * e, hop: 2 * e, hF: [L.w * 1.05, L.sh - 6 * e], hB: [-L.w * 0.9, L.sh - 6 * e], lean: -0.05 * e };
  },
  // hands on hips (smug, waiting)
  hips({ sk }) { const L = lv(sk); return { hF: [L.w * 0.5, L.hip - 2], hB: [-L.w * 0.45, L.hip - 2], lean: -0.04 }; },
  // ta-da: both arms up in a V, chest out
  tada({ k, sk }) {
    const L = lv(sk), e = sm(k * 5);
    return { hF: [L.w * (0.75 + 0.3 * e), L.sh + (L.top - 22 - L.sh) * e], hB: [-L.w * (0.55 + 0.35 * e), L.sh + (L.top - 22 - L.sh) * e], lean: -0.08 * e, wingUp: e };
  },
  // Phoenix's wings spread wide, arms out
  flare({ k, sk }) { const L = lv(sk), e = sm(k * 4); return { wingUp: e, hF: [L.w * 1.0, L.sh - 10 * e], hB: [-L.w * 0.9, L.sh - 10 * e], lean: -0.06 * e }; },
  // a dizzy wobble after a spin: the body sways in a dying circle
  wobble({ u, sk }) {
    const L = lv(sk), d = Math.exp(-u * 1.2), s = Math.sin(u * 9);
    return { lean: 0.3 * s * d, dx: 6 * s * d, crouch: 0.25, hF: [L.w * 1.0, L.sh - 4 + 8 * s * d], hB: [-L.w * 0.9, L.sh - 4 - 8 * s * d] };
  },
  // walking: the feet swing, the body rocks (the runtime moves the fighter; this only animates the legs)
  walk({ u, amp, sk }) {
    const L = lv(sk), ph = u * 9 * (amp || 1);
    return { fF: [Math.sin(ph) * L.w * 0.4, -Math.max(0, Math.cos(ph)) * 7], fB: [-Math.sin(ph) * L.w * 0.4, -Math.max(0, -Math.cos(ph)) * 7], hop: Math.abs(Math.sin(ph)) * 2, lean: 0.08,
      hF: [L.w * (0.6 - 0.25 * Math.sin(ph)), L.sh + 8], hB: [-L.w * (0.4 - 0.25 * Math.sin(ph)), L.sh + 8] };
  },
  // tiptoe: small high steps, knees bent, hands up in front
  tiptoe({ u, sk }) {
    const L = lv(sk), ph = u * 7;
    return { crouch: 0.3, fF: [Math.sin(ph) * L.w * 0.25, -Math.max(0, Math.cos(ph)) * 9], fB: [-Math.sin(ph) * L.w * 0.25, -Math.max(0, -Math.cos(ph)) * 9], hop: Math.abs(Math.sin(ph)) * 3,
      hF: [L.w * 0.8, L.sh - 6], hB: [L.w * 0.35, L.sh - 4], lean: 0.12 };
  },
};

Object.assign(MOVES, {
  // sitting on a seat `seat` units high (a chair: 14): the body rests on it, the short legs dangle forward.
  // hands: "lap" (default), "table" (forward on a table top at y = -34) or "hold" (both in front, holding something)
  sit({ seat = 14, hands = "lap", sk, u }) {
    const L = lv(sk), sway = Math.sin(u * 2.2) * 1.2, ty = -34 + seat;
    const H = hands === "table" ? { hF: [L.w * 1.0, ty - 2], hB: [L.w * 0.75, ty - 1] } : hands === "hold" ? { hF: [L.w * 0.95, L.sh + 4], hB: [L.w * 0.75, L.sh + 6] } : { hF: [L.w * 0.7, -sk.leg + 2], hB: [-L.w * 0.35, -sk.leg + 2] };
    return { lift: seat, crouch: 0, lean: 0.03, fF: [L.w * 0.42, 5 + sway], fB: [L.w * 0.18, 7 - sway], ...H };
  },
  // kneeling on one knee, both hands forward and together (holding something out goes in "offer")
  kneel({ sk }) { const L = lv(sk); return { crouch: 0.75, lean: 0.12, fF: [L.w * 0.5, -1], fB: [-L.w * 0.45, 0], hF: [L.w * 0.95, L.sh + 10], hB: [L.w * 0.8, L.sh + 12] }; },
  // kneeling and offering with both hands raised in front: a held prop sits between the hands
  offer({ k, sk }) {
    const L = lv(sk), e = sm(k * 3);
    return { crouch: 0.75, lean: 0.12 + 0.06 * e, fF: [L.w * 0.5, -1], fB: [-L.w * 0.45, 0], hF: [L.w * (0.95 + 0.25 * e), L.sh + 10 - 14 * e], hB: [L.w * (0.8 + 0.25 * e), L.sh + 12 - 14 * e] };
  },
  // both hands in front at the chest, holding something (a jar, a plate)
  holdout({ sk, u, amp }) { const L = lv(sk), b = Math.sin(u * 3) * 1 * amp; return { hF: [L.w * 0.98, L.sh + 2 + b], hB: [L.w * 0.78, L.sh + 4 + b] }; },
  // one hand out in front, holding something up to look at it
  show({ sk }) { const L = lv(sk); return { hF: [L.w * 1.05, L.top + 4], lean: -0.04 }; },
  // carrying someone below by the hand: the back arm hangs straight down
  carryhand({ sk }) { const L = lv(sk); return { hB: [-L.w * 0.1, 6], hF: [L.w * 0.9, L.sh - 6], lean: 0.1 }; },
  // being carried: the front hand up, the body hangs and swings a little, the legs dangle
  dangle({ u, sk }) { const L = lv(sk), sw = Math.sin(u * 3.1); return { hF: [L.w * 0.15, L.top - 22], hB: [-L.w * 0.6, L.sh + 6 + 3 * sw], fF: [L.w * 0.18, 3 + 2 * sw], fB: [-L.w * 0.12, 5 - 2 * sw], lean: 0.12 * sw }; },
  // hovering in the air: wings up, legs tucked
  hover({ u, sk }) { const L = lv(sk), b = Math.sin(u * 4); return { wingUp: 0.6, hop: 3 * b, fF: [L.w * 0.2, -4], fB: [-L.w * 0.15, -3], hF: [L.w * 0.85, L.sh - 4], hB: [-L.w * 0.75, L.sh - 4] }; },
});
// how long a move takes to blend in and out when the storyboard doesn't say (sitting down is not a snap)
const MOVE_BLEND = { sit: [0.3, 0.3], kneel: [0.25, 0.25], offer: [0.25, 0.25], dangle: [0.15, 0.2], hover: [0.2, 0.2] };

// Moves that add on top of whatever the body is doing (a hop or spin during a dance loop).
const ADDS = {
  // count hops in the action's time, each `height` units high
  hop({ u, d, amp, count }) { const n = count || 1, p = (u / d) * n, f = p % 1; return { hop: Math.sin(Math.PI * f) * 22 * amp, crouch: f < 0.12 || f > 0.9 ? 0.25 : 0 }; },
  // full turns over the action, eased; a spin also lifts a little
  spin({ k, amp, turns }) { const e = sm(k); return { spin: TAU * (turns || 1) * e * Math.sign(amp || 1), hop: Math.sin(Math.PI * k) * 16 * Math.abs(amp || 1) }; },
  // a quick shudder (shock, sneeze build-up)
  shake({ u, amp }) { return { dx: Math.sin(u * 70) * 2.2 * amp }; },
  // lean in a direction for the action (a look, a double-take recoil)
  lean({ k, amp }) { return { lean: 0.25 * amp * Math.sin(Math.PI * Math.min(1, k * 2)) }; },
};
