// MY FRIEND GROUP TRYING TO GET ONE CAT OUT FROM UNDER THE BED ("friends try to" episode 3, 4 Nov 2026), from the
// clip template.
//   node storyboards/series/friends-try-to/03-cat-under-the-bed/make-cat-under-the-bed.mjs -> cat-under-the-bed.json
// Brief: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/03-cat-under-the-bed-ENGINE-PROMPT.md
// Jonny's eight panels: storyboards/03-cat-under-the-bed/ there (PANELS.md here).
//
// THE BRIEF (exactly 10 s, Wizard, Viking, Phoenix, Reaper and the cat)
//   Joke:        the cat is under the bed and has to go to the vet. The lure spell summons every sock instead, Viking
//                lifts the bed and the cat walks along under it, the torch gets a hiss; Reaper sits down beside an
//                empty box and the cat walks straight into it.
//   Wants:       everyone wants the cat out.
//   Consequence: they cheer silently; Viking leans in, "aww", sneezes, and the cat shoots back under the bed.
//   Ending:      the glare at Viking, and two yellow eyes glaring from under the bed too.
//   Callback:    frame 0 is two glowing eyes under the bed; the last frame is two glowing eyes under the bed again.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { ending } from "../ending.mjs";
import { CAT } from "../../../../engine/page/props-bedroom.js";

const OPENER = { who: "wiz", line: "yip!", words: false };
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const T0 = 7.0, END = 9.8;   // + two 3-frame hit-stops (the hiss, the box) = exactly 10.0 s

// ---------------------------------------------------------------- places (x right, z toward the camera)
// A single bed runs along x (its head at -x, its foot at +x), its front long side to the camera. Under it a dark gap;
// the cat lives in the strip between the black void and the hanging duvet (local z 0.33..0.5).
const BX = -0.95, BZ = -0.58, BL = 1.6, BW = 0.95, GAP = 0.33;
const FOOT = r3(BX + BL / 2), BACKZ = r3(BZ - BW / 2), FRONTZ = r3(BZ + BW / 2);
const CATZ = r3(BZ + 0.41);   // the cat's lane under the bed, in front of the void
// P1-P4 (camera high in front, the bed on the left): two rows, so every face clears the heads in front of it.
// The Wizard crouches at the bed's front by its foot, Phoenix lies low front right with the torch, Viking behind
// them, Reaper back right by the door and the carrier
const WIZ0 = [0.3, 0.5], PHX0 = [1.2, 1.25], VIK0 = [0.75, -1.35], REA0 = [1.45, -2.0];
const WIZ_UP = [1.0, 0.35];   // where he steps back to after the spell: right, between Viking and Phoenix, so his hat clears Viking at the lift and the cat's walk
const VIK_LIFT = [r3(FOOT + 0.42), r3(BZ - 0.15)];   // at the foot end, facing -x
// P5-P8 (camera low and close): three peek over the bed from behind it, Reaper sits in front beside the box.
// They get there in the scramble after the hiss (round the foot end; Viking first, he is already there)
// a body-width and more apart (the Wizard's staff sticks out to his left, Phoenix's wings): Phoenix ends past the foot end
const BEHIND = r3(BACKZ - 0.5);
const VIK_B = [-1.55, BEHIND], WIZ_B = [-0.55, BEHIND], PHX_B = [0.5, BEHIND];   // Viking clear of the headboard
// the empty box is already standing in the room (front left); Reaper sits on the floor beside it
const BOX = [-1.05, 0.62], REA_SIT = [-0.05, 1.0];   // near the camera, so his hood sits below the back row's eyes
const CAT0 = [-0.7, CATZ], CAT_SHADE = [-1.15, CATZ];

const cast = [
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ0, face: -60, expr: "kind", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "duo/viking", at: VIK0, face: -25, expr: "focused", follow: 0.3, seed: 4.1 },
  { id: "phx", character: "duo/phoenix", at: PHX0, face: -25, expr: "kind", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, face: -25, expr: "kind", follow: 0.25, seed: 3.3 },
];
const PHONE = { id: "phone", kind: "phone", ...grips.placeFor("phone", [PHX0[0] - 0.24, 0.42, PHX0[1] + 0.28], -25), tip: -20, scale: 1.6, case: "#e07a5f" };
const SOCK_COLS = [["#e85d75", "#ffffff"], ["#5aa9e6", "#ffe066"], ["#9b5de5", "#f1f1f1"], ["#f4a261", "#2a9d8f"], ["#ffffff", "#e63946"], ["#43aa8b", "#f9c74f"], ["#f15bb5", "#fee440"], ["#adb5bd", "#495057"]];
// where the socks lie at frame 0 (floor and bed) and where they land after the heap slides off his hat
const SOCKS0 = [[0.55, 0.0, 0.95], [-0.35, 0.0, 1.0], [1.75, 0.0, 0.2], [-1.5, 0.0, 0.85], [-1.2, 0.64, -0.75], [-0.5, 0.64, -0.4], [1.9, 0.0, -0.6], [0.95, 0.0, 1.1]];
const SOCKS1 = [[-0.1, 0.85], [0.7, 0.75], [0.55, 0.15], [-0.25, 1.1], [0.15, 1.05], [0.85, 0.35], [0.45, 1.15], [-0.4, 0.75]];
const props = [
  { id: "bed", kind: "plaidbed", x: BX, z: BZ, len: BL, wid: BW, gap: GAP },
  { id: "cat", kind: "cat", x: CAT0[0], z: CAT0[1], rot: 90, lid: 0.35, char: 1, glow: 1, drop: 0.55 },
  { id: "treat", kind: "treat", x: -0.38, y: 0.05, z: 0.1, rot: 90 },
  { id: "beam", kind: "torchbeam", x: r3(PHX0[0] - 0.28), y: 0.34, z: r3(PHX0[1] + 0.18), rot: -131, tip: 3, len: 2.0, r: 0.5 },   // a wide, readable cone
  { id: "carrier", kind: "petcarrier", x: 2.1, z: -1.9, rot: -40, open: 75 },
  { id: "cattree", kind: "cattree", x: -2.35, z: -2.2, scale: 0.9 },
  { id: "mouse", kind: "toymouse", x: -0.45, z: 1.15, rot: 30 },
  { id: "box", kind: "cardbox", x: BOX[0], z: BOX[1], w: 0.6, d: 0.62, h: 0.22, rot: 8, empty: true, seed: 5 },   // big enough for the whole cat, low enough that its head shows
  { id: "floorseat", kind: "shadowpool", x: REA_SIT[0], y: -0.09, z: REA_SIT[1], w: 2.4, d: 2.0, scale: 0.286 },
  ...SOCKS0.map(([x, y, z], i) => ({ id: `sock${i}`, kind: "sock", x, y, z, scale: 1.3, rot: (i * 47) % 180, tip: y > 0 ? 0 : 0, color: SOCK_COLS[i][0], stripe: SOCK_COLS[i][1] })),
  // the sock that stays on his hat (worn: in his body's frame, over the hat's cone)
  { id: "hatsock", kind: "sock", wear: "wiz", x: 0.05, y: 1.38, z: 0.08, rot: 20, tilt: -60, scale: 0.001, color: "#ffffff", stripe: "#e63946" },
  PHONE,
];

const SUB = 470, SUB_LOW = 380, SUBS = { size: 62, kinetic: false };   // the low shot: above the Wizard's hat

// the bed's root pose for a lift of its foot end by theta degrees, its head end staying on the floor (the root turns
// about its middle): x and y keep the head-end bottom edge where it is
function bedAt(t, theta, dur, ease = "inOut") {
  const th = (theta * Math.PI) / 180, h = BL / 2;
  c.prop(t, "bed", { tilt: r3(-theta), x: r3(BX + h * (Math.cos(th) - 1)), y: r3(h * Math.sin(th)) }, dur, ease);
}

// ---------------------------------------------------------------- 1 ALREADY GOING WRONG 0-1.5 (P1)
// the Wizard lies low at the bed's foot reaching under it with a treat; a paw swipes it in (his yelp)
act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
A(0, "wiz", "crouch", { to: 1, dur: 0 }); A(0, "wiz", "lean", { to: 20, dur: 0 });
c.arm(0, "wiz", "R", { prop: "treat", grip: [0, 0.03, 0], point: "pinch" }, 0);
A(0, "wiz", "grip", { side: "R", shape: "pinch", dur: 0 });
A(0, "wiz", "look", { to: [-0.6, -0.4], dur: 0, blink: false });
// the swipe: the cat lunges out of the dark a little and back, the treat zips in under the duvet
c.prop(0, "cat", { x: r3(CAT0[0] + 0.12) }, 0.06, "out"); c.prop(0.1, "cat", { x: CAT0[0] }, 0.2, "inOut");
c.prop(0.03, "treat", { x: r3(CAT0[0] + 0.05), z: CATZ, y: 0.02 }, 0.08, "in");
c.prop(0.11, "treat", { scale: 0.001 }, 0.02);
A(0.05, "wiz", "grip", { side: "R", shape: "open", dur: 0.06 });
c.arm(0.08, "wiz", "R", { o: [0.2, 0.45, 0.25] }, 0.15, "out");
A(0.06, "wiz", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.3 }, dur: 0.08 });
A(0.06, "wiz", "lean", { to: 6, dur: 0.15 });
c.arm(0.5, "wiz", "R", "rest", 0.35, "inOut"); A(0.55, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(0.7, "wiz", "expr", { expr: "focused", dur: 0.25 });
// Phoenix lies beside him with the phone torch on the gap
A(0, "phx", "crouch", { to: 1, dur: 0 }); A(0, "phx", "lean", { to: 14, dur: 0 });
const ph = grips.phone(c, "phx", PHONE, { side: "R" });
ph.secure(0, 0.01);
c.prop(0, "beam", { on: 0.55 }, 0.01);
A(0, "phx", "look", { to: [-0.7, -0.35], dur: 0, blink: false });
A(0.1, "phx", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.1 });
A(0.6, "phx", "expr", { expr: "eager", dur: 0.25 });
// Viking cracks his knuckles behind them
A(0, "vik", "look", { to: [-0.55, -0.3], dur: 0, blink: false });
for (const [t, k] of [[0.15, 0], [0.45, 1], [0.75, 0], [1.05, 1]]) {
  c.arm(t, "vik", "R", { o: [-0.02 + 0.03 * k, 0.48, 0.3] }, 0.15, "inOut"); c.arm(t, "vik", "L", { o: [-0.02 + 0.03 * (1 - k), 0.48, 0.3] }, 0.15, "inOut");
}
A(0.15, "vik", "grip", { side: "both", shape: "fist", dur: 0.1 });
A(0.2, "vik", "expr", { expr: "cocky", dur: 0.2 });
for (const t of [0.3, 0.9]) sfx(t, "kenney/metal-click", { gain: 0.5, reason: "Viking's knuckles cracking" });
c.arm(1.3, "vik", "R", "rest", 0.3, "inOut"); c.arm(1.3, "vik", "L", "rest", 0.3, "inOut"); A(1.3, "vik", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
// Reaper leans by the door, arms folded, next to the open carrier
c.arm(0, "rea", "R", { o: [-0.12, 0.44, 0.27] }, 0); c.arm(0, "rea", "L", { o: [-0.12, 0.4, 0.3] }, 0);
A(0, "rea", "grip", { side: "both", shape: "relaxed", dur: 0 });
A(0, "rea", "look", { to: [-0.6, -0.25], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.48, dur: 0 });
see(0, 1.5, ["wiz.face", "phx.face", "vik.face", "rea.face", "cat", "carrier"], "P1: the paw takes the treat, two eyes under the bed, everyone round the foot");
act.blinksAt(c, "rea", [2.4]); act.blinksAt(c, "phx", [1.7]); act.blinksAt(c, "wiz", [1.55, 4.1, 6.2, 9.45]); act.blinksAt(c, "vik", [1.3, 3.05, 6.25, 9.5]);

// ---------------------------------------------------------------- 2 THE SPELL 1.5-3.3 (P2): every sock in the room
const SPELL = 1.6;
A(1.4, "wiz", "crouch", { to: 0, dur: 0.3 }); A(1.4, "wiz", "lean", { to: 0, dur: 0.3 });
A(1.45, "wiz", "turn", { to: 25, dur: 0.3 });   // to us: his staff side then points away from Phoenix
A(1.5, "wiz", "look", { to: [0, 0.2], dur: 0.12, blink: false });
A(SPELL, "wiz", "talk", { line: "pspsps, cats love me", tone: "calm", dur: 0.7, voice: false });
c.cap(1.9, 2.8, "Cats love me.", SUB, false, SUBS);
A(SPELL, "wiz", "expr", { expr: "cocky", dur: 0.25 }); A(SPELL, "wiz", "face", { lid: 0.3, dur: 0.25 });
A(1.85, "wiz", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(1.9, "wiz", "L", { o: [0.2, 0.95, 0.15] }, 0.3, "out"); A(1.9, "wiz", "tilt", { to: [14, 6], dur: 0.3 });
A(2.0, "wiz", "charge", { to: 1, dur: 0.3 });
sfx(2.0, "charge", { gain: 0.3, dur: 0.9, reason: "the Wizard's lure spell" });
// the socks fly up off the floor and the bed into a heap on his hat, then slide off round him
const HAT = [WIZ0[0], 1.5, WIZ0[1]];   // he is still at WIZ0 (he stands up where he lay)
SOCKS0.forEach((_, i) => {
  const t0 = r3(2.15 + i * 0.04), a = (i / SOCKS0.length) * Math.PI * 2;
  c.prop(t0, `sock${i}`, { x: r3(HAT[0] + 0.12 * Math.cos(a)), y: r3(HAT[1] + 0.05 * (i % 3)), z: r3(HAT[2] + 0.12 * Math.sin(a)), rot: r3(200 + i * 40), tip: r3(-40 + i * 13) }, 0.3, "out");
  const [x1, z1] = SOCKS1[i];
  c.prop(r3(3.0 + i * 0.03), `sock${i}`, { x: x1, y: 0.003, z: z1, tip: 0, rot: r3(i * 61) }, 0.3, "in");
});
for (const t of [2.45, 2.55, 2.66]) sfx(t, "cloth", { gain: 0.35, reason: "soft sock flops landing on his hat" });
c.prop(2.62, "hatsock", { scale: 1.5 }, 0.05, "out");   // big enough to still read in the low shot
sfx(3.15, "cloth", { gain: 0.3, reason: "the heap of socks slides off onto the floor" });
A(2.5, "wiz", "squash", { amount: 0.08, dur: 0.2 });
A(2.6, "wiz", "charge", { to: 0, dur: 0.25 });
c.arm(2.8, "wiz", "L", "rest", 0.35, "inOut"); A(2.8, "wiz", "tilt", { to: null, dur: 0.35 });
A(2.7, "wiz", "expr", { expr: "shocked", set: { open: 0.15 }, dur: 0.12 });
A(2.7, "wiz", "look", { to: [0.1, 0.5], dur: 0.12, blink: false });
// the cat's eyes don't move. Viking snorts, Reaper sighs, Phoenix stares
A(2.6, "vik", "talk", { line: "pfft", tone: "excited", dur: 0.25, voice: false }); A(2.6, "vik", "expr", { expr: "smug", dur: 0.2 });
act.emote(c, 2.9, "rea", "sigh", { dur: 0.6, dx: -0.45 });
A(2.3, "phx", "look", { to: [-0.3, 0.45], dur: 0.15, blink: false });
see(2.3, 3.2, ["wiz.face", "sock0", "cat"], "P2: every sock in the room lands on the Wizard; the cat hasn't moved");

// ---------------------------------------------------------------- 3 LIFT 3.3-4.5 (P3): the cat walks along under it
A(3.2, "vik", "look", { to: [-0.8, -0.1], dur: 0.12, blink: false });
A(3.3, "vik", "move", { to: VIK_LIFT, dur: 0.3, ease: "inOut", steps: 2 }); A(3.3, "vik", "turn", { to: -90, dur: 0.25 });
// the Wizard steps back out of his way
A(3.2, "wiz", "look", { to: [0.4, 0.1], dur: 0.12, blink: false });
A(3.3, "wiz", "move", { to: WIZ_UP, dur: 0.45, ease: "inOut", steps: 3 }); A(3.3, "wiz", "turn", { to: 0, dur: 0.3 });   // to us: his staff side points right, clear of Phoenix
// palms under the foot end's frame (bed frame: x along the bed, the foot at +BL/2)
const FOOTGRIP = (s) => ({ prop: "bed", grip: [r3(BL / 2 + 0.02), r3(GAP + 0.02), s === "R" ? -0.22 : 0.22], palm: true });
c.arm(3.62, "vik", "R", FOOTGRIP("R"), 0.12, "out"); c.arm(3.62, "vik", "L", FOOTGRIP("L"), 0.12, "out");
A(3.64, "vik", "grip", { side: "both", shape: "flat", dur: 0.08 });
act.windUp(c, 3.66, "vik", { amount: 0.12, dur: 0.1 });
A(3.7, "vik", "expr", { expr: "angry", set: { open: 0.35, curve: -0.3 }, dur: 0.12 });
A(3.74, "vik", "talk", { line: "hnnngh", tone: "excited", dur: 0.3, voice: false });
const LIFT = 3.78;
bedAt(LIFT, 26, 0.3, "out");
sfx(LIFT, "door-creak", { gain: 0.5, reason: "the bed frame creaks as Viking heaves the foot end up" });
c.arm(LIFT, "vik", "R", { ...FOOTGRIP("R"), }, 0.3, "out"); c.arm(LIFT, "vik", "L", { ...FOOTGRIP("L") }, 0.3, "out");
// the light finds the cat; it gets up and walks along under the bed into the shade at the head end
c.prop(r3(LIFT + 0.1), "cat", { [CAT.dark]: 0.1, [CAT.glow]: 0.2, [CAT.tuck]: 0 }, 0.2);
c.prop(r3(LIFT + 0.3), "cat", { [CAT.walk]: 1 }, 0.05);
c.prop(r3(LIFT + 0.3), "cat", { x: CAT_SHADE[0], rot: -90 }, 0.5, "inOut");
for (const t of [4.2, 4.35]) sfx(t, "kenney/footstep-carpet", { gain: 0.12, reason: "the cat's paw pads (a soft carpet step, quiet)" });
c.prop(4.6, "cat", { [CAT.walk]: 0, [CAT.tuck]: 0.55 }, 0.15);
c.prop(4.45, "cat", { [CAT.dark]: 1, [CAT.glow]: 1 }, 0.2);
A(4.1, "vik", "look", { to: [-0.7, -0.4], dur: 0.12, blink: false });
A(4.15, "vik", "expr", { expr: "shocked", set: { open: 0.25 }, dur: 0.1 });
// he lets it down gently
bedAt(4.2, 0, 0.3, "inOut");
c.arm(4.2, "vik", "R", FOOTGRIP("R"), 0.3, "inOut"); c.arm(4.2, "vik", "L", FOOTGRIP("L"), 0.3, "inOut");
sfx(4.5, "thud", { gain: 0.4, reason: "the bed's feet back on the floor" });
sfx(4.5, "hit-wood", { gain: 0.3, reason: "the wooden bed frame knocks on the floor (the click on top of the thud, for phone speakers)" });
A(4.5, "vik", "grip", { side: "both", shape: "open", dur: 0.1 });
c.arm(4.52, "vik", "R", "rest", 0.3, "inOut"); c.arm(4.52, "vik", "L", "rest", 0.3, "inOut");
A(3.9, "wiz", "look", { to: [-0.6, -0.4], dur: 0.12, blink: false });
A(3.9, "phx", "look", { to: [-0.6, -0.3], dur: 0.12, blink: false });
A(4.0, "rea", "look", { to: [-0.7, -0.35], dur: 0.15, blink: false });
see(3.9, 4.45, ["bed", "cat", "vik.face"], "P3: Viking lifts the bed, the cat strolls along under it to stay in its shade");

// ---------------------------------------------------------------- 4 TORCH AND HISS 4.5-5.5 (P4)
// Phoenix clicks the torch up full into the gap: two big eyes and a hiss (hit-stop), everyone scrambles back
c.prop(4.5, "beam", { on: 1, rot: -121, len: 2.6 }, 0.08);
sfx(4.5, "kenney/metal-click", { gain: 0.35, reason: "the phone torch clicks to full" });
const HISS = 4.7;
c.prop(HISS, "cat", { [CAT.hiss]: 1, [CAT.lid]: 0, [CAT.dark]: 0.15 }, 0.06, "out");   // lit full in the torch beam
sfx(HISS, "hiss", { gain: 0.6, reason: "the cat's hiss in the torch beam: a short bright hiss of air (no cat voice in the whitelist)" });
c.hitStop(HISS, 3);
c.prop(5.0, "cat", { [CAT.hiss]: 0, [CAT.lid]: 0.35, [CAT.dark]: 1 }, 0.3);
c.prop(4.78, "beam", { on: 0 }, 0.15);
for (const who of ["wiz", "phx", "vik"]) act.shock(c, r3(HISS + (who === "vik" ? 0.04 : 0.02)), who, { open: 0.45, eye: 1.35, hold: 0.3 });
A(r3(HISS + 0.05), "rea", "face", { lid: 0.2, dur: 0.1 });
// the scramble: they bolt round the bed's foot end and hide behind it (where the cat can't see them, they think).
// Viking first (he is there), then the Wizard, then Phoenix; nobody passes anybody
const CORNER = [r3(FOOT + 0.45), r3(BACKZ - 0.45)];   // a body-width clear of the bed's foot end and back
A(4.72, "vik", "look", { to: [-0.3, 0.3], dur: 0.1, blink: false });
A(4.75, "vik", "turn", { to: -170, dur: 0.15 });
A(4.78, "vik", "run", { pts: [[0, ...VIK_LIFT], [0.24, ...CORNER], [0.5, -0.9, r3(BEHIND - 0.02)], [0.72, ...VIK_B]], rate: [[0, 6], [0.5, 6], [0.72, 3]], stride: 2 });
A(5.0, "vik", "turn", { to: -90, dur: 0.12 });
A(5.45, "vik", "turn", { to: 15, dur: 0.25 });
A(4.8, "wiz", "look", { to: [0.4, 0.2], dur: 0.1, blink: false });
A(4.9, "wiz", "turn", { to: -150, dur: 0.15 });
// he runs with the staff held up, clear of the bed
c.arm(4.72, "wiz", "L", { o: [0.2, 0.95, 0.15] }, 0.25, "out");   // the spell's raised-staff pose
A(4.95, "wiz", "run", { pts: [[0, ...WIZ_UP], [0.26, 0.55, -0.3], [0.44, ...CORNER], [0.8, ...WIZ_B]], rate: [[0, 6], [0.6, 6], [0.8, 3]], stride: 2 });
A(5.4, "wiz", "turn", { to: -90, dur: 0.12 });
A(5.78, "wiz", "turn", { to: 45, dur: 0.25 });   // his staff side then points back, away from Phoenix and the bed
c.arm(6.05, "wiz", "L", "rest", 0.35, "inOut");
A(4.75, "phx", "crouch", { to: 0, dur: 0.15 }); A(4.75, "phx", "lean", { to: 0, dur: 0.15 });
A(4.85, "phx", "look", { to: [-0.3, 0.3], dur: 0.1, blink: false });
A(4.92, "phx", "turn", { to: -165, dur: 0.15 });
A(5.02, "phx", "run", { pts: [[0, ...PHX0], [0.5, 0.9, -0.5], [0.88, ...PHX_B]], rate: [[0, 6], [0.6, 6], [0.88, 3]], stride: 2 });
A(5.85, "phx", "turn", { to: -10, dur: 0.3 });
// the phone stays in front of him on his right the whole way, and swings round in front as he turns to us
ph.carry(4.92, [r3(PHX0[0] - 0.34), 0.48, r3(PHX0[1] - 0.13)], 0.075, "linear", { rot: 85, tip: -10 });   // round his right side as he turns
ph.carry(4.995, [r3(PHX0[0] + 0.01), 0.48, r3(PHX0[1] - 0.44)], 0.075, "out", { rot: 15, tip: -10 });
ph.carry(5.07, [0.91, 0.5, -0.94], 0.45, "linear", { rot: 15, tip: -10 });
ph.carry(5.52, [r3(PHX_B[0] + 0.01), 0.5, r3(PHX_B[1] - 0.44)], 0.38, "linear", { rot: 15, tip: -10 });
ph.carry(5.9, [r3(PHX_B[0] - 0.35), 0.48, r3(PHX_B[1] - 0.12)], 0.12, "linear", { rot: 90, tip: -10 });
ph.carry(6.02, [r3(PHX_B[0] - 0.16), 0.48, r3(PHX_B[1] + 0.33)], 0.13, "out", { rot: 170, tip: -10 });
sfx(5.02, "ai/step-wood", { gain: 0.3, reason: "the scramble round the bed on the wooden floor" });
// the blame from behind the bed (overlapping): "You scared it!" / "YOUR socks!"
A(5.1, "wiz", "talk", { line: "you scared it!", tone: "excited", dur: 0.4, voice: false });
c.cap(5.1, 5.48, "You scared it!", SUB, false, SUBS);
A(5.5, "vik", "look", { to: [0.7, 0.05], dur: 0.1, blink: false });
act.mood(c, 5.52, "vik", "angry", { hold: 0.35 });
c.arm(5.55, "vik", "L", { o: [0.12, 0.7, 0.45] }, 0.12, "out");   // up and over the bed, short of the Wizard A(5.57, "vik", "grip", { side: "L", shape: "point", dur: 0.1 });
A(5.52, "vik", "talk", { line: "YOUR socks!", tone: "excited", dur: 0.4, voice: false });
c.cap(5.5, 5.98, "YOUR socks!", SUB_LOW, false, SUBS);
c.arm(5.95, "vik", "L", "rest", 0.3, "inOut"); A(5.95, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(5.7, "wiz", "look", { to: [-0.7, 0.05], dur: 0.1, blink: false });
act.mood(c, 5.72, "wiz", "annoyed", { hold: 0.3 });
see(4.6, 4.95, ["cat", "phx.face"], "P4: the torch finds two big eyes and a hiss");
see(5.55, 5.95, ["vik.face", "wiz.face"], "P4: Viking blames the Wizard's socks from behind the bed");

// ---------------------------------------------------------------- 5 THE CALM FIX 5.5-7.0 (P5): Reaper and the box
// Reaper walks in, sits on the floor beside the empty box, folds his arms, does nothing
c.arm(4.85, "rea", "R", "rest", 0.3, "inOut"); c.arm(4.85, "rea", "L", "rest", 0.3, "inOut");
A(4.88, "rea", "look", { to: [-0.2, -0.1], dur: 0.12, blink: false });
A(4.95, "rea", "turn", { to: 5, dur: 0.2 });
A(5.0, "rea", "move", { to: [1.75, 0.45], dur: 0.5, ease: "in", steps: 4 });   // down the right, behind Phoenix's dash
A(5.37, "rea", "look", { to: [-0.6, -0.2], dur: 0.12, blink: false });
A(5.45, "rea", "turn", { to: -85, dur: 0.15 });
A(5.55, "rea", "move", { to: [r3(REA_SIT[0] + 0.2), REA_SIT[1]], dur: 0.5, ease: "out", steps: 5 });
A(6.06, "rea", "sit", { seat: "floorseat", dur: 0.3 });
A(5.98, "rea", "turn", { to: 0, dur: 0.2 });
c.arm(6.38, "rea", "R", { o: [-0.12, 0.44, 0.27] }, 0.25, "inOut"); c.arm(6.38, "rea", "L", { o: [-0.12, 0.4, 0.3] }, 0.25, "inOut");
A(6.3, "rea", "look", { to: [0, 0.05], dur: 0.15, blink: false });
A(6.32, "rea", "expr", { expr: "deadpan", dur: 0.2 }); A(6.32, "rea", "face", { lid: 0.5, dur: 0.2 });
// the cat walks out, looks round, steps into the box (hit-stop) and settles: "mrrp"
c.prop(6.0, "cat", { [CAT.dark]: 0, [CAT.glow]: 0, [CAT.tuck]: 0, rot: 20 }, 0.2);
c.prop(6.05, "cat", { [CAT.walk]: 1 }, 0.05);
c.prop(6.05, "cat", { x: r3(BOX[0] + 0.05), z: r3(BOX[1] - 0.34) }, 0.4, "inOut");
for (const t of [6.15, 6.3, 6.45]) sfx(t, "kenney/footstep-carpet", { gain: 0.12, reason: "the cat's paw pads on the rug (a soft carpet step, quiet)" });
const INBOX = 6.6;
c.prop(6.45, "cat", { x: BOX[0], z: r3(BOX[1] - 0.07), y: 0.16, rot: 0 }, 0.15, "out");
c.prop(6.47, "cat", { [CAT.walk]: 0 }, 0.05);
c.prop(r3(INBOX - 0.02), "cat", { y: 0.012, [CAT.sit]: 1, [CAT.tuck]: 1 }, 0.12, "in");
sfx(INBOX, "cardboard", { gain: 0.5, reason: "the cat settles into the cardboard box" });
c.hitStop(INBOX, 3);
c.prop(r3(INBOX + 0.08), "cat", { [CAT.happy]: 1, [CAT.lid]: 0 }, 0.15);
for (const [who, d] of [["wiz", 0], ["vik", 0.05], ["phx", 0.1]]) act.shock(c, r3(INBOX + 0.04 + d * 0.5), who, { open: 0.5, eye: 1.3, hold: 0.3 });
for (const who of ["wiz", "vik", "phx"]) A(6.1, who, "look", { to: [-0.2, -0.45], dur: 0.15, blink: false });
see(6.1, 6.6, ["cat", "box", "rea.face"], "P5: the cat walks out past Reaper and into the box");
see(6.7, 6.98, ["cat", "wiz.face", "vik.face", "phx.face"], "P5: jaws drop");

// ---------------------------------------------------------------- 6-8 THE SHARED ENDING (P6-P8)
const AT = { wiz: WIZ_B, vik: VIK_B, phx: PHX_B, rea: REA_SIT };
const E = ending(c, {
  T0, at: AT,
  arms: { wiz: ["R"], vik: ["R", "L"], phx: ["L"], rea: [] },   // Reaper keeps his arms folded: his cheer is a nod
  cheerHop: [],
  undo(U) {
    // Viking leans in over the bed toward the box: "aww"... his nose twitches, and the sneeze
    A(r3(U - 0.12), "vik", "look", { to: [0.05, -0.5], dur: 0.12, blink: false });
    A(U, "vik", "lean", { to: 9, dur: 0.25 });   // a small lean: his face stays over the bed
    A(U, "vik", "expr", { expr: "kind", dur: 0.2 }); A(U, "vik", "face", { lid: 0.3, dur: 0.2 });
    A(r3(U + 0.05), "vik", "talk", { line: "aww", tone: "calm", dur: 0.3, voice: false });
    c.cap(r3(U + 0.02), r3(U + 0.3), "Aww…", SUB_LOW, false, SUBS);
    c.arm(r3(U + 0.2), "vik", "R", { o: [0.04, 0.42, 0.32] }, 0.15, "inOut"); c.arm(r3(U + 0.2), "vik", "L", { o: [0.04, 0.42, 0.32] }, 0.15, "inOut");   // mittens under his nose, below the eyes
    A(r3(U + 0.2), "vik", "expr", { expr: "shocked", set: { open: 0.2, eye: 0.6 }, dur: 0.1 });
    const SNEEZE = r3(U + 0.3);
    A(SNEEZE, "vik", "lean", { to: -6, dur: 0.12 }); A(r3(SNEEZE + 0.12), "vik", "lean", { to: 11, dur: 0.14 });
    A(SNEEZE, "vik", "talk", { line: "ah-CHOO", tone: "excited", dur: 0.3, voice: false });
    c.cap(SNEEZE, r3(SNEEZE + 0.45), "Ah-CHOO!", SUB_LOW, false, SUBS);
    sfx(r3(SNEEZE + 0.12), "hiss", { gain: 0.7, reason: "the burst of Viking's sneeze into his mittens (a short hiss of air under his gibberish ah-CHOO)" });
    A(r3(SNEEZE + 0.12), "vik", "squash", { amount: 0.12, dur: 0.18 });
    c.at(r3(SNEEZE + 0.12), { fx: "shake", dur: 0.15, amp: 0.012 });   // the sneeze has a kick
    // the cat shoots out of the box and back under the bed: eyes glowing again
    c.prop(r3(SNEEZE + 0.12), "cat", { [CAT.happy]: 0, [CAT.sit]: 0, [CAT.tuck]: 0, [CAT.streak]: 1, [CAT.lid]: 0, y: 0.15, rot: 160 }, 0.08, "out");
    c.prop(r3(SNEEZE + 0.2), "cat", { x: -0.6, z: CATZ, y: 0, rot: -90 }, 0.22, "in");
    sfx(r3(SNEEZE + 0.18), "whoosh", { gain: 0.4, reason: "the cat shoots out of the box and back under the bed" });
    c.prop(r3(SNEEZE + 0.42), "cat", { [CAT.streak]: 0, [CAT.dark]: 1, [CAT.glow]: 1, [CAT.tuck]: 0.55, [CAT.lid]: 0.55, rot: 90 }, 0.15);
    c.arm(r3(SNEEZE + 0.35), "vik", "R", "rest", 0.3, "inOut"); c.arm(r3(SNEEZE + 0.35), "vik", "L", "rest", 0.3, "inOut");
    A(r3(SNEEZE + 0.35), "vik", "lean", { to: 0, dur: 0.3 });
  },
  sting: 0.42,
  glareGap: 0.25,   // one head after the other, not one move
  glareShare: { wiz: false, phx: 0.25, rea: 0.15 },   // Reaper sits in front: he glares with his eyes, his face stays to us
  rub: "R",
});
see(r3(E.glare + 0.3), 9.7, ["cat", "box", "hatsock"], "P8: the empty box, two yellow eyes under the bed, the sock still on his hat");

// ---------------------------------------------------------------- shots: Jonny's panels
// P1-P4: from the front right, high enough that the back row's faces clear the front row's heads
const ROOM = { pos: [1.3, 3.0, 5.0], look: [0.18, 0.35, -0.6], fov: 56 };   // the bed gap well inside the frame, the plate still filling the top left   // front right, the bed running in from the left (the panels)
// P5-P8: lower and closer, the bed across the frame, the three peeking over it, Reaper and the box in front
const LOW = { pos: [-0.5, 2.5, 3.9], look: [-0.5, 0.4, -0.6], fov: 56 };   // high enough that seated Reaper sits below the back row's faces
const beats = c.beats([
  ["P1-P2 going wrong, the spell", 0, ROOM, "hook"],
  ["P3-P4 lift, torch, hiss", 3.3, "keep"],
  ["P5 the calm fix", 5.5, LOW, "reaction"],
  ["P6-P8 cheer, undo, glare", T0, "keep"],
  ["P7 the undo", E.payoff, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "cat-under-the-bed",
  title: "My friend group trying to get one cat out from under the bed",
  idea: "Friends try to, episode 3: the lure spell summons every sock, Viking lifts the bed and the cat walks along under it, the torch gets a hiss; Reaper sits beside an empty box and the cat walks in. Then Viking sneezes.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 9.6,
  // the painted room (assets/plates/cat-bedroom.png, paint.py seed 3): its wall meets the floor 74 % down
  set: { type: "plain", color: "#d9cdea", floor: "#a77b58", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/cat-bedroom.png", z: -2.6, center: [0.1, 2.02], height: 8.4, depth: false, motion: false, dust: 18 } },
  music: { style: "sneaky", lowCut: 150, gain: 0.3, until: E.musicStop },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["wiz", "phx", "vik", "rea", "cat"], hint: 0.1, what: "a paw swipes the treat, two eyes glow under the bed" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wiz", with: "hatsock", from: 2.6, to: 10, reason: "the last sock sits on his hat brim (it rests on it, a few mm in)" },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ who: "wiz", with: `sock${i}`, from: 2.1, to: 3.4, reason: "the socks heap on his hat and slide off it" })),
    { who: "wiz", with: "phx", from: 3.4, to: 5.05, reason: "P3-P4 belong to Viking's lift and the cat's hiss: the Wizard stands back behind Phoenix, his hat and staff still show; his face reads again in the scramble" },
    { who: "rea", with: "floorseat", from: 5.9, to: 10, reason: "Reaper sits on the floor (the seat is a soft shadow on it)" },
    { who: "vik", with: "bed", from: 3.6, to: 4.6, reason: "Viking's palms under the bed's foot end as he lifts it" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/03-cat-under-the-bed/make-cat-under-the-bed.mjs. Panels: PANELS.md.",
});
