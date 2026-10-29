// NEVER PRANK THE QUIET FRIEND (eight trend tests #08, 29 Oct 2026), built from the clip template.
// node storyboards/prank/make-never-prank-the-quiet-friend.mjs -> storyboards/prank/never-prank-the-quiet-friend.json
//
// THE BRIEF (Jonny's eight-trend-tests pack, 08-prank-reversal/ENGINE-PROMPT.md), cut from 12 s to 10 s with more
// action (Jonny 29 Oct: "short, a lot of action, a strong hook in the first 2 seconds, a couple of short cuts to explain
// the situation", an opening caption and background music on every clip), and opened on the moving two-shot instead
// of the macro (the posted-clips read of 29 Oct evening: calm close-up openings lose the most viewers by 0:02):
//   Joke:        the Wizard sets up the shaving-foam prank on "sleeping" Reaper; Reaper was never asleep.
//   Wants:       the Wizard wants Reaper to smear his own face; Reaper wants his nap.
//   Consequence: the foam hand rises as expected, swings past Reaper's own face and presses the foam onto the
//                Wizard's cheek.
//   Ending:      Reaper back "asleep" with the smallest satisfied smile; the Wizard, foam on his cheek, lowers the feather.
//
//   01 0.00-0.55  two-shot, already moving: the Wizard leaning in, the feather on its way, the foam palm in frame
//   02 0.55-1.05  insert: the foam dollop on Reaper's upturned right palm on the armrest (it wobbles: plop)
//   03 1.05-1.60  close: sleeping Reaper; the feather tip slides in to his face
//   04 1.60-3.10  two-shot: the tickle (three strokes), two face twitches; the Wizard shakes with silent glee and
//                 steps in closer to watch
//   04b 3.10-3.40 insert: the foam hand lifts off the armrest (the expected self-smear)
//   05 3.40-4.30  close: Reaper's eye nearest the Wizard opens a slit, slides to him, shuts. The music stops
//   06 4.30-6.30  one held medium from above the Wizard's brim: the hand comes up and across, SPLORT, presses the
//                 Wizard's cheek (4.95), squash, off; Reaper's eyes stay shut; the Wizard jolts back a step, hat wobbling
//   07 6.30-7.50  the Wizard frozen, foam on his cheek; his eyes dart down to it and back
//   08 7.50-10.0  the Wizard lowers the feather, defeated; then Reaper's tiny satisfied smile; a drip of foam falls
//
// Hands: Reaper's own RIGHT palm (on the left armrest, screen left) carries the foam all clip; his LEFT rests on the
// right armrest. The Wizard's own RIGHT hand pinches the feather's quill all clip (grip library `thin`); his left hangs.
// State: one dollop on Reaper's palm -> pressed flat at T_PRESS, when the patch appears on the Wizard's cheek -> the
// patch stays on his cheek to the end; the palm keeps a flattened smear.
// Body moves: `pitch` + tips a body forward, `lean` + tips it toward its own right (- toward its left).
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as grips from "../lib/grips.mjs";
import { ARMCHAIR } from "../../engine/page/props-prank.js";

const c = clip(), { A, sfx } = c;
const END = 10.0;
const T_PRESS = 4.95;                                         // the foam meets the Wizard's cheek (the payoff)

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const CHAIR = [-0.36, 0.0], CHAIR_ROT = 20;                  // turned a little toward the Wizard
const rad = (d) => (d * Math.PI) / 180;
// a point in the chair's own frame (x right, z toward its front) in the world
const inChair = ([x, y, z]) => { const a = rad(CHAIR_ROT); return [r3(CHAIR[0] + x * Math.cos(a) + z * Math.sin(a)), r3(y), r3(CHAIR[1] - x * Math.sin(a) + z * Math.cos(a))]; };
const PALM = inChair([-ARMCHAIR.armX, ARMCHAIR.armY + 0.035, ARMCHAIR.armFront - 0.12]);   // the foam palm on the left armrest
const PAW_L = inChair([ARMCHAIR.armX, ARMCHAIR.armY + 0.035, ARMCHAIR.armFront - 0.14]);  // his left paw on the right armrest
const WIZ = [0.5, 0.56], WIZ_NEAR = [0.42, 0.6], WIZ_BACK = [0.6, 0.68], WIZ_YAW = -45;
const FACE_R = [-0.24, 0.96, 0.36];                           // Reaper's face seated (between eyes and mouth), from --layout
// the Wizard's right cheek on his body (body frame: +z his front, -x his right), where the patch appears
const CHEEK = { x: -0.15, y: 0.58, z: 0.31, rot: -26 };
// where that cheek is in the world at the press (measured from the patch in --layout) and the way it faces: the press
// aims at this point, `out` metres off it along that way
const CHEEK_W = [0.05, 0.545, 0.69], CHEEK_ROT = WIZ_YAW + CHEEK.rot;
// the feather's quill bottom on its way in (world; the feather leans top-left toward Reaper's face)
const F0 = [0.26, 0.8, 0.8], F_TICKLE = [0.07, 0.76, 0.7];

// eye targets (face look space: + right on screen, + up)
const REA_AT_WIZ = [0.85, -0.15], WIZ_AT_REA = [-0.7, 0.25], WIZ_AT_HAND = [-0.85, 0.0];

const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: CHAIR, face: CHAIR_ROT, expr: "serene", follow: 0, seed: 3.3 },
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: WIZ_YAW, expr: "evil", follow: 0.2, seed: 2.6, signature: false },
];
const FEATHER_SPEC = { id: "feather", kind: "feather", x: F0[0], y: F0[1], z: F0[2], rot: 0, tilt: -64, tip: -22, scale: 1.5 };
const props = [
  { id: "chair", kind: "armchair", x: CHAIR[0], z: CHAIR[1], rot: CHAIR_ROT },
  { id: "foam", kind: "foam", x: PALM[0], y: PALM[1], z: PALM[2], scale: 1 },
  FEATHER_SPEC,
  { id: "cheek", kind: "carrier", x: CHEEK_W[0], y: CHEEK_W[1], z: CHEEK_W[2], rot: CHEEK_ROT },
  { id: "patch", kind: "foampatch", wear: "wiz", ...CHEEK, r: 0.1, scale: 0 },
];
const ON_CHEEK = (out, up = 0) => ({ prop: "cheek", grip: [0, up, out], palm: true });

// ---------------------------------------------------------------- frame 0: asleep, foam on the palm, the feather coming
A(0, "rea", "sit", { seat: "chair", dur: 0, hands: "keep", feet: [0.3, 0.3] });
c.arm(0, "rea", "R", { world: PALM }, 0);
const CUP = { shape: "cup", set: { curl: 0.25, index: 0.2, thumb: 0.2 } };
A(0, "rea", "grip", { side: "R", ...CUP, dur: 0 });
A(0, "rea", "grab", { prop: "foam", hand: "R", grip: [0, -0.02, 0], dur: 0, pose: null });
c.arm(0, "rea", "L", { world: PAW_L }, 0);
A(0, "rea", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "rea", "face", { lid: 1, dur: 0 });
A(0, "rea", "look", { to: [0.1, -0.2], dur: 0, blink: false });
act.blinksAt(c, "rea", []);
// asleep: slow breaths (squash is a pulse: in and out over its dur)
for (const t of [0.15, 1.7, 6.6, 8.3]) A(t, "rea", "squash", { amount: 0.02, dur: 1.4 });

const fh = grips.thin(c, "wiz", FEATHER_SPEC, { side: "R", from: 0.22, roll: -30, readyRoll: -30 });
fh.secure(0, 0);
c.arm(0, "wiz", "L", { o: [0.06, 0.27, 0.08] }, 0);
A(0, "wiz", "grip", { side: "L", shape: "relaxed", dur: 0 });
A(0, "wiz", "pitch", { to: 3, dur: 0 });
A(0, "wiz", "lean", { to: 2, dur: 0 });
A(0, "wiz", "look", { to: WIZ_AT_REA, dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "evil", set: { open: 0.15, curve: 0.75 }, dur: 0 });
act.blinksAt(c, "wiz", [7.5, 9.3]);

c.cap(0, 2.0, "Never prank the quiet friend.", 250, false, { kinetic: false });

// ---------------------------------------------------------------- 01-03 the setup: feather in, foam, the face (0-1.6)
fh.carry(0.02, F_TICKLE, 1.4, "inOut");                                // the feather creeps in from frame 0 across the setup cuts (review A)
A(0.1, "wiz", "pitch", { to: 6, dur: 1.0, ease: "inOut" });
A(0.1, "wiz", "lean", { to: 4, dur: 1.0, ease: "inOut" });
c.prop(0.6, "foam", { squash: 0.12 }, 0.08, "out"); c.prop(0.68, "foam", { squash: 0 }, 0.35, "settle");   // a soft wobble
sfx(0.62, "ai/drip", { gain: 0.4, reason: "the foam dollop wobbling on his palm (0.6-1.0): a tiny wet plop" });
A(1.2, "wiz", "expr", { expr: "evil", set: { open: 0.3, curve: 0.9 }, dur: 0.3 });

// ---------------------------------------------------------------- 04 the tickle (1.6-3.4)
for (const [k, tt] of [[0, 1.7], [1, 2.05], [2, 2.4]]) {
  c.prop(tt, "feather", { tilt: -52 }, 0.15, "inOut"); c.prop(tt + 0.17, "feather", { tilt: -70 }, 0.15, "inOut");
  fh.carry(tt, [F_TICKLE[0] + 0.01 * k, F_TICKLE[1] + 0.03, F_TICKLE[2]], 0.15, "inOut"); fh.carry(tt + 0.17, F_TICKLE, 0.15, "inOut");
}
sfx(1.7, "kenney/cloth", { gain: 0.04, reason: "the feather brushing his face (three strokes 1.7-2.7)" });
// Reaper's face twitches twice (lips purse, brows pinch, a little shudder)
for (const tt of [1.95, 2.33]) {
  A(tt, "rea", "expr", { expr: "serene", set: { curve: -0.2, pucker: 0.6 }, dur: 0.08 });
  A(tt, "rea", "face", { brow: -0.25, dur: 0.08 });
  A(tt, "rea", "squash", { amount: 0.04, dur: 0.14 });
  A(tt + 0.16, "rea", "expr", { expr: "serene", set: { curve: 0.35, pucker: 0 }, dur: 0.15 });
  A(tt + 0.16, "rea", "face", { brow: 0, dur: 0.15 });
}
sfx(1.95, "ai/blep", { gain: 0.35, reason: "Reaper's first face twitch (1.95): a tiny blep" });
// the foam hand starts to rise toward his own face, as the prank expects
c.arm(2.55, "rea", "R", { world: [-0.78, 0.73, 0.4] }, 0.5, "inOut");
c.arm(3.1, "rea", "R", { world: [-0.76, 0.82, 0.45] }, 0.3, "inOut");   // lifting off the armrest (the insert at 3.1)
// the Wizard's silent glee: a wider grin at the rising hand, shoulders shaking, then a step in to watch it
A(2.5, "wiz", "look", { to: WIZ_AT_HAND, dur: 0.15, blink: false });
A(2.55, "wiz", "expr", { expr: "delighted", set: { open: 0.45, eye: 0.7 }, dur: 0.2 });
for (let i = 0; i < 3; i++) A(2.6 + i * 0.16, "wiz", "squash", { amount: 0.035, dur: 0.15 });
c.prop(2.8, "feather", { tilt: -55 }, 0.25);
fh.carry(2.85, [F_TICKLE[0] - 0.04, F_TICKLE[1] - 0.14, F_TICKLE[2] + 0.04], 0.4, "inOut");
A(2.85, "wiz", "move", { to: WIZ_NEAR, dur: 0.4, steps: 1.5 });

// ---------------------------------------------------------------- 05 the eye (3.4-4.3)
// the eye opens behind shut lids first, so only the lid nearest the Wizard (his own left) opens: a slit
A(3.4, "rea", "expr", { expr: "serene", set: { eye: 0.85, curve: 0.15 }, dur: 0 });
A(3.4, "rea", "look", { to: [0.2, -0.1], dur: 0, blink: false });
A(3.55, "rea", "face", { lidL: 0.56, browL: -0.15, dur: 0.1 });
A(3.68, "rea", "look", { to: REA_AT_WIZ, dur: 0.14, blink: false });
sfx(3.55, "ai/fingertip-catch", { gain: 0.35, reason: "the eye snapping open a slit (3.55): one tiny tick" });
A(4.05, "rea", "face", { lidL: 1, browL: 0, dur: 0.1 });
A(4.16, "rea", "expr", { expr: "serene", set: { eye: 0.06, curve: 0.15 }, dur: 0 });
A(3.4, "rea", "still", { dur: 0.9, idle: 0.03 });
c.arm(3.4, "rea", "R", { world: [-0.74, 0.86, 0.48] }, 0.9, "inOut");   // the hand keeps creeping up
A(3.5, "wiz", "still", { dur: 0.8, idle: 0.05 });

// ---------------------------------------------------------------- 06 SPLORT (4.3-6.3)
// a sleepy shift toward the Wizard brings the hand up beside his own face...
A(4.3, "rea", "turn", { to: CHAIR_ROT + 22, dur: 0.55 });
A(4.3, "rea", "pitch", { to: 12, dur: 0.55 });
c.arm(4.3, "rea", "R", { world: [-0.5, 0.72, 0.62] }, 0.28, "inOut");   // under the hat brim, at cheek height (review A)
c.prop(4.3, "foam", { tilt: 55 }, 0.3, "inOut");
fh.carry(4.25, [0.08, 0.38, 0.86], 0.35, "inOut");                     // the feather drops low, out of the way, to watch
c.prop(4.25, "feather", { tilt: -95 }, 0.35, "inOut");
// ...then across in front of it and onto the Wizard's cheek
c.arm(4.58, "rea", "R", ON_CHEEK(0.16, 0.03), 0.22, "inOut");
c.prop(4.58, "foam", { tilt: 82 }, 0.22, "inOut");
c.arm(4.8, "rea", "R", ON_CHEEK(0.065), 0.15, "in");
// contact: the dollop squashes flat, the patch is on the cheek, the cheek gives (a squash, the body tips away)
c.prop(T_PRESS, "foam", { flat: 1 }, 0.08, "out");
c.prop(T_PRESS, "patch", { scale: 1 }, 0.06, "out");
sfx(T_PRESS, "splort", { gain: 0.9, reason: "the foam palm presses onto the Wizard's cheek (4.95): splort" });
c.arm(T_PRESS + 0.02, "rea", "R", ON_CHEEK(0.045), 0.2, "out");       // compression: a gentle press in
A(T_PRESS + 0.02, "wiz", "squash", { amount: 0.06, dur: 0.3 });
A(T_PRESS + 0.04, "wiz", "lean", { to: -4, dur: 0.2, ease: "out" });
A(T_PRESS + 0.04, "wiz", "pitch", { to: 0, dur: 0.25, ease: "out" });
// separation: the palm comes off, its foam a flat smear
c.arm(5.3, "rea", "R", ON_CHEEK(0.18, 0.03), 0.2, "out");
c.prop(5.3, "foam", { scale: 0.75 }, 0.2);
// the Wizard jolts: eyes wide, mouth open, a step back, hat wobbling, the feather still in his hand
A(T_PRESS + 0.02, "wiz", "expr", { expr: "shocked", set: { open: 0.6, eye: 1.25 }, dur: 0.08 });
A(T_PRESS + 0.02, "wiz", "face", { brow: 0.5, dur: 0.08 });
A(T_PRESS + 0.02, "wiz", "look", { to: [-0.2, 0.1], dur: 0.08, blink: false });
A(5.15, "wiz", "hatwobble", { amount: 10, freq: 3, dur: 0.9 });
sfx(5.05, "gasp", { gain: 0.5, reason: "the Wizard's gasp as the foam lands (5.05)" });
A(5.3, "wiz", "move", { to: WIZ_BACK, dur: 0.3, steps: 1.5 });
A(5.3, "wiz", "lean", { to: 0, dur: 0.4 });
fh.carry(5.3, [0.26, 0.44, 1.02], 0.3, "out");                           // the feather jerks back with him, low, off his face
c.prop(5.3, "feather", { tilt: -75 }, 0.3, "out");
// the hand back down to the armrest, palm up again; Reaper settles back into the chair
c.arm(5.55, "rea", "R", { world: [-0.55, 0.84, 0.6] }, 0.3, "inOut");
c.prop(5.55, "foam", { tilt: 0 }, 0.4, "inOut");
c.arm(5.85, "rea", "R", { world: PALM }, 0.4, "inOut");
A(5.55, "rea", "grip", { side: "R", ...CUP, dur: 0.2 });
A(5.55, "rea", "turn", { to: CHAIR_ROT, dur: 0.6 });
A(5.55, "rea", "pitch", { to: 0, dur: 0.6 });

// ---------------------------------------------------------------- 07 frozen (6.3-8.0)
A(6.0, "wiz", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.15, curve: -0.2 }, dur: 0.3 });
A(6.0, "wiz", "face", { brow: 0.4, dur: 0.3 });
A(6.1, "wiz", "still", { dur: 1.3, idle: 0.02 });
A(6.6, "wiz", "look", { to: [-0.7, -0.45], dur: 0.12, blink: false });   // his eyes dart down to his own cheek...
A(7.2, "wiz", "look", { to: [-0.2, 0.1], dur: 0.15, blink: false });     // ...and back to Reaper
c.prop(6.8, "patch", { drip: 0.35 }, 0.6, "in");

// ---------------------------------------------------------------- 08 the feather comes down, then the smallest smile (7.5-10.0)
A(7.55, "wiz", "look", { to: [0.1, -0.15], dur: 0.4, blink: false });
A(7.6, "wiz", "expr", { expr: "sad", set: { curve: -0.35, eye: 0.9 }, dur: 0.4 });
A(7.6, "wiz", "face", { brow: 0.25, lid: 0.25, dur: 0.4 });
fh.carry(7.9, [0.42, 0.42, 0.95], 0.8, "inOut");
c.prop(7.9, "feather", { tilt: -150 }, 0.8, "inOut");                   // the feather droops tip-down
A(8.0, "wiz", "squash", { amount: 0.03, dur: 1.2 });
A(8.0, "wiz", "pitch", { to: 4, dur: 0.8 });                           // the shoulders sag
// the last word is the quiet friend's: the smallest satisfied smile, eyes still shut (review A)
A(8.85, "rea", "expr", { expr: "serene", set: { curve: 0.55, smirk: 0.25 }, dur: 0.35 });
c.prop(8.8, "patch", { drip: 1 }, 0.5, "in");
sfx(9.3, "ai/drip", { gain: 0.35, reason: "a drop of foam falling from his cheek (9.3): plop" });

// ---------------------------------------------------------------- shots
const PALM_T = [PALM[0] + 0.04, PALM[1] + 0.07, PALM[2]];
const TWO = [-0.02, 0.82, 0.45];
const S1 = frame([-0.2, 0.8, 0.42], { az: -8, el: 10, h: 2.5, fov: 30, push: 0.1, dur: 0.55 });
const S2 = frame([PALM_T[0] - 0.16, PALM_T[1], PALM_T[2]], { az: -10, el: 6, h: 0.6, fov: 30, push: 0.12, dur: 0.5 });   // the palm at the right, so the caption sits over the chair, not the hood
const S3 = frame([FACE_R[0] + 0.08, FACE_R[1] + 0.31, FACE_R[2]], { az: -24, el: 4, h: 1.05, fov: 30, push: 0.08, dur: 0.55 });   // the wall above the hood for the caption
const S4 = frame(TWO, { az: -6, el: 8, h: 1.85, fov: 30, push: 0.06, dur: 1.8 });
const S5 = frame([FACE_R[0] + 0.04, FACE_R[1] + 0.03, FACE_R[2]], { az: -34, el: 3, h: 0.62, fov: 30 });
// from the front and above the Wizard's hat brim, so Reaper's sleeping face and the Wizard's cheek are both seen at the press (review A)
const S6 = frame([0.0, 0.82, 0.45], { az: 4, el: 22, h: 1.85, fov: 30 });
// the foam hand lifting off the armrest (the expected self-smear), the beat-02 framing on where the hand is then
const S4B = frame([-0.74, 0.82, 0.43], { az: 6, el: 16, h: 0.75, fov: 30, push: 0.1, dur: 0.3 });
const S7 = frame([0.26, 0.76, 0.7], { az: -16, el: 4, h: 1.35, fov: 30 });
const S8 = { pos: [-0.05, 1.25, 4.6], look: [0.2, 0.78, 0.4], fov: 30 };
const beats = c.beats([
  ["01 the prank", 0, S1, "hook"],
  ["02 the foam", 0.55, S2],
  ["03 the target", 1.05, S3],
  ["04 the tickle", 1.6, S4, "escalation"],
  ["04b the foam hand rises", 3.1, S4B],
  ["05 the eye", 3.4, S5, "reveal"],
  ["06 the hand comes over", 4.3, S6, "escalation"],
  ["06b splort", T_PRESS, "keep", "payoff"],
  ["07 frozen", 6.3, S7, "reaction"],
  ["08 the smallest smile", 7.5, S8],
], END);

write(import.meta.url, {
  id: "never-prank-the-quiet-friend",
  title: "Never Prank the Quiet Friend",
  cover: 5.1,                                    // the foam on the Wizard's cheek, his shocked face
  idea: "Eight trend tests 08: the Wizard tickles 'sleeping' Reaper to make him smear foam on his own face; Reaper presses it onto the Wizard's cheek instead",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 } },
  // a tiptoe pizzicato walk from frame 0, full level; the lock puts one beat of silence before the splort and the drop on it
  music: { style: "sneaky", seed: 8, gain: 0.32, payoff: T_PRESS },
  // auto off: every sound is placed by hand (the payoff's splort above all)
  sound: { sfx: 0.7, ambience: 0.3, speech: false, signature: false, auto: false, surface: "carpet" },
  experiment: { id: "hook-2026-11", episode: "never-prank-the-quiet-friend", variant: "A" },
  hook: { show: ["rea", "wiz", "foam", "feather"], hint: 0, what: "the Wizard creeps a feather toward sleeping Reaper, who has foam on his palm" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "rea", with: "chair", from: 0, to: END, reason: "Reaper sits in the armchair, his hands on its arms" },
    { who: "rea", with: "wiz", from: 4.75, to: 5.45, reason: "the payoff: Reaper's foam palm presses the Wizard's cheek" },
    { who: "rea", with: "patch", from: 4.75, to: 5.45, reason: "the palm presses the foam onto the cheek" },
    { who: "wiz", with: "feather", from: 0, to: END, reason: "the Wizard holds the feather" },
  ],
  notes: "Generated by storyboards/prank/make-never-prank-the-quiet-friend.mjs (eight trend tests 08, cut to 10 s).",
});
