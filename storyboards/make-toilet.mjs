// TOILET: "no toilet paper: what each fighter does", the "same task, each fighter their own way" format (Jonny's rules,
// 2026-10-24): one bathroom, one toilet, one empty roll. Each fighter sits down, reaches for the paper, finds the bare
// cardboard tube, and copes the way a type of real person does (docs/each-activities.md), in their signature way.
// Kept clean: no bodily humour beyond the empty roll. One continuous take. Frame 0 is the Astronaut spinning the
// empty tube; the last frame sets that up again.
//   node storyboards/make-toilet.mjs   ->  storyboards/toilet-01-no-paper.json
import { clip, r3 } from "./each-lib.mjs";

const SEAT = [0, -1.63], HOLDER = [-0.55, 0, -1.35], SPARE = [-0.9, 1.7, -1.9], LAP = [0.22, 0.78, -1.08];
const WAIT = [1.0, -1.0], ENTER = [2.8, -0.85], OUT = [-0.3, -0.55], EXIT = [-2.9, -0.35];
const REACH = { x: [-0.47, 0.55, 0.32] };   // the right hand on the roll on the holder beside the toilet
const AV = [[-0.25, 0.75, -0.95], [0.22, 0.8, -0.9], [0.0, 1.05, -1.05], [-0.35, 0.0, -0.75], [0.36, 0.0, -0.7], [-0.05, 0.0, -0.6], [0.15, 0.55, -0.8], [0.0, 1.3, -1.2]];   // a pile in front of him
const c = clip({
  id: "toilet-01-no-paper", title: "NO PAPER: what each fighter does",
  format: "each-character-vs-X, one continuous take: fighters take turns on one toilet, the roll is empty, each copes their own way",
  set: { type: "bathroom" },
  props: [
    { id: "toilet", kind: "toilet", x: SEAT[0], z: SEAT[1], lid: 1 },
    { id: "holder", kind: "tpholder", x: HOLDER[0], y: HOLDER[1], z: HOLDER[2], stock: 0, scale: 1.6, rot: -90 },   // the empty tube faces the camera,
    { id: "spare", kind: "troll", x: SPARE[0], y: SPARE[1], z: SPARE[2], scale: 2 },
    { id: "own", kind: "troll", x: 0.25, y: 0.6, z: -1.3, scale: 0 },
    { id: "bonk", kind: "troll", x: 2.6, y: 1.5, z: -1.2, scale: 0 },
    { id: "phone", kind: "phone", x: 2.9, y: 0.5, z: -0.85, glow: 1, scale: 0 },
    { id: "curtain", kind: "curtain", x: -1.1, y: 1.85, z: -1.1, scale: 0.8 },
    ...AV.map(([x, y, z], i) => ({ id: `av${i}`, kind: "troll", x, y: y + 2.2, z, scale: 0, roll: 40 * i })),
  ],
});
const { A, prop, fx, sfx, walk } = c;

// ---- pieces every turn uses
const sitDown = (who, t) => { A(who, t, "sit", { seat: "toilet", dur: 0.35 }); A(who, t, "turn", { to: "camera", dur: 0.15 }); sfx(t + 0.3, "land", { gain: 0.2 }); return t + 0.35; };
let spun = 360;   // the holder's spin so far (degrees; each check adds two turns)
const checkRoll = (who, t) => {   // reach back, spin the holder: nothing but the cardboard tube
  A(who, t, "arm", { side: "R", pose: REACH, dur: 0.18 }); A(who, t, "look", { to: [-0.7, 0.1], dur: 0.15 });
  spun += 720; prop("holder", t + 0.12, { spin: spun }, 0.3, "out"); sfx(t + 0.12, "click", { gain: 0.25 }); sfx(t + 0.25, "click", { gain: 0.2 });
  return t + 0.35;
};
const leave = (who, t, dur = 0.5) => {
  A(who, t, "stand", { dur: 0.2 }); A(who, t + 0.05, "turn", { to: "left", dur: 0.15 });
  walk(who, t + 0.1, OUT, 0.3, "inOut", 2); walk(who, t + 0.4, EXIT, dur, "linear"); A(who, t + 0.4 + dur, "hide");
  return t + 0.25;
};
const queue = (who, t, at = WAIT) => { A(who, t, "show"); A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, at, 0.5); A(who, t + 0.45, "turn", { to: "camera", dur: 0.15 }); };
const resetSpare = (t) => { fx(t, { fx: "poof", pos: [SPARE[0], SPARE[1] + 0.1, SPARE[2]], dur: 0.4, puffs: 3, sparks: 4 }); prop("spare", t + 0.03, { x: SPARE[0], y: SPARE[1], z: SPARE[2], roll: 0, scale: 2, unroll: 0 }, 0); };
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "sam", "all", "vik"];
c.cast("ast", SEAT, { expr: "kind" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
A("ast", -0.1, "sit", { seat: "toilet", dur: 0.05 });
for (const id of order) c.clipOk(id, "toilet");
c.clipOk("phx", "bonk");   // it bonks his head on purpose
c.clipOk("sor", "spare"); c.clipOk("gun", "spare");   // the spare roll lands in their hands

// ---- 1. Astronaut: the prepared one. The roll's empty? He brought his own, from a suit pocket
let t = 0;
c.beat("ast", 0, "always prepared: the roll's empty, so out comes his own", "brought his own");
A("ast", -0.1, "arm", { side: "R", pose: REACH, dur: 0.05 }); fx(-0.1, { fx: "alert", who: "ast", dur: 0.55, text: "?" }); A("ast", -0.1, "look", { to: [-0.7, 0.1], dur: 0.05 });
prop("holder", -0.1, { spin: 360 }, 0.4, "out"); sfx(0, "click", { gain: 0.25 });
A("ast", 0.35, "look", { to: [0, 0], dur: 0.12 }); A("ast", 0.35, "expr", { expr: "delighted" }); A("ast", 0.35, "arm", { side: "R", pose: "rest", dur: 0.15 });
A("ast", 0.5, "arm", { side: "L", pose: "hold", dur: 0.15 });
c.items.push({ who: "ast", do: "grab", prop: "own", hand: "L", at: 0.55, dur: 0.05 });
prop("own", 0.55, { scale: 1.4 }, 0.2, "out"); fx(0.6, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(0.6, "tink", { gain: 0.25 });
A("ast", 0.7, "arm", { side: "L", pose: "up", dur: 0.2 }); A("ast", 0.75, "squash", { amount: -0.06, dur: 0.2 });
let free = leave("ast", 1.35);
prop("own", 1.95, { scale: 0 }, 0);
queue("rea", 0.8);

// ---- 2. Reaper: stares into the void. Empty tube. A long, dead stare at us
t = free;
c.beat("rea", t, "accepts his fate: finds the empty tube and stares into the void", "stares into the void");
let b = sitDown("rea", t); A("rea", b, "expr", { expr: "deadpan" });
b = checkRoll("rea", b);
A("rea", b, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("rea", b, "look", { to: [0, 0], dur: 0.2 });
A("rea", b + 0.2, "still", { dur: 0.7 }); A("rea", b + 0.65, "blink", { dur: 0.2 });
free = leave("rea", b + 0.85);
queue("sor", b + 0.5);

// ---- 3. Sorcerer: the lazy reach. The spare roll is on the high shelf; it floats down to him
t = free;
c.beat("sor", t, "too lazy to get up: floats the spare roll down from the shelf", "the lazy reach");
b = sitDown("sor", t); A("sor", b, "expr", { expr: "kind" });
b = checkRoll("sor", b);
A("sor", b, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("sor", b, "expr", { expr: "smug" }); A("sor", b + 0.05, "look", { to: [-0.6, 0.6], dur: 0.15 }); fx(b + 0.05, { fx: "poof", pos: [SPARE[0], SPARE[1] + 0.15, SPARE[2]], dur: 0.35, puffs: 0, sparks: 8, spark: "#fff6c8" });
A("sor", b + 0.1, "arm", { side: "L", pose: "cast", dur: 0.15 }); A("sor", b + 0.1, "charge", { to: 1, dur: 0.15 });
fx(b + 0.2, { fx: "poof", pos: [SPARE[0], SPARE[1] + 0.1, SPARE[2]], dur: 0.4, puffs: 2, sparks: 10, color: "#c9f7b0", spark: "#9dff6a" }); sfx(b + 0.2, "charge", { dur: 0.5, gain: 0.2 });
prop("spare", b + 0.25, { x: LAP[0], y: LAP[1] + 0.25, z: LAP[2], roll: 360 }, 0.55, "inOut");
A("sor", b + 0.6, "look", { to: [0.2, -0.3], dur: 0.2 }); A("sor", b + 0.85, "charge", { to: 0, dur: 0.15 }); A("sor", b + 0.85, "arm", { side: "L", pose: "rest", dur: 0.15 });
fx(b + 0.85, { fx: "sparkle", who: "sor", dur: 0.5 });
free = leave("sor", b + 1.15);
prop("spare", b + 1.2, { y: -0.5 }, 0.01); resetSpare(b + 1.75);
queue("wiz", b + 0.7);

// ---- 4. Wizard: a spell for paper... and an avalanche of rolls buries him
t = free;
c.beat("wiz", t, "a spell for one roll of paper brings an avalanche of them", "the spell goes wrong");
b = sitDown("wiz", t); A("wiz", b, "expr", { expr: "kind" });
b = checkRoll("wiz", b);
A("wiz", b, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", b, "expr", { expr: "stern" }); A("wiz", b, "charge", { to: 0.6, dur: 0.2 });
fx(b + 0.25, { fx: "poof", pos: [0, 1.6, -1.5], dur: 0.5, puffs: 6, sparks: 12, spark: "#c8b6ff" }); sfx(b + 0.25, "poof", { gain: 0.3 });
A("wiz", b + 0.3, "charge", { to: 0, dur: 0.15 }); A("wiz", b + 0.35, "look", { to: [0, 0.6], dur: 0.12 }); A("wiz", b + 0.35, "expr", { expr: "shocked" });
AV.forEach(([x, y, z], i) => { const k = b + 0.3 + i * 0.05; prop(`av${i}`, k, { scale: 1.8 }, 0.01); prop(`av${i}`, k, { y }, 0.25, "in"); sfx(k + 0.25, "land", { gain: 0.12 }); });
A("wiz", b + 0.7, "squash", { amount: 0.12, dur: 0.2 }); A("wiz", b + 0.75, "arm", { side: "R", pose: "up", dur: 0.12 });
const wizOut = b + 1.1;
fx(wizOut, { fx: "poof", pos: [0, 0.6, -1.3], dur: 0.6, puffs: 10, sparks: 6, spark: "#c8b6ff" }); sfx(wizOut, "poof", { gain: 0.25 });
AV.forEach((_, i) => prop(`av${i}`, wizOut + 0.05, { scale: 0 }, 0.12, "in"));
A("wiz", wizOut, "arm", { side: "R", pose: "rest", dur: 0.15 });
free = leave("wiz", wizOut + 0.1);
for (let i = 0; i < AV.length; i++) c.clipOk("wiz", `av${i}`);
queue("dra", b + 0.8);

// ---- 5. Dragon: the panicker. Sweat, a "!", smoke and fire snorting out of his nose
t = free;
c.beat("dra", t, "panics: sweating, looking everywhere, snorting little fires", "panics");
b = sitDown("dra", t); A("dra", b, "expr", { expr: "kind" });
b = checkRoll("dra", b);
fx(b, { fx: "alert", who: "dra", dur: 0.6 }); A("dra", b, "expr", { expr: "shocked" }); A("dra", b, "arm", { side: "R", pose: "cheeks", dur: 0.12 }); A("dra", b, "arm", { side: "L", pose: "cheeks", dur: 0.12 });
fx(b + 0.1, { fx: "sweat", who: "dra", dur: 0.9, count: 6 });
for (const [k, dx] of [[0.2, -0.6], [0.4, 0.6], [0.6, -0.6], [0.8, 0.6]]) A("dra", b + k, "look", { to: [dx, 0.1], dur: 0.1 });
for (const k of [0.35, 0.75]) { fx(b + k, { fx: "poof", pos: [SEAT[0], 1.0, SEAT[1] + 0.45], dur: 0.4, puffs: 2, sparks: 8, color: "#ffc27a", spark: "#ff7a1a" }); sfx(b + k, "whoosh", { dur: 0.25, gain: 0.18 }); A("dra", b + k, "squash", { amount: 0.08, dur: 0.15 }); }
A("dra", b + 1.0, "look", { to: [0, 0], dur: 0.12 }); A("dra", b + 1.0, "expr", { expr: "sad" });
A("dra", b + 1.1, "arm", { side: "R", pose: "rest", dur: 0.15 }); A("dra", b + 1.1, "arm", { side: "L", pose: "rest", dur: 0.15 });
free = leave("dra", b + 1.1);
queue("phx", b + 0.75);
prop("phone", b + 0.7, { scale: 1.5 }, 0); c.items.push({ who: "phx", do: "grab", prop: "phone", hand: "R", at: r3(b + 0.75), dur: 0.05, off: [0, 0, 0.03] });   // he walks in with it

// ---- 6. Phoenix: texts for help. A roll comes flying in from the door and bonks him
t = free;
c.beat("phx", t, "texts the family for help; a roll comes flying in and bonks him", "texts for help");
b = sitDown("phx", t); A("phx", b, "expr", { expr: "cocky" });
b = checkRoll("phx", b);

A("phx", b, "arm", { side: "R", pose: { o: [-0.05, 0.75, 0.3] }, dur: 0.2 }); A("phx", b + 0.05, "look", { to: [-0.1, -0.3], dur: 0.15 }); A("phx", b + 0.05, "expr", { expr: "eager" });
for (const k of [0.25, 0.4, 0.55]) { A("phx", b + k, "arm", { side: "R", pose: { o: [-0.03, 0.78, 0.3] }, dur: 0.07 }); A("phx", b + k + 0.07, "arm", { side: "R", pose: { o: [-0.05, 0.75, 0.3] }, dur: 0.08 }); sfx(b + k, "click", { gain: 0.15 }); }
prop("bonk", b + 0.7, { scale: 1.4 }, 0.01); prop("bonk", b + 0.7, { x: 0.05, y: 1.45, z: SEAT[1] + 0.05, roll: 540 }, 0.3, "in"); sfx(b + 0.65, "whoosh", { dur: 0.3, gain: 0.2 });
sfx(b + 1.0, "pop", { gain: 0.35 }); A("phx", b + 1.0, "squash", { amount: 0.15, dur: 0.2 }); A("phx", b + 1.0, "expr", { expr: "dizzy" }); fx(b + 1.0, { fx: "sparkle", who: "phx", dur: 0.6, color: "#ffe066" });
prop("bonk", b + 1.0, { x: 0.45, y: 0, z: SEAT[1] + 0.55, roll: 720 }, 0.35, "in"); c.items.at(-1).arc = 0.2;
free = leave("phx", b + 1.3); prop("phone", b + 2.4, { scale: 0 }, 0);
prop("bonk", b + 2.0, { scale: 0 }, 0.15); prop("bonk", b + 2.2, { x: 2.6, y: 1.5, z: -1.2, roll: 0 }, 0);
queue("gun", b + 0.95);

// ---- 7. Gunslinger: shoots the spare roll off the high shelf, catches it, blows the smoke away
t = free;
c.beat("gun", t, "shoots the spare roll down off the high shelf and catches it", "shoots it down");
b = sitDown("gun", t); A("gun", b, "expr", { expr: "stern" });
b = checkRoll("gun", b);
A("gun", b, "look", { to: [-0.6, 0.6], dur: 0.15 }); fx(b, { fx: "poof", pos: [SPARE[0], SPARE[1] + 0.15, SPARE[2]], dur: 0.3, puffs: 0, sparks: 8, spark: "#fff6c8" }); A("gun", b + 0.05, "arm", { side: "R", pose: { o: [0.05, 1.0, 0.25] }, dur: 0.15 });
fx(b + 0.3, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.3, "impact", { gain: 0.35 });
fx(b + 0.31, { fx: "poof", pos: [SPARE[0], SPARE[1] + 0.05, SPARE[2]], dur: 0.4, puffs: 2, sparks: 10, spark: "#ffd34d" });
prop("spare", b + 0.32, { x: LAP[0], y: LAP[1] + 0.2, z: LAP[2], roll: 540 }, 0.4, "in"); c.items.at(-1).arc = 0.35;
A("gun", b + 0.55, "arm", { side: "R", pose: "rest", dur: 0.15 }); A("gun", b + 0.55, "arm", { side: "L", pose: "hold", dur: 0.15 }); A("gun", b + 0.6, "look", { to: [0.15, -0.3], dur: 0.12 });
A("gun", b + 0.85, "expr", { expr: "smug" }); A("gun", b + 0.85, "look", { to: [0, 0], dur: 0.12 });
free = leave("gun", b + 1.2); A("gun", b + 1.2, "arm", { side: "L", pose: "rest", dur: 0.15 });
prop("spare", b + 1.2, { y: -0.5 }, 0.01); resetSpare(b + 1.8);
queue("sam", b + 0.7);

// ---- 8. Samurai: uses what's there. Three cuts: the shower curtain comes off in neat squares
t = free;
c.beat("sam", t, "uses what's there: cuts the shower curtain into neat squares", "uses the curtain");
b = sitDown("sam", t); A("sam", b, "expr", { expr: "serene" });
b = checkRoll("sam", b);
A("sam", b, "look", { to: [-0.8, 0], dur: 0.15 }); A("sam", b + 0.1, "arm", { side: "R", pose: "up", dur: 0.12 });
for (const k of [0.25, 0.4, 0.55]) { fx(b + k, { fx: "speedlines", dur: 0.1 }); sfx(b + k, "shing", { gain: 0.2 }); }
A("sam", b + 0.25, "arm", { side: "R", pose: "point", dur: 0.08 }); A("sam", b + 0.4, "arm", { side: "R", pose: "up", dur: 0.08 }); A("sam", b + 0.55, "arm", { side: "R", pose: "point", dur: 0.08 });
prop("curtain", b + 0.6, { cut: 1 }, 0.6, "linear");
A("sam", b + 0.85, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("sam", b + 0.9, "look", { to: [0, 0], dur: 0.15 }); A("sam", b + 0.95, "expr", { expr: "kind" });
free = leave("sam", b + 1.15);
fx(b + 1.7, { fx: "poof", pos: [-1.1, 1.2, -1.1], dur: 0.5, puffs: 6, sparks: 4 }); prop("curtain", b + 1.75, { cut: 0 }, 0);
queue("all", b + 0.8);

// ---- 9. Allfather: the dad. "WHO used the last roll?!": a roar that shakes the house
t = free;
c.beat("all", t, "the dad: WHO USED THE LAST ROLL? a roar that shakes the house", "who used the last roll?!");
b = sitDown("all", t); A("all", b, "expr", { expr: "kind" });
b = checkRoll("all", b);
A("all", b, "look", { to: [0, 0], dur: 0.12 }); A("all", b, "expr", { expr: "stern" }); A("all", b + 0.05, "arm", { side: "R", pose: "rest", dur: 0.15 });
A("all", b + 0.2, "squash", { amount: -0.08, dur: 0.15 }); A("all", b + 0.25, "arm", { side: "both", pose: "fist", dur: 0.12 });
fx(b + 0.3, { fx: "alert", who: "all", dur: 0.8, text: "?!" }); fx(b + 0.3, { fx: "shake", dur: 0.6, amp: 0.05 }); fx(b + 0.3, { fx: "flash", dur: 0.15, peak: 0.3 });
sfx(b + 0.3, "impact", { gain: 0.4 }); sfx(b + 0.35, "creak", { dur: 0.5, gain: 0.25 });
for (const [k, s] of [[0.35, 0.95], [0.45, 1.05], [0.55, 1]]) prop("spare", b + k, { scale: 1.4 * s }, 0.08);   // things rattle
A("all", b + 1.05, "arm", { side: "both", pose: "hips", dur: 0.2 }); A("all", b + 1.05, "expr", { expr: "smug" });
free = leave("all", b + 1.2);
queue("vik", b + 0.9);

// ---- 10. Viking: hits the empty holder so hard the toilet cracks in two... then sits on the wreck, pleased
t = free;
c.beat("vik", t, "bangs the empty holder in frustration: the toilet cracks in two", "bangs the holder");
b = sitDown("vik", t); A("vik", b, "expr", { expr: "kind" });
b = checkRoll("vik", b);
A("vik", b, "expr", { expr: "stern" }); A("vik", b + 0.05, "arm", { side: "R", pose: "up", dur: 0.15 });
A("vik", b + 0.3, "arm", { side: "R", pose: REACH, dur: 0.08 });
prop("holder", b + 0.36, { x: HOLDER[0] - 0.3, y: 0, z: -1.2, roll: 90 }, 0.3, "in"); c.items.at(-1).arc = 0.2;
prop("toilet", b + 0.4, { smash: 1 }, 0.15, "out"); A("vik", b + 0.4, "drop", { to: 0.05, dur: 0.15 });
fx(b + 0.4, { fx: "shake", dur: 0.35, amp: 0.06 }); sfx(b + 0.38, "impact", { gain: 0.45 }); sfx(b + 0.42, "creak", { dur: 0.35, gain: 0.3 });
fx(b + 0.45, { fx: "poof", pos: [0, 0.3, SEAT[1] + 0.2], dur: 0.7, puffs: 9, sparks: 10, color: "#f4f4f0", spark: "#ffe08a" });
A("vik", b + 0.75, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("vik", b + 0.85, "expr", { expr: "smug" });
c.clipOk("vik", "holder", b, b + 3);

// ---- the loop: a poof, a new toilet and an empty holder; the Astronaut sits down: frame 0
const fresh = b + 1.35;
queue("ast", fresh - 0.4);
A("ast", fresh - 0.5, "move", { to: ENTER, dur: 0.01 }); A("ast", fresh - 0.5, "expr", { expr: "kind" }); A("ast", fresh - 0.5, "arm", { side: "L", pose: "rest", dur: 0.01 });
fx(fresh, { fx: "poof", pos: [0, 0.6, SEAT[1] + 0.3], dur: 0.6, puffs: 10, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop("toilet", fresh + 0.08, { smash: 0 }, 0);
prop("holder", fresh + 0.08, { x: HOLDER[0], y: HOLDER[1], z: HOLDER[2], roll: 0, spin: 0, rot: -90 }, 0);
const astIn = sitDown("ast", fresh + 0.2);
const end = astIn + 0.2;
A("ast", end - 0.1, "arm", { side: "R", pose: REACH, dur: 0.15 }); fx(end - 0.1, { fx: "alert", who: "ast", dur: 0.55, text: "?" }); A("ast", end - 0.1, "look", { to: [-0.7, 0.1], dur: 0.12 });
prop("holder", end - 0.1, { spin: 0 }, 0.01);

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [-0.35, 1.1, 3.7], look: [-0.35, 0.95, -1.5], fov: 38 },
  title: "NO PAPER", hook: "0 paper. 10 fighters.", hookTo: 1.0, askAt: b + 0.5, cover: t + 0.85,
  file: new URL("./toilet-01-no-paper.json", import.meta.url),
});
