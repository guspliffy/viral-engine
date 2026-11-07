// Pebble walk-around showcase (Jonny 7 Nov 2026 16:56: "showcase me a video of pebble walking around", on the newest
// engine, in the potatoes' cartoon style, in the voice we chose). Built from storyboards/templates/clip-template.mjs.
//   node storyboards/pebble/make-pebble-walk.mjs -> storyboards/pebble/pebble-walk.json
//
// THE BRIEF
//   Joke:        none: a character showcase. Pebble strolls the meadow path at his own pace and enjoys it.
//   Wants:       Pebble wants nothing more than the walk itself.
//   Consequence: he stops for the view, wanders across the path, comes up to us and says one calm line.
//   Ending:      he turns and strolls on up the path, away from us (shell, moss and fern from behind).
//   Callback:    he walks into frame at 0 s and walks out of it at the end, unhurried both times.
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as peb from "./pebble-acting.mjs";

// the template's house picks (Jonny's decisions to 7 Nov). LOOK: the potato cast's hand-drawn sheet look with pencil
// hatching (Jonny 7 Nov 16:56: "pebble in the cartoon style we use for the potatoes"; replaces the clean cel of 6 Nov)
const FOCUS = false, LOOK = "sheet", FACES = "strong";
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const PHYSICS = true, LIGHTING = 2, HATCH = { boil: 0.25 };
// his line in the sky above the cap (his body fills the lower frame in the close shot)
const LINES = { sub: true, blink: false, pos: 230 };

const c = clip({ faces: FACES, lines: LINES }), { A, see } = c;
const W = "peb", END = 19.0;

// ---------------------------------------------------------------- places (meadow-path env; x right, z toward us)
const START = [-0.55, -3.3], STOP1 = [-0.1, -1.7], ACROSS = [-0.75, -1.5], NEAR = [-0.15, -0.35], AWAY = [-0.3, -1.8];
const cast = [{ id: W, character: "pebble/pebble", at: START, face: 18, expr: "kind", follow: 0.4, seed: 1.3 }];

// ---------------------------------------------------------------- 1 STROLL 0-3.5: frame 0 mid-walk, coming down the path
A(0, W, "look", { to: [0.15, 0], dur: 0, blink: false });
peb.walk(c, 0, W, STOP1, 3.4, { steps: 2.3 });
act.blinksAt(c, W, [1.6]);
see(0, 3.5, [`${W}.face`], "Pebble strolling down the meadow path toward us");

// ---------------------------------------------------------------- 2 THE VIEW 3.5-5.4: he stops, looks out over the meadow
act.eyesLead(c, 3.55, W, [-0.75, 0.15], { lead: 0.15, dur: 0.35 });
A(3.6, W, "turn", { to: -35, dur: 0.7 });
act.breath(c, 3.9, W, { big: 0.7, eyes: [-0.75, 0.2], back: [-0.75, 0.15] });
peb.contentBlink(c, 4.8, W, { hold: 0.45 });
see(3.6, 5.4, [`${W}.face`], "he stops and breathes in the view");

// ---------------------------------------------------------------- 3 ACROSS 5.6-8.9: he wanders across the path (profile)
act.eyesLead(c, 5.6, W, [-0.7, 0], { lead: 0.15, dur: 0.3 });
A(5.6, W, "turn", { to: -85, dur: 0.6 });
peb.walk(c, 6.0, W, ACROSS, 2.3, { steps: 2.4 });
see(6.0, 8.3, [W], "the walk from the side: shell, moss and fern");
// a glance back at us over his shoulder
A(8.2, W, "turn", { to: -40, dur: 0.6 });
peb.amusedGlance(c, 8.6, W, [0.35, 0.05], { hold: 0.6 });

// ---------------------------------------------------------------- 4 TO US 9.6-12.0: he comes up to the camera
act.eyesLead(c, 9.6, W, [0, 0], { lead: 0.15, dur: 0.3 });
peb.walk(c, 9.7, W, NEAR, 2.3, { steps: 2.4 });
A(11.5, W, "turn", { to: "camera", dur: 0.5 });
see(9.7, 12.0, [`${W}.face`], "he walks up to us");

// ---------------------------------------------------------------- 5 THE LINE 12.0-14.9: straw out, one calm line
peb.strawOut(c, 11.9, W, { low: { ...peb.STRAW_LOW, x: [0.22, 0.75, 0.3] } });
peb.line(c, 13.4, W, "Slow steps still get you there.", 1.9);
see(13.4, 15.3, [`${W}.face`], "his line");

// ---------------------------------------------------------------- 6 ON HE GOES 15.4-17.0: he turns and strolls on, away
peb.strawIn(c, 15.2, W);
A(15.6, W, "turn", { to: 175, dur: 0.7 });
act.eyesLead(c, 16.0, W, [0, 0.05], { lead: 0.15, dur: 0.3 });
peb.walk(c, 16.0, W, AWAY, 3.0, { steps: 2.3, rest: false });
see(15.6, 19.0, [W], "he strolls on up the path");

// ---------------------------------------------------------------- shots (meadow-path's camera range: qa/env.mjs --range)
const WIDE = { pos: [0, 1.05, 4.2], look: [0, 0.95, -1.6], fov: 34 };
// the view: a slow push in for his content blink (Fable review A), then the cut to the side
const VIEW = { ...WIDE, to: { look: [-0.1, 1.0, -1.7], fov: 28 }, dur: 2.0 };
// the exit: a touch higher and tilted down a little (higher slides the painted layers apart: qa/env.mjs)
const BACK = { pos: [0, 1.08, 4.2], look: [-0.05, 0.92, -2.0], fov: 34 };
const SIDE = { pos: [-0.1, 1.05, 3.9], look: [-0.38, 0.98, -1.3], fov: 38 };
const MCU = { pos: [-0.05, 1.1, 2.95], look: [-0.15, 1.0, -0.35], fov: 44 };
const beats = c.beats([
  ["stroll", 0, WIDE, "hook"],
  ["the view", 3.5, VIEW],
  ["across", 5.6, SIDE],
  ["to us", 9.6, "keep"],
  ["the line", 12.0, MCU, "payoff"],
  ["on he goes", 15.4, BACK],
], END);

write(import.meta.url, {
  id: "pebble-walk",
  title: "Pebble walk-around",
  idea: "Pebble character showcase: a stroll on the meadow path, one calm line (not a posted clip)",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true,
  ...(MOTION && { motion: MOTION }), ...(RIG && { rig: RIG }), ...(PHYSICS && { physics: true }),
  creative: { length: [8, 20] },
  set: { type: "env", env: "meadow-path", shade: "soft", aperture: FOCUS ? 0.045 : 0, focus: false, lighting: LIGHTING, hatch: HATCH },
  music: { pool: "calm-landscape", lowCut: 120, gain: 0.28 },
  sound: { sfx: 0.6, ambience: 0.34, guard: true, surface: "grass", nature: ["birds", { id: "leaves", gain: 0.1, pan: 0.3 }] },
  hook: { show: [W], hint: 0, what: "Pebble strolls down the path" },
  cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Generated by storyboards/pebble/make-pebble-walk.mjs (character showcase).",
});
