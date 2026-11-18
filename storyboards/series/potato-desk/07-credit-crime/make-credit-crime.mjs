// POTATO DESK 07 "Credit for the crime" (joke room finalist, Jonny 18 Nov 2026: panels OK'd, "build it" 19:58 Berlin).
// Story + panels: /mnt/project-files/videos/potato-desk/credit-for-the-crime/ (STORY.md, sheets/credit-crime-sheet-*.png).
//   node storyboards/series/potato-desk/07-credit-crime/make-credit-crime.mjs -> credit-crime.json
//
// Hook (on trial): on screen "He demanded credit for the crime" (Jonny adds it in the app), caption question "Why would
// anyone want credit for a crime?". The ending releases it: the little one argues himself from 1 YEAR to LIFE, then
// "...I was just helping"; the big one steps aside, "He's the boss", and gets the helper's 1 year: "Thank you!".
// Chain: the judge gives the helper 1 year, so the little one is offended, so he proves he planned it, so 10 years; his
// friend helps him brag, so he claims everything, so LIFE; so he hides behind his friend, so his friend steps aside and
// names him the boss, so the friend becomes the helper, so 1 year for him and a thank-you.
// Jonny 18 Nov 20:00: no character names in any line (the audience doesn't know them).
// Opener A (the trial is running at frame 0: the judge's line and the 0 YEARS board are up from 0.0 s).
// Same set, board, judge, camera and caption band as 05 Court Day (make-court-day.mjs); the board's last state is the word
// LIFE (spec.states/units, #258). Departures: captions upper third (Jonny 12 Nov), no baked title (in-app).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => r3(Math.round(t * 15) / 15);   // on the 2-frame grid animeTiming draws (clip-lessons: odd-frame shifts move the drawn frames)

// measured spoken lengths (node qa/lines.mjs desk07-voice-probe.json, 18 Nov 2026), in LINES order
const DUR = [1.26, 1.82, 0.78, 1.39, 1.23, 2.89, 1.88, 1.35, 1.28, 1.05, 1.09, 2.47, 0.74];
// the pause before each line (Jonny 17 Nov: pace up). 9 ("...I was just helping") waits for the cut-in.
const GAP = [0.05, 0.15, 0.3, 0.15, 0.15, 0.2, 0.25, 0.15, 0.25, 0.3, 0.3, 0.2, 0.15];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const shift = (from, by) => { for (let k = from; k < T.length; k++) T[k] = r3(T[k] + by); };

// ---------------------------------------------------------------- places (Court Day's floor: x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
const WEDGE0 = [0.05, 0.95], WEDGE_ASIDE = [-0.4, 1.45];   // he steps aside to the front-left, clear of the little one
const CHIP0 = [0.7, 1.7], CHIP_FWD = [0.6, 1.8], CHIP_VIA = [0.95, 1.05], CHIP_HIDE = [0.66, 0.32];   // the hide: half behind the big one, peeking
const D_YAW = -20, CHIP_TO_WEDGE = -50, WEDGE_TO_CHIP = 30;
// looks: [x, y] of the eyes (+x screen right, +y up)
const AT_JUDGE = [-0.8, 0.55], AT_US = [0, 0.05], AT_BOARD = [0.05, 0.9];
const VIK_AT_WEDGE = [0.45, -0.4], VIK_AT_CHIP = [0.65, -0.5], VIK_AT_HIDE = [0.4, -0.55];

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: 8, expr: "stern", follow: 0.2, seed: 1.7 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: D_YAW, expr: "sad", follow: 0.3, seed: 3.1 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: D_YAW, expr: "kind", follow: 0.4, seed: 2.3 },
];

const at3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
const GREST = [-1.12, DECK + 0.06, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
const MUG_AT = [-0.5, DECK, -0.08];
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", MUG_AT, 8) };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 3.8, h: 4.24 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true },
  { id: "board", staged: "screwed to the back wall", kind: "sentenceboard", x: 0.66, y: 2.01, z: -1.255,
    states: ["0", "1", "10", "LIFE"], units: ["YEARS", "YEAR", "YEARS", ""] },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, bar: [0.45, 1.1, 0.34, 0.09], queue: [] },
  GAVEL, MUG,
];

// captions: upper third, under the band the in-app title takes; numbers as digits, the sentence in colour
const SUB = 470;
const CAPTEXT = { 1: "And you just helped. *1 YEAR.*", 5: "So you planned it. *10 YEARS.*", 7: "Thank you! I'm the *boss!*", 8: "The boss gets *LIFE.*", 11: "Then you're the helper. *1 YEAR.*" };
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};

const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const strike = (t, flipTo, { up = 0.16, gain = 1.2 } = {}) => {
  t = F2(t);
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], up > 0.2 ? 0.3 : 0.16, "out");
  e = gv.carry(r3(e + 0.03), GREST, up > 0.2 ? 0.1 : 0.07, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) { c.prop(r3(e - 0.01), "board", { flip: flipTo }, 0.2); sfx(r3(e + 0.06), "kenney/switch", { gain: 0.45 }); }
  return e;
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const step = (t, who, to, dur) => A(t, who, "move", { to, dur });   // the default ease: feet plant (stance-slide)

// ---------------------------------------------------------------- frame 0
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
for (const who of ["chip", "wedge"]) A(0, who, "turn", { to: D_YAW, dur: 0.01 });
c.prop(0, "board", { flip: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
A(0, "vik", "look", { to: VIK_AT_WEDGE, dur: 0.01, blink: false });
A(0, "chip", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "wedge", "look", { to: [-0.3, -0.3], dur: 0.01, blink: false });   // eyes down, sheepish
act.blinksAt(c, "vik", [3.4, 10.2, 17.6, 24.1]);
act.blinksAt(c, "chip", [5.1, 12.9]);
act.blinksAt(c, "wedge", [2.6, 9.4, 16.1, 23.0]);
see(0, END_OF(0), ["vik.face", "wedge.face", "chip.face", "board"], "the judge tells the big one he planned the robbery; 0 YEARS");

// 1 JUDGE (to the big one): You planned the robbery.
say(0);
// 2 JUDGE (to the little one): And you just helped. One year.  (tok, 1 YEAR; the little one is offended, not relieved)
A(r3(T[1] - 0.2), "vik", "look", { to: VIK_AT_CHIP, dur: 0.2 });
say(1);
const S1 = strike(r3(T[1] + DUR[1] - 0.45), 1);
A(r3(S1 + 0.05), "chip", "expr", { expr: "annoyed", dur: 0.15 });
A(r3(S1 + 0.05), "wedge", "expr", { expr: "kind", dur: 0.3 });
see(T[1], r3(S1 + 0.6), ["vik.face", "board", "chip.face"], "1 YEAR; the little one is offended");
// 3 CHIP steps forward, one finger up: Just helped?!
step(r3(T[2] - 0.25), "chip", CHIP_FWD, 0.45);
arm(r3(T[2] - 0.25), "chip", "R", { o: [0.04, 1.0, 0.14] }, 0.45, "out"); grip(r3(T[2] - 0.1), "chip", "R", "point");
A(r3(T[2] - 0.1), "chip", "expr", { expr: "angry", dur: 0.15 });
say(2);
// 4 CHIP points at his friend: He got lost in the bank!  (the big one scratches his head)
A(r3(T[3] - 0.2), "chip", "turn", { to: CHIP_TO_WEDGE, dur: 0.3 });
A(r3(T[3] - 0.2), "chip", "look", { to: [-0.6, 0.45], dur: 0.2 });
arm(r3(T[3] - 0.2), "chip", "R", { o: [0.22, 0.62, 0.3] }, 0.4);
A(r3(T[3] + 0.2), "wedge", "look", { to: [0.6, -0.2], dur: 0.2, blink: false });
arm(r3(T[3] + 0.3), "wedge", "R", "hat", 0.6); A(r3(T[3] + 0.3), "wedge", "expr", { expr: "happy", dur: 0.3 });
say(3);
// 5 CHIP, hand on chest, chin up: The plan was MINE!  (the judge leans in)
A(r3(T[4] - 0.15), "chip", "turn", { to: D_YAW, dur: 0.3 });
A(r3(T[4] - 0.15), "chip", "look", { to: [-0.6, 0.75], dur: 0.25 });
arm(r3(T[4] - 0.2), "chip", "R", { o: [-0.17, 0.55, 0.3] }, 0.45); grip(r3(T[4] - 0.15), "chip", "R", "open");
A(r3(T[4] - 0.1), "chip", "expr", { expr: "cocky", dur: 0.2 });
arm(r3(T[4]), "wedge", "R", "rest", 0.6); A(r3(T[4]), "wedge", "look", { to: AT_JUDGE, dur: 0.25, blink: false });
A(r3(T[4] + 0.6), "vik", "lean", { to: 12, dur: 0.5, ease: "inOut" }); A(r3(T[4] + 0.6), "vik", "expr", { expr: "focused", dur: 0.3 });
say(4);
// 6 JUDGE: So you planned it. Ten years.  (tok, 10 YEARS; the little one nods proudly, eyes shut, not looking)
A(r3(T[5] - 0.1), "vik", "lean", { to: 0, dur: 0.4, ease: "inOut" }); A(r3(T[5] - 0.1), "vik", "expr", { expr: "stern", dur: 0.3 });
say(5);
const S2 = strike(r3(T[5] + DUR[5] - 0.45), 2);
A(r3(T[5] + 0.4), "chip", "nod", { dur: 0.6 });
A(r3(T[5] + 0.4), "chip", "face", { lid: 0.9, dur: 0.2 }); A(r3(S2 + 0.25), "chip", "face", { lid: 0, dur: 0.2 });
see(T[5], r3(S2 + 0.6), ["vik.face", "board", "chip.face"], "10 YEARS; the little one nods proudly");
// 7 WEDGE, one hand up, eager to help: He even packed my snack!
arm(r3(T[6] - 0.4), "wedge", "L", "up", 0.5, "out"); A(r3(T[6] - 0.25), "wedge", "expr", { expr: "eager", dur: 0.2 });
say(6);
// 8 CHIP turns to him, then arms wide, beaming: Thank you! I'm the boss!
A(r3(T[7] - 0.15), "chip", "turn", { to: CHIP_TO_WEDGE + 25, dur: 0.25 }); A(r3(T[7] - 0.15), "chip", "look", { to: [-0.6, 0.35], dur: 0.2 });
arm(r3(T[7] - 0.15), "chip", "R", "rest", 0.4);
arm(r3(END_OF(6) + 0.1), "wedge", "L", "rest", 0.6); A(r3(END_OF(6) + 0.1), "wedge", "expr", { expr: "happy", dur: 0.3 });
const WIDE_AT = r3(T[7] + 0.75);
A(WIDE_AT, "chip", "turn", { to: D_YAW, dur: 0.3 }); A(WIDE_AT, "chip", "look", { to: [-0.4, 0.6], dur: 0.2 });
arm(WIDE_AT, "chip", "both", { o: [0.3, 0.78, 0.12] }, 0.45, "out"); A(WIDE_AT, "chip", "expr", { expr: "delighted", dur: 0.2 });
A(WIDE_AT, "chip", "squash", { to: -0.06, dur: 0.3 });
say(7);
// 9 JUDGE lifts the gavel high: The boss gets life.  (tok, LIFE; the little one still beaming)
say(8);
const S3 = strike(r3(T[8] + DUR[8] - 0.55), 3, { up: 0.32, gain: 1.4 });
A(r3(S3 + 0.3), "chip", "squash", { to: 0, dur: 0.3 });
see(T[8], r3(S3 + 0.5), ["vik.face", "board", "chip.face"], "LIFE on the board");

// ---------------------------------------------------------------- the cut-in: the little one's smile freezes
const CUT = F2(S3 + 0.45), BACK = F2(CUT + 1.47);   // 1.47 not 1.4: the hide steps land with the feet planted (stance-slide 4.9 cm -> clear, draft 3)
A(r3(CUT + 0.1), "chip", "look", { to: AT_BOARD, dur: 0.3, blink: false });
arm(r3(CUT + 0.35), "chip", "both", "rest", 0.6, "inOut");
A(r3(CUT + 0.3), "chip", "expr", { expr: "shocked", dur: 0.25 });
act.shock(c, r3(CUT + 0.35), "chip", { hold: 0.9 });   // the smile drops: mouth open, eyes wide, brows up
see(CUT, BACK, ["chip.face"], "the little one looks up at LIFE; his smile freezes");
// 10 back in the wide: CHIP hides behind his friend: ...I was just helping.
// he shuffles back without turning his face away (the payoff keeps its faces to us)
A(r3(BACK - 0.15), "chip", "look", { to: [-0.3, 0.2], dur: 0.15 });
A(r3(BACK - 0.05), "chip", "turn", { to: -30, dur: 0.3 });
step(BACK, "chip", CHIP_VIA, 1.1);
step(r3(BACK + 1.1), "chip", CHIP_HIDE, 1.0);
A(r3(BACK + 2.0), "chip", "turn", { to: -10, dur: 0.3 });
A(r3(BACK + 2.0), "chip", "expr", { expr: "terrified", dur: 0.2 }); A(r3(BACK + 2.0), "chip", "look", { to: AT_JUDGE, dur: 0.2 });
A(r3(BACK + 0.3), "wedge", "look", { to: [0.5, -0.3], dur: 0.3 });
A(r3(BACK + 0.2), "vik", "look", { to: VIK_AT_HIDE, dur: 0.4 });
shift(9, r3(BACK + 2.2 - T[9]));
say(9, { soft: true });
// 11 WEDGE steps aside and points at him: He's the boss.
const W1 = r3(END_OF(9) + 0.1);
A(r3(W1 - 0.15), "wedge", "look", { to: [-0.5, 0], dur: 0.15 });
step(W1, "wedge", WEDGE_ASIDE, 1.2);
A(r3(W1 + 1.2), "wedge", "turn", { to: WEDGE_TO_CHIP, dur: 0.35 });
A(r3(W1 + 1.2), "wedge", "look", { to: [0.6, -0.4], dur: 0.2, blink: false });
arm(r3(W1 + 1.2), "wedge", "L", { o: [0.22, 0.42, 0.24] }, 0.7, "inOut");   // pointing down at him, below his face grip(r3(W1 + 1.2), "wedge", "L", "point", 0.7);
A(r3(W1 + 1.3), "wedge", "expr", { expr: "kind", dur: 0.2 });
shift(10, r3(W1 + 1.55 - T[10]));
say(10);
see(r3(W1 + 0.9), END_OF(10), ["wedge.face", "chip.face", "board"], "the big one steps aside and points: he's the boss");
// 12 JUDGE (to the big one): Then you're the helper. One year.   13 WEDGE: Thank you!
A(r3(T[11] - 0.2), "vik", "look", { to: [0.75, -0.35], dur: 0.25 });
A(r3(T[11] - 0.1), "wedge", "look", { to: AT_JUDGE, dur: 0.2, blink: false }); A(r3(T[11] - 0.1), "wedge", "turn", { to: D_YAW, dur: 0.35 });
arm(r3(T[11] + 0.1), "wedge", "L", "rest", 0.9); grip(r3(T[11] + 0.1), "wedge", "L", "open", 0.9);
say(11);
A(r3(END_OF(11) - 0.2), "wedge", "expr", { expr: "delighted", dur: 0.2 });
say(12);
A(r3(T[12] + 0.2), "chip", "look", { to: [-0.7, 0.3], dur: 0.25, blink: false }); A(r3(T[12] + 0.2), "chip", "expr", { expr: "sad", dur: 0.3 });
const END = F(END_OF(12) + 1.1);
see(T[11], END, ["wedge.face", "chip.face", "board"], "the big one gets 1 year and says thank you; the little one under LIFE");

// ---------------------------------------------------------------- the wide + the one cut-in
const WIDE = { pos: [0, 1.45, 10.4], look: [0, 1.45, 0], fov: 26 };
const beats = c.beats([
  ["one year", 0, WIDE, "hook"],
  ["ten years", T[5], "keep"],
  ["life", T[8], "keep", "escalation"],
  ["smile freezes", CUT, { pos: [0.5, 0.5, 4.9], look: [0.6, 0.5, 1.8], fov: 24 }],
  ["just helping", BACK, { ...WIDE }, "payoff"],
], END);

write(import.meta.url, {
  id: "credit-crime",
  title: "He demanded credit for the crime",
  idea: "Potato Desk 07: the little one is offended at being called a helper, argues himself from 1 year to life, and his friend ends up the helper.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [26, 36] },
  hook: { show: ["vik", "wedge", "chip", "board"], hint: 0, what: "a judge sentences two potatoes; the board says 0 YEARS" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
    { who: "chip", with: "wedge", from: r3(BACK + 1.0), to: r3(W1 + 0.8), checks: ["face-hidden", "front"], reason: "the beat: the little one hides behind the big one (panel 11), peeking out" },
  ],
  notes: "Generated by storyboards/series/potato-desk/07-credit-crime/make-credit-crime.mjs.",
});
