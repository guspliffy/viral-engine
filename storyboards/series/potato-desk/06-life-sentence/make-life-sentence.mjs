// POTATO DESK 06 "Life in prison" (Jonny 18 Nov 2026, after Court Day's first numbers: "i want to do another video like this
// which i can post on instagram -- i dont want to double post directly"). Court Day's set, judge, shot and counter; a new joke.
//   node storyboards/series/potato-desk/06-life-sentence/make-life-sentence.mjs -> life-sentence.json
//
//   Joke:        the judge gives everyone "life in prison", and each life turns into how long that one lives: Chip is a potato
//                (3 WEEKS), Wedge lives in the fridge (3 MONTHS), then the Dragon lives a thousand years (1000 YEARS), leans in
//                with an evil grin and a snort, and the judge gulps: "...Three weeks. Case closed."
//   Rule, repeat, flip: life = your lifespan (3 weeks, 3 months), then the big number scares the judge back to 3 weeks.
//   Ending:      the Dragon strolls out; Chip and Wedge stare at us; cut on the stare (the empty spot loops to frame 0).
// Chain: the judge says life, so Chip says he lasts 3 weeks, so 3 weeks; the Dragon chuckles, so the judge glares, so "oh,
// nothing"; Wedge lives in the fridge, so 3 months; the Dragon lives 1000 years, so 1000 years, so the Dragon leans in and
// snorts, so the judge is scared, so three weeks, so the Dragon walks free, so the other two stare.
// Opener A (the trial is running at frame 0: "Guilty! Life in prison!" and the LIFE board are up from 0.0 s).
// Blocking, camera, cut-in, captions and sound are Court Day's (05-court-day/DESIGN.md, GPT-6.2 Sol), which Jonny posted
// as it was and which held 41 % to the end. The Dragon takes Mash's spot beside the bench. No call to action (story.md).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);   // on a frame

// measured spoken lengths (node qa/lines.mjs desk06-voice-probe.json), in LINES order
const DUR = [1.74, 2.58, 1.71, 0.85, 1.44, 1.76, 2.32, 3.04, 1.77, 2.32, 2.87, 1.32, 1.80];
// the pause before each line (Jonny 17 Nov: pace up; the judge answers fast, the scare is slow)
const GAP = [0.05, 0.2, 0.2, 0.15, 0.2, 0.15, 0.3, 0.25, 0.2, 0.3, 0.25, 0.2, 2.1];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (Court Day's)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
// layout round 1: no bag in Wedge's hands, so his free arm reached the bench (queue and side spots off it); the Dragon's
// wings hit the wall at the back of the queue and he hid behind Wedge (his spot forward and right); his lean met the bench
// draft 1: at the back of the queue only the Dragon's eye showed at the frame edge, so he waits in the middle spot (Q1)
// and Wedge at the back (Q2); Wedge comes forward round the Dragon's right (WVIA)
const MARK = [0.45, 1.1], Q1 = [0.5, 0.05], Q2 = [1.4, -0.65], DRAGON_SPOT = [0.6, 0.3], WVIA = [1.58, 0.45];
const CHIP_SIDE = [0.0, 2.3], WEDGE_SIDE = [-0.8, 1.3], EXIT = [2.15, 0.45];
const D_YAW = -20, DRAGON_YAW = -45;
const AT_JUDGE = [-0.8, 0.55], AT_US = [0, 0.05];
const rad = (d) => (d * Math.PI) / 180;
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge", at: VIK, face: 8, expr: "stern", follow: 0.2, seed: 1.7 },
  { id: "chip", character: "potatobrawl/chip", at: MARK, face: D_YAW, expr: "sad", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: Q2, face: D_YAW, expr: "annoyed", follow: 0.3, seed: 3.1 },
  { id: "dragon", character: "potatobrawl/dragon", at: Q1, face: D_YAW, expr: "smug", follow: 0.3, seed: 4.4 },
];

const at3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
const GREST = [-1.12, DECK + 0.06, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0 };
const MUG_AT = [-0.5, DECK, -0.08];
const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("campmug", MUG_AT, 8) };
// the board: each "life" turns into a lifespan; it wraps back to LIFE for the loop
const STATES = ["LIFE", "3", "LIFE", "3", "LIFE", "1000", "3"], UNITS = ["", "WEEKS", "", "MONTHS", "", "YEARS", "WEEKS"];
// (draft 2 had nose smoke: it read as a smudge over his eye on a phone, so draft 3 leaves it out; the lean, the evil face and
// the snort carry the threat)
const SNOUT = [0.25, 0.61, 0.53];   // between his eyes and mouth after the lean, 6 cm in front (layout 18 Nov)
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
  GAVEL, MUG,
];

// captions: upper third, under the band Jonny's in-app title takes (never over faces); numbers as digits
const SUB = 470;
const CAPTEXT = {
  0: "Guilty! *LIFE* in prison!", 1: "But I'm a potato. I only last *3 weeks.*", 2: "Fine. *3 WEEKS!*", 3: "heh heh",
  6: "Next! *LIFE* in prison!", 7: "I live in the fridge. *3 months.*", 8: "Fine. *3 MONTHS!*", 9: "Next! *LIFE* in prison!",
  10: "I'm a dragon. I live *1000 years.*", 11: "*1000 YEARS!*", 12: "...*3 weeks.* Case closed.",
};
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  cap(T[i], to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- the gavel (the only hold)
const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
// a walk: turn to the heading, walk, turn to `yawEnd`
const walk = (who, t, from, to, dur, yawEnd) => {
  const hd = heading(from, to);
  A(t, who, "turn", { to: hd, dur: 0.5, ease: "inOut" });
  A(r3(t + 0.5), who, "move", { to, dur, ease: "inOut" });
  const e = r3(t + 0.5 + dur);
  A(r3(e - 0.05), who, "turn", { to: yawEnd, dur: 0.55, ease: "inOut" });
  return r3(e + 0.25);
};
// a gavel strike: up, down onto the block (the tok and the board flip on the hit)
const strike = (t, flipTo, { up = 0.16, gain = 1.6 } = {}) => {   // 1.6: the toks stood under the bed on a phone at 1.2
  let e = gv.carry(t, [GREST[0] - 0.06, GREST[1] + up, GREST[2] + 0.02], 0.16, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.07, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  if (flipTo != null) { c.prop(r3(e - 0.01), "board", { flip: flipTo }, 0.2); sfx(r3(e + 0.06), "kenney/switch", { gain: 0.45 }); }
  return e;
};

// ---------------------------------------------------------------- frame 0: the trial is running
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
for (const who of ["chip", "wedge", "dragon"]) A(0, who, "turn", { to: D_YAW, dur: 0.01 });
c.prop(0, "board", { flip: 0 }, 0.01);
gv.take(0, { reach: 0.01, settle: 0.01 });
A(0, "vik", "look", { to: [0.5, -0.45], dur: 0.01, blink: false });
A(0, "vik", "expr", { expr: "angry", dur: 0.01 });
A(0, "chip", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "wedge", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
A(0, "dragon", "look", { to: AT_JUDGE, dur: 0.01, blink: false });
act.blinksAt(c, "vik", [2.3, 9.1, 15.9]);
act.blinksAt(c, "chip", [3.9, 12.4, 20.6]);
act.blinksAt(c, "wedge", [5.6, 14.9, 22.8]);
act.blinksAt(c, "dragon", [6.6, 13.2, 25.1]);

// 1 VIKING: Guilty! Life in prison! (tok on "prison"; the board already reads LIFE)
say(0);
strike(r3(END_OF(0) - 0.35), null);
see(0, END_OF(0), ["vik.face", "chip.face", "board"], "the judge gives Chip life; the board says LIFE");
// 2 CHIP (tiny): But I'm a potato. I only last three weeks.
A(r3(T[1] - 0.1), "chip", "expr", { expr: "sad", dur: 0.2 });
say(1);
// 3 VIKING: Fine. Three weeks! (tok, board -> 3 WEEKS)
A(r3(T[2] - 0.15), "vik", "expr", { expr: "annoyed", dur: 0.2 });
say(2);
const S1 = strike(r3(T[2] + 0.6), 1);
A(r3(S1), "chip", "expr", { expr: "shocked", dur: 0.12 });
see(T[2], r3(S1 + 0.6), ["vik.face", "board", "chip.face"], "3 WEEKS on the board");
// 4 the DRAGON chuckles in the line; the judge glares: Why are you laughing? / DRAGON: Oh, nothing.
A(r3(T[3] - 0.1), "dragon", "expr", { expr: "evil", dur: 0.15 });
say(3);
A(r3(T[4] - 0.25), "vik", "look", { to: [1, 0.1], dur: 0.2 }); A(r3(T[4] - 0.25), "vik", "expr", { expr: "annoyed", dur: 0.2 });
say(4);
A(r3(T[5] - 0.15), "dragon", "expr", { expr: "smug", dur: 0.2 });
say(5);
see(T[3], END_OF(5), ["dragon.face", "vik.face"], "the Dragon chuckles: oh, nothing");
// 5 Chip shuffles off; Wedge steps up. VIKING: Next! Life in prison! (tok, board -> LIFE)
const W1 = r3(END_OF(5) - 0.3);
A(W1, "chip", "expr", { expr: "sad", dur: 0.25 });
walk("chip", W1, MARK, CHIP_SIDE, 1.0, 15);
const W1b = walk("wedge", r3(W1 + 0.1), Q2, WVIA, 1.1, heading(WVIA, MARK));
const W1c = walk("wedge", r3(W1b - 0.3), WVIA, MARK, 1.1, D_YAW);
// his line waits until he stands on the mark (every later line moves with it)
{ const late = r3(W1c - 0.2 - T[7]); if (late > 0) for (let k = 7; k < T.length; k++) T[k] = r3(T[k] + late); }
A(r3(W1 + 0.4), "vik", "look", { to: [0.5, -0.45], dur: 0.25 }); A(r3(W1 + 0.4), "vik", "expr", { expr: "stern", dur: 0.25 });
say(6);
strike(r3(END_OF(6) - 0.35), 2);
// 6 WEDGE: I live in the fridge. Three months.
say(7);
// 7 VIKING: Fine. Three months! (tok, board -> 3 MONTHS)
A(r3(T[8] - 0.15), "vik", "expr", { expr: "annoyed", dur: 0.2 });
say(8);
const S2 = strike(r3(T[8] + 0.6), 3);
A(r3(S2), "wedge", "expr", { expr: "shocked", dur: 0.12 });
see(T[8], r3(S2 + 0.6), ["vik.face", "board", "wedge.face"], "3 MONTHS on the board");
// 8 Wedge walks off; the Dragon steps up beside the bench. VIKING: Next! Life in prison! (tok, board -> LIFE)
const W2 = r3(S2 + 0.35);
A(W2, "wedge", "expr", { expr: "sad", dur: 0.2 });
// two legs: a step toward us first, then left along the front (the right arm swung into the bench's front edge)
const VIA = [0.15, 1.35];
const W2b = walk("wedge", W2, MARK, VIA, 0.5, heading(VIA, WEDGE_SIDE));
walk("wedge", r3(W2b - 0.3), VIA, WEDGE_SIDE, 0.9, 10);
// one small step, no turn first (a turn on the spot swung his wing into the bench), once Wedge has left the mark
A(r3(W2 + 0.9), "dragon", "move", { to: DRAGON_SPOT, dur: 0.6, ease: "inOut" });
A(r3(W2 + 1.3), "dragon", "turn", { to: DRAGON_YAW, dur: 0.5, ease: "inOut" });
const D1 = r3(W2 + 2.0);
A(r3(W2 + 0.3), "vik", "look", { to: [0.6, -0.3], dur: 0.25 }); A(r3(W2 + 0.3), "vik", "expr", { expr: "stern", dur: 0.25 });
// "Next!" is said while he walks; his line waits until he stands at the bench (every later line moves with it)
{ const late = r3(D1 - 0.1 - T[10]); if (late > 0) for (let k = 10; k < T.length; k++) T[k] = r3(T[k] + late); }
say(9);
strike(r3(END_OF(9) - 0.35), 4);
// 9 DRAGON: I'm a dragon. I live a thousand years.
A(r3(T[10] - 0.1), "dragon", "expr", { expr: "cocky", dur: 0.2 });
say(10);
// 10 VIKING (delighted): A thousand years! (tok, board -> 1000 YEARS)
A(r3(T[11] - 0.15), "vik", "expr", { expr: "delighted", dur: 0.2 });
say(11);
const S3 = strike(r3(T[11] + 0.55), 5);
see(T[11], r3(S3 + 0.6), ["vik.face", "board", "dragon.face"], "1000 YEARS on the board");
// 11 the Dragon leans in over the bench with an evil grin and snorts; the judge gulps (the one cut-in, on his face)
const LEAN = r3(S3 + 0.35);
A(LEAN, "dragon", "lean", { to: 8, dur: 0.45, ease: "inOut" });
A(LEAN, "dragon", "expr", { expr: "evil", dur: 0.2 });
const PUFF = r3(LEAN + 0.45);
sfx(PUFF, "snort", { gain: 0.5 });   // a short breath out through the nose (no cartoon gulp: realistic sounds only)
A(r3(PUFF + 0.1), "vik", "expr", { expr: "terrified", dur: 0.15 });
A(r3(PUFF + 0.1), "vik", "lean", { to: -6, dur: 0.3, ease: "out" });
see(PUFF, r3(PUFF + 1.0), ["dragon.face", "vik.face"], "the Dragon leans in at the judge");
const CUT = F(PUFF + 0.9), BACK = F(CUT + 1.4);
see(CUT, BACK, ["vik.face"], "the judge gulps");
// 12 back in the wide: VIKING (small): ...Three weeks. Case closed. (soft tok, board -> 3 WEEKS)
T[12] = r3(BACK + 0.2);
say(12);
const S4 = strike(r3(END_OF(12) - 0.3), 6, { up: 0.1, gain: 0.55 });
// 13 the Dragon, delighted, leans back and strolls out; Chip and Wedge turn and stare at us
const OUT = r3(S4 + 0.2);
A(r3(OUT - 0.1), "dragon", "lean", { to: 0, dur: 0.35, ease: "inOut" });
A(OUT, "dragon", "expr", { expr: "delighted", dur: 0.2 });
const EXIT_YAW = heading(DRAGON_SPOT, EXIT);
// he starts walking off before he turns (a turn on the spot swung his tail into the bench)
A(r3(OUT + 0.2), "dragon", "move", { to: EXIT, dur: 2.1, ease: "inOut" });
A(r3(OUT + 0.65), "dragon", "turn", { to: EXIT_YAW, dur: 0.6, ease: "inOut" });
A(r3(OUT + 0.2), "chip", "turn", { to: 0, dur: 0.4 }); A(r3(OUT + 0.2), "chip", "look", { to: AT_US, dur: 0.3 });
A(r3(OUT + 0.35), "wedge", "turn", { to: 0, dur: 0.4 }); A(r3(OUT + 0.35), "wedge", "look", { to: AT_US, dur: 0.3 });
A(r3(OUT + 0.2), "chip", "expr", { expr: "deadpan", dur: 0.3 }); A(r3(OUT + 0.35), "wedge", "expr", { expr: "deadpan", dur: 0.3 });
A(r3(OUT + 0.4), "vik", "expr", { expr: "deadpan", dur: 0.3 });
const END = F(OUT + 2.6);
see(r3(OUT + 0.8), END, ["chip.face", "wedge.face"], "Chip and Wedge stare at us");

// ---------------------------------------------------------------- the one wide shot + the one cut-in (Court Day's)
const WIDE = { pos: [0, 1.45, 10.4], look: [0, 1.45, 0], fov: 26 };
const beats = c.beats([
  ["life for chip", 0, WIDE, "hook"],
  ["life for wedge", T[6], "keep"],
  ["the dragon", T[9], "keep", "escalation"],
  ["gulp", r3(CUT - 0.004), { pos: [-0.8, 2.05, 3.8], look: [-0.76, 1.8, -0.4], fov: 24 }],
  ["case closed", r3(BACK - 0.004), { ...WIDE }, "payoff"],
], END);

write(import.meta.url, {
  id: "life-sentence",
  title: "He beat a life sentence",
  idea: "Potato Desk 06: a Viking judge gives everyone life in prison, and each life turns into how long they live; the dragon lives 1000 years, so the scared judge gives him 3 weeks.",
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
  hook: { show: ["vik", "chip", "board"], hint: 0, what: "a judge gives a tiny potato life in prison; the board says LIFE" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair" },
    { who: "wedge", with: "dragon", from: r3(W1 + 0.05), to: r3(W1 + 1.3), reason: "Wedge's right glove brushes the tip of the Dragon's tail while he turns out of the queue (both at the back of the frame, the tail half behind the Dragon)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/06-life-sentence/make-life-sentence.mjs.",
});
