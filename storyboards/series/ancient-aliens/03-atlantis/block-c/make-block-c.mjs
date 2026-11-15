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
const BIM = P.bimini, STEP = P.step, PORT = P.portroyal, PAGE = P.page, ROAD = PLACE(26);
// the 1940 page plate (tools/page.py): 1536 x 1024 px, hung at the page place; cameras look straight at plate pixels
const PAGE_PX = [1536, 1024], PL = { src: "assets/plates/at-c-page-1940.png", z: r3(PAGE[1] - 2.2), center: [PAGE[0], 1.6], height: 3.2, depth: false, motion: false, dust: 0 };
const MARKS = { size: 22, pitch: 13.2, marks: [{ text: "1940", x: 968, y: 100 }, { text: "68", x: 577, y: 538 }, { text: "69", x: 682, y: 532 }] };
const pageCam = (cx, cy, vw, to) => {   // looks straight at plate pixel (cx, cy) with a window vw plate px wide; to: the same for a push
  const k = PL.height / PAGE_PX[1], one = (cx, cy, vw) => {
    const X = PAGE[0] + (cx - PAGE_PX[0] / 2) * k, Y = 1.6 - (cy - PAGE_PX[1] / 2) * k, dist = 3.4, vh = vw * k * 9 / 16;
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

// ---------------------------------------------------------------- the beats (block time; story time = T0 + t)
const T = { hook: 0, page: 3.6, isle: 8.8, page2: 11.5, air: 14.4, block: 20.0, past: 22.0, today: 25.8, stair: 30.7, ruler: 35.6, wait: 39.0, port: 41.3, slide: 44.6, closer: 48.8, END: 52.0 };
const SEGS = [
  { key: "c1", t0: 0, t1: T.past, light: AT_DAY, plate: true, far: FAR.other },
  { key: "c2", t0: T.past, t1: T.today, light: AT_EVE, far: FAR.other },
  { key: "c3", t0: T.today, t1: T.END, light: AT_DAY, far: FAR.other },
];

// ---------------------------------------------------------------- the place props (one set per storyboard)
const bimini = () => [
  { id: "bed", kind: "biminibed", x: BIM[0], z: BIM[1], reef: true },
  { id: "road", kind: "biminiroad", x: BIM[0], z: BIM[1], contacts: [[-0.5, 0.8, 0.3]] },
  { id: "bsea", kind: "biminisea", x: BIM[0], z: BIM[1], clarity: 2, scatter: 0.55, net: 0.9, staged: "the sea surface at y 0" },
  { id: "bsky", kind: "biminisky", x: BIM[0], z: BIM[1], seed: 1, staged: "the sky dome" },
  { id: "isle", kind: "biminiisle", x: BIM[0], z: BIM[1], staged: "the island on the horizon" },
  { id: "boat", kind: "biminiboat", x: r3(BIM[0] + 26), z: r3(BIM[1] - 70), staged: "afloat at the waterline" },
  { id: "fishA", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [0.675, -2.851, 0.9], r: 0.975 }, staged: "swimming" },
  { id: "fishB", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [-1.2, -2.926, -2.251], r: 1.2 }, staged: "swimming" },
  { id: "fishC", kind: "fish", type: "striped", n: 4, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [1.2, -2.926, -4.876], r: 1.35 }, staged: "swimming" },
  { id: "fishFace", kind: "fish", type: "striped", n: 1, scale: 1.333, x: BIM[0], z: BIM[1], path: { c: [-0.375, -3.226, 1.163], r: 0.03 }, range: 0.02, staged: "the fish that passes his face (30)" },
];
const step = () => [
  { id: "stepsky", kind: "biminisky", x: STEP[0], z: STEP[1], seed: 2, staged: "the sky dome" },
  { id: "stepsea", kind: "stepsea", x: STEP[0], z: STEP[1], staged: "the sea at y 0" },
  { id: "step", kind: "atstep", x: STEP[0], z: STEP[1], block: 0 },
  { id: "ruler", kind: "ruler", x: r3(STEP[0] + 0.25), z: r3(STEP[1] + 0.42), y: -0.55, water: 0.55, tint: "#ffffff" },
  { id: "coast", kind: "horizonland", x: STEP[0], z: STEP[1], coast: "island", az: -30, size: 2.4, staged: "the far coast" },
];
const port = () => [
  { id: "portsky", kind: "biminisky", x: PORT[0], z: PORT[1], seed: 3, staged: "the sky dome" },
  { id: "portsea", kind: "sea", x: PORT[0], z: PORT[1], grade: "tropic", horizon: true, reach: 1700, mirrors: [[82, -128, 30, 10, "#2a211a"], [56, -158, 24, 9, "#2a211a"]], staged: "the harbour at y 0" },
  { id: "port", kind: "portroyal", x: PORT[0], z: PORT[1], sink: 0, shake: 0 },
];
const road = () => [
  { id: "stormsea", kind: "sea", x: ROAD[0], z: ROAD[1], grade: "storm", horizon: true, reach: 1700, swell: 0.5, chop: 0.6, calm: [0, -45, 80], hi: "#f0d0b0", skyH: "#d88a4a", skyZ: "#4a4252", haze: "#7a5a58", staged: "the far sea at y 0" },
  { id: "surf", kind: "stormsurf", x: ROAD[0], z: ROAD[1], staged: "the near storm water" },
  { id: "scity", kind: "stormcity", x: ROAD[0], z: ROAD[1] },
  { id: "eroad", kind: "edgeroad2", x: ROAD[0], z: ROAD[1], water: 0.6 },
];

function build(F, S) {
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
  act(0, "spud", "move", { to: W(BIM, 0.2, 0.2), y: -3.55, dur: 3.4, steps: 0, ease: "inOut" });
  look(0, "spud", [0, -0.7], 0.01); expr(0, "spud", "neutral", { brow: 0.5, lid: 0.2 }, 0.01);
  arm(0, "spud", "R", "out", 0.01); arm(0, "spud", "L", "out", 0.01);
  say(0.15, "c1", T.page);
  look(1.7, "spud", [0, 0.05], 0.35); expr(1.8, "spud", "neutral", { brow: 0.8, lid: 0.3 }, 0.3);
  big(0, T.page, "1940 → 1968", { x: Math.round(F.W * 0.74) });
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
  place(T.air, "spud", W(BIM, 3.2, -46), -0.45, 0);       // he floats at the surface beside the line, a dot from up here
  say(T.air + 0.2, "c3a", 17.4);
  big(T.air, T.air + 3.0, "1968");
  say(17.45, "c3b", T.block);
  if (inSeg(17.6)) count(c, F, L(17.6), L(19.3), L(T.block), 0, 800, (v) => `${Math.round(v / 10) * 10} m`, { pos: F.NUM + 80 });
  fx(T.air, "ai/car-waves", { gain: 0.07, dur: r3(T.block - T.air), reason: "the shallows from above" });
  // ================================================================= 28 ON THE FIRST BLOCK (20.0-22.0): his palm on the stone
  place(T.block, "spud", W(BIM, -0.5, 0.8), -4.9, 20);
  look(T.block, "spud", [0.1, -0.7], 0.01); expr(T.block, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.01);
  act(T.block + 0.4, "spud", "crouch", { to: 0.8, dur: 0.5 });
  arm(T.block + 0.5, "spud", "R", "out", 0.45, "out"); act(T.block + 0.5, "spud", "grip", { side: "R", shape: "flat", dur: 0.2 });
  fx(T.block, "ai/underwater-amb", { gain: 0.3, dur: 2.0, reason: "back under the water" });

  // ================================================================= 29 PAST, STORMY EVENING (22.0-25.8): the foreman counts heads, and Spud
  // The crew file past toward the gate; the foreman taps the air at each head, reaches Spud, counts him too; Spud's leaf perks.
  place(T.past, "spud", W(ROAD, -0.6, 1.0), 0.8, 20);
  place(T.past, "foreman", W(ROAD, 0.5, -0.4), 0.8, -150);
  [[0.9, -3], [1.1, -6], [1.0, -9], [1.2, -12]].forEach(([x, z], i) => {
    place(T.past, `crew${i}`, W(ROAD, x, z), 0.8, 180);
    act(T.past + 0.1, `crew${i}`, "move", { to: W(ROAD, x, z - 3.2), y: 0.8, dur: 3.6, ease: "linear" });
  });
  look(T.past, "spud", [0.5, 0.2], 0.01); expr(T.past, "spud", "neutral", { brow: 0.5 }, 0.01);
  say(T.past + 0.2, "c4", T.today);
  [[0.3, -0.05], [0.25, -0.02], [0.2, 0], [0.15, 0.02]].forEach(([x, y], i) => look(T.past + 0.3 + i * 0.45, "foreman", [x, y], 0.15));
  turn(T.past + 2.2, "foreman", -100, 0.35); look(T.past + 2.25, "foreman", [-0.6, -0.1], 0.2);   // ... and Spud
  arm(T.past + 2.3, "foreman", "R", "point", 0.3, "out"); act(T.past + 2.3, "foreman", "grip", { side: "R", shape: "point", dur: 0.2 });
  macro(T.past + 2.6, "spud", "react", { expr: "surprised" });
  look(T.past + 2.9, "spud", [0, 0.05], 0.2);                              // to us: he was counted
  fx(T.past, "ai/storm-wind", { gain: 0.35, dur: r3(T.today - T.past), reason: "the last evening: wind off the sea" });
  fx(T.past, "ai/car-waves", { gain: 0.3, dur: r3(T.today - T.past), reason: "waves wash over the road" });

  // ================================================================= 30 TODAY (25.8-30.7): beachrock, a fish passes his face
  place(T.today, "spud", W(BIM, -0.5, 0.8), -4.9, 15);
  look(T.today, "spud", [0, 0.05], 0.01); expr(T.today, "spud", "neutral", { brow: 0.35, lid: 0.5 }, 0.01);
  act(T.today + 0.1, "spud", "still", { dur: 4.6, idle: 0.1 });
  say(T.today + 0.2, "c5a", 29.1);
  say(29.15, "c5b", T.stair);
  expr(29.0, "spud", "neutral", { brow: 0.2, lid: 0.6, curve: -0.1 }, 0.25);
  fx(T.today, "ai/underwater-amb", { gain: 0.3, dur: r3(T.stair - T.today), reason: "under water again" });

  // ================================================================= 31 THE STAIRCASE (30.7-35.6): can a whole city sink in one day?
  place(T.stair, "spud", W(STEP, 0, -0.3), 0.3, 0);
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
  act(T.wait, "spud", "sit", { rot: 0, height: 0.3, dur: 0.01, hands: "lap" });
  look(T.wait, "spud", [0.6, 0], 0.01); expr(T.wait, "spud", "neutral", { brow: 0.3, lid: 0.55 }, 0.01);
  say(T.wait, "c7b", 40.3);
  look(39.9, "spud", [0, 0.05], 0.3);
  say(40.35, "c7c", T.port);
  big(T.wait + 0.1, T.port, "1 DAY: 0.008 mm");

  // ================================================================= 34 PORT ROYAL 1692 (41.3-44.6): a whole harbour town, then the ground shakes
  place(T.port, "spud", W(PORT, -0.3, 0), 1.2, 15);
  look(T.port, "spud", [-0.4, 0.2], 0.01); look(T.port + 0.6, "spud", [0.4, 0.2], 0.6);
  say(T.port + 0.2, "c8a", 42.6);
  say(42.65, "c8b", 47.0);
  big(42.65, T.slide, "1692");
  prop(43.6, "port", { shake: 1 }, 0.3, "out");
  macro(43.7, "spud", "react", { expr: "surprised", big: true });
  fx(43.6, "rumble", { gain: 0.6, dur: 4.5, reason: "the earthquake: a deep rumble under the town" });
  fx(T.port, "ai/car-waves", { gain: 0.1, dur: r3(T.slide - T.port), reason: "the harbour" });
  // ================================================================= 35 THE SLIDE (44.6-48.8): two thirds of the town into the sea, he runs
  place(T.slide, "spud", W(PORT, -0.2, 0.4), 1.2, -25);
  look(T.slide - 0.1, "spud", [-0.3, 0], 0.1); act(T.slide + 0.05, "spud", "move", { to: W(PORT, -1.4, 3.6), y: 1.2, dur: 1.6, ease: "inOut" });
  prop(T.slide + 0.2, "port", { sink: 1 }, 1.5, "in");
  prop(46.5, "port", { shake: 0 }, 1.2, "inOut");
  big(47.0, T.closer, "2 MIN");
  fx(T.slide + 0.2, "ai/water-gush", { gain: 0.6, reason: "the town slides into the harbour" });
  fx(T.slide + 0.4, "ai/branch-snap", { gain: 0.4, reason: "timber houses break" });
  say(47.0, "c8c", T.closer);
  // ================================================================= 36 CLOSER (48.8-52.0): he nods slowly, one finger up
  place(T.closer, "spud", W(STEP, 0, -0.3), 0.3, 0);
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
  const SHOTS = [
    ["25 the road under water (part 3 hook)", T.hook, at(BIM, [0.4, -1.2, 2.6], [0, -4.9, -2.0], 50, { pos: [0.3, -1.6, 1.6] }, T.page), "hook"],
    ["26 the 1940 page", T.page, pageCam(760, 380, 1150, [880, 300, 760, r3(T.isle - T.page)])],
    ["27a near Bimini, from high above", T.isle, at(BIM, [40, 120, 140], [0, -5, -900], 40, { pos: [30, 110, 100] }, r3(T.page2 - T.isle))],
    ["26b '68 and '69", T.page2, pageCam(640, 520, 420, [640, 525, 340, r3(T.air - T.page2)])],
    ["27 the road from above", T.air, at(BIM, [6, 32, 40], [0, -5, -400], 45, { pos: [4, 24, 4] }, r3(T.block - T.air))],
    ["28 his palm on the first block", T.block, at(BIM, [-2.2, -4.1, 5.0], [0.8, -4.3, -8], 40, { pos: [-1.9, -4.2, 4.2] }, r3(T.past - T.block))],
    ["29 Atlantis, the last evening", T.past, at(ROAD, [0.8, 1.85, 4.5], [-1, 2.6, -40], 42, { pos: [0.6, 1.8, 3.9] }, r3(T.today - T.past))],
    ["30 natural beachrock", T.today, at(BIM, [-0.9, -4.05, 2.4], [-0.5, -4.05, 0.8], 32, { pos: [-0.85, -4.05, 2.15] }, r3(T.stair - T.today))],
    ["31 the staircase", T.stair, at(STEP, [0.6, 1.15, 6.5], [0, 0.85, -20], 38, { pos: [0.5, 1.1, 5.6] }, r3(T.ruler - T.stair))],
    ["32 the ruler", T.ruler, at(STEP, [-0.2, 0.2, 2.6], [-0.1, 0.22, 0.4], 38, { pos: [-0.15, 0.2, 2.35] }, r3(T.wait - T.ruler))],
    ["33 he waits", T.wait, at(STEP, [0.3, 0.8, 3.2], [0.0, 0.85, -0.8], 34, { pos: [0.3, 0.8, 3.05] }, r3(T.port - T.wait))],
    ["34 Port Royal 1692", T.port, at(PORT, [1.5, 2.8, 8], [-2, 3.5, -50], 40, { pos: [1.2, 2.7, 7.0] }, r3(T.slide - T.port))],
    ["35 two thirds into the sea", T.slide, at(PORT, [2.0, 2.8, 8], [-4, 3.5, -45], 44, { pos: [2.4, 3.0, 9.0] }, r3(T.closer - T.slide))],
    ["36 closer, but one town", T.closer, at(STEP, [0.3, 1.0, 3.0], [0, 0.95, -10], 34, { pos: [0.3, 1.0, 2.6] }, r3(T.END - T.closer))],
  ];
  const mine = SHOTS.filter(([, t], i) => (SHOTS[i + 1]?.[1] ?? T.END) > S.t0 + 1e-6 && t < S.t1 - 1e-6).map(([n, t, s, k]) => [n, L(Math.max(t, S.t0)), s, k]);
  const beats = c.beats(mine, L(S.t1));

  // ---------------------------------------------------------------- cast + props of this storyboard
  const first = { c1: { at: W(BIM, 0.3, 1.4), y: -3.4, face: 0 }, c2: { at: W(ROAD, -0.6, 1.0), y: 0.8, face: 20 }, c3: { at: W(BIM, -0.5, 0.8), y: -4.9, face: 15 } }[S.key];
  const cast = [{ id: "spud", character: CAST.spud, at: first.at, y: first.y, face: first.face, expr: "neutral", follow: 0.2, seed: 2.1 }];
  if (S.key === "c2") {
    cast.push({ id: "foreman", character: CAST.foreman, at: W(ROAD, 0.5, -0.4), y: 0.8, face: -150, expr: "neutral", follow: 0.3, seed: 4.2 });
    [[0.9, -3], [1.1, -6], [1.0, -9], [1.2, -12]].forEach(([x, z], i) => cast.push({ id: `crew${i}`, character: CAST.crew, at: W(ROAD, x, z), y: 0.8, face: 180, expr: "neutral", seed: 5 + i }));
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
    set, music: score(T0 + S.t0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true },
    ...(S.key === "c1" && { hook: { show: ["spud"], hint: 0, what: "Bimini: a dead-straight line of giant square stones under clear turquoise water, Spud floating above them; 1940 -> 1968 up top" } }),
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [...lampClip(["spud"], L(S.t1)), ...["bsky", "stepsky", "portsky"].filter((id) => props.some((q) => q.id === id)).map((id) => ({ who: "spud", with: id, from: 0, to: L(S.t1), reason: "shell: the sky dome rides with the camera and is drawn behind everything (lookOnly)" }))],
    notes: `Generated by storyboards/series/ancient-aliens/03-atlantis/block-c/make-block-c.mjs. Block C, storyboard ${S.key} of three (block time ${S.t0}-${S.t1} s, story ${T0 + S.t0}-${T0 + S.t1} s). Music = the EP03 score from story ${T0 + S.t0} s.`,
  };
}

const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
for (const F of FRAMES) for (const S of SEGS) write(import.meta.url, { id: `aa03-${S.key}-${F.key}`, ...F.sb(S.far), ...build(F, S) });
