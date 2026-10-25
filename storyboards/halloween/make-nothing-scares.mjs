// Nothing Scares Reaper (Jonny's brief, version 1, 25 Oct 2026): a haunted-house pop-up ghost rises and Phoenix
// jumps; Reaper only blinks at it. A door opens on a warm meeting room, and a friendly Wizard says "Let's go around
// and share a fun fact." That is what scares Reaper: he steps behind Phoenix and whispers "Get me out." Wizard: "You
// first." Reaper ducks back, then (the coordinator's ending, approved with the brief) pushes Phoenix forward toward
// the Wizard's open palm and gives us his deadpan look again, which loops into "He said nothing scares him."
//
// One location (the haunted corridor with the nook: set-haunted.js NOOK), eight shots with cuts, captions carry the
// English lines (the voices are gibberish), and the music stops on "fun fact".
//
// Run: node storyboards/halloween/make-nothing-scares.mjs   -> storyboards/halloween/nothing-scares-reaper.json
import { writeFileSync } from "node:fs";

const r3 = (x) => Math.round(x * 1000) / 1000;
const items = [];
const at = (t, it) => items.push({ ...it, at: r3(t) });
const A = (t, who, what, o = {}) => at(t, { who, do: what, ...o });
const prop = (t, id, set, dur = 0.3, ease = "inOut") => at(t, { do: "prop", id, set, dur, ease });
const sfx = (t, s, o = {}) => at(t, { sfx: s, ...o });
const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
const say = (t, who, line, dur, tone = "calm") => A(t, who, "talk", { line, tone, dur });
const captions = [];
const LOW = 430, TOP = 250;   // dialogue sits in the empty wall above the heads (captions never cover a character)
const cap = (from, to, text, pos = LOW, pop = false) => captions.push({ from: r3(from), to: r3(to), text, pos, pop });

// ---------------------------------------------------------------- places (set-haunted.js HAUNTED + NOOK)
const WALL = -1.6, DOOR_X = 1.55, DOOR_W = 1.25, DOOR_H = 1.9;
const PHX = [-0.35, -0.2], REA = [0.85, -0.2];
const MID = [0.6, -1.08], HIDE = [-1.15, -0.82], DEEP = [-0.62, -0.98], PUSH_AT = [-0.78, -0.98], PUSH_TO = [-0.2, -1.1], STEP_BACK = [-0.62, -0.8];   // Reaper's two steps, then the duck back
const PHX_PUSHED = [0.4, -0.45];
const WIZ = [1.8, -3.05], WIZ_DOOR = [1.55, -2.05];
const CRATE = [1.32, -1.3];   // right beside Reaper: it pops up at his shoulder and he does not flinch

// eye targets ([x, y] in the face's own look space: + right on screen, + up)
const AT_CAM = [0, 0], AT_GHOST = [0.75, 0.3], PHX_AT_GHOST = [0.8, 0.25], AT_DOOR = [0.85, 0.12], AT_PHX = [-0.85, -0.05], AT_REA = [0.8, -0.05];
const WIZ_AT_PAIR = [-0.7, -0.08], WIZ_AT_REA = [-0.85, -0.12];

// poses (character space: o = [out, up, forward])
const SCYTHE = { o: [0.24, 0.36, 0.08] };        // the reference hold: fist out from the side, forearm square to the shaft
const WAVE = { o: [0.22, 0.36, 0.32] };            // Wizard's free hand up in a small welcome, palm open
const OFFER = { o: [0.12, 0.26, 0.42] };           // the inviting palm toward Reaper, low and forward (never a point)

const cast = [
  { id: "phx", character: "potatobrawl/phoenix", at: PHX, face: "camera", expr: "kind", follow: 0.6, seed: 1.3 },
  { id: "rea", character: "potatobrawl/reaper", at: REA, face: "camera", expr: "deadpan", follow: 0.5, seed: 2.1, arms: { R: SCYTHE } },
  { id: "wiz", character: "potatobrawl/wizard", at: WIZ, face: "3q-left", expr: "kind", follow: 0.5, seed: 2.8 },
];
const props = [
  { id: "ghost", kind: "popghost", x: CRATE[0], z: CRATE[1], rise: 0.3, lift: 1.22 },
  { id: "door", kind: "door", x: DOOR_X - DOOR_W / 2, y: 0, z: WALL - 0.06, w: DOOR_W - 0.02, h: DOOR_H - 0.02, swing: "in", angle: 100, color: "#3d2a4a", open: 0 },
  { id: "table", kind: "table", x: 2.78, z: -3.2 },
  { id: "chair1", kind: "chair", x: 2.52, z: -3.68 },
  { id: "chair2", kind: "chair", x: 3.06, z: -3.68 },
];
for (const c of cast) A(0, c.id, "noblink");

// ---------------------------------------------------------------- 1 FEARLESS 0.0-3.4: the ghost is already rising
prop(0, "ghost", { rise: 1 }, 0.4, "back");
prop(0, "ghost", { wobble: 7 }, 0.2, "out");
prop(0.5, "ghost", { wobble: 0 }, 1.1, "out");
prop(3.35, "ghost", { rise: 0 }, 0.5, "inOut");   // the pop-up sinks back into its crate as the next room opens
sfx(3.35, "whoosh", { gain: 0.06 });
sfx(0, "flutter", { gain: 0.25, dur: 0.6 });
// Phoenix: the eyes find it first, then one compact recoil and recovery
A(0, "phx", "look", { to: PHX_AT_GHOST, dur: 0.12, blink: false });
A(0.16, "phx", "expr", { expr: "shocked", set: { open: 0.5 }, dur: 0.08 });
A(0.16, "phx", "hop", { height: 0.12, dur: 0.38 });
at(0.2, { fx: "alert", who: "phx", dur: 0.6 });
A(0.18, "phx", "wings", { to: 0.5, dur: 0.15, ease: "out" });
sfx(0.18, "hop", { gain: 0.12 });
A(0.85, "phx", "wings", { to: 0, dur: 0.45 });
A(0.95, "phx", "expr", { expr: "kind", set: { curve: 0.3, browY: 0.02 }, dur: 0.3 });
A(1.25, "phx", "look", { to: AT_REA, dur: 0.25, blink: false });
// Reaper: planted, eyes to it, one slow unimpressed blink, back to us
A(0, "rea", "still", { dur: 3.3, idle: 0.2 });
A(0.35, "rea", "look", { to: AT_GHOST, dur: 0.35, blink: false });
A(1.45, "rea", "blink", { dur: 0.55 });
A(2.15, "rea", "look", { to: AT_CAM, dur: 0.3, blink: false });
cap(0, 2.7, "He said nothing scares him.", TOP);

// ---------------------------------------------------------------- 2 THE NEXT ROOM 3.4-5.2: the door swings into the warm room
A(3.4, "phx", "look", { to: AT_DOOR, dur: 0.25, blink: false });
A(3.5, "rea", "look", { to: AT_DOOR, dur: 0.3, blink: false });
prop(3.55, "door", { open: 1 }, 0.9, "out");
sfx(3.55, "creak", { gain: 0.22, dur: 0.7 });
sfx(4.3, "bell", { gain: 0.18 });
A(3.6, "wiz", "look", { to: WIZ_AT_PAIR, dur: 0.01, blink: false });
A(4.4, "wiz", "expr", { expr: "happy", set: { open: 0.1 }, dur: 0.3 });

// ---------------------------------------------------------------- 3 FRIENDLY HOST 5.2-6.6
A(5.25, "wiz", "grip", { side: "R", shape: "flat", dur: 0.2 });
arm(5.25, "wiz", "R", WAVE, 0.4, "settle");
say(5.35, "wiz", "Let's go around", 1.0);
cap(5.3, 6.6, "Let's go around…", TOP);

// ---------------------------------------------------------------- 4 THE REAL SCARE 6.6-9.9: Reaper's face, Wizard offscreen
const FF = 7.95;   // "fun fact" onset
say(6.7, "wiz", "and share a", 0.95);
say(FF, "wiz", "fun fact", 0.6);
cap(6.6, FF, "and share a…");
cap(FF, 9.3, "and share a\nFUN FACT.", LOW, true);   // the reveal pops once
arm(6.7, "wiz", "R", "rest", 0.5);
A(6.6, "rea", "still", { dur: 1.35, idle: 0.2 });
A(6.6, "rea", "look", { to: [0.35, 0.02], dur: 0.01, blink: false });   // toward the Wizard, offscreen right
// the realization, one part at a time
A(FF + 0.08, "rea", "expr", { expr: "deadpan", set: { eye: 1.22, pupil: 0.58, browY: 0.05, raise: 0.045 }, dur: 0.12 });
A(FF + 0.3, "rea", "look", { to: AT_PHX, dur: 0.18, blink: false });
A(FF + 0.5, "rea", "expr", { set: { curve: -0.28, open: 0.26 }, dur: 0.15 });
A(FF + 0.62, "rea", "still", { dur: 1.0, idle: 0.04, sink: 0.02 });
A(FF + 0.62, "rea", "squash", { amount: 0.06, dur: 0.18 });
at(FF + 0.45, { fx: "sweat", who: "rea", dur: 1.0 });   // on screen for the cover frame (8.6 s)

// ---------------------------------------------------------------- 5 FIND COVER 9.9-14.0: two planted steps behind Phoenix
A(9.95, "rea", "move", { to: MID, dur: 0.55, ease: "inOut", steps: 2 });
sfx(10.45, "land", { gain: 0.14 });
A(10.7, "rea", "move", { to: HIDE, dur: 0.6, ease: "inOut", steps: 2 });
A(10.7, "rea", "turn", { to: 12, dur: 0.5 });
sfx(11.25, "land", { gain: 0.14 });
A(10.05, "phx", "look", { to: AT_REA, dur: 0.15, blink: false });
A(10.5, "phx", "look", { to: [-0.55, -0.05], dur: 0.45, blink: false });
A(10.6, "phx", "expr", { expr: "sad", set: { curve: 0.05, browY: 0.02 }, dur: 0.3 });
A(11.5, "rea", "still", { dur: 0.6, idle: 0.1 });
// the peek: a lean out past Phoenix's shoulder toward the Wizard, then the whisper to Phoenix
A(12.1, "rea", "lean", { to: -14, dur: 0.3, ease: "out" });
A(12.5, "phx", "turn", { to: -15, dur: 0.25 });
A(12.5, "phx", "look", { to: [-0.7, -0.05], dur: 0.2, blink: false });
A(12.1, "rea", "look", { to: [0.75, 0.0], dur: 0.2, blink: false });
A(12.55, "rea", "look", { to: [0.35, 0.05], dur: 0.15, blink: false });
say(12.6, "rea", "Get me out", 0.8, "whisper");
cap(12.55, 13.95, "Get me out.");

// ---------------------------------------------------------------- 6 CHOSEN 14.0-15.1
A(14.0, "wiz", "look", { to: WIZ_AT_REA, dur: 0.25, blink: false });
A(14.05, "wiz", "grip", { side: "R", shape: "flat", dur: 0.2 });
arm(14.05, "wiz", "R", OFFER, 0.4, "settle");
say(14.3, "wiz", "You first", 0.6);
cap(14.25, 15.1, "You first.", TOP);

// ---------------------------------------------------------------- 7 RETREAT 15.1-16.7
A(15.15, "rea", "lean", { to: 0, dur: 0.25 });
A(15.15, "phx", "turn", { to: 0, dur: 0.3 });

A(15.2, "rea", "move", { to: DEEP, dur: 0.35, ease: "out", steps: 1 });
A(15.2, "rea", "look", { to: [0.2, -0.1], dur: 0.2, blink: false });
A(15.4, "phx", "look", { to: [0.85, 0.05], dur: 0.2, blink: false });
A(15.35, "phx", "wings", { to: 0.45, dur: 0.5, ease: "settle" });
at(15.45, { fx: "alert", who: "phx", dur: 0.7 });   // "wait, me?" between his two looks   // the protective wing, once Reaper ducks back
sfx(15.35, "whoosh", { gain: 0.08 });
A(16.8, "phx", "wings", { to: 0, dur: 0.3 });
A(16.05, "phx", "look", { to: AT_CAM, dur: 0.2, blink: false });
A(16.1, "phx", "expr", { expr: "sad", set: { curve: 0.25 }, dur: 0.25 });

// ---------------------------------------------------------------- 8 THE BUTTON 16.7-19.2: Phoenix goes first
// Reaper's free (left) hand on Phoenix's back, one slow push, the hand comes back; Phoenix looks back at him
// (Fable review A: the Wizard steps into the doorway on camera, the hand starts on Phoenix's back, Reaper steps with
// the shove so his hand travels with Phoenix, and the clip ends on Reaper's deadpan to camera with one slow blink)
const back = (p) => ({ world: [p[0] - 0.05, 0.45, p[1] - 0.42] });
A(16.7, "wiz", "move", { to: WIZ_DOOR, dur: 0.6, ease: "inOut", steps: 2 });
A(17.0, "wiz", "expr", { expr: "delighted", set: { open: 0.2 }, dur: 0.25 });
A(16.75, "rea", "move", { to: PUSH_AT, dur: 0.3, ease: "inOut", steps: 1 });
A(16.8, "rea", "look", { to: AT_PHX, dur: 0.15, blink: false });
arm(17.15, "rea", "L", back(PHX), 0.3, "out");
A(17.45, "phx", "move", { to: PHX_PUSHED, dur: 0.55, ease: "inOut", steps: 2 });
A(17.45, "phx", "lean", { to: 10, dur: 0.2, ease: "out" });   // shoved: tips forward, then catches himself
A(17.45, "phx", "squash", { amount: 0.05, dur: 0.2 });
A(18.0, "phx", "lean", { to: 0, dur: 0.3, ease: "settle" });
A(17.45, "rea", "move", { to: PUSH_TO, dur: 0.55, ease: "inOut", steps: 2 });
arm(17.45, "rea", "L", back(PHX_PUSHED), 0.55, "inOut");
A(17.45, "phx", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.1 });
arm(18.05, "rea", "L", "rest", 0.35, "inOut");
A(18.1, "rea", "move", { to: STEP_BACK, dur: 0.45, ease: "inOut", steps: 2 });   // back out to the side, in view
A(18.1, "phx", "look", { to: AT_PHX, dur: 0.18, blink: false });
A(18.1, "phx", "turn", { to: -20, dur: 0.25 });   // looks back over his shoulder at Reaper
A(18.15, "phx", "expr", { expr: "sad", set: { open: 0.1, browY: 0.03 }, dur: 0.2 });
A(18.55, "rea", "look", { to: AT_CAM, dur: 0.25, blink: false });
A(18.55, "rea", "expr", { expr: "deadpan", dur: 0.25 });
A(18.8, "rea", "still", { dur: 0.9, idle: 0.15 });
A(19.05, "rea", "blink", { dur: 0.5 });
sfx(18.6, "tink", { gain: 0.12 });
const END = 19.7;

// ---------------------------------------------------------------- shots (each beat is a shot; cuts between)
const TWO = { pos: [0.3, 1.05, 6.5], look: [0.3, 0.72, -0.5], fov: 38 };
const REVEAL = { pos: [2.15, 1.25, 5.4], look: [1.8, 0.92, -2.4], fov: 34 };
const WIZ_SHOT = { pos: [1.6, 1.3, -0.6], look: [1.62, 1.02, -3.05], fov: 54 };   // in past the ghost crate, so it stays out of the frame
const REA_CU = { pos: [0.72, 0.98, 3.4], look: [0.8, 0.88, -0.2], fov: 26 };
const TWO_L = { pos: [-0.28, 1.05, 6.5], look: [-0.28, 0.72, -0.5], fov: 34 };
const TIGHT = { pos: [-0.5, 1.05, 5.0], look: [-0.55, 0.78, -0.6], fov: 26 };   // the retreat, closer: wings up, the scythe over his shoulder   // the two-shot, panned left with Reaper
const WIDE = { pos: [0.04, 1.5, 7.4], look: [0.06, 0.72, -0.9], fov: 37 };
const SHOTS = [
  ["fearless", 0, TWO, "hook"],
  ["the next room", 3.4, { ...TWO, to: REVEAL, dur: 1.5, ease: "inOut" }],
  ["friendly host", 5.2, WIZ_SHOT],
  ["the real scare", 6.6, REA_CU, "escalation"],
  ["find cover", 9.9, { ...TWO, to: TWO_L, dur: 1.6, ease: "inOut" }],
  ["chosen", 14.0, WIZ_SHOT],
  ["retreat", 15.1, TIGHT],
  ["the button", 16.7, WIDE],
];

items.sort((a, b) => a.at - b.at);
const beats = SHOTS.map(([name, start, shot, kind], i) => {
  const end = SHOTS[i + 1]?.[1] ?? END;
  const mine = items.filter((x) => x.at >= start - 1e-6 && (i === SHOTS.length - 1 || x.at < end - 1e-6)).map((x) => ({ ...x, at: r3(x.at - start) }));
  return { name, at: start, len: r3(end - start), shot, do: mine, ...(kind && { kind }) };
});
const late = items.filter((x) => x.at >= END);
if (late.length) throw new Error(`items after the end: ${JSON.stringify(late.slice(0, 3))}`);

const sb = {
  id: "nothing-scares-reaper",
  title: "Nothing Scares Reaper",
  idea: "Jonny's production brief v1, 25 Oct 2026 (+ the push-forward ending)",
  format: "one joke, one reversal: fearless at the haunted house, terrified of an icebreaker",
  fps: 30, look: "anime-pro", profile: "short", loop: true,
  cover: 8.6,
  creative: { length: [12, 22] },
  set: { type: "haunted", night: true, nook: true, pumpkin: false, seed: 4 },
  music: { style: "sneaky", parts: [{ at: 0, part: "intro" }, { at: 4.2, part: "main" }, { at: FF, part: "stop" }] },
  sound: { sfx: 0.5, ambience: 0.3 },
  cast, props, captions, beats,
  allowClip: [
    { who: "rea", with: "phx", from: 16.85, to: 18.1, reason: "Reaper's hand pushes Phoenix's back (the button)" },
  ],
  notes: "Generated by storyboards/halloween/make-nothing-scares.mjs. English lines are captions; voices are gibberish.",
};
writeFileSync(new URL("./nothing-scares-reaper.json", import.meta.url), JSON.stringify(sb, null, 1) + "\n");
console.log(`nothing-scares-reaper: ${END} s, ${beats.length} shots, ${items.length} items`);
