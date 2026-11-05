// NEVER LOOKS UP, episode 2: TURBULENCE (5 Nov 2026). "The friend who never looks up from his phone… even in heavy
// turbulence". Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip
// (02-plane-turbulence/); series format 00-SERIES-FORMAT.md; panel notes PANELS-ep2-plane.md next to this file. The
// panels are the target.
//
// THE BRIEF
//   Joke:        a stormy night flight bucks, the masks drop and a big drop sends everything floating; Phoenix hangs his
//                phone on his mask's elastic and keeps scrolling hands-free.
//   Wants:       the Wizard wants Phoenix to notice; Reaper wants his tea; the Samurai wants to serve drinks.
//   Consequence: the Wizard floats upside down right over the phone and gets one flat "huh.".
//   Ending:      the plane levels out at that moment and drops everyone back into their seats; the Wizard glares at
//                Phoenix through his mask while Reaper sips.
//   Callback:    the opening's bump that made the Wizard grab Phoenix ends with the bump that drops the Wizard back
//                beside him, mask on, while Phoenix scrolls on.
//
//   node storyboards/series/never-looks-up/make-ep2-plane.mjs
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const FACES = "strong", MOTION = "natural";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0, AFTER = END + 0.5;                       // allowClip windows run to the video's end (hit-stops add frames)
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places (x right, z toward us = the plane's nose)
// one row of three seats facing us: Phoenix at the window (left), the Wizard in the middle, Reaper on the aisle. The
// seats are a potato wide (bodies about 0.82 m round) so nobody sits in anybody.
const PX = -1.06, WX = 0, RX = 1.06, SZ = 0.08, SEAT_W = 0.96;
const SEAT = 0.3;                                          // a sitter's body y (the cushion's top 0.42 less 0.12)
const OH_Y = 2.35;                                         // the passenger panel's underside
const WALL_X = -1.62;
const SEAT_C = "#5a6a9a";                                  // a lighter, warmer seat fabric so the hood and the lower bodies read
const PLATE = process.env.PLATE ?? "assets/plates/storm-cabin.png";

// Phoenix holds the phone in both gloves in front of his chest (Still Scrolling, ep 1 and 3)
const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const AT_PHONE = [0.03, -1];

// the Samurai in the aisle beside Reaper, turned to the row, his tray held level in front of him in both gloves
const SAM = { x: 1.9, z: -0.75, yaw: -10 };   // in the aisle just behind Reaper's shoulder (panel 01)
const samFrame = (f, lean = 0) => {
  // f: his feet; the tray's middle a little in front of his chest, its ends along his (level) left-right
  const y = rad(SAM.yaw), l = rad(lean), fwd = [Math.sin(y), 0, Math.cos(y)], lx = [Math.cos(y), 0, -Math.sin(y)];
  const up = [lx[0] * -Math.sin(l), Math.cos(l), lx[2] * -Math.sin(l)];
  const mid = [0, 1, 2].map((i) => f[i] + up[i] * 0.48 + fwd[i] * 0.4);
  const end = (s) => ({ world: [0, 1, 2].map((i) => r3(mid[i] + s * lx[i] * 0.17 - (i === 1 ? 0.012 : 0))) });
  return { tray: { x: r3(mid[0]), y: r3(mid[1]), z: r3(mid[2]) }, R: end(-1), L: end(1) };
};
const SAM_FEET0 = [SAM.x, 0, SAM.z];

const cast = [
  { id: "phx", character: "duo/phoenix", at: [PX, SZ], face: 0, expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 2.0,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [WX, SZ], face: 0, expr: "kind", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: [RX, SZ], face: 0, expr: "kind", follow: 0.25, seed: 3.1 },
  { id: "sam", character: "busy/samurai-worker", at: [SAM.x, SAM.z], face: SAM.yaw, expr: "kind", follow: 0.3, seed: 5.2 },
];

// the masks: up in the panel until the doors open, then on their hoses (anchor = the hose's top, at its door)
const MASK_UP = (x) => ({ x: r3(x), y: r3(OH_Y + 0.07), z: 0.12 });
const anchor = (x, dx = 0) => [r3(x + dx), r3(OH_Y - 0.01), 0.1];
const CUP = { x: r3(WX + 0.14), y: 0.66, z: 0.52 };         // the Wizard's juice, in his left glove over his lap
const MUG = { x: r3(RX - 0.14), y: 0.66, z: 0.52 };         // Reaper's tea, in his right glove
const S0 = samFrame(SAM_FEET0);
const props = [
  { id: "wall", kind: "cabinwall", x: WALL_X, y: 0, z: 0, len: 9, windows: 9, gap: 0.85, first: 0.45, back: 5, boltAt: 5, glow: 0 },
  { id: "seatP", kind: "planeseat", x: PX, z: 0, w: SEAT_W, arms: "both", color: SEAT_C, cover: 0.34 },
  { id: "seatW", kind: "planeseat", x: WX, z: 0, w: SEAT_W, arms: "L", color: SEAT_C, cover: 0.34 },
  { id: "seatR", kind: "planeseat", x: RX, z: 0, w: SEAT_W, arms: "L", color: SEAT_C, cover: 0.34 },
  { id: "beltP", kind: "seatbelt", x: PX, z: 0, r: 0.42 },
  { id: "beltW", kind: "seatbelt", x: WX, z: 0, r: 0.42 },
  { id: "beltR", kind: "seatbelt", x: RX, z: 0, r: 0.42 },
  { id: "bins", kind: "overhead", x: -0.05, y: OH_Y, z: 0, w: 3.4, color: "#a89f93", panel: "#9d958a", doors: [PX + 0.36 + 0.11, WX + 0.11, RX + 0.11].map(r3), sign: 0.5, lit: 1, open: 0 },
  { id: "maskP", kind: "oxymask", ...MASK_UP(PX + 0.36), anchor: anchor(PX, 0.36) },   // its hose comes down beside his face, not across it
  { id: "maskW", kind: "oxymask", ...MASK_UP(WX), anchor: anchor(WX) },
  { id: "maskR", kind: "oxymask", ...MASK_UP(RX), anchor: anchor(RX) },
  { id: "phone", kind: "phone", x: PX, y: 0.9, z: 0.5, rot: 180, tip: -28, scale: 1.9, case: "#29c3d8", bright: 2.2, halo: 0.26, haloK: 0.5 },   // the screen shines in his face (Jonny 5 Nov; the same setting as ep 5)   // a bright cyan case: it reads against the dark gloves and the orange body
  { id: "cup", kind: "papercup", ...grips.placeFor("papercup", [CUP.x, CUP.y, CUP.z], 0), straws: 0, stripe: "#e0802a" },
  { id: "juice", kind: "blob", x: CUP.x, y: r3(CUP.y + 0.085), z: CUP.z, color: "#f59a1f", r: 0.034, fill: 0 },
  { id: "mug", kind: "teamug", steam: 0.6, ...grips.placeFor("teamug", [MUG.x, MUG.y, MUG.z], 0) },
  { id: "tea", kind: "blob", x: MUG.x, y: r3(MUG.y + 0.07), z: MUG.z, color: "#7a4316", r: 0.04, fill: 0 },
  { id: "tray", kind: "drinktray", ...S0.tray, rot: SAM.yaw },
  { id: "front", kind: "rowback", x: 0, y: -1.0, z: 2.3, n: 3, gap: 1.06, scale: 1 },
  { id: "front2", kind: "rowback", x: 0, y: -0.95, z: 3.4, n: 3, gap: 1.06, scale: 1 },
  { id: "pillow", kind: "pillow", x: 0.6, y: 1.9, z: 0.9, rot: 20, scale: 0.0001 },
  { id: "mag", kind: "magazine", x: 0.55, y: 0.03, z: 1.15, rot: 30, tilt: 0 },
  // invisible carriers: the bodies float on these (a float is a path, not a walk)
  { id: "phxC", kind: "carrier", x: PX, y: 0, z: SZ },
  { id: "wizC", kind: "carrier", x: WX, y: 0, z: SZ },
  { id: "reaC", kind: "carrier", x: RX, y: 0, z: SZ },
  { id: "samC", kind: "carrier", x: SAM.x, y: 0, z: SAM.z },
];
const P = Object.fromEntries(props.map((p) => [p.id, p]));

// ---------------------------------------------------------------- the plane: bumps, lightning, the rumble
const BUMPS = [[0.06, 0.06, 0.4], [1.55, 0.045, 0.35], [3.27, 0.05, 0.35], [5.0, 0.09, 0.6], [9.2, 0.07, 0.45]];
const FLASHES = [0, 3.2, 5.0, 7.6];   // each lightning lands on its cut (a flash just after a cut shows the new shot a frame early)
for (const t of FLASHES) c.at(t, { fx: "flash", peak: 0.3, dur: 0.14, sound: false });   // the lightning lights the whole cabin
for (const t of FLASHES) { prop(t, "wall", { glow: 1 }, 0.04, "out"); prop(t + 0.1, "wall", { glow: 0.3 }, 0.06); prop(t + 0.18, "wall", { glow: 0.9 }, 0.04); prop(t + 0.24, "wall", { glow: 0 }, 0.3, "in"); }
for (const t of FLASHES) sfx(t + 0.05, "rumble", { gain: 0.5, dur: 1.2, reason: "thunder after the lightning in the window" });
sfx(0, "rumble", { gain: 0.32, dur: END - 0.05, reason: "the cabin's engine rumble bed" });
for (const [t, a] of BUMPS) { c.at(t, { fx: "shake", amp: t < 0.5 ? 0.03 : r3(a * 0.25), dur: 0.3 }); sfx(t, "thud-soft", { gain: 0.6, reason: "the plane bumps" }); }
// every sitter jolts with each bump (they sit on the plane, so they move with it a beat late)
for (const [t] of BUMPS.slice(0, 3)) for (const w of ["phx", "wiz", "rea"]) A(t + 0.03, w, "squash", { amount: w === "wiz" ? 0.09 : 0.04, dur: 0.2 });

// ---------------------------------------------------------------- everyone in place from frame 0
for (const w of ["phx", "wiz", "rea"]) A(0, w, "ride", { prop: `${w}C`, off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
A(0, "sam", "ride", { prop: "samC", off: [0, 0, 0], yaw: 0, dur: 0 });

// Phoenix: on the phone, from frame 0
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.45, dur: 0.01 });
act.blinksAt(c, "phx", [1.9, 4.7, 6.5]);
act.scrollPhone(c, "phx", [0.25, 1.15, 2.05, 3.0]);
prop(0, "phone", { glow: 1 }, 0.01);

// ---------------------------------------------------------------- 1 BUMP 0-1.5 (P1)
c.hitStop(0.1, 3);
// the Wizard yelps, the juice jumps out of his cup and lands back in; his free glove grabs the armrest
const cup = grips.mug(c, "wiz", P.cup, { side: "L", height: 0.6 });
cup.secure(0, 0);
A(0.02, "wiz", "talk", { line: "EEP!", dur: 0.35, tone: "excited" });
act.shock(c, 0.02, "wiz", { open: 0.5, hold: 1.2 });
A(0.02, "wiz", "look", { to: [-0.3, 0.6], dur: 0.1, blink: false });
c.cap(0.05, 1.2, "EEP!", 560, true, { x: 560 });
prop(0.1, "juice", { fill: 1, y: r3(CUP.y + 0.44) }, 0.24, "out");
A(0.09, "wiz", "hatwobble", { amount: 9, freq: 3, dur: 0.7 });
prop(0.34, "juice", { y: r3(CUP.y + 0.085) }, 0.22, "in");
prop(0.56, "juice", { fill: 0 }, 0.04);
sfx(0.58, "ai/drip", { gain: 0.5, reason: "plop: the juice lands back in the cup" });
const ARMREST = { world: [r3(PX + SEAT_W / 2 + 0.04), 0.86, 0.1] };   // the armrest between Phoenix and the Wizard
c.arm(0, "wiz", "R", ARMREST, 0.01);
A(0.2, "wiz", "grip", { side: "R", shape: "hold", dur: 0.1 });
// Reaper holds his tea steady and doesn't look
const mug = grips.mug(c, "rea", P.mug, { side: "R", height: 0.75 });
mug.secure(0, 0);
A(0, "rea", "look", { to: [0.1, -0.5], dur: 0, blink: false });
A(0, "rea", "expr", { expr: "kind", set: { curve: 0.05, eye: 0.85 }, dur: 0.01 });
A(0, "rea", "face", { lid: 0.42, dur: 0.01 });
const REA_LAP = { x: [0.24, 0.3, 0.3] };
c.arm(0, "rea", "L", REA_LAP, 0.01);
// the Samurai in the aisle with his tray, perfectly level
const trayAt = (t, S, dur, ease = "inOut") => { prop(t, "tray", S.tray, dur, ease); c.arm(t, "sam", "R", S.R, dur, ease); c.arm(t, "sam", "L", S.L, dur, ease); };
trayAt(0, S0, 0.01);
A(0, "sam", "grip", { side: "R", shape: "hold", dur: 0.01 }); A(0, "sam", "grip", { side: "L", shape: "hold", dur: 0.01 });
A(0, "sam", "look", { to: [-0.3, -0.2], dur: 0, blink: false });
A(0, "sam", "expr", { expr: "kind", set: { curve: 0.1 }, dur: 0.01 });
A(0, "sam", "noblink", { dur: 4.0 }); A(4.0, "sam", "blink", { dur: 0.22 });
see(0, 1.45, ["phx.face", "wiz.face", "rea.face", "sam.face", "phone", "cup"], "P1: the bump, the Wizard's yelp and juice, Phoenix scrolling");

// ---------------------------------------------------------------- 2 GRAB 1.5-3.2 (P2)
// another bump: the Wizard grabs Phoenix's arm and shakes it, gibbering
const PHX_ARM = (dy = 0) => ({ world: [r3(PX + 0.34), r3(0.75 + dy), r3(SZ + 0.4)] });
A(1.42, "wiz", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
prop(1.55, "wizC", { rot: -28 }, 0.25);   // a rider turns with its carrier
c.arm(1.6, "wiz", "R", PHX_ARM(), 0.2, "out");
A(1.75, "wiz", "grip", { side: "R", shape: "hold", dur: 0.08 });
for (const [i, t] of [1.95, 2.1, 2.25, 2.4].entries()) { c.arm(t, "wiz", "R", PHX_ARM(i % 2 ? -0.02 : 0.07), 0.15, "inOut"); prop(t + 0.03, "phxC", { y: i % 2 ? 0 : 0.035, x: r3(PX + (i % 2 ? -0.015 : 0.015)) }, 0.15, "inOut"); }
prop(2.55, "phxC", { y: 0, x: PX }, 0.12, "inOut");   // Phoenix (and his phone) get shaken; his thumb keeps scrolling
A(1.7, "wiz", "talk", { line: "wawawa-wa!", dur: 0.7, tone: "excited" });
c.cap(1.7, 2.5, "wawawa-WA!!", 560, true, { x: 560 });
// Phoenix, without looking, lifts the Wizard's glove off his arm with his free glove and sets it on the armrest
const GLOVE = (d = 0) => ({ world: [r3(PX + 0.36 + d), 0.66, r3(SZ + 0.36)] });
c.arm(2.48, "phx", "L", GLOVE(), 0.15, "out");
A(2.58, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.08 });
c.arm(2.62, "wiz", "R", ARMREST, 0.3, "inOut");
c.arm(2.62, "phx", "L", { world: [r3(ARMREST.world[0] - 0.02), 0.8, r3(ARMREST.world[2] + 0.12)] }, 0.3, "inOut");
c.arm(2.95, "phx", "L", PHONE_L, 0.25, "inOut");
sfx(2.7, "notify", { gain: 0.2 });
A(2.72, "phx", "expr", { expr: "kind", set: { curve: 0.32, eye: 0.95 }, dur: 0.2 });   // a tiny smile, eyes still on the screen
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.25 });
// Reaper side-eyes the Wizard
A(2.0, "rea", "look", { to: [-0.8, 0.0], dur: 0.15, blink: false });
act.mood(c, 2.0, "rea", "annoyed", { hold: 0.6, strength: 0.6 });
A(2.95, "rea", "look", { to: [0.1, -0.5], dur: 0.2, blink: false });
prop(2.75, "wizC", { rot: 0 }, 0.3);
see(1.6, 3.15, ["phx.face", "wiz.face", "rea.face", "phone"], "P2: the Wizard shakes Phoenix's arm; Phoenix lifts his glove off; Reaper's side-eye");

// ---------------------------------------------------------------- 3 MASKS 3.2-5.0 (P3)
prop(3.27, "bins", { open: 1 }, 0.1, "out");
sfx(3.27, "kenney/switch", { gain: 0.6, reason: "the mask doors pop open" });
c.hitStop(3.3, 3);
const MASK_HANG = (x) => ({ x: r3(x + 0.02), y: 1.32, z: 0.85 });
for (const [id, x, d] of [["maskP", PX + 0.34, 0], ["maskW", WX, 0.04], ["maskR", RX, 0.07]]) {
  const h = MASK_HANG(x);
  prop(3.3 + d, id, { y: r3(h.y - 0.07), z: h.z, x: h.x }, 0.22, "in");
  prop(3.52 + d, id, { y: h.y }, 0.3, "settle");
  sfx(3.4 + d, "kenney/drop-leather", { gain: 0.45, reason: "a mask drops on its hose" });
}
A(3.3, "wiz", "look", { to: [0, 0.8], dur: 0.08, blink: false });
act.shock(c, 3.32, "wiz", { open: 0.55, hold: 1.0 });
A(3.4, "wiz", "talk", { line: "ah-ah-ah!", dur: 0.6, tone: "excited" });
c.cap(3.4, 4.2, "AH-AH-AH!!", 520, true, { x: 560 });
// the Wizard gets it wrong: he grabs his mask and clamps it to his ear like a phone, and unbuckles in a panic
const WIZ_EAR = { x: [-0.42, 0.66, 0.1] };
c.arm(3.6, "wiz", "R", { prop: "maskW", grip: [0, -0.03, -0.03] }, 0.2, "out");
A(3.78, "wiz", "grab", { prop: "maskW", hand: "R", grip: [0, -0.03, -0.03], dur: 0, pose: null });
c.arm(3.85, "wiz", "R", WIZ_EAR, 0.3, "out");
cup.carry(3.6, [r3(CUP.x + 0.06), 0.45, r3(CUP.z - 0.06)], 0.2);
cup.release(3.82, { rest: false });
c.arm(3.95, "wiz", "L", { world: [r3(WX + 0.03), 0.5, r3(SZ + 0.34)] }, 0.2, "out");
prop(4.15, "beltW", { open: 1 }, 0.25, "out");
sfx(4.15, "kenney/switch", { gain: 0.5, reason: "the Wizard's belt buckle clicks open" });
c.arm(4.3, "wiz", "L", { x: [0.3, 0.45, 0.3] }, 0.3, "inOut");
// Reaper puts his on properly and calmly, then slowly looks at the Wizard
const REA_MOUTH = { x: r3(RX), y: 0.83, z: r3(SZ + 0.5) };
A(3.55, "rea", "look", { to: [0.0, 0.3], dur: 0.2, blink: false });
c.arm(3.7, "rea", "L", { prop: "maskR", grip: [0, -0.03, -0.03] }, 0.35, "inOut");
A(4.02, "rea", "grab", { prop: "maskR", hand: "L", grip: [0, -0.03, -0.03], dur: 0, pose: null });
c.arm(4.1, "rea", "L", { world: [REA_MOUTH.x + 0.05, REA_MOUTH.y - 0.03, REA_MOUTH.z - 0.03] }, 0.4, "inOut");
A(4.55, "rea", "release", { prop: "maskR", dur: 0 });
prop(4.55, "maskR", REA_MOUTH, 0.06);
c.arm(4.6, "rea", "L", REA_LAP, 0.35, "inOut");
A(4.6, "rea", "look", { to: [-0.8, 0.3], dur: 0.35, blink: false });
// Phoenix loops his mask's elastic round the phone and lets it hang at his chest; he scrolls on with one finger
const PH_HANG = { x: r3(PX + 0.04), y: 0.72, z: 0.7 }, CUP_P = { x: r3(PX + 0.27), y: 0.78, z: 0.7 };
c.arm(3.55, "phx", "R", { world: [PH_HANG.x - 0.07, PH_HANG.y, PH_HANG.z - 0.04] }, 0.35, "inOut");
c.arm(3.55, "phx", "L", { world: [PH_HANG.x + 0.07, PH_HANG.y, PH_HANG.z - 0.04] }, 0.35, "inOut");
prop(3.55, "maskP", CUP_P, 0.35, "inOut");
A(3.95, "phx", "release", { prop: "phone", dur: 0 });
prop(3.95, "phone", { ...PH_HANG, tip: -32 }, 0.22, "out");
const PHX_LAP = { x: [0.24, 0.3, 0.3] }, PHX_LAP_R = { x: [-0.24, 0.3, 0.3] };
c.arm(4.02, "phx", "L", PHX_LAP, 0.35, "inOut");
const POKE = (d = 0) => ({ world: [r3(PH_HANG.x - 0.05), r3(PH_HANG.y - 0.17 + d), r3(PH_HANG.z - 0.08)] });   // scrolling from below the phone, clear of his face
c.arm(4.02, "phx", "R", POKE(), 0.25, "inOut");
A(4.02, "phx", "grip", { side: "R", shape: "point", dur: 0.15 });
const scrollFinger = (times) => { for (const t of times) { c.arm(t, "phx", "R", POKE(0.03), 0.1, "out"); c.arm(t + 0.12, "phx", "R", POKE(), 0.12, "inOut"); } };
scrollFinger([4.5, 5.4, 6.3, 7.1]);
A(3.6, "phx", "look", { to: [0.0, -0.7], dur: 0.25, blink: false });
see(3.35, 4.95, ["phx.face", "wiz.face", "rea.face", "maskP", "maskW", "phone"], "P3: masks drop; the Wizard's goes to his ear; Phoenix hangs his phone on his mask");

// ---------------------------------------------------------------- 4 ZERO-G 5.0-7.0 (P4)
// the big drop: everything lifts. The Wizard, unbuckled, floats up and slowly tumbles upside down over Phoenix's phone
// (a pitch turns him about his middle; the yaw turns his face back to us once he is over)
const WIZ_PEAK = { x: -0.35, y: 0.8, z: 0.8 };            // the carrier: his middle 0.8 m above it
prop(5.05, "wizC", { y: 0.4, z: r3(SZ + 0.4) }, 0.75, "out");
prop(5.8, "wizC", WIZ_PEAK, 1.4, "inOut");
A(5.05, "wiz", "ride", { prop: "wizC", off: [0, SEAT, 0], yaw: 0, sit: false, dur: 0.5, ease: "out" });
A(5.8, "wiz", "pitch", { to: 180, dur: 1.4, ease: "inOut" });
prop(5.8, "wizC", { rot: 158 }, 1.4);   // the pitch turns his face away; half a turn brings it back to us
act.shock(c, 5.05, "wiz", { open: 0.6, eye: 1.35, hold: 3.0 });
A(5.05, "wiz", "talk", { line: "wuh-whoa-whoa!", dur: 0.9, tone: "excited" });
c.cap(5.05, 6.0, "WHOA-WHOA!!", 520, true, { x: 560 });
c.arm(5.1, "wiz", "L", { o: [0.32, 0.72, 0.12] }, 0.35, "out");
c.arm(6.2, "wiz", "L", { o: [0.1, -0.22, 0.2] }, 0.6, "inOut");   // once he is upside down his free arm points up the screen, clear of Phoenix
// Reaper and Phoenix are belted: they rise only a little against the belts; Reaper's tea lifts out as a blob
prop(5.05, "reaC", { y: 0.05 }, 0.5, "out"); prop(5.05, "phxC", { y: 0.05 }, 0.5, "out");
prop(5.05, "phone", { y: r3(PH_HANG.y + 0.06) }, 0.5, "out"); prop(5.05, "maskP", { y: r3(CUP_P.y + 0.06) }, 0.5, "out");
prop(5.05, "maskR", { y: r3(REA_MOUTH.y + 0.05) }, 0.5, "out");
A(5.1, "rea", "look", { to: [-0.2, -0.1], dur: 0.15, blink: false });
prop(5.25, "tea", { fill: 1, y: r3(MUG.y + 0.05 + 0.22) }, 0.7, "out");
mug.carry(5.4, [MUG.x, r3(MUG.y + 0.1), MUG.z], 0.6);    // he holds the cup under it, calm
sfx(5.25, "gulp", { gain: 0.35, reason: "glk: the tea lifts out of the mug as a blob" });
prop(5.25, "tea", { wobble: 1 }, 0.3);
// the Samurai floats up and lies flat along the aisle, tray level, and offers it to the row
const SAM_UP = [1.98, 1.0, -0.7], S_UP = samFrame(SAM_UP, 0);
prop(5.05, "samC", { x: SAM_UP[0], y: SAM_UP[1], z: SAM_UP[2] }, 1.2, "inOut");
A(5.1, "sam", "lean", { to: -8, dur: 1.2, ease: "inOut" });
trayAt(5.05, S_UP, 1.2);
A(5.9, "sam", "look", { to: [-0.6, 0.0], dur: 0.2, blink: false });
A(6.2, "sam", "talk", { line: "drinks?", dur: 0.5, tone: "calm" });
c.cap(6.2, 6.95, "drinks?", 470, true, { x: 760 });
// the pillow and the magazine float past
prop(5.1, "pillow", { scale: 1 }, 0.01);
prop(5.1, "pillow", { x: 1.0, y: 2.05, z: 0.6, rot: 120 }, 4.1, "linear");
prop(5.1, "mag", { y: 1.05, x: 0.5, z: 1.35, rot: 160, tilt: 30 }, 4.1, "out");
sfx(5.3, "flutter", { gain: 0.35, reason: "the magazine's pages flap as it floats up" });
see(5.1, 6.95, ["phx.face", "wiz", "rea.face", "sam.face", "tea", "phone"], "P4: zero-g: the Wizard floats and turns over, the tea blob, the Samurai flat with his tray");

// ---------------------------------------------------------------- 5 PEAK 7.0-8.0 (P5)
A(7.0, "wiz", "look", { to: [0.4, -0.4], dur: 0.2, blink: false });
A(7.0, "phx", "noblink", { dur: 1.0 });
c.arm(7.1, "wiz", "L", { x: [0.36, 0.52, 0.26] }, 0.25, "inOut");   // his free glove cupped beside his mouth, off his eyes
A(7.3, "wiz", "talk", { line: "psst! psst!", dur: 0.5, tone: "excited" });
c.cap(7.3, 7.95, "psst! PSST!", 420, true, { x: 300 });   // in the ceiling above Phoenix, under the title band
for (const w of ["wiz", "rea", "sam"]) A(7.8, w, "noblink", { dur: 1.4 });
see(7.05, 7.95, ["phx.face", "wiz.face", "phone"], "P5: the upside-down Wizard's face right over the phone");

// ---------------------------------------------------------------- 6 LOOK-UP 8.0-9.0 (P6-P7, the series ending)
c.arm(7.85, "phx", "R", PHX_LAP_R, 0.2, "inOut");
A(7.85, "phx", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(8.05, "phx", "look", { to: [0.45, 0.6], dur: 0.12, blink: false });
A(8.05, "phx", "face", { lid: 0.15, dur: 0.12 });
A(8.05, "phx", "pitch", { to: -6, dur: 0.15 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.cap(8.5, 9.0, "huh.", 500, false, { x: 170 });   // over his head: the lower third is full of bodies here
see(8.1, 8.95, ["phx.face", "wiz.face"], "P7: Phoenix looks up at the upside-down Wizard: huh.");

// ---------------------------------------------------------------- 7 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: [0.0, -0.7], dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.45, dur: 0.15 });
A(9.0, "phx", "pitch", { to: 0, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.2 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
c.arm(9.3, "phx", "R", POKE(), 0.2, "inOut");
A(9.3, "phx", "grip", { side: "R", shape: "point", dur: 0.15 });
scrollFinger([9.65]);
// the plane levels out: everyone drops back into place at once
const T_LAND = 9.42, DROP = T_LAND - 9.2;
A(9.2, "wiz", "pitch", { to: 0, dur: DROP, ease: "in" });
// he flips back upright facing the row behind (the hat swings out over the aisle, clear of everyone), then spins round in his seat
prop(9.2, "wizC", { x: WX, z: SZ }, DROP, "out"); prop(9.2, "wizC", { y: 0 }, DROP, "in");   // over to his seat first, then down (clear of Phoenix's mask)
A(9.2, "wiz", "ride", { prop: "wizC", off: [0, SEAT, 0], yaw: 0, sit: true, dur: DROP, ease: "in" });
prop(9.2, "samC", { x: SAM.x, y: 0, z: SAM.z }, DROP, "in");
A(9.2, "sam", "lean", { to: 0, dur: DROP, ease: "in" });
trayAt(9.2, S0, DROP, "in");
prop(9.2, "reaC", { y: 0 }, DROP, "in"); prop(9.2, "phxC", { y: 0 }, DROP, "in");
prop(9.2, "phone", { y: PH_HANG.y }, DROP, "in"); prop(9.2, "maskP", { y: CUP_P.y }, DROP, "in");
prop(9.2, "maskR", { y: REA_MOUTH.y }, DROP, "in");
prop(9.2, "tea", { y: r3(MUG.y + 0.1 + 0.07), wobble: 0 }, DROP, "in"); prop(T_LAND, "tea", { fill: 0 }, 0.04);
prop(9.2, "pillow", { y: 0.2, x: 0.5, z: 1.2 }, DROP, "in");
prop(9.2, "mag", { y: 0.03, tilt: 0 }, DROP, "in");
c.hitStop(T_LAND, 3);
sfx(T_LAND, "ai/cushion-poof", { gain: 0.7, reason: "everyone lands back in their seats" });
sfx(T_LAND + 0.02, "pan-bonk", { gain: 0.35, reason: "bonk: the Wizard's landing" });
sfx(T_LAND + 0.03, "ai/drip", { gain: 0.45, reason: "plop: the tea blob drops back into the mug" });
for (const w of ["wiz", "rea", "phx"]) A(T_LAND, w, "squash", { amount: w === "wiz" ? 0.12 : 0.05, dur: 0.22 });
A(T_LAND, "wiz", "hatwobble", { amount: 8, freq: 3, dur: 0.6 });
mug.carry(9.2, [MUG.x, MUG.y, MUG.z], DROP, "in");
// the Wizard: the mask clamped over his mouth now, glaring at Phoenix; Reaper slips his mask down and sips
const WIZ_MOUTH = { x: [-0.14, 0.4, 0.42] };
c.arm(T_LAND + 0.02, "wiz", "R", WIZ_MOUTH, 0.18, "out");
c.arm(T_LAND, "wiz", "L", { x: [0.22, 0.3, 0.3] }, 0.2, "out");
A(T_LAND + 0.1, "wiz", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
prop(T_LAND + 0.04, "wizC", { rot: -22 }, 0.26, "out");   // he spins round to glare at Phoenix
act.mood(c, T_LAND + 0.15, "wiz", "angry", { hold: 0.4 });
A(T_LAND + 0.05, "rea", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
prop(T_LAND + 0.05, "maskR", { y: 0.62, z: r3(REA_MOUTH.z + 0.06) }, 0.15, "out");   // it drops to his chest
mug.carry(T_LAND + 0.15, [r3(MUG.x + 0.04), 0.8, r3(MUG.z - 0.02)], 0.25);
A(T_LAND + 0.3, "rea", "face", { lid: 0.7, dur: 0.2 });
A(9.6, "sam", "look", { to: [-0.6, -0.2], dur: 0.15, blink: false });
see(T_LAND + 0.05, 9.98, ["phx.face", "wiz.face", "rea.face", "sam", "tray", "phone"], "P8: back in the seats: the Wizard glares through his mask, Reaper sips, the tray level");

// ---------------------------------------------------------------- shots (from the row in front, front-left)
const shot = (pos, look, fov = 50, o = {}) => ({ pos, look, fov, ...o });
const HAND = { rate: 0, bob: 0, sway: 0, drift: 0, dips: BUMPS.map(([t, a, d]) => [t, a, d]) };
const WIDE = shot([-0.1, 1.38, 5.65], [0.28, 1.12, 0], 55, { hand: HAND });
const MASKS = shot([-0.2, 1.36, 4.7], [-0.12, 1.16, 0], 56, { hand: HAND });
const ZEROG = shot([-0.1, 2.0, 5.9], [0.3, 1.35, 0], 58, { hand: HAND });
const PEAK = { ...shot([-1.42, 1.28, 4.75], [-0.66, 1.2, 0.4], 44, { hand: HAND }), to: { pos: [-1.36, 1.26, 4.45] }, dur: 2.0 };   // a slow push into the series' LOOK-UP framing
const BACKDOWN = shot([-0.15, 1.4, 5.75], [0.28, 1.1, 0], 55, { hand: HAND });
const beats = c.beats([
  ["P1 bump", 0, WIDE, "hook"],
  ["P2 grab", 1.5, "keep"],
  ["P3 masks", 3.2, MASKS],
  ["P4 zero-g", 5.0, ZEROG],
  ["P5 peak", 7.0, PEAK],
  ["P6 look-up", 8.0, "keep", "payoff"],
  ["P8 back down", 9.2, BACKDOWN, "reaction"],
], END);

write(import.meta.url, {
  id: "never-looks-up-plane",
  title: "The friend who never looks up from his phone… even in heavy turbulence",
  idea: "Never Looks Up ep 2: a stormy night flight bucks, the masks drop and a big drop floats everyone; Phoenix hangs his phone on his mask and scrolls on until the Wizard floats upside down over the phone: huh. The plane levels and drops them all back",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 8.5,
  set: { type: "plain", night: true, color: "#2a2840", floor: "#3b3f5a", para: 0, bloom: "emissive", aperture: 0, focus: false,
    plate: { src: PLATE, z: -3.2, center: [0.3, 0.87], height: 10, depth: false, motion: false, dust: 0 } },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } },
  music: { style: "warm", bpm: 96, lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 8.0, part: "hush" }, { at: 9.15, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "carpet", room: "box", flaps: false, signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "rea", "sam", "phone", "cup"], hint: 0, what: "the plane jolts, lightning flashes and the Wizard's juice jumps out of his cup while Phoenix scrolls" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "seatP", from: 0, to: AFTER, reason: "Phoenix sits in the window seat (his back and folded wings against its back)" },
    { who: "wiz", with: "seatW", from: 0, to: AFTER, reason: "the Wizard sits in the middle seat, floats off it and lands back in it" },
    { who: "rea", with: "seatR", from: 0, to: AFTER, reason: "Reaper sits in the aisle seat" },
    { who: "phx", with: "beltP", from: 0, to: AFTER, reason: "Phoenix's lap belt is across his belly" },
    { who: "wiz", with: "beltW", from: 0, to: AFTER, reason: "the Wizard's lap belt is across his belly until he unbuckles, then hangs by the seat he lands in" },
    { who: "rea", with: "beltR", from: 0, to: AFTER, reason: "Reaper's lap belt is across his belly" },
    { who: "wiz", with: "phx", from: 1.6, to: 2.95, reason: "the Wizard grabs Phoenix's arm and Phoenix lifts his glove off" },
    { who: "rea", with: "maskR", from: 3.55, to: AFTER, reason: "Reaper wears his mask over his mouth, then lets it drop to his chest" },
    { who: "wiz", with: "maskW", from: 3.7, to: AFTER, reason: "the Wizard clamps his mask to his ear, then over his mouth" },
    { who: "phx", with: "maskP", from: 3.4, to: AFTER, reason: "Phoenix's mask hangs in front of him with the phone on its elastic" },
    { who: "wiz", with: "cup", from: 0, to: 4.0, reason: "the Wizard holds his juice in his lap" },
    { who: "rea", with: "mug", from: 0, to: AFTER, reason: "Reaper holds his tea" },
    { who: "sam", with: "tray", from: 0, to: AFTER, reason: "the Samurai carries his tray" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep2-plane.mjs. Panels: PANELS-ep2-plane.md. Title added in TikTok's text tool.",
});
