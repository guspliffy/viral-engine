// Survive it: "How to survive a zombie apocalypse" v2: REAL SURVIVAL STEPS (Jonny 12 Nov 2026 13:52 Berlin on v1:
// "the survive it videos should kind of actually show ways to survive the situation", the water gap, "a proper zombie
// apocalypse video needs a fight against zombies"; 14:04 "show the outbreak scenario aswell"; 14:25 "create the video").
// Target: the 12-panel sheet panels-sheet-v2.png next to this file; outline
// /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-V2-SURVIVAL-STEPS.md.
//
// THE BRIEF
//   Story:       the outbreak starts on a normal morning; five friends in a fifth-floor flat survive a week by doing six
//                real things right (and one thing wrong: a greedy bag).
//   Wants:       Spud wants everyone alive, fed and watered.
//   Consequence: zombies hunt by sound, so every noise is paid for; every need (water, food, a way out) is answered.
//   Ending:      day 7 on the shop roof: rainwater, one tin. "Water. Silence. High ground." "Tomorrow we take less."
//   Steps:       1 barricade, don't hold; 2 make no sound; 3 fill the bathtub now; 4 ration it; 5 make your noise
//                somewhere else; 6 if you must fight, fight in a doorway. Each acted on screen, named by the narrator,
//                a STEP card in the upper third.
// REALISTIC, no gore, the cast keeps its colour. Opener A: the outbreak is on the TV at frame 0.
// Run: node storyboards/series/survive-it/04-zombies/make-zombies-v2.mjs
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud, rule } from "../../../lib/overlay.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1180 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
// the orchestral score of v1, joined again at v2's seconds (score-zombies-v2.json): dread from 0.0, full orchestra from
// the tin's hit (T.hit), slow piano on the roof (T.roof). If those move, change the json and join again.
const MUSIC = { file: "ai/zombies-score/zombies-score-02.ogg", lock: false, dip: false, gain: 0.45 };
const SUB_STYLE = {};

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;   // main keeps instant cut cheats on their beat (#214)
const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded DOWN to ms

// ---------------------------------------------------------------- the timeline (story seconds)
const T = {
  banner: 1.15,        // P01 the TV: STAY INDOORS
  look: fr(2.6),       // P02a the street from the balcony: the outbreak
  faces: fr(3.55),     // P02b the five at the railing, every phone with the alert
  buzz: 2.85,          // every phone buzzes at once
  flu: 3.7,            // Gunslinger: "It's just the flu."
  bang: 4.75,          // something bangs on their own door
  door: fr(5.2),       // P03 the door splinters: the barricade
  s1: 5.45,            // STEP 1
  free: 7.05,          // a car alarm in the street, the arm lets go
  shut: 7.55,          // the wardrobe is against the door
  balc: fr(8.0),       // P04 the balcony: they follow sound
  s2: 8.2,             // STEP 2
  sound: 9.75,         // Spud: "They follow sound."
  fill: fr(10.8),      // P05 the bathroom: fill everything
  s3: 11.0,            // STEP 3
  dry: fr(13.4),       // P06 day 3: the tap is dry, one cup each
  s4: 13.6,            // STEP 4
  one: 14.85,          // Spud: "One cup each."
  growl: fr(16.1),     // P07 day 6: the empty tin, the growl
  press: 16.6,         // the door bulges
  hold: 17.45,         // Spud: "It won't hold."
  throw: fr(18.4),     // P08 the balcony: the alarm clock
  s5: 18.6,            // STEP 5
  let: 19.45,          // the clock leaves his hand
  land: 20.55,         // it lands far up the street, ringing
  shop: fr(21.3),      // P09 the shop
  run: 21.75,          // Spud: "Only what you can run with."
  back: fr(23.3),      // P10 back on the ladder with the bag
  slip: 23.65,         // a tin slips out
  down: fr(24.1),      // P10b straight down
  hit: 24.75,          // the tin hits the police car's roof: the turn
  up: 24.95,           // every face turns up
  drop: fr(25.6),      // P10c Spud: "Drop it!"
  bagGo: 26.15,        // the bag falls
  fight: fr(26.9),     // P11 the door gives way: the fight in the hall
  s6: 27.1,            // STEP 6
  cross: fr(30.0),     // P11b all five over the ladder
  roof: fr(31.4),      // P12 day 7, the shop roof
  recap: 31.65,        // narrator: "Water. Silence. High ground."
  less: 33.55,         // Spud: "Tomorrow we take less."
  belly: 34.6,         // a stomach growls
  end: 35.5,
};

// ---------------------------------------------------------------- places (the v1 sets: the street world at the origin,
// the rooms far off). Balcony floor y 0 at x -4.9..-3.0, shop roof y 0 from x 3.0, street floor y -15, the ladder
// along x at y 1.03. XH: the hall/front door room, XB: the bathroom, XS: the shop, XL: the living room.
const XH = 40, XB = 70, XS = 100, XL = 130;
const WALLX = XH - 2.2, DZ = -0.9, DOORY = -0.25;
const LAD = { x0: -3.3, y: 1.03, len: 6.7 };
const PA = [0.7, -13];                    // the police car far up the street: its alarm pulls the horde on day 1
const PB = [0.55, -0.5];                  // the police car under the ladder: the falling tin sets it off on day 6
const CLK = [0.9, -19.5];                 // where the alarm clock lands, far up the street (step 5)
const CRASH = [0.6, -7.5], GRAB = [-0.6, -3.2], CIV = [0.1, -4.0];   // the outbreak: the crash, the first grab, the people running
const HX = -0.95, HZ = -5, HBOX = [7.5, 32];
const rect = ([x, z], w, d) => [r3(x - HX), r3(z - HZ), w, d];
const PARKED = [0, 3, 5], KERB = [-1.65, -8.5];
const CARS = [[-1.65, -15], [-1.65, 6], [0.7, -6], KERB].map((p) => rect(p, 2.0, 4.4)).concat([rect(PA, 2.8, 4.1), rect(PB, 2.8, 4.1)]);
const FIVE = ["spud", "sam", "wiz", "phx", "gun"];
const FAR = [200, 0];
const far = (i) => [FAR[0], 3 + i * 2, 0];
const GX = -0.25;
const MID = r3(LAD.x0 + LAD.len / 2);
const toward = ([x, z], [tx, tz]) => r3(Math.atan2(tx - x, tz - z) * 180 / Math.PI);
// the living room (P01): the sofa against the back wall facing +z, the TV in the front left corner turned to it
const SOFA = [XL - 0.1, -1.35], TV = [XL - 1.3, 0.35];
const TVROT = 90;   // turned between the sofa and the camera: the screen reads in the shot
// the bathroom (P05, P06): the tub along the back wall, its tap at the -x end
const TUB = [XB + 0.25, -0.88];
// who stands where in each scene: [x, z, yaw]
const S = {
  p01sofa: { wiz: [XL - 0.95, -1.15], spud: [XL - 0.1, -1.15], phx: [XL + 0.75, -1.15] },
  p01: { gun: far(1), sam: far(0) },
  p02: { spud: [-3.45, -0.95, 80], phx: [-3.45, 0.0, 90], gun: [-3.45, 0.95, 100], sam: [-4.3, -0.5, 85], wiz: [-4.3, 0.45, 95] },
  p03: { spud: [WALLX + 1.45, DZ - 0.45, -90], sam: [WALLX + 1.45, DZ + 0.45, -90], wiz: [WALLX + 2.4, DZ + 1.25, -90], phx: [XH + 0.4, DZ - 0.25, -100], gun: [XH + 0.75, DZ + 2.3, -120] },
  p04: { spud: [-3.4, -0.25, 60], wiz: [-4.3, -0.6, 120], phx: [-4.25, 0.35, 150], sam: far(1), gun: far(0) },
  p05: { gun: [XB - 0.75, -0.15, 150], phx: [XB + 0.85, -0.2, -150], wiz: [XB + 0.8, 1.0, -130], spud: [XB - 0.8, 1.0, 130], sam: far(0) },
  p06: { spud: [XB - 0.25, -0.05, -160], wiz: [XB + 0.75, 0.55, -120], gun: [XB - 0.95, 0.5, 140], sam: far(0), phx: far(1) },
  p07: { phx: [XH - 0.5, DZ - 0.42, 90], spud: [XH - 0.6, DZ + 1.55, 90], wiz: [XH - 1.42, DZ + 0.85, 90], sam: [XH - 0.6, DZ + 0.5, 90], gun: [XH - 1.42, DZ - 0.2, 90] },
  p08: { spud: [-3.4, -1.25, 150], gun: [-3.55, 0.1, 90], sam: far(1), wiz: far(2), phx: far(0) },
  p09: { gun: [XS - 1.9, -0.45, 75], spud: [XS - 0.6, -0.5, -65], sam: far(0), wiz: far(1), phx: far(2) },
  p11: { spud: [WALLX + 0.95, DZ - 0.55, -60], wiz: [WALLX + 1.35, DZ + 0.55, -75], phx: far(2), sam: far(0), gun: far(1) },
  p12: { wiz: [3.75, 1.8, 90], spud: [4.5, 1.4, 90], sam: [3.75, 0.95, 90], phx: [3.75, -0.17, 90], gun: [4.5, 0.3, 90] },
};

const CAM = {
  NEWS: { pos: [XL + 0.9, 1.4, 3.2], look: [XL - 0.65, 0.8, -0.7], fov: 56 },           // P01: the five on the sofa, the TV at the frame's left
  WIN: { pos: [-3.2, 2.6, 0.0], look: [0.3, -15, -9.0], fov: 58 },                         // P02a: the street from the railing, nobody in front
  FACES: { pos: [-2.0, 1.25, 0.0], look: [-3.6, 0.85, 0.0], fov: 60 },                     // P02b: from outside the railing, the five with their phones                     // P02: over their shoulders, down at the street
  DOOR: { pos: [XH + 0.6, 1.8, DZ + 3.4], look: [WALLX + 0.5, 0.85, DZ], fov: 60 },               // P03: the door at the frame's left, the barricade
  BALC: { pos: [-3.4, 2.75, 1.55], look: [-0.75, -15, -9.4], fov: 60 },                      // P04: above and behind, down the street
  TUBC: { pos: [XB + 0.05, 1.9, 3.9], look: [XB, 0.6, -0.7], fov: 64 },               // P05 + P06: the tub at the back
  GROWL: { pos: [XH + 2.05, 0.8, DZ], look: [XH - 1.5, 0.88, DZ], fov: 56 },                  // P07
  THROW: { pos: [-4.6, 2.4, 1.2], look: [1.5, -12, -14], fov: 62 },                     // P08: behind Spud, the ladder at the right, the street ahead
  SHOP: { pos: [XS - 1.2, 0.85, 3.5], look: [XS - 1.25, 0.62, -0.6], fov: 52 },               // P09
  LADC: { pos: [-2.6, 1.9, 2.9], look: [0.45, 0.65, 0], fov: 50 },                             // P10: he crawls toward us
  DOWN: { pos: [0.4, 2.7, -1.12], look: [0.4, -15, -1.17], fov: 50 },                         // P10b: straight down
  HALL: { pos: [WALLX + 1.55, 1.35, 2.0], look: [WALLX + 0.6, 0.8, DZ], fov: 58 },   // P11: the fighters three-quarter, the doorway behind
  HIGH: { pos: [3.5, 6.0, 4.5], look: [-1.9, -4.1, -1.3], fov: 60 },                          // P11b: the ladder from high above
  ROOF: { pos: [8.4, 2.3, 1.0], look: [0, -0.3, 0.8], fov: 50 },                               // P12
};

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: S.p01sofa.spud, face: "camera", expr: "shocked", follow: 0.3, seed: 1.4 },
  { id: "sam", character: "duo/samurai", at: [S.p01.sam[0], S.p01.sam[1]], face: "camera", expr: "shocked", follow: 0.3, seed: 2.3 },
  { id: "wiz", character: "never-has-money/wizard", at: S.p01sofa.wiz, face: "camera", expr: "shocked", follow: 0.3, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: S.p01sofa.phx, face: "camera", expr: "shocked", follow: 0.3, seed: 4.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: [S.p01.gun[0], S.p01.gun[1]], face: "camera", expr: "deadpan", follow: 0.3, seed: 5.2 },
];

const PHONES = FIVE.map((w) => ({ id: `ph_${w}`, kind: "zphone", x: FAR[0], y: 0, z: 20, alert: 0, glow: 1 }));
const props = [
  // the street world (v1)
  { id: "street", kind: "zstreet", x: 0, y: 0, z: 0, parked: PARKED, car: KERB, carRot: 5, alarm: 0, dent: 0, dawn: 0, fog: 0.3 },
  { id: "horde", kind: "zhorde", x: FAR[0], y: -15, z: HZ, n: 620, box: HBOX, seed: 3, avoid: CARS, gx: PA[0] - HX, gz: PA[1] - HZ, adv: 0, up: 0, reach: 0 },
  { id: "pcarA", kind: "policecar", x: PA[0], y: -15, z: PA[1], rot: 22, scale: 1.1, lights: 0 },
  { id: "pcarB", kind: "policecar", x: PB[0], y: -15, z: PB[1], rot: 16, scale: 1.1, lights: 0 },
  { id: "flood", kind: "zhorde", x: FAR[0], y: 0, z: 0, n: 14, box: [1.6, 2.6], seed: 8, gx: 0.6, gz: -40, adv: 0, up: 0, reach: 0 },
  { id: "flood2", kind: "zhorde", x: FAR[0], y: 3, z: 0, n: 8, box: [1.4, 2.6], seed: 5, gx: 9, gz: 0, adv: 0, up: 0, reach: 0 },
  { id: "ladder", kind: "zladder", x: FAR[0], y: LAD.y, z: 0, len: LAD.len, sag: 0, crack: 0, drop: 0 },
  { id: "half", kind: "zladder", x: FAR[0], y: 0.04, z: 6, len: LAD.len, half: true, rot: 24 },
  // the outbreak (P02): a car in a lamp post, people running, the first grab, a few zombies in the street
  { id: "crash", kind: "zcrash", x: CRASH[0], y: -15, z: CRASH[1], rot: 160, hazard: 1, steam: 1 },
  { id: "civil", kind: "zcivil", x: CIV[0], y: -15, z: CIV[1], n: 9, box: [6, 12], seed: 4, run: 0, scatter: 1 },
  { id: "grab", kind: "zgrab", x: GRAB[0], y: -15, z: GRAB[1], rot: 30, grab: 0, fall: 0 },
  { id: "first", kind: "zhorde", x: -0.2, y: -15, z: -9.5, n: 5, box: [5, 6], seed: 13, gx: 0, gz: 8, adv: 0, up: 0, reach: 1 },
  // the living room (P01)
  { id: "living", kind: "zroom", x: XL, y: 0, z: 0, w: 4.4, d: 4.4, dress: "living", dim: 0, glowx: 0, glowz: 0 },
  { id: "sofa", kind: "couch", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, scale: 1.45, color: "#7b4b35", color2: "#8f5b43" },
  { id: "tv", kind: "ztv", x: TV[0], y: 0, z: TV[1], rot: TVROT, news: 1, glow: 1 },
  { id: "ctable", kind: "coffeetable", x: XL - 0.15, y: 0, z: -0.25, rot: 0 },
  { id: "mug1", kind: "teamug", x: XL - 0.35, y: 0.42, z: -0.2, rot: 30, steam: 1 },
  { id: "mug2", kind: "teamug", x: XL + 0.1, y: 0.42, z: -0.3, rot: -20, steam: 1 },
  // the hall and the front door (P03, P07, P11)
  { id: "flat", kind: "zroom", x: XH, y: 0, z: 0, w: 4.4, d: 4.4, dress: "living", open: [{ wall: "left", at: DZ, w: 1.0, h: 1.85, y0: 0 }], dim: 0, glowx: 0.3, glowz: DZ + 0.12 },
  { id: "door", kind: "zdoor", x: WALLX, y: DOORY, z: DZ, rot: 90, ajar: 1, hands: 4, hole: 1, arm: 1, bulge: 0, shadows: 0, burst: 0 },
  { id: "robe", kind: "wardrobe", x: WALLX + 0.85, y: 0, z: DZ, rot: 90, scale: 0.9, apart: 0 },
  { id: "ktable", kind: "kitchentable", x: WALLX + 1.75, y: 0, z: DZ + 1.25, rot: 90, w: 1.1, d: 0.7, h: 0.72 },
  { id: "chairA", kind: "woodchair", x: XH - 0.1, y: 0, z: DZ - 0.2, rot: 90 },
  { id: "chairB", kind: "woodchair", x: XH - 0.1, y: 0, z: DZ + 2.2, rot: 90 },
  { id: "inflat", kind: "zhorde", x: FAR[0], y: 0, z: 30, n: 7, box: [0.9, 0.6], seed: 11, gx: 6, gz: 0, adv: 0, up: 0, reach: 1 },
  { id: "tinE", kind: "tin", scale: 1.6, x: FAR[0], y: 0, z: 14, open: 1, tip: 90 },     // P07: the empty last tin on the floor
  { id: "broom", kind: "broom", x: FAR[0], y: 0, z: 16, len: 1.15 },
  { id: "mop", kind: "zmop", x: FAR[0], y: 0, z: 18, len: 1.2 },
  { id: "guardS", kind: "zguard", x: FAR[0], y: 0, z: 22 },
  { id: "guardW", kind: "zguard", x: FAR[0], y: 0, z: 24 },
  // the bathroom (P05, P06)
  { id: "bath", kind: "zroom", x: XB, y: 0, z: 0.9, w: 2.6, d: 4.4, floor: "tiles", dress: "bath", dim: 0, glowx: -0.6, glowz: -0.8 },
  { id: "tub", kind: "ztub", x: TUB[0], y: 0, z: TUB[1], rot: 0, fill: 0.1, run: 1 },
  { id: "bottles", kind: "zbottles", x: XB - 0.35, y: 0, z: 0.85, n: 12, cols: 4, full: 1 },
  { id: "potA", kind: "zpot", x: XB + 0.35, y: 0, z: 0.55, fill: 1 },
  { id: "potB", kind: "zpot", x: XB + 0.85, y: 0, z: 0.95, fill: 1, d: 0.28 },
  { id: "potG", kind: "zpot", x: FAR[0], y: 0, z: 26, fill: 0.4 },
  { id: "tally", kind: "ztally", x: XB - 0.45, y: 1.6, z: -1.23, w: 1.0, h: 0.45, cols: 5, n: 0 },
  { id: "cupS", kind: "zcup", x: FAR[0], y: 0, z: 28, fill: 0 },
  { id: "cupW", kind: "zcup", x: FAR[0], y: 0, z: 30, fill: 0 },
  { id: "candleB", kind: "pillarcandle", x: FAR[0], y: 0.56, z: -0.6, lit: 1 },
  // the balcony (P04, P08)
  { id: "shoeA", kind: "sneaker", x: -3.95, y: 0.06, z: 0.15, rot: 70, color: "#3c6e9e" },
  { id: "shoeB", kind: "sneaker", x: -4.05, y: 0.06, z: 0.42, rot: 95, color: "#a8433a" },
  { id: "clock", kind: "alarm", x: FAR[0], y: 0, z: 32, ring: 0, scale: 1.3 },
  // the shop (P09)
  { id: "shop", kind: "zshop", x: XS, y: 0, z: 0, dim: 0.25 },
  { id: "bag", kind: "tinbag", x: XS - 1.38, y: 0, z: -0.1, fill: 0.35, scale: 1.2 },
  { id: "pack", kind: "backpack", x: XS - 0.32, y: 0.2, z: -0.05, rot: -60, color: "#5d6470" },
  { id: "tinG", kind: "tin", scale: 1.6, x: XS - 1.75, y: 0.6, z: -0.1, open: 0 },
  // the roof (P12)
  { id: "tinL", kind: "tin", scale: 1.6, x: FAR[0], y: 0, z: 10, open: 1 },
  { id: "spoon", kind: "spoon", x: FAR[0], y: 0.02, z: 12 },
  { id: "rainb", kind: "zbucket", x: FAR[0], y: 0, z: 34, fill: 0.75, rain: 0.4 },
  ...PHONES,
];

// props that hang on purpose (qa/support.mjs): each says why
const STAGED = {
  shoeA: "a trainer lying on the balcony tiles", shoeB: "a trainer lying on the balcony tiles", half: "parked far away until the roof", tinL: "parked far away until the roof",
  flood2: "zombies on the balcony one floor up (the balcony slab is part of the street set's facade)",
  ladder: "the ladder bridges the gap from our balcony to the shop roof; its ends rest on the railing and the parapet",
  bath: "the bathroom set, built away from the street like every room", living: "the living room set, built away from the street",
  tally: "marker strokes on the bathroom's back wall", candleB: "the candle stands on the bathtub's rim",
  mug1: "a mug on the coffee table", mug2: "a mug on the coffee table", pack: "the backpack hangs from Spud's hand",
  tinG: "in the Gunslinger's hand, then falling, then on the police car's roof", clock: "in Spud's hand, then thrown",
  spoon: "lying on the tin", bag: "the sack in the Gunslinger's hand, on his back on the ladder, then falling",
  potG: "in the Gunslinger's hands under the tap", cupS: "in Spud's hand", cupW: "in the Wizard's hand",
  broom: "in Spud's hands", mop: "in the Wizard's hands", guardS: "taped round Spud's forearm", guardW: "taped round the Wizard's forearm",
  ...Object.fromEntries(FIVE.map((w) => [`ph_${w}`, "a phone in the hand"])),
};
// small helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { arm(t, who, "R", pose, dur, ease); arm(t, who, "L", pose, dur, ease); };
const REST = "rest";
const sat = new Set();
const stand = (t, who, [x, z, yaw = 0]) => {
  const t0 = r3(t - 0.02);
  if (sat.has(who)) { A(r3(t0 - 0.012), who, "stand", { dur: 0.01 }); sat.delete(who); }
  A(t0, who, "pitch", { to: 0, dur: 0.01, ease: "linear" }); A(t0, who, "lean", { to: 0, dur: 0.01 }); A(t0, who, "crouch", { to: 0, dur: 0.01 });
  A(t0, who, "move", { to: [x, z], y: 0, dur: 0.01, steps: 0, ease: "linear" }); A(t0, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" });
  both(t0, who, REST, 0.01); look(t0, who, [0, 0], 0.01);
};
const prone = (t, who, dir, th) => { A(t, who, "pitch", { to: th, dur: 0.01, ease: "linear" }); A(t, who, "lean", { to: 0, dur: 0.01 }); A(t, who, "turn", { to: dir * 90, dur: 0.01, ease: "linear" }); };
const proneAt = (dir, th, [mx, my, mz]) => [r3(mx), r3(my - 0.5), r3(mz)];
const gaze = (t, who, [x, z, yaw = 0], [tx, tz], ly = 0, dur = 0.15) => { const b = (Math.atan2(tx - x, tz - z) * 180 / Math.PI - yaw) * Math.PI / 180; look(t, who, [r3(0.9 * Math.sin(b)), ly], dur); };
const sitDown = (t, who, yaw, height = -0.06) => { A(t, who, "sit", { height, rot: r3(yaw), dur: 0.01, hands: "keep" }); sat.add(who); };
const scene = (t, places) => Object.entries(places).forEach(([w, p]) => stand(t, w, p));
const putProp = (t, id, set) => prop(r3(t - 0.02), id, set, 0.01, "linear");
// a held thing: placed at the cut, the hand closes on its grip point (grip) or where it is (keep)
const hold = (t, who, id, side, grip) => A(r3(t - (grip ? 0.015 : 0.005)), who, "grab", { prop: id, hand: side, ...(grip ? { grip } : { keep: true }), dur: 0, pose: null });
const letGo = (t, who, id, to = [FAR[0], 0, 40]) => A(t, who, "release", { prop: id, to, dur: 0 });   // put down far away at a cut (no physics drop)
const ladY = (x, sag = 0, crack = 0) => { const u = Math.min(1, Math.max(0, (x - LAD.x0) / LAD.len)); return r3(LAD.y + 0.056 - 0.35 * sag * 4 * u * (1 - u) * (1 - crack) - 1.3 * crack * (1 - Math.abs(2 * u - 1))); };
const crawl = (t, who, x0, x1, dur, sag, crack = 0, dir = 1, th = 62) => {
  const P = (x) => proneAt(dir, th, [x, ladY(x, sag, crack) + (th > 50 ? 0.38 : 0.46), 0]), [ax, ay, az] = P(x0), [bx, by, bz] = P(x1), t0 = r3(t - 0.02);
  A(t0, who, "move", { to: [ax, az], y: ay, dur: 0.01, steps: 0, ease: "linear" }); prone(t0, who, dir, th);
  A(t, who, "move", { to: [bx, bz], y: by, dur, steps: 3, ease: "linear" });
  both(t0, who, { o: [0.2, 0.3, 0.42] }, 0.01);
};
// Jonny 12 Nov 2026: speech lettering in the upper third, never over eyes or faces. A STEP card sits at y 300-480, the
// spoken line under it (tops from qa/camfit.mjs)
const CAPY = { p01: 330, p02: 330, p03: 520, p04: 520, p05: 520, p06: 520, p07: 320, p08: 520, p09: 330, p10: 330, p11: 520, run: 250, p12: 330 };
const cap = (from, to, text, k, pop = false) => c.cap(from, to, text, CAPY[k], pop, SUB_STYLE);
const narrate = (t, line) => c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
const step = (t, to, n, text) => rule(c, t, r3(to - t), `STEP ${n}`, text, { y: 300, angle: -2 });

// ---------------------------------------------------------------- the narrator (voice 1): the title, the six steps, the recap
narrate(0.0, "How to survive a zombie apocalypse.");
cap(0.0, r3(T.look - 0.03), "How to survive a zombie apocalypse", "p01");

// ================================================================ P01 DAY 1 (0 - 2.6): a normal morning. STAY INDOORS.
// Opener A: the outbreak is already on the TV at frame 0. Three on the sofa, the Gunslinger and Spud in front of it.
Object.entries(S.p01sofa).forEach(([w, [x, z]]) => {
  sitDown(0, w, 0, 0.0); A(0, w, "move", { to: [x, z], dur: 0, steps: 0 });
  expr(0, w, "shocked", { open: 0.12 }, 0); gaze(0, w, [x, z, 0], TV, 0, 0); both(0, w, "lap", 0);
});
A(0, "sam", "move", { to: [S.p01.sam[0], S.p01.sam[1]], dur: 0, steps: 0 }); A(0, "gun", "move", { to: [S.p01.gun[0], S.p01.gun[1]], dur: 0, steps: 0 });
sfx(0, "radio", { gain: 0.35, dur: 2.5, reason: "the TV news, urgent, too low to understand" });
prop(T.banner, "tv", { news: 2 }, 0.12);
sfx(T.banner, "notify", { gain: 0.35, reason: "the TV's alert tone with the STAY INDOORS banner" });
FIVE.forEach((w, i) => expr(r3(T.banner + 0.15 + i * 0.05), w, "terrified", { open: 0.15 }));
expr(r3(T.banner + 0.2), "gun", "deadpan", { lidL: 0.3, lidR: 0.3 });
see(0, T.banner, ["tv", "spud.face", "wiz.face"], "P01: a normal morning on the sofa; the TV news shows a hospital with blocked doors");
see(T.banner, T.look, ["tv", "spud.face"], "STAY INDOORS on the TV, every face goes still");

// ================================================================ P02 DAY 1 (2.6 - 5.2): the street. It's just the flu.
scene(T.look, S.p02);
putProp(T.look, "street", { fog: 0.15 });
FIVE.forEach((w) => {
  putProp(T.look, `ph_${w}`, { x: S.p02[w][0], y: 0.6, z: S.p02[w][1] });
  hold(T.look, w, `ph_${w}`, "R", "hand"); arm(r3(T.look - 0.02), w, "R", { o: [0.05, 0.62, 0.32] }, 0.01);
  look(r3(T.look - 0.01), w, [0, -0.5], 0.01); expr(r3(T.look - 0.02), w, "terrified", { open: 0.12 }, 0.01);
});
prop(T.look, "civil", { run: 1 }, r3(T.door - T.look), "linear");
prop(r3(T.look + 0.3), "grab", { grab: 1 }, 1.0, "inOut"); prop(r3(T.look + 1.4), "grab", { fall: 1 }, 0.8, "in");
prop(T.look, "first", { adv: 3 }, r3(T.door - T.look), "linear");
prop(T.buzz, "ph_spud", { alert: 1 }, 0.06); ["sam", "wiz", "phx", "gun"].forEach((w, i) => prop(r3(T.buzz + 0.03 * (i + 1)), `ph_${w}`, { alert: 1 }, 0.06));
sfx(T.buzz, "ringtone", { gain: 0.45, dur: 1.2, reason: "every phone's emergency alert at once" });
sfx(T.look, "screech", { gain: 0.25, reason: "a car's tyres far below" });
sfx(r3(T.look + 0.2), "horn", { gain: 0.2, reason: "the crashed car's horn stuck on" });
sfx(r3(T.look + 0.4), "groan", { gain: 0.2, dur: 2.0, reason: "screams and groans far below" });
FIVE.forEach((w) => look(r3(T.buzz + 0.15), w, [0, -0.3], 0.15));
expr(r3(T.flu - 0.2), "gun", "deadpan", { lidL: 0.4, lidR: 0.4 }); arm(r3(T.flu - 0.15), "gun", "L", "shrug", 0.3);
c.say(T.flu, "gun", "It's just the flu.", 1.0, "calm", { sub: false });
cap(T.flu, r3(T.bang - 0.03), "It's just the flu.", "p02");
sfx(T.bang, "knock", { gain: 0.8, loud: true, reason: "something bangs on their own front door" });
c.at(T.bang, { fx: "shake", dur: 0.25, amp: 0.025 });
FIVE.forEach((w) => { expr(r3(T.bang + 0.08), w, "terrified", { open: 0.3 }); look(r3(T.bang + 0.1), w, [-0.7, 0.1], 0.1); });
see(T.look, T.faces, ["civil", "grab", "crash"], "P02: below, a car in a lamp post, people running, the first one caught");
see(T.faces, T.flu, ["spud.face", "gun.face", "ph_spud"], "the five at the railing, every phone buzzing with the same alert");
see(T.flu, T.door, ["gun.face"], "the Gunslinger shrugs: 'It's just the flu.' Then a bang on their own door");

// ================================================================ P03 DAY 1 (5.2 - 8.0): STEP 1, barricade, don't hold
scene(T.door, S.p03);
FIVE.forEach((w) => letGo(r3(T.door - 0.02), w, `ph_${w}`));
FIVE.forEach((w) => putProp(T.door, `ph_${w}`, { x: FAR[0] }));
// Spud and the Samurai drive the wardrobe at the door; the Wizard pushes the table in behind it; Phoenix and the Gunslinger bring chairs
["spud", "sam"].forEach((w) => { A(r3(T.door - 0.02), w, "lean", { to: 14, dur: 0.01 }); both(r3(T.door - 0.02), w, { o: [0.14, 0.55, 0.42] }, 0.01); expr(r3(T.door - 0.02), w, "angry", { open: 0.25 }, 0.01); });
both(r3(T.door - 0.02), "wiz", { o: [0.18, 0.45, 0.4] }, 0.01); expr(r3(T.door - 0.02), "wiz", "terrified", { open: 0.2 }, 0.01);
["phx", "gun"].forEach((w) => { both(r3(T.door - 0.02), w, "cheeks", 0.01); expr(r3(T.door - 0.02), w, "terrified", { open: 0.2 }, 0.01); });
// the chairs go on the barricade once the wardrobe is home
prop(r3(T.shut + 0.1), "chairA", { x: WALLX + 0.75, z: DZ - 0.75, rot: 0 }, 0.01); prop(r3(T.shut + 0.1), "chairB", { x: WALLX + 0.75, z: DZ + 0.65, rot: 180 }, 0.01);
prop(T.door, "robe", { x: WALLX + 0.32 }, r3(T.shut - T.door), "in");
["spud", "sam"].forEach((w) => A(T.door, w, "move", { to: [r3(S.p03[w][0] - 0.5), S.p03[w][1]], dur: r3(T.shut - T.door), steps: 6, ease: "in" }));
prop(r3(T.door + 0.4), "ktable", { x: WALLX + 1.25 }, 1.3, "inOut");
A(r3(T.door + 0.4), "wiz", "move", { to: [r3(S.p03.wiz[0] - 0.45), S.p03.wiz[1]], dur: 1.3, steps: 4, ease: "inOut" });
sfx(T.door, "knock-tap", { gain: 0.5, reason: "fists and bodies against the flat door" });
sfx(r3(T.door + 0.05), "groan", { gain: 0.45, dur: 1.8, reason: "the zombies at the door" });
sfx(r3(T.door + 0.3), "scrape", { gain: 0.45, reason: "the wardrobe scrapes over the boards" });
c.at(r3(T.door + 0.02), { fx: "shake", dur: 0.5, amp: 0.03 });
narrate(T.s1, "Step one: barricade the door. Don't hold it.");
step(T.s1, r3(T.balc - 0.05), 1, "BARRICADE, DON'T HOLD");
sfx(T.free, "sirenwail", { gain: 0.3, dur: 1.2, reason: "a police car's alarm starts down in the street" });
prop(r3(T.free + 0.1), "door", { arm: 0, hands: 0 }, 0.3, "in");
prop(r3(T.shut - 0.12), "door", { ajar: 0 }, 0.1, "in");
sfx(T.shut, "slam", { gain: 0.6, loud: true, reason: "the wardrobe hits the door, the door shuts" });
c.at(T.shut, { fx: "shake", dur: 0.25, amp: 0.035 });
FIVE.forEach((w) => look(r3(T.free + 0.1), w, [0.6, 0.2], 0.15));
see(T.door, T.free, ["spud.face", "door", "robe"], "P03: the door splinters, a zombie arm through the plank; the wardrobe goes against it, the table behind, chairs");
see(T.free, T.balc, ["door", "robe", "ktable"], "a siren outside: the hands let go; the barricade holds the door, not their bodies");

// ================================================================ P04 DAY 1 (8.0 - 10.8): STEP 2, make no sound
scene(T.balc, S.p04);
putProp(T.balc, "chairA", { x: FAR[0] }); putProp(T.balc, "chairB", { x: FAR[0] });
putProp(T.balc, "horde", { x: HX, adv: 0 }); putProp(T.balc, "street", { fog: 0.3 });
["civil", "grab", "first"].forEach((id) => putProp(T.balc, id, { x: FAR[0] }));
prop(T.free, "pcarA", { lights: 1 }, 0.05);
prop(T.balc, "horde", { adv: 6 }, r3(T.fill - T.balc), "linear");
["wiz", "phx"].forEach((w) => { A(r3(T.balc - 0.02), w, "crouch", { to: 1, dur: 0.01 }); expr(r3(T.balc - 0.02), w, "terrified", { open: 0.08 }, 0.01); });
expr(r3(T.balc - 0.02), "spud", "stern", { curve: -0.2 }, 0.01);
gaze(r3(T.balc - 0.01), "spud", S.p04.spud, [-4.3, 0], 0, 0.01);
arm(r3(T.balc - 0.02), "spud", "R", { o: [0.03, 0.62, 0.2] }, 0.01);   // a finger on his lips
narrate(T.s2, "Step two: make no sound.");
step(T.s2, r3(T.fill - 0.05), 2, "MAKE NO SOUND");
c.say(T.sound, "spud", "They follow sound.", 0.9, "whisper", { sub: false });
cap(T.sound, r3(T.fill - 0.03), "They follow sound.", "p04");
sfx(T.balc, "sirenwail", { gain: 0.2, dur: 2.5, reason: "the police car's alarm, far up the street" });
sfx(T.balc, "groan", { gain: 0.25, dur: 2.6, reason: "hundreds of zombies shuffling toward the alarm" });
see(T.balc, T.fill, ["spud.face", "horde", "pcarA", "shoeA"], "P04: shoes off, a finger on the lips; the whole street flows to the noise");

// ================================================================ P05 DAY 1 (10.8 - 13.4): STEP 3, fill the bathtub now
scene(T.fill, S.p05);
putProp(T.fill, "horde", { adv: 6 });
putProp(T.fill, "potG", { x: S.p05.gun[0], y: 0.5, z: S.p05.gun[1] }); hold(T.fill, "gun", "potG", "R", "hand");
arm(r3(T.fill - 0.02), "gun", "R", { o: [0.1, 0.42, 0.42] }, 0.01); arm(r3(T.fill - 0.02), "gun", "L", { o: [0.1, 0.42, 0.42] }, 0.01);
gaze(r3(T.fill - 0.01), "gun", S.p05.gun, TUB, -0.3, 0.01);
both(r3(T.fill - 0.02), "phx", { o: [0.14, 0.4, 0.34] }, 0.01); gaze(r3(T.fill - 0.01), "phx", S.p05.phx, TUB, -0.3, 0.01);
both(r3(T.fill - 0.02), "wiz", { o: [0.14, 0.45, 0.3] }, 0.01); gaze(r3(T.fill - 0.01), "wiz", S.p05.wiz, [XB - 0.35, 0.85], -0.5, 0.01);
arm(r3(T.fill - 0.02), "spud", "R", "point", 0.01); gaze(r3(T.fill - 0.01), "spud", S.p05.spud, [XB - 0.35, 0.85], -0.5, 0.01);
FIVE.forEach((w) => expr(r3(T.fill - 0.02), w, "focused", {}, 0.01));
prop(T.fill, "tub", { fill: 0.9 }, r3(T.dry - T.fill - 0.1), "linear");
prop(r3(T.fill + 0.4), "potG", { fill: 1 }, 1.4, "linear");
for (let i = 0; i < 4; i++) arm(r3(T.fill + 0.4 + i * 0.5), "spud", "R", { o: [0.18 + 0.05 * (i % 2), 0.42, 0.4] }, 0.2);   // he counts the bottles
sfx(T.fill, "bubbling", { gain: 0.35, dur: 2.5, reason: "the tap running full into the tub" });
sfx(r3(T.fill + 0.2), "splash", { gain: 0.25, reason: "water drumming into the pot" });
narrate(T.s3, "Step three: fill the bathtub, while the water still runs.");
step(T.s3, r3(T.dry - 0.05), 3, "FILL THE BATHTUB NOW");
see(T.fill, T.dry, ["tub", "bottles", "gun.face", "spud.face"], "P05: the tap runs full: the tub, every pot, every bottle is filled while there still is water");

// ================================================================ P06 DAY 3 (13.4 - 16.1): STEP 4, ration it. One cup each.
scene(T.dry, S.p06);
letGo(r3(T.dry - 0.02), "gun", "potG"); putProp(T.dry, "potG", { x: FAR[0] });
putProp(T.dry, "bath", { dim: 1, glowx: 0.3, glowz: -0.6 }); putProp(T.dry, "tub", { fill: 0.7, run: 0 });
putProp(T.dry, "tally", { n: 3 }); putProp(T.dry, "candleB", { x: XB + 0.95, y: 0.56, z: -0.7 });
putProp(T.dry, "cupS", { x: S.p06.spud[0], y: 0.5, z: S.p06.spud[1] }); hold(T.dry, "spud", "cupS", "R", "hand");
putProp(T.dry, "cupW", { x: S.p06.wiz[0], y: 0.5, z: S.p06.wiz[1] }); hold(T.dry, "wiz", "cupW", "L", "hand");
FIVE.forEach((w) => { expr(r3(T.dry - 0.02), w, "sad", { curve: -0.2, lidL: 0.25, lidR: 0.25 }, 0.01); gaze(r3(T.dry - 0.01), w, S.p06[w], TUB, -0.3, 0.01); });
arm(r3(T.dry - 0.02), "wiz", "L", { o: [0.1, 0.4, 0.3] }, 0.01);
arm(r3(T.dry - 0.02), "spud", "R", { o: [0.12, 0.4, 0.42] }, 0.01);
sfx(T.dry, "squirt", { gain: 0.3, reason: "the dry tap coughs once" });
sfx(r3(T.dry + 0.2), "drip", { gain: 0.25, reason: "the last drip from the tap" });
// Spud dips the cup into the tub and hands it to the Wizard
arm(r3(T.dry + 0.5), "spud", "R", { o: [0.18, 0.3, 0.55] }, 0.4, "inOut"); prop(r3(T.dry + 0.9), "cupS", { fill: 1 }, 0.2);
sfx(r3(T.dry + 0.9), "plunk", { gain: 0.3, reason: "the cup dips into the stored water" });
A(r3(T.dry + 1.2), "spud", "turn", { to: -150, dur: 0.4 });
arm(r3(T.dry + 1.3), "spud", "R", { o: [0.2, 0.42, 0.5] }, 0.4, "inOut");
expr(r3(T.dry + 1.4), "wiz", "kind", { curve: 0.1 });
narrate(T.s4, "Step four: ration every drop.");
step(T.s4, r3(T.growl - 0.05), 4, "RATION IT");
c.say(T.one, "spud", "One cup each.", 0.8, "whisper", { sub: false });
cap(T.one, r3(T.growl - 0.03), "One cup each.", "p06");
see(T.dry, T.growl, ["spud.face", "wiz.face", "tub", "tally"], "P06: day 3, the tap is dry; they drink from the tub they filled, one cup each, the tally marks on the wall");

// ================================================================ P07 DAY 6 (16.1 - 18.4): the empty tin, the growl. It won't hold.
scene(T.growl, S.p07);
letGo(r3(T.growl - 0.02), "spud", "cupS"); letGo(r3(T.growl - 0.02), "wiz", "cupW");
["cupS", "cupW", "candleB"].forEach((id) => putProp(T.growl, id, { x: FAR[0] }));
putProp(T.growl, "flat", { dim: 0.35 }); putProp(T.growl, "door", { hole: 1, ajar: 0, bulge: 0.1, arm: 0, hands: 0 });
putProp(T.growl, "robe", { x: WALLX + 0.2, z: DZ + 0.35 }); putProp(T.growl, "ktable", { x: FAR[0] });
putProp(T.growl, "tinE", { x: XH - 0.1, y: 0.04, z: DZ - 0.95 });
c.at(T.growl, { macro: "narrate", line: "Day six. The food is gone.", voice: "narrator", caption: false });
FIVE.forEach((w) => expr(r3(T.growl - 0.02), w, "sad", { curve: -0.15 }, 0.01));
sfx(r3(T.growl + 0.25), "rumble", { gain: 0.5, dur: 0.6, reason: "Phoenix's stomach growls, far too loud" });
both(r3(T.growl - 0.02), "phx", { o: [0.06, 0.34, 0.2] }, 0.01); expr(r3(T.growl + 0.27), "phx", "shocked", { open: 0.14 });
["spud", "sam", "wiz", "gun"].forEach((w) => { gaze(r3(T.growl + 0.45), w, S.p07[w], S.p07.phx, 0, 0.12); expr(r3(T.growl + 0.5), w, "terrified", { open: 0.15 }); });
prop(T.press, "door", { shadows: 12 }, 0.6, "linear"); prop(r3(T.press + 0.15), "door", { bulge: 0.85 }, 1.2, "in");
prop(r3(T.press + 0.2), "robe", { bend: 0.5 }, 1.0, "inOut");
sfx(T.press, "groan", { gain: 0.5, dur: 1.6, reason: "a dozen zombies press on the door" });
sfx(r3(T.press + 0.3), "creak", { gain: 0.5, reason: "the door bows inward" });
c.at(r3(T.press + 0.3), { fx: "shake", dur: 0.9, amp: 0.025 });
["spud", "sam", "wiz", "gun"].forEach((w, i) => {
  A(r3(T.press + 0.1 + i * 0.04), w, "turn", { to: -90, dur: 0.5 }); A(r3(T.press + 0.2 + i * 0.04), w, "move", { to: [S.p07[w][0] - 0.07, S.p07[w][1]], dur: 0.3, steps: 2 });
  both(r3(T.press + 0.35), w, w === "spud" || w === "sam" ? { o: [0.06, 0.4, 0.2] } : { o: [0.12, 0.55, 0.36] }, 0.45); look(r3(T.press + 0.1), w, [0, 0], 0.1);
});
expr(r3(T.press + 0.2), "phx", "terrified", { open: 0.3 });
c.say(T.hold, "spud", "It won't hold.", 0.8, "excited", { sub: false });
cap(T.hold, r3(T.throw - 0.03), "It won't hold.", "p07");
see(T.growl, T.press, ["phx.face", "tinE"], "P07: the last tin is empty on the floor; Phoenix's stomach growls");
see(T.press, T.throw, ["phx.face", "door", "robe"], "the door bulges with silhouettes; staying means starving and the door will go");

// ================================================================ P08 DAY 6 (18.4 - 21.3): STEP 5, make your noise somewhere else
scene(T.throw, S.p08);
putProp(T.throw, "ladder", { x: LAD.x0, sag: 0.3 }); putProp(T.throw, "tinE", { x: FAR[0] });
putProp(T.throw, "horde", { adv: 0, gx: PB[0] - HX, gz: PB[1] - HZ, up: 0 }); putProp(T.throw, "pcarA", { lights: 0 });
A(r3(T.throw - 0.02), "gun", "crouch", { to: 1, dur: 0.01 }); expr(r3(T.throw - 0.02), "gun", "terrified", { open: 0.08 }, 0.01);
putProp(T.throw, "clock", { x: S.p08.spud[0] + 0.15, y: 0.55, z: S.p08.spud[1] + 0.2, ring: 1 }); hold(T.throw, "spud", "clock", "R");
arm(r3(T.throw - 0.02), "spud", "R", { o: [0.2, 0.45, 0.3] }, 0.01); expr(r3(T.throw - 0.02), "spud", "focused", { curve: -0.1 }, 0.01);
sfx(T.throw, "alarmbell", { gain: 0.35, dur: 1.2, reason: "the alarm clock rings in his hand" });
arm(r3(T.throw + 0.4), "spud", "R", { o: [0.12, 0.8, -0.2] }, 0.45, "inOut");           // wind back
A(r3(T.throw + 0.4), "spud", "lean", { to: -10, dur: 0.45 });
arm(r3(T.let - 0.16), "spud", "R", { o: [0.25, 0.75, 0.55] }, 0.2, "out");             // the throw
A(r3(T.let - 0.16), "spud", "lean", { to: 12, dur: 0.2 });
A(T.let, "spud", "release", { prop: "clock", keep: "air", dur: 0 });
prop(T.let, "clock", { x: r3((S.p08.spud[0] + CLK[0]) / 2), y: 2.2, z: r3((S.p08.spud[1] + CLK[1]) / 2), roll: 360 }, 0.45, "out");
prop(r3(T.let + 0.45), "clock", { x: CLK[0], y: -14.9, z: CLK[1], roll: 900 }, r3(T.land - T.let - 0.45), "in");
sfx(T.let, "whoosh", { gain: 0.3, reason: "the clock flies" });
sfx(T.land, "hit-metal", { gain: 0.35, reason: "the clock lands on the street far away" });
sfx(T.land, "alarmbell", { gain: 0.25, dur: 0.7, reason: "it keeps ringing far up the street" });
prop(T.land, "horde", { gx: CLK[0] - HX, gz: CLK[1] - HZ, adv: 4 }, r3(T.shop - T.land), "linear");
narrate(T.s5, "Step five: make your noise somewhere else.");
step(T.s5, r3(T.shop - 0.05), 5, "MAKE YOUR NOISE SOMEWHERE ELSE");
expr(r3(T.land + 0.2), "spud", "stern", { curve: -0.1 }); A(r3(T.land + 0.1), "spud", "lean", { to: 0, dur: 0.3 }); arm(r3(T.land + 0.1), "spud", "R", REST, 0.5);
see(T.throw, T.land, ["spud", "clock", "ladder"], "P08: Spud throws the ringing alarm clock far up the street, the ladder bridge laid beside him");
see(T.land, T.shop, ["horde", "spud"], "every head turns to the clock, the crowd shuffles away from the shop");

// ================================================================ P09 DAY 6 (21.3 - 23.3): the shop. Only what you can run with.
scene(T.shop, S.p09);
putProp(T.shop, "ladder", { x: FAR[0] }); putProp(T.shop, "clock", { x: FAR[0] });
["gun", "spud"].forEach((w) => A(r3(T.shop - 0.02), w, "crouch", { to: 1, dur: 0.01 }));
expr(r3(T.shop - 0.02), "gun", "delighted", { curve: 0.5, lidL: 0.9, lidR: 0.9 }, 0.01); expr(r3(T.shop - 0.02), "spud", "stern", { curve: -0.2, browL: 0.3 }, 0.01);
both(r3(T.shop - 0.02), "gun", { o: [0.2, 0.4, 0.34] }, 0.01);
hold(T.shop, "spud", "pack", "L"); arm(r3(T.shop - 0.02), "spud", "L", { o: [0.22, 0.35, 0.3] }, 0.01); arm(r3(T.shop - 0.02), "spud", "R", { o: [0.3, 0.66, 0.2] }, 0.01);   // a small pack; a flat hand
gaze(r3(T.shop - 0.01), "gun", S.p09.gun, [XS - 1.38, -0.1], -0.3, 0.01); gaze(r3(T.shop - 0.01), "spud", S.p09.spud, S.p09.gun, 0, 0.01);
prop(T.shop, "bag", { fill: 1 }, r3(T.back - T.shop - 0.3), "linear");
for (let i = 0; i < 4; i++) {
  const t = r3(T.shop + 0.05 + i * 0.42);
  arm(t, "gun", "R", { o: [0.3, 0.62, 0.3] }, 0.16, "out"); arm(r3(t + 0.2), "gun", "R", { o: [0.26, 0.36, 0.38] }, 0.16, "in");
  prop(t, "tinG", { x: XS - 1.78, y: 0.78, z: -0.1 }, 0.16, "out"); prop(r3(t + 0.2), "tinG", { x: XS - 1.42, y: 0.66, z: -0.1 }, 0.16, "in");
  sfx(r3(t + 0.36), "tink", { gain: 0.3, reason: "a tin drops into the sack" });
}
c.say(T.run, "spud", "Only what you can run with.", 1.2, "whisper", { sub: false });
cap(T.run, r3(T.back - 0.03), "Only what you can run with.", "p09");
expr(r3(T.run + 1.3), "gun", "annoyed", { curve: -0.1 });
see(T.shop, T.back, ["gun.face", "spud.face", "bag", "pack"], "P09: the Gunslinger stuffs a sack far too heavy; Spud with a small pack: only what you can run with");

// ================================================================ P10 DAY 6 (23.3 - 26.9): back on the ladder. A tin slips. Drop it!
letGo(r3(T.back - 0.02), "spud", "pack"); putProp(T.back, "pack", { x: FAR[0] });
putProp(T.back, "ladder", { x: LAD.x0, sag: 1 });
putProp(T.back, "horde", { adv: 0, gx: PB[0] - HX, gz: PB[1] - HZ, up: 0 });
const BD = r3(T.drop - T.back), G0 = GX + 0.5, S0 = GX + 1.7, S1 = GX + 1.2;
["gun", "spud"].forEach((w) => A(r3(T.back - 0.03), w, "crouch", { to: 0, dur: 0.01 }));
crawl(T.back, "gun", G0, GX, BD, 1, 0, -1, 40);
crawl(T.back, "spud", S0, S1, BD, 1, 0, -1, 40);
putProp(T.back, "bag", { x: G0 + 0.28, y: r3(ladY(G0, 1) + 0.74), z: 0, fill: 1 });
prop(T.back, "bag", { x: GX + 0.28, y: r3(ladY(GX, 1) + 0.74) }, BD, "linear");
putProp(T.back, "tinG", { x: G0 + 0.35, y: r3(ladY(G0, 1) + 1.0), z: 0.5 });
prop(T.back, "tinG", { x: GX + 0.6, y: r3(ladY(GX, 1) + 1.0), z: 0.55 }, r3(T.slip - T.back), "linear");
prop(T.slip, "tinG", { x: PB[0] - 0.25, y: -12.75, z: PB[1] + 0.2, roll: 540 }, r3(T.hit - T.slip), "in");
expr(r3(T.back - 0.02), "gun", "angry", { open: 0.25 }, 0.01); expr(r3(T.back - 0.02), "spud", "terrified", { open: 0.1 }, 0.01);
expr(r3(T.slip + 0.15), "spud", "terrified", { open: 0.3 }); look(r3(T.slip + 0.1), "spud", [0, -0.6], 0.1);
expr(r3(T.slip + 0.3), "gun", "shocked", { open: 0.2 });
sfx(T.back, "creak", { gain: 0.45, reason: "the ladder bent deep under the sack" });
sfx(T.slip, "tink", { gain: 0.4, reason: "a tin slips out of the sack" });
sfx(T.hit, "slam", { gain: 0.7, loud: true, reason: "the tin hits the police car's roof" });
prop(r3(T.hit + 0.05), "pcarB", { lights: 1 }, 0.25);
c.at(T.hit, { fx: "shake", dur: 0.25, amp: 0.04 });
sfx(r3(T.hit + 0.1), "sirenwail", { gain: 0.5, dur: 1.4, reason: "the police car's alarm goes off" });
prop(T.up, "horde", { up: 1 }, 0.5, "linear");
sfx(T.up, "groan", { gain: 0.6, dur: 1.4, reason: "hundreds of zombies, all looking up" });
// Drop it!: Spud reaches back and pulls the strap, the sack goes
arm(r3(T.drop + 0.05), "spud", "R", { o: [0.25, 0.3, 0.6] }, 0.2, "out");
c.say(r3(T.drop + 0.05), "spud", "Drop it!", 0.6, "excited", { sub: false });
cap(r3(T.drop + 0.05), r3(T.fight - 0.03), "Drop it!", "p10", true);
expr(r3(T.drop + 0.1), "spud", "angry", { open: 0.3 }); expr(r3(T.bagGo - 0.2), "gun", "sad", { curve: -0.4 });
prop(T.bagGo, "bag", { x: GX + 0.6, y: -14.6, z: 0.4, roll: 200 }, 1.2, "in");
sfx(T.bagGo, "whoosh", { gain: 0.3, reason: "the sack falls into the street" });
sfx(r3(T.bagGo + 1.2), "thud", { gain: 0.5, reason: "the sack hits the street" });
see(T.back, T.down, ["gun.face", "bag", "tinG", "spud.face"], "P10: he crawls back with the huge sack on his back; one tin slips out and falls");
see(T.down, T.drop, ["horde", "pcarB", "ladder"], "the tin hits the police car, the alarm; hundreds of faces turn straight up");
see(T.drop, T.fight, ["spud.face", "gun.face", "bag"], "Spud: 'Drop it!' The sack falls; they crawl on light");

// ================================================================ P11 DAY 6 (26.9 - 30.0): the door gives way. STEP 6, fight in a doorway
scene(T.fight, S.p11);
putProp(T.fight, "ladder", { x: FAR[0] }); putProp(T.fight, "flat", { dim: 0.35 });
putProp(T.fight, "door", { shadows: 12, bulge: 1, burst: 1 }); putProp(T.fight, "robe", { x: WALLX + 0.65, z: DZ + 1.25, rot: 30, bend: -0.6 });
putProp(T.fight, "inflat", { x: WALLX - 0.95, z: DZ, adv: 0.6 });
// both forearms taped in magazines, the tools held crosswise: Spud the broom, the Wizard the mop
putProp(T.fight, "broom", { x: S.p11.spud[0], y: 0.5, z: S.p11.spud[1] }); hold(T.fight, "spud", "broom", "R", "low");
putProp(T.fight, "mop", { x: S.p11.wiz[0], y: 0.5, z: S.p11.wiz[1] }); hold(T.fight, "wiz", "mop", "L", "low");
putProp(T.fight, "guardS", { x: S.p11.spud[0], y: 0.5, z: S.p11.spud[1] }); hold(T.fight, "spud", "guardS", "L", "hand");
putProp(T.fight, "guardW", { x: S.p11.wiz[0], y: 0.5, z: S.p11.wiz[1] }); hold(T.fight, "wiz", "guardW", "R", "hand");
["spud", "wiz"].forEach((w) => { both(r3(T.fight - 0.02), w, { o: [0.12, 0.45, 0.45] }, 0.01); expr(r3(T.fight - 0.02), w, "angry", { open: 0.2 }, 0.01); A(r3(T.fight - 0.02), w, "crouch", { to: 0.4, dur: 0.01 }); });
sfx(T.fight, "slam", { gain: 0.8, loud: true, reason: "the flat door bursts in" });
c.at(r3(T.fight + 0.02), { fx: "shake", dur: 0.3, amp: 0.05 });
sfx(r3(T.fight + 0.1), "groan", { gain: 0.6, dur: 2.8, reason: "zombies in the doorway, one at a time" });
// push, they stumble back, they come again: three shoves
[0.35, 1.25, 2.15].forEach((d, i) => {
  const t = r3(T.fight + d);
  prop(t, "inflat", { adv: 1.25 }, 0.3, "in");
  ["spud", "wiz"].forEach((w) => { both(r3(t + 0.25), w, { o: [0.12, 0.5, 0.72] }, 0.15, "out"); A(r3(t + 0.25), w, "lean", { to: 12, dur: 0.15 }); });
  sfx(r3(t + 0.32), "thud", { gain: 0.55, reason: "the broom and the mop slam the first zombie back" });
  c.at(r3(t + 0.32), { fx: "shake", dur: 0.15, amp: 0.03 });
  prop(r3(t + 0.33), "inflat", { adv: 0.55 }, 0.3, "out");
  ["spud", "wiz"].forEach((w) => { both(r3(t + 0.55), w, { o: [0.12, 0.45, 0.45] }, 0.25); A(r3(t + 0.55), w, "lean", { to: 0, dur: 0.25 }); });
});
narrate(T.s6, "Step six: if you must fight, fight in a doorway.");
step(T.s6, r3(T.cross - 0.05), 6, "IF YOU MUST FIGHT, FIGHT IN A DOORWAY");
see(T.fight, T.cross, ["spud.face", "wiz.face", "inflat", "broom", "mop"], "P11: the door bursts; Spud and the Wizard hold the narrow hall, forearms taped, one zombie at a time; Phoenix waves the others to the ladder");

// ================================================================ P11b DAY 6 (30.0 - 31.4): all five over the ladder
letGo(r3(T.cross - 0.02), "spud", "broom"); letGo(r3(T.cross - 0.02), "spud", "guardS"); letGo(r3(T.cross - 0.02), "wiz", "mop"); letGo(r3(T.cross - 0.02), "wiz", "guardW");
["broom", "mop", "guardS", "guardW", "inflat"].forEach((id) => putProp(T.cross, id, { x: FAR[0] }));
putProp(T.cross, "ladder", { x: LAD.x0, sag: 0.6 }); putProp(T.cross, "horde", { reach: 1, up: 1 });
const RUNX = { sam: [1.75, 3.6], gun: [0.4, 2.35], phx: [-0.75, 1.25], wiz: [-2.0, 0.0], spud: [-3.25, -1.25] };
Object.entries(RUNX).forEach(([w, [x0, x1]]) => { crawl(T.cross, w, x0, x1, r3(T.roof - T.cross), 0.6, 0, 1, 60); expr(r3(T.cross - 0.02), w, "terrified", { open: 0.3 }, 0.01); });
prop(T.cross, "flood", { x: -6.3, gx: 9, gz: 0, adv: 2.6, reach: 1 }, r3(T.roof - T.cross), "linear");
c.say(r3(T.cross + 0.1), "spud", "GO!", 0.5, "excited", { sub: false });
cap(r3(T.cross + 0.1), r3(T.roof - 0.03), "GO!", "run", true);
sfx(T.cross, "creak", { gain: 0.5, reason: "the ladder under five" });
see(T.cross, T.roof, ["spud", "ladder", "flood", "horde"], "all five crawl over the ladder to the shop roof; the zombies reach the balcony behind them");

// ================================================================ P12 DAY 7 (31.4 - 35.5): the roof. Water. Silence. High ground.
scene(T.roof, S.p12);
Object.entries(S.p12).forEach(([w, p]) => sitDown(r3(T.roof - 0.015), w, p[2]));
putProp(T.roof, "street", { dawn: 1 }); putProp(T.roof, "pcarB", { lights: 0 }); putProp(T.roof, "ladder", { x: FAR[0] }); putProp(T.roof, "half", { x: 5.4, z: 2.3, rot: 100 });
putProp(T.roof, "flood", { x: -3.95, adv: 0, gx: 9, gz: 0, reach: 1 }); putProp(T.roof, "flood2", { x: -3.95, reach: 1 }); putProp(T.roof, "horde", { up: 0, reach: 0 });
putProp(T.roof, "tinL", { x: 5.0, y: 0, z: 1.3, open: 1 }); putProp(T.roof, "spoon", { x: 4.85, y: 0.36, z: 1.3 });
putProp(T.roof, "rainb", { x: 5.05, y: 0, z: 0.55 });
c.at(T.roof, { macro: "narrate", line: "Day seven.", voice: "narrator", caption: false });
narrate(T.recap, "Water. Silence. High ground.");
cap(T.recap, r3(T.less - 0.05), "Water. Silence. High ground.", "p12");
FIVE.forEach((w) => { expr(r3(T.roof - 0.01), w, "sad", { curve: -0.1, lidL: 0.4, lidR: 0.4 }, 0.01); both(r3(T.roof - 0.01), w, "lap", 0.01); gaze(r3(T.roof - 0.01), w, S.p12[w], [4.95, 1.0], -0.3, 0.01); });
["wiz", "gun"].forEach((w) => expr(r3(T.roof - 0.005), w, "serene", { lidL: 1, lidR: 1 }, 0.005));
both(r3(T.roof - 0.005), "gun", { o: [0.06, 0.34, 0.2] }, 0.005);
sfx(T.roof, "patter", { gain: 0.12, dur: 2.0, reason: "the last drops of rain into the bucket" });
look(r3(T.less - 0.2), "spud", [0, 0.1], 0.2);
c.say(T.less, "spud", "Tomorrow we take less.", 1.0, "whisper", { sub: false });
cap(T.less, r3(T.end - 0.05), "Tomorrow we take less.", "p12");
sfx(T.belly, "rumble", { gain: 0.5, dur: 0.5, reason: "the Gunslinger's stomach" });
expr(r3(T.belly + 0.05), "gun", "shocked", { open: 0.1 });
["spud", "sam", "wiz", "phx"].forEach((w) => gaze(r3(T.belly + 0.2), w, S.p12[w], S.p12.gun, -0.1, 0.12));
see(T.roof, T.end, ["spud.face", "gun.face", "tinL", "rainb", "flood"], "P12: day 7, all five alive on the roof with rainwater and one tin; the old balcony full of zombies across the street");

// ---------------------------------------------------------------- HUD: the day
const HUD = { ...hud({ label: "SURVIVE IT", day: [[0, 1], [T.dry, 3], [T.growl, 6], [T.roof, 7]] }), sky: false, clockTag: false };

// ---------------------------------------------------------------- shots
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to: { fov: CAM[k].fov, look: CAM[k].look, ...to }, dur, ease }) });
const beats = c.beats([
  ["P01 the news: stay indoors", 0, sh("NEWS"), "hook"],
  ["P02a the outbreak in the street", T.look, sh("WIN")],
  ["P02b every phone, the flu", T.faces, sh("FACES")],
  ["P03 step 1: barricade", T.door, sh("DOOR")],
  ["P04 step 2: no sound", T.balc, sh("BALC")],
  ["P05 step 3: fill the bathtub", T.fill, sh("TUBC")],
  ["P06 step 4: ration it", T.dry, sh("TUBC")],
  ["P07 day 6, the growl", T.growl, sh("GROWL")],
  ["P08 step 5: the alarm clock", T.throw, sh("THROW")],
  ["P09 the shop", T.shop, sh("SHOP")],
  ["P10 a tin slips", T.back, sh("LADC")],
  ["P10b every face turns up", T.down, sh("DOWN", { fov: 34 }, 0.9, "inOut")],
  ["P10c drop it", T.drop, sh("LADC")],
  ["P11 step 6: the doorway fight", T.fight, sh("HALL")],
  ["P11b all five cross", T.cross, sh("HIGH")],
  ["P12 day 7, the roof", T.roof, sh("ROOF"), "payoff"],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
const WORLD = ["street", "horde", "flood", "flood2", "inflat", "first", "civil", "grab", "crash", "flat", "living", "bath", "shop", "ladder", "half", "door", "robe", "ktable", "sofa", "tv", "ctable", "tub", "bottles", "potA", "potB", "pcarA", "pcarB", "chairA", "chairB", "shoeA", "shoeB"];
const HELD = ["bag", "tinG", "pack", "clock", "potG", "cupS", "cupW", "broom", "mop", "guardS", "guardW", ...FIVE.map((w) => `ph_${w}`)];
write(import.meta.url, {
  id: "zombies-v2",
  title: "How to survive a zombie apocalypse",
  idea: "Survive it (realistic, teaches real steps): the outbreak starts on a normal morning; five friends survive a week in a fifth-floor flat by six real survival steps, acted on screen and named by the narrator",
  format: "series: Survive it (title spoken at 0.0, day HUD, STEP cards, one cause-and-effect chain, realistic, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [230, 640],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "plain", color: "#a9afb3", floor: "none", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.06, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["tv", "spud", "wiz"], hint: 0, what: "opener A: the outbreak is on the TV at frame 0 (a hospital with blocked doors, then STAY INDOORS), five friends frozen on the sofa" },
  hud: HUD,
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...WORLD.map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "the world the cast stands in and on (sets, furniture, the crowds)" })),
    ...HELD.map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "rough draft: carried things held where the hand closed on them (grab keep or the prop's grip), not a fitted hold yet" })),
    { who: "gun", with: "wiz", from: T.press, to: T.throw, checks: ["character-overlap"], reason: "P07: four shoulder to shoulder against the wardrobe; a glove brushes the Wizard's cape for two frames" },
    { who: "spud", from: r3(T.let - 0.2), to: r3(T.let + 0.1), checks: ["rig-jump"], reason: "P08: the throw; the arm snaps forward and lets the clock go (a throw is fast)" },
    ...["wiz", "gun"].map((who) => ({ who, from: T.cross, to: T.roof, checks: ["face-hidden"], reason: "P11b: all five crawl over the ladder seen from high above; the crawl is the beat, not a face" })),
  ],
  panels: { md: "storyboards/series/survive-it/04-zombies/PANELS-v2.md" },
  notes: "Generated by storyboards/series/survive-it/04-zombies/make-zombies-v2.mjs.",
});
