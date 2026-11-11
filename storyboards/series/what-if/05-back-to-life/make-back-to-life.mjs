// WHAT IF YOU COULD BRING ANYTHING BACK TO LIFE? BUT THERE'S A CATCH. (There's a catch, episode 5; Jonny's pick
// 11 Nov 2026: "the Reaper bringing a T. rex back to life", then "More extreme first", then "Go, build from these"
// on the 12-panel sheet board.png). Opener type B: a cold open, 0-1.5 s is a piece of the street burst, clean cut.
// Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/09-back-to-life-trex-V2-COLD-OPEN.md (lower half, v3
// EXTREME). Panels: board.png + PANELS.md here. Places, cameras and reasons: NOTES.md here.
//   node storyboards/series/what-if/05-back-to-life/make-back-to-life.mjs            -> back-to-life.json
//   ... --no-vo -> back-to-life-no-vo.json: without the commentator (staging and drafts, no speech model)
//
// THE BRIEF
//   Joke:        Reaper is scared of everything, and his scythe brings back to life whatever it touches: a dead
//                plant, a fossil fish, then, in one panic run along the row, every skeleton in the museum.
//   Wants:       Phoenix wants to see it work on something bigger each time; Reaper wants to get away; Spud goes along.
//   Consequence: the catch, shown: nothing here has eaten for millions of years, and the three are potatoes. The
//                whole museum chases them out through the front wall into the city.
//   Ending:      up a street lamp, the T. rex snapping below; Reaper shakes so hard he drops the scythe; it sticks
//                in the street, the ground glows green and something as big as a hill rises behind the museum.
//   Callback:    frame 0 (the cold open) is the chase the whole clip explains; the last frame is the next, bigger one.
// The power: the scythe's touch = a low bell, a green spark, a green glow sweeping up the thing.
//
// WORLD (x right, z toward camera A; yaw 0 faces +z, 90 faces +x). HALL: x -5..7, z -16..8, 9 m high; the skeleton
// row on the right behind a rope at x 1.6; the T. rex at the end of the hall [1, -11] facing +z. STREET: the same
// world 100 m along z: the museum front is the plane z 100 facing +z, the breach at x 4, the lamp at [-2.5, 108].
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { trexPoints } from "../../../../engine/shared/trex-rig.js";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "").split(",").filter(Boolean));   // museum, iceage, fossils, street, rex
const ph = (pack, final, stand) => (READY.has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...(final.wear && { wear: final.wear }), ...stand });
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const has = (pack) => READY.has(pack);

// ---------------------------------------------------------------- the beats (video s = story s: no ramps)
const HALL = 1.5, TOUCH = 2.45, FISH = 3.6, FLOP = 4.55, CATCHF = 5.0, SHRIEK = 5.25, RUN = 5.9, CRASH = 8.3, ALIVE = 9.3, STOMP = 9.95;
const CALM = 10.8, CATCH = 12.6, CHASE = 14.0, STREET = 15.6, FRONT = 16.5, LAMP = 17.4, SLIP = 18.5, SCYTHE = 19.4, RISE = 20.0, END = 22.0;
const COLD = r3(FRONT - 0.1);   // the cold open shows the street burst from this moment of its staging
const SZ = 100;                 // the street's z offset
const DOWN = -60;               // parked under the floor
const place = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const park = (t, id) => P(r3(t - 0.02), id, { y: DOWN });
const TERROR = { open: 0.75, eye: 1.35, curve: -0.3 };
// params only the real packs know (a stand-in box has no glow, gait or drool)
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };
const ANI = (t, id, set, dur, ease) => Pk(id === "rex" ? "rex" : "iceage", t, id, set, dur, ease);
const HUNGRY = { brow: -1, squint: 0.7, jaw: 0.3, drool: 1, lookY: -0.8 }, CURIOUS = { brow: 0.5, squint: 0, jaw: 0, drool: 0, lookY: -0.4 };

// ---------------------------------------------------------------- places
// the hall
const ROPE_X = 1.6, SAB = [3.4, 0.5], MAM = [3.6, -4.2], REXP = [1.0, -11.0], REXK = 1.5, PLINTH = { w: 3.4, h: 0.3, d: 3.0 };
const PT = [[2.0, 5.5, -1.0], [2.2, 5.8, -6.5]];
const CASE = [-1.2, 0.3], PLANT = [1.25, 2.55];
const SPUD1 = [-0.6, 2.3], REA1 = [0.3, 1.9], PHX1 = [1.3, 0.45];                    // 02: the plant
const SPUD2 = [-0.5, 2.75], REA2 = [-1.2, 1.6], PHX2 = [-1.9, 2.6];                  // 03: the fish
const RUN0 = [0.9, 0.6], RUN1 = [0.95, -8.9];                                         // 04: along the rope
const SPUD3 = [-1.3, -4.6], PHX3 = [-2.5, -5.4];                                      // 05: they come after him
const SPUD4 = [0.1, -6.7], REA4 = [-1.2, -6.95], PHX4 = [1.0, -6.95];                // 06-08: at the T. rex's feet
const MAM4 = [3.3, -9.4], SAB4 = [-1.9, -8.1];                    // the animals round them
// the street
const BREACH_X = 1.4, LAMP_AT = [-2.5, SZ + 8], LAMP_H = 6.5;
const SCY_END = [-0.6, SZ + 15];
const rad = (d) => (d * Math.PI) / 180;
// where the T. rex stands so that its snout is at `snout` (world), for a pose and a heading
const rexFor = (snout, pose, rot, y = 0) => { const q = trexPoints({ ...pose, scale: REXK }).snout, a = rad(rot); return { x: r3(snout[0] - (q[0] * Math.cos(a) + q[2] * Math.sin(a))), y, z: r3(snout[2] - (-q[0] * Math.sin(a) + q[2] * Math.cos(a))), rot, ...pose }; };
if (process.env.DEBUG) console.log("rex rest snout", trexPoints({ scale: REXK }).snout.map(r3), "lean30", trexPoints({ scale: REXK, lean: 30, neckP: 34, headP: 18 }).snout.map(r3));

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [0.2, SZ + 5.2], face: 0, expr: "terrified", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "notyet/reaper-noscythe", at: [-1.1, SZ + 5.7], face: 0, expr: "terrified", follow: 0.25, seed: 3.3 },
  { id: "phx", character: "potatobrawl/phoenix", at: [1.5, SZ + 6.0], face: 0, expr: "terrified", follow: 0.3, seed: 1.7 },
];

// ---------------------------------------------------------------- props
const props = [
  // ---- the hall (T1 props-museum.js)
  ph("museum", { id: "hall", kind: "museumhall", x: 1, y: 0, z: -2, w: 12, d: 28, h: 9 }, { ...box(0.3, 9, 30), x: -5.15, z: -1 }),
  ph("museum", { id: "hallR", kind: "stoneblock", x: 7.15, y: DOWN, z: -4 }, { ...box(0.3, 9, 30), x: 7.15, z: -1 }),
  ph("museum", { id: "hallE", kind: "stoneblock", x: 1, y: DOWN, z: -16.15 }, { ...box(12, 9, 0.3), x: 1, z: -16.15 }),
  ph("museum", { id: "rope", kind: "exhibitrope", x: 0, y: 0, z: 0, posts: [[ROPE_X, 3], [ROPE_X, 1], [ROPE_X, -1], [ROPE_X, -3], [ROPE_X, -5], [ROPE_X, -7]] }, { kind: "stanchions", posts: [[ROPE_X, 3], [ROPE_X, 1], [ROPE_X, -1], [ROPE_X, -3], [ROPE_X, -5], [ROPE_X, -7]] }),
  ph("museum", { id: "sabP", kind: "plinth", x: SAB[0], y: 0, z: SAB[1], w: 2.6, h: 0.3, d: 1.6 }, box(2.6, 0.3, 1.6)),
  ph("museum", { id: "mamP", kind: "plinth", x: MAM[0], y: 0, z: MAM[1], w: 3.2, h: 0.3, d: 4.4 }, box(3.2, 0.3, 4.4)),
  ph("museum", { id: "rexP", kind: "plinth", x: REXP[0], y: 0, z: REXP[1], ...PLINTH }, box(PLINTH.w, PLINTH.h, PLINTH.d)),
  ph("museum", { id: "case", kind: "glasscase", x: CASE[0], y: 0, z: CASE[1], fossil: 1 }, box(1.1, 2.1, 1.1)),
  ph("museum", { id: "plant", kind: "wiltplant", x: PLANT[0], y: 0, z: PLANT[1], bloom: 0 }, { kind: "bistroplant" }),
  ph("museum", { id: "fish", kind: "livefish", x: CASE[0], y: DOWN, z: CASE[1] }, { ...box(0.5, 0.2, 0.16), y: DOWN }),
  ph("museum", { id: "fishW", kind: "livefish", wear: "spud", x: 0, y: 0.42, z: 0.4, scale: 0.001 }, { ...box(0.5, 0.2, 0.16), y: 0.42, z: 0.4, x: 0, scale: 0.001 }),
  // ---- the skeletons (T3 props-fossils.js) and the living animals (T2 props-iceage.js)
  ph("fossils", { id: "sabB", kind: "sabrebones", x: SAB[0], y: 0.3, z: SAB[1], rot: -90 }, { ...box(0.6, 1.1, 1.8), y: 0.3, rot: -90 }),
  ph("fossils", { id: "mamB", kind: "mammothbones", x: MAM[0], y: 0.3, z: MAM[1], rot: -55 }, { ...box(1.7, 3.1, 3.4), y: 0.3, rot: -55 }),
  ph("fossils", { id: "rexB", kind: "trexbones", x: REXP[0], y: 0.3, z: REXP[1], rot: 0, scale: REXK }, { kind: "trex", y: 0.3, rot: 0, scale: REXK }),
  ph("fossils", { id: "ptB1", kind: "pterobones", x: PT[0][0], y: PT[0][1], z: PT[0][2], rot: -60 }, { ...box(2.6, 0.25, 0.8), y: PT[0][1], rot: -60 }),
  ph("fossils", { id: "ptB2", kind: "pterobones", x: PT[1][0], y: PT[1][1], z: PT[1][2], rot: -110 }, { ...box(2.6, 0.25, 0.8), y: PT[1][1], rot: -110 }),
  { id: "rex", kind: "trex", x: BREACH_X, y: 0, z: SZ - 1.5, rot: 0, scale: REXK, jaw: 0.9, brow: -1, neckP: 5, headP: -8, lean: 14, ...(READY.has("rex") && { skin: "brown" }) },
  ph("iceage", { id: "mam", kind: "mammoth", x: 6.6, y: 0, z: SZ - 2.5, rot: 0 }, { ...box(1.7, 3.1, 3.4) }),
  ph("iceage", { id: "sab", kind: "sabretooth", x: 1.2, y: 0, z: SZ - 3, rot: 0 }, { ...box(0.6, 1.1, 1.8) }),
  ph("iceage", { id: "pt1", kind: "pterosaur", x: 3.4, y: 6.5, z: SZ - 1, rot: 0 }, { ...box(2.6, 0.25, 0.8), y: 6.5 }),
  ph("iceage", { id: "pt2", kind: "pterosaur", x: 5.6, y: 7.6, z: SZ - 2, rot: 0 }, { ...box(2.6, 0.25, 0.8), y: 7.6 }),
  ph("iceage", { id: "pt3", kind: "pterosaur", x: 2.0, y: 8.4, z: SZ - 3, rot: 0 }, { ...box(2.6, 0.25, 0.8), y: 8.4 }),
  // ---- the street (T4 props-museumstreet.js)
  ph("street", { id: "front", kind: "museumfront", x: 0, y: 0, z: SZ, w: 34, h: 10, breachX: BREACH_X, breachW: 9, breachH: 7.5, breach: 0, burst: 0 }, { ...box(34, 10, 1), z: SZ - 0.5 }),
  ph("street", { id: "square", kind: "townsquare", x: 0, y: 0, z: SZ + 10, w: 40, d: 34 }, { ...box(0.2, 0.2, 0.2), y: DOWN, z: SZ + 10 }),
  ph("street", { id: "neck", kind: "hillneck", x: 2.5, y: 0, z: SZ - 18, rise: 0 }, { ...box(5, 38, 5), y: DOWN, z: SZ - 18, x: 2.5 }),
  ph("street", { id: "cracks", kind: "streetcracks", x: SCY_END[0], y: 0.01, z: SCY_END[1], r: 2.6, grow: 0 }, { ...box(0.2, 0.2, 0.2), y: DOWN }),
  ...(has("fossils") ? [["spSab", SAB, 1.3, 2.2], ["spMam", MAM, 2.4, 3.6], ["spRex", REXP, 3.0, 5.6]].map(([id, at, r, h]) => ({ id, kind: "lifesparks", x: at[0], y: 0.3, z: at[1], r, h, rise: 0 })) : []),
  { id: "lamp", kind: "streetlamp", x: LAMP_AT[0], y: 0, z: LAMP_AT[1], h: LAMP_H, lit: 0 },
  // ---- Reaper's scythe: worn in his right fist all clip; a second one falls and stands in the street
  { id: "scy", kind: "parkedscythe", wear: "rea", x: -0.5, y: 0.5, z: 0.12, rot: 0 },
  { id: "scyF", kind: "parkedscythe", x: SCY_END[0], y: DOWN, z: SCY_END[1], rot: 20 },
];

// ================================================================= 0 THE COLD OPEN (0-1.5) = the street burst, FRONT
// camera: the T. rex comes out through the museum wall right behind them. Staged once (street()) and played twice.
function street(t0, from) {
  // from: the moment of the staging at t0 (0 = the wall is still whole); the three run at the camera, 3.2 m/s
  const RS = 3.2, z0 = SZ + 3 + from * RS, dur = t0 === 0 ? HALL : r3(LAMP - t0);
  for (const [who, x, dz] of [["spud", 0.1, 0.9], ["rea", -0.8, 0], ["phx", 0.95, 0.15]]) {
    if (t0 > 0) place(t0, who, [x, r3(z0 + dz)], 0);
    A(t0, who, "run", { pts: [[0, x, r3(z0 + dz)], [dur, x, r3(z0 + dz + dur * RS)]], dur, rate: [[0, RS], [dur, RS]], stride: 1.7 });
    expr(t0, who, "terrified", TERROR, 0.01);
    A(t0, who, "look", { to: [0, 0.1], dur: 0.01, blink: false });
  }
  // the T. rex: through the wall at from 0.3, then after them at 3.6 m/s
  const rz = (f) => r3(SZ - 2.6 + Math.max(0, f - 0.1) * 3.6);
  P(t0, "rex", { x: BREACH_X - 0.4, y: 0, z: rz(from), rot: -6, jaw: 0.9, brow: -1, lean: 14, neckP: 5, headP: -8, squint: 0.2 });
  P(t0, "rex", { z: rz(from + dur) }, dur);
  for (let k = 0, t = t0; t < t0 + dur - 0.05; k++, t = r3(t0 + k * 0.3)) { if (!has("rex")) { P(t, "rex", { step: 1 }, 0.14, "out"); P(r3(t + 0.14), "rex", { step: 0 }, 0.14, "in"); } sfx(r3(t + 0.28), "dinostomp", { gain: 0.5 }); }
  ANI(t0, "rex", { gait: r3(from * 1.67), drool: 1, glow: 0 }); ANI(t0, "rex", { gait: r3((from + dur) * 1.67) }, dur);
  for (const [id, k] of [["mam", 1.4], ["sab", 2.2]]) { ANI(t0, id, { ...HUNGRY, jaw: 0.8, lookY: 0, gait: r3(from * k), glow: 0 }); ANI(t0, id, { gait: r3((from + dur) * k) }, dur); }
  for (const id of ["pt1", "pt2", "pt3"]) { ANI(t0, id, { flap: r3(from * 2.5), jaw: 0.6, glow: 0 }); ANI(t0, id, { flap: r3((from + dur) * 2.5) }, dur); }
  P(t0, "mam", { x: 4.6, y: 0, z: r3(SZ - 3 + from * 2.4), rot: -6 }); P(t0, "mam", { z: r3(SZ - 3 + (from + dur) * 2.4) }, dur);
  P(t0, "sab", { x: -2.2, y: 0, z: r3(SZ - 4 + from * 3.0), rot: 4 }); P(t0, "sab", { z: r3(SZ - 4 + (from + dur) * 3.0) }, dur);
  [["pt1", -1.2, 6.6, -1], ["pt2", 3.6, 7.8, -2.2], ["pt3", 0.6, 8.8, -3.4]].forEach(([id, x, y, dz]) => { P(t0, id, { x, y, z: r3(SZ + dz + from * 3), rot: 0 }); P(t0, id, { z: r3(SZ + dz + (from + dur) * 3), y: r3(y + 0.8) }, dur); });
  // the wall: whole until from 0.3, then the hole opens and the stones fly (burst = seconds since the break)
  const B0 = 0.3;
  if (from >= B0) { P(t0, "front", { breach: 1, burst: r3(from - B0) }); Pk("street", t0, "front", { burst: r3(from - B0 + dur) }, dur); }
  else { P(t0, "front", { breach: 0, burst: 0 }); P(r3(t0 + B0 - from), "front", { breach: 1 }, 0.1, "out"); Pk("street", r3(t0 + B0 - from), "front", { burst: r3(dur - B0 + from) }, r3(dur - B0 + from)); }
}
street(0, COLD - STREET);
sfx(0, "slam", { gain: 0.9, loud: true }); sfx(0.05, "dinoroar", { gain: 0.8 }); sfx(0, "rumble", { gain: 0.5 });
c.at(0.02, { fx: "shake", dur: 0.5, amp: 0.045 });
see(0, HALL, ["spud.face", "rea.face", "rex"], "the cold open: a living T. rex right behind the screaming friends");

// ================================================================= 1 THE HALL (1.5-3.6): the plant
for (const id of ["rex", "mam", "sab", "pt1", "pt2", "pt3"]) park(HALL, id);
place(HALL, "spud", SPUD1, 12); place(HALL, "rea", REA1, 8); place(HALL, "phx", PHX1, 78);
for (const w of ["spud", "rea", "phx"]) expr(r3(HALL - 0.02), w, "kind", null, 0.01);
A(HALL, "phx", "crouch", { to: 0.35, dur: 0.01 }); expr(HALL, "phx", "eager", null, 0.01);
A(HALL, "phx", "look", { to: [0.8, 0.1], dur: 0.01, blink: false });
A(HALL, "spud", "look", { to: [0.7, 0.0], dur: 0.01, blink: false }); A(HALL, "rea", "look", { to: [0.75, -0.1], dur: 0.01, blink: false });
expr(HALL, "rea", "terrified", { open: 0.15, eye: 1.15, curve: -0.2 }, 0.01);
c.arm(r3(HALL + 0.25), "phx", "R", "point", 0.3);                      // he reaches under the rope for a bone
c.say(r3(HALL + 0.3), "phx", "ooh, bones!", 0.6, "excited", { voice: false, sub: "Ooh, bones!" });
c.say(r3(HALL + 0.85), "rea", "don't touch it!", 0.6, "excited", { voice: false, sub: "Don't touch it!" });
// he flinches: the scythe's tip dips into the dead plant
A(r3(TOUCH - 0.25), "rea", "lean", { to: -9, dur: 0.14, ease: "out" }); A(r3(TOUCH - 0.1), "rea", "lean", { to: 0, dur: 0.3, ease: "settle" });
P(r3(TOUCH - 0.2), "scy", { tilt: 38 }, 0.2, "out");
sfx(TOUCH, "bell", { gain: 0.6 }); sfx(TOUCH, "shing", { gain: 0.35 });
c.at(TOUCH, { fx: "sparkle", at: [PLANT[0], 0.9, PLANT[1]], color: "#7dff6a", dur: 0.6 });
P(TOUCH, "plant", { bloom: 1 }, 0.5, "back");
A(r3(TOUCH + 0.2), "rea", "look", { to: [0.5, -0.5], dur: 0.12, blink: false }); expr(r3(TOUCH + 0.3), "rea", "shocked", { open: 0.3, eye: 1.3 });
A(r3(TOUCH + 0.3), "spud", "look", { to: [0.6, -0.5], dur: 0.15, blink: false }); expr(r3(TOUCH + 0.4), "spud", "shocked", { open: 0.25, eye: 1.25 });
A(r3(TOUCH + 0.45), "phx", "look", { to: [-0.3, -0.2], dur: 0.15, blink: false }); expr(r3(TOUCH + 0.55), "phx", "delighted", { open: 0.6, curve: 1 });
P(r3(TOUCH + 0.5), "scy", { tilt: 0 }, 0.3);
see(HALL, FISH, ["rea.face", "plant", "phx"], "Reaper flinches from Phoenix and the scythe makes the dead plant bloom");

// ================================================================= 2 THE FISH (3.6-5.9)
place(FISH, "spud", SPUD2, -18); place(FISH, "rea", REA2, 14); place(FISH, "phx", PHX2, 62);
A(FISH, "phx", "crouch", { to: 0, dur: 0.01 }); c.arm(r3(FISH - 0.02), "phx", "R", { o: [0.3, 0.55, 0.4] }, 0.01);
expr(FISH, "phx", "eager", { open: 0.4, curve: 0.9 }, 0.01); expr(FISH, "rea", "terrified", { open: 0.2, eye: 1.2, curve: -0.25 }, 0.01); expr(FISH, "spud", "shocked", { open: 0.12, eye: 1.15 }, 0.01);
A(FISH, "phx", "look", { to: [0.7, 0.1], dur: 0.01, blink: false }); A(FISH, "rea", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false }); A(FISH, "spud", "look", { to: [-0.6, 0.2], dur: 0.01, blink: false });
c.say(r3(FISH + 0.1), "phx", "do the fish!", 0.6, "excited", { voice: false, sub: "Do the fish!" });
P(r3(FISH + 0.45), "scy", { tilt: -30 }, 0.3, "out");                    // Phoenix shoves his scythe arm: the tip taps the glass
sfx(r3(FISH + 0.75), "tink", { gain: 0.5 }); sfx(r3(FISH + 0.78), "bell", { gain: 0.65 });
c.at(r3(FISH + 0.78), { fx: "sparkle", at: [CASE[0], 1.75, CASE[1] + 0.55], color: "#7dff6a", dur: 0.6 });
// the fish flops out over the top of the case and into Spud's arms
Pk("museum", r3(FISH + 0.78), "case", { glow: 1 }, 0.2, "out"); Pk("museum", FLOP, "case", { burst: 1, fossil: 0 }, 0.6); Pk("museum", r3(FLOP + 0.2), "case", { glow: 0 }, 0.5);
P(r3(FLOP - 0.02), "fish", { x: CASE[0], y: 1.55, z: r3(CASE[1] + 0.5), rot: 30 });
for (let k = 0; k < 5; k++) Pk("museum", r3(FLOP + k * 0.09), "fish", { flop: k % 2 ? -1 : 1, gasp: 1, wet: 1 }, 0.09);
for (let k = 0; k < 8; k++) Pk("museum", r3(CATCHF + k * 0.11), "fishW", { flop: (k % 2 ? -1 : 1) * (k < 5 ? 1 : 0.4), gasp: k % 2 }, 0.11);
P(FLOP, "fish", { x: r3((CASE[0] + SPUD2[0]) / 2), y: 2.3, z: r3((CASE[1] + SPUD2[1]) / 2 + 0.3), rot: 200 }, r3((CATCHF - FLOP) / 2), "out");
P(r3((FLOP + CATCHF) / 2), "fish", { x: SPUD2[0], y: 0.5, z: r3(SPUD2[1] + 0.4), rot: 380 }, r3((CATCHF - FLOP) / 2), "in");
sfx(FLOP, "splash", { gain: 0.5 }); sfx(CATCHF, "slap", { gain: 0.45 });
park(r3(CATCHF + 0.02), "fish"); P(CATCHF, "fishW", { scale: 1 });
c.arm(r3(CATCHF - 0.3), "spud", "L", { o: [0.12, 0.42, 0.34] }, 0.25); c.arm(r3(CATCHF - 0.3), "spud", "R", { o: [0.12, 0.42, 0.34] }, 0.25);
A(CATCHF, "spud", "squash", { amount: 0.05, dur: 0.15 }); expr(CATCHF, "spud", "shocked", { open: 0.45, eye: 1.3 });
expr(SHRIEK, "rea", "terrified", TERROR, 0.08); A(SHRIEK, "rea", "hop", { count: 1, height: 0.18, dur: 0.3 });
c.say(SHRIEK, "rea", "AAAH!", 0.6, "excited", { voice: false, sub: "AAAH!" });
see(FISH, RUN, ["spud.face", "rea.face", "case"], "the scythe taps the case and the fossil fish flops alive into Spud's arms");

// ================================================================= 3 THE RUN (5.9-8.3): the scythe rattles along the row
const RUNLEN = r3(CRASH - RUN - 0.1);
A(RUN, "rea", "run", { pts: [[0, REA2[0], REA2[1]], [0.4, RUN0[0], RUN0[1]], [RUNLEN, RUN1[0], RUN1[1]]], dur: RUNLEN, rate: [[0, 3.6], [0.4, 4.6], [RUNLEN, 4.4]], stride: 1.7 });
A(RUN, "rea", "turn", { to: 150, dur: 0.2 }); A(r3(RUN + 0.3), "rea", "turn", { to: 180, dur: 0.2 });
c.say(r3(RUN + 0.1), "rea", "AAAAAH!", 1.6, "excited", { voice: false, sub: "AAAAAH!" });
Pk("museum", r3(RUN + 0.45), "rope", { rattle: 1 }, 0.25, "out"); Pk("museum", r3(CRASH - 0.1), "rope", { rattle: 0 }, 0.5);
P(r3(RUN + 0.2), "scy", { tilt: -55, x: -0.62 }, 0.25);                                  // trailing behind him, its tip out to the row
// each skeleton he passes: a spark, the glow, and it is alive half a second later (the swap sits inside the glow)
const WAKE = [["ptB1", "pt1", r3(RUN + 0.75), [1.2, 5.2, -1.0]], ["sabB", "sab", r3(RUN + 0.6), SAB], ["mamB", "mam", r3(RUN + 1.35), MAM], ["ptB2", "pt2", r3(RUN + 1.85), [0.6, 5.0, -6.5]]];
for (const [bones, alive, t, at] of WAKE) {
  sfx(t, "bell", { gain: 0.5 }); c.at(t, { fx: "sparkle", at: at.length === 2 ? [ROPE_X + 0.3, 0.6, at[1]] : at, color: "#7dff6a", dur: 0.5 });
  Pk("fossils", t, bones, { glow: 1 }, 0.4, "out"); Pk("fossils", r3(t + 0.1), bones, { rattle: 1 }, 0.3);
  park(r3(t + 0.5), bones);
  ANI(r3(t + 0.48), alive, { glow: 1, ...CURIOUS }); ANI(r3(t + 0.52), alive, { glow: 0 }, 0.45, "out");
  const sp = { sabB: "spSab", mamB: "spMam" }[bones]; if (sp) Pk("fossils", t, sp, { rise: 1 }, 0.8, "out");
  if (at.length === 2) P(r3(t + 0.5), alive, { x: at[0], y: 0.3, z: at[1], rot: bones === "sabB" ? -90 : -55 });
  else P(r3(t + 0.5), alive, { x: at[0], y: at[1], z: at[2], rot: 180 });
}
// Spud and Phoenix come after him
A(r3(RUN + 0.45), "spud", "turn", { to: 190, dur: 0.25 }); A(r3(RUN + 0.5), "phx", "turn", { to: 185, dur: 0.25 });
A(r3(RUN + 0.5), "spud", "run", { pts: [[0, SPUD2[0], SPUD2[1]], [1.9, SPUD3[0], SPUD3[1]]], dur: 1.9, rate: [[0, 3.4], [1.9, 3.4]], stride: 1.5 });
A(r3(RUN + 0.6), "phx", "run", { pts: [[0, PHX2[0], PHX2[1]], [1.8, PHX3[0], PHX3[1]]], dur: 1.8, rate: [[0, 4.2], [1.8, 4.2]], stride: 1.5 });
see(r3(RUN + 0.4), CRASH, ["rea.face"], "Reaper runs screaming along the row, each skeleton lighting up behind him");

// ================================================================= 4 THE CRASH (8.3) and EVERYTHING ALIVE (9.3)
place(r3(CRASH - 0.1), "rea", [1.0, -9.15], 168);
P(r3(CRASH - 0.12), "scy", { tilt: -80, x: -0.5 }, 0.1);
A(CRASH, "rea", "lean", { to: 24, dur: 0.12, ease: "out" }); A(CRASH, "rea", "squash", { amount: 0.1, dur: 0.14 });
sfx(CRASH, "slam", { gain: 0.6 }); sfx(r3(CRASH + 0.03), "bell", { gain: 0.9, loud: true });
c.at(CRASH, { fx: "impact", at: [0.75, 1.1, -10.4], color: "#9dff7a", dur: 0.3 }); c.at(CRASH, { fx: "shake", dur: 0.3, amp: 0.03 });
expr(r3(CRASH + 0.3), "spud", "terrified", TERROR); expr(r3(CRASH + 0.3), "phx", "delighted", { open: 0.7, curve: 1 });
Pk("fossils", CRASH, "rexB", { glow: 1 }, 0.45, "out"); Pk("fossils", r3(CRASH + 0.1), "rexB", { rattle: 1 }, 0.4); Pk("fossils", CRASH, "spRex", { rise: 1 }, 0.9, "out");
P(r3(CRASH + 0.6), "rex", { x: REXP[0], y: 0.3, z: REXP[1], rot: 0, jaw: 0, brow: 0.3, lean: 0, neckP: 0, headP: 0, squint: 0, step: 0 }); park(r3(CRASH + 0.62), "rexB");
ANI(r3(CRASH + 0.58), "rex", { glow: 1, gait: 0, drool: 0 }); ANI(r3(CRASH + 0.62), "rex", { glow: 0 }, 0.5, "out");
// 06: everything alive
P(ALIVE, "rex", { neckP: -12, headP: -10, jaw: 0.5, arms: 1 }, 0.4, "out"); P(r3(ALIVE + 0.4), "rex", { jaw: 0.15, neckP: 0, headP: 6 }, 0.3);
P(STOMP - 0.14, "rex", { step: 1 }, 0.14, "out"); P(STOMP, "rex", { step: 0 }, 0.08, "in"); sfx(STOMP, "dinostomp", { gain: 0.9, loud: true }); c.at(STOMP, { fx: "shake", dur: 0.35, amp: 0.04 });
sfx(r3(ALIVE + 0.05), "snort", { gain: 0.6 });
P(ALIVE, "mam", { x: MAM4[0], y: 0, z: MAM4[1], rot: -70 }); P(ALIVE, "sab", { x: SAB4[0], y: 0, z: SAB4[1], rot: 65 });
P(ALIVE, "pt1", { x: -2.0, y: 6.2, z: -9, rot: 90 }); P(ALIVE, "pt1", { x: 3.5, y: 6.8, z: -7.5 }, 1.5); P(ALIVE, "pt2", { x: 4.2, y: 5.4, z: -11, rot: -90 }); P(ALIVE, "pt2", { x: -1.5, y: 6.0, z: -12 }, 1.5);
for (const id of ["mam", "sab"]) ANI(ALIVE, id, { ...CURIOUS, gait: 0, glow: 0 });
ANI(ALIVE, "mam", { trunk: 1 }, 0.5, "back"); ANI(r3(ALIVE + 0.2), "sab", { jaw: 0.8 }, 0.3, "out"); ANI(r3(ALIVE + 0.7), "sab", { jaw: 0.1 }, 0.3);
for (const id of ["pt1", "pt2"]) { ANI(ALIVE, id, { flap: 0, glow: 0 }); ANI(ALIVE, id, { flap: 3.5 }, 1.5); }
place(ALIVE, "spud", SPUD4, 180); place(ALIVE, "rea", REA4, 172); place(ALIVE, "phx", PHX4, 186);
A(ALIVE, "rea", "lean", { to: 0, dur: 0.01 }); P(r3(ALIVE - 0.02), "scy", { tilt: 0, x: -0.5 });
for (const w of ["spud", "rea", "phx"]) A(ALIVE, w, "look", { to: [0, 0.9], dur: 0.01, blink: false });
see(ALIVE, CALM, ["rex", "mam", "sab", "spud", "rea", "phx"], "the whole museum alive, the three tiny below");

// ================================================================= 5 THE CALM (10.8-12.6): it only sniffs him
place(CALM, "spud", SPUD4, 6); place(CALM, "rea", REA4, 14); place(CALM, "phx", PHX4, -30);
P(r3(CALM - 0.02), "rex", { ...rexFor([-0.45, 1.5, -7.3], { lean: 20, neckP: 25, headP: 10 }, 10), jaw: 0, brow: 0.5, squint: 0.3, arms: 0 });
P(r3(CALM - 0.02), "mam", { x: 2.6, z: -7.8, rot: -75 });
ANI(r3(CALM - 0.02), "mam", { trunk: 0.2, headY: 20, headP: 10 }); ANI(r3(CALM - 0.02), "sab", { jaw: 0, headP: 10 });
for (const k of [0, 0.5, 1.0]) { P(r3(CALM + 0.15 + k), "rex", { sniff: 1 }, 0.15); P(r3(CALM + 0.3 + k), "rex", { sniff: 0 }, 0.25); sfx(r3(CALM + 0.15 + k), "snort", { gain: 0.5 }); }
expr(CALM, "spud", "shocked", { open: 0.05, eye: 1.2, curve: 0 }, 0.01); A(CALM, "spud", "look", { to: [0.6, 0.5], dur: 0.01, blink: false });
expr(r3(CALM + 0.8), "spud", "happy", { open: 0.3, curve: 0.8, eye: 0.9 }, 0.3);
expr(CALM, "phx", "delighted", { open: 0.5, curve: 1 }, 0.01); A(CALM, "phx", "look", { to: [0.8, 0.5], dur: 0.01, blink: false }); c.arm(r3(CALM + 0.1), "phx", "L", "up", 0.3);
expr(CALM, "rea", "terrified", { open: 0.1, eye: 1.2, curve: -0.2 }, 0.01); A(CALM, "rea", "look", { to: [0.7, 0.6], dur: 0.01, blink: false });
c.say(r3(CALM + 0.35), "phx", "he's friendly!", 0.7, "excited", { voice: false, sub: "He's friendly!" });
see(CALM, CATCH, ["spud.face", "phx.face", "rex"], "the fake-out: the T. rex sniffs Spud gently, Phoenix pets the mammoth");

// ================================================================= 6 THE CATCH (12.6-14.0): they are all starving
sfx(CATCH, "groan", { gain: 0.9, loud: true }); sfx(r3(CATCH + 0.1), "rumble", { gain: 0.7 }); c.at(r3(CATCH + 0.05), { fx: "shake", dur: 0.7, amp: 0.015 });
P(CATCH, "rex", { lean: 6, neckP: 8, headP: 32, neckY: 0, squint: 0.75, brow: -1, jaw: 0.25 }, 0.4, "inOut");
ANI(CATCH, "rex", { drool: 1 }, 0.5); for (const id of ["mam", "sab"]) ANI(CATCH, id, { ...HUNGRY, headP: 22, trunk: -0.4 }, 0.4, "inOut");
ANI(r3(CATCH + 0.5), "sab", { lick: 1 }, 0.5);
for (const w of ["spud", "phx", "rea"]) { A(r3(CATCH + 0.45), w, "look", { to: [0.1, 0.95], dur: 0.12, blink: false }); expr(r3(CATCH + 0.6), w, "terrified", TERROR, 0.1); }
c.arm(r3(CATCH + 0.5), "phx", "L", "rest", 0.2);
c.say(r3(CATCH + 0.75), "spud", "we're potatoes.", 0.55, "sad", { voice: false, sub: "...We're potatoes." });
see(CATCH, CHASE, ["spud.face", "rea.face", "phx.face", "rex"], "the catch: every animal looks down at them, hungry");

// ================================================================= 7 THE CHASE (14.0-15.6): down the hall at us
const CH = r3(STREET - CHASE);
for (const [who, x, z0] of [["spud", 0.1, -2.3], ["rea", -0.8, -3.2], ["phx", 0.95, -3.05]]) {
  place(CHASE, who, [x, z0], 0);
  A(CHASE, who, "run", { pts: [[0, x, z0], [CH, x, r3(z0 + CH * 4.4)]], dur: CH, rate: [[0, 4.4], [CH, 4.4]], stride: 1.7 });
  expr(CHASE, who, "terrified", TERROR, 0.01); A(CHASE, who, "look", { to: [0, 0.1], dur: 0.01, blink: false });
}
P(r3(CHASE - 0.02), "rex", { x: 0.4, z: -7.2, rot: 0, lean: 16, neckP: 6, headP: -6, jaw: 0.9, squint: 0.2 }); P(CHASE, "rex", { z: r3(-7.2 + CH * 4.0) }, CH);
ANI(CHASE, "rex", { gait: 0 }); ANI(CHASE, "rex", { gait: r3(CH * 1.67) }, CH);
for (const [id, k] of [["mam", 1.4], ["sab", 2.2]]) { ANI(r3(CHASE - 0.02), id, { ...HUNGRY, jaw: 0.8, lookY: 0, headP: 0, headY: 0, trunk: 0.6, lick: 0, gait: 0 }); ANI(CHASE, id, { gait: r3(CH * k) }, CH); }
for (const id of ["pt1", "pt2"]) { ANI(CHASE, id, { flap: 0, jaw: 0.6 }); ANI(CHASE, id, { flap: r3(CH * 2.5) }, CH); }
for (let k = 0; k < 5; k++) { const t = r3(CHASE + k * 0.3); if (!has("rex")) { P(t, "rex", { step: 1 }, 0.14, "out"); P(r3(t + 0.14), "rex", { step: 0 }, 0.14, "in"); } sfx(r3(t + 0.28), "dinostomp", { gain: 0.6 }); c.at(r3(t + 0.28), { fx: "shake", dur: 0.15, amp: 0.02 }); }
P(r3(CHASE - 0.02), "mam", { x: 3.2, z: -8.4, rot: -4 }); P(CHASE, "mam", { z: r3(-8.4 + CH * 3.4) }, CH);
P(r3(CHASE - 0.02), "sab", { x: -2.4, z: -6.2, rot: 6 }); P(CHASE, "sab", { z: r3(-6.2 + CH * 4.2) }, CH);
P(r3(CHASE - 0.02), "pt1", { x: -1.5, y: 5.2, z: -9, rot: 0 }); P(CHASE, "pt1", { y: 3.4, z: -1.5 }, CH); P(r3(CHASE - 0.02), "pt2", { x: 3.0, y: 6.0, z: -11, rot: 0 }); P(CHASE, "pt2", { y: 4.2, z: -4 }, CH);
sfx(CHASE, "dinoroar", { gain: 0.9, loud: true });
see(CHASE, STREET, ["spud.face", "rea.face", "phx.face", "rex"], "the whole museum chases them down the hall");

// ================================================================= 8 THE STREET (15.6-17.4): out through the front wall
street(STREET, 0);
sfx(r3(STREET + 0.3), "slam", { gain: 1, loud: true }); sfx(r3(STREET + 0.35), "crumble", { gain: 0.7 }); c.at(r3(STREET + 0.3), { fx: "shake", dur: 0.5, amp: 0.045 });
see(STREET, LAMP, ["rex", "spud", "rea", "phx"], "the T. rex comes through the museum's front wall behind them");

// ================================================================= 9 THE LAMP (17.4-19.4)
const TOP = r3(LAMP_H - 0.25);
for (const [who, off, yaw] of [["spud", [0, TOP + 0.35, 0.05], 0], ["rea", [-0.62, TOP - 0.35, 0.12], 12], ["phx", [0.62, TOP - 0.3, 0.12], -12]]) {
  A(r3(LAMP - 0.02), who, "ride", { prop: "lamp", off, yaw, dur: 0 });
  expr(LAMP, who, "terrified", TERROR, 0.01); A(LAMP, who, "look", { to: [0.1, -0.9], dur: 0.01, blink: false });
}
const REXL = { lean: 0, neckP: -5, headP: -8 };
P(r3(LAMP - 0.02), "rex", { ...rexFor([LAMP_AT[0] + 1.25, 0, LAMP_AT[1] + 0.35], REXL, -75), jaw: 0.2, squint: 0.4, brow: -1, step: 0 });
if (process.env.DEBUG) console.log("lamp snout y", r3(trexPoints({ ...REXL, scale: REXK }).snout[1]));
for (let k = 0; k < 4; k++) { const t = r3(LAMP + 0.25 + k * 0.5); P(t, "rex", { jaw: 0.95, neckP: -11 }, 0.16, "out"); P(r3(t + 0.2), "rex", { jaw: 0.05, neckP: -5 }, 0.07, "in"); sfx(r3(t + 0.27), "slap", { gain: 0.6 }); }
P(r3(LAMP - 0.02), "mam", { x: 1.2, z: SZ + 9.6, rot: -100 }); P(r3(LAMP - 0.02), "sab", { x: -4.6, z: SZ + 9.4, rot: 100 });
ANI(r3(LAMP - 0.02), "rex", { gait: 0 }); Pk("street", r3(LAMP - 0.02), "front", { burst: 3 });
ANI(r3(LAMP - 0.02), "mam", { ...HUNGRY, gait: 0, headP: -25, trunk: 1, jaw: 0.5 }); ANI(r3(LAMP - 0.02), "sab", { ...HUNGRY, gait: 0, headP: -30, crouch: 0.6, jaw: 0.7, lookY: 0.8 });
ANI(LAMP, "pt1", { flap: 0 }); ANI(LAMP, "pt1", { flap: 5 }, 2.0);
P(r3(LAMP - 0.02), "pt1", { x: -6, y: 9, z: SZ + 4, rot: 90 }); P(LAMP, "pt1", { x: 5 }, 2.0); P(r3(LAMP - 0.02), "pt2", { y: DOWN }); P(r3(LAMP - 0.02), "pt3", { y: DOWN });
for (let t = r3(LAMP + 0.3); t < SLIP + 0.3; t = r3(t + 0.134)) A(t, "rea", "squash", { amount: 0.03, dur: 0.067 });   // he shakes
c.say(r3(LAMP + 0.5), "rea", "don't look down!", 0.7, "excited", { voice: false, sub: "D-don't look down!" });
// the scythe slips out of his glove and falls
park(SLIP, "scy"); P(r3(SLIP - 0.02), "scyF", { x: r3(LAMP_AT[0] - 1.1), y: r3(TOP + 0.1), z: r3(LAMP_AT[1] + 0.2), rot: 20 });
P(SLIP, "scyF", { x: SCY_END[0], y: 0.5, z: SCY_END[1], rot: 380, tip: 0 }, r3(SCYTHE - SLIP + 0.1), "in");
sfx(SLIP, "whoosh", { gain: 0.4 }); expr(r3(SLIP + 0.1), "rea", "shocked", { open: 0.5, eye: 1.4 });
see(LAMP, SCYTHE, ["spud.face", "rea.face", "phx.face", "rex"], "the three cling to the lamp top, the T. rex snapping below; the scythe slips");

// ================================================================= 10 THE SCYTHE (19.4-22.0): something bigger wakes
sfx(r3(SCYTHE + 0.1), "shing", { gain: 0.8 }); sfx(r3(SCYTHE + 0.12), "bell", { gain: 1, loud: true });
c.at(r3(SCYTHE + 0.1), { fx: "impact", at: [SCY_END[0], 0.1, SCY_END[1]], color: "#9dff7a", dur: 0.3 });
P(r3(SCYTHE + 0.15), "cracks", { y: 0, grow: 1 }, 0.9, "out");
sfx(RISE, "rumble", { gain: 1, loud: true }); c.at(RISE, { fx: "shake", dur: 1.6, amp: 0.03 });
if (!has("street")) P(r3(RISE - 0.02), "neck", { y: -30 });
P(RISE, "neck", { y: 0, rise: 1 }, 1.9, "out");
P(r3(RISE + 0.3), "rex", { neckY: 150, neckP: -20, headP: -10, jaw: 0.3, brow: 0.8, squint: 0, lean: 0 }, 0.4);   // even the T. rex turns to look
for (const w of ["spud", "rea", "phx"]) A(r3(RISE + 0.4), w, "look", { to: [-0.2, 0.9], dur: 0.2, blink: false });
cap(r3(RISE + 0.6), END, "Would you still want it?", 1210);
see(RISE, END, ["neck", "scyF"], "the scythe stands in the cracked street; a long neck as big as a hill rises behind the museum");

// ---------------------------------------------------------------- shots (camera A looks -z, B looks +z)
const coldCam = (from, dur) => { const z = (f) => r3(SZ + 3 + f * 3.2 + 0.9); return { pos: [0.15, 0.5, r3(z(from) + 5.5)], look: [0.5, 2.3, r3(z(from) - 3.5)], fov: 46, to: { pos: [0.15, 0.5, r3(z(from + dur) + 4.6)], look: [0.5, 2.5, r3(z(from + dur) - 4.4)], fov: 46 }, dur, ease: "linear" }; };
const SH = {
  cold:   coldCam(COLD - STREET, HALL),
  front:  coldCam(FRONT - STREET, LAMP - FRONT),
  hall:   { pos: [-0.2, 1.1, 7.6], look: [0.75, 1.5, 0], fov: 44 },
  fish:   { pos: [-1.15, 1.15, 7.0], look: [-1.15, 1.35, 1.5], fov: 36 },
  run:    { pos: [-1.2, 0.9, -3.6], look: [1.4, 1.4, 2.6], fov: 44, to: { pos: [-1.9, 0.9, -11.6], look: [1.4, 1.5, -6.5] }, dur: r3(CRASH - RUN - 0.5), ease: "linear" },
  crash:  { pos: [-2.9, 1.0, -6.3], look: [0.9, 1.7, -10.2], fov: 52 },
  alive:  { pos: [-0.3, 0.3, 2.6], look: [0.8, 2.9, -10.6], fov: 54 },
  calm:   { pos: [-0.1, 1.0, -0.4], look: [-0.15, 1.75, -7.4], fov: 40 },
  catch:  { pos: [0.1, 0.45, -2.5], look: [0.05, 2.45, -7], fov: 55 },
  chase:  { pos: [0.1, 0.5, 3.2], look: [0.2, 1.8, -6], fov: 48, to: { pos: [0.1, 0.5, 8.3], look: [0.2, 1.9, 0] }, dur: r3(STREET - CHASE), ease: "linear" },
  side:   { pos: [10.5, 1.4, SZ + 8], look: [0.8, 2.7, SZ + 2.6], fov: 46 },
  lamp:   { pos: [0.6, 0.9, SZ + 14.2], look: [-2.2, 4.6, SZ + 8], fov: 46 },
  scythe: { pos: [0.4, 0.3, SZ + 17.4], look: [-0.9, 5.2, SZ + 6], fov: 58 },
};
const CUTS = [
  ["cold open: the T. rex bursts out behind them", 0, SH.cold, "hook"],
  ["the hall: the plant", HALL, SH.hall],
  ["the fish", FISH, SH.fish],
  ["the run along the row", r3(RUN + 0.4), SH.run],
  ["the crash into the T. rex", r3(CRASH - 0.1), SH.crash],
  ["everything alive", ALIVE, SH.alive, "reveal"],
  ["the calm", CALM, SH.calm],
  ["the catch", CATCH, SH.catch, "payoff"],
  ["the chase", CHASE, SH.chase],
  ["the street, from the side", STREET, SH.side],
  ["the street, from the front", FRONT, SH.front],
  ["the lamp", LAMP, SH.lamp, "reaction"],
  ["the scythe and the long neck", SCYTHE, SH.scythe, "reaction"],
];

// ---------------------------------------------------------------- the commentator (voice 1, "narrator"), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0, process.env.TITLE ?? "What if you could bring anything back to life?", 1, 2.9, NG],
  [r3(FISH - 0.45), "A dead plant.", 1, 1.0, NG],
  [r3(RUN + 0.55), "Or everything in the museum.", 1, 1.9, NG],
  [r3(CALM + 1.15), "But there's a catch.", 1, 1.3, NG],
  [r3(CATCH + 0.02), "Nothing here has eaten for a million years.", 1, 2.4, NG],
  [r3(RISE + 0.6), "Would you still want it?", 1, 1.33, NG],
];
for (const [t, line, take, , gain] of NARR) c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);

const allowClip = [
  { who: "rea", with: "scy", from: 0, to: END, reason: "his scythe, in his fist (worn)" },
  { who: "spud", with: "fishW", from: 0, to: END, reason: "the fish hugged in both arms (worn)" },
  ...["spud", "rea", "phx"].map((who) => ({ who, with: "lamp", from: LAMP, to: END, reason: "they cling to the lamp's lantern" })),
];

write(import.meta.url, {
  id: VO ? "back-to-life" : "back-to-life-no-vo",
  title: "What if you could bring anything back to life? But there's a catch.",
  idea: "There's a catch, episode 5: the scared friend's scythe brings anything back to life: a plant, a fossil fish, then every skeleton in the museum; they all come back starving, and the three are potatoes",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [470, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  music: { style: "sneaky", lowCut: 150, gain: 0.45 },
  sound: { sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "concrete", room: "room", guard: true },
  hook: { show: ["spud", "rea", "rex"], hint: 0, what: "a living T. rex smashes out of the museum right behind Spud and Reaper, who run at the camera screaming" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/05-back-to-life/make-back-to-life.mjs.",
});
