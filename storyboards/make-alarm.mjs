// ALARM: "how each fighter wakes up", the "same task, each fighter their own way" format (Jonny's rules, 2026-10-24):
// one bedroom, one bed, one alarm clock. Each fighter dives into the bed, the alarm goes off, and they deal with it the
// way a type of real person does (habits from docs/each-activities.md), in their signature way. One continuous take.
// Frame 0 is the Astronaut bursting awake as the alarm rings; the last frame sets that up again.
//   node storyboards/make-alarm.mjs   ->  storyboards/alarm-01-wake-up.json
import { clip, r3 } from "./each-lib.mjs";

// the room is mirrored (flip): the nightstand and clock at the left, where the fighters' weapon hands reach; the next
// fighter waits at the right, and each leaves to the left
const BED = [0, -1.6], NIGHT = [-0.88, -1.75], CLOCK = [-0.88, 0.5, -1.72], CS = 2;   // CS: the alarm clock's scale
const WAIT = [1.05, -1.0], ENTER = [2.8, -0.75], OUT = [-0.75, -0.75], EXIT = [-2.9, -0.75];
const c = clip({
  id: "alarm-01-wake-up", title: "ALARM: how each fighter wakes up",
  format: "each-character-vs-X, one continuous take: fighters take turns in one bed, the alarm rings, each wakes up their own way",
  set: { type: "bedroom", flip: true },
  props: [
    { id: "bed", kind: "bed", x: BED[0], z: BED[1], cover: 1 },
    { id: "night", kind: "nightstand", x: NIGHT[0], z: NIGHT[1] },
    { id: "alarm", kind: "alarm", x: CLOCK[0], y: CLOCK[1], z: CLOCK[2], scale: CS, rot: 20 },
    { id: "clock", kind: "clock", x: 1.0, y: 1.65, z: -2.3, scale: 0.8, time: 6 },   // 6:00 on the wall
    { id: "curtains", kind: "curtains", x: 0, y: 1.55, z: -2.27 },
    { id: "phone", kind: "phone", x: 2.9, y: 0.5, z: -0.75, glow: 1, scale: 0 },
    // the Wizard's spell: four more alarm clocks (hidden until it goes wrong)
    ...[[0.55, 0.42, -1.25, -25], [-0.45, 0.42, -0.9, 30], [0.3, 0.42, -0.45, -10], [-0.95, 0.95, -2.0, 15]].map(([x, y, z, rot], i) => ({ id: `extra${i}`, kind: "alarm", x, y, z, rot, scale: 0 })),
  ],
});
const { A, prop, fx, sfx, walk } = c;

// ---- pieces every turn uses
const ring = (t, on = 1, len = 0.4) => { prop("alarm", t, { ring: on }, 0.04); if (on) sfx(t, "ring", { dur: len, gain: 0.22 }); };
const intoBed = (who, t) => {   // a dive from the queue spot into bed, the blanket pulled up
  A(who, t, "sit", { seat: "bed", dur: 0.35 }); A(who, t, "turn", { to: "camera", dur: 0.15 });
  prop("bed", t + 0.2, { cover: 1 }, 0.2); sfx(t + 0.3, "land", { gain: 0.25 });
  return t + 0.35;
};
const outOfBed = (who, t, { to = EXIT, dur = 0.5 } = {}) => {   // a hop out to the left, and off
  prop("bed", t, { cover: 0 }, 0.15);
  const h = Math.ceil((t + 0.05) * 30) / 30;   // the hop's crouch starts on a frame (it lasts two)
  A(who, t, "stand", { dur: 0.2 }); A(who, h, "hop", { height: 0.2, dur: 0.3 }); walk(who, t + 0.05, OUT, 0.3, "inOut", 2);
  A(who, t + 0.3, "turn", { to: "left", dur: 0.15 }); walk(who, t + 0.35, to, dur, "linear"); A(who, t + 0.35 + dur, "hide");
  return t + 0.2;   // the bed is free
};
const queue = (who, t, at = WAIT) => { A(who, t, "show"); A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, at, 0.5); A(who, t + 0.45, "turn", { to: "camera", dur: 0.15 }); };
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "sam", "all", "vik"];
c.cast("ast", BED, { expr: "delighted" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
c.A("ast", -0.1, "sit", { seat: "bed", dur: 0.05 });
for (const id of order) c.clipOk(id, "bed");

// ---- 1. Astronaut: the morning person. The alarm rings and he's up and out, a zero-g flip, off he floats
let t = 0;
c.beat("ast", 0, "the morning person: up the moment it rings, a zero-g flip out of bed", "the morning person");
// frame 0 is mid-burst: arms half up, the blanket going, the clock rattling (the last frame matches)
ring(-0.1, 1); sfx(0, "ring", { dur: 0.5, gain: 0.22 });
A("ast", -0.1, "arm", { side: "both", pose: "up", dur: 0.2 });
prop("bed", -0.05, { cover: 0 }, 0.15);
A("ast", 0.2, "fly", { to: { y: 0.55, z: BED[1] + 0.3 }, dur: 0.35 }); A("ast", 0.3, "pitch", { to: -360, dur: 0.5 });
A("ast", 0.45, "arm", { side: "R", pose: "point", dur: 0.12 }); ring(0.55, 0);   // a tap on the clock in passing
A("ast", 0.85, "turn", { to: "left", dur: 0.15 }); A("ast", 0.85, "arm", { side: "both", pose: "rest", dur: 0.2 });
A("ast", 0.9, "fly", { to: { x: EXIT[0], y: 0.7, z: -0.45 }, dur: 0.6, ease: "in" }); A("ast", 1.5, "hide");
queue("rea", 0.6);

// ---- 2. Reaper: awake before the alarm, staring at it; it rings for one tick and he's already pressed it
t = 1.4;   // (the Astronaut's name and habit get 0.7 s on screen after the hook)
c.beat("rea", t, "wakes up before the alarm: lies there staring at it, stops it on the first ring", "awake before it rings");
let b = intoBed("rea", t);
A("rea", b, "expr", { expr: "deadpan" }); A("rea", b, "look", { to: [-0.8, -0.1], dur: 0.15 });
A("rea", b + 0.15, "still", { dur: 0.45 });
A("rea", b + 0.55, "arm", { side: "R", pose: "point", dur: 0.18 }); ring(b + 0.65, 1, 0.08); ring(b + 0.73, 0);
A("rea", b + 0.95, "look", { to: [0, 0], dur: 0.15 }); A("rea", b + 1.0, "arm", { side: "R", pose: "rest", dur: 0.2 });
A("rea", b + 1.05, "blink", { dur: 0.15 });
let free = outOfBed("rea", b + 1.3);
queue("sor", b + 0.6);

// ---- 3. Sorcerer: the snoozer. Rings, a zap from the orb without opening his eyes; rings again, zap again
t = free;
c.beat("sor", t, "the snoozer: zaps the snooze button from his pillow, twice, without opening his eyes", "snoozes forever");
b = intoBed("sor", t); A("sor", b, "expr", { expr: "serene" });
for (const [k, d] of [[0.3, 0], [0.85, 0]]) {
  ring(b + k, 1, 0.3); A("sor", b + k + 0.08, "arm", { side: "L", pose: "cast", dur: 0.12 }); A("sor", b + k + 0.08, "charge", { to: 1, dur: 0.1 });
  fx(b + k + 0.2, { fx: "poof", pos: [CLOCK[0], CLOCK[1] + 0.2, CLOCK[2]], dur: 0.35, puffs: 2, sparks: 8, color: "#c9f7b0", spark: "#9dff6a" }); sfx(b + k + 0.2, "tink", { gain: 0.2 });
  ring(b + k + 0.22, 0); A("sor", b + k + 0.3, "arm", { side: "L", pose: "rest", dur: 0.15 }); A("sor", b + k + 0.3, "charge", { to: 0, dur: 0.15 });
}
A("sor", b + 1.25, "expr", { expr: "smug" });
fx(b + 1.15, { fx: "zzz", who: "sor", dur: 0.6, count: 2 });
free = outOfBed("sor", b + 1.35);
queue("wiz", b + 0.9);

// ---- 4. Wizard: a spell to shut it up... and four more alarm clocks ring all round the bed
t = free;
c.beat("wiz", t, "a spell to stop the alarm goes wrong: four more alarm clocks", "the spell goes wrong");
b = intoBed("wiz", t); A("wiz", b, "expr", { expr: "serene" });
ring(b + 0.25, 1, 1.2);
A("wiz", b + 0.35, "expr", { expr: "stern" }); A("wiz", b + 0.4, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", b + 0.4, "charge", { to: 1, dur: 0.2 });
fx(b + 0.65, { fx: "poof", pos: [-0.1, 0.6, -1.1], dur: 0.5, puffs: 8, sparks: 12, spark: "#c8b6ff" }); sfx(b + 0.65, "poof", { gain: 0.3 });
for (let i = 0; i < 4; i++) { prop(`extra${i}`, b + 0.68 + i * 0.04, { scale: 1.2, ring: 1 }, 0.15, "out"); }
sfx(b + 0.7, "ring", { dur: 0.8, gain: 0.25, pan: -0.4 }); sfx(b + 0.72, "ring", { dur: 0.8, gain: 0.25, pan: 0.4 });
A("wiz", b + 0.7, "charge", { to: 0, dur: 0.15 }); A("wiz", b + 0.75, "expr", { expr: "shocked" });
A("wiz", b + 0.95, "arm", { side: "both", pose: "cheeks", dur: 0.15 }); A("wiz", b + 1.0, "expr", { expr: "sad" }); A("wiz", b + 1.0, "droop", { to: 1, dur: 0.25 });
// a second try poofs them all away, then off he trudges
A("wiz", b + 1.2, "arm", { side: "R", pose: "cast", dur: 0.12 });
fx(b + 1.3, { fx: "poof", pos: [-0.1, 0.5, -1.1], dur: 0.5, puffs: 8, sparks: 6, spark: "#c8b6ff" }); sfx(b + 1.3, "poof", { gain: 0.25 });
for (let i = 0; i < 4; i++) prop(`extra${i}`, b + 1.32, { scale: 0, ring: 0 }, 0.15, "in");
ring(b + 1.32, 0);
A("wiz", b + 1.45, "arm", { side: "both", pose: "rest", dur: 0.15 }); A("wiz", b + 1.45, "droop", { to: 0, dur: 0.2 });
free = outOfBed("wiz", b + 1.55);
queue("dra", b + 0.9);

// ---- 5. Dragon: five more minutes. Under the blanket; it keeps ringing; a puff of fire from under it shuts it up
t = free;
c.beat("dra", t, "five more minutes: dives under the blanket, a puff of fire from under it shuts the alarm up", "five more minutes");
b = intoBed("dra", t); A("dra", b, "expr", { expr: "serene" });
ring(b + 0.25, 1, 1.0);
A("dra", b + 0.35, "expr", { expr: "stern" }); prop("bed", b + 0.45, { over: 1 }, 0.2, "out"); A("dra", b + 0.6, "hide");
for (const [k, o] of [[0.7, 0.92], [0.85, 1.04], [1.0, 0.95], [1.15, 1]]) prop("bed", b + k, { over: o }, 0.15);
fx(b + 1.2, { fx: "poof", pos: [CLOCK[0] + 0.1, CLOCK[1] + 0.1, CLOCK[2] + 0.05], dur: 0.5, puffs: 4, sparks: 12, color: "#ffc27a", spark: "#ff7a1a" });
sfx(b + 1.2, "whoosh", { dur: 0.35, gain: 0.25 }); ring(b + 1.25, 0);
fx(b + 1.3, { fx: "poof", pos: [0.0, 0.9, -1.4], dur: 0.8, puffs: 4, sparks: 0, color: "#9a9aa2" });
fx(b + 1.35, { fx: "zzz", who: "dra", dur: 0.7, count: 2 });
A("dra", b + 1.6, "show"); prop("bed", b + 1.6, { over: 0 }, 0.15); A("dra", b + 1.6, "expr", { expr: "smug" });
free = outOfBed("dra", b + 1.75);
const phxIn = b + 1.2;
queue("phx", phxIn);

// ---- 6. Phoenix: on his phone in bed while it rings; sees the time, panics, flies off (the phone still in his hand)
t = free;
c.beat("phx", t, "scrolls his phone in bed while it rings; sees the time and panics", "scrolling in bed");
// he comes in already on his phone (it waits off screen by his entrance)
prop("phone", phxIn - 0.05, { scale: 1.5 }, 0);
c.items.push({ who: "phx", do: "grab", prop: "phone", hand: "R", at: r3(phxIn), dur: 0.05, off: [0.0, 0.0, 0.03] });
const FACE = { o: [-0.05, 0.75, 0.3] }, FLICK = { o: [-0.03, 0.79, 0.3] };   // the phone in front of his face; a thumb flick
A("phx", phxIn + 0.05, "arm", { side: "R", pose: FACE, dur: 0.3 }); A("phx", phxIn + 0.1, "look", { to: [-0.1, -0.3], dur: 0.2 });
b = intoBed("phx", t); A("phx", b, "expr", { expr: "cocky" }); A("phx", b, "arm", { side: "R", pose: FACE, dur: 0.15 });
ring(b + 0.2, 1, 1.0);
for (const k of [0.25, 0.45, 0.65]) { A("phx", b + k, "arm", { side: "R", pose: FLICK, dur: 0.08 }); A("phx", b + k + 0.08, "arm", { side: "R", pose: FACE, dur: 0.1 }); }
A("phx", b + 0.82, "look", { to: [-0.8, -0.1], dur: 0.1 }); A("phx", b + 0.85, "expr", { expr: "shocked" }); A("phx", b + 0.85, "squash", { amount: 0.1, dur: 0.18 });
A("phx", b + 1.0, "arm", { side: "both", pose: "up", dur: 0.12 }); A("phx", b + 1.0, "wings", { to: 1, dur: 0.12 });
prop("bed", b + 1.05, { cover: 0 }, 0.15); A("phx", b + 1.05, "turn", { to: "left", dur: 0.12 });
A("phx", b + 1.05, "fly", { to: { x: -0.1, y: 0.7, z: -1.0 }, dur: 0.2, ease: "out" });   // up first, clear of the clock
A("phx", b + 1.25, "fly", { to: { x: EXIT[0], y: 0.7, z: -0.5 }, dur: 0.45, ease: "in" }); A("phx", b + 1.7, "hide");
fx(b + 1.1, { fx: "speedlines", dur: 0.3 }); sfx(b + 1.05, "whoosh", { dur: 0.4, gain: 0.25 }); ring(b + 1.25, 0);
prop("phone", b + 1.72, { scale: 0 }, 0);   // he takes it with him (off screen by then)
free = b + 1.35;   // the Phoenix is clear of the bed
queue("gun", b + 0.6);

// ---- 7. Gunslinger: shoots the alarm clock off the nightstand
t = free;
c.beat("gun", t, "wants to destroy the alarm: shoots it off the nightstand", "wants to destroy it");
b = intoBed("gun", t); A("gun", b, "expr", { expr: "serene" });
ring(b + 0.2, 1, 0.6);
A("gun", b + 0.3, "expr", { expr: "stern" }); A("gun", b + 0.35, "look", { to: [-0.8, -0.1], dur: 0.1 });
A("gun", b + 0.45, "arm", { side: "R", pose: "point", dur: 0.12 });
fx(b + 0.65, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.65, "impact", { gain: 0.35 });
fx(b + 0.66, { fx: "poof", pos: [CLOCK[0], CLOCK[1] + 0.2, CLOCK[2]], dur: 0.45, puffs: 2, sparks: 10, spark: "#ffd34d" });
ring(b + 0.66, 0);
prop("alarm", b + 0.66, { x: CLOCK[0] - 0.35, y: CLOCK[1] + 0.4, roll: 300 }, 0.25, "out"); prop("alarm", b + 0.91, { x: CLOCK[0] - 0.6, y: 0, roll: 540 }, 0.25, "in");
sfx(b + 1.16, "land", { gain: 0.3 });
A("gun", b + 0.9, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("gun", b + 0.95, "expr", { expr: "smug" }); A("gun", b + 0.95, "look", { to: [0, 0], dur: 0.12 });
free = outOfBed("gun", b + 1.2);
fx(b + 1.35, { fx: "poof", pos: [CLOCK[0], CLOCK[1] + 0.15, CLOCK[2]], dur: 0.5, puffs: 5, sparks: 6, spark: "#ffe08a" });
prop("alarm", b + 1.38, { x: CLOCK[0], y: CLOCK[1], roll: 0, scale: 0 }, 0); prop("alarm", b + 1.4, { scale: CS }, 0.2, "out");   // a new one
queue("sam", b + 0.65);

// ---- 8. Samurai: switches it off in his sleep: one cut, eyes still shut, and back to sleep
t = free;
c.beat("sam", t, "turns it off in his sleep: one cut without opening his eyes, sleeps on", "turns it off asleep");
b = intoBed("sam", t); A("sam", b, "expr", { expr: "serene" });
ring(b + 0.25, 1, 0.4);
A("sam", b + 0.4, "arm", { side: "R", pose: "up", dur: 0.12 }); A("sam", b + 0.55, "arm", { side: "R", pose: "point", dur: 0.12 });
fx(b + 0.6, { fx: "speedlines", dur: 0.15 }); fx(b + 0.62, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.62, "tink", { gain: 0.25 });
prop("alarm", b + 0.65, { split: 1 }, 0.3, "out"); ring(b + 0.64, 0);
A("sam", b + 0.85, "arm", { side: "R", pose: "rest", dur: 0.2 }); fx(b + 0.9, { fx: "zzz", who: "sam", dur: 0.6, count: 2 });
free = outOfBed("sam", b + 1.2);
fx(b + 1.35, { fx: "poof", pos: [CLOCK[0], CLOCK[1] + 0.15, CLOCK[2]], dur: 0.5, puffs: 5, sparks: 6, spark: "#ffe08a" });
prop("alarm", b + 1.38, { split: 0, scale: 0 }, 0); prop("alarm", b + 1.4, { scale: CS }, 0.2, "out");
queue("all", b + 0.65);

// ---- 9. Allfather: the dad who's up at once: turns round in bed and throws the curtains open: rise and shine
t = free;
c.beat("all", t, "the dad: up at once, throws the curtains open on everyone", "rise and shine");
b = intoBed("all", t); A("all", b, "expr", { expr: "stern" });
ring(b + 0.15, 1, 0.15); A("all", b + 0.15, "arm", { side: "R", pose: "point", dur: 0.12 }); ring(b + 0.27, 0);
A("all", b + 0.35, "expr", { expr: "delighted" }); A("all", b + 0.35, "arm", { side: "R", pose: "rest", dur: 0.12 });
A("all", b + 0.4, "turn", { to: "back", dur: 0.25 }); A("all", b + 0.55, "arm", { side: "both", pose: "up", dur: 0.15 });
prop("curtains", b + 0.75, { open: 1 }, 0.25, "out");
fx(b + 0.8, { fx: "flash", dur: 0.2, peak: 0.12 }); sfx(b + 0.8, "sting", { gain: 0.2 });
A("all", b + 0.95, "turn", { to: "camera", dur: 0.25 }); A("all", b + 1.0, "arm", { side: "both", pose: "hips", dur: 0.2 });
free = outOfBed("all", b + 1.5);
queue("vik", b + 0.9);

// ---- 10. Viking: hits snooze so hard the clock, the nightstand and the bed all go, and sleeps on in the wreck
t = free;
c.beat("vik", t, "hits snooze HARD: smashes the clock, the nightstand and the bed, sleeps on", "hits snooze hard");
b = intoBed("vik", t); A("vik", b, "expr", { expr: "serene" }); fx(b + 0.05, { fx: "zzz", who: "vik", dur: 0.5, count: 2 });
ring(b + 0.3, 1, 0.45);
A("vik", b + 0.4, "expr", { expr: "stern" }); A("vik", b + 0.45, "arm", { side: "R", pose: "up", dur: 0.15 });
A("vik", b + 0.7, "arm", { side: "R", pose: "table", dur: 0.08 });
prop("alarm", b + 0.75, { smash: 1 }, 0.08, "out"); prop("night", b + 0.75, { smash: 1 }, 0.1, "out"); ring(b + 0.75, 0);
prop("bed", b + 0.8, { smash: 1 }, 0.15, "in"); A("vik", b + 0.8, "move", { to: [BED[0], BED[1] + 0.03], dur: 0.15 });
fx(b + 0.8, { fx: "shake", dur: 0.3, amp: 0.05 }); sfx(b + 0.75, "impact", { gain: 0.45 });
fx(b + 0.85, { fx: "poof", pos: [-0.4, 0.2, -1.4], dur: 0.7, puffs: 8, sparks: 10, color: "#e9dcc8", spark: "#ffe08a" });
A("vik", b + 0.95, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("vik", b + 1.05, "expr", { expr: "serene" });
fx(b + 1.1, { fx: "zzz", who: "vik", dur: 0.9, count: 3 });
const vikOut = b + 1.3;   // the Astronaut walks in while he snores on in the wreck; the reset poof takes him away
c.clipOk("vik", "night", b, b + 3);

// ---- the loop: a fresh bed, nightstand and clock poof in; the Astronaut dives in; the alarm rings: frame 0
const fresh = b + 2.05;
fx(b + 1.8, { fx: "zzz", who: "vik", dur: 0.6, count: 2 }); A("vik", fresh + 0.08, "hide");
fx(fresh, { fx: "poof", pos: [-0.3, 0.4, -1.3], dur: 0.6, puffs: 10, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
for (const id of ["bed", "night", "alarm"]) prop(id, fresh + 0.08, { smash: 0 }, 0);
prop("bed", fresh + 0.08, { cover: 0 }, 0);
prop("curtains", fresh - 0.4, { open: 0 }, 0.5);
A("ast", vikOut - 0.1, "drop", { to: 0, dur: 0.02 }); A("ast", vikOut - 0.1, "move", { to: ENTER, dur: 0.01 }); A("ast", vikOut - 0.1, "pitch", { to: 0, dur: 0.01 });
A("ast", vikOut - 0.1, "turn", { to: "left", dur: 0.01 }); A("ast", vikOut - 0.1, "expr", { expr: "serene" });
A("ast", vikOut, "show"); walk("ast", vikOut, WAIT, 0.45);
const astIn = intoBed("ast", fresh + 0.15);
const end = astIn + 0.2;
ring(end - 0.1, 1); sfx(end - 0.1, "ring", { dur: 0.1, gain: 0.22 }); A("ast", end - 0.1, "expr", { expr: "delighted", dur: 0.08 });
A("ast", end - 0.1, "arm", { side: "both", pose: "up", dur: 0.2 }); prop("bed", end - 0.05, { cover: 0 }, 0.15);

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 1.1, 4.3], look: [0, 0.95, -1.5], fov: 38 },
  title: "ALARM", hook: "1 alarm. 10 fighters.", hookTo: 0.7, askAt: b + 1.5, cover: t + 0.85,
  file: new URL("./alarm-01-wake-up.json", import.meta.url),
});
