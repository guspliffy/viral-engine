// POTATO DESK 12 "He nailed his trial like a job interview" (court option 3, Jonny 20 Nov 2026 18:02 Berlin "this one is
// also good"; starred hook + ending). Story: /mnt/project-files/videos/potato-desk/12-interview-trial/STORY.md.
//   node storyboards/series/potato-desk/12-interview-trial/make-interview-trial.mjs -> interview-trial.json
//
// Hook (on trial): on screen "He nailed his trial like a job interview." (in-app label), caption "Would you hire him?".
// The judge is the straight man and only asks real court questions; the little one (tie, CV) answers each one like a job
// interview (court study 20 Nov: the defendant treats court as something else, end on the flip line, no tag).
// Chain: he is charged, so he thanks the court for having him; asked why this bank, so "passionate about money"; asked if
// he acted alone, so he "led a team of two" and his accomplice waves; asked where the money is, so he "invested in
// himself" (his new tie) and the accomplice sees he got no tie; asked why he was still in the vault, so "I work too hard";
// so the judge gives ten years. v2 (Jonny's B): so he negotiates for more (meals, a cell, no rent), so his accomplice
// applies too, so they outbid each other, so the judge sends them home (Jonny 20:10), so both are crushed: home has rent.
// Jonny 20:11: the final is sped up 5% after the render (ffmpeg setpts + atempo, as 10 Lunch trial).
// Same set, board, judge and voices as 05 Court Day / 07 Credit for the crime. Not a counter: the board is only the
// stake (? YEARS from frame 0, 10 on the verdict, 0 when he sends them home). Every shot moves, a new framing per line (Jonny 20 Nov 09:44).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => r3(Math.round(t * 15) / 15);

// measured spoken lengths (node qa/lines.mjs desk12-voice-probe.json), in LINES order
const DUR = [1.74, 0.85, 1.2, 1.37, 1.25, 1.16, 0.9, 1.2, 1.49, 1.92, 1.18, 0.51, 0.89, 1.2, 1.33, 1.6, 0.81, 0.72, 0.94, 1.6,
  0.57, 0.62, 0.97, 0.8, 1.33, 0.77, 0.68, 0.86, 1.39, 1.4, 1.53, 1.1, 1.56, 1.0, 1.04, 1.27, 0.49, 0.54, 0.7, 1.86, 0.59, 1.23, 1.11];
// the pause before each line: a volley (0.2-0.3), a beat at each turn (the judge stares at the hand, the verdict, "Ten?",
// MORE years, the judge thinks before "No rent.", the nurse, the last line)
const GAP = [0.1, 0.25, 0.6, 0.2, 0.25, 0.2, 0.25, 0.2, 0.3, 0.2, 0.5, 0.65, 0.2, 0.25, 0.3, 0.65, 0.3, 0.35, 0.25, 0.2,
  0.25, 0.2, 0.3, 0.2, 0.4, 0.3, 0.65, 0.35, 0.5, 0.3, 0.35, 0.5, 0.35, 0.35, 0.25, 0.25, 0.2, 0.2, 0.3, 0.7, 0.55, 0.35, 0.3];
// time for the accomplice's walk forward before "Can I apply too?" (line 28)
const WALK = 1.2;
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i] + (i === 28 ? WALK : 0)); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (Court Day's floor: x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
const CHIP0 = [0.32, 1.2], WEDGE0 = [1.5, -0.1], WEDGE_WHISPER = [1.1, 0.75], WEDGE_FWD = [1.22, 1.1];   // behind his shoulder for the whisper, then beside him to apply
const D_YAW = -28, W_YAW = -22;
const AT_JUDGE = [-0.8, 0.6];
const VIK_AT_CHIP = [0.75, -0.5], VIK_AT_HAND = [0.6, -0.65], VIK_AT_WEDGE = [0.9, -0.35], VIK_AT_US = [0.1, -0.15];
const VIK_TO_CHIP = 24;

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: VIK_TO_CHIP, expr: "stern", follow: 0.2, seed: 1.7 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: W_YAW, expr: "kind", follow: 0.3, seed: 3.1 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: D_YAW, expr: "kind", follow: 0.4, seed: 2.3 },
];

const at3 = (a) => ({ x: r3(a[0]), y: r3(a[1]), z: r3(a[2]) });
const fwd = (p, yaw, d, side = 0) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + Math.sin(a) * d + Math.cos(a) * side), r3(p[1] + Math.cos(a) * d - Math.sin(a) * side)]; };
const GREST = [-1.12, 1.24 + 0.33, 0.22];   // held head-down like a mallet: its head (0.3275 below the butt) rests on the block top (1.24)
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0, tip: 180 };   // head down: every strike is a straight pound, head on the block (Sol r2 #2; no turn in the hand)
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", [-0.5, DECK, -0.08], 8) };
// the CV: held up in his left hand from frame 0 to the end, its print turned to the judge (never moves: a held prop that
// turns with the body flips the palm, lunch trial lesson)
const CV_AT = (() => { const p = fwd(CHIP0, D_YAW, 0.33, 0.19); return [p[0], 0.11, p[1]]; })();
const CV = { id: "cv", kind: "cvsheet", away: true, ...grips.placeFor("cvsheet", CV_AT, D_YAW) };
const TIE = { id: "tie", kind: "necktie", wear: "chip", x: 0, y: 0.34, z: 0.24, len: 0.15, color: "#24324a", stripe: "#d9b24a" };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 10, h: 6 },   // 10 x 6, not 3.8 x 4.24: the wide angles showed its side edge (Sol r2 #16)
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true, trimW: 10, xs: [-4.5, -3.75, -3, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 3, 3.75, 4.5] },
  { id: "board", staged: "screwed to the back wall", kind: "sentenceboard", x: 0.3,   // 0.3, not Court Day's 0.66: the two-shots from the left either hold the whole numeral or none of it (Sol r2: a cut "10" read as "0")
    y: 2.01, z: -1.255,
    states: ["?", "10", "0"], units: ["YEARS", "YEARS", "YEARS"], headers: ["SENTENCE", "SENTENCE", "SENTENCE"] },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, bar: [CHIP0[0], CHIP0[1] - 0.12, 0.34, 0.09], queue: [] },
  GAVEL, MUG, CV, TIE,
];

// captions: upper third (rows ~250-350, as 10 Lunch trial); the first line sits under the in-app label's band (0-3 s)
const SUB = 250, SUB0 = 470;
const CAPTEXT = { 10: "*Ten years.*", 13: "I was thinking *fifteen.*", 15: "You want *MORE* years?", 26: "*No rent.*", 27: "*No rent!*", 32: "I'll take *fifteen.*", 34: "Then I want *twenty!*", 35: "*Twenty-five!*", 36: "*Thirty!*", 37: "*LIFE!*", 38: "*ENOUGH!*", 39: "Case dismissed. *Go home.*", 40: "*Home?!*", 41: "No *dental...*", 42: "But I pay *rent* there!" };
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.43) - 0.23)));   // popOut 0.16 ends before the cut
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? line, i === 0 ? SUB0 : SUB, false, { size: 64 });
};

const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const gcv = grips.phone(c, "chip", CV, { side: "L" });
// a strike that visibly lands (Sol r2 #2: the upright gavel stopped with its head above the block): the head-down
// gavel goes up and pounds straight down, the head on the block, held two frames
const strike = (t, flipTo, { up = 0.2, gain = 1.3 } = {}) => {
  t = F2(t);
  let e = gv.carry(t, [GREST[0] - 0.03, GREST[1] + up, GREST[2] + 0.02], 0.2, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.08, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) { c.prop(r3(e - 0.01), "board", { flip: flipTo }, 0.2); sfx(r3(e + 0.06), "kenney/switch", { gain: 0.45 }); }
  return e;
};
const step = (t, who, to, dur) => A(t, who, "move", { to, dur });
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });   // blinks only where blinksAt puts them (preflight blink-on-line)
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });


// ---------------------------------------------------------------- frame 0
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
for (const [who, y] of [["chip", D_YAW], ["wedge", W_YAW]]) A(0, who, "turn", { to: y, dur: 0.01 });
c.prop(0, "board", { flip: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
c.arm(0, "chip", "L", { prop: "cv", grip: gcv.hands.L.grip, palm: true }, 0); A(0, "chip", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "chip", "grab", { prop: "cv", hand: "L", grip: gcv.hands.L.grip, dur: 0, pose: null });
look(0, "vik", VIK_AT_CHIP, 0.01);
look(0, "chip", AT_JUDGE, 0.01); expr(0, "chip", "delighted", 0.01);
look(0, "wedge", AT_JUDGE, 0.01);
act.blinksAt(c, "vik", [3.6, 9.4, 15.6, 22.1, 30.5, 41.8, 50.2]);
act.blinksAt(c, "chip", [5.2, 12.1, 19.6, 27.4, 36.2, 47.3]);
act.blinksAt(c, "wedge", [2.4, 7.9, 14.6, 24.9, 33.1, 34.75, 38.82, 45.6, 52.1]);   // 34.75 / 38.82 / 52.1: a blink over each face change (Sol r2 #9)
see(0, END_OF(0), ["vik.face", "chip.face", "cv", "board"], "a judge charges a little potato in a tie who holds up a CV; ? YEARS");

const hand = (t, pose, shape = "open", dur = 0.35) => { arm(t, "chip", "R", pose, dur); grip(r3(t + 0.1), "chip", "R", shape); };
const rest = (t, who = "chip", side = "R", dur = 0.4) => arm(t, who, side, "rest", dur);
// from a hand at the face or high up: out in front first, then down (a straight path cut through the body and the solver popped the hand)
const restVia = (t, who, side, via = who === "chip" ? { o: [0.12, 0.35, 0.3] } : { o: [-0.15, 0.45, 0.3] }, d1 = 0.25, d2 = 0.35) => { arm(t, who, side, via, d1); arm(r3(t + d1), who, side, who === "wedge" && side === "R" ? WREST : "rest", d2); };
const WREST = { o: [-0.04, 0.27, 0.1] };   // the accomplice's right hand hangs a little in: his plain rest touched the little one beside him
const vikLook = (t, to, ex) => { look(r3(t - 0.15), "vik", to, 0.2); if (ex) A(r3(t - 0.1), "vik", "expr", { expr: ex, dur: 0.2 }); };
const OPEN = { o: [0.16, 0.3, 0.3] }, CHEST = { x: [-0.13, 0.22, 0.34] }, TIE_AT = { x: [-0.03, 0.27, 0.33] }, CV_TAP = { x: [0.15, 0.26, 0.355] }, CV_OFF = { x: [0.15, 0.36, 0.5] };   // the tap and a clear lift between (Sol r2 #7)
const CHIP_UP = { o: [0.04, 1.15, 0.16], elbow: 0.14 }, SHRUG = { o: [0.1, 0.5, 0.26] };   // a raised fist with a readable elbow; a shrug inside the close shot

// ACT 1: the interview. 1 JUDGE: You robbed a bank.
say(0);
// 2 CHIP, beaming, right hand out for a handshake: Thank you for having me!
arm(r3(T[1] - 0.35), "chip", "R", { o: [0.12, 0.45, 0.42] }, 0.45); grip(r3(T[1] - 0.15), "chip", "R", "open");
A(r3(T[1] - 0.2), "chip", "squash", { amount: -0.04, dur: 0.25 });
say(1);
look(r3(T[1] + 0.4), "vik", VIK_AT_HAND, 0.25); A(r3(T[1] + 0.5), "vik", "expr", { expr: "deadpan", dur: 0.25 });
// 3 JUDGE: Why this bank?
rest(r3(T[2] + 0.35)); A(r3(END_OF(1) + 0.1), "chip", "squash", { amount: 0, dur: 0.25 });
vikLook(r3(T[2] + 0.4), VIK_AT_CHIP, "stern");
say(2);
// 4 CHIP, hand on his heart: I'm passionate about money.
hand(r3(T[3] - 0.25), CHEST); expr(r3(T[3] - 0.1), "chip", "kind");
A(r3(T[3] + 0.2), "chip", "face", { lid: 0.6, dur: 0.25 }); A(r3(END_OF(3) - 0.2), "chip", "face", { lid: 0, dur: 0.2 });
say(3);
// 5 JUDGE: Did you act alone?
rest(r3(END_OF(3) + 0.05)); expr(r3(END_OF(3) + 0.05), "chip", "delighted");
say(4);
// 6 CHIP thumbs back at his accomplice, who waves, proud: I led a team of two.
hand(r3(T[5] - 0.15), { o: [0.02, 0.95, -0.04], elbow: 0.14 }, "thumb", 0.4); look(r3(T[5] - 0.1), "chip", [0.6, 0.3], 0.2);
A(r3(T[5] - 0.15), "chip", "turn", { to: D_YAW + 18, dur: 0.3 });
look(r3(T[5] + 0.3), "vik", VIK_AT_WEDGE, 0.25);
look(r3(T[5] + 0.35), "wedge", [-0.5, 0.25], 0.15);
arm(r3(T[5] + 0.4), "wedge", "L", { o: [0.02, 1.0, 0.1] }, 0.45, "inOut"); expr(r3(T[5] + 0.45), "wedge", "delighted");
for (let k = 0; k < 3; k++) A(r3(T[5] + 0.8 + k * 0.26), "wedge", "arm", { side: "L", pose: { o: [k % 2 ? 0.06 : -0.02, 1.0, 0.1] }, dur: 0.26 });   // over his head: the wave stays in frame (Sol r2 #5)
arm(r3(END_OF(5) + 0.35), "wedge", "L", "rest", 0.5);
say(5);
see(T[5], END_OF(5), ["chip.face", "wedge.face"], "his team of two: the accomplice waves");
// 7 JUDGE (sharper): Where is the money?
rest(r3(T[6] - 0.1)); A(r3(T[6] - 0.1), "chip", "turn", { to: D_YAW, dur: 0.3 });
vikLook(T[6], VIK_AT_CHIP, "angry"); A(r3(T[6] + 0.05), "vik", "lean", { to: 10, dur: 0.35 });
say(6);
// 8 CHIP straightens his tie: I invested in myself.  (the accomplice looks at the tie, then down at his own sweater)
hand(r3(T[7] - 0.3), TIE_AT, "pinch");
A(r3(T[7] + 0.25), "chip", "arm", { side: "R", pose: { x: [-0.03, 0.3, 0.33] }, dur: 0.25 });
A(r3(T[7] + 0.5), "chip", "arm", { side: "R", pose: TIE_AT, dur: 0.25 });
expr(r3(T[7] - 0.1), "chip", "smug");   // no chin-up pitch: it sank the held CV into his body
look(r3(T[7] + 0.2), "wedge", [-0.55, -0.35], 0.2);
look(r3(END_OF(7) - 0.2), "wedge", [0, -0.75], 0.25); expr(r3(END_OF(7) - 0.2), "wedge", "sad", 0.3);
say(7);
see(T[7], END_OF(7) + 0.3, ["chip.face", "tie", "wedge.face"], "he straightens his new tie; his accomplice has none");
// 9 JUDGE (tired): Why were you still in the vault?
arm(r3(END_OF(7) + 0.05), "chip", "R", { x: [-0.16, 0.24, 0.42] }, 0.3); rest(r3(END_OF(7) + 0.35), "chip", "R", 0.45);   // out from the tie first, then down
A(r3(T[8] - 0.2), "vik", "lean", { to: 0, dur: 0.4 }); A(r3(T[8] - 0.2), "vik", "expr", { expr: "deadpan", dur: 0.25 });
A(r3(T[8] + 0.1), "vik", "face", { lid: 0.45, dur: 0.3 });
look(r3(T[8]), "wedge", AT_JUDGE, 0.25); expr(r3(T[8]), "wedge", "kind", 0.3);
say(8);
// 10 CHIP, a modest shrug: Honestly? I work too hard.
expr(r3(T[9] - 0.1), "chip", "kind"); arm(r3(T[9] + 0.6), "chip", "R", SHRUG, 0.35); A(r3(T[9] + 0.6), "chip", "squash", { amount: -0.04, dur: 0.3 }); A(r3(END_OF(9)), "chip", "squash", { amount: 0, dur: 0.3 }); A(r3(T[9] + 0.6), "chip", "face", { tilt: 0.5, dur: 0.3 });
rest(r3(END_OF(9) + 0.1)); A(r3(END_OF(9) + 0.1), "chip", "face", { tilt: 0, dur: 0.3 });
say(9);
// 11 JUDGE, gavel: Ten years.  (tok, the board flips ? -> 10)
A(r3(T[10] - 0.2), "vik", "face", { lid: 0, dur: 0.15 }); A(r3(T[10] - 0.2), "vik", "expr", { expr: "stern", dur: 0.2 });
say(10);
look(r3(T[10] + 0.05), "vik", [-0.3, -0.3], 0.15); look(r3(T[10] + 0.75), "vik", VIK_AT_CHIP, 0.15);
const S1 = strike(r3(T[10] + 0.35), 1);
A(r3(S1 + 0.05), "wedge", "expr", { expr: "shocked", dur: 0.15 });
see(T[10], r3(S1 + 0.5), ["vik.face", "board"], "ten years: the board flips to 10 YEARS");

// ACT 2: he negotiates it like a salary. 12 CHIP, unimpressed: Ten?
expr(r3(T[11] - 0.15), "chip", "deadpan"); A(r3(T[11] - 0.1), "chip", "face", { brow: 0.6, dur: 0.2 });
say(11);
// 13 CHIP taps his CV: With my experience?
hand(r3(T[12] - 0.3), CV_OFF, "point", 0.3);
A(r3(T[12] + 0.15), "chip", "arm", { side: "R", pose: CV_TAP, dur: 0.12 });
A(r3(T[12] + 0.35), "chip", "arm", { side: "R", pose: CV_OFF, dur: 0.12 });
A(r3(T[12] + 0.55), "chip", "arm", { side: "R", pose: CV_TAP, dur: 0.12 });
say(12);
// 14 CHIP, smooth, hand on his chest: I was thinking fifteen.
hand(r3(T[13] - 0.2), CHEST); expr(r3(T[13] - 0.1), "chip", "cocky"); A(r3(T[13] - 0.1), "chip", "face", { brow: 0, dur: 0.2 });
say(13);
// 15 the accomplice hurries up behind his shoulder: Lower is better!
const FIFTEEN = r3(T[13] + 0.75);   // "fifteen" lands ~0.75 s into the line
look(FIFTEEN, "wedge", [-0.4, -0.1], 0.15); expr(FIFTEEN, "wedge", "terrified", 0.15);
A(r3(FIFTEEN + 0.05), "wedge", "move", { to: WEDGE_WHISPER, dur: 0.8, steps: 2 });
look(r3(T[14] - 0.15), "wedge", [-0.6, -0.45], 0.15);
A(r3(T[14] + 0.3), "wedge", "lean", { to: 6, dur: 0.25 }); arm(r3(T[14] - 0.25), "wedge", "R", { x: [-0.15, 0.37, 0.4] }, 0.45); grip(r3(T[14] - 0.25), "wedge", "R", "relaxed", 0.4);   // a hand cupped at his mouth: a whisper
say(14);
restVia(r3(END_OF(14) + 0.1), "wedge", "R"); grip(r3(END_OF(14) + 0.1), "wedge", "R", "relaxed", 0.5); A(r3(END_OF(14) + 0.1), "wedge", "lean", { to: 0, dur: 0.3 });
restVia(r3(T[14]), "chip", "R"); look(r3(T[14] + 0.2), "chip", [0.6, 0.3], 0.15); look(r3(END_OF(14)), "chip", AT_JUDGE, 0.2);
// 16 JUDGE, baffled: You want MORE years?
vikLook(T[15], VIK_AT_CHIP, "shocked"); A(r3(T[15]), "vik", "lean", { to: 14, dur: 0.35 });
say(15);
// 17-25 the questions a job applicant asks (an open hand for each), the judge's flat answers
const ASK = [16, 18, 20, 22, 25], POSES = [OPEN, { o: [0.2, 0.36, 0.3] }, OPEN, TIE_AT, { o: [0.18, 0.28, 0.34] }];
ASK.forEach((i, k) => { hand(r3(T[i] - 0.3), POSES[k], i === 22 ? "pinch" : "open", 0.4); expr(r3(T[i] - 0.1), "chip", k % 2 ? "focused" : "kind"); });
A(r3(T[16] - 0.2), "vik", "lean", { to: 0, dur: 0.4 }); A(r3(T[17] - 0.1), "vik", "expr", { expr: "deadpan", dur: 0.2 });
for (const i of [16, 17, 18, 19, 20, 21, 22, 23]) say(i);
// 25 CHIP, vain, chin up: I look great in orange.
expr(r3(T[24] - 0.1), "chip", "smug"); A(r3(T[24]), "chip", "pitch", { to: -8, dur: 0.3 }); hand(r3(T[24] - 0.15), CHEST);
say(24);
A(r3(END_OF(24) + 0.1), "chip", "pitch", { to: 0, dur: 0.3 });
look(r3(T[24] + 0.3), "wedge", [-0.5, -0.4], 0.3); expr(r3(T[24] + 0.3), "wedge", "annoyed", 0.5);
say(25);
// 27 JUDGE: No rent.   28 CHIP turns to his friend, amazed: No rent!
A(r3(T[26] - 0.1), "vik", "face", { lid: 0.3, dur: 0.2 });
say(26);
A(r3(T[27] - 0.2), "chip", "turn", { to: D_YAW + 32, dur: 0.3 }); look(r3(T[27] - 0.2), "chip", [0.6, 0.35], 0.15);
expr(r3(T[27] - 0.15), "chip", "delighted"); A(r3(T[27] - 0.05), "chip", "squash", { amount: -0.07, dur: 0.15 }); A(r3(T[27] + 0.25), "chip", "squash", { amount: 0, dur: 0.2 });
arm(r3(T[27] - 0.2), "chip", "R", CHIP_UP, 0.3, "out");
look(r3(T[27] + 0.1), "wedge", [-0.6, -0.3], 0.15); expr(r3(T[27] + 0.3), "wedge", "shocked", 0.35);
say(27);
see(T[26], END_OF(27), ["chip.face", "wedge.face"], "no rent: prison beats his life; his friend's eyes go wide");

// ACT 3: the accomplice wants in. He steps up beside him, hand up: Can I apply too?
restVia(r3(END_OF(27) + 0.3), "chip", "R", { o: [0.15, 0.7, 0.28] }); A(r3(END_OF(27) + 0.3), "chip", "turn", { to: D_YAW, dur: 0.5 }); look(r3(END_OF(27) + 0.3), "chip", AT_JUDGE, 0.3);
look(r3(END_OF(27)), "wedge", [-0.6, 0.3], 0.2); expr(r3(END_OF(27) + 0.2), "wedge", "eager");
A(r3(END_OF(27) + 0.15), "wedge", "move", { to: WEDGE_FWD, dur: 1.0, steps: 2 });
arm(r3(T[28] - 0.2), "wedge", "L", "up", 0.35, "out"); A(r3(T[28] - 0.3), "wedge", "turn", { to: W_YAW - 22, dur: 0.35 });   // toward the bench for his questions (Sol r2 #8)
say(28);
see(T[28], END_OF(28), ["wedge.face", "chip.face"], "the accomplice steps up and applies too");
// 30 JUDGE: You're his accomplice!
vikLook(T[29], VIK_AT_WEDGE, "angry"); A(r3(T[29]), "vik", "lean", { to: 12, dur: 0.3 });
arm(r3(T[29] + 0.2), "wedge", "L", "rest", 0.4);
say(29);
// 31 WEDGE, serious: Is there dental?
expr(r3(T[30] - 0.1), "wedge", "focused"); look(r3(T[30] - 0.2), "wedge", AT_JUDGE, 0.15); arm(r3(T[30] - 0.15), "wedge", "R", { x: [-0.14, 0.36, 0.42] }, 0.3);   // a finger at his teeth
grip(r3(T[30] - 0.05), "wedge", "R", "point");
say(30);
restVia(r3(END_OF(30) + 0.1), "wedge", "R", undefined, 0.4, 0.5); A(r3(END_OF(31) - 0.3), "wedge", "turn", { to: W_YAW, dur: 0.4 });
// 32 JUDGE, giving up: There's a nurse.
A(r3(T[31] - 0.2), "vik", "lean", { to: 0, dur: 0.4 }); A(r3(T[31] - 0.1), "vik", "expr", { expr: "sad", dur: 0.25 }); A(r3(T[31]), "vik", "face", { lid: 0.5, dur: 0.3 });
say(31);
// 33 WEDGE, a done deal, thumbs up: I'll take fifteen.
expr(r3(T[32] - 0.1), "wedge", "delighted"); arm(r3(T[32] - 0.35), "wedge", "L", { o: [-0.2, 0.95, 0.25], elbow: 0.12 }, 0.5); grip(r3(T[32] - 0.05), "wedge", "L", "fist");   // the fist beside his head (Sol r2 #3)
say(32);
A(r3(END_OF(32) - 0.1), "wedge", "squash", { amount: -0.05, dur: 0.15 }); A(r3(END_OF(32) + 0.15), "wedge", "squash", { amount: 0, dur: 0.2 });
arm(r3(END_OF(32) + 0.1), "wedge", "L", "rest", 0.6);
look(r3(T[32] + 0.1), "chip", [0.6, 0.35], 0.15); look(r3(T[32] + 0.85), "chip", AT_JUDGE, 0.12); expr(r3(T[32] + 0.85), "chip", "shocked", 0.15); A(r3(T[32] + 0.85), "chip", "face", { brow: 0.8, dur: 0.15 }); A(r3(T[33] - 0.2), "chip", "face", { brow: 0, dur: 0.2 });   // to his friend, then a sharp look at the bench: he thinks the judge took the deal (Sol r2 #3)
// 34 CHIP turns on him, outraged: He gets fifteen?!   35 Then I want twenty!
A(r3(T[33] - 0.2), "chip", "turn", { to: D_YAW + 22, dur: 0.25 }); look(r3(T[33] - 0.2), "chip", [0.6, 0.4], 0.15);
expr(r3(T[33] - 0.15), "chip", "angry"); hand(r3(T[33] - 0.2), { o: [0.28, 0.42, 0.2] }, "point", 0.3);
look(r3(T[33]), "wedge", [-0.6, -0.3], 0.15);
say(33);
A(r3(T[34] - 0.2), "chip", "turn", { to: D_YAW, dur: 0.25 }); look(r3(T[34] - 0.2), "chip", AT_JUDGE, 0.15);
arm(r3(T[34] - 0.2), "chip", "R", CHIP_UP, 0.3, "out"); grip(r3(T[34] - 0.1), "chip", "R", "fist");
say(34);
// 36 WEDGE, arm up, louder: Twenty-five!
look(r3(T[35] - 0.2), "wedge", AT_JUDGE, 0.15); expr(r3(T[35] - 0.35), "wedge", "angry", 0.35);
arm(r3(T[35] - 0.2), "wedge", "L", "up", 0.3, "out"); grip(r3(T[35] - 0.1), "wedge", "L", "fist");
A(r3(T[35] - 0.05), "wedge", "squash", { amount: -0.05, dur: 0.15 }); A(r3(T[35] + 0.3), "wedge", "squash", { amount: 0, dur: 0.2 });
say(35);
// 37 CHIP, outbidding: Thirty!   38 WEDGE, both arms up: LIFE!
expr(r3(T[36] - 0.1), "chip", "angry"); A(r3(T[36] - 0.05), "chip", "squash", { amount: -0.05, dur: 0.12 }); A(r3(T[36] + 0.25), "chip", "squash", { amount: 0, dur: 0.2 });
say(36);
arm(r3(T[37] - 0.2), "wedge", "R", "up", 0.25, "out"); grip(r3(T[37] - 0.1), "wedge", "R", "fist");
A(r3(T[37] - 0.05), "wedge", "squash", { amount: -0.07, dur: 0.12 }); A(r3(T[37] + 0.3), "wedge", "squash", { amount: 0, dur: 0.2 });
look(r3(T[37] + 0.1), "chip", [0.6, 0.35], 0.12); expr(r3(T[37] + 0.15), "chip", "shocked");
say(37);
// 37 JUDGE, the gavel high: ENOUGH!  (both flinch, arms down)
vikLook(T[38], VIK_AT_CHIP, "angry");
const S2 = strike(r3(T[38] + 0.1), null, { up: 0.17, gain: 1.6 });
say(38);
for (const w of ["chip", "wedge"]) { A(r3(S2), w, "squash", { amount: -0.08, dur: 0.1 }); A(r3(S2 + 0.25), w, "squash", { amount: 0, dur: 0.25 }); expr(r3(S2), w, "shocked", 0.1); }
for (const [w, sd] of [["chip", "R"], ["wedge", "L"], ["wedge", "R"]]) { grip(r3(S2), w, sd, "open", 0.1); restVia(r3(S2 + 0.05), w, sd, { o: [0.15, 0.7, 0.3] }, 0.45, 0.65); }
see(T[38], r3(S2 + 0.5), ["vik.face", "chip.face", "wedge.face"], "ENOUGH: the gavel, both flinch");
// 40 JUDGE: Case dismissed. Go home.  (tok on "dismissed", the board flips to 0 YEARS: the worst sentence for them)
// (Jonny 20 Nov 20:10 Berlin: "in the end the judge should just send them home"; 20:11 "chip and wedge should be upset about it")
A(r3(T[39] - 0.1), "vik", "expr", { expr: "smug", dur: 0.2 }); look(r3(T[39] - 0.1), "vik", [0.85, -0.45], 0.2);
say(39);
look(r3(T[39] + 0.45), "vik", [-0.3, -0.3], 0.15); look(r3(T[39] + 1.15), "vik", [0.85, -0.45], 0.15);
const S3 = strike(r3(T[39] + 0.6), 2);
for (const w of ["chip", "wedge"]) { expr(r3(S3 + 0.1), w, "shocked", 0.12); look(r3(S3 + 0.1), w, AT_JUDGE, 0.12); }
see(T[39], r3(S3 + 0.6), ["vik.face", "board"], "case dismissed: the board flips to 0 YEARS");
// 41 CHIP, horrified: Home?!
expr(r3(T[40] - 0.15), "chip", "terrified"); A(r3(T[40] - 0.05), "chip", "squash", { amount: 0.06, dur: 0.15 }); A(r3(T[40] + 0.35), "chip", "squash", { amount: 0, dur: 0.25 });
say(40);
// 42 WEDGE, heartbroken, a hand to his cheek: No dental...
expr(r3(T[41] - 0.15), "wedge", "sad"); look(r3(T[41] - 0.15), "wedge", [-0.2, -0.6], 0.25);
arm(r3(T[41] - 0.2), "wedge", "L", "cheeks", 0.4); A(r3(T[41]), "wedge", "pitch", { to: 10, dur: 0.5 });
A(r3(T[41] + 0.1), "wedge", "face", { lid: 0.5, dur: 0.3 });
say(41);
// 43 CHIP, wailing, pleading to the judge: But I pay rent there!   CUT as they slump.
expr(r3(T[42] - 0.15), "chip", "sad"); look(r3(T[42] - 0.15), "chip", [-0.7, 0.75], 0.2);
arm(r3(T[42] - 0.2), "chip", "R", { o: [0.18, 0.5, 0.36] }, 0.35); grip(r3(T[42] - 0.1), "chip", "R", "open");
say(42);
rest(r3(END_OF(42) - 0.1)); A(r3(END_OF(42) - 0.2), "chip", "squash", { amount: 0.07, dur: 0.5 }); A(r3(END_OF(42) - 0.15), "chip", "pitch", { to: 10, dur: 0.5 }); A(r3(END_OF(42)), "chip", "face", { lid: 0.4, dur: 0.45 });   // the body drops first, the face with it (Sol r2 #10)
const END = F(END_OF(42) + 0.65);
see(T[40], END, ["chip.face", "wedge.face"], "sent home, both are crushed: no dental, and home has rent");

// ---------------------------------------------------------------- cameras: every shot moves (Jonny 20 Nov 09:44)
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const WIDE = { pos: [0.35, 1.45, 9.6], look: [0.35, 1.3, 0], fov: 34 };   // all three whole with the board at x 0.3 (camfit)   // the accomplice in frame
const CHIP_MED = { pos: [-0.22, 0.55, 3.54], look: [0.32, 0.55, 1.2], fov: 30 };   // camfit: caption top 250 clear
const VIK_MED = { pos: [0.45, 2.05, 2.08], look: [-0.8, 2.05, -0.48], fov: 32 };   // aimed left of him: both eyes clear of the edge (Sol r1 #21)   // camfit: caption top 250 clear
const VIK_LOW = { pos: [-0.25, 2.05, 2.29], look: [-0.8, 2.05, -0.48], fov: 32 };   // camfit: caption top 250 clear
const TWO = { pos: [-1.2, 0.8, 4.8], look: [0.6, 0.9, 1], fov: 34 };   // camfit search: his sprout clear of the accomplice's eyes, the wave in frame (Sol r1 #9)   // camfit: caption top 250 clear
const CHIP_CLOSE = { pos: [-0.1, 0.65, 3.56], look: [0.32, 0.65, 1.2], fov: 28 };   // camfit: caption top 250 clear
const END_SHOT = { pos: [0.53, 0.7, 3.59], look: [0.32, 0.55, 1.2], fov: 28 };   // camfit: caption top 250 clear; no board corner behind the caption
const WHISPER = { pos: [-1.2, 0.8, 5.4], look: [0.6, 0.9, 1], fov: 34 };   // camfit search: the accomplice's face clear of his head (Sol r1 #8)   // the two of them, the accomplice at his shoulder
const PAIR = { pos: [-1.2, 1.1, 5.4], look: [0.8, 0.9, 1], fov: 38 };   // camfit search: both faces + the accomplice's raised hands (Sol r1 #4)   // side by side; camfit: caption top 250 clear, looking down: the board out of the caption
const WEDGE_SAD = { pos: [-0.68, 0.85, 4.39], look: [1.22, 0.85, 1.1], fov: 30 };   // the accomplice's face for "No dental..." (camfit)
const STRIKE = { pos: [-1.3, 1.6, 6], look: [-0.3, 1.4, -0.2], fov: 42 };   // camfit: the judge, the gavel on the block, the whole board and the little one; the accomplice fully out (Sol r1 #1, #26)
const COURT = { pos: [1.5, 1.6, 7], look: [0.2, 1.4, -0.2], fov: 46 };   // camfit search: the gavel on the block, the judge, the board and both of them (Sol r1 #2, #3, #22)
const HOME = { pos: [-0.25, 0.65, 3.56], look: [0.2, 0.65, 1.2], fov: 28 };   // aimed left of him: no sliver of the accomplice at the right edge (Sol r2 #17)
const THANKS = { pos: [-0.35, 0.6, 4.2], look: [0.05, 0.55, 1.2], fov: 34 };   // room on screen-left for the offered glove (Sol r1 #7)
const cutAt = (i) => r3(T[i] - 0.05);
const beats = c.beats([
  ["charge", 0, push(WIDE, 0.06, T[1]), "hook"],
  ["thank you", cutAt(1), push(THANKS, 0.07, 1.6)],
  ["why this bank", cutAt(2), push(VIK_MED, 0.06, 1.3)],
  ["passionate", cutAt(3), drift(CHIP_MED, -0.1, 1.8)],
  ["alone", cutAt(4), push(VIK_LOW, 0.06, 1.3)],
  ["team of two", cutAt(5), drift(TWO, 0.15, 1.9)],
  ["the money", cutAt(6), push(VIK_MED, 0.05, 1.3)],
  ["invested", cutAt(7), push(TWO, 0.05, 1.8)],
  ["the vault", cutAt(8), push(VIK_LOW, 0.07, 1.9)],
  ["work too hard", cutAt(9), push(THANKS, 0.07, 1.9)],   // the shrug in frame (Sol r2 #12)
  ["ten years", cutAt(10), push(COURT, 0.05, 1.6), "escalation"],
  ["ten?", cutAt(11), push(CHIP_CLOSE, 0.06, 2.4)],
  ["fifteen", cutAt(13), drift(WHISPER, 0.12, 3.2)],
  ["more years", cutAt(15), push(VIK_MED, 0.07, 1.8)],
  ["included", cutAt(16), drift(CHIP_MED, -0.08, 1.0)],
  ["included?", cutAt(17), push(VIK_LOW, 0.05, 0.9)],
  ["meals", cutAt(18), push(CHIP_CLOSE, 0.05, 1.2)],
  ["three a day", cutAt(19), push(VIK_LOW, 0.05, 1.8)],   // the judge answers on screen (Sol r1 #12)
  ["a room", cutAt(20), push(COURT, 0.05, 1.5)],
  ["uniform", cutAt(22), push(CHIP_MED, 0.06, 1.2)],
  ["orange", cutAt(23), push(VIK_MED, 0.05, 1.2)],
  ["great in orange", cutAt(24), drift(TWO, 0.1, 1.6)],
  ["rent", cutAt(25), push(CHIP_CLOSE, 0.05, 1.0)],
  ["no rent", cutAt(26), push(VIK_MED, 0.08, 1.0)],
  ["no rent!", cutAt(27), push(WHISPER, 0.05, 1.2), "escalation"],
  ["apply", r3(END_OF(27) + 0.2), push(PAIR, 0.06, T[29] - END_OF(27))],
  ["accomplice", cutAt(29), push(VIK_LOW, 0.07, 1.6)],
  ["dental", cutAt(30), push(PAIR, 0.05, 1.5)],
  ["nurse", cutAt(31), push(VIK_MED, 0.04, 1.4)],
  ["fifteen deal", cutAt(32), drift(PAIR, 0.1, 1.8)],
  ["he gets fifteen", cutAt(33), drift(PAIR, -0.08, 2.6)],
  ["twenty-five", cutAt(35), push(PAIR, 0.08, 1.3)],
  ["thirty", cutAt(36), push(THANKS, 0.08, 0.8)],   // wider: the raised fist stays whole (Sol r2 #4)
  ["life", cutAt(37), push(PAIR, 0.04, 0.8)],
  ["enough", cutAt(38), push(COURT, 0.06, 1.4)],   // the gavel and both flinching in one frame (Sol r1 #3)
  ["go home", cutAt(39), push(STRIKE, 0.05, 2.6), "payoff"],
  ["home?!", cutAt(40), push(HOME, 0.08, 0.9)],
  ["no dental", cutAt(41), push(WEDGE_SAD, 0.07, 1.6)],
  ["rent there", cutAt(42), push(END_SHOT, 0.08, END - cutAt(42))],
], END);

write(import.meta.url, {
  id: "interview-trial",
  title: "He nailed his trial like a job interview",
  idea: "Potato Desk 12: a robber answers every court question like a job interview, then negotiates his sentence like a salary (prison has meals, a room, no rent); his accomplice applies too; the judge sends them both home, where they pay rent.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [55, 70] },
  hook: { show: ["vik", "chip", "cv", "board"], hint: 0, what: "a judge charges a little potato in a tie holding up a CV; the board says ? YEARS" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
  ],
  notes: "Generated by storyboards/series/potato-desk/12-interview-trial/make-interview-trial.mjs.",
});
