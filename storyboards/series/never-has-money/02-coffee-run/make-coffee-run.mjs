// THAT ONE FRIEND WHO NEVER HAS MONEY… ON A COFFEE RUN (never has money, episode 2, 7 Nov 2026), from the clip template.
//   node storyboards/series/never-has-money/02-coffee-run/make-coffee-run.mjs -> coffee-run.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/02-coffee-run-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/02-coffee-run/ there (PANELS.md here).
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper; at home, no Samurai)
//   Joke:        the Wizard is back from the coffee run, palm out: "That's 4.50!". Gunslinger takes his coffee, the
//                pocket pat finds a moth, and he writes an IOU. He goes to stick it on the fridge, and the fridge is
//                covered top to bottom in his IOUs; the only bare spot is the handle. Reaper opens the fridge for the
//                milk and every note slides off in one yellow avalanche that buries him to the hat.
//   Wants:       Gunslinger wants the coffee without paying.
//   Consequence: buried in his own debts.
//   Ending:      the wink from the pile, "Next time's on me!"; a last note lands on the Wizard's coffee lid.
//   Callback:    frame 0 the Wizard's palm out for 4.50; the last frame another IOU lands on his own coffee.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// --v3rules: the reach rules v3 test cut (research/hook-curiosity-2026-11-07, "Reach rules v3"; Jonny 7 Nov, posting
// test day 4): B7 Gunslinger's promise is the first line at 0.0, B8 a cut to the Wizard's close-up at 1.05 with a
// 0.7 s freeze on his face. Everything else is the posted cut (coffee-run.json), same music seed. Writes
// coffee-run-v3rules.json beside it.
const V3 = process.argv.includes("--v3rules");
const CU = 1.07, FZ = 1.4, FZF = 21, FZD = FZF / 30;   // the cut to his close-up; the freeze from frame 42, 21 frames (0.7 s)
// two 3-frame hit-stops (the note slapped on the handle at 5.9, the avalanche at 7.3 on the video's clock) add 0.2 s:
// 9.8 s of story = exactly 10.0 s of video
const HS1 = 5.9, HS2 = 7.2, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.2 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- the kitchen (world metres; the doorway camera at +z)
// The fridge stands against the back wall at the left; its door (hinged on its left edge) swings toward camera-left.
// Gunslinger takes his IOU to its right (opening) edge, then steps back in front of the door and turns to us, proud,
// his back to it: the notes come down on him from behind. The Wizard comes in at the right front (the brief), so
// nothing stands between the camera and the fridge; Reaper waits at the back between them and takes Gunslinger's place
// at the handle once he has stepped away (there is no room for him to pass between Gunslinger and the Wizard).
const FR = [-1.05, -1.6], FW = 0.7, FD = 0.65, FDT = 0.08;
const HINGE = [r3(FR[0] - FW / 2 + 0.01), r3(FR[1] + FD / 2 - FDT)];       // [-1.39, -1.355]
const HANDLE_X = r3(HINGE[0] + (FW - 0.02) - 0.055), HANDLE_Z = r3(HINGE[1] + FDT + 0.045);   // -0.765, -1.23
const TAG_Y = 0.9;   // where his note goes on the handle
// the handle at the door's angle (degrees open): it swings round the hinge
const handleAt = (deg, y = TAG_Y, out = 0) => { const a = (-deg * Math.PI) / 180, lx = HANDLE_X - HINGE[0], lz = HANDLE_Z - HINGE[1] + out; return [r3(HINGE[0] + lx * Math.cos(a) + lz * Math.sin(a)), y, r3(HINGE[1] - lx * Math.sin(a) + lz * Math.cos(a))]; };
const TABLE = { x: 0.35, z: 0.5, w: 1.0, d: 0.5, h: 0.42 };
const COUNTER = { x: 1.9, z: -1.73, w: 1.4, d: 0.55, h: 0.5 };
// the cast's places
const W0 = [1.0, -0.1], W2 = [0.5, -0.25];    // the Wizard: by the table; closer, at the end
const G0 = [-0.2, -0.12], GS = [-0.2, -0.84], G1 = [-0.95, -0.15]; // Gunslinger: at the table; at the handle; a half step back
// Reaper: at the back between them; at the handle (Gunslinger's place); at the open fridge's side; pouring
const R0 = [0.55, -1.6], RP0 = [-0.3, -1.05], RP2 = [-0.48, -0.98], RP3 = [-0.3, -0.9];
const W_YAW = -35, G_YAW = 15, G1_YAW = 20, R_YAW = -10, RP0_YAW = -111, RP2_YAW = -160, W2_YAW = -25, RP3_YAW = 20;
// a point in front of someone: f metres along their facing, s metres to their left (their own left), at height y
const front = ([x, z], yaw, f, s, y) => { const a = (yaw * Math.PI) / 180; return [r3(x + f * Math.sin(a) + s * Math.cos(a)), y, r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
// the heap round Gunslinger (in the fridge's frame) and the drift in front of the door
const PILE = { x: r3(G1[0] - FR[0]), z: r3(G1[1] - FR[1]), r: 0.52, h: 1.08, low: 0.62 };
const SPILL = { x: 0.1, z: 0.72, r: 0.62, h: 0.24 };

// the cups: the Wizard has just set the tray down on the table (one cup left in it, Gunslinger's: panel 1); he holds
// his own in his left hand, and Reaper already has his (in his right)
const TRAY = [0.12, r3(TABLE.h), 0.33], T = 0.062;
const slot = (sx, sz) => [r3(TRAY[0] + sx * T), r3(TRAY[1] + 0.012), r3(TRAY[2] + sz * T)];
const CUP_G = { id: "cupG", kind: "coffeecup", ...grips.placeFor("coffeecup", slot(-1, -1), G_YAW) };
const CUP_G_DOWN = [-0.12, r3(TABLE.h), 0.4];     // Gunslinger's cup back on the table, in front of him
const CUP_W = { id: "cupW", kind: "coffeecup", ...grips.placeFor("coffeecup", front(W0, W_YAW, 0.46, 0.1, 0.5), W_YAW) };
const CUP_R = { id: "cupR", kind: "coffeecup", ...grips.placeFor("coffeecup", front(R0, R_YAW, 0.46, -0.1, 0.42), R_YAW) };
// the IOU note: tucked under his bandana until he pulls it out; the marker in his hat band (his left side)
const NOTE = { id: "note", kind: "iounote", x: r3(G0[0] - 0.02), y: 0.62, z: r3(G0[1] + 0.3), rot: r3(G_YAW + 180), ink: 0, scale: 0.001, staged: "tucked under his bandana until he pulls it out" };
// (the brief has the pen in his hat band, but his arm can't reach the band past that brim: it's tucked in his bandana's
// knot instead, at his left; PANELS.md)
const PEN = { id: "pen", kind: "feltpen", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, front(G0, G_YAW, 0.29, 0.13, 0.6)[i]])), rot: r3(G_YAW + 180), scale: 0.001, staged: "tucked in his bandana's knot until he pulls it out" };
// the milk on the fridge's bottom shelf (front)
const MILK = { id: "milk", kind: "milkbottle", x: -0.95, y: 0.582, z: -1.42, rot: 180, staged: "standing on the fridge's bottom shelf (glass)" };
// the last note: still sliding off the top of the heap, it flutters down onto the Wizard's lid
const LAST = { id: "last", kind: "stickynote", text: "IOU", x: 0.1, y: 1.5, z: -0.45, size: 0.17, wag: 0, scale: 0.001, staged: "a last note, late off the top of the door, drifting down" };

const cast = [
  { id: "wiz", character: "never-has-money/wizard", at: W0, face: W_YAW, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "gsl", character: "never-has-money/gunslinger", at: G0, face: G_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: R0, face: R_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
];
const props = [
  { id: "floor", kind: "plankfloor", x: 0, z: 0.6, w: 7, d: 6 },
  { id: "fridge", kind: "ioufridge", x: FR[0], z: FR[1], rot: 0, w: FW, d: FD, h: 1.95, open: 0, tagged: 0, pile: PILE, spill: SPILL, seed: 7, noteSize: 0.17, tag: { y: TAG_Y, size: 0.13 } },
  { id: "table", kind: "kitchentable", x: TABLE.x, z: TABLE.z, w: TABLE.w, d: TABLE.d, h: TABLE.h },
  { id: "bowl", kind: "fruitbowl", x: 0.62, y: TABLE.h, z: 0.55 },
  { id: "counter", kind: "kitchencounter", x: COUNTER.x, z: COUNTER.z, w: COUNTER.w, d: COUNTER.d, h: COUNTER.h },
  { id: "tray", kind: "cuptray", x: TRAY[0], y: TRAY[1], z: TRAY[2], rot: 10 },
  { id: "scarf", kind: "wrapscarf", wear: "wiz", x: 0, y: 0.47, z: 0, rx: 0.4, rz: 0.37, color: "#7d3fb8" },
  CUP_G, CUP_W, CUP_R, NOTE, PEN, MILK, LAST,
  { id: "pour", kind: "milkpour", x: 0, y: 0.6, z: 0, lip: 0.14, pour: 0, staged: "the milk running from the bottle's mouth into the cup" },
  ...patProps({ who: "gsl", at: G0, yaw: G_YAW }).map((p) => (p.id === "wallet" ? { ...p, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : p)),
];

// subtitles inside y 470-1360 (TikTok's safe zone, clear of Jonny's in-app title at the top)
const SUB_LOW = 1250, SUB_HIGH = 560;

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// frame 0: the Wizard is just in (the front door clunks shut behind him), at the table where he has set the
// tray of coffees, his right palm out at Gunslinger: "That's 4.50!". Reaper already has his. Gunslinger lifts his out
// of the tray, a grateful smile, a long sip, and sets it on the table.
sfx(0, "door-close", { gain: 0.45, reason: "the front door closing behind the Wizard as he comes back in (off screen right)" });
sfx(0.08, "tink", { gain: 0.2, reason: "the cups clinking in the tray he has just set down" });
const wcup = grips.mug(c, "wiz", CUP_W, { side: "L", height: 0.7 });
c.arm(0, "wiz", "L", { prop: "cupW", grip: wcup.hands.L.grip, palm: "wrap" }, 0); A(0, "wiz", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "wiz", "grab", { prop: "cupW", hand: "L", grip: wcup.hands.L.grip, dur: 0, pose: null });
c.arm(0, "wiz", "R", { o: [0.05, 0.52, 0.4] }, 0); A(0, "wiz", "grip", { side: "R", shape: "flat", set: { up: 1 }, dur: 0 });
// palm up, held out at Gunslinger over the tray (any higher and his fingers cover Reaper's eyes behind), with two small "gimme" bobs
for (const t of [0.3, 0.9]) { c.arm(t, "wiz", "R", { o: [0.05, 0.5, 0.42] }, 0.08, "inOut"); c.arm(r3(t + 0.08), "wiz", "R", { o: [0.05, 0.52, 0.4] }, 0.1, "inOut"); }
A(0, "wiz", "look", { to: [-0.55, 0.0], dur: 0, blink: false });
act.mood(c, 0.02, "wiz", "annoyed", { strength: 0.6, hold: 0.5 });
if (!V3) c.say(0, "wiz", "that's four fifty!", 0.6, "calm", { voice: false, sub: "That's 4.50!", pos: SUB_HIGH });
else {
  // B7: his promise first, while his hand is already taking the coffee he hasn't paid for (up to the cut, 1.07 s:
  // the Wizard's hat fills the subtitle line in his close-up)
  const PROMISE = "This time I'm paying. Promise!";
  c.say(0, "gsl", "this time I'm paying, promise!", 0.55, "excited", { voice: false, sub: PROMISE, pos: SUB_HIGH });
  // B8: the Wizard's close-up, his eyes already on Gunslinger in the wide: his annoyance at full strength, an
  // unimpressed squint, held in the freeze (a little from his right, so his side-eye reads toward Gunslinger, screen left as in the wide)
  act.mood(c, 1.05, "wiz", "annoyed", { hold: 0.6 });
  A(1.2, "wiz", "face", { lid: 0.5, dur: 0.15 });
  c.hitStop(FZ, FZF);
  see(CU, FZ, ["wiz.face"], "B8: the victim's close-up, his unimpressed squint, frozen 0.7 s");
}
see(0, 1.45, ["wiz.face", "gsl.face", "rea.face", "tray", "fridge"], "panel 1: the Wizard's palm out, the tray of coffees, the yellow fridge behind");
// Reaper, deadpan, his cup in his right hand at his chest
const rcup = grips.mug(c, "rea", CUP_R, { side: "R", height: 0.7 });
c.arm(0, "rea", "R", { prop: "cupR", grip: rcup.hands.R.grip, palm: "wrap" }, 0); A(0, "rea", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "rea", "grab", { prop: "cupR", hand: "R", grip: rcup.hands.R.grip, dur: 0, pose: null });
A(0, "rea", "look", { to: [0.3, -0.1], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.45, dur: 0 });
// Gunslinger: his left hand already on the way to the tray; he lifts his cup at 0.5 (straight up out of its hole first)
A(0, "gsl", "look", { to: [0.35, -0.4], dur: 0, blink: false });   // on his cup in the tray (his hand already going)
A(0, "gsl", "expr", { expr: "eager", set: { curve: 0.4, open: 0.15 }, dur: 0 });
const gcup = grips.mug(c, "gsl", CUP_G, { side: "L", height: 0.95, angle: 30 });   // from the front of the cup: the hand stays off the carrier
let tg = gcup.secure(gcup.approach(0.02, 0.22), 0.16);   // 0.5: the fingers have closed round the sleeve
tg = gcup.carry(r3(tg), [CUP_G.x, r3(CUP_G.y + 0.12), CUP_G.z], 0.12, "out");
// the lid at his lips: his mouth is at [-0.115, 0.555, 0.245] (layout), so the cup (0.115 tall) stands just in front of it
// and tips toward him. It was at y 0.7 before, up at his eyes and into the hat brim (Jonny 7 Nov 16:40)
const SIP = [-0.11, 0.46, 0.31];
tg = gcup.carry(r3(tg + 0.01), SIP, 0.2, "inOut", { tip: -25 });
A(0.6, "gsl", "look", { to: [0.1, 0.0], dur: 0.1, blink: false });
A(0.62, "gsl", "expr", { expr: "happy", set: { curve: 0.85, open: 0 }, dur: 0.15 });
A(0.66, "gsl", "face", { lid: 1, dur: 0.1 });   // eyes shut: grateful
sfx(0.8, "ai/sip", { gain: 0.4, reason: "his long grateful sip from the lid" });
A(0.8, "gsl", "squash", { amount: 0.02, dur: 0.2 });
A(0.95, "gsl", "face", { lid: 0, dur: 0.1 });
A(0.9, "gsl", "look", { to: [0.3, -0.45], dur: 0.1, blink: false });   // eyes on the table first
tg = gcup.carry(0.98, [CUP_G_DOWN[0], r3(CUP_G_DOWN[1] + 0.05), CUP_G_DOWN[2]], 0.16, "inOut", { tip: 0 });
tg = gcup.place(r3(tg), CUP_G_DOWN, 0.08);
sfx(r3(tg), "put-down", { gain: 0.3, reason: "his cup set down on the wooden table" });
gcup.release(r3(tg + 0.02), { back: 0.06 });
see(0.5, 1.2, ["gsl.face", "cupG"], "panel 1: he lifts his coffee out of the tray and sips, grateful");

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
const P = pocketPat(c, { who: "gsl", at: G0, yaw: G_YAW, friend: [0.6, 0.05] });
A(1.6, "wiz", "look", { to: [-0.5, -0.1], dur: 0.12, blink: false });
A(2.55, "wiz", "face", { lid: 0.5, dur: 0.2 });   // the moth: a slow deadpan droop of the lids
A(1.7, "rea", "look", { to: [0.3, -0.25], dur: 0.15, blink: false });
// the empty wallet, said out loud (Jonny 7 Nov 13:21: make it clear he has no money): eyes up from the wallet to the
// Wizard first, a sheepish charming grin, "I forgot my money!" while the moth circles his face
A(2.6, "gsl", "look", { to: [0.6, 0.05], dur: 0.08, blink: false });
A(2.62, "gsl", "expr", { expr: "happy", set: { curve: 0.6, open: 0.2 }, dur: 0.1 });
c.say(2.64, "gsl", "I forgot my money!", 0.45, "excited", { voice: false, sub: "I forgot my money!", pos: SUB_HIGH });

// ---------------------------------------------------------------- 3 THE IOU 2.8-3.8 (panel 3)
// the wallet back in the holster; from his bandana he pulls a sticky note (right hand), from his hat band a marker
// (left hand); he writes IOU and a cup doodle on it (marker squeak) and holds it up to the Wizard with a reassuring nod
c.prop(2.82, "wallet", { open: 0 }, 0.08, "inOut");
const HOLSTER = patProps({ at: G0, yaw: G_YAW })[0];
c.arm(2.84, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.12, "inOut");
A(2.96, "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.04 });
c.prop(3.0, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.04, "inOut");
c.at(3.06, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.04, ease: "in", reason: "back down in his holster (part of his costume), so it walks with him" });
// the note: the right hand to the bandana, the note grows out from under it as the fingers reach it
const note = grips.phone(c, "gsl", { ...NOTE, scale: 1 }, { side: "R" });
c.prop(2.96, "note", { scale: 1 }, 0.06, "out");
let tn = note.secure(note.approach(3.0, 0.06), 0.08);
const WRITE = [r3(G0[0] - 0.04), 0.6, r3(G0[1] + 0.42)];    // held in front of his chest, its face to the camera
tn = note.carry(r3(tn), WRITE, 0.12, "out");
// the marker: the left hand to the bandana's knot
A(2.86, "gsl", "grip", { side: "L", shape: "open", dur: 0.08 });
const pen = grips.thin(c, "gsl", { ...PEN, scale: 1 }, { side: "L", from: 0.72, roll: 20 });
c.prop(2.88, "pen", { scale: 1 }, 0.05, "out");
let tp = pen.secure(pen.approach(2.86, 0.1), 0.08);
sfx(r3(tp), "click", { gain: 0.3, reason: "the marker's cap clicked off" });
// write: the felt tip on the note's face (the camera side), four quick strokes left to right
const NF = (dx, dy) => [r3(WRITE[0] + dx), r3(WRITE[1] + dy), r3(WRITE[2] + 0.02)];
const STROKES = [[-0.05, 0.11], [-0.01, 0.08], [0.03, 0.1], [0.0, 0.03]];
tp = pen.carry(r3(Math.max(tp, 3.1)), NF(...STROKES[0]), 0.16, "inOut", { tip: -70 });
c.prop(tp, "note", { ink: 1 }, 0.34, "linear");
sfx(tp, "scribble", { gain: 0.45, reason: "the marker squeaking over the note: IOU and a cup doodle" });
for (const s of STROKES.slice(1)) tp = pen.carry(r3(tp + 0.01), NF(...s), 0.08, "inOut");
A(3.1, "gsl", "look", { to: [0.0, -0.45], dur: 0.1, blink: false });
A(3.1, "gsl", "expr", { expr: "focused", set: { pucker: 0.5 }, dur: 0.12 });
// held up to the Wizard: eyes shut, a big reassuring smile, a nod
const SHOW = [r3(G0[0] - 0.2), 0.8, r3(G0[1] + 0.38)];
tn = note.carry(3.52, SHOW, 0.14, "out");
tp = pen.carry(3.52, front(G0, G_YAW, 0.3, 0.2, 0.6), 0.2, "inOut", { tip: 0 });
A(3.52, "gsl", "expr", { expr: "happy", set: { curve: 0.9, open: 0.35 }, dur: 0.12 });
A(3.55, "gsl", "face", { lid: 1, dur: 0.08 });
A(3.6, "gsl", "nod", { times: 1 });
sfx(3.52, "kenney/cloth-belt", { gain: 0.2, reason: "the flick of the note as he holds it up" });
see(3.58, 3.8, ["gsl.face", "note", "moth"], "panel 3: the IOU note held up, his eyes shut in a big smile, the moth on his brim");

// ---------------------------------------------------------------- 4 LOOK AT THIS 3.8-4.4 (panel 4)
// the Wizard's palm slowly closes; he looks at Reaper and jabs a thumb back over his shoulder at the fridge: "Look at
// this!". Reaper nods slowly, deadpan. Gunslinger turns to the fridge too; the marker goes back in his hat band
A(3.82, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
A(3.85, "wiz", "look", { to: [-0.6, 0.1], dur: 0.12, blink: false });
act.mood(c, 3.9, "wiz", "annoyed", { hold: 0.5 });
// (a point across in front of him, below Reaper's face from this camera, rather than a thumb over the shoulder)
c.arm(3.98, "wiz", "R", { world: [0.45, 0.66, 0.06] }, 0.16, "out"); A(4.0, "wiz", "grip", { side: "R", shape: "point", dur: 0.08 });
c.say(4.2, "wiz", "look at this!", 0.55, "excited", { voice: false, sub: "Look at this!", pos: SUB_HIGH });
A(4.22, "wiz", "squash", { amount: 0.02, dur: 0.1 });
c.arm(4.48, "wiz", "R", "rest", 0.25, "inOut"); A(4.5, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(3.85, "gsl", "face", { lid: 0, dur: 0.1 });
A(3.9, "gsl", "look", { to: [-0.55, 0.1], dur: 0.12, blink: false });
const BAND = [PEN.x, PEN.y, PEN.z];
A(3.78, "gsl", "look", { to: [0.2, -0.35], dur: 0.06, blink: false });   // a glance down at the bandana
tp = pen.carry(3.85, [BAND[0], r3(BAND[1] + 0.04), r3(BAND[2] + 0.02)], 0.18, "inOut");
A(r3(tp + 0.02), "gsl", "release", { prop: "pen", to: BAND, dur: 0.04 });
c.prop(r3(tp + 0.08), "pen", { scale: 0.001 }, 0.04, "in");
A(r3(tp + 0.04), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.12 }); c.arm(r3(tp + 0.06), "gsl", "L", "rest", 0.3, "inOut");
A(4.0, "rea", "look", { to: [-0.6, 0.05], dur: 0.15, blink: false });
A(4.2, "rea", "nod", { times: 1 });
see(4.15, 4.4, ["wiz.face", "rea.face", "fridge"], "panel 4: the Wizard jabs his thumb at the fridge, Reaper nods");

// ---------------------------------------------------------------- 5 NOT ONE FREE SPOT 4.4-5.8 (panel 5, slow push-in)
// he walks to the fridge, holds the note up to it: the middle (full), the side (full), bends down (full); scratches his
// head ("?"); then spots the one bare place: the handle
A(4.36, "gsl", "look", { to: [-0.6, 0.0], dur: 0.1, blink: false });
A(4.42, "gsl", "move", { to: GS, dur: 0.55, ease: "inOut", steps: 3 }); A(4.42, "gsl", "turn", { to: -40, dur: 0.45 });
tn = note.carry(4.42, front(GS, -40, 0.3, -0.33, 0.5), 0.5, "inOut");   // carried low at his right side, off his face
// the Wizard watches him go, his cup at his chest
A(4.5, "wiz", "look", { to: [-0.6, 0.05], dur: 0.15, blink: false });
const TRY = [
  [5.0, [-0.62, 0.78, -1.2], [-0.4, 0.15]],   // the middle of the door, as high as his arm goes under his brim
  [5.2, [-0.5, 0.8, -1.3], [-0.45, 0.2]],     // the side of the fridge
  [5.38, [-0.78, 0.4, -1.14], [-0.4, -0.45]],  // bent down: the bottom of the door
];
for (const [t, at, eye] of TRY) {
  A(r3(t - 0.06), "gsl", "look", { to: eye, dur: 0.08, blink: false });
  tn = note.carry(r3(t - 0.06), at, 0.11, "out");
  A(r3(t + 0.07), "gsl", "look", { to: [r3(eye[0] + 0.15), eye[1]], dur: 0.05, blink: false });   // a little shake: full
}
A(5.28, "gsl", "crouch", { to: 0.5, dur: 0.12 }); A(5.48, "gsl", "crouch", { to: 0, dur: 0.12 });
A(4.95, "gsl", "expr", { expr: "eager", set: { pucker: 0.4 }, dur: 0.15 });
// scratching his head, the note pulled back to his chest; the left hand scratches under the hat brim's side
tn = note.carry(5.47, front(GS, -40, 0.3, -0.33, 0.5), 0.16, "inOut");   // low at his right side, off his face
c.arm(5.48, "gsl", "L", { o: [0.26, 0.92, 0.04] }, 0.1, "out"); A(5.5, "gsl", "grip", { side: "L", shape: "relaxed", set: { curl: 0.7 }, dur: 0.06 });
for (const t of [5.58, 5.66]) { c.arm(t, "gsl", "L", { o: [0.27, 0.95, 0.0] }, 0.04, "inOut"); c.arm(r3(t + 0.04), "gsl", "L", { o: [0.26, 0.92, 0.05] }, 0.04, "inOut"); }
A(5.4, "gsl", "expr", { expr: "eager", set: { curve: -0.05, open: 0.25, pucker: 0.4, raise: 0.035 }, dur: 0.12 });
act.emote(c, 5.3, "gsl", "?", { dur: 0.55, size: 110, dx: 0.3, dy: -0.5, angle: -8 });   // beside his brim (review B)
A(5.52, "gsl", "look", { to: [0.1, 0.5], dur: 0.08, blink: false });
c.arm(5.74, "gsl", "L", "rest", 0.25, "inOut");
// the handle: his eyes find it (a grin)
A(5.68, "gsl", "look", { to: [-0.55, 0.05], dur: 0.06, blink: false });
A(5.7, "gsl", "expr", { expr: "delighted", dur: 0.1 });
see(4.5, 5.75, ["gsl.face", "fridge", "note"], "panel 5: the wall of IOUs; every spot is taken; he holds his note up to it, confused");

// ---------------------------------------------------------------- 6 THE HANDLE 5.8-6.9 (panel 6)
// slapped onto the handle (hit-stop), patted twice, proud. Cut to the Wizard: a slow facepalm.
const ON = handleAt(0, TAG_Y, 0.02);
tn = note.carry(5.76, [ON[0], ON[1], r3(ON[2] + 0.06)], 0.1, "in", { rot: 0 });
A(r3(tn), "gsl", "release", { prop: "note", to: ON, dur: 0.02 });
c.prop(r3(tn + 0.02), "fridge", { tagged: 1 }, 0.01, "linear");
c.prop(r3(tn + 0.03), "note", { scale: 0.001 }, 0.01, "linear");   // it is the fridge's own handle note from here
sfx(r3(tn), "pat", { gain: 0.55, reason: "the note slapped onto the fridge handle" });
c.hitStop(HS1, 3);
A(r3(tn + 0.02), "gsl", "grip", { side: "R", shape: "flat", dur: 0.04 });
// two proud pats: the flat palm on the note, off, on
const PAT1 = { world: [r3(ON[0] + 0.02), ON[1], r3(ON[2] + 0.1)] }, PAT0 = { world: [r3(ON[0] + 0.05), r3(ON[1] - 0.12), r3(ON[2] + 0.12)] }   // lifted off and down: the camera sees the note above it;
c.arm(5.92, "gsl", "R", PAT0, 0.15, "inOut");   // the hand lifts clear: ta-da, the fresh note on the handle (held 0.13 s)
c.arm(6.2, "gsl", "R", PAT1, 0.06, "in");
sfx(6.26, "pat", { gain: 0.35, reason: "a proud pat on his note" });
c.arm(6.27, "gsl", "R", PAT0, 0.06, "inOut"); c.arm(6.33, "gsl", "R", PAT1, 0.06, "in");
sfx(6.39, "pat", { gain: 0.35, reason: "and another" });
c.arm(6.4, "gsl", "R", "rest", 0.3, "inOut"); A(6.41, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(6.0, "gsl", "expr", { expr: "happy", set: { curve: 0.9, open: 0.3 }, dur: 0.12 }); A(6.0, "gsl", "face", { lid: 1, dur: 0.08 });
A(6.4, "gsl", "face", { lid: 0, dur: 0.1 });
// he steps back in front of the door and turns round to his friends, chest out, proud (his back to the fridge)
A(6.42, "gsl", "look", { to: [0.4, 0.0], dur: 0.1, blink: false });
A(6.46, "gsl", "move", { to: G1, dur: 0.44, ease: "inOut", steps: 2 }); A(6.46, "gsl", "turn", { to: G1_YAW, dur: 0.4 });
A(6.85, "gsl", "squash", { amount: -0.03, dur: 0.2 });
A(6.85, "gsl", "expr", { expr: "cocky", dur: 0.15 });
see(5.92, 6.4, ["gsl.face", "fridge"], "panel 6: the note on the handle, his proud pats");
// the Wizard: a slow facepalm (his free hand on his cheek, eyes shut, a slow head shake)
A(5.96, "wiz", "look", { to: [-0.45, 0.0], dur: 0.12, blink: false });
c.arm(6.0, "wiz", "R", { o: [-0.1, 0.5, 0.3] }, 0.45, "in"); A(6.1, "wiz", "pitch", { to: 6, dur: 0.4 }); A(6.85, "wiz", "pitch", { to: 0, dur: 0.3 }); A(6.1, "wiz", "grip", { side: "R", shape: "flat", dur: 0.2 });
A(6.2, "wiz", "face", { lid: 1, dur: 0.15 }); A(6.2, "wiz", "expr", { expr: "annoyed", dur: 0.2 });
for (const [t, x] of [[6.4, -0.2], [6.58, -0.45], [6.76, -0.25]]) A(t, "wiz", "look", { to: [x, -0.1], dur: 0.16, blink: false });
c.arm(6.88, "wiz", "R", "rest", 0.3, "inOut"); A(6.9, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(6.9, "wiz", "face", { lid: 0.3, dur: 0.12 });
see(6.45, 6.88, ["wiz.face"], "panel 6: the Wizard's slow facepalm");
// Reaper, eyes first, steps into the place Gunslinger left at the handle (behind him, the Wizard's facepalm on screen).
// His cup goes with him in his right hand
// held low at his right side while he works the fridge with his left hand (in front of him it would be in the fridge)
const CUP_AT = (at, yaw) => front(at, yaw, 0.2, -0.42, 0.42);
A(6.28, "rea", "look", { to: [-0.6, -0.1], dur: 0.1, blink: false });
A(6.38, "rea", "move", { to: RP0, dur: 0.52, ease: "inOut", steps: 2 }); A(6.38, "rea", "turn", { to: RP0_YAW, dur: 0.45 });
rcup.carry(6.38, CUP_AT([r3((R0[0] + RP0[0]) / 2), r3((R0[1] + RP0[1]) / 2)], r3((R_YAW + RP0_YAW) / 2)), 0.26, "in");
rcup.carry(6.64, CUP_AT(RP0, RP0_YAW), 0.26, "out");

// ---------------------------------------------------------------- 7 THE BILL LANDS 6.9-8.6 (panel 7)
// Reaper's right mitten closes over the handle (and the new note), he yanks the door open (hit-stop): the door whips
// out from under the notes, which hang for a moment, then come down in one long yellow avalanche onto Gunslinger
const YANK = 7.1;
c.arm(6.92, "rea", "L", { world: handleAt(0, TAG_Y, 0.03) }, 0.14, "out"); A(6.92, "rea", "grip", { side: "L", shape: "open", dur: 0.1 });
A(7.02, "rea", "grip", { side: "L", shape: "hold", dur: 0.06 });
A(6.95, "rea", "look", { to: [0.1, 0.15], dur: 0.1, blink: false });
c.prop(YANK, "fridge", { open: 0.25 }, 0.1, "in");
c.arm(YANK, "rea", "L", { world: handleAt(26, TAG_Y, 0.03) }, 0.1, "in");
sfx(r3(YANK + 0.02), "latch-click", { gain: 0.5, reason: "the fridge door's latch letting go" });
A(r3(YANK + 0.1), "rea", "grip", { side: "L", shape: "open", dur: 0.05 });
c.prop(r3(YANK + 0.1), "fridge", { open: 1 }, 0.32, "out");
A(r3(YANK + 0.1), "rea", "pitch", { to: -6, dur: 0.15 }); A(r3(YANK + 0.3), "rea", "pitch", { to: 0, dur: 0.25 });   // leaning back on the pull
c.arm(r3(YANK + 0.12), "rea", "L", "rest", 0.3, "inOut");
c.hitStop(HS2, 3);
// the avalanche
c.prop(r3(YANK + 0.08), "fridge", { fall: 1 }, 0.95, "linear");
sfx(r3(YANK + 0.14), "flutter", { gain: 0.55, reason: "the notes peeling off and sliding down: a long papery rush" });
sfx(r3(YANK + 0.5), "flutter", { gain: 0.5, dur: 0.9, reason: "the second, longer rush as the heap buries him" });
// Gunslinger hears it and looks up and back over his shoulder: shocked, then gone under them (the hat and the moth
// on top)
A(7.18, "gsl", "look", { to: [-0.35, 0.6], dur: 0.06, blink: false });
act.shock(c, 7.2, "gsl", { hold: 0.6 });
see(7.22, 7.5, ["gsl.face"], "panel 7: his shocked face up at the notes coming off the door, before they bury him");
A(7.3, "gsl", "squash", { amount: 0.04, dur: 0.18 });
// the Wizard steps closer to look, his cup still in hand
A(7.45, "wiz", "look", { to: [-0.55, -0.1], dur: 0.12, blink: false });
A(7.55, "wiz", "move", { to: W2, dur: 0.45, ease: "inOut", steps: 2 }); A(7.55, "wiz", "turn", { to: W2_YAW, dur: 0.4 });
wcup.carry(7.55, front(W2, W2_YAW, 0.46, 0.1, 0.5), 0.45, "inOut");
c.arm(7.6, "wiz", "R", "hips", 0.35, "inOut");   // his free hand on his hip as he watches
// Reaper, unbothered, steps in and takes the milk off the bottom shelf, then steps back out to pour
A(7.45, "rea", "move", { to: RP2, dur: 0.3, ease: "inOut", steps: 2 }); A(7.45, "rea", "turn", { to: RP2_YAW, dur: 0.25 });
rcup.carry(7.45, CUP_AT(RP2, RP2_YAW), 0.3, "inOut");
A(7.5, "rea", "look", { to: [0.1, -0.35], dur: 0.12, blink: false });
const milk = grips.mug(c, "rea", MILK, { side: "L", height: 0.4 });
let tm = milk.secure(milk.approach(7.56, 0.15), 0.1);
tm = milk.carry(r3(tm), [MILK.x, r3(MILK.y + 0.03), r3(MILK.z + 0.25)], 0.12, "out");   // out of the fridge first
A(r3(tm - 0.12), "rea", "look", { to: [0.3, -0.1], dur: 0.1, blink: false });
// he steps back out and turns round to us, the milk coming round on his left
// both hands ride at his sides through the turn (a waypoint at the half turn), then come in front of him for the pour
// a steady turn (linear, so the hands can follow it exactly) with both props held in front of him, re-aimed every
// eighth of a turn: they turn with him, and a straight line between two points further apart would cut his body
const T3 = r3(tm);
A(T3, "rea", "move", { to: RP3, dur: 0.4, ease: "inOut", steps: 2 }); A(T3, "rea", "turn", { to: RP3_YAW, dur: 0.4, ease: "linear" });
const CUPR_HOLD = front(RP3, RP3_YAW, 0.47, -0.1, 0.36);
const MILK_UP = front(RP3, RP3_YAW, 0.47, 0.06, 0.52);
for (let k = 1; k <= 4; k++) {
  const u = k / 4, at = [r3(RP2[0] + (RP3[0] - RP2[0]) * u), r3(RP2[1] + (RP3[1] - RP2[1]) * u)], yaw = r3(RP2_YAW + (RP3_YAW - RP2_YAW) * u);
  const t = r3(T3 + 0.1 * (k - 1));
  rcup.carry(t, k === 4 ? CUPR_HOLD : front(at, yaw, 0.47, -0.2, 0.4), 0.1, "linear");
  tm = milk.carry(t, k === 4 ? MILK_UP : front(at, yaw, 0.47, 0.2, 0.55), 0.1, "linear");
}
see(V(7.4), V(8.6), ["fridge", "rea"], "panel 7: the open fridge, the yellow avalanche burying Gunslinger, Reaper reaching for the milk");

// ---------------------------------------------------------------- 8 THE WINK 8.6-9.8 (panel 8)
// the heap shifts: his head and a mitten pop out, thumbs up, hat tip, wink: "Next time's on me!". Reaper pours his
// milk; the Wizard sips; one last note flutters down onto his lid and he looks at it, deadpan, mid-sip.
const WK = V(8.8);
c.prop(r3(WK - 0.12), "fridge", { drop: 1 }, 0.16, "out");
sfx(r3(WK - 0.12), "flutter", { gain: 0.35, dur: 0.4, reason: "the heap shifting as he pops out of it" });
A(r3(WK - 0.1), "gsl", "squash", { amount: -0.04, dur: 0.12 });
A(r3(WK - 0.12), "gsl", "expr", { expr: "cocky", dur: 0.1 });
A(r3(WK - 0.12), "gsl", "turn", { to: 0, dur: 0.15 });
c.arm(r3(WK - 0.05), "gsl", "R", { o: [0.3, 0.84, 0.36] }, 0.15, "out");   // up out of the heap, clear of it (review B) A(r3(WK - 0.05), "gsl", "grip", { side: "R", shape: "thumb", dur: 0.1 });
wink(c, { who: "gsl", t: WK, until: END, pos: SUB_HIGH, side: "L", brimTouch: { o: [0.3, 0.93, 0.08] } });
// Reaper pours: the bottle tips over his cup, a thin white stream
const POUR = r3(WK - 0.1);
milk.carry(POUR, front(RP3, RP3_YAW, 0.48, -0.03, 0.56), 0.2, "inOut", { tip: 75 });
c.prop(r3(POUR + 0.2), "pour", { x: CUPR_HOLD[0], y: r3(CUPR_HOLD[1] + 0.13 + 0.14), z: CUPR_HOLD[2], pour: 0 }, 0.01, "linear");
c.prop(r3(POUR + 0.22), "pour", { pour: 1 }, 0.1, "out");
for (const dt of [0.24, 0.42, 0.63]) sfx(r3(POUR + dt), "ai/drip", { gain: 0.18, reason: "the milk running into Reaper's coffee" });
A(POUR, "rea", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
// the Wizard lifts his cup and sips, eyes shut
const WSIP = front(W2, W2_YAW, 0.38, 0.04, 0.7);
A(r3(V(8.45) - 0.14), "wiz", "look", { to: [-0.1, -0.4], dur: 0.1, blink: false });
const tw = wcup.carry(V(8.45), WSIP, 0.25, "inOut", { tip: -20 });
A(r3(tw), "wiz", "face", { lid: 1, dur: 0.1 });
sfx(r3(tw + 0.05), "ai/sip", { gain: 0.35, reason: "the Wizard's sip, eyes shut" });
// the last note: drifts down rocking from the heap's top and lands on his lid; his eyes open on it
const LID = [WSIP[0], r3(WSIP[1] + 0.135), WSIP[2]];
const LAND = V(9.35);
c.at(r3(LAND - 0.7), { do: "prop", id: "last", set: { scale: 1, wag: 1, x: 0.1, y: 1.5, z: -0.45 }, dur: 0.02, ease: "linear", reason: "the last note sliding off the top of the heap: paper rocks down like a leaf, which the rigid-body physics does not do" });
c.at(r3(LAND - 0.68), { do: "prop", id: "last", set: { x: r3(LID[0] - 0.12), y: 1.05, z: r3(LID[2] + 0.22) }, dur: 0.35, ease: "inOut", reason: "rocking down toward the Wizard" });
c.at(r3(LAND - 0.33), { do: "prop", id: "last", set: { x: LID[0], y: LID[1], z: LID[2], tip: -75, wag: 0 }, dur: 0.33, ease: "out", reason: "it settles flat on his lid" });
sfx(LAND, "flutter", { gain: 0.15, dur: 0.25, reason: "the last note landing on the Wizard's coffee lid" });
A(r3(LAND - 0.13), "wiz", "look", { to: [-0.1, -0.5], dur: 0.12, blink: false });   // his eyes lead the landing
A(r3(LAND - 0.05), "wiz", "face", { lid: 0.3, dur: 0.12 });
A(r3(LAND + 0.1), "wiz", "expr", { expr: "deadpan", dur: 0.2 });
see(r3(WK + 0.2), r3(WK + 0.75), ["gsl.face", "moth"], "panel 8: the wink and the thumbs up from the pile, the moth lifting");
see(r3(LAND + 0.05), END, ["wiz.face", "last"], "panel 8: the last IOU on the Wizard's coffee lid, his deadpan look");

// blinks off the lines and the key looks
act.blinksAt(c, "wiz", [1.4, 3.3, 5.3]); act.blinksAt(c, "rea", [1.3, 3.6, 5.5]); act.blinksAt(c, "gsl", [1.32, 4.3]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panel 1), closer and lower (reach rules v2, B1): the fridge at the left edge, the three in front of it
const WIDE = { pos: [0.35, 1.8, 4.1], look: [0.25, 0.66, -0.6], fov: 48 };   // medium-wide (reach rules v2, B1): the two of them big, the fridge at the edge
// the pocket pat (panel 2): Gunslinger chest up with the whole hat, from the Wizard's side: his palm at the right edge
const PATSHOT = fw([r3(G0[0] + 0.2), 0.9, G0[1]], { w: 1.6, az: 14, el: 4, fov: 30 });   // the Wizard's palm and brim at the right edge (review B)
// the IOU held up (panel 3): closer on him and the note, his sprout under the subtitle line (y 470-650 stays free for "I forgot my money!")
const IOU = fw([r3(G0[0] - 0.04), 1.05, G0[1]], { w: 1.2, az: 6, el: 4, fov: 30 });
// the Wizard and Gunslinger, Reaper between them at the back, the fridge behind at the left (panel 4)
const TWO = { pos: [0.6, 1.8, 3.5], look: [0.12, 0.75, -0.7], fov: 56 };
// the slow push-in toward the fridge as he looks for a free spot (panel 5)
const PUSH = { pos: [0.4, 1.45, 2.7], look: [-0.6, 0.95, -1.2], fov: 42, to: { pos: [0.3, 1.4, 2.3] }, dur: 1.4 };
// Gunslinger at the handle, middle distance, from the fridge's side of the room (panel 6), then the Wizard's facepalm
const HANDLE = { pos: [-1.2, 1.05, 1.4], look: [-0.5, 0.8, -1.0], fov: 44 };   // low and from the door's side: the handle and its note at the left, clear of his brim, his face at the right (review B)
const WIZCU = fw([W0[0], 0.84, W0[1]], { w: 1.1, az: -12, el: 4, fov: 30 });   // v3 B8: the Wizard's face, his palm at the edge
const FACEPALM = fw([W0[0], 0.82, W0[1]], { w: 1.3, az: -25, el: 4, fov: 30 });
// the fridge door swinging open at the left, Gunslinger proud in front of it, Reaper at the handle at the right (panel 7)
const P7 = { pos: [0.1, 2.3, 4.6], look: [-0.45, 0.62, -0.9], fov: 54 };
// the wink, from above their heads: Gunslinger in the heap in front of the open fridge (left), Reaper pouring behind
// (middle), the Wizard sipping (right) (panel 8)
const P8 = { pos: [-0.25, 2.5, 3.5], look: [-0.25, 0.6, -0.6], fov: 56 };
const beats = c.beats([
  ["P1 pay up", 0, WIDE, "hook"],
  ...(V3 ? [["P1b the Wizard (v3 B8)", CU, WIZCU, "reaction"]] : []),
  ["P2 the pocket pat", PAT.from, PATSHOT],
  ["P3 the IOU", 2.8, IOU],
  ["P4 look at this", 3.8, TWO],
  ["P5 not one free spot", 4.4, PUSH, "escalation"],
  ["P6 the handle", 5.8, HANDLE],
  ["P6b facepalm", 6.42, FACEPALM, "reaction"],
  ["P7 the bill lands", 6.9, P7, "reveal"],
  ["P8 the wink", WK, P8, "payoff"],
], END);
if (V3) { const pr = c.captions.find((x) => x.text.startsWith("This time")); pr.to = CU; }
// v3: the allowClip windows below are on the video clock, so every time after the freeze moves 0.7 s later
const VW = (w) => (V3 ? { ...w, from: w.from > FZ ? r3(w.from + FZD) : w.from, to: w.to > FZ ? r3(w.to + FZD) : w.to } : w);

write(import.meta.url, {
  id: V3 ? "coffee-run-v3rules" : "coffee-run",
  ...(V3 && { seed: "coffee-run" }),   // the posted cut's music
  title: "That one friend who never has money… on a coffee run",
  idea: "Never has money, episode 2: the Wizard is back with the coffees, palm out; the pocket pat finds a moth; Gunslinger writes an IOU and goes to stick it on the fridge, which is covered in his IOUs; the handle is the only free spot; Reaper opens the fridge for milk and the notes bury him; next time's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.6,
  set: { type: "plain", color: "#e9d9b8", floor: "#c9955a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/kitchen-morning.png", z: -2.0, center: [0.3, 1.45], height: 3.4, depth: false, motion: false, dust: 10 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "lofi", key: 3, bpm: 84, lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 7.3, part: "stop" }, { at: 8.8, part: "hush" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: V3 ? [10.7, 10.7] : [10, 10] },
  hook: { show: ["wiz", "gsl", "rea", "tray", "fridge"], hint: 0.4, what: "the Wizard back from the coffee run, palm out for 4.50; the yellow fridge behind" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // windows on the video clock (this storyboard is gate 1): after the hit-stops at 5.9 and 7.2 the times are 0.1 and
  // 0.2 s later than the story times above
  allowClip: [
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.05, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: 2.27, to: 2.33, checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: 2.38, to: 2.52, checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", with: "note", from: 2.9, to: 3.1, reason: "he pulls the note out from under his bandana" },
    { who: "gsl", with: "pen", from: 2.85, to: 4.2, reason: "he pulls the marker out of his bandana's knot and tucks it back" },
    { who: "gsl", from: 1.5, to: 1.78, checks: ["rig-jump"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s (episode 1's block)" },
    { who: "gsl", from: 3.2, to: 3.72, checks: ["prop-pop", "motion"], reason: "quick marker scribbles on the note: the pen rocks in his fist with each stroke" },
    { who: "gsl", from: 4.94, to: 5.0, checks: ["prop-pop"], reason: "he slaps the note up high on the door: a quick stretch" },
    { who: "gsl", from: 6.04, to: 6.12, checks: ["hand-turn"], reason: "his flat palm comes off the note he has just slapped on, on the frame after the hit-stop: the hand turns from the bar to his side" },
    { who: "gsl", from: 5.8, to: 6.05, checks: ["prop-pop", "hand-turn", "hand-pop"], reason: "the slap onto the handle: the note leaves his fist and his palm turns flat onto it on the hit-stop frame" },
    { who: "gsl", from: 6.25, to: 6.6, checks: ["rig-jump"], reason: "two quick proud pats on the note, then the hand drops off it" },
    { who: "rea", from: 8.25, to: 8.5, checks: ["hand-turn", "hand-pop"], reason: "his milk hand turns over as he turns round from the fridge, hidden behind his own body and the heap (checked in a frame strip)" },
    { who: "rea", from: 8.75, to: 9.1, checks: ["hand-turn", "hand-pop", "prop-pop"], reason: "he tips the milk bottle over his cup to pour: the wrist turns with the bottle" },
    { who: "gsl", with: "cupG", from: 0.6, to: 1.2, reason: "his lips on the cup's lid: a sip" },
    { who: "wiz", with: "cupW", from: 8.45, to: 10, reason: "his lips on the cup's lid: a sip" },
    { who: "wiz", with: "scarf", from: 0, to: 10, reason: "his scarf (worn)" },
    { who: "rea", with: "fridge", from: 6.95, to: 7.55, reason: "his mitten closed round the fridge handle (over the new note) for the yank" },
    { who: "gsl", with: "fridge", from: 5.85, to: 6.4, checks: ["hand-in-prop"], reason: "his flat palm slaps and pats his note onto the handle bar: the fingers press the note onto the bar" },
    { who: "rea", with: "milk", from: 7.7, to: 10, reason: "he takes the milk off the fridge shelf and pours it" },
    { who: "rea", with: "fridge", from: 7.5, to: 8.9, checks: ["costume-in-prop"], reason: "his cloak brushes the cabinet's front edge as he pulls the door and leans in for the milk" },
    // the heap of notes is part of the fridge prop (its paper is not solid: userData.solid false); the body-in-prop box
    // check boxes the whole heap, so it is waived for the bodies the heap lies round, and only that check
    { who: "gsl", with: "fridge", from: 7.15, to: 10, checks: ["clipping"], reason: "buried in the heap of his paper IOUs (the brief's payoff): paper, not a solid" },
    { who: "rea", with: "fridge", from: 7.15, to: 10, checks: ["clipping"], reason: "the notes drift down round his feet: the heap's box takes him in, the paper isn't solid" },
    { who: "wiz", with: "fridge", from: 7.6, to: 10, checks: ["clipping"], reason: "he stands at the edge of the heap of notes: its box takes him in, the paper isn't solid" },
  ].map(VW),
  notes: "Generated by storyboards/series/never-has-money/02-coffee-run/make-coffee-run.mjs. Panels: PANELS.md.",
});
