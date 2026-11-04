// LOOK BUSY, the 4 Nov 2026 redo of story 18 ("Boss is coming"), built from the clip template.
// node storyboards/busy/look-busy/make-look-busy.mjs -> look-busy.json (same folder)
// Briefs: story library 18-look-busy/ENGINE-PROMPT.md (the 25 Oct rewrite: stamp beside the blank report, boss,
// MANAGER nameplate) + /mnt/project-files/REDO-2026-11-04-*.md (the reach changes; it wins where they differ) +
// the reach playbook (4 Nov). Departures are listed in NOTES.md here.
//
// THE BRIEF
//   Joke:        the worker asks the Sorcerer to make him look busy; the spell makes his hand stamp the bare desk
//                beside the untouched report, and the boss promotes him for it.
//   Wants:       the worker wants to look busy when the boss walks past.
//   Consequence: he never touches the report, his arm won't stop, and he gets promoted anyway.
//   Ending:      MANAGER sign next to the still blank report, a tiny guilty shrug to camera, one last stamp, cut.
//   Callback:    he wanted to look busy at 0 s; at the end he looks busiest of all and has still done nothing.
//   Comment hook: did he deserve it? (the gap the ending doesn't explain)
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const FOCUS = false;                 // Jonny 31 Oct: the whole frame sharp
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, cap, see } = c;
const END = 11.8;
const BEAT = 0.6;                    // the music: funk at 100 bpm, so a stamp every beat lands on the music
const DESK_Y = 0.42;

// ---------------------------------------------------------------- places (x right, z toward the camera)
// the worker at his desk, the Sorcerer behind him on the right (diagonal, farther from the camera: the 25 Oct rewrite),
// the boss walks in from the left behind the desk's left end and sets the sign down in front of him
const WRK = [0.15, 0], SOR = [0.95, -0.95], BOSS_IN = [-3.7, -0.3], BOSS = [-1.0, -0.3], BOSS_STEP = [-1.06, 0.0];
const SOR_REST = { o: [0.16, 0.46, 0.1] };
const WRK_YAW = 6, SOR_YAW = -30, BOSS_YAW = 15;
const DESK = { id: "desk", kind: "officedesk", x: 0.12, y: 0, z: 0.6, w: 1.6, d: 0.5 };
const REPORT = { id: "report", kind: "blankreport", x: -0.04, y: DESK_Y, z: 0.6, rot: 5, w: 0.3, d: 0.4 };
const STAMP = { id: "stamp", kind: "rubberstamp", ...grips.placeFor("rubberstamp", [0.6, DESK_Y, 0.42], WRK_YAW), scale: 1.3 };
// the ink marks, in the order he stamps them: all on the bare desk to his left of the report, none on it
const SPOTS = [[0.36, 0.52, -6], [0.5, 0.62, 9], [0.33, 0.68, -14], [0.6, 0.5, 4], [0.44, 0.7, 18], [0.58, 0.72, -3], [0.4, 0.44, -20],
  [0.62, 0.62, 12], [0.46, 0.56, 2], [0.53, 0.47, -9], [0.36, 0.6, 22], [0.6, 0.58, -16], [0.42, 0.64, 7], [0.52, 0.72, -2]];
const MC = [0.48, 0.6];   // the marks prop sits at their middle (the visibility check looks at a prop's origin)
const MARKS = { id: "marks", kind: "stampmarks", x: MC[0], y: DESK_Y + 0.001, z: MC[1], size: [0.13, 0.083], at: SPOTS.map(([x, z, r]) => [r3(x - MC[0]), r3(z - MC[1]), r]) };
// the MANAGER sign: the boss carries it in front of him and sets it on the desk's left end, beside the report
const front = (at, yaw, d, y) => [r3(at[0] + d * Math.sin((yaw * Math.PI) / 180)), y, r3(at[1] + d * Math.cos((yaw * Math.PI) / 180))];
const CARRY_D = 0.48, CARRY_Y = 0.32;
const PLATE_SPOT = [-0.44, DESK_Y, 0.47];
const PLATE = { id: "plate", kind: "deskplate", ...grips.placeFor("deskplate", front(BOSS_IN, 90, CARRY_D, CARRY_Y), 90), w: 0.32 };
const TIE = { id: "tie", kind: "necktie", wear: "bos", x: 0, y: 0.5, z: 0.4, len: 0.3 };

const cast = [
  { id: "wrk", character: "busy/samurai-worker", at: WRK, face: WRK_YAW, expr: "shocked", follow: 0.3, seed: 2.2 },
  { id: "sor", character: "potatobrawl/sorcerer", at: SOR, face: SOR_YAW, expr: "kind", follow: 0.4, seed: 5.7, arms: { L: SOR_REST } },
  { id: "bos", character: "potatobrawl/allfather", at: BOSS_IN, face: 90, expr: "stern", follow: 0.4, seed: 3.3 },
];
const props = [DESK, REPORT, MARKS, STAMP, PLATE, TIE];

// eye targets (screen: + right, + up)
const AT_DOOR = [-1, 0.1], AT_SOR = [0.85, 0.15], AT_HAND = [0.45, -0.55], AT_REPORT = [-0.35, -0.6], AT_CAM = [0, 0], AT_BOSS = [-0.9, 0.15];

// ---------------------------------------------------------------- captions
// the on-screen title (the brief's words; Jonny may put it on with TikTok's own text tool instead, see NOTES.md)
// CLEAN=1 writes look-busy-clean.json without it, for posting with the title added in TikTok's text tool
const CLEAN = process.env.CLEAN === "1";
if (!CLEAN) cap(0, 2.8, "When the boss\nwalks past and you\nhave to look busy", 230, false, { kinetic: false, size: 66 });

// ---------------------------------------------------------------- 1 HOOK 0-1.2: already reacting, eyes snap to the door
A(0, "wrk", "look", { to: [-0.3, -0.4], dur: 0.01, blink: false });
A(0.04, "wrk", "look", { to: AT_DOOR, dur: 0.1, blink: false });            // the snap, on frame 1
A(0, "wrk", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.45, curve: -0.5 }, dur: 0.01 });
A(0, "wrk", "face", { brow: 0.45, dur: 0.01 });
A(0.06, "wrk", "squash", { amount: -0.05, dur: 0.15 });
A(0.12, "wrk", "turn", { to: -12, dur: 0.25 });
act.opener(c, "wrk", "boss is coming!", { dur: 0.75 });
A(0.5, "wrk", "noblink", { dur: 0.9 });
A(0, "sor", "look", { to: [-0.8, 0.0], dur: 0.01, blink: false });
A(0.3, "sor", "look", { to: AT_DOOR, dur: 0.15 });
see(0, 1.2, ["wrk.face", "sor.face", "report"], "the worker's alarm, the Sorcerer, the blank report on the desk");

// ---------------------------------------------------------------- 2 ASK 1.2-2.2: "make me look busy" to the Sorcerer
A(1.2, "wrk", "look", { to: AT_SOR, dur: 0.12, blink: false });
A(1.26, "wrk", "turn", { to: 30, dur: 0.3 });
A(1.3, "wrk", "expr", { expr: "eager", set: { eye: 1.15 }, dur: 0.25 });
c.arm(1.3, "wrk", "R", { o: [0.12, 0.47, 0.3] }, 0.3, "out");                // a hand on his own chest: "me"
A(1.3, "wrk", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(1.32, "wrk", "talk", { line: "make me look busy!", tone: "excited", dur: 0.85, voice: false });
cap(1.3, 2.5, "make me look busy!", 1270);
A(1.3, "sor", "look", { to: [-0.75, 0.05], dur: 0.12, blink: false });
A(1.75, "sor", "expr", { set: { raise: 0.05, smirk: 0.5, curve: 0.3 }, dur: 0.25 });   // one brow up
see(1.3, 2.2, ["wrk.face", "sor.face"], "the ask and the Sorcerer's one raised brow");

// ---------------------------------------------------------------- 3 SPELL 2.2-2.8: one wrist flick, a small pulse
c.arm(2.15, "wrk", "R", "rest", 0.35, "inOut");
c.arm(2.2, "sor", "L", "cast", 0.22, "out");
c.arm(2.62, "sor", "L", SOR_REST, 0.45, "inOut");
c.at(2.36, { fx: "poof", pos: [0.7, 0.6, -0.6], color: "#9dffb0", spark: "#7dff9a", puffs: 1, sparks: 8, dur: 0.35, size: 0.35, sound: false });
c.at(2.45, { fx: "poof", pos: [0.6, 0.45, 0.42], color: "#9dffb0", spark: "#7dff9a", puffs: 1, sparks: 12, dur: 0.45, size: 0.4, sound: false });
sfx(2.36, "zap", { gain: 0.9, reason: "the Sorcerer's spell: one small green pulse into the worker's arm" });
A(2.55, "sor", "expr", { expr: "smug", dur: 0.3 });
A(2.52, "wrk", "turn", { to: WRK_YAW, dur: 0.2 });
A(2.52, "wrk", "look", { to: AT_HAND, dur: 0.1, blink: false });
A(2.55, "wrk", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.3, curve: -0.3 }, dur: 0.25 });
see(2.2, 2.8, ["sor.face", "wrk"], "cause before effect: the flick, the pulse reaching his arm");

// ---------------------------------------------------------------- 4 STAMPING 2.8-5.4: his hand won't stop
// the hand jerks onto the stamp (the spell does it: fast, no reach-up), then a stamp on every beat
const H = grips.mug(c, "wrk", STAMP, { side: "L", angle: 70, height: 0.62 });
H.take(2.5, { reach: 0.2, settle: 0.12 });
const LIFT = 0.15;
let n = 0;
const stamps = [];
function stamp(t, { big = 1, sound = true } = {}) {
  const [x, z] = SPOTS[n];
  // down on an arc into contact (ease in), two frames on the desk, then up and over toward the next spot
  H.carry(r3(t - 0.13), [x, DESK_Y, z], 0.13, "in");
  c.prop(t, "stamp", { squash: 0.08 }, 0.04, "out"); c.prop(r3(t + 0.06), "stamp", { squash: 0 }, 0.1, "settle");
  c.prop(t, "marks", { count: n + 1 }, 0);
  const next = SPOTS[Math.min(n + 1, SPOTS.length - 1)];
  H.carry(r3(t + 0.07), [r3((x + next[0]) / 2), r3(DESK_Y + LIFT * big), r3((z + next[1]) / 2)], 0.22, "out");
  A(r3(t + 0.03), "wrk", "squash", { amount: 0.025 * big, dur: 0.08 });
  A(r3(t + 0.11), "wrk", "squash", { amount: 0, dur: 0.2 });
  if (sound) { sfx(t, "hit-wood", { gain: 0.8, reason: "the stamp hits the desk" }); sfx(t, "book-close", { gain: 1.1, reason: "the stamp's papery slap, so it carries on a phone speaker" }); }
  stamps.push(t); n++;
}
// first one at 3.0 (lift from where he took it)
H.carry(2.75, [STAMP.x, DESK_Y + LIFT, STAMP.z], 0.12, "out");
for (const t of [3.0, 3.6, 4.2, 4.8, 5.4, 6.0, 6.6, 7.2, 7.8]) stamp(t);
// his face: surprise at the hand, then the realization (report, hand, us)
A(3.05, "wrk", "squash", { amount: -0.04, dur: 0.1 });
A(3.7, "wrk", "look", { to: AT_REPORT, dur: 0.15, blink: false });
A(3.75, "wrk", "expr", { expr: "worried", dur: 0.3 });
A(4.3, "wrk", "look", { to: AT_HAND, dur: 0.12, blink: false });
A(4.75, "wrk", "look", { to: [0.1, 0.05], dur: 0.15, blink: false });
A(4.8, "wrk", "expr", { expr: "deadpan", dur: 0.3 });
A(4.8, "sor", "look", { to: [-0.6, -0.3], dur: 0.2 });
see(2.9, 5.4, ["wrk.face", "stamp", "report", "marks"], "he stamps the bare desk beside the untouched report");

// ---------------------------------------------------------------- 5 BOSS 5.4-7.5: walks in, looks at the arm, the face
// the boss carries the MANAGER sign in (picked up off screen before he enters)
const PH = grips.box(c, "bos", PLATE, { height: 0.9 });
PH.take(0.05, { reach: 0.25, settle: 0.15 });
A(4.15, "bos", "look", { to: [0.6, 0], dur: 0.15 });
A(4.3, "bos", "move", { to: BOSS, dur: 1.9, ease: "out" });
PH.carry(4.3, front(BOSS, 90, CARRY_D, CARRY_Y), 1.9, "out");
sfx(5.0, "door-open", { gain: 0.35, reason: "the office door off screen left: the boss is coming in" });
A(5.45, "wrk", "look", { to: AT_BOSS, dur: 0.1, blink: false });
A(5.45, "wrk", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.2 }, dur: 0.25 });
A(5.3, "sor", "look", { to: AT_BOSS, dur: 0.15 });
A(6.15, "bos", "turn", { to: BOSS_YAW, dur: 0.4 });
PH.carry(6.15, front(BOSS, BOSS_YAW, CARRY_D, CARRY_Y), 0.4, "inOut", { rot: BOSS_YAW + 180 });
A(6.3, "bos", "look", { to: [0.7, -0.45], dur: 0.15, blink: false });          // at the busy arm
A(6.3, "bos", "expr", { expr: "stern", set: { raise: 0.04 }, dur: 0.3 });
A(6.9, "bos", "look", { to: [0.75, 0.1], dur: 0.15, blink: false });           // then at his face
A(6.85, "wrk", "look", { to: AT_BOSS, dur: 0.1, blink: false });
A(6.9, "wrk", "expr", { expr: "happy", set: { curve: 0.35, open: 0.08, eye: 1.05 }, dur: 0.3 });   // a weak professional smile
see(6.2, 7.5, ["bos.face", "wrk.face", "stamp"], "the boss judges the frantic arm, then the face");

// ---------------------------------------------------------------- 6 PROMOTED 7.5-9.0: approval, the sign goes down
A(7.45, "bos", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.3 });
c.macro(7.55, "bos", "nod", { times: 1 });
// the nod plays in the clear first (review B), then the step and the set-down
A(7.85, "bos", "look", { to: [0.1, -0.5], dur: 0.12 });
A(7.9, "bos", "move", { to: BOSS_STEP, dur: 0.32, ease: "inOut", steps: 1 });
A(7.92, "bos", "turn", { to: BOSS_YAW + 35, dur: 0.32 });
PH.carry(7.9, [PLATE_SPOT[0], DESK_Y + 0.06, PLATE_SPOT[2]], 0.32, "inOut", { rot: BOSS_YAW + 195 });
PH.place(8.22, PLATE_SPOT, 0.13);
sfx(8.35, "put-down", { gain: 0.8, reason: "the MANAGER sign set down on the desk" });
// let go and bring each hand back on its own side (the hold's "away" offsets were set for the walk-in heading and
// would swing the far arm across his chest after the turn)
A(8.42, "bos", "release", { prop: "plate", dur: 0 });
for (const side of ["L", "R"]) { A(8.42, "bos", "grip", { side, shape: "open", dur: 0.15 }); c.arm(8.46, "bos", side, { o: [0.3, 0.3, 0.12] }, 0.45, "out"); A(8.75, "bos", "grip", { side, shape: "relaxed", dur: 0.3 }); }
// the arm holds still in the air through "Promoted." (keep strokes off the line), then goes on
H.carry(8.0, [0.62, DESK_Y + 0.1, 0.5], 0.3, "out");
c.macro(8.45, "bos", "say", { line: "Promoted.", tone: "calm", pos: 300 });
A(8.3, "sor", "noblink", { dur: 1.0 });
A(8.5, "wrk", "expr", { expr: "delighted", set: { eye: 1.2 }, dur: 0.25 });     // a flash of pleasure
see(7.5, 9.0, ["bos.face", "plate", "wrk.face"], "approval, the sign lands, Promoted.");

// ---------------------------------------------------------------- 7 INSERT 9.0-10.2: MANAGER beside the blank report
stamp(9.3); stamp(9.9);
see(9.05, 10.1, ["plate", "report", "marks"], "MANAGER next to the untouched report and a desk full of APPROVED");

// ---------------------------------------------------------------- 8 SHRUG 10.2-11.8: a tiny guilty shrug to us, last stamp
stamp(10.5, { big: 0.6 }); stamp(11.1, { big: 0.6 });
// (big scales the lift; the last two stamps stay low so the stamp passes under his face)
A(10.25, "wrk", "look", { to: AT_CAM, dur: 0.15, blink: false });
c.arm(10.35, "wrk", "R", "shrug", 0.3, "out");
act.sheepish(c, 10.35, "wrk");
A(10.6, "wrk", "expr", { set: { curve: 0.15, smirk: 0.3, tilt: 0.45 }, dur: 0.3 });   // guilty, not pleased
A(11.0, "wrk", "look", { to: [-0.45, -0.45], dur: 0.12, blink: false });   // a flick to the sign...
A(11.3, "wrk", "look", { to: AT_CAM, dur: 0.12, blink: false });            // ...and back to us
c.arm(11.2, "wrk", "R", "shrug", 0.5, "inOut");
A(10.4, "wrk", "squash", { amount: -0.03, dur: 0.2 });
A(10.4, "sor", "look", { to: AT_CAM, dur: 0.2 });
A(10.4, "sor", "expr", { expr: "smug", dur: 0.3 });
A(10.4, "bos", "look", { to: [0.75, 0.05], dur: 0.2 });
see(10.4, END, ["wrk.face", "plate", "report"], "the guilty shrug to us, the sign and the blank report in frame");

// ---------------------------------------------------------------- shots
const MASTER = { pos: [0.4, 1.1, 4.8], look: [0.4, 0.44, 0], fov: 34 };
const STAMPS = { pos: [0.38, 1.75, 3.9], look: [0.38, 0.45, 0.35], fov: 28, to: { pos: [0.38, 1.72, 3.7] }, dur: 2.5, ease: "inOut" };
const WIDE = { pos: [-0.15, 1.2, 5.5], look: [-0.15, 0.44, 0], fov: 34, to: { pos: [-0.45, 1.5, 4.8], look: [-0.5, 0.44, 0.1] }, dur: 3.4, ease: "inOut" };
const INSERT = { pos: [-0.05, 2.75, 1.95], look: [-0.05, 0.42, 0.62], fov: 34, to: { pos: [-0.05, 2.65, 1.9] }, dur: 1.2, ease: "linear" };
const END_SHOT = { pos: [0.0, 1.3, 4.9], look: [0.0, 0.44, 0.2], fov: 34 };
const beats = c.beats([
  ["hook", 0, MASTER, "hook"],
  ["ask", 1.2, null],
  ["spell", 2.2, null],
  ["stamping", 2.8, STAMPS, "escalation"],
  ["boss", 5.4, WIDE],
  ["promoted", 7.5, null, "payoff"],
  ["insert", 9.0, INSERT, "insert"],
  ["shrug", 10.2, END_SHOT, "reaction"],
], END);

write(import.meta.url, {
  id: CLEAN ? "look-busy-clean" : "look-busy",
  title: "When the boss walks past and you have to look busy",
  idea: "Story 18 redo (4 Nov 2026): the spell stamps the bare desk beside the blank report; the boss promotes him",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "sheet",
  motion: MOTION,
  set: { type: "office", seed: 3, aperture: FOCUS ? 0.045 : 0 },
  // funk at 100 bpm with "Promoted." on beat 1, so every stamp (0.6 s apart) lands on a beat
  music: { style: "funk", bpm: 100, offset: 1.2, gain: 0.3, payoff: 8.4, parts: [{ at: 0, part: "main" }, { at: 7.8, part: "stop" }, { at: 8.4, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.2, surface: "carpet", room: "office" },
  hook: { show: ["wrk", "sor", "report"], hint: 0, what: "the worker's eyes snap to the door, the report on his desk is blank" },
  creative: { length: [10, 13] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wrk", with: "desk", from: 0, to: END, reason: "he stands at his desk (the front panel hides his legs)" },
    { who: "bos", with: "bos", from: 7.85, to: 8.35, reason: "a potato's face sits at desk height: his far glove crosses it for 0.4 s as he leans to set the sign down, before he speaks" },
  ],
  notes: "Generated by storyboards/busy/look-busy/make-look-busy.mjs.",
});
