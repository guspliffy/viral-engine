// PIZZA: "how each fighter eats their slice", the second "each character vs X" clip. One continuous take at a
// picnic table (Jonny: one scene, clean, nothing glitchy). The 10 fighters take turns at one pizza cut in 10 slices:
// each walks in behind the table, eats a slice their own way and walks off; the pizza gets smaller as it goes, and
// the Viking eats everything that's left in one bite.
// Writes a beat storyboard (docs/STORYBOARD.md): storyboards/pizza-01-one-slice-each.json, one beat per fighter.
//   node storyboards/make-pizza.mjs
import { writeFileSync } from "node:fs";

const ENTER = [-2.7, -1.5], WAIT = [-1.1, -1.5], MARK = [0, -0.75], EXIT = [2.7, -0.75];   // the next one queues at WAIT
const TS = 0.75, TOP = 0.62 * TS + 0.026;   // table scale; the table top plus the pizza board, where the slices lie
const MOUTH = [0, 0.64, -0.25];              // in front of the mouth of a fighter standing on MARK
const WALK_IN = 0.4, WALK_OUT = 0.45, QUEUE = 0.6, K = 0.88;   // K: each turn (but the Viking's) plays at 0.88x its written times
const SL = 1.5;                             // a taken slice grows to 1.5x, so it reads at phone size
const r3 = (x) => Math.round(x * 1000) / 1000;

// each entry: who, how, len (from arriving on the mark to walking off), and its items with times from arriving.
// S(t, set, dur, ease) tweens this fighter's slice; P(...) the pizza; A(t, do, opts) an action of this fighter;
// bites(t, n, gap) eats the slice in n bites.
const FIGHTERS = [
  { id: "ast", character: "astronaut", how: "the slice floats up in zero gravity, he floats up after it", len: 1.85, expr: "eager", start: true, b: ({ A, S, bites, take }) => [
    ...take(0),
    S(0, { y: 1.0, z: -0.15, rot: 200, tilt: 25 }, 0.8, "out"),
    A(0, "fly", { to: { y: 0.42 }, dur: 0.7, ease: "out" }),
    A(0.1, "arm", { side: "both", pose: "up", dur: 0.3 }),
    S(0.8, { x: MOUTH[0], y: MOUTH[1] + 0.42, z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.3, "inOut"),
    A(0.8, "expr", { expr: "delighted" }),
    ...bites(1.1, 2, 0.2),
    A(1.5, "drop", { to: 0, dur: 0.25 }),
    A(1.5, "arm", { side: "both", pose: "rest", dur: 0.25 }),
  ] },

  { id: "rea", character: "reaper", how: "three tiny, very polite bites", len: 1.6, expr: "deadpan", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "L", pose: "hold", dur: 0.2 }),
    S(0.05, { x: MOUTH[0] - 0.05, y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.35),
    ...bites(0.45, 3, 0.28),
    A(1.3, "blink", { dur: 0.15 }),
    A(1.35, "arm", { side: "L", pose: "rest", dur: 0.2 }),
  ] },

  { id: "sor", character: "sorcerer", how: "floats it over with his orb", len: 1.6, expr: "evil", b: ({ A, S, bites, take }) => [
    A(0, "charge", { to: 1, dur: 0.25 }),
    A(0, "arm", { side: "L", pose: "cast", dur: 0.2 }),
    ...take(0.1),
    S(0.1, { y: 0.95, z: -0.1, rot: 162, tilt: 0 }, 0.4, "out"),
    { fx: "sparkle", who: "sor", at: 0.1, dur: 0.8, count: 6, color: "#b6ff9a" },
    S(0.5, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.35, "inOut"),
    A(0.6, "charge", { to: 0, dur: 0.3 }),
    A(0.6, "arm", { side: "L", pose: "rest", dur: 0.25 }),
    ...bites(0.9, 2, 0.22),
    A(1.35, "expr", { expr: "smug" }),
  ] },

  { id: "wiz", character: "wizard", how: "a spell to make it bigger shrinks it", len: 1.7, expr: "eager", b: ({ A, S, bites, take }) => [
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

  { id: "dra", character: "dragon", how: "toasts it with his breath first", len: 1.8, expr: "eager", b: ({ A, S, F, bites, take }) => [
    ...take(0),
    S(0, { x: 0.4, y: 0.9, z: -0.35, rot: "EAT", tilt: 20 }, 0.35, "out"),
    A(0.3, "wings", { to: 1, dur: 0.2 }),
    A(0.35, "lean", { to: -8, dur: 0.15 }), A(0.3, "look", { to: [0.4, 0.9], dur: 0.15 }),
    F(0.4, { x: 0.3, y: 0.75, z: -0.3 }, 0.01), F(0.42, { fire: 1 }, 0.15, "out"),
    S(0.45, { toast: 1 }, 0.4),
    F(0.85, { fire: 0 }, 0.25, "in"),
    A(0.85, "lean", { to: 0, dur: 0.15 }),
    A(0.9, "wings", { to: 0, dur: 0.25 }),
    S(0.95, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], tilt: 0 }, 0.25), A(0.95, "look", { to: [0, 0], dur: 0.15 }),
    ...bites(1.2, 2, 0.2),
    A(1.6, "expr", { expr: "delighted" }),
  ], fx: [{ fx: "poof", pos: [0.4, 0.95, -0.35], at: 0.9, dur: 0.5, puffs: 3, sparks: 0 }] },

  { id: "phx", character: "phoenix", how: "flips it to catch it in his mouth: it lands on his face", len: 1.9, expr: "cocky", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "R", pose: "up", dur: 0.15 }),
    S(0.05, { y: 1.8, z: -0.3, rot: 520, tilt: 200 }, 0.5, "out"),
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

  { id: "gun", character: "gunslinger", how: "twirls it like a revolver, one bite", len: 1.7, expr: "cocky", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0, "arm", { side: "R", pose: "hold", dur: 0.2 }),
    S(0.05, { x: 0.4, y: 0.78, z: -0.35, rot: 72, tilt: -10 }, 0.25),
    S(0.3, { roll: 720 }, 0.55, "inOut"),
    S(0.9, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0, roll: 790 }, 0.2, "in"),
    ...bites(1.1, 1, 0.2),
    A(1.3, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(1.35, "arm", { side: "L", pose: "hips", dur: 0.2 }),
  ], sfx: [{ sfx: "whoosh", at: 0.3, dur: 0.55, gain: 0.2 }] },

  { id: "sam", character: "samurai", how: "spears it on his blade, one clean bite", len: 1.7, expr: "focused", b: ({ A, S, bites, take }) => [
    A(0, "charge", { to: 1, dur: 0.25 }),
    A(0.1, "arm", { side: "R", pose: "point", dur: 0.12 }),
    ...take(0.25),
    S(0.25, { x: 0.5, y: 1.05, z: -0.3, rot: 72, tilt: -60 }, 0.15, "out"),
    A(0.55, "arm", { side: "R", pose: "cast", dur: 0.2 }),
    S(0.6, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.3),
    ...bites(0.95, 1, 0.2),
    A(1.2, "charge", { to: 0, dur: 0.25 }),
    A(1.2, "arm", { side: "R", pose: "rest", dur: 0.2 }),
    A(1.25, "expr", { expr: "serene" }),
  ], sfx: [{ sfx: "whoosh", at: 0.2, dur: 0.15, gain: 0.3 }, { sfx: "tink", at: 0.3, gain: 0.25 }] },

  { id: "all", character: "allfather", how: "raises it like a trophy first", len: 1.8, expr: "stern", b: ({ A, S, bites, take }) => [
    ...take(0),
    A(0.05, "arm", { side: "R", pose: "up", dur: 0.25 }),
    S(0.05, { x: 0.12, y: 1.1, z: -0.5, rot: -18, tilt: -70 }, 0.35, "out"),
    { fx: "sparkle", who: "all", at: 0.35, dur: 0.6, count: 6 },
    A(0.75, "arm", { side: "R", pose: "rest", dur: 0.25 }),
    S(0.75, { x: MOUTH[0], y: MOUTH[1], z: MOUTH[2], rot: "EAT", tilt: 0 }, 0.3),
    ...bites(1.1, 2, 0.24),
    A(1.55, "expr", { expr: "smug" }),
  ], sfx: [{ sfx: "sting", at: 0.35, gain: 0.2 }] },

  { id: "vik", character: "viking", how: "eats everything that's left in one bite", len: 2.9, expr: "delighted", last: true, b: ({ A, P }) => [
    A(0, "arm", { side: "both", pose: "table", dur: 0.2 }),
    A(0, "look", { to: [0, -0.4], dur: 0.15 }),
    A(0.05, "expr", { expr: "shocked" }),               // only one slice left?
    A(0.35, "look", { to: [0, 0], dur: 0.15 }),
    A(0.35, "arm", { side: "both", pose: "table", dur: 0.2 }),
    P(0.45, { y: 0.5, z: -0.2, tilt: 25 }, 0.35, "out"),    // the whole board, like a plate going in
    A(0.9, "expr", { expr: "eager" }),
    P(1.05, { scale: 0.5 }, 0.1, "out"),
    A(1.05, "squash", { amount: 0.12, dur: 0.15 }),
    P(1.25, { scale: 0.02 }, 0.12, "in"),
    A(1.25, "squash", { amount: 0.3, dur: 0.3 }),
    A(1.3, "expr", { expr: "delighted" }),
    A(1.45, "arm", { side: "both", pose: "fist", dur: 0.25 }),
    A(1.55, "hop", { height: 0.08, count: 2, dur: 0.7 }),
    // a fresh pizza for the next round (swapped in while the old one is a crumb, then poofed in), and he walks off
    P(1.5, { left: 10, y: 0.62 * TS, z: 0, tilt: 0 }, 0),
    P(2.25, { scale: 1 }, 0.3, "out"),
    A(2.25, "arm", { side: "both", pose: "rest", dur: 0.2 }),
    A(2.3, "turn", { to: "right", dur: 0.12 }),
    A(2.3, "move", { to: EXIT, dur: 0.45, ease: "out", steps: 3 }),
  ], fx: [{ fx: "shake", at: 1.25, dur: 0.3, amp: 0.04 }, { fx: "poof", pos: [0, 0.68, -0.3], at: 1.25, dur: 0.7, puffs: 0, sparks: 16, spark: "#f2c46b" },
    { fx: "poof", pos: [0, 0.62 * TS + 0.05, 0], at: 2.2, dur: 0.5, puffs: 5, sparks: 6, spark: "#ffe08a" }],
  sfx: [{ sfx: "pop", at: 1.05, gain: 0.3 }, { sfx: "pop", at: 1.25, gain: 0.5 }, { sfx: "tink", at: 2.25, gain: 0.25 }] },
];

const sb = {
  id: "pizza-01-one-slice-each",
  title: "PIZZA: how each fighter eats their slice",
  format: "each-character-vs-X, one continuous take: fighters queue in, each eats a slice their own way, the pizza shrinks, biggest last",
  fps: 30, set: { type: "meadow" }, sound: { sfx: 0.5 }, escalation: false, loop: true, cover: 9.85,
  cast: [], beats: [],
  props: [{ id: "table", kind: "table", x: 0, z: 0, scale: TS }, { id: "pizza", kind: "pizza", x: 0, y: 0.62 * TS, z: 0, left: 10 },
    { id: "fire", kind: "flames", x: 0, y: 0, z: 0, scale: 0.3 }],
  shots: [], captions: [],
};
const top = TOP;
let t0 = 0;
for (const [i, f] of FIGHTERS.entries()) {
  // arrive: when this one reaches the mark; its own turn starts 0.15 s before, while it turns to the camera
  const w = 9 - i, sid = `slice-${f.id}`, arrive = f.start ? 0 : WALK_IN - 0.15;
  // the slice prop starts exactly on top of pizza slice w (invisible until it's taken)
  sb.props.push({ id: sid, kind: "slice", x: 0, y: top, z: 0, rot: w * 36, scale: 0 });
  const k = f.last ? 1 : K, rel = (t) => r3(arrive + t * k), d = (x) => r3(x * k);
  const A = (t, what, o = {}) => ({ who: f.id, do: what, at: rel(t), ...o, ...(o.dur != null && { dur: d(o.dur) }) });
  const S = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: sid, at: rel(t), dur: d(dur), ease, set });
  const P = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "pizza", at: rel(t), dur: d(dur), ease, set });
  const F = (t, set, dur = 0.3, ease = "inOut") => ({ do: "prop", id: "fire", at: rel(t), dur: d(dur), ease, set });
  const take = (t) => [P(t, { left: w }, 0), S(t, { scale: 1 }, 0), S(t + 0.01, { scale: SL }, 0.3)];   // swap in place, then grow so it reads
  const bites = (t, n, gap) => Array.from({ length: n }, (_, j) => [
    S(t + j * gap, { scale: (1 - (j + 1) / n) * SL }, 0.1, "out"),
    A(t + j * gap, "squash", { amount: 0.08, dur: 0.12 }),
    { sfx: "pop", at: rel(t + j * gap), gain: 0.18 },
  ]).flat();
  // rot "EAT": the eating pose, tip in the mouth and the slice sticking out to the right with its top to the camera
  // (rot 72 + 360k, the turn nearest the slice's last angle, so it never spins the long way; roll 70 unless set)
  const made = f.b({ A, S, P, F, bites, take });
  let lastRot = w * 36;
  for (const x of made.filter((x) => x.id === sid && x.set?.rot != null).sort((a, b) => a.at - b.at)) {
    if (x.set.rot === "EAT") { x.set.rot = 72 + 360 * Math.round((lastRot - 72) / 360); x.set.roll ??= 70; }
    lastRot = x.set.rot;
  }
  const items = [
    ...(f.start ? [] : [{ who: f.id, do: "move", to: MARK, dur: WALK_IN, ease: "out", steps: 3, at: 0 }, { who: f.id, do: "turn", to: "camera", dur: 0.15, at: WALK_IN - 0.15 }]),
    ...made.map((x) => (x.do ? x : { ...x, at: rel(x.at) })),   // effects written inline
    ...(f.fx || []).map((x) => ({ ...x, at: rel(x.at) })),
    ...(f.sfx || []).map((x) => ({ ...x, at: rel(x.at) })),
  ];
  // walking off starts fast (ease out), so the next one, already on the way in, never gets close
  if (!f.last) items.push(A(f.len, "turn", { to: "right", dur: 0.12 / k }), { who: f.id, do: "move", to: EXIT, dur: WALK_OUT, ease: "out", steps: 3, at: rel(f.len) }, { who: f.id, do: "hide", at: r3(rel(f.len) + WALK_OUT) });
  sb.cast.push({ id: f.id, character: `potatobrawl/${f.character}`, at: f.start ? MARK : ENTER, face: f.start ? "camera" : "right", expr: f.expr, seed: 1.1 + i * 0.7 });
  // everyone but the first waits off-screen, hidden
  if (!f.start) sb.cast.at(-1).hidden = true;
  // the next one walks up to the queue spot during this turn, so there's always someone waiting
  const nx = FIGHTERS[i + 1];
  if (nx) items.push({ who: nx.id, do: "show", at: rel(0.2) }, { who: nx.id, do: "move", to: WAIT, dur: QUEUE, ease: "out", steps: 3, at: rel(0.2) });
  // eating is contact on purpose: each slice may touch its eater during their turn (qa/check.mjs clipping guard)
  sb.allowClip = [...(sb.allowClip || []), { who: f.id, with: f.last ? "pizza" : sid, from: r3(t0), to: r3(t0 + arrive + f.len * k + 0.3) }];
  sb.beats.push({ name: `${f.id}: ${f.how}`, at: r3(t0), len: r3(arrive + f.len * k + (f.last ? 0 : WALK_OUT)), do: items });
  t0 = t0 + arrive + f.len * k;   // the next one sets off from the queue as this one walks off
}
// hidden fighters: a hide at 0 in the first beat (no cast flag for it; a top-level actions list would make it flat)
sb.beats[0].do.unshift(...sb.cast.filter((c) => c.hidden).map((c) => ({ who: c.id, do: "hide", at: 0 })));
for (const c of sb.cast) delete c.hidden;
// the loop: while the Viking walks off with the fresh pizza on the table, the Astronaut walks back to the mark, so the
// last frame is the first one (Astronaut on the mark, a whole pizza)
const vik = sb.beats.at(-1), out = vik.do.find((x) => x.who === "vik" && x.do === "move" && x.to === EXIT).at;   // the Viking walks off
vik.do.push({ who: "ast", do: "show", at: r3(out - 0.6) }, { who: "ast", do: "turn", to: "right", dur: 0.01, at: r3(out - 0.6) }, { who: "ast", do: "expr", expr: "eager", at: r3(out - 0.6) },
  { who: "ast", do: "move", to: WAIT, dur: 0.5, ease: "out", steps: 3, at: r3(out - 0.6) },
  { who: "ast", do: "move", to: MARK, dur: WALK_IN, ease: "out", steps: 3, at: out }, { who: "ast", do: "turn", to: "camera", dur: 0.15, at: r3(out + WALK_IN - 0.15) });
vik.len = r3(out + WALK_IN + 0.1);
const end = vik.at + vik.len;
// one camera, no cuts: a slow push in over the whole clip
// (and back out over the last 1.6 s, so the last frame matches the first for the loop)
const WIDE = { pos: [0, 1.55, 4.3], look: [0, 0.75, -0.4], fov: 38 }, TIGHT = { pos: [0, 1.45, 3.8], look: [0, 0.7, -0.4], fov: 36 };
sb.shots.push({ at: 0, ...WIDE, to: TIGHT, dur: r3(end - 1.6), ease: "linear" }, { at: r3(end - 1.6), ...TIGHT, to: WIDE, dur: 1.5, ease: "inOut" });
sb.captions.push({ from: 0, to: r3(end), text: "PIZZA", style: "label", pos: 230, pop: false });
sb.captions.push({ from: 0, to: 2.4, text: "10 fighters. 1 pizza.", pos: 340 });
// each fighter's name under the title while it's their turn, so "which one are you?" can be answered
for (const [i, b] of sb.beats.entries()) {
  const name = { all: "ALLFATHER" }[b.name.slice(0, 3)] || FIGHTERS[i].character.toUpperCase();
  const to = FIGHTERS[i].last ? b.at + out : b.at + b.len - 0.35;
  if (!i) continue;   // the Astronaut's turn has the hook line in that spot
  sb.captions.push({ from: r3(Math.max(b.at + 0.25, 2.4)), to: r3(to), text: name, style: "label", pos: 340, pop: false });
}
sb.captions.push({ from: r3(end - 1.3), to: r3(end), text: "which one are you?", pos: 450 });
writeFileSync(new URL("./pizza-01-one-slice-each.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`pizza-01-one-slice-each: ${r3(end)} s, ${FIGHTERS.length} fighters`);
