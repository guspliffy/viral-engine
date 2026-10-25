// HOW TO CATCH ME: the "how to catch me" trend (Instagram, added 21 Oct 2026) as an "each fighter, one continuous
// scene" clip. A back garden; a big cardboard box propped up on a stick over a crate, rebaited for each fighter with the
// thing they can't resist. The box drops and each gets out (or doesn't) their own way: the Dragon chars it, the Phoenix
// burns it to ash, the Gunslinger shoots the stick (and a second box gets him), the Wizard's spell makes it giant, the
// Samurai slices it, the Viking smashes everything, and the Reaper walks in for tea and quiet. A poof resets the trap
// for the Dragon (the loop).
// Script: Jonny picked it on 25 Oct from the doc "Viral trend scripts: week of 18-25 Oct 2026".
//   node storyboards/trend/make-catch.mjs   -> storyboards/trend/catch-01-how-to-catch-me.json
import { clip, r3 } from "./lib.mjs";

const BX = 0.4, BZ = -0.3;                      // the box's footprint centre
const F = [BX - 0.25, BZ + 0.1];                // where a fighter stands, under the lifted front edge
const ENTER = [-1.9, F[1]], BAIT = [BX + 0.3, BZ - 0.2];
const LOOK_BAIT = [0.6, -0.35], LOOK_CAM = [0, 0];

const c = clip({ id: "catch-01-how-to-catch-me", title: "HOW TO CATCH ME:",
  format: "each-character-vs-X, one continuous take: a box trap rebaited for each fighter, each gets caught (or out) with a relatable weakness + their signature, the Reaper's calm ending last",
  set: { type: "backyard", seed: 3 }, music: { styles: ["bounce", "warm"] }, sound: { sfx: 0.5, ambience: 0.35 } });
const { A, arm, prop, fx, sfx, walk } = c;

c.addProp({ id: "fence", kind: "fence", x: 0.3, z: -2.6, width: 1.6 });
c.addProp({ id: "box", kind: "boxtrap", x: BX, z: BZ });
c.addProp({ id: "box2", kind: "boxtrap", x: BX - 1.35, y: 3.4, z: BZ + 0.1, drop: 1, stick: false, scale: 0.9 });   // the Gunslinger's second box, up out of frame
c.addProp({ id: "crate", kind: "crate", x: BAIT[0], z: BAIT[1] });
const bait = (id, spec, shown = false) => c.addProp({ id, x: BAIT[0], y: 0.32, z: BAIT[1], scale: shown ? spec.scale ?? 1 : 0, ...spec, ...(shown ? {} : { scale: 0 }) });
const SIZE = { coins: 1.6, mirror: 0.7, free: 0.8, book: 1.3, slice: 2.4, leg: 1.4, tea: 1.6, quiet: 1.2 };
bait("coins", { kind: "coins" }, true); prop("coins", 0, { scale: SIZE.coins }, 0.01);
bait("mirror", { kind: "mirror", rot: -20 });
bait("free", { kind: "sign", text: "FREE" });
bait("book", { kind: "spellbook", tag: "50% OFF" });
bait("slice", { kind: "slice" });
bait("leg", { kind: "drumstick" });
bait("tea", { kind: "teacup", steam: 1, x: BAIT[0] + 0.06 });
bait("quiet", { kind: "sign", small: true, text: "QUIET", x: BAIT[0] - 0.08, z: BAIT[1] + 0.08 });

// the trap
const drop = (t, id = "box", dur = 0.14) => {
  sfx(t, "click", { gain: 0.3 }); prop(id, t, { drop: 1 }, dur, "in");
  sfx(t + dur, "land", { gain: 0.5 }); sfx(t + dur, "impact", { gain: 0.25 }); fx(t + dur, "shake", { amp: 0.025, dur: 0.2 });
  fx(t + dur, "poof", { pos: [BX, 0.08, BZ + 0.8], puffs: 4, sparks: 0, color: "#e8dcc4", dur: 0.4 });   // dust off the grass
  return t + dur;
};
// a poof resets the trap: the box propped up again, the last bait swapped for the next, the caught fighter gone
const reset = (t, who, from, to) => {
  fx(t, "poof", { pos: [BX, 0.8, BZ], puffs: 12, sparks: 8, spark: "#ffe58a", dur: 0.55 }); sfx(t, "poof", { gain: 0.35 });
  prop("box", t + 0.08, { drop: 0, char: 0, burn: 0, split: 0, smash: 0, ring: 0, scale: 1 }, 0.01);
  if (from) for (const f of [].concat(from)) prop(f, t + 0.08, { scale: 0 }, 0.01);
  if (to) for (const f of [].concat(to)) prop(f, t + 0.08, { scale: SIZE[f] }, 0.01);
  if (who) A(who, t + 0.08, "hide");
};
// walk in from the left, under the lifted edge, to the bait
const comeIn = (id, t, to = F, dur = 0.7) => {
  A(id, t, "show"); walk(id, t, to, dur, "out", 5);
  A(id, t + dur - 0.2, "turn", { to: "3q-right", dur: 0.2 }); A(id, t + dur - 0.15, "look", { to: LOOK_BAIT, dur: 0.15, blink: false });
  return t + dur;
};

// ------------------------------------------------------------------ 0.0 DRAGON: anything shiny (frame 0 mid-dive)
c.cast("dra", F, { face: "3q-right", expr: "delighted", arms: { R: { o: [0.12, 0.42, 0.38] }, L: { o: [0.12, 0.42, 0.38] } } });
c.turn("dra", 0, "anything shiny");
A("dra", 0, "look", { to: LOOK_BAIT, dur: 0.01, blink: false });
A("dra", 0, "lean", { to: -10, dur: 0.01 });
fx(0, "sparkle", { pos: [BAIT[0], 0.5, BAIT[1]], dur: 0.3, count: 3 });
let d = drop(0.12);
A("dra", d, "hide");
// a beat... then fire out of the gaps, and the box chars black
sfx(d + 0.55, "whoosh", { gain: 0.35 });
for (const [x, k] of [[-0.75, 0], [0.75, 0.04]]) fx(d + 0.55 + k, "poof", { pos: [BX + x, 0.12, BZ + 0.3], color: "#ff8a2a", spark: "#ffd36b", puffs: 4, sparks: 6, dur: 0.5 });
fx(d + 0.6, "poof", { pos: [BX, 1.55, BZ], color: "#4a4450", puffs: 5, sparks: 0, dur: 0.7 });
prop("box", d + 0.55, { char: 1 }, 0.3, "out"); prop("box", d + 0.55, { ring: 1 }, 0.05); prop("box", d + 0.85, { ring: 0 }, 0.1);
let t = d + 1.3;
reset(t, null, "coins", "mirror");

// ------------------------------------------------------------------ PHOENIX: a mirror (preens, burns the box away, still posing)
c.cast("phx", ENTER, { face: "right", expr: "cocky", hidden: true });
c.turn("phx", t, "a mirror");
A("phx", t, "wings", { to: 0, dur: 0.01 });
let a = comeIn("phx", t + 0.1);
A("phx", a, "expr", { expr: "cocky", dur: 0.1 });
A("phx", a + 0.05, "lean", { to: -5, dur: 0.2 }); A("phx", a + 0.3, "lean", { to: 4, dur: 0.25 });   // preening, this side and that
A("phx", a + 0.35, "expr", { expr: "delighted", dur: 0.12 });
d = drop(a + 0.65);
A("phx", d, "hide");
prop("box", d + 0.35, { burn: 1 }, 1.0, "linear"); prop("mirror", d + 0.9, { scale: 0 }, 0.01); sfx(d + 0.35, "whoosh", { gain: 0.3 }); sfx(d + 0.45, "hiss", { gain: 0.3, dur: 0.8 });
// he's still there in the ash, posing
// (posed while still hidden inside the burning box, so nothing snaps on screen)
A("phx", d + 0.3, "wings", { to: 1, dur: 0.01 }); A("phx", d + 0.3, "turn", { to: "camera", dur: 0.01 }); A("phx", d + 0.3, "lean", { to: 0, dur: 0.01 });
A("phx", d + 0.3, "look", { to: LOOK_CAM, dur: 0.01, blink: false }); A("phx", d + 0.3, "expr", { expr: "cocky", set: { curve: 0.15 }, dur: 0.01 });
A("phx", d + 0.95, "show"); c.allow("phx", "box", d + 0.95, d + 1.4, "he stands in the pile of ash the box burned down to");
fx(d + 1.4, "sparkle", { who: "phx", dur: 0.5, count: 4 });
t = d + 1.75;
reset(t, "phx", "mirror", "free");

// ------------------------------------------------------------------ GUNSLINGER: free stuff (suspicious)
const G = [BX - 1.35, F[1]], AIM = { o: [0.12, 0.62, 0.5] };   // the far hand (L): a near hand crosses the face
c.cast("gun", ENTER, { face: "right", expr: "stern", hidden: true });
c.turn("gun", t, "free stuff (suspicious)");
a = comeIn("gun", t + 0.1, G, 0.5);
A("gun", a, "expr", { expr: "stern", set: { lidL: 0.45, lidR: 0.45 }, dur: 0.12 });   // squints
A("gun", a + 0.1, "still", { dur: 0.3, idle: 0.1 });
arm("gun", a + 0.4, "L", AIM, 0.18, "out");
sfx(a + 0.62, "gunshot", { gain: 0.4 }); A("gun", a + 0.62, "squash", { amount: 0.05, dur: 0.1 });
fx(a + 0.64, "poof", { pos: [BX + 0.63, 0.6, BZ + 0.06], puffs: 2, sparks: 8, spark: "#ffd36b", dur: 0.3 });
d = drop(a + 0.66);                               // ...on nothing
A("gun", d + 0.15, "expr", { expr: "smug", dur: 0.12 });
A("gun", d + 0.4, "look", { to: LOOK_CAM, dur: 0.12, blink: false });
arm("gun", d + 0.45, "L", "rest", 0.25);
A("gun", d + 0.6, "turn", { to: "camera", dur: 0.2 }); A("gun", d + 0.7, "lean", { to: 4, dur: 0.2 });   // smug...
A("gun", d + 0.82, "look", { to: [-0.3, 0.9], dur: 0.1, blink: false }); A("gun", d + 0.87, "expr", { expr: "shocked", set: { eye: 1.2 }, dur: 0.08 });   // a shadow from above
prop("box2", d + 1.1, { y: 0 }, 0.22, "in"); sfx(d + 1.32, "land", { gain: 0.5 }); fx(d + 1.32, "shake", { amp: 0.035, dur: 0.2 });   // ...and the second box
fx(d + 1.32, "poof", { pos: [G[0], 0.08, G[1] + 0.7], puffs: 4, sparks: 0, color: "#e8dcc4", dur: 0.4 });
A("gun", d + 1.32, "hide");
t = d + 2.0;
fx(t, "poof", { pos: [G[0], 0.8, G[1]], puffs: 10, sparks: 6, spark: "#ffe58a", dur: 0.55 }); prop("box2", t + 0.08, { y: 3.4 }, 0.01);
reset(t, null, "free", "book");

// ------------------------------------------------------------------ WIZARD: a sale (the float spell makes the box giant)
const WZ = [BX - 1.05, F[1]];
c.cast("wiz", ENTER, { face: "right", expr: "kind", hidden: true });
c.turn("wiz", t, "a sale");
a = comeIn("wiz", t + 0.1, WZ, 0.5);
A("wiz", a, "expr", { expr: "delighted", dur: 0.1 });
arm("wiz", a + 0.2, "L", { o: [0.3, 0.72, 0.18] }, 0.2, "settle"); A("wiz", a + 0.2, "charge", { to: 1, dur: 0.25, ease: "in" }); sfx(a + 0.2, "charge", { gain: 0.25, dur: 0.3 });
A("wiz", a + 0.2, "expr", { expr: "focused", dur: 0.12 });
fx(a + 0.48, "flash", { peak: 0.3, dur: 0.15 }); A("wiz", a + 0.5, "charge", { to: 0, dur: 0.2 });
prop("box", a + 0.5, { scale: 2.1 }, 0.35, "back"); sfx(a + 0.5, "whoosh", { gain: 0.3 });   // the spell hits the box, not the book
A("wiz", a + 0.6, "expr", { expr: "shocked", set: { eye: 1.25 }, dur: 0.1 }); A("wiz", a + 0.6, "look", { to: [0.4, 0.7], dur: 0.15, blink: false });
A("wiz", a + 0.6, "hatwobble", { amount: 8, freq: 3, dur: 0.6 });
d = drop(a + 1.0, "box", 0.2);
A("wiz", d, "hide"); arm("wiz", d, "L", "rest", 0.01);
prop("box", d + 0.2, { ring: 1 }, 0.05); prop("box", d + 0.4, { ring: 0 }, 0.05);   // a rattle inside the giant box
prop("box", d + 0.5, { scale: 1 }, 0.2, "in"); sfx(d + 0.5, "whoosh", { gain: 0.2 });   // the spell wears off: it shrinks back, still down
t = d + 0.9;
reset(t, null, "book", "slice");

// ------------------------------------------------------------------ SAMURAI: free food (one cut, then he eats it)
const UP = [{ o: [0.18, 0.95, 0.2] }, [10, 0]], CUT = [{ o: [0.12, 0.32, 0.45] }, [100, 0]], REST = [{ o: [0.24, 0.36, 0.08] }, null];
const sword = (tt, p, dur) => { arm("sam", tt, "R", p[0], dur); A("sam", tt, "tilt", { to: p[1], dur }); };
c.cast("sam", ENTER, { face: "right", expr: "focused", hidden: true, arms: { R: REST[0], L: { o: [0.15, 0.27, 0.08] } } });
c.turn("sam", t, "free food");
a = comeIn("sam", t + 0.1);
A("sam", a, "expr", { expr: "eager", dur: 0.1 });
d = drop(a + 0.35);
A("sam", d, "hide");
// a beat in the dark... then one cut and the box falls in halves
const CUTAT = d + 0.55;
// (he is shown already through the cut as the halves part: no blade poking out of a closed box)
sword(CUTAT - 0.2, CUT, 0.01); A("sam", CUTAT - 0.2, "expr", { expr: "focused", dur: 0.01 }); A("sam", CUTAT + 0.1, "show");
fx(CUTAT, "flash", { peak: 0.3, dur: 0.12 });
fx(CUTAT + 0.01, "slash", { pos: [F[0] + 0.1, 1.0, F[1] + 0.3], r: 0.8, from: 100, arc: -110, dur: 0.16 });
sfx(CUTAT, "whoosh", { gain: 0.25, dur: 0.18 }); sfx(CUTAT + 0.08, "shing", { gain: 0.3 });
prop("box", CUTAT + 0.05, { split: 1 }, 0.35, "in");
c.allow("sam", "box", CUTAT + 0.05, CUTAT + 0.35, "the cut through the box from inside: the halves fall away as the blade passes");
sword(CUTAT + 0.45, REST, 0.3);
A("sam", CUTAT + 0.6, "lean", { to: -8, dur: 0.15 });   // leans in... the slice flies to his mouth, gone in one bite
prop("slice", CUTAT + 0.56, { x: F[0] + 0.16, y: 0.62, z: F[1] + 0.42, scale: 1.6 }, 0.18, "in");
prop("slice", CUTAT + 0.74, { scale: 0 }, 0.06, "in"); sfx(CUTAT + 0.74, "pop", { gain: 0.35 });
A("sam", CUTAT + 0.8, "lean", { to: 0, dur: 0.2 }); A("sam", CUTAT + 0.74, "talk", { dur: 0.4 });
A("sam", CUTAT + 0.85, "expr", { expr: "serene", dur: 0.15 }); A("sam", CUTAT + 0.9, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
t = CUTAT + 1.4;
reset(t, "sam", null, "leg");

// ------------------------------------------------------------------ VIKING: all-you-can-eat (smashes the box, the crate and the fence)
const AXE_UP = { o: [0.42, 1.0, 0.2] };
c.cast("vik", ENTER, { face: "right", expr: "eager", hidden: true });
c.turn("vik", t, "all-you-can-eat");
a = comeIn("vik", t + 0.1);
A("vik", a, "expr", { expr: "delighted", dur: 0.1 });
d = drop(a + 0.3);
A("vik", d, "hide");
// a beat of silence, a growl, then everything goes
prop("box", d + 0.5, { ring: 1 }, 0.05); prop("box", d + 0.75, { ring: 0 }, 0.05);
const SMASH = d + 0.8;
prop("box", SMASH, { smash: 1 }, 0.7, "out"); prop("fence", SMASH + 0.04, { smash: 1 }, 0.8, "out");
prop("crate", SMASH, { scale: 0 }, 0.05); prop("leg", SMASH, { scale: 0 }, 0.05);
fx(SMASH, "flash", { peak: 0.35, dur: 0.15 }); fx(SMASH, "shake", { amp: 0.06, dur: 0.4 }); sfx(SMASH, "impact", { gain: 0.5 });
fx(SMASH + 0.02, "poof", { pos: [BX, 0.3, BZ], puffs: 8, sparks: 14, spark: "#ffcf6b", dur: 0.6 });
A("vik", SMASH, "show"); arm("vik", SMASH, "L", AXE_UP, 0.01); A("vik", SMASH, "tilt", { to: [10, 0], dur: 0.01 });
A("vik", SMASH, "turn", { to: "camera", dur: 0.01 }); A("vik", SMASH, "look", { to: LOOK_CAM, dur: 0.01, blink: false });
A("vik", SMASH, "expr", { expr: "delighted", dur: 0.01 }); A("vik", SMASH + 0.15, "talk", { dur: 0.6 });   // chewing: he ate it in there
A("vik", SMASH + 0.2, "hop", { height: 0.15, count: 2, dur: 0.6 });
c.allow("vik", "box", SMASH - 0.02, SMASH + 0.25, "the box blows apart around him: the smash is the joke");
t = SMASH + 1.1;
// the Viking stomps off; a poof in the wreck sets a new trap: a steaming cup of tea and a little QUIET sign
arm("vik", t - 0.2, "L", "rest", 0.3); A("vik", t - 0.2, "tilt", { to: null, dur: 0.3 });
// (out toward the camera first, clear of where the new trap appears)
walk("vik", t + 0.05, [0.15, 0.9], 0.25, "inOut", 2); A("vik", t + 0.25, "turn", { to: "right", dur: 0.12 }); walk("vik", t + 0.3, [2.6, 0.9], 0.55, "in", 4); A("vik", t + 0.9, "hide");
fx(t + 0.45, "poof", { pos: [BX, 0.8, BZ], puffs: 12, sparks: 8, spark: "#ffe58a", dur: 0.55 }); sfx(t + 0.45, "poof", { gain: 0.35 });
prop("box", t + 0.53, { drop: 0, smash: 0, ring: 0, scale: 1.2 }, 0.01); prop("crate", t + 0.53, { scale: 1 }, 0.01);
prop("tea", t + 0.53, { scale: SIZE.tea }, 0.01); prop("quiet", t + 0.53, { scale: SIZE.quiet }, 0.01);

// ------------------------------------------------------------------ REAPER: a warm drink and silence (walks right in)
c.cast("rea", ENTER, { face: "right", expr: "kind", hidden: true });
c.turn("rea", t, "a warm drink and silence");
a = comeIn("rea", t + 0.6, [F[0] - 0.05, F[1]], 0.75);
A("rea", a, "expr", { expr: "kind", dur: 0.1 });
A("rea", a + 0.25, "look", { to: LOOK_CAM, dur: 0.15, blink: false });   // a look at us: yes, this one works
A("rea", a + 0.3, "expr", { expr: "serene", dur: 0.15 });
d = drop(a + 0.75);
A("rea", d, "hide");
prop("box", d + 0.35, { ring: 0.5 }, 0.05); prop("box", d + 0.6, { ring: 0 }, 0.08);   // one contented wiggle
fx(d + 0.65, "zzz", { pos: [BX - 0.1, 1.95, BZ], dur: 1.0, count: 3 });
const askAt = d + 0.9, namesTo = d + 0.9, END0 = d + 1.6;   // the ask takes the names' place, up top

// ------------------------------------------------------------------ LOOP: a poof sets the coin trap again as the Dragon dives in (frame 0)
reset(END0, "rea", ["tea", "quiet"], "coins");
prop("fence", END0 + 0.08, { smash: 0 }, 0.01);
A("dra", END0 + 0.08, "show");
const END = END0 + 0.6;   // the reset poof has cleared by the last frame, which matches frame 0

c.finish(END, {
  shot: { pos: [0.05, 1.3, 5.8], look: [0.1, 0.95, -0.5], fov: 40 },
  at: { title: 232, sub: 362, name: 360, habit: 486, ask: 420 }, size: { title: 64, name: 76 },
  title: "HOW TO CATCH ME:", ask: "how would they\ncatch YOU?", askAt, namesTo, cover: 0.3,
  file: new URL("./catch-01-how-to-catch-me.json", import.meta.url).pathname,
});
void r3;
