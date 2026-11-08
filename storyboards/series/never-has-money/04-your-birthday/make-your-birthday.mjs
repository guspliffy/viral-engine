// THAT ONE FRIEND WHO NEVER HAS MONEY… AT YOUR BIRTHDAY (never has money, episode 4, 8 Nov 2026), from the clip
// template. Written by the director for the writer head-to-head trial (8 Nov).
//   node storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs -> your-birthday.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/04-your-birthday/ there (PANELS.md here).
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Viking, Wizard, Reaper; at home, no Samurai)
//   Joke:        Viking's birthday: Wizard hands over a huge purple present, Reaper a neat black box, and every head
//                turns to Gunslinger, empty-handed. Pocket pat, moth. He scribbles a FREE HUG coupon on his knee.
//                The friends snicker; Viking reads it, bursts into happy tears, drops the expensive presents and
//                bear-hugs him off the floor.
//   Wants:       Gunslinger wants to give a present without paying for one.
//   Consequence: the cheapest gift wins; the Wizard's expensive one lies ignored on the rug.
//   Ending:      over Viking's shoulder he winks at the stunned Wizard: "Next year's on me!".
//   Callback:    frame 0 the Wizard's big present wins Viking's beam; the last frame the Wizard twitches, his present
//                forgotten on the floor.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the coupon held up at 4.2, the hug landing at 6.1 on the video's clock) add 0.2 s: 9.8 s of
// story = exactly 10.0 s of video
const HS1 = 4.2, HS2 = 6.0, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);
const rad = (d) => (d * Math.PI) / 180;
const rotY = ([x, y, z], d) => { const a = rad(d); return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
// a point in front of someone: f metres along their facing, s metres to their left (their own left), at height y
const front = ([x, z], yaw, f, s, y) => { const a = rad(yaw); return [r3(x + f * Math.sin(a) + s * Math.cos(a)), y, r3(z + f * Math.cos(a) - s * Math.sin(a))]; };

// ---------------------------------------------------------------- the living room (world metres; the camera at +z)
// Two rows, as panel 1: Gunslinger (back left) and Viking (back right), the Wizard (front left) and Reaper (front
// right). Everyone stands at least 0.85 m from everyone else (a potato is ~0.8 m wide: the 8 Nov layout had bodies
// 55-67 % into each other at 0.7 m), so the room is wider than the panel and the wide frames cut the Wizard and Reaper
// at its edges, as panel 1 does. Gunslinger stays at Viking's right (screen left) all clip, so the hug is the panels'
// hug mirrored (PANELS.md, departures). The crate stands behind Gunslinger's right from frame 0; the cake table front
// left.
const V0 = [0.3, -0.35], V_YAW = -55;             // Viking, 3/4 to us toward the Wizard (his face reads at frame 0), the present in his arms
const V_TO_R = 54;                                // ... turning to Reaper and holding it out to him for the black box
const V_FRONT = 0;                                // ... and beaming at both
const W0 = [-0.75, 0.05], W_YAW = 75;             // the Wizard at the present's front left, palms pushing it in ...
const W1 = [-1.5, -0.35], W1_YAW = 75;           // ... then back to Gunslinger's left, out of the shots on him
const W3 = [-0.75, -0.45];                        // ... and a hop in toward the hug at 8.2 to stare (panel 8, review A)
const W2 = [-1.15, 0.5], W2_YAW = 60;             // ... and in at the front left (while the coupon is close) to snicker, to the end
const G0 = [-0.42, -0.98], G_YAW = 15;            // Gunslinger
// Reaper keeps 1.0 m or more from Viking (the fur makes Viking wider than the others), except the moment he sets the
// black box down: he comes in along the line the present points, so his mittens sit either side of it
const XZ = ([x, , z]) => [x, z];
// Viking holds the present out to him 0.6 m in front (PB_R): Reaper comes in along that line to 0.6 m past it, so
// he stays 1.2 m from Viking (his robe is wide) and his mittens on the black box's ends are 0.61 m from Viking's middle
const R0 = XZ(front(V0, V_TO_R, 1.35, 0, 0)), R_YAW = -85;            // Reaper with the black box, face 3/4 to us ...
const R1 = XZ(front(V0, V_TO_R, 1.2, 0, 0)), R1_YAW = V_TO_R - 180;   // ... a step in to set it on top, square to the present ...
const R2 = [1.3, 0.35], R2_YAW = -60;             // ... and back, hands folded, to the end
const CRATE = { x: -0.75, z: -1.5, size: 0.34 };    // behind his right side (screen left)
const G1_YAW = -22;                               // on the crate, turned half away from Viking
// the hug: Viking turns to -30 where he stands; Gunslinger is lifted at Viking's right (HUG_OFF in Viking's frame:
// 0.72 to his right, 0.3 forward, 0.78 from his middle: side by side, cheek to cheek, panel 6), turned HUG_YAW from
// Viking's facing, so both faces are 3/4 to us
const VH = V0, VH_YAW = -30, HUG_OFF = [-0.8, 0, 0.3], HUG_YAW = 20, LIFT = 0.45;
const at = (yaw) => { const o = rotY(HUG_OFF, yaw); return [r3(VH[0] + o[0]), r3(VH[1] + o[2])]; };
// he hops off the crate to 1.05 m from Viking on the line to the hug spot (his brim clears Viking), presenting the
// coupon; the hug pulls him the last 0.2 m in
const HUG_AT = at(VH_YAW);
const G2 = (() => { const d = [HUG_AT[0] - VH[0], HUG_AT[1] - VH[1]], L = Math.hypot(...d); return [r3(VH[0] + (d[0] * 1.05) / L), r3(VH[1] + (d[1] * 1.05) / L)]; })(), G2_YAW = 12;
const V_SPIN = -95;                               // Viking's facing after the slow happy turn: Gunslinger behind his shoulder (panel 8)
const GEND = at(V_SPIN);                          // Gunslinger, over Viking's shoulder for the wink
const PB_LAND = [-0.1, 0, 0.55];                   // the purple present on the rug after the drop
// the black box is aimed in front of Reaper's left, clear of his robe (it turned it on the way) and of the purple
// present; BB_AT is where the bake really lands it (layout of 8 Nov, physics hash in TRIAL.md) ...
const BB_LAND = [0.75, 0, 0.85];
const BB_AT = [0.646, 0, 0.317];                 // (it glances off Reaper's side and stands on its end there)
// ... and Reaper steps round to its front right (his reach then points away from Viking's fur), takes it from there and
// turns to us with it (panel 7)
const R3 = [1.041, 0.46], R3_YAW = -110, R3_OUT = -30;
const CAKE_TABLE = { x: -0.55, z: 1.15, w: 0.5, d: 0.42, h: 0.42 };

// the presents (props3d.js gift; grips.mjs SIZE.gift is 0.3 x 0.24 before scale)
const PB_K = 1.25, BB_K = 0.55;                    // the purple box 0.375 x 0.3, the black box 0.165 x 0.132
const PB_AT0 = front(V0, V_YAW, 0.5, 0, 0.1);      // in Viking's arms at frame 0, the Wizard's mittens still on it
const PB_IN = front(V0, V_YAW, 0.46, 0, 0.12);     // pulled in against his belly
const PB = { id: "pbox", kind: "gift", w: 0.3, h: 0.24, color: "#7a3fc4", ribbon: "#f2c23a", scale: PB_K, ...grips.placeFor("gift", PB_AT0, V_YAW) };
const BB_START = front(R0, R_YAW, 0.42, 0, 0.32);
const BB = { id: "bbox", kind: "gift", w: 0.3, h: 0.24, color: "#23212b", ribbon: "#d4d8e0", scale: BB_K, ...grips.placeFor("gift", BB_START, R_YAW) };
// once Viking has turned to Reaper, the purple box is here and the black box goes on its top
const PB_R = front(V0, V_TO_R, 0.6, 0, 0.12);
const BB_ON = [PB_R[0], r3(PB_R[1] + 0.24 * PB_K + 0.002), PB_R[2]];
// the coupon (props-birthday.js, 0.36 x 0.26): folded in his bandana; small on his knee while he writes (CW_K: the
// folded half he writes on), opened out to full size as he holds it up (CP_K)
const CP = { id: "coupon", kind: "coupon", seed: 5, x: r3(G0[0] + 0.02), y: 0.62, z: r3(G0[1] + 0.3), rot: r3(G_YAW + 180), ink: 0, scale: 0.001, staged: "folded under his bandana until he pulls it out" };
const CP_K = 1, CW_K = 0.85;
const PEN = { id: "pen", kind: "feltpen", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, front(G0, G_YAW, 0.29, 0.13, 0.6)[i]])), rot: r3(G_YAW + 180), scale: 0.001, staged: "tucked in his bandana's knot until he pulls it out" };

const cast = [
  { id: "wiz", character: "never-has-money/wizard", at: W0, face: W_YAW, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "never-has-money/viking", at: V0, face: V_YAW, expr: "delighted", follow: 0.3, seed: 4.1 },
  { id: "gsl", character: "never-has-money/gunslinger", at: G0, face: G_YAW, expr: "happy", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: R0, face: R_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
];
const props = [
  { id: "floor", kind: "plankfloor", x: 0, z: 0.4, w: 7, d: 6 },
  { id: "rug", kind: "rug", x: 0.0, z: -0.2, w: 2.8, d: 2.0, color: "#9a3a3a", pattern: true },
  { id: "crate", kind: "crate", x: CRATE.x, z: CRATE.z, size: CRATE.size, rot: -10 },
  { id: "caketable", kind: "kitchentable", x: CAKE_TABLE.x, z: CAKE_TABLE.z, w: CAKE_TABLE.w, d: CAKE_TABLE.d, h: CAKE_TABLE.h },
  { id: "cake", kind: "cake", x: CAKE_TABLE.x, y: CAKE_TABLE.h, z: CAKE_TABLE.z, lit: 1 },
  { id: "horn", kind: "partyhorn", mouth: "wiz", target: "pbox", at: [0, 0.5, 0], len: 0.3, maxPitch: 0.35, show: 1, blow: 0 },
  PB, BB, CP, PEN,
  // the party hats (striped cone on his cowboy hat's crown, dotted cone on Viking's hair) and Viking's birthday rosette
  // (props-birthday.js; wear points from the bench, storyboards/lookdev/make-birthday-bench.mjs)
  { id: "hatG", kind: "partyhat", wear: "gsl", pattern: "stripes", x: 0.12, y: 1.265, z: -0.08, tilt: 12, pitch: 0 },
  { id: "hatV", kind: "partyhat", wear: "vik", pattern: "dots", x: -0.11, y: 1.27, z: 0.03, tilt: -10, pitch: 0 },
  { id: "rosette", kind: "rosette", wear: "vik", x: 0.24, y: 0.52, z: 0.34 },
  // his tongue out at the corner of his mouth while he writes (panel 3; props-guard.js, worn on his face)
  { id: "tongue", kind: "tongue", wear: "gsl", x: 0.03, y: 0.6, z: 0.385, tip: 30, scale: 1.3, on: 0 },
  // the hug: Gunslinger rides this point (it stands where Viking hugs him and turns with Viking), so he leaves the floor
  { id: "lift", kind: "carrier", x: VH[0], y: 0, z: VH[1], rot: VH_YAW },
  ...patProps({ who: "gsl", at: G0, yaw: G_YAW }).map((p) => (p.id === "wallet" ? { ...p, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : p)),
];
const SUB_LOW = 1250, SUB_HIGH = 560;

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// frame 0: the Wizard's horn blasts as his mittens push the big purple present into Viking's arms; Viking turns to
// Reaper, who reaches across and sets the black box on top; Viking beams. At 1.1 the Wizard turns to Gunslinger: "And
// yours?"; every head turns to him and his empty mittens.
sfx(0, "partyhorn", { gain: 0.55, reason: "the Wizard's party horn blasting at Viking" });
c.prop(0, "horn", { blow: 1, flutter: 1 }, 0.12, "out");
c.prop(0.3, "horn", { blow: 0, flutter: 0 }, 0.12, "in");
// Viking holds the present from frame 0 and pulls it in to his belly
const vbox = grips.box(c, "vik", PB);
const VB_GRAB = vbox.hands.R.grip.map((v, i) => (i === 0 ? 0 : v));
c.arm(0, "vik", "R", { prop: "pbox", grip: vbox.hands.R.grip, palm: true }, 0); c.arm(0, "vik", "L", { prop: "pbox", grip: vbox.hands.L.grip, palm: true }, 0);
A(0, "vik", "grip", { side: "both", shape: "press", dur: 0 });
A(0, "vik", "grab", { prop: "pbox", hand: "both", grip: VB_GRAB, dur: 0, pose: null });
vbox.carry(0.04, PB_IN, 0.26, "out");
// the Wizard's palms on the box's near face (the hold frame's -z, away from Viking), pushing it in, then off
const PUSH = (s) => ({ prop: "pbox", grip: [s * 0.08, 0.15, -0.21], palm: true });
c.arm(0, "wiz", "R", PUSH(1), 0); c.arm(0, "wiz", "L", PUSH(-1), 0); A(0, "wiz", "grip", { side: "both", shape: "flat", dur: 0 });
c.arm(0.3, "wiz", "R", "rest", 0.28, "inOut"); c.arm(0.3, "wiz", "L", "rest", 0.28, "inOut"); A(0.3, "wiz", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
// the horn: his right mitten closes over it at his lips and tucks it into his robe by 0.6
c.arm(0.36, "wiz", "R", { o: [-0.2, 0.47, 0.34] }, 0.12, "out"); A(0.38, "wiz", "grip", { side: "R", shape: "hold", dur: 0.08 });
c.prop(0.46, "horn", { show: 0 }, 0.08, "in");
c.arm(0.5, "wiz", "R", { o: [-0.16, 0.33, 0.3] }, 0.1, "inOut");
c.arm(0.62, "wiz", "R", "rest", 0.28, "inOut"); A(0.62, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(0.55, "wiz", "move", { to: W1, dur: 0.45, ease: "inOut", steps: 2 }); A(0.55, "wiz", "turn", { to: W1_YAW, dur: 0.4 });
A(0, "wiz", "look", { to: [0.45, -0.05], dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "happy", set: { curve: 0.7, pucker: 0.6 }, dur: 0 });
A(0.3, "wiz", "expr", { expr: "happy", set: { curve: 0.75, pucker: 0, open: 0.3 }, dur: 0.1 });
c.say(0.3, "wiz", "happy birthday!", 0.6, "excited", { voice: false, sub: "Happy birthday!", pos: SUB_LOW });
// Reaper: the black box in both mittens (high on its ends, so the mittens stay above the purple box's top as he sets it
// down), a step in, sets it on top square to himself, lets go, steps back
const rbox = grips.box(c, "rea", BB, { height: 0.9 });
c.arm(0, "rea", "R", { prop: "bbox", grip: rbox.hands.R.grip, palm: true }, 0); c.arm(0, "rea", "L", { prop: "bbox", grip: rbox.hands.L.grip, palm: true }, 0);
A(0, "rea", "grip", { side: "both", shape: "press", dur: 0 });
A(0, "rea", "grab", { prop: "bbox", hand: "both", grip: rbox.hands.R.grip.map((v, i) => (i === 0 ? 0 : v)), dur: 0, pose: null });
A(0.35, "rea", "move", { to: R1, dur: 0.3, ease: "inOut", steps: 2 }); A(0.35, "rea", "turn", { to: R1_YAW, dur: 0.3 });
A(0.3, "vik", "turn", { to: V_TO_R, dur: 0.35 }); vbox.carry(0.3, PB_R, 0.35, "inOut", { rot: r3(V_TO_R + 180) });
let tr = rbox.carry(0.35, [BB_ON[0], r3(BB_ON[1] + 0.05), BB_ON[2]], 0.32, "inOut", { rot: r3(R1_YAW + 180) });
tr = rbox.place(tr, BB_ON, 0.12);
sfx(r3(tr), "put-down", { gain: 0.25, reason: "the black box set down on the purple present" });
const tf = rbox.release(r3(tr + 0.04), { back: 0.12, rest: false });
// then his mittens folded in front of his belly (deadpan, waiting), clear of everyone
c.arm(r3(tf + 0.1), "rea", "R", { o: [-0.1, 0.33, 0.34] }, 0.35, "inOut"); c.arm(r3(tf + 0.12), "rea", "L", { o: [-0.1, 0.31, 0.36] }, 0.35, "inOut");
A(r3(tf + 0.1), "rea", "grip", { side: "both", shape: "relaxed", dur: 0.3 });
// it rides on the purple box: Viking's right mitten has it too from here (keep: it stays exactly where it sits)
A(r3(tr + 0.05), "vik", "grab", { prop: "bbox", hand: "R", keep: true, dur: 0, pose: null });
A(r3(tr + 0.12), "rea", "move", { to: R2, dur: 0.4, ease: "inOut", steps: 2 }); A(r3(tr + 0.12), "rea", "turn", { to: R2_YAW, dur: 0.35 });
A(0, "rea", "look", { to: [-0.5, -0.2], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.4, dur: 0 });
// Viking beams at the Wizard, at the box arriving, then at both presents
A(0, "vik", "look", { to: [-0.5, -0.1], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "delighted", set: { curve: 0.85, open: 0.35 }, dur: 0 });
A(0.32, "vik", "look", { to: [0.45, -0.2], dur: 0.12, blink: false });
A(1.1, "vik", "turn", { to: V_FRONT, dur: 0.25 }); vbox.carry(1.1, front(V0, V_FRONT, 0.46, 0, 0.12), 0.25, "inOut", { rot: r3(V_FRONT + 180) });
A(1.0, "vik", "look", { to: [0.0, -0.4], dur: 0.12, blink: false });
A(1.02, "vik", "squash", { amount: 0.03, dur: 0.2 });
// Gunslinger claps along, happy, hands empty
A(0, "gsl", "look", { to: [0.45, -0.2], dur: 0, blink: false });
const CLAP = (d) => ({ o: [d, 0.36, 0.3] });
c.arm(0, "gsl", "R", CLAP(-0.14), 0); c.arm(0, "gsl", "L", CLAP(-0.14), 0);
for (const t of [0.12, 0.42, 0.72]) {
  for (const s of ["R", "L"]) { c.arm(t, "gsl", s, CLAP(-0.06), 0.08, "in"); c.arm(r3(t + 0.09), "gsl", s, CLAP(-0.15), 0.1, "out"); }
  sfx(r3(t + 0.08), "pat", { gain: 0.3, reason: "Gunslinger clapping his mittens along" });
}
// "And yours?": the Wizard turns to him, one brow up; the heads turn
A(1.02, "wiz", "turn", { to: 95, dur: 0.22 });
A(1.02, "wiz", "look", { to: [0.6, 0.05], dur: 0.12, blink: false });
A(1.08, "wiz", "expr", { expr: "smug", set: { raise: 0.05 }, dur: 0.15 });
c.say(1.08, "wiz", "and yours?", 0.4, "calm", { voice: false, sub: "And yours?", pos: SUB_LOW });
A(1.14, "vik", "look", { to: [-0.75, 0.05], dur: 0.12, blink: false });
A(1.18, "rea", "look", { to: [-0.7, 0.0], dur: 0.15, blink: false });
A(1.1, "gsl", "expr", { expr: "eager", set: { curve: 0.3, open: 0.1 }, dur: 0.12 });
A(1.1, "gsl", "look", { to: [-0.3, 0.0], dur: 0.1, blink: false });
// his empty mittens, palms up: nothing
c.arm(1.14, "gsl", "R", { o: [0.04, 0.36, 0.3] }, 0.14, "out"); c.arm(1.14, "gsl", "L", { o: [0.04, 0.36, 0.3] }, 0.14, "out");
A(1.14, "gsl", "grip", { side: "both", shape: "flat", set: { up: 1 }, dur: 0.12 });
c.arm(1.38, "gsl", "R", "rest", 0.1, "inOut"); c.arm(1.38, "gsl", "L", "rest", 0.1, "inOut"); A(1.38, "gsl", "grip", { side: "both", shape: "relaxed", dur: 0.1 });
see(0, 1.45, ["wiz.face", "gsl.face", "vik.face", "pbox"], "panel 1: the presents going to Viking, the faces");
see(1.2, 1.45, ["gsl.face", "gsl", "rea.face"], "panel 1: every head turns to his empty mittens at 'And yours?'");

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
pocketPat(c, { who: "gsl", at: G0, yaw: G_YAW, friend: [0.6, 0.05] });
A(1.6, "vik", "look", { to: [-0.5, -0.1], dur: 0.12, blink: false });
A(2.58, "vik", "expr", { expr: "kind", set: { curve: 0.15 }, dur: 0.2 });
A(1.7, "wiz", "look", { to: [0.5, 0.05], dur: 0.15, blink: false });
A(2.6, "rea", "face", { lid: 0.55, dur: 0.2 });

// ---------------------------------------------------------------- 3 THE DODGE, part 1: 2.8-4.1 (panel 3)
// the wallet back in the holster; a finger up ("wait!"); the folded paper out of his bandana (right hand), the pen out
// of its knot (left hand); he sits back on the crate and scribbles on his knee, tongue out, then tears it square
c.prop(2.82, "wallet", { open: 0 }, 0.08, "inOut");
const HOLSTER = patProps({ at: G0, yaw: G_YAW })[0];
// (0.18 s, not 0.12: drawn on 2s, a 0.12 s drop from his chest to the holster jumped 35 cm in one drawing)
c.arm(2.82, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.18, "inOut");
A(3.0, "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.04 });
c.prop(3.02, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.04, "inOut");
c.at(3.08, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.04, ease: "in", reason: "back down in his holster (part of his costume), so it walks with him" });
// the finger up (left): wait!
c.arm(2.82, "gsl", "L", { o: [0.06, 0.62, 0.22] }, 0.12, "out"); A(2.84, "gsl", "grip", { side: "L", shape: "point", dur: 0.08 });
A(2.82, "gsl", "expr", { expr: "eager", set: { curve: 0.5, open: 0.25, raise: 0.05 }, dur: 0.1 });
A(2.82, "gsl", "look", { to: [0.35, 0.15], dur: 0.08, blink: false });
// the paper (right hand) and the pen (left hand)
// the hold is measured for the full-size coupon (it is what we see up close); on his knee the folded half is smaller
// held by its lower corners (at the usual phone height the mitten covers FREE)
const CP_HOLD = -0.42;
const note = grips.phone(c, "gsl", { ...CP, scale: CP_K }, { side: "R", height: CP_HOLD });
c.prop(3.0, "coupon", { scale: CW_K }, 0.06, "out");
note.secure(note.approach(3.04, 0.06), 0.08);
A(3.04, "gsl", "grip", { side: "L", shape: "open", dur: 0.06 });
const pen = grips.thin(c, "gsl", { ...PEN, scale: 1.5 }, { side: "L", from: 0.5, roll: 20 });
c.prop(3.04, "pen", { scale: 1.5 }, 0.05, "out");
let tp = pen.secure(pen.approach(3.04, 0.08), 0.08);
// back onto the crate behind him, turning half away from Viking
A(3.32, "gsl", "sit", { seat: "crate", dur: 0.2, hands: "keep", height: CRATE.size, feet: [0.28, 0.14] });
A(3.32, "gsl", "turn", { to: G1_YAW, dur: 0.2 });
sfx(3.5, "sit", { gain: 0.3, reason: "he plonks down on the wooden crate" });
// writing on his knee: the paper flat on his lap, the pen scribbling, tongue out
const SEAT = [CRATE.x, CRATE.z];
// the paper on his outer knee, toward us (review A: under his mitten it didn't read)
const KNEE = [r3(CRATE.x - 0.23), 0.4, r3(CRATE.z + 0.5)];
note.carry(3.32, KNEE, 0.2, "inOut", { tip: -30, rot: r3(G1_YAW + 180) });
const KF = (dx, dz) => [r3(KNEE[0] + dx), r3(KNEE[1] + 0.03), r3(KNEE[2] + dz)];
tp = pen.carry(3.32, KF(-0.05, 0.02), 0.22, "inOut", { tip: -60 });
c.prop(3.56, "coupon", { ink: 1 }, 0.36, "linear");
sfx(3.56, "scribble", { gain: 0.45, reason: "the pen squeaking fast over the paper" });
for (const [i, s] of [[0.05, 0.0], [-0.04, -0.02], [0.04, 0.02], [-0.02, 0.0], [0.05, -0.01]].entries()) tp = pen.carry(r3(3.56 + i * 0.065), KF(...s), 0.06, "inOut");
A(3.32, "gsl", "look", { to: [0.1, -0.6], dur: 0.1, blink: false });
A(3.32, "gsl", "expr", { expr: "focused", set: { pucker: 0.3 }, dur: 0.12 });
c.prop(3.5, "tongue", { on: 1 }, 0.1, "out"); c.prop(3.92, "tongue", { on: 0 }, 0.08, "in");
// the pen back in the knot, the paper torn square
tp = pen.carry(3.9, [PEN.x, PEN.y, PEN.z], 0.08, "inOut", { tip: 0, rot: PEN.rot });
A(3.98, "gsl", "release", { prop: "pen", to: [PEN.x, PEN.y, PEN.z], dur: 0.02 });
c.at(4.0, { do: "prop", id: "pen", set: { scale: 0.001 }, dur: 0.03, ease: "in", reason: "back in his bandana's knot (part of his costume)" });
A(4.0, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.1 }); c.arm(4.0, "gsl", "L", "rest", 0.15, "inOut");
sfx(3.98, "papercut", { gain: 0.35, reason: "the paper torn square: a dry tearing hiss" });
see(3.4, 4.0, ["gsl.face", "coupon"], "panel 3: he scribbles the coupon on his knee, tongue out");

// ---------------------------------------------------------------- 4 THE COUPON 4.1-4.6 (panel 4, hit-stop 1 at 4.2)
// up off the crate in one hop, the coupon up in both mittens at chest height, facing us, toward Viking
A(4.0, "gsl", "stand", { dur: 0.12 });
A(4.02, "gsl", "move", { to: G2, dur: 0.3, ease: "out", steps: 2 }); A(4.02, "gsl", "turn", { to: G2_YAW, dur: 0.2 });
// in front of his belly, square to the close-up's lens (az 30), both mittens on it (review A)
const SHOW = front(G2, 30, 0.5, 0, 0.36);
note.carry(4.04, SHOW, 0.12, "out", { tip: 0, rot: 210 });
c.arm(4.06, "gsl", "L", { prop: "coupon", grip: [-0.215, r3(CP_HOLD * 0.26 * CP_K), -0.01], palm: true }, 0.12, "out"); A(4.1, "gsl", "grip", { side: "L", shape: "hold", dur: 0.06 });
c.arm(V(4.8), "gsl", "L", "rest", 0.2, "inOut"); A(V(4.8), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
c.prop(4.04, "coupon", { scale: CP_K }, 0.12, "out");
A(4.08, "gsl", "expr", { expr: "happy", set: { curve: 1.0, open: 0.5 }, dur: 0.1 });
A(4.08, "gsl", "look", { to: [0.2, 0.05], dur: 0.08, blink: false });
c.hitStop(HS1);
see(4.15, V(4.6), ["gsl.face", "coupon"], "panel 4: FREE HUG held up, facing us, his huge grin");

// the Wizard steps in at the front left while the camera is on the crate (he is off its left edge), so the wide sees
// him snicker; done before Gunslinger hops off the crate toward that side
A(3.8, "wiz", "move", { to: W2, dur: 0.4, ease: "inOut", steps: 2 }); A(3.8, "wiz", "turn", { to: W2_YAW, dur: 0.35 });

// ---------------------------------------------------------------- 5 THEY SNICKER, VIKING READS 4.6-6.0 (panel 5)
// the Wizard snickers into his mitten, Reaper rolls his eyes, they glance at each other
c.arm(V(4.62), "wiz", "L", { o: [-0.22, 0.47, 0.32] }, 0.15, "out"); A(V(4.62), "wiz", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
A(V(4.62), "wiz", "expr", { expr: "happy", set: { curve: 0.8 }, dur: 0.12 }); A(V(4.62), "wiz", "face", { lid: 0.9, dur: 0.1 });
for (const t of [4.7, 4.85, 5.0]) A(V(t), "wiz", "squash", { amount: 0.03, dur: 0.07 });
A(V(4.62), "rea", "look", { to: [0.0, 0.7], dur: 0.25, blink: false }); A(V(4.62), "rea", "face", { lid: 0.3, dur: 0.2 });
A(V(4.95), "rea", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
A(V(4.95), "wiz", "face", { lid: 0.2, dur: 0.1 }); A(V(4.95), "wiz", "look", { to: [0.8, 0.0], dur: 0.12, blink: false });
// Gunslinger holds it out to Viking by its left edge; Viking takes its right edge in his right mitten (the presents
// stay on his left arm) and holds it up by his cheek, its front to us
const G_TO_V = 70;
A(V(4.82), "gsl", "turn", { to: G_TO_V, dur: 0.2 });
// in front of both (holding it between them side by side would put each hand inside the other's body)
const MID = [r3((G2[0] + V0[0]) / 2), 0.42, r3(Math.max(G2[1], V0[1]) + 0.36)];
note.carry(V(4.85), MID, 0.2, "inOut", { rot: 190 });
A(V(4.88), "vik", "grab", { prop: "pbox", hand: "L", keep: true, dur: 0, pose: null });
A(V(4.88), "vik", "grab", { prop: "bbox", hand: "L", keep: true, dur: 0, pose: null });
// the presents ride on his left arm, out of the coupon's way
c.arm(V(4.9), "vik", "L", { o: [0.12, 0.3, 0.38] }, 0.2, "inOut");
const vcp = grips.phone(c, "vik", { ...CP, scale: CP_K, x: MID[0], y: MID[1], z: MID[2], rot: 190 }, { side: "R", edge: "L", height: CP_HOLD });
let tv = vcp.takeFrom(V(4.94), MID, { reach: 0.14, settle: 0.12 });
note.handOff(r3(tv + 0.02), { back: 0.15 });
A(r3(tv + 0.04), "gsl", "turn", { to: 40, dur: 0.2 });
const READ = front(V0, V_FRONT, 0.5, -0.22, 0.55);
vcp.carry(r3(tv + 0.04), READ, 0.22, "out", { rot: 180 });
A(V(5.3), "vik", "look", { to: [-0.45, 0.0], dur: 0.12, blink: false });
A(V(5.3), "vik", "expr", { expr: "sad", set: { curve: 0.3, open: 0.15 }, dur: 0.2 });
A(V(5.35), "vik", "face", { tearL: 1, tearR: 1, dur: 0.5 });
c.say(V(5.45), "vik", "best... gift... ever!", 0.6, "excited", { voice: false, sub: "Best… gift… EVER!", pos: SUB_HIGH });
A(V(5.3), "wiz", "lean", { to: 8, dur: 0.3 }); A(V(5.3), "wiz", "expr", { expr: "worried", dur: 0.2 });
see(V(5.4), V(5.95), ["vik.face", "coupon"], "panel 5: Viking in tears over the coupon");

// ---------------------------------------------------------------- 6 THE HUG 6.0-7.0 (panel 6, hit-stop 2 at 6.1)
// Viking lets both presents drop onto the rug and bear-hugs him off the floor
// (let go "in the air" and knocked from where his arm had them: a plain let-go started the bake from the hold he
// had before he shifted them onto his left arm, 0.8 m off, and the aimed knock was ignored. The cut to panel 6 at
// 6.0 hides the frame between)
A(V(5.98), "vik", "release", { prop: "pbox", keep: "air", reason: "knocked off his arm at the cut (physics from 6.0)" });
A(V(5.98), "vik", "release", { prop: "bbox", keep: "air", reason: "knocked off his arm at the cut (physics from 6.0)" });
// by his left arm (where it had them: [0.63, 0.25, 0.04] and the black box on top), moved out of his fur, so the
// bake doesn't start them inside his body (they stuck on it for a second and missed their spots)
// (the purple one low, already falling, so its arc stays under his face from the low camera; the black one behind it,
// not on its top, so the purple one doesn't drag it along)
c.prop(V(5.97), "pbox", { x: 0.66, y: 0.15, z: 0.38 }, 0);
c.prop(V(5.97), "bbox", { x: 0.78, y: 0.45, z: 0.05 }, 0);
// the coupon too: it flutters out of his mitten onto the rug beside the presents (the hug is what it was for; held
// behind Gunslinger's back it would sit inside him)
// (at the cut, from 20 cm in front of where he read it: started inside his fur it was flung up behind the hug)
A(V(5.985), "vik", "release", { prop: "coupon", keep: "air", reason: "it leaves his mitten as he grabs Gunslinger (physics from the cut)" });
c.prop(V(5.99), "coupon", { x: READ[0], y: READ[1], z: r3(READ[2] + 0.2) }, 0);
c.knock(V(5.995), "coupon", { to: [-0.1, 0, 0.95], in: 0.7, spin: [2, 1, 0] });   // onto the open rug in front, beside the purple present
// the black box flies off the top and lands flat at Reaper's feet (aimed, so he can pick it up where it is)
c.knock(V(6.0), "bbox", { to: BB_LAND, in: 0.5, spin: [0, 0, 0] });
// the purple one tumbles forward off his arm onto the open rug in front of the hug, where the Wizard can see it (panel 7)
c.knock(V(6.0), "pbox", { to: PB_LAND, in: 0.3, spin: [0, -1.5, 0] });
c.at(V(6.8), { do: "physics", prop: "bbox", mode: "settle", reason: "at rest on the rug before Reaper takes it" });
c.at(V(6.9), { do: "physics", prop: "pbox", mode: "settle", reason: "at rest on the rug: nobody touches it again (Reaper's reach next to it must not knock it)" });
A(V(5.95), "vik", "turn", { to: VH_YAW, dur: 0.15 });
A(V(5.95), "gsl", "ride", { prop: "lift", off: HUG_OFF, yaw: HUG_YAW, dur: 0.15 });
c.prop(V(5.95), "lift", { y: LIFT }, 0.15, "out");   // up first, so the forearm comes in under him
sfx(V(5.97), "cloth", { gain: 0.5, reason: "the bear hug: fur and vest squeezed together" });
sfx(V(6.12), "ai-package/box-set-down", { gain: 0.45, reason: "the big purple present landing on the rug: a soft hollow thud" });
sfx(V(6.45), "ai-package/box-set-down", { gain: 0.3, reason: "the black box landing on the rug at Reaper's feet" });
c.hitStop(HS2);
// Viking's mittens on his back and side (in the lift's frame: Gunslinger stands at HUG_OFF in it)
const ONG = (p) => ({ prop: "lift", grip: (() => { const q = rotY(p, HUG_YAW); return [r3(HUG_OFF[0] + q[0]), r3(p[1]), r3(HUG_OFF[2] + q[2])]; })(), palm: true });
// his right arm round Gunslinger's back (the coupon still in that mitten, panel 6), his left fist up in joy: the
// left can't reach across his own body to him (short arms, side by side)
// side by side, both facing out (Gunslinger turned 20 degrees in): Viking scoops him up on his right forearm, the
// mitten under his seat, the way you carry a child on your hip (a short arm can't reach round a round body: the
// 8 Nov layouts had the mitten 16-24 cm inside him on his flank)
c.arm(V(6.0), "vik", "R", { o: [0.22, 0.34, 0.2] }, 0.26, "inOut"); c.arm(V(5.96), "vik", "L", { o: [0.3, 0.85, 0.15] }, 0.14, "out");
A(V(5.96), "vik", "grip", { side: "L", shape: "fist", dur: 0.1 });
c.arm(V(7.5), "vik", "L", { o: [-0.12, 0.3, 0.42] }, 0.35, "inOut");   // down onto his belly, happy (out at his side it swept into Reaper as he turns) A(V(7.5), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
// Gunslinger's left arm over Viking's shoulder, the right one out
// his left arm flies up as Viking grabs him ("yay!": clear of Viking while he rides in), then over Viking's shoulder
c.arm(V(5.9), "gsl", "L", { o: [0.08, 0.85, 0.05] }, 0.12, "out");
c.arm(V(6.12), "gsl", "L", { o: [0.12, 0.6, -0.05] }, 0.2, "inOut");
c.arm(V(5.98), "gsl", "R", { o: [0.15, 0.55, 0.28] }, 0.14, "out");
A(V(5.96), "vik", "expr", { expr: "happy", set: { curve: 0.9, open: 0.5 }, dur: 0.1 }); A(V(5.96), "vik", "face", { lid: 0.9, dur: 0.1 });
A(V(6.0), "gsl", "expr", { expr: "shocked", set: { curve: 0.4, open: 0.4 }, dur: 0.1 });
see(V(6.2), V(6.95), ["vik.face", "gsl.face", "pbox", "bbox"], "panel 6: the bear hug off the floor, both presents on the rug");

// ---------------------------------------------------------------- 7 THE BILL LANDS 7.0-8.8 (panel 7)
// the hug holds and turns slowly (Viking's happy sway), so by the wink his back is to us
A(V(7.0), "vik", "turn", { to: V_SPIN, dur: 1.6, ease: "inOut" });
c.prop(V(7.0), "lift", { rot: V_SPIN }, 1.6, "inOut");
A(V(7.0), "wiz", "lean", { to: 0, dur: 0.3 });
A(V(7.05), "wiz", "turn", { to: 50, dur: 0.4 });
A(V(7.2), "wiz", "look", { to: [0.5, -0.6], dur: 0.15, blink: false });
// for the wink he faces us at the bottom left (panel 8) and his eyes go up to Gunslinger over Viking's shoulder
// he hops in toward the hug to stare (1.05 m from Viking, 1.09 m from Gunslinger), so the wink lands on him
A(V(8.2), "wiz", "move", { to: W3, dur: 0.4, ease: "inOut", steps: 2 });
A(V(8.55), "wiz", "turn", { to: 10, dur: 0.3 }); A(V(8.6), "wiz", "look", { to: [0.6, 0.35], dur: 0.15, blink: false });
A(V(8.55), "wiz", "pitch", { to: -14, dur: 0.3 });   // head tipped back to stare up at him: his face clears his own brim
act.shock(c, V(7.25), "wiz", { open: 0.35, hold: 0.9 });
// Reaper steps in, crouches, takes his black box off the rug in both mittens and holds it safe at his chest, deadpan
A(V(7.0), "rea", "move", { to: R3, dur: 0.4, ease: "inOut", steps: 2 }); A(V(7.0), "rea", "turn", { to: R3_YAW, dur: 0.3 });
A(V(7.1), "rea", "look", { to: [0.0, -0.7], dur: 0.15, blink: false });
A(V(7.3), "rea", "crouch", { to: 0.3, dur: 0.3 });
const rbox2 = grips.box(c, "rea", { ...BB, x: BB_AT[0], y: 0, z: BB_AT[2], rot: R3_YAW + 180 }, { height: 0.9 });
let trb = rbox2.takeFrom(V(7.45), [BB_AT[0], 0, BB_AT[2]], { reach: 0.25, settle: 0.15 });
A(r3(trb), "rea", "crouch", { to: 0, dur: 0.35 });
// up in front of him first, then round with his turn through a middle point (a straight carry from his left front to
// his front cut through his own body)
const R3_MID = r3((R3_YAW + R3_OUT) / 2);
trb = rbox2.carry(r3(trb), front(R3, R3_YAW, 0.5, 0, 0.42), 0.3, "inOut", { rot: r3(R3_YAW + 180) });
A(r3(trb), "rea", "turn", { to: R3_OUT, dur: 0.4, ease: "inOut" });
rbox2.carry(r3(trb), front(R3, R3_MID, 0.5, 0, 0.42), 0.2, "in", { rot: r3(R3_MID + 180) });
rbox2.carry(r3(trb + 0.2), front(R3, R3_OUT, 0.5, 0, 0.42), 0.2, "out", { rot: r3(R3_OUT + 180) });
A(r3(trb + 0.4), "rea", "look", { to: [-0.4, 0.0], dur: 0.2, blink: false }); A(r3(trb + 0.4), "rea", "face", { lid: 0.5, dur: 0.2 });
see(V(7.4), V(8.7), ["wiz.face", "rea.face", "pbox"], "panel 7: the Wizard's jaw drops at his present on the rug, Reaper rescues his box");

// ---------------------------------------------------------------- 8 THE WINK 8.8-10.0 (panel 8)
// (the line at y 790: between his bandana and the Wizard's brim, off his mouth)
wink(c, { who: "gsl", t: V(8.8), until: END, line: "next year's on me!", sub: "Next year's on me!", look: [-0.4, -0.25], pos: 790,
  react: (t) => { for (const [dt, l] of [[0, 0.75], [0.07, 0.3], [0.13, 0.8], [0.2, 0.3], [0.3, 0.85], [0.38, 0.35]]) A(r3(t + dt), "wiz", "face", { lidL: l, dur: 0.04 }); } });
see(V(8.95), END, ["gsl.face", "moth", "wiz.face"], "panel 8: the wink at the Wizard over Viking's shoulder");

act.blinksAt(c, "wiz", [1.6, 3.4]); act.blinksAt(c, "rea", [1.35, 3.6, 5.6]); act.blinksAt(c, "vik", [1.45, 3.2]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// from above their heads, so the back row's faces clear the front row's hats (panel 1: Gunslinger's face over the
// Wizard's brim)
const WIDE0 = { pos: [0.2, 2.3, 2.9], look: [0.1, 0.5, -0.4], fov: 70 };    // P1: the Wizard to Reaper, Gunslinger clear of the hat
const WIDE = { pos: [0.05, 2.6, 3.6], look: [0.05, 0.5, -0.4], fov: 62 };   // P5a: the Wizard and Reaper at its edges
const PATSHOT = fw([r3(G0[0] + 0.27), 0.85, G0[1]], { w: 1.3, az: -10, el: 4, fov: 34 });
const P3 = fw([r3(CRATE.x - 0.05), 0.45, r3(CRATE.z + 0.05)], { w: 1.2, az: 10, el: 12, fov: 30 });
const P4 = fw([G2[0], 0.45, G2[1]], { w: 0.9, az: 30, el: 3, fov: 30 });
const P5 = fw([r3(V0[0] - 0.08), 0.68, V0[1]], { w: 1.1, az: 10, el: 6, fov: 30 });
const P6 = fw([r3((HUG_AT[0] + VH[0]) / 2), 0.55, r3((HUG_AT[1] + VH[1]) / 2)], { w: 2.0, az: 25, el: 2, fov: 32 });   // low: his feet dangle
const P7 = { pos: [-0.05, 1.1, 4.4], look: [-0.05, 0.95, -0.4], fov: 62 };
const P8 = fw([GEND[0], 0.45, GEND[1]], { w: 1.4, az: -25, el: 26, fov: 30 });
const beats = c.beats([
  ["P1 pay up", 0, WIDE0, "hook"],
  ["P2 the pocket pat", PAT.from, PATSHOT],
  ["P3 the coupon is made", 2.8, P3],
  ["P4 FREE HUG", 4.1, P4, "reveal"],
  ["P5a they snicker", V(4.6), WIDE, "reaction"],
  ["P5b best gift ever", V(5.2), P5],
  ["P6 the hug", V(6.0), P6, "payoff"],
  ["P7 the bill lands", V(7.0), P7],
  ["P8 the wink", V(8.8), P8],
], END);

write(import.meta.url, {
  id: "your-birthday",
  title: "That one friend who never has money… at your birthday",
  idea: "Never has money, episode 4: Viking's birthday; the Wizard and Reaper hand over presents, Gunslinger has nothing; the pocket pat finds a moth; he scribbles a FREE HUG coupon on his knee; Viking cries with joy, drops the expensive presents and bear-hugs him off the floor; next year's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  // push 1: the pocket pat and the dodge chain into one 2.7 s key segment, and the default push ran Gunslinger's
  // drawings up to 0.6 s ahead of the clock (the wallet and the moth stay on it): held drawings on 2s, no snap
  animeTiming: { push: 1, slow: 5 },
  cover: 2.6,
  set: { type: "plain", color: "#e9d2a8", floor: "#c9955a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/birthday-living-room.png", z: -2.3, center: [0.3, 1.7], height: 6.4, depth: false, motion: false },
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, life: "auto" },
  music: { style: "bounce", key: 0, bpm: 120, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["wiz", "gsl", "vik", "pbox"], hint: 1.1, what: "Viking's birthday: two presents for him, and Gunslinger empty-handed" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.05, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", with: "crate", from: 3.3, to: 4.1, reason: "he sits on the crate" },
    { who: "gsl", with: "pen", from: 3.3, to: 3.95, checks: ["thin-prop-hidden"], reason: "writing on his knee: the pen's tip is on the paper under his fist from this camera, its cap shows above it" },
    { who: "rea", with: "pbox", from: 0.55, to: 1.25, reason: "his robe brushes the purple present as he leans in to set the black box on it and steps back" },
    { who: "gsl", with: "coupon", from: 6.0, to: 6.35, reason: "the coupon flutters past his arm as it leaves Viking's mitten" },
    { who: "vik", from: 6.0, to: 6.45, checks: ["rig-jump", "hand-turn"], reason: "the scoop into the hug after the hit-stop: his forearm swings in under Gunslinger in a few drawings" },
    { who: "rea", with: "rug", from: 7.6, to: 8.1, reason: "his fingertips brush the rug pile as he scoops his black box up off it" },
    { who: "gsl", from: 1.5, to: 1.78, checks: ["rig-jump"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s (episode 1's block, as episode 2)" },
    { who: "vik", with: "gsl", from: 5.95, to: 10, reason: "the hug: Viking carries him on his right forearm, side by side, cheeks close" },
    { who: "gsl", with: "vik", from: 5.95, to: 10, reason: "the hug: his arm over Viking's shoulder" },
    { who: "gsl", with: "hatG", from: 0, to: 10, reason: "the party cone sits on his cowboy hat's crown (worn): its rim presses into the felt" },
    { who: "vik", with: "rosette", from: 0.1, to: 0.4, reason: "his mitten brushes his own rosette as he takes the purple present" },
    { who: "vik", with: "rosette", from: 7.7, to: 8.3, reason: "his left mitten brushes the rosette on its way down from the fist in the air to his belly" },
  ],
  notes: "Generated by storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs. Panels: PANELS.md.",
});
