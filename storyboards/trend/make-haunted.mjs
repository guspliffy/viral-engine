// HAUNTED HOUSE (but it's your real fears): the "A haunted house, but..." trend (Know Your Meme, 23 Oct 2026) as an
// "each fighter, one continuous scene" clip. A haunted corridor at night; an upright coffin rattles and opens for each
// fighter, and the monster inside is a boring real-life fear. Each reacts their own way (the Wizard messes up, the
// Samurai slices, the Gunslinger shoots, the Viking destroys), gentle to destructive, the Viking's wreck last, and a
// poof resets it all as the Reaper walks back in (the loop).
// Script: Jonny picked it on 25 Oct from the doc "Viral trend scripts: week of 18-25 Oct 2026".
//   node storyboards/trend/make-haunted.mjs   -> storyboards/trend/haunted-01-real-fears.json
import { clip, r3 } from "./lib.mjs";

const CX = 0.35, WALL = -1.6;                       // the coffin's foot (set-haunted.js HAUNTED)
const S = [-0.58, -0.5];                           // where each fighter stops, left of the coffin
const ENTER = [-1.9, -0.5], STEP = [-0.35, -0.1], EXIT = [2.2, -0.1];
const POP = [CX, 0.62, -1.05], IN = [CX, 0.62, -1.42];   // where a fear pops out to (and where it hides inside)
const LOOK_COFFIN = [0.7, 0.1], LOOK_CAM = [0, 0];

const c = clip({ id: "haunted-01-real-fears", title: "HAUNTED HOUSE: but it's your real fears",
  format: "each-character-vs-X, one continuous take: an upright coffin opens for each fighter, the monster is a boring real fear, each reacts with a relatable habit + their signature, destructive last",
  set: { type: "haunted", night: true }, music: { styles: ["sneaky"] }, sound: { sfx: 0.5, ambience: 0.4 } });
const { A, arm, prop, fx, sfx, walk } = c;

c.addProp({ id: "coffin", kind: "coffin", x: CX, z: WALL, open: 0.45, glow: 1 });
// the fears, each hidden inside the coffin until its turn
const fear = (id, spec) => c.addProp({ id, x: IN[0], y: IN[1], z: IN[2], scale: 0, ...spec });
fear("banner", { kind: "banner", text: "SURPRISE!", width: 0.8, sag: 0.1, x: CX - 0.04, y: 1.25, z: -1.0, scale: 1 });   // across the open mouth, clear of the door
fear("balloons", { kind: "balloons", y: 0.35, z: -1.45, scale: 1.3 });
c.addProp({ id: "confetti", kind: "confetti", x: CX, y: 1.05, z: -1.3, floor: 1.05, burst: 0.12 });
fear("call", { kind: "screen", mode: "call" });
fear("likes", { kind: "screen", mode: "likes" });
fear("letter", { kind: "letter" });
c.addProp({ id: "letters", kind: "letters", x: CX, y: 0.95, z: -1.25, floor: 0.95, count: 26 });
fear("voice", { kind: "screen", mode: "voice" });
fear("alarm", { kind: "alarm" });
fear("printer", { kind: "printer", y: 0, jam: true, sheetScale: 1.7 });
fear("flatpack", { kind: "flatpack", y: 0 });

// a fear pops out of the open coffin (and back in, hidden, when the turn ends)
const popOut = (id, t, scale, to = POP, dur = 0.24) => { prop(id, t, { scale, x: to[0], y: to[1], z: to[2] }, dur, "back"); };
const hideFear = (id, t) => prop(id, t, { scale: 0 }, 0.12, "in");
const rattle = (t, len = 0.35) => { prop("coffin", t, { ring: 1 }, 0.05); prop("coffin", t + len, { ring: 0 }, 0.08); sfx(t, "creak", { gain: 0.3, dur: len + 0.1 }); };
const openUp = (t) => { prop("coffin", t, { open: 1, glow: 1 }, 0.2, "out"); sfx(t, "creak", { gain: 0.25, dur: 0.25 }); };
const shut = (t) => { prop("coffin", t, { open: 0, glow: 0 }, 0.22, "inOut"); sfx(t + 0.2, "land", { gain: 0.25 }); };
// a fighter walks in from the left and turns toward the coffin; at the end of the turn steps forward and walks off right
// (it waits a beat so the last fighter is clear of the spot first)
const comeIn = (id, t, wait = 0.3) => { t += wait; A(id, t, "show"); walk(id, t, S, 0.55, "out", 4); A(id, t + 0.4, "turn", { to: "3q-right", dur: 0.2 }); A(id, t + 0.45, "look", { to: LOOK_COFFIN, dur: 0.2, blink: false }); return t + 0.55; };
const goOff = (id, t) => {
  A(id, t, "turn", { to: "right", dur: 0.18 }); walk(id, t, STEP, 0.3, "in", 2); walk(id, t + 0.3, EXIT, 0.75, "linear", 5); A(id, t + 1.05, "hide");
  return t + 1.05;
};

// ------------------------------------------------------------------ 0.0 REAPER: a surprise party (frame 0 mid-burst)
c.cast("rea", S, { face: "3q-right", expr: "shocked" });
c.turn("rea", 0, "a surprise party");
prop("coffin", 0, { open: 1 }, 0.14, "out");
prop("confetti", 0, { burst: 0.5 }, 0.15, "out"); prop("confetti", 0.15, { burst: 1 }, 1.45, "linear");   // fills the frame by 0.3 s
sfx(0, "partyhorn", { gain: 0.45 }); sfx(0.02, "pop", { gain: 0.35 });
A("rea", 0, "look", { to: LOOK_COFFIN, dur: 0.01, blink: false });
A("rea", 0, "expr", { expr: "shocked", set: { eye: 1.3, pupil: 0.7 }, dur: 0.01 });
walk("rea", 0.1, [S[0] - 0.08, S[1] + 0.1], 0.3, "out", 2);
A("rea", 0.1, "still", { dur: 0.75, idle: 0.1 });
A("rea", 0.9, "look", { to: LOOK_CAM, dur: 0.15, blink: false });   // deadpan to us: no.
A("rea", 0.95, "expr", { expr: "deadpan", dur: 0.15 });
fx(1.35, "poof", { pos: [S[0] - 0.08, 0.6, S[1] + 0.1], color: "#2a2233", spark: "#8f7fb5", puffs: 6, sparks: 8, dur: 0.6 });
sfx(1.35, "poof", { gain: 0.35 });
A("rea", 1.42, "hide");
// the party goes back in the coffin behind a poof (the confetti stays on the floor till the reset), then it shuts
fx(1.45, "poof", { pos: [CX, 0.95, -1.05], puffs: 5, sparks: 0, dur: 0.45 });
prop("banner", 1.5, { scale: 0 }, 0.01); prop("balloons", 1.5, { scale: 0 }, 0.01);
shut(1.6);
let t = 1.45;

// ------------------------------------------------------------------ ASTRONAUT: an unknown number calling
c.cast("ast", ENTER, { face: "right", expr: "kind", hidden: true });
c.turn("ast", t, "unknown number calling", { capAt: t + 1.25 });   // the fear pops as the coffin opens
let a = comeIn("ast", t);
rattle(a + 0.05); openUp(a + 0.4); popOut("call", a + 0.45, 4.2);
prop("call", a + 0.6, { ring: 1 }, 0.05); sfx(a + 0.6, "ringtone", { gain: 0.35, dur: 1.15 });
A("ast", a + 0.62, "expr", { expr: "shocked", set: { eye: 1.25 }, dur: 0.1 });
A("ast", a + 0.62, "squash", { amount: 0.08, dur: 0.2 });
A("ast", a + 0.8, "fly", { to: { x: S[0] - 0.3, y: 0.6, z: S[1] - 0.1 }, dur: 0.4, ease: "out" });     // up out of reach, very still: nobody's home
A("ast", a + 0.85, "look", { to: [0.3, -0.4], dur: 0.15, blink: false });
A("ast", a + 1.25, "still", { dur: 0.55, idle: 0.05 });
A("ast", a + 1.25, "expr", { expr: "deadpan", set: { press: 1 }, dur: 0.15 });
prop("call", a + 1.75, { ring: 0, glow: 0.2 }, 0.1);                         // it stops ringing
A("ast", a + 1.85, "expr", { expr: "kind", dur: 0.15 });
shut(a + 1.85); hideFear("call", a + 1.85);
A("ast", a + 1.95, "fly", { to: { x: EXIT[0], y: 0.6, z: STEP[1] }, dur: 0.9, ease: "inOut" });
A("ast", a + 2.85, "hide");
t = a + 1.9;

// ------------------------------------------------------------------ PHOENIX: posted it, 0 likes
c.cast("phx", ENTER, { face: "right", expr: "cocky", hidden: true });
c.turn("phx", t, "posted it, 0 likes", { capAt: t + 1.25 });   // the fear pops as the coffin opens
A("phx", t, "wings", { to: 1, dur: 0.01 });
a = comeIn("phx", t);
A("phx", a, "expr", { expr: "cocky", dur: 0.1 });
rattle(a + 0.05); openUp(a + 0.4); popOut("likes", a + 0.45, 4.2);
A("phx", a + 0.5, "lean", { to: -6, dur: 0.2 });   // leans in, proud...
A("phx", a + 0.75, "expr", { expr: "shocked", set: { eye: 1.2 }, dur: 0.08 });
A("phx", a + 0.95, "lean", { to: 0, dur: 0.2 });
A("phx", a + 1.0, "expr", { expr: "sad", dur: 0.2 });
A("phx", a + 1.0, "wings", { to: 0, dur: 0.45, ease: "in" });               // ...and the flame goes out
A("phx", a + 1.05, "droop", { to: 1, dur: 0.3 });
fx(a + 1.05, "poof", { pos: [S[0] - 0.25, 0.85, S[1] - 0.05], color: "#8d8a94", puffs: 3, sparks: 0, dur: 0.5 });
fx(a + 1.08, "poof", { pos: [S[0] + 0.25, 0.85, S[1] - 0.05], color: "#8d8a94", puffs: 3, sparks: 0, dur: 0.5 });
sfx(a + 1.0, "sadslide", { gain: 0.35 });
A("phx", a + 1.5, "look", { to: [0, -0.5], dur: 0.2, blink: false });
shut(a + 1.75); hideFear("likes", a + 1.75);
A("phx", a + 1.8, "lean", { to: 8, dur: 0.25 });
goOff("phx", a + 1.85);
t = a + 1.85;

// ------------------------------------------------------------------ WIZARD: hit reply-all (the unsend spell goes wrong)
c.cast("wiz", ENTER, { face: "right", expr: "kind", hidden: true });
c.turn("wiz", t, "hit reply-all", { capAt: t + 1.25 });   // the fear pops as the coffin opens
a = comeIn("wiz", t);
rattle(a + 0.05); openUp(a + 0.4); popOut("letter", a + 0.45, 2.1, [CX, 0.75, -1.12]);
A("wiz", a + 0.7, "expr", { expr: "shocked", dur: 0.1 });
A("wiz", a + 0.85, "expr", { expr: "focused", dur: 0.12 });
arm("wiz", a + 0.85, "L", { o: [0.26, 0.3, 0.06] }, 0.2, "settle");   // the staff comes up (the jar test's zap)
A("wiz", a + 0.9, "charge", { to: 1, dur: 0.25, ease: "in" }); sfx(a + 0.9, "charge", { gain: 0.25, dur: 0.3 });
arm("wiz", a + 1.12, "L", { o: [0.3, 0.72, 0.18] }, 0.12, "out");
fx(a + 1.2, "flash", { peak: 0.3, dur: 0.15 });
hideFear("letter", a + 1.2);
prop("letters", a + 1.2, { burst: 0.4 }, 0.12, "out"); prop("letters", a + 1.32, { burst: 1 }, 1.25, "linear"); sfx(a + 1.2, "flutter", { gain: 0.4, dur: 1.0 });   // everyone gets one
A("wiz", a + 1.3, "charge", { to: 0, dur: 0.25 });
A("wiz", a + 1.3, "expr", { expr: "shocked", set: { eye: 1.25 }, dur: 0.1 });
A("wiz", a + 1.3, "hatwobble", { amount: 8, freq: 3, dur: 0.8 });
A("wiz", a + 1.35, "look", { to: [0.2, 0.6], dur: 0.2, blink: false });
arm("wiz", a + 1.5, "L", "rest", 0.35, "settle");
A("wiz", a + 1.75, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
A("wiz", a + 1.8, "expr", { expr: "kind", set: { curve: 0.1 }, dur: 0.15 });   // a sheepish smile
shut(a + 1.85);
goOff("wiz", a + 2.0);
t = a + 2.0;

// ------------------------------------------------------------------ SAMURAI: a 4-minute voice note (one cut)
// one overhead chop straight at the phone (the grip-safe poses from the Viking's axe test), so the vertical cut
// matches the phone splitting left and right
const UP = [{ o: [0.18, 0.95, 0.2] }, [10, 0]], CUT = [{ o: [0.12, 0.32, 0.45] }, [100, 0]], REST = [{ o: [0.24, 0.36, 0.08] }, null];
const sword = (tt, p, dur) => { arm("sam", tt, "R", p[0], dur); A("sam", tt, "tilt", { to: p[1], dur }); };
c.cast("sam", ENTER, { face: "right", expr: "focused", hidden: true, arms: { R: REST[0], L: { o: [0.15, 0.27, 0.08] } } });
c.turn("sam", t, "a 4-minute voice note", { capAt: t + 1.25 });   // the fear pops as the coffin opens
a = comeIn("sam", t);
rattle(a + 0.05); openUp(a + 0.4); popOut("voice", a + 0.45, 4.2);
A("sam", a + 0.75, "expr", { expr: "deadpan", dur: 0.12 });
A("sam", a + 0.75, "still", { dur: 0.25, idle: 0.1 });
sword(a + 1.0, UP, 0.16);
sword(a + 1.2, CUT, 0.12);
fx(a + 1.21, "slash", { pos: [CX - 0.1, 0.95, -1.0], r: 0.7, from: 108, arc: 100, dur: 0.16 });
sfx(a + 1.2, "whoosh", { gain: 0.25, dur: 0.18 }); sfx(a + 1.28, "shing", { gain: 0.25 });
prop("voice", a + 1.3, { split: 1 }, 0.22, "out");   // both halves apart by the hold
sword(a + 1.75, REST, 0.35);   // holds the cut a beat (the halves fall), then sheathes
A("sam", a + 1.6, "expr", { expr: "serene", dur: 0.15 });
A("sam", a + 1.65, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
hideFear("voice", a + 1.85); shut(a + 1.85);
goOff("sam", a + 2.05);
t = a + 2.0;

// ------------------------------------------------------------------ GUNSLINGER: Monday, 6:00 alarm
const AIM = { o: [0.14, 0.6, 0.5] }, HOLSTER = "rest";
c.cast("gun", ENTER, { face: "right", expr: "cocky", hidden: true });
c.turn("gun", t, "Monday, 6:00 alarm", { capAt: t + 1.25 });   // the fear pops as the coffin opens
a = comeIn("gun", t);
rattle(a + 0.05); openUp(a + 0.4); popOut("alarm", a + 0.45, 2.2, [CX, 0.7, -1.18]);
prop("alarm", a + 0.6, { ring: 1 }, 0.05); sfx(a + 0.6, "ring", { gain: 0.3, dur: 0.75 });
A("gun", a + 0.7, "expr", { expr: "stern", dur: 0.1 });
// the far hand aims (a near hand raised toward the coffin crosses his face in this three-quarter view)
arm("gun", a + 0.85, "L", AIM, 0.15, "out");
for (const [k, dt] of [[0, 1.1], [1, 1.28]]) {
  sfx(a + dt, "gunshot", { gain: 0.4 }); A("gun", a + dt, "squash", { amount: 0.05, dur: 0.1 });
  fx(a + dt + 0.02, "poof", { pos: [CX, 0.95, -1.05], puffs: 2, sparks: 8, spark: "#ffd36b", dur: 0.3 });
  void k;
}
prop("alarm", a + 1.05, { y: 0.85 }, 0.08, "out");   // a little jump off the muzzle first
prop("alarm", a + 1.13, { ring: 0, x: CX + 0.75, y: 0, z: -1.25, roll: 720, scale: 1.1 }, 0.5, "out", { arc: 0.6 });   // shot off, it lands on the floor (stays till the reset)
A("gun", a + 1.4, "expr", { expr: "smug", dur: 0.15 });
arm("gun", a + 1.55, "L", HOLSTER, 0.3);
A("gun", a + 1.65, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
shut(a + 1.75);
goOff("gun", a + 1.95);
t = a + 1.95;

// ------------------------------------------------------------------ ALLFATHER: the printer
c.cast("all", ENTER, { face: "right", expr: "stern", hidden: true });
c.turn("all", t, "the printer", { capAt: t + 1.25, capTo: t + 2.6 });
c.caption(t + 2.6, t + 3.35, "...PAPER JAM", { pop: true });   // the scorched printer still won't print
a = comeIn("all", t);
rattle(a + 0.05); openUp(a + 0.4);
popOut("printer", a + 0.45, 1.3, [CX, 0, -1.0], 0.3);
sfx(a + 0.75, "tink", { gain: 0.2 }); sfx(a + 0.95, "tink", { gain: 0.2 });   // the error beeps
A("all", a + 0.8, "expr", { expr: "stern", set: { browY: -0.02 }, dur: 0.12 });
A("all", a + 0.85, "still", { dur: 0.25, idle: 0.1 });
arm("all", a + 1.05, "R", { o: [0.4, 0.8, 0.22] }, 0.22, "out");   // the fist stays in shot
prop("bolt", a + 1.25, { on: 1 }, 0.01, "linear"); prop("bolt", a + 1.45, { on: 0 }, 0.01, "linear");
fx(a + 1.25, "flash", { peak: 0.35, dur: 0.18 }); fx(a + 1.25, "shake", { amp: 0.03, dur: 0.25 });
sfx(a + 1.25, "impact", { gain: 0.4 });
prop("printer", a + 1.27, { scorch: 1 }, 0.12);
fx(a + 1.3, "poof", { pos: [CX, 0.35, -0.95], color: "#55505c", puffs: 6, sparks: 6, spark: "#bfe4ff", dur: 0.8 });
arm("all", a + 1.5, "R", "rest", 0.3);
prop("printer", a + 1.65, { print: 1 }, 0.6, "inOut"); sfx(a + 1.65, "scribble", { gain: 0.2, dur: 0.5 });   // ...it prints: PAPER JAM
A("all", a + 1.85, "look", { to: [0.4, -0.35], dur: 0.15, blink: false });
A("all", a + 2.15, "expr", { expr: "deadpan", dur: 0.15 });
A("all", a + 2.15, "droop", { to: 1, dur: 0.3 });
A("all", a + 2.2, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
hideFear("printer", a + 2.45); prop("printer", a + 2.6, { scorch: 0, print: 0 }, 0.01);
shut(a + 2.45);
goOff("all", a + 2.5);
t = a + 2.5;
c.addProp({ id: "bolt", kind: "bolt", x: CX, y: 0.3, z: -0.98 });

// ------------------------------------------------------------------ VIKING: flat-pack instructions (destroys it all)
// (axe poses from a grip test: both keep the shaft in front of the forearm, square to it)
const AXE_UP = { o: [0.18, 0.95, 0.2] }, AXE_DOWN = { o: [0.1, 0.55, 0.48] };
c.cast("vik", ENTER, { face: "right", expr: "eager", hidden: true });
c.turn("vik", t, "flat-pack instructions", { capAt: t + 1.25 });   // the fear pops as the coffin opens
a = comeIn("vik", t);
rattle(a + 0.05); openUp(a + 0.4);
popOut("flatpack", a + 0.45, 1, [CX, 0, -1.3], 0.3);
prop("flatpack", a + 0.8, { unfold: 1 }, 1.1, "linear"); sfx(a + 0.8, "flutter", { gain: 0.3, dur: 1.0 });
A("vik", a + 0.85, "look", { to: [0.55, 0.7], dur: 0.6, blink: false });    // his eyes follow the pages up and up
A("vik", a + 1.2, "expr", { expr: "shocked", dur: 0.12 });
A("vik", a + 1.75, "expr", { expr: "stern", set: { browY: -0.03 }, dur: 0.1 });
A("vik", a + 1.75, "look", { to: LOOK_COFFIN, dur: 0.12, blink: false });
walk("vik", a + 1.7, [CX - 0.55, -0.82], 0.2, "out", 2);
A("vik", a + 1.78, "tilt", { to: [10, 0], dur: 0.2 }); arm("vik", a + 1.85, "L", AXE_UP, 0.22, "out");   // the shaft comes out in front first
A("vik", a + 1.85, "squash", { amount: 0.08, dur: 0.2 });
arm("vik", a + 2.12, "L", AXE_DOWN, 0.1, "in"); A("vik", a + 2.12, "tilt", { to: [90, 0], dur: 0.1 });
const SMASH = a + 2.2;
prop("alarm", SMASH - 1.3, { ring: 1 }, 0.03); prop("alarm", SMASH - 1.1, { ring: 0 }, 0.05); sfx(SMASH - 1.3, "ring", { gain: 0.2, dur: 0.2 });   // the floor alarm still twitches
prop("flatpack", SMASH, { smash: 1 }, 0.6, "out"); prop("coffin", SMASH + 0.02, { smash: 1, glow: 0 }, 0.7, "out");
fx(SMASH, "flash", { peak: 0.35, dur: 0.15 }); fx(SMASH, "shake", { amp: 0.06, dur: 0.4 });
fx(SMASH + 0.02, "poof", { pos: [CX, 0.25, -1.15], puffs: 6, sparks: 12, spark: "#ffcf6b", dur: 0.5 });
sfx(SMASH, "impact", { gain: 0.5 });
arm("vik", SMASH + 0.35, "L", { o: [0.5, 0.9, 0.3] }, 0.25); A("vik", SMASH + 0.35, "tilt", { to: [10, 0], dur: 0.25 });   // the axe up in triumph
A("vik", SMASH + 0.4, "expr", { expr: "delighted", dur: 0.15 });
A("vik", SMASH + 0.4, "look", { to: LOOK_CAM, dur: 0.15, blink: false });
A("vik", SMASH + 0.45, "hop", { height: 0.18, count: 2, dur: 0.6 });
arm("vik", SMASH + 1.0, "both", "rest", 0.3); A("vik", SMASH + 1.0, "tilt", { to: null, dur: 0.3 });
c.allow("sam", "voice", 10.6 + 1.2, 10.6 + 1.5, "the blade cuts through the phone: the cut is the joke");
c.allow("rea", "confetti", 0, 1.45, "confetti raining down around him: it's the surprise party, flakes behind him are hidden by his body");
c.allow("vik", "coffin", SMASH - 0.15, SMASH + 0.75, "the axe comes down on the coffin: the smash is the joke");
c.allow("vik", "flatpack", SMASH - 0.15, SMASH + 0.3, "the axe comes down on the booklet");
const askAt = SMASH + 0.5;

// ------------------------------------------------------------------ LOOP: a poof resets the corridor, the Reaper walks back in
const RESET = SMASH + 1.35;
fx(RESET, "poof", { pos: [CX, 0.8, -1.2], puffs: 12, sparks: 10, spark: "#c8b6ff", dur: 0.6 });
sfx(RESET, "poof", { gain: 0.35 });
prop("coffin", RESET + 0.05, { smash: 0, open: 0, glow: 0 }, 0.01); prop("flatpack", RESET + 0.05, { smash: 0, unfold: 0, scale: 0 }, 0.01);
prop("alarm", RESET + 0.05, { scale: 0, x: IN[0], y: IN[1], z: IN[2], roll: 0 }, 0.01); prop("confetti", RESET + 0.05, { burst: 0 }, 0.01);
prop("letters", RESET + 0.05, { burst: 0 }, 0.01);
goOff("vik", SMASH + 1.1);
// the Reaper is back at his spot as the coffin starts to rattle and open: frame 0
A("rea", RESET + 0.2, "expr", { expr: "kind", dur: 0.01 });
A("rea", RESET + 0.2, "move", { to: ENTER, dur: 0.01 });
A("rea", RESET + 0.2, "turn", { to: "right", dur: 0.01 });
const back = comeIn("rea", RESET + 0.2, 0);
rattle(back + 0.02, 0.28);
prop("coffin", back + 0.22, { open: 0.45, glow: 1 }, 0.12, "out");
prop("banner", back + 0.2, { scale: 1 }, 0.01); prop("balloons", back + 0.2, { scale: 1.3 }, 0.01);
A("rea", back + 0.15, "expr", { expr: "shocked", set: { eye: 1.3, pupil: 0.7 }, dur: 0.12 });
const END = back + 0.34;
prop("confetti", back + 0.25, { burst: 0.12 }, END - back - 0.25, "linear");

c.finish(END, {
  shot: { pos: [-0.1, 1.45, 6.3], look: [-0.1, 0.95, -0.8], fov: 32 },   // review B: closer, so the fears read on a phone
  moves: [{ at: r3(SMASH - 1.4), pos: [-0.1, 1.45, 6.3], look: [-0.1, 0.95, -0.8], fov: 32, to: { pos: [-0.1, 1.45, 6.3], fov: 28, look: [0.0, 0.85, -0.8] }, dur: 0.6, ease: "inOut" },
    { at: r3(RESET), pos: [-0.1, 1.45, 6.3], look: [0.0, 0.85, -0.8], fov: 28, to: { pos: [-0.1, 1.45, 6.3], fov: 32, look: [-0.1, 0.95, -0.8] }, dur: 0.45, ease: "inOut" }],
  at: { title: 232, sub: 340, name: 420, habit: 520, ask: 470 }, size: { title: 80, name: 76 },   // habit higher: the closer camera puts heads near 600
  title: "HAUNTED HOUSE", sub: "but it's your real fears", ask: "which one is YOUR\nhaunted house?", askAt, cover: 0.35,
  file: new URL("./haunted-01-real-fears.json", import.meta.url).pathname,
});
void r3;
