// KID VS DAD 05 "Carrots help you see in the dark" (Jonny 25 Nov 2026: hook H1 + ending E1 12:34 Berlin; 15-panel sheet OK 13:00).
//   node storyboards/series/kid-vs-dad/05-carrots/make-carrots.mjs -> carrots.json
// Outline: ./OUTLINE.md. Design: ./DESIGN.md (sections 8 floor plans, 9 light states and faces). Lines: ./lines.mjs.
// Chain (story spine + Jonny's hook pattern): POWER WORD Dad: "Carrots. Eat them, and you see in the dark." -> QUESTION
// the reporter in night vision: "In the dark. Is it true?" -> NAME + RULE "Tato, age seven, hates carrots ... one rule" ->
// STAKE the cookie jar, top shelf, only in the dark -> ESCALATION three nights, more carrots, more orange, further down
// the hall (one stick: bonk into the door / a bowl: past the door, the toy block / the whole bag: glowing eyes, spy roll)
// -> TEASES crunching from the kitchen at night, crumbs in Dad's moustache ("...Carrot crumbs."), the jar lighter every
// night -> ENDING in the dark kitchen a second pair of eyes glows next to the jar; the fridge light: Dad in night-vision
// goggles, his hand in the jar. "...Dad?" / "...Carrots." CUT.
// Counter (natural): Tato's skin, golden -> slightly orange (07) -> bright orange (09 on), and the carrots: stick, bowl, bag.
// Places: K = the kitchen at the world origin; H = the hall + Tato's room 200 m along x (prop kidhall).
// Sheet slips corrected (brief): 01 Dad points at his OWN eyes; 05 Tato WALKS into the door; 14 Dad's hand is IN the jar.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);

// measured spoken lengths (node qa/lines.mjs kvd05-voice-probe.json), in LINES order ("Eat up." take 2: estimate)
const DUR = [3.72, 2.42, 3.48, 6.12, 3.70, 1.88, 1.24, 1.00, 0.91, 2.14, 0.93, 2.38, 2.12, 0.80, 2.73, 0.70, 0.54, 0.85];
const T = [];                                     // filled as the film is written (say(i, at))
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places
const HX = 200;
const H = (x, z) => [r3(HX + x), r3(z)];
const TATO_TABLE = [0.55, -0.20], DAD_TABLE = [-0.55, -0.42];
const TATO_JAR = [-3.95, -0.30];                  // panel 03: looking up at the jar
const TATO_CLIMB = [-4.63, -0.50];                // the camera-side end of the shelf unit (DESIGN 5)
const DAD_STOOL = [-3.94, -1.15];
const REP_AT = H(2.75, 0.75), REP_YAW = -35;
const BED = H(-4.60, -0.95);                     // the far corner of his room: the walk to the door (z 0.10) passes clear of it
const DOOR_WALK = [H(-3.50, 0.10), H(-2.36, 0.10)];
const BLOCK_AT = H(0.20, 0.25);
const ROLL = [H(-1.40, 0.15), H(1.20, 0.10)];

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: TATO_TABLE, face: -25, expr: "kind", follow: 0.25, seed: 4.1 },
  { id: "dad", character: "potatobrawl/dad", at: DAD_TABLE, face: 20, expr: "stern", follow: 0.25, seed: 2.9 },
  { id: "rep", character: "potatobrawl/reporter", at: REP_AT, face: REP_YAW, follow: 0.3, seed: 131.3 },
];
const FACES = {
  reporting: { tilt: -0.08, browY: -0.02, curve: -0.05, smirk: 0, eye: 0.8, pupil: 1, open: 0, raise: 0 },
  amazed: { eye: 1.2, pupil: 0.7, tilt: 0.3, open: 0.6 },
  disgusted: { eye: 0.55, tilt: -0.2, browY: -0.02, curve: -0.7, open: 0.35, smirk: 0.2 },
  scrunched: { eye: 0.06, tilt: -0.45, browY: -0.04, curve: -0.6 },
  listening: { eye: 1.2, pupil: 0.8, tilt: 0.2, curve: -0.1 },
  suspicious: { eye: 0.7, tilt: -0.15, raise: 0.03, curve: -0.05 },
  frozen: { eye: 1.3, pupil: 0.6, tilt: 0.35, browY: 0.05 },
  bag: { eye: 0.3, tilt: -0.35, browY: -0.03, curve: -0.3 },
  flat: { eye: 0.6, tilt: -0.05, browY: -0.02, curve: -0.05 },
  law: { eye: 0.9, tilt: -0.3, browY: -0.01 },
  innocent: { eye: 0.1, tilt: 0.2, browY: 0.02, curve: 0.5 },
  lie: { eye: 1.05, tilt: 0.12, curve: 0.2 },
  caught: { eye: 1.25, pupil: 0.6, tilt: 0.4, browY: 0.05, curve: -0.2, open: 0 },
  guilty: { eye: 1.1, pupil: 0.75, tilt: 0.35, browY: 0.03, curve: -0.15 },
};

// a point near a body: [right, up, forward] in its own frame (yaw 0 faces +z)
const rel = (p, yaw, [dx, y, dz]) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + dx * Math.cos(a) + dz * Math.sin(a)), r3(y), r3(p[1] - dx * Math.sin(a) + dz * Math.cos(a))]; };
const butt = (f) => [f[0], r3(f[1] - 0.056), f[2]];
const MICPOSE = { cover: [-0.45, 0.62, 0.1], talk: [-0.5, 0.42, 0.3] };

// ---------------------------------------------------------------- props
const TOP = 0.30;
const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", butt(rel(REP_AT, REP_YAW, MICPOSE.talk)), REP_YAW) };
const STICK = { id: "stick", kind: "carrotstick", up: true, ...grips.placeFor("carrotstick", [0.40, 0.37, 0.045], 0), tip: 0, tilt: -80 };
const BAG = { id: "bag", kind: "carrotbag", ...grips.placeFor("carrotbag", [0.55, 0.03, 0.17], 180), tip: 25 };   // starts in his hands, under his chin (a carry on the cut popped)
const MUG = { id: "mug", kind: "teamug", ...grips.placeFor("teamug", [-0.30, TOP, 0.20], 200), steam: 0.6 };
const props = [
  // K: the kitchen
  { id: "kitchen", kind: "kitchenroom", x: 0, y: 0, z: 0, fridge: false, lamp: 1, time: 2.75 },
  { id: "fridge", kind: "openfridge", x: -3.0, y: 0, z: -1.90, rot: 0, open: 0, lit: 0 },
  { id: "unit", kind: "pantryshelf", x: -4.66, y: 0, z: -1.30, rot: 90, wall: 3.6 },
  { id: "jar", kind: "cookiejar", x: -4.66, y: 0.95, z: -1.42, fill: 1, lid: 1 },
  { id: "stool", kind: "jarstool", x: DAD_STOOL[0], y: 0, z: DAD_STOOL[1], rot: 0 },
  { id: "table", kind: "kitchentable", x: 0, y: 0, z: 0.35, w: 1.3, d: 0.6, h: TOP },
  { id: "plate", kind: "plate", x: -0.05, y: TOP, z: 0.28 },
  { id: "pile", kind: "carrotpile", x: -0.05, y: r3(TOP + 0.019), z: 0.28, n: 14 },
  { id: "bowl", kind: "carrotbowl", x: 0.30, y: TOP, z: 0.28, fill: 1 },
  STICK, BAG, MUG,
  { id: "crumbs", kind: "crumbs", wear: "dad", x: 0, y: 0.63, z: 0.39 },
  { id: "gog", kind: "nvgoggles", wear: "dad", x: 0, y: 0.842, z: 0.355, up: 0, lit: 1 },
  { id: "shine", kind: "eyeshine", wear: "spud", x: 0, y: 0.445, z: 0.228, gap: 0.15, ew: 0.05, eh: 0.066, core: "#fff3c4", body: "#ffb02e", halo: "#ff7a1a", k: 0.8 },
  { id: "cookie", kind: "chunkcookie", r: 0.06, cut: 1, x: -3.9, y: -3, z: -1.0 },
  { id: "moonK", kind: "moonlamp", x: -2.5, y: 2.3, z: -0.5, range: 8 },
  { id: "day", kind: "daywindow", x: 0, y: 0, z: 0 },
  // H: the hall and Tato's room
  { id: "hall", kind: "kidhall", x: HX, y: 0, z: 0, rot: 0, open: 0, strip: 0 },
  { id: "toys", kind: "floortoys", x: HX, y: 0, z: 0 },
  { id: "block", kind: "toyblock", x: BLOCK_AT[0], y: 0, z: BLOCK_AT[1] },
  { id: "bed", kind: "bed", x: BED[0], y: 0, z: BED[1], cover: 0.55, drape: true, fold: "#efe6d2", blanket: "#4a67b5", dots: "#6f8ad0" },
  { id: "moonH", kind: "moonlamp", x: r3(HX + 0.9), y: 1.8, z: 0.2, range: 8 },
  MIC,
];

// ---------------------------------------------------------------- helpers
const SUB = 300;
const CAPTEXT = {
  0: "*Carrots.* Eat them, and you *see in the dark.*", 1: "In the dark. *Is it true?*", 2: "We're live. *Tato,* age seven, *hates carrots.*",
  3: "One rule: eat your carrots, and you *see in the dark.*", 4: "The target: *the cookie jar.* Top shelf.", 5: "Night one. *One carrot.*",
  6: "Not *enough* carrots.", 7: "...Who is *crunching?*", 9: "Dad, you have *crumbs.*", 10: "...*Carrot* crumbs.",
  11: "Night two. *Halfway there.*", 12: "Night three. *The whole bag.*", 13: "He can *see!*", 14: "And the cookie jar... is *lighter* every night.",
  15: "*Contact.*", 16: "...Dad?", 17: "...*Carrots.*",
};
const CAPY = { 0: 440 };   // under the 0 s label
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], r3(END_OF(i) + 0.25), CAPTEXT[i] ?? line, CAPY[i] ?? SUB, false, { size: 62 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const place = (t, who, at, yaw, y) => { const a = onCut(t); A(a, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(a, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const P = (t, id, set, dur = 0, ease) => c.prop(r3(t), id, set, dur, ease);
const shots = [], grade = [], fx = [];
const shot = (name, t, cam, mark) => shots.push(mark ? [name, r3(t), cam, mark] : [name, r3(t), cam]);
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur: r3(dur), ease: "inOut" });
const WHITE = "#ffffff";
const LOOKS = {
  evening: { s: 1.12, w: 0.5, c: 1, lift: 0.03, tint: WHITE },
  nv: { nv: true },
  night: { s: 0.8, w: -0.6, c: 1.05, lift: -0.08, tint: "#c8d4ff" },
  morning: { s: 1.15, w: 0.8, c: 1, lift: 0.07, tint: WHITE },
  darkK: { s: 0.75, w: -0.6, c: 1.05, lift: -0.12, tint: "#b8c6ff" },
  fridge: { s: 1.0, w: -0.2, c: 1.05, lift: 0.0, tint: "#e6f0ff" },
};
const state = (t, name, lights, lamp) => { grade.push([onCut(t), LOOKS[name]]); fx.push({ do: "lights", at: onCut(t), to: lights, lamp, dur: 0.01 }); };

// ---------------------------------------------------------------- frame 0
A(0, "rep", "crouch", { to: 0.14, dur: 0.01 }); expr(0, "rep", FACES.reporting, 0.01);
const gm = grips.mug(c, "rep", MIC, { side: "R" }); gm.take(0, { reach: 0.01, settle: 0.01 });
for (const [id, set] of [["stick", { eaten: 0, y: -9 }], ["bag", { crush: 0, fill: 1, y: -9 }], ["bowl", { scale: 0.001 }], ["mug", { y: -9 }],
  ["crumbs", { on: 0 }], ["gog", { scale: 0.001, up: 0, lit: 1 }], ["shine", { on: 0, pulse: 0 }], ["moonK", { on: 0 }], ["moonH", { on: 0 }],
  ["day", { on: 0 }], ["hall", { open: 0, strip: 0 }], ["fridge", { open: 0, lit: 0 }], ["jar", { fill: 1, lid: 1 }]]) P(0, id, set, 0);
A(0, "spud", "skin", { color: "#f39a45", to: 0, dur: 0.01 });

// ---------------------------------------------------------------- 01 HOOK: Dad slides the plate, points at his own eyes
state(0, "evening", 1, 1);
expr(0, "dad", FACES.law, 0.01); look(0, "dad", [0.6, -0.1], 0.01); expr(0, "spud", "kind", 0.01); look(0, "spud", [-0.3, -0.25], 0.01);
arm(0, "dad", "R", { prop: "plate", grip: [-0.12, 0.02, 0], palm: [-0.12, -0.4, 0] }, 0.01); grip(0, "dad", "R", "flat", 0.01);
P(0.2, "plate", { x: 0.25 }, 0.6, "out"); P(0.2, "pile", { x: 0.25 }, 0.6, "out"); sfx(0.2, "ai/bowl-scrape", { gain: 0.3 });
arm(0.35, "dad", "R", { prop: "plate", grip: [-0.12, 0.02, 0], palm: [-0.12, -0.4, 0] }, 0.45);
arm(0.95, "dad", "R", "rest", 0.35);
arm(0.9, "dad", "L", { o: [-0.20, 0.64, 0.50] }, 0.35); grip(0.95, "dad", "L", "point", 0.15);   // two fingers at his own eyes (the brief's fix)
say(0, 0.15);
look(1.0, "dad", [0.15, 0.05], 0.15);
arm(2.25, "dad", "L", { o: [0.10, 0.45, 0.50] }, 0.3);   // "...you see": now at Tato
expr(0.6, "spud", FACES.disgusted, 0.25); A(0.6, "spud", "lean", { to: -12, dur: 0.35 });
arm(0.65, "spud", "L", { o: [0.10, 0.40, 0.30] }, 0.3); arm(0.65, "spud", "R", { o: [0.10, 0.40, 0.30] }, 0.3); grip(0.7, "spud", "L", "flat"); grip(0.7, "spud", "R", "flat");
see(0, END_OF(0), ["dad.face", "spud.face", "plate"], "Dad slides a plate of carrots to his son and points at his own eyes: 'Carrots. Eat them, and you see in the dark.'");
const DADTWO = { pos: [0.30, 0.80, 3.20], look: [0.10, 0.50, -0.20], fov: 40 };
shot("carrots", 0, push(DADTWO, 0.06, 4.1), "hook");

// ---------------------------------------------------------------- 02 NV: the reporter in the dark hall
const T02 = 4.05;
state(T02, "nv", 0.15, 0); P(onCut(T02), "moonH", { on: 1 }, 0);
sfx(T02, "radio", { gain: 0.2 });
say(1, r3(T02 + 0.15));
const REPC = { pos: [r3(HX + 1.20), 0.70, 3.20], look: [r3(HX + 2.60), 0.45, 0.60], fov: 40 };
shot("in the dark", T02, push(REPC, 0.07, 2.9));

// ---------------------------------------------------------------- NAME + RULE: Tato stares at the carrots
const T03a = r3(END_OF(1) + 0.3);
state(T03a, "evening", 1, 1); P(onCut(T03a), "moonH", { on: 0 }, 0);
arm(onCut(T03a), "spud", "L", "rest", 0.01); arm(onCut(T03a), "spud", "R", "rest", 0.01); A(onCut(T03a), "spud", "lean", { to: 0, dur: 0.01 });
arm(onCut(T03a), "dad", "L", "rest", 0.01); arm(onCut(T03a), "dad", "R", "rest", 0.01);
expr(T03a, "spud", { eye: 0.8, tilt: -0.2, curve: -0.4 }, 0.01); look(T03a, "spud", [-0.4, -0.5], 0.01);
say(2, r3(T03a + 0.15));
const KIDCLOSE = { pos: [0.55, 0.50, 1.40], look: [0.55, 0.44, -0.20], fov: 30 };
shot("tato age seven", T03a, push(KIDCLOSE, 0.06, DUR[2] + 0.4));
// panel 03: he looks up at the jar on the top shelf
const T03 = r3(END_OF(2) + 0.25);
place(T03, "spud", TATO_JAR, 60); place(T03, "dad", [-1.4, -1.4], 0);
A(onCut(T03), "dad", "hide");
expr(T03, "spud", { eye: 1.15, pupil: 0.85, tilt: 0.25, curve: -0.1, open: 0.2 }, 0.01); look(T03, "spud", [-0.5, 0.8], 0.01);
say(3, r3(T03 + 0.15));
const JARLOW = { pos: [-2.90, 0.35, 1.20], look: [-4.45, 0.80, -1.10], fov: 42 };
shot("one rule", T03, push(JARLOW, 0.08, DUR[3] + 0.4));
const T03b = r3(END_OF(3) + 0.2);
say(4, r3(T03b + 0.1));
const JARC = { pos: [-4.15, 1.25, 0.10], look: [-4.62, 1.12, -1.40], fov: 30 };
shot("the target", T03b, push(JARC, 0.12, DUR[4] + 0.5));

// ---------------------------------------------------------------- NIGHT 1: one carrot, the door, the crunching
const T04 = r3(END_OF(4) + 0.3);
place(T04, "spud", TATO_TABLE, -25);
P(onCut(T04), "pile", { n: 13 }, 0); P(onCut(T04), "stick", { y: 0.37 }, 0);
const hs = grips.thin(c, "spud", STICK, { side: "R", from: 0.28 });
hs.take(onCut(T04), { reach: 0.01, settle: 0.01 });
expr(T04, "spud", FACES.disgusted, 0.01); look(T04, "spud", [0, 0], 0.01);
say(5, r3(T04 + 0.15));
expr(r3(T04 + 1.2), "spud", FACES.scrunched, 0.2);
P(r3(T04 + 1.6), "stick", { eaten: 0.5 }, 0.05); sfx(r3(T04 + 1.6), "ai/crunch", { gain: 0.4 });
A(r3(T04 + 1.6), "spud", "squash", { amount: 0.05, dur: 0.1 }); A(r3(T04 + 1.75), "spud", "squash", { amount: 0, dur: 0.2 });
sfx(r3(T04 + 2.0), "ai/crunch", { gain: 0.3 });
shot("one carrot", T04, push(KIDCLOSE, 0.08, 2.6));
// 05: night, he tiptoes with his arms out and walks face first into his own door
const T05 = r3(T04 + 2.55);
P(onCut(T05), "stick", { eaten: 1 }, 0); hs.release(r3(T04 + 2.0), { to: [0.20, r3(TOP + 0.03), 0.25] }); expr(r3(T04 + 2.0), "spud", FACES.disgusted, 0.2);   // he puts the half stick down on the plate
state(T05, "night", 0.15, 0); P(onCut(T05), "moonH", { on: 1 }, 0);
place(T05, "spud", DOOR_WALK[0], 90);
expr(T05, "spud", { eye: 0.4, tilt: 0.1, curve: 0 }, 0.01); look(T05, "spud", [0, 0], 0.01);
arm(onCut(T05), "spud", "L", { o: [0.22, 0.22, 0.30] }, 0.01); arm(onCut(T05), "spud", "R", { o: [0.22, 0.22, 0.30] }, 0.01);
grip(onCut(T05), "spud", "L", "open", 0.01); grip(onCut(T05), "spud", "R", "open", 0.01);
const WALK = 2.6;
A(r3(T05 + 0.1), "spud", "move", { to: DOOR_WALK[1], steps: 5, stride: 0.24, dur: WALK, ease: "linear" });
for (let k = 0; k < 5; k++) sfx(r3(T05 + 0.35 + k * 0.52), "ai/step-wood", { gain: 0.15 });
const TBONK = r3(T05 + 0.1 + WALK);
sfx(TBONK, "thud", { gain: 0.6 }); sfx(TBONK, "hit-wood", { gain: 0.4 });
A(TBONK, "spud", "squash", { amount: 0.12, dur: 0.06 }); A(r3(TBONK + 0.1), "spud", "squash", { amount: 0, dur: 0.25 });
A(TBONK, "spud", "lean", { to: -8, dur: 0.15 }); expr(TBONK, "spud", { eye: 0.05, tilt: -0.3, curve: -0.5 }, 0.08);
const ROOMC = { pos: [r3(HX - 3.00), 0.60, 2.60], look: [r3(HX - 2.80), 0.40, 0.10], fov: 40 };
shot("tiptoe", T05, push(ROOMC, 0.08, WALK + 0.3));
const DOORC = { pos: [r3(HX - 2.50), 0.55, 1.90], look: [r3(HX - 2.15), 0.45, 0.10], fov: 38 };
shot("bonk", r3(TBONK - 0.25), push(DOORC, 0.04, 1.8));
say(6, r3(TBONK + 0.5));
// 06: in bed, a strip of light under the door, crunching
const T06 = r3(END_OF(6) + 0.35);
A(onCut(T06), "spud", "lean", { to: 0, dur: 0.01 }); arm(onCut(T06), "spud", "L", "rest", 0.01); arm(onCut(T06), "spud", "R", "rest", 0.01);
place(T06, "spud", BED, 0); A(onCut(T06), "spud", "sit", { seat: "bed", dur: 0, hands: "keep" });
P(onCut(T06), "hall", { strip: 1 }, 0);
expr(T06, "spud", FACES.listening, 0.01); look(T06, "spud", [0.8, -0.1], 0.01); A(T06, "spud", "noblink", { dur: 2.5 });
for (const d of [0.3, 0.75, 1.2]) sfx(r3(T06 + d), "ai/crunch", { gain: 0.15 });
say(7, r3(T06 + 1.45));
const STRIPC = { pos: [r3(HX - 2.75), 0.28, 1.10], look: [r3(HX - 2.00), 0.08, 0.10], fov: 40 };   // panel 06 in two shots: the strip under his door, then him awake in bed
const BEDC = { pos: [r3(HX - 4.60), 0.90, 1.40], look: [r3(HX - 4.60), 0.62, -0.95], fov: 40 };
shot("who is crunching", T06, push(BEDC, 0.1, END_OF(7) - T06 + 0.4));   // the strip shot is out of draft 1 (the strip did not show in the still)

// ---------------------------------------------------------------- NIGHT 2: the bowl at breakfast, crumbs, the toy block
const T07 = r3(END_OF(7) + 0.45);
A(onCut(T07), "spud", "stand", { dur: 0.01 }); P(onCut(T07), "hall", { strip: 0, open: 1 }, 0);
state(T07, "morning", 1, 0); P(onCut(T07), "moonH", { on: 0 }, 0); P(onCut(T07), "day", { on: 1 }, 0);
place(T07, "spud", TATO_TABLE, -25); A(onCut(T07), "dad", "show"); place(T07, "dad", DAD_TABLE, 20);
A(onCut(T07), "spud", "skin", { color: "#f39a45", to: 1, dur: 0.01 });
P(onCut(T07), "plate", { y: -9 }, 0); P(onCut(T07), "pile", { y: -9 }, 0); P(onCut(T07), "bowl", { scale: 1, fill: 1 }, 0);
P(onCut(T07), "crumbs", { on: 1 }, 0);
P(onCut(T07), "mug", { y: TOP }, 0);
const hm = grips.mug(c, "dad", MUG, { side: "L" }); hm.take(onCut(T07), { reach: 0.01, settle: 0.01 });
expr(T07, "dad", FACES.innocent, 0.01); look(T07, "dad", [0.3, 0.1], 0.01);
expr(T07, "spud", { eye: 0.7, tilt: -0.2, curve: -0.3 }, 0.01); look(T07, "spud", [-0.3, -0.5], 0.01);
sfx(r3(T07 + 0.2), "ai/sip", { gain: 0.3 });
say(8, r3(T07 + 0.5));
const MORNC = { pos: [0.15, 0.80, 3.30], look: [0.05, 0.50, -0.30], fov: 40 };
shot("eat up", T07, push(MORNC, 0.06, END_OF(8) - T07 + 0.3));
const T07b = r3(END_OF(8) + 0.3);
expr(T07b, "spud", FACES.suspicious, 0.1); look(T07b, "spud", [-0.5, 0.2], 0.1);
say(9, r3(T07b + 0.1));
expr(r3(T07b + 0.5), "dad", { eye: 1.0, tilt: 0.1, curve: 0.3 }, 0.15); look(r3(T07b + 0.5), "dad", [0.6, -0.1], 0.15);
const CRUMBC = { pos: [-0.45, 0.85, 1.60], look: [-0.55, 0.80, -0.42], fov: 30 };
shot("crumbs", T07b, push(CRUMBC, 0.08, END_OF(9) - T07b + 0.3));
const T07c = r3(END_OF(9) + 0.3);
expr(r3(T07c - 0.1), "dad", FACES.lie, 0.1); look(r3(T07c - 0.1), "dad", [-0.5, 0.1], 0.1);
say(10, T07c);
P(r3(END_OF(10) + 0.2), "bowl", { fill: 0.6 }, 0.01);
const T08 = r3(END_OF(10) + 0.5);
// 08: night hall: past the door, onto the toy block, frozen on one leg
hm.release(r3(T08 - 0.45), { to: [-0.30, TOP, 0.20] });   // the mug back on the table
A(onCut(T08), "dad", "hide"); P(onCut(T08), "bowl", { scale: 0.001 }, 0); P(onCut(T08), "day", { on: 0 }, 0); P(onCut(T08), "crumbs", { on: 0 }, 0);
state(T08, "night", 0.15, 0); P(onCut(T08), "moonH", { on: 1 }, 0);
place(T08, "spud", H(-1.2, 0.25), 90);
expr(T08, "spud", { eye: 0.6, tilt: 0.1, curve: 0 }, 0.01); look(T08, "spud", [0.3, -0.2], 0.01);
A(r3(T08 + 0.1), "spud", "move", { to: H(0.05, 0.25), steps: 4, stride: 0.3, dur: 1.6, ease: "linear" });
for (let k = 0; k < 4; k++) sfx(r3(T08 + 0.3 + k * 0.4), "ai/step-wood", { gain: 0.15 });
const TBLK = r3(T08 + 1.75);
sfx(TBLK, "hit-wood", { gain: 0.35 }); P(TBLK, "block", { tip: 10, y: 0.008 }, 0.05);
expr(TBLK, "spud", FACES.frozen, 0.06); A(TBLK, "spud", "noblink", { dur: 3 }); A(TBLK, "spud", "squash", { amount: 0.06, dur: 0.06 });
arm(r3(TBLK + 0.05), "spud", "L", { o: [-0.06, 0.30, 0.26] }, 0.15); arm(r3(TBLK + 0.05), "spud", "R", { o: [-0.06, 0.30, 0.26] }, 0.15);
grip(r3(TBLK + 0.05), "spud", "L", "flat", 0.1); grip(r3(TBLK + 0.05), "spud", "R", "flat", 0.1);
say(11, r3(TBLK + 0.55));
const BLOCKC = { pos: [r3(HX + 1.30), 0.60, 2.30], look: [r3(HX - 0.10), 0.40, 0.25], fov: 42 };   // from ahead of him: his face as he freezes
shot("halfway there", T08, push(BLOCKC, 0.1, END_OF(11) - T08 + 0.3));

// ---------------------------------------------------------------- NIGHT 3: the whole bag, orange, glowing eyes, the spy roll
const T09 = r3(END_OF(11) + 0.4);
A(onCut(T09), "spud", "squash", { amount: 0, dur: 0.01 }); arm(onCut(T09), "spud", "L", "rest", 0.01); arm(onCut(T09), "spud", "R", "rest", 0.01);
state(T09, "evening", 1, 1); P(onCut(T09), "moonH", { on: 0 }, 0);
place(T09, "spud", TATO_TABLE, -25);
P(onCut(T09), "table", { y: -9 }, 0); P(onCut(T09), "bag", { y: BAG.y }, 0);
const hb = grips.box(c, "spud", BAG, { gap: 0.03, height: 0.4 });
hb.take(onCut(T09), { reach: 0.01, settle: 0.01 });
expr(T09, "spud", FACES.bag, 0.01);
say(12, r3(T09 + 0.2));
for (const d of [0.4, 0.8, 1.2, 1.6, 2.0]) sfx(r3(T09 + d), "ai/crunch", { gain: 0.3 });
sfx(r3(T09 + 0.3), "crinkle", { gain: 0.3 });
P(r3(T09 + 0.5), "bag", { fill: 0, crush: 1 }, 1.6);
A(r3(T09 + 1.0), "spud", "skin", { color: "#f07a1c", to: 1, dur: 0.8 });
P(r3(T09 + 2.0), "shine", { on: 0.5 }, 0.4);
const BAGC = { pos: [0.55, 0.50, 1.40], look: [0.55, 0.44, -0.20], fov: 30 };
shot("the whole bag", T09, push(BAGC, 0.1, 2.75));
// 10: the spy roll down the hall
const T10 = r3(T09 + 2.7);
hb.release(r3(T10 - 0.45), { to: [0.55, 0, 0.30] });   // he drops the empty bag P(onCut(T10), "table", { y: 0 }, 0);
state(T10, "night", 0.15, 0); P(onCut(T10), "moonH", { on: 1 }, 0); P(onCut(T10), "shine", { on: 0.7 }, 0);
P(onCut(T10), "block", { tip: 0, y: 0 }, 0);
place(T10, "spud", ROLL[0], 90);
arm(onCut(T10), "spud", "L", "rest", 0.01); arm(onCut(T10), "spud", "R", "rest", 0.01); grip(onCut(T10), "spud", "L", "relaxed", 0.01); grip(onCut(T10), "spud", "R", "relaxed", 0.01);
expr(T10, "spud", "focused", 0.01); expr(T10, "spud", { eye: 0.75 }, 0.01); look(T10, "spud", [0, 0], 0.01);
A(r3(T10 + 0.1), "spud", "crouch", { to: 0.14, dur: 0.2 });
A(r3(T10 + 0.3), "spud", "move", { to: ROLL[1], steps: 0, dur: 1.5, ease: "inOut" });
A(r3(T10 + 0.3), "spud", "pitch", { to: 720, dur: 1.5, ease: "inOut" });
sfx(r3(T10 + 0.5), "whoosh", { gain: 0.2 });
A(r3(T10 + 1.85), "spud", "pitch", { to: 0, dur: 0.01 });
const ROLLC = { pos: [r3(HX - 0.80), 0.45, 2.20], look: [r3(HX - 1.00), 0.30, 0.10], fov: 50 };   // pans with the roll
shot("spy roll", T10, { ...ROLLC, to: { pos: ROLLC.pos, look: [r3(HX + 0.90), 0.30, 0.10], fov: 50 }, dur: 1.9, ease: "inOut" }, "escalation");
// 11: NV, the reporter amazed
const T11 = r3(T10 + 2.25);
state(T11, "nv", 0.15, 0); sfx(T11, "radio", { gain: 0.2 });
expr(T11, "rep", FACES.amazed, 0.01); A(onCut(T11), "rep", "lean", { to: 10, dur: 0.01 });
say(13, r3(T11 + 0.15));
shot("he can see", T11, push({ ...REPC, fov: 32 }, 0.05, END_OF(13) - T11 + 0.35));

// ---------------------------------------------------------------- THE KITCHEN: the climb, a second pair of eyes
const T12 = r3(END_OF(13) + 0.35);
state(T12, "darkK", 0.12, 0.12); P(onCut(T12), "moonH", { on: 0 }, 0); P(onCut(T12), "moonK", { on: 0.8 }, 0);
A(onCut(T12), "spud", "crouch", { to: 0, dur: 0.01 }); A(onCut(T12), "rep", "lean", { to: 0, dur: 0.01 }); expr(T12, "rep", FACES.reporting, 0.01);
place(T12, "spud", TATO_CLIMB, 180);
P(onCut(T12), "jar", { fill: 0.45 }, 0);
arm(r3(T12 + 0.02), "spud", "L", "up", 0.25); arm(r3(T12 + 0.02), "spud", "R", "hold", 0.25);
A(r3(T12 + 0.3), "spud", "climb", { to: { y: 0.65 }, steps: 3, dur: 2.4 });
for (const d of [0.6, 1.4, 2.2]) sfx(r3(T12 + d), "hit-wood", { gain: 0.12 });
say(14, r3(T12 + 0.4));
const CLIMBC = { pos: [-2.50, 0.90, 2.30], look: [-4.35, 0.75, -0.95], fov: 40 };
shot("lighter every night", T12, push(CLIMBC, 0.1, END_OF(14) - T12 + 0.4));
// 13: the reach; in the black beside the jar two green lenses light up
const T13 = r3(END_OF(14) + 0.35);
P(onCut(T13), "jar", { lid: 0 }, 0);
A(onCut(T13), "dad", "show"); place(T13, "dad", DAD_STOOL, 0, 0.24);
P(onCut(T13), "gog", { scale: 1, lit: 0 }, 0);
expr(T13, "dad", FACES.caught, 0.01);
arm(onCut(T13), "dad", "R", { prop: "jar", grip: [0, 0.15, 0] }, 0.01); grip(onCut(T13), "dad", "R", "hold", 0.01);
arm(r3(T13 + 0.1), "spud", "R", { prop: "jar", grip: [0.12, 0.30, 0.20] }, 0.9); grip(r3(T13 + 0.1), "spud", "R", "open", 0.3);
P(r3(T13 + 0.15), "moonK", { on: 0.35 }, 0.3);
sfx(r3(T13 + 0.3), "ai/crunch", { gain: 0.3 });
P(r3(T13 + 1.0), "gog", { lit: 1 }, 0.15); sfx(r3(T13 + 1.0), "lampbuzz", { gain: 0.15 });
say(15, r3(T13 + 1.45));
const REACHC = { pos: [-4.25, 1.45, 0.05], look: [-4.50, 1.12, -1.40], fov: 44 };
shot("reach", T13, push(REACHC, 0.06, 0.95));
const LENSC = { pos: [-4.05, 1.18, 1.35], look: [-4.25, 1.08, -1.25], fov: 38 };   // the two green lenses light up in the black next to the jar
shot("contact", r3(T13 + 0.95), push(LENSC, 0.08, END_OF(15) - T13 - 0.55), "reveal");

// ---------------------------------------------------------------- END: the fridge light, Dad in goggles, hand in the jar
const T14 = r3(END_OF(15) + 0.35);
state(T14, "fridge", 0.12, 0.12); P(onCut(T14), "moonK", { on: 0 }, 0); P(onCut(T14), "shine", { on: 0 }, 0);
P(T14, "fridge", { open: 1 }, 0.35, "out"); P(r3(T14 + 0.05), "fridge", { lit: 1 }, 0.05, "linear"); sfx(T14, "door-open", { gain: 0.4 });
arm(onCut(T14), "spud", "R", { o: [0.05, 0.40, 0.25] }, 0.01); arm(onCut(T14), "spud", "L", { o: [0.05, 0.40, 0.25] }, 0.01);
expr(T14, "spud", FACES.flat, 0.01); look(T14, "spud", [0.7, 0], 0.01);
say(16, r3(T14 + 1.1));
const FRIDGEC = { pos: [-2.60, 1.20, 2.20], look: [-4.30, 0.95, -1.20], fov: 42 };
shot("dad?", T14, push(FRIDGEC, 0.05, END_OF(16) - T14 + 0.35));
// 15: goggles up, a bitten cookie in his left hand, crumbs; "...Carrots." CUT
const T15 = r3(END_OF(16) + 0.35);
P(onCut(T15), "gog", { up: 1, lit: 0.6 }, 0); P(onCut(T15), "crumbs", { on: 1 }, 0);
A(onCut(T15), "dad", "squash", { amount: 0, dur: 0.01 });
arm(onCut(T15), "dad", "R", "rest", 0.01);
place(T15, "spud", TATO_CLIMB, 90, 0.65);
expr(T15, "dad", FACES.guilty, 0.01); look(T15, "dad", [-0.7, 0.05], 0.01); A(T15, "dad", "noblink", { dur: 2 });
A(r3(T15 + 0.3), "dad", "squash", { amount: 0.03, dur: 0.12 }); A(r3(T15 + 0.45), "dad", "squash", { amount: 0, dur: 0.15 });
expr(T15, "spud", FACES.flat, 0.01); look(T15, "spud", [0.5, 0.1], 0.01); A(T15, "spud", "noblink", { dur: 2 });
say(17, r3(T15 + 0.6));
const END = F(END_OF(17) + 0.45);
const ENDC = { pos: [-3.50, 1.40, 1.90], look: [-4.30, 1.08, -0.90], fov: 36 };
shot("carrots", T15, push(ENDC, 0.05, END - T15), "payoff");
see(T14, END, ["dad.face", "spud.face", "gog"], "the fridge light shows Dad in night-vision goggles with his hand in the cookie jar; he says: '...Carrots.'");

// the label at 0 s (8-line rule, lines 2 + 8: plain English)
cap(0, 3.2, "When your dad says carrots help you see in the dark", 230, false, { size: 58, kinetic: false });

const beats = c.beats(shots, END);
write(import.meta.url, {
  id: "carrots",
  title: "When your dad says carrots help you see in the dark",
  idea: "Kid vs Dad 05: Dad says carrots help you see in the dark; a war reporter covers Tato's three-night mission to the cookie jar (one stick, a bowl, the whole bag, more orange each time, glowing eyes on night 3); in the dark kitchen a second pair of eyes glows: Dad in night-vision goggles, hand in the jar. '...Carrots.'",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1230], captionStyle: "kinetic",
  captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions sit in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", night: true, floor: "none", light: "dusk", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, fx,
  hud: { news: { label: "NIGHT MISSION", tag: "LIVE", tagW: 150, count: false, show: [r3(T[1] - 0.25), END] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood" },
  creative: { length: [55, 95] },
  hook: { show: ["dad", "spud"], hint: 0, what: "Dad slides a plate of carrots to his son and points at his own eyes: 'Carrots. Eat them, and you see in the dark.'" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "bed", from: onCut(T06), to: T07, reason: "sitting up in bed under the blanket" },
    { who: "dad", with: "jar", from: onCut(T13), to: END, reason: "his hand is IN the cookie jar (the brief's fix of panel 14)" },
    { who: "dad", with: "unit", from: onCut(T13), to: END, reason: "his arm reaches over the top plank into the jar" },
    { who: "dad", with: "gog", from: 0, to: END, reason: "worn goggles sit on his face by design" },
    { who: "dad", with: "stool", from: onCut(T13), to: END, reason: "standing on the step stool" },
    { who: "spud", with: "unit", from: onCut(T12), to: END, reason: "climbing the shelf unit" },
    { who: "spud", with: "hall", from: r3(TBONK - 0.3), to: onCut(T06), reason: "panel 05: he walks face first into his closed door (the bonk)" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/05-carrots/make-carrots.mjs. Rough draft 1 for Jonny's story check.",
});
