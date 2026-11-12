// Survive it: "How to survive a zombie apocalypse" v3 (gun fight, chase, shelter) from v2: REAL SURVIVAL STEPS (Jonny 12 Nov 2026 13:52 Berlin on v1:
// "the survive it videos should kind of actually show ways to survive the situation", the water gap, "a proper zombie
// apocalypse video needs a fight against zombies"; 14:04 "show the outbreak scenario aswell"; 14:25 "create the video").
// Target: the 14-panel sheet panels-sheet-v3.png next to this file; chain
// /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-V3-GUNFIGHT-CHAIN.md.
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
// Run: node storyboards/series/survive-it/04-zombies/make-zombies-v3.mjs
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud, rule } from "../../../lib/overlay.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1180 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
// the orchestral score joined at v3's seconds (engine/soundgen/score-zombies-v3.json): dread from 0.0 (a longer take),
// full orchestra from the first shot (T.shot1), slow piano at the sunrise (T.dawn). If those move, join again.
const MUSIC = { file: "ai/zombies-score/zombies-score-03.ogg", lock: false, dip: false, gain: 0.45 };
const SUB_STYLE = {};

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;   // main keeps instant cut cheats on their beat (#214)
const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded DOWN to ms

// ---------------------------------------------------------------- the timeline (story seconds)
// Jonny 12 Nov 16:15-16:20 Berlin on v2 rough draft 1: "the voices are overlaying and the story dosnt matches the
// panels ... the lenght is less important than the quality"; "the fight should be a gun fight ending in a being chased
// by zombies and then getting back to shelter". So: ONE SHOT PER PANEL of panels-sheet-v3.png (14), and every voice
// line on its own: a character speaks only after the narrator has finished, with a breath between. The measured
// lengths (VoxCPM narrator = voice 1; character lines) are in the comments; the cut list is built on them.
const T = {
  banner: 1.4,         // P01 the TV: STAY INDOORS                    narrator title 0.0 (2.75)
  look: fr(3.3),       // P02 the window: phones over their shoulders, the outbreak below
  buzz: 3.5,           // every phone buzzes at once
  flu: 4.4,            // Gunslinger: "It's just the flu." (1.0)
  bang: 5.75,          // something bangs on their own door
  door: fr(6.3),       // P03 the door splinters: the barricade
  s1: 6.6,             // STEP 1 (5.13)
  free: 9.9,           // a car alarm in the street, the arms let go
  shut: 10.6,          // the wardrobe is against the door
  balc: fr(12.1),      // P04 the balcony: make no sound
  s2: 12.35,           // STEP 2 (3.55)
  sound: 16.2,         // Spud: "They follow sound." (0.9)
  fill: fr(17.5),      // P05 the bathroom: fill everything
  s3: 17.75,           // STEP 3 (5.39)
  dry: fr(23.55),      // P06 day 3: the tap is dry, one cup each
  s4: 23.8,            // STEP 4 (2.99)
  one: 27.1,           // Spud: "One cup each." (0.8)
  growl: fr(28.3),     // P07 day 6: the empty tin, the door bulges
  day6: 28.45,         // narrator: "Day six. The food is gone." (2.85)
  press: 29.6,         // the door bulges, the wardrobe bends
  water: 31.65,        // Spud: "We need water."
  throw: fr(33.0),     // P08 the balcony: the alarm clock
  s5: 33.2,            // STEP 5 (3.73)
  let: 34.1,           // the clock leaves his hand
  land: 35.2,          // it lands far up the street, ringing
  sneak: fr(37.3),     // P09 down in the street, along the parked cars
  shop: fr(39.8),      // P10 the supermarket
  run: 40.3,           // Spud: "Only what you can run with." (1.2)
  fight: fr(42.2),     // P11 the gun fight: three zombies block the way
  shot1: 42.95, shot2: 43.55, shot3: 44.15,
  s6: 44.75,           // STEP 6
  turn: fr(48.6),      // P12 the horde turns: every shot calls the horde
  calls: 48.8,         // narrator: "Every shot calls the horde."
  chase: fr(52.0),     // P13 the chase back to the building door
  drop: 52.75,         // Spud: "Drop it!" (0.6)
  bagGo: 53.35,        // the sack goes
  inside: 54.9,        // the last one is through the door
  slam: 55.15,         // the door slams
  dawn: fr(57.0),      // P14 day 7, the balcony at sunrise
  day7: 57.2,          // narrator: "Day seven." (0.76)
  recap: 58.3,         // narrator: "Water. Silence. High ground." (4.22)
  less: 62.85,         // Spud: "Tomorrow we take less." (1.0)
  belly: 64.2,         // a stomach growls
  end: 66.0,           // held 2 s after the last line (Jonny: "the ending is abit cut off")
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
const PARKED = [0, 5], KERB = [-1.65, -8.5];   // v3: the left-kerb car at z 6 is a separate prop (pcar3), only there for P09, so it never blocks the run to the door
const CARS = [[-1.65, -15], [-1.65, 6], [0.7, -6], KERB].map((p) => rect(p, 2.0, 4.4)).concat([rect(PA, 2.8, 4.1), rect(PB, 2.8, 4.1)]);
const FIVE = ["spud", "sam", "wiz", "phx", "gun"];
const FAR = [200, 0];
const far = (i) => [FAR[0], 3 + i * 2, 0];
const GX = -0.25;
const MID = r3(LAD.x0 + LAD.len / 2);
const toward = ([x, z], [tx, tz]) => r3(Math.atan2(tx - x, tz - z) * 180 / Math.PI);
// the living room (P01): the sofa against the back wall facing +z, the TV in the front left corner turned to it
const SOFA = [XL - 0.1, -1.35], TV = [XL - 0.75, 0.5];
const SOFA_SEAT = 0.61;   // the couch's cushion top: SEAT_Y 0.42 x its scale 1.45
const TVROT = 95;   // on a cabinet in the front left corner, turned to the sofa: the screen reads in the shot's upper left
// the bathroom (P05, P06): the tub along the back wall, its tap at the -x end
const TUB = [XB + 0.25, -0.88];
// who stands where in each scene: [x, z, yaw]
// street level (P09-P13): the asphalt is y -15 (x -2.6..1.6), the pavements y -14.85; our building's street door on
// our facade at z 9 (DOORZ), the supermarket's glass door across the street at x 3.0, z 1.0
const SY = -15, PY = -14.85, DOORZ = 9.0;
const BAD = [-0.6, 5.6];                  // P11: the three zombies that block the way home
const HS = [HX, -13];                     // the horde up the street round the clock (street level scenes)
const CARS_S = [[-1.65, -15], [0.7, -6], KERB].map(([x, z]) => [r3(x - HS[0]), r3(z - HS[1]), 2.0, 4.4])
  .concat([[r3(PA[0] - HS[0]), r3(PA[1] - HS[1]), 2.8, 4.1], [r3(CRASH[0] - HS[0]), r3(CRASH[1] - HS[1]), 2.6, 4.8]]);
// who stands where in each scene: [x, z, yaw, y]
const S = {
  p01sofa: { wiz: [XL - 0.95, -1.35], sam: [XL - 0.1, -1.35], phx: [XL + 0.75, -1.35] },   // P01: three on the sofa,
  p01: { gun: [XL - 0.55, -0.25, -40], spud: [XL + 0.35, -0.2, -25] },                         // two standing in front of it
  p02: { gun: [-3.85, -0.8, 120], spud: [-3.4, 0.6, 128], phx: far(2), sam: far(0), wiz: far(1) },   // looking down over their shoulders: heads at the top corners, the street between   // P02: at the railing, backs to us, phones up
  p03: { spud: [WALLX + 1.45, DZ - 0.45, -90], sam: [WALLX + 1.45, DZ + 0.45, -90], wiz: [WALLX + 1.25, DZ + 1.32, -130], phx: [WALLX + 2.15, DZ - 1.15, -60], gun: [WALLX + 2.3, DZ + 0.85, -120] },
  p04: { spud: [-3.6, -1.05, -6], wiz: far(3), gun: far(0), sam: far(1), phx: far(2) },   // Spud faces us; the street behind and above his head
  p05: { gun: [XB - 0.75, -0.15, 150], phx: [XB + 0.85, -0.2, -150], wiz: [XB + 0.8, 1.0, -130], spud: [XB - 0.8, 1.0, 130], sam: far(0) },
  p06: { spud: [XB - 0.25, -0.05, -160], wiz: [XB + 0.75, 0.55, -120], gun: [XB - 0.95, 0.5, 140], sam: far(0), phx: far(1) },
  // P07: facing the barricaded door; Phoenix front left clutching his belly, Spud front right turns to him
  p07: { phx: [WALLX + 1.75, DZ - 0.48, 75], spud: [WALLX + 1.65, DZ + 0.65, 120], sam: far(0), wiz: far(1), gun: far(2) },
  p08: { spud: [-3.4, -1.25, 150], wiz: [-3.95, 0.85, 160], gun: far(3), sam: far(1), phx: far(0) },
  // P09: crouched along the parked car at the left kerb, sneaking up the street toward the supermarket
  p09: { spud: [-3.0, 6.9, 180, PY], wiz: [-3.55, 7.7, 180, PY], gun: [-4.15, 8.5, 180, PY], sam: far(0), phx: far(1) },
  p10: { gun: [XS - 1.9, -0.45, 75], spud: [XS - 0.6, -0.5, -65], wiz: [XS - 1.35, -1.4, 20], sam: far(0), phx: far(1) },
  // P11: just out of the supermarket, on their way home; the zombies step out ahead (+z)
  p11: { gun: [0.4, 2.85, -20, SY], spud: [-1.75, 1.0, -110, SY], wiz: [-2.4, 0.15, -120, SY], sam: far(0), phx: far(1) },   // the Gunslinger left in profile, the zombies right; Spud and the Wizard crouched on our pavement in front
  p12: { gun: [0.5, 2.6, 180, SY], spud: [-0.35, 2.0, 175, SY], wiz: [-1.35, 2.65, 185, SY], sam: far(0), phx: far(1) },
  // P13: they run for the street door; the Samurai and Phoenix hold it open
  p13: { spud: [-0.5, 3.0, 0, SY], wiz: [0.6, 2.75, 0, SY], gun: [0.45, 1.7, 0, SY], sam: [-4.1, DOORZ - 1.5, 60, PY], phx: [-3.65, DOORZ + 1.35, 120, PY] },
  // P14: day 7 on our balcony at sunrise, backs to the railing, facing in
  p14: { wiz: [-4.55, -1.15, 0], phx: [-3.43, -1.15, 0], sam: [-4.55, -0.3, 0], gun: [-3.45, -0.3, 0], spud: [-4.0, 0.45, 0] },   // backs to the railing at the street end, facing along the balcony
};

const CAM = {
  NEWS: { pos: [XL + 1.3, 1.9, 2.9], look: [XL - 0.5, 0.75, -0.5], fov: 62 },             // P01: three on the sofa, two in front, the TV upper left
  WIN: { pos: [-4.3, 2.75, 0.9], look: [0.4, -15, -4.5], fov: 66 },                         // P02: over their shoulders and phones, down at the street
  DOOR: { pos: [WALLX + 4.1, 2.45, DZ + 0.4], look: [WALLX + 0.3, 0.95, DZ - 0.05], fov: 64 },
  GROWL: { pos: [WALLX + 4.3, 1.55, DZ], look: [WALLX + 0.6, 0.85, DZ], fov: 66 },     // P03 + P07: facing the barricaded door
  BALC: { pos: [-3.75, 2.65, 0.35], look: [-0.9, -15, -19.0], fov: 66 },                    // P04: above and behind, down the street
  TUBC: { pos: [XB + 0.05, 1.9, 3.9], look: [XB, 0.6, -0.7], fov: 64 },                    // P05 + P06: the tub at the back
  THROW: { pos: [-4.6, 2.4, 1.2], look: [1.5, -12, -14], fov: 62 },                        // P08: behind Spud, the street ahead
  SNEAK: { pos: [-3.25, -13.75, 10.6], look: [-3.3, -14.5, 2.0], fov: 60 },                   // P09: low behind them, up the street
  SHOP: { pos: [XS - 1.2, 0.85, 3.5], look: [XS - 1.25, 0.62, -0.6], fov: 52 },            // P10
  FIGHT: { pos: [-4.6, -13.3, -1.2], look: [-0.4, -14.4, 3.6], fov: 62 },                // P11: over the Gunslinger's shoulder
  TURN: { pos: [0.4, -11.0, 6.8], look: [-0.5, -15.0, -7.0], fov: 60 },                   // P12: high behind them, the horde coming
  CHASE: { pos: [0.9, -12.8, -0.8], look: [-3.4, -14.3, 9.2], fov: 58 },               // P13: behind them, the door ahead, Spud turns back                 // P13: by our door, down the street
  DAWN: { pos: [-3.95, 2.75, 2.5], look: [-3.95, -1.0, -2.6], fov: 64 },                     // P14: from the balcony's other end, the street and the sunrise behind them
};


const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [S.p01.spud[0], S.p01.spud[1]], face: "camera", expr: "shocked", follow: 0.3, seed: 1.4 },
  { id: "sam", character: "duo/samurai", at: S.p01sofa.sam, face: "camera", expr: "shocked", follow: 0.3, seed: 2.3 },
  { id: "wiz", character: "never-has-money/wizard", at: S.p01sofa.wiz, face: "camera", expr: "shocked", follow: 0.3, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: S.p01sofa.phx, face: "camera", expr: "shocked", follow: 0.3, seed: 4.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: [S.p01.gun[0], S.p01.gun[1]], face: "camera", expr: "deadpan", follow: 0.3, seed: 5.2 },
];


const PHONES = FIVE.map((w) => ({ id: `ph_${w}`, kind: "zphone", x: FAR[0], y: 0, z: 20, alert: 0, glow: 1 }));
const props = [
  // the street world (v1)
  { id: "street", kind: "zstreet", x: 0, y: 0, z: 0, parked: PARKED, car: KERB, carRot: 5, alarm: 0, dent: 0, dawn: 0, fog: 0.3 },
  { id: "horde", kind: "zhorde", x: FAR[0], y: -15, z: HZ, n: 620, box: HBOX, seed: 3, avoid: CARS, gx: PA[0] - HX, gz: PA[1] - HZ, adv: 0, up: 0, reach: 0 },
  // the horde at street level (P09-P13): packed round the clock far up the street, then running at the shots
  { id: "hordeS", kind: "zhorde", x: FAR[0], y: -15, z: HS[1], n: 300, box: [5.6, 9], seed: 21, avoid: CARS_S, gx: CLK[0] - HX, gz: CLK[1] - HS[1], adv: 0, up: 0, reach: 0 },
  { id: "pcar3", kind: "citycar", x: FAR[0], y: -15, z: 60, rot: 180, color: "#8a8f86" },   // P09: the parked car they creep along
  { id: "pcarA", kind: "policecar", x: PA[0], y: -15, z: PA[1], rot: 22, scale: 1.1, lights: 0 },
  // the outbreak (P02): a car in a lamp post, people running, the first grab, a few zombies in the street
  { id: "crash", kind: "zcrash", x: CRASH[0], y: -15, z: CRASH[1], rot: 160, hazard: 1, steam: 1 },
  { id: "civil", kind: "zcivil", x: CIV[0], y: -15, z: CIV[1], n: 9, box: [6, 12], seed: 4, run: 0, scatter: 1 },
  { id: "grab", kind: "zgrab", x: GRAB[0], y: -15, z: GRAB[1], rot: 30, grab: 0, fall: 0 },
  { id: "first", kind: "zhorde", x: -0.2, y: -15, z: -9.5, n: 5, box: [5, 6], seed: 13, gx: 0, gz: 8, adv: 0, up: 0, reach: 1 },
  // the gun fight (P11-P13, props-zfight.js): three zombies in the way, the revolver, our building's street door
  { id: "bad", kind: "zshot", x: FAR[0], y: -15, z: 40, rot: 160, n: 3, gap: 1.1, seed: 7, stop: [0.38, 0.69, 1.0], adv: 0, d1: 0, d2: 0, d3: 0 },   // stop: the adv at each one's shot
  { id: "gunR", kind: "zrevolver", x: FAR[0], y: 0, z: 42, flash: 0, smoke: 0 },
  { id: "sdoor", kind: "zstreetdoor", x: -4.88, y: -15, z: DOORZ, rot: 90, open: 1, shake: 0 },
  // the living room (P01)
  { id: "living", kind: "zroom", x: XL, y: 0, z: 0, w: 4.4, d: 4.4, dress: "living", dim: 0, glowx: 0, glowz: 0 },
  { id: "sofa", kind: "couch", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, scale: 1.45, color: "#7b4b35", color2: "#8f5b43" },
  { id: "tv", kind: "ztv", x: TV[0], y: 0, z: TV[1], rot: TVROT, news: 1, glow: 1 },
  // the hall and the front door (P03, P07)
  { id: "flat", kind: "zroom", x: XH, y: 0, z: 0, w: 4.4, d: 4.4, dress: "living", open: [{ wall: "left", at: DZ, w: 1.0, h: 1.85, y0: 0 }], dim: 0, glowx: 0.3, glowz: DZ + 0.12 },
  { id: "door", kind: "zdoor", x: WALLX, y: DOORY, z: DZ, rot: 90, ajar: 1, hands: 4, hole: 1, arm: 1, bulge: 0, shadows: 0, burst: 0 },
  { id: "robe", kind: "wardrobe", x: WALLX + 0.85, y: 0, z: DZ + 0.2, rot: 90, scale: 0.75, apart: 0 },
  { id: "ktable", kind: "kitchentable", x: FAR[0], y: 0, z: 50, rot: 90, w: 1.1, d: 0.7, h: 0.72 },
  { id: "chairA", kind: "woodchair", x: XH - 0.1, y: 0, z: DZ - 0.2, rot: 90 },
  { id: "chairB", kind: "woodchair", x: XH - 0.1, y: 0, z: DZ + 2.2, rot: 90 },
  { id: "tinE", kind: "tin", scale: 1.6, x: FAR[0], y: 0, z: 14, open: 1, tip: 90 },     // P07: the empty last tin on the floor
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
  { id: "candleC", kind: "pillarcandle", x: FAR[0], y: 0.0, z: -0.6, lit: 1 },
  // the balcony (P04, P08, P14)
  { id: "shoeA", kind: "sneaker", x: -3.95, y: 0.06, z: -0.95, rot: 70, color: "#3c6e9e" },
  { id: "shoeB", kind: "sneaker", x: -4.3, y: 0.06, z: -1.05, rot: 95, color: "#a8433a" },
  { id: "clock", kind: "alarm", x: FAR[0], y: 0, z: 32, ring: 0, scale: 1.3 },
  // the supermarket (P10) and what they carry home
  { id: "shop", kind: "zshop", x: XS, y: 0, z: 0, dim: 0.25 },
  { id: "bag", kind: "tinbag", x: XS - 1.38, y: 0, z: -0.1, fill: 0.35, scale: 1.2 },
  { id: "pack", kind: "backpack", x: XS - 0.32, y: 0.2, z: -0.05, rot: -60, color: "#5d6470" },
  { id: "tinG", kind: "tin", scale: 1.6, x: XS - 1.75, y: 0.6, z: -0.1, open: 0 },
  { id: "packW", kind: "zbottles", x: FAR[0], y: 0, z: 44, n: 6, cols: 3, full: 1 },
  // day 7 (P14): the water they brought home, rain in a bucket, one tin
  { id: "packE", kind: "zbottles", x: FAR[0], y: 0, z: 46, n: 6, cols: 3, full: 1 },
  { id: "packF", kind: "zbottles", x: FAR[0], y: 0, z: 48, n: 4, cols: 2, full: 1 },
  { id: "tinL", kind: "tin", scale: 1.6, x: FAR[0], y: 0, z: 10, open: 1 },
  { id: "spoon", kind: "spoon", x: FAR[0], y: 0.02, z: 12 },
  { id: "rainb", kind: "zbucket", x: FAR[0], y: 0, z: 34, fill: 0.75, rain: 0.4 },
  ...PHONES,
];

// props that hang on purpose (qa/support.mjs): each says why
const STAGED = {
  shoeA: "a trainer lying on the balcony tiles", shoeB: "a trainer lying on the balcony tiles", tinL: "parked far away until day 7",
  bath: "the bathroom set, built away from the street like every room", living: "the living room set, built away from the street",
  tally: "marker strokes on the bathroom's back wall", candleB: "the candle stands on the bathtub's rim", candleC: "a candle on the bathroom floor",
  pack: "the backpack hangs from Spud's hand", packW: "the water pack in the Wizard's arms", gunR: "in the Gunslinger's hand",
  tinG: "in the Gunslinger's hand", clock: "in Spud's hand, then thrown",
  spoon: "lying on the tin", bag: "the sack in the Gunslinger's hand, then on his back, then dropped in the street",
  potG: "in the Gunslinger's hands under the tap", cupS: "in Spud's hand", cupW: "in the Wizard's hand",
  sdoor: "our building's street entrance, a porch standing against the facade",
  ...Object.fromEntries(FIVE.map((w) => [`ph_${w}`, "a phone in the hand"])),
};
// small helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { arm(t, who, "R", pose, dur, ease); arm(t, who, "L", pose, dur, ease); };
const REST = "rest";
const sat = new Set();
const stand = (t, who, [x, z, yaw = 0, y = 0]) => {
  const t0 = r3(t - 0.02);
  if (sat.has(who)) { A(r3(t0 - 0.012), who, "stand", { dur: 0.01 }); sat.delete(who); }
  A(t0, who, "pitch", { to: 0, dur: 0.01, ease: "linear" }); A(t0, who, "lean", { to: 0, dur: 0.01 }); A(t0, who, "crouch", { to: 0, dur: 0.01 });
  A(t0, who, "move", { to: [x, z], y, dur: 0.01, steps: 0, ease: "linear" }); A(t0, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" });
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
const CAPY = { p01: 330, p02: 330, p03: 520, p04: 520, p05: 520, p06: 520, p07: 330, p08: 520, p09: 330, p10: 330, p11: 520, p12: 330, p13: 330, p14: 330 };
const cap = (from, to, text, k, pop = false) => c.cap(from, to, text, CAPY[k], pop, SUB_STYLE);
const narrate = (t, line) => c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
const step = (t, to, n, text) => rule(c, t, r3(to - t), `STEP ${n}`, text, { y: 300, angle: -2 });


// ---------------------------------------------------------------- the narrator (voice 1): the title, the six steps, the recap
narrate(0.0, "How to survive a zombie apocalypse.");
cap(0.0, r3(T.look - 0.03), "How to survive a zombie apocalypse", "p01");

// ================================================================ P01 DAY 1 (0 - 2.6): a normal morning. STAY INDOORS.
// Opener A: the outbreak is already on the TV at frame 0. Three on the sofa, the Gunslinger and Spud in front of it.
Object.entries(S.p01sofa).forEach(([w, [x, z]]) => {
  sitDown(0, w, 0, SOFA_SEAT); A(0, w, "move", { to: [x, z], dur: 0, steps: 0 });   // ON the cushions (Jonny 12 Nov: they sat IN the sofa)
  expr(0, w, "shocked", { open: 0.12 }, 0); gaze(0, w, [x, z, 0], TV, 0, 0); both(0, w, "lap", 0);
});
Object.entries(S.p01).forEach(([w, [x, z, yaw]]) => {
  A(0, w, "move", { to: [x, z], dur: 0, steps: 0 }); A(0, w, "turn", { to: yaw, dur: 0 });
  expr(0, w, "shocked", { open: 0.12 }, 0); gaze(0, w, [x, z, yaw], TV, 0.1, 0);
});
sfx(0, "radio", { gain: 0.35, dur: 2.5, reason: "the TV news, urgent, too low to understand" });
prop(T.banner, "tv", { news: 2 }, 0.12);
FIVE.forEach((w, i) => expr(r3(T.banner + 0.15 + i * 0.05), w, "terrified", { open: 0.15 }));
expr(r3(T.banner + 0.2), "gun", "deadpan", { lidL: 0.3, lidR: 0.3 });
see(0, T.banner, ["tv", "spud.face", "wiz.face"], "P01: a normal morning on the sofa; the TV news shows a hospital with blocked doors");
see(T.banner, T.look, ["tv", "spud.face"], "STAY INDOORS on the TV, every face goes still");

// ================================================================ P02 DAY 1 (2.6 - 5.2): the street. It's just the flu.
scene(T.look, S.p02);
putProp(T.look, "street", { fog: 0.15 });
FIVE.forEach((w) => {
  putProp(T.look, `ph_${w}`, { x: S.p02[w][0], y: 0.6, z: S.p02[w][1] });
  hold(T.look, w, `ph_${w}`, "R", "hand"); arm(r3(T.look - 0.02), w, "R", { o: [0.2, 0.92, 0.28] }, 0.01);   // phones held up high, filming the street: their screens face us over their shoulders
  look(r3(T.look - 0.01), w, [0, -0.5], 0.01); expr(r3(T.look - 0.02), w, "terrified", { open: 0.12 }, 0.01);
});
prop(T.look, "civil", { run: 1 }, r3(T.door - T.look), "linear");
prop(r3(T.look + 0.3), "grab", { grab: 1 }, 1.0, "inOut"); prop(r3(T.look + 1.4), "grab", { fall: 1 }, 0.8, "in");
prop(T.look, "first", { adv: 3 }, r3(T.door - T.look), "linear");
prop(T.buzz, "ph_spud", { alert: 1 }, 0.06); ["sam", "wiz", "phx", "gun"].forEach((w, i) => prop(r3(T.buzz + 0.03 * (i + 1)), `ph_${w}`, { alert: 1 }, 0.06));
sfx(T.buzz, "ringtone", { gain: 0.45, dur: 1.2, reason: "every phone's emergency alert at once" });
sfx(T.look, "screech", { gain: 0.25, reason: "a car's tyres far below" });
sfx(r3(T.look + 0.2), "horn", { gain: 0.2, reason: "the crashed car's horn stuck on" });
sfx(r3(T.look + 0.4), "ai/zombie-horde", { gain: 1, dur: 2.0, reason: "screams and groans far below" });
FIVE.forEach((w) => look(r3(T.buzz + 0.15), w, [0, -0.3], 0.15));
expr(r3(T.flu - 0.2), "gun", "deadpan", { lidL: 0.4, lidR: 0.4 }); A(r3(T.flu - 0.15), "gun", "lean", { to: -4, dur: 0.3 });
c.say(T.flu, "gun", "It's just the flu.", 1.0, "calm", { sub: false });
cap(T.flu, r3(T.bang - 0.03), "It's just the flu.", "p02");
sfx(T.bang, "knock", { gain: 0.8, loud: true, reason: "something bangs on their own front door" });
c.at(T.bang, { fx: "shake", dur: 0.25, amp: 0.025 });
FIVE.forEach((w) => { expr(r3(T.bang + 0.08), w, "terrified", { open: 0.3 }); look(r3(T.bang + 0.1), w, [-0.7, 0.1], 0.1); });
see(T.look, T.flu, ["civil", "grab", "crash", "ph_spud", "ph_gun"], "P02: over their shoulders: every phone shows the same alert; below, a car in a lamp post, people running, the first one caught");
see(T.flu, T.door, ["gun.face"], "the Gunslinger shrugs: 'It's just the flu.' Then a bang on their own door");

// ================================================================ P03 DAY 1 (5.2 - 8.0): STEP 1, barricade, don't hold
scene(T.door, S.p03);
FIVE.forEach((w) => letGo(r3(T.door - 0.02), w, `ph_${w}`));
FIVE.forEach((w) => putProp(T.door, `ph_${w}`, { x: FAR[0] }));
// Spud and the Samurai drive the wardrobe at the door; the Wizard pushes the table in behind it; Phoenix and the Gunslinger bring chairs
["spud", "sam"].forEach((w) => { A(r3(T.door - 0.02), w, "lean", { to: 14, dur: 0.01 }); both(r3(T.door - 0.02), w, { o: [0.14, 0.55, 0.42] }, 0.01); expr(r3(T.door - 0.02), w, "angry", { open: 0.25 }, 0.01); });
both(r3(T.door - 0.02), "wiz", "cheeks", 0.01); expr(r3(T.door - 0.02), "wiz", "terrified", { open: 0.2 }, 0.01);
["phx", "gun"].forEach((w) => { both(r3(T.door - 0.02), w, { o: [0.16, 0.42, 0.34] }, 0.01); expr(r3(T.door - 0.02), w, "terrified", { open: 0.2 }, 0.01); });
// the two chairs stand ready in front of Phoenix and the Gunslinger, then go on the barricade
putProp(T.door, "chairA", { x: WALLX + 1.45, z: DZ - 1.25, rot: 90 }); putProp(T.door, "chairB", { x: WALLX + 1.55, z: DZ + 1.25, rot: 90 });
putProp(T.door, "ktable", { x: FAR[0] });
// the chairs go on the barricade once the wardrobe is home
prop(r3(T.shut + 0.1), "chairA", { x: WALLX + 0.75, z: DZ - 0.75, rot: 0 }, 0.01); prop(r3(T.shut + 0.1), "chairB", { x: WALLX + 0.75, z: DZ + 0.65, rot: 180 }, 0.01);
prop(T.door, "robe", { x: WALLX + 0.32 }, r3(T.shut - T.door), "in");
["spud", "sam"].forEach((w) => A(T.door, w, "move", { to: [r3(S.p03[w][0] - 0.5), S.p03[w][1]], dur: r3(T.shut - T.door), steps: 6, ease: "in" }));
sfx(T.door, "knock", { gain: 1, reason: "fists and bodies against the flat door" });
sfx(r3(T.door + 0.05), "ai/zombie-groan", { gain: 1, dur: 1.8, reason: "the zombies at the door" });
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
[].forEach((w) => { A(r3(T.balc - 0.02), w, "crouch", { to: 1, dur: 0.01 }); expr(r3(T.balc - 0.02), w, "terrified", { open: 0.08 }, 0.01); });
expr(r3(T.balc - 0.02), "spud", "stern", { curve: -0.2 }, 0.01);
gaze(r3(T.balc - 0.01), "spud", S.p04.spud, [-3.75, 0.35], 0.3, 0.01);
arm(r3(T.balc - 0.02), "spud", "R", { o: [0.03, 0.62, 0.2] }, 0.01);   // a finger on his lips
narrate(T.s2, "Step two: make no sound.");
step(T.s2, r3(T.fill - 0.05), 2, "MAKE NO SOUND");
c.say(T.sound, "spud", "They follow sound.", 0.9, "whisper", { sub: false });
cap(T.sound, r3(T.fill - 0.03), "They follow sound.", "p04");
sfx(T.balc, "sirenwail", { gain: 0.2, dur: 2.5, reason: "the police car's alarm, far up the street" });
sfx(T.balc, "ai/zombie-horde", { gain: 1, dur: 2.6, reason: "hundreds of zombies shuffling toward the alarm" });
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
sfx(r3(T.dry + 0.25), "ai/drip", { gain: 0.8, reason: "the last drop falls from the dry tap" });
sfx(r3(T.dry + 0.2), "drip", { gain: 0.25, reason: "the last drip from the tap" });
// Spud dips the cup into the tub and hands it to the Wizard
arm(r3(T.dry + 0.5), "spud", "R", { o: [0.18, 0.3, 0.55] }, 0.4, "inOut"); prop(r3(T.dry + 0.9), "cupS", { fill: 1 }, 0.2);
sfx(r3(T.dry + 0.9), "ai/drip", { gain: 0.9, reason: "the cup dips into the stored water" });
A(r3(T.dry + 1.2), "spud", "turn", { to: -150, dur: 0.4 });
arm(r3(T.dry + 1.3), "spud", "R", { o: [0.2, 0.42, 0.5] }, 0.4, "inOut");
expr(r3(T.dry + 1.4), "wiz", "kind", { curve: 0.1 });
narrate(T.s4, "Step four: ration every drop.");
step(T.s4, r3(T.growl - 0.05), 4, "RATION IT");
c.say(T.one, "spud", "One cup each.", 0.8, "whisper", { sub: false });
cap(T.one, r3(T.growl - 0.03), "One cup each.", "p06");
see(T.dry, T.growl, ["spud.face", "wiz.face", "tub", "tally"], "P06: day 3, the tap is dry; they drink from the tub they filled, one cup each, the tally marks on the wall");

// ================================================================ P07 DAY 6: the food is gone, the door bulges. We need water.
scene(T.growl, S.p07);
letGo(r3(T.growl - 0.02), "spud", "cupS"); letGo(r3(T.growl - 0.02), "wiz", "cupW");
["cupS", "cupW", "candleB", "candleC"].forEach((id) => putProp(T.growl, id, { x: FAR[0] }));
putProp(T.growl, "flat", { dim: 0.35 }); putProp(T.growl, "door", { hole: 1, ajar: 0, bulge: 0.1, arm: 0, hands: 3 });
putProp(T.growl, "robe", { x: WALLX + 0.32, z: DZ });
putProp(T.growl, "chairA", { x: FAR[0] }); putProp(T.growl, "chairB", { x: FAR[0] });
putProp(T.growl, "tinE", { x: WALLX + 2.05, y: 0.04, z: DZ + 0.05 });
narrate(T.day6, "Day six. The food is gone.");
expr(r3(T.growl - 0.02), "phx", "sad", { curve: -0.3, lidL: 0.3, lidR: 0.3 }, 0.01); both(r3(T.growl - 0.02), "phx", { o: [0.06, 0.34, 0.2] }, 0.01);
expr(r3(T.growl - 0.02), "spud", "sad", { curve: -0.15 }, 0.01); gaze(r3(T.growl - 0.01), "spud", S.p07.spud, [WALLX + 0.3, DZ], 0.1, 0.01);
gaze(r3(T.growl - 0.01), "phx", S.p07.phx, [WALLX + 2.05, DZ + 0.05], -0.5, 0.01);
sfx(r3(T.growl + 0.4), "rumble", { gain: 0.5, dur: 0.6, reason: "Phoenix's empty stomach growls" });
prop(T.press, "door", { shadows: 12 }, 0.6, "linear"); prop(r3(T.press + 0.15), "door", { bulge: 0.6 }, 1.2, "in");
prop(r3(T.press + 0.2), "robe", { bend: 0.35 }, 1.0, "inOut");
sfx(T.press, "ai/zombie-horde", { gain: 0.8, reason: "zombies press on the door" });
sfx(r3(T.press + 0.3), "creak", { gain: 0.45, reason: "the door bows inward against the wardrobe" });
c.at(r3(T.press + 0.3), { fx: "shake", dur: 0.6, amp: 0.02 });
expr(r3(T.press + 0.2), "phx", "terrified", { open: 0.2 }); look(r3(T.press + 0.1), "phx", [-0.6, 0.1], 0.12);
// Spud turns from the door to Phoenix, then to us: they must go out
A(r3(T.water - 0.45), "spud", "turn", { to: -160, dur: 0.4 }); look(r3(T.water - 0.3), "spud", [0, 0], 0.15);
expr(r3(T.water - 0.25), "spud", "stern", { curve: -0.2, browL: 0.3 });
c.say(T.water, "spud", "We need water.", 0.9, "calm", { sub: false });
cap(T.water, r3(T.throw - 0.03), "We need water.", "p07");
see(T.growl, T.press, ["phx.face", "tinE", "robe"], "P07: day 6, the last tin is empty on the floor; Phoenix holds his empty stomach");
see(T.press, T.throw, ["spud.face", "door", "robe"], "the barricaded door bulges; Spud turns: they need water");

// ================================================================ P08 DAY 6: STEP 5, make your noise somewhere else
scene(T.throw, S.p08);
putProp(T.throw, "tinE", { x: FAR[0] }); putProp(T.throw, "shoeA", { x: FAR[0] }); putProp(T.throw, "shoeB", { x: FAR[0] });
putProp(T.throw, "horde", { x: HX, adv: 0, up: 0 }); putProp(T.throw, "pcarA", { lights: 0 }); putProp(T.throw, "street", { fog: 0.3 });
// the clock held out in front of him at arm's length, never against the body (Jonny 12 Nov: "the clock is in the character")
const FWD = ((y) => [r3(Math.sin(y * Math.PI / 180)), r3(Math.cos(y * Math.PI / 180))])(S.p08.spud[2]);
arm(r3(T.throw - 0.03), "spud", "R", { o: [0.12, 0.5, 0.55] }, 0.01);
putProp(r3(T.throw - 0.01), "clock", { x: r3(S.p08.spud[0] + FWD[0] * 0.62), y: 0.38, z: r3(S.p08.spud[1] + FWD[1] * 0.62), ring: 1 }); hold(r3(T.throw + 0.005), "spud", "clock", "R");
expr(r3(T.throw - 0.02), "spud", "focused", { curve: -0.1 }, 0.01);
sfx(T.throw, "alarmbell", { gain: 0.35, dur: 0.9, reason: "the alarm clock rings in his hand" });
arm(r3(T.throw + 0.35), "spud", "R", { o: [0.12, 0.8, -0.2] }, 0.4, "inOut");           // wind back
A(r3(T.throw + 0.35), "spud", "lean", { to: -10, dur: 0.4 });
arm(r3(T.let - 0.2), "spud", "R", { o: [0.25, 0.75, 0.55] }, 0.2, "out");             // the throw
A(r3(T.let - 0.2), "spud", "lean", { to: 12, dur: 0.2 });
A(T.let, "spud", "release", { prop: "clock", keep: "air", dur: 0 });
prop(T.let, "clock", { x: r3((S.p08.spud[0] + CLK[0]) / 2), y: 2.2, z: r3((S.p08.spud[1] + CLK[1]) / 2), roll: 360 }, 0.45, "out");
prop(r3(T.let + 0.45), "clock", { x: CLK[0], y: -14.9, z: CLK[1], roll: 900 }, r3(T.land - T.let - 0.45), "in");
sfx(T.land, "hit-metal", { gain: 0.3, reason: "the clock lands on the street far away" });
sfx(T.land, "alarmbell", { gain: 0.22, dur: 1.6, reason: "it keeps ringing far up the street" });
prop(T.land, "horde", { gx: CLK[0] - HX, gz: CLK[1] - HZ, adv: 4 }, r3(T.sneak - T.land), "linear");
sfx(r3(T.land + 0.3), "ai/zombie-horde", { gain: 0.6, reason: "the horde turns to the ringing" });
narrate(T.s5, "Step five: make your noise somewhere else.");
step(T.s5, r3(T.sneak - 0.05), 5, "MAKE YOUR NOISE SOMEWHERE ELSE");
expr(r3(T.land + 0.2), "spud", "stern", { curve: -0.1 }); A(r3(T.land + 0.1), "spud", "lean", { to: 0, dur: 0.3 }); arm(r3(T.land + 0.1), "spud", "R", REST, 0.5);
see(T.throw, T.land, ["spud", "clock"], "P08: Spud throws the ringing alarm clock far up the street");
see(T.land, T.sneak, ["horde", "spud"], "every head turns to the clock, the crowd shuffles away up the street");

// ================================================================ P09 DAY 6: down in the street, along the parked cars
scene(T.sneak, S.p09);
putProp(T.sneak, "horde", { x: FAR[0] }); putProp(T.sneak, "pcar3", { x: -1.65, z: 6.0 }); putProp(T.shop, "pcar3", { x: FAR[0] }); putProp(T.sneak, "street", { fog: 0.12 }); putProp(T.sneak, "clock", { x: FAR[0] });
putProp(T.sneak, "hordeS", { x: HS[0], z: HS[1], adv: 1.5, gx: CLK[0] - HX, gz: CLK[1] - HS[1] });
["spud", "wiz", "gun"].forEach((w) => {
  A(r3(T.sneak - 0.02), w, "crouch", { to: 1, dur: 0.01 }); expr(r3(T.sneak - 0.02), w, "focused", { curve: -0.15 }, 0.01);
  A(T.sneak, w, "move", { to: [S.p09[w][0], r3(S.p09[w][1] - 2.6)], y: PY, dur: r3(T.shop - T.sneak - 0.1), steps: 6, ease: "linear" });
});
look(r3(T.sneak + 0.9), "spud", [0.5, 0], 0.2); look(r3(T.sneak + 1.6), "spud", [0, 0], 0.2);
sfx(T.sneak, "alarmbell", { gain: 0.12, dur: 2.4, reason: "the alarm clock still ringing far up the street" });
sfx(r3(T.sneak + 0.2), "ai/zombie-horde", { gain: 0.45, reason: "the horde moaning far up the street" });
see(T.sneak, T.shop, ["spud", "wiz", "gun", "hordeS"], "P09: Spud, the Wizard and the Gunslinger creep along the parked cars to the supermarket; the horde far up the street");

// ================================================================ P10 DAY 6: the supermarket. Only what you can run with.
scene(T.shop, S.p10);
putProp(T.shop, "hordeS", { x: FAR[0] });
["gun", "spud"].forEach((w) => A(r3(T.shop - 0.02), w, "crouch", { to: 1, dur: 0.01 }));
expr(r3(T.shop - 0.02), "gun", "delighted", { curve: 0.5, lidL: 0.9, lidR: 0.9 }, 0.01); expr(r3(T.shop - 0.02), "spud", "stern", { curve: -0.2, browL: 0.3 }, 0.01);
expr(r3(T.shop - 0.02), "wiz", "focused", {}, 0.01);
both(r3(T.shop - 0.02), "gun", { o: [0.2, 0.4, 0.34] }, 0.01);
hold(T.shop, "spud", "pack", "L"); arm(r3(T.shop - 0.02), "spud", "L", { o: [0.22, 0.35, 0.3] }, 0.01); arm(r3(T.shop - 0.02), "spud", "R", { o: [0.3, 0.66, 0.2] }, 0.01);   // a small pack; a flat hand
// the Wizard carries a water pack in both arms
const WF = ((y) => [r3(Math.sin(y * Math.PI / 180)), r3(Math.cos(y * Math.PI / 180))])(S.p10.wiz[2]);
both(r3(T.shop - 0.03), "wiz", { o: [0.17, 0.42, 0.36] }, 0.01);
putProp(r3(T.shop - 0.01), "packW", { x: r3(S.p10.wiz[0] + WF[0] * 0.42), y: 0.26, z: r3(S.p10.wiz[1] + WF[1] * 0.42), rot: S.p10.wiz[2] }); hold(r3(T.shop + 0.005), "wiz", "packW", "R");
gaze(r3(T.shop - 0.01), "gun", S.p10.gun, [XS - 1.38, -0.1], -0.3, 0.01); gaze(r3(T.shop - 0.01), "spud", S.p10.spud, S.p10.gun, 0, 0.01); gaze(r3(T.shop - 0.01), "wiz", S.p10.wiz, S.p10.gun, -0.1, 0.01);
prop(T.shop, "bag", { fill: 1 }, r3(T.fight - T.shop - 0.3), "linear");
for (let i = 0; i < 4; i++) {
  const t = r3(T.shop + 0.05 + i * 0.42);
  arm(t, "gun", "R", { o: [0.3, 0.62, 0.3] }, 0.16, "out"); arm(r3(t + 0.2), "gun", "R", { o: [0.26, 0.36, 0.38] }, 0.16, "in");
  prop(t, "tinG", { x: XS - 1.78, y: 0.78, z: -0.1 }, 0.16, "out"); prop(r3(t + 0.2), "tinG", { x: XS - 1.42, y: 0.66, z: -0.1 }, 0.16, "in");
  sfx(r3(t + 0.36), "kenney/impact-tin-medium", { gain: 0.6, reason: "a tin drops into the sack" });
}
c.say(T.run, "spud", "Only what you can run with.", 1.2, "whisper", { sub: false });
cap(T.run, r3(T.fight - 0.03), "Only what you can run with.", "p10");
expr(r3(T.run + 1.3), "gun", "annoyed", { curve: -0.1 });
see(T.shop, T.fight, ["gun.face", "spud.face", "bag", "packW"], "P10: the Gunslinger stuffs a sack far too heavy; the Wizard has the water; Spud: only what you can run with");

// ================================================================ P11 DAY 6: the gun fight. STEP 6, shoot only if you must
scene(T.fight, S.p11);
letGo(r3(T.fight - 0.02), "spud", "pack"); letGo(r3(T.fight - 0.02), "wiz", "packW"); putProp(T.fight, "pack", { x: FAR[0] }); putProp(T.fight, "tinG", { x: FAR[0] });
putProp(T.fight, "bad", { x: BAD[0], z: BAD[1], adv: 0 });
putProp(T.fight, "hordeS", { x: HS[0], z: HS[1], adv: 2.5 });
// the sack on the Gunslinger's back (L hand on the strap over his shoulder), the revolver in his right hand
putProp(T.fight, "bag", { x: S.p11.gun[0] - 0.05, y: r3(SY + 0.35), z: r3(S.p11.gun[1] - 0.42), fill: 1 }); hold(T.fight, "gun", "bag", "L");
arm(r3(T.fight - 0.03), "gun", "L", { o: [0.18, 0.7, -0.12] }, 0.01);
arm(r3(T.fight - 0.03), "gun", "R", { o: [0.1, 0.62, 0.62] }, 0.01);   // the arm straight out, aiming
const GF = ((y) => [r3(Math.sin(y * Math.PI / 180)), r3(Math.cos(y * Math.PI / 180))])(S.p11.gun[2]);
putProp(r3(T.fight - 0.01), "gunR", { x: r3(S.p11.gun[0] + GF[0] * 0.6), y: r3(SY + 0.62), z: r3(S.p11.gun[1] + GF[1] * 0.6), rot: S.p11.gun[2] }); hold(r3(T.fight + 0.015), "gun", "gunR", "R", "hand");
["spud", "wiz"].forEach((w) => { A(r3(T.fight - 0.02), w, "crouch", { to: 1, dur: 0.01 }); expr(r3(T.fight - 0.02), w, "terrified", { open: 0.25 }, 0.01); look(r3(T.fight - 0.01), w, [0, 0.1], 0.01); });
expr(r3(T.fight - 0.02), "gun", "angry", { curve: -0.2, browL: 0.4, browR: 0.4 }, 0.01);
prop(T.fight, "bad", { adv: 1.2 }, r3(T.shot3 - T.fight + 0.4), "linear");
sfx(r3(T.fight + 0.1), "ai/zombie-groan", { gain: 1, reason: "the first zombie steps out between the cars" });
sfx(r3(T.fight + 0.4), "ai/zombie-groan", { gain: 0.8, reason: "a second one, close" });
[[T.shot1, "d1"], [T.shot2, "d2"], [T.shot3, "d3"]].forEach(([t, d]) => {
  prop(t, "gunR", { flash: 1 }, 0.02, "linear"); prop(r3(t + 0.07), "gunR", { flash: 0 }, 0.03, "linear");
  sfx(t, "ai/revolver-shot", { gain: 1, loud: true, reason: "the Gunslinger fires" });
  arm(t, "gun", "R", { o: [0.1, 0.72, 0.56] }, 0.05, "out"); arm(r3(t + 0.08), "gun", "R", { o: [0.1, 0.62, 0.62] }, 0.18, "inOut");   // recoil
  c.at(t, { fx: "shake", dur: 0.12, amp: 0.02 });
  prop(r3(t + 0.04), "bad", { [d]: 1 }, 0.85, "in");
  sfx(r3(t + 0.8), "thud", { gain: 0.45, reason: "the zombie falls on the asphalt" });
});
prop(r3(T.shot3 + 0.1), "gunR", { smoke: 1 }, 0.4, "out");
expr(r3(T.shot1 + 0.05), "spud", "terrified", { open: 0.35 }); expr(r3(T.shot1 + 0.05), "wiz", "terrified", { open: 0.35 });
narrate(T.s6, "Step six: shoot only if you must.");
step(T.s6, r3(T.turn - 0.05), 6, "SHOOT ONLY IF YOU MUST");
see(T.fight, T.shot3, ["gun.face", "bad", "gunR"], "P11: three zombies step out between the cars and block the way home; the Gunslinger fires, each one drops");
see(T.shot3, T.turn, ["gun.face", "bad", "spud.face"], "the street is quiet for a second: three shots, very loud");

// ================================================================ P12 DAY 6: every shot calls the horde
scene(T.turn, S.p12);
letGo(r3(T.turn - 0.02), "gun", "bag"); letGo(r3(T.turn - 0.02), "gun", "gunR");
putProp(T.turn, "bag", { x: S.p12.gun[0] + 0.05, y: r3(SY + 0.35), z: r3(S.p12.gun[1] + 0.42), fill: 1 }); hold(r3(T.turn + 0.005), "gun", "bag", "L");
arm(r3(T.turn - 0.03), "gun", "L", { o: [0.18, 0.7, -0.12] }, 0.01);
putProp(T.turn, "gunR", { x: r3(S.p12.gun[0] + 0.08), y: r3(SY + 0.45), z: r3(S.p12.gun[1] - 0.25), rot: 180, smoke: 1 }); hold(r3(T.turn + 0.015), "gun", "gunR", "R", "hand");
arm(r3(T.turn - 0.03), "gun", "R", { o: [0.18, 0.45, 0.25] }, 0.01);
prop(T.turn, "hordeS", { gx: r3(S.p12.gun[0] - HS[0]), gz: r3(S.p12.gun[1] - HS[1]), adv: 2, reach: 1 }, 0.01);
prop(r3(T.turn + 0.3), "hordeS", { adv: 5.5 }, r3(T.chase - T.turn - 0.3), "in");   // the front stops ~3 m short of them
FIVE.forEach((w) => expr(r3(T.turn - 0.02), w, "terrified", { open: 0.3 }, 0.01));
sfx(r3(T.turn + 0.1), "ai/zombie-horde", { gain: 1, loud: true, reason: "hundreds of zombies turn to the shots and come" });
sfx(r3(T.turn + 2.0), "ai/zombie-horde", { gain: 1, reason: "the horde, closer" });
narrate(T.calls, "Every shot calls the horde.");
cap(T.calls, r3(T.chase - 0.03), "Every shot calls the horde.", "p12");
see(T.turn, T.chase, ["hordeS", "gun", "spud", "wiz"], "P12: high above the three: the whole horde up the street has turned to the shots and comes running");

// ================================================================ P13 DAY 6: the chase back to the door. Drop it!
scene(T.chase, S.p13);
letGo(r3(T.chase - 0.02), "gun", "gunR"); putProp(T.chase, "gunR", { x: FAR[0] });
putProp(T.chase, "bad", { x: FAR[0] });
putProp(T.chase, "bag", { x: S.p13.gun[0] - 0.3, y: r3(SY + 0.35), z: r3(S.p13.gun[1] - 0.3), fill: 1 }); hold(r3(T.chase + 0.005), "gun", "bag", "L");
arm(r3(T.chase - 0.03), "gun", "L", { o: [0.18, 0.7, -0.12] }, 0.01);
putProp(T.chase, "sdoor", { open: 1, shake: 0 });
// the horde follows them down the street to the door
prop(T.chase, "hordeS", { gx: r3(-3.6 - HS[0]), gz: r3(DOORZ - HS[1]), adv: 6, reach: 1 }, 0.01);
prop(r3(T.chase + 0.05), "hordeS", { adv: 13 }, r3(T.slam - T.chase), "linear");   // a few metres behind them all the way
const runTo = (w, t0, t1, path) => { let t = t0; const leg = r3((t1 - t0) / path.length); path.forEach(([x, z, y = SY]) => { A(r3(t), w, "move", { to: [x, z], y, dur: leg, steps: 4, ease: "linear" }); t += leg; }); };
["spud", "wiz", "gun"].forEach((w) => { expr(r3(T.chase - 0.02), w, "terrified", { open: 0.35 }, 0.01); both(r3(T.chase - 0.02), w, { o: [0.2, 0.5, 0.25] }, 0.01); });
both(r3(T.chase - 0.02), "gun", "rest", 0.01); arm(r3(T.chase - 0.02), "gun", "L", { o: [0.18, 0.7, -0.12] }, 0.01);
// one after the other through the door (each goes up the stairs as it arrives), so no two bodies meet in the porch
const IN = { spud: r3(T.inside - 0.9), wiz: r3(T.inside - 0.35), gun: T.inside };
runTo("spud", T.chase, IN.spud, [[-1.6, 5.4], [-3.6, DOORZ - 0.25, PY], [-4.55, DOORZ - 0.1, PY]]);
runTo("wiz", T.chase, IN.wiz, [[-0.5, 5.4], [-3.0, 9.3, PY], [-4.55, DOORZ + 0.15, PY]]);
runTo("gun", T.chase, IN.gun, [[0.0, 3.8], [-1.7, 6.6], [-3.0, 8.3, PY], [-4.55, DOORZ, PY]]);
["spud", "wiz", "gun"].forEach((w) => stand(r3(IN[w] + 0.06), w, far(FIVE.indexOf(w))));
// Spud looks back: "Drop it!"; the sack goes
look(r3(T.drop - 0.25), "spud", [0.8, 0.1], 0.15);
c.say(T.drop, "spud", "Drop it!", 0.6, "excited", { sub: false });
cap(T.drop, r3(T.inside), "Drop it!", "p13", true);
expr(r3(T.bagGo - 0.15), "gun", "sad", { curve: -0.4 });
A(T.bagGo, "gun", "release", { prop: "bag", keep: "air", dur: 0 });
prop(T.bagGo, "bag", { x: -0.6, y: r3(SY + 0.2), z: 4.4, roll: 120 }, 0.35, "in");
sfx(r3(T.bagGo + 0.35), "thud", { gain: 0.5, reason: "the sack of tins hits the street" });
// the Samurai and Phoenix hold the door, wave them in, then follow
["sam", "phx"].forEach((w) => { both(r3(T.chase - 0.02), w, { o: [0.25, 0.85, 0.3] }, 0.01); expr(r3(T.chase - 0.02), w, "terrified", { open: 0.3 }, 0.01); });
for (let i = 0; i < 4; i++) ["sam", "phx"].forEach((w) => arm(r3(T.chase + 0.2 + i * 0.5), w, "R", { o: [0.25, 0.75 + 0.1 * (i % 2), 0.15 + 0.2 * (i % 2)] }, 0.25));
A(r3(T.inside + 0.0), "sam", "move", { to: [-4.55, DOORZ - 0.1], y: PY, dur: 0.08, steps: 1 }); stand(r3(T.inside + 0.12), "sam", far(1));
A(r3(T.inside + 0.1), "phx", "move", { to: [-4.55, DOORZ + 0.1], y: PY, dur: 0.08, steps: 1 }); stand(r3(T.inside + 0.22), "phx", far(3));
// everyone in: they vanish into the stairwell at the slam
prop(T.slam, "sdoor", { open: 0 }, 0.18, "in");
sfx(T.slam, "slam", { gain: 0.9, loud: true, reason: "the heavy street door slams shut" });
c.at(T.slam, { fx: "shake", dur: 0.2, amp: 0.03 });
prop(r3(T.slam + 0.35), "sdoor", { shake: 1 }, 0.1);
sfx(r3(T.slam + 0.35), "knock", { gain: 1, reason: "fists on the shut door" });
sfx(r3(T.slam + 0.4), "ai/zombie-horde", { gain: 1, reason: "the horde at the door" });
sfx(T.chase, "step-concrete", { gain: 0.6, reason: "running feet on the asphalt" });
see(T.chase, T.drop, ["spud.face", "gun", "hordeS", "sdoor"], "P13: they run for their building's door, the horde a few metres behind; the Samurai and Phoenix hold it open");
see(T.drop, T.slam, ["spud", "gun", "bag", "sdoor"], "'Drop it!': the sack goes, the Gunslinger runs faster; all through the door");
see(T.slam, T.dawn, ["sdoor", "hordeS"], "the door slams; fists on it; they are safe inside");

// ================================================================ P14 DAY 7: sunrise on the balcony. Water. Silence. High ground.
scene(T.dawn, S.p14);
["sam", "gun", "spud"].forEach((w) => sitDown(r3(T.dawn - 0.015), w, S.p14[w][2]));
putProp(T.dawn, "street", { dawn: 1, fog: 0.5 }); putProp(T.dawn, "hordeS", { x: FAR[0] }); putProp(T.dawn, "bag", { x: FAR[0] });
putProp(T.dawn, "horde", { x: HX, adv: 0, gx: 0, gz: 5, up: 0, reach: 0 });
putProp(T.dawn, "packE", { x: -4.62, y: 0, z: 0.5, rot: 0 }); putProp(T.dawn, "packF", { x: FAR[0] });
putProp(T.dawn, "rainb", { x: -3.35, y: 0, z: 0.6 });
putProp(T.dawn, "tinL", { x: -3.42, y: 0, z: 0.15, open: 1 }); putProp(T.dawn, "spoon", { x: -3.42, y: 0.36, z: 0.15 });
putProp(T.dawn, "shoeA", { x: FAR[0] }); putProp(T.dawn, "shoeB", { x: FAR[0] });
narrate(T.day7, "Day seven.");
narrate(T.recap, "Water. Silence. High ground.");
cap(T.recap, r3(T.less - 0.05), "Water. Silence. High ground.", "p14");
FIVE.forEach((w) => { expr(r3(T.dawn - 0.01), w, "sad", { curve: -0.1, lidL: 0.4, lidR: 0.4 }, 0.01); both(r3(T.dawn - 0.01), w, ["wiz", "phx"].includes(w) ? "rest" : "lap", 0.01); look(r3(T.dawn - 0.01), w, [0, -0.2], 0.01); });
["wiz", "gun"].forEach((w) => expr(r3(T.dawn - 0.005), w, "serene", { lidL: 1, lidR: 1 }, 0.005));
look(r3(T.dawn - 0.005), "gun", [0, 0.4], 0.005);   // his eyes up, out from under the hat brim (the camera is above)
sfx(T.dawn, "patter", { gain: 0.1, dur: 2.0, reason: "the last drops of rain into the bucket" });
sfx(r3(T.dawn + 1.0), "ai/zombie-horde", { gain: 0.25, reason: "the horde far below, quiet now" });
look(r3(T.less - 0.25), "spud", [0, 0.1], 0.2); expr(r3(T.less - 0.2), "spud", "kind", { curve: 0.05 });
c.say(T.less, "spud", "Tomorrow we take less.", 1.0, "whisper", { sub: false });
cap(T.less, r3(T.end - 0.05), "Tomorrow we take less.", "p14");
sfx(T.belly, "rumble", { gain: 0.45, dur: 0.5, reason: "the Gunslinger's stomach" });
expr(r3(T.belly + 0.05), "gun", "shocked", { open: 0.1 });
["spud", "phx"].forEach((w) => gaze(r3(T.belly + 0.25), w, S.p14[w], S.p14.gun, -0.1, 0.15));
see(T.dawn, T.end, ["spud.face", "gun.face", "packE", "rainb", "tinL"], "P14: day 7, all five alive on their balcony at sunrise with the water they brought, rain in a bucket and one tin");

// ---------------------------------------------------------------- HUD: the day
const HUD = { ...hud({ label: "SURVIVE IT", day: [[0, 1], [T.dry, 3], [T.growl, 6], [T.dawn, 7]] }), sky: false, clockTag: false };

// ---------------------------------------------------------------- shots: one per panel of panels-sheet-v3.png
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to: { fov: CAM[k].fov, look: CAM[k].look, ...to }, dur, ease }) });
const beats = c.beats([
  ["P01 the news: stay indoors", 0, sh("NEWS"), "hook"],
  ["P02 every phone, the outbreak, the flu", T.look, sh("WIN")],
  ["P03 step 1: barricade", T.door, sh("DOOR")],
  ["P04 step 2: no sound", T.balc, sh("BALC")],
  ["P05 step 3: fill the bathtub", T.fill, sh("TUBC")],
  ["P06 step 4: ration it", T.dry, sh("TUBC")],
  ["P07 day 6: we need water", T.growl, sh("GROWL")],
  ["P08 step 5: the alarm clock", T.throw, sh("THROW")],
  ["P09 down in the street", T.sneak, sh("SNEAK")],
  ["P10 the supermarket", T.shop, sh("SHOP")],
  ["P11 step 6: the gun fight", T.fight, sh("FIGHT")],
  ["P12 every shot calls the horde", T.turn, sh("TURN")],
  ["P13 the chase, drop it", T.chase, sh("CHASE")],
  ["P14 day 7, the balcony", T.dawn, sh("DAWN"), "payoff"],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
const WORLD = ["street", "pcar3", "horde", "hordeS", "first", "civil", "grab", "crash", "flat", "living", "bath", "shop", "door", "robe", "ktable", "sofa", "tv", "tub", "bottles", "potA", "potB", "pcarA", "chairA", "chairB", "shoeA", "shoeB", "bad", "sdoor", "packE", "packF", "rainb", "tinL", "tinE"];
const HELD = ["bag", "tinG", "pack", "clock", "potG", "cupS", "cupW", "packW", "gunR", ...FIVE.map((w) => `ph_${w}`)];
write(import.meta.url, {
  id: "zombies-v3",
  title: "How to survive a zombie apocalypse",
  idea: "Survive it (realistic, teaches real steps): the outbreak starts on a normal morning; five friends survive a week in a fifth-floor flat by six real survival steps, acted on screen and named by the narrator; on day 6 a water run ends in a gun fight, a chase and the door slammed behind them",
  format: "series: Survive it (title spoken at 0.0, day HUD, STEP cards, one cause-and-effect chain, realistic, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [230, 640],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "plain", color: "#a9afb3", floor: "none", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false, surface: "wood" },   // Jonny 12 Nov: no magic or movement sounds, only real ones
  creative: { length: [T.end, T.end] },
  hook: { show: ["tv", "spud", "wiz"], hint: 0, what: "opener A: the outbreak is on the TV at frame 0 (a hospital with blocked doors, then STAY INDOORS), five friends frozen in the living room" },
  hud: HUD,
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...WORLD.map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "the world the cast stands in and on (sets, furniture, the crowds)" })),
    ...HELD.map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "rough draft: carried things held where the hand closed on them (grab keep or the prop's grip), not a fitted hold yet" })),
    ...FIVE.map((who) => ({ who, from: T.look, to: T.door, checks: ["face-hidden", "face-covered"], reason: "P02 as panel 2: the camera looks over their shoulders and phones down at the street; their backs are the shot" })),
    { who: "spud", from: r3(T.let - 0.25), to: r3(T.let + 0.1), checks: ["rig-jump"], reason: "P08: the throw; the arm snaps forward and lets the clock go (a throw is fast)" },
    ...["spud", "wiz", "gun"].map((who) => ({ who, from: r3(T.shop - 0.1), to: r3(T.shop + 0.01), checks: ["rig-jump"], reason: "the cut from the street to the supermarket: they are placed in the shop on the cut" })),
    { who: "wiz", from: 0, to: T.look, checks: ["face-hidden"], reason: "P01 as panel 1: the Gunslinger stands in front of the sofa, the Wizard sits behind him" },
    { who: "spud", with: "gun", from: 0, to: T.look, checks: ["reach"], reason: "P01: Spud's hand brushes the Gunslinger's poncho (3 cm), they stand side by side as in panel 1" },
    { who: "wiz", with: "spud", from: r3(T.chase - 0.05), to: r3(T.chase + 0.2), checks: ["reach"], maxReach: 0.12, reason: "P13: the first strides, the Wizard's arm swings past Spud's side (8 cm, four frames)" },
    { who: "spud", with: "wiz", from: r3(T.inside - 0.9), to: r3(T.inside - 0.75), checks: ["reach"], maxReach: 0.1, reason: "P13: Spud's trailing arm brushes the Wizard as he ducks into the porch (8 cm, two frames)" },
    { who: "sam", with: "gun", from: r3(T.inside - 0.55), to: r3(T.inside - 0.1), checks: ["reach"], reason: "P13: the Samurai's waving hand knocks the Gunslinger's hat as he runs past into the door" },
    { who: "gun", from: T.dawn, to: T.end, checks: ["face-hidden"], reason: "P14: the camera is above the five; the Gunslinger's hat brim covers his eyes when he looks down (rough draft, to fix in the polish)" },
    ...FIVE.map((who) => ({ who, from: r3(T.inside - 1.0), to: r3(T.slam + 0.05), checks: ["rig-jump"], reason: "P13: each one is gone up the stairs as it reaches the dark porch (the cut-away inside the door)" })),
    { who: "gun", from: T.shop, to: T.fight, checks: ["face-hidden"], reason: "P10: the Gunslinger hugs the sack up to his chin, stuffing it (panel 10)" },
    ...["wiz", "phx"].map((who) => ({ who, from: T.dawn, to: T.end, checks: ["face-hidden"], reason: "P14 as panel 14: the two standing at the railing behind the two sitting; their hats and crest show over them" })),
  ],
  panels: { md: "storyboards/series/survive-it/04-zombies/PANELS-v3.md" },
  notes: "Generated by storyboards/series/survive-it/04-zombies/make-zombies-v3.mjs.",
});
