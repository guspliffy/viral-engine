// PIZZA, take 2: the same "how each fighter eats their pizza" clip, redone to Jonny's rules for the series (2026-10-24):
// a set that fits the activity (a pizzeria) and, for every fighter, a habit real people have when they eat pizza,
// done their own signature way. One continuous take; the 10 slices count down, the Sorcerer takes two, so the Viking
// finds an empty board and eats that. Frame 0 is the Astronaut mid cheese-pull, and the last frame sets it up again.
// Writes a beat storyboard (docs/STORYBOARD.md): storyboards/pizza-02-restaurant.json, one beat per fighter.
//   node storyboards/make-pizza-02.mjs
import { writeFileSync } from "node:fs";

const ENTER = [-2.7, -1.5], WAIT = [-0.9, -1.5], MARK = [0, -0.75], EXIT = [2.7, -1.1];   // the next one queues at WAIT
const TS = 0.75, TOP = 0.62 * TS + 0.026;   // table scale; the table top plus the pizza board, where the slices lie
const MOUTH = [0, 0.64, -0.25];              // in front of the mouth of a fighter standing on MARK
const WALK_IN = 0.4, WALK_OUT = 0.6, QUEUE = 0.6, K = 0.88;   // K: each turn (but the Viking's) plays at 0.88x its written times
const SL = 1.65, PZ = 1.2;   // the pizza is 1.2x, so it reads too                             // a taken slice grows to 1.5x, so it reads at phone size
const r3 = (x) => Math.round(x * 1000) / 1000;

// each entry: who, how, len (from arriving on the mark to walking off), and its items with times from arriving.
// S(t, set, dur, ease) tweens this fighter's slice; P(...) the pizza; A(t, do, opts) an action of this fighter;
// bites(t, n, gap) eats the slice in n bites. take(t, j) takes this fighter's j-th slice (the Sorcerer takes two); S2 tweens
// the second one. C(...) tweens the cheese string, B(...) the lightning bolt.
const FIGHTERS = [
  { id: "ast", habit: "the cheese pull", character: "astronaut", how: "the cheese pull that never ends (zero gravity)", len: 2.0, expr: "eager", start: true, b: ({ A, S, C, bites }) => [
    // frame 0: the slice is already at his mouth (the end of the clip puts it there); it floats away, the cheese stretches
    S(0, { x: 0.3, y: 1.05, z: -0.2 }, 0.6, "out"),
    C(0, { len: 0.51 }, 0.6, "out"),
    A(0, "look", { to: [0.4, 0.5], dur: 0.2 }),
    C(0.6, { len: 0 }, 0.08, "in"),                           // ...and snaps
    S(0.6, { y: 1.15 }, 0.35, "out"),
    A(0.62, "expr", { expr: "shocked" }),
    A(0.75, "fly", { to: { y: 0.45 }, dur: 0.35 }),
    A(0.75, "arm", { side: "both", pose: "up", dur: 0.2 }),
    S(1.1, { x: MOUTH[0], y: MOUTH[1] + 0.45, z: MOUTH[2] }, 0.2),
    A(1.1, "look", { to: [0, 0], dur: 0.15 }),
    A(1.15, "expr", { expr: "delighted" }),
    A(1.15, "arm", { side: "both", pose: "rest", dur: 0.2 }),
    ...bites(1.3, 2, 0.2),
    A(1.75, "drop", { to: 0, dur: 0.25 }),
  ], sfx: [{ sfx: "whoosh", at: 0, dur: 0.6, gain: 0.15 }, { sfx: "pop", at: 0.6, gain: 0.3 }] },

  { id: "rea", habit: "eats sooo slowly", character: "reaper", how: "the slow eater: three tiny, very polite bites", len: 1.6, expr: "deadpan", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "L", pose: "hold", dur: 0.2 }),
    S(0.05, { x: MOUTH[0] - 0.05, y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.35),
    ...bites(0.35, 4, 0.3),
    A(0.8, "blink", { dur: 0.15 }),
    A(1.45, "arm", { side: "L", pose: "rest", dur: 0.15 }),
  ] },

  { id: "sor", habit: "takes two", character: "sorcerer", how: "the greedy one: takes two slices, makes a pizza sandwich", len: 1.75, expr: "evil", b: ({ A, S, S2, bites, take }) => [
    A(0, "charge", { to: 1, dur: 0.25 }),
    A(0, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    ...take(0.1), ...take(0.15, 1),
    S(0.1, { y: 0.95, z: -0.1, rot: 162, tilt: 0 }, 0.4, "out"), S2(0.15, { y: 1.1, z: -0.1, rot: 162, tilt: 0 }, 0.4, "out"),
    { fx: "sparkle", who: "sor", at: 0.1, dur: 0.8, count: 6, color: "#b6ff9a" },
    A(0.4, "look", { to: [0.2, 0.7], dur: 0.15 }),
    S(0.6, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.35, "inOut"),
    S2(0.6, { x: MOUTH[0], y: MOUTH[1] + 0.035, z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.35, "inOut"),   // stacked
    A(0.7, "charge", { to: 0, dur: 0.3 }),
    A(0.7, "arm", { side: "L", pose: "rest", dur: 0.25 }),
    A(0.7, "look", { to: [0, 0], dur: 0.15 }),
    ...bites(1.0, 2, 0.24, true),
    A(1.5, "expr", { expr: "smug" }),
  ] },

  { id: "wiz", habit: "the spell goes wrong", character: "wizard", how: "a spell to make it bigger shrinks it (messes up)", len: 1.7, expr: "eager", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "R", pose: "cast", dur: 0.2 }),
    A(0, "charge", { to: 1, dur: 0.3 }),
    { fx: "poof", pos: [0, TOP + 0.05, 0.1], at: 0.4, dur: 0.45, puffs: 5, sparks: 10, spark: "#c8b6ff" },
    S(0.4, { scale: 0.3 }, 0.25, "in"),
    A(0.45, "charge", { to: 0, dur: 0.15 }),
    A(0.5, "expr", { expr: "sad" }),
    A(0.5, "droop", { to: 1, dur: 0.25 }),
    A(0.75, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    S(0.85, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.3),
    ...bites(1.2, 1, 0.2),
  ], sfx: [{ sfx: "sadslide", at: 0.45, gain: 0.22 }] },

  { id: "dra", habit: "bites too soon", character: "dragon", how: "bites too soon: too hot, breathes fire", len: 1.95, expr: "eager", b: ({ A, S, F, bites, take }) => [
    ...take(0),
    S(0, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.3),
    S(0.35, { scale: 1.1 }, 0.1, "out"), A(0.35, "squash", { amount: 0.08, dur: 0.12 }),   // a big first bite...
    A(0.5, "expr", { expr: "shocked" }),                                  // ...way too hot
    S(0.5, { x: 0.45, y: 0.55, z: -0.15 }, 0.2, "out"),
    A(0.55, "arm", { side: "R", pose: "wave", dur: 0.15 }),               // fanning his mouth
    A(0.55, "wings", { to: 1, dur: 0.15 }),
    F(0.6, { x: 0.14, y: 0.7, z: -0.12 }, 0.01), F(0.62, { fire: 1 }, 0.12, "out"),
    S(0.65, { toast: 1 }, 0.4),
    F(1.0, { fire: 0 }, 0.2, "in"),
    A(1.05, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(1.05, "wings", { to: 0, dur: 0.25 }),
    A(1.1, "expr", { expr: "delighted" }),
    S(1.15, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2] }, 0.25),
    ...bites(1.45, 1, 0.2),
  ], fx: [{ fx: "shake", at: 0.62, dur: 0.15, amp: 0.03 }, { fx: "poof", pos: [0.14, 0.85, -0.1], at: 1.0, dur: 0.5, puffs: 3, sparks: 0 }], sfx: [{ sfx: "whoosh", at: 0.62, dur: 0.4, gain: 0.25 }] },

  { id: "phx", habit: "the messy one", character: "phoenix", how: "the messy eater: flips it to catch it, it lands on his face", len: 1.9, expr: "cocky", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "R", pose: "up", dur: 0.15 }),
    S(0.05, { y: 1.55, z: -0.3, rot: 520, tilt: 200 }, 0.5, "out"),
    A(0.2, "wings", { to: 1, dur: 0.2 }),
    A(0.3, "expr", { expr: "shocked" }),
    A(0.3, "look", { to: [0, 0.8], dur: 0.15 }),
    S(0.55, { y: 0.8, z: -0.36, rot: 522, tilt: 270 }, 0.3, "in"),   // lands flat on his face
    A(0.85, "squash", { amount: 0.18, dur: 0.2 }),
    A(0.85, "look", { to: [0, 0], dur: 0.1 }),
    A(0.85, "expr", { expr: "dizzy" }),
    S(1.0, { y: MOUTH[1], tilt: 350 }, 0.35, "in"),                     // slides down into his mouth
    A(1.0, "wings", { to: 0, dur: 0.25 }),
    ...bites(1.35, 1, 0.2),
    A(1.6, "expr", { expr: "cocky" }),
  ], sfx: [{ sfx: "whoosh", at: 0.05, dur: 0.5, gain: 0.25 }, { sfx: "land", at: 0.85, gain: 0.4 }] },

  { id: "gun", habit: "one bite", character: "gunslinger", how: "the one-bite eater: shoots it off the plate, eats it in one", len: 1.6, expr: "cocky", b: ({ A, S, bites, take }) => [
    A(0, "arm", { side: "R", pose: "point", dur: 0.15 }),
    A(0, "look", { to: [0, -0.5], dur: 0.12 }),
    ...take(0.25),
    S(0.25, { y: 1.35, z: -0.2, roll: 360 }, 0.35, "out"),                 // shot up off the board...
    A(0.3, "look", { to: [0, 0.7], dur: 0.12 }),
    A(0.35, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    S(0.6, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0, roll: 790 }, 0.3, "in"),   // ...and down into his mouth
    A(0.85, "look", { to: [0, 0], dur: 0.1 }),
    ...bites(0.9, 1, 0.2),
    A(1.1, "arm", { side: "both", pose: "hips", dur: 0.2 }),
    A(1.1, "expr", { expr: "smug" }),
  ], fx: [{ fx: "poof", pos: [0.05, TOP + 0.05, 0], at: 0.24, dur: 0.35, puffs: 2, sparks: 8, spark: "#ffd34d" }],
  sfx: [{ sfx: "impact", at: 0.24, gain: 0.3 }, { sfx: "whoosh", at: 0.25, dur: 0.6, gain: 0.2 }] },

  { id: "sam", habit: "knife & fork", character: "samurai", how: "the knife-and-fork eater: cuts it into perfect pieces", len: 1.8, expr: "focused", b: ({ A, S, bites, take }) => [
    ...take(0),
    S(0, { x: 0.32, y: 0.85, z: -0.1, rot: "EAT", tilt: 0, roll: 10 }, 0.3),   // held up to the side, against the wall
    A(0, "charge", { to: 1, dur: 0.2 }),
    ...[0.35, 0.75, 1.15].flatMap((t, j) => [
      A(t - 0.05, "arm", { side: "R", pose: "up", dur: 0.13 }), A(t + 0.09, "arm", { side: "R", pose: "point", dur: 0.12 }),
      { fx: "speedlines", at: t + 0.1, dur: 0.15 }, { fx: "flash", at: t + 0.12, dur: 0.08, peak: 0.25 },
      { fx: "sparkle", who: "sam", at: t + 0.12, dur: 0.25, count: 2, color: "#b6ffd0" },
      S(t + 0.12, { roll: 10 + 30 * (j + 1) }, 0.06, "out"),
      S(t + 0.2, { scale: (1 - (j + 1) / 3) * SL }, 0.1, "out"), A(t + 0.2, "squash", { amount: 0.06, dur: 0.1 }),
    ]),
    A(1.45, "charge", { to: 0, dur: 0.2 }),
    A(1.45, "arm", { side: "R", pose: "rest", dur: 0.25 }),
    A(1.5, "expr", { expr: "serene" }),
  ], sfx: [{ sfx: "tink", at: 0.45, gain: 0.2 }, { sfx: "tink", at: 0.85, gain: 0.2 }, { sfx: "tink", at: 1.25, gain: 0.2 }] },

  { id: "all", habit: "reheats it", character: "allfather", how: "the dad who reheats it: one lightning bolt", len: 1.85, expr: "stern", b: ({ A, S, Bo, bites, take }) => [
    ...take(0),
    S(0, { x: -0.35, y: 0.78, z: -0.2, rot: "EAT", tilt: 0 }, 0.3),
    A(0.05, "arm", { side: "L", pose: "hold", dur: 0.2 }),
    A(0.3, "arm", { side: "R", pose: "up", dur: 0.15 }),
    A(0.3, "look", { to: [-0.4, 0.2], dur: 0.12 }),
    Bo(0.45, { on: 1 }, 0.01, "linear"), Bo(0.65, { on: 0 }, 0.01, "linear"),
    S(0.45, { toast: 0.35 }, 0.2),
    A(0.65, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(0.7, "expr", { expr: "smug" }),
    S(0.8, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2] }, 0.25),
    A(0.8, "look", { to: [0, 0], dur: 0.12 }),
    A(0.8, "arm", { side: "L", pose: "rest", dur: 0.2 }),
    ...bites(1.1, 2, 0.24),
  ], fx: [{ fx: "shake", at: 0.45, dur: 0.2, amp: 0.02 }, { fx: "poof", pos: [-0.35, 0.85, -0.2], at: 0.66, dur: 0.5, puffs: 3, sparks: 0 }],
  sfx: [{ sfx: "impact", at: 0.45, gain: 0.3 }] },

  { id: "vik", habit: "nothing left?!", character: "viking", how: "nothing left (the Sorcerer took two): eats the board", len: 2.9, expr: "delighted", last: true, b: ({ A, P }) => [
    A(0, "arm", { side: "both", pose: "table", dur: 0.2 }),
    A(0, "look", { to: [0, -0.4], dur: 0.15 }),
    A(0.05, "expr", { expr: "shocked" }),               // nothing left?
    A(0.45, "look", { to: [0, 0], dur: 0.15 }),         // ...a double take at the camera
    A(0.75, "look", { to: [0, -0.4], dur: 0.12 }),
    P(0.75, { y: 0.5, z: -0.2, tilt: 25 }, 0.35, "out"),    // the whole board, like a plate going in
    A(1.2, "expr", { expr: "eager" }),
    P(1.35, { scale: 0.5 * PZ }, 0.1, "out"),
    A(1.35, "squash", { amount: 0.12, dur: 0.15 }),
    P(1.55, { scale: 0.02 }, 0.12, "in"),
    A(1.55, "squash", { amount: 0.3, dur: 0.3 }),
    A(1.6, "expr", { expr: "delighted" }), A(1.6, "look", { to: [0, 0], dur: 0.12 }),
    A(1.75, "arm", { side: "both", pose: "fist", dur: 0.2 }),
    A(1.85, "hop", { height: 0.08, count: 1, dur: 0.4 }),
    // a fresh pizza for the next round (swapped in while the old one is a crumb, then poofed in), and he walks off
    P(1.8, { slices: 10, y: 0.62 * TS + 0.012, z: 0, tilt: 0 }, 0),
    P(2.25, { scale: PZ }, 0.3, "out"),
    A(2.25, "arm", { side: "both", pose: "rest", dur: 0.2 }),
    A(2.3, "turn", { to: "right", dur: 0.12 }),
    A(2.3, "move", { to: EXIT, dur: 0.6, ease: "linear", steps: 3 }),
  ], fx: [{ fx: "shake", at: 1.55, dur: 0.3, amp: 0.04 }, { fx: "poof", pos: [0, 0.68, -0.3], at: 1.55, dur: 0.7, puffs: 0, sparks: 16, spark: "#f2c46b" },
    { fx: "poof", pos: [0, 0.62 * TS + 0.05, 0], at: 2.2, dur: 0.5, puffs: 5, sparks: 6, spark: "#ffe08a" }],
  sfx: [{ sfx: "pop", at: 1.35, gain: 0.3 }, { sfx: "pop", at: 1.55, gain: 0.5 }, { sfx: "tink", at: 2.25, gain: 0.25 }] },
];

const sb = {
  id: "pizza-02-restaurant",
  title: "PIZZA: how each fighter eats their pizza (in a pizzeria)",
  format: "each-character-vs-X, one continuous take: fighters queue in, each eats a slice their own way, the pizza shrinks, biggest last",
  fps: 30, set: { type: "restaurant" }, sound: { sfx: 0.5 }, escalation: false, loop: true, cover: 9.85,
  cast: [], beats: [],
  // the pizza starts with 9 slices: in frame 0 the Astronaut already has his (the last frame hands it to him)
  props: [{ id: "table", kind: "table", x: 0, z: 0, scale: TS }, { id: "cloth", kind: "cloth", x: 0, z: 0, scale: TS },
    { id: "pizza", kind: "pizza", x: 0, y: 0.62 * TS + 0.012, z: 0, slices: 9, scale: PZ },
    { id: "fire", kind: "flames", x: 0, y: 0, z: 0, scale: 0.45 },
    { id: "cheese", kind: "cheese", x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: 80.5, tilt: -53.4, len: 0 },   // towards where the slice floats
    { id: "bolt", kind: "bolt", x: -0.35, y: 0.8, z: -0.2 }],
  shots: [], captions: [],
};
const top = TOP + 0.012;   // on the cloth
const EAT_ROT = (from) => 72 + 360 * Math.round((from - 72) / 360);
let t0 = 0, next = 9;   // the next slice to go (slice i sits at i*36 degrees; the pizza shows slices 0..slices-1)
for (const [i, f] of FIGHTERS.entries()) {
  // arrive: when this one reaches the mark (sidestepping in, facing the camera); its own turn starts 0.15 s before
  const n = f.id === "sor" ? 2 : f.last ? 0 : 1, slots = Array.from({ length: n }, (_, j) => next - j), sid = `slice-${f.id}`, sid2 = `slice-${f.id}-2`, arrive = f.start ? 0 : WALK_IN - 0.15;
  next -= n;
  const w = slots[0];
  // each slice prop starts exactly on top of its pizza slice (invisible until it's taken); the Astronaut's starts at
  // his mouth, in the eating pose
  slots.forEach((s, j) => sb.props.push(f.start ? { id: sid, kind: "slice", x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: EAT_ROT(s * 36), roll: 70, scale: SL }
    : { id: j ? sid2 : sid, kind: "slice", x: 0, y: top, z: 0, rot: s * 36, scale: 0 }));
  const k = f.last ? 1 : K, rel = (t) => r3(arrive + t * k), d = (x) => r3(x * k);
  const A = (t, what, o = {}) => ({ who: f.id, do: what, at: rel(t), ...o, ...(o.dur != null && { dur: d(o.dur) }) });
  const S = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: sid, at: rel(t), dur: d(dur), ease, set });
  const P = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "pizza", at: rel(t), dur: d(dur), ease, set });
  const F = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "fire", at: rel(t), dur: d(dur), ease, set });
  const S2 = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: sid2, at: rel(t), dur: d(dur), ease, set });
  const C = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "cheese", at: rel(t), dur: d(dur), ease, set });
  const Bo = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "bolt", at: rel(t), dur: d(dur), ease, set });
  // take: the pizza drops that slice and the slice prop shows in its place in the same frame, then grows so it reads
  const take = (t, j = 0) => { const T = j ? S2 : S; return [P(t, { slices: slots[j] }, 0), T(t, { scale: PZ }, 0), T(t + 0.01, { scale: SL }, 0.3)]; };
  const bites = (t, n, gap, both = false) => Array.from({ length: n }, (_, j) => [
    S(t + j * gap, { scale: (1 - (j + 1) / n) * SL }, 0.1, "out"),
    ...(both ? [S2(t + j * gap, { scale: (1 - (j + 1) / n) * SL }, 0.1, "out")] : []),
    A(t + j * gap, "squash", { amount: 0.08, dur: 0.12 }),
    { sfx: "pop", at: rel(t + j * gap), gain: 0.18 },
  ]).flat();
  // rot "EAT": the eating pose, tip in the mouth and the slice sticking out to the right with its top to the camera
  // (rot 72 + 360k, the turn nearest the slice's last angle, so it never spins the long way; roll 70 unless set)
  const made = f.b({ A, S, S2, P, F, C, Bo, bites, take });
  slots.forEach((s, j) => {
    let lastRot = s * 36;
    for (const x of made.filter((x) => x.id === (j ? sid2 : sid) && x.set?.rot != null).sort((a, b) => a.at - b.at)) {
      if (x.set.rot === "EAT") { x.set.rot = EAT_ROT(lastRot); x.set.roll ??= 70; }
      lastRot = x.set.rot;
    }
  });
  const items = [
    ...(f.start ? [] : [{ who: f.id, do: "move", to: MARK, dur: WALK_IN, ease: "out", steps: 3, at: 0 }, { who: f.id, do: "look", to: [0, 0], dur: 0.15, at: 0 }]),
    ...made.map((x) => (x.do ? x : { ...x, at: rel(x.at) })),   // effects written inline
    ...(f.fx || []).map((x) => ({ ...x, at: rel(x.at) })),
    ...(f.sfx || []).map((x) => ({ ...x, at: rel(x.at) })),
  ];
  // walking off at an even pace (an ease-out start zips off in two frames); the next one, already on the way in, never gets close
  if (!f.last) items.push(A(f.len + 0.08 / k, "turn", { to: "right", dur: 0.22 / k }), { who: f.id, do: "move", to: EXIT, dur: WALK_OUT, ease: "linear", steps: 3, at: rel(f.len) }, { who: f.id, do: "hide", at: r3(rel(f.len) + WALK_OUT) });
  sb.cast.push({ id: f.id, character: `potatobrawl/${f.character}`, at: f.start ? MARK : ENTER, face: "camera", expr: f.expr, seed: 1.1 + i * 0.7 });
  // everyone but the first waits off-screen, hidden
  if (!f.start) sb.cast.at(-1).hidden = true;
  // the next one walks up to the queue spot during this turn, so there's always someone waiting
  const nx = FIGHTERS[i + 1];
  if (nx) items.push({ who: nx.id, do: "show", at: rel(0.2) }, { who: nx.id, do: "move", to: WAIT, dur: QUEUE, ease: "out", steps: 3, at: rel(0.2) },
    { who: nx.id, do: "look", to: [0.6, 0], dur: 0.2, at: r3(rel(0.2) + QUEUE) });
  // eating is contact on purpose: each slice may touch its eater during their turn (qa/check.mjs clipping guard)
  sb.allowClip = [...(sb.allowClip || []), ...(f.last ? ["pizza"] : [sid, ...(n > 1 ? [sid2] : [])]).map((x) => ({ who: f.id, with: x, from: r3(t0), to: r3(t0 + arrive + f.len * k + 0.3) }))];
  sb.beats.push({ name: `${f.id}: ${f.how}`, at: r3(t0), len: r3(arrive + f.len * k + (f.last ? 0 : WALK_OUT)), do: items });
  t0 = t0 + arrive + f.len * k;   // the next one sets off from the queue as this one walks off
}
// hidden fighters: a hide at 0 in the first beat (no cast flag for it; a top-level actions list would make it flat)
sb.beats[0].do.unshift(...sb.cast.filter((c) => c.hidden).map((c) => ({ who: c.id, do: "hide", at: 0 })));
for (const c of sb.cast) delete c.hidden;
// the loop: while the Viking walks off with the fresh pizza on the table, the Astronaut walks back to the mark, so the
// last frame is the first one (Astronaut on the mark, a whole pizza)
const vik = sb.beats.at(-1), out = vik.do.find((x) => x.who === "vik" && x.do === "move" && x.to === EXIT).at;   // the Viking walks off
vik.do.push({ who: "ast", do: "move", to: ENTER, dur: 0.01, at: r3(out - 0.66) }, { who: "ast", do: "show", at: r3(out - 0.6) },   // (from the left, not back through the Viking)
   { who: "ast", do: "turn", to: "camera", dur: 0.01, at: r3(out - 0.6) }, { who: "ast", do: "expr", expr: "eager", at: r3(out - 0.6) },
  { who: "ast", do: "move", to: WAIT, dur: 0.5, ease: "out", steps: 3, at: r3(out - 0.6) },
  { who: "ast", do: "move", to: MARK, dur: WALK_IN, ease: "out", steps: 3, at: out }, { who: "ast", do: "turn", to: "camera", dur: 0.15, at: r3(out + WALK_IN - 0.15) });
vik.len = r3(out + WALK_IN + 0.45);
// ...and takes his slice again, so the last frame is frame 0: slice 9 swaps out of the pizza and reaches his mouth
const tk = r3(vik.len - 0.32), slot9 = { x: 0, y: top, z: 0, rot: 9 * 36, tilt: 0, roll: 0, toast: 0 };
vik.do.push({ do: "prop", id: "slice-ast", at: r3(tk - 0.05), dur: 0, set: { ...slot9, scale: 0 } },
  { do: "prop", id: "pizza", at: tk, dur: 0, set: { slices: 9 } }, { do: "prop", id: "slice-ast", at: tk, dur: 0, set: { scale: PZ } },
  { do: "prop", id: "slice-ast", at: r3(tk + 0.01), dur: 0.3, ease: "inOut", set: { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: EAT_ROT(324), roll: 70, scale: SL } },
  { who: "ast", do: "expr", expr: "eager", at: tk });
sb.allowClip.push({ who: "ast", with: "slice-ast", from: 0, to: 99 }, { who: "all", with: "bolt", from: 0, to: 99 });
const end = vik.at + vik.len;
// one camera, no cuts: it pushes in once, when the Viking finds the board empty, and back out over the last 1.6 s,
// so the last frame matches the first for the loop
const WIDE = { pos: [0, 1.5, 4.4], look: [0, 0.78, -0.6], fov: 38 }, TIGHT = { pos: [0, 1.32, 3.4], look: [0, 0.8, -0.5], fov: 34.5 };   // the Viking's push in
sb.shots.push({ at: 0, ...WIDE }, { at: r3(vik.at + 0.25), ...WIDE, to: TIGHT, dur: 0.4, ease: "out" }, { at: r3(end - 1.6), ...TIGHT, to: WIDE, dur: 1.5, ease: "inOut" });
sb.captions.push({ from: 0, to: r3(end), text: "PIZZA", style: "label", pos: 230, pop: false });
sb.captions.push({ from: 0, to: 2.4, text: "1 pizza. 10 fighters.", pos: 340 });
// each fighter's name and eating habit under the title while it's their turn (one swaps for the next as that one reaches the mark, so
// the line never goes blank), then the closing question once the Viking has eaten
const swaps = sb.beats.map((b, i) => (i ? r3(Math.max(b.at + WALK_IN - 0.15, 2.4)) : 0)), ask = r3(vik.at + 1.9);
for (const [i] of sb.beats.entries()) {
  if (!i) continue;   // the Astronaut's turn has the hook line in that spot
  const name = FIGHTERS[i].id === "all" ? "ALLFATHER" : FIGHTERS[i].character.toUpperCase();
  sb.captions.push({ from: swaps[i], to: FIGHTERS[i].last ? ask : swaps[i + 1], text: name, style: "label", pos: 340, pop: false },
    { from: swaps[i], to: FIGHTERS[i].last ? ask : swaps[i + 1], text: FIGHTERS[i].habit, pos: 425 });
}
sb.captions.push({ from: ask, to: r3(end), text: "which one are you?", pos: 340 });
if (end > 20) sb.escalation = true;   // over 20 s: the biggest (the Viking) is last
writeFileSync(new URL("./pizza-02-restaurant.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`pizza-02-restaurant: ${r3(end)} s, ${FIGHTERS.length} fighters`);
