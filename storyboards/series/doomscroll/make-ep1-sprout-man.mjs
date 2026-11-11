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
//   node storyboards/series/doomscroll/make-ep1-sprout-man.mjs [--extreme]
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { hud } from "../../lib/overlay.mjs";
import { ramp } from "../../lib/camera.mjs";
import { toSprout, sproutHead } from "../../../engine/shared/sprout-rig.js";

const FACES = "strong";
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LINES = { sub: true, blink: false };
const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop, cap } = c;
const END = 19.0, T9X = 17.4;
const X = process.argv.includes("--extreme");   // cut B
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
let smNow = { ...SM_FAR };
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
  { id: "sm", kind: "sproutman", x: SM_FAR.x, y: 0, z: SM_FAR.z, rot: SM_FAR.rot, scale: SM_FAR.scale, seed: 5 },
  { id: "phone", kind: "phone", x: S_SPD, y: 0.9, z: LOG.z + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", bright: 1.5, halo: 0.42 },
  { id: "staff", kind: "parkedstaff", ...STAFF0 },
  { id: "frame", kind: "selfieframe", x: 0, y: 0, z: 0, scale: 0, w: 0.36, h: 0.62 },
];
// cut B: the storm. Rain between us and them, two bolts far behind the trees (one more for the phone at the end)
const OFF = 0.0001;
if (X) props.push(
  { id: "rain", kind: "rainstreaks", x: 0, y: 4, z: 4.2, n: 320, box: [9, 9, 5], v: [-2.5, -13, 0], len: 0.7, width: 0.012, opacity: 0.3 },
  { id: "boltL", kind: "skybolt", x: -7, y: 17, z: -32, h: 36, seed: 4, glow: 0 },
  { id: "boltR", kind: "skybolt", x: 8, y: 19, z: -36, h: 40, seed: 9, glow: 0 },
  { id: "boltP", kind: "skybolt", x: 0.5, y: 14.5, z: -13.1, h: 22, w: 0.3, seed: 6, glow: 0 },
);
// a lightning flash: the bolt, the giant lit white, thunder a beat later
const flash = (t, id = "boltL", gain = 0.7) => { if (!X) return;
  prop(t, id, { glow: 1 }, 0.03); prop(t + 0.08, id, { glow: 0.25 }, 0.05); prop(t + 0.16, id, { glow: 0.9 }, 0.03); prop(t + 0.24, id, { glow: 0 }, 0.3, "out");
  prop(t, "sm", { flash: 1 }, 0.03); prop(t + 0.24, "sm", { flash: 0 }, 0.35, "out");
  sfx(t + 0.12, "firework", { gain, reason: "thunder: a crack over a deep boom (the library has no thunder yet)" }); };

// ---------------------------------------------------------------- from frame 0: three on the log, Spud on his phone
A(0, "spd", "sit", { seat: "log", along: S_SPD, dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(0, "spd", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "spd", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "spd", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.95 }, dur: 0.01 });
A(0, "spd", "face", { lid: 0.5, dur: 0 });
act.blinksAt(c, "spd", [1.6, 5.4, 8.9, 15.7]);
act.scrollPhone(c, "spd", [0.3, 1.2, 2.4, 4.7, 5.6, 6.5, 7.95, 8.8, 9.6]);
prop(0, "phone", { glow: 0.75 }, 0.01);
A(0, "vik", "sit", { seat: "log", along: S_VIK, dur: 0, hands: "lap" });
A(0, "wiz", "sit", { seat: "log", along: S_WIZ, dur: 0, hands: "lap" });
A(0, "vik", "look", { to: [0.1, -0.3], dur: 0, blink: false });       // warming at the fire
A(0, "wiz", "look", { to: [-0.1, -0.3], dur: 0, blink: false });

// ---------------------------------------------------------------- 1 THE RULE 0-2.0 (P01, P02): Viking looks up and is gone
c.macro(0.0, null, "narrate", { line: "Look up, and you die.", voice: process.env.FINAL ? "narrator-trailer" : "storyteller-deep", caption: false, gain: 1 });
cap(0, 2.0, "LOOK UP AND YOU DIE.", X ? 560 : 330);
flash(0.5, "boltL"); flash(2.3, "boltR", 0.6); flash(4.5, "boltL", 0.5); flash(10.55, "boltR");
act.eyesLead(c, 0.22, "vik", [0.45, 0.75]);
act.shock(c, 0.38, "vik", { open: 0.3, hold: 0.5 });
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
act.shock(c, 1.05, "wiz", { open: 0.42, hold: 1.2 });
A(1.0, "wiz", "look", { to: [-0.6, 0.5], dur: 0.12, blink: false });    // where Viking was, and up
c.say(1.25, "wiz", "aaaah!", 0.7, "excited", { sub: "AAAH!", voice: false });
see(0, 1.0, ["spd.face", "vik.face", "wiz.face", "sm", "phone"], "P01: three on the log, Spud on his phone, the tall one behind them");
see(1.0, 1.9, ["spd.face", "wiz.face"], "P02: Viking gone, the Wizard screams, Spud has not moved");

// ---------------------------------------------------------------- 2 SHH 2.0-4.5 (P03): the Wizard looks too
station(2.0, SM_NEAR);
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
if (X) { prop(7.0, "rain", { scale: OFF }, 0.01); prop(14.0, "rain", { scale: 1 }, 0.01); prop(T9X, "rain", { scale: OFF }, 0.01); }
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
const SM_SELF = { ...SM_BIG, x: HANG.spd[0] + 0.75, y: r3(SELFIE.pos[1] + 0.25 - 3 * HEAD_UP), z: -2.2, lean: 0 };
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
  A(T9, w, "face", { lid: 0.6, dur: 0.01 });
  A(T9, w, "expr", { expr: "sad", dur: 0.01 });
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
const beats = c.beats([
  ["P01 the rule", 0, WIDE, "hook"],
  ["P03 shh", 2.0, SHH],
  ["P04 the hand", 4.5, HAND],
  ["P05 the lift", 7.0, HERO],
  ["P06 the jab", 10.0, JAB],
  ["P07 the face", 12.0, SELF, "payoff"],
  ["the drop", 14.0, DROP],
  ["dead", 16.0, "keep"],
  ["P08 nobody looks up", 17.4, LAST, "reaction"],
], END);

write(import.meta.url, {
  id: X ? "doomscroll-01-sprout-man-extreme" : "doomscroll-01-sprout-man",
  title: "Look up and you die",
  idea: "Doomscroll to survive, pilot A: a faceless monster takes everyone who looks up; Spud never looks up from his phone, and the phone's selfie filter saves them all",
  format: "series pilot: Doomscroll to survive (look up and you die; the phone causes the save; the battery is the clock)",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [300, 1360],
  castLook: "sheet", cleanStart: true,
  motion: MOTION, rig: RIG, physics: true, animeTiming: true,
  cover: 8.5,
  set: { type: "env", env: X ? "storm-pine-clearing" : "pine-forest-night",
    // B: above the clouds for the lift, back down for the drop, the flattened forest at dawn for the last picture. The
    // camera gate reads only the first env, so it fails the last shot, which is framed for the dawn painting (it looks
    // up 3 degrees, the storm 12). The gate is off for B for that reason; checked by hand on 11 Nov: with --gate every
    // shot before 17.4 s passes on the storm env, and the last shot passes on the dawn env alone
    ...(X && { swap: [{ at: 7.0, env: "moon-above-storm" }, { at: 14.0, env: "storm-pine-clearing" }, { at: T9X, env: "flattened-forest-dawn" }], envCheck: process.argv.includes("--gate") }),
    shade: "soft", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, life: "auto", cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: hud({ battery: [[0, 5], [2.0, 4, 0.12], [4.5, 3, 0.12], [7.0, 2, 0.12], [10.0, 1, 0.12], [16.0, 0, 0.12], [17.05, 100, 0.35]] }),
  music: { style: "sneaky", lowCut: 150, gain: 0.34, parts: [{ at: 0, part: "main" }, { at: 10.55, part: "stop" }, { at: 12.35, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.06, surface: "dirt", room: "open", guard: true },
  creative: { length: [18, 22] },
  hook: { show: ["spd", "vik", "wiz", "sm", "phone"], hint: 0, what: "a tall faceless figure stands behind three friends at a campfire; one looks up and is gone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spd", with: "log", from: 0, to: 7.4, reason: "Spud sits on the log" },
    { who: "vik", with: "log", from: 0, to: 1.0, reason: "Viking sits on the log" },
    { who: "wiz", with: "log", from: 0, to: 2.7, reason: "the Wizard sits on the log" },
    { who: "spd", with: "log", from: 17.4, to: END + 1.5, reason: "Spud sits on the log" },
    { who: "vik", with: "log", from: 17.4, to: END + 1.5, reason: "Viking sits on the log" },
    { who: "wiz", with: "log", from: 17.4, to: END + 1.5, reason: "the Wizard sits on the log" },
    ...["spd", "vik", "wiz"].map((who) => ({ who, with: "sm", from: 14.7, to: END + 1.5, reason: "Sprout Man's box takes in his long arms and back sprouts, which reach out past the three; his body sits clear of them on the log" })),
    { who: "wiz", with: "staff", from: 16.7, to: END + 1.5, reason: "the Wizard holds his staff (a prop staged at his hand)" },
    { who: "spd", from: 7.3, to: 8.0, checks: ["face-covered", "hand-jump", "palm-turn", ...(X ? ["rig-jump", "motion"] : [])], reason: "he is flipped upside down in half a second with both hands on the phone" + (X ? "; in B he is also yanked six metres up above the clouds in that half second" : "") },
    ...(X ? ["spd", "vik", "wiz"].map((who) => ({ who, from: 14.7, to: 15.45, checks: ["rig-jump", "motion", "hand-jump"], reason: "B: the three fall six metres out of the sky in under half a second (meant to be fast)" })) : []),
  ],
  notes: "Generated by storyboards/series/doomscroll/make-ep1-sprout-man.mjs. Panels: /mnt/project-files/video-scripts/2026-11-11-doomscroll-to-survive/panels-01-sprout-man/. Title added in TikTok's text tool.",
});
