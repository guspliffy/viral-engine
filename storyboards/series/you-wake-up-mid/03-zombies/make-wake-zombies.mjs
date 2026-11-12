// You wake up mid, EP03 "mid zombie apocalypse" (12 Nov 2026). Jonny's own chain (20:59 Berlin), one story with a dying
// end that wakes up in the next scene (21:05), the teaser "mid psycho experiment" (21:08), the 14-panel Codex sheet
// ("looks good" 21:47). Target: OUTLINE.md (v3) where the sheet departs. New looks: DESIGN.md (Fable 5.2).
// Working memory: NOTES.md. Narrator lengths measured by measure-lines.mjs (VoxCPM2, voice "narrator").
//
// Chain: you wake on a zombie street, your best friend dragged away by the hood, six bullets -> you shoot the one that has
// him (5) -> every shot is loud, more come -> a building door: one inside, shoved and shot (4) -> door shut, cabinet in
// front -> up the stairwell, two on the landing (3, 2), the street door gives way below, one more (1) -> the roof: zombies
// in every street, no way down -> "One bullet. What do you do?" (1 SHOOT / 2 JUMP) -> he shoots (0), three more push out,
// no room for a run-up -> they jump from standing, fall short -> his eyes close over the reaching hands -> "You wake up
// mid psycho experiment." Stake line at 0.0 (stake-first rule): "Six bullets to get your best friend out."
//
// Places (each look far from the others; the far plane is 300 m): the street (zstreet) at the origin, street floor y -15;
// the hallway (zroom, dress hall) at z -400; the stairwell (zstairs) at x -400; the roofs (zroof) at x 600; the waiting room
// (zwait) at z 400. Run: node storyboards/series/you-wake-up-mid/03-zombies/make-wake-zombies.mjs
import { readFileSync } from "node:fs";
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import { vote } from "../../../lib/overlay.mjs";
import { ramp } from "../../../lib/camera.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 470 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;

const c = clip({ faces: FACES, lines: LINES }), { A, see, prop } = c;
const WL = readFileSync(new URL("../../../../assets/sfx/whitelist.json", import.meta.url), "utf8");
const sfx = (t, name, o) => (name.startsWith("ai/") && !WL.includes(`"${name}"`) ? null : c.sfx(t, name, o));
const fr = (s) => Math.floor((Math.round(s * 30) / 30) * 1000) / 1000;   // a cut: a frame's time rounded down

// ---------------------------------------------------------------- the narrator (measured 12 Nov, VoxCPM2, urgent style)
const STYLE = "intrigued, mysterious storyteller, urgent and quick";
const DUR = { six: 2.55, wake: 2.19, reach: 1.53, loud: 3.6, block: 2.03, up: 3.09, down: 1.08, one: 2.82, stopped: 2.37, next: 2.21 };

// ---------------------------------------------------------------- the timeline (story seconds; picture placed on the lines)
const T = {
  pov: 0,              // P01 POV on the asphalt: the friend dragged by the hood     narr six 0.05-2.60
  face: fr(2.75),      // P02 close: his eyes open, the hand finds the revolver     narr wake 2.85-5.04
  grip: 3.7,
  fire: fr(5.25),      // P03 he fires from the ground (5)
  shot1: 5.55,         //                                                            narr reach 6.0-7.53
  pull: 6.6,           // Chip scrambles to him, pulls him up
  run: fr(7.9),        // P04 they run; every street turns                          narr loud 8.1-11.7
  seed: fr(10.9),      // P04 b: the two roofs almost touch (the seed), 1.0 s
  back: fr(11.9),      // P04 c: back on the run, the door ahead
  door: fr(12.6),      // P05 the door: one inside grabs his sleeve, shove, shot (4)
  shove: 13.45, shot2: 13.9,
  hall: fr(15.4),      // P06 inside: door shut, the cabinet                         narr block 15.75-17.78
  stairs: fr(18.6),    // P07 the stairwell                                          narr up 18.75-21.84
  shot3: 19.35, shot4: 20.45, crack: 20.9,
  below: fr(22.0),     // P07 b: the street door gives way below: one more (1)
  shot5: 22.5,
  roof: fr(23.4),      // P08 the roof door bursts
  reveal: fr(24.1),    // P08 b: the crane: the gap, the far roof                    narr down 24.4-25.48
  streets: fr(25.6),   // P08 c: zombies in every street
  choice: fr(26.9),    // P09 one bullet: what do you do?                            narr one 27.1-29.92, card 28.0-30.0
  shot6: fr(30.3),     // P10 he shoots (0); three more push out
  jump: fr(32.2),      // P11 no run-up: they jump from standing
  reach: fr(33.4),     // P12 a: the far edge just out of reach                       narr stopped 33.55-35.92
  hands: fr(34.9),     // P12 b: the hands below
  close: fr(36.1),     // P13 a: his eyes close (0.7 s)
  fall: fr(36.8),      // P13 b: straight down over the hands, slow
  wake: fr(39.3),      // P14 the teaser: bright POV, the smoke room                  narr next 39.55-41.76
  watch: 42.4,
  end: 43.9,           // held ~2 s after the last line
};

// ---------------------------------------------------------------- places
const SY = -15, PY = -14.85;                        // zstreet: the asphalt, the pavements
const DOORZ = 9.0;                                  // our building's street door on the left facade (zstreetdoor, rot 90)
const HALL = [0, -400];                             // zroom (dress hall) floor centre
const ST = [-400, 0];                               // zstairs origin (hall floor, first riser of flight 1)
const RF = [600, 0];                                // zroof origin (middle of the gap at deck height, jump line z 0)
const WT = [0, 400];                                // zwait floor centre
const FAR = [200, 0, 80];
const far = (i) => [FAR[0] + i * 2, FAR[2], 0, 0];
const rx = (x) => r3(RF[0] + x), sx = (x) => r3(ST[0] + x);

// who stands where: [x, z, yaw, y]
const S = {
  p01: { spud: [-0.4, 2.6, 180, SY], chip: [-0.4, 0.75, 180, SY] },               // Spud propped on his elbows, feet to -z; Chip in front of him, dragged toward -z
  p03: { spud: [-0.4, 2.6, 180, SY], chip: [-0.4, 0.45, 180, SY] },
  p04: { spud: [-1.0, 2.0, 0, SY], chip: [0.15, 1.4, 0, SY] },
  p05: { spud: [-4.15, DOORZ - 0.55, -90, PY], chip: [-3.35, DOORZ + 0.85, -100, PY] },
  p06: { spud: [-0.15, -400 - 1.35, 0, 0], chip: [1.5, -400 - 0.95, -90, 0] },  // Spud's back against the door (back wall), Chip drags the cabinet
  p07: { spud: [sx(0.75), -0.84, 180, 0.5], chip: [sx(0.45), 0.25, 180, 0.0] },   // Spud on the 3rd step, Chip at the foot
  p08: { spud: [rx(-5.4), -0.25, 90, 0], chip: [rx(-5.6), 0.65, 90, 0] },
  p09: { spud: [rx(-3.0), -0.1, 80, 0], chip: [rx(-2.55), -0.9, 95, 0] },
  p11: { spud: [rx(-1.2), -0.45, 90, 0.3], chip: [rx(-1.2), 0.5, 90, 0.3] },      // on the 0.30 lip at the jump spot
};

// ---------------------------------------------------------------- cameras (pos -> look, vertical fov). Roof cameras: DESIGN 1.
const R = (p) => [rx(p[0]), p[1], p[2]];
const CAM = {
  POV: { pos: [-0.4, -14.25, 2.3], look: [-0.4, -14.4, -2.0], fov: 66 },                       // P01 his eyes, propped on the asphalt
  FACE: { pos: [-0.4, -13.95, 1.25], look: [-0.4, -14.45, 2.55], fov: 40 },                      // P02 above his face, from his feet
  FIRE: { pos: [1.6, -14.2, 4.6], look: [-0.3, -14.35, 2.0], fov: 56 },                          // P03 low from the side: the shot up, the zombie falls back
  RUN: { pos: [-0.5, -13.85, 6.8], look: [-0.5, -14.2, -2.0], fov: 60 },                          // P04 ahead of them, running at us
  SEED: { pos: R([0, -10.6, 13.5]), look: R([0, 0.5, 4.0]), fov: 50 },                             // P04 b DESIGN "04 SEED"
  DOOR: { pos: [-1.2, -13.8, DOORZ - 1.9], look: [-4.3, -14.15, DOORZ + 0.4], fov: 60 },           // P05 the porch, side on
  HALL: { pos: [0.55, 1.45, -400 + 2.6], look: [0.3, 0.95, -400 - 1.6], fov: 60 },                 // P06 into the hall, the door at the back
  STA: { pos: [sx(0.7), 0.35, 2.6], look: [sx(0.7), 2.2, -2.6], fov: 55 },                        // P07 DESIGN camera A, low
  STB: { pos: [sx(0.2), 3.6, -3.4], look: [sx(0.6), 0.2, 1.2], fov: 60 },                        // P07 b DESIGN camera B, down at the door
  BURST: { pos: R([-1.8, 1.0, 2.8]), look: R([-6.0, 1.2, 0]), fov: 50 },                          // P08 DESIGN "08 burst"
  REVEAL: { pos: R([-6.2, 2.4, 1.9]), look: R([0.5, -0.3, -1.3]), fov: 56 },                          // P08 b "08 reveal"
  STREETS: { pos: R([-1.5, 6.0, 5.5]), look: R([3.5, -12, 12.0]), fov: 55 },                      // P08 c "08 streets"
  FROMB: { pos: R([2.6, 1.7, 0.7]), look: R([-6.0, 1.0, -0.2]), fov: 50 },                        // P09, P10 "on B"
  JUMP: { pos: R([3.0, 1.3, 3.6]), look: R([-0.9, 0.2, 0]), fov: 52 },                             // P11, P12 b
  MISS: { pos: R([3.2, 1.0, 1.4]), look: R([0.3, 0.4, -0.2]), fov: 54 },                          // P12 a "12a reach"
  CLOSE: { pos: R([0.0, -0.9, 0.35]), look: R([0.0, -4.4, 0.0]), fov: 40 },                         // P13 a his face, falling with him
  DOWN: { pos: R([0, 3.0, 0.2]), look: R([0, -12, 0.0]), fov: 36 },                               // P13 b straight down
  WAIT: { pos: [0, 1.0, 400 + 1.5], look: [0, 1.35, 400 - 2.2], fov: 68 },                        // P14 DESIGN 3 POV
};

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [S.p01.spud[0], S.p01.spud[1]], face: 180, expr: "terrified", follow: 0.25, seed: 2.9 },
  { id: "chip", character: "potatobrawl/chip", at: [S.p01.chip[0], S.p01.chip[1]], face: 180, expr: "terrified", follow: 0.25, seed: 3.4 },
];

// ---------------------------------------------------------------- props
const props = [
  // the street (P01-P05): grey day, its parked cars, the zombies coming from both ends
  { id: "street", kind: "zstreet", x: 0, y: 0, z: 0, car: [0.5, -13.5], parked: [0, 2, 5], clear: [[-2.6, -4, 1.6, 8]], alarm: 0, dent: 0, dawn: 0, fog: 1 },
  { id: "hordeA", kind: "zhorde", x: -0.5, y: SY, z: -9, n: 60, box: [4.0, 9], seed: 3, gx: 0.1, gz: 11, adv: 0, up: 0, reach: 1 },
  { id: "hordeB", kind: "zhorde", x: FAR[0], y: SY, z: 16, n: 40, box: [4.0, 5], seed: 8, gx: 0, gz: -6, adv: 0, up: 0, reach: 1 },
  { id: "grabber", kind: "zshot", x: -0.4, y: SY, z: -0.05, rot: 0, n: 1, gap: 1.1, seed: 4, stop: [0.2], adv: 0, d1: 0 },   // P01: the one that has Chip by the hood
  { id: "gunR", kind: "zrevolver", x: -0.05, y: r3(SY + 0.02), z: 2.85, rot: 160, tip: 90, flash: 0, smoke: 0 },          // on the asphalt by his hand
  { id: "sdoor", kind: "zstreetdoor", x: -4.88, y: SY, z: DOORZ, rot: 90, open: 0, shake: 0 },
  { id: "inside", kind: "zshot", x: FAR[0], y: SY, z: 40, rot: 90, n: 1, gap: 1.1, seed: 11, stop: [0.45], adv: 0, d1: 0 }, // P05: the one inside the door
  // the hallway (P06)
  { id: "hall", kind: "zroom", x: HALL[0], y: 0, z: HALL[1], w: 3.2, d: 3.4, dress: "hall", open: [{ wall: "back", at: -0.2, w: 1.0, h: 2.1, y0: 0 }], dim: 0.55, glowx: 0, glowz: -1.0 },
  { id: "hdoor", kind: "zdoor", x: -0.2, y: 0, z: r3(HALL[1] - 1.7), rot: 0, ajar: 0, hands: 4, hole: 0, arm: 0, bulge: 0, shadows: 1, burst: 0 },
  { id: "cab", kind: "wardrobe", x: 1.0, y: 0, z: r3(HALL[1] - 1.0), rot: -90, scale: 0.7, apart: 0 },
  // the stairwell (P07)
  { id: "stairs", kind: "zstairs", x: ST[0], y: 0, z: ST[1], crack: 0, lamp: 1, flicker: 1, flash: 0 },
  { id: "sdoor2", kind: "zdoor", x: sx(0.5), y: 0, z: 3.4, rot: 180, ajar: 0, hands: 3, hole: 0, arm: 0, bulge: 0, shadows: 1, burst: 0 },
  { id: "land1", kind: "zshot", x: sx(0.7), y: 1.5, z: -2.6, rot: 0, n: 1, seed: 21, stop: [0.15], adv: 0, d1: 0 },
  { id: "land2", kind: "zshot", x: sx(-0.65), y: 1.5, z: -3.2, rot: 35, n: 1, seed: 23, stop: [0.9], adv: 0, d1: 0 },
  { id: "low", kind: "zshot", x: FAR[0] + 12, y: 0, z: 40, rot: 180, n: 1, seed: 25, stop: [0.35], adv: 0, d1: 0 },
  // the roofs (P04 b, P08-P13)
  { id: "roof", kind: "zroof", x: RF[0], y: 0, z: RF[1], open: 0, shake: 0, behind: 0, fire: 1, smoke: 1, dusk: 1 },
  { id: "alley", kind: "zhorde", x: RF[0], y: -12, z: -2, n: 90, box: [1.9, 17.6], seed: 5, gx: 0, gz: 2, adv: 0, up: 0, reach: 0 },
  { id: "front", kind: "zhorde", x: RF[0], y: -12, z: 11.5, n: 400, box: [44, 7.0], seed: 9, avoid: [[9.0, 0, 4.4, 2.0]], gx: 0, gz: -4, adv: 0, up: 0, reach: 0 },
  { id: "kz1", kind: "zshot", x: FAR[0] + 16, y: 0, z: 40, rot: 90, n: 1, seed: 31, stop: [0.4], adv: 0, d1: 0 },              // P09-P10 in the kiosk door
  { id: "kz2", kind: "zshot", x: FAR[0] + 20, y: 0, z: 40, rot: 90, n: 1, seed: 33, adv: 0, d1: 0 },                         // P10 the next one out
  // the waiting room (P14)
  { id: "wait", kind: "zwait", x: WT[0], y: 0, z: WT[1], smoke: 0, watch: 0 },
];
const STAGED = {
  gunR: "lying on the asphalt, then in Spud's hand", grabber: "a zombie standing on the street", inside: "a zombie standing in the porch",
  land1: "a zombie standing on the half landing", land2: "a zombie standing on the half landing", kz1: "a zombie in the roof door", kz2: "a zombie in the roof door",
  hall: "the hallway set, built away from the street", stairs: "the stairwell set, built away from the street", roof: "the roofs set, built away from the street", wait: "the waiting room set, built away from the street",
  alley: "zombies standing in the alley 12 m down", front: "zombies standing in the front street 12 m down", sdoor: "our building's street entrance, a porch against the facade",
  hdoor: "the hall's front door in its wall opening", sdoor2: "the stairwell's street door in its wall opening",
};

// ---------------------------------------------------------------- helpers
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const arm = (t, who, side, pose, dur = 0.25, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const both = (t, who, pose, dur = 0.25, ease = "inOut") => { arm(t, who, "R", pose, dur, ease); arm(t, who, "L", pose, dur, ease); };
const putProp = (t, id, set) => prop(r3(t - 0.02), id, set, 0.01, "linear");
const hold = (t, who, id, side, grip) => A(r3(t - (grip ? 0.015 : 0.005)), who, "grab", { prop: id, hand: side, ...(grip ? { grip } : { keep: true }), dur: 0, pose: null });
const letGo = (t, who, id) => A(t, who, "release", { prop: id, to: [FAR[0], 0, 60], dur: 0 });
const stand = (t, who, [x, z, yaw = 0, y = 0]) => {
  const t0 = r3(t - 0.02);
  A(t0, who, "pitch", { to: 0, dur: 0.01, ease: "linear" }); A(t0, who, "lean", { to: 0, dur: 0.01 }); A(t0, who, "crouch", { to: 0, dur: 0.01 });
  A(t0, who, "move", { to: [x, z], y, dur: 0.01, steps: 0, ease: "linear" }); A(t0, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" });
  both(t0, who, "rest", 0.01); look(t0, who, [0, 0], 0.01);
};
const scene = (t, places) => Object.entries(places).forEach(([w, p]) => stand(t, w, p));
const narr = (t, line, key, chunks, y = LINES.pos, tail = 0.25) => {
  c.at(t, { macro: "narrate", line, voice: "narrator", style: STYLE, caption: false });
  const dur = DUR[key], n = chunks.reduce((k, x) => k + x.length, 0); let a = t;
  chunks.forEach((text, i) => { const b = i === chunks.length - 1 ? t + dur + tail : a + (dur * text.length) / n; c.cap(r3(a), r3(b), text, Array.isArray(y) ? y[i] : y, false, SUB_STYLE); a = b; });
};
// a revolver shot from Spud's right hand: the flash, the sound, the recoil, a small shake
const GUNARM = { o: [0.12, 0.62, 0.6] };
const shoot = (t, who = "spud") => {
  prop(t, "gunR", { flash: 1 }, 0.02, "linear"); prop(r3(t + 0.07), "gunR", { flash: 0 }, 0.03, "linear");
  sfx(t, "ai/revolver-shot", { gain: 1, loud: true, reason: "the revolver fires" });
  arm(t, who, "R", { o: [0.12, 0.74, 0.52] }, 0.05, "out"); arm(r3(t + 0.08), who, "R", GUNARM, 0.18);
  c.at(t, { fx: "shake", dur: 0.12, amp: 0.02 });
};
const drop = (t, id) => { prop(r3(t + 0.04), id, { d1: 1 }, 0.85, "in"); sfx(r3(t + 0.8), "thud", { gain: 0.45, reason: "the zombie falls" }); };
// the bullet counter, top right (clear of the bodies; the sheet had it lower left), from his wake-up on
const COUNT = [[T.face, 6], [T.shot1, 5], [T.shot2, 4], [T.shot3, 3], [T.shot4, 2], [T.shot5, 1], [T.shot6, 0]];
COUNT.forEach(([t, n], i) => { const b = i + 1 < COUNT.length ? COUNT[i + 1][0] : T.reach; c.cap(r3(t), r3(b), `${n}`, 250, false, { x: 820, size: 84, kinetic: false }); });

// ================================================================ P01 0-2.75: POV on the asphalt; the friend dragged by the hood
A(0, "spud", "pov", { on: true }); A(T.face, "spud", "pov", { on: false });
scene(0.02, S.p01);
A(0, "spud", "pitch", { to: -58, dur: 0 }); A(0, "spud", "move", { to: [S.p01.spud[0], S.p01.spud[1]], y: r3(SY - 0.18), dur: 0, steps: 0 });   // propped on his elbows
both(0, "spud", { o: [0.3, 0.05, -0.2] }, 0);
expr(0, "chip", "terrified", { open: 0.45 }, 0); look(0, "chip", [0, 0.2], 0);
A(0, "chip", "turn", { to: 0, dur: 0 });                          // Chip faces Spud (+z) while he is pulled away backward
A(0, "chip", "lean", { to: -12, dur: 0 });
arm(0, "chip", "R", { o: [0.18, 0.62, 0.6] }, 0); arm(0, "chip", "L", { o: [0.25, 0.45, 0.5] }, 0);   // reaching for us
A(0.05, "chip", "move", { to: [S.p01.chip[0], 0.45], y: SY, dur: 2.6, steps: 3, ease: "linear" });
prop(0.05, "grabber", { z: -0.35 }, 2.6, "linear");
prop(0, "hordeA", { adv: 1.0 }, r3(T.run), "linear");
sfx(0, "ai/zombie-groan", { gain: 1, loud: true, reason: "frame 0: the one that has him, right over us" });
sfx(0.6, "ai/zombie-horde", { gain: 0.7, dur: 4, reason: "more of them up the street" });
narr(0.05, "Six bullets to get your best friend out.", "six", ["Six bullets", "to get your best friend out."]);
c.cap(0, r3(T.face - 0.04), "6 BULLETS · BEST FRIEND", 300, false, { size: 62, kinetic: false });
see(0, T.face, ["chip.face", "grabber", "gunR"], "P01 frame 0, first person on the asphalt: a zombie has your best friend by the hood and drags him away; the revolver by your hand");

// ================================================================ P02 2.75-5.25: his eyes open, the hand finds the gun
expr(r3(T.face - 0.02), "spud", "terrified", { open: 0.5 }, 0.01); look(r3(T.face - 0.01), "spud", [0, 0.25], 0.01);
A(r3(T.face - 0.02), "spud", "droop", { to: 0.9, dur: 0.01 });     // the sprout flat
arm(r3(T.grip - 0.3), "spud", "R", { o: [0.42, 0.05, 0.15] }, 0.3);
hold(T.grip, "spud", "gunR", "R", "hand");
expr(r3(T.grip + 0.2), "spud", "angry", { open: 0.2, browL: 0.5, browR: 0.5 });
narr(2.85, "You wake up mid zombie apocalypse.", "wake", ["You wake up", "mid zombie apocalypse."], 330);   // above his face in the close-up
see(T.face, T.fire, ["spud.face", "gunR"], "P02: his eyes snap open, his hand closes on the revolver");

// ================================================================ P03 5.25-7.9: he fires from the ground (5)
arm(r3(T.fire - 0.02), "spud", "R", GUNARM, 0.01);
shoot(T.shot1); drop(T.shot1, "grabber");
A(r3(T.shot1 + 0.1), "chip", "lean", { to: 10, dur: 0.2 });
A(r3(T.shot1 + 0.2), "chip", "move", { to: [0.45, 1.7], y: SY, dur: 0.6, steps: 2, ease: "out" });
narr(6.0, "Only shoot what's in reach.", "reach", ["Only shoot", "what's in reach."]);
// Chip pulls him up by the left hand
arm(T.pull, "chip", "R", { o: [0.15, 0.4, 0.3] }, 0.2); arm(r3(T.pull - 0.2), "spud", "R", { o: [0.25, 0.35, 0.2] }, 0.25);   // the gun comes down, the friend takes his free hand
A(r3(T.pull + 0.15), "spud", "pitch", { to: 0, dur: 0.5, ease: "out" }); A(r3(T.pull + 0.15), "spud", "move", { to: [S.p01.spud[0], 2.45], y: SY, dur: 0.5, ease: "out" });
see(T.fire, T.run, ["spud.face", "grabber", "chip.face"], "P03: he fires up from the ground; the zombie lets go and drops; the friend scrambles to him");

// ================================================================ P04 7.9-12.6: they run; every street turns. The seed: two roofs.
scene(T.run, S.p04);
hold(r3(T.run + 0.01), "spud", "gunR", "R", "hand"); arm(r3(T.run - 0.02), "spud", "R", { o: [0.2, 0.4, 0.3] }, 0.01);
["spud", "chip"].forEach((w) => expr(r3(T.run - 0.02), w, "terrified", { open: 0.35 }, 0.01));
A(T.run, "spud", "move", { to: [-1.3, 6.4], y: SY, dur: r3(T.seed - T.run), steps: 7, ease: "linear" });
A(T.run, "chip", "move", { to: [-0.15, 5.9], y: SY, dur: r3(T.seed - T.run), steps: 8, ease: "linear" });
arm(T.run, "chip", "R", { o: [0.3, 0.35, 0.35] }, 0.2);       // reaching for Spud's sleeve
A(r3(T.run + 1.2), "chip", "lean", { to: 14, dur: 0.15 }); A(r3(T.run + 1.45), "chip", "lean", { to: 0, dur: 0.3 });   // he stumbles
putProp(T.run, "hordeB", { x: -0.3 });
prop(T.run, "hordeA", { adv: 3.0 }, r3(T.door - T.run), "linear");
sfx(T.run, "ai/zombie-horde", { gain: 1, dur: 4.5, reason: "groans from every side of the street, closer" });
sfx(T.run, "step-concrete", { gain: 0.5, reason: "running feet on the asphalt" });
narr(8.1, "Every shot is loud. Noise brings more.", "loud", ["Every shot is loud.", "Noise brings more."]);
see(T.run, T.seed, ["spud.face", "chip.face", "hordeA"], "P04: they run at us, the friend stumbling; behind them the street fills");
// b: the seed: from the street, two flat roofs almost touching against the dusk
see(T.seed, T.back, ["roof"], "P04 b: high above, the roofs of two buildings almost touch across a narrow gap");
// c: back to the run, the building door ahead on the left
A(T.back, "spud", "move", { to: [-3.4, DOORZ - 0.7], y: PY, dur: r3(T.door - T.back), steps: 3, ease: "linear" });
A(T.back, "chip", "move", { to: [-3.0, DOORZ + 0.3], y: PY, dur: r3(T.door - T.back), steps: 3, ease: "linear" });
arm(T.back, "chip", "R", "rest", 0.25); A(T.back, "spud", "turn", { to: -60, dur: 0.2 }); A(T.back, "chip", "turn", { to: -70, dur: 0.2 });

// ================================================================ P05 12.6-15.4: the door; one inside grabs his sleeve; shove, shot (4)
scene(T.door, S.p05);
hold(r3(T.door + 0.01), "spud", "gunR", "R", "hand");
putProp(T.door, "inside", { x: -4.55, y: PY, z: DOORZ, rot: 90 });
putProp(T.door, "sdoor", { open: 0 });
arm(r3(T.door - 0.02), "spud", "L", { o: [0.25, 0.55, 0.45] }, 0.01);
prop(r3(T.door + 0.1), "sdoor", { open: 1 }, 0.25, "out");              // he yanks it open
sfx(r3(T.door + 0.1), "door-open", { gain: 0.7, reason: "the heavy street door yanked open" });
prop(r3(T.door + 0.35), "inside", { adv: 0.45 }, 0.35, "out");          // it lunges out
sfx(r3(T.door + 0.35), "ai/zombie-groan", { gain: 1, loud: true, reason: "the one inside lunges" });
expr(r3(T.door + 0.4), "chip", "terrified", { open: 0.6 }); A(r3(T.door + 0.5), "chip", "lean", { to: -12, dur: 0.15 });
arm(r3(T.door + 0.45), "chip", "R", { o: [0.35, 0.45, 0.4] }, 0.12);    // his sleeve caught
arm(T.shove, "spud", "L", { o: [0.15, 0.6, 0.7] }, 0.12, "out");          // the shove
prop(T.shove, "inside", { adv: 0.25 }, 0.2, "out");
arm(r3(T.shove + 0.2), "spud", "L", "rest", 0.3);
arm(r3(T.shot2 - 0.15), "spud", "R", GUNARM, 0.12);
shoot(T.shot2); drop(T.shot2, "inside");
A(r3(T.shot2 + 0.2), "chip", "lean", { to: 0, dur: 0.3 });
see(T.door, T.hall, ["sdoor", "inside", "spud.face", "chip.face"], "P05: the door: one inside lunges and grabs the friend's sleeve; shoved off, shot");

// ================================================================ P06 15.4-18.6: inside; the door shut, the cabinet against it
scene(T.hall, S.p06);
letGo(r3(T.hall - 0.02), "spud", "gunR"); putProp(T.hall, "gunR", { x: S.p06.spud[0] + 0.3, y: 0.7, z: S.p06.spud[1] + 0.25, rot: 0, tip: 0 }); hold(r3(T.hall + 0.01), "spud", "gunR", "R", "hand");
arm(r3(T.hall - 0.02), "spud", "R", { o: [0.25, 0.3, 0.2] }, 0.01); arm(r3(T.hall - 0.02), "spud", "L", { o: [0.35, 0.35, -0.2] }, 0.01);   // his back against the door
A(r3(T.hall - 0.02), "spud", "lean", { to: -6, dur: 0.01 });
sfx(T.hall, "door-slam", { gain: 0.9, loud: true, reason: "the door slammed shut behind them" });
prop(T.hall, "hdoor", { bulge: 1 }, 0.1, "out"); prop(r3(T.hall + 0.1), "hdoor", { bulge: 0 }, 0.25);
[0.5, 1.3, 2.1, 2.7].forEach((d) => { prop(r3(T.hall + d), "hdoor", { bulge: 0.6 }, 0.08, "out"); prop(r3(T.hall + d + 0.08), "hdoor", { bulge: 0 }, 0.2); sfx(r3(T.hall + d), "knock", { gain: 1, reason: "fists on the door" }); A(r3(T.hall + d), "spud", "squash", { amount: 0.05, dur: 0.15 }); });
// Chip drags the cabinet across to the door
both(r3(T.hall - 0.02), "chip", { o: [0.2, 0.45, 0.4] }, 0.01);
A(T.hall, "chip", "lean", { to: 16, dur: 0.2 });
A(r3(T.hall + 0.2), "chip", "move", { to: [1.25, -400 - 1.0], dur: 2.2, steps: 6, ease: "inOut" });
prop(r3(T.hall + 0.2), "cab", { x: 0.65, z: r3(-400 - 1.35) }, 2.2, "inOut");
sfx(r3(T.hall + 0.2), "scrape", { gain: 0.7, dur: 2.2, reason: "the heavy cabinet dragged over the floor" });
expr(T.hall, "chip", "focused", { open: 0.3 }); expr(T.hall, "spud", "terrified", { open: 0.3 });
narr(15.75, "Close it. Block it.", "block", ["Close it.", "Block it."]);
sfx(T.hall, "ai/zombie-horde", { gain: 0.6, dur: 3.0, reason: "the horde outside the door, muffled" });
see(T.hall, T.stairs, ["hdoor", "spud.face", "chip", "cab"], "P06: inside, his back against the door; the friend drags the cabinet over; fists on the door");

// ================================================================ P07 18.6-23.4: the stairwell. Go up. (3, 2) the door below gives way (1)
scene(T.stairs, S.p07);
letGo(r3(T.stairs - 0.02), "spud", "gunR"); putProp(T.stairs, "gunR", { x: S.p07.spud[0], y: 1.2, z: S.p07.spud[1] - 0.5, rot: 180, tip: 0 }); hold(r3(T.stairs + 0.01), "spud", "gunR", "R", "hand");
arm(r3(T.stairs - 0.02), "spud", "R", { o: [0.12, 0.72, 0.6] }, 0.01);
["spud", "chip"].forEach((w) => expr(r3(T.stairs - 0.02), w, "terrified", { open: 0.3 }, 0.01));
look(r3(T.stairs - 0.01), "spud", [0, 0.4], 0.01);
A(T.stairs, "chip", "move", { to: [sx(0.45), -0.28], y: 0.17, dur: 0.6, steps: 2, ease: "linear" });   // up onto the first step behind him
sfx(T.stairs, "ai/zombie-groan", { gain: 0.9, reason: "a zombie on the landing above" });
narr(18.75, "Go up. On stairs they come one at a time.", "up", ["Go up.", "On stairs they come", "one at a time."]);
prop(T.stairs, "land1", { adv: 0.15 }, 0.6, "linear");
shoot(T.shot3); drop(T.shot3, "land1"); prop(T.shot3, "stairs", { flash: 1 }, 0.02, "linear"); prop(r3(T.shot3 + 0.07), "stairs", { flash: 0 }, 0.05, "linear");
prop(r3(T.shot3 + 0.3), "land2", { adv: 0.9 }, r3(T.shot4 - T.shot3 - 0.3), "linear");
shoot(T.shot4); drop(T.shot4, "land2"); prop(T.shot4, "stairs", { flash: 1 }, 0.02, "linear"); prop(r3(T.shot4 + 0.07), "stairs", { flash: 0 }, 0.05, "linear");
prop(T.crack, "stairs", { crack: 0.6 }, 0.4, "out"); prop(T.crack, "sdoor2", { ajar: 0.3 }, 0.4, "out");
sfx(T.crack, "creak", { gain: 0.8, reason: "the street door below gives way" });
sfx(r3(T.crack + 0.3), "ai/zombie-horde", { gain: 0.9, reason: "they pour into the hall below" });
// b: from above, down at the door: one through it, the last shot down the stairs (1)
putProp(T.below, "low", { x: sx(0.5), y: 0, z: 2.9, adv: 0 });
prop(T.below, "stairs", { crack: 1 }, 0.3, "out"); prop(T.below, "sdoor2", { ajar: 0.7 }, 0.3, "out");
prop(r3(T.below + 0.1), "low", { adv: 0.35 }, 0.4, "linear");
A(r3(T.below - 0.02), "spud", "turn", { to: 0, dur: 0.01 }); A(r3(T.below - 0.02), "chip", "turn", { to: 0, dur: 0.01 });
A(r3(T.below - 0.02), "spud", "move", { to: [sx(0.85), -1.4], y: 0.83, dur: 0.01, steps: 0 }); A(r3(T.below - 0.02), "chip", "move", { to: [sx(0.3), -1.96], y: 1.17, dur: 0.01, steps: 0 });
look(r3(T.below - 0.01), "spud", [0, -0.5], 0.01);
shoot(T.shot5); drop(T.shot5, "low"); prop(T.shot5, "stairs", { flash: 1 }, 0.02, "linear"); prop(r3(T.shot5 + 0.07), "stairs", { flash: 0 }, 0.05, "linear");
see(T.stairs, T.below, ["spud.face", "land1", "land2"], "P07: up the stairwell; two on the landing, one at a time, each drops");
see(T.below, T.roof, ["low", "sdoor2"], "P07 b: below, the street door gives way; the first one through drops");

// ================================================================ P08 23.4-26.9: the roof. No way down.
scene(T.roof, S.p08);
letGo(r3(T.roof - 0.02), "spud", "gunR"); putProp(T.roof, "gunR", { x: rx(-5.0), y: 0.65, z: -0.25, rot: 90, tip: 0 }); hold(r3(T.roof + 0.01), "spud", "gunR", "R", "hand");
arm(r3(T.roof - 0.02), "spud", "R", { o: [0.2, 0.4, 0.3] }, 0.01);
putProp(T.roof, "roof", { open: 0 });
prop(T.roof, "roof", { open: 1 }, 0.13, "out"); prop(r3(T.roof + 0.13), "roof", { open: 0.9 }, 0.1); prop(r3(T.roof + 0.23), "roof", { open: 1 }, 0.15);
sfx(T.roof, "door-slam", { gain: 1, loud: true, reason: "the steel roof door bursts open against the wall" });
A(r3(T.roof - 0.02), "spud", "move", { to: [rx(-6.6), -0.25], y: 0, dur: 0.01, steps: 0 }); A(r3(T.roof - 0.02), "chip", "move", { to: [rx(-6.9), 0.4], y: 0, dur: 0.01, steps: 0 });
A(r3(T.roof + 0.1), "spud", "move", { to: [rx(-4.4), -0.25], y: 0, dur: 0.9, steps: 3, ease: "out" });
A(r3(T.roof + 0.25), "chip", "move", { to: [rx(-4.9), 0.55], y: 0, dur: 0.9, steps: 3, ease: "out" });
sfx(T.roof, "ai/zombie-horde", { gain: 0.8, dur: 6, reason: "the whole city: groans from every street below" });
// b: the crane: the lane, the gap, the far roof
A(T.reveal, "spud", "move", { to: [rx(-3.2), -0.2], y: 0, dur: 1.2, steps: 3, ease: "out" });
A(T.reveal, "chip", "move", { to: [rx(-3.7), 0.6], y: 0, dur: 1.2, steps: 3, ease: "out" });
A(r3(T.reveal + 0.3), "spud", "turn", { to: 60, dur: 0.4 }); look(r3(T.reveal + 0.4), "spud", [0.3, -0.5], 0.2);
narr(24.4, "No way down.", "down", ["No way down."]);
expr(T.reveal, "spud", "terrified", { open: 0.3 }); expr(T.reveal, "chip", "terrified", { open: 0.4 });
see(T.roof, T.reveal, ["roof", "spud.face"], "P08: the roof door bursts open; dusk, the city burning");
see(T.reveal, T.streets, ["spud", "chip", "roof"], "P08 b: the gap to the next roof; no ladder, no way down");
see(T.streets, T.choice, ["front", "alley"], "P08 c: zombies in every street below");

// ================================================================ P09 26.9-30.3: one bullet. What do you do?
scene(T.choice, S.p09);
hold(r3(T.choice + 0.01), "spud", "gunR", "R", "hand"); putProp(T.choice, "gunR", { x: rx(-3.35), y: 0.62, z: -0.15, rot: -95, tip: 0 });
arm(r3(T.choice - 0.02), "spud", "R", { o: [0.15, 0.5, 0.4] }, 0.01);          // half raised
both(r3(T.choice - 0.02), "chip", { o: [0.25, 0.45, 0.25] }, 0.01);
putProp(T.choice, "kz1", { x: rx(-6.6), y: 0, z: 0, adv: 0 }); putProp(T.choice, "roof", { behind: 0.3 });
prop(r3(T.choice + 0.2), "kz1", { adv: 0.4 }, 2.4, "linear");
prop(T.choice, "roof", { behind: 0.6 }, 3.0, "linear");
sfx(T.choice, "ai/zombie-groan", { gain: 1, reason: "one steps out of the roof door" });
expr(T.choice, "spud", "terrified", { open: 0.2 }); expr(T.choice, "chip", "terrified", { open: 0.4 });
look(r3(T.choice + 0.4), "spud", [-0.7, 0], 0.15); look(r3(T.choice + 1.4), "spud", [0.1, -0.3], 0.15); look(r3(T.choice + 2.3), "spud", [-0.7, 0], 0.15);   // over his shoulder to the door, the gap, the door
narr(27.1, "One bullet. What do you do?", "one", ["One bullet.", "What do you do?"]);
vote(c, 28.0, 2.0, "", [["1", "SHOOT"], ["2", "JUMP"]], { y: 300 });
see(T.choice, T.shot6, ["spud.face", "kz1", "roof"], "P09: between the roof door, where one steps out, and the gap: one bullet");

// ================================================================ P10 30.3-32.2: he shoots (0); three more push out
arm(r3(T.shot6 - 0.02), "spud", "R", GUNARM, 0.01); A(r3(T.shot6 - 0.02), "spud", "turn", { to: -90, dur: 0.01 }); look(r3(T.shot6 - 0.01), "spud", [0, 0], 0.01);
shoot(r3(T.shot6 + 0.15)); drop(r3(T.shot6 + 0.15), "kz1");
prop(r3(T.shot6 + 0.4), "roof", { behind: 1 }, 0.8, "out");
putProp(r3(T.shot6 + 0.5), "kz2", { x: rx(-6.9), y: 0, z: 0.1, adv: 0 }); prop(r3(T.shot6 + 0.6), "kz2", { adv: 1.0 }, 1.3, "linear");
sfx(r3(T.shot6 + 0.6), "ai/zombie-horde", { gain: 1, loud: true, reason: "more push out of the door, close" });
sfx(r3(T.shot6 + 1.2), "kenney/metal-click", { gain: 0.6, reason: "the empty revolver's hammer falls: click" });
expr(r3(T.shot6 + 0.7), "spud", "terrified", { open: 0.5 });
see(T.shot6, T.jump, ["spud.face", "kz1", "kz2", "roof"], "P10: the last shot; it drops; three more push out of the door, too close");

// ================================================================ P11 32.2-33.4: no room for a run-up: they jump from standing
scene(T.jump, S.p11);
letGo(r3(T.jump - 0.02), "spud", "gunR");
["spud", "chip"].forEach((w) => { expr(r3(T.jump - 0.02), w, "terrified", { open: 0.5 }, 0.01); both(r3(T.jump - 0.02), w, { o: [0.3, 0.2, -0.2] }, 0.01); });
["spud", "chip"].forEach((w) => { A(T.jump, w, "crouch", { to: 0.6, dur: 0.18 }); A(r3(T.jump + 0.18), w, "crouch", { to: 0, dur: 0.1 }); both(r3(T.jump + 0.18), w, { o: [0.3, 0.9, 0.5] }, 0.15, "out"); });
const JUMP = (w, z) => {
  A(r3(T.jump + 0.2), w, "move", { to: [rx(-0.6), z], y: 0.75, dur: 0.35, steps: 0, ease: "out" });
  A(r3(T.jump + 0.55), w, "move", { to: [rx(0.15), z], y: -0.2, dur: 0.6, steps: 0, ease: "in" });
};
JUMP("spud", -0.45); JUMP("chip", 0.5);
putProp(T.jump, "kz2", { x: rx(-2.4), adv: 0 }); prop(T.jump, "kz2", { adv: 0.5 }, 1.0, "linear");
prop(T.jump, "alley", { up: 1 }, 1.5, "inOut");
sfx(r3(T.jump + 0.2), "step-concrete", { gain: 0.6, reason: "the push-off from the low lip" });
see(T.jump, T.reach, ["spud", "chip", "kz2"], "P11: hand in hand, no run-up: they jump from standing; hands grab the air behind them");

// ================================================================ P12 33.4-36.1: just out of reach; the hands below. Slow.
const fallTo = (t, w, z, y0, y1, dur, x0 = 0.15, x1 = 0.05) => { A(r3(t - 0.02), w, "move", { to: [rx(x0), z], y: y0, dur: 0.01, steps: 0 }); A(t, w, "move", { to: [rx(x1), z], y: y1, dur, steps: 0, ease: "in" }); };
["spud", "chip"].forEach((w) => { both(r3(T.reach - 0.02), w, { o: [0.25, 0.95, 0.45] }, 0.01); expr(r3(T.reach - 0.02), w, "terrified", { open: 0.6 }, 0.01); look(r3(T.reach - 0.01), w, [0.3, 0.4], 0.01); });
A(r3(T.reach - 0.02), "spud", "turn", { to: 90, dur: 0.01 }); A(r3(T.reach - 0.02), "chip", "turn", { to: 90, dur: 0.01 });
fallTo(T.reach, "spud", -0.45, -0.2, -1.6, r3(T.close - T.reach));
fallTo(T.reach, "chip", 0.5, -0.25, -1.65, r3(T.close - T.reach));
prop(T.reach, "alley", { reach: 1 }, 0.6, "out");
ramp(c, T.reach, r3(T.close - T.reach), 0.5, { in: 0.15, out: 0.2 });
narr(33.55, "You stopped to shoot. No run-up.", "stopped", ["You stopped to shoot.", "No run-up."]);
sfx(T.reach, "ai/zombie-horde", { gain: 1, loud: true, dur: 5, reason: "the alley below, every one of them groaning up at them" });
sfx(T.reach, "ai/heartbeat", { gain: 0.7, reason: "his heartbeat in the slow fall" });
see(T.reach, T.hands, ["spud", "chip", "roof"], "P12 a: mid-air, the far roof's edge just out of reach");
see(T.hands, T.close, ["spud", "chip", "roof"], "P12: still reaching, the hands below");

// ================================================================ P13 36.1-39.3: his eyes close; straight down over the hands
fallTo(T.close, "spud", -0.3, -3.6, -5.0, r3(T.fall - T.close), -0.3, -0.3);
fallTo(T.close, "chip", 0.3, -3.7, -5.1, r3(T.fall - T.close), 0.4, 0.4);
A(r3(T.close - 0.02), "spud", "pitch", { to: -70, dur: 0.01 }); A(r3(T.close - 0.02), "chip", "pitch", { to: -70, dur: 0.01 });   // falling on their backs, faces up
A(r3(T.close + 0.25), "spud", "expr", { expr: "terrified", set: { lidL: 1, lidR: 1 }, dur: 0.3 });   // the eyes squeeze shut
fallTo(T.fall, "spud", -0.3, -5.0, -9.5, r3(T.wake - T.fall - 0.2), -0.3, -0.3);
fallTo(T.fall, "chip", 0.3, -5.1, -9.6, r3(T.wake - T.fall - 0.2), 0.4, 0.4);
prop(T.fall, "alley", { reach: 1, up: 1 }, 0.01);
ramp(c, T.close, r3(T.wake - T.close), 0.6, { in: 0.1, out: 0.1 });
see(T.close, T.fall, ["spud.face"], "P13: falling, his eyes squeeze shut");
see(T.fall, T.wake, ["spud", "chip", "alley"], "P13: the camera pulls up, they fall toward a sea of reaching hands; nothing after that");

// ================================================================ P14 39.3-43.9: you wake up mid psycho experiment
scene(T.wake, { spud: far(0), chip: far(1) });
A(T.wake, "spud", "pov", { on: true });
prop(T.wake, "wait", { smoke: 0.1 }, 0.4, "out"); prop(r3(T.wake + 0.4), "wait", { smoke: 1 }, 3.0, "linear");
prop(T.watch, "wait", { watch: 1 }, 0.6, "inOut");
sfx(T.wake, "hiss", { gain: 0.35, dur: 4.5, reason: "smoke hissing out of the wall vent" });
sfx(T.wake, "scribble", { gain: 0.3, dur: 3.5, reason: "pencils on clipboards, calm" });
narr(39.55, "You wake up mid psycho experiment.", "next", ["You wake up", "mid psycho experiment."]);
see(T.wake, T.end, ["wait"], "P14: first person, a new place: a calm waiting room filling with smoke; nobody moves; a man in a lab coat watches");

// ---------------------------------------------------------------- beats (one shot per panel; b/c inserts named in PANELS.md)
const sh = (k, to, dur, ease = "linear") => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov, ...(to && { to: { fov: CAM[k].fov, look: CAM[k].look, ...to }, dur, ease }) });
const beats = c.beats([
  ["P01 POV: the friend dragged by the hood", 0, sh("POV", { look: [-0.4, -14.3, -2.4] }, 2.7, "inOut"), "hook"],
  ["P02 his eyes open, the gun", T.face, sh("FACE", { pos: [-0.4, -13.9, 1.45] }, 2.4, "inOut")],
  ["P03 the shot from the ground", T.fire, sh("FIRE")],
  ["P04 the run", T.run, sh("RUN", { pos: [-0.8, -13.85, 9.5] }, r3(T.seed - T.run))],
  ["P04 b the seed: two roofs", T.seed, sh("SEED", { fov: 44 }, 1.0, "inOut")],
  ["P05 the door", T.door, sh("DOOR")],
  ["P06 the hall", T.hall, sh("HALL", { pos: [0.3, 1.4, -400 + 2.2] }, r3(T.stairs - T.hall), "inOut")],
  ["P07 the stairwell", T.stairs, sh("STA")],
  ["P07 b the door below", T.below, sh("STB")],
  ["P08 the roof door", T.roof, sh("BURST")],
  ["P08 b the gap", T.reveal, sh("REVEAL", { pos: R([-5.6, 2.6, 2.1]) }, r3(T.streets - T.reveal), "inOut")],
  ["P08 c every street", T.streets, sh("STREETS")],
  ["P09 one bullet", T.choice, sh("FROMB", { pos: R([2.2, 1.6, 0.6]) }, r3(T.shot6 - T.choice), "inOut")],
  ["P10 the last shot", T.shot6, sh("FROMB")],
  ["P11 the jump", T.jump, sh("JUMP")],
  ["P12 a out of reach", T.reach, sh("MISS")],
  ["P13 eyes close, the fall", T.close, sh("CLOSE", { pos: CAM.DOWN.pos, look: CAM.DOWN.look, fov: CAM.DOWN.fov }, r3(T.wake - T.close), "in")],
  ["P14 the smoke room", T.wake, sh("WAIT"), "payoff"],
], T.end);

const WORLD = ["street", "hordeA", "hordeB", "grabber", "sdoor", "inside", "hall", "hdoor", "cab", "stairs", "sdoor2", "land1", "land2", "low", "roof", "alley", "front", "kz1", "kz2", "wait"];
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "wake-up-mid-zombies",
  title: "You wake up mid zombie apocalypse",
  idea: "You wake up mid EP03: you wake on a zombie street with six bullets and your best friend dragged away; every shot brings more; a door, the stairs, the roof, the last bullet; you jump from standing and fall short into the alley of zombies, eyes close, and wake up mid a psycho experiment",
  format: "series: You wake up mid (first-person frame 0, stake-and-count line at 0.0, short narrator commands, bullet counter, one mistake = the bad end, ends in the next scenario)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1440],   // narration in the upper third (Jonny 12 Nov), the counter lower left
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "plain", color: "#a9afb3", floor: "none", aperture: 0, focus: false, bloom: "emissive", lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  // a dramatic scenario: recorded orchestra from 0.0 (Jonny 12 Nov); disaster-04 is the bed he kept on EP01. It ends at the
  // fall: the fall and the teaser have only their own sounds.
  music: { file: "ai/disaster/disaster-04.ogg", from: 0, skip: 1.698, until: T.close, lowCut: 150, gain: 0.55, duck: { db: -8, voice: -10 } },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false },
  creative: { length: [T.end, T.end] },
  hook: { show: ["chip", "grabber", "gunR"], hint: 0, what: "frame 0, first person on the asphalt: a zombie drags your best friend away by the hood, the revolver by your hand; 'Six bullets to get your best friend out.'" },
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...WORLD.map((who) => ({ who, from: 0, to: T.end, checks: WORN, reason: "the world the cast stands in and on (sets, crowds, doors)" })),
    { who: "gunR", from: 0, to: T.end, checks: WORN, reason: "rough draft: the revolver held where the hand closes on its grip" },
    { who: "spud", with: "spud", from: 0, to: T.face, checks: ["face-covered", "face-hidden"], reason: "first person (the camera is his eyes)" },
    { who: "spud", with: "spud", from: T.wake, to: T.end, checks: ["face-covered", "face-hidden"], reason: "first person in the waiting room" },
    { who: "chip", with: "spud", from: r3(T.shot1 + 0.4), to: T.door, checks: ["reach", "character-overlap"], reason: "the friend takes his hand, pulls him up and holds his sleeve on the run" },
    { who: "spud", with: "chip", from: T.jump, to: T.wake, checks: ["reach", "character-overlap"], reason: "hand in hand, the jump and the fall" },
  ],
  notes: "Generated by storyboards/series/you-wake-up-mid/03-zombies/make-wake-zombies.mjs. Spec: OUTLINE.md, DESIGN.md, NOTES.md.",
});
