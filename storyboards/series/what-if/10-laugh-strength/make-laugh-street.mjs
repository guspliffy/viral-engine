// THERE'S A CATCH 10 v2, PART 2: THE STREET (18 Nov 2026). Outline v2: /mnt/project-files/videos/what-if/10-laugh-strength/
// OUTLINE-v2.md. Design: ./DESIGN-STREET.md (Fable 5.2: place map, shot list, the bus hold, the crash). Lines: ./lines.mjs STREET.
//   node storyboards/series/what-if/10-laugh-strength/make-laugh-street.mjs -> laugh-street.json (part 1: make-laugh-gym.mjs)
//
// Chain: the bar Spud tossed comes down on a parked car and flips it; so the friends howl, x10,000; so he lifts the car
// and sets it back on its wheels; the thump shakes the parked bus's brake loose, so it rolls at Chip, still laughing in
// the road; so Spud stops it one-handed, x100,000; so "You're a superhero!"; so Wedge dares him to lift the bus with them
// in it, so they climb in, x1,000,000, the bus goes overhead; so up high they get scared and stop laughing; so it
// drains; so "LAUGH AT ME!", they look at each other, x1, it comes down on him. Cut on the impact.
// The counter is the HUD strength chip (hud.js), on from frame 0 at x1,000 (the gym's last value).
// Departures from DESIGN-STREET.md: the car flip, the throw to B and the crash pitch are keyed (no physics); the push-in
// of 5d is a cut-free hold; the friends' laugh inside the bus is music, not a line.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { STREET } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const ROAD = -0.12;

// ---------------------------------------------------------------- the lines (measured: catch10-voice-probe, 18 Nov 2026)
// STREET: 0 "You broke a car!", 1 Wedge's laugh, 2 "You're a superhero!", 3 "Trust me... with US in it!", 4 narrator
// "But there's a catch." (take 2), 5 "Whoa.", 6 "Put us down?", 7 "No, no, no... LAUGH AT ME!"
const DUR = [1.72, 1.30, 1.52, 3.03, 1.30, 1.00, 1.43, 3.27];
const T = [2.10, 3.90, 12.75, 14.55, 22.85, 24.35, 25.90, 28.40];
const END_OF = (i) => r3(T[i] + DUR[i]);
const SUB = 470, SUB_HI = 320;
const CAPTEXT = { 0: "Ha ha ha! You broke a *CAR!*", 1: "HA HA HA!", 2: "Ha ha! You're a *SUPERHERO!*", 3: "Trust me... he can't lift the bus with *US* in it!", 4: "But there's a *catch.*", 5: "Whoa.", 6: "Put us *down?*", 7: "No, no, no... *LAUGH AT ME!*" };
const CAPPOS = { 4: SUB_HI, 6: SUB_HI };
const say = (i) => {
  const [who, line, tone, style, o = {}] = STREET[i];
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 0.6));
  if (who === "nar") c.at(T[i], { macro: "narrate", line, voice: "narrator", take: o.take ?? 1, dur: DUR[i], caption: false });
  else c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false });
  cap(T[i], to, CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB, false, { size: 64 });
};
STREET.forEach((_, i) => say(i));

// ---------------------------------------------------------------- places (DESIGN-STREET.md section 1)
const CAR_A = [4.6, -5.6], CAR_B = [6.7, -5.6];
const CAR_K = 0.75, CAR_H = 2.06 * CAR_K;            // the citycar's height at its scale (car-hatchback.js)
const BUS_K = 1.8, BUS_Z = -1.45, BUS_PARK = -4.6, BUS_STOP = -0.55;
const BUS_UNDER = 0.19 * BUS_K;                        // the cabin bus's underside over its own ground line
const SPUD_BUS = [-2.53, -2.35], SPUD_STOP = [0.99, -2.35], CHIP_LANE = [2.4, -2.35];
const busY = (u) => r3(ROAD + u - BUS_UNDER);          // the bus origin's y for its underside u above the road

const props = [
  { id: "car", kind: "citycar", color: "#3F7FD0", scale: CAR_K, x: CAR_A[0], y: ROAD, z: CAR_A[1], rot: 90 },
  { id: "bar", kind: "barbell", plates: 3, bend: 0.55, x: 4.75, y: 4.4, z: -5.3, rot: 20, staged: "the bar Spud tossed, falling out of the sky" },
  { id: "bus", kind: "bus", cabin: true, open: 1, scale: BUS_K, x: BUS_PARK, y: ROAD, z: BUS_Z, rot: 0, staged: "parked at the shelter, empty, door open" },
  { id: "shelter", kind: "busshelter", w: 2.4, d: 0.8, h: 2.2, x: -4.6, y: 0, z: -0.55 },
  { id: "lamp", kind: "streetlamp", h: 3.2, x: -2.6, y: 0, z: -0.75 },
  { id: "bin", kind: "recyclebin", x: -6.2, y: 0, z: -0.6 },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [6.8, 0.9], face: 0, expr: "cocky", follow: 0.2, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: [-0.6, -2.35], face: 90, expr: "delighted", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: [-0.6, -0.75], face: 90, expr: "delighted", follow: 0.3, seed: 3.1 },
];
A(0, "chip", "move", { to: [-0.6, -2.35], y: ROAD, dur: 0.01 });

// ---------------------------------------------------------------- the strength chip (hud.js "strength"): ticks with a click
const KEYS = [[0, 1000]], DRAIN = [[0, 0]];
const tick = (t, v, drain = null) => { KEYS.push([r3(t), v]); if (drain != null) DRAIN.push([r3(t), drain, 0.2]); sfx(t, "kenney/switch", { gain: 0.5 }); };

// the power look: chest up, a stretch, cocky
const power = (t) => {
  act.breath(c, r3(t + 0.07), "spud", { big: 1, hold: 0.2 });
  A(r3(t + 0.07), "spud", "grow", { to: 1.06, dur: 0.13, ease: "out" }); A(r3(t + 0.4), "spud", "grow", { to: 1.0, dur: 0.2, ease: "inOut" });
  A(r3(t + 0.07), "spud", "expr", { expr: "surprised", dur: 0.12 }); A(r3(t + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
};
const laugh = (who, t0, t1, { amp = 5, side = "L", point = null } = {}) => {
  A(t0, who, "expr", { expr: "delighted", dur: 0.12 });
  if (point) { A(t0, who, "grip", { side, shape: "point", dur: 0.15 }); c.arm(t0, who, side, point, 0.4, "inOut"); }
  let k = 0; for (let t = t0; t < t1 - 0.1; t = r3(t + 0.17), k++) A(t, who, "pitch", { to: k % 2 ? -amp * 0.4 : amp, dur: 0.15, ease: "inOut" });
  A(r3(t1), who, "pitch", { to: 0, dur: 0.2 });
  if (point) { c.arm(r3(t1 + 0.05), who, side, "rest", 0.35, "inOut"); A(r3(t1 + 0.05), who, "grip", { side, shape: "relaxed", dur: 0.2 }); }
};

// both gloves flat on a prop that is NOT taken into the hand: the arms aim at two grip points on it, so the gloves stay
// there wherever its own tweens move it (a held prop is placed by the hand, and riders and tilts follow only the
// prop's own tweens: the bus with two riders and the crash pitch need the prop free). Points in the prop's own frame,
// scaled metres; up: the palm's way in that frame (-1 for the car on its roof).
const palmsOn = (t, id, k, R, L, up = 1, dur = 0.01) => {
  for (const [sd, p] of [["R", R], ["L", L]]) {
    const g = p.map((v) => r3(v / k)), palm = [g[0], r3(g[1] + up), g[2]];
    c.arm(t, "spud", sd, { prop: id, grip: g, palm }, dur, "inOut");
  }
  A(t, "spud", "grip", { side: "both", shape: "flat", dur: Math.max(dur, 0.1) });
};

// ---------------------------------------------------------------- 5a the bar comes down on the car, it flips onto its roof
const HIT = 0.17;
c.prop(0, "bar", { x: 4.62, y: CAR_H + ROAD + 0.06, z: -5.0 }, HIT, "in");
sfx(HIT, "kenney/impact-metal-heavy", { gain: 1.0 }); sfx(HIT, "ai/glass-shatter-car", { gain: 0.8, reason: "the bar smashes into the car" });
c.at(HIT, { fx: "shake", amount: 0.05, dur: 0.25 });
// the roll away from us: over its far side onto the roof (tilt about its own length axis; the origin is the wheels' ground)
c.prop(HIT, "car", { tilt: 90, y: ROAD + 0.83, z: CAR_A[1] - 0.83 }, 0.25, "in");
c.prop(r3(HIT + 0.25), "car", { tilt: 180, y: ROAD + CAR_H, z: CAR_A[1] }, 0.25, "out");
sfx(r3(HIT + 0.5), "thud", { gain: 0.9 }); sfx(r3(HIT + 0.5), "crumble", { gain: 0.4 });
c.prop(r3(HIT + 0.5), "car", { y: ROAD + CAR_H + 0.06 }, 0.1, "out"); c.prop(r3(HIT + 0.6), "car", { y: ROAD + CAR_H }, 0.12, "in");
// the bar bounces off into the road and lies there
c.prop(r3(HIT + 0.02), "bar", { x: 3.9, y: 0.9, z: -4.6, rot: 50 }, 0.3, "out");
c.prop(r3(HIT + 0.32), "bar", { x: 3.3, y: ROAD + 0.02, z: -4.3, rot: 20 }, 0.25, "in");
sfx(r3(HIT + 0.57), "kenney/impact-metal-heavy", { gain: 0.6 });
see(0.1, 1.2, ["car", "bar"], "the bar hits the car, it flips onto its roof");

// ---------------------------------------------------------------- 5b they run out: "You broke a car!", x10,000
const B5 = 1.3;
A(B5, "spud", "move", { to: [3.7, -2.6], y: ROAD, dur: 0.75, ease: "inOut", stride: 0.5 });
A(B5, "spud", "turn", { to: 200, dur: 0.3 });
A(r3(B5 + 0.15), "chip", "move", { to: CHIP_LANE, y: ROAD, dur: 0.55, ease: "out" });
A(r3(B5 + 0.2), "wedge", "move", { to: [1.3, -0.35], dur: 0.6, ease: "out" });
A(r3(B5 + 0.6), "chip", "turn", { to: 25, dur: 0.3 }); A(r3(B5 + 0.7), "wedge", "turn", { to: 30, dur: 0.3 });
A(r3(B5 + 0.6), "chip", "look", { to: [0.6, 0], dur: 0.2 }); A(r3(B5 + 0.7), "wedge", "look", { to: [0.6, -0.1], dur: 0.2 });
const PT_C = { o: [0.1, 0.7, 0.3] }, PT_W = { o: [0.1, 0.62, 0.32] };
laugh("chip", T[0], END_OF(0), { side: "R", point: PT_C, amp: 6 });
laugh("wedge", r3(T[0] + 0.4), END_OF(1), { side: "R", point: PT_W, amp: 3 });
A(r3(T[0] + 0.3), "spud", "turn", { to: -30, dur: 0.35 });
A(r3(T[0] + 0.4), "spud", "look", { to: [-0.6, 0], dur: 0.2 });
A(r3(T[0] + 0.4), "spud", "expr", { expr: "worried", dur: 0.15 });
const U5 = r3(T[1] + 0.2);
tick(U5, 10000); power(U5);
A(r3(U5 + 1.0), "spud", "turn", { to: 180, dur: 0.3 });
A(r3(U5 + 1.15), "spud", "move", { to: [3.9, -3.3], y: ROAD, dur: 0.4, ease: "in" });
const CUT5C = F(U5 + 1.5);
see(B5, CUT5C, ["spud.face", "chip.face", "wedge.face", "car"], "they howl, x10,000, Spud turns to the car");

// ---------------------------------------------------------------- 5c he presses the upturned car overhead and throws it back on its wheels
// under the car (on its roof the car's "up" points at the road): gloves under the roof, 0.62 above his feet on the cut
const ROOF0 = 0.85, ROOF_UP = 1.33;
const carAt = (u) => [CAR_A[0], r3(ROAD + u + CAR_H), CAR_A[1]];
A(r3(CUT5C - 0.02), "spud", "move", { to: CAR_A, y: ROAD, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT5C - 0.02), "spud", "turn", { to: 0, dur: 0.01 });
A(r3(CUT5C - 0.02), "spud", "crouch", { to: 0.5, dur: 0.01 });
c.prop(r3(CUT5C - 0.03), "car", { y: carAt(ROOF0)[1] }, 0.01, "linear");
// the car's own frame: rot 90 (front +x), tilt 180 (on its roof): its x is the world's +z, its z the world's +x; scaled metres
palmsOn(r3(CUT5C - 0.01), "car", CAR_K, [0, CAR_H + 0.03, -0.26], [0, CAR_H + 0.03, 0.26], -1);
A(CUT5C, "spud", "look", { to: [0, 0.2], dur: 0.01 });
A(CUT5C, "spud", "expr", { expr: "cocky", dur: 0.01 });
const P5 = r3(CUT5C + 0.15);
A(P5, "wedge", "move", { to: [3.6, -0.6], dur: 0.8, ease: "inOut" });
c.prop(P5, "car", { y: carAt(ROOF_UP + 0.03)[1] }, 0.4, "out"); c.prop(r3(P5 + 0.42), "car", { y: carAt(ROOF_UP)[1] }, 0.12, "inOut");
A(P5, "spud", "crouch", { to: 0, dur: 0.45 });
sfx(P5, "creak", { gain: 0.4 });
const TH = r3(P5 + 1.0);
c.prop(r3(TH - 0.15), "car", { y: carAt(ROOF_UP - 0.12)[1] }, 0.15, "in");
A(r3(TH - 0.15), "spud", "crouch", { to: 0.3, dur: 0.15 });
c.arm(TH, "spud", "R", { o: [0.25, 0.75, 0.05] }, 0.2, "out"); c.arm(TH, "spud", "L", { o: [-0.25, 0.75, 0.05] }, 0.2, "out");
A(TH, "spud", "crouch", { to: 0, dur: 0.12 });
A(TH, "spud", "grip", { side: "both", shape: "open", dur: 0.15 });
sfx(TH, "whoosh", { gain: 0.3 });
// half a roll up and over to B, onto its wheels, one bounce
const LAND = r3(TH + 0.6);
c.prop(TH, "car", { x: 5.65, y: 3.6, tilt: 270 }, 0.3, "out");
c.prop(r3(TH + 0.3), "car", { x: CAR_B[0], y: ROAD, tilt: 360 }, 0.3, "in");
c.prop(LAND, "car", { y: ROAD + 0.12 }, 0.12, "out"); c.prop(r3(LAND + 0.12), "car", { y: ROAD }, 0.14, "in");
sfx(LAND, "thud", { gain: 1.0 }); sfx(LAND, "kenney/impact-metal-heavy", { gain: 0.7 }); sfx(r3(LAND + 0.26), "thud-soft", { gain: 0.5 });
c.at(LAND, { fx: "shake", amount: 0.06, dur: 0.25 });
// 5d the hero pose
c.arm(r3(TH + 0.2), "spud", "R", "hips", 0.4, "inOut"); c.arm(r3(TH + 0.2), "spud", "L", "hips", 0.4, "inOut");
A(r3(TH + 0.25), "spud", "grip", { side: "both", shape: "fist", dur: 0.2 });
A(r3(LAND + 0.1), "spud", "pitch", { to: -3, dur: 0.3 });
A(r3(LAND + 0.1), "spud", "expr", { expr: "cocky", dur: 0.2 });
A(r3(LAND + 0.1), "spud", "look", { to: [0, 0], dur: 0.2 });
const CUT6A = F(LAND + 1.2);
see(CUT5C, CUT6A, ["spud.face", "car"], "he presses the car overhead and throws it back on its wheels: hero pose");

// ---------------------------------------------------------------- 6a the thump shakes the parked bus loose
c.prop(r3(LAND + 0.05), "bus", { tip: 1.5 }, 0.15, "out"); c.prop(r3(LAND + 0.2), "bus", { tip: -1.0 }, 0.25, "inOut");
c.prop(r3(LAND + 0.45), "bus", { tip: 0.6 }, 0.25, "inOut"); c.prop(r3(LAND + 0.7), "bus", { tip: 0 }, 0.25, "inOut");
sfx(r3(CUT6A + 0.15), "hiss", { gain: 0.6 });
const ROLL = r3(CUT6A + 0.3);
c.prop(ROLL, "bus", { x: -4.2 }, 0.6, "in");
see(CUT6A, r3(CUT6A + 0.9), ["bus"], "the brake hisses, the empty bus starts to roll");

// ---------------------------------------------------------------- 6b Chip laughing in the lane, the bus comes; 6c Spud stops it one-handed
const CUT6B = F(CUT6A + 0.9);
A(r3(CUT6B - 0.02), "spud", "move", { to: [5.6, -4.0], y: ROAD, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT6B - 0.02), "spud", "turn", { to: -90, dur: 0.01 });
c.arm(r3(CUT6B - 0.02), "spud", "R", "rest", 0.01); c.arm(r3(CUT6B - 0.02), "spud", "L", "rest", 0.01);
A(r3(CUT6B - 0.02), "chip", "turn", { to: 20, dur: 0.01 });
laugh("chip", CUT6B, r3(CUT6B + 1.5), { amp: 8 });
A(CUT6B, "chip", "expr", { expr: "delighted", set: { lids: 1 }, dur: 0.1 });
tick(r3(CUT6B + 0.5), 100000);
const STOP = r3(CUT6B + 1.65);
c.prop(r3(ROLL + 0.6), "bus", { x: BUS_STOP - 0.12 }, r3(STOP - ROLL - 0.6), "in");
c.prop(STOP, "bus", { x: BUS_STOP + 0.04 }, 0.06, "out"); c.prop(r3(STOP + 0.06), "bus", { x: BUS_STOP }, 0.1, "inOut");
c.prop(STOP, "bus", { tip: 0, tilt: -1.2 }, 0.08, "out"); c.prop(r3(STOP + 0.08), "bus", { tilt: 0 }, 0.25, "inOut");
sfx(r3(STOP - 0.6), "rumble", { gain: 0.5 }); sfx(r3(STOP - 0.35), "horn", { gain: 0.5 });
// the leap: one side-on arc, 0.45 s at full speed, onto his mark three-quarter to camera, the bus-side arm out
const LEAP = r3(STOP - 0.45);
A(LEAP, "spud", "move", { to: SPUD_STOP, y: ROAD, dur: 0.45, ease: "linear" });
A(LEAP, "spud", "hop", { height: 1.0, dur: 0.45 });
A(r3(LEAP + 0.2), "spud", "turn", { to: -50, dur: 0.2 });
c.arm(r3(LEAP + 0.1), "spud", "R", { o: [0.5, 0.5, 0.05] }, 0.3, "out");
A(r3(LEAP + 0.1), "spud", "grip", { side: "R", shape: "flat", dur: 0.15 });
c.arm(r3(STOP + 0.1), "spud", "L", "hips", 0.3, "inOut");
A(STOP, "spud", "pitch", { to: 2, dur: 0.06 }); A(r3(STOP + 0.06), "spud", "pitch", { to: 0, dur: 0.2 });
A(STOP, "spud", "expr", { expr: "cocky", dur: 0.1 });
A(r3(STOP + 0.15), "spud", "look", { to: [0.7, 0], dur: 0.2 });
sfx(STOP, "screech", { gain: 0.6 }); sfx(STOP, "slam", { gain: 0.9 });
c.at(STOP, { fx: "shake", amount: 0.05, dur: 0.2 });
A(r3(STOP + 0.3), "chip", "expr", { expr: "surprised", dur: 0.12 });
A(r3(STOP + 0.3), "chip", "look", { to: [-0.7, 0], dur: 0.15 });
see(CUT6B, r3(STOP + 0.8), ["chip.face", "bus", "spud"], "the bus comes at laughing Chip, Spud lands and stops it with one hand, x100,000");

// ---------------------------------------------------------------- 7 "You're a superhero!" / "Trust me... with US in it!", they climb in
const CUT7 = F(T[2] - 0.2);
A(T[2], "chip", "hop", { height: 0.25, dur: 0.35 });
laugh("chip", r3(T[2] + 0.3), END_OF(2), { amp: 5 });
A(r3(T[2] - 0.3), "wedge", "move", { to: [3.25, -2.3], y: ROAD, dur: 0.6, ease: "inOut" });
A(r3(T[2] - 0.3), "wedge", "turn", { to: -40, dur: 0.4 });
A(T[2], "spud", "turn", { to: 20, dur: 0.3 });
A(T[2], "spud", "expr", { expr: "delighted", dur: 0.2 });
A(T[3], "wedge", "expr", { expr: "smug", dur: 0.2 });
A(T[3], "wedge", "grip", { side: "R", shape: "point", dur: 0.15 }); c.arm(T[3], "wedge", "R", { o: [0.45, 0.65, 0.1] }, 0.4, "inOut");
A(T[3], "wedge", "look", { to: [-0.8, 0.1], dur: 0.2 });
A(r3(T[3] + 0.3), "spud", "look", { to: [0.7, 0], dur: 0.2 });
const GO = r3(END_OF(3) - 0.6);
c.arm(GO, "wedge", "R", "rest", 0.35, "inOut"); A(GO, "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
const DOOR = [-0.55, -0.85];
A(GO, "chip", "move", { to: [DOOR[0] + 0.1, DOOR[1]], y: 0, dur: 1.0, ease: "inOut" });
A(r3(GO + 0.15), "wedge", "move", { to: [DOOR[0] + 0.95, DOOR[1] + 0.15], y: 0, dur: 1.1, ease: "inOut" });
A(r3(GO + 0.3), "spud", "look", { to: [-0.6, 0], dur: 0.3 });
see(T[2], r3(GO + 0.6), ["chip.face", "wedge.face", "spud.face"], "relief, then the dare, they head for the bus");

// 7c at the door: a hop each into the doorway, onto the front deck behind the windscreen (bus-local metres, scale 1)
const CUT7C = F(GO + 1.15);
const WEDGE_OFF = [0.30, 0.62, -0.69], CHIP_OFF = [0.38, 0.75, -0.21];
A(r3(CUT7C + 0.05), "wedge", "turn", { to: 180, dur: 0.2 }); A(r3(CUT7C + 0.05), "chip", "turn", { to: 180, dur: 0.2 });
const IN_W = r3(CUT7C + 0.3), IN_C = r3(IN_W + 0.3);
A(IN_W, "chip", "ride", { prop: "bus", off: CHIP_OFF, yaw: 90, dur: 0.45, ease: "inOut" });
A(IN_C, "wedge", "ride", { prop: "bus", off: WEDGE_OFF, yaw: 90, dur: 0.45, ease: "inOut" });
sfx(r3(IN_W + 0.4), "step", { gain: 0.5 }); sfx(r3(IN_C + 0.4), "step", { gain: 0.5 });
see(CUT7C, r3(IN_C + 0.5), ["bus"], "they hop in by the open door");

// ---------------------------------------------------------------- 8 x1,000,000: the bus goes up over his head (the cover)
const CUT8A = F(IN_C + 0.6);
A(r3(CUT8A - 0.02), "spud", "turn", { to: 70, dur: 0.01 });
c.arm(r3(CUT8A - 0.02), "spud", "R", "rest", 0.01); c.arm(r3(CUT8A - 0.02), "spud", "L", "rest", 0.01);
// riding the bus, a pitch rock jumps the drawn rig (draft 1's bench lesson): the laugh is small squash bounces
const rideLaugh = (w, t0, t1) => { A(t0, w, "expr", { expr: "delighted", dur: 0.12 }); for (let t = t0; t < t1 - 0.2; t = r3(t + 0.34)) A(t, w, "squash", { amount: 0.05, dur: 0.3 }); };
for (const w of ["chip", "wedge"]) rideLaugh(w, CUT8A, r3(CUT8A + 2.2));
const U8 = r3(CUT8A + 0.15);
tick(U8, 1000000); power(U8);
A(r3(U8 + 0.55), "spud", "move", { to: [0.5, -2.35], y: ROAD, dur: 0.3, ease: "in" });
const CUT8B = F(U8 + 0.8);
// on the cut: under the bus, crouched, the bus 0.3 m up, his gloves flat under its floor
const U0 = 0.85;
const busAt = (u) => [BUS_STOP, busY(u), BUS_Z];
A(CUT8B, "spud", "move", { to: SPUD_BUS, y: ROAD, dur: 0.01, ease: "linear", sync: true });
A(CUT8B, "spud", "turn", { to: 90, dur: 0.01 });
A(CUT8B, "spud", "crouch", { to: 0.5, dur: 0.01 });
c.prop(CUT8B, "bus", { y: busY(U0) }, 0.01, "linear");
const hx = r3(SPUD_BUS[0] - BUS_STOP), hz = r3(SPUD_BUS[1] - BUS_Z), gy = r3(BUS_UNDER - 0.03);
palmsOn(CUT8B, "bus", BUS_K, [hx, gy, r3(hz + 0.26)], [hx, gy, r3(hz - 0.26)], 1);
A(CUT8B, "spud", "look", { to: [0, 0.2], dur: 0.01 });
const L8 = r3(CUT8B + 0.15), FULL = 1.33;
c.prop(L8, "bus", { y: busAt(FULL + 0.03)[1] }, 0.5, "out"); c.prop(r3(L8 + 0.52), "bus", { y: busAt(FULL)[1] }, 0.15, "inOut");
A(L8, "spud", "crouch", { to: 0, dur: 0.5 });
A(L8, "spud", "expr", { expr: "cocky", dur: 0.2 });
sfx(L8, "creak", { gain: 0.5 }); sfx(r3(L8 + 0.5), "brassswell", { gain: 0.0001 });
const DOWN = r3(CUT8B + 1.6);
for (const w of ["chip", "wedge"]) A(DOWN, w, "look", { to: [0.2, -0.8], dur: 0.3 });
see(L8, T[4], ["bus", "spud", "chip.face", "wedge.face"], "x1,000,000: the bus with both friends over his head (the cover)");

// ---------------------------------------------------------------- 9 "But there's a catch." Up high they get scared, it drains
A(r3(T[4] + 0.35), "chip", "expr", { expr: "worried", dur: 0.25 }); A(r3(T[4] + 0.35), "wedge", "expr", { expr: "worried", dur: 0.25 });
let u = FULL;
const sink = (t, to, v, drain, knees) => {
  tick(t, v, drain); u = to;
  c.prop(t, "bus", { y: busAt(u)[1] }, 0.25, "inOut");
  A(t, "spud", "crouch", { to: knees, dur: 0.25 });
  c.prop(t, "bus", { tip: 1 }, 0.12, "out"); c.prop(r3(t + 0.12), "bus", { tip: 0 }, 0.2, "inOut");
  sfx(t, "creak", { gain: 0.45 });
};
const CUT9B = F(T[5] - 0.2);
A(T[5], "chip", "expr", { expr: "scared", dur: 0.2 });
sink(r3(END_OF(5) + 0.1), r3(FULL - 0.10), 100000, 0.2, 0.05);
A(r3(END_OF(5) + 0.1), "spud", "expr", { expr: "worried", dur: 0.2 });
const CUT9C = F(T[6] - 0.15);
A(T[6], "wedge", "expr", { expr: "scared", dur: 0.2 });
sink(r3(T[6] + 0.45), 1.15, 10000, 0.4, 0.1);
sink(r3(T[6] + 0.9), 1.07, 1000, 0.6, 0.15);
sink(r3(T[6] + 1.35), 0.99, 100, 0.75, 0.2);
A(r3(T[6] + 0.9), "spud", "expr", { expr: "terrified", dur: 0.2 });
see(T[4], r3(T[6] + 1.8), ["bus", "chip.face", "wedge.face"], "they look down and stop laughing; the chip drains, the bus sinks");

// ---------------------------------------------------------------- 10 "No, no, no... LAUGH AT ME!", they look at each other
const CUT10 = F(T[7] - 0.2);
A(T[7], "spud", "look", { to: [0, 0.7], dur: 0.2 });
sink(r3(T[7] + 0.6), 0.93, 10, 0.9, 0.3);
const CUT10B = F(END_OF(7) + 0.1);
A(r3(CUT10B + 0.15), "chip", "turn", { to: -70, dur: 0.3 }); A(r3(CUT10B + 0.15), "wedge", "turn", { to: -110, dur: 0.3 });
A(r3(CUT10B + 0.15), "chip", "look", { to: [0.6, 0], dur: 0.2 }); A(r3(CUT10B + 0.15), "wedge", "look", { to: [-0.6, 0], dur: 0.2 });
A(r3(CUT10B + 0.1), "chip", "expr", { expr: "worried", dur: 0.2 }); A(r3(CUT10B + 0.1), "wedge", "expr", { expr: "worried", dur: 0.2 });
see(T[7], r3(CUT10B + 0.9), ["spud.face", "chip.face", "wedge.face"], "he begs; they look at each other; nobody laughs");

// ---------------------------------------------------------------- 11 x1: it comes down on him (DESIGN-STREET.md section 5)
const CRASH = F(CUT10B + 1.0);
tick(CRASH, 1, 1.0);
const GIVE = r3(CRASH + 0.2);
// the tail drops first: the bus pitches nose-up 9 degrees about its rear wheels, which reach the road
const PITCH = 9, s9 = Math.sin((PITCH * Math.PI) / 180), REAR = -3.35 * BUS_K;
c.prop(GIVE, "bus", { y: r3(ROAD - REAR * s9) }, 0.2, "in");
c.prop(GIVE, "bus", { tilt: PITCH }, 0.2, "in");
c.prop(r3(GIVE + 0.2), "bus", { tilt: PITCH - 1.5 }, 0.1, "out"); c.prop(r3(GIVE + 0.3), "bus", { tilt: PITCH }, 0.12, "in");
A(GIVE, "spud", "crouch", { to: 1.6, dur: 0.2, ease: "in" });
A(r3(GIVE + 0.2), "spud", "squash", { amount: 0.3, dur: 0.35 });
A(r3(GIVE + 0.2), "spud", "expr", { expr: "dizzy", dur: 0.1 });
sfx(r3(GIVE + 0.2), "thud", { gain: 1.0 }); sfx(r3(GIVE + 0.2), "kenney/impact-metal-heavy", { gain: 1.0 }); sfx(r3(GIVE + 0.2), "crumble", { gain: 0.5 });
c.at(r3(GIVE + 0.2), { fx: "shake", amount: 0.07, dur: 0.3 });
// the friends come out of the open door on keyed arcs and land seated
const OFF = r3(GIVE + 0.13);
A(OFF, "chip", "ride", { prop: null, dur: 0 }); A(OFF, "wedge", "ride", { prop: null, dur: 0 });
A(OFF, "chip", "move", { to: [1.0, -0.2], y: 0, dur: 0.42, ease: "inOut" }); A(OFF, "chip", "hop", { height: 0.5, dur: 0.42 });
A(OFF, "wedge", "move", { to: [1.4, -2.6], y: ROAD, dur: 0.45, ease: "inOut" }); A(OFF, "wedge", "hop", { height: 0.4, dur: 0.45 });
A(OFF, "chip", "turn", { to: -10, dur: 0.3 }); A(OFF, "wedge", "turn", { to: -40, dur: 0.3 });
A(r3(OFF + 0.4), "chip", "crouch", { to: 0.6, dur: 0.2 }); A(r3(OFF + 0.43), "wedge", "crouch", { to: 0.6, dur: 0.2 });
A(r3(OFF + 0.3), "chip", "expr", { expr: "dizzy", dur: 0.1 }); A(r3(OFF + 0.3), "wedge", "expr", { expr: "dizzy", dur: 0.1 });
sfx(r3(OFF + 0.42), "thud-soft", { gain: 0.6 }); sfx(r3(OFF + 0.45), "thud-soft", { gain: 0.6 });
A(r3(OFF + 0.8), "chip", "look", { to: [-0.6, -0.2], dur: 0.2 }); A(r3(OFF + 0.95), "chip", "expr", { expr: "delighted", dur: 0.3 });
const END = F(CRASH + 1.3);
see(GIVE, END, ["bus", "spud", "chip.face", "wedge.face"], "x1: the bus comes down on him, they tumble out, cut");

act.blinksAt(c, "chip", [3.5, 13.9]);
act.blinksAt(c, "wedge", [6.0, 16.0]);

// ---------------------------------------------------------------- cameras (DESIGN-STREET.md section 3)
const CAM = {
  CARSIDE: { pos: [4.6, 1.5, 1.2], look: [4.6, 1.3, -5.6], fov: 40 },
  STREETB: { pos: [2.35, 1.45, 7.6], look: [2.35, 1.0, -2.4], fov: 40 },
  CARLOW: { pos: [4.6, 0.3, 0.4], look: [4.6, 1.5, -5.6], fov: 44 },
  STOP: { pos: [-1.2, 1.3, 3.4], look: [-4.2, 1.4, -2.0], fov: 40 },
  BUSSTOP: { pos: [1.6, 1.3, 6.4], look: [1.6, 1.2, -2.35], fov: 36 },
  DOOR: { pos: [-0.2, 1.4, 5.2], look: [-0.55, 1.3, -1.45], fov: 36 },
  LINEA: { pos: [5.4, 0.3, -1.5], look: [0.99, 0.85, -2.35], fov: 36 },
  HERO: { pos: [11.0, 0.35, -1.45], look: [-1.0, 1.93, -2.35], fov: 27 },
  WINDOW: { pos: [5.6, 2.75, -2.3], look: [0.3, 2.70, -2.35], fov: 30 },
  LINEB: { pos: [1.6, 0.25, -1.7], look: [-2.53, 0.75, -2.35], fov: 34 },
  CRASH: { pos: [10.5, 0.5, 0.6], look: [-0.6, 1.70, -2.0], fov: 30 },
};
const beats = c.beats([
  ["car hit", 0, CAM.CARSIDE, "hook"],
  ["you broke a car", B5, CAM.STREETB],
  ["car lift", CUT5C, CAM.CARLOW, "escalation"],
  ["bus loose", CUT6A, CAM.STOP],
  ["bus stop", CUT6B, CAM.BUSSTOP, "escalation"],
  ["superhero", CUT7, { ...CAM.STREETB }],
  ["climb in", CUT7C, CAM.DOOR],
  ["million", CUT8A, CAM.LINEA],
  ["bus lift", CUT8B, CAM.HERO, "escalation"],
  ["whoa", CUT9B, CAM.WINDOW],
  ["put us down", CUT9C, { ...CAM.HERO }],
  ["laugh at me", CUT10, CAM.LINEB],
  ["look", CUT10B, { ...CAM.WINDOW }],
  ["crash", CRASH, CAM.CRASH, "payoff"],
], END);

write(import.meta.url, {
  id: "laugh-street",
  title: "What if every laugh made you stronger? (part 2, the street)",
  idea: "There's a catch 10 v2: the street, x1,000 to x1,000,000 (car, bus rescue, bus overhead), then they stop laughing.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [256, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true,
  set: { type: "street", seed: 4, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the film's score from where the gym part ends (MUSIC_SKIP: the gym part's length)
  music: { file: process.env.MUSIC ?? "laugh-strength/laugh-film.ogg", skip: Number(process.env.MUSIC_SKIP ?? 11.567), gain: 0.45, lowCut: 120, lock: false, duck: { voice: -6 } },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "street", room: "open" },
  hud: { strength: { keys: KEYS, drain: DRAIN } },
  creative: { length: [30, 40] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "car", from: r3(CUT5C - 0.05), to: r3(TH + 0.1), reason: "Spud under the upturned car he holds over his head" },
    { who: "spud", from: r3(CUT5C - 0.05), to: r3(TH + 0.1), checks: ["held-high"], reason: "the joke: he presses the car over his head" },
    { who: "spud", with: "bus", from: r3(LEAP - 0.05), to: END, reason: "his palm on the bus's bumper, then he is under the bus he holds up, and under it at the crash" },
    { who: "spud", from: r3(CUT8B - 0.05), to: END, checks: ["held-high"], reason: "the joke: he holds the bus with both friends over his head" },
    { who: "spud", from: r3(LEAP - 0.05), to: r3(STOP + 0.05), checks: ["rig-jump"], reason: "the superhero leap: 4.9 m in one 0.45 s arc, fast on purpose (seen in a 30 fps strip: it reads as one arc)" },
    { who: "spud", with: "bus", from: r3(CUT8B - 0.05), to: END, checks: ["shell"], reason: "his crown and sprout press up against the bus floor he holds (and it comes down on him at the crash)" },
    { who: "spud", with: "car", from: r3(CUT5C - 0.05), to: r3(TH + 0.1), checks: ["shell"], reason: "his crown under the roof of the upturned car he lifts" },
    { who: "chip", with: "wedge", from: IN_C, to: r3(OFF + 0.5), checks: ["character-overlap"], reason: "side by side at the windscreen, shoulder to shoulder, then tumbling out of the door together" },
    { who: "chip", with: "bus", from: r3(IN_W - 0.2), to: r3(OFF + 0.3), checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "gloves on the dash and the glass inside the bus, his hoodie brushing the door frame as he hops in and out" },
    { who: "wedge", with: "bus", from: r3(IN_C - 0.2), to: r3(OFF + 0.3), checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "gloves on the dash and the glass inside the bus, his coat brushing the door frame as he hops in and out" },
    { who: "chip", with: "bus", from: IN_W, to: r3(OFF + 0.2), checks: ["shell", "clipping"], reason: "Chip rides the bus, standing on the dash ledge behind the windscreen" },
    { who: "wedge", with: "bus", from: IN_C, to: r3(OFF + 0.2), checks: ["shell", "clipping"], reason: "Wedge rides the bus, standing on the front deck behind the windscreen" },
  ],
  notes: "Generated by storyboards/series/what-if/10-laugh-strength/make-laugh-street.mjs.",
});
export const TIMES = { T, CRASH, END };
