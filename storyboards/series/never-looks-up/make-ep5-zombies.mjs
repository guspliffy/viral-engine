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
//                friend and all five heads turn to the hedge, where the Wizard's hat tip sticks out.
//   Callback:    the opening's threat (a horde coming for everyone) ends as Phoenix's club, coming for the friends.
//
//   node storyboards/series/never-looks-up/make-ep5-zombies.mjs
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import fs from "node:fs";

const FACES = "strong", MOTION = "natural";
const ENV = process.env.ENV ?? "dusk-bus-stop";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// ---------------------------------------------------------------- places (x right, z toward us; the street runs away to -z)
// Laid out on a top-down plan so that every path keeps a body-width (0.8 m, arms forward) from the props and from the
// others. As in the panels the bench stands in front of the shelter, which sits back at the left edge; the hedge is on
// the right; the horde's lane runs down the middle (x 0..0.3) between them, and each zombie stops in arrival order,
// the deepest spot first.
const BENCH = { x: -0.55, z: 2.4, rot: 15, scale: 1.3 };       // 1.56 m long (along -0.78..0.78), back at fwd -0.31
const HEDGE = { x: 1.4, z: 0.35, w: 1.3, h: 0.82, d: 0.55 };   // x 0.75..2.05, z 0.08..0.63
const BIN = { x: 2.3, z: 1.0 };
const LAMP = { x: -1.9, z: -1.2 };
const SH = { x: -2.7, z: 0.5, rot: 20 };                        // the shelter, back at the left edge (its right posts x < -1.2)
const at = (b, along, fwd = 0) => { const y = rad(b.rot); return [r3(b.x + Math.cos(y) * along + Math.sin(y) * fwd), r3(b.z - Math.sin(y) * along + Math.cos(y) * fwd)]; };
const PHX = at(BENCH, -0.38);
const ZV_SEAT = 0.42;                                         // where zombie Viking sits (along the bench)
// behind the hedge (the far side): crouched so only the eyes and hat clear it; their gloves rest on the hedge top
const WIZ_HIDE = [1.1, -0.45], REA_HIDE = [1.95, -0.95];       // a crouch spreads the gloves 0.45 m: Reaper half a step further back
const WIZ0 = [0.25, -0.45], REA0 = [1.05, -0.8];            // already right of the horde's lane          // frame 0: already sprinting right, behind the hedge line
// the horde at frame 0: strung out down the lane, Viking in front, each 0.9 m+ from the next
const H0 = { vik: [-0.7, -2.2], gun: [0.0, -3.0], sor: [0.05, -4.4], sam: [-0.45, -5.3], dra: [-0.95, -3.4] };   // Viking clear of the Wizard on screen at frame 0
// where they end up (5.0-7.0), round the bench, bowed over cupped mittens: Viking sits beside him, Dragon and
// Sorcerer stand behind the bench's back, Gunslinger at its right end, Samurai behind him to the right
const H1 = { dra: at(BENCH, 0.02, -0.95), sam: at(BENCH, 1.15, -0.95), gun: at(BENCH, 1.6, 0.25), sor: [1.3, 1.05] };
const PATH = {
  gun: [H0.gun, [-0.05, 0.7], [0.75, 1.6], H1.gun],
  sor: [H0.sor, [0.0, 0.2], [0.35, 0.97], H1.sor],          // first down the middle lane, then right in front of the hedge
  sam: [H0.sam, [0.0, 0.0], H1.sam],                      // 1.2 m behind Sorcerer on the same lane, to the spot it passed
  dra: [H0.dra, [-0.85, 0.3], H1.dra],
};
const VIK_FRONT = at(BENCH, 0.55, 0.92);                       // he stops at the bench's free end, over Phoenix (3.2-5.0)

const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const CUP_R = { x: [-0.1, PH_Y, PH_Z - 0.02] }, CUP_L = { x: [0.1, PH_Y, PH_Z - 0.02] };   // the zombies' empty "phone" hands
const AT_PHONE = [0.03, -1];
const ARMS_OUT = { o: [0.1, 0.42, 0.42] };                      // a zombie's arms forward

const Z = ["vik", "sam", "gun", "dra", "sor"];
const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX, face: BENCH.rot, expr: "kind", follow: 0.3, seed: 1.7, span: 0, arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: WIZ0, face: 85, expr: "kind", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, face: 88, expr: "kind", follow: 0.3, seed: 3.1 },
  { id: "vik", character: "zombie/viking-zombie", at: H0.vik, face: 0, expr: "kind", follow: 0.2, seed: 5.1 },
  { id: "sam", character: "zombie/samurai-zombie", at: H0.sam, face: 8, expr: "kind", follow: 0.2, seed: 5.7 },
  { id: "gun", character: "zombie/gunslinger-zombie", at: H0.gun, face: -10, expr: "kind", follow: 0.2, seed: 6.3 },
  { id: "dra", character: "zombie/dragon-zombie", at: H0.dra, face: 4, expr: "kind", follow: 0.2, seed: 6.9 },
  { id: "sor", character: "zombie/sorcerer-zombie", at: H0.sor, face: -6, expr: "kind", follow: 0.2, seed: 7.4 },
];
const props = [
  { id: "shelter", kind: "busshelter", x: SH.x, z: SH.z, rot: SH.rot, w: 1.8, d: 0.85, h: 2.1, flicker: true },
  { id: "bench", kind: "bench", ...BENCH },
  { id: "hedge", kind: "hedge", ...HEDGE },
  { id: "bin", kind: "recyclebin", x: BIN.x, z: BIN.z, rot: -15 },
  { id: "lamp", kind: "streetlamp", x: LAMP.x, z: LAMP.z, h: 3.0, flicker: true },
  { id: "fog", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-2.5, 0, -8], [2.5, 0.45, 0]], n: 26, size: 1.6, color: "#a99bc4", on: 0.55, drift: [0.06, 0.02] },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.9, z: PHX[1] + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36" },
];

// ---------------------------------------------------------------- Phoenix: on the bench, bowed over the phone, from frame 0
A(0, "phx", "sit", { seat: "bench", along: -0.38, dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.6, dur: 0 });
A(0, "phx", "pitch", { to: 6, dur: 0 });                         // the bowed head that makes him one of them
act.blinksAt(c, "phx", [1.9, 4.6, 6.9]);
act.scrollPhone(c, "phx", [0.2, 1.1, 2.0, 3.0, 4.75, 5.6, 6.5, 7.3]);
prop(0, "phone", { glow: 0.85 }, 0.01);

// ---------------------------------------------------------------- the horde: tired zombies, arms forward, a slow shuffle
for (const z of Z) {
  A(0, z, "face", { lid: 0.55, dur: 0 });
  A(0, z, "expr", { expr: "kind", set: { curve: 0, eye: 0.9, open: 0.12 }, dur: 0.01 });
  c.arm(0, z, "R", ARMS_OUT, 0); c.arm(0, z, "L", ARMS_OUT, 0);
  A(0, z, "look", { to: [0, -0.1], dur: 0, blink: false });
}
// no automatic blinks on the key lines: slow placed blinks only (tired zombies blink rarely)
Z.forEach((z, i) => { A(0, z, "noblink"); act.blinksAt(c, z, [3.05 + i * 0.07, 6.6 + i * 0.09].map(r3), 0.3); });
A(0, "wiz", "noblink"); act.blinksAt(c, "wiz", [2.55, 4.3, 7.4]);
// one long shuffle each (a slow run along a path: planted feet, no stops), Viking in front
const shuffle = (who, t0, dur, pts, rate = 1.1) => A(t0, who, "run", { pts: pts.map(([t, x, z]) => [r3(t), r3(x), r3(z)]), dur, rate: [[0, rate], [dur, rate * 0.9]], stride: 0.7 });
const segT = (pts, dur) => {                                    // time along a path in proportion to its length
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let acc = 0; return pts.map((p, i) => { if (i) acc += L[i - 1]; return [(acc / tot) * dur, ...p]; });
};
shuffle("vik", 0, 3.15, segT([H0.vik, [-0.05, 0.6], [0.85, 1.6], [0.95, 2.8], VIK_FRONT], 3.15), 1.2);
A(2.75, "vik", "turn", { to: -80, dur: 0.45 });                 // round to face Phoenix, side-on to us
for (const [z, dur] of [["gun", 4.2], ["sam", 5.3], ["dra", 4.7], ["sor", 4.6]]) {
  shuffle(z, 0, dur, segT(PATH[z], dur), 1.0);
  c.arm(dur - 0.45, z, "R", "rest", 0.4); c.arm(dur - 0.45, z, "L", "rest", 0.4);   // arms down as they stop (clear of the bench)
}
sfx(0, "groan", { gain: 0.35, dur: 3.0, reason: "the horde's low overlapping groans as it shambles in" });
sfx(0, "lampbuzz", { gain: 0.12, dur: END, reason: "the flickering street lamp over the bench" });

// ---------------------------------------------------------------- 1 HORDE 0-1.5 (P1): the friends sprint past and dive behind the hedge
const CAP_Y = 640;
const runTo = (who, t0, dur, p0, ctl, p1) => {
  const pts = []; const n = 12;
  for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u; pts.push([r3(u * dur), r3(a * p0[0] + b * ctl[0] + d * p1[0]), r3(a * p0[1] + b * ctl[1] + d * p1[1])]); }
  A(t0, who, "run", { pts, dur, rate: [[0, 4.0], [dur * 0.7, 4.0], [dur, 2.6]], stride: 1.6 });
};
runTo("wiz", 0, 0.82, WIZ0, [0.62, -0.45], WIZ_HIDE);      // along behind the hedge
runTo("rea", 0, 0.86, REA0, [1.4, -0.88], REA_HIDE);         // ahead of him, to the far spot
A(0, "wiz", "look", { to: [-0.2, 0.3], dur: 0, blink: false });
act.shock(c, 0.02, "wiz", { open: 0.45, hold: 0.8 });
A(0.05, "wiz", "talk", { line: "zom-bies!", dur: 0.5, tone: "excited", voice: false });
c.cap(0.05, 1.1, "ZOMBIES!!", CAP_Y);
A(0.55, "wiz", "turn", { to: 10, dur: 0.3 }); A(0.6, "rea", "turn", { to: -10, dur: 0.3 });
A(0.82, "wiz", "crouch", { to: 0.55, dur: 0.08 }); A(0.86, "rea", "crouch", { to: 0.6, dur: 0.08 });
// gloves tucked in front, toward the hedge's back (a crouch alone spreads the arms into each other)
const TUCK_R = { o: [0.04, 0.22, 0.26] }, TUCK_L = { o: [0.04, 0.22, 0.26] };
for (const w of ["wiz", "rea"]) { c.arm(0.84, w, "R", TUCK_R, 0.15); c.arm(0.84, w, "L", TUCK_L, 0.15); }
A(1.42, "wiz", "crouch", { to: 0.3, dur: 0.2 }); A(1.5, "rea", "crouch", { to: 0.3, dur: 0.2 });   // up to peek over the top
c.hitStop(0.9, 3);
sfx(0.9, "leafrustle", { gain: 0.6, reason: "they dive into the hedge's back" });
prop(0.88, "hedge", { wobble: 1 }, 0.4, "out"); prop(1.3, "hedge", { wobble: 0 }, 0.3);
see(0, 1.5, ["phx.face", "wiz.face", "vik", "phone", "hedge"], "P1: the horde coming down the street, the friends diving for the hedge, Phoenix on his phone");

// ---------------------------------------------------------------- 2 HIDE 1.5-3.2 (P2)
A(1.5, "wiz", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
c.arm(1.6, "wiz", "R", { o: [0.15, 0.85, 0.2] }, 0.15, "out");           // waving him over, the arm up over the hedge
c.arm(1.78, "wiz", "R", { o: [0.3, 0.7, 0.25] }, 0.12); c.arm(1.92, "wiz", "R", { o: [0.15, 0.85, 0.2] }, 0.12);
c.arm(2.06, "wiz", "R", { o: [0.3, 0.7, 0.25] }, 0.12); c.arm(2.3, "wiz", "R", TUCK_R, 0.2);
A(1.62, "wiz", "talk", { line: "psst! psst!", dur: 0.55, tone: "excited", voice: false });
c.cap(1.62, 2.3, "psst! OVER HERE!", CAP_Y);
// Reaper glares at him and shushes
A(1.9, "rea", "look", { to: [-0.8, 0.1], dur: 0.12, blink: false });
act.mood(c, 2.0, "rea", "angry", { hold: 0.5 });
c.arm(2.25, "rea", "R", { x: [-0.02, 0.52, 0.36] }, 0.15, "out");         // a mitten up at his own mouth: shhh
A(2.3, "rea", "talk", { line: "shhhh", dur: 0.5, tone: "calm", voice: false });
c.cap(2.3, 3.0, "SHHH!", CAP_Y);
c.arm(2.95, "rea", "R", TUCK_R, 0.25);
A(2.35, "wiz", "look", { to: [0.8, 0.1], dur: 0.12, blink: false });
act.sheepish(c, 2.5, "wiz");
// the ping: Phoenix's tiny smile
sfx(2.7, "notify", { gain: 0.3 });
A(2.75, "phx", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.2 });
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: 0.25 });
see(1.6, 3.1, ["phx.face", "wiz.face", "rea.face", "vik"], "P2: behind the hedge, the Wizard waves, Reaper shushes him; the horde closes in");

// ---------------------------------------------------------------- 3 ONE OF US 3.2-5.0 (P3)
A(3.15, "vik", "look", { to: [-0.2, -0.45], dur: 0.15, blink: false });
c.arm(3.2, "vik", "R", "rest", 0.4); c.arm(3.2, "vik", "L", "rest", 0.4);
for (const t of [3.35, 3.55]) A(t, "vik", "squash", { amount: -0.03, dur: 0.12 });   // sniff, sniff
sfx(3.35, "snort", { gain: 0.4, reason: "zombie Viking sniffs at Phoenix" });
A(3.6, "vik", "lean", { to: -10, dur: 0.3 });                                       // the head tilt
A(3.8, "phx", "talk", { line: "uhhhhh", dur: 0.6, tone: "calm" });
A(3.8, "phx", "expr", { expr: "kind", set: { curve: -0.1, eye: 0.85, open: 0.25 }, dur: 0.2 });
A(4.45, "phx", "expr", { expr: "kind", set: { curve: 0.15, eye: 0.95 }, dur: 0.25 });
A(4.5, "vik", "lean", { to: 0, dur: 0.25 });
sfx(4.5, "groan", { gain: 0.6, dur: 0.6, reason: "zombie Viking groans back the same sound" });
A(4.5, "vik", "expr", { expr: "kind", set: { open: 0.3, curve: 0.1 }, dur: 0.15 });
for (const [t, p] of [[4.7, 12], [4.85, 0], [5.0, 12], [5.15, 0]]) A(t, "vik", "pitch", { to: p, dur: 0.15 });   // a slow nod: one of us
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
// behind the hedge: they peek over, horrified; the Wizard's hat tip sticks up
A(5.3, "wiz", "crouch", { to: 0.3, dur: 0.3 }); A(5.4, "rea", "crouch", { to: 0.35, dur: 0.3 });
A(5.3, "wiz", "look", { to: [-0.8, -0.1], dur: 0.12, blink: false }); A(5.4, "rea", "look", { to: [-0.85, -0.1], dur: 0.12, blink: false });
act.shock(c, 5.5, "wiz", { open: 0.45, hold: 1.2 }); act.shock(c, 5.55, "rea", { open: 0.2, hold: 1.2 });
see(5.6, 6.9, ["phx.face", "vik.face", "sam.face", "wiz.face", "rea.face"], "P4-5: the horde copying his pose round the bench; the friends horrified over the hedge");

// ---------------------------------------------------------------- 5 PEAK 7.0-8.0 (P6)
A(7.0, "vik", "lean", { to: 9, dur: 0.45 });                          // cheek to cheek over the phone
A(7.0, "vik", "look", { to: [-0.6, -0.8], dur: 0.2, blink: false });
A(7.1, "vik", "expr", { expr: "happy", set: { curve: 0.3, eye: 0.9 }, dur: 0.3 });
see(7.1, 8.0, ["phx.face", "vik.face", "phone"], "P6: zombie Viking leaning in to watch the screen, the horde round the bench");

// ---------------------------------------------------------------- 6 LOOK-UP 8.0-9.0 (P7)
A(8.05, "phx", "look", { to: [0.75, 0.25], dur: 0.12, blink: false });   // eyes over to zombie Viking
A(8.05, "phx", "face", { lid: 0.2, dur: 0.12 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.cap(8.5, 9.0, "huh.", 600);
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
c.arm(9.55, "vik", "R", CUP_R, 0.25);
for (const [z, t] of [["vik", 9.5], ["sam", 9.55], ["gun", 9.6], ["dra", 9.62], ["sor", 9.66]]) {
  A(t, z, "pitch", { to: 0, dur: 0.2 });
  A(t, z, "look", { to: [0.9, 0.05], dur: 0.3, blink: false });
}
for (const w of ["wiz", "rea"]) act.shock(c, 9.7, w, { open: 0.5, hold: 0.5 });
see(9.5, 9.95, ["phx.face", "vik.face", "wiz.face", "hedge"], "P8: the horde turns to the hedge where the hat tip sticks out");

// ---------------------------------------------------------------- shots (the street runs away from us; shelter left, hedge right)
const E = JSON.parse(fs.readFileSync(new URL(`../../../assets/environments/${ENV}/env.json`, import.meta.url)));
const EYE_PITCH = E.eye.pitch;   // + = down
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const SHOTS = JSON.parse(process.env.SHOTS ?? "null") ?? {
  WIDE: [[0.15, 1.7, 7.8], { tilt: -5, fov: 46 }],
  ONE: [[-0.5, 1.35, 6.8], { tilt: -4, fov: 38 }],
  CLUB: [[-0.2, 1.6, 7.4], { tilt: -5, fov: 44 }],
  PEAK: [[-0.45, 1.3, 5.8], { tilt: -5, fov: 34 }],
  LOOKUP: [[-0.5, 1.25, 5.2], { tilt: -5, fov: 30 }],
  BACK: [[-0.1, 1.6, 7.2], { tilt: -5, fov: 46 }],
};
const S = Object.fromEntries(Object.entries(SHOTS).map(([k, [p, o]]) => [k, shot(p, o)]));
const beats = c.beats([
  ["P1 horde", 0, S.WIDE, "hook"],
  ["P2 hide", 1.5, "keep"],
  ["P3 one of us", 3.2, S.ONE],
  ["P4 club", 5.0, S.CLUB],
  ["P6 peak", 7.0, S.PEAK],
  ["P7 look-up", 8.0, S.LOOKUP, "payoff"],
  ["P8 back down", 9.0, S.BACK, "reaction"],
], END);

write(import.meta.url, {
  id: "never-looks-up-zombies",
  title: "The friend who never looks up from his phone… even in a zombie apocalypse",
  idea: "Never Looks Up ep 5: a zombie horde takes Phoenix, bowed over his glowing phone, for one of its own; the lead zombie sits and watches his screen with him, the series' 'huh.', a friendly pat, and every zombie head turns to the hedge where the Wizard's hat sticks out",
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
    { who: "wiz", with: "hedge", from: 0.8, to: END, reason: "the Wizard crouches against the hedge's back" },
    { who: "rea", with: "hedge", from: 0.8, to: END, reason: "Reaper crouches against the hedge's back" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep5-zombies.mjs. Panels: PANELS-zombies.md. Title added in TikTok's text tool.",
});
