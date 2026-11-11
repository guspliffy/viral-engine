// Survive it, episode 2: "Stuck in a lift with your friends for 30 days" (extreme chain v3 with Spud, 11 Nov 2026).
// Jonny's target: the 12-panel sheet next to this file (panels-sheet.png, approved 11 Nov 20:40 Berlin) and the chain
// in /mnt/project-files/video-scripts/2026-11-08-survive-it/02-stuck-in-a-lift-V3-EXTREME-IMAGE-PROMPT.md.
//
// THE BRIEF
//   Joke:        Spud only wants floor 800; every friend's fix makes it worse, until the lift is in space.
//   Wants:       Spud wants to get out at floor 800.
//   Consequence: the Samurai's record punch jams the lift; the Wizard's reset blows the wall up; the Gunslinger
//                haggles the battery dead; Phoenix bounces the cable off; the spring fires them into space.
//   Ending:      Samurai "...New record." over the Earth, the Astronaut drifts past: "Going down?"
//   Callback:    the Samurai wanted the record in second one and gets it 200 floors too high; Spud's floor 800
//                passes in one blink.
// ONE CHAIN (Rule 0): each beat is caused by the one before; PANELS.md lists cause, must-see and shot per panel.
// Run: node storyboards/series/survive-it/03-lift/make-lift.mjs -> lift.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { hud } from "../../../lib/overlay.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 560 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
const MUSIC = { style: "bounce", lowCut: 150, gain: 0.26 };
const SUB_STYLE = {};

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded DOWN to ms

// ---------------------------------------------------------------- the timeline (story seconds)
const T = {
  spud: 2.75,          // Spud: "Floor 800. Two seconds."
  cu: fr(3.6),         // P02 close on the door-close button
  punch: 4.2,          // the fist goes through
  jam: fr(4.5),        // P03 the jam, wide
  manual: 5.6,         // Wizard: "Reset: press every floor. In order."
  sure: 7.05,          // Spud: "...sure."
  wall: fr(7.5),       // P04 the button wall, days 1 -> 12
  hot: 8.9,            // all 1,000 lit, the plate goes white
  blast: fr(9.2),      // P05 the wall explodes, wide
  page2: 10.05,        // Wizard: "...Page two: 'Don't.'"
  call: fr(11.0),      // P06 the Gunslinger and his phone
  lapse: 11.95,        // days 12 -> 29 on hold
  offer: 12.95,        // the phone: "...we could do 1,900."
  take: fr(13.75),     // P07 Spud: "TAKE IT!"
  counter: fr(14.35),  // back on the Gunslinger: "...1,850?"
  dead: 15.0,          // the battery dies
  bounce: fr(15.25),   // P08 Phoenix bounces, low angle
  snap: 16.8,          // the last strand
  fall: fr(16.95),     // P09 free fall
  pit: fr(18.45),      // P10 the pit, outside
  hit: 18.7,           // the car meets the spring
  launch: 19.05,       // the spring fires
  up: fr(19.25),       // P11 inside, floor 800 passes
  f800: 19.95,         // the hallway in the doorway
  space: fr(20.55),    // P12 space
  record: 21.2,        // Samurai: "...New record."
  astro: 22.1,         // Astronaut: "Going down?"
  end: 23.1,
};

// ---------------------------------------------------------------- places (set-elevator.js: walls x +-2.05, back z -1.6,
// front z 1.25, ceiling y 3.4). x right, z toward the hallway camera.
const yawTo = (a, b, share = 1) => r3(((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI) * share);
const place = (t, who, at, yaw = 0) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear" }); A(r3(t - 0.02), who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" }); };
const BTN = { z: 0.85, y: 0.72 };   // the door-close button on the right wall (liftpanel spec.close)
const P0 = { spud: [0.05, 0.6], sam: [1.3, 0.72], wiz: [-1.2, 0.45], phx: [-0.7, -0.8], gun: [0.75, -0.85] };
const FIVE = ["spud", "sam", "wiz", "phx", "gun"];
// after the blast: the Gunslinger in front of the burning wall, the others on the left
const P6 = { gun: [0.7, 0.35], spud: [-0.55, 0.8], sam: [-1.45, 0.05], wiz: [-0.35, -0.5], phx: [-1.4, -1.1] };
// the bounce: Phoenix in the middle, the four round him
const P8 = { phx: [0, -0.35], spud: [0.1, 0.85], sam: [1.2, 0.3], wiz: [-1.25, 0.3], gun: [1.15, -0.9] };

const CAM = {
  A: { pos: [0.1, 1.75, 7.6], look: [0.1, 1.55, -0.3], fov: 46 },          // the hallway wide: the car, the cable over it
  CU: { pos: [0.3, 0.92, 3.3], look: [1.55, 0.72, 0.75], fov: 40 },        // P02: the fist and the button, Spud beside it
  WALL: { pos: [-1.75, 1.5, 0.2], look: [2.0, 1.55, -0.1], fov: 62 },      // P04: the button wall from the left wall
  GUN: { pos: [0.35, 1.0, 4.6], look: [0.5, 0.95, 0], fov: 38 },           // P06: Gunslinger calm in front of the fire
  SPUD: { pos: [-0.5, 0.62, 2.55], look: [-0.55, 0.5, 0.75], fov: 30 },    // P07: Spud's face
  LOW: { pos: [0.1, 0.35, 5.6], look: [0.05, 1.9, -0.3], fov: 50 },        // P08: low, looking up at the ceiling and the cable
  FALL: { pos: [0.1, 1.9, 7.2], look: [0.1, 1.5, -0.3], fov: 44 },         // P09: zero gravity
  PIT: { pos: [0.3, 2.6, 13.5], look: [0, 1.5, 0], fov: 40 },              // P10: outside, the spring under the car
  UP: { pos: [-1.55, 0.75, -1.2], look: [0.5, 0.75, 1.3], fov: 62 },       // P11: inside, the doorway at the right
  SPACE: { pos: [0.6, 2.2, 15.5], look: [0.2, 1.7, 0], fov: 36 },          // P12: the car over the Earth
};

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: P0.spud, face: "camera", expr: "kind", follow: 0.3, seed: 1.4 },
  { id: "sam", character: "duo/samurai", at: P0.sam, face: "camera", expr: "cocky", follow: 0.3, seed: 2.3 },
  { id: "wiz", character: "never-has-money/wizard", at: P0.wiz, face: "camera", expr: "kind", follow: 0.3, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: P0.phx, face: "camera", expr: "eager", follow: 0.3, seed: 4.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: P0.gun, face: "camera", expr: "deadpan", follow: 0.3, seed: 5.2 },
  { id: "ast", character: "potatobrawl/astronaut", at: [9, 4], face: "camera", expr: "kind", follow: 0.3, seed: 6.6 },
];

const FARX = 60;   // parked props wait out here (the floor plan ignores height)
const props = [
  { id: "sign", kind: "floorsign", x: 0, y: 3.05, z: -1.585, count: 795 },
  { id: "panel", kind: "liftpanel", x: 2.03, y: 0.05, z: -0.2, rot: -90, w: 2.6, h: 3.2, close: [1.05, BTN.y], lit: 0, hot: 0, dead: 0, punch: 0 },
  { id: "cable", kind: "liftcable", x: 0, y: 3.42, z: 0.95, len: 8, strands: 12, whip: 0, glow: 0 },
  { id: "phone", kind: "phone", x: P0.gun[0] + 0.2, y: 0.62, z: P0.gun[1] + 0.42, rot: 180, tip: -20, scale: 1.8, case: "#2d2f3a" },
  { id: "fire", kind: "wallfire", x: 1.95, y: 0, z: -0.2, rot: -90, w: 2.6, h: 3.2, castLight: true, burn: 0 },
  { id: "blast", kind: "liftblast", x: 1.9, y: 1.6, z: -0.2, rot: -90, t0: T.blast + 0.033, w: 2.6, h: 3.2, far: 3.9 },
  { id: "dark", kind: "cardark", x: 0, y: 0, z: 0, dark: 0 },
  { id: "lamp", kind: "alarmlamp", x: -1.7, y: 3.2, z: -1.3, on: 0 },
  { id: "sparksL", kind: "sparkrain", x: -2.5, y: 2, z: 0.6, box: [0.7, 7, 1.2], n: 110, dir: -1, rate: 0 },
  { id: "sparksR", kind: "sparkrain", x: 2.5, y: 2, z: 0.6, box: [0.7, 7, 1.2], n: 110, dir: -1, rate: 0 },
  { id: "blobs", kind: "fireblobs", x: 0, y: 1.7, z: -0.2, box: [3.4, 2.4, 2.2], n: 9, show: 0 },
  { id: "shell", kind: "liftshell", x: FARX, y: 0, z: 0, sign: "0", scorch: 1 },
  { id: "pit", kind: "shaftpit", x: FARX, y: -30, z: 0, h: 40, signY: 5.2 },
  { id: "spring", kind: "liftspring", x: FARX, y: -30, z: -0.2, r: 1.3, h: 2.4, squash: 0 },
  { id: "pass", kind: "shaftpass", x: FARX, y: 0, z: 1.9, w: 3.4, h: 60, floors: [{ y: 30, label: "800" }], blur: 1 },
  { id: "doors", kind: "elevdoors", x: 0, z: 1.27, open: 0 },
  { id: "sky", kind: "spacesky", x: FARX, y: -8, z: -40, w: 70, h: 110, hole: [0.5, 0.12], glow: 0 },
];

// small helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { c.arm(t, who, "R", pose, dur, ease); c.arm(t, who, "L", pose, dur, ease); };
const scream = (t, who, open = 0.34) => expr(t, who, "terrified", { open }, 0.1);
const bake = (t, to, dur = 0.5) => FIVE.forEach((w) => A(t, w, "skin", { color: w === "phx" ? "#b98a45" : "#8a5a2b", to: w === "phx" ? to * 0.6 : to, dur }));

// ---------------------------------------------------------------- the narrator (voice 1): the title from 0.0
c.at(0.0, { macro: "narrate", line: "Stuck in a lift with your friends for thirty days.", voice: "narrator", caption: false });
c.cap(0.0, 2.7, "Stuck in a lift with your friends for 30 days.", 470, false, SUB_STYLE);

// ================================================================ 1 DAY 1, THE MISTAKE (P01-P03)
// P01: the ride up. Samurai's fist over the button from frame 0, Phoenix hopping, Gunslinger on his phone, the sign climbing
prop(0, "sign", { count: 799.4 }, 3.9, "linear");
A(0, "sam", "turn", { to: 55, dur: 0 }); A(0, "wiz", "turn", { to: 15, dur: 0 });
c.arm(0, "sam", "R", { o: [0.42, 0.62, 0.3] }, 0); A(0, "sam", "grip", { side: "R", shape: "fist", dur: 0 });
A(0, "sam", "lean", { to: 8, dur: 0 });
A(0, "phx", "hop", { count: 6, height: 0.22, dur: 2.7 });
c.arm(0, "gun", "R", { o: [0.16, 0.5, 0.34] }, 0); A(0, "gun", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "gun", "grab", { prop: "phone", hand: "R", dur: 0, pose: null });
look(0, "gun", [0.15, -0.6], 0); look(0, "wiz", [0.5, 0.1], 0); look(0, "sam", [0.6, -0.1], 0);
c.arm(0, "spud", "R", { o: [0.3, 0.85, 0.2] }, 0); A(0, "spud", "grip", { side: "R", shape: "point", dur: 0 }); look(0, "spud", [0, 0.8], 0);
act.blinksAt(c, "spud", [1.4]); act.blinksAt(c, "wiz", [0.9, 2.2]);
sfx(0, "ding", { gain: 0.3, reason: "the lift's floor chime on the ride up" });
c.say(T.spud, "spud", "Floor 800. Two seconds.", 0.8, "calm", { pos: 560 });
look(T.spud, "spud", [0, 0], 0.2); expr(T.spud, "spud", "happy");
see(0, T.cu, ["spud.face", "sam", "panel", "sign"], "frame 0: five friends riding up, the Samurai's fist over the door-close button, the sign climbing");

// P02: the punch. Close on the button: fist through the plate, Spud beside it
place(T.cu, "spud", [0.72, 0.0], 35);
c.say(T.cu + 0.03, "sam", "One second. New record!", 0.6, "excited", { pos: 1240 });
c.arm(T.cu, "sam", "R", { o: [0.2, 0.7, -0.05] }, 0.3, "out");                      // wind-up
c.arm(r3(T.punch - 0.1), "sam", "R", { world: [1.98, BTN.y, BTN.z] }, 0.1, "in");   // the punch
expr(T.cu, "sam", "cocky", { open: 0.22 }); look(T.cu, "sam", [0.7, -0.1], 0);
look(T.cu, "spud", [0.7, -0.05], 0); expr(T.cu, "spud", "kind", null, 0);
prop(T.punch, "panel", { punch: 1 }, 0.01, "linear");
c.at(T.punch, { fx: "impact", dur: r3(2 / 30) }); c.at(r3(T.punch + 0.03), { fx: "shake", dur: 0.3, amp: 0.05 });
sfx(T.punch, "slam", { gain: 0.6, loud: true, reason: "the Samurai's fist through the button plate" });
sfx(r3(T.punch + 0.05), "fizzle", { gain: 0.4, reason: "the broken button sparks" });
act.shock(c, r3(T.punch + 0.03), "spud", { open: 0.3, eye: 1.3, hold: 0.4 });
see(T.cu, T.jam, ["spud.face", "sam", "panel"], "the mistake: the fist through the button, Spud's shock beside it");

// P03: the jam. The brakes lock: everyone to the ceiling, sparks rain past, one strand snaps
place(T.jam, "spud", P0.spud, 0);
c.arm(T.jam, "sam", "R", "up", 0.12, "out"); A(T.jam, "sam", "lean", { to: 0, dur: 0.1 });
FIVE.forEach((w, i) => { A(r3(T.jam + 0.02 * i), w, "hop", { count: 1, height: w === "phx" ? 1.9 : 1.55 - 0.1 * (i % 2), dur: 0.72 }); scream(T.jam, w, 0.3); both(r3(T.jam + 0.02), w, "up", 0.15, "out"); both(r3(T.jam + 0.62), w, "rest", 0.3); });
c.at(T.jam, { fx: "shake", dur: 0.6, amp: 0.07 });
prop(T.jam, "sparksL", { rate: 1 }, 0.05, "linear"); prop(T.jam, "sparksR", { rate: 1 }, 0.05, "linear");
prop(r3(T.jam + 0.85), "sparksL", { rate: 0 }, 0.3, "linear"); prop(r3(T.jam + 0.85), "sparksR", { rate: 0 }, 0.3, "linear");
prop(T.jam, "lamp", { on: 1 }, 0.05, "linear"); prop(r3(T.manual + 0.2), "lamp", { on: 0 }, 0.2, "linear");
prop(r3(T.jam + 0.1), "cable", { strands: 11, whip: 1 }, 0.01, "linear"); prop(r3(T.jam + 0.12), "cable", { whip: 0 }, 0.5, "settle");
sfx(T.jam, "screech", { gain: 0.55, loud: true, reason: "the emergency brakes lock" });
sfx(r3(T.jam + 0.1), "hit-metal", { gain: 0.4, reason: "a cable strand snaps" });
sfx(r3(T.jam + 0.72), "land", { gain: 0.45, reason: "five friends drop back onto the lift floor" });
FIVE.filter((w) => w !== "sam").forEach((w) => { expr(r3(T.jam + 0.8), w, "annoyed"); look(r3(T.jam + 0.8), w, [w === "gun" ? 0.5 : 0.8, 0], 0.2); });
act.sheepish(c, r3(T.jam + 0.85), "sam");
see(T.jam, T.manual, ["spud.face", "sam.face", "cable"], "the jam: all five thrown up, a strand gone; the glares land on the Samurai");

// ================================================================ 2 SO THE WIZARD RESETS IT (P04-P05)
c.say(T.manual, "wiz", "Reset: press every floor. In order.", 1.35, "calm", { pos: 560 });
c.arm(T.manual, "wiz", "R", "point", 0.3); look(T.manual, "wiz", [0.6, 0.2], 0.2); expr(T.manual, "wiz", "focused");
FIVE.filter((w) => w !== "wiz").forEach((w) => look(r3(T.manual + 0.1), w, [w === "sam" ? -0.8 : -0.6, 0.05], 0.2));
c.say(T.sure, "spud", "...sure.", 0.4, "calm", { pos: 1240 });
expr(T.sure, "spud", "deadpan"); look(T.sure, "spud", [0, 0], 0.15);

// P04: the wall fills up, days 1 to 12, in one shot
const W4 = { wiz: [1.25, 0.15], spud: [0.75, -0.75], sam: [0.2, 0.55], phx: [-0.2, -0.45], gun: [-0.75, 0.25] };
Object.entries(W4).forEach(([w, at]) => place(T.wall, w, at, w === "wiz" ? 90 : yawTo(at, [CAM.WALL.pos[0], CAM.WALL.pos[2]], 0.75)));
c.arm(T.wall, "wiz", "R", "up", 0); c.arm(T.wall, "wiz", "L", "rest", 0);
A(T.wall, "wiz", "tap", { count: 9, every: 0.15, side: "R", lift: 0.05 });
prop(T.wall, "panel", { lit: 1000 }, r3(T.hot - T.wall - 0.1), "linear");
FIVE.filter((w) => w !== "wiz").forEach((w) => { expr(T.wall, w, "eager", null, 0); look(T.wall, w, [0.7, 0.5], 0); });
look(T.wall, "wiz", [0.5, 0.7], 0);
c.at(r3(T.wall + 0.15), { macro: "narrate", line: "Day twelve.", voice: "narrator", caption: false });
c.cap(r3(T.wall + 0.15), r3(T.hot), "Day twelve.", 470, false, SUB_STYLE);
sfx(T.wall, "timer-beep", { gain: 0.25, reason: "the buttons lighting, faster and faster" });
prop(T.hot, "panel", { hot: 1 }, r3(T.blast - T.hot), "in");
sfx(T.hot, "charge", { gain: 0.45, reason: "the 1,000 lit buttons whine up" });
FIVE.forEach((w) => { expr(r3(T.hot + 0.08), w, "shocked", { open: 0.15 }, 0.12); });
see(T.wall, T.blast, ["wiz", "panel", "spud.face"], "cause: the Wizard presses every button; the wall is the progress bar; the plate goes white-hot");

// P05: the wall explodes; it burns from here on
const B0 = { wiz: [1.1, 0.2], spud: [0.3, 0.85], sam: [0.2, -0.6], phx: [-0.75, -0.1], gun: [-0.85, 0.95] };
Object.entries(B0).forEach(([w, at]) => place(T.blast, w, at, -35));
const BL = Object.fromEntries(Object.entries(B0).map(([w, [x, z]]) => [w, [r3(x - 0.7), z]]));
c.at(T.blast, { fx: "flash", dur: 0.2, peak: 1.2, color: "#fff3c4", sound: false });
c.at(r3(T.blast + 0.03), { fx: "shake", dur: 0.7, amp: 0.09 });
sfx(T.blast, "firework", { gain: 0.8, loud: true, reason: "the button wall explodes" });
prop(T.blast, "panel", { dead: 1, hot: 0, lit: 0 }, 0.05, "linear");
prop(T.blast, "fire", { burn: 1 }, 0.35, "out"); prop(T.blast, "dark", { dark: 1 }, 0.15, "linear"); prop(T.blast, "lamp", { on: 1 }, 0.05, "linear");
Object.entries(BL).forEach(([w, at], i) => {
  scream(T.blast, w, 0.36); both(T.blast, w, "up", 0.12, "out");
  A(r3(T.blast + 0.04), w, "move", { to: at, dur: 0.42, steps: 0, ease: "out" }); A(r3(T.blast + 0.04), w, "hop", { count: 1, height: 0.45 + 0.08 * i, dur: 0.45 });
  A(r3(T.blast + 0.04), w, "lean", { to: -22, dur: 0.2, ease: "out" }); A(r3(T.blast + 0.42), w, "lean", { to: 0, dur: 0.3 });
  both(r3(T.blast + 0.6), w, "rest", 0.3);
});
bake(r3(T.blast + 0.1), 0.3, 0.6);
c.say(T.page2, "wiz", "...Page two: 'Don't.'", 0.8, "sad", { pos: 560 });
expr(T.page2, "wiz", "sad", { open: 0.08 }); look(T.page2, "wiz", [0, -0.5], 0.2);
FIVE.filter((w) => w !== "wiz").forEach((w) => { expr(r3(T.page2 - 0.2), w, "annoyed"); look(r3(T.page2 - 0.2), w, yawTo(BL[w], BL.wiz) > 0 ? [0.6, 0] : [-0.6, 0], 0.2); });
see(T.blast, T.call, ["fire", "wiz.face", "spud.face"], "effect: the wall explodes and burns; the lights are gone; the Wizard reads page two too late");

// ================================================================ 3 SO THE GUNSLINGER CALLS (P06-P07)
Object.entries(P6).forEach(([w, at]) => place(T.call, w, at, w === "gun" ? 0 : yawTo(at, P6.gun, 0.6)));
c.arm(T.call, "gun", "R", { o: [0.2, 0.62, 0.36] }, 0); c.arm(T.call, "gun", "L", "rest", 0);
expr(T.call, "gun", "smug", null, 0); look(T.call, "gun", [0.25, -0.2], 0);
["spud", "sam", "wiz", "phx"].forEach((w) => { expr(T.call, w, "shocked", { open: 0.12 }, 0); look(T.call, w, [0.6, 0], 0); });
c.cap(r3(T.call + 0.1), r3(T.lapse), "☎ \"Call-out fee: 2,000.\"", 1240, false, SUB_STYLE);
sfx(T.call, "ringtone", { gain: 0.25, reason: "the rescue line on speaker" });
act.thinkChin(c, r3(T.call + 0.35), "gun", { side: "L", hold: 2.6 });
// the time-lapse: 17 days on hold, the same spot
c.at(T.lapse, { macro: "narrate", line: "Day twenty-nine.", voice: "narrator", caption: false });
c.cap(T.lapse, T.offer, "Day twenty-nine.", 470, false, SUB_STYLE);
bake(T.lapse, 0.65, 0.9);
["spud", "sam", "wiz", "phx"].forEach((w, i) => { both(r3(T.lapse + 0.1 * i), w, "up", 0.2, "out"); expr(T.lapse, w, "terrified", { open: 0.2 }); both(r3(T.offer + 0.5), w, "rest", 0.3); });
c.cap(T.offer, T.take, "☎ \"...we could do 1,900.\"", 1240, false, SUB_STYLE);
see(T.call, T.take, ["gun.face", "phone", "fire"], "cause: the only phone, and he haggles calmly while the wall burns behind him");

// P07: Spud's face
c.say(r3(T.take + 0.03), "spud", "TAKE IT!", 0.5, "excited", { pos: 1250 });
scream(T.take, "spud", 0.4); look(T.take, "spud", [0.5, 0.1], 0);
both(T.take, "spud", { o: [0.3, 0.55, 0.3] }, 0);
see(T.take, T.counter, ["spud.face"], "Spud's panic close-up: he begs him to take the offer");

// back on the Gunslinger: one more counter-offer, and the battery dies
c.say(r3(T.counter + 0.03), "gun", "...1,850?", 0.5, "question", { pos: 1240 });
expr(T.counter, "gun", "cocky"); look(T.counter, "gun", [0.25, -0.2], 0);
c.arm(T.counter, "spud", "R", "rest", 0); c.arm(T.counter, "spud", "L", "rest", 0);
sfx(T.dead, "deflate", { gain: 0.4, reason: "the phone's battery dies" });
act.shock(c, T.dead, "gun", { open: 0.2, hold: 0.25 });
["spud", "sam", "wiz"].forEach((w) => { expr(T.dead, w, "angry"); });
see(T.counter, T.bounce, ["gun.face", "phone"], "effect: his counter-offer costs the last percent");

// ================================================================ 4 SO PHOENIX BOUNCES (P08-P09)
Object.entries(P8).forEach(([w, at]) => place(T.bounce, w, at, w === "phx" ? 0 : yawTo(at, [CAM.LOW.pos[0], CAM.LOW.pos[2]], 0.5)));
A(T.bounce, "gun", "release", { dur: 0 }); prop(T.bounce, "phone", { x: FARX }, 0.01, "linear");
c.arm(T.bounce, "gun", "R", "rest", 0); c.arm(T.bounce, "gun", "L", "rest", 0);
c.say(r3(T.bounce + 0.03), "phx", "I'll bounce us loose!", 0.7, "excited", { pos: 1250 });
expr(T.bounce, "phx", "eager", { open: 0.2 }, 0);
const HOPS = [[T.bounce + 0.2, 0.7, 8], [T.bounce + 0.6, 1.1, 4], [T.bounce + 1.05, 1.9, 1]];   // [t, height, strands left]
HOPS.forEach(([t, h, n], i) => {
  A(r3(t), "phx", "hop", { count: 1, height: h, dur: 0.4 + 0.05 * i });
  const down = r3(t + 0.4 + 0.05 * i);
  prop(down, "cable", { strands: n, whip: 1, glow: n === 1 ? 1 : 0.3 }, 0.01, "linear"); prop(r3(down + 0.02), "cable", { whip: 0 }, 0.35, "settle");
  c.at(down, { fx: "shake", dur: 0.2, amp: 0.03 + 0.02 * i });
  sfx(down, "hit-metal", { gain: 0.4, reason: "strands snap on Phoenix's landing" });
});
c.say(r3(T.bounce + 0.75), "spud", "NOT THE CABLE!", 0.6, "excited", { pos: 1250 });
["spud", "sam", "wiz", "gun"].forEach((w) => { scream(r3(T.bounce + 0.45), w, 0.3); both(r3(T.bounce + 0.45), w, "up", 0.2, "out"); look(r3(T.bounce + 0.4), w, [0, 0.9], 0.15); });
prop(T.snap, "cable", { strands: 0, whip: 1, glow: 0 }, 0.01, "linear"); prop(r3(T.snap + 0.02), "cable", { whip: 0 }, 0.5, "settle");
sfx(T.snap, "hit-metal", { gain: 0.6, loud: true, reason: "the last strand goes" });
see(T.bounce, T.fall, ["phx", "cable", "spud.face"], "cause: every hop snaps strands, and the last hop takes the last one");

// P09: free fall, the whole tower
const F9 = { spud: [0.1, 0.55, 0.9, 160], sam: [1.2, 0.35, 1.5, -25], wiz: [-1.2, 0.2, 1.7, 30], phx: [-0.5, -0.8, 2.2, -15], gun: [0.85, -0.85, 1.1, 40] };   // [x, z, y, pitch]
Object.entries(F9).forEach(([w, [x, z, y, pit]], i) => {
  place(T.fall, w, [x, z], 0);
  A(T.fall, w, "fly", { to: { x, y, z }, dur: 0.5, ease: "out" }); A(T.fall, w, "pitch", { to: pit, dur: 1.4, ease: "linear" });
  scream(T.fall, w, 0.4); both(T.fall, w, "up", 0.2, "out");
});
c.at(r3(T.fall + 0.1), { macro: "narrate", line: "Day thirty.", voice: "narrator", caption: false });
c.cap(r3(T.fall + 0.1), T.pit, "Day thirty.", 470, false, SUB_STYLE);
bake(T.fall, 0.9, 0.6);
prop(T.fall, "blobs", { show: 1 }, 0.3, "out"); prop(T.fall, "fire", { burn: 0.6 }, 0.3);
prop(T.fall, "sign", { count: 0 }, r3(T.pit - T.fall), "in");
prop(T.fall, "sparksL", { rate: 1 }, 0.1, "linear"); prop(T.fall, "sparksR", { rate: 1 }, 0.1, "linear");
c.at(T.fall, { fx: "speedlines", dur: r3(T.pit - T.fall), dir: "up" });
sfx(T.fall, "ridewind", { gain: 0.5, reason: "the car in free fall" });
see(T.fall, T.pit, ["spud.face", "sign"], "effect: the car falls the whole tower, all five floating, the sign racing down");

// ================================================================ 5 SO THE SPRING FIRES THEM BACK UP (P10-P11)
// P10: outside. The pit rushes up, the car meets the spring
const PITY = -1.0;   // the pit floor under the car when the spring is squashed flat
FIVE.forEach((w, i) => {
  const at = [[0, 0.75], [1.05, 0.55], [-1.05, 0.55], [-0.55, -0.4], [0.55, -0.4]][i];
  place(T.pit, w, at, 0); A(r3(T.pit - 0.02), w, "land", { dur: 0.01 }); A(r3(T.pit - 0.02), w, "pitch", { to: 0, dur: 0.01, ease: "linear" });
  scream(T.pit, w, 0.3);
  A(T.hit, w, "crouch", { to: 1, dur: 0.1, ease: "out" }); A(T.hit, w, "squash", { amount: 0.3, dur: 0.3 });
});
prop(T.pit, "blobs", { show: 0 }, 0.01, "linear"); prop(T.pit, "sparksL", { rate: 0 }, 0.01, "linear"); prop(T.pit, "sparksR", { rate: 0 }, 0.01, "linear");
prop(r3(T.pit - 0.02), "shell", { x: 0 }, 0.01, "linear");
prop(r3(T.pit - 0.02), "pit", { x: 0, y: -30 }, 0.01, "linear"); prop(T.pit, "pit", { y: PITY - 2.05 }, r3(T.hit - T.pit), "linear");
prop(r3(T.pit - 0.02), "spring", { x: 0, y: -30 }, 0.01, "linear"); prop(T.pit, "spring", { y: PITY - 2.05 }, r3(T.hit - T.pit), "linear");
prop(T.hit, "spring", { squash: 1, y: PITY }, 0.12, "out"); prop(T.hit, "pit", { y: PITY }, 0.12, "out");
c.at(T.hit, { fx: "impact", dur: r3(2 / 30) }); c.at(r3(T.hit + 0.03), { fx: "shake", dur: 0.4, amp: 0.08 });
sfx(T.hit, "slam", { gain: 0.7, loud: true, reason: "the car lands on the buffer spring" });
sfx(r3(T.hit + 0.1), "creak", { gain: 0.5, reason: "the spring squashed flat, loading up" });
// the launch: the spring opens, the pit drops away
prop(T.launch, "spring", { squash: 0, y: PITY - 2.05 }, 0.08, "out"); prop(T.launch, "pit", { y: PITY - 2.05 }, 0.08, "out");
prop(r3(T.launch + 0.08), "pit", { y: -34 }, 0.14, "in"); prop(r3(T.launch + 0.08), "spring", { y: -34 }, 0.14, "in");
sfx(T.launch, "seatclack", { gain: 0.7, loud: true, reason: "the spring fires the car back up" });
see(T.pit, T.up, ["spring", "spud.face"], "cause: the giant spring at the bottom, squashed flat under the car, then it fires");

// P11: inside, shooting up; floor 800 passes in one blink
const U11 = { spud: [0.45, 0.35], sam: [1.3, 0.2], wiz: [-0.5, -0.4], phx: [0.35, -0.85], gun: [-0.3, 0.5] };
Object.entries(U11).forEach(([w, at]) => { place(T.up, w, at, yawTo(at, [CAM.UP.pos[0], CAM.UP.pos[2]], 0.8)); A(T.up, w, "crouch", { to: 1, dur: 0 }); expr(T.up, w, "terrified", { open: 0.12 }, 0); A(T.up, w, "face", { lid: 0.6, dur: 0 }); });
prop(r3(T.up - 0.02), "shell", { x: FARX }, 0.01, "linear"); prop(r3(T.up - 0.02), "pit", { x: FARX }, 0.01, "linear"); prop(r3(T.up - 0.02), "spring", { x: FARX }, 0.01, "linear"); prop(r3(T.up - 0.02), "doors", { open: 1 }, 0.01, "linear");
prop(r3(T.up - 0.02), "pass", { x: 0, y: 0 }, 0.01, "linear"); prop(T.up, "pass", { y: -56 }, r3(T.space - T.up), "linear");   // the 800 opening (y 30) is level at T.f800
c.at(T.up, { fx: "speedlines", dur: r3(T.space - T.up), dir: "down" });
sfx(T.up, "rocket", { gain: 0.55, reason: "the car shooting up the shaft" });
sfx(r3(T.f800 - 0.1), "ding", { gain: 0.5, reason: "floor 800 passes" });
c.say(r3(T.f800 - 0.25), "spud", "Floor 800!", 0.5, "excited", { pos: 1250 });
c.arm(r3(T.f800 - 0.3), "spud", "L", { o: [0.5, 0.6, 0.1] }, 0.25, "out"); look(r3(T.f800 - 0.3), "spud", [0.9, 0.1], 0.12); scream(r3(T.f800 - 0.3), "spud", 0.3);
c.arm(r3(T.f800 - 0.2), "sam", "L", { o: [0.5, 0.5, 0.1] }, 0.25, "out"); look(r3(T.f800 - 0.25), "sam", [0.9, 0], 0.12);
see(T.up, T.space, ["spud.face", "pass"], "effect: floor 800 slides past the open doorway, Spud reaches for it, nothing can stop the car");

// ================================================================ 6 DAY 30, THE PAYOFF (P12)
const S12 = { spud: [0, 0.75], sam: [1.05, 0.5], wiz: [-1.05, 0.45], phx: [-0.5, -0.45], gun: [0.55, -0.5] };
Object.entries(S12).forEach(([w, at]) => { place(T.space, w, at, 0); A(r3(T.space - 0.02), w, "crouch", { to: 0, dur: 0.01 }); A(T.space, w, "face", { lid: 1, dur: 0 }); both(T.space, w, "rest", 0); look(T.space, w, [0, -0.3], 0); });
prop(r3(T.space - 0.02), "pass", { x: FARX }, 0.01, "linear"); prop(r3(T.space - 0.02), "doors", { open: 0 }, 0.01, "linear");
prop(r3(T.space - 0.02), "shell", { x: 0, count: 9999 }, 0.01, "linear"); prop(r3(T.space - 0.02), "sky", { x: 0 }, 0.01, "linear");
prop(r3(T.space - 0.02), "fire", { burn: 0 }, 0.01, "linear"); prop(r3(T.space - 0.02), "dark", { dark: 0.5 }, 0.01, "linear"); prop(r3(T.space - 0.02), "lamp", { on: 0 }, 0.01, "linear");
prop(r3(T.space - 0.02), "sign", { count: 9999 }, 0.01, "linear");
c.at(T.space, { fx: "flash", dur: 0.35, peak: 1.3, color: "#ffffff", sound: false });
sfx(T.space, "crumble", { gain: 0.7, loud: true, reason: "the car bursts through the roof" });
["wiz", "phx", "gun"].forEach((w) => expr(T.space, w, "shocked", { open: 0.22 }, 0));
expr(T.space, "spud", "shocked", { open: 0.12 }, 0); expr(T.space, "sam", "shocked", { open: 0.1 }, 0);
c.say(T.record, "sam", "...New record.", 0.7, "calm", { pos: 1250 });
expr(T.record, "sam", "smug"); look(T.record, "sam", [0, 0.1], 0.2); both(r3(T.record + 0.1), "sam", "hips", 0.3);
A(r3(T.record + 0.5), "spud", "droop", { to: 1, dur: 0.4, ease: "settle" }); expr(r3(T.record + 0.5), "spud", "deadpan"); look(r3(T.record + 0.5), "spud", [0, 0], 0.2);
// the Astronaut drifts past the open front
place(T.space, "ast", [3.6, 2.2], -40);
A(T.space, "ast", "fly", { to: { x: 3.6, y: 1.2, z: 2.2 }, dur: 0.01, ease: "linear" });
A(r3(T.record + 0.3), "ast", "fly", { to: { x: 2.35, y: 1.35, z: 2.3 }, dur: 1.6, ease: "out" });
c.arm(r3(T.astro - 0.2), "ast", "R", "wave", 0.3);
c.say(T.astro, "ast", "Going down?", 0.55, "question", { pos: 1250 });
FIVE.forEach((w) => look(r3(T.astro + 0.1), w, [0.8, 0.1], 0.2));
see(T.space, T.end, ["spud.face", "sam.face", "sky"], "the payoff: the car over the Earth, the Samurai's record, Spud's leaf drooping");
see(T.astro, T.end, ["ast.face"], "the Astronaut's line");

// ---------------------------------------------------------------- HUD: the day counter and the phone's battery
const HUD = { ...hud({
  label: "SURVIVE IT",
  day: [[0, 1], [T.wall, 12, r3(T.hot - T.wall - 0.2)], [T.lapse, 29, 0.9], [T.fall, 30, 0.3]],
  battery: [[0, 9], [T.lapse, 1, 0.9], [T.dead, 0]],
}), sky: false, clockTag: false };

// ---------------------------------------------------------------- shots
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to, dur, ease }) });
const beats = c.beats([
  ["hook: the title, the ride up", 0, sh("A", { pos: [0.1, 1.7, 7.0], look: CAM.A.look, fov: CAM.A.fov }, T.cu), "hook"],
  ["the punch", T.cu, sh("CU")],
  ["the jam", T.jam, sh("A")],
  ["the wall fills up", T.wall, sh("WALL")],
  ["the wall explodes", T.blast, sh("A")],
  ["the call", T.call, sh("GUN", { pos: [0.4, 1.0, 4.2], look: CAM.GUN.look, fov: CAM.GUN.fov }, r3(T.take - T.call))],
  ["TAKE IT", T.take, sh("SPUD")],
  ["1,850?", T.counter, sh("GUN")],
  ["the bounce", T.bounce, sh("LOW")],
  ["free fall", T.fall, sh("FALL")],
  ["the pit", T.pit, sh("PIT")],
  ["floor 800", T.up, sh("UP")],
  ["space", T.space, sh("SPACE", { pos: [0.5, 2.1, 14.2], look: CAM.SPACE.look, fov: CAM.SPACE.fov }, r3(T.end - T.space), "out"), "payoff"],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "lift",
  title: "Stuck in a lift with your friends for 30 days",
  idea: "Survive it EP2 (extreme chain with Spud): one punch jams the lift at 799, every friend's fix makes the next one necessary, and the car ends in space",
  format: "series: Survive it (title spoken at 0.0, day HUD, one cause-and-effect chain, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "elevator", seed: 3, aperture: 0, focus: false, bloom: "emissive", lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.3, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["spud", "sam", "panel"], hint: 0, what: "five friends ride a lift, the Samurai's fist is already over the door-close button" },
  hud: HUD,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "shell", from: 0, to: T.end, checks: WORN, reason: "the car's outside is one prop round the whole car: everyone inside it counts as inside it" },
    ...["pit", "spring", "pass", "sky", "blobs", "fire", "blast", "sparksL", "sparksR", "cable", "panel"].map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "set dressing round the car (shaft, spring under the floor, backdrop, fire and sparks): nobody stands in it" })),
    { who: "dark", from: 0, to: T.end, checks: WORN, reason: "see-through dark sheets on the car's walls, not a body" },
  ],
  notes: "Generated by storyboards/series/survive-it/03-lift/make-lift.mjs.",
});
