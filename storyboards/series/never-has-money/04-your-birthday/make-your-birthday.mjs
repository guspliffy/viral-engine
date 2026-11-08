// THAT ONE FRIEND WHO NEVER HAS MONEY… AT YOUR BIRTHDAY (never has money, episode 4, 8 Nov 2026), from the clip template.
//   node storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs -> your-birthday.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/04-your-birthday/ there (PANELS.md here).
//
// Staging proof: the director's blocking (8 Nov, workflow v2). Acting, holds, sound and music: the clip writer (W1, 8 Nov);
// the places moved for the writing are marked "W1:" with the reason (PANELS.md, "Departures (writer)").
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper, Viking; at Viking's birthday at home, no Samurai)
//   Joke:        Viking's birthday: the Wizard hands over a huge purple present, Reaper a neat black box. All eyes on
//                Gunslinger, empty-handed. Pocket pat, the moth. He scribbles a hand-drawn "FREE HUG" coupon on his knee.
//                Viking reads it, bursts into happy tears, drops the expensive presents and bear-hugs him off the floor.
//   Wants:       Gunslinger wants to get away with no present.
//   Consequence: the cheapest gift wins; the Wizard's big present lies ignored on the rug.
//   Ending:      the wink over Viking's shoulder at the stunned Wizard, "Next year's on me!".
//   Callback:    frame 0 the Wizard proudly hands over the biggest present; the last frame he stares at it ignored.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the coupon up at 4.2, the hug lands at 6.0 on the story's clock = 6.1 on the video's) make
// 9.8 s of story exactly 10.0 s of video. Actions, sounds, captions and see() are on the story's clock; music parts
// and the allowClip windows are on the video's clock (VC below)
const END = 9.8, HS1 = 4.2, HS2 = 6.0;
const VC = (ts) => r3(ts + (ts >= HS1 ? 0.1 : 0) + (ts >= HS2 ? 0.1 : 0));
// subtitles inside y 470-1360 (TikTok's safe zone, clear of Jonny's in-app title at the top)
const SUB_LOW = 1250;

// ---------------------------------------------------------------- the living room (world metres; camera at +z)
// The back wall (the painted plate) at z -2.2; the rug in the middle. Frame 0 (panel 01): the handover moment: the
// Wizard at the left edge has both mittens on the far side of the big present, Viking's gloves on its ends; Gunslinger a
// step behind the row, centre left, his face in the gap between the Wizard and the present; Reaper at the right edge with
// the black box at his chest. 0.2 the Wizard lets go, Viking draws the box in to his belly; Reaper steps in and sets the
// black box on its lid (0.65-0.9); both step back to the sides (0.5-1.3). 1.0-1.2 "And yours?": every head turns to
// Gunslinger, who steps up into the row. 2.8 "wait!": he hurries to the crate at the front left, sits turned half away
// and writes on his knee (03: Viking steps closer to peek, the Wizard moves round behind him). 3.95 he hops up and
// holds the coupon up to us (04), then turns and holds it out to Viking in his left mitten; Viking, stepped forward,
// takes it in his left mitten, the presents in his right arm (05: the Wizard behind his left shoulder, Reaper behind his
// right). 6.0 the presents fly off his arm, he lunges, lifts Gunslinger and swings him round his front to his right
// (06-07: Viking at the left, Gunslinger at the right, lifted, cheek to cheek); 8.05-8.45 the rocking turns them on
// until Viking's back is to the camera and Gunslinger, lifted higher, winks down at the Wizard over his shoulder (08).
// W1 (writer) place changes: G0 a step behind the row and the Wizard further left (frame 0 showed Gunslinger's face
// behind the Wizard's hat: with the Wizard's reach ~0.6 m his body stands where that face projects, so Gunslinger stands
// behind, in the gap); V0 right by 0.1 and facing -45 (the stack at his belly clear of his face and of Gunslinger's);
// GP: Gunslinger steps up into the row at 1.15 for the pocket pat; V3/W3 further back (the stack cleared the seated
// Gunslinger's back by 10 cm at the director's V3); the hug keyframes re-spaced to 0.7 m between the centres (0.57
// merged the bodies 57 %) with the swing on an arc.
const G0 = [-0.2, -0.85], GP = [-0.35, -0.62];         // Gunslinger: a step behind the row at frame 0; up in the row from 1.4 (the pocket pat)
const V0 = [0.7, -0.5], V0_YAW = -45;                  // Viking: centre right, turned to the Wizard
const V0b = [0.8, -0.55], V0b_YAW = -40;               // 1.1 Viking eases right as he turns to look (clear of the brim in 02)
const W_IN = [-0.85, 0.02], W_IN_YAW = 50;             // frame 0: the Wizard stepped in to push the present over (cut by the left edge; 0.6 from the crate)
const R_IN = [1.5, 0.3], R_IN_YAW = -55;               // Reaper at the right edge, the black box at his chest; he leans in to set it on the lid (no step: a step in put his hood over Viking's face)
const W0 = [-1.15, -0.5], W0_YAW = 80;                 // a step back to the side (0.5-1.0), his face still in 01, looking across at Gunslinger
const R0 = R_IN, R0_YAW = -95;                         // 1.15 he turns to look across at Gunslinger
const CRATE = [-1.05, 0.6], CRATE_YAW = -35;           // his seat at the front left (a wooden crate, 0.34 m); he sits turned half away
const G1 = [-0.35, 1.1];                               // 3.95 he hops up off the crate toward Viking (04, then 05)
const V1 = [0.55, 0.6], V1_YAW = -40;                  // 4.55 Viking steps to him for the coupon; 5.02 he turns to us (-8) to read it
const V3 = [0.0, -0.3], W3 = [0.75, -1.1];             // 3.05 Viking steps closer to peek (03, behind him at the right); the Wizard
                                                       // moves round behind Viking to see (out of 03, so nothing pokes from his hat)
const W1 = [-0.1, -0.4], R1 = [1.15, -0.2];           // 4.6/4.9 they step in behind Viking's left and right shoulders (05)
const W2 = [-0.35, 1.8], R2 = [1.3, 2.0];             // at their presents on the rug, in front of the hug (07)
const W4 = [-0.6, 0.95], W4_YAW = 60;                  // 8.3 the Wizard backs off a step, under Gunslinger's eyes: his face in 08's bottom-left foreground
const GIFT_P = [0.25, 2.3], GIFT_B = [0.85, 2.4];      // where the presents are aimed (6.0-6.4): in front of them
const yawTo = ([x0, z0], [x1, z1]) => r3((Math.atan2(x1 - x0, z1 - z0) * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;
const fwdOf = (yaw) => [Math.sin(rad(yaw)), Math.cos(rad(yaw))];
const leftOf = (yaw) => [Math.cos(rad(yaw)), -Math.sin(rad(yaw))];   // the character's own left (screen right when facing us)
// a world point f metres in front of someone at [x, z] facing yaw, l metres to their own left, at height y
const bf = ([x, z], yaw, f, l, y) => { const F = fwdOf(yaw), L = leftOf(yaw); return [r3(x + f * F[0] + l * L[0]), r3(y), r3(z + f * F[1] + l * L[1])]; };
// a point just off a potato body's surface: cl toward its own left (-1..1), cf toward its front, dy above the body's
// middle (0.65 up from the floor standing); half sizes from characters/*.json, plus a glove's gap
const onBody = ([x, y0, z], yaw, [rx, rz], cl, cf, dy) => {
  const F = fwdOf(yaw), L = leftOf(yaw), k = Math.sqrt(Math.max(0, 1 - (dy / 0.51) ** 2)) * 1.06, n = Math.hypot(cl, cf) || 1, a = (cl / n) * rx * k, b = (cf / n) * rz * k;
  return [r3(x + a * L[0] + b * F[0]), r3(y0 + 0.65 + dy), r3(z + a * L[1] + b * F[1])];
};
const GSL = [0.4, 0.34], VIK = [0.43, 0.37];

const cast = [
  { id: "vik", character: "always-orders-potatoes/viking", at: V0, face: V0_YAW, expr: "delighted", follow: 0.3, seed: 4.1 },
  { id: "gsl", character: "never-has-money/gunslinger", at: G0, face: 10, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "wiz", character: "never-has-money/wizard", at: W_IN, face: W_IN_YAW, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "rea", character: "never-has-money/reaper", at: R_IN, face: R_IN_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
];

// ---------------------------------------------------------------- the presents (grips.box: both palms on the two ends)
// The stack rides in Viking's hands: the big box's bottom centre at `P`, the black box on its lid at `B` (the middle of
// the lid's edge toward his left: the giant bow takes the lid's middle). Frame 0 the box is held out in front toward the
// Wizard (both gloves on its ends); from 0.55 it hangs low at his LEFT side, where Reaper can reach its lid from the
// right and the stack stands clear of his face (held in front, the black box's bow came up to his mouth from every
// camera); from 4.42 his left glove alone holds its far end, the box against his left side (05: the coupon in his right)
const BIG = { w: 0.46, h: 0.34 }, SMALL = { w: 0.22, h: 0.14 };
const BTOP = r3(BIG.h + 0.03);   // the lid's top above the box's bottom
const FRONT = (V, yaw, y = 0.04, f = 0.62) => ({ P: bf(V, yaw, f, -0.15, y), B: bf(V, yaw, r3(f + 0.11), -0.04, r3(y + BTOP)) });
const SIDE = (V, yaw, f = 0.42, l = 0.66) => ({ P: bf(V, yaw, f, l, 0.04), B: bf(V, yaw, f, r3(l + 0.12), r3(0.04 + BTOP)) });
const ONE = (V, yaw) => ({ P: bf(V, yaw, 0.6, 0.25, 0.05), B: bf(V, yaw, 0.6, 0.37, r3(0.05 + BTOP)) });
const S0 = FRONT(V0, V0_YAW, 0.1, 0.85);   // frame 0: the handover, the box held out between them
const S1 = SIDE(V0, V0_YAW);
const GIFTP = { id: "giftP", kind: "bowgift", x: S0.P[0], y: S0.P[1], z: S0.P[2], rot: r3(V0_YAW + 180), w: BIG.w, h: BIG.h, color: "#7d3fb8", ribbon: "#e7b43a" };
const RB0 = bf(R_IN, R_IN_YAW, 0.48, 0, 0.5);   // the black box at Reaper's chest
const GIFTB = { id: "giftB", kind: "bowgift", x: RB0[0], y: RB0[1], z: RB0[2], rot: r3(R_IN_YAW + 180), w: SMALL.w, h: SMALL.h, color: "#26232a", ribbon: "#c9ced6" };
// the hero prop (props-birthday.js): drawing on +z (rot = yaw + 180 shows it to the camera when he faces us, to Viking
// when he holds it out to him; a first still with flip: true showed us the blank back); ink 0..1 writes it, fold 1 =
// the little square from his bandana
const COUPON = { id: "coupon", kind: "coupon", x: GP[0], y: 0.56, z: r3(GP[1] + 0.3), rot: 190, ink: 0, fold: 1, scale: 0.001, staged: "folded under his bandana until he pulls it out" };
// the pen in his bandana's knot (as in 02: his arm can't reach a hat band past that brim; PANELS.md)
const PEN = { id: "pen", kind: "feltpen", x: GP[0], y: 0.6, z: r3(GP[1] + 0.29), rot: 190, scale: 0.001, staged: "tucked in his bandana's knot until he pulls it out" };
const props = [
  { id: "floor", kind: "plankfloor", x: 0, z: 0.4, w: 7, d: 6 },
  { id: "rug", kind: "rug", x: 0.15, z: 0.9, w: 3.6, d: 3.4, color: "#a8473a" },
  { id: "caketable", kind: "coffeetable", x: -1.6, z: 1.55, w: 0.7, d: 0.5, h: 0.42 },
  { id: "cake", kind: "cake", x: -1.6, y: 0.42, z: 1.55, lit: 1 },
  { id: "crate", kind: "crate", x: CRATE[0], z: CRATE[1], rot: CRATE_YAW, size: 0.34 },
  GIFTP, GIFTB, COUPON, PEN,
  // the Wizard's party horn: blown from his lips at the box, rolled up and gone by 0.5
  { id: "horn", kind: "partyhorn", mouth: "wiz", target: "giftP", at: [0, 0.5, 0], x: 0, y: 0, z: 0, show: 1, blow: 0, flutter: 0, droop: 0 },
  // worn (T2 bench offsets, body frame): Gunslinger's striped cone on top of his cowboy hat, Viking's small blue dotted
  // cone in his hair (on in 06-08 as the correction prompt asks), his gold rosette on the chest
  { id: "hatG", kind: "partyhat", wear: "gsl", x: 0.06, y: 1.31, z: 0, color: "#d8392b", accent: "#f2c14e", pattern: "stripes", pom: "#f2c14e" },
  { id: "hatV", kind: "partyhat", wear: "vik", x: 0.08, y: 1.2, z: 0.08, tilt: 14, color: "#3d7fd1", accent: "#f2c14e", pattern: "dots", pom: "#f2c14e" },
  { id: "ros", kind: "rosette", wear: "vik", x: -0.2, y: 0.5, z: 0.36 },
  // the bunting across the top of the room (every panel): in front of the plate, in the top fifth of P01, above every
  // head and hat (Gunslinger lifted in the hug tops out at ~2.3 m)
  { id: "bunt", kind: "bunting", x: 0, y: 2.22, z: -1.5, w: 3.6, sag: 0.24, count: 15, colors: ["#8a4fc4", "#f2c14e", "#e97a9a"], faces: true },
  // the wallet and the moth come with the pocket-pat block (the wallet down in his holster until he draws it)
  ...patProps({ who: "gsl", at: GP, yaw: 10 }).map((p) => (p.id === "wallet" ? { ...p, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : p)),
];

// the stack in Viking's hands: `one` = his left hand alone on the box's left end (05)
const hP = grips.box(c, "vik", GIFTP);
const GRIP_L1 = [r3(-(BIG.w / 2 + 0.045)), r3(BIG.h * 0.55), 0];
function stackTo(t, S, yaw, dur, ease = "inOut", { one = false, withB = true } = {}) {
  const rot = r3(yaw + 180);
  if (one) { c.arm(t, "vik", "L", { prop: "giftP", grip: GRIP_L1, palm: true, at: S.P }, dur, ease); c.prop(t, "giftP", { rot }, dur, ease); }
  else hP.carry(t, S.P, dur, ease, { rot });
  if (withB) c.prop(t, "giftB", { x: S.B[0], y: S.B[1], z: S.B[2], rot }, dur, ease);
  return r3(t + dur);
}

// ================================================================ 1 PAY UP 0-1.5 (panel 01, the wide)
// frame 0: the handover. Viking's gloves on the big box's ends, the Wizard's mittens flat on its far side, pushing it
// over; the horn toots from the Wizard's lips. Reaper, deadpan, holds the black box at his chest at the right edge.
// Gunslinger a step behind, hands empty, eager (he thinks it is a great party).
c.prop(0, "coupon", { ink: 0, fold: 1 }, 0); c.prop(0, "giftP", { lid: 0 }, 0); c.prop(0, "giftB", { lid: 0 }, 0);
for (const s of ["R", "L"]) { c.arm(0, "vik", s, { prop: "giftP", grip: hP.hands[s].grip, palm: true, at: S0.P }, 0); A(0, "vik", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "vik", "grab", { prop: "giftP", hand: "both", grip: [0, r3(BIG.h * 0.55), 0], dur: 0, pose: null });
A(0, "vik", "look", { to: [-0.35, 0.05], dur: 0, blink: false });   // at the Wizard
A(0, "vik", "expr", { expr: "delighted", set: { curve: 0.85, open: 0.3 }, dur: 0 });
// the Wizard's mittens on the far side of the box (the hold frame: -z is away from the holder)
for (const [s, sx] of [["R", 1], ["L", -1]]) { c.arm(0, "wiz", s, { prop: "giftP", grip: [sx * 0.12, r3(BIG.h * 0.5), r3(-(BIG.w / 2 + 0.045))], palm: true, at: S0.P }, 0); A(0, "wiz", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "wiz", "pitch", { to: 8, dur: 0 });   // leaning into the push
A(0, "wiz", "look", { to: [0.45, 0.0], dur: 0, blink: false });   // at Viking
A(0, "wiz", "expr", { expr: "happy", set: { curve: 0.5, open: 0.1, pucker: 0.5 }, dur: 0 });   // lips round the horn
// the horn: one toot (the paper unrolls and buzzes), rolled back and gone by 0.45
c.prop(0, "horn", { blow: 1, flutter: 1 }, 0.1, "out");
sfx(0, "partyhorn", { gain: 0.6, reason: "the Wizard's party horn: one toot from his lips as he pushes the present over" });
c.prop(0.28, "horn", { blow: 0, flutter: 0 }, 0.12, "in");
c.prop(0.4, "horn", { show: 0 }, 0.06, "in");
// 0.2 he lets go; Viking draws the box in to his belly (a wrapping-paper rustle); the Wizard straightens, beams
// "Happy birthday!" (0.45: with the horn in his mouth the line can't come at 0.05) and steps back to the side
sfx(0.22, "ai-package/cardboard-rustle", { gain: 0.35, reason: "the big present drawn in against Viking's belly: the wrapping paper rustles" });
for (const s of ["R", "L"]) { A(0.18, "wiz", "grip", { side: s, shape: "open", dur: 0.12 }); c.arm(0.2, "wiz", s, { o: [0.08, 0.5, 0.36] }, 0.2, "out"); }
A(0.2, "wiz", "pitch", { to: 0, dur: 0.3, ease: "settle" });
stackTo(0.2, S1, V0_YAW, 0.35, "out", { withB: false });
A(0.3, "vik", "look", { to: [-0.1, -0.5], dur: 0.15, blink: false });   // down at his big present
A(0.45, "wiz", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.45 }, dur: 0.12 });
c.say(0.45, "wiz", "happy birthday!", 0.55, "excited", { voice: false, sub: "Happy birthday!", pos: SUB_LOW });
A(0.5, "wiz", "squash", { amount: 0.03, dur: 0.2 });
for (const s of ["R", "L"]) { c.arm(0.95, "wiz", s, "rest", 0.4, "settle"); A(0.95, "wiz", "grip", { side: s, shape: "relaxed", dur: 0.2 }); }
A(0.55, "wiz", "move", { to: W0, dur: 0.45, steps: 3 }); A(0.55, "wiz", "turn", { to: W0_YAW, dur: 0.45 });
// Reaper: the black box at his chest, deadpan; 0.3 he steps in, 0.65 sets it on the lid's corner, lets go, steps back
const hB = grips.box(c, "rea", GIFTB);
for (const s of ["R", "L"]) { c.arm(0, "rea", s, { prop: "giftB", grip: hB.hands[s].grip, palm: true, at: RB0 }, 0); A(0, "rea", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "rea", "grab", { prop: "giftB", hand: "both", grip: [0, r3(SMALL.h * 0.55), 0], dur: 0, pose: null });
A(0, "rea", "look", { to: [-0.35, -0.1], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.4, dur: 0 });
A(0.55, "rea", "look", { to: [-0.3, -0.45], dur: 0.12, blink: false });   // on the lid, as the box arrives at Viking's side
A(0.6, "rea", "pitch", { to: 12, dur: 0.25 });
hB.carry(0.6, [S1.B[0], r3(S1.B[1] + 0.1), S1.B[2]], 0.22, "inOut", { rot: r3(V0_YAW + 180) });
hB.place(0.82, S1.B, 0.1);
sfx(0.9, "ai-package/box-set-down", { gain: 0.4, reason: "Reaper sets his neat black box down on the big present's lid" });
A(0.94, "rea", "release", { prop: "giftB", to: S1.B, dur: 0.04 });   // it stays on the lid (it rides along with Viking's box from here)
for (const s of ["R", "L"]) { A(0.94, "rea", "grip", { side: s, shape: "open", dur: 0.15 }); c.arm(0.98, "rea", s, "rest", 0.4, "settle"); A(1.2, "rea", "grip", { side: s, shape: "relaxed", dur: 0.2 }); }
A(0.95, "rea", "pitch", { to: 0, dur: 0.3, ease: "settle" });
see(0, 0.4, ["wiz.face", "vik.face", "gsl.face", "rea.face", "giftP"], "panel 1: the handover: the Wizard's mittens on the big present, Viking's gloves on it, all four faces");
see(0.65, 0.95, ["rea.face", "giftB", "giftP", "vik.face"], "panel 1: Reaper sets the black box on the big present");
// 1.0-1.2 "And yours?": the Wizard's eyes go to Gunslinger first, then his line; Viking and Reaper look across after
// him; Gunslinger, caught, steps up into the row with a small start
A(1.0, "wiz", "look", { to: [0.75, -0.05], dur: 0.15, blink: false });
A(1.05, "wiz", "expr", { expr: "eager", set: { curve: 0.3, open: 0.2 }, dur: 0.15 }); A(1.05, "wiz", "face", { brow: 0.35, dur: 0.2 });
c.say(1.1, "wiz", "and yours?", 0.5, "calm", { voice: false, sub: "And yours?", pos: SUB_LOW });
A(1.1, "vik", "move", { to: V0b, dur: 0.25 }); A(1.1, "vik", "turn", { to: V0b_YAW, dur: 0.25 });
stackTo(1.1, SIDE(V0b, V0b_YAW, 0.5, 0.55), V0b_YAW, 0.25);   // a little more in front: in 02's frame at the right edge
A(1.15, "vik", "look", { to: [-0.55, -0.1], dur: 0.15, blink: false });
A(1.2, "vik", "expr", { expr: "eager", set: { curve: 0.4, open: 0.15 }, dur: 0.2 }); A(1.2, "vik", "face", { brow: 0.3, dur: 0.2 });   // expectant
A(1.15, "rea", "turn", { to: R0_YAW, dur: 0.2 }); A(1.18, "rea", "look", { to: [-0.6, -0.1], dur: 0.15, blink: false });
A(1.1, "gsl", "look", { to: [-0.4, 0.05], dur: 0.12, blink: false });   // at the Wizard
act.shock(c, 1.15, "gsl", { open: 0.2, hold: 0.2 });
A(1.2, "gsl", "move", { to: GP, dur: 0.22, steps: 1 });
A(1.4, "gsl", "expr", { expr: "eager", set: { curve: 0.2, open: 0.1 }, dur: 0.1 });
see(1.15, 1.45, ["wiz.face", "vik.face", "rea.face", "gsl.face"], "panel 1: every eyeline lands on Gunslinger");

// ================================================================ 2 THE POCKET PAT 1.5-2.8 (panel 02, the series block)
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
pocketPat(c, { who: "gsl", at: GP, yaw: 10, friend: [0.6, 0.05] });
A(1.6, "wiz", "face", { brow: 0.1, dur: 0.3 });
A(2.55, "wiz", "face", { lid: 0.45, dur: 0.2 });   // the moth: a slow droop of the lids
A(2.6, "rea", "face", { lid: 0.55, dur: 0.2 });
A(2.6, "vik", "face", { brow: 0.1, dur: 0.2 }); A(2.65, "vik", "expr", { expr: "kind", set: { curve: 0.2 }, dur: 0.2 });

// ================================================================ 3 THE DODGE 2.8-4.1 (panel 03)
// 2.8 "wait!": the wallet snaps shut and goes back in the holster, his left finger up; he hurries forward and left to
// the crate, sits turned half away (the crate's rot) and pulls the folded coupon from under his bandana and the pen from
// its knot; the paper unfolds on his knee and he scribbles, tongue out. Viking steps closer to peek, eyes narrowed; the
// Wizard moves round behind Viking; Reaper turns to watch.
const HOLSTER = patProps({ who: "gsl", at: GP, yaw: 10 })[0], HOL = [HOLSTER.x, HOLSTER.y, HOLSTER.z];
c.prop(2.78, "wallet", { open: 0 }, 0.08, "inOut");
c.arm(2.8, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: HOL }, 0.1, "inOut");
A(2.9, "gsl", "release", { prop: "wallet", to: HOL, dur: 0.04 });
c.prop(2.94, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.04, "inOut");
c.at(2.98, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.03, ease: "in", reason: "back down in his holster (part of his costume), so it walks with him" });
A(2.92, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.1 }); c.arm(2.94, "gsl", "R", "rest", 0.25, "inOut");
// the "wait!" finger: his left index up beside his face
c.arm(2.8, "gsl", "L", { o: [-0.02, 0.78, 0.3] }, 0.12, "out"); A(2.8, "gsl", "grip", { side: "L", shape: "point", set: { index: 0, curl: 1 }, dur: 0.1 });
A(2.8, "gsl", "expr", { expr: "eager", set: { curve: 0.5, open: 0.3, raise: 0.05 }, dur: 0.1 }); A(2.8, "gsl", "face", { brow: 0.4, dur: 0.1 });
act.emote(c, 2.82, "gsl", "wait!", { dur: 0.45, size: 96, dx: -0.4, dy: -0.75, angle: -6 });
A(2.82, "gsl", "squash", { amount: 0.03, dur: 0.12 });
// the hurry to the crate (eyes first), the finger comes down on the way
act.eyesLead(c, 2.98, "gsl", [-0.55, -0.35]);
A(2.96, "gsl", "move", { to: [-0.55, 0.05], dur: 0.18, steps: 2 }); A(2.96, "gsl", "turn", { to: -60, dur: 0.18 });
A(3.14, "gsl", "move", { to: [-0.85, 0.48], dur: 0.12, steps: 1 });
c.arm(3.05, "gsl", "L", "rest", 0.22, "inOut"); A(3.05, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
A(3.24, "gsl", "sit", { seat: "crate", dur: 0.18, hands: "keep", height: 0.34 });
sfx(3.38, "sit", { gain: 0.35, reason: "he plonks down on the wooden crate" });
// the seated body: on the crate's centre (sit puts it 3 cm forward), its bottom on the crate top
const SIT_Y = r3(0.34 - 0.12), C = [r3(CRATE[0] + Math.sin(rad(CRATE_YAW)) * 0.03), r3(CRATE[1] + Math.cos(rad(CRATE_YAW)) * 0.03)];
const KNOT = bf(C, CRATE_YAW, 0.29, 0.13, r3(0.6 + SIT_Y)), BAND = bf(C, CRATE_YAW, 0.3, -0.05, r3(0.56 + SIT_Y)), KNEE = bf(C, CRATE_YAW, 0.3, 0.1, r3(0.3 + SIT_Y));
const PROT = r3(CRATE_YAW + 180);
c.prop(3.2, "pen", { x: KNOT[0], y: KNOT[1], z: KNOT[2], rot: PROT }, 0.02, "linear");
c.prop(3.2, "coupon", { x: BAND[0], y: BAND[1], z: BAND[2], rot: PROT, tip: 0 }, 0.02, "linear");
// the pen: his right hand to the bandana's knot (a fingertip pinch), the cap clicks off
const pen = grips.thin(c, "gsl", { ...PEN, x: KNOT[0], y: KNOT[1], z: KNOT[2], rot: PROT, scale: 1 }, { side: "R", from: 0.72, roll: 20 });
c.prop(3.3, "pen", { scale: 1 }, 0.05, "out");
let tp = pen.secure(pen.approach(3.28, 0.1), 0.08);
sfx(r3(tp), "click", { gain: 0.3, reason: "the pen's cap clicked off" });
// the folded coupon: his left hand pinches it out from under the bandana and lays it on his knee, where it unfolds
const FOLD_GRIP = [0.03, 0.025, 0];
c.prop(3.32, "coupon", { scale: 1 }, 0.05, "out");
A(3.3, "gsl", "grip", { side: "L", shape: "open", dur: 0.08 });
c.arm(3.3, "gsl", "L", { prop: "coupon", grip: FOLD_GRIP, off: [0.05, 0.03, 0.05] }, 0.1, "inOut");
c.arm(3.4, "gsl", "L", { prop: "coupon", grip: FOLD_GRIP }, 0.06, "settle");
A(3.44, "gsl", "grip", { side: "L", shape: "pinch", dur: 0.06 });
A(3.48, "gsl", "grab", { prop: "coupon", hand: "L", grip: FOLD_GRIP, dur: 0, pose: null });
c.arm(3.5, "gsl", "L", { prop: "coupon", grip: FOLD_GRIP, at: KNEE }, 0.12, "inOut");
c.prop(3.5, "coupon", { tip: -90 }, 0.12, "inOut");   // flat on his knee, the drawing side up
c.prop(3.56, "coupon", { fold: 0 }, 0.1, "out");
sfx(3.56, "crinkle", { gain: 0.3, reason: "the folded paper shaken open on his knee" });
// the hand takes the unfolded sheet by its near edge from above, holding it flat
const FLAT_GRIP = [-0.162, 0.12, 0.065];
c.arm(3.64, "gsl", "L", { prop: "coupon", grip: FLAT_GRIP, palm: true, at: KNEE }, 0.1, "inOut");
A(3.66, "gsl", "grip", { side: "L", shape: "hold", dur: 0.08 });
A(3.72, "gsl", "grab", { prop: "coupon", hand: "L", grip: FLAT_GRIP, dur: 0.1, pose: null });
// the scribble: seven quick strokes over the sheet, the ink following (12 strokes drawn in 0.26 s), the pen squeaking
const SXa = leftOf(PROT), SZa = fwdOf(PROT);
const ON = (a, b) => [r3(KNEE[0] + a * SXa[0] + b * SZa[0]), r3(KNEE[1] + 0.015), r3(KNEE[2] + a * SXa[1] + b * SZa[1])];
const STROKES = [[-0.09, 0.04], [-0.03, 0.05], [0.03, 0.04], [0.08, 0.03], [-0.06, -0.03], [0.02, -0.04], [0.08, -0.02]];
tp = pen.carry(r3(Math.max(tp, 3.5)), ON(...STROKES[0]), 0.1, "inOut", { tip: -15 });
const INK = 3.62;
c.prop(INK, "coupon", { ink: 1 }, 0.26, "linear");
sfx(INK, "scribble", { gain: 0.45, dur: 0.3, reason: "the felt pen squeaking over the paper: FREE HUG and the two hugging potatoes" });
for (const s of STROKES.slice(1)) tp = pen.carry(r3(tp + 0.005), ON(...s), 0.035, "inOut");
A(3.35, "gsl", "look", { to: [0.1, -0.55], dur: 0.1, blink: false });
A(3.38, "gsl", "expr", { expr: "focused", set: { open: 0.42, pucker: 0.15, curve: 0.1 }, dur: 0.15 });   // tongue out (open > 0.35)
A(3.38, "gsl", "face", { lid: 0.25, brow: -0.1, dur: 0.2 });
A(3.26, "gsl", "pitch", { to: 10, dur: 0.3 });   // bent over his knee
// the others watch: Viking steps closer and peeks, eyes narrowed; Reaper turns; the Wizard goes round behind Viking
act.eyesLead(c, 3.0, "vik", [-0.6, -0.25]);
const V3_YAW = yawTo(V3, CRATE);
A(3.05, "vik", "move", { to: V3, dur: 0.35, steps: 2 }); A(3.05, "vik", "turn", { to: V3_YAW, dur: 0.3 });
stackTo(3.05, SIDE(V3, V3_YAW), V3_YAW, 0.35);
A(3.4, "vik", "face", { lid: 0.42, brow: -0.1, dur: 0.3 }); A(3.4, "vik", "expr", { expr: "kind", set: { curve: 0.1, open: 0 }, dur: 0.3 });
A(3.45, "vik", "pitch", { to: 7, dur: 0.35 }); A(3.5, "vik", "look", { to: [-0.55, -0.4], dur: 0.15, blink: false });
A(3.0, "rea", "turn", { to: yawTo(R0, CRATE), dur: 0.3 }); A(3.0, "rea", "look", { to: [-0.5, -0.3], dur: 0.2, blink: false });
A(3.25, "wiz", "look", { to: [0.6, -0.1], dur: 0.15, blink: false });
A(3.3, "wiz", "move", { to: [-0.5, -1.1], dur: 0.3, steps: 2 }); A(3.6, "wiz", "move", { to: W3, dur: 0.3, steps: 2 });
A(3.9, "wiz", "turn", { to: yawTo(W3, CRATE), dur: 0.3 }); A(3.95, "wiz", "look", { to: [-0.6, -0.3], dur: 0.15, blink: false });
A(3.4, "wiz", "face", { lid: 0, dur: 0.2 }); A(3.4, "rea", "face", { lid: 0.4, dur: 0.2 });
see(3.45, 3.9, ["gsl.face", "coupon", "vik.face"], "panel 3: he writes on his knee, tongue out, the moth on his brim; Viking peeks from behind at the right");

// ================================================================ 4 FREE HUG 4.1-4.6 (panel 04)
// 3.9 the flick: the pen dropped on the crate, he stands and hops up toward Viking, the coupon swung up to his chest in
// his left mitten, the right joins it: held flat, facing us, under his chin (never over his eyes). Hit-stop 4.2. A huge grin.
sfx(3.88, "crinkle", { gain: 0.35, reason: "the sheet whipped up off his knee" });
pen.release(3.88, { back: 0.1, rest: false });
sfx(4.0, "put-down", { gain: 0.22, reason: "the pen dropped on the crate" });
A(3.9, "gsl", "stand", { dur: 0.12 });
A(3.9, "gsl", "pitch", { to: 0, dur: 0.2, ease: "settle" });
A(3.93, "gsl", "hop", { count: 1, height: 0.22, dur: 0.22 });
A(3.93, "gsl", "move", { to: G1, dur: 0.22 }); A(3.93, "gsl", "turn", { to: 0, dur: 0.22 });
sfx(3.93, "hop", { gain: 0.3, reason: "he hops up off the crate" }); sfx(4.15, "land", { gain: 0.35, reason: "and lands in front of us" });
act.landDust(c, 4.15, G1);
const CHEST = bf(G1, 0, 0.42, 0, 0.42);   // the sheet's middle: its top edge 5 cm under his mouth
const HOLD_L = [r3(-(0.15 + 0.035)), 0.1, -0.01], HOLD_R = [r3(0.15 + 0.035), 0.1, -0.01];   // the phone hold's grips on its two side edges
c.arm(3.93, "gsl", "L", { prop: "coupon", grip: HOLD_L, palm: true, at: CHEST }, 0.17, "out");
A(3.93, "gsl", "grab", { prop: "coupon", hand: "L", grip: HOLD_L, dur: 0.17, pose: null });
c.prop(3.93, "coupon", { tip: 0, rot: 180 }, 0.17, "out");   // upright, the drawing to the camera
c.arm(3.98, "gsl", "R", { prop: "coupon", grip: HOLD_R, palm: true, at: CHEST }, 0.14, "out");
A(3.98, "gsl", "grip", { side: "R", shape: "hold", dur: 0.1 });
A(4.05, "gsl", "look", { to: [0.0, 0.05], dur: 0.1, blink: false });
A(4.08, "gsl", "expr", { expr: "happy", set: { curve: 0.95, open: 0.3 }, dur: 0.1 }); A(4.08, "gsl", "face", { lid: 0.2, brow: 0.3, dur: 0.1 });
A(4.12, "gsl", "squash", { amount: -0.035, dur: 0.2 });   // chest out: ta-da
c.hitStop(HS1);
see(4.1, 4.58, ["gsl.face", "coupon"], "panel 4: FREE HUG held flat at his chest in both mittens, facing us, the huge grin");

// ================================================================ 5 BEST GIFT EVER 4.6-6.0 (panel 05)
// Viking shifts the stack to his right arm and steps to him; Gunslinger turns and holds the coupon out in his left
// mitten; Viking takes it in his left, turns to us and reads it: the lip trembles, the tears well, "Best… gift… EVER!".
// Behind him the Wizard snickers into his mitten and Reaper rolls his eyes with a sigh puff; they glance at each other.
A(4.42, "vik", "grab", { prop: "giftP", hand: "L", grip: GRIP_L1, dur: 0.2, pose: null });
A(4.42, "vik", "grip", { side: "R", shape: "open", dur: 0.15 });
stackTo(4.42, ONE(V3, V3_YAW), V3_YAW, 0.22, "inOut", { one: true });
c.arm(4.46, "vik", "R", { o: [0.1, 0.45, 0.2] }, 0.3, "inOut"); A(4.5, "vik", "face", { lid: 0, brow: 0.2, dur: 0.2 }); A(4.5, "vik", "pitch", { to: 0, dur: 0.3 });
act.eyesLead(c, 4.55, "vik", [-0.3, -0.1]);
A(4.55, "vik", "move", { to: V1, dur: 0.45, steps: 3 }); A(4.55, "vik", "turn", { to: V1_YAW, dur: 0.45 });
stackTo(4.64, ONE(V1, V1_YAW), V1_YAW, 0.36, "inOut", { one: true });
A(4.6, "vik", "expr", { expr: "eager", set: { curve: 0.35, open: 0.2 }, dur: 0.2 });
// Gunslinger turns to him, the left hand comes off the sheet (a "ta-da" flourish out to the side), the right holds it out
const G1_YAW = 105;
A(4.6, "gsl", "turn", { to: G1_YAW, dur: 0.3 }); A(4.6, "gsl", "look", { to: [0.1, -0.05], dur: 0.2, blink: false });
A(4.6, "gsl", "grab", { prop: "coupon", hand: "R", grip: HOLD_R, dur: 0.1, pose: null });   // the hold passes to his right hand
A(4.6, "gsl", "grip", { side: "L", shape: "open", dur: 0.1 }); c.arm(4.62, "gsl", "L", { o: [0.22, 0.5, 0.2] }, 0.3, "inOut");
const HOUT = bf(G1, G1_YAW, 0.4, 0.2, 0.62);
c.arm(4.62, "gsl", "R", { prop: "coupon", grip: HOLD_R, palm: true, at: HOUT }, 0.3, "inOut");
c.prop(4.62, "coupon", { rot: r3(G1_YAW + 180) }, 0.3, "inOut");   // the drawing to Viking
A(4.75, "gsl", "expr", { expr: "cocky", set: { curve: 0.7, open: 0.15 }, dur: 0.2 });
// Viking's right mitten takes it by its near edge (the hold passes over 0.15 s), Gunslinger lets go and puts his hands on his hips
const hC = grips.phone(c, "vik", { ...COUPON, x: HOUT[0], y: HOUT[1], z: HOUT[2], rot: r3(G1_YAW + 180), scale: 1, tip: 0 }, { side: "R", edge: "L" });
let tc = hC.takeFrom(4.7, HOUT, { reach: 0.2, settle: 0.12 });
sfx(r3(tc - 0.08), "flutter", { gain: 0.25, reason: "the sheet passing from mitten to mitten" });
A(r3(tc - 0.02), "gsl", "grip", { side: "R", shape: "open", dur: 0.12 }); c.arm(r3(tc + 0.02), "gsl", "L", "hips", 0.35, "inOut"); c.arm(r3(tc + 0.02), "gsl", "R", "hips", 0.35, "inOut");
A(r3(tc + 0.3), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 }); A(r3(tc + 0.3), "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(r3(tc + 0.1), "gsl", "squash", { amount: -0.03, dur: 0.25 }); A(r3(tc + 0.1), "gsl", "expr", { expr: "cocky", set: { curve: 0.75, open: 0.2, smirk: 0.4 }, dur: 0.2 });
// Viking turns to us and reads it, held low in front of his left chest (its drawing to us), eyes down on it
const V1b_YAW = -8;
A(5.0, "vik", "turn", { to: V1b_YAW, dur: 0.22 });
stackTo(5.0, ONE(V1, V1b_YAW), V1b_YAW, 0.22, "inOut", { one: true });
// (in his right mitten at his right-front, the drawing to him, its top under his mouth; the camera sees the ink through the back)
const READ = bf(V1, V1b_YAW, 0.42, -0.2, 0.42);
tc = hC.carry(r3(tc), READ, 0.25, "inOut", { rot: V1b_YAW });
A(5.08, "vik", "look", { to: [-0.2, -0.5], dur: 0.15, blink: false });
A(5.1, "vik", "expr", { expr: "kind", set: { curve: 0.25, open: 0.05 }, dur: 0.2 }); A(5.1, "vik", "face", { brow: 0.15, dur: 0.2 });
// the lip trembles, the tears well up, a sniffle, a big sobbing breath, the line
A(5.3, "vik", "face", { tearL: 1, tearR: 1, brow: 0.45, dur: 0.35 });
A(5.3, "vik", "expr", { expr: "kind", set: { curve: 0.5, open: 0.12 }, dur: 0.25 });
for (const [t, p] of [[5.32, 0.6], [5.42, 0.15], [5.52, 0.65], [5.62, 0.2], [5.72, 0.6]]) A(t, "vik", "face", { press: p, dur: 0.08 });
sfx(5.3, "gasp", { gain: 0.3, reason: "Viking's sniffle as the tears well up" });
A(5.35, "vik", "squash", { amount: 0.025, dur: 0.2 });
A(5.55, "vik", "look", { to: [-0.45, 0.0], dur: 0.15, blink: false });   // up at Gunslinger
sfx(5.56, "gasp", { gain: 0.4, reason: "a big happy sobbing breath in" });
A(5.56, "vik", "squash", { amount: -0.04, dur: 0.25 });
A(5.78, "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.6 }, dur: 0.12 }); A(5.78, "vik", "face", { press: 0, brow: 0.5, dur: 0.12 });
c.say(5.8, "vik", "best… gift… EVER!", 0.62, "excited", { voice: false, sub: "Best… gift… EVER!", pos: SUB_LOW });
// the Wizard steps in behind Viking's left shoulder and snickers into his mitten, eyes shut; Reaper behind his right
// shoulder rolls his eyes and sighs a puff; they glance at each other
A(4.62, "wiz", "move", { to: W1, dur: 0.3, steps: 2 }); A(4.75, "wiz", "turn", { to: yawTo(W1, V1), dur: 0.3 });
A(4.9, "rea", "move", { to: R1, dur: 0.3, steps: 2 }); A(4.9, "rea", "turn", { to: yawTo(R1, V1), dur: 0.3 });
A(4.85, "wiz", "look", { to: [0.2, -0.15], dur: 0.15, blink: false });
c.arm(4.92, "wiz", "R", { o: [-0.1, 0.5, 0.3] }, 0.25, "in"); A(4.98, "wiz", "grip", { side: "R", shape: "flat", dur: 0.15 });
A(5.02, "wiz", "face", { lid: 1, brow: 0.1, dur: 0.15 }); A(5.02, "wiz", "expr", { expr: "happy", set: { curve: 0.7, open: 0.2 }, dur: 0.15 });
for (const t of [5.08, 5.2, 5.32, 5.44]) A(t, "wiz", "squash", { amount: 0.035, dur: 0.1 });
A(5.3, "wiz", "face", { lid: 0.5, dur: 0.12 }); A(5.32, "wiz", "look", { to: [0.65, -0.05], dur: 0.12, blink: false });   // a glance to Reaper
A(5.5, "wiz", "face", { lid: 1, dur: 0.12 });
c.arm(5.7, "wiz", "R", "rest", 0.3, "inOut"); A(5.72, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(5.75, "wiz", "face", { lid: 0.2, dur: 0.15 });
A(5.0, "rea", "look", { to: [-0.3, 0.2], dur: 0.08, blink: false }); A(5.1, "rea", "look", { to: [0.25, 0.6], dur: 0.1, blink: false });
A(5.25, "rea", "look", { to: [0.5, 0.3], dur: 0.1, blink: false }); A(5.25, "rea", "face", { lid: 0.55, brow: -0.1, dur: 0.15 });
c.macro(5.12, "rea", "sigh");
c.at(5.22, { fx: "poof", pos: bf(R1, yawTo(R1, V1), 0.42, -0.02, 0.62), dur: 0.5, color: "#e8edf2", puffs: 5, sparks: 0, size: 0.3, lift: 0.1 });
sfx(5.22, "poof", { gain: 0.18, reason: "Reaper's sigh: a small puff" });
A(5.48, "rea", "look", { to: [-0.6, -0.05], dur: 0.15, blink: false });   // a glance back at the Wizard
see(4.98, 5.5, ["wiz.face", "rea.face", "vik.face"], "panel 5: the Wizard snickers into his mitten, Reaper rolls his eyes with a sigh puff, they glance at each other");
see(5.1, 5.85, ["vik.face", "coupon"], "panel 5: Viking reads the coupon in his left mitten, the presents in his right arm; the lip trembles, the tears");

// ================================================================ 6 THE HUG 6.0-7.0 (panel 06)
// He lunges: the presents fly off his right arm (physics: the big box tumbles onto the rug in front, the black box
// bounces off its lid), he grabs Gunslinger by the sides, lifts him off the rug (hit-stop) and swings him round his
// front to his right: side by side, cheek to cheek, Viking at the left, Gunslinger at the right, lifted, "!" over his
// head, tears flying; the coupon stays in Viking's left mitten, now round Gunslinger's back.
act.windUp(c, 5.86, "vik", { amount: 0.18, dur: 0.14 });
act.eyesLead(c, 5.95, "vik", [-0.5, 0.05]);
sfx(5.98, "whoosh", { gain: 0.4, reason: "the presents flung off his arm as he lunges" });
A(5.98, "vik", "release", { prop: "giftP", to: [GIFT_P[0], 0.05, GIFT_P[1]], dur: 0.38 });   // an aimed throw: it leaves his hand and tumbles onto the rug
c.throw(5.98, "giftB", { to: [r3(GIFT_P[0] + 0.1), 0.42, r3(GIFT_P[1] - 0.12)], in: 0.34, spin: [3, 1, -2] });   // aimed at the big box's lid: it bounces off
sfx(6.36, "book-close", { gain: 0.5, reason: "the big present thumps onto the rug" });
sfx(6.44, "kenney/book-close", { gain: 0.4, reason: "the black box lands on it and bounces off" });
sfx(6.58, "thud-soft", { gain: 0.3, reason: "the black box's second bounce on the rug" });
// keyframes of the pair: [time, Viking [x, z, yaw], Gunslinger [x, y, z, yaw], dur]. 5.95 Viking lunges at him; 6.08 he
// lifts him and swings him round his front (Gunslinger spins 225 degrees on the way); 6.3 side by side, cheek to cheek,
// 0.7 m between the centres (06-07: Viking left, Gunslinger right); 8.05-8.47 the rocking turns the pair on round its
// middle (an arc: a mid keyframe keeps the 0.7 m) until Viking's back is to the camera and Gunslinger, lifted higher,
// looks out over his shoulder at the Wizard (08)
const HUGK = [
  [5.95, [0.3, 0.85, -60], [G1[0], 0, G1[1], G1_YAW], 0.1],
  [6.02, [0.42, 0.6, 10], [0.72, 0.15, 1.3, 200], 0.12],
  [6.14, [0.35, 0.95, 50], [1.05, 0.35, 0.95, -35], 0.16],
  [8.05, [0.45, 1.31, 120], [0.77, 0.45, 0.69, -30], 0.2],
  [8.25, [0.75, 1.35, 200], [0.3, 0.55, 0.75, -20], 0.22],
];
// Viking's gloves on Gunslinger's surface, Gunslinger's on Viking's: [cl, cf] on each body per keyframe (cl + = that
// body's own left, cf + = its front). 6.0 Viking grabs his two front flanks; from 6.3 his right glove is on Gunslinger's
// near (right) front flank and his left, with the coupon, round his right back; after the swing (8.25) mirrored.
// Gunslinger's arms fly up at the lift ("!"), then his right hand lands on Viking's left shoulder (8.25: his left on
// Viking's right shoulder, the right hand free for the hat tip)
const HANDS = {
  1: { vR: [0.9, 0.45, 0], vL: [-0.9, 0.45, 0] },
  2: { vR: [-0.85, 0.53, 0.05], vL: [-0.7, -0.71, 0.1], gR: [1, 0.1, 0.3] },
  3: { vR: [0.85, 0.53, 0.05], vL: [-0.85, 0.53, 0.05], gR: [1, 0.1, 0.3], gL: [-1, 0.1, 0.3] },
  4: { vR: [0.7, -0.71, 0.1], vL: [0.85, 0.53, 0.05], gL: [-1, 0.1, 0.3] },
};
for (const [i, [t, [vx, vz, vy], [gx, gy, gz, gyaw], dur]] of HUGK.entries()) {
  A(t, "vik", "move", { to: [vx, vz], dur }); A(t, "vik", "turn", { to: vy, dur });
  if (gy > 0) A(t, "gsl", "fly", { to: { x: gx, y: gy, z: gz }, dur }); else { A(t, "gsl", "move", { to: [gx, gz], dur }); }
  A(t, "gsl", "turn", { to: gyaw, dur });
  const H = HANDS[i]; if (!H) continue;
  const G = [gx, gy, gz], V = [vx, 0, vz];
  for (const [s, k] of [["R", "vR"], ["L", "vL"]]) if (H[k]) c.arm(t, "vik", s, { world: onBody(G, gyaw, GSL, ...H[k]) }, dur, "inOut");
  for (const [s, k] of [["R", "gR"], ["L", "gL"]]) if (H[k]) c.arm(t, "gsl", s, { world: onBody(V, vy, VIK, ...H[k]) }, dur, "inOut");
}
// the grab at 6.0: both gloves snap flat onto his sides as the lunge lands (the presents have just left the right one)
const G6 = [G1[0], 0, G1[1]];
for (const [s, cl] of [["R", 0.9], ["L", -0.9]]) { c.arm(5.98, "vik", s, { world: onBody(G6, G1_YAW, GSL, cl, 0.45, -0.05) }, 0.1, "in"); A(5.98, "vik", "grip", { side: s, shape: "flat", dur: 0.08 }); }
sfx(6.08, "cloth", { gain: 0.45, reason: "the bear hug: fur and leather squeezed together" });
sfx(6.3, "kenney/cloth-belt", { gain: 0.22, reason: "his belt and holster creak as he is lifted" });
sfx(6.32, "ai/warm-resolve", { gain: 0.35, reason: "the warm resolve under the hug" });
c.hitStop(HS2);
// Viking: eyes shut tight in a huge happy grin, tears flying (06, 07, 08); Gunslinger: a start, arms up, "!", then delight
A(6.0, "vik", "face", { lid: 1, brow: 0.5, tearL: 1, tearR: 1, dur: 0.1 }); A(6.0, "vik", "expr", { expr: "delighted", set: { curve: 0.95, open: 0.35 }, dur: 0.1 });
for (const [t, n] of [[6.12, 6], [7.0, 5], [7.9, 5], [8.8, 4]]) c.at(t, { fx: "sweat", who: "vik", dur: 0.75, count: n, color: "#7cc8ff" });
A(6.6, "vik", "face", { lid: 0.85, dur: 0.2 });   // the eyes open a crack: still crying happily
act.shock(c, 5.96, "gsl", { open: 0.45, eye: 1.2, brow: 0.5, hold: 0.3 });
A(5.96, "gsl", "look", { to: [0.4, -0.3], dur: 0.08, blink: false });
for (const s of ["R", "L"]) { c.arm(5.97, "gsl", s, { o: [0.14, 0.88, 0.2] }, 0.14, "out"); A(5.97, "gsl", "grip", { side: s, shape: "open", dur: 0.1 }); }
c.at(6.03, { fx: "alert", who: "gsl", dur: 0.6 });
A(6.3, "gsl", "look", { to: [-0.1, 0.0], dur: 0.15, blink: false });
A(6.32, "gsl", "expr", { expr: "delighted", set: { curve: 0.85, open: 0.3 }, dur: 0.2 }); A(6.32, "gsl", "face", { lid: 0.3, brow: 0.3, dur: 0.2 });
c.arm(6.3, "gsl", "L", { o: [0.2, 0.7, 0.28] }, 0.25, "inOut"); A(6.4, "gsl", "grip", { side: "L", shape: "open", set: { curl: 0.3 }, dur: 0.15 });
A(6.45, "gsl", "grip", { side: "R", shape: "flat", dur: 0.15 }); A(6.45, "vik", "grip", { side: "R", shape: "flat", dur: 0.1 });
// the coupon, in Viking's right mitten on Gunslinger's near flank, points back between the bodies (never through him)
c.prop(6.08, "coupon", { rot: 100, tip: 0 }, 0.3, "inOut");
see(6.35, 6.95, ["vik.face", "gsl.face", "giftP", "giftB"], "panel 6: the bear hug lifts him off the rug, both faces, the presents on the rug in front");

// ================================================================ 7 THE BILL LANDS 7.0-8.8 (panel 07)
// The Wizard and Reaper come round the hug to their presents on the rug (the Wizard down the left between the crate
// and the hug, Reaper round the right). The Wizard stares at his big purple present lying there, jaw dropping; Reaper
// picks his black box up and dusts it off, unbothered. The hug rocks (the hover's bob) and turns.
act.shock(c, 6.02, "wiz", { open: 0.3, hold: 0.2 }); A(6.02, "wiz", "look", { to: [0.3, -0.3], dur: 0.1, blink: false });
A(6.02, "rea", "look", { to: [-0.1, -0.3], dur: 0.12, blink: false });
A(6.25, "wiz", "move", { to: [-0.45, 0.6], dur: 0.35, steps: 3 });
A(6.6, "wiz", "move", { to: W2, dur: 0.45, steps: 3 });
A(7.05, "wiz", "turn", { to: yawTo(W2, GIFT_P), dur: 0.3 });
A(7.05, "wiz", "look", { to: [0.1, -0.55], dur: 0.2, blink: false });
act.shock(c, 7.15, "wiz", { open: 0.6, eye: 1.2, curve: -0.08, brow: 0.5, hold: 1.1 });
A(7.15, "wiz", "pitch", { to: 9, dur: 0.3 });
for (const s of ["R", "L"]) c.arm(7.15, "wiz", s, { o: [0.06, 0.3, 0.12] }, 0.4, "out");   // arms hanging, limp
A(6.2, "rea", "move", { to: [1.95, 0.85], dur: 0.5, steps: 3 });   // round the right, clear of the lifted Gunslinger
A(6.7, "rea", "move", { to: R2, dur: 0.45, steps: 3 });
const R2_YAW = yawTo(R2, GIFT_B);
A(7.15, "rea", "turn", { to: R2_YAW, dur: 0.3 }); A(7.2, "rea", "look", { to: [0.0, -0.6], dur: 0.2, blink: false });
// Reaper picks his box up off the rug where the physics left it (both palms on its ends), lifts it to his chest and
// dusts its lid with his right mitten while his left holds it
const hB2 = grips.box(c, "rea", GIFTB);
A(7.3, "rea", "crouch", { to: 0.45, dur: 0.25 });
let tb = hB2.take(7.32, { reach: 0.28, settle: 0.15 });
sfx(r3(tb), "grab", { gain: 0.3, reason: "Reaper picks his black box up off the rug" });
const HB = bf(R2, R2_YAW, 0.46, 0, 0.55);
A(r3(tb), "rea", "crouch", { to: 0, dur: 0.3 });
tb = hB2.carry(r3(tb), HB, 0.3, "inOut", { rot: r3(R2_YAW + 180), tip: 0 });
A(r3(tb - 0.1), "rea", "look", { to: [0.0, -0.4], dur: 0.15, blink: false });
A(r3(tb), "rea", "grab", { prop: "giftB", hand: "L", grip: [r3(-(SMALL.w / 2 + 0.045)), r3(SMALL.h * 0.55), 0], dur: 0.15, pose: null });
A(r3(tb), "rea", "grip", { side: "R", shape: "flat", dur: 0.15 });
let td = r3(tb + 0.05);
for (const x of [-0.06, 0.07, -0.06, 0.07]) { c.arm(td, "rea", "R", { prop: "giftB", grip: [x, r3(SMALL.h + 0.055), 0.07], palm: true, at: HB }, 0.14, "inOut"); td = r3(td + 0.14); }
sfx(r3(tb + 0.2), "cloth", { gain: 0.2, reason: "Reaper brushes the rug fluff off his box" }); sfx(r3(tb + 0.48), "cloth", { gain: 0.18, reason: "and again" });
c.arm(td, "rea", "R", { o: [0.08, 0.42, 0.2] }, 0.3, "inOut"); A(r3(td + 0.1), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(r3(td + 0.1), "rea", "nod", { times: 1 });
see(7.15, 7.95, ["wiz.face", "rea.face", "giftP", "giftB", "vik.face", "gsl.face"], "panel 7: the hug behind; the Wizard stares jaw-dropped at his present on the rug, Reaper picks his up and dusts it");
// 8.3 the Wizard backs off a step to the left, under Gunslinger's eyes, staring up at him stunned (08: his face in the
// bottom-left foreground, hat clear of Gunslinger's face)
act.eyesLead(c, 8.3, "wiz", [0.5, 0.3]);
A(8.3, "wiz", "move", { to: W4, dur: 0.3, steps: 2 }); A(8.3, "wiz", "turn", { to: W4_YAW, dur: 0.3 });
A(8.3, "wiz", "pitch", { to: -3, dur: 0.3 });
A(8.55, "wiz", "look", { to: [0.5, 0.45], dur: 0.15, blink: false });
A(8.55, "wiz", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.15 }, dur: 0.2 });

// ================================================================ 8 THE WINK 8.8-10 (panel 08)
// Over Viking's shoulder: Gunslinger, still lifted, tips his brim under the party cone with two fingers and winks down at
// the Wizard: "Next year's on me!"; the moth lifts off the brim. The Wizard's left eye twitches, a sweat drop. Hard cut.
const WK = 8.6;   // 8.8 on the video's clock
c.arm(8.3, "gsl", "R", { o: [0.14, 0.52, 0.3] }, 0.25, "inOut"); A(8.3, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(8.45, "gsl", "look", { to: [-0.5, -0.4], dur: 0.12, blink: false });   // down at the Wizard
wink(c, { who: "gsl", t: WK, until: END, line: "next year's on me!", sub: "Next year's on me!", pos: SUB_LOW, side: "R", brimTouch: { o: [0.24, 0.95, 0.1] }, look: [-0.45, -0.35],
  react: (t) => {
    A(t, "wiz", "expr", { expr: "annoyed", set: { open: 0.12, curve: -0.1 }, dur: 0.2 });
    for (const [dt, l] of [[0, 0.8], [0.1, 0.15], [0.2, 0.85], [0.3, 0.2], [0.42, 0.75], [0.54, 0.2], [0.68, 0.7], [0.8, 0.15]]) A(r3(t + dt), "wiz", "face", { lidL: l, dur: 0.05 });
    c.at(r3(t + 0.05), { fx: "sweat", who: "wiz", dur: 0.8, count: 1 });
  } });
c.prop(8.25, "coupon", { rot: 200 }, 0.3, "inOut");   // in Viking's mitten on Gunslinger's near flank, its drawing to us
see(8.75, 9.6, ["gsl.face", "wiz.face", "moth"], "panel 8: the two-finger hat tip and the wink down at the Wizard over Viking's shoulder, the moth lifting; the Wizard's twitch in the foreground");

// blinks off the lines and the key looks
act.blinksAt(c, "wiz", [2.0, 3.7, 7.7]); act.blinksAt(c, "rea", [1.9, 4.1, 7.0]); act.blinksAt(c, "vik", [0.9, 2.4, 4.3]); act.blinksAt(c, "gsl", [1.0, 5.45, 7.5]);

// ---------------------------------------------------------------- shots, one per panel
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
const P01 = { pos: [0.45, 1.2, 4.8], look: [0.42, 0.72, -0.2], fov: 50 };   // the four across, the Wizard and Reaper cut by the edges (W1: 0.3 right and fov 47 -> 50, so both edge faces stay in the safe zone)
const P02 = fw([r3(GP[0] + 0.75), 0.95, GP[1]], { w: 1.8, az: -4, el: 4, fov: 30 });   // Viking with the stack at the right edge
const P03 = fw([-0.75, 0.75, 0.3], { w: 1.7, az: 15, el: 8, fov: 30 });           // from his left: Viking behind him at the right
const P04 = fw([G1[0], 0.7, G1[1]], { w: 0.85, az: 4, el: 2, fov: 30 });
const P05 = fw([r3(V1[0] + 0.02), 0.85, V1[1]], { w: 1.4, az: 4, el: 12, fov: 30 });
const P06a = fw([0.1, 0.9, 0.95], { w: 1.8, az: 0, el: 4, fov: 32 }), P06b = fw([0.7, 1.0, 0.95], { w: 1.8, az: 0, el: 4, fov: 32 });
const P06 = { ...P06a, to: { pos: P06b.pos, look: P06b.look }, dur: 0.5 };      // follows the swing
const P07 = { pos: [0.37, 2.35, 5.6], look: [0.37, 0.55, 1.2], fov: 48, to: { pos: [0.37, 2.26, 5.38] }, dur: 1.7 };   // the brief's slow 5 % push-in
const P08 = fw([0.2, 1.0, 0.75], { w: 1.3, az: -4, el: 4, fov: 30 });   // Gunslinger's lifted face mid-frame, the Wizard's at the bottom left, Viking's back at the right
const beats = c.beats([
  ["P01 pay up", 0, P01, "hook"],
  ["P02 the pocket pat", PAT.from, P02],
  ["P03 the coupon", 2.8, P03],
  ["P04 free hug", 4.1, P04],
  ["P05 best gift ever", 4.6, P05, "reaction"],
  ["P06 the hug", 6.0, P06, "payoff"],
  ["P07 the bill lands", 7.0, P07],
  ["P08 the wink", 8.5, P08],
], END);

write(import.meta.url, {
  id: "your-birthday",
  title: "That one friend who never has money… at your birthday",
  idea: "Never has money, episode 4: Viking's birthday; the Wizard's huge present, Reaper's neat black box; Gunslinger has nothing, the pocket pat finds a moth; he scribbles a FREE HUG coupon on his knee; Viking cries happy tears, drops the expensive presents and bear-hugs him off the floor; next year's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
  set: { type: "plain", color: "#d9b98a", floor: "#a86f3e", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/birthday-living-room.png", z: -2.2, center: [0, 2.45], height: 5.0, depth: false, motion: false },
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 } },
  // the brief's default (no ukulele/glockenspiel style in puppet/beat.mjs): plucked off-beat chords and claps, a bell
  // lead; a hush under the tears (5.2-5.9), back on the hug (video clock)
  music: { style: "bounce", bpm: 120, key: 0, lead: "bell", lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 5.2, part: "hush" }, { at: 6.0, part: "main" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["wiz", "gsl", "rea", "vik", "giftP"], hint: 0.4, what: "Viking's birthday: the Wizard pushes a huge purple present into his arms, Reaper brings a neat black box; Gunslinger behind them with empty hands" },
  cast, props, captions: c.captions, beats, visible: c.visible, hitStop: c.hitStops,
  // windows on the video clock: after the hit-stops at 4.2 and 6.1 the times are 0.1 and 0.2 s later than the story times above
  allowClip: [
    { who: "gsl", with: "moth", from: VC(2.5), to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "hatG", from: 0, to: 10, reason: "his party cone on top of his cowboy hat (worn)" },
    { who: "vik", with: "hatV", from: 0, to: 10, reason: "his small party cone in his hair (worn)" },
    { who: "vik", with: "ros", from: 0, to: 10, reason: "the rosette on his chest (worn)" },
    { who: "wiz", with: "horn", from: 0, to: 0.5, reason: "the party horn between his lips" },
    { who: "gsl", with: "wallet", from: VC(2.25), to: VC(3.02), reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: VC(2.27), to: VC(2.33), checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: VC(2.38), to: VC(2.52), checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", from: VC(1.5), to: VC(1.78), checks: ["rig-jump"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s" },
    { who: "gsl", with: "coupon", from: VC(3.38), to: VC(3.9), reason: "he pulls the folded coupon out from under his bandana and holds it flat on his knee" },
    { who: "gsl", with: "pen", from: VC(3.35), to: VC(4.0), reason: "he pulls the pen out of his bandana's knot and scribbles with it on his knee" },
    { who: "gsl", from: VC(3.7), to: VC(4.0), checks: ["prop-pop", "motion"], reason: "quick pen scribbles over the sheet on his knee" },
    { who: "gsl", from: VC(3.88), to: VC(4.15), checks: ["prop-pop", "hand-turn", "rig-jump", "hand-pop"], reason: "the flick: the sheet whips up off his knee into both mittens as he hops up" },
    { who: "gsl", with: "crate", from: VC(3.28), to: VC(3.98), reason: "he sits on the crate, bent over his knee" },
    { who: "vik", with: "giftP", from: 0, to: VC(6.0), reason: "the big present carried against his belly: both gloves on its ends, then his right arm round it" },
    { who: "wiz", with: "giftP", from: 0, to: 0.3, reason: "his mittens flat on the far side of the present, pushing it over to Viking" },
    { who: "rea", with: "giftB", from: 0, to: VC(1.0), reason: "he carries his black box in both hands and sets it down on the big present's lid" },
    { who: "rea", with: "giftP", from: VC(0.55), to: VC(1.0), reason: "he leans over the big present to set his box on its lid" },
    { who: "vik", with: "coupon", from: VC(4.95), to: 10, reason: "the coupon in his left mitten: he reads it, then it rides against Gunslinger's back in the hug" },
    { who: "gsl", with: "coupon", from: VC(5.95), to: 10, reason: "Viking's mitten with the coupon round his back" },
    { who: "vik", with: "gsl", from: VC(5.95), to: 10, reason: "the bear hug: Viking's gloves on Gunslinger's sides and back as he lifts and swings him, the bodies pressed (allowBody)" },
    { who: "gsl", with: "vik", from: VC(5.95), to: 10, reason: "the bear hug: his arms over Viking's shoulders, his body against Viking's" },
    { who: "vik", from: VC(5.95), to: VC(6.35), checks: ["hand-turn", "hand-pop", "rig-jump", "prop-pop"], reason: "the lunge and the lift: his gloves let the present go and snap flat onto Gunslinger's sides in 0.1 s" },
    { who: "rea", with: "giftB", from: VC(7.3), to: 10, reason: "he picks his black box up off the rug and dusts its lid" },
  ],
  notes: "Generated by storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs. Panels: PANELS.md.",
});
