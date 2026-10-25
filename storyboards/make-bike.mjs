// BIKE: "one puddle on the bike path: how each fighter rides through it", the "same task, each fighter their own way"
// format (Jonny's rules, 2026-10-24): one park, one bike path, one puddle in the middle of it. Each fighter rides in
// from the right on their own bike and gets past the puddle the way a type of real cyclist does
// (docs/each-activities.md), in their signature way. One continuous take from the grass beside the path. Frame 0 is
// the Astronaut riding in, signalling; the last frame sets that up again.
//   node storyboards/make-bike.mjs   ->  storyboards/bike-01-puddle.json
import { clip } from "./each-lib.mjs";

const LANE = -0.65, PUD = [0, LANE], ENTER = 2.7, EXIT = -2.9;
const RIDE = { off: [0, 0.36, -0.16], yaw: 50, sit: true };   // on the saddle, turned 40 degrees towards us
const BARS = { o: [0.12, 0.5, 0.32] };                      // both hands forward on the handlebar
const TURN = 1.257;                                          // metres per wheel turn (2 pi r, r 0.2)
const COLOR = { ast: "#e8eef5", rea: "#2b2b33", sor: "#7a4fd0", wiz: "#3b4fa8", dra: "#e8742a", phx: "#e84a2f", gun: "#8a5a34", all: "#c9a227", sam: "#3aa35c", vik: "#b8322a" };
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "all", "sam", "vik"];
const c = clip({
  id: "bike-01-puddle", title: "BIKE: how each fighter rides through a puddle",
  format: "each-character-vs-X, one continuous take: fighters ride along one bike path with a puddle on it, each gets past it their own way",
  set: { type: "park" },
  props: [
    { id: "puddle", kind: "puddle", x: PUD[0], z: PUD[1], rot: 90, scale: 1.5 },
    ...order.map((id) => ({ id: `b_${id}`, kind: "bike", color: COLOR[id], x: ENTER, z: LANE, rot: -90, scale: id === "ast" ? 1 : 0 })),
    { id: "kid", kind: "bike", color: "#ff7ab8", training: true, x: ENTER, z: LANE, rot: -90, scale: 0 },
    { id: "uni", kind: "bike", color: COLOR.vik, uni: true, x: ENTER, z: LANE, rot: -90, scale: 0 },
  ],
});
const { A, prop, fx, sfx, walk } = c;

// ---- the bikes: where each one is and how far its wheels have turned, so the wheels roll with the travel
const B = {};
const place = (id, t, x, z = LANE, set = {}) => { B[id] = { x, z, spin: 0 }; prop(id, t, { x, z, y: 0, rot: -90, scale: 1, spin: 0, roll: 0, wheelie: 0, broken: 0, ...set }, 0.01); };
const roll = (id, t, x, dur, ease = "linear", set = {}) => {
  const b = B[id], d = Math.hypot(x - b.x, (set.z ?? b.z) - b.z);
  b.spin += d / TURN * (set.scale ? 1 / set.scale : 1); b.x = x; if (set.z != null) b.z = set.z;
  prop(id, t, { x, spin: b.spin, ...set }, dur, ease);
};
const mount = (who, id, t, o = {}) => { A(who, t, "ride", { prop: id, ...RIDE, dur: 0.01, ...o }); A(who, t, "arm", { side: "both", pose: BARS, dur: 0.01 }); };
// out of sight at the right, already on the bike
const ready = (who, t) => { place(`b_${who}`, t, ENTER); A(who, t, "show"); mount(who, `b_${who}`, t + 0.02); };
// gone at the left: the rider and the bike are hidden once they're off screen
const away = (who, id, t, dur = 0.6) => { roll(id, t, EXIT, dur, "in"); A(who, t + dur, "hide"); prop(id, t + dur, { scale: 0 }, 0.01); return t + dur; };
const splash = (t, big = 1) => { prop("puddle", t, { splash: 1 }, 0.45 * big, "out"); prop("puddle", t + 0.45 * big, { splash: 0 }, 0.01); sfx(t, "splash", { gain: 0.25 * big }); };

c.cast("ast", [1.0, LANE], { expr: "kind" });
for (const id of order.slice(1)) c.cast(id, [ENTER, LANE], { hidden: true });
for (const id of order) for (const p of ["puddle", "kid", "uni", ...order.map((o) => `b_${o}`)]) c.clipOk(id, p);

// ---- 1. Astronaut: the safe one. Signals, steers neatly round the puddle, a thumbs up
// (frame 0: riding in signalling; the last frame matches)
const start = (t) => {
  place("b_ast", t, 0.85); mount("ast", "b_ast", t + 0.01);
  A("ast", t + 0.02, "arm", { side: "R", pose: "point", dur: 0.01 }); A("ast", t, "expr", { expr: "kind" });
};
start(-0.3);
c.beat("ast", 0, "the safe one: signals, steers neatly round the puddle", "signals every turn");
roll("b_ast", -0.27, 0.6, 0.27);
roll("b_ast", 0, 0.0, 0.55, "linear", { z: LANE + 0.5, rot: -70 }); A("ast", 0.65, "arm", { side: "R", pose: BARS, dur: 0.15 });
roll("b_ast", 0.55, -0.75, 0.5, "linear", { z: LANE, rot: -110 }); prop("b_ast", 1.05, { rot: -90 }, 0.15);
A("ast", 0.7, "expr", { expr: "delighted" }); fx(0.75, { fx: "sparkle", who: "ast", dur: 0.5 }); sfx(0.75, "tink", { gain: 0.2 });
ready("rea", 0.6);
away("ast", "b_ast", 1.05, 0.5);

// ---- 2. Reaper: doesn't care. Rides slowly straight into it, stops in the middle, looks at us, rides on
let t = 1.3;
c.beat("rea", t, "doesn't care: rides slowly straight in, stops in the middle of it, rides on", "straight through");
roll("b_rea", t, 0.05, 0.9, "out"); A("rea", t, "expr", { expr: "deadpan" });
splash(t + 0.6, 0.6);
A("rea", t + 0.9, "look", { to: [0, 0], dur: 0.12 }); A("rea", t + 1.1, "blink", { dur: 0.2 });
ready("sor", t + 1.0);
roll("b_rea", t + 1.3, -0.9, 0.6, "in"); splash(t + 1.3, 0.5);
let free = away("rea", "b_rea", t + 1.9, 0.5) - 0.5;

// ---- 3. Sorcerer: the e-bike. Doesn't pedal: arms folded, the bike floats over the puddle on its own
t = free;
c.beat("sor", t, "the e-bike: never pedals, the bike floats him over it", "doesn't pedal");
roll("b_sor", t, 0.7, 0.45, "out"); A("sor", t + 0.3, "expr", { expr: "smug" }); A("sor", t + 0.35, "arm", { side: "both", pose: "hips", dur: 0.2 });
A("sor", t + 0.4, "charge", { to: 1, dur: 0.15 }); sfx(t + 0.4, "charge", { dur: 0.8, gain: 0.2 }); fx(t + 0.45, { fx: "poof", pos: [0.7, 0.15, LANE], dur: 0.4, puffs: 2, sparks: 10, color: "#c9f7b0", spark: "#9dff6a" });
prop("b_sor", t + 0.45, { y: 0.42 }, 0.3, "out"); prop("b_sor", t + 0.5, { x: -0.8 }, 0.9, "inOut"); B.b_sor.x = -0.8;   // (the wheels stand still: he never pedals)
A("sor", t + 0.9, "look", { to: [0, 0], dur: 0.12 });
prop("b_sor", t + 1.25, { y: 0 }, 0.2, "in"); A("sor", t + 1.4, "charge", { to: 0, dur: 0.15 }); fx(t + 1.4, { fx: "sparkle", who: "sor", dur: 0.5 });
ready("wiz", t + 0.9);
free = away("sor", "b_sor", t + 1.45, 0.5) - 0.45;

// ---- 4. Wizard: a spell to jump it shrinks his bike to a kid's bike with training wheels. Wobbles through, soaked
t = free;
c.beat("wiz", t, "a spell to jump the puddle: his bike becomes a kid's bike", "the spell goes wrong");
roll("b_wiz", t, 0.7, 0.45, "out"); A("wiz", t + 0.45, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t + 0.45, "charge", { to: 0.7, dur: 0.15 }); A("wiz", t + 0.45, "expr", { expr: "stern" });
const swap = t + 0.75;
fx(swap, { fx: "poof", pos: [0.7, 0.5, LANE], dur: 0.6, puffs: 10, sparks: 12, spark: "#c8b6ff" }); sfx(swap, "poof", { gain: 0.3 });
prop("b_wiz", swap + 0.05, { scale: 0 }, 0.01); place("kid", swap + 0.05, 0.7, LANE, { scale: 0.6 });
A("wiz", swap + 0.05, "ride", { prop: "kid", off: [0, 0.2, -0.1], yaw: 50, sit: true, dur: 0.15 }); A("wiz", swap + 0.05, "charge", { to: 0, dur: 0.15 });
A("wiz", swap + 0.1, "arm", { side: "both", pose: { o: [0.12, 0.3, 0.3] }, dur: 0.15 }); A("wiz", swap + 0.2, "expr", { expr: "shocked" });
roll("kid", swap + 0.4, 0.05, 0.9, "out", { scale: 0.6 }); splash(swap + 0.9, 0.5);
A("wiz", swap + 1.2, "expr", { expr: "sad" }); A("wiz", swap + 1.2, "droop", { to: 1, dur: 0.25 });
ready("dra", swap + 0.9);
roll("kid", swap + 1.25, -0.7, 0.6, "in", { scale: 0.6 });
free = away("wiz", "kid", swap + 1.85, 0.55) - 0.5;
A("wiz", free + 0.5, "droop", { to: 0, dur: 0.01 });

// ---- 5. Dragon: the show-off. A wheelie, a fire-snort boost, and he jumps the whole puddle
t = free;
c.beat("dra", t, "the show-off: a wheelie, a fire boost, jumps the whole puddle", "pulls a wheelie");
roll("b_dra", t, 0.75, 0.4, "out"); A("dra", t + 0.3, "expr", { expr: "eager" });
prop("b_dra", t + 0.4, { wheelie: 1 }, 0.2, "out"); A("dra", t + 0.4, "pitch", { to: -12, dur: 0.2 });
fx(t + 0.55, { fx: "poof", pos: [1.2, 0.5, LANE], dur: 0.45, puffs: 3, sparks: 12, color: "#ffc27a", spark: "#ff7a1a" }); sfx(t + 0.55, "whoosh", { dur: 0.4, gain: 0.3 }); fx(t + 0.55, { fx: "speedlines", dur: 0.4 });
A("dra", t + 0.55, "expr", { expr: "delighted" });
roll("b_dra", t + 0.6, -0.85, 0.6, "linear"); prop("b_dra", t + 0.6, { y: 0.4 }, 0.3, "out"); prop("b_dra", t + 0.9, { y: 0 }, 0.3, "in");
prop("b_dra", t + 1.05, { wheelie: 0 }, 0.15, "in"); A("dra", t + 1.05, "pitch", { to: 0, dur: 0.15 });
sfx(t + 1.2, "land", { gain: 0.3 }); A("dra", t + 1.2, "squash", { amount: 0.12, dur: 0.2 }); fx(t + 1.25, { fx: "sparkle", who: "dra", dur: 0.5 });
ready("phx", t + 0.9);
free = away("dra", "b_dra", t + 1.3, 0.5) - 0.5;

// ---- 6. Phoenix: look, no hands. Arms up, wobbling, and into the puddle he goes
t = free;
c.beat("phx", t, "look, no hands: arms up, wobbling, straight into the puddle", "no hands");
roll("b_phx", t, 0.35, 0.9, "out"); A("phx", t + 0.15, "arm", { side: "both", pose: "up", dur: 0.2 }); A("phx", t + 0.15, "expr", { expr: "cocky" }); fx(t + 0.3, { fx: "sparkle", who: "phx", dur: 0.5 });
for (const [u, r] of [[0.2, 9], [0.4, -9], [0.6, 12], [0.8, -14]]) prop("b_phx", t + u, { roll: r }, 0.2);
const fall = t + 0.95;
prop("b_phx", fall, { roll: -80, x: -0.05 }, 0.3, "in"); A("phx", fall, "ride", { prop: null }); A("phx", fall, "drop", { to: 0, dur: 0.3 });
walk("phx", fall, [-0.05, LANE + 0.3], 0.3, "in", 0); A("phx", fall, "expr", { expr: "shocked" }); A("phx", fall, "lean", { to: -70, dur: 0.35, ease: "in" }); A("phx", fall + 0.55, "arm", { side: "both", pose: "rest", dur: 0.2 });
splash(fall + 0.25, 1.4); fx(fall + 0.25, { fx: "shake", dur: 0.2, amp: 0.03 });
A("phx", fall + 0.6, "lean", { to: 0, dur: 0.25 }); A("phx", fall + 0.6, "droop", { to: 1, dur: 0.25 }); A("phx", fall + 0.6, "expr", { expr: "sad" });
ready("gun", fall + 0.5);
A("phx", fall + 1.05, "droop", { to: 0, dur: 0.15 }); A("phx", fall + 1.05, "turn", { to: "left", dur: 0.15 });
prop("b_phx", fall + 1.05, { roll: 0, z: LANE + 0.3 }, 0.2); walk("phx", fall + 1.2, [-2.6, LANE + 0.3], 0.8, "in", 4); prop("b_phx", fall + 1.2, { x: -3.15 }, 0.8, "in");
A("phx", fall + 2.0, "hide"); prop("b_phx", fall + 2.0, { scale: 0 }, 0.01);
free = fall + 1.25;

// ---- 7. Gunslinger: won't get his boots wet. Shoots the puddle dry, rides over, tips his hat
t = free;
c.beat("gun", t, "won't get his boots wet: shoots the puddle dry, rides over", "shoots it dry");
roll("b_gun", t, 0.7, 0.45, "out"); A("gun", t + 0.45, "expr", { expr: "stern" }); A("gun", t + 0.45, "arm", { side: "R", pose: "point", dur: 0.12 }); A("gun", t + 0.45, "look", { to: [-0.4, -0.3], dur: 0.12 });
[0.65, 0.95, 1.25].forEach((u, i) => { fx(t + u, { fx: "flash", dur: 0.06, peak: 0.2 }); sfx(t + u, "impact", { gain: 0.3 }); prop("puddle", t + u, { level: 1 - (i + 1) / 3 }, 0.15, "out"); splash(t + u, 0.6); });
A("gun", t + 1.45, "arm", { side: "R", pose: BARS, dur: 0.15 }); A("gun", t + 1.45, "look", { to: [0, 0], dur: 0.12 }); A("gun", t + 1.5, "expr", { expr: "smug" });
roll("b_gun", t + 1.55, -0.6, 0.6, "inOut");
ready("all", t + 1.3);
free = away("gun", "b_gun", t + 2.15, 0.5) - 0.5;
prop("puddle", free + 0.45, { level: 1 }, 0.25, "out");   // (it fills back up as the next one rides in)

// ---- 8. Allfather: stops at the edge to look... and forgets his feet are clipped in. Slowly over, into the puddle
t = free;
c.beat("all", t, "clip-in pedals: stops to look at it, forgets to unclip, slowly topples in", "forgot to unclip");
roll("b_all", t, 0.4, 0.6, "out"); A("all", t + 0.55, "expr", { expr: "focused" }); A("all", t + 0.6, "look", { to: [-0.5, -0.4], dur: 0.15 });
const tip = t + 0.95;
prop("b_all", tip, { roll: -12 }, 0.3, "inOut"); A("all", tip + 0.15, "expr", { expr: "shocked" }); A("all", tip + 0.2, "look", { to: [0, 0], dur: 0.1 });
fx(tip + 0.25, { fx: "alert", who: "all", text: "!", dur: 0.5 });
prop("b_all", tip + 0.4, { roll: -80 }, 0.8, "in"); A("all", tip + 0.4, "ride", { prop: null }); A("all", tip + 0.4, "lean", { to: -70, dur: 0.8, ease: "in" });   // slowly...
A("all", tip + 0.4, "drop", { to: 0, dur: 0.8 }); walk("all", tip + 0.4, [-0.05, LANE + 0.4], 0.8, "in", 0); A("all", tip + 0.8, "blink", { dur: 0.2 });
splash(tip + 1.2, 1.3); sfx(tip + 1.2, "impact", { gain: 0.25 });
A("all", tip + 1.4, "blink", { dur: 0.25 }); A("all", tip + 1.4, "expr", { expr: "sad" });
ready("sam", tip + 1.2);
A("all", tip + 1.65, "lean", { to: 0, dur: 0.2 }); prop("b_all", tip + 1.65, { roll: 0, z: LANE + 0.4 }, 0.2); A("all", tip + 1.8, "turn", { to: "left", dur: 0.12 });
walk("all", tip + 1.9, [-2.6, LANE + 0.4], 0.55, "in", 4); prop("b_all", tip + 1.9, { x: -2.95 }, 0.55, "in"); A("all", tip + 2.45, "hide"); prop("b_all", tip + 2.45, { scale: 0 }, 0.01);
free = tip + 1.95;

// ---- 9. Samurai: one cut, and the puddle parts down the middle. He rides through dry
t = free;
c.beat("sam", t, "one cut parts the puddle down the middle; rides through dry", "parts the puddle");
roll("b_sam", t, 0.7, 0.45, "out"); A("sam", t + 0.45, "expr", { expr: "serene" }); A("sam", t + 0.45, "arm", { side: "R", pose: "up", dur: 0.12 });
A("sam", t + 0.7, "arm", { side: "R", pose: "point", dur: 0.08 }); fx(t + 0.7, { fx: "speedlines", dur: 0.12 }); fx(t + 0.72, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(t + 0.72, "shing", { gain: 0.25 });
prop("puddle", t + 0.75, { split: 1 }, 0.35, "out"); sfx(t + 0.8, "whoosh", { dur: 0.4, gain: 0.15 }); fx(t + 0.78, { fx: "poof", pos: [PUD[0], 0.12, PUD[1]], dur: 0.45, puffs: 1, sparks: 12, color: "#d8f0ff", spark: "#bfe8ff" });
A("sam", t + 0.95, "arm", { side: "R", pose: BARS, dur: 0.15 });
roll("b_sam", t + 1.05, -0.8, 0.7, "inOut"); A("sam", t + 1.3, "expr", { expr: "kind" });
prop("puddle", t + 1.75, { split: 0 }, 0.3, "in"); sfx(t + 1.95, "splash", { gain: 0.15 });
ready("vik", t + 1.3);
free = away("sam", "b_sam", t + 1.75, 0.5) - 0.45;

// ---- 10. Viking: full send. Straight through flat out: the puddle's gone, so is the bike. He rides on, one wheel
t = free;
c.beat("vik", t, "full send: flat out through it, the puddle is gone and so is the bike; rides on one wheel", "full send");
A("vik", t, "expr", { expr: "stern" }); roll("b_vik", t, 0.7, 0.35, "out");
A("vik", t + 0.35, "squash", { amount: 0.1, dur: 0.15 }); A("vik", t + 0.35, "expr", { expr: "delighted" });
roll("b_vik", t + 0.5, 0.0, 0.25, "in"); fx(t + 0.5, { fx: "speedlines", dur: 0.3 });
const hit = t + 0.75;
sfx(hit, "impact", { gain: 0.55 }); fx(hit, { fx: "shake", dur: 0.4, amp: 0.07 }); fx(hit, { fx: "flash", dur: 0.08, peak: 0.3 });
splash(hit, 2); prop("puddle", hit + 0.05, { level: 0 }, 0.2, "out");
prop("b_vik", hit, { broken: 1 }, 0.3, "out"); place("uni", hit, 0.0);
A("vik", hit, "ride", { prop: "uni", ...RIDE, dur: 0.01 });
A("vik", hit + 0.2, "arm", { side: "both", pose: "up", dur: 0.2 });
roll("uni", hit + 0.25, -0.75, 0.8, "inOut"); fx(hit + 0.6, { fx: "sparkle", who: "vik", dur: 0.6 });
const vikDone = hit + 0.25;

// ---- the loop: a poof fills the puddle and clears the wreck; the Astronaut is riding in again: frame 0
const fresh = vikDone + 1.0;
fx(fresh, { fx: "poof", pos: [-0.2, 0.5, LANE], dur: 0.45, puffs: 14, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); for (const p of ["b_vik", "uni"]) prop(p, fresh + 0.08, { scale: 0 }, 0.01);
prop("puddle", fresh + 0.08, { level: 1, split: 0 }, 0.01);
start(fresh + 0.05); A("ast", fresh + 0.1, "show");
const end = fresh + 0.3 + 0.27;
roll("b_ast", end - 0.27, 0.6, 0.27);

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [0, 1.0, 4.5], look: [0, 0.95, -0.7], fov: 43 },
  title: "BIKE", hook: "1 puddle. 10 bikes.", hookTo: 1.0, firstHabitAt: 0.3, askAt: vikDone + 0.1, cover: hit + 0.2,
  file: new URL("./bike-01-puddle.json", import.meta.url),
});
