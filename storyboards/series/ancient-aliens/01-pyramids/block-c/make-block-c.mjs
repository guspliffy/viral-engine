// Ancient aliens EP01 "Who really built the pyramids?", BLOCK C (story 1:40-2:18, panels 19-25): clue 3 precision (the
// level, the four sides, the hairline joint, one line of light north), the low at sunset, clue 4 the number (latitude =
// the speed of light). Hand-over: ../../kit/BLOCKS.md (v2: "How we explain", Jonny 13 Nov on block A: "way more interesting
// now", applied here). Story, lines and times: /mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md.
// Built only from ../../kit/aa-kit.mjs. Two lights = two storyboards cut together (aa-kit.mjs LIGHT AND TIME OF DAY):
//   aa01-c-day   SET       story 1:40-1:58 (score(100))  the level, the four sides, the joint, 2560 BC the line north
//   aa01-c-late  SET_LATE  story 1:58-2:18 (score(118))  the low at sunset, the map, the number, the eyebrow
//   node storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs
// Departure from the sheet (kit thread + BLOCKS.md): panels 21-22 draw ONE straight line north, not a square.
//
// THE BRIEF
//   Joke:        Spud piles up precision until the number he stands on turns out to be the speed of light.
//   Wants:       proof (the low says it: three clues and still none).
//   Consequence: the latitude, read off the map, is the speed of light's digits.
//   Ending:      one eyebrow up, the rest of the face still (hard cut to block D's night).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { SET, SET_LATE, SUN, CAST, VIEW, cam, far, gizaToday, liftShip, site, host, hostSay, clueTag, score, lampClip } from "../../kit/aa-kit.mjs";

// STORY.md's lines word for word (long ones split at their full stop so a cut can sit there), with the spoken lengths the
// render prints (speech: "..." lasts Xs spoken)
const L = {
  sideA: ["Two hundred and thirty metres a side.", 2.07, "excited"],
  sideB: ["All four within twenty centimetres.", 2.25],
  northA: ["And it points to true north.", 1.59],
  northB: ["Off by less than a tenth of a degree.", 2.17],
  northC: ["No compass.", 0.99],
  low: ["Sunset. Three clues. And still no proof.", 4.49, "sad"],
  check: ["Then I checked where I was standing.", 1.63],
  lat: ["Twenty-nine point nine seven nine two four five eight.", 4.36],
  light: ["The speed of light.", 1.69],
};
const SUBY = 470;                                         // speech lettering in the upper third, under the number texts
const TXT = 300, TXTS = { size: 96, kinetic: false };    // the number texts (read without English)
const say = (c, t, k, who, o = {}) => { hostSay(c, r3(t), who, L[k][0], L[k][1], L[k][2] ?? "calm", { pos: SUBY, ...o }); return r3(t + L[k][1]); };
const num = (c, t0, t1, text, o = {}) => c.cap(r3(t0), r3(t1), text, o.pos ?? TXT, false, { ...TXTS, ...o });
// a number that counts: from a to b over [t0, t1] in steps of 0.1 s (eased out), then holds to `hold`
const count = (c, t0, t1, hold, a, b, fmt, o = {}) => {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1);
    num(c, ts, i === n ? hold : r3(ts + 0.1), fmt(i === n ? b : v), o);
  }
};

const META = {
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [200, 1360], castLook: "sheet",
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  animeTiming: true,
};
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const at = (o, pos, look, fov) => cam(o, { pos, look, fov });
const move = (o, a, b, dur) => ({ ...at(o, ...a), to: at(o, ...b), dur });

// ================================================================ STORYBOARD 1: aa01-c-day (SET, afternoon) story 1:40-1:58
{
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const P = { base: [0, 0], sides: [1000, 0], joint: [2000, 0], line: [3000, 0] };
  const T = { crane: 0, sides: 2.4, joint: 5.4, past: 8.0, top: 11.0, rest: 14.4, END: 18.0 };
  const LEVEL = [P.base[0] + 1.6, 2.15];
  const JOINT = [P.joint[0], 0.47];
  const LINE0 = [P.line[0], -0.7];       // the line starts at the corner stone's north face
  const H = 23.03;                       // half a side of the miniature (230.3 m x S 0.2)

  const cast = [
    who("spud1", CAST.spud, P.base, 1.6, 1.35, 0, { y: 0.12 }),
    who("spud2", CAST.spud, P.joint, 0.54, 1.02, -140),
    who("spud3", CAST.spud, P.line, 1.2, 0.9, 60),
    who("crewA", CAST.crew, P.line, -1.25, 0.35, 120), who("crewB", CAST.crew, P.line, -1.2, -1.0, 140),
  ];
  // the four sides of the miniature, drawn one after another: [id, origin x, z, rot (0 = toward -z), label]
  const SIDES = [["sW", -H, H, 0, "W 230.36 m"], ["sN", -H, -H, -90, "N 230.25 m"], ["sE", H, -H, 180, "E 230.39 m"], ["sS", H, H, 90, "S 230.45 m"]];
  const props = [
    // 19 the base today, the level on the platform
    ...far("f1", [P.base[0] + 0.4, 5], { time: "afternoon", tracks: true, seed: 3 }), ...site("b1", P.base, { era: "today" }),
    { id: "level1", kind: "spiritlevel", x: LEVEL[0], y: 0.12, z: LEVEL[1], rot: 0, bubble: 0 },
    host("spud1"),
    // the four sides: Giza today as the miniature, seen from high in the south-east
    ...far("f2", [P.sides[0] + 28, 35], { time: "afternoon", tracks: true, seed: 2 }), ...gizaToday("g2", P.sides, { sunAz: SUN.afternoon, haze: false }),
    ...SIDES.map(([id, x, z, rot]) => ({ id, kind: "northline", x: r3(P.sides[0] + x), y: 0.15, z, rot, len: 46.06, width: 0.35, staged: "a measuring line lying on the sand along the base" })),
    // 20 the hairline joint between two white casing stones
    ...far("f3", [P.joint[0], 2], { time: "afternoon", tracks: true, seed: 5 }),
    { id: "pair3", kind: "casingpair", x: P.joint[0], y: 0, z: 0, state: "today", seed: 2 },
    host("spud2"),
    // 21-22 2560 BC: the corner stone comes down, then the ship glides north and its beam draws ONE line; true north beside it
    ...far("f4", [P.line[0] + 2, 8], { time: "afternoon", seed: 4, rubble: 0 }),
    ...liftShip("s4", [P.line[0], 0], { top: 0, s: 1, beam: 0.5, hover: 10, block: { y: 3.0, k: 1, look: "casing" } }),
    { id: "line4", kind: "northline", x: LINE0[0], y: 0.02, z: LINE0[1], len: 120, width: 0.16, staged: "a line of light lying on the sand" },
    { id: "true4", kind: "northline", x: LINE0[0], y: 0.03, z: LINE0[1], len: 120, width: 0.04, color: "#ffffff", rot: 0.05, staged: "true north drawn on the map view" },
    host("spud3"),
  ];
  props.find((p) => p.id === "s4-block").staged = "the ship's beam carries the corner stone down";
  c.prop(0, "s4-ship", { beam: 0.5, wobble: 0 }, 0); c.prop(0, "s4-block", { dust: 0 }, 0);
  for (const id of ["line4", "true4", ...SIDES.map((s) => s[0])]) c.prop(0, id, { draw: 0 }, 0);

  // ---- 19 THE LEVEL (0-2.4): start on the stone, the camera cranes down the courses to Spud crouched at the level
  clueTag(c, 0, 2.3, 3);
  A(0, "spud1", "crouch", { to: 0.55, dur: 0.01 });
  A(0, "spud1", "look", { to: [0, -0.45], dur: 0.01, blink: false });
  say(c, 0.3, "sideA", "spud1");
  count(c, 0.6, 1.8, 2.35, 0, 230, (v) => `${Math.round(v)} m`, { size: 110 });
  A(1.6, "spud1", "look", { to: [0, 0], dur: 0.2, blink: false });
  A(1.75, "spud1", "expr", { set: { raise: 0.06 }, dur: 0.15 });
  A(1.9, "spud1", "noblink", { dur: 0.5 });

  // ---- THE FOUR SIDES (2.4-5.4): each side draws and its length punches in; then the spread, 20 cm
  clueTag(c, 2.4, 5.3, 3);
  say(c, 2.8, "sideB", "spud1");
  SIDES.forEach(([id, , , , text], i) => {
    const t = r3(2.6 + i * 0.6);
    c.prop(t, id, { draw: 1 }, 0.5, "inOut");
    num(c, t, r3(t + 0.6), text, { size: 84 });
  });
  num(c, 5.0, 5.35, "Δ 20 cm", { size: 120 });

  // ---- 20 THE JOINT (5.4-8.0): push in on the hairline, his glove comes in and points, 0.5 mm punches in
  A(T.joint, "spud2", "look", { to: [-0.3, -0.2], dur: 0.01, blink: false });
  c.arm(5.9, "spud2", "R", { world: [JOINT[0] + 0.03, 0.47, JOINT[1] + 0.02] }, 0.5, "inOut");
  A(6.1, "spud2", "grip", { side: "R", shape: "point", dur: 0.3 });
  num(c, 6.6, 7.95, "0.5 mm", { size: 120 });
  A(7.4, "spud2", "noblink", { dur: 0.6 });

  // ---- 21 2560 BC (8.0-11.0): the corner stone lands (dust rolls over Spud), the ship glides north drawing the line,
  // he points along it and a crew alien copies him
  const LAND = 8.6, GLIDE = 9.3, GLIDE_D = 3.4;
  c.prop(T.past, "s4-block", { y: 0 }, LAND - T.past, "in");
  c.sfx(LAND, "thud", { gain: 0.9 }); c.sfx(r3(LAND + 0.02), "kenney/impact-mining", { gain: 0.5, reason: "grit under the block" });
  c.prop(LAND, "s4-block", { dust: 1 }, 1.2, "out");
  c.sfx(T.past, "kenney/space-engine-low", { gain: 0.14, dur: 6.0, reason: "the ship's low hum" });
  A(r3(LAND + 0.1), "spud3", "expr", { set: { lid: 0.7 }, dur: 0.1 });   // eyes squeezed in the dust
  A(r3(LAND + 0.7), "spud3", "expr", { set: { lid: 0 }, dur: 0.2 });
  c.prop(GLIDE, "s4-ship", { z: r3(LINE0[1] - 120) }, GLIDE_D, "linear");
  c.prop(GLIDE, "line4", { draw: 1 }, GLIDE_D, "linear");
  A(T.past, "crewA", "look", { to: [0.2, 0.5], dur: 0.01 }); A(T.past, "crewB", "look", { to: [0.2, 0.5], dur: 0.01 });
  A(GLIDE + 0.2, "crewA", "turn", { to: 180, dur: 0.6 }); A(GLIDE + 0.3, "crewB", "turn", { to: 180, dur: 0.6 });
  say(c, 9.0, "northA", "spud3");
  c.arm(9.4, "spud3", "L", { o: [0.4, 0.62, 0.12] }, 0.8, "inOut"); A(9.6, "spud3", "grip", { side: "L", shape: "point", dur: 0.4 });
  c.arm(10.2, "crewA", "L", { o: [0.4, 0.6, 0.12] }, 0.6, "inOut"); A(10.4, "crewA", "grip", { side: "L", shape: "point", dur: 0.3 });   // copies him
  A(10.4, "spud3", "noblink", { dur: 0.6 });

  // ---- 22 FROM ABOVE (11.0-14.4): one straight line north; true north draws over it, 0.05°
  num(c, 11.2, 14.3, "N", { size: 110, pos: 700 });
  c.prop(11.6, "true4", { draw: 1 }, 1.0, "inOut");
  say(c, 11.5, "northB", "spud3");
  count(c, 12.6, 13.6, 14.3, 3, 0.05, (v) => `${v.toFixed(2)}°`, { size: 120, pos: 1180 });

  // ---- REST (14.4-18.0): "No compass." He shakes his head, looks north along the line; the camera cranes up to the horizon
  say(c, 14.6, "northC", "spud3");
  A(14.7, "spud3", "turn", { to: 40, dur: 0.2, ease: "inOut" }); A(14.9, "spud3", "turn", { to: 80, dur: 0.24, ease: "inOut" }); A(15.15, "spud3", "turn", { to: 60, dur: 0.2, ease: "inOut" });
  c.arm(14.4, "spud3", "L", "rest", 0.7, "inOut"); A(14.5, "spud3", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
  c.arm(14.5, "crewA", "L", "rest", 0.6, "inOut"); A(14.5, "crewA", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
  A(15.8, "spud3", "turn", { to: 160, dur: 0.6, ease: "inOut" });
  A(15.8, "spud3", "look", { to: [0, 0.15], dur: 0.4, blink: false });
  A(17.3, "spud3", "noblink", { dur: 0.7 });

  const shots = [
    ["crane", T.crane, move(P.base, [[0.7, 7.0, 6.8], [1.2, 5.6, -3], 40], [[0.45, 1.5, 5.5], [1.5, 0.5, 1.4], 40], 2.2)],
    ["sides", T.sides, move(P.sides, [[22, 118, 40], [0, 0, 2], 55], [[34, 108, 30], [0, 0, 2], 55], 3.0)],
    ["joint", T.joint, move(P.joint, [[-0.75, 0.62, 3.1], [-0.02, 0.55, 0.45], 30], [[-0.45, 0.58, 2.1], [-0.02, 0.55, 0.45], 30], 2.6)],
    ["past", T.past, move(P.line, [[0.7, 3.0, 7.8], [-0.1, 1.6, -8], 55], [[0.7, 3.4, 7.8], [-0.2, 0.6, -14], 55], 3.0)],
    ["top", T.top, move(P.line, [[0.2, 104, 26], [0, 0, -56], 50], [[0.2, 86, 20], [0, 0, -56], 50], 3.4)],
    ["rest", T.rest, move(P.line, [[2.7, 1.0, 3.7], [1.0, 0.7, 0.4], 45], [[2.3, 3.0, 5.6], [0.3, 0.7, -18], 50], 3.6)],
  ];
  const beats = c.beats(shots, T.END);
  write(import.meta.url, {
    id: "aa01-c-day", title: "Ancient Aliens 01 block C (day)", idea: "Clue 3: precision, one line north", ...META,
    set: SET, music: score(100), sound: { sfx: 0.6, ambience: 0.06, guard: true, scenes: ["scifi"] },
    hook: { show: ["spud1", "level1"], hint: 0, what: "block C opens on the base and the level (mid-film, no hook)" },
    cast, props, captions: c.captions, beats,
    allowClip: [...lampClip(["spud1", "spud2", "spud3"], T.END),
      { who: "spud1", with: "b1-base", from: 0, to: T.END, reason: "he crouches on the platform in front of the base; the base piece is one 36 m box (its foot line is 1.35 m behind him)" },
      { who: "spud2", with: "pair3", from: 5.4, to: 8.0, reason: "his fingertip on the joint, his sweater against the stone" }],
    notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs (block C, day light).",
  });
}

// ================================================================ STORYBOARD 2: aa01-c-late (SET_LATE) story 1:58-2:18
{
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const P = { dusk: [0, 0], top: [1000, 0] };
  const T = { low: 0, check: 6.9, map: 9.0, match: 12.6, face: 15.9, END: 20.0 };
  const SEAT = [P.dusk[0] + 92.4, 35.4];

  const cast = [who("spud5", CAST.spud, P.dusk, SEAT[0] - P.dusk[0], SEAT[1] + 0.35, 75)];
  const props = [
    // 23 sunset: the silhouettes, a fallen block, the camel couched beside him
    ...far("f5", [P.dusk[0] + VIEW.sunset.pos[0], VIEW.sunset.pos[2]], { time: "sunset", sun: [264, 4], seed: 4 }),
    ...gizaToday("g5", P.dusk, { sunAz: SUN.sunset, haze: false }),
    { id: "seat5", kind: "limeblock", x: SEAT[0], z: SEAT[1], look: "weathered", size: [1.1, 0.42, 0.8], seed: 4, rot: 75 },
    { id: "camel5", kind: "camel", x: SEAT[0] - 0.7, z: SEAT[1] - 2.0, rot: 100, lie: 1, grass: false },
    host("spud5"),
    // 24 from above at dusk: the Great Pyramid, one thin line across it (the latitude)
    ...far("f6", [P.top[0], 2], { time: "dusk", tracks: true, seed: 6 }),
    ...gizaToday("g6", P.top, { sunAz: SUN.sunset, night: 0.25, haze: false }),
    { id: "lat6", kind: "northline", x: P.top[0] + 70, y: 28.6, z: 0, rot: 90, len: 140, width: 0.3, staged: "the latitude line drawn over the map view, seen straight from above" },
  ];
  c.prop(0, "seat5", { dust: 0 }, 0); c.prop(0, "lat6", { draw: 0 }, 0); c.prop(0, "camel5", { ears: 0 }, 0);

  // ---- 23 THE LOW (0-6.9): one long slow push; three fingers on "three clues", his leaf droops on "no proof"
  A(0, "spud5", "sit", { seat: "seat5", height: 0.42, dur: 0.01, hands: "lap" });
  A(0, "spud5", "look", { to: [-0.5, 0.05], dur: 0.01, blink: false });
  c.prop(0, "camel5", { chew: 0.4 }, 0);
  say(c, 0.8, "low", "spud5", {});
  c.arm(1.9, "spud5", "R", "up", 0.55, "out"); A(2.0, "spud5", "grip", { side: "R", shape: "open", dur: 0.25 });   // three fingers
  c.arm(3.3, "spud5", "R", "lap", 0.45, "inOut"); A(3.3, "spud5", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
  A(4.3, "spud5", "droop", { to: 1, dur: 0.8, ease: "inOut" });
  A(4.3, "spud5", "look", { to: [-0.15, -0.3], dur: 0.5 });
  c.prop(4.8, "camel5", { ears: 1 }, 0.4); c.prop(5.6, "camel5", { tail: 0 }, 0.6);
  A(6.3, "spud5", "noblink", { dur: 0.6 });

  // ---- CHECK (6.9-9.0): his leaf springs up, eyes wide, he looks down at where he is standing
  clueTag(c, T.check, 15.85, 4);
  A(T.check, "spud5", "droop", { to: 0, dur: 0.25, ease: "out" });
  A(T.check, "spud5", "expr", { set: { eye: 1.15 }, dur: 0.12 });
  say(c, 7.1, "check", "spud5", { pos: 380 });
  A(7.9, "spud5", "look", { to: [0, -0.6], dur: 0.25, blink: false });
  A(8.4, "spud5", "noblink", { dur: 0.6 });

  // ---- 24 THE MAP (9.0-12.6): the camera drops from high over the pyramid, the latitude line draws, the digits count in
  c.prop(9.2, "lat6", { draw: 1 }, 0.9, "inOut");
  count(c, 9.4, 10.6, 15.85, 0, 29.9792458, (v) => `${v.toFixed(7)}° N`, { size: 88 });
  say(c, 10.4, "lat", "spud5", { sub: false });

  // ---- MATCH (12.6-15.9): closer; the speed of light punches in under it, digit for digit
  num(c, 14.9, 15.85, "299 792 458 m/s", { size: 88, pos: 430 });

  // ---- 25 THE EYEBROW (15.9-20.0): last orange light on one side of his face, a slow push
  A(T.face, "spud5", "look", { to: [0, 0], dur: 0.01 });
  A(T.face, "spud5", "expr", { set: { curve: 0.2, eye: 1 }, dur: 0.01 });
  num(c, T.face, 19.9, "299 792 458 m/s", { size: 64, pos: 250 });
  say(c, 16.1, "light", "spud5", { pos: 360 });
  A(17.9, "spud5", "expr", { set: { raise: 0.08 }, dur: 0.25 });
  A(19.3, "spud5", "noblink", { dur: 0.7 });

  const shots = [
    ["low", T.low, move(P.dusk, [[100, 1.3, 35], [0, 12, 37], 36], [[98.8, 1.25, 35.1], [0, 12, 37], 36], 6.9)],
    ["check", T.check, move(P.dusk, [[95.6, 1.2, 36.9], [92.4, 1.15, 35.5], 30], [[95.1, 1.18, 36.7], [92.4, 1.15, 35.5], 30], 2.1)],
    ["map", T.map, move(P.top, [[0, 260, 3], [0, 0, 0], 45], [[0, 150, 2], [0, 0, 0], 45], 3.6)],
    ["match", T.match, move(P.top, [[0, 132, 2], [0, 0, 0], 45], [[0, 118, 2], [0, 0, 0], 45], 3.3)],
    ["face", T.face, move(P.dusk, [[95.2, 1.1, 36.8], [92.4, 1.1, 35.5], 30], [[94.8, 1.08, 36.6], [92.4, 1.08, 35.5], 30], 4.1)],
  ];
  const beats = c.beats(shots, T.END);
  write(import.meta.url, {
    id: "aa01-c-late", title: "Ancient Aliens 01 block C (sunset)", idea: "The low at sunset, clue 4: the latitude is the speed of light", ...META,
    set: SET_LATE, music: score(118), sound: { sfx: 0.6, ambience: 0.06, guard: true },
    hook: { show: ["spud5"], hint: 0, what: "block C's sunset half (mid-film, no hook)" },
    cast, props, captions: c.captions, beats,
    allowClip: [{ who: "spud5", with: "seat5", from: 0, to: T.END, reason: "Spud sits on the fallen block" }, ...lampClip(["spud5"], T.END)],
    notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs (block C, sunset light).",
  });
}
