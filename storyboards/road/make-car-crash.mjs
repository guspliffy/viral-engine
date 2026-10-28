// Still Scrolling — Car Crash (story 07 of Jonny's story library, brief 27 Oct 2026, made 28 Oct): Dragon drives a
// red open-top roadster along a sunny coastal road, the Wizard is his belted passenger and scrolls his phone. The
// passenger-side front tyre hits the bevelled end of a raised divider, the car kicks up into ONE cartoon barrel roll
// and lands on all four tyres. Dragon panics, steers, lands it and lets out a breath. The Wizard never looks up.
// The last shot is the first one again, so the clip loops.
//
// THE BRIEF (Fable's review A and Jonny judge the clip against these)
//   Joke:        a calm phone user inside extravagant cartoon chaos.
//   Wants:       Dragon wants to keep the car on the road; the Wizard wants one more video.
//   Consequence: the car does a full barrel roll; the Wizard swipes once while upside down.
//   Ending:      everyone is fine, back to the opening frame (designed loop, 14.0 s = 420 frames).
//
// Order of work (CLAUDE.md): places and cast -> the car's path (rig keys, checked: tyres meet the road, nothing goes
// through it) -> beats with acting -> shots -> qa/motion + --layout -> draft stills + Fable review A -> renders.
// The road is a treadmill (set-road.js): its speed is solved so 14 s scroll exactly 96 m (4 road patterns) and the
// wheels turn a whole number of spoke steps, so the loop is seamless. The roll happens in slow motion: the road
// slows to a third of its speed from the impact to just before the landing.
//
// Run: node storyboards/road/make-car-crash.mjs -> storyboards/road/car-crash.json
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { roadDistance, rigRotation, wheelNeed, ROADSTER } from "../../engine/page/vehicle.js";

const c = clip(), { A, sfx, arm, cap } = c;
const END = 14.0;
const WIZ_CHAR = process.env.WIZ_CHAR || "lookdev/wizard-crisp", DRA_CHAR = process.env.DRA_CHAR || "lookdev/dragon-crisp";

// ---------------------------------------------------------------- the road and its speed (set-road.js)
// cruise, then slow motion from the impact to just before the touchdown, then cruise again. V is solved so the whole
// cycle covers DIST metres: 4 road patterns (PERIOD 24 m) and, with WHEEL, a whole number of fifths of a turn.
const DIST = 96, SLOW = 0.3, SPOKES = 5;
const speedKeys = (V) => [[0, V], [0.72, V], [0.98, V * SLOW], [6.3, V * SLOW], [6.95, V], [END, V]];
let V = 10;
for (let i = 0; i < 40; i++) V *= DIST / roadDistance({ speed: speedKeys(V) }, END);
V = r3(V * 1e3) / 1e3;
const WHEEL = DIST / ((2 * Math.PI / SPOKES) * Math.round(DIST / ((2 * Math.PI / SPOKES) * ROADSTER.rideY)));
const T_HIT = 0.7, HIT_Z = 1.42;   // the right-front tyre (x -0.95, z 1.25) meets the divider's bevel at 0.70 s
const set = {
  type: "road", seed: 5, speed: speedKeys(V).map(([t, v]) => [t, r3(v)]),
  divider: { x: -0.95, width: 0.5, height: 0.18, length: 3.2, bevel: 0.55, hit: [T_HIT, HIT_Z] },
  dust: [
    { at: 0.72, x: -1.05, z: 1.3, n: 12, size: 0.4, dur: 1.4 },          // the tyre scuffing up the bevel
    { at: 0.95, x: 0.95, z: 1.2, n: 10, size: 0.45, dur: 1.6 },          // the driver's side tyres as it kicks over
    { at: 0.95, x: 0.95, z: -1.2, n: 8, size: 0.4, dur: 1.5 },
    { at: 7.05, x: -0.95, z: 1.25, n: 10, size: 0.55, dur: 1.5 },        // the landing, all four tyres
    { at: 7.05, x: 0.95, z: 1.25, n: 10, size: 0.55, dur: 1.5 },
    { at: 7.05, x: -0.95, z: -1.2, n: 9, size: 0.5, dur: 1.5 },
    { at: 7.05, x: 0.95, z: -1.2, n: 9, size: 0.5, dur: 1.5 },
    { at: 7.4, x: 0.6, z: -1.3, n: 10, size: 0.45, dur: 1.4, opacity: 0.7 },   // the skid
  ],
};

// ---------------------------------------------------------------- the car's path (vehicle.js rig keys)
// roll: negative lifts the passenger side (the car's right, -x) first; one full turn, -360 at the touchdown
const herm = (K, t) => {   // [t, value, slope] keys, cubic Hermite
  if (t <= K[0][0]) return K[0][1];
  if (t >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0; while (K[i + 1][0] < t) i++;
  const [t0, v0, m0] = K[i], [t1, v1, m1] = K[i + 1], h = t1 - t0, u = (t - t0) / h;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * v0 + (u ** 3 - 2 * u ** 2 + u) * h * m0 + (-2 * u ** 3 + 3 * u ** 2) * v1 + (u ** 3 - u ** 2) * h * m1;
};
const ROLL = [[0, 0, 0], [T_HIT, 0, 0], [0.86, -6, -60], [1.25, -21, -40], [1.8, -42, -50], [4.3, -192, -63], [6.4, -321, -52], [7.05, -360, -28], [7.24, -362.6, 0], [7.55, -359.4, 0], [7.95, -360, 0], [END, -360, 0]];
const HEAVE = [[0, 0, 0], [0.84, 0, 0.3], [1.25, 0.33, 1.1], [1.8, 0.95, 1.05], [3.0, 1.75, 0.45], [4.2, 1.98, 0], [5.4, 1.62, -0.55], [6.4, 0.9, -1.0], [7.05, 0, -1.2], [7.17, -0.075, 0], [7.42, 0.025, 0], [7.68, -0.008, 0], [8.0, 0, 0], [END, 0, 0]];
const SIDE = [[0, 0, 0], [0.84, 0, 0], [1.8, 0.45, 0.4], [4.3, 0.85, 0], [6.4, 0.6, -0.2], [7.05, 0.45, -0.2], [8.6, 0.3, -0.15], [10.6, 0, 0], [END, 0, 0]];
const FWD = [[0, 0, 0], [7.05, 0, 0], [8.2, -0.45, -0.15], [9.4, -0.3, 0.2], [11.0, 0, 0], [END, 0, 0]];
const YAW = [[0, 0, 0], [0.9, 0, 0], [3.5, 5, 0], [6.6, 1, -1], [7.05, 0, 0], [7.4, 9, 0], [7.95, -5.5, 0], [8.55, 2.2, 0], [9.2, -0.6, 0], [9.8, 0, 0], [END, 0, 0]];
const PITCH = [[0, 0, 0], [T_HIT, 0, 0], [0.86, 3.5, 10], [1.3, 4, 0], [2.6, 0, -1], [6.5, -1.5, 0], [7.05, 0, 3], [7.16, -2.5, 0], [7.4, 1.0, 0], [7.75, 0, 0], [END, 0, 0]];
// Dragon counter-steers the skid (degrees at the steering wheel)
const STEER = [[0, 0, 0], [T_HIT, 0, 0], [0.9, -40, 0], [1.4, 25, 0], [2.4, 0, 0], [7.05, 0, 0], [7.35, -70, 0], [7.9, 55, 0], [8.5, -22, 0], [9.1, 6, 0], [9.8, 0, 0], [END, 0, 0]];
const PIVOT = [0, 0.55, 0];
// what must stay above the road (car frame): the body's corners and edges, the tyres (10 cm into their travel), the
// Wizard's hat tip and Dragon's sprout
const HULL = [];
for (const sx of [-1, 1]) {
  for (const z of [-1.75, -1.2, -0.4, 0.4, 1.25, 1.85]) HULL.push([sx * 1.08, 0.3, z], [sx * 1.08, 0.75, z], [sx * 0.8, 0.95, z]);
  for (const z of [ROADSTER.front, ROADSTER.rear]) HULL.push([sx * ROADSTER.track, 0.1, z]);
}
HULL.push([-0.47, 2.32, -0.42], [0.47, 1.78, -0.29], [-0.47, 1.85, -0.29]);
const clearance = (roll, pitch, yaw) => {
  const R = rigRotation({ roll, pitch, yaw });
  let need = -1e9;
  for (const p of HULL) { const q = [p[0] - PIVOT[0], p[1] - PIVOT[1], p[2] - PIVOT[2]]; need = Math.max(need, -(PIVOT[1] + R[1][0] * q[0] + R[1][1] * q[1] + R[1][2] * q[2])); }
  return need;
};
const smax = (a, b, k) => (k <= 0 ? Math.max(a, b) : (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2 - k / 2);
const kOf = (t) => 0.08 * Math.min(1, Math.max(0, (t - T_HIT) / 0.12)) * (1 - Math.min(1, Math.max(0, (t - 7.0) / 0.08)));
const carAt = (t) => {
  const roll = herm(ROLL, t), pitch = herm(PITCH, t), yaw = herm(YAW, t);
  const y = smax(herm(HEAVE, t), clearance(roll, pitch, yaw), kOf(t));
  return { at: r3(t), pos: [r3(herm(SIDE, t)), r3(y), r3(herm(FWD, t))], roll: r3(roll), pitch: r3(pitch), yaw: r3(yaw), steer: r3(herm(STEER, t)) };
};
const keys = [];
for (let f = 0; f <= END * 30; f++) keys.push(carAt(f / 30));
const rig = { id: "car", kind: "roadster", color: "#ec4b3c", pivot: PIVOT, wheel: r3(WHEEL * 1e4) / 1e4, keys };
// check: no tyre goes more than its travel into the road or the divider, at 120 checks a second
{
  let worst = { d: -1 };
  for (let i = 0; i <= END * 120; i++) { const t = i / 120, n = wheelNeed(rig, set, t); for (let w = 0; w < 4; w++) if (n[w] > worst.d) worst = { d: n[w], t, w }; }
  if (worst.d > ROADSTER.travel + 0.005) console.warn(`tyre ${worst.w} ${(worst.d - ROADSTER.travel).toFixed(3)} m into the ground at ${worst.t.toFixed(3)} s`);
  else console.log(`tyres: deepest need ${worst.d.toFixed(3)} m of ${ROADSTER.travel} travel (t ${worst.t.toFixed(2)})`);
}

// ---------------------------------------------------------------- places (car frame: x left of the car, z its front)
const SEAT_Y = 0.18, SEAT_Z = -0.32, WIZ_X = -0.47, DRA_X = 0.47;
const WIZ = [WIZ_X, SEAT_Z + 0.03], DRA = [DRA_X, SEAT_Z + 0.03];
const AT_PHONE = [0.05, -0.95];                 // the Wizard's eyes on his screen
const ROAD_AHEAD = [0, 0.02];                    // Dragon watching the road (toward the camera in the front view)
// the Wizard's right hand holds the phone in front of his chest; his left index scrolls it (character space)
const PH = { up: 0.37, fwd: 0.42 };
const PHONE_HAND = { x: [-0.07, PH.up, PH.fwd] };
const SCROLL_REST = { x: [0.05, PH.up + 0.08, PH.fwd - 0.09] }, SCROLL_LOW = { x: [0.03, PH.up + 0.05, PH.fwd - 0.05] }, SCROLL_HIGH = { x: [0.03, PH.up + 0.17, PH.fwd - 0.05] };
const WHEEL_L = { prop: "wheel", grip: "L" }, WHEEL_R = { prop: "wheel", grip: "R" };

const cast = [
  { id: "wiz", character: WIZ_CHAR, rig: "car", at: WIZ, face: "camera", expr: "kind", seed: 2.6, shadowFall: 0.001, belt: { side: "R" },
    arms: { R: PHONE_HAND, L: SCROLL_REST }, grip: { R: "hold", L: "point" } },
  { id: "dra", character: DRA_CHAR, rig: "car", at: DRA, face: "camera", expr: "kind", seed: 4.1, shadowFall: 0.001, belt: { side: "L" }, sway: 0.7,
    arms: { R: WHEEL_R, L: WHEEL_L }, grip: { R: "hold", L: "hold" } },
];
const props = [
  { id: "seatW", kind: "carseat", rig: "car", x: WIZ_X, y: SEAT_Y, z: SEAT_Z },
  { id: "seatD", kind: "carseat", rig: "car", x: DRA_X, y: SEAT_Y, z: SEAT_Z },
  { id: "wheel", kind: "steer", rig: "car", x: DRA_X, y: 0.98, z: 0.24, tip: 32 },
  { id: "phone", kind: "phone", rig: "car", x: WIZ_X, y: 1.0, z: 0.1, rot: 180, tip: -24, scale: 1.9, case: "#2b2d36" },
];

// ---------------------------------------------------------------- 0 setup at frame 0 (already driving, already scrolling)
for (const w of ["wiz", "dra"]) A(0, w, "sit", { seat: w === "wiz" ? "seatW" : "seatD", dur: 0.01, hands: "keep" });
A(0, "wiz", "grab", { prop: "phone", hand: "R", grip: [0.032, 0.03, 0], pose: null });
A(0, "wiz", "look", { to: AT_PHONE, dur: 0.01, blink: false });
A(0, "wiz", "face", { lid: 0.4, dur: 0.01 });
A(0, "wiz", "expr", { expr: "kind", set: { curve: 0.22 }, dur: 0.01 });
act.blinksAt(c, "wiz", [2.9, 9.1, 12.6]);
A(0, "dra", "look", { to: ROAD_AHEAD, dur: 0.01, blink: false });
act.blinksAt(c, "dra", [0.35, 12.9]);
// the steering wheel follows STEER (the hands are on its rim, so they turn with it)
for (let t = 0; t < END - 0.05; t += 0.1) c.prop(t, "wheel", { tilt: r3(herm(STEER, t + 0.1)) }, 0.1, "linear");

// the Wizard's scroll: the index lifts to the lower screen, swipes up, lifts away and comes back to rest
const swipe = (t) => {
  arm(t, "wiz", "L", SCROLL_LOW, 0.12, "inOut");
  arm(t + 0.12, "wiz", "L", SCROLL_HIGH, 0.14, "inOut");
  arm(t + 0.26, "wiz", "L", SCROLL_REST, 0.2, "inOut");
  A(t + 0.27, "wiz", "squash", { amount: 0.008, dur: 0.2 });
};
for (const t of [0.15, 2.2, 3.7, 5.15, 7.9, 9.7, 11.6]) swipe(t);

// ---------------------------------------------------------------- 1 NORMAL 0-0.7 (21 frames): calm driving
cap(0, 2.0, "Just one more video.", 250);

// ---------------------------------------------------------------- 2 IMPACT 0.7-1.8: the tyre hits the divider
sfx(T_HIT, "thump", { gain: 0.9, reason: "the tyre hits the divider's bevel" });
A(0.74, "dra", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.3 }, dur: 0.12 });
A(0.74, "dra", "face", { brow: 0.6, dur: 0.12 });
A(0.76, "dra", "squash", { amount: 0.06, dur: 0.22 });
A(0.8, "wiz", "hatwobble", { amount: 7, freq: 2.6, dur: 0.9 });

// ---------------------------------------------------------------- 3 THE ROLL 1.8-4.5 (slow motion)
// the Wizard's hat tip hangs toward the ground as the car turns over (gravity in the car's frame)
for (let t = 1.0; t < 7.6; t += 0.2) {
  const th = (herm(ROLL, t + 0.2) * Math.PI) / 180;
  A(t, "wiz", "hatsway", { tip: [r3(-4 * (1 - Math.cos(th))), r3(16 * -Math.sin(th))], brim: r3(-0.15 * (1 - Math.cos(th))), dur: 0.2, ease: "linear" });
}
A(7.6, "wiz", "hatsway", { tip: [0, 0], brim: 0, dur: 0.5, ease: "settle" });
A(1.2, "dra", "expr", { expr: "shocked", set: { open: 0.75, eye: 1.4 }, dur: 0.3 });
A(1.9, "dra", "look", { to: [0.25, 0.05], dur: 0.25, blink: false });
A(3.4, "dra", "look", { to: ROAD_AHEAD, dur: 0.3, blink: false });
A(2.0, "dra", "still", { dur: 4.8, idle: 0.2 });

// ---------------------------------------------------------------- 4 STILL SCROLLING 4.5-6.0 (camera on the cabin)
A(4.5, "wiz", "still", { dur: 1.5, idle: 0.1 });

// ---------------------------------------------------------------- 5 LANDING 6.0-8.5
sfx(7.05, "thump", { gain: 1.0, reason: "all four tyres land" });
A(7.06, "dra", "squash", { amount: 0.08, dur: 0.25 });
A(7.06, "wiz", "squash", { amount: 0.05, dur: 0.25 });
A(7.08, "wiz", "hatwobble", { amount: 9, freq: 2.8, dur: 1.0 });
A(7.1, "dra", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.25, curve: -0.2 }, dur: 0.2 });

// ---------------------------------------------------------------- 6 EVERYTHING IS FINE 8.5-11.5: Dragon breathes out
A(8.7, "dra", "face", { lid: 0.85, brow: -0.2, dur: 0.35 });
A(8.7, "dra", "expr", { expr: "kind", set: { open: 0.22, round: 0.8, curve: 0.0, eye: 1.0 }, dur: 0.35 });
A(8.75, "dra", "squash", { amount: 0.05, dur: 0.7 });
sfx(8.75, "sigh", { gain: 0.6, reason: "Dragon's relieved breath" });
A(9.6, "dra", "face", { lid: 0, brow: 0, dur: 0.35 });
A(9.6, "dra", "expr", { expr: "kind", dur: 0.5 });
A(9.65, "dra", "look", { to: ROAD_AHEAD, dur: 0.3, blink: false });

// ---------------------------------------------------------------- 7 RETURN 11.5-14: the opening frame again
// faces and eyes ease back to frame 0 (places never moved: they ride in the car)
A(11.5, "dra", "expr", { expr: "kind", dur: 0.5 });
A(11.5, "dra", "face", { lid: 0, brow: 0, dur: 0.4 });
A(11.5, "wiz", "face", { lid: 0.4, dur: 0.3 });

// ---------------------------------------------------------------- shots (world frame; the car stays near the origin)
const FRONT = { pos: [0, 1.62, 5.1], look: [0, 1.02, -0.25], fov: 42 };
const beats = c.beats([
  ["normal", 0, FRONT, "hook"],
  ["impact", T_HIT, { pos: [-2.7, 0.32, 3.5], look: [-0.95, 0.42, 1.3], fov: 36, to: { pos: [-3.8, 0.9, 4.6], look: [-0.35, 1.05, 0.7], fov: 40 }, dur: 1.1, ease: "inOut" }],
  ["the roll", 1.8, { pos: [-7.4, 1.6, 6.4], look: [0.3, 1.25, 0.3], fov: 40, to: { pos: [-8.0, 2.5, 6.2], look: [0.6, 2.1, 0.3] }, dur: 2.7, ease: "inOut" }, "escalation"],
  ["still scrolling", 4.5, { rig: "car", pos: [-0.36, 1.32, 0.46], look: [-0.38, 1.12, -0.3], fov: 50 }, "payoff"],
  ["landing", 6.0, { pos: [-6.8, 2.3, 6.4], look: [0.6, 1.7, 0.2], fov: 40, to: { pos: [-6.4, 1.35, 6.8], look: [0.4, 0.75, 0.3] }, dur: 1.3, ease: "inOut" }],
  ["everything is fine", 8.5, { pos: [-2.7, 1.6, 4.6], look: [0.05, 1.02, -0.25], fov: 40, to: { pos: [-2.45, 1.58, 4.3] }, dur: 3.0, ease: "inOut" }, "reaction"],
  ["return", 11.5, FRONT],
], END);

write(import.meta.url, {
  id: "car-crash",
  title: "Still Scrolling — Car Crash",
  idea: "Story library 07: Dragon drives, the belted Wizard never stops scrolling through one cartoon barrel roll (designed loop)",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  set, rigs: [rig],
  music: false,
  sound: { sfx: 0.7, ambience: 0.4 },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "wiz", with: "seatW", from: 0, to: END, reason: "the Wizard sits in his seat" },
    { who: "dra", with: "seatD", from: 0, to: END, reason: "Dragon sits in his seat" },
  ],
  notes: "Generated by storyboards/road/make-car-crash.mjs.",
});
