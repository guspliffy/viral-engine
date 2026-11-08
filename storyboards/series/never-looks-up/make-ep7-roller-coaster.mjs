// NEVER LOOKS UP, episode 7: ROLLER COASTER (8 Nov 2026). "The friend who never looks up from his phone… even on a
// roller coaster". Jonny 09:53: "we could do a keeps scrolling roller coaster short as well"; 10:35 his eight-panel
// board (video-scripts/2026-11-04-never-looks-up/07-roller-coaster-board/), which is the target: PANELS-ep7-roller-
// coaster.md has one row per panel, his CORRECTION-PROMPT wins where the board image missed it.
//
// THE BRIEF
//   Joke:        four friends ride a big seaside roller coaster; Phoenix promised to look up for the drop and scrolls
//                through the drop, the airtime hill and the loop where the car crawls over the top upside down and the
//                Dragon's popcorn pours out. The only thing that makes him look up is the ride-photo camera's flash.
//   Wants:       the Wizard wants Phoenix to look (and to survive); Phoenix wants the next video.
//   Consequence: he looks up exactly once, at the flash, one moment too late: "huh."
//   Ending:      the exit screen's ride photo: three friends screaming, Phoenix head down in his phone glow.
//   Callback:    0 s "I'll look up for the drop."; 10 s the photo proves he never did.
//
// World (x right, z the ride's direction): ONE straight run along +z on a hilltop (coaster-track.mjs), the hill's
// brink on the -x side with the seaside fair far below (set "hilltop": a painted sky all round; panels 01, 04 and 05
// hang the painted fair far behind the car on their own camera's rays, props-coaster.js farplate).
// Car frame (vehicle.js rig "car"): x its left, y up, z its front, the rail line under the car's middle at 0.
// Time: the ride runs at real speed from energy (speedProfile), clip time = story time until the flash; at the flash
// (8.0) time holds its breath until the ping (9.15, the series ending, as ep 6's freeze), then runs on.
//
//   node storyboards/series/never-looks-up/make-ep7-roller-coaster.mjs -> never-looks-up-roller-coaster.json
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { rigRotation, rigToWorld, rigState, rigOrigin } from "../../../engine/page/vehicle.js";
import { buildTrack, trackAt, eulerFor, speedProfile, LOOP } from "./coaster-track.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, prop } = c;
const END = 10.0, FPS = 30;
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (x) => x * x * (3 - 2 * x);
const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), sub = (a, b) => a.map((v, i) => v - b[i]);
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };

// ---------------------------------------------------------------- the clock: clip time t -> story time u
const FLASH = 8.0, PING = 9.15, EASE_F = 0.06;
const rate = (t) => {
  if (t < FLASH - EASE_F) return 1;
  if (t < FLASH) return 1 - sm(lin(t, FLASH - EASE_F, FLASH));
  if (t < PING) return 0;
  if (t < PING + 0.06) return sm(lin(t, PING, PING + 0.06));
  return 1;
};
const DT = 1 / 600, UT = [0];
for (let i = 1; i <= Math.ceil((END + 0.5) / DT); i++) UT.push(UT[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT);
const U = (t) => { const k = Math.min(UT.length - 2, Math.max(0, Math.floor(t / DT))), f = t / DT - k; return UT[k] + (UT[k + 1] - UT[k]) * f; };
const UF = U(FLASH);

// ---------------------------------------------------------------- the track and the car's run along it
const T = buildTrack();
const CREST = T.reduce((b, q) => (q.piece === "profile" && q.s < 45 && q.p[1] > b.p[1] ? q : b), T[0]);
const LOOPS = T.filter((q) => q.piece === "loop"), LOOP_IN = LOOPS[0].s, LOOP_OUT = LOOPS.at(-1).s;
const LOOP_TOP = LOOPS.reduce((b, q) => (q.p[1] > b.p[1] ? q : b));
const LOOP_C = [LOOP.shift / 2, (LOOPS[0].p[1] + LOOP_TOP.p[1]) / 2, LOOPS[0].p[2]];   // the loop's middle (world)
const V0 = speedProfile(T, { crestS: CREST.s, lift: 2.0, v0: 2.0 });
// brakes: from BRAKE_S metres along the track the brake fins slow the car at 6.5 m/s^2 (the riders lurch forward)
const BRAKE_S = LOOP_OUT + 10, BRAKE_A = 6.5;
const runFrom = (s0) => {   // story time -> metres along the track, in 1/600 s steps
  const S = [s0]; let s = s0, v = V0(s0);
  for (let i = 1; i <= Math.ceil((END + 0.5) / DT); i++) {
    v = s < BRAKE_S ? V0(s) : Math.max(1.6, v - BRAKE_A * DT);
    s += v * DT; S.push(s);
  }
  return S;
};
// s0: where the car's middle is at frame 0, so that it comes out of the loop just before the flash (the photo camera
// stands beside the run-out): s(UF) = LOOP_OUT + SF_PAST
const SF_PAST = 1.2;
let lo = CREST.s, hi = CREST.s + 4;
for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, S = runFrom(m), sF = S[Math.round(UF / DT)]; if (sF < LOOP_OUT + SF_PAST) lo = m; else hi = m; }
const S_RUN = runFrom((lo + hi) / 2);
const sAt = (u) => { const k = Math.min(S_RUN.length - 2, Math.max(0, Math.floor(u / DT))), f = u / DT - k; return S_RUN[k] + (S_RUN[k + 1] - S_RUN[k]) * f; };
const vAt = (u) => (sAt(u + 0.01) - sAt(u - 0.01)) / 0.02;
const tOfS = (s) => { for (let f = 0; f <= END * 600; f++) if (sAt(U(f / 600)) >= s) return r3(f / 600); return END; };

// the rig keys every frame (vehicle.js: pos is the rail line under the car's middle, pivot 0, Euler YXZ)
let prevE = null;
const carAt = (t) => {
  const q = trackAt(T, sAt(U(t))), e = eulerFor(q.f, q.u, prevE); prevE = e;
  return { at: r3(t), pos: q.p.map(r3), yaw: r3(e.yaw), pitch: r3(e.pitch), roll: r3(e.roll) };
};
const keys = []; for (let f = 0; f <= END * FPS; f++) keys.push(carAt(f / FPS));
const rig = { id: "car", kind: "coaster", pivot: [0, 0, 0], keys };
const W = (t, q) => rigToWorld(rig, t, q).map(r3);   // a car-frame point in the world at clip time t
const tIn = tOfS(LOOP_IN), tTop = tOfS(LOOP_TOP.s), tOut = tOfS(LOOP_OUT);
console.log(`track ${T.at(-1).s.toFixed(1)} m; crest s ${CREST.s.toFixed(1)} y ${CREST.p[1].toFixed(2)}; car s0 ${sAt(0).toFixed(2)} (${(sAt(0) - CREST.s).toFixed(2)} past the top), v0 ${vAt(0).toFixed(1)} m/s`);
console.log(`valley t ${tOfS(CREST.s + 18)}, loop in ${tIn}, top ${tTop} (v ${vAt(U(tTop)).toFixed(2)} m/s), out ${tOut}; flash: s ${sAt(UF).toFixed(1)} v ${vAt(UF - 0.05).toFixed(1)}`);
const hump = T.filter((q) => q.piece === "profile" && q.s > CREST.s + 15).reduce((b, q) => (q.p[1] > b.p[1] ? q : b));
console.log(`hump t ${tOfS(hump.s)} (y ${hump.p[1].toFixed(2)} z ${hump.p[2].toFixed(1)}); loop middle ${LOOP_C.map((v) => v.toFixed(2))}, top y ${LOOP_TOP.p[1].toFixed(2)}`);

// the car's acceleration (world, story time) at clip time t, for the loose things' physics
const accAt = (t) => {
  const u = U(t), h = 0.02, p = (uu) => trackAt(T, sAt(uu)).p;
  const a = p(u - h), b = p(u), cc = p(u + h);
  return [0, 1, 2].map((i) => (a[i] - 2 * b[i] + cc[i]) / (h * h));
};
for (const t of process.env.DBG ? [0.6, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 2.0, 2.3, 2.5, 2.9, 3.1, 3.3, 5.0, 5.4, 6.4, 6.8] : [0.5, 1.5, 2.2, tOfS(hump.s), tTop]) {
  const R = rigRotation(rigState(rig, t)), a = accAt(t), g = [0, -9.81, 0], rel = sub(g, a);
  const local = [0, 1, 2].map((j) => R[0][j] * rel[0] + R[1][j] * rel[1] + R[2][j] * rel[2]);   // R^T: world -> car
  console.log(`  felt gravity at ${t.toFixed(2)} s (car frame, g): ${local.map((v) => (v / 9.81).toFixed(2))}`);
}

// ---------------------------------------------------------------- the car and who sits where (props-coaster.js COASTER)
const C = { floor: 0.34, seatX: [-0.52, 0.52], rowZ: [0.55, -0.75], rise: 0.58, seatY: 0.3, barUp: 0.24, barZ: 0.44 };   // rise: the back row high enough that all four faces show (Jonny's panels; at 0.42 Phoenix's crest hid the Reaper's face in 01, 03 and 06)
const SIT = (row) => C.seatY + 0.42 + row * C.rise;            // the cushion top (car frame)
const PHX_X = C.seatX[0], WIZ_X = C.seatX[1], FRONT = C.rowZ[0], BACK = C.rowZ[1];
// eye targets (+ right on screen of the character's own view, + up)
const AT_PHONE = [0.03, -1];
const PH_Y = 0.33, PH_Z = 0.46;   // the phone's place in Phoenix's body frame: low over the lap bar at chest height, under his chin
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const BAR = (row) => ({ y: C.barUp + 0.0, z: C.barZ - 0.06 });   // the T-bar in the sitter's body frame (from the cushion)
// (o: [out from the side of the body, up, forward], mirrored per side: the same "out" puts both gloves on the bar)
const ON_BAR_R = { o: [-0.17, C.barUp + 0.05, C.barZ - 0.1] }, ON_BAR_L = ON_BAR_R;
const cast = [
  { id: "phx", character: "duo/phoenix", rig: "car", at: [PHX_X, FRONT + 0.03], face: "camera", expr: "kind", seed: 1.7, span: 0, shadowFall: 0.001, follow: 0.3,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", rig: "car", at: [WIZ_X, FRONT + 0.03], face: "camera", expr: "kind", seed: 2.6, shadowFall: 0.001, follow: 0.4,
    arms: { R: ON_BAR_R, L: ON_BAR_L } },
  { id: "rea", character: "notyet/reaper-noscythe", rig: "car", at: [PHX_X, BACK + 0.03], face: "camera", expr: "kind", seed: 3.3, shadowFall: 0.001, follow: 0.3,
    arms: { R: ON_BAR_R, L: ON_BAR_L } },
  { id: "dra", character: "potatobrawl/dragon", rig: "car", at: [WIZ_X, BACK + 0.03], face: "camera", expr: "kind", seed: 4.1, shadowFall: 0.001, follow: 0.4, sway: 0.7,
    arms: { R: { o: [-0.2, 0.75, 0.2] } } },
];

// ---------------------------------------------------------------- the world: track, car, photo camera, kiosk, the fair plates
const TRACK_PTS = T.filter((q, i) => i % 3 === 0 || i === T.length - 1).map((q) => [...q.p, ...q.u].map(r3));
// the photo camera: beside the run-out on Phoenix's side (-x), low, its lens on the car as it comes out of the loop
// (Jonny's panel 06 sees the car's right side, Phoenix nearest)
const PHOTO_S = sAt(UF) + 4.6, PHOTO_Q = trackAt(T, PHOTO_S), PHOTO = add(PHOTO_Q.p, [-2.25, 0, 0]);
const PHOTO_CAM = [r3(PHOTO[0] + 0.35), 3.25, r3(PHOTO[2] - 0.3)];   // at the faces: the back row shows over the front   // the shot's eye: low, just in front of the post (the lens's view)
// the SMILE sign where Jonny's panel 06 has it, in the frame's lower left at the photo: the photo shot's ray through
// that spot, down to the board's middle, stands it there. The camera looks across toward the track, so a sign low on
// the grass in that corner would stand in the car's way: it is a tall sign by the photo post instead, its board at
// riders' eye height (2.4 m), 1.6 m from the track's middle (30 cm clear of the car's side)
const SMILE = { w: 0.36, board: 2.4 }, SMILE_AT = (() => {
  const f = norm(sub(W(FLASH - 0.03, [0.35, 1.3, 0.1]), PHOTO_CAM)), r = norm([-f[2], 0, f[0]]), u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const th = Math.tan((30 * Math.PI) / 180), d = norm(add(add(f, r, -0.62 * th * (9 / 16)), u, -0.45 * th)), k = (SMILE.board + SMILE.w * 0.41 - PHOTO_CAM[1]) / d[1];
  return [r3(PHOTO_CAM[0] + d[0] * k), r3(PHOTO_CAM[2] + d[2] * k)];
})();
console.log(`smile sign at ${SMILE_AT}, ${(PHOTO_Q.p[0] - SMILE_AT[0]).toFixed(2)} m from the track's middle`);
// panel 06's background (the board: big trees and a red pennant behind the car): the open plateau left the ride photo
// all grass, so a clump of trees stands 20 m out and 5.5 m to the right of the photo camera's line (clear of the heads:
// review A), and a pennant to its left
const PH_H = (() => { const f = sub(W(FLASH - 0.03, [0.35, 1.3, 0.1]), PHOTO_CAM); return norm([f[0], 0, f[2]]); })();
const PH_BACK = add(add(PHOTO_CAM, PH_H, 20), [-PH_H[2], 0, PH_H[0]], 5.5), PH_FLAG = add(add(PHOTO_CAM, PH_H, 11), [PH_H[2], 0, -PH_H[0]], 3.2);
console.log(`photo background: trees round ${PH_BACK.map((v) => v.toFixed(1))}, pennant ${PH_FLAG.map((v) => v.toFixed(1))}, loop ${LOOP_C.map((v) => v.toFixed(1))}, cam ${PHOTO_CAM}, dir ${PH_H.map((v) => v.toFixed(2))}`);
const KIOSK = [7.5, 0, r3(trackAt(T, T.at(-1).s - 3).p[2])];
const seats = [];
C.rowZ.forEach((z, row) => C.seatX.forEach((x, i) => seats.push({ id: `seat${row}${i}`, kind: "carseat", rig: "car", x, y: r3(C.seatY + row * C.rise), z, width: 0.72, color: "#7a1b22", trim: "#d9a441", head: false })));   // coaster seats: high padded backs, no headrest (it hid the Dragon's eyes behind the Wizard)
const props = [
  { id: "track", kind: "coastertrack", x: 0, z: 0, pts: TRACK_PTS, ties: 0.45, supports: 3.6 },   // ties close enough that the loop reads as one track from shot 04 (review A)
  { id: "coaster", kind: "coastercar", rig: "car", x: 0, y: 0, z: 0, seatX: C.seatX, rowZ: C.rowZ, rise: C.rise, seatY: C.seatY },
  ...seats,
  // the phone: dark, in both his gloves, a bright screen that lights his face (Jonny 5 Nov); we never see the screen
  { id: "phone", kind: "phone", rig: "car", x: PHX_X, y: r3(SIT(0) + PH_Y + 0.02), z: r3(FRONT + PH_Z), rot: 180, tip: -30, scale: 1.9, case: "#2a2d36", bright: 2.2, halo: 0.3, haloK: 0.45 },
  // the popcorn bucket (props-cinema.js, at 0.6 size) in the Dragon's left glove
  { id: "bucket", kind: "cinemabucket", rig: "car", x: r3(WIZ_X + 0.44), y: r3(SIT(1) + 0.18), z: r3(BACK + 0.25), scale: 0.6, fill: 1 },
  { id: "photopost", kind: "photopost", x: PHOTO[0], z: PHOTO[2], rot: 180, h: 3.1 },
  // the "SMILE!" sign low in the corner of the photo camera's view, turned to it (Jonny's panel 06)
  { id: "smile", kind: "smilesign", x: SMILE_AT[0], z: SMILE_AT[1], rot: -15, ...SMILE, ...(process.env.RIDE_PHOTO && { scale: 0 }) },   // (left out of the ride photo itself: make-ep7-ride-photo.mjs)
  { id: "kiosk", kind: "photoscreen", x: KIOSK[0], z: KIOSK[2], rot: -90, photo: "assets/plates/coaster-ride-photo.webp", show: 1 },
  { id: "pennant1", kind: "pennant", x: r3(PHOTO[0] - 1.4), z: r3(PHOTO[2] - 6), h: 4.2 },
  { id: "pennant4", kind: "pennant", x: r3(PH_FLAG[0]), z: r3(PH_FLAG[2]), h: 4.6 },
  { id: "pennant2", kind: "pennant", x: KIOSK[0] + 1.2, z: KIOSK[2] - 2.6, h: 4.6 },
  { id: "pennant3", kind: "pennant", x: KIOSK[0] + 1.2, z: KIOSK[2] + 2.6, h: 4.6 },
];

// ---------------------------------------------------------------- shots (every outside shot pans with the car; ride cams are rig cameras)
const carMid = (t, dy = 1.2) => W(t, [0, dy, 0]);
const SHOTS = [];
const shot = (name, at, cam, kind) => SHOTS.push([name, r3(at), cam, kind]);
// 01 CREST 0-1.05: outside, ahead of the car and a little above it on its left (the Wizard's side), looking back and
// down at it on the crest, the hill and the fair far below behind it
// The camera dives with the car (a crane following the drop): it starts a little above the riders on the crest and
// keeps the same angle on them, 31 degrees over their eyeline and 6 m in front, as the nose tips down to 56 degrees, so
// all four faces stay in the frame and the back row shows over the front one. One straight move whose aim stays within
// 0.85 m of the car's curve (fitted with the car's own path). A camera that stays put sees the back row climb over the
// front one and loses Phoenix by 0.4 s; one that dives straight down looks up from under the nose and hides the back row.
const CREST_DEG = 31, CREST_EYE = [0.4, r3(1.0 + Math.sin((CREST_DEG * Math.PI) / 180) * 6), r3(-0.1 + Math.cos((CREST_DEG * Math.PI) / 180) * 6)], CREST_AIM = [0, 0.78, -0.1];   // (aimed low enough that the car's rim sits in the captions' safe zone)
const S1 = { pos: W(0, CREST_EYE), look: W(0, CREST_AIM), fov: 46 };   // the whole car with a margin either side (the board's medium-wide)
// (the straight move runs ahead of the car's curve in the middle, the aim up to 0.8 m low: a crane's swell lifts it
// back, 0.5 m on the lens and 0.8 m on the aim at 0.5 s, the handheld "dip" key used the other way round)
shot("crest", 0, { ...S1, to: { pos: W(1.05, CREST_EYE), look: W(1.05, CREST_AIM) }, dur: 1.15, ease: "linear", hand: { dips: [[0, -0.5, 1.05]], drift: 0 } }, "hook");
// 02 VICTIM CLOSE-UP 1.05-2.0: on the car, close on the Wizard from the front, a little low; the Dragon behind him
// (a little to Phoenix's side, so the Dragon shows over the Wizard's other shoulder; over the nose's rim)
shot("wizard", 1.05, { rig: "car", pos: [WIZ_X - 0.3, SIT(0) + 0.66, FRONT + 2.4], look: [WIZ_X + 0.02, SIT(0) + 0.54, FRONT], fov: 58, to: { pos: [WIZ_X - 0.3, SIT(0) + 0.66, FRONT + 2.3] }, dur: 0.95, ease: "inOut" });   // (far enough, and aimed low enough, that the car's rim under him is inside the captions' safe zone, clear of his body)
// 03 RIDE CAM 2.0-3.7: the on-ride camera on the car's nose facing both rows
// (a wide lens on a boom over the nose: both rows fill the narrow frame, the nose along the bottom)
shot("ride cam", 2.0, { rig: "car", pos: [0, SIT(0) + 1.75, FRONT + 2.4], look: [0, SIT(0) + 0.82, BACK + 0.3], fov: 72 });   // (high enough that the Wizard's sprout sits under the Dragon's chin, not across his mouth when he snaps the kernel)
// 04 WIDE LOOP 3.7-4.6: outside, a little elevated, the whole loop towering in the frame with the sea and the
// lighthouse behind it (the board's composition). 15 m out and 50 degrees round from side-on, so the loop reads as the
// board's tall oval and fits the narrow frame (side-on it is wider than the frame at this size); from the entry side,
// so the car climbs the loop's far half in the middle of the frame
const S4A = (-50 * Math.PI) / 180, S4D = 15;
const S4 = { pos: [r3(LOOP_C[0] + Math.cos(S4A) * S4D), 7.5, r3(LOOP_C[2] + Math.sin(S4A) * S4D)], look: [r3(LOOP_C[0]), 6.2, r3(LOOP_C[2])], fov: 44 };
shot("loop", 3.7, S4);
// the gulls circle far behind the loop on this shot's line (30-40 m off): small white birds over it, as on the board
{ const d = norm([S4.look[0] - S4.pos[0], 0, S4.look[2] - S4.pos[2]]), g = add(S4.pos, d, 35); props.push({ id: "gulls", kind: "gulls", at: [r3(g[0]), 17, r3(g[2])], r: 6, n: 5, size: 0.6 }); }
// 05 THE CRAWL 4.6-6.3: outside, in front of the upside-down car and 4 m under it, looking up: the hanging heads sit
// on the sky with the fair far below them (review A: level with it, the hilltop's grass filled the frame's lower half)
// (ahead of the car, just under the hanging heads, off to Phoenix's side, away from the falling side's shift, so no rail cuts across)
// (8 m out, on a longer lens: the car crawls over the top toward this camera and comes down the loop's near side at
// it, so from 4.4 m it filled the frame with its floor by 6.3 s; from here it stays a medium shot to the cut. 3.4 m
// to Phoenix's side, so the loop's near arc passes beside the riders' faces, not over them)
const S5 = { pos: [r3(LOOP_TOP.p[0] - 3.4), r3(LOOP_TOP.p[1] - 4.0), r3(LOOP_TOP.p[2] - 8.0)], look: [r3(LOOP_TOP.p[0]), r3(LOOP_TOP.p[1] - 0.95), r3(LOOP_TOP.p[2])], fov: 32 };
shot("upside down", 4.6, S5, "escalation");
// 06 PEAK 6.3-8.0 (the board: 7.0-8.0; past 6.3 the car comes down the loop's near side at the shot-05 camera and
// shows it only its floor, so the photo camera takes over and watches it drop out of the loop): the photo camera's view, low trackside front-left three-quarter; it pans with the car out of the loop
const T6 = 6.3;   // (a steady pan keeps the car within 12 degrees of the middle as it drops out of the loop)
shot("photo", T6, { pos: PHOTO_CAM, look: carMid(T6, 1.0), fov: 60, to: { look: W(FLASH - 0.03, [0.35, 1.3, 0.1]) }, dur: r3(FLASH - T6), ease: "linear" });
// 07 FLASH + LOOK-UP 8.0-9.2: medium close on Phoenix from his front-left, the friends frozen mid-scream behind
shot("look-up", FLASH, { rig: "car", pos: [PHX_X + 0.5, SIT(0) + 0.72, FRONT + 2.1], look: [PHX_X + 0.2, SIT(0) + 0.5, FRONT - 0.2], fov: 56 }, "payoff");   // (aimed low enough that the rim under the phone is in the safe zone for "huh.")
// 08 THE RIDE PHOTO 9.2-10.0: the exit kiosk straight on
// (close enough that the screen fills most of the width, as on the board: the photo is the punchline and must read
// on a phone)
shot("ride photo", 9.2, { pos: [r3(KIOSK[0] - 7.0), 2.5, KIOSK[2]], look: [KIOSK[0], 2.8, KIOSK[2]], fov: 40, to: { pos: [r3(KIOSK[0] - 6.3), 2.5, KIOSK[2]], look: [KIOSK[0], 2.72, KIOSK[2]] }, dur: 0.8, ease: "out" }, "reaction");   // a slow push in on the photo keeps the last shot alive (review A)

// the painted fair far below, hung on the outside shots' own rays (shown only in its shot)
const PITCH = -6.8;   // the painting's own view: its horizon sits 6.8 deg over its middle (seed 64)
const plateFor = (id, cam, src, shift, from, to) => {
  const d = norm(sub(cam.look, cam.pos)), yaw = Math.atan2(d[0], d[2]), p = (PITCH * Math.PI) / 180;
  const look = add(cam.pos, [Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p)], 10);
  props.push({ id, kind: "farplate", x: 0, z: 0, src, eye: cam.pos, look: look.map(r3), dist: 170, vfov: 46, shift, fade: 0.32, show: 0 });
  prop(r3(from), id, { show: 1 }, 0.01); prop(r3(to - 0.01), id, { show: 0 }, 0.01);
};
plateFor("plate1", S1, "assets/plates/coaster-fair.webp", [0.12, 0.08], 0, 1.05);
plateFor("plate4", S4, "assets/plates/coaster-fair-mirror.webp", [0.0, 0.0], 3.7, 4.6);
plateFor("plate5", S5, "assets/plates/coaster-fair.webp", [-0.05, 0.02], 4.6, T6);

// ---------------------------------------------------------------- loose things: real physics in the world's (inertial) frame
// Gravity plus air drag against the air: still air outside the car, the air carried along inside the car's tub below
// the riders' heads (its "air shadow"), so a kernel inside the car floats with it on the airtime hill and pours out at
// the loop's slow top, and one lifted over the heads meets the full wind. Integrated in story time (= clip time until
// the flash), written in the car's frame for props that ride the rig; at the flash they hold with everything else.
const carState = (t) => { const st = rigState(rig, t), R = rigRotation(st); return { R, o: rigOrigin(rig, st, R) }; };
const toCar = (st, w) => { const d = sub(w, st.o); return [0, 1, 2].map((j) => st.R[0][j] * d[0] + st.R[1][j] * d[1] + st.R[2][j] * d[2]); };
const toWorld = (st, q) => [0, 1, 2].map((i) => st.o[i] + st.R[i][0] * q[0] + st.R[i][1] * q[1] + st.R[i][2] * q[2]);
const velAt = (t, q) => { const a = toWorld(carState(t - 0.004), q), b = toWorld(carState(t + 0.004), q); return b.map((v, i) => (v - a[i]) / 0.008); };
// the still air: inside the tub, behind the nose up to just over its rim for the front row, up to the tops of the front
// riders' heads for the back row; above it the full wind of the ride
const SHADOW = (q) => {
  const top = q[2] > 0 ? SIT(0) + 0.58 : SIT(0) + 1.0;   // the back row: sheltered behind the front riders' heads
  const out = Math.max(Math.abs(q[0]) - 1.05, q[1] - top, q[2] - 1.5, -1.75 - q[2], 0); return Math.max(0, 1 - out / 0.25);
};
const T_HOLD = FLASH - EASE_F;   // the last moment the world moves before the flash holds it
// a free flight from car-frame q0 at clip time t0 with car-frame velocity vRel added to the car's own: car-frame
// samples every frame, to `until` (or the flash), then held through the freeze. k: drag (g / terminal speed^2)
function fly(t0, q0, vRel, { k = 0.6, until = T_HOLD, stop = null } = {}) {
  const st0 = carState(t0), R = st0.R;
  let x = toWorld(st0, q0), v = add(velAt(t0, q0), [0, 1, 2].map((i) => R[i][0] * vRel[0] + R[i][1] * vRel[1] + R[i][2] * vRel[2]));
  const out = [q0.map(r3)], sub8 = 8, dt = 1 / (FPS * sub8);
  let t = t0;
  while (t < until - 1e-9) {
    for (let j = 0; j < sub8; j++) {
      const q = toCar(carState(t), x), sh = SHADOW(q), air = sh > 0 ? velAt(t, q).map((z) => z * sh) : [0, 0, 0], rv = sub(v, air), sp = Math.hypot(...rv);
      v = add(v, [0, -9.81, 0].map((g, i) => g - k * sp * rv[i]), dt); x = add(x, v, dt); t += dt;
    }
    const q = toCar(carState(t), x); out.push(q.map(r3));
    if (stop && stop(q, t)) break;
  }
  return { t0: r3(t0), dt: r3(1 / FPS), out };
}
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// the bucket in the Dragon's left glove: its mouth (car frame) while he holds it up at his side
const BUCKET_H = 0.44 * 0.6, BUCKET = [r3(WIZ_X + 0.44), r3(SIT(1) + 0.18), r3(BACK + 0.25)];
const MOUTH = [BUCKET[0], r3(BUCKET[1] + BUCKET_H + 0.03), BUCKET[2]];
const DRA_MOUTH = [WIZ_X, r3(SIT(1) + 0.44), r3(BACK + 0.44)];   // the front of the Dragon's mouth (car frame, from the layout)
// where he snaps it: just in front of his mouth and a little to his left, so the kernel floats up from the bucket at
// his side out in front of his cheek (a straight float to the mouth itself went through the cheek)
const DRA_CATCH = add(DRA_MOUTH, [0.12, 0.04, 0.12]).map(r3);
const ks = [];   // popcornfly pieces
const keep = (f, hold = true) => {   // write a flight as a piece; hold it through the freeze when it is still in the air
  const p = f.out.flat(); if (hold && r3(f.t0 + (f.out.length - 1) * f.dt) >= T_HOLD - 0.04) for (let i = 0; i < Math.round((END - T_HOLD) * FPS); i++) p.push(...f.out.at(-1));
  ks.push({ t0: f.t0, dt: f.dt, p });
};
const gone = (q) => Math.abs(q[0]) > 6 || Math.abs(q[2]) > 9 || Math.abs(q[1]) > 9;
// (a) the drop: the wind gets under the heap and tears popcorn off the top, over the back row and away behind the car
for (let i = 0; i < 12; i++) {
  const t0 = r3(1.12 + i * 0.04 + hash(i) * 0.03), q0 = add(MOUTH, [0.02 + hash(i + 3) * 0.06, 0.03, (hash(i + 5) - 0.5) * 0.12]);   // off the heap's outer half
  keep(fly(t0, q0, [0.3 + hash(i + 7) * 0.5, 1.8 + hash(i + 9) * 1.4, 0.3 + hash(i + 11) * 0.6], { until: 2.0, stop: gone }), false);   // up and out to his left, over the side, never back across his head
}
// (b) the airtime hill: pieces float up out of the bucket weightless and hang round the faces; one drifts into the
// Dragon's open mouth (aimed: the kick that gets it there at T_CATCH, found by shooting)
const T_UP = 2.42;
// the kick that floats a kernel from the bucket's mouth into the Dragon's at T_CATCH, found by shooting (damped). It
// leaves the tipped bucket sideways and a little down, and the airtime lifts it into his mouth
const T_CATCH = 2.78;
const aim = (tc) => { let k = [-0.6, 0, 0.3], best = null; for (let it = 0; it < 80; it++) { const f = fly(T_UP, MOUTH, k, { until: tc }), e = sub(DRA_CATCH, f.out.at(-1)), d = Math.hypot(...e); if (!best || d < best.d) best = { k, d }; k = add(k, e, 0.25 / (tc - T_UP)); } return best.k; };   // (damped; the best shot of the run)
for (let i = 0; i < 9; i++) {
  const t0 = r3(T_UP + i * 0.025), q0 = add(MOUTH, [0.02 + hash(i + 20) * 0.05, 0.03, (hash(i + 21) - 0.5) * 0.1]);
  keep(fly(t0, q0, [0.4 + hash(i + 22) * 0.4, 0.25 + hash(i + 23) * 0.4, -0.15 + hash(i + 24) * 0.45], { until: 3.75, stop: gone }), false);   // up and out past his cheek, clear of his head (he leans out toward them)
}
const kick = aim(T_CATCH);
const CATCH = fly(T_UP, MOUTH, kick, { until: T_CATCH });
keep(CATCH, false);
console.log(`catch at ${T_CATCH}: kick ${kick.map((v) => v.toFixed(2))} -> ${CATCH.out.at(-1)} (target ${DRA_CATCH})`);
// (c) the loop's slow top: everything loose falls out of the upside-down bucket and pours down toward the fair
const POUR = [r3(tTop - 1.0), r3(tTop + 0.55)];
for (let i = 0; i < 24; i++) {
  const t0 = r3(POUR[0] + (i / 23) * (POUR[1] - POUR[0]) + hash(i + 40) * 0.03), q0 = add(MOUTH, [0.02 + hash(i + 41) * 0.05, 0.0, (hash(i + 42) - 0.5) * 0.1]);
  keep(fly(t0, q0, [0.55 + hash(i + 43) * 0.3, 0.1 + hash(i + 44) * 0.3, (hash(i + 45) - 0.5) * 0.3], { until: 7.0, stop: gone }), false);   // tipped outward, clear of his head
}
props.push({ id: "popcorn", kind: "popcornfly", rig: "car", x: 0, y: 0, z: 0, ks });

// the bucket empties as they leave
prop(1.12, "bucket", { fill: 0.78 }, 0.5); prop(T_UP, "bucket", { fill: 0.62 }, 0.3); prop(POUR[0], "bucket", { fill: 0 }, r3(POUR[1] - POUR[0]), "in");

// the Wizard's hat: torn off on the drop. A loose body (drag for a hat, terminal speed about 6 m/s) lifted off his
// head by the gust, then the wind takes it back over the back row and away; hatOff is in his own frame (= the car's:
// he sits facing its front), its spin tumbles it
const T_HAT = 1.13, HAT_Q = [WIZ_X, r3(SIT(0) + 1.02), r3(FRONT + 0.03)];
const HAT = fly(T_HAT, HAT_Q, [0.3, 6.8, -0.6], { k: 0.45, until: 1.9 });   // the wind under the brim lifts it hard: over the Dragon's raised fist by about 20 cm (the back row sits 58 cm up)   // a light felt hat: it falls at about 4.7 m/s at most
HAT.out.forEach((q, i) => { if (i) A(r3(T_HAT + (i - 1) / FPS), "wiz", "hat", { off: sub(q, HAT_Q).map(r3), spin: [r3(-i * 3.5), r3(i * 2), r3(i * 1.5)], dur: r3(1 / FPS), ease: "linear", quiet: true }); });
A(1.9, "wiz", "hat", { on: false, off: [0, 0, 0], spin: [0, 0, 0], dur: 0, quiet: true });
console.log(`hat: from ${HAT_Q} to ${HAT.out.at(-1)} by 1.9 s`);
// under it, his sprout (a hatless head shows its sprout, as in Jonny's panels 03-08)
props.push({ id: "sprout", kind: "headsprout", rig: "car", x: WIZ_X, y: r3(SIT(0) + 0.98), z: r3(FRONT + 0.05), scale: 0 });
prop(1.96, "sprout", { scale: 1.5 }, 0.01);   // as big as the others' sprouts
A(1.97, "wiz", "grab", { prop: "sprout", hand: "hat", keep: true });

// ---------------------------------------------------------------- sitting, holding, the lap bars down from frame 0
for (const [w, seat] of [["phx", "seat00"], ["wiz", "seat01"], ["rea", "seat10"], ["dra", "seat11"]]) A(0, w, "sit", { seat, dur: 0, hands: "keep" });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
// the bucket's own "sideL" hold, its point moved out to the bucket's skin (at "sideL" the palm sank 4 cm into it)
const BUCKET_GRIP = [0.27, 0.22, 0];
c.arm(0, "dra", "L", { prop: "bucket", grip: BUCKET_GRIP }, 0);
A(0, "dra", "grab", { prop: "bucket", hand: "L", grip: BUCKET_GRIP, pose: null });
prop(0, "phone", { glow: 1 }, 0.01);
prop(0, "coaster", { bar: 1 }, 0.01);
for (const id of ["pennant1", "pennant2", "pennant3"]) for (let t = 0; t < END; t += 0.5) prop(r3(t), id, { wave: r3(U(t + 0.5) * 1.0) }, 0.5, "linear");
for (let t = 0; t < END; t += 0.5) prop(r3(t), "gulls", { t: r3(U(t + 0.5)) }, 0.5, "linear");

// ---------------------------------------------------------------- PHOENIX: on the phone the whole ride, head bowed, lids half down
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.55, dur: 0 });
A(0, "phx", "pitch", { to: 10, dur: 0 });
act.scrollPhone(c, "phx", [0.5, 1.4, 2.3, 3.3, 4.4, 5.5, 6.6, 7.5]);
act.blinksAt(c, "phx", [1.9, 5.0]);
// 01 the promise, calm, at frame 0 (reach rules v3: the promise line at 0.0)
c.say(0.03, "phx", "ill look up for the drop", 0.9, "calm", { sub: null });
c.cap(0.03, 1.05, "I'll look up for the drop.", 1175);   // on the car's rim, under the front row's faces as the crane follows the car
see(0, 1.05, ["phx.face", "wiz.face", "rea.face", "dra.face", "phone"], "P01: the four friends tip over the top; Phoenix promises and only sees his phone");
// 03 the setup ping and a tiny smile: he's hooked
sfx(2.7, "notify", { gain: 0.3 });
A(2.75, "phx", "expr", { expr: "happy", set: { curve: 0.45, open: 0 }, dur: 0.2 });
A(3.25, "phx", "expr", { expr: "kind", set: { curve: 0.2, eye: 0.95 }, dur: 0.25 });

// ---------------------------------------------------------------- THE WIZARD: terrified from frame 0, the victim
A(0, "wiz", "expr", { expr: "terrified", dur: 0 });
A(0, "wiz", "look", { to: [0.05, -0.45], dur: 0, blink: false });   // down the drop
A(0, "wiz", "face", { corner: -0.6, dur: 0 });
// 02 the plunge: both gloves up, the scream, the hat goes
// arms up in a V, wider than the hat brim (o: [out from the side of the body, up, forward]; his R arm is on Phoenix's side)
const ARMS_UP = { o: [0.12, 0.9, 0.12] };
c.arm(1.08, "wiz", "R", ARMS_UP, 0.22, "out");
c.arm(1.08, "wiz", "L", ARMS_UP, 0.22, "out");
A(1.1, "wiz", "expr", { expr: "terrified", set: { open: 1.0, eye: 1.35 }, dur: 0.12 });
A(1.1, "wiz", "look", { to: [-0.7, -0.25], dur: 0.12, blink: false });   // at Phoenix (his right, down at the phone): the scream is about him
c.at(1.1, { fx: "speedlines", dur: 0.85, color: "#ffffff", alpha: 0.55, inner: 470, center: [540, 760] });   // the plunge's wind streaks (the board's sky)
c.say(1.12, "wiz", "aaaaaah", 0.8, "excited", { sub: false, gain: 1.6 });   // over the wind on a phone speaker
c.cap(1.12, 1.98, "AAAAH!!", 1258);   // on the car's rim under him
see(1.1, 1.95, ["wiz.face"], "P02: the Wizard screams in the plunge, his hat torn off");
// 03 the airtime hill: he reaches across to shake Phoenix, the pull-out's G pins his arm back, then it floats
A(2.02, "wiz", "look", { to: [-0.8, -0.1], dur: 0.12, blink: false });
c.arm(2.05, "wiz", "R", { o: [0.2, 0.42, 0.28] }, 0.25, "out");   // short of Phoenix: he can't reach him
c.arm(2.05, "wiz", "L", ON_BAR_L, 0.25, "inOut");
c.arm(2.3, "wiz", "R", { o: [0.08, 0.26, -0.02] }, 0.12, "in");     // the G slams it back and down
c.arm(2.55, "wiz", "R", { o: [0.18, 0.55, 0.2] }, 0.25, "out");      // weightless: it floats up
c.arm(3.1, "wiz", "R", ON_BAR_R, 0.3, "inOut");
see(2.05, 3.6, ["wiz.face", "phx.face", "dra.face", "phone"], "P03: on the airtime hill the Wizard reaches for Phoenix, popcorn floats, Phoenix scrolls");
// 05 upside down: he waves an open glove between Phoenix's eyes and the phone, "LOOK!!"
A(4.95, "wiz", "look", { to: [-0.9, -0.2], dur: 0.12, blink: false });
c.arm(5.0, "wiz", "R", { o: [0.28, 0.45, 0.4] }, 0.3, "out");   // beside Phoenix's face, between his eyes and the phone
A(5.0, "wiz", "grip", { side: "R", shape: "flat", dur: 0.15 });
for (const [t, dx] of [[5.3, 0.04], [5.5, -0.04], [5.7, 0.04], [5.9, -0.04], [6.1, 0.04]]) c.arm(t, "wiz", "R", { o: [0.28 + dx, 0.45 + dx / 2, 0.4] }, 0.2, "inOut");
c.say(5.25, "wiz", "look look!", 0.7, "excited", { sub: false, gain: 1.6 });
c.cap(5.25, 6.0, "LOOK!!", 1245, false, { x: 230 });   // on the sky at the lower left, under the hanging heads (the board's mid left)
c.arm(6.35, "wiz", "R", ON_BAR_R, 0.3, "inOut");
see(5.0, 6.25, ["wiz.face", "phx.face", "phone", "rea.face", "dra.face"], "P05: upside down, the Wizard waves at Phoenix, popcorn pours out, Phoenix scrolls");
// 06 out of the loop: screaming, both arms up
c.arm(7.0, "wiz", "R", ARMS_UP, 0.25, "out");
c.arm(7.0, "wiz", "L", ARMS_UP, 0.25, "out");
A(7.0, "wiz", "expr", { expr: "terrified", set: { open: 1.0, eye: 1.35 }, dur: 0.15 });
see(7.3, 7.95, ["wiz.face", "rea.face", "dra.face", "phx.face", "phone"], "P06: the ride photo's moment: three screaming, Phoenix head down in his phone");

// ---------------------------------------------------------------- REAPER: eyes squeezed shut, gloves on the bar; one glaring eye at the Wizard
A(0, "rea", "face", { lid: 1, brow: 0.6, dur: 0 });
A(0, "rea", "pitch", { to: -8, dur: 0 });   // pressed back into his seat: his face tips up out of the hood's shadow
A(0, "rea", "lean", { to: 12, dur: 0 });   // and away to his right, out from behind Phoenix's crest (his gloves slide along the bar)
A(0, "rea", "expr", { expr: "shocked", set: { open: 0.08, curve: -0.45, eye: 0.6 }, dur: 0 });
A(5.35, "rea", "face", { lidL: 1, lidR: 0.15, brow: -0.5, dur: 0.15 });   // one eye opens to glare at the Wizard's yell
A(5.35, "rea", "look", { to: [0.8, -0.2], dur: 0.12, blink: false });
A(5.37, "rea", "expr", { expr: "annoyed", dur: 0.2 });
A(6.0, "rea", "face", { lid: 1, brow: 0.6, dur: 0.15 });   // and squeezes it shut again (the annoyed mouth stays: no new face to read once the photo camera has him under his hood)

// ---------------------------------------------------------------- THE DRAGON: loving it, arm up, popcorn
A(0, "dra", "expr", { expr: "delighted", set: { open: 0.55 }, dur: 0 });
A(0, "dra", "look", { to: [0.2, 0.3], dur: 0, blink: false });
act.blinksAt(c, "dra", [1.7, 4.3, 6.9]);   // placed blinks, none on a line
act.blinksAt(c, "wiz", [3.3, 6.7]);
A(0, "dra", "lean", { to: -10, dur: 0 });   // leaning out to his left, loving it: his face clears the Wizard's hat
A(0, "wiz", "lean", { to: 5, dur: 0 });   // the Wizard shrinks toward Phoenix on the crest: his hat tip clears the Dragon's face
A(1.05, "wiz", "lean", { to: 0, dur: 0.25 });
c.arm(0, "dra", "R", { o: [0.04, 1.0, 0.0] }, 0);   // his free fist straight up over his shoulder (Jonny's panels), clear of his own face
// 03 he catches a floating kernel in his mouth: gulp, cheeks full, happy
A(2.42, "dra", "look", { to: [-0.2, 0.0], dur: 0.12, blink: false });
A(2.45, "dra", "expr", { expr: "delighted", set: { open: 0.75 }, dur: 0.15 });   // mouth wide for it, held 0.33 s
A(T_CATCH, "dra", "expr", { expr: "happy", set: { open: 0, curve: 0.7, eye: 0.7 }, dur: 0.06 });
sfx(T_CATCH, "gulp", { gain: 0.6, reason: "the Dragon snaps the floating kernel out of the air" });
// 05 his popcorn pours out: dismay, he reaches after it
A(POUR[0], "dra", "look", { to: [0.3, -0.6], dur: 0.12, blink: false });
A(POUR[0] + 0.05, "dra", "expr", { expr: "shocked", set: { open: 0.6 }, dur: 0.15 });
// 06 cheeks full (he caught some), arm up again, and the near-empty bucket up at his shoulder on his outside, where the
// photo camera sees its stripes over the Wizard's shoulder (review A: down at his side it was hidden in the ride photo)
A(6.38, "dra", "look", { to: [0.5, 0.1], dur: 0.12, blink: false });   // eyes first, to the bucket
c.arm(6.5, "dra", "L", { prop: "bucket", grip: BUCKET_GRIP, at: [r3(WIZ_X + 0.62), r3(SIT(1) + 0.36), r3(BACK + 0.3)] }, 0.45, "inOut");   // (a hand's width off his cheek: at +0.5 it sank into his face)
A(7.0, "dra", "expr", { expr: "happy", set: { open: 0, curve: 0.75, eye: 0.6 }, dur: 0.15 });
A(7.0, "dra", "look", { to: [0.1, 0.2], dur: 0.12, blink: false });

// ---------------------------------------------------------------- 07 THE FLASH (8.0): time holds its breath; only Phoenix moves
c.at(FLASH, { fx: "flash", dur: 0.14, peak: 0.75, sound: false });
prop(r3(FLASH - 0.01), "photopost", { flash: 1 }, 0.02); prop(r3(FLASH + 0.04), "photopost", { flash: 0 }, 0.22, "out");
// the flash's starburst just inside the look-up shot's top right corner (Jonny's panel 07): the photo camera stands
// ahead of the car on its left, up high, just behind this camera's right shoulder, so its light flares in from there
{
  const L7 = SHOTS.find((x) => x[0] === "look-up")[2], d = norm(sub(L7.look, L7.pos)), rt = norm([d[2], 0, -d[0]].map((v) => -v)), up = norm([rt[1] * d[2] - rt[2] * d[1], rt[2] * d[0] - rt[0] * d[2], rt[0] * d[1] - rt[1] * d[0]]);
  const tv = Math.tan((L7.fov * Math.PI) / 360), th = tv * 1080 / 1920, q = add(L7.pos, add(add(d, rt, 0.78 * th), up, 0.82 * tv), 2.5);
  c.at(FLASH, { fx: "glint", pos: W(FLASH, q).map(r3), size: 0.9, dur: 0.6, turn: 0.4 });
}
sfx(FLASH, "flash", { gain: 0.8, reason: "the ride-photo camera fires" });
for (const w of ["wiz", "rea", "dra"]) A(r3(FLASH - 0.04), w, "still", { dur: r3(PING - FLASH + 0.04), idle: 0 });
A(8.05, "phx", "look", { to: [0.35, 0.7], dur: 0.12, blink: false });
A(8.05, "phx", "face", { lid: 0.12, dur: 0.12 });
A(8.05, "phx", "pitch", { to: -8, dur: 0.45, ease: "inOut" });   // his head comes up (eased, so the phone in his gloves rises with him)
A(8.05, "phx", "expr", { expr: "kind", set: { curve: 0, open: 0.28, eye: 1.15 }, dur: 0.15 });   // a small "o" (the board)
// the thumb stops and the phone sinks a hand's width as his head comes up, so the "o" shows over it (the board's 07)
const PH_DOWN = (p) => ({ x: [p.x[0], r3(PH_Y - 0.1), PH_Z], palm: [0, r3(PH_Y - 0.1), PH_Z] });
c.arm(8.05, "phx", "R", PH_DOWN(PHONE_R), 0.45, "inOut"); c.arm(8.05, "phx", "L", PH_DOWN(PHONE_L), 0.45, "inOut");
c.arm(9.0, "phx", "R", PHONE_R, 0.45, "inOut"); c.arm(9.0, "phx", "L", PHONE_L, 0.45, "inOut");
A(8.27, "phx", "blink", { dur: 0.18 });   // the double-take blink, open again before "huh." (8.5)
c.say(8.5, "phx", "huh.", 0.35, "calm", { sub: false, voice: true });
c.cap(8.5, 9.0, "huh.", 1255);   // under the phone, on the hull
see(8.1, 9.0, ["phx.face", "phone"], "P07: Phoenix looks up for the first time, at the flash: huh.");
A(9.0, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.55, dur: 0.15 });   // (the "o" closes into the ping's smile at 9.18)
A(9.0, "phx", "pitch", { to: 10, dur: 0.45, ease: "inOut" });   // eased: the phone in his gloves goes back down with him, no jump
sfx(PING, "notify", { gain: 0.34 });
A(r3(PING + 0.03), "phx", "expr", { expr: "happy", set: { curve: 0.5, open: 0 }, dur: 0.2 });
see(9.25, 9.95, ["kiosk"], "P08: the ride photo: three screaming, Phoenix head down");

// ---------------------------------------------------------------- sound
sfx(0.0, "latch", { gain: 0.7, reason: "the lift chain lets go of the car with its last clack" });
sfx(0.45, "windswell", { dur: 0.75, gain: 0.5, reason: "the wind rises as the car tips into the drop" });   // (it gives way to the Wizard's scream, then the roar comes in under the airtime hill: on a phone the wind drowned the scream)
sfx(1.88, "ridewind", { dur: 1.9, gain: 0.45, reason: "wind roar through the drop and over the airtime hill" });
sfx(r3(tTop - 1.2), "creak", { dur: 1.6, gain: 0.28, reason: "the track creaks as the car crawls over the top upside down" });
sfx(r3(POUR[0] + 0.2), "patter", { dur: 1.2, gain: 0.2, reason: "the popcorn rains down out of the bucket" });
sfx(r3(tOut - 0.5), "ridewind", { dur: 1.3, gain: 0.6, reason: "the car roars down out of the loop past the photo camera" });
sfx(9.25, "hiss", { dur: 0.7, gain: 0.45, reason: "the brakes hiss as the car runs into the station under the kiosk" });

const beats = c.beats(SHOTS, END);

write(import.meta.url, {
  id: "never-looks-up-roller-coaster",
  title: "The friend who never looks up from his phone… even on a roller coaster",
  idea: "Never Looks Up ep 7: Phoenix promises to look up for the drop and scrolls through the whole ride; the ride-photo flash is the only thing that makes him look up, one moment too late",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: FPS, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
  cover: 8.5,
  set: { type: "hilltop", edge: -12, center: [2, -12], size: [null, 70, -78, 60], aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, key: [-4, 7, 3],
    scatter: [
      { kinds: { tree: 2, bush: 3, flower: 2 }, zone: [[-13, -6], [-80, 40]], count: 36, clumps: 9, seed: 11 },
      { kinds: { tree: 3, bush: 2 }, zone: [[12, 40], [-60, 50]], count: 30, clumps: 7, seed: 12 },
      { kinds: { bush: 2, flower: 3, grass: 3 }, zone: [[3.5, 11], [-50, 40]], count: 40, clumps: 10, seed: 13 },
      { kinds: { tree: 4, bush: 1 }, zone: [[r3(PH_BACK[0] - 4), r3(PH_BACK[0] + 5)], [r3(PH_BACK[2] - 6), r3(PH_BACK[2] + 6)]], count: 9, clumps: 3, spread: 3, seed: 14 },   // behind the car in the ride photo
    ] },
  rigs: [rig],
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0, wash: 0.09, pool: 0.15 } },
  // the brief: fast surf rock with a fairground organ, cut to one held note at the flash, snapping back on the ping
  music: { style: "surf", lead: "whistle", lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: FLASH, part: "hold" }, { at: PING, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.3, room: "open", guard: true, scenes: ["ui"], flaps: false, signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "rea", "dra", "phone"], hint: 0, what: "four friends tip over the top of a huge roller coaster drop; three react, Phoenix only sees his phone" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["phx", "wiz", "rea", "dra"].map((w, i) => ({ who: w, with: seats[[0, 1, 2, 3][i]].id, from: 0, to: END, reason: "sits in the coaster seat" })),
    ...["phx", "wiz", "rea", "dra"].map((w) => ({ who: w, with: "coaster", from: 0, to: END, reason: "sits in the coaster car under its lap bar" })),
    { who: "dra", with: "popcorn", from: r3(T_CATCH - 0.1), to: r3(T_CATCH + 0.04), reason: "the Dragon snaps the floating kernel out of the air: it goes into his mouth and is gone" },
    { who: "dra", with: "bucket", from: 0, to: 6.7, reason: "the popcorn bucket hugged against his side under his arm (Jonny's panels 01-05): it sits in front of his body from every camera and never in front of his face; held out at arm's length the forearm went through its rim (tried 8 Nov)" },
    // staging the checks can't judge: say why each is fine
    { who: "phx", with: "wiz", from: 3.7, to: 4.6, checks: ["front"], reason: "the wide shot of the loop (panel 04): the whole car is a few centimetres tall on a phone, nobody's face reads in it, and Phoenix's smile fading is not the beat" },
    { who: "dra", from: 0, to: 1.05, checks: ["face-hidden"], reason: "the crest crane (panel 01): the Wizard's head crosses the Dragon's face for a few frames as the car tips; his face is clear the rest of the shot" },
    ...["wiz", "dra"].map((w) => ({ who: w, from: 6.9, to: 7.35, checks: ["face-hidden"], reason: "the car comes round the loop's way out behind its rails, just before the photo moment (7.3 s) when all four faces are clear" })),
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep7-roller-coaster.mjs. Title added in TikTok's text tool.",
});
