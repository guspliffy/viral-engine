// THAT ONE FRIEND WITH TOO MUCH ENERGY AT 6 AM CAMPING (Too Much Energy, episode 3, 7 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-05-too-much-energy/03-camping-6am-ENGINE-PROMPT.md, series format
// 00-SERIES-FORMAT.md, Jonny's eight panels storyboards/03-camping-6am/storyboard-eight-panels.png (they win; PANELS.md here).
//   node storyboards/series/too-much-energy/03-camping-6am/make-camping.mjs -> camping.json
//
// THE BRIEF
//   Joke:        5:59 am at the lake, Reaper and the Wizard asleep in their bags in the tent door. Phoenix has been up
//                for an hour: he zips the door shut and open, open and shut, spreads his glowing wings in the door like
//                a sunrise, and when that fails he tows both bags out by their feet and the tent folds down behind them.
//                He grins. Then the real sun comes up over the lake, so beautiful that even Reaper nods.
//   Wants:       Phoenix wants them to see the sunrise; they want to sleep.
//   Consequence: the tent lies flat, both friends out on the wet grass in their bags.
//   Ending:      Phoenix wins this one: the sunrise, the Wizard's "…oh.", Reaper's tiny nod. "Again tomorrow?" and both
//                heads drop back to sleep. Hard cut at 10.0.
//   Callback:    0 s they sleep in the tent while he jumps; 10 s they sleep on the grass while he beams at the sun.
//
// Places (x right, z toward the camera). The ridge tent's middle at z -1.4, its door at z -0.35 facing us. Reaper's
// bag (left, x -0.45) and the Wizard's (right, x 0.45) inside, their foot ends at the door. Phoenix in front. The lake
// and the hills are a painted plate behind (blue dawn, then the sunrise on the cut at 8.5 s).
import { clip, write } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
const r3 = (x) => Math.round(x * 1000) / 1000;
// the brief's times are video times; two 3-frame hit-stops (4.6 and 6.3) each add 0.1 s, so the storyboard runs 9.8
const STOP1 = 4.6, STOP2 = 6.2;   // storyboard times of the two hit-stops (video 4.6 and 6.3)
const V = (t) => r3(t - (t > STOP1 + 1e-6 ? 0.1 : 0) - (t > STOP2 + 0.1 + 1e-6 ? 0.1 : 0));   // video time -> storyboard time
const END = 9.8;
const SUB_LO = 500, SUB = 470;

// ---------------------------------------------------------------- the camp
const TZ = -1.4, TD = 2.1, DOOR = r3(TZ + TD / 2);      // the tent (props-camp.js TENT_DIM: 3.0 wide, 2.1 deep, 1.9 high)
const BAG_LEN = 0.95;   // props-camp.js BAG_LEN (its foot grip)
const BAG = { rea: [-0.5, -1.02], wiz: [0.5, -1.17] };   // where each sitter sits; the foot ends reach the door
const SITY = 0.0;                                          // the sitter's body over its bag's origin
const RECLINE = 26;
const DRAG = 1.6;                                          // how far he tows them out
const cast = [
  { id: "phx", character: "duo/phoenix", at: [0, 1.9], face: 0, expr: "eager", follow: 0.35, seed: 1.7, span: 0.5 },
  { id: "rea", character: "notyet/reaper-noscythe", at: BAG.rea, face: 0, expr: "deadpan", follow: 0.15, seed: 4.1 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: BAG.wiz, face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
];
const STOOL = [1.28, 0.8];   // right of the door (the panels have it left: mirrored so the grin and the sunrise keep it in view)
const CORD_TIE = [0.33, 0.35, -0.15];   // the cord's tie on the Wizard's bag (its outer side, behind him), in the bag's frame
const PEGS = [[-1.5, r3(DOOR + 0.02)], [1.5, r3(DOOR + 0.02)], [-1.9, r3(DOOR + 0.3)], [1.9, r3(DOOR + 0.3)], [-1.5, r3(TZ - TD / 2 - 0.02)], [1.5, r3(TZ - TD / 2 - 0.02)]];
const LANTERN_UP = [0, 1.94, r3(DOOR - 0.55)], LANTERN_DOWN = [0.95, 0.09, r3(DOOR + 0.15)];
const props = [
  { id: "tent", kind: "ridgetent", x: 0, z: TZ, open: 0.6, lit: 1, ropes: [[-1.9, 0.02, r3(TD / 2 + 0.3)], [1.9, 0.02, r3(TD / 2 + 0.3)]] },
  { id: "bagR", kind: "sleepbag", x: BAG.rea[0], y: 0, z: BAG.rea[1], color: "#2b2a33", len: BAG_LEN, recline: RECLINE },
  { id: "bagW", kind: "sleepbag", x: BAG.wiz[0], y: 0, z: BAG.wiz[1], color: "#2d4f9e", len: BAG_LEN, recline: RECLINE },
  { id: "cord", kind: "tentcord", x: r3(BAG.wiz[0] + CORD_TIE[0]), y: CORD_TIE[1], z: r3(BAG.wiz[1] + CORD_TIE[2]), a0: [LANTERN_UP[0], r3(LANTERN_UP[1] - 0.08), LANTERN_UP[2]], a1: LANTERN_DOWN, len: 1.9,
    staged: "the lantern's cord runs from the roof loop down to the Wizard's bag, tied round it (the cause of the collapse)" },
  { id: "pillow", kind: "pillow", x: 0.95, y: 0.08, z: -1.3, rot: 10, body: { density: 40, bounce: 0.3 } },
  { id: "stool", kind: "stool", x: STOOL[0], z: STOOL[1], rot: -15 },
  { id: "clock", kind: "campclock", x: STOOL[0], y: 0.42, z: STOOL[1], rot: -20, scale: 2.1 },
  ...PEGS.map(([x, z], i) => ({ id: `peg${i}`, kind: "tentpeg", x, y: 0, z, sink: 0.55, body: { density: 300, bounce: 0.2 } })),
  { id: "lampglow", kind: "cinemaglow", x: 0, y: 1.4, z: -1.2, color: "#ffb860", size: 2, peak: 0.6, glow: 0.6 },   // the lantern's warm pool on the sleepers (panel 01)
  { id: "glow", kind: "cinemaglow", x: 0, y: 0.8, z: 1.9, color: "#ffa23a", size: 2.4, peak: 0.6, glow: 0.12 },
  { id: "sunglow", kind: "cinemaglow", x: 3.2, y: 1.9, z: -6.9, color: "#ffc760", size: 2.4, peak: 0.6, glow: 0 },   // on the painted sun, all of it above the ground (the floor hides what dips under)
  { id: "sun", kind: "camplight", x: 3, y: 3.5, z: -6, color: "#ffc070", power: 0, dist: 40 },
  { id: "fill", kind: "camplight", x: 1.2, y: 2.2, z: 4.5, color: "#ffd59a", power: 0, dist: 14 },
];
// the cord's tie on the Wizard's bag, in the bag's frame (it rides on the bag as the bag slides)

// ---------------------------------------------------------------- everyone in place from frame 0
for (const [who, bag] of [["rea", "bagR"], ["wiz", "bagW"]]) {
  A(0, who, "ride", { prop: bag, off: [0, SITY, 0], yaw: 0, sit: true, dur: 0 });
  A(0, who, "pitch", { to: -RECLINE, dur: 0.01 });
  A(0, who, "face", { lid: 1, dur: 0.01 });
  A(0, who, "noblink");
  c.arm(0, who, "R", { o: [-0.12, 0.32, 0.22] }, 0.01); c.arm(0, who, "L", { o: [-0.12, 0.32, 0.22] }, 0.01);   // inside the bag
}
A(0, "rea", "expr", { expr: "deadpan", set: { open: 0, curve: -0.05 }, dur: 0.01 });
A(0, "wiz", "expr", { expr: "kind", set: { open: 0.05, curve: 0.1 }, dur: 0.01 });
c.prop(0, "bagR", { cover: 0.12 }, 0.01); c.prop(0, "bagW", { cover: 0.05 }, 0.01);
c.prop(0, "tent", { open: 0.6, fall: 0, lit: 1 }, 0.01);
c.prop(0, "clock", { time: 0, lit: 0.5 }, 0.01);   // the display glows in the blue dawn (panel 01)
c.prop(0, "cord", { fall: 0 }, 0.01);
for (const t of [0, 0.75]) c.at(t, { fx: "zzz", who: "wiz", dur: 0.9, count: 3 });

// ---------------------------------------------------------------- 01 ALREADY TOO MUCH 0-1.5: star jumps
A(0, "phx", "charge", { to: 0.15, dur: 0.01 });
A(0, "phx", "look", { to: [0, 0.1], dur: 0.01, blink: false });
A(0, "phx", "noblink");
A(0, "phx", "expr", { expr: "delighted", set: { curve: 0.95, open: 0.8, eye: 1.2 }, dur: 0.01 });
const JUMPS = [0.04, 0.5, 0.96];
const UPV = { R: { o: [0.3, 0.95, 0.1] }, L: { o: [0.3, 0.95, 0.1] } }, DOWNV = { R: { o: [0.28, 0.3, 0.08] }, L: { o: [0.28, 0.3, 0.08] } };
c.arm(0, "phx", "R", UPV.R, 0.01); c.arm(0, "phx", "L", UPV.L, 0.01);
for (const t of JUMPS) {
  A(t, "phx", "hop", { height: 0.2, dur: 0.38 });
  A(t, "phx", "wings", { to: 1, dur: 0.12, ease: "out" }); A(r3(t + 0.2), "phx", "wings", { to: 0.4, dur: 0.18 });
  c.arm(r3(t + 0.1), "phx", "R", UPV.R, 0.12, "out"); c.arm(r3(t + 0.1), "phx", "L", UPV.L, 0.12, "out");
  c.arm(r3(t + 0.3), "phx", "R", DOWNV.R, 0.14, "inOut"); c.arm(r3(t + 0.3), "phx", "L", DOWNV.L, 0.14, "inOut");
}
act.opener(c, "phx", "Good MORNIIING!", { at: 0,   // reach rules v2 B2: the first sound at 0.0 is his voice on the trouble
  dur: 1.1, pos: SUB_LO });
see(0, 1.4, ["phx.face", "rea.face", "wiz.face", "tent", "clock"], "frame 0: two friends asleep in the tent door at 05:59 while Phoenix does star jumps in front");

// ---------------------------------------------------------------- 02 THE ZIP 1.5-3.3
const ZIP_AT = [-0.15, 0.2];   // where he stands: left of the door's seam, turned to it
A(1.0, "phx", "look", { to: [-0.2, 0.3], dur: 0.12, blink: false });   // eyes to the door first
A(1.12, "phx", "move", { to: ZIP_AT, dur: 0.38 });   // a dash to the door, under the cut
A(1.3, "phx", "turn", { to: 35, dur: 0.2 });
A(1.4, "phx", "look", { to: [0.5, 0.15], dur: 0.12, blink: false });
c.arm(1.4, "phx", "R", { o: [0.22, 0.4, 0.12] }, 0.2, "inOut");
const ZIPG = { prop: "tent", part: "zip", grip: [0, 0, 0.08], palm: true };   // on the outside of the flap
c.arm(1.5, "phx", "L", ZIPG, 0.15, "out");
// down and up, faster and faster: shut over their faces, open again (open 0.6 the slider at his shoulder, 0.2 low)
const ZIPS = [[1.62, 0.2, 0.17], [1.8, 0.6, 0.17], [1.98, 0.2, 0.14], [2.13, 0.6, 0.14], [2.28, 0.2, 0.11], [2.4, 0.6, 0.11], [2.52, 0.2, 0.09], [2.62, 0.6, 0.09]];
for (const [t, to, d] of ZIPS) {
  c.prop(t, "tent", { open: to }, d, "inOut");
  sfx(t, "zip", { gain: 0.65, dur: d, reason: to < 0.4 ? "the tent zip pulled down: zzzip" : "the tent zip pulled up: zzzip" });
  A(t, "phx", "crouch", { to: to < 0.4 ? 0.6 : 0, dur: d });
}
A(1.65, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.6, eye: 1.15 }, dur: 0.12 });
A(2.2, "phx", "charge", { to: 0.35, dur: 0.15 });
sfx(2.2, "ai/flare", { gain: 0.3, reason: "the energy meter up one size: his crest flares" });
// the Wizard's eyes snap open: "It's SIX!"
A(2.72, "wiz", "face", { lid: 0.2, dur: 0.06 });
act.mood(c, 2.74, "wiz", "angry", { hold: 1.0, lid: 0.4, word: "grr" });   // review B: a squint, not round surprised eyes
A(2.74, "wiz", "look", { to: [-0.5, 0.05], dur: 0.1, blink: false });
c.say(2.8, "wiz", "It's SIX!", 0.45, "angry", { pos: SUB, sub: "It's SIX!" });
A(2.9, "phx", "look", { to: [0.3, -0.1], dur: 0.12, blink: false });
see(1.6, 3.2, ["phx.face", "tent", "wiz.face"], "the zip: he zips the door shut over their faces and open again, faster; the Wizard wakes, furious");

// ---------------------------------------------------------------- 03 THE SUNRISE 3.3-5.3
const DOOR_AT = [-0.35, 0.45];   // panel 03: in the door in front of Reaper's covered bag, the Wizard clear on his left (screen right)
c.arm(3.25, "phx", "L", { o: [0.22, 0.4, 0.12] }, 0.15, "inOut");
A(3.28, "phx", "move", { to: DOOR_AT, dur: 0.2 });
A(3.28, "phx", "turn", { to: 0, dur: 0.2 });
A(3.32, "phx", "look", { to: [0, 0.15], dur: 0.12, blink: false });
A(3.5, "phx", "wings", { to: 1, dur: 0.2, ease: "out" });
A(3.5, "phx", "span", { to: 1, dur: 0.25, ease: "out" });
A(3.5, "phx", "charge", { to: 0.6, dur: 0.2 });
c.arm(3.5, "phx", "R", { o: [0.3, 0.8, 0.28] }, 0.22, "out"); c.arm(3.5, "phx", "L", { o: [0.3, 0.8, 0.28] }, 0.22, "out");   // forward of the body: the glove clear of the Wizard's brim
c.prop(1.12, "glow", { glow: 0 }, 0.2); c.prop(3.4, "glow", { x: DOOR_AT[0], y: 0.85, z: r3(DOOR_AT[1] - 0.2) }, 0.01);
c.prop(3.5, "glow", { glow: 1 }, 0.25, "out");
sfx(3.5, "ai/flare", { gain: 0.4, reason: "the meter up again: his wings blaze open like a sunrise" });
A(3.6, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.9, eye: 1.25 }, dur: 0.15 });
c.say(3.8, "phx", "Sun's up!", 0.5, "excited", { pos: SUB, sub: "Sun's up!" });
// they screw their eyes shut against the light; the Wizard grabs his pillow and throws it
for (const id of ["rea", "wiz"]) A(3.6, id, "face", { lid: 1, dur: 0.12 });
act.mood(c, 3.6, "wiz", "angry", { hold: 1.0, lid: 1 });
A(3.82, "wiz", "look", { to: [0.4, -0.5], dur: 0.12, blink: false });   // eyes to the pillow first
c.arm(3.95, "wiz", "L", { prop: "pillow", grip: [0, 0.11, 0] }, 0.18, "inOut");   // beside him on his left, his throwing hand
A(4.15, "wiz", "face", { lid: 0.35, dur: 0.1 });
A(4.15, "wiz", "look", { to: [-0.5, 0.2], dur: 0.1, blink: false });
const CREST = [DOOR_AT[0], 1.28, DOOR_AT[1]];
// he flings it up off the floor in one swing of his arm (a grab and a wind-up made the pillow slip in the glove)
c.throw(4.3, "pillow", { to: [CREST[0] + 0.02, CREST[1], r3(CREST[2] + 0.12)], in: 0.3, spin: [2, 1, 0.3] });   // the front of his crest: it bounces off toward us and stays in frame
c.arm(4.28, "wiz", "L", { o: [-0.02, 0.85, 0.35] }, 0.12, "out");
c.arm(4.75, "wiz", "L", { o: [-0.12, 0.32, 0.22] }, 0.3, "inOut");
// the bonk on his crest (hit-stop), and he laughs: a game!
sfx(4.6, "ai/cushion-poof", { gain: 0.75, reason: "the pillow bonking off his crest: a soft flump" });
sfx(4.6, "slap", { gain: 0.3, reason: "the flump's cloth smack, so it carries on a phone" });
c.hitStop(STOP1);
A(4.6, "phx", "squash", { amount: 0.08, dur: 0.15 });
c.at(4.6, { fx: "sparkle", who: "phx", dur: 0.5, count: 2, color: "#ffffff" });   // two cartoon stars off the bonk
c.textPop(4.63, "phx", "bonk", { dur: 0.6, dx: -0.45, dy: -0.9 });   // up-left of the crest: the hit-stop shows the pillow on it
A(4.62, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 1, eye: 0.6 }, dur: 0.1 });
c.say(4.75, "phx", "ha-ha-ha!", 0.45, "excited", { pos: SUB, sub: "Ha-ha!" });
c.captions[c.captions.length - 1].to = 5.15;   // gone before the cut to the tow (review A)
// Reaper slowly pulls the whole bag over his head
c.prop(4.0, "bagR", { cover: 1 }, 0.9, "inOut");
sfx(4.0, "cloth", { gain: 0.3, reason: "Reaper's bag pulled up over his head" });
A(5.0, "phx", "wings", { to: 0.5, dur: 0.25 }); A(5.0, "phx", "span", { to: 0.6, dur: 0.3 });
c.arm(4.95, "phx", "R", { o: [0.25, 0.35, 0.1] }, 0.25, "inOut"); c.arm(4.95, "phx", "L", { o: [0.25, 0.35, 0.1] }, 0.25, "inOut");
c.prop(5.0, "glow", { glow: 0 }, 0.3);
see(3.5, 5.2, ["phx.face", "wiz.face", "pillow"], "the fake sunrise: his wings blaze in the door, the Wizard's pillow bonks off his crest");

// ---------------------------------------------------------------- 04 THE BREAK 5.3-7.3 (video): he tows both bags out
const GRAB = V(5.3), RUN0 = V(5.5), RUN1 = V(6.55), FALL0 = V(6.12), FALL = V(6.3);
A(GRAB, "phx", "move", { to: [0, r3(BAG.rea[1] + BAG_LEN + 0.32)], dur: 0.2 });   // a step back to the foot ends
A(GRAB, "phx", "look", { to: [0.25, -0.4], dur: 0.1, blink: false });
A(r3(GRAB + 0.1), "phx", "crouch", { to: 0.8, dur: 0.15 });
const FOOT = (bag) => ({ prop: bag, grip: "foot" });
c.arm(r3(GRAB + 0.05), "phx", "R", FOOT("bagR"), 0.2, "inOut"); c.arm(r3(GRAB + 0.05), "phx", "L", FOOT("bagW"), 0.2, "inOut");
A(r3(GRAB + 0.2), "phx", "look", { to: [0, 0.45], dur: 0.1, blink: false });   // up at us: the camera is high
A(r3(GRAB + 0.2), "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 1.2 }, dur: 0.12 });
A(RUN0, "phx", "crouch", { to: 0.3, dur: 0.15 });
A(RUN0, "phx", "charge", { to: 0.4, dur: 0.15 });   // a bigger aura buried the two faces behind him
A(RUN0, "phx", "wings", { to: 1, dur: 0.15, ease: "out" });
sfx(RUN0, "ai/flare", { gain: 0.45, reason: "the meter at its biggest as he sets off" });
A(RUN0, "phx", "move", { to: [0, r3(BAG.rea[1] + BAG_LEN + 0.32 + DRAG)], dur: r3(RUN1 - RUN0), steps: 3.2 });
A(RUN0, "phx", "lean", { to: 0, dur: 0.1 });
A(RUN0, "phx", "pitch", { to: 0, dur: 0.2 });   // upright: from the high camera a forward lean hid his face under his crest
for (const [bag, xz, d] of [["bagR", BAG.rea, 0.04], ["bagW", BAG.wiz, 0]]) {
  c.prop(r3(RUN0 + d), bag, { z: r3(xz[1] + DRAG), x: xz[0], y: -0.012 }, r3(RUN1 - RUN0), "inOut");
}
c.prop(r3(RUN0 + 0.04), "cord", { z: r3(BAG.wiz[1] + CORD_TIE[2] + DRAG), x: r3(BAG.wiz[0] + CORD_TIE[0]) }, r3(RUN1 - RUN0), "inOut");
for (const id of ["rea", "wiz"]) A(r3(RUN0 + 0.02), id, "squash", { amount: 0.05, dur: 0.15 });
// the jolt wakes them: Reaper's hood falls open on his deadpan face; the Wizard holds his hat, outraged
c.prop(r3(RUN0 + 0.05), "bagR", { cover: 0.12 }, 0.25, "out");   // right down: at 0.35 the rim hid his face for the rest of the break
A(r3(RUN0 + 0.1), "rea", "face", { lid: 0.55, dur: 0.2 });
A(r3(RUN0 + 0.05), "wiz", "face", { lid: 0.25, dur: 0.1 });
act.shock(c, r3(RUN0 + 0.05), "wiz", { open: 0.45, hold: 0.6 });
sfx(RUN0, "cloth", { gain: 0.45, dur: 0.9, reason: "the two sleeping bags swishing over the wet grass" });
// the cord goes taut, the pegs pop out one after another, the poles buckle and the tent folds down (hit-stop)
for (const [i, t] of [[1, 6.0], [3, 6.06], [0, 6.12], [2, 6.17]].map(([i, t]) => [i, V(t)])) {
  const [x, z] = PEGS[i];
  c.knock(t, `peg${i}`, { v: [r3(-x * 0.6), 2.2, 1.0], spin: [6, 2, 4] });
  sfx(t, "pop", { gain: 0.5, reason: "a tent peg popping out of the ground" });
}
c.prop(FALL0, "tent", { fall: 1 }, r3(FALL - FALL0 + 0.05), "in");
c.prop(FALL0, "cord", { fall: 1 }, r3(FALL - FALL0 + 0.05), "in");
c.prop(FALL0, "tent", { lit: 0.3 }, 0.3);
c.prop(r3(FALL0 - 0.05), "lampglow", { glow: 0 }, 0.2);
c.hitStop(FALL);
sfx(FALL, "thud-soft", { gain: 0.8, reason: "the tent poles folding and the cloth flopping down flat" });
sfx(r3(FALL + 0.02), "kenney/drop-leather", { gain: 0.6, reason: "the canvas landing on the grass: a soft flop" });
c.at(FALL, { fx: "shake", dur: 0.2, amp: 0.02 });
act.landDust(c, FALL, [0, 0.05, TZ], { color: "#c9d0c2", puffs: 18 });
// he stops; the bags slide on a little on the wet grass, and he lets go (his hands only rest on the foot ends: the
// bags move by their own tweens, so nothing is attached)
A(RUN1, "phx", "pitch", { to: 0, dur: 0.2 });
A(RUN1, "phx", "crouch", { to: 0, dur: 0.2 });
for (const [bag, xz, d] of [["bagR", BAG.rea, 0.04], ["bagW", BAG.wiz, 0]]) c.prop(r3(RUN1 + d), bag, { z: r3(xz[1] + DRAG + 0.12), rot: 0 }, 0.3, "out");
c.prop(r3(RUN1 + 0.04), "cord", { z: r3(BAG.wiz[1] + CORD_TIE[2] + DRAG + 0.12) }, 0.3, "out");
const PHX_END = [-1.5, r3(BAG.rea[1] + BAG_LEN + 0.32 + DRAG)];
A(r3(RUN1 - 0.05), "phx", "look", { to: [-0.4, 0], dur: 0.12, blink: false });
// he lets go, arms out low, and scampers sideways out of their way
A(r3(RUN1 + 0.08), "phx", "arm", { side: "R", pose: { o: [0.34, 0.3, 0.18] }, dur: 0.3, ease: "inOut", lead: false }); A(r3(RUN1 + 0.08), "phx", "arm", { side: "L", pose: { o: [0.34, 0.3, 0.18] }, dur: 0.3, ease: "inOut", lead: false });   // low and out, the palms down all the way
A(r3(RUN1 + 0.2), "phx", "move", { to: PHX_END, dur: 0.55 });   // a quick scamper (a hop with a glide tipped his body in single frames)
// the arms stay up through the landing; the grin block takes them from there
A(V(6.4), "phx", "charge", { to: 0.3, dur: 0.4 });
act.mood(c, V(6.7), "wiz", "annoyed", { hold: 0.8, lid: 0.55 });
see(V(5.6), V(7.2), ["phx.face", "wiz.face", "tent", "bagR", "bagW"], "the break: he tows them out by their feet, the cord pulls the lantern, the tent folds down flat behind them");

// ---------------------------------------------------------------- 05 THE GRIN 7.3-8.5 (the series block)
const G0 = V(7.15);   // review B: the cut lands as he leaves the frame (series grin 7.3, 0.15 s early)
A(r3(G0 - 0.01), "phx", "turn", { to: 5, dur: 0.01 });
A(r3(G0 - 0.01), "phx", "wings", { to: 0, dur: 0.01 });
A(G0, "phx", "look", { to: [0.55, 0.2], dur: 0.01, blink: false });
A(G0, "phx", "expr", { expr: "worried", set: { curve: -0.1, open: 0.1 }, dur: 0.01 });
c.arm(r3(G0 - 0.01), "phx", "R", "lap", 0.01); c.arm(r3(G0 - 0.01), "phx", "L", "lap", 0.01);
A(V(7.45), "phx", "turn", { to: -22, dur: 0.22, ease: "inOut" });   // to the camera at his front-left
A(V(7.45), "phx", "look", { to: [0.05, 0.05], dur: 0.15, blink: false });
A(V(7.7), "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 1.05 }, dur: 0.25 });
A(V(7.7), "phx", "face", { brow: 0.15, dur: 0.25 });
A(V(7.72), "phx", "squash", { amount: 0.025, dur: 0.25 });
A(V(7.62), "phx", "grip", { side: "R", shape: "thumb", dur: 0.15 });
c.arm(V(7.66), "phx", "R", { o: [0.08, 0.62, 0.32] }, 0.2, "settle");
c.arm(V(7.66), "phx", "L", { o: [0, 0.95, 0.08] }, 0.25, "inOut");
c.at(V(7.8), { fx: "sparkle", who: "phx", dur: 0.6, count: 2, color: "#fff2a8" });
sfx(V(7.8), "ting", { gain: 0.45, reason: "the series logo: one bright ting on the grin" });
A(V(7.8), "phx", "charge", { to: 0.75, dur: 0.1 }); A(V(7.95), "phx", "charge", { to: 0.6, dur: 0.3 });
A(V(7.9), "phx", "still", { dur: 0.55, idle: 0.04 });
see(V(7.7), V(8.45), ["phx.face"], "THE GRIN: thumb up, hand behind his head, the flat tent and the two bagged friends behind him");

// ---------------------------------------------------------------- 06 THE SUN 8.5-9.5
const S0 = V(8.5);
A(r3(S0 - 0.01), "phx", "turn", { to: -20, dur: 0.01 });
A(r3(S0 - 0.01), "phx", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
c.arm(r3(S0 - 0.01), "phx", "R", { o: [0.25, 0.35, 0.1] }, 0.01); c.arm(r3(S0 - 0.01), "phx", "L", { o: [0.25, 0.35, 0.1] }, 0.01);
// the clock beeps 06:00 and the sun clears the hills: gold light pours over the lake and over all three
c.prop(V(8.7), "clock", { time: 1, lit: 1 }, 0.02);
for (const t of [8.72, 8.84]) { c.prop(V(t + 0.06), "clock", { lit: 0.2 }, 0.04); c.prop(V(t + 0.1), "clock", { lit: 1 }, 0.02); }
sfx(V(8.7), "timer-beep", { gain: 0.45, dur: 0.3, reason: "the travel clock beeping 06:00" });
c.prop(S0, "sunglow", { glow: 0.5 }, 0.01);
c.prop(V(8.6), "sunglow", { glow: 1, y: 2.1 }, 0.5, "out");
c.prop(V(8.6), "sun", { glow: 1 }, 0.5, "out");
c.prop(V(8.6), "fill", { glow: 1 }, 0.5, "out");
c.at(V(8.8), { fx: "flash", peak: 0.12, dur: 0.6, color: "#ffd27a", sound: false });
sfx(V(8.8), "ai/warm-resolve", { gain: 0.5, reason: "the sunrise swell" });
// Phoenix points at it with both wings wide, beaming
A(V(8.62), "phx", "look", { to: [0.5, 0.4], dur: 0.12, blink: false });
A(V(8.65), "phx", "turn", { to: -35, dur: 0.25 });
c.arm(V(8.7), "phx", "R", { o: [0.3, 1.1, 0.12] }, 0.22, "out");   // up at the sun with his outer arm: the near arm crossed Reaper's face (review B)
A(V(8.7), "phx", "grip", { side: "R", shape: "point", dur: 0.12 });
A(V(8.7), "phx", "wings", { to: 1, dur: 0.2, ease: "out" }); A(V(8.7), "phx", "span", { to: 0.45, dur: 0.25, ease: "out" });
A(V(8.75), "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 1.2 }, dur: 0.15 });
// the Wizard's face comes up out of his bag, the frown melting: "…oh."
A(V(8.75), "wiz", "look", { to: [0.45, 0.35], dur: 0.15, blink: false });
A(V(8.8), "wiz", "pitch", { to: r3(-RECLINE - 4), dur: 0.3 });
A(V(8.85), "wiz", "expr", { expr: "kind", set: { curve: 0.2, open: 0.35, eye: 1.25, brow: 0 }, dur: 0.35 });
A(V(8.85), "wiz", "face", { lid: 0, dur: 0.2 });
c.say(V(8.95), "wiz", "…oh.", 0.4, "calm", { pos: SUB, sub: "…oh." });
// Reaper's face comes out of his hood, lit gold; after Phoenix turns back to the sun, one tiny nod
c.prop(V(8.75), "bagR", { cover: 0.15 }, 0.35, "inOut");
A(V(8.8), "rea", "look", { to: [0.45, 0.35], dur: 0.2, blink: false });
A(V(8.85), "rea", "face", { lid: 0.3, dur: 0.25 });
A(V(9.2), "rea", "pitch", { to: r3(-RECLINE + 14), dur: 0.14, ease: "inOut" });   // a nod that reads in the wide
A(V(9.33), "rea", "pitch", { to: -RECLINE, dur: 0.15, ease: "inOut" });
A(V(9.2), "rea", "expr", { expr: "deadpan", set: { curve: 0.15 }, dur: 0.2 });
see(V(8.6), V(9.45), ["phx.face", "wiz.face", "rea.face", "clock"], "the real sunrise: the clock beeps 06:00, the sun clears the hills, the Wizard's \"…oh.\", Reaper's tiny nod");

// ---------------------------------------------------------------- 07 AGAIN 9.5-10.0
A(V(9.5), "phx", "turn", { to: 0, dur: 0.18, ease: "out" });
A(V(9.5), "phx", "hop", { height: 0.12, dur: 0.25 });
A(V(9.5), "phx", "look", { to: [0.2, -0.15], dur: 0.1, blink: false });
A(V(9.5), "phx", "grip", { side: "R", shape: "relaxed", dur: 0.1 });
c.arm(V(9.5), "phx", "L", { o: [0.3, 0.7, 0.15] }, 0.15, "inOut"); c.arm(V(9.5), "phx", "R", { o: [0.3, 0.7, 0.15] }, 0.15, "inOut");
c.say(V(9.58), "phx", "AGAIN! tomorrow?", 0.55, "excited", { pos: SUB, sub: "AGAIN! Tomorrow?" });   // reach rules v2 B5: "AGAIN!" = Phoenix's fixed catchphrase (proposal, from ep 2's ending)
for (const id of ["rea", "wiz"]) { A(V(9.75), id, "pitch", { to: -32, dur: 0.15, ease: "in" }); A(V(9.75), id, "face", { lid: 1, dur: 0.12 }); }
A(V(9.75), "wiz", "expr", { expr: "kind", set: { curve: 0.2, open: 0 }, dur: 0.15 });   // asleep but pleased: the answer to frame 0's frown
sfx(V(9.85), "thud-soft", { gain: 0.35, reason: "both heads dropping back onto the grass at once" });
c.at(V(9.82), { fx: "zzz", who: "rea", dur: 0.6, count: 2 }); c.at(V(9.82), { fx: "zzz", who: "wiz", dur: 0.6, count: 2 });
see(V(9.6), V(9.95), ["phx.face", "rea", "wiz"], "\"Again tomorrow?\": both friends drop back asleep");

// ---------------------------------------------------------------- shots
const WIDE = { pos: [0, 3.0, 5.9], look: [0.15, 0.5, -0.4], fov: 46 };   // higher than the panels' eye level: Phoenix in front stays under their faces
const BREAK = { pos: [0.3, 4.3, 5.4], look: [0, 0.4, -0.4], fov: 50, to: { pos: [0.3, 3.5, 4.3], look: [0, 0.35, 0.2] }, dur: r3(FALL - V(5.3)) };   // review B: lower, so the door and both bag feet show under the roof; pushes in to the tent flattening   // review A: pushes in to the tent flattening, then the cut   // high, like panel 04: his crest stays under their faces while he tows them toward us   // wider and higher: the tow, the cord and the falling tent in one picture
const ZIP = { pos: [1.5, 1.4, 4.2], look: [-0.3, 0.8, -0.7], fov: 46 };   // holds the zip and panel 03 (him in the door, the Wizard throwing) in one set-up
// the series grin: his front-left, three-quarters, eye level; the bags and the flat tent behind him
const GRIN = { pos: [r3(PHX_END[0] - 1.5), 1.05, r3(PHX_END[1] + 2.6)], look: [r3(PHX_END[0] + 0.1), 0.7, PHX_END[1]], fov: 46 };   // 30 degrees round: wider and the painting's edge shows
const SUNW = { pos: [-1.7, 2.1, 6.4], look: [-0.15, 0.75, 0.4], fov: 52 };   // review B wanted the friends bigger: a medium from his side put Phoenix in front of them, so the wide is tighter instead   // from the left of the wide: Phoenix, both faces, the clock and the sun in one picture
// review B: no caption across a cut or over the next beat
for (const cp of c.captions) { if (cp.text === "Good MORNIIING!") cp.to = 1.48; if (cp.text === "Sun's up!") cp.to = 4.5; }
const beats = c.beats([
  ["01 already too much", 0, WIDE, "hook"],
  ["02 the zip", 1.5, ZIP],
  ["03 the sunrise", 3.3, ZIP, "escalation"],   // panel 03 is the same front-right medium as the zip: no cut, he steps into the door
  ["04 the break", V(5.3), BREAK, "payoff"],
  ["05 the grin", G0, GRIN, "reaction"],
  ["06 the sun", S0, SUNW, "reveal"],
], END);

write(import.meta.url, {
  id: "camping",
  title: "That one friend with too much energy at 6 am camping",
  idea: "Too Much Energy, episode 3: at 5:59 am Phoenix zips the tent door up and down, blazes his wings like a sunrise, and tows his two sleeping friends out by their feet so the tent folds down; then the real sun rises and even Reaper nods",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 8.2,
  set: { type: "plain", color: "#26325f", floor: "shadow", shadow: 0.15,   // light: at 0.35 the whole far meadow greyed under a line at the horizon in the sunrise
    para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/camp-dawn.png", z: -7, center: [0, -7.3], height: 40, depth: false, motion: false, dust: 0,
      swaps: [{ at: S0, src: "assets/plates/camp-sunrise.png" }] },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", key: 7, lowCut: 150, gain: 0.26, payoff: FALL, until: FALL },
  sound: { sfx: 0.7, ambience: 0, nature: [{ id: "birds", gain: 0.12 }, { id: "lake", gain: 0.08 }], surface: "grass", guard: true },
  hook: { show: ["phx", "rea", "wiz", "tent", "clock"], hint: 0.05, what: "Phoenix does star jumps yelling good morning in front of a tent where two friends sleep, the clock at 05:59" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "bagR", from: 0, to: 10, reason: "Reaper sits inside his sleeping bag" },
    { who: "wiz", with: "bagW", from: 0, to: 10, reason: "the Wizard sits inside his sleeping bag" },
    ...["phx", "rea", "wiz"].map((who) => ({ who, with: "glow", from: 0, to: 10, reason: "Phoenix's glow is light" })),
    ...["phx", "rea", "wiz"].map((who) => ({ who, with: "lampglow", from: 0, to: 10, reason: "the lantern's glow is light" })),
    ...["rea", "wiz"].map((who) => ({ who, with: "tent", from: 0, to: 10, checks: ["costume-in-prop"], reason: "the hood and the hat brush the soft tent cloth over them" })),
    { who: "phx", with: "tent", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his soft flame-feather wings brush the tent's cloth and guy ropes" },
    { who: "rea", with: "tent", from: 0, to: 6.3, reason: "Reaper sits inside the tent (the cloth is a hollow shell round him)" },
    { who: "wiz", with: "tent", from: 0, to: 6.3, reason: "the Wizard sits inside the tent (the cloth is a hollow shell round him)" },
    { who: "phx", with: "tent", from: 1.4, to: 5.4, reason: "he stands in the open doorway, under the front edge of the roof" },
    { who: "phx", with: "bagR", from: 1.5, to: 3.35, checks: ["costume-in-prop"], reason: "a wing tip brushes the soft foot of Reaper's sleeping bag while he zips (behind his body)" },
    { who: "wiz", with: "cord", from: 0, to: 10, reason: "the lantern cord is tied round his sleeping bag" },
    { who: "phx", from: r3(RUN1 + 0.1), to: r3(RUN1 + 0.4), checks: ["hand-turn"], reason: "his left glove turns palm-down as the arm swings out off the bag's foot end; in the 15 fps strip it reads as the arm opening, the glove a few pixels on a phone" },
    { who: "phx", from: r3(GRAB), to: r3(RUN1 + 0.1), checks: ["hand-turn"], reason: "both fists are on the foot ends behind him, under his body and wings from the high camera: the turns never show (15 fps strip of the tow)" },
    { who: "rea", with: "pillow", from: 4.55, to: 5.3, checks: ["costume-in-prop"], reason: "the soft pillow drops off Phoenix's crest onto Reaper's covered bag and squashes on it" },
  ],
  notes: "Generated by storyboards/series/too-much-energy/03-camping-6am/make-camping.mjs.",
});
