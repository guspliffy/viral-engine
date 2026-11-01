// OK I LIED (Jonny's holiday-photo storyboard, 1 Nov 2026), built from the clip template.
// node storyboards/trend/ok-i-lied/make-ok-i-lied.mjs -> ok-i-lied.json (same folder)
// Brief: /mnt/project-files/story-27-ok-i-lied.zip (ENGINE-PROMPT.md, storyboard-eight-panels.png); PANELS.md here.
//
// THE BRIEF (exactly 10 s, Phoenix + Reaper + Wizard, Dragon at the end; eight beats, eight-panel board)
//   Joke:        "our holiday was perfect" - then each "ok i lied" peels one layer off the same group photo: the smiles,
//                the beach, the hotel. Then the real reason: Dragon in a tiny sun hat.
//   Wants:       the trio want the holiday to look perfect.
//   Consequence: the truth comes out photo by photo, and the last one comes alive.
//   Ending:      Dragon sneezes one fireball over them and the three run at the lens, intact; "i'm so sorry".
//
// Photos 1-4 are ONE locked layout (same camera, transforms and poses); only faces, surface wear, weather and the
// background picture change, each on a hard cut with a camera flash. Motion starts at 7 s.
// Departures (each with its reason; the brief wins everywhere else) are listed in PANELS.md.
import { clip, write, r3 } from "../../lib/clip.mjs";

const OPENER = false;                  // the photo is frozen: nobody speaks in it (brief: no speech beyond gibberish)
const FOCUS = false;                   // Jonny 31 Oct: the whole frame sharp
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx } = c;
const END = 10.0;
const P2 = 2.0, P3 = 3.6, P4 = 5.2, P5 = 7.0, ALIVE = 7.6, SNEEZE = 8.3, RUN = 9.0;

// ---------------------------------------------------------------- places (x right, z toward the camera)
// the trio a body-width apart; Reaper a little back so Phoenix's wing and the Wizard's brim clear him
const PHX = [-1.04, 0.15], REA = [-0.04, -0.52], WIZ = [0.64, 0.15];
const JUMP = 0.34;                                        // Phoenix's feet off the sand in the frozen jump
const SCY = [-0.5, -0.5];                                // Reaper's scythe planted upright between him and Phoenix
const DRA = [0.05, -2.7], DS = 3.0, DRA_UP = 0.5, DRA_DOWN = -2.9;   // Dragon behind them, scaled, rising
const OFF = [3.8, 3.8];                                   // where the hidden Reaper-with-scythe waits

// PHOTO: the locked group-photo camera (photos 1-5); a slow drift is added per photo like a print being looked at
const PHOTO = { pos: [-0.14, 1.0, 5.2], look: [-0.14, 1.28, 0], fov: 52 };
const drift = (k) => ({ ...PHOTO, to: { pos: [r3(0.03 * k - 0.14), 1.0, 5.08], look: [r3(0.03 * k - 0.14), 1.28, 0] }, dur: 1.6, ease: "linear" });

const cast = [
  { id: "phx", character: "duo/phoenix", at: PHX, face: 0, expr: "delighted", follow: 0.2, seed: 1.7 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA, face: 0, expr: "happy", follow: 0.2, seed: 3.3 },
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ, face: 0, expr: "happy", follow: 0.2, seed: 2.6 },
  // Reaper with his scythe in hand, from the cut where the photo comes alive (the planted one goes)
  { id: "rea2", character: "sofa/reaper-scythe", at: OFF, face: 0, expr: "shocked", follow: 0.2, seed: 3.3, hidden: true, signature: false },
  { id: "dra", character: "lookdev/dragon-crisp", at: DRA, face: 0, expr: "kind", follow: 0, seed: 4.1, scale: DS, signature: false },
];

// beads on Phoenix's skin and drops falling off his wing tips and chin (body frame: x right, y up from his feet, z out)
const BEADS0 = [[-0.2, 0.95, 0.27], [0.24, 0.82, 0.3], [-0.31, 0.62, 0.24], [0.1, 1.02, 0.25], [0.33, 0.5, 0.2], [-0.06, 0.4, 0.34], [0.18, 0.66, 0.33]];
const DROPS = [[-0.45, 0.42, 0.05], [0.47, 0.4, 0.05], [0.0, 0.28, 0.3], [-0.25, 0.3, 0.22], [0.28, 0.32, 0.2], [-0.62, 0.7, -0.05], [0.64, 0.72, -0.05]];
const BEADS = [...BEADS0, ...BEADS0.map(([x, y, z]) => [r3(-x * 0.9), r3(y - 0.1), z])];
const SOOT = (who, pts) => pts.map(([x, y, z, s], i) => ({ id: `soot-${who}-${i}`, kind: "soot", wear: who, x, y, z, size: s, scale: 0 }));
const props = [
  { id: "pc", kind: "carrier", x: PHX[0], y: JUMP, z: PHX[1] },
  { id: "dc", kind: "carrier", x: DRA[0], y: DRA_DOWN, z: DRA[1] },
  { id: "scyP", kind: "parkedscythe", x: SCY[0], y: 0.62, z: SCY[1], tip: 0, rot: 180 },
  // photo 2: soaked Phoenix, sunburnt Wizard
  { id: "wet", kind: "drips", wear: "phx", x: 0, y: 0, z: 0, beads: BEADS, bead: 0.022, at: DROPS, drop: 0.018, floor: 0.4, on: 0 },
  { id: "burnL", kind: "blotch", wear: "wiz", x: -0.2, y: 0.6, z: 0.31, rot: -20, size: 0.18, color: "#ff2a1e", alpha: 0.85, scale: 0 },
  { id: "burnR", kind: "blotch", wear: "wiz", x: 0.2, y: 0.6, z: 0.31, rot: 20, size: 0.18, color: "#ff2a1e", alpha: 0.85, scale: 0 },
  { id: "burnN", kind: "blotch", wear: "wiz", x: 0, y: 0.66, z: 0.36, size: 0.1, color: "#ff2a1e", alpha: 0.75, scale: 0 },
  // photo 3: the car park's rain and the sand tipped out under them
  { id: "sand", kind: "sandpit", x: 0, y: 0, z: -0.05, w: 2.9, d: 1.15, h: 0.07, color: "#c8a66c", color2: "#b8955c", scale: 0 },
  { id: "rain", kind: "rainfall", x: 0, y: 0, z: 0, box: [[-2.6, 0, -2.0], [2.6, 3.4, 2.2]], n: 500, on: 0 },
  // photo 4: soot, the smoking hat, embers from the fire
  ...SOOT("phx", [[-0.18, 0.78, 0.33, 0.16], [0.26, 0.55, 0.31, 0.13], [0.08, 1.0, 0.24, 0.11], [0.3, 0.86, 0.26, 0.1]]),
  ...SOOT("rea", [[0.18, 0.86, 0.3, 0.19], [-0.22, 0.5, 0.31, 0.16], [-0.15, 0.95, 0.27, 0.12]]),
  ...SOOT("wiz", [[0.22, 0.48, 0.3, 0.16], [-0.25, 0.78, 0.3, 0.14], [0.05, 0.36, 0.34, 0.11], [0.27, 0.82, 0.28, 0.1]]),
  { id: "hatsmoke", kind: "smokewisp", wear: "wiz", wearTurn: false, x: 0.02, y: 1.62, z: -0.05, h: 0.6, size: 0.12, on: 0 },
  { id: "embers", kind: "embers", x: 0, y: 0, z: 0, box: [[-2.4, 0.2, -2.6], [2.4, 3.2, 1.0]], n: 60, on: 0 },
  // Dragon's tiny sun hat and the one sneeze of fire (across the background, up and to the right, behind the trio)
  { id: "hat", kind: "sunhat", wear: "dra", x: 0.04, y: 1.27, z: 0.04, tilt: -8, tip: 14, r: 0.3 },
  { id: "plume", kind: "fireplume", x: -0.15, y: 1.9, z: r3(DRA[1] + 1.1), rot: 70, tip: -48, length: 3.6, width: 0.75, balls: 34 },
];

// ---------------------------------------------------------------- captions (the brief's, each on its own photo)
const Y = 250;
c.cap(0, P2, "our holiday was perfect", Y, false, { kinetic: false });
c.cap(P2, P3, "ok i lied\nwe weren't smiling", Y, false, { kinetic: false });
c.cap(P3, P4, "ok i lied\nwe weren't at the beach", Y, false, { kinetic: false });
c.cap(P4, P5, "ok i lied\nthat's not our hotel", Y, false, { kinetic: false });
c.cap(P5, END, "i'm so sorry", Y, false, { kinetic: false });

// ---------------------------------------------------------------- 1 PERFECT (0-2): the frozen group photo
const FROZEN = ALIVE;   // nobody moves until the photo comes alive
for (const who of ["phx", "rea", "wiz"]) A(0, who, "still", { dur: FROZEN, idle: 0, sink: 0, fade: 0.01 });
A(0, "dra", "ride", { prop: "dc", off: [0, 0, 0], yaw: 0, dur: 0 });
A(0, "phx", "ride", { prop: "pc", off: [0, 0, 0], yaw: 0, dur: 0 });
A(0, "phx", "wings", { to: 0.35, dur: 0.01 });
c.arm(0, "wiz", "L", { o: [0.17, 0.36, 0.1] }, 0.01);   // the staff upright at his outer side, inside the frame
c.arm(0, "phx", "both", "up", 0.01);
A(0, "phx", "grip", { side: "both", shape: "open", dur: 0.01 });
// Reaper's arms folded across his front: right glove over the left forearm
c.arm(0, "rea", "R", { x: [0.11, 0.25, 0.4] }, 0.01); c.arm(0, "rea", "L", { x: [-0.11, 0.21, 0.37] }, 0.01);
A(0, "rea", "grip", { side: "both", shape: "fist", dur: 0.01 });
const GRIN = { phx: ["delighted", { open: 0.7, eye: 1.12, curve: 1 }], rea: ["happy", { open: 0.45, curve: 1, eye: 1.0 }], wiz: ["happy", { open: 0.5, curve: 1, eye: 1.0 }] };
for (const [who, [e, set]] of Object.entries(GRIN)) { A(0, who, "expr", { expr: e, set, dur: 0 }); A(0, who, "look", { to: [0, 0], dur: 0, blink: false }); A(0, who, "noblink", { dur: FROZEN }); }
c.at(0, { fx: "flash", dur: 0.25, peak: 0.55, sound: false });
sfx(0, "flash", { gain: 0.5, reason: "the camera fires on the group photo (frame 0)" });

// ---------------------------------------------------------------- 2 NOT SMILING (2-3.6): scowls, soaked, sunburnt
const SCOWL = { phx: { expr: "angry", set: { eye: 0.85, curve: -0.45, open: 0.05 } }, rea: { expr: "angry", set: { eye: 0.75, curve: -0.4 } }, wiz: { expr: "angry", set: { eye: 0.8, curve: -0.45, open: 0.03 } } };
const snap = (t) => { c.at(t, { fx: "flash", dur: 0.22, peak: 0.5, sound: false }); sfx(t, "flash", { gain: 0.7, reason: "the next photo: the camera fires on the cut" }); };
snap(P2);
for (const [who, s] of Object.entries(SCOWL)) { A(P2, who, "expr", { ...s, dur: 0 }); A(P2, who, "face", { lid: 0.42, brow: 0, dur: 0 }); }
c.prop(P2, "wet", { on: 1 }, 0);
for (const id of ["burnL", "burnR", "burnN"]) c.prop(P2, id, { scale: 1 }, 0);

// ---------------------------------------------------------------- 3 NOT THE BEACH (3.6-5.2): the rainy car park
snap(P3);
c.prop(P3, "sand", { scale: 1 }, 0); c.prop(P3, "rain", { on: 1 }, 0);
c.at(P3, { fx: "lights", to: 0.72, dur: 0.01 });

// ---------------------------------------------------------------- 4 NOT OUR HOTEL (5.2-7): the hotel on fire
snap(P4);
c.prop(P4, "rain", { on: 0 }, 0); c.prop(P4, "sand", { scale: 0 }, 0); c.prop(P4, "embers", { on: 1 }, 0); c.prop(P4, "hatsmoke", { on: 1 }, 0);
for (const p of props.filter((q) => q.kind === "soot")) c.prop(P4, p.id, { scale: 1 }, 0);
c.at(P4, { fx: "lights", to: 0.9, dur: 0.01 });
sfx(P4, "flamejet", { gain: 0.25, reason: "the hotel's fire roars behind them" });

// ---------------------------------------------------------------- 5 SORRY (7-7.6): a huge Dragon rises behind them
snap(P5);
A(P5, "dra", "wings", { to: 1, dur: 0.3 });
c.prop(P5, "dc", { y: DRA_UP }, 0.5, "out");
A(P5, "dra", "expr", { expr: "kind", set: { eye: 1.25, curve: 0.2, open: 0.1 }, dur: 0 });
A(P5, "dra", "look", { to: [0, -0.2], dur: 0, blink: false });
sfx(r3(P5 + 0.08), "ai/dundun", { gain: 0.8, reason: "dö-döm: the huge Dragon head rises into the photo" });

// ---------------------------------------------------------------- 6 LOOK BEHIND (7.6-8.3): the photo comes alive
// Phoenix lands from the jump; all three turn heads and shoulders up toward Dragon; Reaper now holds his scythe
A(ALIVE, "rea", "hide"); A(ALIVE, "rea2", "move", { to: REA, dur: 0, ease: "linear" }); A(ALIVE, "rea2", "show");
c.prop(ALIVE, "scyP", { y: -5 }, 0);
c.prop(ALIVE, "pc", { y: 0 }, 0.18, "in");
sfx(r3(ALIVE + 0.18), "land", { gain: 0.4, reason: "Phoenix's feet hit the wet street" });
A(r3(ALIVE + 0.05), "phx", "wings", { to: 0.15, dur: 0.3 });
c.arm(ALIVE, "phx", "both", "rest", 0.3, "inOut");
for (const who of ["rea2"]) { A(ALIVE, who, "expr", { expr: "angry", set: { eye: 0.75, curve: -0.4 }, dur: 0 }); A(ALIVE, who, "face", { lid: 0.42, dur: 0 }); }
const LOOKUP = { phx: [0.6, 0.9], rea2: [-0.6, 0.9], wiz: [-0.6, 0.9] }, TURN = { phx: 60, rea2: -40, wiz: -50 };
for (const [who, to] of Object.entries(LOOKUP)) {
  const d = who === "rea2" ? 0.06 : who === "wiz" ? 0.1 : 0;
  A(r3(ALIVE + 0.1 + d), who, "look", { to, dur: 0.15, blink: false });
  A(r3(ALIVE + 0.16 + d), who, "turn", { to: TURN[who], dur: 0.3 });
  A(r3(ALIVE + 0.2 + d), who, "expr", { expr: "shocked", set: { open: 0.55, eye: 1.3, curve: -0.5 }, dur: 0.25 });
  A(r3(ALIVE + 0.2 + d), who, "face", { lid: 0, brow: 0.45, dur: 0.25 });
}
// Dragon's sneeze builds: eyes squeeze, head tips back
A(ALIVE, "dra", "expr", { expr: "focused", set: { eye: 0.1, open: 0.6, curve: -0.4, pucker: 0 }, dur: 0.3 });
A(ALIVE, "dra", "face", { lid: 0.3, brow: 0, dur: 0.3 });
A(ALIVE, "dra", "pitch", { to: -12, dur: 0.6, ease: "inOut" });
sfx(r3(ALIVE + 0.2), "gasp", { gain: 0.6, reason: "ah... (Dragon's sneeze builds, eyes squeezed)" });

// ---------------------------------------------------------------- 7 SNEEZE (8.3-9): one fireball over them; they run
A(r3(SNEEZE - 0.05), "dra", "pitch", { to: 12, dur: 0.1, ease: "out" });
A(r3(SNEEZE - 0.05), "dra", "squash", { amount: 0.1, dur: 0.15 });
A(SNEEZE, "dra", "expr", { expr: "focused", set: { eye: 0.1, open: 0.7, pucker: 0 }, dur: 0.06 });
c.prop(SNEEZE, "plume", { on: 1 }, 0.04, "out"); c.prop(SNEEZE, "plume", { len: 1 }, 0.55, "out");
c.prop(r3(SNEEZE + 1.0), "plume", { fade: 0.6 }, 0.6, "inOut");
sfx(r3(SNEEZE - 0.02), "blow", { gain: 0.6, dur: 0.3, reason: "CHOO: Dragon's sneeze" });
sfx(SNEEZE, "flamejet", { gain: 1.4, reason: "fwoosh: the fireball rolls over their heads across the background" });
c.at(SNEEZE, { fx: "shake", dur: 0.3, amount: 0.5 });
// they recoil, spin to the lens and run (the eyes first)
const RUN_TO = { phx: [-0.82, 1.2], rea2: [0.12, 0.45], wiz: [0.7, 1.2] };
for (const who of ["phx", "rea2", "wiz"]) {
  const d = who === "rea2" ? 0.04 : who === "wiz" ? 0.07 : 0;
  A(r3(SNEEZE + 0.02 + d), who, "squash", { amount: -0.06, dur: 0.2 });
  A(r3(SNEEZE + 0.08 + d), who, "look", { to: [0, 0], dur: 0.1, blink: false });
  A(r3(SNEEZE + 0.12 + d), who, "turn", { to: 0, dur: 0.18 });
  A(r3(SNEEZE + 0.12 + d), who, "expr", { expr: "shocked", set: { open: 0.75, eye: 1.35, curve: -0.6 }, dur: 0.15 });
  A(r3(SNEEZE + 0.25 + d), who, "move", { to: RUN_TO[who], dur: r3(END - SNEEZE - 0.3 - d), stride: 2.1, bob: 0.05 });
}
A(r3(SNEEZE + 0.25), "phx", "wings", { to: 0, dur: 0.2 });

// ---------------------------------------------------------------- 8 RUN (9-10): faces fill the frame, flash at the edges
c.at(RUN, { fx: "speedlines", dur: 1.0 });
sfx(9.05, "whoosh", { gain: 0.9, reason: "they race past the lens" });

// ---------------------------------------------------------------- shots
const beats = c.beats([
  ["1 perfect", 0, drift(0), "hook"],
  ["2 not smiling", P2, drift(1)],
  ["3 not the beach", P3, drift(-1)],
  ["4 not our hotel", P4, drift(1)],
  ["5 sorry", P5, { ...PHOTO, to: { pos: [-0.1, 1.05, 5.1], look: [-0.1, 1.45, 0] }, dur: 0.6, ease: "out" }, "reveal"],
  ["6 look behind", ALIVE, { pos: [-0.1, 1.05, 5.1], look: [-0.1, 1.45, -0.5], fov: 52 }, "reaction"],
  ["7 sneeze", SNEEZE, { pos: [-0.08, 0.85, 5.0], look: [-0.08, 1.35, 0], fov: 58, to: { pos: [0, 0.82, 4.6] }, dur: 0.7, ease: "linear" }, "payoff"],
  ["8 run", RUN, { pos: [-0.04, 0.8, 4.0], look: [-0.04, 1.15, 1.0], fov: 60, to: { pos: [-0.04, 0.8, 4.35] }, dur: 1.0, ease: "linear" }],
], END);

write(import.meta.url, {
  id: "ok-i-lied",
  title: "Ok I Lied",
  idea: "Jonny's holiday-photo storyboard (1 Nov 2026): one group photo, three lies, one Dragon in a tiny sun hat",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "art",
  motion: "natural",
  // one locked photo: a see-through floor over the painted ground, the picture changing on each photo's cut
  set: { type: "plain", floor: "shadow", shadow: 0.3, light: "golden", para: 0, bloom: "emissive", aperture: FOCUS ? 0.045 : 0,
    plate: { src: "assets/plates/okilied-beach.png", z: -3.4, center: [0, 1.6], height: 9.4, depth: false, motion: false, dust: 0,
      swaps: [{ at: P3, src: "assets/plates/okilied-carpark.png" }, { at: P4, src: "assets/plates/okilied-hotel.png" }] } },
  music: { style: "bounce", gain: 0.38, parts: [{ at: 0, part: "main" }, { at: P2, part: "intro" }, { at: P3, part: "stop" }],
    then: { file: "ai/sad/sad-02.ogg", from: P3, gain: 0.3 } },
  sound: { sfx: 0.7, ambience: 0.15, signature: { payoff: false }, surface: "concrete" },
  hook: { show: ["phx", "rea", "wiz"], hint: 0, what: "a perfect holiday group photo, captioned 'our holiday was perfect'" },
  creative: { length: [10, 10] },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "scyP", from: 0, to: ALIVE, reason: "Reaper's scythe stands planted beside him in the photo" },
    { who: "phx", with: "wet", from: 0, to: END, reason: "water beads on Phoenix's skin" },
  ],
  notes: "Generated by storyboards/trend/ok-i-lied/make-ok-i-lied.mjs.",
});
