// ANCIENT ALIENS EP03 "Where did Atlantis go?", BLOCK C (story 1:42-2:34, TikTok part 3): clue 3 Bimini, the staircase.
// Panels 25-36 of ancient-aliens-03-sheet-3.png. Story: /mnt/project-files/videos/ancient-aliens/03-atlantis/STORY.md.
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/measure-lines.mjs   -> lines.json (spoken lengths)
//   python3 storyboards/series/ancient-aliens/03-atlantis/block-c/tools/page.py    -> assets/plates/at-c-page-1940.png
//   node storyboards/series/ancient-aliens/03-atlantis/block-c/make-block-c.mjs    -> aa03-c{1,2,3}-wide.json (+ --tall after Jonny's OK)
//
// THE LOOK (Jonny 15 Nov, "All 3D like Stonehenge"): every place Spud is in is real 3D built at the level of its painting
// (block C's own kinds: engine/page/props-at-c.js -> props-at-c-{bimini,air,road,step,port}.js). Only the 1940 page (no
// character) is a painted plate. THREE storyboards per frame, one light each (one set.lighting per storyboard, as EP02):
//   c1  0.0-22.0  AT_DAY   Bimini under water (hook), the 1940 page, Bimini from above, Spud on the first block
//   c2 22.0-25.8  AT_EVE   Atlantis's last evening: the edge road, the foreman counts heads (and Spud)
//   c3 25.8-52.0  AT_DAY   Bimini again (beachrock), the marble step + ruler (the staircase), Port Royal 1692 and its slide
// Emotion map (STORY.md): eerie (the page) -> excitement (the road) -> unease (the evening) -> deflation (beachrock) ->
// tension (the question) -> boredom (the ruler) -> shock (Port Royal) -> doubt ("that was one town").
// PART HOOK: the film's own first shot IS part 3's hook (STORY.md: "He named the year. Twenty-eight years early." over the
// road under clear water, "1940 -> 1968" up top), so the tall cut has no extra hook shot: H 0 in both frames and the tall
// takes the film's score slice (score(102)), whose 102 s cue is the part-3 hook bed.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, FAR, P, PLACE, hostSay, clueTag, atlantisClock, count, score, host, lampClip, CAST, AT_DAY, AT_EVE } from "../kit/at-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l.split(/\s+/).length * 0.42)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const T0 = 102;   // story time of block C's first frame

// ---------------------------------------------------------------- places (world x, z of each origin)
const AIR = PLACE(27), BIM = P.bimini, STEP = P.step, PORT = P.portroyal, PORT2 = PLACE(28), PAGE = P.page, ROAD = PLACE(26);
// the 1940 page plate (tools/page.py): 1536 x 1024 px, hung at the page place; cameras look straight at plate pixels
const PAGE_PX = [1536, 1024], PL = { src: "assets/plates/at-c-page-1940.png", z: r3(PAGE[1] - 2.2), center: [PAGE[0], 1.6], height: 3.2, depth: false, motion: false, dust: 0 };
const MARKS = { size: 22, pitch: 13.2, marks: [{ text: "1940", x: 968, y: 100 }, { text: "68", x: 577, y: 538 }, { text: "69", x: 682, y: 532 }] };
const pageCam = (cx, cy, vw, to, asp = 9 / 16) => {   // looks straight at plate pixel (cx, cy) with a window vw plate px wide; to: the same for a push
  const k = PL.height / PAGE_PX[1], one = (cx, cy, vw) => {
    const X = PAGE[0] + (cx - PAGE_PX[0] / 2) * k, Y = 1.6 - (cy - PAGE_PX[1] / 2) * k, dist = 3.4, vh = vw * k * asp;
    return { pos: [r3(X), r3(Y), r3(PL.z + dist)], look: [r3(X), r3(Y), PL.z], fov: r3(2 * Math.atan(vh / 2 / dist) * 180 / Math.PI) };
  };
  const a = one(cx, cy, vw);
  return to ? { ...a, to: one(...to), dur: to[3], ease: "inOut" } : a;
};
// a camera at a place: pos / look local to its origin o = [x, z] (y absolute); to: a second spot for a move
const at = (o, pos, look, fov, to, dur, ease = "inOut") => ({
  pos: [r3(o[0] + pos[0]), pos[1], r3(o[1] + pos[2])], look: [r3(o[0] + look[0]), look[1], r3(o[1] + look[2])], fov,
  ...(to && { to: { pos: [r3(o[0] + to.pos[0]), to.pos[1], r3(o[1] + to.pos[2])], ...(to.look && { look: [r3(o[0] + to.look[0]), to.look[1], r3(o[1] + to.look[2])] }), ...(to.fov && { fov: to.fov }) }, dur, ease }),
});

// the painters' cameras of the projected plates (props-at-c-plate-NN.js headers), local to the place, prop y as staged here;
// pix(C, col, row) = a look point (50 m out) through plate pixel (col, row): the tall frame pans inside the painting with it
const PCAM = {
  p27: { pos: [3.44, 7.51, 0], yaw: 1.99, pitch: -14.9, f: 1314, cx: 768, hy: 512 },
  p28: { pos: [2.44, 1.97, 7.47], yaw: 13.2, pitch: -7.4, f: 1700, cx: 768, hy: 512 },
  p29: { pos: [0, 0.71, 0], yaw: 24.672, pitch: 0, f: 1267, cx: 768, hy: 391 },
  p34: { pos: [0, 2, 0], yaw: -12, pitch: 0, f: 1000, cx: 768, hy: 470 },
  p35: { pos: [0, 2, 0], yaw: -38, pitch: -8, f: 1000, cx: 768, hy: 512 },
};
const pix = (C, col, row) => {
  const D = Math.PI / 180, a = C.pitch * D, b = C.yaw * D, x0 = (col - C.cx) / C.f, y0 = -(row - C.hy) / C.f, z0 = -1;
  const y1 = y0 * Math.cos(a) - z0 * Math.sin(a), z1 = y0 * Math.sin(a) + z0 * Math.cos(a);
  const x2 = x0 * Math.cos(b) + z1 * Math.sin(b), z2 = -x0 * Math.sin(b) + z1 * Math.cos(b), n = Math.hypot(x2, y1, z2);
  return [r3(C.pos[0] + (50 * x2) / n), r3(C.pos[1] + (50 * y1) / n), r3(C.pos[2] + (50 * z2) / n)];
};
// a tall camera at a painter's spot, panned to plate pixel (col, row), pushing from fov to fov2 over dur
const ptall = (o, C, col, row, fov, fov2, dur) => at(o, C.pos, pix(C, col, row), fov, { pos: C.pos, fov: fov2 }, dur);

// ---------------------------------------------------------------- the beats (block time; story time = T0 + t)
const T = { hook: 0, page: 3.6, isle: 8.8, page2: 11.5, air: 14.4, block: 20.0, past: 22.0, today: 25.8, stair: 30.7, ruler: 35.6, wait: 39.0, port: 41.3, slide: 44.6, closer: 48.8, END: 52.0 };
const SEGS = [
  { key: "c1", t0: 0, t1: T.past, light: AT_DAY, plate: true, far: FAR.other },
  { key: "c2", t0: T.past, t1: T.today, light: AT_EVE, far: FAR.other },
  { key: "c3", t0: T.today, t1: T.END, light: AT_DAY, far: FAR.other },
];

// ---------------------------------------------------------------- the place props (one set per storyboard)
const bimini = () => [
  // plate 28 painted in 3D (props-at-c-plate-28.js): the prop at y 4.9 puts block 0's top (Spud's floor) at world y 0, sea level 4.9
  { id: "p28", kind: "cplate", scene: "28", x: BIM[0], y: 4.9, z: BIM[1], hide: ["fish"], staged: "plate 28 painted in 3D: block 0 top y 0, sand -0.6, sea level 4.9" },
  { id: "pair", kind: "cplate", scene: "27", x: AIR[0], y: 0, z: AIR[1], staged: "plate 27 painted in 3D: Bimini from above, sea y 0, block tops -4.9" },
  { id: "fishA", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [1.2, 1.6, -2.5], r: 0.975 }, staged: "swimming" },
  { id: "fishB", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [-2.4, 1.3, -5.5], r: 1.2 }, staged: "swimming" },
  { id: "fishC", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [2.6, 1.9, -9], r: 1.35 }, staged: "swimming" },
  { id: "fishFace", kind: "fish", type: "striped", n: 1, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [-0.14, 0.75, 1.7], r: 0.03 }, range: 0.02, staged: "the fish that passes his face (30)" },
];
const step = () => [
  { id: "stepsky", kind: "biminisky", x: STEP[0], z: STEP[1], seed: 2, staged: "the sky dome" },
  { id: "stepsea", kind: "stepsea", x: STEP[0], z: STEP[1], staged: "the sea at y 0" },
  { id: "step", kind: "atstep", x: STEP[0], z: STEP[1], block: 0 },
  { id: "ruler", kind: "ruler", x: r3(STEP[0] + 0.25), z: r3(STEP[1] + 0.42), y: -0.55, water: 0.55, tint: "#ffffff" },
  { id: "coast", kind: "horizonland", x: STEP[0], z: STEP[1], coast: "island", az: -30, size: 2.4, staged: "the far coast" },
];
const port = () => [
  // plates 34 and 35 painted in 3D (props-at-c-plate-34.js): the boardwalk top y 0, the harbour -1.2, painter's camera (0, 2, 0) for both
  { id: "p34", kind: "cplate", scene: "34", x: PORT[0], y: 0, z: PORT[1], staged: "plate 34 painted in 3D: the boardwalk y 0" },
  { id: "p35", kind: "cplate", scene: "35", x: PORT2[0], y: 0, z: PORT2[1], quake: 0, sink: 0, staged: "plate 35 painted in 3D: the boardwalk y 0, the houses sink" },
];
const road = () => [
  { id: "proad", kind: "cplate", scene: "29", x: ROAD[0], y: 0, z: ROAD[1], staged: "plate 29 painted in 3D: road top y 0, sea -0.4, wall and gate 185-215 m" },
];
const SHAKES = [];   // camera shakes (block time; engine/page/timeline.js sb.fx "shake")
const inSegOf = (S, t) => t >= S.t0 && t < S.t1;
const CREW = [[-2.3, -7], [-2.1, -9.5], [-2.35, -12], [-2.15, -14.5]];   // the crew file toward the gate (road local)

function build(F, S) {
  SHAKES.length = 0;
  const H = 0;   // see the header: the film's first shot is part 3's hook
  const c = clip({ faces: "strong" }), { A, sfx, cap } = c;
  const inSeg = (t) => t >= S.t0 - 1e-6 && t < S.t1 - 1e-6;
  // every helper takes BLOCK time and writes only what falls inside this storyboard, shifted to its own clock
  const L = (t) => r3(t - S.t0 + H);
  const act = (t, who, what, o) => { if (inSeg(t)) A(L(t), who, what, o); };
  const prop = (t, id, set, dur = 0.01, ease = "linear") => { if (inSeg(t)) c.prop(L(t), id, set, dur, ease); };
  const fx = (t, s, o) => { if (inSeg(t)) sfx(L(t), s, o); };
  const text = (a, b, txt, pos, o) => { const a2 = Math.max(a, S.t0), b2 = Math.min(b, S.t1); if (b2 > a2 + 0.05) cap(L(a2), L(b2), txt, pos, false, { kinetic: false, ...o }); };
  const big = (a, b, txt, o = {}) => text(a, b, txt, o.pos ?? F.NUM + 80, { size: F.numSize, ...o });
  const say = (t, k, next) => {
    if (!inSeg(t)) return r3(t + DUR[k]);
    const hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(Math.min(next, S.t1) - t - DUR[k] - 0.05)));
    hostSay(c, F, L(t), "spud", LINES[k], DUR[k], toneOf(k), { hold });
    return r3(t + DUR[k]);
  };
  const look = (t, who, to, dur = 0.2) => act(t, who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => act(t, who, "expr", { expr: e, ...(set && { set }), dur });
  const arm = (t, who, side, pose, dur, ease) => act(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
  const turn = (t, who, to, dur = 0.4) => act(t, who, "turn", { to, dur, ease: "inOut" });
  const macro = (t, who, m, o) => { if (inSeg(t)) c.macro(L(t), who, m, o); };
  // a cut to a new spot: [x, z] world, y the floor he stands on (or floats at), yaw
  const place = (t, who, xz, y, yaw) => { if (!inSeg(t + 0.02)) return; const tt = Math.max(L(t - 0.02), 0); A(tt, who, "move", { to: xz, y, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(tt, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const W = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
  const OFF = W(BIM, 0, 40);   // Spud waits out of shot

  // ================================================================= 25 HOOK (0-3.6): the road under clear water, Spud floats above it
  // He drifts over the first blocks, looking down at them, then up at us on "Twenty-eight years early." Part 3's hook text up top.
  { const [fx0, fz0] = W(BIM, 0.2, 0.2); act(0, "spud", "fly", { to: { x: fx0, y: F.key === "tall" ? 0.75 : 1.35, z: fz0 }, dur: 3.4, ease: "inOut" }); }   // he drifts down over the road (feet tucked)
  look(0, "spud", [0, -0.7], 0.01); expr(0, "spud", "neutral", { brow: 0.5, lid: 0.2 }, 0.01);
  arm(0, "spud", "R", "out", 0.01); arm(0, "spud", "L", "out", 0.01);
  say(0.15, "c1", T.page);
  look(1.7, "spud", [0, 0.05], 0.35); expr(1.8, "spud", "neutral", { brow: 0.8, lid: 0.3 }, 0.3);
  big(0, T.page, "1940 → 1968", { x: Math.round(F.W * (F.key === "tall" ? 0.5 : 0.74)) });
  fx(0, "ai/underwater-amb", { gain: 0.3, dur: T.page, reason: "under clear water: the hush, small bubbles" });

  // ================================================================= 26 THE PAGE (3.6-8.8): 1940, typed and underlined
  place(T.page, "spud", OFF, 0, 0);
  say(T.page + 0.2, "c2a", T.isle);
  prop(T.page - 0.02, "marks", { type: 0, draw: 0 });
  prop(T.page + 1.75, "marks", { type: 0.25 }, 0.5);     // "nineteen forty": the date strikes
  prop(T.page + 2.6, "marks", { draw: 0.333 }, 0.6);     // and gets its red double line
  fx(T.page + 1.75, "typing", { gain: 0.3, dur: 0.5, reason: "a typewriter strikes 1-9-4-0" });
  // ================================================================= 27a NEAR BIMINI (8.8-11.5): the island from high above
  say(T.isle + 0.15, "c2b", T.page2);
  fx(T.isle, "ai/car-waves", { gain: 0.06, dur: r3(T.page2 - T.isle), reason: "the open shallows far below" });
  // ================================================================= 26b SIXTY-EIGHT, SIXTY-NINE (11.5-14.4): close on the line
  say(T.page2 + 0.15, "c2c", T.air);
  prop(T.page2 + 0.6, "marks", { type: 0.62 }, 0.3);     // "sixty-eight"
  prop(T.page2 + 1.6, "marks", { type: 1 }, 0.3);        // "sixty-nine"
  prop(T.page2 + 1.95, "marks", { draw: 1 }, 0.8);
  fx(T.page2 + 0.6, "typing", { gain: 0.3, dur: 0.3, reason: "6-8" }); fx(T.page2 + 1.6, "typing", { gain: 0.3, dur: 0.3, reason: "6-9" });
  // ================================================================= 27 THE ROAD FROM ABOVE (14.4-20.0): 1968, 800 m of square stones
  place(T.air, "spud", W(AIR, 2.4, -26), -0.45, 0);       // he floats at the surface beside the line, a dot from up here
  say(T.air + 0.2, "c3a", 17.4);
  big(T.air, T.air + 3.0, "1968");
  say(17.45, "c3b", T.block);
  if (inSeg(17.6)) count(c, F, L(17.6), L(19.3), L(T.block), 0, 800, (v) => `${Math.round(v / 10) * 10} m`, { pos: F.NUM + 80 });
  fx(T.air, "ai/car-waves", { gain: 0.07, dur: r3(T.block - T.air), reason: "the shallows from above" });
  // ================================================================= 28 ON THE FIRST BLOCK (20.0-22.0): his palm on the stone
  place(T.block, "spud", W(BIM, -0.5, 0.8), 0, 20);
  look(T.block, "spud", [0.1, -0.7], 0.01); expr(T.block, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.01);
  act(T.block + 0.4, "spud", "crouch", { to: 0.8, dur: 0.5 });
  arm(T.block + 0.5, "spud", "R", "out", 0.45, "out"); act(T.block + 0.5, "spud", "grip", { side: "R", shape: "flat", dur: 0.2 });
  fx(T.block, "ai/underwater-amb", { gain: 0.3, dur: 2.0, reason: "back under the water" });

  // ================================================================= 29 PAST, STORMY EVENING (22.0-25.8): the foreman counts heads, and Spud
  // The crew file past toward the gate; the foreman taps the air at each head, reaches Spud, counts him too; Spud's leaf perks.
  // plate 29 painted in 3D (props-at-c-plate-29.js): road top y 0, the road x -4.04..-0.44 along -z, painter's camera (0, 0.71, 0) yaw 24.67
  place(T.past, "spud", W(ROAD, -2.1, -3.8), 0, 30);
  place(T.past, "foreman", W(ROAD, -1.5, -5.0), 0, -100);
  CREW.forEach(([x, z], i) => {
    place(T.past, `crew${i}`, W(ROAD, x, z), 0, 180);
    act(T.past + 0.1, `crew${i}`, "move", { to: W(ROAD, x, z - 3.2), y: 0, dur: 3.6, ease: "linear" });
  });
  look(T.past, "spud", [0.5, 0.2], 0.01); expr(T.past, "spud", "neutral", { brow: 0.5 }, 0.01);
  say(T.past + 0.2, "c4", T.today);
  [[0.3, -0.05], [0.25, -0.02], [0.2, 0], [0.15, 0.02]].forEach(([x, y], i) => look(T.past + 0.3 + i * 0.45, "foreman", [x, y], 0.15));
  turn(T.past + 2.2, "foreman", -27, 0.35); look(T.past + 2.25, "foreman", [-0.6, -0.1], 0.2);   // ... and Spud
  arm(T.past + 2.3, "foreman", "R", "point", 0.3, "out"); act(T.past + 2.3, "foreman", "grip", { side: "R", shape: "point", dur: 0.2 });
  macro(T.past + 2.6, "spud", "react", { expr: "surprised" });
  look(T.past + 2.9, "spud", [0, 0.05], 0.2);                              // to us: he was counted
  fx(T.past, "ai/storm-wind", { gain: 0.35, dur: r3(T.today - T.past), reason: "the last evening: wind off the sea" });
  fx(T.past, "ai/car-waves", { gain: 0.3, dur: r3(T.today - T.past), reason: "waves wash over the road" });

  // ================================================================= 30 TODAY (25.8-30.7): beachrock, a fish passes his face
  place(T.today, "spud", W(BIM, -0.5, 0.8), 0, 15);
  look(T.today, "spud", [0, 0.05], 0.01); expr(T.today, "spud", "neutral", { brow: 0.35, lid: 0.5 }, 0.01);
  act(T.today + 0.1, "spud", "still", { dur: 4.6, idle: 0.1 });
  say(T.today + 0.2, "c5a", 29.1);
  say(29.15, "c5b", T.stair);
  expr(29.0, "spud", "neutral", { brow: 0.2, lid: 0.6, curve: -0.1 }, 0.25);
  fx(T.today, "ai/underwater-amb", { gain: 0.3, dur: r3(T.stair - T.today), reason: "under water again" });

  // ================================================================= 31 THE STAIRCASE (30.7-35.6): can a whole city sink in one day?
  place(T.stair, "spud", W(STEP, -0.55, -0.3), 0.3, 0);
  prop(T.stair - 0.02, "step", { block: 0 });
  look(T.stair, "spud", [0.5, 0.05], 0.01); look(T.stair + 0.6, "spud", [-0.5, 0.05], 0.6); look(32.5, "spud", [0, 0.05], 0.25);
  say(T.stair + 0.2, "c6a", 32.7);
  say(32.7, "c6b", T.ruler);
  expr(32.8, "spud", "neutral", { brow: 0.9, lid: 0.2 }, 0.2);
  big(T.stair + 0.2, T.ruler, "24 h ?");
  fx(T.stair, "ai/car-waves", { gain: 0.1, dur: r3(T.port - T.stair), reason: "a calm sea lapping on marble" });
  // ================================================================= 32 THE RULER (35.6-39.0): 3 mm a year
  place(T.ruler, "spud", W(STEP, -0.6, 0.9), -0.55, 10);
  prop(T.ruler - 0.02, "step", { block: 1 });
  look(T.ruler, "spud", [0.6, 0.1], 0.01); expr(T.ruler, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.01);
  say(T.ruler + 0.2, "c7a", T.wait);
  big(T.ruler + 1.0, T.wait, "3 mm / YEAR");
  // ================================================================= 33 HE WAITS (39.0-41.3): in one day? nothing.
  place(T.wait, "spud", W(STEP, -0.5, -0.7), 0.3, 0);
  act(T.wait - 0.02, "spud", "sit", { rot: 0, height: 0.3, dur: 0.01, hands: "lap" });
  look(T.wait, "spud", [0.6, 0], 0.01); expr(T.wait, "spud", "neutral", { brow: 0.3, lid: 0.55 }, 0.01);
  say(T.wait, "c7b", 40.3);
  look(39.9, "spud", [0, 0.05], 0.3);
  say(40.35, "c7c", T.port);
  big(T.wait + 0.1, T.port, "1 DAY: 0.008 mm", { size: F.key === "tall" ? 86 : F.numSize });

  // ================================================================= 34 PORT ROYAL 1692 (41.3-44.6): a whole harbour town, then the ground shakes
  place(T.port, "spud", W(PORT, -0.15, -5.2), 0, 8); act(T.port - 0.02, "spud", "stand", { dur: 0.01 });   // off the step he sat on
  look(T.port, "spud", [-0.4, 0.2], 0.01); look(T.port + 0.6, "spud", [0.4, 0.2], 0.6);
  say(T.port + 0.2, "c8a", 42.6);
  say(42.65, "c8b", 47.0);
  big(42.65, T.slide, "1692");
  SHAKES.push({ do: "shake", at: 43.6, dur: 1.0, amp: 0.03 });
  macro(43.7, "spud", "react", { expr: "surprised", big: true });
  fx(43.6, "rumble", { gain: 0.6, dur: 4.5, reason: "the earthquake: a deep rumble under the town" });
  fx(T.port, "ai/car-waves", { gain: 0.1, dur: r3(T.slide - T.port), reason: "the harbour" });
  // ================================================================= 35 THE SLIDE (44.6-48.8): two thirds of the town into the sea, he runs
  place(T.slide, "spud", W(PORT2, 1.3, -4.5), 0, -18);
  look(T.slide - 0.1, "spud", [-0.3, 0], 0.1); act(T.slide + 0.05, "spud", "move", { to: W(PORT2, 1.15, -3.9), y: 0, dur: 1.5 });
  prop(T.slide - 0.02, "p35", { sink: 0, quake: 0 }, 0); prop(T.slide, "p35", { quake: 1 }, 0.2, "out"); prop(T.slide + 0.2, "p35", { sink: 1 }, 1.5, "in"); SHAKES.push({ do: "shake", at: T.slide, dur: 1.8, amp: 0.04 });
  prop(46.5, "p35", { quake: 0 }, 1.2, "inOut");
  big(47.0, T.closer, "2 MIN");
  fx(T.slide + 0.2, "ai/water-gush", { gain: 0.6, reason: "the town slides into the harbour" });
  fx(T.slide + 0.4, "ai/branch-snap", { gain: 0.4, reason: "timber houses break" });
  say(47.0, "c8c", T.closer);
  // ================================================================= 36 CLOSER (48.8-52.0): he nods slowly, one finger up
  place(T.closer, "spud", W(STEP, -0.55, -0.3), 0.3, 0);
  prop(T.closer - 0.02, "step", { block: 0 });
  look(T.closer, "spud", [0, 0.05], 0.01); expr(T.closer, "spud", "neutral", { brow: 0.5, lid: 0.7 }, 0.01);
  say(49.0, "c9a", 49.9);
  macro(49.1, "spud", "nod", { times: 2 });
  arm(49.9, "spud", "R", "up", 0.35, "out"); act(49.9, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
  say(49.9, "c9b");
  expr(50.0, "spud", "neutral", { brow: 0.85, lid: 0.25 }, 0.2);
  act(r3(T.END - 0.6), "spud", "noblink", { dur: 0.55 });

  // the clock (top right) except over the page; the clue tag from the page on
  for (const [a, b] of [[0, T.page], [T.isle, T.page2], [T.air, T.END]]) {
    const a2 = Math.max(a, S.t0), b2 = Math.min(b, S.t1);
    if (b2 > a2 + 0.05) atlantisClock(c, F, T0 + S.t0 - H, L(a2), L(b2));
  }
  { const a2 = Math.max(T.page, S.t0); if (S.t1 > a2) clueTag(c, F, L(a2), L(S.t1), 3); }

  // ---------------------------------------------------------------- shots (a push or a move on every one)
  const TALL = F.key === "tall", two = (w, t) => (TALL ? t : w), d = (a, b) => r3(b - a);
  const SHOTS = [
    ["25 the road under water (part 3 hook)", T.hook, two(at(BIM, [2.44, 1.97, 7.47], [-8.88, -1.9, -40.8], 28.6, { pos: [2.0, 1.8, 6.9], fov: 22 }, T.page), ptall(BIM, PCAM.p28, 680, 395, 31, 26, T.page)), "hook"],
    ["26 the 1940 page", T.page, two(pageCam(760, 380, 1150, [880, 300, 760, d(T.page, T.isle)]), pageCam(900, 330, 520, [968, 220, 380, d(T.page, T.isle)], 16 / 9))],
    ["27a near Bimini, from high above", T.isle, two(at(AIR, [3.44, 7.51, 0], [1.74, -2.37, -48.96], 36.4, { pos: [3.3, 7.35, -1.0], fov: 34 }, d(T.isle, T.page2)), ptall(AIR, PCAM.p27, 600, 512, 42, 38, d(T.isle, T.page2)))],
    ["26b '68 and '69", T.page2, two(pageCam(640, 520, 420, [640, 525, 340, d(T.page2, T.air)]), pageCam(630, 530, 420, [630, 532, 330, d(T.page2, T.air)], 16 / 9))],
    ["27 the road from above", T.air, two(at(AIR, [3.44, 7.51, 0], [1.8, -8.77, -47.25], 36.4, { pos: [3.2, 7.3, -1.0], fov: 27 }, d(T.air, T.block)), ptall(AIR, PCAM.p27, 560, 600, 36, 30, d(T.air, T.block)))],
    ["28 his palm on the first block", T.block, two(at(BIM, [2.44, 1.97, 7.47], [-0.5, 0.4, 0.8], 13, { pos: [2.2, 1.85, 7.0], fov: 11 }, d(T.block, T.past)), at(BIM, [2.44, 1.97, 7.47], [-0.5, 0.45, 0.8], 22, { pos: [2.2, 1.85, 7.0], fov: 19 }, d(T.block, T.past)))],
    ["29 Atlantis, the last evening", T.past, two(at(ROAD, [0, 0.71, 0], [-20.9, -4.4, -45.4], 37.7, { pos: [-0.25, 0.71, -0.55], fov: 35 }, d(T.past, T.today)), ptall(ROAD, PCAM.p29, 795, 470, 44, 41, d(T.past, T.today)))],
    ["30 natural beachrock", T.today, two(at(BIM, [2.0, 1.9, 7.2], [-0.5, 0.75, 0.8], 15, { pos: [1.85, 1.85, 6.9], fov: 13 }, d(T.today, T.stair)), at(BIM, [2.0, 1.9, 7.2], [-0.5, 0.75, 0.8], 26, { pos: [1.85, 1.85, 6.9], fov: 23 }, d(T.today, T.stair)))],
    ["31 the staircase", T.stair, two(at(STEP, [0.6, 1.15, 6.5], [0, 0.85, -20], 38, { pos: [0.5, 1.1, 5.6] }, d(T.stair, T.ruler)), at(STEP, [0.6, 1.15, 6.5], [-0.15, 0.95, -10], 55, { pos: [0.5, 1.1, 5.6] }, d(T.stair, T.ruler)))],
    ["32 the ruler", T.ruler, two(at(STEP, [-0.2, 0.2, 2.6], [-0.1, 0.22, 0.4], 38, { pos: [-0.15, 0.2, 2.35] }, d(T.ruler, T.wait)), at(STEP, [-0.2, 0.2, 2.6], [-0.25, 0.3, 0.4], 60, { pos: [-0.15, 0.2, 2.35] }, d(T.ruler, T.wait)))],
    ["33 he waits", T.wait, two(at(STEP, [0.3, 0.8, 3.2], [0.0, 0.85, -0.8], 34, { pos: [0.3, 0.8, 3.05] }, d(T.wait, T.port)), at(STEP, [0.3, 0.8, 3.2], [-0.3, 0.85, -0.8], 55, { pos: [0.3, 0.8, 3.05] }, d(T.wait, T.port)))],
    ["34 Port Royal 1692", T.port, two(at(PORT, [0, 2, 0], [10.4, -2.5, -48.9], 46.7, { pos: [0.15, 1.95, -0.5], fov: 41 }, d(T.port, T.slide)), ptall(PORT, PCAM.p34, 560, 512, 52, 46, d(T.port, T.slide)))],
    ["35 two thirds into the sea", T.slide, two(at(PORT2, [0, 2, 0], [30.5, -5.0, -39.0], 46.7, { pos: [0.25, 1.95, -0.35], fov: 43 }, d(T.slide, T.closer)), ptall(PORT2, PCAM.p35, 450, 512, 52, 48, d(T.slide, T.closer)))],
    ["36 closer, but one town", T.closer, two(at(STEP, [0.3, 1.0, 3.0], [0, 0.95, -10], 34, { pos: [0.3, 1.0, 2.6] }, d(T.closer, T.END)), at(STEP, [0.3, 1.0, 3.0], [-1.3, 0.95, -6], 58, { pos: [0.3, 1.0, 2.6] }, d(T.closer, T.END)))],
  ];
  const mine = SHOTS.filter(([, t], i) => (SHOTS[i + 1]?.[1] ?? T.END) > S.t0 + 1e-6 && t < S.t1 - 1e-6).map(([n, t, s, k]) => [n, L(Math.max(t, S.t0)), s, k]);
  const beats = c.beats(mine, L(S.t1));

  // ---------------------------------------------------------------- cast + props of this storyboard
  const first = { c1: { at: W(BIM, 0.3, 1.4), y: F.key === "tall" ? 0.95 : 1.5, face: 0 }, c2: { at: W(ROAD, -2.1, -3.8), y: 0, face: 30 }, c3: { at: W(BIM, -0.5, 0.8), y: 0, face: 15 } }[S.key];
  const cast = [{ id: "spud", character: CAST.spud, at: first.at, y: first.y, face: first.face, expr: "neutral", follow: 0.2, seed: 2.1 }];
  if (S.key === "c2") {
    cast.push({ id: "foreman", character: CAST.foreman, at: W(ROAD, -1.5, -5.0), y: 0, face: -100, expr: "neutral", follow: 0.3, seed: 4.2 });
    CREW.forEach(([x, z], i) => cast.push({ id: `crew${i}`, character: CAST.crew, at: W(ROAD, x, z), y: 0, face: 180, expr: "neutral", seed: 5 + i }));
  }
  const lamp = S.key === "c2" ? 0 : 1;   // the headlamp burns under water; in the past it is off
  const props = [host("spud", lamp)];
  if (S.key === "c1") props.push(...bimini(), { id: "marks", kind: "pagemarks", plate: PL, x: 0, y: 0, z: 0, ...MARKS, type: 0, draw: 0, staged: "typed marks on the hung 1940 page plate" });
  if (S.key === "c2") props.push(...road());
  if (S.key === "c3") props.push(...bimini(), ...step(), ...port());

  const set = { ...S.light, floor: "none", ...(S.plate && { plate: PL }) };
  return {
    title: `Where did Atlantis go? (block C, ${S.key})`,
    idea: "Ancient aliens EP03 block C (1:42-2:34): clue 3, Bimini: a straight road of giant square stones under clear water; a 1940 psychic named 1968; the road found in 1968, 800 m; in Atlantis it was evening (the foreman counts Spud in); 'natural beachrock'; the staircase: can a whole city sink in one day? The sea: 3 mm a year, nothing. An earthquake: Port Royal 1692, two thirds in two minutes. Closer, but one town.",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: S.key === "c1", motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set, music: score(T0 + S.t0), ...(SHAKES.some((f) => inSegOf(S, f.at)) && { fx: SHAKES.filter((f) => inSegOf(S, f.at)).map((f) => ({ ...f, at: r3(f.at - S.t0) })) }),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true },
    ...(S.key === "c1" && { hook: { show: ["spud"], hint: 0, what: "Bimini: a dead-straight line of giant square stones under clear turquoise water, Spud floating above them; 1940 -> 1968 up top" } }),
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [...lampClip(["spud"], L(S.t1)), ...["stepsky"].filter((id) => props.some((q) => q.id === id)).map((id) => ({ who: "spud", with: id, from: 0, to: L(S.t1), checks: ["shell"], reason: "shell: the sky dome rides with the camera and is drawn behind everything (lookOnly)" }))],
    notes: `Generated by storyboards/series/ancient-aliens/03-atlantis/block-c/make-block-c.mjs. Block C, storyboard ${S.key} of three (block time ${S.t0}-${S.t1} s, story ${T0 + S.t0}-${T0 + S.t1} s). Music = the EP03 score from story ${T0 + S.t0} s.`,
  };
}

const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
for (const F of FRAMES) for (const S of SEGS) write(import.meta.url, { id: `aa03-${S.key}-${F.key}`, ...F.sb(S.far), ...build(F, S) });
