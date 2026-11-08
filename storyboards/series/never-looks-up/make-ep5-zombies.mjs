// NEVER LOOKS UP, episode 5: ZOMBIES (4 Nov 2026). "The friend who never looks up from his phone… even in a zombie apocalypse"
// Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip (05-zombies/); series format
// 00-SERIES-FORMAT.md; the panel notes are PANELS-zombies.md next to this file. The panels are the target.
//
// THE BRIEF
//   Joke:        a zombie horde shambles down the street; Phoenix, bowed over his glowing phone, groans at it like one of
//                them, so they take him for one of their own.
//   Wants:       the friends want to stay hidden (and get him out); the horde wants brains, then a club.
//   Consequence: the lead zombie sits beside him and leans in to watch his screen; the horde copies his pose.
//   Ending:      the series ending: he looks up, "huh.", back to the phone, ping; the zombie pats his shoulder like a
//                friend and the horde bows round him like a phone club (the friends fled for good, Jonny 5 Nov).
//   Callback:    the opening's threat (a horde coming for everyone) ends as Phoenix's club, coming for the friends.
//
//   node storyboards/series/never-looks-up/make-ep5-zombies.mjs
//   V3=1 node storyboards/series/never-looks-up/make-ep5-zombies.mjs   -> never-looks-up-zombies-v3rules.json: the reach
//   rules v3 opening (7 Nov 2026, research/hook-curiosity-2026-11-07): Phoenix's promise "I'll look up in a sec." from
//   0.0 s, a close-up on fleeing Reaper glancing back at him at 1.05 s with a 0.7 s freeze, back to the same wide; the
//   rest unchanged
import { clip, write as writeSb, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { nowRules } from "../../lib/now-rules.mjs";
import { stretchAt } from "../../lib/stretch.mjs";
import fs from "node:fs";

const FACES = "strong", MOTION = "natural";
const ENV = process.env.ENV ?? "dusk-bus-stop";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0;
const V3 = !!process.env.V3;   // the reach rules v3 opening (see the top)
const write = (u, sb) => writeSb(u, V3 ? stretchAt(nowRules(sb), 1.05, 0.7, 0.25) : sb);   // the whole close-up (1.05-1.3 s story) plays at 1/3.8 speed, from its cut, so the tracking camera and Reaper slow together;   // v3 re-cuts take today's template motion (Jonny 7 Nov)
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// ---------------------------------------------------------------- places (x right, z toward us; the street runs away to -z)
// Laid out on a top-down plan so that every path keeps a body-width (0.8 m, arms forward) from the props and from the
// others. As in the panels the bench stands in front of the shelter, which sits back at the left edge; the hedge is on
// the right; the horde's lane runs down the middle (x 0..0.3) between them, and each zombie stops in arrival order,
// the deepest spot first.
// Everything below is planned in "plan" coordinates; the whole stage stands DZ further down the street in the world,
// where the painting has floor under a camera that looks level (the painted floor starts 6.9 m from the painting eye).
const DZ = +(process.env.DZ ?? -3.0);
const W = ([x, z]) => [x, r3(z + DZ)];
const BENCH = { x: -0.55, z: 2.4, rot: 15, scale: 1.3 };       // 1.56 m long (along -0.78..0.78), back at fwd -0.31
const HEDGE = { x: 1.4, z: 0.35, w: 1.3, h: 0.55, d: 0.55 };   // low, as in the panels: the friends' faces show over it   // x 0.75..2.05, z 0.08..0.63
const BIN = { x: 2.3, z: 1.0 };
const LAMP = { x: -2.2, z: -1.5 };
const SH = { x: -2.7, z: 0.5, rot: 20 };                        // the shelter, back at the left edge (its right posts x < -1.2)
const at = (b, along, fwd = 0) => { const y = rad(b.rot); return [r3(b.x + Math.cos(y) * along + Math.sin(y) * fwd), r3(b.z - Math.sin(y) * along + Math.cos(y) * fwd)]; };
const PHX = at(BENCH, -0.38);
const ZV_SEAT = 0.42;                                         // where zombie Viking sits (along the bench)
// the friends flee: from frame 0 they sprint toward us, side by side, and out of the picture past the
// camera's right side (Jonny 5 Nov: "run away in fear ... run out of the scene, towards the viewer"), gone for good
const REA0 = [0.45, -0.5], WIZ0 = [1.45, -1.7];             // frame 0: Reaper on the left, half a step ahead of the Wizard
const FLEE = {                                                // two lanes a body-width apart, right of the bench's end; they stop out of every shot
  rea: [REA0, [0.9, 1.3], [1.4, 3.0], [1.8, 3.8]],
  wiz: [WIZ0, [1.85, 0.8], [2.4, 2.3], [3.3, 3.2]],
};
// the horde at frame 0: strung out down the lane, Viking in front, each 0.9 m+ from the next
const H0 = { vik: [-0.7, -2.2], gun: [0.15, -3.2], sor: [V3 ? 0.27 : 0.05, -4.4], sam: [0.95, -5.6], dra: [-1.4, -3.3] };   // Viking clear of the Wizard on screen at frame 0
// where they end up (5.0-7.0), round the bench, bowed over cupped mittens: Viking sits beside him, Dragon and
// Sorcerer stand behind the bench's back, Gunslinger at its right end, Samurai behind him to the right
// (no zombie stands between the camera and the hedge in the club shot, so the friends' faces show over it: the
// Gunslinger walks on past to the bin, out of the club shot)
const H1 = { dra: at(BENCH, -0.2, -0.95), sam: at(BENCH, 1.3, -0.95), gun: [2.35, 2.45], sor: [-1.1, 0.0] };   // Samurai right of the Viking's cupped hands on screen
const PATH = {
  gun: [H0.gun, [-0.05, 0.2], [0.35, 1.02], [1.4, 1.15], [1.8, 2.0], H1.gun],   // down the middle, then right along the front of the hedge
  sor: [H0.sor, [V3 ? 0.04 : -0.1, -3.0], [-0.35, -2.2], H1.sor],                   // left of the lane, second row behind the bench
  sam: [H0.sam, [0.4, -1.5], [0.0, -0.45], [0.2, 0.6], H1.sam],                    // right of the lane, past the hedge's end, to behind the Viking
  dra: [H0.dra, [-1.05, 0.45], H1.dra],
};
const VIK_FRONT = at(BENCH, 0.55, 0.92);                       // he stops at the bench's free end, over Phoenix (3.2-5.0)

const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const CUP_R = { x: [-0.1, PH_Y, PH_Z - 0.02] }, CUP_L = { x: [0.1, PH_Y, PH_Z - 0.02] };   // the zombies' empty "phone" hands
const AT_PHONE = [0.03, -1];
const ARMS_OUT = { o: [-0.06, 0.42, 0.42] };                    // a zombie's arms forward, about a body-width apart
const ARMS_NARROW = { o: [-0.1, 0.42, V3 ? 0.34 : 0.42] };   // hands closer together (v3: a little shorter, today's run sways them into the Sorcerer's hood)

const Z = ["vik", "sam", "gun", "dra", "sor"];
const cast = [
  { id: "phx", character: "duo/phoenix", at: W(PHX), face: BENCH.rot, expr: "kind", follow: 0.3, seed: 1.7, span: 0, arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: W(WIZ0), face: 5, expr: "shocked", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: W(REA0), face: 0, expr: "shocked", follow: 0.3, seed: 3.1 },
  { id: "vik", character: "zombie/viking-zombie", at: W(H0.vik), face: 0, expr: "deadpan", follow: 0.2, seed: 5.1 },
  { id: "sam", character: "zombie/samurai-zombie", at: W(H0.sam), face: 8, expr: "deadpan", follow: 0.2, seed: 5.7 },
  { id: "gun", character: "zombie/gunslinger-zombie", at: W(H0.gun), face: -10, expr: "deadpan", follow: 0.2, seed: 6.3 },
  { id: "dra", character: "zombie/dragon-zombie", at: W(H0.dra), face: 4, expr: "deadpan", follow: 0.2, seed: 6.9 },
  { id: "sor", character: "zombie/sorcerer-zombie", at: W(H0.sor), face: -6, expr: "deadpan", follow: 0.2, seed: 7.4 },
];
const props = [
  { id: "shelter", kind: "busshelter", x: SH.x, z: SH.z + DZ, rot: SH.rot, w: 1.8, d: 0.85, h: 2.1, flicker: true },
  { id: "bench", kind: "bench", ...BENCH, z: BENCH.z + DZ },
  { id: "bin", kind: "recyclebin", x: 3.0, z: 0.4 + DZ, rot: -15 },
  { id: "lamp", kind: "streetlamp", x: LAMP.x, z: LAMP.z + DZ, h: 3.0, flicker: true },
  { id: "fog", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-2.5, 0, -8 + DZ], [2.5, 0.7, DZ]], n: 26, size: 1.6, color: "#a99bc4", on: 0.8, drift: [0.06, 0.02] },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.9, z: PHX[1] + 0.45 + DZ, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", bright: 2.2, halo: 0.32, haloK: 0.45 },   // under 0.5: the contact checks skip it as glow   // a bright screen that lights his face (Jonny 5 Nov)
];

// ---------------------------------------------------------------- Phoenix: on the bench, bowed over the phone, from frame 0
A(0, "phx", "sit", { seat: "bench", along: -0.38, dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: V3 ? 0 : 0.01 });
A(0, "phx", "face", { lid: 0.6, dur: 0 });
A(0, "phx", "pitch", { to: 6, dur: 0 });                         // the bowed head that makes him one of them
act.blinksAt(c, "phx", [1.9, 4.6, 6.9]);
act.scrollPhone(c, "phx", [0.2, 1.1, 2.0, 3.0, 4.75, 5.6, 6.5, 7.3]);
prop(0, "phone", { glow: 1 }, V3 ? 0 : 0.01);

// ---------------------------------------------------------------- the horde: tired zombies, arms forward, a slow shuffle
for (const z of Z) {
  A(0, z, "face", { lid: 0.55, dur: 0 });
  const arms = z === "sam" ? ARMS_NARROW : ARMS_OUT;            // Samurai walks the gap between the Dragon's tail and the Wizard
  c.arm(0, z, "R", arms, 0); c.arm(0, z, "L", arms, 0);
  A(0, z, "look", { to: [0, -0.1], dur: 0, blink: false });
}
// no automatic blinks on the key lines: slow placed blinks only (tired zombies blink rarely)
Z.forEach((z, i) => { A(0, z, "noblink"); act.blinksAt(c, z, [3.05 + i * 0.07, 6.6 + i * 0.09].map(r3), 0.3); });
A(0, "wiz", "noblink"); act.blinksAt(c, "wiz", [2.55, 4.3, 7.4]);
// one long shuffle each (a slow run along a path: planted feet, no stops), Viking in front
const shuffle = (who, t0, dur, pts, rate = 1.1) => A(t0, who, "run", { pts: pts.map(([t, x, z]) => [r3(t), r3(x), r3(z + DZ)]), dur, rate: [[0, rate], [dur, rate * 0.9]], stride: 0.7 });
const segT = (pts, dur) => {                                    // time along a path in proportion to its length
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let acc = 0; return pts.map((p, i) => { if (i) acc += L[i - 1]; return [(acc / tot) * dur, ...p]; });
};
shuffle("vik", 0, 3.15, segT([H0.vik, [-0.05, 0.6], [0.85, 1.6], [0.95, 2.8], VIK_FRONT], 3.15), 1.2);
A(2.75, "vik", "turn", { to: -50, dur: 0.45 });                 // round to face Phoenix, three-quarter to us (panel 03)
for (const [z, dur] of [["gun", 4.6], ["sam", 5.3], ["dra", 4.0], ["sor", 4.2]]) {
  shuffle(z, 0, dur, segT(PATH[z], dur), 1.0);
  c.arm(dur - 0.45, z, "R", "rest", 0.4); c.arm(dur - 0.45, z, "L", "rest", 0.4);   // arms down as they stop (clear of the bench)
}
sfx(0, "groan", { gain: 0.35, dur: 3.0, reason: "the horde's low overlapping groans as it shambles in" });
if (!V3) sfx(0, "lampbuzz", { gain: 0.12, dur: END, reason: "the flickering street lamp over the bench" });   // v3: gone (Jonny 8 Nov: "an underlying buzz through the whole video")

// ---------------------------------------------------------------- 1 HORDE 0-1.5 (P1): the friends sprint past and dive behind the hedge
const CAP_Y = 640;
const flee = (who, t0, dur, pts) => A(t0, who, "run", { pts: segT(pts, dur).map(([t, x, z]) => [r3(t), r3(x), r3(z + DZ)]), dur, rate: [[0, 4.2], [dur, 4.0]], stride: 1.7 });
const creep = (who, t0, dur, pts) => A(t0, who, "run", { pts: segT(pts, dur).map(([t, x, z]) => [r3(t), r3(x), r3(z + DZ)]), dur, rate: [[0, 3.0], [dur * 0.7, 3.0], [dur, 2.2]], stride: 0.9 });
flee("rea", 0, 1.35, FLEE.rea);
flee("wiz", 0, 1.5, FLEE.wiz);
// terrified from frame 0: wide eyes, open mouths, both arms flailing over their heads (wider than the hat brim)
act.shock(c, 0, "wiz", { open: 0.55, hold: 1.4, dur: 0.01 }); act.shock(c, 0, "rea", { open: 0.5, hold: V3 ? 0.5 : 1.2, dur: 0.01 });
A(0, "wiz", "look", { to: [-0.15, 0.25], dur: 0, blink: false }); A(0, "rea", "look", { to: [0.1, 0.25], dur: 0, blink: false });
if (!V3) A(0.05, "wiz", "talk", { line: "zom-bies!", dur: 0.6, tone: "excited", voice: false });   // v3: Phoenix's promise is the only line
if (!V3) c.cap(0.05, 1.1, "ZOMBIES!!", CAP_Y);
if (V3) {
  // B7: the first line at 0.0 is a promise the viewer expects him to break, said flat to the phone as the horde comes
  A(0.03, "phx", "talk", { line: "I'll look up in a sec.", dur: 0.95, tone: "calm", voice: false });
  c.cap(0.03, 1.05, "I'll look up in a sec.", CAP_Y);
  c.cap(1.05, 1.5, "I'll look up in a sec.", 425, false, { kinetic: false });   // in the close-up: above his hood
  // B8: Reaper glances back at Phoenix as he runs, then the cut to his face and a 0.7 s freeze on it
  A(0.9, "rea", "look", { to: [-1.0, 0.1], dur: 0.12, blink: false });
  act.mood(c, 0.92, "rea", "annoyed", { hold: 0.25, squash: 0 });
  // the 0.7 s reaction hold on the close-up is a live one (stretchAt in write below), not a hit-stop: Jonny 8 Nov, the frozen picture "seems to be stuck"
}
// the outer arm flails up and out, the arm on the friend's side pumps in front of the body (clear of the other one)
const UP = { o: [0.3, 0.8, 0.12] }, MID = { o: [0.34, 0.55, 0.16] }, IN_HI = { o: [0.06, 0.6, 0.36] }, IN_LO = { o: [0.04, 0.4, 0.34] };
for (const [w, t0, inner] of [["wiz", 0, "R"], ["rea", 0.07, "L"]]) for (let i = 0; i < 7; i++) {
  const t = r3(t0 + i * 0.17), outer = inner === "R" ? "L" : "R";
  c.arm(t, w, outer, i % 2 ? MID : UP, t ? 0.15 : 0); c.arm(t, w, inner, i % 2 ? IN_HI : IN_LO, t ? 0.15 : 0);
}
A(0.5, "rea", "turn", { to: 25, dur: 0.3 }); A(0.55, "wiz", "turn", { to: 25, dur: 0.3 });   // veering out past us
for (const w of ["wiz", "rea"]) c.arm(1.3, w, "R", "rest", 0.2), c.arm(1.3, w, "L", "rest", 0.2);
see(0, 0.6, ["phx.face", "wiz.face", "rea.face", "vik", "phone"], "P1: the friends flee toward us from the horde, Phoenix on his phone");
if (V3) see(1.07, 1.28, ["rea.face"], "B8: Reaper's face as he looks back at Phoenix, frozen");

// ---------------------------------------------------------------- 2 ALONE 1.5-3.2 (P2): the friends are gone; the horde closes in
see(1.6, 3.1, ["phx.face", "vik"], "P2: the horde closes in on Phoenix, alone on the bench");

// the ping: Phoenix's tiny smile
sfx(2.7, "notify", { gain: 0.42 });
A(2.75, "phx", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.2 });
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: 0.25 });

// ---------------------------------------------------------------- 3 ONE OF US 3.2-5.0 (P3)
A(3.15, "vik", "look", { to: [-0.2, -0.45], dur: 0.15, blink: false });
c.arm(3.2, "vik", "R", "rest", 0.4); c.arm(3.2, "vik", "L", "rest", 0.4);
for (const t of [3.35, 3.55]) A(t, "vik", "squash", { amount: -0.03, dur: 0.12 });   // sniff, sniff
sfx(3.35, "snort", { gain: 0.4, reason: "zombie Viking sniffs at Phoenix" });
A(3.6, "vik", "lean", { to: -10, dur: 0.3 });                                       // the head tilt, held
A(3.8, "phx", "talk", { line: "uhhhhh", dur: 0.6, tone: "calm" });
A(3.8, "phx", "pitch", { to: 14, dur: 0.4 }); A(4.25, "phx", "pitch", { to: 6, dur: 0.3 });   // the groan droops his head further
A(3.8, "phx", "expr", { expr: "kind", set: { curve: -0.1, eye: 0.85, open: 0.5 }, dur: 0.2 });
A(4.45, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: 0.25 });
A(4.5, "vik", "lean", { to: 0, dur: 0.25 });
sfx(4.5, "groan", { gain: 0.6, dur: 0.6, reason: "zombie Viking groans back the same sound" });
A(4.5, "vik", "expr", { expr: "kind", set: { open: 0.5, curve: 0.1 }, dur: 0.15 });
A(4.3, "vik", "look", { to: [-0.4, -0.9], dur: 0.15, blink: false });   // from his face to the phone
A(4.5, "vik", "face", { lid: 0.6, dur: 0.2 });
for (const [t, p] of [[4.5, 22], [4.85, 6]]) A(t, "vik", "pitch", { to: p, dur: 0.3 });   // bowed like him, then one slow nod: one of us
see(3.3, 4.95, ["phx.face", "vik.face"], "P3: zombie Viking sniffs at him; Phoenix's bored groan; Viking groans back and nods");

// ---------------------------------------------------------------- 4 CLUB 5.0-7.0 (P4, P5)
A(5.25, "vik", "turn", { to: BENCH.rot + 180, dur: 0.35 });
A(5.45, "vik", "sit", { seat: "bench", along: ZV_SEAT, dur: 0.45, hands: "lap" });
sfx(5.85, "creak", { gain: 0.5, dur: 0.35, reason: "the bench creaks under zombie Viking" });
A(5.9, "vik", "turn", { to: BENCH.rot, dur: 0.01 });
// the other four bow their heads and cup their mittens as if they held phones too
for (const [z, t] of [["sor", 5.2], ["gun", 5.35], ["sam", 5.5], ["dra", 5.6]]) {
  A(t, z, "turn", { to: BENCH.rot, dur: 0.4 });                    // square to the street, like the two on the bench
  c.arm(t + 0.1, z, "R", CUP_R, 0.4); c.arm(t + 0.1, z, "L", CUP_L, 0.4);
  A(t + 0.15, z, "look", { to: AT_PHONE, dur: 0.2, blink: false });
  A(t + 0.15, z, "pitch", { to: 6, dur: 0.3 });
}
c.arm(6.1, "vik", "R", CUP_R, 0.35); c.arm(6.1, "vik", "L", CUP_L, 0.35);
A(6.2, "vik", "look", { to: AT_PHONE, dur: 0.2, blink: false });
see(5.6, 6.9, ["phx.face", "vik.face"], "P4-5: the horde copying his pose round the bench");

// ---------------------------------------------------------------- 5 PEAK 7.0-8.0 (P6)
A(7.0, "vik", "lean", { to: 14, dur: 0.45 });                          // cheek to cheek over the phone
A(7.0, "vik", "look", { to: [-0.6, -0.8], dur: 0.2, blink: false });
A(7.1, "vik", "expr", { expr: "happy", set: { curve: 0.3, eye: 0.9 }, dur: 0.3 });
see(7.1, 8.0, ["phx.face", "vik.face", "phone"], "P6: zombie Viking leaning in to watch the screen, the horde round the bench");

// ---------------------------------------------------------------- 6 LOOK-UP 8.0-9.0 (P7)
A(8.05, "phx", "look", { to: [0.75, 0.25], dur: 0.12, blink: false });   // eyes over to zombie Viking
A(8.05, "phx", "face", { lid: 0.2, dur: 0.12 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.textPop(8.5, "phx", "huh.", { xy: [520, 1450], dur: 0.5, color: "#ffffff", size: 110, angle: -4 });   // lower centre, under both faces (panel 07)
A(8.1, "vik", "look", { to: [-0.8, 0.1], dur: 0.15, blink: false });
see(8.1, 8.95, ["phx.face", "vik.face"], "P7: Phoenix looks up into zombie Viking's face: huh.");

// ---------------------------------------------------------------- 7 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.6, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.34 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
act.scrollPhone(c, "phx", [9.4]);
// the friendly pat: a flat mitten on his shoulder, then the heads turn to the hedge
A(9.05, "vik", "lean", { to: 0, dur: 0.25 });
c.arm(9.1, "vik", "R", { o: [0.12, 0.42, 0.3] }, 0.25, "out");
c.hitStop(9.35, 3);
sfx(9.35, "pat", { gain: 0.6, reason: "zombie Viking pats Phoenix's shoulder" });
A(9.35, "phx", "squash", { amount: 0.03, dur: 0.12 });
// the club settles round him: every head bows back over its "phone", the Viking's too (the horde has adopted him)
for (const [z, t] of [["vik", 9.5], ["gun", 9.55], ["sam", 9.62], ["dra", 9.7], ["sor", 9.76]]) {
  A(t, z, "look", { to: AT_PHONE, dur: 0.15, blink: false });
  A(r3(t + 0.1), z, "pitch", { to: 12, dur: 0.3 });
  A(r3(t + 0.1), z, "expr", { expr: "kind", set: { curve: 0.35, eye: 0.8 }, dur: 0.3 });
}
see(9.5, 9.95, ["phx.face", "vik.face", "phone"], "P8: the horde bowed round Phoenix like a phone club; he's one of them");

// ---------------------------------------------------------------- shots (the street runs away from us; shelter left, hedge right)
const E = JSON.parse(fs.readFileSync(new URL(`../../../assets/environments/${ENV}/env.json`, import.meta.url)));
const EYE_PITCH = E.eye.pitch;   // + = down
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
// aimed shots: [camera position, the point it looks at, vertical fov] (planned with a projection of the eyes so every
// face the beat needs sits inside the frame; see PANELS-zombies.md)
const SHOTS = JSON.parse(process.env.SHOTS ?? "null") ?? {
  WIDE: [[-0.3, 1.9, 9.0], [0.2, 0.9, -1], 44],        // P1-2: Phoenix left, the horde down the middle, the friends at the hedge
  ONE: [[-0.22, 1.4, 7.3], [-0.22, 0.8, 2.9], 40],    // P3: Phoenix and zombie Viking
  CLUB: [[0.0, 1.8, 8.9], [0.15, 0.95, 0], 48],        // P4-5: the club round the bench, the friends over the hedge
  PEAK: [[-0.5, 1.15, 6.6], [-0.5, 1.0, 2.7], 38],      // P6: cheek to cheek over the phone
  LOOKUP: [[-0.55, 1.12, 6.2], [-0.55, 1.02, 2.7], 34], // P7: the look-up, both faces
  BACK: [[0.0, 1.7, 8.5], [0.15, 0.95, 0], 46],        // P8: the club again, every head to the hedge
  REA_CU: [[1.45, 1.0, 6.0], [1.4, 0.92, 3.0], 34],    // v3 B8: Reaper running at us, glancing back at Phoenix
};
const L = (p, d) => p.map((v, i) => r3(v + d[i]));
const S = Object.fromEntries(Object.entries(SHOTS).map(([k, [pos, look, fov]]) => [k, { pos: [pos[0], pos[1], r3(pos[2] + DZ)], look: [look[0], look[1], r3(look[2] + DZ)], fov }]));
const beats = c.beats([
  ["P1 horde", 0, S.WIDE, "hook"],
  // the close-up follows Reaper as he runs on in slow motion (he ran out of a still frame once the freeze was gone)
  ...(V3 ? [["B8 reaper close-up", 1.05, { ...S.REA_CU, to: { pos: L(S.REA_CU.pos, [0.355, 0, 0.71]), look: L(S.REA_CU.look, [0.355, 0, 0.71]) }, dur: 0.25, ease: "linear" }, "reaction"], ["P1 wide again", 1.3, S.WIDE]] : []),
  ["P2 hide", 1.5, "keep"],
  ["P3 one of us", 3.2, S.ONE],
  ["P4 club", 5.0, S.CLUB],
  ["P6 peak", 7.0, S.PEAK],
  ["P7 look-up", 8.0, S.LOOKUP, "payoff"],
  ["P8 back down", 9.0, S.BACK, "reaction"],
], END);

write(import.meta.url, {
  id: V3 ? "never-looks-up-zombies-v3rules" : "never-looks-up-zombies",
  title: "The friend who never looks up from his phone… even in a zombie apocalypse",
  idea: "Never Looks Up ep 5: a zombie horde takes Phoenix, bowed over his glowing phone, for one of its own; the lead zombie sits and watches his screen with him, the series' 'huh.', a friendly pat, and the horde settles round him as his new friends",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 8.5,
  set: { type: "env", env: ENV, shade: "soft", aperture: 0, focus: false },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } },
  music: { style: "sneaky", bpm: 100, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "street", room: "open", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "rea", "vik", "phone"], hint: 0, what: "a zombie horde shambles down the street toward Phoenix on the bench, who only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "bench", from: 0, to: END, reason: "Phoenix sits on the bench" },
    { who: "vik", with: "bench", from: 5.4, to: END, reason: "zombie Viking sits on the bench beside him" },
    // v3: in the slow-motion close-up Reaper's raised glove passes in front of the zombie Sorcerer, a background extra
    // about 2.5 m behind him, never touching it (story time; stretchAt puts it at 1.5-1.85 s on the video)
    ...(V3 ? [{ who: "rea", with: "sor", from: 1.21, to: 1.30, checks: ["face-covered"], reason: "Reaper's glove in the close-up foreground passes in front of a background zombie 2.5 m behind him; no contact, the zombie isn't acting" }] : []),
  ],   // v3: stretchAt (in write) moves these with the live hold, on one clock
  notes: "Generated by storyboards/series/never-looks-up/make-ep5-zombies.mjs. Panels: PANELS-zombies.md. Title added in TikTok's text tool.",
});
