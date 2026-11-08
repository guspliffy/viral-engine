// CLIP TEMPLATE: copy this file to storyboards/<topic>/make-<clip>.mjs, rename the id, and replace the example.
// The example is a real 8 s clip built only from the shared library (clip.mjs + acting.mjs), so the template always
// renders: node storyboards/templates/clip-template.mjs -> storyboards/templates/template-demo.json
//
// THE BRIEF (fill these four lines first; Fable's review A and Jonny judge the clip against them)
//   Joke:        Phoenix is so absorbed in his phone that the Wizard can't get noticed.
//   Wants:       the Wizard wants Phoenix to look up.
//   Consequence: Phoenix grins at a notification instead, never at him.
//   Ending:      the Wizard's defeated look to camera, then everyone back to frame 1 (a seamless loop).
//   Callback:    the end answers the opening with the same people and the opposite result (qa/REVIEW.md, story checks):
//                the Wizard wanted to be seen at 0 s and is still unseen at the end.
//
// Order of work (CLAUDE.md): places and cast -> beats with acting loops -> shots -> `node qa/motion.mjs` and
// `render.mjs --layout` (contact gate) -> draft stills + Fable review A -> draft render -> full render.
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

// ---------------------------------------------------------------- the lab picks (Jonny, 30 Oct 2026): on for new clips
// Each is opt-in per storyboard (clips made before them don't change); set one to false to leave it out of a clip.
const OPENER = { who: "phx", line: "ooh, nice!", words: false };   // a lead's short line in the first 0.5 s (act.opener),
                                    // subtitled (LINES): gibberish, or words: true for a real voice; false: none
// Jonny's decisions (quality plan item 5, 5 Nov 2026): the whole frame sharp, the "sheet" cast look, music on every
// clip, every line subtitled (gibberish too) and no blink on a line, the clip opening in its pose
const FOCUS = false;                // depth of field: off, the whole frame sharp (Jonny, 4 Nov); true: the room softens and
                                    // focus follows who acts (set.focus)
const LOOK = "sheet";               // the cast from Jonny's design sheets with pencil hatching (4 Nov; engine/load.mjs castLook)
const MUSIC = { style: "warm", lowCut: 150, gain: 0.3 };   // a bed from 0:00 (Jonny, 29 Oct: music on every video); pick
                                    // the style per clip (bounce, sneaky, warm, disco: engine/music.mjs); lowCut keeps it
                                    // off the phone speaker's mud; false: none
// lines (clip.mjs clip({ lines })): c.say and the opener subtitle every line, gibberish included, low at SUB_POS (y px,
// clear of the title Jonny adds at the top in the app), and no automatic blink lands on a line
const LINES = { sub: true, blink: false };
const FACES = "strong";             // stronger faces and longer holds in the acting loops ("normal": as before)
// natural motion (Jonny 31 Oct 2026, "way better"): walks with planted feet, arcs, body-led reaches, eyes-first turns,
// sit/stand weight (docs/STORYBOARD.md "motion"); { arcs: false } drops one part, false: today's motion
// planted feet (Jonny, 5 Nov, PR #117): every walk and run on one gait, a standing foot stays where it landed;
// { feet: 2 } also turns on every natural part ("feetTune": { lean, tip, body } scales the body if a tight dash fails
// a contact check)
// motion layer (Jonny, 6 Nov, PR #133): follow-through (hands drag behind the body, held props swing), timing (eases,
// weight shifts on holds, actors a frame or two apart) and the contact solver (hands pushed out of every body, up to
// 6 cm); report /mnt/project-files/engine/motion-layer-01/ten-clips.md
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
// hand rig 2 (Jonny, 5 Nov, PR #119): a forearm that never collapses, no palm switch inside a move, wrist limits, so
// hands don't pop; eyes 2 (Jonny, 5 Nov, PR #116): the iris stays inside the eye white and a look down reads as a look
// down, not a closing eye; null: the old rig
const RIG = { hand: 2, eyes: 2, hold: 2 };
// real physics (Jonny, 5 Nov 22:00: "physics should apply to every video, whenever physics are in action"): every
// let-go tumbles and lands (engine/page/physics.js), and falls, throws, knocks and zero-g go through c.drop, c.throw,
// c.knock and c.float, never a hand-tweened path (qa/support.mjs flags one). Holds 2 (RIG hold: 2, PR #132) gives the
// let-go its hand's pose and speed. false: tweens and holds 2's simple drop only
const PHYSICS = true;
// light from the painting (Jonny, 5 Nov, PR #126 "light 2 on"): the cast and props take the set painting's light and
// shadow colours, a key-side edge light and soft contact shading (engine/page/light.js, docs/STORYBOARD.md); a
// { v: 2, ... } block overrides key, colours, exposure, rimK or ao; false: as before
const LIGHTING = 2;
// pencil hatching that survives TikTok (Jonny, 5 Nov, "no grain + half boil"): the strokes redraw with half today's
// wiggle (face detail after a TikTok re-encode 0.917 -> 0.962 SSIM with the grain off). A clip that adds a "drawn"
// block keeps "paper": { "grain": 0 }: the grain turns to mush after TikTok's re-encode. null: as before
const HATCH = { boil: 0.25 };
// a living world (Jonny, 7 Nov, PR #164 + "apply it to all future videos and backgrounds"): on a painted outdoor set
// (set type "env") the wind runs through the grass and trees and is heard, clouds drift and their shadows cross the far
// hills, a few sparrows peck far behind the cast and fly off at the clip's big loud moment, butterflies by day
// (engine/shared/life-auto.mjs). Background life stays in the background. "storm": the same place on a stormy day.
// An indoor or plain set ignores it (this example's living room). false: a still painting
const LIFE = "auto";
// the anime look (Jonny, 8 Nov, PR #168 "both: shadows + snap timing"; research/anime-look-2026-11-07): CEL draws one
// hard shadow shape on every character and prop instead of a soft roll (the clean-egg curve on potato skin, flat tones,
// the pencil hatching kept in the shade; set "cel", docs/STORYBOARD.md "Anime look 01"); ANIME_TIMING snaps the
// characters into each key pose and holds it while the camera, set and effects stay on every frame, no motion blur
// ("animeTiming"). null / false: as before
const CEL = { at: 0.25 };
const ANIME_TIMING = true;
// ink + the anime grade (Jonny, 8 Nov, PR #174 "both on in the template"; from MEGA CLAWD): INK draws the outlines
// an even width in screen pixels (a bold silhouette, thinner lines on clothes and parts, darker ink, a little thinner
// far away; set "ink"); SATSUEI is anime compositing on the final picture: warm halation round the brightest lights, a
// soft diffusion glow, lavender shadows and warm highlights (set "satsuei"). docs/STORYBOARD.md "Anime look 02".
// null / false: as before
const INK = true;
const SATSUEI = true;
// FORCE on a hit: act.windUp(c, t, who) before the big move, act.impact(c, t, victim) on the contact frame (two
// impact frames, shake, stars, a deep squash and recoil, then a 3-frame hit-stop: the picture holds, the sound
// stays on its picture), act.landDust(c, t, [x, z]) on the landing. This example has no hit.
// SMALL GESTURES (Phase 3 study, 31 Oct 2026): act.breath, brushOff, rubHands, hipsSettle, tapFoot, thinkChin give a
// beat the habit a person would do for themselves; act.ma(c, payoff, [who, ...]) holds everyone still for the half
// second before the payoff (finish moves before it). docs/STORYBOARD.md, acting table.

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, cap, see } = c;
const END = 8.0;

// ---------------------------------------------------------------- places (the golden living room plate; x right, z toward us)
// keep characters a body-width apart (about 1.0 m centre to centre with the Wizard's hat brim)
const PHX = [-0.5, 0.06], WIZ0 = [0.62, 0.3], WIZ_NEAR = [0.5, 0.32];
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
// MUST BE VISIBLE: what each beat needs the viewer to see, checked from the layout before any render (qa/framing.mjs;
// render.mjs --layout prints a miss). "<id>.face" = eyes in frame, turned to us, nothing in front; "<id>" = the body
// or a prop in view
see(0, 2.0, ["phx.face", "wiz.face", "phone"], "the problem at frame 0: Phoenix on the phone, the Wizard watching");
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });

// ---------------------------------------------------------------- 2 TRY 2.0-4.0: he steps in and waits to be seen
A(2.0, "wiz", "move", { to: WIZ_NEAR, dur: 0.45, ease: "inOut", steps: 1 });
act.checkOn(c, 2.6, "wiz", { at: WIZ_AT_PHX, back: WIZ_AT_PHX, hold: 1.0 });
see(2.6, 3.6, ["wiz.face"], "the Wizard waits to be seen");

// ---------------------------------------------------------------- 3 PAYOFF 4.0-5.6: Phoenix grins, at the phone
sfx(4.0, "notify", { gain: 0.3 });
act.grin(c, 4.1, "phx");
act.shock(c, 4.2, "wiz", { open: 0.18, eye: 1.2, curve: null, brow: 0.3, dur: 0.2, hold: 1.0 });
see(4.1, 4.8, ["phx.face", "phone"], "Phoenix's grin is at the phone");

// ---------------------------------------------------------------- 4 REACTION 5.6-7.2, then the loop tail to 8.0
// reactions play at full strength: act.mood(c, t, who, "angry" | "annoyed", { word: "annoyed" }) lands a mood and
// can put a small emotion word over the head (act.emote) when a face alone won't carry it at phone size
act.defeated(c, 5.6, "wiz", { hold: 0.3, blink: false });   // strong faces hold it 0.3 s longer
see(5.8, 7.0, ["wiz.face"], "the Wizard's defeated look");
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
  castLook: LOOK,
  // the clip opens in its pose: the 0.01 s "start like this" moves at t = 0 are instant (engine/load.mjs cleanStart)
  cleanStart: true,
  ...(MOTION && { motion: MOTION }),
  ...(RIG && { rig: RIG }),
  ...(PHYSICS && { physics: true }),
  ...(ANIME_TIMING && { animeTiming: ANIME_TIMING }),
  // a loop clip's idle rhythms (breathing, sway, blinks, wings, flames, plate leaves) turn a whole number of times over
  // the clip, so the replay starts with no jump (docs/STORYBOARD.md); drop it with loop: false
  loopIdle: true,
  // the warm living room (look C crisp, golden plate); FOCUS adds the look's depth of field
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 },
    aperture: FOCUS ? 0.045 : 0, ...(FOCUS && { focus: "acting" }), ...(LIGHTING && { lighting: LIGHTING }), ...(HATCH && { hatch: HATCH }), ...(LIFE && { life: LIFE }), ...(CEL && { cel: CEL }), ...(INK && { ink: INK }), ...(SATSUEI && { satsuei: SATSUEI }) },
  music: MUSIC,
  direct: { master: MED },
  // the spike guard (Jonny, 5 Nov, PR #112): no effect jumps far out of the mix, a gentle limiter instead of
  // scaling the whole mix down by its loudest sample (engine/sfx/guard.mjs); a hit marked loud: true may stand out more
  sound: { sfx: 0.6, ambience: 0.34, guard: true },
  // frame 0 shows every face the joke needs and the thing it's about, and trouble shows by 2 s (qa/hook.mjs)
  hook: { show: ["phx", "wiz", "phone"], hint: 0, what: "the Wizard stares at Phoenix, who only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // contact a beat needs goes here, always with a reason (a window without one is ignored by the checks)
  allowClip: [{ who: "phx", with: "stool", from: 0, to: END, reason: "Phoenix sits on the stool (his legs rest over its edge)" }],
  notes: "Generated by storyboards/templates/clip-template.mjs.",
});
