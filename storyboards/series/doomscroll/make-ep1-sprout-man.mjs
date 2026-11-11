// DOOMSCROLL TO SURVIVE, pilot: SPROUT MAN (11 Nov 2026). "Look up and you die."
// Jonny's outline and two 8-panel sheets: /mnt/project-files/video-scripts/2026-11-11-doomscroll-to-survive/
// (01-sprout-man-CHAIN-OUTLINE.md, panels-01-sprout-man/sheet-A-as-written.png, sheet-B-extreme.png, PANEL-NOTES.md).
// This generator builds BOTH pilots (Jonny, 11 Nov: "see both episodes as pilot and see how they compare"):
//   cut A (default): the outline as written, a night forest, the monster three potatoes tall.
//   cut B (--extreme): the same chain 10x: a giant above the forest in a thunderstorm, the lift goes above the clouds,
//   the last picture is the flattened forest at dawn. Everything B changes is behind the X switch.
// NOTES.md next to this file has the places, cameras and decisions.
//
// THE BRIEF
//   Joke:        a faceless monster takes everyone who looks up at it; Spud never looks up from his phone.
//   Wants:       Sprout Man wants one look from Spud; Spud wants to scroll; the battery is running out.
//   Consequence: his own jab at the phone opens the selfie camera, a puppy filter gives him a face, and he wants the
//                phone instead of Spud. The phone caused the save.
//   Ending:      the battery dies, the face is gone, he turns to them; the Wizard charges the phone. All four sit on
//                the log, him scrolling in the middle, nobody looks up.
//   Callback:    the rule from frame 0 ("look up and you die") still holds in the last picture, now for the monster too.
//
//   cut H (--horror, 11 Nov evening): cut B told like a horror film, after Jonny's verdict on the two drafts ("the man
//   should first appear behind a tree and then appear behind the character ... build up tension and then let the slender
//   act", "horror music", "the characters must look scared") and his ten-panel sheet
//   (.../02-sprout-man-EXTREME-HORROR-PANELS.md, panels-02-extreme-horror/). A new opening of 9.5 s goes in front and
//   cut B's whole chain plays D = 9.5 s later: every time below the opening is cut B's own time, moved by the builder.
//
//   cut S (--shadow): Jonny on the horror sheet, 11 Nov 19:59: "the creepy character should be smaller and look more evil,
//   he should be very fast and more like a crepy shadow". Cut A's small monster and night forest, told like cut H: the
//   same opening and fear, but he is a black shadow with two glowing slit eyes who crosses the frame in a few frames.
//
//   node storyboards/series/doomscroll/make-ep1-sprout-man.mjs [--extreme | --horror | --shadow]
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { hud } from "../../lib/overlay.mjs";
import { ramp } from "../../lib/camera.mjs";
import { toSprout, sproutHead } from "../../../engine/shared/sprout-rig.js";

const FACES = "strong";
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LINES = { sub: true, blink: false };
const H = process.argv.includes("--horror");    // cut H: cut B behind a horror opening
const S = process.argv.includes("--shadow");    // cut S: cut A's small monster as a fast black shadow, behind the same opening
const HOR = H || S;                             // told like a horror film
const X = H || process.argv.includes("--extreme");   // cut B
const D = HOR ? 9.5 : 0, T0 = -D, o = (t) => t - D;   // o(3) = second 3 of the video in cut H (the opening is written in real seconds)
const c0 = clip({ faces: FACES, lines: LINES });
const late = (f) => (t, ...a) => f(t + D, ...a), late2 = (f) => (a, b, ...r) => f(a + D, b + D, ...r);
const c = D ? { ...c0, at: late(c0.at), A: late(c0.A), prop: late(c0.prop), sfx: late(c0.sfx), arm: late(c0.arm), still: late(c0.still), say: late(c0.say), macro: late(c0.macro), see: late2(c0.see), cap: late2(c0.cap), hitStop: late(c0.hitStop) } : c0;
const { A, sfx, see, prop, cap } = c;
const END = 19.0 + D, T9X = 17.4 + D;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places (x right, z toward us; the forest is -z)
const LOG = { x: 0, z: 0.6, len: 3.5, r: 0.21 };
const FIRE = [0.1, 2.35];
const S_SPD = -1.25, S_VIK = -0.35, S_WIZ = 0.58;                 // seats along the log at frame 0
const F_SPD = -1.42, F_VIK = -0.55, F_SM = 0.42, F_WIZ = 1.35;   // the last picture: Spud, Viking, Sprout Man, the Wizard
const HANG = X ? { spd: [0.05, 6.2, 1.3], vik: [-1.18, 5.0, 1.3], wiz: [1.15, 5.0, 1.3] }   // B: above the clouds
  : { spd: [-0.15, 1.3, 1.3], vik: [-1.3, 0.95, 1.3], wiz: [1.3, 0.95, 1.3] };   // where he dangles them (P05)
const UP = { vik: [-1.5, 7.6, -0.8], wiz: [1.3, 7.6, -0.6] };     // yanked out of the top of the frame
const HELMET = [-0.15, 0.16, 1.55];                              // where Viking's helmet lands and spins
const BODY = 0.45;                                               // a potato's middle above its feet (the coil's height)

// Sprout Man's stations (the prop's base pose at each)
const HEAD_UP = 2.56;   // his head's centre above his feet at scale 1
const SM_FAR = X ? { x: 0.3, y: 0, z: -15, rot: 0, scale: 4, hipY: 1.28, hipZ: 0, lean: 0, twist: 0 }     // B P01: a giant above the trees
  : { x: 0.1, y: 0, z: -1.8, rot: 0, scale: 1, hipY: 1.28, hipZ: 0, lean: 0, twist: 0 };                   // P01: behind them, between the trunks
const SM_NEAR = X ? { ...SM_FAR, x: -1.05, z: -5 } : { ...SM_FAR, x: -1.05, z: -0.5, rot: 4 };            // P03: right behind Spud (B: legs like trunks)
const SM_CROUCH = X ? { ...SM_NEAR, x: -0.2, lean: 38 }                                                    // B P04: he bends down over him
  : { ...SM_FAR, x: 0.5, z: 1.02, rot: -92, hipY: 0.66, hipZ: -0.2, lean: 72 };                            // P04: crouched in front of him
const SM_BIG = X ? { ...SM_FAR, x: 0, y: -12.2, z: -6, scale: 6, lean: 0 }                               // B P05: head and shoulders out of the cloud floor
  : { ...SM_FAR, x: 0.4, z: -0.1, rot: 0, lean: 5 };                                                       // P05: full height behind the log
const SM_SIT = X ? { ...SM_FAR, hipY: 0.22, lean: 22 }                                                     // B P08: cross-legged in the flattened forest
  : { ...SM_FAR, x: F_SM, z: LOG.z, rot: 0, hipY: 0.53, lean: 20 };                                        // P08: on the log
// cut H: the pine he hides behind, and where he stands behind it (not far and huge: near and tall, "much too high up
// the tree"; a locked camera cannot tell the difference, and the painted pines would hide a real giant further back)
// The pine is a bare trunk: its crown is out of the top of the frame.
const TREE = X ? { x: 1.2, z: -16, h: 30, r: 0.9 } : { x: 0.55, z: -5, h: 16, r: 0.5 }, TREE_R = X ? 0.75 : 0.44;   // TREE_R: the trunk's radius at his head's height
const SM_PEEK = { ...SM_FAR, x: TREE.x - TREE_R, z: TREE.z - (X ? 1.0 : 0.8), rot: 0, scale: X ? 3 : 1.15, lean: 0, twist: 0 };
const SM_0 = HOR ? SM_PEEK : SM_FAR;
let smNow = { ...SM_0 };
const BASE_KEYS = ["x", "y", "z", "rot", "scale", "hipY", "hipZ", "lean", "twist"];
const sm = (t, set, dur = 0.3, ease = "inOut") => { prop(t, "sm", set, dur, ease); for (const k of BASE_KEYS) if (k in set) smNow[k] = set[k]; };
const station = (t, S, extra = {}, dur = 0.01) => sm(t, { ...Object.fromEntries(BASE_KEYS.map((k) => [k, S[k]])), ...extra }, dur);
const armTo = (t, side, world, dur = 0.3, ease = "inOut", extra = {}) => { const [x, y, z] = toSprout(smNow, world); prop(t, "sm", { [`a${side}x`]: x, [`a${side}y`]: y, [`a${side}z`]: z, [`a${side}k`]: 1, ...extra }, dur, ease); };
const coilTo = (t, which, world, dur = 0.3, ease = "inOut", extra = {}) => { const [x, y, z] = toSprout(smNow, world); prop(t, "sm", { [`t${which}x`]: x, [`t${which}y`]: y, [`t${which}z`]: z, ...extra }, dur, ease); };
// a wrapped friend rides the coil: the character and the coil's target move on the same clock
const carry = (t, who, which, pos, dur, ease = "inOut") => { A(t, who, "fly", { to: { x: pos[0], y: pos[1], z: pos[2] }, dur, ease }); coilTo(t, which, [pos[0], pos[1] + BODY, pos[2]], dur, ease); };

// Spud holds the phone in both mittens in front of his chest
const PH_Y = 0.33, PH_Z = 0.44;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const AT_PHONE = [0.03, -1];

const cast = [
  { id: "spd", character: "potatobrawl/spud", at: [S_SPD, LOG.z], face: 0, expr: "kind", follow: 0.3, seed: 1.7,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "vik", character: "duo/viking", at: [S_VIK, LOG.z], face: 0, expr: "kind", follow: 0.4, seed: 3.3 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [S_WIZ, LOG.z], face: 0, expr: "kind", follow: 0.4, seed: 2.6 },
];
const STAFF0 = { x: 1.95, y: 0.0, z: 0.95, rot: 0, tilt: -14, tip: 0 };
const props = [
  { id: "log", kind: "firelog", x: LOG.x, z: LOG.z, rot: 0, len: LOG.len, r: LOG.r },
  { id: "fire", kind: "campfire", x: FIRE[0], z: FIRE[1], lit: 1, r: 0.3 },
  { id: "sm", kind: "sproutman", x: SM_0.x, y: 0, z: SM_0.z, rot: SM_0.rot, scale: SM_0.scale, seed: 5, ...(S && { shadow: 0.94, eyes: 0 }) },
  ...(HOR ? [{ id: "tree", kind: "pinetrunk", x: TREE.x, z: TREE.z, h: TREE.h, r: TREE.r, crown: 0.75, seed: 3 }] : []),
  { id: "phone", kind: "phone", x: S_SPD, y: 0.9, z: LOG.z + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", bright: 1.5, halo: 0.42 },
  { id: "staff", kind: "parkedstaff", ...STAFF0 },
  { id: "frame", kind: "selfieframe", x: 0, y: 0, z: 0, scale: 0, w: 0.36, h: 0.62 },
];
// cut B: the storm. Rain between us and them, two bolts far behind the trees (one more for the phone at the end)
const OFF = 0.0001;
if (X || S) props.push({ id: "rain", kind: "rainstreaks", x: 0, y: 4, z: 4.2, n: 320, box: [9, 9, 5], v: [-2.5, -13, 0], len: 0.7, width: 0.012, opacity: 0.3 });
if (X) props.push(
  { id: "boltL", kind: "skybolt", x: -7, y: 17, z: -32, h: 36, seed: 4, glow: 0 },
  { id: "boltR", kind: "skybolt", x: 8, y: 19, z: -36, h: 40, seed: 9, glow: 0 },
  { id: "boltP", kind: "skybolt", x: 0.5, y: 14.5, z: -13.1, h: 22, w: 0.3, seed: 6, glow: 0 },
);
// a lightning flash: the bolt, the giant lit white, thunder a beat later
const flash = (t, id = "boltL", gain = 0.7) => { if (!X && !S) return;
  if (X) { prop(t, id, { glow: 1 }, 0.03); prop(t + 0.08, id, { glow: 0.25 }, 0.05); prop(t + 0.16, id, { glow: 0.9 }, 0.03); prop(t + 0.24, id, { glow: 0 }, 0.3, "out"); }
  prop(t, "sm", { flash: 1 }, 0.03); prop(t + 0.24, "sm", { flash: 0 }, 0.35, "out");
  if (HOR) { c.at(t, { fx: "flash", peak: 0.35, dur: 0.3, color: "#dfe8ff" }); sfx(t + 0.12, "thunder", { gain }); }
  else sfx(t + 0.12, "firework", { gain, reason: "thunder: a crack over a deep boom (the library has no thunder yet)" }); };

// ---------------------------------------------------------------- from frame 0: three on the log, Spud on his phone
A(T0, "spd", "sit", { seat: "log", along: S_SPD, dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(T0, "spd", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(T0, "spd", "look", { to: AT_PHONE, dur: 0, blink: false });
A(T0, "spd", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.95 }, dur: 0.01 });
A(T0, "spd", "face", { lid: 0.5, dur: 0 });
act.blinksAt(c, "spd", [1.6, 5.4, 8.9, 15.7]);
act.scrollPhone(c, "spd", [0.3, 1.2, 2.4, 4.7, 5.6, 6.5, 7.95, 8.8, 9.6]);
prop(T0, "phone", { glow: 0.75 }, 0.01);
A(T0, "vik", "sit", { seat: "log", along: S_VIK, dur: 0, hands: "lap" });
A(T0, "wiz", "sit", { seat: "log", along: S_WIZ, dur: 0, hands: "lap" });
if (!HOR) { A(T0, "vik", "look", { to: [0.1, -0.3], dur: 0, blink: false });       // warming at the fire
  A(T0, "wiz", "look", { to: [-0.1, -0.3], dur: 0, blink: false }); }

// ---------------------------------------------------------------- CUT H, THE OPENING 0-10.0 (panels 01-04), real seconds
// 01 he looks out from behind a pine, far too high up; 02 lightning, the pine stands alone; 03 two black trunks behind
// Spud are his legs; 04 he bends down over the camp and his fingers settle round the log like a cage; the music is
// gone, a heartbeat, Viking's eyes creep up. Then cut B's chain: he strikes at 10.0.
const FEAR = { expr: "terrified", set: { open: 0.1, curve: -0.3 } };   // the scream's eyes with a small tight mouth
const sweat = (t, who, count = 3) => c.at(t, { fx: "sweat", who, dur: 0.7, count });
if (HOR) {
  act.blinksAt(c, "spd", [1.6, 4.2, 8.1].map(o));
  act.scrollPhone(c, "spd", [0.3, 1.2, 2.4, 3.5, 4.4, 5.5, 6.5, 7.9, 8.8].map(o));
  for (const [w, amp] of [["vik", 0.8], ["wiz", 0.9]]) {
    A(o(0), w, "expr", { ...FEAR, dur: 0.01 }); A(o(0), w, "face", { brow: 0.45, dur: 0 });
    A(o(0), w, "shake", { dur: 4.9, amp }); A(o(5.0), w, "shake", { dur: 4.4, amp: amp + 0.5 });
  }
  // 01 (0-2.5): they know he is there and do not dare to look. Eyes dart to the side he is on, never up
  A(o(0), "vik", "look", { to: [0.55, 0.0], dur: 0, blink: false }); A(o(0), "wiz", "look", { to: [0.3, -0.1], dur: 0, blink: false });
  A(o(1.0), "vik", "look", { to: [0.0, -0.15], dur: 0.12, blink: false }); A(o(1.7), "vik", "look", { to: [0.6, 0.05], dur: 0.12, blink: false });
  A(o(0.7), "wiz", "look", { to: [0.65, 0.0], dur: 0.12, blink: false }); A(o(1.5), "wiz", "look", { to: [0.1, -0.2], dur: 0.12, blink: false });
  sweat(o(0.5), "vik"); sweat(o(1.3), "wiz");
  station(o(0), SM_PEEK, { headR: 0, headP: 6 });
  sm(o(0.3), { x: TREE.x - TREE_R - (X ? 0.22 : 0.1), headR: -14 }, 1.9, "inOut");           // he leans out a little further to look at them
  if (S) sm(o(0.9), { eyes: 1 }, 0.5, "out");                                           // two slits open in the dark
  // 02 (2.5-5.0): lightning. The pine stands alone. The fire gutters; they search the dark
  flash(o(2.45), "boltL", 0.75);
  sm(o(2.47), { scale: OFF }, 0.01);                                                    // gone inside the flash
  if (S) {   // "very fast": twice he crosses right behind them, a black streak of a few frames; their eyes whip after it
    for (const [t, z, from, to] of [[3.55, -1.7, -5.5, 5.5], [4.35, -1.0, 5.5, -5.5]]) {
      station(o(t - 0.02), { ...SM_FAR, x: from, z, rot: from < 0 ? 80 : -80, lean: 24 }, { eyes: 1 });
      sm(o(t), { x: to }, 0.14, "linear"); sm(o(t + 0.15), { scale: OFF }, 0.01);
      sfx(o(t), "whoosh", { gain: 0.45 });
      for (const w of ["vik", "wiz"]) { A(o(t + 0.05), w, "look", { to: [to > 0 ? 0.8 : -0.8, 0.05], dur: 0.08, blink: false }); A(o(t + 0.05), w, "squash", { amount: 0.05, dur: 0.15 }); }
    }
  }
  prop(o(2.6), "fire", { lit: 0.3 }, 0.8, "out");
  for (const [t, v, w] of [[2.75, [-0.7, 0.05], [0.7, 0.0]], [3.35, [0.7, 0.1], [-0.6, 0.05]], [4.0, [-0.3, -0.1], [0.5, -0.1]], [4.5, [0.4, 0.0], [-0.4, 0.0]]]) {
    A(o(t), "vik", "look", { to: v, dur: 0.1, blink: false }); A(o(t + 0.08), "wiz", "look", { to: w, dur: 0.1, blink: false });
  }
  c.say(o(3.2), "wiz", "where is he?", 0.9, "whisper", { sub: "where is he?", voice: false, pos: 880 });
  sweat(o(3.0), "vik"); sweat(o(4.1), "wiz");
  see(o(0.1), o(2.3), ["spd.face", "vik.face", "wiz.face", "phone"], "01: Spud on his phone, the friends stiff with fear; the pale head behind the pine");
  see(o(2.7), o(4.9), ["spd.face", "vik.face", "wiz.face"], "02: the pine alone; the friends search the dark");
  // 03 (5.0-7.5): close on Spud. The two trunks behind him are trouser legs
  if (X) station(o(4.97), SM_NEAR, { headP: 0, headR: 0 });
  prop(o(4.97), "tree", { scale: OFF }, 0.01);
  flash(o(6.0), "boltR", 0.7);
  if (S) { station(o(6.0), SM_NEAR, { headP: 26, headR: 0, eyes: 1 }); sm(o(6.7), { headR: 12 }, 0.5, "inOut"); }   // in the flash he stands behind Spud; the head tips, curious
  A(o(6.25), "vik", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.12 }); sweat(o(6.3), "vik", 4);
  for (const [w, t] of [["vik", 6.9], ["wiz", 6.8]]) { A(o(t), w, "look", { to: [0, -1], dur: 0.1, blink: false }); A(o(t), w, "expr", { ...FEAR, dur: 0.15 }); A(o(t), w, "face", { lid: 0.55, dur: 0.15 }); }
  see(o(5.1), o(7.4), ["spd.face", "phone"], "03: Spud's calm phone-lit face, two black trunks behind him");
  // 04 (7.5-9.0): he bends down out of the storm; the fingers come down round the log
  station(o(7.47), X ? { ...SM_NEAR, x: -0.2, lean: 8 } : { ...SM_NEAR, x: -0.3, z: -0.6, rot: 0, lean: 6 }, { headP: 10, headR: 0 });
  sm(o(7.5), { lean: X ? 52 : 46, headP: 34 }, 1.45, "inOut");
  armTo(o(7.6), "L", X ? [2.2, 0.12, 1.7] : [1.55, 0.1, 1.5], 1.3, "inOut", { fanL: 1, wig: 0.25 });
  armTo(o(7.6), "R", X ? [-2.6, 0.12, 1.7] : [-2.15, 0.1, 1.5], 1.3, "inOut", { fanR: 1 });
  for (const [t, g] of [[7.55, 0.9], [8.45, 1], [9.15, 1]]) sfx(o(t), "ai/heartbeat", { gain: g, reason: "the music is gone: a heartbeat is the only sound left while he bends down over them" });
  c.say(o(7.9), "wiz", "dont look", 0.6, "whisper", { sub: "don't look...", voice: false });
  see(o(7.8), o(8.9), ["sm"], "04: he bends over the camp, the fingers like a cage");
  // 9.0-10.0: Viking close. He cannot help it (cut B's own eyesLead and shock follow at 9.72 and 9.88)
  A(o(9.0), "vik", "face", { lid: 0.2, dur: 0.3 });
  A(o(9.05), "vik", "look", { to: [0.05, -0.45], dur: 0.3, blink: false }); A(o(9.4), "vik", "look", { to: [0.15, 0.05], dur: 0.3, blink: false });
  sweat(o(9.1), "vik", 4);
  see(o(9.1), o(9.95), ["vik.face"], "Viking's eyes creep up");
  // the strike (cut B's 0.5 = 10.0): the cage lets go, the fire bursts into embers
  prop(o(10.0), "sm", { aLk: 0, aRk: 0, wig: 0 }, 0.25, "out");
  prop(o(10.02), "fire", { lit: 0 }, 0.1);
  act.landDust(c, o(10.03), FIRE, { color: "#ff9a3c", puffs: 12 });
  sfx(o(10.03), "crumble", { gain: 0.5, reason: "the fire is smashed apart" });
}

// ---------------------------------------------------------------- 1 THE RULE 0-2.0 (P01, P02): Viking looks up and is gone
c.macro(T0, null, "narrate", { line: "Look up, and you die.", voice: process.env.FINAL ? "narrator-trailer" : "storyteller-deep", caption: false, gain: 1 });
cap(T0, T0 + 2.0, "LOOK UP AND YOU DIE.", X ? 560 : 330);
flash(0.5, "boltL"); flash(2.3, "boltR", 0.6); flash(4.5, "boltL", 0.5); flash(10.55, "boltR");
act.eyesLead(c, 0.22, "vik", [0.45, 0.75]);
if (HOR) A(0.38, "vik", "expr", { expr: "terrified", dur: 0.12 }); else act.shock(c, 0.38, "vik", { open: 0.3, hold: 0.5 });
sfx(0.5, "scarestab", { gain: 0.8 });
coilTo(0.5, "A", [S_VIK, 0.3 + BODY, LOG.z], 0.3, "in", { tAk: 1 });     // the sprout whips across the frame and coils round him
sfx(0.55, "whoosh", { gain: 0.7 });
A(0.86, "vik", "stand", {});
carry(0.88, "vik", "A", UP.vik, 0.32, "in");
// his helmet stays behind: it drops straight to the ground while he goes up, then spins out
const HAT_UP = 0.78, hatOff = (g, at) => [r3(g[0] - at[0]), r3(g[1] - at[1] - HAT_UP), r3(g[2] - at[2])];
A(0.88, "vik", "hat", { off: hatOff(HELMET, UP.vik), spin: [80, 200, 0], dur: 0.32, ease: "in", quiet: true });
A(1.2, "vik", "hat", { off: hatOff(HELMET, UP.vik), spin: [80, 1100, 0], dur: 0.8, ease: "out", quiet: true });
sfx(1.2, "tink", { gain: 0.6, reason: "the helmet hits the ground" });
if (HOR) { A(1.05, "wiz", "expr", { expr: "terrified", dur: 0.12 }); } else act.shock(c, 1.05, "wiz", { open: 0.42, hold: 1.2 });
A(1.0, "wiz", "look", { to: [-0.6, 0.5], dur: 0.12, blink: false });    // where Viking was, and up
c.say(1.25, "wiz", "aaaah!", 0.7, "excited", { sub: "AAAH!", voice: false });
if (HOR) see(0.5, 1.0, ["spd.face", "vik.face", "phone"], "05: the strike, Viking wrapped, Spud on his phone");
else see(0, 1.0, ["spd.face", "vik.face", "wiz.face", "sm", "phone"], "P01: three on the log, Spud on his phone, the tall one behind them");
see(1.0, 1.9, ["spd.face", "wiz.face"], "P02: Viking gone, the Wizard screams, Spud has not moved");

// ---------------------------------------------------------------- 2 SHH 2.0-4.5 (P03): the Wizard looks too
station(2.0, SM_NEAR, HOR ? { aLk: 0, aRk: 0, fanL: 0.35, fanR: 0.35, wig: 0, headP: 0 } : {});
coilTo(2.0, "A", [UP.vik[0], UP.vik[1] + BODY, UP.vik[2]], 0.01);
A(2.1, "wiz", "look", { to: [-0.75, 0.85], dur: 0.12, blink: false });   // up at him
coilTo(2.3, "B", [S_WIZ, 0.3 + BODY, LOG.z], 0.26, "in", { tBk: 1 });
sfx(2.32, "whoosh", { gain: 0.7 });
A(2.56, "wiz", "stand", {});
carry(2.58, "wiz", "B", UP.wiz, 0.32, "in");
const HAT1 = [0.7, 2.25, 0.75], HAT2 = [0.62, 0.6, 0.78];          // the pointed hat hangs in the air, then floats down onto the log
A(2.58, "wiz", "hat", { off: hatOff(HAT1, UP.wiz), spin: [0, 0, 20], dur: 0.32, ease: "in", quiet: true });
A(2.9, "wiz", "hat", { off: hatOff(HAT2, UP.wiz), spin: [0, 40, -25], dur: 1.5, ease: "inOut", quiet: true });
// Spud: one finger to his lips, eyes on the phone
A(3.0, "spd", "grab", { prop: "phone", hand: "L", keep: true, dur: 0, pose: null });   // the left hand keeps it (a one-hand release drops the prop)
c.arm(3.0, "spd", "R", { x: [-0.03, 0.33, 0.36] }, 0.3, "out");
A(3.0, "spd", "grip", { side: "R", shape: "point", dur: 0.2 });
c.say(3.2, "spd", "shh.", 0.5, "whisper", { sub: "shh.", voice: false });
c.arm(3.95, "spd", "R", PHONE_R, 0.3, "inOut");
A(4.25, "spd", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
sm(3.3, { headP: 28 }, 0.7);                                            // the blank head tips down at him
see(2.0, 2.9, ["spd.face", "wiz.face", "sm"], "P03: he is right behind Spud; the Wizard looks up and is taken");
see(3.0, 4.4, ["spd.face", "sm", "phone"], "P03: shh, eyes on the phone");

// ---------------------------------------------------------------- 3 THE HAND 4.5-7.0 (P04): he waves between face and phone
station(4.5, SM_CROUCH, { headP: X ? 30 : -30, fanL: 1, wig: 1 });
const WAVE = [S_SPD + 0.05, 0.86, LOG.z + 0.38];
armTo(4.5, "L", [WAVE[0], WAVE[1] - 0.1, WAVE[2]], 0.01);
for (let i = 0, t = 4.6; t < 6.85; i++, t += 0.28) armTo(t, "L", [WAVE[0] + (i % 2 ? 0.06 : -0.02), WAVE[1] + (i % 2 ? 0.1 : -0.08), WAVE[2]], 0.28, "inOut");
A(5.0, "spd", "lean", { to: -13, dur: 0.4 });                           // leans round the hand to keep reading
A(5.95, "spd", "lean", { to: 11, dur: 0.45 });
A(6.65, "spd", "lean", { to: 0, dur: 0.3 });
see(4.6, 6.9, ["spd.face", "phone", "sm"], "P04: the long fingers between his face and the screen; he leans round them");

// ---------------------------------------------------------------- 4 THE LIFT 7.0-10.0 (P05, the 10x moment)
station(7.0, SM_BIG, { headP: X ? -8 : 12, fanL: 0.35, wig: 0, aLk: 0 });
if (X) { prop(7.0, "rain", { scale: OFF }, 0.01); prop(14.0, "rain", { scale: 1 }, 0.01); prop(T9X - D, "rain", { scale: OFF }, 0.01); }
for (const w of ["vik", "wiz"]) { A(7.0, w, "hat", { off: [0, 0, 0], spin: [0, 0, 0], dur: 0, quiet: true }); A(7.0, w, "expr", { expr: "terrified", dur: 0.01 }); A(7.0, w, "face", { lid: 1, dur: 0.01 }); }
coilTo(7.0, "A", [UP.vik[0], UP.vik[1] + BODY, UP.vik[2]], 0.01); coilTo(7.0, "B", [UP.wiz[0], UP.wiz[1] + BODY, UP.wiz[2]], 0.01);
const TOP = 0.95;                                                       // the hand holds Spud by the top of his sweater
armTo(7.05, "R", [S_SPD, 0.3 + TOP, LOG.z], 0.25, "out", { fanR: 0.2 });
A(7.3, "spd", "stand", {});
A(7.32, "spd", "fly", { to: { x: HANG.spd[0], y: HANG.spd[1], z: HANG.spd[2] }, dur: 0.55, ease: "inOut" });
armTo(7.32, "R", [HANG.spd[0], HANG.spd[1] + TOP, HANG.spd[2]], 0.55, "inOut");
A(7.4, "spd", "pitch", { to: 180, dur: 0.5 }); A(7.4, "spd", "turn", { to: 180, dur: 0.5 });   // pitch alone would show his back: with the half turn his face stays to us                          // upside down, still scrolling
sfx(7.32, "whoosh", { gain: 0.5 });
carry(7.6, "vik", "A", HANG.vik, 0.6, "out");
carry(7.28, "wiz", "B", HANG.wiz, 0.6, "out");
c.say(7.62, "wiz", "dont look!", 0.6, "whisper", { sub: "DON'T LOOK!", voice: false, pos: 520 });
ramp(c, 8.3, 0.6, 0.35);                                                // slow motion on the hero picture (the cover)
// he turns Spud the right way up and brings him to his blank face
A(9.2, "spd", "pitch", { to: 0, dur: 0.5 }); A(9.2, "spd", "turn", { to: 0, dur: 0.5 });
if (!X) sm(9.2, { lean: 30, headP: 14 }, 0.6);
see(7.9, 9.1, ["spd.face", "vik.face", "wiz.face", "sm", "phone"], "P05: Spud upside down, still scrolling; the friends wrapped, eyes shut");

// ---------------------------------------------------------------- 5 THE JAB 10.0-12.0 (P06, the fake-out)
const PHONE_W = [HANG.spd[0], HANG.spd[1] + 0.42, HANG.spd[2] + 0.44];
const J = X ? 6 : 1;   // his fingers are as long as his scale: the wrist stays that much further off the glass
armTo(10.0, "L", [PHONE_W[0] + 0.5 * J, PHONE_W[1] + 0.55 * J, PHONE_W[2] + 0.05], 0.01, "inOut", { fanL: 0 });
armTo(10.45, "L", X ? [PHONE_W[0] + 0.28, PHONE_W[1] + 0.72, PHONE_W[2] + 0.02] : [PHONE_W[0] + 0.03, PHONE_W[1] + 0.2, PHONE_W[2] + 0.02], 0.1, "in");
sfx(10.55, "tink", { gain: 0.8, reason: "his fingertip hits the glass" });
prop(10.55, "phone", { glow: 0 }, 0.03);
armTo(10.75, "L", [PHONE_W[0] + 0.3 * J, PHONE_W[1] + 0.42 * J, PHONE_W[2] + 0.05], 0.3, "out");
A(10.9, "spd", "pitch", { to: -11, dur: 0.95, ease: "in" });           // his head starts to lift... eyes still down
A(10.9, "spd", "face", { lid: 0.3, dur: 0.6 });
see(10.1, 11.9, ["spd.face", "phone"], "P06: the jab, the black screen, his head starting to lift");

// ---------------------------------------------------------------- 6 THE FACE 12.0-14.0 (P07): the selfie camera
const SELFIE = { pos: [HANG.spd[0] + 0.4, r3(HANG.spd[1] + 1.12), 2.55], fov: 46 };
// B: for the selfie his blank head comes right up behind Spud and fills the screen
const SM_SELF = { ...SM_BIG, scale: 3, x: HANG.spd[0] + 0.75, y: r3(SELFIE.pos[1] + 0.25 - 3 * HEAD_UP), z: -2.2, lean: 0 };
if (X) station(12.0, SM_SELF, { headP: 6 });
prop(12.0, "frame", { x: SELFIE.pos[0], y: SELFIE.pos[1], z: SELFIE.pos[2] - 0.8, scale: 1 }, 0.01);
prop(14.0, "frame", { scale: 0 }, 0.01);
A(12.0, "spd", "pitch", { to: 0, dur: 0.01 });
A(12.0, "spd", "look", { to: [0.3, 0.2], dur: 0.01, blink: false });     // into the phone's camera
A(12.0, "spd", "face", { lid: 0.5, dur: 0.01 });
armTo(12.0, "L", [PHONE_W[0] + 0.2, PHONE_W[1] + 0.2, PHONE_W[2]], 0.01);
sm(12.35, { puppy: 1 }, 0.22, "back");
sfx(12.35, "pop", { gain: 0.8 }); sfx(12.4, "ting", { gain: 0.5 });
{ // he freezes, then touches the face he never had
  const H = sproutHead(X ? { ...smNow } : { ...smNow, lean: 30 }), k = smNow.scale;
  armTo(12.95, "L", [H[0] + 0.3 * k, H[1] - 0.05 * k, H[2] + 0.22 * k], 0.45, "inOut", { fanL: 0.8 });
}
see(12.4, 13.9, ["sm"], "P07: the puppy filter on the blank head");

// ---------------------------------------------------------------- 7 THE DROP 14.0-16.0: both hands on the phone, so everyone falls
const TAKEN = X ? [0.3, r3(HANG.spd[1] + 0.6), 0.5] : [0.05, 1.95, 0.75], INLAP = X ? [SM_SIT.x, 3.3, SM_SIT.z + 2.0] : [F_SM, 0.98, LOG.z + 0.5];
if (X) station(14.0, { ...SM_FAR, lean: 14 }, { puppy: 0, headP: 32 }); else sm(14.0, { puppy: 0, lean: 14, headP: 32 }, 0.01);
A(14.0, "spd", "release", { prop: "phone", hand: "both", dur: 0, to: TAKEN });
prop(14.0, "phone", { rot: 180, tip: -20, glow: 0.9 }, 0.01);
armTo(14.0, "L", [TAKEN[0] + 0.07, TAKEN[1], TAKEN[2]], 0.01, "inOut", { fanL: 0.5, fanR: 0.5 }); armTo(14.0, "R", [TAKEN[0] - 0.07, TAKEN[1], TAKEN[2]], 0.01);
for (const [w, t] of [["spd", 14.02], ["vik", 14.1], ["wiz", 14.18]]) {
  const fall = X ? 0.45 : 0.3;   // B: six metres down
  A(t, w, "drop", { to: 0, dur: fall });
  A(t + fall, w, "squash", { amount: X ? 0.14 : 0.22, dur: 0.3 });
  sfx(t + fall, "thud-soft", { gain: 0.6 });
  act.landDust(c, t + fall, [HANG[w][0], HANG[w][2]], { color: "#9fb0c4" });
}
prop(14.08, "sm", { tAk: 0, tBk: 0 }, 0.35, "out");
for (const w of ["vik", "wiz"]) { A(14.5, w, "face", { lid: 0, dur: 0.15 }); A(14.5, w, "expr", { expr: "shocked", dur: 0.15 }); }
A(14.6, "vik", "look", { to: [0.8, -0.1], dur: 0.15, blink: false }); A(14.7, "wiz", "look", { to: [-0.8, -0.1], dur: 0.15, blink: false });
A(14.4, "spd", "look", { to: [0.2, -0.6], dur: 0.15 }); A(14.45, "spd", "expr", { expr: "shocked", dur: 0.15 });
c.arm(14.4, "spd", "R", "rest", 0.3); c.arm(14.4, "spd", "L", "rest", 0.3);
// he sits down on the log with it and takes selfies
station(14.7, SM_SIT, { sit: 1, cross: X ? 1 : 0, headP: 34 }, 0.7);
prop(14.7, "phone", { x: INLAP[0], y: INLAP[1], z: INLAP[2], tip: -28, ...(X && { scale: 5 }) }, 0.7);
prop(14.7, "sm", (() => { const b = { ...SM_SIT }; const l = toSprout(b, [INLAP[0] + 0.07, INLAP[1], INLAP[2]]), r = toSprout(b, [INLAP[0] - 0.07, INLAP[1], INLAP[2]]); return { aLx: l[0], aLy: l[1], aLz: l[2], aRx: r[0], aRy: r[1], aRz: r[2] }; })(), 0.7);
sfx(15.5, "flash", { gain: 0.5 }); sm(15.45, { wig: 0.5 }, 0.2);
see(14.0, 14.6, ["spd", "vik", "wiz", "sm", "phone"], "both hands on the phone: all three drop, alive");
see(15.0, 15.9, ["sm", "phone", "spd.face"], "he sits on the log with the phone");

// ---------------------------------------------------------------- 8 DEAD 16.0-17.4: the battery dies, the Wizard charges it
prop(16.0, "phone", { glow: 0 }, 0.05); sfx(16.0, "deflate", { gain: 0.5 });
sm(16.0, { wig: 0 }, 0.1);
sm(16.3, { headP: 4 }, 0.4, "inOut"); sm(16.65, { headY: -55 }, 0.5, "inOut");       // the blank head lifts and turns to them
for (const [w, t] of [["spd", 16.5], ["vik", 16.55], ["wiz", 16.6]]) { A(t, w, "look", { to: [0, -1], dur: 0.1, blink: false }); A(t, w, "face", { lid: 0.75, dur: 0.12 }); A(t, w, "expr", { expr: "terrified", dur: 0.12 }); }
// the Wizard, eyes shut, pokes the phone with his staff
const STAFF_POKE = X ? { x: HANG.wiz[0] + 0.42, y: 0.5, z: 1.55, rot: 0, tilt: 0, tip: -8 }      // B: he raises it and the storm answers
  : { x: 1.12, y: 0.42, z: 1.5, rot: 0, tilt: 62, tip: 14 };
prop(16.75, "staff", STAFF_POKE, 0.3, "out");
c.arm(16.75, "wiz", "L", { o: [0.26, 0.5, 0.2] }, 0.3, "out");
sfx(17.05, "ting", { gain: 0.8 }); sfx(17.05, "charge", { gain: 0.5 });
flash(17.05, "boltP", 0.8);
prop(17.05, "phone", { glow: 1 }, 0.15);
sm(17.15, { headY: 0, headP: 34, wig: 0.5 }, 0.3);
see(16.1, 17.3, ["sm", "spd.face", "wiz.face", "phone"], "the dead phone, his head turning to them, eyes down, the staff's spark");

// ---------------------------------------------------------------- 9 NOBODY LOOKS UP 17.4-19.0 (P08)
const T9 = 17.37;   // one frame before the cut, so every jump lands on the cut frame
for (const [w, s] of X ? [["spd", S_SPD], ["vik", S_VIK], ["wiz", S_WIZ]] : [["spd", F_SPD], ["vik", F_VIK], ["wiz", F_WIZ]]) {   // B: the same three seats as frame 0
  A(T9, w, "move", { to: [s, LOG.z], dur: 0.01, steps: 0 });
  A(T9, w, "sit", { seat: "log", along: s, dur: 0.01, hands: "lap" });
  A(T9, w, "look", { to: [0, -1], dur: 0.01, blink: false });
  A(T9, w, "face", { lid: HOR ? 0.2 : 0.6, dur: 0.01 });
  if (HOR) { A(T9, w, "expr", { ...FEAR, dur: 0.01 }); A(T9 + 0.06, w, "shake", { dur: 1.4, amp: 1.2 }); }
  else A(T9, w, "expr", { expr: "sad", dur: 0.01 });
}
A(T9, "spd", "droop", { to: 1, dur: 0.01 });
prop(T9, "staff", { x: (X ? S_WIZ : F_WIZ) - 0.42, y: 0.5, z: LOG.z + 0.45, rot: 0, tilt: 68, tip: 8 }, 0.01);
c.arm(T9, "wiz", "L", { o: [0.2, 0.5, 0.3] }, 0.01);
sfx(18.0, "notify", { gain: 0.3 });
see(17.5, 18.9, ["spd.face", "vik.face", "wiz.face", "sm", "phone"], "P08: all four on the log, him scrolling in the middle, nobody looks up");

// ---------------------------------------------------------------- shots (the painting's camera looks level along -z)
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
// B: the storm painting looks up 12 degrees (two thirds sky), so its shots do too: the potatoes along the bottom, him above
const WIDE = X ? shot([-0.3, 1.0, 6.2], { tilt: 12, fov: 46 }) : shot([0.0, 1.5, 7.8], { fov: 46 });
const SHH = X ? shot([-0.55, 1.1, 5.0], { tilt: 11, fov: 46 }) : shot([-0.55, 1.62, 5.5], { fov: 46 });
const HAND = shot([-0.95, 1.1, 4.2], { tilt: X ? 5 : 0, fov: 46 });
const HERO = X ? shot([0.0, 5.2, 8.7], { tilt: 6, fov: 48 }) : shot([0.0, 1.7, 8.7], { tilt: 1, fov: 48 });
const JAB = shot([HANG.spd[0] + 0.1, HANG.spd[1] + 0.55, 4.0], { tilt: -3, fov: 36 });
const SELF = shot(SELFIE.pos, { fov: SELFIE.fov });
const DROP = X ? shot([0.0, 1.3, 7.6], { tilt: 12, fov: 46 }) : shot([0.0, 1.55, 8.4], { tilt: 2, fov: 46 });
const LAST = X ? shot([-0.3, 1.5, 7.8], { tilt: 4, fov: 46 })   // the dawn painting looks up only 3 degrees
   : shot([0.0, 1.55, 8.4], { tilt: 2, fov: 46 });
// cut H's opening shots
const CLOSE = shot([-0.85, 0.85, 3.9], { tilt: 9, fov: 42 });           // 03: Spud's face, the legs behind him
const LOW = X ? shot([0.2, 0.45, 6.6], { tilt: 24, fov: 54 })           // 04: from the ground up the suit
  : shot([0.1, 0.45, 5.6], { tilt: 4, fov: 46 });                       // S: low in front of the fire, him bent over them
const VIKC = shot([S_VIK + 0.05, 0.85, 3.3], { tilt: 5, fov: 34 });     // Viking's eyes
const beats = c.beats([
  ...(HOR ? [["01 behind the pine", 0, WIDE, "hook"], ["03 the legs", 5.0, CLOSE], ["04 the cage", 7.5, LOW], ["he looks", 9.0, VIKC], ["05 the strike", 10.0, WIDE]]
    : [["P01 the rule", 0, WIDE, "hook"]]),
  ["P03 shh", 2.0 + D, SHH],
  ["P04 the hand", 4.5 + D, HAND],
  ["P05 the lift", 7.0 + D, HERO],
  ["P06 the jab", 10.0 + D, JAB],
  ["P07 the face", 12.0 + D, SELF, "payoff"],
  ["the drop", 14.0 + D, DROP],
  ["dead", 16.0 + D, "keep"],
  ["P08 nobody looks up", 17.4 + D, LAST, "reaction"],
], END);

write(import.meta.url, {
  id: S ? "doomscroll-01-sprout-man-shadow" : H ? "doomscroll-01-sprout-man-horror" : X ? "doomscroll-01-sprout-man-extreme" : "doomscroll-01-sprout-man",
  title: "Look up and you die",
  idea: "Doomscroll to survive, pilot: a faceless monster takes everyone who looks up; Spud never looks up from his phone, and the phone's selfie filter saves them all",
  format: "series pilot: Doomscroll to survive (look up and you die; the phone causes the save; the battery is the clock)",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [300, 1360],
  castLook: "sheet", cleanStart: true,
  motion: MOTION, rig: RIG, physics: true, animeTiming: true,
  cover: 8.5 + D,
  set: { type: "env", env: X ? "storm-pine-clearing" : "pine-forest-night",
    // B: above the clouds for the lift, back down for the drop, the flattened forest at dawn for the last picture. The
    // camera gate reads only the first env, so it fails the last shot, which is framed for the dawn painting (it looks
    // up 3 degrees, the storm 12). The gate is off for B for that reason; checked by hand on 11 Nov: with --gate every
    // shot before 17.4 s passes on the storm env, and the last shot passes on the dawn env alone
    ...(X && { swap: [...(H ? [{ at: 7.5, env: "storm-pine-clearing-up" }, { at: 9.0, env: "storm-pine-clearing" }] : []), { at: 7.0 + D, env: "moon-above-storm" }, { at: 14.0 + D, env: "storm-pine-clearing" }, { at: T9X, env: "flattened-forest-dawn" }], envCheck: process.argv.includes("--gate") }),
    shade: "soft", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, life: "auto", cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: hud({ battery: HOR ? [[0, 5], [5.0, 4, 0.12], [10.0, 3, 0.12], [7.0 + D, 2, 0.12], [10.0 + D, 1, 0.12], [16.0 + D, 0, 0.12], [17.05 + D, 100, 0.35]]
    : [[0, 5], [2.0, 4, 0.12], [4.5, 3, 0.12], [7.0, 2, 0.12], [10.0, 1, 0.12], [16.0, 0, 0.12], [17.05, 100, 0.35]] }),
  // cut H: the horror bed (puppet/beat.mjs "dread"): drone, heartbeat and a creeping cluster; silence while he bends down
  // (7.5-10.0, the heartbeat alone is a sound effect), back faster on the strike, cut dead by the jab, a music box on the
  // puppy face, nothing while they fall, the drone again when the battery dies
  music: HOR ? { style: "dread", bpm: 60, key: 0, gain: 0.4, parts: [{ at: 0, part: "main" }, { at: 7.5, part: "hush" }, { at: 10.0, part: "drop" }, { at: 10.55 + D, part: "hush" }, { at: 12.35 + D, part: "musicbox" }, { at: 14.0 + D, part: "hush" }, { at: 16.0 + D, part: "main" }] }
    : { style: "sneaky", lowCut: 150, gain: 0.34, parts: [{ at: 0, part: "main" }, { at: 10.55, part: "stop" }, { at: 12.35, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.06, surface: "dirt", room: "open", guard: true },
  creative: { length: HOR ? [27, 31] : [18, 22] },
  hook: HOR ? { show: ["spd", "vik", "wiz", "phone"], hint: 0, what: "three friends at a campfire in a storm, two of them stiff with fear; a pale blank head looks out from behind a pine, far too high up" }
    : { show: ["spd", "vik", "wiz", "sm", "phone"], hint: 0, what: "a tall faceless figure stands behind three friends at a campfire; one looks up and is gone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spd", with: "log", from: 0, to: 7.4 + D, reason: "Spud sits on the log" },
    { who: "vik", with: "log", from: 0, to: 1.0 + D, reason: "Viking sits on the log" },
    { who: "wiz", with: "log", from: 0, to: 2.7 + D, reason: "the Wizard sits on the log" },
    { who: "spd", with: "log", from: 17.4 + D, to: END + 1.5, reason: "Spud sits on the log" },
    { who: "vik", with: "log", from: 17.4 + D, to: END + 1.5, reason: "Viking sits on the log" },
    { who: "wiz", with: "log", from: 17.4 + D, to: END + 1.5, reason: "the Wizard sits on the log" },
    ...["spd", "vik", "wiz"].map((who) => ({ who, with: "sm", from: 14.7 + D, to: END + 1.5, reason: "Sprout Man's box takes in his long arms and back sprouts, which reach out past the three; his body sits clear of them on the log" })),
    { who: "wiz", with: "staff", from: 16.7 + D, to: END + 1.5, reason: "the Wizard holds his staff (a prop staged at his hand)" },
    { who: "spd", from: 7.3 + D, to: 8.0 + D, checks: ["face-covered", "hand-jump", "palm-turn", ...(X ? ["rig-jump", "motion"] : [])], reason: "he is flipped upside down in half a second with both hands on the phone" + (X ? "; in B he is also yanked six metres up above the clouds in that half second" : "") },
    ...(X ? ["spd", "vik", "wiz"].map((who) => ({ who, from: 14.7 + D, to: 15.45 + D, checks: ["rig-jump", "motion", "hand-jump"], reason: "B: the three fall six metres out of the sky in under half a second (meant to be fast)" })) : []),
  ],
  notes: "Generated by storyboards/series/doomscroll/make-ep1-sprout-man.mjs. Panels: /mnt/project-files/video-scripts/2026-11-11-doomscroll-to-survive/panels-01-sprout-man/. Title added in TikTok's text tool.",
});
