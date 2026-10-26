// Fart in the Elevator (Jonny's brief and storyboard, 26 Oct 2026). Three passengers ride a hotel lift up: Viking
// (left, no axe), Astronaut (centre), Wizard (right, staff in his left hand, outside the group). The Viking lets
// one go and plays innocent. A green wisp curls out; the Astronaut seals his suit with a button (blue light, click,
// hiss) and smiles. The Wizard, disgusted, casts a neat cleaning spell: a golden spiral gathers the gas into an orb,
// which buckles and splits into three sparks. He realises (eyes, brows, mouth; a soft gibberish "oh no"); the music
// stops. Back on all three: Viking, Wizard and Astronaut each let one go in turn, a puff behind each; the smug smile
// goes. Ding. Reverse: the doors open on Odin, a thin wisp reaches him, he narrows his eyes, raises a brow, leans
// away and steps back. The doors close on his face. Click.
//
// Two cuts from one generator:
//   main  15.0 s, Jonny's brief exactly (ends on the closing click)
//   loop  15.5 s, the coordinator's optional tail (approved): cut back inside for half a second as the floor number
//         ticks up again, so the end runs into the first frame
//
// Gas stays below the faces, the helmet glass stays clear (no hand near it), feet stay planted, nobody moves places.
// Voices stay gibberish (Jonny, 26 Oct). No captions: the cause and effect read with the sound off.
// Run: node storyboards/elevator/make-fart-elevator.mjs  -> storyboards/elevator/fart-elevator.json, fart-elevator-loop.json
import { writeFileSync } from "node:fs";

const r3 = (x) => Math.round(x * 1000) / 1000;

function build(variant) {
  const LOOP = variant === "loop";
  const items = [];
  const at = (t, it) => items.push({ ...it, at: r3(t) });
  const A = (t, who, what, o = {}) => at(t, { who, do: what, ...o });
  const prop = (t, id, set, dur = 0.3, ease = "inOut") => at(t, { do: "prop", id, set, dur, ease });
  const sfx = (t, s, o = {}) => at(t, { sfx: s, ...o });
  const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
  const still = (t, who, dur, idle = 0.12) => A(t, who, "still", { dur, idle });

  // ---------------------------------------------------------------- places (set-elevator.js ELEVATOR)
  const Z = -0.3, VIK = [-1.02, Z], AST = [0, Z], WIZ = [1.04, Z];
  const ODIN = [0, 2.45], ODIN_BACK = [0, 2.8];
  const SPELL = [0.6, 0.58, 0.3];                         // in front, between the Astronaut and the Wizard, chest high
  // where each fart puffs out: low, behind and a little to one side of each body, so it shows from the front
  const BEHIND = { vik: [-1.44, 0.22, -0.5], wiz: [1.44, 0.24, -0.55], ast: [0.42, 0.26, -0.68] };

  const cast = [
    { id: "vik", character: "elevator/viking", at: VIK, face: "camera", expr: "kind", follow: 0.3, seed: 1.3 },
    { id: "ast", character: "elevator/astronaut", at: AST, face: "camera", expr: "kind", follow: 0.3, seed: 2.2 },
    { id: "wiz", character: "potatobrawl/wizard", at: WIZ, face: "camera", expr: "kind", follow: 0.3, seed: 3.1 },
    { id: "odin", character: "potatobrawl/allfather", at: ODIN, face: "back", expr: "stern", follow: 0.3, seed: 4.4 },
  ];
  const props = [
    { id: "sign", kind: "floorsign", x: -1.2, y: 1.95, z: -1.585, count: 2.4 },
    { id: "sign-in", kind: "floorsign", x: 0, y: 2.38, z: 1.2, rot: 180, count: 3, gate: "inside" },
    { id: "doors", kind: "elevdoors", x: 0, z: 1.27, open: 0 },
    { id: "gas1", kind: "gas", x: BEHIND.vik[0], y: BEHIND.vik[1], z: BEHIND.vik[2], len: 0.38, seed: 1 },
    { id: "gas1b", kind: "gas", x: -0.42, y: 0.22, z: -0.66, len: 0.32, seed: 4, n: 2 },
    { id: "spell", kind: "spell", x: SPELL[0], y: SPELL[1], z: SPELL[2], size: 0.46 },
    { id: "orb", kind: "orb", x: SPELL[0], y: SPELL[1], z: SPELL[2], glow: 0,
      to: [BEHIND.vik, BEHIND.ast, BEHIND.wiz].map((p) => [r3(p[0] - SPELL[0]), r3(p[1] + 0.06 - SPELL[1]), r3(p[2] - SPELL[2])]) },
    { id: "gas2", kind: "gas", x: BEHIND.vik[0], y: BEHIND.vik[1], z: BEHIND.vik[2], len: 0.4, seed: 2, size: 0.46 },
    { id: "gas3", kind: "gas", x: BEHIND.wiz[0], y: BEHIND.wiz[1], z: BEHIND.wiz[2], len: 0.4, seed: 3, size: 0.46 },
    { id: "gas4", kind: "gas", x: BEHIND.ast[0], y: BEHIND.ast[1], z: BEHIND.ast[2], len: 0.4, seed: 5, size: 0.46 },
    { id: "gas5", kind: "gas", x: 0.05, y: 0.06, z: 0.7, len: 0.24, seed: 6, n: 2, w: 0.04, size: 0.26 },
  ];

  // eye targets (face look space: + right on screen, + up)
  const AHEAD = [0, 0.05], UP_AT_SIGN = [-0.35, 0.6];

  // ---------------------------------------------------------------- 1 UP WE GO 0-0.95 (wide)
  // frame 0 is already mid-action: the Viking shifts his weight, eyes darting; the floor number ticks to 3
  prop(0, "sign", { count: 3 }, 0.7, "inOut");
  A(0, "vik", "look", { to: [0.35, 0.0], dur: 0.01, blink: false });
  A(0, "vik", "squash", { amount: 0.03, dur: 0.35 });
  A(0.05, "vik", "lean", { to: 3, dur: 0.4, ease: "inOut" });
  A(0.35, "vik", "look", { to: [-0.4, 0.05], dur: 0.15, blink: false });
  A(0.55, "vik", "lean", { to: 0, dur: 0.35, ease: "inOut" });
  A(0.6, "vik", "look", { to: [0.1, -0.1], dur: 0.15, blink: false });
  A(0, "ast", "look", { to: UP_AT_SIGN, dur: 0.01, blink: false });
  A(0, "wiz", "look", { to: AHEAD, dur: 0.01, blink: false });
  A(0, "wiz", "expr", { set: { curve: 0.25 }, dur: 0.01 });
  for (const w of ["ast", "wiz"]) A(0, w, "noblink");
  for (const [t, w] of [[0.7, "ast"], [2.1, "wiz"], [4.0, "wiz"], [9.9, "ast"], [7.4, "wiz"]]) A(t, w, "blink", { dur: 0.2 });

  // ---------------------------------------------------------------- 2 THE CULPRIT 0.95-2.0 (Viking close-up)
  A(0.95, "vik", "noblink");
  A(1.05, "vik", "face", { lidR: 0.85, lidL: 0.2, browR: -0.6, browL: -0.2, press: 1, dur: 0.18 });   // one eye squeezes almost shut, lips tight
  A(1.05, "vik", "expr", { set: { curve: -0.15, smirk: 0.0, tilt: -0.1 }, dur: 0.18 });
  A(1.05, "vik", "squash", { amount: 0.04, dur: 0.3 });
  still(1.05, "vik", 0.35, 0.05);
  sfx(1.4, "oga/fart-viking", { pan: -0.2 });
  A(1.4, "vik", "squash", { amount: 0.05, dur: 0.22 });
  prop(1.42, "gas1", { puff: 0.45 }, 0.5, "out");
  // innocent: both eyes open wide, look up and away, brows up, a small round "whistling" mouth
  A(1.62, "vik", "face", { lidR: 0, lidL: 0, browR: 0.45, browL: 0.45, press: 0, dur: 0.14 });
  A(1.62, "vik", "expr", { set: { curve: 0.05, open: 0.18, eye: 1.08, tilt: 0.3 }, dur: 0.14 });
  A(1.66, "vik", "look", { to: [0.45, 0.55], dur: 0.16, blink: false });
  still(1.7, "vik", 0.9, 0.1);

  // ---------------------------------------------------------------- 3 THE WISP 2.0-3.0 (two-shot), SEALED 3.0-4.4 (Astronaut close-up)
  prop(2.0, "gas1", { puff: 1, x: -0.55, z: -0.6 }, 1.6, "out");
  prop(2.3, "gas1b", { puff: 0.8 }, 1.2, "out");
  A(2.05, "ast", "look", { to: [-0.55, -0.3], dur: 0.22, blink: false });              // he notices it, eyes first
  A(2.3, "ast", "expr", { set: { eye: 1.15, curve: 0.1, open: 0.1 }, dur: 0.12 });
  A(2.3, "ast", "face", { brow: 0.35, dur: 0.12 });
  still(2.3, "ast", 0.55, 0.08);
  A(2.6, "ast", "look", { to: [-0.15, -0.55], dur: 0.2, blink: false });              // down at his suit
  // the press: right hand to the button under the helmet ring, a pointing finger, a clean push and back
  A(2.75, "ast", "grip", { side: "R", shape: "point", dur: 0.15 });
  arm(2.75, "ast", "R", { x: [-0.06, 0.25, 0.44] }, 0.4, "out");
  arm(3.2, "ast", "R", { x: [-0.05, 0.25, 0.4] }, 0.08, "inOut");
  sfx(3.24, "kenney/switch", { gain: 0.9 });
  A(3.26, "ast", "charge", { to: 0.3, dur: 0.06 });                                     // the blue status light
  sfx(3.3, "ui-confirm", { gain: 0.6 });
  sfx(3.42, "hiss", { gain: 0.25, dur: 0.55 });
  arm(3.5, "ast", "R", "rest", 0.45, "inOut");
  A(3.62, "ast", "grip", { side: "R", shape: "hold", dur: 0.2 });
  A(3.55, "ast", "look", { to: [0.05, 0.1], dur: 0.25, blink: false });
  A(3.75, "ast", "expr", { expr: "smug", set: { curve: 0.55, smirk: 0.35, eye: 0.8 }, dur: 0.25 });   // a tiny satisfied smile
  A(3.75, "ast", "face", { brow: 0.1, dur: 0.25 });
  still(3.8, "ast", 0.6, 0.1);
  // the gas wanders right, low behind the Astronaut, toward the Wizard
  prop(3.6, "gas1", { x: -0.2, y: 0.28, z: -0.62 }, 1.3, "inOut");
  prop(3.5, "gas1b", { x: 0.18, y: 0.26, z: -0.55, puff: 1 }, 1.3, "inOut");

  // ---------------------------------------------------------------- 4 QUICK FIX 4.4-6.5 (Wizard medium)
  A(4.4, "wiz", "look", { to: [-0.6, -0.45], dur: 0.2, blink: false });
  A(4.5, "wiz", "expr", { set: { curve: -0.4, smirk: 0.45, eye: 0.78, tilt: -0.35 }, dur: 0.15 });   // disgust: a sneer, eyes narrowed
  A(4.5, "wiz", "face", { browL: -0.5, browR: -0.15, press: 0.4, dur: 0.15 });
  A(4.5, "wiz", "pitch", { to: -4, dur: 0.3, ease: "out" });                           // recoils a touch
  still(4.55, "wiz", 0.3, 0.06);
  // the precise spell: the right hand comes up, palm open toward the gas, holds, and the spiral turns there
  A(4.75, "wiz", "pitch", { to: 0, dur: 0.3 });
  A(4.8, "wiz", "grip", { side: "R", shape: "flat", dur: 0.15 });
  arm(4.8, "wiz", "R", { o: [0.06, 0.42, 0.44] }, 0.4, "settle");
  A(4.85, "wiz", "face", { browL: -0.2, browR: -0.2, press: 0.6, dur: 0.15 });
  A(4.85, "wiz", "expr", { expr: "focused", set: { curve: 0.0 }, dur: 0.15 });
  A(4.95, "wiz", "look", { to: [-0.75, -0.2], dur: 0.15, blink: false });
  still(5.0, "wiz", 1.05, 0.05);
  prop(4.95, "spell", { magic: 1 }, 0.3, "out");
  sfx(4.95, "magic-up", { gain: 0.8 });
  // the spiral gathers both wisps into a small orb in its middle
  prop(5.05, "gas1", { x: SPELL[0], y: SPELL[1] - 0.1, z: SPELL[2], scale: 0.35, fade: 1 }, 0.6, "in");
  prop(5.05, "gas1b", { x: SPELL[0], y: SPELL[1] - 0.1, z: SPELL[2], scale: 0.35, fade: 1 }, 0.55, "in");
  prop(5.3, "orb", { glow: 1 }, 0.35, "out");
  prop(5.35, "spell", { level: 0.45 }, 0.4, "inOut");
  prop(5.7, "spell", { magic: 0 }, 0.25, "inOut");
  A(5.7, "wiz", "expr", { expr: "smug", set: { curve: 0.4, smirk: 0.5, eye: 0.8 }, dur: 0.15 });   // pleased with himself
  A(5.7, "wiz", "face", { browL: 0.15, browR: 0, press: 0, dur: 0.15 });
  // it buckles, then splits into three sparks that fly to the three of them
  prop(5.85, "orb", { wobble: 1 }, 0.3, "in");
  sfx(5.85, "kenney/slime", { gain: 0.8 });
  A(5.95, "wiz", "look", { to: [-0.7, -0.25], dur: 0.08, blink: false });
  prop(6.15, "orb", { burst: 1 }, 0.5, "inOut");
  sfx(6.15, "kenney/zap-three-tone-down", { gain: 0.9 });
  A(6.18, "wiz", "squash", { amount: 0.03, dur: 0.15 });

  // ---------------------------------------------------------------- 5 OH NO 6.5-7.3 (Wizard close-up; the music stops)
  // eyes first, then brows, then mouth, each a few frames apart; the spell hand drops
  A(6.5, "wiz", "expr", { set: { eye: 1.2, pupil: 0.65 }, dur: 0.08 });
  A(6.5, "wiz", "look", { to: [-0.1, -0.1], dur: 0.1, blink: false });
  A(6.62, "wiz", "face", { browL: 0.6, browR: 0.6, press: 0, dur: 0.12 });
  A(6.62, "wiz", "expr", { set: { tilt: 0.5 }, dur: 0.12 });
  A(6.76, "wiz", "expr", { set: { curve: -0.45, open: 0.35, smirk: 0 }, dur: 0.12 });
  still(6.5, "wiz", 0.8, 0.04);
  arm(6.6, "wiz", "R", "rest", 0.5, "inOut");
  A(6.6, "wiz", "grip", { side: "R", shape: "hold", dur: 0.3 });
  at(6.82, { macro: "say", who: "wiz", line: "oh no", tone: "sad", soft: true, voice: false, caption: false, dur: 0.42 });

  // ---------------------------------------------------------------- 6 EVERYONE 7.3-10.5 (wide)
  // one beat of dread, then one each: Viking, Wizard, Astronaut, a puff behind each
  A(7.3, "vik", "look", { to: [0.2, -0.05], dur: 0.15, blink: false });
  A(7.3, "vik", "expr", { expr: "kind", set: { curve: 0.1, eye: 1.05 }, dur: 0.2 });
  A(7.3, "vik", "face", { lidR: 0, lidL: 0, brow: 0, press: 0, dur: 0.2 });
  A(7.3, "ast", "look", { to: [0.05, 0.05], dur: 0.1, blink: false });                   // still smug behind his glass
  const fart = (t, who, id, sound, pan) => {
    sfx(t, sound, { pan });
    A(t, who, "squash", { amount: 0.06, dur: 0.24 });
    A(t, who, "face", { lid: 0.7, press: 1, dur: 0.08 });
    A(t, who, "expr", { set: { eye: 0.7, curve: -0.2, smirk: 0 }, dur: 0.08 });
    prop(t + 0.02, id, { puff: 1 }, 0.9, "out");
    // then embarrassed: eyes open, looking down and away, brows up and in, mouth a flat wobble
    A(t + 0.3, who, "face", { lid: 0.3, press: 0.3, brow: 0.35, dur: 0.2 });
    A(t + 0.3, who, "expr", { expr: "sad", set: { curve: -0.25, eye: 0.85, tilt: 0.45 }, dur: 0.2 });
  };
  fart(7.65, "vik", "gas2", "oga/fart-viking-2", -0.25);
  A(7.95, "vik", "look", { to: [-0.3, -0.6], dur: 0.2, blink: false });
  A(7.75, "wiz", "look", { to: [-0.55, -0.2], dur: 0.12, blink: false });               // the Wizard glances at the Viking
  fart(8.35, "wiz", "gas3", "oga/fart-wizard", 0.25);
  A(8.35, "wiz", "hatwobble", { amount: 6, freq: 3, dur: 0.6 });
  A(8.65, "wiz", "look", { to: [0.3, -0.6], dur: 0.2, blink: false });
  // the Astronaut: smug until his own turn; his puff comes out behind the suit, his helmet stays clear
  fart(9.05, "ast", "gas4", "oga/fart-astronaut", 0);
  A(9.05, "ast", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2, curve: -0.2 }, dur: 0.08 });
  A(9.35, "ast", "look", { to: [0, -0.65], dur: 0.2, blink: false });
  for (const w of ["vik", "wiz", "ast"]) still(9.5, w, 0.95, 0.06);
  for (const g of ["gas2", "gas3", "gas4"]) prop(9.6, g, { y: 0.3, fade: 0.35 }, 1.5, "inOut");
  // ding: the floor number changes, the frame glows; three pairs of eyes go up to it
  sfx(10.2, "ding", { gain: 0.5 });
  prop(10.2, "sign", { count: 4, glow: 1 }, 0.08, "out");
  prop(10.32, "sign", { glow: 0 }, 0.4, "inOut");
  for (const w of ["vik", "ast", "wiz"]) A(10.22, w, "look", { to: UP_AT_SIGN, dur: 0.15, blink: false });

  // ---------------------------------------------------------------- 7 ODIN 10.5-13.6 (reverse, inside looking out)
  for (const w of ["vik", "ast", "wiz"]) A(10.5, w, "hide");
  A(10.5, "odin", "show");
  A(0, "odin", "hide");
  A(10.5, "odin", "look", { to: [0, 0.0], dur: 0.01, blink: false });
  A(10.5, "odin", "noblink");
  prop(10.62, "doors", { open: 1 }, 0.75, "inOut");
  sfx(10.6, "doorslide", { gain: 0.35, dur: 0.8 });
  still(10.6, "odin", 1.6, 0.12);
  // a thin wisp drifts out through the doorway at knee height and reaches him
  prop(11.15, "gas5", { puff: 1 }, 0.6, "out");
  prop(11.15, "gas5", { z: 1.95, y: 0.08, x: 0.0 }, 1.05, "inOut");
  A(12.15, "odin", "face", { lid: 0.42, dur: 0.15 });                                   // narrows his eyes
  A(12.15, "odin", "expr", { set: { curve: -0.35 }, dur: 0.15 });
  still(12.15, "odin", 0.45, 0.04);
  A(12.5, "odin", "face", { browL: 0.55, browR: -0.25, dur: 0.15 });                    // one brow up
  A(12.5, "odin", "expr", { set: { smirk: 0.3, raise: 0.0 }, dur: 0.15 });
  A(12.8, "odin", "pitch", { to: -9, dur: 0.35, ease: "out" });                        // leans away
  A(12.8, "odin", "look", { to: [0.1, -0.15], dur: 0.2, blink: false });
  A(13.15, "odin", "move", { to: ODIN_BACK, dur: 0.45, ease: "inOut", steps: 1.1 });    // one step back; he never enters
  prop(13.0, "gas5", { fade: 0.6, y: 0.14 }, 1.2, "inOut");
  still(13.6, "odin", 1.4, 0.05);

  // ---------------------------------------------------------------- 8 HARD PASS 13.6-15.0 (the doors close on him)
  A(13.65, "odin", "look", { to: [0, 0.05], dur: 0.2, blink: false });                  // back at us, disgusted
  prop(13.95, "doors", { open: 0 }, 0.9, "inOut");
  sfx(13.95, "doorslide", { gain: 0.35, dur: 0.85 });
  sfx(14.82, "latch", { gain: 0.9 });
  sfx(14.84, "thud-soft", { gain: 0.35 });

  let END = 15.0;
  if (LOOP) {
    // ---------------------------------------------------------------- 9 (loop) UP AGAIN 15.0-15.5 (wide)
    for (const w of ["vik", "ast", "wiz"]) A(15.0, w, "show");
    A(15.0, "odin", "hide");
    for (const w of ["vik", "ast", "wiz"]) A(15.0, w, "look", { to: [0, -0.4], dur: 0.01, blink: false });
    prop(15.0, "sign", { count: 4.4 }, 0.01);
    prop(15.05, "sign", { count: 5 }, 0.3, "inOut");
    END = 15.5;
  }

  // ---------------------------------------------------------------- shots
  const WIDE = { pos: [0.1, 0.95, 7.3], look: [0.1, 0.98, -0.3], fov: 44 };
  const VIK_CU = { pos: [-1.0, 0.92, 2.45], look: [-1.02, 0.72, -0.3], fov: 32 };
  const TWO = { pos: [-0.5, 1.0, 4.7], look: [-0.5, 0.72, -0.3], fov: 36 };
  const AST_CU = { pos: [0.02, 0.92, 2.6], look: [0.0, 0.7, -0.3], fov: 34 };
  const WIZ_MED = { pos: [1.0, 0.98, 3.4], look: [1.0, 0.78, -0.2], fov: 42 };
  const WIZ_CU = { pos: [1.08, 0.98, 2.5], look: [1.1, 0.84, -0.3], fov: 32 };
  const REV = { pos: [0, 1.04, -1.25], look: [0, 0.95, 2.4], fov: 54 };
  const REV_MID = { pos: [0, 1.0, -0.85], look: [0, 0.93, 2.5], fov: 50 };
  const REV_CLOSE = { pos: [0, 0.97, -0.25], look: [0, 0.92, 2.7], fov: 42 };
  const SHOTS = [
    ["up we go", 0, WIDE, "hook"],
    ["the culprit", 0.95, VIK_CU],
    ["the wisp", 2.0, TWO],
    ["sealed", 3.0, AST_CU],
    ["quick fix", 4.4, WIZ_MED],
    ["oh no", 6.5, WIZ_CU],
    ["everyone", 7.3, WIDE, "escalation"],
    ["odin", 10.5, { ...REV, to: REV_MID, dur: 3.1, ease: "inOut" }],
    ["hard pass", 13.6, { ...REV_MID, to: REV_CLOSE, dur: 1.2, ease: "inOut" }],
  ];
  if (LOOP) SHOTS.push(["up again", 15.0, WIDE]);

  items.sort((a, b) => a.at - b.at);
  const beats = SHOTS.map(([name, start, shot, kind], i) => {
    const end = SHOTS[i + 1]?.[1] ?? END;
    const mine = items.filter((x) => x.at >= start - 1e-6 && (i === SHOTS.length - 1 || x.at < end - 1e-6)).map((x) => ({ ...x, at: r3(x.at - start) }));
    return { name, at: start, len: r3(end - start), ...(shot && { shot }), do: mine, ...(kind && { kind }) };
  });
  const late = items.filter((x) => x.at >= END);
  if (late.length) throw new Error(`items after the end: ${JSON.stringify(late.slice(0, 3))}`);

  return {
    id: LOOP ? "fart-elevator-loop" : "fart-elevator",
    title: "Fart in the Elevator",
    idea: `Jonny's brief and storyboard, 26 Oct 2026${LOOP ? " + the loop tail (the floor number ticks up again)" : ""}`,
    format: "one chain of cause and effect: a fart, a seal, a spell that backfires, a chain reaction, a hard pass",
    fps: 30, look: "anime-pro", profile: "short", loop: LOOP,
    cover: 8.5,
    creative: { length: [12, 16], maxEventGap: 2.0 },
    set: { type: "elevator", seed: 3 },
    music: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", until: 6.5, gain: 0.32 },
    sound: { sfx: 0.75, ambience: 0.3, speech: false },
    cast, props, captions: [], beats,
    notes: "Generated by storyboards/elevator/make-fart-elevator.mjs. Gibberish voices only; recorded CC0 farts (assets/sfx/oga), AI elevator bossa until the spell backfires.",
  };
}

for (const v of ["main", "loop"]) {
  const sb = build(v);
  writeFileSync(new URL(`./${sb.id}.json`, import.meta.url), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${sb.id}: ${sb.beats.reduce((s, b) => s + b.len, 0).toFixed(2)} s, ${sb.beats.length} beats`);
}
