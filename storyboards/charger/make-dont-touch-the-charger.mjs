// DON'T TOUCH THE CHARGER (Jonny's story library #08, 28 Oct 2026), built from the clip template.
// node storyboards/charger/make-dont-touch-the-charger.mjs -> storyboards/charger/dont-touch-the-charger.json (+ -b)
//
// THE BRIEF (story library 08, ENGINE-PROMPT.md: 13.00 s, 390 frames, seven shots, wordless, no loop)
//   Joke:        the Wizard is so absorbed in his phone that Dragon steals his snacks in plain sight, but the instant
//                Dragon reaches for the charging plug, the Wizard catches his wrist and finally looks up.
//   Wants:       Dragon wants to see how much he can get away with.
//   Consequence: the charger is the one boundary: a gentle wrist stop, a firm stare.
//   Ending:      the Wizard's firm stare meets Dragon's sheepish face, held. The plug never comes out. No loop.
//
//   01 0.00-2.20  free biscuit: Dragon's right hand takes biscuit A and eats it; the Wizard scrolls    (swipe, crunch)
//   02 2.20-5.20  whole bowl: Dragon slides the bowl (B and C inside) to his side, checks the Wizard   (bowl scrape)
//   03 5.20-6.40  the wrong idea: Dragon close-up, pleased, eyes drop to the plug, the shoulder starts
//   04 6.40-8.40  almost: macro of the bank's left port and plug; his fingers approach, no touch       (quiet gap)
//   05 8.40-8.90  he noticed: the Wizard's eyes snap to the hand, lids narrow, the scrolling stops
//   06 8.90-10.40 boundary: two-shot, the Wizard's LEFT hand stops Dragon's RIGHT wrist; Dragon freezes (soft stop)
//   07 10.40-13.0 caught: the firm stare meets the sheepish face, the bowl with Dragon, the cable connected
//
// Hands (the brief): the Wizard's own RIGHT holds the phone all clip, his own LEFT swipes and later stops Dragon's
// wrist. Dragon's own RIGHT takes the biscuit, slides the bowl and reaches for the plug; his left rests on the table.
// State: biscuit A bowl -> Dragon's right hand -> mouth (hidden inside); bowl centre -> sliding -> beside Dragon;
// phone always in the Wizard's right; cable always plugged into the bank's left port; B and C never move in the bowl.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { CHARGER } from "../../engine/page/props-charger.js";

const c = clip(), { A, sfx } = c;
const END = 13.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const WIZ = [-0.47, 0.0], DRA = [0.44, 0.0];
const TABLE_H = 0.33, TABLE_Z = 0.86, TABLE_D = 0.82;
const BANK_S = 1.6, BANK = [-0.04, TABLE_H, 0.52];
const PLUG = [r3(BANK[0] - (CHARGER.bank.w / 2 + CHARGER.plugOut * 0.6) * BANK_S), r3(TABLE_H + CHARGER.bank.h * 0.5 * BANK_S), BANK[2]];   // the plug housing, in the world
const BOWL_S = 1.4, BOWL0 = [0.1, TABLE_H, 0.82], BOWL1 = [0.42, TABLE_H, 0.8];    // from the middle (the Wizard's snacks too) to in front of Dragon
const BISCUIT_S = BOWL_S;
const seatA = (b) => [r3(b[0] + CHARGER.seatA[0] * BOWL_S), r3(b[1] + CHARGER.seatA[1] * BOWL_S), r3(b[2] + CHARGER.seatA[2] * BOWL_S)];
const MOUTH_D = [r3(DRA[0] - 0.103), 0.557, 0.351];  // Dragon's mouth on his face (render --layout "mouth")

// the Wizard's phone hand and his scrolling index (his own space: x right on screen when facing us, y up, z forward)
const PHONE_HAND = { x: [-0.06, 0.39, 0.5] };
const SCROLL_REST = { x: [0.08, 0.4, 0.45] }, SCROLL_LOW = { x: [0.03, 0.41, 0.45] }, SCROLL_HIGH = { x: [0.03, 0.5, 0.45] };
// eye targets (face look space: + right on screen, + up)
const WIZ_AT_PHONE = [-0.05, -0.85], WIZ_AT_HAND = [0.45, -0.75], WIZ_AT_DRA = [0.75, 0.0];
const DRA_AT_BOWL = [-0.35, -0.75], DRA_AT_WIZ = [-0.8, -0.05], DRA_AT_PLUG = [-0.55, -0.7], DRA_AHEAD = [0.0, 0.0];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: 14, expr: "kind", follow: 0.2, seed: 2.6,
    arms: { R: PHONE_HAND, L: SCROLL_REST }, grip: { R: "hold", L: "point" } },
  { id: "dra", character: "lookdev/dragon-crisp-table", at: DRA, face: -16, expr: "kind", follow: 0.25, seed: 4.1 },
];
const props = [
  { id: "table", kind: "coffeetable", x: 0, z: TABLE_Z, h: TABLE_H, w: 2.8, d: TABLE_D, color: "#e9cfa4", leg: "#c99a64" },
  { id: "phone", kind: "phone", x: -0.4, y: 0.43, z: 0.5, rot: 166, tip: -18, scale: 1.35 },
  { id: "bank", kind: "chargebank", x: BANK[0], y: BANK[1], z: BANK[2], scale: BANK_S, to: "phone", slack: 0.05 },
  { id: "bowl", kind: "snackbowl", x: BOWL0[0], y: BOWL0[1], z: BOWL0[2], scale: BOWL_S, biscuits: 2 },
  { id: "bisA", kind: "biscuit", ...xyz(seatA(BOWL0)), tip: CHARGER.leanA, scale: BISCUIT_S },
];
function xyz(p) { return { x: p[0], y: p[1], z: p[2] }; }

// ---------------------------------------------------------------- frame 0: everything already in place
A(0, "wiz", "grab", { prop: "phone", hand: "R", grip: [0.034, 0.065, 0], pose: null });
A(0, "wiz", "look", { to: WIZ_AT_PHONE, dur: 0.01, blink: false });
A(0, "wiz", "face", { lid: 0.4, dur: 0.01 });
A(0, "wiz", "expr", { expr: "kind", set: { curve: 0.25 }, dur: 0.01 });
A(0, "dra", "arm", { side: "L", pose: { world: [0.66, TABLE_H + 0.035, 0.5] }, dur: 0 });
A(0, "dra", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "dra", "arm", { side: "R", pose: { world: [0.3, TABLE_H + 0.2, 0.62] }, dur: 0 });
A(0, "dra", "grip", { side: "R", shape: "open", dur: 0 });
A(0, "dra", "look", { to: DRA_AT_WIZ, dur: 0.01, blink: false });                 // a heist: a glance at the mark...
A(0.18, "dra", "look", { to: DRA_AT_BOWL, dur: 0.15, blink: false });              // ...then the take
A(0, "dra", "expr", { expr: "sly", set: { curve: 0.5, smirk: 0.45 }, dur: 0.01 });
act.blinksAt(c, "wiz", [3.25, 6.9]);
act.blinksAt(c, "dra", [2.05, 4.35, 10.1]);

// the Wizard's swipe: the left index lifts to the lower screen, strokes up, lifts away and comes back to rest
const swipe = (t) => {
  c.arm(t, "wiz", "L", SCROLL_LOW, 0.12, "inOut");
  c.arm(t + 0.12, "wiz", "L", SCROLL_HIGH, 0.14, "inOut");
  c.arm(t + 0.26, "wiz", "L", SCROLL_REST, 0.2, "inOut");
  sfx(t + 0.14, "kenney/scroll", { gain: 0.32 });
};
for (const t of [0.0, 1.35, 2.6, 3.7, 4.75, 5.7, 7.0]) swipe(t);

// ---------------------------------------------------------------- 01 FREE BISCUIT 0.00-2.20
// the biscuit is held by its rim on his right ("side"), so its round face shows and the hand stays beside his mouth
const ROT_A = -10, SIDE = CHARGER.biscuitR * 1.35 * BISCUIT_S;
const beside = (p, rot = ROT_A) => [r3(p[0] - SIDE * Math.cos((rot * Math.PI) / 180)), r3(p[1]), r3(p[2] + SIDE * Math.sin((rot * Math.PI) / 180))];
const AT_LIPS = [MOUTH_D[0] + 0.028, MOUTH_D[1] - 0.012, MOUTH_D[2] + 0.06], IN_MOUTH = [MOUTH_D[0] + 0.028, MOUTH_D[1] - 0.008, MOUTH_D[2] - 0.035];
c.arm(0, "dra", "R", { world: beside(seatA(BOWL0), 0) }, 0.35, "inOut");            // fingers into the bowl at once
A(0.33, "dra", "grip", { side: "R", shape: "pinch", dur: 0.08 });
A(0.36, "dra", "grab", { prop: "bisA", hand: "R", grip: "side", pose: null });
sfx(0.36, "grab", { gain: 0.25 });
c.arm(0.4, "dra", "R", { world: [0.14, 0.5, 0.66] }, 0.3, "inOut");               // lifted clear of the bowl by 0.70
c.prop(0.4, "bisA", { tip: 0, rot: ROT_A }, 0.4);                                  // its round face to the camera
A(0.55, "dra", "look", { to: DRA_AT_WIZ, dur: 0.18, blink: false });             // a check on the Wizard: nothing
A(0.95, "dra", "look", { to: [-0.1, -0.45], dur: 0.15, blink: false });
c.arm(0.75, "dra", "R", { world: beside(AT_LIPS) }, 0.45, "inOut");               // at his lips by 1.2
A(1.05, "dra", "expr", { expr: "happy", set: { open: 0.55, curve: 0.5 }, dur: 0.12 });
c.arm(1.25, "dra", "R", { world: beside(IN_MOUTH) }, 0.17, "in");                // in it goes (behind the face)
c.prop(1.42, "bisA", { eaten: 1 }, 0.01);
A(1.42, "dra", "expr", { set: { open: 0, curve: 0.7 }, dur: 0.06 });
A(1.42, "dra", "squash", { amount: 0.04, dur: 0.2 });
sfx(1.42, "ai/crunch", { gain: 0.6 });
A(1.45, "dra", "face", { lid: 0.85, dur: 0.1 });                                 // a happy closed-eye chew
c.arm(1.45, "dra", "R", { world: beside([AT_LIPS[0], AT_LIPS[1] - 0.07, AT_LIPS[2] + 0.04]) }, 0.12, "out");   // the empty hand comes out, down...
c.arm(1.57, "dra", "R", { world: [0.3, TABLE_H + 0.18, 0.6] }, 0.45, "inOut");    // ...and away
A(1.5, "dra", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
for (const [t, o] of [[1.62, 0.18], [1.76, 0], [1.9, 0.16], [2.04, 0]]) A(t, "dra", "expr", { set: { open: o }, dur: 0.1 });
A(2.1, "dra", "face", { lid: 0, dur: 0.12 });
A(2.12, "dra", "look", { to: DRA_AT_BOWL, dur: 0.15, blink: false });

// ---------------------------------------------------------------- 02 WHOLE BOWL 2.20-5.20
const RIM = (b) => [r3(b[0] - 0.135 * BOWL_S), r3(b[1] + CHARGER.bowlRim * BOWL_S + 0.02), r3(b[2])];   // his paw over the far (left) rim
A(2.3, "dra", "expr", { expr: "sly", set: { curve: 0.55, smirk: 0.45 }, dur: 0.2 });
A(2.3, "dra", "face", { brow: 0.2, dur: 0.2 });
c.arm(2.25, "dra", "R", { world: RIM(BOWL0) }, 0.25, "inOut");                   // on the rim by 2.5
A(2.4, "dra", "grip", { side: "R", shape: "rim", dur: 0.12 });
A(2.55, "dra", "still", { dur: 0.25, idle: 0.1 });
c.arm(2.8, "dra", "R", { world: RIM(BOWL1) }, 1.7, "inOut");                     // the slide, 2.80-4.50
c.prop(2.8, "bowl", xyz(BOWL1), 1.7, "inOut");
sfx(2.8, "ai/bowl-scrape", { gain: 0.45, reason: "the bowl slides across the wooden tabletop (2.8-4.5)" });
A(2.8, "dra", "lean", { to: 4, dur: 1.7 });
c.arm(4.6, "dra", "R", { world: [0.25, TABLE_H + 0.035, 0.55] }, 0.3, "inOut");    // released by 4.9, the paw on the table left of the bowl
A(4.6, "dra", "grip", { side: "R", shape: "paw", dur: 0.2 });
A(4.6, "dra", "lean", { to: 0, dur: 0.4 });
act.checkOn(c, 4.5, "dra", { at: DRA_AT_WIZ, back: [-0.2, -0.2], hold: 0.55 });   // he checks: still scrolling

// ---------------------------------------------------------------- 03 THE WRONG IDEA 5.20-6.40
A(5.22, "dra", "expr", { expr: "happy", set: { curve: 0.75, eye: 0.95 }, dur: 0.2 });   // a small satisfied look
A(5.25, "dra", "face", { lid: 0.3, dur: 0.2 });
A(5.25, "dra", "still", { dur: 0.45, idle: 0.15 });
act.idea(c, 5.62, "dra", { at: DRA_AT_PLUG, hold: 0.6 });                          // ...then his eyes drop to the plug
A(5.7, "dra", "face", { lid: 0.1, dur: 0.15 });
act.eyesLead(c, 6.15, "dra", DRA_AT_PLUG);
A(6.15, "dra", "lean", { to: -5, dur: 0.6, ease: "inOut" });                       // the right shoulder starts the reach
c.arm(6.15, "dra", "R", { world: [0.22, TABLE_H + 0.14, 0.62] }, 0.3, "inOut");
A(6.2, "dra", "grip", { side: "R", shape: "hover", dur: 0.4 });

// ---------------------------------------------------------------- 04 ALMOST 6.40-8.40 (and on through the eye insert)
// the hand comes round the front of the bank from his side, the index leading, and stops short of the housing
const NEAR = [PLUG[0] + 0.11, PLUG[1] + 0.08, PLUG[2] + 0.07], STOP = [PLUG[0] + 0.045, PLUG[1] + 0.072, PLUG[2] + 0.04];   // past the bank, then the fingertips over the plug housing
c.arm(6.45, "dra", "R", { world: NEAR }, 1.4, "out");                              // the approach decelerates
c.arm(7.85, "dra", "R", { world: STOP }, 0.9, "out");                              // ...creeping on during the insert
A(6.45, "dra", "lean", { to: -8, dur: 1.6, ease: "out" });
A(6.45, "dra", "look", { to: DRA_AT_PLUG, dur: 0.2, blink: false });
A(6.45, "dra", "still", { dur: 2.5, idle: 0.1 });

// ---------------------------------------------------------------- 05 HE NOTICED 8.40-8.90
A(8.42, "wiz", "look", { to: WIZ_AT_HAND, dur: 0.07, blink: false });             // a snap: eyes first
A(8.5, "wiz", "face", { lid: 0.12, brow: -0.8, dur: 0.12 });                        // brows do the work (lids over the pupils read as a glitch)                       // lids narrow, brows down
A(8.5, "wiz", "expr", { expr: "deadpan", set: { curve: -0.15 }, dur: 0.12 });
A(8.45, "wiz", "still", { dur: 0.45, idle: 0.05 });

// ---------------------------------------------------------------- 06 BOUNDARY 8.90-10.40
// Dragon's right wrist at the stop: back from the hand toward his shoulder (his forearm runs back, up and right)
const FOREARM = (() => { const d = [0.5, 0.11, -0.86], l = Math.hypot(...d); return d.map((v) => v / l); })();
const WRIST = STOP.map((v, i) => r3(v + FOREARM[i] * 0.11));   // a hand-width up the forearm, so his own hand shows beyond the grip
c.arm(8.82, "wiz", "L", { world: [WRIST[0] - 0.06, WRIST[1] + 0.08, WRIST[2] + 0.02] }, 0.14, "out");
c.arm(8.96, "wiz", "L", { world: [WRIST[0], WRIST[1] + 0.045, WRIST[2]] }, 0.12, "out");
A(8.9, "wiz", "grip", { side: "L", shape: "clasp", dur: 0.14 });
sfx(9.05, "thud-soft", { gain: 0.3, reason: "the soft stop: the Wizard's glove closes on Dragon's wrist" });
A(8.7, "dra", "grip", { side: "R", shape: "pinch", dur: 0.25 });                    // the fingers start to close on it...
A(9.05, "dra", "squash", { amount: 0.03, dur: 0.15 });
A(9.05, "dra", "still", { dur: 1.35, idle: 0.02 });                                 // he freezes
A(9.06, "dra", "expr", { expr: "shocked", set: { open: 0.12, eye: 1.2, curve: -0.05 }, dur: 0.1 });
A(9.06, "dra", "face", { brow: 0.5, dur: 0.1 });
A(9.6, "dra", "look", { to: DRA_AT_WIZ, dur: 0.2, blink: false });                  // ...then looks at him
A(9.7, "dra", "expr", { expr: "nervous", set: { open: 0.15, curve: -0.1, eye: 1.1 }, dur: 0.2 });
A(9.3, "wiz", "look", { to: WIZ_AT_DRA, dur: 0.2, blink: false });                  // the Wizard looks up, finally
A(9.3, "wiz", "turn", { to: 26, dur: 0.4 });
A(9.4, "wiz", "face", { lid: 0.08, dur: 0.2 });

// ---------------------------------------------------------------- 07 CAUGHT 10.40-13.00
A(10.4, "wiz", "still", { dur: 2.6, idle: 0.05 });
A(10.4, "dra", "still", { dur: 2.6, idle: 0.08 });
A(10.6, "dra", "droop", { to: 1, dur: 0.6 });
A(10.9, "dra", "look", { to: DRA_AT_PLUG, dur: 0.15, blink: false });              // a guilty glance at the plug...
A(11.35, "dra", "look", { to: DRA_AT_WIZ, dur: 0.15, blink: false });              // ...and back
A(11.7, "dra", "expr", { expr: "nervous", set: { open: 0, curve: 0.3, eye: 1.0, tilt: 0.3 }, dur: 0.35 });   // a sheepish smile
A(11.7, "dra", "face", { brow: 0.35, dur: 0.3 });
A(12.1, "wiz", "face", { browL: -0.2, browR: -0.75, dur: 0.3 });                     // one brow lower: "don't" (the brief: his firm stare holds to the end)

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and
// elevation el, far enough that the frame is h metres tall at the target with lens fov
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const S1 = frame([-0.03, 0.74, 0.3], { az: 6, el: 7, h: 2.1, fov: 24 });
const S2 = frame([0.06, 0.72, 0.36], { az: 3, el: 10, h: 2.25, fov: 24, push: 0.08, dur: 3.0 });
const S3 = frame([0.28, 0.62, 0.2], { az: 22, el: 4, h: 1.0, fov: 22, push: 0.05, dur: 1.2 });
const S4 = frame([PLUG[0] + 0.05, PLUG[1] + 0.04, PLUG[2] + 0.06], { az: -40, el: 18, h: 0.55, fov: 18, push: 0.06, dur: 2.0 });
const S5 = frame([-0.42, 0.68, 0.31], { az: 14, el: 0, h: 0.62, fov: 16 });
const S6 = frame([0.0, 0.56, 0.36], { az: 6, el: 14, h: 2.15, fov: 24 });
const S7 = frame([0.0, 0.58, 0.3], { az: 4, el: 7, h: 2.2, fov: 22, push: 0.06, dur: 2.6 });
const beats = c.beats([
  ["01 free biscuit", 0, S1, "hook"],
  ["02 whole bowl", 2.2, S2, "escalation"],
  ["03 the wrong idea", 5.2, S3],
  ["04 almost", 6.4, S4],
  ["05 he noticed", 8.4, S5, "reveal"],
  ["06 boundary", 8.9, S6, "payoff"],
  ["07 caught", 10.4, S7, "reaction"],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "dont-touch-the-charger" : `dont-touch-the-charger-${variant.toLowerCase()}`,
  title: "Don't Touch the Charger",
  idea: "Story library 08: the Wizard ignores two snack thefts but catches Dragon's wrist before he can touch the charger",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 15], loop: false },
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  // the sneaky bed (Jonny picked sneaky-01) under the two thefts; it stops on a bar line as the reach for the plug
  // begins, so the approach plays in a quiet room (the brief's short gap) and the catch needs no hit
  music: { file: "ai/sneaky/sneaky-01.ogg", until: 6.4, gain: 0.42 },
  sound: { sfx: 0.7, ambience: 0.3, speech: false },
  experiment: { id: "hook-2026-11", episode: "dont-touch-the-charger", variant },
  cast, props, captions, beats,
  allowClip: [
    { who: "dra", with: "table", from: 0, to: END, reason: "his left paw rests on the tabletop" },
    { who: "dra", with: "bisA", from: 1.2, to: 1.5, reason: "the biscuit goes into his mouth (hidden inside the face)" },
    { who: "dra", with: "dra", from: 0.9, to: 1.5, reason: "his hand feeds the biscuit into his mouth, under his eyes (checked by eye: both eyes stay clear)" },
    { who: "dra", with: "wiz", from: 8.9, to: END, reason: "the Wizard's left hand holds Dragon's wrist (the catch)" },
  ],
  notes: "Generated by storyboards/charger/make-dont-touch-the-charger.mjs (Jonny's story library 08).",
});
// A: the brief as written (wordless). B: A plus a hook caption over the opening that sets up the expectation the
// payoff breaks (the hook lab: on mute a caption carried the setup; it must hint the twist, not give it away).
write(import.meta.url, sb("A", c.captions));
write(import.meta.url, sb("B", [...c.captions, { from: 0, to: 2.1, text: "He never notices anything", pos: 230, pop: false }]));
