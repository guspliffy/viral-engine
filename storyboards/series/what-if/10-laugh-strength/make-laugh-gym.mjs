// THERE'S A CATCH 10 v3, PART 1: THE GYM (18 Nov 2026; v3: Jonny's notes on draft 2, the toss is gone: he sets the bar down and walks out)...
// make the video bigger up to 1 min, more sceneries, make him more superhero before he loses his powers").
// Outline: /mnt/project-files/videos/what-if/10-laugh-strength/OUTLINE-v2.md. Design: ./DESIGN.md (gym) + ./DESIGN-STREET.md
// section 7 (the gym in the longer cut: tighter wide, two punch-ins, the toss). Lines: ./lines.mjs (LINES 0-3 + TOSS).
//   node storyboards/series/what-if/10-laugh-strength/make-laugh-gym.mjs -> laugh-gym.json; the street is make-laugh-street.mjs
//
// Chain: Spud can't lift the empty bar, so they laugh; x10, so he lifts it; so Wedge says it's fake, so x100 with every
// plate; so Chip says he'll snap, so x1,000; so Spud shows off: sets the bar down, "Watch this!", walks out to the street
// light: glass, they all look up. Cut to the street (part 2), where it comes down on a car.
// Voices are dry (Jonny 18 Nov: "the voices echo"; the gym set's "hall" room put every voice in a 1.4 s tail).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES, TOSS } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const GLINES = [...LINES.slice(0, 4), TOSS];

// measured spoken lengths (catch10-voice-probe, 18 Nov 2026), in GLINES order
const DUR = [2.15, 1.60, 3.17, 1.92, 0.80];
const T = [0.0, 2.40, 4.30, 7.75, null];   // T[4] ("Watch this!") follows the set-down clank
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN.md section 4; x right, z toward us)
const SPUD0 = [0.76, -1.02], UNDER = [-0.57, -1.0];
const WEDGE0 = [-0.80, -0.48];
const BAR_AT = [0.76, 0.40, -0.60], BAR_UP = [0.76, 1.35, -0.60], BAR_HEAVE = [0.76, 0.45, -0.60], BAR_DIP = [0.76, 1.05, -0.60];
const BENCH_FLOOR = 0.03;
const BAR = { id: "bar", kind: "barbell", plates: 0, staged: "in Spud's gloves from frame 0", ...grips.placeFor("barbell", BAR_AT, 0) };
const BENCH = { id: "bench", kind: "weightbench", ...grips.placeFor("weightbench", [UNDER[0], BENCH_FLOOR, UNDER[1]], 0) };
const STAND_Y = 0.42, CHIP_STAND = [-0.42, STAND_Y, 0];

const props = [
  { id: "marks", kind: "gymmarks", x: 0, y: 0, z: 0 },
  { id: "board", kind: "strengthboard", x: 0.95, y: 1.99, z: -1.945, rot: 0, staged: "wall board hung on the mirror rail by two straps" },
  { id: "matA", kind: "crashmat", x: -0.90, y: 0.04, z: 0.12, rot: 4 },
  { id: "matB", kind: "crashmat", x: 0.40, y: 0.04, z: 0.16, rot: -3, seams: [-0.36, 0.0, 0.33] },
  { id: "shelf", kind: "towelshelf", x: 1.73, y: 0.95, z: -1.80, rot: 0 },
  { id: "bag", kind: "gymbag", x: 1.12, y: 0.13, z: 0.95, rot: -18 },
  { id: "bottle", kind: "gymbottle", x: 0.80, y: 0.12, z: 1.02, rot: 0 },
  BAR, BENCH,
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 0, expr: "focused", follow: 0.2, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: [-0.19, -1.0], face: 20, expr: "delighted", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: 30, expr: "delighted", follow: 0.3, seed: 3.1 },
];

// captions: upper third (rows 200-640 hold no face, DESIGN.md section 5); numbers as digits
const SUB = 470;
const CAPTEXT = { 1: "Ha ha ha! It's *EMPTY!*", 2: "Ha ha! Trust me, it's *fake!*", 3: "Ha ha! He's gonna *snap!*", 4: "*Watch this!*" };
const say = (i) => {
  const [who, line, tone, style, o = {}] = GLINES[i];
  const to = r3(Math.min(END_OF(i) + 0.3, T[i + 1] ?? END_OF(i) + 0.6));
  if (who === "nar") c.at(T[i], { macro: "narrate", line, voice: "narrator", take: o.take ?? 1, dur: DUR[i], caption: false });
  else c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false });
  cap(T[i], to, CAPTEXT[i] ?? line, i === 4 ? 660 : SUB, false, { size: 64 });
};
GLINES.slice(0, 4).forEach((_, i) => say(i));

// ---------------------------------------------------------------- the board (DESIGN.md section 2): ticks of 6 frames
c.prop(0, "board", { step: 0, drain: 0 }, 0.01);
const tickUp = (t, i) => { c.prop(t, "board", { step: r3(i + 1.06) }, 0.13, "out"); c.prop(r3(t + 0.13), "board", { step: i + 1 }, 0.07, "inOut"); sfx(t, "kenney/switch", { gain: 0.5 }); };

// the power look (DESIGN.md section 3): chest up, a stretch, then he settles a little taller each time
let tall = 0;
const power = (t) => {
  act.breath(c, r3(t + 0.07), "spud", { big: 1, hold: 0.2 });
  A(r3(t + 0.07), "spud", "grow", { to: 1.05, dur: 0.13, ease: "out" }); A(r3(t + 0.4), "spud", "grow", { to: 1.0, dur: 0.2, ease: "inOut" });
  tall = Math.min(tall + 1, 2);
  A(r3(t + 0.07), "spud", "pitch", { to: -5, dur: 0.13 }); A(r3(t + 0.4), "spud", "pitch", { to: -tall, dur: 0.2 });
  A(r3(t + 0.07), "spud", "expr", { expr: "shocked", dur: 0.12 }); A(r3(t + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
};

// laughing: the face, a point, and the body rocking with it (pitch every ~0.17 s)
const laugh = (who, t0, t1, { amp = 5, side = "L", point = null } = {}) => {
  A(t0, who, "expr", { expr: "delighted", dur: 0.12 });
  if (point) { A(t0, who, "grip", { side, shape: "point", dur: 0.15 }); c.arm(t0, who, side, point, 0.4, "inOut"); }
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
for (const h0 of [0.35, 1.45]) { bar.carry(h0, BAR_HEAVE, 0.3, "out"); bar.carry(r3(h0 + 0.35), BAR_AT, 0.35, "in"); A(h0, "spud", "squash", { amount: 0.06, dur: 0.6 }); }
sfx(0.05, "kenney/impact-metal-light", { gain: 0.25 }); sfx(1.85, "kenney/impact-metal-light", { gain: 0.25 });
const PT_W = { o: [0.1, 0.62, 0.32] }, PT_C = { o: [0.1, 0.7, 0.3] };
laugh("wedge", 0, 2.3, { side: "L", point: PT_W, amp: 3 });
laugh("chip", 0, 2.3, { side: "R", point: PT_C, amp: 6 });
A(0, "wedge", "look", { to: [0.6, -0.1], dur: 0.01, blink: false });
A(0, "chip", "look", { to: [0.6, -0.2], dur: 0.01, blink: false });
see(0, 2.4, ["spud.face", "bar", "chip.face", "wedge.face", "board"], "he strains at the empty bar, they laugh, the board says x1");

// ---------------------------------------------------------------- 1 "It's empty!": x10, he lifts the bar overhead easily
const U1 = r3(T[1] + 0.15);
laugh("chip", T[1], END_OF(1), { side: "R", point: PT_C, amp: 6 });
tickUp(U1, 0); power(U1);
A(r3(U1 + 0.1), "spud", "look", { to: [0, 0.3], dur: 0.2 });
bar.carry(r3(U1 + 0.35), BAR_UP, 0.5, "inOut");
sfx(r3(U1 + 0.35), "kenney/impact-metal-light", { gain: 0.2 });
A(r3(U1 + 0.8), "spud", "expr", { expr: "delighted", dur: 0.2 });
A(r3(U1 + 0.8), "chip", "expr", { expr: "shocked", dur: 0.12 }); A(r3(U1 + 1.1), "chip", "expr", { expr: "delighted", dur: 0.2 });
see(U1, END_OF(1), ["board", "spud.face", "bar"], "x10, the empty bar goes up like nothing");

// ---------------------------------------------------------------- 2 "Trust me, it's fake!": x100, every plate, the bar bends, he presses it
const U2 = r3(T[2] + 0.15);
laugh("wedge", T[2], r3(T[2] + 1.0), { side: "L", point: PT_W, amp: 3 });
tickUp(U2, 1); power(U2);
bar.carry(r3(U2 + 0.4), BAR_AT, 0.45, "inOut");
A(r3(T[2] + 1.0), "wedge", "expr", { expr: "smug", dur: 0.2 });
const PL = r3(END_OF(2) - 1.2);
c.prop(PL, "bar", { plates: 3, bend: 0.55 }, 0.4, "linear");
for (let k = 0; k < 3; k++) sfx(r3(PL + k * 0.133), "kenney/impact-metal-heavy", { gain: 0.6 });
A(PL, "spud", "crouch", { to: 0.5, dur: 0.2 }); A(r3(PL + 0.4), "spud", "crouch", { to: 0, dur: 0.3 });
bar.carry(r3(PL + 0.45), BAR_UP, 0.5, "inOut");
A(r3(PL + 0.45), "spud", "expr", { expr: "cocky", dur: 0.2 });
A(r3(PL + 0.6), "wedge", "expr", { expr: "shocked", dur: 0.12 });
see(PL, r3(PL + 1.0), ["bar", "spud.face", "board"], "x100, three plates a side, the bar bends, up it goes");

// ---------------------------------------------------------------- 3 "He's gonna snap!": x1,000, he pumps it
const U3 = r3(T[3] + 0.15);
laugh("chip", T[3], END_OF(3), { side: "R", point: PT_C, amp: 6 });
laugh("wedge", r3(T[3] + 0.3), END_OF(3), { amp: 3 });
tickUp(U3, 2); power(U3);
for (const p of [0.5, 1.05]) { bar.carry(r3(U3 + p), [BAR_UP[0], 1.12, BAR_UP[2]], 0.25, "inOut"); bar.carry(r3(U3 + p + 0.27), BAR_UP, 0.25, "out"); }
see(U3, END_OF(3), ["board", "bar", "spud.face"], "x1,000, he pumps the bent bar like it's nothing");

// ---------------------------------------------------------------- 4 he sets the bar down (clank), "Watch this!" over his shoulder, walks out
// (PANELS-v3 panel 5, Jonny 18 Nov: the toss looked unnatural and pointless; Sol: set it down, the line, the turn, cut on the stride)
const SET = r3(END_OF(3) - 0.1), CLANK = r3(SET + 0.45);
bar.carry(SET, BAR_AT, 0.45, "inOut");
A(SET, "spud", "crouch", { to: 0.45, dur: 0.4 });
A(SET, "spud", "look", { to: [0, -0.2], dur: 0.2 });
sfx(CLANK, "kenney/impact-metal-heavy", { gain: 0.8 }); sfx(r3(CLANK + 0.12), "kenney/impact-metal-light", { gain: 0.3 });
c.at(CLANK, { fx: "shake", amount: 0.02, dur: 0.15 });
c.A(r3(CLANK + 0.05), "spud", "release", { prop: "bar", dur: 0 });
A(r3(CLANK + 0.05), "spud", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
c.arm(r3(CLANK + 0.1), "spud", "R", "rest", 0.35, "inOut"); c.arm(r3(CLANK + 0.1), "spud", "L", "rest", 0.35, "inOut");
A(r3(CLANK + 0.1), "spud", "crouch", { to: 0, dur: 0.3 });
A(r3(CLANK + 0.05), "chip", "expr", { expr: "shocked", dur: 0.12 }); A(r3(CLANK + 0.05), "wedge", "expr", { expr: "shocked", dur: 0.12 });
T[4] = r3(CLANK + 0.25); say(4);
A(T[4], "spud", "look", { to: [-0.7, 0.1], dur: 0.2 });
A(T[4], "spud", "turn", { to: 30, dur: 0.25 });
A(T[4], "spud", "expr", { expr: "cocky", dur: 0.15 });
const WALK = r3(END_OF(4) + 0.05);
A(r3(WALK - 0.2), "spud", "turn", { to: 90, dur: 0.25 });
A(WALK, "spud", "move", { to: [2.7, -0.8], dur: 1.1, ease: "in", stride: 0.45 });
for (const w of ["chip", "wedge"]) { A(r3(WALK + 0.1), w, "look", { to: [0.8, 0], dur: 0.25 }); }
A(r3(WALK + 0.2), "chip", "expr", { expr: "delighted", dur: 0.2 });
const END = F(WALK + 0.55);
see(SET, END, ["spud.face", "bar", "chip.face"], "he sets the bent bar down with a clank, Watch this!, and walks out");

act.blinksAt(c, "chip", [5.2]);
act.blinksAt(c, "wedge", [3.6, 8.8]);

// ---------------------------------------------------------------- cameras (DESIGN-STREET.md section 7)
const WIDE = { pos: [0.12, 1.42, 6.9], look: [0.12, 1.42, -1.0], fov: 36 };
const PUNCH = { pos: [0.76, 1.0, 3.2], look: [0.76, 0.95, -1.0], fov: 36 };
const OUTCAM = { pos: [1.1, 1.05, 3.9], look: [1.1, 0.85, -1.0], fov: 42 };
const P1 = F(U1 + 0.27), P3 = F(U3 + 0.27);
const beats = c.beats([
  ["empty bar", 0, WIDE, "hook"],
  ["x10 punch", P1, PUNCH],
  ["x10 wide", r3(P1 + 0.6), { ...WIDE }],
  ["fake", T[2], "keep"],
  ["snap", T[3], "keep", "escalation"],
  ["x1000 punch", P3, { ...PUNCH }],
  ["x1000 wide", r3(P3 + 0.6), { ...WIDE }],
  ["watch this", F(T[4] - 0.1), OUTCAM],
], END);

write(import.meta.url, {
  id: "laugh-gym",
  title: "What if every laugh made you stronger? (part 1, the gym)",
  idea: "There's a catch 10 v2: every laugh makes Spud 10x stronger; in the gym up to x1,000, then he sets the bar down, \"Watch this!\", and walks out.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "gym", seed: 6, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the film's score (assets/music/laugh-strength/laugh-film.ogg) from 0; the street part plays on from where this ends
  music: { file: process.env.MUSIC ?? "laugh-strength/laugh-film.ogg", gain: 0.45, lowCut: 120, lock: false, duck: { voice: -6 } },
  // dry voices: "office" is the shortest, dullest indoor room, at half its send
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor", room: "office", reverb: 0.06 },
  creative: { length: [10, 14] },
  hook: { show: ["spud", "bar", "chip", "wedge", "board"], hint: 0, what: "two friends laugh at a potato who can't lift an empty bar; a STRENGTH board says x1" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "bench", from: 0, to: END, checks: ["shell"], reason: "Chip stands on the bench pad (he rides it)" },
    { who: "spud", from: 2.8, to: END, checks: ["held-high"], reason: "the joke: he presses the bar over his head (above the face, never across it)" },
  ],
  notes: "Generated by storyboards/series/what-if/10-laugh-strength/make-laugh-gym.mjs.",
});
export const TIMES = { T, END };
