// ALIEN MAKEUP, WRONG SURFACE (Jonny's story library #03, 28 Oct 2026; the first clip of the hook lab, qa/HOOK.md).
// node storyboards/halloween/make-alien-makeup.mjs -> alien-makeup-a.json, -b.json, -c.json (three openings)
//
// Built to Jonny's brief (story library 03, ENGINE-PROMPT.md): 10 s, 8 shots, Wizard screen-left, Astronaut
// screen-right, a warm cream room and a pale wooden makeup table. The Wizard paints a lime-green alien face with two dark
// almond eyes on the OUTSIDE of the Astronaut's visor; the Astronaut flips the rigid visor up on its temple pivots (all
// the paint goes up with it, his golden face is clean), lowers it again and gives a thumbs-up; the Wizard stares.
//
//   01 0.0-0.6  brush on glass, the last green stroke      05 3.3-5.5  he lifts the visor (payoff), the music drops out
//   02 0.6-1.2  the Wizard, proud                           06 5.5-6.6  the Wizard understands
//   03 1.2-1.8  the finished alien, frontal                 07 6.6-8.2  he lowers it again, click
//   04 1.8-3.3  brush and pot down, the mirror up           08 8.2-10   thumbs-up; the Wizard holds the mirror low, stares
//
// The three openings (the hook lab's variants; from shot 03 on they are the same clip):
//   A "as written":   the brief exactly: the brush on the glass at frame 0, no on-screen text.
//   B "caption":      A plus the brief's caption on screen for the first 3.3 s: "When your friend does your Halloween makeup".
//   C "result first": opens on shot 03, the finished alien face (shots 01-02 cut; 8.8 s).
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { HELMET_Y, visorPoint } from "../../engine/page/props-makeup.js";

const AST = [0.32, -0.55], WIZ = [-0.62, -0.05];   // the Wizard a step nearer the camera, overlapping in depth
const HC = [AST[0], HELMET_Y, AST[1] + 0.01];           // the helmet's centre while worn
const GREEN = "#8fd14f";
const TS = 0.65, TOP = 0.62 * TS, TD = 2.3, TZ = 0.37 + TD / 2;   // the makeup table: potato height, its top; deep, so it fills
                                                                    // the bottom of the frame and its front edge is never in shot
const r3 = (v) => Math.round(v * 1000) / 1000;
const add = (a, b) => a.map((v, i) => r3(v + b[i]));
const W = (p) => add(HC, p);                             // helmet frame -> world
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };

// the brush in the Wizard's left fist (the hand on the Astronaut's side, so no arm crosses his face): its tuft tip (0.2 from the fist) on the visor, the handle coming from his side
const BRUSH_LEN = 0.2, BRUSH_DIR = norm([0.7, 0.2, -0.68]);
const brushAngles = (d) => { const t = Math.acos(d[1]), r = Math.atan2(-d[2], d[0]); return { tilt: r3((t * 180) / Math.PI), rot: r3((r * 180) / Math.PI) }; };
const BA = brushAngles(BRUSH_DIR);
const handFor = (tip) => tip.map((v, i) => r3(v - BRUSH_LEN * BRUSH_DIR[i]));
// the last stroke, down the screen-left cheek of the alien (props-makeup.js CHEEK, in visor u/v)
const STROKE = [0.62, 0.71, 0.8, 0.88].map((v) => W(visorPoint(0.16, v, 0.004)));

// the Astronaut's right fist under the visor's lower rim (screen-left part), at visor angle `open`
const rim = (open) => add(W(visorPoint(0.15, 1, 0.045, open)), [0, -0.03, 0]);

// where things lie on the table (bottom centres); the brush and the mirror lie flat
const MS = 1.6;   // the hand mirror, scaled up to read at phone size
const POT_AT = [-0.85, TOP, 0.47], BRUSH_AT = [-0.36, TOP + 0.015, 0.5], MIRROR_AT = [-0.12, TOP + 0.016 * MS, 0.5];

function build(variant) {
  const c = clip(), { A, sfx } = c;
  const START = variant === "C" ? 1.2 : 0;   // C opens on shot 03: its timeline starts there
  const END = 10 - START;
  // story time -> clip time. Before START (C only), state actions collapse onto frame 0 (dur 0, in order), sounds drop
  const on = (t, who, what, o = {}) => (t >= START ? A(t - START, who, what, o) : A(0, who, what, { ...o, dur: 0 }));
  const ps = (t, id, set, dur = 0.3, ease = "inOut") => (t >= START ? c.prop(t - START, id, set, dur, ease) : c.prop(0, id, set, 0));
  const fx = (t, s, o) => { if (t >= START) sfx(t - START, s, o); };
  const arm = (t, who, side, pose, dur, ease) => on(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
  const C2 = { A: on };   // acting.mjs helpers on story time

  const cast = [
    { id: "ast", character: "halloween/astronaut-nohelmet", at: AST, face: "camera", expr: "eager", follow: 0.4, seed: 3.1 },
    { id: "wiz", character: "halloween/wizard-host", at: WIZ, face: "3q-right", expr: "happy", follow: 0.5, seed: 1.4 },
  ];
  const props = [
    { id: "table", kind: "table", x: -0.1, y: 0, z: TZ, scale: TS, w: 2.6 / TS, d: TD / TS, color: "#e7c99a", legs: "#c7a274" },
    { id: "helmet", kind: "bubblehelmet", x: HC[0], y: HC[1], z: HC[2], write: 0.88, paint: GREEN },
    { id: "brush", kind: "brush", x: STROKE[0][0], y: STROKE[0][1], z: STROKE[0][2], tilt: BA.tilt, rot: BA.rot, paint: GREEN },
    { id: "pot", kind: "paintpot", x: WIZ[0] - 0.2, y: 0.4, z: WIZ[1] + 0.3, paint: GREEN },
    { id: "mirror", kind: "handmirror", x: MIRROR_AT[0], y: MIRROR_AT[1], z: MIRROR_AT[2], tip: -90, rot: -15, scale: MS, paint: GREEN },
  ];

  // ------------------------------------------------------------ frame 0: brush in the left fist, pot in the right
  A(0, "wiz", "grab", { prop: "brush", hand: "L", grip: [0, 0, 0], dur: 0, pose: null });
  A(0, "wiz", "grip", { side: "L", shape: "hold", dur: 0 });
  A(0, "wiz", "grab", { prop: "pot", hand: "R", grip: "side", dur: 0, pose: null });
  A(0, "wiz", "grip", { side: "R", shape: "hold", dur: 0 });
  A(0, "wiz", "arm", { side: "R", pose: { o: [0.02, 0.36, 0.3] }, dur: 0 });
  A(0, "ast", "noblink", {});

  // ------------------------------------------------------------ 01 painting the wrong surface (0-0.6)
  A(0, "wiz", "arm", { side: "L", pose: { world: handFor(STROKE[0]) }, dur: 0 });
  A(0, "wiz", "look", { to: [0.5, -0.05], dur: 0, blink: false });
  A(0, "ast", "expr", { expr: "serene", dur: 0 });
  // the stroke: three straight runs along the curve of the glass, the paint following the tip
  [1, 2, 3].forEach((i) => on(0.03 + (i - 1) * 0.17, "wiz", "arm", { side: "L", pose: { world: handFor(STROKE[i]) }, dur: 0.17, ease: "linear" }));
  ps(0.03, "helmet", { write: 1 }, 0.51, "linear");
  fx(0.0, "cloth", { gain: 0.32 });
  fx(0.02, "kenney/slime", { gain: 0.18 });

  // ------------------------------------------------------------ 02 proud artist (0.6-1.2)
  arm(0.6, "wiz", "L", { o: [0.1, 0.42, 0.28] }, 0.35, "settle");      // the brush comes away, held up beside him
  ps(0.6, "brush", { tilt: 15, rot: 0 }, 0.35);
  on(0.6, "wiz", "look", { to: [0.35, 0.1], dur: 0.2 });
  on(0.78, "wiz", "expr", { expr: "smug", set: { curve: 0.8 }, dur: 0.25 });
  on(0.8, "wiz", "face", { lid: 0.35, dur: 0.2 });
  fx(0.8, "cloth", { gain: 0.14 });                                     // a small pleased breath (no words)
  on(1.0, "wiz", "face", { lid: 0, dur: 0.2 });

  // ------------------------------------------------------------ 03 the finished alien (1.2-1.8)
  on(1.2, "ast", "expr", { expr: "eager", dur: 0.15 });
  on(1.2, "ast", "look", { to: [0, 0], dur: 0 });
  fx(1.22, "jingle-pizzicato", { gain: 0.35 });

  // ------------------------------------------------------------ 04 admire the work (1.8-3.3)
  // brush and pot down on the table at once (real contact: the hands go to the table, then let go)
  arm(1.8, "wiz", "L", { world: add(BRUSH_AT, [0, 0.05, 0]) }, 0.32, "inOut");
  arm(1.8, "wiz", "R", { world: add(POT_AT, [0, 0.06, 0]) }, 0.32, "inOut");
  ps(1.8, "brush", { tilt: 90, rot: -20 }, 0.32);
  on(1.8, "wiz", "look", { to: [0.1, -0.5], dur: 0.15 });
  on(2.12, "wiz", "release", { prop: "brush", to: BRUSH_AT, dur: 0.06 });
  on(2.12, "wiz", "release", { prop: "pot", to: POT_AT, dur: 0.06 });
  fx(2.14, "put-down", { gain: 0.3 });
  fx(2.2, "put-down-glass", { gain: 0.3 });
  on(2.15, "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
  // the right hand back to his side; the left picks up the mirror and lifts it toward the Astronaut
  arm(2.2, "wiz", "R", "rest", 0.4);
  arm(2.18, "wiz", "L", { prop: "mirror", grip: "handle", off: [0, 0.03, 0] }, 0.26, "inOut");
  on(2.18, "wiz", "look", { to: [0.3, -0.5], dur: 0.12 });
  on(2.44, "wiz", "grab", { prop: "mirror", hand: "L", grip: "handle", dur: 0.01, pose: null });
  on(2.44, "wiz", "grip", { side: "L", shape: "hold", dur: 0.08 });
  arm(2.5, "wiz", "L", { world: [-0.14, 0.6, 0.2] }, 0.45, "settle");
  ps(2.5, "mirror", { tip: -5, rot: 35 }, 0.45);
  on(2.55, "wiz", "look", { to: [0.45, 0.05], dur: 0.2 });
  on(2.55, "wiz", "expr", { expr: "happy", dur: 0.2 });
  on(2.75, "ast", "look", { to: [-0.45, -0.1], dur: 0.15 });
  on(2.95, "ast", "expr", { expr: "delighted", dur: 0.2 });
  act.blinksAt(C2, "ast", [2.72]);

  // ------------------------------------------------------------ 05 lift the whole look (3.3-5.5), the payoff
  const LIFT = 3.75, LIFT_DUR = 0.75, N = 6;
  on(3.3, "ast", "look", { to: [-0.2, 0.25], dur: 0.15 });
  arm(3.32, "ast", "R", { world: rim(0) }, 0.4, "inOut");
  on(3.6, "ast", "grip", { side: "R", shape: "rim", dur: 0.12 });
  fx(LIFT - 0.02, "kenney/metal-click", { gain: 0.4 });
  // the fist rides the rim round the pivots: N short straight runs, the visor turning with it, eased overall
  const easeIO = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2);
  for (let i = 0; i < N; i++) {
    const t0 = LIFT + LIFT_DUR * (i / N), dt = LIFT_DUR / N, o1 = easeIO((i + 1) / N);
    arm(t0, "ast", "R", { world: rim(o1) }, dt, "linear");
    ps(t0, "helmet", { open: r3(o1) }, dt, "linear");
  }
  on(4.25, "ast", "expr", { expr: "delighted", set: { open: 0.75 }, dur: 0.2 });
  on(4.3, "ast", "look", { to: [-0.35, 0.05], dur: 0.2 });
  on(4.2, "wiz", "still", { dur: 1.2, idle: 0.08 });

  // ------------------------------------------------------------ 06 the Wizard understands (5.5-6.6)
  on(5.55, "wiz", "expr", { expr: "kind", set: { curve: 0.2 }, dur: 0.2 });
  act.shock(C2, 5.8, "wiz", { open: 0.12, eye: 1.15, curve: -0.1, brow: 0.35, hold: 0.7, dur: 0.2 });
  on(5.8, "wiz", "look", { to: [0.45, 0.35], dur: 0.15 });
  act.blinksAt(C2, "wiz", [6.2]);
  fx(6.2, "kenney/tick", { gain: 0.18 });

  // ------------------------------------------------------------ 07 it is still useful (6.6-8.2)
  const DOWN = 6.8, DOWN_DUR = 0.75;
  on(6.65, "ast", "look", { to: [-0.15, 0.3], dur: 0.15 });
  on(6.7, "ast", "expr", { expr: "eager", dur: 0.2 });
  for (let i = 0; i < N; i++) {
    const t0 = DOWN + DOWN_DUR * (i / N), dt = DOWN_DUR / N, o1 = 1 - easeIO((i + 1) / N);
    arm(t0, "ast", "R", { world: rim(o1) }, dt, "linear");
    ps(t0, "helmet", { open: r3(o1) }, dt, "linear");
  }
  fx(DOWN + DOWN_DUR - 0.02, "kenney/metal-latch", { gain: 0.35 });
  on(7.7, "ast", "grip", { side: "R", shape: "open", dur: 0.12 });
  arm(7.72, "ast", "R", "rest", 0.4);
  // the Wizard lowers the mirror, still staring
  arm(7.0, "wiz", "L", { world: [-0.26, 0.43, 0.4] }, 0.6, "inOut");
  ps(7.0, "mirror", { tip: 62, rot: 25 }, 0.6);

  // ------------------------------------------------------------ 08 satisfied customer (8.2-10)
  on(8.2, "ast", "look", { to: [0, 0], dur: 0.15 });
  // thumbs-up below the helmet rim, in front of the suit: forearm pointing at the camera, palm turned in, so the thumb points up
  arm(8.22, "ast", "L", { world: [AST[0] + 0.14, 0.5, AST[1] + 0.62], palm: [AST[0] - 0.06, 0.5, AST[1] + 0.62] }, 0.28, "settle");
  on(8.22, "ast", "grip", { side: "L", shape: "thumb", dur: 0.15 });
  on(8.3, "ast", "expr", { expr: "delighted", dur: 0.2 });
  fx(8.38, "jingle-hit", { gain: 0.3 });
  on(8.5, "wiz", "expr", { expr: "deadpan", set: { curve: -0.1 }, dur: 0.3 });
  on(8.5, "wiz", "face", { lid: 0.4, brow: -0.2, dur: 0.3 });
  on(8.5, "wiz", "look", { to: [0.5, 0.15], dur: 0.2, blink: false });
  on(8.6, "wiz", "still", { dur: 1.3, idle: 0.08 });
  act.blinksAt(C2, "wiz", [9.35]);

  // ------------------------------------------------------------ captions (B only)
  // held still (not word by word), so the whole line is up from frame 0
  if (variant === "B") c.captions.push({ from: 0, to: 3.3, text: "When your friend does your Halloween makeup", pos: 300, pop: false, kinetic: false });

  // ------------------------------------------------------------ shots
  const tip = STROKE[1];
  const S1 = { pos: [0.22, 0.8, 0.95], look: [-0.1, 0.72, -0.15], fov: 42 };   // close two-shot: his face, the brush on the glass
  const S2 = { pos: [-0.05, 0.86, 1.95], look: [-0.36, 0.76, -0.05], fov: 36 };
  const S3 = { pos: [HC[0], 0.8, 1.45], look: [HC[0], 0.74, HC[2]], fov: 36 };
  const S4 = { pos: [-0.14, 0.86, 3.2], look: [-0.14, 0.76, -0.3], fov: 40 };
  const S5 = { pos: [1.3, 1.3, 1.75], look: [0.3, 0.86, -0.5], fov: 36 };
  const S6 = { pos: [-0.05, 0.86, 1.85], look: [-0.36, 0.78, -0.05], fov: 34 };
  const S8 = { pos: [-0.12, 0.84, 3.15], look: [-0.12, 0.74, -0.3], fov: 41, to: { pos: [-0.1, 0.83, 2.95], look: [-0.1, 0.74, -0.3], fov: 41 }, dur: 1.8, ease: "out" };
  const story = [["paint", 0, S1, "hook"], ["proud", 0.6, S2], ["alien", 1.2, S3], ["admire", 1.8, S4], ["lift", 3.3, S5, "payoff"], ["wizard", 5.5, S6], ["lower", 6.6, S5], ["thumbs-up", 8.2, S8]];
  const shots = story.filter(([, t]) => t >= START).map(([n, t, s, k]) => [n, r3(t - START), s, k ?? (t === START ? "hook" : undefined)]);
  const beats = c.beats(shots, END);

  const parts = [[0, "main"], [2.6, "build"], [4.15, "stop"], [6.6, "intro"], [8.25, "drop"]].map(([t, part]) => ({ at: r3(Math.max(0, t - START)), part }));
  write(import.meta.url, {
    id: `alien-makeup-${variant.toLowerCase()}`,
    title: `Alien makeup (opening ${variant})`,
    idea: "Jonny's story library #03: the Wizard paints the alien face on the outside of the visor, not on the Astronaut",
    experiment: { id: "hook-2026-11", episode: "alien-makeup", variant },
    seed: 3031,
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    set: { type: "apartment", seed: 7, light: "golden" },
    music: { styles: ["warm", "sneaky"], payoff: r3(4.15 - START), parts },
    sound: { sfx: 0.7, ambience: 0.3 },
    cast, props, captions: c.captions, beats,
    allowClip: [
      { who: "wiz", with: "helmet", from: 0, to: r3(Math.max(0.01, 0.75 - START)), reason: "the brush tip touches the visor glass" },
      { who: "wiz", with: "mirror", from: 0, to: END, reason: "he holds the hand mirror" },
      { who: "wiz", with: "table", from: 0, to: END, reason: "he stands at the makeup table; his hands put things on it" },
      { who: "ast", with: "helmet", from: 0, to: END, reason: "he wears the helmet (a prop over his head) and grips its visor rim" },
      { who: "ast", with: "table", from: 0, to: END, reason: "he stands at the makeup table" },
    ],
    notes: "Generated by storyboards/halloween/make-alien-makeup.mjs (hook lab, qa/HOOK.md).",
  });
}

for (const v of ["A", "B", "C"]) build(v);
