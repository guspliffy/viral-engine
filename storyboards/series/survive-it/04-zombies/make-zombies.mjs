// Survive it: "How to survive a zombie apocalypse" (version B, 10x more dangerous, realistic; Jonny's go 11 Nov 2026
// 22:59 Berlin: "i like zombie b- the extreme version. create the video").
// Jonny's target: the 12-panel sheet B (panels-sheet.png next to this file once it is in the repo) and the chain in
// /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-CHAIN-OUTLINE.md (Version B).
//
// THE BRIEF
//   Story:       five friends locked in a fifth-floor flat, hundreds of zombies in the street; hunger forces them over
//                a ladder to the shop roof, and one greedy bag of tins nearly kills them.
//   Wants:       Spud wants everyone alive and fed.
//   Consequence: the zombies follow sound, so every noise (a stomach, a falling tin) is paid for at once.
//   Ending:      all five alive on the shop roof with ONE tin: "Tomorrow we take less." A stomach growls.
//   Callback:    the car alarm that saves them in second two is the alarm that turns every face up at them later.
// REALISTIC (Jonny 11 Nov): no absurd physics, no magic, the cast keeps its usual colour. ONE CHAIN: PANELS.md.
// Opener type A (the trouble is running at frame 0). Run: node storyboards/series/survive-it/04-zombies/make-zombies.mjs
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud } from "../../../lib/overlay.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1180 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
const MUSIC = { style: "sneaky", lowCut: 150, gain: 0.45 };   // stand-in: tense from 0.0, under the voice (sound pass after the draft)
const SUB_STYLE = {};

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded DOWN to ms

// ---------------------------------------------------------------- the timeline (story seconds)
const T = {
  free: 1.45,          // P01: the car alarm starts outside, the arm lets go
  shut: 1.95,          // the wardrobe is across the door
  look: fr(2.7),       // P02 the balcony: the street flows to the car
  sound: 3.2,          // Spud: "They follow sound."
  bath: fr(4.8),       // P03 day 3: the cistern
  lid: 5.2,
  bucket: fr(6.6),     // P04 the bucket on the balcony
  talk: 7.1,           // Gunslinger: "Nobody talks about this."
  tin: fr(8.3),        // P05 day 5: the last tin
  last: 9.0,           // Spud: "Last one."
  growl: fr(10.3),     // P06 day 6: Phoenix's stomach
  press: 10.9,         // the silhouettes fill the pane, the door bulges
  hold: 11.75,         // Spud: "It won't hold."
  cross: fr(12.7),     // P07 the ladder, the big picture
  shop: fr(15.0),      // P08 the shop
  free2: 15.45,        // Gunslinger: "It's free!"
  back: fr(16.9),      // P09 on the ladder with the bag
  slip: 17.3,          // the tin slips out
  down: fr(18.3),      // P10 straight down
  hit: 18.95,          // the tin dents the car roof, the alarm
  up: 19.2,            // every face turns up
  dont: 19.55,         // Spud: "...Don't move."
  crack: fr(20.4),     // P11 the ladder cracks
  drop: 21.0,          // Spud: "Drop it!"
  let: 21.75,          // the bag falls
  burst: fr(22.9),     // P11b the flat door gives way
  run: fr(23.45),      // all five over the cracked ladder
  gone: 24.85,         // the ladder falls behind Spud
  roof: fr(25.3),      // P12 day 7, the shop roof
  less: 26.15,         // Spud: "Tomorrow we take less."
  belly: 27.2,         // the Gunslinger's stomach
  end: 28.2,
};

// ---------------------------------------------------------------- places. The street world (zstreet) sits at the world
// origin: balcony floor y 0 at x -4.9..-3.0 (z +-1.6), shop roof y 0 from x 3.0, street floor y -15, the ladder along
// x at y 1.03. The flat's rooms and the shop stand far off at y 0 (each its own zroom / zshop).
const XH = 40, XB = 70, XS = 100;         // the flat's room (front door in the back wall), the bathroom, the shop
const DOORZ = -2.2;                       // the flat room is 4.4 deep
const LAD = { x0: -3.3, y: 1.03, len: 6.7 };
const CAR = [0.1, 0.5];                   // the car whose alarm saves and betrays them: right under the ladder
const HX = -0.95, HZ = -2.5;              // the horde's ground rectangle: the whole street width, z -14.5..9.5
// the parked cars and the askew car, as rectangles [x, z, w, d] in the horde's own metres (props-zstreet.js header)
const CARS = [[-1.65, -15], [-1.65, -9], [-1.65, -3.5], [-1.65, 6], [0.7, -11.5], [0.7, -6]].map(([x, z]) => [r3(x - HX), r3(z - HZ), 2.0, 4.4]).concat([[r3(CAR[0] - HX), r3(CAR[1] - HZ), 3.4, 4.6]]);
const FIVE = ["spud", "sam", "wiz", "phx", "gun"];
const FAR = [200, 0];
// who stands where in each scene: [x, z, yaw]
const S = {
  p01: { sam: [XH + 0.3, -1.4, -12], spud: [XH - 1.95, -1.55, 80], wiz: [XH - 1.75, -0.2, 55], phx: [XH + 1.25, -1.0, -45], gun: [XH + 1.8, -0.1, -60] },
  p02: { spud: [-3.45, 0.25, 90], sam: [-3.5, -0.95, 90], gun: [-3.5, 1.2, 90], wiz: [-4.45, -0.45, 90], phx: [-4.45, 0.7, 90] },
  p03: { spud: [XB - 0.5, -0.7, 68], sam: [XB + 0.8, -0.7, -68], wiz: [XB - 0.95, 0.75, 100], gun: [XB + 1.0, 0.75, -100], phx: FAR.concat(0) },
  p04: { gun: [-4.45, -1.2, 90], phx: [-3.85, 0.3, 90], spud: [-3.55, 1.2, 90], sam: FAR.concat(0), wiz: FAR.concat(0) },
  p05: { spud: [XH + 0.05, -0.65, 0], wiz: [XH - 1.15, 0.05, 78], sam: [XH - 0.75, -0.75, 40], phx: [XH + 0.8, -0.7, -38], gun: [XH + 1.25, 0.05, -80] },
  p06: { phx: [XH + 0.1, 0.35, 0], spud: [XH - 0.75, -0.75, 25], sam: [XH + 0.95, -0.8, -25], wiz: [XH - 1.55, -0.2, 40], gun: [XH + 1.65, -0.2, -40] },
  p07: { sam: [-3.6, -0.55, 90], wiz: [-3.6, 0.55, 90], phx: [-4.4, 0, 90] },
  p08: { gun: [XS - 0.45, -0.3, 18], spud: [XS + 0.95, 0.15, -28], sam: FAR.concat(0), wiz: FAR.concat(0), phx: FAR.concat(0) },
  p12: { spud: [5.3, 0.35, 90], sam: [4.45, -0.75, 80], wiz: [4.3, 0.55, 95], phx: [4.95, 1.45, 110], gun: [5.35, -1.0, 75] },
};

const CAM = {
  DOOR: { pos: [XH + 0.2, 1.5, 3.7], look: [XH, 1.05, -1.6], fov: 44 },            // P01, P05: the flat room, the door at the back
  BALC: { pos: [0.8, 2.7, 3.2], look: [-3.3, -3.2, 0.2], fov: 62 },                // P02: the balcony above, the street below
  BATH: { pos: [XB + 0.1, 1.5, 3.0], look: [XB + 0.15, 0.85, -0.9], fov: 40 },      // P03
  BUCK: { pos: [0.6, 1.45, 0.4], look: [-4.0, 0.95, 0.1], fov: 38 },               // P04: the balcony from the street side
  GROWL: { pos: [XH + 0.1, 1.15, 2.9], look: [XH + 0.05, 1.0, -1.5], fov: 42 },     // P06: Phoenix close, the door behind him
  WIDE: { pos: [0.3, 4.6, 9.5], look: [0, -3.0, 0], fov: 50 },                     // P07, P11b: the ladder over the street
  SHOP: { pos: [XS + 0.2, 1.3, 4.7], look: [XS + 0.2, 0.9, -0.5], fov: 40 },        // P08
  LADC: { pos: [0.9, 2.5, 2.7], look: [-0.5, 0.1, 0], fov: 46 },                   // P09: close on the ladder, the street under it
  DOWN: { pos: [-0.5, 2.6, 0.35], look: [-0.55, -15, 0.3], fov: 52 },              // P10: straight down through the rungs
  VEE: { pos: [0.2, 1.2, 5.6], look: [-0.5, -0.5, 0], fov: 50 },                   // P11: the V and the drop below
  BURST: { pos: [XH + 0.2, 1.4, 3.4], look: [XH, 1.0, -1.6], fov: 46 },            // P11b: the door gives way
  ROOF: { pos: [8.4, 1.35, 1.6], look: [3.6, 0.85, 0.15], fov: 44 },               // P12: the roof, the old balcony behind
};

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [S.p01.spud[0], S.p01.spud[1]], face: "camera", expr: "terrified", follow: 0.3, seed: 1.4 },
  { id: "sam", character: "duo/samurai", at: [S.p01.sam[0], S.p01.sam[1]], face: "camera", expr: "terrified", follow: 0.3, seed: 2.3 },
  { id: "wiz", character: "never-has-money/wizard", at: [S.p01.wiz[0], S.p01.wiz[1]], face: "camera", expr: "shocked", follow: 0.3, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: [S.p01.phx[0], S.p01.phx[1]], face: "camera", expr: "shocked", follow: 0.3, seed: 4.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: [S.p01.gun[0], S.p01.gun[1]], face: "camera", expr: "shocked", follow: 0.3, seed: 5.2 },
];

const props = [
  // the street world
  { id: "street", kind: "zstreet", x: 0, y: 0, z: 0, car: CAR, alarm: 0, dent: 0, dawn: 0 },
  { id: "horde", kind: "zhorde", x: HX, y: -15, z: HZ, n: 430, box: [7.5, 24], seed: 3, avoid: CARS, gx: CAR[0] - HX, gz: CAR[1] - HZ, adv: 0, up: 0, reach: 0 },
  { id: "flood", kind: "zhorde", x: -6.3, y: 0, z: 0, n: 14, box: [1.6, 2.6], seed: 8, gx: 0.6, gz: -40, adv: 0, up: 0, reach: 0 },   // waits inside the dark room
  { id: "ladder", kind: "zladder", x: FAR[0], y: LAD.y, z: 0, len: LAD.len, sag: 0, crack: 0, drop: 0 },
  { id: "half", kind: "zladder", x: FAR[0], y: 0.04, z: 6, len: LAD.len, half: true, rot: 24 },
  // the flat's room: front door, barricade
  { id: "flat", kind: "zroom", x: XH, y: 0, z: 0, w: 4.4, d: 4.4, dress: "hall", open: [{ wall: "back", at: 0, w: 1.0, h: 2.1, y0: 0 }], dim: 0, glowx: 0, glowz: 0.3 },
  { id: "door", kind: "zdoor", x: XH, y: 0, z: DOORZ, ajar: 1, hands: 4, hole: 1, arm: 1, bulge: 0, shadows: 0, burst: 0 },
  { id: "robe", kind: "wardrobe", x: XH - 1.2, y: 0, z: DOORZ + 0.42, rot: 0 },
  { id: "couch", kind: "couch", x: XH + 1.55, y: 0, z: -1.5, rot: -90 },
  { id: "candle", kind: "pillarcandle", x: FAR[0], y: 0, z: 2, lit: 1 },
  // the bathroom
  { id: "bath", kind: "zroom", x: XB, y: 0, z: 0, w: 2.4, d: 2.6, floor: "tiles", dress: "bath", dim: 1, glowx: 0.1, glowz: 0.2 },
  { id: "cistern", kind: "zcistern", x: XB + 0.15, y: 0, z: -0.85, lid: 0, water: 1 },
  { id: "candleB", kind: "pillarcandle", x: XB + 0.15, y: 0, z: 0.35, lit: 1 },
  { id: "cup", kind: "campmug", x: XB + 0.5, y: 0.95, z: -0.55 },
  // the balcony's bucket corner (P04)
  { id: "bucket", kind: "sandbucket", x: FAR[0], y: 0, z: -4 },
  { id: "screen", kind: "curtain", x: FAR[0], y: 1.7, z: -8, rot: 90 },
  // the shop
  { id: "shop", kind: "zshop", x: XS, y: 0, z: 0, dim: 0.25 },
  { id: "bag", kind: "tinbag", x: XS + 0.15, y: 0, z: 0.0, fill: 0.3 },
  { id: "tinS", kind: "tin", scale: 1.5, x: XS + 1.2, y: 0.62, z: 0.45, open: 0 },     // Spud's one tin
  { id: "tinG", kind: "tin", scale: 1.5, x: XS - 0.2, y: 0.95, z: 0.1, open: 0 },      // the tin in the Gunslinger's hand, later the one that falls
  { id: "tinL", kind: "tin", scale: 1.5, x: FAR[0], y: 0, z: 10, open: 1 },            // the last tin of day 5
  { id: "spoon", kind: "spoon", x: FAR[0], y: 0.02, z: 12 },
];

// small helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { c.arm(t, who, "R", pose, dur, ease); c.arm(t, who, "L", pose, dur, ease); };
const REST = "rest";
// the cut cheat: on the ground at [x, z, yaw] two hundredths before the cut
const stand = (t, who, [x, z, yaw = 0]) => {
  const t0 = r3(t - 0.02);
  A(t0, who, "land", { dur: 0.01 }); A(t0, who, "pitch", { to: 0, dur: 0.01, ease: "linear" });
  A(t0, who, "move", { to: [x, z], dur: 0.01, steps: 0, ease: "linear" }); A(t0, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" });
};
// in the air (on the ladder, hanging): the body's base at [x, y, z], pitched, turned
const air = (t, who, [x, y, z], yaw, pitch, dur = 0.01, ease = "linear") => {
  A(t, who, "fly", { to: { x, y, z }, dur, ease }); A(t, who, "pitch", { to: pitch, dur: Math.max(0.01, dur), ease: "linear" });
  if (yaw != null) A(t, who, "turn", { to: yaw, dur: 0.01, ease: "linear" });
};
const scene = (t, places) => Object.entries(places).forEach(([w, p]) => stand(t, w, p));
const putProp = (t, id, set) => prop(r3(t - 0.02), id, set, 0.01, "linear");
// where feet stand on the ladder at world x (the formula in props-zstreet.js's header)
const ladY = (x, sag = 0, crack = 0) => { const u = Math.min(1, Math.max(0, (x - LAD.x0) / LAD.len)); return r3(LAD.y + 0.056 - 0.35 * sag * 4 * u * (1 - u) * (1 - crack) - 1.3 * crack * (1 - Math.abs(2 * u - 1))); };

// ---------------------------------------------------------------- the narrator (voice 1): the title from 0.0, then only the days
c.at(0.0, { macro: "narrate", line: "How to survive a zombie apocalypse.", voice: "narrator", caption: false });
c.cap(0.0, r3(T.look - 0.03), "How to survive a zombie apocalypse", 1180, false, SUB_STYLE);

// ================================================================ P01 DAY 1 (0 - 2.7): the door. Opener A: the fight is running
// The door is a hand's width open, hands claw through the gap, one arm through a broken plank holds the Samurai by
// the sash. Spud rams the wardrobe toward the door. BECAUSE a car alarm starts in the street, the zombies let go.
A(0, "sam", "lean", { to: 16, dur: 0 }); both(0, "sam", { o: [0.2, 0.55, 0.3] }, 0);
expr(0, "sam", "terrified", { open: 0.36 }, 0);
both(0, "spud", { o: [0.12, 0.5, 0.34] }, 0); A(0, "spud", "lean", { to: 14, dur: 0 }); expr(0, "spud", "angry", { open: 0.2 }, 0);
["wiz", "phx", "gun"].forEach((w) => { expr(0, w, "terrified", { open: 0.28 }, 0); both(0, w, "cheeks", 0); look(0, w, [XH, DOORZ], 0); });
for (let i = 0; i < 5; i++) A(r3(0.05 + i * 0.28), "sam", "lean", { to: i % 2 ? 12 : 20, dur: 0.14 });   // he strains against the grip
sfx(0, "knock-tap", { gain: 0.5, reason: "fists and bodies against the flat door" });
sfx(0.05, "groan", { gain: 0.45, dur: 1.5, reason: "the zombies at the door" });
c.at(0.02, { fx: "shake", dur: 0.5, amp: 0.03 });
sfx(T.free, "horn", { gain: 0.3, reason: "a car alarm starts down in the street (stand-in for an alarm)" });
sfx(r3(T.free + 0.45), "horn", { gain: 0.3, reason: "the car alarm goes on" });
FIVE.forEach((w) => look(r3(T.free + 0.1), w, [XH - 3, 1], 0.15));   // every head turns to the sound
prop(r3(T.free + 0.15), "door", { arm: 0, hands: 0 }, 0.3, "in");
A(r3(T.free + 0.2), "sam", "lean", { to: 0, dur: 0.2 }); A(r3(T.free + 0.2), "sam", "move", { to: [XH + 0.75, -0.55], dur: 0.4, steps: 2 });
expr(r3(T.free + 0.2), "sam", "shocked", { open: 0.2 });
// Spud shoves the wardrobe across the door
A(r3(T.free + 0.1), "spud", "move", { to: [XH - 0.9, -1.55], dur: r3(T.shut - T.free - 0.1), steps: 3 });
prop(r3(T.free + 0.1), "robe", { x: XH - 0.12 }, r3(T.shut - T.free - 0.1), "in");
prop(r3(T.shut - 0.12), "door", { ajar: 0 }, 0.1, "in");
sfx(T.shut, "slam", { gain: 0.6, loud: true, reason: "the wardrobe hits the door shut" });
c.at(T.shut, { fx: "shake", dur: 0.25, amp: 0.05 });
A(r3(T.shut + 0.05), "spud", "lean", { to: 0, dur: 0.2 }); expr(r3(T.shut + 0.1), "spud", "shocked", { open: 0.12 });
A(r3(T.shut + 0.15), "spud", "turn", { to: 20, dur: 0.3 });
see(0, T.free, ["sam.face", "spud", "door"], "P01: the door fight: hands in the gap, the arm on the Samurai, Spud and the wardrobe");
see(T.free, T.look, ["spud.face", "door", "robe"], "the alarm outside: the hands let go, the wardrobe shuts the door");

// ================================================================ P02 DAY 1 (2.7 - 4.8): the balcony. They follow sound.
scene(T.look, S.p02);
prop(T.free, "street", { alarm: 1 }, 0.05);
prop(T.free, "horde", { adv: 5.5 }, r3(T.bath - T.free), "linear");
FIVE.forEach((w) => { expr(r3(T.look - 0.02), w, "shocked", { open: 0.1 }, 0.01); both(r3(T.look - 0.02), w, REST, 0.01); look(r3(T.look - 0.02), w, [CAR[0], CAR[1] + 3], 0.01); A(r3(T.look - 0.02), w, "lean", { to: 12, dur: 0.01 }); });
c.arm(r3(T.sound - 0.3), "spud", "R", { o: [0.03, 0.62, 0.2] }, 0.25);   // a finger on his lips
c.say(T.sound, "spud", "They follow sound.", 1.1, "whisper", { sub: false });
c.cap(T.sound, r3(T.bath - 0.03), "They follow sound.", 1180, false, SUB_STYLE);
sfx(T.look, "horn", { gain: 0.22, reason: "the car alarm, far below" }); sfx(r3(T.look + 0.5), "horn", { gain: 0.22, reason: "the car alarm" });
sfx(r3(T.look + 1.0), "horn", { gain: 0.22, reason: "the car alarm" }); sfx(r3(T.look + 1.5), "horn", { gain: 0.22, reason: "the car alarm" });
sfx(T.look, "groan", { gain: 0.25, dur: 2.0, reason: "hundreds of zombies shuffling to the car" });
see(T.look, T.bath, ["spud.face", "street", "horde"], "P02: from the balcony: the whole street flows to the flashing car");

// ================================================================ P03 DAY 3 (4.8 - 6.6): no water. The cistern.
scene(T.bath, S.p03);
putProp(T.bath, "street", { alarm: 0 });
c.at(T.bath, { macro: "narrate", line: "Day three. No water.", voice: "narrator", caption: false });
c.cap(T.bath, r3(T.bucket - 0.03), "Day three. No water.", 1180, false, SUB_STYLE);
FIVE.forEach((w) => { expr(r3(T.bath - 0.02), w, "sad", { curve: -0.2 }, 0.01); A(r3(T.bath - 0.02), w, "lean", { to: 0, dur: 0.01 }); both(r3(T.bath - 0.02), w, REST, 0.01); look(r3(T.bath - 0.02), w, [XB + 0.15, -0.95], 0.01); });
both(r3(T.bath - 0.02), "spud", { o: [0.14, 0.62, 0.3] }, 0.01);
both(T.lid, "spud", { o: [0.16, 0.86, 0.3] }, 0.45); prop(T.lid, "cistern", { lid: 1 }, 0.5, "inOut");
sfx(T.lid, "scrape", { gain: 0.3, reason: "the china lid comes off the cistern" });
c.arm(r3(T.lid + 0.45), "sam", "L", { o: [0.3, 0.6, 0.3] }, 0.35); prop(r3(T.lid + 0.45), "cup", { x: XB + 0.32, y: 0.78, z: -0.8 }, 0.4, "inOut");
prop(r3(T.lid + 0.95), "cup", { y: 0.95, z: -0.6 }, 0.35, "inOut"); c.arm(r3(T.lid + 0.95), "sam", "L", { o: [0.3, 0.7, 0.25] }, 0.35);
sfx(r3(T.lid + 0.85), "plunk", { gain: 0.3, reason: "the cup dips into the last clean water" });
expr(r3(T.lid + 1.0), "sam", "kind", { curve: 0.1 });
see(T.bath, T.bucket, ["spud.face", "sam.face", "cistern"], "P03: the tap is dry; the last water is in the toilet cistern");

// ================================================================ P04 DAY 3 (6.6 - 8.3): no toilet. The bucket.
scene(T.bucket, S.p04);
putProp(T.bucket, "bucket", { x: -4.5, z: -1.3 }); putProp(T.bucket, "screen", { x: -4.3, z: -0.8 });
putProp(T.bucket, "horde", { adv: 0, gx: 3.7, gz: -30 });
["gun", "phx", "spud"].forEach((w) => { expr(r3(T.bucket - 0.02), w, "deadpan", null, 0.01); both(r3(T.bucket - 0.02), w, REST, 0.01); });
A(T.bucket, "gun", "move", { to: [-4.0, -0.3], dur: 0.6, steps: 2 }); look(T.bucket, "gun", [10, -0.3], 0.01);
both(r3(T.bucket + 0.1), "gun", "hips", 0.3);                            // he sets his belt, eyes straight ahead
look(T.bucket, "phx", [10, 3], 0.01); expr(T.bucket, "phx", "focused", { curve: -0.15 }, 0.01); both(T.bucket, "phx", { o: [0.08, 0.3, 0.18] }, 0.01);
look(T.bucket, "spud", [0, 40], 0.01);
c.say(T.talk, "gun", "Nobody talks about this.", 1.0, "calm", { sub: false });
c.cap(T.talk, r3(T.tin - 0.03), "Nobody talks about this.", 1180, false, SUB_STYLE);
A(r3(T.talk + 0.7), "phx", "move", { to: [-4.35, -0.75], dur: 0.5, steps: 2 });
see(T.bucket, T.tin, ["gun.face", "phx.face", "bucket"], "P04: a bucket behind a screen on the balcony; nobody meets anybody's eyes");

// ================================================================ P05 DAY 5 (8.3 - 10.3): the last tin, one spoon
scene(T.tin, S.p05);
putProp(T.tin, "flat", { dim: 1 }); putProp(T.tin, "door", { hole: 1, ajar: 0, bulge: 0.1 });
putProp(T.tin, "robe", { x: XH - 0.12 }); putProp(T.tin, "couch", { x: XH + 0.75, z: -1.2, rot: -160 });
putProp(T.tin, "candle", { x: XH + 0.45, z: 0.55 }); putProp(T.tin, "tinL", { x: XH, y: 0, z: 0.3 }); putProp(T.tin, "spoon", { x: XH - 0.25, y: 0.5, z: -0.2 });
putProp(T.tin, "bucket", { x: FAR[0] }); putProp(T.tin, "screen", { x: FAR[0] });
c.at(T.tin, { macro: "narrate", line: "Day five.", voice: "narrator", caption: false });
FIVE.forEach((w) => { expr(r3(T.tin - 0.02), w, "sad", { curve: -0.25, lidL: 0.3, lidR: 0.3 }, 0.01); both(r3(T.tin - 0.02), w, "lap", 0.01); look(r3(T.tin - 0.02), w, [XH, 0.3], 0.01); });
A(r3(T.tin - 0.02), "wiz", "lean", { to: -10, dur: 0.01 });               // too weak to sit up: the Samurai props him
c.arm(r3(T.tin - 0.02), "sam", "R", { o: [0.3, 0.5, 0.1] }, 0.01);
c.arm(r3(T.tin + 0.1), "spud", "R", { o: [0.28, 0.5, 0.3] }, 0.5); prop(r3(T.tin + 0.1), "spoon", { x: XH - 0.7, y: 0.52, z: -0.1 }, 0.6, "inOut");
c.say(T.last, "spud", "Last one.", 0.7, "whisper", { sub: false });
c.cap(T.last, r3(T.growl - 0.03), "Last one.", 1180, false, SUB_STYLE);
c.arm(r3(T.last + 0.5), "wiz", "L", { o: [0.25, 0.48, 0.3] }, 0.4);
see(T.tin, T.growl, ["spud.face", "wiz.face", "tinL"], "P05: one tin for five, one spoon; the Wizard too weak to sit up; the barricaded door behind");

// ================================================================ P06 DAY 6 (10.3 - 12.7): the growl. It won't hold.
scene(T.growl, S.p06);
putProp(T.growl, "flat", { dim: 0.35 }); putProp(T.growl, "candle", { x: FAR[0] }); putProp(T.growl, "tinL", { x: FAR[0] }); putProp(T.growl, "spoon", { x: FAR[0] });
FIVE.forEach((w) => { expr(r3(T.growl - 0.02), w, "sad", { curve: -0.15 }, 0.01); both(r3(T.growl - 0.02), w, REST, 0.01); A(r3(T.growl - 0.02), w, "lean", { to: 0, dur: 0.01 }); });
sfx(r3(T.growl + 0.1), "rumble", { gain: 0.5, dur: 0.6, reason: "Phoenix's stomach growls, far too loud" });
both(r3(T.growl + 0.1), "phx", { o: [0.06, 0.34, 0.2] }, 0.15); expr(r3(T.growl + 0.15), "phx", "shocked", { open: 0.12 });
["spud", "sam", "wiz", "gun"].forEach((w) => { look(r3(T.growl + 0.3), w, [XH + 0.1, 0.35], 0.12); expr(r3(T.growl + 0.35), w, "terrified", { open: 0.15 }); });
prop(T.press, "door", { shadows: 12 }, 0.7, "linear"); prop(r3(T.press + 0.2), "door", { bulge: 0.85 }, 1.2, "in");
sfx(T.press, "groan", { gain: 0.5, dur: 1.6, reason: "a dozen zombies press on the door" });
sfx(r3(T.press + 0.3), "creak", { gain: 0.5, reason: "the door bows inward" });
sfx(r3(T.press + 0.9), "crumble", { gain: 0.4, reason: "the frame splits" });
c.at(r3(T.press + 0.3), { fx: "shake", dur: 0.9, amp: 0.025 });
[["spud", [XH - 0.55, -1.3]], ["sam", [XH + 0.5, -1.3]], ["wiz", [XH - 1.3, -1.1]], ["gun", [XH + 1.3, -1.1]]].forEach(([w, to], i) => {
  A(r3(T.press + 0.25 + i * 0.05), w, "move", { to, dur: 0.45, steps: 2 }); A(r3(T.press + 0.3), w, "turn", { to: i % 2 ? -150 : 150, dur: 0.3 });
  both(r3(T.press + 0.5), w, { o: [0.14, 0.55, 0.32] }, 0.2);
});
look(r3(T.press + 0.1), "phx", [XH, DOORZ], 0.15); expr(r3(T.press + 0.2), "phx", "terrified", { open: 0.3 });
A(r3(T.hold - 0.15), "spud", "turn", { to: 35, dur: 0.2 });
c.say(T.hold, "spud", "It won't hold.", 0.8, "excited", { sub: false });
c.cap(T.hold, r3(T.cross - 0.03), "It won't hold.", 1180, false, SUB_STYLE);
see(T.growl, T.press, ["phx.face"], "P06: Phoenix's stomach growls; everyone stares at him");
see(T.press, T.cross, ["phx.face", "door", "spud.face"], "the pane fills with silhouettes and the door bulges: staying is over");

// ================================================================ P07 DAY 6 (12.7 - 15.0): the ladder, five floors up
scene(T.cross, S.p07);
putProp(T.cross, "ladder", { x: LAD.x0, sag: 0.3 });
const crawl = (t, who, x0, x1, dur, sag, crack = 0, dir = 1) => {
  air(r3(t - 0.02), who, [x0, ladY(x0, sag, crack), 0], 90 * dir, 72);
  A(t, who, "fly", { to: { x: x1, y: ladY(x1, sag, crack), z: 0 }, dur, ease: "linear" });
};
crawl(T.cross, "spud", -1.3, 0.5, r3(T.shop - T.cross), 0.7);
crawl(T.cross, "gun", -2.6, -1.0, r3(T.shop - T.cross), 0.7);
prop(T.cross, "ladder", { sag: 0.8 }, 1.2, "inOut");
["spud", "gun"].forEach((w) => { expr(r3(T.cross - 0.02), w, "terrified", { open: 0.08 }, 0.01); both(r3(T.cross - 0.02), w, { o: [0.2, 0.5, 0.35] }, 0.01); });
["sam", "wiz", "phx"].forEach((w) => { expr(r3(T.cross - 0.02), w, "terrified", { open: 0.1 }, 0.01); both(r3(T.cross - 0.02), w, { o: [0.18, 0.5, 0.34] }, 0.01); A(r3(T.cross - 0.02), w, "lean", { to: 12, dur: 0.01 }); look(r3(T.cross - 0.02), w, [0, 0], 0.01); });
sfx(T.cross, "windswell", { gain: 0.12, reason: "wind five floors up" });
sfx(r3(T.cross + 0.4), "creak", { gain: 0.35, reason: "the ladder bends under two" });
sfx(T.cross, "groan", { gain: 0.2, dur: 2.2, reason: "the street, far below" });
see(T.cross, T.shop, ["spud", "gun", "ladder", "horde"], "P07: a ladder from the balcony to the shop roof, hundreds of zombies under it, none looking up");

// ================================================================ P08 DAY 6 (15.0 - 16.9): the shop. It's free!
scene(T.shop, S.p08);
expr(r3(T.shop - 0.02), "gun", "delighted", { curve: 0.5 }, 0.01); expr(r3(T.shop - 0.02), "spud", "sad", { curve: -0.2, browL: 0.3 }, 0.01);
both(r3(T.shop - 0.02), "gun", { o: [0.2, 0.5, 0.3] }, 0.01);
c.arm(r3(T.shop - 0.02), "spud", "R", { o: [0.26, 0.42, 0.3] }, 0.01); c.arm(r3(T.shop - 0.02), "spud", "L", REST, 0.01);
look(r3(T.shop - 0.02), "gun", [XS + 0.15, 0], 0.01); look(r3(T.shop - 0.02), "spud", [XS - 0.45, -0.3], 0.01);
prop(T.shop, "bag", { fill: 1 }, r3(T.back - T.shop - 0.3), "linear");
for (let i = 0; i < 4; i++) {                                              // tin after tin into the bag
  const t = r3(T.shop + 0.05 + i * 0.42);
  c.arm(t, "gun", "R", { o: [0.32, 0.72, 0.3] }, 0.16, "out"); c.arm(r3(t + 0.2), "gun", "R", { o: [0.3, 0.34, 0.34] }, 0.16, "in");
  prop(t, "tinG", { x: XS - 0.15, y: 1.0, z: 0.15 }, 0.16, "out"); prop(r3(t + 0.2), "tinG", { x: XS + 0.12, y: 0.55, z: 0.1 }, 0.16, "in");
  sfx(r3(t + 0.36), "tink", { gain: 0.3, reason: "a tin drops into the bag" });
}
c.say(T.free2, "gun", "It's free!", 0.7, "excited", { sub: false });
c.cap(T.free2, r3(T.back - 0.03), "It's free!", 1180, false, SUB_STYLE);
c.arm(r3(T.free2 + 0.5), "spud", "L", { o: [0.3, 0.62, 0.28] }, 0.25);       // a flat hand: enough
expr(r3(T.free2 + 0.5), "spud", "stern", { curve: -0.25 });
see(T.shop, T.back, ["gun.face", "spud.face", "bag"], "P08: the Gunslinger stuffs a bag far too heavy; Spud, with one tin, signals enough");

// ================================================================ P09 DAY 6 (16.9 - 18.3): back on the ladder. A tin slips.
const GX = CAR[0];                                                          // the Gunslinger stops right above the car
putProp(T.back, "ladder", { sag: 1 });
air(r3(T.back - 0.02), "gun", [GX + 0.9, ladY(GX + 0.9, 1), 0], -90, 72); A(T.back, "gun", "fly", { to: { x: GX, y: ladY(GX, 1), z: 0 }, dur: r3(T.down - T.back), ease: "linear" });
air(r3(T.back - 0.02), "spud", [GX + 2.4, ladY(GX + 2.4, 1), 0], -90, 72); A(T.back, "spud", "fly", { to: { x: GX + 1.6, y: ladY(GX + 1.6, 1), z: 0 }, dur: r3(T.down - T.back), ease: "linear" });
["sam", "wiz", "phx"].forEach((w) => stand(T.back, w, S.p07[w]));
putProp(T.back, "bag", { x: GX + 0.95, y: r3(ladY(GX + 0.9, 1) + 0.55), z: 0, fill: 1 });
prop(T.back, "bag", { x: GX + 0.05, y: r3(ladY(GX, 1) + 0.55) }, r3(T.down - T.back), "linear");
putProp(T.back, "tinS", { x: FAR[0] });
putProp(T.back, "tinG", { x: GX + 0.75, y: r3(ladY(GX + 0.9, 1) + 1.25), z: 0.12 });
prop(T.back, "tinG", { x: GX + 0.25, y: r3(ladY(GX, 1) + 1.25) }, r3(T.slip - T.back), "linear");
// the fall: 15.5 m in 1.78 s (free fall), straight down onto the car roof
prop(T.slip, "tinG", { x: GX + 0.1, y: -13.75, z: CAR[1], roll: 540 }, r3(T.hit - T.slip), "in");
expr(r3(T.back - 0.02), "gun", "focused", { curve: 0.1 }, 0.01); expr(r3(T.back - 0.02), "spud", "terrified", { open: 0.06 }, 0.01);
expr(r3(T.slip + 0.15), "spud", "terrified", { open: 0.3 }); look(r3(T.slip + 0.1), "spud", [GX, 0], 0.1);
expr(r3(T.slip + 0.3), "gun", "shocked", { open: 0.2 });
sfx(T.back, "creak", { gain: 0.45, reason: "the ladder bent deep under the bag" });
sfx(T.slip, "tink", { gain: 0.4, reason: "a tin slips out of the bag" });
see(T.back, T.down, ["gun", "bag", "tinG", "spud.face"], "P09: the bag bends the ladder; one tin slips out and falls");

// ================================================================ P10 DAY 6 (18.3 - 20.4): straight down. Every face turns up.
putProp(T.down, "horde", { adv: 0, gx: CAR[0] - HX, gz: CAR[1] - HZ });
sfx(T.hit, "slam", { gain: 0.7, loud: true, reason: "the tin dents the car roof" });
prop(T.hit, "street", { dent: 1 }, 0.05); prop(r3(T.hit + 0.05), "street", { alarm: 1 }, 0.05);
c.at(T.hit, { fx: "shake", dur: 0.25, amp: 0.04 });
sfx(r3(T.hit + 0.1), "horn", { gain: 0.5, reason: "the car alarm (stand-in)" }); sfx(r3(T.hit + 0.6), "horn", { gain: 0.5, reason: "the car alarm" }); sfx(r3(T.hit + 1.1), "horn", { gain: 0.5, reason: "the car alarm" });
prop(T.up, "horde", { up: 1 }, 0.7, "linear");
sfx(T.up, "groan", { gain: 0.6, dur: 1.4, reason: "hundreds of zombies, all looking up" });
c.say(T.dont, "spud", "...Don't move.", 0.8, "whisper", { sub: false });
c.cap(T.dont, r3(T.crack - 0.03), "...Don't move.", 1180, false, SUB_STYLE);
see(T.down, T.crack, ["horde", "street", "ladder"], "P10: the tin hits the car, the alarm; hundreds of faces turn straight up");

// ================================================================ P11 DAY 6 (20.4 - 22.9): the ladder cracks. Drop it!
prop(T.crack, "ladder", { crack: 1 }, 0.18, "in");
sfx(T.crack, "crumble", { gain: 0.7, loud: true, reason: "both rails snap in the middle" });
c.at(T.crack, { fx: "impact", dur: r3(2 / 30) }); c.at(r3(T.crack + 0.07), { fx: "shake", dur: 0.35, amp: 0.07 });
const HANG = [GX + 0.25, r3(ladY(GX + 0.25, 1, 1) - 1.05), 0.05];          // he hangs under the rung by one hand
air(r3(T.crack + 0.02), "gun", HANG, 0, 0, 0.16, "in"); c.arm(r3(T.crack + 0.02), "gun", "L", "up", 0.12); c.arm(r3(T.crack + 0.02), "gun", "R", { o: [0.3, 0.2, 0.05] }, 0.12);
prop(r3(T.crack + 0.02), "bag", { x: r3(HANG[0] + 0.45), y: r3(HANG[1] - 0.45), z: 0.1 }, 0.18, "in");
air(r3(T.crack + 0.02), "spud", [GX - 0.7, r3(ladY(GX - 0.7, 1, 1) + 0.02), 0], 90, 80, 0.2, "out");   // flat on the ladder above him
both(r3(T.crack + 0.2), "spud", { o: [0.12, 0.3, 0.45] }, 0.15);
expr(r3(T.crack + 0.05), "gun", "terrified", { open: 0.4 }); expr(r3(T.crack + 0.05), "spud", "angry", { open: 0.3 });
look(r3(T.crack + 0.3), "gun", [HANG[0] + 0.45, 2], 0.2);                   // he looks at the bag
c.say(T.drop, "spud", "Drop it!", 0.6, "excited", { sub: false });
c.cap(T.drop, r3(T.let - 0.03), "Drop it!", 1180, true, SUB_STYLE);
prop(r3(T.drop + 0.1), "horde", { reach: 1 }, 0.5);
expr(r3(T.let - 0.2), "gun", "sad", { curve: -0.4 }); c.arm(T.let, "gun", "R", REST, 0.2);
prop(T.let, "bag", { y: -14.6, roll: 200 }, 1.74, "in");
sfx(T.let, "whoosh", { gain: 0.3, reason: "the bag falls into the street" });
A(r3(T.let + 0.25), "gun", "fly", { to: { x: GX - 0.2, y: r3(ladY(GX - 0.2, 1, 1) + 0.02), z: 0 }, dur: 0.6, ease: "out" });
A(r3(T.let + 0.25), "gun", "pitch", { to: 70, dur: 0.6, ease: "out" }); A(r3(T.let + 0.25), "gun", "turn", { to: -90, dur: 0.3 });
see(T.crack, T.burst, ["gun.face", "spud.face", "bag", "ladder"], "P11: the ladder hangs in a V; he dangles by one hand, the bag in the other, until he lets it go");

// ================================================================ P11b DAY 6 (22.9 - 25.3): the door gives way; all five cross
// NOT in the panels: how the other three reach the roof (Jonny is told in the draft message).
["sam", "wiz", "phx"].forEach((w) => stand(T.burst, w, [FAR[0], 3 + FIVE.indexOf(w), 0]));
putProp(T.burst, "flat", { dim: 0.35 }); putProp(T.burst, "door", { shadows: 12, bulge: 1 });
prop(T.burst, "door", { burst: 1 }, 0.3, "in"); prop(T.burst, "robe", { tip: 80, z: DOORZ + 1.3 }, 0.35, "in");
sfx(T.burst, "slam", { gain: 0.8, loud: true, reason: "the flat door bursts in" });
c.at(r3(T.burst + 0.1), { fx: "shake", dur: 0.3, amp: 0.06 });
sfx(r3(T.burst + 0.1), "groan", { gain: 0.6, dur: 2.2, reason: "the zombies pour into the flat" });
// the run over the V: the Samurai, Wizard and Phoenix lead, the Gunslinger, Spud last
const RUNX = { sam: [0.4, 3.5], wiz: [-0.5, 3.1], phx: [-1.3, 2.4], gun: [-2.2, 1.5], spud: [-2.9, 0.6] };
Object.entries(RUNX).forEach(([w, [x0, x1]]) => {
  air(r3(T.run - 0.02), w, [x0, ladY(x0, 1, 1), 0], 90, 66);
  A(T.run, w, "fly", { to: { x: x1, y: ladY(x1, 1, 1), z: 0 }, dur: r3(T.gone - T.run), ease: "linear" });
  expr(r3(T.run - 0.02), w, "terrified", { open: 0.3 }, 0.01); both(r3(T.run - 0.02), w, { o: [0.2, 0.5, 0.35] }, 0.01);
});
putProp(T.run, "horde", { reach: 1, up: 1 });
prop(T.run, "flood", { gx: 9, gz: 0, adv: 2.6 }, r3(T.gone - T.run), "linear");
c.say(r3(T.run + 0.1), "spud", "GO! GO!", 0.7, "excited", { sub: false });
c.cap(r3(T.run + 0.1), r3(T.gone - 0.03), "GO! GO!", 1180, true, SUB_STYLE);
// everyone makes the roof; Spud jumps as the ladder goes
Object.entries(RUNX).forEach(([w, [, x1]], i) => { A(T.gone, w, "fly", { to: { x: 4.2 + i * 0.25, y: 0.3, z: -1.2 + i * 0.6 }, dur: 0.4, ease: "out" }); A(T.gone, w, "pitch", { to: 20, dur: 0.3 }); });
prop(T.gone, "ladder", { drop: 1 }, 1.7, "in");
sfx(T.gone, "hit-metal", { gain: 0.5, reason: "the ladder tears loose" });
see(T.burst, T.run, ["door"], "the flat door bursts: no way back");
see(T.run, T.roof, ["spud", "ladder", "flood", "horde"], "all five scramble over the cracked ladder; the zombies reach the balcony; the ladder falls");

// ================================================================ P12 DAY 7 (25.3 - 28.2): the roof. Tomorrow we take less.
scene(T.roof, S.p12);
putProp(T.roof, "street", { dawn: 1, alarm: 0 }); putProp(T.roof, "ladder", { x: FAR[0] }); putProp(T.roof, "half", { x: 4.7, z: 2.6 });
putProp(T.roof, "flood", { adv: 2.6, gx: 0.6, gz: -40 }); putProp(T.roof, "horde", { up: 0, reach: 0 });
putProp(T.roof, "tinL", { x: 6.0, y: 0, z: 0.25, open: 1 }); putProp(T.roof, "spoon", { x: 5.75, y: 0.5, z: 0.5 });
c.at(T.roof, { macro: "narrate", line: "Day seven.", voice: "narrator", caption: false });
FIVE.forEach((w) => { expr(r3(T.roof - 0.02), w, "sad", { curve: -0.1, lidL: 0.35, lidR: 0.35 }, 0.01); both(r3(T.roof - 0.02), w, "lap", 0.01); look(r3(T.roof - 0.02), w, [6.0, 0.25], 0.01); });
look(r3(T.less - 0.2), "spud", [20, 0.4], 0.2);
c.say(T.less, "spud", "Tomorrow we take less.", 1.0, "whisper", { sub: false });
c.cap(T.less, r3(T.end - 0.05), "Tomorrow we take less.", 1180, false, SUB_STYLE);
sfx(T.belly, "rumble", { gain: 0.5, dur: 0.5, reason: "the Gunslinger's stomach" });
both(T.belly, "gun", { o: [0.06, 0.34, 0.2] }, 0.15); expr(r3(T.belly + 0.05), "gun", "shocked", { open: 0.1 });
["spud", "sam", "wiz", "phx"].forEach((w) => look(r3(T.belly + 0.2), w, [5.35, -1.0], 0.12));
prop(r3(T.belly + 0.25), "flood", { gx: 9, gz: 0 }, 0.4, "inOut");          // across the street every head turns to them
see(T.roof, T.end, ["spud.face", "gun.face", "tinL", "flood"], "P12: all five alive on the roof with one tin; a stomach growls and the old balcony turns to look");

// ---------------------------------------------------------------- HUD: the day
const HUD = { ...hud({ label: "SURVIVE IT", day: [[0, 1], [T.bath, 3], [T.tin, 5], [T.growl, 6], [T.roof, 7]] }), sky: false, clockTag: false };

// ---------------------------------------------------------------- shots
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to: { fov: CAM[k].fov, look: CAM[k].look, ...to }, dur, ease }) });
const beats = c.beats([
  ["P01 the door fight", 0, sh("DOOR", { pos: [XH + 0.2, 1.45, 3.3] }, T.look), "hook"],
  ["P02 they follow sound", T.look, sh("BALC")],
  ["P03 day 3, the cistern", T.bath, sh("BATH")],
  ["P04 the bucket", T.bucket, sh("BUCK")],
  ["P05 day 5, the last tin", T.tin, sh("DOOR", { pos: [XH + 0.15, 1.45, 3.4] }, r3(T.growl - T.tin))],
  ["P06 the growl, the door bulges", T.growl, sh("GROWL")],
  ["P07 the ladder", T.cross, sh("WIDE", { pos: [0.3, 4.4, 9.0] }, r3(T.shop - T.cross))],
  ["P08 it's free", T.shop, sh("SHOP")],
  ["P09 a tin slips", T.back, sh("LADC")],
  ["P10 every face turns up", T.down, sh("DOWN")],
  ["P11 the ladder cracks", T.crack, sh("VEE")],
  ["P11b the door gives way", T.burst, sh("BURST")],
  ["P11b all five cross", T.run, sh("WIDE")],
  ["P12 day 7, the roof", T.roof, sh("ROOF", { pos: [8.1, 1.3, 1.5] }, r3(T.end - T.roof), "out"), "payoff"],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "zombies",
  title: "How to survive a zombie apocalypse",
  idea: "Survive it (realistic): five friends in a fifth-floor flat over a street full of zombies that hunt by sound; hunger sends them over a ladder to the shop roof, and one greedy bag of tins nearly kills them",
  format: "series: Survive it (title spoken at 0.0, day HUD, one cause-and-effect chain, realistic, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "plain", color: "#a9afb3", floor: "none", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.06, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["sam", "spud", "door"], hint: 0, what: "opener A: the flat door is being forced at frame 0, a zombie arm holds the Samurai, Spud rams a wardrobe against it" },
  hud: HUD,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["street", "horde", "flood", "flat", "bath", "shop", "ladder", "half", "door", "screen"].map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "the world the cast stands in and on (rooms, balcony, roof, ladder, door, crowd): not a body" })),
  ],
  notes: "Generated by storyboards/series/survive-it/04-zombies/make-zombies.mjs.",
});
