// MY FRIEND GROUP TRYING TO PARALLEL PARK ONE CAR (friends-try-to episode 5, 4 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-04-friends-try-to/05-parallel-park-ENGINE-PROMPT.md, series format
// 00-SERIES-FORMAT.md, Jonny's eight panels storyboards/05-parallel-park/storyboard-eight-panels.png (they win; PANELS.md here).
//   node storyboards/series/friends-try-to/05-parallel-park/make-parallel-park.mjs -> parallel-park.json
//
// THE BRIEF
//   Joke:        Wizard can't parallel park with three backseat drivers; Viking waves him into the bin, Wizard's spell
//                drops the car across the gap; quiet Reaper parks it in one smooth reverse.
//   Wants:       the four want the car in the gap.
//   Consequence: they cheer, Viking gives the car a proud pat, the handbrake was never on: it rolls back out.
//   Ending:      the car stops at exactly its frame-0 angle, back tyre on the kerb; three heads turn to glare at Viking.
//   Callback:    0 s the car at a bad angle on the kerb; 10 s the same car, same angle, after a perfect park.
//
// Places (world: x right, z toward the camera; the camera looks across the street at the far kerb, -z). The street
// slopes gently down to the right (the painting), so a car out of gear rolls backwards out of the gap, which is the
// way it reversed in. Cars are rigs (vehicle.js, car-hatchback.js): front +z in their own frame, their left +x, a
// left-hand-drive car (the driver at +x). Parked cars face -x (nose to screen left), their left side, the driver's
// side, toward us.
import { clip, write } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { rigToWorld } from "../../../../engine/page/vehicle.js";
import { streetY } from "../../../../engine/page/props-parking.js";

const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const END = 10.0;
const r3 = (x) => Math.round(x * 1000) / 1000;
// the street slopes 3 degrees down toward +x (the cars, the kerb and the cast all stand on it: streetY)
const SLOPE = 5, LIFT = 0.45;
const hY = (x) => r3(streetY(x, SLOPE, LIFT));

// ---------------------------------------------------------------- places
const KZ = Number(process.env.KZ ?? -1.3);       // the kerb's street face
const PZ = KZ + 1.22;                             // a parked car's middle (half width 1.1 + a hand's gap)
const RED = [-4.3, PZ], BLUE = [4.3, PZ];          // the neighbours: rear end of red at -2.65, front of blue at 2.65
const PARK = { x: 0, z: PZ, yaw: -90 };            // dead straight in the middle of the gap
// frame 0: reversing in at a bad angle, the nose out in the street, the back right tyre on the kerb (also the end)
const BAD = { x: 0.55, z: PZ + 0.12, yaw: -42 };
const BIN = [1.95, KZ - 0.42];                     // on the pavement edge by the gap's back end

// seats in the car's own frame [x, z, seat height]
const SEAT_Y = 0.06;
const SEATS = { drv: [0.55, 0.2, 0.06], pas: [-0.55, 0.2, 0.06], rl: [0.45, -0.98, 0.34], rr: [-0.45, -0.98, 0.34] };
const seatAt = (s) => [SEATS[s][0], r3(SEATS[s][1] + 0.03)];

// ---------------------------------------------------------------- the car's path (rig keys, world)
const K = [];
// on the slope: lifted to the street's height under its middle, nose up or down and leaning as its heading meets the slope
const onSlope = (yaw) => ({ pitch: SLOPE * Math.sin((yaw * Math.PI) / 180), roll: -SLOPE * Math.cos((yaw * Math.PI) / 180) });
const key = (at, p, o = {}) => { const sl = onSlope(p.yaw); K.push({ at, pos: [r3(p.x), r3((o.y ?? 0) + hY(p.x)), r3(p.z)], yaw: r3(p.yaw), roll: r3((o.roll ?? 0) + sl.roll), pitch: r3((o.pitch ?? 0) + sl.pitch), steer: r3(o.steer ?? 0) }); };
const along = (p, d) => ({ ...p, x: p.x + d * Math.sin((p.yaw * Math.PI) / 180), z: p.z + d * Math.cos((p.yaw * Math.PI) / 180) });
// 0-1.5: still reversing at frame 0, the back right tyre climbs the kerb and drops off; Wizard pulls forward to retry
key(0, along(BAD, 0.22), { steer: -20 });
key(0.12, along(BAD, 0.04), { steer: -20, pitch: 2.2, roll: -2.6, y: 0.06 });
key(0.3, BAD, { steer: -20, pitch: 0.4, roll: -0.6, y: 0.01 });
key(0.42, BAD, { steer: -10 });
const RETRY = { x: -0.35, z: PZ + 0.95, yaw: -68 };
key(1.2, RETRY, { steer: 15 });
key(1.55, RETRY, { steer: 0 });
// 1.5-3.3: Viking waves him back ("come, come"), the back bumper nudges the bin over at 2.9 and stops
const NUDGE = { x: 0.32, z: PZ + 0.16, yaw: -78 };
key(2.85, NUDGE, { steer: -12 });
key(2.95, along(NUDGE, 0.03), { pitch: -0.8 });
key(3.4, along(NUDGE, 0.03));
// 3.3-4.6: the spell lifts it, turns it in the air and drops it across the gap, nose to us (panel 4)
const LIFT0 = along(NUDGE, 0.03);
key(3.62, LIFT0, { y: 0.12, roll: 2 });
key(3.95, { ...LIFT0, x: 0.2, z: PZ + 0.6, yaw: -55 }, { y: 1.05, roll: 6, pitch: -4 });
key(4.3, { x: 0.2, z: PZ + 0.75, yaw: -25 }, { y: 0.95, roll: -5, pitch: 5 });
const ACROSS = { x: 0.15, z: PZ + 0.72, yaw: -14 };
key(4.6, ACROSS, { y: 0, pitch: -2.5, roll: 1.5 });        // lands (hit-stop): the springs take it
key(4.75, ACROSS, { y: 0, pitch: 1.4, roll: -0.8 });
key(4.92, ACROSS, { y: 0, pitch: -0.5 });
key(5.06, ACROSS, { y: 0 });
// 5.5-7.2: Reaper drives: he pulls forward beside the red car, then one smooth reverse arc into the gap
key(5.9, ACROSS);
const BESIDE = { x: -1.45, z: PZ + 2.36, yaw: -90 };
key(6.12, { x: -0.55, z: PZ + 1.95, yaw: -62 }, { steer: 25 });
key(6.32, BESIDE, { steer: 0 });
key(6.42, BESIDE, { steer: -28 });
key(6.62, { x: -0.55, z: PZ + 1.25, yaw: -64 }, { steer: -28 });
key(6.78, { x: -0.06, z: PZ + 0.08, yaw: -86 }, { steer: 18 });
key(6.85, PARK, { steer: 0 });                              // the back tyre kisses the kerb (hit-stop)
// 8.0-9.3: the proud pat, no handbrake: it rolls back down the slope and stops at its frame-0 angle on the kerb
key(8.32, PARK);
key(8.75, { x: 0.28, z: PZ + 0.06, yaw: -70 }, { steer: -20 });
key(9.1, along(BAD, 0.02), { steer: -20, pitch: 1.2, roll: -1.6, y: 0.04 });
key(9.22, BAD, { steer: -20, pitch: 1.6, roll: -2.0, y: 0.05 });   // the back right tyre up on the kerb, as at frame 0
key(9.4, BAD, { steer: -20, pitch: 1.6, roll: -2.0, y: 0.05 });
const RIG = { pivot: [0, 0.5, 0], keys: K };
const W = (t, q) => rigToWorld(RIG, t, q).map(r3);

// ---------------------------------------------------------------- cast: inside the car (rig) and outside (world)
// Viking guides from the street by the gap's back end; at the end the three stand in the street in front of the car's
// front half (the roll swings the nose out toward them but stops 0.8 m short), Viking by its back door (the back
// swings away from him toward the kerb)
const VIK_GUIDE = [3.4, PZ + 2.25], VIK_WATCH = [2.1, PZ + 3.7], VIK_DOOR = [2.95, PZ + 1.25], VIK_PAT = [2.2, PZ + 0.85], VIK_BACK = [2.85, PZ + 1.3];
const END_POS = { wiz: [-0.95, PZ + 3.0], phx: [0.5, PZ + 2.55], rea: [1.5, PZ + 3.0] };   // Phoenix a half step back (the wings)
const WIZ_CHAR = "lookdev/wizard-crisp-nostaff", WIZ_STAFF = "sofa/wizard-staff";
const inCar = (id, character, seat, o = {}) => ({ id, character, rig: "car", at: seatAt(seat), face: "camera", expr: "kind", follow: 0.25, shadowFall: 0.001, ...o });
const cast = [
  inCar("wizC", WIZ_CHAR, "drv", { seed: 2.6, expr: "eager" }),
  inCar("wizS", WIZ_STAFF, "drv", { seed: 2.6 }),
  inCar("wizB", WIZ_CHAR, "rl", { seed: 2.6 }),
  inCar("phxC", "duo/phoenix", "pas", { seed: 1.7, span: 0 }),
  inCar("vikC", "elevator/viking", "rl", { seed: 3.3, expr: "eager" }),
  inCar("reaC", "notyet/reaper-noscythe", "rr", { seed: 4.1, expr: "deadpan" }),
  inCar("reaD", "notyet/reaper-noscythe", "drv", { seed: 4.1, expr: "deadpan" }),
  { id: "vik", character: "elevator/viking", at: VIK_GUIDE, y: hY(VIK_GUIDE[0]), face: -60, expr: "eager", follow: 0.35, seed: 3.3 },
  { id: "vikW", character: "elevator/viking", at: VIK_WATCH, y: hY(VIK_WATCH[0]), face: 155, expr: "eager", follow: 0.35, seed: 3.3 },
  { id: "vikD", character: "elevator/viking", at: VIK_DOOR, y: hY(VIK_DOOR[0]), face: -15, expr: "delighted", follow: 0.35, seed: 3.3 },
  { id: "wiz", character: WIZ_CHAR, at: END_POS.wiz, y: hY(END_POS.wiz[0]), face: 12, expr: "delighted", follow: 0.3, seed: 2.6 },
  { id: "phx", character: "duo/phoenix", at: END_POS.phx, y: hY(END_POS.phx[0]), face: 0, expr: "delighted", follow: 0.3, seed: 1.7, span: 0.4 },
  { id: "rea", character: "notyet/reaper-noscythe", at: END_POS.rea, y: hY(END_POS.rea[0]), face: -12, expr: "kind", follow: 0.3, seed: 4.1 },
];
const PHONE_IN = { id: "phoneC", kind: "phone", style: "iphone", rig: "car", x: -0.86, y: 1.12, z: 0.42, rot: -100, tip: -10, scale: 1.6 };
const props = [
  ...Object.entries(SEATS).map(([s, [x, z, dy]]) => ({ id: `seat-${s}`, kind: "carseat", rig: "car", x, y: SEAT_Y + dy, z, color: "#59535f", trim: "#6e6875", width: 0.86 })),
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.88, z: 0.63, tip: 34 },
  { id: "street", kind: "street", x: 0, z: KZ + 6, w: 20, d: 12, slope: SLOPE, lift: LIFT, seed: 4 },
  { id: "kerb", kind: "kerb", x: 0, x0: -9, x1: 9, z: KZ, seed: 5, slope: SLOPE, lift: LIFT },
  { id: "flagway", kind: "flagway", x: 0, z: KZ - 0.25, w: 20, d: 3.2, slope: SLOPE, lift: LIFT, seed: 6 },
  { id: "bin", kind: "wheeliebin", x: BIN[0], y: r3(hY(BIN[0]) + 0.12), z: BIN[1], rot: -90 },
  { id: "aura", kind: "spellaura", rig: "car", x: 0, y: 0.3, z: 0, w: 4.2, d: 2.6, color: "#b46bff" },
  PHONE_IN,
];

// ---------------------------------------------------------------- 01 ALREADY GOING WRONG 0-1.5 (wide, panel 1)
for (const id of ["wizS", "wizB", "reaD", "wiz", "phx", "rea", "vik", "vikW", "vikD"]) A(0, id, "hide");
for (const [id, s] of [["wizC", "drv"], ["phxC", "pas"], ["vikC", "rl"], ["reaC", "rr"]]) A(0, id, "sit", { seat: `seat-${s}`, dur: 0, hands: "keep" });
A(0, "wizC", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "wizC", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "wizC", "R", { prop: "wheel", grip: "R" }, 0.01); c.arm(0, "wizC", "L", { prop: "wheel", grip: "L" }, 0.01);
A(0, "wizC", "expr", { expr: "shocked", set: { open: 0.7, eye: 1.3 }, dur: 0.01 });
A(0, "wizC", "look", { to: [0.35, 0.1], dur: 0.01, blink: false });
act.opener(c, "wizC", "waah!", { at: 0.05, dur: 0.4 });
// Phoenix films out of his window, Viking leans forward pointing, Reaper sits with folded arms
A(0, "phxC", "grab", { prop: "phoneC", hand: "R", grip: [0.032, 0.03, 0], pose: null });
c.arm(0, "phxC", "R", { x: [-0.32, 0.52, 0.32] }, 0.01);
A(0, "phxC", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
A(0, "phxC", "expr", { expr: "delighted", dur: 0.01 });
c.arm(0, "vikC", "R", { x: [-0.25, 0.98, 0.42] }, 0.01); A(0, "vikC", "grip", { side: "R", shape: "point", dur: 0.01 });
A(0, "vikC", "pitch", { to: 10, dur: 0.01 });
A(0, "vikC", "talk", { line: "go go go!", tone: "excited", dur: 0.7, voice: false });
c.arm(0, "reaC", "R", { x: [0.12, 0.34, 0.37] }, 0.01); c.arm(0, "reaC", "L", { x: [-0.12, 0.3, 0.37] }, 0.01);   // arms folded
A(0, "reaC", "look", { to: [0.2, -0.1], dur: 0.01, blink: false });
A(0, "reaC", "face", { lidL: 0.45, lidR: 0.45, dur: 0.01 });
sfx(0.1, "screech", { gain: 0.35, reason: "the back tyre squeaking up the kerb stone" });
sfx(0.32, "thud-soft", { gain: 0.45, reason: "the tyre dropping off the kerb" });
sfx(0.0, "timer-beep", { gain: 0.2, reason: "the reverse beeper" }); sfx(0.4, "timer-beep", { gain: 0.2, reason: "the reverse beeper" });
A(0.5, "wizC", "expr", { expr: "annoyed", dur: 0.25 });
A(0.6, "wizC", "look", { to: [-0.2, 0.15], dur: 0.15 });
A(0.75, "wizC", "talk", { line: "hmpf. again.", tone: "calm", dur: 0.5, voice: false });
c.arm(0.8, "vikC", "R", { x: [-0.27, 1.04, 0.42] }, 0.2, "inOut"); A(0.8, "vikC", "talk", { line: "back! back!", tone: "excited", dur: 0.55, voice: false });
A(0.9, "reaC", "expr", { expr: "annoyed", dur: 0.3 });
see(0, 1.5, ["wizC.face", "phxC.face", "vikC.face"], "frame 0: the car half in the gap at a bad angle, the four inside");

// ---------------------------------------------------------------- 02 VIKING GUIDES 1.5-3.3 (medium on Viking, the mirror, the bin)
A(1.5, "vikC", "hide"); A(1.5, "vik", "show");
for (let k = 0; k < 6; k++) {   // "come, come, come": both gloves beckoning toward himself
  const t = 1.55 + k * 0.27;
  c.arm(t, "vik", "R", { o: [0.18, 0.5, 0.42] }, 0.12, "inOut"); c.arm(t, "vik", "L", { o: [0.18, 0.5, 0.42] }, 0.12, "inOut");
  c.arm(t + 0.13, "vik", "R", { o: [0.12, 0.62, 0.18] }, 0.12, "inOut"); c.arm(t + 0.13, "vik", "L", { o: [0.12, 0.62, 0.18] }, 0.12, "inOut");
}
A(1.5, "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.4 }, dur: 0.15 });
A(1.5, "vik", "look", { to: [-0.7, 0.05], dur: 0.12 });
A(1.6, "vik", "talk", { line: "komm, komm, komm, loads of room!", tone: "excited", dur: 1.1, voice: false });
cap(1.75, 2.6, "Loads of room!", 470);
for (let k = 0; k < 7; k++) sfx(1.6 + k * (0.26 - k * 0.022), "timer-beep", { gain: 0.22, reason: "the reverse beeper, speeding up" });
A(1.5, "wizC", "look", { to: [0.4, 0.4], dur: 0.15 });
// the mirror insert: Wizard's worried eyes up at the rear-view mirror
A(2.4, "wizC", "expr", { expr: "shocked", set: { eye: 1.25, open: 0.15, curve: -0.4 }, dur: 0.15 });
A(2.42, "wizC", "look", { to: [0.1, 0.8], dur: 0.12, blink: false });
c.textPop(2.5, "wizC", "?!", { dur: 0.45, size: 80, dx: 0.45, dy: -0.75 });
// the nudge: the back bumper tips the bin over (BONK), Viking still waving
c.prop(2.9, "bin", { wobble: 1 }, 0.1); c.prop(2.92, "bin", { tip: 1 }, 0.38, "in"); c.prop(3.3, "bin", { wobble: 0 }, 0.1);
sfx(2.9, "pan-bonk", { gain: 0.65, reason: "the bumper bonks the plastic wheelie bin (Jonny's bonk)" });
c.textPop(2.9, "vik", "BONK!", { dur: 0.45, size: 84, dx: -1.15, dy: -0.35, angle: -8 });
c.at(2.9, { fx: "poof", pos: [BIN[0], r3(hY(BIN[0]) + 0.9), BIN[1]], dur: 0.5, color: "#fff2a8", puffs: 0, sparks: 12, size: 0.4, lift: 0.3 });
sfx(3.3, "thud", { gain: 0.4, reason: "the bin lands on its side on the pavement" });
c.at(3.31, { fx: "poof", pos: [BIN[0] + 0.5, 0.05, BIN[1]], dur: 0.45, color: "#d8cdbd", puffs: 8, sparks: 0, size: 0.35, lift: 0.05 });
A(2.95, "vik", "talk", { line: "komm komm!", tone: "excited", dur: 0.4, voice: false });
A(3.1, "vik", "move", { to: [2.8, PZ + 2.4], y: r3(hY(2.8)), dur: 0.35, steps: 2, ease: "inOut" });   // two steps in after the car, still waving
A(3.05, "reaC", "talk", { line: "*sigh*", tone: "calm", dur: 0.4, voice: false });
A(3.05, "reaC", "squash", { amount: -0.04, dur: 0.35 });
A(3.0, "phxC", "look", { to: [0.5, -0.3], dur: 0.15 });
A(3.0, "phxC", "expr", { expr: "delighted", set: { curve: 1, open: 0.5 }, dur: 0.15 });
see(1.6, 2.4, ["vik.face"], "Viking waving the car back: come, come");
see(2.5, 2.8, ["wizC.face"], "the mirror: Wizard's worried eyes");
see(2.85, 3.3, ["bin"], "the bumper nudges the bin over, Viking keeps waving");

// ---------------------------------------------------------------- 03 WIZARD'S SPELL 3.3-4.6 (wide, panel 3)
A(3.3, "wizC", "hide"); A(3.3, "wizS", "show");
A(3.3, "wizS", "sit", { seat: "seat-drv", dur: 0, hands: "keep" });
A(3.3, "wizS", "expr", { expr: "annoyed", set: { curve: -0.2 }, dur: 0.01 });
A(3.35, "wizS", "lean", { to: -16, dur: 0.25, ease: "out" });
c.arm(3.35, "wizS", "L", { o: [0.55, 0.5, 0.3] }, 0.25, "out");
A(3.4, "wizS", "talk", { line: "ab-ra-ca-park!", tone: "excited", dur: 0.6, voice: false });
cap(3.45, 4.15, "Abra-ca-PARK!", 470);
A(3.55, "wizS", "expr", { expr: "eager", set: { curve: 0.6 }, dur: 0.15 });
c.prop(3.55, "aura", { glow: 1 }, 0.15);
for (const [k, t] of [3.6, 3.8, 4.0].entries()) { const p = W(t + 0.1, [0, 0.6 + 0.3 * k, 0]); c.at(t, { fx: "poof", pos: p, dur: 0.5, color: "#c58bff", puffs: 6, sparks: 14, size: 0.7, lift: 0.7 }); } c.prop(4.5, "aura", { glow: 0 }, 0.25);
sfx(3.55, "charge", { gain: 0.55, reason: "the spell swirls up round the car" });
sfx(3.6, "rumble", { gain: 0.3, dur: 0.8, reason: "the car lifting off its springs" });
A(3.62, "vik", "expr", { expr: "shocked", dur: 0.12 });
c.arm(3.62, "vik", "R", "up", 0.2, "out"); c.arm(3.62, "vik", "L", "up", 0.2, "out");
A(3.7, "phxC", "expr", { expr: "delighted", set: { eye: 1.3, open: 0.8 }, dur: 0.15 });
A(3.7, "reaC", "expr", { expr: "shocked", set: { eye: 1.15 }, dur: 0.15 });
see(3.6, 4.4, ["wizS.face", "vik"], "the car lifting in the purple swirl, Wizard's staff out of the window");

// ---------------------------------------------------------------- 04 DROPPED ACROSS THE GAP 4.6-5.5 (front, panel 4)
A(4.5, "wizS", "lean", { to: 0, dur: 0.15 });
c.arm(4.5, "wizS", "L", "rest", 0.15);
act.impact(c, 4.6, "wizS", { sound: "thud", gain: 0.45, stars: false, recoil: -6, squash: 0.16, take: false });
c.at(4.6, { fx: "poof", pos: [ACROSS.x, 0.04, ACROSS.z + 0.3], dur: 0.6, color: "#d8cdbd", puffs: 12, sparks: 0, size: 0.6, lift: 0.08 });
sfx(4.62, "plank-rattle", { gain: 0.3, dur: 0.45, reason: "the car bouncing on its springs after the drop" });
A(4.62, "phxC", "squash", { amount: 0.12, dur: 0.2 }); A(4.62, "reaC", "squash", { amount: 0.05, dur: 0.2 }); A(4.62, "wizS", "squash", { amount: 0.12, dur: 0.2 });
// blame: Wizard and Phoenix point at each other, overlapping
A(4.8, "wizS", "look", { to: [-0.8, 0.0], dur: 0.12 }); A(4.8, "phxC", "look", { to: [0.8, 0.0], dur: 0.12 });
A(4.82, "wizS", "expr", { expr: "angry", set: { eye: 1.1 }, dur: 0.2 }); A(4.82, "phxC", "expr", { expr: "angry", dur: 0.2 });
c.arm(4.85, "wizS", "R", { x: [-0.32, 0.5, 0.3] }, 0.15, "out"); A(4.85, "wizS", "grip", { side: "R", shape: "point", dur: 0.1 });
c.arm(4.85, "phxC", "L", { x: [0.32, 0.5, 0.3] }, 0.15, "out"); A(4.85, "phxC", "grip", { side: "L", shape: "point", dur: 0.1 });
A(4.9, "wizS", "talk", { line: "you said left!", tone: "excited", dur: 0.55, voice: false });
A(5.0, "phxC", "talk", { line: "MY left!", tone: "excited", dur: 0.45, voice: false });
cap(4.75, 5.45, "You said left!", 330);
cap(4.98, 5.5, "MY left!", 470);
A(4.8, "reaC", "expr", { expr: "annoyed", set: { curve: -0.3 }, dur: 0.2 });
A(4.85, "reaC", "look", { to: [0.0, 0.1], dur: 0.15 });
see(4.75, 5.45, ["wizS.face", "phxC.face"], "dropped across the gap, Wizard and Phoenix point at each other");

// ---------------------------------------------------------------- 05 THE CALM FIX 5.5-7.2 (Reaper drives; the side view, panel 5)
// a cut swaps the seats: Reaper drives, Wizard sits in the back behind him, Viking stays out in the street
for (const id of ["wizS", "reaC"]) A(5.5, id, "hide");
A(5.5, "reaD", "show"); A(5.5, "wizB", "show");
A(5.5, "reaD", "sit", { seat: "seat-drv", dur: 0, hands: "keep" }); A(5.5, "wizB", "sit", { seat: "seat-rl", dur: 0, hands: "keep" });
A(5.5, "wizB", "expr", { expr: "annoyed", set: { curve: -0.4 }, dur: 0.01 }); A(5.5, "wizB", "look", { to: [0.4, -0.1], dur: 0.01 });
c.arm(5.5, "phxC", "L", "rest", 0.2); A(5.5, "phxC", "expr", { expr: "sad", set: { curve: -0.2 }, dur: 0.2 });
// Reaper adjusts the mirror, then hands on the wheel
A(5.5, "reaD", "look", { to: [-0.1, 0.6], dur: 0.01, blink: false });
c.arm(5.47, "reaD", "R", { x: [-0.32, 0.86, 0.48] }, 0.01); A(5.47, "reaD", "grip", { side: "R", shape: "pinch", dur: 0.01 });
c.arm(5.62, "reaD", "R", { x: [-0.3, 0.84, 0.5] }, 0.12, "inOut");
c.arm(5.47, "reaD", "L", { prop: "wheel", grip: "L" }, 0.01); A(5.47, "reaD", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(5.78, "reaD", "R", { prop: "wheel", grip: "R" }, 0.12, "inOut"); A(5.9, "reaD", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" });
A(5.8, "reaD", "look", { to: [0.3, 0.0], dur: 0.12 });
sfx(5.6, "latch-click", { gain: 0.2, reason: "the mirror clicking into place" });
A(5.95, "reaD", "look", { to: [0.8, 0.1], dur: 0.12 });   // over his shoulder for the reverse
A(6.38, "reaD", "turn", { to: 30, dur: 0.15 });
A(6.85, "reaD", "turn", { to: 0, dur: 0.2 });
sfx(6.32, "timer-beep", { gain: 0.18, reason: "the reverse beeper" });
sfx(6.85, "kenney/drop-leather", { gain: 0.25, reason: "the tyre kissing the kerb, softly" });
c.hitStop(6.85, 3);
const tyre = (t) => { const p = W(t, [-0.5, 0, -1.02]); return [p[0], r3(hY(p[0]) + 0.02), p[2]]; };
for (const t of [0.1, 0.32, 6.85, 9.1]) c.at(t, { fx: "poof", pos: tyre(t), dur: 0.45, color: "#d8cdbd", puffs: 7, sparks: 0, size: 0.3, lift: 0.05 });
A(6.9, "vikW", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.85 }, dur: 0.12 });
A(6.92, "phxC", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.85 }, dur: 0.12 });
A(6.92, "wizB", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.85 }, dur: 0.12 });
A(5.5, "vik", "hide"); A(5.5, "vikW", "show");
see(5.5, 5.85, ["reaD.face"], "Reaper calmly sets the mirror");
see(6.3, 6.85, ["reaD", "wizB"], "one smooth reverse into the gap");
see(6.9, 7.15, ["phxC.face", "wizB.face"], "jaws drop");

// ---------------------------------------------------------------- 06-08 ENDING 7.2-10.0 (the series block)
for (const id of ["reaD", "wizB", "phxC"]) A(7.2, id, "hide");
for (const id of ["wiz", "phx", "rea"]) A(7.2, id, "show");
A(7.2, "vikW", "hide"); A(7.2, "vikD", "show");
c.prop(7.2, "phoneC", { scale: 0.001 }, 0.01);
// WE DID IT: the three hug in front of the parked car, Viking cheers beside it (panel 6)
for (const id of ["wiz", "phx", "rea"]) A(7.2, id, "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 0.15 }, dur: 0.1 });
A(7.2, "vikD", "expr", { expr: "delighted", set: { curve: 1, open: 0.8 }, dur: 0.1 });
const V = { o: [0.38, 0.78, 0.12] };   // arms up in a V, wide of the hat brims
for (const id of ["wiz", "phx", "rea", "vikD"]) { c.arm(7.2, id, "R", V, 0.15, "out"); c.arm(7.2, id, "L", V, 0.15, "out"); }
A(7.2, "wiz", "turn", { to: 10, dur: 0.15 }); A(7.2, "rea", "turn", { to: -10, dur: 0.15 });
for (const id of ["wiz", "phx", "rea", "vikD"]) { A(7.25, id, "hop", { height: 0.12, dur: 0.3 }); }
A(7.25, "phx", "talk", { line: "YEAHH!", tone: "excited", dur: 0.5, voice: false });
A(7.3, "vikD", "talk", { line: "WOOO!", tone: "excited", dur: 0.5, voice: false });
sfx(7.2, "ai/warm-resolve", { gain: 0.25, reason: "the big major chord as they cheer" });
see(7.25, 7.95, ["wiz.face", "phx.face", "rea.face", "vikD.face"], "all four cheer in front of the perfectly parked car");
// THE TINY UNDO: Viking turns to the car and gives it a proud pat ("Good car."); dö-döm; it rolls back out
c.arm(7.7, "vikD", "R", "rest", 0.3, "inOut"); c.arm(7.7, "vikD", "L", "rest", 0.3, "inOut");
for (const id of ["wiz", "phx", "rea"]) { c.arm(7.95 + 0.05 * ["wiz", "phx", "rea"].indexOf(id), id, "R", "rest", 0.25, "inOut"); c.arm(7.95 + 0.05 * ["wiz", "phx", "rea"].indexOf(id), id, "L", "rest", 0.25, "inOut"); }
A(7.56, "vikD", "look", { to: [-0.6, -0.1], dur: 0.12 });   // eyes to the car first
A(7.68, "vikD", "move", { to: VIK_PAT, y: r3(hY(VIK_PAT[0])), dur: 0.42, steps: 2, ease: "inOut" });   // one step in to the car's back corner
A(7.68, "vikD", "turn", { to: -84, dur: 0.4, ease: "inOut" });   // to the car's back corner, his face still 3/4 to us
A(8.0, "vikD", "expr", { expr: "kind", set: { curve: 0.7, eye: 0.55 }, dur: 0.15 });
A(8.0, "vikD", "talk", { line: "gud car.", tone: "calm", dur: 0.45, voice: false });
cap(8.05, 8.75, "Good car.", 470);
c.arm(8.1, "vikD", "L", { o: [0.12, 0.62, 0.4] }, 0.1, "out"); c.arm(8.2, "vikD", "L", { o: [0.12, 0.62, 0.45] }, 0.07, "in");
c.arm(8.27, "vikD", "L", { o: [0.12, 0.64, 0.42] }, 0.08, "out");
sfx(8.27, "knock-tap", { gain: 0.35, reason: "the pat on the car's door" });
sfx(8.15, "dö-döm", { gain: 0.6, reason: "the series sound logo on the undo" });
sfx(8.36, "creak", { gain: 0.35, reason: "the car creaks as it starts to roll" });
sfx(8.4, "tyres", { gain: 0.2, dur: 0.75, reason: "tyres slowly rolling back over the cobbles" });
sfx(9.1, "thud-soft", { gain: 0.5, reason: "the back tyre bumping up onto the kerb" });
A(8.4, "vikD", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.3 }, dur: 0.15 });
c.arm(8.36, "vikD", "L", { o: [0.14, 0.66, 0.24] }, 0.12, "out");   // the hand comes off the door as it rolls; it stays up
A(8.38, "vikD", "look", { to: [0.4, 0.05], dur: 0.12 });
A(8.5, "vikD", "move", { to: VIK_BACK, y: r3(hY(VIK_BACK[0])), dur: 0.35, steps: 2, ease: "out" });   // and he backs off as it swings away
for (const id of ["wiz", "phx", "rea"]) { c.arm(7.95, id, "R", "rest", 0.2); c.arm(7.95, id, "L", "rest", 0.2); A(8.4, id, "expr", { expr: "shocked", set: { eye: 1.2, open: 0.5 }, dur: 0.12 }); A(8.4, id, "look", { to: [0.6, 0.05], dur: 0.15 }); }
see(8.05, 8.4, ["vikD.face"], "Viking's proud pat on the car");
see(8.4, 9.0, ["vikD"], "the car rolls back out of the gap");
// THE GLARE: three heads turn to Viking one by one; Viking frozen, hand up where the car was, sheepish grin
A(9.0, "vikD", "turn", { to: -40, dur: 0.3, ease: "inOut" });   // half round to the others, the hand still up
A(9.3, "vikD", "still", { dur: 0.7, idle: 0.2 });
act.sheepish(c, 9.2, "vikD");
A(9.2, "vikD", "look", { to: [-0.3, 0.05], dur: 0.2 });
for (const [i, id] of ["wiz", "rea", "phx"].entries()) {
  const t = 9.05 + i * 0.15;
  A(t, id, "look", { to: [0.9, 0.0], dur: 0.25, ease: "inOut" });
  A(t, id, "turn", { to: 45, dur: 0.3, ease: "inOut" });
  A(t + 0.05, id, "expr", { expr: "annoyed", set: { curve: -0.5 }, dur: 0.25 });
  A(t + 0.05, id, "face", { lid: 0.42, dur: 0.25 });
}
see(9.4, 9.95, ["wiz.face", "phx.face", "rea.face", "vikD.face"], "three glares at Viking, the car back at its frame-0 angle");

// ---------------------------------------------------------------- shots (from where things are: the car's rig math)
const head = (t, s) => W(t, [SEATS[s][0], 1.12 + SEATS[s][2], SEATS[s][1] + 0.05]);
// a camera `back` metres toward us from `look` (on the street: plain heights are lifted to the street under them)
const shot = (look, back, o = {}) => { const L = o.abs ? look : [look[0], look[1] + hY(look[0]), look[2]]; return { pos: [r3(L[0] + (o.dx ?? 0)), r3(L[1] + (o.up ?? 0.3)), r3(L[2] + back)], look: L.map(r3), fov: o.fov ?? 46 }; };
const mid = (...ps) => [0, 1, 2].map((i) => ps.reduce((a, p) => a + p[i], 0) / ps.length);
const CAR0 = W(0.3, [0, 1.0, 0]);
const WIDE0 = { pos: [1.1, r3(hY(1.1) + 3.0), r3(PZ + 7.6)], look: [0.9, r3(hY(0.9) + 1.3), r3(PZ - 0.15)], fov: 54 };   // the blue car and the bin at the right edge
const VIK = shot([VIK_GUIDE[0] - 0.35, 1.0, VIK_GUIDE[1] - 0.6], 5.2, { dx: 0.1, up: 0.35, fov: 44 });
// the mirror insert: close on the driver's face from outside his window, a little ahead of him (his eyes up at the mirror)
// (fixed to the car, so it rides along as the car creeps back)
const MIRROR = { rig: "car", pos: [0.75, 1.6, 2.7], look: [0.52, 1.22, 0.2], fov: 40 };   // through the windscreen
const WIDE1 = { pos: [2.9, r3(hY(2.9) + 1.4), r3(PZ + 6.6)], look: [2.1, r3(hY(2.1) + 0.8), r3(PZ - 1.2)], fov: 50 };
const SPELL = { pos: [3.45, r3(hY(3.4) + 0.95), r3(PZ + 5.2)], look: [1.1, r3(hY(1.1) + 1.5), r3(PZ + 0.5)], fov: 54 };   // low, behind Viking
const FRONT = (() => { const c = W(4.9, [0, 1.15, 0.2]); return shot(c, 4.8, { up: 0.35, fov: 44, abs: true }); })();
const REA = (() => { const h = head(5.6, "drv"); return { pos: [r3(h[0] - 0.3), r3(h[1] + 0.75), r3(h[2] + 3.4)], look: [r3(h[0] - 0.15), r3(h[1] - 0.05), h[2]], fov: 38 }; })();
const SIDE = { pos: [0, r3(hY(0) + 2.6), r3(PZ + 11.5)], look: [0, r3(hY(0) + 1.1), PZ], fov: 60 };   // both neighbours at the frame edges: the gap reads
const HUG = shot([1.15, 1.0, PZ + 2.3], 8.6, { up: 0.55, fov: 56 });
// high, so the car's angle to the kerb reads over the group's heads (the callback to frame 0)
const UNDO = { pos: [0.95, r3(hY(0.95) + 4.8), r3(PZ + 11.8)], look: [0.8, r3(hY(0.8) + 0.75), r3(PZ + 0.8)], fov: 50 };
const GLARE = { pos: [1.3, r3(hY(1.3) + 3.3), r3(PZ + 9.6)], look: [1.15, r3(hY(1.15) + 0.75), r3(PZ + 1.4)], fov: 56 };
const beats = c.beats([
  ["01 already going wrong", 0, WIDE0, "hook"],
  ["02 viking guides", 1.5, VIK],
  ["02b mirror", 2.4, MIRROR, "insert"],
  ["02c the bin", 2.82, WIDE1],
  ["03 the spell", 3.3, SPELL, "escalation"],
  ["04 dropped across", 4.55, FRONT],
  ["05 reaper sets the mirror", 5.5, REA],
  ["05b one smooth reverse", 5.9, SIDE, "payoff"],
  ["06 we did it", 7.2, HUG],
  ["07 the tiny undo", 8.0, { ...UNDO, to: GLARE, dur: 2.0, ease: "in" }, "reveal"],   // one slow push in, no cut at 9.0
  ["08 the glare", 9.0, null],
], END);

write(import.meta.url, {
  id: "parallel-park",
  title: "My friend group trying to parallel park one car",
  idea: "Friends try to, episode 5 (4 Nov 2026): four backseat drivers, a bin, a spell; Reaper parks it in one move; Viking's proud pat rolls it back out",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: "natural",
  set: { type: "plain", color: "#f3c99a", floor: "#6f6669", light: "golden", para: 0, bloom: "emissive", aperture: 0, focus: false,
    plate: { src: "assets/plates/street-terrace-evening.png", z: r3(KZ - 3.2), center: [0.3, 7.55], height: 15, relief: 0.3, dust: 30 } },
  rigs: [
    { id: "car", kind: "hatchback", color: "#ffcc2e", pivot: [0, 0.5, 0], keys: K },
    { id: "red", kind: "hatchback", color: "#d4473d", pivot: [0, 0.5, 0], keys: [{ at: 0, pos: [RED[0], hY(RED[0]), RED[1]], yaw: -90, pitch: -SLOPE }] },
    { id: "blue", kind: "hatchback", color: "#4a7ac4", pivot: [0, 0.5, 0], keys: [{ at: 0, pos: [BLUE[0], hY(BLUE[0]), BLUE[1]], yaw: -90, pitch: -SLOPE }] },
  ],
  music: { style: "disco", bpm: 124, key: -2, gain: 0.28, lowCut: 150, payoff: 7.2, parts: [{ at: 0, part: "main" }, { at: 8.3, part: "stop" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "concrete",
    engine: { keys: [[0, 1400, 0.6, 0], [0.4, 900, 0.2, 0], [1.0, 1500, 0.5, 0], [1.6, 1100, 0.3, 0], [2.9, 1200, 0.4, 0], [3.0, 800, 0.1, 0], [3.3, 0, 0, 0], [5.85, 0, 0, 0], [5.9, 1300, 0.5, 0], [6.85, 800, 0.1, 0], [7.15, 0, 0, 0]], gain: 0.25 } },
  hook: { show: ["wizC", "phxC", "vikC"], hint: 0, what: "the car half in the gap at a bad angle, its tyre bumping the kerb, four friends shouting inside" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wizS", with: "phxC", from: 3.55, to: 3.95, reason: "the Wizard's staff arm sweeps out of the window past Phoenix as he casts; the beat is the spell, Phoenix is a passenger in it" },
    { who: "phxC", with: "reaC", from: 4.9, to: 5.6, reason: "Phoenix leans in pointing at the Wizard; the blame is theirs, Reaper's sigh in the back reads at 5.5" },
    { who: "wizS", with: "reaC", from: 4.0, to: 4.6, reason: "Reaper's shock in the back seat sits behind the Wizard leaning out with the staff: the spell is the moment, Reaper's face is back at 4.8" },
    ...["wizS", "phxC", "reaC"].map((who) => ({ who, with: "aura", from: 3.3, to: 4.7, reason: "the spell's rings swirl round the car they sit in (light, not a solid)" })),
    ...[["wizC", "seat-drv"], ["wizS", "seat-drv"], ["reaD", "seat-drv"], ["phxC", "seat-pas"], ["vikC", "seat-rl"], ["wizB", "seat-rl"], ["reaC", "seat-rr"], ["reaC", "seat-pas"], ["vikC", "seat-drv"]].map(([who, w]) => ({ who, with: w, from: 0, to: 7.45, reason: "sitting in the car: the hat or hood brushes the headrest, the knees touch the seat in front (a small car with four in it)" })),
  ],
  notes: "Generated by storyboards/series/friends-try-to/05-parallel-park/make-parallel-park.mjs.",
});
