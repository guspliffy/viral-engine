// THAT ONE FRIEND WITH TOO MUCH ENERGY AT THE LIBRARY (Too Much Energy, episode 1, 6 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-05-too-much-energy/01-library-ENGINE-PROMPT.md, series format
// 00-SERIES-FORMAT.md, Jonny's eight panels storyboards/01-library/storyboard-eight-panels.png (they win; PANELS.md here).
//   node storyboards/series/too-much-energy/01-library/make-library.mjs -> library.json
//
// THE BRIEF
//   Joke:        the quietest place on earth and the loudest friend in it. Phoenix whisper-screams and somersaults while
//                Reaper and the Wizard try to read; the Wizard's calming spell only hypes him more; he rides the rolling
//                ladder, it hits the end stop and the bookcases go down like dominoes. He grins.
//   Wants:       Phoenix wants to share the dragon book; the others want quiet.
//   Consequence: the librarian, Reaper and the Wizard shush him at once and the gust blows his crest flame out.
//   Ending:      a curl of smoke from his snuffed crest, a sheepish half grin; hard cut at 10.0.
//   Callback:    0 s his flame is lit and his mouth wide open in a library; 10 s the flame is out and he is quiet at last.
//
// Places (x right, z toward the camera). The reading table centre right with Reaper and the Wizard behind it, the
// Sorcerer's issue desk behind them to the left, five tall bookcases in a staggered row across the back (each turned
// 30 degrees, so they fall back and to the right onto the next one, as in panels 04-05), the rolling ladder on the
// front bookcase's brass rail, its end stop at the bookcase's right end.
import { clip, write } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const END = 9.8;   // + two 3-frame hit-stops = exactly 10.0 s of video (series format: a hard cut at 10.0)
const r3 = (x) => Math.round(x * 1000) / 1000;
const TABLE_Y = 0.62, SUB = 520, SUB_HI = 520;   // every subtitle above the heads (the cast fills the lower half), under the title Jonny adds

// ---------------------------------------------------------------- the bookcases
const ROT = -30, RAD = (ROT * Math.PI) / 180;
const U = [Math.cos(RAD), -Math.sin(RAD)];          // a bookcase's long side (its local +x): right and toward us
const D = [-Math.sin(RAD), -Math.cos(RAD)];         // the way they fall (their local -z): right and back
const H = 2.1, L0 = 2.2, L1 = 1.6;
const S0 = [-1.9, -2.7];
const STEP = [1.1 * D[0] + 0.45 * U[0], 1.1 * D[1] + 0.45 * U[1]];
const STACKS = [0, 1, 2, 3, 4].map((i) => [r3(S0[0] + i * STEP[0]), r3(S0[1] + i * STEP[1])]);
const along = (p, s, f = 0) => [r3(p[0] + s * U[0] - f * D[0]), r3(p[1] + s * U[1] - f * D[1])];   // s along the long side, f out of the front face
// a point in a prop's own frame (rot ROT) -> the world (timeline.js rideAt)
const local = (p, ox, oz) => [r3(p[0] + Math.cos(RAD) * ox + Math.sin(RAD) * oz), r3(p[1] - Math.sin(RAD) * ox + Math.cos(RAD) * oz)];

// ---------------------------------------------------------------- the ladder and its ride
const LAD_W = 0.8, LAD_OUT = 0.72;                  // its foot stands this far out of the front face (hooks on the rail)
const S_START = -0.1, S_STOP = 0.66;                // along the rail: the start and the end stop
const LAD0 = along(S0, S_START, LAD_OUT), LAD1 = along(S0, S_STOP, LAD_OUT);
const RIDE_OFF = [0.18, 0.28, 0.24];               // Phoenix on the bottom rung, on our side of the ladder, at its front rail
const RIDER0 = local(LAD0, RIDE_OFF[0], RIDE_OFF[2]);
const RAIL_GRIP = [0.4, 0.82, -0.17];               // the front rail at his chest (the ladder leans back 14 degrees)

// ---------------------------------------------------------------- people
const PHX0 = [-0.85, 1.2], PHX_TABLE = [-0.2, 0.64], PHX_FLIP = [-0.85, 0.95], PHX_POSE = [-1.05, 1.25], PHX_LAND = [-0.4, 1.6];
const REA = [-0.28, -0.92], WIZ = [0.9, -0.9], SOR = [0.38, -2.5];
// the issue desk stands on a low dais (old libraries raise the librarian): his face shows between the two readers' heads
const TABLE = [0.35, -0.1], DAIS = [0.38, -2.1], DAIS_H = 0.4, DESK = [0.38, -1.72], DESK_H = 0.55;
// the shush row (8.5 on): the three side by side behind Phoenix, in front of the rubble
// the shush (8.5 on): the three in a row where they are, Reaper and the Wizard behind the table, the Sorcerer raised
// on his dais between them, all turned to Phoenix
const ROW = { wiz: WIZ, sor: SOR, rea: REA };

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 18, expr: "eager", follow: 0.35, seed: 1.7, span: 0.45 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA, face: 0, expr: "deadpan", follow: 0.2, seed: 4.1 },
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ, face: -10, expr: "deadpan", follow: 0.25, seed: 2.6 },
  { id: "sor", character: "potatobrawl/sorcerer", at: SOR, y: DAIS_H, face: 5, expr: "deadpan", follow: 0.2, seed: 5.7 },
];

// books: Phoenix's dragon book (open, held up to us), Reaper's (open, held up to his face, its back to us), the
// Wizard's (open, flat on the table), a pile beside him, and loose books on the bookcase tops that spill when they fall
const DB = { w: 0.19, h: 0.26, t: 0.04 }, RB = { w: 0.17, h: 0.24, t: 0.05 };
const DBOOK0 = [PHX0[0] + 0.05, 0.4, PHX0[1] + 0.42];
const RBOOK0 = [REA[0], 0.6, REA[1] + 0.37], RBOOK_UP = [REA[0], 0.84, REA[1] + 0.37];
const DBOOK_TABLE = [-0.17, r3(TABLE_Y + (DB.t / 2) * 1.35 + 0.004), 0.03];
const loose = [];
STACKS.forEach((p, i) => {
  const n = i === 0 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const s = (k - (n - 1) / 2) * 0.45 + (i % 2 ? 0.08 : -0.05), q = along(p, s, (k % 2 ? 0.06 : -0.05));
    loose.push({ id: `lb${i}${k}`, kind: "libbook", x: q[0], y: r3(H + 0.04 + 0.025), z: q[1], rot: ROT + (k * 37 + i * 23) % 50 - 25, w: 0.16 + ((i + k) % 3) * 0.02, h: 0.23, t: 0.05, seed: 10 + i * 7 + k, body: { settle: true, density: 500 } });
  }
});

const props = [
  { id: "floor", kind: "libfloor", x: 0, z: -0.75, w: 14, d: 15.5, seed: 21 },
  { id: "table", kind: "table", x: TABLE[0], z: TABLE[1], w: 1.4, d: 0.62, color: "#7a4a2c", legs: "#4e2e1a" },
  { id: "dais", kind: "libdais", x: DAIS[0], z: DAIS[1], w: 1.5, d: 1.4, h: DAIS_H },
  { id: "desk", kind: "libdesk", x: DESK[0], y: DAIS_H, z: DESK[1], w: 1.2, h: DESK_H },
  { id: "lamp", kind: "greenlamp", x: r3(DESK[0] - 0.45), y: r3(DAIS_H + DESK_H), z: r3(DESK[1] + 0.05) },
  ...STACKS.map((p, i) => ({ id: `s${i}`, kind: "libstack", x: p[0], z: p[1], rot: ROT, l: i ? L1 : L0, h: H, d: 0.44, shelves: 5, seed: 3 + i * 11,
    ...(i === 0 && { rail: true, railY: 1.55, stop: 1 }), body: { shape: "box", density: 260, friction: 0.7, bounce: 0.05 } })),
  { id: "ladder", kind: "libladder", x: LAD0[0], z: LAD0[1], rot: ROT, h: 1.5, w: LAD_W, lean: 14, body: { shape: "box", density: 200, bounce: 0.1 } },
  { id: "dbook", kind: "libbook", art: "dragon", x: DBOOK0[0], y: DBOOK0[1], z: DBOOK0[2], rot: 0, ...DB, color: "#7a2e2a", open: 1, stand: 1, scale: 1.35 },
  { id: "rbook", kind: "libbook", x: RBOOK0[0], y: RBOOK0[1], z: RBOOK0[2], rot: 180, ...RB, color: "#2f4a3a", open: 1, stand: 1, seed: 8 },
  { id: "wbook", kind: "libbook", x: r3(WIZ[0] - 0.05), y: r3(TABLE_Y + 0.02), z: r3(TABLE[1] - 0.05), rot: 0, w: 0.16, h: 0.22, t: 0.04, color: "#4b2f45", open: 1, stand: 0, seed: 12 },
  ...[0, 1].map((k) => ({ id: `pile${k}`, kind: "libbook", x: r3(TABLE[0] + 0.12 + k * 0.01), y: r3(TABLE_Y + 0.02 + k * 0.045), z: r3(TABLE[1] + 0.14), rot: k * 9 - 6, w: 0.17, h: 0.23, t: 0.04, seed: 30 + k })),
  ...loose,
  { id: "dust", kind: "dustmotes", x: 0.2, y: 1.6, z: -1.8, n: 60, box: [4.5, 2.6, 4.0], color: "#ffe0a0" },
  { id: "beam", kind: "lightbeam", x: 0.4, y: 4.6, z: -5.5, rot: 0, tip: -55, len: 6, w: 1.6, color: "#ffd89a", glow: 0.35 },
  { id: "shush", kind: "shush", x: 0.25, y: 0.85, z: -0.55, rot: -110, l: 2.4, size: 1.4, blow: 0, staged: "a gust of air from their shush, nothing that rests on anything" },
];

// ---------------------------------------------------------------- 01 ALREADY TOO MUCH 0-1.5
// frame 0: Phoenix mid-hop in front of the table, the dragon book open to us, mouth wide; the readers perfectly still
// (stand is no spec default in propState: set it at 0 for the two books held up open)
c.prop(0, "dbook", { stand: 1, open: 1 }, 0.01); c.prop(0, "shush", { blow: 0 }, 0.01); c.prop(0, "rbook", { stand: 1, open: 1 }, 0.01);
const HOLD = (s) => ({ prop: "dbook", grip: [s * (DB.w + 0.025), 0, 0], palm: true });   // the prop's own frame (scale 1.6)
c.arm(0, "phx", "R", HOLD(-1), 0.01); c.arm(0, "phx", "L", HOLD(1), 0.01);
A(0, "phx", "grab", { prop: "dbook", hand: "both", grip: [0, 0, 0], dur: 0, pose: null });
A(0, "phx", "charge", { to: 0.12, dur: 0.01 });
A(0, "phx", "look", { to: [0.4, 0.05], dur: 0.01, blink: false });
A(0, "phx", "noblink");
A(0, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 1.15 }, dur: 0.01 });
for (const t of [0.0, 0.45, 0.9]) A(t, "phx", "hop", { height: 0.16, dur: 0.38 });
for (const t of [0.0, 0.45, 0.9]) A(t, "phx", "wings", { to: 1, dur: 0.12, ease: "out" });
for (const t of [0.2, 0.65, 1.1]) A(t, "phx", "wings", { to: 0.4, dur: 0.18 });
act.opener(c, "phx", "psst! PSST! dragons!", { at: 0.05, dur: 0.9, pos: SUB });
sfx(0.3, "book-flip", { gain: 0.35, reason: "the dragon book's pages flapping as he bounces with it" });
// Reaper holds his book up, the Wizard reads his flat on the table, the Sorcerer looks up over his desk
c.arm(0, "rea", "R", { prop: "rbook", grip: [RB.w + 0.035, 0, 0], palm: true }, 0.01); c.arm(0, "rea", "L", { prop: "rbook", grip: [-(RB.w + 0.035), 0, 0], palm: true }, 0.01);
A(0, "rea", "grab", { prop: "rbook", hand: "both", grip: [0, 0, 0], dur: 0, pose: null });
A(0, "rea", "look", { to: [0, -0.15], dur: 0.01, blink: false }); A(0, "rea", "face", { lid: 0.55, dur: 0.01 });
const WIZ_REST = { o: [0.08, 0.42, 0.32] };   // his free hand on the open book
c.arm(0, "wiz", "R", WIZ_REST, 0.01);
A(0, "wiz", "look", { to: [-0.05, -0.6], dur: 0.01, blink: false }); A(0, "wiz", "face", { lid: 0.5, dur: 0.01 });
A(0, "sor", "look", { to: [-0.3, -0.5], dur: 0.01, blink: false }); A(0, "sor", "crouch", { to: 0.35, dur: 0.01 });
A(0.6, "sor", "look", { to: [-0.45, -0.1], dur: 0.2, blink: false }); A(0.65, "sor", "expr", { expr: "annoyed", dur: 0.3 });
act.blinksAt(c, "rea", [1.25, 4.75]); act.blinksAt(c, "wiz", [0.9, 3.6]); act.blinksAt(c, "sor", [2.2]);
see(0, 1.4, ["phx.face", "dbook", "rea", "wiz.face", "sor.face", "s0"], "frame 0: the loud friend with the dragon book in front of two silent readers, the shelves and ladder behind");

// ---------------------------------------------------------------- 02 SOMERSAULT, THEN THE SPELL 1.5-3.3
// he hops to the table and lays the book open in front of Reaper (thud), then two somersaults and a pose
A(1.45, "phx", "look", { to: [0.4, -0.3], dur: 0.12, blink: false });
A(1.5, "phx", "move", { to: PHX_TABLE, dur: 0.38, steps: 3, ease: "inOut" });
A(1.45, "phx", "turn", { to: 180, dur: 0.3, ease: "inOut" });   // he spins round to the table and slaps it down (Reaper reads it the right way up)
c.prop(1.45, "dbook", { rot: 180 }, 0.3, "inOut");   // the book turns with him
const CARRY = (who, id, grips, at, t, dur, ease) => grips.forEach(([side, g]) => c.arm(t, who, side, { prop: id, grip: g, palm: true, at }, dur, ease));
const DB_HANDS = [["R", HOLD(-1).grip], ["L", HOLD(1).grip]];
CARRY("phx", "dbook", DB_HANDS, [DBOOK_TABLE[0], 0.85, r3(DBOOK_TABLE[2] + 0.12)], 1.58, 0.24, "inOut");
CARRY("phx", "dbook", DB_HANDS, DBOOK_TABLE, 1.82, 0.16, "in");
c.prop(1.8, "dbook", { stand: 0 }, 0.18, "inOut");   // laid down open, pages up (it turns about the line between his palms)
A(2.0, "phx", "release", { prop: "dbook", dur: 0 });
sfx(1.98, "kenney/book-place", { gain: 0.55, reason: "the dragon book slapped down open on the table" });
c.arm(2.02, "phx", "R", { o: [0.25, 0.65, 0.2] }, 0.15, "out"); c.arm(2.02, "phx", "L", { o: [0.25, 0.65, 0.2] }, 0.15, "out");
// flip 1: up and over to the left; flip 2: back toward the middle, landing in a pose
// (a hop carries the body up and down while the walk takes it across; the second flip turns back the other way, so
// the pitch ends where it started)
A(2.05, "phx", "move", { to: PHX_FLIP, dur: 0.28, ease: "inOut" });
A(2.03, "phx", "turn", { to: 15, dur: 0.3, ease: "inOut" });   // back round to us inside the first somersault
A(2.05, "phx", "hop", { height: 0.5, dur: 0.28 });
A(2.05, "phx", "pitch", { to: -360, dur: 0.28, ease: "inOut" });
A(2.33, "phx", "squash", { amount: 0.18, dur: 0.08 });
sfx(2.33, "land", { gain: 0.45, reason: "his feet thumping onto the wooden floor after the first somersault" });
A(2.27, "phx", "look", { to: [0.35, 0.0], dur: 0.08, blink: false });   // eyes first: back toward the table
A(2.33, "phx", "move", { to: PHX_POSE, dur: 0.28, ease: "inOut" });
A(2.33, "phx", "hop", { height: 0.5, dur: 0.28 });
A(2.33, "phx", "pitch", { to: 0, dur: 0.28, ease: "inOut" });
A(2.61, "phx", "squash", { amount: 0.2, dur: 0.12 });
sfx(2.61, "land", { gain: 0.5, reason: "the second landing thump" });
act.landDust(c, 2.61, PHX_POSE);
A(2.2, "phx", "span", { to: 1, dur: 0.15 });
c.arm(2.64, "phx", "R", { o: [0.3, 0.85, 0.15] }, 0.12, "out"); c.arm(2.64, "phx", "L", { o: [0.3, 0.85, 0.15] }, 0.12, "out");   // ta-da
A(2.64, "phx", "turn", { to: 25, dur: 0.15 });   // toward the Wizard
A(2.64, "phx", "look", { to: [0.3, 0.05], dur: 0.1, blink: false });
A(2.66, "phx", "charge", { to: 0.25, dur: 0.15 });
sfx(2.66, "ai/flare", { gain: 0.4, reason: "the energy meter up one size: his crest flares" });
// Reaper slowly lifts his book until it covers his face
const RB_HANDS = [["R", [RB.w + 0.035, 0, 0]], ["L", [-(RB.w + 0.035), 0, 0]]];
A(1.86, "rea", "look", { to: [0, -0.05], dur: 0.12, blink: false });   // eyes first: up the page
CARRY("rea", "rbook", RB_HANDS, RBOOK_UP, 2.0, 0.9, "inOut");
// the Wizard sighs, points his staff and casts a soft blue calm sparkle at Phoenix
A(2.35, "wiz", "look", { to: [-0.6, 0.05], dur: 0.15, blink: false });
act.mood(c, 2.4, "wiz", "annoyed", { hold: 0.3 });
A(2.4, "wiz", "squash", { amount: -0.05, dur: 0.3 });   // the sigh: up and out
A(2.5, "wiz", "turn", { to: -30, dur: 0.25, ease: "inOut" });
// his free right hand points at Phoenix (the staff stays in his left, on the outer side)
c.arm(2.55, "wiz", "R", { o: [0.0, 0.6, 0.42] }, 0.2, "out"); A(2.6, "wiz", "grip", { side: "R", shape: "point", dur: 0.1 });
c.say(2.6, "wiz", "caaalm... dowwn...", 0.6, "calm", { pos: SUB_HI, sub: "Calm… down…" });
A(2.6, "wiz", "charge", { to: 1, dur: 0.2 });
sfx(2.62, "charge", { gain: 0.32, dur: 0.5, reason: "the soft calm spell leaving the staff" });
const SPELL = [0.2, 0.4, 0.6, 0.8].map((k) => [r3(WIZ[0] - 0.2 + (PHX_POSE[0] - WIZ[0] + 0.2) * k), r3(0.95 - 0.25 * k), r3(WIZ[1] + 0.35 + (PHX_POSE[1] - WIZ[1] - 0.35) * k)]);
SPELL.forEach((p, i) => c.at(r3(2.72 + i * 0.09), { fx: "poof", pos: p, dur: 0.3, color: "#7fc8ff", puffs: i === 0 ? 2 : 0, sparks: 10, size: 0.18, lift: 0.02 }));
A(3.0, "wiz", "charge", { to: 0, dur: 0.2 });
// 3.10 it hits him: hit-stop, the meter jumps TWO sizes
c.at(3.1, { fx: "poof", pos: [PHX_POSE[0], 0.7, PHX_POSE[1] + 0.1], dur: 0.45, color: "#9fd8ff", puffs: 3, sparks: 22, size: 0.45, lift: 0.1 });
c.hitStop(3.1, 3);
sfx(3.1, "ai/flare", { gain: 0.6, reason: "the spell hits: his flames flare up two sizes (fwoomp)" });
A(3.1, "phx", "charge", { to: 0.55, dur: 0.12, ease: "out" });
A(3.1, "phx", "squash", { amount: -0.12, dur: 0.12 });
A(3.1, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.6, eye: 1.3 }, dur: 0.1 });
A(3.1, "phx", "wings", { to: 1, dur: 0.1 });
A(3.15, "wiz", "look", { to: [0.35, -0.45], dur: 0.12, blink: false });   // he stares at his staff
act.shock(c, 3.18, "wiz", { hold: 0.5 });
see(2.6, 3.25, ["wiz.face", "phx.face"], "the Wizard's calming spell flies at Phoenix and only makes him flare up");

// ---------------------------------------------------------------- 03 THE LADDER 3.3-5.9
A(3.3, "sor", "crouch", { to: -0.15, dur: 0.18, ease: "out" });   // he pops up over the desk
A(3.46, "sor", "squash", { amount: 0.08, dur: 0.22 });
A(3.35, "sor", "look", { to: [-0.3, -0.15], dur: 0.12, blink: false });
act.mood(c, 3.4, "sor", "angry", { hold: 0.5 });
c.arm(3.38, "sor", "R", { o: [0.3, 0.5, 0.4] }, 0.15, "out"); A(3.4, "sor", "grip", { side: "R", shape: "point", dur: 0.08 });
c.say(3.5, "sor", "SHH!", 0.35, "angry", { sub: false });
c.textPop(3.5, "sor", "SHH!", { dur: 0.75, size: 130, dx: 0.7, dy: -0.35, angle: -6, color: "speaker" });
sfx(3.5, "hiss", { gain: 0.35, reason: "the librarian's sharp SHH" });
A(3.95, "sor", "crouch", { to: 0, dur: 0.3 }); c.arm(3.95, "sor", "R", "rest", 0.3, "inOut"); A(4.0, "sor", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
// Phoenix takes it as a wave and waves back
A(3.55, "phx", "look", { to: [0.1, 0.1], dur: 0.12, blink: false });
c.at(3.55, { fx: "alert", who: "phx", text: "?", dur: 0.4, color: "#ff8a2a" });
A(3.6, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.3 }, dur: 0.15 });
c.arm(3.6, "phx", "L", { o: [0.15, 1.0, 0.12] }, 0.12, "out"); A(3.6, "phx", "grip", { side: "L", shape: "open", dur: 0.1 });
for (const [i, t] of [3.72, 3.84].entries()) c.arm(t, "phx", "L", { o: [i ? 0.15 : 0.3, 1.0, 0.12] }, 0.12, "inOut");
c.arm(3.6, "phx", "R", "rest", 0.25, "inOut");
// he flies onto the ladder and kicks off: it rolls along the rail, faster and faster
A(3.98, "phx", "look", { to: [-0.6, 0.15], dur: 0.12, blink: false });
A(4.0, "phx", "fly", { to: { x: RIDER0[0], y: RIDE_OFF[1], z: RIDER0[1] }, dur: 0.3, ease: "inOut" });
A(4.0, "phx", "turn", { to: ROT + 90, dur: 0.25, ease: "inOut" });
c.arm(4.12, "phx", "L", { prop: "ladder", grip: RAIL_GRIP }, 0.2, "inOut");
A(4.3, "phx", "ride", { prop: "ladder", off: RIDE_OFF, yaw: 90, dur: 0.02 });
c.arm(4.35, "phx", "R", { o: [0.4, 0.75, 0.15] }, 0.15, "out"); A(4.35, "phx", "grip", { side: "R", shape: "open", dur: 0.1 });
A(4.35, "phx", "span", { to: 1, dur: 0.15 });
for (let t = 4.4; t < 5.85; t += 0.22) A(r3(t), "phx", "wings", { to: Math.round((t - 4.4) / 0.22) % 2 ? 0.5 : 1, dur: 0.11 });
A(4.35, "phx", "look", { to: [0.25, 0.1], dur: 0.1, blink: false });
A(4.4, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.75, eye: 1.2 }, dur: 0.12 });
c.say(4.4, "phx", "wheeeee!", 0.9, "excited", { pos: SUB_HI, sub: "Wheee!" });
c.prop(4.4, "ladder", { x: LAD1[0], z: LAD1[1] }, 1.5, "in");
sfx(4.4, "doorslide", { gain: 0.5, dur: 1.5, reason: "the ladder's wheels rumbling along the brass rail" });
A(4.45, "phx", "charge", { to: 0.6, dur: 0.6 });
sfx(4.5, "ai/wing-flap", { gain: 0.3, reason: "his wings fanning for speed" });
for (const t of [4.7, 5.15, 5.55]) c.at(t, { fx: "poof", pos: [...(() => { const q = along(S0, S_START + (S_STOP - S_START) * ((t - 4.4) / 1.5) ** 2 - 0.35, LAD_OUT + 0.1); return [q[0], 0.05, q[1]]; })()], dur: 0.45, color: "#e9d8c0", puffs: 3, sparks: 0, size: 0.25, lift: 0.05 });
// the readers: Reaper lowers his book a little and watches with a long slow blink; the Wizard still stares
A(4.36, "rea", "look", { to: [-0.3, 0.05], dur: 0.12, blink: false });
CARRY("rea", "rbook", RB_HANDS, [RBOOK0[0], 0.7, RBOOK0[2]], 4.5, 0.4, "inOut");
A(4.6, "rea", "look", { to: [-0.55, 0.15], dur: 0.25, blink: false });
A(4.75, "rea", "blink", { dur: 0.6 });
A(4.4, "wiz", "turn", { to: -20, dur: 0.3, ease: "inOut" }); c.arm(4.4, "wiz", "R", WIZ_REST, 0.3, "inOut"); A(4.4, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(4.5, "wiz", "look", { to: [-0.6, 0.2], dur: 0.2, blink: false });
A(4.5, "sor", "look", { to: [-0.5, 0.25], dur: 0.2, blink: false });
see(4.4, 5.8, ["phx.face", "ladder", "s0"], "Phoenix rides the rolling ladder along the front bookcase, faster and faster");

// ---------------------------------------------------------------- 04 THE BREAK 5.9-7.3
const STOP = 5.9;
sfx(STOP, "bell-heavy", { gain: 0.6, reason: "the ladder slams into the brass end stop: CLANG" });
c.at(STOP, { fx: "poof", pos: [...(() => { const q = along(S0, L0 / 2 + 0.03, 0.29); return [q[0], 1.55, q[1]]; })()], dur: 0.35, color: "#ffd36a", puffs: 0, sparks: 24, size: 0.3, lift: 0 });
c.at(STOP, { fx: "shake", dur: 0.2, amp: 0.02 });
// Phoenix flies off in a somersault and lands at the front
A(STOP, "phx", "ride", {});
c.arm(STOP + 0.02, "phx", "L", { o: [0.3, 0.85, 0.15] }, 0.12, "out"); c.arm(STOP + 0.02, "phx", "R", { o: [0.3, 0.85, 0.15] }, 0.12, "out");
A(STOP + 0.02, "phx", "fly", { to: { x: r3((RIDER0[0] + PHX_LAND[0]) / 2 + 0.4), y: 1.1, z: r3((RIDER0[1] + PHX_LAND[1]) / 2) }, dur: 0.25, ease: "out" });
A(STOP + 0.02, "phx", "pitch", { to: -360, dur: 0.5, ease: "inOut" });   // stays at -360 (a whole turn: upright)
A(STOP + 0.05, "phx", "turn", { to: 15, dur: 0.4, ease: "inOut" });
A(STOP + 0.27, "phx", "fly", { to: { x: PHX_LAND[0], y: 0, z: PHX_LAND[1] }, dur: 0.26, ease: "in" });
A(STOP + 0.53, "phx", "squash", { amount: 0.22, dur: 0.12 });
sfx(STOP + 0.53, "land", { gain: 0.5, reason: "Phoenix landing at the front after the flip" });
act.landDust(c, STOP + 0.53, PHX_LAND);
c.arm(STOP + 0.55, "phx", "R", "rest", 0.3, "inOut"); c.arm(STOP + 0.55, "phx", "L", "rest", 0.3, "inOut");
A(STOP + 0.6, "phx", "look", { to: [0.55, 0.25], dur: 0.15, blink: false });   // he turns to look at the shelves
// the jolt tips the front bookcase back onto the next one; they go down one after another (real physics)
// a tip about its back bottom edge (the speed of its middle matches the spin, so the edge stays on the floor)
const tip = (k) => ({ v: [r3(D[0] * k * 1.06), r3(k * 0.28), r3(D[1] * k * 1.06)], spin: [r3(D[1] * k), 0, r3(-D[0] * k)] });   // spin about up x D: the top goes along D
const HIT = 6.15, GAP = 0.18;   // the front bookcase hits the next one; each hit knocks the next over
c.knock(STOP + 0.03, "s0", tip(1.8));
// each one stands as a body from the jolt on, and gets the push of the one falling onto it when it hits
for (let i = 1; i < 4; i++) { c.drop(STOP, `s${i}`); c.knock(r3(HIT + (i - 1) * GAP), `s${i}`, tip(1.5)); }
c.hitStop(HIT, 3);
STACKS.forEach((p, i) => {
  const t = r3(HIT + i * 0.18);
  sfx(t, "kenney/impact-plank-medium", { gain: 0.6 - i * 0.05, reason: `bookcase ${i + 1} crashing into the next one` });
  const q = along(p, 0, -1.1);
  c.at(t, { fx: "poof", pos: [q[0], 0.9, q[1]], dur: 0.8, color: "#d9c4a0", puffs: 10, sparks: 0, size: 1.0, lift: 0.35 });
  sfx(r3(t + 0.08), "thud-soft", { gain: 0.35, reason: "books spilling off the shelves" });
});
sfx(r3(HIT + 0.95), "crumble", { gain: 0.35, reason: "the last bookcase settling, books clattering down" });
for (const id of ["rea", "wiz", "sor"]) { act.shock(c, r3(HIT + 0.05), id, { hold: 0.9 }); A(r3(HIT + 0.02), id, "look", { to: [0.5, 0.2], dur: 0.12, blink: false }); }
CARRY("rea", "rbook", RB_HANDS, [RBOOK0[0], 0.46, RBOOK0[2]], HIT, 0.3, "inOut");
A(HIT, "phx", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.4 }, dur: 0.1 });
see(6.0, 7.2, ["s0", "s1", "s2", "phx.face"], "the bookcases go down like dominoes, books and dust everywhere");

// ---------------------------------------------------------------- 05 THE GRIN 7.3-8.5 (the series block)
A(7.29, "phx", "turn", { to: 40, dur: 0.01 });   // still facing the wreck
A(7.3, "phx", "look", { to: [0.55, 0.2], dur: 0.01, blink: false });
A(7.3, "phx", "expr", { expr: "worried", set: { curve: -0.1, open: 0.1 }, dur: 0.01 });
A(7.45, "phx", "turn", { to: 10, dur: 0.22, ease: "inOut" });
A(7.45, "phx", "look", { to: [0.05, 0.05], dur: 0.15, blink: false });
// a wide closed grin and a wink (panel 06), held through the close
A(7.7, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 1.05 }, dur: 0.25 });
A(7.7, "phx", "face", { lidL: 0.25, lidR: 0.95, brow: 0.15, dur: 0.25 });
A(7.72, "phx", "squash", { amount: 0.025, dur: 0.25 });
const THUMB = { prop: "floor", grip: [r3(PHX_LAND[0] - 0.36), 0.8, r3(PHX_LAND[1] + 0.75 + 0.3)], frame: { y: [-0.5, 0, 0.87], z: [0.87, 0, 0.5] } };
A(7.62, "phx", "grip", { side: "R", shape: "thumb", dur: 0.15 });
c.arm(7.66, "phx", "R", THUMB, 0.2, "settle");
c.arm(7.66, "phx", "L", { o: [0.4, 0.95, -0.05] }, 0.25, "inOut");   // the other hand behind his head, the elbow out beside the crest
c.at(7.8, { fx: "sparkle", pos: [r3(PHX_LAND[0] + 0.12), 0.95, r3(PHX_LAND[1] + 0.3)], dur: 0.6, count: 3, color: "#fff2a8" });   // by the eye
sfx(7.8, "ting", { gain: 0.45, reason: "the series logo: one bright ting on the grin" });
A(7.8, "phx", "charge", { to: 0.75, dur: 0.1 }); A(7.95, "phx", "charge", { to: 0.6, dur: 0.3 });
A(7.9, "phx", "still", { dur: 0.55, idle: 0.04 });
see(7.7, 8.45, ["phx.face"], "THE GRIN: thumb up, hand behind his head, the wreck behind him");
// off screen in the close: the three line up behind him for the shush
for (const id of ["wiz", "sor", "rea"]) A(7.29, id, "turn", { to: r3((Math.atan2(PHX_LAND[0] - ROW[id][0], PHX_LAND[1] - ROW[id][1]) * 180) / Math.PI * 0.6), dur: 0.01 });
A(7.29, "rea", "release", { prop: "rbook", dur: 0, keep: "air", reason: "Reaper's book goes back on the table off screen" });
c.prop(7.29, "rbook", { x: 0.12, y: r3(TABLE_Y + 0.025), z: r3(TABLE[1] - 0.08), stand: 0, open: 0, rot: 160 }, 0.01);   // put down open-faced on the table off screen
c.arm(7.29, "rea", "R", "rest", 0.01); c.arm(7.29, "rea", "L", "rest", 0.01);
for (const id of ["wiz", "sor", "rea"]) { A(7.29, id, "look", { to: [r3(PHX_LAND[0] - ROW[id][0]) * 0.4, 0.0], dur: 0.01, blink: false }); act.mood(c, 8.5, id, "annoyed", { hold: 0.3 }); }   // (after the grin close: their faces stay calm behind it)

// ---------------------------------------------------------------- 06 THE SHUSH 8.5-9.4
for (const id of ["wiz", "sor", "rea"]) A(8.6, id, "squash", { amount: -0.08, dur: 0.25 });   // one breath together
const LIPS = { o: [-0.2, 0.6, 0.3] };
for (const id of ["wiz", "sor", "rea"]) {
  c.arm(8.72, id, "R", LIPS, 0.15, "out"); A(8.74, id, "grip", { side: "R", shape: "point", dur: 0.08 });
  act.mood(c, 8.85, id, "angry", { hold: 0.8 });
  A(8.9, id, "squash", { amount: 0.1, dur: 0.15 });
}
c.say(8.9, "sor", "SHHHHHH!", 0.5, "angry", { pos: SUB_HI, sub: "SHHHHH!" });
c.captions[c.captions.length - 1].to = 9.2;   // off before the flame goes out
A(8.9, "wiz", "talk", { line: "SHHHHHH!", tone: "angry", dur: 0.5, voice: false });
A(8.9, "rea", "talk", { line: "SHHHHHH!", tone: "angry", dur: 0.5, voice: false });
sfx(8.9, "hiss", { gain: 0.7, reason: "three voices: one giant SHHHHH" });
sfx(8.95, "whoosh", { gain: 0.45, reason: "the shush's gust blowing across the room" });
c.prop(8.9, "shush", { blow: 1 }, 0.4, "linear");
A(8.95, "phx", "span", { to: 0.15, dur: 0.15 });
A(8.95, "phx", "pitch", { to: -368, dur: 0.15 });
A(8.95, "phx", "expr", { expr: "shocked", set: { eye: 0.85, open: 0.1 }, dur: 0.1 });
A(8.95, "phx", "face", { lidL: 0, lidR: 0, brow: 0.3, dur: 0.1 });   // the wink ends: both eyes wide
c.arm(8.92, "phx", "R", "rest", 0.15, "inOut"); c.arm(8.92, "phx", "L", "rest", 0.15, "inOut"); A(8.92, "phx", "grip", { side: "R", shape: "relaxed", dur: 0.1 });
// 9.10 his crest flame goes out like a birthday candle
const SNUFF = 9.1;
A(SNUFF, "phx", "snuff", { to: 1, dur: 0.25 });
A(SNUFF, "phx", "charge", { to: 0, dur: 0.2 });
sfx(SNUFF, "ai/snuff", { gain: 0.6, reason: "his crest flame going out: tss" });
A(9.3, "phx", "pitch", { to: -360, dur: 0.2 });

// ---------------------------------------------------------------- 07 SMOKE 9.4-10.0
c.at(9.25, { fx: "poof", pos: [PHX_LAND[0], 1.2, PHX_LAND[1]], dur: 0.55, color: "#c9c5bf", puffs: 3, sparks: 0, size: 0.18, lift: 0.4 });
A(9.4, "phx", "expr", { expr: "kind", set: { tilt: 0.5, curve: 0.35, open: 0.08, eye: 1.0, smirk: 0.15 }, dur: 0.3 });   // sheepish: brows up and in, a small half grin
A(9.4, "phx", "face", { brow: 0.5, lid: 0.2, dur: 0.3 });
c.at(9.45, { fx: "sweat", who: "phx", dur: 0.5, count: 1 });
c.at(9.62, { fx: "poof", pos: [PHX_LAND[0], 1.2, PHX_LAND[1]], dur: 0.45, color: "#d6d2cc", puffs: 2, sparks: 0, size: 0.2, lift: 0.3 });   // the curl still rising in the last frame
A(9.42, "phx", "look", { to: [0.05, 0.05], dur: 0.12, blink: false });
A(9.55, "phx", "blink", { dur: 0.16 });
A(9.75, "phx", "still", { dur: 0.1, idle: 0.02 });
for (const id of ["wiz", "sor", "rea"]) c.arm(9.35, id, "R", id === "wiz" ? WIZ_REST : "rest", 0.3, "inOut");
see(9.15, 9.75, ["phx.face", "wiz.face", "sor.face", "rea.face"], "his flame is out, a smoke curl, the three still glaring");

// ---------------------------------------------------------------- shots
const WIDE = { pos: [-0.25, 1.35, 4.8], look: [-0.5, 1.3, -1.5], fov: 60 };   // the ladder and the front bookcase behind him on the left
const RIDE = { pos: [-0.9, 1.5, 3.3], look: [-1.75, 1.3, -1.9], fov: 50, to: { pos: [-0.7, 1.5, 3.3], look: [-1.2, 1.3, -1.6], fov: 50 }, dur: 1.65, ease: "inOut" };   // the rail, the shelf top and the end stop fill it
const BREAK = { pos: [0.2, 2.6, 4.6], look: [-0.4, 1.1, -3.8], fov: 54 };   // over their heads: the bookcases fall back and lean on each other   // low and a little from the right: the tops cross the windows as they go
const GRIN = { pos: [r3(PHX_LAND[0] + 0.25), 1.0, r3(PHX_LAND[1] + 3.3)], look: [PHX_LAND[0], 0.68, PHX_LAND[1]], fov: 46 };
const SHUSH = { pos: [-0.05, 2.5, 4.2], look: [0.0, 0.8, -1.0], fov: 50 };   // his head bottom left, the three faces over it
const beats = c.beats([
  ["01 already too much", 0, WIDE, "hook"],
  ["02 somersault, then the spell", 1.5, null],
  ["03 the ladder", 4.25, RIDE, "escalation"],
  ["04 the break", 6.05, BREAK, "payoff"],   // the clang and the sparks still in the ride shot
  ["05 the grin", 7.3, GRIN, "reaction"],
  ["06 the shush", 8.5, SHUSH, "reveal"],
], END);

write(import.meta.url, {
  id: "library",
  title: "That one friend with too much energy at the library",
  idea: "Too Much Energy, episode 1: Phoenix can't be quiet in the library; the calm spell hypes him, the ladder ride topples the bookcases like dominoes, he grins, and three shushes blow his flame out",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2 }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 8.2,
  set: { type: "plain", color: "#6b4a32", floor: "#6e3a24", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/library-hall.png", z: -8.5, center: [-0.3, 4.6], height: 16, depth: false, motion: false, dust: 30 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "sneaky", lowCut: 150, gain: 0.28, payoff: 5.9, until: 6.2 },
  sound: { sfx: 0.7, ambience: 0.2, surface: "wood", guard: true },
  hook: { show: ["phx", "rea", "wiz", "sor", "dbook"], hint: 0.05, what: "Phoenix whisper-screams about his dragon book at two friends trying to read in a library" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", from: 2.05, to: 2.8, checks: ["hand-turn", "hand-pop"], reason: "two somersaults: his whole body turns over and the hands turn with it" },
    { who: "phx", from: 5.9, to: 6.45, checks: ["hand-turn", "hand-pop"], reason: "the somersault off the ladder: the whole body turns over" },
    { who: "phx", with: "ladder", from: 4.0, to: 5.95, reason: "Phoenix stands on the ladder's bottom rung and holds its front rail while he rides it" },
    { who: "phx", with: "shush", from: 8.9, to: 9.6, reason: "the shush gust is air blowing over him" },
    ...["wiz", "sor", "rea"].map((who) => ({ who, with: "shush", from: 8.9, to: 9.6, reason: "the shush gust starts at their mouths" })),
    ...["phx", "wiz", "sor", "rea"].flatMap((who) => [{ who, with: "beam", from: 0, to: 10, reason: "the sunbeam is light, nothing to bump into" }, { who, with: "dust", from: 0, to: 10, reason: "dust motes in the air" }]),
    { who: "rea", with: "rbook", from: 2.0, to: 4.5, checks: ["face-hidden"], reason: "the joke: Reaper lifts his book until it hides his face" },
    { who: "rea", from: 1.8, to: 2.05, checks: ["face-covered"], reason: "Phoenix slaps the dragon book down right under Reaper's nose: his glove passes in front of Reaper's face for a moment" },
    { who: "rea", from: 5.15, to: 5.5, checks: ["face-covered"], reason: "Reaper lowers his book from his face, his gloves on its edges" },
    { who: "rea", with: "rbook", from: 6.1, to: 6.5, checks: ["face-hidden"], reason: "the crash: Reaper drops his book down from his face in shock, it passes his eyes on the way" },
    { who: "phx", from: 1.45, to: 1.8, checks: ["hand-turn"], reason: "he spins right round to the table with the book; the hands turn with his whole body, his back to us" },
    { who: "phx", from: 3.95, to: 4.3, checks: ["foot-slide", "rig-jump"], reason: "he takes off and flies onto the ladder: the feet leave the floor" },
  ],
  notes: "Generated by storyboards/series/too-much-energy/01-library/make-library.mjs.",
});
