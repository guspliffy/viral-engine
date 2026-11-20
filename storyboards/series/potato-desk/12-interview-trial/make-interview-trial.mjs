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
// so the judge gives ten years, so he asks if that is full time. Cut on the line.
// Same set, board, judge and voices as 05 Court Day / 07 Credit for the crime. Not a counter: the board is only the
// stake (? YEARS from frame 0, 10 YEARS on the verdict). Every shot moves, a new framing per line (Jonny 20 Nov 09:44).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => r3(Math.round(t * 15) / 15);

// measured spoken lengths (node qa/lines.mjs desk12-voice-probe.json), in LINES order
const DUR = [1.74, 0.85, 1.2, 1.37, 1.25, 1.16, 0.9, 1.2, 1.49, 1.92, 1.18, 0.96];
// the pause before each line: a volley, a beat before the verdict and before the last line
const GAP = [0.1, 0.2, 0.2, 0.15, 0.2, 0.15, 0.2, 0.15, 0.25, 0.15, 0.45, 0.35];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (Court Day's floor: x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
const CHIP0 = [0.32, 1.2], WEDGE0 = [1.5, -0.1];
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
const GREST = [-1.12, DECK + 0.06, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", [-0.5, DECK, -0.08], 8) };
// the CV: held up in his left hand from frame 0 to the end, its print turned to the judge (never moves: a held prop that
// turns with the body flips the palm, lunch trial lesson)
const CV_AT = (() => { const p = fwd(CHIP0, D_YAW, 0.2, 0.19); return [p[0], 0.2, p[1]]; })();
const CV = { id: "cv", kind: "cvsheet", away: true, ...grips.placeFor("cvsheet", CV_AT, D_YAW) };
const TIE = { id: "tie", kind: "necktie", wear: "chip", x: 0, y: 0.34, z: 0.24, len: 0.15, color: "#24324a", stripe: "#d9b24a" };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 3.8, h: 4.24 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true },
  { id: "board", staged: "screwed to the back wall", kind: "sentenceboard", x: 0.66, y: 2.01, z: -1.255,
    states: ["?", "10"], units: ["YEARS", "YEARS"], headers: ["SENTENCE", "SENTENCE"] },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, bar: [CHIP0[0], CHIP0[1] - 0.12, 0.34, 0.09], queue: [] },
  GAVEL, MUG, CV, TIE,
];

// captions: upper third (rows ~250-350, as 10 Lunch trial); the first line sits under the in-app label's band (0-3 s)
const SUB = 250, SUB0 = 470;
const CAPTEXT = { 10: "*Ten years.*", 11: "Is that *full time?*" };
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? line, i === 0 ? SUB0 : SUB, false, { size: 64 });
};

const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const gcv = grips.phone(c, "chip", CV, { side: "L" });
const strike = (t, flipTo, { up = 0.2, gain = 1.3 } = {}) => {
  t = F2(t);
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], 0.2, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.08, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) { c.prop(r3(e - 0.01), "board", { flip: flipTo }, 0.2); sfx(r3(e + 0.06), "kenney/switch", { gain: 0.45 }); }
  return e;
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2, blink) => A(t, who, "look", { to, dur, ...(blink === false && { blink: false }) });
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });

// ---------------------------------------------------------------- frame 0
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
for (const [who, y] of [["chip", D_YAW], ["wedge", W_YAW]]) A(0, who, "turn", { to: y, dur: 0.01 });
c.prop(0, "board", { flip: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
c.arm(0, "chip", "L", { prop: "cv", grip: gcv.hands.L.grip, palm: true }, 0); A(0, "chip", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "chip", "grab", { prop: "cv", hand: "L", grip: gcv.hands.L.grip, dur: 0, pose: null });
look(0, "vik", VIK_AT_CHIP, 0.01, false);
look(0, "chip", AT_JUDGE, 0.01, false); expr(0, "chip", "delighted", 0.01);
look(0, "wedge", AT_JUDGE, 0.01, false);
act.blinksAt(c, "vik", [3.6, 9.4, 13.9]);
act.blinksAt(c, "chip", [5.2, 12.1]);
act.blinksAt(c, "wedge", [2.4, 7.9, 14.6]);
see(0, END_OF(0), ["vik.face", "chip.face", "cv", "board"], "a judge charges a little potato in a tie who holds up a CV; ? YEARS");

// 1 JUDGE: You robbed a bank.
say(0);
// 2 CHIP, beaming, right hand out for a handshake: Thank you for having me!
arm(r3(T[1] - 0.3), "chip", "R", { o: [0.14, 0.42, 0.5] }, 0.4, "out"); grip(r3(T[1] - 0.15), "chip", "R", "open");
A(r3(T[1] - 0.2), "chip", "squash", { amount: -0.04, dur: 0.25 });
say(1);
look(r3(T[1] + 0.4), "vik", VIK_AT_HAND, 0.25);   // the judge stares at the offered hand
A(r3(T[1] + 0.5), "vik", "expr", { expr: "deadpan", dur: 0.25 });
see(T[1], END_OF(1), ["chip.face", "cv"], "he offers the judge a handshake, CV up");
// 3 JUDGE: Why this bank?
arm(r3(END_OF(1) + 0.1), "chip", "R", "rest", 0.4); A(r3(END_OF(1) + 0.1), "chip", "squash", { amount: 0, dur: 0.25 });
look(r3(T[2] - 0.15), "vik", VIK_AT_CHIP, 0.2); A(r3(T[2] - 0.1), "vik", "expr", { expr: "stern", dur: 0.25 });
say(2);
// 4 CHIP, hand on his heart: I'm passionate about money.
arm(r3(T[3] - 0.25), "chip", "R", { o: [-0.1, 0.34, 0.28] }, 0.4); grip(r3(T[3] - 0.15), "chip", "R", "open");
expr(r3(T[3] - 0.1), "chip", "kind", 0.2); A(r3(T[3] + 0.2), "chip", "face", { lid: 0.6, dur: 0.25 }); A(r3(END_OF(3) - 0.2), "chip", "face", { lid: 0, dur: 0.2 });
say(3);
// 5 JUDGE: Did you act alone?
arm(r3(END_OF(3) + 0.05), "chip", "R", "rest", 0.4); expr(r3(END_OF(3) + 0.05), "chip", "delighted", 0.2);
say(4);
// 6 CHIP thumbs back at his accomplice, who waves, proud: I led a team of two.
arm(r3(T[5] - 0.15), "chip", "R", { o: [0.3, 0.3, -0.05] }, 0.4); grip(r3(T[5] - 0.05), "chip", "R", "point");
A(r3(T[5] - 0.15), "chip", "turn", { to: D_YAW + 18, dur: 0.3 });
look(r3(T[5] + 0.3), "vik", VIK_AT_WEDGE, 0.25);
look(r3(T[5] + 0.35), "wedge", [-0.5, 0.25], 0.15);
arm(r3(T[5] + 0.45), "wedge", "L", "up", 0.35, "out"); expr(r3(T[5] + 0.45), "wedge", "delighted", 0.2);
for (let k = 0; k < 3; k++) A(r3(T[5] + 0.8 + k * 0.22), "wedge", "arm", { side: "L", pose: { o: [k % 2 ? 0.34 : 0.22, 0.95, 0.06] }, dur: 0.2 });
arm(r3(END_OF(5) + 0.35), "wedge", "L", "rest", 0.5);
say(5);
see(T[5], END_OF(5), ["chip.face", "wedge.face"], "his team of two: the accomplice waves");
// 7 JUDGE (sharper): Where is the money?
arm(r3(T[6] - 0.1), "chip", "R", "rest", 0.4); A(r3(T[6] - 0.1), "chip", "turn", { to: D_YAW, dur: 0.3 });
look(r3(T[6] - 0.15), "vik", VIK_AT_CHIP, 0.2); A(r3(T[6] - 0.05), "vik", "expr", { expr: "angry", dur: 0.2 });
A(r3(T[6] + 0.05), "vik", "lean", { to: 10, dur: 0.35 });
say(6);
// 8 CHIP straightens his tie, smooth: I invested in myself.  (the accomplice looks at the tie, then down at his own sweater)
arm(r3(T[7] - 0.3), "chip", "R", { o: [-0.04, 0.36, 0.24] }, 0.35); grip(r3(T[7] - 0.15), "chip", "R", "pinch");
A(r3(T[7] + 0.25), "chip", "arm", { side: "R", pose: { o: [-0.04, 0.39, 0.24] }, dur: 0.25 });
A(r3(T[7] + 0.5), "chip", "arm", { side: "R", pose: { o: [-0.04, 0.36, 0.24] }, dur: 0.25 });
expr(r3(T[7] - 0.1), "chip", "smug", 0.2); A(r3(T[7] + 0.1), "chip", "pitch", { to: -6, dur: 0.3 });
look(r3(T[7] + 0.2), "wedge", [-0.55, -0.35], 0.2, false);
look(r3(END_OF(7) - 0.2), "wedge", [0, -0.75], 0.25, false); expr(r3(END_OF(7) - 0.2), "wedge", "sad", 0.3);
say(7);
see(T[7], END_OF(7) + 0.3, ["chip.face", "tie", "wedge.face"], "he straightens his new tie; his accomplice has none");
// 9 JUDGE (tired): Why were you still in the vault?
arm(r3(END_OF(7) + 0.05), "chip", "R", "rest", 0.4); A(r3(END_OF(7) + 0.05), "chip", "pitch", { to: 0, dur: 0.3 });
A(r3(T[8] - 0.2), "vik", "lean", { to: 0, dur: 0.4 }); A(r3(T[8] - 0.2), "vik", "expr", { expr: "deadpan", dur: 0.25 });
A(r3(T[8] + 0.1), "vik", "face", { lid: 0.45, dur: 0.3 });
say(8);
// 10 CHIP, a modest shrug: Honestly? I work too hard.
expr(r3(T[9] - 0.1), "chip", "kind", 0.2); arm(r3(T[9] + 0.6), "chip", "R", "shrug", 0.35); A(r3(T[9] + 0.6), "chip", "face", { tilt: 0.5, dur: 0.3 });
arm(r3(END_OF(9) + 0.1), "chip", "R", "rest", 0.35); A(r3(END_OF(9) + 0.1), "chip", "face", { tilt: 0, dur: 0.3 });
look(r3(T[9] + 0.3), "wedge", [-0.5, 0.2], 0.2); expr(r3(T[9] + 0.3), "wedge", "kind", 0.3);
say(9);
// 11 JUDGE, gavel: Ten years.  (tok on "years", the board flips ? -> 10)
A(r3(T[10] - 0.2), "vik", "face", { lid: 0, dur: 0.15 }); A(r3(T[10] - 0.2), "vik", "expr", { expr: "stern", dur: 0.2 });
say(10);
const S1 = strike(r3(T[10] + 0.35), 1);
A(r3(S1 + 0.05), "wedge", "expr", { expr: "shocked", dur: 0.15 });
see(T[10], r3(S1 + 0.5), ["vik.face", "board"], "ten years: the board flips to 10 YEARS");
// 12 CHIP, hopeful, leaning in, CV still up: Is that full time?   CUT on the line.
expr(r3(T[11] - 0.15), "chip", "eager", 0.2); A(r3(T[11] - 0.1), "chip", "squash", { amount: -0.05, dur: 0.25 });
look(r3(T[11] - 0.15), "chip", [-0.7, 0.75], 0.2);
say(11);
const END = F(END_OF(11) + 0.4);
see(T[11], END, ["chip.face", "cv"], "he asks if ten years is full time");

// ---------------------------------------------------------------- cameras: every shot moves (Jonny 20 Nov 09:44)
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const WIDE = { pos: [0.25, 1.45, 9.6], look: [0.25, 1.3, 0], fov: 28 };   // the accomplice in frame
const CHIP_MED = { pos: [-0.22, 0.55, 3.54], look: [0.32, 0.55, 1.2], fov: 30 };   // camfit: caption top 250 clear
const VIK_MED = { pos: [0.45, 2.05, 2.08], look: [-0.69, 2.05, -0.48], fov: 32 };   // camfit: caption top 250 clear
const VIK_LOW = { pos: [-0.25, 2.05, 2.29], look: [-0.69, 2.05, -0.48], fov: 32 };   // camfit: caption top 250 clear
const TWO = { pos: [-1.21, 0.7, 3.55], look: [0.85, 0.7, 0.6], fov: 32 };   // camfit: caption top 250 clear
const CHIP_CLOSE = { pos: [-0.1, 0.65, 3.56], look: [0.32, 0.65, 1.2], fov: 28 };   // camfit: caption top 250 clear
const VERDICT = { pos: [0.15, 1.85, 5.0], look: [0.1, 1.75, -0.6], fov: 36 };
const END_SHOT = { pos: [0.53, 0.7, 3.59], look: [0.32, 0.55, 1.2], fov: 28 };   // camfit: caption top 250 clear; no board corner behind the caption
const cutAt = (i) => r3(T[i] - 0.05);
const beats = c.beats([
  ["charge", 0, push(WIDE, 0.06, T[1]), "hook"],
  ["thank you", cutAt(1), push(CHIP_MED, 0.07, 1.6)],
  ["why this bank", cutAt(2), push(VIK_MED, 0.06, 1.3)],
  ["passionate", cutAt(3), drift(CHIP_MED, -0.1, 1.8)],
  ["alone", cutAt(4), push(VIK_LOW, 0.06, 1.3)],
  ["team of two", cutAt(5), drift(TWO, 0.15, 1.9), "escalation"],
  ["the money", cutAt(6), push(VIK_MED, 0.05, 1.3)],
  ["invested", cutAt(7), push(TWO, 0.05, 1.8)],
  ["the vault", cutAt(8), push(VIK_LOW, 0.07, 1.9)],
  ["work too hard", cutAt(9), push(CHIP_CLOSE, 0.07, 1.9)],
  ["ten years", cutAt(10), push(VERDICT, 0.08, 1.3), "payoff"],
  ["full time", cutAt(11), push(END_SHOT, 0.08, END - cutAt(11))],
], END);

write(import.meta.url, {
  id: "interview-trial",
  title: "He nailed his trial like a job interview",
  idea: "Potato Desk 12: a robber answers every court question like a job interview; ten years, is that full time?",
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
  creative: { length: [18, 30] },
  hook: { show: ["vik", "chip", "cv", "board"], hint: 0, what: "a judge charges a little potato in a tie holding up a CV; the board says ? YEARS" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
  ],
  notes: "Generated by storyboards/series/potato-desk/12-interview-trial/make-interview-trial.mjs.",
});
