// NEVER LOOKS UP, episode 6: CAR CRASH (7 Nov 2026). "The friend who never looks up from his phone… even when the car
// flips". The redo of Still Scrolling 07 "Car Crash" (storyboards/road/make-car-crash.mjs, 28 Oct, the Wizard
// scrolling) in the series format (video-scripts/2026-11-04-never-looks-up/00-SERIES-FORMAT.md) on today's engine:
// Phoenix is the scroller, a painted golden-hour country road (env golden-country-road) instead of the treadmill
// road, the sheet cast, real physics for everything that flies out of the car, and the series' fixed ending.
//
// THE BRIEF
//   Joke:        Dragon drives the open roadster down a country road at sunset; a rock in the lane, a swerve, a slide
//                into the kerb, and the car flips over twice in slow motion while snacks float out of it. Phoenix,
//                belted in beside him, never stops scrolling.
//   Wants:       Dragon wants to keep the car on the road (then just to survive); Phoenix wants the next video.
//   Consequence: hanging upside down with the road a hand's width over his head, Phoenix looks up: "huh." Back down.
//   Ending:      the series ending: the ping, the tiny smile; time snaps back, the car rolls onto its wheels on the verge,
//                the snacks rain down round it, Dragon glares at him. Hard cut at 10.0.
//   Callback:    0 s Dragon sees trouble and Phoenix sees his phone; 10 s the trouble is over and it is still the same.
//
// Time: the clip is written in story time u (what really happens) and plays at clip time t. The car trips at 1.45
// (a 3-frame hit-stop there, so every later video time is t + 0.1), time eases into slow motion (S) through the
// roll, freezes for the look-up (t 7.9-9.1 = video 8.0-9.2, the series' held breath), then snaps back to normal.
// The physics follows the same clock: in slow motion gravity is g * S^2 and the loose snacks get speeds * S; in the
// freeze they hang (zero-g, stopped), and when time comes back they get their real speed again (their slow speed / S).
//
// World: x right, z toward the camera. The painting's camera stands at (0, 4.5, 20) looking down the road (-z); every
// shot looks into the painting (assets/environments/golden-country-road, qa/env.mjs). The road runs along z, its
// centre line near x -0.2; the car drives toward us in the right lane (x -1.9); a low stone kerb lines the left edge.
//
//   node storyboards/series/never-looks-up/make-ep6-car-crash.mjs -> never-looks-up-car-crash.json
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { rigRotation, rigToWorld, rigState, ROADSTER } from "../../../engine/page/vehicle.js";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, prop } = c;
// Jonny 7 Nov 11:14: "after the uh-oh there should be immediately the cut to the next scene and the car should spin all
// the time": the freeze (and the whole series ending after it) comes SH seconds earlier than the series format's 8.0 s,
// straight after the uh-oh, so the clip is 8.3 s instead of 10.0 s (a departure from 00-SERIES-FORMAT.md, his call)
const SH = 1.7;
// Jonny 7 Nov 11:33: "the car should drive/slinger to the road in the ending scene so the situation resolves": EXT more
// seconds after the landing, the car fishtails off the verge, bumps back over the kerb and drives on down the road
const EXT = 1.6;
const END = r3(9.9 - SH + EXT);  // on the generator's own clock (before the faster drift, see nt below)
const HS = 0.1;           // video = story + HS after the trip
const v2t = (v) => r3(v - HS);   // a series video time (after the trip) as clip time
const e2t = (v) => v2t(v - SH);  // a series ENDING time (look-up, back down) as clip time, pulled forward by SH
// THE FASTER DRIFT (Jonny 7 Nov 11:33: "the first drifting after dodging the rock could be 2x faster, this would make
// the situation look more dramatic"): everything below is written on the generator's own clock, where the slide from
// the rock into the kerb runs D0-D1; the storyboard gets the clip's clock, where that slide runs DK times faster and
// everything after it comes (D1 - D0)(1 - 1/DK) s earlier. nt: own clock -> clip; ot: clip -> own clock. Applied on the
// way out (the car's keys, the wheel speed, every action, caption, shot and sound), so the story is untouched.
const D0 = 0.45, D1 = 1.45, DK = 2, DS = (D1 - D0) * (1 - 1 / DK);
const nt = (t) => (t <= D0 ? t : t <= D1 ? r3(D0 + (t - D0) / DK) : r3(t - DS));
const ot = (n) => (n <= D0 ? n : n <= D0 + (D1 - D0) / DK ? D0 + (n - D0) * DK : n + DS);
const dot = (n) => (n > D0 && n <= D0 + (D1 - D0) / DK ? DK : 1);
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (x) => x * x * (3 - 2 * x);

// ---------------------------------------------------------------- the clock: clip time t -> story time u
const S = 0.2;                                 // slow motion: a fifth of real speed
const TRIP = 1.45, SLOW_IN = [1.6, 2.1], FREEZE = [r3(7.9 - SH), r3(9.1 - SH)], EASE_F = 0.08;
const rate = (t) => {                          // story seconds per clip second
  if (t < SLOW_IN[0]) return 1;
  if (t < SLOW_IN[1]) return 1 + (S - 1) * sm(lin(t, ...SLOW_IN));
  if (t < FREEZE[0] - EASE_F) return S;
  if (t < FREEZE[0]) return S * (1 - sm(lin(t, FREEZE[0] - EASE_F, FREEZE[0])));
  if (t < FREEZE[1]) return 0;
  if (t < FREEZE[1] + 0.06) return sm(lin(t, FREEZE[1], FREEZE[1] + 0.06));
  return 1;
};
const DT = 1 / 600, UT = [0];
for (let i = 1; i <= Math.ceil((END + 0.5) / DT); i++) UT.push(UT[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT);
const U = (t) => { const k = Math.min(UT.length - 2, Math.max(0, Math.floor(t / DT))), f = t / DT - k; return UT[k] + (UT[k + 1] - UT[k]) * f; };
const Tof = (u) => { let lo = 0, hi = UT.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (UT[m] < u) lo = m; else hi = m; } return r3(hi * DT); };   // the first clip time story u is reached
const UF = U(FREEZE[0]);                       // the frozen moment in story time

// ---------------------------------------------------------------- the car's path in story time (cubic Hermite keys [u, v, slope])
const herm = (K, u) => {
  if (u <= K[0][0]) return K[0][1];
  if (u >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0; while (K[i + 1][0] < u) i++;
  const [t0, v0, m0] = K[i], [t1, v1, m1] = K[i + 1], h = t1 - t0, s = (u - t0) / h;
  return (2 * s ** 3 - 3 * s ** 2 + 1) * v0 + (s ** 3 - 2 * s ** 2 + s) * h * m0 + (-2 * s ** 3 + 3 * s ** 2) * v1 + (s ** 3 - s ** 2) * h * m1;
};
const LANE = -1.9, KERB_X = Number(process.env.KERB_X ?? 3.25), ROCK = { x: -2.2, z: -11.9, w: 0.95, h: 0.55, d: 0.8 };
const Z0 = Number(process.env.Z0 ?? -16.5);
const LIFT = 1.62, LAND = r3(UF + 0.4);        // the wheels leave the kerb; all four touch down again (story time)
// forward speed (m/s): cruising, scrubbed by the slide, carried through the air, then a skid to a stop on the verge
const SPEED = [[0, 6.5, 0], [0.45, 6.4, 0], [TRIP, 5.0, -1], [LIFT, 4.2, -2], [2.2, 3.4, 0], [LAND, 3.2, 0], [LAND + 0.4, 3.0, 0], [LAND + 1.0, 4.5, 3.5], [LAND + 1.8, 6.2, 1.0], [9, 6.5, 0]];
const ZT = [[0, Z0]]; for (let u = 0, z = Z0; u < 9; u += 0.002) { z += 0.002 * herm(SPEED, u + 0.001); ZT.push([r3(u + 0.002), z]); }
const zAt = (u) => { const k = Math.min(ZT.length - 1, Math.max(0, Math.round(u / 0.002))); return ZT[k][1]; };
// sideways (+x left): round the rock to the left, the back steps out, the slide across the road into the kerb, over it
const SIDE = [[0, LANE, 0], [0.06, LANE, 0], [0.42, -0.55, 3.6], [0.7, 0.15, 2.0], [TRIP, 1.72, 2.6], [LIFT, 2.12, 2.2], [2.2, 3.0, 1.0], [UF, 3.75, 0.45], [LAND, 4.05, 0.3], [LAND + 0.3, 3.9, -1.5], [LAND + 0.8, 2.4, -3.2], [LAND + 1.3, 0.6, -3.0], [LAND + 1.8, -0.8, -1.6], [LAND + 2.3, -1.4, -0.4], [LAND + 2.8, -1.5, 0], [9, -1.5, 0]];
// yaw (+ nose to the left, +x): the swerve, the back stepping out, the over-correction that slides it broadside left
// (its left tyres meet the kerb first); it unwinds in the air; a twitch on the landing
const YAW = [[0, 0, 0], [0.06, 0, 0], [0.26, 17, 40], [0.5, 6, -70], [0.8, -22, -40], [TRIP, -34, -5], [LIFT, -24, 60], [1.9, -6, 30], [2.05, 0, 0], [UF, 0, 0], [LAND, 0, 0], [LAND + 0.25, -14, -80], [LAND + 0.6, -38, -20], [LAND + 1.0, -18, 30], [LAND + 1.35, -30, -10], [LAND + 1.8, -8, 40], [LAND + 2.2, 6, 0], [LAND + 2.6, 0, 0], [9, 0, 0]];
const PITCH = [[0, 0, 0], [0.06, 0, 0], [0.2, 1.4, 0], [0.5, 0.5, 0], [TRIP, 0, 0], [LIFT, 4, 0], [2.4, 2, 0], [UF, -2, 0], [LAND, 0, 3], [LAND + 0.12, -2.5, 0], [LAND + 0.35, 1, 0], [LAND + 0.6, 0, 0], [LAND + 0.72, 0, 0], [LAND + 0.8, -2.5, 0], [LAND + 0.9, 1.5, 0], [LAND + 1.05, 0, 0], [9, 0, 0]];
// roll (- tips the car over its left side, +x, the side it slides toward): ONE turn (Jonny 7 Nov: "2 spins now instead
// of one"). On its side for the setup ping (t 2.6), slowly on through the slow motion, then from video 5 s 2.5x faster
// over onto its roof (Jonny 7 Nov: "the spin from second 5 on could be at least 2.5x as fast"), upside down from
// about 6.3 s while it falls toward the road for the peak and the freeze, then the last half turn onto its wheels when
// time comes back
const R_PING = U(2.6), R_UP1 = U(3.9), R_5 = U(4.9);
const ROLL = [[0, 0, 0], [TRIP, 0, 0], [TRIP + 0.08, -4, -80], [LIFT, -22, -180], [1.9, -60, -200], [R_PING, -82, -130], [R_UP1, -106, -100], [R_5, -124, -200], [UF, -184, -240], [UF + 0.18, -262, -480], [LAND, -360, -250], [LAND + 0.1, -362.5, 0], [LAND + 0.3, -359.2, 0], [LAND + 0.55, -360, 0], [LAND + 0.74, -360, 0], [LAND + 0.82, -356.5, 0], [LAND + 0.95, -361, 0], [LAND + 1.1, -360, 0], [9, -360, 0]];
// how high the car's lowest point is over the ground (m): the hull's own clearance is added, so it tips over its
// kerb-side tyres, flies, and when it comes down rolls over its edge onto its wheels. At the freeze the heads are
// 0.25 m over the road (the peak: the road a hand's width over Phoenix's crest)
const GAP = [[0, 0, 0], [TRIP + 0.05, 0, 0], [LIFT, 0.06, 0.8], [1.9, 0.42, 1.6], [R_PING, 0.62, 1.4], [U(4.4), 1.15, 0], [U(5.4), 0.85, -2.2], [UF, 0.25, -2.0], [UF + 0.2, 0.05, -0.4], [LAND, 0, 0], [LAND + 0.12, -0.07, 0], [LAND + 0.32, 0.02, 0], [LAND + 0.55, -0.006, 0], [LAND + 0.74, 0, 0], [LAND + 0.82, 0.06, 0], [LAND + 0.95, 0, 0], [9, 0, 0]];
const STEER = [[0, 0, 0], [0.04, 0, 0], [0.16, 80, 0], [0.32, 45, 0], [0.5, -85, 0], [0.8, -60, 0], [TRIP, -30, 0], [1.8, 35, 0], [2.4, 0, 0], [LAND, 0, 0], [LAND + 0.15, -80, 0], [LAND + 0.5, 40, 0], [LAND + 0.85, -50, 0], [LAND + 1.2, 45, 0], [LAND + 1.6, -25, 0], [LAND + 2.0, 15, 0], [LAND + 2.4, 0, 0], [9, 0, 0]];
const PIVOT = [0, 0.55, 0];
// what must stay above the ground (car frame): the body's corners and edges, the tyres (10 cm into their travel), the
// two heads (Phoenix's crest, Dragon's horns)
const SEAT_Y = 0.18, SEAT_Z = -0.32, PHX_X = -0.47, DRA_X = 0.47;
const HULL = [];
for (const sx of [-1, 1]) {
  for (const z of [-1.75, -1.2, -0.4, 0.4, 1.25, 1.85]) HULL.push([sx * 1.08, 0.3, z], [sx * 1.08, 0.75, z], [sx * 0.8, 0.95, z]);
  for (const z of [ROADSTER.front, ROADSTER.rear]) HULL.push([sx * ROADSTER.track, 0.1, z]);
}
HULL.push([PHX_X, 1.88, SEAT_Z + 0.03], [DRA_X, 1.85, SEAT_Z + 0.03], [0, 1.25, 0.35]);   // crest, horns, the windscreen top
const lowest = (roll, pitch, yaw) => {
  const R = rigRotation({ roll, pitch, yaw });
  let lo = 1e9;
  for (const p of HULL) { const q = [p[0] - PIVOT[0], p[1] - PIVOT[1], p[2] - PIVOT[2]]; lo = Math.min(lo, PIVOT[1] + R[1][0] * q[0] + R[1][1] * q[1] + R[1][2] * q[2]); }
  return lo;   // the lowest hull point's height for a pivot at PIVOT's own height
};
const carAt = (t) => {
  const u = U(t), roll = herm(ROLL, u), pitch = herm(PITCH, u), yaw = herm(YAW, u);
  const y = herm(GAP, u) - (lowest(roll, pitch, yaw) - PIVOT[1]) - PIVOT[1];   // pos y: the pivot's lift over its rest height
  return { at: r3(t), pos: [r3(herm(SIDE, u)), r3(y), r3(zAt(u))], roll: r3(roll), pitch: r3(pitch), yaw: r3(yaw), steer: r3(herm(STEER, u)) };
};
const keys = []; for (let f = 0; f <= Math.round(END * 30); f++) keys.push(carAt(f / 30));
const rig = { id: "car", kind: "roadster", color: "#ec4b3c", pivot: PIVOT, keys };   // on the generator's clock (W, look)
const ENDN = nt(END);   // the clip's end on its own clock
const rigOut = { ...rig, keys: Array.from({ length: Math.round(ENDN * 30) + 1 }, (_, f) => ({ ...carAt(ot(f / 30)), at: r3(f / 30) })) };
// the wheels turn with the distance driven (vehicle.js reads the set's speed: the env itself ignores it)
const speedKeys = []; for (let f = 0; f <= Math.round(ENDN * 30); f++) { const n = f / 30, t = ot(n), u = U(t); speedKeys.push([r3(n), r3(herm(SPEED, u) * rate(t) * dot(n))]); }
// a world point of the car at clip time t (car frame q)
const W = (t, q) => rigToWorld(rig, t, q).map(r3);

// checks: the rock clears the body; the left tyres reach the kerb at the trip
{
  let near = { d: 9 };
  for (let f = 0; f <= TRIP * 120; f++) {
    const t = f / 120;
    for (let x = -1.08; x <= 1.08; x += 0.12) for (let z = -1.86; z <= 1.98; z += 0.12) {
      if (Math.abs(x) < 1.0 && Math.abs(z) < 1.8) continue;
      const w = W(t, [x, 0.3, z]), d = Math.max(Math.abs(w[0] - ROCK.x) - ROCK.w / 2, Math.abs(w[2] - ROCK.z) - ROCK.d / 2);
      if (d < near.d) near = { d, t };
    }
  }
  const tyres = [[ROADSTER.track, ROADSTER.front], [ROADSTER.track, ROADSTER.rear]].map(([x, z]) => W(TRIP, [x + 0.13, 0.1, z])[0]);
  console.log(`rock: body ${near.d.toFixed(2)} m from it at ${near.t.toFixed(2)} s; left tyres at the trip x ${tyres.map((x) => x.toFixed(2))} (kerb ${KERB_X}); car z ${zAt(0).toFixed(1)} -> trip ${zAt(TRIP).toFixed(1)} -> land ${zAt(LAND).toFixed(1)} (t ${Tof(LAND)})`);
  const fr = carAt(FREEZE[0]); const R = rigRotation(fr); console.log(`freeze: roll ${fr.roll}, crest ${(W(FREEZE[0], [PHX_X, 1.88, SEAT_Z])[1]).toFixed(2)} m over the road, pivot ${fr.pos}`);
}

// ---------------------------------------------------------------- the cast in the car (car frame: x its left, z its front)
const AT_PHONE = [0.03, -1];
const PH_Y = 0.33, PH_Z = 0.45;   // a little higher than on a bench: over the dash, where a front camera sees it
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const WHEEL_L = { prop: "wheel", grip: "L" }, WHEEL_R = { prop: "wheel", grip: "R" };
const ROAD_AHEAD = [0, 0.02], AT_ROCK = [-0.3, -0.15], AT_PHX = [-0.6, -0.08];
const cast = [
  { id: "phx", character: "duo/phoenix", rig: "car", at: [PHX_X, SEAT_Z + 0.03], face: "camera", expr: "kind", seed: 1.7, span: 0, shadowFall: 0.001, follow: 0.3,
    belt: { side: "R" }, arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "dra", character: "potatobrawl/dragon", rig: "car", at: [DRA_X, SEAT_Z + 0.03], face: "camera", expr: "kind", seed: 4.1, shadowFall: 0.001, follow: 0.4, sway: 0.7,
    belt: { side: "L" }, arms: { R: WHEEL_R, L: WHEEL_L }, grip: { R: "hold", L: "hold" } },
];

// ---------------------------------------------------------------- the loose things in the car: they ride in it (world props keyed to the car
// every frame) until they float out in the roll, then they are physics bodies. [id, kind, car-frame spot, spec, let
// go at (clip t), its kick away from the car (car frame, m/s of real time)]
const LOOSE = [
  ["apple", "apple", [0.0, 1.0, -1.35], { scale: 2.1 }, 2.75, [0.0, 3.0, -0.8]],
  ["juice", "juicebox", [0.3, 0.98, -1.12], { scale: 2.0 }, 3.0, [0.6, 2.2, 1.2]],
  ["cookie", "cookie", [-0.6, 0.98, -1.15], { scale: 2.1 }, 3.15, [-0.6, 2.2, -0.4]],
  ["candyA", "candy", [0.55, 0.98, -1.2], { color: "#e8b53a", big: 2.8 }, 3.3, [0.7, 2.3, -0.5]],
  ["candyB", "candy", [0.0, 0.98, -1.3], { color: "#e0475b", big: 2.8 }, 3.45, [0.2, 2.5, -0.8]],
];
const props = [
  { id: "seatP", kind: "carseat", rig: "car", x: PHX_X, y: SEAT_Y, z: SEAT_Z },
  { id: "seatD", kind: "carseat", rig: "car", x: DRA_X, y: SEAT_Y, z: SEAT_Z },
  { id: "wheel", kind: "steer", rig: "car", x: DRA_X, y: 0.9, z: 0.25, tip: 34 },
  // the phone: dark, in both his gloves, a bright screen that lights his face (Jonny 5 Nov); we never see the screen
  { id: "phone", kind: "phone", rig: "car", x: PHX_X, y: 1.05, z: SEAT_Z + 0.45, rot: 180, tip: -14, scale: 1.9, case: "#2a2d36", bright: 2.4, halo: 0.45, haloK: 0.45 },   // held high, over the windscreen rail, so the glow reads from the front (review A)
  { id: "rock", kind: "boulder", ...ROCK, seed: 5 },
  { id: "kerb", kind: "kerb", x: KERB_X, z: 0, rot: -90, x0: -40, x1: 13, h: 0.14, d: 0.3, gutter: false, seed: 4 },
  ...LOOSE.map(([id, kind, q, o]) => { const w = W(0, q); return { id, kind, x: w[0], y: w[1], z: w[2], ...o }; }),
];

// the loose things ride along: their world pose every frame from the car's (the car's yaw, pitch and roll are the
// prop's rot, tip and roll: both are Euler YXZ)
for (const [id, , q, , tGo] of LOOSE) {
  for (let f = 1; f <= Math.round(tGo * 30); f++) {
    const t = f / 30, w = W(t, q), s = rigState(rig, t);
    prop(r3(t - 1 / 30), id, { x: w[0], y: w[1], z: w[2], rot: r3(s.yaw), tip: r3(s.pitch), roll: r3(s.roll) }, r3(1 / 30), "linear");
  }
}
// slow motion for the physics: what floats out of the turning car drifts as in zero-g (the car and everything in it
// are falling together; in slow motion it hangs), stops dead in the freeze, and drops at full gravity when time comes back
c.float(SLOW_IN[0], 0, { dur: SLOW_IN[1] - SLOW_IN[0], damp: 0.25 });
for (const [id, , q, , tGo, kick] of LOOSE) {
  // the speed it leaves with (clip time): the car's own at that spot, plus the kick (real m/s, so times S), turned
  // from the car's frame into the world
  const a = W(tGo - 1 / 60, q), b = W(tGo + 1 / 60, q), vCar = [0, 1, 2].map((i) => (b[i] - a[i]) * 30);
  const s = rigState(rig, tGo), R = rigRotation(s), k = [0, 1, 2].map((i) => S * (R[i][0] * kick[0] + R[i][1] * kick[1] + R[i][2] * kick[2]));
  const v = vCar.map((x, i) => r3(x + k[i]));
  c.knock(tGo, id, { v, spin: [r3(S * 4), r3(S * 2.5), r3(S * -3)] });
  c.knock(FREEZE[0] - EASE_F, id, { v: [0, 0, 0], spin: [0, 0, 0] });
  console.log(`  ${id}: out at ${tGo} with v ${v}`);
}
c.float(FREEZE[1], -9.81, { dur: 0.06 });

// ---------------------------------------------------------------- Phoenix: on the phone from frame 0, the whole way
for (const w of ["phx", "dra"]) A(0, w, "sit", { seat: w === "phx" ? "seatP" : "seatD", dur: 0, hands: "keep" });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });   // held in the car's frame (engine/page/attach.js rig holds): it turns with the car, never inside his gloves
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.55, dur: 0 });
prop(0, "phone", { glow: 1 }, 0.01);
act.blinksAt(c, "phx", [1.1, 5.3]);
act.scrollPhone(c, "phx", [0.3, 1.2, 2.1, 3.1, 4.05, 4.25, 5.6]);
// the setup ping (video 2.7): the car on its side, his tiny smile at the phone
sfx(v2t(2.7), "notify", { gain: 0.32 });
A(v2t(2.75), "phx", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.2 });
A(v2t(2.75), "phx", "face", { lid: 0.6, dur: 0.2 });
A(v2t(3.25), "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.25 });
A(v2t(3.25), "phx", "face", { lid: 0.55, dur: 0.25 });
// upside down: the swipe (Still Scrolling's slow-motion swipe, the original's favourite beat)
c.textPop(4.1, "phx", "swipe", { dur: 0.9 });
sfx(4.1, "kenney/scroll", { gain: 0.7, reason: "the swipe upside down" });

// ---------------------------------------------------------------- Dragon: sees the rock at frame 0
A(0, "dra", "look", { to: AT_ROCK, dur: 0, blink: false });
A(0, "dra", "expr", { expr: "shocked", set: { open: 0.45, eye: 1.3 }, dur: 0.01 });
A(0, "dra", "face", { brow: 0.6, dur: 0.01 });
act.opener(c, "dra", "rock!", { at: 0.03, dur: 0.4 });
act.blinksAt(c, "dra", [1.05]);
A(0.2, "dra", "squash", { amount: 0.05, dur: 0.2 });
A(0.45, "dra", "look", { to: ROAD_AHEAD, dur: 0.12, blink: false });
// the wheel follows STEER (his gloves are on its rim and turn with it)
for (let t = 0; t < END - 0.05; t += 0.1) prop(r3(t), "wheel", { tilt: r3(0.6 * herm(STEER, U(t + 0.1))) }, 0.1, "linear");
// the trip: the kerb catches the tyres
A(TRIP, "dra", "expr", { expr: "shocked", set: { open: 0.65, eye: 1.4 }, dur: 0.08 });
A(TRIP, "dra", "squash", { amount: 0.07, dur: 0.22 });
c.hitStop(TRIP, 3);
// the roll in slow motion: he screams (a slowed-down "aaah"), lets go of the wheel with his outer glove and
// points at the world going round, then grabs the wheel again
c.say(2.05, "dra", "aaaaaah", 1.5, "excited", { sub: false, gain: 0.9 });
c.cap(2.05, 3.28, "AAAAAH!", 330);   // over their heads, in the sky: the faces and gloves fill the rig shot; off before the cut to the wide
A(2.1, "dra", "expr", { expr: "shocked", set: { open: 0.9, eye: 1.45 }, dur: 0.3 });
A(3.3, "dra", "look", { to: AT_PHX, dur: 0.2, blink: false });
c.arm(3.35, "dra", "L", { o: [0.36, 0.98, 0.16] }, 0.35, "out");          // off the rim, up and out past his head, pointing at the road going round them
c.say(3.55, "dra", "look look look!", 0.8, "excited", { sub: false });
c.cap(3.55, 4.58, "LOOK!! LOOK!!", 1180);   // off before the cut to the close-up, where his gloves fill the lower frame
A(4.57, "dra", "look", { to: [0.1, -0.4], dur: 0.12, blink: false });   // eyes first: back to the wheel
c.arm(4.7, "dra", "L", WHEEL_L, 0.35, "inOut");
A(5.0, "dra", "look", { to: ROAD_AHEAD, dur: 0.2, blink: false });
// going over onto the roof, the road coming up at them: uh-oh
A(5.55, "dra", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.3, curve: -0.45 }, dur: 0.2 });
c.textPop(5.65, "dra", "uh-oh", { dur: 0.5, dx: 0.8, dy: -0.9 });   // the cut to the look-up comes right after it (Jonny)
// the road right over their heads: he squeezes his eyes shut and braces as the uh-oh goes, frozen like that
A(5.9, "dra", "face", { lid: 0.92, brow: 0.7, dur: 0.18 });
A(5.9, "dra", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.0, curve: -0.5 }, dur: 0.18 });
A(5.92, "dra", "squash", { amount: 0.05, dur: 0.25 });
A(FREEZE[0] - 0.3, "dra", "still", { dur: FREEZE[1] - FREEZE[0] + 0.3, idle: 0 });

// ---------------------------------------------------------------- LOOK-UP (video 8.0-9.0): the series ending, frozen upside down
const LU = e2t(8.0);
A(e2t(8.05), "phx", "look", { to: [0.35, 0.7], dur: 0.12, blink: false });   // up: in the car's frame that is at the road
A(e2t(8.05), "phx", "face", { lid: 0.15, dur: 0.12 });
A(e2t(8.05), "phx", "pitch", { to: -8, dur: 0.15 });
A(e2t(8.35), "phx", "blink", { dur: 0.22 });
c.say(e2t(8.5), "phx", "huh.", 0.35, "calm", { sub: false, voice: true });
c.cap(e2t(8.5), e2t(9.0), "huh.", 330);   // over his crest, on the road overhead: his face and gloves fill the lower frame
see(e2t(8.1), e2t(8.95), ["phx.face", "phone"], "P7: Phoenix, upside down with the road a hand over his head, looks up: huh.");
// BACK DOWN (video 9.0-10.0)
A(e2t(9.0), "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(e2t(9.0), "phx", "face", { lid: 0.55, dur: 0.15 });
A(e2t(9.0), "phx", "pitch", { to: 0, dur: 0.15 });
sfx(e2t(9.15), "notify", { gain: 0.36 });
A(e2t(9.2), "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
act.scrollPhone(c, "phx", [e2t(9.4), r3(Tof(LAND) + 0.9), r3(Tof(LAND) + 1.6)]);

// ---------------------------------------------------------------- sound: the road, the tyres, the trip, the flight, the landing
const TL = Tof(LAND);
sfx(0.02, "screech", { dur: 0.5, gain: 0.6, reason: "the tyres squeal as Dragon yanks the wheel round the rock" });
sfx(0.5, "screech", { dur: 0.85, gain: 0.85, reason: "the back steps out and the car slides across the road" });
sfx(TRIP, "thud", { gain: 0.9, reason: "the sliding tyres slam into the kerb" });
sfx(TRIP + 0.02, "kenney/impact-metal-light", { gain: 0.75, reason: "a rim knocks on the kerbstone" });
sfx(1.75, "whoosh", { dur: 0.7, gain: 0.55, reason: "the car lifts into the roll" });
sfx(FREEZE[1] + 0.05, "whoosh", { dur: 0.35, gain: 0.5, reason: "time snaps back and the car whips round onto its wheels" });
sfx(TL, "thud", { gain: 1.0, reason: "all four tyres land" });
sfx(TL, "kenney/impact-metal-heavy", { gain: 0.5, reason: "the body slams down on its springs" });
sfx(TL + 0.1, "creak", { dur: 0.3, gain: 0.55, reason: "the springs compress and rebound" });
c.at(TL, { fx: "shake", dur: 0.18, amp: 0.045 });
A(TL + 0.01, "dra", "squash", { amount: 0.08, dur: 0.22 });
A(TL + 0.01, "phx", "squash", { amount: 0.05, dur: 0.22 });
// the fishtail back onto the road (Jonny 11:33): Dragon fights the wheel, eyes on the road; straight in the lane at
// last, he turns and glares at Phoenix to the cut
A(TL + 0.1, "dra", "face", { lid: 0.35, brow: 0.6, dur: 0.15 });
A(TL + 0.1, "dra", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2, curve: -0.4 }, dur: 0.15 });
A(TL + 0.1, "dra", "look", { to: ROAD_AHEAD, dur: 0.12, blink: false });
A(r3(END - 0.6), "dra", "face", { lid: 0.2, brow: -0.6, dur: 0.15 });
A(r3(END - 0.6), "dra", "look", { to: AT_PHX, dur: 0.12, blink: false });
act.mood(c, r3(END - 0.58), "dra", "annoyed", { hold: 0.3 });
sfx(TL + 0.15, "screech", { dur: 1.3, gain: 0.7, reason: "the tyres squeal as the car fishtails off the verge" });
sfx(r3(TL + 0.82), "thud", { gain: 0.6, reason: "the left tyres bump back over the kerb" });
const ENGINE = [[0, 2400, 0.55, 1], [0.04, 1800, 0.1, 1], [0.4, 2800, 0.75, 1], [TRIP, 3000, 0.8, 1], [TRIP + 0.25, 5200, 0.35, 0], [2.1, 2400, 0.3, 0], [FREEZE[0] - 0.1, 2300, 0.3, 0], [FREEZE[0], 0, 0, 0], [FREEZE[1], 0, 0, 0], [FREEZE[1] + 0.06, 5200, 0.35, 0], [TL - 0.02, 5200, 0.35, 0], [TL + 0.15, 3600, 0.9, 1], [TL + 1.0, 4300, 0.85, 1], [END, 4700, 0.75, 1]].map(([t, ...v]) => [r3(t), ...v]);

// ---------------------------------------------------------------- shots (every one looks into the painting: -z)
// static cameras pan with the car (look keyed to it); "rig" shots ride in the car (the world turns behind them)
const carMid = (t, dy = 0.9) => { const w = W(t, [0, dy, 0]); return w; };
const look = (t, dy) => carMid(t, dy);
// everything recorded so far goes onto the clip's clock (see nt)
for (const x of c.items) { if (typeof x.dur === "number") x.dur = r3(nt(x.at + x.dur) - nt(x.at)); x.at = nt(x.at); }
for (const k of [...c.captions, ...c.visible]) { k.from = nt(k.from); k.to = nt(k.to); }
for (const h of c.hitStops) h.at = r3(Math.round(nt(h.at) * 30) / 30);
const onClip = (shots) => shots.map(([name, start, shot, kind]) => [name, nt(start), shot && shot.dur != null ? { ...shot, dur: r3(nt(start + shot.dur) - nt(start)) } : shot, kind]);
const beats = c.beats(onClip([
  // the hook: long lens from ahead, the rock in the lane in front of the car; it pulls wider as the car comes
  ["swerve", 0, { pos: [-0.6, 2.9, 12.5], look: [-1.5, 1.2, -13.5], fov: 12.5, to: { pos: [0.2, 2.3, 12.5], look: look(TRIP, 1.0), fov: 22 }, dur: TRIP, ease: "inOut" }, "hook"],
  // the trip: lower and to the left, along the kerb: the tyres hit it and the car tips over toward us
  ["trip", TRIP, { pos: [2.6, 1.15, 9.5], look: look(TRIP, 0.8), fov: 30, to: { look: look(2.25, 1.2) }, dur: 0.8, ease: "out" }],
  // in the car on its side: both faces upright, the world turned 90 degrees behind them; the setup ping
  ["ping", 2.25, { rig: "car", pos: [0, 1.95, 4.8], look: [0, 1.4, -0.3], fov: 30, to: { pos: [-0.1, 1.9, 4.4] }, dur: 1.05, ease: "inOut" }],
  // wide again: upside down, the snacks floating out
  ["roll", 3.3, { pos: [1.4, 2.6, 12.5], look: look(3.3, 1.4), fov: 23, to: { look: look(4.6, 1.4) }, dur: 1.3, ease: "inOut" }, "escalation"],
  // the swipe: close on Phoenix in the car, the road going round behind him
  ["swipe", 4.6, { rig: "car", pos: [-0.4, 1.55, 3.4], look: [PHX_X, 1.0, -0.3], fov: 24, to: { pos: [-0.42, 1.5, 3.1] }, dur: 0.8, ease: "inOut" }],
  // wide: going over onto its roof (uh-oh)
  ["uh-oh", 5.4, { pos: [1.6, 2.4, 12.0], look: look(5.4, 1.6), fov: 28, to: { look: look(LU, 1.0) }, dur: r3(LU - 5.4), ease: "inOut" }],
  // the look-up: in the car, a medium close on Phoenix from his front left at three-quarters, eye level, the road
  // filling the top of the frame
  ["look-up", LU, { rig: "car", pos: [-0.12, 1.42, 4.1], look: [PHX_X, 1.3, -0.3], fov: 27 }, "payoff"],
  // back on its wheels: the landing, wide, then the car fishtails back onto the road and drives at us
  ["landing", r3(9.15 - SH), { pos: [2.0, 1.7, 13.5], look: look(TL, 0.8), fov: 24, to: { pos: [-0.6, 1.7, 15.5], look: look(r3(END - 0.05), 0.8), fov: 24 }, dur: r3(END - 9.15 + SH), ease: "inOut" }, "reaction"],
]), ENDN);

write(import.meta.url, {
  id: "never-looks-up-car-crash",
  title: "The friend who never looks up from his phone… even when the car flips",
  idea: "Never Looks Up ep 6 (the redo of Car Crash): Dragon swerves round a rock, slides into the kerb and the roadster flips twice in slow motion; Phoenix scrolls through all of it until, upside down with the road over his head, the series' 'huh.'; time snaps back, the car lands on its wheels",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: r3(nt(e2t(8.5)) + HS),
  set: { type: "env", env: "golden-country-road", shade: "soft", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, speed: speedKeys },
  rigs: [rigOut],
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0, wash: 0.09, pool: 0.15 } },
  // action music (Jonny 7 Nov: "some action music to support the scene"): a new AI car-chase bed (assets/music/ai/car-chase,
  // 140 bpm, drums + staccato strings + brass hits), locked so its stop lands on the look-up (the series' held breath),
  // back in on the ping after it; the low cut moves its weight into the phone band
  music: { file: "ai/car-chase/car-chase-06.ogg", gain: 0.42, lowCut: 120, duck: { db: 9 }, until: nt(e2t(8.0)), then: { file: "ai/car-chase/car-chase-06.ogg", from: nt(e2t(9.15)), gain: 0.4 } },
  sound: { sfx: 0.7, ambience: 0.3, surface: "road", room: "open", guard: true, scenes: ["ui"], signature: { entrances: false }, engine: { keys: ENGINE.map(([t, ...v]) => [nt(t), ...v]), gain: 0.17, cyl: 4 } },
  creative: { length: [ENDN, ENDN] },
  hook: { show: ["phx", "dra", "phone", "rock"], hint: 0, what: "Dragon sees a rock in the lane and yanks the wheel; Phoenix beside him only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "seatP", from: 0, to: 10, reason: "Phoenix sits in his car seat, belted in" },
    { who: "dra", with: "seatD", from: 0, to: 10, reason: "Dragon sits in his car seat, belted in" },
    { who: "dra", with: "wheel", from: 0, to: 10, reason: "his gloves hold the steering wheel's rim" },
    { who: "dra", from: 0, to: 10, checks: ["face-covered"], reason: "his gloves on the wheel rim sit just under his eyes from the low front cameras; both eyes stay readable in the draft stills (0.2, 2.7, 6.5 s)" },
    { who: "dra", with: "seatP", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his folded wing tip presses against Phoenix's padded seat back beside him, behind his own body" },
    { who: "phx", with: "seatD", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his folded flame wing presses against Dragon's padded seat back beside him, behind his own body" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep6-car-crash.mjs. Title added in TikTok's text tool.",
});
console.log(`video END ${r3(ENDN + HS)}; trip ${nt(TRIP)}, ping ${nt(v2t(2.7))}, freeze ${FREEZE.map(nt)}, land t ${nt(TL)} (video ${r3(nt(TL) + HS)})`);
