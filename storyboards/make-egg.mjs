// EGG: "how each fighter cooks an egg", the "same task, each fighter their own way" format (Jonny's rules, 2026-10-24):
// one kitchen in the morning, one stove, a fresh pan and an egg per turn. Each fighter walks up behind the stove like
// a cooking-show host, puts their pan on, and cooks the egg the way a type of real cook does
// (docs/each-activities.md), in their signature way, then takes the pan with them. One continuous take. Frame 0 is the
// Astronaut's egg in mid-flip; the last frame sets that up again.
//   node storyboards/make-egg.mjs   ->  storyboards/egg-01-breakfast.json
import { clip } from "./each-lib.mjs";

const STOVE = [0, -0.6], COOK = [0, -1.25], WAIT = [1.05, -1.25], ENTER = [2.7, -1.2], OUT = [-0.9, -1.15], EXIT = [-2.8, -1.05];
const SS = 0.75, PS = 1.25;                   // the stove is scaled down so the cooks show over it; pans and eggs up so they read
const BURNER = [-0.18 * SS, 0.62 * SS, STOVE[1] - 0.1 * SS];   // where a pan sits on the hob (the back-left burner)
const HANDLE = [-0.37 * PS, 0, 0];                 // a pan held by its handle: its middle this far left of the hand
const PAN_HAND = { x: [0.33, 0.47, 0.55] };     // the left hand on the handle of the pan on the burner
const CRACK_HAND = { x: [-0.14, 0.7, 0.55] };   // the right hand over the pan, egg in it
const c = clip({
  id: "egg-01-breakfast", title: "EGG: how each fighter cooks an egg",
  format: "each-character-vs-X, one continuous take: fighters take turns cooking one egg on one stove, each their own way",
  set: { type: "kitchen", morning: true, time: 7.5 },
  props: [
    { id: "stove", kind: "stove", x: STOVE[0], z: STOVE[1], scale: SS },
    { id: "p0", kind: "pan", x: BURNER[0], y: BURNER[1], z: BURNER[2], fried: 1, scale: PS },
    { id: "p1", kind: "pan", x: ENTER[0], y: 0.5, z: ENTER[1], scale: PS },
    { id: "e0", kind: "egg", x: ENTER[0], y: 0.5, z: ENTER[1], scale: 0 },
    { id: "e1", kind: "egg", x: ENTER[0], y: 0.5, z: ENTER[1], scale: PS },
    { id: "phone", kind: "phone", x: 2.9, y: 0.5, z: -1.2, glow: 1, scale: 0 },
  ],
});
const { A, prop, fx, sfx, walk } = c;
// the eggs still to cook, in a row on the counter behind the stove: one goes each time a cook is handed an egg
const ROW = Array.from({ length: 9 }, (_, i) => [-0.62 - i * 0.12, 0.95, -1.88]);
ROW.forEach(([x, y, z], i) => c.sb.props.push({ id: `row${i}`, kind: "egg", x, y, z, scale: PS }));
let left = 9;
const grab = (who, id, hand, at, off = [0, 0, 0], dur = 0.01) => c.items.push({ who, do: "grab", prop: id, hand, at, dur, off });
const release = (who, id, at, to, dur = 0.2, arc = 0) => c.items.push({ who, do: "release", prop: id, at, to, dur, arc });

// ---- pieces every turn uses
let k = 1;
const queue = (who, t) => {   // in from the right with a clean pan and an egg, waits beside the stove
  const kit = { pan: `p${k % 2}`, egg: `e${k % 2}` }; k++;
  prop(kit.pan, t - 0.03, { fried: 0, burn: 0, big: 0, yolks: 1, flip: 0, tilt: 0, roll: 0, scale: PS }, 0);
  prop(kit.egg, t - 0.03, { crack: 0, scale: PS }, 0);
  left--; prop(`row${left}`, t - 0.25, { scale: 0 }, 0.12, "in"); sfx(t - 0.25, "pop", { gain: 0.12 });
  A(who, t, "show"); grab(who, kit.pan, "L", t, HANDLE); grab(who, kit.egg, "R", t);
  A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, WAIT, 0.5); A(who, t + 0.45, "turn", { to: "camera", dur: 0.15 });
  return kit;
};
const stepUp = (who, t, kit, { light = true } = {}) => {   // to the stove: the pan onto the burner (and the gas on)
  A(who, t, "turn", { to: "left", dur: 0.12 }); walk(who, t, COOK, 0.4, "inOut", 2); A(who, t + 0.32, "turn", { to: "camera", dur: 0.12 });
  release(who, kit.pan, t + 0.25, BURNER, 0.2); A(who, t + 0.3, "arm", { side: "L", pose: PAN_HAND, dur: 0.15 }); sfx(t + 0.45, "tink", { gain: 0.2 });
  if (light) { prop("stove", t + 0.4, { on: 1 }, 0.15); sfx(t + 0.42, "click", { gain: 0.2 }); }
  return t + 0.45;
};
const crack = (who, kit, t) => {   // the egg over the pan, crack, into the pan, the shell gone
  A(who, t, "arm", { side: "R", pose: CRACK_HAND, dur: 0.15 });
  prop(kit.egg, t + 0.15, { crack: 1 }, 0.25); sfx(t + 0.15, "click", { gain: 0.3 });
  prop(kit.pan, t + 0.25, { fried: 1 }, 0.2, "out"); sfx(t + 0.3, "hiss", { dur: 0.6, gain: 0.12 });
  prop(kit.egg, t + 0.4, { scale: 0 }, 0.08);
  A(who, t + 0.4, "arm", { side: "R", pose: "rest", dur: 0.2 });
  return t + 0.45;
};
const leave = (who, kit, t, { take = true } = {}) => {   // takes the pan and goes off to the left
  if (take) { grab(who, kit.pan, "L", t, HANDLE, 0.15); }
  prop("stove", t, { on: 0, fire: 0 }, 0.15);
  A(who, t + 0.1, "turn", { to: "left", dur: 0.15 }); walk(who, t + 0.1, OUT, 0.3, "in", 2); walk(who, t + 0.4, EXIT, 0.5, "linear");
  A(who, t + 0.95, "hide");
  return t + 0.3;   // when the next cook may step up
};
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "all", "sam", "vik"];
c.cast("ast", COOK, { expr: "eager" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
for (const id of order) for (const p of ["stove", "p0", "p1", "e0", "e1"]) c.clipOk(id, p);
c.clipOk("phx", "phone");

// ---- 1. Astronaut: the chef flip. A zero-g toss, the egg spins, lands perfectly
// (frame 0: the egg at the top of its flip; the last frame matches)
const kit0 = { pan: "p0", egg: "e0" };
prop("stove", -0.45, { on: 1 }, 0); grab("ast", "p0", "L", -0.45, HANDLE);
A("ast", -0.45, "arm", { side: "L", pose: { x: [0.33, 0.45, 0.62] }, dur: 0.01 }); A("ast", -0.45, "arm", { side: "R", pose: "hips", dur: 0.01 });
const flip = (t) => { prop("p0", t, { flip: 1 }, 0.85, "linear"); A("ast", t, "look", { to: [-0.2, 0.6], dur: 0.2 }); };
flip(-0.21);
c.beat("ast", 0, "flips it like a TV chef: a zero-g toss that lands perfectly", "the chef flip");
prop("p0", 0.64, { flip: 0 }, 0); sfx(0.64, "land", { gain: 0.2 }); A("ast", 0.64, "look", { to: [0, 0], dur: 0.15 });
A("ast", 0.64, "expr", { expr: "delighted" }); A("ast", 0.68, "arm", { side: "R", pose: "up", dur: 0.15 }); fx(0.68, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(0.68, "tink", { gain: 0.25 });
let kit = queue("rea", 0.3);
let free = leave("ast", kit0, 1.1);

// ---- 2. Reaper: eats it straight out of the pan. No plate. No expression
let t = stepUp("rea", free, kit); const reaKit = kit;
c.beat("rea", free, "no plate: eats it straight out of the pan, deadpan", "eats from the pan");
A("rea", free, "expr", { expr: "deadpan" });
t = crack("rea", reaKit, t);
grab("rea", reaKit.pan, "L", t + 0.25, HANDLE, 0.15); A("rea", t + 0.25, "arm", { side: "L", pose: { o: [0.05, 0.85, 0.35] }, dur: 0.25 }); prop(reaKit.pan, t + 0.3, { tilt: -50 }, 0.2);
prop(reaKit.pan, t + 0.55, { fried: 0 }, 0.12, "in"); sfx(t + 0.6, "pop", { gain: 0.3 }); A("rea", t + 0.6, "squash", { amount: 0.08, dur: 0.2 });
A("rea", t + 0.75, "arm", { side: "L", pose: PAN_HAND, dur: 0.2 }); prop(reaKit.pan, t + 0.75, { tilt: 0 }, 0.2); A("rea", t + 1.0, "blink", { dur: 0.15 });
kit = queue("sor", t);
free = leave("rea", reaKit, t + 1.2);

// ---- 3. Sorcerer: the lazy cook. Doesn't touch a thing: the egg floats over, cracks itself, cooks in green fire
const sorKit = kit; t = stepUp("sor", free, kit, { light: false });
c.beat("sor", free, "the lazy cook: lets magic crack it and cook it", "magic does it");
A("sor", t, "expr", { expr: "smug" }); A("sor", t, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("sor", t, "charge", { to: 1, dur: 0.15 });
release("sor", sorKit.egg, t + 0.05, [BURNER[0], 1.05, BURNER[2]], 0.35, 0.15); sfx(t + 0.05, "charge", { dur: 0.6, gain: 0.2 });
prop(sorKit.egg, t + 0.4, { crack: 1 }, 0.2); prop(sorKit.pan, t + 0.5, { fried: 1 }, 0.2, "out"); prop(sorKit.egg, t + 0.6, { scale: 0 }, 0.08);
fx(t + 0.5, { fx: "poof", pos: [BURNER[0], BURNER[1] + 0.05, BURNER[2]], dur: 0.5, puffs: 3, sparks: 14, color: "#c9f7b0", spark: "#9dff6a" }); sfx(t + 0.5, "hiss", { dur: 0.4, gain: 0.15 });
A("sor", t + 0.8, "charge", { to: 0, dur: 0.15 }); A("sor", t + 0.8, "arm", { side: "R", pose: "rest", dur: 0.2 }); fx(t + 0.75, { fx: "sparkle", who: "sor", dur: 0.5 });
kit = queue("wiz", t);
free = leave("sor", sorKit, t + 1.05);

// ---- 4. Wizard: a spell to cook it makes it enormous; a giant fried egg swamps the stove
const wizKit = kit; t = stepUp("wiz", free, kit);
c.beat("wiz", free, "a cooking spell makes the egg enormous; it swamps the stove", "the spell goes wrong");
A("wiz", t, "expr", { expr: "stern" }); release("wiz", wizKit.egg, t, [BURNER[0], 0.95, BURNER[2]], 0.2);
A("wiz", t + 0.1, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t + 0.1, "charge", { to: 0.7, dur: 0.15 });
fx(t + 0.3, { fx: "poof", pos: [BURNER[0], 1.0, BURNER[2]], dur: 0.5, puffs: 8, sparks: 10, spark: "#c8b6ff" }); sfx(t + 0.3, "poof", { gain: 0.3 });
prop(wizKit.egg, t + 0.32, { scale: 3.5 }, 0.25, "out"); A("wiz", t + 0.4, "charge", { to: 0, dur: 0.15 }); A("wiz", t + 0.45, "expr", { expr: "shocked" });
prop(wizKit.egg, t + 0.7, { crack: 1 }, 0.25); sfx(t + 0.7, "click", { gain: 0.4 });
prop(wizKit.pan, t + 0.8, { fried: 1, big: 1 }, 0.3, "out"); prop(wizKit.egg, t + 0.95, { scale: 0 }, 0.08); sfx(t + 0.85, "hiss", { dur: 0.6, gain: 0.2 });
A("wiz", t + 0.9, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("wiz", t + 1.1, "expr", { expr: "sad" }); A("wiz", t + 1.1, "droop", { to: 1, dur: 0.25 });
kit = queue("dra", t + 0.3);
A("wiz", t + 1.35, "droop", { to: 0, dur: 0.15 });
free = leave("wiz", wizKit, t + 1.4);

// ---- 5. Dragon: turns it all the way up. Huge flames, charcoal in a second, smoke
const draKit = kit; t = stepUp("dra", free, kit);
c.beat("dra", free, "no patience: turns the heat all the way up, charcoal in a second", "full heat");
t = crack("dra", draKit, t); A("dra", t, "expr", { expr: "eager" });
A("dra", t, "arm", { side: "R", pose: { o: [0.05, 0.45, 0.5] }, dur: 0.15 }); sfx(t + 0.1, "click", { gain: 0.3 });
prop("stove", t + 0.15, { fire: 1 }, 0.2, "out"); sfx(t + 0.15, "whoosh", { dur: 0.5, gain: 0.3 }); fx(t + 0.15, { fx: "shake", dur: 0.2, amp: 0.02 });
prop(draKit.pan, t + 0.25, { burn: 1 }, 0.45, "in");
fx(t + 0.65, { fx: "poof", pos: [BURNER[0], 0.95, BURNER[2]], dur: 0.7, puffs: 6, sparks: 0, color: "#6b6b6b" }); A("dra", t + 0.65, "expr", { expr: "shocked" });
A("dra", t + 0.75, "arm", { side: "R", pose: "rest", dur: 0.2 }); prop("stove", t + 0.8, { fire: 0 }, 0.2);
A("dra", t + 0.95, "expr", { expr: "sad" }); A("dra", t + 0.95, "squash", { amount: 0.1, dur: 0.15 }); fx(t + 0.95, { fx: "sweat", who: "dra", dur: 0.6, count: 4 });
kit = queue("phx", t + 0.2);
free = leave("dra", draKit, t + 1.25);

// ---- 6. Phoenix: the photo first. Photo, selfie, another photo... and it's burnt
const phxKit = kit; t = stepUp("phx", free, kit);
c.beat("phx", free, "takes photos of it first; by the selfie it's burnt", "photo first");
t = crack("phx", phxKit, t);
prop("phone", t + 0.05, { scale: 1.5 }, 0.15); grab("phx", "phone", "R", t + 0.05, [0, 0, 0.03], 0.2); A("phx", t, "expr", { expr: "cocky" });
A("phx", t + 0.1, "arm", { side: "R", pose: { o: [-0.15, 0.7, 0.45] }, dur: 0.15 }); A("phx", t + 0.1, "look", { to: [-0.2, -0.4], dur: 0.12 });
fx(t + 0.25, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.25, "click", { gain: 0.3 });
A("phx", t + 0.4, "arm", { side: "R", pose: { o: [0.08, 0.8, 0.35] }, dur: 0.15 }); A("phx", t + 0.4, "look", { to: [0.1, 0.3], dur: 0.12 }); A("phx", t + 0.45, "expr", { expr: "smug" });
fx(t + 0.65, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.65, "click", { gain: 0.3 }); fx(t + 0.6, { fx: "sparkle", who: "phx", dur: 0.5 });
prop(phxKit.pan, t + 0.2, { burn: 0.9 }, 0.8, "in"); fx(t + 0.85, { fx: "poof", pos: [BURNER[0], 0.9, BURNER[2]], dur: 0.6, puffs: 4, sparks: 0, color: "#7a7a7a" });
A("phx", t + 0.95, "look", { to: [-0.2, -0.5], dur: 0.12 }); A("phx", t + 0.95, "expr", { expr: "shocked" }); fx(t + 0.95, { fx: "alert", who: "phx", dur: 0.5 });
A("phx", t + 1.1, "arm", { side: "R", pose: "rest", dur: 0.2 });
kit = queue("gun", t + 0.3);
free = leave("phx", phxKit, t + 1.35);
prop("phone", free + 0.8, { scale: 0 }, 0);

// ---- 7. Gunslinger: cracks it with a shot. Tosses it up, one bang, the egg drops into the pan
const gunKit = kit; t = stepUp("gun", free, kit);
c.beat("gun", free, "tosses the egg up and cracks it with one shot", "cracks it with a shot");
A("gun", t, "expr", { expr: "stern" }); release("gun", gunKit.egg, t, [BURNER[0], 1.2, BURNER[2]], 0.3);
A("gun", t + 0.05, "arm", { side: "R", pose: { o: [0.25, 0.75, 0.4] }, dur: 0.15 }); A("gun", t + 0.05, "look", { to: [-0.3, 0.5], dur: 0.12 });   // aimed up at the egg
fx(t + 0.32, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.32, "impact", { gain: 0.35 });
prop(gunKit.egg, t + 0.33, { crack: 1 }, 0.2); fx(t + 0.33, { fx: "poof", pos: [BURNER[0], 1.25, BURNER[2]], dur: 0.35, puffs: 1, sparks: 8, spark: "#ffd34d" });
fx(t + 0.32, { fx: "poof", pos: [-0.35, 1.0, -1.0], dur: 0.3, puffs: 1, sparks: 6, color: "#fff2b0", spark: "#ffd34d" }); fx(t + 0.3, { fx: "speedlines", dur: 0.12 });   // the muzzle
prop(gunKit.pan, t + 0.5, { fried: 1 }, 0.15, "out"); prop(gunKit.egg, t + 0.55, { scale: 0 }, 0.08); sfx(t + 0.5, "hiss", { dur: 0.5, gain: 0.12 });
A("gun", t + 0.55, "look", { to: [0, 0], dur: 0.12 }); A("gun", t + 0.6, "expr", { expr: "smug" }); A("gun", t + 0.7, "arm", { side: "R", pose: "rest", dur: 0.2 });
kit = queue("all", t);
free = leave("gun", gunKit, t + 1.05);

// ---- 8. Allfather: breakfast for the whole family. Egg after egg after egg, a pan full of yolks
const allKit = kit; t = stepUp("all", free, kit);
c.beat("all", free, "makes breakfast for the whole family: egg after egg after egg", "cooks for everyone");
A("all", t, "expr", { expr: "focused" });
t = crack("all", allKit, t);
A("all", t, "arm", { side: "R", pose: CRACK_HAND, dur: 0.1 });
for (let i = 0; i < 5; i++) {
  const u = t + 0.1 + i * 0.16;
  prop(allKit.egg, u, { crack: 0, scale: PS }, 0); prop(allKit.egg, u + 0.02, { crack: 1 }, 0.1); sfx(u + 0.04, "click", { gain: 0.25 });
}
prop(allKit.egg, t + 0.92, { scale: 0 }, 0.05); prop(allKit.pan, t + 0.1, { yolks: 6 }, 0.85, "linear");
A("all", t + 0.95, "arm", { side: "R", pose: "hips", dur: 0.2 }); A("all", t + 1.0, "expr", { expr: "smug" }); A("all", t + 1.05, "squash", { amount: 0.06, dur: 0.15 });
kit = queue("sam", t + 0.3);
free = leave("all", allKit, t + 1.3);

// ---- 9. Samurai: cuts the egg open in the air. Two shell halves, one perfect yolk
const samKit = kit; t = stepUp("sam", free, kit);
c.beat("sam", free, "tosses the egg and cuts it open in mid-air", "cuts it open");
A("sam", t, "expr", { expr: "serene" }); release("sam", samKit.egg, t, [BURNER[0], 1.35, BURNER[2]], 0.3);
A("sam", t + 0.05, "arm", { side: "R", pose: "up", dur: 0.15 });
A("sam", t + 0.3, "arm", { side: "R", pose: "point", dur: 0.08 }); fx(t + 0.3, { fx: "speedlines", dur: 0.12 }); fx(t + 0.32, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.32, "shing", { gain: 0.25 });
prop(samKit.egg, t + 0.33, { crack: 1 }, 0.25); prop(samKit.pan, t + 0.5, { fried: 1 }, 0.15, "out"); prop(samKit.egg, t + 0.6, { scale: 0 }, 0.08); sfx(t + 0.5, "hiss", { dur: 0.5, gain: 0.12 });
A("sam", t + 0.6, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("sam", t + 0.7, "expr", { expr: "kind" }); fx(t + 0.6, { fx: "sparkle", who: "sam", dur: 0.5 });
kit = queue("vik", t);
free = leave("sam", samKit, t + 1.0);

// ---- 10. Viking: cracks it too hard. The egg, the pan and the stove, in one blow
const vikKit = kit; t = stepUp("vik", free, kit);
c.beat("vik", free, "cracks it a little too hard: egg, pan and stove", "too hard");
A("vik", t, "expr", { expr: "stern" }); A("vik", t, "arm", { side: "R", pose: "up", dur: 0.2 });
A("vik", t + 0.25, "arm", { side: "R", pose: CRACK_HAND, dur: 0.08 }); A("vik", t + 0.25, "squash", { amount: 0.1, dur: 0.12 });
const hit = t + 0.33;
sfx(hit, "impact", { gain: 0.5 }); fx(hit, { fx: "shake", dur: 0.35, amp: 0.06 }); fx(hit, { fx: "flash", dur: 0.08, peak: 0.3 });
fx(hit, { fx: "poof", pos: [BURNER[0], 0.75, BURNER[2]], dur: 0.6, puffs: 8, sparks: 14, color: "#e9e4d8", spark: "#ffd23f" });
prop(vikKit.egg, hit, { scale: 0 }, 0.05); prop("stove", hit, { smash: 1, on: 0 }, 0.2, "out");
prop(vikKit.pan, hit, { x: -1.6, y: 1.6, z: -1.5, roll: 400 }, 0.5, "out"); prop(vikKit.pan, hit + 0.5, { y: 0.0 }, 0.3, "in"); sfx(hit + 0.8, "tink", { gain: 0.3 });
A("vik", hit + 0.3, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("vik", hit + 0.35, "expr", { expr: "happy" }); A("vik", hit + 0.4, "arm", { side: "both", pose: "up", dur: 0.2 });
const vikDone = hit + 0.4;

// ---- the loop: a poof puts the stove back with the Astronaut behind it, mid-toss: frame 0
const fresh = vikDone + 0.6;
fx(fresh, { fx: "poof", pos: [0, 0.6, -0.9], dur: 0.4, puffs: 12, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop(vikKit.pan, fresh + 0.08, { scale: 0 }, 0);
prop("stove", fresh + 0.08, { smash: 0, on: 1 }, 0);
prop("p0", fresh + 0.06, { fried: 1, burn: 0, big: 0, yolks: 1, flip: 0, tilt: 0, roll: 0, scale: PS }, 0);
A("ast", fresh + 0.06, "show"); A("ast", fresh + 0.06, "move", { to: COOK, dur: 0.01 }); A("ast", fresh + 0.06, "turn", { to: "camera", dur: 0.01 });
A("ast", fresh + 0.06, "expr", { expr: "eager" }); A("ast", fresh + 0.06, "look", { to: [0, 0], dur: 0.01 });
grab("ast", "p0", "L", fresh + 0.07, HANDLE);
A("ast", fresh + 0.07, "arm", { side: "L", pose: { x: [0.33, 0.45, 0.62] }, dur: 0.01 }); A("ast", fresh + 0.07, "arm", { side: "R", pose: "hips", dur: 0.01 });
fx(fresh + 0.02, { fx: "poof", pos: [-1.1, 1.0, -1.88], dur: 0.4, puffs: 6, sparks: 4 }); ROW.forEach((_, i) => prop(`row${i}`, fresh + 0.08, { scale: PS }, 0));   // the eggs are back
A("ast", fresh + 0.3, "look", { to: [0, 0], dur: 0.1 });   // a look at us, egg in the pan, then the toss
const end = fresh + 0.85;
flip(end - 0.21);

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 1.75, 2.6], look: [0, 0.85, -1.0], fov: 40 },
  title: "EGG", hook: "1 egg. 10 cooks.", hookTo: 1.0, askAt: vikDone + 0.1, cover: hit + 0.2,
  file: new URL("./egg-01-breakfast.json", import.meta.url),
});
