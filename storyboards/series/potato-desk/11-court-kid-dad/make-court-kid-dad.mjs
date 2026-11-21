// POTATO DESK 11 "He took his dad to court over one fry" (kid vs dad; Jonny picked it 20 Nov 2026 18:02 Berlin).
// Story + panels: /mnt/project-files/videos/potato-desk/11-court-day-new/ (STORY.md, sheets/kid-dad-sheet-1.png).
// Design of the carton: DESIGN.md here. Court study behind it: /mnt/project-files/research/court-viral-2026-11-20/.
//   node storyboards/series/potato-desk/11-court-kid-dad/make-court-kid-dad.mjs -> court-kid-dad.json
//
// Hook (on trial): on screen "He took his dad to court over one fry." (Jonny adds it in the app), caption question "Does
// your dad steal your fries too?". The ending releases it: daddy tax is outlawed, the kid gets fries back, the judge
// takes one: "Court tax." Cut on it (20 Nov data: whatever plays after the punchline loses viewers).
// Chain: the kid's carton is empty, so he sues; the dad says one, so the judge asks; "one at a time", so why; "daddy
// tax, every dad", so the judge remembers his own dad, so he outlaws it, so the dad must give back the carton he hid
// behind his back from frame 0, so the kid is happy, so the judge (whose dad took his) takes one for the court.
// Retention rules (Jonny 20 Nov): every shot pushes or drifts, a new framing on every line, cut 0.1-0.2 s after each
// action, no silent holds. No names in any line. Plain fries, not alive (Jonny's card, 20 Nov 18:19).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F2 = (t) => r3(Math.round(t * 15) / 15);

// measured spoken lengths (node qa/lines.mjs desk11-voice-probe.json, 20 Nov 2026), in LINES order
const DUR = [1.54, 1.25, 1.25, 0.66, 1.41, 0.44, 1.69, 0.7, 1.7, 2.48, 1.0, 1.77, 1.55, 1.21, 0.85, 2.61, 1.85, 1.76, 0.93, 2.81, 0.73, 0.65, 0.89, 0.7, 1.43, 1.8, 1.59, 1.15, 1.37, 1.62, 0.5, 3.29, 0.96];
// the pause before each line: 3 waits for the empty-box insert, 10 for the fry falling out of the sleeve, 12 for the
// kid dropping his box, 14 for the judge's memory, 16 for the nugget box falling, 26 is set by the last cut
const GAP = [0.05, 0.12, 0.15, 0.95, 0.15, 0.12, 0.1, 0.1, 0.12, 0.12, 1.15, 0.12, 0.15, 1.1, 0.3, 0.12, 0.3, 0.15, 0.12, 0.25, 1.0, 0.12, 0.25, 0.08, 0.1, 0.08, 0.08, 0.08, 0.08, 0.08, 0.1, 0.75, 2.6];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (Court Day floor: x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
const KID0 = [0.12, 1.25], DAD0 = [1.1, 0.95];          // 1 m apart: a gesturing pair (clip-lessons)
const KID_YAW = -35, DAD_YAW = -25, DAD_TO_KID = -70, KID_TO_DAD = 40;
const AT_JUDGE_KID = [-0.75, 0.7], AT_JUDGE_DAD = [-0.8, 0.5];
const VIK_AT_KID = [0.75, -0.55], VIK_AT_DAD = [0.95, -0.45], VIK_TO_KID = 22, VIK_TO_DAD = 30;

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: VIK_TO_KID, expr: "shocked", follow: 0.2, seed: 1.7 },
  { id: "chip", character: "potatobrawl/chip", at: KID0, face: KID_YAW, expr: "angry", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: DAD0, face: DAD_YAW, expr: "kind", follow: 0.3, seed: 3.1 },
];

const at3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
const yawV = (deg, d) => [Math.sin((deg * Math.PI) / 180) * d, Math.cos((deg * Math.PI) / 180) * d];   // a point d ahead of a facing
const GREST = [-1.12, DECK + 0.06, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
// the kid's EMPTY carton at his chest; the dad's FULL one behind his back (hidden from frame 0: the cause of beat 12)
const kf = yawV(KID_YAW, 0.33), kf2 = yawV(KID_YAW, 0.39), db = yawV(DAD_YAW, -0.3);
const KC_CHEST = [r3(KID0[0] + kf[0]), 0.1, r3(KID0[1] + kf[1])];   // low: a carton at a small potato's chest hides his eyes
const EMPTY = { id: "empty", kind: "friescarton", fill: "empty", ...grips.placeFor("friescarton", KC_CHEST, KID_YAW) };
const DC_BACK = [r3(DAD0[0] + db[0] + 0.12), 0.3, r3(DAD0[1] + db[1])];
const FULL = { id: "full", kind: "friescarton", fill: "full", taken: 0, ...grips.placeFor("friescarton", DC_BACK, DAD_YAW) };
const FULL2 = { id: "full2", kind: "friescarton", fill: "full", taken: 0, x: 1.6, y: -3, z: -2.5, rot: 0, staged: "the kid's copy of the dad's box: parked under the floor until the cut where the kid holds it" };
const FRY_PARK = [-0.69, -3, -3];   // under the floor until the judge's pinch closes (DESIGN.md 4: the carton draws it until then)
const df = yawV(DAD_YAW, 0.1), dr = [0.906, 0.423];
const SLEEVE = [0.66, 0.93, 0.84];   // inside his sleeve at the elbow (Sol 1: spawned at the palm it popped in)
const SLEEVE_HAND = [0.5, 0.96, 0.8];   // just under his raised right hand (layout: the hand at 0.47, 1.12, 0.78)
const FRY_LAND = [0.49, 0.86];   // where it comes to rest (layout)
const SLEEVEFRY = { id: "sleevefry", kind: "loosefry", x: 1.2, y: -3, z: -3.4, rot: 0, staged: "parked under the floor until it slides out of the dad's raised sleeve" };
const POCKET = [0, 1, 2].map((k) => [r3(DAD0[0] - dr[0] * (0.33 + k * 0.02) + df[0]), r3(0.4 - k * 0.04), r3(DAD0[1] - dr[1] * 0.33 + df[1])]);   // inside his right hip (dr is his LEFT for this facing; Sol 1: they came out of his left side)
const POCKETFRIES = [0, 1, 2].map((k) => ({ id: `pocket${k}`, kind: "loosefry", x: 1.3 + k * 0.1, y: -3, z: -3.6, rot: 0, staged: "parked under the floor until it falls out of the dad's pocket" }));
const kb = yawV(KID_YAW, 0.2);
const kb2 = yawV(KID_YAW + 70, 0.3);
const NUGAT = [r3(KID0[0] + kb2[0]), 0.12, r3(KID0[1] + kb2[1])];   // under his hoodie's hem, at his side, clear of the carton on the floor (Sol 1)
const NUGGETS = { id: "nuggets", kind: "clambox", x: 0.4, y: -3, z: -3.8, rot: -35, w: 0.13, d: 0.1, h: 0.05, lidH: 0.03, open: 0.6, staged: "parked under the floor until it drops out of the kid's hoodie" };
const FRY2 = { id: "fry2", kind: "loosefry", ...at3([-0.4, -3, -3]), rot: 0, staged: "parked under the floor until the cut to the last shot, where it is the fry at the judge's mouth" };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1, w: 6.4 },   // wider than Court Day: the dad's close-ups looked past its edge (Sol 1)
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 6.4, h: 4.24 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, xs: [-3.0, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 3.0] },
  // the case board: the Court Day board's spot, the case instead of a sentence (no counter in this episode)
  { id: "board", staged: "screwed to the back wall", kind: "officesign", x: 0.66, y: 2.38, z: -1.255, w: 0.62, h: 0.62, frameW: 0.022,
    lines: [["KID", 0.16], ["vs", 0.08], ["DAD", 0.16]], plate: "#1f2a3a", ink: "#e9c46a", frame: "#b08a3c" },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  GAVEL, EMPTY, FULL, FULL2, FRY2, SLEEVEFRY, NUGGETS, ...POCKETFRIES,
];

// captions: upper third
const SUB = 470, CAP0 = 390;   // the opening caption above the KID vs DAD board (Sol 2)
const CAPPOS = { 0: CAP0 };
[4, 6, 8, 11, 13, 15, 17, 23, 25, 27, 29].forEach((i) => { CAPPOS[i] = 560; });   // the dad's shots: under the KID vs DAD board (Sol 1), camfit 470-580
const CAPTEXT = { 2: "I took *ONE.*", 15: "*Daddy tax.* Every dad takes it.", 19: "*Objection!* He ate my nuggets!", 29: "It's in the *constitution!*", 30: "*ORDER!*", 31: "Daddy tax and kid tax are now *illegal.*", 32: "*Court tax.*" };
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB, false, { size: 64 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });

const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const strike = (t, { up = 0.2, gain = 1.3 } = {}) => {
  t = F2(t);
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], 0.22, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.08, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  return e;
};
const kid = grips.box(c, "chip", EMPTY, { gap: 0.03 });
const dad = grips.mug(c, "wedge", FULL, { side: "L", height: 0.33, gap: 0.038 });

// ---------------------------------------------------------------- frame 0: the case is running
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
gv.take(0, { reach: 0.01, settle: 0.01 });
kid.take(0, { reach: 0.01, settle: 0.01 });
dad.take(0, { reach: 0.01, settle: 0.01 });
A(0, "vik", "look", { to: VIK_AT_KID, dur: 0.01, blink: false });
A(0, "vik", "lean", { to: 14, dur: 0.01 });
A(0, "chip", "look", { to: AT_JUDGE_KID, dur: 0.01, blink: false });
A(0, "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.01, blink: false });
const every = (t0, step) => Array.from({ length: Math.floor((T[31] - t0) / step) }, (_, k) => r3(t0 + k * step));
act.blinksAt(c, "vik", every(3.0, 4.1));
act.blinksAt(c, "chip", every(6.4, 4.7));
act.blinksAt(c, "wedge", every(2.4, 3.9));
see(0, END_OF(0), ["vik.face", "chip.face", "wedge.face", "board", "empty"], "a judge leans over to a kid with an empty fries box; his dad beside him");

// 1 JUDGE (leaning over to the kid): You're suing your own dad?
say(0);
A(r3(END_OF(0) - 0.1), "vik", "lean", { to: 0, dur: 0.4 }); A(r3(END_OF(0)), "vik", "expr", { expr: "focused", dur: 0.3 });
// 2 KID lifts the empty carton toward the judge: He ate my fries!
kid.carry(r3(T[1] - 0.1), [r3(KID0[0] + kf2[0]), 0.04, r3(KID0[1] + kf2[1])], 0.3, "out");   // held out to the judge, below his eyes
A(r3(T[1] + 0.3), "chip", "squash", { to: -0.05, dur: 0.2 }); A(r3(END_OF(1)), "chip", "squash", { to: 0, dur: 0.25 });
say(1);
// 3 DAD, free hand up, one finger, easy smile: I took ONE.   (the kid glares up at him)
A(r3(T[2] - 0.15), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.15 });
arm(r3(T[2] - 0.2), "wedge", "R", { o: [0.22, 0.95, 0.12] }, 0.35, "out"); grip(r3(T[2] - 0.1), "wedge", "R", "point");
A(r3(T[2]), "wedge", "expr", { expr: "happy", dur: 0.2 });
kid.carry(r3(T[2] - 0.1), KC_CHEST, 0.35);
A(r3(T[2] + 0.2), "chip", "turn", { to: KID_TO_DAD, dur: 0.3 }); A(r3(T[2] + 0.2), "chip", "look", { to: [0.6, 0.6], dur: 0.2 });
say(2);
// 4 INSERT: the kid turns the carton upside down: nothing falls out (a shake, a paper rattle)
const FLIP = r3(END_OF(2) + 0.1);
A(r3(FLIP - 0.4), "chip", "turn", { to: KID_YAW, dur: 0.45 }); A(FLIP, "chip", "look", { to: [0, -0.2], dur: 0.2 });
kid.carry(FLIP, [r3(KID0[0] + kf2[0]), 0.1, r3(KID0[1] + kf2[1])], 0.45, "inOut", { tip: -70 });   // tipped open toward us: empty inside (a full flip and shakes made the wrist flip and the hold slip)
sfx(r3(FLIP + 0.35), "crinkle", { gain: 0.5 });
const FLIP_END = r3(FLIP + 0.85);
see(FLIP, FLIP_END, ["empty", "chip.face"], "the box is empty: nothing falls out");
// 5 JUDGE, one eyebrow up: One?
kid.carry(r3(T[3] - 0.1), KC_CHEST, 0.45, "inOut", { tip: 0 });
A(r3(T[3] - 0.15), "vik", "look", { to: VIK_AT_DAD, dur: 0.15 }); A(r3(T[3] - 0.3), "vik", "turn", { to: VIK_TO_DAD, dur: 0.55 });
A(r3(T[3]), "vik", "face", { brow: 0.6, dur: 0.15 });
A(r3(T[3]), "chip", "look", { to: AT_JUDGE_KID, dur: 0.2 });
say(3);
// 6 DAD, his smile shrinks, eyes to the side: One at a time.
A(r3(T[4] - 0.1), "wedge", "expr", { expr: "sad", dur: 0.25 }); A(r3(T[4]), "wedge", "look", { to: [0.5, -0.1], dur: 0.25 });
act.sheepish(c, r3(T[4] + 0.2), "wedge");
say(4);
// 7 JUDGE: Why?
A(r3(T[5] - 0.1), "vik", "expr", { expr: "stern", dur: 0.15 }); A(r3(T[5]), "vik", "face", { brow: 0, dur: 0.2 });
say(5);
// 8 DAD, helpful, open hand: I was checking they were hot.
A(r3(T[6] - 0.15), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.2 }); A(r3(T[6]), "wedge", "expr", { expr: "happy", dur: 0.2 });
arm(r3(T[6] - 0.2), "wedge", "R", { o: [0.25, 0.5, 0.3] }, 0.35, "out"); grip(r3(T[6] - 0.1), "wedge", "R", "open");
say(6);
// 9 JUDGE, flat: All of them?
A(r3(T[7] - 0.1), "vik", "face", { brow: 0.5, dur: 0.15 });
say(7);
// 10 DAD, sheepish, the hand comes down: Some were cold.
A(r3(T[8] - 0.1), "wedge", "expr", { expr: "sad", dur: 0.2 }); A(r3(T[8]), "wedge", "look", { to: [0.5, -0.2], dur: 0.25 });
arm(r3(T[8]), "wedge", "R", "rest", 0.45); grip(r3(T[8]), "wedge", "R", "relaxed", 0.3);
act.sheepish(c, r3(T[8] + 0.15), "wedge");
say(8);
// 11 JUDGE, formal: Raise your right hand.   The DAD raises it (palm out, an oath): a fry slides out of his sleeve.
A(r3(T[9] - 0.1), "vik", "expr", { expr: "stern", dur: 0.15 }); A(r3(T[9]), "vik", "face", { brow: 0, dur: 0.2 });
say(9);
const OATH = r3(END_OF(9) + 0.05);
A(r3(OATH - 0.1), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.2 }); A(OATH, "wedge", "expr", { expr: "kind", dur: 0.2 });
arm(OATH, "wedge", "R", { o: [0.24, 0.98, 0.1] }, 0.4, "out"); grip(r3(OATH + 0.05), "wedge", "R", "open");
const SLIDE = r3(OATH + 0.5);
c.prop(r3(SLIDE - 0.02), "sleevefry", { ...at3(SLEEVE), tilt: -45 }, 0.01);   // lying along his forearm inside the sleeve (Sol 2: upright it stood in the air by his hand)
c.drop(SLIDE, "sleevefry", { v: [0.05, -0.3, 0.25], spin: [2, 1, 3] });
sfx(r3(SLIDE + 0.45), "pat", { gain: 0.4 });
A(r3(SLIDE + 0.1), "wedge", "expr", { expr: "shocked", dur: 0.1 }); A(r3(SLIDE + 0.12), "wedge", "look", { to: [0.2, -0.9], dur: 0.15 });
A(r3(SLIDE + 0.15), "chip", "look", { to: [0.6, -0.8], dur: 0.15 });
see(OATH, r3(SLIDE + 0.6), ["wedge.face", "sleevefry"], "the dad swears in with his hand up: a fry falls out of his sleeve");
// 12 JUDGE, dry, looking down at it: Exhibit A.
A(r3(T[10] - 0.2), "vik", "look", { to: [0.9, -0.85], dur: 0.2 }); A(r3(T[10] - 0.2), "vik", "lean", { to: 8, dur: 0.3 });
A(r3(T[10]), "vik", "expr", { expr: "deadpan", dur: 0.15 });
say(10);
see(r3(T[10] - 0.05), END_OF(10), ["vik.face"], "exhibit A: the judge looks down at the fry");
// 13 DAD, hand still up, pleading: That one was looking at me.
A(r3(T[11] - 0.1), "vik", "lean", { to: 0, dur: 0.35 }); A(r3(T[11] - 0.1), "vik", "look", { to: VIK_AT_DAD, dur: 0.15 });
A(r3(T[11] - 0.15), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.15 }); A(r3(T[11]), "wedge", "expr", { expr: "sad", dur: 0.2 });
arm(r3(T[11] + 0.2), "wedge", "R", { o: [0.25, 0.5, 0.3] }, 0.4); grip(r3(T[11] + 0.2), "wedge", "R", "open");
say(11);
// 13b JUDGE: Empty your pockets.   The DAD pats his side: three more fries drop out of his pocket.   DAD: Those were for later.
A(r3(T[12] - 0.1), "vik", "expr", { expr: "stern", dur: 0.15 }); A(r3(T[12] - 0.1), "vik", "face", { brow: 0.4, dur: 0.15 });
say(12);
const POCK = r3(END_OF(12) + 0.1);
A(r3(POCK - 0.1), "wedge", "expr", { expr: "sad", dur: 0.2 }); A(POCK, "wedge", "look", { to: [0.2, -0.8], dur: 0.2 });
arm(POCK, "wedge", "R", { o: [0.3, 0.22, 0.04] }, 0.5); grip(POCK, "wedge", "R", "open", 0.4);
POCKET.forEach((q, k) => { const t = r3(POCK + 0.3 + k * 0.17); c.prop(r3(t - 0.02), `pocket${k}`, at3(q), 0.01); c.drop(t, `pocket${k}`, { v: [r3(-dr[0] * 0.3), -0.2, r3(-dr[1] * 0.3 + 0.1)], spin: [2, k, 3] }); sfx(r3(t + 0.35), "pat", { gain: 0.3 }); });
A(r3(POCK + 0.5), "chip", "look", { to: [0.6, -0.7], dur: 0.15 }); A(r3(POCK + 0.5), "chip", "expr", { expr: "angry", dur: 0.2 });
see(POCK, r3(POCK + 1.0), ["wedge.face", "pocket0", "pocket1", "pocket2"], "more fries fall out of the dad's pocket");
A(r3(T[13] - 0.1), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.15 }); act.sheepish(c, r3(T[13] + 0.1), "wedge");
arm(r3(END_OF(13) + 0.1), "wedge", "R", "rest", 0.6); grip(r3(END_OF(13) + 0.1), "wedge", "R", "relaxed", 0.5);
say(13);
// 14 KID drops the empty box and pleads to the judge, both arms out: Every time!
const DROP = r3(T[14] - 0.25);
const kf4 = yawV(KID_YAW, 0.47);
kid.carry(r3(DROP - 0.3), [r3(KID0[0] + kf4[0]), 0.08, r3(KID0[1] + kf4[1])], 0.25, "out");   // out from his hoodie before he lets go (Sol 1: the cords were inside it)
kid.release(DROP, { rest: false, back: 0.1 });
arm(r3(DROP + 0.12), "chip", "both", { o: [0.3, 0.55, 0.22] }, 0.3, "out"); grip(r3(DROP + 0.12), "chip", "both", "open");
A(r3(DROP), "chip", "expr", { expr: "sad", dur: 0.2 }); A(r3(DROP), "chip", "look", { to: AT_JUDGE_KID, dur: 0.15 });
sfx(r3(DROP + 0.35), "pat", { gain: 0.35 });
say(14);
arm(r3(END_OF(14) + 0.3), "chip", "both", "rest", 0.5);
// 15 DAD, chest out, hand on chest, proud: Daddy tax. Every dad takes it.
A(r3(T[15] - 0.15), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.2 });
arm(r3(T[15] - 0.2), "wedge", "R", { o: [-0.1, 0.4, 0.32] }, 0.4); grip(r3(T[15] - 0.1), "wedge", "R", "open");
A(r3(T[15]), "wedge", "expr", { expr: "smug", dur: 0.2 }); A(r3(T[15] + 0.1), "wedge", "face", { lid: 0.85, dur: 0.2 });
A(r3(T[15] + 0.1), "wedge", "squash", { to: -0.04, dur: 0.3 });
A(r3(T[15] + 1.2), "wedge", "face", { lid: 0, dur: 0.15 }); A(r3(END_OF(15)), "wedge", "squash", { to: 0, dur: 0.25 });
arm(r3(END_OF(15) + 0.1), "wedge", "R", "rest", 0.5); grip(r3(END_OF(15) + 0.1), "wedge", "R", "relaxed", 0.3);
say(15);
see(T[15], END_OF(15), ["wedge.face"], "the dad explains daddy tax, proud");
// 16 JUDGE, slow push, eyes narrow, remembering: My dad took mine too.
A(r3(T[16] - 0.2), "vik", "look", { to: [0.3, -0.1], dur: 0.4 }); A(r3(T[16] - 0.2), "vik", "turn", { to: 10, dur: 0.5 });
A(r3(T[16] - 0.2), "vik", "expr", { expr: "sad", dur: 0.3 }); A(r3(T[16]), "vik", "face", { lid: 0.45, dur: 0.4 });
say(16, { soft: true });
A(r3(END_OF(16)), "vik", "face", { lid: 0, dur: 0.12 });
see(T[16], END_OF(16), ["vik.face"], "the judge remembers his own dad");
// 16b DAD, smug, to the judge: See? Tradition.   JUDGE, cold, eyes open again: Not anymore.
A(r3(T[17] - 0.1), "wedge", "expr", { expr: "smug", dur: 0.2 }); A(r3(T[17]), "wedge", "squash", { to: -0.04, dur: 0.2 });
arm(r3(T[17] - 0.15), "wedge", "R", { o: [0.25, 0.5, 0.3] }, 0.3); grip(r3(T[17] - 0.05), "wedge", "R", "open");
A(r3(END_OF(17)), "wedge", "squash", { to: 0, dur: 0.2 });
say(17);
A(r3(T[18] - 0.15), "vik", "turn", { to: VIK_TO_DAD, dur: 0.3 }); A(r3(T[18] - 0.1), "vik", "look", { to: VIK_AT_DAD, dur: 0.15 });
A(r3(T[18] - 0.1), "vik", "expr", { expr: "angry", dur: 0.15 }); A(r3(T[18]), "vik", "face", { brow: 0, dur: 0.15 });
A(r3(T[18] + 0.1), "wedge", "expr", { expr: "shocked", dur: 0.12 });
arm(r3(T[18] + 0.1), "wedge", "R", "rest", 0.35); grip(r3(T[18] + 0.1), "wedge", "R", "relaxed", 0.25);
say(18);
// 17 the turn: DAD, pointing at the kid: Objection! He ate my nuggets!
A(r3(T[19] - 0.2), "wedge", "turn", { to: DAD_TO_KID, dur: 0.35 }); A(r3(T[19] - 0.15), "wedge", "look", { to: [-0.5, -0.3], dur: 0.15 });
A(r3(T[19]), "wedge", "expr", { expr: "angry", dur: 0.15 });
arm(r3(T[19] - 0.1), "wedge", "R", { o: [0.1, 0.32, 0.46] }, 0.3, "out"); grip(r3(T[19]), "wedge", "R", "point");
A(r3(T[19] - 0.1), "vik", "turn", { to: VIK_TO_DAD, dur: 0.3 }); A(r3(T[19]), "vik", "look", { to: VIK_AT_DAD, dur: 0.15 }); A(r3(T[19]), "vik", "expr", { expr: "shocked", dur: 0.15 });
say(19, {}, r3(END_OF(19) - 0.37));
// 18 the KID freezes; an empty nugget box drops out of the bottom of his hoodie
const NUG = r3(END_OF(19) - 0.05);
A(r3(NUG + 0.05), "chip", "expr", { expr: "terrified", dur: 0.1 });   // the face changes as the box drops, not before (Sol 2) A(r3(END_OF(19) - 0.25), "chip", "look", { to: [0.6, 0.5], dur: 0.15 });
c.prop(r3(NUG - 0.02), "nuggets", at3(NUGAT), 0.01);
c.drop(NUG, "nuggets", { v: [0.15, -0.2, 0.3], spin: [3, 0, 1] });
sfx(r3(NUG + 0.25), "pat", { gain: 0.4 });
A(r3(NUG + 0.1), "chip", "look", { to: [0, -0.9], dur: 0.12 });
see(r3(T[19] + 0.5), r3(NUG + 0.6), ["chip.face", "nuggets"], "the kid freezes: an empty nugget box falls out of his hoodie");
// 19 KID, defensive: I'm growing!
A(r3(T[20] - 0.1), "chip", "look", { to: AT_JUDGE_KID, dur: 0.15 }); A(r3(T[20]), "chip", "expr", { expr: "angry", dur: 0.15 });
arm(r3(T[20] - 0.1), "chip", "both", { o: [0.3, 0.55, 0.22] }, 0.25, "out"); grip(r3(T[20]), "chip", "both", "open");
A(r3(T[20] + 0.1), "chip", "squash", { to: -0.06, dur: 0.15 }); A(r3(END_OF(20)), "chip", "squash", { to: 0, dur: 0.2 });
arm(r3(END_OF(19)), "wedge", "R", "rest", 0.4); grip(r3(END_OF(19) + 0.1), "wedge", "R", "relaxed", 0.3);
A(r3(T[20] - 0.2), "vik", "turn", { to: VIK_TO_KID, dur: 0.35 }); A(r3(T[20] - 0.1), "vik", "look", { to: VIK_AT_KID, dur: 0.15 });
say(20);
// 20 JUDGE, slow: How many?
A(r3(T[21] - 0.1), "vik", "expr", { expr: "focused", dur: 0.2 }); A(r3(T[21]), "vik", "face", { brow: 0.6, dur: 0.15 });
arm(r3(T[21]), "chip", "both", "rest", 0.45);
say(21);
// 21 KID, tiny, eyes to the side: One at a time.   (the dad's own words)
A(r3(T[22] - 0.1), "chip", "expr", { expr: "sad", dur: 0.2 }); A(r3(T[22]), "chip", "look", { to: [0.4, -0.3], dur: 0.25 });
act.sheepish(c, r3(T[22] + 0.15), "chip");
A(r3(T[22]), "vik", "face", { brow: 0, dur: 0.2 });
say(22);
// 22 DAD, arm up: Ha!
A(r3(T[23] - 0.1), "wedge", "expr", { expr: "happy", dur: 0.1 });
arm(r3(T[23] - 0.12), "wedge", "R", { o: [0.22, 0.95, 0.12] }, 0.2, "out"); grip(r3(T[23] - 0.05), "wedge", "R", "fist");
say(23);
// 23-26 the family fight, quick cuts, face to face
A(r3(T[24] - 0.15), "chip", "turn", { to: KID_TO_DAD, dur: 0.25 }); A(r3(T[24] - 0.1), "chip", "look", { to: [0.6, 0.6], dur: 0.12 });
A(r3(T[24]), "chip", "expr", { expr: "angry", dur: 0.12 });
arm(r3(T[24] + 0.4), "wedge", "R", "rest", 0.4); grip(r3(T[24] + 0.4), "wedge", "R", "relaxed", 0.3);
say(24);
A(r3(T[25] - 0.1), "wedge", "expr", { expr: "angry", dur: 0.12 }); A(r3(T[25] - 0.1), "wedge", "look", { to: [-0.5, -0.4], dur: 0.12 });
say(25);
A(r3(T[26]), "chip", "squash", { to: -0.07, dur: 0.12 }); A(r3(END_OF(26)), "chip", "squash", { to: 0, dur: 0.15 });
arm(r3(T[26] - 0.1), "chip", "both", { o: [0.26, 0.36, 0.18] }, 0.2, "out"); grip(r3(T[26]), "chip", "both", "fist");
arm(r3(END_OF(26) + 0.1), "chip", "both", "rest", 0.35);
say(26);
A(r3(T[27] - 0.1), "wedge", "expr", { expr: "smug", dur: 0.12 });
arm(r3(T[27] - 0.1), "wedge", "R", { o: [-0.1, 0.4, 0.32] }, 0.25); grip(r3(T[27]), "wedge", "R", "open");
say(27);
A(r3(T[28] - 0.1), "chip", "expr", { expr: "angry", dur: 0.12 }); A(r3(T[28]), "chip", "squash", { to: -0.07, dur: 0.12 }); A(r3(END_OF(28)), "chip", "squash", { to: 0, dur: 0.15 });
say(28);
A(r3(T[29] - 0.1), "wedge", "expr", { expr: "smug", dur: 0.12 });
arm(r3(T[29] - 0.1), "wedge", "R", { o: [0.22, 0.95, 0.12] }, 0.25, "out"); grip(r3(T[29]), "wedge", "R", "point");
say(29);
// 27 JUDGE, gavel: ORDER!   (both jump and turn back to him)
A(r3(T[30] - 0.1), "vik", "expr", { expr: "angry", dur: 0.1 });
const S0 = strike(r3(T[30] - 0.05), { up: 0.2, gain: 1.5 });
const SHAKES = [{ do: "shake", at: r3(S0 - 0.02), dur: 0.35, amp: 0.025 }];   // engine/page/timeline.js sb.fx "shake"
say(30);
A(r3(S0 + 0.02), "chip", "expr", { expr: "shocked", dur: 0.1 }); A(r3(S0 + 0.02), "wedge", "expr", { expr: "shocked", dur: 0.1 });
A(r3(S0 + 0.02), "chip", "squash", { to: 0.06, dur: 0.1 }); A(r3(S0 + 0.02), "wedge", "squash", { to: 0.05, dur: 0.1 });
A(r3(S0 + 0.25), "chip", "squash", { to: 0, dur: 0.2 }); A(r3(S0 + 0.25), "wedge", "squash", { to: 0, dur: 0.2 });
arm(r3(S0 + 0.05), "chip", "both", "rest", 0.35); grip(r3(S0 + 0.05), "chip", "both", "relaxed", 0.25);
arm(r3(S0 + 0.05), "wedge", "R", "rest", 0.35); grip(r3(S0 + 0.05), "wedge", "R", "relaxed", 0.25);
A(r3(S0 + 0.1), "chip", "turn", { to: KID_YAW, dur: 0.35 }); A(r3(S0 + 0.1), "wedge", "turn", { to: DAD_YAW, dur: 0.35 });
A(r3(S0 + 0.15), "chip", "look", { to: AT_JUDGE_KID, dur: 0.15 }); A(r3(S0 + 0.15), "wedge", "look", { to: AT_JUDGE_DAD, dur: 0.15 });
// 28 JUDGE, final: Daddy tax and kid tax are now illegal. Give them back.
A(r3(T[31] - 0.1), "vik", "look", { to: VIK_AT_DAD, dur: 0.15 });
say(31);
const S1 = strike(r3(T[31] + 1.6));   // on "illegal"
// 12 the DAD brings the hidden hand round: his own FULL carton; he hands it down to the kid, sad. The kid beams.
const HAND = r3(END_OF(31) - 0.5);
cap(r3(HAND - 0.05), r3(END_OF(31) + 0.3), "*Give them back.*", 290, false, { size: 64 });   // its own caption over the hand-over shot, above the dad's head (Sol 2: it was cut; camfit: no spot in 470-1360)
A(r3(HAND - 0.1), "wedge", "expr", { expr: "sad", dur: 0.3 });
A(HAND, "wedge", "turn", { to: DAD_TO_KID, dur: 1.0 }); A(HAND, "wedge", "look", { to: [-0.5, -0.25], dur: 0.25 });
A(HAND, "chip", "look", { to: [0.5, 0.5], dur: 0.2 }); A(r3(HAND + 0.1), "chip", "turn", { to: 0, dur: 0.5 });   // to KHUG
arm(r3(HAND + 0.5), "chip", "both", { o: [0.13, 0.4, 0.24] }, 0.45, "out"); grip(r3(HAND + 0.6), "chip", "both", "open", 0.3);   // both arms up for it (the pose draft 1 cut from without a palm flip)
const dl = [0.906, 0.423];   // his left side for the facing he starts from: the box comes round it, not through him
let e = dad.carry(r3(HAND), [r3(DAD0[0] + dl[0] * 0.45), 0.32, r3(DAD0[1] + dl[1] * 0.45)], 0.5, "inOut");
const dk = yawV(DAD_TO_KID, 0.42);
const dm = yawV(-2, 0.55);   // round the front, wide of his belly (a straight path took his left hand into it)
e = dad.carry(e, [r3(DAD0[0] + dm[0]), 0.31, r3(DAD0[1] + dm[1])], 0.5, "inOut");
e = dad.carry(e, [r3(DAD0[0] + dk[0]), 0.22, r3(DAD0[1] + dk[1])], 0.5, "inOut");   // held out to the kid (lower: Sol 2, the fries hid his mouth)
// the pass happens on a cut (a hand-to-hand pass put the kid's arm through his chest twice): the dad's box goes under
// the floor as his hands open, the kid's own copy (full2) is in his arms in the next shot
const HUG = F2(e + 0.35);   // on a frame: the swap at HUG - 0.03 falls between two frames
const KHUG = 0, kh = yawV(KHUG - 45, 0.4);   // hugged on his left: the dad's held-out box stays out of the close-up (Sol 1: it showed twice)   // hugged to one side: in front, the fries covered his eye
const HUGPOS = [r3(KID0[0] + kh[0]), 0.02, r3(KID0[1] + kh[1])];   // low: his eyes stay over the box
// the dad keeps his box out of the following shots (a box sent under the floor fell into physics on the floor)
// he turned to KHUG while the dad brought the box round (an instant turn on the cut flipped his palm)
c.prop(r3(HUG - 0.03), "full2", { ...grips.placeFor("friescarton", HUGPOS, KHUG) }, 0.01);
const kid2 = grips.box(c, "chip", FULL2, { gap: 0.05 });   // clear of his hood roll (Sol 2)
kid2.take(r3(HUG - 0.03), { reach: 0.005, settle: 0.005 });
// the dad stays turned to the kid, his box held out (off screen from here; turning back pushed it into him)
A(r3(HUG + 0.1), "chip", "expr", { expr: "delighted", dur: 0.2 }); A(r3(HUG + 0.15), "chip", "face", { lid: 0.9, dur: 0.15 });
A(r3(HUG + 0.15), "chip", "squash", { to: -0.06, dur: 0.25 });
sfx(r3(HUG + 0.1), "crinkle", { gain: 0.35 });
A(r3(HUG + 0.4), "wedge", "expr", { expr: "annoyed", dur: 0.3 }); A(r3(HUG + 0.4), "wedge", "look", { to: [-0.6, -0.4], dur: 0.2 });
see(HAND, r3(HUG - 0.05), ["full", "wedge.face"], "the dad brings his own full box round and holds it out to the kid");
see(HUG, r3(HUG + 0.8), ["full2", "chip.face"], "the kid hugs the full box");
// 13 cut on the kid's joy straight to the JUDGE: he already has one of the kid's fries at his mouth (the bench is deeper
// than his arm, so the take is left to the cut; a forced-perspective reach read as a floating fry in draft 1)
// 14 JUDGE, chewing: Court tax. (the video ends on it)
const CUT2 = F2(HUG + 0.85);
const MOUTH = [-0.53, 1.6, -0.2];   // the layout's mouth point in this shot (-0.54, 1.61, -0.29), a little in front
c.prop(r3(CUT2 - 0.03), "full2", { taken: 1 }, 0.01);
A(r3(CUT2 - 0.03), "vik", "turn", { to: VIK_TO_KID, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT2 - 0.03), "vik", "look", { to: VIK_AT_KID, dur: 0.01 }); A(r3(CUT2 - 0.03), "vik", "expr", { expr: "deadpan", dur: 0.01 });
const FRY2_AT = { x: r3(MOUTH[0] + 0.07), y: r3(MOUTH[1] - 0.2), z: MOUTH[2] };   // at the corner of his mouth (Sol 1: it covered his mouth)   // standing, its top at his mouth
c.prop(r3(CUT2 - 0.03), "fry2", FRY2_AT, 0.01);
const fry2 = grips.thin(c, "vik", { ...FRY2, ...FRY2_AT }, { side: "L", from: 0.3 });   // pinched low: the hand stays under the mouth
fry2.take(r3(CUT2 - 0.03), { reach: 0.005, settle: 0.005 });
const CHEW = r3(CUT2 + 0.15);
A(CHEW, "vik", "talk", { dur: 0.3, amp: 0.6 }); sfx(r3(CHEW + 0.05), "crumble", { gain: 0.4 });
c.prop(r3(CHEW + 0.05), "fry2", { bite: 1 }, 0.01);
fry2.carry(r3(CHEW - 0.05), [r3(FRY2_AT.x - 0.03), r3(FRY2_AT.y + 0.07), r3(FRY2_AT.z - 0.06)], 0.18, "out");   // the top goes into his mouth: the fry gets shorter (Sol 2: no bite showed)
T[32] = r3(CHEW + 0.35);
say(32);
const END = r3(END_OF(32) + 0.35);
see(CUT2, END, ["vik.face", "fry2"], "the judge eats one of the kid's fries: court tax");

// ---------------------------------------------------------------- cameras: a new framing on every line, every shot moves
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const WIDE = { pos: [0.15, 1.0, 8.4], look: [0.05, 1.45, 0], fov: 30 };   // lower: the bench hides the judge's lap (Sol 1), caption over the judge (camfit 470-490)
const KID_MED = { pos: [-0.45, 0.75, 3.7], look: [0.12, 0.6, 1.2], fov: 32 };   // from the judge's side: the kid faces him
const TWO = { pos: [0.55, 1.0, 5.8], look: [0.68, 0.9, 1.0], fov: 30 };
const INSERT = { pos: [-0.75, 0.65, 2.75], look: [-0.07, 0.3, 1.5], fov: 30 };   // in front of the kid: the open box tipped to us
const JUDGE_LOW = { pos: [0.3, 1.05, 4.2], look: [-0.69, 1.98, -0.6], fov: 30 };
const DAD_MED = { pos: [0.45, 0.95, 5.2], look: [1.08, 1.15, 0.9], fov: 30 };
const DAD_MED_B = { pos: [1.9, 0.95, 5.2], look: [1.05, 1.12, 0.9], fov: 30 };
const JUDGE_CU = { pos: [0.15, 1.55, 3.2], look: [-0.69, 2.12, -0.62], fov: 28 };
const JUDGE_GAVEL = { pos: [-0.1, 1.15, 4.4], look: [-0.8, 1.95, -0.5], fov: 32 };   // the gavel in, on the line
const HANDOVER = { pos: [0.55, 0.95, 5.4], look: [0.62, 0.72, 1.0], fov: 30 };
const KID_HUG = { pos: [-0.45, 0.5, 3.6], look: [-0.05, 0.38, 1.35], fov: 30 };   // eye height, the dad out of frame
const LAST = { pos: [0.6, 0.55, 3.3], look: [-0.45, 1.85, -0.2], fov: 36 };   // low behind the kid, up at the judge chewing
const DAD_FULL = { pos: [1.3, 0.85, 4.7], look: [0.92, 0.75, 1.0], fov: 30 };   // centred on him: his right hip and the pocket fries in frame (Sol 2)   // the dad head to feet: the fry falls out
const FRY_INS = { pos: [1.0, 0.55, 1.75], look: [FRY_LAND[0], 0.04, FRY_LAND[1]], fov: 30 };
const OATH_CAM = { pos: [0.9, 0.9, 4.8], look: [0.85, 0.85, 0.9], fov: 32 };   // the raised hand and his feet   // the fry on the floor
const DAD_V = { pos: [0.0, 1.1, 5.4], look: [0.95, 1.1, 0.9], fov: 28 };   // the dad facing the kid (camfit 470-580)
const TWO_W = { pos: [0.4, 1.05, 6.4], look: [0.62, 0.95, 1.0], fov: 27 };   // the family face to face (camfit 470-540)
const KID_FULL = { pos: [-0.2, 0.6, 3.9], look: [0.1, 0.35, 1.25], fov: 30 };   // the kid head to feet: the box drops out
const cuts = [
  ["suing your dad", 0, push(WIDE, 0.06, END_OF(0)), "hook"],
  ["he ate my fries", r3(T[1] - 0.05), push(KID_MED, 0.06, 1.4)],
  ["I took one", r3(T[2] - 0.05), drift(TWO, -0.12, 1.4)],
  ["empty", r3(FLIP - 0.02), push(INSERT, 0.1, FLIP_END - FLIP + 0.1)],
  ["one?", r3(T[3] - 0.08), push(JUDGE_LOW, 0.06, 0.9)],
  ["one at a time", r3(T[4] - 0.05), push(DAD_MED, 0.06, 1.6)],
  ["why", r3(T[5] - 0.05), push(JUDGE_LOW, 0.1, 0.6)],
  ["checking", r3(T[6] - 0.05), push(DAD_MED_B, 0.07, DUR[6] + 0.2)],
  ["all of them", r3(T[7] - 0.05), push(JUDGE_GAVEL, 0.06, DUR[7] + 0.2)],
  ["some were cold", r3(T[8] - 0.05), push(DAD_MED, 0.08, DUR[8] + 0.2)],
  ["raise your hand", r3(T[9] - 0.05), push(JUDGE_LOW, 0.06, DUR[9] + 0.2)],
  ["the sleeve", r3(OATH - 0.05), push(OATH_CAM, 0.05, T[10] - OATH)],   // the fry falls and lands in this shot
  ["exhibit A", r3(T[10] - 0.05), push(JUDGE_GAVEL, 0.12, DUR[10] + 0.25)],   // a floor close-up gave the caption check giant off-screen bodies
  ["looking at me", r3(T[11] - 0.05), push(DAD_MED_B, 0.06, DUR[11] + 0.2)],
  ["empty your pockets", r3(T[12] - 0.05), push(JUDGE_CU, 0.06, DUR[12] + 0.15)],
  ["the pocket", r3(POCK - 0.05), push(DAD_FULL, 0.06, T[13] - POCK)],
  ["for later", r3(T[13] - 0.05), push(DAD_MED, 0.08, DUR[13] + 0.2)],
  ["every time", r3(DROP - 0.05), push(KID_MED, 0.07, 1.4)],
  ["daddy tax", r3(T[15] - 0.05), push(DAD_MED, 0.08, DUR[15] + 0.3), "escalation"],
  ["my dad took mine", r3(T[16] - 0.25), push(JUDGE_CU, 0.12, DUR[16] + 0.3)],
  ["tradition", r3(T[17] - 0.05), push(DAD_MED_B, 0.08, DUR[17] + 0.15)],
  ["not anymore", r3(T[18] - 0.05), push(JUDGE_LOW, 0.1, DUR[18] + 0.2)],
  ["objection", r3(T[19] - 0.05), drift(TWO, 0.12, DUR[19] + 0.5), "turn"],
  ["nuggets", r3(END_OF(19) - 0.35), push(KID_FULL, 0.06, NUG + 0.95 - END_OF(19))],
  ["growing", r3(T[20] - 0.05), push(KID_MED, 0.08, DUR[20] + 0.2)],
  ["how many", r3(T[21] - 0.05), push(JUDGE_LOW, 0.08, DUR[21] + 0.3)],
  ["one at a time kid", r3(T[22] - 0.05), push(KID_MED, 0.14, DUR[22] + 0.3)],
  ["gotcha", r3(T[23] - 0.05), push(DAD_V, 0.1, DUR[23] + 0.2)],
  ["cake", r3(T[24] - 0.05), push(TWO, 0.12, DUR[24] + 0.1)],
  ["pizza", r3(T[25] - 0.05), push(DAD_MED, 0.1, DUR[25] + 0.1)],
  ["candy", r3(T[26] - 0.05), push(TWO_W, 0.1, DUR[26] + 0.1)],
  ["that was tax", r3(T[27] - 0.05), push(DAD_V, 0.15, DUR[27] + 0.1)],
  ["isn't real", r3(T[28] - 0.05), drift(TWO_W, 0.1, DUR[28] + 0.1)],
  ["constitution", r3(T[29] - 0.05), push(DAD_MED, 0.12, DUR[29] + 0.1)],
  ["order", r3(T[30] - 0.1), push(JUDGE_GAVEL, 0.1, S0 - T[30] + 0.1)],
  ["they jump", r3(S0 + 0.12), push({ ...TWO_W, fov: 31 }, 0.05, T[31] - S0)],   // the family jumps and turns back to him (Sol 1)
  ["illegal", r3(T[31] - 0.05), drift(JUDGE_GAVEL, 0.12, END_OF(31) - T[31])],   // the strike on "illegal" in frame (Sol 1)
  ["hand over", r3(HAND - 0.05), drift(HANDOVER, -0.1, F2(HAND + 1.18) - HAND)],
  ["held out", F2(HAND + 1.18), push(TWO_W, 0.1, HUG - HAND - 1.18)],   // a cut on the frame where his grip shifts as the box comes round (rig jump hidden, workflow rule 5)
  ["joy", HUG, push(KID_HUG, 0.08, 0.9)],
  ["court tax", CUT2, push(LAST, 0.06, END - CHEW + 0.05), "payoff"],
];
// a caption ends at the next cut (Sol 1: two carried into the next shot, over a face)
const cutTimes = cuts.map((k) => k[1]).sort((a, b) => a - b);
for (const cp of c.captions) { const nx = cutTimes.find((t) => t > cp.from + 0.1); if (nx != null && cp.to > nx) cp.to = r3(nx - 0.02); }
const beats = c.beats(cuts, END);

write(import.meta.url, {
  id: "court-kid-dad",
  title: "He took his dad to court over one fry",
  idea: "Potato Desk 11: a kid sues his dad for eating his fries; 'daddy tax' gets outlawed, and the judge takes one fry as court tax.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [290, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [50, 75] },
  hook: { show: ["vik", "chip", "wedge", "board", "empty"], hint: 0, what: "a judge leans over to a kid holding an empty fries box; the board says KID vs DAD" },
  fx: SHAKES, cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
    { who: "chip", checks: ["motion"], from: r3(HUG - 0.05), to: r3(HUG + 0.05), reason: "the kid's hands go onto his box on the cut to the hug close-up (the frame before is the other shot)" },
    { who: "chip", checks: ["stance-slide"], from: r3(HUG - 0.1), to: r3(HUG + 0.05), reason: "the kid is turned to hug the box on the cut (one frame before it, 3.5 cm on a foot in the two-shot)" },
          ],
  notes: "Generated by storyboards/series/potato-desk/11-court-kid-dad/make-court-kid-dad.mjs.",
});
