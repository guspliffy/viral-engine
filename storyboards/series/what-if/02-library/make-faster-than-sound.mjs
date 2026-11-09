// WHAT IF YOUR HYPER FRIEND WAS FASTER THAN SOUND IN A LIBRARY? (What if, episode 2, 9 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md, series format
// 00-SERIES-FORMAT.md there, Jonny's eight panels storyboards/01-faster-than-sound-library/storyboard-eight-panels.png
// (they win; PANELS.md here grades the clip against them by line and by number).
//   node storyboards/series/what-if/02-library/make-faster-than-sound.mjs -> faster-than-sound.json
//
// THE BRIEF
//   Joke:        Phoenix can't sit still in the library, so he moves faster than sound and nobody hears a thing: he
//                fetches a book, shelves a whole cart, runs 100 laps. Each trip his sound arrives a moment late (a puff,
//                then a thump). He sits down perfectly quiet. Then all the sound he outran arrives at once: BOOM.
//   Wants:       Phoenix wants to burn off energy without making a sound; Reaper and the librarian want quiet.
//   Consequence: the delayed boom blasts every book off every shelf.
//   Ending:      Reaper buried to his hood with a page on his face, Phoenix's sheepish "...sorry.", the librarian's glare.
//   Callback:    0 s the librarian's "SHHH!" at the bouncing friend; the end, the loudest noise the library ever heard.
// The power: the word "Zoom!" (a whisper the first time, a shout the third), the sound (a whip-crack, then the music
// drops to silence while he's away, a soft "fwip" when he's back) and the look (an orange flame streak with three
// fading after-images, loose pages fluttering behind it). The rule, planted twice: 0.7 s after each return a late
// puff of his own sound arrives (small, then bigger); nobody but the viewer notices.
// The test this episode carries (told to Jonny, 9 Nov): a ticking clock. In the calm before the boom the longcase
// clock ticks louder each time, so the viewer who learned the rule waits for the boom.
//
// STAGING PROOF (workflow v2): blocked with the library props Too Much Energy 01 left (libstack, libdesk, libdais,
// greenlamp, libbook, libladder) and stand-ins for what the builders will make (marked STAND-IN): the hanging sign,
// the longcase clock, the brass book cart, the swinging lamps, the flame streak and ring, the book blast and pile.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const END = 18.9;   // + the BOOM's 3-frame hit-stop = exactly 19.0 s of video (series format)

// the beat grid (00-SERIES-FORMAT.md) and this clip's times
const TRIP1 = [1.0, 2.2], TRIP2 = [4.6, 5.6], TRIP3 = [8.0, 11.1];   // he's away (the streak, the silence)
const PUFF1 = 2.9, THUMP2 = 6.3, BOOM = 13.5;                         // his late sound: small, bigger, all of it
const TICKS = [11.9, 12.4, 12.9, 13.3];                               // the clock, louder each time (the test)
const S_REA = 1.55, S_TWO = 2.2, S_WALL = 4.0, S_LAPS = 7.3, S_HIGH = 8.0, S_SIT = 11.0, S_CLOCK = 12.25, S_BACK = 12.75, S_AFTER = 16.0;

// ---------------------------------------------------------------- places (x right, z toward the camera)
// One camera side all clip (panels): the arched windows on the left, the issue desk at the back under the hanging
// sign, the shelves with the gallery behind it, the ladder at the right. The reading table in front with Reaper behind
// it on the right and his tower between him and Phoenix. The room is deep (the desk 5.4 m behind the table), so the
// wall wide (panel 04) can stand between the table and the desk and still see Phoenix whole.
const TABLE = [-0.7, 0], TABLE_Y = 0.62, TABLE_W = 1.7, TABLE_D = 0.8;
const REA = [0.05, -0.72], PHX0 = [-2.15, 0.65], PHX_SEAT = [-1.25, -0.72], PHX_BACK = [-2.05, -0.7];   // PHX_BACK: where he lands with the book, nearer Reaper (panel 03)   // the seats behind the table (chairs facing us)
const TOWER = [-0.75, -0.08];   // between the two seats, clear of both faces
const DESK = [-0.4, -5.0], DAIS = [-0.4, -5.35], DAIS_H = 0.5, DESK_H = 0.45, SOR = [-0.4, -5.5];   // x -0.4: from the table camera the librarian shows between the tower and Reaper (panel 06)
const SHELF_Z = -6.5, SHELF_H = 2.7;
const CART = [0.6, -4.0], PHX_POSE = [-1.0, -3.25];   // in front of the dais, clear of it
const CLOCK = [-1.85, -6.05];   // left of the dais, in front of the shelves
const FAR = [-9, 9];   // where Phoenix waits (hidden) while he's away: behind every camera

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 15, expr: "eager", follow: 0.35, seed: 1.7, span: 0.45 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: -8, expr: "deadpan", follow: 0.2, seed: 4.1 },
  { id: "sor", character: "potatobrawl/sorcerer", at: SOR, y: DAIS_H, face: 0, expr: "deadpan", follow: 0.2, seed: 5.7 },
];

// the tower: 15 books stacked on the table between them (panel 01: its top above Reaper's hood)
const TOWER_N = 15, BOOK_T = 0.05;
const TW = (i) => `tw${i}`;
const tower = Array.from({ length: TOWER_N }, (_, i) => ({ id: TW(i), kind: "libbook", x: r3(TOWER[0] + ((i * 37) % 7 - 3) * 0.006), y: r3(TABLE_Y + 0.004 + i * BOOK_T), z: r3(TOWER[1] + ((i * 53) % 5 - 2) * 0.006),
  rot: (i * 29) % 24 - 12, w: r3(0.2 + ((i * 7) % 3) * 0.02), h: r3(0.28 + ((i * 11) % 3) * 0.02), t: BOOK_T, seed: 40 + i, body: { density: 500, friction: 0.8, bounce: 0.1 } }));

// the back wall of shelves behind the desk (one row, faces to us), the ladder on its right
const SHELVES = [-1.9, -0.2, 1.5, 3.2].map((x, i) => ({ id: `sh${i}`, kind: "libstack", x, z: SHELF_Z, rot: 0, l: 1.7, h: SHELF_H, d: 0.44, shelves: 6, seed: 3 + i * 11 }));
// the other reading tables round the room (panel 05's high wide), each with its green lamp and a chair
const TABLES2 = [[-3.4, -2.2], [2.9, -1.2], [-3.6, 1.9], [3.0, 2.6]];
const BIG = { w: 0.26, h: 0.34, t: 0.07 };   // the big book from the top shelf (panel 03)
const props = [
  { id: "floor", kind: "libfloor", x: 0, z: -1, w: 18, d: 22, seed: 21 },
  { id: "table", kind: "table", x: TABLE[0], z: TABLE[1], w: TABLE_W, d: TABLE_D, color: "#7a4a2c", legs: "#4e2e1a" },
  { id: "chairR", kind: "chair", x: REA[0], z: REA[1], rot: 0, scale: 0.7 },   // low chairs: the table at their chins, as the panels draw them
  { id: "chairL", kind: "chair", x: PHX_SEAT[0], z: PHX_SEAT[1], rot: 0, scale: 0.7 },
  ...tower,
  { id: "rbook", kind: "libbook", x: r3(REA[0] - 0.02), y: r3(TABLE_Y + 0.02), z: r3(TABLE[1] - 0.04), rot: 0, w: 0.17, h: 0.24, t: 0.04, color: "#7a2e2a", open: 1, stand: 0, seed: 8 },
  { id: "bbook", kind: "libbook", x: r3(TABLE[0] + 0.55), y: r3(TABLE_Y + 0.02), z: 0.17, rot: 8, w: 0.18, h: 0.25, t: 0.05, color: "#35506b", seed: 9 },
  { id: "bigbook", kind: "libbook", x: FAR[0], y: 0.5, z: FAR[1], rot: 0, ...BIG, color: "#7a2e2a", stand: 1, seed: 12, staged: "kept off stage until he brings it back from the top shelf" },
  { id: "dais", kind: "libdais", x: DAIS[0], z: DAIS[1], w: 2.4, d: 1.6, h: DAIS_H },
  { id: "desk", kind: "libdesk", x: DESK[0], y: DAIS_H, z: DESK[1], w: 2.0, h: DESK_H },
  { id: "orb", kind: "greenlamp", x: r3(DESK[0] + 0.72), y: r3(DAIS_H + DESK_H), z: r3(DESK[1] + 0.02), color: "#3f8f4f" },   // STAND-IN for the green orb on its stand
  ...SHELVES,
  { id: "ladder", kind: "libladder", x: 2.0, z: r3(SHELF_Z + 0.5), rot: 0, h: 2.4, w: 0.5, lean: 12 },
  { id: "cart", kind: "cart", x: CART[0], z: CART[1], rot: -20 },                       // STAND-IN for the brass book cart
  { id: "lampL", kind: "pendant", x: -0.7, y: 3.3, z: -4.4, len: 1.3, r: 0.22, staged: "hangs from the ceiling on its chain" },        // STAND-IN for the swinging brass lamps
  { id: "lampR", kind: "pendant", x: 0.6, y: 3.3, z: -4.6, len: 1.3, r: 0.22, staged: "hangs from the ceiling on its chain" },
  { id: "plant", kind: "bistroplant", x: -1.8, z: -4.75 },
  // the longcase clock (STAND-IN until it is built: a tall case with the wall clock on it, so the insert frames it)
  { id: "clockcase", kind: "libstack", x: CLOCK[0], z: CLOCK[1], rot: 0, l: 0.5, h: 2.1, d: 0.3, shelves: 1, seed: 40 },
  { id: "clockface", kind: "clock", x: CLOCK[0], y: 1.75, z: r3(CLOCK[1] + 0.19), rot: 0, staged: "on the front of the clock case" },
  ...TABLES2.flatMap(([x, z], i) => [
    { id: `t2${i}`, kind: "table", x, z, w: 1.5, d: 0.8, color: "#7a4a2c", legs: "#4e2e1a" },
    { id: `t2l${i}`, kind: "greenlamp", x: r3(x + 0.35), y: TABLE_Y, z: r3(z - 0.1) },
    { id: `t2c${i}`, kind: "chair", x: r3(x - 0.3), z: r3(z - 0.6), rot: 0 },
  ]),
  { id: "page", kind: "paper", x: FAR[0], y: 0.2, z: FAR[1], rot: 0, staged: "off stage, then stuck to Reaper's face by the blast" },                 // the page that ends up on Reaper's face
  { id: "dust", kind: "dustmotes", x: -0.5, y: 1.8, z: -1.5, n: 70, box: [6, 3, 6], color: "#fff4d6" },
  { id: "beam", kind: "lightbeam", x: -3.0, y: 4.2, z: -1.5, rot: 30, tip: -50, len: 6, w: 1.8, color: "#fff2cc", glow: 0.3 },
];

// ---------------------------------------------------------------- helpers
const setup = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01 }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01 }); };
const SUB = 440, SUB_HI = 600, DEMO = 260;   // the long-lens wides put every face low (0.55-0.67), so lines and demo captions go above them, inside the safe zone (y 210-1360; camfit spots, 9 Nov)
const AWAY = [], FX = [];   // FX: drawn effect cels (engine/page/fxcel.js), absolute times   // [from, to] of every trip (allowClip windows below)
// the power: the word, the whip-crack, gone in one frame (the streak in his place; STAND-IN: a poof)
function zoom(t, { loud = false, word = r3(t - 0.12), pos = SUB } = {}) {
  c.say(word, "phx", loud ? "ZOOM!" : "Zoom!", 0.3, loud ? "excited" : "whisper", { pos });
  sfx(t, "whoosh", { gain: 0.9, reason: "the power: the whip-crack as he breaks the sound barrier (STAND-IN until a crack is whitelisted)" });
  A(t, "phx", "hide");
  A(r3(t + 0.02), "phx", "move", { to: FAR, dur: 0.01 });
}
// back in one frame, wherever the trip ends (STAND-IN for the streak arriving: a poof)
function fwip(t, at, yaw, away) {
  setup(t, "phx", at, yaw);
  A(t, "phx", "show");
  sfx(t, "zip", { gain: 0.35, reason: "he's back: a soft fwip as the sound returns (STAND-IN)" });
  AWAY.push([away, t]);
}

// ================================================================ 1 FRAME 0, 0-1.0: "SHHH!" and the bouncing friend
// Panel 01: Phoenix mid-hop at the front left, wings twitching, the table shaking and the tower wobbling; Reaper
// reading deadpan; the Sorcerer behind the desk, finger to his lips.
A(0, "phx", "look", { to: [0.35, 0.25], dur: 0.01, blink: false });   // toward the desk at the back
A(0, "phx", "noblink");
A(0, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 1.15 }, dur: 0.01 });
for (const t of [-0.15, 0.42]) A(t, "phx", "hop", { height: 0.2, dur: 0.36 });   // the first already in the air at frame 0 (panel 01: mid-hop)
A(0, "phx", "wings", { to: 1, dur: 0 }); A(0.42, "phx", "wings", { to: 1, dur: 0.1, ease: "out" });
for (const t of [0.08, 0.6]) A(t, "phx", "wings", { to: 0.35, dur: 0.16 });
c.arm(0, "phx", "R", { x: [-0.2, 0.32, 0.4] }, 0.01); c.arm(0, "phx", "L", { x: [0.2, 0.32, 0.4] }, 0.01);   // fists at his chest, bursting
A(0, "phx", "grip", { side: "both", shape: "fist", dur: 0.01 });
// Reaper: seated, reading, deadpan, the open book flat on the table, his gloves on its edges
A(0, "rea", "sit", { seat: "chairR", dur: 0.01, hands: "keep" });
A(0, "rea", "look", { to: [-0.05, -0.55], dur: 0.01, blink: false }); A(0, "rea", "face", { lid: 0.5, dur: 0.01 });
c.arm(0, "rea", "R", { x: [-0.22, 0.33, 0.38] }, 0.01); c.arm(0, "rea", "L", { x: [0.19, 0.33, 0.38] }, 0.01);   // gloves on the book's edges, not in it
// the Sorcerer: finger to his lips, glaring at Phoenix
A(0, "sor", "look", { to: [-0.3, -0.15], dur: 0.01, blink: false });
A(0, "sor", "expr", { expr: "annoyed", dur: 0.01 });
c.arm(0, "sor", "R", { x: [-0.03, 0.34, 0.4] }, 0.01); c.arm(0, "sor", "L", { x: [0.2, 0.37, 0.3] }, 0.01);   // his other hand on the desk   // finger at his lips, under his eyes A(0, "sor", "grip", { side: "R", shape: "point", dur: 0.01 });
c.say(0, "sor", "SHHH!", 0.35, "whisper", { pos: SUB_HI });
c.arm(0.6, "sor", "R", { x: [-0.24, 0.36, 0.42] }, 0.35, "inOut"); c.arm(0.95, "sor", "R", { x: [-0.2, 0.37, 0.3] }, 0.35, "inOut"); A(0.95, "sor", "grip", { side: "R", shape: "relaxed", dur: 0.3 });   // down and out past his chin, then back on his desk (clear of his eyes; a "rest" hand would go through the desk)
cap(0, 0.97, "Too hyper for a library?", DEMO);
c.say(0.25, "phx", "I'll be quiet!", 0.5, "whisper", { pos: SUB });
see(0, 0.95, ["phx.face", "rea.face", "sor.face", TW(TOWER_N - 1)], "frame 0: the hyper friend bouncing in the library, the librarian's shush, Reaper's tower");

// ================================================================ 2 SNAP 1, 1.0-2.2: gone (the streak, silence)
zoom(TRIP1[0], { word: 0.8 });
A(1.12, "rea", "look", { to: [-0.75, 0.0], dur: 0.35, blink: false });   // his eyes slide to the empty spot (panel 02)
A(1.2, "sor", "look", { to: [-0.45, -0.15], dur: 0.3, blink: false }); A(1.25, "sor", "expr", { expr: "shocked", set: { open: 0.1, eye: 1.15 }, dur: 0.25 });
see(1.05, S_REA, ["rea.face", "sor.face"], "Phoenix gone: only the streak; Reaper's eyes slide to where he was");
// the victim (stakes by 1.5 s): Reaper and his tower, the tower trembling (STAND-IN: the book blast prop's wobble)
A(S_REA, "rea", "still", { dur: 0.6, idle: 0.05 });
A(1.75, "rea", "look", { to: [-0.35, 0.45], dur: 0.3, blink: false });   // up at his tower
see(r3(S_REA + 0.05), S_TWO, ["rea.face", TW(TOWER_N - 1)], "Reaper's eyes on the empty spot, then on his tower beside him");

// ================================================================ 3 DEMO 1, 2.2-4.0: the book from the top shelf
// Panel 03: he's back the instant the sound returns, holding a big book up in both gloves, grinning. 0.7 s later his
// own sound catches up: a small puff flips Reaper's page and lifts his hood.
const BIG_AT = [r3(PHX_BACK[0] + 0.04), 0.7, r3(PHX_BACK[1] + 0.4)];   // held up at his chest (he hovers 0.28)
c.prop(r3(TRIP1[1] - 0.03), "bigbook", { x: BIG_AT[0], y: BIG_AT[1], z: BIG_AT[2], rot: 0, stand: 1 }, 0.01);
const HOLD = (s) => ({ prop: "bigbook", grip: [s * (BIG.w / 2 + 0.05), 0.02, 0], palm: true });
c.arm(r3(TRIP1[1] - 0.02), "phx", "R", HOLD(-1), 0.01); c.arm(r3(TRIP1[1] - 0.02), "phx", "L", HOLD(1), 0.01);
A(r3(TRIP1[1] - 0.02), "phx", "grip", { side: "both", shape: "hold", dur: 0.01 });
A(r3(TRIP1[1] - 0.01), "phx", "grab", { prop: "bigbook", hand: "both", grip: [0, 0, 0], dur: 0, pose: null });
A(r3(TRIP1[1] - 0.02), "phx", "look", { to: [0.1, 0.05], dur: 0.01, blink: false });
fwip(TRIP1[1], PHX_BACK, 10, TRIP1[0]);
A(r3(TRIP1[1] - 0.01), "phx", "move", { to: PHX_BACK, y: 0.28, dur: 0.01 }); A(TRIP1[1], "phx", "hover");   // too hyper to stand: he hovers, wings going (panel 03)
act.grin(c, r3(TRIP1[1] + 0.05), "phx");
A(r3(TRIP1[1] + 0.05), "phx", "wings", { to: 0.7, dur: 0.15, ease: "out" });
A(2.3, "rea", "look", { to: [-0.1, -0.5], dur: 0.25, blink: false });   // back to his book: nothing happened
// the late puff: his own small sound arrives, the page flips, the hood lifts
sfx(PUFF1, "poof", { gain: 0.4, reason: "the rule, planted once: his sound arrives 0.7 s late, a small puff of air" });
sfx(r3(PUFF1 + 0.02), "book-flip", { gain: 0.5, reason: "the puff flips Reaper's page" });
A(PUFF1, "rea", "face", { lid: 0.9, dur: 0.05 }); A(r3(PUFF1 + 0.2), "rea", "face", { lid: 0.5, dur: 0.12 });
A(PUFF1, "rea", "lean", { to: 5, dur: 0.08 }); A(r3(PUFF1 + 0.12), "rea", "lean", { to: 0, dur: 0.3, ease: "settle" });
A(PUFF1, "rea", "hat", { spin: [-14, 0, 0], dur: 0.08 }); A(r3(PUFF1 + 0.15), "rea", "hat", { spin: [0, 0, 0], dur: 0.35, ease: "settle" });
A(3.25, "rea", "look", { to: [-0.8, 0.05], dur: 0.5, blink: false });   // the slow look at Phoenix
act.mood(c, 3.35, "rea", "annoyed", { hold: 0.5 });
see(S_TWO, S_WALL, ["phx.face", "rea.face", "bigbook"], "he's back with the book; the late puff flips Reaper's page; Reaper's slow look");

// ================================================================ 4 DEMO 2, 4.0-7.3: a whole cart of books
// Panel 04: the Sorcerer points at the overloaded cart; ZOOM (silence) the books blur into the gaps; back: the
// shelves full, the cart spinning empty, Phoenix posing beside it. The bigger late thump: lamps swing, the Sorcerer is
// blown sideways, the sparrow on the sill flinches.
A(r3(S_WALL - 0.02), "phx", "release", { prop: "bigbook", to: [r3(TABLE[0] - 0.55), r3(TABLE_Y + 0.02), r3(TABLE[1] + 0.15)], dur: 0.01 });
c.prop(r3(S_WALL - 0.02), "bigbook", { stand: 0, rot: 85 }, 0.01);
c.arm(r3(S_WALL - 0.02), "phx", "R", "rest", 0.01); c.arm(r3(S_WALL - 0.02), "phx", "L", "rest", 0.01);
A(r3(S_WALL - 0.02), "phx", "grip", { side: "both", shape: "relaxed", dur: 0.01 });
cap(S_WALL, 4.9, "Need a whole shelf?", DEMO);
A(4.1, "sor", "look", { to: [0.55, -0.35], dur: 0.2, blink: false });   // at the cart
c.arm(4.1, "sor", "L", { x: [0.32, 0.4, 0.34] }, 0.4, "inOut"); A(4.25, "sor", "grip", { side: "L", shape: "point", dur: 0.25 });   // his left hand: the cart is on his left
act.mood(c, 4.15, "sor", "annoyed", { hold: 0.4 });
zoom(TRIP2[0], { word: 4.35, pos: 1100 });   // off screen: under the librarian, where the wall shot is free
// the books blur into the shelves (STAND-IN: the cart and the shelves' gaps come with the builders' cart and wall)
A(5.0, "phx", "drop", { to: 0, dur: 0.01 });   // (while he is away: back on his feet for the pose)
fwip(TRIP2[1], PHX_POSE, 10, TRIP2[0]);
A(r3(TRIP2[1] - 0.02), "phx", "expr", { expr: "smug", dur: 0.01 }); A(r3(TRIP2[1] - 0.02), "phx", "face", { lid: 1, dur: 0.01 });
A(r3(TRIP2[1] - 0.02), "phx", "wings", { to: 1, dur: 0.01 });
c.arm(r3(TRIP2[1] - 0.02), "phx", "R", { x: [-0.14, 0.3, 0.36] }, 0.01); c.arm(r3(TRIP2[1] - 0.02), "phx", "L", { x: [0.14, 0.3, 0.36] }, 0.01);
A(r3(TRIP2[1] - 0.02), "phx", "grip", { side: "both", shape: "fist", dur: 0.01 });
c.prop(TRIP2[1], "cart", { rot: 700 }, 1.6, "out");   // spinning on its wheels, empty
sfx(TRIP2[1], "freewheel", { gain: 0.4, reason: "the empty cart spinning on its castors" });
A(5.75, "sor", "look", { to: [0.0, -0.3], dur: 0.2, blink: false }); act.shock(c, 5.8, "sor", { hold: 0.4 });
c.arm(5.8, "sor", "L", { x: [0.2, 0.37, 0.3] }, 0.7, "inOut"); A(5.85, "sor", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
// the bigger late thump
sfx(THUMP2, "thud", { gain: 0.8, reason: "the rule, planted twice: a bigger late thump of his own sound" });
sfx(r3(THUMP2 + 0.03), "creak", { gain: 0.35, reason: "the hanging lamps swinging on their chains" });
A(THUMP2, "sor", "lean", { to: -14, dur: 0.15, ease: "out" }); A(r3(THUMP2 + 0.25), "sor", "lean", { to: 0, dur: 0.45, ease: "settle" });
A(THUMP2, "sor", "hat", { spin: [0, 0, -22], dur: 0.12, ease: "out" }); A(r3(THUMP2 + 0.3), "sor", "hat", { spin: [0, 0, 0], dur: 0.5, ease: "settle" });
A(THUMP2, "sor", "face", { lid: 0.8, dur: 0.05 }); A(r3(THUMP2 + 0.25), "sor", "face", { lid: 0, dur: 0.15 });
A(r3(THUMP2 + 0.05), "phx", "face", { lid: 0, dur: 0.12 }); A(r3(THUMP2 + 0.1), "phx", "look", { to: [0.4, 0.1], dur: 0.15, blink: false });
act.mood(c, 6.6, "sor", "angry", { hold: 0.35 });
see(S_WALL, TRIP2[0], ["sor.face", "cart"], "the librarian points at the overloaded cart");
see(TRIP2[1], S_LAPS, ["phx.face", "sor.face", "cart"], "the shelves full, the cart spinning empty, Phoenix posing; the thump blows the librarian sideways");

// ================================================================ 5 DEMO 3, 7.3-11.0: 100 laps (the 10x)
// A medium on Phoenix by the cart: he grins to us, "100 laps!", ZOOM (a shout). Panel 05: the high wide over the
// reading room, the flame ring circling the tables in silence, papers spiralling, robes blowing. The title card.
cap(S_LAPS, 8.2, "Still too much energy?", 230);
A(S_LAPS, "phx", "look", { to: [0.0, 0.05], dur: 0.12, blink: false });   // to us
A(S_LAPS, "phx", "turn", { to: 0, dur: 0.2 });
act.grin(c, 7.35, "phx");
c.say(7.42, "phx", "100 laps!", 0.45, "excited", { pos: 430 });
zoom(TRIP3[0], { loud: true, word: 7.82, pos: 430 });
// the ring (STAND-IN: drawn ring cels on the floor round the table until the flame ring is built)
for (let k = 0; k < 6; k++) FX.push({ at: r3(8.15 + k * 0.5), do: "cel", kind: "ring", pos: [TABLE[0], 0.05, TABLE[1]], flat: true, size: 2.4, dur: 0.5, palette: "fire", seed: 3 + k });
for (const w of ["rea", "sor"]) { A(8.2, w, "lean", { to: -6, dur: 0.3 }); A(10.6, w, "lean", { to: 0, dur: 0.4, ease: "settle" }); }
A(8.3, "rea", "look", { to: [-0.6, 0.2], dur: 0.2, blink: false }); A(8.8, "rea", "look", { to: [0.6, 0.2], dur: 0.25, blink: false });
A(9.4, "rea", "look", { to: [-0.6, 0.2], dur: 0.25, blink: false }); A(10.0, "rea", "look", { to: [0.6, 0.2], dur: 0.25, blink: false });
act.shock(c, 8.25, "rea", { hold: 2.2 });
A(8.4, "sor", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2 }, dur: 0.2 });
cap(10.0, 10.97, "WHAT IF YOUR HYPER FRIEND\nWAS FASTER THAN SOUND\nIN A LIBRARY?", 560, true, { size: 88 });
see(S_HIGH, 10.0, ["rea.face", "table"], "100 laps in silence: the flame ring round the reading room");

// ================================================================ 6 SNAP 2, 11.0-13.5: perfectly quiet (and the clock)
// Panel 06: he stops dead in his seat beside Reaper, finger to his lips, smug; Reaper and the librarian nod, eyes shut.
// The calm has a fuse: the longcase clock ticks louder each time, a low rumble under it.
for (const w of ["rea", "sor"]) A(r3(S_SIT - 0.02), w, "lean", { to: 0, dur: 0.01 });
A(r3(S_SIT - 0.02), "rea", "look", { to: [-0.1, -0.5], dur: 0.01, blink: false }); A(r3(S_SIT - 0.02), "rea", "expr", { expr: "deadpan", dur: 0.01 });
A(r3(S_SIT - 0.02), "sor", "look", { to: [-0.15, -0.2], dur: 0.01, blink: false }); A(r3(S_SIT - 0.02), "sor", "expr", { expr: "deadpan", dur: 0.01 });
A(r3(TRIP3[1] - 0.02), "phx", "expr", { expr: "smug", set: { curve: 0.7 }, dur: 0.01 }); A(r3(TRIP3[1] - 0.02), "phx", "face", { lid: 0.45, dur: 0.01 });
A(r3(TRIP3[1] - 0.02), "phx", "look", { to: [0.15, 0.05], dur: 0.01, blink: false }); A(r3(TRIP3[1] - 0.02), "phx", "wings", { to: 0.3, dur: 0.01 });
c.arm(r3(TRIP3[1] - 0.02), "phx", "R", "rest", 0.01); c.arm(r3(TRIP3[1] - 0.02), "phx", "L", "rest", 0.01);
fwip(TRIP3[1], PHX_SEAT, 8, TRIP3[0]);
A(r3(TRIP3[1] - 0.01), "phx", "sit", { seat: "chairL", dur: 0.01, hands: "keep" });
A(r3(TRIP3[1] + 0.02), "phx", "squash", { amount: 0.08, dur: 0.15 });   // stops dead
A(11.2, "rea", "look", { to: [-0.75, 0.0], dur: 0.25, blink: false });
c.arm(11.25, "phx", "L", { x: [0.03, 0.45, 0.36] }, 0.45, "inOut"); A(11.4, "phx", "grip", { side: "L", shape: "point", dur: 0.2 });   // finger to his lips
c.say(11.5, "phx", "Shhh.", 0.4, "whisper", { pos: 560 });
A(11.95, "rea", "face", { lid: 1, dur: 0.25 }); A(11.95, "rea", "expr", { expr: "kind", set: { curve: 0.25 }, dur: 0.3 });
c.macro(12.0, "rea", "nod", { times: 1 });
A(11.8, "sor", "face", { lid: 1, dur: 0.25 }); c.macro(11.85, "sor", "nod", { times: 1 });
c.arm(11.3, "sor", "R", { x: [-0.24, 0.36, 0.42] }, 0.35, "inOut"); c.arm(11.65, "sor", "R", { x: [-0.03, 0.34, 0.4] }, 0.35, "inOut"); A(11.6, "sor", "grip", { side: "R", shape: "point", dur: 0.3 });   // out, then in to his lips from below
for (const w of ["phx", "rea", "sor"]) A(12.2, w, "still", { dur: 1.25, idle: 0.04 });
see(TRIP3[1], S_CLOCK, ["phx.face", "rea.face", "sor.face"], "he sits perfectly quiet; they nod, relieved");
// the clock (STAND-IN until the longcase clock is built: the shot frames where it will stand)
TICKS.forEach((t, k) => sfx(t, "knock-tap", { gain: r3(0.35 + k * 0.2), reason: `the longcase clock ticks, louder each time (${k + 1} of ${TICKS.length}): the calm has a fuse` }));
sfx(13.05, "rumble", { gain: 0.5, reason: "the breath before it: a low rumble under the ticks" });
A(13.1, "phx", "look", { to: [0.4, 0.3], dur: 0.2, blink: false }); A(13.15, "phx", "face", { lid: 0, dur: 0.15 });
A(13.15, "rea", "face", { lid: 0.3, dur: 0.15 });
see(S_BACK, BOOM, ["phx.face", "rea.face"], "the three still; the ticks louder, the rumble starts");

// ================================================================ 7 THE TWIST, 13.5-16.0: BOOM
// Panel 07: all the sound he outran arrives at once. The shockwave blasts every book off every shelf, the tower
// bursts, the sign swings up on its chains, the librarian's hood flips back, the windows rattle.
c.hitStop(BOOM);
sfx(BOOM, "impact", { gain: 1.0, loud: true, reason: "THE BOOM: every sound he outran arrives at once (STAND-IN for the sonic boom)" });
sfx(r3(BOOM + 0.02), "thud", { gain: 0.8, reason: "the boom's body" });
sfx(r3(BOOM + 0.1), "kenney/impact-glass-light", { gain: 0.4, reason: "the windows rattle" });
FX.push({ at: BOOM, do: "cel", kind: "ring", pos: [TABLE[0], 1.0, -2.5], size: 4, dur: 0.6, palette: "energy" });
c.at(BOOM, { fx: "shake", dur: 0.5, amp: 0.03 });
TOWER_N && Array.from({ length: TOWER_N }, (_, i) => i).forEach((i) => {
  const a = (i * 2.399) % (2 * Math.PI), up = 1.6 + (i % 4) * 0.5;
  c.throw(r3(BOOM + 0.02), TW(i), { v: [r3(Math.cos(a) * 2.2), r3(up), r3(Math.sin(a) * 1.4 + 0.6)], spin: [r3(3 + (i % 3)), r3((i % 5) - 2), r3(4 - (i % 4))] });
});
for (const w of ["phx", "rea", "sor"]) act.shock(c, BOOM, w, { hold: 1.4 });
c.arm(BOOM, "phx", "R", { x: [-0.3, 0.75, 0.25] }, 0.2, "out"); c.arm(BOOM, "phx", "L", { x: [0.3, 0.75, 0.25] }, 0.2, "out");   // arms up
A(BOOM, "phx", "grip", { side: "both", shape: "open", dur: 0.08 });
c.arm(BOOM, "rea", "R", { x: [-0.3, 0.7, 0.22] }, 0.2, "out"); c.arm(BOOM, "rea", "L", { x: [0.3, 0.7, 0.22] }, 0.2, "out");
A(BOOM, "rea", "grip", { side: "both", shape: "open", dur: 0.08 });
c.arm(BOOM, "sor", "R", { x: [-0.3, 0.7, 0.22] }, 0.2, "out"); c.arm(BOOM, "sor", "L", { x: [0.3, 0.7, 0.22] }, 0.2, "out");   // arms up like the others
A(BOOM, "sor", "hat", { spin: [-35, 0, 0], dur: 0.08 });   // the hood flips back (panel 07)
for (const w of ["phx", "rea", "sor"]) { A(BOOM, w, "squash", { amount: 0.18, dur: 0.25 }); A(BOOM, w, "pitch", { to: -8, dur: 0.1, ease: "out" }); A(r3(BOOM + 0.6), w, "pitch", { to: 0, dur: 0.5, ease: "settle" }); }
sfx(14.6, "crumble", { gain: 0.7, reason: "books raining down onto the floor and the table" });
see(BOOM, S_AFTER, ["phx.face", "rea.face", "sor.face"], "the boom: every book off every shelf, three faces to us");

// ================================================================ 8 FACT + QUESTION, 16.0-19.0: the aftermath
// Panel 08: Reaper buried to his hood, a page stuck to his face; Phoenix sitting in the mess with a sheepish grin; the
// librarian's glare; pages still falling (STAND-IN: the book pile comes with the builders' blast).
for (const w of ["phx", "rea"]) { c.arm(r3(S_AFTER - 0.02), w, "R", "rest", 0.01); c.arm(r3(S_AFTER - 0.02), w, "L", "rest", 0.01); A(r3(S_AFTER - 0.02), w, "grip", { side: "both", shape: "relaxed", dur: 0.01 }); }
A(r3(S_AFTER - 0.02), "sor", "hat", { spin: [0, 0, 0], dur: 0.01 });
c.arm(r3(S_AFTER - 0.02), "sor", "R", { x: [-0.2, 0.37, 0.3] }, 0.01); c.arm(r3(S_AFTER - 0.02), "sor", "L", { x: [0.2, 0.37, 0.3] }, 0.01);   // (on the cut) back on his desk to glare
c.prop(r3(S_AFTER - 0.03), "page", { x: r3(REA[0] - 0.08), y: 0.86, z: r3(REA[1] + 0.41), rot: 8, tip: 80 }, 0.01);   // over half his face
A(r3(S_AFTER - 0.02), "rea", "expr", { expr: "deadpan", dur: 0.01 }); A(r3(S_AFTER - 0.02), "rea", "face", { lid: 0.55, dur: 0.01 });
A(r3(S_AFTER - 0.02), "rea", "look", { to: [-0.3, 0.0], dur: 0.01, blink: false });
A(r3(S_AFTER - 0.02), "sor", "look", { to: [-0.3, -0.2], dur: 0.01, blink: false });
cap(S_AFTER, 17.55, "Real fact: you only hear a supersonic jet after it has passed you.", 240);
act.sheepish(c, 16.5, "phx");
A(16.5, "phx", "look", { to: [0.5, 0.05], dur: 0.25, blink: false });
c.say(16.8, "phx", "...sorry.", 0.5, "whisper", { pos: 500 });
act.mood(c, 16.2, "sor", "angry", { hold: 2.0 });
cap(17.6, r3(END - 0.05), "Would you still want it?", 300);
see(S_AFTER, END, ["phx.face", "rea.face", "sor.face"], "the aftermath: buried, sheepish, glaring");

for (const cp of c.captions) for (const cut of [S_REA, S_TWO, S_WALL, S_LAPS, S_HIGH, S_SIT, S_CLOCK, S_BACK, BOOM, S_AFTER]) if (cp.from < cut && cp.to > cut - 0.03 && cp.from < cut - 0.3) cp.to = r3(cut - 0.03);

const allowClip = [
  ...AWAY.flatMap(([a, b]) => [{ who: "phx", from: r3(a - 0.02), to: r3(b + 0.04), checks: ["rig-jump", "foot-slide", "stance-slide", "hand-pop", "hand-turn"], reason: "faster than sound: he is gone in one frame and back in one frame (hidden while he's away)" }]),
  { who: "rea", with: "table", from: 0, to: r3(END + 0.2), reason: "Reaper sits at the reading table (stands at his chair, the table at his chest)" },
  { who: "phx", with: "table", from: TRIP3[1], to: r3(END + 0.2), reason: "Phoenix sits at the reading table beside Reaper" },
  { who: "sor", with: "desk", from: 0, to: r3(END + 0.2), reason: "the librarian behind his issue desk" },
  ...["phx", "rea", "sor"].map((who) => ({ who, from: BOOM, to: r3(BOOM + 0.3), checks: ["hand-jump"], reason: "the blast flings every arm up in two frames: the boom's smear, under the shake and the flying books" })),
  { who: "phx", from: 0.5, to: 0.66, checks: ["rig-jump"], reason: "the second hop's takeoff: the body leaves the crouch fast (a hop, 15 fps strip checked 9 Nov)" },
  { who: "sor", from: r3(S_LAPS - 0.02), to: 7.7, checks: ["face-hidden", "front"], reason: "his anger is done; the laps shot is Phoenix's grin with the librarian hidden behind him on purpose (the space above for the lines)" },
  { who: "rea", with: "page", from: r3(S_AFTER - 0.05), to: r3(END + 0.2), reason: "the blast stuck a page over half his face (panel 08)" },
  ...["phx", "rea", "sor"].flatMap((who) => [{ who, with: "beam", from: 0, to: END, reason: "the sunbeam is light" }, { who, with: "dust", from: 0, to: END, reason: "dust motes in the air" }]),
];

// ---------------------------------------------------------------- shots (by hand: every panel's camera, one side)
const SH = {
  wide: { pos: [-1.0, 4.0, 10.5], look: [-1.0, 1.4, -1.5], fov: 28.5 },          // panels 01-02: the long-lens front wide, the desk at the back (camfit 9 Nov)
  rea: { pos: [-0.3, 1.5, 3.6], look: [-0.45, 1.05, -0.4], fov: 36 },           // Reaper and his tower
  two: { pos: [-1.6, 2.6, 9.0], look: [-1.0, 1.6, -0.6], fov: 39 },             // panel 03: the two-shot from the front left
  wall: { pos: [0.0, 3.0, 0.1], look: [-0.25, 0.95, -4.6], fov: 56 },           // panel 04: over the table, down at the desk (Reaper just under the frame)
  laps: { pos: [-2.4, 1.25, -0.4], look: [-1.0, 1.05, -3.75], fov: 48 },        // Phoenix to us (the librarian hidden behind him, the space above for the lines)
  high: { pos: [2.4, 5.4, 10.0], look: [-0.6, 0.4, -2.4], fov: 28 },            // panel 05: high over the reading room, the desk top right
  sit: { pos: [-0.6, 1.3, 10.5], look: [-0.78, 1.55, -1.0], fov: 25 },            // panel 06: the table, level; from x -0.6 the librarian shows between the tower and Reaper
  clock: { pos: [-1.7, 1.6, -4.3], look: [-1.85, 1.45, -6.05], fov: 40 },        // the longcase clock (STAND-IN case)
  boom: { pos: [-1.0, 3.4, 12.0], look: [-0.6, 1.5, -1.5], fov: 28 },           // panel 07: the wide, from above
  after: { pos: [-0.8, 3.0, 10.0], look: [-0.55, 1.6, -1.0], fov: 25 },         // panel 08: the medium-wide, from above
};
const beats = c.beats([
  ["01 frame 0: too hyper for a library", 0, SH.wide, "hook"],
  ["02 Reaper and his tower", S_REA, SH.rea, "reaction"],
  ["03 the book from the top shelf", S_TWO, SH.two],
  ["04 a whole shelf", S_WALL, SH.wall],
  ["05 100 laps!", S_LAPS, SH.laps],
  ["05 the ring (the title)", S_HIGH, SH.high, "reveal"],
  ["06 perfectly quiet", S_SIT, SH.sit],
  ["06 the clock", S_CLOCK, SH.clock, "insert"],
  ["06 the calm", S_BACK, SH.sit],
  ["07 BOOM", BOOM, SH.boom, "payoff"],
  ["08 the aftermath", S_AFTER, SH.after, "reaction"],
], END);

write(import.meta.url, {
  id: "faster-than-sound",
  title: "What if your hyper friend was faster than sound in a library?",
  idea: "What if, episode 2: Phoenix moves faster than sound in the library (a book, a cart, 100 laps), his sound arriving later each time; he sits perfectly quiet and the clock ticks; then every sound he outran arrives at once",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true, cover: 10.5,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  panels: { md: "storyboards/series/what-if/02-library/PANELS.md" },
  // STAND-IN plate: Too Much Energy 01's hall, slid left so its windows sit on the left (the daylight plate comes from a builder)
  set: { type: "plain", color: "#d9cdb4", floor: "#b8a27e", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/library-hall.png", z: -8.6, center: [1.6, 4.4], height: 15, depth: false, motion: false, dust: 30 },
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  // a soft plucky chamber bed; it drops to silence every time he's away, comes back sweet when he sits, holds its
  // breath under the clock, and the boom lands on the drop
  music: { style: "sneaky", lowCut: 150, gain: 0.3, parts: [
    { at: 0, part: "main" }, { at: TRIP1[0], part: "hush" }, { at: TRIP1[1], part: "main" }, { at: TRIP2[0], part: "hush" }, { at: TRIP2[1], part: "main" },
    { at: TRIP3[0], part: "hush" }, { at: TRIP3[1], part: "musicbox" }, { at: 11.85, part: "hold" }, { at: BOOM, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.15, surface: "wood", guard: true },
  hook: { show: ["phx", "rea", "sor", TW(TOWER_N - 1)], hint: 0.0, what: "the librarian shushes the hyper friend bouncing beside Reaper's book tower; he vanishes at 1.0 s" },
  fx: FX,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/02-library/make-faster-than-sound.mjs.",
});
