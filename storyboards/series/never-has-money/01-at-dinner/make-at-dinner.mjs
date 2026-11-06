// THAT ONE FRIEND WHO NEVER HAS MONEY… AT DINNER (never has money, episode 1, 6 Nov 2026), from the clip template.
//   node storyboards/series/never-has-money/01-at-dinner/make-at-dinner.mjs -> at-dinner.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/01-at-dinner-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/01-at-dinner/ there (PANELS.md here).
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper, the Samurai as the counter man)
//   Joke:        Gunslinger ordered the biggest thing on the menu. The bill lands; the pocket pat finds a moth. All he
//                has is a button: he lays it on the tray. The Samurai's flat palm says no. Gunslinger nudges the tray
//                along the counter to Reaper with one finger, whistling; it slides back and forth, faster each time.
//   Wants:       Gunslinger wants someone else to pay.
//   Consequence: Reaper sighs and taps his card; Gunslinger steals his last fry.
//   Ending:      the wink, "Next time's on me!", Reaper's left eye twitching; the Samurai flicks the button into the tip jar.
//   Callback:    frame 0 the bill slides in front of Gunslinger; the last frame it has gone to the Samurai, paid by
//                Reaper, and the button (his only "money") ends up as the tip.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the flat palm "no", the card tap) add 0.2 s: 9.8 s of story = exactly 10.0 s of video
const HS1 = 3.8, HS2 = 7.2, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- places (x right, z toward the camera)
// The counter runs across the frame; the three friends stand behind it (the customers' side, -z) facing the camera,
// left to right Wizard, Gunslinger, Reaper (as in the panels). The counter man works on the camera's side (+z) and
// stays off the friends' faces: at the counter's right end in the wide, across from Gunslinger only for the two
// over-the-shoulder shots (panels 3-4), back at the end after.
const CH = 0.38, CZ = 0;                     // the counter's top and its middle (it is 0.6 deep: z -0.3 .. 0.3)
const FZ = -0.7;                            // the friends' line, a hand's width behind the counter
const WIZ = [-1.22, FZ], GSL = [0, FZ], REA = [1.1, -0.73];
const WIZ_YAW = 10, GSL_YAW = 0, REA_YAW = -10;
const SAM0 = [1.5, 0.98], SAM1 = [0.95, 0.82], SAM2 = [1.95, 1.05], SAM3 = [1.9, 0.64];
const SAM0_YAW = -75, SAM1_YAW = -148, SAM3_YAW = -125;
// the tray's spots: in front of Gunslinger, at the counter man (panel 4), in front of Reaper, at the counter's end
const LANE = -0.15;
const T_G = [0.05, LANE], T_S = [0.66, 0.13], T_R = [0.98, LANE], T_E = [1.38, 0.1];
const TRAY_Y = CH, TOP = r3(CH + 0.009);     // the tray's floor (the bill and the button lie on it)
// on the counter: the Wizard's salad, Gunslinger's empty plate and milkshake glass, Reaper's fry basket, the
// condiments, the tip jar, the card terminal
const SALAD = [-1.12, 0.04], PLATE = [-0.32, 0.14], SHAKE = [-0.27, -0.21], BASKET = [0.6, 0.04], SHAKE_K = 0.62;
const JAR = [1.12, 0.2], TERM = [1.4, -0.14];

const cast = [
  { id: "wiz", character: "never-has-money/wizard", at: WIZ, face: WIZ_YAW, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "gsl", character: "never-has-money/gunslinger", at: GSL, face: GSL_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM0, face: SAM0_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
];
const FRY = { id: "fry", kind: "fry", x: r3(BASKET[0] - 0.01), y: r3(CH + 0.035), z: BASKET[1], tip: 8, tilt: -25, rot: 202, scale: 1.5, staged: "propped up on the crumpled paper in the fry basket" };   // sticking up out of the basket
const SHAKE_SPEC = { id: "shake", kind: "milkshake", x: SHAKE[0], y: CH, z: SHAKE[1], rot: 180, scale: SHAKE_K };   // a soda glass at potato size: the straws at his mouth
const BK = 2;   // the button drawn 2x (6.4 cm across, a coat button): it must read at phone size below his pinch and in the wide ending
const BUTTON = { id: "button", kind: "button", x: 0.08, y: 0.47, z: r3(FZ + 0.34), rot: 0, color: "#22a89e", scale: 0.001, staged: "tucked under his bandana until he pulls it out" };
const CARD = { id: "card", kind: "paycard", x: r3(REA[0] + 0.1), y: 0.62, z: r3(REA[1] + 0.5), rot: r3(REA_YAW), scale: 0.001, staged: "inside Reaper's robe until he draws it" };
const props = [
  // copper dome pendant lamps over the counter (panels 1, 3, 5-8), out of the way of every hat
  { id: "lamp1", kind: "pendant", x: -0.7, y: 1.88, z: -0.25, len: 1.2 },
  { id: "lamp2", kind: "pendant", x: 0.5, y: 1.92, z: -0.2, len: 1.2 },
  { id: "lamp3", kind: "pendant", x: 1.65, y: 1.88, z: -0.25, len: 1.2 },
  { id: "floor", kind: "checkerfloor", x: 0.5, z: 1.5, w: 9, d: 8.2, tile: 0.32 },
  { id: "counter", kind: "dinercounter", x: 0, z: CZ, w: 3.2, d: 0.6, h: CH },
  { id: "tray", kind: "billtray", x: 0.62, y: TRAY_Y, z: LANE, rot: 90 },
  { id: "bill", kind: "receipt", x: 0.62, y: r3(TOP + 0.002), z: LANE, rot: 90 },
  { id: "plate", kind: "dinnerplate", x: PLATE[0], y: CH, z: PLATE[1], r: 0.1, crumbs: 12, seed: 6 },
  { id: "pick", kind: "burgerpick", x: r3(PLATE[0] + 0.02), y: r3(CH + 0.016), z: PLATE[1], rot: 30, tip: -84 },
  SHAKE_SPEC,
  { id: "salad", kind: "saladbowl", x: SALAD[0], y: CH, z: SALAD[1], seed: 4 },
  { id: "basket", kind: "frybasket", x: BASKET[0], y: CH, z: BASKET[1], n: 0, seed: 5, rot: 10 },
  FRY,
  { id: "cond", kind: "condiments", x: -0.62, y: CH, z: -0.16, rot: 8 },
  { id: "jar", kind: "tipjar", x: JAR[0], y: CH, z: JAR[1] },
  { id: "term", kind: "cardterminal", x: TERM[0], y: CH, z: TERM[1], rot: -160 },
  { id: "staffP", kind: "parkedstaff", x: -1.75, y: 0.5, z: -0.38, tip: 7, rot: 0 },
  { id: "napkin", kind: "napkin", wear: "gsl", x: 0, y: 0.6, z: 0.31, w: 0.26, h: 0.22 },
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, y0: 0.4, y1: 0.07, rx: 0.44, rz: 0.39, arc: 130 },
  { id: "hat", kind: "paperhat", wear: "sam", x: 0, y: 1.02, z: 0.02, scale: 1.0 },
  ...patProps({ who: "gsl", at: GSL, yaw: GSL_YAW }),
  BUTTON, CARD,
];

// subtitles: inside y 470-1360 (TikTok's safe zone and clear of Jonny's in-app title), placed per shot off the faces
// Gunslinger's right hand rests in front of him, not at his hip (the wallet is in the holster there)
const GR = { o: [0.0, 0.33, 0.14] };
const SUB_LOW = 1240, SUB_HIGH = 600;   // low on the counter in the wide, high over the hats in the closer shots

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// frame 0: the bill tray is already sliding down the counter from the counter man's hand and stops in front of
// Gunslinger, who is frozen mid-slurp on his empty milkshake; the Wizard and Reaper turn to him
sfx(0, "put-down", { gain: 0.5, reason: "the bill tray clacks down on the counter as it is sent sliding" });
sfx(0.02, "ai/bowl-scrape", { gain: 0.25, dur: 0.38, reason: "the tray sliding along the counter top" });
c.prop(0, "tray", { x: T_G[0] }, 0.38, "out"); c.prop(0, "bill", { x: T_G[0] }, 0.38, "out");
// the counter man's right hand coming back from the push
c.arm(0, "sam", "R", { o: [0.2, 0.42, 0.4] }, 0, "out"); c.arm(0.05, "sam", "R", "rest", 0.4, "inOut");
A(0, "sam", "grip", { side: "R", shape: "flat", dur: 0 }); A(0.3, "sam", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(0, "sam", "look", { to: [-0.3, -0.15], dur: 0, blink: false }); A(0, "sam", "face", { lid: 0.4, dur: 0 });
c.say(0.05, "sam", "your bill.", 0.5, "calm", { voice: false, sub: "Your bill.", pos: SUB_LOW });
// Gunslinger, napkin tucked into his bandana, leaned in on the straw (both hands round the glass), slurping; he freezes,
// his eyes slide to the bill, then he straightens up
A(0, "gsl", "lean", { to: 9, dur: 0 });
A(0, "gsl", "look", { to: [0.0, -0.45], dur: 0, blink: false });
A(0, "gsl", "expr", { expr: "eager", set: { pucker: 0.9, open: 0, curve: 0.1 }, dur: 0 });
const shakeHold = grips.mug(c, "gsl", SHAKE_SPEC, { side: "R", height: 0.5 }).hands.R;   // the mug hold's hand, without the grab: the glass stays on the counter
c.arm(0, "gsl", "R", { prop: "shake", grip: shakeHold.grip, palm: "wrap" }, 0); A(0, "gsl", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "gsl", "turn", { to: -14, dur: 0 });
sfx(0.06, "ai/sip", { gain: 0.4, reason: "a dry slurp through the straw of his empty milkshake" });
sfx(0.36, "ai/sip", { gain: 0.3, reason: "a second, emptier slurp (only air left in the glass)" });
A(0.45, "gsl", "look", { to: [0.18, -0.55], dur: 0.15, blink: false });   // the eyes slide to the bill
A(0.5, "gsl", "face", { brow: 0.3, dur: 0.15 });
A(0.95, "gsl", "lean", { to: 0, dur: 0.3, ease: "inOut" }); A(0.95, "gsl", "turn", { to: 0, dur: 0.35 });
A(0.95, "gsl", "expr", { expr: "eager", set: { pucker: 0, open: 0.1 }, dur: 0.2 });
A(1.0, "gsl", "grip", { side: "R", shape: "open", dur: 0.12 });
c.arm(1.02, "gsl", "R", { o: [0.06, 0.42, 0.2] }, 0.15, "inOut"); c.arm(1.17, "gsl", "R", GR, 0.25, "inOut");
// the Wizard and Reaper turn their heads to him, at once
A(0.35, "wiz", "look", { to: [0.65, -0.05], dur: 0.15, blink: false }); A(0.42, "wiz", "turn", { to: 22, dur: 0.3 });
A(0.35, "rea", "look", { to: [-0.65, -0.05], dur: 0.15, blink: false }); A(0.42, "rea", "turn", { to: -22, dur: 0.3 });
A(0.5, "wiz", "expr", { expr: "annoyed", dur: 0.25 }); A(0, "rea", "face", { lid: 0.45, dur: 0 });
see(0, 1.4, ["gsl.face", "wiz.face", "rea.face", "tray"], "panel 1: the bill slides in front of Gunslinger, mid-slurp; the friends turn to him");

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
// the Wizard holds out his palm at him (the friend waiting for the money)
c.arm(1.4, "wiz", "L", { o: [0.12, 0.45, 0.42] }, 0.2, "out"); A(1.42, "wiz", "grip", { side: "L", shape: "flat", set: { up: 1 }, dur: 0.12 });
const P = pocketPat(c, { who: "gsl", at: GSL, yaw: GSL_YAW, friend: [-0.7, 0.05] });
// the counter man walks round to face Gunslinger across the counter while the camera is on the pat
A(1.47, "sam", "look", { to: [-0.45, -0.1], dur: 0.12, blink: false });   // eyes first: to where he is going
A(1.6, "sam", "move", { to: SAM1, dur: 0.8, ease: "inOut", steps: 3 }); A(1.6, "sam", "turn", { to: SAM1_YAW, dur: 0.6 });

// ---------------------------------------------------------------- 3 THE BUTTON 2.8-3.8 (panels 3-4)
// the wallet goes back in the holster; from his bandana he pulls one big four-hole button and holds it up, proud
A(2.82, "gsl", "turn", { to: 22, dur: 0.3 });
c.prop(2.82, "wallet", { open: 0 }, 0.08, "inOut");
A(2.86, "gsl", "grip", { side: "L", shape: "open", dur: 0.08 });
const HOLSTER = patProps({ at: GSL, yaw: GSL_YAW })[0];
c.arm(2.84, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.12, "inOut");
A(2.97, "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.04 });
// let go inside the holster (behind the counter): it straightens there, out of sight
c.prop(3.02, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.04, "inOut");
A(2.97, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.12 }); c.arm(3.0, "gsl", "R", GR, 0.3, "inOut");
const btn = grips.thin(c, "gsl", { ...BUTTON, scale: BK }, { side: "L", from: 0.92, roll: 30 });
let tb = btn.take(2.8, { reach: 0.12, settle: 0.04 });
c.prop(2.74, "button", { scale: BK }, 0.06, "out");   // it comes out from under the bandana as his fingers reach it (grows with the reach: no jump in the pinch)
const UPB = [0.42, 0.62, -0.3];   // held up proudly beside his face, toward the counter man
tb = btn.carry(r3(tb + 0.01), UPB, 0.16, "inOut");   // up, and held there till the cut (3.3): proud
A(3.0, "gsl", "look", { to: [0.35, 0.25], dur: 0.1, blink: false });
A(3.0, "gsl", "expr", { expr: "happy", set: { curve: 0.8, open: 0.4 }, dur: 0.15 });   // proud, wide-eyed (panel 3)
see(3.1, 3.28, ["gsl.face", "button", "moth"], "panel 3: the button held up, proud (the moth on his hat brim)");
// he lays it on the tray (tink) and slides the tray over to the counter man with two fingers and a nod
const ON_TRAY = (x, z) => [x, TOP, z];
// stood on its edge on the tray, well out in front (the forearm stays over the counter), let go, and it topples flat
const BX = r3(T_G[0] - 0.01), BZ = r3(LANE + 0.08);
btn.carry(3.3, [BX, r3(TOP + 0.07), BZ], 0.1, "out");   // held over the tray (his wrist hangs under the pinch, above the counter)
A(3.4, "gsl", "release", { prop: "button", to: ON_TRAY(BX, BZ), dur: 0.06 });   // dropped: it lands on its edge
A(3.4, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.06 });
c.prop(3.42, "button", { flat: 1 }, 0.05, "in");   // and topples flat
sfx(3.47, "tink", { gain: 0.45, reason: "the button topples flat onto the tray: click" });
c.arm(3.44, "gsl", "L", { world: [r3(T_G[0] - 0.02), r3(TOP + 0.1), r3(LANE - 0.1)] }, 0.07, "out");
A(3.44, "gsl", "grip", { side: "L", shape: "point", set: { thumb: 0 }, dur: 0.06 });
const slide = (t, to, dur, who = null) => {
  c.prop(t, "tray", { x: to[0], z: to[1] }, dur, "out"); c.prop(t, "bill", { x: to[0], z: to[1] }, dur, "out");
  c.prop(t, "button", { x: to[0], z: to[1] }, dur, "out");
  sfx(r3(t + 0.02), "ai/bowl-scrape", { gain: 0.2, dur: r3(Math.max(0.2, dur * 0.8)), reason: "the tray sliding along the counter top" });
};
slide(3.52, T_S, 0.2);
c.arm(3.52, "gsl", "L", { world: [r3(T_G[0] + 0.12), r3(TOP + 0.1), r3(LANE + 0.04)] }, 0.1, "out");
c.arm(3.64, "gsl", "L", "rest", 0.3, "inOut"); A(3.64, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(3.54, "gsl", "nod", { times: 1 });
// the counter man looks down at it; a flat palm: no (hit-stop)
A(3.45, "sam", "look", { to: [0.05, -0.55], dur: 0.12, blink: false });
A(3.66, "sam", "look", { to: [-0.05, 0.0], dur: 0.12, blink: false });
A(3.6, "sam", "expr", { expr: "deadpan", dur: 0.12 }); A(3.6, "sam", "face", { lid: 0.5, dur: 0.12 });   // flat brows (review A)
c.arm(3.62, "sam", "L", { o: [-0.04, 0.5, 0.45] }, 0.16, "out"); A(3.62, "sam", "grip", { side: "L", shape: "flat", dur: 0.1 });
c.hitStop(HS1, 3);
sfx(HS1, "pat", { gain: 0.35, reason: "the counter man's flat palm comes up: a soft glove slap of air (the no)" });
see(3.55, 3.8, ["sam.face", "button"], "panel 4: the counter man's deadpan face and flat palm; the button on the tray");
// and with two fingers he slides it back
c.arm(3.84, "sam", "R", { world: [r3(T_S[0] + 0.02), r3(TOP + 0.1), r3(T_S[1] + 0.11)] }, 0.08, "out");
A(3.84, "sam", "grip", { side: "R", shape: "point", set: { thumb: 0 }, dur: 0.06 });
slide(3.92, T_G, 0.26);
sfx(3.95, "tink", { gain: 0.2, reason: "the button rattling on the tray as it slides back" });
c.arm(3.92, "sam", "R", { world: [r3(T_S[0] - 0.1), r3(TOP + 0.1), r3(T_S[1] + 0.04)] }, 0.12, "out");
c.arm(4.08, "sam", "R", "rest", 0.3, "inOut"); c.arm(3.95, "sam", "L", "rest", 0.35, "inOut");
A(4.1, "sam", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(4.0, "sam", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(4.17, "sam", "look", { to: [0.5, -0.1], dur: 0.12, blink: false });
A(4.3, "sam", "move", { to: SAM2, dur: 0.7, ease: "inOut", steps: 3 }); A(4.3, "sam", "turn", { to: -110, dur: 0.5 });

// ---------------------------------------------------------------- 4 THE COUNT 3.95-4.9 (panel 5)
// the Wizard points at him and counts on his fingers: "You had the TOWER burger!"; Gunslinger: "I'm a bit short…"
A(3.85, "gsl", "turn", { to: -8, dur: 0.3 });
A(3.95, "wiz", "look", { to: [0.7, 0.0], dur: 0.1, blink: false });
act.mood(c, 3.98, "wiz", "angry", { hold: 0.6 });
c.arm(3.95, "wiz", "L", { o: [0.2, 0.55, 0.36] }, 0.15, "out"); A(3.98, "wiz", "grip", { side: "L", shape: "point", dur: 0.08 });
c.arm(4.02, "wiz", "R", { o: [-0.12, 0.62, 0.36] }, 0.15, "out");
for (const [t, set] of [[4.1, { curl: 1.15, index: 0, thumb: 0.9 }], [4.3, { curl: 1.15, index: 0, thumb: 0 }], [4.5, { curl: 0, index: 0, thumb: 0 }]]) {
  A(t, "wiz", "grip", { side: "R", shape: "point", set, dur: 0.06 }); A(t, "wiz", "squash", { amount: 0.02, dur: 0.08 });
}
c.say(V(4.05), "wiz", "you had the TOWER burger!", 0.6, "excited", { voice: false, sub: "You had the TOWER burger!", pos: SUB_HIGH });
A(4.2, "gsl", "look", { to: [-0.65, 0.05], dur: 0.1, blink: false });
act.sheepish(c, V(4.55), "gsl");
c.say(V(4.45), "gsl", "I'm a bit short…", 0.55, "calm", { voice: false, sub: "I'm a bit short…", pos: SUB_LOW });
c.arm(4.5, "gsl", "R", { o: [-0.04, 0.78, 0.28] }, 0.2, "inOut"); A(4.55, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.15 });   // a hand to the back of his head... in front: a sheepish rub of the cheek
c.arm(4.82, "gsl", "R", GR, 0.25, "inOut");
c.arm(4.7, "wiz", "L", "rest", 0.3, "inOut"); c.arm(4.72, "wiz", "R", "rest", 0.3, "inOut");
A(4.72, "wiz", "grip", { side: "L", shape: "relaxed", dur: 0.2 }); A(4.74, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
see(V(4.15), V(4.9), ["wiz.face", "gsl.face"], "panel 5: the Wizard counts on his fingers at him; his sheepish grin");

// ---------------------------------------------------------------- 5 THE NUDGE 4.9-6.9 (panel 6)
// whistling, eyes on the ceiling, he nudges the tray along the counter with one finger to Reaper; Reaper, without
// looking, nudges it back; three round trips, faster each time; the fourth time it stops in front of Reaper
const NUDGE = V(5.0);
sfx(NUDGE, "whistletune", { gain: 0.32, reason: "Gunslinger whistling an innocent little tune while he nudges the bill away" });
A(NUDGE, "gsl", "look", { to: [0.15, 0.75], dur: 0.15, blink: false });
A(NUDGE, "gsl", "expr", { expr: "eager", set: { pucker: 1, open: 0, curve: 0.2 }, dur: 0.15 });
A(r3(NUDGE + 1.75), "gsl", "expr", { expr: "eager", set: { pucker: 0 }, dur: 0.15 });
A(NUDGE, "rea", "look", { to: [0.1, 0.05], dur: 0.15, blink: false }); A(NUDGE, "rea", "turn", { to: REA_YAW, dur: 0.3 });
A(NUDGE, "rea", "expr", { expr: "deadpan", dur: 0.2 }); A(NUDGE, "rea", "face", { lid: 0.55, dur: 0.2 });
const RIM = 0.15, FY = r3(TOP + 0.1);    // a fingertip on the tray's end rim (the tray is 0.24 long across x)
const GF = (x) => ({ world: [r3(x - RIM), FY, LANE] }), RF = (x) => ({ world: [r3(x + RIM), FY, LANE] });
// each pushes from his own side of the tray (no arm across it): Gunslinger's right hand at its left end, Reaper's left
// hand at its right end, the index out
c.arm(r3(NUDGE - 0.08), "gsl", "R", GF(T_G[0]), 0.12, "out"); A(r3(NUDGE - 0.08), "gsl", "grip", { side: "R", shape: "point", dur: 0.08 });
c.arm(r3(NUDGE + 0.05), "rea", "L", RF(T_R[0]), 0.2, "out"); A(r3(NUDGE + 0.05), "rea", "grip", { side: "L", shape: "point", dur: 0.08 });
const TRIPS = [0.4, 0.34, 0.29, 0.25, 0.22, 0.2, 0.25];
let tn = NUDGE, x0 = T_G[0];
TRIPS.forEach((d, i) => {
  const toR = i % 2 === 0, x1 = toR ? T_R[0] : T_G[0], push = toR ? "gsl" : "rea", side = toR ? "R" : "L", F = toR ? GF : RF;
  slide(tn, [x1, LANE], d);
  // the finger pushes it for the first third of the way, then comes back to wait
  c.arm(tn, push, side, F(r3(x0 + (x1 - x0) * 0.3)), r3(d * 0.6), "inOut");   // eased both ways: no one-frame flick of the glove
  c.arm(r3(tn + d * 0.62), push, side, F(x0), r3(d * 0.6), "inOut");
  A(tn, "wiz", "look", { to: [toR ? 0.85 : 0.35, -0.25], dur: r3(Math.min(0.12, d * 0.4)), blink: false });
  if (i < TRIPS.length - 1) sfx(r3(tn + d - 0.02), "tink", { gain: 0.32, reason: "the button rattling on the tray as it stops against a fingertip" });
  tn = r3(tn + d); x0 = x1;
});
const STOP = tn;   // 6.89: in front of Reaper, the fourth time
A(r3(STOP - 0.05), "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.15 }); c.arm(STOP, "gsl", "R", GR, 0.3, "inOut");
A(r3(NUDGE + 0.1), "wiz", "expr", { expr: "focused", set: { open: 0.15 }, dur: 0.2 });
see(V(5.1), V(6.9), ["gsl.face", "rea.face", "tray"], "panel 6: the tray nudged back and forth between them, the Wizard's eyes following it");

// ---------------------------------------------------------------- 6 THE BILL LANDS 6.9-8.6 (panel 7)
// Reaper closes his eyes: a long silent sigh. He draws his black card and taps the terminal (hit-stop)
A(STOP, "rea", "grip", { side: "L", shape: "relaxed", dur: 0.08 });
A(r3(STOP - 0.05), "rea", "face", { lid: 1, dur: 0.15 });
act.breath(c, r3(STOP + 0.02), "rea", { big: 1.4, hold: 0.05, eyes: [0, 0] });
A(r3(STOP + 0.02), "rea", "face", { lid: 1, dur: 0.1 });
const crd = grips.phone(c, "rea", { ...CARD, scale: 1 }, { side: "L" });
c.arm(6.92, "rea", "L", { o: [0.0, 0.5, 0.48] }, 0.12, "out");   // into his robe at the chest
c.prop(7.0, "card", { scale: 1 }, 0.03, "out");
crd.secure(7.0, 0.06);
const TAP = [TERM[0], r3(CH + 0.19), r3(TERM[1] + 0.07)];
crd.carry(7.08, TAP, 0.12, "out", { tip: -55 });
c.prop(HS2, "term", { paid: 1 }, 0.02, "linear");
sfx(HS2, "ui-confirm", { gain: 0.5, reason: "the card terminal's beep as Reaper's card taps it" });
c.hitStop(HS2, 3);
A(r3(HS2 + 0.05), "rea", "face", { lid: 0.6, dur: 0.2 });
crd.carry(r3(HS2 + 0.15), [r3(REA[0] + 0.24), 0.6, r3(FZ + 0.42)], 0.3, "inOut", { tip: 0 });   // the card back at his chest
see(r3(HS2 - 0.2), r3(HS2 + 0.15), ["rea.face", "card", "term"], "panel 7: Reaper taps his card, eyes shut");
// then he pushes the tray down to the counter man's end (paid)
// (the card stays in his left hand; the right hand pushes from the tray's near side)
c.arm(7.48, "rea", "R", { world: [r3(T_R[0] - RIM), FY, LANE] }, 0.14, "out"); A(7.5, "rea", "grip", { side: "R", shape: "point", dur: 0.06 });
slide(7.64, T_E, 0.3);
c.arm(7.64, "rea", "R", { world: [r3(T_R[0] - RIM + 0.14), FY, r3(LANE + 0.06)] }, 0.12, "out");
c.arm(7.78, "rea", "R", "rest", 0.3, "inOut"); A(7.8, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
// Gunslinger, relieved, reaches over and takes Reaper's last fry, and eats it (crunch); Reaper's head turns slowly
A(7.3, "gsl", "look", { to: [0.55, -0.4], dur: 0.12, blink: false });
A(7.3, "gsl", "expr", { expr: "delighted", dur: 0.2 });
A(7.35, "gsl", "turn", { to: 25, dur: 0.3 }); c.arm(7.35, "gsl", "R", { o: [0.02, 0.45, 0.16] }, 0.3, "inOut");   // his other hand comes up off the counter as he leans A(7.4, "gsl", "lean", { to: 12, dur: 0.3 });
const fry = grips.thin(c, "gsl", FRY, { side: "L", from: 0.95, roll: 25 });
let tf = fry.take(7.42, { reach: 0.22, settle: 0.1 });
A(7.75, "gsl", "lean", { to: 0, dur: 0.25 });
tf = fry.carry(r3(tf + 0.02), [r3(FRY.x - 0.02), r3(CH + 0.16), FRY.z], 0.1, "out");   // straight up out of the basket first
tf = fry.carry(tf, [0.12, 0.66, r3(FZ + 0.38)], 0.2, "inOut", { tip: 35 });
const BITE = r3(tf + 0.02);
c.prop(BITE, "fry", { bite: 1 }, 0.05, "out");
sfx(BITE, "ai/crunch", { gain: 0.55, reason: "the bite into Reaper's last fry: crunch" });
// let go first (it stays at his mouth, staged), then it is gone: shrinking a held prop would pull the pinch with it
A(r3(BITE + 0.05), "gsl", "release", { prop: "fry", to: [0.12, 0.66, r3(FZ + 0.38)], dur: 0.02 });
c.prop(r3(BITE + 0.07), "fry", { scale: 0.001 }, 0.03, "in");
A(r3(BITE + 0.08), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 }); c.arm(r3(BITE + 0.1), "gsl", "L", "rest", 0.3, "inOut");
A(r3(BITE - 0.05), "gsl", "expr", { expr: "serene", set: { curve: 0.8, open: 0.25 }, dur: 0.12 });
A(r3(BITE + 0.1), "gsl", "turn", { to: 0, dur: 0.3 }); c.arm(r3(BITE + 0.1), "gsl", "R", GR, 0.3, "inOut");
for (const t of [0.12, 0.26, 0.4]) A(r3(BITE + t), "gsl", "squash", { amount: 0.025, dur: 0.07 });   // chewing
A(r3(BITE + 0.05), "rea", "turn", { to: -32, dur: 0.6, ease: "inOut" });
A(r3(BITE + 0.1), "rea", "look", { to: [-0.7, -0.05], dur: 0.4, blink: false });
act.mood(c, r3(BITE + 0.25), "rea", "annoyed", { hold: 0.6 });
see(r3(BITE - 0.15), r3(BITE + 0.25), ["gsl.face", "fry"], "panel 7: he eats Reaper's last fry, blissful");

// ---------------------------------------------------------------- 7 THE WINK 8.6-9.8 (panel 8, the series block)
// Reaper's left eye twitches; the counter man flicks the button off the tray into the tip jar without looking
const WK = V(8.8);
A(r3(WK - 0.38), "sam", "look", { to: [-0.4, -0.2], dur: 0.12, blink: false });
A(r3(WK - 0.25), "sam", "move", { to: SAM3, dur: 0.4, ease: "inOut", steps: 2 }); A(r3(WK - 0.25), "sam", "turn", { to: SAM3_YAW, dur: 0.4 });
wink(c, {
  who: "gsl", t: WK, until: END, pos: SUB_HIGH, side: "L", brimTouch: { o: [0.3, 0.93, 0.08] },
  react(t) {
    for (const [dt, l] of [[0, 0.75], [0.07, 0.3], [0.13, 0.8], [0.2, 0.3], [0.3, 0.85], [0.38, 0.35]]) A(r3(t + dt), "rea", "face", { lidL: l, dur: 0.04 });
    // and again into the cut (review A: the last frame is the payoff)
    for (const [dt, l] of [[0, 0.8], [0.07, 0.3], [0.14, 0.85], [0.21, 0.35]]) A(r3(END - 0.3 + dt), "rea", "face", { lidL: l, dur: 0.04 });
  },
});
A(WK, "rea", "look", { to: [-0.7, 0.0], dur: 0.1, blink: false });
// the flick (9.6 on the video's clock): his fingertip snaps the button off the tray and it arcs into the jar
const FLICK = V(9.6), BTN_E = [T_E[0], TOP, T_E[1]];
c.arm(r3(FLICK - 0.2), "sam", "R", { world: [r3(BTN_E[0] + 0.06), r3(TOP + 0.13), r3(BTN_E[2] + 0.02)] }, 0.14, "out");
A(r3(FLICK - 0.2), "sam", "grip", { side: "R", shape: "point", set: { thumb: 0.2 }, dur: 0.08 });
c.arm(FLICK, "sam", "R", { world: [r3(BTN_E[0] - 0.05), r3(TOP + 0.13), r3(BTN_E[2] + 0.02)] }, 0.05, "out");
A(r3(FLICK - 0.15), "sam", "look", { to: [0.1, 0.0], dur: 0.12, blink: false });   // "without looking": his deadpan eyes to us
A(r3(FLICK - 0.45), "sam", "turn", { to: -85, dur: 0.3 });
c.prop(FLICK, "button", { x: r3((BTN_E[0] + JAR[0]) / 2), y: r3(CH + 0.3), z: r3((BTN_E[2] + JAR[1]) / 2), spin: 540, reason: "the flick: the button arcs off the tray into the tip jar" }, 0.09, "out");
c.prop(r3(FLICK + 0.09), "button", { x: JAR[0], y: r3(CH + 0.04), z: JAR[1], reason: "the flick: the button drops into the tip jar" }, 0.08, "in");
sfx(r3(FLICK + 0.17), "tink", { gain: 0.5, reason: "the button plinks into the glass tip jar" });
c.arm(r3(FLICK + 0.08), "sam", "R", "rest", 0.3, "inOut");
see(r3(WK + 0.2), r3(WK + 0.75), ["gsl.face", "moth", "rea.face"], "panel 8: the wink and the hat tip, the moth lifting off the brim, Reaper's eye twitching");
see(FLICK, r3(FLICK + 0.2), ["button", "jar"], "panel 8: the button into the tip jar");

// blinks off the lines and the key looks
act.blinksAt(c, "wiz", [1.25, 3.4, 6.1, 8.2]); act.blinksAt(c, "rea", [1.3, 4.6]); act.blinksAt(c, "gsl", [1.32, 4.0, 8.3]);
act.blinksAt(c, "sam", [1.2, 3.1, 5.6]);

// ---------------------------------------------------------------- shots (Jonny's panels)
// a 9:16 frame is 0.5625 of its height wide: frame each shot by the width it must hold (one potato with its hat brim
// is about 1 m wide)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panel 1): from in front and a little above, all three faces over the counter, the counter man at the right edge
const WIDE = { pos: [0.15, 2.1, 6.6], look: [0.2, 0.95, -0.4], fov: 46 };   // review A: the Samurai's 3/4 face in frame with the tray leaving his hand
// the pocket pat (panel 2, the series framing): Gunslinger chest up with the whole hat, from his front three
// quarters at eye level; the Wizard's waiting palm at the left edge
const PATSHOT = fw([-0.16, 0.92, -0.62], { w: 1.55, az: -12, el: 4, fov: 30 });
// over the counter man's left shoulder at Gunslinger (panel 3): the shoulder at the right edge
const OTS = { pos: [0.5, 1.15, 2.6], look: [0.25, 0.84, -0.62], fov: 34 };
// the reverse: over Gunslinger's right shoulder at the counter man, the kitchen wall behind him (panel 4)
const REV = { pos: [0.5, 2.6, -1.8], look: [0.8, 0.6, 0.5], fov: 44 };
// two-shot, Wizard and Gunslinger (panel 5)
const TWO = fw([-0.6, 0.9, -0.62], { w: 1.75, az: 0, el: 6, fov: 30 });   // tighter after the panels check
// three-shot, lower, the tray big in front (panel 6)
const THREE = { pos: [0.5, 1.3, 1.6], look: [0.5, 0.62, -0.5], fov: 64 };   // the tray big between Gunslinger and Reaper (panel 6)   // review A: the tray big in the lower third, the counter edge hides the floor
// two-shot, Gunslinger and Reaper, the terminal front right (panel 7)
const TWO_R = fw([0.6, 0.88, -0.55], { w: 1.75, az: 4, el: 6, fov: 30 });
// the wink (panel 8): close on Gunslinger, Reaper at the right edge, the tip jar in front
const WINK = fw([0.62, 0.9, -0.35], { w: 2.05, az: 4, el: 5, fov: 30 });
const beats = c.beats([
  ["P1 pay up", 0, WIDE, "hook"],
  ["P2 the pocket pat", PAT.from, PATSHOT],
  ["P3 the button", 2.8, OTS],
  ["P4 the flat palm", 3.3, REV],
  ["P5 the count", 3.95, TWO],
  ["P6 the nudge", V(5.0), THREE, "escalation"],
  ["P7 the bill lands", STOP, TWO_R],
  ["P8 the wink", WK, WINK, "payoff"],
], END);
// both lines stay up together till the cut to the nudge (the Wizard's over the hats, Gunslinger's on the counter), so
// each reads at phone speed (review A: off at the cut)
for (const cp of c.captions) if (/TOWER|short/.test(cp.text)) cp.to = V(5.0);

write(import.meta.url, {
  id: "at-dinner",
  title: "That one friend who never has money… at dinner",
  idea: "Never has money, episode 1: the bill lands, the pocket pat finds only a moth, a button on the tray, a flat palm, the tray nudged back and forth to Reaper, who pays; Gunslinger steals his last fry and winks: next time's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2 }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.6,
  set: { type: "plain", color: "#c9473f", floor: "#e9e2d6", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/diner-sunny.png", z: -2.4, center: [0.3, 1.75], height: 7.8, depth: false, motion: false, dust: 8 },
    plates: [{ src: "assets/plates/diner-kitchen.png", z: 2.7, center: [1.0, 1.5], height: 4.6, turn: 180 }],
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", key: 10, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", scenes: ["ui"], guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["gsl", "wiz", "rea", "tray"], hint: 0.4, what: "the bill slides in front of Gunslinger, mid-slurp, and his friends turn to him" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "gsl", with: "napkin", from: 0, to: 10, reason: "the napkin tucked into his bandana (worn)" },
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "shake", from: 0, to: 1.3, reason: "his lips on the straw of the empty milkshake, both hands round the glass" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.05, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: 2.38, to: 2.52, checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", with: "button", from: 2.84, to: 3.4, reason: "he pulls the button out from under his bandana" },
    { who: "gsl", with: "fry", from: 7.4, to: 8.3, reason: "he eats the fry" },
    { who: "gsl", with: "basket", from: 7.85, to: 8.12, reason: "his fingertips dip into Reaper's basket to pinch out the last fry, as fingers do" },
    { who: "sam", from: 9.55, to: 9.72, checks: ["rig-jump"], reason: "the flick: his fingertip snaps across the tray in two frames, the button flies off it (a flick is that fast)" },
    { who: "sam", with: "apron", from: 0, to: 10, reason: "the counter man's apron (worn)" },
    { who: "sam", with: "hat", from: 0, to: 10, reason: "the counter man's paper hat (worn)" },
    { who: "rea", with: "card", from: 6.9, to: 10, reason: "he draws his card from inside his robe" },
  ],
  notes: "Generated by storyboards/series/never-has-money/01-at-dinner/make-at-dinner.mjs. Panels: PANELS.md.",
});
