// Still Scrolling — Car Crash (story 07 of Jonny's story library, brief 27 Oct 2026, made 28 Oct; v2 after Jonny's
// notes the same evening): Dragon drives a red open-top roadster along a sunny road, the Wizard is his belted passenger
// and scrolls his phone. A rock lies in the lane: Dragon swerves round it, the back steps out, he over-corrects and
// the car slides sideways into the kerb of a traffic island. The tyres trip on it and the car does ONE cartoon barrel
// roll over the island and lands on all four tyres in the other lane. Dragon lets out a breath and steers back into
// his lane. The Wizard never looks up. The last shot is the first one again, so the clip loops.
//
// THE BRIEF (the reviews and Jonny judge the clip against these)
//   Joke:        a calm phone user inside extravagant cartoon chaos.
//   Wants:       Dragon wants to keep the car on the road; the Wizard wants one more video.
//   Consequence: the car does a full barrel roll; the Wizard swipes once while upside down.
//   Ending:      everyone is fine, back to the opening frame (designed loop).
//
// Time: the roll was first timed in "story time" (tau, the v1 clip's seconds). Jonny wanted the roll half as fast
// again in the wide shots, then half again (2.25x), but the cabin shot (the payoff) slower than before (2/3), so it plays as the slow-motion
// moment. The clip's time runs through tau at RATE: FAST in the wide shots of the roll, CABIN in the cabin shot, 1 in the
// rest, and half a second of story is skipped at the cut to the last shot; the speed changes sit on the cuts (or ease
// in over 0.15 s). The swerve before the trip is new and keyed straight in tau.
// The road is a treadmill (set-road.js): its speed is solved so the clip scrolls a whole number of road patterns and
// the wheels turn a whole number of spoke steps, so the loop is seamless.
//
// Run: node storyboards/road/make-car-crash.mjs -> storyboards/road/car-crash-v2.json
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { roadDistance, rigRotation, rigToWorld, wheelNeed, ROADSTER } from "../../engine/page/vehicle.js";

const c = clip(), { A, sfx, arm, cap } = c;
const WIZ_CHAR = process.env.WIZ_CHAR || "lookdev/wizard-crisp", DRA_CHAR = process.env.DRA_CHAR || "lookdev/dragon-crisp";

// ---------------------------------------------------------------- time: tau (story time) -> clip time
const TAU0 = -0.45, TRIP = 0.7, TAU_END = 13.75;   // the clip starts at tau -0.45 (Dragon already seeing the rock); the tyres trip on the kerb at tau 0.7
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const FAST = 2.25;    // v1 x 1.5 (Jonny, 17:16), then x 1.5 again (17:58)
const CABIN = 2 / 3;  // the swipe in the air a third slower than v1 (Jonny, 18:28)
const SKIP = [11.0, 11.5];   // story time cut out at the cut to the last shot (Jonny: cut half a second sooner after the phew)
const RATE = (u) => u < 0.98 ? 1 : u < 1.13 ? 1 + (FAST - 1) * lin(u, 0.98, 1.13) : u < 4.5 ? FAST : u < 6.0 ? CABIN : u < 7.1 ? FAST : u < 7.5 ? FAST - (FAST - 1) * lin(u, 7.1, 7.5) : u >= SKIP[0] && u < SKIP[1] ? Infinity : 1;
const TAB = []; { let t = 0; for (let u = TAU0; u <= TAU_END + 0.2; u += 0.001) { TAB.push([u, t]); t += 0.001 / RATE(u + 0.0005); } }
const T = (u) => { const i = Math.min(TAB.length - 2, Math.max(0, Math.floor((u - TAU0) / 0.001))), [u0, t0] = TAB[i], [, t1] = TAB[i + 1]; return t0 + (t1 - t0) * (u - u0) / 0.001; };
const tauOf = (t) => { let lo = 0, hi = TAB.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAB[m][1] <= t) lo = m; else hi = m; } const [u0, t0] = TAB[lo], [u1, t1] = TAB[hi]; return u0 + (u1 - u0) * (t - t0) / (t1 - t0 || 1); };
const END = Math.round(T(TAU_END) * 30) / 30;
const At = (u) => r3(T(u)), D = (u, d) => r3(T(u + d) - T(u));   // a clip time and a duration from story time

// ---------------------------------------------------------------- the road and its speed (set-road.js)
// cruise, then slow motion from the trip to just before the touchdown (a third of the speed in story time, times
// RATE in clip time), then cruise again. V is solved so the clip covers DIST metres: whole road patterns (PERIOD 24 m)
// and, with WHEEL, a whole number of fifths of a turn.
const SLOW = 0.3, SPOKES = 5;
const fOld = (u) => u < 0.72 ? 1 : u < 0.98 ? 1 - (1 - SLOW) * lin(u, 0.72, 0.98) : u < 6.3 ? SLOW : SLOW + (1 - SLOW) * lin(u, 6.3, 6.95);
const speedKeys = (V) => { const K = []; for (let f = 0; f <= END * 20; f++) { const t = f / 20, u = tauOf(t); K.push([r3(t), r3(V * Math.min(1, fOld(u) * RATE(u)))]); } return K; };
const DIST = 24 * Math.round(roadDistance({ speed: speedKeys(9.5) }, END) / 24);
let V = 9.5;
for (let i = 0; i < 40; i++) V *= DIST / roadDistance({ speed: speedKeys(V) }, END);
V = r3(V * 1e3) / 1e3;
const WHEEL = DIST / ((2 * Math.PI / SPOKES) * Math.round(DIST / ((2 * Math.PI / SPOKES) * ROADSTER.rideY)));
// the traffic island on the centre line (its near nose has just passed the car when the tyres trip) and the rock in
// the lane, which passes the car's right side at tau 0.25
const ISL = { x: 2.75, width: 1.0, length: 9, height: 0.16, chamfer: 0.08, at: [r3(T(TRIP)), -3.2] };
const ROCK = { x: -1.5, size: 1.0, at: [r3(T(0.25)), 0] };
const set = { type: "road", seed: 5, speed: speedKeys(V), island: ISL, rock: ROCK, dust: [] };

// ---------------------------------------------------------------- the car's path in story time (vehicle.js rig keys)
// roll: negative tips the car over its left (+x) side, the side it slides toward; one full turn, -360 at the touchdown
const herm = (K, t) => {   // [t, value, slope] keys, cubic Hermite
  if (t <= K[0][0]) return K[0][1];
  if (t >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0; while (K[i + 1][0] < t) i++;
  const [t0, v0, m0] = K[i], [t1, v1, m1] = K[i + 1], h = t1 - t0, u = (t - t0) / h;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * v0 + (u ** 3 - 2 * u ** 2 + u) * h * m0 + (-2 * u ** 3 + 3 * u ** 2) * v1 + (u ** 3 - u ** 2) * h * m1;
};
const LAND = 7.05;
const ROLL = [[TAU0, 0, 0], [TRIP, 0, 0], [0.78, -2.5, -38], [0.9, -7.5, -55], [1.25, -21, -40], [1.8, -42, -50], [4.3, -192, -63], [6.4, -321, -52], [LAND, -360, -28], [7.24, -362.6, 0], [7.55, -359.4, 0], [7.95, -360, 0], [TAU_END, -360, 0]];
const HEAVE = [[TAU0, 0, 0], [0.84, 0, 0.3], [1.25, 0.33, 1.1], [1.8, 0.95, 1.05], [3.0, 1.75, 0.45], [4.2, 1.98, 0], [5.4, 1.62, -0.55], [6.4, 0.9, -1.0], [LAND, 0, -1.2], [7.17, -0.075, 0], [7.42, 0.025, 0], [7.68, -0.008, 0], [8.0, 0, 0], [TAU_END, 0, 0]];
// sideways: the swerve left round the rock, the slide into the island, over it in the air, the landing in the other
// lane, a short skid, then back into his own lane
const SIDE = [[TAU0, 0, 0], [-0.12, 0, 0], [0.25, 0.5, 2.0], [0.5, 0.82, 1.1], [TRIP, 0.98, 0.8], [1.25, 1.35, 0.8], [1.8, 1.8, 0.75], [4.3, 3.5, 0.6], [6.4, 4.4, 0.25], [LAND, 4.55, 0.1], [8.6, 4.45, -0.1], [9.3, 4.2, -0.8], [10.4, 2.2, -2.0], [11.4, 0.35, -0.9], [12.0, 0, 0], [TAU_END, 0, 0]];
const FWD = [[TAU0, 0, 0], [LAND, 0, 0], [8.2, -0.45, -0.15], [9.4, -0.3, 0.2], [11.0, 0, 0], [TAU_END, 0, 0]];
// yaw (+ turns the nose to the left, +x): left round the rock, the back steps out, the over-correction swings the nose
// right while the car still slides left (the tyres trip broadside); it unwinds in the air; the landing skid; the lane
// change back
const YAW = [[TAU0, 0, 0], [-0.12, 0, 0], [0.12, 15, 25], [0.3, 9, -55], [0.5, -16, -75], [TRIP, -21, -10], [1.5, -14, 5], [4.3, -6, 3], [6.6, -2, 2], [LAND, 0, 0], [7.4, 9, 0], [7.95, -5.5, 0], [8.55, 2.2, 0], [9.2, 0, 0], [9.9, 8, 0], [10.7, 2, 0], [11.4, -5, 0], [12.0, 0, 0], [TAU_END, 0, 0]];
const PITCH = [[TAU0, 0, 0], [-0.12, 0, 0], [0.05, 1.6, 0], [0.4, 0.6, 0], [TRIP, 0, 0], [0.86, 3.5, 10], [1.3, 4, 0], [2.6, 0, -1], [6.5, -1.5, 0], [LAND, 0, 3], [7.16, -2.5, 0], [7.4, 1.0, 0], [7.75, 0, 0], [TAU_END, 0, 0]];
// the steering wheel (degrees, + to the left): the yank left, the over-correction, the counter-steer in the air, the
// landing skid, the lane change back
const STEER = [[TAU0, 0, 0], [-0.15, 0, 0], [-0.03, 75, 0], [0.18, 35, 0], [0.33, -90, 0], [0.55, -55, 0], [TRIP, -35, 0], [0.9, -40, 0], [1.4, 25, 0], [2.4, 0, 0], [LAND, 0, 0], [7.35, -70, 0], [7.9, 55, 0], [8.5, -22, 0], [9.1, 0, 0], [9.5, 32, 0], [10.3, 0, 0], [10.9, -28, 0], [11.6, 0, 0], [TAU_END, 0, 0]];
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
const kOf = (u) => 0.08 * lin(u, TRIP, TRIP + 0.12) * (1 - lin(u, 7.0, 7.08));
const carAt = (t) => {
  const u = tauOf(t), roll = herm(ROLL, u), pitch = herm(PITCH, u), yaw = herm(YAW, u);
  const y = smax(herm(HEAVE, u), clearance(roll, pitch, yaw), kOf(u));
  return { at: r3(t), pos: [r3(herm(SIDE, u)), r3(y), r3(herm(FWD, u))], roll: r3(roll), pitch: r3(pitch), yaw: r3(yaw), steer: r3(herm(STEER, u)) };
};
const keys = [];
for (let f = 0; f <= END * 30; f++) keys.push(carAt(f / 30));
const rig = { id: "car", kind: "roadster", color: "#ec4b3c", pivot: PIVOT, wheel: r3(WHEEL * 1e4) / 1e4, keys };
// where a tyre on the island would need more than its travel, lift the car by the excess (spread over the
// neighbouring keys so the lift stays smooth)
for (let pass = 0; pass < 4; pass++) {
  const lift = keys.map(() => 0);
  for (let i = 0; i <= END * 120; i++) {
    const t = i / 120, ex = Math.max(...wheelNeed(rig, set, t)) - ROADSTER.travel + 0.006;
    if (ex <= 0) continue;
    const k = Math.round(t * 30);
    for (let j = -2; j <= 2; j++) if (keys[k + j]) lift[k + j] = Math.max(lift[k + j], ex * (1 - Math.abs(j) / 3));
  }
  if (!lift.some((v) => v > 0)) break;
  keys.forEach((k, i) => { k.pos[1] = r3(k.pos[1] + lift[i]); });
}
// checks: no tyre goes more than its travel into the road or the island, and the car's body clears the rock
{
  let worst = { d: -1 };
  for (let i = 0; i <= END * 120; i++) { const t = i / 120, n = wheelNeed(rig, set, t); for (let w = 0; w < 4; w++) if (n[w] > worst.d) worst = { d: n[w], t, w }; }
  if (worst.d > ROADSTER.travel + 0.005) console.warn(`tyre ${worst.w} ${(worst.d - ROADSTER.travel).toFixed(3)} m into the ground at ${worst.t.toFixed(3)} s`);
  else console.log(`tyres: deepest need ${worst.d.toFixed(3)} m of ${ROADSTER.travel} travel (t ${worst.t.toFixed(2)})`);
  let near = { d: 9 };
  for (let i = 0; i <= T(TRIP) * 120; i++) {
    const t = i / 120, rz = ROCK.at[1] - (roadDistance(set, t) - roadDistance(set, ROCK.at[0]));
    for (let x = -1.08; x <= 1.08; x += 0.12) for (let z = -1.86; z <= 1.98; z += 0.12) {
      if (Math.abs(x) < 1.0 && Math.abs(z) < 1.8) continue;   // only the body's outline
      const w = rigToWorld(rig, t, [x, 0.3, z]), d = Math.hypot(w[0] - ROCK.x, w[2] - rz) - ROCK.size / 2;
      if (d < near.d) near = { d, t };
    }
  }
  console.log(`rock: the body passes ${near.d.toFixed(2)} m from it (t ${near.t.toFixed(2)})`);
}
// dust from a tyre (0 front-left, 1 front-right, 2 rear-left, 3 rear-right; left is +x) at clip time t
const tyreAt = (t, w) => { const q = [w % 2 ? -ROADSTER.track : ROADSTER.track, 0.1, w < 2 ? ROADSTER.front : ROADSTER.rear]; const p = rigToWorld(rig, t, q); return { x: r3(p[0]), z: r3(p[2]) }; };
const dust = (u, w, o = {}) => set.dust.push({ at: At(u), ...tyreAt(T(u), w), n: 10, size: 0.45, dur: 1.4, ...o });
dust(0.3, 2, { n: 8, size: 0.38, color: "#e8e6e2", opacity: 0.6 }); dust(0.3, 3, { n: 8, size: 0.38, color: "#e8e6e2", opacity: 0.6 });   // tyre smoke in the fishtail
dust(0.55, 2, { n: 9, size: 0.42, color: "#e8e6e2", opacity: 0.7 }); dust(0.55, 0, { n: 7, size: 0.36, color: "#e8e6e2", opacity: 0.6 });
dust(TRIP + 0.02, 2, { n: 12, size: 0.42 }); dust(TRIP + 0.05, 0, { n: 10, size: 0.4 });   // the tyres striking the kerb
for (const w of [0, 1, 2, 3]) dust(LAND, w, { n: 10, size: 0.55, dur: 1.5 });              // the landing, all four tyres
// sparks where the rims hit the road: sprayed outward and forward (toward the front camera), most from the front tyres
set.sparks = [0, 1, 2, 3].map((w) => ({ at: At(LAND), ...tyreAt(T(LAND), w), n: w < 2 ? 18 : 10, speed: 3.5, size: 0.2, drag: 0.15, aim: [(w % 2 ? -1 : 1) * 2.6, 1.2, 2.4] }));
{ const f = rigToWorld(rig, T(LAND), [0, 0.12, ROADSTER.front + 0.25]); set.sparks.push({ at: At(LAND), x: r3(f[0]), z: r3(f[2]), n: 22, speed: 3.2, size: 0.2, drag: 0.15, aim: [0, 1.4, 3.2] }); }   // the front valance scrapes
dust(7.4, 3, { n: 10, size: 0.45, opacity: 0.7 });                                         // the skid

// ---------------------------------------------------------------- places (car frame: x left of the car, z its front)
const SEAT_Y = 0.18, SEAT_Z = -0.32, WIZ_X = -0.47, DRA_X = 0.47;
const WIZ = [WIZ_X, SEAT_Z + 0.03], DRA = [DRA_X, SEAT_Z + 0.03];
const AT_PHONE = [0.05, -0.95];                 // the Wizard's eyes on his screen
const ROAD_AHEAD = [0, 0.02];                    // Dragon watching the road (toward the camera in the front view)
const AT_ROCK = [-0.25, -0.12];                  // ... and at the rock ahead, low on his right
const AT_WIZ = [-0.55, -0.05];                   // a side-eye at the Wizard
// the Wizard's right hand holds the phone in front of his chest; his left index scrolls it (character space)
const PH = { up: 0.32, fwd: 0.4 };
const PHONE_HAND = { x: [-0.07, PH.up, PH.fwd] };
const SCROLL_REST = { x: [0.05, PH.up + 0.08, PH.fwd - 0.06] }, SCROLL_LOW = { x: [0.03, PH.up + 0.05, PH.fwd - 0.035] }, SCROLL_HIGH = { x: [0.03, PH.up + 0.17, PH.fwd - 0.04] };
const WHEEL_L = { prop: "wheel", grip: "L" }, WHEEL_R = { prop: "wheel", grip: "R" };

const cast = [
  { id: "wiz", character: WIZ_CHAR, rig: "car", at: WIZ, face: "camera", expr: "kind", seed: 2.6, shadowFall: 0.001, belt: { side: "R" },
    arms: { R: PHONE_HAND, L: SCROLL_REST }, grip: { R: "hold", L: "point" } },
  { id: "dra", character: DRA_CHAR, rig: "car", at: DRA, face: "camera", expr: "kind", seed: 4.1, shadowFall: 0.001, belt: { side: "L" }, sway: 0.7,
    arms: { R: WHEEL_R, L: WHEEL_L }, grip: { R: "hold", L: "hold" } },
];
// [id, kind, rest (out of sight: below the dash, or on the rear deck behind the seats), spec, float path (car frame)
// while the car is in the air, where it drops at the landing (out of sight below the dash)]: they rise round the two
// of them, never past a face, and float round the still phone in the cabin shot
const SNACKS = [
  ["apple", "apple", [-0.02, 0.42, 0.05], { scale: 1.3 }, [[1.25, [-0.05, 0.8, 0.42]], [2.2, [-0.1, 1.0, 0.42]], [4.4, [-0.13, 1.05, 0.4]], [6.3, [-0.15, 1.09, 0.38]]], [-0.02, 0.42, 0.05]],
  ["cookie", "cookie", [-0.82, 0.9, -1.0], { scale: 1.25 }, [[1.3, [-1.0, 1.0, -0.7]], [2.4, [-1.02, 1.0, 0.2]], [4.5, [-0.84, 0.98, 0.5]], [6.3, [-0.8, 1.02, 0.5]]], [-0.56, 0.5, 0.45]],
  ["candyA", "candy", [-0.6, 0.9, -1.05], { color: "#e8b53a", big: 1.9 }, [[1.3, [-1.0, 1.25, -0.8]], [2.5, [-1.04, 1.36, 0.1]], [4.5, [-0.96, 1.38, 0.4]], [6.3, [-0.95, 1.42, 0.4]]], [-0.6, 0.5, 0.42]],
  ["candyB", "candy", [0.02, 0.42, -0.05], { color: "#e0475b", big: 1.9 }, [[1.3, [0.02, 0.95, 0.2]], [2.3, [0.02, 1.62, 0.1]], [4.4, [0.0, 1.78, 0.05]], [6.3, [-0.02, 1.84, 0.02]]], [0.02, 0.42, -0.05]],
];
const props = [
  { id: "seatW", kind: "carseat", rig: "car", x: WIZ_X, y: SEAT_Y, z: SEAT_Z },
  { id: "seatD", kind: "carseat", rig: "car", x: DRA_X, y: SEAT_Y, z: SEAT_Z },
  { id: "wheel", kind: "steer", rig: "car", x: DRA_X, y: 0.9, z: 0.25, tip: 34 },
  // the screen plays the crash itself (frames of this clip, made by make-car-crash-screen.sh) and, after the swipe,
  // the clip's first frame: the last shot pushes into it until it fills the frame, so the loop starts again on screen
  { id: "phone", kind: "phone", style: "iphone", rig: "car", x: WIZ_X, y: 1.0, z: 0.1, rot: 180, tip: -32, scale: 2.15,
    screen: { src: "assets/screens/car-crash/atlas.jpg", cols: 4, rows: 3, next: "assets/screens/car-crash/next.jpg" } },
  // loose snacks that float round the cabin while the car turns over (the phone never moves)
  ...SNACKS.map(([id, kind, at, o]) => ({ id, kind, rig: "car", x: at[0], y: at[1], z: at[2], ...o })),
];

// ---------------------------------------------------------------- 0 setup at frame 0 (already driving, already scrolling)
for (const w of ["wiz", "dra"]) A(0, w, "sit", { seat: w === "wiz" ? "seatW" : "seatD", dur: 0, hands: "keep" });
A(0, "wiz", "grab", { prop: "phone", hand: "R", grip: [0.032, 0.03, 0], pose: null });
A(0, "wiz", "look", { to: AT_PHONE, dur: 0.01, blink: false });
A(0, "wiz", "face", { lid: 0.4, dur: 0.01 });
A(0, "wiz", "expr", { expr: "kind", set: { curve: 0.22 }, dur: 0.01 });
act.blinksAt(c, "wiz", [At(2.9), At(9.1)]);
A(0, "dra", "look", { to: ROAD_AHEAD, dur: 0.01, blink: false });
act.blinksAt(c, "dra", [At(12.9)]);
// the steering wheel follows STEER (the hands are on its rim, so they turn with it)
for (let t = 0; t < END - 0.05; t += 0.1) c.prop(t, "wheel", { tilt: r3(0.6 * herm(STEER, tauOf(t + 0.1))) }, 0.1, "linear");   // the rim turns less than the tyres would need (a cartoon wheel), so the hands stay low

// the Wizard's scroll: the index lifts to the lower screen, swipes up, lifts away and comes back to rest
const SCROLL_BIG = { x: [0.03, PH.up + 0.25, PH.fwd - 0.04] };   // the payoff's swipe: a long, slower stroke that reads
const swipe = (t, big = false) => {
  const k = big ? 1 / CABIN : 1;   // the payoff's swipe plays in the cabin's slow motion
  arm(t, "wiz", "L", SCROLL_LOW, 0.12 * k, "inOut");
  arm(t + 0.12 * k, "wiz", "L", big ? SCROLL_BIG : SCROLL_HIGH, 0.14 * k, "inOut");
  arm(t + 0.26 * k, "wiz", "L", SCROLL_REST, 0.2 * k, "inOut");
  A(t + 0.27 * k, "wiz", "squash", { amount: 0.008, dur: 0.2 * k });
};
for (const u of [2.4, 3.9, 7.9, 10.35]) swipe(At(u));
swipe(0.05);
swipe(At(5.15), true);
c.textPop(At(5.3), "wiz", "swipe", { dur: 0.9 });
sfx(At(5.29), "kenney/scroll", { gain: 0.8, reason: "the one swipe upside down (the payoff)" });

// ---------------------------------------------------------------- 1 NORMAL: calm driving, then the rock
cap(0, At(1.15) - 0.12, "Just one more video.", 250);
A(0, "dra", "look", { to: AT_ROCK, dur: 0.14, blink: false });   // frame 0: his eyes are already going to the rock
A(0.03, "dra", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.3 }, dur: 0.12 });
A(0.03, "dra", "face", { brow: 0.6, dur: 0.12 });

// ---------------------------------------------------------------- 2 SWERVE: round the rock, the back steps out, over-correction
sfx(At(-0.1), "screech", { dur: 0.45, gain: 0.6, reason: "the tyres squeal as Dragon yanks the wheel" });
sfx(At(0.3), "screech", { dur: 0.5, gain: 0.6, reason: "the back steps out and he over-corrects" });
sfx(At(-0.05), "gasp", { gain: 0.75, reason: "Dragon's shock at the rock" });
A(At(-0.12), "dra", "squash", { amount: 0.05, dur: 0.2 });
A(At(-0.05), "wiz", "hatwobble", { amount: 5, freq: 2.4, dur: 0.7 });
A(At(0.0), "dra", "look", { to: ROAD_AHEAD, dur: 0.15, blink: false });

// ---------------------------------------------------------------- 3 TRIP: the tyres strike the kerb, the car tips over
sfx(At(TRIP), "thud", { gain: 0.9, reason: "the sliding tyres strike the island's kerb" });
sfx(At(TRIP) + 0.02, "kenney/impact-metal-light", { gain: 0.45, reason: "a rim knocks on the kerb" });
sfx(At(1.85), "whoosh", { dur: 0.6, gain: 0.6, reason: "the car lifts into the roll" });
A(At(0.74), "dra", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.3 }, dur: 0.12 });
A(At(0.76), "dra", "squash", { amount: 0.06, dur: 0.22 });
A(At(0.8), "wiz", "hatwobble", { amount: 7, freq: 2.6, dur: 0.8 });

// ---------------------------------------------------------------- 4 THE ROLL (faster in the wide shots)
// the Wizard's hat tip hangs toward the ground as the car turns over (gravity in the car's frame)
for (let u = 1.0; u < 7.6; u += 0.2) {
  const th = (herm(ROLL, u + 0.2) * Math.PI) / 180;
  A(At(u), "wiz", "hatsway", { tip: [r3(-6 * (1 - Math.cos(th))), r3(28 * -Math.sin(th))], brim: r3(-0.15 * (1 - Math.cos(th))), dur: D(u, 0.2), ease: "linear" });
}
A(At(7.6), "wiz", "hatsway", { tip: [0, 0], brim: 0, dur: 0.5, ease: "settle" });
A(At(1.2), "dra", "expr", { expr: "shocked", set: { open: 0.75, eye: 1.4 }, dur: 0.25 });
A(At(1.9), "dra", "look", { to: [0.25, 0.05], dur: 0.2, blink: false });
A(At(3.4), "dra", "look", { to: ROAD_AHEAD, dur: 0.25, blink: false });
A(At(2.0), "dra", "still", { dur: D(2.0, 4.8), idle: 0.2 });

// loose snacks float up as the car turns over, drift round the cabin, and drop out of sight at the landing
for (const [id, , , , path, land] of SNACKS) {
  let prev = 1.0;
  path.forEach(([u, p], i) => { c.prop(At(prev), id, { x: p[0], y: p[1], z: p[2], rot: 40 * (i + 1) * (id.length % 2 ? 1 : -1), tip: 25 * (i + 1) }, D(prev, u - prev), i ? "inOut" : "out"); prev = u; });
  c.prop(At(6.75), id, { x: land[0], y: land[1], z: land[2], rot: 0, tip: 0 }, D(6.75, LAND - 6.75 + 0.02), "in");
}

// ---------------------------------------------------------------- 5 STILL SCROLLING (camera on the cabin, the slow-motion moment)
A(At(4.5), "wiz", "still", { dur: D(4.5, 1.5), idle: 0.1 });

// ---------------------------------------------------------------- 6 LANDING: a heavy landing on all four, a short skid
const TL = At(LAND);
sfx(TL, "thud", { gain: 1.0, reason: "all four tyres land" });
sfx(TL, "kenney/impact-metal-heavy", { gain: 0.55, reason: "the body slams down on its springs" });
sfx(TL + 0.05, "kenney/impact-metal-light", { gain: 0.4, reason: "the rims scrape the road (the sparks)" });
sfx(TL + 0.04, "screech", { dur: 0.22, gain: 0.35, reason: "the tyres chirp as they touch down spinning" });
c.at(TL, { fx: "shake", dur: 0.18, amp: 0.05 });
sfx(TL + 0.1, "creak", { dur: 0.35, gain: 0.35, reason: "the springs compress and rebound" });
sfx(At(7.3), "screech", { dur: 0.8, gain: 0.45, reason: "the short skid" });
A(TL + 0.01, "dra", "squash", { amount: 0.08, dur: 0.25 });
A(TL + 0.01, "wiz", "squash", { amount: 0.05, dur: 0.25 });
A(TL + 0.03, "wiz", "hatwobble", { amount: 9, freq: 2.8, dur: 1.0 });
A(TL + 0.05, "dra", "expr", { expr: "shocked", set: { open: 0.6, eye: 1.35, curve: -0.2 }, dur: 0.2 });

// ---------------------------------------------------------------- 7 EVERYTHING IS FINE: Dragon breathes out, steers back into his lane
A(At(8.7), "dra", "face", { lid: 0.85, brow: -0.2, dur: 0.35 });
A(At(8.7), "dra", "expr", { expr: "kind", set: { open: 0.22, round: 0.8, curve: 0.0, eye: 1.0 }, dur: 0.35 });
A(At(8.75), "dra", "squash", { amount: 0.05, dur: 0.7 });
c.textPop(At(8.75), "dra", "phew", { dur: 0.7 });
A(At(9.45), "dra", "face", { lid: 0, brow: 0, dur: 0.3 });
A(At(9.45), "dra", "expr", { expr: "kind", dur: 0.4 });
A(At(9.5), "dra", "look", { to: ROAD_AHEAD, dur: 0.3, blink: false });
// a side-eye at the Wizard: eyes open, pupils on him, brows a little lower (no lids over the eyes), then back
A(At(10.0), "dra", "look", { to: AT_WIZ, dur: 0.3, blink: false });
A(At(10.1), "dra", "face", { brow: -0.3, dur: 0.3 });
A(At(10.1), "dra", "expr", { expr: "kind", set: { curve: -0.15, open: 0 }, dur: 0.3 });
A(At(11.3), "dra", "look", { to: ROAD_AHEAD, dur: 0.3, blink: false });
A(At(11.35), "dra", "face", { brow: 0, dur: 0.35 });
A(At(11.35), "dra", "expr", { expr: "kind", dur: 0.4 });

// ---------------------------------------------------------------- 8 RETURN: the opening frame again
// one more glance at the phone (eyes only) before the loop: back on the road in time, so the end matches frame 0
// the last shot: his phone. The crash plays on the screen (the video he is watching is this one), he swipes, the next
// video is the clip's first frame, and the camera pushes into it until it fills the frame
const TP = At(11.5), SW = TP + 1.0, ZOOM = SW + 0.75;
c.prop(TP, "phone", { feed: 11 }, 0.98, "linear");
swipe(SW);
c.prop(SW + 0.08, "phone", { nextFeed: 12, scroll: 1 }, 0.72, "inOut");   // slow enough that no frame jumps
c.prop(0, "phone", { nextFeed: 12 }, 0.01);
sfx(SW + 0.2, "kenney/scroll", { gain: 0.6, reason: "the swipe to the next video" });
sfx(ZOOM, "whoosh", { dur: 0.4, gain: 0.35, reason: "the push into the screen (the loop)" });
A(At(11.5), "wiz", "face", { lid: 0.4, dur: 0.3 });

// ---------------------------------------------------------------- the engine (audio.mjs engineSound): [t, rpm, load, road]
const ENGINE = [[0, 2300, 0.5, 1], [At(-0.15), 2300, 0.5, 1], [At(-0.05), 1700, 0.1, 1], [At(0.35), 2700, 0.75, 1], [At(TRIP), 3000, 0.8, 1],
  [At(TRIP) + 0.2, 5200, 0.35, 0], [At(4.5) - 0.02, 5300, 0.35, 0], [At(4.5) + 0.04, 3500, 0.3, 0], [At(6.0) - 0.04, 3450, 0.3, 0],
  [At(6.0) + 0.02, 5200, 0.35, 0], [TL - 0.02, 5300, 0.35, 0], [TL + 0.14, 1500, 0.95, 1], [TL + 0.9, 2700, 0.8, 1],
  [At(9.3), 2500, 0.6, 1], [At(11.6), 2350, 0.55, 1], [END, 2300, 0.5, 1]].map(([t, ...v]) => [r3(t), ...v]);

// ---------------------------------------------------------------- shots (world frame; the car stays near z 0)
// the distance (phone units) at which the iPhone's 9:16 video (props3d.js IPHONE.videoH = 0.0717 * 16 / 9 tall) fills a
// 50 degree frame, a hair closer so no edge shows
const VIDEO_FILL = r3((0.0717 * 16 / 9 / 2) / Math.tan((25 * Math.PI) / 180) - 0.0005);
const xAt = (u) => herm(SIDE, u);
const beats = c.beats([
  // frame 0: closer on the two of them, a quick push toward Dragon as he sees the rock
  ["normal", 0, { pos: [0.05, 1.66, 4.7], look: [0.05, 1.18, -0.25], fov: 40, to: { pos: [0.25, 1.62, 4.05], look: [0.25, 1.22, -0.25] }, dur: D(TAU0, -0.12 - TAU0), ease: "out" }, "hook"],
  // high in front, the rock in the foreground on the left, the island on the right: the car swerves round the rock
  ["swerve", At(-0.12), { pos: [0.4, 3.4, 7.6], look: [-0.2, 0.5, 0.6], fov: 46, to: { pos: [0.8, 3.0, 7.0], look: [0.6, 0.55, 0.2] }, dur: D(-0.12, 0.82), ease: "inOut" }],
  // one take (Jonny, 18:28): low ahead of the car along the gap to the island as the sliding tyres strike the kerb,
  // then rising and swinging out beyond the island as the cabin tips toward the camera (both faces)
  ["trip", At(TRIP), { pos: [1.55, 0.42, 5.6], look: [2.1, 0.45, 0.2], fov: 42, to: { pos: [5.8, 1.6, 6.6], look: [xAt(1.8), 1.6, 0.4], fov: 42 }, dur: D(TRIP, 1.1), ease: "inOut" }],
  ["the roll", At(1.8), { pos: [xAt(1.8) + 1.7, 1.9, 8.2], look: [xAt(1.8) + 0.3, 1.6, 0], fov: 36, to: { pos: [xAt(4.5) + 0.6, 1.75, 7.6], look: [xAt(4.5) + 0.2, 2.2, 0] }, dur: D(1.8, 2.7), ease: "inOut" }, "escalation"],
  ["still scrolling", At(4.5), { rig: "car", pos: [-0.45, 1.5, 3.1], look: [-0.27, 1.32, -0.3], fov: 50, to: { pos: [-0.45, 1.4, 2.5], look: [-0.4, 1.2, -0.1] }, dur: 0.75, ease: "inOut" }, "payoff"],
  // from the front and low: the cabin swings back up to face us before the touchdown
  ["landing", At(6.0), { pos: [xAt(6.0) + 0.6, 1.7, 7.2], look: [xAt(6.0), 1.4, 0.2], fov: 42, to: { pos: [xAt(8.0) + 0.7, 1.35, 6.4], look: [xAt(8.0), 1.0, 0.2] }, dur: D(6.0, 2.0), ease: "inOut" }],
  ["everything is fine", At(8.5), { track: "car", pos: [-2.5, 2.0, 4.6], look: [-0.1, 1.1, -0.25], fov: 40, to: { pos: [-2.25, 1.97, 4.3] }, dur: 3.0, ease: "inOut" }, "reaction"],   // the v3 push-in pace; the cut now comes before it ends
  // his phone, locked to it (the world turns behind it), seen from where his eyes are (he is left out of these two
  // shots, his head would fill them): the crash on screen, then into the next video
  ["his phone", TP, { prop: "phone", hide: ["wiz"], pos: [0, 0.098, 0.205], look: [0, 0.0775, 0], fov: 50, to: { pos: [0, 0.0775, 0.19], look: [0, 0.0775, 0] }, dur: SW - TP, ease: "inOut" }],
  ["next video", ZOOM, { prop: "phone", hide: ["wiz"], pos: [0, 0.0775, 0.19], look: [0, 0.0775, 0], fov: 50, to: { pos: [0, 0.0775, VIDEO_FILL], look: [0, 0.0775, 0] }, dur: r3(END - ZOOM - 1 / 30), ease: "in" }],
].map(([n, t, s, k]) => [n, r3(t), s, k]), END);

write(import.meta.url, {
  id: "car-crash-v2",
  title: "Still Scrolling — Car Crash",
  idea: "Story library 07: Dragon swerves round a rock, trips on a traffic island and rolls once; the belted Wizard never stops scrolling (designed loop)",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  set, rigs: [rig],
  music: false,
  sound: { sfx: 0.7, ambience: 0.25, bedFade: 0.005, engine: { keys: ENGINE, gain: 0.17, cyl: 4 } },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "wiz", with: "seatW", from: 0, to: END, reason: "the Wizard sits in his seat" },
    { who: "dra", with: "seatD", from: 0, to: END, reason: "Dragon sits in his seat" },
  ],
  notes: `Generated by storyboards/road/make-car-crash.mjs (v2). Road ${DIST} m at cruise ${V} m/s.`,
});
console.log(`END ${END} s, cruise ${V} m/s, road ${DIST} m; trip at ${At(TRIP)} s, cabin ${At(4.5)}-${At(6.0)} s, landing ${TL} s`);
// the screen's video (make-car-crash-screen.sh renders these): 12 frames of the roll, then the first frame
console.log(`screen: ${Array.from({ length: 12 }, (_, i) => r3(At(1.0) + (i / 11) * (At(4.45) - At(1.0)))).join(",")}`);
