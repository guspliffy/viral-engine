// ANCIENT ALIENS EP03 "Where did Atlantis go?", BLOCK B (story 0:50-1:42, TikTok part 2): clue 2 the metal, the ask.
// Panels 13-24 of ancient-aliens-03-sheet-2.png. Story: /mnt/project-files/videos/ancient-aliens/03-atlantis/STORY.md.
//   node storyboards/series/ancient-aliens/03-atlantis/block-b/measure-lines.mjs   -> lines.json (spoken lengths, run ALONE)
//   node storyboards/series/ancient-aliens/03-atlantis/block-b/make-block-b.mjs    -> aa03-b{1..5}-wide.json (+ --tall after Jonny's OK)
//   bash storyboards/series/ancient-aliens/03-atlantis/block-b/join-block-b.sh <wide|tall> [draft]   -> the block's one video
//
// THE LOOK (Jonny 15 Nov, "All 3D like Stonehenge"): every place Spud is in is real 3D (engine/page/props-at-b-*.js, the
// paintings plate-14 / plate-21 / plate-17 / plate-19 are the look target). One storyboard per light, cut on a change of place:
//   b1  UNDER  story 0:50.0-1:03.9   13 the lamp clicks on, the bar flashes (part 2's hook); 14-15 the wreck, 39 bars count up;
//                                      16 his palm on the bar
//   b2  NOON   story 1:03.9-1:07.0   17 palm on a red-gold plate of the citadel wall, a crew member polishes the next one
//   b3  MAP    story 1:07.0-1:14.0   18 Greece west past Sicily through the two pillars into the Atlantic
//   b4  NOON   story 1:14.0-1:21.2   19-20 the bridge at noon, the first quake, a column falls into the ring canal, they look up
//   b5  UNDER  story 1:21.2-1:38.0   21 Spud tiny at the shelf edge over the deep; 22-24 the ask, a fish swims past
// Emotion map (STORY.md): surprise at the flash, awe at the count, hope on the route, dread at the quake, smallness at the
// deep, play at the ask. Video time t = story time - 50; each storyboard runs from its own 0 (TS[k] = its block start).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, FAR, P, PLACE, AT_UNDER, AT_NOON, hostSay, clueTag, atlantisClock, count, score, partScore, host, lampClip, CAST } from "../kit/at-kit.mjs";
import { LINES, SUBS, TAKES, toneOf } from "./lines.mjs";

const T0 = 50;
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l.split(/\s+/).length * 0.42)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };

// ---------------------------------------------------------------- the block's beats (block time, s)
const T = {
  s13: 0, s14: 2.6, s15: 5.55, s14b: 8.45, s16: 12.0,
  s17: 13.9, s18: 17.0, s19: 24.0, s20: 28.7, s21: 31.2, s22: 38.0, s24: 44.0, END: 48.0,
};
// the storyboards: [key, from, to]
const PARTS = [["b1", T.s13, T.s17], ["b2", T.s17, T.s18], ["b3", T.s18, T.s19], ["b4", T.s19, T.s21], ["b5", T.s21, T.END]];
// the voice, on block time (each line ends before the next starts)
const AT = { b1: 0.15, b2a: 2.8, b2b: 5.7, b2c: 8.6, b3: 12.35, b4a: 17.25, b4b: 19.15, b5a: 24.25, b5b: 25.85, b6a: 31.5, b6b: 34.0, b7a: 38.3, b7b: 40.75, b7c: 43.15 };

// ---------------------------------------------------------------- places
const SEA = P.sicily, SHELF = PLACE(25);
const W = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
const C = (o, pos, look, fov, to) => ({ pos: [r3(o[0] + pos[0]), pos[1], r3(o[1] + pos[2])], look: [r3(o[0] + look[0]), look[1], r3(o[1] + look[2])], fov,
  ...(to && { to: { pos: [r3(o[0] + to.pos[0]), to.pos[1], r3(o[1] + to.pos[2])], ...(to.look && { look: [r3(o[0] + to.look[0]), to.look[1], r3(o[1] + to.look[2])] }), ...(to.fov && { fov: to.fov }) }, dur: to.dur, ease: to.ease ?? "inOut" }) });
// the bars (props-at-seabed.js ingots): the hero bar's centre on the sand, the line runs off along dir [-0.42, -0.91]
const BARS = W(SEA, 0.45, 0.35);
const HEAD = 0.6;   // Spud's lamp height when he stands

function build(F, key) {
  const [, from, to] = PARTS.find((p) => p[0] === key);
  const L = (t) => r3(t - from);                       // block time -> this storyboard's time
  const c = clip({ faces: "strong" }), { A, sfx, cap } = c;
  const TW = (wide, tall) => (F.key === "tall" ? tall : wide);   // a shot's camera for the wide film / the tall part
  const PR = (t, id, set, dur = 0.01, ease = "linear") => c.prop(L(t), id, set, dur, ease);
  const place = (t, who, xz, yaw) => { A(L(t) - 0.02 < 0 ? 0 : r3(L(t) - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(L(t) - 0.02 < 0 ? 0 : r3(L(t) - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const look = (t, who, to, dur = 0.2) => A(L(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(L(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const arm = (t, side, pose, dur, ease) => c.arm(L(t), "spud", side, pose, dur, ease);
  const inPart = (k) => AT[k] >= from - 1e-6 && AT[k] < to - 1e-6;
  const say = (k) => {
    if (!inPart(k)) return;
    const t = AT[k], next = Object.values(AT).filter((v) => v > t + 1e-6).sort((a, b) => a - b)[0] ?? to;
    const hold = Math.max(0, Math.min(0.4, r3(Math.min(next, to) - t - DUR[k] - 0.05)));
    if (TAKES[k]) {   // a re-read take: the same item hostSay writes, plus its take number
      c.at(L(t), { macro: "say", who: "spud", line: LINES[k], tone: toneOf(k), dur: DUR[k], voice: "reaper", take: TAKES[k], caption: false });
      cap(L(t), r3(L(t) + DUR[k] + hold), SUBS[k] ?? LINES[k], F.SUB, false, { size: F.subSize, kinetic: false });
    } else hostSay(c, F, L(t), "spud", LINES[k], DUR[k], toneOf(k), { hold, sub: SUBS[k] ?? true });
  };
  const SH = [];   // [name, block time, camera, kind?]
  const cast = [{ id: "spud", character: CAST.spud, at: [0, 0], face: 0, expr: "neutral", follow: 0.2, seed: 2.2 }];
  const props = [];
  // tall = part 2 on its own: its first shot (13) is the part's hook (PART_HOOKS.b), and the part score runs on block time
  let set, music = F.key === "tall" ? partScore("b", { skip: from }) : score(T0 + from), light = "under";

  if (key === "b1" || key === "b5") {
    set = { type: "plain", ...AT_UNDER };
    // b5 faces the lens in 22-24: a shorter beam, so its lit silt never drifts past the lens (one-frame pops in draft v1)
    props.push(key === "b5" ? { ...host("spud", 1), reach: 2.0 } : host("spud", 1));
    props.push({ id: "seabed", kind: "atbseabed", x: SEA[0], y: 0, z: SEA[1], seed: 1 });
    props.push({ id: "schoolA", kind: "fish", type: "silver", n: 12, x: SEA[0], y: 0, z: SEA[1], path: [[-6, 2.6, -4], [-2, 3.0, -6], [3, 2.7, -5], [5, 2.4, -2], [1, 2.2, -1.5], [-4, 2.4, -2]], phase: 0.1, staged: "a school of silver fish swimming high over the sand" });
    props.push({ id: "schoolB", kind: "fish", type: "silver", n: 9, x: SEA[0], y: 0, z: SEA[1], path: { c: [2.5, 2.0, -7], r: 3.2 }, phase: 0.55, speed: 0.6, staged: "a second school swimming over the wreck" });
    props.push({ id: "bub", kind: "bubbles", x: SEA[0], y: 0, z: SEA[1], from: [0, 0.75, 0.15], surface: 15, every: 2, size: 0.6 });
  }

  // ================================================================= b1 UNDER (0-13.9): the metal, 2015, 39 bars, the wreck, his palm
  if (key === "b1") {
    const SP13 = W(SEA, -0.25, 0.48), SP14 = W(SEA, 1.25, 1.15), SP16 = SP13;
    props.push({ id: "bars", kind: "ingots", x: BARS[0], y: 0, z: BARS[1], count: 1, lamp: 0, lampFrom: [-0.7, HEAD - 0.06, 0.13], staged: "the 39 red-gold bars: the hero bar by his hand, the line off toward the wreck" });
    // 13 HOOK (0-2.6): crouched by the hero bar in the dark; the lamp clicks on, the bar flashes red-gold
    place(0, "spud", SP13, 70); A(0, "spud", "crouch", { to: 1, dur: 0.01 }); A(0, "spud", "pitch", { to: 14, dur: 0.01 });
    PR(0, "bub", { x: SP13[0], z: SP13[1] });
    PR(0, "spud-lamp", { lit: 0 }, 0); PR(0.32, "spud-lamp", { lit: 1 }, 0.08);
    PR(0, "bars", { lamp: 0 }, 0); PR(0.36, "bars", { lamp: 1 }, 0.2, "out");
    // the flash: the lamp's streak runs along the hero bar as his head comes round (the sheen sweeps the metal once)
    PR(0, "bars", { lampX: -0.95 }, 0); PR(0.4, "bars", { lampX: -0.45 }, 0.7, "inOut");
    sfx(0.3, "kenney/switch", { gain: 0.5, reason: "the headlamp's switch clicks on" });
    look(0, "spud", [0.35, -0.55], 0.01); expr(0, "spud", "neutral", { brow: 0.55, lid: 0.3 }, 0.01);
    expr(0.5, "spud", "surprised", { open: 0.25 }, 0.18); look(1.15, "spud", [0, 0.05], 0.25);
    say("b1");
    cap(0, r3(T.s14 + 0.4), "2015", F.NUM + 80, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * (F.key === "tall" ? 0.5 : 0.7)) });
    SH.push(["13 the lamp clicks on, the bar flashes", T.s13, TW(C(SEA, [1.1, 0.5, 2.3], [0.28, 0.36, -0.01], 38, { pos: [0.95, 0.47, 2.0], dur: T.s14 - T.s13 }), C(SEA, [3.2, 0.8, 1.3], [0, 0.8, 0.42], 36, { pos: [3.0, 0.78, 1.22], dur: T.s14 - T.s13 })), "hook"]);
    // 14 (2.6-5.55): he stands by the hero bar; the wreck, the line of sand mounds -> "Clue two. 2015."
    A(L(T.s14) - 0.02, "spud", "crouch", { to: 0, dur: 0.01 }); A(L(T.s14) - 0.02, "spud", "pitch", { to: 0, dur: 0.01 });
    place(T.s14, "spud", SP14, -25); look(T.s14, "spud", [-0.3, -0.25], 0.01); expr(T.s14, "spud", "neutral", { brow: 0.7, lid: 0.25 }, 0.01);
    PR(T.s14, "bub", { x: SP14[0], z: SP14[1] }); PR(T.s14, "bars", { lampX: 0.8, lampY: HEAD, lampZ: 0.8, lamp: 0.6 });
    say("b2a");
    look(T.s14 + 1.6, "spud", [0.1, 0.05], 0.3);
    SH.push(["14 the wreck, Spud by the bar", T.s14, TW(C(SEA, [0.5, 1.2, 7], [-1, 0.9, -6], 40, { pos: [0.4, 1.15, 6.4], dur: T.s15 - T.s14 }), C(SEA, [1.3, 1.0, 5], [1.25, 0.8, -6], 40, { pos: [1.25, 0.98, 4.6], dur: T.s15 - T.s14 }))]);
    // 15 (5.55-8.45): low along the line: 39 bars rise out of the sand one by one, the counter runs to 39 (he steps out of
    // this low camera's frame, behind it, and is back by the bar for 14b)
    const SP15 = W(SEA, 2.3, 2.6);
    place(T.s15, "spud", SP15, -30); PR(T.s15, "bub", { x: SP15[0], z: SP15[1] });
    const SP14B = W(SEA, 3.6, 2.5);   // 14b: he is behind the camera, the shot is the wreck and the line alone
    place(T.s14b, "spud", SP14B, 0); PR(T.s14b, "bub", { x: SP14B[0], z: SP14B[1] });
    say("b2b");
    PR(T.s15 + 0.15, "bars", { count: 1 }, 0); PR(T.s15 + 0.15, "bars", { count: 39 }, 2.5, "linear");
    count(c, F, L(T.s15 + 0.15), L(T.s15 + 2.65), L(T.s14b + 0.3), 1, 39, (v) => String(Math.round(v)));
    for (let i = 0; i < 6; i++) sfx(r3(L(T.s15 + 0.25 + i * 0.4)), "hit-metal", { gain: 0.08, reason: "bars knock up through the sand" });
    SH.push(["15 the bars rise one by one", T.s15, C(SEA, [1.05, 0.42, 1.0], [-1.1, 0.12, -3.2], 36, { pos: [0.75, 0.42, 0.45], dur: T.s14b - T.s15 })]);
    // 14b (8.45-12.0): the camera drifts to the wreck: "In a ship 2,600 years old."
    say("b2c");
    count(c, F, L(T.s14b + 1.2), L(T.s14b + 2.6), L(T.s16), 1000, 2600, (v) => `${Math.round(v / 100) * 100 >= 1000 ? (Math.round(v / 100) * 100).toLocaleString("en-US") : Math.round(v / 100) * 100} YEARS`);
    look(T.s14b, "spud", [-0.35, 0.05], 0.3);
    SH.push(["14b the 2,600-year-old wreck", T.s14b, C(SEA, [0.2, 1.25, 6.6], [-2.6, 1.3, -9], 40, { pos: [-0.9, 1.3, 4.4], look: [-3.0, 1.45, -10], dur: T.s16 - T.s14b })]);
    // 16 (12.0-13.9): he kneels by the hero bar and lays his palm on it: the cut to noon follows the palm
    place(T.s16, "spud", SP16, 70); A(L(T.s16) - 0.02, "spud", "crouch", { to: 1, dur: 0.01 }); A(L(T.s16) - 0.02, "spud", "pitch", { to: 18, dur: 0.01 });
    PR(T.s16, "bub", { x: SP16[0], z: SP16[1] }); PR(T.s16, "bars", { lampX: -0.62, lampY: HEAD - 0.1, lampZ: 0.13, lamp: 1 });
    look(T.s16, "spud", [0.3, -0.6], 0.01); expr(T.s16, "spud", "happy", { brow: 0.5 }, 0.01);
    arm(T.s16 + 0.25, "R", { prop: "bars", grip: [-0.17, 0.11, 0.1], palm: [-0.17, 0, 0.1] }, 0.45, "out");
    say("b3");
    SH.push(["16 his palm on the bar", T.s16, TW(C(SEA, [0.8, 0.5, 1.85], [-0.05, 0.3, 0.42], 36, { pos: [0.7, 0.48, 1.65], dur: T.s17 - T.s16 }), C(SEA, [1.6, 0.85, 2.9], [-0.05, 0.68, 0.42], 34, { pos: [1.5, 0.83, 2.75], dur: T.s17 - T.s16 }))]);
    sfx(0, "ai/underwater-amb", { gain: 0.3, dur: r3(to - from), reason: "under the sea: the hush and the far clicks" });
    sfx(1.2, "ai/bubbles-burst", { gain: 0.12, reason: "his breath bubbles" }); sfx(9.2, "ai/bubbles-burst", { gain: 0.1, reason: "his breath bubbles" });
  }

  // ================================================================= b3 MAP (17.0-24.0): Greece west through the pillars
  if (key === "b3") {
    light = "map";
    const SIZE = [1536, 1024], PL = { src: "assets/props/atlantis/plate-18-sea-map.png", z: -2.2, center: [0, 1.6], height: 3.2, depth: false, motion: false, dust: 0 };
    const k = PL.height / SIZE[1];
    const mcam = (cx, cy, vw, o = {}) => {   // straight at plate pixel (cx, cy); the window vw plate px wide (16:9 or 9:16 by frame)
      const X = r3((cx - SIZE[0] / 2) * k), Y = r3(1.6 - (cy - SIZE[1] / 2) * k), dist = 3.4, vh = vw * k * (F.key === "tall" ? 16 / 9 : 9 / 16);
      return { pos: [X, Y, r3(-2.2 + dist)], look: [X, Y, -2.2], fov: r3(2 * Math.atan(vh / 2 / dist) * 180 / Math.PI), ...o };
    };
    set = { type: "plain", color: "#101010", floor: "none", plate: PL };
    const ATH = [1238, 402], SIC = [985, 492], GIB = [388, 506];
    props.push({ id: "route", kind: "maproute", plate: PL, x: 0, y: 0, z: 0, from: ATH, via: [[1150, 470], SIC, [760, 500], [560, 470], GIB], to: [120, 470], dotsAt: [ATH, SIC], pillars: [[377, 498], [398, 522]], pillarH: 0.03, draw: 0, dots: 0, staged: "ink on the flat map plate" });
    PR(T.s18, "route", { draw: 0, dots: 0, pillars: 0 }, 0);
    PR(T.s18 + 0.4, "route", { dots: 1 }, 0.6, "out");
    say("b4a"); say("b4b");
    PR(T.s18 + 1.0, "route", { draw: 0.55 }, 2.4, "inOut");                // Athens -> past Sicily -> toward Gibraltar
    PR(21.6, "route", { pillars: 1 }, 0.5, "out");                         // "Beyond the Pillars of Heracles"
    PR(21.8, "route", { draw: 1 }, 1.8, "inOut");                          // out into the Atlantic
    cap(L(21.7), L(T.s19), "GIBRALTAR", F.NUM + 80, false, { size: Math.round(F.numSize * 0.55), kinetic: false });
    SH.push(["18 the route west", T.s18, TW(mcam(820, 470, 1400, { to: { ...mcam(560, 490, 1100) }, dur: r3(T.s19 - T.s18 - 0.3), ease: "inOut" }), mcam(1100, 512, 560, { to: { ...mcam(430, 512, 560) }, dur: r3(T.s19 - T.s18 - 0.3), ease: "inOut" }))]);
    sfx(L(T.s18 + 1.0), "scribble", { gain: 0.12, reason: "the ink line scratches across the map" });
  }

  // ================================================================= b5 UNDER (31.2-48.0): the deep; the ask
  if (key === "b5") {
    props.push({ id: "shelf", kind: "atbshelf", x: SHELF[0], y: 0, z: SHELF[1], seed: 1 });
    props.push({ id: "bigfish", kind: "fish", type: "big", x: SEA[0], y: 0, z: SEA[1], path: [[-3.6, 0.72, 1.7], [-1.2, 0.68, 1.75], [1.2, 0.72, 1.65], [3.6, 0.7, 1.6]], phase: 0, loop: false, t0: L(T.s24 + 0.4), staged: "a big silver fish swims past at his eye height" });
    // 21 (31.2-38.0): the shelf edge, Spud tiny, his lamp into the deep
    const SP21 = W(SHELF, 0.9, 0);
    place(T.s21, "spud", SP21, 90); look(T.s21, "spud", [0, -0.1], 0.01);
    PR(T.s21, "bub", { x: SP21[0], z: SP21[1] });
    say("b6a"); say("b6b");
    count(c, F, L(T.s21 + 0.5), L(T.s21 + 2.3), L(T.s22 - 0.2), 0, 4, (v) => `${Math.round(v)} km`);
    SH.push(["21 the shelf edge over the deep", T.s21, TW(C(SHELF, [6.5, 1.0, 13], [-2, -1, -3], 40, { pos: [6.2, 0.9, 11.6], dur: T.s22 - T.s21 }), C(SHELF, [6.5, 1.0, 13], [0, 0.3, -2], 34, { pos: [6.2, 0.9, 11.6], dur: T.s22 - T.s21 }))]);
    sfx(L(T.s21), "ai/underwater-amb", { gain: 0.34, dur: r3(T.s22 - T.s21), reason: "the deep: low hush" });
    // 22-23 (38.0-44.0): the ask, close: one finger, then both
    const SP22 = W(SEA, 0, 0.5);
    place(T.s22, "spud", SP22, 180); look(T.s22, "spud", [0, 0.05], 0.01); expr(T.s22, "spud", "neutral", { brow: 0.85, lid: 0.45 }, 0.01);
    PR(T.s22, "bub", { x: SP22[0], z: SP22[1] });
    say("b7a"); say("b7b"); say("b7c");
    arm(AT.b7a + 0.25, "R", { o: [0.06, 0.66, 0.2] }, 0.3, "out"); A(L(AT.b7a + 0.25), "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
    arm(AT.b7b + 0.25, "L", { o: [0.06, 0.66, 0.2] }, 0.3, "out"); A(L(AT.b7b + 0.25), "spud", "grip", { side: "L", shape: "point", dur: 0.2 });
    arm(42.6, "R", "rest", 0.4, "inOut"); arm(42.62, "L", "rest", 0.4, "inOut");
    // the texts sit above his head (captions never over the face): "1" over his raised right hand, "2" over the middle once both are up
    const TALL = F.key === "tall", REALY = TALL ? F.NUM : F.NUM, DIGY = TALL ? F.NUM + 130 : F.NUM + 100, DIGS = Math.round(F.numSize * 0.85);
    cap(L(AT.b7a), L(T.END), "REAL 1 · MADE UP 2", REALY, false, { size: Math.round(F.numSize * 0.55), kinetic: false });
    cap(L(AT.b7a + 0.3), L(AT.b7b + 0.2), "1", DIGY, false, { size: DIGS, kinetic: false, x: Math.round(F.W * (TALL ? 0.38 : 0.42)) });
    cap(L(AT.b7b + 0.3), L(42.6), "2", DIGY, false, { size: DIGS, kinetic: false });
    // 22-24 (38.0-48.0) one slow push, no cut: the ask, then "I'll wait." and a big silver fish swims past behind him at eye height
    look(T.s24 + 0.9, "spud", [0.35, 0.05], 0.4); look(T.s24 + 2.6, "spud", [0, 0.05], 0.4);
    A(r3(L(T.END) - 0.6), "spud", "noblink", { dur: 0.6 });
    SH.push(["22-24 the ask, I'll wait: the fish", T.s22, TALL
      ? C(SEA, [0, 0.7, -3.2], [0, 1.22, 0.5], 46, { pos: [0, 0.7, -3.0], dur: T.END - T.s22 })
      : C(SEA, [0, 0.7, -3.0], [0, 1.02, 0.5], 34, { pos: [0, 0.7, -2.85], dur: T.END - T.s22 })]);
    sfx(L(T.s22), "ai/underwater-amb", { gain: 0.28, dur: r3(T.END - T.s22), reason: "under the sea" });
    sfx(L(T.s24 + 0.3), "ai/bubbles-burst", { gain: 0.12, reason: "his breath bubbles while he waits" });
  }

  // ================================================================= b2 / b4 NOON: the city on its last full day (props-at-b-noon.js)
  const NOON = PLACE(26), BR = W(NOON, 500, 0);   // view wall17 at the place, view bridge19 500 m along x
  const fx = [];
  if (key === "b2" || key === "b4") {
    light = "noon"; set = { type: "plain", ...AT_NOON };
    props.push({ id: "noon", kind: "atbnoon", x: NOON[0], y: 0, z: NOON[1], view: key === "b2" ? "wall17" : "bridge19", light: "noon", seed: 1, quake: 0 });
    cast.push({ id: "crew1", character: CAST.crew, at: [0, 0], face: 0, expr: "neutral", follow: 0.2, seed: 3.1 });
  }
  // the painter's camera of a view (header of props-at-b-noon.js): pos + the look direction, fov 38.1; `k` pushes along it
  const paint = (o, pos, dir, fov, push = 0) => { const p = [pos[0] + dir[0] * push, pos[1] + dir[1] * push, pos[2] + dir[2] * push]; return { pos: [r3(o[0] + p[0]), r3(p[1]), r3(o[1] + p[2])], look: [r3(o[0] + p[0] + dir[0] * 50), r3(p[1] + dir[1] * 50), r3(o[1] + p[2] + dir[2] * 50)], fov }; };

  // b2 (13.9-17.0): 17 his palm on a red-gold plate on the wall-walk; a crew member polishes the next one with a white cloth
  if (key === "b2") {
    const WD = [0.457, 0.052, -0.889], WP = [-0.8, 1.26, 2.47];
    const SP = W(NOON, 0.45, -1.58), CR = W(NOON, 2.6, -1.5);
    cast.find((x) => x.id === "spud").at = SP; cast.find((x) => x.id === "crew1").at = CR;
    place(T.s17, "spud", SP, -20); place(T.s17, "crew1", CR, -35);
    A(L(T.s17), "spud", "pitch", { to: 10, dur: 0 }); A(L(T.s17), "crew1", "pitch", { to: 6, dur: 0 });
    props.push({ id: "cloth", kind: "polishcloth", x: r3(NOON[0] + 2.62), y: 0.406, z: r3(NOON[1] - 0.8), rot: 15, staged: "the crew member's cloth lies flat on the plate top under its hand" });
    c.arm(L(T.s17), "spud", "R", { prop: "noon", grip: [0.36, 0.48, -0.8], palm: [0.36, 0.4, -0.8] }, 0);
    for (const [s0, lx] of [["R", 0.0], ["L", 0.26]]) c.arm(L(T.s17), "crew1", s0, { prop: "cloth", grip: [lx - 0.13, 0.08, 0], palm: [lx - 0.13, 0, 0] }, 0);
    for (let i = 0; i < 5; i++) PR(r3(T.s17 + 0.15 + i * 0.55), "cloth", { x: r3(NOON[0] + 2.62 + (i % 2 ? -0.1 : 0.1)) }, 0.5, "inOut");   // it polishes: the cloth (and its hands) sweep along the plate
    look(T.s17, "spud", [0.25, -0.5], 0.01); expr(T.s17, "spud", "happy", { brow: 0.4 }, 0.01);
    look(T.s17, "crew1", [-0.2, -0.05], 0.01); expr(T.s17, "crew1", "happy", {}, 0.01);
    look(T.s17 + 1.3, "spud", [0.4, -0.15], 0.3);   // he glances at the crew member: "Plato called it orichalcum"
    look(T.s17 + 1.5, "crew1", [-0.4, 0.05], 0.3);
    say("b3");
    // from the painter's spot (the projection holds), a long lens on the two of them at the plates
    const aim = (fov, x, y = 0.62) => ({ pos: [r3(NOON[0] + WP[0]), WP[1], r3(NOON[1] + WP[2])], look: [r3(NOON[0] + x), y, r3(NOON[1] - 1.1)], fov });
    SH.push(["17 noon: his palm on the red-gold plate", T.s17, TW({ ...aim(25, 1.45), to: aim(22, 1.35), dur: r3(T.s18 - T.s17), ease: "inOut" }, { ...aim(40, 0.55, 0.75), to: aim(36, 0.5, 0.72), dur: r3(T.s18 - T.s17), ease: "inOut" })]);
    sfx(L(T.s17), "cloth", { gain: 0.25, reason: "the cloth rubs the plate" });
    sfx(L(T.s17 + 0.05), "hit-plate", { gain: 0.08, reason: "his palm lands on the metal plate" });
  }

  // b4 (24.0-31.2): 19 the bridge at noon, the first quake, the column falls into the canal; 20 they turn and look up
  if (key === "b4") {
    const BD = [0.789, 0.026, -0.615], BP = [0, 1.2, 0];
    cast.push({ id: "crew2", character: CAST.crew, at: [0, 0], face: 0, expr: "neutral", follow: 0.2, seed: 4.3 });
    const SP = W(BR, 4.2, -1.64), C1 = W(BR, 5.6, -1.7), C2 = W(BR, 7.0, -1.7);
    cast.find((x) => x.id === "spud").at = SP; cast.find((x) => x.id === "crew1").at = C1; cast.find((x) => x.id === "crew2").at = C2;
    place(T.s19, "spud", SP, 180); place(T.s19, "crew1", C1, 180); place(T.s19, "crew2", C2, 170);
    for (const [s0, dx] of [["R", 0.14], ["L", -0.14]]) c.arm(L(T.s19), "spud", s0, { prop: "noon", grip: [500 + 4.2 + dx, 0.66, -2.35], palm: [500 + 4.2 + dx, 0.61, -2.35] }, 0);
    props.push({ id: "col", kind: "column", x: r3(BR[0] + 36.8), y: 2.2, z: r3(BR[1] - 80), dir: 308, fall: 0, splash: 0, light: "noon", ground: 0, water: -3.2, staged: "the white column on the far quay by the water; it topples forward into the canal, toward us" });
    for (const id of ["spud", "crew1", "crew2"]) look(T.s19, id, [0, 0.1], 0.01);
    say("b5a"); say("b5b");
    // the quake on "the ground began to shake": dust off the walls, the column topples, the splash
    const Q = AT.b5b + 1.2;
    const look20 = (fov, x, z) => ({ pos: [r3(BR[0] + BP[0]), BP[1], r3(BR[1] + BP[2])], look: [r3(BR[0] + x), 0.9, r3(BR[1] + z)], fov });   // tall: from the painter's spot at the cast
    PR(T.s19, "noon", { quake: 0 }, 0); PR(Q, "noon", { quake: 1 }, 0.6, "out");
    PR(T.s19, "col", { fall: 0, splash: 0 }, 0); PR(Q + 0.15, "col", { fall: 1 }, 1.25, "in"); PR(Q + 1.38, "col", { splash: 1 }, 1.3, "out");
    fx.push({ do: "shake", at: L(Q), dur: 2.6, amp: 0.035 }, { do: "shake", at: L(Q + 1.38), dur: 0.8, amp: 0.05 });
    sfx(L(Q), "rumble", { gain: 0.5, reason: "the ground rumbles: the first quake" });
    sfx(L(Q + 1.38), "ai/water-gush", { gain: 0.45, reason: "the column crashes into the canal" });
    for (const [id, d] of [["crew1", 0.15], ["crew2", 0.3], ["spud", 0.4]]) { look(Q + d, id, [-0.35, 0.35], 0.25); expr(Q + d, id, "surprised", { open: 0.3 }, 0.2); }
    SH.push(["19 noon on the bridge", T.s19, TW({ ...paint(BR, BP, BD, 38.1), to: paint(BR, BP, BD, 37.5, 0.4), dur: r3(Q - 0.1 - T.s19), ease: "inOut" }, { ...look20(34, 5.2, -2.0), to: look20(32, 5.1, -2.0), dur: r3(Q - 0.1 - T.s19), ease: "inOut" })]);
    // 19b the column falls, close: a long lens from the painter's spot (a crop of the painting, so the projection holds)
    const colCam = (fov, dy) => ({ pos: [r3(BR[0] + BP[0]), BP[1], r3(BR[1] + BP[2])], look: [r3(BR[0] + 31.5), r3(6.5 + dy), r3(BR[1] - 76.5)], fov });
    SH.push(["19b the column falls into the canal", Q - 0.1, { ...colCam(17, 0), to: colCam(15.5, -1.5), dur: r3(T.s20 - Q + 0.1), ease: "inOut" }]);
    for (const s0 of ["R", "L"]) c.arm(L(T.s20 - 0.45), "spud", s0, "rest", 0.35, "inOut");   // hands off the rail before he turns
    // 20 (28.7-31.2): they turn round to the citadel behind the deck and look up at it, mouths open
    for (const [id, yaw] of [["spud", -75], ["crew1", -80], ["crew2", -85]]) A(L(T.s20 - 0.02), id, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
    for (const id of ["spud", "crew1", "crew2"]) { look(T.s20, id, [0.1, 0.55], 0.01); expr(T.s20, id, "surprised", { open: 0.35 }, 0.01); }
    PR(T.s20, "col", { fall: 1, splash: 1 });
    place(T.s20, "crew1", W(BR, 5.5, -0.5), -80); place(T.s20, "crew2", W(BR, 6.9, 0.7), -85);   // they stepped back from the rail
    fx.push({ do: "shake", at: L(T.s20), dur: 1.8, amp: 0.025 });
    const aim20 = (fov) => ({ pos: [r3(BR[0] + BP[0]), BP[1], r3(BR[1] + BP[2])], look: [r3(BR[0] + 5.6), 0.75, r3(BR[1] - 1.2)], fov });
    SH.push(["20 they turn and look up", T.s20, TW({ ...aim20(22), to: aim20(19), dur: r3(T.s21 - T.s20), ease: "inOut" }, { ...look20(36, 4.6, -1.4), to: look20(33, 4.6, -1.4), dur: r3(T.s21 - T.s20), ease: "inOut" })]);
    sfx(L(T.s20), "rumble", { gain: 0.3, reason: "the rumble rolls on" });
  }

  // the clock (not over the map) and the clue tag on every frame of the block
  if (light !== "map") atlantisClock(c, F, T0 + from, 0, r3(to - from));
  clueTag(c, F, key === "b1" ? L(T.s14) : 0, r3(to - from), 2);

  const beats = c.beats(SH.map(([n, t, s, k]) => [n, L(t), s, k]), r3(to - from));
  return {
    title: `Where did Atlantis go? (block B, ${key})`,
    idea: "Ancient aliens EP03 block B (0:50-1:42): his headlamp clicks on and a red-gold bar flashes in the sand off Sicily ('This metal should not exist.'); clue 2, 2015: 39 bars in a 2,600-year-old wreck; orichalcum, the citadel wall at noon; the map west through the Pillars of Heracles; the first quake topples a column; the Atlantic is 4 km deep; real 1 or made up 2?",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set, music,
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: light === "under" ? "sand" : "stone", room: "open", guard: true },
    ...(key === "b1" && { hook: { show: ["spud"], hint: 0, what: "Under the sea off Sicily: Spud's headlamp clicks on and a red-gold bar flashes in the sand; 2015 on screen" } }),
    cast: light === "map" ? [] : cast, props, ...(fx.length && { fx }), captions: c.captions, beats, visible: c.visible,
    allowClip: light === "map" ? [] : [...lampClip(["spud"], r3(to - from))],
    notes: `Generated by storyboards/series/ancient-aliens/03-atlantis/block-b/make-block-b.mjs (${key}). Block B of four, block time ${from}-${to} s.`,
  };
}

const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
const ONLY = (process.argv.find((a) => /^b\d(,b\d)*$/.test(a)) ?? "b1,b2,b3,b4,b5").split(",");
for (const F of FRAMES) for (const [key] of PARTS) if (ONLY.includes(key)) write(import.meta.url, { id: `aa03-${key}-${F.key}`, ...F.sb(FAR.other), ...build(F, key) });
