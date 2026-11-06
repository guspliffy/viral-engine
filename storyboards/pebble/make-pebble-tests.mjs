// Pebble's three test scenes (Jonny's master brief, 5 Nov 2026; thread "Build Pebble the tortoise in the engine"):
// the engine build of Pebble (characters/pebble/pebble.json) in finished-looking renders, so Jonny judges the character
// as it would look in a clip. Engine/character tests, not posted clips: no reviews, no hook rules.
//   node storyboards/pebble/make-pebble-tests.mjs -> storyboards/pebble/pebble-{standing,tea,chaos}.json
//
//   1 STANDING  an unhurried natural walk up the meadow path (arms swinging, planted feet), a calm smile, a content blink, a look down the path (the shell, moss and
//               fern from the side and the back), one line: "No rush. The path will wait."
//   2 TEA       sitting on a mossy rock by the lake with his tea: a sip with the eyes closed, a look at the view, one line:
//               "Some days are just for tea."
//   3 CHAOS     the flat-pack instructions unfold up and up beside him and loose sheets fly: a small "oh", his eyes follow
//               the booklet up, an amused glance at us, a calm sip: "Hm. Tomorrow's problem."
// Every line is Pebble's real voice (Kokoro, engine/voice/voices.json "pebble"), subtitled low (the house rule).
import { clip, write, SUB_STYLE } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as grips from "../lib/grips.mjs";
import * as peb from "./pebble-acting.mjs";

// the clip template's house picks (storyboards/templates/clip-template.mjs, Jonny's decisions to 5 Nov): the sheet look,
// planted feet, hand rig 2 + eyes 2, light from the painting (halfway shade), half boil and no paper grain, music on
// Pebble's look is the sheets' clean cel (Jonny's fidelity spec, 6 Nov: "no prominent crosshatching", a cleaner storybook look)
const LOOK = "sheet-clean", MOTION = { feet: 2 }, RIG = { hand: 2, eyes: 2 }, LIGHTING = 2, HATCH = { boil: 0.25 };
// his subtitles sit in the sky above the cap: in these one-character shots he fills the lower frame, where the house
// position (1180 px) covered his vest (check: caption-overlap); every line shot keeps the fern under 380 px
const LINES = { sub: true, blink: false, pos: 230 };
const W = "peb", CH = "pebble/pebble";
const base = (o) => ({
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, sound: { sfx: 0.6, ambience: 0.34, guard: true, ...(o.surface && { surface: o.surface }) },
  creative: { length: [8, 20] }, hook: { show: [W], hint: 0, what: o.what },
});
const setOf = (plate, o = {}) => ({ type: "plain", color: o.color || "#e9dcc0", floor: o.floor || "#b99a6a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
  plate, lighting: LIGHTING, hatch: HATCH, ...(o.set || {}) });

// ================================================================ 1 STANDING
{
  const c = clip({ faces: "strong", lines: LINES }), { A, see } = c, END = 11.4;
  const START = [-0.55, -2.7], HOME = [0, -1.15];
  const cast = [{ id: W, character: CH, at: START, face: 20, expr: "kind", follow: 0.4, seed: 1.3 }];
  // 0-1.9: frame 0 is mid-walk, unhurried, up the path toward us (the walk started before the clip: the gait plans from
  // -0.6 s), arms swinging easily at his sides
  A(0, W, "look", { to: [0.2, 0], dur: 0, blink: false });
  peb.walk(c, 0, W, HOME, 3.2, { steps: 2.2 });
  A(2.5, W, "turn", { to: "camera", dur: 0.6 });
  see(0, 3.3, [`${W}.face`], "Pebble walking up the path");
  // 3.3-4.8: settles, a calm smile at us, a content blink
  A(3.25, W, "look", { to: [0, 0], dur: 0.3 });
  peb.calmSmile(c, 3.3, W);
  peb.contentBlink(c, 4.0, W);
  see(3.3, 4.8, [`${W}.face`], "the calm smile and the content blink");
  // 5.0-8.0: a look down the path: the shell, the moss and the fern from the side and from behind, and back
  act.eyesLead(c, 5.0, W, [-0.8, 0.05]);
  A(5.15, W, "turn", { to: -110, dur: 1.2 });
  A(7.0, W, "turn", { to: "camera", dur: 1.2 });
  A(7.9, W, "look", { to: [0, 0], dur: 0.3 });
  // 7.3-8.6: he takes the straw out of his mouth with his left hand before he speaks (Garden Guardian pack)
  peb.strawOut(c, 7.3, W);
  // 8.4-10.8: the line, then the amused glance and the smile
  peb.line(c, 8.4, W, "No rush. The path will wait.", 2.2);
  see(8.4, 10.6, [`${W}.face`], "his line");
  peb.amusedGlance(c, 10.4, W, [0.45, 0.05], { hold: 0.4 });
  const MED = { pos: [0, 1.0, 3.6], look: [0, 0.8, -1.15], fov: 38 }, MCU = { pos: [0.05, 1.45, 3.4], look: [0.02, 1.2, -1.1], fov: 34 };
  const beats = c.beats([["walk", 0, MED, "hook"], ["smile", 3.3, "keep"], ["look down the path", 5.0, "keep"], ["line", 8.3, MCU, "payoff"]], END);
  write(import.meta.url, {
    id: "pebble-standing", title: "Pebble test 1: standing", idea: "Pebble character test: walk, smile, turn, one line (not a posted clip)", ...base({ what: "Pebble walks up", surface: "dirt" }),
    set: { type: "env", env: "meadow-path", shade: "soft", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH },
    music: { style: "warm", lowCut: 150, gain: 0.28 }, cast, props: [], captions: c.captions, beats, visible: c.visible,
    notes: "Generated by storyboards/pebble/make-pebble-tests.mjs (character test, no reviews).",
  });
}

// ================================================================ 2 TEA
{
  const c = clip({ faces: "strong", lines: LINES }), { A, see } = c, END = 9.6;
  // he sits on the ground the way the sheet's SITTING (TEA) pose does: legs out in front, the shell resting behind him
  // (a rock seat made him look as if he stood: Jonny's fidelity spec, 6 Nov)
  const SEAT_H = 0.05;
  const REST = [0.14, 0.5, 0.5], SIP = [0.0, 0.6, 0.74];
  const MUG = { id: "mug", kind: "teamug", steam: 1, color: "#efe4cc", scale: 2.3, ...grips.placeFor("teamug", REST, 0) };
  const mug = grips.mug(c, W, MUG, { side: "R", height: 0.6 });
  const cast = [{ id: W, character: CH, at: [0, 0], face: -12, expr: "kind", follow: 0.3, seed: 2.2 }];
  // frame 0: already sitting, the mug coming up for a sip
  A(0, W, "sit", { height: SEAT_H, rot: -12, dur: 0, hands: "keep", feet: [0.34, 0.06] });
  A(0, W, "noblink");                     // placed blinks only: none lands on his line
  act.blinksAt(c, W, [3.7]);
  mug.secure(0, 0.01);
  peb.strawHeld(c, 0, W, { o: [-0.02, 0.2, 0.22] });   // the straw out of his mouth for tea, in his resting left hand
  A(0, W, "look", { to: [0, -0.1], dur: 0, blink: false });
  mug.carry(0.05, SIP, 0.6, "inOut", { tip: -18 });
  peb.contentBlink(c, 0.4, W, { hold: 0.9 });
  act.eyesLead(c, 1.57, W, [0.15, -0.4]);
  mug.carry(1.7, REST, 0.6);
  act.breath(c, 2.1, W, { big: 0.8 });
  see(0, 2.4, [`${W}.face`, "mug"], "Pebble sipping his tea");
  // 2.6-5.0: a look out over the valley, thoughtful, then back to us
  act.eyesLead(c, 2.6, W, [-0.75, 0.15]);
  A(3.0, W, "expr", { expr: "kind", dur: 0.5 });
  A(4.6, W, "look", { to: [0, 0], dur: 0.35 });
  peb.calmSmile(c, 4.8, W);
  // 5.1-7.6: the line
  peb.line(c, 5.2, W, "Some days are just for tea.", 2.0);
  see(5.2, 7.4, [`${W}.face`], "his line");
  // 7.6-9.6: the second sip, close
  act.eyesLead(c, 7.47, W, [0.05, -0.35]);
  mug.carry(7.6, SIP, 0.6, "inOut", { tip: -18 });
  peb.contentBlink(c, 7.9, W, { hold: 1.0 });
  const MED = { pos: [0.05, 1.0, 4.95], look: [-0.04, 0.65, 0], fov: 36 }, CLOSE = { pos: [-0.05, 1.0, 2.6], look: [-0.14, 0.76, 0.1], fov: 33 };
  const beats = c.beats([["sip", 0, MED, "hook"], ["the view", 2.6, "keep"], ["line", 5.1, "keep"], ["second sip", 7.5, CLOSE, "payoff"]], END);
  write(import.meta.url, {
    id: "pebble-tea", title: "Pebble test 2: sitting with tea", idea: "Pebble character test: sitting on a rock with tea (not a posted clip)", ...base({ what: "Pebble sips tea", surface: "dirt" }),
    set: { type: "env", env: "lakeside-campsite", shade: "soft", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH },
    music: { style: "warm", lowCut: 150, gain: 0.26 }, cast, props: [MUG], captions: c.captions, beats, visible: c.visible,
    notes: "Generated by storyboards/pebble/make-pebble-tests.mjs (character test, no reviews).",
  });
}

// ================================================================ 3 CHAOS
{
  const c = clip({ faces: "strong", lines: LINES }), { A, sfx, see } = c, END = 10.0;
  const HOME = [-0.4, 0.15];
  const REST = [-0.2, 0.62, 0.64], SIP = [-0.2, 0.86, 0.9];
  const MUG = { id: "mug", kind: "teamug", steam: 0.8, color: "#efe4cc", scale: 2.3, ...grips.placeFor("teamug", REST, 0) };
  const mug = grips.mug(c, W, MUG, { side: "R", height: 0.6 });
  const BOX = { id: "box", kind: "flatpack", x: 0.85, z: -0.2, pages: 22, unfold: 0 };
  const PAGES = { id: "pages", kind: "letters", x: 0.95, y: 0.3, z: -0.15, burst: 0, floor: 0.3, count: 14, spread: 0.6, up: 1.0, seed: 4 };
  const cast = [{ id: W, character: CH, at: HOME, face: "camera", expr: "kind", follow: 0.4, seed: 3.1 }];
  // frame 0: holding his tea; the booklet already starts to climb out of the box
  mug.secure(0, 0.01);
  peb.strawHeld(c, 0, W);   // tea time: the straw already out of his mouth, in his left hand (Garden Guardian pack)
  A(0, W, "look", { to: [0, 0], dur: 0.01, blink: false });
  c.prop(0, "box", { unfold: 0.05 }, 0.01);
  c.prop(0.05, "box", { unfold: 0.25 }, 1.0, "out");
  sfx(0.15, "book-flip", { gain: 0.5, reason: "the booklet's pages flapping open" });
  // 0.4: the pieces burst out: a small "oh", the tea jolts
  c.prop(0.4, "pages", { burst: 1 }, 2.6, "out");
  sfx(0.4, "flutter", { gain: 0.5, reason: "the flat-pack bits and papers flying out" });
  peb.surprisedOh(c, 0.45, W, { hold: 0.6, look: [0.6, 0.2] });
  mug.carry(0.45, [REST[0], REST[1] + 0.03, REST[2]], 0.12, "out");
  mug.carry(0.6, REST, 0.3);
  see(0, 2.0, [`${W}.face`, "box", "mug"], "the booklet climbing and Pebble's small oh");
  // 1.4-4.4: the booklet keeps unfolding up and up; his eyes follow it, the head tips back a little
  c.prop(1.3, "box", { unfold: 1 }, 3.4, "inOut");
  A(1.5, W, "look", { to: [0.55, 0.5], dur: 0.9 });
  A(2.6, W, "look", { to: [0.45, 0.95], dur: 1.2 });
  A(1.6, W, "expr", { expr: "kind", set: { curve: 0.3, eye: 1.05 }, dur: 0.5 });
  see(1.4, 4.4, [`${W}.face`, "box"], "the endless instructions");
  // 4.6-6.4: the amused glance at us, then a calm sip
  peb.amusedGlance(c, 4.6, W, [0, 0], { hold: 0.7 });
  mug.carry(5.8, SIP, 0.55, "inOut", { tip: -18 });
  peb.contentBlink(c, 6.05, W, { hold: 0.45 });
  act.eyesLead(c, 6.77, W, [-0.1, -0.4]);
  mug.carry(6.9, REST, 0.5);
  // 7.2-9.4: the line, then the smile
  peb.line(c, 7.3, W, "Hm. Tomorrow's problem.", 1.8);
  see(7.3, 9.2, [`${W}.face`], "his line");
  peb.calmSmile(c, 9.3, W);
  const WIDE = { pos: [0.15, 1.2, 7.0], look: [0.15, 1.05, 0], fov: 34 }, MCU = { pos: [-0.3, 1.3, 3.5], look: [-0.3, 1.12, 0.1], fov: 31 };
  const beats = c.beats([["oh", 0, WIDE, "hook"], ["up and up", 1.4, "keep"], ["glance", 4.6, MCU], ["line", 7.2, "keep", "payoff"]], END);
  write(import.meta.url, {
    id: "pebble-chaos", title: "Pebble test 3: reacting to chaos", idea: "Pebble character test: calm in chaos (not a posted clip)", ...base({ what: "the booklet climbs, Pebble stays calm", surface: "wood" }),
    set: setOf({ src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.5], height: 5.4 }, { floor: "#c9a27a" }),
    music: { style: "warm", lowCut: 150, gain: 0.26 }, cast, props: [BOX, PAGES, MUG], captions: c.captions, beats, visible: c.visible,
    notes: "Generated by storyboards/pebble/make-pebble-tests.mjs (character test, no reviews).",
  });
}
