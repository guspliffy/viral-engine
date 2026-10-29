// THE GHOST PHOTO HAD ONE EXTRA GHOST (eight trend tests #01, 29 Oct 2026), built from the clip template.
// node storyboards/ghostphoto/make-ghost-photo.mjs -> storyboards/ghostphoto/ghost-photo.json
//
// THE BRIEF (01-ghost-photo/ENGINE-PROMPT.md: 14.00 s, 420 frames, eight shots, wordless, no loop, no cloth reset)
//   Joke:        three friends pose under bedsheets for a self-timer ghost photo; the middle sheet is Phoenix's and his
//                heat burns it into a real-looking ember ghost, which ends up in the photo as a fourth member.
//   Wants:       the trio want a cool retro ghost photo before the timer runs out.
//   Consequence: Phoenix's sheet rises off him on his unfolding wings and one sweep turns it into a floating ember ghost
//                that keeps its shape and his sunglasses; the timer fires with it hovering above them.
//   Ending:      the finished photograph fills the frame: three baffled potatoes and one sunglasses-wearing ember ghost.
//
//   1 0.00-0.60  close: orange glow and a first curl of smoke at the middle sheet's shoulders, sunglasses above (sizzle)
//   2 0.60-1.20  insert: the tripod camera's amber timer lamp blinks, the lens on the trio                    (beep)
//   3 1.20-2.00  medium trio: Reaper's covered head turns to the glowing middle; the Wizard tries to hold the pose
//   4 2.00-4.40  the sheet rises, Phoenix's face shows; side ghosts lift their hems to peek; his wings unfold after
//   5 4.40-7.20  one controlled sweep turns the sheet into a translucent ember outline with the sunglasses; Phoenix
//                solid and embarrassed below it                                                         (flame whoosh)
//   6 7.20-10.0  wide: the ember ghost floats above Phoenix; all three stare up, then glance at the camera as the timer
//                speeds up (and huddle in for the picture)                                              (faster beeps)
//   7 10.0-12.0  the camera flashes once; the accidental group pose holds                                (click-pff)
//   8 12.0-14.0  the photograph fills the frame: Reaper left, Phoenix middle, Wizard right, the ember ghost above
//
// Blocking (x right, z toward the camera; every shot is from the front, so screen left is the trio's right):
// Reaper screen-left, Phoenix middle, the Wizard screen-right, 1.3 m apart (each sheet is about 1.3 m across at the
// floor). The tripod stands in front of them at foreground-right (x 0.75, z 5), its lens toward them. The sheets are
// props standing at their wearers' feet (props-ghostphoto.js sheetghost) and turn with them; the hands stay under the
// sheets until the side ghosts lift their hems: then both hands hold the gathered front edges at their cheeks.
// Departures from the brief: the hook caption is burned in (project rule since 29 Oct: every clip opens with one);
// the side ghosts huddle in a step before the flash, so all four fit one photograph.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

const c = clip(), { A, sfx } = c;
const END = 14.0;

// ---------------------------------------------------------------- places
const REA0 = [-1.3, 0], PHX = [0, 0.06], WIZ0 = [1.3, 0];
const REA_P = [-1.5, 0], WIZ_P = [1.5, 0];                     // a half step back as they peek (clear of his wings)
const REA1 = [-1.22, 0.3], WIZ1 = [1.22, 0.3];                 // the huddle for the picture: in and forward
const TRI = { x: 0.75, z: 5.0, h: 0.85 };                      // the tripod camera, lens toward the trio (-z)
const LENS = [TRI.x, TRI.h, TRI.z - 0.2];
const FLASH = 10.0, SNAP = 10.03;
// the timer: one blink a second at first, faster over the last 1.4 s
const BLINKS = [...Array.from({ length: 19 }, (_, i) => r3(0.25 + i * 0.45)), 8.85, 9.15, 9.4, 9.58, 9.72, 9.83, 9.92];

const SHEET = { r: 0.5, hem: 0.66, dz: 0.92, eyeY: 0.8, lift: 0.88 };
const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: REA0, face: "camera", expr: "deadpan", follow: 0.2, seed: 4.1 },
  { id: "phx", character: "duo/phoenix", at: PHX, face: "camera", expr: "kind", span: 0, follow: 0.3, seed: 1.7 },
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ0, face: "camera", expr: "kind", follow: 0.5, seed: 2.6 },
];
const props = [
  { id: "floor", kind: "cobbles", x: 0, z: 1.5, w: 14, d: 13, seed: 4, leaves: 16 },
  { id: "s-rea", kind: "sheetghost", x: REA0[0], z: REA0[1], seed: 1, h: 1.42, ...SHEET },
  { id: "s-phx", kind: "sheetghost", x: PHX[0], z: PHX[1], seed: 2, h: 1.45, ...SHEET, glow: 0.45, puff: 0.5 },
  { id: "s-wiz", kind: "sheetghost", shape: "hat", x: WIZ0[0], z: WIZ0[1], seed: 3, hatTip: 1.76, brimY: 1.13, brimR: 0.55, tipBend: [0.1, -0.18], ...SHEET },
  { id: "cam", kind: "tripodcam", x: TRI.x, z: TRI.z, h: TRI.h, blinks: BLINKS, flash: FLASH },
];

// eye targets: + right on screen, + up
const UP = [0, 0.95], AT_CAM = [0.06, -0.05];

// ---------------------------------------------------------------- everyone: arms in under the sheets, no auto blinks
const tuck = (t, who, dur = 0.01) => { c.arm(t, who, "R", { x: [-0.42, 0.34, 0.04] }, dur); c.arm(t, who, "L", { x: [0.42, 0.34, 0.04] }, dur); };
for (const w of ["rea", "phx", "wiz"]) { tuck(0, w); A(0, w, "noblink"); A(0, w, "still", { dur: 2.2, idle: 0.08 }); }
A(0, "phx", "look", { to: [0, 0.1], dur: 0, blink: false });

// ---------------------------------------------------------------- 1 CLUE 0.0-0.6: the middle sheet glows and smokes
c.prop(0, "s-phx", { glow: 1, puff: 1 }, 0.6, "out");                // the heat blooms inside the first shot
sfx(0.05, "sizzle", { gain: 0.5, dur: 1.4, reason: "the sheet starting to smoulder at Phoenix's shoulders (on screen)" });
c.cap(0, 2.0, "Our ghost photo had one extra ghost.", 250, false, { kinetic: false });

// ---------------------------------------------------------------- 2 TIMER 0.6-1.2: why they hold still
for (const b of BLINKS) if (b > 0.6 && b < 1.2) sfx(b, "timer-beep", { gain: 0.32, reason: "the self-timer lamp blinking (on screen)" });

// ---------------------------------------------------------------- 3 TRIO 1.2-2.0: eyelines converge on the glow
A(1.15, "rea", "look", { to: [0.6, 0.1], dur: 0.15, blink: false });
A(1.28, "rea", "turn", { to: 45, dur: 0.4, ease: "out" });
c.prop(1.28, "s-rea", { rot: 45 }, 0.4, "out");
sfx(1.3, "cloth", { gain: 0.35, reason: "Reaper's sheet turning" });
A(1.42, "wiz", "turn", { to: -24, dur: 0.14 });                 // the Wizard sneaks a glance (a flinch) ...
c.prop(1.42, "s-wiz", { rot: -24, squash: 0.06 }, 0.14); c.prop(1.56, "s-wiz", { squash: 0 }, 0.16);
A(1.76, "wiz", "turn", { to: 0, dur: 0.12 });                   // ... and snaps back into the pose
c.prop(1.76, "s-wiz", { rot: 0 }, 0.12);
for (const b of BLINKS) if (b > 1.2 && b < 2.0) sfx(b, "timer-beep", { gain: 0.2, reason: "the timer lamp (tripod in the foreground)" });

// ---------------------------------------------------------------- 4 REVEAL 2.0-4.4: the sheet rises, faces show
// a quiet beat (2.0-2.3), then the hot sheet lifts off Phoenix; his face shows as the hem passes his eyes (~2.95 s)
c.prop(2.3, "s-phx", { rise: 0.95 }, 0.95, "inOut");
sfx(2.32, "whoosh", { gain: 0.28, reason: "the sheet lifting off Phoenix" });
A(2.4, "phx", "look", { to: [0, 0.75], dur: 0.3, blink: false });
A(2.9, "phx", "expr", { expr: "kind", set: { tilt: 0.34, curve: 0.38, open: 0.12, eye: 1.02, smirk: 0.32 }, dur: 0.3 });   // caught out: worried brows, a sheepish smile
A(2.9, "phx", "face", { brow: 0.25, dur: 0.3 });
A(2.9, "phx", "still", { dur: 1.2, idle: 0.1 });
c.arm(2.95, "phx", "R", "rest", 0.4); c.arm(2.95, "phx", "L", "rest", 0.4);
// the side ghosts peek: both hands gather the front hem up to the forehead and hold its edges at the cheeks
const peek = (t, who, sheet, s, back) => {
  A(t, who, "move", { to: back, dur: 0.35, steps: 1.6 }); c.prop(t, sheet, { x: back[0], z: back[1] }, 0.35);   // a half step back: "whoa"
  c.arm(t, who, "R", { x: [-0.42, 0.58, 0.33] }, 0.42, "inOut"); c.arm(t, who, "L", { x: [0.42, 0.58, 0.33] }, 0.42, "inOut");
  A(t, who, "grip", { side: "both", shape: "hold", dur: 0.2 });
  c.prop(t, sheet, { open: 1 }, 0.42, "inOut");
  sfx(t + 0.05, "cloth", { gain: 0.4, pan: s * 0.4, reason: "a sheet hem lifted to peek" });
};
peek(2.6, "rea", "s-rea", -1, REA_P);
A(2.62, "rea", "look", { to: [0.75, 0.35], dur: 0.25, blink: false });
peek(2.78, "wiz", "s-wiz", 1, WIZ_P);
A(2.8, "wiz", "look", { to: [-0.75, 0.35], dur: 0.25, blink: false });
act.mood(c, 3.05, "wiz", "shocked", { strength: 0.6, hold: 1.1 });
// only once the hem is up: his wings unfold, lifting the sheet clear
c.prop(3.25, "s-phx", { rise: 1.5 }, 0.5, "out");               // the wings kick it the rest of the way up
A(3.3, "phx", "span", { to: 1, dur: 0.25 });
A(3.32, "phx", "wings", { to: 1, dur: 0.4, ease: "out" });
sfx(3.36, "wing-flap", { gain: 0.6, reason: "his wings unfolding" });
A(3.9, "phx", "look", { to: [0, 0.95], dur: 0.25, blink: false });
A(4.05, "rea", "look", { to: [0.45, 0.95], dur: 0.25, blink: false });
A(4.1, "wiz", "look", { to: [-0.45, 0.95], dur: 0.25, blink: false });

// ---------------------------------------------------------------- 5 EMBER 4.4-7.2: one sweep, cloth to ember outline
c.prop(4.6, "s-phx", { burn: 1 }, 1.25, "inOut");
c.prop(4.6, "s-phx", { glow: 0, puff: 0.6 }, 0.6);
sfx(4.6, "sig-phoenix", { gain: 0.7, reason: "the sweep of flame through the sheet: Phoenix's own fire" });
sfx(4.9, "sizzle", { gain: 0.35, dur: 1.0, reason: "the sweep crackling through the cloth" });
c.prop(5.5, "s-phx", { wobble: 1, rise: 1.56 }, 1.2, "inOut");
A(4.7, "phx", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.15 }, dur: 0.2 });
A(5.9, "phx", "expr", { expr: "kind", set: { tilt: 0.36, curve: 0.42, open: 0.1, eye: 1.0, smirk: 0.35 }, dur: 0.35 });   // embarrassed
A(5.95, "phx", "look", { to: [-0.6, 0.05], dur: 0.25, blink: false });          // a glance at Reaper ...
A(6.55, "phx", "look", { to: AT_CAM, dur: 0.25, blink: false });              // ... then a sheepish look at us
A(6.7, "phx", "wings", { to: 0, dur: 0.8, ease: "inOut" });                     // wings tucked in, embarrassed
A(6.9, "phx", "span", { to: 0.25, dur: 0.6 });
A(6.6, "phx", "blink", { dur: 0.2 });

// ---------------------------------------------------------------- 6 WIDE 7.2-10.0: the fourth member; the timer speeds up
A(7.3, "phx", "look", { to: UP, dur: 0.3, blink: false });
A(7.35, "rea", "look", { to: [0.35, 0.95], dur: 0.3, blink: false });
A(7.4, "wiz", "look", { to: [-0.35, 0.95], dur: 0.3, blink: false });
A(7.3, "rea", "still", { dur: 1.4, idle: 0.06 }); A(7.3, "wiz", "still", { dur: 1.4, idle: 0.06 });
for (const b of BLINKS) if (b > 7.2 && b < FLASH) sfx(b, "timer-beep", { gain: b > 8.5 ? 0.42 : 0.25, reason: "the self-timer counting down, faster at the end (tripod on screen)" });
// they notice the timer: eyes to the camera, then a hurried shuffle in and a frozen pose
A(8.75, "phx", "look", { to: AT_CAM, dur: 0.18, blink: false });
A(8.8, "rea", "look", { to: AT_CAM, dur: 0.18, blink: false });
A(8.85, "wiz", "look", { to: AT_CAM, dur: 0.18, blink: false });
act.mood(c, 8.85, "wiz", "shocked", { strength: 0.8, hold: 0.5 });
A(9.1, "rea", "turn", { to: 0, dur: 0.25 }); c.prop(9.1, "s-rea", { rot: 0 }, 0.25);   // (he turned back to the camera at the peek too)
A(9.15, "rea", "move", { to: REA1, dur: 0.5, steps: 2.4 }); c.prop(9.15, "s-rea", { x: REA1[0], z: REA1[1] }, 0.5);
A(9.2, "wiz", "move", { to: WIZ1, dur: 0.5, steps: 2.4 }); c.prop(9.2, "s-wiz", { x: WIZ1[0], z: WIZ1[1] }, 0.5);
// the pose the photo keeps: everyone baffled, Phoenix still embarrassed
A(9.45, "phx", "expr", { expr: "kind", set: { tilt: 0.4, curve: 0.15, open: 0.3, eye: 1.08, smirk: 0.25 }, dur: 0.25 });   // a sheepish grimace
A(9.45, "phx", "face", { brow: 0.35, dur: 0.25 });
A(9.5, "rea", "expr", { expr: "deadpan", set: { eye: 0.78, curve: -0.12, smirk: 0.2 }, dur: 0.25 });
A(9.5, "rea", "face", { browL: 0.5, dur: 0.25 });
A(9.5, "wiz", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.12, curve: 0.05 }, dur: 0.25 });
for (const w of ["rea", "phx", "wiz"]) A(9.75, w, "still", { dur: 1.7, idle: 0.02 });

// ---------------------------------------------------------------- 7 FLASH 10.0-12.0: one flash, the pose holds
c.at(FLASH, { fx: "flash", dur: 0.25, peak: 0.85 });   // 0.85: the most the checks allow (a pure white frame reads as a glitch)
sfx(FLASH, "flash", { gain: 0.8, reason: "the camera firing (the flash on screen)" });
// the flash-blink, then the baffled looks
for (const [w, dt] of [["phx", 0.0], ["rea", 0.06], ["wiz", 0.03]]) A(10.4 + dt, w, "blink", { dur: 0.22 });
A(10.7, "rea", "look", { to: [0.35, 0.95], dur: 0.3, blink: false });
A(10.75, "wiz", "look", { to: [-0.6, 0.1], dur: 0.3, blink: false });
A(10.8, "phx", "look", { to: [0.2, 0.9], dur: 0.3, blink: false });

// ---------------------------------------------------------------- 8 THE PHOTO 12.0-14.0
c.at(12.0, { fx: "photo", style: "print", dur: 2.0, shot: SNAP, aspect: 1.05, w: 1000, pos: [540, 880], tilt: -2.5, dim: 0.62, push: 0.03,
  cam: { pos: LENS, look: [0, 1.5, 0], fov: 62 }, hide: ["cam"] });
sfx(12.0, "book-flip", { gain: 0.3, reason: "the print dropping in" });

// ---------------------------------------------------------------- shots
const SHOTS = {
  clue: { pos: [0.05, 1.24, 3.7], look: [0, 1.04, 0], fov: 44 },
  timer: { pos: [1.02, 1.16, 6.2], look: [0.62, 0.88, 4.6], fov: 38 },
  trio: { pos: [0.45, 1.1, 5.4], look: [0, 1.0, 0], fov: 50 },
  rise: { pos: [0, 1.4, 5.8], look: [0, 1.35, 0], fov: 52, to: { pos: [0, 1.5, 5.3], look: [0, 1.45, 0], fov: 52 } },
  ember: { pos: [0, 1.75, 4.4], look: [0, 1.62, 0], fov: 48, to: { pos: [0, 1.8, 4.1], look: [0, 1.72, 0], fov: 48 } },
  wide: { pos: [0.35, 1.5, 8.6], look: [0, 1.38, 0], fov: 46, to: { pos: [0.35, 1.55, 7.0], look: [0, 1.55, 0], fov: 44 } },
  flash: { pos: [1.7, 1.0, 6.4], look: [0, 1.35, 0], fov: 50 },
};
const beats = c.beats([
  ["clue", 0, SHOTS.clue, "hook"],
  ["timer", 0.6, SHOTS.timer],
  ["trio", 1.2, SHOTS.trio],
  ["reveal", 2.0, SHOTS.rise, "reveal"],
  ["ember", 4.4, SHOTS.ember],
  ["fourth member", 7.2, SHOTS.wide],
  ["flash", FLASH, SHOTS.flash, "payoff"],
  ["the photo", 12.0, "keep"],
], END);

const sheetsOn = (who, sheet, to = END, why = "wears the sheet") => ({ who, with: sheet, from: 0, to, reason: `${who} ${why} (props-ghostphoto.js sheetghost: a costume over the whole body)` });
write(import.meta.url, {
  id: "ghost-photo",
  title: "The Ghost Photo Had One Extra Ghost",
  idea: "Eight trend tests #01 (ghost photoshoot trend): Phoenix's sheet turns into an ember ghost that ends up in the photo",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  set: { type: "plain", color: "#25305e", floor: "#4a424e", light: "golden", key: [3.2, 4.2, 4.0],
    plate: { src: "assets/plates/courtyard-dusk.png", z: -2.6, center: [0, 3.6], height: 9.6, tint: "#9aa3d4" } },
  music: { style: "sneaky", drums: false },
  sound: { sfx: 0.7, ambience: 0.3, speech: false, surface: "concrete", signature: false },
  hook: { show: ["s-phx"], hint: 0, what: "the middle ghost's sheet already glows orange and smokes at the shoulders" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    sheetsOn("rea", "s-rea"), sheetsOn("wiz", "s-wiz"), sheetsOn("phx", "s-phx", 3.4, "wears the sheet until it lifts clear"),
    { who: "phx", with: "s-rea", from: 0, to: END, reason: "Phoenix's tucked hand under the edge of Reaper's sheet hem beside him (the sheets nearly touch for the pose)" },
    { who: "phx", with: "s-wiz", from: 0, to: END, reason: "Phoenix's tucked hand under the edge of the Wizard's sheet hem beside him" },
  ],
  notes: "Generated by storyboards/ghostphoto/make-ghost-photo.mjs. Brief: Jonny's eight trend tests pack, 01-ghost-photo.",
});
