// TOO MUCH ENERGY (friend comedies 23, Jonny's brief 30 Oct 2026: video-scripts/2026-10-30-four-friend-comedies/
// engine-pack/23-too-much-energy/ENGINE-PROMPT.md + storyboard-eight-panels.png), built from the clip template.
// node storyboards/friend-comedies/23-too-much-energy/make-too-much-energy.mjs -> too-much-energy.json
//
// THE BRIEF (exactly 9 s, Phoenix and Reaper, publication caption "that one friend with too much energy")
//   Joke:        6 AM: Phoenix crashes through Reaper's window at full volume, bounces off the walls, tips his mattress
//                up with him on it, then burns out mid-word into a neat little pile of ash.
//   Wants:       Phoenix wants his friend up and having fun NOW; Reaper wants to sleep.
//   Consequence: Reaper, unsurprised, sweeps the pile into the dustpan and tips it out of the window: a routine.
//   Ending:      back in bed, eyes shut; the window starts glowing orange again (he's coming back). No loop.
//
//   1 0.00-1.00  6 AM: Phoenix is slamming into the glass beside sleeping Reaper's bed; clock 06:00, broom and
//                dustpan already by the bed                                                        (glass bonk, chatter)
//   2 1.00-2.00  ARRIVAL: he bursts through in a flare of flame wings, babbling; Reaper opens one eye  (crash, fwoomp)
//   3 2.00-3.00  BOUNCE: two rebounds, right wall then back wall; his flame catches the curtain edge     (two thuds)
//   4 3.00-4.40  MATTRESS: he tips the mattress up like a lid with Reaper on it, and lets it flop back  (flap, poof)
//   5 4.40-5.60  BURNOUT: mid-syllable he collapses into ONE small ash pile; every magic flame goes out, the music
//                cuts to silence; a still beat; Reaper swings out of bed                     (silence, soft ash puff)
//   6 5.60-6.60  SWEEP: one stroke of the broom, the pile into the dustpan                              (broom scrape)
//   7 6.60-7.60  OUTSIDE: he tips the pan out of the window, the ash falls outside; the pan goes down    (soft hiss)
//   8 7.60-9.00  AGAIN: back into bed, blanket up, eyes shut; a quiet hold; the window starts glowing     (rustle, hiss)
//
// Departures (each with its reason, also in the delivery): the caption is on screen 0-2.6 s (Jonny's standing hook
// caption rule, 29 Oct); a music bed plays from 0:00 and is cut at the burnout (his standing music rule; the brief's
// "sound cuts to silence" is where it stops); the gibberish chatter is Phoenix's own gibberish voice (no English, it
// works on mute); the ash that leaves through the window is pre-placed at the pan's lip (the stream is its own prop).
//
// Blocking (x right, z toward the camera, y up; set-energy.js ENERGY): the bed's head is against the back wall at the
// left, the window opening beside it at the right (x 0.3-1.1, sill 0.55), the nightstand with the clock under the
// window's left edge; the curtains hang either side of the window, the right one catches fire. Phoenix bounces off the
// right wall (x 1.9) and the back wall. The ash pile is where he lands after the mattress, on the window side of the
// bed; Reaper sweeps it standing beside the bed, then two steps take him to the window.
import { clip, write, frame, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { ENERGY as E } from "../../../engine/page/set-energy.js";
import { RAIL_Y, MATTRESS as M, BROOM as BR } from "../../../engine/page/props-energy.js";

// ---------------------------------------------------------------- the lab picks (Jonny, 30 Oct 2026)
const OPENER = { who: "phx", line: "heyheyhey wake up!", words: false };   // gibberish chatter from frame 0
const FOCUS = true;
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx, cap } = c;
const END = 9.0;

// ---------------------------------------------------------------- places
const BED = E.bed, WZ = E.wallZ, WIN_X = (E.win.x0 + E.win.x1) / 2;
const MAT = [BED[0] - M.w / 2, RAIL_Y, BED[1]];                  // the mattress hinge (its left long bottom edge)
const OUT = [WIN_X, 0.6, -2.95];                                   // Phoenix outside, against the glass
const ARRIVE = [0.75, 0.4, -1.2];                                 // hovering in the room after the burst
const WALL_R = [1.45, 0.85, -1.25], WALL_B = [1.2, 0.88, -1.7];      // the two rebounds (right wall, back wall by the curtain)
const LIFT0 = [0.26, 0.3, -0.75], LIFT1 = [0.02, 0.5, -0.75];        // beside the bed, low at the mattress edge / lifting it
// Reaper's sweep: out of bed at LAND he faces 45 degrees right of the camera (F); the pile is in front of him, the
// broom comes from his right (R) and pushes it to his left, into the pan lying there with its mouth toward the broom
const LAND = [0.3, -1.15], F = [Math.SQRT1_2, Math.SQRT1_2], RT = [-F[1], F[0]], LT = [F[1], -F[0]];
const along = (p, d, k) => [r3(p[0] + d[0] * k), r3(p[1] + d[1] * k)];
const P_SPOT = along(LAND, F, 0.56);                               // where Phoenix burns out: the ash pile
const PAN_SW = along(P_SPOT, LT, 0.3);                             // the pan, on his left of the pile
const HEAD0 = along(P_SPOT, RT, 0.2), HEAD1 = along(P_SPOT, LT, 0.1);   // the broom head before and after the stroke
const AT_WIN = [WIN_X + 0.16, -1.74];                                      // Reaper at the window
const BROOM0 = { x: 0.42, z: -1.95, tilt: -12 };                   // leaning on the nightstand's side, under the window
const PAN0 = [0.68, -1.72];                                        // on the floor beside it

// mattress grip points for Phoenix's hands (the mattress's own frame: x across from the hinge, z along the bed)
const EDGE = (dz) => [r3(M.w + 0.035), 0.07, r3(-0.75 - BED[1] + dz)];   // toward the foot: a hand-width between their heads

const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: BED, face: "camera", expr: "serene", follow: 0.3, seed: 3.3 },
  { id: "phx", character: "duo/phoenix", at: [OUT[0], OUT[2]], y: OUT[1], face: "camera", expr: "eager", follow: 0.4, seed: 1.7, span: 0.55 },
];
const props = [
  { id: "frame", kind: "bedframe", x: BED[0], z: BED[1] },
  { id: "mat", kind: "tipmattress", x: MAT[0], y: MAT[1], z: MAT[2], cover: 1 },
  { id: "stand", kind: "nightstand", x: E.stand[0], z: E.stand[1] },
  { id: "clock", kind: "digiclock", x: E.stand[0], y: 0.5, z: E.stand[1] + 0.06, scale: 1.25, text: "06:00" },
  { id: "glass", kind: "winglass", x: WIN_X, y: E.win.y0, z: WZ - 0.075, w: E.win.x1 - E.win.x0, h: E.win.y1 - E.win.y0 },
  { id: "curtL", kind: "firecurtain", x: E.win.x0 - 0.2, y: 0.55, z: WZ + 0.08, w: 0.32, h: 1.3, edge: 1 },
  { id: "curtR", kind: "firecurtain", x: E.win.x1 + 0.2, y: 0.12, z: WZ + 0.08, w: 0.34, h: 1.73, edge: -1 },
  { id: "glow", kind: "outglow", x: WIN_X, y: 1.05, z: WZ - 0.7, w: 1.9, h: 1.9 },
  { id: "broom", kind: "broom", x: BROOM0.x, z: BROOM0.z, tilt: BROOM0.tilt },
  { id: "pan", kind: "dustpan", x: PAN0[0], z: PAN0[1], fill: 0 },
  { id: "pile", kind: "ashpile", x: P_SPOT[0], z: P_SPOT[1], scale: 0 },
  // the ash leaving the pan: the stream starts at the pan's lip once it's tipped out over the sill
  { id: "ash", kind: "ashfall", x: r3(AT_WIN[0] - 0.42), y: 0.46, z: -2.74, dur: 0.8 },
];

// ---------------------------------------------------------------- 1 6 AM 0-1.0: the impact is already happening
const T_SMASH = 0.97;
A(0, "phx", "fly", { to: { x: OUT[0], y: OUT[1], z: OUT[2] }, dur: 0.01 });
A(0, "phx", "squash", { amount: 0.38, dur: 0.34 });
A(0, "phx", "expr", { expr: "eager", set: { eye: 0.7 }, dur: 0 }); A(0.3, "phx", "expr", { expr: "eager", set: { eye: 1 }, dur: 0.12 });   // squinting from the slam
c.at(0, { fx: "shake", dur: 0.15, amp: 0.03 });
A(0, "phx", "look", { to: [-0.3, -0.1], dur: 0, blink: false });
A(0, "phx", "noblink");
c.prop(0, "glass", { bulge: 0.75 }, 0.01); c.prop(0.05, "glass", { bulge: 1 }, 0.1, "out"); c.prop(0.15, "glass", { bulge: 0.45 }, 0.4, "settle");
c.prop(0, "glow", { glow: 1 }, 0.01);
sfx(0, "kenney/impact-glass-heavy", { gain: 0.8 }); sfx(0, "thud-soft", { gain: 0.6 });
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// he backs off for another go (the wind-up), wings wide
A(0.36, "phx", "fly", { to: { x: OUT[0], y: OUT[1] + 0.05, z: OUT[2] - 0.35 }, dur: 0.4, ease: "out" });
A(0.36, "phx", "span", { to: 0.75, dur: 0.3 });
// Reaper asleep: eyes shut, hands on the blanket's edge, breathing slow
A(0, "rea", "sit", { seat: "frame", dur: 0, hands: "keep" });
A(0, "rea", "face", { lid: 1, dur: 0 });
A(0, "rea", "look", { to: [0, -0.15], dur: 0, blink: false });
act.blinksAt(c, "rea", []);
c.arm(0, "rea", "R", { x: [-0.2, 0.3, 0.38] }, 0); c.arm(0, "rea", "L", { x: [0.2, 0.3, 0.38] }, 0);
A(0, "rea", "grip", { side: "both", shape: "fist", dur: 0 });
A(0, "rea", "still", { dur: 1.4, idle: 0.3 });

// ---------------------------------------------------------------- 2 ARRIVAL 1.0-2.0: through the glass
A(0.8, "phx", "span", { to: 0.35, dur: 0.12 });                    // wings in to pass the frame
A(0.82, "phx", "fly", { to: { x: ARRIVE[0], y: ARRIVE[1], z: ARRIVE[2] }, dur: 0.36, ease: "in" });
c.prop(T_SMASH, "glass", { smash: 1 }, 0.7, "linear");
c.prop(1.05, "glow", { glow: 0 }, 0.3);
sfx(T_SMASH, "kenney/impact-glass-heavy", { gain: 1.0 }); sfx(T_SMASH + 0.02, "ai/screen-crack", { gain: 0.8 }); sfx(T_SMASH, "punch", { gain: 0.5 });
A(1.1, "phx", "span", { to: 1, dur: 0.15 });
A(1.12, "phx", "wings", { to: 1, dur: 0.15, ease: "out" });
sfx(1.12, "ai/flare", { gain: 0.7 });
A(1.18, "phx", "look", { to: [-0.45, 0.0], dur: 0.12, blink: false });
A(1.18, "phx", "talk", { line: "it's morning it's morning get up get up", dur: 0.8, tone: "excited" });
c.arm(1.2, "phx", "R", { x: [-0.36, 0.78, 0.22] }, 0.15, "out"); c.arm(1.2, "phx", "L", { x: [0.36, 0.78, 0.22] }, 0.15, "out");
c.arm(1.5, "phx", "R", { x: [-0.38, 0.6, 0.3] }, 0.15, "inOut"); c.arm(1.5, "phx", "L", { x: [0.38, 0.86, 0.2] }, 0.15, "inOut");
c.arm(1.75, "phx", "R", { x: [-0.36, 0.86, 0.2] }, 0.15, "inOut"); c.arm(1.75, "phx", "L", { x: [0.38, 0.6, 0.3] }, 0.15, "inOut");
// Reaper opens ONE tired eye and finds him
A(1.45, "rea", "face", { lidL: 0.3, browL: -0.1, dur: 0.18 });
A(1.55, "rea", "look", { to: [0.5, 0.05], dur: 0.15, blink: false });

// ---------------------------------------------------------------- 3 BOUNCE 2.0-3.0: right wall, back wall, the curtain catches
A(2.0, "phx", "fly", { to: { x: WALL_R[0], y: WALL_R[1], z: WALL_R[2] }, dur: 0.18, ease: "in" });
A(2.18, "phx", "squash", { amount: 0.25, dur: 0.12 });
sfx(2.18, "thud", { gain: 0.7 });
A(2.22, "phx", "fly", { to: { x: WALL_B[0], y: WALL_B[1], z: WALL_B[2] }, dur: 0.18, ease: "in" });
A(2.4, "phx", "squash", { amount: 0.25, dur: 0.12 });
sfx(2.4, "thud", { gain: 0.6 });
c.prop(2.42, "curtR", { fire: 1 }, 0.2, "out");
sfx(2.42, "ai/flare", { gain: 0.5 });
A(2.44, "phx", "fly", { to: { x: LIFT0[0], y: LIFT0[1], z: LIFT0[2] }, dur: 0.4, ease: "inOut" });
A(2.1, "phx", "talk", { line: "wheee boing boing", dur: 0.6, tone: "excited" });
A(2.2, "rea", "look", { to: [0.75, 0.15], dur: 0.12, blink: false });
A(2.42, "rea", "look", { to: [0.55, 0.2], dur: 0.12, blink: false });
A(2.7, "rea", "look", { to: [0.35, -0.05], dur: 0.15, blink: false });
A(2.0, "rea", "still", { dur: 1.0, idle: 0.1 });

// ---------------------------------------------------------------- 4 MATTRESS 3.0-4.4: up like a lid, and flop
const T_UP = 3.12, T_TOP = 3.58, T_DROP = 3.86, T_FLAT = 4.04;
A(2.84, "phx", "turn", { to: "left", dur: 0.2 });
A(2.84, "phx", "look", { to: [-0.3, -0.25], dur: 0.12, blink: false });
c.arm(2.86, "phx", "R", { prop: "mat", grip: EDGE(0.16), palm: true }, 0.22, "out");
c.arm(2.86, "phx", "L", { prop: "mat", grip: EDGE(-0.16), palm: true }, 0.22, "out");
A(3.0, "phx", "grip", { side: "both", shape: "hold", dur: 0.1 });
A(3.0, "phx", "talk", { line: "hup! hup! look look!", dur: 0.85, tone: "excited" });
A(3.05, "rea", "ride", { prop: "mat", off: [r3(BED[0] - MAT[0]), 0.02, 0.03], tilt: true, dur: 0.01 });
c.prop(T_UP, "mat", { tilt: -45 }, T_TOP - T_UP, "out");
A(T_UP, "phx", "fly", { to: { x: LIFT1[0], y: LIFT1[1], z: LIFT1[2] }, dur: T_TOP - T_UP, ease: "out" });
sfx(T_UP, "cloth", { gain: 0.6 });
A(T_UP + 0.05, "rea", "face", { lidL: 0.5, lidR: 0.6, dur: 0.15 });
A(T_UP, "rea", "look", { to: [0.2, 0.1], dur: 0.2, blink: false });
// at the top he lets go with a cheer, and the mattress flops back flat with Reaper still on it
A(T_DROP, "phx", "grip", { side: "both", shape: "open", dur: 0.08 });
c.arm(T_DROP, "phx", "R", { x: [-0.36, 0.86, 0.2] }, 0.18, "out"); c.arm(T_DROP, "phx", "L", { x: [0.36, 0.86, 0.2] }, 0.18, "out");
c.prop(T_DROP, "mat", { tilt: 0 }, T_FLAT - T_DROP, "in");
c.prop(T_FLAT, "mat", { tilt: 2.5 }, 0.08, "out"); c.prop(T_FLAT + 0.08, "mat", { tilt: 0 }, 0.14, "settle");
A(T_FLAT, "rea", "squash", { amount: 0.12, dur: 0.22 });
// the conflict, still deadpan (brief): a flat, annoyed stare at Phoenix and a weary "..." (Jonny, 31 Oct: show the friction)
A(T_FLAT + 0.08, "rea", "expr", { expr: "annoyed", dur: 0.25 });
A(T_FLAT + 0.08, "rea", "face", { lidL: 0.5, lidR: 0.5, dur: 0.25 });
A(T_FLAT + 0.08, "rea", "look", { to: [0.7, -0.1], dur: 0.15, blink: false });
act.emote(c, T_FLAT + 0.12, "rea", "...", { dur: 0.6 });
sfx(T_FLAT, "ai/cushion-poof", { gain: 0.9 }); sfx(T_FLAT, "thud-soft", { gain: 0.5 });
A(T_DROP + 0.04, "phx", "fly", { to: { x: P_SPOT[0], y: 0.25, z: P_SPOT[1] }, dur: 0.36, ease: "inOut" });
A(T_DROP + 0.12, "phx", "turn", { to: "3q-left", dur: 0.25 });
A(4.24, "phx", "land", { to: 0, dur: 0.16 });
A(4.3, "rea", "ride", { prop: null });

// ---------------------------------------------------------------- 5 BURNOUT 4.4-5.6: mid-syllable, into one neat pile
const T_OUT = 4.78;
A(4.3, "phx", "look", { to: [-0.55, 0.0], dur: 0.12, blink: false });
A(4.3, "phx", "talk", { line: "again again let's go again let's", dur: T_OUT - 4.3, tone: "excited" });
for (const t of [4.36, 4.54]) A(t, "phx", "squash", { amount: 0.08, dur: 0.16 });   // bouncing on his toes
c.arm(4.3, "phx", "R", { x: [-0.38, 0.62, 0.3] }, 0.15, "out"); c.arm(4.3, "phx", "L", { x: [0.38, 0.62, 0.3] }, 0.15, "out");
// the sputter: a wobble, then down into the pile; the curtain fire dies with him
A(4.56, "phx", "face", { lid: 0.55, dur: 0.12 });                           // running out: the lids drop mid-word
A(T_OUT - 0.1, "phx", "squash", { amount: 0.1, dur: 0.1 });
A(T_OUT, "phx", "grow", { to: 0.12, dur: 0.16, ease: "in" });
A(T_OUT, "phx", "wings", { to: 0, dur: 0.12 });
A(T_OUT + 0.17, "phx", "hide");
c.prop(T_OUT + 0.08, "pile", { scale: 1, glow: 1 }, 0.12, "out");
c.prop(T_OUT + 0.55, "pile", { glow: 0 }, 0.8, "inOut");
c.prop(T_OUT, "curtR", { fire: 0, scorch: 1 }, 0.12, "out");
c.at(T_OUT + 0.06, { fx: "poof", pos: [P_SPOT[0], 0.18, P_SPOT[1]], color: "#9b97a3", puffs: 14, sparks: 0, size: 0.6, dur: 0.6 });
sfx(T_OUT - 0.02, "ai/snuff", { gain: 0.7 }); sfx(T_OUT + 0.06, "poof", { gain: 0.35 });
// the still beat: Reaper looks down at the pile, both eyes half open; he knows the drill
A(4.3, "rea", "still", { dur: 0.94, idle: 0.05 });
A(4.4, "rea", "look", { to: [0.75, -0.25], dur: 0.15, blink: false });
A(4.86, "rea", "look", { to: [0, 0], dur: 0.1, blink: false });            // a deadpan glance at us: every morning
A(5.12, "rea", "look", { to: [0.6, -0.3], dur: 0.1, blink: false });
A(T_OUT + 0.22, "rea", "expr", { expr: "deadpan", dur: 0.25 });
A(T_OUT + 0.22, "rea", "face", { lidL: 0.5, lidR: 0.5, browL: 0, dur: 0.25 });
// out of bed on the window side: blanket off, one hop down, turning to the pile
// (the clip renders without motion blur: Jonny, 31 Oct, saw blur as soft focus, and it smeared Reaper's face here)
const T_OFF = 5.24;
c.prop(T_OFF, "mat", { cover: 0 }, 0.18, "out"); sfx(T_OFF, "cloth", { gain: 0.6 });
A(T_OFF, "rea", "stand", { dur: 0.28 });
A(T_OFF, "rea", "hop", { height: 0.16, dur: 0.34 });
A(T_OFF, "rea", "move", { to: LAND, dur: 0.34, ease: "inOut", steps: 0 });
A(T_OFF + 0.05, "rea", "turn", { to: "right", dur: 0.3 });
c.arm(T_OFF, "rea", "R", "rest", 0.25); c.arm(T_OFF, "rea", "L", "rest", 0.25);
A(T_OFF, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.2 });

// ---------------------------------------------------------------- 6 SWEEP 5.6-6.6: one stroke
// (the cut at 5.6 is on the reach: the broom and the pan stood within reach of where he landed). The broom leans from
// its head on the floor up to his right fist along BR_DIR, and keeps that angle through the stroke: the fist and the
// head travel together from his right to his left.
const T_SW = 5.6, GRIP_H = 0.56;
const AIM = [LAND[0] + F[0] * 0.44 + RT[0] * 0.4, 0.5, LAND[1] + F[1] * 0.44 + RT[1] * 0.4];   // about where his fist is
const BR_DIR = [AIM[0] - HEAD0[0], AIM[1], AIM[2] - HEAD0[1]].map((v, i, a) => v / Math.hypot(...a));
const HAND0 = [r3(HEAD0[0] + BR_DIR[0] * GRIP_H), r3(BR_DIR[1] * GRIP_H), r3(HEAD0[1] + BR_DIR[2] * GRIP_H)];
const BR_ROT = r3((Math.atan2(-BR_DIR[2], BR_DIR[0]) * 180) / Math.PI), BR_TILT = r3((Math.acos(BR_DIR[1]) * 180) / Math.PI);
const HAND1 = [r3(HAND0[0] + HEAD1[0] - HEAD0[0]), HAND0[1], r3(HAND0[2] + HEAD1[1] - HEAD0[1])];
const PAN_ROT = r3((Math.atan2(RT[0], RT[1]) * 180) / Math.PI);   // its mouth (+z) toward the broom side
c.prop(T_SW, "pan", { x: PAN_SW[0], z: PAN_SW[1], rot: PAN_ROT }, 0);
A(T_SW, "rea", "pitch", { to: 14, dur: 0.15 });
A(T_SW, "rea", "crouch", { to: 1, dur: 0.15 });
c.prop(T_SW, "broom", { x: HEAD0[0], z: HEAD0[1], tip: 0, tilt: BR_TILT, rot: BR_ROT }, 0);
c.arm(T_SW, "rea", "R", { prop: "broom", grip: "hand" }, 0);
A(T_SW, "rea", "grip", { side: "R", shape: "fist", dur: 0 });
A(T_SW + 0.02, "rea", "grab", { prop: "broom", hand: "R", grip: "hand", dur: 0, pose: null });
A(T_SW, "rea", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
c.arm(T_SW + 0.02, "rea", "R", { world: HAND0 }, 0.18, "inOut");
const T_STROKE = 5.86;
c.arm(T_STROKE, "rea", "R", { world: HAND1 }, 0.24, "inOut");
c.prop(T_STROKE + 0.04, "pile", { x: HEAD1[0] + LT[0] * 0.12, z: HEAD1[1] + LT[1] * 0.12, scale: 0.55 }, 0.2, "in");
c.prop(T_STROKE + 0.22, "pile", { scale: 0 }, 0.05);
c.prop(T_STROKE + 0.14, "pan", { fill: 1 }, 0.14);
sfx(T_STROKE, "ai/cookie-scrape", { gain: 0.8 });
// the broom goes back against the bed, he takes the pan
const BROOM_BED = { x: -0.04, z: -1.0, tilt: -18, rot: 0 };
A(6.16, "rea", "release", { prop: "broom", to: [BROOM_BED.x, 0, BROOM_BED.z], dur: 0.22 });
c.prop(6.16, "broom", { tilt: BROOM_BED.tilt, rot: BROOM_BED.rot }, 0.22);
sfx(6.38, "thud-soft", { gain: 0.25 });
c.arm(6.16, "rea", "R", "rest", 0.3);
A(6.1, "rea", "look", { to: [0.5, -0.45], dur: 0.12, blink: false });
c.arm(6.2, "rea", "L", { prop: "pan", grip: "handle", palm: true }, 0.22, "out");
A(6.36, "rea", "grip", { side: "L", shape: "fist", dur: 0.08 });
A(6.46, "rea", "grab", { prop: "pan", hand: "L", grip: "handle", dur: 0, pose: null });

// ---------------------------------------------------------------- 7 OUTSIDE 6.6-7.6: tipped out of the window
const T_TIP = 6.98, OUT_X = r3(AT_WIN[0] - 0.42), OUT_HAND = [OUT_X, 0.76, -2.46];   // out at his left side, clear of his face
A(6.5, "rea", "crouch", { to: 0, dur: 0.2 }); A(6.5, "rea", "pitch", { to: 0, dur: 0.2 });
A(6.5, "rea", "look", { to: [0, 0.1], dur: 0.12, blink: false });
A(6.5, "rea", "turn", { to: "back", dur: 0.32 });
A(6.5, "rea", "move", { to: AT_WIN, dur: 0.4, steps: 2.4 });
c.arm(6.55, "rea", "L", { x: [0.32, 0.5, 0.4] }, 0.22, "inOut");   // carried at his side, up over sill height
c.prop(6.6, "pan", { rot: 180 }, 0.3);
c.arm(6.78, "rea", "L", { world: [OUT_X, 0.8, -2.2] }, 0.1, "inOut");   // just inside, over the sill...
c.arm(6.88, "rea", "L", { world: OUT_HAND }, 0.1, "inOut");          // ...and out
c.arm(T_TIP, "rea", "L", { world: [OUT_X, 0.68, -2.46] }, 0.2, "inOut");   // ...down outside, and tipped
c.prop(T_TIP, "pan", { tip: 50 }, 0.2, "inOut");
c.prop(T_TIP + 0.1, "pan", { fill: 0 }, 0.22);
c.prop(T_TIP + 0.08, "ash", { fall: 1 }, 0.8, "linear");
sfx(T_TIP + 0.08, "sizzle", { gain: 0.2 });
// back in over the sill, and down by the bed
c.prop(7.22, "pan", { tip: 0 }, 0.14);
c.arm(7.22, "rea", "L", { world: [OUT_X, 0.84, -2.15] }, 0.16, "inOut");
c.arm(7.38, "rea", "L", { world: [AT_WIN[0] - 0.42, 0.24, AT_WIN[1] - 0.02] }, 0.16, "inOut");
A(7.54, "rea", "release", { prop: "pan", to: [AT_WIN[0] - 0.42, 0, AT_WIN[1] + 0.1], dur: 0.04 });
sfx(7.57, "put-down", { gain: 0.35 });

// ---------------------------------------------------------------- 8 AGAIN 7.6-9.0: back to bed, and the glow comes back
const T_BED = 7.6;
A(T_BED, "rea", "turn", { to: "camera", dur: 0 });
A(T_BED, "rea", "move", { to: [0.12, -1.45], dur: 0 });   // close by the bed, so the hop in stays under the blur speed
c.arm(T_BED, "rea", "L", "rest", 0);
A(T_BED + 0.02, "rea", "sit", { seat: "frame", dur: 0.5, hands: "keep" });
A(T_BED + 0.02, "rea", "hop", { height: 0.1, dur: 0.48 });
c.prop(8.08, "mat", { cover: 1 }, 0.28, "out"); sfx(8.08, "cloth", { gain: 0.5 });
c.arm(8.08, "rea", "R", { x: [-0.2, 0.3, 0.38] }, 0.28); c.arm(8.08, "rea", "L", { x: [0.2, 0.3, 0.38] }, 0.28);
A(8.25, "rea", "expr", { expr: "serene", dur: 0.25 });
A(8.25, "rea", "face", { lid: 1, dur: 0.25 });
A(8.25, "rea", "look", { to: [0, -0.15], dur: 0.2, blink: false });
A(8.25, "rea", "still", { dur: 0.74, idle: 0.3 });
c.prop(8.62, "glow", { glow: 0.95 }, 0.22, "out");
sfx(8.72, "sizzle", { gain: 0.22 });
A(8.74, "rea", "face", { lidR: 0.35, dur: 0.12 }); A(8.74, "rea", "look", { to: [0.6, 0.1], dur: 0.12, blink: false });   // one tired eye: here we go again

// the hook caption (Jonny's rule: on screen from frame 0)
cap(0, 2.6, "that one friend with too much energy", 250, false, { kinetic: false });
// Phoenix's gibberish in plain words (Jonny, 31 Oct: every gibberish line gets a subtitle), one line, low in the safe zone
const SUB = 1240, sub = (from, to, text) => cap(from, to, text, SUB, false, { kinetic: false, size: 62 });
sub(0, 1.1, "WAKE UP!");
sub(1.18, 2.05, "it's MORNING!");
sub(2.1, 2.9, "wheee! boing!");
sub(3.0, 3.95, "look! LOOK!");
sub(4.3, T_OUT + 0.1, "again! ag—");

// ---------------------------------------------------------------- shots
const MASTER = frame([0.0, 0.92, -1.45], { az: -12, el: 10, h: 3.6, fov: 34 });
const BURN = frame([0.0, 0.62, -1.0], { az: 20, el: 8, h: 2.7, fov: 36 });
const BOUNCE = frame([0.5, 1.05, -1.6], { az: -22, el: 8, h: 4.8, fov: 38 });
const LIFT = frame([-0.3, 0.85, -1.2], { az: -26, el: 30, h: 3.6, fov: 32 });
const SWEEP = frame([0.55, 0.42, -0.95], { az: 55, el: 12, h: 2.2, fov: 40 });
const WINDOW = frame([WIN_X + 0.05, 0.62, -2.4], { az: 198, el: 6, h: 2.0, fov: 40 });   // from outside, looking in
const beats = c.beats([
  ["6 am", 0, MASTER, "hook"],
  ["arrival", 1.0, "keep"],
  ["bounce", 2.0, BOUNCE, "escalation"],
  ["mattress", 3.0, LIFT],
  ["burnout", 4.4, BURN, "payoff"],
  ["sweep", T_SW, SWEEP],
  ["outside", 6.64, WINDOW],
  ["again", 7.6, MASTER, "reaction"],
], END);

write(import.meta.url, {
  id: "too-much-energy",
  title: "Too Much Energy",
  cover: 3.5,
  idea: "Friend comedies 23 (Jonny's brief 30 Oct 2026): 6 AM, Phoenix crashes in with too much energy and burns out into ash; Reaper sweeps him out of the window and goes back to sleep; the window glows again",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  motionBlur: false,   // Jonny 31 Oct: blur read as soft focus; at 30 fps it smeared Reaper's face on his hops
  castLook: "golden",
  set: { type: "energyroom", night: true, seed: 6, aperture: FOCUS ? 0.03 : 0, ...(FOCUS && { focus: "acting" }) },
  // a bright, busy bed for Phoenix's energy, cut dead at the burnout (the brief's silence)
  music: { style: "chip", seed: 23, gain: 0.32, until: T_OUT, dip: false },
  sound: { sfx: 0.7, ambience: 0.15, speech: false, signature: false, surface: "wood" },
  creative: { length: [9, 9] },
  hook: { show: ["rea", "phx", "clock"], hint: 0, what: "6 AM: Phoenix slams into the window beside sleeping Reaper" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "rea", with: "frame", from: 0, to: 5.5, reason: "Reaper sits in bed (his legs under the blanket, over the frame)" },
    { who: "rea", with: "mat", from: 0, to: 5.5, reason: "Reaper sits in bed on the mattress, under the blanket, and rides it when it tips" },
    { who: "rea", with: "frame", from: 7.6, to: END, reason: "Reaper gets back into bed" },
    { who: "rea", with: "mat", from: 7.6, to: END, reason: "Reaper gets back into bed under the blanket" },
    { who: "phx", with: "mat", from: 2.84, to: 3.9, reason: "Phoenix's hands are on the mattress's edge while he tips it up" },
  ],
  notes: "Generated by storyboards/friend-comedies/23-too-much-energy/make-too-much-energy.mjs.",
});
