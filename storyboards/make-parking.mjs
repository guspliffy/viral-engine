// PARKING: "how each fighter parallel parks", the "same task, each fighter their own way" format (Jonny's rules,
// 2026-10-24): one street, one gap between two parked cars, one little open-top car per turn. Each fighter drives up,
// stops beside the front car and parks the way a type of real driver does (docs/each-activities.md), in their
// signature way. One continuous take from the pavement. Frame 0 is the Astronaut rolling up to the gap; the last frame
// sets that up again.
//   node storyboards/make-parking.mjs   ->  storyboards/parking-01-parallel.json
import { clip } from "./each-lib.mjs";

const LANE = -2.7, SPOT = [0, -1.7], STOP = -0.8, IN = 4.8, AWAY = -4.8;
const A_AT = [-1.85, -1.7], B_AT = [1.85, -1.7];   // the parked cars in front of (left) and behind (right) the gap
const RIDE = { off: [0, 0.37, -0.12], yaw: 60, sit: true };   // the driver on the seat, turned three quarters to the camera
const COLORS = ["#e85d4f", "#f2b51f"];
const c = clip({
  id: "parking-01-parallel", title: "PARKING: how each fighter parallel parks",
  format: "each-character-vs-X, one continuous take: fighters take turns parking one little car in one gap between two parked cars",
  set: { type: "street", parking: true },
  props: [
    { id: "carA", kind: "car", x: A_AT[0], z: A_AT[1], rot: -90, color: "#4f86cf" },
    { id: "carB", kind: "car", x: B_AT[0], z: B_AT[1], rot: -90, color: "#5cbf55" },
    ...COLORS.map((color, i) => ({ id: `c${i}`, kind: "car", x: IN, z: LANE, rot: -90, color })),
  ],
});
const { A, prop, fx, sfx } = c;
const RESET = { split: 0, chop: 0, smash: 0, tiny: 0, bump: 0, y: 0 };

// ---- pieces every turn uses
let n = 0;
const arrive = (who, t, from = IN) => {   // this fighter's car rolls in along the lane and stops beside the front car
  const car = `c${n++ % 2}`;
  prop(car, t - 0.03, { ...RESET, x: from, z: LANE, rot: -90 }, 0);
  A(who, t - 0.02, "show"); A(who, t - 0.02, "ride", { prop: car, ...RIDE, dur: 0.01 });
  A(who, t - 0.02, "arm", { side: "both", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.01 });   // hands on the wheel
  prop(car, t, { x: STOP }, 0.6, "out"); sfx(t, "whoosh", { dur: 0.5, gain: 0.12 });
  c.clipOk(who, car);
  return { car, t: t + 0.6 };
};
const reverseIn = (car, t, { to = SPOT, dur = 0.7 } = {}) => {   // the textbook move: back in at an angle, then straighten
  prop(car, t, { x: (STOP + to[0]) / 2 + 0.25, z: (LANE + to[1]) / 2, rot: -58 }, dur / 2, "in");
  prop(car, t + dur / 2, { x: to[0], z: to[1], rot: -90 }, dur / 2, "out");
  return t + dur;
};
const leave = (who, car, t) => {   // pull out to the left and away along the lane
  prop(car, t, { x: SPOT[0] - 0.8, z: LANE + 0.25, rot: -115 }, 0.35, "in");
  prop(car, t + 0.35, { x: AWAY, z: LANE, rot: -90 }, 0.5, "linear"); sfx(t, "whoosh", { dur: 0.6, gain: 0.12 });
  A(who, t + 0.86, "hide");
  return t + 0.1;   // when the next car may start rolling in
};
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "sam", "all", "vik"];
for (const id of order) c.cast(id, [IN, LANE + 0.6], { hidden: id !== "ast" });
c.clipOk("carA", "carB");

// ---- 1. Astronaut: the pro. One smooth move, perfectly straight, a thumbs-up
// (frame 0: his car rolling up to the gap, already almost there; the last frame matches)
let a = { car: "c0", t: 0.15 }; n = 1;
prop("c0", -0.1, { x: STOP + 0.12, z: LANE, rot: -90 }, 0);
prop("c0", -0.1, { x: STOP }, 0.25, "out");
A("ast", -0.1, "ride", { prop: "c0", ...RIDE, dur: 0.01 }); A("ast", -0.1, "arm", { side: "both", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.01 }); A("ast", -0.1, "expr", { expr: "kind" });
c.clipOk("ast", "c0");
c.beat("ast", 0, "the pro: one smooth move, perfectly straight", "one smooth move");
let t = reverseIn("c0", a.t);
A("ast", t - 0.1, "expr", { expr: "delighted" }); A("ast", t, "arm", { side: "R", pose: "up", dur: 0.15 }); fx(t + 0.05, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(t + 0.05, "tink", { gain: 0.25 });
let next = leave("ast", "c0", t + 0.55);

// ---- 2. Reaper: parks by feel. Back till it bumps, forward till it bumps. Not a flicker on his face
a = arrive("rea", next); t = a.t;
c.beat("rea", t - 0.35, "parks by feel: bump the car behind, bump the car in front, done", "parks by feel");
A("rea", t - 0.3, "expr", { expr: "deadpan" });
t = reverseIn(a.car, t, { to: [SPOT[0] + 0.28, SPOT[1]], dur: 0.6 });
const bonk = (t, car, x) => {   // a loud bump: both cars rock, a puff at the contact, a shake
  prop(car, t, { bump: 1 }, 0.05); prop(car, t + 0.3, { bump: 0 }, 0.12); sfx(t, "impact", { gain: 0.35 }); fx(t, { fx: "shake", dur: 0.2, amp: 0.04 });
  fx(t, { fx: "poof", pos: [x, 0.3, SPOT[1]], dur: 0.4, puffs: 2, sparks: 6, color: "#e9e4d8", spark: "#ffe08a" });
};
bonk(t, "carB", 1.0); bonk(t, a.car, 1.0);
prop(a.car, t + 0.15, { x: SPOT[0] - 0.3 }, 0.3, "in"); bonk(t + 0.45, "carA", -1.0); bonk(t + 0.45, a.car, -1.0);
prop(a.car, t + 0.5, { x: SPOT[0] }, 0.25, "out"); A("rea", t + 0.85, "blink", { dur: 0.15 });
next = leave("rea", a.car, t + 1.1);

// ---- 3. Sorcerer: doesn't steer at all. The car floats up and slides sideways into the gap
a = arrive("sor", next); t = a.t;
c.beat("sor", t - 0.35, "doesn't bother steering: floats the car sideways into the gap", "floats it in");
A("sor", t, "expr", { expr: "smug" }); A("sor", t, "arm", { side: "L", pose: "cast", dur: 0.15 }); A("sor", t, "charge", { to: 1, dur: 0.15 });
fx(t + 0.1, { fx: "poof", pos: [STOP, 0.3, LANE], dur: 0.5, puffs: 3, sparks: 12, color: "#c9f7b0", spark: "#9dff6a" }); sfx(t + 0.1, "charge", { dur: 0.7, gain: 0.2 });
prop(a.car, t + 0.1, { y: 0.3 }, 0.25, "out"); prop(a.car, t + 0.3, { x: SPOT[0], z: SPOT[1] }, 0.45, "inOut"); prop(a.car, t + 0.75, { y: 0 }, 0.2, "in");
sfx(t + 0.95, "land", { gain: 0.3 }); A("sor", t + 0.95, "charge", { to: 0, dur: 0.15 }); A("sor", t + 0.95, "arm", { side: "L", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 });
next = leave("sor", a.car, t + 1.3);

// ---- 4. Wizard: a parking spell... shrinks the car to a toy. He trundles in on it anyway
a = arrive("wiz", next); t = a.t;
c.beat("wiz", t - 0.35, "a parking spell shrinks the car to a toy; he trundles in on it", "the spell goes wrong");
A("wiz", t, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t, "charge", { to: 0.7, dur: 0.15 }); A("wiz", t, "expr", { expr: "stern" });
fx(t + 0.2, { fx: "poof", pos: [STOP, 0.4, LANE], dur: 0.5, puffs: 8, sparks: 10, spark: "#c8b6ff" }); sfx(t + 0.2, "poof", { gain: 0.3 });
prop(a.car, t + 0.22, { tiny: 1 }, 0.2, "out"); A("wiz", t + 0.3, "charge", { to: 0, dur: 0.15 }); A("wiz", t + 0.35, "expr", { expr: "shocked" });
A("wiz", t + 0.35, "arm", { side: "R", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 });
t = reverseIn(a.car, t + 0.55, { dur: 0.9 }); A("wiz", t - 0.3, "expr", { expr: "sad" }); A("wiz", t - 0.3, "droop", { to: 1, dur: 0.25 });
A("wiz", t + 0.2, "droop", { to: 0, dur: 0.2 });
next = leave("wiz", a.car, t + 0.25);

// ---- 5. Dragon: twenty tries. Back, forward, back, forward, still crooked; steam, then a fire snort
a = arrive("dra", next); t = a.t;
c.beat("dra", t - 0.35, "twenty tries: back and forth, still crooked, a fire snort", "twenty tries");
A("dra", t, "expr", { expr: "stern" });
const tries = [[0.6, -2.15, -65], [-0.6, -2.3, -115], [0.5, -1.95, -68]];
tries.forEach(([x, z, rot], i) => { prop(a.car, t + i * 0.4, { x: SPOT[0] + x, z, rot }, 0.35, "inOut"); fx(t + i * 0.4 + 0.35, { fx: "shake", dur: 0.1, amp: 0.03 }); sfx(t + i * 0.4 + 0.35, "screech", { dur: 0.2, gain: 0.12 }); });
fx(t + 0.35, { fx: "sweat", who: "dra", dur: 1.0, count: 6 });
t += tries.length * 0.4;
A("dra", t - 0.1, "squash", { amount: 0.1, dur: 0.15 }); A("dra", t, "expr", { expr: "sad" });
fx(t + 0.05, { fx: "poof", pos: [SPOT[0] + 0.85, 0.9, -1.35], dur: 0.45, puffs: 3, sparks: 12, color: "#ffc27a", spark: "#ff7a1a" }); sfx(t + 0.05, "whoosh", { dur: 0.3, gain: 0.25 });
next = leave("dra", a.car, t + 0.5);

// ---- 6. Phoenix: a metre from the kerb, crooked, and he's checking his hair
a = arrive("phx", next); t = a.t;
c.beat("phx", t - 0.35, "stops in the middle of the road, checks his look: parked", "parks in the road");
A("phx", t, "expr", { expr: "cocky" });
prop(a.car, t, { x: SPOT[0], z: LANE + 0.1, rot: -90 }, 0.5, "out"); t += 0.5;   // he doesn't even try: stops in the lane
A("phx", t, "arm", { side: "R", pose: "hat", dur: 0.15 }); A("phx", t, "look", { to: [0.4, 0.2], dur: 0.12 }); A("phx", t + 0.05, "expr", { expr: "smug" });
fx(t + 0.1, { fx: "sparkle", who: "phx", dur: 0.6 }); A("phx", t + 0.45, "arm", { side: "R", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 }); A("phx", t + 0.45, "look", { to: [0, 0], dur: 0.12 });
next = leave("phx", a.car, t + 0.7);

// ---- 7. Gunslinger: the gap's too small? He shoots the car in front, it rolls away, and he drives straight in
a = arrive("gun", next, IN); t = a.t;
c.beat("gun", t - 0.35, "the gap's too small: shoots the car in front so it rolls away, drives straight in", "makes space");
A("gun", t, "expr", { expr: "stern" }); A("gun", t, "ride", { prop: a.car, ...RIDE, yaw: 25, dur: 0.12 }); A("gun", t + 0.05, "arm", { side: "R", pose: "point", dur: 0.12 });
fx(t + 0.25, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.25, "impact", { gain: 0.35 });
fx(t + 0.27, { fx: "poof", pos: [A_AT[0] + 0.4, 0.4, A_AT[1]], dur: 0.4, puffs: 2, sparks: 10, spark: "#ffd34d" });
prop("carA", t + 0.3, { x: A_AT[0] - 2.0 }, 0.7, "in"); sfx(t + 0.3, "creak", { dur: 0.5, gain: 0.2 });
A("gun", t + 0.45, "arm", { side: "R", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 }); A("gun", t + 0.45, "ride", { prop: a.car, ...RIDE, dur: 0.15 });
prop(a.car, t + 0.45, { x: SPOT[0] - 0.2, z: SPOT[1], rot: -110 }, 0.35, "in"); prop(a.car, t + 0.8, { x: SPOT[0] - 0.5, rot: -90 }, 0.25, "out");
A("gun", t + 1.05, "expr", { expr: "smug" });
next = leave("gun", a.car, t + 1.35);

// ---- 8. Samurai: the car's too long? Then it's a shorter car now. One cut, and he backs in with room to spare
a = arrive("sam", next); t = a.t;
c.beat("sam", t - 0.35, "the car's too long: one cut takes the front off, then he backs in", "makes it fit");
A("sam", t, "expr", { expr: "serene" }); A("sam", t + 0.05, "arm", { side: "R", pose: "up", dur: 0.12 });
A("sam", t + 0.2, "arm", { side: "R", pose: "point", dur: 0.08 }); fx(t + 0.2, { fx: "speedlines", dur: 0.12 }); fx(t + 0.22, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.22, "shing", { gain: 0.25 });
prop(a.car, t + 0.25, { chop: 1 }, 0.35, "in"); sfx(t + 0.55, "land", { gain: 0.3 });
A("sam", t + 0.45, "arm", { side: "R", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 }); A("sam", t + 0.5, "expr", { expr: "kind" });
t = reverseIn(a.car, t + 0.65, { dur: 0.6 });
next = leave("sam", a.car, t + 0.3);
fx(t + 0.6, { fx: "poof", pos: [A_AT[0] + 0.5, 0.5, A_AT[1]], dur: 0.5, puffs: 6, sparks: 4 }); prop("carA", t + 0.65, { x: A_AT[0] }, 0);   // a new car in front

// ---- 9. Allfather: the dad reverse. Arm over the seat, looking back over his shoulder, in in one go
a = arrive("all", next); t = a.t;
c.beat("all", t - 0.35, "the dad reverse: arm over the seat, looks over his shoulder, in in one go", "the dad reverse");
A("all", t, "expr", { expr: "focused" }); A("all", t, "arm", { side: "L", pose: { o: [0.25, 0.55, -0.2] }, dur: 0.2 }); A("all", t, "look", { to: [0.9, 0.1], dur: 0.15 });
A("all", t, "ride", { prop: a.car, ...RIDE, yaw: 135, dur: 0.25 });   // turned round to look back past the camera
t = reverseIn(a.car, t + 0.15, { dur: 0.75 });
A("all", t, "ride", { prop: a.car, ...RIDE, dur: 0.2 }); A("all", t, "look", { to: [0, 0], dur: 0.12 }); A("all", t + 0.05, "expr", { expr: "smug" });
A("all", t + 0.1, "arm", { side: "L", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.15 }); A("all", t + 0.15, "squash", { amount: 0.06, dur: 0.15 });   // a satisfied nod
next = leave("all", a.car, t + 0.55);

// ---- 10. Viking: bumper cars. Rams the car behind off the screen, then the one in front: now there's room
a = arrive("vik", next); t = a.t;
c.beat("vik", t - 0.35, "bumper cars: rams the car behind away, then the car in front", "makes room");
A("vik", t, "expr", { expr: "stern" });
prop(a.car, t, { x: SPOT[0] + 0.45, z: SPOT[1], rot: -80 }, 0.3, "in");
prop("carB", t + 0.3, { x: B_AT[0] + 3.5, smash: 0.5, roll: 30 }, 0.5, "out"); sfx(t + 0.3, "impact", { gain: 0.45 }); fx(t + 0.3, { fx: "shake", dur: 0.3, amp: 0.05 });
fx(t + 0.31, { fx: "poof", pos: [SPOT[0] + 1.3, 0.4, SPOT[1]], dur: 0.5, puffs: 6, sparks: 10, color: "#e9e4d8", spark: "#ffe08a" });
prop(a.car, t + 0.35, { x: SPOT[0] - 0.4, rot: -90 }, 0.3, "in");
prop("carA", t + 0.65, { x: A_AT[0] - 3.5, smash: 0.5, roll: -30 }, 0.5, "out"); sfx(t + 0.65, "impact", { gain: 0.45 }); fx(t + 0.65, { fx: "shake", dur: 0.3, amp: 0.05 });
fx(t + 0.66, { fx: "poof", pos: [SPOT[0] - 1.3, 0.4, SPOT[1]], dur: 0.5, puffs: 6, sparks: 10, color: "#e9e4d8", spark: "#ffe08a" });
prop(a.car, t + 0.7, { x: SPOT[0] }, 0.3, "out"); prop(a.car, t + 0.65, { bump: 1 }, 0.05); prop(a.car, t + 1.0, { bump: 0 }, 0.2);
A("vik", t + 1.0, "expr", { expr: "smug" }); A("vik", t + 1.0, "arm", { side: "both", pose: "up", dur: 0.15 });
const vikDone = t + 1.0;

// ---- the loop: the parked cars poof back, the Viking's car is gone in the same poof; the Astronaut rolls up: frame 0
const fresh = vikDone + 1.05;
fx(fresh, { fx: "poof", pos: [0, 0.5, SPOT[1]], dur: 0.4, puffs: 12, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop(a.car, fresh + 0.08, { ...RESET, x: IN, z: LANE }, 0);
prop("carA", fresh + 0.08, { x: A_AT[0], smash: 0, roll: 0 }, 0); prop("carB", fresh + 0.08, { x: B_AT[0], smash: 0, roll: 0 }, 0);
// the Astronaut rolls in again in c0 (the Viking had c1), ending where frame 0 starts
const end = fresh + 0.55;
prop("c0", end - 0.6, { ...RESET, x: IN, z: LANE, rot: -90 }, 0);
A("ast", end - 0.6, "show"); A("ast", end - 0.6, "ride", { prop: "c0", ...RIDE, dur: 0.01 }); A("ast", end - 0.6, "expr", { expr: "kind" }); A("ast", end - 0.6, "arm", { side: "both", pose: { o: [-0.12, 0.38, 0.3] }, dur: 0.01 });
prop("c0", end - 0.6, { x: STOP + 0.12 }, 0.6, "out");

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 2.9, 3.1], look: [0, 0.6, -2.0], fov: 52 },
  title: "PARKING", hook: "1 gap. 10 drivers.", hookTo: 1.0, askAt: vikDone, cover: t + 0.7,
  file: new URL("./parking-01-parallel.json", import.meta.url),
});
