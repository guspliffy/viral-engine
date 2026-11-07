// Core Five, Astronaut test 2 (thread "Make videos with the Core Five characters", 5 Nov 2026): the redesigned
// Astronaut (characters/core-five-2026/astronaut.json, the humanoid core build) acting the design sheet's three poses
// in a real room, built from the clip template with every house pick on, so Jonny judges the character as it would
// look in a clip. An engine/character test, not a posted clip: no reviews.
//   node storyboards/core-five/make-astronaut-new-here.mjs -> storyboards/core-five/core-astronaut-new-here.json
//
// THE BRIEF (the design bible's "capable, but new here")
//   Joke:        the Astronaut's first day: a hello rehearsed like a procedure.
//   Wants:       to belong.
//   Consequence: a tentative wave, a check of its own glove ("did that right?"), a look round the new hall.
//   Ending:      "my specialty": a confident point and a proud grin, close.
import { clip, write, SUB_STYLE } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

// the clip template's house picks (storyboards/templates/clip-template.mjs, Jonny's decisions to 5 Nov)
const LOOK = "sheet", MOTION = { feet: 2 }, RIG = { hand: 2, eyes: 2 }, LIGHTING = 2;
const MUSIC = { style: "warm", lowCut: 150, gain: 0.3 };
const LINES = { sub: true, blink: false };

const c = clip({ faces: "strong", lines: LINES }), { A, see } = c;
const END = 12.4, W = "ast";
const HOME = [0, 0.1], SPOT = [0.36, 0.4];
const CAM = [-0.05, 0.86, 4.5];   // eye targets: + right on screen, + up

const cast = [{ id: W, character: "core-five-2026/astronaut", at: HOME, face: "camera", expr: "eager", follow: 0, seed: 1.3 }];

// ---------------------------------------------------------------- 1 NEW HERE 0-2.4: a hello, rehearsed
// frame 0 is mid-gesture: the hand already half up beside the chest, eyes on us, hopeful (the clean start: dur 0.01)
A(0, W, "arm", { side: "R", pose: { o: [0.1, 0.92, 0.2] }, dur: 0.01 });
A(0, W, "look", { to: [0, 0], dur: 0.01, blink: false });
A(0, W, "expr", { expr: "eager", set: { tilt: 0.36, curve: 0.45 }, dur: 0.01 });
// the subtitles sit beside the head (x, y px), clear of the body: under it they hid behind the suit (caption-overlap)
c.say(0.05, W, "h-hi!", 0.5, "excited", { voice: false, pos: 640, style: { ...SUB_STYLE, x: 790 } });
// a held breath, then the wave: the hand up beside the dome (never inside it), three small waggles
c.still(0.1, W, 0.35, 0.3);
A(0.55, W, "arm", { side: "R", pose: { o: [0.2, 1.3, 0.14] }, dur: 0.28 });
A(0.6, W, "expr", { expr: "happy", dur: 0.3 });
[0.85, 1.05, 1.25, 1.45].forEach((t, i) => A(t, W, "arm", { side: "R", pose: { o: [i % 2 ? 0.2 : 0.3, i % 2 ? 1.3 : 1.24, 0.14] }, dur: 0.2 }));
see(0, 2.4, [`${W}.face`], "the hopeful face and the wave");

// ---------------------------------------------------------------- 2 DID THAT RIGHT? 2.4-3.6: the glove gets checked
act.eyesLead(c, 1.75, W, [-0.35, -0.45]);
A(1.8, W, "arm", { side: "R", pose: { o: [-0.02, 0.62, 0.3] }, dur: 0.45 });
A(2.1, W, "expr", { expr: "kind", set: { tilt: 0.34, curve: 0.75, eye: 0.9 }, dur: 0.35 });
A(2.95, W, "look", { to: [0, 0], dur: 0.2 });
A(3.0, W, "expr", { expr: "happy", set: { curve: 0.85 }, dur: 0.3 });
A(3.05, W, "arm", { side: "R", pose: "rest", dur: 0.5 });
see(2.0, 2.9, [`${W}.face`], "eyes on the glove");

// ---------------------------------------------------------------- 3 NEW PLACE 3.6-7.4: a slow look round the hall
// a full turn in four steps, eyes first, so the dome, the backpack and the one hose show from every side
[90, 180, 270, 360].forEach((to, i) => { const t = 3.6 + i * 0.95; A(t, W, "turn", { to, dur: 0.8 }); });
A(3.5, W, "expr", { expr: "eager", set: { eye: 1.1 }, dur: 0.3 });

// ---------------------------------------------------------------- 4 STEPS 7.4-9.4: a few planted steps to a new spot
A(7.4, W, "look", { to: [0.8, 0], dur: 0.15, blink: false });
A(7.5, W, "turn", { to: "right", dur: 0.5 });
A(7.95, W, "move", { to: SPOT, dur: 1.0, steps: 2 });
A(9.0, W, "turn", { to: "camera", dur: 0.5 });
A(9.05, W, "look", { to: [0, 0], dur: 0.15 });

// ---------------------------------------------------------------- 5 MY SPECIALTY 9.6-12.4: a confident point, close
A(9.6, W, "expr", { expr: "focused", set: { tilt: -0.12, curve: 0.55, eye: 1.0 }, dur: 0.3 });
act.eyesLead(c, 9.62, W, [-0.6, 0.05]);
A(9.75, W, "arm", { side: "R", pose: "point", dur: 0.35 });
c.say(10.1, W, "mm-hm!", 0.5, "excited", { voice: false, pos: 560, style: { ...SUB_STYLE, x: 240 } });
A(11.0, W, "look", { to: [0, 0], dur: 0.15 });
A(11.05, W, "arm", { side: "R", pose: "rest", dur: 0.45 });
A(11.1, W, "expr", { expr: "delighted", set: { eye: 1.05, open: 0.5 }, dur: 0.3 });   // the grin with the eyes open, on us
see(9.8, 12.3, [`${W}.face`], "the proud face");

// ---------------------------------------------------------------- shots: a still medium on the hall, a cut in on the
// point, a cut to the close-up on the grin (plain cameras: the core build's head sits higher than a potato's)
const MED = { pos: [0, 0.9, 4.6], look: [0, 0.78, 0], fov: 32 };
const MCU = { pos: [0.2, 0.98, 3.2], look: [0.2, 0.86, 0.3], fov: 32 };
const CLOSE = { pos: [0.36, 1.0, 2.75], look: [0.36, 0.95, 0.4], fov: 30 };
const beats = c.beats([
  ["new here", 0, MED, "hook"],
  ["did that right", 2.4, "keep"],
  ["new place", 3.6, "keep"],
  ["steps", 7.4, "keep"],
  ["my specialty", 9.77, MCU],
  ["proud", 11.12, CLOSE, "payoff"],
], END);

write(import.meta.url, {
  id: "core-astronaut-new-here",
  title: "Astronaut (Core Five): new here",
  idea: "Character test of the redesigned Astronaut acting its sheet poses in a real room (not a posted clip)",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true, motion: MOTION, rig: RIG,
  // the entry hall: a first day somewhere (the whole frame sharp: no depth of field)
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/entry-hall-golden.png", z: -2.3, center: [-0.2, 1.2], height: 4.2 }, lighting: LIGHTING },
  music: MUSIC,
  sound: { sfx: 0.6, ambience: 0.34, guard: true, surface: "wood" },
  hook: { show: [W], hint: 0, what: "the Astronaut's rehearsed hello" },
  creative: { length: [8, 20] },
  cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Generated by storyboards/core-five/make-astronaut-new-here.mjs (character test, no reviews).",
});
