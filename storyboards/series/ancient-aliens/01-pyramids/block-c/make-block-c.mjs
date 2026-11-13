// Ancient aliens EP01 "Who really built the pyramids?", BLOCK C (story 1:40-2:18, panels 19-25): clue 3 precision (the
// level, the hairline joint, one line of light north), the low at sunset, clue 4 the number (latitude = the speed of light).
// Hand-over: ../../kit/BLOCKS.md. Story, lines and times: /mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md.
// Built only from ../../kit/aa-kit.mjs. Two lights = two storyboards cut together (aa-kit.mjs LIGHT AND TIME OF DAY):
//   aa01-c-day   SET       1:40-1:58  clue 3: the level (19), the joint (20), 2560 BC the line north (21) and from above (22)
//   aa01-c-late  SET_LATE  1:58-2:18  the low at sunset (23), clue 4 from above (24), the eyebrow (25)
//   node storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs
// Departure from the sheet (kit thread + BLOCKS.md): panels 21-22 draw ONE straight line north, not a square.
//
// THE BRIEF
//   Joke:        Spud piles up precision until the number he stands on turns out to be the speed of light.
//   Wants:       proof (the low says it: three clues and still none).
//   Consequence: the latitude, read off the map, is the speed of light's digits.
//   Ending:      one eyebrow up, the rest of the face still (hard cut to block D's night).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { SET, SET_LATE, SUN, CAST, VIEW, HOST_VOICE, cam, far, gizaToday, liftShip, site, host } from "../../kit/aa-kit.mjs";

// the spoken lengths the render prints (speech: "..." lasts Xs spoken); STORY.md's lines word for word
const L = {
  side: ["Two hundred and thirty metres a side. All four within twenty centimetres.", 4.86],
  north: ["And it points to true north. Off by less than a tenth of a degree. No compass.", 5.92],
  low: ["Sunset. Three clues. And still no proof.", 4.49],
  check: ["Then I checked where I was standing.", 1.63],
  lat: ["Twenty-nine point nine seven nine two four five eight.", 4.36],
  light: ["The speed of light.", 1.69],
};
// a real-voice line: the say MACRO (engine/compile.mjs; withSpeech reads macro say in a beat storyboard, a c.say talk
// action is never voiced), its subtitle a classic caption in the upper third for the spoken length + 0.4 s
const say = (c, t, who, k, tone = "calm", { sub = true, pos = LINES.pos } = {}) => {
  c.at(r3(t), { macro: "say", who, line: L[k][0], tone, dur: L[k][1], voice: HOST_VOICE, caption: false });
  if (sub) c.cap(r3(t), r3(t + L[k][1] + 0.4), sub === true ? L[k][0] : sub, pos, false, { size: 62, kinetic: false });
};
const LINES = { sub: true, blink: false, pos: 400 };   // speech lettering in the upper third (Jonny 12 Nov)
const label = (c, t0, t1, text, y, o = {}) => c.cap(r3(t0), r3(t1), text, y, false, { style: "label", size: 64, kinetic: false, ...o });
const clueTag = (c, t0, t1, n) => label(c, t0, t1, `CLUE ${n}/5`, 240, { x: 250, size: 44 });

const META = {
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [200, 1560], castLook: "sheet",
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  animeTiming: true, music: false,
};
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });

// ================================================================ STORYBOARD 1: aa01-c-day (SET, afternoon) 1:40-1:58
{
  const c = clip({ faces: "strong", lines: LINES }), { A } = c;
  const P = { base: [0, 0], joint: [1000, 0], line: [2000, 0] };
  const T = { level: 0, joint: 4.0, past: 8.0, top: 13.0, END: 18.0 };

  // 19 TODAY, afternoon: Spud crouched at the base's flat platform, the level on the stone, bubble dead centre
  const LEVEL = [P.base[0] + 1.6, 2.15];
  // 20 the hairline joint between two white casing stones, his glove pointing at it
  const JOINT = [P.joint[0] + 0.0, 0.47];
  // 21 2560 BC: the corner stone comes down on the empty plateau, then the ship glides north and its beam draws ONE line
  const LINE0 = [P.line[0], -0.7];   // the line starts at the corner stone's north face

  const cast = [
    who("spud1", CAST.spud, P.base, 1.6, 1.35, 0, { y: 0.12 }),
    who("spud2", CAST.spud, P.joint, 0.54, 1.02, -140),
    who("spud3", CAST.spud, P.line, 1.15, 0.7, 60),
    who("crewA", CAST.crew, P.line, -1.25, 0.35, 120), who("crewB", CAST.crew, P.line, -1.2, -1.0, 140),
  ];
  const props = [
    // 19
    ...far("f1", [P.base[0] + 0.4, 5], { time: "afternoon", tracks: true, seed: 3 }), ...site("b1", P.base, { era: "today" }),
    { id: "level1", kind: "spiritlevel", x: LEVEL[0], y: 0.12, z: LEVEL[1], rot: 0, bubble: 0 },
    host("spud1"),
    // 20
    ...far("f2", [P.joint[0], 2], { time: "afternoon", tracks: true, seed: 5 }),
    { id: "pair2", kind: "casingpair", x: P.joint[0], y: 0, z: 0, state: "today", seed: 2 },
    host("spud2"),
    // 21-22
    ...far("f3", [P.line[0] + 2, 8], { time: "afternoon", seed: 4, rubble: 0 }),
    ...liftShip("s3", [P.line[0], 0], { top: 0, s: 1, beam: 0.5, hover: 10, block: { y: 3.0, k: 1, look: "casing" } }),
    { id: "line3", kind: "northline", x: LINE0[0], y: 0.02, z: LINE0[1], len: 120, width: 0.16, staged: "a line of light lying on the sand" },
    host("spud3"),
  ];
  // seeds (params with no default start at 0)
  c.prop(0, "s3-ship", { beam: 0.5, wobble: 0 }, 0);
  props.find((p) => p.id === "s3-block").staged = "the ship's beam carries the corner stone down"; c.prop(0, "s3-block", { dust: 0 }, 0); c.prop(0, "line3", { draw: 0 }, 0);

  // ---- 19 the level (0-4.0)
  clueTag(c, 0, 3.6, 3);
  A(0, "spud1", "crouch", { to: 0.55, dur: 0.01 });
  A(0, "spud1", "look", { to: [0, -0.45], dur: 0.01, blink: false });
  say(c, 0.3, "spud1", "side", "calm", { sub: "230 metres a side. All four within 20 centimetres." });
  // after "a side": he looks up to us for "All four"
  A(2.3, "spud1", "look", { to: [0, 0], dur: 0.25 });

  // ---- 20 the joint (4.0-8.0): "...within twenty centimetres" lands on the hairline
  c.arm(T.joint, "spud2", "R", { world: [JOINT[0] + 0.03, 0.47, JOINT[1] + 0.02] }, 0.01);
  A(T.joint, "spud2", "grip", { side: "R", shape: "point", dur: 0.01 });
  A(T.joint, "spud2", "look", { to: [-0.3, -0.2], dur: 0.01, blink: false });
  label(c, 4.2, 7.8, "4 × 230 m\n< 20 cm", 1150);

  // ---- 21 2560 BC (8.0-13.0): the corner stone lands, the ship glides north drawing the line, he points along it
  const LAND = 8.4, GLIDE = 9.3, GLIDE_D = 3.4;
  c.prop(T.past, "s3-block", { y: 0 }, LAND - T.past, "in");
  c.sfx(LAND, "thud", { gain: 0.9 }); c.prop(LAND, "s3-block", { dust: 1 }, 1.2, "out");
  c.sfx(T.past, "kenney/space-engine-low", { gain: 0.22 });
  c.prop(GLIDE, "s3-ship", { z: r3(LINE0[1] - 120) }, GLIDE_D, "linear");
  c.prop(GLIDE, "line3", { draw: 1 }, GLIDE_D, "linear");
  A(T.past, "crewA", "look", { to: [0.2, 0.5], dur: 0.01 }); A(T.past, "crewB", "look", { to: [0.2, 0.5], dur: 0.01 });
  A(GLIDE + 0.2, "crewA", "turn", { to: 180, dur: 0.6 }); A(GLIDE + 0.3, "crewB", "turn", { to: 180, dur: 0.6 });
  say(c, 8.6, "spud3", "north");
  c.arm(10.2, "spud3", "L", { o: [0.4, 0.62, 0.12] }, 0.8, "inOut");
  A(10.4, "spud3", "grip", { side: "L", shape: "point", dur: 0.4 });

  // ---- 22 from above (13.0-18.0): one straight line north, the corner stone at its foot
  label(c, 13.3, 17.8, "N", 720, { size: 96 });
  label(c, 14.0, 17.8, "< 0.1°", 1180);

  const at = (o, pos, look, fov) => cam(o, { pos, look, fov });
  const shots = [
    ["level", T.level, { ...at(P.base, [0.4, 1.55, 5.6], [1.5, 0.5, 1.4], 40), to: { ...at(P.base, [0.55, 1.45, 5.1], [1.5, 0.5, 1.4], 40) }, dur: 4.0 }],
    ["joint", T.joint, at(P.joint, [-0.55, 0.6, 2.4], [-0.02, 0.55, 0.45], 30)],
    ["past", T.past, at(P.line, [0.7, 3.4, 7.8], [-0.2, 0.6, -14], 55)],
    ["top", T.top, at(P.line, [0.2, 92, 22], [0, 0, -56], 50)],
  ];
  const beats = c.beats(shots.map(([n, t, s]) => [n, t, s]), T.END);
  write(import.meta.url, {
    id: "aa01-c-day", title: "Ancient Aliens 01 block C (day)", idea: "Clue 3: precision, one line north", ...META,
    set: SET, sound: { sfx: 0.6, ambience: 0.06, guard: true, scenes: ["scifi"] },
    hook: { show: ["spud1", "level1"], hint: 0, what: "block C opens on the level at the base (mid-film, no hook)" },
    cast, props, captions: c.captions, beats,
    allowClip: [...["spud1", "spud2", "spud3"].map((w) => ({ who: w, with: `${w}-lamp`, from: 0, to: T.END, reason: "the headlamp band is worn on his head" })),
      { who: "spud1", with: "b1-base", from: 0, to: T.END, reason: "he crouches on the platform in front of the base; the base piece is one 36 m box (its foot line is 1.35 m behind him)" }],
    notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs (block C, day light).",
  });
}

// ================================================================ STORYBOARD 2: aa01-c-late (SET_LATE) 1:58-2:18
{
  const c = clip({ faces: "strong", lines: LINES }), { A } = c;
  const P = { dusk: [0, 0], top: [1000, 0] };
  const T = { low: 0, top: 6.5, face: 15.3, END: 20.0 };
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
  c.prop(0, "seat5", { dust: 0 }, 0); c.prop(0, "lat6", { draw: 0 }, 0);

  // ---- 23 the low (0-7.0): one long quiet shot
  A(0, "spud5", "sit", { seat: "seat5", height: 0.42, dur: 0.01, hands: "lap" });
  A(0, "spud5", "look", { to: [-0.5, 0.05], dur: 0.01, blink: false });
  c.prop(0, "camel5", { chew: 0.4 }, 0);
  say(c, 0.8, "spud5", "low", "sad");
  A(5.5, "spud5", "look", { to: [-0.15, -0.25], dur: 0.5 });

  // ---- 24 from above (7.0-15.0): where he stands; the line crosses the pyramid; the number; its twin
  say(c, 6.7, "spud5", "check");
  c.prop(8.3, "lat6", { draw: 1 }, 0.9, "inOut");
  label(c, 9.3, 15.25, "29.9792458° N", 430, { size: 78 });
  say(c, 9.5, "spud5", "lat", "calm", { sub: false });
  label(c, 14.0, 15.25, "299 792 458 m/s", 1250, { size: 78 });
  label(c, 15.3, 19.8, "299 792 458 m/s", 250, { size: 64 });

  // ---- 25 the eyebrow (15.0-20.0): last orange light on one side of his face
  A(T.face, "spud5", "look", { to: [0, 0], dur: 0.01 });
  say(c, 15.6, "spud5", "light", "calm", { pos: 360 });
  A(T.face, "spud5", "expr", { set: { curve: 0.2 }, dur: 0.01 });
  A(17.6, "spud5", "expr", { set: { raise: 0.08 }, dur: 0.25 });

  const at = (o, pos, look, fov) => cam(o, { pos, look, fov });
  const shots = [
    ["low", T.low, { ...at(P.dusk, [100, 1.3, 35], [0, 12, 37], 36), to: { ...at(P.dusk, [98.8, 1.25, 35.1], [0, 12, 37], 36) }, dur: 6.5 }],
    ["top", T.top, at(P.top, [0, 140, 2], [0, 0, 0], 45)],
    ["face", T.face, at(P.dusk, [95.2, 1.1, 36.8], [92.4, 1.1, 35.5], 30)],
  ];
  const beats = c.beats(shots, T.END);
  write(import.meta.url, {
    id: "aa01-c-late", title: "Ancient Aliens 01 block C (sunset)", idea: "The low at sunset, clue 4: the latitude is the speed of light", ...META,
    set: SET_LATE, sound: { sfx: 0.6, ambience: 0.06, guard: true },
    hook: { show: ["spud5"], hint: 0, what: "block C's sunset half (mid-film, no hook)" },
    cast, props, captions: c.captions, beats,
    allowClip: [{ who: "spud5", with: "seat5", from: 0, to: T.END, reason: "Spud sits on the fallen block" }, { who: "spud5", with: "spud5-lamp", from: 0, to: T.END, reason: "the headlamp band is worn on his head" }],
    notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-c/make-block-c.mjs (block C, sunset light).",
  });
}
