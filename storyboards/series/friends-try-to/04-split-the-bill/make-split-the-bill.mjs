// MY FRIEND GROUP TRYING TO SPLIT ONE BILL ("friends try to" episode 4, 5 Nov 2026), from the clip template.
//   node storyboards/series/friends-try-to/04-split-the-bill/make-split-the-bill.mjs -> split-the-bill.json
// Brief: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/04-split-the-bill-ENGINE-PROMPT.md
// Jonny's eight panels: storyboards/04-split-the-bill/ there (PANELS.md here).
//
// THE BRIEF (exactly 10 s, Wizard, Viking, Phoenix, Reaper and the Samurai as the waiter)
//   Joke:        the bill arrives after dinner. The Wizard's calculator spell explodes into confetti, Viking dumps
//                coins, buttons and a fish bone on the table, Phoenix only had water. Reaper flicks his scythe once and
//                the bill is literally split: four equal strips, one on each plate.
//   Wants:       everyone wants to pay less than the others.
//   Consequence: they cheer; Viking raises one finger to the waiter: "…dessert?" A new, much longer bill drops.
//   Ending:      three glares at Viking, his sheepish grin, the waiter holding out the card machine.
//   Callback:    frame 0 the waiter's bill lands and everyone grabs; the last frame the waiter's (longer) bill lies
//                there and nobody moves.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { ending } from "../ending.mjs";

const OPENER = { who: "wiz", line: "yip!", words: false };
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const T0 = 7.0, END = 9.8;   // + two 3-frame hit-stops (the confetti burst, the scythe) = exactly 10.0 s

// ---------------------------------------------------------------- places (x right, z toward the camera)
// One long low table across the frame; Viking and Phoenix sit behind it, the Wizard and Reaper at its two ends (a
// little nearer the camera, as in the panels), the waiter stands back right behind Reaper.
const TH = 0.38, TABLE = [0, 0.47], TW = 1.2, TD = 0.7;
const WIZ = [-1.05, 0.55], VIK = [-0.5, -0.3], PHX = [0.5, -0.3], REA = [1.05, 0.55], SAM = [1.32, -1.0];
const WIZ_YAW = 40, VIK_YAW = 8, PHX_YAW = -8, REA_YAW = -40, SAM_YAW = -35;
// on the table (y TH): each friend's plate, Viking's stack, Phoenix's water, the pouch, the tray with the bill
const PL_WIZ = [-0.34, 0.64], STACK = [-0.4, 0.3], PL_PHX = [0.07, 0.36], PL_REA = [0.47, 0.68], GLASS = [0.41, 0.27];
const TRAY = [-0.12, 0.56], POUCH = [-0.13, 0.27], SPILL = [0.08, 0.58], FISH1 = [0.02, 0.72];
const LANE = 0.25;   // the long bill's path across the table, clear of the plates

const cast = [
  { id: "wiz", character: "bistro/wizard-staff-r", at: WIZ, face: WIZ_YAW, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "duo/viking", at: VIK, face: VIK_YAW, expr: "focused", follow: 0.3, seed: 4.1 },
  { id: "phx", character: "duo/phoenix", at: PHX, face: PHX_YAW, expr: "kind", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "rea", character: "bistro/reaper-scythe-l", at: REA, face: REA_YAW, expr: "kind", follow: 0.25, seed: 3.3 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM, face: SAM_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
];
const PHONE = { id: "phone", kind: "phone", ...grips.placeFor("phone", [PHX[0] - 0.2, 0.5, PHX[1] + 0.36], PHX_YAW), tip: -15, scale: 1.6, case: "#e07a5f" };
const GLASS_SPEC = { id: "glass", kind: "waterglass", x: GLASS[0], y: TH, z: GLASS[1], rot: 0 };
const READER = { id: "reader", kind: "cardreader", ...grips.placeFor("cardreader", [r3(SAM[0] + 0.3), 0.36, r3(SAM[1] + 0.24)], SAM_YAW + 30), scale: 1.2 };
const BILL0 = [-0.12, r3(TH + 0.012), 0.56];   // on the tray, its long side along x (rot 90: its top end to the left)
// the long bill's path in its own frame (origin where the roll lands, behind the plates on the lane)
const LB = [LANE, TH, 0.18];
const LB_PATH = [[0, 0, 0], [0, 0, r3(TABLE[1] + TD / 2 + 0.02 - LB[2])], [0, -0.06, r3(TABLE[1] + TD / 2 + 0.05 - LB[2])], [0, -TH, r3(TABLE[1] + TD / 2 + 0.1 - LB[2])], [-0.05, -TH, 1.75]];
const CONF = ["#e0475b", "#ffd23f", "#3d8fb0", "#6cbf3a", "#f07fa6"];
const props = [
  { id: "table", kind: "bistrotable", x: TABLE[0], z: TABLE[1], w: TW, d: TD, h: TH, drape: 0.14 },
  { id: "tray", kind: "billtray", x: TRAY[0], y: TH, z: TRAY[1] },
  { id: "bill", kind: "receipt", x: BILL0[0], y: BILL0[1], z: BILL0[2], rot: 90 },
  { id: "stack", kind: "platestack", x: STACK[0], y: TH, z: STACK[1], n: 5 },
  { id: "plwiz", kind: "dinnerplate", x: PL_WIZ[0], y: TH, z: PL_WIZ[1], r: 0.13, crumbs: 9, seed: 4 },
  { id: "plphx", kind: "dinnerplate", x: PL_PHX[0], y: TH, z: PL_PHX[1], r: 0.095, crumbs: 6, seed: 8 },   // a bread plate: he "only had water"
  { id: "plrea", kind: "dinnerplate", x: PL_REA[0], y: TH, z: PL_REA[1], r: 0.12, crumbs: 3, seed: 5 },
  GLASS_SPEC,
  { id: "pouch", kind: "pouch", x: POUCH[0], y: TH, z: POUCH[1], rot: -10 },
  { id: "spill", kind: "spillpile", x: SPILL[0], y: TH, z: SPILL[1], from: [r3(POUCH[0] + 0.12 - SPILL[0]), 0.09, r3(POUCH[1] - SPILL[1])], seed: 21 },
  { id: "fish", kind: "fishbone", x: r3(POUCH[0] + 0.12), y: r3(TH + 0.08), z: POUCH[1], rot: 20, scale: 0.001 },
  { id: "sum", kind: "sum", x: -0.42, y: 1.42, z: 0.4, from: [-0.3, -0.72, 0.38] },
  { id: "confetti", kind: "confetti", x: -0.12, y: 1.42, z: 0.32, count: 80, spread: 0.42, up: 0.25, floor: r3(1.42 - TH), depth: 0.42, seed: 7 },
  ...[0, 1, 2, 3].map((i) => ({ id: `strip${i}`, kind: "billstrip", i, x: 0, y: 0.8, z: 0.7, scale: 0.001 })),
  { id: "longbill", kind: "longbill", x: r3(SAM[0] - 0.12), y: 0.52, z: r3(SAM[1] + 0.3), path: LB_PATH, scale: 1 },
  READER,
  { id: "napkin", kind: "napkin", wear: "vik", x: 0, y: 0.6, z: 0.3, w: 0.3, h: 0.26 },
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, y0: 0.4, y1: 0.07, rx: 0.44, rz: 0.39, arc: 130 },
  { id: "nosefleck", kind: "fleck", wear: "vik", x: 0.0, y: 0.55, z: 0.37, color: "#e0475b", scale: 0.001 },
  { id: "hatfleck", kind: "fleck", wear: "wiz", x: 0.06, y: 1.05, z: 0.2, color: "#3d8fb0", scale: 0.001 },
  { id: "candle", kind: "bottlecandle", x: -0.52, y: TH, z: 0.76, lit: 1 },
  { id: "plant", kind: "bistroplant", x: 1.0, z: 1.45, scale: 1.7, seed: 12 },
  PHONE,
];

const SUB = 470, SUBS = { size: 62, kinetic: false };   // under the faces, over the table (fresh layout check)

// ---------------------------------------------------------------- 1 ALREADY GOING WRONG 0-1.5 (P1)
// frame 0: the tray has just landed (the waiter's hand coming back), four hands lunging; the Wizard and Viking get an
// end each and tug
act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
sfx(0, "put-down", { gain: 0.6, reason: "the bill tray clinks down on the table" });
sfx(0.02, "kenney/impact-plate-light", { gain: 0.35, reason: "the plates and cutlery rattle as everyone lunges" });
c.arm(0, "sam", "R", { o: [0.2, 0.42, 0.42] }, 0); c.arm(0.05, "sam", "R", "rest", 0.45, "inOut");
A(0, "sam", "look", { to: [-0.5, -0.4], dur: 0, blink: false }); A(0, "sam", "face", { lid: 0.55, dur: 0 });
act.blinksAt(c, "sam", [1.2, 4.6, 6.5]);
const W_END = [0, 0.003, -0.115], V_END = [0, 0.003, 0.115];   // the bill's two ends (its own frame)
// the hands are already on their way at frame 0
c.arm(0, "wiz", "L", { o: [0.3, 0.42, 0.42] }, 0); c.arm(0, "vik", "L", { o: [0.2, 0.42, 0.38] }, 0);
c.arm(0.0, "wiz", "L", { prop: "bill", grip: W_END, point: "pinch" }, 0.14, "out");
c.arm(0.0, "vik", "L", { prop: "bill", grip: V_END, point: "pinch" }, 0.14, "out");
A(0, "wiz", "grip", { side: "L", shape: "open", dur: 0 }); A(0, "vik", "grip", { side: "L", shape: "open", dur: 0 });
A(0.1, "wiz", "grip", { side: "L", shape: "pinch", dur: 0.06 }); A(0.1, "vik", "grip", { side: "L", shape: "pinch", dur: 0.06 });
A(0, "wiz", "lean", { to: 10, dur: 0 }); A(0, "vik", "lean", { to: 12, dur: 0 });
A(0, "wiz", "look", { to: [0.35, -0.45], dur: 0, blink: false }); A(0, "vik", "look", { to: [0.25, -0.5], dur: 0, blink: false });
A(0.06, "wiz", "expr", { expr: "angry", set: { open: 0.35 }, dur: 0.1 }); A(0.06, "vik", "expr", { expr: "angry", set: { open: 0.3, curve: -0.3 }, dur: 0.1 });
// the tug of war: the bill lifts between them and jerks left and right, bowing up as they pull
const TUG = [[0.18, -0.03], [0.42, 0.04], [0.64, -0.05], [0.86, 0.05], [1.08, -0.04], [1.26, 0.03]];
c.prop(0.15, "bill", { y: r3(TH + 0.13), bend: 0.5 }, 0.12, "out");
for (const [t, dx] of TUG) { c.prop(t, "bill", { x: r3(BILL0[0] + dx), bend: dx < 0 ? 0.2 : 0.65 }, 0.14, "inOut"); A(t, dx < 0 ? "wiz" : "vik", "lean", { to: dx < 0 ? 2 : 4, dur: 0.14 }); A(t, dx < 0 ? "vik" : "wiz", "lean", { to: 12, dur: 0.14 }); }
for (const t of [0.42, 0.86]) sfx(t, "papercut", { gain: 0.18, reason: "the paper snapping taut in the tug of war (a dry papery hiss, quiet)" });
A(0.3, "wiz", "talk", { line: "mine! mine!", tone: "excited", dur: 0.45, voice: false });
A(0.75, "vik", "talk", { line: "nyuh-uh!", tone: "excited", dur: 0.4, voice: false });
// Phoenix already has his phone out, Reaper doesn't move
const ph = grips.phone(c, "phx", PHONE, { side: "R" });
ph.secure(0, 0.01);
A(0, "phx", "look", { to: [-0.1, -0.5], dur: 0, blink: false });
A(0.1, "phx", "expr", { expr: "focused", dur: 0.15 });
A(0, "rea", "look", { to: [-0.55, -0.3], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.48, dur: 0 });
A(0, "rea", "expr", { expr: "deadpan", dur: 0 });
see(0, 1.4, ["wiz.face", "vik.face", "phx.face", "rea.face", "bill", "sam.face"], "P1: the bill lands and the tug of war starts; Phoenix on his phone, Reaper still");
act.blinksAt(c, "rea", [2.3, 4.9]); act.blinksAt(c, "phx", [1.6, 5.2]); act.blinksAt(c, "wiz", [1.55, 3.4, 6.0]); act.blinksAt(c, "vik", [1.5, 3.0, 6.05]);

// ---------------------------------------------------------------- 2 THE SPELL 1.5-3.3 (P2)
// the Wizard yanks it free, holds it up and points his staff: the numbers float up into a spinning sum and explode
const YANK = 1.36, HELD = [-0.74, 0.66, 0.83];
c.prop(YANK, "bill", { x: HELD[0], y: HELD[1], z: HELD[2], bend: 0, rot: 120 }, 0.2, "out");
A(YANK, "wiz", "lean", { to: -6, dur: 0.18 });
A(r3(YANK + 0.02), "vik", "grip", { side: "L", shape: "open", dur: 0.05 });
c.arm(r3(YANK + 0.04), "vik", "L", { o: [0.18, 0.5, 0.3] }, 0.2, "out");
A(YANK, "vik", "lean", { to: -4, dur: 0.2 }); A(r3(YANK + 0.05), "vik", "squash", { amount: 0.06, dur: 0.15 });
c.arm(1.75, "vik", "L", "rest", 0.3, "inOut"); A(1.8, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
act.mood(c, 1.55, "vik", "annoyed", { hold: 0.4 });
A(1.5, "vik", "look", { to: [-0.6, 0.0], dur: 0.12, blink: false });
A(1.5, "wiz", "lean", { to: 0, dur: 0.25 });
A(1.55, "wiz", "expr", { expr: "cocky", dur: 0.25 }); A(1.55, "wiz", "face", { lid: 0.3, dur: 0.25 });
A(1.55, "wiz", "look", { to: [0.3, -0.2], dur: 0.12, blink: false });
A(1.62, "wiz", "talk", { line: "pff, easy", tone: "calm", dur: 0.4, voice: false });
c.cap(2.0, 2.7, "Easy.", SUB, false, SUBS);
// the staff up: the spell pose, the staff side away from everyone (his right, the outer side)
A(1.7, "wiz", "grip", { side: "R", shape: "fist", dur: 0.12 });
c.arm(1.75, "wiz", "R", { o: [0.2, 0.95, 0.15] }, 0.3, "out"); A(1.75, "wiz", "tilt", { to: [14, 10], dur: 0.3 });
A(1.95, "wiz", "charge", { to: 1, dur: 0.3 });
sfx(1.95, "charge", { gain: 0.32, dur: 0.95, reason: "the Wizard's calculator spell charging" });
c.prop(1.95, "sum", { rise: 1 }, 0.5, "out");
c.prop(2.1, "sum", { spin: 760 }, 0.8, "in");
for (const t of [2.15, 2.3, 2.42, 2.52]) sfx(t, "timer-beep", { gain: 0.16, reason: "each number lands in the sum with a calculator beep" });
A(2.1, "wiz", "look", { to: [0.4, 0.55], dur: 0.15, blink: false });
for (const [w, d] of [["vik", 0], ["phx", 0.06], ["rea", 0.1]]) A(r3(2.15 + d), w, "look", { to: [w === "rea" ? -0.75 : -0.3, 0.6], dur: 0.15, blink: false });
A(2.3, "phx", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.12 });
see(2.25, 2.85, ["wiz.face", "sum"], "P2: the glowing sum spins over the table, faster and faster");
const BOOM = 2.9;
c.prop(BOOM, "sum", { burst: 1 }, 0.3, "out");
c.prop(BOOM, "confetti", { burst: 1 }, 1.5, "linear");
sfx(BOOM, "pop", { gain: 0.7, reason: "the sum explodes into confetti" });
sfx(r3(BOOM + 0.05), "flutter", { gain: 0.35, reason: "the confetti fluttering down over the table" });
c.at(BOOM, { fx: "shake", dur: 0.2, amp: 0.012 });
c.hitStop(BOOM, 3);
A(r3(BOOM + 0.02), "wiz", "charge", { to: 0, dur: 0.25 });
c.arm(3.05, "wiz", "R", "rest", 0.4, "inOut"); A(3.05, "wiz", "tilt", { to: null, dur: 0.4 });
for (const [w, d] of [["wiz", 0], ["vik", 0.03], ["phx", 0.05]]) act.shock(c, r3(BOOM + 0.02 + d), w, { open: 0.45, eye: 1.3, hold: 0.25 });
A(r3(BOOM + 0.05), "rea", "face", { lid: 0.3, dur: 0.1 });
A(r3(BOOM + 0.05), "sam", "face", { lid: 1, dur: 0.06 }); A(r3(BOOM + 0.16), "sam", "face", { lid: 0.55, dur: 0.08 });   // the waiter blinks once
// confetti lands: in the water, on the Wizard's hat, one on Viking's nose; Viking glares at the Wizard
c.prop(3.3, "glass", { count: 1 }, 0.5);
c.prop(3.45, "hatfleck", { scale: 1 }, 0.05); c.prop(3.4, "nosefleck", { scale: 1 }, 0.05);
A(3.3, "vik", "look", { to: [-0.7, 0.05], dur: 0.12, blink: false });
act.mood(c, 3.35, "vik", "angry", { hold: 0.4 });
see(3.4, 3.75, ["vik.face", "nosefleck", "wiz.face"], "P2: confetti everywhere, one on Viking's nose, his glare at the Wizard");

// ---------------------------------------------------------------- 3 COINS AND MATHS 3.3-5.5 (P3-P4)
// Phoenix holds up his glass of water: "I only had water!"
const gl = grips.mug(c, "phx", GLASS_SPEC, { side: "L" });
let tg = gl.take(3.15, { reach: 0.25, settle: 0.15 });
gl.carry(tg, [r3(PHX[0] + 0.2), 0.86, r3(PHX[1] + 0.42)], 0.25, "out");
A(3.6, "phx", "look", { to: [-0.5, 0.1], dur: 0.12, blink: false });
A(3.62, "phx", "expr", { expr: "eager", set: { open: 0.35 }, dur: 0.15 });
A(3.65, "phx", "talk", { line: "I only had water!", tone: "excited", dur: 0.6, voice: false });
c.cap(3.65, 4.35, "I only had water!", SUB, false, SUBS);
sfx(3.68, "put-down-glass", { gain: 0.2, reason: "the water sloshing against the glass as he lifts it (a light glass clink)" });
// Viking empties his pouch: coins, buttons, a marble and a fish bone (splort)
const POUR = 3.75, PM = [r3(POUCH[0] + 0.02), r3(TH + 0.05), POUCH[1]];
c.arm(3.55, "vik", "L", { prop: "pouch", grip: [-0.06, 0.15, 0], palm: true }, 0.2, "out");
A(3.7, "vik", "grip", { side: "L", shape: "hold", dur: 0.08 });
c.prop(POUR, "pouch", { y: r3(TH + 0.08), tilt: -55, open: 1 }, 0.25, "out");
c.prop(POUR, "spill", { spill: 1 }, 0.7, "linear");
for (const [t, g] of [[3.82, 0.4], [3.92, 0.35], [4.02, 0.3], [4.15, 0.25]]) sfx(t, "coins", { gain: g, reason: "a cascade of coins pouring onto the table" });
sfx(4.3, "tink", { gain: 0.25, reason: "the marble rolling to a stop against a plate" });
const SPLORT = 4.12;
c.prop(r3(SPLORT - 0.12), "fish", { scale: 1.1 }, 0.04);
c.prop(r3(SPLORT - 0.12), "fish", { x: FISH1[0], y: r3(TH + 0.002), z: FISH1[1], rot: -10 }, 0.12, "in");
sfx(SPLORT, "splort", { gain: 0.5, reason: "Jonny's word: the wet fish bone slapping onto the table" });
c.prop(4.45, "pouch", { y: TH, tilt: 0 }, 0.25, "inOut");
c.arm(4.62, "vik", "L", "rest", 0.3, "inOut"); A(4.65, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(3.6, "vik", "look", { to: [0.2, -0.5], dur: 0.12, blink: false }); A(3.65, "vik", "expr", { expr: "cocky", dur: 0.2 });
A(4.15, "wiz", "look", { to: [0.35, -0.5], dur: 0.12, blink: false }); act.shock(c, 4.18, "wiz", { open: 0.3, hold: 0.25 });
A(4.2, "rea", "look", { to: [-0.6, -0.45], dur: 0.15, blink: false });
see(3.7, 4.3, ["phx.face", "glass", "spill", "vik.face"], "P3: Phoenix's one glass of water; Viking's pouch pours coins, buttons and a fish bone");
gl.put(4.35, [GLASS[0], TH, GLASS[1]]);
// the blame (P4): the Wizard and Viking point at each other and shout at once
A(4.5, "wiz", "look", { to: [0.55, 0.0], dur: 0.12, blink: false }); A(4.5, "vik", "look", { to: [-0.6, 0.0], dur: 0.12, blink: false });
act.mood(c, 4.55, "wiz", "angry", { hold: 0.5 }); act.mood(c, 4.58, "vik", "angry", { hold: 0.5 });
// the Wizard drops the bill to point: it skids across the cloth and stops in front of Reaper
const SLAP = 4.55, BILL_REA = [0.62, r3(TH + 0.003), 0.5];
c.prop(SLAP, "bill", { x: -0.45, y: r3(TH + 0.003), z: 0.64, rot: 95 }, 0.12, "in");
c.prop(r3(SLAP + 0.12), "bill", { x: BILL_REA[0], z: BILL_REA[2], rot: 75 }, 0.5, "out");
sfx(r3(SLAP + 0.12), "book-close", { gain: 0.35, reason: "the bill slapped down on the tablecloth" });
sfx(r3(SLAP + 0.18), "scrape", { gain: 0.15, dur: 0.35, reason: "the bill skidding along the cloth toward Reaper (soft)" });
A(SLAP, "wiz", "grip", { side: "L", shape: "open", dur: 0.06 });
c.arm(r3(SLAP + 0.08), "wiz", "L", { o: [0.34, 0.6, 0.32] }, 0.15, "out"); A(r3(SLAP + 0.12), "wiz", "grip", { side: "L", shape: "point", dur: 0.08 });
c.arm(4.6, "vik", "R", { o: [0.3, 0.6, 0.34] }, 0.15, "out"); A(4.64, "vik", "grip", { side: "R", shape: "point", dur: 0.08 });
A(4.62, "wiz", "talk", { line: "you had THREE mains!", tone: "excited", dur: 0.6, voice: false });
A(4.7, "vik", "talk", { line: "you had the bread!", tone: "excited", dur: 0.55, voice: false });
c.cap(4.6, 5.15, "THREE mains!", SUB, false, SUBS);
c.cap(5.15, 5.6, "You had the bread!", SUB, false, SUBS);
// Phoenix pushes his calculator at both of them; they both push it away
const SHOW = [r3(PHX[0] - 0.38), 0.62, r3(PHX[1] + 0.5)];
ph.carry(4.75, SHOW, 0.25, "out", { rot: r3(PHONE.rot - 35) });
for (const t of [4.45, 4.55, 4.65]) sfx(t, "key", { gain: 0.14, reason: "Phoenix tapping his calculator app" });
A(4.8, "phx", "look", { to: [-0.55, 0.0], dur: 0.12, blink: false }); A(4.8, "phx", "expr", { expr: "eager", dur: 0.15 });
c.arm(5.2, "vik", "R", { o: [0.3, 0.45, 0.42] }, 0.15, "out"); A(5.2, "vik", "grip", { side: "R", shape: "flat", dur: 0.08 });   // a flat "no" palm toward the phone
ph.carry(5.3, [r3(PHX[0] - 0.22), 0.52, r3(PHX[1] + 0.38)], 0.25, "inOut", { rot: PHONE.rot });
A(5.3, "phx", "expr", { expr: "sad", dur: 0.2 });
c.arm(5.5, "vik", "R", "rest", 0.3, "inOut"); A(5.55, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.arm(5.45, "wiz", "L", "rest", 0.3, "inOut"); A(5.5, "wiz", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
see(4.65, 5.4, ["wiz.face", "vik.face", "phone"], "P4: the blame: both point and shout at once, Phoenix shoves his calculator at them");

// ---------------------------------------------------------------- 4 THE CALM FIX 5.5-7.0 (P5): one flick of the scythe
// Reaper picks up the bill that skidded to him, holds it up by its top end, and one flick cuts it into four strips
const TAKE = 5.5, UP = [0.78, 0.86, 0.86];   // where the bill hangs from his fingers, in front of him, clear of everyone
A(5.4, "rea", "look", { to: [-0.35, -0.5], dur: 0.12, blink: false });
c.arm(TAKE, "rea", "R", { prop: "bill", grip: [0, 0.003, -0.115], point: "pinch" }, 0.22, "out");
A(5.6, "rea", "grip", { side: "R", shape: "pinch", dur: 0.06 });
c.prop(5.75, "bill", { x: UP[0], y: UP[1], z: UP[2], rot: -40, tip: 90 }, 0.3, "inOut");
sfx(5.78, "book-flip", { gain: 0.2, reason: "the bill lifted off the cloth with a papery flap" });
A(5.8, "rea", "look", { to: [-0.15, 0.2], dur: 0.15, blink: false });
A(5.85, "rea", "expr", { expr: "focused", set: { curve: 0 }, dur: 0.25 }); A(5.85, "rea", "face", { lid: 0.35, dur: 0.25 });
// the scythe: up on his outer side, then one flat flick across the paper (the blade below the hand, over the table)
const SCY_UP = { o: [0.3, 0.92, 0.2] }, SCY_CUT = { o: [-0.05, 0.62, 0.52] };
c.arm(5.85, "rea", "L", SCY_UP, 0.25, "out"); A(5.9, "rea", "tilt", { to: [-20, 0], dur: 0.25 });
act.windUp(c, 6.05, "rea", { amount: 0.1, dur: 0.12 });
const CUT = 6.2;
sfx(r3(CUT - 0.03), "blade-cut", { gain: 0.5, reason: "one scythe swish through the paper" });
sfx(r3(CUT + 0.01), "papercut", { gain: 0.45, reason: "the crisp paper snip as the strips part" });
c.arm(r3(CUT - 0.07), "rea", "L", SCY_CUT, 0.09, "in"); A(r3(CUT - 0.07), "rea", "tilt", { to: [40, -30], dur: 0.09, ease: "in" });
c.at(r3(CUT - 0.02), { fx: "slash", pos: [UP[0], 0.72, r3(UP[2] + 0.05)], r: 0.42, from: 150, arc: -150, rot: [-70, 0, 0], color: "#c08bff", width: 0.1, dur: 0.16 });
c.hitStop(CUT, 3);
// the bill becomes four strips: the bill vanishes on the cut frame and the strips hang where it hung, then flutter down
c.prop(CUT, "bill", { scale: 0.001 }, 0.02);
const SPOT = [[PL_WIZ[0], r3(TH + 0.016), PL_WIZ[1]], [STACK[0], r3(TH + 5 * 0.022 + 0.014), STACK[1]], [PL_PHX[0], r3(TH + 0.016), PL_PHX[1]], [PL_REA[0], r3(TH + 0.016), PL_REA[1]]];
for (let i = 0; i < 4; i++) {
  const y0 = r3(UP[1] + 0.0975 - i * 0.065);
  c.prop(r3(CUT - 0.01), `strip${i}`, { x: UP[0], y: y0, z: UP[2], rot: -40, tip: 90, scale: 1 }, 0.01);
  const t = r3(CUT + 0.08 + i * 0.05), [x, y, z] = SPOT[i];
  c.prop(t, `strip${i}`, { x, y, z, tip: 0, rot: r3(-20 + i * 15), spin: r3(180 + i * 90) }, r3(0.45 + i * 0.05), "inOut");
}
sfx(r3(CUT + 0.1), "flutter", { gain: 0.3, reason: "four paper strips fluttering down onto the plates" });
// his hand opens: the strips are cut free
A(r3(CUT + 0.04), "rea", "grip", { side: "R", shape: "open", dur: 0.08 });
c.arm(r3(CUT + 0.25), "rea", "R", "rest", 0.35, "inOut"); A(r3(CUT + 0.4), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.arm(r3(CUT + 0.2), "rea", "L", "rest", 0.4, "inOut"); A(r3(CUT + 0.2), "rea", "tilt", { to: null, dur: 0.4 });
A(r3(CUT + 0.3), "rea", "expr", { expr: "deadpan", dur: 0.25 }); A(r3(CUT + 0.3), "rea", "face", { lid: 0.5, dur: 0.25 });
// jaws drop; the waiter, very slightly, nods
for (const [w, d] of [["wiz", 0], ["vik", 0.04], ["phx", 0.07]]) { A(r3(5.9 + d), w, "look", { to: [w === "wiz" ? 0.8 : 0.5, -0.1], dur: 0.12, blink: false }); act.shock(c, r3(CUT + 0.04 + d), w, { open: 0.65, eye: 1.32, brow: 0.4, hold: 0.35 }); }
A(6.55, "sam", "pitch", { to: 6, dur: 0.15 }); A(6.72, "sam", "pitch", { to: 0, dur: 0.2 });
see(5.9, 6.15, ["rea.face", "bill"], "P5: Reaper holds the bill up by one end, the scythe raised");
see(6.3, 6.95, ["strip0", "strip1", "strip2", "strip3", "wiz.face", "vik.face", "phx.face"], "P5: four strips flutter onto four plates, jaws drop");

// ---------------------------------------------------------------- 5-7 THE SHARED ENDING (P6-P8)
// the cheer is a high-five across the table between the Wizard and Viking (P6); then Viking raises one finger to the
// waiter: "…dessert?" and the waiter drops a brand-new, much longer bill that rolls across the table onto the floor
const HF = [-0.8, 1.12, 0.18];   // where the Wizard's and Viking's palms meet
c.arm(r3(T0 + 0.02), "wiz", "L", { world: [r3(HF[0] - 0.02), HF[1], HF[2]] }, 0.16, "out");
c.arm(r3(T0 + 0.02), "vik", "R", { world: [r3(HF[0] + 0.03), HF[1], HF[2]] }, 0.16, "out");
A(r3(T0 + 0.02), "wiz", "grip", { side: "L", shape: "flat", dur: 0.08 }); A(r3(T0 + 0.02), "vik", "grip", { side: "R", shape: "flat", dur: 0.08 });
sfx(r3(T0 + 0.18), "punch", { gain: 0.3, reason: "the high-five's slap (a short meaty clap)" });
c.arm(r3(T0 + 0.6), "wiz", "L", "rest", 0.3, "inOut"); A(r3(T0 + 0.65), "wiz", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
c.arm(r3(T0 + 0.6), "vik", "R", "rest", 0.3, "inOut"); A(r3(T0 + 0.65), "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
const LB_LAND = [LB[0], LB[1], LB[2]];
const AT = { wiz: WIZ, vik: VIK, phx: PHX, rea: REA };
const E = ending(c, {
  T0, at: AT,
  arms: { wiz: [], vik: ["L"], phx: ["L"], rea: ["R"] },   // the staff, the phone and the scythe hands stay down; Wizard and Viking high-five
  cheerHop: [],
  undo(U) {
    // Viking, still beaming, raises one finger to the waiter
    A(r3(U - 0.1), "vik", "look", { to: [0.85, 0.25], dur: 0.12, blink: false });
    A(U, "vik", "turn", { to: -20, dur: 0.25 });
    c.arm(r3(U + 0.02), "vik", "L", { o: [0.22, 1.0, 0.18] }, 0.2, "out"); A(r3(U + 0.04), "vik", "grip", { side: "L", shape: "point", dur: 0.1 });
    A(U, "vik", "expr", { expr: "delighted", set: { open: 0.25 }, dur: 0.2 });
    A(r3(U + 0.1), "vik", "talk", { line: "dessert?", tone: "calm", dur: 0.4, voice: false });
    c.cap(r3(U + 0.1), r3(U + 0.7), "…dessert?", SUB, false, SUBS);
    // the waiter: the roll is in his apron pocket; up it comes and down on the table it goes
    A(r3(U - 0.25), "sam", "look", { to: [-0.3, -0.1], dur: 0.12, blink: false });
    c.arm(r3(U - 0.2), "sam", "R", { prop: "longbill", grip: [0, 0.07, 0], palm: true }, 0.2, "out");
    A(r3(U - 0.02), "sam", "grip", { side: "R", shape: "hold", dur: 0.08 });
    A(r3(U + 0.04), "sam", "grab", { prop: "longbill", hand: "R", keep: true, dur: 0, pose: null });
    c.arm(r3(U + 0.06), "sam", "R", { o: [0.3, 0.7, 0.5] }, 0.2, "out");
    const DROP = r3(U + 0.3);   // the "döm"... the sting starts here
    A(DROP, "sam", "grip", { side: "R", shape: "open", dur: 0.06 });
    A(DROP, "sam", "release", { prop: "longbill", to: LB_LAND, dur: 0.18, arc: 0.06 });
    c.arm(r3(DROP + 0.1), "sam", "R", "rest", 0.4, "inOut");
    sfx(r3(DROP + 0.18), "thud-soft", { gain: 0.5, reason: "the fat paper roll landing on the table" });
    c.prop(r3(DROP + 0.2), "longbill", { unroll: 1 }, 0.75, "out");
    sfx(r3(DROP + 0.22), "flutter", { gain: 0.4, reason: "the long bill unrolling across the table and down to the floor" });
    sfx(r3(DROP + 0.62), "thud-soft", { gain: 0.25, reason: "the roll dropping off the table's edge onto the floor" });
    A(r3(DROP + 0.05), "sam", "look", { to: [-0.55, 0.0], dur: 0.12, blink: false });
  },
  sting: 0.3,
  glareGap: 0.15,
  glareShare: { wiz: 0.3, phx: 0.35, rea: 0.25 },
  rub: "R",
});
// the waiter holds out the card machine (P8)
const rd = grips.phone(c, "sam", READER, { side: "L" });
let tr = rd.take(r3(E.glare - 0.35), { reach: 0.2, settle: 0.12 });
rd.carry(tr, [r3(SAM[0] - 0.05), 0.72, r3(SAM[1] + 0.5)], 0.3, "out", { rot: r3(SAM_YAW + 180 - 15) });
see(r3(E.glare + 0.4), 9.7, ["longbill", "reader", "sam.face"], "P8: the long bill on the floor, the card machine held out");

// ---------------------------------------------------------------- shots: Jonny's panels (one front view)
const WIDE = { pos: [0.18, 1.55, 6.3], look: [0.12, 0.7, 0.2], fov: 42 };
// P7-P8: a touch lower and wider so the long bill's run onto the floor shows
const LOW = { pos: [0.22, 1.25, 6.5], look: [0.18, 0.55, 0.3], fov: 46 };
const beats = c.beats([
  ["P1-P2 going wrong, the spell", 0, WIDE, "hook"],
  ["P3-P4 coins, water, blame", 3.3, "keep"],
  ["P5 the calm fix", 5.5, "keep", "reaction"],
  ["P6 cheer", T0, "keep"],
  ["P7-P8 the undo, the glare", E.payoff, LOW, "payoff"],
], END);

write(import.meta.url, {
  id: "split-the-bill",
  title: "My friend group trying to split one bill",
  idea: "Friends try to, episode 4: the calculator spell explodes into confetti, Viking pays in coins, buttons and a fish bone, Phoenix only had water; Reaper's scythe literally splits the bill. Then Viking orders dessert.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 9.6,
  set: { type: "plain", color: "#8a4a32", floor: "#6b4a30", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/cosy-bistro.png", z: -2.4, center: [0.1, 1.9], height: 7.6, depth: false, motion: false, dust: 10 } },
  music: { style: "bounce", key: 5, bpm: 104, lowCut: 150, gain: 0.3, until: E.musicStop },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", scenes: ["ui"], signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["wiz", "vik", "phx", "rea", "bill"], hint: 0.1, what: "the bill lands and two friends are already tugging it" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "napkin", from: 0, to: 10, reason: "the napkin is tucked in at Viking's neck (worn)" },
    { who: "vik", with: "nosefleck", from: 3.3, to: 10, reason: "a confetti square stuck on Viking's nose (worn)" },
    { who: "wiz", with: "hatfleck", from: 3.3, to: 10, reason: "a confetti square on the Wizard's hat (worn)" },
    { who: "sam", with: "apron", from: 0, to: 10, reason: "the waiter's apron (worn)" },
    { who: "rea", with: "bill", from: 6.0, to: 6.4, reason: "the scythe cuts through the bill he holds up (the cut frame)" },
    ...[0, 1, 2, 3].map((i) => ({ who: "rea", with: `strip${i}`, from: 6.0, to: 6.5, reason: "the strips are cut free from the bill in his hand and fall" })),
    { who: "phx", with: "confetti", from: 2.9, to: 4.6, reason: "confetti rains over everyone" },
    { who: "wiz", with: "confetti", from: 2.9, to: 4.6, reason: "confetti rains over everyone" },
    { who: "vik", with: "confetti", from: 2.9, to: 4.6, reason: "confetti rains over everyone" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/04-split-the-bill/make-split-the-bill.mjs. Panels: PANELS.md.",
});
