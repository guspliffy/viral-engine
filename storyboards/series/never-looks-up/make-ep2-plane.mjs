// NEVER LOOKS UP, episode 2: TURBULENCE (5 Nov 2026). "The friend who never looks up from his phone… even in heavy
// turbulence". Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip
// (02-plane-turbulence/); series format 00-SERIES-FORMAT.md; panel notes PANELS-ep2-plane.md next to this file. The
// panels are the target.
//
// THE BRIEF
//   Joke:        a stormy night flight bucks, the bins burst open, bags fly, the masks drop and a big drop sends
//                everything floating while everyone panics; Phoenix keeps scrolling, the phone in both gloves.
//   Jonny 5 Nov (on draft 1): more drama (baggage and stuff flying, everyone in panic), and the phone always in his
//                gloves (it hung on the mask's elastic and read as floating above his hands).
//   Wants:       the Wizard wants Phoenix to notice; Reaper wants his tea; the Samurai wants to serve drinks.
//   Consequence: the Wizard floats upside down right over the phone and gets one flat "huh.".
//   Ending:      the plane levels out at that moment and drops everyone back into their seats; the Wizard glares at
//                Phoenix through his mask while Reaper sips.
//   Callback:    the opening's bump that made the Wizard grab Phoenix ends with the bump that drops the Wizard back
//                beside him, mask on, while Phoenix scrolls on.
//   Jonny 7 Nov (v3): "add a scene ... and show the plane in free fall from the outside so it underlines the situation,
//                now the danger doesn't come through enough". The cabin stays as it was (v2, merged in #107); at the big
//                drop (5.0 s) the clip cuts outside for 1.5 s: the airliner tips nose-down and drops through the storm,
//                lightning beside it, clouds and rain rushing up past; then back inside as everything floats. Every cabin
//                moment from 5.0 s on plays 1.5 s later (shifted below), so nothing in the cabin changes.
//
//   Jonny 7 Nov (v4): "cut in a plane scene where the plane has turbulence right at the beginning when the first bag drops on
//                the ground then let the safety masks drop and show the plane flying down. and the character look still way
//                to chill there is no panic". A 1 s outside shot of the plane bucking at 0.32 (CUTS below), and the friends
//                panic for real: the terrified face, trembling and sweat from frame 0 to the landing.
//
//   node storyboards/series/never-looks-up/make-ep2-plane.mjs
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const FACES = "strong", MOTION = "natural";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
// two cuts outside (v4): the plane bucking in the storm as the first bag hits the floor, and the plane dropping at the
// big drop. Each is [the v2 cabin time it cuts in at, its length]; the cabin pauses while we are outside.
const CUTS = [[0.32, 1.0], [5.0, 1.5]];
const T = (t) => r3(t + CUTS.reduce((s, [at, len]) => s + (t >= at - 1e-6 ? len : 0), 0));   // a cabin time from v2 -> its time now
const INS = CUTS[1][1], INS_T = CUTS[0][1];
const END = r3(10.0 + INS + INS_T), AFTER = END + 0.5;      // allowClip windows run to the video's end (hit-stops add frames)
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
  { id: "bins", kind: "overhead", x: -0.05, y: OH_Y, z: 0, w: 3.4, color: "#a89f93", panel: "#9d958a", doors: [PX - 0.3 + 0.11, WX + 0.11, RX + 0.11].map(r3), sign: 0.5, lit: 1, open: 0, lid: 0.25, lidOrder: [3, 1, 0, 2] },   // lid 0.25: the bin over the Wizard's right bursts open, 0.5: Reaper's, 1: all
  { id: "maskP", kind: "oxymask", ...MASK_UP(PX - 0.3), anchor: anchor(PX, -0.3) },   // on the window side: it dangles beside his face, clear of the Wizard's float
  { id: "maskW", kind: "oxymask", ...MASK_UP(WX), anchor: anchor(WX) },
  { id: "maskR", kind: "oxymask", ...MASK_UP(RX), anchor: anchor(RX) },
  { id: "phone", kind: "phone", x: PX, y: 0.9, z: 0.5, rot: 180, tip: -28, scale: 1.9, case: "#29c3d8", bright: 2.2, halo: 0.26, haloK: 0.49 },   // the screen shines in his face (Jonny 5 Nov; ep 5's setting, haloK under 0.5 so the contact check treats the glow as light, not a solid)   // a bright cyan case: it reads against the dark gloves and the orange body
  { id: "cup", kind: "papercup", ...grips.placeFor("papercup", [CUP.x, CUP.y, CUP.z], 0), straws: 0, stripe: "#e0802a" },
  { id: "juice", kind: "blob", x: CUP.x, y: r3(CUP.y + 0.085), z: CUP.z, color: "#f59a1f", r: 0.034, fill: 0 },
  { id: "mug", kind: "teamug", steam: 0.6, ...grips.placeFor("teamug", [MUG.x, MUG.y, MUG.z], 0) },
  { id: "tea", kind: "blob", x: MUG.x, y: r3(MUG.y + 0.07), z: MUG.z, color: "#7a4316", r: 0.04, fill: 0 },
  { id: "tray", kind: "drinktray", ...S0.tray, rot: SAM.yaw },
  { id: "front", kind: "rowback", x: 0, y: -1.0, z: 2.3, n: 3, gap: 1.06, scale: 1 },
  { id: "front2", kind: "rowback", x: 0, y: -0.95, z: 3.4, n: 3, gap: 1.06, scale: 1 },
  { id: "pillow", kind: "pillow", x: 0.75, y: 0.8, z: 1.1, rot: 20, scale: 0.0001 },
  { id: "mag", kind: "magazine", x: 0.55, y: 0.03, z: 1.15, rot: 30, tilt: 0 },
  // the baggage: in the bins until they burst open (a bin is 0.42 high, its front at z 0.3; the lids open up and out)
  { id: "duf", kind: "duffel", x: 0.42, y: 1.7, z: 0.85, tilt: -60, color: "#3a8f6a" },   // frame 0: already falling out of its burst bin
  { id: "case", kind: "suitcase", x: 1.225, y: 2.6, z: -0.08, tip: 90, color: "#d2433a" },
  { id: "pack", kind: "backpack", x: -0.475, y: 2.68, z: -0.1, tip: 90, color: "#e6b43a" },
  { id: "case2", kind: "suitcase", x: -1.325, y: 2.6, z: -0.08, tip: 90, color: "#d9579b", rib: "#a83f76" },   // in the bin over Phoenix
  { id: "mag2", kind: "magazine", x: -0.95, y: 0.03, z: 1.7, rot: -20, tilt: 0 },   // on the floor under the row in front, out of sight until it floats
  { id: "pillow2", kind: "pillow", x: -0.35, y: 0.1, z: 1.75, rot: -30 },
  { id: "shoe", kind: "sneaker", x: 0.4, y: 0.06, z: 1.05, rot: -30, color: "#3d6fd8" },
  // invisible carriers: the bodies float on these (a float is a path, not a walk)
  { id: "phxC", kind: "carrier", x: PX, y: 0, z: SZ },
  { id: "wizC", kind: "carrier", x: WX, y: 0, z: SZ },
  { id: "reaC", kind: "carrier", x: RX, y: 0, z: SZ },
  { id: "samC", kind: "carrier", x: SAM.x, y: 0, z: SAM.z },
];
const P = Object.fromEntries(props.map((p) => [p.id, p]));

// ---------------------------------------------------------------- the plane: bumps, lightning, the rumble
const BUMPS = [[0.06, 0.06, 0.4], [1.55, 0.045, 0.35], [2.45, 0.04, 0.3], [3.27, 0.05, 0.35], [5.0, 0.09, 0.6], [9.2, 0.07, 0.45]];
const FLASHES = [0.08, 2.45, 3.2, 5.0, 7.6];   // (2.45, review B v4: lightning in the cabin too, on the second bin)   // the lightning (frame 0 stays clean; the others land on their cuts)
for (const t of FLASHES) c.at(t, { fx: "flash", peak: 0.18, dur: 0.08, sound: false });   // the lightning lights the whole cabin
for (const t of FLASHES) { prop(t, "wall", { glow: 1 }, 0.04, "out"); prop(t + 0.1, "wall", { glow: 0.3 }, 0.06); prop(t + 0.18, "wall", { glow: 0.9 }, 0.04); prop(t + 0.24, "wall", { glow: 0 }, 0.3, "in"); }
for (const t of FLASHES) sfx(t + 0.05, "rumble", { gain: 0.5, dur: 1.2, reason: "thunder after the lightning in the window" });
sfx(0, "rumble", { gain: 0.32, dur: END - 0.05, reason: "the cabin's engine rumble bed" });
sfx(0, "kenney/impact-plank-medium", { gain: 0.7, reason: "frame 0 (video rule B2: an impact at 0.0 s): the bin lid bangs open as the holdall drops out" });
for (const [t, a] of BUMPS) { c.at(t, { fx: "shake", amp: t < 0.5 ? 0.05 : r3(a * 0.5), dur: 0.3 }); sfx(t, "thud-soft", { gain: 0.6, reason: "the plane bumps" }); }
// every sitter jolts with each bump (they sit on the plane, so they move with it a beat late)
for (const [t] of BUMPS.slice(0, 4).filter(([t]) => t !== 2.45)) for (const w of ["phx", "wiz", "rea"]) A(t + 0.03, w, "squash", { amount: w === "wiz" ? 0.09 : 0.04, dur: 0.2 });

// ---------------------------------------------------------------- everyone in place from frame 0
for (const w of ["phx", "wiz", "rea"]) A(0, w, "ride", { prop: `${w}C`, off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
A(0, "sam", "ride", { prop: "samC", off: [0, 0, 0], yaw: 0, dur: 0 });

// PANIC (Jonny 7 Nov on v3: "the character look still way to chill, there is no panic in the plane"): the friends
// don't freeze in a shocked "o" any more. A panic is the terrified face (brows shot up, pin-prick pupils, a wide yell),
// the body trembling the whole time it lasts, and sweat flicking off the head.
// (the trembling runs from frame 0 to the landing, added once the cabin times are final: see "make room" below; the
// yells open the wide mouth further: talk amp)
function panic(t, who, { hold = 1.0, dur = 0.25, sweat = true, set } = {}) {
  A(t, who, "expr", { expr: "terrified", ...(set && { set }), dur });
  A(t, who, "face", { brow: 0.5, lid: 0, corner: -0.6, dur });
  if (sweat) c.at(r3(t + 0.08), { fx: "sweat", who, dur: 0.7, count: 4 });
}
const YELL = 1.6;   // a panicked line's mouth opens this much wider than talk

// Phoenix: on the phone, from frame 0
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0 });
A(0, "phx", "face", { lid: 0.45, dur: 0 });
act.blinksAt(c, "phx", [1.9, 4.7, 6.5]);
act.scrollPhone(c, "phx", [0.25, 1.15, 2.05, 3.0, 3.9, 4.8, 5.7, 6.5, 7.3, 9.5]);   // his thumb never stops
prop(0, "phone", { glow: 1 }, 0);

// ---------------------------------------------------------------- 1 BUMP 0-1.5 (P1)
c.hitStop(0.1, 3);
// the Wizard yelps, the juice jumps out of his cup and lands back in; his free glove grabs the armrest
const cup = grips.mug(c, "wiz", P.cup, { side: "L", height: 0.6 });
cup.secure(0, 0);
A(0.02, "wiz", "talk", { line: "EEP!", amp: YELL, dur: 0.35, tone: "excited" });
panic(0, "wiz", { hold: 1.2, dur: 0 });   // frame 0: already terrified
A(0.02, "wiz", "look", { to: [-0.3, 0.6], dur: 0.1, blink: false });
c.cap(0.05, 1.2, "EEP!", 560, true, { x: 560 });
prop(0.1, "juice", { fill: 1, y: r3(CUP.y + 0.44) }, 0.24, "out");
A(0.09, "wiz", "hatwobble", { amount: 9, freq: 3, dur: 1.3 });
prop(0.34, "juice", { y: r3(CUP.y + 0.085) }, 0.22, "in");
prop(0.56, "juice", { fill: 0 }, 0.04);
sfx(0.58, "ai/drip", { gain: 0.5, reason: "plop: the juice lands back in the cup" });
const ARMREST = { world: [r3(PX + SEAT_W / 2 + 0.04), 0.86, 0.1] };   // the armrest between Phoenix and the Wizard
c.arm(0, "wiz", "R", ARMREST, 0);
A(0.2, "wiz", "grip", { side: "R", shape: "hold", dur: 0.1 });
// Reaper holds his tea steady and doesn't look
const mug = grips.mug(c, "rea", P.mug, { side: "R", height: 0.75 });
mug.secure(0, 0);
A(0, "rea", "look", { to: [0.1, -0.5], dur: 0, blink: false });
const REA_LAP = { x: [0.24, 0.3, 0.3] };
c.arm(0, "rea", "L", REA_LAP, 0);
// the Samurai in the aisle with his tray, perfectly level
const trayAt = (t, S, dur, ease = "inOut") => { prop(t, "tray", S.tray, dur, ease); c.arm(t, "sam", "R", S.R, dur, ease); c.arm(t, "sam", "L", S.L, dur, ease); };
trayAt(0, S0, 0);
A(0, "sam", "grip", { side: "R", shape: "hold", dur: 0.01 }); A(0, "sam", "grip", { side: "L", shape: "hold", dur: 0.01 });
A(0, "sam", "look", { to: [-0.3, -0.2], dur: 0, blink: false });
A(0, "sam", "noblink", { dur: 4.0 }); A(4.0, "sam", "blink", { dur: 0.22 });
// everyone else panics from the first bump: the bins rattle, Reaper's tea jumps, the Samurai staggers with his tray
prop(0, "duf", { x: 0.5, z: 1.25, rot: 25 }, 0.28, "out"); prop(0, "duf", { y: 0.13, tilt: -180 }, 0.28, "in");
prop(0.28, "duf", { y: 0.19 }, 0.07, "out"); prop(0.35, "duf", { y: 0.13 }, 0.09, "in");
sfx(0.28, "thud", { gain: 0.6, reason: "the holdall hits the floor" });
panic(0, "rea", { hold: 0.9, dur: 0 });   // frame 0: already scared
prop(0.12, "tea", { fill: 0.8, y: r3(MUG.y + 0.3) }, 0.22, "out");
prop(0.34, "tea", { y: r3(MUG.y + 0.07) }, 0.2, "in"); prop(0.54, "tea", { fill: 0 }, 0.04);
sfx(0.56, "ai/drip", { gain: 0.4, reason: "plop: Reaper's tea lands back in his mug" });
A(0.05, "sam", "lean", { to: -7, dur: 0.15, ease: "out" }); A(0.3, "sam", "lean", { to: 0, dur: 0.35 });
panic(0, "sam", { hold: 0.8, dur: 0 });
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
A(1.7, "wiz", "talk", { line: "wawawa-wa!", amp: YELL, dur: 0.7, tone: "excited" });
c.cap(1.7, 2.5, "wawawa-WA!!", 560, true, { x: 430 });
// the bin over the Wizard's right bursts open on the bump and a holdall drops out past him onto the floor
prop(1.55, "bins", { lid: 0.5 }, 0.12, "out");
sfx(1.56, "kenney/impact-plank-medium", { gain: 0.5, reason: "the bin lid bangs open" });
prop(1.6, "pack", { z: 0.45, y: 2.62 }, 0.1, "in");   // a backpack tumbles out of it
prop(1.7, "pack", { x: -0.4, z: 1.25, rot: -40 }, 0.3, "out"); prop(1.7, "pack", { y: 0.19, tip: 0 }, 0.3, "in");
prop(2.0, "pack", { y: 0.24 }, 0.06, "out"); prop(2.06, "pack", { y: 0.19 }, 0.08, "in");
sfx(2.0, "kenney/drop-leather", { gain: 0.6, reason: "flop: the backpack lands on the floor" });
// the next bin bursts too: the suitcase slides out and slams down in front of Reaper; the Wizard lets go of Phoenix
prop(2.45, "bins", { lid: 0.75 }, 0.12, "out");
sfx(2.46, "kenney/impact-plank-medium", { gain: 0.5, reason: "the second bin lid bangs open" });
prop(2.5, "case", { z: 0.45, y: 2.58 }, 0.12, "in");
prop(2.62, "case", { x: 1.5, z: 1.2, rot: 30, tilt: 10 }, 0.3, "out"); prop(2.62, "case", { y: 0.13 }, 0.3, "in");
prop(2.92, "case", { y: 0.2, tilt: 4 }, 0.07, "out"); prop(2.99, "case", { y: 0.13, tilt: 0 }, 0.1, "in");
sfx(2.92, "kenney/impact-punch-heavy", { gain: 0.95, reason: "wham: the suitcase slams onto the floor" });
sfx(2.92, "kenney/impact-plank-medium", { gain: 0.6, reason: "the hard shell clacks on the floor (mids for a phone speaker)" });
c.at(2.92, { fx: "shake", amp: 0.012, dur: 0.2 });
A(2.6, "wiz", "look", { to: [0.4, 0.9], dur: 0.1, blink: false });
A(2.58, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.08 });
c.arm(2.6, "wiz", "R", { world: [-0.6, 1.02, 0.62] }, 0.12, "out");   // he snatches his glove up off Phoenix (over the armrest), then into his lap
c.arm(2.72, "wiz", "R", { x: [-0.24, 0.32, 0.3] }, 0.25, "inOut");
A(2.78, "wiz", "look", { to: [0.5, -0.5], dur: 0.12, blink: false });
sfx(2.7, "notify", { gain: 0.2 });
A(2.72, "phx", "expr", { expr: "kind", set: { curve: 0.32, eye: 0.95 }, dur: 0.2 });   // a tiny smile, eyes still on the screen
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.25 });
// Reaper panics: his eyes follow the holdall down, he gibbers; the suitcase lands at his feet and he jumps
A(1.58, "rea", "look", { to: [-0.4, 0.9], dur: 0.1, blink: false });
A(1.8, "rea", "look", { to: [-0.5, -0.6], dur: 0.2, blink: false });
panic(1.6, "rea", { hold: 0.8 });
A(1.85, "rea", "talk", { line: "no-no-no-no!", amp: YELL, dur: 0.6, tone: "excited" });
c.cap(1.85, 2.6, "no-no-NO!", 680, true, { x: 705 });
A(2.48, "rea", "look", { to: [0.2, 0.9], dur: 0.1, blink: false });
A(2.72, "rea", "look", { to: [0.4, -0.7], dur: 0.15, blink: false });
panic(2.92, "rea", { hold: 0.6 });
A(2.92, "rea", "squash", { amount: 0.07, dur: 0.18 });
prop(2.75, "wizC", { rot: 0 }, 0.3);
see(1.6, 3.15, ["phx.face", "wiz.face", "rea.face", "phone"], "P2: the Wizard shakes Phoenix's arm; Phoenix lifts his glove off; Reaper's side-eye");

// ---------------------------------------------------------------- 3 MASKS 3.2-5.0 (P3)
prop(3.27, "bins", { open: 1 }, 0.1, "out");
prop(3.27, "bins", { lid: 1 }, 0.25, "out");   // the last bin bursts open with the masks
prop(3.5, "case2", { z: 0.45, y: 2.58 }, 0.1, "in");
prop(3.6, "case2", { x: -0.95, z: 1.3, rot: -25, tilt: -8 }, 0.3, "out"); prop(3.6, "case2", { y: 0.13 }, 0.3, "in");   // it whizzes down past Phoenix's face: he doesn't blink
prop(3.9, "case2", { y: 0.2, tilt: -3 }, 0.07, "out"); prop(3.97, "case2", { y: 0.13, tilt: 0 }, 0.1, "in");
sfx(3.9, "kenney/impact-plank-medium", { gain: 0.5, reason: "the pink case's shell clacks on the floor" });
sfx(3.9, "kenney/impact-punch-heavy", { gain: 0.85, reason: "wham: the pink suitcase slams down in front of Phoenix" });
sfx(3.27, "kenney/switch", { gain: 0.6, reason: "the mask doors pop open" });
c.hitStop(3.3, 3);
const MASK_HANG = (x) => ({ x: r3(x + 0.02), y: 1.32, z: 0.85 });
for (const [id, x, d] of [["maskP", PX - 0.32, 0], ["maskW", WX, 0.04], ["maskR", RX, 0.07]]) {
  const h = MASK_HANG(x);
  prop(3.3 + d, id, { y: r3(h.y - 0.07), z: h.z, x: h.x }, 0.22, "in");
  prop(3.52 + d, id, { y: h.y }, 0.3, "settle");
  sfx(3.4 + d, "kenney/drop-leather", { gain: 0.45, reason: "a mask drops on its hose" });
}
A(3.3, "wiz", "look", { to: [0, 0.8], dur: 0.08, blink: false });
panic(3.32, "wiz", { hold: 1.0 });
A(3.4, "wiz", "talk", { line: "ah-ah-ah!", amp: YELL, dur: 0.6, tone: "excited" });
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
// Reaper fumbles his on in a panic, then looks at the Wizard
const REA_MOUTH = { x: r3(RX), y: 0.83, z: r3(SZ + 0.5) };
A(3.55, "rea", "look", { to: [0.0, 0.3], dur: 0.12, blink: false });
panic(3.32, "rea", { hold: 1.0 });
prop(3.3, "tea", { fill: 0.8, y: r3(MUG.y + 0.3) }, 0.22, "out");
prop(3.52, "tea", { y: r3(MUG.y + 0.07) }, 0.2, "in"); prop(3.72, "tea", { fill: 0 }, 0.04);
sfx(3.74, "ai/drip", { gain: 0.4, reason: "plop: the tea lands back in the mug" });
A(3.3, "sam", "lean", { to: -12, dur: 0.15, ease: "out" }); A(3.55, "sam", "lean", { to: 0, dur: 0.4 });
// (the Samurai stays terrified from frame 0; behind Reaper here, so no new face that would make him the subject)
A(3.3, "wiz", "hatwobble", { amount: 10, freq: 3, dur: 0.7 });
c.arm(3.7, "rea", "L", { prop: "maskR", grip: [0, -0.03, -0.03] }, 0.35, "inOut");
A(4.02, "rea", "grab", { prop: "maskR", hand: "L", grip: [0, -0.03, -0.03], dur: 0, pose: null });
c.arm(4.1, "rea", "L", { world: [REA_MOUTH.x + 0.05, REA_MOUTH.y - 0.03, REA_MOUTH.z - 0.03] }, 0.4, "inOut");
A(4.55, "rea", "release", { prop: "maskR", dur: 0 });
prop(4.55, "maskR", REA_MOUTH, 0.06);
c.arm(4.6, "rea", "L", REA_LAP, 0.35, "inOut");
A(4.6, "rea", "look", { to: [-0.8, 0.3], dur: 0.35, blink: false });
// Phoenix ignores his mask: it dangles beside his head while he scrolls on, the phone in both gloves
const MASK_P = MASK_HANG(PX - 0.32);
see(3.35, 4.95, ["phx.face", "wiz.face", "rea.face", "maskW", "maskR", "phone"], "P3: bins burst, masks drop; the Wizard's goes to his ear; Phoenix ignores his and scrolls on");

// ---------------------------------------------------------------- 4 ZERO-G 5.0-7.0 (P4)
// the big drop: everything lifts. The Wizard, unbuckled, floats up and slowly tumbles upside down over Phoenix's phone
// (a pitch turns him about his middle; the yaw turns his face back to us once he is over)
const WIZ_PEAK = { x: -0.35, y: 0.88, z: 0.85 };            // the carrier: his middle 0.8 m above it
prop(5.05, "wizC", { y: 0.4, z: r3(SZ + 0.4) }, 0.35, "out");   // he pops off the seat
prop(5.4, "wizC", WIZ_PEAK, 1.4, "inOut");
A(5.05, "wiz", "ride", { prop: "wizC", off: [0, SEAT, 0], yaw: 0, sit: false, dur: 0.3, ease: "out" });
A(5.4, "wiz", "pitch", { to: 180, dur: 1.4, ease: "inOut" });
prop(5.4, "wizC", { rot: 158 }, 1.4);   // the pitch turns his face away; half a turn brings it back to us
panic(5.05, "wiz", { hold: 3.0 });
A(5.05, "wiz", "talk", { line: "wuh-whoa-whoa!", amp: YELL, dur: 0.9, tone: "excited" });
c.cap(5.05, 6.0, "WHOA-WHOA!!", 520, true, { x: 470 });
c.arm(5.1, "wiz", "L", { o: [0.32, 0.72, 0.12] }, 0.35, "out");
c.arm(6.2, "wiz", "L", { o: [0.1, -0.22, 0.2] }, 0.6, "inOut");   // once he is upside down his free arm points up the screen, clear of Phoenix
// Reaper and Phoenix are belted: they rise only a little against the belts; Reaper's tea lifts out as a blob
prop(5.05, "reaC", { y: 0.15 }, 0.5, "out"); prop(5.05, "phxC", { y: 0.1 }, 0.5, "out");   // up against their belts
prop(5.05, "maskP", { y: r3(MASK_P.y + 0.1) }, 0.5, "out");
// Reaper screams, his free arm flailing over his head
panic(5.06, "rea", { hold: 1.6 });
A(5.15, "rea", "talk", { line: "AAAAH!", amp: YELL, dur: 0.7, tone: "excited" });
c.cap(5.15, 6.0, "AAAAH!", 640, true, { x: 745 });
c.arm(5.1, "rea", "L", { o: [0.34, 0.7, 0.14] }, 0.25, "out");
for (const [i, t] of [5.4, 5.7, 6.0, 6.3].entries()) c.arm(t, "rea", "L", { o: [i % 2 ? 0.34 : 0.44, i % 2 ? 0.7 : 0.6, 0.14] }, 0.3, "inOut");
prop(5.05, "maskR", { y: r3(REA_MOUTH.y + 0.15) }, 0.5, "out");
A(5.1, "rea", "look", { to: [-0.2, -0.1], dur: 0.15, blink: false });
prop(5.25, "tea", { fill: 1, y: r3(MUG.y + 0.42) }, 0.7, "out");
mug.carry(5.4, [MUG.x, r3(MUG.y + 0.2), MUG.z], 0.6);    // he holds the cup under it, calm
sfx(5.25, "gulp", { gain: 0.35, reason: "glk: the tea lifts out of the mug as a blob" });
prop(5.25, "tea", { wobble: 1 }, 0.3);
// the Samurai floats up and lies flat along the aisle, tray level, and offers it to the row
const SAM_UP = [1.98, 1.0, -0.7], S_UP = samFrame(SAM_UP, 0);
prop(5.05, "samC", { x: SAM_UP[0], y: SAM_UP[1], z: SAM_UP[2] }, 1.2, "inOut");
A(5.1, "sam", "lean", { to: -8, dur: 1.2, ease: "inOut" });
trayAt(5.05, S_UP, 1.2);
panic(5.08, "sam", { hold: 1.0 });
A(5.9, "sam", "look", { to: [-0.6, 0.0], dur: 0.2, blink: false });
A(6.2, "sam", "talk", { line: "d-drinks?!", amp: YELL, dur: 0.5, tone: "excited" });   // he still offers them, in a panic
c.cap(6.2, 6.95, "d-drinks?!", 470, true, { x: 710 });
// the pillow and the magazine float past
prop(5.05, "pillow", { scale: 1 }, 0.01);
prop(5.05, "pillow", { x: 0.95, y: 1.6, z: 1.0, rot: 60 }, 0.6, "out");   // it shoots up with the drop, then drifts
prop(5.65, "pillow", { x: 1.2, y: 2.0, z: 0.7, rot: 120 }, 3.5, "linear");
prop(5.05, "mag", { y: 0.85, x: 0.52, z: 1.25, rot: 100, tilt: 20 }, 0.6, "out");
prop(5.65, "mag", { y: 1.05, x: 0.5, z: 1.35, rot: 160, tilt: 30 }, 3.5, "out");
sfx(5.3, "flutter", { gain: 0.35, reason: "the magazine's pages flap as it floats up" });
// the baggage lifts off the floor and tumbles through the cabin; the Wizard's juice floats out of his cup
prop(5.05, "duf", { x: 0.3, y: 0.9, z: 1.15, tilt: -120, rot: 80 }, 1.4, "out");
prop(6.45, "duf", { x: 0.25, y: 1.05, z: 1.1, tilt: -100, rot: 110 }, 2.75, "linear");
prop(5.05, "case", { x: 0.6, y: 0.4, z: 1.35, tip: 120, rot: 10 }, 0.6, "out");   // low across the floor first (clear of Reaper's and the Samurai's faces), then up
prop(5.65, "case", { x: 0.55, y: 1.75, z: 0.85, tip: 150, rot: -40 }, 1.2, "inOut");
prop(6.85, "case", { x: 0.4, y: 1.9, z: 0.95, tip: 170, rot: -60 }, 2.35, "linear");
prop(5.05, "pack", { x: 0.05, y: 0.45, z: 1.45, tip: 70, rot: 30 }, 1.6, "out");
prop(6.65, "pack", { x: 0.1, y: 0.55, z: 1.45, tip: 110, rot: 60 }, 2.55, "linear");
prop(5.05, "shoe", { x: 0.25, y: 1.35, z: 1.3, rot: 330, tip: 60 }, 1.5, "out");
prop(6.55, "shoe", { x: 0.0, y: 1.95, z: 1.35, rot: 420, tip: 120 }, 2.65, "linear");
prop(5.24, "juice", { x: r3(CUP.x + 0.06), y: 0.5, z: r3(CUP.z - 0.06) }, 0.01);
prop(5.25, "juice", { fill: 1, y: 0.85, x: 0.25, z: 0.6, wobble: 1 }, 1.0, "out");
prop(5.05, "case2", { x: -1.45, y: 1.3, z: 1.2, tip: 60, rot: -10 }, 1.0, "out");   // up the window side, clear of his phone, then over his head
prop(6.05, "case2", { x: -1.25, y: 2.15, z: 1.0, tip: 20, rot: 20 }, 1.0, "inOut");
prop(7.05, "case2", { x: -1.3, y: 2.45, z: 0.95, tip: -10, rot: 40 }, 2.15, "linear");   // up into the corner, clear of the captions
prop(5.05, "mag2", { x: -1.0, y: 1.6, z: 1.9, rot: 60, tilt: 40 }, 1.8, "out");    // close to the camera, above the heads
prop(6.85, "mag2", { x: -0.85, y: 2.05, z: 2.0, rot: 140, tilt: -30 }, 2.35, "linear");
prop(5.05, "pillow2", { x: -0.4, y: 0.4, z: 1.8, rot: 40 }, 1.6, "out");
prop(6.65, "pillow2", { x: -0.55, y: 0.5, z: 1.85, rot: 110 }, 2.55, "linear");
sfx(5.6, "cloth", { gain: 0.35, reason: "the bags rustle as they lift off the floor" });
see(5.1, 6.95, ["phx.face", "wiz", "rea.face", "sam.face", "tea", "phone"], "P4: zero-g: the Wizard floats and turns over, the tea blob, the Samurai flat with his tray");

// ---------------------------------------------------------------- 5 PEAK 7.0-8.0 (P5)
A(7.0, "wiz", "look", { to: [0.4, -0.4], dur: 0.2, blink: false });
A(7.0, "wiz", "expr", { expr: "terrified", set: { open: 0.3, wide: 0.4 }, dur: 0.25 });   // review B v4: upside down, the big yell read as a brow; a smaller mouth for the whisper
A(7.0, "phx", "noblink", { dur: 1.0 });
c.arm(7.1, "wiz", "L", { x: [0.36, 0.52, 0.26] }, 0.25, "inOut");   // his free glove cupped beside his mouth, off his eyes
A(7.3, "wiz", "talk", { line: "psst! psst!", dur: 0.5, tone: "excited" });
c.cap(7.3, 7.95, "psst! PSST!", 420, true, { x: 300 });   // in the ceiling above Phoenix, under the title band
for (const w of ["wiz", "rea", "sam"]) A(7.8, w, "noblink", { dur: 1.4 });
see(7.05, 7.95, ["phx.face", "wiz.face", "phone"], "P5: the upside-down Wizard's face right over the phone");

// ---------------------------------------------------------------- 6 LOOK-UP 8.0-9.0 (P6-P7, the series ending)
A(8.05, "phx", "look", { to: [0.4, 0.68], dur: 0.12, blink: false });
A(8.05, "phx", "face", { lid: 0.15, dur: 0.12 });
A(8.05, "phx", "pitch", { to: -6, dur: 0.15 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.cap(8.5, 9.0, "huh.", 500, false, { x: 230 });   // over his head: the lower third is full of bodies here
see(8.1, 8.95, ["phx.face", "wiz.face"], "P7: Phoenix looks up at the upside-down Wizard: huh.");

// ---------------------------------------------------------------- 7 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: [0.0, -0.7], dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.45, dur: 0.15 });
A(9.0, "phx", "pitch", { to: 0, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.2 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
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
prop(9.2, "maskP", { y: MASK_P.y }, DROP, "in");
c.arm(9.2, "rea", "L", REA_LAP, DROP, "in");
// the baggage crashes down with them
prop(9.2, "duf", { x: 0.3, y: 0.13, z: 1.15, tilt: -180, rot: 120 }, DROP, "in");
prop(9.2, "case", { x: 0.7, y: 0.25, z: 1.1, tip: 180, rot: -60 }, DROP, "in");
prop(9.2, "pack", { x: 0.1, y: 0.19, z: 1.45, tip: 180, rot: 60 }, DROP, "in");
prop(9.2, "shoe", { y: 0.06, tip: 180 }, DROP, "in");
prop(9.2, "juice", { x: r3(CUP.x + 0.06), y: 0.5, z: r3(CUP.z - 0.06), wobble: 0 }, DROP, "in"); prop(T_LAND, "juice", { fill: 0 }, 0.04);
sfx(T_LAND, "kenney/impact-punch-heavy", { gain: 0.6, reason: "wham: the suitcase crashes onto the floor" });
sfx(T_LAND + 0.01, "thud", { gain: 0.5, reason: "the holdall and the backpack drop onto the floor" });
prop(9.2, "maskR", { y: REA_MOUTH.y }, DROP, "in");
prop(9.2, "tea", { y: r3(MUG.y + 0.1 + 0.07), wobble: 0 }, DROP, "in"); prop(T_LAND, "tea", { fill: 0 }, 0.04);
prop(9.2, "pillow", { y: 0.2, x: 0.5, z: 1.2 }, DROP, "in");
prop(9.2, "mag", { y: 0.03, tilt: 0 }, DROP, "in");
prop(9.2, "case2", { x: -0.95, y: 0.24, z: 1.3, tip: 0, rot: -30 }, DROP, "in");
prop(9.2, "mag2", { y: 0.03, tilt: 0, z: 1.8 }, DROP, "in"); prop(9.2, "pillow2", { y: 0.1 }, DROP, "in");
A(9.05, "rea", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
c.hitStop(T_LAND, 3);
sfx(T_LAND, "ai/cushion-poof", { gain: 0.7, reason: "everyone lands back in their seats" });
sfx(T_LAND + 0.02, "pan-bonk", { gain: 0.35, reason: "bonk: the Wizard's landing" });
sfx(T_LAND + 0.03, "ai/drip", { gain: 0.45, reason: "plop: the tea blob drops back into the mug" });
for (const w of ["wiz", "rea", "phx"]) A(T_LAND, w, "squash", { amount: w === "wiz" ? 0.12 : 0.05, dur: 0.22 });
A(T_LAND, "wiz", "hatwobble", { amount: 11, freq: 3, dur: 0.6 });
mug.carry(9.2, [MUG.x, MUG.y, MUG.z], DROP, "in");
// the Wizard: the mask clamped over his mouth now, glaring at Phoenix; Reaper slips his mask down and sips
const WIZ_MOUTH = { x: [-0.14, 0.4, 0.42] };
c.arm(T_LAND + 0.02, "wiz", "R", WIZ_MOUTH, 0.18, "out");
c.arm(T_LAND, "wiz", "L", { x: [0.22, 0.3, 0.3] }, 0.2, "out");
A(T_LAND + 0.1, "wiz", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
prop(T_LAND + 0.04, "wizC", { rot: -22 }, 0.26, "out");   // he spins round to glare at Phoenix
act.mood(c, T_LAND + 0.15, "wiz", "angry", { hold: 1.2 });   // held to the last frame: the glare is the ending
A(T_LAND + 0.05, "rea", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
prop(T_LAND + 0.05, "maskR", { y: 0.62, z: r3(REA_MOUTH.z + 0.06) }, 0.15, "out");   // it drops to his chest
mug.carry(T_LAND + 0.15, [r3(MUG.x + 0.04), 0.8, r3(MUG.z - 0.02)], 0.25);
A(T_LAND + 0.3, "rea", "face", { lid: 0.7, dur: 0.2 });
A(9.6, "sam", "look", { to: [-0.6, -0.2], dur: 0.15, blink: false });
see(T_LAND + 0.05, 9.98, ["phx.face", "wiz.face", "rea.face", "sam", "tray", "phone"], "P8: back in the seats: the Wizard glares through his mask, Reaper sips, the tray level");

// ---------------------------------------------------------------- make room for the outside shots
// everything written so far is the v2 cabin; whatever starts at or after a cut plays that much later. A caption running
// across a cut ends at it; a must-see window running across one is split round it.
for (const it of c.items) it.at = T(it.at);
for (const q of c.captions) { const cut = CUTS.find(([at]) => q.from < at - 1e-6 && q.to > at + 1e-6); q.to = cut ? cut[0] : T(q.to); q.from = T(q.from); }
for (const v of [...c.visible]) {
  const cut = CUTS.find(([at]) => v.from < at - 1e-6 && v.to > at + 1e-6);
  if (cut) c.visible.push({ ...v, from: r3(T(cut[0]) + 0.05), to: T(v.to) });
  v.to = cut ? r3(cut[0] - 0.02) : T(v.to); v.from = T(v.from);
}
for (const h of c.hitStops) h.at = r3(Math.round(T(h.at) * 30) / 30);

// the panic in clip time: the three friends tremble from frame 0 until the plane levels out and drops them back (not
// Phoenix), and sweat keeps flicking off them, a burst each every second or so in the cabin (never in the outside shots)
const LAND = T(T_LAND);
// (the tremble is a 7.5 Hz sine: it ends on a whole number of its half cycles, at rest, so nothing jumps when it stops)
for (const [who, amp] of [["wiz", 1.5], ["rea", 1.5], ["sam", 1.3]]) A(0, who, "shake", { dur: r3(Math.floor((LAND - 0.02) * 15) / 15), amp });
// wide eyes stare: no automatic blinks while they panic (a blink on a yell reads as calm); a few placed ones off their lines
for (const [who, ts] of [["wiz", [2.05, 5.6, 9.0]], ["rea", [2.2, 5.3, 9.95]]]) { A(0, who, "noblink", { dur: LAND }); for (const t of ts) A(t, who, "blink", { dur: 0.2 }); }
const OUT = [[CUTS[0][0], r3(CUTS[0][0] + INS_T)], [r3(CUTS[1][0] + INS_T), r3(CUTS[1][0] + INS_T + INS)]].map(([a, b]) => [a - 0.75, b]);
for (const [who, t0] of [["rea", 1.5], ["sam", 2.0], ["wiz", 2.4]]) for (let t = t0; t < LAND - 0.8; t += 1.2) if (!OUT.some(([a, b]) => t > a && t < b)) c.at(r3(t), { fx: "sweat", who, dur: 0.7, count: 3 });
// the cabin never sits still while the plane is in trouble (review B v4): a low tremor under the bumps, inside only
for (const [a, b] of [[CUTS[0][0] + INS_T, CUTS[1][0] + INS_T], [CUTS[1][0] + INS_T + INS, LAND]]) c.at(r3(a + 0.02), { fx: "shake", amp: 0.006, dur: r3(b - a - 0.05) });
// after the landing: Reaper sighs into his tea, the Samurai is left stunned (the Wizard's glare is the ending)
A(r3(LAND + 0.3), "rea", "expr", { expr: "kind", set: { curve: 0.1, eye: 0.9 }, dur: 0.35 });
A(r3(LAND + 0.3), "rea", "face", { brow: 0, corner: 0, dur: 0.35 });
A(r3(LAND + 0.25), "sam", "face", { corner: -0.2, dur: 0.35 });
A(r3(LAND + 0.25), "sam", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.1 }, dur: 0.35 });

// ---------------------------------------------------------------- OUTSIDE 5.0-6.5: the plane drops through the storm
// Built far off to the side of the cabin (x 320): nothing of the cabin set is in this shot, nothing of it in the cabin's.
// The camera rides alongside, a little ahead of the right wing (Phoenix's side, his window lit phone-cyan), so the plane
// tips over and falls away down the frame while the clouds and the rain rush up past the lens.
const EX = [320, 60, -60];                                 // (60 m up: something of the stage at eye level near y 0 drew a dark band across the horizon)
const ex = (dx, dy, dz) => [r3(EX[0] + dx), r3(EX[1] + dy), r3(EX[2] + dz)];
const X0 = r3(CUTS[1][0] + INS_T), X1 = r3(X0 + INS);   // the free fall, in clip time
// the lens (alongside, a little ahead of the right wing and above) and points along its view, so the far cards face it
const CAM_X = ex(34, 7, 92), LOOK_X = ex(0, -6, 0), LOOK_X2 = ex(3, -11, 2);
const vsub = (p, q) => p.map((v, i) => v - q[i]), vlen = (v) => Math.hypot(...v), vnorm = (v) => v.map((x) => x / vlen(v));
const DIR = vnorm(vsub(LOOK_X, CAM_X)), RIGHT = vnorm([-DIR[2], 0, DIR[0]]), UP = [RIGHT[1] * DIR[2] - RIGHT[2] * DIR[1], RIGHT[2] * DIR[0] - RIGHT[0] * DIR[2], RIGHT[0] * DIR[1] - RIGHT[1] * DIR[0]];   // right x forward = up
const along = (d, sx = 0, sy = 0) => CAM_X.map((v, i) => r3(v + DIR[i] * d + RIGHT[i] * sx + UP[i] * sy));
const FACE = r3((Math.atan2(-DIR[0], -DIR[2]) * 180) / Math.PI);   // a card's yaw that turns it to the lens
const exProps = [
  { id: "sky", kind: "stormsky", ...xyz(along(240, 0, 20)), rot: FACE, src: "assets/plates/storm-sky-dive.png", h: 240 },   // low enough that the ground shows from the first frame
  { id: "bolt", kind: "skybolt", ...xyz(along(200, -26, 22)), rot: FACE, h: 80, seed: 4, glow: 0 },
  { id: "cloudsFar", kind: "cloudrush", ...xyz(along(150, 0, -40)), rot: FACE, n: 14, w: 100, h: 200, size: 32, seed: 3, color: "#3d3478", light: "#8f7bd0", opacity: 0.9 },
  { id: "jet", kind: "airliner", ...xyz(ex(0, 0, 0)), rot: 63, tip: 8, roll: 12, cyan: 14 },
  { id: "cloudsNear", kind: "cloudrush", ...xyz(along(46, 0, -45)), rot: FACE, n: 7, w: 44, h: 120, size: 13, seed: 8, color: "#463c86", light: "#a894e0", opacity: 0.68, order: 5, spread: 0.75 },
  { id: "rain", kind: "rainstreaks", ...xyz(along(40, 0, 0)), rot: FACE, n: 380, box: [40, 50, 30], v: [-8, 115, 0], len: 5.5, width: 0.05, opacity: 0.26 },
];
function xyz([x, y, z]) { return { x, y, z }; }
props.push(...exProps);
// the plane: a slight dive as we cut, then it tips over (nose down past 45 degrees, banking onto its right wing) and
// falls away, faster and faster (a falling body gains speed: "in" eases the drop)
// (review B: tip fast, fall slower, and fall away from the lens so it shrinks: growing reads as coming at us)
prop(X0, "jet", { tip: 46, roll: 26 }, 0.5, "inOut");
prop(X0 + 0.5, "jet", { tip: 56, roll: 31 }, INS - 0.5, "out");
prop(X0, "jet", { y: r3(EX[1] - 20) }, INS - 0.02, "in");
prop(X0, "jet", { x: r3(EX[0] + DIR[0] * 18 + 4), z: r3(EX[2] + DIR[2] * 18) }, INS - 0.02, "linear");
prop(X0, "jet", { spin: 160 }, INS - 0.02, "linear");
prop(X0 + 0.62, "jet", { lit: 0.25 }, 0.05); prop(X0 + 0.72, "jet", { lit: 1 }, 0.05);   // the cabin lights flicker
// the storm rushes up past us: the far clouds, the near wisps, the painted sky a little (it is far)
const P_ = Object.fromEntries(exProps.map((q) => [q.id, q]));
prop(X0, "cloudsFar", { y: r3(P_.cloudsFar.y + 140) }, INS - 0.02, "linear");
prop(X0, "cloudsNear", { y: r3(P_.cloudsNear.y + 110) }, INS - 0.02, "linear");
// (the painted sky stays put: it is far, and its bottom edge must stay out of the tilting frame)
// lightning right beside the plane, just after the cut: one strike that lights it white and dies away (a real bolt flickers, but
// a flicker reads as a strobe glitch on a phone, so it is one flash with a slow fade)
const LT = X0 + 0.3;   // review B: the plane reads clearly for its first frames, then the strike
for (const id of ["bolt", "jet", "sky", "cloudsFar", "cloudsNear", "rain"]) { const g = id === "bolt" ? 1 : id === "jet" ? 0.6 : 0.5; prop(LT, id, { glow: g }, 0.04, "out"); prop(LT + 0.1, id, { glow: 0 }, 0.4, "in"); }
c.at(LT, { fx: "flash", peak: 0.22, dur: 0.1, sound: false });
c.at(X0, { fx: "shake", amp: 0.012, dur: INS - 0.05 }); c.at(LT, { fx: "shake", amp: 0.022, dur: 0.6 });   // the storm buffets the lens the whole shot
sfx(LT, "firework", { gain: 0.4, reason: "the thunderclap of the bolt right beside the plane: crack and boom" });
sfx(LT + 0.05, "rumble", { gain: 0.6, dur: 1.4, reason: "thunder rolling after the strike" });
sfx(X0, "windswell", { gain: 0.85, dur: INS, reason: "the air roaring louder as the plane drops" });
sfx(X0 + 0.3, "ridewind", { gain: 0.45, dur: INS - 0.35, reason: "the gusty rush of air past the falling plane" });
see(X0 + 0.05, X1 - 0.05, ["jet"], "OUTSIDE: the plane tips nose-down and drops through the storm (why everything floats)");

// ---------------------------------------------------------------- OUTSIDE 0.32-1.32: the plane bucks in the storm
// Jonny 7 Nov on v3: "cut in a plane scene where the plane has turbulence right at the beginning when the first bag drops on
// the ground". The holdall hits the floor (0.28) and we cut outside the same plane, level and flying, lurching in the
// storm: it drops a few metres and is thrown back up, rocking wing to wing, a bolt cracks beside it and the cabin lights
// flicker. The clouds and rain stream back past it (it flies on, to the right of frame). Then back into the cabin.
const XT0 = CUTS[0][0], XT1 = r3(XT0 + INS_T);
const LOOK_T = ex(2, -3, 0), LOOK_T2 = ex(4, -3.5, 1);   // tighter than the free fall: the plane bigger in frame
const Y0 = EX[1], J = (t) => r3(XT0 + t);
// the jolts: [time into the shot, height change, roll, tip, length] (a bump drops fast and recovers slower)
for (const [t, dy, roll, tip, d, e] of [[0, -3.6, -10, -3, 0.16, "in"], [0.16, -1.4, 26, 14, 0.24, "out"], [0.4, -5.0, -6, -2, 0.16, "in"], [0.56, -3.2, 30, 12, 0.26, "out"], [0.82, -4.0, 16, 7, 0.18, "inOut"]])
  prop(J(t), "jet", { y: r3(Y0 + dy), roll, tip }, d, e);
prop(J(0.6), "jet", { lit: 0.3 }, 0.06); prop(J(0.72), "jet", { lit: 1 }, 0.06);   // the cabin lights flicker on the big jolt
prop(J(0), "jet", { x: r3(EX[0] + 3.0), z: r3(EX[2] + 1.5) }, INS_T - 0.02, "linear");   // it flies on a little, to the right
// the storm streams back past it: the near wisps fast, the far ones slower (along the lens' left)
const back = (q, m) => ({ x: r3(q.x - RIGHT[0] * m), z: r3(q.z - RIGHT[2] * m) });
prop(J(0), "cloudsNear", back(P_.cloudsNear, 30), INS_T - 0.02, "linear");
prop(J(0), "cloudsFar", back(P_.cloudsFar, 14), INS_T - 0.02, "linear");
// rain: sideways streaks in this shot (the falling shot's rain rises past the lens: hidden here, and the other way round)
props.push({ id: "rainT", kind: "rainstreaks", ...xyz(along(36, 0, 0)), rot: FACE, n: 300, box: [60, 40, 30], v: [-120, -22, 0], len: 5, width: 0.05, opacity: 0.24, scale: 0.0001 });
prop(J(0), "rainT", { scale: 1 }, 0.01); prop(XT1, "rainT", { scale: 0.0001 }, 0.01);
prop(J(0), "rain", { scale: 0.0001 }, 0.01); prop(XT1, "rain", { scale: 1 }, 0.01);
// back to where the free fall starts from, while we are in the cabin
prop(r3(XT1 + 0.05), "jet", { y: Y0, roll: 12, tip: 8, x: EX[0], z: EX[2] }, 0.01);
prop(r3(XT1 + 0.05), "cloudsNear", { x: P_.cloudsNear.x, z: P_.cloudsNear.z }, 0.01);
prop(r3(XT1 + 0.05), "cloudsFar", { x: P_.cloudsFar.x, z: P_.cloudsFar.z }, 0.01);
// a bolt beside it on the second jolt: one flash and a slow fade (the cabin's own flash was at 0.08)
const LT0 = J(0.42);
for (const id of ["bolt", "jet", "sky", "cloudsFar", "cloudsNear", "rainT"]) { const g = id === "bolt" ? 1 : id === "jet" ? 0.4 : 0.5; prop(LT0, id, { glow: g }, 0.04, "out"); prop(r3(LT0 + 0.1), id, { glow: 0 }, 0.4, "in"); }
c.at(LT0, { fx: "flash", peak: 0.2, dur: 0.1, sound: false });
c.at(J(0), { fx: "shake", amp: 0.016, dur: INS_T - 0.05 }); c.at(LT0, { fx: "shake", amp: 0.024, dur: 0.4 });
sfx(LT0, "firework", { gain: 0.35, reason: "the thunderclap of the bolt beside the bucking plane" });
sfx(J(0), "windswell", { gain: 1.0, dur: INS_T, reason: "the storm roaring round the plane" });
sfx(J(0.02), "thud-soft", { gain: 1.0, reason: "the plane's first lurch" }); sfx(J(0.42), "thud-soft", { gain: 1.0, reason: "the second, bigger lurch" });
sfx(J(0.03), "kenney/impact-plank-medium", { gain: 0.45, reason: "the airframe clanks on the first lurch (mids for a phone speaker)" });
sfx(J(0.18), "creak", { gain: 0.55, reason: "the airframe straining as it is thrown about" });
see(J(0.05), r3(XT1 - 0.05), ["jet"], "OUTSIDE: the plane lurches and rocks in the storm (why the bags fall)");

// ---------------------------------------------------------------- shots (from the row in front, front-left)
const shot = (pos, look, fov = 50, o = {}) => ({ pos, look, fov, ...o });
const HAND = { rate: 0, bob: 0, sway: 0, drift: 0, dips: [...BUMPS.map(([t, a, d]) => [T(t), a, d]), [T(1.0), 0.03, 0.3]].sort((a, b) => a[0] - b[0]) };   // the cabin keeps shivering before the second bump
const WIDE = shot([-0.15, 1.45, 5.35], [0.22, 1.3, 0], 58, { hand: HAND });
const MASKS = { ...WIDE, to: { pos: [-0.15, 1.4, 4.9], look: [-0.02, 1.3, 0], fov: 56 }, dur: 1.2 };   // the wide pushes in on the bump
const ZEROG = shot([0.25, 1.85, 5.6], [0.42, 1.4, 0], 58, { hand: HAND });   // review B: the climax a size step out, not the widest shot
const PEAK = { ...shot([-1.42, 1.28, 4.75], [-0.66, 1.2, 0.4], 44, { hand: HAND }), to: { pos: [-1.36, 1.26, 4.45] }, dur: 2.0 };   // a slow push into the series' LOOK-UP framing
const BACKDOWN = shot([-0.2, 1.47, 5.45], [0.22, 1.28, 0], 58, { hand: HAND });
// outside: alongside, a little ahead of the right wing and above; the lens tilts down after the plane as it falls away
const BUCK = { ...shot(CAM_X, LOOK_T, 30, { hand: { rate: 0, bob: 0, sway: 0, drift: 0, dips: [[J(0.02), 0.8, 0.3], [LT0, 1.1, 0.35]] } }), to: { look: LOOK_T2 }, dur: INS_T - 0.05 };
const OUTSIDE = { ...shot(CAM_X, LOOK_X, 36, { hand: { rate: 0, bob: 0, sway: 0, drift: 0, dips: [[LT, 0.9, 0.35], [X0 + 0.5, 1.2, 0.6]] } }), to: { look: LOOK_X2 }, dur: INS - 0.1 };
const beats = c.beats([
  ["P1 bump", 0, WIDE, "hook"],
  ["OUTSIDE turbulence", XT0, BUCK],
  ["P1 back inside", XT1, WIDE],
  ["P2 grab", T(1.5), "keep"],
  ["P3 masks", T(3.2), MASKS],
  ["OUTSIDE free fall", X0, OUTSIDE],
  ["P4 zero-g", T(5.0), ZEROG],
  ["P5 peak", T(7.0), PEAK],
  ["P6 look-up", T(8.0), "keep", "payoff"],
  ["P8 back down", T(9.2), BACKDOWN, "reaction"],
], END);

write(import.meta.url, {
  id: "never-looks-up-plane",
  title: "The friend who never looks up from his phone… even in heavy turbulence",
  idea: "Never Looks Up ep 2: a stormy night flight bucks, the masks drop and a big drop (seen from outside: the plane tips nose-down and falls through the lightning) floats everyone; Phoenix scrolls on through the bags and the panic until the Wizard floats upside down over the phone: huh. The plane levels and drops them all back",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: T(8.5),
  set: { type: "plain", night: true, color: "#2a2840", floor: "#3b3f5a", para: 0, bloom: "emissive", aperture: 0, focus: false,
    plate: { src: PLATE, z: -3.2, center: [0.3, 0.87], height: 10, depth: false, motion: false, dust: 0 } },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } },
  // v5 (Jonny 7 Nov 11:49: "more dramatic music"): a new orchestral emergency bed (assets/music/ai/disaster, racing
  // strings, booming drums, brass hits) from the first frame; it cuts dead the moment Phoenix looks up (the stop locks
  // to a bar line), so "huh." lands in silence
  music: { file: "ai/disaster/disaster-04.ogg", until: T(8.0), lowCut: 150, gain: 0.45, duck: { db: 9 } },   // (the hits duck it harder: a busy orchestral bed buried the thuds)
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
    { who: "wiz", with: "phx", from: T(1.6), to: T(2.95), reason: "the Wizard grabs Phoenix's arm and Phoenix lifts his glove off" },
    { who: "rea", with: "maskR", from: T(3.55), to: AFTER, reason: "Reaper wears his mask over his mouth, then lets it drop to his chest" },
    { who: "wiz", with: "maskW", from: T(3.7), to: AFTER, reason: "the Wizard clamps his mask to his ear, then over his mouth" },
    { who: "phx", with: "maskP", from: T(3.4), to: AFTER, reason: "Phoenix's mask dangles beside his head on its hose (he ignores it)" },
    { who: "wiz", with: "cup", from: 0, to: T(4.0), reason: "the Wizard holds his juice in his lap" },
    { who: "rea", with: "mug", from: 0, to: AFTER, reason: "Reaper holds his tea" },
    { who: "sam", with: "tray", from: 0, to: AFTER, reason: "the Samurai carries his tray" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep2-plane.mjs. Panels: PANELS-ep2-plane.md. Title added in TikTok's text tool.",
});
