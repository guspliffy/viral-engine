// DRAGON VS. THE CANDLE (Jonny's story library #14, 29 Oct 2026), built from the clip template.
// node storyboards/candle/make-dragon-vs-the-candle.mjs -> storyboards/candle/dragon-vs-the-candle.json
//
// THE BRIEF (story library 14, ENGINE-PROMPT.md: 14.00 s, 420 frames, six beats, wordless, no text, no loop claim)
//   Joke:        Dragon is trying to blow out a birthday candle, but his breath is fire: every try makes it flare.
//   Wants:       Dragon wants the candle out; the Wizard wants the problem solved.
//   Consequence: the Wizard snuffs it calmly with a glass cake dome; Dragon's relieved sigh relights it.
//   Ending:      the Wizard's dry, half-lidded sideways look meets Dragon's small guilty smile, held.
//
//   01 0.00-2.20  the attempt + wrong result: Dragon already blowing, a tiny orange breath; the flame flares tall (1.2)
//   03 2.20-4.40  be more careful: a gentle puff, it flares again; the Wizard's free palm stops him, then he reaches
//   04 4.40-8.80  solved: the Wizard lifts the dome by its knob, lowers it over the cupcake, the flame dies; dome back
//   05 8.80-11.6  accidental reversal: Dragon relaxes and sighs; the tiny sigh relights the wick (10.4-10.6)
//   06 11.6-14.0  that friend: the Wizard's eyes slide to Dragon, half-lidded; Dragon notices, a small guilty smile
//
// Hands: the Wizard's own LEFT (nearest the candle and Dragon) raises the stop palm and then carries the dome; his own
// RIGHT rests on the table all clip (one hand does both jobs, so his arms never cross in front of him: the storyboard
// panel draws both at once). Dragon's paws rest on the table except for the jolt at the first flare.
// State: plate, cupcake and candle never move; the dome rests open side down left of the plate, is carried by its
// knob, sits on the plate's flat middle 5.8-7.15 and goes back to exactly where it was (8.45), still open side down.
// The flame: lit -> flare (0.7-2.3) -> lit -> flare (3.05-3.9) -> lit -> out under the dome (6.0-6.6) -> relit (10.4).
import { clip, write, r3, frame } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { CANDLE } from "../../engine/page/props-candle.js";

const c = clip(), { A, sfx } = c;
const END = 14.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const WIZ = [-0.5, 0.0], DRA = [0.53, -0.04];                     // a gap between the bodies in every shot (review A)
const TABLE_H = 0.27, TABLE_Z = 0.8, TABLE_D = 0.9;
const S = 1.6;                                                     // the props' scale (cupcake, plate and dome share it)
const PLATE = [0.17, TABLE_H, 0.66], PLATE_TOP = r3(TABLE_H + CANDLE.plate.top * S);
const CAKE = [PLATE[0], PLATE_TOP, PLATE[2]];
const WICK = [CAKE[0], r3(PLATE_TOP + CANDLE.wickTop * S), CAKE[2]];
const DOME0 = [-0.2, TABLE_H, 0.74];                               // left of the plate, in front of the Wizard
const FLAME_TIP = WICK[1] + 0.06;                                   // the flame's tip at rest (world)
const LIFT = r3(FLAME_TIP + 0.025);                                 // the rim's height while the dome passes over the flame
const ON_PLATE = [PLATE[0], PLATE_TOP, PLATE[2]], UP_PLATE = [PLATE[0], LIFT, PLATE[2]];
// the way over: up and toward the plate at once, so the dome rises beside the Wizard's face, never in front of it; the
// rim is already above the frosting when it reaches the cupcake and above the flame's tip when it passes the wick
const WAY = [r3(PLATE[0] - 0.21), r3(LIFT - 0.015), r3((PLATE[2] + DOME0[2]) / 2)];

// eye targets (face look space: + right on screen, + up)
const WIZ_AT_CAKE = [0.5, -0.45], WIZ_AT_FLARE = [0.45, 0.15], WIZ_AT_DOME = [0.18, -0.7], WIZ_AT_DRA = [0.8, 0.0];
const DRA_AT_CAKE = [-0.5, -0.3], DRA_AT_FLARE = [-0.45, 0.2], DRA_AT_WIZ = [-0.8, -0.02], DRA_AT_DOME = [-0.6, -0.25];

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

// ---------------------------------------------------------------- frame 0: everything in place, Dragon mid-blow
A(0, "wiz", "arm", { side: "R", pose: PAW(-0.74, 0.48), dur: 0 });
A(0, "wiz", "grip", { side: "R", shape: "paw", dur: 0 });
A(0, "wiz", "arm", { side: "L", pose: PAW(-0.47, 0.44), dur: 0 });
A(0, "wiz", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "wiz", "look", { to: WIZ_AT_CAKE, dur: 0.01, blink: false });
A(0, "wiz", "expr", { expr: "eager", set: { curve: 0.85, open: 0.12 }, dur: 0.01 });   // hopeful
A(0, "dra", "arm", { side: "R", pose: PAW(0.46, 0.44), dur: 0 });
A(0, "dra", "grip", { side: "R", shape: "paw", dur: 0 });
A(0, "dra", "arm", { side: "L", pose: PAW(0.78, 0.44), dur: 0 });
A(0, "dra", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.01, blink: false });
A(0, "dra", "lean", { to: -6, dur: 0.01 });
act.blinksAt(c, "wiz", [2.5, 5.3, 7.4]);
act.blinksAt(c, "dra", [2.35, 4.25, 8.2]);

// blowing: lips pursed, brows in, a tiny squint (focused); the breath grows out of the mouth to the wick
const blow = (t, { len = 0.3, on = 1, strength = 1 } = {}) => {
  A(t, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.3 * strength, curve: 0 }, dur: 0.15 });
  c.prop(t, "breath", { on, len: 1 }, len, "out");
};
const stopBlow = (t, dur = 0.15) => c.prop(t, "breath", { on: 0, len: 0 }, dur);

// ---------------------------------------------------------------- 01 THE ATTEMPT 0.00-0.70 + 02 WRONG RESULT 0.70-2.20
// frame 0: already blowing, the breath a third of the way out
A(0, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.3, curve: 0 }, dur: 0.01 });
c.prop(0, "breath", { on: 1, len: 0.3 }, 0.01);
c.prop(0.01, "breath", { len: 1 }, 0.38, "out");                    // it reaches the wick by 0.4
sfx(0, "blow", { dur: 0.85, gain: 0.35, reason: "Dragon's soft blow toward the candle (0.0-0.85): fff" });
c.prop(0.2, "cupcake", { bend: -0.5 }, 0.3);                        // the flame bends away from his breath...
c.prop(0.7, "cupcake", { fire: 1, bend: -0.15 }, 0.45, "settle");   // ...and stretches into one tall narrow flare (read by 1.2)
sfx(0.64, "ai/flare", { gain: 1.4, reason: "the candle flame flares up tall (0.7-1.15): fwoomp, loudest 0.1 s in" });
stopBlow(0.85, 0.2);
// Dragon's eyes widen after the flare begins: he jolts back, paws up off the table
A(1.0, "dra", "look", { to: DRA_AT_FLARE, dur: 0.12, blink: false });
A(1.02, "dra", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.22, pucker: 0 }, dur: 0.15 });
A(1.02, "dra", "face", { brow: 0.45, dur: 0.15 });
A(1.02, "dra", "lean", { to: 3, dur: 0.25, ease: "out" });
A(1.02, "dra", "squash", { amount: 0.05, dur: 0.22 });
A(1.02, "dra", "pitch", { to: -4, dur: 0.22, ease: "out" });           // a jolt back; his paws stay on the table
A(1.25, "dra", "still", { dur: 0.75, idle: 0.08 });
// the Wizard's hopeful face turns concerned as he looks up the flare
A(1.1, "wiz", "look", { to: WIZ_AT_FLARE, dur: 0.15, blink: false });
A(1.18, "wiz", "expr", { expr: "sad", set: { curve: -0.15, open: 0.14, pucker: 0.6, eye: 1.1 }, dur: 0.28 });
A(1.18, "wiz", "face", { brow: 0.35, dur: 0.28 });
A(1.25, "wiz", "still", { dur: 0.9, idle: 0.08 });
c.prop(1.85, "cupcake", { fire: 0, bend: 0 }, 0.5, "inOut");       // the flame settles as he lowers his paws

// ---------------------------------------------------------------- 03 BE MORE CAREFUL 2.20-4.40
A(2.05, "dra", "pitch", { to: 0, dur: 0.4 });
A(2.05, "dra", "lean", { to: -3, dur: 0.5 });
A(2.1, "dra", "look", { to: DRA_AT_CAKE, dur: 0.2, blink: false });
A(2.15, "dra", "expr", { expr: "focused", set: { curve: 0.05 }, dur: 0.3 });   // a pause: OK. carefully this time.
A(2.15, "dra", "face", { brow: -0.1, lid: 0.15, dur: 0.3 });
A(2.6, "dra", "lean", { to: -7, dur: 0.35, ease: "inOut" });
A(2.7, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.16, curve: 0, eye: 0.85 }, dur: 0.18 });   // lips pursed tight: exaggeratedly gentle
c.prop(2.88, "breath", { on: 0.5, len: 1 }, 0.4, "out");             // a thinner, slower breath
sfx(2.88, "blow", { dur: 0.55, gain: 0.2, reason: "Dragon's second, gentler blow (2.9-3.4): a smaller fff" });
c.prop(3.05, "cupcake", { bend: -0.35 }, 0.2);
c.prop(3.15, "cupcake", { fire: 1, bend: -0.1 }, 0.3, "settle");    // it flares again, as tall as the first (review A)
sfx(3.07, "ai/flare", { gain: 0.6, reason: "the second, smaller flare (3.15-3.5): a smaller fwoomp" });
// the Wizard's free palm comes up: stop
// (after the flare has had its moment: a reaction to it, not at the same instant, review A)
A(3.4, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.15, blink: false });
c.arm(3.4, "wiz", "L", { world: [-0.07, 0.6, 0.55] }, 0.22, "out");  // the hand up between the two faces: stop
A(3.4, "wiz", "grip", { side: "L", shape: "point", dur: 0.18 });    // one finger up: "wait"
act.mood(c, 3.45, "wiz", "stern", { hold: 0.45 });
stopBlow(3.42, 0.15);
A(3.55, "dra", "expr", { expr: "nervous", set: { pucker: 0, open: 0.05, curve: -0.05, eye: 1.08 }, dur: 0.2 });
A(3.55, "dra", "face", { brow: 0.3, lid: 0, dur: 0.2 });
A(3.55, "dra", "lean", { to: -2, dur: 0.35 });
A(3.5, "dra", "look", { to: DRA_AT_WIZ, dur: 0.18, blink: false });  // he stops and looks at the Wizard
A(3.6, "dra", "still", { dur: 0.7, idle: 0.08 });
c.prop(3.55, "cupcake", { fire: 0, bend: 0 }, 0.45, "inOut");
// ...then the Wizard's eyes go to the dome, and the same hand goes for its knob
const KNOB_ABOVE = { prop: "dome", grip: [0.05, CANDLE.knobY + 0.03, 0.01] };   // above and to the right of the knob, below his eyes
act.eyesLead(c, 3.95, "wiz", WIZ_AT_DOME);
A(3.95, "wiz", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.9 }, dur: 0.3 });   // calm: he knows what to do
A(3.95, "wiz", "face", { brow: 0, lid: 0.15, dur: 0.3 });
c.arm(3.95, "wiz", "L", { world: [-0.08, 0.5, 0.62] }, 0.2, "inOut"); // down out of the way of his face...
c.arm(4.15, "wiz", "L", KNOB_ABOVE, 0.2, "inOut");                   // ...over the knob by 4.35...
A(4.0, "wiz", "grip", { side: "L", shape: "open", dur: 0.25 });

// ---------------------------------------------------------------- 04 SOLVED 4.40-8.80 (one continuous medium shot)
c.arm(4.35, "wiz", "L", { prop: "dome", grip: "knob" }, 0.25, "out"); // ...down onto it by 4.6
A(4.45, "wiz", "grip", { side: "L", shape: "clasp", dur: 0.15 });
A(4.62, "wiz", "grab", { prop: "dome", hand: "L", grip: "knob", pose: null });
sfx(4.62, "grab", { gain: 0.18 });
A(4.4, "wiz", "still", { dur: 0.2, idle: 0.1 });
c.arm(4.7, "wiz", "L", { prop: "dome", grip: "knob", at: WAY }, 0.45, "inOut");         // up and toward the plate: clear of the table by 4.8
act.eyesLead(c, 4.7, "wiz", WIZ_AT_CAKE, { dur: 0.3 });
c.arm(5.15, "wiz", "L", { prop: "dome", grip: "knob", at: UP_PLATE }, 0.4, "inOut");    // across, over the cupcake
A(5.1, "wiz", "lean", { to: 4, dur: 0.5 });
act.eyesLead(c, 5.55, "wiz", [0.48, -0.55]);
c.arm(5.55, "wiz", "L", { prop: "dome", grip: "knob", at: ON_PLATE }, 0.27, "out");      // down: the rim meets the plate at 5.82
sfx(5.82, "put-down-glass", { gain: 0.3, reason: "the dome's glass rim settles on the china plate" });
c.prop(5.82, "dome", { squash: 0.02 }, 0.06); c.prop(5.88, "dome", { squash: 0 }, 0.12, "settle");
A(5.82, "wiz", "still", { dur: 1.3, idle: 0.06 });
A(4.75, "dra", "look", { to: [-0.55, 0.05], dur: 0.25, blink: false });   // he watches the dome go up...
A(4.8, "dra", "expr", { expr: "kind", set: { curve: 0.15, eye: 1.08 }, dur: 0.3 });
A(4.8, "dra", "face", { brow: 0.2, lid: 0, dur: 0.3 });
A(5.6, "dra", "look", { to: DRA_AT_CAKE, dur: 0.2, blink: false });   // ...and come down
// under the glass the flame shrinks to the wick (it never goes before the rim is down), a thin wisp curls off it
c.prop(6.0, "cupcake", { lit: 0 }, 0.6, "in");
sfx(6.2, "ai/snuff", { gain: 0.95, reason: "the flame goes out under the dome: a soft tss that swells to its peak as the flame dies (6.6)" });
c.prop(6.48, "cupcake", { puff: 0.85, rise: 0.22 }, 0.3);
A(6.7, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.18, blink: false });  // "see?" (review A)
A(6.75, "wiz", "expr", { expr: "smug", set: { curve: 0.6, eye: 0.8 }, dur: 0.3 });   // job done
A(6.75, "wiz", "face", { brow: 0.1, lid: 0.12, dur: 0.3 });
// Dragon watches the wick go out, then his shoulders let go
A(6.8, "dra", "expr", { expr: "happy", set: { curve: 0.55, open: 0.12, eye: 1.0 }, dur: 0.3 });
A(6.8, "dra", "face", { brow: 0.1, lid: 0.08, dur: 0.3 });
A(6.85, "dra", "lean", { to: 0, dur: 0.6 });
A(6.85, "dra", "squash", { amount: 0.04, dur: 0.5 });              // his shoulders let go
A(6.85, "dra", "still", { dur: 1.6, idle: 0.12, sink: 0.012 });
// the dome lifts clear, goes back to its own place and down
act.eyesLead(c, 7.15, "wiz", [0.42, -0.3]);
c.arm(7.15, "wiz", "L", { prop: "dome", grip: "knob", at: UP_PLATE }, 0.5, "inOut");     // clear by 7.65
c.prop(7.5, "cupcake", { rise: 1 }, 0.9, "out");                    // free of the glass, the wisp rises and thins away
c.prop(8.0, "cupcake", { puff: 0 }, 0.8, "in");
c.arm(7.65, "wiz", "L", { prop: "dome", grip: "knob", at: WAY }, 0.3, "inOut");
A(7.65, "wiz", "lean", { to: 0, dur: 0.5 });
A(7.65, "wiz", "look", { to: WIZ_AT_DOME, dur: 0.25, blink: false });
c.arm(7.95, "wiz", "L", { prop: "dome", grip: "knob", at: DOME0 }, 0.5, "inOut");       // down on the table at 8.45
sfx(8.45, "put-down-glass", { gain: 0.35, reason: "the dome set back down on the wooden table" });
A(8.58, "wiz", "release", { prop: "dome", dur: 0 });
A(8.5, "wiz", "grip", { side: "L", shape: "open", dur: 0.15 });
c.arm(8.6, "wiz", "L", { world: [-0.02, 0.62, 0.7] }, 0.22, "out");  // the hand leaves the knob to the right, away from his face...
c.arm(8.82, "wiz", "L", { world: [-0.08, 0.42, 0.45] }, 0.23, "inOut"); // ...down past the dome's side...
c.arm(9.05, "wiz", "L", PAW(-0.1, 0.4), 0.3, "inOut");                // ...to rest between the dome and the plate, behind both
A(8.85, "wiz", "grip", { side: "L", shape: "paw", dur: 0.4 });

// ---------------------------------------------------------------- 05 ACCIDENTAL REVERSAL 8.80-11.60
// the Wizard, satisfied: a glance at Dragon, a pleased little smile
act.eyesLead(c, 8.6, "wiz", WIZ_AT_DRA, { dur: 0.25 });
A(8.9, "wiz", "expr", { expr: "kind", set: { curve: 0.85, eye: 0.9 }, dur: 0.3 });
A(8.9, "wiz", "face", { lid: 0.25, brow: 0.15, dur: 0.3 });
A(9.2, "wiz", "still", { dur: 1.2, idle: 0.1 });
// Dragon relaxes: eyes close, content (9.0), then the relieved sigh through pursed lips (9.7)
A(9.0, "dra", "expr", { expr: "serene", set: { curve: 0.4 }, dur: 0.35 });
A(9.0, "dra", "face", { lid: 0.9, brow: 0.15, dur: 0.35 });
A(9.0, "dra", "look", { to: [-0.3, -0.25], dur: 0.3, blink: false });
A(9.6, "dra", "expr", { expr: "serene", set: { curve: 0.1, pucker: 0.8, open: 0.18 }, dur: 0.2 });
A(9.65, "dra", "squash", { amount: 0.05, dur: 0.6 });
A(9.65, "dra", "still", { dur: 1.9, idle: 0.1, sink: 0.015 });
sfx(9.68, "ai-package/flat-exhale", { gain: 0.35, reason: "Dragon's relieved sigh (9.7-10.4)" });
c.prop(9.7, "breath", { on: 0.75, len: 1 }, 0.6, "inOut");             // a warm sigh you can see drifts to the wick by 10.4
c.prop(10.4, "breath", { on: 0, len: 1 }, 0.35, "in");
c.prop(10.4, "cupcake", { lit: 1, fire: 0.5 }, 0.12, "out");        // it catches with a little pop (half the first flare)...
c.prop(10.52, "cupcake", { fire: 0 }, 0.38, "inOut");                // ...and settles to a normal flame by 10.9
sfx(10.22, "ai/ignite", { gain: 0.95, reason: "the wick catches again (10.4): a tiny fwip, loudest 0.19 s in" });
A(10.45, "dra", "expr", { expr: "serene", set: { curve: 0.45, pucker: 0, open: 0 }, dur: 0.3 });
// the Wizard sees it before Dragon does
A(10.55, "wiz", "look", { to: WIZ_AT_CAKE, dur: 0.12, blink: false });
A(10.62, "wiz", "expr", { expr: "deadpan", set: { curve: -0.05, eye: 0.85 }, dur: 0.25 });
A(10.62, "wiz", "face", { lid: 0.1, brow: 0, dur: 0.25 });
A(10.62, "wiz", "still", { dur: 1.0, idle: 0.04 });

// ---------------------------------------------------------------- 06 THAT FRIEND 11.60-14.00
A(11.7, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.55, blink: false });   // only the eyes slide over, slowly
A(12.05, "wiz", "expr", { expr: "deadpan", set: { curve: -0.12, eye: 0.62 }, dur: 0.35 });
A(12.05, "wiz", "face", { lid: 0.42, brow: -0.15, dur: 0.35 });        // a dry, half-lidded look
A(12.05, "wiz", "still", { dur: 1.95, idle: 0.04, sink: 0.01 });
sfx(12.15, "plunk", { gain: 0.12, reason: "one quiet dry musical note as the Wizard's look lands: dum" });
A(11.85, "dra", "face", { lid: 0, brow: 0.2, dur: 0.2 });               // Dragon opens his eyes...
A(11.85, "dra", "expr", { expr: "kind", set: { curve: 0.3, eye: 1.05 }, dur: 0.25 });
A(12.0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.15, blink: false });  // ...sees the flame...
A(12.2, "dra", "expr", { expr: "nervous", set: { open: 0.08, eye: 1.18, curve: -0.05 }, dur: 0.18 });
A(12.2, "dra", "face", { brow: 0.4, dur: 0.18 });
A(12.55, "dra", "look", { to: DRA_AT_WIZ, dur: 0.18, blink: false });  // ...then the Wizard's face
A(12.8, "dra", "expr", { expr: "nervous", set: { open: 0, curve: 0.35, eye: 1.0, tilt: 0.3 }, dur: 0.35 });   // a small guilty smile
A(12.8, "dra", "face", { brow: 0.3, dur: 0.3 });
A(12.85, "dra", "squash", { amount: 0.03, dur: 0.3 });                  // a tiny shrug
A(12.0, "dra", "still", { dur: 1.95, idle: 0.1 });

// ---------------------------------------------------------------- shots (the brief's four camera segments)
// 01-02 and 03 share one camera (03 pushes in a little), 05-06 is the same tight two-shot again, pushing in slowly;
// 04 is a different angle (a little higher, from the Wizard's side) so the dome's path reads and the cut never looks
// like a dropped frame
const TIGHT = [-0.03, 0.6, 0.4];
const S1 = frame(TIGHT, { az: -5, el: 7, h: 2.35, fov: 28 });
const S2 = frame(TIGHT, { az: -5, el: 7, h: 2.35, fov: 28, push: 0.07, dur: 2.2 });
const S3 = frame([0.0, 0.6, 0.48], { az: 7, el: 30, h: 2.4, fov: 28 });   // from a little right and above: the lifted dome stays below both faces (review A)
const S4 = frame([-0.03, 0.6, 0.42], { az: -5, el: 7, h: 2.25, fov: 28, push: 0.08, dur: 5.2 });   // a little closer for the ending (review A)
const beats = c.beats([
  ["01 the attempt", 0, S1, "hook"],
  ["03 be more careful", 2.2, S2, "escalation"],
  ["04 solved", 4.4, S3],
  ["05 accidental reversal", 8.8, S4],
  ["05 relit", 10.4, "keep", "payoff"],                // the joke: the sigh relights the candle
  ["06 that friend", 11.6, "keep"],
], END);

write(import.meta.url, {
  id: "dragon-vs-the-candle",
  title: "Dragon vs. the Candle",
  idea: "Story library 14: Dragon's breath keeps strengthening a birthday flame; even his relieved sigh relights it",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [12, 16], loop: false },
  set: { type: "plain", color: "#f3ead8", floor: "#d8bf98", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/dining-blue-window.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  // a light drumless pizzicato walk that each flare cuts off (the brief's "restrained musical interruption"), back for the careful solve,
  // cut again by the relight; then one dry "dum" and room tone
  music: { style: "sneaky", drums: false, gain: 0.3, seed: 14, parts: [{ at: 0, part: "main" }, { at: 0.66, part: "stop" }, { at: 1.84, part: "main" }, { at: 3.1, part: "stop" }, { at: 5.36, part: "main" }, { at: 10.4, part: "stop" }] },
  sound: { sfx: 0.7, ambience: 0.18, speech: false, signature: false },
  experiment: { id: "hook-2026-11", episode: "dragon-vs-the-candle", variant: "A" },
  // frame 0 shows both faces and the lit candle, the breath already on its way; the flare (trouble) is up by 1.2 s
  hook: { show: ["wiz", "dra", "cupcake"], hint: 0.9, what: "Dragon's breath makes the candle flare instead of going out" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "dra", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop" },
    { who: "wiz", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop" },
  ],
  notes: "Generated by storyboards/candle/make-dragon-vs-the-candle.mjs (Jonny's story library 14).",
});
