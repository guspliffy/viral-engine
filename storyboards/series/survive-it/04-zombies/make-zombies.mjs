// Survive it: "How to survive a zombie apocalypse" (version B, 10x more dangerous, realistic; Jonny's go 11 Nov 2026
// 22:59 Berlin: "i like zombie b- the extreme version. create the video").
// Jonny's target: the 12-panel sheet B (panels-sheet.png next to this file, PANELS.md beside it) and the chain in
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
// Jonny 12 Nov 2026: a dramatic scenario gets dramatic music. One orchestral score in three parts, joined at the story's
// seconds by engine/soundgen/score.py (score-zombies.json): dread from 0.0 (low strings, piano, timpani pulse), full
// orchestra from the tin's hit at 18.95 s (the turn), slow piano and strings on the roof from 25.3 s. If T.hit or
// T.roof move, change score-zombies.json and join again.
const MUSIC = { file: "ai/zombies-score/zombies-score-01.ogg", lock: false, dip: false, gain: 0.45 };
const SUB_STYLE = {};

const c = clip({ faces: FACES, lines: LINES }), { A: A0, sfx, see, prop } = c;
// an instant cheat (dur <= 0.012: a pose placed on a cut) is sync: true, or the timing layer's offsets start it one or
// two frames late and it pops two frames into the new shot (rig-jump at 8.37 s and five other cuts, 12 Nov 2026)
const A = (t, who, verb, o) => A0(t, who, verb, o && o.dur != null && o.dur <= 0.012 && !("sync" in o) ? { ...o, sync: true } : o);
const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded DOWN to ms

// ---------------------------------------------------------------- the timeline (story seconds)
const T = {
  free: 1.45,          // P01: the siren starts outside, the arm lets go
  shut: 2.05,          // the sofa is against the door wall, the door is shut
  look: fr(2.7),       // P02 the balcony: the street flows to the police car
  sound: 3.2,          // Spud: "They follow sound."
  bath: fr(4.8),       // P03 day 3: the cistern
  lid: 5.0,
  bucket: fr(6.6),     // P04 the balcony queue
  talk: 7.1,           // Gunslinger: "Nobody talks about this."
  tin: fr(8.3),        // P05 day 5: the last tin
  last: 9.0,           // Spud: "Last one."
  growl: fr(10.3),     // P06 day 6: Phoenix's stomach
  press: 10.8,         // the silhouettes fill the pane, the door bulges
  hold: 11.75,         // Spud: "It won't hold."
  cross: fr(12.7),     // P07 the ladder, the big picture
  shop: fr(15.0),      // P08 the shop
  free2: 15.45,        // Gunslinger: "It's free!"
  back: fr(16.9),      // P09 on the ladder with the sack
  slip: 17.3,          // the tin slips out
  down: fr(18.3),      // P10 straight down
  hit: 18.95,          // the tin hits the police car's roof, the siren
  up: 19.2,            // every face turns up
  dont: 19.55,         // Spud: "...Don't move."
  crack: fr(20.4),     // P11 the ladder cracks
  drop: 21.0,          // Spud: "Drop it!"
  let: 21.75,          // the sack falls
  burst: fr(22.9),     // P11b the flat door gives way
  run: fr(23.8),      // all five over the cracked ladder
  gone: 24.85,         // the zombies reach the ladder's end
  roof: fr(25.3),      // P12 day 7, the shop roof
  less: 26.15,         // Spud: "Tomorrow we take less."
  belly: 27.2,         // the Gunslinger's stomach
  end: 28.2,
};

// ---------------------------------------------------------------- places. The street world (zstreet) sits at the world
// origin: balcony floor y 0 at x -4.9..-3.0 (z +-1.6), shop roof y 0 from x 3.0, street floor y -15, the ladder along
// x at y 1.03. The flat's room, the bathroom and the shop stand far off at y 0 (each its own zroom / zshop).
const XH = 40, XB = 70, XS = 100;
// the flat's front door is in the LEFT wall (the sheet shows it at the frame's left edge in panel 01 and behind the
// barricade in 05 and 06). The door prop is sunk 0.25 so the broken plank and the arm sit at a potato's waist.
const WALLX = XH - 2.2, DZ = -0.9, DOORY = -0.25;
const LAD = { x0: -3.3, y: 1.03, len: 6.7 };
const PA = [0.7, -13];                    // the police car far up the street (panel 02): its siren saves them on day 1
const PB = [0.55, -0.5];                  // the police car under the ladder (panel 10): its siren betrays them on day 6
const HX = -0.95, HZ = -5, HBOX = [7.5, 32];   // the horde's ground rectangle: the whole street, z -21..11
const rect = ([x, z], w, d) => [r3(x - HX), r3(z - HZ), w, d];
const PARKED = [0, 3, 5], KERB = [-1.65, -8.5];   // three of the street prop's six parked cars stay, its own loose car parks at the left kerb
const CARS = [[-1.65, -15], [-1.65, 6], [0.7, -6], KERB].map((p) => rect(p, 2.0, 4.4)).concat([rect(PA, 2.8, 4.1), rect(PB, 2.8, 4.1)]);
const FIVE = ["spud", "sam", "wiz", "phx", "gun"];
const FAR = [200, 0];
const far = (i) => [FAR[0], 3 + i * 2, 0];
const SOFA0 = [XH - 0.65, -1.75], SLIDE = -0.42, SOFAK = 1.25, SEAT = 0.5;   // panel 01: the sofa, its back to the camera; the shove to the door wall
const TINF = [XH - 0.05, DZ];                       // panel 05: the last tin on the floor
const GX = -0.25;                                  // where the Gunslinger stops on the ladder, the police car under him
const MID = r3(LAD.x0 + LAD.len / 2);              // the ladder's middle, where it breaks
const toward = ([x, z], [tx, tz]) => r3(Math.atan2(tx - x, tz - z) * 180 / Math.PI);
// who stands where in each scene: [x, z, yaw]
const S = {
  p01: { sam: [WALLX + 0.62, -0.65, 55], spud: [XH - 0.55, 0.05, -110] },
  p01sofa: { wiz: [XH - 1.2, -1.45], phx: [XH - 0.55, -2.1], gun: [XH - 0.04, -1.45] },   // staggered: the middle one behind
  p02: { spud: [-3.45, -0.25, 60], wiz: [-4.2, 1.15, 165], phx: [-3.55, 0.6, 162], gun: [-3.3, 1.65, 165], sam: far(0) },
  p03: { spud: [XB - 0.45, 0.5, 55], sam: [XB + 0.85, 0.6, -60], wiz: [XB - 0.55, -0.9, 10], phx: [XB + 0.05, -1.85, 0], gun: [XB + 0.5, -1.0, -10] },
  p04: { gun: [-4.4, -0.35, 8], phx: [-4.1, -1.25, 15], spud: [-3.4, -0.7, 35], sam: far(0), wiz: far(1) },
  p05: { phx: [XH - 0.5, DZ + 1.15], spud: [XH - 1.3, DZ + 0.75], wiz: [XH - 0.67, DZ - 0.05], sam: [XH - 1.35, DZ - 0.85], gun: [XH - 0.5, DZ - 1.15] },
  p06: { phx: [XH - 0.5, DZ - 0.42, 90], spud: [XH - 0.6, DZ + 1.55, 90], wiz: [XH - 1.42, DZ + 0.85, 90], sam: [XH - 0.6, DZ + 0.5, 90], gun: [XH - 1.42, DZ - 0.2, 90] },
  p07: { sam: [-3.6, -0.5, 90], wiz: [-3.6, 0.5, 90], phx: [-4.4, -0.25, 90] },
  p08: { gun: [XS - 1.9, -0.45, 75], spud: [XS - 0.6, -0.5, -65], sam: far(0), wiz: far(1), phx: far(2) },
  p12: { wiz: [3.75, 1.8, 90], spud: [4.5, 1.4, 90], sam: [3.75, 0.95, 90], phx: [3.75, -0.17, 90], gun: [4.5, 0.3, 90] },
};
Object.entries(S.p05).forEach(([w, p]) => p.push(toward(p, TINF)));

const CAM = {
  DOOR: { pos: [XH - 0.98, 1.7, 3.0], look: [XH - 1.1, 0.95, -1.0], fov: 54 },       // P01: the door at the frame's left edge
  BALC: { pos: [-3.4, 2.75, 1.55], look: [-0.75, -15, -9.4], fov: 60 },            // P02: above and behind the group, down the street
  BATH: { pos: [XB + 0.15, 1.85, 3.9], look: [XB + 0.12, 0.35, -0.3], fov: 44 },      // P03: over the cistern to the doorway
  QUEUE: { pos: [-3.9, 0.78, 1.5], look: [-3.95, 0.62, -1.0], fov: 74 },             // P04: on the balcony, along it
  TIN: { pos: [XH + 1.95, 1.75, DZ], look: [XH - 1.2, 0.25, DZ], fov: 78 },           // P05: over the candle and tin to the barricade
  GROWL: { pos: [XH + 2.05, 0.8, DZ], look: [XH - 1.5, 0.88, DZ], fov: 56 },         // P06: Phoenix close, the door wall behind
  HIGH: { pos: [3.5, 6.0, 4.5], look: [-1.9, -4.1, -1.3], fov: 60 },               // P07, P11b: steep, the ladder a diagonal
  SHOP: { pos: [XS - 1.2, 0.85, 3.5], look: [XS - 1.25, 0.62, -0.6], fov: 52 },     // P08
  LADC: { pos: [-2.6, 1.9, 2.9], look: [0.45, 0.65, 0], fov: 50 },                   // P09: he crawls toward us
  DOWN: { pos: [0.4, 2.7, -1.12], look: [0.4, -15, -1.17], fov: 50 },               // P10: straight down, the ladder at the bottom edge
  VEE: { pos: [MID, 2.0, 3.2], look: [MID, -0.55, 0.2], fov: 50 },                  // P11: the V from the street side, the drop below
  BURST: { pos: [XH + 2.0, 1.4, DZ + 0.3], look: [XH - 1.6, 0.8, DZ], fov: 56 },    // P11b: the door gives way
  ROOF: { pos: [8.4, 2.3, 1.0], look: [0, -0.3, 0.8], fov: 50 },                    // P12: the roof, the old house across the street
};

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [S.p01.spud[0], S.p01.spud[1]], face: "camera", expr: "angry", follow: 0.3, seed: 1.4 },
  { id: "sam", character: "duo/samurai", at: [S.p01.sam[0], S.p01.sam[1]], face: "camera", expr: "terrified", follow: 0.3, seed: 2.3 },
  { id: "wiz", character: "never-has-money/wizard", at: S.p01sofa.wiz, face: "camera", expr: "terrified", follow: 0.3, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: S.p01sofa.phx, face: "camera", expr: "terrified", follow: 0.3, seed: 4.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: S.p01sofa.gun, face: "camera", expr: "terrified", follow: 0.3, seed: 5.2 },
];

const GLASS = { kind: "waterglass", scale: 1.6 };
const props = [
  // the street world
  { id: "street", kind: "zstreet", x: 0, y: 0, z: 0, parked: PARKED, car: KERB, carRot: 5, alarm: 0, dent: 0, dawn: 0, fog: 1 },
  { id: "horde", kind: "zhorde", x: HX, y: -15, z: HZ, n: 620, box: HBOX, seed: 3, avoid: CARS, gx: PA[0] - HX, gz: PA[1] - HZ, adv: 0, up: 0, reach: 0 },
  { id: "pcarA", kind: "policecar", x: PA[0], y: -15, z: PA[1], rot: 22, scale: 1.1, lights: 0 },
  { id: "pcarB", kind: "policecar", x: PB[0], y: -15, z: PB[1], rot: 16, scale: 1.1, lights: 0 },
  { id: "flood", kind: "zhorde", x: -6.3, y: 0, z: 0, n: 14, box: [1.6, 2.6], seed: 8, gx: 0.6, gz: -40, adv: 0, up: 0, reach: 0 },   // waits inside the dark room
  { id: "flood2", kind: "zhorde", x: FAR[0], y: 3, z: 0, n: 8, box: [1.4, 2.6], seed: 5, gx: 9, gz: 0, adv: 0, up: 0, reach: 0 },     // the balcony above, day 7
  { id: "ladder", kind: "zladder", x: FAR[0], y: LAD.y, z: 0, len: LAD.len, sag: 0, crack: 0, drop: 0 },
  { id: "half", kind: "zladder", x: FAR[0], y: 0.04, z: 6, len: LAD.len, half: true, rot: 24 },
  // the balcony queue (P04)
  { id: "line", kind: "plank", x: FAR[0], y: 2.4, z: -1.45, w: 1.9, h: 0.015, t: 0.015, color: "#3b3a38" },
  { id: "cloth", kind: "plank", x: FAR[0], y: 1.5, z: -1.45, w: 1.05, h: 0.9, t: 0.02, color: "#cdbf9f" },
  { id: "chair", kind: "woodchair", x: FAR[0], y: 0, z: -0.6, rot: 195 },
  { id: "roll", kind: "tproll", x: FAR[0], y: 1.03, z: -0.35, rot: 90, scale: 1.3 },
  // the flat's room: the front door in the left wall, the sofa, the wardrobe
  { id: "flat", kind: "zroom", x: XH, y: 0, z: 0, w: 4.4, d: 4.4, dress: "living", open: [{ wall: "left", at: DZ, w: 1.0, h: 1.85, y0: 0 }], dim: 0, glowx: 0.3, glowz: DZ + 0.12 },
  { id: "door", kind: "zdoor", x: WALLX, y: DOORY, z: DZ, rot: 90, ajar: 1, hands: 4, hole: 1, arm: 1, bulge: 0, shadows: 0, burst: 0 },
  { id: "couch", kind: "couch", x: SOFA0[0], y: 0, z: SOFA0[1], rot: 180, scale: SOFAK, color: "#7b4b35", color2: "#8f5b43" },
  { id: "robe", kind: "wardrobe", x: FAR[0], y: 0, z: 20, rot: 90, scale: 0.9, apart: 0 },
  { id: "inflat", kind: "zhorde", x: FAR[0], y: 0, z: 30, n: 7, box: [0.9, 0.6], seed: 11, gx: 6, gz: 0, adv: 0, up: 0, reach: 1 },   // through the burst door (P11b)
  { id: "candle", kind: "pillarcandle", x: FAR[0], y: 0, z: 2, lit: 1 },
  // the bathroom: the doorway in the back wall, the cistern in front, its back to the camera
  { id: "bath", kind: "zroom", x: XB, y: 0, z: 0.9, w: 2.4, d: 4.4, floor: "tiles", dress: "bath", open: [{ wall: "back", at: 0.15, w: 1.0, h: 1.6, y0: 0 }], dim: 1, glowx: -0.6, glowz: -0.8 },   // back wall at z -1.3, the floor runs on under the camera
  { id: "dark", kind: "plank", x: XB + 0.15, y: 0, z: -1.95, w: 2.2, h: 2.3, t: 0.02, color: "#15110e" },
  { id: "cistern", kind: "zcistern", x: XB + 0.15, y: 0, z: 0.9, rot: 180, scale: 0.85, lid: 0, water: 1 },
  { id: "candleB", kind: "pillarcandle", x: XB - 1.0, y: 0.86, z: 0.68, lit: 1 },   // on the basin's rim
  { id: "glass", ...GLASS, x: XB + 0.45, y: 0.62, z: 0.62, fill: 0 },
  { id: "glassW", ...GLASS, x: XB - 0.49, y: 0.5, z: -0.5, fill: 0 },
  { id: "glassP", ...GLASS, x: XB + 0.05, y: 0.52, z: -1.45, fill: 0 },
  { id: "glassG", ...GLASS, x: XB + 0.72, y: 0.5, z: -0.6, fill: 0 },
  // the shop
  { id: "shop", kind: "zshop", x: XS, y: 0, z: 0, dim: 0.25 },
  { id: "bag", kind: "tinbag", x: XS - 1.38, y: 0, z: -0.1, fill: 0.35, scale: 1.2 },
  { id: "tinS", kind: "tin", scale: 1.6, x: XS - 0.85, y: 0.2, z: -0.08, open: 0 },    // Spud's one tin
  { id: "tinG", kind: "tin", scale: 1.6, x: XS - 1.75, y: 0.6, z: -0.1, open: 0 },      // the tin in the Gunslinger's hand, later the one that falls
  { id: "tinL", kind: "tin", scale: 1.6, x: FAR[0], y: 0, z: 10, open: 1 },            // the last tin of day 5, the one tin of day 7
  { id: "spoon", kind: "spoon", x: FAR[0], y: 0.02, z: 12 },
];

// props that hang on purpose (qa/support.mjs): each says why
const STAGED = {
  flood2: "zombies on the balcony one floor up (the balcony slab is part of the street set's facade)",
  ladder: "the ladder bridges the gap from our balcony to the shop roof; its ends rest on the railing and the parapet",
  line: "a washing line strung across the balcony", cloth: "the blanket hung on the washing line as a screen",
  roll: "the toilet roll stands on the balcony railing", bath: "the bathroom set, built away from the street like every room",
  dark: "the dark hallway card behind the bathroom doorway", candleB: "the candle stands on the cistern lid",
  glass: "held, or standing on the cistern", glassW: "held (rough grips: a glass at the hand)", glassP: "held, or parked far away",
  glassG: "held (a glass at the hand)", tinS: "Spud's one tin, in his hand", tinG: "in the Gunslinger's hand, then falling, then on the police car's roof",
  spoon: "held, or lying on the tin", bag: "the sack in the Gunslinger's hand, hanging under the V, then falling",
};
// small helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { arm(t, who, "R", pose, dur, ease); arm(t, who, "L", pose, dur, ease); };
const REST = "rest";
const sat = new Set();
// the cut cheat: on the ground at [x, z, yaw] two hundredths before the cut, upright, arms down
const stand = (t, who, [x, z, yaw = 0]) => {
  const t0 = r3(t - 0.02);
  if (sat.has(who)) { A(r3(t0 - 0.012), who, "stand", { dur: 0.01 }); sat.delete(who); }
  A(t0, who, "pitch", { to: 0, dur: 0.01, ease: "linear" }); A(t0, who, "lean", { to: 0, dur: 0.01 }); A(t0, who, "crouch", { to: 0, dur: 0.01 });
  A(t0, who, "move", { to: [x, z], y: 0, dur: 0.01, steps: 0, ease: "linear" }); A(t0, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" });
  both(t0, who, REST, 0.01); look(t0, who, [0, 0], 0.01);
};
// off the floor (on the sofa, hanging): the body's base at [x, y, z], pitched (about the world x axis), turned.
// A move with y, not a fly: a fly hovers, flaps and tucks the feet.
const air = (t, who, [x, y, z], yaw, pitch, dur = 0.01, ease = "linear") => {
  A(t, who, "move", { to: [x, z], y, dur, steps: 0, ease }); A(t, who, "pitch", { to: pitch, dur, ease: "linear" });
  if (yaw != null) A(t, who, "turn", { to: yaw, dur: Math.min(dur, 0.01), ease: "linear" });
};
// lying forward along +-x (dir): the body's rotation order is yaw, pitch, lean, so a pitch tips it forward the way it
// faces, about its middle: the base to move to is half a metre under where the middle should be.
const prone = (t, who, dir, th) => { A(t, who, "pitch", { to: th, dur: 0.01, ease: "linear" }); A(t, who, "lean", { to: 0, dur: 0.01 }); A(t, who, "turn", { to: dir * 90, dur: 0.01, ease: "linear" }); };
const proneAt = (dir, th, [mx, my, mz]) => [r3(mx), r3(my - 0.5), r3(mz)];
// the eyes: a look is an offset in the face ([-1..1 to the body's left (+), up (+)]), not a place in the world
const gaze = (t, who, [x, z, yaw = 0], [tx, tz], ly = 0, dur = 0.15) => { const b = (Math.atan2(tx - x, tz - z) * 180 / Math.PI - yaw) * Math.PI / 180; look(t, who, [r3(0.9 * Math.sin(b)), ly], dur); };
const sitDown = (t, who, yaw) => { A(t, who, "sit", { height: -0.06, rot: r3(yaw), dur: 0.01, hands: "keep" }); sat.add(who); };
const scene = (t, places) => Object.entries(places).forEach(([w, p]) => stand(t, w, p));
const putProp = (t, id, set) => prop(r3(t - 0.02), id, set, 0.01, "linear");
// where feet stand on the ladder at world x (the formula in props-zstreet.js's header)
const ladY = (x, sag = 0, crack = 0) => { const u = Math.min(1, Math.max(0, (x - LAD.x0) / LAD.len)); return r3(LAD.y + 0.056 - 0.35 * sag * 4 * u * (1 - u) * (1 - crack) - 1.3 * crack * (1 - Math.abs(2 * u - 1))); };
// Jonny 12 Nov 2026: speech lettering in the upper third, never over eyes or faces (tops from qa/camfit.mjs, under the DAY tag)
const CAPY = { p01: 330, p02: 310, p03: 330, p04: 330, p05: 330, p06: 320, p08: 330, p10: 330, p11: 250, run: 250, p12: 330 };
const cap = (from, to, text, k, pop = false) => c.cap(from, to, text, CAPY[k], pop, SUB_STYLE);

// ---------------------------------------------------------------- the narrator (voice 1): the title from 0.0, then only the days
c.at(0.0, { macro: "narrate", line: "How to survive a zombie apocalypse.", voice: "narrator", caption: false });
cap(0.0, r3(T.look - 0.03), "How to survive a zombie apocalypse", "p01");

// ================================================================ P01 DAY 1 (0 - 2.7): the door. Opener A: the fight is running
// The door (left edge) is a hand's width open, hands claw through the gap, one arm through a broken plank holds the
// Samurai by the sash. Spud shoves the sofa toward the door, the other three peer over its back. BECAUSE a police
// siren starts in the street, the zombies let go; the sofa goes against the door.
A(0, "sam", "turn", { to: S.p01.sam[2], dur: 0 }); A(0, "spud", "turn", { to: S.p01.spud[2], dur: 0 });
A(0, "sam", "lean", { to: -8, dur: 0 }); both(0, "sam", { o: [0.16, 0.42, 0.24] }, 0);   // he strains away from the door
expr(0, "sam", "terrified", { open: 0.3 }, 0); gaze(0, "sam", S.p01.sam, [WALLX, DZ], 0, 0);
both(0, "spud", { o: [0.14, 0.55, 0.4] }, 0); expr(0, "spud", "angry", { open: 0.2 }, 0);
Object.entries(S.p01sofa).forEach(([w, [x, z]]) => {
  air(0, w, [x, SEAT, z], 0, 0, 0); expr(0, w, "terrified", { open: 0.28 }, 0); gaze(0, w, [x, z, 0], [WALLX, DZ], -0.2, 0);
  both(0, w, w === "wiz" ? "cheeks" : w === "phx" ? REST : { o: [0.1, 0.3, 0.28] }, 0);
});
for (let i = 0; i < 5; i++) A(r3(0.05 + i * 0.28), "sam", "lean", { to: i % 2 ? -5 : -12, dur: 0.14 });   // against the grip
sfx(0, "knock-tap", { gain: 0.5, reason: "fists and bodies against the flat door" });
sfx(0.05, "groan", { gain: 0.45, dur: 1.5, reason: "the zombies at the door" });
c.at(0.02, { fx: "shake", dur: 0.5, amp: 0.03 });
sfx(T.free, "sirenwail", { gain: 0.3, dur: 1.2, reason: "a police car's siren starts down in the street" });
FIVE.forEach((w) => look(r3(T.free + 0.1), w, [0.6, 0.2], 0.15));   // every head turns to the sound
prop(r3(T.free + 0.15), "door", { arm: 0, hands: 0 }, 0.3, "in");
A(r3(T.free + 0.2), "sam", "lean", { to: 0, dur: 0.2 }); A(r3(T.free + 0.2), "sam", "move", { to: [XH - 1.55, 0.3], dur: 0.45, steps: 3 });
expr(r3(T.free + 0.2), "sam", "shocked", { open: 0.2 });
// Spud shoves the sofa to the door wall, the three ride on it
const SH = r3(T.shut - T.free - 0.1);
prop(r3(T.free + 0.1), "couch", { x: SOFA0[0] + SLIDE }, SH, "in");
Object.entries(S.p01sofa).forEach(([w, [x, z]]) => A(r3(T.free + 0.1), w, "move", { to: [r3(x + SLIDE), z], y: SEAT, dur: SH, steps: 0, ease: "in" }));
prop(r3(T.shut - 0.12), "door", { ajar: 0 }, 0.1, "in");
sfx(T.shut, "slam", { gain: 0.6, loud: true, reason: "the sofa hits the door wall, the door slams shut" });
c.at(T.shut, { fx: "shake", dur: 0.25, amp: 0.05 });
expr(r3(T.shut + 0.1), "spud", "shocked", { open: 0.12 }); both(r3(T.shut + 0.05), "spud", REST, 0.6);
A(r3(T.shut + 0.15), "spud", "turn", { to: -20, dur: 0.3 });
see(0, T.free, ["sam.face", "spud", "door"], "P01: the door fight: hands in the gap, the arm on the Samurai's sash, Spud and the sofa, three faces over its back");
see(T.free, T.look, ["spud.face", "door", "couch"], "the siren outside: the hands let go, the sofa shuts the door");

// ================================================================ P02 DAY 1 (2.7 - 4.8): the balcony. They follow sound.
scene(T.look, S.p02);
prop(T.free, "pcarA", { lights: 1 }, 0.05); putProp(T.look, "street", { fog: 0.3 }); putProp(T.bath, "street", { fog: 1 });
prop(T.free, "horde", { adv: 6 }, r3(T.bath - T.free), "linear");
FIVE.forEach((w) => expr(r3(T.look - 0.02), w, "shocked", { open: 0.1 }, 0.01));
gaze(r3(T.look - 0.01), "spud", S.p02.spud, [-3.8, 1.2], 0, 0.01);                      // he looks back at the others
arm(r3(T.look - 0.02), "spud", "R", { o: [0.03, 0.62, 0.2] }, 0.01);   // a finger on his lips
c.say(T.sound, "spud", "They follow sound.", 1.1, "whisper", { sub: false });
cap(T.sound, r3(T.bath - 0.03), "They follow sound.", "p02");
sfx(T.look, "sirenwail", { gain: 0.2, dur: 2.0, reason: "the police siren, far up the street" });
sfx(T.look, "groan", { gain: 0.25, dur: 2.0, reason: "hundreds of zombies shuffling to the police car" });
see(T.look, T.bath, ["spud.face", "street", "horde", "pcarA"], "P02: from the balcony: the whole street flows to the flashing police car");

// ================================================================ P03 DAY 3 (4.8 - 6.6): no water. The cistern.
scene(T.bath, S.p03);
putProp(T.bath, "pcarA", { lights: 0 });
c.at(T.bath, { macro: "narrate", line: "Day three. No water.", voice: "narrator", caption: false });
cap(T.bath, r3(T.bucket - 0.03), "Day three. No water.", "p03");
FIVE.forEach((w) => { expr(r3(T.bath - 0.02), w, "sad", { curve: -0.2 }, 0.01); gaze(r3(T.bath - 0.01), w, S.p03[w], [XB + 0.15, 0.5], -0.35, 0.01); });
["wiz", "phx", "gun"].forEach((w) => arm(r3(T.bath - 0.02), w, w === "gun" ? "L" : "R", "hold", 0.01)); arm(r3(T.bath - 0.02), "gun", "R", { o: [0.04, 0.3, 0.16] }, 0.01);   // an empty glass each (his left: the right reached into the Wizard)
// Spud lifts the china lid (its end is at (XB + 0.01, 0.87, 0.53) when lifted), the Samurai dips the glass
both(r3(T.bath - 0.02), "spud", { o: [0.2, 0.5, 0.3] }, 0.01);
both(T.lid, "spud", { o: [0.22, 0.82, 0.28] }, 0.45); prop(T.lid, "cistern", { lid: 1 }, 0.5, "inOut");
sfx(T.lid, "scrape", { gain: 0.3, reason: "the china lid comes off the cistern" });
arm(r3(T.bath - 0.02), "sam", "L", { o: [0.26, 0.5, 0.3] }, 0.01);
arm(r3(T.lid + 0.45), "sam", "L", { o: [0.34, 0.34, 0.34] }, 0.35); prop(r3(T.lid + 0.45), "glass", { x: XB + 0.2, y: 0.44, z: 1.155 }, 0.4, "inOut");
prop(r3(T.lid + 0.8), "glass", { fill: 1 }, 0.1);
prop(r3(T.lid + 1.0), "glass", { x: XB + 0.42, y: 0.66, z: 1.1 }, 0.35, "inOut"); arm(r3(T.lid + 1.0), "sam", "L", { o: [0.26, 0.54, 0.3] }, 0.35);
sfx(r3(T.lid + 0.85), "plunk", { gain: 0.3, reason: "the glass dips into the last clean water" });
expr(r3(T.lid + 1.0), "sam", "kind", { curve: 0.1 });
see(T.bath, T.bucket, ["spud.face", "sam.face", "cistern"], "P03: the tap is dry; the last water is in the toilet cistern, three wait in the doorway with empty glasses");

// ================================================================ P04 DAY 3 (6.6 - 8.3): no toilet. The queue on the balcony.
scene(T.bucket, S.p04);
putProp(T.bucket, "line", { x: -3.95 }); putProp(T.bucket, "cloth", { x: -4.3 }); putProp(T.bucket, "chair", { x: -4.1, z: -1.25 }); putProp(T.bucket, "roll", { x: -3.03 });
putProp(T.bucket, "horde", { adv: 0, gx: PB[0] - HX, gz: PB[1] - HZ });
A(r3(T.bucket - 0.02), "phx", "sit", { height: 0.45, rot: 15, dur: 0.01, hands: "lap" }); sat.add("phx");
expr(r3(T.bucket - 0.02), "gun", "deadpan", { lidL: 0.45, lidR: 0.45 }, 0.01); both(r3(T.bucket - 0.02), "gun", "hips", 0.01);
expr(r3(T.bucket - 0.02), "phx", "serene", { curve: -0.15 }, 0.01);
expr(r3(T.bucket - 0.02), "spud", "sad", { curve: -0.1 }, 0.01); A(r3(T.bucket - 0.02), "spud", "pitch", { to: -12, dur: 0.01 }); look(r3(T.bucket - 0.01), "spud", [0.2, 0.8], 0.01);
c.say(T.talk, "gun", "Nobody talks about this.", 1.0, "calm", { sub: false });
cap(T.talk, r3(T.tin - 0.03), "Nobody talks about this.", "p04");
see(T.bucket, T.tin, ["gun.face", "phx.face", "spud"], "P04: the queue for the bucket behind the blanket on the balcony; nobody meets anybody's eyes");

// ================================================================ P05 DAY 5 (8.3 - 10.3): the last tin, one spoon
scene(T.tin, S.p05);
Object.entries(S.p05).forEach(([w, p]) => sitDown(r3(T.tin - 0.015), w, p[2]));
putProp(T.tin, "flat", { dim: 1 }); putProp(T.tin, "door", { hole: 1, ajar: 0, bulge: 0.1 });
putProp(T.tin, "robe", { x: WALLX + 0.2, z: DZ }); putProp(T.tin, "couch", { x: WALLX + 0.5, z: DZ - 1.0, rot: 90 });
putProp(T.tin, "candle", { x: XH + 0.45, z: DZ + 0.15 }); putProp(T.tin, "tinL", { x: TINF[0], y: 0, z: TINF[1] }); putProp(T.tin, "spoon", { x: XH - 0.95, y: 0.42, z: DZ + 0.65 });
["line", "cloth", "chair", "roll"].forEach((id) => putProp(T.tin, id, { x: FAR[0] }));
c.at(T.tin, { macro: "narrate", line: "Day five.", voice: "narrator", caption: false });
FIVE.forEach((w) => { expr(r3(T.tin - 0.01), w, "sad", { curve: -0.25, lidL: 0.3, lidR: 0.3 }, 0.01); both(r3(T.tin - 0.01), w, "lap", 0.01); look(r3(T.tin - 0.01), w, [0, -0.45], 0.01); });
A(r3(T.tin - 0.01), "wiz", "lean", { to: 0, dur: 0.01 }); A(r3(T.tin - 0.01), "wiz", "pitch", { to: 10, dur: 0.01 });                 // slumped in his cape
arm(r3(T.tin + 0.1), "spud", "L", { o: [0.06, 0.4, 0.42] }, 0.5); prop(r3(T.tin + 0.1), "spoon", { x: XH - 0.88, y: 0.36, z: DZ + 0.55 }, 0.6, "inOut");
c.say(T.last, "spud", "Last one.", 0.7, "whisper", { sub: false });
cap(T.last, r3(T.growl - 0.03), "Last one.", "p05");
see(T.tin, T.growl, ["spud.face", "wiz.face", "tinL"], "P05: one tin for five by candlelight, one spoon; the Wizard slumped; the barricade behind them");

// ================================================================ P06 DAY 6 (10.3 - 12.7): the growl. It won't hold.
scene(T.growl, S.p06);
putProp(T.growl, "flat", { dim: 0.35 }); putProp(T.growl, "candle", { x: FAR[0] }); putProp(T.growl, "tinL", { x: FAR[0] }); putProp(T.growl, "spoon", { x: FAR[0] });
putProp(T.growl, "robe", { z: DZ + 0.35 });
FIVE.forEach((w) => expr(r3(T.growl - 0.02), w, "sad", { curve: -0.15 }, 0.01));
sfx(r3(T.growl + 0.1), "rumble", { gain: 0.5, dur: 0.6, reason: "Phoenix's stomach growls, far too loud" });
both(r3(T.growl - 0.02), "phx", { o: [0.06, 0.34, 0.2] }, 0.01); expr(r3(T.growl + 0.12), "phx", "shocked", { open: 0.14 });
["spud", "sam", "wiz", "gun"].forEach((w) => { gaze(r3(T.growl + 0.3), w, S.p06[w], S.p06.phx, 0, 0.12); expr(r3(T.growl + 0.35), w, "terrified", { open: 0.15 }); });
prop(T.press, "door", { shadows: 12 }, 0.6, "linear"); prop(r3(T.press + 0.15), "door", { bulge: 0.85 }, 1.2, "in");
prop(r3(T.press + 0.2), "robe", { bend: 0.5 }, 1.0, "inOut");
sfx(T.press, "groan", { gain: 0.5, dur: 1.6, reason: "a dozen zombies press on the door" });
sfx(r3(T.press + 0.3), "creak", { gain: 0.5, reason: "the door bows inward" });
sfx(r3(T.press + 0.9), "crumble", { gain: 0.4, reason: "the frame splits" });
c.at(r3(T.press + 0.3), { fx: "shake", dur: 0.9, amp: 0.025 });
["spud", "sam", "wiz", "gun"].forEach((w, i) => {                          // backs to us, against the wardrobe
  A(r3(T.press + 0.1 + i * 0.04), w, "turn", { to: -90, dur: 0.5 }); A(r3(T.press + 0.2 + i * 0.04), w, "move", { to: [S.p06[w][0] - 0.07, S.p06[w][1]], dur: 0.3, steps: 2 });
  both(r3(T.press + 0.35), w, w === "spud" || w === "sam" ? { o: [0.06, 0.4, 0.2] } : { o: [0.12, 0.55, 0.36] }, 0.45); look(r3(T.press + 0.1), w, [0, 0], 0.1);
});
expr(r3(T.press + 0.2), "phx", "terrified", { open: 0.3 });
c.say(T.hold, "spud", "It won't hold.", 0.8, "excited", { sub: false });
cap(T.hold, r3(T.cross - 0.03), "It won't hold.", "p06");
see(T.growl, T.press, ["phx.face"], "P06: Phoenix's stomach growls; everyone stares at him");
see(T.press, T.cross, ["phx.face", "door", "robe"], "the pane fills with silhouettes and the door bulges; four backs against the wardrobe: staying is over");

// ================================================================ P07 DAY 6 (12.7 - 15.0): the ladder, five floors up
scene(T.cross, S.p07);
putProp(T.cross, "ladder", { x: LAD.x0, sag: 0.3 });
const crawl = (t, who, x0, x1, dur, sag, crack = 0, dir = 1, th = 62) => {
  const P = (x) => proneAt(dir, th, [x, ladY(x, sag, crack) + (th > 50 ? 0.38 : 0.46), 0]), [ax, ay, az] = P(x0), [bx, by, bz] = P(x1), t0 = r3(t - 0.02);
  A(t0, who, "move", { to: [ax, az], y: ay, dur: 0.01, steps: 0, ease: "linear" }); prone(t0, who, dir, th);
  A(t, who, "move", { to: [bx, bz], y: by, dur, steps: 3, ease: "linear" });
  both(t0, who, { o: [0.2, 0.3, 0.42] }, 0.01);
};
crawl(T.cross, "spud", 0.3, 1.5, r3(T.shop - T.cross), 0.7);
crawl(T.cross, "gun", -1.7, -0.6, r3(T.shop - T.cross), 0.7);
prop(T.cross, "ladder", { sag: 0.8 }, 1.2, "inOut");
["spud", "gun"].forEach((w) => expr(r3(T.cross - 0.02), w, "terrified", { open: 0.08 }, 0.01));
["sam", "wiz", "phx"].forEach((w) => { expr(r3(T.cross - 0.02), w, "terrified", { open: 0.1 }, 0.01); both(r3(T.cross - 0.01), w, w === "phx" ? REST : { o: [0.18, 0.5, 0.34] }, 0.01); });
sfx(T.cross, "windswell", { gain: 0.12, reason: "wind five floors up" });
sfx(r3(T.cross + 0.4), "creak", { gain: 0.35, reason: "the ladder bends under two" });
sfx(T.cross, "groan", { gain: 0.2, dur: 2.2, reason: "the street, far below" });
see(T.cross, T.shop, ["spud", "gun", "ladder", "horde"], "P07: a ladder from the balcony to the shop roof, hundreds of zombies under it, none looking up");

// ================================================================ P08 DAY 6 (15.0 - 16.9): the shop. It's free!
scene(T.shop, S.p08);
["gun", "spud"].forEach((w) => A(r3(T.shop - 0.02), w, "crouch", { to: 1, dur: 0.01 }));
expr(r3(T.shop - 0.02), "gun", "delighted", { curve: 0.5, lidL: 0.9, lidR: 0.9 }, 0.01); expr(r3(T.shop - 0.02), "spud", "shocked", { open: 0.12, browL: 0.3 }, 0.01);
both(r3(T.shop - 0.02), "gun", { o: [0.2, 0.4, 0.34] }, 0.01);
arm(r3(T.shop - 0.02), "spud", "L", { o: [0.22, 0.4, 0.3] }, 0.01); arm(r3(T.shop - 0.02), "spud", "R", { o: [0.3, 0.66, 0.2] }, 0.01);   // one tin; a flat hand: enough
gaze(r3(T.shop - 0.01), "gun", S.p08.gun, [XS - 1.38, -0.1], -0.3, 0.01); gaze(r3(T.shop - 0.01), "spud", S.p08.spud, S.p08.gun, 0, 0.01);
prop(T.shop, "bag", { fill: 1 }, r3(T.back - T.shop - 0.3), "linear");
for (let i = 0; i < 4; i++) {                                              // tin after tin into the sack
  const t = r3(T.shop + 0.05 + i * 0.42);
  arm(t, "gun", "R", { o: [0.3, 0.62, 0.3] }, 0.16, "out"); arm(r3(t + 0.2), "gun", "R", { o: [0.26, 0.36, 0.38] }, 0.16, "in");
  prop(t, "tinG", { x: XS - 1.78, y: 0.78, z: -0.1 }, 0.16, "out"); prop(r3(t + 0.2), "tinG", { x: XS - 1.42, y: 0.66, z: -0.1 }, 0.16, "in");
  sfx(r3(t + 0.36), "tink", { gain: 0.3, reason: "a tin drops into the sack" });
}
c.say(T.free2, "gun", "It's free!", 0.7, "excited", { sub: false });
cap(T.free2, r3(T.back - 0.03), "It's free!", "p08");
expr(r3(T.free2 + 0.5), "spud", "stern", { curve: -0.25 });
see(T.shop, T.back, ["gun.face", "spud.face", "bag"], "P08: the Gunslinger stuffs a sack far too heavy; Spud, with one tin, holds up a flat hand: enough");

// ================================================================ P09 DAY 6 (16.9 - 18.3): back on the ladder. A tin slips.
putProp(T.back, "ladder", { sag: 1 });
const BD = r3(T.down - T.back), G0 = GX + 0.5, S0 = GX + 1.7, S1 = GX + 1.2;
["gun", "spud"].forEach((w) => A(r3(T.back - 0.03), w, "crouch", { to: 0, dur: 0.01 }));
crawl(T.back, "gun", G0, GX, BD, 1, 0, -1, 40);
crawl(T.back, "spud", S0, S1, BD, 1, 0, -1, 40);
["sam", "wiz", "phx"].forEach((w) => { stand(T.back, w, S.p07[w]); both(r3(T.back - 0.01), w, w === "phx" ? REST : { o: [0.18, 0.5, 0.34] }, 0.01); });
putProp(T.back, "bag", { x: G0 + 0.28, y: r3(ladY(G0, 1) + 0.74), z: 0, fill: 1 });               // the sack on his back
prop(T.back, "bag", { x: GX + 0.28, y: r3(ladY(GX, 1) + 0.74) }, BD, "linear");
putProp(T.back, "tinS", { x: FAR[0] });
putProp(T.back, "tinG", { x: G0 + 0.35, y: r3(ladY(G0, 1) + 1.0), z: 0.5 });
prop(T.back, "tinG", { x: GX + 0.6, y: r3(ladY(GX, 1) + 1.0), z: 0.55 }, r3(T.slip - T.back), "linear");
// the fall: 15 m in about 1.7 s (free fall), down onto the police car's roof
prop(T.slip, "tinG", { x: PB[0] - 0.25, y: -12.75, z: PB[1] + 0.2, roll: 540 }, r3(T.hit - T.slip), "in");
expr(r3(T.back - 0.02), "gun", "angry", { open: 0.25 }, 0.01); expr(r3(T.back - 0.02), "spud", "terrified", { open: 0.1 }, 0.01);
expr(r3(T.slip + 0.15), "spud", "terrified", { open: 0.3 }); look(r3(T.slip + 0.1), "spud", [0, -0.6], 0.1);
expr(r3(T.slip + 0.3), "gun", "shocked", { open: 0.2 });
sfx(T.back, "creak", { gain: 0.45, reason: "the ladder bent deep under the sack" });
sfx(T.slip, "tink", { gain: 0.4, reason: "a tin slips out of the sack" });
see(T.back, T.down, ["gun.face", "bag", "tinG", "spud.face"], "P09: he crawls back with the huge sack on his back; one tin slips out and falls");

// ================================================================ P10 DAY 6 (18.3 - 20.4): straight down. Every face turns up.
sfx(T.hit, "slam", { gain: 0.7, loud: true, reason: "the tin hits the police car's roof" });
prop(r3(T.hit + 0.05), "pcarB", { lights: 1 }, 0.05);
c.at(T.hit, { fx: "shake", dur: 0.25, amp: 0.04 });
sfx(r3(T.hit + 0.1), "sirenwail", { gain: 0.5, dur: 1.4, reason: "the police car's siren goes off" });
prop(T.up, "horde", { up: 1 }, 0.7, "linear");
sfx(T.up, "groan", { gain: 0.6, dur: 1.4, reason: "hundreds of zombies, all looking up" });
c.say(T.dont, "spud", "...Don't move.", 0.8, "whisper", { sub: false });
cap(T.dont, r3(T.crack - 0.03), "...Don't move.", "p10");
see(T.down, T.crack, ["horde", "pcarB", "ladder"], "P10: the tin hits the police car, the siren; hundreds of faces turn straight up");

// ================================================================ P11 DAY 6 (20.4 - 22.9): the ladder cracks. Drop it!
prop(T.crack, "ladder", { crack: 1 }, 0.05, "in");
sfx(T.crack, "crumble", { gain: 0.7, loud: true, reason: "both rails snap in the middle" });
c.at(T.crack, { fx: "impact", dur: r3(2 / 30) }); c.at(r3(T.crack + 0.07), { fx: "shake", dur: 0.35, amp: 0.07 });
const SPX = r3(MID + 0.3), SPY = r3(ladY(SPX, 1, 1) + 0.02);                 // Spud lies at the break
const HANG = [MID, r3(SPY - 1.6), 0.4];                                     // the Gunslinger hangs from Spud's hands
A(r3(T.crack + 0.03), "spud", "lean", { to: 0, dur: 0.01 }); air(r3(T.crack + 0.03), "spud", [SPX, SPY, 0], 0, 42, 0.01);   // inside the snap's two flash frames
both(r3(T.crack + 0.1), "spud", { o: [0.22, 0.12, 0.4] }, 0.15);
A(r3(T.crack + 0.03), "gun", "lean", { to: 0, dur: 0.01 }); air(r3(T.crack + 0.03), "gun", HANG, 0, -22, 0.01); arm(r3(T.crack + 0.02), "gun", "R", { o: [0.46, 0.66, 0.12] }, 0.01); arm(r3(T.crack + 0.02), "gun", "L", { o: [0.34, 0.2, 0.05] }, 0.01);
prop(r3(T.crack + 0.03), "bag", { x: r3(HANG[0] - 0.62), y: r3(HANG[1] - 0.55), z: HANG[2] + 0.05, hang: 1 }, 0.01, "linear");
expr(r3(T.crack + 0.05), "gun", "terrified", { open: 0.4 }); expr(r3(T.crack + 0.05), "spud", "angry", { open: 0.3 });
look(r3(T.crack + 0.1), "gun", [0, 0.8], 0.1); look(r3(T.crack + 0.1), "spud", [0, -0.7], 0.1);
c.say(T.drop, "spud", "Drop it!", 0.6, "excited", { sub: false });
cap(T.drop, r3(T.let - 0.03), "Drop it!", "p11", true);
prop(r3(T.drop + 0.1), "horde", { reach: 1 }, 0.5);
expr(r3(T.let - 0.2), "gun", "sad", { curve: -0.4 }); arm(T.let, "gun", "L", { o: [0.3, 0.12, 0.08] }, 0.6);
prop(T.let, "bag", { y: -14.6, roll: 200 }, 1.7, "in");
sfx(T.let, "whoosh", { gain: 0.3, reason: "the sack falls into the street" });
A(r3(T.let + 0.3), "gun", "move", { to: [HANG[0], HANG[2]], y: r3(HANG[1] + 0.3), dur: 0.6, steps: 0, ease: "out" });   // Spud hauls him up
see(T.crack, T.burst, ["gun.face", "spud.face", "bag", "ladder"], "P11: the ladder hangs in a V; Spud holds the Gunslinger by the hand, the sack in his other hand, until he lets it go");

// ================================================================ P11b DAY 6 (22.9 - 25.3): the door gives way; all five cross
// NOT in the panels: how the other three reach the roof (Jonny is told in the draft message).
putProp(T.burst, "flat", { dim: 0.35 }); putProp(T.burst, "door", { shadows: 12, bulge: 1 }); putProp(T.burst, "inflat", { x: WALLX - 0.95, z: DZ });
prop(T.burst, "door", { burst: 1 }, 0.3, "out"); prop(T.burst, "robe", { z: DZ + 1.5, rot: 60, bend: -0.6 }, 0.3, "out");
prop(r3(T.burst + 0.1), "inflat", { adv: 2.4 }, 0.45, "linear");
sfx(T.burst, "slam", { gain: 0.8, loud: true, reason: "the flat door bursts in" });
c.at(r3(T.burst + 0.1), { fx: "shake", dur: 0.3, amp: 0.06 });
sfx(r3(T.burst + 0.1), "groan", { gain: 0.6, dur: 2.2, reason: "the zombies pour into the flat" });
// the scramble over the V: the Samurai, Wizard and Phoenix lead, the Gunslinger, Spud last
const RUNX = { sam: [1.75, 3.6], wiz: [0.4, 2.35], phx: [-0.75, 1.25], gun: [-2.0, 0.0], spud: [-3.25, -1.25] };   // a body length apart
Object.entries(RUNX).forEach(([w, [x0, x1]]) => {
  crawl(T.run, w, x0, x1, r3(T.roof - T.run), 1, 1, 1, 60);
  expr(r3(T.run - 0.02), w, "terrified", { open: 0.3 }, 0.01);
});
putProp(T.run, "horde", { reach: 1, up: 1 });
prop(T.run, "flood", { gx: 9, gz: 0, adv: 2.9, reach: 1 }, r3(T.gone - T.run), "linear");   // the zombies reach the balcony behind them
c.say(r3(T.run + 0.1), "spud", "GO! GO!", 0.7, "excited", { sub: false });
cap(r3(T.run + 0.1), r3(T.gone - 0.03), "GO! GO!", "run", true);
sfx(T.gone, "hit-metal", { gain: 0.5, reason: "the first zombies hit the ladder's end" });
c.at(T.gone, { fx: "shake", dur: 0.3, amp: 0.05 });
see(T.burst, T.run, ["door"], "the flat door bursts: no way back");
see(T.run, T.roof, ["spud", "ladder", "flood", "horde"], "all five scramble over the cracked ladder; the zombies reach the balcony behind them");

// ================================================================ P12 DAY 7 (25.3 - 28.2): the roof. Tomorrow we take less.
scene(T.roof, S.p12);
Object.entries(S.p12).forEach(([w, p]) => sitDown(r3(T.roof - 0.015), w, p[2]));
putProp(T.roof, "street", { dawn: 1 }); putProp(T.roof, "pcarB", { lights: 0 }); putProp(T.roof, "ladder", { x: FAR[0], crack: 0 }); putProp(T.roof, "half", { x: 5.4, z: 2.3, rot: 100 });
putProp(T.roof, "flood", { x: -3.95, adv: 0, gx: 9, gz: 0, reach: 1 }); putProp(T.roof, "flood2", { x: -3.95, reach: 1 }); putProp(T.roof, "horde", { up: 0, reach: 0 });
putProp(T.roof, "tinL", { x: 5.0, y: 0, z: 1.3, open: 1 }); putProp(T.roof, "spoon", { x: 4.85, y: 0.36, z: 1.3 });
c.at(T.roof, { macro: "narrate", line: "Day seven.", voice: "narrator", caption: false });
FIVE.forEach((w) => { expr(r3(T.roof - 0.01), w, "sad", { curve: -0.1, lidL: 0.4, lidR: 0.4 }, 0.01); both(r3(T.roof - 0.01), w, "lap", 0.01); gaze(r3(T.roof - 0.01), w, S.p12[w], [4.95, 1.35], -0.3, 0.01); });
["wiz", "gun"].forEach((w) => expr(r3(T.roof - 0.005), w, "serene", { lidL: 1, lidR: 1 }, 0.005));
arm(r3(T.roof - 0.005), "spud", "R", { o: [0.2, 0.4, 0.36] }, 0.005);
both(r3(T.roof - 0.005), "gun", { o: [0.06, 0.34, 0.2] }, 0.005);
look(r3(T.less - 0.2), "spud", [0, 0.1], 0.2);
c.say(T.less, "spud", "Tomorrow we take less.", 1.0, "whisper", { sub: false });
cap(T.less, r3(T.end - 0.05), "Tomorrow we take less.", "p12");
sfx(T.belly, "rumble", { gain: 0.5, dur: 0.5, reason: "the Gunslinger's stomach" });
expr(r3(T.belly + 0.05), "gun", "shocked", { open: 0.1 });
["spud", "sam", "wiz", "phx"].forEach((w) => gaze(r3(T.belly + 0.2), w, S.p12[w], S.p12.gun, -0.1, 0.12));
see(T.roof, T.end, ["spud.face", "gun.face", "tinL", "flood"], "P12: all five alive on the roof at dawn with one tin; the old house's balconies full of zombies across the street; a stomach growls");

// ---------------------------------------------------------------- HUD: the day
const HUD = { ...hud({ label: "SURVIVE IT", day: [[0, 1], [T.bath, 3], [T.tin, 5], [T.growl, 6], [T.roof, 7]] }), sky: false, clockTag: false };

// ---------------------------------------------------------------- shots
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to: { fov: CAM[k].fov, look: CAM[k].look, ...to }, dur, ease }) });
const beats = c.beats([
  ["P01 the door fight", 0, sh("DOOR"), "hook"],
  ["P02 they follow sound", T.look, sh("BALC")],
  ["P03 day 3, the cistern", T.bath, sh("BATH")],
  ["P04 the queue", T.bucket, sh("QUEUE")],
  ["P05 day 5, the last tin", T.tin, sh("TIN")],
  ["P06 the growl, the door bulges", T.growl, sh("GROWL")],
  ["P07 the ladder", T.cross, sh("HIGH")],
  ["P08 it's free", T.shop, sh("SHOP")],
  ["P09 a tin slips", T.back, sh("LADC")],
  ["P10 every face turns up", T.down, sh("DOWN", { fov: 31 }, 1.0, "inOut")],
  ["P11 the ladder cracks", T.crack, sh("VEE")],
  ["P11b the door gives way", T.burst, sh("BURST")],
  ["P11b all five cross", T.run, sh("HIGH")],
  ["P12 day 7, the roof", T.roof, sh("ROOF"), "payoff"],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "zombies",
  title: "How to survive a zombie apocalypse",
  idea: "Survive it (realistic): five friends in a fifth-floor flat over a street full of zombies that hunt by sound; hunger sends them over a ladder to the shop roof, and one greedy sack of tins nearly kills them",
  format: "series: Survive it (title spoken at 0.0, day HUD, one cause-and-effect chain, realistic, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [230, 640],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "plain", color: "#a9afb3", floor: "none", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.06, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["sam", "spud", "door"], hint: 0, what: "opener A: the flat door is being forced at frame 0, a zombie arm holds the Samurai by the sash, Spud shoves a sofa at the door" },
  hud: HUD,
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["street", "horde", "flood", "flood2", "inflat", "flat", "bath", "shop", "ladder", "half", "door", "dark", "line", "cloth", "couch", "robe", "pcarA", "pcarB", "chair"].map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "the world the cast stands in, on and against (rooms, balcony, roof, ladder, door, barricade, crowd): not a body" })),
    // hats in the sheet's huddles: the brims cross a neighbour in DEPTH (behind or in front), bodies stand a body-width apart
    { who: "gun", with: "phx", from: T.bucket, to: T.tin, checks: ["character-overlap"], reason: "P04 queue: the Gunslinger stands big in front, Phoenix sits behind him (panel 04); the brim passes in front of Phoenix's body, not his face" },
    { who: "gun", with: "phx", from: 0, to: T.look, checks: ["character-overlap"], reason: "P01: three faces over the sofa back side by side (panel 01); brims touch, faces clear" },
    { who: "wiz", with: "phx", from: 0, to: T.look, checks: ["character-overlap"], reason: "P01: three faces over the sofa back side by side (panel 01); brims touch, faces clear" },
    { who: "wiz", with: "phx", from: T.tin, to: T.growl, checks: ["character-overlap"], reason: "P05: five in a tight half circle round one candle (panel 05); the hat tip passes behind Phoenix" },
    { who: "gun", with: "phx", from: T.tin, to: T.growl, checks: ["character-overlap"], reason: "P05: five in a tight half circle round one candle (panel 05)" },
    { who: "gun", with: "phx", from: T.roof, to: T.end, checks: ["character-overlap"], reason: "P12: five sitting close on the roof (panel 12); the brim crosses Phoenix's flame in depth" },
    { who: "wiz", with: "sam", from: T.growl, to: T.end, checks: ["character-overlap"], reason: "P06, P11b, P12: rows in depth; the Wizard's hat tip crosses the Samurai behind or in front, faces clear" },
    { who: "gun", with: "sam", from: T.growl, to: T.cross, checks: ["character-overlap"], reason: "P06: the back row against the wardrobe, backs to us; the brim crosses the Samurai's back" },
    { who: "phx", from: 0, to: T.end, checks: ["character-overlap"], with: "wiz", reason: "Phoenix's flame crest and wing-hands brush the Wizard's cape in the huddles (P01, P07 holding the ladder end, P09)" },
    { who: "gun", with: "spud", from: T.crack, to: T.run, checks: ["character-overlap", "limb-through-costume", "reach"], reason: "P11: Spud holds the hanging Gunslinger by the raised hand right at his hat (panel 11); there is no fitted hand-to-hand grip, the hands meet by placement" },
    { who: "gun", with: "wiz", from: T.look, to: T.growl, checks: ["character-overlap"], reason: "P02-P04: the balcony and the bathroom doorway are tight; hands at the sides touch a neighbour's cape behind" },
    { who: "spud", from: T.growl, to: T.cross, checks: ["character-overlap", "face-covered"], reason: "P06: the front row braces against the back row at the wardrobe, backs to us (panel 06: four backs against it); seen from behind, no face acts" },
    { who: "sam", from: T.growl, to: T.cross, checks: ["character-overlap", "face-covered"], reason: "P06: the front row braces against the back row at the wardrobe, backs to us (panel 06); seen from behind, no face acts" },
    { who: "phx", with: "gun", from: T.roof, to: T.end, checks: ["character-overlap"], reason: "P12: hands in laps, sitting shoulder to shoulder on the roof (panel 12)" },
    { who: "sam", with: "phx", from: T.burst, to: T.run, checks: ["face-covered"], reason: "P11b burst: the flat empties, Phoenix and the Samurai are not in the BURST shot (the door only); the check reads a hidden pose" },
    // the sheet's steep high angles (panels 07, 09, 11b): from above, hats cover the eyes of the two in hats
    { who: "gun", from: T.cross, to: T.shop, checks: ["face-hidden"], reason: "P07: the ladder from high above (panel 07); his brim covers his eyes from that angle, the crawl is the beat" },
    { who: "gun", from: T.run, to: T.roof, checks: ["face-hidden"], reason: "P11b: all five crawl over the V seen from high above; the crawl is the beat, not a face" },
    { who: "wiz", from: T.run, to: T.roof, checks: ["face-hidden"], reason: "P11b: all five crawl over the V seen from high above; the crawl is the beat, not a face" },
    { who: "wiz", from: T.bath, to: T.bucket, checks: ["face-hidden"], reason: "P03: the Wizard waits in the doorway behind Spud (panel 03: three wait behind with empty glasses); he has no line, only the shot's opening face" },
    ...["wiz", "phx", "gun"].map((who) => ({ who, from: T.shut, to: r3(T.shut + 0.15), checks: ["rig-jump"], reason: "P01: the sofa slams into the door wall; the three riding it stop dead with the slam and its shake" })),
    ...["wiz", "phx", "gun"].map((who) => ({ who, from: T.growl, to: r3(T.growl + 0.1), checks: ["rig-jump"], reason: "P06 cut: from sitting (P05) to standing; the stand cheat's settle shows in the first frames, 5 cm" })),
    { who: "spud", from: T.shut, to: T.look, checks: ["palm-turn"], reason: "P01: Spud lets go of the sofa after the slam, his arms drop (0.6 s)" },
    { who: "sam", from: T.free, to: T.look, checks: ["foot-slide"], reason: "P01: the Samurai stumbles back off the door as the arm lets go" },
    ...["sam", "wiz"].map((who) => ({ who, from: T.press, to: T.cross, checks: ["stance-slide"], reason: "P06: they turn and shove against the wardrobe, 3 cm" })),
    { who: "sam", with: "wiz", from: T.tin, to: T.growl, checks: ["reach"], reason: "P05: five in a tight half circle round one candle (panel 05); a glove brushes the Wizard's cape, 2 cm" },
    // the cheat at the snap: both bodies are placed inside the impact flash's two frames (T.crack + 0.03)
    { who: "gun", from: T.crack, to: r3(T.crack + 0.2), checks: ["rig-jump"], reason: "P11: the snap; the Gunslinger is placed hanging inside the impact flash (two white frames at 20.4 s)" },
    ...["bag", "tinG", "tinS", "spoon", "glass", "glassW", "glassP", "glassG"].map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "rough draft: carried things sit at the hand without a fitted grip yet (the sack on his back and at his side, a tin, a glass, the spoon); grips are fitted in the polish after Jonny's OK" })),
  ],
  panels: { md: "storyboards/series/survive-it/04-zombies/PANELS.md" },
  notes: "Generated by storyboards/series/survive-it/04-zombies/make-zombies.mjs.",
});
