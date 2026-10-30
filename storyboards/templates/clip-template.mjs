// CLIP TEMPLATE: copy this file to storyboards/<topic>/make-<clip>.mjs, rename the id, and replace the example.
// The example is a real 8 s clip built only from the shared library (clip.mjs + acting.mjs), so the template always
// renders: node storyboards/templates/clip-template.mjs -> storyboards/templates/template-demo.json
//
// THE BRIEF (fill these four lines first; Fable's review A and Jonny judge the clip against them)
//   Joke:        Phoenix is so absorbed in his phone that the Wizard can't get noticed.
//   Wants:       the Wizard wants Phoenix to look up.
//   Consequence: Phoenix grins at a notification instead, never at him.
//   Ending:      the Wizard's defeated look to camera, then everyone back to frame 1 (a seamless loop).
//
// Order of work (CLAUDE.md): places and cast -> beats with acting loops -> shots -> `node qa/motion.mjs` and
// `render.mjs --layout` (contact gate) -> draft stills + Fable review A -> draft render -> full render.
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

// ---------------------------------------------------------------- the lab picks (Jonny, 30 Oct 2026): on for new clips
// Each is opt-in per storyboard (clips made before them don't change); set one to false to leave it out of a clip.
const OPENER = { who: "phx", line: "ooh, nice!", words: false };   // a lead's short line in the first 0.5 s (act.opener):
                                    // gibberish, or words: true for a real voice with a subtitle; false: none
const FOCUS = true;                 // depth of field (golden look): the room softens, focus follows who acts (set.focus)
const FACES = "strong";             // stronger faces and longer holds in the acting loops ("normal": as before)
// FORCE on a hit: act.windUp(c, t, who) before the big move, act.impact(c, t, victim) on the contact frame (two
// impact frames, shake, stars, a deep squash and recoil, then a 3-frame hit-stop: the picture holds, the sound
// stays on its picture), act.landDust(c, t, [x, z]) on the landing. This example has no hit.

const c = clip({ faces: FACES }), { A, sfx, cap } = c;
const END = 8.0;

// ---------------------------------------------------------------- places (the golden living room plate; x right, z toward us)
// keep characters a body-width apart (about 1.0 m centre to centre with the Wizard's hat brim)
const PHX = [-0.5, 0.06], WIZ0 = [0.62, 0.3], WIZ_NEAR = [0.45, 0.32];
const AT_PHONE = [0.03, -1], WIZ_AT_PHX = [-0.8, 0.12];   // eye targets: + right on screen, + up

const cast = [
  { id: "phx", character: "potatobrawl/phoenix", at: PHX, face: "camera", expr: "kind", follow: 0.3, seed: 1.7, span: 0,
    arms: { R: { x: [-0.11, 0.33, 0.44], palm: [0, 0.33, 0.44] }, L: { x: [0.11, 0.33, 0.44], palm: [0, 0.33, 0.44] } }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "halloween/wizard-host", at: WIZ0, face: "3q-left", expr: "kind", follow: 0.5, seed: 2.6 },
];
const props = [
  { id: "stool", kind: "stool", x: PHX[0], z: PHX[1] },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.9, z: 0.45, rot: 180, tip: -28, scale: 1.9, case: "#7cc4bd" },
];

// ---------------------------------------------------------------- 1 HOOK 0-2.0: the problem is on screen at frame 0
A(0, "phx", "sit", { seat: "stool", dur: 0.01, hands: "keep", feet: [0.38, 0.1] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0.01, blink: false });
A(0, "phx", "face", { lid: 0.42, dur: 0.01 });
act.blinksAt(c, "phx", [2.9, 6.6]);
act.scrollPhone(c, "phx", [0.1, 1.3, 2.6, 4.0, 5.2, 6.4]);
A(0, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.01, blink: false });
act.blinksAt(c, "wiz", [1.7, 3.95]);
cap(0, 2.6, "When your friend gets a new phone.", 250);
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });

// ---------------------------------------------------------------- 2 TRY 2.0-4.0: he steps in and waits to be seen
A(2.0, "wiz", "move", { to: WIZ_NEAR, dur: 0.45, ease: "inOut", steps: 1 });
act.checkOn(c, 2.6, "wiz", { at: WIZ_AT_PHX, back: WIZ_AT_PHX, hold: 1.0 });

// ---------------------------------------------------------------- 3 PAYOFF 4.0-5.6: Phoenix grins, at the phone
sfx(4.0, "notify", { gain: 0.3 });
act.grin(c, 4.1, "phx");
act.shock(c, 4.2, "wiz", { open: 0.18, eye: 1.2, curve: null, brow: 0.3, dur: 0.2, hold: 1.0 });

// ---------------------------------------------------------------- 4 REACTION 5.6-7.2, then the loop tail to 8.0
// reactions play at full strength: act.mood(c, t, who, "angry" | "annoyed", { word: "annoyed" }) lands a mood and
// can put a small emotion word over the head (act.emote) when a face alone won't carry it at phone size
act.defeated(c, 5.6, "wiz", { hold: 0.3, blink: false });   // strong faces hold it 0.3 s longer
act.backToStart(c, 7.2, END, cast.filter((m) => m.id === "wiz"), { wiz: WIZ_AT_PHX });

// ---------------------------------------------------------------- shots: [name, start, camera, kind?]
// The camera is directed from the story (engine/direct.mjs): leave the camera null and the beat's kind picks the shot
// (setup: medium on everyone, payoff: snap-in on its actor, reaction: close-up with a slow push, the loop tail: the
// opening shot again), framed from where the characters are, cut on action (onto a music beat when one is within
// two frames). Two more kinds: "insert" (the prop the beat is about fills the frame for 0.4-0.8 s; never in 0-3 s; give
// { size: "insert", on: "<prop id>", at: [x, y, z] } for the point on it) and "threat" (a low angle on who acts, once
// per clip), "chaos" (a dutch tilt). More by size: { size: "ots", who, over } over a shoulder, { size: "top", on }
// straight down on a prop, { size: "establishing", plate } a painted exterior for 0.5 s (never at frame 0).
// A size ("close", "mcu", "medium", "wide", "insert") or { size, who, push, angle: "low", roll } overrides it,
// "keep" holds the camera, and a plain { pos, look, fov } is used as it is. docs/STORYBOARD.md, "Directed camera".
const MED = { pos: [0.1, 0.97, 5.9], look: [0.1, 0.76, 0], fov: 36 };   // the master: its direction is every shot's
const beats = c.beats([
  ["hook", 0, null, "hook"],
  ["try", 2.0, null],
  ["payoff", 4.0, null, "payoff"],
  ["reaction", 5.6, { who: "wiz" }, "reaction"],
  ["back to the start", 7.2, null],
], END);

write(import.meta.url, {
  id: "template-demo",
  title: "Template demo",
  idea: "Built only from storyboards/lib (the clip template's example)",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  castLook: "golden",   // golden skin, bigger eyes (Jonny, 30 Oct; engine/load.mjs castLook)
  // a loop clip's idle rhythms (breathing, sway, blinks, wings, flames, plate leaves) turn a whole number of times over
  // the clip, so the replay starts with no jump (docs/STORYBOARD.md); drop it with loop: false
  loopIdle: true,
  // the warm living room the recent clips use (look C crisp, golden plate); FOCUS adds the look's depth of field
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 },
    aperture: FOCUS ? 0.045 : 0, ...(FOCUS && { focus: "acting" }) },
  music: false,
  direct: { master: MED },
  sound: { sfx: 0.6, ambience: 0.34 },
  // frame 0 shows every face the joke needs and the thing it's about, and trouble shows by 2 s (qa/hook.mjs)
  hook: { show: ["phx", "wiz", "phone"], hint: 0, what: "the Wizard stares at Phoenix, who only sees his phone" },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // contact a beat needs goes here, always with a reason (a window without one is ignored by the checks)
  allowClip: [{ who: "phx", with: "stool", from: 0, to: END, reason: "Phoenix sits on the stool (his legs rest over its edge)" }],
  notes: "Generated by storyboards/templates/clip-template.mjs.",
});
