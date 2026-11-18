// THERE'S A CATCH 10 "What if every laugh made you stronger?" (18 Nov 2026, YouTube Shorts first). Outline:
// /mnt/project-files/videos/what-if/10-laugh-strength/OUTLINE.md. Design: ./DESIGN.md (Fable 5.2). Lines: ./lines.mjs.
//   node storyboards/series/what-if/10-laugh-strength/make-laugh-strength.mjs -> laugh-strength.json
//
// Told the Court Day way (Potato Desk 05: 51 % finish): the friends speak the joke, a visible counter (the STRENGTH
// board), cut on the payoff, loop. Opener A: the mocking is already running at frame 0.
// Chain: Spud can't lift the empty bar, so they laugh; every laugh x10, so he lifts it; so Wedge says it's fake, so he
// loads every plate and presses it; so Chip says he'll snap, so x1,000; so Wedge dares him to lift THEM, so they sit on
// the bench laughing, so x10,000, so he lifts the bench overhead; so they stop laughing in awe, so the board drains, so
// the bench sinks; so he begs "LAUGH AT ME!", so they look at each other, so x1, so it all comes down on him. Cut.
// Departures from DESIGN.md (named in the delivery): both hands stay on the bar the whole time (one bar hold, the
// underhand grip from hip to overhead, no one-hand lifts: fewer hand changes); the hip hold sits at y 0.40, not 0.52
// (at 0.52 the bar covers his mouth: grip bench); the crash is keyed (Spud squashed under the pad, which he never lets
// go of), not a physics fall onto his back; the bench grip is at x ±0.26 (±0.30 put the sleeves into the legs).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (node qa/lines.mjs catch10-voice-probe.json, 18 Nov 2026), in LINES order; the narrator's
// "But there's a catch." is re-read (take 2: take 1 was 38 % fast) and measured again in the build
const DUR = [2.15, 1.60, 3.17, 1.92, 2.48, 1.60, 1.30, 0.96, 2.25, 3.27];
const T = [0.0, 2.40, 4.30, 7.75, 9.95, 12.65, 14.80, 16.50, 17.90, 20.40];
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN.md section 4; x right, z toward us)
const SPUD0 = [0.76, -1.02], STRIDE = [0.30, -1.02], UNDER = [-0.57, -1.0];
const WEDGE0 = [-0.80, -0.48];
const BAR_AT = [0.76, 0.40, -0.60], BAR_UP = [0.76, 1.35, -0.60], BAR_HEAVE = [0.76, 0.45, -0.60];
const BENCH_FLOOR = 0.03, BENCH_START = 0.80, BENCH_TOP = 1.02;
const BAR = { id: "bar", kind: "barbell", plates: 0, staged: "in Spud's gloves from frame 0", ...grips.placeFor("barbell", BAR_AT, 0) };
const BENCH = { id: "bench", kind: "weightbench", ...grips.placeFor("weightbench", [UNDER[0], BENCH_FLOOR, UNDER[1]], 0) };
// the lifted bench is a second one, shown on the cut (riders on a bench that teleports jumped early in the drawn rig)
const BENCH2 = { id: "bench2", kind: "weightbench", scale: 0.001, staged: "shown on the cut to the hero shot, in Spud's gloves", ...grips.placeFor("weightbench", [UNDER[0], BENCH_START, UNDER[1]], 0) };
// riders on the bench (its rot is 180, so its own +x is the world's -x): offsets in the bench's frame
const SEAT_Y = 0.34, STAND_Y = 0.42;
const WEDGE_SEAT = [0.37, SEAT_Y, 0.02], CHIP_SEAT = [-0.44, SEAT_Y, 0.02], CHIP_STAND = [-0.42, STAND_Y, 0];

const props = [
  { id: "marks", kind: "gymmarks", x: 0, y: 0, z: 0 },
  { id: "board", kind: "strengthboard", x: 0.95, y: 1.99, z: -1.945, rot: 0, staged: "wall board hung on the mirror rail by two straps" },
  { id: "matA", kind: "crashmat", x: -0.90, y: 0.04, z: 0.12, rot: 4 },
  { id: "matB", kind: "crashmat", x: 0.40, y: 0.04, z: 0.16, rot: -3, seams: [-0.36, 0.0, 0.33] },
  { id: "shelf", kind: "towelshelf", x: 1.73, y: 0.95, z: -1.80, rot: 0 },
  { id: "bag", kind: "gymbag", x: 1.12, y: 0.13, z: 0.95, rot: -18 },
  { id: "bottle", kind: "gymbottle", x: 0.80, y: 0.12, z: 1.02, rot: 0 },
  BAR, BENCH, BENCH2,
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 0, expr: "focused", follow: 0.2, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: [-0.19, -1.0], face: 20, expr: "delighted", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: 30, expr: "delighted", follow: 0.3, seed: 3.1 },
];

// captions: upper third (rows 200-640 hold no face, DESIGN.md section 5); numbers as digits
const SUB = 470;
const CAPTEXT = { 1: "Ha ha ha! It's *EMPTY!*", 2: "Ha ha! Trust me, it's *fake!*", 3: "Ha ha! He's gonna *snap!*", 4: "Trust me... he can't lift *US!*", 5: "HA HA HA HA HA!", 7: "Whoa.", 9: "No, no, no... *LAUGH AT ME!*" };
const say = (i) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 1.2));
  if (who === "nar") c.at(T[i], { macro: "narrate", line, voice: "narrator", take: o.take ?? 1, dur: DUR[i], caption: false });
  else c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false });
  cap(T[i], to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};
LINES.forEach((_, i) => say(i));

// ---------------------------------------------------------------- the board (DESIGN.md section 2): ticks of 6 frames
c.prop(0, "board", { step: 0, drain: 0 }, 0.01);
const tickUp = (t, i) => { c.prop(t, "board", { step: r3(i + 1.06) }, 0.13, "out"); c.prop(r3(t + 0.13), "board", { step: i + 1 }, 0.07, "inOut"); sfx(t, "kenney/switch", { gain: 0.5 }); };
const tickDown = (t, i, drain) => { c.prop(t, "board", { step: r3(i - 1 - 0.03) }, 0.12, "out"); c.prop(r3(t + 0.12), "board", { step: i - 1 }, 0.08, "inOut"); c.prop(t, "board", { drain }, 0.2); sfx(t, "kenney/switch", { gain: 0.45 }); };

// the power look (DESIGN.md section 3): chest up, a stretch, then he settles a little taller each time
let tall = 0;
const power = (t) => {
  act.breath(c, r3(t + 0.07), "spud", { big: 1, hold: 0.2 });
  A(r3(t + 0.07), "spud", "grow", { to: 1.05, dur: 0.13, ease: "out" }); A(r3(t + 0.4), "spud", "grow", { to: 1.0, dur: 0.2, ease: "inOut" });
  tall = Math.min(tall + 1, 2);
  A(r3(t + 0.07), "spud", "pitch", { to: -5, dur: 0.13 }); A(r3(t + 0.4), "spud", "pitch", { to: -tall, dur: 0.2 });
  A(r3(t + 0.07), "spud", "expr", { expr: "surprised", dur: 0.12 }); A(r3(t + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
};

// laughing: the face, a point, and the body rocking with it (pitch every ~0.17 s)
const laugh = (who, t0, t1, { amp = 5, side = "L", point = null, seated = false } = {}) => {
  A(t0, who, "expr", { expr: "delighted", dur: 0.12 });
  if (point) { A(t0, who, "grip", { side, shape: "point", dur: 0.15 }); c.arm(t0, who, side, point, 0.4, "inOut"); }
  // seated on the bench (riding it) a pitch rock jumps the drawn rig: there the laugh is small squash bounces
  if (seated) { for (let t = t0; t < t1 - 0.2; t = r3(t + 0.34)) A(t, who, "squash", { amount: 0.05, dur: 0.3 }); return; }
  let k = 0; for (let t = t0; t < t1 - 0.1; t = r3(t + 0.17), k++) A(t, who, "pitch", { to: k % 2 ? -amp * 0.4 : amp, dur: 0.15, ease: "inOut" });
  A(r3(t1), who, "pitch", { to: 0, dur: 0.2 });
  if (point) { c.arm(r3(t1 + 0.05), who, side, "rest", 0.35, "inOut"); A(r3(t1 + 0.05), who, "grip", { side, shape: "relaxed", dur: 0.2 }); }
};

// ---------------------------------------------------------------- frame 0: he can't lift the empty bar, they laugh
A(0, "spud", "turn", { to: 0, dur: 0.01 });
A(0, "spud", "noblink");
A(0, "chip", "ride", { prop: "bench", off: CHIP_STAND, yaw: 160, dur: 0 });
const bar = grips.bar(c, "spud", BAR, { under: true });
bar.take(0, { reach: 0.01, settle: 0.01 });
A(0, "spud", "pitch", { to: -6, dur: 0.01 });
A(0, "spud", "look", { to: [0, -0.15], dur: 0.01, blink: false });
// two heaves: it lifts 5 cm and sinks back
for (const h0 of [0.35, 1.45]) { bar.carry(h0, BAR_HEAVE, 0.3, "out"); bar.carry(r3(h0 + 0.35), BAR_AT, 0.35, "in"); A(h0, "spud", "squash", { amount: 0.06, dur: 0.6 }); }
sfx(0.05, "kenney/impact-metal-light", { gain: 0.25 }); sfx(1.85, "kenney/impact-metal-light", { gain: 0.25 });
const PT_W = { o: [0.1, 0.62, 0.32] }, PT_C = { o: [0.1, 0.7, 0.3] };
laugh("wedge", 0, 2.3, { side: "L", point: PT_W, amp: 3 });
laugh("chip", 0, 2.3, { side: "R", point: PT_C, amp: 6 });
A(0, "wedge", "look", { to: [0.6, -0.1], dur: 0.01, blink: false });
A(0, "chip", "look", { to: [0.6, -0.2], dur: 0.01, blink: false });
see(0, 2.4, ["spud.face", "bar", "chip.face", "wedge.face", "board"], "he strains at the empty bar, they laugh, the board says x1");

// ---------------------------------------------------------------- 1 CHIP laughs: x10, he lifts the bar overhead easily
const U1 = r3(T[1] + 0.15);
laugh("chip", T[1], END_OF(1), { side: "R", point: PT_C, amp: 6 });
tickUp(U1, 0); power(U1);
A(r3(U1 + 0.1), "spud", "look", { to: [0, 0.3], dur: 0.2 });
bar.carry(r3(U1 + 0.35), BAR_UP, 0.5, "inOut");
sfx(r3(U1 + 0.35), "kenney/impact-metal-light", { gain: 0.2 });
A(r3(U1 + 0.8), "spud", "expr", { expr: "delighted", dur: 0.2 });
A(r3(U1 + 0.8), "chip", "expr", { expr: "surprised", dur: 0.12 }); A(r3(U1 + 1.1), "chip", "expr", { expr: "delighted", dur: 0.2 });
see(U1, END_OF(1), ["board", "spud.face", "bar"], "x10, the empty bar goes up like nothing");

// ---------------------------------------------------------------- 2 WEDGE: "Trust me, it's fake!": x100, every plate, the bar bends, he presses it
const U2 = r3(T[2] + 0.15);
laugh("wedge", T[2], r3(T[2] + 1.0), { side: "L", point: PT_W, amp: 3 });
tickUp(U2, 1); power(U2);
bar.carry(r3(U2 + 0.4), BAR_AT, 0.45, "inOut");
A(r3(T[2] + 1.0), "wedge", "expr", { expr: "smug", dur: 0.2 });
const PL = r3(END_OF(2) - 1.2);   // the plates go on after "fake" is said (12 frames, three clanks)
c.prop(PL, "bar", { plates: 3, bend: 0.55 }, 0.4, "linear");
for (let k = 0; k < 3; k++) sfx(r3(PL + k * 0.133), "kenney/impact-metal-heavy", { gain: 0.6 });
A(PL, "spud", "crouch", { to: 0.5, dur: 0.2 }); A(r3(PL + 0.4), "spud", "crouch", { to: 0, dur: 0.3 });
bar.carry(r3(PL + 0.45), BAR_UP, 0.5, "inOut");
A(r3(PL + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
A(r3(PL + 0.6), "wedge", "expr", { expr: "shocked", dur: 0.12 });
see(PL, r3(PL + 1.0), ["bar", "spud.face", "board"], "x100, three plates a side, the bar bends, up it goes");

// ---------------------------------------------------------------- 3 CHIP: "He's gonna snap!": x1,000, he pumps it
const U3 = r3(T[3] + 0.15);
laugh("chip", T[3], END_OF(3), { side: "R", point: PT_C, amp: 6 });
laugh("wedge", r3(T[3] + 0.3), END_OF(3), { amp: 3 });
tickUp(U3, 2); power(U3);
for (const p of [0.5, 1.05]) { bar.carry(r3(U3 + p), [BAR_UP[0], 1.12, BAR_UP[2]], 0.25, "inOut"); bar.carry(r3(U3 + p + 0.27), BAR_UP, 0.25, "out"); }
see(U3, END_OF(3), ["board", "bar", "spud.face"], "x1,000, he pumps the bent bar like it's nothing");

// ---------------------------------------------------------------- 4 WEDGE: "Trust me... he can't lift US!": the bar drops, they sit on the bench
bar.carry(T[4], BAR_AT, 0.45, "inOut");
const LET = r3(T[4] + 0.55);
c.A(LET, "spud", "release", { prop: "bar", dur: 0 });
A(LET, "spud", "grip", { side: "both", shape: "open", dur: 0.25 });
c.arm(r3(LET + 0.15), "spud", "R", "rest", 0.6, "inOut"); c.arm(r3(LET + 0.15), "spud", "L", "rest", 0.6, "inOut");
sfx(r3(LET + 0.22), "kenney/impact-metal-heavy", { gain: 0.9 });
A(T[4], "wedge", "expr", { expr: "cocky", dur: 0.2 });
A(r3(T[4] + 0.9), "wedge", "move", { to: [-0.92, -0.55], dur: 0.45, ease: "inOut" });
act.eyesLead(c, r3(T[4] + 0.9), "wedge", [-0.3, -0.3]);
A(r3(T[4] + 1.35), "wedge", "turn", { to: 8, dur: 0.25 });
A(r3(T[4] + 1.5), "wedge", "ride", { prop: "bench", off: WEDGE_SEAT, yaw: 172, sit: true, dur: 0.45 });
for (const s of ["R", "L"]) { c.arm(r3(T[4] + 1.5), "wedge", s, "lap", 0.7, "inOut"); c.arm(r3(T[4] + 1.7), "chip", s, "lap", 0.6, "inOut"); }
A(r3(T[4] + 1.7), "chip", "ride", { prop: "bench", off: CHIP_SEAT, yaw: 188, sit: true, dur: 0.4 });
A(r3(T[4] + 0.2), "spud", "look", { to: [-0.6, 0], dur: 0.25 });
see(T[4], END_OF(4), ["wedge.face", "chip.face", "bench"], "Wedge dares him and the two sit on the bench");

// ---------------------------------------------------------------- 5 CHIP laughs: x10,000, the stride, CUT, the bench goes up with both on it
const U5 = r3(T[5] + 0.15);
laugh("chip", T[5], END_OF(5), { seated: true });
laugh("wedge", r3(T[5] + 0.2), r3(END_OF(5) - 0.3), { seated: true });
tickUp(U5, 3); power(U5);
A(r3(U5 + 0.35), "spud", "move", { to: STRIDE, dur: 0.45, ease: "in" });
const CUT = F(U5 + 0.75);
// on the cut: Spud under the bench, crouched, the bench already at 0.80, his gloves on it
c.prop(r3(CUT - 0.03), "bench2", { scale: 1 }, 0.01, "linear");
c.prop(CUT, "bench", { x: -20 }, 0.01, "linear");
A(CUT, "wedge", "ride", { prop: "bench2", off: WEDGE_SEAT, yaw: 172, sit: true, dur: 0, ease: "linear", sync: true });
A(CUT, "chip", "ride", { prop: "bench2", off: CHIP_SEAT, yaw: 188, sit: true, dur: 0, ease: "linear", sync: true });
A(r3(CUT - 0.02), "spud", "move", { to: UNDER, dur: 0.01, ease: "linear", sync: true });
A(r3(CUT - 0.02), "spud", "crouch", { to: 1.1, dur: 0.01 });
A(r3(CUT - 0.02), "spud", "pitch", { to: 0, dur: 0.01 });
const bench = grips.underpad(c, "spud", { ...BENCH2, scale: 1 }, { gx: 0.26 });
bench.take(r3(CUT - 0.01), { reach: 0.01, settle: 0.01 });
A(CUT, "spud", "look", { to: [0, 0.5], dur: 0.01 });
const LIFT = r3(CUT + 0.1);
bench.carry(LIFT, [UNDER[0], BENCH_TOP + 0.02, UNDER[1]], 0.45, "out"); bench.carry(r3(LIFT + 0.47), [UNDER[0], BENCH_TOP, UNDER[1]], 0.12, "inOut");
A(LIFT, "spud", "crouch", { to: 0, dur: 0.5 });
A(LIFT, "spud", "expr", { expr: "cocky", dur: 0.2 });
A(r3(END_OF(5) - 0.2), "chip", "expr", { expr: "surprised", dur: 0.2 }); A(r3(END_OF(5)), "wedge", "expr", { expr: "surprised", dur: 0.2 });
A(r3(END_OF(5) - 0.2), "chip", "look", { to: [0, -0.6], dur: 0.25 }); A(r3(END_OF(5)), "wedge", "look", { to: [0.2, -0.6], dur: 0.25 });
see(LIFT, T[6], ["spud.face", "bench2", "chip.face", "wedge.face", "board"], "x10,000: the bench and both friends over his head (the cover)");

// ---------------------------------------------------------------- 6 NARRATOR: "But there's a catch." (the hold; the laughs have stopped)
A(T[6], "chip", "expr", { expr: "shocked", dur: 0.2 }); A(T[6], "wedge", "expr", { expr: "shocked", dur: 0.2 });

// ---------------------------------------------------------------- 7 CHIP "Whoa." (close): x1,000, the bench sinks
const CLOSE_AT = r3(T[7] - 0.25);
const D1 = r3(END_OF(7) + 0.1);
tickDown(D1, 4, 0.25);
let bx = UNDER[0];
const sink = (t, feet, crouch, shuffle = 0) => {
  bx = r3(bx + shuffle);
  bench.carry(t, [bx, feet, UNDER[1]], 0.27, "inOut");
  A(t, "spud", "crouch", { to: crouch, dur: 0.27 });
  if (shuffle) A(t, "spud", "move", { to: [bx, UNDER[1]], dur: 0.3, ease: "inOut", stride: 0.3 });
  A(t, "spud", "pitch", { to: 3, dur: 0.2 });
};
sink(D1, 0.96, 0.03);
A(D1, "spud", "expr", { expr: "worried", dur: 0.2 });

// ---------------------------------------------------------------- 8 WEDGE "He's actually strong." (wide): x100, x10
const BACK = r3(T[8] - 0.2);
const D2 = r3(T[8] + 0.7), D3 = r3(END_OF(8) - 0.3);
tickDown(D2, 3, 0.5); sink(D2, 0.90, 0.05, 0.12);
tickDown(D3, 2, 1.0); sink(D3, 0.84, 0.10, 0.12);
A(D2, "spud", "expr", { expr: "terrified", dur: 0.2 });
see(D2, r3(D3 + 0.5), ["board", "bench2", "spud.face"], "silence: the board drains, the bench sinks");

// ---------------------------------------------------------------- 9 SPUD "No, no, no... LAUGH AT ME!", they look at each other, x1, the crash
A(T[9], "spud", "look", { to: [-0.2, 0.6], dur: 0.2 });
A(r3(T[9] - 0.2), "chip", "look", { to: [0.2, -0.7], dur: 0.3 }); A(r3(T[9] - 0.2), "wedge", "look", { to: [0.3, -0.7], dur: 0.3 });
const GL = r3(END_OF(9) + 0.05);
A(GL, "chip", "look", { to: [-0.8, 0.2], dur: 0.2 }); A(GL, "wedge", "look", { to: [0.8, -0.2], dur: 0.2 });
A(GL, "chip", "expr", { expr: "worried", dur: 0.2 }); A(GL, "wedge", "expr", { expr: "worried", dur: 0.2 });
const X1 = r3(GL + 0.45);
tickDown(X1, 1, 1.0);
const CRASH = r3(X1 + 0.2);
bench.carry(CRASH, [bx, 0.42, UNDER[1]], 0.13, "in");
A(CRASH, "spud", "crouch", { to: 1.6, dur: 0.13, ease: "in" });
A(r3(CRASH + 0.13), "spud", "squash", { amount: 0.3, dur: 0.35 });
A(r3(CRASH + 0.13), "spud", "expr", { expr: "dizzy", dur: 0.1 });
sfx(r3(CRASH + 0.13), "kenney/impact-metal-heavy", { gain: 1.0 }); sfx(r3(CRASH + 0.13), "thud", { gain: 0.9 });
// the friends come off on keyed arcs and land seated on the mats
const OFF = r3(CRASH + 0.04);
A(OFF, "wedge", "ride", { prop: null, dur: 0 }); A(OFF, "chip", "ride", { prop: null, dur: 0 });
A(OFF, "wedge", "move", { to: [-1.02, 0.14], y: 0.08, dur: 0.4, ease: "inOut" });
A(OFF, "chip", "move", { to: [0.55, 0.18], y: 0.08, dur: 0.42, ease: "inOut" });
A(r3(OFF + 0.36), "wedge", "crouch", { to: 0.6, dur: 0.25 }); A(r3(OFF + 0.38), "chip", "crouch", { to: 0.6, dur: 0.25 });
A(OFF, "wedge", "turn", { to: 0, dur: 0.3 }); A(OFF, "chip", "turn", { to: 0, dur: 0.3 });
sfx(r3(OFF + 0.4), "thud-soft", { gain: 0.7 }); sfx(r3(OFF + 0.42), "thud-soft", { gain: 0.6 });
A(r3(OFF + 0.3), "wedge", "expr", { expr: "dizzy", dur: 0.1 }); A(r3(OFF + 0.3), "chip", "expr", { expr: "dizzy", dur: 0.1 });
const END = F(CRASH + 0.75);
see(CRASH, END, ["bench2", "spud", "chip.face", "wedge.face", "board"], "x1: it all comes down, cut on the impact");

act.blinksAt(c, "chip", [5.2, 11.0]);
act.blinksAt(c, "wedge", [3.6, 8.8]);

// ---------------------------------------------------------------- cameras (DESIGN.md section 5)
const WIDE = { pos: [0.06, 1.62, 7.85], look: [0.06, 1.62, -1.0], fov: 36 };
const HERO = { pos: [-1.25, 0.36, 3.45], look: [-0.20, 1.75, -1.0], fov: 52 };
const CLOSE = { pos: [-0.62, 1.95, 4.65], look: [-0.62, 1.95, -1.0], fov: 30 };
const beats = c.beats([
  ["empty bar", 0, WIDE, "hook"],
  ["fake", T[2], "keep"],
  ["snap", T[3], "keep", "escalation"],
  ["lift us", T[4], "keep"],
  ["the lift", CUT, HERO],
  ["whoa", CLOSE_AT, CLOSE],
  ["drain", BACK, { ...WIDE }],
  ["crash", CRASH, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "laugh-strength",
  title: "What if every laugh made you stronger?",
  idea: "There's a catch 10: every laugh makes Spud 10x stronger, until his friends stop laughing.",
  fps: 30, look: "anime-pro", profile: "short", loop: true,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "gym", seed: 6, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the score: playful pizzicato under the mocking, a heroic fanfare at the lift, suspense from "But there's a catch"
  music: { file: process.env.MUSIC ?? "laugh-strength/laugh-score.ogg", gain: 0.45, lowCut: 120, lock: false, duck: { voice: -6 } },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [20, 30] },
  hook: { show: ["spud", "bar", "chip", "wedge", "board"], hint: 0, what: "two friends laugh at a potato who can't lift an empty bar; a STRENGTH board says x1" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "bench", from: 0, to: END, reason: "Chip stands, then sits, on the bench (he rides it)" },
    { who: "wedge", with: "bench", from: r3(T[4] + 1.4), to: END, reason: "Wedge sits on the bench (he rides it)" },
    { who: "spud", with: "bench2", from: r3(CUT - 0.05), to: END, reason: "Spud under the bench he holds up; at the crash it comes down on him" },
    { who: "spud", from: 2.8, to: r3(T[4] + 0.6), checks: ["held-high"], reason: "the joke: he presses the bar over his head (above the face, never across it)" },
    { who: "spud", from: r3(CUT - 0.05), to: END, checks: ["held-high"], reason: "the joke: he holds the bench with both friends over his head" },
    { who: "wedge", with: "bench", from: r3(T[4] + 1.4), to: CUT, checks: ["shell"], reason: "Wedge sits on the bench pad (his round bottom rests in the 0.3 m pad)" },
    { who: "chip", with: "bench", from: 0, to: CUT, checks: ["shell"], reason: "Chip stands, then sits, on the bench pad" },
    { who: "wedge", with: "bench2", from: r3(CUT - 0.05), to: r3(CRASH + 0.05), checks: ["shell", "clipping"], reason: "Wedge sits on the lifted bench pad" },
    { who: "chip", with: "bench2", from: r3(CUT - 0.05), to: r3(CRASH + 0.05), checks: ["shell", "clipping"], reason: "Chip sits on the lifted bench pad" },
    { who: "spud", with: "wedge", from: r3(CUT - 0.05), to: r3(CRASH + 0.05), checks: ["character-overlap"], reason: "Spud's right glove is under the pad where Wedge sits on it (the glove under the pad, his bottom on top: 1-2 cm of pad between, seen from below)" },
  ],
  notes: "Generated by storyboards/series/what-if/10-laugh-strength/make-laugh-strength.mjs.",
});
export const TIMES = { T, CUT, END };
