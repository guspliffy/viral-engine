// LIGHT MY CANDLE: the camera test for the new directed shots (insert, low angle), built from the clip template.
// node storyboards/shots/make-light-my-candle.mjs -> storyboards/shots/light-my-candle.json
//
// THE BRIEF (engine test, scenario-lessons-01 task 3: "Dragon trying to light a candle: insert on the wick, low angle on
// Dragon"; 10 s, caption + music from 0:00, frame 0 already action, no extra cuts in 0-3 s)
//   Joke:        the Wizard asks Dragon to light his birthday candle; a careful puff does nothing, so Dragon gives it
//                everything.
//   Wants:       the Wizard wants one small candle flame; Dragon wants to get it right.
//   Consequence: FWOOMP: the cupcake erupts into a fireball and the Wizard's hat smokes.
//   Ending:      the candle burns perfectly; Dragon beams, the Wizard, singed, says a flat "...thanks."
//
//   01 0.00-2.00  hook (medium, one take pushing in 8 % to 3.4 s): Dragon already blowing a careful "fff" at the wick, the Wizard pointing at it: nothing
//   02 2.00-3.40  harder: a bigger puff, a few sparks, a wisp of smoke; the Wizard leans in to look
//   03 3.40-4.00  INSERT on the wick: the smoke curls up, one spark dies
//   04 4.00-5.60  THREAT (low angle on Dragon): he rears back and swells up, eyes squeezed, all his power
//   05 5.60-7.40  payoff (snap-in): the fire jet, the candle erupts, flash, shake, embers; the Wizard's hat smokes
//   06 7.40-8.80  reaction (close-up, the Wizard): dry, half-lidded, smoke curling off the hat
//   07 8.80-10.0  resolved (medium): the candle burns just right; Dragon beams; "...thanks."
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { CANDLE } from "../../engine/page/props-candle.js";

const c = clip(), { A, sfx } = c;
const END = 10.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const WIZ = [-0.62, 0.0], DRA = [0.62, -0.04];
const SEAT = 0.42, S = 1.6;                                        // the stool's seat height; the cake props' scale
const STOOL = [0.0, 0.34];
const PLATE = [STOOL[0], SEAT, STOOL[1]], PLATE_TOP = r3(SEAT + CANDLE.plate.top * S);
const CAKE = [PLATE[0], PLATE_TOP, PLATE[2]];
const WICK_AT = [0, r3(CANDLE.wickTop), 0];                         // the wick tip in the cupcake's own frame (before its scale)
const WICK = [CAKE[0], r3(PLATE_TOP + CANDLE.wickTop * S), CAKE[2]];
const SPARKS = (t, n = 6, dur = 0.6) => c.at(t, { fx: "poof", pos: [WICK[0], r3(WICK[1] - 0.5), WICK[2]], puffs: 0, color: "#ffd9a8", sparks: n, spark: "#ffb347", sparkSize: 0.4, speed: 0.4, dur });

// eye targets (face look space: + right on screen, + up)
const WIZ_AT_CAKE = [0.55, -0.5], WIZ_AT_DRA = [0.8, 0.0], WIZ_AT_FLARE = [0.5, 0.2];
const DRA_AT_CAKE = [-0.55, -0.45], DRA_AT_WIZ = [-0.8, -0.02], DRA_AT_FLARE = [-0.5, 0.2];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: 18, expr: "eager", follow: 0.2, seed: 2.6, signature: false },
  { id: "dra", character: "lookdev/dragon-crisp", at: DRA, face: -20, expr: "focused", follow: 0.25, seed: 4.1 },
];
const props = [
  { id: "stool", kind: "stool", x: STOOL[0], z: STOOL[1] },
  { id: "plate", kind: "dessertplate", x: PLATE[0], y: PLATE[1], z: PLATE[2], scale: S },
  { id: "cupcake", kind: "cupcake", x: CAKE[0], y: CAKE[1], z: CAKE[2], scale: S, lit: 0 },
  { id: "breath", kind: "breath", mouth: "dra", target: "cupcake", at: [0, CANDLE.wickTop + 0.008, 0] },
];
const stopBlow = (t, dur = 0.15) => c.prop(t, "breath", { on: 0, len: 0, fire: 0 }, dur);

// ---------------------------------------------------------------- 01 HOOK 0-2.0: already blowing, nothing happens
c.cap(0, 2.0, "When you ask a DRAGON to light your candle", 230);
A(0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.01, blink: false });
A(0, "dra", "expr", { expr: "focused", set: { pucker: 0.9, open: 0.15, eye: 0.9 }, dur: 0.01 });
A(0, "dra", "lean", { to: -6, dur: 0.01 });
c.prop(0, "breath", { on: 0.55, fire: 0, len: 1 }, 0.01);           // a careful little "fff" from frame 0
sfx(0.0, "blow", { dur: 0.8, gain: 0.3, reason: "Dragon's careful puff at the wick (0-0.8): fff" });
stopBlow(0.8);
A(0, "wiz", "look", { to: WIZ_AT_CAKE, dur: 0.01, blink: false });
A(0, "wiz", "expr", { expr: "eager", set: { curve: 0.7, open: 0.2 }, dur: 0.01 });
c.arm(0, "wiz", "L", { world: [-0.2, 0.66, 0.44] }, 0);       // his finger on the candle: that one
A(0, "wiz", "grip", { side: "L", shape: "point", dur: 0 });
act.blinksAt(c, "wiz", [1.5, 7.9]);
act.blinksAt(c, "dra", [1.3, 9.2]);
// nothing: Dragon frowns at the wick, the Wizard looks at him
A(0.9, "dra", "lean", { to: 0, dur: 0.3 });
A(0.9, "dra", "expr", { expr: "confused", set: { pucker: 0, eye: 1.05 }, dur: 0.2 });
A(0.9, "dra", "face", { brow: 0.2, dur: 0.2 });
A(1.1, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.12, blink: false });
A(1.2, "wiz", "expr", { expr: "kind", set: { curve: 0.4, eye: 1.0 }, dur: 0.2 });
A(1.25, "wiz", "squash", { amount: 0.04, dur: 0.15 });                  // a nod: go on
A(1.42, "wiz", "squash", { amount: 0, dur: 0.15 });
c.arm(1.5, "wiz", "L", "rest", 0.3, "inOut");
A(1.5, "wiz", "grip", { side: "L", shape: "open", dur: 0.25 });

// ---------------------------------------------------------------- 02 HARDER 2.0-3.4: a bigger puff, sparks, a wisp
A(2.0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.12, blink: false });
A(2.0, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.2, eye: 0.75 }, dur: 0.15 });
A(2.0, "dra", "face", { brow: -0.25, lid: 0.15, dur: 0.15 });
A(2.05, "dra", "lean", { to: -12, dur: 0.25, ease: "out" });
c.prop(2.1, "breath", { on: 0.9, fire: 0.12, len: 1 }, 0.15, "out");
sfx(2.1, "blow", { dur: 0.9, gain: 0.45, reason: "the harder puff (2.1-3.0): FFFF" });
SPARKS(2.5, 7, 0.6);
c.prop(2.6, "cupcake", { puff: 0.35, rise: 0.25 }, 0.3);               // a thin wisp off the wick
A(2.3, "wiz", "look", { to: WIZ_AT_CAKE, dur: 0.12, blink: false });
A(2.35, "wiz", "lean", { to: -6, dur: 0.4, ease: "inOut" });             // he leans in to see
A(2.4, "wiz", "expr", { expr: "eager", set: { curve: 0.3, eye: 1.1 }, dur: 0.2 });
stopBlow(3.0);
A(3.0, "dra", "lean", { to: -2, dur: 0.3 });

// ---------------------------------------------------------------- 03 INSERT 3.4-4.0: the wick smokes, one spark dies
c.prop(3.3, "cupcake", { puff: 0.6, rise: 0.8 }, 0.7, "out");
SPARKS(3.45, 3, 0.45);
sfx(3.45, "ai/snuff", { gain: 0.5, reason: "the wick fizzles: tss, as the smoke curls up in the insert" });

// ---------------------------------------------------------------- 04 THREAT 4.0-5.6: Dragon summons everything
A(4.0, "dra", "look", { to: DRA_AT_CAKE, dur: 0.1, blink: false });
A(4.0, "dra", "lean", { to: 9, dur: 1.0, ease: "inOut" });
A(4.0, "dra", "pitch", { to: 10, dur: 1.0, ease: "inOut" });
A(4.0, "dra", "squash", { amount: -0.14, dur: 1.0 });
A(4.05, "dra", "expr", { expr: "focused", set: { pucker: 0.8, open: 0.05, eye: 0.55 }, dur: 0.5 });
A(4.05, "dra", "face", { brow: -0.35, lid: 0.35, dur: 0.5 });
sfx(4.05, "gasp", { gain: 0.55, reason: "Dragon draws an enormous breath in (4.0-5.0)" });
c.prop(4.0, "cupcake", { puff: 0, rise: 1 }, 0.5);
A(4.2, "wiz", "lean", { to: 0, dur: 0.4 });
A(4.3, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.12, blink: false });
A(4.35, "wiz", "expr", { expr: "nervous", set: { eye: 1.15, curve: -0.1 }, dur: 0.2 });
A(4.35, "wiz", "face", { brow: 0.35, dur: 0.2 });
A(5.0, "dra", "still", { dur: 0.55, idle: 0.1 });

// ---------------------------------------------------------------- 05 PAYOFF 5.6-7.4: FWOOMP
A(5.6, "dra", "lean", { to: -14, dur: 0.14, ease: "out" });
A(5.6, "dra", "pitch", { to: -4, dur: 0.14, ease: "out" });
A(5.6, "dra", "squash", { amount: 0.08, dur: 0.2 });
A(5.6, "dra", "expr", { expr: "focused", set: { pucker: 1, open: 0.55, eye: 0.8 }, dur: 0.1 });
c.prop(5.65, "breath", { on: 1, fire: 1, len: 0.15 }, 0.03);
c.prop(5.68, "breath", { len: 1 }, 0.12, "out");
sfx(5.62, "whoosh", { gain: 0.7, reason: "the fire jet leaves his mouth (5.65)" });
c.prop(5.8, "cupcake", { lit: 1, fire: 1, bend: 0.15 }, 0.06, "out");
sfx(5.7, "ai/flare", { gain: 1.6, reason: "the candle erupts into a fireball (5.8): fwoomp, loudest 0.1 s in" });
c.at(5.8, { fx: "flash", peak: 0.4, dur: 0.25 });
c.at(5.8, { fx: "shake", amp: 0.06, dur: 0.45 });
SPARKS(5.8, 34, 0.9);
stopBlow(6.25, 0.15);
c.prop(6.1, "cupcake", { bend: 0 }, 0.3);
c.prop(6.6, "cupcake", { fire: 0 }, 0.7, "inOut");                  // the fireball sinks back to one neat flame
A(5.9, "wiz", "lean", { to: 8, dur: 0.2, ease: "out" });
A(5.9, "wiz", "look", { to: WIZ_AT_FLARE, dur: 0.1, blink: false });
A(5.9, "wiz", "expr", { expr: "shocked", set: { open: 0.5, eye: 1.25, curve: -0.2 }, dur: 0.12 });
A(5.9, "wiz", "face", { brow: 0.5, dur: 0.12 });
A(5.95, "dra", "look", { to: DRA_AT_FLARE, dur: 0.1, blink: false });
A(5.95, "dra", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.2, pucker: 0, curve: -0.1 }, dur: 0.12 });
A(5.95, "dra", "lean", { to: 2, dur: 0.3, ease: "out" });
A(5.95, "dra", "pitch", { to: 0, dur: 0.3 });
// the hat smokes: grey puffs off the brim
c.at(6.0, { fx: "poof", pos: [WIZ[0] + 0.05, 1.45, WIZ[1] + 0.05], puffs: 5, color: "#6d6660", sparks: 0, dur: 1.3 });

// ---------------------------------------------------------------- 06 REACTION 7.4-8.8: singed, dry
A(7.1, "wiz", "lean", { to: 0, dur: 0.4 });
A(7.4, "wiz", "look", { to: [0.1, 0.0], dur: 0.2, blink: false });
act.mood(c, 7.45, "wiz", "annoyed", { hold: 1.2 });
A(7.45, "wiz", "face", { lid: 0.42, dur: 0.3 });
c.at(7.6, { fx: "poof", pos: [WIZ[0] + 0.02, 1.5, WIZ[1] + 0.05], puffs: 3, color: "#6d6660", sparks: 0, dur: 1.1 });
sfx(7.75, "plunk", { gain: 0.25, reason: "one dry note as his look lands: dum" });
A(7.5, "dra", "expr", { expr: "happy", set: { curve: 0.7, open: 0.2, eye: 1.0 }, dur: 0.25 });

// ---------------------------------------------------------------- 07 RESOLVED 8.8-10.0: lit, just right
A(8.8, "dra", "look", { to: DRA_AT_WIZ, dur: 0.12, blink: false });
A(8.85, "dra", "squash", { amount: 0.05, dur: 0.2 });                  // he beams, proud
A(9.05, "dra", "squash", { amount: 0, dur: 0.2 });
A(8.9, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.3, blink: false });
c.cap(8.95, END, "...thanks.", 230);
A(9.0, "wiz", "still", { dur: 0.95, idle: 0.04 });

// ---------------------------------------------------------------- shots (directed: engine/direct.mjs)
const MED = { pos: [0.0, 0.97, 5.9], look: [0.0, 0.76, 0], fov: 36 };
const beats = c.beats([
  ["01 hook", 0, { size: "medium", push: 0.08 }, "hook"],   // one moving take for 0-3.4 s: a slow push, no cut
  ["02 harder", 2.0, "keep", "escalation"],
  ["03 the wick", 3.4, { size: "insert", on: "cupcake", at: WICK_AT }, "insert"],
  ["04 all his power", 4.0, { who: "dra" }, "threat"],
  ["05 fwoomp", 5.6, null, "payoff"],
  ["06 singed", 7.4, { who: "wiz" }, "reaction"],
  ["07 thanks", 8.8, null],
], END);

write(import.meta.url, {
  id: "light-my-candle",
  title: "Light My Candle",
  cover: 5.95,
  idea: "Camera test (insert + low angle): Dragon is asked to light a birthday candle",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#f3ead8", floor: "#d8bf98", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    // a bigger plate than Dragon vs. the Candle's (3.9 m): the low angle's wide lens looks past its edges otherwise
    plate: { src: "assets/plates/dining-blue-window.png", z: -2.3, center: [0, 2.0], height: 5.6 } },
  music: { style: "sneaky", gain: 0.28, seed: 31 },
  direct: { master: MED },
  sound: { sfx: 0.7, ambience: 0.18, speech: false, signature: false, auto: false },
  hook: { show: ["wiz", "dra", "cupcake"], hint: 0.9, what: "Dragon blows at the candle and nothing happens" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/shots/make-light-my-candle.mjs (camera test for insert + low angle shots).",
});

// ---------------------------------------------------------------- the same clip on the rest of the shot grid (task 5)
// Only the shots change: a dutch tilt on the fireball (chaos), the Wizard's dry look over Dragon's shoulder, and the lit
// candle from straight above before the last line. (The establishing shot needs a painted exterior of the house: not
// in this test.)
// over the shoulder needs the two facing each other: they turn to each other as the smoke clears (this variant only)
A(7.2, "dra", "turn", { to: -65, dur: 0.4 });
A(7.25, "wiz", "turn", { to: 60, dur: 0.45 });
const gridBeats = c.beats([
  ["01 hook", 0, { size: "medium", push: 0.08 }, "hook"],
  ["02 harder", 2.0, "keep", "escalation"],
  ["03 the wick", 3.4, { size: "insert", on: "cupcake", at: WICK_AT }, "insert"],
  ["04 all his power", 4.0, { who: "dra" }, "threat"],
  ["05 fwoomp", 5.6, null, "payoff"],
  ["05b fireball", 6.3, null, "chaos"],
  ["06 singed", 7.4, { size: "ots", who: "wiz", over: "dra" }, "reaction"],
  ["07 lit", 8.8, { size: "top", on: "cupcake", at: WICK_AT }],
  ["07b thanks", 9.5, null],
], END);
write(import.meta.url, {
  id: "light-my-candle-grid",
  title: "Light My Candle (shot grid)",
  cover: 6.5,
  idea: "Camera test (dutch, over the shoulder, top-down) on Light My Candle",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#f3ead8", floor: "#d8bf98", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/dining-blue-window.png", z: -2.3, center: [0, 2.0], height: 5.6 } },
  music: { style: "sneaky", gain: 0.28, seed: 31 },
  direct: { master: MED },
  sound: { sfx: 0.7, ambience: 0.18, speech: false, signature: false, auto: false },
  hook: { show: ["wiz", "dra", "cupcake"], hint: 0.9, what: "Dragon blows at the candle and nothing happens" },
  cast, props, captions: c.captions, beats: gridBeats,
  notes: "Generated by storyboards/shots/make-light-my-candle.mjs (camera test for dutch, over-the-shoulder and top-down shots).",
});
