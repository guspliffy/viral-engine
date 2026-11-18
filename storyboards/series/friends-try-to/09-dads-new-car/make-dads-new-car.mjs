// FRIENDS TRY TO 09 "DAD'S NEW CAR" (18 Nov 2026). Jonny 18 Nov 17:30 Berlin: another "friend group tries to" video,
// because they earned likes but had no hook and a bad retention graph. The remake of 05 parallel park (62 likes on 772
// views, the account's best like rate; 0:03 hold 49 %, silent gibberish, no stake, no counter) with Court Day's
// packaging: a spoken stake at 0.0, a visible try counter (hud "tries"), real voices, cut on the payoff, a loop.
//   node storyboards/series/friends-try-to/09-dads-new-car/make-dads-new-car.mjs -> dads-new-car.json
//
// CHAIN (X, so Y, so Z): Chip drives Dad's new car into a parking gap with three tries, so Wedge guides him back from
// the pavement ("Trust me"), so the bumper bonks the bin (try 2), so Chip dives in nose first and ends up diagonal,
// so the two blame each other (try 3, last), so Spud takes the wheel and parks it in one smooth reverse, so they cheer,
// so Wedge pats the roof ("Trust me. Good car."), but the handbrake was never on, so the car rolls back to its frame-0
// angle on the kerb and the counter reads 4/3. Mash sits in the back on his phone the whole time and never looks up.
// Opener A (it is already going wrong at frame 0). Hook line (in-app title): "He parked it perfectly."
//
// Places (world: x right, z toward the camera; the camera looks across the street at the far kerb, -z). The street
// slopes down to +x (5 degrees), so a car out of gear rolls backwards out of the gap. Cars are rigs (vehicle.js,
// car-hatchback.js): front +z in their own frame, their left +x, left-hand drive (the driver at +x). Parked cars face
// -x (nose to screen left), the driver's side toward us. Set, cars, bin and the car's frame-0 and end keys are 05's.
import { clip, write } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { rigToWorld } from "../../../../engine/page/vehicle.js";
import { streetY } from "../../../../engine/page/props-parking.js";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const r3 = (x) => Math.round(x * 1000) / 1000;
const SLOPE = 5, LIFT = 0.45;
const hY = (x) => r3(streetY(x, SLOPE, LIFT));

// ---------------------------------------------------------------- the lines (measured: node qa/lines.mjs ftt09-voice-probe.json)
const DUR = (process.env.DUR ?? "2.64,1.45,0.94,0.88,0.92,0.89,1.6,1.9").split(",").map(Number);
const T = [0.1, 2.85, 4.85, 7.8, 8.8, 9.9, 13.5, 15.45];   // when each line starts (picture follows the lines)
const END_OF = (i) => r3(T[i] + DUR[i]);
const SUB = 470;   // captions: upper third, under the in-app title band, never over faces
const CAPTEXT = { 0: "Dad's new car. *3 tries.*", 4: "*MY* left!", 5: "*Last* try." };
// the cast id that speaks each line (the same friend has an id per place: chipC in the car, wedgeD at the end)
const WHO = [null, "wedge", "mashC", "chipC", "wedge", null, "chip", "wedgeD"];
const say = (i) => {
  const [voice, line, tone, style, o = {}] = LINES[i], who = WHO[i] ?? voice;
  if (who === "narrator") c.at(T[i], { macro: "narrate", line, voice: "narrator", style, ...o, caption: false, gain: 1.0 });
  else c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  const nextT = T[i + 1] ?? END_OF(i) + 1.2;
  cap(T[i], r3(Math.min(END_OF(i) + 0.35, nextT - 0.05)), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- places (05's)
const KZ = -1.3;                                  // the kerb's street face
const PZ = KZ + 1.22;                             // a parked car's middle
const RED = [-4.3, PZ], BLUE = [4.3, PZ];
const PARK = { x: 0, z: PZ, yaw: -90 };
const BAD = { x: 0.55, z: PZ + 0.12, yaw: -42 };   // frame 0 and the last frame: the back right tyre on the kerb
const BIN = [1.95, KZ - 0.42];
const SEAT_Y = 0.06;
const TRY3_SWAP = 9.8;   // = TRY3 (the cut that swaps the drivers)
const SEATS = { drv: [0.55, 0.2, 0.06], pas: [-0.55, 0.2, 0.06], rl: [0.45, -0.98, 0.34], rr: [-0.45, -0.98, 0.34] };
const seatAt = (s) => [SEATS[s][0], r3(SEATS[s][1] + 0.03)];

// ---------------------------------------------------------------- the car's path (rig keys, world)
const K = [];
const onSlope = (yaw) => ({ pitch: SLOPE * Math.sin((yaw * Math.PI) / 180), roll: -SLOPE * Math.cos((yaw * Math.PI) / 180) });
const key = (at, p, o = {}) => { const sl = onSlope(p.yaw); K.push({ at, pos: [r3(p.x), r3((o.y ?? 0) + hY(p.x)), r3(p.z)], yaw: r3(p.yaw), roll: r3((o.roll ?? 0) + sl.roll), pitch: r3((o.pitch ?? 0) + sl.pitch), steer: r3(o.steer ?? 0) }); };
const along = (p, d) => ({ ...p, x: p.x + d * Math.sin((p.yaw * Math.PI) / 180), z: p.z + d * Math.cos((p.yaw * Math.PI) / 180) });
// TRY 1 (0-4.9): still reversing at frame 0, the back tyre climbs the kerb and drops off; Chip pulls forward, then
// reverses again on Wedge's "back, back, back" until the bumper bonks the bin
key(0, along(BAD, 0.22), { steer: -20 });
key(0.12, along(BAD, 0.04), { steer: -20, pitch: 2.2, roll: -2.6, y: 0.06 });
key(0.3, BAD, { steer: -20, pitch: 0.4, roll: -0.6, y: 0.01 });
key(0.42, BAD, { steer: -10 });
key(1.0, BAD, { steer: 0 });
const RETRY = { x: -0.35, z: PZ + 0.95, yaw: -68 };
key(1.75, RETRY, { steer: 15 });
key(2.1, RETRY, { steer: 0 });
key(3.0, RETRY, { steer: 0 });
const NUDGE = { x: 0.32, z: PZ + 0.16, yaw: -78 };
key(4.35, NUDGE, { steer: -12 });
key(4.45, along(NUDGE, 0.03), { pitch: -0.8 });
key(4.9, along(NUDGE, 0.03));
// TRY 2 (5.8-7.4): back out into the lane, then dive in nose first, too fast: it stops diagonal, nose at the kerb
const LANE = { x: 2.0, z: PZ + 2.15, yaw: -95 };
key(5.8, along(NUDGE, 0.03));
key(6.5, LANE, { steer: 22 });
key(6.65, LANE, { steer: -32 });
const DIVE = { x: -0.75, z: PZ + 0.3, yaw: -132 };
key(7.35, DIVE, { steer: -32 });
key(7.42, DIVE, { steer: -32, pitch: -2.2 });          // the brakes bite: the nose dips
key(7.6, DIVE, { steer: -32, pitch: 0.8 });
key(7.72, DIVE, { steer: -32 });
// TRY 3 (10.85-12.8): Spud reverses out, pulls up beside the red car, one smooth reverse arc into the gap
key(10.9, DIVE, { steer: 0 });
const OUT = { x: 0.35, z: PZ + 2.05, yaw: -100 };
key(11.5, OUT, { steer: 0 });
const BESIDE = { x: -1.45, z: PZ + 2.36, yaw: -90 };
key(12, BESIDE, { steer: 0 });
key(12.15, BESIDE, { steer: -28 });
key(12.5, { x: -0.55, z: PZ + 1.25, yaw: -64 }, { steer: -28 });
key(12.85, { x: -0.06, z: PZ + 0.08, yaw: -86 }, { steer: 18 });
key(13, PARK, { steer: 0 });                         // the back tyre kisses the kerb (hit-stop)
// THE UNDO (16.5-17.6): no handbrake: it rolls back down the slope and stops at its frame-0 angle on the kerb
const ROLL = 17.5;
key(ROLL, PARK);
key(r3(ROLL + 0.45), { x: 0.28, z: PZ + 0.06, yaw: -70 }, { steer: -20 });
key(r3(ROLL + 0.8), along(BAD, 0.02), { steer: -20, pitch: 1.2, roll: -1.6, y: 0.04 });
key(r3(ROLL + 0.92), BAD, { steer: -20, pitch: 1.6, roll: -2.0, y: 0.05 });
key(r3(ROLL + 1.1), BAD, { steer: -20, pitch: 1.6, roll: -2.0, y: 0.05 });
const KERB = r3(ROLL + 0.8);   // the back tyre bumps up onto the kerb: the counter goes to 4/3
const RIG = { pivot: [0, 0.5, 0], keys: K };
const W = (t, q) => rigToWorld(RIG, t, q).map(r3);

// ---------------------------------------------------------------- the counter (hud "tries": a car pictogram + n/3)
const TRY2 = 4.5, TRY3 = 9.8;
const tries = { keys: [[0, 1], [TRY2, 2], [TRY3, 3], [r3(KERB + 0.05), 4]], max: 3 };

// ---------------------------------------------------------------- cast
// Wedge guides from the pavement behind the gap (try 1-2), watches from the street (try 3), cheers and pats (end).
const WEDGE_G = [2.75, KZ - 0.95], WEDGE_W = [3.1, PZ + 2.4];
const WEDGE_D = [2.15, PZ + 2.1], WEDGE_PAT = [1.95, PZ + 0.98], WEDGE_BACK = [2.4, PZ + 1.65];
const END_POS = { spud: [-0.35, PZ + 2.75], chip: [0.95, PZ + 2.95] };
const inCar = (id, character, seat, o = {}) => ({ id, character, rig: "car", at: seatAt(seat), face: "camera", expr: "kind", follow: 0.25, shadowFall: 0.001, ...o });
const cast = [
  inCar("chipC", "potatobrawl/chip", "drv", { seed: 2.3, expr: "eager" }),
  inCar("chipP", "potatobrawl/chip", "pas", { seed: 2.3 }),
  inCar("spudC", "potatobrawl/spud", "pas", { seed: 1.1 }),
  inCar("spudD", "potatobrawl/spud", "drv", { seed: 1.1, expr: "calm" }),
  inCar("mashC", "potatobrawl/mash", "rl", { seed: 4.1, expr: "deadpan" }),
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE_G, y: hY(WEDGE_G[0]) + 0.12, face: -35, expr: "eager", follow: 0.35, seed: 3.3 },
  { id: "wedgeW", character: "potatobrawl/wedge", at: WEDGE_W, y: hY(WEDGE_W[0]), face: 160, expr: "eager", follow: 0.35, seed: 3.3 },
  { id: "wedgeD", character: "potatobrawl/wedge", at: WEDGE_D, y: hY(WEDGE_D[0]), face: -15, expr: "delighted", follow: 0.35, seed: 3.3 },
  { id: "spud", character: "potatobrawl/spud", at: END_POS.spud, y: hY(END_POS.spud[0]), face: 12, expr: "delighted", follow: 0.3, seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", at: END_POS.chip, y: hY(END_POS.chip[0]), face: -5, expr: "delighted", follow: 0.3, seed: 2.3 },
];
// Mash's phone: low in front of him, screen to his face (he never looks up)
const PHONE = { id: "phoneM", kind: "phone", style: "iphone", rig: "car", x: 0.45, y: 1.3, z: -0.6, rot: 180, tip: -20, scale: 1.3 };
const props = [
  ...Object.entries(SEATS).map(([s, [x, z, dy]]) => ({ id: `seat-${s}`, kind: "carseat", rig: "car", x, y: SEAT_Y + dy, z, color: "#59535f", trim: "#6e6875", width: 0.86 })),
  // tiny Chip drives on a raised seat (his eyes would sit under the wheel rim); it swaps for the normal one when Spud drives
  { id: "seat-chip", kind: "carseat", rig: "car", x: SEATS.drv[0], y: r3(SEAT_Y + SEATS.drv[2] + 0.24), z: SEATS.drv[1], color: "#59535f", trim: "#6e6875", width: 0.86 },
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.88, z: 0.63, tip: 34 },
  { id: "street", kind: "street", x: 0, z: KZ + 6, w: 20, d: 12, slope: SLOPE, lift: LIFT, seed: 4 },
  { id: "kerb", kind: "kerb", x: 0, x0: -9, x1: 9, z: KZ, seed: 5, slope: SLOPE, lift: LIFT },
  { id: "flagway", kind: "flagway", x: 0, z: KZ - 0.25, w: 20, d: 3.2, slope: SLOPE, lift: LIFT, seed: 6 },
  { id: "bin", kind: "wheeliebin", x: BIN[0], y: r3(hY(BIN[0]) + 0.12), z: BIN[1], rot: -90 },
  PHONE,
];

// ---------------------------------------------------------------- frame 0 (all through): Mash on his phone in the back
for (const id of ["chipP", "spudD", "wedgeW", "wedgeD", "spud", "chip"]) A(0, id, "hide");
for (const [id, s] of [["chipC", "chip"], ["spudC", "pas"], ["mashC", "rl"]]) A(0, id, "sit", { seat: `seat-${s}`, dur: 0, hands: "keep" });
c.prop(0, "seat-drv", { scale: 0.001 }, 0.01); c.prop(TRY3_SWAP, "seat-drv", { scale: 1 }, 0.01); c.prop(TRY3_SWAP, "seat-chip", { scale: 0.001 }, 0.01);
// no grab: a held prop stays where the grab was while the car drives on, so the phone rides on the car (rig) and
// both gloves rest at its sides
c.arm(0, "mashC", "R", { x: [0.09, 0.36, 0.34] }, 0); c.arm(0, "mashC", "L", { x: [-0.09, 0.36, 0.34] }, 0);
A(0, "mashC", "look", { to: [0.1, -0.7], dur: 0.01, blink: false });
A(0, "mashC", "face", { lidL: 0.35, lidR: 0.35, dur: 0.01 });
act.blinksAt(c, "mashC", [3.2, 8.3, 14.35, 17.0]);

// ---------------------------------------------------------------- 01 TRY 1/3, ALREADY GOING WRONG 0-2.5 (wide)
// the stake at 0.1 over the picture: the car on the kerb, Chip at the wheel, Wedge waving from the pavement
say(0);
A(0, "chipC", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "chipC", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "chipC", "R", { prop: "wheel", grip: "R" }, 0); c.arm(0, "chipC", "L", { prop: "wheel", grip: "L" }, 0);
A(0, "chipC", "expr", { expr: "shocked", set: { open: 0.6, eye: 1.3 }, dur: 0.01 });
A(0, "chipC", "look", { to: [0.35, 0.1], dur: 0.01, blink: false });
A(0, "spudC", "expr", { expr: "worried", dur: 0.01 }); A(0, "spudC", "look", { to: [0.5, 0.0], dur: 0.01, blink: false });
c.arm(0, "spudC", "R", { x: [-0.1, 0.62, 0.42] }, 0);   // a hand on the dashboard
A(0, "wedge", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.3 }, dur: 0.01 });
A(0, "wedge", "look", { to: [-0.7, 0.05], dur: 0.01 });
const beckon = (who, t0, n, step = 0.3) => { for (let k = 0; k < n; k++) { const t = r3(t0 + k * step); c.arm(t, who, "R", { o: [0.18, 0.5, 0.42] }, 0.13, "inOut"); c.arm(t, who, "L", { o: [0.18, 0.5, 0.42] }, 0.13, "inOut"); c.arm(r3(t + 0.15), who, "R", { o: [0.12, 0.62, 0.18] }, 0.13, "inOut"); c.arm(r3(t + 0.15), who, "L", { o: [0.12, 0.62, 0.18] }, 0.13, "inOut"); } };
beckon("wedge", 0, 3);
sfx(0.1, "screech", { gain: 0.35, reason: "the back tyre squeaking up the kerb stone" });
sfx(0.32, "thud-soft", { gain: 0.45, reason: "the tyre dropping off the kerb" });
for (const t of [0.0, 0.45]) sfx(t, "timer-beep", { gain: 0.18, reason: "the reverse beeper" });
A(0.5, "chipC", "expr", { expr: "annoyed", dur: 0.25 });
A(1.0, "chipC", "look", { to: [-0.3, 0.1], dur: 0.15 });   // forward: pulls out to try again
A(1.1, "spudC", "expr", { expr: "annoyed", set: { curve: -0.2 }, dur: 0.25 });
see(0, 2.5, ["chipC.face", "wedge.face"], "frame 0: Dad's new car half in the gap at a bad angle; Chip driving, Wedge waving");

// ---------------------------------------------------------------- 02 WEDGE GUIDES 2.5-4.9 (medium on Wedge, then the bin)
say(1);
A(2.5, "wedge", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.4 }, dur: 0.15 });
beckon("wedge", 2.55, 7, 0.27);
for (let k = 0; k < 7; k++) sfx(r3(3.0 + k * (0.24 - k * 0.018)), "timer-beep", { gain: 0.2, reason: "the reverse beeper, speeding up" });
A(3.0, "chipC", "look", { to: [0.5, 0.35], dur: 0.15 });   // up at the mirror
A(3.4, "chipC", "expr", { expr: "worried", dur: 0.2 });
// the bonk: the back bumper tips the bin over, Wedge still waving
c.prop(4.35, "bin", { wobble: 1 }, 0.1); c.prop(4.37, "bin", { tip: 1 }, 0.38, "in"); c.prop(4.75, "bin", { wobble: 0 }, 0.1);
sfx(4.35, "pan-bonk", { gain: 0.6, reason: "the bumper bonks the plastic wheelie bin" });
sfx(4.75, "thud", { gain: 0.4, reason: "the bin lands on its side on the pavement" });
c.at(4.76, { fx: "poof", pos: [BIN[0] + 0.5, r3(hY(BIN[0]) + 0.17), BIN[1]], dur: 0.45, color: "#d8cdbd", puffs: 8, sparks: 0, size: 0.35, lift: 0.05 });
A(4.4, "wedge", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.5 }, dur: 0.1 });
c.arm(4.4, "wedge", "R", "rest", 0.2); c.arm(4.4, "wedge", "L", "rest", 0.2);
A(4.4, "chipC", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.7 }, dur: 0.1 });
A(4.45, "chipC", "squash", { amount: 0.08, dur: 0.18 }); A(4.45, "spudC", "squash", { amount: 0.06, dur: 0.18 });
see(2.6, 4.3, ["wedge.face"], "Wedge waving the car back: trust me, back, back, back");
see(4.3, 4.85, ["bin", "wedge"], "the bumper bonks the bin over; the counter goes to 2/3");

// ---------------------------------------------------------------- 03 MASH 4.9-5.5 (in the car: he never looks up)
say(2);
see(4.95, 5.8, ["mashC.face", "phoneM"], "Mash, on his phone in the back: Nice.");

// ---------------------------------------------------------------- 04 TRY 2/3: NOSE FIRST 5.8-9.3 (wide, then the blame)
A(5.8, "chipC", "expr", { expr: "determined", dur: 0.2 }); A(5.8, "chipC", "look", { to: [0.6, 0.2], dur: 0.15 });
A(6.6, "chipC", "look", { to: [-0.4, 0.0], dur: 0.12 });
A(5.9, "wedge", "expr", { expr: "eager", dur: 0.2 }); beckon("wedge", 6, 3, 0.3);
sfx(6.65, "screech", { gain: 0.3, reason: "tyres as Chip pulls off too fast" });
sfx(7.38, "screech", { gain: 0.45, reason: "the brakes, hard" });
A(7.42, "chipC", "squash", { amount: 0.1, dur: 0.2 }); A(7.42, "spudC", "squash", { amount: 0.08, dur: 0.2 }); A(7.42, "mashC", "squash", { amount: 0.04, dur: 0.2 });
A(7.45, "spudC", "expr", { expr: "shocked", set: { eye: 1.25 }, dur: 0.12 });
see(6.6, 7.7, ["chipC"], "Chip dives in nose first and stops diagonal across the gap");
// the blame: Chip shouts out of his window at Wedge, Wedge points back
say(3);
A(7.75, "chipC", "expr", { expr: "angry", set: { eye: 1.1 }, dur: 0.15 }); A(7.75, "chipC", "look", { to: [0.7, 0.0], dur: 0.12 });
c.arm(7.75, "chipC", "R", { x: [0.32, 0.55, 0.3] }, 0.15, "out"); A(7.75, "chipC", "grip", { side: "R", shape: "point", dur: 0.1 });
say(4);
A(8.7, "wedge", "expr", { expr: "angry", dur: 0.15 });
c.arm(8.7, "wedge", "R", { o: [0.1, 0.62, 0.5] }, 0.15, "out"); A(8.7, "wedge", "grip", { side: "R", shape: "point", dur: 0.1 });
A(8.7, "wedge", "look", { to: [-0.6, 0.05], dur: 0.12 });
A(8.75, "spudC", "expr", { expr: "annoyed", set: { curve: -0.3 }, dur: 0.2 }); A(8.8, "spudC", "look", { to: [0, 0.05], dur: 0.15 });
see(7.75, END_OF(3), ["chipC.face"], "Chip: Your left!");
see(T[4], END_OF(4), ["wedge.face"], "Wedge: MY left!");

// ---------------------------------------------------------------- 05 TRY 3/3: SPUD DRIVES 9.75-12.9 (the swap is the cut)
for (const id of ["chipC", "spudC"]) A(TRY3, id, "hide");
A(TRY3, "spudD", "show"); A(TRY3, "chipP", "show");
A(TRY3, "spudD", "sit", { seat: "seat-drv", dur: 0, hands: "keep" }); A(TRY3, "chipP", "sit", { seat: "seat-pas", dur: 0, hands: "keep" });
A(TRY3, "chipP", "expr", { expr: "annoyed", set: { curve: -0.4 }, dur: 0.01 }); A(TRY3, "chipP", "look", { to: [0.4, -0.1], dur: 0.01 });
A(TRY3, "wedge", "hide"); A(TRY3, "wedgeW", "show");
say(5);
// Spud sets the mirror, both hands on the wheel, looks over his shoulder: calm
A(TRY3, "spudD", "look", { to: [-0.1, 0.6], dur: 0.01, blink: false });
c.arm(r3(TRY3 - 0.03), "spudD", "L", { prop: "wheel", grip: "L" }, 0.01); A(r3(TRY3 - 0.03), "spudD", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(r3(TRY3 - 0.03), "spudD", "R", { prop: "wheel", grip: "R" }, 0.01); A(r3(TRY3 - 0.03), "spudD", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" });   // both hands on the wheel from the cut (a mirror reach crossed his face)
A(10.35, "spudD", "look", { to: [0.3, 0.0], dur: 0.12 });
A(10.85, "spudD", "look", { to: [0.8, 0.1], dur: 0.12 });   // over his shoulder for the reverse
A(12.05, "spudD", "turn", { to: 30, dur: 0.15 });
A(13, "spudD", "turn", { to: 0, dur: 0.2 });
for (const t of [10.95, 11.35, 12.2, 12.55]) sfx(t, "timer-beep", { gain: 0.16, reason: "the reverse beeper" });
sfx(13, "kenney/drop-leather", { gain: 0.25, reason: "the tyre kissing the kerb, softly" });
c.hitStop(13, 3);
const tyre = (t) => { const p = W(t, [-0.5, 0, -1.02]); return [p[0], r3(hY(p[0]) + 0.02), p[2]]; };
for (const t of [0.1, 0.32, 13, KERB]) c.at(t, { fx: "poof", pos: tyre(t), dur: 0.45, color: "#d8cdbd", puffs: 7, sparks: 0, size: 0.3, lift: 0.05 });
A(13.05, "wedgeW", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.85 }, dur: 0.12 });
A(13.07, "chipP", "expr", { expr: "shocked", set: { eye: 1.35, open: 0.85 }, dur: 0.12 });
see(T[5], r3(T[5] + 0.6), ["spudD.face"], "last try: Spud calmly sets the mirror");
see(12.15, 13, ["spudD", "chipP"], "one smooth reverse into the gap");

// ---------------------------------------------------------------- 06 WE DID IT 13.45-14.6 (Mash stays in the car)
const OUTT = 13.45;
for (const id of ["spudD", "chipP"]) A(OUTT, id, "hide");
for (const id of ["spud", "chip"]) A(OUTT, id, "show");
A(OUTT, "wedgeW", "hide"); A(OUTT, "wedgeD", "show");
for (const id of ["spud", "chip"]) A(OUTT, id, "expr", { expr: "delighted", set: { curve: 1, open: 0.7, eye: 0.15 }, dur: 0.1 });
A(OUTT, "wedgeD", "expr", { expr: "delighted", set: { curve: 1, open: 0.8 }, dur: 0.1 });
const V = { o: [0.38, 0.78, 0.12] };
for (const id of ["spud", "chip", "wedgeD"]) { c.arm(OUTT, id, "R", V, 0.15, "out"); c.arm(OUTT, id, "L", V, 0.15, "out"); A(r3(OUTT + 0.05), id, "hop", { height: 0.12, dur: 0.3 }); }
A(r3(OUTT + 0.45), "chip", "hop", { height: 0.16, dur: 0.3 });
say(6);
sfx(OUTT, "ai/warm-resolve", { gain: 0.25, reason: "the big major chord as they cheer" });
see(r3(OUTT + 0.05), 15.2, ["spud.face", "chip.face", "wedgeD.face"], "they cheer in front of the perfectly parked car");

// ---------------------------------------------------------------- 07 THE TINY UNDO 15.3-17.6: "Trust me. Good car."
c.arm(15.2, "wedgeD", "R", "rest", 0.3, "inOut"); c.arm(15.2, "wedgeD", "L", "rest", 0.3, "inOut");
for (const [i, id] of ["spud", "chip"].entries()) { c.arm(r3(15.3 + 0.05 * i), id, "R", "rest", 0.25, "inOut"); c.arm(r3(15.3 + 0.05 * i), id, "L", "rest", 0.25, "inOut"); }
A(15.2, "wedgeD", "look", { to: [-0.6, -0.1], dur: 0.12 });
A(15.3, "wedgeD", "move", { to: WEDGE_PAT, y: r3(hY(WEDGE_PAT[0])), dur: 0.42, steps: 2, ease: "inOut" });
A(15.3, "wedgeD", "turn", { to: -55, dur: 0.4, ease: "inOut" });
say(7);
A(15.45, "wedgeD", "expr", { expr: "kind", set: { curve: 0.7, eye: 0.55 }, dur: 0.15 });
const PAT = r3(T[7] + DUR[7] * 0.62);   // on "Good car."
c.arm(r3(PAT - 0.17), "wedgeD", "L", { o: [0.12, 0.62, 0.4] }, 0.1, "out"); c.arm(r3(PAT - 0.07), "wedgeD", "L", { o: [0.12, 0.62, 0.45] }, 0.07, "in");
c.arm(PAT, "wedgeD", "L", { o: [0.12, 0.64, 0.42] }, 0.08, "out");
sfx(PAT, "knock-tap", { gain: 0.35, reason: "the pat on the car's door" });
sfx(r3(ROLL - 0.05), "creak", { gain: 0.35, reason: "the car creaks as it starts to roll" });
sfx(ROLL, "tyres", { gain: 0.2, dur: 0.75, reason: "tyres slowly rolling back over the cobbles" });
sfx(KERB, "thud-soft", { gain: 0.5, reason: "the back tyre bumping up onto the kerb" });
A(r3(ROLL + 0.05), "wedgeD", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.3 }, dur: 0.15 });
c.arm(ROLL, "wedgeD", "L", { o: [0.14, 0.66, 0.24] }, 0.12, "out");
A(r3(ROLL + 0.1), "wedgeD", "move", { to: WEDGE_BACK, y: r3(hY(WEDGE_BACK[0])), dur: 0.35, steps: 2, ease: "out" });
for (const id of ["spud", "chip"]) { A(r3(ROLL + 0.05), id, "expr", { expr: "shocked", set: { eye: 1.2, open: 0.5 }, dur: 0.12 }); A(r3(ROLL + 0.05), id, "look", { to: [0.6, 0.05], dur: 0.15 }); }
see(r3(PAT - 0.2), ROLL, ["wedgeD.face"], "Wedge's proud pat: Trust me. Good car.");
see(ROLL, KERB, ["wedgeD", "mashC"], "the car rolls back out of the gap with Mash still on his phone");
// THE GLARE: two heads turn to Wedge; Wedge frozen, sheepish; the counter reads 4/3; cut
const GL = r3(KERB + 0.1);
A(GL, "wedgeD", "turn", { to: -40, dur: 0.3, ease: "inOut" });
act.sheepish(c, r3(GL + 0.15), "wedgeD");
A(r3(GL + 0.15), "wedgeD", "look", { to: [-0.3, 0.05], dur: 0.2 });
for (const [i, id] of ["spud", "chip"].entries()) {
  const t = r3(GL + i * 0.05);
  A(t, id, "look", { to: [0.9, 0.0], dur: 0.25, ease: "inOut" });
  A(t, id, "turn", { to: 45, dur: 0.3, ease: "inOut" });
  act.mood(c, r3(t + 0.05), id, "angry", { hold: 0.6 });
}
const END = r3(GL + 0.95);
see(r3(GL + 0.35), END, ["spud.face", "chip.face", "wedgeD.face"], "two glares at Wedge, the car back at its frame-0 angle, 4/3");

// ---------------------------------------------------------------- shots (05's, from the car's rig math)
const head = (t, s) => W(t, [SEATS[s][0], 1.12 + SEATS[s][2], SEATS[s][1] + 0.05]);
const shot = (look, back, o = {}) => { const L = o.abs ? look : [look[0], look[1] + hY(look[0]), look[2]]; return { pos: [r3(L[0] + (o.dx ?? 0)), r3(L[1] + (o.up ?? 0.3)), r3(L[2] + back)], look: L.map(r3), fov: o.fov ?? 46 }; };
const WIDE0 = { pos: [2.1, r3(hY(2.1) + 2.4), r3(PZ + 6.8)], look: [1.2, r3(hY(1.2) + 1.5), r3(PZ - 0.6)], fov: 60 };   // from the right, so Wedge on the pavement shows past the car's tail
const WEDGE = shot([WEDGE_G[0] - 0.4, 1.0, WEDGE_G[1] + 0.3], 5.4, { dx: -0.2, up: 0.45, fov: 44 });
const BINSHOT = { pos: [2.9, r3(hY(2.9) + 1.4), r3(PZ + 6.6)], look: [2.1, r3(hY(2.1) + 0.8), r3(PZ - 1.2)], fov: 50 };
const MASH = { rig: "car", pos: [2.9, 1.6, -0.35], look: [0.45, 1.3, -0.7], fov: 46 };   // through his open window: the phone in his hands   // through the windscreen, over Chip
const DIVEW = { pos: [0.2, r3(hY(0.2) + 2.8), r3(PZ + 8.2)], look: [0.2, r3(hY(0.2) + 1.0), r3(PZ + 0.4)], fov: 58 };
const CHIPW = { rig: "car", pos: [0.62, 1.55, 2.3], look: [0.55, 1.3, 0.2], fov: 44 };   // through the windscreen   // through the windscreen (05's mirror insert)
const SPUDD = { rig: "car", pos: [0.62, 1.45, 1.95], look: [0.55, 1.2, 0.2], fov: 44 };   // through the windscreen
const SIDE = { pos: [0, r3(hY(0) + 2.6), r3(PZ + 11.5)], look: [0, r3(hY(0) + 1.1), PZ], fov: 60 };
const JAWS = { rig: "car", pos: [2.7, 1.6, -0.3], look: [0.0, 1.2, -0.35], fov: 46 };
const HUG = shot([0.95, 1.1, PZ + 2.2], 6.8, { up: 0.6, fov: 54 });
const UNDO = { pos: [0.95, r3(hY(0.95) + 3.2), r3(PZ + 9.4)], look: [0.95, r3(hY(1.05) + 0.95), r3(PZ + 0.9)], fov: 52 };
const GLARE = { pos: [0.95, r3(hY(0.95) + 2.7), r3(PZ + 8.4)], look: [0.95, r3(hY(1.1) + 0.95), r3(PZ + 1.0)], fov: 56 };
const beats = c.beats([
  ["01 try 1: already going wrong", 0, WIDE0, "hook"],
  ["02 wedge guides", 2.5, WEDGE],
  ["02b the bin", 4.2, BINSHOT],
  ["03 mash: nice", 4.8, MASH, "insert"],
  ["04 try 2: nose first", 5.8, DIVEW, "escalation"],
  ["04b your left", 7.75, CHIPW],
  ["04c my left", 8.75, WEDGE],
  ["05 try 3: spud", TRY3, SPUDD],
  ["05b one smooth reverse", 10.85, SIDE, "payoff"],
  ["06 we did it", OUTT, HUG],
  ["07 the tiny undo", 15.2, { ...UNDO, to: GLARE, dur: r3(END - 15.2), ease: "in" }, "reveal"],
], END);

write(import.meta.url, {
  id: "dads-new-car",
  title: "He parked it perfectly.",
  idea: "Friends try to 09 (18 Nov 2026): Dad's new car, three tries to park; Wedge's 'trust me' bins it, Chip dives in diagonal, Spud parks it in one move; Wedge's proud pat rolls it back to the start: 4/3",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  motion: "natural",
  hud: { tries },
  set: { type: "plain", color: "#f3c99a", floor: "#6f6669", light: "golden", para: 0, bloom: "emissive", aperture: 0, focus: false,
    plate: { src: "assets/plates/street-terrace-evening.png", z: r3(KZ - 3.2), center: [0.3, 7.55], height: 15, relief: 0.3, dust: 30 } },
  rigs: [
    { id: "car", kind: "hatchback", color: "#ffcc2e", pivot: [0, 0.5, 0], keys: K },
    { id: "red", kind: "hatchback", color: "#d4473d", pivot: [0, 0.5, 0], keys: [{ at: 0, pos: [RED[0], hY(RED[0]), RED[1]], yaw: -90, pitch: -SLOPE }] },
    { id: "blue", kind: "hatchback", color: "#4a7ac4", pivot: [0, 0.5, 0], keys: [{ at: 0, pos: [BLUE[0], hY(BLUE[0]), BLUE[1]], yaw: -90, pitch: -SLOPE }] },
  ],
  // a light comedy bed from 0.0 under the voices; it stops on the roll (the turn)
  music: { style: "disco", bpm: 118, key: -2, gain: 0.16, lowCut: 150, payoff: OUTT, parts: [{ at: 0, part: "main" }, { at: r3(ROLL - 0.05), part: "stop" }] },
  sound: { sfx: 0.7, ambience: 0.08, surface: "concrete", signature: false,
    engine: { keys: [[0, 1400, 0.5, 0], [0.4, 900, 0.2, 0], [1.0, 1400, 0.45, 0], [2.1, 900, 0.15, 0], [3.0, 1200, 0.35, 0], [4.4, 800, 0.1, 0], [5.8, 1300, 0.4, 0], [6.65, 2200, 0.7, 0], [7.4, 900, 0.15, 0], [10.9, 1200, 0.35, 0], [13.0, 800, 0.1, 0], [13.35, 0, 0, 0]], gain: 0.22 } },
  creative: { length: [17, 22] },
  hook: { show: ["chipC", "wedge"], hint: 0, what: "Dad's new car half in a parking gap at a bad angle, its tyre bumping the kerb; TRY 1/3" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chipC", with: "chipC", from: 0, to: 1.5, checks: ["face-hidden"], reason: "Chip looks back over his shoulder to reverse; his hood takes the far eye, the near eye and the brow read in the wide (still 0.5 s)" },
    { who: "chipC", with: "chipC", from: 5.8, to: 5.95, checks: ["face-hidden"], reason: "the first frames of the try-2 wide, Chip turning his head back to the front" },
    { who: "mashC", with: "spudC", from: 7.25, to: 7.75, checks: ["face-covered"], reason: "the try-2 wide is seen from behind the car: neither face is the subject, the diagonal car is" },
    ...[["chipC", "seat-chip"], ["chipC", "seat-drv"], ["spudD", "seat-drv"], ["spudC", "seat-pas"], ["chipP", "seat-pas"], ["mashC", "seat-rl"], ["mashC", "seat-drv"], ["spudC", "seat-rr"]].map(([who, w]) => ({ who, with: w, from: 0, to: END, reason: "sitting in the car: the head brushes the headrest, the knees touch the seat in front (a small car with three in it)" })),
  ],
  notes: "Generated by storyboards/series/friends-try-to/09-dads-new-car/make-dads-new-car.mjs.",
});
