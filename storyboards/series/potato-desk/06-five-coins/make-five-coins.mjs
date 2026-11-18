// POTATO DESK 06 "Five Coins" (Jonny 18 Nov 2026, after Court Day's first numbers: "i want to do another video like this which
// i can post on instagram -- i dont want to double post directly"; joke by GPT-6.2 Sol, Jonny picked it as a test: "we could
// try the first one to see if its actually funny"). Court Day's set, judge, shot, queue and counter; a new joke.
//   node storyboards/series/potato-desk/06-five-coins/make-five-coins.mjs -> five-coins.json
//
//   Joke:        phones ring in court. Chip's: five coins. Wedge's: five coins. The third ring: the judge blames Mash, and Mash
//                points at the judge's mug: the lit phone beside it is the judge's own. "Oh. Mine. No fine, Mash."
//                Mash: "Five coins, right?"  Everybody stares at us.
//   Rule, repeat, flip: a ringing phone = 5 coins, twice; the third phone is the judge's, and he fines himself nothing.
// Chain: Chip's phone rings, so the judge fines him; Mash spots the judge's phone, so "oh, good"; Wedge's phone rings, so the
// same fine; a phone rings again, so the judge blames Mash, so Mash points at the mug, so the judge finds his own phone, so
// no fine, so Mash asks about the five coins, so everyone stares at us.
// Opener A (the trial is running at frame 0: Chip's phone is ringing and the judge is already telling him off).
// Blocking: Court Day's three-deep queue (Chip on the mark, Wedge, Mash at the back), but nobody walks: each holder keeps his
// phone from frame 0 (no pickups, no walks with a hold: clip-lessons "count the props that pass through hands"). The one
// pickup is the judge's own phone, lying flat by his mug, in his free (left) hand. No call to action (story.md).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);   // on a frame

// measured spoken lengths (node qa/lines.mjs desk06c-voice-probe.json, 18 Nov 2026), in LINES order
const DUR = [2.33, 1.08, 1.00, 1.89, 1.80, 1.92, 1.19, 1.75, 1.31, 2.26, 1.50];
// the pause before each line: the judge answers fast; a ring sits before lines 0, 4 and 7
const GAP = [0.55, 0.2, 0.15, 0.2, 1.0, 0.2, 0.2, 1.0, 0.25, 0, 0.45];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (Court Day's queue; x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
// layout round 1: with no bag in his hands Wedge's free right glove sat in the bench (Q1 moved right) and Mash's back
// touched the wall panels (Q2 forward)
const MARK = [0.45, 1.1], Q1 = [0.62, 0.08], Q2 = [1.2, -0.8];   // draft 1: Mash's smile hid behind Wedge
const D_YAW = -20;
const AT_JUDGE = [-0.8, 0.55], AT_US = [0, 0.05], AT_MUG = [-0.85, 0.3];
// Court Day's side spots and Mash's spot beside the bench
const CHIP_SIDE = [-0.15, 1.9], WEDGE_SIDE = [-0.75, 1.0], MASH_SPOT = [0.48, 0.3], MASH_YAW = -45;
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;
// where a hold sits for a body at `at` facing `yaw` (0 = to us): side = toward his left hand (screen right when he faces us)
const offAt = (at, yaw, side, fwd, y) => [r3(at[0] + side * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), y, r3(at[1] - side * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];
// phones in the left hand: low at his side, and up in front of his face to look at it
const CHIP_LOW = [0.36, 0.12, 0.2], CHIP_UP = [0.2, 0.3, 0.42];
const WEDGE_LOW = [0.48, 0.15, 0.3], WEDGE_UP = [0.3, 0.5, 0.55];   // held-high: at the chest, not over his face

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: 8, expr: "angry", follow: 0.2, seed: 1.7 },
  { id: "chip", character: "potatobrawl/chip", at: MARK, face: D_YAW, expr: "shocked", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: Q1, face: D_YAW, expr: "annoyed", follow: 0.3, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: Q2, face: D_YAW, expr: "smug", follow: 0.3, seed: 4.4 },
];

const at3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
const GREST = [-1.12, DECK + 0.06, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
const MUG_AT = [-0.5, DECK, -0.08];
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", MUG_AT, 8) };
// the phones: screen to the holder (rot + 180), a halo so a phone seen from the back still reads as ringing
const PH = { kind: "phone", scale: 1.2, halo: 0.22, haloK: 0.7 };
const CPH = { id: "cphone", ...PH, case: "#e8574a", ...at3(offAt(MARK, D_YAW, ...CHIP_UP)), rot: D_YAW + 180 };
const WPH = { id: "wphone", ...PH, case: "#4a8fe8", ...at3(offAt(Q1, D_YAW, ...WEDGE_LOW)), rot: D_YAW + 180 };
// the judge's phone lies on its back right of his mug, its top away from him (grips.phone flat)
const JPH = { id: "jphone", ...PH, case: "#3a3f4a", x: -0.2, y: r3(DECK + 0.006), z: -0.02, rot: 8, tip: -90 };
const STATES = ["?", "5", "?", "5", "?", "0", "?"], UNITS = ["", "COINS", "", "COINS", "", "COINS", ""];
const props = [
  { id: "floor", kind: "courtfloor", x: 0, y: 0, z: 2.1 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 3.8, h: 4.24 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true },
  { id: "board", staged: "screwed to the back wall", kind: "sentenceboard", x: 0.66, y: 2.01, z: -1.255, states: STATES, units: UNITS },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "marks", kind: "floormarks", x: 0, y: 0, z: 0, bar: [MARK[0], MARK[1], 0.34, 0.09], queue: [[Q1[0], Q1[1], 0.24, 0.06], [Q2[0], Q2[1], 0.24, 0.06]] },
  GAVEL, MUG, CPH, WPH, JPH,
];

// captions: upper third, under the band Jonny's in-app title takes (never over faces); numbers as digits
const SUB = 470;
const CAPTEXT = {
  0: "Chip. I told you to *turn it off.*", 3: "*5 coins* for leaving it on.", 6: "*5 coins.*",
  7: "Mash. Was that *your* phone?", 8: "Look by your *mug.*", 9: "Oh. *Mine.* No fine, Mash.", 10: "*5 coins,* right?",
};
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- the holds
const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const cp = grips.phone(c, "chip", CPH, { side: "L" });
const wp = grips.phone(c, "wedge", WPH, { side: "L" });
const jp = grips.phone(c, "vik", JPH, { side: "L" });
const strike = (t, flipTo, { up = 0.16, gain = 1.6 } = {}) => {   // 1.6: Court Day 2's toks stood under the bed at 1.2
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], 0.16, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.07, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) flip(r3(e - 0.01), flipTo);
  return e;
};
const flip = (t, to) => { c.prop(t, "board", { flip: to }, 0.2); sfx(r3(t + 0.07), "kenney/switch", { gain: 0.45 }); };
// a ring: the screen lights and the ringtone plays (a real phone trill)
const ring = (t, id, dur, gain = 0.5) => { c.prop(t, id, { glow: 1 }, 0.08); sfx(t, "ringtone", { gain, dur, reason: "a phone ringing in court" }); };
// a walk with the phone in hand (Court Day's): the hold rides along, its place turned with the body
const walkHold = (who, h, off, t, from, to, dur, yawFrom, yawEnd) => {
  const hd = heading(from, to);
  A(t, who, "turn", { to: hd, dur: 0.5, ease: "inOut" }); h.carry(t, offAt(from, hd, ...off), 0.5, "inOut");
  A(r3(t + 0.5), who, "move", { to, dur, ease: "inOut" }); h.carry(r3(t + 0.5), offAt(to, hd, ...off), dur, "inOut");
  const e = r3(t + 0.5 + dur);
  A(r3(e - 0.05), who, "turn", { to: yawEnd, dur: 0.55, ease: "inOut" }); h.carry(r3(e - 0.05), offAt(to, yawEnd, ...off), 0.55, "inOut");
  return r3(e + 0.25);
};
const hangUp = (t, id) => { c.prop(t, id, { glow: 0 }, 0.12); sfx(t, "kenney/switch", { gain: 0.2 }); };

// ---------------------------------------------------------------- frame 0: Chip's phone is ringing, the judge is angry
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
for (const who of ["chip", "wedge", "mash"]) A(0, who, "turn", { to: D_YAW, dur: 0.01 });
c.prop(0, "board", { flip: 0 }, 0.01);
for (const id of ["wphone", "jphone"]) c.prop(0, id, { glow: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
cp.take(0, { reach: 0.01, settle: 0.01 });
wp.take(0, { reach: 0.01, settle: 0.01 });
A(0, "vik", "look", { to: [0.5, -0.45], dur: 0.01, blink: false });
A(0, "chip", "look", { to: [0.3, -0.3], dur: 0.01, blink: false });   // at his phone
A(0, "wedge", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "mash", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
act.blinksAt(c, "vik", [3.4, 9.1, 15.9]);
act.blinksAt(c, "chip", [3.9, 12.4, 20.6]);
act.blinksAt(c, "wedge", [5.6, 14.9, 22.8]);
act.blinksAt(c, "mash", [6.6, 13.2, 21.1]);
ring(0, "cphone", 1.6, 0.55);
see(0, END_OF(0), ["vik.face", "chip.face", "cphone"], "Chip's phone rings in court; the judge glares");

// 1 VIKING: Chip. I told you to turn it off.
say(0);
// 2 CHIP: I thought I did! (he jabs the button; the screen goes dark on the line's end)
A(r3(T[1] - 0.1), "chip", "look", { to: AT_JUDGE, dur: 0.15 });
say(1);
hangUp(r3(END_OF(1) - 0.1), "cphone");
A(r3(END_OF(1) - 0.1), "chip", "look", { to: [0.3, -0.3], dur: 0.15 });
// 3 MASH (under his breath, eyeing the judge's mug): Oh, good.
A(r3(T[2] - 0.3), "mash", "look", { to: AT_MUG, dur: 0.25 });
A(r3(T[2] - 0.2), "mash", "expr", { expr: "smug", dur: 0.2 });
say(2);
see(T[2], END_OF(2), ["mash.face"], "Mash eyes the judge's mug and smiles");
A(r3(END_OF(2) + 0.1), "mash", "look", { to: AT_JUDGE, dur: 0.25 });
// 4 VIKING: Five coins for leaving it on. (tok, board -> 5 COINS); Chip lowers his phone
A(r3(T[3] - 0.15), "vik", "expr", { expr: "stern", dur: 0.2 });
say(3);
const S1 = strike(r3(END_OF(3) - 0.35), 1);
A(S1, "chip", "expr", { expr: "sad", dur: 0.15 });
A(S1, "chip", "look", { to: AT_JUDGE, dur: 0.2 });
cp.carry(r3(S1 + 0.1), offAt(MARK, D_YAW, ...CHIP_LOW), 0.4, "inOut");
see(T[3], r3(S1 + 0.6), ["vik.face", "board", "chip.face"], "5 COINS on the board");

// 5 Chip shuffles off to the side; Wedge's phone rings (quieter) and he walks up to the mark with it ringing
// (draft 1 kept everyone in the queue: Wedge and Mash spoke from behind the one in front, so each steps up, Court Day's way)
const W1 = r3(S1 + 0.55);
walkHold("chip", cp, CHIP_LOW, W1, MARK, CHIP_SIDE, 1.0, D_YAW, 15);
const R2 = r3(W1 + 0.5);
ring(R2, "wphone", 1.6, 0.38);
A(r3(R2 + 0.05), "wedge", "expr", { expr: "shocked", dur: 0.12 });
A(r3(R2 + 0.15), "vik", "look", { to: [0.45, -0.35], dur: 0.2 }); A(r3(R2 + 0.15), "vik", "expr", { expr: "annoyed", dur: 0.2 });
const W1b = walkHold("wedge", wp, WEDGE_LOW, r3(R2 + 0.3), Q1, MARK, 1.2, D_YAW, D_YAW);
flip(r3(R2 + 0.4), 2);
// "Wedge. Yours too?" lands as he arrives on the mark (every later line moves with it)
{ const late = r3(W1b - 0.6 - T[4]); if (late > 0) for (let k = 4; k < T.length; k++) T[k] = r3(T[k] + late); }
say(4);
// 6 WEDGE (lifting it to squint at it, pressing the button): I turned the sound down.
wp.carry(r3(T[5] - 0.5), offAt(MARK, D_YAW, ...WEDGE_UP), 0.6, "inOut");
A(r3(T[5] - 0.3), "wedge", "look", { to: [0.3, -0.2], dur: 0.2 });
A(r3(T[5] - 0.1), "wedge", "expr", { expr: "sad", dur: 0.2 });
say(5);
hangUp(r3(END_OF(5) - 0.15), "wphone");
// 7 VIKING: Five coins. (tok, board -> 5 COINS); Wedge's phone comes down
A(r3(T[6] - 0.1), "vik", "expr", { expr: "stern", dur: 0.15 });
say(6);
const S2 = strike(r3(T[6] + 0.45), 3);
A(S2, "wedge", "expr", { expr: "sad", dur: 0.15 });
A(S2, "wedge", "look", { to: AT_JUDGE, dur: 0.2 });
wp.carry(r3(S2 + 0.1), offAt(MARK, D_YAW, ...WEDGE_LOW), 0.6, "inOut");
see(T[4], r3(S2 + 0.6), ["vik.face", "board", "wedge.face", "wphone"], "Wedge's phone: 5 COINS on the board");

// 8 Wedge walks off (a step toward us, then left along the front); a third ring, from somewhere: the judge's phone lights
// on the deck by his mug (nobody looks there). Mash steps up beside the bench; the judge glares at him.
const W2 = r3(S2 + 0.75);
const VIA = [0.15, 1.1];
const W2b = walkHold("wedge", wp, WEDGE_LOW, W2, MARK, VIA, 0.5, D_YAW, heading(VIA, WEDGE_SIDE));
walkHold("wedge", wp, WEDGE_LOW, r3(W2b - 0.3), VIA, WEDGE_SIDE, 0.9, heading(VIA, WEDGE_SIDE), 10);
const R3 = r3(W2 + 0.6);
ring(R3, "jphone", 1.6, 0.5);
A(r3(W2 + 0.5), "mash", "move", { to: MASH_SPOT, dur: 1.4, ease: "inOut" });
A(r3(W2 + 1.5), "mash", "turn", { to: MASH_YAW, dur: 0.5, ease: "inOut" });
A(r3(R3 + 0.15), "vik", "look", { to: [0.6, -0.3], dur: 0.25 }); A(r3(R3 + 0.15), "vik", "expr", { expr: "angry", dur: 0.2 });
flip(r3(R3 + 0.3), 4);
// VIKING (accusing): Mash. Was that your phone? (once Mash stands at the bench)
{ const late = r3(W2 + 1.6 - T[7]); if (late > 0) for (let k = 7; k < T.length; k++) T[k] = r3(T[k] + late); }
say(7);
// 9 MASH points at the bench, calm: Look by your mug. (it rings again on his line)
A(r3(T[8] - 0.2), "mash", "look", { to: AT_MUG, dur: 0.2 });
c.arm(r3(T[8] - 0.45), "mash", "R", { o: [0.42, 0.62, 0.25] }, 0.5, "inOut"); A(r3(T[8] - 0.4), "mash", "grip", { side: "R", shape: "point", dur: 0.3 });
say(8);
ring(r3(T[8] + 0.5), "jphone", 1.6, 0.5);
see(T[8], END_OF(8), ["mash.face", "jphone"], "Mash points at the judge's ringing phone");
// the judge looks down, finds it, picks it up (his free left hand) and holds it up, frozen; everybody looks at it
const L = r3(END_OF(8) - 0.2);
A(L, "vik", "look", { to: [0.25, -0.85], dur: 0.25 }); A(r3(L + 0.15), "vik", "expr", { expr: "shocked", dur: 0.15 });
for (const [who, d] of [["chip", 0.1], ["wedge", 0.2]]) A(r3(L + d), who, "look", { to: AT_MUG, dur: 0.25 });
c.arm(r3(L + 0.3), "mash", "R", "rest", 0.6, "inOut"); A(r3(L + 0.3), "mash", "grip", { side: "R", shape: "relaxed", dur: 0.35 });
const TAKE = r3(L + 0.35);
let jt = jp.take(TAKE, { reach: 0.5 });
const UP = [-0.42, r3(DECK + 0.36), 0.02];
jt = jp.carry(r3(jt + 0.02), UP, 0.5, "inOut");
A(r3(jt - 0.1), "vik", "look", { to: [0.15, -0.3], dur: 0.2 });   // at the phone in his hand
const CUT = F(jt + 0.05);
// 10 the cut-in on the judge: VIKING (small): Oh. Mine. No fine, Mash. (he thumbs it off on "Mine")
T[9] = r3(CUT + 0.35);
A(r3(T[9] - 0.1), "vik", "expr", { expr: "sad", dur: 0.2 });
say(9);
hangUp(r3(T[9] + 0.8), "jphone");
A(r3(T[9] + 1.0), "vik", "look", { to: [0.6, -0.3], dur: 0.25 });   // back to Mash on "No fine, Mash"
const BACK = F(END_OF(9) + 0.1);
see(CUT, BACK, ["vik.face", "jphone"], "the judge holds up his own phone");
// back in the wide: a soft tok, the board -> 0 COINS
const S3 = strike(r3(BACK + 0.05), 5, { up: 0.1, gain: 0.6 });
// 11 MASH (polite): Five coins, right?
T[10] = r3(Math.max(T[10], S3 + 0.25));
A(r3(T[10] - 0.1), "mash", "expr", { expr: "smug", dur: 0.2 });
A(r3(T[10] - 0.1), "mash", "look", { to: AT_JUDGE, dur: 0.2 });
say(10);
// 12 the stare: Chip and Wedge look at the judge's phone, then at us; the judge joins them, phone still in hand
const OUT = r3(END_OF(10) + 0.1);
A(OUT, "chip", "turn", { to: 0, dur: 0.4 }); cp.carry(OUT, offAt(CHIP_SIDE, 0, ...CHIP_LOW), 0.4, "inOut"); A(OUT, "chip", "look", { to: AT_US, dur: 0.3 }); A(OUT, "chip", "expr", { expr: "deadpan", dur: 0.3 });
A(r3(OUT + 0.15), "wedge", "turn", { to: 0, dur: 0.4 }); wp.carry(r3(OUT + 0.15), offAt(WEDGE_SIDE, 0, ...WEDGE_LOW), 0.4, "inOut"); A(r3(OUT + 0.15), "wedge", "look", { to: AT_US, dur: 0.3 }); A(r3(OUT + 0.15), "wedge", "expr", { expr: "deadpan", dur: 0.3 });
A(r3(OUT + 0.45), "vik", "look", { to: [0.1, 0.0], dur: 0.3 }); A(r3(OUT + 0.45), "vik", "expr", { expr: "deadpan", dur: 0.3 });
const END = F(OUT + 2.3);
see(r3(OUT + 0.6), END, ["chip.face", "wedge.face", "vik.face", "jphone"], "Chip, Wedge and the judge stare at us");

// ---------------------------------------------------------------- the one wide shot + the one cut-in (Court Day's)
const WIDE = { pos: [0, 1.45, 10.4], look: [0, 1.45, 0], fov: 26 };
const beats = c.beats([
  ["chip's phone", 0, WIDE, "hook"],
  ["wedge's phone", R2, "keep"],
  ["the third ring", R3, "keep", "escalation"],
  ["his own phone", r3(CUT - 0.004), { pos: [-0.7, 1.95, 3.9], look: [-0.6, 1.95, -0.4], fov: 34 }],
  ["five coins, right?", r3(BACK - 0.004), { ...WIDE }, "payoff"],
], END);

write(import.meta.url, {
  id: "five-coins",
  title: "He blamed the wrong potato",
  idea: "Potato Desk 06: a Viking judge fines two potatoes 5 coins each for phones ringing in court; the third ringing phone is his own.",
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
  hook: { show: ["vik", "chip", "cphone", "board"], hint: 0, what: "a potato's phone rings in court and the judge glares at him" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
    { who: "vik", with: "bench", from: TAKE, to: r3(TAKE + 0.9), reason: "his fingers slide under the flat phone's edge on the deck to lift it; the deck top is seen edge-on from the wide camera, so they read as behind the deck's front edge" },
  ],
  notes: "Generated by storyboards/series/potato-desk/06-five-coins/make-five-coins.mjs.",
});
