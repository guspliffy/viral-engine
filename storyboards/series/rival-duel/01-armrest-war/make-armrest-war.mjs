// RIVAL DUEL 01 "Armrest war" (26 Nov 2026), from the clip template. A YOU situation: Spud plays you, nobody says a name.
//   node storyboards/series/rival-duel/01-armrest-war/make-armrest-war.mjs -> armrest-war.json
// Target: the Codex panel sheet /mnt/project-files/videos/rival-duel/01-armrest-war/sheets/armrest-war-panels-v1.png
// (15 panels) + OUTLINE.md v1 there (Jonny 14:45 Berlin: hook H1, ending E3, Wedge as the stranger). Designs: DESIGN.md (Fable).
// Jonny 15:11 Berlin: "a big focus on glitches regarding the arms and seats": hands go only to measured grip points
// (grips.rest on the console top, holds through grips.mjs), every seated body rides a carrier locked on its seat.
//
// THE BRIEF
//   Gap:      what does the red button do? ("Nobody who pressed it... came back.") Teased at every near-press.
//   Gap 2:    who is the stranger? Plants: the pilot hat in his bag (08), "I fly a lot" / "I know this plane better than
//             you" + the wings pin glint (11), the cockpit door swings open on an EMPTY cockpit (13b).
//   Chain:    one armrest, two elbows, so the attendant warns you; so he takes it all; so you shove (1); so both elbows +
//             chin (2); so butter (3); so a fake third arm while he sleeps (4); so a crowbar (5), every near-press brings the
//             attendant back ("Too. Dangerous."); so you press it on HIM: his seat blasts through the roof; the whole
//             armrest is yours; then the speaker: "this is your captain... I was in seat 14B." The plane tips. Cut.
// Seats (DESIGN 10): starboard pair as the sheet: you in D (x -2.09, window on your left), Wedge in C (x -1.03), the console
// between at x -1.56. Facing +z: your LEFT hand and his RIGHT hand are the console hands.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see, prop } = c;

// measured spoken lengths (node qa/lines.mjs armrest-voice-probe.json, 26 Nov), in LINES order
const DUR = [1.92, 0.89, 1.74, 0.79, 1.42, 0.60, 1.35, 1.64, 1.92, 1.31, 0.59, 1.63, 1.36, 1.89, 0.54, 0.96, 1.04, 1.24, 1.56, 0.79, 3.85, 1.93];
// when each line starts (s, normal speed); the action between lines is staged around these
const T = [1.0, 3.2, 4.4, 7.0, 8.2, 10.3, 13.2, 16.0, 17.75, 20.2, 24.3, 25.9, 27.9, 30.9, 34.0, 35.9, 38.1, 40.0, 44.2, 48.8, 50.5, 54.8];
const END_OF = (i) => r3(T[i] + DUR[i]);
const END = 58.0;
const cut = (t) => r3(t - 0.02);                         // a cut cheat lands a frame before its cut

// ---------------------------------------------------------------- places
const SX = -2.12, WX = -0.97, CX = -1.555, SEAT = 0.33;   // your seat D, his seat C, the console; a sitter's body y
const ATT_AISLE = [0.12, -0.1], ATT_IN = [-0.04, 0.62], ATT_OFF = [-0.2, -3.0];   // P1 (C6 shots), leaning in (ATT3), parked behind
const CZ = 0.1;   // the console sits 10 cm forward, level with the seated bodies (their carriers at z 0.13)
const BUTTON = [CX, 0.766, r3(CZ + 0.285)];
const AT_BUTTON_S = [0.55, -0.7], AT_BUTTON_W = [-0.55, -0.7], AT_HIM = [0.9, 0.05], AT_YOU = [-0.9, 0.05], AT_ATT_S = [0.8, 0.35], AT_ATT_W = [0.6, 0.35], AT_US = [0, 0.05];
const LIFT = 3.4;                                         // how far his seat flies (DESIGN 8)

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [SX, 0.03], face: 0, expr: "kind", follow: 0.3, seed: 2.9 },
  { id: "wedge", character: "potatobrawl/wedge", at: [WX, 0.03], face: 0, expr: "smug", follow: 0.3, seed: 3.3 },
  { id: "att", character: "potatobrawl/mash-attendant", at: ATT_OFF, face: -60, expr: "serene", follow: 0.2, seed: 3.7 },
];

const CONSOLE = { id: "console", kind: "sharedarm", x: CX, y: 0, z: CZ, h: 0.72 };
const SEATSPEC = { kind: "planeseat", w: 0.96, color: "#2f4d8c", cover: 0.34 };
const KNIFE = { id: "knife", kind: "butterknife", x: -1.95, y: -40, z: 0.5, staged: "in your hand from the cut" };
const FAKE = { id: "fakearm", kind: "fakearm", x: -0.95, y: -40, z: 0.7, staged: "in his bag, then held up, then lying on the console" };
const BAR = { id: "crowbar", kind: "crowbar", x: -2.0, y: -40, z: 0.5, staged: "dropped from the bin into your hands off camera" };
const props = [
  { id: "hall", kind: "cabinhall", x: 0, y: 0, z: 0, omit: [[0, "C"], [0, "D"], [1, "C"], [1, "D"], [2, "C"], [2, "D"]] },
  { id: "seatD", ...SEATSPEC, arms: "R", x: SX, z: 0 },
  { id: "seatC", ...SEATSPEC, arms: "L", x: WX, z: 0 },
  { id: "rocket", kind: "seatrocket", x: WX, y: 0, z: 0 },
  CONSOLE,
  { id: "bag", kind: "duffel", x: -1.1, y: 0.13, z: 0.82, color: "#a8352b", trim: "#c9a25a" },
  { id: "hat", kind: "pilothat", x: -1.1, y: -40, z: 0.82, staged: "in the open bag" },
  { id: "cap", kind: "paperhat", wear: "att", x: -0.10, y: 1.34, z: 0, scale: 0.58, tilt: 16, color: "#1c2748", stripe: "#e8b93a" },
  { id: "mask", kind: "sleepmask", wear: "wedge", x: 0, y: 0, z: 0, scale: 0 },
  { id: "pin", kind: "wingspin", wear: "wedge", x: 0, y: 0, z: 0 },
  { id: "hatch", kind: "ejecthatch", x: -1.08, y: 2.35, z: 0.05 },
  { id: "cockpit", kind: "cockpitcard", x: 0, y: 0, z: 10.56, rot: 180 },
  { ...KNIFE }, { ...FAKE }, { ...BAR },
  { id: "spudC", kind: "carrier", x: SX, y: 0, z: 0.13 },
  { id: "wedgeC", kind: "carrier", x: WX, y: 0, z: 0.13 },
];

// ---------------------------------------------------------------- helpers
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.15) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2, set) => A(r3(t), who, "expr", { expr: e, dur, ...(set && { set }) });
const sq = (t, who, amount, dur = 0.2) => A(r3(t), who, "squash", { amount, dur });
// a hand flat on the console top at its local [x, z] (DESIGN 2 grips: elbowYou [-0.05, -0.02], elbowHim [0.05, -0.02], slide [-0.05, 0.145])
const rest = (t, who, side, xz, dur = 0.3, ease = "settle") => { grip(t, who, side, "press", Math.min(0.15, dur)); return grips.rest(c, who, side, CONSOLE, xz, r3(t), { dur, ease, top: 0.72 }); };
const lap = (t, who, side, dur = 0.35) => { arm(t, who, side, "lap", dur, "settle"); grip(t, who, side, "relaxed", 0.2); };
const strain = (t0, t1, who, amp = 0.02, hz = 8) => { const step = r3(1 / hz / 2); let k = 0; for (let t = t0; t < t1 - step; t = r3(t + step), k++) sq(t, who, k % 2 ? -amp : amp, step); sq(r3(t1), who, 0, 0.15); };
const attAt = (t, at, yaw) => { A(cut(t), "att", "move", { to: at, dur: 0.01, ease: "linear", sync: true }); A(cut(t), "att", "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
// captions: upper third (story.md), one per line
const SUB = 250;
const CAPTEXT = { 0: "Never. *Touch.* The red button.", 2: "Nobody who pressed it... *came back.*", 4: "That armrest is *MINE.*", 6: "Too. *Dangerous.*", 12: "Too. *Dangerous.*", 17: "Too. *DANGEROUS!*" };
const CAPPOS = { 9: 400, 13: 255 };   // the bag shot (camfit free 350-1260); the fake-arm close: above his leaf
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.0) - 0.2)));
  cap(T[i], to, CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- frame 0: both seated, both hands up, about to slam
for (const [who, carr] of [["spud", "spudC"], ["wedge", "wedgeC"]]) A(0, who, "ride", { prop: carr, off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
A(0, "att", "hide", {});
act.blinksAt(c, "spud", [2.4, 9.4, 19.2, 29.0, 37.0, 47.0]);
act.blinksAt(c, "wedge", [2.9, 12.2, 22.8, 29.6]);
act.blinksAt(c, "att", [3.0, 15.4]);
lap(0, "spud", "R", 0.01); lap(0, "wedge", "L", 0.01);
arm(0, "spud", "L", { prop: "console", grip: [-0.08, 0.90, 0.06] }, 0.01); grip(0, "spud", "L", "fist", 0.01);
arm(0, "wedge", "R", { prop: "console", grip: [0.08, 0.90, 0.06] }, 0.01); grip(0, "wedge", "R", "fist", 0.01);
look(0, "spud", AT_BUTTON_S, 0.01); look(0, "wedge", AT_BUTTON_W, 0.01);
expr(0, "spud", "focused", 0.01); expr(0, "wedge", "focused", 0.01);
// SLAM: both hands land on the console top on either side of the button at the same frame
rest(0.2, "spud", "L", [-0.07, -0.02], 0.13, "in"); rest(0.2, "wedge", "R", [0.07, -0.02], 0.13, "in");
sfx(0.33, "slam", { gain: 0.9, reason: "two elbows slam down on the console" }); c.at(0.33, { fx: "shake", amp: 0.02, dur: 0.25 });
see(0, 0.9, ["console"], "frame 0: the red button under its clear cover, two sleeves slamming down either side");

// ---------------------------------------------------------------- 02 the attendant leans in: Never. Touch. The red button.
const S2 = 0.95;
attAt(0.6, ATT_IN, -62);   // in place while still hidden: no walk-in on the cut (Sol r2 1) A(cut(S2), "att", "show", {}); A(cut(S2), "att", "lean", { to: 4, dur: 0.01 });
look(cut(S2), "att", [-0.9, -0.2], 0.01); expr(cut(S2), "att", "deadpan", 0.01);
arm(cut(S2), "att", "R", { o: [0.06, 0.86, 0.14] }, 0.01); grip(cut(S2), "att", "R", "point", 0.01);   // one finger at her lips
look(S2 + 0.1, "spud", AT_ATT_S); look(S2 + 0.1, "wedge", AT_ATT_W); expr(S2 + 0.1, "spud", "shocked"); expr(S2 + 0.1, "wedge", "shocked");
say(0);
see(T[0], END_OF(0), ["att.face", "spud.face", "wedge.face"], "the attendant leans in between you, finger at her lips");
// 03 you: What does it do?
look(T[1] - 0.25, "spud", AT_BUTTON_S, 0.25); expr(T[1], "spud", "shocked", 0.15, { open: 0.1 });
say(1);
look(END_OF(1) + 0.05, "spud", AT_ATT_S, 0.2);
rest(3.3, "wedge", "R", [0.06, -0.12], 0.4, "inOut");   // his slam hand back to his lap while you are in close-up (he is off frame): the slide starts clear (Sol r2 3)
// 04 her: Nobody who pressed it... came back.
arm(T[2] - 0.2, "att", "R", "rest", 0.3); expr(T[2], "att", "deadpan");
say(2);
const GONE = r3(END_OF(2) + 0.35);
A(GONE, "att", "hide", {});

// ---------------------------------------------------------------- 04b his forearm takes the whole console: Mine.
const SLIDE = 6.5;
lap(SLIDE - 0.1, "spud", "L", 0.3); look(SLIDE, "spud", AT_HIM);
rest(SLIDE, "wedge", "R", [-0.02, 0.12], 0.55, "inOut");   // slides across and forward: the whole top is his
A(SLIDE, "wedge", "lean", { to: -6, dur: 0.5 }); expr(SLIDE + 0.1, "wedge", "smug"); look(SLIDE, "wedge", [-0.5, -0.2]);
A(SLIDE + 0.2, "wedge", "face", { lid: 0.45, dur: 0.3 });
say(3);
see(SLIDE, END_OF(3), ["wedge.face"], "he slides his arm over the whole console, smug");
// 05 you: That armrest is MINE.
expr(T[4] - 0.1, "spud", "angry"); look(T[4] - 0.1, "spud", AT_HIM, 0.15);
say(4);

// ---------------------------------------------------------------- ROUND 1: the shove
const R1 = 9.95;
rest(R1, "spud", "L", [-0.07, -0.02], 0.35);
rest(R1, "wedge", "R", [0.07, -0.02], 0.45, "inOut");
A(R1, "wedge", "lean", { to: -3, dur: 0.3 }); A(R1 + 0.1, "spud", "lean", { to: 4, dur: 0.3 });
expr(R1 + 0.1, "spud", "angry"); expr(R1 + 0.1, "wedge", "angry"); look(R1 + 0.1, "spud", AT_HIM); look(R1 + 0.1, "wedge", AT_YOU);
say(5);
strain(R1 + 0.3, 11.5, "spud", 0.02); strain(R1 + 0.35, 11.5, "wedge", 0.015);
// your hand skids forward toward the button: 1 cm from the cover
const NEAR1 = 11.3;
rest(NEAR1, "spud", "L", [-0.05, 0.145], 0.22, "out");
sfx(r3(NEAR1 + 0.22), "recordscratch", { gain: 0.6, reason: "the music stops: your hand is next to the button" });
look(NEAR1 + 0.2, "spud", AT_BUTTON_S, 0.12); look(NEAR1 + 0.2, "wedge", AT_BUTTON_W, 0.12);
expr(NEAR1 + 0.2, "spud", "terrified", 0.12, { open: 0.3 }); expr(NEAR1 + 0.2, "wedge", "terrified", 0.12, { open: 0.3 });
A(NEAR1 + 0.25, "spud", "lean", { to: 0, dur: 0.3 }); A(NEAR1 + 0.25, "wedge", "lean", { to: 0, dur: 0.3 });
see(NEAR1, 12.9, ["console"], "your hand has slid to a centimetre from the button; both freeze");
// 06 the attendant pops up behind his shoulder: Too. Dangerous.
const S6 = 13.0;
attAt(S6, ATT_AISLE, -25); A(cut(S6), "att", "show", {}); A(cut(S6), "att", "lean", { to: 0, dur: 0.01 });
look(cut(S6), "att", [-0.8, -0.3], 0.01); expr(cut(S6), "att", "deadpan", 0.01);
arm(cut(S6), "att", "R", { o: [0.16, 0.8, 0.22] }, 0.01); grip(cut(S6), "att", "R", "flat", 0.01);   // a flat palm: stop
say(6);
see(T[6], END_OF(6), ["att.face"], "the attendant, right behind his shoulder, palm up: stop");
A(r3(END_OF(6) + 0.3), "att", "hide", {});
// back off, slowly
const OFF1 = 14.75;
arm(OFF1, "spud", "L", "lap", 0.7, "inOut"); grip(OFF1, "spud", "L", "relaxed", 0.3); arm(OFF1 + 0.1, "wedge", "R", "lap", 0.7, "inOut"); grip(OFF1 + 0.1, "wedge", "R", "relaxed", 0.3);   // slow, no snap (Sol r2 5)
expr(OFF1, "spud", "focused"); expr(OFF1, "wedge", "focused"); look(OFF1 + 0.2, "spud", AT_HIM); look(OFF1 + 0.2, "wedge", AT_YOU);

// ---------------------------------------------------------------- ROUND 2: both elbows. And chin.
const R2 = 15.6;
rest(R2, "spud", "L", [-0.05, 0.10], 0.45, "inOut");   // your whole forearm slides along the top
expr(R2 + 0.3, "spud", "cocky"); look(R2 + 0.3, "spud", AT_HIM);
say(7);
rest(T[8] - 0.1, "wedge", "R", [0.055, 0.10], 0.45, "inOut");   // his whole forearm too, side by side
expr(T[8], "wedge", "cocky");
say(8);
A(T[8] + 1.1, "wedge", "lean", { to: -7, dur: 0.6 }); A(T[8] + 1.0, "spud", "lean", { to: 10, dur: 0.5 });   // chin forward: nose to nose
look(T[8] + 1.1, "wedge", AT_YOU); expr(T[8] + 1.2, "spud", "angry"); expr(T[8] + 1.4, "wedge", "smug");
see(R2, END_OF(8), ["spud.face", "wedge.face"], "both of you, whole forearms along the console, leaning in nose to nose");
// 08 the bag: I fly a lot. (his voice over the pilot hat)
const S8 = 19.9;
prop(0, "hat", { y: 0.255 }, 0, "linear");   // the hat pokes out of his bag from frame 0: planted in plain sight, the insert just points at it (Sol r2 7)
say(9);
see(S8, 22.0, ["hat"], "under the seats: his open bag, a captain's hat poking out");
// unwind off camera
lap(S8 + 0.2, "spud", "L", 0.01); lap(S8 + 0.2, "wedge", "R", 0.01);
A(S8 + 0.2, "spud", "lean", { to: 0, dur: 0.01 }); A(S8 + 0.2, "wedge", "lean", { to: 0, dur: 0.01 });

// ---------------------------------------------------------------- ROUND 3: butter (09)
const S9 = 22.1;
const kn = grips.thin(c, "spud", KNIFE, { side: "L", from: 0.6 });
prop(cut(S9), "knife", { x: -1.72, y: 0.80, z: 0.2 }, 0, "linear");
kn.take(cut(S9), { reach: 0.01, settle: 0.01 });
const STROKE = (t, z0, z1) => { kn.carry(t, [CX - 0.02, 0.745, r3(z0 + CZ)], 0.12, "inOut", { rot: -90, tip: 55 }); return kn.carry(r3(t + 0.12), [CX + 0.0, 0.745, r3(z1 + CZ)], 0.4, "inOut", { rot: -90, tip: 55 }); };
kn.carry(cut(S9), [-1.72, 0.85, 0.2], 0.01, "linear", { rot: -90, tip: 55 });
expr(S9, "spud", "cocky"); look(S9, "spud", [0.5, -0.6]);
STROKE(S9 + 0.2, -0.15, -0.02); STROKE(S9 + 0.75, -0.08, 0.05); STROKE(S9 + 1.3, -0.12, 0.1);
prop(S9 + 0.3, "console", { butter: 1 }, 1.6, "linear");
sfx(S9 + 0.35, "squirt", { gain: 0.25, reason: "butter spread" }); sfx(S9 + 1.4, "squirt", { gain: 0.2 });
// the knife tip flips the cover open: Oops.
kn.carry(S9 + 1.9, [CX - 0.02, 0.80, 0.45], 0.2, "out", { rot: -90, tip: 55 }); prop(S9 + 2.0, "console", { guard: 1 }, 0.25, "out"); sfx(S9 + 2.0, "click", { gain: 0.4 });
say(10);
look(T[10], "spud", [0.6, 0.0], 0.15);
see(S9, END_OF(10), ["spud.face", "console"], "you butter the armrest; the knife flips the button's cover open");
kn.carry(S9 + 2.4, [-1.80, 0.86, 0.36], 0.35, "inOut", { rot: -90, tip: 15 });   // knife up by your chest, smug (same hold: no palm turn)
   // in the attendant shot (you off frame): the knife goes inside the console, your hand back onto the top
// 10 he slips: his hand flies to a centimetre over the OPEN button
const S10 = 25.1;
expr(S10, "spud", "smug"); look(S10, "spud", AT_HIM);
rest(S10 + 0.15, "wedge", "R", [0.04, -0.1], 0.25); expr(S10 + 0.2, "wedge", "smug");
const SLIP = 25.75;
grip(SLIP, "wedge", "R", "press", 0.1); grips.rest(c, "wedge", "R", CONSOLE, [0.03, 0.12], SLIP, { dur: 0.08, ease: "in", top: 0.72 }); grips.rest(c, "wedge", "R", CONSOLE, [0.02, 0.27], r3(SLIP + 0.08), { dur: 0.1, ease: "out", top: 0.84 });   // the palm 1 cm over the open button, same palm side as the rest
A(SLIP, "wedge", "lean", { to: -7, dur: 0.15 }); A(SLIP + 0.15, "wedge", "lean", { to: -4, dur: 0.4 });
sfx(SLIP, "screech", { gain: 0.3, reason: "his elbow skids on the butter" });
say(11);
look(SLIP + 0.15, "wedge", AT_BUTTON_W, 0.1); look(SLIP + 0.15, "spud", AT_BUTTON_S, 0.1);
expr(SLIP + 0.15, "wedge", "terrified", 0.12, { open: 0.35 }); expr(SLIP + 0.15, "spud", "terrified", 0.12, { open: 0.5 });
see(SLIP, 27.6, ["wedge.face", "console"], "his hand stops a centimetre over the open button");
// the attendant again: Too. Dangerous.
const S12 = 27.7;
attAt(S12, ATT_AISLE, -25); A(cut(S12), "att", "show", {}); look(cut(S12), "att", [-0.8, -0.3], 0.01);
arm(cut(S12), "att", "R", { o: [0.16, 0.8, 0.22] }, 0.01); grip(cut(S12), "att", "R", "flat", 0.01);
say(12);
A(r3(END_OF(12) + 0.3), "att", "hide", {});
// he pulls back; your finger shuts the cover
const SHUT = 29.45;
lap(SHUT, "wedge", "R", 0.45); A(SHUT, "wedge", "lean", { to: 0, dur: 0.4 }); expr(SHUT, "wedge", "focused");
kn.carry(SHUT + 0.05, [CX - 0.01, 0.86, 0.36], 0.2, "inOut", { rot: -90, tip: 55 }); kn.carry(SHUT + 0.25, [CX - 0.01, 0.83, 0.40], 0.12, "in", { rot: -90, tip: 55 });   // the knife pushes the cover shut
prop(SHUT + 0.35, "console", { guard: 0 }, 0.2, "in"); sfx(SHUT + 0.55, "click", { gain: 0.35 });
kn.carry(SHUT + 0.5, [-1.80, 0.86, 0.36], 0.3, "inOut", { rot: -90, tip: 15 });
kn.release(r3(cut(30.2) + 0.01), { rest: false, back: 0.01, to: [CX, 0.3, CZ] }); lap(r3(cut(30.2) + 0.06), "spud", "L", 0.01);   // on the fake-arm cut (you off frame): the knife goes, your hand to your lap

// ---------------------------------------------------------------- ROUND 4: the fake third arm (11)
const S11 = 30.2;
const fa = grips.mug(c, "wedge", FAKE, { side: "R" });
prop(cut(S11), "fakearm", { x: -0.94, y: 0.35, z: 0.42 }, 0, "linear");
fa.take(cut(S11), { reach: 0.01, settle: 0.01 });
fa.carry(cut(S11), [-1.02, 0.35, 0.42], 0.01, "linear");
fa.carry(S11 + 0.05, [-0.80, 0.56, 0.64], 0.45, "out");   // lower and in front: fingers below his eyes (Sol r2 13)   // up into frame like a trophy
expr(S11, "wedge", "cocky"); look(S11, "wedge", [-0.3, 0.1]);
say(13);
c.at(r3(T[13] + 1.0), { fx: "glint", pos: [WX + 0.2, SEAT + 0.41, 0.3], dur: 0.5 });   // the wings pin, once
sfx(r3(T[13] + 1.0), "ting", { gain: 0.3, reason: "the pin's glint" });
// cut: the arm lies on the console; his gloves pull the mask over his eyes
const S11b = 33.0;
fa.release(cut(S11b), { rest: false, back: 0.01, to: [CX + 0.04, 0.785, -0.06] }); lap(r3(cut(S11b) + 0.04), "wedge", "R", 0.01); 
prop(cut(S11b), "fakearm", { tip: 90, rot: 0 }, 0, "linear");
lap(cut(S11b), "wedge", "R", 0.01); lap(cut(S11b), "wedge", "L", 0.01);
prop(cut(S11b), "mask", { scale: 1 }, 0, "linear");
A(S11b + 0.5, "wedge", "pitch", { to: -8, dur: 0.6 }); expr(S11b + 0.4, "wedge", "serene", 0.3, { open: 0.25 });
say(14);
expr(S11b, "spud", "annoyed"); look(S11b + 0.3, "spud", AT_HIM); look(T[14] + 0.6, "spud", [0.5, -0.6], 0.25);
see(S11b, 35.2, ["wedge", "fakearm", "spud.face"], "a fake arm on the armrest, him asleep under a mask; you glare");

// ---------------------------------------------------------------- ROUND 5: the crowbar (12, 13)
const S12b = 35.4;
prop(cut(S12b), "hall", { lid: 1 }, 0, "linear");
prop(0, "hall", { fill: 0 }, 0, "linear");   // the EXIT sign stays dark the whole video (no lettering lit)
prop(cut(S12b), "crowbar", { x: -1.78, y: 0.15, z: 0.45 }, 0, "linear");
const cb = grips.mug(c, "spud", BAR, { side: "L" });
cb.take(cut(S12b), { reach: 0.01, settle: 0.01 });
cb.carry(cut(S12b), [-1.78, 0.15, 0.45], 0.01, "linear");

cb.carry(S12b + 0.05, [-1.78, 0.42, 0.45], 0.4, "out");
expr(S12b, "spud", "angry"); look(S12b, "spud", [0.2, 0.3]);
say(15);
see(S12b, END_OF(15), ["spud.face", "crowbar"], "you, the open bin above, a big red crowbar in both hands");
// insert: the tip goes under the fake arm's cuff and levers it off
const S13a = 37.0;
cb.carry(cut(S13a), [CX + 0.01, 0.80, -0.02], 0.01, "linear", { rot: -90, tip: 55 });
cb.carry(S13a + 0.1, [CX + 0.06, 0.775, 0.08], 0.25, "inOut", { rot: -90, tip: 45 });
cb.carry(S13a + 0.4, [CX + 0.06, 0.80, 0.08], 0.15, "out", { rot: -90, tip: 38 });
prop(r3(S13a + 0.45), "fakearm", { x: -1.6, y: 1.7, z: 0.9, tip: 160, rot: 40 }, 0.35, "out");   // levered up and out of frame
prop(cut(37.9), "fakearm", { y: -40 }, 0, "linear");
sfx(S13a + 0.45, "plank-rattle", { gain: 0.5, reason: "the fake arm pops off" });
// he wakes: Hey! Hnnngh! and grabs the bar: the tug, the tip wobbling over the button
const S13 = 37.9;
prop(cut(S13), "mask", { scale: 0 }, 0, "linear");   // off: he shoved it up as he woke (behind the cut)
A(cut(S13), "wedge", "pitch", { to: 0, dur: 0.01 });
cb.carry(cut(S13), [CX - 0.02, 0.90, 0.38], 0.01, "linear", { rot: -90, tip: 50 });
prop(cut(S13), "wedgeC", { rot: 0 }, 0, "linear");
expr(S13, "wedge", "angry"); expr(S13, "spud", "angry"); look(S13, "wedge", AT_YOU); look(S13, "spud", AT_HIM);
const TUG = (k) => [r3(CX - 0.02 + (k % 2 ? 0.03 : -0.03)), 0.90, 0.38];
const TUGHAND = (k) => ({ prop: "console", grip: [r3(-0.03 + (k % 2 ? 0.03 : -0.03)), 0.97, 0.28] });   // his fist on the bar just above the button (console frame)
arm(S13 + 0.15, "wedge", "R", { prop: "console", grip: [-0.03, 0.97, 0.28] }, 0.2, "out"); grip(S13 + 0.3, "wedge", "R", "hold", 0.12);
say(16);
for (let k = 0; k < 4; k++) { const tk = r3(S13 + 0.45 + k * 0.22); cb.carry(tk, TUG(k), 0.22, "inOut", { rot: -90, tip: 50 }); arm(tk, "wedge", "R", TUGHAND(k), 0.22, "inOut"); }
strain(S13 + 0.4, 39.3, "spud", 0.02); strain(S13 + 0.45, 39.3, "wedge", 0.02);
lap(39.35, "wedge", "R", 0.3);   // he lets go before the attendant cut (Sol r2 18); your bar goes off camera in the aisle shot
see(S13, 39.8, ["spud.face", "wedge.face", "crowbar"], "the tug of war, the crowbar's tip wobbling over the button");
// the attendant, losing her calm: Too. DANGEROUS!
const S14a = 39.85;
prop(cut(S14a), "fakearm", { y: -40 }, 0, "linear");
attAt(S14a, ATT_AISLE, -25); A(cut(S14a), "att", "show", {}); look(cut(S14a), "att", [-0.8, -0.3], 0.01);
arm(cut(S14a), "att", "R", { o: [0.18, 1.0, 0.14] }, 0.01); arm(cut(S14a), "att", "L", { o: [-0.18, 1.0, 0.14] }, 0.01);
grip(cut(S14a), "att", "R", "open", 0.01); grip(cut(S14a), "att", "L", "open", 0.01); expr(cut(S14a), "att", "terrified", 0.01, { open: 0.15 });
say(17);
// 13b plant 3: down the aisle, the cockpit door swings open: the cockpit is EMPTY (nobody looks)
const S13b = 41.4;
prop(S13b + 0.15, "hall", { open: 1 }, 0.9, "inOut"); sfx(S13b + 0.2, "creak", { gain: 0.35, reason: "the cockpit door swings open" });
see(S13b, 42.6, ["cockpit"], "far down the aisle the cockpit door swings open: nobody at the controls");
// off camera: you both let go; the crowbar falls between the seats
cb.release(r3(S13b + 0.05), { rest: "lap", back: 0.01, to: [-1.56, -40, 0.6] });   // off camera (the aisle shot looks away from you)
prop(r3(S13b + 0.1), "spudC", { rot: 0 }, 0, "linear"); prop(r3(S13b + 0.1), "wedgeC", { rot: 0 }, 0, "linear");
lap(S13b + 0.15, "wedge", "R", 0.01); lap(S13b + 0.15, "spud", "L", 0.01); lap(S13b + 0.15, "spud", "R", 0.01);
A(r3(END_OF(17) + 0.2), "att", "hide", {});

// ---------------------------------------------------------------- TURN: you look at the button. At him. At the button.
const S15 = 42.8;
expr(S15, "spud", "focused"); expr(S15, "wedge", "smug"); A(S15, "wedge", "lean", { to: -3, dur: 0.4 });   // he sits back, clear of the console for the press insert
look(S15 + 0.1, "spud", AT_BUTTON_S, 0.25); look(S15 + 0.7, "spud", AT_HIM, 0.2); look(S15 + 1.3, "spud", AT_BUTTON_S, 0.2);
say(18);
expr(T[18] + 0.2, "spud", "evil", 0.3);
// insert: your finger flips the cover and presses
const PRESS = 46.0;
lap(cut(PRESS), "spud", "L", 0.01); grip(cut(PRESS), "spud", "L", "point", 0.01);
grips.rest(c, "spud", "L", CONSOLE, [-0.03, 0.40], r3(PRESS + 0.02), { dur: 0.16, ease: "out", top: 0.88 });   // in front of the lid and above it (Sol r2 19)   // the finger arrives under the lid
prop(PRESS + 0.16, "console", { guard: 1 }, 0.16, "out"); sfx(PRESS + 0.2, "click", { gain: 0.45 });
grips.rest(c, "spud", "L", CONSOLE, [0, 0.285], r3(PRESS + 0.3), { dur: 0.12, ease: "inOut", top: 0.80 });
grips.rest(c, "spud", "L", CONSOLE, [0, 0.285], r3(PRESS + 0.42), { dur: 0.06, ease: "in", top: 0.765 });
prop(PRESS + 0.45, "console", { press: 1 }, 0.06, "in"); sfx(PRESS + 0.48, "click", { gain: 0.7 });
see(PRESS, 46.6, ["console"], "your finger flips the cover and presses the button");
// 14 LAUNCH: the hatch blows, the flame, his seat (and him) through the roof
const L0 = 46.7;
prop(L0 + 0.06, "hatch", { hatch: 1 }, 0.22, "out");
prop(L0 + 0.1, "rocket", { flame: 1 }, 0.1, "out");
for (const [k, y] of [[0, 0.15], [1, 0.85], [2, 1.55]]) c.at(r3(L0 + 0.1 + k * 0.07), { fx: "poof", pos: [WX, y, 0], color: "#f4f4f2", puffs: 16, sparks: 0, size: 0.9, dur: 1.1 });
sfx(L0 + 0.05, "explosion", { gain: 0.8, loud: true, reason: "the ejector seat fires" }); sfx(L0 + 0.1, "rocket", { gain: 0.8, reason: "the seat's rocket" });
c.at(L0 + 0.1, { fx: "shake", amp: 0.05, dur: 0.5 });
expr(L0 + 0.1, "wedge", "terrified", 0.08, { open: 0.8 });
for (const id of ["seatC", "rocket", "wedgeC"]) { prop(L0 + 0.1, id, { y: 0.06 }, 0.07, "out"); prop(L0 + 0.2, id, { y: LIFT }, 0.3, "in"); }
expr(L0 + 0.1, "spud", "shocked", 0.08, { open: 0.3 }); look(L0 + 0.1, "spud", [0.6, 0.8], 0.1);
see(L0, 47.3, ["wedge", "hatch"], "his seat blasts straight up through a hatch in the ceiling");
// gone: seat, rocket and him parked high above (behind the sky card), the hatch stays open
for (const id of ["seatC", "rocket", "wedgeC"]) prop(L0 + 0.55, id, { y: 40 }, 0, "linear");
A(L0 + 0.55, "wedge", "hide", {});
// 15 the whole armrest is yours: ...Mine.
const S15b = 47.6;
rest(cut(S15b), "spud", "L", [-0.02, 0.0], 0.01); grip(cut(S15b), "spud", "L", "press", 0.01); look(cut(S15b), "spud", [0.6, 0.6], 0.01); expr(cut(S15b), "spud", "shocked", 0.01, { open: 0.2 });
look(S15b + 0.3, "spud", [0.5, 0.0], 0.3);
rest(S15b + 0.5, "spud", "L", [-0.02, 0.0], 0.5, "inOut"); A(S15b + 0.5, "spud", "lean", { to: 6, dur: 0.6 });
expr(S15b + 0.7, "spud", "serene", 0.4); A(S15b + 0.8, "spud", "face", { lid: 1, dur: 0.4 });
say(19);
sfx(S15b, "windswell", { gain: 0.35, dur: 10, reason: "wind roaring through the open hatch" });
see(S15b, END_OF(19), ["spud.face", "console"], "you alone, your arm over the whole console, eyes closed in bliss, daylight down through the hole");
// the speaker: Ladies and gentlemen... this is your captain.
sfx(50.0, "ding", { gain: 0.6, reason: "the cabin speaker chime" });
say(20);
A(T[20] + 2.6, "spud", "face", { lid: 0.4, dur: 0.4 }); expr(T[20] + 2.6, "spud", "focused", 0.3);
// I was in seat 14B.
const S16 = 54.5;
look(S16, "spud", [0.6, 0.15], 0.2); expr(S16, "spud", "shocked", 0.2, { open: 0.1 });
say(21);
expr(END_OF(21) + 0.05, "spud", "terrified", 0.15, { open: 0.7 });
sfx(END_OF(21) + 0.1, "groan", { gain: 0.6, reason: "the airframe groans as the nose drops" }); c.at(r3(END_OF(21) + 0.1), { fx: "shake", amp: 0.04, dur: 1.2 });
A(r3(END_OF(21) + 0.15), "spud", "pitch", { to: 10, dur: 0.4 }); prop(r3(END_OF(21) + 0.15), "bag", { z: 1.25 }, 0.8, "in"); prop(r3(END_OF(21) + 0.15), "hat", { z: 1.25 }, 0.8, "in");   // the bag slides toward the nose (Sol r2 22)
see(S16, END, ["spud.face"], "your face as it lands; the cabin tips nose down");

// ---------------------------------------------------------------- shots
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const C1 = { pos: [CX, 1.5, 1.65], look: [CX, 0.74, 0.25], fov: 32 };                  // the button close-up
const C2 = { pos: [CX, 1.12, 3.4], look: [CX, 0.92, 0.1], fov: 68 };   // z 3.4 max: the seat row ahead starts near 3.5                   // the two-shot from the front
const ATT3 = { pos: [-1.12, 1.32, 3.35], look: [-1.12, 1.0, 0.1], fov: 86 };             // all three: she leans in from the aisle
const C6 = { pos: [-0.3, 1.25, 1.9], look: [-0.05, 1.05, -0.1], fov: 44 };            // the aisle: she right behind his shoulder
const YOU_CLOSE = { pos: [-2.12, 1.12, 2.8], look: [-2.12, 0.95, 0.1], fov: 46 };
const HIM_SLIDE = { pos: [-1.2, 1.12, 2.9], look: [-1.2, 0.98, 0.1], fov: 52 };   // his face and the whole console: the full slide (Sol r2 3)
const HIM_CLOSE = { pos: [-1.0, 1.15, 2.9], look: [-1.0, 1.08, 0.1], fov: 44 };
const BAG = { pos: [-1.1, 0.78, 1.75], look: [-1.1, 0.18, 0.82], fov: 42 };   // from above: carpet behind the bag, the upper third clear
const BUTTER = { pos: [-1.92, 1.2, 2.1], look: [-1.92, 0.88, 0.1], fov: 58 };
const BAR_LOW = { pos: [-2.0, 0.78, 1.5], look: [-2.03, 1.25, 0.0], fov: 52 };
const AISLE = { pos: [-0.25, 1.25, 0.8], look: [0.0, 1.05, 10.5], fov: 34 };
const C14 = { pos: [-1.75, 0.45, 2.30], look: [-1.15, 1.60, 0.0], fov: 62 };
const C15 = { pos: [-1.95, 1.05, 2.5], look: [-1.95, 1.0, 0.0], fov: 58 };
const TIP = { ...C15, to: { pos: [C15.pos[0], 1.35, 2.3], look: [-1.8, 0.45, -0.8], fov: 60, roll: 3 }, dur: 1.1, ease: "in" };
const beats = c.beats([
  ["slam", 0, C1, "hook"],
  ["never touch", S2, push(ATT3, 0.05, T[1] - S2)],
  ["what does it do", cut(T[1] - 0.15), push(YOU_CLOSE, 0.05, 1.2)],
  ["nobody came back", cut(T[2] - 0.15), push(ATT3, 0.08, SLIDE - T[2])],
  ["mine", SLIDE - 0.05, push(HIM_SLIDE, 0.06, T[4] - SLIDE)],
  ["armrest is mine", cut(T[4] - 0.15), push(YOU_CLOSE, 0.07, 1.6)],
  ["round 1", R1 - 0.1, push(C2, 0.05, 2.1)],
  ["one centimetre", 12.0, push(C1, 0.04, 1.0), "insert"],
  ["too dangerous 1", S6, push(C6, 0.05, 1.7)],
  ["back off", OFF1 - 0.05, push(C2, 0.08, S8 - OFF1)],
  ["the hat", S8, push(BAG, 0.12, S9 - S8)],
  ["butter", S9, push(BUTTER, 0.05, S10 - S9)],
  ["the slip", S10, push(C2, 0.05, 1.5)],
  ["over the button", 26.6, push(C1, 0.04, 1.0), "insert"],
  ["too dangerous 2", S12, push(C6, 0.06, 1.7)],
  ["shut it", SHUT - 0.05, C2],
  ["the fake arm", S11, push(HIM_CLOSE, 0.06, S11b - S11)],
  ["asleep", S11b, push(C2, 0.06, S12b - S11b)],
  ["the crowbar", S12b, push(BAR_LOW, 0.06, S13a - S12b)],
  ["the lever", S13a, push(C1, 0.04, S13 - S13a), "insert"],
  ["the tug", S13, push(C2, 0.06, S14a - S13)],
  ["too dangerous 3", S14a, push(C6, 0.08, S13b - S14a)],
  ["the cockpit", S13b, push(AISLE, 0.04, S15 - S13b)],
  ["the decision", S15, push(YOU_CLOSE, 0.1, PRESS - S15)],
  ["the press", PRESS, push(C1, 0.05, L0 - PRESS), "insert"],
  ["launch", L0, C14, "payoff"],
  ["mine", S15b, push(C15, 0.05, S16 - S15b)],
  ["seat 14B", S16, push(YOU_CLOSE, 0.08, END_OF(21) + 0.05 - S16)],
  ["nose down", r3(END_OF(21) + 0.05), TIP],
], END);

write(import.meta.url, {
  id: "armrest-war",
  title: "Armrest war",
  idea: "Rival duel 01: one armrest, two strangers, and a red button nobody may touch. Every round escalates (elbow, both elbows and chin, butter, a fake third arm, a crowbar) and every near-press brings the attendant back. You press it on him; his seat blasts through the roof. Then the speaker: this is your captain, I was in seat 14B.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#c9ced6", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: { diffuse: 0.08, hal: 0.2 } },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "indoor" },
  creative: { length: [55, 80] },
  hook: { show: ["console"], hint: 0, what: "a big red button under a clear cover on a shared plane armrest; two sleeves slam down either side of it" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "seatD", from: 0, to: END, checks: ["clipping", "shell"], reason: "you sit in your seat" },
    { who: "wedge", with: "seatC", from: 0, to: END, checks: ["clipping", "shell"], reason: "he sits in his seat (it flies with him)" },
    { who: "spud", with: "console", from: 0, to: END, checks: ["clipping"], reason: "your hands and forearm rest on the console top" },
    { who: "wedge", with: "seatC", from: 7.4, to: 8.0, checks: ["costume-in-prop"], reason: "Mine: his jacket brushes the side of his own seat as he leans over the armrest" },
    { who: "wedge", with: "seatC", from: 0.9, to: 3.0, checks: ["costume-in-prop"], reason: "his collar presses his own seat back as he turns to her; the seat back is behind him" },
    { who: "wedge", with: "seatC", from: 27.6, to: 28.6, checks: ["costume-in-prop"], reason: "his collar presses his own seat back as he turns to her; he is off frame in her shot" },
    { who: "wedge", with: "seatC", from: 46.9, to: 47.3, checks: ["costume-in-prop", "arm-in-prop"], reason: "the ejection: he is thrown into his seat as it fires, under the smoke" },
    { who: "spud", with: "seatD", from: 25.1, to: 25.3, checks: ["costume-in-prop"], reason: "your elbow brushes your own seat back as the hand comes back to your lap" },
    { who: "spud", with: "seatD", from: 36.95, to: 37.4, checks: ["costume-in-prop", "arm-in-prop"], reason: "the crowbar insert: your elbow brushes your own seat back, you are off frame (C1 sees x -1.81..-1.30)" },
    { who: "spud", with: "console", from: 22.0, to: 25.15, checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "butter: the glove rides above the top beside the clear cover (the cover's box reaches 0.813); close stills at 22.5, 23.0, 24.1 show the hand clear of the top" },
    { who: "spud", with: "knife", from: 24.45, to: 30.2, checks: ["thin-prop-hidden", "hand-in-prop"], reason: "you hold the knife up by your cheek after the flip: the handle shows above the fist, the blade behind the glove (still 26.0); the palm touches the handle as it lifts" },
    { who: "spud", with: "knife", from: 24.0, to: 25.1, checks: ["thin-prop-hidden"], reason: "the flip: the blade tip is under the cover's lip, the handle shows past the fist (still 24.1)" },
    { who: "wedge", with: "crowbar", from: 37.9, to: 39.85, checks: ["hand-in-prop"], reason: "the tug: his fist closes round the bar" },
    { who: "wedge", with: "console", from: 33.1, to: 33.6, checks: ["costume-in-prop"], reason: "his sleeve brushes the console top as both hands go up to the mask" },
    { who: "wedge", with: "console", from: 0, to: END, checks: ["clipping"], reason: "his hands and forearm rest on the console top" },
  ],
  notes: "Generated by storyboards/series/rival-duel/01-armrest-war/make-armrest-war.mjs.",
});
