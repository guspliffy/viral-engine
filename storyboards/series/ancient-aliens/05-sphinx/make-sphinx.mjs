// EGYPT EP05 "How old is the Sphinx really?" (tall, ~67.5 s natural, ~60 s after the 1.05x / 1.15x speed-up): the first DEBATE
// episode (Jonny 19 Nov 2026): Spud = the ancient-alien believer, the archaeologist = the evidence. No Pharaoh, no names on screen.
// Story + panels: /mnt/project-files/videos/ancient-aliens/05-sphinx/STORY.md (24 panels on sheets/sphinx-05-sheet-1b.png + -2.png),
// design: DESIGN.md here (GPT-6.2 Sol). Lines: lines.mjs (measured in lines.json). The cast light is one value per storyboard, so the
// episode is NINE segment storyboards cut together on story time, each with its slice of the one score (score.py -> aa05-score.ogg):
//   0 day     0-8.9    P01-04  the grooved wall, the paws, "Rain did this"
//   1 storm   8.9-12   P05-06  Spud's version: green savanna in the rain, water cutting the grooves
//   2 day     12-25.7  P07-10  salt: the flake, the salt slice, the hard head, "the secret room?"
//   3 hall    25-27.7  P11     Spud's version: the hall of records under the paw
//   4 day     27-42.4  P12-17  the survey, "Yet.", the temple, the past quarry and haul, the stripes match
//   5 sunset  42-56.38 P18-21 Khafre's temple next door (past), the unfinished blocks, Spud turns back, the Sphinx's gaze
//   6 night   53.4-57.4 P22   the Lion rising in the Sphinx's gaze
//   7 dusk    58.3-60.6 P23    no answer
//   8 dawn    60.6-63.6 P24    both between the paws, "WHO'S RIGHT?"
// (each segment's times are its own story seconds; in the film they follow one another: SPANS / START, 67.5 s natural)
//   node storyboards/series/ancient-aliens/05-sphinx/make-sphinx.mjs [--seg=0,2]   -> eg05-<seg>-tall.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import * as grips from "../../../lib/grips.mjs";
import { hat } from "../kit/aa-kit.mjs";
import { LINES } from "./lines.mjs";
import { VOICE } from "./voice.mjs";

const MEASURED = new URL("./lines.json", import.meta.url);
// lines that run across a scene join, cut in two at their own pause (split-lines.mjs): "<key>:1" ends a segment, "<key>:2" opens the next
const SPL = JSON.parse(readFileSync(new URL("./splits.json", import.meta.url), "utf8"));
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l[1].split(/\s+/).length * 0.36)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const CAST = { spud: "potatobrawl/spud", arch: "ancient-aliens/archaeologist", wa: "ancient-aliens/worker-a", wb: "ancient-aliens/worker-b", chip: "potatobrawl/chip", wedge: "potatobrawl/wedge" };
const F = { key: "tall", sb: { far: 300 }, W: 1080, H: 1920, SUB: 400, subSize: 62, NUM: 265, numSize: 120, tag: { y: 240, x: 250, size: 44 } };

// ---- light (one per storyboard). keyOf: az 225 = the key from the south-east (morning), 90 = from the west, 270 = from the east
const keyOf = ([az, el]) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [r3(-Math.sin(a) * Math.cos(e) * 10), r3(Math.sin(e) * 10), r3(-Math.cos(a) * Math.cos(e) * 10)]; };
const light = (color, sun, o) => ({ type: "plain", color, floor: "none", lighting: { v: 2, measure: false, ao: 0, key: keyOf(sun), ...o } });
const DAY = light("#88bbe3", [225, 40], { light: "#fff4dc", shadow: "#7f8fc0", exposure: 1.0 });
const STORM = light("#5a6a74", [225, 55], { light: "#c2ccd2", shadow: "#46525e", exposure: 0.82 });
const HALL = light("#120d08", [200, 35], { light: "#ffc27a", shadow: "#2a2030", exposure: 0.85 });
const SUNSET = light("#eb9775", [90, 6], { light: "#ffb070", shadow: "#5a4a7a", exposure: 0.92 });
const NIGHT = light("#0b1438", [270, 30], { light: "#8fa6d8", shadow: "#1c2550", exposure: 0.62 });
const DUSK = light("#6a5a8a", [90, 5], { light: "#e6a076", shadow: "#3e3a66", exposure: 0.78 });
const DAWN = light("#f0b98a", [270, 3], { light: "#ffd29c", shadow: "#6a5a8a", exposure: 0.95 });
const score = (storyTime) => ({ file: "ancient-aliens/aa05-score.ogg", from: 0, skip: storyTime, gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, mood: "dramatic" });
const SOUND = { signature: false, sfx: 0.6, ambience: 0.06, surface: "sand", room: "open", guard: true };

// ---- the segments' spans in their own story seconds [t0, t1] (times inside a segment are written from its t0). Rough draft 2
// (Jonny 19 Nov: lines were cut at the joins, Spud now talks at her pace) made some longer than story 1; each starts in the
// film (and the score) where the one before ends: START.
const SPANS = [[0, 8.9], [8.9, 12.0], [12.0, 25.7], [25.0, 27.7], [27.0, 42.4], [42.0, 56.38], [53.4, 57.4], [58.3, 60.6], [60.6, 63.6]];
const START = SPANS.map((_, i) => r3(SPANS.slice(0, i).reduce((a, [x, y]) => a + y - x, 0)));
// ---- one segment: its own clip, its times written in story seconds (t0 = the segment's first frame; its music slice starts at START)
function segment(n, fill) {
  const [t0, t1] = SPANS[n];
  const c = clip({ faces: "strong" }), T = (t) => r3(t - t0);
  const S = {
    c, F, T, END: r3(t1 - t0),
    A: (t, who, what, o) => c.at(T(t), { who, do: what, ...o }),
    place(t, who, xz, yaw, y = 0) { S.A(t - 0.02, who, "move", { to: xz, y, dur: 0.01, steps: 0, ease: "linear", sync: true }); S.A(t - 0.02, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); },
    walk: (t, who, xz, dur, o = {}) => S.A(t, who, "move", { to: xz, dur, ...o }),
    turn: (t, who, yaw, dur = 0.4) => S.A(t, who, "turn", { to: yaw, dur, ease: "inOut" }),
    look: (t, who, to, dur = 0.2) => S.A(t, who, "look", { to, dur, blink: false }),
    expr: (t, who, e, set, dur = 0.15) => S.A(t, who, "expr", { expr: e, ...(set && { set }), dur }),
    arm: (t, who, side, pose, dur = 0.35, ease = "inOut") => c.arm(T(t), who, side, pose, dur, ease),
    prop: (t, id, set, dur = 0.01, ease = "linear") => c.prop(T(t), id, set, dur, ease),
    sfx: (t, s, o = {}) => c.sfx(T(t), s, o),
    // a spoken line + its kinetic subtitle in the upper third; hold = how long the subtitle stays after the voice
    say(t, k, next) {
      const [who, line, tone, take] = LINES[k], d = DUR[k], hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - d - 0.05)));
      c.at(T(t), { macro: "say", who, line, tone, dur: d, voice: VOICE[who], caption: false, ...(take && { take }) });
      c.cap(T(t), T(t + d + hold), line, F.SUB, false, { size: F.subSize });
      return r3(t + d);
    },
    // a line cut at a join (SPL): its first part ends this segment (placed so the second part starts 0.03 s into the next one,
    // the take's own pause between them), its second part opens the next segment
    tail(k) {
      const a = SPL[`${k}:1`], rel = r3(S.END + 0.03 - SPL[`${k}:2`].off);
      c.at(rel, { macro: "say", who: a.who, line: a.line, rec: a.file, age: "age-none", dur: a.dur, caption: false });
      c.cap(rel, S.END, a.line, F.SUB, false, { size: F.subSize });
      return r3(t0 + rel);
    },
    head(k, next) {
      const b = SPL[`${k}:2`];
      c.at(0.03, { macro: "say", who: b.who, line: b.line, rec: b.file, age: "age-none", dur: b.dur, caption: false });
      c.cap(0.03, Math.min(S.END, r3(0.03 + b.dur + 0.4), next == null ? S.END : r3(next - t0 - 0.05)), b.line, F.SUB, false, { size: F.subSize });
    },
    num: (a, b, text, { y = 1000, ...o } = {}) => c.cap(T(a), T(b), text, y, false, { size: F.numSize, kinetic: false, ...o }),
    label: (a, b, text) => c.cap(T(a), T(b), text, F.tag.y, false, { style: "label", size: F.tag.size, kinetic: false, x: F.W / 2 }),
    shots: [],
    shot(name, t, cam, kind) { S.shots.push([name, T(t), cam, kind]); },
  };
  const o = fill(S);
  const beats = c.beats(S.shots, S.END);
  return { ...o, fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
    motion: MOTION, rig: RIG, physics: false, loopIdle: false, music: score(START[n]), captions: c.captions, beats, visible: c.visible, sound: o.sound ?? SOUND };
}
const cam = (pos, look, fov, to, dur, ease = "inOut") => ({ pos, look, fov, ...(to && { to, dur, ease }) });
const PARK = (i) => [90 + i * 2, 90];

// ---- the brush: her conservation brush in the right hand from the segment's first frame (the archaeologist test's rest hold:
// hand by the right hip, bristles down and 25 deg forward; grips.mug = a fist on the lower handle). rig.hold 2 keeps it rigid in the hand.
const HAND = [-0.46, 0.22, 0.3], TIP = 25, TA = (TIP * Math.PI) / 180;
const rotY = ([x, y, z], d) => { const a = (d * Math.PI) / 180; return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
function brush(S, [x, z], yaw, t) {
  const p = rotY([HAND[0], HAND[1] - 0.165 * Math.cos(TA), HAND[2] + 0.165 * Math.sin(TA)], yaw);
  const spec = { id: "brush", kind: "archbrush", tip: TIP, ...grips.placeFor("archbrush", [x + p[0], p[1], z + p[2]], yaw), staged: "already in her hand: the fist closes on it in the first frames" };
  grips.mug(S.c, "arch", spec, { side: "R" }).take(S.T(t), { reach: 0.3, settle: 0.15 });
  return spec;
}

// ---- Giza today: the Sphinx in its pit, the temple ruins, the pyramids at 0.22 (DESIGN 2, 5). World: +x east, -z north, pit floor y 0
const SKY = (time, x = 10, z = 0, o = {}) => ({ id: "sky", kind: "aasky", x, z, time, ...o });
const GROUND = (o = {}) => ({ id: "ground", kind: "gizaplateau", x: 0, y: -0.1, z: 0, seed: 1, rubble: 0, clear: 40, staged: "the plateau ground itself", ...o });
const SPHINX = (o = {}) => ({ id: "sphinx", kind: "sphinx", x: 0, y: 0, z: 0, stele: true, flakeAt: [5.4, 0.5, 3.22], staged: "carved out of the bedrock: its body is the pit's rock", ...o });
const PIT = (o = {}) => ({ id: "pit", kind: "sphinxpit", x: 0, y: 0, z: 0, staged: "the enclosure itself (floor, walls, terrace)", ...o });
const TEMPLE = (o = {}) => ({ id: "temple", kind: "sphinxtemple", x: 0, y: 0, z: 0, era: "ruin", staged: "the temple ruin on the terrace in front of the Sphinx", ...o });
const VALLEY = (o = {}) => ({ id: "valley", kind: "khafrevalley", x: 0, y: 0, z: 0, staged: "Khafre's valley temple next door", ...o });
const PYRAMIDS = (o = {}) => ({ id: "pyramids", kind: "gizatoday", x: -37.5, y: 4.8, z: -89.9, s: 0.22, sunAz: 120, staged: "far scenery on the plateau behind", ...o });
const giza = () => [SKY("day"), GROUND(), PIT(), SPHINX(), TEMPLE(), VALLEY(), PYRAMIDS()];
const seedGiza = (S, t) => { S.prop(t, "sky", { night: 0 }); S.prop(t, "sphinx", { rough: 0, flake: 0, wet: 0 }); S.prop(t, "pit", { wet: 0, flow: 0, quarry: 0 }); };
const PLACE_IDS = ["pit", "sphinx", "valley", "temple", "tempQ", "hall"];
const inPit = (ids, end) => ids.flatMap((who) => PLACE_IDS.map((w) => ({ who, with: w, from: 0, to: end, checks: ["clipping", "shell"], reason: "world-frame scenery: its bounds span the whole place they stand in (pit floor, between the paws, the temple terrace); hand, arm and costume checks stay on" })));

// arm targets ({ o: [out, up, fwd] }, mirrored per side)
const SPREAD = { o: [0.5, 0.3, 0.22] }, FINGER = { o: [0.12, 0.55, 0.28] }, POINTUP = { o: [0.12, 0.62, 0.36] }, BRUSHUP = { o: [0.08, 0.5, 0.42] }, POUND = { o: [0.1, 0.3, 0.42] }, STRIKE = { o: [0.1, 0.12, 0.5] };

// ===================================================================== 0. DAY 0-8.9: the grooved wall, the paws, "Rain did this"
// (the hook, opener B: the narrator's line over the high view, the grooves close, the giant between the paws)
const seg0 = () => segment(0, (S) => {
  const WALL = { spud: [-2.0, -7.4], arch: [-0.95, -7.02] }, PAWS = { spud: [8.7, 0.2], arch: [7.95, -0.25] };
  const cast = [
    { id: "spud", character: CAST.spud, at: WALL.spud, face: 180, expr: "neutral", follow: 0.2, seed: 4.1 },
    { id: "arch", character: CAST.arch, at: WALL.arch, face: 180, expr: "kind", follow: 0.2, seed: 1.3 },
  ];
  const props = [...giza()];
  props.push(brush(S, WALL.arch, 180, 0.03));
  seedGiza(S, 0.1);
  S.look(0, "spud", [0, 0.45], 0.01); S.look(0, "arch", [0, 0.4], 0.01);
  // P01 (0-2.3) "These are rain scars.": the high view from the south-east over the pit, both small at the grooved north wall
  S.say(0.2, "n01", 7.3);
  S.label(0.05, 2.3, "GIZA, EGYPT");
  S.shot("01 the pit", 0, cam([11, 8.5, -3.2], [-3.5, 2.2, -5.2], 50, { pos: [8, 6.5, -4.4] }, 2.3, "out"), "hook");
  // P02 (2.3-4.6) "Egypt hasn't seen rain like this in five thousand years.": along the wall, his hand traces one groove top to bottom
  S.arm(2.285, "arch", "R", "rest", 0.01); S.place(2.3, "arch", [-3.3, -6.9], 140);
  S.arm(2.35, "spud", "R", { o: [0.14, 0.55, 0.42] }, 0.35); S.A(2.4, "spud", "grip", { side: "R", shape: "open", dur: 0.15 });
  S.arm(2.8, "spud", "R", { o: [0.14, 0.12, 0.44] }, 1.6, "inOut");
  S.look(2.35, "spud", [0.15, 0.3], 0.2); S.look(2.9, "spud", [0.15, -0.1], 1.4);
  S.sfx(2.8, "ai/cookie-scrape", { gain: 0.08, dur: 1.4, reason: "his palm over the dry, sandy limestone" });
  S.shot("02 the grooves", 2.3, cam([0.0, 1.0, -6.5], [-2.0, 0.9, -7.8], 42, { pos: [-0.2, 1.0, -6.6] }, 2.3));
  // P03 (4.6-7.3) "How old is the Sphinx really?": low between the paws, the giant above, both tiny, looking up
  S.arm(4.585, "spud", "R", "rest", 0.01);
  S.place(4.6, "spud", PAWS.spud, 270); S.place(4.6, "arch", PAWS.arch, 270);
  S.look(4.6, "spud", [0, 0.8], 0.01); S.look(4.6, "arch", [0, 0.75], 0.01);
  S.expr(4.6, "spud", "surprised", { open: 0.25 }, 0.01);
  S.shot("03 the giant", 4.6, cam([16.4, 0.5, 0.15], [6.5, 5.4, 0], 60, { pos: [15.9, 0.55, 0.12] }, 2.7));
  // P04 (7.3-8.9) "Rain did this. ...": by the wall, he spins to her, arms wide, leaf up; she calm, one brow up
  S.arm(7.285, "arch", "R", "rest", 0.01); S.place(7.3, "spud", [-0.95, -6.7], 200); S.place(7.3, "arch", [-1.95, -6.3], 70);
  S.look(7.3, "spud", [0, 0], 0.01); S.look(7.3, "arch", [0, 0], 0.01);
  S.expr(7.3, "spud", "happy", { open: 0.4, brow: 0.8 }, 0.01);
  S.turn(7.32, "spud", 300, 0.3);
  S.arm(7.35, "spud", "L", SPREAD, 0.3, "out"); S.arm(7.35, "spud", "R", SPREAD, 0.3, "out");
  S.A(7.6, "arch", "face", { browR: 0.5, dur: 0.18 });
  S.tail("s02");   // "Rain did this." (the rest opens segment 1)
  S.shot("04 rain did this", 7.3, cam([-0.4, 0.85, -3.8], [-1.45, 0.55, -6.5], 44, { pos: [-0.45, 0.84, -3.95] }, 1.6));
  return { id: "eg05-0-tall", title: "Sphinx (0: the grooves)", idea: "seg 0 of 9", set: DAY, cast, props,
    hook: { show: ["sphinx", "pit"], hint: 0, what: "the Great Sphinx in its pit, deep vertical grooves in the walls, two small figures at the wall" },
    allowClip: [...inPit(["spud", "arch"], S.END), { who: "spud", with: "pit", from: S.T(2.3), to: S.T(4.6), checks: ["hand-in-prop", "arm-in-prop"], reason: "panel 02: his palm runs down inside a groove of the wall" },
      { who: "arch", with: "brush", from: 0, to: S.T(2.3), checks: ["thin-prop-hidden"], reason: "panel 01: she is 120 px tall far below the camera; the brush is a few pixels either way" },
      { who: "arch", with: "brush", from: S.T(4.6), to: S.T(7.3), checks: ["thin-prop-hidden"], reason: "panel 03: both tiny between the paws under the giant, seen from behind; the brush is a few pixels" },
      { who: "arch", with: "brush", from: S.T(7.3), to: S.END, checks: ["thin-prop-hidden"], reason: "panel 04: Spud has the moment; her brush hangs at rest by her hip on the far side" }],
    notes: "Generated by make-sphinx.mjs, segment 0 (story 0-8.9)." };
});

// ===================================================================== 1. STORM 8.9-12.0: Spud's version
const seg1 = () => segment(1, (S) => {
  const cast = [{ id: "spud", character: CAST.spud, at: PARK(0), face: 0, expr: "neutral", seed: 4.1, staged: "voice over" }];
  const props = [SKY("afternoon", 0, 0), GROUND(), SPHINX({ stele: false }),
    { id: "savA", kind: "savanna", x: 0, y: 0, z: 0, cover: true, storm: true, staged: "the green plain of Spud's imagined past" },
    { id: "rainA", kind: "rainbox", x: 0, y: 0, z: 0, box: [68, 18, 48], n: 1280, slant: [0, 0.194], alpha: 0.46 },
    PIT({ y: -60, staged: "hidden until panel 06" }),
    { id: "savB", kind: "savanna", x: 0, y: -60, z: 0, cover: false, storm: true, staged: "panel 06's storm sky, hidden until then" },
    { id: "rainB", kind: "rainbox", x: 0, y: -60, z: 0, box: [39, 13, 23], n: 1050, slant: [0, 0.194], alpha: 0.46 }];
  S.prop(9.0, "sky", { night: 0 }); S.prop(9.0, "sphinx", { rough: 0, flake: 0, wet: 0.78 }); S.prop(9.0, "savA", { gust: 0 }); S.prop(9.0, "savB", { gust: 0 }); S.prop(9.0, "pit", { wet: 1, flow: 0, quarry: 0 });
  S.head("s02");   // "Years of it. It was here before the desert!"
  // P05 (8.9-10.6) "Years of it.": the Sphinx alone on a green plain, acacias, sheets of rain
  S.prop(9.02, "savA", { gust: 1 }, 1.6, "linear");
  S.sfx(8.9, "ai/storm-wind", { gain: 0.25, dur: 3.1, reason: "the storm over the plain" });
  S.sfx(8.9, "ai/rain-car-roof", { gain: 0.18, dur: 3.1, reason: "heavy rain (the closest rain bed in the library)" });
  S.shot("05 green Sahara", 8.9, cam([-5, 2.8, 17], [1, 3.4, 0], 56, { pos: [-4.4, 2.75, 15.6] }, 1.7));
  // P06 (10.6-12.0) "It was here before the desert!": in the pit, water pours down the walls into the grooves, mud at the paws
  for (const id of ["savA", "rainA"]) S.prop(10.58, id, { y: -60 });
  for (const id of ["pit", "savB", "rainB"]) S.prop(10.58, id, { y: 0 });
  S.prop(10.58, "sphinx", { wet: 1 });
  S.prop(10.6, "pit", { flow: 1 }, 1.4, "linear");
  S.sfx(10.6, "ai/water-gush", { gain: 0.14, dur: 1.4, reason: "water running down the rock walls" });
  S.shot("06 rain in the pit", 10.6, cam([14.5, 1.5, -1.6], [4, 2.8, -8.2], 60, { pos: [14.0, 1.45, -1.9] }, 1.4));
  return { id: "eg05-1-tall", title: "Sphinx (1: the rain)", idea: "seg 1 of 9", set: STORM, cast, props, allowClip: inPit(["spud"], S.END),
    sound: { ...SOUND, ambience: 0.04 },
    notes: "Generated by make-sphinx.mjs, segment 1 (story 8.9-12.0): Spud's imagined past, his line as a voice over." };
});

// ===================================================================== 2. DAY 12.0-25.0: salt
const seg2 = () => segment(2, (S) => {
  const FLAKE = { arch: [5.4, 4.05], spud: [4.65, 4.6] };
  const cast = [
    { id: "arch", character: CAST.arch, at: FLAKE.arch, face: 180, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "spud", character: CAST.spud, at: FLAKE.spud, face: 150, expr: "neutral", follow: 0.2, seed: 4.1 },
  ];
  const props = [...giza(), { id: "salt", kind: "saltslice", x: 60, y: 0, z: 0, staged: "the cutaway: a slice of the rock, set apart for its close-up" }];
  props.push(brush(S, FLAKE.arch, 180, 12.03));
  seedGiza(S, 12.1); S.prop(12.1, "salt", { damp: 0, grow: 0, pop: 0 });
  // P07 (12.0-13.6) "Salt did this.": she crouches at the body and brushes; pale flakes crumble off; he leans in behind
  S.A(12.05, "arch", "crouch", { to: 0.5, dur: 0.4 });
  S.look(12.05, "arch", [0, -0.1], 0.2);
  S.arm(12.2, "arch", "R", { o: [0.06, 0.3, 0.42] }, 0.35);
  S.arm(12.6, "arch", "R", { o: [-0.06, 0.26, 0.44] }, 0.35); S.arm(12.95, "arch", "R", { o: [0.08, 0.3, 0.42] }, 0.35); S.arm(13.3, "arch", "R", { o: [-0.04, 0.27, 0.44] }, 0.3);
  S.prop(12.6, "sphinx", { flake: 1 }, 1.0, "in");
  S.A(12.3, "spud", "lean", { to: 14, dur: 0.4 }); S.look(12.3, "spud", [0.2, -0.2], 0.2);
  S.say(12.1, "a03", 13.6);
  S.sfx(12.6, "ai/cookie-scrape", { gain: 0.08, dur: 0.8, reason: "bristles on soft stone, grit falling" });
  S.shot("07 the flake", 12.0, cam([7.2, 0.65, 3.85], [5.3, 0.5, 3.75], 46, { pos: [7.05, 0.64, 3.85] }, 1.6));
  // P08 (13.6-19.6) "Water rises from the ground. Salt crystals grow inside the soft rock, and burst it.": the slice
  S.prop(13.65, "salt", { damp: 1 }, 2.5, "inOut");
  S.prop(15.4, "salt", { grow: 1 }, 2.8, "inOut");
  S.prop(18.2, "salt", { pop: 1 }, 0.9, "in");
  S.say(13.6, "a03b", 19.6);
  S.sfx(18.25, "crumble", { gain: 0.14, reason: "a thin flake of stone crumbles off" });
  S.shot("08 salt", 13.6, cam([60.6, 0.92, 2.6], [60.6, 0.88, 0.33], 42, { pos: [60.75, 0.98, 2.15] }, 6.0));
  // P09 (19.6-23.1) "The head is harder stone. That's why it held up.": the bands, the head; she points the brush up at it
  S.A(19.55, "arch", "crouch", { to: 0, dur: 0.01 }); S.A(19.55, "spud", "lean", { to: 0, dur: 0.01 });
  S.arm(19.55, "arch", "L", "rest", 0.01); S.arm(19.55, "arch", "R", "rest", 0.01);
  S.place(19.6, "arch", [8.4, 6.9], 250); S.place(19.6, "spud", [60, 60], 0);
  S.look(19.6, "arch", [0.3, 0.55], 0.01);
  S.arm(20.0, "arch", "L", BRUSHUP, 0.45); S.A(20.0, "arch", "grip", { side: "L", shape: "point", dur: 0.15 });
  S.say(19.7, "a03c", 23.2);
  S.shot("09 the hard head", 19.6, cam([10.6, 0.8, 8.5], [4.6, 3.6, 1.6], 58, { pos: [10.4, 0.85, 8.3] }, 3.5));
  // P10 (23.1-25.0) "Then what about the secret room? ...": he hops in front of her, finger up, sly, pointing at the paw (screen right)
  S.arm(23.085, "arch", "L", "rest", 0.01); S.arm(23.085, "arch", "R", "rest", 0.01);
  S.place(23.1, "arch", [11.0, 4.85], 100); S.place(23.1, "spud", [11.55, 4.1], 75);
  S.look(23.1, "arch", [0, 0], 0.01);
  S.A(23.12, "spud", "hop", { height: 0.18, dur: 0.4, quiet: true });
  S.expr(23.15, "spud", "happy", { lid: 0.55, brow: -0.4 }, 0.15);
  S.arm(23.3, "spud", "L", FINGER, 0.3); S.A(23.3, "spud", "grip", { side: "L", shape: "point", dur: 0.15 });
  S.arm(23.9, "spud", "L", { o: [0.36, 0.3, 0.32] }, 0.35);
  S.look(23.9, "spud", [0.45, 0], 0.25);
  S.tail("s04");   // "Then what about the secret room?" (the rest opens the hall)
  S.shot("10 the secret room", 23.1, cam([15.4, 0.72, 4.9], [11.4, 0.6, 3.9], 46, { pos: [15.0, 0.7, 4.8] }, 2.6));
  return { id: "eg05-2-tall", title: "Sphinx (2: salt)", idea: "seg 2 of 9", set: DAY, cast, props,
    allowClip: [...inPit(["spud", "arch"], S.END), { who: "arch", with: "sphinx", from: 0, to: S.T(13.6), checks: ["hand-in-prop", "arm-in-prop"], reason: "panel 07: her brush hand works right on the stone" },
      { who: "arch", with: "brush", from: S.T(12.6), to: S.T(12.9), checks: ["hand-in-prop", "arm-in-prop"], reason: "panel 07: the first brush stroke, the palm 3 cm into the handle for 3 frames while she is crouched behind it (to see in the strip)" },
      { who: "arch", with: "brush", from: S.T(19.6), to: S.T(23.1), checks: ["thin-prop-hidden"], reason: "panel 09: the camera is behind her raised arm; the brush points up the line of sight at the head, so it is short on screen (seen in the stills)" }],
    notes: "Generated by make-sphinx.mjs, segment 2 (story 12.0-25.0)." };
});

// ===================================================================== 3. HALL 25.0-27.0: the hall of records (Spud's version)
const seg3 = () => segment(3, (S) => {
  const cast = [{ id: "spud", character: CAST.spud, at: PARK(0), face: 0, expr: "neutral", seed: 4.1, staged: "voice over" }];
  const props = [{ id: "hall", kind: "hiddenhall", x: 0, y: 0, z: 0, staged: "the imagined hall under the right paw (its own shell)" }];
  S.prop(25.1, "hall", { lamp: 0 }); S.prop(25.12, "hall", { lamp: 1 }, 2.4, "linear");
  S.head("s04");   // "A library, hidden under its paw."
  S.shot("11 the hall of records", 25.0, cam([11.3, -3.0, 6.4], [11.3, -3.9, 0.6], 60, { pos: [11.3, -3.25, 5.2] }, 2.7, "out"));
  return { id: "eg05-3-tall", title: "Sphinx (3: the hall)", idea: "seg 3 of 9", set: HALL, cast, props, allowClip: [],
    sound: { ...SOUND, surface: "stone", ambience: 0.04 },
    notes: "Generated by make-sphinx.mjs, segment 3 (story 25.0-27.0): Spud's imagined hall, his line as a voice over." };
});

// ===================================================================== 4. DAY 27.0-42.0: the survey, "Yet.", the temple, the quarry, the match, the haul
const seg4 = () => segment(4, (S) => {
  const KIT = [11.0, 5.65], P13 = [12.25, 4.0], P14 = [15.6, 5.0];
  const cast = [
    { id: "chip", character: CAST.chip, at: [KIT[0], r3(KIT[1] - 0.92)], face: 0, expr: "neutral", follow: 0.2, seed: 2.2 },
    { id: "wedge", character: CAST.wedge, at: [9.35, 7.75], face: 290, expr: "neutral", follow: 0.2, seed: 2.7 },
    { id: "spud", character: CAST.spud, at: PARK(0), face: 0, expr: "neutral", follow: 0.2, seed: 4.1 },
    { id: "arch", character: CAST.arch, at: P14, face: 250, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "w1", character: CAST.wa, at: PARK(1), face: 270, expr: "angry", seed: 5.1 },
    { id: "w2", character: CAST.wb, at: PARK(2), face: 270, expr: "angry", seed: 5.4 },
  ];
  const SZ = 5.2;   // P16: the sledge on the east ramp's line, hauled east (rot -90: its -z front faces +x)
  const props = [...giza().map((p) => (p.id === "pit" ? PIT({ match: true }) : p.id === "temple" ? TEMPLE({ match: true }) : p)),
    { id: "survey", kind: "surveykit", x: KIT[0], y: 0, z: KIT[1], staged: "the survey crew's radar cart, drill rig and core table on the pit floor" },
    hat("chip", "chip"), hat("wedge", "wedge"),
    // the past (15, 16): the rough Sphinx and the quarry cells are params; the haul and the building temple are their own props, hidden till then
    { id: "tempQ", kind: "sphinxtemple", x: 0, y: -60, z: 0, era: "quarry", staged: "the temple being built, hidden until panel 16" },
    { id: "sledge", kind: "sledge", x: 11.6, y: -60, z: SZ, rot: -90, ropes: true, staged: "on the ramp, hidden until panel 16" },
    { id: "load", kind: "limeblock", x: 11.6, y: -60, z: SZ, rot: -90, size: [2.24, 0.98, 1.12], look: "core", staged: "rests on the sledge" },
    { id: "haul", kind: "egypthaul", x: 12.92, y: -60, z: SZ, rot: -90, along: 0, staged: "the hauling crew, hidden until panel 16" }];
  props.push(brush(S, P14, 250, 27.03));
  seedGiza(S, 27.1); S.prop(27.1, "survey", { roll: 0, drill: 0 }); S.prop(27.1, "tempQ", { build: 0.47 }); S.prop(27.1, "haul", { along: 0 });
  // P12 (27.0-31.2) "People have scanned and dug around it for decades. Nothing.": the radar cart rolls, the drill turns, a plain core
  S.prop(27.15, "survey", { roll: 1 }, 3.6, "linear"); S.prop(27.15, "survey", { drill: 1 }, 3.9, "linear");
  S.walk(27.15, "chip", [KIT[0], r3(KIT[1] - 0.92 + 0.85)], 3.6, { ease: "linear" });
  for (let k = 0; k <= 12; k++) {
    const t = r3(27.15 + k * 0.3), z = r3(-0.46 + 0.85 * Math.min(1, (k * 0.3) / 3.6));
    for (const [s, x] of [["L", -0.15], ["R", 0.15]]) S.arm(k ? t - 0.3 : 27.12, "chip", s, { prop: "survey", grip: [x, 0.69, z] }, k ? 0.3 : 0.03, "linear");
  }
  S.look(27.2, "chip", [0, -0.35], 0.2); S.look(27.2, "wedge", [0.2, 0.3], 0.2);
  S.say(27.1, "a04", 31.4);
  S.sfx(27.2, "rumble", { gain: 0.1, dur: 3.9, reason: "the drill rig turning into the rock" }); S.sfx(27.2, "freewheel", { gain: 0.12, dur: 3.6, reason: "the radar cart rolling over sand" });
  S.shot("12 the survey", 27.0, cam([14.8, 1.5, 8.4], [10.6, 0.6, 5.5], 54, { pos: [14.5, 1.45, 8.2] }, 4.2));
  // P13 (31.2-32.4) "Yet.": Spud alone at the paw, squinting at the stone, not giving up
  for (const s of ["L", "R"]) S.arm(31.185, "chip", s, "rest", 0.01);
  S.prop(31.18, "survey", { y: -60 });
  S.place(31.2, "spud", P13, 75); S.place(31.2, "chip", PARK(3), 0); S.place(31.2, "wedge", PARK(4), 0);
  S.look(31.2, "spud", [-0.45, -0.15], 0.01); S.look(31.7, "spud", [-0.1, 0], 0.25); S.expr(31.2, "spud", "angry", { lid: 0.45, brow: -0.6 }, 0.01);
  S.A(31.25, "spud", "lean", { to: 10, dur: 0.6 });
  S.say(31.4, "s04b", 32.5);
  S.shot("13 yet", 31.2, cam([13.6, 0.75, 5.4], [12.3, 0.9, 3.75], 40, { pos: [13.5, 0.75, 5.25] }, 1.2));
  // P14 (32.4-34.3) "Then explain the temple.": she turns and points the brush at the temple ruin
  S.place(32.42, "spud", PARK(0), 0); S.A(32.45, "spud", "lean", { to: 0, dur: 0.2 });
  S.look(32.4, "arch", [-0.2, 0.05], 0.01); S.turn(32.5, "arch", 300, 0.4);
  S.arm(32.7, "arch", "L", { o: [0.18, 0.4, 0.45] }, 0.6); S.look(32.8, "arch", [0.1, 0.1], 0.25); S.A(32.7, "arch", "grip", { side: "L", shape: "point", dur: 0.15 });
  S.say(32.5, "a05", 34.4);
  S.shot("14 the temple", 32.4, cam([12.4, 0.9, 6.6], [17.5, 1.4, 3.6], 52, { pos: [12.7, 0.9, 6.4] }, 1.9));
  // P15 (34.3-36.6) PAST "Its wall blocks were cut out of this pit.": workers cut blocks; the rough Sphinx behind
  S.arm(34.285, "arch", "L", "rest", 0.01); S.arm(34.285, "arch", "R", "rest", 0.01);
  S.place(34.3, "arch", [6.95, -6.62], 135);   // waits for 17 at the witness block (out of the past shots' frames)
  S.prop(34.28, "sphinx", { rough: 1, flake: 0 }); S.prop(34.28, "pit", { quarry: 1 }); S.prop(34.28, "temple", { y: -60 }); S.prop(34.28, "pyramids", { y: -60 });
  S.place(34.3, "w1", [0.25, -6.3], 270); S.place(34.3, "w2", [0.3, -4.35], 270);
  for (const [w, d] of [["w1", 0], ["w2", 0.18]]) for (let k = 0; k < 4; k++) {
    const t = r3(34.4 + d + k * 0.5);
    S.arm(t, w, "R", POUND, 0.28, "out"); S.arm(r3(t + 0.28), w, "R", STRIKE, 0.12, "in");
    S.arm(t, w, "L", { o: [0.12, 0.2, 0.48] }, 0.2);
  }
  for (let k = 0; k < 4; k++) S.sfx(r3(34.8 + k * 0.5), "kenney/impact-wood-medium", { gain: 0.12, reason: "a stone pounder on limestone" });
  S.label(34.4, 36.6, "4,500 YEARS AGO");
  S.say(34.4, "a05b", 38.4);
  S.shot("15 cut from the pit", 34.3, cam([4.5, 4.5, -6.0], [0.0, 0.8, -5.5], 50, { pos: [4.1, 4.2, -6.0] }, 2.3));
  // P17 (36.6-38.4) "Same layers.": the witness block beside the wall's return, the stripes run on; her brush follows one
  S.prop(36.58, "sphinx", { rough: 0 }); S.prop(36.58, "pit", { quarry: 0 }); S.prop(36.58, "temple", { y: 0 }); S.prop(36.58, "pyramids", { y: 4.8 });
  for (const w of ["w1", "w2"]) { S.arm(36.585, w, "R", "rest", 0.01); S.arm(36.585, w, "L", "rest", 0.01); S.place(36.6, w, PARK(w === "w1" ? 1 : 2), 0); }
  S.look(36.6, "arch", [0.1, 0.6], 0.01);
  S.arm(36.7, "arch", "L", { o: [0.3, 0.62, 0.4] }, 0.35); S.A(36.7, "arch", "grip", { side: "L", shape: "point", dur: 0.15 });
  S.arm(37.1, "arch", "L", { o: [-0.12, 0.62, 0.42] }, 1.1, "inOut");
  S.look(37.1, "arch", [-0.25, 0.6], 1.1);
  S.shot("17 same layers", 36.6, cam([8.8, 0.8, -6.5], [6.3, 1.3, -7.5], 48, { pos: [8.65, 0.8, -6.55] }, 1.8), "reveal");
  // P16 (38.4-42.0) PAST "They carved the Sphinx, and built the temple from what they cut away.": a block hauled up out of the pit to the rising temple
  S.arm(38.385, "arch", "L", "rest", 0.01); S.arm(38.385, "arch", "R", "rest", 0.01);
  S.prop(38.38, "sphinx", { rough: 0.35 }); S.prop(38.38, "pit", { quarry: 0.34 }); S.prop(38.38, "temple", { y: -60 }); S.prop(38.38, "pyramids", { y: -60 });
  S.place(38.4, "arch", PARK(5), 0);
  for (const id of ["tempQ", "sledge", "haul"]) S.prop(38.38, id, { y: 0 }); S.prop(38.38, "load", { y: 0.19 });
  S.prop(38.42, "tempQ", { build: 0.6 }, 3.9, "linear");
  S.prop(38.45, "haul", { along: 1 }, 3.9, "linear");
  for (const id of ["sledge", "load"]) S.prop(38.45, id, { x: r3(11.6 + 1.83) }, 3.9, "linear");
  S.label(38.5, 42.4, "4,500 YEARS AGO");
  S.sfx(38.5, "ai/bag-drag", { gain: 0.28, dur: 3.8, reason: "the sledge drags over the ramp" });
  S.tail("a05c");   // "They carved the Sphinx, and built the temple from what they cut away." (the rest opens segment 5)
  S.shot("16 the haul", 38.4, cam([8.0, 2.4, 8.6], [15.0, 1.0, 4.0], 56, { pos: [8.4, 2.35, 8.4] }, 4.0));
  return { id: "eg05-4-tall", title: "Sphinx (4: the evidence)", idea: "seg 4 of 9", set: DAY, cast, props,
    allowClip: [...inPit(["spud", "arch", "chip", "wedge", "w1", "w2"], S.END), { who: "arch", with: "brush", from: S.T(32.4), to: S.END, checks: ["thin-prop-hidden"], reason: "panels 14-17: the brush hangs at rest by her hip while she turns and the other hand points (she is out of the past shots); seen in the stills" },
      { who: "arch", with: "brush", from: S.T(32.4), to: S.T(34.3), checks: ["arm-in-prop"], reason: "panel 14: the resting brush brushes her sleeve 3 cm as she turns; to see in the strip" },
      ...["chip", "wedge"].map((w) => ({ who: w, with: `${w}-hat`, from: 0, to: S.END, checks: ["clipping", "shell", "arm-in-prop"], reason: "the straw hat is worn on the head; the wide brim passes over the shoulders as the arms push" }))],
    notes: "Generated by make-sphinx.mjs, segment 4 (story 27.0-42.0): past 15 and 16 by params and hidden props." };
});

// ===================================================================== 5. SUNSET 42.0-56.38: Khafre's temple next door; the unfinished blocks; Spud turns back
const seg5 = () => segment(5, (S) => {
  const P19 = { arch: [10.8, -6.45], spud: [12.15, -6.2] }, P20 = { spud: [13.8, 7.37], arch: [14.4, 6.56] };
  const cast = [
    { id: "arch", character: CAST.arch, at: P19.arch, face: 145, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "spud", character: CAST.spud, at: P19.spud, face: 220, expr: "sad", follow: 0.2, seed: 4.1 },
  ];
  const props = [SKY("sunset", 20, 0, { sun: [270, 2.2] }), { id: "sky2", kind: "aasky", x: 1010, z: 0, time: "dusk", staged: "panel 20's dusk sky, moved in at its cut" },
    GROUND(), PIT({ quarry: 0 }), SPHINX(), TEMPLE(), VALLEY(), PYRAMIDS({ y: -60, sunAz: 270 }),
    { id: "tempQ", kind: "sphinxtemple", x: 0, y: 0, z: 0, era: "quarry", staged: "the Sphinx temple being finished (past)" },
    { id: "khafre", kind: "pyramid", x: -188.6, y: 6.8, z: -24, s: 0.34, state: "finished", sunAz: 270, sunEl: 3, staged: "Khafre's pyramid, new (past)" }];
  props.push(brush(S, P19.arch, 145, 42.03));
  S.prop(42.1, "sky", { night: 0 }); S.prop(42.1, "sky2", { night: 0.25 }); S.prop(42.1, "sphinx", { rough: 0.35, flake: 0, wet: 0 }); S.prop(42.1, "pit", { wet: 0, flow: 0, quarry: 0.34 });
  S.prop(42.1, "temple", { y: -60 }); S.prop(42.1, "tempQ", { build: 0.91 });
  // P18 (42.0-46.8) PAST "Right after King Khafre's temple next door. Four and a half thousand years ago.": the valley temple, the causeway, the new pyramid, sunset
  S.head("a05c", 44.8);   // "Right after King Khafre's temple next door."
  S.say(44.8, "a05d", 50.5);   // "Four and a half thousand years ago. Some blocks are still lying where they left them."
  S.num(44.8, 46.8, "4,500 YEARS AGO", { size: 96 });
  S.shot("18 next door", 42.0, cam([40, 22, 30], [-20, 2, -2], 55, { pos: [37, 20, 28] }, 4.8));
  // P19 (46.8-50.2) "Some blocks are still lying where they left them.": the half-cut blocks; her hand up at one; his leaf droops
  S.prop(46.78, "sphinx", { rough: 0 }); S.prop(46.78, "pit", { quarry: 0 }); S.prop(46.78, "temple", { y: 0 }); S.prop(46.78, "tempQ", { y: -60 }); S.prop(46.78, "khafre", { y: -60 }); S.prop(46.78, "pyramids", { y: 4.8 });
  S.look(46.8, "arch", [0.25, 0.55], 0.01); S.look(46.8, "spud", [-0.2, 0.2], 0.01);
  S.arm(47.0, "arch", "L", { o: [0.18, 0.45, 0.3] }, 0.7); S.A(47.0, "arch", "grip", { side: "L", shape: "point", dur: 0.15 });
  S.expr(47.2, "spud", "sad", { brow: 0.6 }, 0.3);
  S.shot("19 left where they stopped", 46.8, cam([12.0, 1.0, -4.0], [11.3, 1.0, -7.5], 52, { pos: [11.95, 1.0, -4.2] }, 3.4));
  // P20 (50.2-53.2) "Then why does it stare at the exact spot...": dusk; he turns back to her, one finger up, a sly smile (framed on him, draft 2)
  S.prop(50.18, "sky", { x: 1020 }); S.prop(50.18, "sky2", { x: 20 });
  S.arm(50.15, "arch", "L", "rest", 0.01); S.arm(50.15, "arch", "R", "rest", 0.01);
  S.place(50.2, "spud", P20.spud, 40); S.place(50.2, "arch", P20.arch, 40);
  S.look(50.2, "arch", [0, 0], 0.01); S.look(50.2, "spud", [0.3, 0], 0.01);
  S.turn(50.25, "spud", 100, 0.5);
  S.expr(50.3, "spud", "happy", { lid: 0.55, brow: -0.3 }, 0.2);
  S.arm(50.5, "spud", "R", FINGER, 0.35); S.A(50.5, "spud", "grip", { side: "R", shape: "point", dur: 0.15 });
  S.tail("s06");   // "Then why does it stare at the exact spot where the Lion rose at sunrise..." (the rest opens the night)
  S.shot("20 one more thing", 50.2, cam([16.6, 0.85, 8.7], [14.15, 1.0, 6.95], 50, { pos: [16.4, 0.85, 8.55] }, 3.0));
  // P21 (53.2-56.38) "...where the Lion rose at sunrise...": at "the exact spot", the Sphinx from behind, gazing east into the dusk
  // (the night segment opens on the same gaze, so the sky turns to stars where it looks)
  S.look(53.2, "spud", [0.1, 0.5], 0.3); S.look(53.2, "arch", [0.1, 0.4], 0.3);
  S.shot("21 its gaze", 53.2, cam([-5.5, 9.4, 2.2], [30, 6.5, -0.5], 56, { pos: [-4.6, 9.1, 1.8] }, 3.2));
  return { id: "eg05-5-tall", title: "Sphinx (5: next door)", idea: "seg 5 of 9", set: SUNSET, cast, props,
    allowClip: [...inPit(["spud", "arch"], S.END), { who: "arch", with: "brush", from: S.T(46.8), to: S.END, checks: ["thin-prop-hidden"], reason: "panels 19-21: the brush hangs at rest by her hip, the other hand points; seen in the stills" }],
    notes: "Generated by make-sphinx.mjs, segment 5 (story 42.0-56.38): past 18, present 19-21." };
});

// ===================================================================== 6. NIGHT 53.4-57.4: the Lion rising in the Sphinx's gaze
const seg6 = () => segment(6, (S) => {
  const cast = [{ id: "spud", character: CAST.spud, at: PARK(0), face: 0, expr: "neutral", seed: 4.1, staged: "voice over" }];
  const props = [SKY("night", 0, 0), { id: "stars", kind: "starfield", x: 0, z: 0, n: 5000, hole: [90, 8, 19], seed: 2, staged: "the stars on the sky dome" }, GROUND({ night: 1 }),
    PIT(), SPHINX({ stele: false }), TEMPLE(), { id: "leo", kind: "leo", x: 0, y: 0, z: 0, staged: "the Lion's stars on the sky dome" }];
  S.prop(53.41, "ground", { night: 1 }); S.prop(53.41, "sphinx", { rough: 0, flake: 0, wet: 0 }); S.prop(53.41, "pit", { wet: 0, flow: 0, quarry: 0 });
  // P22 (53.4-57.4) "...twelve and a half thousand years ago?": the Lion rises in line with its gaze, a first glow beneath
  S.head("s06");   // "twelve and a half thousand years ago?"
  S.prop(53.41, "leo", { show: 0.88, lines: 0, rise: 0 }); S.prop(53.7, "leo", { lines: 0.82 }, 0.8, "inOut");
  S.prop(53.44, "leo", { rise: 1 }, 3.4, "inOut");
  S.prop(53.41, "sky", { night: 0.83 }); S.prop(53.44, "sky", { night: 0.69 }, 3.4, "linear");
  S.prop(53.41, "stars", { show: 0.68 }); S.prop(53.44, "stars", { show: 0.46 }, 3.4, "linear");
  S.num(53.9, 57.4, "12,500 YEARS AGO", { size: 96 });
  S.shot("22 the Lion rises", 53.4, cam([-6.5, 9.2, 4.2], [40, 13.5, -1.5], 56, { pos: [-6.0, 9.1, 3.9] }, 4.0), "peak");
  return { id: "eg05-6-tall", title: "Sphinx (6: the Lion)", idea: "seg 6 of 9", set: NIGHT, cast, props, allowClip: inPit(["spud"], S.END),
    sound: { ...SOUND, ambience: 0.04 },
    notes: "Generated by make-sphinx.mjs, segment 6 (story 53.4-57.4): Spud's last card as a voice over." };
});

// ===================================================================== 7. DUSK 58.3-60.6: no answer
const seg7 = () => segment(7, (S) => {
  const P = { spud: [13.8, 7.37], arch: [14.4, 6.56] };
  const cast = [
    { id: "arch", character: CAST.arch, at: P.arch, face: 330, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "spud", character: CAST.spud, at: P.spud, face: 100, expr: "happy", follow: 0.2, seed: 4.1 },
  ];
  const props = [SKY("dusk", 20, 0), GROUND(), PIT(), SPHINX(), TEMPLE(), VALLEY(), PYRAMIDS({ sunAz: 270 })];
  props.push(brush(S, P.arch, 330, 58.33));
  seedGiza(S, 58.4); S.prop(58.4, "sky", { night: 0.42 });
  S.look(58.3, "arch", [0.1, 0], 0.01); S.look(58.3, "spud", [0, 0.05], 0.01);
  S.expr(58.3, "spud", "happy", { lid: 0.85 }, 0.01);
  S.arm(58.35, "spud", "L", "hips", 0.3); S.arm(58.35, "spud", "R", "hips", 0.3);
  // she opens her mouth to answer, the brush half up... and nothing comes out
  S.arm(58.5, "arch", "L", { o: [0.12, 0.32, 0.36] }, 0.35);
  S.expr(58.6, "arch", "surprised", { open: 0.45 }, 0.15);
  S.expr(59.5, "arch", "neutral", { open: 0 }, 0.2);
  S.arm(59.7, "arch", "L", "rest", 0.5);
  S.shot("23 no answer", 58.3, cam([15.95, 0.76, 8.55], [14.1, 0.62, 6.8], 50, { pos: [15.8, 0.75, 8.4] }, 2.3));
  return { id: "eg05-7-tall", title: "Sphinx (7: no answer)", idea: "seg 7 of 9", set: DUSK, cast, props,
    allowClip: [...inPit(["spud", "arch"], S.END), { who: "arch", with: "brush", from: 0, to: S.END, checks: ["thin-prop-hidden"], reason: "panel 23: the brush hangs at rest by her hip while her other hand half rises; seen in the stills" }], notes: "Generated by make-sphinx.mjs, segment 7 (story 58.3-60.6)." };
});

// ===================================================================== 8. DAWN 60.6-63.6: both between the paws; "WHO'S RIGHT?"
const seg8 = () => segment(8, (S) => {
  const P = { spud: [12.9, -0.3], arch: [12.3, 0.3] };
  const cast = [
    { id: "arch", character: CAST.arch, at: P.arch, face: 90, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "spud", character: CAST.spud, at: P.spud, face: 90, expr: "happy", follow: 0.2, seed: 4.1 },
  ];
  const props = [SKY("afternoon", 20, 0, { sun: [90, 1.8] }), GROUND(), PIT(), SPHINX(), TEMPLE(), VALLEY(), PYRAMIDS({ sunAz: 90, sunEl: 2 })];
  props.push(brush(S, P.arch, 90, 60.63));
  seedGiza(S, 60.7);
  S.look(60.6, "arch", [0, 0], 0.01); S.look(60.6, "spud", [0, 0], 0.01);
  S.A(60.9, "arch", "face", { browR: 0.5, dur: 0.18 });
  S.num(61.0, 63.6, "WHO'S RIGHT?", { size: 100 });
  S.shot("24 who's right", 60.6, cam([16.3, 0.7, 0.05], [9.0, 3.0, 0], 62, { pos: [15.9, 0.7, 0.04] }, 3.0, "out"));
  return { id: "eg05-8-tall", title: "Sphinx (8: who's right?)", idea: "seg 8 of 9", set: DAWN, cast, props,
    allowClip: [...inPit(["spud", "arch"], S.END), { who: "arch", with: "brush", from: 0, to: S.END, checks: ["thin-prop-hidden"], reason: "panel 24: both small in the wide dawn shot, the brush at rest by her hip is a few pixels" }], notes: "Generated by make-sphinx.mjs, segment 8 (story 60.6-63.6): the poll ending." };
});

const SEGS = [seg0, seg1, seg2, seg3, seg4, seg5, seg6, seg7, seg8];
const only = process.argv.find((a) => /^--seg=/.test(a))?.slice(6).split(",").map(Number);
SEGS.forEach((g, i) => { if (!only || only.includes(i)) write(import.meta.url, { ...F.sb, ...g() }); });
