// Country vs Country 02 vehicle bench (T2): the German city bus (Wedge seated, doors open then shut) and the American pickup (Mash seated, waving
// out of the window), from engine/page/props-cvc-vehicles.js. Not a clip: one still per beat, 1 s apart, each taken 0.55 s into its beat.
// Cameras 05 and 16 are the DESIGN section 0 numbers for the bus (placed so Wedge is at DESIGN cam 05's look point (-3.78, -2.15)), 03 and 19 the
// pickup's (the pickup is placed so Mash is on cam 03's axis, 6 m out); the rest are checking views.
//   node storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-vehicles.mjs   (prints the still times and what each shows)
//   node engine/render.mjs storyboards/series/country-vs-country/02-traffic-light/bench/vehicles-bench.json --stills <times> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/vehicles-bench-*.png --out storyboards/series/country-vs-country/02-traffic-light/bench/vehicles-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { BUS_RIDE_OFF, BUS_WHEEL_HANDS, PICKUP_RIDE_OFF, PICKUP_WHEEL_HANDS, handPose } from "../../../../../engine/page/props-cvc-vehicles.js";

const c = clip(), { A } = c;
const BUS = [-4.20, -4.10], BUSUS = [-4.20, 14.0], PK = [14.2, -0.10];   // x, z of the origins (all rot 0, front +z)
const WEDGE = { width: 0.88, height: 0.98 }, MASH = { width: 0.54, height: 1.24 };
const GRADE = { de: { s: 1.0, w: -0.15, c: 1.04 }, us: { s: 1.16, w: 0.35, c: 1.0 } };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const bx = (dx, y, dz) => [BUS[0] + dx, y, BUS[1] + dz];
const px = (dx, y, dz) => [PK[0] + dx, y, PK[1] + dz];

const props = [
  { id: "busde", kind: "citybus", x: BUS[0], y: 0, z: BUS[1], rot: 0, look: "de", open: 1 },
  { id: "busus", kind: "citybus", x: BUSUS[0], y: 0, z: BUSUS[1], rot: 0, look: "us", open: 0 },
  { id: "pk", kind: "pickup", x: PK[0], y: 0, z: PK[1], rot: 0 },
];
// shots: [label, camera, lane, { open, len, blink, bend, bump }]
const SHOTS = [
  ["bus cam 05, doors open (Wedge, the watch hand rests on the wheel)", { pos: [-5.9, 1.30, 1.6], look: [-3.78, 1.38, -2.15], fov: 34 }, "de", { open: 1 }],
  ["bus cam 05, doors shut", { pos: [-5.9, 1.30, 1.6], look: [-3.78, 1.38, -2.15], fov: 34 }, "de", { open: 0 }],
  ["bus cam 16 (door side from the forecourt), doors open", { pos: [-13.0, 1.05, 0.6], look: [-5.31, 1.46, -1.61], fov: 34 }, "de", { open: 1 }],
  ["bus cam 16, doors shut, indicator on, rolled 1 m", { pos: [-13.0, 1.05, 0.6], look: [-5.31, 1.46, -1.61], fov: 34 }, "de", { open: 0, blink: 1, len: 1.0 }],
  ["bus front 3/4 from the driver's side (wheel, dash, route display)", { pos: [-1.4, 1.5, 0.9], look: [-4.0, 1.2, -2.0], fov: 38 }, "de", { open: 0 }],
  ["bus through the open door: Wedge, hands, wheel, seat", { pos: [-6.6, 1.45, -3.3], look: [-3.8, 1.1, -1.9], fov: 36 }, "de", { open: 1 }],
  ["bus door close-up (step, leaves, doors half open)", { pos: [-8.2, 1.3, -0.9], look: [-5.1, 1.0, -2.2], fov: 34 }, "de", { open: 0.5 }],
  ["bus US look, 3/4 from the door side", { pos: [-8.5, 1.5, 11.0], look: [-4.2, 1.0, 14.0], fov: 40 }, "us", {}],
  ["pickup cam 03 (Mash waves, 6 m out)", { pos: [19.8, 0.95, -2.8], look: [12.5, 1.51, 1.4], fov: 32 }, "us", {}],
  ["pickup cam 19, through the windscreen", { pos: [14.6, 1.05, 4.9], look: [14.6, 1.20, 0.2], fov: 30 }, "us", {}],
  ["pickup front 3/4 (grille, lamps, wheels turned 20 deg)", { pos: [17.0, 1.2, 4.6], look: [14.2, 0.8, 0.5], fov: 38 }, "us", { bend: -20 }],
  ["pickup rear 3/4 (bed, tailgate, plate)", { pos: [11.2, 1.7, -5.0], look: [14.2, 0.8, -0.5], fov: 38 }, "us", {}],
];
const END = SHOTS.length;

// the sitters: placed by ride + sit, the hands on the wheel at 10 and 2 (grip "hold")
const cast = [
  { id: "wedge", character: "potatobrawl/wedge", at: [BUS[0] + BUS_RIDE_OFF[0], BUS[1] + BUS_RIDE_OFF[2]], face: 0, expr: "deadpan", follow: 0.2, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: [PK[0] + PICKUP_RIDE_OFF[0], PK[1] + PICKUP_RIDE_OFF[2]], face: 0, expr: "happy", follow: 0.3, seed: 5.2 },
];
for (const w of cast.map((a) => a.id)) c.A(0, w, "noblink");
A(0, "wedge", "ride", { prop: "busde", off: BUS_RIDE_OFF, yaw: 0, sit: true, dur: 0 });
A(0, "mash", "ride", { prop: "pk", off: PICKUP_RIDE_OFF, yaw: 0, sit: true, dur: 0 });
const hands = (who, ride, ch, wh) => {
  c.arm(0, who, "L", handPose(wh.L, ride, ch, 1), 0, "linear"); A(0, who, "grip", { side: "L", shape: "hold", dur: 0 });
  c.arm(0, who, "R", handPose(wh.R, ride, ch, -1), 0, "linear"); A(0, who, "grip", { side: "R", shape: "hold", dur: 0 });
};
hands("wedge", BUS_RIDE_OFF, WEDGE, BUS_WHEEL_HANDS);
// Mash: the right hand on the wheel, the left arm out of the +x window (the sill is at x 0.875, y 0.96)
c.arm(0, "mash", "R", handPose(PICKUP_WHEEL_HANDS.R, PICKUP_RIDE_OFF, MASH, -1), 0, "linear"); A(0, "mash", "grip", { side: "R", shape: "hold", dur: 0 });
c.arm(0, "mash", "L", { o: [0.32, 0.64, 0.30] }, 0, "linear"); A(0, "mash", "grip", { side: "L", shape: "open", dur: 0 });

for (const id of ["busde", "busus", "pk"]) c.prop(0, id, { open: id === "busde" ? 1 : 0, len: 0, blink: 0, bend: 0, bump: 0 }, 0, "linear");
// a German beat sets the bus's keys, an American beat the pickup's (a beat with nothing to set leaves the last state)
SHOTS.forEach(([, , lane, p], i) => {
  if (!Object.keys(p).length) return;
  if (lane === "de") c.prop(i, "busde", { open: p.open ?? 1, len: p.len ?? 0, blink: p.blink ?? 0 }, 0, "linear");
  else c.prop(i, "pk", { bend: p.bend ?? 0, bump: p.bump ?? 0 }, 0, "linear");
});
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.55)).join(","));
SHOTS.forEach(([label], i) => console.log(`  ${r3(i + 0.55).toFixed(2)}s  ${label}`));
const grade = SHOTS.map(([, , lane], i) => [i, GRADE[lane]]);

write(import.meta.url, {
  id: "vehicles-bench", title: "Vehicles bench", idea: "Props bench for Country vs Country 02 (citybus, pickup), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#a9d4f2", floor: "#6b7078", light: "soft", para: 0, aperture: 0, shadow: { size: 20 }, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, music: false, sound: { auto: false },
  hook: { show: ["wedge", "mash"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([label, cam], i) => [`s${i + 1}`, i, cam, label]), END),
  allowClip: [
    { who: "wedge", with: "busde", from: 0, to: END, reason: "bench: Wedge sits on the bus's driver seat inside its shell (the episode's ride window)" },
    { who: "mash", with: "pk", from: 0, to: END, reason: "bench: Mash sits on the pickup's bench seat in its open cab (the episode's ride window)" },
  ],
  notes: "Generated by storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-vehicles.mjs (props bench, no reviews).",
});
