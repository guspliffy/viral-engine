// DRAGON VS. THE CANDLE v2 (Jonny's story library #14, 29 Oct 2026), built from the clip template.
// node storyboards/candle/make-dragon-vs-the-candle.mjs -> storyboards/candle/dragon-vs-the-candle.json
//
// THE BRIEF (story library 14, ENGINE-PROMPT.md), then Jonny's notes on v1 (29 Oct 11:41, with a six-panel sheet):
// "something like happy birthday blow out the candle, then the dragon spits fire; the spat fire should be bigger; the
// candle should immediately light bigger when the fire hits it; a bit shorter, with more action: a wow effect".
//   Joke:        Dragon is told to blow out his birthday candle, but his breath is fire: every try makes it flare.
//   Wants:       Dragon wants the candle out; the Wizard wants the problem solved.
//   Consequence: the Wizard snaps a glass cake dome over it; Dragon's relieved sigh relights it, bigger than ever.
//   Ending:      the Wizard's dry, half-lidded sideways look meets Dragon's guilty smile, held.
//
//   01 0.00-2.20  "Happy birthday! Blow out the candle!": Dragon draws a huge breath and SPITS FIRE (0.95); the jet hits
//                 the wick and the candle erupts at once (1.1): flash, shake, embers
//   02 2.20-3.40  be careful: a tiny puff, and it flares again; the Wizard's finger: wait
//   03 3.40-6.10  solved: the Wizard snaps the dome over it (rim down 4.55), the flame dies; dome off and back (6.25)
//   04 6.10-7.05  relief: Dragon shuts his eyes and sighs...
//   05 7.05-9.60  ...FWOOMP: the sigh relights it into a tall flare; the Wizard's dry look, Dragon's guilty smile
//
// Hands: the Wizard's own LEFT (nearest the candle and Dragon) raises the "wait" finger and then carries the dome; his
// own RIGHT rests on the table all clip. Dragon's paws rest on the table.
// State: plate, cupcake and candle never move; the dome rests open side down left of the plate, is carried by its
// knob, sits on the plate's flat middle 4.55-5.3 and goes back to exactly where it was (6.25), still open side down.
// The flame: lit -> FLARE (1.1-2.0) -> lit -> flare (2.75-3.2) -> lit -> out under the dome (4.6-4.95) -> FLARE (7.05).
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { CANDLE } from "../../engine/page/props-candle.js";

const c = clip(), { A, sfx } = c;
const END = 9.6;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const WIZ = [-0.5, 0.0], DRA = [0.53, -0.04];                     // a gap between the bodies in every shot
const TABLE_H = 0.27, TABLE_Z = 0.8, TABLE_D = 0.9;
const S = 1.6;                                                     // the props' scale (cupcake, plate and dome share it)
const PLATE = [0.03, TABLE_H, 0.66], PLATE_TOP = r3(TABLE_H + CANDLE.plate.top * S);
const CAKE = [PLATE[0], PLATE_TOP, PLATE[2]];
const WICK = [CAKE[0], r3(PLATE_TOP + CANDLE.wickTop * S), CAKE[2]];
const DOME0 = [-0.27, TABLE_H, 0.74];                              // left of the plate, in front of the Wizard
const FLAME_TIP = WICK[1] + 0.06;                                   // the flame's tip at rest (world)
const LIFT = r3(FLAME_TIP + 0.025);                                 // the rim's height while the dome passes over the flame
const ON_PLATE = [PLATE[0], PLATE_TOP, PLATE[2]], UP_PLATE = [PLATE[0], LIFT, PLATE[2]];
// on the way back the flame is out, so the rim only has to clear the candle: a lower lift keeps the fist off Dragon's face
const OFF_PLATE = [PLATE[0], r3(WICK[1] + 0.03), PLATE[2]];
// the way over: up and toward the plate at once, so the dome rises beside the Wizard's face, never in front of it
const WAY = [r3(PLATE[0] - 0.13), r3(LIFT - 0.015), r3((PLATE[2] + DOME0[2]) / 2)];
const KNOB_ABOVE = { prop: "dome", grip: [0.05, CANDLE.knobY + 0.03, 0.01] };   // above and to the right of the knob, below his eyes
// embers burst from the wick (a poof with no smoke: its sparks start half a metre above its pos)
const EMBERS = (t, n = 16, dur = 0.9, puffs = 0) => c.at(t, { fx: "poof", pos: [WICK[0], r3(WICK[1] - 0.5), WICK[2]], puffs, color: "#ffd9a8", sparks: n, spark: "#ffb347", sparkSize: 0.45, speed: 0.55, dur });

// eye targets (face look space: + right on screen, + up)
const WIZ_AT_CAKE = [0.5, -0.45], WIZ_AT_FLARE = [0.45, 0.25], WIZ_AT_DOME = [0.18, -0.7], WIZ_AT_DRA = [0.8, 0.0];
const DRA_AT_CAKE = [-0.5, -0.3], DRA_AT_FLARE = [-0.45, 0.3], DRA_AT_WIZ = [-0.8, -0.02];

const PAW = (x, z = 0.5) => ({ world: [x, r3(TABLE_H + 0.035), z] });
const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: 14, expr: "eager", follow: 0.2, seed: 2.6, signature: false },
  { id: "dra", character: "lookdev/dragon-crisp-table", at: DRA, face: -16, expr: "focused", follow: 0.25, seed: 4.1 },
];
const props = [
  { id: "table", kind: "coffeetable", x: 0, z: TABLE_Z, h: TABLE_H, w: 2.8, d: TABLE_D, color: "#ecd6ad", leg: "#c99a64" },
  { id: "plate", kind: "dessertplate", x: PLATE[0], y: PLATE[1], z: PLATE[2], scale: S },
  { id: "cupcake", kind: "cupcake", x: CAKE[0], y: CAKE[1], z: CAKE[2], scale: S, lit: 1 },
  { id: "dome", kind: "cakedome", x: DOME0[0], y: DOME0[1], z: DOME0[2], scale: S },
  { id: "breath", kind: "breath", mouth: "dra", target: "cupcake", at: [0, CANDLE.wickTop + 0.008, 0] },
];
const stopBlow = (t, dur = 0.15) => c.prop(t, "breath", { on: 0, len: 0, fire: 0 }, dur);

// ---------------------------------------------------------------- frame 0: the birthday, Dragon already drawing breath
A(0, "wiz", "arm", { side: "R", pose: PAW(-0.74, 0.48), dur: 0 });
A(0, "wiz", "grip", { side: "R", shape: "paw", dur: 0 });
A(0, "wiz", "arm", { side: "L", pose: PAW(-0.47, 0.44), dur: 0 });
A(0, "wiz", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.01, blink: false });
A(0, "wiz", "expr", { expr: "eager", set: { curve: 0.9, open: 0.35 }, dur: 0.01 });   // "Happy birthday!"
A(0, "dra", "arm", { side: "R", pose: PAW(0.5, 0.44), dur: 0 });
A(0, "dra", "grip", { side: "R", shape: "paw", dur: 0 });
A(0, "dra", "arm", { side: "L", pose: PAW(0.78, 0.44), dur: 0 });
A(0, "dra", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.01, blink: false });
A(0, "dra", "expr", { expr: "focused", set: { pucker: 0.5, open: 0.25, eye: 1.05 }, dur: 0.01 });
A(0, "dra", "lean", { to: 2, dur: 0.01 });
// a huge breath in: he rears back and swells (0-0.9)
A(0, "dra", "lean", { to: 9, dur: 0.85, ease: "inOut" });
A(0, "dra", "pitch", { to: 10, dur: 0.85, ease: "inOut" });
A(0, "dra", "squash", { amount: -0.14, dur: 0.85 });
A(0.1, "dra", "expr", { expr: "focused", set: { pucker: 0.7, open: 0.1, eye: 0.6 }, dur: 0.6 });   // eyes squeeze as he fills up
sfx(0.05, "gasp", { gain: 0.45, reason: "Dragon draws a big breath in (0-0.9)" });
act.blinksAt(c, "wiz", [3.25, 5.75]);
act.blinksAt(c, "dra", [3.95]);

// ---------------------------------------------------------------- 01 HAPPY BIRTHDAY -> FIRE (0.00-2.20)
c.cap(0, 1.75, "Happy BIRTHDAY! Blow out the candle!", 225);
A(0.55, "wiz", "look", { to: WIZ_AT_CAKE, dur: 0.15, blink: false });   // he looks at the candle, waiting
// 0.9: he throws himself forward and spits fire: a jet that reaches the wick by 1.1
A(0.88, "dra", "lean", { to: -14, dur: 0.14, ease: "out" });
A(0.88, "dra", "pitch", { to: -4, dur: 0.14, ease: "out" });
A(0.88, "dra", "squash", { amount: 0.08, dur: 0.2 });
A(0.88, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.55, eye: 0.8 }, dur: 0.1 });
A(0.88, "dra", "face", { brow: -0.3, lid: 0.2, dur: 0.1 });
c.prop(0.95, "breath", { on: 1, fire: 1, len: 0.15 }, 0.03);
c.prop(0.98, "breath", { len: 1 }, 0.12, "out");
sfx(0.92, "whoosh", { gain: 0.7, reason: "the fire jet leaves his mouth (0.95)" });
// 1.1: it hits the wick and the candle erupts at once
c.prop(1.1, "cupcake", { fire: 1, bend: 0.15 }, 0.06, "out");
sfx(1.0, "ai/flare", { gain: 1.4, reason: "the candle erupts into a tall flame (1.1): fwoomp, loudest 0.1 s in" });
c.at(1.1, { fx: "flash", peak: 0.55, dur: 0.25 });
c.at(1.1, { fx: "shake", amp: 0.06, dur: 0.45 });
EMBERS(1.1, 36, 0.9, 2);
stopBlow(1.3, 0.12);
c.prop(1.4, "cupcake", { bend: 0 }, 0.3);
c.prop(1.8, "cupcake", { fire: 0 }, 0.4, "inOut");                // it roars, then sinks back to a candle flame
// both jolt back, eyes wide
A(1.2, "wiz", "look", { to: WIZ_AT_FLARE, dur: 0.1, blink: false });
A(1.2, "wiz", "expr", { expr: "shocked", set: { open: 0.5, eye: 1.25, curve: -0.2 }, dur: 0.12 });
A(1.2, "wiz", "face", { brow: 0.5, dur: 0.12 });
A(1.2, "wiz", "lean", { to: 7, dur: 0.2, ease: "out" });
A(1.2, "wiz", "squash", { amount: 0.04, dur: 0.2 });
A(1.32, "wiz", "still", { dur: 0.5, idle: 0.08 });
A(1.25, "dra", "look", { to: DRA_AT_FLARE, dur: 0.1, blink: false });
A(1.25, "dra", "expr", { expr: "shocked", set: { open: 0.5, eye: 1.25, pucker: 0, curve: -0.25 }, dur: 0.12 });
A(1.25, "dra", "face", { brow: 0.5, lid: 0, dur: 0.12 });
A(1.25, "dra", "lean", { to: 4, dur: 0.22, ease: "out" });
A(1.25, "dra", "pitch", { to: -3, dur: 0.22, ease: "out" });
A(1.4, "dra", "still", { dur: 0.42, idle: 0.08 });

// ---------------------------------------------------------------- 02 BE CAREFUL (2.20-3.40)
A(1.85, "wiz", "lean", { to: 0, dur: 0.4 });
A(1.9, "wiz", "expr", { expr: "sad", set: { curve: -0.15, open: 0.1, eye: 1.1 }, dur: 0.25 });   // worried
A(1.9, "wiz", "face", { brow: 0.35, dur: 0.25 });
A(1.85, "dra", "pitch", { to: 0, dur: 0.3 });
A(1.85, "dra", "look", { to: DRA_AT_CAKE, dur: 0.15, blink: false });
A(1.9, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.12, curve: 0, eye: 0.85 }, dur: 0.18 });   // carefully...
A(1.9, "dra", "face", { brow: -0.1, lid: 0.15, dur: 0.18 });
A(1.95, "dra", "lean", { to: -7, dur: 0.3, ease: "inOut" });
c.prop(2.3, "breath", { on: 0.4, fire: 0, len: 1 }, 0.3, "out");    // a tiny puff
sfx(2.3, "blow", { dur: 0.45, gain: 0.25, reason: "Dragon's tiny careful puff (2.3-2.75): fff" });
c.prop(2.6, "cupcake", { fire: 0.75, bend: 0.1 }, 0.06, "out");    // ...and it flares again anyway
sfx(2.51, "ai/flare", { gain: 0.8, reason: "the second flare (2.6): a smaller fwoomp" });
EMBERS(2.6, 12, 0.7);
c.at(2.6, { fx: "shake", amp: 0.025, dur: 0.3 });
stopBlow(2.75, 0.15);
c.prop(2.95, "cupcake", { fire: 0, bend: 0 }, 0.4, "inOut");
A(2.7, "dra", "expr", { expr: "nervous", set: { pucker: 0, open: 0.05, curve: -0.1, eye: 1.15 }, dur: 0.15 });
A(2.7, "dra", "face", { brow: 0.4, lid: 0, dur: 0.15 });
A(2.7, "dra", "lean", { to: -1, dur: 0.3 });
// the Wizard: a finger up, wait
A(2.85, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.12, blink: false });
c.arm(2.85, "wiz", "L", { world: [-0.12, 0.6, 0.55] }, 0.22, "out");
A(2.85, "wiz", "grip", { side: "L", shape: "point", dur: 0.15 });
act.mood(c, 2.9, "wiz", "stern", { hold: 0.5 });
A(3.0, "dra", "look", { to: DRA_AT_WIZ, dur: 0.15, blink: false });
A(3.1, "dra", "still", { dur: 0.7, idle: 0.08 });

// ---------------------------------------------------------------- 03 SOLVED (3.40-6.10): the dome, quick and sure
act.eyesLead(c, 3.4, "wiz", WIZ_AT_DOME);
A(3.4, "wiz", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.9 }, dur: 0.25 });
A(3.4, "wiz", "face", { brow: 0, lid: 0.15, dur: 0.25 });
c.arm(3.4, "wiz", "L", { world: [-0.17, 0.5, 0.62] }, 0.15, "inOut");
c.arm(3.55, "wiz", "L", KNOB_ABOVE, 0.15, "inOut");
A(3.45, "wiz", "grip", { side: "L", shape: "open", dur: 0.2 });
c.arm(3.7, "wiz", "L", { prop: "dome", grip: "knob" }, 0.15, "out");
A(3.75, "wiz", "grip", { side: "L", shape: "clasp", dur: 0.1 });
A(3.85, "wiz", "grab", { prop: "dome", hand: "L", grip: "knob", pose: null, dur: 0 });   // the engine's grab sound lands on this frame
c.arm(3.9, "wiz", "L", { prop: "dome", grip: "knob", at: WAY }, 0.3, "inOut");
act.eyesLead(c, 3.9, "wiz", WIZ_AT_CAKE, { dur: 0.2 });
c.arm(4.2, "wiz", "L", { prop: "dome", grip: "knob", at: UP_PLATE }, 0.2, "inOut");
A(4.15, "wiz", "lean", { to: 4, dur: 0.35 });
A(4.27, "wiz", "look", { to: [0.32, -0.6], dur: 0.12, blink: false });   // eyes on the plate, then down
c.arm(4.4, "wiz", "L", { prop: "dome", grip: "knob", at: ON_PLATE }, 0.15, "in");      // down: the rim meets the plate at 4.55
sfx(4.55, "put-down-glass", { gain: 0.3, reason: "the dome's glass rim lands on the china plate: clink" });
c.prop(4.55, "dome", { squash: 0.03 }, 0.05); c.prop(4.6, "dome", { squash: 0 }, 0.12, "settle");
A(4.55, "wiz", "still", { dur: 0.65, idle: 0.06 });
A(4.0, "dra", "look", { to: [-0.55, 0.05], dur: 0.15, blink: false });
A(4.05, "dra", "expr", { expr: "kind", set: { curve: 0.1, eye: 1.1 }, dur: 0.2 });
A(4.05, "dra", "face", { brow: 0.25, lid: 0, dur: 0.2 });
A(4.35, "dra", "look", { to: DRA_AT_CAKE, dur: 0.15, blink: false });
// under the glass the flame dies, a puff of smoke fills it
c.prop(4.6, "cupcake", { lit: 0 }, 0.35, "in");
sfx(4.57, "ai/snuff", { gain: 0.9, reason: "the flame goes out under the dome: tss, loudest as it dies (4.95)" });
c.prop(4.9, "cupcake", { puff: 0.9, rise: 0.25 }, 0.25);
A(5.0, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.15, blink: false });   // "see?"
A(5.0, "wiz", "expr", { expr: "kind", set: { curve: 0.65, eye: 0.85 }, dur: 0.25 });
A(5.0, "wiz", "face", { brow: 0.15, lid: 0.3, dur: 0.25 });
A(5.05, "dra", "expr", { expr: "happy", set: { curve: 0.6, open: 0.15, eye: 1.0 }, dur: 0.25 });
A(5.05, "dra", "face", { brow: 0.1, lid: 0.05, dur: 0.25 });
A(5.05, "dra", "lean", { to: 5, dur: 0.5 });                       // he sits back, relieved (and out of the dome's way)
A(5.05, "dra", "squash", { amount: 0.04, dur: 0.45 });                // his shoulders let go
// dome off, back to its place
act.eyesLead(c, 5.3, "wiz", [0.42, -0.3]);
c.arm(5.35, "wiz", "L", { prop: "dome", grip: "knob", at: OFF_PLATE }, 0.22, "inOut");
c.prop(5.5, "cupcake", { rise: 1 }, 0.8, "out");
c.prop(5.8, "cupcake", { puff: 0 }, 0.5, "in");
c.arm(5.57, "wiz", "L", { prop: "dome", grip: "knob", at: [WAY[0], OFF_PLATE[1], WAY[2]] }, 0.2, "inOut");
A(5.57, "wiz", "lean", { to: 0, dur: 0.4 });
A(5.57, "wiz", "look", { to: WIZ_AT_DOME, dur: 0.2, blink: false });
c.arm(5.77, "wiz", "L", { prop: "dome", grip: "knob", at: DOME0 }, 0.22, "inOut");       // on the table at 5.99
sfx(5.99, "put-down-glass", { gain: 0.25, reason: "the dome set back down on the wooden table" });
A(6.07, "wiz", "release", { prop: "dome", dur: 0 });
A(5.99, "wiz", "grip", { side: "L", shape: "open", dur: 0.12 });
c.arm(6.09, "wiz", "L", { world: [-0.06, 0.52, 0.8] }, 0.2, "out");   // the hand leaves the knob to the right and in front, away from his face...
c.arm(6.29, "wiz", "L", { world: [-0.12, 0.4, 0.55] }, 0.2, "inOut"); // ...down past the dome's side...
c.arm(6.49, "wiz", "L", PAW(-0.16, 0.4), 0.25, "inOut");                // ...to rest between the dome and the plate
A(6.29, "wiz", "grip", { side: "L", shape: "paw", dur: 0.35 });
act.eyesLead(c, 6.15, "wiz", WIZ_AT_DRA, { dur: 0.2 });
A(6.25, "wiz", "expr", { expr: "kind", set: { curve: 0.85, eye: 0.9 }, dur: 0.25 });   // pleased with himself
A(6.25, "wiz", "face", { lid: 0.25, brow: 0.15, dur: 0.25 });

// ---------------------------------------------------------------- 04 RELIEF (6.10-7.05): eyes shut, a big sigh
A(6.1, "dra", "expr", { expr: "serene", set: { curve: 0.45 }, dur: 0.3 });
A(6.1, "dra", "face", { lid: 0.9, brow: 0.15, dur: 0.3 });
A(6.1, "dra", "look", { to: [-0.3, -0.25], dur: 0.25, blink: false });
A(6.45, "dra", "expr", { expr: "serene", set: { curve: 0.1, pucker: 0.9, open: 0.22 }, dur: 0.15 });
A(6.45, "dra", "squash", { amount: 0.1, dur: 0.5 });
A(6.4, "dra", "lean", { to: -2, dur: 0.5, ease: "inOut" });   // he lets it all out toward the table
sfx(6.45, "ai-package/flat-exhale", { gain: 0.35, reason: "Dragon's big relieved sigh (6.45-7.05)" });
c.prop(6.45, "breath", { on: 1, fire: 0.25, len: 1 }, 0.45, "inOut");   // a glowing sigh you can see, at the wick by 6.9

// ---------------------------------------------------------------- 05 FWOOMP (7.05-9.60)
c.prop(7.05, "cupcake", { lit: 1, fire: 1, bend: -0.25 }, 0.06, "out");   // straight back into a full flare
sfx(6.95, "ai/flare", { gain: 1.4, reason: "the sigh relights it into a tall flare (7.05): fwoomp" });
sfx(6.88, "ai/ignite", { gain: 0.6, reason: "the wick catching under the fwoomp (7.05): fwip" });
c.at(7.05, { fx: "flash", peak: 0.5, dur: 0.25 });
c.at(7.05, { fx: "shake", amp: 0.05, dur: 0.4 });
EMBERS(7.05, 30, 0.9, 2);
stopBlow(7.1, 0.25);
c.prop(7.4, "cupcake", { bend: 0.1 }, 0.3);
c.prop(7.7, "cupcake", { fire: 0.7 }, 0.4, "inOut");                // and it stays big to the end: the last frame is the joke
for (let i = 0; i < 4; i++) c.prop(r3(7.9 + i * 0.4), "cupcake", { bend: i % 2 ? 0.1 : -0.1 }, 0.4, "inOut");
A(7.08, "dra", "expr", { expr: "serene", set: { curve: 0.4, pucker: 0, open: 0 }, dur: 0.2 });   // he hasn't noticed
// the Wizard sees it: a jolt, then the dry look
A(7.12, "wiz", "look", { to: WIZ_AT_FLARE, dur: 0.1, blink: false });
A(7.12, "wiz", "expr", { expr: "deadpan", set: { curve: -0.1, eye: 1.05 }, dur: 0.15 });
A(7.12, "wiz", "face", { lid: 0, brow: 0.2, dur: 0.15 });
A(7.12, "wiz", "squash", { amount: 0.03, dur: 0.2 });
A(7.6, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.45, blink: false });  // only the eyes slide over, slowly
A(7.85, "wiz", "expr", { expr: "deadpan", set: { curve: -0.12, eye: 0.62 }, dur: 0.3 });
A(7.85, "wiz", "face", { lid: 0.42, brow: -0.15, dur: 0.3 });          // dry, half-lidded
A(7.85, "wiz", "still", { dur: 1.75, idle: 0.04, sink: 0.01 });
sfx(7.95, "plunk", { gain: 0.25, reason: "one dry musical note as the Wizard's look lands: dum" });
A(7.68, "dra", "face", { lid: 0, brow: 0.2, dur: 0.15 });               // Dragon opens his eyes...
A(7.68, "dra", "expr", { expr: "kind", set: { curve: 0.3, eye: 1.05 }, dur: 0.2 });
A(7.85, "dra", "look", { to: DRA_AT_CAKE, dur: 0.1, blink: false });  // ...the flame...
A(8.0, "dra", "expr", { expr: "nervous", set: { open: 0.1, eye: 1.2, curve: -0.1 }, dur: 0.15 });
A(8.0, "dra", "face", { brow: 0.45, dur: 0.15 });
A(8.3, "dra", "look", { to: DRA_AT_WIZ, dur: 0.15, blink: false });  // ...the Wizard...
A(8.55, "dra", "expr", { expr: "nervous", set: { open: 0, curve: 0.4, eye: 1.0, tilt: 0.3 }, dur: 0.3 });   // ...a guilty smile
A(8.55, "dra", "face", { brow: 0.3, dur: 0.3 });
A(8.6, "dra", "squash", { amount: 0.03, dur: 0.3 });                  // a tiny shrug
A(7.8, "dra", "still", { dur: 1.15, idle: 0.1 });
A(9.0, "dra", "look", { to: DRA_AT_FLARE, dur: 0.12, blink: false });   // a guilty glance at it...
A(9.3, "dra", "look", { to: DRA_AT_WIZ, dur: 0.12, blink: false });     // ...and back

// ---------------------------------------------------------------- shots
// one camera for the birthday and both flares (pushing in), a higher one from the right for the dome (so the lifted dome
// stays below both faces), then a tight two-shot for the sigh and the payoff, pushing in
const OPEN = [-0.03, 0.7, 0.4];   // looks a little high, so the hook caption has the wall above the heads
const S1 = frame(OPEN, { az: -5, el: 7, h: 2.35, fov: 28, push: 0.1, dur: 3.4 });
const S3 = frame([0.0, 0.68, 0.48], { az: 7, el: 26, h: 2.55, fov: 28 });
const INSERT = frame([PLATE[0], 0.41, PLATE[2]], { az: 7, el: 22, h: 0.78, fov: 28 });   // the dome lands, the flame dies, the smoke
const S5 = frame([-0.05, 0.64, 0.45], { az: -3, el: 16, h: 2.4, fov: 28 });
const S4 = frame([-0.03, 0.62, 0.42], { az: -5, el: 7, h: 2.25, fov: 28, push: 0.1, dur: 3.5 });
const beats = c.beats([
  ["01 happy birthday", 0, S1, "hook"],
  ["02 be careful", 2.05, "keep", "escalation"],
  ["03 solved", 3.4, S3],
  ["03b dome", 3.95, INSERT],
  ["03c see?", 4.95, S5],
  ["03d dome off", 5.35, INSERT],
  ["04 relief", 6.0, S4],
  ["05 fwoomp", 7.05, "keep", "payoff"],                // the joke: the sigh relights it, bigger than ever
], END);

write(import.meta.url, {
  id: "dragon-vs-the-candle",
  title: "Dragon vs. the Candle",
  cover: 1.3,                                    // the first eruption, both faces shocked
  idea: "Story library 14 v2: told to blow out his birthday candle, Dragon spits fire; even his relieved sigh relights it",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#f3ead8", floor: "#d8bf98", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/dining-blue-window.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  // a light drumless pizzicato walk that the fire cuts off, back for the dome, cut again by the payoff's fwoomp
  music: { style: "sneaky", drums: false, gain: 0.3, seed: 14, parts: [{ at: 0, part: "main" }, { at: 0.95, part: "stop" }, { at: 3.85, part: "main" }, { at: 7.05, part: "stop" }] },
  sound: { sfx: 0.7, ambience: 0.18, speech: false, signature: false },
  experiment: { id: "hook-2026-11", episode: "dragon-vs-the-candle", variant: "A" },
  // frame 0: both faces, the lit cupcake and the birthday line; the fire comes at 0.95
  hook: { show: ["wiz", "dra", "cupcake"], hint: 0.95, what: "told to blow out his candle, Dragon spits fire at it" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "dra", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop" },
    { who: "wiz", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop" },
  ],
  notes: "Generated by storyboards/candle/make-dragon-vs-the-candle.mjs (Jonny's story library 14, v2 after his notes of 29 Oct).",
});
