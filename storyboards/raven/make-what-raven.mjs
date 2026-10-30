// WHAT RAVEN? (eight trend tests #04, 29 Oct 2026), built from the clip template.
// node storyboards/raven/make-what-raven.mjs -> storyboards/raven/what-raven.json
//
// THE BRIEF (04-what-raven/ENGINE-PROMPT.md: 12.00 s, eight shots, no loop); Jonny 29 Oct 19:41: about 10 s, a hook
// caption, background music, try the character voices in this one, lots of action, a strong first 2 s, quick setup cuts
//   Joke:        Reaper swears he hasn't seen Odin's raven while it is hiding in his hood; one sneeze blows three
//                ravens out of it.
//   Wants:       Reaper wants Odin to believe him (and to keep the birds).
//   Consequence: the evidence perches on him: one on his hood, one on each armrest, the hood one nuzzling him.
//   Ending:      Reaper, hands in his lap, deadpan: "...What ravens?" Odin's deadpan stare holds. No loop, no rewind.
//
//   1 0.00-1.20  two-shot: Odin strides in at the left edge, photo up; a raven beak pokes out of the hood above
//                Reaper's forehead and his own right hand pushes it back in (frame 0 two-shot: the analytics read)
//   2 1.20-1.70  insert: Odin's glove thrusts a photo of ONE black raven into frame. Odin: "Seen my raven?" (from 0.35)
//   3 1.70-2.90  medium: Reaper, hands in his lap, shakes his head: "What raven?" Odin studies him from the left
//   4 2.90-3.90  the hood bulges (muffled flapping); his smile tightens; Odin raises one brow and leans in
//   5 3.90-5.40  close: one black feather drifts down onto his face; his eyes drop to it: "Ahh..."
//   6 5.40-7.20  "Ahh... CHOO!" three small ravens burst out above his forehead in a staggered arc and swoop round
//   7 7.20-8.60  they land: one on the hood, one on each armrest; Odin looks from his one-bird photo to the three
//   8 8.60-10.6  Reaper frozen, hands in his lap: "...What ravens?" The hood raven taps his head fondly. Odin's deadpan stare.
//
// Blocking (x right, z toward the camera): the armchair faces the camera at x 0.2; Reaper sits in it. Odin stands at
// the left edge, turned toward him (yaw 58), and holds the photo in his own RIGHT hand (the camera side) all clip.
// The three birds are the same small raven prop (props-robbed.js), hidden (scale 0) inside the hood until they come
// out of the opening above his forehead; Odin's shoulder raven is off ("raven": false in allfather-crisp).
// Departures from the brief (each one Jonny's 29 Oct ask): the hook caption; ~10.6 s instead of 12; two voiced lines
// each and an inhale/sneeze in Reaper's voice instead of "no dialogue" (the picture still tells it on mute).
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import * as grips from "../lib/grips.mjs";

const c = clip(), { A, sfx } = c;
// --gibberish writes what-raven-gibberish.json (Jonny 30 Oct): the words in the characters' gibberish voices, the
// sneeze still real (it isn't a word), the same English subtitles, music and timing
const GIB = process.argv.includes("--gibberish");
const words = GIB ? { voice: false } : {};
const END = 10.6;

// ---------------------------------------------------------------- places
const CHAIR = [0.2, 0];
const REA = [0.2, 0.03], ODIN = [-0.9, 0.78], ODIN_IN = [-0.82, 0.8], ODIN_BACK = [-1.04, 0.74], ODIN_FROM = [-1.0, 0.84];   // in front of the chair's left arm
const ODIN_YAW = 52;
const HOOD_OUT = [0.2, 1.5, 0.3];                    // the hood opening above his forehead: where every bird comes out
const INSIDE = [0.2, 1.3, 0.05];                       // inside the head (the body hides it)
const PERCH = { top: [0.03, 1.53, -0.01], L: [-0.45, 0.67, 0.12], R: [0.85, 0.67, 0.12] };   // hood top, armrests (screen-left, screen-right)
const RAVEN = 1.3;                                     // a small raven (the robbed clip's was 1.6)

// the photo in Odin's right hand (grip library phone hold: upright in the palm, the picture away from him)
const PHOTO_SHOW = [-0.46, 0.3, 1.16], PHOTO_LOW = [-0.62, 0.34, 1.12];   // shown below his eyes, toward Reaper
const PHOTO_START = [PHOTO_LOW[0] + ODIN_FROM[0] - ODIN[0], PHOTO_LOW[1], PHOTO_LOW[2] + ODIN_FROM[1] - ODIN[1]];   // in his hand where he starts
const PHOTO = { id: "photo", kind: "ravenphoto", scale: 1.6, ...grips.placeFor("ravenphoto", PHOTO_START, ODIN_YAW, { turn: -28 }) };

// eye targets: + right on screen, + up
const R_AT_ODIN = [-0.8, 0.05], R_UP = [-0.15, 0.85], R_NOSE = [0.02, -0.55], R_AHEAD = [0, 0];
const O_AT_REA = [0.75, -0.05], O_AT_PHOTO = [0.2, -0.55], O_AT_HOOD = [0.7, 0.45], O_AT_ARM_L = [0.45, -0.35], O_AT_ARM_R = [0.9, -0.3];

const cast = [
  { id: "rea", character: "lookdev/reaper-crisp", at: REA, face: "camera", expr: "kind", follow: 0.2, seed: 4.1 },
  { id: "odin", character: "lookdev/allfather-crisp", at: ODIN_FROM, face: ODIN_YAW, expr: "stern", follow: 0.3, seed: 6.3 },
];
const props = [
  { id: "rug", kind: "rug", x: -0.2, z: 0.6, w: 3.4, d: 2.4, color: "#d8c4a0" },
  { id: "chair", kind: "redarmchair", x: CHAIR[0], z: CHAIR[1] },
  PHOTO,
  { id: "r1", kind: "raven", x: INSIDE[0], y: INSIDE[1], z: INSIDE[2], scale: 0 },   // the peeker (later the hood one)
  { id: "r2", kind: "raven", x: INSIDE[0], y: INSIDE[1], z: INSIDE[2], scale: 0 },
  { id: "r3", kind: "raven", x: INSIDE[0], y: INSIDE[1], z: INSIDE[2], scale: 0 },
  { id: "feather", kind: "ravenfeather", x: 0.3, y: 1.5, z: 0.47, scale: 1.25 },
];

// ---------------------------------------------------------------- helpers
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const fly = (t, id, to, dur, { arc = 0, rot, flap = 1, ease = "inOut" } = {}) =>
  c.at(t, { do: "prop", id, set: { x: r3(to[0]), y: r3(to[1]), z: r3(to[2]), flap, ...(rot != null && { rot }) }, dur, ease, ...(arc && { arc }) });
// Reaper's hands rest in his lap between the pushes (Jonny 29 Oct 21:54: the palms-to-the-lens pose looked unnatural)
const lap = (t, dur = 0.35) => {
  c.arm(t, "rea", "R", { x: [-0.24, 0.22, 0.34] }, dur, "inOut"); c.arm(t, "rea", "L", { x: [0.24, 0.22, 0.34] }, dur, "inOut");
  A(t, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
};

// ---------------------------------------------------------------- setup at frame 0
A(0, "rea", "sit", { seat: "chair", dur: 0, hands: "keep" });   // dur 0: seated on frame 0 itself
act.blinksAt(c, "rea", [3.5, 7.55]);
act.blinksAt(c, "odin", [2.6, 6.9]);   // no blink in his closing stare
lap(0, 0);
const photo = grips.phone(c, "odin", PHOTO, { side: "R" });
photo.secure(0, 0.01);
look(0, "odin", O_AT_REA, 0.01);
// frame 0: already striding in from the left edge, the photo up in his right hand
A(0, "odin", "move", { to: ODIN, dur: 0.6, ease: "out", steps: 2.5 });

// ---------------------------------------------------------------- 1 HOOK 0.00-0.65: the beak, shoved back in
// frame 0: the beak already out of the hood's top edge (left of the middle, his right), his eyes sliding up to it
c.prop(0, "r1", { scale: RAVEN, x: 0.09, y: 1.22, z: 0.22, rot: 0, tip: 35 }, 0);   // head and both eyes over the hood edge   // beak and eyes to the lens
c.prop(0.03, "r1", { flap: 1 }, 0.05); c.prop(0.14, "r1", { flap: 0 }, 0.06);   // the first thing that moves is the bird
c.prop(0.12, "r1", { peck: 1 }, 0.06); c.prop(0.18, "r1", { peck: 0 }, 0.08);
look(0, "rea", R_UP, 0.01);
A(0, "rea", "expr", { expr: "kind", set: { curve: 0.1, eye: 1.12 }, dur: 0.01 });
c.cap(0, 1.2, "When you borrowed\nOdin's raven", 250, false, { kinetic: false });   // the analytics read (29 Oct evening): a relatable "When..." line
// his own right hand comes up and pushes the beak back under the hood
c.arm(0.34, "rea", "R", { x: [-0.13, 0.78, 0.42], palm: [-0.05, 0.78, 0.22] }, 0.16, "out");
A(0.34, "rea", "grip", { side: "R", shape: "flat", dur: 0.12 });
c.prop(0.5, "r1", { x: INSIDE[0], y: INSIDE[1], z: INSIDE[2] }, 0.12, "in");
sfx(0.5, "cloth", { gain: 0.5, reason: "the raven shoved back under the hood (on screen)" });
sfx(0.04, "ai/raven-caw", { gain: 0.3, reason: "the peeking raven (on screen at the hood edge)" });
c.arm(0.56, "rea", "R", { x: [-0.24, 0.22, 0.34] }, 0.3, "inOut"); A(0.58, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.prop(0.57, "r1", { scale: 0 }, 0.01);                // out of sight inside the hood
look(0.5, "rea", R_AHEAD, 0.12);
A(0.5, "rea", "expr", { expr: "kind", set: { curve: 0.35, smirk: 0.15 }, dur: 0.25 });   // all innocence

// ---------------------------------------------------------------- 2 INSERT 0.65-1.30: the photo, thrust into frame
act.eyesLead(c, 0.66, "odin", O_AT_PHOTO);
photo.carry(0.66, PHOTO_SHOW, 0.24, "out");
look(0.85, "odin", O_AT_REA, 0.15);
sfx(0.7, "whoosh", { gain: 0.25, reason: "the photo snapped up into frame" });
// his subtitle sits under the hook caption and goes with the two-shot (the insert is all Odin: no text over him)
c.macro(0.35, "odin", "say", { line: "Seen my raven?", tone: "question", caption: false, ...words });
c.cap(0.35, 1.2, "Seen my raven?", 470);

// ---------------------------------------------------------------- 3 MEDIUM 1.30-2.90: hands in his lap, "What raven?"
look(1.55, "rea", R_AT_ODIN, 0.15);
A(1.7, "rea", "squash", { amount: -0.04, dur: 0.15 });   // a little innocent shrug, chin up
A(1.7, "rea", "pitch", { to: -4, dur: 0.2 }); A(2.35, "rea", "pitch", { to: 0, dur: 0.3 });
c.macro(1.72, "rea", "say", { line: "What raven?", tone: "calm", pos: 300, ...words });
A(1.8, "rea", "turn", { to: -9, dur: 0.16 }); A(1.96, "rea", "turn", { to: 9, dur: 0.18 }); A(2.14, "rea", "turn", { to: -6, dur: 0.16 }); A(2.3, "rea", "turn", { to: 0, dur: 0.18 });
A(1.72, "rea", "expr", { expr: "kind", set: { curve: 0.4, eye: 1.08 }, dur: 0.25 });
A(1.7, "odin", "still", { dur: 1.15, idle: 0.06 });

// ---------------------------------------------------------------- 4 THE BULGE 2.90-3.90: something wriggles in the hood
for (const [t, a] of [[2.95, 0.045], [3.2, -0.03], [3.42, 0.035]]) A(t, "rea", "squash", { amount: a, dur: 0.12 });
A(2.95, "rea", "lean", { to: 5, dur: 0.12 }); A(3.15, "rea", "lean", { to: -4, dur: 0.14 }); A(3.4, "rea", "lean", { to: 0, dur: 0.2 });
sfx(2.95, "wings", { gain: 0.45, dur: 0.6, reason: "muffled wing beats inside the bulging hood (on screen)" });
// a second peek, on the other side of the hood, while Odin checks his photo: his left hand pats it back under
look(3.0, "odin", O_AT_PHOTO, 0.2);
c.prop(3.05, "r1", { scale: RAVEN, x: 0.31, y: 1.15, z: 0.22, rot: 20, tip: 20, flap: 0.5 }, 0.01);
c.prop(3.06, "r1", { y: 1.18 }, 0.12, "out"); c.prop(3.3, "r1", { flap: 0 }, 0.05);
look(3.1, "rea", [0.35, 0.85], 0.12);
c.arm(3.1, "rea", "L", { x: [0.13, 0.74, 0.42], palm: [0.05, 0.74, 0.22] }, 0.22, "out");
A(3.18, "rea", "grip", { side: "L", shape: "flat", dur: 0.12 });
c.prop(3.32, "r1", { x: INSIDE[0], y: INSIDE[1], z: INSIDE[2] }, 0.17, "in");
sfx(3.32, "cloth", { gain: 1.0, reason: "the raven patted back under the hood (on screen)" });
c.prop(3.5, "r1", { scale: 0 }, 0.01);
c.arm(3.5, "rea", "L", { x: [0.24, 0.22, 0.34] }, 0.35, "inOut"); A(3.52, "rea", "grip", { side: "L", shape: "relaxed", dur: 0.2 });   // back into his lap
look(3.0, "rea", R_UP, 0.12);
A(3.0, "rea", "expr", { expr: "kind", set: { curve: 0.55, smirk: 0, open: 0, eye: 1.15 }, dur: 0.15 });   // the smile goes stiff
A(3.0, "rea", "face", { press: 0.6, dur: 0.15 });
c.at(3.4, { fx: "sweat", who: "rea", dur: 0.5, count: 3 });
look(3.45, "rea", R_AT_ODIN, 0.15);
sfx(3.12, "ai/raven-caw", { gain: 0.3, reason: "a muffled caw from inside the bulging hood (on screen)" });
A(3.55, "odin", "expr", { expr: "stern", set: { raise: 0.06 }, dur: 0.2 });   // one brow up
A(3.55, "odin", "move", { to: ODIN_IN, dur: 0.35, ease: "inOut", steps: 1 });
look(3.5, "odin", O_AT_REA, 0.2);

// ---------------------------------------------------------------- 5 THE FEATHER 3.90-5.40: it drifts onto his face
// it drifts down by hand (fall 0.002 keeps it visible and upright, facing the camera), swaying, and comes to rest
// across his face between the eyes and the mouth, like a little moustache
c.prop(3.9, "feather", { fall: 0.002, roll: 0 }, 0.01);
c.prop(3.92, "feather", { x: 0.12, y: 1.3, z: 0.47, roll: -25 }, 0.3, "inOut");
c.prop(4.22, "feather", { x: 0.3, y: 1.13, z: 0.46, roll: 20 }, 0.3, "inOut");
c.prop(4.52, "feather", { x: 0.1, y: 0.945, z: 0.455, roll: -80 }, 0.28, "out");   // across his face under the eyes, like a little moustache
look(3.95, "rea", [0.05, 0.4], 0.15);
look(4.45, "rea", R_NOSE, 0.25);
A(4.5, "rea", "face", { press: 0, dur: 0.2 });
A(4.6, "rea", "expr", { expr: "kind", set: { open: 0.35, curve: -0.6, eye: 0.95 }, dur: 0.25 });   // the sneeze coming: not a smile
A(4.6, "rea", "face", { brow: 0.4, lid: 0.4, dur: 0.25 });
// its subtitle ends where "Ahh... CHOO!" starts (both at the top: two overlapping lines drew over each other)
c.macro(4.62, "rea", "say", { line: "Ahh...", tone: "calm", caption: false });
c.cap(4.62, 5.4, "Ahh...", 300);
A(4.62, "rea", "pitch", { to: -6, dur: 0.6 });         // the head tips back as he breathes in
A(4.62, "rea", "still", { dur: 0.75, idle: 0.04 });

// ---------------------------------------------------------------- 6 THE SNEEZE 5.40-7.20: three ravens burst out
const SNEEZE_LINE = 5.42, CHOO = 5.92;                 // "Ahh... CHOO!": the "CHOO" lands 0.5 s into the line
c.macro(SNEEZE_LINE, "rea", "say", { line: "Ahh... CHOO!", tone: "excited", pos: 300 });
A(SNEEZE_LINE, "rea", "pitch", { to: -10, dur: 0.45 });
A(CHOO - 0.03, "rea", "pitch", { to: 9, dur: 0.1, ease: "out" });
A(CHOO + 0.12, "rea", "pitch", { to: 0, dur: 0.35, ease: "settle" });
A(CHOO - 0.03, "rea", "squash", { amount: 0.08, dur: 0.1 });
A(CHOO - 0.03, "rea", "face", { lid: 1, dur: 0.06 });
A(CHOO - 0.03, "rea", "expr", { expr: "kind", set: { open: 0.65, curve: -0.45 }, dur: 0.06 });
A(CHOO + 0.35, "rea", "face", { lid: 0, brow: 0, dur: 0.15 });
A(CHOO + 0.35, "rea", "expr", { expr: "shocked", set: { tilt: 0.5, curve: -0.5, open: 0.3, eye: 1.2, pupil: 0.6 }, dur: 0.2 });   // caught: wide eyes (not a happy face)
c.prop(CHOO, "feather", { scale: 0 }, 0.01);           // blown off in the puff
c.at(CHOO, { fx: "shake", amp: 0.05, dur: 0.35 });
sfx(CHOO, "poof", { gain: 0.5, reason: "the sneeze's puff of air as the birds burst out (on screen)" });
// three birds, one after another, each on its own arc: up and out of the hood opening, round the room, down to a perch
const burst = (id, t, path, perch, rot) => {
  c.prop(t, id, { scale: RAVEN, x: INSIDE[0], y: INSIDE[1], z: INSIDE[2], flap: 1, rot: 0, tip: 0 }, 0.01);
  fly(t + 0.01, id, HOOD_OUT, 0.1, { ease: "out" });
  let u = t + 0.11;
  for (const [p, d, arc, r] of path) { fly(u, id, p, d, { arc, rot: r }); u = r3(u + d); }
  fly(u, id, perch, 0.3, { flap: 0.35, rot, ease: "out" });
  c.prop(u + 0.3, id, { flap: 0, squash: 0.12 }, 0.08, "out"); c.prop(u + 0.38, id, { squash: 0 }, 0.15, "settle");
  sfx(u + 0.04, "wing-flap", { gain: 0.45, reason: `${id} braking to land (on screen)` });
  return r3(u + 0.3);
};
const LAND_R2 = burst("r2", CHOO + 0.02, [[[-0.3, 1.75, 0.8], 0.32, 0.12, -60], [[-0.55, 1.6, 0.75], 0.3, 0.05, -150]], PERCH.L, 25);
const LAND_R3 = burst("r3", CHOO + 0.14, [[[0.85, 1.85, 0.7], 0.34, 0.12, 60], [[1.05, 1.2, 0.55], 0.3, 0.05, 150]], PERCH.R, -25);
const LAND_R1 = burst("r1", CHOO + 0.26, [[[0.15, 2.05, 0.6], 0.32, 0.1, 0], [[0.0, 1.95, 0.45], 0.3, 0.06, 0]], PERCH.top, 15);   // drops onto the hood from the front
for (const [t, pan] of [[CHOO + 0.14, -0.3], [CHOO + 0.26, 0.3], [CHOO + 0.38, 0]]) sfx(t, "wing-flap", { gain: 0.7, pan, reason: "a raven bursting out of the hood (on screen)" });
sfx(CHOO + 0.2, "ai/raven-caw", { gain: 0.4, pan: -0.25, reason: "a raven calling as it bursts out (on screen)" });
sfx(CHOO + 0.45, "ai/raven-caw", { gain: 0.5, pan: 0.3, reason: "the second raven calling in flight (on screen)" });
sfx(LAND_R2, "ai/cushion-poof", { gain: 0.35, pan: -0.3, reason: "the raven landing on the left armrest" });
sfx(LAND_R3, "ai/cushion-poof", { gain: 0.35, pan: 0.4, reason: "the raven landing on the right armrest" });
sfx(LAND_R1, "cloth", { gain: 0.45, reason: "the raven landing on the hood" });
// Odin recoils from the burst, the photo jerking back with him
A(CHOO + 0.02, "odin", "move", { to: ODIN_BACK, dur: 0.3, ease: "out", steps: 1 });
act.shock(c, CHOO + 0.02, "odin", { open: 0.22, eye: 1.25, brow: 0.45, hold: 0.9 });
photo.carry(CHOO + 0.02, PHOTO_LOW, 0.3, "out");   // (his eyes are already on the burst)
look(CHOO + 0.15, "odin", [0.55, 0.75], 0.15);
// Reaper: eyes open on the empty air, then follow the birds down
look(CHOO + 0.4, "rea", [0, 0.6], 0.2);

// ---------------------------------------------------------------- 7 THE COUNT 7.20-8.60: photo, birds, photo
const T7 = 7.2;
act.eyesLead(c, T7 + 0.05, "odin", O_AT_PHOTO);
photo.carry(T7 + 0.05, PHOTO_SHOW, 0.35, "inOut");
A(T7, "odin", "expr", { expr: "deadpan", dur: 0.3 });
A(T7, "odin", "face", { brow: 0, dur: 0.3 });
look(T7 + 0.1, "odin", O_AT_PHOTO, 0.2);
look(T7 + 0.55, "odin", O_AT_ARM_L, 0.15);
look(T7 + 0.78, "odin", O_AT_HOOD, 0.15);
look(T7 + 1.0, "odin", O_AT_ARM_R, 0.15);
look(T7 + 1.22, "odin", O_AT_REA, 0.15);
look(T7 + 0.2, "rea", [-0.55, -0.25], 0.2);           // at the bird on his right armrest (screen-left) ...
look(T7 + 0.6, "rea", [0.6, -0.25], 0.2);              // ... the left ...
look(T7 + 1.0, "rea", R_AT_ODIN, 0.2);                 // ... and back to Odin
A(T7 + 0.3, "rea", "expr", { expr: "deadpan", dur: 0.3 });

// ---------------------------------------------------------------- 8 THE DENIAL 8.60-10.6: "...What ravens?"
const T8 = 8.6;
A(T8, "rea", "still", { dur: 1.9, idle: 0.03 });
c.macro(T8 + 0.05, "rea", "say", { line: "...What ravens?", tone: "calm", pos: 300, ...words });
// the hood raven nuzzles him: two little beak taps on the top of his head, a happy hop
c.prop(T8 + 0.25, "r1", { peck: 1 }, 0.1, "out"); c.prop(T8 + 0.35, "r1", { peck: 0 }, 0.12);
c.prop(T8 + 0.48, "r1", { peck: 1 }, 0.1, "out"); c.prop(T8 + 0.58, "r1", { peck: 0 }, 0.12);
sfx(T8 + 0.33, "kenney/impact-generic-light", { gain: 0.3, reason: "the raven's beak tapping his hood" });
sfx(T8 + 0.56, "kenney/impact-generic-light", { gain: 0.3, reason: "the second beak tap" });
c.prop(T8 + 0.75, "r1", { happy: 1 }, 0.2);
sfx(T8 + 0.77, "ai/raven-caw", { gain: 0.3, reason: "the hood raven's happy little call as it hops (on screen)" }); c.prop(T8 + 1.15, "r1", { happy: 0 }, 0.2);
A(T8 + 1.25, "rea", "face", { lid: 0.42, dur: 0.2 });   // a slow, flat blink-half: deadpan
A(T8 + 0.1, "odin", "expr", { expr: "deadpan", set: { curve: -0.1 }, dur: 0.3 });
A(T8 + 0.1, "odin", "face", { lid: 0.2, dur: 0.3 });
A(T8 + 0.2, "odin", "still", { dur: 1.7, idle: 0.04 });

// ---------------------------------------------------------------- shots
const SHOTS = {
  beak: { pos: [-0.3, 1.25, 3.2], look: [-0.28, 1.08, 0.45], fov: 48 },   // frame 0: a two-shot, Odin striding in at the left edge
  insert: { pos: [0.12, 0.66, 1.85], look: [-0.45, 0.5, 1.0], fov: 38 },
  medium: { pos: [0.05, 1.0, 4.0], look: [-0.25, 0.85, 0.4], fov: 44 },
  bulge: { pos: [0.0, 1.08, 3.5], look: [-0.12, 0.98, 0.4], fov: 46, to: { pos: [0.0, 1.08, 3.25] }, dur: 1.0 },   // both sides of the hood in frame (the second peek is on his left)
  close: { pos: [0.2, 1.3, 3.1], look: [0.2, 1.25, 0.2], fov: 36, to: { pos: [0.2, 1.28, 2.9] }, dur: 1.9 },   // room above the hood for the subtitle
  wide: { pos: [-0.05, 1.3, 4.0], look: [0.0, 1.35, 0.3], fov: 48 },
  count: { pos: [-0.12, 1.05, 4.0], look: [-0.17, 0.95, 0.4], fov: 56 },   // both armrests and Odin's face
  denial: { pos: [0.0, 1.05, 3.8], look: [-0.05, 1.0, 0.3], fov: 50, to: { pos: [0.0, 1.05, 3.5] }, dur: 1.4 },
  stare: { pos: [0.05, 0.85, 2.45], look: [-0.8, 0.7, 0.9], fov: 48 },   // the last 0.6 s: Odin's deadpan stare closes the joke
};
const beats = c.beats([
  ["beak", 0, SHOTS.beak, "hook"],
  ["photo", 1.2, SHOTS.insert],
  ["what raven", 1.7, SHOTS.medium],
  ["bulge", 2.9, SHOTS.bulge],
  ["feather", 3.9, SHOTS.close],
  ["sneeze", r3(CHOO - 0.05), "keep", "payoff"],   // the close carries the CHOO (the music drops out over the inhale and hits here)
  ["burst", r3(CHOO + 0.2), SHOTS.wide],
  ["count", T7, SHOTS.count],
  ["what ravens", T8, SHOTS.denial, "reaction"],
  ["odin stares", 9.8, SHOTS.stare],
], END);

const inHood = (id, from, to, why) => ({ who: "rea", with: id, from, to, reason: `${id} ${why} (a bird inside Reaper's hood: the body hides it)` });
write(import.meta.url, {
  id: GIB ? "what-raven-gibberish" : "what-raven",
  ...(GIB && { seed: "what-raven" }),   // the same music as the English cut
  title: "What Raven?",
  idea: "Eight trend tests #04 (hidden-in-plain-sight 'What iPad?' format): Reaper denies hiding Odin's raven until a sneeze blows three out of his hood",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  set: { type: "plain", color: "#e9c9a0", floor: "#b98256", light: "golden",
    plate: { src: "assets/plates/livingroom-golden.png", z: -2.4, center: [0, 1.4], height: 5.6, relief: 0.6 } },
  music: { style: "sneaky", bpm: 110 },   // from 0:00 at full level (analytics read, 29 Oct evening); the engine drops a beat before the payoff
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", signature: false },
  hook: { show: ["rea", "r1"], hint: 0, what: "a raven's beak pokes out of Reaper's hood and he shoves it back in" },
  cast, props, captions: c.captions, beats,
  allowClip: [
    { who: "rea", with: "chair", from: 0, to: END, reason: "Reaper sits in the armchair (his body and hood rest against its back and cushions)" },
    inHood("r1", 0, 0.6, "peeks out of the hood's top edge and is pushed back in"),
    inHood("r1", 3.0, 3.55, "peeks out a second time and is patted back in"),
    { who: "rea", with: "r1", from: 3.15, to: 3.55, reason: "his left glove pats the second peek back under the hood (palm on the bird's head)" },
    { who: "rea", with: "r1", from: 0.2, to: 0.6, reason: "his right glove pushes the beak back under the hood (a push: palm on the bird's head)" },
    inHood("r1", CHOO, CHOO + 0.45, "bursts out of the hood opening"),
    inHood("r2", CHOO, CHOO + 0.25, "bursts out of the hood opening"),
    inHood("r3", CHOO, CHOO + 0.35, "bursts out of the hood opening"),
    { who: "rea", with: "feather", from: 4.7, to: CHOO, reason: "the feather rests across his face (it landed there)" },
    { who: "rea", with: "r1", from: LAND_R1 - 0.1, to: END, reason: "the raven perches on top of his hood (its feet on the cloth) and taps his head" },
  ],
  notes: "Generated by storyboards/raven/make-what-raven.mjs. Brief: Jonny's eight trend tests pack, 04-what-raven.",
});
