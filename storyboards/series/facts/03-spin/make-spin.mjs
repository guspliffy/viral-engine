// Fact what-if 03: "What if Earth spun faster every second?" (vertical, 76.1 s). Settled step by step with Jonny in the thread
// "Make Earth spins faster what-if" (21 Nov 2026): topic C, hook "Every second, Earth spins faster. In one minute, it rips
// itself apart.", counter 1+3 (the day/night flicker in sky and room + a written chip ticking +0.3x a second from 2.0x),
// opening A (already at 2x: the sea surging up the Andes valley, Spud spits his coffee; no flash-forward), ending A (Earth
// cracks and spins into a flat disc with a ring: "Good news: the flat-earthers were right.", cut on the line).
// Target: Jonny's approved panel sheets ref/spin-panels-A.jpg (1-9) and -B.jpg (10-17); numbers: DESIGN.md (Fable);
// facts + sources: STORY.md. Spud = "you", alone. The world props all run on one param t = clip seconds.
//
// THE BRIEF
//   Joke:        Earth speeding up is a disaster for the planet and a gift for you (lighter, dunks), until it is not.
//   Wants:       Spud (you) wants to enjoy being lighter.
//   Consequence: weightless, he loses his grip on the lamp post and floats off; the planet rips itself flat.
//   Ending:      the flat-earthers were right (cut on the punchline).
//   Callback:    the sea climbing toward Quito at 0 s is the same sea that lifts off the planet at 50-60 s.
//
//   node storyboards/series/facts/03-spin/make-spin.mjs   -> spin.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { NARRATOR, END, LINES } from "./lines.mjs";
import { readFileSync } from "node:fs";

const LEN = JSON.parse(readFileSync(new URL("./lines.json", import.meta.url), "utf8"));
const c = clip({ faces: "strong" }), { A, sfx, prop, cap, see } = c;
const F = { SUB: 520, HUDY: 305 };   // DESIGN I/0 had the chip at y 250: its box left the app safe zone (top 210), so it sits at 305; captions in the band 380-640

// ---------------------------------------------------------------- tracks (engine/page/spin-tracks.js, same numbers)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const STREET = (u) => r3(-9 - 0.16 * u);          // cobbles height at u metres down the street (z = -(u + 3))
const zOf = (u) => r3(-(u + 3));

// ---------------------------------------------------------------- cameras (DESIGN J; the director owns them)
const CAM = {
  P1: { pos: [-0.25, 1.25, 0.55], look: [0.3, 0.35, -3.6], fov: 58, near: 0.04 },   // draft 1: he stands left, the sea wall right of him in the window   // draft 0: DESIGN's P1 showed only the back of his head; he turns 3/4 to us
  P2: { pos: [40, 62, 250], look: [-60, -170, -1500], fov: 50, near: 4 },
  P3: { pos: [800, -60, -900], look: [800, -286, -1250], fov: 44, near: 4 },
  P4: { pos: [-1.3, 1.05, 0.9], look: [1.57, 0.8, -1.11], fov: 52, near: 0.04 },
  P5: { pos: [0.5, 1.0, 0.05], look: [1.05, 1.1, -2.65], fov: 56, near: 0.04 },
  P6: { pos: [0.9, 1.2, -0.75], look: [-0.3, 0.7, -2.2], fov: 64, near: 0.04 },   // draft 1: (1.3, 1.0, -.2) stood inside the TV   // draft 0: DESIGN's P6 sat inside his head; from the front-right, clock and window behind
  P7: { pos: [0.6, 0.95, 1.55], look: [-0.1, 0.8, -0.6], fov: 50, near: 0.04 },   // draft 0: further back (his face filled the frame)
  P8: { pos: [1.35, 0.85, 1.05], look: [-0.1, 1.45, -0.5], fov: 60, near: 0.04 },   // draft 0: from below he showed only his back; front-right, the lamp above
  P9: { pos: [-0.4, -10.4, -15.6], look: [2.3, -10.0, -19.6], fov: 50, near: 0.3 },   // draft 0: closer (he was tiny)
  P10: { pos: [0.3, -12.6, -36], look: [0, -17.8, -75], fov: 55, near: 0.5 },   // draft 0: closer (he was tiny)
  P11: { pos: [-1.9, -16.4, -53.5], look: [2.4, -16.3, -58.5], fov: 50, near: 0.5 },
  P12: { pos: [1.2, -16.2, -50.5], look: [2.6, -18.2, -75], fov: 52, near: 0.5 },   // draft 0: he was cut by the right edge
};
// P13: P12 tilting up 6 deg and rising .8 m (the street bench's function)
const p13 = (u) => {
  const P = CAM.P12, dx = P.look[0] - P.pos[0], dy = P.look[1] - P.pos[1], dz = P.look[2] - P.pos[2], h = Math.hypot(dx, dz), pitch = Math.atan2(dy, h) + (6 * Math.PI / 180) * u;
  return { pos: [P.pos[0], r3(P.pos[1] + 0.8 * u), P.pos[2]], look: [r3(P.pos[0] + (dx / h) * 22), r3(P.pos[1] + 0.8 * u + Math.tan(pitch) * 22), r3(P.pos[2] + (dz / h) * 22)], fov: 52, near: 0.5 };
};
// P14: world HI, the andes bench's camera (height over the cap and pitch from alt = P(55, 60))
const HI = [40000, 0, 0];
const hiCam = (a) => {
  const h = a < 0.5 ? lerp(1100, 1450, a / 0.5) : lerp(1450, 1784, (a - 0.5) / 0.5), p = (a < 0.5 ? lerp(43.7, 48.4, a / 0.5) : lerp(48.4, 52, (a - 0.5) / 0.5)) * Math.PI / 180;
  const pos = [HI[0], 2400 + h, HI[2]];
  return { pos: pos.map(r3), look: [pos[0], pos[1] - 1000 * Math.sin(p), pos[2] - 1000 * Math.cos(p)].map(r3), fov: 50, near: 4, pitch: p };
};
// P15-P17: world SP (Earth radius 100 at [80000, 0, 0]); the space bench's cameras
const SP = [80000, 0, 0];
const SPC = {
  P15: { pos: [80005.77, -23.082, 761], look: [80005.77, -23.082, 0], fov: 40, near: 1 },
  P16: { pos: [80000, -41.857, 690], look: [80000, -41.857, 0], fov: 40, near: 1 },
  P17: { pos: [79991.166, -88.339, 1165], look: [79991.166, -88.339, 0], fov: 40, near: 1 },
};
// every shot moves (Jonny 20 Nov): a push toward the look point, a punch (same axis, tighter lens), a zoom
const push = (C, dur, amt = 0.06, fk = 1) => {
  const to = C.pos.map((p, i) => r3(p + (C.look[i] - p) * amt));
  return { ...C, to: { pos: to, look: C.look, fov: r3(C.fov * fk) }, dur: r3(dur), ease: "linear" };
};
const punch = (C, dur, amt = 0.04, fk = 0.8) => { const p = push(C, dur, amt); return { ...p, fov: r3(p.fov * fk), to: { ...p.to, fov: r3(p.fov * fk * 0.97) } }; };
const drift = (C, dur, d) => ({ ...C, to: { pos: C.pos.map((p, i) => r3(p + d[i])), look: C.look.map((p, i) => r3(p + d[i])), fov: C.fov }, dur: r3(dur), ease: "linear" });

// ---------------------------------------------------------------- props
const SP0 = [-0.4, -1.3], YAW0 = 60;   // frame 0: at the window, 3/4 to the camera
const MUG = { id: "mug", kind: "smug", ...grips.placeFor("smug", [-0.235, 0.5, -0.985], YAW0), t0: 0.0, mouth: [-0.227, 0.62, -1.2] };
const BAG = { id: "bag", kind: "scrisps", ...grips.placeFor("scrisps", [-1.55, 0.45, -2.0], 0), t0: 19.2, from: [0.17, 0.6, -0.1], mouth: [-0.05, 0.6, -0.2], crown: [-0.02, 0.98, -0.42] };
const BALL = { id: "ball", kind: "sball", x: 2.32, y: -11.15, z: -18.72, rot: 0, float: 36.7, fx: 0.9 };
const SLAM = 13.6, SLAP = 10.5, SMASH = 18.3, BONK = 28.0, SWISH = 33.5;
const props = [
  // the sky (backdrop at infinity) and the room's light
  { id: "sky", kind: "ssky", x: 0, y: 0, z: 0, rot: 0 },
  { id: "clouds", kind: "sclouds", x: 0, y: 0, z: 0, rot: 0 },
  { id: "storm", kind: "sstorm", x: 0, y: 0, z: 0, rot: 0 },
  { id: "roomlight", kind: "sroomlight", x: 0, y: 0, z: 0, rot: 0 },
  // the flat's moving things
  { id: "win", kind: "swindow", x: 0, y: 0, z: 0, rot: 0, slamAt: SLAM },
  { id: "crt", kind: "scrt", x: 1.45, y: 0, z: -0.25, rot: -48, driftAt: 9.0, staticAt: 9.5, slapAt: SLAP },
  { id: "clock", kind: "sclock", x: 0.23, y: 0, z: -2.22, rot: 0, ringFrom: 16.27, smashAt: SMASH, fist: [0.15, 0.66, -2.02], staged: "the alarm clock stands on the side table (part of the spinroom set)" },
  { id: "lamp", kind: "spendant", x: 0, y: 1.93, z: -0.45, rot: 0, tb: BONK, slamAt: SLAM, staged: "a pendant lamp hanging from the ceiling on its chain" },
  MUG, BAG,
  { id: "quilt", kind: "squilt", x: -1.0, y: 0, z: -2.03, rot: 0, staged: "the quilt lies over the sofa seat (part of the spinroom set)" },
  // Quito, the Andes, the sea, the high view
  { id: "andes", kind: "sandes", x: 0, y: 0, z: 0, rot: 0, centro: 1 },
  { id: "sea", kind: "ssea", x: 0, y: 0, z: 0, rot: 0 },
  { id: "high", kind: "shigh", x: 0, y: 0, z: 0, rot: 0 },
  // the street and its weather
  { id: "street", kind: "sstreet", x: 0, y: 0, z: 0, rot: 0, swish: SWISH, splash: [[39.95, 0.2, 41.2]] },
  { id: "rain", kind: "srain", x: 0, y: 0, z: 0, rot: 0 },
  { id: "blobs", kind: "sblobs", x: 0, y: 0, z: 0, rot: 0 },
  BALL,
  // space
  { id: "stars", kind: "sstars", x: 0, y: 0, z: 0, rot: 0, scale: 0 },
  { id: "earth", kind: "searth", x: 0, y: 0, z: 0, rot: 0 },
  { id: "disc", kind: "sdisc", x: 0, y: 0, z: 0, rot: 0 },
];
// every world prop runs on t = clip seconds, one linear tween over the whole clip
const WORLD = ["sky", "clouds", "storm", "roomlight", "andes", "sea", "high", "street", "rain", "blobs", "ball", "earth", "disc"];
for (const id of WORLD) { prop(0, id, { t: 0 }, 0, "linear"); prop(0, id, { t: END }, END, "linear"); }
// the starfield dome is camera-pinned: only in space; the Earth sky leaves there
prop(59.98, "stars", { scale: 1 }, 0, "linear");
prop(0, "quilt", { scale: 0 }, 0, "linear"); prop(14.97, "quilt", { scale: 1 }, 0, "linear"); prop(19.0, "quilt", { scale: 0 }, 0, "linear");   // only P6 needs it (he stands against the sofa in P1)
for (const id of ["sky", "clouds"]) prop(59.98, id, { scale: 0 }, 0, "linear");
prop(0, "andes", { centro: 1 }, 0, "linear");

const cast = [{ id: "spud", character: "potatobrawl/spud", at: SP0, face: YAW0, expr: "shocked", follow: 0, seed: 3.17 }];

// ---------------------------------------------------------------- helpers
const expr = (t, name, set, dur = 0.2) => A(t, "spud", "expr", { expr: name, ...(set && { set }), dur });
const look = (t, to, dur = 0.2) => A(t, "spud", "look", { to, dur, blink: false });
// placing him on a cut (clip lessons): dur .01, linear, sync, at t - .02
const place = (t, [x, z], y, face) => {
  A(r3(t - 0.02), "spud", "move", { to: [x, z], ...(y != null && { y }), dur: 0.01, steps: 0, ease: "linear", sync: true });
  if (face != null) A(r3(t - 0.02), "spud", "turn", { to: face, dur: 0.01, ease: "linear", sync: true });
};
const flyTo = (t, [x, y, z], dur, ease = "inOut") => A(r3(t), "spud", "fly", { to: { x: r3(x), y: r3(y), z: r3(z) }, dur: r3(dur), ease });
const grip = (t, side, shape = "hold", dur = 0.1) => A(t, "spud", "grip", { side, shape, dur });
const LEAD = 0.12;   // captionLead: each word pops this much before its voice
const narr = (t, line, text) => {
  const d = LEN[line]; if (!d) throw new Error(`no measured length for "${line}" (run measure-lines.mjs)`);
  c.at(t, { macro: "narrate", line, voice: NARRATOR, dur: d, caption: false, pos: F.SUB, gain: 4.0 });
  const nextLine = LINES.find(([k]) => k > t + 0.05)?.[0] ?? END;
  const end = Math.min(r3(t + d + 0.25), r3(nextLine - LEAD - 0.02), END - 0.01);
  const said = (txt, k0) => ({ said: line.split(/\s+/).slice(k0, k0 + txt.split(/\s+/).length).join(" ") });
  const t0 = Math.max(0, r3(t - LEAD));
  // a long line goes up as two captions in the same place, split at its sentence break
  const parts = text.length > 44 && /[.?] /.test(text) ? text.split(/(?<=[.?:]) /) : [text];
  if (parts.length === 1) { cap(t0, end, text, F.SUB, false, said(text, 0)); return; }
  const words = text.split(/\s+/).length, k1 = parts[0].split(/\s+/).length, at = r3(t0 + d * (k1 / words));
  cap(t0, at, parts[0], F.SUB, false, said(parts[0], 0)); cap(at, end, parts.slice(1).join(" "), F.SUB, false, said(parts.slice(1).join(" "), k1));
};
for (const [t, line, text] of LINES) narr(t, line, text);

// ================================================================ 0-2.2 P1 2.0x: the sea wall below, he spits his coffee
// frame 0: mid-sip at the window, the mug at his mouth; the spit (smug spit = P(.10, .95)) is the first action
const hm = grips.mug(c, "spud", MUG, { side: "R" });
hm.take(0, { reach: 0.01, settle: 0.01 });
expr(0, "shocked", { open: 0.6, eye: 1.25 }, 0);
A(0, "spud", "noblink", { dur: 0 });
for (const b of [8.75, 18.9, 22.6, 24.5, 30.5, 36.3, 42.8, 49.4]) A(b, "spud", "blink", {});   // draft 2: dur .6 drew a slow sleepy sin blink (eyes-readable); a plain blink. Blinks only between lines (no blink on a key line)
look(0, [0.1, -0.15], 0);
A(0.1, "spud", "squash", { amount: 0.12, dur: 0.3 });
A(0.12, "spud", "lean", { to: -6, dur: 0.2, ease: "out" });
A(0.9, "spud", "lean", { to: 0, dur: 0.5, ease: "inOut" });
expr(0.95, "terrified", { open: 0.35, eye: 1.3 }, 0.15);
look(1.0, [0.25, -0.2], 0.25);
sfx(0.1, "splort", { gain: 0.7, reason: "he sprays the coffee out" });
sfx(0.0, "ai/water-gush", { gain: 0.55, dur: 2.2, reason: "the sea wall roaring up the valley below the window" });
sfx(0.05, "rumble", { gain: 0.6, dur: 5, reason: "the far roar of the whole sea moving" });
sfx(0.55, "patter", { gain: 0.35, reason: "coffee drops hit the glass" });
see(0, 2.2, ["spud.face", "mug", "sea"], "2.0x: through the window the sea wall surges up the green valley; Spud sprays his coffee");
// off screen from 2.2: the mug goes back on the side table (he is not seen again until 9.0)
hm.release(2.3, { rest: "rest", back: 0.05 });
prop(2.45, "mug", { x: 0.4, y: 0.52, z: -2.08 }, 0, "linear");

// ================================================================ 2.2-9.0 P2 + P3: Quito, the valleys drowning (world shots)
sfx(2.25, "waves", { gain: 0.6, dur: 6.6, reason: "surf breaking in every valley below the city" });
sfx(5.05, "ai/car-waves", { gain: 0.45, dur: 3.8, reason: "water pouring through the drowning town" });
sfx(6.2, "crumble", { gain: 0.35, reason: "a roof breaking off under the water" });
see(2.2, 5.0, ["andes", "sea"], "2.7x: Quito on its plateau, the sea filling every valley below");
see(5.0, 9.0, ["sea"], "3.5x: the valley town drowning, the church dome last");

// ================================================================ 9.0-11.5 P4 4.7x: the TV loses the satellite, he slaps it
place(9.0, [0.5, -0.8], 0, 40);
expr(9.0, "annoyed", { eye: 0.9 }, 0); look(9.0, [0.4, 0.05], 0);
A(9.55, "spud", "move", { to: [0.86, -0.8], dur: 0.7 });
A(9.55, "spud", "turn", { to: 55, dur: 0.4 });
expr(9.6, "angry", { eye: 0.8, curve: -0.4 }, 0.2);
A(10.3, "spud", "arm", { side: "R", pose: { o: [0.12, 0.85, 0.2] }, dur: 0.18, ease: "out" });      // wind up
A(r3(SLAP - 0.08), "spud", "arm", { side: "R", pose: { world: [1.22, 0.82, -0.47] }, dur: 0.08, ease: "in" });
A(r3(SLAP + 0.15), "spud", "arm", { side: "R", pose: "rest", dur: 0.35, ease: "settle" });
A(SLAP, "spud", "squash", { amount: 0.06, dur: 0.2 });
expr(r3(SLAP + 0.4), "deadpan", { eye: 0.7 }, 0.2);
look(r3(SLAP + 0.5), [0.6, 0.15], 0.2);
sfx(9.5, "hiss", { gain: 0.3, dur: 2.0, reason: "the TV picture breaks into static" });
sfx(SLAP, "slap", { gain: 0.9, reason: "his palm slaps the side of the TV" });
sfx(r3(SLAP + 0.02), "kenney/impact-wood-light", { gain: 0.4, reason: "the TV cabinet knocks" });
see(9.0, 11.5, ["spud.face", "crt"], "4.7x: the satellite drifts off, static; Spud slaps the TV");

// ================================================================ 11.5-15.0 P5 5.5x: the hurricane fills the window, he slams it
place(11.5, [1.0, -2.15], 0, 180);
expr(11.5, "shocked", { eye: 1.2, open: 0.3 }, 0);
A(11.6, "spud", "move", { to: [1.04, -2.15], dur: 0.6 });
const PULL0 = [0.945, 0.9, -2.5], PULL1 = [1.805, 0.9, -2.5];   // the glove wraps the pull from the room side
A(12.1, "spud", "arm", { side: "R", pose: { world: PULL0 }, dur: 0.3, ease: "out" });
A(12.15, "spud", "arm", { side: "L", pose: { world: [0.9, 1.0, -2.5] }, dur: 0.3, ease: "out" });
grip(12.4, "R"); grip(12.45, "L");
A(r3(SLAM - 0.35), "spud", "lean", { to: 8, dur: 0.3 });                                            // he braces
A(SLAM, "spud", "arm", { side: "R", pose: { world: PULL1 }, dur: 0.2, ease: "in" });
A(SLAM, "spud", "arm", { side: "L", pose: { world: [1.76, 1.0, -2.5] }, dur: 0.2, ease: "in" });
A(SLAM, "spud", "move", { to: [1.45, -2.15], dur: 0.2, steps: 0, ease: "in" });
A(r3(SLAM + 0.2), "spud", "squash", { amount: 0.08, dur: 0.25 });
A(r3(SLAM + 0.35), "spud", "lean", { to: 0, dur: 0.3 });
grip(r3(SLAM + 0.7), "R", "relaxed", 0.2); grip(r3(SLAM + 0.7), "L", "relaxed", 0.2);
A(r3(SLAM + 0.75), "spud", "arm", { side: "both", pose: "rest", dur: 0.45, ease: "settle" });
A(r3(SLAM + 0.9), "spud", "turn", { to: 150, dur: 0.35 });
expr(r3(SLAM + 0.9), "annoyed", { eye: 0.8 }, 0.2);
sfx(11.5, "ai/storm-wind", { gain: 0.7, dur: 2.2, reason: "storm wind howling in through the open window" });
sfx(11.5, "ai/rain-car-roof", { gain: 0.35, dur: 2.2, reason: "rain lashing the glass and the floor" });
sfx(SLAM + 0.2, "slam", { gain: 1.0, reason: "the sash slams shut" });
sfx(r3(SLAM + 0.22), "kenney/impact-glass-light", { gain: 0.5, reason: "the glass rattles in the frame" });
sfx(r3(SLAM + 0.3), "ai/storm-wind", { gain: 0.2, dur: 1.2, reason: "the wind, muffled behind the glass" });
see(11.5, 15.0, ["spud", "win", "storm"], "5.5x: a hurricane fills the window; he slams the sash shut");

// ================================================================ 15.0-19.0 P6 6.5x: day-night strobe, the alarm rings, he smashes it
place(15.0, [-0.2, -1.95], null, 70);
A(14.98, "spud", "sit", { rot: 70, height: 0.45, dur: 0, hands: "keep" });
A(15.0, "spud", "face", { lid: 0.55, dur: 0 });
expr(15.0, "deadpan", { eye: 0.6 }, 0); look(15.0, [0.2, -0.1], 0);
A(16.3, "spud", "face", { lid: 0.2, dur: 0.12 });                        // the ring wakes him
expr(16.3, "annoyed", { eye: 0.8, curve: -0.5 }, 0.15); look(16.35, [0.35, -0.35], 0.15);
A(17.7, "spud", "arm", { side: "L", pose: { world: [0.12, 0.95, -2.02] }, dur: 0.4, ease: "out" });   // the fist goes up
grip(17.75, "L", "fist", 0.15);
A(r3(SMASH - 0.1), "spud", "arm", { side: "L", pose: { world: [0.15, 0.68, -2.02] }, dur: 0.1, ease: "in" });
A(SMASH, "spud", "squash", { amount: 0.08, dur: 0.22 });
expr(SMASH, "angry", { eye: 0.7, open: 0.2, curve: -0.6 }, 0.06);
A(r3(SMASH + 0.3), "spud", "arm", { side: "L", pose: "rest", dur: 0.45, ease: "settle" });
grip(r3(SMASH + 0.35), "L", "relaxed", 0.2);
expr(r3(SMASH + 0.35), "deadpan", { eye: 0.55 }, 0.25); A(r3(SMASH + 0.35), "spud", "face", { lid: 0.5, dur: 0.25 });
sfx(16.27, "alarmbell", { gain: 0.6, dur: 2.0, reason: "the alarm clock rings" });
sfx(SMASH, "hit-metal", { gain: 0.8, reason: "his fist smashes the clock" });
sfx(r3(SMASH + 0.03), "kenney/impact-metal-light", { gain: 0.5, reason: "the bells and gears scatter" });
sfx(r3(SMASH + 0.4), "kenney/impact-metal-light", { gain: 0.35, reason: "a bell rolls off the table edge" });
see(15.0, 19.0, ["spud.face", "clock", "win"], "6.5x: half day, half night through the glass; the alarm rings, he smashes it");

// ================================================================ 19.0-26.7 P7 7.7x: crisps float down, he catches one in his mouth
A(18.98, "spud", "stand", { dur: 0, sync: true });   // draft 2: at 18.9 he vanished off the sofa in P6's last frames
place(19.0, [-0.05, -0.4], 0, 0);
A(18.98, "spud", "face", { lid: 0, dur: 0, sync: true });
const hb = grips.phone(c, "spud", BAG, { side: "L" });
prop(18.97, "bag", { x: 0.17, y: 0.34, z: -0.1 }, 0, "linear");   // to his hand's side first (it waits on the sofa)
hb.take(18.98, { reach: 0.01, settle: 0.01 });   // behind P6's camera: in his hand from P7's first frame
expr(19.0, "kind", { eye: 1.0 }, 0); look(19.0, [0, 0.1], 0);
hb.carry(19.12, [0.13, 0.46, -0.28], 0.1, "out"); hb.carry(19.24, [0.13, 0.36, -0.28], 0.25, "inOut");   // the toss
expr(19.4, "shocked", { eye: 1.2, open: 0.15 }, 0.15);
look(19.5, [0.1, 0.6], 0.3); look(20.4, [0.05, 0.35], 0.4); look(21.0, [0, 0.15], 0.3);
expr(21.0, "shocked", { eye: 1.15, open: 0.6 }, 0.2);                   // mouth open under it
A(21.55, "spud", "squash", { amount: 0.05, dur: 0.18 });
expr(21.6, "happy", { eye: 0.9, open: 0.1, curve: 0.9 }, 0.12);
for (const k of [0, 0.35, 0.7]) sfx(r3(21.6 + k), "ai/crunch", { gain: 0.55, reason: "he crunches the crisp" });
sfx(19.22, "crinkle", { gain: 0.5, reason: "the foil bag rustles as he tosses" });
look(22.6, [0.3, 0.25], 0.3); look(23.4, [-0.2, 0.3], 0.3); look(24.2, [0, 0.1], 0.2);
expr(24.2, "smug", { curve: 0.8, eye: 0.8 }, 0.2);
// draft 2: the bag is held at a world point, so in the hops it stayed behind (long sleeve, hand flip): it goes on the cut to P07c
hb.release(24.32, { rest: "rest", back: 0.01 });
prop(24.34, "bag", { x: 0.55, y: 0, z: -0.15 }, 0, "linear");
// a test hop: he barely tries and floats up slow
A(24.9, "spud", "hop", { height: 0.35, count: 1, dur: 1.2, quiet: true });
expr(25.2, "shocked", { eye: 1.2, open: 0.2 }, 0.15); expr(26.15, "happy", { curve: 1, eye: 1 }, 0.2);
sfx(26.1, "step", { gain: 0.4, reason: "his feet land soft on the boards" });
see(19.0, 26.7, ["spud.face", "bag"], "7.7x: the crisps float down slowly; he catches one in his open mouth");

// ================================================================ 26.7-31.0 P8 10x: the jump, his head bonks the lamp
expr(26.7, "happy", { curve: 1, eye: 1.05 }, 0); look(26.7, [0, 0.3], 0);
A(27.3, "spud", "crouch", { to: 0.4, dur: 0.18 }); A(27.48, "spud", "crouch", { to: 0, dur: 0.1 });
A(27.5, "spud", "hop", { height: 0.95, count: 1, dur: 1.0, quiet: true });
A(27.5, "spud", "arm", { side: "both", pose: "shrug", dur: 0.3, ease: "out" });
A(BONK, "spud", "squash", { amount: 0.16, dur: 0.2 });
expr(BONK, "shocked", { eye: 1.3, open: 0.35 }, 0.05);
A(BONK, "spud", "face", { lid: 0.8, dur: 0.05 }); A(r3(BONK + 0.2), "spud", "face", { lid: 0, dur: 0.12 });
A(28.6, "spud", "arm", { side: "R", pose: { o: [0.05, 0.92, 0.12] }, dur: 0.3, ease: "out" });   // rubs his head
expr(28.8, "happy", { curve: 1, eye: 0.9 }, 0.25); look(28.8, [0, 0.05], 0.2);
A(30.2, "spud", "arm", { side: "R", pose: "rest", dur: 0.4, ease: "settle" });
sfx(BONK, "kenney/impact-metal-light", { gain: 0.7, reason: "his head bonks the metal lamp shade" });
sfx(r3(BONK + 0.02), "kenney/impact-metal-light", { gain: 0.3, reason: "the chain rattles" });
sfx(28.5, "step", { gain: 0.45, reason: "he lands back on the boards" });
see(26.7, 31.0, ["spud.face", "lamp"], "10x: a jump from standing takes his head into the ceiling lamp; it swings");

// ================================================================ 31.0-36.7 P9 11.3x: the street, the dunk (false close)
const D0 = [2.0, -19.0], D1 = [2.48, -19.55];
place(30.9, D0, STREET(-(D0[1] + 3)), 230);
expr(30.9, "smug", { curve: 0.9, eye: 0.9 }, 0); look(30.9, [0.3, 0.3], 0);
const hball = grips.mug(c, "spud", BALL, { side: "R", height: 0 });
hball.take(30.9, { reach: 0.01, settle: 0.01 });
hball.carry(31.3, [2.32, -11.05, -18.72], 0.35);   // a bounce in the hand, ready
A(32.55, "spud", "crouch", { to: 0.45, dur: 0.2 }); A(32.75, "spud", "crouch", { to: 0, dur: 0.1 });
A(32.8, "spud", "move", { to: D1, y: STREET(-(D1[1] + 3)), dur: 0.7, steps: 0, ease: "linear" });   // the move before the hop: its y would overwrite the hop's lift
A(32.8, "spud", "hop", { height: 1.0, count: 1, dur: 1.4, quiet: true });
hball.carry(32.8, [2.84, -9.3, -19.72], 0.58, "inOut");   // up over the rim
hball.carry(33.38, [2.86, -9.62, -19.74], 0.12, "in");     // down through it
expr(33.0, "happy", { curve: 1, eye: 1.1, open: 0.3 }, 0.15);
A(33.5, "spud", "release", { prop: "ball", dur: 0 }); grip(33.5, "R", "open", 0.15);
A(33.52, "spud", "arm", { side: "R", pose: { o: [0.34, 0.75, 0.14] }, dur: 0.3, ease: "out" });   // the hand swings out to his side, then down
A(34.1, "spud", "arm", { side: "R", pose: "rest", dur: 0.4, ease: "settle" });
A(33.8, "spud", "turn", { to: 330, dur: 0.4 });                         // round to the camera while he floats down
// the ball (no physics in this clip): through the net, then long floaty bounces downhill (9.81 w: each hop lasts ~1.8x)
const BB = [[33.5, 2.86, -9.62, -19.74], [33.95, 2.75, -11.42, -20.2], [34.95, 2.4, -10.6, -21.6], [35.95, 2.0, -11.62, -23.0], [36.7, 1.6, -11.2, -24.2]];
for (let i = 1; i < BB.length; i++) { const [t0] = BB[i - 1], [t1, x, y, z] = BB[i]; prop(t0, "ball", { x, y, z }, r3(t1 - t0), i % 2 ? "in" : "out"); }
expr(34.4, "smug", { curve: 1, eye: 0.85 }, 0.2); look(34.5, [0, 0.1], 0.2);
A(35.0, "spud", "arm", { side: "both", pose: "shrug", dur: 0.5 });
sfx(SWISH, "netshot", { gain: 0.8, reason: "the ball swishes through the net" });
for (const [t] of BB.slice(1, 4).filter((_, i) => i % 2 === 0)) sfx(t, "thud", { gain: 0.45, reason: "the ball bounces on the cobbles" });
sfx(34.3, "step-concrete", { gain: 0.5, reason: "he lands on the cobbles" });
see(31.0, 36.7, ["spud.face", "ball"], "11.3x: half his weight gone, he dunks on the street hoop; the sea is lower down the valley");

// ================================================================ 36.7-43.3 P10 13x: every step is a jump; uphill, away from the water
const HOPS = [[36.7, 54], [38.2, 49.5], [39.7, 45], [41.2, 41.2], [42.7, 37]];
place(36.7, [-0.1, zOf(54)], STREET(54), 0);
expr(36.7, "shocked", { eye: 1.15, open: 0.2 }, 0); look(36.7, [0, 0.2], 0);
A(36.7, "spud", "arm", { side: "both", pose: { o: [0.32, 0.55, 0.05] }, dur: 0.3 });   // arms out for balance
A(36.7, "spud", "move", { to: [-0.1, zOf(37)], y: STREET(37), dur: 5.95, steps: 0, ease: "linear" });   // draft 2: one glide under all hops (a glide per hop tipped the body at each stop)
for (let i = 0; i < HOPS.length - 1; i++) {
  const [t0] = HOPS[i], [t1] = HOPS[i + 1];
  A(t0, "spud", "hop", { height: 1.0, count: 1, dur: r3(t1 - t0 - 0.05), quiet: true });
  sfx(r3(t1 - 0.05), "step-concrete", { gain: 0.5, reason: "he lands a floaty step on the wet cobbles" });
  A(r3(t0 + 0.4), "spud", "lean", { to: i % 2 ? 7 : -7, dur: 0.5 });
}
expr(38.3, "shocked", { eye: 1.2, open: 0.35 }, 0.15); expr(39.9, "happy", { curve: 0.8, eye: 1.1, open: 0.2 }, 0.2);
look(41.0, [-0.6, 0.0], 0.25); expr(41.0, "shocked", { eye: 1.25, open: 0.3 }, 0.15); look(41.8, [0, 0.15], 0.2);   // a look back at the water
sfx(39.95, "splash", { gain: 0.5, reason: "his foot lands in the puddle" });
sfx(36.7, "waves", { gain: 0.4, dur: 6.6, reason: "the flood surf at the bottom of the street" });
see(36.7, 43.3, ["spud.face", "street"], "13x: each step floats him a metre; the sea is at the bottom of the street");

// ================================================================ 43.3-46.7 P11 15x: a gust, one hand on the lamp post, flying like a flag
// L1 hero post at (3.2, pavement -17.66, -58): one fist at 1.52 (y -16.14), two at 1.52 and 1.66 (DESIGN E6)
const L1 = [3.2, -17.66, -58], FIST1 = [3.14, -16.14, -58], FIST2 = [3.14, -16.0, -58];
place(43.3, [2.05, -58.05], -16.2, 320);
A(43.28, "spud", "lean", { to: 80, dur: 0.01, ease: "linear" });
A(43.28, "spud", "arm", { side: "L", pose: { world: FIST1 }, dur: 0.01, sync: true });
grip(43.28, "L", "hold", 0.01);
A(43.28, "spud", "arm", { side: "R", pose: { o: [0.25, 0.75, 0.1] }, dur: 0.01, sync: true });
expr(43.3, "terrified", { eye: 1.3, open: 0.4 }, 0); look(43.3, [0.3, 0.1], 0);
for (let k = 0; k < 6; k++) A(r3(43.4 + k * 0.55), "spud", "lean", { to: k % 2 ? 84 : 76, dur: 0.5 });   // the gust shakes him
A(44.0, "spud", "arm", { side: "R", pose: { o: [0.35, 0.95, 0.15] }, dur: 0.4 });
A(45.1, "spud", "arm", { side: "R", pose: { o: [0.2, 0.6, 0.05] }, dur: 0.5 });
sfx(43.3, "ai/storm-wind", { gain: 0.9, dur: 3.4, reason: "the gust roaring down the street" });
sfx(43.35, "ai/storm-wind", { gain: 0.6, dur: 3.3, reason: "wind whipping round the lamp post" });
sfx(44.4, "ai/rain-car-roof", { gain: 0.3, dur: 2.3, reason: "rain slapping the cobbles in the gust" });
see(43.3, 46.7, ["spud.face", "street"], "15x: a gust; one hand on the lamp post, his body blown out like a flag");

// ================================================================ 46.7-50.0 P12 16x: the rain hangs still, both hands on the post
place(46.7, [2.93, -58.0], -17.41, 55);   // draft 2: 90 put his face 103 deg off P12/P13; at 35 his right arm crossed his chest to the post
A(46.68, "spud", "lean", { to: 0, dur: 0.01, ease: "linear" });
A(46.68, "spud", "arm", { side: "L", pose: { world: FIST2 }, dur: 0.01, sync: true });
A(46.68, "spud", "arm", { side: "R", pose: { world: FIST1 }, dur: 0.01, sync: true });
grip(46.68, "R", "hold", 0.01); grip(46.68, "L", "hold", 0.01);
expr(46.7, "terrified", { eye: 1.2, open: 0.15 }, 0); look(46.7, [-0.4, 0.1], 0);
look(47.6, [-0.5, 0.3], 0.4); look(48.8, [-0.2, -0.2], 0.4);              // the drops hanging round him
A(47.4, "spud", "squash", { amount: 0.04, dur: 0.4 });
sfx(47.6, "ai/storm-wind", { gain: 0.15, dur: 2.4, reason: "the wind dies; the street goes quiet" });
see(46.7, 50.0, ["spud.face", "rain"], "16x: the raindrops hang still around him; both hands on the post, the sea at the street end");

// ================================================================ 50.0-55.0 P13 17x: the rain falls up, the sea lifts off, his fingers slip
expr(50.0, "terrified", { eye: 1.3, open: 0.3 }, 0.12); look(50.0, [-0.3, 0.6], 0.2);
A(50.6, "spud", "fly", { to: { x: 2.93, y: -17.25, z: -58 }, dur: 1.6, ease: "inOut" });   // his toes lift
A(52.2, "spud", "arm", { side: "L", pose: { o: [0.25, 1.0, 0.1] }, dur: 0.3, ease: "out" }); grip(52.2, "L", "open", 0.1);
A(52.6, "spud", "arm", { side: "R", pose: { o: [0.3, 1.0, 0.15] }, dur: 0.3, ease: "out" }); grip(52.6, "R", "open", 0.1);
flyTo(52.62, [1.9, -14.4, -57.4], 2.4, "out");
A(52.7, "spud", "lean", { to: -18, dur: 1.2 });
expr(52.6, "terrified", { eye: 1.4, open: 0.5 }, 0.08);
for (let k = 0; k < 4; k++) A(r3(53.0 + k * 0.5), "spud", "arm", { side: "both", pose: k % 2 ? { o: [0.34, 1.0, 0.0] } : "shrug", dur: 0.45 });   // flailing
sfx(50.0, "ai/water-leak-hiss", { gain: 0.35, dur: 5, reason: "water peeling off the street and rising" });
sfx(51.0, "bubbling", { gain: 0.3, dur: 4, reason: "the sea's surface lifting off in blobs" });
sfx(52.2, "ai/fingertip-catch", { gain: 0.6, reason: "his upper hand slips off the iron" });
sfx(52.6, "ai/fingertip-catch", { gain: 0.6, reason: "the lower hand slips" });
sfx(52.7, "ai/surface-gasp", { gain: 0.6, reason: "he gasps as he floats away" });
see(50.0, 55.0, ["spud.face", "rain", "blobs"], "17x: rain falls upward, the sea lifts off in blobs, his fingers slip off the post");

// ================================================================ 55.0-60.0 P14 18.5x: high over Quito, the horizon curving
// world HI: he rides up with the camera, 7 m in front of it, a little above the frame's middle (DESIGN G: face y ~780)
const hiSpud = (a) => { const C = hiCam(a), q = C.pitch - (15 * Math.PI) / 180, D = 7;   /* draft 0: 3.6 deg put him on the bottom edge; nearer than 7 m the near plane (4) cuts him */ return [C.pos[0], C.pos[1] - D * Math.sin(q) - 0.45, C.pos[2] - D * Math.cos(q)]; };
const H0 = hiSpud(0), H1 = hiSpud(1);
flyTo(54.98, H0, 0.01, "linear");
A(54.98, "spud", "turn", { to: 0, dur: 0.01, ease: "linear", sync: true });
A(54.98, "spud", "lean", { to: 0, dur: 0.01, ease: "linear" });
flyTo(55.0, H1, 5.0, "linear");
expr(55.0, "shocked", { eye: 1.3, open: 0.4 }, 0); look(55.0, [0, -0.5], 0); look(56.5, [0.4, -0.3], 0.4); look(58.0, [0, 0.2], 0.3);
for (let k = 0; k < 5; k++) A(r3(55.0 + k * 1.0), "spud", "arm", { side: "both", pose: k % 2 ? { o: [0.34, 1.0, 0.0] } : "shrug", dur: 0.9 });
sfx(55.0, "ai/storm-wind", { gain: 0.3, dur: 5, reason: "high thin wind as he rises through the air" });
see(55.0, 60.0, ["spud.face", "high"], "18.5x: Spud floats high over Quito; the horizon curves");

// ================================================================ 60.0-76.1 P15-P17 space: oceans + air peel off, the poles squash, the disc
const SH = 1.0;   // Spud's height in metres at scale 1 (characters/potatobrawl/spud.json "height" .88 + legs)
const spaceAt = (t, [lx, ly], tall, face, drift = [0, 0]) => {
  const s = tall / SH;
  A(r3(t - 0.02), "spud", "grow", { to: r3(s), dur: 0.01, ease: "linear" });
  flyTo(t - 0.02, [SP[0] + lx, ly - tall / 2, 0], 0.01, "linear");
  A(r3(t - 0.02), "spud", "turn", { to: face, dur: 0.01, ease: "linear", sync: true });
  return (t1) => flyTo(t, [SP[0] + lx + drift[0], ly - tall / 2 + drift[1], 0], r3(t1 - t - 0.05), "inOut");
};
spaceAt(60.0, [69.245, -178.884], 95.212, 180, [-6, 8])(66.0);
spaceAt(66.0, [41.857, -198.819], 99.409, 180, [-5, 6])(73.3);
spaceAt(73.3, [17.668, -335.687], 185.511, 0, [3, 6])(END);
for (let k = 0; k < 6; k++) A(r3(60.2 + k * 2.1), "spud", "arm", { side: "both", pose: k % 2 ? { o: [0.34, 1.0, 0.0] } : "shrug", dur: 1.6 });
expr(73.3, "shocked", { eye: 1.35, open: 0.5 }, 0); look(73.3, [0, 0.05], 0);
A(73.28, "spud", "arm", { side: "both", pose: "shrug", dur: 0.01, sync: true });
expr(74.8, "deadpan", { eye: 0.85 }, 0.3);                               // the punchline face: so they were right
sfx(60.0, "rumble", { gain: 0.8, dur: 6, reason: "the deep roar of the oceans leaving the planet" });
sfx(66.0, "crumble", { gain: 0.7, reason: "the crust cracks open" });
sfx(66.2, "rumble", { gain: 1.0, dur: 7, reason: "the planet grinding as the poles squash" });
for (const k of [67.3, 68.9, 70.4]) sfx(k, "thunder", { gain: 0.45, reason: "plates breaking along the cracks" });
sfx(73.3, "explosion", { gain: 0.5, dur: 2.5, reason: "the disc shedding its ring of rock" });
see(60.0, 66.0, ["earth", "spud"], "20x: oceans and air peel off the equator into a ring; tiny Spud in front");
see(66.0, 73.3, ["earth", "spud"], "22x: the poles squash, glowing cracks split the crust");
see(73.3, END, ["disc", "spud.face"], "24x: Earth is a flat disc with a ring; the flat-earthers were right");

// ---------------------------------------------------------------- shots (16 cuts; each moves, cut .1-.2 s after the action)
const beats = c.beats([
  ["P01 2.0x: the sea wall in the window, the coffee spit", 0, push(CAM.P1, 2.2, 0.05), "hook"],
  ["P02 2.7x: Quito, every valley a sea", 2.2, push(CAM.P2, 2.8, 0.08)],
  // draft 1: DESIGN P3 (the valley town) drew its drowning houses as white blocks; a second, closer P2 push until the builder fixes it
  ["P03 3.5x: the valleys drowning", 5.0, { pos: [60, 70, 260], look: [120, -230, -1500], fov: 44, near: 4, to: { pos: [50, 60, 150], look: [120, -230, -1500], fov: 38 }, dur: 4.0, ease: "linear" }],
  ["P04 4.7x: TV static, the slap", 9.0, push(CAM.P4, 2.5, 0.06)],
  ["P05 5.5x: the hurricane, the slam", 11.5, push(CAM.P5, r3(SLAM + 0.18 - 11.5), 0.08)],
  ["P05b 5.5x: 'and hit harder' (punch-in)", r3(SLAM + 0.18), punch(CAM.P5, r3(15.0 - SLAM - 0.18), 0.05, 0.85)],
  ["P06 6.5x: the strobe, the alarm, the smash", 15.0, push(CAM.P6, r3(SMASH + 0.15 - 15.0), 0.06)],
  ["P06b 6.5x: the pieces (punch-in)", r3(SMASH + 0.15), punch(CAM.P6, r3(19.0 - SMASH - 0.15), 0.04, 0.82)],
  ["P07 7.7x: crisps float, the catch", 19.0, push(CAM.P7, 2.75, 0.06)],
  ["P07b 7.7x: chewing, delighted (punch-in)", 21.75, punch(CAM.P7, 2.6, 0.05, 0.82)],
  ["P07c 7.7x: a test hop", 24.35, push(CAM.P7, r3(26.7 - 24.35), 0.04)],
  ["P08 10x: the bonk", 26.7, push(CAM.P8, 1.9, 0.05)],
  ["P08b 10x: the swinging lamp, his grin (punch-in)", 28.6, punch(CAM.P8, 2.4, 0.04, 0.85)],
  ["P09 11.3x: the dunk", 31.0, push(CAM.P9, 3.3, 0.06)],
  ["P09b 11.3x: 'Best day ever?' (punch-in)", 34.3, punch(CAM.P9, 2.4, 0.05, 0.82), "payoff"],
  ["P10 13x: floating steps", 36.7, push(CAM.P10, 3.3, 0.05)],
  ["P10b 13x: the water behind him (punch-in)", 40.0, punch(CAM.P10, 3.3, 0.05, 0.85)],
  ["P11 15x: the gust, one hand on the post", 43.3, push(CAM.P11, 3.4, 0.06)],
  ["P12 16x: the rain hangs, 'Hold on.'", 46.7, push(CAM.P12, 3.3, 0.05)],
  ["P13 17x: rain up, the sea lifts, he slips", 50.0, { ...p13(0), to: p13(1), dur: 5.0, ease: "linear" }],
  ["P14 18.5x: high over Quito", 55.0, { ...hiCam(0), to: hiCam(1), dur: 5.0, ease: "linear" }],
  ["P15 20x: oceans and air peel off", 60.0, drift(SPC.P15, 6.0, [0, 0, -25])],
  ["P16 22x: cracks, the poles squash", 66.0, drift(SPC.P16, 7.3, [0, 0, -30])],
  ["P17 24x: the flat disc, the punchline", 73.3, drift(SPC.P17, r3(END - 73.3), [0, 0, -25])],
], END);

// ---------------------------------------------------------------- the chip (DESIGN I): one key a whole second, 2.0 + 0.3 n
const CHIP = Array.from({ length: Math.floor(END) + 1 }, (_, n) => [n, Math.round((2 + 0.3 * n) * 10) / 10]);

write(import.meta.url, {
  id: "spin", title: "What if Earth spun faster every second?",
  idea: "Fact what-if 03: Earth spins faster every second (2.0x +0.3x a second): the sea climbs the Andes, storms, short days, you get lighter (crisps, a dunk), weightless at 17x you float off, the oceans and air peel off, the planet cracks into a flat disc. 'Good news: the flat-earthers were right.'",
  format: "Fact what-if (vertical, 60 s+)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic", captionLead: LEAD,
  captionBand: [300, 1360],
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 6000,
  set: { type: "spinroom", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: { gforce: { keys: CHIP, y: F.HUDY, unit: "x", warm: 10.1, hot: 17 } },
  music: { file: "score-film/spin-score.ogg", from: 0, gain: 0.75, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false },
  sound: { signature: false, sfx: 0.65, ambience: 0.05, surface: "wood", room: "livingroom", guard: true, level: -9.7 },
  creative: { length: [END, END] },
  hook: { show: ["spud", "mug", "sea"], hint: 0, what: "2.0x on the chip; through the window a wall of sea surges up the Andes valley, the sun smearing across; Spud sprays his coffee at 0.1 s" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "clock", from: 18.15, to: 18.9, checks: ["clipping", "shell", "hand-in-prop", "arm-in-prop"], reason: "the gag: his fist smashes the alarm clock flat (sclock flattens under the fist)" },
    { who: "spud", with: "crt", from: 10.4, to: 10.7, checks: ["clipping", "hand-in-prop", "arm-in-prop"], reason: "the slap: his palm on the side of the TV cabinet" },
    { who: "spud", with: "win", from: 12.3, to: 14.9, checks: ["clipping", "shell", "hand-in-prop", "arm-in-prop"], reason: "both hands on the sash pull and the sash: he slams the window shut" },
    { who: "spud", with: "ball", from: 32.6, to: 33.55, checks: ["held-high"], reason: "the dunk: the ball goes up over the rim" },
    { who: "spud", with: "spud", from: 54.9, to: 60.05, checks: ["rig-jump"], reason: "P14: he rides up with the camera at ~137 m/s (it climbs 1100 -> 1784 m in 5 s); on screen he holds still" },
    { who: "spud", with: "spud", from: 59.9, to: END, checks: ["rig-jump"], reason: "space: Spud is drawn 95-185x his size (Earth radius = 100 units), so a centimetre of hand motion measures as metres" },
    { who: "spud", with: "quilt", from: 15.0, to: 19.0, checks: ["shell", "clipping", "limb-in-prop", "costume-in-prop"], reason: "P6: he sits on the sofa under the quilt (the quilt lies over the seat and his lap)" },
    { who: "spud", with: "spud", from: 13.55, to: 14.2, checks: ["foot-slide", "rig-jump"], reason: "the gag: the slamming sash drags him 40 cm along the floor in 0.2 s; his feet slide with it, his hands ride the sash" },
    { who: "spud", with: "spud", from: 46.6, to: 55.0, checks: ["payoff-face"], reason: "P12/P13: both hands on the post at his side, his face in 3/4 profile (~68 deg) toward it, both eyes in view; turning further puts his right arm through his chest" },
    { who: "spud", with: "street", from: 31.0, to: 55.0, checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "arm-in-prop"], reason: "the street is the whole Quito street as one prop: its ground and lamp post are what he stands on and holds" },
  ],
  notes: "Generated by storyboards/series/facts/03-spin/make-spin.mjs.",
});
