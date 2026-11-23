// KID VS DAD 02 "We have food at home" (Jonny 22 Nov 2026: hook H1 + ending E1 22:32 Berlin; story spine 22:48-22:53;
// Tato = Spud as the kid 22:50-22:52; panel sheet OK 23:11).
//   node storyboards/series/kid-vs-dad/02-food-at-home/make-food-at-home.mjs -> food-at-home.json
// Outline v2: /mnt/project-files/videos/kid-vs-dad/02-food-at-home/OUTLINE.md. Design: DESIGN.md here (positions = section 8).
// Chain (story spine): SCENE the kid asks for burgers at a red light, the dad says the line; NAME + WEIRD RULE the war
// reporter: "Tato, age seven" and "whoever says it has to eat it"; STAKES the light turns green in a minute; TEASES the
// dad's stomach growls ("the engine"), he refuses the kid's own money, his eyes go to the sign, the house correspondent
// shows his dinner by the rule (one pickle, Tuesday rice) and he sweats; FORCED IN a cone blocks the road, the only way on is
// the drive-thru; he says the line to the speaker ("...Then why are you here?"); he cracks: one burger, for the drive;
// ENDING the kid says the line to him, flat. Cut on the dad frozen with the burger at his mouth.
// Counter: the kid draws one tally on the fogged window after each of the dad's four "We have food at home".
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";
import { laneXZ } from "../../../../engine/page/props-drivethru.js";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (node qa/lines.mjs kvd02-voice-probe.json), in LINES order
const DUR = [1.33, 1.71, 4.31, 2.78, 3.52, 4.55, 0.84, 1.69, 2.97, 0.95, 1.07, 1.69, 0.93, 0.58, 1.92, 2.79, 2.19, 3.59, 0.99,
  3.70, 2.45, 1.69, 1.07, 2.03, 1.19, 1.21];
// the pause before each line, plus the action beats between some lines (tally inserts, the growl, the fridge, the drive)
const TALLY = 1.15, GROWL = 1.1, FRIDGE = 0.9, GREEN = 1.4, DRIVE = 1.2, SILENCE = 1.3, PASS = 1.6, BITE = 0.5;
const GAP = [0.15, 0.2, 0.25 + TALLY, 0.3, 0.3, 0.35, 0.4, 0.3, 0.3 + TALLY + GROWL, 0.15, 0.45, 0.3, 0.3 + TALLY, 0.25, 0.35,
  0.35 + FRIDGE, 0.3, 0.35, 0.35, 0.4 + GREEN + DRIVE, 0.6, 0.35, 0.35 + TALLY, 0.25 + SILENCE, 0.3, 0.35 + PASS + BITE];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const cutAt = (i) => r3(T[i] - 0.05);
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);

// ---------------------------------------------------------------- places (DESIGN section 8; world origin = the red-light mark)
const KX = 200;                                   // the kitchen stands 200 m along x (prop kitchenroom), far from the street
const CAR_STOP = { pos: [0, 0, 0], yaw: 180 };
const SPEAK = laneXZ(3.6, 0), WIN = laneXZ(8.4, 0);
const REP_COVER = [1.95, 14.75], REP_WIN = [-1.80, -0.50], REP_LANE = [2.75, -2.6], REP_PLINTH = laneXZ(7.25, 1.80);
const MASH_AT = laneXZ(8.6, 1.92), POST_AT = laneXZ(4.6, 1.5), MENU_AT = laneXZ(4.3, 2.5);
const CHIP_AT = [r3(KX - 3.72), -0.92], FRIDGE_AT = [KX - 3.0, -1.90];
// car frame (x + = driver's side, +z forward)
const KID_MID = [-0.08, -0.95], KID_WIN = [-0.70, -0.95];
const SEATS = { drv: [0.55, 0.20, 0.24], pas: [-0.55, 0.20, 0.12] }, REAR = [-0.70, -0.08, 0.54];

// ---------------------------------------------------------------- the car (rig keys, world)
const K = [];
const key = (at, [x, z], yaw, steer = 0) => K.push({ at: r3(at), pos: [r3(x), 0, r3(z)], yaw: r3(yaw), steer });
const TG = r3(T[19] - DRIVE - 0.4 - 0.9);         // the light turns green
const TD = r3(TG + 0.7);                          // he pulls away
key(0, [0, 0], 180); key(TD, [0, 0], 180);
key(r3(TD + 1.5), [0, -3.6], 180, 0); key(r3(TD + 2.4), [0.38, -5.91], 157.5, 18); key(r3(TD + 3.2), laneXZ(0, 0), 135, 6);
key(r3(TD + 4.6), SPEAK, 135, 0);
const TW = r3(END_OF(23) + 0.25);                 // he rolls on to the window (on the reporter's cut)
key(TW, SPEAK, 135); key(r3(TW + 1.9), WIN, 135);

// ---------------------------------------------------------------- cast
const inCar = (id, character, at, o = {}) => ({ id, character, rig: "car", at, follow: 0.25, shadowFall: 0.001, ...o });
const cast = [
  inCar("wedge", "potatobrawl/wedge", [SEATS.drv[0], r3(SEATS.drv[1] + 0.03)], { face: 0, expr: "deadpan", seed: 2.9 }),
  inCar("spud", "potatobrawl/spud-kid", KID_MID, { face: 0, expr: "kind", seed: 4.1 }),
  inCar("spudW", "potatobrawl/spud-kid", KID_WIN, { y: 0.96, face: -90, expr: "sad", seed: 4.1 }),
  { id: "rep", character: "potatobrawl/reporter", at: REP_COVER, face: -4, follow: 0.3, seed: 131.3 },
  { id: "chip", character: "potatobrawl/chip-reporter", at: CHIP_AT, face: 25, expr: "shocked", follow: 0.3, seed: 1.7 },
  { id: "mash", character: "potatobrawl/mash-crew", at: MASH_AT, y: 0.5, face: 45, expr: "kind", follow: 0.3, seed: 3.7 },
];
const FACES = {
  reporting: { tilt: -0.08, browY: -0.02, curve: -0.05, smirk: 0, eye: 0.95, pupil: 1, open: 0, raise: 0 },
  asking: { eye: 1.15, browY: 0.03, curve: 0.35 }, hungry: { eye: 0.9, tilt: 0.3, curve: -0.3 }, coin: { eye: 1.15, curve: 0.4 },
  flat: { eye: 0.6, tilt: -0.05, browY: -0.02, curve: -0.05 }, shaken: { eye: 1.1, pupil: 0.75, tilt: 0.25, curve: -0.2 },
  confused: { eye: 1.05, tilt: 0.15, curve: -0.1 },
};

// a point near a body: [right, up, forward] in its own frame (yaw 0 faces +z)
const rel = (p, yaw, [dx, y, dz]) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + dx * Math.cos(a) + dz * Math.sin(a)), r3(y), r3(p[1] - dx * Math.sin(a) + dz * Math.cos(a))]; };
const butt = (f) => [f[0], r3(f[1] - 0.056), f[2]];
const MICPOSE = { cover: [-0.45, 0.62, 0.1], talk: [-0.5, 0.42, 0.3] };
const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", butt(rel(REP_COVER, -4, MICPOSE.cover)), -4) };
const CMIC = { id: "cmic", kind: "newsmic", scale: 0.8, lean: 20, ...grips.placeFor("newsmic", rel(CHIP_AT, 25, [-0.22, 0.30, 0.18]), 25) };
const BURGER_M_AT = laneXZ(8.6, 1.22);
const BURGER_M = { id: "burgerM", kind: "wrapburger", wrap: 1, x: r3(BURGER_M_AT[0]), y: 1.08, z: r3(BURGER_M_AT[1]), rot: 45 };
const BURGER_D = { id: "burgerD", kind: "wrapburger", wrap: 0.35, rig: "car", x: 0.55, y: 1.0, z: 0.5, rot: 180 };
const props = [
  { id: "place", kind: "drivethru", x: 0, y: 0, z: 0, rot: 0 },
  { id: "sign", kind: "burgersign", x: 2.05, y: 0, z: 13.6, rot: 0, lit: 1 },
  { id: "light", kind: "trafficlight", x: -1.75, y: 0.5, z: -3.0, rot: 0, go: 0 },
  { id: "cone", kind: "trafficcone", x: 0.1, y: 0, z: -9.6 },
  { id: "post", kind: "speakerpost", x: r3(POST_AT[0]), y: 0, z: r3(POST_AT[1]), rot: 225, talk: 0 },
  { id: "menu", kind: "menuboard", x: r3(MENU_AT[0]), y: 0, z: r3(MENU_AT[1]), rot: 225 },
  { id: "seat-drv", kind: "carseat", rig: "car", x: SEATS.drv[0], y: SEATS.drv[2], z: SEATS.drv[1], width: 0.60, color: "#3b3a44", trim: "#55525e" },
  { id: "seat-pas", kind: "carseat", rig: "car", x: SEATS.pas[0], y: SEATS.pas[2], z: SEATS.pas[1], width: 0.60, color: "#3b3a44", trim: "#55525e", head: false },
  ...REAR.map((x, i) => ({ id: `rear-${i}`, kind: "carseat", rig: "car", x, y: 0.40, z: -0.98, width: 0.62, head: false, back: 0.50, color: "#3b3a44", trim: "#55525e" })),
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.88, z: 0.63, tip: 34 },
  { id: "fog", kind: "fogglass", rig: "car", x: 0, y: 0, z: 0 },
  { id: "dome", kind: "cablight", rig: "car", x: 0, y: 1.94, z: -0.10, lit: 1 },
  { id: "sweat", kind: "sweatbead", wear: "wedge", x: 0.2, y: 0.80, z: 0.3, scale: 0 },
  { id: "kitchen", kind: "kitchenroom", x: KX, y: 0, z: 0, fridge: false, lamp: 0.2, time: 2.75 },
  { id: "fridge", kind: "openfridge", x: FRIDGE_AT[0], y: 0, z: FRIDGE_AT[1], rot: 0, open: 0, lit: 0 },
  { id: "coin", kind: "coin", scale: 0.7, rig: "car", x: -0.2, y: -3, z: -0.8 },
  MIC, CMIC, BURGER_M, BURGER_D,
];

// captions: upper third
const SUB = 300, SUB0 = 430;
const CAPTEXT = { 19: "He's entering the *drive-thru!*", 1: "We have *food at home.*", 2: "*Tato,* age seven, just asked for *burgers.*", 4: "Whoever says it... *has to eat it.*",
  5: "The light turns green in *one minute.*", 7: "We have *food at home.*", 9: "That was *the engine.*", 11: "We have *food at home.*",
  13: "*Food.*", 15: "There is *one pickle.*", 16: "And rice. *From Tuesday.*", 17: "Under the rule... this is *his dinner.*",
  18: "...That's *a meal.*", 21: "We have *food at home.*", 22: "...Then why are *you here?*", 23: "...One burger. *For the drive.*",
  25: "We have *food at home.*" };
const WHO = { 6: "spudW" }, CAPY = { 19: 262 };   // the wide: Mash in the window at 460, the car crosses the middle   // "But I'm hungry" is said at the glass
const say = (i, extra = {}) => {
  const [who0, line, tone, style, o = {}] = LINES[i]; const who = WHO[i] ?? who0;
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.0) - 0.23)));
  cap(T[i], to, CAPTEXT[i] ?? line, CAPY[i] ?? (i === 0 ? SUB0 : SUB), false, { size: 62 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const place = (t, who, at, yaw, y) => { const a = onCut(t); A(a, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(a, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };

// the mic in the reporter's right hand all film; Chip's small mic in his right hand all the kitchen
const gm = grips.mug(c, "rep", MIC, { side: "R" });
const gc = grips.mug(c, "chip", CMIC, { side: "R" });
let repAt = REP_COVER, repYaw = -4, repY = 0;
const mic = (t, pose, lean, dur = 0.35) => { const q = MICPOSE[pose]; gm.carry(r3(t), butt(rel(repAt, repYaw, [q[0], r3(q[1] + repY), q[2]])), dur); c.prop(r3(t), "mic", { lean }, dur, "inOut"); };
const repTo = (t, at, yaw, y, pose = "talk", lean = 35) => { place(t, "rep", at, yaw, y); repAt = at; repYaw = yaw; repY = y || 0; mic(onCut(t), pose, lean, 0.01); };

// the tally: an insert on the glass, the kid at the window mark draws one stroke (0.35 s)
let marks = 0;
const STROKE_Z = [-0.640, -0.585, -0.530, -0.475], STROKE_TOP = [1.47, 1.46, 1.475, 1.455];
const tally = (t) => {
  const i = marks; marks += 1;
  // finger to the top of the stroke, then down it; his window mark faces -x in the car (the glass 0.055 from his face)
  const top = [-0.95, STROKE_TOP[i], STROKE_Z[i]], bot = [-0.95, r3(STROKE_TOP[i] - 0.19), STROKE_Z[i]];
  arm(r3(t + 0.05), "spudW", "L", { prop: "fog", grip: top, point: "pinch" }, 0.25, "out"); grip(r3(t + 0.05), "spudW", "L", "point", 0.15);
  arm(r3(t + 0.35), "spudW", "L", { prop: "fog", grip: bot, point: "pinch" }, 0.35, "linear");
  c.prop(r3(t + 0.35), "fog", { marks: marks }, 0.35, "linear");
  sfx(r3(t + 0.35), "ai/fingertip-catch", { gain: 0.12 });
  arm(r3(t + 0.8), "spudW", "L", "rest", 0.3);
  return r3(t + TALLY);
};
const TALLY_AT = [];
const kidToWindow = (t) => { A(onCut(t), "spud", "hide"); A(onCut(t), "spudW", "show"); };
const kidToMiddle = (t) => { A(onCut(t), "spudW", "hide"); A(onCut(t), "spud", "show"); };

// ---------------------------------------------------------------- frame 0
A(0, "spudW", "hide");
A(0, "spud", "sit", { seat: "rear-1", dur: 0, hands: "lap" });
A(0, "wedge", "sit", { seat: "seat-drv", dur: 0, hands: "keep" });
A(0, "wedge", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "wedge", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "wedge", "R", { prop: "wheel", grip: "R" }, 0.01); c.arm(0, "wedge", "L", { prop: "wheel", grip: "L" }, 0.01);
A(0, "rep", "crouch", { to: 0.14, dur: 0.01 }); expr(0, "rep", FACES.reporting, 0.01);
gm.take(0, { reach: 0.01, settle: 0.01 }); gc.take(0, { reach: 0.01, settle: 0.01 });
c.prop(0, "fog", { marks: 0 }, 0);
for (const [id, k, v] of [["light", "go", 0], ["post", "talk", 0], ["place", "light", 1], ["fridge", "open", 0], ["fridge", "lit", 0], ["dome", "lit", 1]]) c.prop(0, id, { [k]: v }, 0);
c.prop(0, "burgerD", { scale: 0.001 }, 0); c.prop(0, "burgerM", { scale: 0.001 }, 0);
expr(0, "spud", FACES.asking, 0.01); look(0, "spud", [-0.5, 0.15], 0.01); look(0, "wedge", [0, 0], 0.01);
arm(0, "spud", "R", { o: [0.25, 0.55, 0.3] }, 0.01); grip(0, "spud", "R", "point", 0.01);   // pointing out at the sign
see(0, END_OF(1), ["spud.face", "wedge.face"], "a kid in the back seat points at a glowing burger sign; the dad at the wheel doesn't even look");

// ---------------------------------------------------------------- 0-3 s SCENE: the trigger line first
say(0);
say(1);   // DAD: We have food at home.
arm(END_OF(0) + 0.2, "spud", "R", "rest", 0.35);
expr(END_OF(1) + 0.05, "spud", FACES.hungry, 0.25);
// tally 1 (insert)
const TA1 = r3(END_OF(1) + 0.25); kidToWindow(TA1); TALLY_AT.push(TA1); tally(TA1);
expr(TA1, "spudW", FACES.hungry, 0.01);

// ---------------------------------------------------------------- 3-9 s NAME + WEIRD RULE (the reporter in cover behind the sign)
kidToMiddle(r3(T[2] - 0.05));
say(2); say(3);
A(r3(T[4] - 0.3), "rep", "lean", { to: 8, dur: 0.4 });
say(4);
A(r3(END_OF(4) + 0.1), "rep", "lean", { to: 0, dur: 0.4 });

// ---------------------------------------------------------------- 9-14 s STAKES: the red light is the clock
say(5);
// KID at the glass: But I'm hungry.  DAD: We have food at home.  tally 2
kidToWindow(r3(T[6] - 0.15)); expr(r3(T[6] - 0.15), "spudW", FACES.hungry, 0.01);
say(6);
say(7);
const TA2 = r3(END_OF(7) + 0.3); TALLY_AT.push(TA2); tally(TA2);

// ---------------------------------------------------------------- 14-25 s TEASE 1: the growl, the coin
const TGR = r3(TA2 + TALLY + 0.1);
kidToMiddle(TGR);
sfx(TGR, "ai/bear-growl", { gain: 0.18 });   // PLACEHOLDER: a stomach growl (no stomach sound in the library yet)
expr(r3(TGR + 0.1), "wedge", { eye: 1.15, tilt: 0.1 }, 0.1); A(r3(TGR + 0.05), "wedge", "squash", { amount: 0.04, dur: 0.12 });
A(r3(TGR + 0.3), "wedge", "squash", { amount: 0, dur: 0.3 });
look(r3(TGR + 0.2), "spud", [0.4, 0.1], 0.15);
// the reporter has crept up to the dad's window (on the cut): Sir... was that you?
repTo(cutAt(8), REP_WIN, 76, 0.5, "talk", 40);
expr(r3(T[8] - 0.1), "rep", "focused", 0.01);
say(8);
expr(r3(T[9] - 0.1), "wedge", "deadpan", 0.1); say(9);   // That was the engine.
// KID with his own coin
c.prop(onCut(r3(T[10] - 0.1)), "coin", { x: -0.02, y: 1.30, z: -0.70 }, 0.01);
arm(onCut(r3(T[10] - 0.1)), "spud", "R", { prop: "coin", grip: [0, -0.02, 0], point: "pinch" }, 0.01); grip(onCut(r3(T[10] - 0.1)), "spud", "R", "pinch", 0.01);
expr(r3(T[10] - 0.1), "spud", FACES.coin, 0.01); look(r3(T[10] - 0.1), "spud", [0.4, 0.1], 0.01);
say(10);
// DAD, smug, eyes closed, hand up: We have food at home.  tally 3
arm(r3(T[11] - 0.3), "wedge", "R", { o: [0.12, 0.75, 0.35] }, 0.3); grip(r3(T[11] - 0.2), "wedge", "R", "flat");
A(r3(T[11] - 0.25), "wedge", "face", { lid: 0.9, dur: 0.2 }); expr(r3(T[11] - 0.25), "wedge", "smug", 0.2);
say(11);
c.prop(onCut(r3(END_OF(11) + 0.3)), "coin", { y: -3 }, 0.01);
arm(r3(END_OF(11) + 0.3), "spud", "R", "rest", 0.3);
const TA3 = r3(END_OF(11) + 0.3); kidToWindow(TA3); TALLY_AT.push(TA3); tally(TA3);
c.arm(r3(END_OF(11) + 0.35), "wedge", "R", { prop: "wheel", grip: "R" }, 0.3);
A(r3(END_OF(11) + 0.4), "wedge", "face", { lid: 0, dur: 0.2 });
// the tease: his eyes slide to the mirror (the sign is behind him), then snap back
kidToMiddle(r3(T[12] - 0.1));
look(r3(T[12] - 0.1), "wedge", [-0.3, 0.45], 0.15); look(r3(T[12] + 0.5), "wedge", [0, 0], 0.1);
say(12);   // REP: What food, sir?
say(13);   // DAD: Food.
say(14);   // REP: Let's go live to the house.

// ---------------------------------------------------------------- 25-40 s TEASE 2: the fridge (kitchen, 200 m along x)
const TK = r3(END_OF(14) + 0.3);
expr(TK, "chip", FACES.shaken, 0.01); look(TK, "chip", [0, 0], 0.01);
look(r3(TK - 0.1), "chip", [0.3, 0.05], 0.12);
arm(r3(TK + 0.05), "chip", "L", { world: [r3(FRIDGE_AT[0] - 0.34), 0.95, r3(FRIDGE_AT[1] + 0.47)] }, 0.3);
grip(r3(TK + 0.25), "chip", "L", "hold", 0.15);
arm(r3(TK + 0.42), "chip", "L", "rest", 0.3);   // a tug, then he lets the door swing
c.prop(r3(TK + 0.5), "fridge", { open: 0.25 }, 0.5, "out"); sfx(r3(TK + 0.5), "door-open", { gain: 0.35 });
c.prop(r3(TK + 0.55), "fridge", { lit: 1 }, 0.05, "linear");
for (const d of [0.2, 0.37]) { c.prop(r3(TK + 0.55 + d), "fridge", { lit: 0 }, 0.01, "linear"); c.prop(r3(TK + 0.55 + d + 0.067), "fridge", { lit: 1 }, 0.01, "linear"); }
say(15);
const T09 = r3(T[15] + 1.05);                      // the reveal: cut to the inside on "There is one pickle"
c.prop(onCut(T09), "fridge", { open: 1 }, 0.01, "linear");
arm(onCut(T09), "chip", "L", "rest", 0.01); grip(onCut(T09), "chip", "L", "relaxed", 0.01);
say(16);
look(r3(END_OF(16) + 0.1), "chip", [0.5, 0], 0.2); look(r3(T[17] - 0.1), "chip", [0, 0], 0.2);
say(17);
// back in the car: ...That's a meal.  (one bead of sweat)
expr(r3(T[18] - 0.15), "wedge", { eye: 1.05, curve: -0.15 }, 0.1);
say(18);
c.prop(r3(T[18] - 0.1), "sweat", { scale: 1 }, 0.01); c.prop(r3(T[18]), "sweat", { y: 0.64 }, 1.1, "in"); c.prop(r3(T[18] + 1.15), "sweat", { scale: 0 }, 0.01);

// ---------------------------------------------------------------- 40-55 s FORCED IN: green, the cone, the lane
c.prop(TG, "light", { go: 1 }, 0.01, "linear"); sfx(TG, "latch-click", { gain: 0.25 });
look(r3(TG + 0.1), "wedge", [0.1, 0.1], 0.15);
// the reporter at the lane mouth, on the cut into the wide
repTo(r3(T[19] - 0.4), REP_LANE, -120, 0, "talk", 30); expr(r3(T[19] - 0.4), "rep", "shocked", 0.01);
say(19);
// at the speaker: Mash (offstage voice through the post) and the dad
c.prop(r3(T[20] - 0.05), "post", { talk: 1 }, 0.01); c.prop(r3(END_OF(20) + 0.05), "post", { talk: 0 }, 0.01);
say(20);
A(r3(T[21] - 0.4), "wedge", "lean", { to: 12, dur: 0.35 }); look(r3(T[21] - 0.4), "wedge", [0.7, -0.1], 0.2); expr(r3(T[21] - 0.4), "wedge", "stern", 0.2);
say(21);
const TA4 = r3(END_OF(21) + 0.3); kidToWindow(TA4); TALLY_AT.push(TA4); tally(TA4);
kidToMiddle(r3(T[22] - 0.1));
c.prop(r3(T[22] - 0.05), "post", { talk: 1 }, 0.01); c.prop(r3(END_OF(22) + 0.05), "post", { talk: 0 }, 0.01);
expr(r3(T[22] - 0.1), "mash", FACES.confused, 0.15); look(r3(T[22] - 0.1), "mash", [0, -0.1], 0.1);
say(22);

// ---------------------------------------------------------------- 55-70 s THE CRACK
// the silence: push in on the dad; he leans to the speaker and whispers; the kid's head turns slowly
const TS = r3(END_OF(22) + 0.3);
expr(TS, "wedge", "sad", 0.4);
A(r3(T[23] - 0.5), "wedge", "lean", { to: 18, dur: 0.4 }); look(r3(T[23] - 0.4), "wedge", [-0.45, 0.1], 0.15); look(r3(T[23] + 0.3), "wedge", [0.7, -0.1], 0.2);
expr(r3(TS + 0.6), "spud", FACES.flat, 0.4); look(r3(TS + 0.6), "spud", [0.45, 0.05], 0.6);
say(23, { soft: true });
// the reporter on the plinth by the window: Did he just...
repTo(cutAt(24), REP_PLINTH, 45, 0.5, "talk", 20); expr(r3(T[24] - 0.1), "rep", "shocked", 0.01);
say(24);
A(r3(END_OF(23) + 0.2), "wedge", "lean", { to: 0, dur: 0.3 });
// the handover (on the cut, the car at the window): Mash holds out ONE burger
const TH = r3(END_OF(24) + 0.35);
const gbM = grips.box(c, "mash", BURGER_M);
c.prop(onCut(TH), "burgerM", { scale: 1 }, 0.01); gbM.take(onCut(TH), { reach: 0.01, settle: 0.01 });
expr(TH, "mash", "kind", 0.01);
arm(r3(TH + 0.2), "wedge", "L", { o: [-0.35, 0.55, 0.45] }, 0.4); grip(r3(TH + 0.3), "wedge", "L", "flat");
A(r3(TH + 0.1), "rep", "crouch", { to: 0.1, dur: 0.3 }); mic(r3(TH + 0.2), "talk", 0, 0.4);

// ---------------------------------------------------------------- 70-80 s ENDING: the kid turns the line on him. CUT.
const TE = r3(TH + PASS);
c.prop(onCut(TE), "wheel", { scale: 0.001 }, 0.01); c.prop(onCut(TE), "burgerD", { scale: 1 }, 0.01);
const gbD = grips.box(c, "wedge", BURGER_D);
gbD.take(onCut(TE), { reach: 0.01, settle: 0.01 });
A(onCut(TE), "wedge", "lean", { to: 0, dur: 0.01 });
expr(TE, "wedge", "eager", 0.01); A(TE, "wedge", "face", { set: { open: 0.85 }, dur: 0.15 });
look(TE, "wedge", [0, 0], 0.01);
expr(TE, "spud", FACES.flat, 0.01); look(TE, "spud", [0.45, 0.05], 0.01);
say(25);
look(r3(END_OF(25) + 0.1), "wedge", [-0.4, 0.1], 0.08); expr(r3(END_OF(25) + 0.1), "wedge", { eye: 1.2, open: 0.85 }, 0.1);
const END = F(END_OF(25) + 0.7);
see(T[25], END, ["spud.face", "wedge.face", "burgerD"], "the kid says the line to his dad, who is frozen with a burger at his open mouth");

// ---------------------------------------------------------------- cameras: every shot moves
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const CAR2 = { rig: "car", pos: [0.15, 1.55, 3.2], look: [0.28, 1.15, -0.3], fov: 40 };
const CAR2T = { rig: "car", pos: [0.25, 1.5, 2.7], look: [0.55, 1.15, -0.2], fov: 40 };
const DADC = { rig: "car", pos: [0.45, 1.5, 2.75], look: [0.62, 1.18, 0.2], fov: 42 };
const KIDC = { rig: "car", pos: [-0.06, 1.24, 1.30], look: [-0.08, 1.12, -0.95], fov: 34 };
const TALLYC = { rig: "car", pos: [-3.58, 1.34, -0.74], look: [-0.98, 1.34, -0.74], fov: 35 };
const COVER = { pos: [1.60, 0.45, 19.4], look: [1.25, 1.77, 0], fov: 44 };
const COVERC = { pos: [1.85, 0.75, 17.3], look: [1.95, 0.62, 14.75], fov: 34 };
const REDL = { pos: [-0.9, 1.25, -0.9], look: [-1.75, 2.55, -3.0], fov: 32 };
const WINDOW = { pos: [-0.95, 1.5, 1.5], look: [-1.45, 1.2, -0.6], fov: 40 };
const KIT08 = { pos: [KX - 3.40, 0.80, 2.60], look: [KX - 3.45, 0.85, -1.5], fov: 40 };
const KIT09 = { pos: [KX - 3.0, 1.21, 1.08], look: [KX - 3.0, 1.21, -1.9], fov: 31 };
const WIDE10 = { pos: [-2.4, 6.2, 5.0], look: [1.6, 0.4, -7.2], fov: 52 };
const SPEAKC = (() => { const p = laneXZ(1.2, 2.6); return { pos: [r3(p[0]), 1.5, r3(p[1])], look: [3.7, 1.2, -11.2], fov: 40 }; })();
const MASHC = (() => { const p = laneXZ(8.6, -2.4); return { pos: [r3(p[0]), 1.45, r3(p[1])], look: [r3(MASH_AT[0]), 1.35, r3(MASH_AT[1])], fov: 30 }; })();
const PLINTHC = (() => { const p = laneXZ(11.0, 0.2); return { pos: [r3(p[0]), 1.6, r3(p[1])], look: [r3(REP_PLINTH[0]), 1.35, r3(REP_PLINTH[1])], fov: 34 }; })();
const ENDC = { rig: "car", pos: [-0.2, 1.55, 3.2], look: [0.2, 1.15, -0.3], fov: 40 };   // the opening frame, a step to the kid's side
const HAND14 = (() => { const p = laneXZ(11.2, 1.25), q = laneXZ(8.65, 0.95); return { pos: [r3(p[0]), 1.5, r3(p[1])], look: [r3(q[0]), 1.15, r3(q[1])], fov: 38 }; })();
const beats = c.beats([
  ["burgers?", 0, push(CAR2, 0.06, 3.2), "hook"],
  ["tally 1", TA1, push(TALLYC, 0.05, TALLY)],
  ["live", cutAt(2), push(COVER, 0.05, DUR[2] + 0.3)],
  ["one rule", cutAt(3), push(COVERC, 0.1, DUR[3] + DUR[4] + 0.6)],
  ["red light", cutAt(5), push(REDL, 0.08, DUR[5] + 0.3)],
  ["hungry", cutAt(6), push(TALLYC, 0.06, DUR[6] + 0.25)],
  ["food at home 2", cutAt(7), push(DADC, 0.08, DUR[7] + 0.25)],
  ["tally 2", TA2, push(TALLYC, 0.05, TALLY)],
  ["growl", TGR, push(CAR2, 0.05, GROWL + 0.2)],
  ["was that you", cutAt(8), push(WINDOW, 0.06, DUR[8] + DUR[9] + 0.4)],
  ["own money", cutAt(10), push(KIDC, 0.08, DUR[10] + 0.3)],
  ["food at home 3", r3(T[11] - 0.35), push(DADC, 0.08, DUR[11] + 0.6)],
  ["tally 3", TA3, push(TALLYC, 0.05, TALLY)],
  ["what food", cutAt(12), push(WINDOW, 0.06, DUR[12] + DUR[13] + DUR[14] + 1.0)],
  ["the fridge", TK, push(KIT08, 0.05, 1.6)],
  ["one pickle", T09, push(KIT09, 0.06, 3.4), "reveal"],
  ["his dinner", cutAt(17), push(KIT08, 0.07, DUR[17] + 0.3)],
  ["a meal", cutAt(18), push(DADC, 0.1, DUR[18] + 0.4)],
  ["green", TG, push(REDL, 0.04, 0.9)],
  ["entering", r3(T[19] - 0.4), push(WIDE10, 0.05, DUR[19] + 0.8), "escalation"],
  ["welcome", cutAt(20), push(SPEAKC, 0.06, DUR[20] + 0.3)],
  ["to the speaker", cutAt(21), push(CAR2T, 0.08, DUR[21] + 0.3)],
  ["tally 4", TA4, push(TALLYC, 0.05, TALLY)],
  ["why are you here", cutAt(22), push(MASHC, 0.08, DUR[22] + 0.4)],
  ["silence", TS, push({ ...ENDC, pos: [-0.38, 1.55, 3.2], look: [0.12, 1.15, -0.3] }, 0.1, T[23] - TS + DUR[23] + 0.2)],
  ["did he just", cutAt(24), push(PLINTHC, 0.08, DUR[24] + 0.4)],
  ["handover", TH, push(HAND14, 0.06, PASS)],
  ["food at home 5", TE, push(ENDC, 0.06, END - TE), "payoff"],
], END);

write(import.meta.url, {
  id: "food-at-home",
  title: "Dad said: we have food at home",
  idea: "Kid vs Dad 02: a kid asks for burgers, the dad says 'We have food at home'; a war reporter covers it as a standoff with a rule (whoever says it has to eat it); the fridge holds one pickle; the dad cracks at the drive-thru and the kid turns the line on him.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1230], captionStyle: "kinetic",
  captionOverBody: { reason: "in-car close-ups where the speaker fills the phone frame; captions sit in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", night: true, floor: "none", light: "dusk", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  rigs: [{ id: "car", kind: "hatchback", color: "#6fa596", pivot: [0, 0.5, 0], keys: K }],
  hud: { news: { label: "STANDOFF AT THE DRIVE-THRU", tag: "LIVE", tagW: 150, count: false, show: [r3(END_OF(1) - 0.25), END] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.08, guard: true, signature: false, surface: "concrete",
    engine: { keys: [[0, 750, 0.15, 0], [TD, 750, 0.15, 0], [r3(TD + 0.3), 1500, 0.5, 0], [r3(TD + 4.4), 900, 0.2, 0], [r3(TD + 4.7), 750, 0.15, 0], [TW, 1200, 0.35, 0], [r3(TW + 1.9), 750, 0.15, 0]], gain: 0.2 } },
  creative: { length: [70, 95] },
  hook: { show: ["spud", "wedge"], hint: 0, what: "a kid in the back seat points at a glowing burger sign; the dad at the wheel: 'We have food at home'" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...[["wedge", "seat-drv"], ["spud", "rear-1"], ["spudW", "rear-0"]].map(([who, w]) => ({ who, with: w, from: 0, to: END, reason: "sitting or standing on the car seat" })),
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/02-food-at-home/make-food-at-home.mjs. Stomach growl is a placeholder sound (bear-growl, low).",
});
