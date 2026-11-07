// NEVER LOOKS UP, episode 4: SHARK (4 Nov 2026). "The friend who never looks up from his phone… even with a shark circling him"
// Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip (04-shark/); series format
// 00-SERIES-FORMAT.md; the panel notes are PANELS-shark.md next to this file. The panels are the target.
//
// THE BRIEF
//   Joke:        a shark fin circles Phoenix's donut ring and pops it; he never looks up from his phone.
//   Wants:       the friends want him to get out of the water; the shark just wants to be noticed.
//   Consequence: his wings catch him and he hovers, still scrolling; the shark rises right under his phone, hoping.
//   Ending:      the series ending: he looks up, "huh.", back to the phone, ping; the shark sinks, crushed.
//   Callback:    the opening's threat (a fin circling him) ends as a lonely shark who wanted attention.
//
//   node storyboards/series/never-looks-up/make-ep4-shark.mjs
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import fs from "node:fs";

const FACES = "strong";
// V3=1: the reach rules v3 opening (7 Nov 2026, research/hook-curiosity-2026-11-07 "Reach rules v3"; writes
// never-looks-up-shark-v3rules.json). Only 0-1.95 s changes: a medium two-shot of the Wizard and Phoenix with the
// order "Look up! SHARK!" at 0.05 s, a cut at 1.2 s to Phoenix's close-up (smiling at his phone while the
// fin passes behind him: the reaction hold), then back to the wide. From there on it is the posted storyboard.
const V3 = !!process.env.V3;
// v3 also moves with today's template (Jonny 7 Nov: "the shark video isnt created by the new motion rules and the glow of
// the phone isnt there"): planted feet, follow-through, contact solver, hand/eye/hold rigs, physics, light 2 with half
// boil and no paper grain, the spike guard, and the bright phone screen that lights his face (as in ep 5).
const MOTION = V3 ? { feet: 2, overlap: true, timing: true, solve: true } : "natural";
const NOW = V3 ? { rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, cleanStart: true } : {};
const ENV = process.env.ENV ?? "turquoise-beach-shallows";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places (x right, z toward us; the open sea is -z)
// The painted water is the floor at y 0 and hides everything under it: the Wizard stands waist-deep at y -0.42, the
// shark swims with only its fin above the surface.
const RING = { x: -0.15, z: 2.3, rot: 25 };                    // Phoenix's donut ring, turned a little to screen right
const TOWER = { x: 0.55, z: 0.0, h: 1.5, w: 2.3, d: 0.9, gap: 0.9 };   // the painting's rocks stand right of it at z 1.4, x > 1.06
const TOP = TOWER.h + 0.03;                                  // the platform's floor
const FRONT = TOWER.z + TOWER.d / 2;                         // the platform's front edge
const LADDER_FOOT = [TOWER.x, FRONT + 0.25 + 0.36];          // where the Wizard stands to climb (body in front of the rungs)
const WADE = -0.42;                                          // waist-deep
const PHX = [RING.x, RING.z];
const WIZ0 = [-1.2, 0.8];
const WIZ_TOP = [TOWER.x - 0.62, TOWER.z - 0.08], REA_TOP = [TOWER.x + 0.64, TOWER.z - 0.1];   // 1.1 m apart: the hat brim clears Reaper
const NOODLE = { x: -1.75, z: 1.05, rot: 60 };

const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const SEAT = -0.25 + 0.42 - 0.12, LIFT = 0.55;   // open water under his feet once the ring is gone
const AT_PHONE = [0.03, -1];
const fwd = (at, yaw, d, side = 0) => [r3(at[0] + Math.sin(rad(yaw)) * d - Math.cos(rad(yaw)) * side), r3(at[1] + Math.cos(rad(yaw)) * d + Math.sin(rad(yaw)) * side)];
const PHONE_W = (() => { const [x, z] = fwd(PHX, RING.rot, 0.44); return [x, SEAT + 0.57, z]; })();

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX, face: RING.rot, expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 2.0,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: WIZ0, y: WADE, face: 30, expr: "kind", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA_TOP, y: TOP, face: -30, expr: "kind", follow: 0.25, seed: 3.1 },
];
const SHARK_S = 1.1, FIN_Y = -0.48;                              // only the fin shows at FIN_Y
const MEGA0 = { x: TOWER.x - 0.85, y: TOP + 0.38, z: FRONT - 0.02, rot: -150 };   // lying on the left front rail
const props = [
  { id: "ring", kind: "donutring", x: RING.x, y: -0.25, z: RING.z, rot: RING.rot },
  { id: "tower", kind: "guardtower", x: TOWER.x, z: TOWER.z, h: TOWER.h, w: TOWER.w, d: TOWER.d, gap: TOWER.gap, umbrellaX: 0, pole: 1.75 },
  { id: "shark", kind: "shark", x: PHX[0] + 0.9, y: FIN_Y, z: PHX[1], rot: 180, scale: SHARK_S, wag: 0.4 },
  { id: "wake", kind: "wakefoam", x: PHX[0] + 0.9, z: PHX[1], r: 0.38 },
  { id: "ringfoam", kind: "wakefoam", x: PHX[0], z: PHX[1], r: 0.62, on: 0.6 },
  { id: "wizfoam", kind: "wakefoam", x: WIZ0[0], z: WIZ0[1], r: 0.3, on: 0.8 },
  { id: "noodle", kind: "noodle", x: WIZ0[0] - 0.5, y: 0.5 + WADE, z: WIZ0[1] + 0.1, rot: 60, tilt: 0 },   // tucked by his right side
  { id: "mega", kind: "megaphone", ...MEGA0, scale: 1.5 },
  { id: "whistle", kind: "whistle", x: REA_TOP[0] + 0.15, y: TOP + 0.42, z: REA_TOP[1] + 0.3 },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.6, z: PHX[1] + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", ...(V3 && { bright: 2.6, halo: 0.55, haloK: 0.49 }) },   // v3: a bright screen that lights his face (Jonny 5 Nov); haloK under 0.5 so the contact checks skip the glow
  { id: "pop", kind: "splash", x: PHX[0] + 0.5, y: 0, z: PHX[1] + 0.35, n: 30, size: 1.0 },
  { id: "rise", kind: "splash", x: 0.32, y: 0, z: 3.0, n: 30, size: 1.0 },
  { id: "bubbles", kind: "bubbles", x: 0.32, y: 0, z: 3.0 },
];

// ---------------------------------------------------------------- Phoenix: in the ring, on the phone, from frame 0
A(0, "phx", "sit", { seat: "ring", dur: 0, hands: "keep", feet: [0.36, 0.08] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
A(0, "phx", "face", { lid: 0.55, dur: 0 });
act.blinksAt(c, "phx", [1.9, 4.6, 6.9]);
act.scrollPhone(c, "phx", [0.2, 1.1, 2.0, 3.0, 4.75, 5.6, 6.5, 7.3]);
prop(0, "phone", { glow: V3 ? 1 : 0.85 }, 0.01);

// ---------------------------------------------------------------- the fin: clockwise circles round the ring (seen from above)
// angle th: x = cx + r cos th, z = cz + r sin th; th grows from +x toward +z (toward us), which is clockwise from above
const finAt = (th, r) => ({ x: r3(PHX[0] + r * Math.cos(th)), z: r3(PHX[1] + r * Math.sin(th)), rot: r3((Math.atan2(-Math.sin(th), Math.cos(th)) * 180) / Math.PI) });
const unwrap = (() => { let last = null; return (rot) => { if (last != null) while (rot - last > 180) rot -= 360; if (last != null) while (rot - last < -180) rot += 360; last = rot; return rot; }; })();
const finPath = (t0, t1, th0, th1, r0, r1, step = 0.1) => {
  for (let t = t0; t < t1 - 1e-6; t += step) {
    const u1 = Math.min(1, (t + step - t0) / (t1 - t0)), th = th0 + (th1 - th0) * u1, r = r0 + (r1 - r0) * u1;
    const f = finAt(th, r);
    prop(t, "shark", { x: f.x, z: f.z, rot: unwrap(f.rot) }, Math.min(step, t1 - t), "linear");
    prop(t, "wake", { x: f.x, z: f.z }, Math.min(step, t1 - t), "linear");
  }
};
const TH0 = 2.0, TH1 = TH0 + Math.PI * 2 * 0.95;   // it starts front left of him, so it is round the far side before the Wizard wades past
{ const f = finAt(TH0, 0.95); prop(0, "shark", { x: f.x, z: f.z, rot: unwrap(f.rot), y: FIN_Y }, 0.01); prop(0, "wake", { x: f.x, z: f.z, on: 1 }, 0.01); }
finPath(0.01, 2.3, TH0, TH1, 0.95, 0.9);      // nearly a full lap
finPath(2.3, 4.2, TH1, Math.PI * 4 + 1.35, 0.95, 0.86);   // round again, closing in
// 4.2-4.6: it passes right under his dangling feet (in front of the ring) as he lifts them
finPath(4.2, 4.7, Math.PI * 4 + 1.35, Math.PI * 4 + 2.2, 0.86, 0.66);
// 4.7-5.3: it rubs along the ring's side, then the pop
finPath(4.7, 5.3, Math.PI * 4 + 2.2, Math.PI * 4 + 3.2, 0.66, 0.62);
sfx(0.1, "ai/dundun", { gain: 0.8, reason: "dö-döm: the fin cutting round him" });
sfx(4.85, "creak", { gain: 0.85, dur: 0.4, reason: "the fin rubs along the ring's rubber" });

// ---------------------------------------------------------------- 1 FIN 0-1.5 (P1)
const CAP_Y = 640;   // gibberish captions: in the sky, below the title's top 20 %
sfx(0, "waves", { gain: 0.35, dur: END, reason: "the beach's bed: small waves lapping" });
A(0, "wiz", "look", { to: [0.6, -0.4], dur: 0, blink: false });
if (V3) A(0, "wiz", "expr", { expr: "shocked", set: { open: 0.6, eye: 1.4 }, dur: 0 });   // frame 0 already shocked
act.shock(c, 0.02, "wiz", { open: 0.4, hold: 1.1 });
c.arm(0, "wiz", "L", { o: [0.25, 0.55, 0.3] }, 0);                    // pointing at the fin
A(0.05, "wiz", "talk", { line: "sha-ark!", dur: 0.55, tone: "excited", voice: false });
c.cap(0.05, 1.2, V3 ? "Look up! SHARK!" : "SHARK!!", V3 ? 470 : CAP_Y);   // v3: above the heads in the tighter two-shot
prop(0.1, "noodle", { y: 0.03, x: NOODLE.x, z: NOODLE.z, rot: NOODLE.rot }, 0.35, "in");     // he drops the noodle
sfx(0.42, "splash", { gain: 0.55 });
// Reaper sits up on the tower, eyes on the fin
A(0, "rea", "look", { to: [-0.6, -0.5], dur: 0, blink: false });
act.shock(c, 0.25, "rea", { open: 0.05, eye: 1.2, hold: 1.4 });
A(0, "rea", "grab", { prop: "whistle", hand: "L", grip: [0, 0, 0], pose: { o: [0.1, 0.42, 0.22] } });
see(0, 1.5, ["phx.face", "wiz.face", "rea.face", "shark", "phone", "ring"], "P1: a fin circling Phoenix's ring, the friends see it, he doesn't");

// ---------------------------------------------------------------- 2 RUN 1.5-3.2 (P2)
// the Wizard splashes round behind to the tower and climbs the ladder; Reaper glares down at him, then whistles
const runCurve = (who, t0, dur, p0, ctl, p1, n = 16) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, k = u * u * (3 - 2 * u), a = (1 - k) ** 2, b = 2 * k * (1 - k), d = k * k;
    pts.push([r3(u * dur), r3(a * p0[0] + b * ctl[0] + d * p1[0]), r3(a * p0[1] + b * ctl[1] + d * p1[1])]);
  }
  A(t0, who, "run", { pts, dur, rate: [[0, 2.2], [dur * 0.3, 3.6], [dur, 2.2]], stride: 1.5 });
  return pts;
};
A(0.95, "wiz", "look", { to: [0.7, 0.1], dur: 0.12, blink: false });
c.arm(1.0, "wiz", "L", "rest", 0.25);
A(1.05, "wiz", "turn", { to: 95, dur: 0.25 });
const WIZ_CTL = [-0.45, 0.55];
const wizPts = runCurve("wiz", 1.1, 1.0, WIZ0, WIZ_CTL, LADDER_FOOT);
for (const [t, x, z] of wizPts.filter((_, i) => i % 2 === 0)) prop(1.1 + t, "wizfoam", { x, z }, 0.125, "linear");
for (const t of [1.25, 1.55, 1.85]) sfx(t, "splash", { gain: 0.5, reason: "the Wizard splashing through the shallows" });
A(1.75, "wiz", "turn", { to: 160, dur: 0.3 });                      // turns his back to us, to the ladder
// the climb: hand over hand, each glove reaching wide of the hat brim to the next rung, the body rising on each pull
// (the engine's "climb" raises the arms straight up through the brim, so the arms are keyed here)
const RUNG_HI = { o: [0.34, 0.82, 0.28] }, RUNG_LO = { o: [0.3, 0.45, 0.3] };
c.arm(1.85, "wiz", "R", RUNG_LO, 0.25); c.arm(1.85, "wiz", "L", RUNG_HI, 0.25);
for (let k = 0; k < 4; k++) { const t = 2.1 + k * 0.21, [up, dn] = k % 2 ? ["L", "R"] : ["R", "L"]; c.arm(t, "wiz", up, RUNG_HI, 0.2); c.arm(t, "wiz", dn, RUNG_LO, 0.2); }
A(2.1, "wiz", "fly", { to: { y: TOP, z: FRONT + 0.32 }, dur: 0.84, ease: "linear" });
A(2.94, "wiz", "land", { to: TOP, dur: 0.1, fold: 0.1 });
c.arm(2.96, "wiz", "R", "rest", 0.3); c.arm(2.96, "wiz", "L", "rest", 0.3);
prop(2.1, "wizfoam", { on: 0 }, 0.3);
// over the top: the hat knocks Reaper's umbrella crooked
prop(2.85, "tower", { tilt: 18 }, 0.15, "out"); prop(3.0, "tower", { tilt: 12 }, 0.25);
sfx(2.85, "thud-soft", { gain: 0.65, reason: "the hat bumps the umbrella pole" });
A(2.87, "wiz", "look", { to: [-0.7, 0.0], dur: 0.12, blink: false });
A(3.0, "wiz", "move", { to: WIZ_TOP, dur: 0.6 });
A(3.05, "wiz", "turn", { to: 10, dur: 0.35 });
// Reaper: glares down at him, then blows the whistle at Phoenix
A(1.45, "rea", "look", { to: [-0.5, -0.8], dur: 0.15, blink: false });
act.mood(c, 1.5, "rea", "annoyed", { hold: 0.35 });
A(1.85, "rea", "look", { to: [-0.7, -0.6], dur: 0.12, blink: false });
c.arm(1.8, "rea", "L", { x: [0.06, 0.52, 0.34] }, 0.15, "out");                 // the whistle to the mouth
A(1.95, "rea", "expr", { expr: "angry", set: { open: 0, curve: -0.1 }, dur: 0.12 });
sfx(1.95, "whistle", { gain: 0.55 });
A(1.98, "rea", "squash", { amount: 0.04, dur: 0.12 });
c.arm(2.5, "rea", "L", { o: [0.1, 0.42, 0.22] }, 0.25);
// the ping: Phoenix's tiny smile at the phone
sfx(2.7, "notify", { gain: 0.3 });
A(2.75, "phx", "expr", { expr: "happy", set: { curve: 0.45 }, dur: 0.2 });
A(2.75, "phx", "face", { lid: 0.6, dur: 0.2 });
A(3.1, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.25 }); A(3.1, "phx", "face", { lid: 0.55, dur: 0.25 });
see(1.6, 3.1, ["phx.face", "rea.face", "shark", "tower"], "P2: the Wizard up the ladder, Reaper whistling, the fin closer, Phoenix smiling at his phone");

// ---------------------------------------------------------------- 3 MEGAPHONE 3.2-5.0 (P3)
// Reaper reaches for the megaphone on the rail; the Wizard grabs it first and yells into it; feedback squeal; both flinch
A(3.2, "rea", "look", { to: [-0.6, -0.2], dur: 0.12, blink: false });
A(3.3, "wiz", "look", { to: [-0.5, -0.5], dur: 0.12, blink: false });
A(3.42, "wiz", "grab", { prop: "mega", hand: "R", grip: [0, 0, 0], pose: { o: [0.1, 0.5, 0.36] } });
A(3.5, "rea", "look", { to: [-0.8, 0.0], dur: 0.12, blink: false });
act.mood(c, 3.55, "rea", "annoyed", { hold: 0.35 });
A(3.7, "wiz", "look", { to: [-0.6, -0.6], dur: 0.12, blink: false });
A(3.5, "wiz", "expr", { expr: "angry", set: { open: 0.9 }, dur: 0.08 }); A(3.5, "wiz", "face", { lid: 0.45, brow: 0.5, dur: 0.08 });   // a real yell, eyes squeezed
A(3.55, "wiz", "talk", { line: "loook uuup!", dur: 0.35, tone: "excited", voice: false });
c.cap(3.55, 4.3, "LOOK UP!!", 330);   // above the tower: the faces sit where the other captions go
sfx(3.9, "feedback", { gain: 0.7, reason: "the megaphone squeals", ...(V3 && { loud: true }) });   // v3: a deliberate gag (qa/sound.mjs SPIKE: +13.9 dB since 5 Nov), marked loud; the sound is unchanged
c.hitStop(3.9, 3);
c.textPop(3.9, "wiz", "SKREEE!", { xy: [300, 1010], dur: 0.5, color: "#ff5a3c", angle: -10, size: 100 });   // the squeal, under the bell, clear of the faces (reads on mute)
act.shock(c, 3.92, "wiz", { open: 0.45, hold: 0.5 }); act.shock(c, 3.92, "rea", { open: 0.2, hold: 0.5 });
A(3.92, "wiz", "squash", { amount: 0.16, dur: 0.15 }); A(3.92, "rea", "squash", { amount: 0.1, dur: 0.15 });
// Phoenix lifts his dangling feet onto the ring just as the fin passes under them, without looking
A(4.3, "phx", "squash", { amount: 0.02, dur: 0.15 });                       // a little wriggle as the fin passes under him
see(3.3, 4.9, ["wiz.face", "rea.face", "mega", "phx.face"], "P3: the megaphone, the squeal, Phoenix below still scrolling");

// ---------------------------------------------------------------- 4 POP 5.0-6.3 (P4) and the shark rising (P5)
const T_POP = 5.3;
c.hitStop(T_POP, 3);
sfx(T_POP, "ringpop", { gain: 0.8 });
sfx(T_POP + 0.08, "deflate", { gain: 0.6 });
prop(T_POP, "ring", { pop: 1 }, 0.45, "out");
prop(T_POP, "pop", { puff: 1 }, 0.5, "linear");
prop(T_POP, "ringfoam", { on: 0 }, 0.4);
prop(T_POP + 0.4, "ring", { x: -0.45, z: 3.45, rot: -40, bob: 0.3 }, 1.0, "out");     // skitters toward us on its last air: the flat ring stays in shot
c.at(T_POP, { fx: "shake", amp: 0.02, dur: 0.25 });
A(T_POP + 0.06, "phx", "drop", { to: SEAT - 0.04, dur: 0.06 });
A(T_POP + 0.1, "phx", "span", { to: 0.6, dur: 0.12, ease: "out" });
A(T_POP + 0.12, "phx", "fly", { to: { y: SEAT + LIFT }, dur: 0.3, ease: "out" });
sfx(T_POP + 0.1, "wings", { gain: 0.42, dur: END - (T_POP + 0.1) - 0.05 });
A(5.85, "phx", "span", { to: 1, dur: 0.3 });
A(6.3, "phx", "span", { to: 0.55, dur: 0.4 });
// the fin dives, then the shark surges up in front of him, under the phone
prop(5.35, "shark", { y: -1.0 }, 0.35, "in");
prop(5.4, "wake", { on: 0 }, 0.3);
const SH = { x: 0.32, z: 3.0, rot: -22 };
prop(5.75, "shark", { x: SH.x, z: SH.z, rot: unwrap(SH.rot), tip: -10 }, 0.4);
const T_RISE = 6.4;
prop(T_RISE, "shark", { y: 0.28, tip: -18, hope: 1, mouth: 0.8, lookX: -1, lookY: 1, wag: 1 }, 0.3, "out");
prop(T_RISE, "rise", { puff: 1 }, 0.7, "linear");
sfx(T_RISE + 0.05, "splash", { gain: 0.8, reason: "the shark surges up out of the water" });
c.at(T_RISE + 0.05, { fx: "shake", amp: 0.015, dur: 0.2 });
// the friends on the tower
A(5.3, "wiz", "look", { to: [-0.6, -0.7], dur: 0.12, blink: false }); A(5.3, "rea", "look", { to: [-0.7, -0.7], dur: 0.12, blink: false });
act.shock(c, 5.35, "wiz", { open: 0.4, hold: 0.9 }); act.shock(c, 5.35, "rea", { open: 0.15, hold: 0.9 });
see(5.2, 6.2, ["phx.face", "ring", "phone"], "P4: the ring pops, Phoenix hovers on his wings, still scrolling");
see(6.45, 6.95, ["phx.face", "shark"], "P5: the shark surges up right under him");

// ---------------------------------------------------------------- 6 PEAK 7.0-8.0 (P6)
c.arm(6.6, "wiz", "R", { x: [-0.06, 0.26, 0.32] }, 0.3);                // hugging the megaphone to his chest
c.arm(6.6, "wiz", "L", { x: [0.12, 0.24, 0.3] }, 0.3);
for (const w of ["wiz", "rea"]) A(T_RISE + 0.05, w, "squash", { amount: 0.1, dur: 0.15 });   // both flinch at the splash
act.shock(c, 7.0, "wiz", { open: 0.35, hold: 2.2 });
// the quiet lifeguard judges the loud one instead of the shark
A(7.2, "rea", "look", { to: [-0.8, 0.0], dur: 0.15, blink: false }); act.mood(c, 7.25, "rea", "annoyed", { hold: 1.8, lid: 0.55 });
sfx(7.15, "sharkhum", { gain: 0.6, reason: "the shark's hopeful hum under the phone" });
c.textPop(7.15, "phx", "hiii?", { xy: [800, 1290], dur: 0.75, color: "#bfe3ff", angle: -6, size: 110 });   // the shark's word, beside its mouth
prop(7.15, "shark", { mouth: 0.2 }, 0.1); prop(7.55, "shark", { mouth: 0.8 }, 0.15);
see(7.05, 8.0, ["phx.face", "shark", "phone", "wiz.face", "rea.face"], "P6: the hopeful shark under the phone, the friends frozen on the tower");

// ---------------------------------------------------------------- 7 LOOK-UP 8.0-9.0 (P7, the series ending)
A(8.05, "phx", "look", { to: [0.6, -0.8], dur: 0.12, blink: false });     // eyes down-right, onto the shark's face
A(8.05, "phx", "face", { lid: 0.2, dur: 0.12 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.textPop(8.5, "phx", "huh.", { xy: [190, 880], dur: 0.45, color: "#ffffff", size: 110, angle: -4 });   // beside his head: every band of this frame holds a face
prop(8.05, "shark", { wag: 1.4, hope: 1, lookY: 0.6, lookX: -0.8 }, 0.15);
see(8.1, 8.95, ["phx.face", "shark"], "P7: Phoenix looks at the shark: huh.");

// ---------------------------------------------------------------- 8 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.55, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.34 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
A(9.28, "phx", "squash", { amount: 0.02, dur: 0.25 });
act.scrollPhone(c, "phx", [9.35]);
// the shark's face falls; it sinks slowly with sad bubbles, its fin wilting as it goes under
prop(9.2, "shark", { hope: 0, sad: 1, mouth: 0, wag: 0, lookY: -0.4, lookX: -0.3 }, 0.3);
prop(9.45, "shark", { y: -0.1, tip: 0, wilt: 1 }, 0.5, "inOut");    // down until only its sad eyes clear the water: the last image (panel 08)
prop(9.45, "bubbles", { on: 1 }, 0.2);
sfx(9.45, "bubbling", { gain: 0.35, dur: 0.55, reason: "sad bubbles as the shark sinks" });
prop(9.0, "ring", { x: -0.6, z: 3.55, rot: -10 }, 1.0, "linear");          // the flat ring drifts past
// the friends give up (panel 08): the Wizard droops, Reaper's eyes slide to him, deadpan
act.mood(c, 9.3, "wiz", "sad", { hold: 0.7 }); A(9.3, "wiz", "pitch", { to: 8, dur: 0.3 });
A(9.3, "rea", "look", { to: [-0.8, 0.0], dur: 0.15, blink: false }); act.mood(c, 9.35, "rea", "annoyed", { hold: 0.6, lid: 0.6 });
see(9.4, 9.95, ["phx.face", "shark", "phone"], "P8: Phoenix back on his phone, the crushed shark sinking");

// ---------------------------------------------------------------- shots (Jonny's panels; the camera looks out to sea, the beach on the right)
const EYE_PITCH = JSON.parse(fs.readFileSync(new URL(`../../../assets/environments/${ENV}/env.json`, import.meta.url))).eye.pitch;   // + = down
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const WIDE = shot([-0.1, 1.7, 7.8], { fov: 46 });                       // near the painting's own camera (eye 2.4 m up at z 9)
const MEGA = shot([0.0, 1.9, 8.4], { pan: 1.5, tilt: 7, fov: 30 });                // the tower top, Phoenix small lower left
const POP = shot([0.0, 1.6, 8.2], { pan: 1, tilt: 5, fov: 38 });
// PEAK (unused: the pop shot holds through the peak) = shot([0.05, 1.45, 7.0], { pan: 0, tilt: 4, fov: 40 });
const LOOKUP = shot([0.08, 1.35, 6.4], { pan: 0, tilt: 4.5, fov: 34 });
const BACKDOWN = shot([0.05, 1.35, 7.6], { pan: 1, tilt: 1.5, fov: 42 });   // low enough that the sunk shark's eyes stay above the app's bars
// v3: narrower lenses from the wide's camera (the painting allows only small camera moves): the pair, then Phoenix
const TWO = { pos: WIDE.pos, look: [-0.26, 0.75, 1.7], fov: 38, to: { pos: WIDE.pos, look: [-0.26, 0.75, 1.7], fov: 35 }, dur: 1.2, ease: "linear" };
const PHXCU = { pos: WIDE.pos, look: [0.22, 0.38, 2.3], fov: 22 };   // Phoenix left of centre, the fin circling on his right
const OPENING = V3
  ? [["v3 two-shot: look up!", 0, TWO, "hook"], ["v3 Phoenix scrolls on", 1.2, PHXCU, "reaction"], ["P2 run", 1.95, WIDE]]
  : [["P1 fin", 0, WIDE, "hook"], ["P2 run", 1.5, "keep"]];
const beats = c.beats([
  ...OPENING,
  ["P3 megaphone", 3.2, MEGA],
  ["P4 pop", 5.0, POP],
  ["P6 peak", 7.0, "keep"],                     // the pop shot holds: a cut to a near-same framing reads as a jump
  ["P7 look-up", 8.0, LOOKUP, "payoff"],
  ["P8 back down", 9.0, BACKDOWN, "reaction"],
], END);

write(import.meta.url, {
  id: V3 ? "never-looks-up-shark-v3rules" : "never-looks-up-shark",
  title: "The friend who never looks up from his phone… even with a shark circling him",
  idea: "Never Looks Up ep 4: a fin circles Phoenix's donut ring and pops it; he hovers on his wings, never looks up until the series' 'huh.', and the lonely shark sinks, crushed",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION, ...NOW,
  cover: 8.5,
  set: { type: "env", env: ENV, shade: "soft", aperture: 0, focus: false, ...(V3 && { lighting: 2, hatch: { boil: 0.25 } }) },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: V3 ? 0 : 0.12, wash: 0.09, pool: 0.15 } },
  music: { style: "bounce", key: 2, bpm: 104, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "sand", room: "open", flaps: false, signature: { entrances: false }, ...(V3 && { guard: true }) },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "rea", "shark", "phone"], hint: 0, what: "a shark fin circles Phoenix's donut ring while he scrolls" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "ring", from: 0, to: T_POP + 0.2, reason: "Phoenix sits in the donut ring until it pops" },
    { who: "rea", with: "tower", from: 0, to: END + 0.3, reason: "Reaper stands on the lifeguard tower's platform" },
    { who: "wiz", with: "tower", from: 1.7, to: END + 0.3, reason: "the Wizard reaches the ladder, climbs it (gloves and feet on the rungs) and stands on the platform" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-ep4-shark.mjs. Panels: PANELS-shark.md. Title added in TikTok's text tool.",
});
