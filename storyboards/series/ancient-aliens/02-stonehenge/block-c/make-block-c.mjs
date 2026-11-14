// Ancient aliens EP02 "Who really built Stonehenge?", BLOCK C (story 1:42-2:36, panels 25-36, light SH_C): clue 3 the
// joints and the level ring, the plant (the ring ship right over the ring), clue 4 the line, the two suns, the grooves.
// Hand-over: ../kit/BLOCKS.md (read order there), "How we explain" of ../../kit/BLOCKS.md. Story, lines, times:
// /mnt/project-files/videos/ancient-aliens/02-stonehenge/STORY.md; panels: sheets/sheet-3-prompt.txt. Built only from
// ../kit/sh-kit.mjs (+ the pilot's northline, spiritlevel, granitecutter). Two storyboards per frame, one light, cut
// at story 2:14 between the clues (fewer places per storyboard: each carries a whole Stonehenge per place):
//   aa02-c1-<frame>  story 1:42-2:14 (score(102))  25-31 the knobs, the lift, the joint, the ring closes, the slope, the plant
//   aa02-c2-<frame>  story 2:14-2:36 (score(134))  32-36 the line, 21 JUN / 21 DEC, the grooves, the look
//   node storyboards/series/ancient-aliens/02-stonehenge/block-c/make-block-c.mjs          (wide only)
//   node storyboards/series/ancient-aliens/02-stonehenge/block-c/make-block-c.mjs --tall   (wide + tall, after Jonny's OK)
//
// THE BRIEF
//   Joke:        Spud piles up proof that the ring was built like a machine part (studs, clicks, dead level) and the
//                one picture that answers "why level?" hangs right over his head; the last clue gets caught in the act.
//   Wants:       to prove the ring is engineering, not a temple.
//   Consequence: the alien cutting the "natural" grooves is caught and waves.
//   Ending:      Spud's eyes turn slowly to the lens, flat (hard cut to block D's parchment).
// Departures from the sheet (reasons in the delivery):
//   33  one very wide shot with both suns cannot be true (the two suns stand 180 degrees apart): two shots down the
//       same line instead, each with its own real sun: the pale June sunrise behind the Heel Stone, the December
//       sunset beyond the tallest pair, the date punching in beside each.
//   27  the crew alien taps the joint with his boot (no reach to his feet on a 1 m wide top stone); Spud hops on it.
//   29  no drawn level line (the kit has no standing line); the long lens shows it, and 30's spirit level proves it.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { FRAME, SET_OF, CAST, PLACE, shot, today, past, sheep, liftStone, ringShip, stoneAt, host, hostSay, clueTag, sunsetClock, score, lampClip } from "../kit/sh-kit.mjs";

const TALL = process.argv.includes("--tall");
const FRAMES = TALL ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
const T0 = { c1: 102, c2: 134 };

// STORY.md's lines word for word, split at their full stops so a cut can sit there; [text, spoken s, tone]
// (the spoken lengths are the ones the render prints: "speech: ... lasts Xs")
const L = {
  look: ["Look at the top of this stone.", 1.9],
  clue3: ["Clue three.", 1.0, "excited"],
  knobs: ["Knobs.", 0.8],
  holes: ["And every top stone has holes that fit.", 2.69],
  locks: ["Each one locks into the next.", 1.9],
  bricks: ["Like toy bricks.", 1.2],
  curved: ["They are even curved.", 1.5],
  thirty: ["Thirty stones.", 1.44],
  ring: ["One perfect ring, thirty metres across.", 2.7],
  slopes: ["The ground here slopes.", 1.5],
  ringNot: ["The ring does not.", 1.3],
  level: ["It is level to within a few centimetres.", 2.33],
  why: ["Why would a temple need to be perfectly level?", 2.9, "question"],
  clue4: ["Clue four.", 1.0, "excited"],
  aimed: ["The whole thing is aimed.", 1.6],
  line: ["Along one line.", 1.2],
  sunrise: ["One end points at sunrise on the longest day.", 2.9],
  sunset: ["The other, at sunset on the shortest.", 2.78],
  grooves: ["And under that line, they found grooves in the rock.", 3.81],
  same: ["Pointing the same way.", 1.4],
  natural: ["Natural, they say.", 1.61],
};
const say = (c, F, t, k, who, o = {}) => { hostSay(c, F, r3(t), who, L[k][0], L[k][1], L[k][2] ?? "calm", o); return r3(t + L[k][1]); };
const num = (c, F, t0, t1, text, o = {}) => c.cap(r3(t0), r3(t1), text, o.pos ?? F.NUM, false, { size: F.numSize, kinetic: false, ...o });

const META = {
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false, animeTiming: true,
};
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face: r3(face), expr: "kind", follow: 0.2, seed: 2.1, ...extra });
// a point on a circle round a place's centre: angle a in degrees from +z toward -x (BOARD section 1), radius r
const ring = (o, a, r = 15.5) => { const k = a * Math.PI / 180; return [r3(o[0] - r * Math.sin(k)), r3(o[1] + r * Math.cos(k))]; };
const rel = (o, p) => [r3(p[0] - o[0]), r3(p[1] - o[1])];
// the facing (degrees, 0 = +z) that looks from p toward q
const faceTo = (p, q) => r3(Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI);
// a camera relative to a place: pos / look as [x, y, z] with x, z relative to o
const at = (o, pos, look, fov) => ({ pos: [r3(o[0] + pos[0]), pos[1], r3(o[1] + pos[2])], look: [r3(o[0] + look[0]), look[1], r3(o[1] + look[2])], fov });
const move = (a, b, dur) => ({ ...a, to: b, dur });
const cams = (wide, tall) => ({ wide, tall });
// a place whose sun stands elsewhere than the clock says (the June sunrise): every sun key of its props
const resun = (props, sunAz, sunEl, sunColor) => props.map((p) => (p.sunAz != null ? { ...p, sunAz, sunEl, ...(p.sunColor && { sunColor }) } : p));

// ===================================================================== aa02-c1: story 1:42-2:14 (32.0 s)
function c1(F) {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c, W = F.key === "wide";
  const P = { knobs: PLACE(0), lift: PLACE(1), joint: PLACE(2), top: PLACE(3), slope: PLACE(4), plant: PLACE(5) };
  const T = { knobs: 0, palm: 2.2, past: 3.0, knobsPast: 3.8, lift: 6.0, joint: 9.0, top: 14.0, slope: 21.0, kneel: 25.0, plant: 28.0, END: 32.0 };
  const TS = (t) => T0.c1 + t;   // story time of a clip time

  // ---- 25-26: Stone 16 on the south-west, seen from inside between the bluestones and the sarsens, against the
  // orange sky; the top stone that comes down is n 16 (on uprights 16 and 17), 15 is left off so a knob stays bare.
  const A16 = 186, SPUD_A = 186.5;
  const spudFoot = ring([0, 0], SPUD_A, 14.3), palm = ring([0, 0], 186.2, 14.92);
  const look16 = (o) => [o[0], o[1]];
  // the knobs: level with the top of Stone 16, a few metres in front of it, the orange sky behind
  const camKnobs = (o, k = 0) => at(o, [...ringXYZ(188.6, r3(12.1 + 0.5 * k), 4.55)], [...ringXYZ(186.2, 15.5, 4.3)], W ? 40 : 54);
  // his palm on the stone: side on along the corridor between the bluestones and the sarsens
  const camPalm = (o, k = 0) => at(o, [...ringXYZ(r3(195.5 - 1.2 * k), 13.4, 0.8)], [...ringXYZ(186.5, 14.6, 0.8)], W ? 44 : 58);
  function ringXYZ(a, r, y) { const [x, z] = ring([0, 0], a, r); return [x, y, z]; }
  const [l16x, l16z] = ring(P.lift, 192), L16YAW = r3(180 - 192);
  const crowAt = ring(P.knobs, A16 + 1.85, 15.5);   // on the +x knob of Stone 16 (knobs at +-0.5 m along the stone)

  // ---- 27: the joint between top stones 19 and 20, over upright 20 (angle 234); 20 comes down
  const [l20x, l20z] = ring(P.joint, 240), L20YAW = r3(180 - 240);
  const tanCW = (a) => r3(Math.atan2(-Math.cos(a * Math.PI / 180), -Math.sin(a * Math.PI / 180)) * 180 / Math.PI);   // facing clockwise along the ring

  // ---- 30: the close on the ring top on the +x side (the low side of the slope), looking along the ring toward the sun
  const KN_A = 262, LEV_A = 265.3;

  const cast = [
    who("spud1", CAST.spud, P.knobs, ...spudFoot, faceTo(spudFoot, ring([0, 0], SPUD_A, 16))),
    who("spud2", CAST.spud, P.lift, ...spudFoot, faceTo(spudFoot, ring([0, 0], SPUD_A, 16))),
    who("spud3", CAST.spud, P.joint, ...rel(P.joint, ring(P.joint, 226.8)), tanCW(226.8), { y: 4.9 }),
    who("crew3", CAST.crew, P.joint, ...rel(P.joint, ring(P.joint, 230.6)), tanCW(230.6) - 20, { y: 4.9 }),
    who("spud4", CAST.spud, P.slope, ...rel(P.slope, ring(P.slope, 16)), tanCW(16) + 180, { y: 4.9 }),
    who("spud4b", CAST.spud, P.slope, ...rel(P.slope, ring(P.slope, KN_A)), tanCW(KN_A), { y: 4.9 }),
    who("spud5", CAST.spud, P.plant, 0.2, 6.8, 4),
  ];
  const sky = (o, Tq, extra) => past(`${extra}`, o, { T: Tq });
  const props = [
    // 25 today: the ruin, a crow on Stone 16's knob
    ...today("k0", P.knobs, { T: TS(0) }),
    { id: "crow0", kind: "crow", x: crowAt[0], y: 4.27, z: crowAt[1], rot: 120, staged: "it sits on the knob, then flies off" },
    host("spud1"),
    // 26 2500 BC: top stones 15 and 16 still off; the ship lowers 16 onto its knobs
    ...past("p1", P.lift, { T: TS(4), gap: [15, 16] }),
    ...liftStone("l1", [l16x, l16z], { piece: "toplintel", yaw: L16YAW, h: 3.2, hover: 40, beam: 0.35 }),
    host("spud2"),
    // 27 top stone 20 comes down beside 19; Spud and a crew alien stand on 19
    ...past("p2", P.joint, { T: TS(11), gap: [20] }),
    ...liftStone("l2", [l20x, l20z], { piece: "toplintel", yaw: L20YAW, h: 1.1, hover: 40, beam: 0.35 }),
    host("spud3"),
    // 28 from high (the sheet's three-quarter view): the ring of top stones closes (built 0.7 -> 0.95), a small ship lowers the last one (15, south-west)
    ...past("p3", P.top, { T: TS(16), built: 0.7, gap: [15] }),
    ...(() => { const [x, z] = ring(P.top, 180); return liftStone("last3", [x, z], { piece: "toplintel", yaw: 0, h: 4.5, hover: 12, beam: 0.6, shipS: 0.42 }); })(),
    { id: "dia3", kind: "northline", x: r3(P.top[0] + 15.5), y: 5.15, z: P.top[1], rot: 90, len: 31, width: 0.3, color: "#fff3c4", staged: "a measuring line drawn over the top view" },
    // 29-30 the slope (drawn 2.4 times too strong, BOARD), the spirit level on the ring's top
    ...past("p4", P.slope, { T: TS(23), slope: 1.2 }),
    (() => { const [x, z] = ring(P.slope, LEV_A, 15.5); return { id: "lev4", kind: "spiritlevel", x, y: 4.9, z, rot: r3(-LEV_A), bubble: -1 }; })(),
    host("spud4"), host("spud4b"),
    // 31 the plant: the ring ship right over the stone ring, the same size
    ...past("p5", P.plant, { T: TS(30) }), ...ringShip("r5", P.plant, { hover: 22 }),
    host("spud5"),
  ];
  c.prop(0, "l1-ship", { beam: 0.35, wobble: 0 }, 0); c.prop(0, "l2-ship", { beam: 0.35, wobble: 0 }, 0); c.prop(0, "r5-ship", { beam: 0, wobble: 0 }, 0); c.prop(0, "last3-ship", { beam: 0.6, wobble: 0 }, 0);
  c.prop(0, "p3-stones", { built: 0.7 }, 0); c.prop(0, "dia3", { draw: 0 }, 0); c.prop(0, "lev4", { bubble: -1 }, 0);
  c.prop(0, "crow0", { hop: 0, caw: 0, wings: 0, headY: 0 }, 0);

  // ---------------- 25 THE KNOBS (0-3.0): low angle on Stone 16's bare top, a crow on a knob; it caws and lifts off, the
  // camera tilts down to Spud laying his palm flat on the stone
  A(0, "spud1", "look", { to: [0, 0.4], dur: 0.01, blink: false });
  say(c, F, 0.3, "look", "spud1", { hold: 0.3 });
  c.prop(0.5, "crow0", { headY: -0.6 }, 0.3); c.prop(1.2, "crow0", { headY: 0.3 }, 0.3);
  c.prop(1.4, "crow0", { caw: 1 }, 0.12, "out"); c.sfx(1.4, "ai/raven-caw", { gain: 0.5, reason: "the crow on the knob" }); c.prop(1.6, "crow0", { caw: 0 }, 0.15);
  c.prop(1.7, "crow0", { wings: 1, hop: 1 }, 0.15, "out"); c.sfx(1.7, "ai/wing-flap", { gain: 0.45, reason: "the crow lifts off" });
  { const [x, z] = ring(P.knobs, A16 - 8, 18); c.prop(1.8, "crow0", { x, y: 7.5, z }, 0.4, "in"); }
  // 2.2 his palm: he looks up the stone, lays his palm flat on it
  c.arm(2.25, "spud1", "R", { world: [r3(P.knobs[0] + palm[0]), 0.95, r3(P.knobs[1] + palm[1])] }, 0.35, "inOut");
  A(2.4, "spud1", "grip", { side: "R", shape: "flat", dur: 0.2 });
  c.sfx(2.6, "thud-soft", { gain: 0.25, reason: "his palm on the stone" });
  A(2.5, "spud1", "noblink", { dur: 0.5 });

  // ---------------- 26 2500 BC (3.0-6.0): same frame, his palm on the new stone; tilt up: the top stone comes down in the
  // beam, its holes over the knobs: clack, frost dust drifts
  A(T.past, "spud2", "look", { to: [0, 0.4], dur: 0.01, blink: false }); A(3.25, "spud2", "look", { to: [0.1, 0.8], dur: 0.3 }); A(3.25, "spud2", "expr", { set: { eye: 1.1 }, dur: 0.15 });
  c.arm(T.past, "spud2", "R", { world: [r3(P.lift[0] + palm[0]), 0.95, r3(P.lift[1] + palm[1])] }, 0.01);
  A(T.past, "spud2", "grip", { side: "R", shape: "flat", dur: 0.01 });
  c.sfx(T.past, "kenney/space-engine-low", { gain: 0.12, dur: 5.9, reason: "the ship's low hum" });
  clueTag(c, F, T.past, 31.9, 3);
  say(c, F, 3.2, "clue3", "spud2");
  const LAND1 = 4.5;
  c.prop(T.past, "l1-stone", { y: 4.1 }, LAND1 - T.past, "in");
  c.sfx(LAND1, "kenney/impact-mining", { gain: 0.75, reason: "stone holes onto stone knobs: the clack" }); c.sfx(r3(LAND1 + 0.02), "thud", { gain: 0.5, reason: "the weight settles" });
  A(r3(LAND1 + 0.05), "spud2", "expr", { set: { lid: 0.5 }, dur: 0.08 }); A(r3(LAND1 + 0.4), "spud2", "expr", { set: { lid: 0 }, dur: 0.2 });
  say(c, F, 4.9, "knobs", "spud2", { hold: 0.1 });
  A(5.4, "spud2", "noblink", { dur: 0.6 });

  // ---------------- 26 the lift (6.0-9.0): along the ring; the beam's edge lifts him a metre, arms out; it sets him on the ring
  say(c, F, 6.05, "holes", "spud2", { hold: 0.15 });
  c.arm(6.0, "spud2", "R", "rest", 0.3, "inOut"); A(6.0, "spud2", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
  A(6.3, "spud2", "expr", { set: { eye: 1.2, raise: 0.06 }, dur: 0.12 });
  { const p = ring(P.lift, SPUD_A, 14.3); A(6.4, "spud2", "fly", { to: { x: p[0], y: 1.0, z: p[1] }, dur: 0.9, ease: "inOut" }); }
  c.arm(6.45, "spud2", "R", { o: [0.42, 0.62, 0.05] }, 0.35, "out"); c.arm(6.5, "spud2", "L", { o: [0.42, 0.62, 0.05] }, 0.35, "out");
  A(6.6, "spud2", "grip", { side: "both", shape: "open", dur: 0.2 });
  A(6.6, "spud2", "look", { to: [0, -0.5], dur: 0.3 });
  { const p = ring(P.lift, 189, 14.3); A(7.4, "spud2", "fly", { to: { x: p[0], y: 5.6, z: p[1] }, dur: 0.75, ease: "inOut" }); }
  { const p = ring(P.lift, 192, 15.5); A(8.15, "spud2", "fly", { to: { x: p[0], y: 4.9, z: p[1] }, dur: 0.55, ease: "inOut" }); }
  c.sfx(8.7, "step-grass", { gain: 0.3, reason: "his boots on the stone" });
  c.arm(8.5, "spud2", "R", "rest", 0.3, "inOut"); c.arm(8.5, "spud2", "L", "rest", 0.3, "inOut");
  A(8.4, "spud2", "noblink", { dur: 0.6 });

  // ---------------- 27 THE JOINT (9.0-14.0): close on the ring's top; 20 comes down beside 19, its ridge slides into the
  // groove: clack; the crew alien taps it with his boot, proud; Spud hops on it: nothing moves
  const LAND2 = 10.2;
  c.prop(T.joint, "l2-stone", { y: 4.1 }, LAND2 - T.joint, "in");
  c.sfx(T.joint, "kenney/space-engine-low", { gain: 0.1, dur: 2.0, reason: "the ship's low hum" });
  c.sfx(LAND2, "kenney/impact-mining", { gain: 0.8, reason: "ridge into groove: the clack" });
  A(T.joint, "spud3", "look", { to: [0.1, -0.35], dur: 0.01, blink: false });
  A(T.joint, "crew3", "look", { to: [0.2, -0.4], dur: 0.01 });
  say(c, F, 9.3, "locks", "spud3", { hold: 0.3 });
  A(10.9, "crew3", "turn", { to: tanCW(230.6), dur: 0.3 });
  A(11.0, "crew3", "tap", { count: 2, every: 0.3, side: "R" });
  A(11.0, "spud3", "look", { to: [0.4, -0.2], dur: 0.3 });
  say(c, F, 11.7, "bricks", "spud3");
  A(12.9, "spud3", "hop", { height: 0.1, dur: 0.32 }); c.sfx(13.2, "thud-soft", { gain: 0.4, reason: "he lands on the stone" });
  A(13.4, "spud3", "expr", { set: { curve: 0.15 }, dur: 0.2 }); A(13.4, "crew3", "look", { to: [-0.5, 0.1], dur: 0.25 });
  A(13.4, "spud3", "noblink", { dur: 0.6 });

  // ---------------- 28 THE RING CLOSES (14.0-21.0): from straight above; the top stones appear 1 to 29 in rhythm, the
  // counter runs with them; the last one drops into the gap over the entrance on "thirty"; the bluestones come up;
  // the 30 m line draws across
  const B0 = 14.3, B1 = 17.0, LAST = 17.45;
  c.prop(B0, "p3-stones", { built: 0.9417 }, B1 - B0, "linear");   // 0.7 + 0.25 * 29 / 30: stone 29 (30 is the gap)
  for (let k = 0; k <= 29; k++) { const t = r3(B0 + (B1 - B0) * k / 29); num(c, F, t, k === 29 ? LAST : r3(B0 + (B1 - B0) * (k + 1) / 29), String(k)); }
  for (let k = 1; k <= 29; k += 4) c.sfx(r3(B0 + (B1 - B0) * k / 29), "thud-soft", { gain: 0.22, reason: "top stones set down" });
  c.prop(B1 - 0.6, "last3-stone", { y: 4.1 }, LAST - B1 + 0.6, "in");
  c.sfx(LAST, "kenney/impact-mining", { gain: 0.8, reason: "the last top stone clacks in" }); c.sfx(r3(LAST + 0.02), "thud", { gain: 0.5, reason: "its weight" });
  num(c, F, LAST, 18.3, "30", { size: Math.round(F.numSize * 1.25) });
  c.prop(17.7, "p3-stones", { built: 1 }, 0.9, "linear");
  say(c, F, 14.4, "curved", "spud3", { sub: true });
  say(c, F, 16.3, "thirty", "spud3", { hold: 0.2 });
  c.prop(18.4, "dia3", { draw: 1 }, 1.1, "inOut");
  for (let i = 0; i <= 11; i++) { const t = r3(18.4 + i * 0.1); num(c, F, t, i === 11 ? 20.9 : r3(t + 0.1), `${Math.round(30 * (1 - Math.pow(1 - i / 11, 3)))} m`); }
  say(c, F, 18.0, "ring", "spud3", { hold: 0.15 });

  // ---------------- 29 THE SLOPE (21.0-25.0): side on, long lens: the frosty ground falls left to right, the ring's top
  // runs dead level; Spud walks along the top, tiny
  const walk = [16, 6, 356];
  A(T.slope, "spud4", "look", { to: [0, 0], dur: 0.01 });
  A(21.17, "spud4", "look", { to: [0.3, 0], dur: 0.2 });
  A(21.3, "spud4", "move", { to: ring(P.slope, walk[2]), y: 4.9, dur: 3.5 });   // one straight move: the chord stays on the 1 m wide top
  say(c, F, 21.2, "slopes", "spud4");
  say(c, F, 23.1, "ringNot", "spud4");

  // ---------------- 30 THE LEVEL (25.0-28.0): close on the ring top; Spud down low, one eye along the stone; the spirit
  // level's bubble swings and settles dead centre
  A(0, "spud4b", "crouch", { to: 1, dur: 0.4 });   // set while he is off screen
  A(0, "spud4b", "look", { to: [-0.35, -0.15], dur: 0.3, blink: false });
  A(0, "spud4b", "expr", { set: { lid: 0.35 }, dur: 0.3 });
  c.prop(25.2, "lev4", { bubble: 0.7 }, 0.45, "inOut"); c.prop(25.65, "lev4", { bubble: -0.35 }, 0.45, "inOut"); c.prop(26.1, "lev4", { bubble: 0.12 }, 0.4, "inOut"); c.prop(26.5, "lev4", { bubble: 0 }, 0.4, "out");
  say(c, F, 25.2, "level", "spud4b");
  A(27.3, "spud4b", "noblink", { dur: 0.7 });

  // ---------------- 31 THE PLANT (28.0-32.0): he looks up: the ring ship sinks to hang right over the ring, the same size
  c.prop(T.plant, "r5-ship", { y: r3(4.9 + 16) }, 3.6, "out");
  c.sfx(T.plant, "kenney/space-engine-low", { gain: 0.2, dur: 3.9, reason: "the ring ship's low hum" });
  A(T.plant, "spud5", "look", { to: [0, 0.75], dur: 0.01, blink: false });
  A(28.2, "spud5", "expr", { set: { eye: 1.1 }, dur: 0.2 });
  say(c, F, 28.5, "why", "spud5");
  A(31.4, "spud5", "noblink", { dur: 0.6 });

  sunsetClock(c, F, T0.c1, 0, T.END);
  const shots = [
    ["knobs", T.knobs, move(camKnobs(P.knobs), camKnobs(P.knobs, 1), 2.2)],
    ["palm", T.palm, move(camPalm(P.knobs), camPalm(P.knobs, 0.4), 0.8)],
    ["past", T.past, move(camPalm(P.lift, 0.4), camPalm(P.lift, 1), 0.8)],
    ["knobsPast", T.knobsPast, move(camKnobs(P.lift, 0.5), camKnobs(P.lift, 0.2), 2.2)],
    ["lift", T.lift, F.key === "wide"
      ? move(at(P.lift, [...ringXYZ(216, 13.4, 1.1)], [...ringXYZ(189, 14.5, 2.4)], 52), at(P.lift, [...ringXYZ(216, 13.4, 1.6)], [...ringXYZ(191, 15.0, 4.6)], 52), 2.8)
      : move(at(P.lift, [...ringXYZ(212, 13.4, 1.1)], [...ringXYZ(189, 14.5, 2.4)], 66), at(P.lift, [...ringXYZ(212, 13.4, 1.6)], [...ringXYZ(191, 15.0, 4.6)], 66), 2.8)],
    ["joint", T.joint, W
      ? move(at(P.joint, [...ringXYZ(236.5, 19.2, 6.4)], [...ringXYZ(232, 15.5, 5.1)], 40), at(P.joint, [...ringXYZ(236, 18.6, 6.1)], [...ringXYZ(232, 15.5, 5.1)], 40), 5.0)
      : move(at(P.joint, [...ringXYZ(236.5, 19.4, 6.3)], [...ringXYZ(232, 15.5, 5.2)], 52), at(P.joint, [...ringXYZ(236, 18.8, 6.0)], [...ringXYZ(232, 15.5, 5.2)], 52), 5.0)],
    ["top", T.top, W ? move(at(P.top, [21, 31, 46], [0, 1.5, -3], 36), at(P.top, [17, 28, 42], [0, 1.5, -3], 36), 7.0)
      : move(at(P.top, [26, 66, 78], [0, 2, 0], 38), at(P.top, [22, 60, 72], [0, 2, 0], 38), 7.0)],
    ["slope", T.slope, move(at(P.slope, [0, 2.2, 95], [-3, 2.8, 0], W ? 19 : 34), at(P.slope, [0, 2.2, 95], [3, 2.8, 0], W ? 19 : 34), 4.0)],
    ["kneel", T.kneel, move(at(P.slope, [...ringXYZ(271.5, 16.0, 5.4)], [...ringXYZ(262.5, 15.4, 5.15)], W ? 42 : 56), at(P.slope, [...ringXYZ(270.5, 15.95, 5.35)], [...ringXYZ(262.5, 15.4, 5.15)], W ? 42 : 56), 3.0)],
    ["plant", T.plant, W
      ? move(at(P.plant, [0.6, 0.75, 10.8], [0, 10.5, -8], 72), at(P.plant, [0.6, 0.7, 10.3], [0, 11.5, -8], 72), 4.0)
      : move(at(P.plant, [0.5, 0.75, 11.0], [0, 10.5, -8], 76), at(P.plant, [0.5, 0.7, 10.5], [0, 11.5, -8], 76), 4.0)],
  ];
  return { id: `aa02-c1-${F.key}`, set: SET_OF(T0.c1 + 16), music: score(T0.c1), cast, props, c, shots, END: T.END,
    lamps: cast.filter((x) => x.character === CAST.spud).map((x) => x.id),
    hook: { show: ["crow0"], hint: 0, what: "part 3 opens on the knobs (\"Look at the top of this stone.\")" },
    windows: [{ who: "spud2", with: "spud2-lamp", from: 6.4, to: 8.9, checks: ["shell"], reason: "the worn headlamp band while the beam carries him through the air, arms out (worn on his head as in every scene)" }] };
}

// ===================================================================== aa02-c2: story 2:14-2:36 (22.0 s)
function c2(F) {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c, W = F.key === "wide";
  const P = { line: PLACE(0), rise: PLACE(1), set: PLACE(2), now: PLACE(3), then: PLACE(4) };
  const T = { line: 0, rise: 5.0, set: 8.5, now: 12.0, then: 16.0, look: 19.5, END: 22.0 };
  const TS = (t) => T0.c2 + t;
  // the grooves: x +-3 from z 60 outward; the cutter works the -x groove at z 72, its rail along z
  const CUT_Z = 72, CUT = r3((CUT_Z - 60) / 222);
  const CUTTER = [P.then[0] - 3, P.then[1] + CUT_Z];
  const OPER = [r3(CUTTER[0] + 1.75), r3(CUTTER[1] + 2.4)];      // the cutter's pedestal side (local (-2.4, 0.9), rot 90: toward the camera)
  const SLAB = [r3(CUTTER[0] + 0.9), 0.57, r3(CUTTER[1] + 2.4)];
  const SPUD_NOW = [1.05, 70];

  const cast = [
    who("spud9", CAST.spud, P.set, 0.6, 33, 180),
    who("spud10", CAST.spud, P.now, ...SPUD_NOW, 12),
    who("spud11", CAST.spud, P.then, ...SPUD_NOW, 12),
    who("crew11", CAST.crew, P.then, ...rel(P.then, OPER), -90),
  ];
  const props = [
    // 32 from above: the whole monument, the Heel Stone, one red line from the Avenue through the slit
    ...past("p6", P.line, { T: TS(2) }),
    { id: "heel6", kind: "heelstone", x: r3(P.line[0] + 1.6), z: r3(P.line[1] + 77), era: "new" },
    { id: "line6", kind: "northline", x: P.line[0], y: 0.06, z: r3(P.line[1] + 100), len: 180, width: 0.9, color: "#c8341f", staged: "the axis drawn on the ground" },
    // 33a the June sunrise down the line, behind the Heel Stone (the place's sun moved there)
    ...resun(past("p7", P.rise, { T: TS(6) }), 180, 1.4, "#f0502a"),
    { id: "heel7", kind: "heelstone", x: r3(P.rise[0] + 1.6), z: r3(P.rise[1] + 77), era: "new", sunAz: 180, sunEl: 1.4 },
    // 33b the December sunset down the line beyond the tallest pair (the clock's own sun); Spud on the line, pointing
    ...past("p8", P.set, { T: TS(10) }),
    { id: "heel8", kind: "heelstone", x: r3(P.set[0] + 1.6), z: r3(P.set[1] + 77), era: "new" },
    host("spud9"),
    // 34-36 today on the Avenue: the two grass ridges, the sheep
    ...today("t9", P.now, { T: TS(14), rope: true }),
    sheep("sheep9", r3(P.now[0] - 1.4), r3(P.now[1] + 67.2), 150, { graze: 1, chew: 0.6 }),
    host("spud10"),
    // 35 2500 BC, same frame: the grooves fresh in the chalk, the cutter at work, the crew alien caught
    ...past("p9", P.then, { T: TS(17), grooves: "cut" }),
    { id: "cutter9", kind: "granitecutter", x: CUTTER[0], y: 0, z: CUTTER[1], rot: 90, drop: 3.0 },
    host("spud11"),
  ];
  c.prop(0, "line6", { draw: 0 }, 0);
  c.prop(0, "p9-avenue", { cut: r3(CUT - 0.012) }, 0);
  c.prop(0, "cutter9", { slide: 0.47, cut: 1 }, 0);

  // ---------------- 32 THE LINE (0-5.0): from straight above, the line draws from the Avenue through the Heel Stone,
  // the entrance, the middle and the slit of the tallest pair
  clueTag(c, F, 0.2, 21.9, 4);
  say(c, F, 0.3, "clue4", "spud9", { hold: 0.2 });
  c.prop(1.4, "line6", { draw: 1 }, 2.9, "inOut");
  say(c, F, 1.5, "aimed", "spud9", { hold: 0.2 });
  say(c, F, 3.5, "line", "spud9");

  // ---------------- 33a SUNRISE (5.0-8.5): down the line to the north-east: a pale sun on the horizon behind the Heel
  // Stone; 21 JUN punches in
  say(c, F, 5.2, "sunrise", "spud9");
  num(c, F, 5.9, 8.45, "21 JUN");

  // ---------------- 33b SUNSET (8.5-12.0): down the line to the south-west: the big orange sun beyond the tallest pair;
  // Spud on the line points at it; 21 DEC punches in
  A(T.set, "spud9", "look", { to: [0, 0.1], dur: 0.01 });
  c.arm(8.7, "spud9", "R", "point", 0.5, "out"); A(8.9, "spud9", "grip", { side: "R", shape: "point", dur: 0.3 });
  say(c, F, 8.7, "sunset", "spud9");
  num(c, F, 9.3, 11.95, "21 DEC");

  // ---------------- 34 THE GROOVES TODAY (12.0-16.0): on the Avenue between two grass ridges; he points at the ridge, then
  // crouches and lays his palm on it
  const palm = [r3(P.now[0] + 1.62), 0.26, r3(P.now[1] + 70.15)];
  A(T.now, "spud10", "look", { to: [0, 0], dur: 0.01 });
  say(c, F, 12.1, "grooves", "spud10", { hold: 0.1 });
  c.arm(12.9, "spud10", "L", "point", 0.45, "out"); A(13.1, "spud10", "grip", { side: "L", shape: "point", dur: 0.3 });
  A(13.0, "spud10", "look", { to: [0.5, -0.35], dur: 0.3 });
  c.arm(14.3, "spud10", "L", "rest", 0.3, "inOut"); A(14.3, "spud10", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
  A(14.9, "spud10", "crouch", { to: 0.8, dur: 0.4 });
  c.arm(15.0, "spud10", "L", { world: palm }, 0.45, "inOut"); A(15.25, "spud10", "grip", { side: "L", shape: "flat", dur: 0.2 });
  A(15.4, "spud10", "noblink", { dur: 0.6 });
  c.prop(T.now, "sheep9", { headY: 0.4 }, 1.0); c.prop(14.6, "sheep9", { graze: 0 }, 0.6); c.prop(15.2, "sheep9", { headY: -0.3 }, 0.5);

  // ---------------- 35 2500 BC, same frame (16.0-19.5): the grooves are fresh chalk; the cutter's line is mid-cut, the
  // crew alien at its pedestal freezes, stares into the lens, gives a small guilty wave
  A(T.then, "spud11", "crouch", { to: 0.8, dur: 0.01 });
  A(T.then, "spud11", "look", { to: [0.5, -0.35], dur: 0.01 });
  c.arm(T.then, "spud11", "L", { world: [r3(P.then[0] + 1.62), 0.26, r3(P.then[1] + 70.15)] }, 0.01); A(T.then, "spud11", "grip", { side: "L", shape: "flat", dur: 0.01 });
  c.arm(T.then, "crew11", "R", { world: [r3(SLAB[0] + 0.05), SLAB[1] + 0.03, SLAB[2]] }, 0.01); A(T.then, "crew11", "grip", { side: "R", shape: "flat", dur: 0.01 });
  A(T.then, "crew11", "look", { to: [0, -0.3], dur: 0.01 });
  c.prop(T.then, "p9-avenue", { cut: CUT }, 0.7, "linear"); c.prop(T.then, "cutter9", { slide: 0.5 }, 0.7, "linear");
  c.sfx(T.then, "kenney/space-engine-small", { gain: 0.08, dur: 0.75, reason: "the cutter's low whine on the chalk" });
  c.sfx(T.then, "ai/bowl-scrape", { gain: 0.25, dur: 0.75, reason: "chalk scraped out of the groove" });
  c.prop(16.7, "cutter9", { cut: 0 }, 0.08);   // freezes
  A(16.75, "crew11", "turn", { to: -20, dur: 0.35 }); A(16.8, "crew11", "look", { to: [0, 0], dur: 0.25 });
  A(16.85, "crew11", "expr", { set: { eye: 1.2 }, dur: 0.1 });
  A(17.1, "spud11", "look", { to: [-0.6, -0.1], dur: 0.3 });
  say(c, F, 16.25, "same", "spud11", { hold: 0.1 });
  c.arm(17.7, "crew11", "R", "wave", 0.3, "out"); A(17.8, "crew11", "grip", { side: "R", shape: "open", dur: 0.2 });
  say(c, F, 17.85, "natural", "spud11", { hold: 0.0 });
  c.arm(19.0, "crew11", "R", "rest", 0.4, "inOut"); A(19.0, "crew11", "grip", { side: "R", shape: "relaxed", dur: 0.2 });

  // ---------------- 36 THE LOOK (19.5-22.0): today, close: he is up again, eyes on the ridge, then slowly to the lens, flat
  // he is off screen during 35: up again, arm down, turned a little (no pose jumps on screen)
  A(17.0, "spud10", "crouch", { to: 0, dur: 0.5 });
  c.arm(17.0, "spud10", "L", "rest", 0.5, "inOut"); A(17.0, "spud10", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
  A(17.6, "spud10", "turn", { to: 62, dur: 0.5 });
  A(T.look, "spud10", "look", { to: [0.55, -0.3], dur: 0.01, blink: false });
  A(T.look, "spud10", "expr", { expr: "deadpan", dur: 0 }); A(T.look, "spud10", "face", { lid: 0.5, dur: 0 });
  A(20.2, "spud10", "look", { to: [-0.75, 0.02], dur: 1.1, ease: "inOut", blink: false });
  A(20.3, "spud10", "noblink", { dur: 1.7 });

  sunsetClock(c, F, T0.c2, 0, T.END);
  const shots = [
    ["line", T.line, W ? move(at(P.line, [-62, 50, 2], [0, 0, 28], 40), at(P.line, [-57, 46, 6], [0, 0, 28], 40), 5.0)
      : move(at(P.line, [-80, 96, 0], [0, 0, 22], 56), at(P.line, [-76, 92, 3], [0, 0, 22], 56), 5.0)],
    ["rise", T.rise, W ? move(at(P.rise, [0, 9, -34], [0, 3.2, 120], 30), at(P.rise, [0, 8.4, -30], [0, 2.9, 120], 30), 3.5)
      : move(at(P.rise, [0, 9, -40], [0, 5, 120], 44), at(P.rise, [0, 8.4, -36], [0, 4.6, 120], 44), 3.5)],
    ["set", T.set, W ? move(at(P.set, [-1.5, 9.0, 52], [0, 4.2, -30], 30), at(P.set, [-1.4, 8.6, 49], [0, 4.2, -30], 30), 3.5)
      : move(at(P.set, [1.2, 6, 110], [0, 5.5, -30], 38), at(P.set, [1.2, 5.6, 104], [0, 5.5, -30], 38), 3.5)],
    ["now", T.now, W ? move(at(P.now, [0.2, 1.3, 84.5], [0.4, 2.0, 20], 30), at(P.now, [0.2, 1.25, 82.5], [0.4, 1.9, 20], 30), 4.0)
      : move(at(P.now, [0.6, 1.3, 81], [0.6, 2.6, 20], 50), at(P.now, [0.6, 1.25, 79.5], [0.6, 2.5, 20], 50), 4.0)],
    ["then", T.then, W ? move(at(P.then, [0.2, 1.25, 82.5], [0.4, 1.9, 20], 30), at(P.then, [0.2, 1.22, 81.5], [0.4, 1.85, 20], 30), 3.5)
      : move(at(P.then, [0.6, 1.25, 79.5], [0.6, 2.5, 20], 50), at(P.then, [0.6, 1.22, 78.8], [0.6, 2.45, 20], 50), 3.5)],
    ["look", T.look, W ? move(at(P.now, [2.3, 0.62, 72.4], [0.9, 0.62, 69.6], 30), at(P.now, [2.2, 0.62, 72.1], [0.9, 0.62, 69.6], 30), 2.5)
      : move(at(P.now, [1.55, 0.66, 72.6], [1.0, 0.64, 69.6], 40), at(P.now, [1.5, 0.66, 72.3], [1.0, 0.64, 69.6], 40), 2.5)],
  ];
  return { id: `aa02-c2-${F.key}`, set: SET_OF(T0.c2 + 10), music: score(T0.c2), cast, props, c, shots, END: T.END,
    lamps: cast.filter((x) => x.character === CAST.spud).map((x) => x.id),
    hook: { show: ["line6"], hint: 0, what: "clue 4 opens on the top view of the whole monument" },
    windows: [{ who: "crew11", with: "cutter9", from: T.then, to: T.END, checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "the operator's palm rests on the cutter's control slab and he stands at its pedestal (pilot kit: AA_SHIP_PARTS.slab is where the palm aims)" }] };
}

for (const F of FRAMES) for (const build of [c1, c2]) {
  const s = build(F);
  write(import.meta.url, {
    id: s.id, title: `Ancient Aliens 02 block ${s.id.slice(5, 7).toUpperCase()} (${F.key})`, idea: "Clue 3 the joints and the level ring, clue 4 the line and the grooves", ...META, ...F.sb,
    set: s.set, music: s.music, sound: { sfx: 0.6, ambience: 0.06, guard: true, scenes: ["scifi"] },
    hook: s.hook, cast: s.cast, props: s.props, captions: s.c.captions, beats: s.c.beats(s.shots, s.END),
    allowClip: [...lampClip(s.lamps, s.END), ...(s.windows || [])],
    notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/block-c/make-block-c.mjs (block C).",
  });
}
