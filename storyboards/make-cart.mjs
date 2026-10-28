// CART: "the shopping-cart test: does each fighter put their trolley back?", the "same task, each fighter their own way"
// format (Jonny's rules, 2026-10-24): one supermarket car park, one trolley bay. Each fighter pushes an empty trolley
// out of the shop and deals with it the way a type of real shopper does (docs/each-activities.md), in their signature
// way. One continuous take from the pavement. Frame 0 is the Astronaut rolling his trolley into the bay; the last frame
// sets that up again.
//   node storyboards/make-cart.mjs   ->  storyboards/cart-01-put-it-back.json
import { clip } from "./each-lib.mjs";

const CORRAL = [-1.05, -0.85], SLOT = (n) => [CORRAL[0] - 0.55 + n * 0.2, CORRAL[1]];   // where the n-th trolley nests
const MID = [0.45, -0.55], CART_AT = (x) => x - 0.55;   // a pusher at x has the trolley 0.55 to their left
const WAIT = [2.45, -0.55], ENTER = [3.35, -0.55], OUT = [0.15, -0.15], EXIT = [-2.9, -0.15], BACK = [1.3, 1.6];   // BACK: off the right edge, towards the camera (clear of the queue)
const PUSH = { o: [0.0, 0.42, 0.4] };   // both hands forward on the handle
const c = clip({
  id: "cart-01-put-it-back", title: "CART: does each fighter put the trolley back?",
  format: "each-character-vs-X, one continuous take: fighters take turns bringing a trolley back to one trolley bay, each their own way",
  set: { type: "street", parking: true },
  props: [
    { id: "corral", kind: "corral", x: CORRAL[0], z: CORRAL[1], count: 2, sign: 0.55 },
    { id: "car", kind: "car", x: 1.0, z: -1.7, rot: -90, color: "#5cbf55" },
    { id: "car2", kind: "car", x: -0.9, z: -2.75, rot: 90, color: "#e9a23b" },
    ...[0, 1, 2, 3].map((i) => ({ id: `c${i}`, kind: "cart", x: ENTER[0] - 0.55, z: ENTER[1], rot: -90, scale: i ? 0 : 1 })),
    ...[[-0.65, -0.2, 30], [0.65, -1.05, -60], [-0.3, 0.3, 120], [-0.1, -0.55, -90]].map(([x, z, rot], i) => ({ id: `w${i}`, kind: "cart", x, z, rot, y: i === 3 ? 0.72 : 0, scale: 0, color: "#c98bff" })),
  ],
});
const { A, prop, fx, sfx, walk } = c;
let nested = 2;
const nestIn = (cart, t, dur = 0.4) => {   // roll it into the next free slot in the bay; it becomes part of the bay's row
  const [x, z] = SLOT(nested);
  prop(cart, t, { x: x + 0.2, z, rot: -90 }, dur, "out"); nested++; prop("corral", t + dur, { count: nested }, 0.01); prop(cart, t + dur, { scale: 0 }, 0.01);
  sfx(t + dur - 0.05, "click", { gain: 0.3 }); sfx(t + dur - 0.05, "tink", { gain: 0.15 });
  return t + dur;
};

// ---- pieces every turn uses
const queue = (who, cart, t) => {   // out of the shop with an empty trolley, waits just off screen
  prop(cart, t - 0.03, { x: CART_AT(ENTER[0]), z: ENTER[1], y: 0, rot: -90, scale: 1, smash: 0, bump: 0, roll: 0 }, 0);
  A(who, t, "show"); A(who, t, "turn", { to: "left", dur: 0.01 }); A(who, t, "arm", { side: "both", pose: PUSH, dur: 0.01 });
  walk(who, t, WAIT, 0.5, "out"); prop(cart, t, { x: CART_AT(WAIT[0]) }, 0.5, "out");
};
const pushIn = (who, cart, t, to = MID) => {   // pushes it in to the middle of the pavement
  walk(who, t, to, 0.5, "inOut", 3); prop(cart, t, { x: CART_AT(to[0]), z: to[1] }, 0.5, "inOut"); sfx(t, "creak", { dur: 0.4, gain: 0.08 });
  return t + 0.5;
};
const letGo = (who, t) => { A(who, t, "arm", { side: "both", pose: "rest", dur: 0.2 }); A(who, t, "turn", { to: "camera", dur: 0.15 }); return t + 0.2; };
const leave = (who, t, dur = 0.55) => {
  A(who, t, "turn", { to: "left", dur: 0.15 }); A(who, t, "look", { to: [0, 0], dur: 0.12 }); A(who, t, "arm", { side: "both", pose: "rest", dur: 0.2 });
  walk(who, t + 0.05, OUT, 0.3, "out", 2); walk(who, t + 0.35, EXIT, dur, "linear"); A(who, t + 0.35 + dur, "hide");
  return t + 0.35;
};
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "all", "sam", "vik"];
c.cast("ast", MID, { expr: "kind" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
for (const id of order) for (const p of ["c0", "c1", "c2", "c3", "corral", "w0", "w1", "w2", "w3"]) c.clipOk(id, p);
for (const a of ["c0", "c1", "c2", "c3"]) for (const b of ["corral", "c0", "c1", "c2", "c3", "w0", "w1", "w2", "w3"]) if (a !== b) c.clipOk(a, b);

// ---- 1. Astronaut: the good citizen. Straight into the bay, nested neatly, a little salute
// (frame 0: him pushing it the last stretch; the last frame matches)
const start = (t) => {
  A("ast", t, "move", { to: [MID[0] - 0.35, MID[1]], dur: 0.01 }); A("ast", t, "turn", { to: "left", dur: 0.01 }); A("ast", t, "arm", { side: "both", pose: PUSH, dur: 0.01 });
  prop("c0", t, { x: CART_AT(MID[0] - 0.35), z: MID[1], rot: -90, scale: 1, y: 0, smash: 0, bump: 0, roll: 0 }, 0.01);
};
start(-0.3);
c.beat("ast", 0, "the good citizen: straight back into the bay, nested neatly", "puts it back");
const [sx, sz] = SLOT(nested);
walk("ast", -0.3, [sx + 0.2 + 0.55, MID[1]], 0.75, "out", 4); prop("c0", -0.3, { x: sx + 0.2 + 0.0, z: MID[1] }, 0.75, "out");
prop("c0", 0.45, { z: sz }, 0.15); nested++; prop("corral", 0.6, { count: nested }, 0.01); prop("c0", 0.6, { scale: 0 }, 0.01); sfx(0.55, "click", { gain: 0.3 });
let t = letGo("ast", 0.6); A("ast", t, "expr", { expr: "delighted" }); A("ast", t, "arm", { side: "R", pose: "up", dur: 0.15 }); fx(t, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(t, "tink", { gain: 0.25 });
queue("rea", "c1", 0.6);
let free = leave("ast", t + 0.45);

// ---- 2. Reaper: doesn't care. Lets go in the middle of the pavement, looks at us, walks off
const REA_CART = [0.05, -0.05];
walk("rea", free - 0.2, [0.65, -0.25], 0.5, "inOut", 3); prop("c1", free - 0.2, { x: REA_CART[0], z: REA_CART[1], rot: -70 }, 0.5, "inOut"); sfx(free - 0.2, "creak", { dur: 0.4, gain: 0.08 });
t = free + 0.3;
c.beat("rea", free - 0.2, "doesn't care: leaves it in the middle of the pavement, shrugs and goes back to the shop", "leaves it there");
t = letGo("rea", t); A("rea", t, "expr", { expr: "deadpan" }); A("rea", t + 0.1, "look", { to: [0, 0], dur: 0.12 });
A("rea", t + 0.15, "arm", { side: "both", pose: "up", dur: 0.2 }); A("rea", t + 0.5, "arm", { side: "both", pose: "rest", dur: 0.2 }); A("rea", t + 0.7, "blink", { dur: 0.2 });
A("rea", t + 0.9, "turn", { to: "right", dur: 0.15 }); walk("rea", t + 0.95, BACK, 0.55, "in", 3); A("rea", t + 1.5, "hide");
queue("sor", "c2", t + 0.9);
free = t + 1.2;

// ---- 3. Sorcerer: never walks to the bay. Floats his trolley and the Reaper's in from where he stands
t = pushIn("sor", "c2", free - 0.15);
c.beat("sor", free - 0.15, "never walks to the bay: floats his trolley in, and the one left lying around", "floats it back");
t = letGo("sor", t); A("sor", t, "expr", { expr: "smug" }); A("sor", t, "arm", { side: "L", pose: "cast", dur: 0.15 }); A("sor", t, "charge", { to: 1, dur: 0.15 });
sfx(t + 0.05, "charge", { dur: 0.9, gain: 0.2 });
for (const [i, cart] of [[0, "c1"], [1, "c2"]].map(([i, k]) => [i, k])) {
  const u = t + 0.1 + i * 0.35;
  fx(u, { fx: "poof", pos: i ? [CART_AT(MID[0]), 0.4, MID[1]] : [REA_CART[0], 0.4, REA_CART[1]], dur: 0.4, puffs: 2, sparks: 10, color: "#c9f7b0", spark: "#9dff6a" });
  prop(cart, u, { y: 0.35 }, 0.2, "out"); nestIn(cart, u + 0.15, 0.45);
}
A("sor", t + 1.0, "charge", { to: 0, dur: 0.15 }); A("sor", t + 1.0, "arm", { side: "L", pose: "rest", dur: 0.2 }); fx(t + 1.0, { fx: "sparkle", who: "sor", dur: 0.5 });
queue("wiz", "c0", t + 0.5);
free = leave("sor", t + 1.2);

// ---- 4. Wizard: a spell to send it back... and now there are five trolleys
t = pushIn("wiz", "c0", free - 0.15);
c.beat("wiz", free - 0.15, "a spell to send it back multiplies it: five trolleys", "the spell goes wrong");
t = letGo("wiz", t); A("wiz", t, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t, "charge", { to: 0.7, dur: 0.15 }); A("wiz", t, "expr", { expr: "stern" });
fx(t + 0.2, { fx: "poof", pos: [0.0, 0.5, -0.5], dur: 0.6, puffs: 10, sparks: 12, spark: "#c8b6ff" }); sfx(t + 0.2, "poof", { gain: 0.3 });
for (let i = 0; i < 4; i++) { prop(`w${i}`, t + 0.25 + i * 0.06, { scale: 1 }, 0.15, "out"); sfx(t + 0.3 + i * 0.06, "pop", { gain: 0.15 }); }
A("wiz", t + 0.35, "charge", { to: 0, dur: 0.15 }); A("wiz", t + 0.4, "expr", { expr: "shocked" }); A("wiz", t + 0.4, "arm", { side: "R", pose: "rest", dur: 0.2 });
A("wiz", t + 0.8, "expr", { expr: "sad" }); A("wiz", t + 0.8, "droop", { to: 1, dur: 0.25 });
queue("dra", "c3", t + 0.4);
A("wiz", t + 1.1, "droop", { to: 0, dur: 0.15 });
free = leave("wiz", t + 1.15);
fx(free + 0.1, { fx: "poof", pos: [0.0, 0.5, -0.5], dur: 0.5, puffs: 12, sparks: 6 });
for (let i = 0; i < 4; i++) prop(`w${i}`, free + 0.15, { scale: 0 }, 0.01);
prop("c0", free + 0.15, { scale: 0 }, 0.01);

// ---- 5. Dragon: rides it. Hops in, one fire snort for a boost, straight into the bay (more or less)
// (he hops in while still off screen and comes in riding it, a fire-snort boost behind him all the way across)
A("dra", free - 0.4, "arm", { side: "both", pose: "rest", dur: 0.15 }); A("dra", free - 0.4, "ride", { prop: "c3", off: [0, 0.32, 0.02], yaw: 90, sit: true, dur: 0.25 });
t = free;
c.beat("dra", free, "rides it back: comes in sitting in it, a fire-snort boost, straight into the bay", "rides it");
A("dra", t, "expr", { expr: "delighted" }); fx(t, { fx: "speedlines", dur: 0.6 }); sfx(t, "whoosh", { dur: 0.5, gain: 0.3 });
const [dx, dz] = SLOT(nested);
prop("c3", t, { x: dx + 0.35, z: dz + 0.1, rot: -80 }, 0.75, "in");
for (const [u, x] of [[0.3, 1.25], [0.5, 0.75]]) fx(t + u, { fx: "poof", pos: [x, 0.55, MID[1]], dur: 0.4, puffs: 3, sparks: 10, color: "#ffc27a", spark: "#ff7a1a" });
const crash = t + 0.75;
sfx(crash, "impact", { gain: 0.4 }); fx(crash, { fx: "shake", dur: 0.25, amp: 0.04 }); prop("c3", crash, { bump: 1 }, 0.05); prop("c3", crash + 0.25, { bump: 0 }, 0.1);
A("dra", crash, "expr", { expr: "dizzy" }); fx(crash + 0.05, { fx: "sparkle", who: "dra", dur: 0.6, color: "#ffe066" });
A("dra", crash + 0.5, "ride", { prop: null }); A("dra", crash + 0.5, "drop", { to: 0, dur: 0.25 });
prop("c3", crash + 0.55, { x: dx + 0.2, z: dz, rot: -90 }, 0.2); nested++; prop("corral", crash + 0.75, { count: nested }, 0.01); prop("c3", crash + 0.75, { scale: 0 }, 0.01);
queue("phx", "c1", crash);
free = leave("dra", crash + 0.85);

// ---- 6. Phoenix: close enough. Leaves it by the kerb, struts off; it rolls away behind him
t = pushIn("phx", "c1", free - 0.15, [MID[0] + 0.25, MID[1]]);
c.beat("phx", free - 0.15, "close enough: leaves it by the kerb and struts off; it rolls away", "close enough");
t = letGo("phx", t); A("phx", t, "expr", { expr: "cocky" }); A("phx", t, "arm", { side: "R", pose: "hat", dur: 0.15 }); fx(t + 0.1, { fx: "sparkle", who: "phx", dur: 0.5 });
A("phx", t + 0.4, "arm", { side: "R", pose: "rest", dur: 0.15 });
prop("c1", t + 0.9, { x: 0.55, z: -1.3, rot: -40 }, 1.0, "in"); sfx(t + 0.95, "creak", { dur: 0.8, gain: 0.12 });
const bonk = t + 1.9; prop("car", bonk, { bump: 1 }, 0.06); prop("car", bonk + 0.06, { bump: 0 }, 0.3); prop("c1", bonk, { bump: 1 }, 0.05); prop("c1", bonk + 0.1, { bump: 0 }, 0.15); sfx(bonk, "tink", { gain: 0.3 }); sfx(bonk, "impact", { gain: 0.15 });
queue("gun", "c2", t + 0.3);
free = leave("phx", t + 0.5);

// ---- 7. Gunslinger: shoots it home. Bang, bang, bang: it hops into the bay
t = pushIn("gun", "c2", free, [MID[0] + 0.25, MID[1]]);
c.beat("gun", free, "shoots it home: every shot knocks it closer to the bay", "shoots it back");
t = letGo("gun", t); A("gun", t, "expr", { expr: "stern" }); A("gun", t + 0.05, "arm", { side: "R", pose: "point", dur: 0.12 }); A("gun", t + 0.05, "look", { to: [-0.5, -0.2], dur: 0.12 });
const [gx, gz] = SLOT(nested);
const from = CART_AT(MID[0] + 0.25), steps = [from + (gx + 0.2 - from) * 0.35, from + (gx + 0.2 - from) * 0.7];
steps.forEach((x, i) => { const u = t + 0.25 + i * 0.3; fx(u, { fx: "flash", dur: 0.06, peak: 0.2 }); sfx(u, "impact", { gain: 0.3 }); prop("c2", u, { x, y: 0.12, rot: -90 + (i ? 8 : -8) }, 0.1, "out"); prop("c2", u + 0.1, { y: 0 }, 0.12, "in"); fx(u, { fx: "poof", pos: [x + 0.25, 0.5, MID[1]], dur: 0.3, puffs: 1, sparks: 8, spark: "#ffd34d" }); });
fx(t + 0.85, { fx: "flash", dur: 0.06, peak: 0.2 }); sfx(t + 0.85, "impact", { gain: 0.3 }); prop("c2", t + 0.85, { z: gz, rot: -90 }, 0.1); nestIn("c2", t + 0.85, 0.25);
A("gun", t + 1.15, "arm", { side: "R", pose: "rest", dur: 0.15 }); A("gun", t + 1.15, "look", { to: [0, 0], dur: 0.12 }); A("gun", t + 1.2, "expr", { expr: "smug" });
queue("all", "c0", t + 0.6);
free = leave("gun", t + 1.4);

// ---- 8. Allfather: puts it back, then turns and points at you. Do you?
t = pushIn("all", "c0", free - 0.15);
c.beat("all", free - 0.15, "puts it back properly, then turns to you: do you?", "puts it back. Do you?");
A("all", t, "expr", { expr: "focused" });
const [ax] = SLOT(nested);
walk("all", t, [ax + 0.2 + 0.6, MID[1]], 0.5, "inOut", 3); prop("c0", t, { x: ax + 0.25 }, 0.5, "inOut"); prop("c0", t + 0.45, { z: CORRAL[1] }, 0.1);
nested++; prop("corral", t + 0.55, { count: nested }, 0.01); prop("c0", t + 0.55, { scale: 0 }, 0.01); sfx(t + 0.5, "click", { gain: 0.3 });
t = letGo("all", t + 0.55); walk("all", t, [0.1, -0.1], 0.25, "inOut", 2); t += 0.25;   // into the middle, towards us
A("all", t, "turn", { to: "camera", dur: 0.12 }); A("all", t, "expr", { expr: "stern" }); A("all", t + 0.05, "arm", { side: "R", pose: { o: [0.05, 0.6, 0.55] }, dur: 0.15 });   // pointing straight at us
fx(t + 0.1, { fx: "alert", who: "all", text: "?", dur: 0.9 }); A("all", t + 0.7, "blink", { dur: 0.2 });
A("all", t + 0.95, "arm", { side: "R", pose: "rest", dur: 0.15 });
queue("sam", "c3", t + 0.2);
free = leave("all", t + 1.05);

// ---- 9. Samurai: only came for the coin. One cut at the lock, the coin's out, the trolley stays where it is
t = pushIn("sam", "c3", free - 0.2);
c.beat("sam", free - 0.2, "only wants his coin back: one cut at the lock, and he leaves the trolley", "gets his coin back");
t = letGo("sam", t); A("sam", t, "expr", { expr: "serene" }); A("sam", t + 0.05, "arm", { side: "R", pose: "up", dur: 0.12 });
A("sam", t + 0.3, "arm", { side: "R", pose: "point", dur: 0.08 }); fx(t + 0.3, { fx: "speedlines", dur: 0.12 }); fx(t + 0.32, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.32, "shing", { gain: 0.25 });
fx(t + 0.4, { fx: "alert", who: "sam", text: "€1", color: "#e0a800", dur: 0.7 }); sfx(t + 0.4, "tink", { gain: 0.3 });
A("sam", t + 0.45, "arm", { side: "L", pose: "up", dur: 0.15 }); A("sam", t + 0.5, "expr", { expr: "kind" }); A("sam", t + 0.75, "arm", { side: "L", pose: "rest", dur: 0.15 }); A("sam", t + 0.6, "arm", { side: "R", pose: "rest", dur: 0.15 });
queue("vik", "c2", t + 0.2);
free = leave("sam", t + 0.9);

// ---- 10. Viking: puts it back the Viking way. Rams the Samurai's trolley into the bay: the bay is gone
t = free - 0.2;
c.beat("vik", t, "puts it back the Viking way: rams it into the bay, and the bay is gone", "puts it back hard");
prop("c2", t - 0.05, { scale: 0 }, 0.01);   // (he lets his own go off screen)
A("vik", t, "arm", { side: "both", pose: "rest", dur: 0.01 }); walk("vik", t, [MID[0] + 0.1, MID[1]], 0.45, "inOut", 3); A("vik", t + 0.45, "turn", { to: "left", dur: 0.1 });
A("vik", t + 0.5, "expr", { expr: "stern" }); A("vik", t + 0.5, "arm", { side: "both", pose: PUSH, dur: 0.15 });
A("vik", t + 0.65, "squash", { amount: 0.1, dur: 0.15 });
walk("vik", t + 0.75, [CORRAL[0] + 1.35, MID[1]], 0.3, "in", 3); prop("c3", t + 0.75, { x: CORRAL[0] + 0.8 }, 0.3, "in"); fx(t + 0.75, { fx: "speedlines", dur: 0.3 });
const hit = t + 1.05;
sfx(hit, "impact", { gain: 0.55 }); fx(hit, { fx: "shake", dur: 0.4, amp: 0.07 }); fx(hit, { fx: "flash", dur: 0.08, peak: 0.3 });
fx(hit, { fx: "poof", pos: [CORRAL[0] + 0.5, 0.5, CORRAL[1]], dur: 0.6, puffs: 10, sparks: 14, color: "#e9e4d8", spark: "#ffe08a" });
prop("corral", hit, { smash: 1 }, 0.3, "out"); prop("c3", hit, { smash: 0.6, y: 0.3, roll: 40, x: CORRAL[0] + 0.6 }, 0.25, "out"); prop("c3", hit + 0.25, { y: 0 }, 0.2, "in");
A("vik", hit + 0.15, "turn", { to: "camera", dur: 0.15 }); A("vik", hit + 0.2, "arm", { side: "both", pose: "up", dur: 0.2 }); A("vik", hit + 0.2, "expr", { expr: "delighted" });
const vikDone = hit + 0.2;

// ---- the loop: a poof mends the bay; the Astronaut is pushing his trolley in again: frame 0
const fresh = vikDone + 0.75;
fx(fresh, { fx: "poof", pos: [-0.5, 0.5, -0.7], dur: 0.45, puffs: 14, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop("c3", fresh + 0.08, { scale: 0 }, 0.01); prop("c1", fresh + 0.08, { scale: 0 }, 0.01);
prop("corral", fresh + 0.08, { smash: 0, count: 2 }, 0.01); nested = 2;
start(fresh + 0.05); A("ast", fresh + 0.1, "show");
const end = fresh + 0.3 + 0.3;
walk("ast", end - 0.3, [SLOT(2)[0] + 0.2 + 0.55, MID[1]], 0.75, "out", 4); prop("c0", end - 0.3, { x: SLOT(2)[0] + 0.2 }, 0.75, "out");

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 1.6, 4.5], look: [0, 0.5, -0.8], fov: 46 },
  title: "CART", hook: "Put the trolley back?", hookTo: 0.9, hookLabel: true, askAt: vikDone + 0.1, cover: hit + 0.2,
  file: new URL("./cart-01-put-it-back.json", import.meta.url),
});
