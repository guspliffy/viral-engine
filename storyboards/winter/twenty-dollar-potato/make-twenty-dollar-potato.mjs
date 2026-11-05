// THE $20 POTATO (New York clip, 4 Nov 2026). Jonny's brief: /mnt/project-files/ENGINE-PROMPT-20261104T203545-8436.md
// (story library 21-twenty-dollar-potato), his eight panels: /mnt/project-files/storyboard-eight-panels.png. PANELS.md here.
//   node storyboards/winter/twenty-dollar-potato/make-twenty-dollar-potato.mjs   -> twenty-dollar-potato.json
// No burned-in title: Jonny adds it with TikTok's text tool ("The friend who pays $20 for a baked potato").
//
// THE BRIEF
//   Joke:        Viking pays $20 for the famous loaded baked potato; the potato in the box is one of them, and it beams
//                and gives a thumbs-up. Viking is moved to tears, hugs the box, and slaps down another $20.
//   Wants:       Viking wants the famous $20 potato; the friends want to film it, sip, and get in line.
//   Consequence: the friends freeze in horror; Viking cradles the box like a baby.
//   Ending:      "Another one!" with the second $20 under his glove, the box hugged in his other arm, Samurai already
//                sliding a second box across without looking up. Hard cut on it. Nobody knows if he is rescuing them
//                or going for seconds (the comment trigger: don't explain it).
//   Callback:    0 s the first $20 slapped down for food; 11 s the second $20 slapped down, but now for... them?
//
// Times: the brief's times are the video's. The three 3-frame hit-stops each add 0.1 s to the video, so this file's
// clock runs 0.1 s behind the video after the first slap (0.2), 0.2 s behind after the lid pop, and the storyboard
// ends at 10.7 so the video cuts at exactly 11.0. v(t) turns a video time into this clock.
//
// Places (the painted plaza env, camera looking -z; x right, z toward us): the stall on the left (its counter wraps
// round to the right in front of Viking), the line runs back to the right: Phoenix, the Wizard, Reaper.
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const STOPS = [0.2, 3.45, 9.75];                                  // the hit-stops, on this clock
const v = (tv) => r3(tv - 0.1 * STOPS.filter((s) => s + 0.1 * STOPS.indexOf(s) < tv - 1e-6).length);
const END = 10.7;                                                 // 11.0 s of video
const CAP_Y = 1270;  // the subtitles: lower third, on the counter (the brief wants its front; 1300 and lower leave the safe zone)

// ---------------------------------------------------------------- places
const CTOP = 0.3;                                                 // the counter top: at the cast's belts, as in the panels
const COUNTER = { id: "counter", kind: "woodcounter", x: -0.3, z: 0.7, w: 2.2,   // it ends before the Wizard: his spill lands on the plaza in view
  h: CTOP, d: 0.5, garland: true };
const STALL = { id: "stall", kind: "marketstall", x: -1.15, z: 0.3, w: 1.2, h: 2.1, d: 1.0, awning: 0.4, sign: { x: 0.35, y: 1.33, w: 0.7, h: 0.5 }, lines: ["LOADED", "BAKED POTATO", "$20"] };
// a tight cluster as in the panels (review A): Phoenix over Viking's right shoulder, the Wizard in front at the right,
// Reaper at the very back peeking over Viking's left shoulder (a straight line to the right hid him behind the hat)
const VIK = [0.15, 0.0], SAM = [-1.0, -0.05], PHX = [0.9, -2.1], WIZ = [1.12, -0.45], REA = [-0.35, -2.9];
const SAM_YAW = 30, PHX_YAW = -25, WIZ_YAW = -28, REA_YAW = -22;
// the box: a clamshell hinged on its left edge (rot 180: its left is the world's +x, the right of the screen), so the
// open lid stands to the right of the potato in the wide shots and to the left in Viking's own view
const BOX_AT = [-0.85, 0.62], BOX_SERVED = [0.15, 0.64], BOX2_SERVED = [-0.7, 0.62];   // the vendor's arm stays left of the stall's post
const BOX1 = { id: "box1", kind: "clambox", x: BOX_AT[0], y: CTOP, z: BOX_AT[1], rot: 180, hinge: "left", steam: 1 };
const BOX2 = { id: "box2", kind: "clambox", x: BOX_AT[0], y: CTOP, z: BOX_AT[1], rot: 180, hinge: "left", steam: 1, scale: 0.001 };
// the hugged box: the same box worn on Viking's chest from the last cut on (a box held in one arm, the other free)
const BOXW = { id: "box1w", kind: "clambox", wear: "vik", x: 0.0, y: 0.33, z: 0.44, rot: 180, hinge: "left", steam: 0.3, tip: -22, scale: 0.001 };
const BILL1 = { id: "bill1", kind: "bill20", x: -0.1, y: CTOP + 0.2, z: 0.66, rot: 8 };
const BILL2 = { id: "bill2", kind: "bill20", x: -0.3, y: CTOP + 0.24, z: 0.68, rot: -6, scale: 0.001 };
const PHONE = { id: "phone", kind: "phone", style: "iphone", scale: 1.5, ...grips.placeFor("phone", [PHX[0] - 0.3, 0.72, PHX[1] + 0.22], PHX_YAW) };
const CUP = { id: "cup", kind: "cocoacup", ...grips.placeFor("cocoacup", [WIZ[0] + 0.22, 0.36, WIZ[1] + 0.36], WIZ_YAW), steam: 1 };
const SPILL = { id: "spill", kind: "cocoaspill", x: r3(WIZ[0] + 0.11), y: 0, z: r3(WIZ[1] + 0.36), lip: 0.42 };
const APRON = { id: "apron", kind: "apron", wear: "sam", x: 0, y: 0, z: 0, y0: 0.4, y1: 0.07, rx: 0.44, rz: 0.39, arc: 120 };
const TOP = { id: "top", kind: "loadedtop", wear: "spud", x: 0, y: 1.0, z: 0.02, len: 0.36, scale: 0.001 };   // shown with the potato, a little bigger than his fifth size so the topping reads

const cast = [
  { id: "vik", character: "duo/viking", at: VIK, face: 0, expr: "delighted", follow: 0.3, seed: 4.1 },
  { id: "sam", character: "busy/samurai-worker", at: SAM, face: SAM_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "phx", character: "duo/phoenix", at: PHX, face: PHX_YAW, expr: "eager", follow: 0.3, seed: 1.7, span: 0 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: WIZ, face: WIZ_YAW, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA, face: REA_YAW, expr: "kind", follow: 0.3, seed: 3.3 },
  // the loaded potato, a fifth the cast's size, sitting low in the box's cheese (his legs are under the tray floor)
  { id: "spud", character: "winter/loaded-spud", at: BOX_AT, y: CTOP - 0.03, scale: 0.2, face: 180, expr: "serene", follow: 0, seed: 5.2, signature: false },
];
const props = [STALL, COUNTER, BOX1, BOX2, BOXW, BILL1, BILL2, PHONE, CUP, SPILL, APRON, TOP];

// eye targets (screen: + right, + up)
const AT_BILL = [-0.25, -0.75], AT_BOX = [0.05, -0.8], AT_CAM = [0, 0], AT_VIK = [-0.7, -0.2], AT_COUNTER = [-0.5, -0.5];

// ================================================================ 1 ONE PLEASE 0-1.5 (wide): the slap at frame 6
// Viking is mid-slam at frame 0: his right glove comes down with the $20 under it and lands flat on the counter
const PALM_DOWN = { y: [0, 0, 1], z: [0, -1, 0] };               // fingers toward us, the palm onto the note
const onBill = (id) => ({ prop: id, grip: [0, 0.045, -0.01], frame: PALM_DOWN });
c.arm(0, "vik", "R", onBill("bill1"), 0);
c.prop(0, "bill1", { y: CTOP }, 0.2, "in");
A(0, "vik", "pitch", { to: 6, dur: 0.2, ease: "in" });
A(0, "vik", "look", { to: AT_BILL, dur: 0.01, blink: false });
A(0, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.5, eye: 1.15, tilt: 0.2 }, dur: 0.01 });
c.hitStop(STOPS[0]);
c.at(0.2, { fx: "shake", dur: 0.2, amp: 0.02 });
c.at(0.2, { fx: "poof", pos: [BILL1.x, CTOP + 0.02, BILL1.z], dur: 0.35, color: "#fff4d8", puffs: 6, sparks: 5, size: 0.22, lift: 0.04 });
sfx(0.2, "slap", { gain: 0.75 });
A(0.22, "vik", "squash", { amount: 0.08, dur: 0.2 });
A(0.3, "vik", "pitch", { to: 0, dur: 0.35, ease: "settle" });
A(0.35, "vik", "look", { to: [-0.55, -0.05], dur: 0.18, blink: false });       // straight to the vendor: "one, please!"
A(0.05, "vik", "talk", { line: "wun-pleeez!", tone: "excited", dur: 0.85, voice: false });
cap(0.05, v(1.3), "One, please!", CAP_Y);
c.arm(0.75, "vik", "R", "rest", 0.4, "settle");
for (const t of [0.85, 1.2]) A(t, "vik", "squash", { amount: 0.06, dur: 0.18 });   // he can't stand still: little bounces while he waits
// the vendor: deadpan, eyes half shut, he doesn't even look up from the counter until the order
A(0, "sam", "look", { to: [0.4, -0.45], dur: 0.01, blink: false });
A(0, "sam", "face", { lid: 0.55, dur: 0.01 });
act.blinksAt(c, "sam", [0.9, 3.1, 7.6]);
// the line waits behind: Phoenix filming, the Wizard sipping, Reaper at the back
const ph = grips.phone(c, "phx", PHONE, { side: "R", height: 0.42 });
ph.secure(0, 0);
A(0, "phx", "look", { to: [-0.45, -0.1], dur: 0.01, blink: false });
const cup = grips.mug(c, "wiz", CUP, { side: "L" });   // his left hand: the right one would reach into Phoenix
cup.secure(0, 0);
cup.carry(0.3, [r3(CUP.x + 0.05), 0.5, r3(CUP.z + 0.08)], 0.35);
c.prop(0.6, "cup", { tip: 18 }, 0.25);
cup.carry(1.05, [CUP.x, CUP.y, CUP.z], 0.35);
c.prop(1.05, "cup", { tip: 0 }, 0.25);
A(0.9, "wiz", "look", { to: [-0.5, -0.3], dur: 0.12 });
A(0.45, "wiz", "expr", { expr: "serene", dur: 0.2 }); A(1.05, "wiz", "expr", { expr: "happy", dur: 0.25 });
A(0, "wiz", "look", { to: [-0.6, -0.2], dur: 0.01, blink: false });
A(0, "rea", "look", { to: [-0.7, -0.15], dur: 0.01, blink: false });
act.blinksAt(c, "rea", [1.3, 5.0]);
act.blinksAt(c, "phx", [1.9]);
// the potato in the closed box is hidden until the lid opens
A(0, "spud", "hide");
A(0, "spud", "ride", { prop: "box1", off: [0, -0.03, 0], yaw: 0, dur: 0 });
see(0, 1.4, ["vik.face", "sam.face", "bill1", "stall"], "frame 0: the $20 slapped on the counter under the LOADED BAKED POTATO $20 sign");

// ================================================================ 2 THE BOX 1.5-3.0 (same wide, a slow push)
// Samurai slides one closed, steaming box across with one flat glove, lets go, and it glides on to Viking
const S1 = v(1.5);
const PALM_PUSH = { y: [-1, 0, 0], z: [0, -1, 0] };               // box frame (rot 180): fingers toward Viking (+x world)
c.arm(S1 - 0.45, "sam", "L", { prop: "box1", grip: [0.0, 0.15, 0.0], frame: PALM_PUSH, off: [0, 0.06, 0] }, 0.4, "inOut");   // he is already reaching as the shot changes
c.arm(S1 + 0.15, "sam", "L", { prop: "box1", grip: [0.0, 0.15, 0.0], frame: PALM_PUSH }, 0.12, "out");
A(S1 - 0.6, "sam", "look", { to: [-0.1, -0.6], dur: 0.15 });
A(S1, "sam", "look", { to: [0.0, -0.62], dur: 0.1 });              // and along the counter as he pushes   // eyes first, down to the box
c.prop(S1 + 0.3, "box1", { x: -0.68 }, 0.3, "in");                   // a shove inside his stall, then it glides on its own
sfx(S1 + 0.3, "ai-package/cardboard-rustle", { gain: 0.08, reason: "the takeaway box slides along the wooden counter" });
c.arm(S1 + 0.6, "sam", "L", "rest", 0.4, "settle");
c.prop(S1 + 0.6, "box1", { x: BOX_SERVED[0], z: BOX_SERVED[1] }, 0.45, "out");
A(S1 + 0.65, "sam", "look", { to: [0.4, -0.45], dur: 0.2 });
// Viking's eyes sparkle, he leans in over it; Phoenix lifts his phone higher, the Wizard leans in to look
A(S1 + 0.6, "vik", "look", { to: AT_BOX, dur: 0.2 });
A(S1 + 0.7, "vik", "expr", { expr: "delighted", set: { eye: 1.3, pupil: 1.3, open: 0.45, curve: 1 }, dur: 0.25 });
c.at(S1 + 0.8, { fx: "sparkle", who: "vik", dur: 0.9, count: 5, color: "#fff2a8" });
A(S1 + 0.75, "vik", "pitch", { to: 9, dur: 0.4, ease: "inOut" });
ph.carry(S1 + 0.2, [r3(PHONE.x - 0.03), 0.84, r3(PHONE.z + 0.04)], 0.4);   // higher, still beside his face
A(S1 + 0.05, "phx", "look", { to: [-0.4, -0.25], dur: 0.2 });
A(S1 + 0.8, "wiz", "lean", { to: -8, dur: 0.4, ease: "inOut" });
A(S1 + 0.8, "wiz", "look", { to: [-0.65, -0.35], dur: 0.2 });
A(S1 + 0.9, "rea", "lean", { to: -6, dur: 0.4, ease: "inOut" });
see(S1 + 0.7, v(3.0) - 0.1, ["vik.face", "box1", "phx.face"], "the box arrives, Viking's eyes sparkle, Phoenix films higher");

// ================================================================ 3 LID 3.0-4.2 (closer medium, same side)
// his right glove on the lid's free edge, the left steadying the box; the lid pops up and swings over its hinge, steam
// bursts out (hit-stop 2)
const S3 = v(3.0);
const box = grips.box(c, "vik", { ...BOX1, x: BOX_SERVED[0], z: BOX_SERVED[1] }, { height: 1.0 });   // high on the ends: the fingers stay above the counter
// the lid's free edge in the box's own frame (hinge on its -x edge, the lid 0.284 wide), at an angle a (degrees)
const lidEdge = (a, z = 0, u = 1) => { const k = (a * Math.PI) / 180; return [r3(-0.142 + 0.284 * u * Math.cos(k) + 0.012), r3(0.078 + 0.284 * u * Math.sin(k) + 0.03), z]; };   // u: how far out along the lid
const LID_HAND = { y: [0, 0, -1], z: [0, -1, 0] };                // box frame: fingers away from him, palm down on the lid edge
c.arm(S3 - 0.05, "vik", "R", { prop: "box1", grip: lidEdge(0), frame: LID_HAND, off: [0, 0.06, 0] }, 0.25, "inOut");
c.arm(S3 + 0.2, "vik", "R", { prop: "box1", grip: lidEdge(0), frame: LID_HAND }, 0.12, "out");
c.arm(S3, "vik", "L", { prop: "box1", grip: [-0.19, 0.1, 0], palm: true }, 0.3, "inOut");
A(S3, "vik", "pitch", { to: 12, dur: 0.3, ease: "inOut" });
A(S3 - 0.2, "vik", "look", { to: [-0.1, -0.7], dur: 0.15, blink: false });
c.prop(S3 + 0.32, "box1", { open: 0.1 }, 0.1, "in");
c.arm(S3 + 0.32, "vik", "R", { prop: "box1", grip: lidEdge(12), frame: LID_HAND }, 0.1, "in");
// the pop: the lid flips open, the hand springs off it
c.prop(STOPS[1], "box1", { open: 1, steam: 1 }, 0.14, "out");
c.hitStop(STOPS[1]);
sfx(STOPS[1], "pop", { gain: 0.55 });
c.at(STOPS[1], { fx: "poof", pos: [BOX_SERVED[0], CTOP + 0.14, BOX_SERVED[1]], dur: 0.5, color: "#ffffff", puffs: 7, sparks: 0, size: 0.12, lift: 0.02 });   // small and low: it must not cross his eyes
c.at(STOPS[1], { fx: "shake", dur: 0.15, amp: 0.012 });
c.arm(STOPS[1] + 0.02, "vik", "R", { o: [-0.4, 0.24, 0.36] }, 0.18, "out");
A(STOPS[1], "spud", "show");
c.prop(STOPS[1], "top", { scale: 0.3 }, 0.01);                     // his cheese, sour cream and chives, at his size
c.prop(STOPS[1], "box1", { cheese: 1 }, 0.01);
A(STOPS[1], "vik", "expr", { expr: "delighted", set: { eye: 1.25, open: 0.7, curve: 0.9 }, dur: 0.1 });
// the friends lean in further
A(S3 + 0.4, "phx", "lean", { to: -10, dur: 0.35, ease: "inOut" });
A(S3 + 0.45, "wiz", "lean", { to: -12, dur: 0.35, ease: "inOut" });
A(S3 + 0.5, "rea", "lean", { to: -10, dur: 0.35, ease: "inOut" });
// both gloves come down flat on the counter at the box's near corners: in his own view the box sits between his fur
// cuffs and mittens (the brief, panels 4 and 5). Box frame (rot 180): +x is his right, +z toward him.
const BESIDE = (sx) => ({ prop: "box1", grip: [r3(sx * 0.19), 0.065, 0.07], frame: { y: [0, 0, -1], z: [0, -1, 0] } });
A(STOPS[1] + 0.05, "vik", "look", { to: AT_BOX, dur: 0.12, blink: false });
c.arm(STOPS[1] + 0.2, "vik", "R", BESIDE(1), 0.35, "settle");
for (const sd of ["R", "L"]) A(STOPS[1] + 0.3, "vik", "grip", { side: sd, shape: "open", dur: 0.2 });   // flat mittens, the fingers out straight
c.arm(STOPS[1] + 0.1, "vik", "L", BESIDE(-1), 0.35, "settle");
see(S3 + 0.2, v(4.2) - 0.1, ["vik.face", "box1"], "the lid pops, steam bursts out");

// ================================================================ 4 IT'S ONE OF US 4.2-6.0 (Viking's own view, down into the box)
// record scratch, the music stops; the potato in the cheese opens his eyes, beams up at Viking and gives a thumbs-up
const S4 = v(4.2);
A(S4, "vik", "pov");
sfx(S4, "recordscratch", { gain: 0.85 });
sfx(S4 + 0.15, "bubbling", { gain: 0.18, dur: 1.6, reason: "the cheese sauce bubbles gently round the potato in the box" });
sfx(S4 + 0.1, "ridewind", { gain: 0.09, dur: 1.7, reason: "a cold winter breeze over the silent plaza" });
A(0, "spud", "look", { to: AT_CAM, dur: 0.01, blink: false });
act.blinksAt(c, "spud", []);
A(S4 + 0.25, "spud", "expr", { expr: "kind", set: { eye: 1.0, curve: 0.6 }, dur: 0.15 });   // the eyes pop open (shut till 4.45)
A(S4 + 0.25, "spud", "squash", { amount: 0.05, dur: 0.2 });
A(S4 + 0.6, "spud", "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 1.05 }, dur: 0.2 });   // beams
c.at(S4 + 0.75, { fx: "sparkle", who: "spud", dur: 0.4, count: 3, color: "#fff2a8" });   // the thumbs-up lands (panel 5's strokes)
// the thumbs-up, locked in the box's frame: the thumb toward the top of Viking's view (up and away from him), the
// knuckles toward his eyes, the palm in (Real Footage of Hell: a thumbs-up only reads locked to a frame)
const THUMB_POV = { prop: "box1", grip: [-0.075, 0.2, 0.02], frame: { y: [0, 0.84, 0.55], z: [1, 0, 0] } };   // box frame (rot 180): knuckles up at his eyes, palm in, thumb to the top of his view
A(S4 + 0.4, "spud", "look", { to: [0.05, 0.05], dur: 0.12, blink: false });
A(S4 + 0.55, "spud", "grip", { side: "R", shape: "thumb", dur: 0.2 });
c.arm(S4 + 0.55, "spud", "R", THUMB_POV, 0.25, "settle");
sfx(v(5.0), "ding", { gain: 0.3, reason: "one tiny cheerful chime as the thumbs-up lands (5.0)" });
A(S4 + 0.8, "spud", "still", { dur: 0.95, idle: 0.04 });
see(v(5.0), v(6.0) - 0.05, ["spud.face", "box1"], "the potato's beaming face and the thumbs-up, from Viking's view");

// ================================================================ 5 HORROR 6.0-8.0 (wide, held still)
const S5 = v(6.0);
A(S5, "vik", "pov", { on: false });
// the potato turns to the friends and keeps the thumbs-up (the turn is the cause of his face toward us)
A(S5 - 0.12, "spud", "look", { to: [0.1, 0], dur: 0.1, blink: false });
A(S5 + 0.05, "spud", "turn", { to: 0, dur: 0.3 });   // riding: the turn adds to his heading in the box (180: facing Viking)
const THUMB_FRONT = { prop: "box1", grip: [0.075, 0.15, -0.01], frame: { y: [0, 0, -1], z: [-1, 0, 0] } };   // box frame: knuckles to the camera, palm in, the thumb straight up
c.arm(S5 + 0.05, "spud", "R", THUMB_FRONT, 0.3, "inOut");
// the friends' horror, held for 1.5 s: phone lowers, the cup tilts and dribbles, Reaper's eyes go wide
act.shock(c, S5 + 0.05, "phx", { open: 0.7, eye: 1.4, brow: 0.5, hold: 1.6 });
act.shock(c, S5 + 0.1, "wiz", { open: 0.8, eye: 1.35, brow: 0.5, hold: 1.6 });
act.shock(c, S5 + 0.12, "rea", { open: 0.35, eye: 1.5, brow: 0.55, hold: 1.6 });
for (const w of ["phx", "wiz", "rea"]) A(S5, w, "lean", { to: 0, dur: 0.3, ease: "out" });
A(S5 + 0.05, "phx", "look", { to: [-0.45, -0.35], dur: 0.12, blink: false });
A(S5 + 0.05, "wiz", "look", { to: [-0.6, -0.4], dur: 0.12, blink: false });
A(S5 + 0.05, "rea", "look", { to: [-0.7, -0.35], dur: 0.12, blink: false });
sfx(S5 + 0.1, "gasp", { gain: 0.6, reason: "the friends gasp at the potato in the box" });
ph.carry(S5 + 0.3, [r3(PHONE.x - 0.04), 0.62, r3(PHONE.z + 0.06)], 1.3);   // stops filming, still over Viking's head
A(S5 + 0.4, "phx", "lean", { to: 6, dur: 0.6, ease: "inOut" });
c.prop(S5 + 0.1, "cup", { tip: 62 }, 0.5, "inOut");
c.prop(S5 + 0.4, "spill", { pour: 1 }, 0.25, "linear");
c.prop(S5 + 0.55, "spill", { pool: 1 }, 1.0, "out");
act.emote(c, S5 + 0.3, "wiz", "?!", { dur: 1.2 });
for (const [t, g] of [[S5 + 0.65, 0.12], [S5 + 0.95, 0.1], [S5 + 1.3, 0.1]]) sfx(t, "ai/drip", { gain: g, reason: "hot chocolate dribbling from the Wizard's tipped cup onto the snow" });
// the vendor: nothing at all
A(S5, "sam", "look", { to: [0.4, -0.45], dur: 0.01 });
// Viking: his eyes well up, the open box on the counter in front of him
A(S5, "vik", "look", { to: AT_BOX, dur: 0.01, blink: false });
A(S5 + 0.2, "vik", "expr", { expr: "sad", set: { curve: 0.15, eye: 1.15, pupil: 1.25, tilt: 0.55, open: 0.1 }, dur: 0.4 });
A(S5 + 0.3, "vik", "face", { tearL: 1, tearR: 1, dur: 0.9 });
see(S5 + 0.2, v(8.0) - 0.1, ["phx.face", "wiz.face", "rea.face", "spud.face", "vik.face", "stall"], "the whole line frozen in horror, the happy potato in the open box");

// ================================================================ 6 HE'S MINE NOW 8.0-9.8 (medium on Viking)
// he closes the lid gently with his left glove, then lifts the box and cradles it against his chest
const S6 = v(8.0);
const LID_CLOSE = { y: [0, 0, -1], z: [0, -1, 0] };
A(S6 - 0.2, "vik", "look", { to: [0.05, -0.75], dur: 0.12, blink: false });   // eyes to the lid first
c.arm(S6, "vik", "R", "rest", 0.3, "settle");
c.arm(S6 - 0.05, "vik", "L", { prop: "box1", grip: lidEdge(112, 0, 0.4), frame: LID_CLOSE, off: [0, 0.04, 0] }, 0.2, "inOut");
for (const [k, a, u] of [[0, 112, 0.4], [1, 70, 0.5], [2, 30, 0.7], [3, 0, 1]]) c.arm(S6 + 0.15 + k * 0.15, "vik", "L", { prop: "box1", grip: lidEdge(a, 0, u), frame: LID_CLOSE }, 0.15, "inOut");   // halfway up the lid, sliding out to its edge as it comes down
c.prop(S6 + 0.15, "box1", { open: 0, steam: 0.5 }, 0.45, "inOut");
c.arm(S6 - 0.1, "spud", "R", "rest", 0.25, "inOut");             // he settles back down as the lid comes over
A(S6 + 0.55, "spud", "hide");
c.prop(S6 + 0.55, "top", { scale: 0.001 }, 0.01);
sfx(S6 + 0.6, "latch-click", { gain: 0.3, reason: "the clamshell lid clicks shut" });
c.prop(S6 + 0.6, "box1", { cheese: 0 }, 0.01);
box.secure(S6 + 0.68, 0.32);   // straight onto its ends (an open-hand approach read as hands up beside his face)
box.carry(S6 + 1.05, [VIK[0], CTOP + 0.01, 0.5], 0.35, "inOut");   // pulled in against his belt on the counter's back edge: the face clear above it
A(S6 + 0.05, "vik", "look", { to: [0, -0.55], dur: 0.2 });
A(S6 + 0.5, "vik", "look", { to: [0, -0.7], dur: 0.12 });                     // and down to the box before he takes it
A(S6 + 0.3, "vik", "face", { tearL: 1, tearR: 1, dur: 0.6 });
A(S6 + 0.5, "vik", "expr", { expr: "sad", set: { curve: 0.45, eye: 1.05, pupil: 1.3, tilt: 0.6, open: 0 }, dur: 0.4 });   // a teary, wobbly smile
for (let i = 0; i < 5; i++) A(S6 + 0.6 + i * 0.16, "vik", "face", { cornerL: i % 2 ? 0.05 : -0.12, cornerR: i % 2 ? -0.12 : 0.05, dur: 0.08 });   // the lip trembles
for (const [t, l] of [[S6 + 1.4, 5], [S6 + 1.6, -4]]) A(t, "vik", "lean", { to: l, dur: 0.2, ease: "inOut" });   // rocks it like a baby
// the friends slowly turn to look at each other
A(S6 + 0.6, "phx", "look", { to: [0.6, -0.1], dur: 0.35 });
A(S6 + 0.7, "phx", "turn", { to: -5, dur: 0.5 });
A(S6 + 0.75, "wiz", "look", { to: [-0.6, 0.1], dur: 0.35 });
A(S6 + 0.9, "rea", "look", { to: [-0.6, 0.0], dur: 0.35 });
see(S6 + 0.4, v(9.8) - 0.1, ["vik.face", "box1"], "Viking closes the lid and cradles the box, teary and smiling");

// ================================================================ 7 ANOTHER ONE 9.8-11.0 (wide): the second slap (hit-stop 3)
const S7 = v(9.8);
// the cut: the hugged box is now worn on his chest under his left arm; his right glove is up with the second $20
box.release(S7 - 0.04, { rest: false, back: 0.01 });
c.prop(S7 - 0.02, "box1", { scale: 0.001 }, 0.01); c.prop(S7 - 0.02, "box1w", { scale: 1 }, 0.01);
c.arm(S7, "vik", "L", { prop: "box1w", grip: [-0.19, 0.13, 0.0], palm: true }   /* worn rot 180: -x is his left */, 0);
c.prop(S7 - 0.02, "bill2", { scale: 1 }, 0.01);
c.arm(S7, "vik", "R", onBill("bill2"), 0);
c.prop(S7, "bill2", { y: CTOP }, STOPS[2] - S7, "in");
A(S7, "vik", "pitch", { to: 6, dur: STOPS[2] - S7, ease: "in" });
A(S7, "vik", "look", { to: [-0.5, -0.1], dur: 0.01, blink: false });
A(S7, "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.7, eye: 1.0, tilt: 0.45 }, dur: 0.01 });
A(S7, "vik", "face", { tearL: 1, tearR: 1, dur: 0.01 });
c.hitStop(STOPS[2]);
c.at(STOPS[2], { fx: "shake", dur: 0.22, amp: 0.025 });
c.at(STOPS[2], { fx: "poof", pos: [BILL2.x, CTOP + 0.02, BILL2.z], dur: 0.35, color: "#fff4d8", puffs: 6, sparks: 5, size: 0.22, lift: 0.04 });
sfx(STOPS[2], "slap", { gain: 0.95 });
A(STOPS[2] + 0.02, "vik", "squash", { amount: 0.08, dur: 0.2 });
A(S7 - 0.1 + 0.15, "vik", "talk", { line: "a-nuh-thuh-wun!", tone: "excited", dur: 0.85, voice: false });
cap(v(9.85), v(10.8), "Another one!", CAP_Y);
// the friends' jaws drop further; the vendor is already sliding a second box across without looking up
c.prop(S7 - 0.02, "box2", { scale: 1 }, 0.01);
A(S7, "sam", "look", { to: [0.1, -0.65], dur: 0.01 });
c.arm(S7, "sam", "L", { prop: "box2", grip: [0.0, 0.15, 0.0], frame: PALM_PUSH }, 0);
c.prop(S7 + 0.1, "box2", { x: BOX2_SERVED[0] }, 0.25, "in");                      // a shove inside the stall...
c.arm(S7 + 0.38, "sam", "L", "rest", 0.4, "settle");
c.prop(S7 + 0.35, "box2", { x: -0.48 }, 1.1, "out");                              // ...and it is still gliding on the cut (no done pose)
for (const [w, o] of [["phx", 1], ["wiz", 1], ["rea", 0.6]]) A(S7, w, "expr", { expr: "shocked", set: { open: o, eye: 1.45 }, dur: 0.01 });
for (const w of ["phx", "wiz", "rea"]) A(STOPS[2] + 0.03, w, "squash", { amount: 0.06, dur: 0.2 });
A(S7, "phx", "look", { to: [-0.45, -0.35], dur: 0.01, blink: false });
A(S7, "wiz", "look", { to: [-0.6, -0.4], dur: 0.01, blink: false });
A(S7, "rea", "look", { to: [-0.7, -0.35], dur: 0.01, blink: false });
see(STOPS[2], END - 0.05, ["vik.face", "bill2", "box1w", "box2", "phx.face", "wiz.face", "rea.face"], "the payoff: another $20, the box hugged, the friends' jaws dropped, the second box coming");

// the props already in hand at frame 0 make no grab sound (the engine skips grabs at the very start)
for (const it of c.items) if (it.do === "grab" && it.at <= 0.07) it.at = 0;

// ---------------------------------------------------------------- shots: [name, start, camera, kind]
const WIDE = { pos: [0.05, 2.3, 5.3], look: [0.05, 0.95, 0.0], fov: 48 };   // high, as in the panels: the faces behind rise over the heads in front
const WIDE_PUSH = { ...WIDE, to: { pos: [0.05, 2.2, 4.9], look: [0.05, 0.95, 0.0] }, dur: 1.5, ease: "inOut" };
const LIDCAM = { pos: [0.15, 1.25, 2.9], look: [0.15, 0.5, 0.2], fov: 42 };
const POV = { pos: [0.15, 0.92, 0.05], look: [0.15, 0.33, 0.64], fov: 40 };   // from his eyes: his arms come in from the bottom corners
const MED = { pos: [0.15, 1.3, 2.7], look: [0.15, 0.5, 0.1], fov: 40 };   // from a little higher: the cradled box sits under his mouth (review B)
const beats = c.beats([
  ["1 one please", 0, WIDE, "hook"],
  ["2 the box", S1, WIDE_PUSH],
  ["3 lid", S3, LIDCAM],
  ["4 it's one of us", S4, POV, "reveal"],
  ["5 horror", S5, WIDE, "reaction"],
  ["6 he's mine now", S6, MED],
  ["7 another one", S7, WIDE, "payoff"],
], END);

write(import.meta.url, {
  id: "twenty-dollar-potato",
  title: "The friend who pays $20 for a baked potato",
  idea: "New York clip (4 Nov 2026): Viking pays $20 for the famous loaded baked potato at the winter market; the potato is one of them",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "sheet",
  motion: "natural",
  set: { type: "env", env: "bryant-park-winter-village", aperture: 0, focus: false },
  music: { style: "funk", sleigh: true, lead: "bell", gain: 0.32, payoff: STOPS[2], parts: [{ at: 0, part: "main" }, { at: S4, part: "hush" }, { at: S5, part: "musicbox" }, { at: STOPS[2], part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "stone" },
  hook: { show: ["vik", "sam", "bill1"], hint: 0, what: "Viking slaps a $20 on the counter under the $20 baked potato sign" },
  creative: { length: [10, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "box1", from: 0, to: r3(END + 0.5), reason: "the loaded potato sits in the takeaway box's cheese (his lower half below the tray floor)" },
    { who: "spud", with: "counter", from: 0, to: r3(END + 0.5), reason: "his hidden lower half goes into the counter under the box" },
    { who: "spud", with: "top", from: 0, to: r3(END + 0.5), reason: "the cheese, sour cream and chives sit on the potato himself" },
    { who: "sam", with: "apron", from: 0, to: r3(END + 0.5), reason: "the striped apron is worn by the Samurai" },
    { who: "sam", with: "stall", from: 0, to: r3(END + 0.5), reason: "the vendor stands inside his stall" },
    { who: "vik", with: "box1w", from: S7 - 0.05, to: r3(END + 0.5), reason: "Viking hugs the closed box against his chest" },
  ],
  notes: "Generated by storyboards/winter/twenty-dollar-potato/make-twenty-dollar-potato.mjs.",
});
