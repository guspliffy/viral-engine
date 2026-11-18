// THERE'S A CATCH 10 v3, PART 2: THE STREET (18 Nov 2026). Panels v3: /mnt/project-files/videos/what-if/10-laugh-strength/
// PANELS-v3.md (Jonny's notes on draft 2: the car lift replaces the bar toss; the bus breaks over him), with Sol's
// adjustments (Codex GPT-6.2 xhigh: sol/answer-panels-v3.md). Place map and cameras: ./DESIGN-STREET.md (Fable 5.2).
//   node storyboards/series/what-if/10-laugh-strength/make-laugh-street.mjs -> laugh-street.json (part 1: make-laugh-gym.mjs)
//
// Chain: "Watch this!" (gym) so he walks out to a parked car; so Wedge dares "he can't lift a CAR!", Chip laughs,
// x10,000; so he tips it up, gets under it and presses it overhead, then sets it down with a thump; the thump shakes the
// parked empty bus's brake loose, so it rolls down the lane; Chip, laughing, steps back off the kerb into its path,
// x100,000; so Spud leaps in and stops it one-handed; so "You're a superhero!"; so Wedge dares him to lift it with them
// inside; so they climb in, Wedge cracks up, x1,000,000, the bus goes overhead; so up high they stop laughing and admire him,
// and the catch is that praise makes him weaker; so it drains; so "Wait. LAUGH AT ME!", they look at each other, x1: it comes down on him and BREAKS open.
// The counter is the HUD strength chip (hud.js), on from frame 0 at x1,000 (the gym's last value).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { STREET } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const ROAD = -0.12;

// ---------------------------------------------------------------- the lines (measured: catch10-voice-probe, 18 Nov 2026)
// STREET: 0 "Trust me... he can't lift a car!", 1 Chip's laugh (take 2), 2 "You're a superhero!", 3 "Trust me... with US
// inside!", 4 Wedge's laugh, 5 narrator "But there's a catch." (take 2), 6 "Whoa.", 7 "Put us down. Please.", 8 "Wait. LAUGH AT ME!"
const DUR = [4.08, 2.72, 1.52, 2.82, 1.52, 1.33, 0.96, 2.70, 1.86, 2.93];
const T = [];
const END_OF = (i) => r3(T[i] + DUR[i]);
const SUB = 470, SUB_HI = 320;
const CAPTEXT = { 0: "Ha ha! Trust me... he can't lift a *CAR!*", 1: "HA HA HA HA!", 2: "Ha ha! You're a *SUPERHERO!*", 3: "Trust me... he can't lift it with *US* inside!", 4: "HA HA HA HA!", 5: "But there's a *catch.*", 6: "Whoa.", 7: "You're so *strong*... whoa.", 8: "Wait. *LAUGH AT ME!*", 9: "The more they *praise* you, the *weaker* you get." };
const CAPPOS = { 4: 340, 5: SUB_HI, 7: SUB_HI, 9: SUB_HI };
// a line at t (line i of STREET); the caption runs to the end of the voice + 0.3 s, or to `to`
const say = (i, t, to = null) => {
  T[i] = r3(t);
  const [who, line, tone, style, o = {}] = STREET[i];
  if (who === "nar") c.at(T[i], { macro: "narrate", line, voice: "narrator", take: o.take ?? 1, dur: DUR[i], caption: false });
  else c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false });
  cap(T[i], to ?? r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB, false, { size: 64 });
};

// ---------------------------------------------------------------- places (DESIGN-STREET.md section 1)
const CAR_A = [4.6, -5.6];
const CAR_K = 0.75, CAR_W = 0.83;                      // the citycar's scale; half its width at that scale (car-hatchback.js)
const BUS_K = 1.8, BUS_Z = -1.45, BUS_PARK = -4.6, BUS_STOP = -0.55;
const BUS_UNDER = 0.19 * BUS_K;                        // the cabin bus's underside over its own ground line
const SPUD_BUS = [-2.53, -2.35], SPUD_STOP = [0.99, -2.35];
const SPUD_CAR = [CAR_A[0], -4.3], SPUD_UNDER_CAR = [CAR_A[0], -5.55];
const WEDGE0 = [2.3, -0.35], CHIP0 = [3.2, -0.95], CHIP_LANE = [3.2, -1.75], WEDGE_ROAD = [2.15, -1.75];
const busY = (u) => r3(ROAD + u - BUS_UNDER);          // the bus origin's y for its underside u above the road

const props = [
  { id: "car", kind: "citycar", color: "#3F7FD0", scale: CAR_K, x: CAR_A[0], y: ROAD, z: CAR_A[1], rot: 90, staged: "parked on the far kerb" },
  { id: "bus", kind: "bus", cabin: true, open: 1, scale: BUS_K, x: BUS_PARK, y: ROAD, z: BUS_Z, rot: 0, staged: "parked at the shelter, empty, door open" },
  { id: "shelter", kind: "busshelter", w: 2.4, d: 0.8, h: 2.2, x: -4.6, y: 0, z: -0.55 },
  { id: "lamp", kind: "streetlamp", h: 3.2, x: -2.6, y: 0, z: -0.75 },
  { id: "bin", kind: "recyclebin", x: -6.2, y: 0, z: -0.6 },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [6.6, 1.6], face: 200, expr: "cocky", follow: 0.2, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: [7.0, 2.8], face: 200, expr: "delighted", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: [5.5, 2.6], face: 200, expr: "delighted", follow: 0.3, seed: 3.1 },
];

// ---------------------------------------------------------------- the strength chip (hud.js "strength"): ticks with a click
const KEYS = [[0, 1000]], DRAIN = [[0, 0]];
const tick = (t, v, drain = null) => { KEYS.push([r3(t), v]); if (drain != null) DRAIN.push([r3(t), drain, 0.2]); sfx(t, "kenney/switch", { gain: 0.5 }); };

// the power look: chest up, a stretch, cocky
const power = (t) => {
  act.breath(c, r3(t + 0.07), "spud", { big: 1, hold: 0.2 });
  A(r3(t + 0.07), "spud", "grow", { to: 1.06, dur: 0.13, ease: "out" }); A(r3(t + 0.4), "spud", "grow", { to: 1.0, dur: 0.2, ease: "inOut" });
  A(r3(t + 0.07), "spud", "expr", { expr: "shocked", dur: 0.12 }); A(r3(t + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
};
const laugh = (who, t0, t1, { amp = 5, side = "L", point = null } = {}) => {
  A(t0, who, "expr", { expr: "delighted", dur: 0.12 });
  if (point) { A(t0, who, "grip", { side, shape: "point", dur: 0.15 }); c.arm(t0, who, side, point, 0.4, "inOut"); }
  let k = 0; for (let t = t0; t < t1 - 0.1; t = r3(t + 0.17), k++) A(t, who, "pitch", { to: k % 2 ? -amp * 0.4 : amp, dur: 0.15, ease: "inOut" });
  A(r3(t1), who, "pitch", { to: 0, dur: 0.2 });
  if (point) { c.arm(r3(t1 + 0.05), who, side, "rest", 0.35, "inOut"); A(r3(t1 + 0.05), who, "grip", { side, shape: "relaxed", dur: 0.2 }); }
};
// riding the bus, a pitch rock jumps the drawn rig (draft 1's bench lesson): the laugh is small squash bounces
const rideLaugh = (w, t0, t1) => { A(t0, w, "expr", { expr: "delighted", dur: 0.12 }); for (let t = t0; t < t1 - 0.2; t = r3(t + 0.34)) A(t, w, "squash", { amount: 0.05, dur: 0.3 }); };

// both gloves flat on a prop that is NOT taken into the hand: the arms aim at two grip points on it, so the gloves stay
// there wherever its own tweens move it (a held prop is placed by the hand, and riders and tilts follow only the
// prop's own tweens). Points in the prop's own frame, scaled metres; up: the palm's way in that frame. One hand can go
// alone (Sol: "palms one at a time"): sides ["R"] or ["L"].
const palmsOn = (t, id, k, R, L, { up = 1, dur = 0.01, sides = ["R", "L"] } = {}) => {
  for (const [sd, p] of [["R", R], ["L", L]]) {
    if (!sides.includes(sd)) continue;
    const g = p.map((v) => r3(v / k)), palm = [g[0], r3(g[1] + up), g[2]];
    c.arm(t, "spud", sd, { prop: id, grip: g, palm }, dur, "inOut");
    A(t, "spud", "grip", { side: sd, shape: "flat", dur: Math.max(dur, 0.1) });
  }
};

// ---------------------------------------------------------------- 6 he walks out to the car; "Trust me... he can't lift a CAR!", x10,000
// (Sol: open wide on the car and the kerb; the friends run out behind him; the dare deadpan; Chip's laugh earns x10,000)
A(0, "spud", "move", { to: SPUD_CAR, y: ROAD, dur: 2.3, ease: "out", stride: 0.45 });
A(r3(0.3), "wedge", "move", { to: WEDGE0, dur: 1.2, ease: "out" }); A(r3(0.4), "chip", "move", { to: CHIP0, dur: 1.1, ease: "out" });
A(1.45, "wedge", "turn", { to: 125, dur: 0.3 }); A(1.45, "chip", "turn", { to: 120, dur: 0.3 });
A(r3(0.6), "wedge", "expr", { expr: "smug", dur: 0.2 });
const PT_C = { o: [0.1, 0.7, 0.3] }, PT_W = { o: [0.1, 0.62, 0.32] };
say(0, 0.6);
A(T[0], "wedge", "grip", { side: "R", shape: "point", dur: 0.15 }); c.arm(r3(T[0] + 0.9), "wedge", "R", PT_W, 0.4, "inOut");
A(2.0, "spud", "turn", { to: -40, dur: 0.4 });
A(2.1, "spud", "look", { to: [-0.5, 0.05], dur: 0.2 });
say(1, r3(END_OF(0) + 0.05));
laugh("chip", T[1], END_OF(1), { side: "R", point: PT_C, amp: 6 });
const U6 = r3(T[1] + 0.15);
tick(U6, 10000); power(U6);
c.arm(r3(END_OF(0) + 0.1), "wedge", "R", "rest", 0.4, "inOut"); A(r3(END_OF(0) + 0.1), "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(r3(U6 + 0.6), "spud", "turn", { to: 180, dur: 0.3 });
const CUT7 = F(U6 + 0.95);
see(0, CUT7, ["spud", "car", "wedge.face", "chip.face"], "he walks out to the car; the dare; Chip laughs, x10,000");

// ---------------------------------------------------------------- 7 the car lift: deadlift by the near sill, press it up level beside him, step
// under it as it clears his head, palms one at a time to the floor pan, press, hold, then the same way back down: THUMP
// (Sol: hands under the sill, a real squat, the press, the hold, a grin; a 1.02 m potato can't walk under a tipped car,
// so the car goes up level first). The car's own frame: rot 90, its x = the world's -z (its near side is own -x); its
// sill 0.22 and floor pan 0.16 over its ground line; scaled metres.
const SILL = [-CAR_W + 0.04, 0.22], FLOOR = 0.16;
const level = (u) => ({ y: r3(ROAD + u - FLOOR) });              // the car's origin y for its floor pan u over the road
const SPUD_SILL = [CAR_A[0], -4.38];
const sillHands = (t, dur) => palmsOn(t, "car", CAR_K, [SILL[0], SILL[1], -0.35], [SILL[0], SILL[1], 0.35], { dur });
A(CUT7, "spud", "move", { to: SPUD_SILL, y: ROAD, dur: 0.25, ease: "inOut" });
A(CUT7, "spud", "crouch", { to: 0.55, dur: 0.3 });
A(CUT7, "spud", "look", { to: [0, -0.3], dur: 0.2 });
sillHands(r3(CUT7 + 0.1), 0.3);
const T1 = r3(CUT7 + 0.5);                                         // the deadlift: the near side comes up level to his chest
c.prop(T1, "car", level(0.62), 0.5, "inOut");
A(T1, "spud", "crouch", { to: 0.1, dur: 0.5 });
A(T1, "spud", "squash", { amount: 0.04, dur: 0.4 });
sfx(T1, "creak", { gain: 0.5 });
const T1B = r3(T1 + 0.55);                                         // the press beside it: up over his head
c.prop(T1B, "car", level(1.22), 0.4, "out");
A(T1B, "spud", "look", { to: [0, 0.5], dur: 0.2 });
const T2 = r3(T1B + 0.42);                                         // he steps under it, one hand moves to the floor pan at a time
A(T2, "spud", "move", { to: SPUD_UNDER_CAR, y: ROAD, dur: 0.45, ease: "inOut" });
A(T2, "spud", "crouch", { to: 0.2, dur: 0.3 });
A(T2, "spud", "turn", { to: 0, dur: 0.45 });
palmsOn(r3(T2 + 0.1), "car", CAR_K, [0, FLOOR - 0.03, -0.26], [0, FLOOR - 0.03, 0.26], { dur: 0.3, sides: ["R"] });
palmsOn(r3(T2 + 0.25), "car", CAR_K, [0, FLOOR - 0.03, -0.26], [0, FLOOR - 0.03, 0.26], { dur: 0.3, sides: ["L"] });
const PRESS = r3(T2 + 0.6);
c.prop(PRESS, "car", level(1.36), 0.4, "out"); c.prop(r3(PRESS + 0.4), "car", level(1.33), 0.15, "inOut");
A(PRESS, "spud", "crouch", { to: 0, dur: 0.4 });
A(PRESS, "spud", "look", { to: [0.5, 0.1], dur: 0.25 });
A(r3(PRESS + 0.3), "spud", "expr", { expr: "cocky", dur: 0.2 });
sfx(PRESS, "creak", { gain: 0.45 });
// the hold (0.8 s), then back the same way: down to over his head, out to the side, down by the sill, the last bit drops
const REACT = F(PRESS + 0.45), BACK7 = F(PRESS + 1.25);
A(r3(REACT - 0.3), "wedge", "grip", { side: "R", shape: "point", dur: 0.15 }); c.arm(r3(REACT - 0.3), "wedge", "R", PT_W, 0.3, "inOut");
A(REACT, "wedge", "look", { to: [0.6, 0.35], dur: 0.15 }); A(REACT, "chip", "look", { to: [0.6, 0.4], dur: 0.15 });
A(r3(REACT + 0.1), "wedge", "expr", { expr: "shocked", dur: 0.15 }); A(r3(REACT + 0.05), "chip", "expr", { expr: "shocked", dur: 0.15 });
c.arm(r3(REACT + 0.25), "wedge", "R", "rest", 0.5, "inOut"); A(r3(REACT + 0.6), "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
const DOWN1 = r3(BACK7 + 0.05);
c.prop(DOWN1, "car", level(1.22), 0.3, "inOut");
A(DOWN1, "spud", "crouch", { to: 0.2, dur: 0.3 });
const OUT = r3(DOWN1 + 0.3);
A(OUT, "spud", "move", { to: SPUD_SILL, y: ROAD, dur: 0.4, ease: "inOut" });
A(OUT, "spud", "turn", { to: -180, dur: 0.4 });   // the left shoulder leads, the right arm clears the body
for (const sd of ["R", "L"]) c.arm(OUT, "spud", sd, { o: [0.18, 1.0, 0.02] }, 0.12, "out");   // straight up through the turn
sillHands(r3(OUT + 0.36), 0.2);
const DROP = r3(OUT + 0.6);
c.prop(DROP, "car", level(0.5), 0.35, "inOut");
A(DROP, "spud", "crouch", { to: 0.45, dur: 0.35 });
const LETGO = r3(DROP + 0.37), THUMP = r3(LETGO + 0.15);
c.prop(LETGO, "car", { y: ROAD }, 0.15, "in");
c.arm(LETGO, "spud", "R", { o: [0.25, 0.35, 0.3] }, 0.25, "out"); c.arm(LETGO, "spud", "L", { o: [0.25, 0.35, 0.3] }, 0.25, "out");
A(LETGO, "spud", "grip", { side: "both", shape: "open", dur: 0.15 });
c.prop(THUMP, "car", { y: ROAD + 0.04 }, 0.08, "out"); c.prop(r3(THUMP + 0.08), "car", { y: ROAD }, 0.12, "in");
sfx(THUMP, "thud", { gain: 1.0 }); sfx(THUMP, "kenney/impact-metal-heavy", { gain: 0.7 });
c.at(THUMP, { fx: "shake", amount: 0.06, dur: 0.25 });
const dust = (t, pos, size = 0.6, puffs = 10) => c.at(r3(t), { fx: "poof", pos, dur: 0.7, color: "#d9cbb4", puffs, sparks: 0, size, lift: 0.1 });
dust(THUMP, [CAR_A[0] - 0.9, ROAD + 0.05, -4.75]); dust(THUMP, [CAR_A[0] + 0.9, ROAD + 0.05, -4.75]);
see(CUT7, THUMP, ["spud", "car"], "he lifts the car, steps under it, presses it overhead, then sets it down: THUMP");

// ---------------------------------------------------------------- 8 the thump shakes the parked bus loose (cut on the thump)
const CUT8 = F(THUMP + 0.03);
c.prop(r3(THUMP + 0.02), "bus", { tip: 1.5 }, 0.15, "out"); c.prop(r3(THUMP + 0.17), "bus", { tip: -1.0 }, 0.25, "inOut");
c.prop(r3(THUMP + 0.42), "bus", { tip: 0.6 }, 0.25, "inOut"); c.prop(r3(THUMP + 0.67), "bus", { tip: 0 }, 0.25, "inOut");
sfx(r3(CUT8 + 0.3), "hiss", { gain: 0.6 });
const ROLL = r3(CUT8 + 0.45);
c.prop(ROLL, "bus", { x: -4.25 }, 0.5, "in");
// Spud lets go and stands up beside the car (off screen now)
c.arm(r3(CUT8 + 0.2), "spud", "R", "rest", 0.4, "inOut"); c.arm(r3(CUT8 + 0.2), "spud", "L", "rest", 0.4, "inOut");
A(r3(CUT8 + 0.1), "spud", "crouch", { to: 0, dur: 0.3 }); A(r3(CUT8 + 0.1), "spud", "turn", { to: -60, dur: 0.3 });
A(r3(CUT8 + 0.1), "spud", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
see(CUT8, r3(CUT8 + 0.9), ["bus"], "the brake hisses, the empty bus starts to roll");

// ---------------------------------------------------------------- 9 Chip laughs and steps back off the kerb into its path, x100,000
const CUT9 = F(CUT8 + 0.95);
say(1, r3(CUT9 + 0.05));
A(r3(CUT9 + 0.1), "chip", "move", { to: CHIP_LANE, y: ROAD, dur: 0.4, ease: "inOut" });
A(r3(CUT9 + 0.1), "chip", "turn", { to: 20, dur: 0.35 });
laugh("chip", CUT9, r3(CUT9 + 1.6), { amp: 8 });
tick(r3(CUT9 + 0.4), 100000);
const STOP = r3(CUT9 + 1.75);
c.prop(r3(ROLL + 0.5), "bus", { x: BUS_STOP - 0.12 }, r3(STOP - ROLL - 0.5), "in");
c.prop(STOP, "bus", { x: BUS_STOP + 0.04 }, 0.06, "out"); c.prop(r3(STOP + 0.06), "bus", { x: BUS_STOP }, 0.1, "inOut");
c.prop(STOP, "bus", { tip: 0, tilt: -1.2 }, 0.08, "out"); c.prop(r3(STOP + 0.08), "bus", { tilt: 0 }, 0.25, "inOut");
sfx(r3(STOP - 0.6), "rumble", { gain: 0.5 }); sfx(r3(STOP - 0.35), "horn", { gain: 0.5 });

// ---------------------------------------------------------------- 10 the leap: one side-on arc, he stops the bus with ONE flat palm
const LEAP = r3(STOP - 0.45);
A(LEAP, "spud", "move", { to: SPUD_STOP, y: ROAD, dur: 0.45, ease: "linear" });
A(LEAP, "spud", "hop", { height: 1.0, dur: 0.45, quiet: true });
A(r3(LEAP + 0.2), "spud", "turn", { to: -50, dur: 0.2 });
c.arm(r3(LEAP + 0.1), "spud", "R", { o: [0.5, 0.5, 0.05] }, 0.3, "out");
A(r3(LEAP + 0.1), "spud", "grip", { side: "R", shape: "flat", dur: 0.15 });
c.arm(r3(STOP + 0.1), "spud", "L", "hips", 0.3, "inOut");
A(STOP, "spud", "pitch", { to: 2, dur: 0.06 }); A(r3(STOP + 0.06), "spud", "pitch", { to: 0, dur: 0.2 });
A(STOP, "spud", "expr", { expr: "cocky", dur: 0.1 });
A(r3(STOP + 0.15), "spud", "look", { to: [0.7, 0], dur: 0.2 });
sfx(STOP, "screech", { gain: 0.6 }); sfx(STOP, "slam", { gain: 0.9 });
c.at(STOP, { fx: "shake", amount: 0.05, dur: 0.2 });
A(r3(STOP + 0.3), "chip", "expr", { expr: "shocked", dur: 0.12 });
A(r3(STOP + 0.3), "chip", "look", { to: [-0.7, 0], dur: 0.15 });
see(CUT9, r3(STOP + 0.8), ["chip.face", "bus", "spud"], "the bus comes at laughing Chip, Spud lands and stops it with one hand, x100,000");

// ---------------------------------------------------------------- 11-12 "You're a superhero!" / "Trust me... with US inside!", they head for the door
say(2, r3(STOP + 0.95));
const CUT11 = F(T[2] - 0.2);
A(T[2], "chip", "hop", { height: 0.25, dur: 0.35, quiet: true });
laugh("chip", r3(T[2] + 0.3), END_OF(2), { amp: 5 });
A(r3(T[2] - 0.6), "wedge", "move", { to: WEDGE_ROAD, y: ROAD, dur: 0.6, ease: "inOut" });
A(r3(T[2] - 0.6), "wedge", "turn", { to: -40, dur: 0.4 });
A(T[2], "spud", "turn", { to: 20, dur: 0.3 });
A(T[2], "spud", "expr", { expr: "delighted", dur: 0.2 });
say(3, r3(END_OF(2) + 0.15));
A(T[3], "wedge", "expr", { expr: "smug", dur: 0.2 });
A(T[3], "wedge", "grip", { side: "R", shape: "point", dur: 0.15 }); c.arm(T[3], "wedge", "R", { o: [0.45, 0.65, 0.1] }, 0.4, "inOut");
A(T[3], "wedge", "look", { to: [-0.8, 0.1], dur: 0.2 });
A(r3(T[3] + 0.3), "spud", "look", { to: [0.7, 0], dur: 0.2 });
// Sol: he heads for the door mid-line, Chip follows, still giggling
const GO = r3(T[3] + 1.4);
c.arm(GO, "wedge", "R", "rest", 0.35, "inOut"); A(GO, "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
const DOOR = [-0.55, -0.85];
A(GO, "wedge", "move", { to: [DOOR[0] + 0.1, DOOR[1] + 0.12], y: 0, dur: 1.3, ease: "inOut" });
A(r3(GO + 0.3), "chip", "move", { to: [DOOR[0] + 0.95, DOOR[1] + 0.15], y: 0, dur: 1.2, ease: "inOut" });
A(r3(GO + 0.3), "spud", "look", { to: [-0.6, 0], dur: 0.3 });
see(T[2], r3(GO + 0.6), ["chip.face", "wedge.face", "spud.face"], "relief, then the dare, they head for the bus");

// 13 at the door: a hop each into the doorway, onto the front deck behind the windscreen (bus-local metres, scale 1)
const CUT13 = F(GO + 1.45);
const WEDGE_OFF = [0.30, 0.62, -0.69], CHIP_OFF = [0.38, 0.75, -0.21];
A(r3(CUT13 + 0.05), "wedge", "turn", { to: 180, dur: 0.2 }); A(r3(CUT13 + 0.05), "chip", "turn", { to: 180, dur: 0.2 });
const IN_W = r3(CUT13 + 0.3), IN_C = r3(IN_W + 0.3);
A(IN_C, "chip", "ride", { prop: "bus", off: CHIP_OFF, yaw: 90, tilt: true, dur: 0.45, ease: "inOut" });
A(IN_W, "wedge", "ride", { prop: "bus", off: WEDGE_OFF, yaw: 90, tilt: true, dur: 0.45, ease: "inOut" });
sfx(r3(IN_W + 0.4), "step", { gain: 0.5 }); sfx(r3(IN_C + 0.4), "step", { gain: 0.5 });
see(CUT13, r3(IN_C + 0.5), ["bus"], "they hop in by the open door");

// ---------------------------------------------------------------- 14-15 Wedge cracks up: x1,000,000, the bus goes overhead (the cover)
const CUT14 = F(IN_C + 0.6);
A(r3(CUT14 - 0.02), "spud", "turn", { to: 70, dur: 0.01 });
c.arm(r3(CUT14 - 0.02), "spud", "R", "rest", 0.01); c.arm(r3(CUT14 - 0.02), "spud", "L", "rest", 0.01);
say(4, r3(CUT14 + 0.05));
for (const w of ["chip", "wedge"]) rideLaugh(w, CUT14, r3(CUT14 + 2.4));
const U14 = r3(CUT14 + 0.2);
tick(U14, 1000000); power(U14);
const REAR = -2.65 * BUS_K, NOSE = 10;                       // the rear axle (props-cabinbus.js), the tip angle
const noseUp = (deg) => { const a = (deg * Math.PI) / 180; return { tilt: deg, x: r3(BUS_STOP + REAR * (1 - Math.cos(a))), y: r3(ROAD - REAR * Math.sin(a)) }; };
const TIPT = r3(U14 + 0.3), TIP14 = r3(TIPT + 0.3);
A(r3(U14 + 0.2), "spud", "turn", { to: -90, dur: 0.25 });
A(TIPT, "spud", "crouch", { to: 0.3, dur: 0.2 });
A(r3(TIPT - 0.1), "spud", "look", { to: [0, 0.3], dur: 0.15 });
const nx = r3(0.99 - 0.06), nz = r3(SPUD_STOP[1] - BUS_Z), ny = r3(BUS_UNDER + 0.04);
palmsOn(r3(TIPT + 0.12), "bus", BUS_K, [nx, ny, r3(nz - 0.26)], [nx, ny, r3(nz + 0.26)], { dur: 0.16 });
c.prop(TIP14, "bus", noseUp(NOSE), 0.3, "out");
A(TIP14, "spud", "crouch", { to: 0.12, dur: 0.3 });
sfx(TIP14, "creak", { gain: 0.5 });
const CUT15 = F(U14 + 0.95);
const U0 = 0.85;
const busAt = (u) => [BUS_STOP, busY(u), BUS_Z];
// the cheat lands ON the cut: "dur": 0 actions (anime-timing.js: a "dur": 0 move lands on the cut, with no stepping
// lead-in before it)
const CHEAT = CUT15;
A(CHEAT, "spud", "move", { to: SPUD_BUS, y: ROAD, dur: 0, ease: "linear", sync: true });
A(CHEAT, "spud", "turn", { to: 90, dur: 0 });
A(CHEAT, "spud", "crouch", { to: 0.5, dur: 0 });
c.prop(CUT15, "bus", { y: busY(U0), tilt: 0, x: BUS_STOP }, 0, "linear");   // the bus (and its riders) on the cut itself
const hx = r3(SPUD_BUS[0] - BUS_STOP), hz = r3(SPUD_BUS[1] - BUS_Z), gy = r3(BUS_UNDER - 0.03);
palmsOn(CHEAT, "bus", BUS_K, [hx, gy, r3(hz + 0.26)], [hx, gy, r3(hz - 0.26)], { dur: 0 });
A(CUT15, "spud", "look", { to: [0, 0.2], dur: 0 });
const L15 = r3(CUT15 + 0.15), FULL = 1.33;
c.prop(L15, "bus", { y: busAt(FULL + 0.03)[1] }, 0.5, "out"); c.prop(r3(L15 + 0.52), "bus", { y: busAt(FULL)[1] }, 0.15, "inOut");
A(L15, "spud", "crouch", { to: 0, dur: 0.5 });
A(L15, "spud", "expr", { expr: "cocky", dur: 0.2 });
sfx(L15, "creak", { gain: 0.5 });

// ---------------------------------------------------------------- 16-18 THE CATCH (Jonny 18 Nov 22:05): "The more they praise you... the weaker
// you get." Up high they stop laughing and admire him ("Whoa." / "You're so strong... whoa."): each praise drains it, the bus sinks
say(5, r3(L15 + 2.3));
say(9, r3(END_OF(5) + 0.15));
for (const w of ["chip", "wedge"]) { A(r3(T[5] + 0.1), w, "look", { to: [0.2, -0.8], dur: 0.3 }); A(r3(T[5] + 0.4), w, "expr", { expr: "shocked", dur: 0.3 }); }
see(L15, T[5], ["bus", "spud", "chip.face", "wedge.face"], "x1,000,000: the bus with both friends over his head (the cover)");
let u = FULL;
const sink = (t, to, v, drain, knees) => {
  tick(t, v, drain); u = to;
  c.prop(t, "bus", { y: busAt(u)[1] }, 0.25, "inOut");
  A(t, "spud", "crouch", { to: knees, dur: 0.25 });
  A(t, "spud", "squash", { amount: 0.05, dur: 0.3 });
  c.prop(t, "bus", { tip: 1 }, 0.12, "out"); c.prop(r3(t + 0.12), "bus", { tip: 0 }, 0.2, "inOut");
  sfx(t, "creak", { gain: 0.45 });
};
const CUT17 = F(T[9] + 1.6);
say(6, r3(END_OF(9) + 0.2));
A(T[6], "chip", "expr", { expr: "delighted", dur: 0.2 });
sink(r3(END_OF(6) + 0.05), r3(FULL - 0.10), 100000, 0.2, 0.05);
A(r3(END_OF(6) + 0.05), "spud", "expr", { expr: "shocked", dur: 0.2 });
say(7, r3(END_OF(6) + 0.45));
const CUT18 = F(T[7] - 0.15);
A(T[7], "wedge", "expr", { expr: "kind", dur: 0.2 }); A(T[7], "chip", "expr", { expr: "kind", dur: 0.2 });
sink(r3(T[7] + 0.75), 1.15, 10000, 0.4, 0.1);
sink(r3(T[7] + 1.45), 1.07, 1000, 0.6, 0.18);
sink(r3(T[7] + 2.2), 0.99, 100, 0.75, 0.26);
A(r3(T[7] + 1.45), "spud", "expr", { expr: "terrified", dur: 0.2 });
see(T[5], r3(T[7] + 2.6), ["bus", "chip.face", "wedge.face"], "the catch: they admire him, every praise drains it, the bus sinks");

// ---------------------------------------------------------------- 19-20 "Wait. LAUGH AT ME!" (a forced grin), they look at each other
say(8, r3(END_OF(7) + 0.35));
const CUT19 = F(T[8] - 0.2);
A(T[8], "spud", "look", { to: [0, 0.7], dur: 0.2 });
A(T[8], "spud", "expr", { expr: "eager", dur: 0.15 });
sink(r3(T[8] + 1.0), 0.93, 10, 0.9, 0.32);
A(r3(T[8] + 1.05), "spud", "expr", { expr: "terrified", dur: 0.15 });
const CUT20 = F(END_OF(8) + 0.2);
A(r3(CUT20 + 0.15), "chip", "turn", { to: -70, dur: 0.3 }); A(r3(CUT20 + 0.15), "wedge", "turn", { to: -110, dur: 0.3 });
A(r3(CUT20 + 0.15), "chip", "look", { to: [0.6, 0], dur: 0.2 }); A(r3(CUT20 + 0.15), "wedge", "look", { to: [-0.6, 0], dur: 0.2 });
A(r3(CUT20 + 0.1), "chip", "expr", { expr: "shocked", dur: 0.2 }); A(r3(CUT20 + 0.1), "wedge", "expr", { expr: "shocked", dur: 0.2 });
see(T[8], r3(CUT20 + 0.95), ["spud.face", "chip.face", "wedge.face"], "he begs; they look at each other; nobody laughs");

// ---------------------------------------------------------------- 21 x1: the bus SMASHES him flat (Jonny 18 Nov 22:05), holds, then BREAKS open
const CRASH = F(CUT20 + 1.05);
tick(CRASH, 1, 1.0);
const GIVE = r3(CRASH + 0.07), HITB = r3(GIVE + 0.15), SPLIT = r3(HITB + 0.4);
// the floor slams down onto him: he goes pancake-flat under it, a heavy hit, dust, a held beat
c.prop(GIVE, "bus", { y: busAt(0.3)[1] }, 0.15, "in");
c.prop(HITB, "bus", { y: busAt(0.34)[1] }, 0.08, "out"); c.prop(r3(HITB + 0.08), "bus", { y: busAt(0.3)[1] }, 0.12, "in");
A(GIVE, "spud", "crouch", { to: 1.9, dur: 0.15, ease: "in" });
A(HITB, "spud", "squash", { amount: 0.5, dur: 0.3 });
A(HITB, "spud", "expr", { expr: "dizzy", dur: 0.1 });
c.arm(GIVE, "spud", "R", { o: [0.6, 0.2, 0.2] }, 0.15, "out"); c.arm(GIVE, "spud", "L", { o: [0.6, 0.2, 0.2] }, 0.15, "out");
A(HITB, "spud", "grip", { side: "both", shape: "open", dur: 0.1 });
sfx(HITB, "thud", { gain: 1.0 }); sfx(HITB, "kenney/impact-metal-heavy", { gain: 1.0 });
c.at(HITB, { fx: "shake", amount: 0.09, dur: 0.35 });
dust(HITB, [-1.6, ROAD + 0.05, -2.35], 1.0, 16); dust(HITB, [-3.6, ROAD + 0.05, -2.35], 0.8, 12);
// then it splits: the two halves tip outward, the seats spill, the friends slide out forward
sfx(SPLIT, "ai/metal-tear", { gain: 0.8, reason: "the bus splits open down the middle" });
c.prop(SPLIT, "bus", { split: 0.55 }, 0.6, "out");
c.prop(r3(SPLIT + 0.05), "bus", { spill: 1 }, 0.6, "out");
const OFF = r3(SPLIT + 0.05);
// they stay riders of the (now still) bus and slide out of the break to the road: off = (world - bus origin) / its scale
const busOff = ([x, z]) => [r3((x - BUS_STOP) / BUS_K), r3((ROAD - busAt(0.3)[1]) / BUS_K), r3((z - BUS_Z) / BUS_K)];
A(OFF, "chip", "ride", { prop: "bus", off: busOff([1.7, -1.25]), yaw: 90, dur: 0.6, ease: "inOut" });
A(OFF, "wedge", "ride", { prop: "bus", off: busOff([2.0, -3.65]), yaw: 90, dur: 0.65, ease: "inOut" });
A(r3(OFF + 0.43), "chip", "crouch", { to: 0.6, dur: 0.2 }); A(r3(OFF + 0.48), "wedge", "crouch", { to: 0.6, dur: 0.2 });
A(r3(OFF + 0.3), "chip", "expr", { expr: "dizzy", dur: 0.1 }); A(r3(OFF + 0.3), "wedge", "expr", { expr: "dizzy", dur: 0.1 });
sfx(r3(OFF + 0.45), "thud-soft", { gain: 0.6 }); sfx(r3(OFF + 0.5), "thud-soft", { gain: 0.6 });
sfx(r3(SPLIT + 0.6), "thud", { gain: 0.8 });
dust(r3(SPLIT + 0.55), [-2.4, ROAD + 0.05, -0.3], 0.8, 12); dust(r3(SPLIT + 0.55), [-2.4, ROAD + 0.05, -4.4], 0.8, 12);
// the held end: Chip blinks and his mouth curls up, just before the laugh
act.blinksAt(c, "chip", [r3(SPLIT + 0.8)]);
A(r3(SPLIT + 0.95), "chip", "look", { to: [-0.5, -0.2], dur: 0.2 }); A(r3(SPLIT + 1.0), "chip", "expr", { expr: "smug", dur: 0.25 });
const END = F(SPLIT + 1.25);
see(GIVE, END, ["bus", "spud", "chip.face", "wedge.face"], "x1: the bus smashes him flat, then breaks open, they slide out, cut");

act.blinksAt(c, "wedge", [6.0]);

// ---------------------------------------------------------------- cameras (DESIGN-STREET.md section 3; WIDE6, CARLOW and BREAK new for v3)
const CAM = {
  WIDE6: { pos: [2.4, 1.6, 6.5], look: [2.4, 0.9, -4.0], fov: 52 },
  REACT: { pos: [4.3, 0.85, -3.7], look: [2.7, 0.75, -0.6], fov: 42 },
  CARLOW: { pos: [8.4, 0.35, -1.4], look: [4.9, 1.0, -5.0], fov: 48 },
  STOP: { pos: [-1.2, 1.3, 3.4], look: [-4.2, 1.4, -2.0], fov: 40 },
  BUSSTOP: { pos: [1.9, 1.3, 6.4], look: [1.9, 1.2, -2.35], fov: 38 },
  STREETB: { pos: [2.35, 1.45, 7.6], look: [2.35, 1.0, -2.4], fov: 40 },
  DOOR: { pos: [-0.2, 1.4, 5.2], look: [-0.55, 1.3, -1.45], fov: 36 },
  LINEA: { pos: [6.8, 0.3, -1.4], look: [0.99, 1.15, -2.35], fov: 38 },
  HERO: { pos: [11.0, 0.35, -1.45], look: [-1.0, 1.93, -2.35], fov: 27 },
  WINDOW: { pos: [5.6, 2.75, -2.3], look: [0.3, 2.70, -2.35], fov: 30 },
  LINEB: { pos: [1.6, 0.25, -1.7], look: [-2.53, 0.75, -2.35], fov: 34 },
  BREAK: { pos: [12.5, 0.7, -2.1], look: [-1.0, 1.0, -2.35], fov: 36 },
};
c.captions.sort((a, b) => a.from - b.from).forEach((k, i, all) => { if (all[i + 1] && k.to > all[i + 1].from) k.to = all[i + 1].from; });
const beats = c.beats([
  ["the dare", 0, CAM.WIDE6, "hook"],
  ["car lift", CUT7, CAM.CARLOW, "escalation"],
  ["they stare", REACT, CAM.REACT],
  ["set down", BACK7, { ...CAM.CARLOW }],
  ["bus loose", CUT8, CAM.STOP],
  ["bus stop", CUT9, CAM.BUSSTOP, "escalation"],
  ["superhero", CUT11, CAM.STREETB],
  ["climb in", CUT13, CAM.DOOR],
  ["million", CUT14, CAM.LINEA],
  ["bus lift", CUT15, CAM.HERO, "escalation"],
  ["whoa", CUT17, CAM.WINDOW],
  ["so strong", CUT18, { ...CAM.HERO }],
  ["laugh at me", CUT19, CAM.LINEB],
  ["look", CUT20, { ...CAM.WINDOW }],
  ["break", CRASH, CAM.BREAK, "payoff"],
], END);

write(import.meta.url, {
  id: "laugh-street",
  title: "What if every laugh made you stronger? (part 2, the street)",
  idea: "There's a catch 10 v3: the street, x1,000 to x1,000,000 (car lift, bus rescue, bus overhead), then they stop laughing and the bus breaks over him.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [256, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true,
  set: { type: "street", seed: 4, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the film's score from where the gym part ends (MUSIC_SKIP: the gym part's length)
  music: { file: process.env.MUSIC ?? "laugh-strength/laugh-film.ogg", skip: Number(process.env.MUSIC_SKIP ?? 11.667), gain: 0.45, lowCut: 120, lock: false, duck: { voice: -6 } },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "street", room: "open" },
  hud: { strength: { keys: KEYS, drain: DRAIN } },
  creative: { length: [30, 40] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "car", from: r3(U6 + 0.5), to: r3(THUMP + 0.3), checks: ["shell", "clipping", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "his gloves under the sill and the floor pan of the car he lifts, his crown under its floor" },
    { who: "spud", from: r3(T1B - 0.05), to: r3(DROP + 0.2), checks: ["held-high"], reason: "the joke: he presses the car over his head" },
    { who: "spud", from: r3(LEAP - 0.05), to: r3(STOP + 0.05), checks: ["rig-jump"], reason: "the superhero leap: one 0.45 s arc, fast on purpose (seen in a 30 fps strip: it reads as one arc)" },
    { who: "spud", with: "bus", from: r3(LEAP - 0.05), to: END, reason: "his palm on the bus's bumper, then he is under the bus he holds up, and under it when it breaks" },
    { who: "spud", from: r3(TIPT - 0.05), to: END, checks: ["held-high"], reason: "the joke: he holds the bus with both friends over his head" },
    { who: "spud", with: "bus", from: r3(CUT15 - 0.05), to: END, checks: ["shell"], reason: "his crown and sprout press up against the bus floor he holds (and it comes down on him)" },
    { who: "chip", with: "wedge", from: r3(IN_W - 0.3), to: r3(OFF + 0.6), checks: ["character-overlap", "reach"], reason: "side by side at the windscreen, shoulder to shoulder, then sliding out of the broken bus together" },
    { who: "wedge", with: "chip", from: r3(IN_W - 0.3), to: r3(OFF + 0.6), checks: ["character-overlap", "reach"], reason: "shoulder to shoulder at the windscreen, gloves on the dash side by side" },
    { who: "spud", from: r3(TIP14 + 0.05), to: r3(TIP14 + 0.15), checks: ["rig-jump"], reason: "ROUGH DRAFT 3b ONLY: a one-frame foot pop as he tips the nose up; on the list for the Sol glitch pass" },
    { who: "chip", from: r3(CRASH - 0.05), to: r3(OFF + 0.1), checks: ["face-covered"], reason: "the impact: 0.3 s with Chip's glove up at the glass as the bus drops, under the shake" },
    { who: "chip", from: OFF, to: END, checks: ["rig-jump"], reason: "the break throws them out: one fast 0.6 s slide, on 2s" },
    { who: "wedge", from: OFF, to: END, checks: ["rig-jump"], reason: "the break throws them out: one fast 0.65 s slide, on 2s" },
    { who: "chip", with: "bus", from: r3(IN_C - 0.2), to: END, checks: ["shell", "clipping", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "Chip rides the bus on the dash ledge behind the windscreen, gloves on the dash and glass; he slides out of the broken half" },
    { who: "wedge", with: "bus", from: r3(IN_W - 0.2), to: END, checks: ["shell", "clipping", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "Wedge rides the bus on the front deck behind the windscreen, gloves on the dash and glass; he slides out of the broken half" },
  ],
  notes: "Generated by storyboards/series/what-if/10-laugh-strength/make-laugh-street.mjs.",
});
export const TIMES = { T, CRASH, END };
if (process.env.TIMES) console.log(JSON.stringify({ T, CUT7, T1, T2, PRESS, OUT, LETGO, THUMP, CUT8, CUT9, STOP, GO, CUT13, IN_C, IN_W, CUT14, CUT15, CUT17, CUT18, CUT19, CUT20, CRASH, END }));
