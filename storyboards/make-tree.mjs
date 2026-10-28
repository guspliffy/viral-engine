// TREE: "how each fighter climbs a tree", the third "each character vs X" clip. One continuous take in a forest
// clearing (Jonny: the set fits the activity, one scene, clean). Each fighter plays a habit real people have when
// climbing a tree, done their own signature way (the Wizard messes up, the Samurai slices, the Gunslinger shoots,
// the Viking destroys); the goal is an apple at the top, so the tree's 10 apples count down like the pizza's slices.
// Writes a beat storyboard (docs/STORYBOARD.md): storyboards/tree-01-apple-each.json, one beat per fighter.
//   node storyboards/make-tree.mjs
import { writeFileSync } from "node:fs";

const TX = 0.15, TZ = -0.6;                                   // the tree's foot
const ENTER = [-2.7, -1.3], WAIT = [-0.8, -1.8], C = [TX - 0.46, TZ], OUT = [TX - 0.2, 0.05], EXIT = [2.7, 0.05];
const TOP = 0.85;                                             // feet height of a climber who can reach the apples
// the same apple slots as TREE_APPLES in engine/page/props3d.js (relative to the tree's foot); fighter i takes slot 9 - i
const SLOTS = [[0.55, 1.88, 0.3], [-0.28, 1.84, 0.3], [-0.55, 1.8, 0.25], [0.32, 1.86, 0.36], [-0.22, 1.88, 0.4],
  [-0.36, 1.8, 0.38], [0.05, 1.85, 0.4], [-0.5, 1.98, 0.22], [-0.3, 1.95, 0.36], [-0.42, 1.86, 0.3]];
const WIZ_SHRINK = 0.35;
const WALK_IN = 0.4, WALK_OUT = 0.45, QUEUE = 0.6, K = 0.75;   // K: each turn (but the Viking's) plays at 0.75x its written times
const r3 = (x) => Math.round(x * 1000) / 1000;

// each entry: who, the habit, len (from arriving at the trunk to walking off), and its items with times from arriving.
// A(t, do, opts) an action of this fighter; T(t, set) tweens the tree, Ap(t, set) this fighter's apple, Pt(id, t, set)
// another prop; take(t, hand) swaps the hanging apple for this fighter's apple prop and it glides into the hand;
// down(t, dur) jumps off the trunk and lands a step in front of it.
const FIGHTERS = [
  { id: "ast", character: "astronaut", how: "plans every handhold, then just floats up", len: 1.85, expr: "focused", start: true, b: ({ A, take, down }) => [
    A(0, "arm", { side: "both", pose: "hold", dur: 0.01 }),   // hands on the trunk, ready to climb...
    A(0, "lean", { to: 12, dur: 0.01 }),
    A(0.1, "look", { to: [0.3, 0.8], dur: 0.12 }),
    A(0.3, "look", { to: [0.3, -0.5], dur: 0.12 }),
    A(0.5, "look", { to: [0.3, 0.8], dur: 0.12 }),
    A(0.65, "arm", { side: "both", pose: "rest", dur: 0.15 }),   // ...then just floats up
    A(0.65, "lean", { to: 0, dur: 0.12 }),
    A(0.65, "expr", { expr: "eager" }),
    A(0.7, "fly", { to: { y: TOP }, dur: 0.5 }),
    ...take(1.2),
    A(1.25, "turn", { to: "camera", dur: 0.15 }),
    A(1.3, "expr", { expr: "delighted" }),
    A(1.5, "fly", { to: { y: 0, z: OUT[1] }, dur: 0.35 }),
  ] },

  { id: "rea", character: "reaper", how: "gets up fine, then is too scared to come down", len: 2.25, expr: "deadpan", b: ({ A, take, down }) => [
    A(0, "climb", { to: { y: TOP }, dur: 0.55, steps: 4 }),
    ...take(0.55),
    A(0.65, "turn", { to: "camera", dur: 0.15 }),
    A(0.85, "look", { to: [0, -0.9], dur: 0.1 }),
    A(0.85, "arm", { side: "both", pose: "hold", dur: 0.12 }),   // clings on
    A(0.9, "expr", { expr: "shocked" }),
    A(0.95, "lean", { to: -6, dur: 0.1 }), A(1.05, "lean", { to: 6, dur: 0.1 }), A(1.15, "lean", { to: -6, dur: 0.1 }), A(1.25, "lean", { to: 6, dur: 0.1 }), A(1.35, "lean", { to: 0, dur: 0.1 }),
    A(1.7, "expr", { expr: "deadpan" }),
    A(1.7, "blink", { dur: 0.2 }),
    A(1.8, "arm", { side: "both", pose: "rest", dur: 0.15 }),
    ...down(1.8),
  ], sfx: [{ sfx: "land", at: 2.15, gain: 0.4 }] },

  { id: "sor", character: "sorcerer", how: "cheats: a portal straight to the top", len: 1.55, expr: "evil", b: ({ A, Pt, take }) => [
    A(0, "charge", { to: 1, dur: 0.25 }),
    A(0, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    Pt("portal-a", 0.05, { open: 1 }, 0.25, "back"), Pt("portal-b", 0.05, { open: 1 }, 0.25, "back"),
    A(0.3, "grow", { to: 0.01, dur: 0.15, ease: "in" }),
    A(0.46, "fly", { to: { y: TOP }, dur: 0.01 }),
    A(0.5, "grow", { to: 1, dur: 0.2, ease: "back" }),
    A(0.65, "charge", { to: 0, dur: 0.3 }),
    A(0.65, "arm", { side: "L", pose: "rest", dur: 0.2 }),
    Pt("portal-a", 0.7, { open: 0 }, 0.25, "in"), Pt("portal-b", 0.7, { open: 0 }, 0.25, "in"),
    ...take(0.7),
    A(0.8, "turn", { to: "camera", dur: 0.15 }),
    A(0.85, "expr", { expr: "smug" }),
    A(1.15, "fly", { to: { y: 0, z: OUT[1] }, dur: 0.35 }),
  ], sfx: [{ sfx: "charge", at: 0.05, dur: 0.4, gain: 0.22 }, { sfx: "pop", at: 0.42, gain: 0.3 }, { sfx: "pop", at: 0.5, gain: 0.3 }] },

  { id: "wiz", character: "wizard", how: "a spell to make it easy shrinks the tree to a bonsai", len: 2.2, expr: "eager", b: ({ A, T, take }) => [
    A(0, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    A(0, "charge", { to: 1, dur: 0.3 }),
    { fx: "poof", pos: [TX, 1.7, TZ + 0.3], at: 0.3, dur: 0.3, puffs: 4, sparks: 10, spark: "#c8b6ff" },
    T(0.32, { scale: WIZ_SHRINK }, 0.25, "in"),
    A(0.4, "charge", { to: 0, dur: 0.15 }),
    A(0.55, "expr", { expr: "shocked" }),
    A(0.55, "look", { to: [0.4, -0.6], dur: 0.12 }),
    A(0.6, "arm", { side: "L", pose: "rest", dur: 0.2 }),
    A(0.75, "squash", { amount: 0.12, dur: 0.3 }),            // stoops to pick it at knee height
    A(0.75, "look", { to: [0.4, -0.7], dur: 0.12 }),
    ...take(0.85),
    A(0.95, "expr", { expr: "delighted" }),
    A(1.55, "arm", { side: "L", pose: "cast", dur: 0.15 }),
    A(1.55, "look", { to: [0, 0], dur: 0.12 }),
    { fx: "poof", pos: [TX, 0.5, TZ + 0.3], at: 1.7, dur: 0.5, puffs: 7, sparks: 10, spark: "#c8b6ff" },
    T(1.72, { scale: 1 }, 0.3, "back"),
    A(1.95, "arm", { side: "L", pose: "rest", dur: 0.2 }),
    A(1.95, "expr", { expr: "smug" }),
  ], sfx: [{ sfx: "pop", at: 0.3, gain: 0.3 }, { sfx: "pop", at: 1.7, gain: 0.3 }] },

  { id: "dra", character: "dragon", how: "gets stuck halfway, then remembers he can fly", len: 2.05, expr: "focused", b: ({ A, take }) => [
    A(0, "climb", { to: { y: 0.4 }, dur: 0.55, steps: 3 }),
    A(0.55, "expr", { expr: "shocked" }),
    A(0.55, "look", { to: [0, -0.8], dur: 0.1 }),
    A(0.6, "lean", { to: -8, dur: 0.12 }), A(0.72, "lean", { to: 8, dur: 0.12 }), A(0.84, "lean", { to: 0, dur: 0.1 }),
    A(0.95, "look", { to: [0, 0.3], dur: 0.1 }),
    A(1.0, "expr", { expr: "delighted" }),
    A(1.05, "wings", { to: 1, dur: 0.15 }),
    A(1.1, "fly", { to: { y: TOP }, dur: 0.3 }),
    ...take(1.4),
    A(1.45, "turn", { to: "camera", dur: 0.15 }),
    A(1.65, "fly", { to: { y: 0, z: OUT[1] }, dur: 0.35 }),
    A(2.0, "wings", { to: 0, dur: 0.2 }),
  ], sfx: [{ sfx: "whoosh", at: 1.1, dur: 0.3, gain: 0.2 }] },

  { id: "phx", character: "phoenix", how: "races up to show off, backflips down, faceplants", len: 2.2, expr: "cocky", b: ({ A, take }) => [
    A(0, "climb", { to: { y: TOP }, dur: 0.32, steps: 4 }),
    ...take(0.32),
    A(0.35, "turn", { to: "camera", dur: 0.12 }),
    A(0.4, "arm", { side: "L", pose: "up", dur: 0.15 }),
    A(0.68, "wings", { to: 1, dur: 0.15 }),
    A(0.7, "hop", { height: 0.35, dur: 0.55 }),
    A(0.7, "drop", { to: 0, dur: 0.55 }),
    A(0.7, "move", { to: OUT, dur: 0.55 }),
    A(0.7, "pitch", { to: -360, dur: 0.5 }),
    A(1.22, "lean", { to: 85, dur: 0.1, ease: "in" }),
    A(1.22, "expr", { expr: "dizzy" }),
    A(1.3, "wings", { to: 0, dur: 0.2 }),
    A(1.3, "arm", { side: "L", pose: "rest", dur: 0.15 }),
    A(1.85, "lean", { to: 0, dur: 0.25, ease: "out" }),
    A(2.0, "expr", { expr: "cocky" }),
  ], fx: [{ fx: "shake", at: 1.25, dur: 0.18, amp: 0.025 }, { fx: "sparkle", who: "phx", at: 1.3, dur: 0.6, count: 5, color: "#ffe066" }],
  sfx: [{ sfx: "whoosh", at: 0.7, dur: 0.5, gain: 0.25 }, { sfx: "land", at: 1.25, gain: 0.5 }] },

  { id: "gun", character: "gunslinger", how: "can't be bothered to climb: shoots it down", len: 1.7, expr: "cocky", b: ({ A, Ap, take }) => [
    A(0, "look", { to: [0.3, 0.9], dur: 0.12 }),
    A(0.1, "droop", { to: 1, dur: 0.15 }),                     // ugh, climbing
    A(0.1, "arm", { side: "both", pose: "shrug", dur: 0.15 }),
    A(0.1, "expr", { expr: "deadpan" }),
    A(0.4, "droop", { to: 0, dur: 0.15 }),
    A(0.4, "arm", { side: "L", pose: "rest", dur: 0.15 }),
    A(0.4, "arm", { side: "R", pose: "up", dur: 0.15 }),
    A(0.45, "expr", { expr: "cocky" }),
    ...take(0.65, "L", { y: 0.62, x: C[0] + 0.15, z: C[1] + 0.25 }, 0.35),   // shot off: it falls into his free hand
    A(0.65, "squash", { amount: 0.06, dur: 0.1 }),
    A(0.8, "look", { to: [0, 0], dur: 0.15 }),
    A(0.9, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(1.05, "turn", { to: "camera", dur: 0.15 }),
    A(1.1, "expr", { expr: "smug" }),
  ], fx: [{ fx: "poof", pos: [C[0] + 0.05, 1.3, C[1] + 0.1], at: 0.63, dur: 0.35, puffs: 2, sparks: 6, spark: "#ffd34d" }],
  sfx: [{ sfx: "impact", at: 0.63, gain: 0.3 }, { sfx: "tink", at: 0.97, gain: 0.2 }] },

  { id: "sam", character: "samurai", how: "slices perfect steps into the trunk, walks up", len: 1.75, expr: "focused", b: ({ A, T, take, down }) => [
    A(0, "charge", { to: 1, dur: 0.2 }),
    A(0.05, "arm", { side: "R", pose: "up", dur: 0.1 }),
    A(0.17, "arm", { side: "R", pose: "point", dur: 0.08 }),
    T(0.2, { steps: 1 }, 0.3, "linear"),
    A(0.28, "arm", { side: "R", pose: "up", dur: 0.08 }),
    A(0.38, "arm", { side: "R", pose: "point", dur: 0.08 }),
    A(0.5, "charge", { to: 0, dur: 0.2 }),
    A(0.55, "climb", { to: { y: TOP }, dur: 0.5, steps: 5 }),
    ...take(1.05),
    A(1.1, "turn", { to: "camera", dur: 0.15 }),
    A(1.15, "expr", { expr: "serene" }),
    ...down(1.4),
  ], sfx: [{ sfx: "whoosh", at: 0.15, dur: 0.12, gain: 0.25 }, { sfx: "tink", at: 0.22, gain: 0.15 }, { sfx: "tink", at: 0.34, gain: 0.15 }, { sfx: "tink", at: 0.46, gain: 0.15 }] },

  { id: "all", character: "allfather", how: "the stubborn dad: slow, out of breath, proud", len: 2.3, expr: "stern", b: ({ A, take, down }) => [
    A(0, "climb", { to: { y: 0.42 }, dur: 0.5, steps: 2 }),
    A(0.5, "droop", { to: 1, dur: 0.15 }),                     // halfway: a breather
    A(0.5, "expr", { expr: "sad" }),
    A(0.6, "blink", { dur: 0.2 }),
    A(0.8, "droop", { to: 0, dur: 0.15 }),
    A(0.8, "expr", { expr: "stern" }),
    A(0.85, "climb", { to: { y: TOP }, dur: 0.5, steps: 2 }),
    A(1.35, "droop", { to: 1, dur: 0.15 }),
    ...take(1.4),
    A(1.45, "turn", { to: "camera", dur: 0.15 }),
    A(1.5, "arm", { side: "R", pose: "up", dur: 0.2 }),
    A(1.55, "expr", { expr: "smug" }),
    A(1.55, "droop", { to: 0, dur: 0.2 }),
    ...down(1.9),
    A(2.25, "expr", { expr: "shocked" }),
  ], fx: [{ fx: "sparkle", who: "all", at: 1.55, dur: 0.5, count: 6 }], sfx: [{ sfx: "sting", at: 1.55, gain: 0.2 }, { sfx: "land", at: 2.25, gain: 0.45 }] },

  { id: "vik", character: "viking", how: "hugs the tree, it falls over; puts it back", len: 3.0, expr: "eager", last: true, b: ({ A, T, Ap, take }) => [
    A(0, "arm", { side: "both", pose: "table", dur: 0.15 }),
    A(0.05, "squash", { amount: 0.1, dur: 0.15 }),
    T(0.1, { roll: -4 }, 0.08), T(0.18, { roll: 4 }, 0.1), T(0.28, { roll: -3 }, 0.1), T(0.38, { roll: 0 }, 0.08),
    ...take(0.3, null, { y: 0.07 }, 0.3),                         // the last apple shakes loose and drops
    A(0.65, "look", { to: [0.6, -0.5], dur: 0.12 }),
    T(0.7, { tilt: -50, roll: -30 }, 0.5, "in"),                   // ...then the whole tree tips over, back and right into the forest
    A(0.75, "expr", { expr: "shocked" }),
    A(0.75, "look", { to: [0.3, 0.9], dur: 0.12 }),              // his eyes follow it down
    A(1.1, "look", { to: [0.4, 0], dur: 0.15 }),
    A(0.75, "arm", { side: "both", pose: "rest", dur: 0.2 }),
    T(1.24, { steps: 0 }, 0.01),                                  // the steps break off as it lands
    A(1.4, "arm", { side: "both", pose: "shrug", dur: 0.2 }),
    A(1.4, "look", { to: [0, 0], dur: 0.12 }),
    A(1.45, "expr", { expr: "smug" }),
    A(1.65, "arm", { side: "both", pose: "rest", dur: 0.15 }),
    A(1.65, "move", { to: [SLOTS[0][0] + TX - 0.32, 0.05], dur: 0.3, steps: 2 }),
    A(1.95, "grab", { prop: "apple-vik", hand: "R", dur: 0.15 }),
    A(2.0, "expr", { expr: "delighted" }),
    A(2.05, "arm", { side: "L", pose: "up", dur: 0.2 }),
    T(2.1, { tilt: 0, roll: 0 }, 0.55, "inOut"),                           // ...and he stands it back up with one hand
    T(2.35, { apples: 10 }, 0.55, "linear"),                      // the apples grow back
    A(2.65, "arm", { side: "L", pose: "rest", dur: 0.2 }),
  ], fx: [{ fx: "shake", at: 0.1, dur: 0.35, amp: 0.02 }, { fx: "shake", at: 1.25, dur: 0.3, amp: 0.05 },
    { fx: "poof", pos: [TX + 0.3, 0.5, TZ - 1.4], at: 1.2, dur: 0.7, puffs: 12, sparks: 0 }, { fx: "sparkle", who: "vik", at: 2.4, dur: 0.6, count: 5, color: "#ff8a8a" }],
  sfx: [{ sfx: "whoosh", at: 0.75, dur: 0.5, gain: 0.25 }, { sfx: "impact", at: 1.24, gain: 0.45 }, { sfx: "whoosh", at: 2.1, dur: 0.5, gain: 0.2 }] },
];

const sb = {
  id: "tree-01-apple-each",
  title: "TREE: how each fighter climbs a tree",
  format: "each-character-vs-X, one continuous take: fighters queue in, each gets an apple from the tree their own way (a relatable habit + their signature), the apples count down, biggest last",
  fps: 30, set: { type: "forest" }, sound: { sfx: 0.5 }, escalation: false, loop: true,
  cast: [], beats: [],
  props: [{ id: "tree", kind: "tree", x: TX, z: TZ },
    { id: "portal-a", kind: "portal", x: C[0], z: C[1] + 0.05, scale: 0.75 }, { id: "portal-b", kind: "portal", x: C[0], y: TOP, z: C[1] + 0.05, scale: 0.75 }],
  shots: [], captions: [], allowClip: [],
};
let t0 = 0;
for (const [i, f] of FIGHTERS.entries()) {
  const w = 9 - i, aid = `apple-${f.id}`, arrive = f.start ? 0 : WALK_IN - 0.15;
  const sc = f.id === "wiz" ? WIZ_SHRINK : 1, sl = SLOTS[w];
  // the apple prop starts exactly on its hanging apple (invisible until it's taken)
  sb.props.push({ id: aid, kind: "apple", x: r3(TX + sl[0] * sc), y: r3(sl[1] * sc), z: r3(TZ + sl[2] * sc), scale: 0 });
  const k = f.last ? 1 : K, rel = (t) => r3(arrive + t * k), d = (x) => r3(x * k);
  const A = (t, what, o = {}) => ({ who: f.id, do: what, at: rel(t), ...o, ...(o.dur != null && { dur: d(o.dur) }) });
  const Pt = (id, t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id, at: rel(t), dur: d(dur), ease, set });
  const T = (t, set, dur, ease) => Pt("tree", t, set, dur, ease), Ap = (t, set, dur, ease) => Pt(aid, t, set, dur, ease);
  // take: the hanging apple hides and this fighter's apple shows in its place in the same frame; then it glides into
  // the hand (or, with `fall`, drops to that spot first and is caught; hand null leaves it there)
  const take = (t, hand = "R", fall = null, fallDur = 0.3) => [
    T(t, { apples: w }, 0), Ap(t, { scale: sc }, 0),
    ...(sc !== 1 ? [Ap(t + 0.01, { scale: 1 }, 0.25)] : []),
    ...(fall ? [Ap(t, fall, fallDur, "in")] : []),
    ...(hand ? [{ who: f.id, do: "grab", prop: aid, hand, dur: d(0.15), at: rel(t + (fall ? fallDur : 0)) }] : []),
  ];
  const down = (t, dur = 0.35) => [A(t, "drop", { to: 0, dur }), A(t, "move", { to: OUT, dur })];   // drop lands with its own squash
  const made = f.b({ A, T, Ap, Pt, take, down });
  const items = [
    ...(f.start ? [] : [{ who: f.id, do: "move", to: C, dur: WALK_IN, ease: "out", steps: 3, at: 0 }, { who: f.id, do: "turn", to: "3q-right", dur: 0.15, at: WALK_IN - 0.15 }]),
    ...made.map((x) => (x.do ? x : { ...x, at: rel(x.at) })),   // effects written inline
    ...(f.fx || []).map((x) => ({ ...x, at: rel(x.at) })),
    ...(f.sfx || []).map((x) => ({ ...x, at: rel(x.at) })),
  ];
  // walking off: a step out in front of the trunk (if not there yet), then off to the right, fast at first so the
  // next one, already on the way in, never gets close
  if (!f.last) items.push(A(f.len, "turn", { to: "right", dur: 0.12 / k }), A(f.len, "move", { to: OUT, dur: 0.15 / k, steps: 2 }),
    { who: f.id, do: "move", to: EXIT, dur: WALK_OUT, ease: "out", steps: 3, at: r3(rel(f.len) + 0.15) }, { who: f.id, do: "hide", at: r3(rel(f.len) + 0.15 + WALK_OUT) },
    Ap(f.len + (0.15 + WALK_OUT) / k, { scale: 0 }, 0));   // and the apple they took along goes too (the loop brings the Astronaut back)
  sb.cast.push({ id: f.id, character: `potatobrawl/${f.character}`, at: f.start ? C : ENTER, face: f.start ? "3q-right" : "right", expr: f.expr, seed: 1.1 + i * 0.7 });
  if (!f.start) sb.cast.at(-1).hidden = true;
  // the next one walks up to the queue spot during this turn, so there's always someone waiting
  const nx = FIGHTERS[i + 1];
  if (nx) items.push({ who: nx.id, do: "show", at: rel(0) }, { who: nx.id, do: "move", to: WAIT, dur: QUEUE, ease: "out", steps: 3, at: rel(0) });
  // the climb, the apple in the hand and the tree are contact on purpose
  sb.allowClip.push({ who: f.id, with: "tree", from: r3(t0), to: r3(t0 + arrive + f.len * k + 0.3) }, { who: f.id, with: aid, from: r3(t0), to: 99 });
  sb.beats.push({ name: `${f.id}: ${f.how}`, at: r3(t0), len: r3(arrive + f.len * k + (f.last ? 0 : 0.15 + WALK_OUT)), do: items });
  t0 = t0 + arrive + f.len * k + 0.15;   // the next one sets off from the queue as this one walks off
}
sb.beats[0].do.unshift(...sb.cast.filter((c) => c.hidden).map((c) => ({ who: c.id, do: "hide", at: 0 })));
for (const c of sb.cast) delete c.hidden;
// the loop: the Viking walks off and the Astronaut comes back to the trunk, so the last frame is the first one
const vik = sb.beats.at(-1), out = vik.len - 0.05;
vik.do.push({ who: "vik", do: "turn", to: "right", dur: 0.12, at: r3(out) }, { who: "vik", do: "move", to: EXIT, dur: WALK_OUT, ease: "out", steps: 3, at: r3(out) },
  { who: "ast", do: "show", at: r3(out - 0.5) }, { who: "ast", do: "expr", expr: "focused", at: r3(out - 0.5) }, { who: "ast", do: "arm", side: "R", pose: "rest", at: r3(out - 0.5), dur: 0.01 },
  { who: "ast", do: "move", to: WAIT, dur: 0.45, ease: "out", steps: 3, at: r3(out - 0.5) },
  { who: "ast", do: "move", to: C, dur: WALK_IN + 0.1, ease: "out", steps: 3, at: r3(out) }, { who: "ast", do: "turn", to: "3q-right", dur: 0.15, at: r3(out + WALK_IN - 0.1) },
  { who: "ast", do: "arm", side: "both", pose: "hold", dur: 0.05, at: r3(out + 0.48) }, { who: "ast", do: "lean", to: 12, dur: 0.05, at: r3(out + 0.48) });   // hands on the trunk, as in frame 0
vik.len = r3(out + WALK_IN + 0.15);
sb.allowClip.push({ who: "ast", with: "tree", from: r3(vik.at + out), to: r3(vik.at + vik.len) },   // back at the trunk, as in frame 0
  { who: "sor", with: "portal-a", from: 0, to: 99 }, { who: "sor", with: "portal-b", from: 0, to: 99 });
const end = vik.at + vik.len;
sb.cover = 18.3;   // the tree going over
if (end > 20) sb.escalation = true;   // over 20 s: the biggest (the Viking) is last, the escalation the rule asks for
// one camera, no cuts: a slow push in, and back out over the last 1.6 s so the last frame matches the first
const WIDE = { pos: [0.05, 1.5, 6.2], look: [0.05, 1.3, -0.6], fov: 38 }, TIGHT = { pos: [0.05, 1.45, 5.7], look: [0.05, 1.28, -0.6], fov: 37 };
sb.shots.push({ at: 0, ...WIDE, to: TIGHT, dur: r3(end - 1.6), ease: "linear" }, { at: r3(end - 1.6), ...TIGHT, to: WIDE, dur: 1.5, ease: "inOut" });
sb.captions.push({ from: 0, to: r3(end), text: "TREE", style: "label", pos: 230, pop: false });
sb.captions.push({ from: 0, to: 2.4, text: "1 tree. 10 fighters.", pos: 340 });
// each fighter's name under the title while it's their turn (the Astronaut's turn has the hook line there)
// (one swaps for the next as that one reaches the trunk, so the line never goes blank), then the closing question
const swaps = sb.beats.map((b, i) => (i ? r3(Math.max(b.at + WALK_IN - 0.15, 2.4)) : 0)), ask = r3(vik.at + 2.5);
for (const [i] of sb.beats.entries()) {
  if (!i) continue;
  const name = FIGHTERS[i].id === "all" ? "ALLFATHER" : FIGHTERS[i].character.toUpperCase();
  sb.captions.push({ from: swaps[i], to: FIGHTERS[i].last ? ask : swaps[i + 1], text: name, style: "label", pos: 340, pop: false });
}
sb.captions.push({ from: ask, to: r3(end), text: "which one are you?", pos: 340 });
writeFileSync(new URL("./tree-01-apple-each.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`tree-01-apple-each: ${r3(end)} s, ${FIGHTERS.length} fighters`);
