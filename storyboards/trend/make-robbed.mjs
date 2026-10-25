// TOO BUSY TO NOTICE: the "getting robbed, but first..." trend (TikTok/Reels, added 14-16 Oct 2026) as an "each
// fighter, one continuous scene" clip. A park bench in the meadow; the Allfather sits at its end all along, smug, and his
// second raven (the first rides on his shoulder) robs each fighter while they're absorbed in their thing, then stashes
// the loot on the bench beside him. Each notices too late and reacts their way: the Phoenix keeps posing with no phone,
// the Gunslinger shoots his lunch back out of the raven's beak (it lands on his hat), the Wizard's zap backfires, the
// Samurai never even opens his eyes (one flick of the blade, a feather drifts down, the raven backs off), the raven
// can't lift the Viking's drumstick and his axe slam sends it packing, and the Reaper saw it coming and gives it a
// cookie. A poof clears the loot as the Phoenix walks back in with his phone (the loop). No harm comes to the raven.
//   node storyboards/trend/make-robbed.mjs   -> storyboards/trend/robbed-01-too-busy.json
// Where each stolen thing sits in its owner's hand at the snatch comes from a layout pass: if
// out/robbed-01-too-busy.items.json exists, the raven flies to exactly there. To write it: run this, then
//   node engine/render.mjs storyboards/trend/robbed-01-too-busy.json --layout
//   node storyboards/trend/make-robbed.mjs --measure      (reads the layout, writes the items file and the storyboard)
import { readFileSync, existsSync } from "node:fs";
import { clip, r3 } from "./lib.mjs";

const ITEMS = new URL("../../out/robbed-01-too-busy.items.json", import.meta.url).pathname;
const measured = existsSync(ITEMS) ? JSON.parse(readFileSync(ITEMS, "utf8")) : {};
const WANT = {};   // id -> the time its spot is read from the layout
const at = (id, t, guess) => { WANT[id] = r3(t); return measured[id] ?? guess; };   // the prop's spot just before the snatch

const BENCH = [0.55, -0.95], SEAT = 0.42;
const PERCH = [-0.02, 0.81, -1.19];                // the raven on the left end of the bench's backrest, clear of the Allfather
const S = [-0.75, -0.15], ENTER = [-2.0, -0.15];
const SC = 1.6, OFF = [0, 0.1, 0.19];             // the raven's scale; where a carried thing hangs from its beak (its own frame)
const reach = (rot) => { const a = (rot * Math.PI) / 180; return [(OFF[0] * Math.cos(a) + OFF[2] * Math.sin(a)) * SC, OFF[1] * SC, (-OFF[0] * Math.sin(a) + OFF[2] * Math.cos(a)) * SC]; };
const LOOK_CAM = [0, 0];

const c = clip({ id: "robbed-01-too-busy", title: "TOO BUSY TO NOTICE",
  format: "each-character-vs-X, one continuous take: the Allfather's raven robs each absorbed fighter, each reacts with their signature, the Reaper noticed all along",
  set: { type: "hills", seed: 5 }, music: { styles: ["sneaky", "bounce"] }, sound: { sfx: 0.5, ambience: 0.35 } });
const { A, arm, prop, fx, sfx, walk, carry, grab } = c;

c.addProp({ id: "bench", kind: "bench", x: BENCH[0], z: BENCH[1] });
c.addProp({ id: "raven", kind: "raven", x: PERCH[0], y: PERCH[1], z: PERCH[2], scale: SC });
c.addProp({ id: "phone", kind: "phone", x: S[0], y: 1.2, z: S[1], scale: 1.6 });
const OFFSTAGE = { x: -4, y: 0.6, z: 1 };   // until their owner picks them up
c.addProp({ id: "slice", kind: "slice", ...OFFSTAGE, scale: 0 });   // each owner's thing appears as they step in (held props of hidden fighters poke into the shot)
c.addProp({ id: "apple", kind: "apple", x: S[0] + 0.4, y: 1.45, z: S[1], scale: 0 });
c.addProp({ id: "tea", kind: "teacup", ...OFFSTAGE, steam: 1, scale: 0 });
c.addProp({ id: "feather", kind: "feather", x: S[0] + 0.45, y: 1.2, z: S[1] + 0.1, scale: 1.6 });
c.addProp({ id: "leg", kind: "drumstick", ...OFFSTAGE, scale: 0 });
c.addProp({ id: "cookie", kind: "cookie", ...OFFSTAGE, scale: 0 });

// the raven: fly to a spot (facing the way it flies), land, turn
const fly = (t, to, dur, rot, arc = 0.2, ease = "inOut") => { prop("raven", t, { rot }, 0.12); prop("raven", t, { x: to[0], y: to[1], z: to[2] }, dur, ease, { arc }); prop("raven", t, { flap: to === PERCH ? 0.45 : 1 }, 0.08); return t + dur; };   // wings half in for the hop home past the Allfather
const land = (t, rot = 0) => { prop("raven", t, { flap: 0 }, 0.12); prop("raven", t, { rot }, 0.15); };
// snatch: fly in from the right so the beak meets the thing (where it is at time t + 0.5; held in the owner's L
// hand, the side facing the bench), take it, turn and fly to the bench, hover over the seat and drop it at x lx, fly
// back up to the backrest and hop for joy. Returns when it's back
const snatch = (id, t, guess, lx, { lie = 90, arc = 0.25, p = at(id, t + 0.45, guess) } = {}) => {
  const rL = reach(-90);
  fly(t, [p[0] - rL[0], p[1] - rL[1], p[2] - rL[2]], 0.5, -90, arc);
  carry(id, t + 0.5, "raven", OFF); prop(id, t + 0.5, { tip: lie }, 0.1);   // flat in the beak, not standing up off it
  prop("raven", t + 0.5, { peck: 1 }, 0.06); prop("raven", t + 0.58, { peck: 0 }, 0.08);
  sfx(t + 0.5, "flutter", { gain: 0.25, dur: 0.3 });
  const rC = reach(0), back = fly(t + 0.6, [lx - rC[0], 0.95, BENCH[1] + 0.08 - rC[2]], 0.55, 0, 0.15);   // hovering over the backrest, facing us
  prop("raven", t + 0.65, { flap: 0.3 }, 0.12);   // wings mostly in (a glide) on the way to the bench and while it hovers, clear of the Allfather
  carry(id, back + 0.05); prop(id, back + 0.05, { y: SEAT, z: BENCH[1] + 0.08, tip: lie }, 0.18, "in"); sfx(back + 0.22, "tink", { gain: 0.2 });   // drops it on the seat
  const home = fly(back + 0.25, PERCH, 0.3, 0, 0.05); prop("raven", back + 0.3, { flap: 0.5 }, 0.05); land(home, 0);   // a short hop home, wings still half in
  prop("raven", home + 0.12, { happy: 1 }, 0.05); prop("raven", home + 0.4, { happy: 0 }, 0.05);
  return home;
};
const comeIn = (id, t, dur = 0.6) => { A(id, t, "show"); walk(id, t, S, dur, "out", 4); A(id, t + dur - 0.15, "turn", { to: "camera", dur: 0.15 }); return t + dur; };
// off to the front left, toward the camera and out of the shot (review A: across the front or behind the bench they
// cover the next snatch); the next fighter comes in along the back of that path, a body-width and more behind them
const OUT = [-3.4, 1.3];   // fully out of the shot (staffs and swords too) before the hide
const goOff = (id, t) => { A(id, t - 0.1, "turn", { to: -50, dur: 0.15 }); walk(id, t - 0.1, OUT, 0.8, "out", 4); A(id, t + 0.7, "hide"); return t + 0.7; };

// the Allfather: on the bench all along, smug, eyes on whoever is next
c.cast("all", [0.85, -0.85], { face: "camera", expr: "smug" });
A("all", -0.1, "sit", { seat: "bench", along: 0.3, dur: 0.05 });   // at the right end of the bench
A("all", 0, "look", { to: [-0.6, -0.1], dur: 0.01, blink: false });

// ------------------------------------------------------------------ 0.0 PHOENIX: a selfie (keeps posing, no phone)
const SELFIE = { o: [0.26, 0.86, 0.3] };
c.cast("phx", S, { face: "camera", expr: "cocky", arms: { L: SELFIE } });
c.turn("phx", 0, "taking a selfie");
grab("phx", "phone", "L", -0.1, { off: [0, 0.02, 0.03], pose: SELFIE });
A("phx", 0, "look", { to: [0.5, 0.55], dur: 0.01, blink: false });
A("phx", 0, "wings", { to: 0.4, dur: 0.01 });
let r = snatch("phone", 0.0, [S[0] + 0.45, 1.25, S[1] + 0.2], 0.04);
for (const k of [0.3, 0.75, 1.15]) { A("phx", k, "lean", { to: k === 0.75 ? 5 : -5, dur: 0.15 }); A("phx", k, "squash", { amount: 0.05, dur: 0.15 }); sfx(k + 0.05, "click", { gain: 0.2 }); if (k < 0.5) fx(k + 0.05, "sparkle", { pos: at("phone", 0.3, [S[0] + 0.45, 1.25, S[1] + 0.2]).map((v, i) => v + [0, 0.12, 0.05][i]), count: 3, dur: 0.25 }); }
A("phx", 1.45, "look", { to: [0.5, 0.6], dur: 0.1, blink: false });
A("phx", 1.55, "expr", { expr: "shocked", set: { eye: 1.25 }, dur: 0.08 });                  // ...no phone
A("phx", 1.75, "look", { to: [0.9, -0.2], dur: 0.15, blink: false });                         // it's on the bench
A("phx", 1.85, "wings", { to: 1, dur: 0.2, ease: "out" }); A("phx", 1.85, "expr", { expr: "stern", set: { browY: -0.03 }, dur: 0.1 });
fx(1.9, "poof", { who: "phx", color: "#ff8a3a", spark: "#ffd36b", puffs: 3, sparks: 8, dur: 0.4 });
arm("phx", 1.85, "L", "rest", 0.3);
A("all", 1.8, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
let t = 2.4;
goOff("phx", t - 0.2);

// ------------------------------------------------------------------ GUNSLINGER: lunch (shoots it back; it lands on his hat)
const AIM = { o: [0.18, 0.64, 0.45] };
c.cast("gun", ENTER, { face: "right", expr: "happy", hidden: true });
c.turn("gun", t, "lunch break");
grab("gun", "slice", "L", t - 0.05, { off: [0.0, 0.0, 0.05] }); prop("slice", t + 0.1, { scale: 1.6 }, 0.01);
A("gun", t, "look", { to: [0.3, -0.5], dur: 0.01, blink: false });
let a = comeIn("gun", t + 0.1);
arm("gun", a - 0.2, "L", { o: [0.1, 0.45, 0.3] }, 0.2);   // the slice up in front of his chest
A("gun", a, "talk", { dur: 0.9 });
A("all", a, "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
const gsn = a + 0.15, gp = at("slice", gsn + 0.45, [S[0] + 0.3, 0.75, S[1] + 0.35]), gR = reach(-90);
fly(gsn, [gp[0] - gR[0], gp[1] - gR[1], gp[2] - gR[2]], 0.5, -90, 0.25);
carry("slice", gsn + 0.5, "raven", OFF); sfx(gsn + 0.5, "flutter", { gain: 0.25, dur: 0.3 });
fly(gsn + 0.6, [-0.2, 1.35, -0.1], 0.6, 70, 0.2);   // off toward the bench, left of the Allfather's face                                                  // off toward the bench...
A("gun", gsn + 0.6, "expr", { expr: "stern", dur: 0.1 }); A("gun", gsn + 0.6, "look", { to: [0.7, 0.3], dur: 0.12, blink: false });
arm("gun", gsn + 0.7, "L", AIM, 0.15, "out");
const shot = gsn + 0.95;
sfx(shot, "gunshot", { gain: 0.4 }); A("gun", shot, "squash", { amount: 0.05, dur: 0.1 });
fx(shot, "sparkle", { pos: at("gun-handL", shot - 0.05, [S[0] + 0.45, 0.9, S[1] + 0.4]), count: 4, dur: 0.2 });
fx(shot + 0.02, "poof", { pos: [-0.2, 1.4, -0.1], puffs: 2, sparks: 8, spark: "#ffd36b", dur: 0.3 });
carry("slice", shot + 0.03);                                                                      // shot out of its beak
const hat = at("gun-hat", shot + 0.53, [S[0], 1.1, S[1]]);
prop("slice", shot + 0.03, { x: hat[0], y: hat[1], z: hat[2], rot: 20 }, 0.5, "in", { arc: 0.45 });
grab("gun", "slice", "hat", shot + 0.53, { keep: true });
sfx(shot + 0.53, "pop", { gain: 0.3 });
prop("raven", shot + 0.05, { tug: 1 }, 0.05); prop("raven", shot + 0.3, { tug: 0 }, 0.1);       // startled, empty beak
fly(shot + 0.3, PERCH, 0.45, 0, 0.15); land(shot + 0.75, 0);
A("gun", shot + 0.3, "expr", { expr: "smug", dur: 0.12 }); arm("gun", shot + 0.45, "L", "rest", 0.25);
A("gun", shot + 0.6, "look", { to: LOOK_CAM, dur: 0.12, blink: false });
A("gun", shot + 0.6, "look", { to: [0, 0.9], dur: 0.1, blink: false }); A("gun", shot + 0.6, "expr", { expr: "smug", set: { browY: 0.03 }, dur: 0.1 });   // a glance up at his hat
A("gun", shot + 0.95, "look", { to: LOOK_CAM, dur: 0.12, blink: false });
t = shot + 1.3;
goOff("gun", t - 0.15);

// ------------------------------------------------------------------ WIZARD: spell practice (the zap backfires)
c.cast("wiz", ENTER, { face: "right", expr: "focused", hidden: true });
c.turn("wiz", t, "spell practice");
a = comeIn("wiz", t + 0.1);
arm("wiz", a - 0.1, "L", { o: [0.3, 0.72, 0.18] }, 0.2);
A("wiz", a + 0.05, "charge", { to: 0.6, dur: 0.2 }); A("wiz", a + 0.05, "look", { to: [0.5, 0.7], dur: 0.12, blink: false });
const ap = [S[0] + 0.45, 1.5, S[1] + 0.1];   // floating above his raised hand
prop("apple", a + 0.05, { x: ap[0], y: ap[1], z: ap[2], scale: 1.4 }, 0.2, "back"); fx(a + 0.1, "sparkle", { pos: [ap[0], ap[1] + 0.08, ap[2]], dur: 0.6, count: 4 });
r = snatch("apple", a + 0.2, ap, 0.1, { lie: 0, p: ap, arc: 0.45 });   // in from above, clear of the staff
A("wiz", a + 0.95, "charge", { to: 0, dur: 0.15 }); A("wiz", a + 0.95, "expr", { expr: "shocked", dur: 0.1 }); A("wiz", a + 0.95, "look", { to: [0.9, 0.0], dur: 0.15, blink: false });
A("wiz", a + 1.2, "expr", { expr: "stern", set: { browY: -0.03 }, dur: 0.1 }); A("wiz", a + 1.2, "charge", { to: 1, dur: 0.2, ease: "in" }); sfx(a + 1.2, "charge", { gain: 0.25, dur: 0.25 });
fx(a + 1.45, "flash", { peak: 0.25, dur: 0.12 });                                                // ...and it backfires on him
fx(a + 1.47, "poof", { who: "wiz", color: "#5a5260", puffs: 6, sparks: 6, spark: "#c8b6ff", dur: 0.6 });
A("wiz", a + 1.47, "charge", { to: 0, dur: 0.1 }); A("wiz", a + 1.5, "hatwobble", { amount: 10, freq: 3, dur: 0.8 });
A("wiz", a + 1.5, "expr", { expr: "dizzy", dur: 0.1 }); A("wiz", a + 1.55, "droop", { to: 1, dur: 0.3 });
arm("wiz", a + 1.6, "L", "rest", 0.3);
A("all", a + 1.6, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
t = a + 2.15;
goOff("wiz", t - 0.15);

// ------------------------------------------------------------------ SAMURAI: tea, eyes closed (the one who isn't robbed)
const UP = [{ o: [0.18, 0.95, 0.2] }, [10, 0]], REST = [{ o: [0.24, 0.36, 0.08] }, null];
const sword = (tt, p, dur) => { arm("sam", tt, "R", p[0], dur); A("sam", tt, "tilt", { to: p[1], dur }); };
c.cast("sam", ENTER, { face: "right", expr: "serene", hidden: true, arms: { R: REST[0], L: { o: [0.1, 0.5, 0.3] } } });
c.turn("sam", t, "tea, eyes closed");
grab("sam", "tea", "L", t - 0.05, { off: [0, -0.02, 0.04], pose: { o: [0.1, 0.5, 0.3] } });
prop("tea", t + 0.1, { scale: 1.3 }, 0.01); a = comeIn("sam", t + 0.1);
A("sam", a, "face", { lid: 1, dur: 0.2 }); A("all", a, "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
const tp = at("tea", a + 0.65, [S[0] + 0.3, 0.7, S[1] + 0.3]), sR = reach(-90);
fly(a + 0.2, [tp[0] - sR[0] + 0.25, tp[1] - sR[1] + 0.25, tp[2] - sR[2]], 0.5, -90, 0.25);    // in for the cup...
sword(a + 0.65, UP, 0.08);                                                                         // ...flick (eyes still closed)
fx(a + 0.67, "slash", { pos: [S[0] + 0.25, 1.15, S[1] + 0.25], r: 0.5, from: 200, arc: -110, dur: 0.14 }); sfx(a + 0.66, "shing", { gain: 0.3 });
prop("feather", a + 0.7, { fall: 1 }, 1.2, "linear");                                             // one feather, nothing else
prop("raven", a + 0.7, { tug: 1 }, 0.05); prop("raven", a + 0.95, { tug: 0 }, 0.1);
fly(a + 0.8, PERCH, 0.5, 0, 0.2); land(a + 1.3, 0);
sword(a + 1.0, REST, 0.3);
A("sam", a + 1.1, "expr", { expr: "serene", set: { curve: 0.15 }, dur: 0.15 });
A("all", a + 1.1, "expr", { expr: "shocked", dur: 0.1 }); A("all", a + 1.6, "expr", { expr: "smug", dur: 0.2 });
t = a + 1.85;
goOff("sam", t - 0.15);

// ------------------------------------------------------------------ VIKING: a snack (too heavy; the axe slam scares it off)
const AXE_UP = { o: [0.18, 0.95, 0.2] }, AXE_DOWN = { o: [0.1, 0.55, 0.48] };
c.cast("vik", ENTER, { face: "right", expr: "happy", hidden: true, arms: { R: { o: [0.12, 0.42, 0.3] } } });
c.turn("vik", t, "a snack");
grab("vik", "leg", "R", t - 0.05, { off: [0, -0.04, 0.06], pose: { o: [-0.3, 0.42, 0.68] } });   // the snack in front of his belly, where the raven can reach it
prop("leg", t + 0.35, { scale: 1 }, 0.01); a = comeIn("vik", t + 0.35);   // after the Samurai has passed
A("vik", a, "talk", { dur: 1.1 }); A("all", a, "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
const lp = at("leg", a + 0.55, [S[0] + 0.3, 0.62, S[1] + 0.5]), vR = reach(-90);
fly(a + 0.1, [lp[0] - vR[0] + 0.3, lp[1] - vR[1] + 0.25, lp[2] - vR[2] + 0.35], 0.3, -90, 0.2, "in");   // swoops round in front of him...
fly(a + 0.4, [lp[0] - vR[0] + 0.17, lp[1] - vR[1] + 0.05, lp[2] - vR[2] + 0.1], 0.2, -90, 0, "out");   // beak on the bone end, on our side of his fist
prop("raven", a + 0.6, { tug: 1 }, 0.1); sfx(a + 0.6, "flutter", { gain: 0.3, dur: 0.8 });           // pulls and pulls; it doesn't budge
A("vik", a + 1.2, "look", { to: [0.35, -0.5], dur: 0.15, blink: false }); A("vik", a + 1.25, "expr", { expr: "stern", set: { browY: -0.03 }, dur: 0.1 });
prop("raven", a + 1.35, { tug: 0 }, 0.05); fly(a + 1.35, [0.45, 1.55, -1.3], 0.35, 60, 0.1);   // it lets go, up and away to the right (clear of his face and the axe)
A("vik", a + 1.65, "tilt", { to: [10, 0], dur: 0.2 }); arm("vik", a + 1.7, "L", AXE_UP, 0.22, "out");   // once the raven is clear of the axe
A("vik", a + 2.0, "tilt", { to: [90, 0], dur: 0.15 }); arm("vik", a + 2.0, "L", AXE_DOWN, 0.15, "in");
const slam = a + 2.1;
fx(slam, "shake", { amp: 0.06, dur: 0.35 }); sfx(slam, "impact", { gain: 0.5 });
fx(slam + 0.02, "poof", { pos: [S[0] + 0.6, 0.12, S[1] + 0.35], puffs: 6, sparks: 10, spark: "#ffcf6b", dur: 0.5 });
prop("bench", slam, { squash: 0.06 }, 0.06); prop("bench", slam + 0.06, { squash: 0 }, 0.15);
A("all", slam, "squash", { amount: 0.08, dur: 0.2 }); A("all", slam + 0.02, "expr", { expr: "shocked", dur: 0.08 });
fly(slam, PERCH, 0.45, 0, 0.25); prop("raven", slam + 0.05, { flap: 0.4 }, 0.1); land(slam + 0.45, 0);   // drops back down behind him, wings in
A("vik", slam + 0.3, "tilt", { to: null, dur: 0.3 }); arm("vik", slam + 0.3, "L", "rest", 0.3);
A("vik", slam + 0.45, "expr", { expr: "delighted", dur: 0.12 }); A("vik", slam + 0.45, "talk", { dur: 0.5 }); A("vik", slam + 0.5, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
A("all", slam + 0.6, "expr", { expr: "smug", dur: 0.2 });
t = slam + 1.0;
goOff("vik", t - 0.15);

// ------------------------------------------------------------------ REAPER: he noticed (gives the raven a cookie)
const OFFER = { o: [0.2, 0.55, 0.35] };
c.cast("rea", ENTER, { face: "right", expr: "kind", hidden: true });
c.turn("rea", t, "actually paying attention");
grab("rea", "cookie", "L", t - 0.05, { off: [0, 0, 0.04], pose: "rest" });
prop("cookie", t + 0.1, { scale: 1.4 }, 0.01); a = comeIn("rea", t + 0.1);
A("rea", a + 0.05, "look", { to: [0.85, -0.15], dur: 0.2, blink: false });                        // his eyes on the raven before it moves
A("all", a + 0.1, "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
arm("rea", a + 0.25, "L", OFFER, 0.3, "settle");                                                 // holds out the cookie
const cp = at("cookie", a + 1.25, [S[0] + 0.35, 0.95, S[1] + 0.3]), cR = reach(-90);
fly(a + 0.55, [cp[0] - cR[0], cp[1] - cR[1], cp[2] - cR[2]], 0.6, -90, 0.2);
prop("raven", a + 1.15, { flap: 0.6 }, 0.15);   // hovers in front of him, politely
carry("cookie", a + 1.3, "raven", OFF); prop("raven", a + 1.3, { peck: 1 }, 0.08); prop("raven", a + 1.42, { peck: 0 }, 0.1);   // takes it, gently
arm("rea", a + 1.45, "L", "rest", 0.3); A("rea", a + 1.5, "expr", { expr: "kind", set: { curve: 0.2 }, dur: 0.15 });
fly(a + 1.5, PERCH, 0.5, 0, 0.02); land(a + 2.0, 0);   // low, under his eyeline
prop("raven", a + 2.05, { happy: 1 }, 0.05); prop("raven", a + 2.7, { happy: 0 }, 0.05);
A("all", a + 1.25, "look", { to: [-0.55, 0.0], dur: 0.12, blink: false }); A("all", a + 1.3, "expr", { expr: "shocked", set: { eye: 1.2 }, dur: 0.1 });   // the boss's double take, as the raven takes the gift
A("rea", a + 2.0, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
const askAt = a + 1.9, END0 = a + 2.75;

// ------------------------------------------------------------------ LOOP: a poof clears the loot; the Phoenix walks back in mid-selfie
fx(END0, "poof", { pos: [0.4, 0.6, -0.9], puffs: 10, sparks: 6, spark: "#ffe58a", dur: 0.5 }); sfx(END0, "poof", { gain: 0.3 });
for (const id of ["apple", "cookie"]) prop(id, END0 + 0.06, { scale: 0 }, 0.01);
goOff("rea", END0 + 0.06);
// the Phoenix, back at the start: hidden, he steps off to the left of the shot with his phone (it leaves the bench in
// the poof), walks in posing and lands in the frame-0 pose
walk("phx", END0, ENTER, 0.01); A("phx", END0, "turn", { to: "right", dur: 0.01 });
grab("phx", "phone", "L", END0 + 0.06, { off: [0, 0.02, 0.03], pose: SELFIE }); prop("phone", END0 + 0.06, { tip: 0 }, 0.01);
A("phx", END0 + 0.1, "expr", { expr: "cocky", dur: 0.01 }); A("phx", END0 + 0.1, "wings", { to: 0.4, dur: 0.01 }); A("phx", END0 + 0.1, "look", { to: [0.5, 0.55], dur: 0.01, blink: false });
const back = comeIn("phx", END0 + 0.3, 0.6);
A("all", END0 + 0.1, "expr", { expr: "smug", set: { eye: 1 }, dur: 0.15 }); A("all", END0 + 0.1, "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
const END = back + 0.15;
const SHOT = { pos: [0.1, 1.2, 6.5], look: [0.1, 1.1, -0.5], fov: 38 }, CLOSE = { pos: [0.1, 1.2, 6.5], look: [-0.1, 1.0, -0.5], fov: 32 };
c.finish(END, {
  shot: SHOT,
  moves: [{ at: r3(a + 0.9), ...SHOT, to: CLOSE, dur: 0.4, ease: "inOut" }, { at: r3(END0 + 0.1), ...CLOSE, to: SHOT, dur: 0.5, ease: "inOut" }],   // in on the cookie and the double take
  at: { title: 232, sub: 362, name: 458, habit: 584, ask: 470 }, size: { title: 64, name: 76 },
  title: "TOO BUSY TO NOTICE", sub: "getting robbed, but first...", ask: "who gets robbed\nfirst?", askAt, cover: 1.0,
  file: new URL("./robbed-01-too-busy.json", import.meta.url).pathname,
});
void r;

// --measure: read where each thing is just before its snatch from the layout pass, and write them to the items file
if (process.argv.includes("--measure")) {
  const { writeFileSync } = await import("node:fs"), { execFileSync } = await import("node:child_process");
  const L = JSON.parse(readFileSync(new URL("../../out/robbed-01-too-busy-anime-pro.layout.json", import.meta.url), "utf8"));
  const spot = (s, id) => (id === "gun-hat" ? s.actors.find((q) => q.id === "gun")?.hat : id === "gun-handL" ? s.actors.find((q) => q.id === "gun")?.hands?.L : s.props.find((q) => q.id === id)?.at);
  const out = {};
  for (const [id, t] of Object.entries(WANT)) {
    const dt = L.samples[1].t - L.samples[0].t, k = t / dt, i = Math.min(L.samples.length - 2, Math.floor(k)), f = k - i, a0 = spot(L.samples[i], id), a1 = spot(L.samples[i + 1], id);
    if (a0 && a1) out[id] = a0.map((v, j) => r3(v + (a1[j] - v) * f));
  }
  writeFileSync(ITEMS, JSON.stringify(out, null, 1)); console.log("measured", JSON.stringify(out));
  execFileSync(process.execPath, [new URL(import.meta.url).pathname], { stdio: "inherit" });   // again, with the spots
}
