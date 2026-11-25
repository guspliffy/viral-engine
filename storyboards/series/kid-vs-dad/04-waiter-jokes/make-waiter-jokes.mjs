// KID VS DAD 04 "Dad jokes at the waiter" (Jonny 25 Nov 2026: options 12:29, starred hook H1 + ending E1 12:34 Berlin,
// panel sheet OK 13:00). Video 2 of the 8-line trial (docs: tiktok-data-study). Jonny's pattern: power word -> 5-word
// question -> rule -> the rule pushed to the extreme, answer teased -> fast end on the punchline.
//   node storyboards/series/kid-vs-dad/04-waiter-jokes/make-waiter-jokes.mjs -> waiter-jokes.json
// Outline: ./OUTLINE.md. Design: ./DESIGN.md (decisions block at its top; floor plan + cameras = section 9).
// Chain: HOOK the war reporter behind a menu: "Danger. A dad is about to order. Will the waiter survive?"; NAME + RULE
// "Tato, age seven... no jokes at the waiter"; Tato begs; JOKE 1 "Where are you taking it?" (rimshot, the pen freezes,
// Tato slides off his chair); JOKE 2 "I've been working out" (Tato down to his eyes); WHY the kitchen door swings: a
// photo of the dad "DO NOT SERVE", the cook prays, "Last time... the waiter quit."; JOKE 3 the dad stands into a
// spotlight: "Like my jokes. Well done." (the tray drops, Tato under the table); END the bill: "TIP: STOP." CUT.
// Counter: Tato sinks one level per joke (seated / chin on the cloth / eyes only / under the table).
// Staging trick (ep 2's kid-at-the-window): a pose a body cannot reach on screen is a second body shown on the cut
// (waiter with pad / with tray / empty-handed; dad seated / standing / holding the bill; Tato per level).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (node qa/lines.mjs kvd04-voice-probe.json), in LINES order
const DUR = [1.97, 1.32, 3.08, 1.86, 1.19, 2.14, 2.15, 1.64, 1.97, 2.68, 1.16, 2.04, 0.76, 2.36, 1.94, 1.09, 1.95, 2.27, 1.02,
  1.69, 1.31, 1.03, 1.68, 1.88];
const RIM = 0.9, SWING = 0.3, STAND = 0.6, DROP = 0.7, UNDER = 1.5, SLAP = 1.6;   // Sol r1 editor: poster hold -0.4 s, man-down hold -0.3 s
//            0     1     2     3     4     5     6     7     8     9           10    11    12          13    14    15
const GAP = [0.1, 0.3, 0.35, 0.3, 0.25, 0.35, 0.3, 0.4, 0.3, 0.3 + RIM, 0.45, 0.3, 0.2 + RIM, 0.25, 0.4, 0.3 + SWING,
  //  16    17    18    19    20            21    22           23
  0.35, 0.45, 0.3, 0.25, 0.25 + STAND, 0.35, 0.3 + DROP, 0.3 + UNDER + SLAP];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const cutAt = (i) => r3(T[i] - 0.05);
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);

// ---------------------------------------------------------------- places (DESIGN section 9; origin = floor under the main table)
const DAD_S = [0.80, -0.26], DAD_S_YAW = -40, DAD_U = [1.05, 0.35], DAD_U_YAW = -25;
const KID = [-0.12, -0.74], KID_YAW = 9;
const W_ORDER = [-0.95, 0.15], W_KID = [-0.80, -0.65];
const REP = [-0.85, -2.50];
const COOK = [-2.6, -4.0];
const REPTABLE = [-0.85, -1.75], B1 = [2.05, -1.85], B2 = [-2.4, 0.9];

const hide = (t, id) => A(onCut(t), id, "hide");
const show = (t, id) => A(onCut(t), id, "show");
const swap = (t, from, to) => { hide(t, from); show(t, to); };

// ---------------------------------------------------------------- cast (one body per pose, shown on the cut)
const cast = [
  { id: "rep", character: "potatobrawl/reporter", at: REP, face: 0, expr: "focused", follow: 0.3, seed: 131.3 },
  { id: "dad", character: "potatobrawl/dad", at: DAD_S, face: DAD_S_YAW, expr: "happy", follow: 0.3, seed: 2.9 },
  { id: "dadU", character: "potatobrawl/dad", at: DAD_U, face: DAD_U_YAW, expr: "happy", follow: 0.3, seed: 2.9 },
  { id: "kid", character: "potatobrawl/spud-kid", at: KID, face: KID_YAW, expr: "kind", follow: 0.3, seed: 4.1 },
  { id: "kid1", character: "potatobrawl/spud-kid", at: KID, face: KID_YAW, expr: "sad", follow: 0.3, seed: 4.1 },
  { id: "kid2", character: "potatobrawl/spud-kid", at: KID, face: KID_YAW, expr: "sad", follow: 0.3, seed: 4.1 },
  { id: "kid3", character: "potatobrawl/spud-kid", at: [-0.10, 0.05], face: 0, expr: "sad", follow: 0.3, seed: 4.1 },
  { id: "w", character: "potatobrawl/mash-waiter", at: [-1.30, -0.50], face: 55, expr: "kind", follow: 0.3, seed: 3.7 },
  { id: "wT", character: "potatobrawl/mash-waiter", at: W_KID, face: 30, expr: "sad", follow: 0.3, seed: 3.7 },
  { id: "cook", character: "potatobrawl/cook", at: COOK, y: 0.52, face: 0, expr: "kind", follow: 0.3, seed: 6.1 },
];
const FACES = {
  reporting: { tilt: -0.08, browY: -0.02, curve: -0.05, eye: 0.95, open: 0 },
  plead: { eye: 1.2, tilt: 0.3, curve: -0.2, open: 0.3 }, sunk: { eye: 1.15, tilt: 0.2, curve: -0.3 },
  nervous: { eye: 1.1, tilt: 0.2, curve: 0.1 }, frozen: { eye: 1.3, pupil: 0.7, curve: -0.1, open: 0.15 },
  proud: { eye: 0.9, curve: 0.9, open: 0.3 }, deflate: { eye: 0.8, tilt: 0.25, curve: -0.3 },
  pray: { eye: 1.1, tilt: 0.3, curve: -0.15 },
};

// ---------------------------------------------------------------- props
const chair = (id, [x, z], rot, o = {}) => ({ id, kind: "hoopchair", x, y: 0, z, rot, ...o });
const table = (id, [x, z], o = {}) => ({ id, kind: "roundtable", x, y: 0, z, r: 0.45, h: 0.38, drape: 0.22, legs: true, ...o });
const MIC = { id: "mic", kind: "newsmic", lean: 25, ...grips.placeFor("newsmic", [-0.62, 0.62, -2.30], 0) };
const PAD = { id: "pad", kind: "spudpad", scale: 0.85, write: 0, ...grips.placeFor("spudpad", [-1.12, 0.50, -0.30], 55) };
const PEN = { id: "pen", kind: "feltpen", color: "#26262b", ...grips.placeFor("feltpen", [-1.00, 0.54, -0.30], 55) };
const TRAY = { id: "tray", kind: "servetray", x: -0.55, y: 0.50, z: -0.42, rot: 30 };
const BILL_A = { id: "billA", kind: "tipbill", x: 0.21, y: 0.392, z: -0.07, rot: -40, tip: -90 };
const BILL_B = { id: "billB", kind: "tipbill", tip: 70, ...grips.placeFor("tipbill", [0.57, 0.47, 0.37], DAD_S_YAW + 20) };
const props = [
  { id: "carpet", kind: "dinecarpet", x: 0.85, y: 0, z: 0.7, w: 8.3, d: 7.4 },
  { id: "carpetN", kind: "dinecarpet", x: 0.85, y: 0.001, z: 0.7, w: 8.3, d: 7.4, dim: 1, scale: 0.001 },
  table("main", [0, 0], { dress: [0.05, -0.15] }),
  table("cheat", [0, 0], { staged: "panel 13 cheat table: legless, its skirt hangs to 0.62 by design", r: 0.80, h: 1.30, drape: 0.68, legs: false, scale: 0.001 }),
  table("tRep", REPTABLE), table("tB1", B1), table("tB2", B2),
  chair("cDad", [0.92, -0.40], -40), chair("cKid", [-0.12, -0.76], 9), chair("cRep", [-0.85, -2.64], 0),
  chair("cB1a", [2.05, -2.60], 0), chair("cB1b", [2.80, -1.85], -90), chair("cB2a", [-2.4, 1.65], 180), chair("cB2b", [-1.65, 0.9], -90),
  { id: "plB1", kind: "mealplate", food: "none", x: 2.05, y: 0.386, z: -2.10 }, { id: "plB2", kind: "mealplate", food: "none", x: -2.4, y: 0.386, z: 1.15 },
  { id: "plMa", kind: "mealplate", food: "none", x: 0.42, y: 0.386, z: -0.10 }, { id: "plMb", kind: "mealplate", food: "none", x: -0.10, y: 0.386, z: -0.40 },
  { id: "menu", kind: "tallmenu", x: REPTABLE[0], y: 0.386, z: -1.92, rot: 0 },
  { id: "door", kind: "kitchendoor", x: -2.6, y: 0, z: -2.97, rot: 0, open: 0 },
  { id: "crate", kind: "crate", size: 0.51, staged: "stands on the nook floor (1 cm: the nook floor sits over the world floor)", x: COOK[0], y: 0, z: COOK[1] },
  { id: "plantA", kind: "bistroplant", x: -1.45, y: 0, z: -2.7 }, { id: "plantB", kind: "bistroplant", x: 3.4, y: 0, z: -2.5 },
  { id: "napkin", kind: "napkin", wear: "kid", w: 0.19, h: 0.16, x: 0, y: 0.34, z: 0.235 },
  { id: "apron", kind: "waiterapron", wear: "w", x: 0, y: 0, z: 0, y0: 0.33, y1: 0.04, rx: 0.255, rz: 0.24, arc: 150, band: "#f4f1ea", bandArc: 360, bow: true },
  { id: "apronT", kind: "waiterapron", wear: "wT", x: 0, y: 0, z: 0, y0: 0.33, y1: 0.04, rx: 0.255, rz: 0.24, arc: 150, band: "#f4f1ea", bandArc: 360, bow: true },
  { id: "toque", kind: "toque", wear: "cook", fit: { H: 0.46, W: 0.50, D: 0.46, taper: 0.02, legH: 0.14 }, h: 0.20 },
  { id: "sweat", kind: "sweatbead", wear: "w", x: -0.165, y: 1.13, z: 0.13, scale: 0 },
  { id: "glassA", kind: "waterglass", fill: 0.8, x: -0.22, y: 0.386, z: -0.30 }, { id: "glassB", kind: "waterglass", fill: 0.8, x: 0.30, y: 0.386, z: 0.12 },
  { id: "beam", kind: "lightbeam", x: DAD_U[0], y: 3.0, z: DAD_U[1], len: 3.0, w: 1.2, color: "#ffe2a8", glow: 0.55, scale: 0.001 },
  { id: "pool", kind: "lightpool", x: DAD_U[0], y: 0.008, z: DAD_U[1], w: 1.5, d: 1.1, color: "#ffe6b0", on: 1, scale: 0.001 },
  MIC, PAD, TRAY, BILL_A, BILL_B,
];

// captions: upper third (the wall band over the windows)
const SUB = 300, SUB0 = 430;
const CAPTEXT = { 0: "*DANGER.* A dad is about to order.", 1: "Will the waiter *survive?*", 2: "*Tato,* age seven, is *hungry.*",
  4: "No jokes *at the waiter.*", 8: "Sure. Where are you *taking it?*", 11: "That's okay. I've been *working out.*",
  15: "He's been here *before.*", 16: "Last time... the waiter *quit.*", 20: "Like my *jokes.*", 21: "*Well done.*",
  23: "*Tip... stop.*" };
const CAPY = { 2: 260, 5: 260, 17: 260 };   // S03: the reporter's eyes sit at 476 px behind Tato
const say = (i, who = LINES[i][0], extra = {}) => {
  const [, line, tone, style, o = {}] = LINES[i];
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.0) - 0.23)));
  cap(T[i], to, CAPTEXT[i] ?? line, CAPY[i] ?? (i === 0 ? SUB0 : SUB), false, { size: 62 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const wear = (t, off, on) => { c.prop(onCut(t), off, { scale: 0.001 }, 0.01); c.prop(onCut(t), on, { scale: 1 }, 0.01); };
const rim = (t) => { sfx(r3(t), "ai/rimshot", { gain: 0.5 }); };

// ---------------------------------------------------------------- frame 0
for (const id of ["dadU", "kid1", "kid2", "kid3", "wT", "cook"]) A(0, id, "hide");
c.prop(0, "apronT", { scale: 0.001 }, 0); c.prop(0, "toque", { scale: 0.001 }, 0);
c.prop(0, "billB", { scale: 0.001 }, 0); c.prop(0, "tray", { scale: 0.001 }, 0);
c.prop(0, "glassA", { scale: 0.001 }, 0); c.prop(0, "glassB", { scale: 0.001 }, 0);
A(0, "dad", "sit", { seat: "cDad", dur: 0, hands: "lap" });
A(0, "kid", "sit", { seat: "cKid", dur: 0, hands: "lap" });
A(0, "rep", "sit", { seat: "cRep", dur: 0, hands: "keep" });
const gm = grips.mug(c, "rep", MIC, { side: "R" }); gm.take(0, { reach: 0.01, settle: 0.01 });
arm(0, "rep", "L", { prop: "menu", grip: [-0.10, 0.30, -0.06] }, 0.01);
const gp = grips.phone(c, "w", PAD, { side: "L", height: 0.2 }); gp.take(0, { reach: 0.01, settle: 0.01 });

const gt = grips.box(c, "wT", TRAY, { gap: 0.03 }); gt.take(0, { reach: 0.01, settle: 0.01 });   // held from frame 0 (wT is hidden till 06)
expr(0, "rep", FACES.reporting, 0.01); expr(0, "w", FACES.nervous, 0.01); expr(0, "dad", "happy", 0.01); expr(0, "kid", FACES.plead, 0.01);
expr(0, "cook", FACES.pray, 0.01);
// the cook: palms together, praying, at the porthole
arm(0, "cook", "L", { o: [-0.19, 0.44, 0.31] }, 0.01); arm(0, "cook", "R", { o: [-0.19, 0.44, 0.31] }, 0.01);   // Sol r1 #14: palms up in the porthole
grip(0, "cook", "L", "flat", 0.01); grip(0, "cook", "R", "flat", 0.01);
look(0, "dad", [-0.6, 0.15], 0.01); look(0, "kid", [0.8, 0.1], 0.01);
// the waiter walks up to the table with his pad, one bead of sweat on the way
A(0.05, "w", "walk", { to: W_ORDER, dur: 0.9 }); A(0.95, "w", "turn", { to: 55, dur: 0.2 });
c.prop(0.3, "sweat", { scale: 1 }, 0.01); c.prop(0.35, "sweat", { y: 0.97 }, 1.1, "in"); c.prop(1.5, "sweat", { scale: 0 }, 0.01);
see(0, END_OF(1), ["w.face", "dad.face", "kid.face"], "a nervous waiter walks up to a table: a big dad grinning, his small son begging him with his eyes");

// ---------------------------------------------------------------- 0-5 s HOOK
say(0);                  // Danger. A dad is about to order.
say(1);                  // Will the waiter survive?   (02: the reporter behind the menu)
// ---------------------------------------------------------------- 5-14 s NAME + RULE, Tato begs
say(2);                  // We're live. Tato, age seven, is hungry.  (03 Tato)
arm(r3(T[2] + 0.4), "kid", "L", { o: [-0.24, 0.27, 0.31] }, 0.3); arm(r3(T[2] + 0.4), "kid", "R", { o: [-0.24, 0.27, 0.31] }, 0.3);   // Sol r1 #16: palms together at the chest (o[0] adds to the body radius: negative brings the hands in)
grip(r3(T[2] + 0.5), "kid", "L", "flat"); grip(r3(T[2] + 0.5), "kid", "R", "flat");
say(3); say(4);
look(r3(T[5] - 0.2), "kid", [0.9, 0.2], 0.15);
say(5);                  // Dad. Please. Just order.
expr(r3(T[6] - 0.15), "dad", FACES.proud, 0.15); look(r3(T[6] - 0.1), "dad", [-0.9, 0.1], 0.15);
say(6);                  // Relax. I'm always normal.
// ---------------------------------------------------------------- JOKE 1
look(r3(T[7] - 0.2), "dad", [-0.5, 0.35], 0.15); expr(r3(T[7] - 0.1), "w", "kind", 0.1);
say(7);                  // Hi. Can I take your order?
arm(r3(T[8] - 0.35), "dad", "R", { o: [0.15, 0.85, 0.35] }, 0.3); grip(r3(T[8] - 0.25), "dad", "R", "point");
expr(r3(T[8] - 0.1), "dad", FACES.proud, 0.1);
say(8);                  // Sure. Where are you taking it?
const R1 = r3(END_OF(8) + 0.1); rim(R1);
expr(R1, "w", FACES.frozen, 0.08); A(R1, "w", "squash", { amount: 0.03, dur: 0.1 });
arm(r3(R1 + 0.4), "dad", "R", "rest", 0.3);
// 05: on the cut Tato is off his chair, chin on the cloth (L1)
const C05 = r3(R1 + 0.25);
swap(C05, "kid", "kid1"); c.prop(onCut(C05), "cKid", { x: -0.14, z: -1.19 }, 0.01);
c.prop(onCut(C05), "napkin", { scale: 0.001 }, 0.01);   // Sol r1 #2: the worn napkin stayed at seated height and covered his face once he sank
expr(C05, "kid1", FACES.sunk, 0.01); look(C05, "kid1", [0.9, 0.35], 0.01);
say(9);                  // First joke. The waiter is still standing.
// ---------------------------------------------------------------- JOKE 2 (06: the waiter is back with the drinks, late)
const C06 = cutAt(10);
swap(C06, "w", "wT"); wear(C06, "apron", "apronT");
// Sol r1 #5: the glasses arrive on the tray (06) and stand on the table from the next cut (07)
c.prop(onCut(C06), "glassA", { scale: 1, x: -0.505, y: 0.508, z: -0.342 }, 0.01); c.prop(onCut(C06), "glassB", { scale: 1, x: -0.595, y: 0.508, z: -0.498 }, 0.01);   // on the tray's front-back line, away from both arms
c.prop(r3(C06 - 0.4), "tray", { scale: 1 }, 0.01);   // grown before the cut (behind the S02 camera), so his hands do not turn as it grows on screen
gp.release(onCut(C06), { back: 0.01 });

expr(C06, "wT", FACES.nervous, 0.01); A(r3(T[10]), "wT", "face", { lid: 0.7, dur: 0.2 });   // no bow: a lean with the box hold turned his left palm 96° in 3 frames
say(10, "wT");           // Sorry for the wait.
A(r3(END_OF(10) + 0.1), "wT", "face", { lid: 0, dur: 0.2 });
// Sol r1 #17: one hand on the belly, three pats on "working out"
arm(r3(T[11] - 0.3), "dad", "R", { o: [-0.15, 0.32, 0.42] }, 0.3); grip(r3(T[11] - 0.2), "dad", "R", "flat");
for (const d of [0.5, 0.9, 1.3]) {
  arm(r3(T[11] + d - 0.14), "dad", "R", { o: [-0.15, 0.33, 0.46] }, 0.12); arm(r3(T[11] + d - 0.02), "dad", "R", { o: [-0.15, 0.32, 0.42] }, 0.12, "in");
  A(r3(T[11] + d), "dad", "squash", { amount: 0.03, dur: 0.1 }); A(r3(T[11] + d + 0.12), "dad", "squash", { amount: 0, dur: 0.15 });
}
expr(r3(T[11] - 0.1), "dad", FACES.proud, 0.1);
say(11);                 // That's okay. I've been working out.
const R2 = r3(END_OF(11) + 0.1); rim(R2);
arm(r3(R2 + 0.3), "dad", "L", "rest", 0.3); arm(r3(R2 + 0.3), "dad", "R", "rest", 0.3);
// 07: Tato down to his eyes (L2)
const C07 = r3(R2 + 0.3);
c.prop(onCut(C07), "glassA", { x: -0.38, y: 0.386, z: -0.05 }, 0.01); c.prop(onCut(C07), "glassB", { x: 0.30, y: 0.386, z: 0.12 }, 0.01);   // off his eye line in 07
swap(C07, "kid1", "kid2"); A(onCut(C07), "kid2", "crouch", { to: 0.07, dur: 0.01 }); expr(C07, "kid2", FACES.sunk, 0.01); look(C07, "kid2", [0.6, 0.6], 0.01);
say(12, "kid2");         // Dad...
hide(cutAt(13), "wT"); c.prop(onCut(cutAt(13)), "tray", { scale: 0.001 }, 0.01);   // Sol r1 #1: the S02 lens sat inside him (a brown screen 30-33 s)
say(13);                 // He's sinking. Tato is sinking.
// ---------------------------------------------------------------- WHY THE RULE EXISTS: the door swings, the photo, the cook
const C08 = cutAt(14);
c.prop(r3(T[14] + 0.2), "door", { open: 0.9 }, 0.35, "out"); c.prop(r3(T[14] + 0.6), "door", { open: 0.7 }, 0.3, "inOut");   // 0.18 s read as a one-frame pop
c.prop(0, "crate", { scale: 0.001 }, 0);   // the cook's crate only under the cook (09): an empty crate in the nook in 08 begs a question
say(14);                 // Wait. What's on that wall?
say(15);                 // He's been here before.
c.prop(r3(END_OF(15) + 0.05), "door", { open: 0 }, 0.3, "inOut");   // Sol r1 #13: it swings shut before the porthole shot
const C09 = cutAt(16);
show(C09, "cook"); for (const p of ["toque", "crate"]) { c.prop(onCut(C09), p, { scale: 1 }, 0.01); c.prop(onCut(cutAt(17)), p, { scale: 0.001 }, 0.01); } hide(cutAt(17), "cook");
say(16);                 // Last time... the waiter quit.  (09 the cook prays at the porthole)
c.prop(onCut(C09), "door", { open: 0 }, 0.01);   // closed for the porthole shot
// ---------------------------------------------------------------- JOKE 3 (10: the waiter shields himself with the pad)
const C10 = cutAt(17);
swap(C10, "wT", "w"); wear(C10, "apronT", "apron"); c.prop(onCut(C10), "tray", { scale: 0.001 }, 0.01);
gp.take(onCut(C10), { reach: 0.01, settle: 0.01 });
A(onCut(C10), "w", "turn", { to: 55, dur: 0.01 }); A(onCut(C10), "w", "lean", { to: -10, dur: 0.01 });
expr(C10, "w", FACES.frozen, 0.01);
say(17, "w");            // And... how would you like your steak?
say(18, "kid2");         // Dad, no.
// the dad stands (on the reporter's line: cut to the spotlight)
say(19);                 // He's standing up. He's standing up!
const C11 = r3(END_OF(19) + 0.15);
swap(C11, "dad", "dadU"); c.prop(onCut(C11), "carpet", { scale: 0.001 }, 0.01); c.prop(onCut(C11), "carpetN", { scale: 1 }, 0.01);
c.prop(onCut(C11), "beam", { scale: 1 }, 0.01); c.prop(onCut(C11), "pool", { scale: 1 }, 0.01);
for (const id of ["w", "kid2"]) hide(C11, id); c.prop(onCut(C11), "apron", { scale: 0.001 }, 0.01);
expr(C11, "dadU", FACES.proud, 0.01); look(C11, "dadU", [-0.3, 0.3], 0.01);
arm(r3(C11 + 0.2), "dadU", "R", { o: [0.35, 1.05, 0.25] }, 0.45, "out"); grip(r3(C11 + 0.4), "dadU", "R", "flat");
say(20, "dadU");         // Like my jokes.
A(r3(END_OF(20) + 0.1), "dadU", "face", { lid: 0.85, dur: 0.15 });
say(21, "dadU");         // Well done.
const R3 = r3(END_OF(21) + 0.05); rim(R3);
// 12: lights back, the tray drops, the glass flies
const C12 = r3(R3 + 0.25);
c.prop(onCut(C12), "carpetN", { scale: 0.001 }, 0.01); c.prop(onCut(C12), "carpet", { scale: 1 }, 0.01);
c.prop(onCut(C12), "beam", { scale: 0.001 }, 0.01); c.prop(onCut(C12), "pool", { scale: 0.001 }, 0.01);
hide(C12, "w"); show(C12, "wT"); wear(C12, "apron", "apronT");   // Sol r1 #3: no kid2: Tato went under in the dark
c.prop(onCut(C12), "tray", { scale: 1 }, 0.01); gp.release(onCut(C12), { back: 0.01 });
expr(C12, "wT", FACES.frozen, 0.01);
// the tray lands on the cut while he is hidden (his hands go straight to rest): any on-screen release turned his palms
// 60-90° in 2 frames and pulled the hands to the floor; the clang on the cut sells the drop
A(r3(onCut(C12) - 0.1), "wT", "release", { prop: "tray", dur: 0, to: [-0.62, 0, -0.12] });   // Sol r1 #9: open floor at his feet
for (const s of ["L", "R"]) { arm(r3(onCut(C12) - 0.09), "wT", s, "rest", 0.01); grip(r3(onCut(C12) - 0.09), "wT", s, "relaxed", 0.01); } sfx(r3(C12), "ai/snare-hit", { gain: 0.3 });   // the tray hits the floor (PLACEHOLDER sound)
A(r3(C12 + 0.2), "rep", "crouch", { to: 0.3, dur: 0.25 }); A(r3(T[22] + 0.9), "rep", "crouch", { to: 0.12, dur: 0.2 });   // Sol r1 #15: ducks on the first call
say(22);                 // Man down! Man down!
// 13: under the table (the cheat): Tato curled up, hands over his face; the dad's sandals at the edge
const C13 = r3(END_OF(22) + 0.2);
c.prop(onCut(C13), "main", { scale: 0.001 }, 0.01); c.prop(onCut(C13), "cheat", { scale: 1 }, 0.01);
for (const id of ["cKid", "cDad"]) c.prop(onCut(C13), id, { scale: 0.001 }, 0.01);
for (const id of ["kid2", "wT"]) hide(C13, id); show(C13, "kid3");
for (const id of ["tray", "glassA", "glassB", "plMa", "plMb", "apronT", "billA"]) c.prop(onCut(C13), id, { scale: 0.001 }, 0.01);
arm(onCut(C13), "dadU", "R", "rest", 0.01); grip(onCut(C13), "dadU", "R", "relaxed", 0.01);
A(onCut(C13), "dadU", "move", { to: [0.77, -0.05], dur: 0.01, steps: 0, ease: "linear", sync: true });
A(onCut(C13), "kid3", "sit", { dur: 0, hands: "lap", height: 0.01 });
arm(onCut(C13), "kid3", "L", { o: [-0.20, 0.55, 0.32] }, 0.01); arm(onCut(C13), "kid3", "R", { o: [-0.20, 0.55, 0.32] }, 0.01);   // Sol r1 #4: palms over his face
A(onCut(C13), "kid3", "lean", { to: 14, dur: 0.01 });
grip(onCut(C13), "kid3", "L", "flat", 0.01); grip(onCut(C13), "kid3", "R", "flat", 0.01);
expr(C13, "kid3", { curve: -0.4 }, 0.01);
// 14: back to the room, the dad seated again; the waiter slaps the bill down and walks off fast
const C14 = r3(C13 + UNDER);
c.prop(onCut(C14), "cheat", { scale: 0.001 }, 0.01); c.prop(onCut(C14), "main", { scale: 1 }, 0.01);
for (const id of ["cKid", "cDad"]) c.prop(onCut(C14), id, { scale: 1 }, 0.01);
hide(C14, "kid3"); hide(C14, "dadU"); show(C14, "dad"); show(C14, "w"); c.prop(onCut(C14), "apron", { scale: 1 }, 0.01);
for (const id of ["glassA", "glassB", "plMa", "plMb", "billA"]) c.prop(onCut(C14), id, { scale: 1 }, 0.01);
A(r3(C13 + 0.2), "dad", "turn", { to: -20, dur: 0.01 });   // turned while hidden: on the cut it flipped his palm expr(C14, "dad", FACES.proud, 0.01);
c.prop(onCut(C14), "pad", { scale: 0.001 }, 0.01);
arm(onCut(C14), "w", "L", "rest", 0.01); arm(onCut(C14), "w", "R", "rest", 0.01); look(r3(C14 + 0.1), "w", [-0.8, 0], 0.12);
A(onCut(C14), "w", "move", { to: W_KID, dur: 0.01, steps: 0, ease: "linear", sync: true });
A(onCut(C14), "w", "turn", { to: 210, dur: 0.01 });   // Sol r1 #7: walking off from the first frame (a turn on screen jumped his elbows)
A(r3(C14 + 0.08), "w", "walk", { to: [-1.5, -1.0], dur: 0.55 }); A(r3(C14 + 0.63), "w", "walk", { to: [-2.6, -2.4], dur: 0.7 });
sfx(r3(C14 + 0.12), "ai/snare-hit", { gain: 0.2 });   // the tray slapped down (PLACEHOLDER sound)

// 15: the bill in his hand: TIP: STOP.
const C15 = cutAt(23);
c.prop(onCut(C15), "billA", { scale: 0.001 }, 0.01); c.prop(onCut(C15), "billB", { scale: 1 }, 0.01);
const gb = grips.phone(c, "dad", BILL_B, { side: "R", height: 0.40, flat: false }); gb.take(onCut(C15), { reach: 0.01, settle: 0.01 });
look(C15, "dad", [0.1, -0.95], 0.01);   // Sol r1 #6: eyes on the bill expr(C15, "dad", FACES.proud, 0.01);
expr(r3(T[23] + 0.2), "dad", FACES.deflate, 0.5); A(r3(T[23] + 0.2), "dad", "face", { lid: 0.4, dur: 0.4 });
A(r3(T[23] + 0.3), "dad", "squash", { amount: 0.03, dur: 0.5 });
say(23);                 // Tip... stop.
const END = F(END_OF(23) + 0.5);
see(C15, END, ["dad.face", "billB"], "the dad reads the bill: TIP: STOP.");

// ---------------------------------------------------------------- cameras (DESIGN section 9): every shot moves
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const S01 = { pos: [-0.1, 1.15, 4.7], look: [-0.1, 0.72, -0.4], fov: 45 };
const S02 = { pos: [-0.85, 0.90, -0.40], look: [-0.85, 0.86, -2.3], fov: 46 };   // Sol r1 #18: his helmet top at 506 px, captions above it
const S03 = { pos: [1.0, 0.95, 1.6], look: [-0.12, 0.56, -0.74], fov: 30 };
const S04 = { pos: [-0.25, 0.95, 4.9], look: [-0.22, 0.78, 0], fov: 50 };   // Sol r1 #12: the waiter at 190 px, not on the edge
const S05 = { pos: [-0.25, 1.0, 3.0], look: [-0.6, 0.75, -0.3], fov: 44 };   // camfit 21 s: waiter left, Tato right
const S07 = { pos: [-0.40, 0.44, 1.5], look: [-0.40, 0.52, -0.5], fov: 40 };
const S08 = { pos: [-2.85, 0.98, 0.60], look: [-2.45, 0.85, -4.5], fov: 26 };
const S09 = { pos: [-2.6, 1.02, -1.7], look: [-2.6, 0.94, -3.0], fov: 36 };
const S10 = { pos: [0.9, 1.1, 2.2], look: [-0.7, 0.85, 0.0], fov: 46 };   // Sol r1 #8: a clean single of the waiter and his pad (dad off frame)
const S11 = { pos: [-0.55, 0.85, 3.3], look: [1.05, 0.72, 0.35], fov: 36 };
const S12 = { pos: [0.15, 0.95, 2.6], look: [-0.9, 0.60, -0.6], fov: 40 };
const S13 = { pos: [0.05, 0.30, 2.5], look: [-0.05, 0.24, 0], fov: 30 };   // Sol r1 #4/#11: tighter, the dad out of frame, less of the cloth's underside
const S14 = { pos: [1.6, 1.0, 3.2], look: [0.0, 0.62, -0.47], fov: 50 };
const S15 = { pos: [0.28, 1.30, 1.95], look: [0.66, 0.80, 0.10], fov: 38 };   // Sol r1 #10: eyes 29 % down, caption clear above them   // camfit 55.6 s: his eyes 26 % down, the bill below
const S15e = { pos: [0.30, 1.28, 1.85], look: [0.66, 0.79, 0.10], fov: 38 };
const beats = c.beats([
  ["danger", 0, push(S01, 0.06, DUR[0] + 0.3), "hook"],
  ["survive", cutAt(1), push(S02, 0.06, DUR[1] + 0.4)],
  ["tato", cutAt(2), push(S03, 0.07, DUR[2] + 0.4)],
  ["one rule", cutAt(3), push(S02, 0.08, DUR[3] + 0.3)],
  ["no jokes", cutAt(4), push(S04, 0.05, DUR[4] + 0.3)],
  ["please", cutAt(5), push(S03, 0.08, DUR[5] + 0.3)],
  ["normal", cutAt(6), push(S04, 0.05, DUR[6] + 0.4)],
  ["order", cutAt(7), push(S04, 0.07, DUR[7] + DUR[8] + 0.6), "escalation"],
  ["frozen", C05, push(S05, 0.06, r3(T[9] - C05))],
  ["still standing", cutAt(9), push(S02, 0.06, DUR[9] + 0.3)],
  ["wait", C06, push(S04, 0.07, DUR[10] + DUR[11] + 0.8)],
  ["sinking", C07, push(S07, 0.05, r3(END_OF(12) + 0.2 - C07))],
  ["sinking rep", cutAt(13), push(S02, 0.07, DUR[13] + 0.2)],
  ["the wall", C08, push(S08, 0.05, DUR[14] + DUR[15] + SWING + 0.8)],
  ["the cook", C09, push(S09, 0.08, DUR[16] + 0.4)],
  ["steak", C10, push(S10, 0.06, DUR[17] + 0.4)],
  ["dad no", cutAt(18), push(S07, 0.06, DUR[18] + 0.25)],
  ["standing", cutAt(19), push(S02, 0.08, DUR[19] + 0.15)],
  ["spotlight", C11, push(S11, 0.08, r3(R3 + 0.25 - C11)), "reveal"],
  ["man down", C12, push(S12, 0.05, r3(C13 - C12))],
  ["under", C13, push(S13, 0.05, UNDER)],
  ["the bill", C14, push(S14, 0.05, r3(C15 - C14))],
  ["tip stop", C15, { ...S15, to: S15e, dur: 1.0, ease: "inOut" }, "payoff"],
], END);

write(import.meta.url, {
  id: "waiter-jokes",
  title: "Dad jokes at the waiter",
  idea: "Kid vs Dad 04: a war reporter covers a dad ordering at a restaurant like a war: one rule, no jokes at the waiter. Three dad jokes, each worse, the kid sinks under the table, a DO NOT SERVE photo of the dad in the kitchen, and the bill comes back: TIP: STOP.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1230], captionStyle: "kinetic",
  captionOverBody: { reason: "close shots where the speaker fills the phone frame; captions sit in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#efe2c8", floor: "#7b4650", light: "golden", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    plate: { src: "assets/plates/eatery-day.png", z: -3.0, center: [1.0, 1.45], height: 5.2, depth: false, motion: false, dust: 8,
      swaps: [{ at: onCut(C11), src: "assets/plates/eatery-day.night.png" }, { at: onCut(C12), src: "assets/plates/eatery-day.png" }] },
    plates: [{ src: "assets/plates/eatery-day.png", center: [-3.3, 1.45], z: 0.4, height: 5.2, turn: 90 }],
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: { news: { label: "WAITER IN DANGER", tag: "LIVE", tagW: 150, count: false, show: [0.2, onCut(C15)] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.08, guard: true, signature: false, surface: "wood" },
  creative: { length: [60, 95] },
  hook: { show: ["w", "dad"], hint: 0, what: "a nervous waiter walks up to a table where a big dad grins and his son begs him not to; a war reporter hides behind a menu" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...[["dad", "cDad"], ["kid", "cKid"], ["rep", "cRep"], ["cook", "crate"], ["kid3", "cheat"]].map(([who, w]) => ({ who, with: w, from: 0, to: END, reason: "sitting on the chair / standing on the crate / under the cheat table" })),
    ...[["w", "apron"], ["wT", "apronT"]].map(([who, w]) => ({ who, with: w, from: 0, to: END, checks: ["clipping", "arm-in-prop"], reason: "his own worn apron wraps his body; the pad arm brushes its front (3 cm, the apron cloth)" })),
    { who: "kid3", with: "kid3", from: onCut(C13), to: onCut(C14), checks: ["face-covered"], reason: "under the table he hides his face in his hands: the point of the shot (Sol r1 #4); no line, his curled body reads" },
    { who: "cook", with: "cook", from: onCut(C09), to: onCut(C10), checks: ["face-covered"], reason: "praying palms raised to his chin in the porthole (Sol r1 #14): the draft still shows both eyes over the fingertips" },
    { who: "wT", with: "glassB", from: onCut(C06), to: onCut(C07), checks: ["arm-in-prop"], reason: "the glass stands on the tray he carries; his left forearm brushes its far side by 3 cm, behind the glass from the lens" },
    { who: "dadU", with: "cheat", from: onCut(C13), to: onCut(C14), checks: ["shell", "clipping"], reason: "panel 13 cheat: the dad stands across the cheat table's skirt, only his legs and belly show under the hem" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/04-waiter-jokes/make-waiter-jokes.mjs. Tray-slap sound is a placeholder (snare-hit).",
});
