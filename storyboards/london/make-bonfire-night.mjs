// BONFIRE NIGHT: "The friend who can't wait for the fireworks" (London clip 1, 4 Nov 2026; post 5 Nov tagged London)
// Jonny's brief and 8-panel board: /mnt/project-files/video-scripts/2026-11-04-london/ (01-bonfire-night-SOURCE-PROMPT.txt,
// 01-bonfire-night-panels.png); the panel notes are PANELS.md next to this file. The panels are the target.
//
// THE BRIEF
//   Joke:        Phoenix can't wait for the Thames fireworks, so he launches himself and IS the firework.
//   Wants:       Phoenix wants the show now; Reaper wants to sit with his tea and wait.
//   Consequence: the best firework of the night, then Phoenix comes down as one ember into Reaper's sand bucket.
//   Ending:      the official display starts, tiny and weak; Reaper and the Wizard are unimpressed; the ash glows.
//   Callback:    the opening's empty sky Phoenix points at gets its show (from him), and the "wait" Reaper pointed at
//                delivers almost nothing.
//
//   node storyboards/london/make-bonfire-night.mjs
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as grips from "../lib/grips.mjs";

const OPENER = { who: "phx", line: "now now now!", words: false };
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const END = 10.0;

// ---------------------------------------------------------------- places (x right, z toward us; the river is -z)
const rad = (d) => (d * Math.PI) / 180, r3 = (v) => Math.round(v * 1000) / 1000;
const ahead = (at, yaw, d, side = 0) => [r3(at[0] + Math.sin(rad(yaw)) * d - Math.cos(rad(yaw)) * side), r3(at[1] + Math.cos(rad(yaw)) * d + Math.sin(rad(yaw)) * side)];   // side + = the character's right
const PARA = { z: -1.05, h: 0.55, d: 0.3, w: 5.2 }, TOP = 0.62;   // the parapet; TOP: its coping (Phoenix stands on it)
const PHX = [0.1, PARA.z];
const CHAIR = { x: -1.02, z: -0.05, rot: 35 }, CHAIR2 = { x: 1.3, z: -0.3, rot: -30 };   // close together, like the panels
const WIZ = [0.8, 0.26], WIZ_YAW = -35;
const CRATE = { x: -0.3, z: -0.62, size: 0.32 }, CRATE2 = { x: 0.175, z: -0.64, size: 0.28 };   // two crates by the wall
const BK0 = [CRATE.x, CRATE.size, -0.6];                            // the sparkler bucket on the first, at its near edge
const MUG_PARK = [0.07, CRATE2.size, -0.6];   // the tea goes on the second crate, at its left edge: the hand (left of the mug) sets it down in the gap between the crates
const BARGE = [0.55, 0.9, -12];
const BURST = [0.3, 7.6, -13.5];                                     // Phoenix's own firework
const SKY = [0.55, 4.6, -6.5];                                       // where his climb ends (the burst takes over)
const REA_UP = ahead([CHAIR.x, CHAIR.z], CHAIR.rot, 0.15);           // where he stands after getting up
const REA_AT = [-0.26, -0.03], REA_TO_CRATE = 180;                    // two steps to the crate: his back to us, watching the sky
const REA_SHOW = 15;                                                 // turned to us, holding out the bucket
const WIZ_IN = [0.64, 0.32];                                           // the Wizard steps in to look into the bucket

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX, y: TOP, face: "3q-right", expr: "eager", follow: 0.4, seed: 1.7, span: 0.55 },
  { id: "rea", character: "notyet/reaper-noscythe", at: [CHAIR.x, CHAIR.z], face: CHAIR.rot, expr: "kind", follow: 0.25, seed: 3.1 },
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: WIZ_YAW, expr: "kind", follow: 0.3, seed: 2.6 },
];
// seated, Reaper's chest is about 0.75 m up; the mug rests in his right hand in front of it
const MUG_REST = [...(([x, z]) => [x, 0.66, z])(ahead([CHAIR.x, CHAIR.z], CHAIR.rot, 0.36, 0.12))];
const MUG_SIP = [...(([x, z]) => [x, 0.79, z])(ahead([CHAIR.x, CHAIR.z], CHAIR.rot, 0.48, 0.06))];
const MUG = { id: "mug", kind: "teamug", steam: 1, ...grips.placeFor("teamug", [MUG_REST[0], MUG_REST[1], MUG_REST[2]], CHAIR.rot) };
// the toffee apple's stick bottom: at rest by his right hand, bitten in front of the mouth
const APPLE_REST = [...(([x, z]) => [x, 0.3, z])(ahead(WIZ, WIZ_YAW, 0.22, 0.3))];
const APPLE_BITE = [...(([x, z]) => [x, 0.36, z])(ahead(WIZ, WIZ_YAW, 0.36, 0.08))];
const APPLE = { id: "apple", kind: "toffeeapple", x: APPLE_REST[0], y: APPLE_REST[1], z: APPLE_REST[2], rot: r3(WIZ_YAW + 180) };
const BUCKET = { id: "bucket", kind: "sandbucket", x: BK0[0], y: BK0[1], z: BK0[2], rot: REA_TO_CRATE + 180 };
const props = [
  { id: "parapet", kind: "parapet", x: 0, z: PARA.z, w: PARA.w, h: PARA.h, d: PARA.d },
  // festoon lights hung from hooks under the coping's front edge, sagging in front of the bricks
  { id: "lights", kind: "stringlights", lit: 1, sag: 0.12, bulbs: 5,
    points: [[-2.6, 0.57, -0.86], [-1.3, 0.57, -0.86], [0, 0.57, -0.86], [1.3, 0.57, -0.86], [2.6, 0.57, -0.86]] },
  // a second strand high over the terrace, between two poles at the parapet's ends (out of frame), in front of the sky
  { id: "lights2", kind: "stringlights", lit: 1, sag: 0.22, bulbs: 7, bulb: 0.035, poles: true, poleBase: TOP,
    points: [[-2.5, 1.95, -0.95], [0, 1.95, -0.95], [2.5, 1.95, -0.95]] },
  { id: "paving", kind: "paving", x: 0, z: 0.4, w: 6, d: 3.2 },
  { id: "chair", kind: "deckchair", ...CHAIR },
  { id: "chair2", kind: "deckchair", ...CHAIR2, color: "#2f6aa3" },
  { id: "blanket", kind: "blanket", ...CHAIR },
  { id: "crate", kind: "crate", ...CRATE },
  { id: "crate2", kind: "crate", ...CRATE2, rot: 4 },
  MUG, APPLE, BUCKET,
  { id: "barge", kind: "barge", x: BARGE[0], y: BARGE[1], z: BARGE[2], w: 2.6 },
  { id: "crowd", kind: "crowd", x: 0, y: -0.3, z: -6.2, w: 9, n: 30 },
  { id: "trail", kind: "sparktrail", x: 0, y: 0, z: 0, len: 0, turns: 2.5, radius: 0.25, tail: 0.6, n: 240, size: 0.45,
    path: [[PHX[0], TOP + 0.5, PHX[1]], [PHX[0] + 0.1, 1.8, PHX[1] - 1.2], [0.4, 3.2, -3.6], SKY] },
  { id: "burst", kind: "firework", x: BURST[0], y: BURST[1], z: BURST[2], shape: "feather", size: 5.4, seed: 3, colors: ["#fff1b0", "#ff9a3a", "#ff4d2a"] },
  { id: "ember", kind: "ember", x: BURST[0], y: 5.5, z: -9, glow: 0 },
  { id: "small1", kind: "firework", x: -1.0, y: 3.8, z: BARGE[2] - 0.5, shape: "peony", size: 1.5, n: 60, star: 0.24, seed: 7, colors: ["#fff4d6", "#ff7ad0", "#c9a8ff"] },
  { id: "small2", kind: "firework", x: 1.1, y: 3.5, z: BARGE[2] - 0.5, shape: "peony", size: 1.3, n: 60, star: 0.22, seed: 8, colors: ["#fff4d6", "#9be7ff", "#ffffff"] },
  { id: "small3", kind: "firework", x: -0.35, y: 4.1, z: BARGE[2] - 0.5, shape: "peony", size: 1.1, n: 60, star: 0.2, seed: 9, colors: ["#fff4d6", "#ffd45a", "#ff8a3a"] },
];

const mug = grips.mug(c, "rea", MUG, { side: "R", height: 0.85 });
const apple = grips.thin(c, "wiz", APPLE, { side: "R", from: 0.55 });
const bucket = grips.bowl(c, "rea", BUCKET, { gap: 0.06, height: 0.7 });
const AT_PHX_FROM_REA = [0.35, 0.6], AT_PHX_FROM_WIZ = [-0.45, 0.5];

// ---------------------------------------------------------------- 1 HOOK 0-1.0 (P1): bouncing on the wall at an empty sky
A(0, "phx", "fly", { to: { x: PHX[0], y: TOP, z: PHX[1] }, dur: 0.01 });
A(0.01, "phx", "land", { to: TOP, dur: 0.01, fold: 0.01 });
A(0, "phx", "wings", { to: 0.5, dur: 0.01 });
c.arm(0, "phx", "R", { o: [0.25, 1.25, 0.05] }, 0.01); c.arm(0, "phx", "L", { o: [0.16, 0.92, 0.08] }, 0.01);   // pointing at the sky from frame 0
A(0.05, "phx", "hop", { count: 3, height: 0.07, dur: 0.92 });
A(0, "phx", "look", { to: [0.3, 0.9], dur: 0.01, blink: false });
act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// Reaper in his deck chair with his tea; the Wizard with a toffee apple; both watching Phoenix
A(0, "rea", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
mug.secure(0, 0.01);
mug.carry(0.38, MUG_SIP, 0.25);                                 // a calm sip while Phoenix bounces
mug.carry(0.75, MUG_REST, 0.25);
A(0, "rea", "look", { to: AT_PHX_FROM_REA, dur: 0.01, blink: false });
A(0, "rea", "face", { lidL: 0.55, lidR: 0.55, dur: 0.01 });
apple.secure(0, 0.01);
A(0, "wiz", "look", { to: AT_PHX_FROM_WIZ, dur: 0.01, blink: false });
see(0, 1.0, ["phx.face", "rea.face", "wiz.face", "parapet"], "P1: Phoenix on the wall pointing at the empty sky, the friends below");

// ---------------------------------------------------------------- 2 IMPATIENT 1.0-2.4 (P2): "when?!" / "wait." / a bite
A(0.97, "phx", "look", { to: [-0.6, -0.35], dur: 0.12, blink: false });
A(1.0, "phx", "turn", { to: -40, dur: 0.25 });
c.arm(1.0, "phx", "R", { o: [0.2, 0.62, 0.22] }, 0.22, "out"); c.arm(1.0, "phx", "L", { o: [0.2, 0.62, 0.22] }, 0.22, "out");
act.mood(c, 1.12, "phx", "angry", { hold: 1.0 });
A(1.15, "phx", "talk", { line: "when when when", dur: 0.8, tone: "excited" });
A(1.15, "phx", "charge", { to: 0.35, dur: 0.3 });
for (const t of [1.2, 1.42, 1.64, 1.86]) A(t, "phx", "squash", { amount: 0.06, dur: 0.12 });   // vibrating with it
// Reaper sips, then points one finger past Phoenix at the dark barge: wait
c.arm(1.72, "rea", "L", { o: [0.12, 0.66, 0.3] }, 0.25, "out");
A(1.7, "rea", "look", { to: [0.45, 0.35], dur: 0.15, blink: false });
A(1.8, "rea", "talk", { line: "wait", dur: 0.35, tone: "calm" });
c.arm(2.3, "rea", "L", "rest", 0.3);
// the Wizard bites his toffee apple and rolls his eyes at Phoenix
apple.carry(1.18, APPLE_BITE, 0.28);
apple.carry(1.62, APPLE_REST, 0.3);
A(1.85, "wiz", "look", { to: [0.35, 0.95], dur: 0.2, blink: false });
A(2.2, "wiz", "look", { to: AT_PHX_FROM_WIZ, dur: 0.15, blink: false });
see(1.2, 2.3, ["phx.face", "rea.face"], "P2: Phoenix's impatience against Reaper's calm 'wait'");

const T_GO_PITCH = 3.62;   // he straightens as he lifts off (feet already leaving the wall)
// ---------------------------------------------------------------- 3 LAUNCH PAD 2.4-3.6 (P3): crouch, fuse lit; "no-no-no"
A(2.4, "phx", "turn", { to: "camera", dur: 0.22 });
A(2.38, "phx", "look", { to: [0.1, 0.15], dur: 0.12, blink: false });
A(2.45, "phx", "squash", { amount: 0.2, dur: 1.0 });
A(2.45, "phx", "wings", { to: 1, dur: 0.25 });
c.arm(2.45, "phx", "R", { o: [0.06, 0.3, -0.06] }, 0.25); c.arm(2.45, "phx", "L", { o: [0.06, 0.3, -0.06] }, 0.25);
A(2.5, "phx", "charge", { to: 1, dur: 0.9, ease: "in" });
A(2.5, "phx", "expr", { expr: "focused", dur: 0.2 });
A(2.45, "phx", "pitch", { to: 18, dur: 0.25 });                                   // leaning at the sky like a sprinter
A(T_GO_PITCH, "phx", "pitch", { to: 0, dur: 0.15 });
for (let tt = 2.6; tt < 3.55; tt += 0.3) c.at(r3(tt), { fx: "poof", pos: [0.0, 1.55, -0.95], color: "#ffb347", puffs: 2, sparks: 10, size: 0.06, dur: 0.3, sound: false });   // the lit fuse
sfx(2.55, "sizzle", { gain: 0.5 });
c.arm(2.55, "rea", "L", { o: [0.16, 0.66, 0.34] }, 0.2, "out");
act.shock(c, 2.55, "rea", { open: 0.2, hold: 1.0 });
A(2.7, "rea", "talk", { line: "no no no", dur: 0.6, tone: "calm" });
apple.carry(2.6, APPLE_BITE, 0.22);                            // he freezes mid-bite
act.shock(c, 2.65, "wiz", { open: 0.3, hold: 0.9 });
see(2.5, 3.5, ["phx.face", "rea.face", "wiz.face"], "P3: Phoenix crouched like a rocket, the friends frozen");

// ---------------------------------------------------------------- 4 LAUNCH 3.6-4.6 (P4): straight up, spark spiral
const T_GO = 3.62, T_TOP = 4.45;
A(T_GO, "phx", "fly", { to: { x: SKY[0], y: SKY[1], z: SKY[2] }, dur: T_TOP - T_GO, ease: "inOut" });
c.prop(T_GO, "trail", { len: 1 }, T_TOP - T_GO, "inOut");
sfx(T_GO, "rocket", { dur: T_TOP - T_GO + 0.1, gain: 0.8 });
for (const id of ["lights", "lights2"]) { c.prop(T_GO, id, { wobble: 1 }, 0.15, "out"); c.prop(T_GO + 0.3, id, { wobble: 0 }, 1.2, "inOut"); }
// heads tip back to follow him; Reaper's tea jolts (a splash out of the mug)
A(T_GO + 0.04, "rea", "look", { to: [0.25, 1], dur: 0.12, blink: false });
A(T_GO + 0.06, "wiz", "look", { to: [-0.15, 1], dur: 0.12, blink: false });
c.arm(T_GO, "rea", "L", "rest", 0.3);
c.at(T_GO + 0.08, { fx: "poof", pos: [MUG_REST[0], MUG_REST[1] + 0.12, MUG_REST[2]], color: "#9a5a2a", puffs: 8, sparks: 0, size: 0.12, dur: 0.4, sound: false });
sfx(T_GO + 0.08, "splash", { gain: 0.25, reason: "the tea splashing out of Reaper's mug" });
// the Wizard lets the toffee apple fall as he gapes up
// (the apple drops later, on the burst: P5)
see(3.7, 4.45, ["rea.face", "wiz.face"], "P4: the friends' faces following him up");

// ---------------------------------------------------------------- 5 PAYOFF 4.6-5.8 (P5): the best firework of the night
const T_BURST = 4.6;
A(T_BURST - 0.1, "phx", "hide");
c.prop(T_BURST - 0.1, "trail", { fade: 1 }, 0.4, "out");
c.prop(T_BURST, "burst", { burst: 1 }, 2.2, "linear");
sfx(T_BURST, "firework", { gain: 1.0 });
c.prop(T_BURST + 0.12, "crowd", { rise: 1 }, 0.3, "out"); c.prop(T_BURST + 1.4, "crowd", { rise: 0.15 }, 0.6, "inOut");
// Reaper gets up out of the chair, the blanket left behind; both turn round to watch it, backs to us
A(3.85, "rea", "stand", { dur: 0.36 });
mug.carry(3.8, [...(([x, z]) => [x, 0.42, z])(ahead(REA_UP, CHAIR.rot, 0.44, 0.1))], 0.5);   // the tea comes up with him, out in front
c.prop(3.9, "blanket", { fall: 1 }, 0.4, "inOut");
A(4.12, "rea", "look", { to: [0.3, 0.6], dur: 0.12, blink: false });
A(4.22, "rea", "turn", { to: 180, dur: 0.38 });
A(4.22, "rea", "move", { to: REA_AT, dur: 0.45, steps: 2 });
// he turns round to watch it, the apple swinging round in front of him (never through the body)
A(4.5, "wiz", "turn", { to: -100, dur: 0.18, ease: "in" }); A(4.68, "wiz", "turn", { to: -170, dur: 0.18, ease: "out" });
apple.carry(4.5, [...(([x, z]) => [x, 0.34, z])(ahead(WIZ, -100, 0.32, 0.22))], 0.18, "in", { rot: 80 });
apple.carry(4.68, [...(([x, z]) => [x, 0.32, z])(ahead(WIZ, -170, 0.24, 0.28))], 0.18, "out", { rot: 10 });
// the burst makes the Wizard drop his toffee apple (his hand is at about [1.25, 0.42, 0.13] once turned)
A(4.88, "wiz", "release", { prop: "apple", to: [...(([x, z]) => [x, 0, z])(ahead(WIZ, -170, 0.3, 0.3))], dur: 0.28, arc: 0.03 });
A(4.88, "wiz", "grip", { side: "R", shape: "open", dur: 0.12 });
c.prop(5.16, "apple", { tilt: 86 }, 0.12, "out");
sfx(5.16, "thud-soft", { gain: 0.3 });
c.arm(4.98, "wiz", "R", "rest", 0.4);
see(T_BURST + 0.1, 5.7, ["burst"], "P5: the feather-shaped burst over the Thames");

// ---------------------------------------------------------------- 6 THE EMBER 5.8-7.0 (P6): he holds out the bucket
// Reaper parks the tea on the crate and takes the sand bucket, like he has done this before
// the tea onto the second crate: put down, let go, and the hand comes back to his side (not the chair-side "away")
A(4.52, "rea", "look", { to: [0.25, -0.5], dur: 0.12, blink: false });            // a glance down at the crate
let t = mug.place(4.66, MUG_PARK, 0.2) + 0.05;
A(t, "rea", "release", { prop: "mug", dur: 0 });
A(t, "rea", "grip", { side: "R", shape: "open", dur: 0.12 });
c.arm(t + 0.04, "rea", "R", "rest", 0.16, "out");
c.prop(t, "mug", { steam: 0.6 }, 0.5);
A(t - 0.05, "rea", "look", { to: [-0.1, -0.5], dur: 0.1, blink: false });
t += 0.12;
t = bucket.take(t, { reach: 0.15, settle: 0.1 });
const BK_Y = 0.3;                                                   // held at his belly, the rim under his chin
const BK_CHEST = [...(([x, z]) => [x, BK_Y, z])(ahead(REA_AT, REA_SHOW, 0.44))];
const BK_UP = [BK0[0], 0.42, BK0[2] + 0.06];
t = bucket.carry(t + 0.02, BK_UP, 0.15, "out");
// he turns to us with it, the bucket staying in front of him all the way round (never through the body)
for (const [yaw, k] of [[125, 1], [70, 2], [REA_SHOW, 3]]) {
  const [x, z] = ahead(REA_AT, yaw, 0.44);
  A(t, "rea", "turn", { to: yaw, dur: 0.13, ease: k === 1 ? "in" : k === 3 ? "out" : "linear" });
  t = bucket.carry(t, [x, BK_Y, z], 0.13, k === 1 ? "in" : k === 3 ? "out" : "linear", { rot: yaw + 180 });
}
A(5.9, "wiz", "turn", { to: WIZ_YAW, dur: 0.35 });
console.log("  rea faces us with the bucket at", t.toFixed(2));
const T_LAND = 6.6, IN_BK = [BK_CHEST[0], BK_CHEST[1] + 0.24, BK_CHEST[2]];
c.prop(5.7, "ember", { glow: 1 }, 0.2);
c.prop(5.7, "ember", { x: IN_BK[0] + 0.3, y: 3.2, z: IN_BK[2] - 3.0 }, 0.01);
c.prop(5.72, "ember", { x: IN_BK[0], y: IN_BK[1], z: IN_BK[2] }, T_LAND - 5.72, "inOut");
c.prop(T_LAND, "ember", { glow: 0 }, 0.08);
c.prop(T_LAND, "bucket", { glow: 1 }, 0.1);
c.at(T_LAND, { fx: "poof", pos: [IN_BK[0], IN_BK[1] + 0.02, IN_BK[2]], color: "#8f8b93", puffs: 8, sparks: 0, size: 0.18, dur: 0.5, sound: false });
sfx(T_LAND, "sizzle", { gain: 0.35 });
A(6.0, "rea", "look", { to: [0.1, 0.9], dur: 0.2, blink: false });
A(6.45, "rea", "look", { to: [0.05, -0.6], dur: 0.15, blink: false });
A(6.0, "rea", "expr", { expr: "deadpan", dur: 0.25 });
A(6.05, "rea", "face", { lidL: 0.3, lidR: 0.3, dur: 0.2 });              // heavy-lidded, the pupils still showing
A(6.05, "wiz", "look", { to: [0.1, 0.9], dur: 0.2, blink: false });
A(6.5, "wiz", "look", { to: [-0.55, -0.4], dur: 0.15, blink: false });
see(6.0, 6.9, ["rea.face", "bucket"], "P6: Reaper holding out the bucket, the ember landing in it");

// ---------------------------------------------------------------- 7 ASH 7.0-8.5 (P7): eyes and a thumb up out of the ash
c.prop(6.72, "bucket", { rise: 1 }, 0.3, "out");
c.prop(7.25, "bucket", { open: 1 }, 0.08);
c.prop(7.5, "bucket", { open: 0.3 }, 0.06); c.prop(7.58, "bucket", { open: 1 }, 0.06);   // a blink
c.prop(7.62, "bucket", { over: 1 }, 0.2, "back");
c.prop(7.0, "bucket", { glow: 0.2 }, 0.6);
sfx(7.25, "pop", { gain: 0.25, reason: "the eyes pop open in the ash" });
sfx(7.64, "tink", { gain: 0.25, reason: "the tiny thumb up" });
A(6.95, "wiz", "move", { to: WIZ_IN, dur: 0.4, steps: 1 });
A(6.95, "wiz", "turn", { to: -80, dur: 0.35 });
A(7.3, "wiz", "pitch", { to: 9, dur: 0.3 });
A(7.3, "wiz", "expr", { expr: "annoyed", set: { curve: -0.3, open: 0.06 }, dur: 0.25 });
A(7.05, "rea", "face", { lidL: 0.3, lidR: 0.3, dur: 0.2 });
see(7.1, 8.4, ["bucket", "rea.face", "wiz.face"], "P7: the ash pile with Phoenix's eyes and thumb up");

// ---------------------------------------------------------------- 8 THE REAL SHOW 8.5-10 (P8): tiny, weak; the ash glows
for (const [id, tt] of [["small1", 8.55], ["small2", 8.95], ["small3", 9.3]]) { c.prop(tt, id, { burst: 1 }, 1.1, "linear"); sfx(tt, "fizzle", { gain: 0.5 }); }
A(8.05, "wiz", "pitch", { to: 0, dur: 0.3 });
A(8.5, "wiz", "move", { to: [0.82, 0.3], dur: 0.35, steps: 1 });                  // steps back out of Reaper's space
A(8.5, "wiz", "turn", { to: -25, dur: 0.35 });
A(8.62, "rea", "look", { to: [0.2, 0.55], dur: 0.15, blink: false });
A(8.64, "wiz", "look", { to: [-0.2, 0.55], dur: 0.15, blink: false });
A(9.15, "rea", "look", { to: [0.65, 0.0], dur: 0.12, blink: false });
A(9.17, "wiz", "look", { to: [-0.65, 0.0], dur: 0.12, blink: false });
A(9.55, "rea", "look", { to: [0.1, -0.7], dur: 0.12, blink: false });
A(9.57, "wiz", "look", { to: [-0.35, -0.7], dur: 0.12, blink: false });
A(8.6, "wiz", "expr", { expr: "deadpan", dur: 0.3 });
c.prop(9.4, "bucket", { glow: 1, open: 0 }, 0.4, "inOut");
see(8.6, 9.9, ["rea.face", "wiz.face", "bucket"], "P8: unimpressed by the real show, the ash glowing");

// ---------------------------------------------------------------- shots: Jonny's panels (camera always toward the river)
const P1 = { pos: [-0.2, 0.85, 4.3], look: [-0.18, 1.3, -1], fov: 56 };
const P2 = { pos: [-0.25, 0.85, 3.0], look: [-0.2, 1.2, -1], fov: 52 };
const P3 = { pos: [-0.2, 0.85, 4.3], look: [-0.18, 1.3, -1], fov: 56 };
const P4 = { pos: [-0.05, 0.3, 3.0], look: [0.0, 3.2, -3], fov: 58 };
const P5 = { pos: [0.27, 1.25, 3.2], look: [0.27, 4.8, -8], fov: 54 };
const P6 = { pos: [0.05, 0.85, 3.0], look: [0.0, 1.05, -1], fov: 48 };
const P7 = { pos: [-0.02, 1.4, 1.95], look: [0.1, 0.48, 0.3], fov: 46 };
const P8 = { pos: [0.0, 0.85, 3.9], look: [0.0, 1.3, -1], fov: 54 };
const beats = c.beats([
  ["P1 hook: now now now", 0, P1, "hook"],
  ["P2 when / wait", 1.0, P2],
  ["P3 launch pad", 2.4, P3],
  ["P4 launch", 3.6, P4],
  ["P5 payoff: the firework", T_BURST, P5, "payoff"],
  ["P6 the ember", 5.8, P6],
  ["P7 ash with eyes", 7.0, P7, "reveal"],
  ["P8 the real show", 8.5, P8, "reaction"],
], END);

write(import.meta.url, {
  id: "bonfire-night",
  title: "The friend who can't wait for the fireworks",
  idea: "Bonfire Night in London: Phoenix can't wait for the display, launches himself and is the best firework of the night; he comes down as an ember in Reaper's sparkler bucket, and the official show is tiny",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 4.9,
  set: { type: "plain", night: true, color: "#121a3b", floor: "#3a3850", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/thames-night.png", z: -14, center: [0.1, 4.9], height: 21.95, depth: false, motion: false, dust: 0 } },
  music: { style: "funk", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "concrete", room: "open", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "rea", "wiz"], hint: 1.0, what: "Phoenix bouncing on the wall at an empty sky while Reaper sips tea" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "chair", from: 0, to: 5.0, reason: "Reaper sits in the deck chair, gets up and his sleeve brushes its rail as he steps away" },
    { who: "rea", with: "blanket", from: 0, to: 5.0, reason: "the blanket lies over Reaper's lap while he sits and slides off as he stands" },
    { who: "phx", with: "parapet", from: 0, to: 3.8, reason: "Phoenix stands on the parapet's coping (feet and tail rest on it)" },
  ],
  notes: "Generated by storyboards/london/make-bonfire-night.mjs. Panels: PANELS.md.",
});
