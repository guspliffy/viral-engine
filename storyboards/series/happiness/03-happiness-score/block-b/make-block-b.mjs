// HAPPINESS 03 "I could see everyone's happiness score", BLOCK B "The more you look" (story 0:50-1:40, panels 13-24,
// Friday-Saturday night: frustration, obsession, loneliness). Brief: ../kit/BLOCKS.md; story: ../OUTLINE.md; look: ../DESIGN.md.
//   node storyboards/series/happiness/03-happiness-score/block-b/measure-lines.mjs   -> lines.json (narrator lengths)
//   (music: the film score kit SCORE(T0), Jonny 16 Nov; make-music-b.sh made the party bed kit/score.py takes the bossa from)
//   node storyboards/series/happiness/03-happiness-score/block-b/make-block-b.mjs    -> hs03-b{1..6}-wide.json
//   bash storyboards/series/happiness/03-happiness-score/block-b/join-block-b.sh wide draft   -> out/hs03-b-wide-draft.mp4
//
// One storyboard per place (block time t = story time - 50; each storyboard runs from its own 0):
//   b1 WALL     0.0- 3.7   view: his reflection in the hall mirror, 39 -> 38 (-1); 13 he tapes the newspaper over it
//   b2 KITCHEN  3.7- 7.0   14a he turns to the kettle; view: the kettle shows him, 38 -> 37; 14 he winces
//   b3 RAIN     7.0-12.0   15a he walks in the rain, eyes down; view: the puddle shows him, 37 -> 36; 15 he steps past, head away
//   b4 PARTY   12.0-41.2   16 Mash presses play, Chip + Wedge cheer; 17 they dance; 18 Spud by the window looks up; view 36 -> 35;
//                          19 Chip "Come on!", Spud "One sec." (finger up, not looking); view 35 -> 34; 20 beauty wide, the warmth
//                          stops at his corner (split); 21 view: the three tags; 21m Mash alone looks over, 88 -> 86 -> 84; 22 Spud watches, writes
//   b5 BALCONY 41.2-45.0   23 Mash alone on the balcony, the town below ("Because you weren't there.")
//   b6 AFTER   44.8-50.0   24 the room after the party: lights on, empty cups, Spud alone among the boxes, 31, quiet hold
// Every check is the DESIGN's two-shot unit (an outside shot, then a 0.9-1.1 s glasses view with his tag ticking down and the
// -1 leaving it); the ticks sit on the kit's SPUD times. Checks at 1:29 and 1:35 (22, 24) tick on the HUD chip only.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, SETS, SCORE, CAST, SPUD, SCORES, spudAt, at, hudFor, scoreGrade, GRADE_FIXED, narrate, say, WALL, ROOM, BALCONY, BAKERY } from "../kit/score-kit.mjs";
import { LINES } from "./lines.mjs";

const T0 = 50;   // story time of block time 0
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.4 + l.split(/\s+/).length / 2.6)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
// KOKORO=1: the Kokoro stand-in voice for staging checks before the VoxCPM2 narrator is installed (never for a sent draft)
const STANDIN = process.env.KOKORO ? { voice: "storyteller-deep", gain: 1.0 } : {};
const FAR = [40, 0];
const FARS = { spud: [40, 0], mash: [44, 0], chip: [48, 0], wedge: [52, 0] };   // off stage: one spot each (bodies never share one)
const BOSSA_AT = 12.6, BOSSA_BPM = 91.9;   // the party song in the film score (kit/score.py, from the block B bed): the dancers' beat

// ---------------------------------------------------------------- the block's beats (block time, s)
const T = {
  v13: 0, s13: 1.3, s14a: 3.7, v14: 4.6, s14: 5.6, s15a: 7.0, v15: 8.5, s15: 9.5,
  s16: 12.0, s17: 15.4, s18: 20.0, v18: 23.2, s19: 24.3, v19: 28.2, s20: 29.2, v21: 33.6, v21m: 35.6, s22: 38.8,
  s23: 41.2, s24: 45.0, END: 50.0,
};
const PARTS = [["b1", T.v13, T.s14a], ["b2", T.s14a, T.s15a], ["b3", T.s15a, T.s16], ["b4", T.s16, T.s23], ["b5", T.s23, T.s24], ["b6", T.s24, T.END]];
// the narrator (each line ends before the next voice starts; one voice at a time)
const AT = { n1: 1.5, n2: 3.9, n3: 13.0, n4: 29.5, n5: 35.8, n6: 41.6 };
// glasses views [from, to] (block time): every one holds a tick of SPUD (story 51, 55, 59, 74, 79) or Mash's (86, 88)
const VIEWS = [[T.v13, T.s13], [T.v14, T.s14], [T.v15, T.s15], [T.v18, T.s19], [T.v19, T.s20], [T.v21, T.s22]];   // 21 + 21m: one view, two shots

// a pinhole projection for the wide frame (split edge x): cam = { pos, look, fov (vertical) }
function project(cam, p, W = 1920, H = 1080) {
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const f = norm(sub(cam.look, cam.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, cam.pos);
  const z = dot(d, f), k = H / 2 / Math.tan((cam.fov * Math.PI) / 360);
  return [Math.round(W / 2 + (dot(d, r) / z) * k), Math.round(H / 2 - (dot(d, u) / z) * k)];
}
const cam = (pos, look, fov, to) => ({ pos, look, fov, ...(to && { to: { pos: to.pos ?? pos, look: to.look ?? look, fov: to.fov ?? fov }, dur: to.dur, ease: to.ease ?? "inOut" }) });

function build(F, key) {
  const [, from, to] = PARTS.find((p) => p[0] === key);
  const TS = T0 + from;                                   // story time of this storyboard's 0
  const L = (t) => r3(t - from);                          // block time -> clip time
  const c = clip({ faces: "strong" }), { A, sfx } = c;
  const PR = (t, id, set, dur = 0.01, ease = "linear") => c.prop(L(t), id, set, dur, ease);
  const place = (t, who, xz, yaw, y) => { const u = Math.max(0, r3(L(t) - 0.02)); A(u, who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(u, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const hide = (t, who) => place(t, who, FARS[who], 0, 0);
  const look = (t, who, dir, dur = 0.2) => A(L(t), who, "look", { to: dir, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(L(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const arm = (t, who, side, pose, dur, ease) => c.arm(L(t), who, side, pose, dur, ease);
  const inPart = (t) => t >= from - 1e-6 && t < to - 1e-6;
  const nar = (k) => { if (inPart(AT[k])) narrate(c, F, L(AT[k]), LINES[k], DUR[k], STANDIN); };
  const SH = [];   // [name, block time, camera]
  const G = [];    // grade keys [block time, value]
  const SPUDG = (t) => ({ ...scoreGrade(spudAt(T0 + t + 0.01)), c: 1.03, lift: 0 });
  const grade = (t, v) => G.push([t, v]);
  const views = VIEWS.filter(([a]) => inPart(a)).map(([a, b]) => [L(a), L(Math.min(b, to))]);
  const tags = [];
  const ownTag = (t0, t1, xy, k = 1) => tags.push({ who: "spud", keys: at(TS, SPUD), minus: true, show: [L(t0), L(t1)], xy, k, size: "close" });
  const props = [{ id: "gl-worn", kind: "scoreglasses", wear: "spud", x: 0, y: 0.640, z: 0.349, tip: 6, fold: 0, staged: "the glasses on Spud's nose (SCORE_FITS nose)" }];
  const cast = [{ id: "spud", character: CAST.spud, at: FARS.spud, face: 0, expr: "sad", follow: 0.2, seed: 1.3 }];
  const add = (id, ch, seed) => cast.push({ id, character: CAST[ch], at: FARS[id], face: 0, expr: "happy", follow: 0.2, seed });
  let set, sound = { surface: "wood", room: "small" };
  let music = SCORE(TS, { bpm: BOSSA_BPM, offset: r3(BOSSA_AT - from) });
  let split = null;

  // ================================================================= b1 WALL (0-3.7): the mirror
  if (key === "b1") {
    set = { ...SETS.wall, key: [-3, 4, 3] };
    const MY = 0.95;   // hung lower than WALL.mirror (1.1) so his raised glove reaches the last tape strip at chest-high reach
    props.push({ id: "mirror", kind: "wallmirror", x: WALL.mirror.x, y: MY, z: 0, cover: 0, reflect: 1, reflectView: "front", staged: "the hall mirror on the empty middle of the wall" });
    // view (0-1.3): through the glasses, the mirror shows him; his tag over the reflected head ticks 39 -> 38 at 1.0 (story 51)
    hide(0, "spud");
    PR(0, "mirror", { cover: 0, reflect: 1 }, 0);
    SH.push(["13v the mirror shows him, 39 -> 38", T.v13, cam([0.3, 0.9, 1.9], [0.3, 0.95, 0], 30)]);
    grade(T.v13, { glasses: true });
    ownTag(T.v13, T.s13, [960, 250]);
    // 13 (1.3-3.7): he slaps the newspaper over the glass and presses the last tape strip down, glasses on
    const SP = [0.12, 0.5];
    place(T.s13, "spud", SP, 180); look(T.s13, "spud", [0.2, 0.25], 0.01); expr(T.s13, "spud", "annoyed", { lid: 0.25 }, 0.01);
    PR(T.s13, "mirror", { cover: 0.45, reflect: 0 }, 0); PR(T.s13 + 0.05, "mirror", { cover: 0.7 }, 0.45, "out");
    const tape = [r3(WALL.mirror.x + 0.17), r3(MY - 0.122), 0.041];
    arm(T.s13 - 0.02, "spud", "R", { world: [tape[0], r3(tape[1] + 0.2), 0.17] }, 0.01);
    arm(T.s13 + 0.25, "spud", "R", { world: [tape[0], tape[1], 0.13], palm: true }, 0.3, "out");
    arm(T.s13 + 1.2, "spud", "R", { world: [tape[0] - 0.02, tape[1] + 0.03, 0.16] }, 0.18); arm(T.s13 + 1.38, "spud", "R", { world: [tape[0], tape[1], 0.13], palm: true }, 0.18, "out");
    arm(T.s13 + 2.0, "spud", "R", "rest", 0.4);
    sfx(L(T.s13 + 0.05), "kenney/book-flip", { gain: 0.35, reason: "the newspaper sheet slaps against the mirror" });
    grade(T.s13, SPUDG(T.s13));
    SH.push(["13 he tapes the newspaper over the mirror", T.s13, cam([1.65, 1.0, 1.55], [0.2, 0.85, 0.2], 38, { pos: [1.55, 0.99, 1.45], dur: T.s14a - T.s13 })]);
    nar("n1");
  }

  // ================================================================= b2 KITCHEN (3.7-7.0): the kettle
  if (key === "b2") {
    set = { ...SETS.kitchen };
    sound = { surface: "tile", room: "small" };
    const ST = [-0.3, -1.15], KT = [0.45, 0.95, -1.8], STOOL = 0.42, FACE = 85;   // turned toward the camera; his eyes go to the kettle
    props.push({ id: "stool", kind: "stool", x: ST[0], y: 0, z: ST[1], staged: "a kitchen stool he stands on to reach the hob (below the frame)" });
    props.push({ id: "kettle", kind: "kettle", x: KT[0], y: KT[1], z: KT[2], reflect: 0, reflectView: "front", reflectYaw: 12, reflectFov: 150, staged: "the steel kettle on the counter" });
    // the same kettle for the glasses view: its reflection aimed at his eyes (reflectYaw is a spec key, so a twin swapped on the cuts)
    props.push({ id: "kettleV", kind: "kettle", x: KT[0], y: KT[1], z: KT[2], reflect: 1, reflectView: "front", reflectYaw: -49, reflectFov: 150, scale: 0, staged: "the kettle seen through the glasses" });
    // 14a (3.7-4.6): he turns his head to the kettle
    place(T.s14a, "spud", ST, FACE, STOOL); look(T.s14a, "spud", [0.1, 0], 0.01); expr(T.s14a, "spud", "sad", { lid: 0.2 }, 0.01);
    look(T.s14a + 0.35, "spud", [0.75, 0.15], 0.3);
    grade(T.s14a, SPUDG(T.s14a));
    SH.push(["14a he turns to the kettle", T.s14a, cam([1.45, 1.36, 0.35], [0.05, 1.2, -1.45], 30, { pos: [1.4, 1.35, 0.27], look: [0.05, 1.21, -1.45], dur: T.v14 - T.s14a })]);
    // view (4.6-5.6): the kettle's curve shows him, glasses and all: 38 -> 37 at 5.0 (story 55)
    hide(T.v14, "spud");
    PR(T.v14, "kettle", { scale: 0 }, 0); PR(T.v14, "kettleV", { scale: 1 }, 0);
    grade(T.v14, { glasses: true });
    SH.push(["14v the kettle shows him, 38 -> 37", T.v14, cam([-0.15, 1.06, -1.3], [0.45, 1.04, -1.8], 28)]);
    ownTag(T.v14, T.s14, [940, 260]);
    // 14 (5.6-7.0): back in colour, he winces at himself in the kettle
    place(T.s14, "spud", ST, FACE, STOOL); look(T.s14, "spud", [0.75, 0.15], 0.01);
    expr(T.s14, "spud", "annoyed", { lid: 0.45 }, 0.01); expr(T.s14 + 0.25, "spud", "sad", { lid: 0.5 }, 0.3);
    PR(T.s14, "kettle", { scale: 1, reflect: 0.9 }, 0); PR(T.s14, "kettleV", { scale: 0 }, 0);
    grade(T.s14, SPUDG(T.s14));
    SH.push(["14 he winces at his reflection", T.s14, cam([1.35, 1.34, 0.2], [0.1, 1.18, -1.5], 28, { pos: [1.3, 1.33, 0.12], look: [0.1, 1.19, -1.5], dur: T.s15a - T.s14 })]);
    nar("n2");
  }

  // ================================================================= b3 RAIN (7.0-12.0): the puddle
  if (key === "b3") {
    set = { ...SETS.bakeryRain, life: { rain: { n: 1, speed: 9, len: 0.01 }, wind: false } };   // life.rain = the rain hiss in the sound bed; the picture's rain is the rainfall prop (none under the awning)
    sound = { surface: "wet", room: "open" };
    const PD = BAKERY.puddles[1];   // the pavement puddle (x -3.3, z 1.5, d 1.0)
    props.push({ id: "rain", kind: "rainfall", box: [[-9, 0, 0.85], [2, 4, 3.0]], n: 260, staged: "rain over the street, none under the awning" });
    props.push({ id: "refl", kind: "reflectcard", as: "puddle", view: "front", w: 0.75, x: PD.x, y: 0.004, z: PD.z, tip: -90, rot: -90, op: 0, staged: "his reflection in the puddle, glasses and all" });
    // 15a (7.0-8.5): he walks along the wet pavement toward the puddle, eyes down
    const Z = PD.z;
    place(T.s15a, "spud", [-1.4, Z], -90); expr(T.s15a, "spud", "sad", { lid: 0.35 }, 0.01); look(T.s15a, "spud", [0, -0.35], 0.01);
    A(L(T.s15a + 0.05), "spud", "move", { to: [-2.55, Z], dur: 1.4, ease: "linear" });
    grade(T.s15a, SPUDG(T.s15a));
    SH.push(["15a he walks in the rain", T.s15a, cam([-0.6, 0.62, 4.3], [-2.2, 0.5, 1.5], 38, { pos: [-0.9, 0.62, 4.3], dur: T.v15 - T.s15a })]);
    // view (8.5-9.5): looking down, the puddle shows him; 37 -> 36 at 9.0 (story 59)
    hide(T.v15, "spud");
    PR(T.v15, "refl", { op: 1 }, 0); PR(T.v15, "rain", { scale: 0 }, 0); PR(T.s15, "rain", { scale: 1 }, 0);   // no streaks across the lens
    grade(T.v15, { glasses: true });
    SH.push(["15v the puddle shows him, 37 -> 36", T.v15, cam([-2.2, 1.1, Z], [-3.35, 0, Z], 34)]);
    ownTag(T.v15, T.s15, [960, 300]);
    // 15 (9.5-12.0): he steps past the puddle with his head turned away; the reflection is still there
    place(T.s15, "spud", [-2.75, Z], -90); look(T.s15, "spud", [0.6, 0.05], 0.01); expr(T.s15, "spud", "sad", { lid: 0.4 }, 0.01);
    A(L(T.s15 + 0.05), "spud", "move", { to: [-4.6, Z], dur: 2.4, ease: "linear" });
    PR(T.s15, "refl", { op: 0.8 }, 0); PR(T.s15 + 1.0, "refl", { op: 0 }, 0.9);
    grade(T.s15, SPUDG(T.s15));
    SH.push(["15 he steps past the puddle, head away", T.s15, cam([-3.0, 0.5, 3.6], [-3.4, 0.25, 1.4], 44, { pos: [-3.1, 0.5, 3.5], dur: T.s16 - T.s15 })]);
  }

  // ================================================================= b4 PARTY (12.0-42.6)
  if (key === "b4") {
    set = { ...SETS.party };
    add("mash", "mash", 2.1); add("chip", "chip", 3.1); add("wedge", "wedge", 4.1);
    const SPK = { x: -2.3, z: -0.4 }, BOX = 0.45;   // a low box: his arm reaches down over it (a chest-high box put his elbow in it)
    props.push({ id: "spkbox", kind: "cardbox", closed: true, x: SPK.x, y: 0, z: SPK.z, w: 0.5, d: 0.42, h: BOX, staged: "a closed moving box as the speaker's table" });
    props.push({ id: "speaker", kind: "speaker", x: SPK.x, y: BOX, z: SPK.z, rot: 35, lit: 0, staged: "the little speaker on the box" });
    props.push({ id: "lights", kind: "stringlights", points: [[-3.1, 2.32, -2.3], [-2.2, 2.42, -0.6], [-1.3, 2.26, -2.3], [-0.4, 2.42, -0.5], [0.8, 2.3, -2.3]], bulbs: 5, sag: 0.14, lit: 1, staged: "warm string lights over the dancers' side only" });
    const SPOT = { chip: [-1.7, -1.25], wedge: [-0.8, -0.8], mash: [0.25, -0.7] }, SPS = [2.3, -1.3];   // ROOM.spots "20 party wide", Chip 0.6 m in from the speaker box
    // 16 (12.0-15.4): Mash presses play, Chip and Wedge cheer
    const M16 = [-1.62, -0.05], C16 = [-1.15, -1.15], W16 = [-0.05, -0.9];
    place(T.s16, "mash", M16, -40); place(T.s16, "chip", C16, 20); place(T.s16, "wedge", W16, -15);
    expr(T.s16, "mash", "serene", { lid: 0.5 }, 0.01); look(T.s16, "mash", [0, -0.3], 0.01);
    const BTN = [0.105, 0.09, 0.075];
    arm(T.s16 + 0.15, "mash", "R", { prop: "speaker", grip: [BTN[0], BTN[1] + 0.04, BTN[2] + 0.06] }, 0.35, "out");
    PR(T.s16 + 0.55, "speaker", { lit: 1 }, 0.1);
    sfx(L(T.s16 + 0.5), "kenney/switch", { gain: 0.3, reason: "the speaker's play button clicks" });
    arm(T.s16 + 1.0, "mash", "R", "rest", 0.4);
    for (const [who, d] of [["chip", 0.75], ["wedge", 0.9]]) { arm(T.s16 + d, who, "R", { o: [0.12, 1.05, 0.1] }, 0.3, "out"); arm(T.s16 + d + 0.05, who, "L", { o: [0.12, 1.05, 0.1] }, 0.3, "out"); expr(T.s16 + d, who, "delighted", null, 0.2); }
    A(L(T.s16 + 1.6), "chip", "dance", { do: "bounce", dur: 1.7, amp: 1 }); A(L(T.s16 + 1.7), "wedge", "dance", { do: "bounce", dur: 1.6, amp: 0.8 });
    A(L(T.s16 + 1.3), "mash", "turn", { to: 10, dur: 0.6 }); expr(T.s16 + 1.3, "mash", "happy", { lid: 0.5 }, 0.3);
    grade(T.s16, { ...GRADE_FIXED.partyWarm, c: 1.03, lift: 0 });
    SH.push(["16 Mash presses play, Chip and Wedge cheer", T.s16, cam([-1.0, 1.05, 2.1], [-1.4, 0.78, -0.5], 46, { pos: [-1.08, 1.03, 1.95], dur: T.s17 - T.s16 })]);
    nar("n3");
    // 17 (15.4-20.0): they dance between the boxes
    place(T.s17, "chip", SPOT.chip.slice(0, 2), 20); place(T.s17, "wedge", SPOT.wedge.slice(0, 2), 0); place(T.s17, "mash", SPOT.mash.slice(0, 2), -20);
    for (const w of ["chip", "wedge"]) { arm(T.s17, w, "R", "rest", 0.01); arm(T.s17, w, "L", "rest", 0.01); }
    A(L(T.s17), "chip", "dance", { do: "point", dur: 4.5, amp: 1 }); A(L(T.s17), "wedge", "dance", { do: "roof", dur: 4.5, amp: 0.8 }); A(L(T.s17), "mash", "dance", { do: "bounce", dur: 4.5, amp: 0.6 });
    for (const w of ["chip", "wedge", "mash"]) expr(T.s17, w, w === "mash" ? "happy" : "delighted", null, 0.01);
    SH.push(["17 they dance", T.s17, cam([-0.95, 1.05, 2.3], [-0.95, 0.75, -0.8], 46, { pos: [-0.8, 1.02, 2.0], dur: T.s18 - T.s17 })]);
    // the dancers keep dancing through 18-20 (off screen in 18-19); 21 Mash stops and looks over
    for (const [w, d] of [["chip", "point"], ["wedge", "roof"], ["mash", "bounce"]]) A(L(T.s18), w, "dance", { do: d, dur: r3(w === "chip" ? T.s19 - T.s18 : T.v21 - T.s18 + (w === "mash" ? 1.4 : 5.2)), amp: w === "mash" ? 0.6 : 0.9 });
    // 18 (20.0-23.2): Spud by the dark window, glasses on, looks up above his own head
    place(T.s18, "spud", SPS, -37); expr(T.s18, "spud", "sad", { lid: 0.2 }, 0.01); look(T.s18, "spud", [-0.4, 0.1], 0.01);
    look(T.s18 + 1.4, "spud", [0, 0.85], 0.35);
    grade(T.s18, SPUDG(T.s18));
    SH.push(["18 Spud by the window looks up", T.s18, cam([1.15, 0.85, 0.35], [2.35, 0.78, -1.35], 38, { pos: [1.25, 0.85, 0.2], dur: T.v18 - T.s18 })]);
    // view (23.2-24.3): looking up at the beams, his tag ticks 36 -> 35 at 24.0 (story 74)
    hide(T.v18, "spud");
    grade(T.v18, { glasses: true });
    SH.push(["18v he checks: 36 -> 35", T.v18, cam([2.3, 0.75, -1.3], [0.2, 2.45, -1.2], 50)]);
    ownTag(T.v18, T.s19, [960, 820]);
    // 19 (24.3-28.2): Chip comes over, "Come on!"; Spud holds up one finger, "One sec.", eyes up, not looking at Chip
    const C19 = [1.5, -0.8];
    place(T.s19, "spud", SPS, -37); look(T.s19, "spud", [0, 0.6], 0.01); expr(T.s19, "spud", "focused", { lid: 0.2 }, 0.01);
    place(T.s19, "chip", C19, 70); expr(T.s19, "chip", "eager", null, 0.01); look(T.s19, "chip", [0.1, 0.05], 0.01);
    arm(T.s19 - 0.02, "chip", "R", "rest", 0.01); arm(T.s19 - 0.02, "chip", "L", "rest", 0.01);
    A(L(T.s19 + 0.1), "chip", "dance", { do: "bounce", dur: 0.9, amp: 0.7 });
    arm(T.s19 + 0.2, "chip", "L", { o: [0.2, 0.42, 0.3] }, 0.25, "out"); arm(T.s19 + 0.55, "chip", "L", { o: [0.08, 0.36, 0.18] }, 0.25); arm(T.s19 + 0.85, "chip", "L", { o: [0.2, 0.42, 0.3] }, 0.25);
    say(c, F, L(T.s19 + 0.3), "chip", "Come on!", 0.9, "excited");
    arm(T.s19 + 1.5, "spud", "R", { o: [0.02, 0.7, 0.3] }, 0.3, "out");
    say(c, F, L(T.s19 + 1.6), "spud", "One sec.", 0.8, "calm");
    arm(T.s19 + 2.9, "spud", "R", "rest", 0.35);
    arm(T.s19 + 2.4, "chip", "L", "rest", 0.3); expr(T.s19 + 2.4, "chip", "sad", null, 0.3); look(T.s19 + 2.4, "chip", [-0.3, -0.2], 0.3);
    look(T.s19 + 2.9, "spud", [0, 0.85], 0.3);
    grade(T.s19, SPUDG(T.s19));
    SH.push(["19 Chip pulls him to the dance, 'One sec.'", T.s19, cam([1.75, 0.92, 1.05], [1.92, 0.62, -1.1], 38, { pos: [1.78, 0.92, 0.95], dur: T.v19 - T.s19 })]);
    // view (28.2-29.2): he checks again, 35 -> 34 at 29.0 (story 79)
    hide(T.v19, "spud"); hide(T.v19, "chip");
    grade(T.v19, { glasses: true });
    SH.push(["19v he checks: 35 -> 34", T.v19, cam([2.3, 0.75, -1.3], [-0.4, 2.4, -0.9], 50)]);
    ownTag(T.v19, T.s20, [960, 820]);
    // 20 (29.2-33.6): the beauty wide from the doorway: gold on the dancers, Spud's corner cool, the edge on the floor at x 1.35
    place(T.s20, "spud", SPS, -30); place(T.s20, "chip", SPOT.chip.slice(0, 2), 20);
    look(T.s20, "spud", [0, 0.7], 0.01); expr(T.s20, "spud", "sad", { lid: 0.3 }, 0.01);
    A(L(T.s20), "chip", "dance", { do: "point", dur: r3(T.s22 - T.s20), amp: 0.9 }); expr(T.s20, "chip", "delighted", null, 0.01);
    const C20 = cam([-2.6, 1.25, 2.4], [0.5, 1.0, -1.6], 50, { fov: 48.6, dur: T.v21 - T.s20 });
    grade(T.s20, SPUDG(T.s20));
    const ex = project(C20, [1.35, 0.5, -1.4]);
    split = { from: L(T.s20), to: L(T.v21), x: ex[0], soft: 110, s: GRADE_FIXED.partyWarm.s, w: GRADE_FIXED.partyWarm.w };
    SH.push(["20 the warmth stops at his corner", T.s20, C20]);
    nar("n4");
    // 21 view (33.6-38.8): from his corner: Chip 93, Wedge 82, Mash 88 in the middle; Mash stops, looks over: 86 (story 86), 84 (88)
    hide(T.v21, "spud");
    // spread for his corner's view: Chip + Wedge in the left lens, Mash alone in the right lens (nobody hides another)
    const D21 = { chip: [-2.3, 0.9], wedge: [-1.2, -0.35], mash: [-0.5, -1.5] };
    for (const w of ["chip", "wedge", "mash"]) place(T.v21, w, D21[w], w === "mash" ? 40 : 60);
    A(L(T.v21 + 1.2), "mash", "turn", { to: 80, dur: 0.6 }); look(T.v21 + 1.3, "mash", [0.25, 0.05], 0.3); expr(T.v21 + 1.4, "mash", "sad", { lid: 0.35 }, 0.5);
    grade(T.v21, { glasses: true });
    SH.push(["21v the party through the glasses: Chip 93, Wedge 82, Mash 88", T.v21, cam([2.05, 0.74, -1.15], [-0.9, 0.85, -0.7], 42, { fov: 41, dur: T.v21m - T.v21 })]);
    // 21m (35.6-38.8): Mash ALONE, a long lens from his corner (Jonny 16 Nov: whose number fell was not clear): Mash looks over at him,
    // only his tag in view, 88 -> 86 (story 86) -> 84 (story 88) under "And for the first time, his number went down."
    SH.push(["21m Mash alone: 88 -> 86 -> 84", T.v21m, cam([2.05, 0.74, -1.15], [-0.41, 1.26, -0.86], 34, { fov: 32, dur: T.s22 - T.v21m })]);   // Mash in the right lens
    place(T.v21m, "chip", [-1.5, 2.3], 60); place(T.v21m, "wedge", [-0.6, 2.2], 60);   // danced off to the left, out of this view
    tags.push({ who: "chip", keys: [[0, SCORES.chip]], show: [L(T.v21), L(T.v21m)] });
    tags.push({ who: "wedge", keys: [[0, SCORES.wedge]], show: [L(T.v21), L(T.v21m)] });
    tags.push({ who: "mash", keys: at(TS, SCORES.mash), show: [L(T.v21), L(T.s22)], k: 1.15 });
    // 22 (38.8-41.2): close: Spud watches Mash with narrowed eyes and writes in his pad, not walking over
    place(T.s22, "spud", SPS, -55); expr(T.s22, "spud", "focused", { lid: 0.45, brow: 0.35 }, 0.01); look(T.s22, "spud", [-0.45, 0.05], 0.01);
    const PAD = { id: "pad", kind: "spudpad", ...grips.placeFor("spudpad", [r3(SPS[0] - 0.3), 0.27, r3(SPS[1] + 0.28)], -55), tip: -30, write: 1, lines2: ["MASH = 86", "MASH = 88 ??"], note: "88 -> 84 ?" };
    props.push({ ...PAD, x: FAR[0], staged: "his detective pad, held low at his chest" });
    PR(T.s22 - 0.03, "pad", { x: PAD.x, y: PAD.y, z: PAD.z, rot: PAD.rot, tip: PAD.tip, write: 1 }, 0);
    const hPad = grips.phone(c, "spud", PAD, { side: "L", height: 0.2 });
    arm(T.s22 - 0.02, "spud", "L", { prop: "pad", grip: hPad.hands.L.grip, palm: true }, 0.01); A(L(T.s22 - 0.02), "spud", "grip", { side: "L", shape: "hold", dur: 0.01 });
    A(L(T.s22 - 0.01), "spud", "grab", { prop: "pad", hand: "L", grip: hPad.hands.L.grip, dur: 0, pose: null });
    PR(T.s22 + 0.4, "pad", { write: 2 }, 1.5, "linear");
    for (let i = 0; i < 4; i++) arm(T.s22 + 0.4 + i * 0.36, "spud", "R", { prop: "pad", grip: [r3(-0.03 + (i % 2) * 0.05), r3(0.11 - i * 0.012), 0.045] }, 0.4);
    arm(T.s22 + 1.9, "spud", "R", "rest", 0.35);
    grade(T.s22, SPUDG(T.s22));
    SH.push(["22 he watches Mash and writes", T.s22, cam([1.0, 0.98, 0.25], [2.25, 0.8, -1.3], 34, { pos: [1.06, 0.97, 0.17], look: [2.25, 0.81, -1.3], dur: T.s23 - T.s22 })]);
    nar("n5");
    sound = { surface: "wood", room: "small" };
  }

  // ================================================================= b5 BALCONY (41.2-45.0): Mash alone
  if (key === "b5") {
    set = { ...SETS.balcony };
    sound = { surface: "stone", room: "open" };
    add("mash", "mash", 2.1);
    const MB = BALCONY.stand.panel23;
    place(T.s23, "mash", [MB[0], MB[1]], 60); expr(T.s23, "mash", "sad", { lid: 0.4 }, 0.01); look(T.s23, "mash", [0.1, -0.05], 0.01);
    for (const s of ["L", "R"]) arm(T.s23, "mash", s, { o: [-0.06, 0.34, 0.27] }, 0.01);
    hide(T.s23, "spud");
    grade(T.s23, { ...GRADE_FIXED.balcony, c: 1.03, lift: 0 });
    SH.push(["23 Mash alone on the balcony", T.s23, cam([1.3, 1.55, 4.3], [0.2, 1.0, -0.8], 46, { pos: [1.2, 1.53, 4.0], dur: T.s24 - T.s23 })]);
    nar("n6");
    sound.nature = [{ id: "wind", gain: 0.04 }];
  }

  // ================================================================= b6 AFTER (44.8-50.0): Spud alone among the boxes
  if (key === "b6") {
    set = { ...SETS.party };
    props.push({ id: "lights", kind: "stringlights", points: [[-3.1, 2.32, -2.3], [-2.2, 2.42, -0.6], [-1.3, 2.26, -2.3], [-0.4, 2.42, -0.5], [0.8, 2.3, -2.3]], bulbs: 5, sag: 0.14, lit: 1, staged: "the string lights still on" });
    const BOXES = [[-1.0, -0.6, 0.45], [0.0, -1.4, 0.5], [2.1, -0.2, 0.42], [-0.3, 1.2, 0.4], [2.2, 1.0, 0.45]];
    BOXES.forEach(([x, z, h], i) => {
      props.push({ id: `bx${i}`, kind: "cardbox", closed: true, x, y: 0, z, w: 0.55, d: 0.45, h, rot: (i * 23) % 40 - 20, staged: "a closed moving box used as a table" });
      props.push({ id: `cup${i}`, kind: "partycup", x: r3(x + 0.1), y: h, z: r3(z + 0.05), staged: "an empty red party cup left on the box" });
    });
    props.push({ id: "cupF", kind: "partycup", lie: true, x: 1.6, y: 0, z: 1.1, rot: 30, staged: "a cup knocked over on the floor" });
    props.push({ id: "spkbox", kind: "cardbox", closed: true, x: -1.6, y: 0, z: -1.7, w: 0.5, d: 0.42, h: 0.5, staged: "the speaker's box" });
    props.push({ id: "speaker", kind: "speaker", x: -1.6, y: 0.5, z: -1.7, rot: 15, lit: 0, staged: "the speaker, off" });
    const SP = [1.0, 0.55];
    place(T.s24, "spud", SP, -10); expr(T.s24, "spud", "sad", { lid: 0.45 }, 0.01); look(T.s24, "spud", [0, 0.6], 0.01);
    look(T.s24 + 0.9, "spud", [0.15, -0.3], 0.6);
    grade(T.s24, SPUDG(T.s24 + 0.3));
    SH.push(["24 the room after the party, Spud alone", T.s24, cam([0.0, 1.05, 2.35], [1.0, 0.62, -0.2], 48, { pos: [0.05, 1.04, 2.2], fov: 46, dur: T.END - T.s24 })]);
    sound = { surface: "wood", room: "small" };
  }

  const beats = c.beats(SH.map(([n, t, s]) => [n, L(t), s]), r3(to - from));
  return {
    title: `I could see everyone's happiness score (block B, ${key})`,
    idea: "Happiness 03 block B (0:50-1:40): Spud tapes over his mirror and still sees himself in the kettle and a puddle (38, 37, 36); at Mash's goodbye party he keeps checking instead of dancing (35, 34, 33, 32), the warmth stops at his corner; Mash looks over and his number falls 88, 86, 84 because Spud isn't there; Mash alone on the balcony; Spud alone among the boxes, 31.",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set, music,
    sound: { signature: false, sfx: 0.65, ambience: 0.06, guard: true, ...sound },
    hud: hudFor(TS, T0 + to),
    grade: G.map(([t, v]) => [Math.max(0, L(t)), v]),
    ...(split && { split }),
    score: { view: views, tags },
    cast, props, captions: c.captions, beats, visible: c.visible,
    notes: `Generated by storyboards/series/happiness/03-happiness-score/block-b/make-block-b.mjs (${key}). Block B of four, block time ${from}-${to} s (story ${T0 + from}-${T0 + to}).`,
  };
}

const ONLY = (process.argv.find((a) => /^b\d(,b\d)*$/.test(a)) ?? PARTS.map((p) => p[0]).join(",")).split(",");
for (const [key] of PARTS) if (ONLY.includes(key)) write(import.meta.url, { id: `hs03-${key}-wide`, ...FRAME.wide.sb, ...build(FRAME.wide, key) });
