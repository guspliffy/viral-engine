// TEST: "how each fighter takes a test", the "same task, each fighter their own way" format (Jonny's rules, 2026-10-24):
// one classroom, one desk, one test paper. Each fighter sits down, a fresh test slides onto the desk (the teacher is
// the camera), and they take it the way a type of real pupil does (docs/each-activities.md), in their signature way.
// One continuous take. Frame 0 is the Astronaut scribbling away; the last frame sets that up again.
//   node storyboards/make-test.mjs   ->  storyboards/test-01-school-test.json
import { clip, r3 } from "./each-lib.mjs";

const DESK = [0, -1.0], TOP = 0.625, PAPER = [0, TOP, -0.47], CLOCK = [0.95, 2.55, -2.3];
const WAIT = [1.15, -1.25], ENTER = [2.9, -1.0], OUT = [-0.8, -1.05], EXIT = [-2.9, -1.05], HAND = [2.2, 1.3, 1.2];
const c = clip({
  id: "test-01-school-test", title: "TEST: how each fighter takes a test",
  format: "each-character-vs-X, one continuous take: fighters take turns at one desk, a new test each time, each takes it their own way",
  set: { type: "classroom" },
  props: [
    { id: "desk", kind: "desk", x: DESK[0], z: DESK[1] },
    { id: "paper", kind: "paper", x: PAPER[0], y: PAPER[1], z: PAPER[2], write: 0.3, tilt: 35 },   // leaning up, so the camera (the teacher) can read it
    { id: "pencil", kind: "pencil", x: 0.3, y: TOP + 0.012, z: -0.42, roll: -90, rot: 15, len: 1, scale: 1.6 },
    { id: "clock", kind: "clock", x: CLOCK[0], y: CLOCK[1], z: CLOCK[2], scale: 0.8, time: 9.0 },
    { id: "bolt", kind: "bolt", x: CLOCK[0], y: CLOCK[1] - 0.05, z: CLOCK[2] + 0.1, scale: 0.6 },
  ],
});
const { A, prop, fx, sfx, walk } = c;
const FRESH = { write: 0, magic: 0, name: 0, holes: 0, blot: 0, burn: 0, split: 0, stack: 0, scale: 1 };

// ---- pieces every turn uses
const W1 = { o: [-0.11, 0.3, 0.45] }, W2 = { o: [-0.07, 0.31, 0.43] };   // the writing hand, two spots on the page
const scribble = (who, t, dur, k = 0.1) => {   // the hand scrubs between two spots on the page
  for (let u = 0; u + 0.001 < dur; u += k) A(who, t + u, "arm", { side: "R", pose: Math.round(u / k) % 2 ? W2 : W1, dur: k });
  sfx(t, "scribble", { dur, gain: 0.2 });
};
const newPaper = (t) => {   // the teacher (off camera) slides a fresh test onto the desk
  prop("paper", t - 0.02, { ...FRESH, x: HAND[0], y: HAND[1], z: HAND[2] }, 0);
  prop("paper", t, { x: PAPER[0], y: PAPER[1], z: PAPER[2] }, 0.35, "out"); sfx(t, "whoosh", { dur: 0.3, gain: 0.15 });
};
const sitDown = (who, t) => {   // from the queue spot onto the chair, a new test arrives
  A(who, t, "sit", { seat: "desk", hands: "table", dur: 0.35 }); A(who, t, "turn", { to: "camera", dur: 0.15 }); sfx(t + 0.3, "land", { gain: 0.2 });
  newPaper(t + 0.15);
  return t + 0.4;
};
const leave = (who, t, dur = 0.5) => {   // up and off to the left
  A(who, t, "move", { to: [DESK[0], DESK[1] - 0.18], dur: 0.12 });   // back from the desk first (standing up moves forward)
  A(who, t + 0.05, "stand", { dur: 0.2 }); A(who, t + 0.05, "turn", { to: "left", dur: 0.15 });
  walk(who, t + 0.15, OUT, 0.25, "inOut", 2); walk(who, t + 0.4, EXIT, dur, "linear"); A(who, t + 0.4 + dur, "hide");
  return t + 0.25;   // the seat is free
};
const queue = (who, t, at = WAIT) => { A(who, t, "show"); A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, at, 0.5); A(who, t + 0.45, "turn", { to: "camera", dur: 0.15 }); };
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "sam", "all", "vik"];
c.cast("ast", DESK, { expr: "delighted" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
A("ast", -0.1, "sit", { seat: "desk", hands: "table", dur: 0.05 });
for (const id of order) c.clipOk(id, "desk");
c.clipOk("all", "bolt");

// ---- 1. Astronaut: the overachiever. Done in a blur, and the hand goes up: more paper, please
let t = 0;
c.beat("ast", 0, "the overachiever: fills it in in a blur, then asks for more paper", "asks for more paper");
scribble("ast", -0.1, 0.7); prop("paper", -0.1, { write: 1 }, 0.7, "linear"); A("ast", -0.1, "look", { to: [0.2, -0.4], dur: 0.05 });
for (let u = 0; u < 0.6; u += 0.15) A("ast", u, "squash", { amount: 0.04, dur: 0.15 });   // the whole body buzzes with it
A("ast", 0.65, "arm", { side: "R", pose: "up", dur: 0.15 }); A("ast", 0.7, "squash", { amount: -0.06, dur: 0.2 });
A("ast", 0.85, "arm", { side: "R", pose: "wave", dur: 0.15 });
prop("paper", 1.05, { stack: 3 }, 0.35, "out"); A("ast", 1.3, "squash", { amount: 0.08, dur: 0.18 }); sfx(1.05, "whoosh", { dur: 0.3, gain: 0.15 });
A("ast", 1.15, "arm", { side: "R", pose: "table", dur: 0.15 }); A("ast", 1.2, "look", { to: [0.2, -0.4], dur: 0.15 });
let free = leave("ast", 1.5);   // (the hook stays up to 1.0 s, so his name gets 0.75 s)
queue("rea", 0.9);

// ---- 2. Reaper: done in one second. One stroke, pencil down, stares at the teacher
t = free;
c.beat("rea", t, "done in one second: one stroke, then stares at the teacher", "done in one stroke");
let b = sitDown("rea", t); A("rea", b, "expr", { expr: "deadpan" });
A("rea", b + 0.25, "arm", { side: "R", pose: W1, dur: 0.06 }); prop("paper", b + 0.25, { write: 1 }, 0.12, "linear"); sfx(b + 0.25, "scribble", { dur: 0.15, gain: 0.2 });
A("rea", b + 0.4, "arm", { side: "R", pose: "lap", dur: 0.2 }); A("rea", b + 0.4, "arm", { side: "L", pose: "lap", dur: 0.2 });
A("rea", b + 0.5, "still", { dur: 0.45 }); A("rea", b + 0.8, "blink", { dur: 0.15 });
free = leave("rea", b + 1.05);
queue("sor", b + 0.75);

// ---- 3. Sorcerer: the cheater. A shifty look each way, then the answers float onto the page in green
t = free;
c.beat("sor", t, "cheats: a shifty look each way, the answers glow onto the page by magic", "the cheater");
b = sitDown("sor", t); A("sor", b, "expr", { expr: "evil" });
A("sor", b + 0.15, "look", { to: [-0.8, 0], dur: 0.12 }); A("sor", b + 0.4, "look", { to: [0.8, 0], dur: 0.15 }); A("sor", b + 0.65, "look", { to: [0, -0.4], dur: 0.12 });
A("sor", b + 0.7, "charge", { to: 1, dur: 0.15 }); A("sor", b + 0.7, "arm", { side: "L", pose: "cast", dur: 0.15 });
fx(b + 0.85, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.1, PAPER[2]], dur: 0.45, puffs: 2, sparks: 12, color: "#c9f7b0", spark: "#9dff6a" }); sfx(b + 0.85, "tink", { gain: 0.25 });
prop("paper", b + 0.85, { write: 1, magic: 1 }, 0.3, "linear");
A("sor", b + 1.15, "charge", { to: 0, dur: 0.15 }); A("sor", b + 1.15, "arm", { side: "L", pose: "table", dur: 0.15 }); A("sor", b + 1.2, "expr", { expr: "smug" }); A("sor", b + 1.2, "look", { to: [0, 0], dur: 0.15 });
free = leave("sor", b + 1.3);
queue("wiz", b + 0.9);

// ---- 4. Wizard: a spell to fill in the answers: the page goes up in a black ink splat
t = free;
c.beat("wiz", t, "a spell to answer the test goes wrong: an ink splat over the page", "the spell goes wrong");
b = sitDown("wiz", t); A("wiz", b, "expr", { expr: "stern" });
A("wiz", b + 0.2, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", b + 0.2, "charge", { to: 1, dur: 0.2 });
fx(b + 0.5, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.12, PAPER[2]], dur: 0.6, puffs: 7, sparks: 8, color: "#3a3550", spark: "#c8b6ff" }); sfx(b + 0.5, "poof", { gain: 0.3 });
prop("paper", b + 0.52, { blot: 1 }, 0.2, "out");
A("wiz", b + 0.55, "charge", { to: 0, dur: 0.15 }); A("wiz", b + 0.6, "expr", { expr: "shocked" }); A("wiz", b + 0.6, "squash", { amount: 0.1, dur: 0.2 });
A("wiz", b + 0.9, "arm", { side: "R", pose: "table", dur: 0.15 }); A("wiz", b + 0.95, "expr", { expr: "sad" }); A("wiz", b + 0.95, "droop", { to: 1, dur: 0.25 });
free = leave("wiz", b + 1.2); A("wiz", b + 1.2, "droop", { to: 0, dur: 0.2 });
queue("dra", b + 0.75);

// ---- 5. Dragon: the mind goes blank. Stares, his head steams, and a snort of fire burns the test to ash
t = free;
c.beat("dra", t, "his mind goes blank: his head steams, a snort of fire burns the test", "mind goes blank");
b = sitDown("dra", t); A("dra", b, "expr", { expr: "kind" }); A("dra", b + 0.1, "look", { to: [0, -0.45], dur: 0.15 });
A("dra", b + 0.35, "expr", { expr: "shocked" });
A("dra", b + 0.35, "look", { to: [0, 0.35], dur: 0.15 });   // eyes up and empty
for (const [k, dx] of [[0.45, -0.08], [0.65, 0.07], [0.85, -0.02]]) fx(b + k, { fx: "poof", pos: [DESK[0] + dx, 1.6, DESK[1]], dur: 0.6, puffs: 4, sparks: 0, color: "#ffffff" });
A("dra", b + 0.95, "squash", { amount: 0.12, dur: 0.15 });
fx(b + 1.05, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.1, PAPER[2]], dur: 0.5, puffs: 4, sparks: 14, color: "#ffc27a", spark: "#ff7a1a" }); fx(b + 1.05, { fx: "flash", dur: 0.15, peak: 0.3 }); fx(b + 1.05, { fx: "shake", dur: 0.25, amp: 0.03 }); sfx(b + 1.05, "whoosh", { dur: 0.35, gain: 0.25 });
prop("paper", b + 1.08, { burn: 1 }, 0.3, "out");
fx(b + 1.3, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.25, PAPER[2]], dur: 0.7, puffs: 3, sparks: 0, color: "#7b7b84" });
A("dra", b + 1.25, "expr", { expr: "sad" }); A("dra", b + 1.25, "look", { to: [0, 0], dur: 0.15 });
free = leave("dra", b + 1.45);
queue("phx", b + 0.9);

// ---- 6. Phoenix: spends the whole test on his name: big pink signature, a heart... and the bell goes
t = free;
c.beat("phx", t, "spends the whole test signing his name, then the bell goes", "signs his name");
b = sitDown("phx", t); A("phx", b, "expr", { expr: "cocky" }); A("phx", b + 0.05, "look", { to: [0, -0.4], dur: 0.15 });
const SW = [{ o: [-0.2, 0.36, 0.4] }, { o: [0.0, 0.3, 0.47] }, { o: [-0.16, 0.4, 0.43] }, { o: [0.02, 0.33, 0.45] }];
SW.forEach((p, i) => A("phx", b + 0.15 + i * 0.15, "arm", { side: "R", pose: p, dur: 0.15 }));
prop("paper", b + 0.15, { name: 1 }, 0.6, "inOut"); sfx(b + 0.15, "scribble", { dur: 0.6, gain: 0.2 });
fx(b + 0.8, { fx: "sparkle", who: "phx", dur: 0.5 }); A("phx", b + 0.8, "arm", { side: "R", pose: "table", dur: 0.15 }); A("phx", b + 0.8, "expr", { expr: "smug" });
prop("clock", b + 1.0, { time: 10.0 }, 0.1); sfx(b + 1.05, "bell", { dur: 0.7, gain: 0.3 });
A("phx", b + 1.1, "look", { to: [0.6, 0.6], dur: 0.12 }); A("phx", b + 1.15, "expr", { expr: "shocked" }); A("phx", b + 1.15, "wings", { to: 1, dur: 0.15 });
free = leave("phx", b + 1.35); A("phx", b + 1.35, "wings", { to: 0, dur: 0.2 }); A("phx", b + 1.35, "look", { to: [0, 0], dur: 0.12 });
prop("clock", b + 1.8, { time: 9.0 }, 0.3);   // (the next class)
queue("gun", b + 0.9);

// ---- 7. Gunslinger: multiple choice? He guesses every answer with a bullet
t = free;
c.beat("gun", t, "guesses every answer: shoots a hole through each one", "guesses everything");
b = sitDown("gun", t); A("gun", b, "expr", { expr: "stern" }); A("gun", b + 0.05, "look", { to: [0, -0.45], dur: 0.15 });
A("gun", b + 0.15, "arm", { side: "R", pose: { o: [-0.05, 0.42, 0.42] }, dur: 0.15 });
for (let i = 0; i < 6; i++) {
  const k = b + 0.35 + i * 0.12;
  fx(k, { fx: "flash", dur: 0.06, peak: 0.15 }); sfx(k, "impact", { gain: 0.25 });
  prop("paper", k, { holes: i + 1 }, 0.02); A("gun", k, "squash", { amount: 0.04, dur: 0.1 });
}
fx(b + 0.4, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.06, PAPER[2]], dur: 0.8, puffs: 3, sparks: 10, color: "#e9e4d8", spark: "#ffd34d" });
A("gun", b + 1.15, "arm", { side: "R", pose: "table", dur: 0.2 }); A("gun", b + 1.15, "expr", { expr: "smug" }); A("gun", b + 1.15, "look", { to: [0, 0], dur: 0.12 });
free = leave("gun", b + 1.3);
queue("sam", b + 0.85);

// ---- 8. Samurai: sharpens his pencil. And sharpens. And sharpens: three cuts, a stub left
t = free;
c.beat("sam", t, "sharpens his pencil the whole test: three cuts, a stub left", "sharpens the pencil");
b = sitDown("sam", t); A("sam", b, "expr", { expr: "serene" });
c.items.push({ who: "sam", do: "grab", prop: "pencil", hand: "L", at: r3(b + 0.1), dur: 0.2, off: [0, 0, 0.03] });
prop("pencil", b + 0.1, { roll: -20 }, 0.2);
A("sam", b + 0.15, "arm", { side: "L", pose: { o: [-0.02, 0.6, 0.38] }, dur: 0.2 }); A("sam", b + 0.2, "look", { to: [0.4, 0.15], dur: 0.15 });
for (const [i, l] of [[0, 0.66], [1, 0.36], [2, 0.08]]) {
  const k = b + 0.45 + i * 0.25;
  A("sam", k - 0.08, "arm", { side: "R", pose: "up", dur: 0.08 }); A("sam", k, "arm", { side: "R", pose: "point", dur: 0.08 });
  fx(k, { fx: "speedlines", dur: 0.12 }); sfx(k, "shing", { gain: 0.2 }); prop("pencil", k, { len: l }, 0.05);
  fx(k + 0.02, { fx: "poof", pos: [0.25, 1.0, DESK[1] + 0.35], dur: 0.45, puffs: 3, sparks: 10, color: "#ffd23f", spark: "#ffc83d" });
}
// the stub, held up to the lens: that's all that's left
A("sam", b + 1.05, "arm", { side: "L", pose: { o: [0.05, 0.55, 0.75] }, dur: 0.15 }); A("sam", b + 1.05, "look", { to: [0, 0], dur: 0.12 }); A("sam", b + 1.1, "expr", { expr: "shocked" });
A("sam", b + 1.1, "arm", { side: "R", pose: "table", dur: 0.2 });
A("sam", b + 1.45, "expr", { expr: "serene" }); A("sam", b + 1.45, "arm", { side: "L", pose: "table", dur: 0.15 });
c.items.push({ who: "sam", do: "release", prop: "pencil", at: r3(b + 1.55), dur: 0.2, to: [0.3, TOP + 0.012, -0.42] });
prop("pencil", b + 1.55, { roll: -90 }, 0.2);
free = leave("sam", b + 1.65);
fx(b + 2.05, { fx: "poof", pos: [0.3, TOP + 0.05, -0.42], dur: 0.4, puffs: 3, sparks: 4 }); prop("pencil", b + 2.07, { len: 1 }, 0.1);   // a new pencil
queue("all", b + 1.0);

// ---- 9. Allfather: the clock-watcher. Glares at the clock, and a lightning bolt sends its hands racing: bell
t = free;
c.beat("all", t, "watches the clock: one lightning bolt and the hands race to the bell", "watches the clock");
b = sitDown("all", t); A("all", b, "expr", { expr: "stern" });
A("all", b + 0.1, "look", { to: [0.6, 0.7], dur: 0.2 }); A("all", b + 0.35, "arm", { side: "R", pose: "point", dur: 0.15 });
prop("bolt", b + 0.55, { on: 1 }, 0.01); prop("bolt", b + 0.72, { on: 0 }, 0.01);
fx(b + 0.55, { fx: "flash", dur: 0.15, peak: 0.3 }); sfx(b + 0.55, "impact", { gain: 0.4 }); fx(b + 0.55, { fx: "shake", dur: 0.2, amp: 0.03 });
prop("clock", b + 0.6, { time: 10.0 }, 0.35, "in"); sfx(b + 0.95, "bell", { dur: 0.8, gain: 0.3 });
A("all", b + 0.95, "expr", { expr: "delighted" }); A("all", b + 0.95, "look", { to: [0, 0], dur: 0.15 }); A("all", b + 1.0, "arm", { side: "both", pose: "up", dur: 0.15 });
free = leave("all", b + 1.3);
prop("clock", b + 1.7, { time: 9.0 }, 0.3);
queue("vik", b + 0.85);

// ---- 10. Viking: rubs out one mistake... so hard the paper rips and the desk snaps in two
t = free;
c.beat("vik", t, "rubs out one mistake so hard the paper rips and the desk snaps in two", "rubs out a mistake");
b = sitDown("vik", t); A("vik", b, "expr", { expr: "kind" }); A("vik", b + 0.05, "look", { to: [0, -0.45], dur: 0.15 });
prop("paper", b + 0.1, { write: 1 }, 0.01);
A("vik", b + 0.25, "expr", { expr: "stern" });
for (let u = 0; u < 0.5; u += 0.1) A("vik", b + 0.3 + u, "arm", { side: "R", pose: Math.round(u / 0.1) % 2 ? W2 : W1, dur: u ? 0.1 : 0.15 });
fx(b + 0.3, { fx: "shake", dur: 0.5, amp: 0.02 }); sfx(b + 0.3, "scribble", { dur: 0.5, gain: 0.3 });
fx(b + 0.5, { fx: "poof", pos: [PAPER[0], PAPER[1] + 0.06, PAPER[2]], dur: 0.5, puffs: 3, sparks: 6, color: "#f4a3b8", spark: "#ffd34d" });
prop("paper", b + 0.8, { split: 1 }, 0.15, "out"); prop("desk", b + 0.82, { smash: 1 }, 0.12, "in"); prop("paper", b + 0.82, { y: TOP - 0.25 }, 0.12, "in");
prop("pencil", b + 0.82, { y: 0.02, roll: -90 }, 0.15, "in");
fx(b + 0.85, { fx: "shake", dur: 0.3, amp: 0.05 }); sfx(b + 0.82, "impact", { gain: 0.45 }); sfx(b + 0.85, "creak", { dur: 0.3, gain: 0.25 });
fx(b + 0.9, { fx: "poof", pos: [0, 0.35, DESK[1] + 0.45], dur: 0.7, puffs: 8, sparks: 10, color: "#e9dcc8", spark: "#ffe08a" });
A("vik", b + 1.05, "arm", { side: "R", pose: "lap", dur: 0.2 }); A("vik", b + 1.05, "arm", { side: "L", pose: "lap", dur: 0.2 });
A("vik", b + 1.1, "expr", { expr: "smug" }); A("vik", b + 1.1, "look", { to: [0, 0], dur: 0.15 });
const vikOut = b + 1.45;
c.clipOk("vik", "paper", b, b + 3); c.clipOk("vik", "pencil", b, b + 3);

// ---- the loop: the Viking is gone in a poof with the wreck, a new desk; the Astronaut sits and scribbles: frame 0
const fresh = vikOut + 0.3;
queue("ast", vikOut - 0.6);
A("ast", vikOut - 0.7, "move", { to: ENTER, dur: 0.01 }); A("ast", vikOut - 0.7, "expr", { expr: "delighted" });
fx(fresh, { fx: "poof", pos: [0, 0.6, DESK[1] + 0.2], dur: 0.6, puffs: 10, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop("desk", fresh + 0.08, { smash: 0 }, 0); prop("pencil", fresh + 0.08, { y: TOP + 0.012 }, 0);
prop("paper", fresh + 0.08, { scale: 0 }, 0);
const astIn = sitDown("ast", fresh + 0.2);
const end = astIn + 0.6;
A("ast", astIn, "look", { to: [0, 0], dur: 0.12 }); A("ast", astIn + 0.05, "blink", { dur: 0.15 });   // a glance at the viewer
A("ast", end - 0.3, "look", { to: [0.2, -0.4], dur: 0.15 });
scribble("ast", end - 0.3, 0.3); prop("paper", end - 0.3, { write: 0.3 }, 0.3, "linear");

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 1.3, 3.3], look: [0, 1.12, -1.0], fov: 40 },
  title: "TEST", hook: "1 test. 10 fighters.", hookTo: 1.0, askAt: b + 1.3, cover: t + 0.95,
  file: new URL("./test-01-school-test.json", import.meta.url),
});
