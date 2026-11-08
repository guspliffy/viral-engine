// THAT ONE FRIEND WHO NEVER HAS MONEY… AT YOUR BIRTHDAY (never has money, episode 4, 8 Nov 2026), from the clip
// template.
//   node storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs -> your-birthday.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/04-your-birthday/ there (PANELS.md here: plan + departures).
//
// THE BRIEF (exactly 10.0 s; Viking, Gunslinger, the Wizard, Reaper; Viking's birthday in a cosy wooden living room)
//   Joke:        the Wizard pushes a huge glittering present into Viking's arms, Reaper stacks a neat black box on it.
//                "And yours?" Gunslinger's hands are empty. The pocket pat finds the moth. He sits on a crate and
//                scribbles a coupon on his knee: FREE HUG, with a doodle of the two of them. The Wizard snickers, Reaper
//                rolls his eyes. Viking reads it, his lip trembles, he bursts into happy tears, drops the expensive
//                presents and bear-hugs Gunslinger off his seat.
//   Wants:       Gunslinger wants to give a present without money.
//   Consequence: the cheapest gift wins; the Wizard's huge present lies ignored on the rug.
//   Ending:      over Viking's shoulder, still hugged in the air, the wink at the stunned Wizard: "Next year's on me!"
//   Callback:    frame 0 the Wizard pushes the big present into Viking's arms; at the end it lies on the rug and his eye
//                twitches at it.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the coupon held up at 4.20, the hug landing at 6.10 on the video's clock) add 0.2 s: 9.8 s of
// story = exactly 10.0 s of video
const HS1 = 4.2, HS2 = 6.0, END = 9.8;
// a time on the video's clock -> the story's clock, and back
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);
const VID = (ts) => r3(ts <= HS1 ? ts : ts <= HS2 ? ts + 0.1 : ts + 0.2);

// ---------------------------------------------------------------- geometry helpers (world metres; camera at +z)
const rad = (d) => (d * Math.PI) / 180;
// a point in front of someone: f metres along their facing, s metres to their own left, at height y
const front = ([x, z], yaw, f, s = 0, y = 0) => { const a = rad(yaw); return [r3(x + f * Math.sin(a) + s * Math.cos(a)), r3(y), r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const xz = (p) => [p[0], p[2]];
const yawTo = ([x0, z0], [x1, z1]) => r3((Math.atan2(x1 - x0, z1 - z0) * 180) / Math.PI);
const rotY = ([x, y, z], d) => { const a = rad(d); return [r3(x * Math.cos(a) + z * Math.sin(a)), r3(y), r3(-x * Math.sin(a) + z * Math.cos(a))]; };
// a hold made in the grip library's frame for a prop turned d degrees further (a square present taken from the side)
const turnHold = (h, d) => { for (const s of h.sides) h.hands[s].grip = rotY(h.hands[s].grip, d); return h; };
const allow = [];   // allowClip windows, on the video's clock
// on a cut: someone off screen (or out of the shot) moves to their place in the next shot. The reason goes on the clip.
const cheat = (t, who, to, yaw, why) => {
  A(t, who, "move", { to, dur: 0.02, steps: 0, reason: why });
  if (yaw != null) A(t, who, "turn", { to: yaw, dur: 0.02 });
  allow.push({ who, from: VID(t), to: r3(VID(t) + 0.15), checks: ["motion", "rig-jump", "lean-jump"], reason: why });
};

// ---------------------------------------------------------------- the room (set xmasroom, party: true)
// The cosy wooden room of friends try to 07 dressed for a birthday in daylight: the arched window at the back left,
// the stone fireplace with its fire and the bookcase at the back right, bunting under the beam, a patterned rug. The
// cake on its little round table at the back between Viking and Reaper (panel 1 has it front left; there it hid
// Gunslinger in every close of him, so it moved where the wide still sees it).
const TABLE = { x: 1.1, z: -1.5, r: 0.28, h: 0.42 };
// ---------------------------------------------------------------- the cast's places
// Gunslinger: back left (panel 1); he never walks: the pocket pat here, then he sits back on the crate behind him
const G0 = [-1.0, -0.6], G_YAW = 20;
const CRATE = front(G0, G_YAW, -0.32), CRATE_TOP = 0.22;
const GS = xz(front(xz(CRATE), G_YAW, 0.03));                 // sitting
// Viking: back right at frame 0, the Wizard pushing the big present into his arms from the front left
const VA = [0.45, -0.05], VA_YAW = -20;
const B = front(VA, VA_YAW, 0.7, 0, 0.3);                      // the hand-over: the purple present's bottom middle
const W_YAW0 = 80, W_FACE0 = 62;   // he stands where an 80° hand-over puts him, turned 18° more to us (review A: not in profile)
const WA = [r3(B[0] - 0.55 * Math.sin(rad(W_YAW0))), r3(B[2] - 0.55 * Math.cos(rad(W_YAW0)))];
const W1 = [0.6, 0.9];                                           // off the shots of panels 2-4 (a cheat on the cut to panel 2)
// Reaper: front right, the black box in both hands; a step in to stack it on the purple one
const RA = [1.28, 0.32], R_YAW0 = -30;
// panels 2-4: Viking behind Gunslinger's right with the presents (on the cut to the pocket pat)
const VB = [-0.25, -1.1], VB_YAW = 0;
// panel 5: Viking beside him (his own left), half a step in front, to take the coupon; the Wizard and Reaper behind
const VT = xz(front(GS, G_YAW, 0.25, 0.9)), VT_YAW = G_YAW;
const W5 = xz(front(VT, VT_YAW, -1.15, -0.5)), R5 = xz(front(VT, VT_YAW, -0.85, 0.87));   // their faces past his (panel 5)
// the hug (panels 6-8): side by side, both faces to us (panel 6): Viking turns to him and lifts him up off the crate,
// pulling him in a step (clear of its top); his arms round Gunslinger's middle, Gunslinger's arm over his shoulders
const HUG_YAW_V = -35, HUG_YAW_G = 45, LIFT = 0.4;
const HG = (() => { const dx = VT[0] - GS[0], dz = VT[1] - GS[1], L = Math.hypot(dx, dz); return [r3(GS[0] + (0.1 * dx) / L), r3(GS[1] + (0.1 * dz) / L)]; })();
// panel 7: the Wizard and Reaper in front of the hug with the presents (on the cut); the presents land in front of it
// (worked out by projecting the faces through the panel-7 camera, HUG7 below: the Wizard bottom left and Reaper bottom
// right, both clear of the two faces in the hug and of the purple present)
const W7 = [0.3, 1.1], R7 = [1.05, -0.1], W7_YAW = 25, R7_DUST = 20;
// panel 1 only: Gunslinger a little further left and forward, so his face clears the Wizard's hat brim in the wide (back
// to G0 on the cut to the pocket pat)
const G1 = [r3(G0[0] - 0.2), r3(G0[1] + 0.12)];
const W6 = [-2.1, -0.55];                                        // out of the hug shot (panel 6: only the hug and the presents)
const GIFT_LAND = [0.25, -0.47], BOX_LAND = [0.75, 0.24], R7_YAW = yawTo(R7, BOX_LAND);   // where the bake lands them (layout samples, 8 Nov)

const cast = [
  { id: "wiz", character: "never-has-money/wizard", at: WA, face: W_FACE0, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "elevator/viking", at: VA, face: VA_YAW, expr: "delighted", follow: 0.3, seed: 3.3 },
  { id: "gsl", character: "never-has-money/gunslinger", at: G1, face: G_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: RA, face: R_YAW0, expr: "deadpan", follow: 0.25, seed: 3.1 },
];

// ---------------------------------------------------------------- props
// the presents: the Wizard's huge purple one (1.2x the grip library's box: 0.36 m), a gold bow with a little smiley on
// its knot (panel 1); Reaper's small black one with a silver ribbon (0.5x: 0.15 m). Stacked, the black one is drawn by
// the purple one's `top` (the same size and look; swapped on one frame) so the stack rides in Viking's hands as one.
const GIFT_K = 1.2, GIFT_H = r3(0.24 * GIFT_K), BOX_K = 0.5;
const GIFT = { id: "giftP", kind: "giftbox", x: B[0], y: B[1], z: B[2], rot: W_YAW0 + 180, scale: GIFT_K, color: "#7b3fb8", ribbon: "#f2bf3a", smile: true, seed: 3,
  top: { w: r3((0.3 * BOX_K) / GIFT_K), h: r3((0.24 * BOX_K) / GIFT_K), d: r3((0.3 * BOX_K) / GIFT_K), color: "#1d1c22", ribbon: "#cfd3da", bow: 1, rot: 180 },
  staged: "the Wizard's huge present, in his hands at frame 0" };
const BOX0 = front(RA, R_YAW0, 0.48, 0, 0.5);
const BOX = { id: "giftB", kind: "giftbox", x: BOX0[0], y: BOX0[1], z: BOX0[2], rot: R_YAW0 + 180, scale: BOX_K, color: "#1d1c22", ribbon: "#cfd3da", glitter: 0.25, seed: 10, staged: "Reaper's small present, in his hands at frame 0" };
// the coupon (a folded sheet under his bandana) and the felt pen (in his bandana's knot): EP02's places, his body turned
const COUPON_K = 1.3;
const NOTE0 = front(G0, G_YAW, 0.3, -0.02, 0.62), PEN0 = front(G0, G_YAW, 0.29, 0.13, 0.6);
const COUPON = { id: "coupon", kind: "coupon", away: true, x: NOTE0[0], y: NOTE0[1], z: NOTE0[2], rot: G_YAW + 180, scale: 0.001, write: 0, unfold: 0, staged: "folded under his bandana until he pulls it out" };
const PEN = { id: "pen", kind: "feltpen", x: PEN0[0], y: PEN0[1], z: PEN0[2], rot: G_YAW + 180, scale: 0.001, staged: "tucked in his bandana's knot until he pulls it out" };
const props = [
  { id: "sidetable", kind: "sidetable", x: TABLE.x, z: TABLE.z, r: TABLE.r, h: TABLE.h, staged: "the cake's little round table, front left (panel 1)" },
  { id: "cake", kind: "cake", x: TABLE.x, y: r3(TABLE.h + 0.006), z: TABLE.z, rot: 25, lit: 1, staged: "the birthday cake on its table, the candles lit" },
  { id: "crate", kind: "crate", x: CRATE[0], z: CRATE[2], rot: G_YAW, size: CRATE_TOP, staged: "a small wooden crate behind Gunslinger (panel 3: he sits on it)" },
  { id: "scraps", kind: "floorscrap", x: 0.25, z: -0.35, r: 0.9, seed: 4, staged: "confetti and paper bits on the rug" },
  { id: "balloonsL", kind: "balloons", x: -2.45, z: -1.3, scale: 1.8, rot: 20, staged: "a cluster of balloons by the left wall" },
  { id: "balloonsR", kind: "balloons", x: 2.2, z: -1.55, scale: 1.8, rot: -25, staged: "a cluster of balloons by the bookcase" },
  GIFT, BOX, COUPON, PEN,
  // party hats (worn: body frame), Viking's rosette and the Wizard's party horn (in his mouth at frame 0)
  { id: "hatG", kind: "partyhat", wear: "gsl", x: 0.07, y: 1.31, z: -0.02, tilt: 14, color: "#e0473b", color2: "#ffd23f", pattern: "stripes", staged: "his party hat, on top of his cowboy hat (worn)" },
  { id: "hatV", kind: "partyhat", wear: "vik", x: -0.06, y: 1.0, z: 0.0, tilt: -12, color: "#3d7fd0", color2: "#ffd23f", pattern: "dots", staged: "the birthday boy's party hat (worn)" },
  { id: "rosette", kind: "rosette", wear: "vik", x: 0.16, y: 0.56, z: 0.36, staged: "his birthday rosette on his chest (worn)" },
  { id: "horn", kind: "blowout", wear: "wiz", x: 0, y: 0.5, z: 0.34, len: 1, staged: "the Wizard's party horn, in his mouth (worn)" },
  ...patProps({ who: "gsl", at: G0, yaw: G_YAW }).map((p) => (p.id === "wallet" ? { ...p, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : p)),
];

// subtitles inside y 470-1360, clear of Jonny's in-app title at the top
const SUB = 1180, SUB_HIGH = 560, SUB_LOW = 1280, SUB_TOP = 470;

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// frame 0: the party horn unrolls with a blare in the Wizard's mouth while he pushes the huge purple present into
// Viking's arms; Viking's hands close on it; "Happy birthday!". Reaper steps in and stacks his neat black box on top.
// Viking beams. Gunslinger behind, clapping along. 1.10: the Wizard turns to him, eyebrow up: "And yours?"
const wg = grips.box(c, "wiz", GIFT);
for (const s of ["R", "L"]) { c.arm(0, "wiz", s, { prop: "giftP", grip: wg.hands[s].grip, palm: true }, 0); A(0, "wiz", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "wiz", "grab", { prop: "giftP", hand: "both", grip: [0, r3(0.55 * 0.24), 0], dur: 0, pose: null });
sfx(0, "partyhorn", { gain: 0.6, reason: "the Wizard's party horn unrolls with a blare (frame 0)" });
c.prop(0.2, "horn", { len: 0 }, 0.12, "in");   // it curls back up
A(0, "wiz", "expr", { expr: "happy", set: { curve: 0.4, open: 0, pucker: 0.6 }, dur: 0 });   // blowing
A(0, "wiz", "look", { to: [0.45, 0.0], dur: 0, blink: false });
// Viking takes it from below: both palms up under its near half, so no hand comes between it and the Wizard (the
// hold frame: Viking at +z, his right hand at +x; the present is turned a quarter from his frame)
const U = (sx, y) => rotY([r3((sx * 0.1) / GIFT_K), r3(y / GIFT_K), r3(0.08 / GIFT_K)], -90);
const VUND = { R: U(1, -0.02), L: U(-1, -0.02) }, VUP = { R: U(1, 1), L: U(-1, 1) }, VGRAB = U(0, -0.02);
const vHold = (t, at, dur, ease = "inOut", o = {}) => { for (const s of ["R", "L"]) c.arm(t, "vik", s, { prop: "giftP", grip: VUND[s], palm: VUP[s], at: at.map(r3), ...o }, dur, ease); return r3(t + dur); };
for (const s of ["R", "L"]) A(0.02, "vik", "grip", { side: s, shape: "open", dur: 0.12 });
let tv = vHold(0.02, B, 0.2, "inOut", { off: [0, -0.07, 0.02] });
tv = vHold(tv, B, 0.12, "settle");
for (const s of ["R", "L"]) A(r3(tv - 0.05), "vik", "grip", { side: s, shape: "carry", dur: 0.1 });
A(r3(tv + 0.04), "vik", "grab", { prop: "giftP", hand: "both", grip: VGRAB, dur: 0, pose: null });
tv = r3(tv + 0.06);
A(0, "vik", "look", { to: [-0.35, -0.2], dur: 0, blink: false });
A(0.1, "vik", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.35, eye: 1.15 }, dur: 0.15 });
wg.handOff(r3(tv + 0.02), { rest: "rest", back: 0.12 });
const VP = front(VA, VA_YAW, 0.6, 0.18, 0.22);                     // pulled in to his tummy (his face clear over it)
tv = vHold(r3(tv + 0.04), VP, 0.2, "inOut");
sfx(0.32, "ai-package/cardboard-rustle", { gain: 0.3, reason: "the wrapping paper rustles as the big present changes hands" });
c.say(0.34, "wiz", "happy birthday!", 0.6, "excited", { voice: false, sub: "Happy birthday!", pos: SUB_TOP });
A(0.36, "wiz", "squash", { amount: 0.02, dur: 0.1 });
// the horn: his right hand takes it out of his mouth and tucks it into his robe
c.arm(0.5, "wiz", "R", { o: [-0.1, 0.44, 0.4] }, 0.1, "out"); A(0.5, "wiz", "grip", { side: "R", shape: "pinch", dur: 0.06 });
c.prop(0.58, "horn", { y: 0.42, z: 0.3 }, 0.05, "in");
c.at(0.6, { do: "prop", id: "horn", set: { scale: 0.001 }, dur: 0.03, ease: "in", reason: "tucked into the front of his robe (put away by 0.6, brief)" });
c.arm(0.64, "wiz", "R", "rest", 0.25, "inOut"); A(0.64, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(0.55, "wiz", "turn", { to: 35, dur: 0.3 });
A(0.62, "wiz", "expr", { expr: "smug", set: { curve: 0.55 }, dur: 0.15 });
A(0.62, "wiz", "look", { to: [0.4, -0.1], dur: 0.1, blink: false });
// Reaper at the right holds his neat black box out, deadpan (panel 1). It is on Viking's stack from the cut to panel 2
// (given off screen): the purple present draws it on its lid until Viking drops them
const rg = grips.box(c, "rea", BOX);
for (const s of ["R", "L"]) { c.arm(0, "rea", s, { prop: "giftB", grip: rg.hands[s].grip, palm: true }, 0); A(0, "rea", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "rea", "grab", { prop: "giftB", hand: "both", grip: [0, r3(0.55 * 0.24), 0], dur: 0, pose: null });
A(0, "rea", "look", { to: [-0.4, -0.15], dur: 0, blink: false });
const BOX_OUT = front(RA, R_YAW0, 0.52, 0, 0.42);   // at his tummy, his hands under his face
rg.carry(0.45, BOX_OUT, 0.3, "inOut");   // holds it out a little: mine
A(0.9, "rea", "expr", { expr: "deadpan", set: { curve: 0.2 }, dur: 0.2 });
// Viking beams at his present
A(0.85, "vik", "look", { to: [-0.1, -0.35], dur: 0.1, blink: false });
A(0.88, "vik", "squash", { amount: -0.03, dur: 0.15 });
// Gunslinger: claps along, beaming, empty-handed
A(0, "gsl", "expr", { expr: "happy", set: { curve: 0.75, open: 0.3 }, dur: 0 });
A(0, "gsl", "look", { to: [0.4, -0.2], dur: 0, blink: false });
const CLAP_IN = { o: [-0.2, 0.46, 0.3] }, CLAP_OUT = { o: [-0.08, 0.48, 0.28] };
for (const s of ["R", "L"]) { c.arm(0, "gsl", s, CLAP_OUT, 0); A(0, "gsl", "grip", { side: s, shape: "flat", dur: 0 }); }
for (const t of [0.1, 0.34, 0.58, 0.82]) for (const s of ["R", "L"]) { c.arm(t, "gsl", s, CLAP_IN, 0.08, "in"); c.arm(r3(t + 0.09), "gsl", s, CLAP_OUT, 0.12, "out"); }
see(0, 1.0, ["wiz.face", "vik.face", "gsl.face", "giftP", "rea", "giftB"], "panel 1: the Wizard pushes the huge present into Viking's arms, Reaper's black box, Gunslinger clapping behind");
// AND YOURS? the Wizard turns to Gunslinger, one eyebrow up; all three heads turn to him; his hands freeze empty
A(1.0, "wiz", "turn", { to: -40, dur: 0.25 });
A(1.0, "wiz", "move", { to: [r3(WA[0] - 0.04), r3(WA[1] + 0.12)], dur: 0.3, ease: "inOut", steps: 1, reason: "half a step back as he turns to Gunslinger (clear of Viking and the present; toward us, so his hat stays off Gunslinger's face)" });
A(1.05, "wiz", "look", { to: [-0.55, 0.0], dur: 0.08, blink: false });
A(1.08, "wiz", "expr", { expr: "smug", set: { curve: 0.3, tilt: 0.25 }, dur: 0.12 }); A(1.08, "wiz", "face", { browL: 0.5, dur: 0.12 });
c.say(1.1, "wiz", "and yours?", 0.45, "calm", { voice: false, sub: "And yours?", pos: SUB_TOP });   // it runs into the pocket pat, where his face is low in the frame
c.arm(1.1, "wiz", "R", { o: [0.06, 0.45, 0.3] }, 0.15, "out"); A(1.12, "wiz", "grip", { side: "R", shape: "open", dur: 0.1 });   // a palm up: well?
A(1.12, "vik", "look", { to: [-0.6, 0.05], dur: 0.1, blink: false }); A(1.15, "vik", "turn", { to: -32, dur: 0.25 });
A(1.15, "rea", "look", { to: [-0.6, -0.05], dur: 0.1, blink: false });
A(1.15, "gsl", "look", { to: [0.15, -0.05], dur: 0.06, blink: false });
act.sheepish(c, 1.18, "gsl");
for (const s of ["R", "L"]) { c.arm(1.14, "gsl", s, { o: [0.06, 0.4, 0.26] }, 0.12, "out"); A(1.14, "gsl", "grip", { side: s, shape: "open", dur: 0.1 }); }   // his empty palms
A(1.2, "gsl", "squash", { amount: 0.03, dur: 0.12 });
see(1.15, 1.48, ["gsl.face", "wiz", "vik.face"], "panel 1: \"And yours?\": everyone turns to Gunslinger, his hands empty");

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
// on the cut: Viking behind Gunslinger's right with the stacked presents (panel 2), expectant
const VB0 = [0.15, -1.15];   // at the shot's right edge on the cut, so he is in it by 1.75 (review A)
cheat(1.47, "vik", VB0, VB_YAW, "on the cut to the pocket pat: Viking just off the right of the shot with the presents (panel 2)");
vHold(1.47, front(VB0, VB_YAW, 0.6, 0, 0.22), 0.02, "linear");
allow.push({ who: "vik", from: 1.47, to: 1.62, checks: ["prop-pop", "hand-pop"], reason: "on the cut to panel 2, out of the shot: his arms (anime timing) catch up with the cheat a frame late" });
A(1.56, "vik", "look", { to: [-0.5, -0.1], dur: 0.08, blink: false });
A(1.5, "vik", "move", { to: VB, dur: 0.26, ease: "inOut", steps: 2 });   // he steps in behind Gunslinger's right, expectant
vHold(1.5, front(VB, VB_YAW, 0.6, 0, 0.22), 0.26, "inOut");
c.prop(1.47, "giftP", { stack: 1 }, 0.01, "linear");
c.at(1.47, { do: "prop", id: "giftB", set: { scale: 0.001 }, dur: 0.01, reason: "on the cut: Reaper's box is on Viking's stack (given off screen); the purple present draws it on its lid until Viking drops them" });
A(1.47, "rea", "release", { prop: "giftB", to: BOX_OUT, dur: 0.02 });
for (const s of ["R", "L"]) { c.arm(1.47, "rea", s, "rest", 0.02); A(1.47, "rea", "grip", { side: s, shape: "relaxed", dur: 0.02 }); }
allow.push({ who: "rea", from: 1.47, to: 1.62, checks: ["motion", "rig-jump", "lean-jump", "hand-pop"], reason: "on the cut to panel 2 (off screen): his box is on Viking's stack, his hands at rest" });
cheat(1.47, "wiz", W1, -55, "on the cut to the pocket pat: the Wizard out of the shots of panels 2-4");
cheat(1.47, "gsl", G0, G_YAW, "on the cut to the pocket pat: Gunslinger back to his place in front of the crate (in the wide he stood a little left, clear of the Wizard's hat)");
A(1.52, "vik", "look", { to: [-0.45, -0.05], dur: 0.08, blink: false });
A(1.52, "vik", "expr", { expr: "eager", set: { curve: 0.6, open: 0.2, eye: 1.1 }, dur: 0.12 }); A(1.52, "vik", "face", { brow: 0.35, dur: 0.12 });
A(2.0, "vik", "squash", { amount: -0.02, dur: 0.15 });   // a little expectant bounce
A(2.6, "vik", "face", { brow: 0.15, dur: 0.2 }); A(2.62, "vik", "expr", { expr: "kind", set: { curve: 0.2, eye: 1.0 }, dur: 0.2 });   // the moth: hmm
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
pocketPat(c, { who: "gsl", at: G0, yaw: G_YAW, friend: [0.55, 0.05] });
// the Wizard and Reaper (out of the shot) watch
A(1.6, "rea", "turn", { to: -70, dur: 0.3 });

// ---------------------------------------------------------------- 3 WAIT! 2.8-4.1 (panel 3)
// one finger up ("wait!"), the wallet back in the holster; the folded coupon from under his bandana and the pen from
// its knot; he sits back on the crate and scribbles on his knee, tongue out, the pen squeaking fast
c.prop(2.82, "wallet", { open: 0 }, 0.06, "inOut");
const HOLSTER = patProps({ at: G0, yaw: G_YAW })[0];
c.arm(2.8, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.1, "inOut");
A(2.9, "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.03 });
c.prop(2.91, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.03, "inOut");
c.at(2.93, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.03, ease: "in", reason: "back down in his holster (part of his costume)" });
// the finger up: wait!
c.arm(2.8, "gsl", "L", { o: [-0.05, 0.78, 0.3] }, 0.1, "out"); A(2.82, "gsl", "grip", { side: "L", shape: "point", dur: 0.06 });
A(2.8, "gsl", "expr", { expr: "eager", set: { curve: 0.55, open: 0.3, eye: 1.1 }, dur: 0.08 }); A(2.8, "gsl", "face", { brow: 0.35, dur: 0.08 });
A(2.8, "gsl", "look", { to: [0.5, 0.05], dur: 0.06, blink: false });
c.say(2.82, "gsl", "wait!", 0.3, "excited", { voice: false, sub: "Wait!", pos: SUB_TOP });   // over the heads, off his mouth (review A)
// the coupon (right hand) and the pen (left hand) out of his bandana
const cp = grips.phone(c, "gsl", { ...COUPON, scale: COUPON_K }, { side: "R" });
c.prop(2.96, "coupon", { scale: COUPON_K }, 0.06, "out");
let tc = cp.secure(cp.approach(2.94, 0.08), 0.08);
const pen = grips.thin(c, "gsl", { ...PEN, scale: 1 }, { side: "L", from: 0.72, roll: 20 });
c.prop(3.0, "pen", { scale: 1 }, 0.05, "out");
let tp = pen.secure(pen.approach(2.98, 0.1), 0.08);
// he sits back on the crate (hands keep), the coupon and pen coming down with him
const SIT = 3.12, SIT_DUR = 0.3, SIT_UP = r3(CRATE_TOP - 0.12);   // the body rises by the seat's top less the legs (timeline.js sit)
A(SIT, "gsl", "sit", { seat: "crate", height: CRATE_TOP, hands: "keep", dur: SIT_DUR });
sfx(r3(SIT + SIT_DUR), "kenney/book-place", { gain: 0.25, reason: "he plonks down on the wooden crate" });
// on his knee: the coupon flat (drawing up, its top toward him, so it reads from the camera), the pen over it
const KNEE = front(GS, G_YAW, 0.45, 0.02, r3(SIT_UP + 0.42));
tc = cp.carry(SIT, KNEE, SIT_DUR + 0.02, "inOut", { tip: 70 });
c.prop(r3(SIT + 0.1), "coupon", { unfold: 1 }, 0.16, "out");
sfx(r3(SIT + 0.12), "ai-package/cardboard-rustle", { gain: 0.2, reason: "the folded paper flicked open" });
const KF = (dx, dz) => [r3(KNEE[0] + dx), r3(KNEE[1] + 0.04), r3(KNEE[2] + dz)];
tp = pen.carry(SIT, KF(-0.1, -0.02), SIT_DUR + 0.02, "inOut", { tip: -60 });
// scribbling: quick strokes across the sheet while `write` draws the coupon stroke by stroke
const STROKES = [[-0.09, 0.02], [-0.02, 0.04], [0.05, 0.02], [0.09, 0.03], [-0.06, -0.05], [0.0, -0.03], [0.06, -0.06], [0.02, -0.02]];
let tw = 3.46;
c.prop(tw, "coupon", { write: 1 }, 0.56, "linear");
sfx(tw, "scribble", { gain: 0.5, reason: "the felt pen squeaking fast over the paper" });
for (const [dx, dz] of STROKES) { tp = pen.carry(tw, KF(dx, dz), 0.07, "inOut"); tw = r3(tw + 0.07); }
A(3.4, "gsl", "look", { to: [0.05, -0.6], dur: 0.08, blink: false });
A(3.42, "gsl", "expr", { expr: "focused", set: { pucker: 0.7, smirk: 0.5, curve: 0.2 }, dur: 0.12 });   // concentrating (the tongue-out stand-in: lips pushed to one side)
A(3.42, "gsl", "pitch", { to: 8, dur: 0.15 }); A(4.02, "gsl", "pitch", { to: 0, dur: 0.12 });
see(3.5, 4.0, ["gsl.face", "coupon", "pen"], "panel 3: on the crate, scribbling the coupon on his knee");
// Viking leans to look; the stack in his arms
A(3.3, "vik", "look", { to: [-0.5, -0.3], dur: 0.12, blink: false }); A(3.35, "vik", "pitch", { to: 6, dur: 0.25 });
A(3.4, "vik", "expr", { expr: "kind", set: { curve: 0.1, tilt: 0.2 }, dur: 0.2 }); A(3.4, "vik", "face", { brow: -0.1, lid: 0.3, dur: 0.2 });   // suspicious (panel 3)

// ---------------------------------------------------------------- 4 FREE HUG 4.1-4.5 (panel 4, the close)
// the pen tossed over his shoulder; the coupon up in both hands at his chest, facing us: FREE HUG (hit-stop 4.2)
tp = pen.carry(4.0, KF(0.02, 0.12), 0.05, "out");
A(4.05, "gsl", "release", { prop: "pen", dur: 0 });   // let go with a flick: it tumbles off behind him (physics)
c.throw(4.06, "pen", { v: [0.6, 1.6, -1.2], spin: [9, 2, 4] });
// he springs up off the crate with it (sitting, his arms can't bring it below his face)
A(3.98, "gsl", "stand", { dur: 0.1 });
const GUP = xz(front(GS, G_YAW, 0.12));   // standing: the stand moves him 0.12 forward
const SHOW = front(GUP, G_YAW, 0.5, 0.0, 0.22);   // its top under his chin
c.prop(4.0, "coupon", { tip: 0 }, 0.08, "out");
tc = cp.carry(4.0, SHOW, 0.08, "out");
allow.push({ who: "gsl", from: 4.0, to: 4.1, checks: ["prop-pop"], reason: "the coupon whipped off his knee up to his chest as he springs up off the crate (3 frames, a deliberate whip)" });
// the left hand onto the other edge: a two-hand hold
const cb = grips.box(c, "gsl", { ...COUPON, scale: COUPON_K }, { height: 0.95 });   // held by its top corners: it hangs below his face
// (flicked up, it hangs in the air for two frames at SHOW while both hands come to its top corners, then both hold it:
// the right hand never drags it to a new grip)
A(4.08, "gsl", "release", { prop: "coupon", to: SHOW, dur: 0 });
c.arm(4.08, "gsl", "L", { prop: "coupon", grip: cb.hands.L.grip, palm: true, at: SHOW }, 0.07, "out"); A(4.08, "gsl", "grip", { side: "L", shape: "press", dur: 0.06 });
c.arm(4.08, "gsl", "R", { prop: "coupon", grip: cb.hands.R.grip, palm: true, at: SHOW }, 0.07, "out"); A(4.08, "gsl", "grip", { side: "R", shape: "press", dur: 0.06 });
A(4.15, "gsl", "grab", { prop: "coupon", hand: "both", grip: [0, r3(0.95 * 0.19), 0], dur: 0.03, pose: null });
sfx(4.12, "kenney/cloth-belt", { gain: 0.25, reason: "the flick of the paper as he holds it up" });
act.grin(c, 4.1, "gsl", { back: 0.5 });
A(4.1, "gsl", "look", { to: [0.0, 0.0], dur: 0.05, blink: false });
c.hitStop(HS1, 3);
see(4.12, 4.45, ["coupon", "gsl.face"], "panel 4: FREE HUG held up at his chest, facing us, his huge grin");
// Viking comes over beside him to look (out of the close), the stack carried with him
A(4.0, "vik", "pitch", { to: 0, dur: 0.15 });
A(4.02, "vik", "turn", { to: VT_YAW, dur: 0.3 });
// (a little wide of his place while Gunslinger holds the coupon out with both elbows, out of the close; on the cut to
// panel 5 he is at it)
const VTS = xz(front(VT, VT_YAW, -0.04, 0.16));
A(4.02, "vik", "move", { to: VTS, dur: 0.4, ease: "inOut", steps: 3 });
const VK = front(VT, VT_YAW, 0.6, 0, 0.22), VKS = front(VTS, VT_YAW, 0.6, 0, 0.22);
vHold(4.02, VKS, 0.4, "inOut");
cheat(4.48, "vik", VT, VT_YAW, "on the cut to Viking's close: the last half step to Gunslinger's side (out of the coupon close)");
vHold(4.48, VK, 0.02, "linear");
allow.push({ who: "vik", from: VID(4.48), to: r3(VID(4.48) + 0.15), checks: ["prop-pop", "hand-pop"], reason: "on the cut to Viking's close: the presents come with him" }); c.prop(4.02, "giftP", { rot: GIFT.rot + (VT_YAW - VB_YAW) }, 0.4, "inOut");
// on the cut to the crying close: the Wizard and Reaper behind Viking (panel 5)
cheat(4.48, "wiz", W5, 20, "on the cut to Viking's close: the Wizard behind him at the left (panel 5)");
cheat(4.48, "rea", R5, -5, "on the cut to Viking's close: Reaper behind him at the right (panel 5)");

// ---------------------------------------------------------------- 5 BEST GIFT EVER 4.5-5.9 (panel 5, Viking close)
// the presents to his left arm; his right hand takes the coupon from Gunslinger's raised hands. He reads it. The Wizard
// snickers behind his mitten, Reaper rolls his eyes; they glance at each other. The music drops out (5.2 video): his
// lip trembles, his eyes fill, the tears come. "Best… gift… EVER!"
// the stack onto his left forearm: the left hand slides under it, the right one lets go
const UNDER = rotY([r3(-0.08 / GIFT_K), -0.03, 0.02], -90), UP = rotY([r3(-0.08 / GIFT_K), 1, 0.02], -90);
c.arm(4.5, "vik", "L", { prop: "giftP", grip: UNDER, palm: UP, at: VK }, 0.1, "inOut"); A(4.5, "vik", "grip", { side: "L", shape: "carry", dur: 0.1 });
A(4.58, "vik", "grab", { prop: "giftP", hand: "L", grip: UNDER, dur: 0.04, pose: null });
const VK1 = front(VT, VT_YAW, 0.6, 0.22, 0.24);
c.arm(4.62, "vik", "L", { prop: "giftP", grip: UNDER, palm: UP, at: VK1 }, 0.15, "inOut");
// Gunslinger lets go with his left hand and holds it out to Viking's side with his right
A(4.5, "gsl", "grab", { prop: "coupon", hand: "R", grip: cb.hands.R.grip, dur: 0.04, pose: null });
c.arm(4.5, "gsl", "L", { o: [-0.1, 0.38, 0.22] }, 0.2, "inOut");   // in to his tummy (Viking is right at his side) A(4.5, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
const OFFER = front(GUP, G_YAW, 0.42, 0.26, 0.45);
c.arm(4.5, "gsl", "R", { prop: "coupon", grip: cb.hands.R.grip, palm: true, at: OFFER }, 0.12, "inOut");
A(4.5, "gsl", "look", { to: [0.6, 0.1], dur: 0.08, blink: false });
// Viking's right hand takes it by its other edge (the phone hold: the drawing stays toward us)
const vc = grips.phone(c, "vik", { ...COUPON, x: OFFER[0], y: OFFER[1], z: OFFER[2], scale: COUPON_K }, { side: "R", edge: "L", height: 0.5 });
let tk = vc.takeFrom(4.56, OFFER, { reach: 0.16, settle: 0.12 });
c.arm(r3(tk + 0.01), "gsl", "R", "rest", 0.3, "inOut"); A(r3(tk + 0.01), "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
const READ = front(VT, VT_YAW, 0.5, -0.26, 0.4);
tk = vc.carry(r3(tk + 0.02), READ, 0.2, "inOut");
sfx(4.7, "ai-package/cardboard-rustle", { gain: 0.18, reason: "the coupon taken out of Gunslinger's hand" });
A(4.58, "vik", "look", { to: [-0.35, -0.35], dur: 0.08, blink: false });
A(4.6, "vik", "expr", { expr: "kind", set: { curve: 0.15, open: 0.05, eye: 1.05 }, dur: 0.15 }); A(4.6, "vik", "face", { brow: 0.2, lid: 0.1, dur: 0.15 });
A(4.88, "vik", "look", { to: [-0.15, -0.45], dur: 0.06, blink: false });   // reading
// the Wizard snickers behind his mitten, Reaper rolls his eyes; a glance at each other
A(4.5, "wiz", "look", { to: [0.2, -0.3], dur: 0, blink: false }); A(4.5, "rea", "look", { to: [-0.3, -0.3], dur: 0, blink: false });
c.arm(4.55, "wiz", "R", { o: [-0.22, 0.42, 0.4] }, 0.12, "out"); A(4.56, "wiz", "grip", { side: "R", shape: "relaxed", set: { curl: 0.5 }, dur: 0.1 });   // the mitten to his mouth
A(4.58, "wiz", "expr", { expr: "happy", set: { curve: 0.9, open: 0.15 }, dur: 0.1 }); A(4.6, "wiz", "face", { lid: 0.85, dur: 0.1 });
for (const t of [4.65, 4.8, 4.95]) A(t, "wiz", "squash", { amount: 0.025, dur: 0.07 });
sfx(4.66, "blow", { gain: 0.18, reason: "the Wizard's snicker puffing out behind his mitten" });
A(4.6, "rea", "look", { to: [0.0, 0.75], dur: 0.12, blink: false }); A(4.6, "rea", "face", { lid: 0.35, dur: 0.1 });   // eyes rolled up
A(4.9, "rea", "look", { to: [-0.55, 0.0], dur: 0.1, blink: false });   // to the Wizard
A(4.92, "wiz", "look", { to: [0.55, 0.05], dur: 0.1, blink: false }); A(4.92, "wiz", "face", { lid: 0.2, dur: 0.1 });
see(4.6, 5.05, ["vik.face", "coupon", "wiz.face", "rea.face"], "panel 5: Viking reads the coupon; the Wizard snickers behind his mitten, Reaper rolls his eyes");
// the music drops out: his lip trembles, his eyes fill
const TREM = V(5.2);
A(TREM, "vik", "look", { to: [0.0, -0.05], dur: 0.12, blink: false });
A(TREM, "vik", "expr", { expr: "sad", set: { curve: -0.1, open: 0.08, eye: 1.2 }, dur: 0.15 }); A(TREM, "vik", "face", { brow: 0.5, dur: 0.15 });
for (let t = r3(TREM + 0.08), k = 0; t < 5.75; t = r3(t + 0.06), k++) A(t, "vik", "expr", { expr: "sad", set: { open: k % 2 ? 0.12 : 0.04, curve: k % 2 ? -0.18 : -0.08 }, dur: 0.05 });   // the lip trembling
A(r3(TREM + 0.15), "vik", "face", { tear: 0.6, dur: 0.35 });
A(r3(TREM + 0.5), "vik", "face", { tear: 1, dur: 0.2 });
sfx(r3(TREM + 0.2), "gasp", { gain: 0.22, reason: "Viking's trembling breath in, his eyes filling (no sniffle in the whitelist)" });
A(r3(TREM + 0.1), "wiz", "look", { to: [0.3, -0.1], dur: 0.1, blink: false }); A(r3(TREM + 0.1), "wiz", "pitch", { to: 6, dur: 0.25 });   // he leans in, unsure
c.arm(r3(TREM + 0.1), "wiz", "R", "rest", 0.25, "inOut");
A(r3(TREM + 0.12), "wiz", "expr", { expr: "worried", set: { curve: 0.0 }, dur: 0.15 }); A(r3(TREM + 0.12), "wiz", "face", { lid: 0, dur: 0.1 });
c.say(5.66, "vik", "best... gift... ever!", 0.5, "sad", { voice: false, sub: "Best… gift… EVER!", pos: SUB_TOP });   // over his hair, off his tears and the lift (review A)
A(5.66, "vik", "expr", { expr: "happy", set: { curve: 0.6, open: 0.5, eye: 0.6 }, dur: 0.08 }); A(5.66, "vik", "face", { lid: 0.85, brow: 0.45, dur: 0.08 });   // bursting into happy tears
const HEART = (yaw) => front(VT, yaw, 0.47, -0.04, 0.3);
vc.carry(5.6, HEART(VT_YAW), 0.16, "inOut", { rot: r3(VT_YAW + 180), tip: 0 });   // to his heart
see(5.3, 5.85, ["vik.face", "coupon"], "panel 5: his lip trembles, the tears come: Best… gift… EVER!");
// Gunslinger, beside him (out of the close): beaming up at him
A(4.8, "gsl", "look", { to: [0.55, 0.25], dur: 0.1, blink: false }); A(4.8, "gsl", "expr", { expr: "happy", set: { curve: 0.8 }, dur: 0.15 });
// a step back to his right to give Viking the moment: out of the wider close (review A), so the Wizard's snicker shows
const GBACK = [r3(GS[0] - 0.39), r3(GS[1] + 0.07)];
A(4.82, "gsl", "move", { to: GBACK, dur: 0.35, ease: "inOut", reason: "a step back, beaming, to give Viking his moment" });
cheat(5.87, "gsl", GS, null, "on the cut to the hug: back where Viking scoops him up (he stepped out of the close)");

// ---------------------------------------------------------------- 6 THE HUG 5.9-6.8 (panel 6)
// he drops both presents (they thud on the rug, the black one on the purple one's lid) and bear-hugs Gunslinger up
// off the crate (hit-stop at 6.1 video). Warm swelling chord.
const DROP = 5.86, DROP_THUD = 6.12;   // the thud: where the bake lands it
A(DROP, "vik", "release", { prop: "giftP", dur: 0 });
// let go as he lunges for Gunslinger: the purple one drops onto the rug in front of him, the black one riding its lid
sfx(DROP_THUD, "book-close", { gain: 0.6, reason: "the big present thuds onto the rug" });
// Gunslinger up off the crate into his arms: side by side, both faces to us (panel 6); Viking's right arm round his back,
// the left across his tummy; Gunslinger's left arm over Viking's shoulders, the right one up (yay)
A(5.86, "vik", "turn", { to: HUG_YAW_V, dur: 0.22 });
cheat(5.88, "wiz", W6, 20, "on the cut to the hug: the Wizard out of the shot (panel 6 shows only the hug and the presents)");
A(5.86, "gsl", "turn", { to: HUG_YAW_G, dur: 0.14 });
A(5.9, "gsl", "move", { to: HG, y: LIFT, dur: 0.12, ease: "out", steps: 0, reason: "Viking lifts him up off the crate in a bear hug" });
const GP = (f, s, h) => front(HG, HUG_YAW_G, f, s, r3(LIFT + h));   // a point on Gunslinger (f: forward, s: to his left)
const HUG_ARMS = r3(DROP + 0.09);                                      // once the presents are clear of his hand
// the coupon stays pressed to his heart in his right mitten (turning with him); his left hand ducks out from under the
// presents, then scoops Gunslinger up round the front of his tummy
vc.carry(DROP, HEART(HUG_YAW_V), 0.28, "inOut", { rot: r3(HUG_YAW_V + 180), tip: 0 });
c.arm(DROP, "vik", "L", { world: front(VT, VT_YAW, 0.5, 0.05, 0.1) }, 0.07, "in");
c.arm(HUG_ARMS, "vik", "L", { world: GP(0.38, 0.08, 0.3) }, 0.13, "out");
A(r3(HUG_ARMS + 0.08), "vik", "grip", { side: "L", shape: "flat", dur: 0.06 });
const VPT = (f, s, h) => front(VT, HUG_YAW_V, f, s, h);               // a point on Viking
c.arm(5.92, "gsl", "L", { world: VPT(-0.25, -0.47, 0.82) }, 0.12, "out");  // round his shoulders (the near side, on his fur)
c.arm(5.92, "gsl", "R", { o: [0.3, 0.78, 0.18] }, 0.14, "out");              // up: yay
for (const s of ["R", "L"]) A(5.95, "gsl", "grip", { side: s, shape: s === "L" ? "flat" : "open", dur: 0.06 });
A(5.9, "gsl", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.2 }, dur: 0.06 });
c.arm(6.95, "gsl", "R", { o: [0.26, 0.56, 0.24] }, 0.35, "inOut");           // the yay arm comes down (clear of the Wizard's hat later)
A(6.06, "gsl", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.15 }); A(6.06, "gsl", "face", { lid: 0.6, dur: 0.12 });
A(6.06, "gsl", "look", { to: [0.1, 0.0], dur: 0.1, blink: false });
A(5.92, "vik", "expr", { expr: "happy", set: { curve: 0.7, open: 0.4, eye: 0.5 }, dur: 0.08 }); A(5.92, "vik", "face", { lid: 0.9, tear: 1, dur: 0.08 });
c.hitStop(HS2, 3);
sfx(HS2, "cloth", { gain: 0.55, reason: "the bear hug lands: fur against leather" });
sfx(r3(HS2 + 0.02), "ai/warm-resolve", { gain: 0.5, reason: "a warm swelling chord under the hug" });
A(HS2, "vik", "squash", { amount: 0.08, dur: 0.12 }); A(HS2, "gsl", "squash", { amount: 0.05, dur: 0.12 });
// the Wizard and Reaper, behind, stare at the presents on the rug
A(5.95, "wiz", "pitch", { to: 0, dur: 0.15 }); A(6.0, "wiz", "look", { to: [0.4, -0.5], dur: 0.1, blink: false }); act.shock(c, 6.05, "wiz", { hold: 0.6 });
A(6.0, "rea", "look", { to: [-0.3, -0.5], dur: 0.12, blink: false }); A(6.05, "rea", "face", { lid: 0.45, dur: 0.15 });
see(6.05, 6.75, ["gsl.face", "vik.face", "giftP"], "panel 6: the bear hug, Gunslinger off his seat, both presents on the rug (the black one on the purple one's lid)");
// the hug rocks side to side to the end; Viking sobs happily into his shoulder
for (let t = 6.25, k = 0; t < 9.6; t = r3(t + 0.42), k++) { A(t, "vik", "lean", { to: k % 2 ? -5 : 5, dur: 0.4 }); A(t, "gsl", "lean", { to: k % 2 ? -4 : 4, dur: 0.4 }); }
for (const t of [6.6, 7.4, 8.2]) { A(t, "vik", "squash", { amount: 0.03, dur: 0.1 }); }

// ---------------------------------------------------------------- 7 THE PRESENTS ON THE RUG 6.8-8.6 (panel 7)
// in front of the hug: the Wizard stares at his ignored present on the floor, jaw dropping; Reaper, deadpan, picks up
// his black box and dusts it off. (Both come round on the cut.)
cheat(6.78, "wiz", W7, W7_YAW, "on the cut to the presents: the Wizard bottom left in the foreground, staring back at the hug and his present (panel 7)");
cheat(6.78, "rea", R7, R7_YAW, "on the cut to the presents: Reaper bottom right, by his box (panel 7)");
// the black box rode the purple one's lid down (one body, so the drop lands the same every time); on the cut it lies
// on the rug beside it, where Reaper picks it up
c.prop(6.78, "giftP", { stack: 0 }, 0.01, "linear");
c.at(6.78, { do: "prop", id: "giftB", set: { x: BOX_LAND[0], y: 0, z: BOX_LAND[1], rot: r3(R7_YAW + 180), scale: BOX_K }, dur: 0.01, reason: "on the cut to panel 7: the black box off the purple one's lid, on the rug (a continuity cheat, hidden by the cut)" });
A(6.8, "wiz", "look", { to: [0.7, 0.15], dur: 0.06, blink: false });   // a side-eye up at the hug behind him (to his left)
A(6.85, "wiz", "expr", { expr: "shocked", set: { open: 1.0, eye: 1.35, curve: -0.1 }, dur: 0.25 }); c.at(6.86, { fx: "alert", who: "wiz", dur: 0.6 }); A(6.85, "wiz", "face", { brow: 0.55, dur: 0.2 });   // jaw dropping
A(7.15, "wiz", "squash", { amount: -0.03, dur: 0.3 });
see(6.9, 7.6, ["wiz.face", "giftP", "gsl.face", "vik"], "panel 7: the Wizard stares at his present on the rug, jaw dropping; the hug behind");
// Reaper's box (where the throw lands it: see BOX_LAND) up into his hands; a brush of the lid with his glove
A(6.85, "rea", "look", { to: [-0.15, -0.6], dur: 0.08, blink: false });
const BOXL = { ...BOX, x: BOX_LAND[0], y: 0, z: BOX_LAND[1], rot: r3(R7_YAW + 180) };
const rg2 = grips.box(c, "rea", BOXL);
A(6.9, "rea", "pitch", { to: 22, dur: 0.25 }); A(6.9, "rea", "crouch", { to: 0.6, dur: 0.25 });
let tb = rg2.take(6.95, { reach: 0.2, settle: 0.12 });
A(r3(tb + 0.05), "rea", "pitch", { to: 0, dur: 0.25 }); A(r3(tb + 0.05), "rea", "crouch", { to: 0, dur: 0.25 });
const RHOLD = front(R7, R7_DUST, 0.48, 0, 0.34);   // at his tummy: the dusting hand stays under his face
A(r3(tb + 0.05), "rea", "turn", { to: R7_DUST, dur: 0.32 });   // round to us with it, to dust it off
tb = rg2.carry(r3(tb + 0.05), RHOLD, 0.32, "inOut", { rot: r3(R7_DUST + 180) });
// dusting: the left hand holds it, the right one brushes the lid twice
c.arm(r3(tb + 0.1), "rea", "R", { o: [-0.1, 0.62, 0.42] }, 0.1, "out"); A(r3(tb + 0.1), "rea", "grip", { side: "R", shape: "flat", dur: 0.08 });
for (let k = 0; k < 3; k++) { const t = r3(tb + 0.22 + k * 0.18); c.arm(t, "rea", "R", { world: front(R7, R7_DUST, 0.5, k % 2 ? 0.08 : -0.08, 0.56) }, 0.09, "inOut"); }
for (const k of [0, 2]) c.at(r3(tb + 0.3 + k * 0.18), { fx: "poof", pos: front(R7, R7_DUST, 0.5, 0, 0.6), dur: 0.4, color: "#d8cdbd", puffs: 5, sparks: 0, size: 0.14, lift: 0.12 });   // dust off the lid (review A)
sfx(r3(tb + 0.25), "kenney/cloth", { gain: 0.25, reason: "Reaper's glove brushing the dust off his box's lid" });
A(r3(tb + 0.1), "rea", "look", { to: [0.0, -0.4], dur: 0.1, blink: false }); A(r3(tb + 0.1), "rea", "face", { lid: 0.5, dur: 0.1 });
see(r3(tb + 0.1), 8.5, ["rea.face", "giftB"], "panel 7: Reaper dusts off his black box, deadpan");

// ---------------------------------------------------------------- 8 THE WINK 8.6-9.8 (panel 8)
// over Viking's shoulder, still hugged in the air: two fingers to the brim at the Wizard, the wink, "Next year's on me!"
// The moth lifts and settles. The Wizard's left eye twitches (bottom left), a sweat drop.
const WK = V(8.8);
// the wink camera: on Gunslinger's face (turned to Viking, so from the right of the front), Viking's head at the right; the Wizard steps in to the
// bottom left of it (a step from his place in panel 7) and stares up at the two of them
const WFACE = [r3(HG[0] + 0.22 * Math.sin(rad(HUG_YAW_G))), r3(LIFT + 0.98), r3(HG[1] + 0.22 * Math.cos(rad(HUG_YAW_G)))], W_AZ = 30;   // his face (turned to Viking)
// (a step behind Gunslinger's right side, turned three quarters to us, so his face shows past the hug)
const W8 = [r3(WFACE[0] - 0.25 * Math.sin(rad(W_AZ)) - 1.05 * Math.cos(rad(W_AZ))), r3(WFACE[2] - 0.25 * Math.cos(rad(W_AZ)) + 1.05 * Math.sin(rad(W_AZ)))];
const W8_YAW = W_AZ + 35;
cheat(8.58, "wiz", W8, W8_YAW, "on the cut to the wink: the Wizard at the bottom left of it (panel 8)");
A(8.6, "wiz", "look", { to: [0.1, 0.4], dur: 0.06, blink: false });
A(8.6, "wiz", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.15, curve: -0.05 }, dur: 0.06 });
c.arm(r3(WK - 0.04), "gsl", "R", { o: [0.22, 0.66, 0.28] }, 0.1, "out");   // off Viking's shoulder, round to his own hat
wink(c, { who: "gsl", t: WK, until: END, line: "next year's on me!", sub: "Next year's on me!", pos: SUB_HIGH, side: "R", look: [-0.25, -0.35],
  react: (t) => {
    // the Wizard's left eye twitches (his own left: lidL), twice; a sweat drop
    for (const t0 of [t, r3(t + 0.45)]) for (const [dt, l] of [[0, 0.75], [0.07, 0.3], [0.13, 0.8], [0.2, 0.3], [0.3, 0.85], [0.38, 0.35]]) A(r3(t0 + dt), "wiz", "face", { lidL: l, dur: 0.04 });
    c.at(r3(t + 0.05), { fx: "sweat", who: "wiz", dur: 0.7, count: 2 });
  } });
see(r3(WK + 0.2), END, ["gsl.face", "moth", "wiz.face"], "panel 8: the wink over Viking's shoulder; the Wizard's eye twitches");

// blinks off the lines and the key looks
act.blinksAt(c, "wiz", [1.45, 3.0, 6.5]); act.blinksAt(c, "rea", [1.5, 3.2, 8.0]); act.blinksAt(c, "gsl", [1.4, 3.3]); act.blinksAt(c, "vik", [1.4, 3.1]);

// ---------------------------------------------------------------- shots (Jonny's panels)
// (9:16: a frame h metres tall is 0.5625 h wide at the target)
// 01 the wide from in front, from a little left and high, so Gunslinger's face shows past the Wizard; the cake in
// a push-in over the whole panel (review A: small and static): 5.2 m tall to 4.4 m, re-aimed at the group, every face
// clear of the Wizard's hat brim and inside the frame all the way (projected, 8 Nov)
const WIDE0 = frame([0.0, 0.72, 0.3], { az: 0, el: 14, h: 5.2, fov: 50 }), WIDE1 = frame([-0.3, 0.72, 0.5], { az: 0, el: 14, h: 4.4, fov: 50 });   // Reaper at the right edge (as panel 1 draws him), then out as the push turns with the heads to Gunslinger
const WIDE = { ...WIDE0, to: { pos: WIDE1.pos, look: WIDE1.look }, dur: 1.47, ease: "inOut" };
// 02 the pocket pat: Gunslinger chest up with the whole hat, Viking with the presents behind his right
const PATSHOT = frame([-0.72, 0.9, -0.75], { az: -15, el: 14, h: 2.4, fov: 40 });   // belt up (review A)
// 03 on the crate: a little wider and higher, Viking behind at the right
const SEAT = frame([-0.6, 0.9, -0.9], { az: -4, el: 14, h: 3.2, fov: 40 });   // lower, under his brim: his eyes as he writes (review A); wall over the heads for "Wait!"
// 04 the coupon close: FREE HUG at chest height (a quarter of the frame's width), his face over it
const CLOSE = frame([SHOW[0], 0.72, SHOW[2]], { az: G_YAW, el: 6, h: 2.0, fov: 36 });
// 05 Viking close: crying, the coupon in one hand, the presents in the other arm; the Wizard and Reaper behind
const VCLOSE = frame([VT[0], 0.8, r3(VT[1] - 0.05)], { az: 10, el: 12, h: 3.3, fov: 42 });   // wider and lower: the Wizard's and Reaper's faces past his (review A, projected)
// 06 the hug from in front, the presents on the rug in front of it
const HUGSHOT = frame([r3((HG[0] + VT[0]) / 2 + 0.15), 1.2, r3(HG[1] + 0.3)], { az: -5, el: 14, h: 3.5, fov: 44 });   // the lifted hat under "Best… gift… EVER!", the presents low in front
// 07 from the right, lower: the Wizard and Reaper in front of the hug with the presents, a slow push-in
const HUG7 = frame([r3((HG[0] + VT[0]) / 2 + 0.1 + 0.4 * Math.cos(rad(34))), 0.72, r3(HG[1] + 0.45 - 0.4 * Math.sin(rad(34)))], { az: 34, el: 20, h: 5.0, fov: 44, push: 0.06, dur: 1.8 });
// 08 the wink: close on Gunslinger's face from a little below (he is up in the air), Viking's head at the right, the
// Wizard at the bottom left
const WINKSHOT = frame([r3(WFACE[0] - 0.36 * Math.cos(rad(W_AZ))), r3(WFACE[1] - 0.15), r3(WFACE[2] + 0.36 * Math.sin(rad(W_AZ)))], { az: W_AZ, el: 3, h: 2.6, fov: 40 });
const beats = c.beats([
  ["P1 pay up", 0, WIDE, "hook"],
  ["P2 the pocket pat", PAT.from, PATSHOT],
  ["P3 wait!", 2.8, SEAT],
  ["P4 free hug", 4.1, CLOSE, "reaction"],
  ["P5 best gift ever", 4.5, VCLOSE, "escalation"],
  ["P6 the hug", 5.9, HUGSHOT, "payoff"],
  ["P7 the presents", 6.8, HUG7],
  ["P8 the wink", 8.6, WINKSHOT],
], END);

write(import.meta.url, {
  id: "your-birthday",
  title: "That one friend who never has money… at your birthday",
  idea: "Never has money, episode 4: Viking's birthday. The Wizard gives a huge present, Reaper a neat black box; \"And yours?\" Gunslinger's hands are empty, the pocket pat finds the moth; he scribbles a FREE HUG coupon on his knee; Viking bursts into happy tears, drops the expensive presents and bear-hugs him off his seat; next year's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
  cover: 2.6,
  set: { type: "xmasroom", party: true, light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, life: "auto", cel: { at: 0.25 } },
  // a bright ukulele-and-glockenspiel pop with claps, ~120 bpm in C (brief): the plucky "bounce" in C with the bell lead
  // at 120; out for the trembling lip (5.2-5.9 video), back on the hug, the lead alone (music box) for the wink.
  // Parts on the video clock
  music: { style: "bounce", key: 0, lead: "bell", bpm: 120, lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 5.2, part: "hush" }, { at: 6.1, part: "drop" }, { at: 8.85, part: "musicbox" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "carpet", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["wiz", "vik", "giftP", "gsl", "rea"], hint: 0.3, what: "the party horn blares and the Wizard pushes a huge present into Viking's arms" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // windows on the video clock (after the hit-stops at 4.2 and 6.1 the times are 0.1 and 0.2 s later than the story's)
  allowClip: [
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.0, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: 2.27, to: 2.33, checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: 2.38, to: 2.52, checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", from: 1.5, to: 1.78, checks: ["rig-jump", "motion"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s (episode 1's block)" },
    { who: "gsl", from: 2.8, to: 2.95, checks: ["rig-jump", "prop-pop", "motion"], reason: "the wallet snapped shut and shoved back in the holster in one whip (0.1 s)" },
    { who: "gsl", with: "hatG", from: 0, to: 10, reason: "his party hat, worn on top of his cowboy hat" },
    { who: "vik", with: "hatV", from: 0, to: 10, reason: "his party hat (worn)" },
    { who: "vik", with: "rosette", from: 0, to: 10, reason: "his birthday rosette (worn)" },
    { who: "wiz", with: "horn", from: 0, to: 0.65, reason: "the party horn in his mouth, then tucked into his robe" },
    { who: "gsl", with: "crate", from: 3.1, to: 6.0, reason: "he sits on the crate" },
    { who: "gsl", with: "pen", from: 2.95, to: 4.15, reason: "he pulls the pen from his bandana's knot and scribbles with it" },
    { who: "gsl", from: 3.45, to: 4.05, checks: ["prop-pop", "motion"], reason: "quick scribbles on the coupon: the pen rocks in his fist with each stroke" },
    { who: "gsl", with: "vik", from: 5.95, to: 10, reason: "the bear hug: Viking's arms round his sides and back, his arms over Viking's shoulders" },
    { who: "vik", with: "gsl", from: 5.95, to: 10, reason: "the bear hug" },
    { who: "gsl", from: 5.9, to: 6.15, checks: ["motion", "rig-jump", "lean-jump"], reason: "Viking scoops him up off the crate in the bear hug" },
    ...allow,
  ],
  notes: "Generated by storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs. Panels and departures: PANELS.md.",
});
