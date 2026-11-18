// POTATO DESK 05 "Court Day" (Jonny 18 Nov 2026: "lets create a new video with these learnings applied", then "buikd it").
// Brief and script: /mnt/project-files/05-COURT-DAY-mash-ENGINE-BRIEF.md. Design: ./DESIGN.md (GPT-6.2 Sol, xhigh).
//   node storyboards/series/potato-desk/05-court-day/make-court-day.mjs -> court-day.json
//
// THE BRIEF
//   Joke:        a Viking judge gives one year for every item stolen; Mash stole mashed potatoes, and you can't count mash.
//   Rule, repeat, flip: 3 fries = 3 years, 10 chips = 10 years, one bowl of mash = "?" -> case closed.
//   Ending:      Mash strolls out with his bowl; Chip and Wedge stare at us; cut on the stare (the empty spot loops to frame 0).
// Chain: the judge asks, so Chip confesses 3 fries, so 3 years; Mash giggles, so the judge glares, so "you'll see";
// Wedge confesses 10 chips, so 10 years; Mash brings mash, so the judge asks how many, so he counts with a spoon, so he
// can't, so the board spins "?", so case closed, so Mash walks free, so the other two stare.
// Opener A (the trial is running at frame 0: the judge's question and the 0 YEARS board are up from 0.0 s).
// Departures (named in the delivery): captions in the upper third (Jonny 12 Nov rule), not low centre; no baked title
// box (Jonny adds the title in the app); Viking keeps the spoon (pulled from his coffee mug) instead of putting it
// down, and Mash leaves carrying the bowl without eating (one fewer hand-off: clip-lessons "count the props that pass
// through hands"); Viking has no beard of his own, so the design's beard is off.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);   // on a frame

// measured spoken lengths (node qa/lines.mjs desk05-voice-probe.json, 18 Nov 2026), in LINES order
const DUR = [1.03, 1.09, 1.90, 0.57, 1.44, 1.04, 1.72, 1.33, 1.72, 1.02, 1.72, 3.09, 1.02, 0.89, 2.09, 1.82];
// the pause before each line (Jonny 17 Nov: pace up; the judge answers fast, the count is slow)
const GAP = [0.05, 0.2, 0.2, 0.15, 0.2, 0.15, 0.3, 0.25, 0.2, 0.15, 0.25, 0.2, 0.3, 0.2, 0.55, 2.1];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN.md sections 1, 5; x right, z toward us)
// Layout round 1 moved the queue right and back (Wedge stood in the bench, Chip's eyes sat under the safe zone) and
// put Mash's defendant spot beside the bench's right end, where he can hold the bowl over the deck.
const DECK = 1.18;                                   // the bench's deck top
const VIK = [-0.69, -0.66];                          // seated in the chair on the riser
const MARK = [0.45, 1.1], Q1 = [0.4, 0.08], Q2 = [1.15, -1.05], MASH_SPOT = [0.48, 0.3];
const CHIP_SIDE = [-0.15, 1.9], WEDGE_SIDE = [-0.75, 1.0], EXIT = [2.15, 0.45];
const D_YAW = -20;                                   // defendants: mostly to us, a little toward the judge
const AT_JUDGE = [-0.8, 0.55], AT_US = [0, 0.05];
const rad = (d) => (d * Math.PI) / 180;
// where a hold sits for a body at `at` facing `yaw` (0 = to us): side = toward his left hand (screen right when he faces us)
const offAt = (at, yaw, side, fwd, y) => [r3(at[0] + side * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), y, r3(at[1] - side * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];
const FRY_OFF = [0.40, 0.10, 0.18], BAG_OFF = [0, 0.56, 0.12], BOWL_OFF = [0, 0.56, 0.42];

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: 8, expr: "stern", follow: 0.2, seed: 1.7 },
  { id: "chip", character: "potatobrawl/chip", at: MARK, face: D_YAW, expr: "sad", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: Q1, face: D_YAW, expr: "annoyed", follow: 0.3, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: Q2, face: D_YAW, expr: "smug", follow: 0.3, seed: 4.4 },
];

const at3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
const GREST = [-1.12, DECK + 0.06, 0.22];            // the gavel stands on the sound block, the hand high on its handle
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
const MUG_AT = [-0.5, DECK, -0.08];
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", MUG_AT, 8) };
const SPOON = { id: "spoon", kind: "courtspoon", x: MUG_AT[0], y: DECK + 0.06, z: MUG_AT[2] };
const FRIES = { id: "fries", kind: "fryfan", ...at3(offAt(MARK, D_YAW, ...FRY_OFF)), rot: D_YAW };
const BAG = { id: "bag", kind: "chipbag", ...at3(offAt(Q1, D_YAW, ...BAG_OFF)), rot: D_YAW };
const BOWL = { id: "bowl", kind: "mashbowl", ...at3(offAt(Q2, D_YAW, ...BOWL_OFF)), rot: D_YAW };
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 3.8, h: 4.24 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true },
  { id: "board", staged: "screwed to the back wall", kind: "sentenceboard", x: 0.66, y: 2.01, z: -1.255 },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, bar: [MARK[0], MARK[1], 0.34, 0.09], queue: [[Q1[0], Q1[1], 0.24, 0.06], [Q2[0], Q2[1], 0.24, 0.06]] },
  GAVEL, MUG, SPOON, FRIES, BAG, BOWL,
];

// captions: upper third, under the band Jonny's in-app title takes (never over faces); numbers as digits
const SUB = 470;
const CAPTEXT = {
  1: "3 fries, your honor.", 2: "3 fries. *3 YEARS!*", 3: "hehe", 7: "10 potato chips.", 8: "10 chips. *10 YEARS!*",
  14: "One... two... *one?*", 15: "*Case closed.* Go home.",
};
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- the holds (every hand keeps its prop to the end)
const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const fr = grips.mug(c, "chip", FRIES, { side: "L" });
const bg = grips.box(c, "wedge", BAG);   // both hands on the bag, in front (one hand at his side swung into the bench)
const bw = grips.bowl(c, "mash", BOWL);
const sp = grips.thin(c, "vik", SPOON, { side: "L", from: 0.6 });

// a walk with the prop in hand: turn to the heading, walk, turn to `yawEnd`; the hold rides along (a carry over the
// same seconds, its place turned with the body: the arm pose is world-placed, so a walk without it leaves the hand behind)
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const walkHold = (who, h, off, t, from, to, dur, yawFrom, yawEnd) => {
  const hd = heading(from, to);
  A(t, who, "turn", { to: hd, dur: 0.5, ease: "inOut" }); h.carry(t, offAt(from, hd, ...off), 0.5, "inOut");
  A(r3(t + 0.5), who, "move", { to, dur, ease: "inOut" }); h.carry(r3(t + 0.5), offAt(to, hd, ...off), dur, "inOut");
  const e = r3(t + 0.5 + dur);
  A(r3(e - 0.05), who, "turn", { to: yawEnd, dur: 0.55, ease: "inOut" }); h.carry(r3(e - 0.05), offAt(to, yawEnd, ...off), 0.55, "inOut");
  return r3(e + 0.25);
};

// a gavel strike: up, down onto the block (the tok and the board flip on the hit)
const strike = (t, flipTo, { up = 0.16, gain = 1.2 } = {}) => {
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], 0.16, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.07, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) { c.prop(r3(e - 0.01), "board", { flip: flipTo }, 0.2); sfx(r3(e + 0.06), "kenney/switch", { gain: 0.45 }); }
  return e;
};

// ---------------------------------------------------------------- frame 0: the trial is running
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
// each holder's facing as a turn, so a carry turns the held prop with the body (grips.mjs: no turn = no follow)
for (const who of ["chip", "wedge", "mash"]) A(0, who, "turn", { to: D_YAW, dur: 0.01 });
c.prop(0, "board", { flip: 0, spin: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
fr.take(0, { reach: 0.01, settle: 0.01 });
bg.take(0, { reach: 0.01, settle: 0.01 });
bw.take(0, { reach: 0.01, settle: 0.01 });
A(0, "vik", "look", { to: [0.5, -0.45], dur: 0.01, blink: false });
A(0, "chip", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "wedge", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "mash", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
act.blinksAt(c, "vik", [2.3, 9.1, 15.9]);
act.blinksAt(c, "chip", [3.9, 12.4, 20.6]);
act.blinksAt(c, "wedge", [5.6, 14.9, 22.8]);
act.blinksAt(c, "mash", [6.6, 13.2, 21.1]);
see(0, END_OF(0), ["vik.face", "chip.face", "board"], "the judge asks Chip what he stole; the board shows 0 YEARS");

// 1 VIKING: What did you steal?
say(0);
// 2 CHIP (tiny): Three fries, your honor. (he holds the three fries up beside his face)
fr.carry(r3(T[1] - 0.25), offAt(MARK, D_YAW, 0.36, 0.14, 0.42), 0.3, "out");
say(1);
// 3 VIKING: Three fries. Three years! (tok on "years", board -> 3)
say(2);
const S1 = strike(r3(T[2] + 0.75), 1);
A(r3(S1), "chip", "expr", { expr: "shocked", dur: 0.12 });
fr.carry(r3(S1 + 0.25), offAt(MARK, D_YAW, ...FRY_OFF), 0.35, "inOut");
see(T[2], r3(S1 + 0.6), ["vik.face", "board", "chip.face"], "3 YEARS on the board");
// 4 MASH giggles in the line; the judge glares at him: Why are you laughing? / MASH: You'll see.
A(r3(T[3] - 0.1), "mash", "expr", { expr: "delighted", dur: 0.15 });
say(3);
A(r3(T[4] - 0.25), "vik", "look", { to: [1, 0.1], dur: 0.2 }); A(r3(T[4] - 0.25), "vik", "expr", { expr: "annoyed", dur: 0.2 });
say(4);
A(r3(T[5] - 0.15), "mash", "expr", { expr: "smug", dur: 0.2 });
say(5);
see(T[3], END_OF(5), ["mash.face", "vik.face"], "Mash giggles: you'll see");
// 5 Chip shuffles off sadly; Wedge steps up with his bag. VIKING: Next! What did you steal?
const W1 = r3(END_OF(5) - 0.3);
A(W1, "chip", "expr", { expr: "sad", dur: 0.25 });
walkHold("chip", fr, FRY_OFF, W1, MARK, CHIP_SIDE, 1.0, D_YAW, 15);
walkHold("wedge", bg, BAG_OFF, r3(W1 + 0.6), Q1, MARK, 1.2, D_YAW, D_YAW);
A(r3(W1 + 0.4), "vik", "look", { to: [0.5, -0.45], dur: 0.25 }); A(r3(W1 + 0.4), "vik", "expr", { expr: "stern", dur: 0.25 });
say(6);
// 6 WEDGE: Ten potato chips. (the bag comes up)
bg.carry(r3(T[7] - 0.3), offAt(MARK, D_YAW, 0, 0.58, 0.17), 0.3, "out");
say(7);
// 7 VIKING: Ten chips. Ten years! (tok, board -> 10; Wedge's mouth drops)
say(8);
const S2 = strike(r3(T[8] + 0.75), 2);
A(r3(S2), "wedge", "expr", { expr: "shocked", dur: 0.12 });
see(T[8], r3(S2 + 0.6), ["vik.face", "board", "wedge.face"], "10 YEARS on the board");
// 8 WEDGE wails and walks off; Mash steps up with the bowl. VIKING: Next! What did you steal?
A(r3(T[9] - 0.1), "wedge", "expr", { expr: "sad", dur: 0.15 });
say(9);
const W2 = r3(END_OF(9) - 0.2);
// two legs: a step toward us first, then left along the front (the right arm swung into the bench's front edge)
const VIA = [0.15, 1.1];
const W2b = walkHold("wedge", bg, BAG_OFF, W2, MARK, VIA, 0.5, D_YAW, heading(VIA, WEDGE_SIDE));
walkHold("wedge", bg, BAG_OFF, r3(W2b - 0.3), VIA, WEDGE_SIDE, 0.9, heading(VIA, WEDGE_SIDE), 10);
const MASH_YAW = -45;
walkHold("mash", bw, BOWL_OFF, r3(W2 + 0.5), Q2, MASH_SPOT, 1.5, D_YAW, MASH_YAW);
A(r3(W2 + 0.5), "vik", "look", { to: [0.6, -0.3], dur: 0.25 });
say(10);
// 9 MASH: Mashed potatoes. One big bowl. (he lifts the bowl to the judge)
bw.carry(r3(T[11] - 0.2), offAt(MASH_SPOT, MASH_YAW, 0, 0.56, 0.5), 0.35, "inOut");
say(11);
see(T[11], END_OF(11), ["mash.face", "bowl", "vik.face"], "the bowl of mash");
// 10 VIKING leans over the bench, squinting: How many potatoes?
A(r3(T[12] - 0.3), "vik", "lean", { to: 12, dur: 0.4, ease: "inOut" });
A(r3(T[12] - 0.3), "vik", "expr", { expr: "focused", dur: 0.3 });
A(r3(T[12] - 0.3), "vik", "look", { to: [0.55, -0.6], dur: 0.25 });
say(12);
// 11 MASH turns to the bench and holds the bowl out over the deck's corner (never lets go): You tell me.
const M1 = r3(END_OF(12) - 0.25);
const OFFER = [-0.06, DECK + 0.26, 0.3];   // high, against the wall: the mash reads on a phone
A(M1, "mash", "turn", { to: -90, dur: 0.45, ease: "inOut" });
let mb = bw.carry(M1, [0.2, DECK + 0.2, 0.32], 0.35, "inOut");
mb = bw.carry(r3(mb + 0.02), OFFER, 0.3, "inOut");
T[13] = Math.max(T[13], r3(mb - 0.3));
say(13);
// 12 VIKING pulls the spoon from his mug, pokes the mash and counts: One... two... one?  The board spins "?".
let sv = sp.take(r3(T[13] + 0.1), { reach: 0.35 });
const OVER = [OFFER[0] - 0.02, OFFER[1] + 0.34, OFFER[2]];
sv = sp.carry(r3(sv + 0.05), OVER, 0.35, "inOut");
T[14] = Math.max(T[14], r3(sv - 0.1));
say(14);
for (const p of [T[14] + 0.05, T[14] + 0.75, T[14] + 1.5]) {
  sp.carry(r3(p), [OVER[0], OVER[1] - 0.09, OVER[2]], 0.12, "in");
  sfx(r3(p + 0.11), "kenney/impact-plate-light", { gain: 0.5 });
  sp.carry(r3(p + 0.18), OVER, 0.2, "out");
}
c.prop(r3(T[14] + 0.05), "board", { flip: 3 }, 0.2); sfx(r3(T[14] + 0.12), "kenney/switch", { gain: 0.45 });
c.prop(r3(T[14] + 0.27), "board", { card: 1 }, 0.01);
const SPIN0 = r3(T[14] + 0.6);
for (let k = 0; k < 7; k++) c.prop(r3(SPIN0 + k), "board", { spin: r3((k + 1) * 2 * Math.PI) }, 0.7);
see(T[14], END_OF(14), ["vik.face", "spoon", "bowl", "board"], "he counts the mash with a spoon; the board spins ?");

// ---------------------------------------------------------------- the cut-in: the judge stares at the spoon
const CUT = F(END_OF(14) + 0.25), BACK = F(CUT + 1.6);
sp.carry(r3(END_OF(14) - 0.1), [-0.42, 1.52, 0.12], 0.3, "inOut");   // the spoon up beside his face, to stare at
A(r3(END_OF(14) - 0.05), "vik", "look", { to: [0.35, -0.1], dur: 0.25 });
A(r3(END_OF(14) - 0.05), "vik", "expr", { expr: "dizzy", dur: 0.3 });
see(CUT, BACK, ["vik.face"], "the judge stares at the spoon");
sp.carry(r3(BACK - 0.6), [-0.4, DECK + 0.14, 0.12], 0.45, "inOut");   // he lowers it, still holding it
// 13 back in the wide: VIKING (defeated): Case closed. Go home.  (the spoon back in the mug, a soft tok; the board turns to 0)
T[15] = r3(BACK + 0.25);
A(r3(BACK - 0.02), "vik", "expr", { expr: "deadpan", dur: 0.01 });
A(r3(BACK - 0.02), "vik", "lean", { to: 0, dur: 0.01 });
A(r3(BACK - 0.02), "vik", "look", { to: [0.3, -0.2], dur: 0.01 });
say(15);
const S3 = strike(r3(T[15] + 0.55), null, { up: 0.1, gain: 0.55 });
c.prop(r3(S3 - 0.25), "board", { card: 0 }, 0.01);
c.prop(r3(S3 - 0.01), "board", { flip: 4 }, 0.2); sfx(r3(S3 + 0.06), "kenney/switch", { gain: 0.4 });
// 14 Mash takes his bowl back and strolls out; Chip and Wedge turn and stare at us
const OUT = r3(END_OF(15) + 0.05);
let mo = bw.carry(OUT, [0.24, DECK + 0.12, 0.32], 0.3, "inOut");
A(mo, "mash", "turn", { to: 0, dur: 0.55, ease: "inOut" });
mo = bw.carry(mo, offAt(MASH_SPOT, 0, 0, 0.56, 0.45), 0.55, "inOut");
A(mo, "mash", "turn", { to: 85, dur: 0.4, ease: "inOut" });
mo = bw.carry(mo, offAt(MASH_SPOT, 85, ...BOWL_OFF), 0.4, "inOut");
A(r3(mo - 0.1), "mash", "move", { to: EXIT, dur: 2.0, ease: "in" });
bw.carry(r3(mo), offAt(EXIT, 85, ...BOWL_OFF), 2.0, "in");
A(r3(OUT + 0.2), "mash", "expr", { expr: "delighted", dur: 0.2 });
A(r3(OUT + 0.2), "chip", "turn", { to: 0, dur: 0.4 }); A(r3(OUT + 0.2), "chip", "look", { to: AT_US, dur: 0.3 });
A(r3(OUT + 0.35), "wedge", "turn", { to: 0, dur: 0.4 }); A(r3(OUT + 0.35), "wedge", "look", { to: AT_US, dur: 0.3 });
fr.carry(r3(OUT + 0.2), offAt(CHIP_SIDE, 0, ...FRY_OFF), 0.4, "inOut");
bg.carry(r3(OUT + 0.35), offAt(WEDGE_SIDE, 0, ...BAG_OFF), 0.4, "inOut");
A(r3(OUT + 0.2), "chip", "expr", { expr: "deadpan", dur: 0.3 }); A(r3(OUT + 0.35), "wedge", "expr", { expr: "deadpan", dur: 0.3 });
const END = F(mo + 1.9);
see(r3(OUT + 0.8), END, ["chip.face", "wedge.face"], "Chip and Wedge stare at us");

// ---------------------------------------------------------------- the one wide shot + the one cut-in (DESIGN.md section 5)
const WIDE = { pos: [0, 1.45, 10.4], look: [0, 1.45, 0], fov: 26 };
const beats = c.beats([
  ["three fries", 0, WIDE, "hook"],
  ["ten chips", T[6], "keep"],
  ["the mash", T[10], "keep", "escalation"],
  ["can't count", CUT, { pos: [-0.8, 2.05, 3.8], look: [-0.76, 1.8, -0.4], fov: 24 }],
  ["case closed", BACK, { ...WIDE }, "payoff"],
], END);

write(import.meta.url, {
  id: "court-day",
  title: "The judge gives 1 year for every item",
  idea: "Potato Desk 05: a Viking judge gives one year per stolen item; Mash stole mashed potatoes, and you can't count mash.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // a quiet pizzicato bed under the trial (playful suspense), from 0.0
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [26, 34] },
  hook: { show: ["vik", "chip", "board"], hint: 0, what: "a judge asks a tiny potato what he stole; the board says 0 YEARS" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
    { who: "mash", with: "bench", from: r3(M1), to: r3(OUT + 0.4), checks: ["costume-in-prop"], reason: "Mash's hoodie brushes the bench's side (3 cm of cloth) while he holds the bowl out over the deck" },
  ],
  notes: "Generated by storyboards/series/potato-desk/05-court-day/make-court-day.mjs.",
});
