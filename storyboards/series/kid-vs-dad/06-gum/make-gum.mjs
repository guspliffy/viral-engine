// KID VS DAD 06 "Swallowed gum glues your stomach" (Jonny 25 Nov 2026: hook H1 + ending E1 12:34 Berlin, panel sheet
// kid-vs-dad-06-panels-v1.png "looks good" 13:00).
//   node storyboards/series/kid-vs-dad/06-gum/make-gum.mjs -> gum.json
// Outline: OUTLINE.md here. Design: DESIGN.md here (marks = section 4, holds = section 5, faces = section 1).
// Chain: Tato blows a bubble, it pops, he gulps, so Dad freezes in the doorway ("Swallowed. Don't. Move."), so the
// reporter goes live with the house rule (swallowed gum glues your stomach shut, seven years) and Dad sets the egg timer
// to dinner (if it's glued, nothing goes down), so Dad treats Tato like a bomb, gear growing each step: oven mitts and a
// glass on the tummy (a gurgle, "It's sticking", but the gurgle was Dad's own), a colander helmet and tongs on the
// sweater's "wires" (Tato offers Dad a gum, Dad flinches like it's a snake: "He's been through this before"), full
// laundry-basket armour and the pot-lid shield for the dinner test, so Tato eats one spoon, nothing happens, he burps,
// the timer rings: "Still works." "Impossible." so the reporter holds up Dad's X-ray: a gum ball inside, "DAD 1995".
// "...That's different." CUT.
// Counters (nothing written): Dad's gear grows on cuts and never comes off; the egg timer's red wedge shrinks.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";
import { GUM_GUARD } from "../../../../engine/page/props-gum.js";
const GUARD = { o: GUM_GUARD.o, elbow: GUM_GUARD.elbow };

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (node qa/lines.mjs kvd06-voice-probe.json; line 3 = take 1 measured on gum.json), in LINES order
const DUR = [3.02, 1.77, 3.15, 7.99, 3.64, 0.80, 1.18, 2.32, 1.21, 0.83, 2.42, 1.08, 0.94, 1.23, 1.41, 2.40, 3.56, 1.03, 1.07, 1.84, 1.24];
// beats between lines (seconds of action before line i)
const HOOK = 0.85, MITTS = 1.5, GURGLE = 1.0, OWN = 0.9, HELMET = 0.7, SNIP = 0.75, OFFER = 0.4, ARMOUR = 1.4, SPOONG = 0.3,
  CHEW = 4.15, IMPOSS = 0.35, FILM = 0.5, HOLD = 0.5;   // Sol r1: helmet -0.5, armour -0.1 (+0.6 timer insert), cut 0.5 s after the last line
const GAP = [HOOK, 0.3, 0.45, 0.3, 0.45, 0.45, MITTS + GURGLE, 0.3 + OWN, 0.25, 0.4, HELMET, 0.35 + SNIP, 0.55 + OFFER, 0.15,
  0.5, ARMOUR, SPOONG, CHEW, IMPOSS, 0.5, FILM];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const cutAt = (i) => r3(T[i] - 0.05);
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);

// ---------------------------------------------------------------- marks (DESIGN section 4)
const DAD_DOOR = [4.75, -1.75], DAD_O = [-0.89, 0.20], DAD_FLINCH = [-1.15, 0.20], DAD_E = [-1.05, -0.32];
const REP_B = [-3.80, -1.22], REP_C = [-2.15, -0.20], REP_3 = [-2.0, 0.50];   // rep3 nearer Dad (Sol r1: out of frame)
const TATO_S = [-0.10, -0.30], TATO_U = [-0.12, 0.25], U_YAW = 40;   // Tato stands on the table for the bomb squad (lying read badly, 25 Nov stills)
const TABLE = { id: "table", kind: "kitchentable", x: 0.16, y: 0, z: 0.35, rot: 0, w: 1.0, d: 0.8, h: 0.32, runner: [0.01, 0.01] };
const TOP = 0.32;

// ---------------------------------------------------------------- cast: one Tato per pose, swapped on cuts (as ep 2)
const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: TATO_S, face: 0, expr: "kind", seed: 4.1 },
  { id: "spudU", character: "potatobrawl/spud-kid", at: TATO_U, y: TOP, face: U_YAW, expr: "kind", seed: 4.1 },
  { id: "dad", character: "potatobrawl/dad", at: DAD_DOOR, face: -25, expr: "deadpan", seed: 2.9 },
  { id: "rep", character: "potatobrawl/reporter", at: REP_B, face: 30, follow: 0.3, seed: 131.3 },
  { id: "rep2", character: "potatobrawl/reporter", at: REP_C, face: 20, follow: 0.3, seed: 131.3 },
  { id: "rep3", character: "potatobrawl/reporter", at: REP_3, face: 20, follow: 0.3, seed: 131.3 },
];
const FACES = {
  bubble: { eye: 1.15 }, popped: { eye: 0.8, tilt: 0.2, browY: 0.04 },
  frozen: { eye: 1.25, pupil: 0.7, tilt: 0.1, browY: 0.04, curve: -0.15, open: 0.1 },
  gulp: { eye: 1.5, pupil: 0.6, browY: 0.05, curve: -0.1, open: 0.5 },
  shaken: { eye: 1.1, pupil: 0.75, tilt: 0.2, curve: -0.2 },
  surgeon: { eye: 0.8, tilt: -0.22, browY: -0.03, curve: -0.25 }, patient: { eye: 0.75, curve: 0.1 },
  squint: { eye: 0.5, tilt: -0.15, curve: -0.2 }, sticking: { eye: 1.2, pupil: 0.75, tilt: 0.2, browY: 0.03, curve: -0.3 },
  fine: { eye: 1.15, pupil: 0.8, tilt: 0.05, browY: 0.05, curve: 0 }, suspicious: { eye: 0.7, tilt: -0.18, curve: -0.1 },
  wires: { eye: 0.75, tilt: -0.25, browY: -0.03, curve: -0.3 }, flat: { eye: 0.6, tilt: -0.05, browY: -0.02, curve: -0.05 },
  snake: { eye: 1.3, pupil: 0.6, tilt: 0.3, browY: 0.06, curve: -0.4, open: 0.3 }, offer: { eye: 1.2, browY: 0.04, curve: 0.45 },
  aside: { eye: 0.8, tilt: -0.1, curve: 0.05, smirk: 0.25 },
  armour: { eye: 0.7, tilt: -0.2, curve: -0.3 }, spoonwait: { eye: 1.2, pupil: 0.8, open: 0.4 },
  chew: { eye: 0.75, curve: 0.2 }, overlid: { eye: 1.1, pupil: 0.75, tilt: 0.25, browY: 0.03 }, peek: { eye: 1.15, pupil: 0.75, tilt: 0.15 },
  impossible: { eye: 1.2, pupil: 0.8, tilt: 0.1, browY: 0.05, curve: -0.1, open: 0.1 },
  caught: { eye: 1.0, pupil: 0.75, tilt: 0.3, browY: 0.02, curve: -0.15 }, proof: { eye: 0.85, tilt: -0.25, browY: -0.03, curve: -0.15 },
};

// ---------------------------------------------------------------- props
const GLASS_AT = [-0.35, 0.70, 0.52];   // belly height (Sol r2: it read at the shoulder)
const GLASS = { id: "glass", kind: "waterglass", scale: 0.001, fill: 0, x: GLASS_AT[0], y: GLASS_AT[1], z: GLASS_AT[2], rot: U_YAW, tip: 90, staged: "Dad's mitt presses it to Tato's tummy (a doctor's listening glass)" };
const TONGS = { id: "tongs", kind: "hptongs", len: 0.45, open: 0.6, x: -0.86, y: 0.48, z: 0.68, rot: 90, tip: -10, scale: 0.001, staged: "Dad's mitt follows the tongs (rigid, DESIGN 5)" };
const SPOON = { id: "spoon", kind: "tablespoon", food: 1, fk: 0, x: -0.16, y: 0.50, z: 0.12, rot: 90, tip: -90, scale: 0.001, staged: "Dad's mitt follows the spoon (rigid, DESIGN 5)" };
const LID = { id: "lid", kind: "potlid", x: -1.50, y: 0.62, z: 0.55, rot: 20, scale: 0.001, staged: "Dad's right mitt follows the lid (rigid, DESIGN 5)" };
const FILMP = { id: "film", kind: "xrayfilm", x: -1.65, y: 0.05, z: 0.24, rot: 200 };   // lower: off the reporter's eye (Sol r1)
const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", [-3.58, 0.22, -0.99], 30) };   // near hand, chest height: in view of the cover camera (Sol r1: no mic)
const MIC3 = { id: "mic3", kind: "newsmic", lean: 35, ...grips.placeFor("newsmic", [-1.71, 0.38, 0.71], 20) };   // left hand, toward Dad (preflight: the right hand crossed his eyes)
const props = [
  TABLE,
  { id: "chair", kind: "chair", x: -0.10, z: -0.32, rot: 0, scale: 0.6 },
  { id: "door", kind: "doorway", x: 4.75, y: 0, z: -2.25, w: 1.3, h: 1.9 },
  { id: "shelf1", kind: "wallshelf", x: -1.75, y: 1.35, z: -2.25, staged: "fixed to the back wall" },
  { id: "shelf2", kind: "wallshelf", x: 3.30, y: 1.35, z: -2.25, staged: "fixed to the back wall" },
  { id: "bowl", kind: "soupbowl", scale: 0.001, x: 0.16, y: TOP, z: 0.20, soupHi: "#f6ebc6", soup: "#efdfa8", soupLo: "#dcc888" },
  { id: "timer", kind: "eggtimer", x: -0.20, y: TOP, z: 0.62, rot: 20, togo: 0, ring: 0 },
  { id: "bubble", kind: "gumbubble", wear: "spud", x: 0, y: 0, z: 0, blow: 0.4, pop: 0, stuck: 1 },
  { id: "gum", kind: "gumstick", x: -0.39, y: 0.76, z: 0.48, rot: 0, scale: 0.001, staged: "pinched in Tato's fingers (DESIGN 5)" },
  { id: "mitts", kind: "ovenmitts", wear: "dad", x: 0, y: 0, z: 0, on: 0 },
  { id: "colander", kind: "colanderhat", wear: "dad", x: 0, y: 1.07, z: 0, tip: -5, rot: 6, scale: 0.001 },
  { id: "basket", kind: "basketarmour", wear: "dad", x: 0, y: 0.20, z: 0, scale: 0.001 },
  { id: "sweat", kind: "sweatbead", wear: "dad", x: -0.15, y: 1.0, z: 0.33, scale: 0 },
  GLASS, TONGS, SPOON, LID, FILMP, MIC, MIC3,
];

// ---------------------------------------------------------------- helpers
const SUB = 300, LABY = 250;
const CAPTEXT = {
  0: "*Swallowed.* Don't. Move.", 1: "Swallowed. *Is it deadly?*", 2: "*Tato,* age seven, *swallowed his gum.*",
  4: "If it's glued, *nothing goes down.*", 6: "It's *sticking.*",
  7: "Sir... that was *your* stomach.", 10: "*Red wire...* or *blue wire?*", 13: "*Get that away* from me!",
  14: "He's been through this *before.*", 15: "The moment *of truth.*", 16: "*Slowly...* slowly...", 17: "*Still works.*",
  19: "Then what... *is this?*", 20: "...That's *different.*",
};
const CAPY = { 0: 470, 1: 470 };
// line 3 in three captions (Sol r1: 'one rule' and 'For seven years' were missing); offsets from T[3], estimated from the take
const CAP3 = [[0, 2.9, "And in this house, there is *one rule:*"], [2.9, 6.6, "swallow your gum, and your stomach *glues shut.*"], [6.6, null, "*For seven years.*"]];
const WHO = { 7: "rep3", 11: "spudU", 12: "spudU", 19: "rep2" };
const say = (i, extra = {}) => {
  const [who0, line, tone, style, o = {}] = LINES[i]; const who = WHO[i] ?? who0;
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.0) - 0.23)));
  if (i === 3) for (const [a, b, txt] of CAP3) cap(r3(T[i] + a), b == null ? to : r3(T[i] + b), txt, SUB, false, { size: 62 });
  else cap(T[i], to, CAPTEXT[i] ?? line, CAPY[i] ?? SUB, false, { size: 62 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const place = (t, who, at, yaw, y) => { const a = onCut(t); A(a, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(a, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const show = (t, id, s = 1) => c.prop(onCut(t), id, { scale: s }, 0.01, "linear");
const put = (t, id, xyz, extra = {}) => c.prop(onCut(t), id, { x: xyz[0], y: xyz[1], z: xyz[2], scale: SCALE[id] ?? 1, ...extra }, 0.01, "linear");
const SCALE = { glass: 1.3, bowl: 0.75 };
const hide = (t, id) => c.prop(onCut(t), id, { scale: 0.001 }, 0.01, "linear");
const tatoTo = (t, id) => { for (const k of ["spud", "spudU"]) A(onCut(t), k, k === id ? "show" : "hide"); };
const hold = (t, who, side, prop, g, palm, dur = 0.01) => arm(onCut(t), who, side, { prop, grip: g, ...(palm && { palm }) }, dur, "linear");
// the egg timer: `left` 1 -> 0 from the set to the ring, a quiet tick every 0.5 s while it runs
const TSET = r3(T[4] + 0.6), TC = r3(END_OF(16) + 0.1), TL = r3(TC + 1.45), TP = r3(TL + 0.9), TB = r3(TP + 0.8), TRING = r3(TB + 0.6);

// ---------------------------------------------------------------- frame 0: Tato at the table, the bubble
A(0, "spudU", "hide"); for (const k of ["spud", "spudU", "dad"]) A(0, k, "noblink");   // Sol r2: blinks drop the eye whites (rig), so no blinks on Tato and Dad A(0, "rep2", "hide"); A(0, "rep3", "hide");
const gm3 = grips.mug(c, "rep3", MIC3, { side: "L" }); gm3.take(0, { reach: 0.01, settle: 0.01 }); c.prop(0, "mic3", { scale: 0.001 }, 0);
A(0, "spud", "sit", { seat: "chair", dur: 0.01, hands: "table" });
A(0, "rep", "crouch", { to: 0.14, dur: 0.01 }); expr(0, "rep", FACES.shaken, 0.01);
const gm = grips.mug(c, "rep", MIC, { side: "L" }); gm.take(0, { reach: 0.01, settle: 0.01 });
expr(0, "spud", FACES.bubble, 0.01); look(0, "spud", [0, -0.35], 0.01);
expr(0, "dad", FACES.frozen, 0.01); arm(0, "dad", "L", { o: [0.10, 0.45, 0.25] }, 0.01); arm(0, "dad", "R", { o: [0.10, 0.45, 0.25] }, 0.01);
grip(0, "dad", "L", "open", 0.01); grip(0, "dad", "R", "open", 0.01);
c.prop(0, "bubble", { blow: 0.4, stuck: 1 }, 0); c.prop(0, "timer", { togo: 0 }, 0); c.prop(0.02, "bubble", { blow: 1 }, 0.3, "out");
see(0, 0.8, ["spud.face", "bubble"], "a kid blows a pink gum bubble at the kitchen table");

// ---------------------------------------------------------------- 0-5 s HOOK (H1)
c.prop(0.35, "bubble", { pop: 1 }, 0.25, "out"); sfx(0.35, "pop", { gain: 0.5 });
expr(0.35, "spud", FACES.popped, 0.05); A(0.36, "spud", "squash", { amount: 0.05, dur: 0.1 }); A(0.5, "spud", "squash", { amount: 0, dur: 0.15 });
c.prop(0.9, "bubble", { stuck: 0 }, 0.01);
expr(0.62, "spud", FACES.gulp, 0.08); sfx(0.66, "gulp", { gain: 0.55 }); A(0.66, "spud", "squash", { amount: 0.11, dur: 0.07 }); A(0.78, "spud", "squash", { amount: -0.03, dur: 0.08 }); A(0.88, "spud", "squash", { amount: 0, dur: 0.12 });
A(0.62, "spud", "lean", { to: 12, dur: 0.07 }); A(0.80, "spud", "lean", { to: 0, dur: 0.15 });   // the gulp reads (Sol r1)
expr(0.95, "spud", { open: 0 }, 0.1); look(0.95, "spud", [0.6, 0.05], 0.15);
say(0);   // DAD in the doorway: Swallowed. Don't. Move.
say(1);   // REP behind the fridge: Swallowed. Is it deadly?
look(r3(T[1] - 0.2), "rep", [0.4, 0], 0.15); look(r3(END_OF(1) - 0.2), "rep", [0, 0], 0.15);

// ---------------------------------------------------------------- 5-17 s NAME + RULE + STAKE: Tato on the table
const T04 = cutAt(2);
tatoTo(T04, "spudU"); look(T04, "spudU", [-0.5, 0.1], 0.01); place(T04, "dad", DAD_O, 20);
expr(T04, "spudU", FACES.patient, 0.01); expr(T04, "dad", FACES.surgeon, 0.01);
arm(onCut(T04), "dad", "L", "rest", 0.01); arm(onCut(T04), "dad", "R", "rest", 0.01); grip(onCut(T04), "dad", "L", "relaxed", 0.01); grip(onCut(T04), "dad", "R", "relaxed", 0.01);
look(T04, "dad", [0.6, -0.4], 0.01);
say(2);   // We're live. Tato, age seven, swallowed his gum.
say(3);   // the rule
const T7 = r3(T[3] + 6.2);   // 'For seven years.': push in on Tato's face
expr(T7, "spudU", FACES.shaken, 0.1); expr(r3(T7 + 0.4), "spudU", FACES.shaken, 0.05); expr(r3(T7 + 0.9), "spudU", FACES.shaken, 0.05); expr(r3(T7 + 1.4), "spudU", FACES.shaken, 0.05);   // no blink in the close-up (draft 4 pop) look(T7, "spudU", [0.15, -0.05], 0.12); A(r3(T7 + 0.4), "spudU", "squash", { amount: 0.03, dur: 0.1 }); A(r3(T7 + 0.6), "spudU", "squash", { amount: 0, dur: 0.15 }); sfx(r3(T7 + 0.4), "gulp", { gain: 0.3 });
// DAD sets the timer: left glove on top, a twist, the tick starts
look(r3(T[4] - 0.3), "dad", [0.7, -0.5], 0.15);
grips.rest(c, "dad", "L", { id: "timer", kind: "eggtimer", h: 0.09 }, [0, 0], onCut(cutAt(4)), { dur: 0.01, ease: "linear" });   // on the timer at the cut
c.prop(TSET, "timer", { togo: 1 }, 0.35, "out"); sfx(TSET, "click", { gain: 0.3 });
for (let t = r3(TSET + 0.5); t < TRING - 0.2; t = r3(t + 0.5)) sfx(t, "click", { gain: t > END_OF(16) - 1 || (t >= END_OF(14) && t < END_OF(14) + 0.8) ? 0.22 : 0.08, reason: "the egg timer ticking on the table, in and out of frame" });
const TTI = r3(END_OF(14) + 0.1);   // the timer insert before the armour: the wedge is nearly gone (Sol r1: one minute passes in 37 s)
c.prop(r3(TSET + 0.4), "timer", { togo: 0.12 }, r3(TTI - TSET - 0.4), "linear"); c.prop(TTI, "timer", { togo: 0 }, r3(TRING - TTI), "linear");
say(4);   // Dinner's in one minute. If it's glued, nothing goes down.

// ---------------------------------------------------------------- STEP 1: "Mitts." -> oven mitts, the glass, the gurgles
expr(r3(T[5] - 0.3), "dad", FACES.surgeon, 0.1); look(r3(T[5] - 0.3), "dad", [0, 0], 0.1);
arm(r3(END_OF(4) + 0.05), "dad", "L", "rest", 0.4); grip(r3(END_OF(4) + 0.05), "dad", "L", "relaxed", 0.3);   // "Mitts." said with the hands down (restaged: raised hands hit Tato, 2 rounds)
say(5);   // Mitts.
const TM = r3(END_OF(5) + 0.35);           // the cut: the mitts are on, the glass stands on Tato's belly
c.prop(onCut(TM), "mitts", { on: 1 }, 0.01, "linear"); sfx(TM, "ai/cushion-poof", { gain: 0.25 });
put(TM, "glass", GLASS_AT);
A(onCut(TM), "dad", "lean", { to: 10, dur: 0.01 });
arm(onCut(TM), "dad", "R", "rest", 0.01);
hold(TM, "dad", "L", "glass", [0, 0.11, 0]); grip(onCut(TM), "dad", "L", "fist", 0.01);   // the mitt holds the glass to his tummy
expr(TM, "dad", FACES.squint, 0.01); look(TM, "dad", [0.6, -0.5], 0.01);
const TG1 = r3(TM + 0.6);
sfx(TG1, "bubbling", { gain: 0.35, dur: 0.8 }); A(TG1, "spudU", "squash", { amount: 0.02, dur: 0.15 }); A(r3(TG1 + 0.3), "spudU", "squash", { amount: 0, dur: 0.2 });
expr(r3(T[6] - 0.15), "dad", FACES.sticking, 0.1);
say(6, { soft: true });   // It's sticking.
// tease 1: Dad's OWN tummy gurgles back, louder
const TG2 = r3(END_OF(6) + 0.3);
sfx(TG2, "bubbling", { gain: 0.45, dur: 0.8 }); A(TG2, "dad", "squash", { amount: 0.04, dur: 0.12 }); A(r3(TG2 + 0.35), "dad", "squash", { amount: 0, dur: 0.3 });
expr(r3(TG2 + 0.05), "dad", { eye: 1.2, pupil: 0.8 }, 0.1); look(r3(TG2 + 0.1), "dad", [0, -0.3], 0.1);
// the reporter has crept in (on the cut): Sir... that was your stomach.
A(onCut(cutAt(7)), "rep", "hide"); A(onCut(cutAt(7)), "rep3", "show"); show(cutAt(7), "mic3");
A(onCut(cutAt(7)), "dad", "lean", { to: 0, dur: 0.01 }); A(onCut(cutAt(7)), "dad", "turn", { to: -25, dur: 0.01, ease: "linear", sync: true });   // faces the reporter (Sol r2)
arm(onCut(cutAt(7)), "dad", "L", { o: [-0.20, 0.27, 0.51] }, 0.01); arm(onCut(cutAt(7)), "dad", "R", { o: [-0.20, 0.27, 0.51] }, 0.01);
expr(cutAt(7), "rep3", FACES.suspicious, 0.01); expr(cutAt(7), "dad", FACES.fine, 0.01); look(cutAt(7), "dad", [0, 0], 0.01);
say(7);
look(r3(T[8] - 0.1), "dad", [0, 0.15], 0.15);
say(8);   // Mine is fine.

// ---------------------------------------------------------------- STEP 2: "Helmet." -> colander, tongs on the "wires"
arm(r3(T[9] - 0.4), "dad", "L", "rest", 0.4); arm(r3(T[9] - 0.4), "dad", "R", "rest", 0.4);   // "Helmet." said with the mitts down (raised arms hit Tato)
expr(r3(T[9] - 0.3), "dad", FACES.surgeon, 0.15); look(r3(T[9] - 0.3), "dad", [0, 0.1], 0.15);
say(9);   // Helmet.
const TH = r3(END_OF(9) + 0.4);
show(TH, "colander"); A(onCut(TH), "dad", "turn", { to: 20, dur: 0.01, ease: "linear", sync: true }); sfx(TH, "ai/pot-bang", { gain: 0.12 });
hide(TH, "glass"); A(onCut(TH), "rep3", "hide"); A(onCut(TH), "rep", "show"); hide(TH, "mic3");
put(TH, "tongs", [-0.86, 0.48, 0.68]);
hold(TH, "dad", "L", "tongs", "hold", [0, 0, 0.13]); grip(onCut(TH), "dad", "L", "fist", 0.01);
arm(onCut(TH), "dad", "R", "rest", 0.01);
expr(TH, "dad", FACES.wires, 0.01); look(TH, "dad", [0.7, -0.5], 0.01);
expr(TH, "spudU", FACES.patient, 0.01);
// the tongs hover from the red side to the blue side
c.prop(r3(T[10] + 0.2), "tongs", { y: 0.50, z: 0.64 }, 0.9); c.prop(r3(T[10] + 1.3), "tongs", { y: 0.47, z: 0.70 }, 0.9);
say(10, { soft: true });   // Red wire... or blue wire?
expr(r3(T[11] - 0.2), "spudU", FACES.flat, 0.15); look(r3(T[11] - 0.2), "spudU", [-0.6, 0], 0.15);
say(11);   // It's my sweater.
// snip anyway
const TSN = r3(END_OF(11) + 0.3);
c.prop(TSN, "tongs", { open: 0 }, 0.1, "in"); sfx(r3(TSN + 0.1), "click", { gain: 0.45 }); c.prop(r3(TSN + 0.35), "tongs", { open: 0.6 }, 0.2);   // a wide, slow snip that reads (Sol r2)
A(r3(TSN + 0.05), "dad", "squash", { amount: 0.03, dur: 0.12 }); A(r3(TSN + 0.25), "dad", "squash", { amount: 0, dur: 0.2 });   // slower: one-frame pop in draft 4
// tease 2: Tato sits up and offers a gum
const TO = cutAt(12);
tatoTo(TO, "spudU"); expr(TO, "spudU", FACES.offer, 0.01); look(TO, "spudU", [-0.6, 0.05], 0.01);
put(TO, "gum", [-0.39, 0.76, 0.48]); arm(onCut(TO), "spudU", "R", { prop: "gum", grip: [0, 0, 0], point: "pinch" }, 0.01, "linear"); grip(onCut(TO), "spudU", "R", "pinch", 0.01);
say(12);   // Want one?
// the flinch: Dad hops back as if from a snake
const TF = r3(T[13] - 0.1);
expr(TF, "dad", FACES.snake, 0.08); A(TF, "dad", "move", { to: DAD_FLINCH, dur: 0.35, steps: 0, ease: "out" });
c.prop(TF, "tongs", { x: -1.11, y: 0.42, z: 0.62 }, 0.35, "out");
arm(TF, "dad", "R", "rest", 0.3, "out"); grip(TF, "dad", "R", "open", 0.1);
sfx(TF, "ai/slowmo-air", { gain: 0.2 });
say(13);   // Get that away from me!
// the reporter's aside from cover
expr(cutAt(14), "rep", FACES.aside, 0.01); look(cutAt(14), "rep", [0, 0], 0.01);
say(14, { soft: true });   // He's been through this before.

// ---------------------------------------------------------------- STEP 3 (extreme): full armour, the dinner test
const TA = r3(END_OF(14) + 0.7);   // after the 0.6 s timer insert
show(TA, "basket"); hide(TA, "tongs"); hide(TA, "gum");
place(TA, "dad", DAD_O, 20);
tatoTo(TA, "spud"); arm(onCut(TA), "spud", "R", "rest", 0.01);
put(TA, "lid", [-1.50, 0.62, 0.55]); hold(TA, "dad", "R", "lid", [0, 0, -0.15]); grip(onCut(TA), "dad", "R", "fist", 0.01);
arm(onCut(TA), "dad", "L", GUARD, 0.01);   // GUARD (the basket wall)
put(TA, "bowl", [0.0, TOP, 0.08]);
expr(TA, "dad", FACES.armour, 0.01); look(TA, "dad", [0, 0], 0.01);
sfx(r3(TA + 0.1), "ai/pot-bang", { gain: 0.3 });
say(15);   // Full armour. The moment of truth.
// the spoon: in Dad's left mitt, toward Tato's mouth, slowly
const TS = cutAt(16);
look(r3(TS - 0.15), "dad", [0.6, -0.4], 0.12); put(TS, "spoon", [-0.16, 0.50, 0.12]); hold(TS, "dad", "L", "spoon", [0, 0.27, 0]); grip(onCut(TS), "dad", "L", "fist", 0.01);
expr(TS, "spud", FACES.spoonwait, 0.01); look(TS, "spud", [-0.5, -0.1], 0.01);
c.prop(r3(T[16] + 0.2), "spoon", { x: -0.08, z: -0.04 }, 2.9, "inOut");
expr(r3(T[16] + 3.12), "spud", { open: 0, curve: 0.1 }, 0.08); sfx(r3(T[16] + 3.15), "ai/pot-bite", { gain: 0.25, reason: "the bite on the spoon" }); c.prop(r3(T[16] + 3.3), "spoon", { x: -0.24, z: 0.04 }, 0.3, "out");   // the bite: lips close, the spoon comes out clean   // the bowl end leads to his mouth, the mitt stays left of his face (Sol r1)
A(r3(T[16] + 1.6), "dad", "squash", { amount: 0.01, dur: 0.08 }); A(r3(T[16] + 1.75), "dad", "squash", { amount: 0, dur: 0.08 });
say(16, { soft: true });   // One spoon. Slowly... slowly...
// ---------------------------------------------------------------- THE ANSWER: the chew, the burp, the ring
hide(TC, "spoon"); arm(onCut(TC), "dad", "L", GUARD, 0.01);
expr(TC, "spud", FACES.chew, 0.01);
for (let k = 0; k < 3; k++) { A(r3(TC + 0.1 + k * 0.3), "spud", "squash", { amount: 0.05, dur: 0.1 }); expr(r3(TC + 0.1 + k * 0.3), "spud", { open: 0.3 }, 0.08); A(r3(TC + 0.25 + k * 0.3), "spud", "squash", { amount: 0, dur: 0.1 }); expr(r3(TC + 0.25 + k * 0.3), "spud", { open: 0 }, 0.08); }
// the gulp (as at the start): eyes wide, a nod
const TGU = r3(TC + 1.05); expr(TGU, "spud", FACES.gulp, 0.06); sfx(r3(TGU + 0.04), "gulp", { gain: 0.55 });
A(TGU, "spud", "squash", { amount: 0.1, dur: 0.07 }); A(r3(TGU + 0.12), "spud", "squash", { amount: 0, dur: 0.14 }); A(TGU, "spud", "lean", { to: 10, dur: 0.07 }); A(r3(TGU + 0.18), "spud", "lean", { to: 0, dur: 0.15 });
expr(r3(TGU + 0.3), "spud", { eye: 1.15, open: 0, curve: 0 }, 0.1);
// Dad over the lid
c.prop(onCut(TL), "lid", { x: -0.95, y: 0.50, z: 0.85 }, 0.01, "linear");
expr(TL, "dad", FACES.overlid, 0.01); look(TL, "dad", [0.6, -0.1], 0.01);
for (let t = r3(TL + 0.3); t < TP; t = r3(t + 0.3)) expr(t, "dad", FACES.overlid, 0.05);   // no blink over the lid (Sol r1: eye whites drop)
// the reporter's peek
expr(TP, "rep", FACES.peek, 0.01); look(TP, "rep", [0.5, 0], 0.01);
// the burp
expr(TB, "spud", { eye: 0.55, curve: 0.1, open: 0.85, browY: 0.04 }, 0.05); sfx(r3(TB + 0.05), "ai/blep", { gain: 0.5 }); expr(r3(TB + 0.35), "spud", { eye: 0.75, open: 0 }, 0.1);
A(TB, "spud", "lean", { to: -8, dur: 0.08 }); A(r3(TB + 0.35), "spud", "lean", { to: 0, dur: 0.2 }); A(TB, "spud", "squash", { amount: -0.04, dur: 0.06 }); A(r3(TB + 0.15), "spud", "squash", { amount: 0, dur: 0.15 });
// TRING: the timer rings (the wide)
c.prop(TRING, "timer", { ring: 1 }, 1.2, "linear"); sfx(TRING, "ring", { gain: 0.45 });
expr(r3(T[17] - 0.15), "spud", FACES.flat, 0.1); look(r3(T[17] - 0.15), "spud", [-0.7, 0], 0.1);
say(17);   // Still works.
expr(r3(T[18] - 0.1), "dad", FACES.impossible, 0.1);
c.prop(r3(T[18] + 0.2), "lid", { x: -1.20, y: 0.40, z: 0.75 }, 0.5);   // lowered, still in the mitt
say(18, { soft: true });   // Impossible.

// ---------------------------------------------------------------- END (E1): the X-ray. CUT on Dad.
const TX = cutAt(19);
sfx(r3(TX + 0.45), "ai/pot-bang", { gain: 0.22, reason: "Dad drops the pot-lid shield off screen as the X-ray comes out" });
A(onCut(TX), "rep", "hide"); A(onCut(TX), "rep2", "show"); show(TX, "film");
const gf = grips.box(c, "rep2", FILMP); gf.take(0, { reach: 0.01, settle: 0.01 }); c.prop(0, "film", { scale: 0.001 }, 0);
expr(TX, "rep2", FACES.proof, 0.01); look(TX, "rep2", [0.6, 0], 0.01);
say(19);   // Then what... is this?
const TE = cutAt(20);
place(TE, "dad", DAD_E, -50); arm(onCut(TE), "dad", "R", { x: [-0.10, 0.31, 0.50] }, 0.01);
c.prop(onCut(TE), "lid", { x: -1.0, y: 0.03, z: 0.35, tip: -90, rot: 0 }, 0.01, "linear");   // dropped at his feet during the X-ray (Sol r1: it vanished)
expr(TE, "dad", FACES.caught, 0.01); look(TE, "dad", [0.4, -0.4], 0.01);

c.prop(r3(TE + 0.1), "sweat", { scale: 2.5 }, 0.01); c.prop(r3(T[20]), "sweat", { x: -0.16, y: 0.90, z: 0.34 }, 1.1, "in"); c.prop(r3(T[20] + 1.15), "sweat", { scale: 0 }, 0.01);
say(20);   // ...That's different.
const END = F(END_OF(20) + HOLD);
see(T[20], END, ["dad.face", "film"], "Dad caught: his own X-ray with a gum ball, DAD 1995");

// ---------------------------------------------------------------- cameras (DESIGN section 4): every shot moves
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const C01 = { pos: [-0.10, 0.62, 2.10], look: [-0.10, 0.50, -0.30], fov: 30 };
const C02 = { pos: [2.2, 0.80, 0.6], look: [4.85, 0.72, -1.75], fov: 40 };
const C02P = { pos: [2.6, 0.92, 0.2], look: [4.80, 0.95, -1.70], fov: 26 };   // the punch-in on "Don't." (Sol r1)
const C03 = { pos: [-3.30, 0.60, 1.20], look: [-3.55, 0.55, -1.40], fov: 40 };   // the reporter crouched at the fridge (Sol r1: it read as a cabinet)   // the fridge reads (Sol r1)
const C04 = { pos: [1.3, 1.6, 3.2], look: [-0.45, 0.6, 0.2], fov: 44 };
const C05 = { pos: [0.35, 0.55, 1.05], look: [-0.25, 0.40, 0.55], fov: 34 };   // close on the timer, Dad's arm against his own shirt (Sol r2)
const C06 = { pos: [0.55, 0.95, 3.2], look: [-0.55, 0.78, 0.2], fov: 46 };
const C06T = { pos: [0.30, 0.80, 1.50], look: [-0.02, 0.68, 0.25], fov: 34 };   // Tato on "For seven years"
const CSN = { pos: [0.30, 0.80, 2.5], look: [-0.48, 0.58, 0.45], fov: 28 };   // the snip insert
const CTI = { pos: [-0.05, 0.44, 1.25], look: [-0.20, 0.28, 0.62], fov: 28 };   // the timer insert: nearly empty
const C07 = { pos: [-0.95, 0.72, 2.90], look: [-0.95, 0.60, 0.20], fov: 36 };
const C07W = { pos: [-1.35, 0.75, 4.30], look: [-1.35, 0.62, 0.30], fov: 44 };   // Dad + the reporter (Sol r1)
const C09 = { pos: [1.75, 1.00, 2.20], look: [-0.65, 0.75, 0.20], fov: 48 };
const C10 = { pos: [-0.70, 0.60, 4.6], look: [-0.70, 0.55, 0.2], fov: 44 };
const C11 = { pos: [-0.50, 0.64, 2.8], look: [-0.52, 0.52, -0.05], fov: 44 };   // the spoon: both, the short reach
const CSP = { pos: [-0.15, 0.62, 0.75], look: [-0.12, 0.46, -0.10], fov: 36 };   // mouth and spoon above the news bar   // the spoon at his mouth (Sol r1 edit tip)
const C12 = { pos: [-0.10, 0.55, 2.30], look: [-0.10, 0.40, -0.30], fov: 30 };
const C13 = { pos: [-0.55, 0.80, 4.2], look: [-0.55, 0.30, 0], fov: 44 };   // the timer above the news bar
const C14 = { pos: [-1.90, 0.33, 2.35], look: [-1.90, 0.22, 0], fov: 38 };
const C15 = { pos: [-1.40, 0.42, 2.9], look: [-1.42, 0.30, 0], fov: 40 };
const TDON = r3(T[0] + 1.4), TSV = r3(END_OF(11) + 0.1), TDIN = r3(TSET + 1.0);
const beats = c.beats([
  ["bubble", 0, push(C01, 0.06, 0.8), "hook"],
  ["swallowed", 0.78, push(C02, 0.05, r3(TDON - 0.78))],
  ["don't", TDON, push(C02P, 0.03, r3(END_OF(0) - TDON + 0.1))],
  ["is it deadly", r3(END_OF(0) + 0.05), push(C03, 0.06, DUR[1] + 0.6)],
  ["we're live", T04, push(C04, 0.05, DUR[2] + 0.5)],
  ["one rule", cutAt(3), push(C03, 0.05, 3.4)],
  ["glues shut", r3(T[3] + 3.5), push(C06, 0.04, r3(T7 - T[3] - 3.5))],
  ["seven years", T7, push(C06T, 0.10, r3(cutAt(4) - T7))],
  ["the timer", cutAt(4), push(C05, 0.06, r3(TDIN - cutAt(4)))],
  ["dinner", TDIN, push(C07, 0.08, r3(TM - TDIN))],
  ["the glass", TM, push(C06, 0.04, r3(cutAt(7) - TM)), "escalation"],
  ["your stomach", cutAt(7), push(C07W, 0.06, r3(TH - cutAt(7)))],
  ["wires", TH, push(C06, 0.04, r3(TSV - TH))],
  ["snip", TSV, push(CSN, 0.05, r3(TO - TSV))],
  ["want one", TO, push(C09, 0.05, DUR[12] + DUR[13] + 0.8)],
  ["before", cutAt(14), push(C03, 0.07, r3(TTI - cutAt(14)))],
  ["time", TTI, push(CTI, 0.06, r3(TA - TTI))],
  ["armour", TA, push(C10, 0.06, r3(cutAt(16) - TA)), "escalation"],
  ["spoon", TS, push(C11, 0.04, r3(T[16] + 2.85 - TS))],
  ["spoon close", r3(T[16] + 2.85), push(CSP, 0.05, r3(TC - T[16] - 2.85))],
  ["chew", TC, push(C12, 0.04, r3(TL - TC))],
  ["over the lid", TL, push(C07, 0.04, 0.9)],
  ["peek", TP, push(C03, 0.04, 0.8)],
  ["burp", TB, push(C12, 0.03, r3(TRING - TB))],
  ["ring", TRING, push(C13, 0.05, r3(TX - TRING)), "reveal"],
  ["the x-ray", TX, push(C14, 0.06, r3(TE - TX))],
  ["different", TE, push(C15, 0.07, r3(END - TE)), "payoff"],
], END);

write(import.meta.url, {
  id: "gum",
  title: "Dad said: swallowed gum glues your stomach",
  idea: "Kid vs Dad 06: Tato swallows his gum; Dad treats it like a bomb (oven mitts, colander helmet, laundry-basket armour) while a war reporter covers it live; Tato eats, nothing happens; the reporter finds Dad's own X-ray: a gum ball, DAD 1995.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1230], captionStyle: "kinetic",
  captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions sit in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "kitchen", morning: true, time: 6.98, lamp: 1, aperture: 0, focus: false, para: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: { news: { label: "GUM EMERGENCY", tag: "LIVE", tagW: 150, count: false, show: [r3(END_OF(1) - 0.25), END] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood" },
  creative: { length: [55, 95] },
  hook: { show: ["spud"], hint: 0, what: "a kid's gum bubble pops, he gulps; his dad, frozen in the doorway: 'Swallowed. Don't. Move.'" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "chair", from: 0, to: END, reason: "sitting on the chair" },
    { who: "spudU", with: "table", from: 0, to: END, reason: "standing on the table" },
    { who: "dad", with: "spudU", from: r3(TM - 0.45), to: r3(TM + 0.05), reason: "the arm passes Tato off frame in the Mitts. single (Dad alone, Tato 0.8 m out of the frame)" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/06-gum/make-gum.mjs. Burp = ai/blep and the tick = click: placeholders (no burp or tick in the kit).",
});
