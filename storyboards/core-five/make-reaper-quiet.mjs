// Core Five, Reaper test 1 (thread "Make videos with the Core Five characters", 5 Nov 2026): the redesigned Reaper
// (characters/core-five-2026/reaper.json, the humanoid core build the Astronaut proved) in a real room, built from the
// clip template with every house pick on, so Jonny judges the character as it would look in a clip. An
// engine/character test, not a posted clip: no reviews.
//   node storyboards/core-five/make-reaper-quiet.mjs -> storyboards/core-five/core-reaper-quiet.json
//
// THE BRIEF (the design bible's "the quiet friend who notices")
//   Joke:        low energy, still shows up: a quiet "mm." with the hands folded, then the Reaper notices something.
//   Wants:       peace and a safe circle of friends.
//   Consequence: gaze first, a small head turn, a look round the room (the hood and cloak from every side), a few steps.
//   Ending:      a useful hand held out ("here."), then a quiet smile that is an active change, close.
import { clip, write, SUB_STYLE } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

// the clip template's house picks (storyboards/templates/clip-template.mjs, Jonny's decisions to 5 Nov)
const LOOK = "sheet", MOTION = { feet: 2 }, RIG = { hand: 2, eyes: 2 }, LIGHTING = 2;
const MUSIC = { style: "warm", lowCut: 150, gain: 0.3 };
const LINES = { sub: true, blink: false };

const c = clip({ faces: "strong", lines: LINES }), { A, see } = c;
const END = 12.4, W = "rea";
const HOME = [0, 0.1], SPOT = [-0.34, 0.4];
const FOLD = { R: { o: [-0.16, 0.42, 0.31] }, L: { o: [-0.17, 0.4, 0.33] } };   // hands folded in front, out of the cloak's opening (the sheet)

const cast = [{ id: W, character: "core-five-2026/reaper", at: HOME, face: "camera", expr: "kind", follow: 0, seed: 2.1 }];

// ---------------------------------------------------------------- 1 QUIET 0-2.2: hands folded, a quiet "mm."
for (const s of ["R", "L"]) A(0, W, "arm", { side: s, pose: FOLD[s], dur: 0.01 });
A(0, W, "look", { to: [0.25, -0.1], dur: 0.01, blink: false });
A(0, W, "expr", { expr: "kind", set: { eye: 0.9, curve: 0.18 }, dur: 0.01 });
c.say(0.1, W, "mm.", 0.45, "calm", { voice: false, pos: 600, style: { ...SUB_STYLE, x: 780 } });
A(0.6, W, "look", { to: [0, 0], dur: 0.25 });
c.still(0.9, W, 0.5, 0.25);
see(0, 2.2, [`${W}.face`], "the calm face under the hood");

// ---------------------------------------------------------------- 2 NOTICES 1.5-3.6: gaze first, then the head
act.eyesLead(c, 1.5, W, [0.75, -0.35]);
A(1.6, W, "expr", { expr: "curious", set: { eye: 1.05 }, dur: 0.3 });
A(2.8, W, "look", { to: [0, 0], dur: 0.2 });
A(2.85, W, "expr", { expr: "kind", set: { eye: 0.95 }, dur: 0.3 });
see(1.6, 2.7, [`${W}.face`], "eyes on the thing it noticed");

// ---------------------------------------------------------------- 3 LOOK ROUND 3.6-7.4: hood and cloak from every side
[90, 180, 270, 360].forEach((to, i) => { const t = 3.6 + i * 0.95; A(t, W, "turn", { to, dur: 0.8 }); });
for (const s of ["R", "L"]) A(3.4, W, "arm", { side: s, pose: "rest", dur: 0.4 });

// ---------------------------------------------------------------- 4 STEPS 7.4-9.4: a few planted steps
A(7.4, W, "look", { to: [-0.8, 0], dur: 0.15, blink: false });
A(7.5, W, "turn", { to: "left", dur: 0.5 });
A(7.95, W, "move", { to: SPOT, dur: 1.0, steps: 2 });
A(9.0, W, "turn", { to: "camera", dur: 0.5 });
A(9.05, W, "look", { to: [0, 0], dur: 0.15 });

// ---------------------------------------------------------------- 5 HERE 9.5-12.4: a hand held out, then the smile
act.eyesLead(c, 9.45, W, [0.3, -0.2]);
A(9.6, W, "arm", { side: "L", pose: { o: [0.12, 0.5, 0.3] }, dur: 0.4 });
c.say(9.9, W, "here.", 0.45, "calm", { voice: false, pos: 360, style: { ...SUB_STYLE, x: 230 } });
A(10.8, W, "look", { to: [0, 0], dur: 0.2 });
A(10.9, W, "arm", { side: "L", pose: FOLD.L, dur: 0.45 });
A(10.9, W, "arm", { side: "R", pose: FOLD.R, dur: 0.45 });
A(11.2, W, "expr", { expr: "happy", set: { curve: 0.7, eye: 0.9, open: 0 }, dur: 0.35 });   // the quiet smile: an active change
see(9.8, 12.3, [`${W}.face`], "the quiet smile");

// ---------------------------------------------------------------- shots (plain cameras: the core head sits high)
const MED = { pos: [0, 0.88, 4.6], look: [0, 0.76, 0], fov: 32 };
const MCU = { pos: [-0.3, 0.95, 3.2], look: [-0.3, 0.84, 0.3], fov: 32 };
const CLOSE = { pos: [-0.34, 0.98, 2.75], look: [-0.34, 0.92, 0.4], fov: 30 };
const beats = c.beats([
  ["quiet", 0, MED, "hook"],
  ["notices", 1.5, "keep"],
  ["look round", 3.6, "keep"],
  ["steps", 7.4, "keep"],
  ["here", 9.6, MCU],
  ["smile", 11.12, CLOSE, "payoff"],
], END);

write(import.meta.url, {
  id: "core-reaper-quiet",
  title: "Reaper (Core Five): the quiet friend",
  idea: "Character test of the redesigned Reaper in a real room (not a posted clip)",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true, motion: MOTION, rig: RIG,
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/cream-room-blue.png", z: -2.3, center: [-0.2, 1.15], height: 3.9 }, lighting: LIGHTING },
  music: MUSIC,
  sound: { sfx: 0.6, ambience: 0.34, guard: true, surface: "wood" },
  hook: { show: [W], hint: 0, what: "the Reaper's quiet hello" },
  creative: { length: [8, 20] },
  cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Generated by storyboards/core-five/make-reaper-quiet.mjs (character test, no reviews).",
});
