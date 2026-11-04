// THEN I'M A ZOMBIE TOO (Jonny's "would you still love me if i were a zombie" storyboard, 1 Nov 2026), from the clip
// template. node storyboards/trend/zombie-too/make-zombie-too.mjs -> zombie-too.json (same folder)
// Brief: /mnt/project-files/story-26-then-im-a-zombie-too.zip (ENGINE-PROMPT.md, storyboard-eight-panels.png); PANELS.md here.
//
// THE BRIEF (exactly 10 s, Reaper + zombie Phoenix; eight beats, eight-panel board, black letterbox bars)
//   Joke:        the trend plays it as tragedy: "would you still love me if i were a zombie?" Death himself has the
//                scythe raised over his zombie friend, and he can't do it.
//   Wants:       Reaper must end the zombie; zombie Phoenix only wants to share his one soggy fry.
//   Consequence: Reaper drops the scythe and hugs him, gets nibbled on the hood and turns too, and accepts it.
//   Ending:      both grey-green, shuffling off into the fog sharing the fry, the scythe dragging behind.
//   Callback:    the opening's raised scythe and tears (0 s) end as a scythe dragged along and a shared fry: same two,
//                opposite result.
//
//   1 0.0-2.0 ME: Reaper in the rain facing the lens, scythe raised and shaking in both hands, big tears, chin trembling
//   2 2.0-2.8 THE ZOMBIE: reverse, Phoenix shuffles out of the fog, one arm out, the limp fry in the other glove
//   3 2.8-3.5 WIND-UP: back to Reaper, the scythe lifts into a reluctant swing, teeth gritted
//   4 3.5-5.5 THE FRY: side two-shot, the blade sweeps down in slow motion and stops in the air above Phoenix's head;
//             Phoenix, oblivious, holds out the fry
//   5 5.5-6.2 HE CAN'T: the scythe clatters onto the wet ground beside them; Reaper opens his arms, sobbing
//   6 6.2-7.5 HUG: a full hug, Reaper's gloves round the outside of Phoenix's back, the fry hand up outside it
//   7 7.5-8.5 CHOMP: close side, Phoenix nibbles the top of the hood; the music stops; Reaper's eyes go wide and his
//             face fades grey-green
//   8 8.5-10  TOO: wide from behind, Reaper takes the scythe by the shaft and they shuffle off into the fog side by
//             side, sharing the fry; hard cut
//
// Departures (each with its reason; the brief wins everywhere else; panel departures in PANELS.md):
// - The costume scythe can't be let go, so on the 5.5 s cut Reaper becomes his scythe-less twin (characters/notyet)
//   and the scythe is a prop landing on the ground (props-notyet.js parkedscythe), as in Not Yet.
// - Music: the recorded sad piano and strings bed (assets/music/ai/sad) from 0:00, stopped dead on the nibble; one dry
//   pluck for the ending (the whitelist's "plunk": the brief's "tiny goofy pluck").
import { clip, write, r3, frame } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";

const OPENER = false;                 // the trend is silent tragedy: no line in the opening (brief: no speech)
const FOCUS = false;                  // Jonny 31 Oct: the whole frame sharp
const FACES = "strong";
const LOOK = process.env.LOOK || "sheet";   // castLook: the sheet faces + costumes (hatching by default since PR #84, Jonny's pick 4 Nov), or "golden"

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const END = 10.0;
const ZGREEN = "#93a07c";             // zombie Phoenix's skin (characters/zombie/phoenix-zombie.json)
const BAR = 420;                      // letterbox bars, px top and bottom (the picture: a 1080 x 1080 square, y 420-1500)
// a shot framed for the picture between the bars: h is the height in metres the square shows at the target
const fb = (target, o) => frame(target, { fov: 40, ...o, h: r3((o.h ?? 1) * 1920 / (1920 - 2 * BAR)) });

// ---------------------------------------------------------------- places (x right, z toward the side camera)
const REA = [-0.5, 0], PHX_END = [0.48, 0.04];
const PHX0 = [3.1, -0.45], PHX_MID = [1.75, -0.2];
const OFF = [-4.5, 4.5];
const HUG_REA = [-0.15, -0.2], HUG_PHX = [0.56, 0.32];   // close on screen, Phoenix a half step in front: the bodies touch but never go into each other (Jonny 4 Nov)
const SCY_GROUND = [-0.7, 0.03, 0.5];   // where the dropped scythe lies (its grip point), lower left of the side shots
const SHAFT_END = [-0.45, 0.03, -0.15];   // shot 8: the shaft's bottom end just in front of Reaper's left foot, the blade away to the left

const cast = [
  { id: "rea", character: "zombie/reaper-scythe-left", at: REA, face: 50, expr: "sad", follow: 0.2, seed: 3.3 },
  { id: "rea2", character: "notyet/reaper-noscythe", at: OFF, face: 80, expr: "sad", follow: 0.2, seed: 3.3, hidden: true },
  { id: "phx", character: "zombie/phoenix-zombie", at: PHX0, face: -62, expr: "kind", follow: 0.25, seed: 1.7, span: 0.25, signature: false },
];

// rain beads on the hood, tears running down both cheeks and dripping off the chin (body frame: x right, y up, z out)
const TEARS = [[-0.17, 0.62, 0.31], [-0.18, 0.55, 0.31], [-0.17, 0.48, 0.31], [0.17, 0.62, 0.31], [0.18, 0.55, 0.31], [0.17, 0.48, 0.31]];
const TEAR_DROPS = [[-0.17, 0.42, 0.3], [0.17, 0.42, 0.3], [0.0, 0.35, 0.32]];
const RAIN_BEADS = [[-0.3, 0.95, 0.2], [0.25, 1.02, 0.18], [0.36, 0.78, 0.22], [-0.38, 0.7, 0.2], [0.05, 1.08, 0.12], [-0.12, 1.0, 0.25], [0.3, 0.55, 0.28], [-0.33, 0.45, 0.27]];
const FRY = { id: "fry", kind: "soggyfry", x: PHX0[0], y: 0.4, z: PHX0[1], rot: 90, tip: 0, limp: 0.85 };

const props = [
  FRY,
  // the scythe once Reaper lets go (hidden below the floor until then)
  { id: "scyP", kind: "parkedscythe", x: SCY_GROUND[0], y: -5, z: SCY_GROUND[2], tip: 90, rot: -90 },
  { id: "pc", kind: "carrier", x: 0, y: 0, z: 0 },
  { id: "tearsR", kind: "drips", wear: "rea", x: 0, y: 0, z: 0, beads: TEARS, bead: 0.02, at: TEAR_DROPS, drop: 0.016, floor: 0.38, on: 1 },
  { id: "tearsR2", kind: "drips", wear: "rea2", x: 0, y: 0, z: 0, beads: TEARS, bead: 0.02, at: TEAR_DROPS, drop: 0.016, floor: 0.38, on: 1 },
  { id: "wetR", kind: "drips", wear: "rea", x: 0, y: 0, z: 0, beads: RAIN_BEADS, bead: 0.014, at: [[0.4, 0.5, 0.0], [-0.4, 0.5, 0.0]], drop: 0.012, floor: 0.4, on: 1 },
  { id: "wetR2", kind: "drips", wear: "rea2", x: 0, y: 0, z: 0, beads: RAIN_BEADS, bead: 0.014, at: [[0.4, 0.5, 0.0], [-0.4, 0.5, 0.0]], drop: 0.012, floor: 0.4, on: 1 },
  { id: "wetP", kind: "drips", wear: "phx", x: 0, y: 0, z: 0, beads: RAIN_BEADS, bead: 0.014, at: [[0.0, 0.3, 0.3]], drop: 0.012, floor: 0.3, on: 1 },
  // the street: wet asphalt with puddles mirroring the glow, rubble in groups (many small, few big), rain, rings, fog
  { id: "street", kind: "wetstreet", x: 0, y: 0, z: -1, w: 14, d: 14, glow: "#ff9a6a", sky: "#6f7fa3",
    puddles: [[-1.2, 1.6, 0.9, 0.4], [0.4, 0.9, 1.1, 0.35], [1.9, -0.6, 0.8, 0.5], [-0.6, -2.2, 1.4, 0.35], [0.7, -3.6, 1.6, 0.3], [-2.4, -0.4, 0.7, 0.5], [2.6, 1.8, 0.9, 0.4]] },
  { id: "rings", kind: "ripples", x: 0, y: 0, z: 0, box: [[-2.6, -3.5], [3.2, 2.4]], n: 90 },
  { id: "rubble", kind: "rubble", x: 0, y: 0, z: 0, seed: 7, items: [
    [-1.9, -0.9, 2.2, "chunk"], [-2.3, -0.5, 1.2, "slab", 30], [-1.55, -1.3, 0.8, "rebar", 60], [-2.6, -1.6, 1.6, "chunk"], [-1.25, 0.95, 0.6, "chunk"],
    [-1.6, 1.2, 0.5, "brick"], [2.2, -1.1, 1.8, "chunk"], [2.6, -0.6, 1.0, "slab", -40], [1.75, -1.5, 0.7, "brick"], [2.0, 0.9, 0.9, "rebar", 120],
    [2.9, 0.4, 1.4, "chunk"], [1.3, 1.5, 0.45, "chunk"], [-0.2, -2.6, 1.1, "slab", 15], [0.9, -2.9, 0.6, "chunk"], [-1.0, -3.4, 1.5, "chunk"],
    [3.4, -2.2, 2.4, "chunk"], [-3.3, -2.5, 2.0, "chunk"], [0.15, 1.65, 0.35, "brick"], [-0.75, 1.45, 0.4, "chunk"], [3.6, 1.2, 1.2, "slab", 70],
  ] },
  { id: "wallL", kind: "ruinwall", x: -3.4, y: 0, z: -3.0, rot: 25, w: 2.2, h: 1.9, t: 0.22, seed: 3, holes: [[-0.4, 0.95, 0.4, 0.45], [0.45, 0.7, 0.3, 0.38]] },
  { id: "wallR", kind: "ruinwall", x: 3.6, y: 0, z: -3.4, rot: -30, w: 2.4, h: 2.3, t: 0.22, seed: 8, holes: [[0.3, 1.2, 0.45, 0.5]] },
  { id: "wallB", kind: "ruinwall", x: 4.2, y: 0, z: 0.8, rot: -90, w: 2.0, h: 1.6, t: 0.2, seed: 12, holes: [[0, 0.8, 0.4, 0.4]] },
  { id: "rain", kind: "rainfall", x: 0, y: 0, z: 0, box: [[-3.4, 0, -3.6], [3.6, 3.2, 1.5]], n: 1100, width: 0.0045, len: 0.28, speed: 8, slant: 0.1, alpha: 0.34, color: "#dfe7f2" },
  { id: "fogR", kind: "fogveil", x: 0, y: 0, z: 0, box: [[1.6, 0.0, -1.6], [5.2, 1.2, 0.8]], n: 26, size: 1.4, color: "#a6b2c6", a: 0.42, drift: [-0.06, 0] },
  { id: "fogB", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-4.0, 0.0, -5.0], [4.0, 1.4, -2.2]], n: 30, size: 1.8, color: "#b4a9b8", a: 0.34, drift: [0.05, 0] },
  { id: "fogL", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-5.0, 0.0, -2.0], [-2.4, 1.3, 1.6]], n: 18, size: 1.5, color: "#9eaabf", a: 0.3, drift: [0.04, 0] },
];

// ---------------------------------------------------------------- captions (the trend's text, white on the upper bar)
c.cap(0, 2.0, "would you still love me\nif i were a zombie?", 244, false, { kinetic: false, size: 52 });
c.cap(1.0, 2.0, "me:", 384, false, { kinetic: false, size: 52 });

// rain, rings on the puddles and fog all on from frame 0
for (const id of ["rain", "rings", "fogR", "fogB", "fogL"]) c.prop(0, id, { on: 1 }, 0);

// ---------------------------------------------------------------- 1 ME (0-2.0): the scythe raised, shaking, tears
// Phoenix walks in from far right, behind the camera (unseen), the fry hanging from his left glove
const fry = grips.thin(c, "phx", FRY, { side: "L", from: 0.3 });
fry.secure(0, 0.01);
c.arm(0.02, "phx", "L", { x: [0.32, 0.12, 0.32] }, 0.01);   // both zombie arms out in front, the fry dangling from one
c.arm(0.02, "phx", "R", { x: [-0.32, 0.16, 0.34] }, 0.01);
A(0, "phx", "span", { to: 0.95, dur: 0.01 });   // the ragged wings open, like panel 2
A(3.0, "phx", "span", { to: 0.35, dur: 0.5 });
A(0, "phx", "face", { lid: 0.52, dur: 0.01 });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.85, open: 0.12 }, dur: 0.01 });
A(0, "phx", "noblink", { dur: 3.4 });
A(0, "phx", "move", { to: PHX_END, dur: 3.45, steps: 1.3, stride: 0.6 });   // one long shuffle (passes PHX_MID at 2.0 s)

// Reaper: the scythe up in both gloves (the left one holds it), the blade at the upper right, trembling
const HOLD = { L: [0.27, 0.44, 0.36], R: [0.19, 0.2, 0.4] };   // body frame: both gloves on the shaft at his chest, the left one high
c.arm(0, "rea", "L", { x: HOLD.L }, 0.01); c.arm(0, "rea", "R", { x: HOLD.R }, 0.01);
A(0, "rea", "grip", { side: "both", shape: "fist", dur: 0.01 });
A(0, "rea", "tilt", { to: [-12, 22], dur: 0.01 });
A(0, "rea", "expr", { expr: "sad", set: { open: 0.6, curve: -0.75, eye: 1.08 }, dur: 0.01 });
A(0, "rea", "face", { tear: 1, brow: 0.35, dur: 0.01 });
A(0, "rea", "look", { to: [0.18, 0.04], dur: 0.01, blink: false });
A(0, "rea", "noblink", { dur: 2.0 });
for (let i = 0, t = 0.05; t < 2.48; i++, t = r3(t + 0.11)) {
  const d = 0.024 * (i % 2 ? 1 : -1);
  c.arm(t, "rea", "L", { x: [r3(HOLD.L[0] + d), r3(HOLD.L[1] - d * 0.6), HOLD.L[2]] }, 0.1, "inOut");
  c.arm(t, "rea", "R", { x: [r3(HOLD.R[0] + d), r3(HOLD.R[1] - d * 0.6), HOLD.R[2]] }, 0.1, "inOut");
  A(t, "rea", "expr", { expr: "sad", set: { open: i % 2 ? 0.68 : 0.54, curve: -0.75, eye: 1.08 }, dur: 0.1 });   // the trembling chin
}
see(0, 2.0, ["rea.face"], "Reaper's crying face, with the scythe raised over it");

// ---------------------------------------------------------------- 2 THE ZOMBIE (2.0-2.8): reverse on Phoenix in the fog
A(1.9, "phx", "look", { to: [0.1, 0.05], dur: 0.2, blink: false });
see(2.05, 2.8, ["phx.face", "fry"], "zombie Phoenix comes out of the fog holding one limp fry");

// ---------------------------------------------------------------- 3 WIND-UP (2.8-3.5): the reluctant lift
c.arm(2.82, "rea", "L", { x: [0.3, 0.72, 0.22] }, 0.5, "inOut"); c.arm(2.82, "rea", "R", { x: [0.26, 0.3, 0.38] }, 0.5, "inOut");
A(2.82, "rea", "tilt", { to: [-40, 0], dur: 0.5 });
A(2.82, "rea", "pitch", { to: -6, dur: 0.5 });
A(2.8, "rea", "turn", { to: 22, dur: 0.3 });   // square to us for the lift (panel 3)
A(2.8, "rea", "expr", { expr: "sad", set: { open: 0.22, curve: -0.85, eye: 0.85 }, dur: 0.25 });   // grief, forcing himself (the sheet faces read "angry" as smug)
A(2.8, "rea", "face", { tear: 1, brow: 0.2, dur: 0.25 });
sfx(2.9, "cloth", { gain: 0.35, reason: "Reaper's robe as he lifts the scythe" });
see(2.85, 3.45, ["rea.face", "rea"], "the scythe goes up; Reaper grits his teeth through the tears");

// ---------------------------------------------------------------- 4 THE FRY (3.5-5.5): the slow swing stops above his head
const SWING = 3.5, STOP = 4.05, SW = r3(STOP - SWING);
A(SWING, "rea", "turn", { to: 22, dur: 0.3 });
A(SWING, "rea", "look", { to: [0.7, 0.15], dur: 0.15, blink: false });
c.arm(SWING, "rea", "L", { x: [0.32, 0.58, 0.34] }, SW, "in"); c.arm(SWING, "rea", "R", { x: [0.2, 0.26, 0.5] }, SW, "in");   // the lower glove under his chin, never across the face
A(SWING, "rea", "tilt", { to: [4, 12], dur: SW, ease: "in" });
A(SWING, "rea", "pitch", { to: 4, dur: SW, ease: "in" });
sfx(SWING + 0.05, "whoosh", { gain: 0.35, reason: "the scythe sweeps down, slow" });
// the stop: a shudder through the arms, rain drops burst off the blade, a thin ring
c.arm(STOP, "rea", "L", { x: [0.32, 0.61, 0.34] }, 0.06, "out"); c.arm(r3(STOP + 0.06), "rea", "L", { x: [0.32, 0.59, 0.34] }, 0.12, "settle");
A(STOP, "rea", "squash", { amount: 0.05, dur: 0.15 });
c.at(STOP, { fx: "poof", sound: false, pos: [0.45, 1.42, -0.1], dur: 0.7, color: "#d8e6f6", puffs: 0, sparks: 34, spark: "#cfe3ff", sparkSize: 0.55, size: 0.35, lift: 0.05 });
sfx(STOP, "shing", { gain: 0.3, reason: "the blade stops dead in the air above Phoenix: a thin metal ring" });
A(STOP, "rea", "expr", { expr: "sad", set: { open: 0.2, curve: -0.8, eye: 1.0 }, dur: 0.3 });
// Phoenix stops right under it, oblivious, and holds out the fry
A(3.45, "phx", "turn", { to: -70, dur: 0.3 });
A(3.6, "phx", "look", { to: [-0.3, 0.12], dur: 0.2, blink: false });
c.arm(2.85, "phx", "R", "rest", 0.45);   // the zombie arm drops before he reaches Reaper
c.arm(4.25, "phx", "L", { x: [0.3, 0.3, 0.34] }, 0.7, "inOut");
A(4.4, "phx", "expr", { expr: "kind", set: { curve: 0.45, eye: 0.85, open: 0.1 }, dur: 0.3 });
A(4.5, "phx", "talk", { line: "hrr?", tone: "calm", dur: 0.35, voice: false });
A(4.75, "rea", "look", { to: [0.55, -0.15], dur: 0.2, blink: false });   // his eyes drop to the fry
A(4.8, "rea", "expr", { expr: "sad", set: { open: 0.3, curve: -0.85, eye: 1.12 }, dur: 0.3 });
see(STOP, 5.45, ["rea.face", "phx.face", "fry"], "the blade stopped above Phoenix's head, the fry held out, both faces");

// ---------------------------------------------------------------- 5 HE CAN'T (5.5-6.2): the scythe on the ground, arms open
const CUT5 = 5.5;
A(CUT5, "rea", "hide"); A(CUT5, "rea2", "show");
A(CUT5, "rea", "move", { to: OFF, dur: 0, ease: "linear" });
A(CUT5, "rea2", "move", { to: REA, dur: 0, ease: "linear" }); A(CUT5, "rea2", "turn", { to: 30, dur: 0 });
c.arm(CUT5, "rea2", "R", { x: [-0.3, 0.3, 0.35] }, 0); c.arm(CUT5, "rea2", "L", { x: [0.3, 0.3, 0.35] }, 0);
c.arm(r3(CUT5 + 0.05), "rea2", "R", { x: [-0.52, 0.66, 0.2] }, 0.3, "out"); c.arm(r3(CUT5 + 0.05), "rea2", "L", { x: [0.52, 0.66, 0.2] }, 0.3, "out");
A(CUT5, "rea2", "grip", { side: "both", shape: "open", dur: 0.15 });
A(CUT5, "rea2", "expr", { expr: "sad", set: { open: 0.6, curve: -0.85, eye: 0.95 }, dur: 0 });
A(CUT5, "rea2", "face", { tear: 1, brow: 0.45, dur: 0 });
A(CUT5, "rea2", "look", { to: [0.6, 0.05], dur: 0, blink: false });
A(CUT5, "rea2", "noblink", { dur: 2.0 });
A(r3(CUT5 + 0.05), "rea2", "talk", { line: "waaah", tone: "sad", dur: 0.55, voice: false });
// the scythe lands flat beside him: a short tip over and a bounce on the wet asphalt
c.prop(CUT5, "scyP", { y: 0.2, tip: 55 }, 0);
c.prop(CUT5, "scyP", { y: 0.03, tip: 90 }, 0.12, "in");
c.prop(r3(CUT5 + 0.12), "scyP", { y: 0.06 }, 0.06, "out"); c.prop(r3(CUT5 + 0.18), "scyP", { y: 0.03 }, 0.08, "in");
sfx(r3(CUT5 + 0.12), "hit-metal", { gain: 0.45, reason: "the scythe clatters onto the street" });
sfx(r3(CUT5 + 0.13), "splash", { gain: 0.35, reason: "it lands in the wet" });
c.at(r3(CUT5 + 0.12), { fx: "poof", sound: false, pos: [SCY_GROUND[0] - 0.3, 0.05, SCY_GROUND[2]], dur: 0.5, color: "#b9c6d8", puffs: 0, sparks: 22, spark: "#d4e2f4", sparkSize: 0.5, size: 0.4, lift: 0.08 });
A(CUT5, "phx", "look", { to: [-0.4, 0.1], dur: 0.1, blink: false });
see(CUT5 + 0.15, 6.15, ["rea2.face", "phx", "scyP", "fry"], "the scythe on the ground, Reaper's arms open, Phoenix still holding the fry");

// ---------------------------------------------------------------- 6 HUG (6.2-7.5)
const HUG = 6.2;
A(r3(HUG - 0.12), "rea2", "look", { to: [0.5, 0.0], dur: 0.1, blink: false });
A(HUG, "rea2", "move", { to: HUG_REA, dur: 0.45, steps: 2 });
A(HUG, "phx", "move", { to: HUG_PHX, dur: 0.45, steps: 2 });
A(HUG, "phx", "span", { to: 0.0, dur: 0.3 });   // the wings fold aside
A(HUG, "rea2", "turn", { to: 18, dur: 0.25 });
A(HUG, "phx", "turn", { to: -30, dur: 0.25 });
// Reaper's gloves round the outside of Phoenix's back (the near one in view); Phoenix's fry hand up outside the hug
c.arm(r3(HUG + 0.02), "rea2", "R", { x: [-0.48, 0.2, 0.3] }, 0.15, "inOut");   // down by his side first, so the arm never crosses his face
c.arm(r3(HUG + 0.17), "rea2", "R", { world: [r3(HUG_PHX[0] - 0.05), 0.22, r3(HUG_PHX[1] + 0.4)] }, 0.3, "inOut");
c.arm(r3(HUG + 0.15), "rea2", "L", { world: [r3(HUG_PHX[0] + 0.2), 0.62, r3(HUG_PHX[1] - 0.42)] }, 0.35, "inOut");
A(r3(HUG + 0.4), "rea2", "grip", { side: "both", shape: "relaxed", dur: 0.15 });
c.arm(r3(HUG + 0.2), "phx", "L", { x: [0.34, 0.62, 0.24] }, 0.35, "inOut");
c.arm(r3(HUG + 0.2), "phx", "R", { x: [-0.4, 0.22, 0.12] }, 0.35, "inOut");   // his near arm low at his side: nothing between the two faces
A(r3(HUG + 0.35), "rea2", "expr", { expr: "sad", set: { open: 0.15, curve: 0.2, eye: 0.06 }, dur: 0.3 });   // eyes squeezed, a wobbly smile
A(r3(HUG + 0.4), "phx", "expr", { expr: "serene", set: { curve: 0.55 }, dur: 0.3 });
sfx(r3(HUG + 0.3), "cloth", { gain: 0.45, reason: "the hug: robe against Phoenix" });
see(HUG + 0.5, 7.45, ["rea2", "phx", "fry"], "the full hug, the fry up outside it");

// ---------------------------------------------------------------- 7 CHOMP (7.5-8.5): close, Phoenix behind and above Reaper
const CUT7 = 7.5, BITE = 7.72;
const CH_REA = [-0.12, 0.16], CH_PHX = [0.32, -0.32];
A(CUT7, "rea2", "move", { to: CH_REA, dur: 0, ease: "linear" }); A(CUT7, "rea2", "turn", { to: 42, dur: 0 });
A(CUT7, "rea2", "pitch", { to: 0, dur: 0 }); A(CUT7, "rea2", "crouch", { to: 0.25, dur: 0 });
c.arm(CUT7, "rea2", "R", { x: [-0.3, 0.45, 0.25] }, 0); c.arm(CUT7, "rea2", "L", { x: [0.36, 0.35, 0.3] }, 0);
A(CUT7, "rea2", "expr", { expr: "sad", set: { open: 0.1, curve: 0.25, eye: 0.06 }, dur: 0 });
A(CUT7, "phx", "ride", { prop: "pc", off: [0, 0, 0], yaw: 15, dur: 0 });
c.prop(CUT7, "pc", { x: CH_PHX[0], y: 0.5, z: CH_PHX[1] }, 0);
A(CUT7, "phx", "pitch", { to: 10, dur: 0 });
A(r3(CUT7 + 0.02), "phx", "pitch", { to: 30, dur: 0.18 });
c.arm(CUT7, "phx", "L", { x: [0.48, 0.66, 0.2] }, 0); c.arm(CUT7, "phx", "R", { x: [-0.3, 0.45, 0.3] }, 0);
A(r3(CUT7 + 0.05), "phx", "talk", { line: "nom", tone: "calm", dur: 0.25, voice: false });
A(r3(BITE - 0.14), "phx", "expr", { expr: "serene", set: { curve: 0.2, open: 0.35 }, dur: 0.06 });   // "nom": open...
A(BITE, "phx", "expr", { expr: "serene", set: { curve: 0.3, open: 0.0 }, dur: 0.06 });   // ...and closed on the hood
A(BITE, "phx", "squash", { amount: 0.04, dur: 0.12 });
sfx(BITE, "gulp", { gain: 0.5, reason: "a soft cartoon nibble on the hood ('glk')" });
A(r3(BITE + 0.1), "rea2", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.3, curve: -0.2 }, dur: 0.12 });
A(r3(BITE + 0.08), "rea2", "face", { tear: 0.6, brow: 0.6, dur: 0.12 });
A(r3(BITE + 0.06), "rea2", "look", { to: [0.0, 0.25], dur: 0.12, blink: false });
sfx(r3(BITE + 0.1), "gasp", { gain: 0.45, reason: "Reaper's small surprised gasp at the nibble" });
A(r3(BITE + 0.12), "rea2", "skin", { color: ZGREEN, to: 1, dur: 0.45 });
A(r3(BITE + 0.5), "phx", "pitch", { to: 10, dur: 0.3 });
see(BITE, 8.45, ["rea2.face", "phx.face", "fry"], "the nibble on the hood; Reaper's face goes grey-green");

// ---------------------------------------------------------------- 8 TOO (8.5-10): he takes the scythe, they shuffle off
const CUT8 = 8.5;
A(CUT8, "phx", "ride", {}); c.prop(CUT8, "pc", { y: 0 }, 0);
A(CUT8, "rea2", "crouch", { to: 0, dur: 0 }); A(CUT8, "rea2", "pitch", { to: 0, dur: 0 }); A(CUT8, "phx", "lean", { to: 0, dur: 0 }); A(CUT8, "phx", "pitch", { to: 0, dur: 0 });
A(CUT8, "rea2", "move", { to: [-0.38, 0.08], dur: 0, ease: "linear" }); A(CUT8, "phx", "move", { to: [0.52, 0.04], dur: 0, ease: "linear" });
// (cheated on the cut: the scythe lies just in front of his left foot, the blade away to the left)
c.prop(CUT8, "scyP", { x: r3(SHAFT_END[0] - 0.55), z: SHAFT_END[2] }, 0);
A(CUT8, "rea2", "turn", { to: 180, dur: 0 }); A(CUT8, "phx", "turn", { to: 180, dur: 0 });
c.arm(CUT8, "rea2", "R", { x: [-0.3, 0.25, 0.12] }, 0); c.arm(CUT8, "rea2", "L", "rest", 0);
A(CUT8, "rea2", "expr", { expr: "kind", set: { curve: 0.3, eye: 0.8 }, dur: 0 });
A(CUT8, "rea2", "face", { tear: 0.3, lid: 0.45, dur: 0 });
A(CUT8, "phx", "span", { to: 0.25, dur: 0.3 });
// he reaches down for the shaft by his left side, takes it, and they shuffle off into the fog together
A(r3(CUT8 + 0.02), "rea2", "crouch", { to: 0.45, dur: 0.2 });
A(r3(CUT8 + 0.02), "rea2", "pitch", { to: 14, dur: 0.2 });
c.arm(r3(CUT8 + 0.02), "rea2", "L", { world: [SHAFT_END[0], 0.11, SHAFT_END[2]] }, 0.24, "inOut");
A(r3(CUT8 + 0.2), "rea2", "grip", { side: "L", shape: "fist", dur: 0.08 });
A(r3(CUT8 + 0.3), "rea2", "grab", { prop: "scyP", hand: "L", keep: true, dur: 0, pose: null });
sfx(r3(CUT8 + 0.28), "grab", { gain: 0.35 });
A(r3(CUT8 + 0.36), "rea2", "crouch", { to: 0, dur: 0.22 }); A(r3(CUT8 + 0.36), "rea2", "pitch", { to: 0, dur: 0.22 });
c.arm(r3(CUT8 + 0.36), "rea2", "L", { x: [0.34, 0.22, -0.08] }, 0.3, "inOut");
c.prop(r3(CUT8 + 0.36), "scyP", { rot: 175, tip: 82 }, 0.45, "inOut");   // the blade swings round to trail behind him
const WALK = 8.95;
A(r3(WALK - 0.15), "rea2", "look", { to: [0.4, 0.0], dur: 0.12, blink: false }); A(r3(WALK - 0.15), "phx", "look", { to: [-0.4, 0.0], dur: 0.12, blink: false });
A(WALK, "rea2", "move", { to: [-0.05, -1.35], dur: 1.35, steps: 1.3, stride: 0.6 });
A(WALK, "phx", "move", { to: [0.6, -1.18], dur: 1.35, steps: 1.3, stride: 0.55 });
// the fry held up between them, both leaning in to it
c.arm(CUT8, "phx", "R", "rest", 0); c.arm(CUT8, "phx", "L", { x: [0.26, 0.6, 0.32] }, 0);
c.arm(9.15, "phx", "L", { x: [0.36, 0.78, 0.3] }, 0.4, "inOut");
A(9.05, "rea2", "lean", { to: -8, dur: 0.6 }); A(9.05, "phx", "lean", { to: 8, dur: 0.6 });
A(9.1, "rea2", "turn", { to: 140, dur: 0.55 }); A(9.1, "phx", "turn", { to: 220, dur: 0.55 });
A(9.2, "rea2", "look", { to: [0.9, 0.0], dur: 0.2, blink: false }); A(9.2, "phx", "look", { to: [-0.9, 0.0], dur: 0.2, blink: false });   // faces to each other over the fry
A(9.4, "rea2", "expr", { expr: "happy", set: { eye: 0.5, curve: 0.6, open: 0.25 }, dur: 0.3 });
A(9.4, "phx", "expr", { expr: "happy", set: { eye: 0.4, curve: 0.6, open: 0.25 }, dur: 0.3 });
sfx(8.62, "plunk", { gain: 0.5, reason: "a tiny goofy pluck as the zombie ending starts (the music stopped on the bite)" });
sfx(9.45, "plunk", { gain: 0.42, reason: "a second goofy pluck as they share the fry" });
see(CUT8 + 0.1, 8.9, ["rea2", "scyP"], "Reaper picks the scythe up by its shaft");
see(9.1, 9.95, ["rea2", "phx", "fry", "scyP"], "the two shuffle into the fog side by side, sharing the fry, the scythe dragging");

// ---------------------------------------------------------------- shots: [name, start, camera, kind?] (each copies a panel)
const beats = c.beats([
  ["1 me", 0, fb([-0.4, 1.1, 0], { az: 26, el: -8, h: 1.72, push: 0.08, dur: 2.0 }), "hook"],
  ["2 the zombie", 2.0, fb([1.4, 0.62, -0.15], { az: -48, el: -4, h: 1.5, push: 0.05, dur: 0.8 })],
  ["3 wind-up", 2.8, fb([-0.5, 1.1, 0], { az: 6, el: -10, h: 1.65 })],
  ["4 the fry", SWING, fb([0.12, 1.0, -0.05], { az: 0, el: 2, h: 2.3, push: 0.06, dur: 2.0 }), "payoff"],
  ["5 he can't", CUT5, fb([-0.12, 0.62, 0.1], { az: 8, el: 4, h: 1.75 })],
  ["6 hug", HUG, fb([0.16, 0.66, 0.1], { az: -12, el: 2, h: 1.62, push: 0.05, dur: 1.3 })],
  ["7 chomp", CUT7, fb([0.1, 0.98, 0.0], { az: 40, el: -3, h: 1.3 }), "reaction"],
  ["8 too", CUT8, fb([0.08, 0.72, -0.6], { az: -18, el: 8, h: 2.3, push: 0.06, dur: 1.5 })],
], END);

const ALLOW = [
  { who: "phx", with: "fry", from: 0, to: END, reason: "Phoenix pinches the soggy fry the whole clip" },
  { who: "rea2", with: "phx", from: HUG + 0.1, to: CUT8, reason: "the hug: Reaper's gloves round Phoenix's back, then the nibble on the hood" },
  { who: "phx", with: "rea2", from: HUG + 0.1, to: CUT8, reason: "the hug and the nibble on the top of Reaper's hood (soft lips, no teeth)" },
  { who: "rea2", with: "scyP", from: CUT8 + 0.1, to: END, reason: "Reaper takes the scythe by its shaft and drags it" },
  { who: "rea2", with: "phx", from: 9.0, to: END, reason: "shoulders touching as they walk off together" },
  { who: "phx", with: "rea2", from: 9.0, to: END, reason: "shoulders touching as they walk off together" },
];

write(import.meta.url, {
  id: "zombie-too",
  title: "Then I'm a Zombie Too",
  idea: "Jonny's zombie trend storyboard (1 Nov 2026): Death can't end his zombie friend, hugs him, gets nibbled and accepts it",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK,
motion: "natural",
  letterbox: { top: BAR, bottom: BAR },
  set: { type: "plain", color: "#4a5268", floor: "#2c3240", light: "dusk-rain", night: true, aperture: FOCUS ? 0.045 : 0,
    plate: { src: "assets/plates/zombie-street-back.png", z: -8.5, center: [0, 1.6], height: 12.5, depth: false, motion: false, dust: 0 },
    plates: [
      { src: "assets/plates/zombie-street-left.png", center: [-8.5, 1.6], z: 0, height: 12.5, turn: 90 },
      { src: "assets/plates/zombie-street-right.png", center: [8.5, 1.6], z: 0, height: 12.5, turn: -90 },
    ] },
  music: { file: "ai/sad/sad-02.ogg", gain: 0.5, until: BITE, lock: false, dip: false },
  sound: { sfx: 0.7, ambience: 0.35, surface: "concrete", signature: { payoff: false, entrances: false } },
  hook: { show: ["rea"], hint: 0, what: "Reaper in the rain, crying, the scythe raised at someone just past the camera" },
  creative: { length: [10, 10] },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: ALLOW,
  notes: "Generated by storyboards/trend/zombie-too/make-zombie-too.mjs. LOOK=golden for the template's cast look.",
});
