// BUS: "how each fighter catches the bus", to Jonny's rules for the series (2026-10-24): a set that fits the activity
// (a bus stop on a town street) and, for every fighter, a habit real people have at the bus stop, done their own
// signature way. One continuous take: the buses come from the left, stop at the stop and drive off to the right, one
// per turn. The Reaper sleeps on the bench the whole time (his turn is the bus he sleeps through). Frame 0 is the
// Astronaut on his phone while a bus pulls in, and the last frame sets that up again.
// Writes a beat storyboard (docs/STORYBOARD.md): storyboards/bus-01-bus-stop.json, one beat per fighter.
//   node storyboards/make-bus.mjs
import { writeFileSync } from "node:fs";

const r3 = (x) => Math.round(x * 1000) / 1000;
const ROAD_Y = -0.12, BZ = -1.42;                  // the bus's near side (the kerb is at z -1.15)
const BS = 1.5, BX = 0.75, OFFL = -3.0, OFFR = 6.9;  // the bus's scale (a potato is ~1.3 tall); its door when it stops; off-screen left and right
const MARK = [0.2, -0.5], WAIT = [1.0, -0.15], ENTER = [2.9, -0.2], DOOR = [BX, -1.2];   // queue from the right
const BENCH = [-0.75, -0.8];
const ARRIVE = 0.5, LEAVE = 0.55;                    // a bus pulls in (slowing down) and drives off (speeding up)

const sb = {
  id: "bus-01-bus-stop",
  title: "BUS: how each fighter catches the bus",
  format: "each-character-vs-X, one continuous take: fighters queue at a bus stop, each catches (or misses) a bus their own way",
  fps: 30, set: { type: "street" }, sound: { sfx: 0.5 }, escalation: false, loop: true, cover: 0,
  cast: [], beats: [], shots: [], captions: [],
  props: [
    { id: "bench", kind: "bench", x: BENCH[0], z: BENCH[1] },
    // frame 0: a bus already pulling in, 35 % of the way through its arrival (the last frame starts the same one)
    { id: "bus", kind: "bus", x: r3(OFFL + (BX - OFFL) * (1 - 0.65 ** 2)), y: ROAD_Y, z: BZ, scale: BS },
    { id: "toy", kind: "bus", x: 0.75, y: 0, z: 0.6, scale: 0 },
    { id: "phone", kind: "phone", x: MARK[0] + 0.3, y: 0.5, z: MARK[1] + 0.3, glow: 1, scale: 1.6 },
  ],
};
const P0 = 0.35;   // how far into its arrival the frame-0 bus is

// ---- the timeline, written with absolute times; beats are cut from it at the end
const items = [];
const A = (who, t, what, o = {}) => items.push({ who, do: what, at: r3(t), ...o });
const prop = (id, t, set, dur = 0.3, ease = "inOut") => items.push({ do: "prop", id, at: r3(t), dur, ease, set });
const fx = (t, o) => items.push({ ...o, at: r3(t) });
const sfx = (t, s, o = {}) => items.push({ sfx: s, at: r3(t), ...o });
const walk = (who, t, to, dur, ease = "out", steps = 3) => A(who, t, "move", { to, dur, ease, steps });
// the bus: arrive at t (from off-screen left; it's put there at once, while off-screen), doors, leave
let busFree = 0;   // when the last bus has driven off-screen (a new one can't be fetched from the left before that)
// a beat whose bus arrives `lead` s after it starts: it starts at t, or later if the last bus isn't gone yet
const after = (t, lead) => Math.max(t, busFree + 0.02 - lead);
const bus = {
  arrive(t, { full } = {}) { if (t - 0.02 < busFree - 1e-6) throw new Error(`bus.arrive at ${r3(t)}: the last one is still on screen until ${r3(busFree)}`); prop("bus", t - 0.02, { x: OFFL, open: 0, bulge: 0, tilt: 0, roll: 0, ...(full != null && { full }) }, 0); prop("bus", t, { x: BX }, ARRIVE, "out"); sfx(t + ARRIVE - 0.08, "hiss", { gain: 0.25 }); return t + ARRIVE; },
  open(t) { prop("bus", t, { open: 1 }, 0.2); return t + 0.2; },
  close(t) { prop("bus", t, { open: 0 }, 0.2); return t + 0.2; },
  leave(t, to = OFFR) { prop("bus", t, { x: to }, LEAVE, "in"); sfx(t, "whoosh", { dur: 0.5, gain: 0.15 }); busFree = t + LEAVE; return t + LEAVE; },
};
// boarding: from the kerb in front of the door, a little hop up into the bus, gone once inside
const board = (who, t) => { A(who, t, "turn", { to: "back", dur: 0.15 }); A(who, t + 0.05, "hop", { height: 0.12, dur: 0.3 }); walk(who, t + 0.05, [BX, BZ - 0.15], 0.3, "inOut", 2); A(who, t + 0.35, "hide"); return t + 0.35; };

const beats = [];
const beat = (id, at, how, habit) => beats.push({ id, at: r3(at), how, habit });
const cast = (id, character, at, o = {}) => sb.cast.push({ id, character: `potatobrawl/${character}`, at, face: "camera", ...o });
const SEED = (i) => 1.1 + i * 0.7;
cast("ast", "astronaut", MARK, { expr: "delighted", seed: SEED(0) });
cast("rea", "reaper", BENCH, { expr: "serene", seed: SEED(1) });
const LATER = [["sor", "sorcerer"], ["wiz", "wizard"], ["dra", "dragon"], ["phx", "phoenix"], ["gun", "gunslinger"], ["sam", "samurai"], ["all", "allfather"], ["vik", "viking"]];
LATER.forEach(([id, ch], i) => cast(id, ch, ENTER, { expr: "kind", seed: SEED(i + 2) }));
for (const [id] of LATER) A(id, 0, "hide");
// next(id, t): walks in to the queue spot (shown at the edge first)
const queue = (id, t) => { A(id, t, "show"); walk(id, t, WAIT, 0.55); };

// ---- 1. Astronaut: glued to his phone, misses the bus, floats after it (frame 0: the bus pulling in)
let t = 0;
beat("ast", 0, "always on the app: the bus comes and goes while he stares at his phone, then he floats after it", "always on the app");
items.push({ who: "ast", do: "grab", prop: "phone", hand: "R", at: -0.1, dur: 0.05, off: [0.02, 0.08, 0.04] });
const PHONE_UP = { o: [-0.12, 0.62, 0.34] };   // the phone up in front of his chin
A("ast", -0.08, "arm", { side: "R", pose: PHONE_UP, dur: 0.05 }); A("ast", -0.1, "look", { to: [0.25, -0.35], dur: 0.05 });
A("ast", -0.1, "expr", { expr: "delighted", dur: 0.05 }); A("ast", -0.1, "arm", { side: "L", pose: "cheeks", dur: 0.05 });
A("rea", -0.1, "sit", { seat: "bench", dur: 0.05 }); A("rea", -0.1, "lean", { to: -0.3, dur: 0.05 });
prop("bus", 0, { x: BX }, r3(ARRIVE * (1 - P0)), "out"); sfx(r3(ARRIVE * (1 - P0) - 0.08), "hiss", { gain: 0.25 });
bus.open(0.5); for (const k of [0.15, 0.5, 0.85]) A("ast", k, "squash", { amount: 0.05, dur: 0.18 });   // giggling at something on the phone
bus.close(1.0); bus.leave(1.15);
A("ast", 1.3, "look", { to: [0.8, 0.2], dur: 0.12 }); A("ast", 1.3, "expr", { expr: "shocked" }); A("ast", 1.3, "arm", { side: "L", pose: "rest", dur: 0.2 });
A("ast", 1.45, "fly", { to: { y: 0.35 }, dur: 0.3 }); A("ast", 1.45, "turn", { to: "right", dur: 0.2 });
walk("ast", 1.55, [ENTER[0] + 0.2, MARK[1]], 0.7, "in", 0);
A("ast", 2.3, "hide");
queue("sor", 2.25);   // once the Astronaut has floated off that way

// ---- 2. Reaper: asleep on the bench since frame 0; a bus comes and goes; he opens one eye, and sleeps on
t = after(1.95, 0.05);
beat("rea", t, "falls asleep at the stop: sleeps through his bus, opens his eyes as it goes, sleeps on", "falls asleep");
fx(t + 0.05, { fx: "zzz", who: "rea", dur: 1.2, count: 3 });
A("rea", t + 0.1, "lean", { to: -0.42, dur: 0.4 }); A("rea", t + 0.5, "lean", { to: -0.25, dur: 0.4 });   // nodding off
let a = bus.arrive(t + 0.05); bus.open(a + 0.05); bus.close(a + 0.6); bus.leave(a + 0.75);
A("rea", a + 0.6, "lean", { to: 0, dur: 0.15 }); A("rea", a + 0.6, "expr", { expr: "deadpan", dur: 0.12 }); A("rea", a + 0.65, "look", { to: [0.8, 0], dur: 0.15 });
A("rea", a + 1.0, "look", { to: [0, 0], dur: 0.12 }); A("rea", a + 1.0, "expr", { expr: "serene", dur: 0.15 }); A("rea", a + 1.0, "lean", { to: -0.3, dur: 0.3 });
fx(a + 1.15, { fx: "zzz", who: "rea", dur: 1.4, count: 3 });
const reaEnd = a + 1.5;
queue("wiz", reaEnd - 0.2);

// ---- 3. Sorcerer: pushes in. He walks up to the mark; the bus opens, he looks round at the Wizard queueing, and
// vanishes in a green puff into the bus first
t = after(reaEnd - 0.55, 0.1);
beat("sor", t, "pushes in: the queue jumper, portals himself straight into the bus ahead of the Wizard", "pushes in");
walk("sor", t, MARK, 0.45); A("sor", t, "expr", { expr: "evil" });
a = bus.arrive(t + 0.1); bus.open(a);
A("sor", a - 0.1, "look", { to: [0.9, 0], dur: 0.15 });                         // checks who's behind him...
A("wiz", a, "lean", { to: 0.15, dur: 0.2 }); A("wiz", a + 0.5, "lean", { to: 0, dur: 0.2 });   // the Wizard leans in: his turn
A("sor", a + 0.15, "charge", { to: 1, dur: 0.2 }); A("sor", a + 0.15, "arm", { side: "L", pose: "cast", dur: 0.15 });
fx(a + 0.4, { fx: "poof", who: "sor", dur: 0.5, puffs: 8, sparks: 10, color: "#c9f7b0", spark: "#9dff6a" });
A("sor", a + 0.45, "hide"); sfx(a + 0.4, "poof", { gain: 0.3 });
fx(a + 0.45, { fx: "poof", pos: [BX, 0.6, BZ + 0.1], dur: 0.45, puffs: 5, sparks: 8, color: "#c9f7b0", spark: "#9dff6a" });
A("wiz", a + 0.45, "expr", { expr: "shocked" }); A("wiz", a + 0.5, "look", { to: [-0.4, -0.2], dur: 0.1 });
const sorClose = bus.close(a + 0.6); bus.leave(sorClose);
const sorEnd = sorClose + 0.25;

// ---- 4. Wizard: a spell to make the next bus come... brings a toy one. He shrinks himself to fit and rides it off
t = sorEnd - 0.2;
beat("wiz", t, "the spell goes wrong: summons a toy bus, shrinks himself and rides it", "the spell goes wrong");
walk("wiz", t, MARK, 0.35); A("wiz", t + 0.05, "look", { to: [0, 0], dur: 0.12 }); A("wiz", t + 0.1, "expr", { expr: "eager" });
A("wiz", t + 0.35, "arm", { side: "R", pose: "cast", dur: 0.15 }); A("wiz", t + 0.35, "charge", { to: 1, dur: 0.25 });
fx(t + 0.6, { fx: "poof", pos: [0.35, 0.05, 0.4], dur: 0.5, puffs: 6, sparks: 10, spark: "#c8b6ff" }); sfx(t + 0.6, "poof", { gain: 0.3 });
prop("toy", t + 0.62, { scale: 0.45 }, 0.15, "out");
A("wiz", t + 0.65, "charge", { to: 0, dur: 0.15 }); A("wiz", t + 0.7, "arm", { side: "R", pose: "rest", dur: 0.2 });
A("wiz", t + 0.75, "look", { to: [0.6, -0.6], dur: 0.12 }); A("wiz", t + 0.8, "expr", { expr: "sad" }); A("wiz", t + 0.8, "droop", { to: 1, dur: 0.25 });
sfx(t + 0.8, "sadslide", { gain: 0.2 });
A("wiz", t + 1.05, "expr", { expr: "eager" }); A("wiz", t + 1.05, "droop", { to: 0, dur: 0.2 });
fx(t + 1.15, { fx: "poof", who: "wiz", dur: 0.45, puffs: 6, sparks: 8, spark: "#c8b6ff" }); A("wiz", t + 1.15, "grow", { to: 0.3, dur: 0.2 });
A("wiz", t + 1.4, "hop", { height: 0.15, dur: 0.3 }); walk("wiz", t + 1.4, [0.45, 0.4], 0.3, "inOut", 2); A("wiz", t + 1.68, "hide");
prop("toy", t + 1.75, { x: 3.6 }, 0.6, "in"); prop("toy", t + 2.4, { scale: 0 }, 0);   // gone, off-screen sfx(t + 1.75, "horn", { dur: 0.15, gain: 0.12 });   // beep beep
const wizEnd = t + 1.85;
queue("dra", sorEnd - 0.1);

// ---- 5. Dragon: keeps leaning out into the road to check if it's coming; it nearly clips him, a puff of fire, then on
t = after(wizEnd - 0.2, 0.75);
beat("dra", t, "keeps checking if it's coming: leans out into the road, the bus nearly gets him, a fright of fire", "keeps checking");
walk("dra", t, [MARK[0], -0.9], 0.35); A("dra", t + 0.3, "expr", { expr: "eager" });
A("dra", t + 0.4, "lean", { to: -0.45, dur: 0.25 }); A("dra", t + 0.4, "look", { to: [-0.9, 0], dur: 0.12 });
A("dra", t + 0.75, "lean", { to: -0.1, dur: 0.15 }); A("dra", t + 0.75, "look", { to: [0, 0], dur: 0.1 });
A("dra", t + 0.95, "lean", { to: -0.5, dur: 0.2 }); A("dra", t + 0.95, "look", { to: [-0.9, 0], dur: 0.1 });
a = bus.arrive(t + 0.75);
A("dra", t + 1.05, "expr", { expr: "shocked" }); A("dra", t + 1.05, "lean", { to: 0.1, dur: 0.15 }); A("dra", t + 1.05, "wings", { to: 1, dur: 0.12 });
A("dra", t + 1.08, "hop", { height: 0.15, dur: 0.3 }); walk("dra", t + 1.08, MARK, 0.3, "out", 2);
fx(t + 1.1, { fx: "poof", pos: [MARK[0] - 0.1, 1.0, -0.6], dur: 0.45, puffs: 4, sparks: 10, color: "#ffc27a", spark: "#ff7a1a" }); sfx(t + 1.1, "whoosh", { dur: 0.35, gain: 0.25 });
A("dra", t + 1.45, "wings", { to: 0, dur: 0.2 }); A("dra", t + 1.45, "lean", { to: 0, dur: 0.15 }); A("dra", t + 1.5, "expr", { expr: "happy" });
bus.open(a + 0.05); A("dra", a + 0.3, "look", { to: [0, 0], dur: 0.1 }); board("dra", a + 0.35);
queue("phx", wizEnd);

// ---- 6. Phoenix: busy with his hair while the Dragon's bus waits; runs for it and the doors shut in his face
t = a + 0.55;
beat("phx", t, "runs for it: too busy with his hair, dashes as the doors close, splat", "runs for it");
A("phx", t - 0.3, "arm", { side: "R", pose: "hat", dur: 0.15 }); A("phx", t - 0.3, "expr", { expr: "cocky" });
A("phx", t - 0.05, "squash", { amount: 0.04, dur: 0.2 }); A("phx", t + 0.2, "squash", { amount: 0.04, dur: 0.2 });
bus.close(t + 0.45);
A("phx", t + 0.45, "expr", { expr: "shocked" }); A("phx", t + 0.45, "look", { to: [-0.6, -0.2], dur: 0.1 }); A("phx", t + 0.5, "arm", { side: "R", pose: "rest", dur: 0.15 });
A("phx", t + 0.6, "wings", { to: 1, dur: 0.12 }); walk("phx", t + 0.6, [BX + 0.05, -1.08], 0.25, "in", 3);
fx(t + 0.85, { fx: "poof", pos: [BX + 0.05, 0.75, -1.15], dur: 0.6, puffs: 3, sparks: 12, spark: "#ffe14d" });
fx(t + 0.85, { fx: "shake", dur: 0.2, amp: 0.035 }); sfx(t + 0.85, "impact", { gain: 0.35 });
A("phx", t + 0.85, "squash", { amount: 0.3, dur: 0.25 }); A("phx", t + 0.85, "expr", { expr: "dizzy" }); A("phx", t + 0.85, "wings", { to: 0, dur: 0.2 });
bus.leave(t + 1.05);
A("phx", t + 1.45, "expr", { expr: "cocky" }); A("phx", t + 1.45, "arm", { side: "both", pose: "hips", dur: 0.2 }); A("phx", t + 1.45, "look", { to: [0, 0], dur: 0.12 });
A("phx", t + 1.75, "turn", { to: "right", dur: 0.15 }); A("phx", t + 1.75, "fly", { to: { x: 3.4, y: 1.0, z: -0.9 }, dur: 0.55 }); A("phx", t + 2.3, "hide");
const phxEnd = t + 1.75, draEnd = t;
queue("gun", t + 0.6);

// ---- 7. Gunslinger: waves it down like a taxi: the bus is about to drive past, a shot in the air, it screeches back
t = after(phxEnd - 0.1, 0.15);
beat("gun", t, "waves it down: the bus almost drives past, one shot in the air, it screeches to a stop", "waves it down");
walk("gun", t, MARK, 0.4); A("gun", t + 0.1, "expr", { expr: "cocky" });
prop("bus", t + 0.15, { x: OFFL, open: 0 }, 0); prop("bus", t + 0.2, { x: 1.9 }, 0.42, "linear");    // not slowing down
A("gun", t + 0.45, "arm", { side: "R", pose: "up", dur: 0.12 });
fx(t + 0.6, { fx: "poof", pos: [MARK[0] + 0.2, 1.45, MARK[1]], dur: 0.35, puffs: 2, sparks: 8, spark: "#ffd34d" }); sfx(t + 0.6, "impact", { gain: 0.3 });
fx(t + 0.6, { fx: "flash", dur: 0.08, peak: 0.25 });
prop("bus", t + 0.7, { x: BX, roll: -2.5 }, 0.45, "inOut"); sfx(t + 0.62, "screech", { dur: 0.5, gain: 0.3 });    // brakes, backs up
prop("bus", t + 1.15, { roll: 0 }, 0.2, "out");
A("gun", t + 0.8, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("gun", t + 1.0, "expr", { expr: "smug" });
bus.open(t + 1.2); board("gun", t + 1.35); bus.close(t + 1.7); bus.leave(t + 1.85);
const gunEnd = t + 1.85;
queue("sam", phxEnd);

// ---- 8. Samurai: stands too close to the kerb; the bus drives through the puddle, he slices the splash in two
t = after(gunEnd - 0.1, 0.3);
beat("sam", t, "stands too close to the kerb: the bus splashes him, he cuts the splash in half", "too close to the kerb");
walk("sam", t, [MARK[0] + 0.15, -0.95], 0.4); A("sam", t + 0.1, "expr", { expr: "focused" });
a = bus.arrive(t + 0.3);
const sp = t + 0.3 + 0.42;   // the front wheel in the puddle
fx(sp, { fx: "poof", pos: [-0.2, -0.2, -1.4], dur: 0.25, puffs: 10, sparks: 14, color: "#bfe6ff", spark: "#4aa8ff" }); sfx(sp, "whoosh", { dur: 0.3, gain: 0.25 });
A("sam", sp - 0.08, "arm", { side: "R", pose: "up", dur: 0.12 }); A("sam", sp + 0.06, "arm", { side: "R", pose: "point", dur: 0.12 });
fx(sp + 0.08, { fx: "speedlines", dur: 0.18 }); fx(sp + 0.1, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(sp + 0.1, "tink", { gain: 0.25 });
fx(sp + 0.14, { fx: "poof", pos: [-0.75, 0.1, -0.9], dur: 0.45, puffs: 5, sparks: 8, color: "#bfe6ff", spark: "#4aa8ff" });
fx(sp + 0.14, { fx: "poof", pos: [0.95, 0.1, -0.9], dur: 0.45, puffs: 5, sparks: 8, color: "#bfe6ff", spark: "#4aa8ff" });
A("sam", sp + 0.4, "arm", { side: "R", pose: "rest", dur: 0.2 }); A("sam", sp + 0.45, "expr", { expr: "serene" });
bus.open(a + 0.15); A("sam", a + 0.45, "expr", { expr: "focused" }); board("sam", a + 0.45); bus.close(a + 0.8); bus.leave(a + 0.95);
const samEnd = a + 0.95;
queue("all", gunEnd + 0.35);

// ---- 9. Allfather: gets on the wrong bus: it starts off, stops, he steps back out and glares at its number
t = after(samEnd - 0.1, 0.05);
beat("all", t, "gets on the wrong bus: on, off again, glares at it", "takes the wrong bus");
walk("all", t, MARK, 0.4); A("all", t + 0.1, "expr", { expr: "stern" });
a = bus.arrive(t + 0.05); bus.open(a); board("all", a + 0.1); bus.close(a + 0.45);
prop("bus", a + 0.5, { x: BX + 0.4 }, 0.3, "inOut"); sfx(a + 0.75, "hiss", { gain: 0.25 });
bus.open(a + 0.75);
A("all", a + 0.7, "move", { to: [BX + 0.4, -1.3], dur: 0.01 }); A("all", a + 0.7, "turn", { to: "camera", dur: 0.01 }); A("all", a + 0.85, "show");
A("all", a + 0.87, "hop", { height: 0.1, dur: 0.22 }); walk("all", a + 0.87, [BX + 0.1, -0.7], 0.25, "inOut", 2);
A("all", a + 1.15, "turn", { to: "back", dur: 0.25 }); A("all", a + 1.2, "look", { to: [0, 0.5], dur: 0.15 });
bus.close(a + 1.3); bus.leave(a + 1.45);
A("all", a + 1.65, "turn", { to: "camera", dur: 0.2 }); A("all", a + 1.7, "arm", { side: "both", pose: "hips", dur: 0.2 }); A("all", a + 1.7, "look", { to: [0, 0], dur: 0.1 });
A("all", a + 1.95, "turn", { to: "left", dur: 0.2 }); walk("all", a + 1.95, [0.55, 0.15], 0.3, "inOut", 2); walk("all", a + 2.25, [-2.9, 0.15], 0.7, "linear"); A("all", a + 2.95, "hide");   // stomps off
const allEnd = a + 2.4;


// ---- 10. Viking: squeezes into a full bus; it bulges, sags, and drives off with him stuck in the door
t = after(allEnd - 0.15, 0.1);
beat("vik", t, "squeezes into a full bus: it bulges and drives off with him stuck in the door", "the bus is full");
A("vik", t - 0.1, "show"); walk("vik", t - 0.1, MARK, 0.7); A("vik", t + 0.3, "expr", { expr: "delighted" });   // straight in (the Allfather went the other way)
a = bus.arrive(t + 0.1, { full: 1 }); bus.open(a);
A("vik", a - 0.05, "expr", { expr: "shocked" });
A("vik", a + 0.25, "expr", { expr: "stern" }); A("vik", a + 0.25, "turn", { to: "back", dur: 0.15 }); A("vik", a + 0.25, "arm", { side: "both", pose: "up", dur: 0.15 });
walk("vik", a + 0.3, [BX, BZ + 0.15], 0.3, "in", 2);
prop("bus", a + 0.55, { bulge: 1.2 }, 0.15, "out"); prop("bus", a + 0.7, { bulge: 1.0 }, 0.12); prop("bus", a + 0.82, { bulge: 1.1 }, 0.15);
fx(a + 0.55, { fx: "shake", dur: 0.25, amp: 0.04 }); sfx(a + 0.55, "impact", { gain: 0.35 }); A("vik", a + 0.55, "squash", { amount: 0.2, dur: 0.25 });
prop("bus", a + 0.6, { open: 0.45 }, 0.15);
const vikGo = a + 1.15; prop("bus", vikGo, { x: OFFR }, 0.9, "in"); busFree = vikGo + 0.9; walk("vik", vikGo, [OFFR, BZ + 0.15], 0.9, "in", 0); sfx(vikGo, "horn", { dur: 0.45, gain: 0.25 });
A("vik", vikGo + 0.9, "hide");

// ---- the loop: the Astronaut walks back on, phone out, as the next bus pulls in. The last frame is frame 0.
const back = vikGo + 0.2;
A("ast", back - 0.05, "drop", { to: 0, dur: 0.02 }); A("ast", back - 0.05, "move", { to: [-2.9, 0.15], dur: 0.01 }); A("ast", back - 0.05, "turn", { to: "right", dur: 0.01 });   // back round from the left
A("ast", back - 0.05, "expr", { expr: "delighted" }); A("ast", back - 0.05, "arm", { side: "R", pose: PHONE_UP, dur: 0.01 }); A("ast", back - 0.05, "arm", { side: "L", pose: "cheeks", dur: 0.01 }); A("ast", back - 0.05, "look", { to: [0.25, -0.35], dur: 0.01 });
A("ast", back, "show"); walk("ast", back, [-0.15, 0.05], 0.5, "linear"); walk("ast", back + 0.5, MARK, 0.3, "out", 2); A("ast", back + 0.55, "turn", { to: "camera", dur: 0.2 });
const end = r3(back + 1.05);
// the next bus, timed so the frame after the last is frame 0 (35 % into the same arrival)
const busStart = end - P0 * ARRIVE;
if (busStart - 0.05 < busFree) throw new Error(`the loop's bus at ${r3(busStart)} comes before the Viking's has gone (${r3(busFree)})`);
prop("bus", busStart - 0.05, { x: OFFL, open: 0, bulge: 0, tilt: 0, roll: 0, full: 0 }, 0); prop("bus", busStart, { x: BX }, ARRIVE, "out");
A("rea", end - 0.6, "look", { to: [0, 0], dur: 0.1 });

// ---- beats: each item goes to the beat it starts in (times relative to the beat)
beats.sort((x, y) => x.at - y.at);
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "sam", "all", "vik"];
for (const [i, b] of beats.entries()) {
  const nextAt = beats[i + 1]?.at ?? end, mine = items.filter((x) => (x.at >= b.at || i === 0) && x.at < nextAt);
  sb.beats.push({ name: `${b.id}: ${b.how}`, at: b.at, len: r3(nextAt - b.at), do: mine.map((x) => ({ ...x, at: r3(x.at - b.at) })) });
}
const last = items.filter((x) => x.at >= end);
if (last.length) throw new Error(`items after the end: ${JSON.stringify(last)}`);
sb.duration = end;
// contact on purpose: boarding (a fighter going in the door), the Dragon riding the roof, the Viking stuck in the door,
// the Reaper on his bench
sb.allowClip = [
  ...["gun", "sam", "all", "vik", "dra", "phx"].map((who) => ({ who, with: "bus", from: 0, to: 99 })),
  { who: "rea", with: "bench", from: 0, to: 99 }, { who: "ast", with: "phone", from: 0, to: 99 }, { who: "wiz", with: "toy", from: 0, to: 99 },
];
// one camera, no cuts
sb.shots.push({ at: 0, pos: [0.12, 1.65, 7.0], look: [0.12, 1.35, -1.5], fov: 35 });
// captions: the title, the hook, then each fighter's name and habit while it's their turn, then the question
sb.captions.push({ from: 0, to: end, text: "BUS STOP", style: "label", pos: 230, pop: false });
sb.captions.push({ from: 0, to: 1.0, text: "1 bus. 10 fighters.", pos: 340 });
const NAMES = { ast: "ASTRONAUT", rea: "REAPER", sor: "SORCERER", wiz: "WIZARD", dra: "DRAGON", phx: "PHOENIX", gun: "GUNSLINGER", sam: "SAMURAI", all: "ALLFATHER", vik: "VIKING" };
const ask = r3(vikGo + 0.3);
for (const [i, b] of beats.entries()) {
  const from = i ? r3(b.at) : 1.0, to = i === beats.length - 1 ? ask : beats[i + 1].at;
  sb.captions.push({ from, to, text: NAMES[b.id], style: "label", pos: 340, pop: false }, { from, to, text: b.habit, pos: 425 });
}
sb.captions.push({ from: ask, to: end, text: "which one are you?", pos: 340 });
sb.cover = r3(beats.find((b) => b.id === "vik").at + 1.3);
if (end > 20) sb.escalation = true;   // over 20 s: the biggest (the Viking) is last
writeFileSync(new URL("./bus-01-bus-stop.json", import.meta.url), JSON.stringify(sb, null, 1));
console.log(`bus-01-bus-stop: ${end} s, ${beats.length} beats: ${beats.map((b) => `${b.id} ${b.at}`).join(", ")}`);
