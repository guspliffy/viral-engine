// WHAT IF YOUR FRIEND COULD PAUSE TIME? (what if, episode 1; format B trial, Jonny 8 Nov 2026: "upgrade everything and
// try out the formats as well"). The What if formula (kelano86/what-if-animation, references/formula.md): three quick
// demos of one power, each bigger than the last, with the same word, sound and look every time; a title card; a twist
// from a real fact; the end on a question. BOARD.md next to this file holds the brief, look, shots and check times.
//   node storyboards/series/what-if/01-pause-time/make-pause-time.mjs -> pause-time.json
//
// THE BRIEF
//   Joke:        the friend who is always late can stop time, so he is never late: he walks into the selfie, takes the
//                coffee out of the air and sits down as if he had been there for ages, and winds the clock back.
//   Wants:       Viking wants to look like he was on time; Phoenix and Reaper want him to stop being late.
//   Consequence: every time, the friends see the result and not how (the double take, the empty hand, 12:00 again).
//   Ending:      the twist is real physics: if time stops, light stops too, so he would be blind. In the dark only his
//                eyes; he walks into the clock post (BONK). The light comes back on him flat against it.
//   Callback:    the clock he wound back is the post he walks into, and the opening question ("late for the photo?")
//                turns into the viewer's ("would you still want it?").
// The power: the word "HALT!" (his real voice), the sound "timestop" (a wooden clock TOCK and a tape-stop slide) and the
// look (the world drains grey in a ring from him; he stays in colour; engine/shared/pause.js). Each pause ends on
// "timego" and the colour flooding back. The world's own sound (wind, birds) and the music stop in every pause.
//
// One place, four days: each scene is its own setup on the same meadow road (hard cuts between them), so the clock and
// the bench are moved between scenes, out of the shots that don't use them.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", FOCUS = false, LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const LIFE = "auto";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const END = 18.6;
const V = { voice: "viking" };   // Viking's real voice (VoxCPM2, engine/voice): his lines are words

// the pauses: [from, to] on the clip's clock (Viking is the keeper of each)
const P1 = [1.0, 2.75], P2 = [5.02, 7.3], P3 = [9.35, 11.45], P5 = [14.7, 16.85];
// the scenes (hard cuts): photo, coffee, clock, title, twist
const S2 = 4.4, S3 = 8.6, S4 = 12.4, S5 = 14.0;

// ---------------------------------------------------------------- places: one summer meadow road (meadow-path), x right, z toward us
// THE STAGE: the blocking stands (OX, OZ) down the road from where it was first laid out, past the painted bush and
// tree that line the road nearer the painting's eye (they hid whoever stood at a frame edge); there the meadow opens
// up across the whole frame. Every place below is written as laid out and moved by W / W3.
const OX = 0.2, OZ = -3.6;
const W = (x, z) => [r3(x + OX), r3(z + OZ)], W3 = (x, y, z) => [r3(x + OX), y, r3(z + OZ)];
// the camera stays inside the painting's safe range (qa/env.mjs --range meadow-path: x within 0.94 m of the middle,
// pan left 10°, right 4°; the painted road ends 3.7 m in front of the middle, so no camera stands further back)
const CLOCK = { id: "clock", kind: "parkclock", x: W(-0.6, -2.7)[0], z: W(-0.6, -2.7)[1], face: 1.42, r: 0.22, crankY: 0.62, crankR: 0.13, time: 12.667, spin: 0 };
const BENCH1 = W(1.25, -3.0), BENCH2 = W(0.8, -2.85), BENCH3 = W(2.0, -2.9);   // the bench in the photo, coffee and clock scenes
// the bench's own place is the coffee scene's (a "sit" seats on a prop's spec place, not where a tween moved it)
const BENCH = { id: "bench", kind: "parkbench", x: BENCH2[0], z: BENCH2[1], w: 1.9 };
const SEAT_L = -0.5, SEAT_R = 0.62;   // along the bench: Viking's seat (left) and Reaper's (right), a body-width apart
const SEAT_Y = 0.42;
const rad = (d) => (d * Math.PI) / 180;
// a point in front of someone: fwd metres ahead, side metres to their right, y up (yaw: their facing, 0 = to us)
const front = (at, yaw, fwd, side, y) => [r3(at[0] + Math.sin(rad(yaw)) * fwd - Math.cos(rad(yaw)) * side), r3(y), r3(at[1] + Math.cos(rad(yaw)) * fwd + Math.sin(rad(yaw)) * side)];
// a cut to a new setup: everyone named is put in their place two frames before the cut (anime timing shows every
// character at the cut or later, shared/anime-timing.js)
const setup = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01 }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01 }); };
const moveProp = (t, id, x, z) => c.prop(r3(t - 0.03), id, { x, z }, 0.01);

// ---------------------------------------------------------------- the power: the same word, sound and look every time
const SNAPS = [];   // the HALT arm snaps (allowClip windows below)
function halt(t, side = "R", arm = { o: [0.05, 0.62, 0.45] }, pos = null) {
  SNAPS.push(t);
  A(r3(t - 0.12), "vik", "expr", { expr: "focused", set: { open: 0.5 }, dur: 0.12 });
  c.arm(r3(t - 0.06), "vik", side, arm, 0.12, "out"); A(r3(t - 0.06), "vik", "grip", { side, shape: "flat", dur: 0.08 });
  c.say(t, "vik", "HALT!", 0.45, "excited", { ...V, sub: "HALT!", ...(pos ? { pos } : {}) });
  c.captions[c.captions.length - 1].to = r3(t + 0.7);   // one word: off before he moves on
}
function pauseSounds([from, to]) {
  sfx(from, "timestop", { gain: 0.9, reason: "the power: the world stops (a wooden clock tock and a tape-stop slide)" });
  sfx(to, "timego", { gain: 0.75, reason: "the world starts again (a rising vwip into one clock tick)" });
}

// ================================================================ 1 THE PHOTO 0-4.4 ("Late for the photo?")
// Frame 0: Phoenix holds the phone up for a selfie with Reaper, the self-timer beeping; Viking runs at them from far
// down the road. HALT: the world stops (the birds he startled hang in the air). He strolls into the picture, thumbs up.
// Time goes on: beep, flash, the photo has three in it. The two turn and find him there.
// a body-width apart: a potato's resting hands hang 0.5 m out to its sides, so centres 1.05 m apart side by side, or
// 0.8 m across and 0.5 m deeper
const PHX1 = W(-0.35, -2.0), REA1 = W(0.7, -2.1), VIK1_RUN = W(-2.3, -4.3), VIK1_HALT = W(-1.75, -3.45), VIK1_POSE = W(-1.3, -2.6);
const cast = [
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK1_RUN, face: 35, expr: "eager", follow: 0.3, seed: 2.1 },
  { id: "phx", character: "duo/phoenix", at: PHX1, face: "camera", expr: "happy", follow: 0.3, seed: 1.7, span: 0.2 },
  { id: "rea", character: "never-has-money/reaper", at: REA1, face: -8, expr: "deadpan", follow: 0.3, seed: 3.3 },
];
// the selfie phone in Phoenix's left hand, held up between him and Reaper, its screen to them and its orange back
// square to the lens, so the selfie reads at frame 0 (review A)
const PHONE_AT = W3(0.02, 1.12, -1.65);   // up over their heads, against the green beside his crest (review A)
c.prop(0, "bench", { x: BENCH1[0], z: BENCH1[1] }, 0);   // behind Reaper in the photo
c.prop(0, "clock", { x: W(-2.6, 0)[0] }, 0);   // the clock is out of the photo and the coffee (back in the clock scene)
const PHONE = { id: "phone", kind: "phone", ...grips.placeFor("phone", PHONE_AT, 6), tip: -12, scale: 1.8, case: "#e8743b" };
const ph = grips.phone(c, "phx", PHONE, { side: "L" });
c.arm(0, "phx", "L", { prop: "phone", grip: ph.hands.L.grip, palm: true }, 0); A(0, "phx", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "phx", "grab", { prop: "phone", hand: "L", grip: ph.hands.L.grip, dur: 0, pose: null });
A(0, "phx", "look", { to: [0.35, 0.6], dur: 0.01, blink: false });   // up at the screen
A(0, "rea", "look", { to: [-0.35, 0.55], dur: 0.01, blink: false });
A(0, "rea", "expr", { expr: "deadpan", set: { curve: 0.25 }, dur: 0.01 });   // his photo smile
c.say(0.1, "phx", "Say cheese!", 0.6, "happy");
sfx(0.32, "timer-beep", { gain: 0.35, reason: "the phone's self-timer counting down" });
sfx(0.78, "timer-beep", { gain: 0.35, reason: "the phone's self-timer counting down" });
cap(0, 1.0, "Late for the photo?", 300);
// Viking: running in from the left edge of the frame at frame 0, the eyes on them (render 1: from far down the road he
// read as standing with them)
A(0, "vik", "move", { to: VIK1_HALT, dur: 0.7, stride: 1.4 });
A(0, "vik", "look", { to: [0.4, -0.05], dur: 0.01, blink: false });
halt(0.62);
A(0.7, "vik", "squash", { amount: 0.08, dur: 0.15 });   // he plants his feet as he shouts
see(0, 1.0, ["vik.face", "phx.face", "rea.face", "phone"], "frame 0: the selfie, and the late friend running at it");
// THE PAUSE: he drops the arm, strolls into the selfie and gives the thumbs up
pauseSounds(P1);
c.arm(1.05, "vik", "R", "rest", 0.3, "inOut"); A(1.05, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(1.05, "vik", "expr", { expr: "cocky", set: { curve: 0.8, smirk: 0.4 }, dur: 0.25 });
A(1.12, "vik", "look", { to: [0.3, 0.2], dur: 0.2, blink: false });
A(1.2, "vik", "turn", { to: 12, dur: 0.15 });
A(1.25, "vik", "move", { to: VIK1_POSE, dur: 0.95, steps: 4 });   // short steps: a stroll
A(2.12, "vik", "turn", { to: 15, dur: 0.15 });
A(2.18, "vik", "look", { to: [0.0, 0.05], dur: 0.15, blink: false });
c.arm(2.25, "vik", "R", { o: [0.18, 0.75, 0.25] }, 0.18, "out"); A(2.27, "vik", "grip", { side: "R", shape: "thumb", dur: 0.1 });
A(2.25, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.5 }, dur: 0.15 });
see(1.3, 2.7, ["vik.face"], "he walks through the frozen grey world, the only one in colour");
// time goes on: the last beep, the flash, the photo
sfx(2.95, "timer-beep", { gain: 0.35, reason: "the self-timer's last beep" });
c.at(3.15, { fx: "flash", dur: 0.35, peak: 0.85, sound: false });
sfx(3.15, "flash", { gain: 1.0, reason: "the phone's camera firing (the flash on screen)" });
c.at(3.3, { fx: "photo", style: "print", dur: 0.65, shot: 3.15, aspect: 1.0, w: 900, pos: [540, 820], tilt: -3, dim: 0.55, push: 0.03,
  cam: { pos: W3(-0.3, 1.15, 1.6), look: W3(-0.3, 0.65, -2.3), fov: 60 }, hide: ["phone"] });
// the double take: they look at the photo, then at him
for (const [w, dt] of [["phx", 0], ["rea", 0.05]]) A(3.2 + dt, w, "blink", { dur: 0.2 });
A(3.95, "phx", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false }); act.shock(c, 4.0, "phx", { hold: 0.3 });
A(4.0, "rea", "look", { to: [-0.85, 0.0], dur: 0.15, blink: false }); A(4.05, "rea", "face", { brow: 0.35, dur: 0.25 });
A(4.05, "rea", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.15 }, dur: 0.25 });
see(3.95, 4.38, ["phx.face", "vik.face"], "the double take: he is just there");

// ================================================================ 2 THE COFFEE 4.4-8.6 ("Late for coffee?")
// Reaper on the bench, Phoenix telling him off with a coffee in his hand ("where IS he?!"): the big gesture sends the
// cup flying at Reaper's face. HALT: the cup hangs in the air. Viking takes it out of the air, sits down beside Reaper
// and holds it like his own. Time goes on: Reaper flinches at nothing, Phoenix's hand is empty, Viking: "Been here
// ages."
const PHX2 = W(-0.75, -2.05), PHX2_YAW = 40, VIK2_IN = W(1.75, -1.15), VIK2_HALT = W(0.6, -1.2);   // in front of the cup's flight (a body is solid to it)
const SEAT2_L = [r3(BENCH2[0] + SEAT_L), r3(BENCH2[1] + 0.03)], SEAT2_R = [r3(BENCH2[0] + SEAT_R), r3(BENCH2[1] + 0.03)];
moveProp(S2, "bench", BENCH2[0], BENCH2[1]);
setup(S2, "phx", PHX2, PHX2_YAW); setup(S2, "rea", SEAT2_R, 0); setup(S2, "vik", VIK2_IN, -95);
A(r3(S2 - 0.02), "rea", "sit", { seat: "bench", along: SEAT_R, dur: 0.01, hands: "lap" });
// the phone is put away (out of every shot) as the scene changes: it was the photo's
A(r3(S2 - 0.02), "phx", "release", { prop: "phone", to: W3(3.5, 0, -4.5), dur: 0.01 });
// the cup comes in: in his LEFT hand at his chest, on the far side from us (it waited on the bench in the photo scene)
const CUP_AT = front(PHX2, PHX2_YAW, 0.4, -0.18, 0.55);
const CUP_SPEC = { id: "cup", kind: "coffeecup", ...grips.placeFor("coffeecup", CUP_AT, PHX2_YAW) };
const CUP = { ...CUP_SPEC, x: BENCH1[0], y: SEAT_Y, z: r3(BENCH1[1] + 0.02) };
const cup = grips.mug(c, "phx", CUP_SPEC, { side: "L", height: 0.66 });
c.prop(r3(S2 - 0.03), "cup", { x: CUP_AT[0], y: CUP_AT[1], z: CUP_AT[2] }, 0.01);
c.arm(r3(S2 - 0.02), "phx", "L", { prop: "cup", grip: cup.hands.L.grip, palm: "wrap" }, 0.01); A(r3(S2 - 0.02), "phx", "grip", { side: "L", shape: "hold", dur: 0.01 });
A(r3(S2 - 0.01), "phx", "grab", { prop: "cup", hand: "L", grip: cup.hands.L.grip, dur: 0, pose: null });
c.arm(r3(S2 - 0.02), "phx", "R", { o: [0.12, 0.5, 0.3] }, 0.01); A(r3(S2 - 0.02), "phx", "grip", { side: "R", shape: "point", dur: 0.01 });   // jabbing at Reaper
A(r3(S2 - 0.02), "phx", "look", { to: [0.6, -0.05], dur: 0.01, blink: false });
A(r3(S2 - 0.02), "phx", "expr", { expr: "angry", dur: 0.01 });
A(r3(S2 - 0.02), "rea", "look", { to: [-0.7, 0.05], dur: 0.01, blink: false }); A(r3(S2 - 0.02), "rea", "expr", { expr: "deadpan", dur: 0.01 });
cap(S2, 5.0, "Late for coffee?", 300);
// the angry arm-fling: the cup comes in across his chest, then his left arm flings out toward Reaper; the cup leaves
// the hand at REL (4.9) and a knock a moment later sends it on toward Reaper's face, aimed to be at CUP_STOP exactly
// when time stops (physics.js aim works from wherever the let-go has the cup by then, so the stop is where we put it).
// CUP_STOP: at Viking's head height, 0.33 m to the right of where he stands to take it, a body-width in front of the
// bench (closer and the bench is in his back) and right in front of his own seat
const REL = front(PHX2, PHX2_YAW, 0.3, -0.48, 0.88), KNOCK = 4.92;
const SEAT2_FRONT = 0.72, AIM_STAND = [r3(SEAT2_L[0] + 0.08), r3(BENCH2[1] + SEAT2_FRONT)], GRAB2 = 5.96;
const CUP_STOP = [r3(AIM_STAND[0] - 0.33), 1.0, r3(AIM_STAND[1] + 0.01)];   // the knock's aim (kept: the stop below depends on it)
// where the cup really hangs: Phoenix's follow-through hand pushes it on toward us after the let-go, so it stops
// 0.17 m nearer than the aim (measured in the layout, deterministic). Viking stands a hand's reach behind THAT spot.
const CUP_HANG = [0.271, 1.01, -5.547];
// he stands 0.45 m to its left and 0.25 m behind it, so the cup hangs in clear air beside his face, not behind his head
// (render 1: from the insert it sat inside his outline and his glove covered it)
const VIK2_STAND = [r3(CUP_HANG[0] + 0.45), r3(CUP_HANG[2] - 0.25)];
cup.carry(4.5, front(PHX2, PHX2_YAW, 0.34, 0.02, 0.76), 0.2, "inOut");   // 0.2 s moves are drawn on 1s (anime timing)
cup.carry(4.7, REL, 0.2, "in");
A(4.9, "phx", "release", { prop: "cup", dur: 0 });
A(4.9, "phx", "grip", { side: "L", shape: "open", dur: 0.08 });
c.arm(4.92, "phx", "L", { o: [0.15, 0.65, 0.42] }, 0.35, "out");   // the follow-through: open hand, out in front of him
c.arm(4.6, "phx", "R", "rest", 0.3, "inOut"); A(4.6, "phx", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.knock(KNOCK, "cup", { to: [CUP_STOP[0], CUP_STOP[1], r3(CUP_STOP[2] - 0.2)], in: r3(P2[0] - KNOCK), spin: [0, 0, 0] });
// Viking runs in from the right (past Reaper quickly), sees the cup go, HALT
A(S2, "vik", "move", { to: VIK2_HALT, dur: 0.42, stride: 1.4 });
A(S2, "vik", "look", { to: [-0.4, 0.0], dur: 0.01, blink: false });
A(4.62, "vik", "turn", { to: -40, dur: 0.2 });
halt(4.66, "L", { o: [0.05, 0.62, 0.45] });
see(S2, 5.06, ["phx.face", "rea.face", "vik.face", "cup"], "Phoenix's cup flies at Reaper's face as Viking arrives");
// THE PAUSE: the cup hangs in the air at CUP_HANG
pauseSounds(P2);
c.at(P2[0], { do: "physics", prop: "cup", mode: "settle" });
// he backs up under it (the cup to his right, at head height), takes it with his right hand and sits down where he
// stands: the bench is right behind him, Reaper's seat beside his
c.arm(5.05, "vik", "L", "rest", 0.25, "inOut"); A(5.05, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(5.05, "vik", "look", { to: [-0.3, 0.3], dur: 0.15, blink: false });   // up at the cup
A(5.1, "vik", "expr", { expr: "cocky", set: { curve: 0.7, smirk: 0.45 }, dur: 0.25 });
A(5.12, "vik", "turn", { to: -20, dur: 0.3 });
A(5.1, "vik", "move", { to: VIK2_STAND, dur: 0.6, steps: 3 });   // three steps back, the eyes on it (4 swung his hand into Phoenix)
// his glove behind the cup and to its left, at the sleeve's height, 0.1 m from its axis: the white cup stays in front of
// the black glove (a palm turned to the axis made the hand turn 80° on the way to his chest and the cup slip: layout 8 Nov)
const HAND_AT = [r3(CUP_HANG[0] + 0.075), r3(CUP_HANG[1] + 0.06), r3(CUP_HANG[2] - 0.065)];
A(5.6, "vik", "look", { to: [-0.45, 0.45], dur: 0.12, blink: false });
c.arm(5.72, "vik", "R", { world: HAND_AT }, 0.22, "out"); A(5.72, "vik", "grip", { side: "R", shape: "open", dur: 0.12 });
A(5.88, "vik", "grip", { side: "R", shape: "hold", dur: 0.1 });
A(GRAB2, "vik", "grab", { prop: "cup", hand: "R", keep: true, dur: 0, pose: null });
// at the cut to the wide the cup settles into his glove by the mug hold (the grab above keeps the offset it was taken at,
// which put the cup beside the glove once the hand turned: render 3, the toast at 8.2)
const VIK_CUP = grips.mug(c, "vik", CUP_SPEC, { side: "R", height: 0.66 });
A(r3(GRAB2 + 0.06), "vik", "grab", { prop: "cup", hand: "R", grip: VIK_CUP.hands.R.grip, dur: 0, pose: null });
sfx(5.94, "ai/fingertip-catch", { gain: 0.35, reason: "his fingers closing on the cup in the air" });
c.arm(6.04, "vik", "R", { o: [0.05, 0.5, 0.32] }, 0.45, "inOut");   // to his chest, slowly (it is full)
A(6.3, "vik", "look", { to: [0.05, 0.0], dur: 0.15, blink: false });
A(6.4, "vik", "sit", { seat: "bench", along: SEAT_L, dur: 0.55, hands: "keep" });
A(6.75, "vik", "expr", { expr: "smug", dur: 0.25 });
see(5.2, 7.2, ["vik.face", "cup"], "the cup hangs in the air; he takes it and sits down");
// time goes on: Reaper flinches at a cup that isn't there; Phoenix's hand is empty; Viking has been here for ages
A(7.32, "rea", "face", { lid: 1, dur: 0.06 }); A(7.32, "rea", "squash", { amount: 0.08, dur: 0.12 }); A(7.32, "rea", "pitch", { to: -8, dur: 0.1 });
A(7.62, "rea", "face", { lid: 0, dur: 0.12 }); A(7.62, "rea", "pitch", { to: 0, dur: 0.25 });
A(7.7, "rea", "look", { to: [-0.8, 0.0], dur: 0.15, blink: false }); act.mood(c, 7.75, "rea", "annoyed", { hold: 0.6 });
A(7.4, "phx", "look", { to: [0.3, 0.05], dur: 0.12, blink: false });   // his empty hand
A(7.4, "phx", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.2 });
A(7.75, "phx", "look", { to: [0.8, -0.1], dur: 0.15, blink: false });
A(7.95, "phx", "look", { to: [0.75, -0.05], dur: 0.3, blink: false });
c.arm(7.8, "phx", "L", "rest", 0.35, "inOut"); A(7.8, "phx", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
// (no toast: raised, the open-handed pose turned the cup out beside his glove: render 3. It stays at his chest)
c.say(7.88, "vik", "Been here ages.", 0.9, "calm", V);   // on the bench shot, after Phoenix's empty-hand insert
see(7.35, 7.8, ["phx.face"], "Phoenix's hand is empty");
see(7.8, 8.55, ["vik.face", "rea.face", "cup"], "he's on the bench with the cup, as if he'd always been there");

// ================================================================ 3 THE CLOCK 8.6-12.4 ("40 minutes late?")
// Reaper points at the park clock: 12:40. Viking walks up, sheepish. HALT. He winds the clock back to 12:00 (the
// crank on its post; the hands race back). Time goes on: Reaper looks up at 12:00 and does a double take.
const REA3 = W(-1.15, -2.25), PHX3 = W(0.9, -1.85), VIK3_IN = W(1.2, -0.55), VIK3_HALT = W(-0.15, -1.15);
const CRANK_AT = [r3(CLOCK.x + 0.62), CLOCK.z], VIK3_AFTER = W(0.1, -2.45);
moveProp(S3, "bench", BENCH3[0], BENCH3[1]); moveProp(S3, "clock", CLOCK.x, CLOCK.z);
setup(S3, "rea", REA3, 35); setup(S3, "phx", PHX3, -35); setup(S3, "vik", VIK3_IN, -95);
A(r3(S3 - 0.02), "rea", "stand", { dur: 0.01 }); A(r3(S3 - 0.02), "vik", "stand", { dur: 0.01 });
// the cup is put away (off the road, out of every shot), his hand back to his side
A(r3(S3 - 0.03), "vik", "release", { prop: "cup", to: W3(3.3, 0, -4.5), dur: 0.01 });
c.arm(r3(S3 - 0.02), "vik", "R", "rest", 0.01); A(r3(S3 - 0.02), "vik", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
// Reaper points up at the dial (his left hand: the clock is on his left), glaring at the late one
c.arm(r3(S3 - 0.02), "rea", "L", { world: W3(-0.84, 1.15, -2.42) }, 0.01); A(r3(S3 - 0.02), "rea", "grip", { side: "L", shape: "point", dur: 0.01 });
A(r3(S3 - 0.02), "rea", "look", { to: [0.8, -0.1], dur: 0.01, blink: false });
act.mood(c, S3, "rea", "angry", { hold: 0.5 });
A(r3(S3 - 0.02), "phx", "look", { to: [-0.6, -0.05], dur: 0.01, blink: false });
const FOLD = { R: { x: [-0.06, 0.3, 0.42] }, L: { x: [0.06, 0.27, 0.45] } };   // hands folded in front of him (waiting)
for (const s of ["R", "L"]) { c.arm(r3(S3 - 0.02), "phx", s, FOLD[s], 0.01); A(r3(S3 - 0.02), "phx", "grip", { side: s, shape: "relaxed", dur: 0.01 }); }
act.mood(c, S3, "phx", "annoyed", { hold: 0.4 });
act.tapFoot(c, 8.8, "phx", { count: 2, every: 0.3 });
cap(S3, 9.3, "40 minutes late?", 300);
A(S3, "vik", "move", { to: VIK3_HALT, dur: 0.45, steps: 2 });
A(S3, "vik", "look", { to: [-0.5, 0.0], dur: 0.01, blink: false });
act.sheepish(c, 8.66, "vik");
A(8.92, "vik", "turn", { to: -15, dur: 0.2 });
halt(9.12, "L", undefined, 440);   // up above the clock: he fills the bottom of this wide (render 1: the subtitle sat on him)
see(S3, 9.35, ["rea.face", "clock", "vik.face"], "Reaper points at the clock: 12:40, Viking arrives");
// THE PAUSE: round behind Reaper's arm to the crank on the post's right side, one and a half quick turns back, the
// hands racing back to 12:00
pauseSounds(P3);
c.arm(9.4, "vik", "L", "rest", 0.25, "inOut"); A(9.4, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(9.42, "vik", "look", { to: [-0.4, 0.4], dur: 0.15, blink: false });
A(9.45, "vik", "expr", { expr: "evil", set: { curve: 0.6 }, dur: 0.25 });
A(9.42, "vik", "turn", { to: -172, dur: 0.3 });
A(9.6, "vik", "move", { to: CRANK_AT, dur: 0.5, steps: 3, ease: "inOut" });
A(10.02, "vik", "look", { to: [-0.3, -0.45], dur: 0.15, blink: false });   // eyes first: down at the crank
A(10.06, "vik", "turn", { to: -90, dur: 0.22 });
// the crank: the knob's middle in the clock's own frame at spin s (turns): [0.155, crankY + R cos, R sin]
const knob = (s) => [0.155, r3(CLOCK.crankY + CLOCK.crankR * Math.cos(s * 2 * Math.PI)), r3(CLOCK.crankR * Math.sin(s * 2 * Math.PI))];
const K0 = 10.42, TURNS = -1.5, KD = 0.54, STEP = 1 / 12;
const PALM = [0.04, CLOCK.crankY, 0];   // the palm faces the post, by the crank's axle: it turns smoothly with the knob
c.arm(10.24, "vik", "L", { prop: "clock", grip: knob(0), palm: PALM }, 0.18, "out"); A(10.24, "vik", "grip", { side: "L", shape: "open", dur: 0.1 });
A(10.36, "vik", "grip", { side: "L", shape: "hold", dur: 0.06 });
for (let k = 1; k <= Math.round(Math.abs(TURNS) / STEP); k++) {
  const s = Math.sign(TURNS) * k * STEP, t0 = r3(K0 + (KD * (k - 1) * STEP) / Math.abs(TURNS));
  c.arm(t0, "vik", "L", { prop: "clock", grip: knob(s), palm: PALM }, r3((KD * STEP) / Math.abs(TURNS)), "linear");
}
c.prop(K0, "clock", { spin: TURNS, time: 12.0 }, KD, "linear");
sfx(K0, "freewheel", { gain: 0.55, dur: KD, reason: "the clock's ratchet ticking fast as he winds the hands back" });
A(10.56, "vik", "look", { to: [-0.3, -0.2], dur: 0.12, blink: false });   // his eyes go round with the knob
A(10.82, "vik", "look", { to: [-0.3, -0.5], dur: 0.12, blink: false });
A(r3(K0 + KD + 0.02), "vik", "grip", { side: "L", shape: "open", dur: 0.08 });
c.arm(r3(K0 + KD + 0.04), "vik", "L", "rest", 0.3, "inOut");
A(11.02, "vik", "look", { to: [0.2, 0.0], dur: 0.12, blink: false });
A(11.04, "vik", "move", { to: VIK3_AFTER, dur: 0.4, steps: 2 });   // two steps away from the post first, the arm down, then the turn
A(11.1, "vik", "turn", { to: -8, dur: 0.45 });   // slow enough that his hands travel under 12 cm a drawing
A(11.36, "vik", "look", { to: [0.0, 0.0], dur: 0.1, blink: false });
A(11.3, "vik", "expr", { expr: "kind", set: { curve: 0.5, eye: 1.05 }, dur: 0.15 });
see(K0, r3(K0 + KD), ["vik"], "the dial in close-up: the hands race back from 12:40 to 12:00 (his glove on the crank below it)");
// time goes on: the innocent whistle; Reaper looks up at the clock and does a double take
c.say(11.55, "vik", "hmm hmm hmm", 0.8, "calm", { ...V, sub: "hm hm hmm...", pos: 300, gain: 1.8 });   // +5 dB: render 1 had it under the bed on a phone   // up top: Reaper fills the bottom of the double take
A(11.55, "rea", "look", { to: [0.3, 0.55], dur: 0.15, blink: false });
act.shock(c, 11.8, "rea", { hold: 0.35 });
A(12.15, "rea", "look", { to: [0.85, 0.0], dur: 0.12, blink: false });
A(11.65, "phx", "look", { to: [-0.6, 0.5], dur: 0.15, blink: false });
act.shock(c, 11.85, "phx", { hold: 0.3, open: 0.15 });
see(11.5, 12.35, ["rea.face", "clock"], "12:00: Reaper's double take at the clock");

// ================================================================ 4 THE TITLE 12.4-14.0
// a wide on all three in a row in front of the clock, Viking in the middle front; he winks at us
setup(S4, "rea", W(-1.0, -2.2), 15); setup(S4, "vik", W(-0.15, -1.45), 0); setup(S4, "phx", W(0.8, -2.15), -35);   // (his S3 facing: a turn at the cut left his folded hands catching up after it)
c.arm(r3(S4 - 0.02), "rea", "L", "rest", 0.01); A(r3(S4 - 0.02), "rea", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
cap(r3(S4 + 0.05), r3(S5 - 0.05), "WHAT IF YOUR FRIEND COULD PAUSE TIME?", 480, true, { size: 96 });   // above their faces (review A)
for (const sd of ["R", "L"]) c.arm(r3(S4 - 0.02), "phx", sd, FOLD[sd], 0.01);   // Phoenix's arms settled in the new setup
A(r3(S4 - 0.02), "rea", "look", { to: [0.6, -0.05], dur: 0.01, blink: false }); act.mood(c, S4, "rea", "annoyed", { hold: 0.9 });
A(r3(S4 - 0.02), "phx", "look", { to: [-0.6, -0.05], dur: 0.01, blink: false });
A(r3(S4 - 0.02), "vik", "look", { to: [0.0, 0.05], dur: 0.01, blink: false });
A(12.45, "vik", "expr", { expr: "cocky", set: { curve: 0.85, smirk: 0.55 }, dur: 0.15 });
A(13.0, "vik", "face", { lidL: 1, dur: 0.06 }); A(13.32, "vik", "face", { lidL: 0, dur: 0.08 });
see(S4, 13.95, ["vik.face", "rea.face", "phx.face"], "the title card over all three, his wink");

// ================================================================ 5 THE TWIST 14.0-18.6
// "But if time stops... light stops too": a dark pause, only his eyes (nothing reaches them). "That's real." He feels
// his way and walks into the clock post: BONK. The light comes back on him flat against it, stars round his head;
// Phoenix laughs, Reaper doesn't. "Would you still want it?"
const VIK5 = W(-1.42, -2.2), VIK5_MID = W(-1.25, -2.48), VIK5_BONK = W(-1.04, -2.68), PHX5 = W(-0.1, -2.1), REA5 = W(0.85, -1.75);
setup(S5, "vik", VIK5, 10); setup(S5, "phx", PHX5, -30); setup(S5, "rea", REA5, -25);
A(r3(S5 - 0.02), "phx", "look", { to: [-0.7, 0.05], dur: 0.01, blink: false }); A(r3(S5 - 0.02), "phx", "expr", { expr: "happy", dur: 0.01 });
for (const s of ["R", "L"]) c.arm(r3(S5 - 0.02), "phx", s, FOLD[s], 0.01);
A(r3(S5 - 0.02), "rea", "look", { to: [-0.8, 0.0], dur: 0.01, blink: false }); A(r3(S5 - 0.02), "rea", "expr", { expr: "deadpan", dur: 0.01 });
A(r3(S5 - 0.02), "vik", "look", { to: [0.05, 0.05], dur: 0.01, blink: false });
A(r3(S5 - 0.02), "vik", "expr", { expr: "cocky", set: { curve: 0.8 }, dur: 0.01 });
cap(S5, 14.65, "But if time stops...", 300);
halt(14.42);
pauseSounds(P5);
cap(14.75, 15.35, "...light stops too.", 300);
cap(15.35, 15.88, "He'd see NOTHING.", 300);
cap(15.88, 16.32, "That's real.", 300);   // off before the BONK!
// in the dark: his eyes go wide, dart about, then he feels his way to the right, into the post
c.arm(14.78, "vik", "R", "rest", 0.25, "inOut"); A(14.78, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(14.8, "vik", "expr", { expr: "terrified", set: { eye: 1.3 }, dur: 0.2 });
A(14.9, "vik", "look", { to: [-0.6, 0.1], dur: 0.12, blink: false });
A(15.15, "vik", "look", { to: [0.6, 0.1], dur: 0.12, blink: false });
A(15.38, "vik", "look", { to: [0.2, -0.1], dur: 0.12, blink: false });
A(15.42, "vik", "turn", { to: 40, dur: 0.18 });   // a crab-step onto the post, his eyes still to us (review B: at 60-85 they went to a sliver)
A(15.55, "vik", "move", { to: VIK5_MID, dur: 0.45, steps: 2, ease: "inOut" });
A(15.62, "vik", "look", { to: [0.6, 0.0], dur: 0.12, blink: false });
A(16.05, "vik", "move", { to: VIK5_BONK, dur: 0.28, steps: 1, ease: "in" });
const BONK = 16.34;
act.impact(c, BONK, "vik", { frames: 0, stop: 0, sound: "pan-bonk", gain: 0.9, shake: 0.03, take: false });
// the take by hand: impact's own take settles the pitch back to 0 at +0.2, and that key front-loaded the anime timing
// past the eyes opening, then the turn's lead-in stepped back: the eyes flickered open for one frame (render 2, 16.53)
A(r3(BONK - 0.15), "vik", "expr", { expr: "shocked", set: { eye: 1.42, open: 0.72, curve: -0.75 }, dur: 0.15 });
A(BONK, "vik", "still", { dur: 0.9, idle: 0.5, fade: 0.05 });
A(r3(BONK + 0.02), "vik", "squash", { amount: 0.26, dur: 0.3 });
A(r3(BONK + 0.03), "vik", "pitch", { to: -8, dur: 0.12, ease: "out" });   // reeling back off the post, and he stays there (review A)
A(r3(BONK + 0.07), "vik", "look", { to: [0, 0.35], dur: 0.08, blink: false });
A(BONK, "vik", "face", { lid: 1, dur: 0.04 });   // the hit in the eyes: they squeeze shut (review B), then open dizzy
A(16.55, "vik", "face", { lid: 0, dur: 0.1 }); A(16.55, "vik", "expr", { expr: "dizzy", dur: 0.15 });
cap(BONK, 16.8, "BONK!", 560, true, { size: 96 });   // the hit for a phone on mute (Jonny's word list has bonk)
see(14.8, 16.1, ["vik.face"], "only his eyes in the dark (he can't see anything)");
// the light comes back: flat against the post, dizzy, stars; Phoenix laughs, Reaper doesn't
A(17.02, "vik", "turn", { to: 10, dur: 0.2 });   // his dizzy face round to us by 17.2, his side still on the post (review B); not before 17.0: its
// lead-in may not start inside the hit's keys (16.19-16.70), or the drawings step back in time
A(17.55, "vik", "look", { to: [0.25, 0.15], dur: 0.35, blink: false });
c.at(16.9, { fx: "sparkle", who: "vik", dur: 1.4, count: 5, color: "#fff2a8" });
// the wide (AFTER): Phoenix laughs, Reaper doesn't, the question
const AFTER = 17.45;
A(r3(AFTER - 0.05), "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 0.2 }, dur: 0.15 });
c.say(r3(AFTER + 0.05), "phx", "HA HA HA!", 0.8, "excited");
c.arm(r3(AFTER - 0.05), "phx", "R", { x: [-0.1, 0.2, 0.42] }, 0.2, "out"); c.arm(r3(AFTER - 0.02), "phx", "L", { x: [0.1, 0.2, 0.42] }, 0.2, "out");   // clutching his belly
A(r3(AFTER + 0.05), "phx", "squash", { amount: 0.06, dur: 0.2 }); A(r3(AFTER + 0.3), "phx", "squash", { amount: -0.02, dur: 0.2 }); A(r3(AFTER + 0.55), "phx", "squash", { amount: 0.05, dur: 0.2 });
A(r3(AFTER + 0.33), "rea", "blink", { dur: 0.35 });   // one slow, unimpressed blink (it also keeps an automatic one off the laugh)
cap(r3(AFTER + 0.05), r3(END - 0.05), "Would you still want it?", 300);
see(16.9, r3(AFTER - 0.05), ["vik.face", "clock"], "the light back on him: reeling off the clock post he wound back");
see(r3(AFTER + 0.05), 18.5, ["vik", "phx.face", "rea.face", "clock"], "the aftermath: Phoenix laughs, Reaper doesn't");
const INSERT_CUP = 5.3;   // the cut to the cup in the air
for (const cp of c.captions) for (const cut of [S2, INSERT_CUP, S3, S4, S5]) if (cp.from < cut && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);
const allowClip = [
  { who: "vik", with: "clock", from: 10.2, to: 11.1, reason: "he turns the crank on the clock's post: the glove closes round its knob" },
  { who: "vik", with: "clock", from: r3(BONK - 0.05), to: END, reason: "the BONK: he walks into the clock post in the dark and stays flat against it" },
  { who: "vik", with: "bench", from: 6.35, to: S3, reason: "Viking sits on the bench" },
  { who: "vik", from: r3(P5[0] + 0.05), to: r3(P5[1] - 0.02), checks: ["rig-jump", "stance-slide", "foot-slide"], reason: "the dark pause: only his eyes are drawn, his body and feet can't be seen" },
  { who: "rea", with: "bench", from: r3(S2 - 0.05), to: S3, reason: "Reaper sits on the bench" },
  { who: "rea", with: "vik", from: 4.55, to: 4.7, checks: ["face-hidden"], reason: "Viking runs in past the bench: for three frames he crosses in front of Reaper, who is only listening (it is Phoenix's line)" },
  { who: "vik", from: GRAB2, to: 6.98, checks: ["foot-slide", "stance-slide"], reason: "he sits down on the bench: the sit lifts him back onto the seat and his feet go with him" },
  { who: "phx", with: "vik", from: 8.72, to: 8.92, checks: ["face-hidden"], reason: "Viking walks in past Phoenix for three frames; Phoenix is only tapping his foot" },
  { who: "vik", from: 9.42, to: 9.75, checks: ["rig-jump", "hand-turn"], reason: "he turns round on the spot to go to the crank: a stepping turn drawn on 2s" },
  { who: "vik", from: 1.45, to: 1.75, checks: ["stance-slide", "foot-slide"], reason: "the stroll's first steps out of the HALT stance, drawn on 2s, at 8 m from the camera: a few px, not visible in the 15 fps strip (render 2)" },
  { who: "phx", from: 8.6, to: 8.72, checks: ["stance-slide"], reason: "Phoenix's foot settling into the tap-foot stance on the clock wide's first frames, 2.4 cm while Viking walks past in front: not visible in the 15 fps strip (render 2)" },
  { who: "vik", from: 6.1, to: 6.98, checks: ["grip-gap"], reason: "the cup on its way to his chest and as he sits, in the coffee wide: 3.5 cm off the glove is about 3 px there, behind his glove; not visible in the 15 fps strips (renders 2 and 3)" },
  { who: "vik", from: 5.66, to: 5.85, checks: ["stance-slide", "foot-slide"], reason: "the last step back under the cup: his left foot lands one drawing after the gait plan says it stands (drawn on 2s); it comes down, it doesn't skate" },
  { who: "phx", from: 1.05, to: 1.55, checks: ["front"], reason: "the selfie: he strolls in BEHIND the frozen photo; Phoenix holds the phone up at the front, which is the picture he sneaks into" },
  ...SNAPS.map((t) => ({ who: "vik", from: r3(t - 0.08), to: r3(t + 0.1), checks: ["rig-jump", "hand-turn"], reason: "HALT!: his arm snaps up in four frames, drawn on 1s, the power's gesture every time" })),
];

// ---------------------------------------------------------------- shots (by hand: the painting's camera range is narrow)
const cam = (pos, look, fov) => ({ pos: W3(...pos), look: W3(...look), fov });
// a wide camera moved in from the painting's eye moves right too (onto the line from the eye through the big tree on
// the right), or the hill painted in behind the tree's crown shows round its edge as a pale halo
const wide = (pos, look, fov) => { const s = cam(pos, look, fov); s.pos[0] = r3(Math.min(0.94, Math.max(s.pos[0], 0.15 * (4.4 - s.pos[2])))); return s; };
const SH = {
  photo: wide([-0.25, 1.5, 3.7], [-0.3, 0.6, -2.4], 48),           // the trio and the road behind them
  take: cam([-0.8, 0.95, 1.6], [-0.8, 0.66, -2.3], 46),          // Viking and Phoenix: the double take
  coffee: wide([0.25, 1.5, 4.6], [0.2, 0.6, -2.4], 48),              // Phoenix, the bench, Viking coming in
  cup: { pos: [0.3, 1.05, -2.6], look: [0.42, 0.95, -5.7], fov: 40 },   // insert: the cup in the air beside his face, Viking backing up to it (review A; re-aimed after render 1)
  hand: { pos: [-0.3, 1.0, -2.3], look: [-0.55, 0.7, -5.65], fov: 44 },   // insert: Phoenix stares at his empty hand (review B)
  bench: { pos: [0.85, 0.95, -1.5], look: [0.85, 0.62, -6.4], fov: 46 },   // the two on the bench and the cup in his toast
  clock: wide([-0.1, 1.5, 3.7], [-0.1, 0.75, -2.3], 48),          // the clock, Reaper pointing, Viking arriving
  dial: { pos: W3(-0.3, 1.42, 0.05), look: W3(-0.6, 1.38, -2.7), fov: 15 },   // insert: the dial, the crank under it (a long lens: the painting allows 8 m in)
  doubletake: cam([-0.85, 1.0, 0.9], [-0.9, 0.92, -2.4], 44),     // Reaper and the clock
  title: wide([-0.15, 1.4, 3.7], [-0.15, 0.8, -2.3], 46),              // wide: all three and the clock
  dark: { ...cam([-0.94, 1.0, 1.8], [-1.0, 0.8, -2.5], 42), to: { pos: W3(-0.94, 1.0, 0.6) }, dur: 2.3 },   // Viking and the post: a push-in through the dark, the eyes grow (review B)
  lightback: cam([-0.94, 1.0, 0.6], [-1.0, 0.8, -2.5], 42),        // where the push-in ends: the light comes back on him
  after: wide([-0.15, 1.7, 3.7], [-0.15, 0.6, -2.3], 50),            // the light back: everyone
};
const beats = c.beats([
  ["photo: late for the photo", 0, SH.photo, "hook"],
  ["photo: the double take", 3.95, SH.take, "reaction"],
  ["coffee: late for coffee", S2, SH.coffee],
  ["coffee: the cup in the air", INSERT_CUP, SH.cup, "insert"],
  ["coffee: he sits", r3(GRAB2 + 0.06), SH.coffee],
  ["coffee: the empty hand", 7.45, SH.hand, "reaction"],
  ["coffee: been here ages", 7.85, SH.bench, "reaction"],
  ["clock: 40 minutes late", S3, SH.clock],
  ["clock: winding back", K0, SH.dial, "insert"],
  ["clock: back to 12", r3(K0 + KD + 0.05), SH.clock],
  ["clock: the double take", 11.5, SH.doubletake, "reaction"],
  ["title", S4, SH.title, "reveal"],
  ["twist: light stops too", S5, SH.dark],
  ["twist: the light back", P5[1], SH.lightback, "payoff"],
  ["twist: would you still want it", AFTER, SH.after, "reaction"],
], END);

const pause = [P1, P2, P3].map(([from, to]) => ({ from, to, keep: ["vik"], origin: "vik", look: "grey" }));
pause[1].props = [{ id: "cup" }];   // the cup in the air stays in colour all pause: the one thing to look at in the grey (review A)
pause.push({ from: P5[0], to: P5[1], keep: ["vik"], origin: "vik", look: "dark" });

write(import.meta.url, {
  id: "pause-time",
  title: "What if your friend could pause time?",
  idea: "What if, episode 1 (format B trial): the always-late friend can stop time; three demos, a title, a real-physics twist",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "env", env: "meadow-path", aperture: FOCUS ? 0.045 : 0, lighting: LIGHTING, hatch: HATCH, cel: CEL, life: LIFE },
  // the bed stops dead in every pause (time stops) and comes back with the world; a drop on the payoff
  music: { style: "bounce", lowCut: 150, gain: 0.3, parts: [
    { at: 0, part: "main" }, { at: P1[0], part: "hush" }, { at: P1[1], part: "main" }, { at: P2[0], part: "hush" }, { at: P2[1], part: "main" },
    { at: P3[0], part: "hush" }, { at: P3[1], part: "main" }, { at: P5[0], part: "hush" }, { at: P5[1], part: "drop" }] },
  sound: { sfx: 0.65, ambience: 0.5, guard: true },
  hook: { show: ["vik", "phx", "rea", "phone"], hint: 0.62, what: "the late friend running at the selfie as the timer beeps; HALT at 0.6 s" },
  pause,
  cast, props: [CLOCK, BENCH, PHONE, CUP], captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/01-pause-time/make-pause-time.mjs.",
});
