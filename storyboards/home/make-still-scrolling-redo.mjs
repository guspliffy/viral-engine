// STILL SCROLLING, REDO (4 Nov 2026): "The friend who never looks up from his phone". Jonny's redo brief
// (/mnt/project-files/REDO-2026-11-04.md) + the reach playbook: ~9 s, one continuous scene, the stool gone by 1.5 s,
// an escalation and an open ending instead of the 25 Oct cut's slow idea beat and "done" pose. Built from
// storyboards/templates/clip-template.mjs; the stool and phone staging come from make-still-scrolling.mjs.
//
// THE BRIEF
//   Joke:        Phoenix is so deep in his phone that nothing the Wizard does gets him to look up.
//   Wants:       the Wizard wants a reaction: Phoenix on the floor, or at least a look.
//   Consequence: the stool goes and Phoenix just hovers; a party horn in his ear and he only drifts sideways.
//   Ending:      the Wizard stares at us with the horn hanging limp from his lips; Phoenix hovers and scrolls. Cut.
//   Callback:    the opening promises a prank on a phone friend; the end is the same two, the prankster beaten.
//   Gap (comments): did Phoenix even notice? The clip never says.
//
// Beats (the brief's sheet): 0-1.5 the Wizard is already crouching at the stool, grin, grip; 1.5 the yank, the wings
// flick open, he hovers in the same pose; 3.5 double take, squint; 4.5 a ping, Phoenix smiles at the screen; 5.4 the
// Wizard poofs up a party horn; 6.0 toot, 6.8 the big toot in his ear, Phoenix drifts a few cm; 8.0 the Wizard to camera.
//
// The on-screen title is NOT burned in: Jonny adds it in TikTok with the in-app text tool (playbook, 4 Nov). The top of
// the frame is kept clear of faces for it. The delivery has a preview with the title drawn on.
//
// Run: node storyboards/home/make-still-scrolling-redo.mjs -> storyboards/home/still-scrolling-redo.json
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

const FACES = "strong", MOTION = "natural";
const c = clip({ faces: FACES }), { A, prop, sfx, arm, see } = c;
const END = 9.0;

// ---------------------------------------------------------------- places (set-apartment.js; x right, z toward us)
const STOOL0 = [-0.5, 0.06], STOOL1 = [0.1, 0.02];                // the yank pulls it right, a little toward us
const WIZ0 = [0.66, 0.36];                                         // frame 0: half a step out, already coming in
const WIZ_GRIP = [0.55, 0.28];                                     // crouched at the stool's right side
const WIZ_END = [WIZ_GRIP[0] + STOOL1[0] - STOOL0[0], WIZ_GRIP[1] + STOOL1[1] - STOOL0[1]];   // pulled back with it
const WIZ_STAND = [0.72, 0.5];                                     // up, off the stool, facing the hover
const WIZ_HORN = [Number(process.env.HX ?? 0.56), Number(process.env.HZ ?? 0.86)];   // in at Phoenix's side for the horn
const SEAT = 0.42 - 0.12, LIFT = Number(process.env.LIFT ?? 0.18);  // Phoenix's seated root height, and the hover's rise
const DRIFT = 0.07;                                                // how far the big toot pushes him (m)

const AT_PHONE = [0.03, -1];
const WIZ_AT_STOOL = [-0.75, -0.45], WIZ_AT_PHX = [-0.8, 0.12], WIZ_AT_PHX_UP = [-0.75, 0.3], WIZ_AT_STOOL_R = [-0.2, -0.5];

// Phoenix holds the phone in both hands in front of his chest (make-still-scrolling.mjs)
const PH_Y = 0.33, PH_Z = 0.44;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
// the Wizard's hands on the seat's right edge from outside (the 25 Oct cut's tested rim grip)
const rimPt = (deg, r = 0.3) => [r * Math.cos((deg * Math.PI) / 180), 0.39, r * Math.sin((deg * Math.PI) / 180)].map(r3);
const RIM_R = { prop: "stool", grip: rimPt(-40), palm: true }, RIM_L = { prop: "stool", grip: rimPt(8), palm: true };

const cast = [
  { id: "phx", character: "potatobrawl/phoenix", at: STOOL0, face: "camera", expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 2.0,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "halloween/wizard-host", at: WIZ0, face: -60, expr: "kind", follow: 0.5, seed: 2.6 },
];
const props = [
  { id: "stool", kind: "stool", x: STOOL0[0], z: STOOL0[1] },
  { id: "phone", kind: "phone", x: STOOL0[0], y: 0.9, z: 0.45, rot: 180, tip: -28, scale: 1.9, case: "#7cc4bd" },
  // the escalation's one extra prop: a paper party horn in the Wizard's lips, pointed at Phoenix's phone hand
  { id: "horn", kind: "partyhorn", mouth: "wiz", target: "phone", at: [0, Number(process.env.HY ?? 0.4), 0], len: 0.5, maxPitch: 0.55 },
];

// ---------------------------------------------------------------- 1 THE GRAB 0-1.5: frame 0 is already the prank
A(0, "phx", "sit", { seat: "stool", dur: 0.01, hands: "keep", feet: [0.38, 0.1] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0.01, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.42, dur: 0.01 });
act.blinksAt(c, "phx", [2.7, 5.15, 8.3]);
act.scrollPhone(c, "phx", [0.15, 1.05, 2.2, 3.2, 4.0, 5.0, 5.9, 6.6, 7.5, 8.4]);
// the Wizard: a sly grin from frame 0, eyes on the stool, crouching in as he steps
A(0, "wiz", "look", { to: WIZ_AT_STOOL, dur: 0.01, blink: false });
A(0, "wiz", "expr", { expr: "kind", set: { smirk: 0.35, curve: 0.35, raise: 0.05 }, dur: 0.01 });
A(0, "wiz", "face", { brow: 0.3, dur: 0.01 });
act.blinksAt(c, "wiz", [3.3, 7.05]);
A(0, "wiz", "move", { to: WIZ_GRIP, dur: 0.45, ease: "inOut", steps: 1 });
A(0, "wiz", "turn", { to: -78, dur: 0.45 });
A(0, "wiz", "crouch", { to: 0.3, dur: 0.01 });                                     // frame 0: already bending in
A(0.02, "wiz", "crouch", { to: 0.8, dur: 0.38, ease: "out" });
A(0, "wiz", "grip", { side: "both", shape: "open", dur: 0.01 });
arm(0, "wiz", "R", RIM_R, 0.38, "out");
arm(0.04, "wiz", "L", RIM_L, 0.38, "out");
A(0.42, "wiz", "grip", { side: "both", shape: "rim", dur: 0.12 });
sfx(0.5, "tink", { gain: 0.05, reason: "his glove ring taps the stool rim as he takes it" });
// one glance up at his victim, the grin widening: ready
A(0.7, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.15, blink: false });
A(0.75, "wiz", "expr", { set: { smirk: 0.5, curve: 0.55 }, dur: 0.2 });
A(1.2, "wiz", "look", { to: WIZ_AT_STOOL, dur: 0.15, blink: false });
see(0, 1.5, ["phx.face", "wiz.face", "phone", "stool"], "the setup at frame 0: Phoenix on his phone on a stool, the Wizard grabbing it");

// ---------------------------------------------------------------- 2 THE YANK 1.5-3.5: gone, and he just hovers
const YANK = 1.5, YANK_DUR = 0.42;
A(YANK - 0.12, "phx", "span", { to: 0.3, dur: 0.15, ease: "out" });               // the wings flick open (narrow: the Wizard is close)
A(YANK - 0.1, "phx", "fly", { to: { y: SEAT + LIFT }, dur: 0.3, ease: "out" });    // clear of the seat before it moves
sfx(YANK - 0.12, "wings", { gain: 0.45, dur: END - (YANK - 0.12) - 0.05 });
A(YANK - 0.08, "wiz", "lean", { to: -6, dur: 0.1 });                               // he sets his weight
prop(YANK, "stool", { x: STOOL1[0], z: STOOL1[1] }, YANK_DUR, "in");
A(YANK, "wiz", "move", { to: WIZ_END, dur: YANK_DUR, ease: "in", steps: 1 });
A(YANK, "wiz", "lean", { to: 10, dur: YANK_DUR });                                 // leaning back into the pull
sfx(YANK + 0.02, "scrape", { gain: 0.5, dur: YANK_DUR - 0.04 });
A(YANK + YANK_DUR, "wiz", "lean", { to: 0, dur: 0.3 });
A(YANK + YANK_DUR, "wiz", "squash", { amount: 0.03, dur: 0.2 });
A(2.1, "phx", "span", { to: 1, dur: 0.45, ease: "inOut" });                        // full beats once the Wizard is clear
see(1.6, 3.4, ["phx.face", "phone", "stool"], "the stool is gone and Phoenix hovers in the same pose, still on the phone");

// ---------------------------------------------------------------- 3 DOUBLE TAKE 2.4-4.4, THE PING 4.5
// he lets go of the stool and gets up first (turned to it, so his arms drop clear), then the double take
A(2.1, "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
arm(2.17, "wiz", "R", "rest", 0.35, "inOut");
arm(2.21, "wiz", "L", "rest", 0.35, "inOut");
A(2.25, "wiz", "crouch", { to: 0, dur: 0.35, ease: "inOut" });
A(2.35, "wiz", "turn", { to: -50, dur: 0.4 });
A(2.35, "wiz", "move", { to: WIZ_STAND, dur: 0.4, ease: "inOut", steps: 1 });
A(2.15, "wiz", "look", { to: WIZ_AT_STOOL_R, dur: 0.2, blink: false });            // at the empty stool by his feet
A(2.15, "wiz", "expr", { expr: "kind", set: { curve: 0.3 }, dur: 0.2 });
A(3.05, "wiz", "look", { to: WIZ_AT_PHX_UP, dur: 0.12, blink: false });           // up at Phoenix...
A(3.3, "wiz", "look", { to: WIZ_AT_STOOL_R, dur: 0.12, blink: false });          // ...the stool...
A(3.5, "wiz", "look", { to: WIZ_AT_PHX_UP, dur: 0.12, blink: false });            // ...Phoenix: the double take
act.shock(c, 3.5, "wiz", { hold: 0.35 });
act.mood(c, 4.0, "wiz", "annoyed", { hold: 0.6 });                                 // the squint
sfx(4.5, "notify", { gain: 0.32 });
act.grin(c, 4.6, "phx", { back: 0.9 });                                            // a smile at the screen, never at him
c.textPop(4.5, "phx", "ping!", { dur: 0.45 });
see(3.5, 4.4, ["wiz.face"], "the Wizard's double take");
see(4.6, 5.2, ["phx.face", "wiz.face"], "Phoenix smiles at his phone while the Wizard squints at him");

// ---------------------------------------------------------------- 4 ESCALATION 5.3-8.0: the party horn
A(5.3, "phx", "span", { to: 0.15, dur: 0.3 });                                     // the Wizard comes close again
A(5.3, "wiz", "move", { to: WIZ_HORN, dur: 0.45, ease: "inOut", steps: 1 });
A(5.3, "wiz", "turn", { to: -62, dur: 0.4 });
A(5.3, "wiz", "expr", { expr: "kind", set: { smirk: 0.5, curve: 0.45 }, dur: 0.2 });
A(5.3, "wiz", "face", { lid: 0.15, brow: 0.35, dur: 0.2 });
A(5.3, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.15, blink: false });
// poof: a party horn appears in his lips (a wizard's trick: the poof is the cause)
const POOF = 5.6;
c.at(POOF, { fx: "poof", pos: [0.2, 0.52, 1.02], dur: 0.4, color: "#efe6ff", spark: "#ffd23f", puffs: 4, size: 0.3, sparks: 12, sparkSize: 0.5, speed: 0.45 });
prop(POOF + 0.02, "horn", { show: 1 }, 0.1, "out");
A(POOF + 0.02, "wiz", "expr", { expr: "focused", set: { pucker: 0.8, open: 0.05 }, dur: 0.12 });
// toot one: a short test
A(5.95, "wiz", "squash", { amount: -0.03, dur: 0.2 });                              // a breath in
prop(6.15, "horn", { blow: 1, flutter: 1 }, 0.14, "out");
sfx(6.15, "partyhorn", { gain: 0.5 });
c.textPop(6.2, "wiz", "toot", { dur: 0.35 });
A(6.15, "wiz", "expr", { expr: "focused", set: { pucker: 1, open: 0.1, eye: 0.8 }, dur: 0.1 });
prop(6.55, "horn", { blow: 0, flutter: 0 }, 0.18, "in");
A(6.6, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.1, blink: false });
// toot two: a big one, leaning right into his ear
A(6.7, "wiz", "squash", { amount: -0.05, dur: 0.2 });
A(6.75, "wiz", "lean", { to: -8, dur: 0.15 });
prop(6.85, "horn", { blow: 1, flutter: 1 }, 0.12, "out");
sfx(6.85, "partyhorn", { gain: 1.0 });
sfx(6.95, "partyhorn", { gain: 0.8, reason: "the big toot runs on: a second blast" });
A(6.85, "wiz", "expr", { expr: "focused", set: { pucker: 1, open: 0.1, eye: 0.65 }, dur: 0.08 });
c.textPop(6.9, "wiz", "TOOOOT!", { dur: 0.75 });
// Phoenix drifts a few centimetres away from the noise, thumb still going, eyes never up
A(6.95, "phx", "fly", { to: { x: STOOL0[0] - DRIFT, y: SEAT + LIFT }, dur: 0.5, ease: "out" });
prop(7.45, "horn", { blow: 0.55, flutter: 0, droop: 1 }, 0.5, "inOut");            // out of breath: it hangs limp from his lips
A(7.45, "wiz", "lean", { to: 0, dur: 0.3 });
see(5.6, 6.1, ["wiz.face", "horn"], "the horn appears in the Wizard's lips");
see(6.85, 7.5, ["phx.face", "phone", "horn"], "the big toot in Phoenix's ear: he doesn't look up");

// ---------------------------------------------------------------- 5 END 7.9-9.0: the Wizard looks at us; Phoenix scrolls on
act.defeated(c, 7.75, "wiz", { turn: -38, hold: 0.6, blink: false });
A(7.8, "wiz", "expr", { expr: "deadpan", set: { curve: -0.12, pucker: 0.6 }, dur: 0.35 });   // lips still round the horn
see(8.6, 9.0, ["wiz.face", "phx.face", "horn", "phone"], "the end: the Wizard's flat look at us, horn limp, Phoenix still scrolling");

// ---------------------------------------------------------------- shots (one static master, then the escalation closer)
const MED = { pos: [0.22, 1.02, 6.7], look: [0.22, 0.8, 0], fov: 36 };              // both, the stool and the floor
const TWO = { pos: [0.16, 0.96, 5.3], look: [0.16, 0.82, 0], fov: 36 };           // the horn two-shot
const PUSH = { pos: [0.1, 0.97, 5.05], look: [0.1, 0.86, 0], fov: 36 };
const beats = c.beats([
  ["the grab", 0, MED, "hook"],
  ["the yank", YANK, null],
  ["double take", 2.4, null],
  ["the horn", 5.3, TWO, "escalation"],
  ["the big toot", 6.7, null, "payoff"],
  ["the look", 7.75, { ...TWO, to: PUSH, dur: 1.25, ease: "inOut" }, "reaction"],
], END);

write(import.meta.url, {
  id: "still-scrolling-redo",
  title: "The friend who never looks up from his phone",
  idea: "Jonny's redo brief (4 Nov 2026, REDO-2026-11-04.md) + the reach playbook",
  format: "one continuous scene, a prank that escalates and never lands; open ending for comments",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet",   // the design-sheet faces, skin and costumes with pencil hatching (Jonny, 4 Nov; PR #84)
  motion: MOTION,
  cover: 6.95,
  creative: { length: [8, 12], maxEventGap: 2.0 },
  set: { type: "apartment", seed: 5 },
  music: { style: "bounce", gain: 0.42, lowCut: 150 },   // low cut: the bed reaches a phone speaker (7 % -> 24 % in band)
  sound: { sfx: 0.6, ambience: 0.3, flaps: false },   // the soft "wings" hover bed instead of a loud flap per wingbeat, so the horn is the loudest thing
  hook: { show: ["phx", "wiz", "phone", "stool"], hint: 0, what: "the Wizard grabs the stool under Phoenix, who only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "stool", from: 0, to: YANK + 0.05, reason: "Phoenix sits on the stool (his legs rest over its edge) until he lifts off" },
  ],
  notes: "Generated by storyboards/home/make-still-scrolling-redo.mjs. No dialogue; music bed, stool scrape, wings, a ping, a poof and the party horn. Title added in TikTok's text tool.",
});
