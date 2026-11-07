// NEVER LOOKS UP, episode 6b: CAR CRASH, CITY VERSION (7 Nov 2026). Jonny, on the country-road redo (ep 6): "one version
// with real physics and just a slow motion when the zoom is on phoenix sweeping on his phone and instead of dodging a
// rock i would like to see the car dodging another car in a city environment and the other car crashes then in the
// background and explodes. end scene phoenix didnt got anything and is still swiping while the driver is shocked".
// Built on reach rules v2 Group B (/mnt/project-files/reach-rules-v2-2026-11-07.md): frame 0 = the troublemaker (the
// blue car already over the line) and both victims in one medium-wide, the horn and Dragon's "CAR!" at 0.0 s, the
// payoff by ~7 s, 9.3 s long, every gibberish line subtitled.
//
// THE BRIEF
//   Joke:        Dragon drives the red roadster down a sunny city avenue; a blue hatchback drifts over the centre line
//                straight at them. Dragon yanks the wheel; in slow motion (the only slow motion in the clip) the blue
//                car slides past a hand's width from Phoenix's elbow while he swipes. Back at real speed the blue car
//                spins out, trips on the kerb, barrel-rolls down the street (all physics) and explodes behind them.
//                Nobody is in it: the cabin is dark tinted glass (cartoon impacts only).
//   Wants:       Dragon wants to live; Phoenix wants the next video.
//   Ending:      Dragon, shaking, turns from the fire to Phoenix: "Did you SEE that?!" Phoenix, eyes on the phone,
//                swipes: "mm-hm." Dragon's jaw hangs. Hard cut.
//
// Time: written in story time u (what really happens), played at clip time t. Real speed everywhere except the zoom
// on Phoenix (clip 0.75-2.75): time eases to S = 0.2 there and back. Nothing is a physics body during the slow
// motion (the blue car is still driven), so the physics bake (clip time) only ever runs at real speed.
//
// World: x right, z toward the camera. The painting's camera stands at (0, 4.5, 20) looking down the avenue (-z); every
// shot looks into the painting (assets/environments/sunny-city-avenue, qa/env.mjs). Our car drives toward us (+z) in
// its lane (x -1.9); the blue car comes the other way.
//
//   node storyboards/series/never-looks-up/make-ep6b-car-crash-city.mjs -> never-looks-up-car-crash-city.json
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { rigRotation, rigToWorld, rigState, ROADSTER } from "../../../engine/page/vehicle.js";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, prop } = c;
const END = 8.5;   // review B (Fable): the "mm-hm." payoff by ~7.2 s
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (x) => x * x * (3 - 2 * x);
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- the clock: clip time t -> story time u
const S = 0.2;
const SLOW = [0.75, 0.95, 2.6, 2.8];          // ease in, slow, ease out (clip time)
const rate = (t) => {
  if (t < SLOW[0]) return 1;
  if (t < SLOW[1]) return 1 + (S - 1) * sm(lin(t, SLOW[0], SLOW[1]));
  if (t < SLOW[2]) return S;
  if (t < SLOW[3]) return S + (1 - S) * sm(lin(t, SLOW[2], SLOW[3]));
  return 1;
};
const DT = 1 / 600, UT = [0];
for (let i = 1; i <= Math.ceil((END + 0.5) / DT); i++) UT.push(UT[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT);
const U = (t) => { const k = Math.min(UT.length - 2, Math.max(0, Math.floor(t / DT))), f = t / DT - k; return UT[k] + (UT[k + 1] - UT[k]) * f; };
const Tof = (u) => { let lo = 0, hi = UT.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (UT[m] < u) lo = m; else hi = m; } return r3(hi * DT); };

// ---------------------------------------------------------------- cubic Hermite keys [u, v, slope]
const herm = (K, u) => {
  if (u <= K[0][0]) return K[0][1];
  if (u >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0; while (K[i + 1][0] < u) i++;
  const [t0, v0, m0] = K[i], [t1, v1, m1] = K[i + 1], h = t1 - t0, s = (u - t0) / h;
  return (2 * s ** 3 - 3 * s ** 2 + 1) * v0 + (s ** 3 - 2 * s ** 2 + s) * h * m0 + (-2 * s ** 3 + 3 * s ** 2) * v1 + (s ** 3 - s ** 2) * h * m1;
};
const integ = (K, z0, uMax = 9, du = 0.002) => { const T = [[0, z0]]; for (let u = 0, z = z0; u < uMax; u += du) { z += du * herm(K, u + du / 2); T.push([r3(u + du), z]); } return (u) => T[Math.min(T.length - 1, Math.max(0, Math.round(u / du)))][1]; };

// ---------------------------------------------------------------- our car (the red roadster), story time
const LANE = -1.9, Z0 = Number(process.env.Z0 ?? -22);   // the painting's floor starts at z -1 (its camera looks up 11 degrees): the whole action plays beyond it
const PASS = 1.0;                              // the near miss (story time)
// forward speed: cruising, braking from the swerve, a hard stop
const SPEED = [[0, 8.5, 0], [0.3, 8.5, 0], [PASS, 6.0, -4], [1.7, 2.6, -4.5], [2.35, 0, 0], [9, 0, 0]];
const zAt = integ(SPEED, Z0);
// sideways (+x its left): the yank left across the centre line round the blue car, then the skid on that side
const SIDE = [[0, LANE, 0], [0.12, LANE, 0.6], [0.55, -0.1, 5.0], [PASS, 1.3, 1.6], [1.6, 1.62, 0.25], [2.35, 1.7, 0], [9, 1.7, 0]];
// yaw (+ nose left): it points where it goes, plus the tail stepping out under the hard braking
const SLIP = [[0, 0, 0], [1.1, 0, 0], [1.6, -7, -6], [2.3, -6, 0], [2.6, -5, 0], [9, -5, 0]];
const heading = (u) => {
  const h = 0.004, vx = (herm(SIDE, u + h) - herm(SIDE, u - h)) / (2 * h), vz = Math.max(0.6, herm(SPEED, u));
  return Math.atan2(vx, vz) / D2R * sm(lin(herm(SPEED, u), 0.2, 2.5));
};
// body roll leaning out of the swerve (- tips toward +x), a nose dive under braking (pitch + is nose down here? kept
// small either way), the front wheels
const ROLLK = [[0, 0, 0], [0.15, 0, 0], [0.35, 3.5, 0], [0.75, -3, 0], [1.15, 1.5, 0], [1.6, -1, 0], [2.35, 0.8, 0], [2.6, -0.3, 0], [2.8, 0, 0], [9, 0, 0]];
const PITCHK = [[0, 0, 0], [0.3, 0, 0], [0.5, 1.2, 0], [1.2, 1.6, 0], [2.3, 2.2, 0], [2.45, -1.2, 0], [2.65, 0.4, 0], [2.8, 0, 0], [9, 0, 0]];
const STEER = [[0, 0, 0], [0.06, 0, 0], [0.22, 85, 0], [0.55, 10, 0], [0.85, -55, 0], [1.2, -20, 0], [1.6, 25, 0], [2.0, -10, 0], [2.4, 0, 0], [9, 0, 0]];
const PIVOT = [0, 0.55, 0];
const carAt = (t) => {
  const u = U(t);
  return { at: r3(t), pos: [r3(herm(SIDE, u)), 0, r3(zAt(u))], roll: r3(herm(ROLLK, u)), pitch: r3(herm(PITCHK, u)), yaw: r3(heading(u) + herm(SLIP, u)), steer: r3(herm(STEER, u)) };
};
const keys = []; for (let f = 0; f <= Math.round(END * 30); f++) keys.push(carAt(f / 30));
const rig = { id: "car", kind: "roadster", color: "#ec4b3c", pivot: PIVOT, keys };
const speedKeys = []; for (let f = 0; f <= Math.round(END * 30); f++) { const t = f / 30, u = U(t); speedKeys.push([r3(t), r3(herm(SPEED, u) * rate(t))]); }
const W = (t, q) => rigToWorld(rig, t, q).map(r3);

// ---------------------------------------------------------------- the blue car (a prop: the physics bake takes it at the kerb)
// it comes the other way at 10 m/s, already over the centre line, drifting into our lane; after the miss its driver...
// (nobody: tinted) it keeps drifting toward the far kerb; the tail swings out (the nose turns back toward +x) so it
// slides sideways, right side first, into the kerb: the bake trips it and rolls it down the street
const HV = 10, HZ0 = r3(zAt(PASS) + HV * PASS);   // (it keeps 10 m/s up to the miss)
const HX = [[0, 0.95, -2.6], [PASS, -1.25, -2.3], [1.3, -1.85, -0.6], [1.65, -1.4, Number(process.env.HXS ?? 2.2)]];
const HROT = [[0, 194.5, 0], [PASS, 193, 0], [1.08, 195, 60], [1.35, 212, 90], [1.65, 245, 120]];
const HTP = Number(process.env.HTP ?? 1.55);   // story time the bake takes it: its tyres dig in sideways and it trips
// it scrubs speed in the spin-out (sliding sideways)
const HSPEED = [[0, HV, 0], [PASS, HV, 0], [1.65, 6.5, -6]], hzAt = integ(HSPEED, 0);
const hAt = (u) => ({ x: herm(HX, u), z: HZ0 - hzAt(u), rot: herm(HROT, u) });

// checks: the gap at the miss; where the blue car is when the bake takes it
{
  let near = { d: 9 };
  for (let f = 0; f <= 1.6 * 120; f++) {
    const u = f / 120, t = Tof(u), h = hAt(u), cr = Math.cos(h.rot * D2R), sr = Math.sin(h.rot * D2R);
    for (let x = -1.08; x <= 1.08; x += 0.12) for (let z = -1.86; z <= 1.98; z += 0.12) {
      if (Math.abs(x) < 1.0 && Math.abs(z) < 1.8) continue;
      const w = W(t, [x, 0.5, z]), dx = w[0] - h.x, dz = w[2] - h.z;
      const lx = dx * cr - dz * sr, lz = dx * sr + dz * cr;   // into the blue car's frame
      const d = Math.max(Math.abs(lx) - 1.1, Math.abs(lz) - 1.65);
      if (d < near.d) near = { d, u };
    }
  }
  const h = hAt(HTP);
  console.log(`miss: bodies ${near.d.toFixed(2)} m apart at u ${near.u.toFixed(2)} (t ${Tof(near.u)}); our car z ${zAt(0).toFixed(1)} -> pass ${zAt(PASS).toFixed(1)} -> stop ${zAt(3).toFixed(1)}, x ${herm(SIDE, 3)}`);
  console.log(`blue car: z0 ${HZ0}, bake at u ${HTP} (t ${Tof(HTP)}) at x ${h.x.toFixed(2)} z ${h.z.toFixed(2)} rot ${h.rot.toFixed(0)}`);
}
const TP = Tof(HTP);

// ---------------------------------------------------------------- the cast in the car (car frame: x its left, z its front)
const SEAT_Y = 0.18, SEAT_Z = -0.32, PHX_X = -0.47, DRA_X = 0.47;
const AT_PHONE = [0.03, -1];
const PH_Y = 0.33, PH_Z = 0.45;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const WHEEL_L = { prop: "wheel", grip: "L" }, WHEEL_R = { prop: "wheel", grip: "R" };
const ROAD_AHEAD = [0, 0.02], AT_BLUE = [-0.35, 0.0], AT_PHX = [-0.6, -0.08];
const cast = [
  { id: "phx", character: "duo/phoenix", rig: "car", at: [PHX_X, SEAT_Z + 0.03], face: "camera", expr: "kind", seed: 1.7, span: 0, shadowFall: 0.001, follow: 0.3,
    belt: { side: "R" }, arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "dra", character: "potatobrawl/dragon", rig: "car", at: [DRA_X, SEAT_Z + 0.03], face: "camera", expr: "kind", seed: 4.1, shadowFall: 0.001, follow: 0.4, sway: 0.7,
    belt: { side: "L" }, arms: { R: WHEEL_R, L: WHEEL_L }, grip: { R: "hold", L: "hold" } },
];

// where the wreck comes to rest (from the bake: node qa/... layout, BLAST_AT env to override while tuning)
const BLAST_T = Number(process.env.BLAST_T ?? 4.6);
const REST = (process.env.REST ?? "1.75,1.0,-26.6").split(",").map(Number);
const TYRE_GO = BLAST_T + 0.03;

const props = [
  { id: "seatP", kind: "carseat", rig: "car", x: PHX_X, y: SEAT_Y, z: SEAT_Z },
  { id: "seatD", kind: "carseat", rig: "car", x: DRA_X, y: SEAT_Y, z: SEAT_Z },
  { id: "wheel", kind: "steer", rig: "car", x: DRA_X, y: 0.9, z: 0.25, tip: 34 },
  // the phone: dark, in both his gloves, a bright screen that lights his face (Jonny 5 Nov); we never see the screen
  { id: "phone", kind: "phone", rig: "car", x: PHX_X, y: 1.05, z: SEAT_Z + 0.45, rot: 180, tip: -14, scale: 1.9, case: "#2a2d36", bright: 2.4, halo: 0.45, haloK: 0.45 },
  // the blue car, its own spot at frame 0 (the tweens below drive it until the bake takes it)
  { id: "blue", kind: "citycar", color: "#3d7fd6", x: r3(hAt(0).x), z: HZ0, rot: r3(hAt(0).rot), body: { shape: "hull", density: 250, bounce: 0.15, friction: Number(process.env.HFR ?? 0.8) } },
  // the kerbs along both pavements (the painting's own kerb lines), solid for the bake
  // the blast, the fire after it, the wheel it throws (under the road until then)
  { id: "blast", kind: "carburst", x: REST[0], y: 0.3, z: REST[2], at: BLAST_T, r: 2.6 },
  { id: "fire", kind: "firesmoke", x: REST[0], y: 0.4, z: REST[2], w: 2.6, h: 8 },
  { id: "tyre", kind: "cartyre", x: REST[0] + 1.0, y: -3, z: REST[2] + 1.0, rot: 0, body: { shape: "hull", density: 400, bounce: 0.35, friction: 0.9 } },
];

// the blue car's drive (story time -> every clip frame), its wheels turning with the distance
{
  let len = 0, last = hAt(0);
  for (let f = 1; f <= Math.round(TP * 30); f++) {
    const t = f / 30, u = U(t), h = hAt(u);
    len += Math.hypot(h.x - last.x, h.z - last.z); last = h;
    const steer = u < PASS ? -6 : u < 1.08 ? 0 : 28 * sm(lin(u, 1.08, 1.2));
    prop(r3(t - 1 / 30), "blue", { x: r3(h.x), z: r3(h.z), rot: r3(h.rot), len: r3(len), bend: r3(steer) }, r3(1 / 30), "linear");
  }
}
// from here the bake owns it, with the speed and turn its drive had (story time = clip time by now)
// plus the trip: its right tyres catch the kerb, which lifts that side and starts it rolling over it (toward -x)
const TRIP_UP = Number(process.env.TUP ?? 1.6), TRIP_ROLL = Number(process.env.TROLL ?? -6.5);
{ const h = 0.01, a = hAt(HTP - h), b = hAt(HTP + h); c.throw(TP, "blue", { v: [r3((b.x - a.x) / (2 * h)), TRIP_UP, r3((b.z - a.z) / (2 * h))], spin: [0, r3(((b.rot - a.rot) / (2 * h)) * D2R), TRIP_ROLL] }); }
// the blast: it jolts the wreck, burns the paint, throws the front wheel off toward us
c.knock(BLAST_T, "blue", { v: [0.1, 1.4, 0.2], spin: [0.2, 0, -0.3] });
prop(BLAST_T, "blue", { scorch: 1 }, 0.35, "out");
prop(BLAST_T, "blue", { broken: 1 }, 0);
prop(BLAST_T, "blast", { on: 1 }, 0);
prop(BLAST_T + 0.15, "fire", { fire: 1 }, 0.5, "out");
// the fire rides the wreck as the blast rocks it (its spots from the bake: out/<id>.layout.json)
for (const [t, x, z] of [[4.8, 1.79, -26.57], [5.2, 2.03, -26.54], [5.6, 2.63, -26.67], [6.0, 3.0, -27.0], [6.4, 3.12, -27.27], [7.2, 3.05, -27.16], [8.0, 2.83, -26.75]]) prop(r3(t - 0.4), "fire", { x, z }, 0.4, "linear");
prop(r3(TYRE_GO - 0.02), "tyre", { x: REST[0] + 1.6, y: 0.5, z: REST[2] + 1.0, rot: 0, tip: 0, tilt: 0 }, 0);
c.throw(TYRE_GO, "tyre", { v: [Number(process.env.TVX ?? 0.2), 3.2, Number(process.env.TVZ ?? 5.0)], spin: [15, 0, 0] });

// ---------------------------------------------------------------- Phoenix: on the phone from frame 0, the whole way
for (const w of ["phx", "dra"]) A(0, w, "sit", { seat: w === "phx" ? "seatP" : "seatD", dur: 0, hands: "keep" });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0 });
A(0, "phx", "face", { lid: 0.55, dur: 0 });
prop(0, "phone", { glow: 1 }, 0);
act.blinksAt(c, "phx", [0.5, 3.4, 6.4]);
act.scrollPhone(c, "phx", [0.25, 0.6, 3.0, 3.9, 5.1, 7.9]);
// the slow-motion swipe (the zoom): one long slow flick while the blue car slides past his elbow
A(1.55, "phx", "grip", { side: "R", shape: "scroll", dur: 0.45 });
A(2.25, "phx", "grip", { side: "R", shape: "hold", dur: 0.35 });
c.textPop(1.6, "phx", "swipe", { dur: 0.9, dx: -0.7, dy: -0.6 });
sfx(1.6, "kenney/scroll", { gain: 0.6, reason: "his slow-motion swipe, the blue car sliding past behind him" });
// the ping, a tiny smile at the phone, his "heh."
sfx(5.45, "notify", { gain: 0.5 });
A(5.5, "phx", "expr", { expr: "happy", set: { curve: 0.5 }, dur: 0.2 });
A(5.5, "phx", "face", { lid: 0.6, dur: 0.2 });
c.say(5.6, "phx", "heh.", 0.35, "calm", { sub: "heh.", pos: 760 });
// "Did you SEE that?!" ... "mm-hm." (a swipe, never a look up)
c.say(7.15, "phx", "mm-hm.", 0.45, "calm", { sub: "mm-hm.", pos: 760 });
act.scrollPhone(c, "phx", [7.2]);
A(7.2, "phx", "expr", { expr: "kind", set: { curve: 0.3, eye: 0.95 }, dur: 0.25 });

// ---------------------------------------------------------------- Dragon
// frame 0: he sees the blue car coming and screams (the hook line, with the horn)
A(0, "dra", "look", { to: AT_BLUE, dur: 0, blink: false });
A(0, "dra", "expr", { expr: "shocked", set: { open: 0.75, eye: 1.4 }, dur: 0 });
A(0, "dra", "face", { brow: 0.6, dur: 0 });
c.say(0.0, "dra", "CAR!", 0.4, "excited", { sub: "CAR!!" });
act.blinksAt(c, "dra", [4.0, 6.05]);
A(0.15, "dra", "squash", { amount: 0.05, dur: 0.2 });
// the wheel follows STEER
for (let t = 0; t < END - 0.05; t += 0.1) prop(r3(t), "wheel", { tilt: r3(0.6 * herm(STEER, U(t + 0.1))) }, 0.1, "linear");
// in slow motion: the scream stretched out, his eyes following the blue car past Phoenix
c.say(0.95, "dra", "nooooo", 1.5, "excited", { sub: "NOOOOO", gain: 0.85 });
c.captions[c.captions.length - 1].to = 2.35; // off Phoenix's face as the zoom closes in
A(1.0, "dra", "expr", { expr: "shocked", set: { open: 0.95, eye: 1.45 }, dur: 0.4 });
A(1.3, "dra", "look", { to: [-0.55, 0.05], dur: 0.6, blink: false });
A(2.0, "dra", "look", { to: [-0.75, 0.1], dur: 0.5, blink: false });
A(2.3, "dra", "squash", { amount: 0.05, dur: 0.3 });
// real speed again: braking hard, then he twists round in his seat to watch the blue car roll
A(2.85, "dra", "look", { to: [-0.85, 0.05], dur: 0.25, blink: false });
A(3.65, "dra", "squash", { amount: 0.06, dur: 0.22 });                   // the stop
c.arm(3.75, "dra", "R", { o: [-0.06, 0.48, 0.26] }, 0.3, "inOut");   // both hands up off the wheel, frozen in shock                           // hands off the wheel, then he twists round
c.arm(3.8, "dra", "L", { o: [0.1, 0.72, 0.2] }, 0.3, "inOut");
A(3.85, "dra", "turn", { to: -38, dur: 0.4 });
// the blast: he jolts, terror
A(BLAST_T + 0.02, "dra", "squash", { amount: 0.1, dur: 0.25 });
A(BLAST_T + 0.02, "dra", "expr", { expr: "shocked", set: { open: 1.0, eye: 1.5 }, dur: 0.08 });
A(BLAST_T + 0.02, "dra", "face", { brow: 0.75, dur: 0.08 });
c.say(BLAST_T + 0.1, "dra", "AAAAH!", 0.7, "excited", { sub: "AAAAH!", pos: 760 });
// he turns from the fire to Phoenix, slowly, mouth hanging
A(5.3, "dra", "look", { to: AT_PHX, dur: 0.12, blink: false });
A(5.35, "dra", "turn", { to: -5, dur: 0.3 });
A(5.35, "dra", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.35, curve: -0.3 }, dur: 0.3 });
// "Did you SEE that?!", pointing back at the fire with his far glove
c.arm(6.05, "dra", "L", { o: [0.42, 1.0, -0.2] }, 0.3, "out");
c.say(6.1, "dra", "did you see that", 0.9, "excited", { sub: "Did you SEE that?!", pos: 760 });
A(6.1, "dra", "expr", { expr: "shocked", set: { open: 0.8, eye: 1.45 }, dur: 0.15 });
A(6.1, "dra", "squash", { amount: 0.06, dur: 0.18 });
// "mm-hm.": the jaw hangs, then the glare to the cut
A(7.35, "dra", "expr", { expr: "shocked", set: { open: 0.7, eye: 1.2, curve: -0.5 }, dur: 0.2 });
act.mood(c, 7.6, "dra", "angry", { hold: 0.6 });   // review B: the glare is its own face, brows in, held to the cut
see(0, 0.7, ["phx.face", "dra.face", "blue"], "B1: the blue car over the line, both of them in the car, at frame 0");
see(1.2, 2.5, ["phx.face", "phone"], "the slow-motion swipe while the blue car slides past");
see(BLAST_T, BLAST_T + 0.8, ["dra.face", "phx.face"], "the blast behind them: Dragon jolts, Phoenix doesn't");
see(6.1, 8.0, ["dra.face", "phx.face", "phone"], "Did you SEE that?! / mm-hm.");

// ---------------------------------------------------------------- sound
sfx(0.0, "horn", { gain: 1.0, reason: "the blue car leans on its horn as it drifts into their lane" });
sfx(0.08, "screech", { dur: 0.65, gain: 0.7, reason: "Dragon yanks the wheel, the tyres squeal" });
sfx(0.55, "ai/slowmo-air", { gain: 2.5, reason: "time slowing down for the zoom on Phoenix" });
sfx(1.35, "whoosh", { dur: 1.1, gain: 0.6, reason: "the blue car sliding past his elbow in slow motion" });
sfx(2.75, "screech", { dur: 1.0, gain: 0.85, reason: "real speed again: the red car's brakes lock, it skids to a stop" });
const ENGINE = [[0, 3000, 0.7, 1], [0.1, 2200, 0.15, 1], [0.75, 2000, 0.2, 1], [2.8, 2000, 0.2, 1], [3.7, 900, 0.1, 1], [END, 900, 0.25, 1]].map(([t, ...v]) => [r3(t), ...v]);
// the blue car's crash (times from the bake: its tyres dig in and it trips, the roof hits the road, it settles)
sfx(TP, "screech", { dur: 0.35, gain: 0.7, reason: "the blue car's tyres dig in sideways as it trips" });
sfx(r3(TP + 0.04), "kenney/impact-metal-heavy", { gain: 0.8, reason: "the blue car's sill slams the road as it trips over" });
sfx(4.15, "hit-metal", { gain: 0.9, reason: "the blue car lands on its roof" });
sfx(4.15, "kenney/impact-glass-heavy", { gain: 0.6, reason: "its windows burst on the landing" });
sfx(4.6, "kenney/impact-metal-medium", { gain: 0.5, reason: "it rocks to a stop on its roof" });
// the blast
sfx(BLAST_T, "firework", { gain: 1.0, reason: "the blast's crack and boom" });
sfx(BLAST_T, "impact", { gain: 0.8, reason: "the deep boom under it" });
sfx(BLAST_T + 0.05, "flamejet", { gain: 0.7, reason: "the fireball rolling up" });
sfx(BLAST_T + 0.4, "rumble", { dur: 2.2, gain: 0.5, reason: "the fire roaring on behind them" });
c.at(BLAST_T, { fx: "shake", dur: 0.35, amp: 0.05 });

// ---------------------------------------------------------------- shots (every one looks into the painting: -z)
const look = (t, dy = 0.9) => W(t, [0, dy, 0]);
const beats = c.beats([
  // the hook: from ahead and above, the blue car's tail near us already over the line, the red car beyond it
  ["miss", 0, { pos: [0.2, 7.5, 8.0], look: [-0.4, 0.6, -14.5], fov: 27, to: { look: [-0.3, 0.6, -15.5], fov: 24 }, dur: 0.85, ease: "inOut" }, "hook"],
  // the zoom: in the car on Phoenix, the blue car sliding past behind him; it pushes in through the slow motion
  ["zoom", 0.85, { rig: "car", pos: [-1.0, 1.8, 3.4], look: [-0.95, 0.9, -0.3], fov: 40, to: { pos: [-0.85, 1.65, 2.7], look: [-0.62, 0.95, -0.3], fov: 30 }, dur: 1.9, ease: "inOut" }],
  // wide again at real speed: the red car skids to a stop, the blue car trips and rolls down the street behind it
  ["roll", 2.75, { pos: [2.4, 2.3, 2.5], look: [-0.8, 0.7, -18], fov: 30, to: { look: [-1.6, 0.7, -21] }, dur: 1.55, ease: "inOut" }, "escalation"],
  // the blast behind them and the ending, a three-quarter front on the two of them, the fire over Dragon's shoulder
  ["boom", 4.3, { pos: [1.0, 2.5, -1.0], look: [2.65, 1.2, -24], fov: 32, to: { pos: [1.0, 2.48, -1.4], fov: 29 }, dur: r3(END - 4.3), ease: "out" }, "payoff"],
], END);

write(import.meta.url, {
  id: "never-looks-up-car-crash-city" + (process.env.SBID ?? ""),
  title: "The friend who never looks up from his phone… even when a car explodes",
  idea: "Never Looks Up ep 6b (city): a blue car drifts into their lane; Dragon swerves, in slow motion it slides past Phoenix's elbow while he swipes; it spins out, trips on the kerb, rolls and explodes behind them. Phoenix: 'mm-hm.'",
  format: "series: The friend who never looks up (city car crash, Jonny's own ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 6.5,
  set: { type: "env", env: "sunny-city-avenue", ...(process.env.ENVCHECK === "0" && { envCheck: false }), shade: "soft", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, speed: speedKeys },
  rigs: [rig],
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0, wash: 0.09, pool: 0.15 } },
  music: { file: "ai/car-chase/car-chase-06.ogg", gain: 0.42, lowCut: 120, duck: { db: 9 }, until: SLOW[0], then: { file: "ai/car-chase/car-chase-06.ogg", from: 2.75, gain: 0.4 } },
  sound: { sfx: 0.7, ambience: 0.3, surface: "road", room: "open", guard: true, scenes: ["ui"], signature: { entrances: false }, engine: { keys: ENGINE, gain: 0.17, cyl: 4 } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "dra", "phone", "blue"], hint: 0, what: "a blue car is already over the centre line, coming straight at them; Dragon screams, Phoenix only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "seatP", from: 0, to: 10, reason: "Phoenix sits in his car seat, belted in" },
    { who: "dra", with: "seatD", from: 0, to: 10, reason: "Dragon sits in his car seat, belted in" },
    { who: "dra", with: "wheel", from: 0, to: 10, reason: "his gloves hold the steering wheel's rim" },
    { who: "dra", from: 0, to: 10, checks: ["face-covered"], reason: "his gloves on the wheel rim sit just under his eyes from the low front cameras" },
    { who: "dra", with: "seatP", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his folded wing tip presses against Phoenix's padded seat back beside him, behind his own body" },
    { who: "dra", with: "phx", from: 6.0, to: 10, checks: ["character-overlap"], reason: "turned to Phoenix after the blast, Dragon's glove rests on his arm (Did you SEE that?!)" },
    { who: "phx", with: "seatD", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his folded flame wing presses against Dragon's padded seat back beside him, behind his own body" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep6b-car-crash-city.mjs. Title added in TikTok's text tool.",
});
console.log(`END ${END}; slow ${SLOW}; bake at t ${TP}; blast ${BLAST_T}`);
