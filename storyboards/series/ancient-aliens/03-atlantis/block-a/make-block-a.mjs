// ANCIENT ALIENS EP03 "Where did Atlantis go?", BLOCK A (story 0:00-0:50, TikTok part 1): hook, contract, clue 1 the plan.
// Panels 01-12 of ancient-aliens-03-sheet-1.png. Story: /mnt/project-files/videos/ancient-aliens/03-atlantis/STORY.md.
//   node storyboards/series/ancient-aliens/03-atlantis/block-a/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/03-atlantis/block-a/make-block-a.mjs    -> aa03-a-wide.json (+ --tall after Jonny's OK)
//
// THE LOOK (Jonny 15 Nov: "much love to the detail"; then "All 3D like Stonehenge" after v1 put Spud on flat paintings): every
// place is REAL 3D at the level of its painting (round R: the approved plate projected from its painter's camera onto true-depth
// pieces: quays, walls, towers, water, the city; the sea, the rock and the horizon as 3D). Each place stands on its own spot of the
// 20 km grid; one storyboard, the camera cuts between them, Spud is moved to his spot on each cut. Pushes are by fov (free) or
// under a metre (the projection holds about 0.5-1.5 m).
// Emotion map (STORY.md): awe 0-9 s, loss at the snap, promise at the scroll, wonder at scale 22-45, doubt then surprise at the end.
// Opener A (the city is there at frame 0). Part 1's hook = the film's first 2 s: "A whole island. Gone in one day." + "24 h".
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, FAR, P, PLACE, AT_DAWN, plateCam, hostSay, clueTag, atlantisClock, count, score, partScore, hookOf, host, lampClip, CAST } from "../kit/at-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const ROOT = new URL("../../../../../", import.meta.url);
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l.split(/\s+/).length * 0.42)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };

function build(F) {
  const H = hookOf(F, "a"), T0 = 0;
  const c = clip({ faces: "strong" }), { A, sfx, cap } = c;
  const PR = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t + H), id, set, dur, ease);
  // places (BOARD section 1 grid; block B owns 25, C 26-29, D 30-35): block A's painted 3D scenes
  const Q01 = PLACE(12), W02 = PLACE(13), Q04 = PLACE(14), CUT = P.canal, SUEZ = PLACE(15), W11 = PLACE(16), CITY = P.city, ROCK = P.gibraltar;
  const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
  const place = (t, who, xz, yaw, y = 0) => { A(r3(t - 0.02), who, "move", { to: xz, y, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const say = (t, k, next) => { const hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - DUR[k] - 0.05))); hostSay(c, F, r3(t), "spud", LINES[k], DUR[k], toneOf(k), { hold }); return r3(t + DUR[k]); };
  const OFF = PLACE(23);   // Spud waits out of sight on an empty spot of the grid when he is not in a shot

  // ---------------------------------------------------------------- the beats (video s = story s)
  const T = { s01: 0, s02: 2.6, s03: 4.7, s04: 8.9, snap: 10.7, s06: 13.4, s07: 21.4, s08: 26.0, s09: 29.0, s10: 31.8, s11: 35.3, s12: 41.9, END: 50.0 };
  const END = T.END;
  const set = { ...AT_DAWN };

  // ---------------------------------------------------------------- cast + props
  const cast = [{ id: "spud", character: CAST.spud, at: at(Q01, -0.7, 1.0), face: 15, expr: "neutral", follow: 0.2, seed: 2.1 }];
  const ROCKSEA = { grade: "gibraltar", sunAz: 35, sunEl: 8, horizon: true, reach: 1700, calm: [0, 0, 3.0, 0.7], foam: [[0, 0, 2.2, 0.8], [1.9, 0.2, 1.7, 1, 2.5, 0.92], [-1.5, 0.7, 1.2, 0.7, 2.5, 0.3]], patches: [[3.2, 0.5, 3.0, "#123f40", 0.8, 1]] };
  const props = [
    host("spud", 0),
    // 01 the harbour at dawn (quay top at y 0), 02/10 the red-gold wall, 04 the near quay before the far city's own plate 04
    { id: "quay01", kind: "harbourquay", x: Q01[0], z: Q01[1], plate: "01", y: -1.4, staged: "plate 01 in 3D: Spud on the quay" },
    { id: "wall02", kind: "citywall", x: W02[0], z: W02[1], plate: "02", flash: 0, staged: "plate 02 in 3D: the flash runs along the red-gold wall" },
    { id: "far04", kind: "atlantisplate", x: Q04[0], z: r3(Q04[1] - 2598.5), y: -3.32, view: "harbour", staged: "plate 04's far city" },
    { id: "quay04", kind: "harbourquay", x: Q04[0], z: Q04[1], plate: "04", far: false, y: -1.2, staged: "plate 04's near quay, Spud on it" },
    // 03/07 the ring city from above (plate 03 projected), 08/09 the cut-aways at 1:20, 11 the three walls
    { id: "city", kind: "atlantis", x: CITY[0], z: CITY[1], light: "dawn", proj: "plate03" },
    { id: "citysky", kind: "citysky", x: CITY[0], z: CITY[1], light: "dawn" },
    { id: "cut08", kind: "canalcut", x: CUT[0], z: CUT[1], plate: true, scale: 0.05, y: r3(-8.38 * 0.05) },
    { id: "cut09", kind: "canalcut", x: SUEZ[0], z: SUEZ[1], plate: true, modern: true, scale: 0.05, y: r3(-3.46 * 0.05) },
    { id: "wall11", kind: "citywall", x: W11[0], z: W11[1], plate: "11", flash: 0 },
    // 05/06/12 today: the rock off Gibraltar
    { id: "rocksky", kind: "shsky", x: ROCK[0], z: ROCK[1], time: "a", sunAz: 35, sunEl: 8, reach: 1600 },
    { id: "rocksea", kind: "sea", x: ROCK[0], z: ROCK[1], ...ROCKSEA, staged: "the sea surface at y 0 (no set floor here)" },
    { id: "rockland", kind: "horizonland", x: ROCK[0], z: ROCK[1], coast: "gibraltar" },
    { id: "rock", kind: "seastack", x: ROCK[0], z: ROCK[1], shade: [0.1, 0.15, 0.4], staged: "the sea rock stands in the sea (no set floor here)" },
    { id: "gulls", kind: "seagulls", x: ROCK[0], z: ROCK[1], n: 3, centre: [9, 7.2, -22], r: 8 },
    { id: "scroll06", kind: "scroll", x: r3(ROCK[0] + 0.3), y: -60, z: r3(ROCK[1] + 0.2), rot: -14, open: 0, staged: "Plato's plan on the flat of the rock" },
  ];

  // ================================================================= 01-02 HOOK (0-4.7): the ring city at dawn, the wall flashes
  // he stands on the quay, three-quarter to us, the city behind; the line at frame 0 (part 1's hook)
  look(0, "spud", [0.15, 0.05], 0.01); expr(0, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.01);
  say(0.15, "l1", T.s02 + 0.2);
  A(1.6, "spud", "turn", { to: 160, dur: 0.6, ease: "inOut" });          // he turns to look at the city
  look(1.7, "spud", [0.3, 0.35], 0.3);
  cap(r3(0 + H), r3(4.6 + H), "24 h", F.NUM + 80, false, { size: F.numSize, kinetic: false });
  place(T.s02, "spud", OFF, 0);
  PR(T.s02 + 0.3, "wall02", { flash: 1 }, 1.4, "inOut"); PR(T.s03 - 0.02, "wall02", { flash: 0 });

  // ================================================================= 03 THE RINGS (4.7-8.9): from high above
  say(T.s03 + 0.2, "l2", T.s04);

  // ================================================================= 04-05 SNAP (8.9-13.4): the harbour wall, then the same frame today
  place(T.s04, "spud", at(Q04, 0.35, 0.65), 20); look(T.s04, "spud", [0.3, 0.2], 0.01); expr(T.s04, "spud", "neutral", { brow: 0.4 }, 0.01);
  c.arm(T.s04 + 0.4, "spud", "R", "point", 0.35, "out"); A(T.s04 + 0.4, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
  // the snap: same pose, the city is gone (today: the rock off Gibraltar); he lowers the arm slowly
  place(T.snap, "spud", at(ROCK, 0.1, 0.15), 20, 1.2);
  sfx(T.snap, "ai/car-waves", { gain: 0.45, dur: 2.8, reason: "today: empty sea breaking on the rock" });
  c.arm(T.snap + 0.9, "spud", "R", "rest", 0.6, "inOut");
  look(T.snap + 0.8, "spud", [0, 0.05], 0.3); expr(T.snap + 0.9, "spud", "neutral", { brow: 0.75, lid: 0.35 }, 0.3);
  say(T.snap + 0.25, "l3", T.s06);

  // ================================================================= 06 THE CONTRACT (13.4-21.4): the scroll, four clues, by midnight
  place(T.s06, "spud", at(ROCK, -0.42, -0.05), 20, 1.2); look(T.s06, "spud", [0.25, -0.4], 0.01);
  PR(T.s06 - 0.02, "scroll06", { y: 1.2 }); PR(T.s06 + 0.3, "scroll06", { open: 1 }, 0.6, "out"); PR(T.s07 - 0.02, "scroll06", { y: -60 });
  const l4a = say(T.s06 + 0.4, "l4a", 17.4);
  look(l4a - 0.6, "spud", [0, 0.05], 0.25);
  // four clues: he holds up his hand (four fingers), the clock punches in
  c.arm(17.3, "spud", "R", "out", 0.3, "out"); A(17.3, "spud", "grip", { side: "R", shape: "open", dur: 0.2 });
  say(17.4, "l4b", 18.5);
  cap(r3(17.45 + H), r3(18.6 + H), "4", F.NUM, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * 0.74) });
  c.arm(18.6, "spud", "R", "rest", 0.4, "inOut");
  say(18.6, "l4c", T.s07);
  expr(19.0, "spud", "neutral", { brow: 0.85, lid: 0.3 }, 0.25);

  // ================================================================= 07 CLUE 1 (21.4-27.6): the plan, ring by ring, about 5 km
  place(T.s07, "spud", OFF, 0);
  say(T.s07 + 0.2, "l5", T.s08);
  count(c, F, r3(T.s07 + 2.6 + H), r3(T.s07 + 4.2 + H), r3(T.s08 + H), 0, 5, (v) => `${Math.round(v)} km`);

  // ================================================================= 08-09 THE CANAL (27.6-35.4): 30 m, deeper than Suez (24 m)
  const l6a = say(T.s08 + 0.3, "l6a", T.s09);
  count(c, F, r3(T.s08 + 0.6 + H), r3(T.s08 + 2.4 + H), r3(T.s09 + H), 0, 30, (v) => `${Math.round(v)} m`);
  say(T.s09 + 0.2, "l6b", T.s10);
  cap(r3(T.s09 + H), r3(T.s10 + H), "30 m", F.NUM + 150, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * 0.22) });
  cap(r3(T.s09 + 0.4 + H), r3(T.s10 + H), "SUEZ 24 m", F.NUM, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * 0.72) });
  sfx(T.s08, "ai/underwater-amb", { gain: 0.25, dur: r3(T.s10 - T.s08), reason: "the cut-away: water pressing on the stone" });

  // ================================================================= 10-11 THE WALLS (35.4-44.4): white, black, red; brass, tin, red metal
  place(T.s10, "spud", at(W02, 8.2, 0.95), 125); look(T.s10, "spud", [0, 0.2], 0.01); PR(T.s10 + 1.0, "wall02", { flash: 1 }, 1.6, "inOut"); PR(T.s11 - 0.02, "wall02", { flash: 0 });
  c.arm(T.s10 + 0.5, "spud", "R", "out", 0.4, "out");                     // his palm out to the bare stone
  say(T.s10 + 0.3, "l7a", T.s11);
  place(T.s11, "spud", OFF, 0);
  say(T.s11 + 0.2, "l7b", T.s12); PR(T.s11 + 2.5, "wall11", { flash: 1 }, 1.5, "inOut");

  // ================================================================= 12 THE TURN (44.4-50): he looks down into the dark water
  place(T.s12, "spud", at(ROCK, 0.3, 0.2), 55, 1.2); look(T.s12, "spud", [0.1, -0.6], 0.01); expr(T.s12, "spud", "neutral", { brow: 0.6, lid: 0.45 }, 0.01);
  say(T.s12 + 0.3, "l8a", 47.4);
  look(47.2, "spud", [0, 0.05], 0.25); expr(47.3, "spud", "surprised", { open: 0.15 }, 0.2);
  say(47.4, "l8b");
  A(r3(END - 0.6), "spud", "noblink", { dur: 0.6 });

  // the clock (24:00 from frame 0), the clue tag, gulls and sea under the outdoor shots (far under the voice)
  atlantisClock(c, F, T0 - H, 0, r3(END + H));
  clueTag(c, F, r3(T.s07 + H), r3(END + H), 1);
  for (const [a, b] of [[0, T.s03], [T.s04, T.s07], [T.s12, END]]) sfx(a, "ai/car-waves", { gain: 0.08, dur: r3(b - a), reason: "the sea under the shot" });

  // ---------------------------------------------------------------- shots (a push or a move on every one)
  const PC = (o, key, a, b, dur, x = {}) => ({ ...plateCam(o, key, { ...x, ...a }), to: plateCam(o, key, { ...x, ...b }), dur: r3(dur), ease: "inOut" });
  const W = (o, p, l, f, near) => ({ pos: [r3(o[0] + p[0]), p[1], r3(o[1] + p[2])], look: [r3(o[0] + l[0]), l[1], r3(o[1] + l[2])], fov: f, ...(near && { near }) });
  const AIR = (p, l, p2, dur) => ({ ...W(CITY, p, l, 51.5, 20), to: { pos: [r3(CITY[0] + p2[0]), p2[1], r3(CITY[1] + p2[2])] }, dur: r3(dur), ease: "inOut" });
  const SHOTS = [
    ["01 the ring city at dawn", T.s01, PC(Q01, "01", { k: 1 }, { k: 0.93 }, T.s02, { y0: -1.4, row: 516 }), "hook"],
    ["02 the red wall flashes", T.s02, PC(W02, "02", { col: 730 }, { col: 800, k: 0.95 }, T.s03 - T.s02)],
    ["03 the rings from above", T.s03, AIR([0, 1200, 3640], [0, -537, 37], [0, 1160, 3480], T.s04 - T.s03)],
    ["04 the harbour wall", T.s04, PC(Q04, "04f", { k: 1 }, { k: 0.95 }, T.snap - T.s04, { y0: -1.2, row: 540 })],
    ["05 today", T.snap, { ...W(ROCK, [1.6, 2.45, 4.6], [-4.6, -3.3, -34.5], 40), to: { pos: [r3(ROCK[0] + 1.5), 2.4, r3(ROCK[1] + 4.2)] }, dur: r3(T.s06 - T.snap), ease: "inOut" }, "reveal"],
    ["06 the scroll", T.s06, { ...W(ROCK, [1.2, 2.05, 3.6], [-0.1, 1.45, 0.0], 40), to: W(ROCK, [1.15, 2.0, 3.3], [-0.1, 1.45, 0.0], 38), dur: r3(T.s07 - T.s06), ease: "inOut" }],
    ["07 clue one: the plan", T.s07, AIR([-240, 1180, 3560], [0, -537, 37], [-120, 1120, 3360], T.s08 - T.s07)],
    ["08 the canal cut-away", T.s08, PC(CUT, "08", { k: 1.185 }, { k: 1.08 }, T.s09 - T.s08, { y0: r3(-8.38 * 0.05), sc: 0.05, row: 462 })],
    ["09 deeper than Suez", T.s09, PC(SUEZ, "09", { k: 1.185 }, { k: 1.09 }, T.s10 - T.s09, { y0: r3(-3.46 * 0.05), sc: 0.05, row: 480 })],
    ["10 the bare stone", T.s10, { ...W(W02, [10.2, 1.05, 3.4], [7.2, 1.1, 0.4], 40), to: W(W02, [10.0, 1.05, 3.1], [7.2, 1.1, 0.4], 38), dur: r3(T.s11 - T.s10), ease: "inOut" }],
    ["11 brass, tin, red", T.s11, PC(W11, "11", { k: 1 }, { k: 0.9 }, T.s12 - T.s11)],
    ["12 the dark water", T.s12, { ...W(ROCK, [1.9, 2.75, 4.6], [1.45, 1.3, 0], 42), to: W(ROCK, [1.9, 2.75, 4.6], [1.45, 1.3, 0], 38), dur: r3(END - T.s12), ease: "inOut" }],
  ];
  const beats = c.beats(SHOTS.map(([n, t, s, k]) => [n, r3(t + H), s, k]), r3(END + H));

  return {
    title: "Where did Atlantis go? (block A)",
    idea: "Ancient aliens EP03 block A (0:00-0:50): the ring city at dawn, 'a whole island, gone in one day'; the wall flashes; the rings from above; snap to today's empty sea; Plato's scroll and the contract (four clues, by midnight); clue 1: the plan, the canal 30 m deep (Suez 24 m), the walls of white, black and red stone, brass, tin and a red metal; 'nobody has found one stone... they found the metal'",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set, music: H ? partScore("a") : score(T0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true },
    hook: { show: ["spud"], hint: 0, what: "Atlantis at dawn: Spud on the harbour quay, the ring city and its walls behind him; 24 h on screen" },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [...lampClip(["spud"], r3(END + H)), { who: "spud", with: "gulls", from: 0, to: r3(END + H), reason: "the gulls wheel 20 m out over the sea; their volume spans the rock" }],
    notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-a/make-block-a.mjs. Block A of four; music = the EP03 score's first 50 s (kit score(0)). Places: real 3D at the paintings' level (round R kit).",
  };
}

const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
for (const F of FRAMES) write(import.meta.url, { id: `aa03-a-${F.key}`, ...F.sb(FAR.city), ...build(F) });
