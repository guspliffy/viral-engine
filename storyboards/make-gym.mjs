// GYM: "how each fighter lifts", the "same task, each fighter their own way" format (Jonny's rules, 2026-10-24): one gym,
// one barbell on the lifting platform. Each fighter walks up and "lifts" the way a type of real gym-goer does
// (docs/each-activities.md), in their signature way. One continuous take from the middle of the gym. Frame 0 is the
// Astronaut holding the loaded bar up with one hand; the last frame sets that up again.
//   node storyboards/make-gym.mjs   ->  storyboards/gym-01-lift.json
import { clip } from "./each-lib.mjs";

const LIFT = [0, -1.2], BAR = [0, 0.2, -0.85], BENCH = [-1.0, -1.45], WAIT = [0.82, -1.6], ENTER = [2.9, -1.1];
const OUT = [-0.5, -0.65], EXIT = [-2.9, -0.55], NEAR = [0.75, -1.2];
const ONE = { o: [-0.02, 1.25, 0.1] };   // one arm straight up, holding the bar over the head
const c = clip({
  id: "gym-01-lift", title: "GYM: how each fighter lifts",
  format: "each-character-vs-X, one continuous take: fighters take turns at one barbell, each lifts their own way",
  set: { type: "gym" },
  props: [
    { id: "bar", kind: "barbell", x: BAR[0], y: BAR[1], z: BAR[2] },
    { id: "bench", kind: "weightbench", x: BENCH[0], z: BENCH[1] },
    { id: "crater", kind: "socket", hole: true, x: 0, y: 0.04, z: -0.9, tilt: -90, scale: 0 },
    { id: "phone", kind: "phone", x: ENTER[0], y: 0.5, z: ENTER[1], glow: 1, scale: 0 },
  ],
});
const { A, prop, fx, sfx, walk } = c;
const grab = (who, id, hand, at, dur = 0.25, off = [0, 0, 0]) => c.items.push({ who, do: "grab", prop: id, hand, at, dur, off });
const release = (who, id, at, to, dur = 0.25, arc = 0) => c.items.push({ who, do: "release", prop: id, at, to, dur, arc });

// ---- pieces every turn uses
const queue = (who, t) => { A(who, t, "show"); A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, WAIT, 0.5); A(who, t + 0.5, "turn", { to: "left", dur: 0.01 }); };   // waits in view, watching the lifter
const stepUp = (who, t) => {   // in from the right to the bar, a little bounce to get ready
  walk(who, t - 0.35, LIFT, 0.45, "inOut", 3); A(who, t + 0.05, "turn", { to: "camera", dur: 0.12 });   // from the queue spot beside the platform
  return t + 0.15;
};
const lift = (who, t, { up = 0.3 } = {}) => {   // grab the bar with both hands and press it up overhead
  A(who, t, "squash", { amount: 0.1, dur: 0.2 }); grab(who, "bar", "both", t, 0.25);
  A(who, t + 0.25, "arm", { side: "both", pose: "up", dur: up }); sfx(t + 0.25, "whoosh", { dur: 0.3, gain: 0.12 });
  return t + 0.25 + up;
};
const putDown = (who, t) => {
  A(who, t, "arm", { side: "both", pose: "hold", dur: 0.2 }); release(who, "bar", t + 0.2, BAR, 0.2);
  A(who, t + 0.35, "arm", { side: "both", pose: "rest", dur: 0.2 }); sfx(t + 0.4, "impact", { gain: 0.2 });
  return t + 0.45;
};
const leave = (who, t, dur = 0.55) => {
  A(who, t, "turn", { to: "left", dur: 0.15 }); A(who, t, "look", { to: [0, 0], dur: 0.12 });
  walk(who, t + 0.05, OUT, 0.25, "out", 2); walk(who, t + 0.3, EXIT, dur, "linear"); A(who, t + 0.3 + dur, "hide");
  return t + 0.4;
};
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "all", "sam", "vik"];
c.cast("ast", LIFT, { expr: "delighted" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
for (const id of order) for (const p of ["bar", "bench", "phone"]) c.clipOk(id, p);
c.clipOk("vik", "crater");

// ---- 1. Astronaut: makes it look easy. The loaded bar up on one hand, two easy pumps
// (frame 0: the bar held up on one hand; the last frame matches)
const start = (t) => {
  grab("ast", "bar", "R", t, 0.01); A("ast", t, "arm", { side: "R", pose: ONE, dur: 0.01 }); A("ast", t, "arm", { side: "L", pose: "hips", dur: 0.01 });
  A("ast", t, "expr", { expr: "delighted" }); A("ast", t, "look", { to: [0, 0], dur: 0.01 });
};
start(-0.3);
c.beat("ast", 0, "makes it look easy: the loaded bar up on one hand, a couple of easy pumps", "makes it look easy");
fx(0.05, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(0.05, "tink", { gain: 0.25 });
A("ast", 0.3, "squash", { amount: -0.06, dur: 0.15 });
A("ast", 0.35, "arm", { side: "R", pose: { o: [-0.02, 1.0, 0.1] }, dur: 0.15 }); A("ast", 0.5, "arm", { side: "R", pose: ONE, dur: 0.15 });   // two easy pumps
A("ast", 0.65, "arm", { side: "R", pose: { o: [-0.02, 1.0, 0.1] }, dur: 0.15 }); A("ast", 0.8, "arm", { side: "R", pose: ONE, dur: 0.15 }); A("ast", 0.6, "look", { to: [0.3, 0.1], dur: 0.12 });
A("ast", 1.0, "arm", { side: "R", pose: { o: [-0.02, 1.0, 0.1] }, dur: 0.15 }); A("ast", 1.15, "arm", { side: "R", pose: ONE, dur: 0.15 }); A("ast", 1.0, "look", { to: [0, 0], dur: 0.12 });
A("ast", 1.35, "arm", { side: "both", pose: "hold", dur: 0.25 }); grab("ast", "bar", "both", 1.35, 0.25);
let b = putDown("ast", 1.6);
queue("rea", 0.9);
let free = leave("ast", b);

// ---- 2. Reaper: the bench is a chair. Sits on it scrolling his phone, never touches the bar
let t = free + 0.3;   // (the Astronaut is clear of the bench path by then)
c.beat("rea", t, "the bench is his chair: sits there scrolling, never lifts a thing", "uses the bench as a chair");
A("rea", t - 0.35, "turn", { to: "left", dur: 0.1 }); walk("rea", t - 0.35, [BENCH[0] + 0.5, -1.15], 0.45, "out", 3);
A("rea", t + 0.1, "sit", { seat: "bench", dur: 0.35 }); sfx(t + 0.4, "land", { gain: 0.2 });
prop("phone", t + 0.35, { scale: 1.5, glow: 1 }, 0.05); grab("rea", "phone", "R", t + 0.35, 0.2, [0, 0, 0.03]);
A("rea", t + 0.55, "arm", { side: "R", pose: { o: [-0.05, 0.72, 0.32] }, dur: 0.15 }); A("rea", t + 0.55, "look", { to: [-0.15, -0.2], dur: 0.12 }); A("rea", t + 0.5, "expr", { expr: "deadpan" });
A("rea", t + 0.85, "arm", { side: "R", pose: { o: [-0.03, 0.76, 0.32] }, dur: 0.1 }); A("rea", t + 1.0, "arm", { side: "R", pose: { o: [-0.05, 0.72, 0.32] }, dur: 0.1 });   // a thumb flick
A("rea", t + 1.2, "look", { to: [0.2, 0], dur: 0.15 }); A("rea", t + 1.4, "blink", { dur: 0.2 });   // looks at us. Doesn't move
queue("sor", t + 0.6);
A("rea", t + 1.3, "stand", { dur: 0.2 }); A("rea", t + 1.35, "turn", { to: "left", dur: 0.15 }); walk("rea", t + 1.4, EXIT, 0.6, "linear"); A("rea", t + 2.0, "hide");
prop("phone", t + 2.0, { scale: 0 }, 0);

// ---- 3. Sorcerer: doesn't touch it. The bar floats up on its own while he stands there, arms folded
t = stepUp("sor", t + 1.45);
c.beat("sor", t - 0.15, "lifts with his mind: the bar floats up while he stands there", "doesn't touch it");
A("sor", t, "expr", { expr: "smug" }); A("sor", t, "arm", { side: "both", pose: "hips", dur: 0.15 }); A("sor", t, "charge", { to: 1, dur: 0.15 });
fx(t + 0.1, { fx: "poof", pos: [0, 0.3, BAR[2]], dur: 0.5, puffs: 3, sparks: 14, color: "#c9f7b0", spark: "#9dff6a" }); sfx(t + 0.1, "charge", { dur: 0.8, gain: 0.2 });
prop("bar", t + 0.15, { y: 1.7, z: -1.0 }, 0.5, "inOut"); A("sor", t + 0.2, "look", { to: [0, 0.6], dur: 0.15 });
A("sor", t + 0.75, "look", { to: [0, 0], dur: 0.15 }); fx(t + 0.75, { fx: "sparkle", who: "sor", dur: 0.5 });
prop("bar", t + 0.8, { y: BAR[1], z: BAR[2] }, 0.3, "in"); sfx(t + 1.1, "impact", { gain: 0.2 }); A("sor", t + 1.05, "charge", { to: 0, dur: 0.15 });
queue("wiz", t + 0.4);
free = leave("sor", t + 1.15);

// ---- 4. Wizard: a spell to make it lighter. The plates turn into balloons and he floats away with it... then they pop
t = stepUp("wiz", free);
c.beat("wiz", t - 0.15, "a spell to make it lighter: balloons carry him up, then pop", "the spell goes wrong");
A("wiz", t, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t, "charge", { to: 0.7, dur: 0.15 }); A("wiz", t, "expr", { expr: "stern" });
fx(t + 0.2, { fx: "poof", pos: [0, 0.4, BAR[2]], dur: 0.5, puffs: 8, sparks: 10, spark: "#c8b6ff" }); sfx(t + 0.2, "poof", { gain: 0.3 });
prop("bar", t + 0.25, { balloon: 1 }, 0.3, "out"); A("wiz", t + 0.35, "charge", { to: 0, dur: 0.15 }); A("wiz", t + 0.4, "expr", { expr: "delighted" });
b = lift("wiz", t + 0.5, { up: 0.3 });
A("wiz", b, "fly", { to: { y: 0.5 }, dur: 0.45, ease: "inOut" }); A("wiz", b + 0.25, "expr", { expr: "shocked" });
b -= 0.2;
prop("bar", b + 0.75, { balloon: 0 }, 0.08, "in"); sfx(b + 0.75, "pop", { gain: 0.35 }); sfx(b + 0.8, "pop", { gain: 0.3 });
A("wiz", b + 0.8, "drop", { dur: 0.3 }); sfx(b + 1.1, "impact", { gain: 0.35 }); fx(b + 1.1, { fx: "shake", dur: 0.2, amp: 0.04 });
release("wiz", "bar", b + 0.85, BAR, 0.25); A("wiz", b + 0.85, "arm", { side: "both", pose: "rest", dur: 0.2 });
A("wiz", b + 1.15, "expr", { expr: "dizzy" }); A("dra", b + 0.85, "expr", { expr: "shocked" }); A("dra", b + 1.4, "expr", { expr: "kind" }); fx(b + 1.15, { fx: "sparkle", who: "wiz", dur: 0.5, color: "#ffe066" });
queue("dra", b + 0.5);
free = leave("wiz", b + 1.45);

// ---- 5. Dragon: the grunter. One lift, one ROAR, a jet of fire at the ceiling
t = stepUp("dra", free);
c.beat("dra", t - 0.15, "the grunter: one lift, one roar, a jet of fire at the ceiling", "the grunter");
A("dra", t, "expr", { expr: "stern" });
b = lift("dra", t, { up: 0.35 });
fx(t + 0.1, { fx: "alert", who: "dra", text: "RAAH!", color: "#ff7a1a", dur: 0.9 }); A("dra", t + 0.1, "expr", { expr: "evil" });
fx(b - 0.05, { fx: "poof", pos: [0.05, 1.8, -1.05], dur: 0.6, puffs: 10, sparks: 30, color: "#ff7a1a", spark: "#ffe08a" }); sfx(b - 0.05, "whoosh", { dur: 0.5, gain: 0.3 }); fx(b - 0.05, { fx: "shake", dur: 0.3, amp: 0.06 }); fx(b - 0.05, { fx: "flash", dur: 0.08, peak: 0.3 });
fx(b + 0.3, { fx: "sweat", who: "dra", dur: 0.5, count: 6 });
b = putDown("dra", b + 0.55); A("dra", b - 0.2, "expr", { expr: "happy" });
queue("phx", b - 0.6);
free = leave("dra", b);

// ---- 6. Phoenix: the ego lift. Another plate on each side... the bar bends and so does he
t = stepUp("phx", free);
c.beat("phx", t - 0.15, "the ego lift: one more plate each side, and it pins him", "too much weight");
A("phx", t, "expr", { expr: "cocky" }); A("phx", t, "look", { to: [0, -0.4], dur: 0.12 }); fx(t, { fx: "alert", who: "phx", text: "MORE", color: "#e0a800", dur: 0.5 });
prop("bar", t + 0.05, { plates: 3 }, 0.2, "out"); for (const x of [-0.75, 0.75]) fx(t + 0.08, { fx: "poof", pos: [x, 0.25, BAR[2]], dur: 0.35, puffs: 2, sparks: 6 }); sfx(t + 0.1, "tink", { gain: 0.2 }); sfx(t + 0.2, "tink", { gain: 0.2 });
A("phx", t + 0.3, "look", { to: [0, 0], dur: 0.12 });
b = lift("phx", t + 0.35, { up: 0.6 });
prop("bar", b - 0.3, { bend: 1 }, 0.3, "in"); A("phx", b - 0.3, "expr", { expr: "shocked" });
A("phx", b - 0.25, "arm", { side: "both", pose: { o: [0.02, 0.62, 0.15] }, dur: 0.3 });   // the bar wins: back down to his chin
A("phx", b, "squash", { amount: 0.35, dur: 0.6 }); A("phx", b, "lean", { to: -12, dur: 0.2 }); fx(b, { fx: "sweat", who: "phx", dur: 0.8, count: 6 }); fx(b + 0.05, { fx: "alert", who: "phx", text: "help", dur: 0.9 });
release("phx", "bar", b + 0.7, BAR, 0.18); A("phx", b + 0.7, "arm", { side: "both", pose: "rest", dur: 0.2 }); sfx(b + 0.88, "impact", { gain: 0.4 }); fx(b + 0.88, { fx: "shake", dur: 0.2, amp: 0.04 });
prop("bar", b + 0.88, { bend: 0 }, 0.15, "out"); A("phx", b + 0.9, "expr", { expr: "sad" }); A("phx", b + 0.75, "lean", { to: 0, dur: 0.2 });
A("gun", b + 0.1, "expr", { expr: "shocked" }); A("gun", b + 0.9, "expr", { expr: "kind" });   // the next in line saw that
queue("gun", b + 0.3);
free = leave("phx", b + 1.1);
prop("bar", free + 0.1, { plates: 2 }, 0.2);

// ---- 7. Gunslinger: makes it lighter. Shoots the plates off, then presses the bare bar
t = stepUp("gun", free);
c.beat("gun", t - 0.15, "too heavy? shoots the plates off, then lifts the bare bar", "shoots the plates off");
A("gun", t, "expr", { expr: "stern" }); A("gun", t + 0.05, "arm", { side: "R", pose: { o: [0.2, 0.25, 0.45] }, dur: 0.12 }); A("gun", t + 0.05, "look", { to: [-0.4, -0.4], dur: 0.12 });
for (const [i, x] of [[0, -0.6], [1, 0.6]]) {
  const u = t + 0.25 + i * 0.2;
  fx(u, { fx: "flash", dur: 0.06, peak: 0.2 }); sfx(u, "impact", { gain: 0.3 }); fx(u + 0.01, { fx: "poof", pos: [x, 0.25, BAR[2]], dur: 0.35, puffs: 2, sparks: 10, spark: "#ffd34d" });
  if (i === 0) A("gun", u + 0.05, "look", { to: [0.4, -0.4], dur: 0.1 });
}
prop("bar", t + 0.26, { plates: 0 }, 0.3, "in");
A("gun", t + 0.7, "arm", { side: "R", pose: "rest", dur: 0.15 }); A("gun", t + 0.7, "look", { to: [0, 0], dur: 0.12 });
b = lift("gun", t + 0.8, { up: 0.25 }); A("gun", b, "expr", { expr: "smug" }); fx(b, { fx: "sparkle", who: "gun", dur: 0.4 });
b = putDown("gun", b + 0.2);
queue("all", b - 0.6);
free = leave("gun", b);
fx(free + 0.1, { fx: "poof", pos: [0, 0.3, BAR[2]], dur: 0.4, puffs: 4, sparks: 4 }); prop("bar", free + 0.15, { plates: 2 }, 0.01);   // new plates

// ---- 8. Allfather: the endless warm-up. Stretch, stretch, stretch... "good workout". Never touches it
t = stepUp("all", free + 0.1);
c.beat("all", t - 0.15, "the endless warm-up: stretches and stretches, then calls it a workout", "warms up forever");
A("all", t, "expr", { expr: "focused" });
A("all", t + 0.05, "arm", { side: "both", pose: "up", dur: 0.2 }); A("all", t + 0.1, "lean", { to: 18, dur: 0.25 }); A("all", t + 0.4, "lean", { to: -18, dur: 0.3 });
A("all", t + 0.75, "lean", { to: 0, dur: 0.2 }); A("all", t + 0.75, "arm", { side: "both", pose: "hips", dur: 0.2 });
A("all", t + 1.0, "expr", { expr: "smug" }); A("all", t + 1.0, "arm", { side: "R", pose: { o: [0.0, 1.05, 0.18] }, dur: 0.15 }); fx(t + 1.05, { fx: "sweat", who: "all", dur: 0.4, count: 2 });   // wipes his brow
queue("sam", t + 0.6);
free = leave("all", t + 1.35);

// ---- 9. Samurai: a bar is just two dumbbells. One cut down the middle, and he presses both
t = stepUp("sam", free);
c.beat("sam", t - 0.15, "one cut turns the barbell into two dumbbells", "two dumbbells");
A("sam", t, "expr", { expr: "serene" }); A("sam", t + 0.05, "arm", { side: "R", pose: "up", dur: 0.12 });
A("sam", t + 0.3, "arm", { side: "R", pose: "point", dur: 0.08 }); fx(t + 0.3, { fx: "speedlines", dur: 0.12 }); fx(t + 0.32, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.32, "shing", { gain: 0.25 });
prop("bar", t + 0.33, { split: 1 }, 0.2, "out");
A("sam", t + 0.5, "arm", { side: "R", pose: "rest", dur: 0.12 });
b = lift("sam", t + 0.6, { up: 0.3 }); A("sam", b, "expr", { expr: "kind" }); fx(b, { fx: "sparkle", who: "sam", dur: 0.5 });
b = putDown("sam", b + 0.3);
queue("vik", b - 0.6);
free = leave("sam", b);
fx(free + 0.15, { fx: "poof", pos: [0, 0.3, BAR[2]], dur: 0.4, puffs: 4, sparks: 4 }); prop("bar", free + 0.2, { split: 0 }, 0.01);   // a new bar

// ---- 10. Viking: drops it from the top. The bar goes into the floor, the gym jumps
t = stepUp("vik", free + 0.1);
c.beat("vik", t - 0.15, "drops it from the top: the bar goes through the floor", "drops it");
A("vik", t, "expr", { expr: "stern" });
b = lift("vik", t, { up: 0.3 }); A("vik", b, "expr", { expr: "happy" }); fx(b, { fx: "alert", who: "vik", text: "HA!", color: "#e8402f", dur: 0.5 });
release("vik", "bar", b + 0.3, [BAR[0], 0.05, BAR[2]], 0.18); A("vik", b + 0.3, "arm", { side: "both", pose: "rest", dur: 0.15 });
const hit = b + 0.48;
sfx(hit, "impact", { gain: 0.55 }); fx(hit, { fx: "shake", dur: 0.4, amp: 0.07 }); fx(hit, { fx: "flash", dur: 0.08, peak: 0.3 });
fx(hit, { fx: "poof", pos: [0, 0.2, BAR[2]], dur: 0.6, puffs: 10, sparks: 14, color: "#e9e4d8", spark: "#ffe08a" });
prop("crater", hit, { scale: 5 }, 0.08, "out"); prop("bar", hit, { bend: 0.6 }, 0.1);
prop("bench", hit, { y: 0.35, roll: 25 }, 0.18, "out"); prop("bench", hit + 0.18, { y: 0, roll: 0 }, 0.2, "in"); sfx(hit + 0.4, "land", { gain: 0.3 });
A("vik", hit + 0.1, "arm", { side: "both", pose: "up", dur: 0.2 }); A("vik", hit + 0.1, "expr", { expr: "delighted" }); fx(hit + 0.3, { fx: "sparkle", who: "vik", dur: 0.6 });
const vikDone = hit + 0.1;

// ---- the loop: a poof mends the floor and the bar; the Astronaut has it up on one hand: frame 0
const fresh = vikDone + 1.15;
fx(fresh, { fx: "poof", pos: [0, 0.6, -1.0], dur: 0.45, puffs: 14, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop("crater", fresh + 0.08, { scale: 0 }, 0); prop("bar", fresh + 0.06, { bend: 0, plates: 2, balloon: 0, split: 0 }, 0);
A("ast", fresh + 0.03, "move", { to: LIFT, dur: 0.01 }); A("ast", fresh + 0.03, "turn", { to: "camera", dur: 0.01 });
start(fresh + 0.03); A("ast", fresh + 0.1, "show");   // posed while still hidden, then shown in the poof
const end = fresh + 0.5;

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [-0.2, 1.3, 5.0], look: [-0.2, 1.1, -1.5], fov: 44 },
  title: "GYM", hook: "1 barbell. 10 fighters.", hookTo: 1.4, askAt: vikDone + 0.1, cover: hit + 0.15,
  file: new URL("./gym-01-lift.json", import.meta.url),
});
