// YOU WAKE UP MID, EP01: PLANE CRASH (pilot, 11 Nov 2026), from the clip template.
//   node storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs            -> wake-up-mid-plane-crash-a.json (safe)
//   VARIANT=B node storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs  -> wake-up-mid-plane-crash-b.json (too close)
// Brief: /mnt/project-files/video-scripts/2026-11-11-you-wake-up-mid/01-mid-plane-crash-IMAGE-PROMPT.md (outline v3) and
// Jonny's two panel sheets in panels-01-mid-plane-crash/ (the target; PANELS.md beside this file has the numbers, the
// story chain and the departures). NOTES.md is the working memory.
//
// THE BRIEF
//   Story:       you wake up in a crashing airliner and the narrator (voice 1) leads you through the real moves:
//                mask first (30 s), count the rows to the exit (seven), brace, leave everything (90 s), stay low and
//                count the rows in the smoke, get upwind and far away. Each move's payoff is on screen.
//   Wants:       Spud wants to live. Viking (helps others first, then saves his suitcase) and the Wizard (films instead
//                of bracing) show the wrong moves.
//   Consequence: A: far enough when the wreck blows up, alive. B: he stops to look back, the blast reaches him.
//   Ending:      he shuts his eyes and wakes up at the wheel of a car flying off a bridge (the series loop).
//   Callback:    the last shot is the first shot again: eyes snapping open, the mask still round his neck.
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { ridePath } from "../../../../engine/page/set-snowslope.js";

const VARIANT = process.env.VARIANT === "B" ? "B" : "A";
const SAFE = VARIANT === "A";
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1120 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
const MUSIC = { style: "march", lowCut: 150, gain: 0.3 };

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- the timeline (s)
// Each narrator line is as long as voice 1 reads it (out/speech, measured 11 Nov): the shots are cut to the lines.
const DUR = { wake: 4.13, mask: 4.48, count: 3.2, brace: 4.28, why: 1.33, ninety: 3.79, low: 4.68, upwind: 3.55, alive: 2.07, early: 1.8, car: 2.65 };
const T = {
  mask: 3.2,       // the masks drop: 30 s clock
  count: 8.9,      // he counts the rows to the exit
  brace: 12.3,     // trees in the windows: belt, head down
  plough: 16.7,    // outside: the plane ploughs through the forest
  impact: 18.2,    // inside at the same moment
  smoke: 20.4,     // stopped: 90 s clock, Viking and his suitcase
  crawl: 24.4,     // under the smoke, counting seat frames
  exit: 27.4,      // the seventh row: the EXIT sign
  slide: 29.2,     // outside: down the slide
  far: 31.7,       // the last seconds of the clock
  boom: 33.1,      // 0:00
  car: SAFE ? 36.5 : 35.5,
};
T.end = r3(T.car + 3.0);

// ---------------------------------------------------------------- the cabin (briefs/T1-cabin.md): x right, z = the nose
const AX = 2.09, BX = 1.03, PITCH = 1.35;                 // window seat A, aisle seat B (port side), the row pitch
const SEAT = 0.3;                                          // a sitter's body y on a seat (cushion top 0.42)
const OH_Y = 2.35;                                         // the bins' underside
const PARK = -40;                                          // a prop out of the shot: far under the snow
const rowZ = (k) => r3(k * PITCH);
// prop keys the builders chose (their usage headers): one place to rename them
const KEY = { view: "feed", lights: "level", masks: "drop", bins: "lid", door: "open", sign: "fill", fill: "fill", fire: "fire", brk: "broken", inflate: "on" };
const key = (k, v) => ({ [KEY[k]]: v });

// the outside (set snowslope): the wreck at the origin with its nose toward -x, its port side (door, slide) toward +z
const DOOR = [-12, 1.475, 2.1];                             // the sill (T3's WRECK.door turned into the world)
const SLIDE_END = [-12, 0, 7.1];
const CAR = [-300, 80, 0];                                 // the bridge's broken edge, high and far from the valley

// ---------------------------------------------------------------- cameras (pos, look, fov), one per panel
// A potato is about 1 m wide and the frame is tall: two of them side by side need a wide lens or a long way back.
const HALL_Z0 = 0.65;                                      // shot 1 only: the cabin sits 0.65 m forward, so a window is beside his face, not behind his head
const CAM = {
  wake: { pos: [1.05, 0.98, 2.9], look: [2.42, 1.15, 0.55], fov: 52, to: { pos: [1.15, 0.98, 2.6] }, dur: 3.0, ease: "out" },    // 01
  masks: { pos: [1.56, 1.75, 3.55], look: [1.56, 0.95, 0.4], fov: 48 },                                                        // 02
  count: { pos: [1.75, 1.9, -1.3], look: [1.35, 0.38, 6.7], fov: 50 },                                                          // 03
  brace: { pos: [-0.48, 1.0, 0.7], look: [2.09, 0.85, 0.75], fov: 74 },                                                        // 04
  plough: { pos: [22, 12, 34], look: [60, 17, 0], fov: 40, to: { look: [42, 8, 0] }, dur: 1.5, ease: "linear" },                 // 05
  impact: { pos: [-0.48, 1.1, 0.65], look: [2.09, 1.05, 1.0], fov: 76 },                                                         // 06
  smoke: { pos: [0.25, 1.05, 6.4], look: [-0.31, 0.28, 1.5], fov: 46, roll: 4 },                                                // 07
  crawl: { pos: [0, 0.3, 10.4], look: [0, 1.29, 5.4], fov: 40 },                                                                // 08
  exit: { pos: [-0.3, 0.45, 6.4], look: [0.05, 1.45, 10.44], fov: 46 },                                                         // 08 reverse: the payoff of "seven"
  slide: { pos: [-14, 1.2, 20], look: [-14.2, 0.85, 10], fov: 38 },                                                             // 09
  safe: { pos: [-103, 0.7, 13.0], look: [0, -0.5, 0.4], fov: 34 },                                                               // 10
  close: { pos: [-26.8, 0.75, 9.7], look: [-15, 3.2, 5], fov: 40 },                                                             // 11
  car: { rig: "car", pos: [0.9, 1.75, 5.2], look: [0.45, 1.2, 0.3], fov: 30 },                                                  // 12
};
// a world point in output pixels for a hand-set camera (text pops over a row or a hand)
function project(cam, p, W = 1080, H = 1920) {
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const f = norm(sub(cam.look, cam.pos)), rt = norm(cross(f, [0, 1, 0])), up = cross(rt, f), d = sub(p, cam.pos);
  const z = dot(d, f), k = H / 2 / Math.tan(rad(cam.fov / 2));
  return [Math.round(W / 2 + (dot(d, rt) / z) * k), Math.round(H / 2 - (dot(d, up) / z) * k)];
}

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [AX, 0.03], face: 0, expr: "serene", follow: 0.3, seed: 2.9 },
  { id: "vik", character: "elevator/viking", at: [BX, 0.03], face: 0, expr: "kind", follow: 0.3, seed: 3.3 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [AX, PITCH], face: 180, expr: "eager", follow: 0.3, seed: 2.6 },
  // the same Spud at the wheel of the car (the last shot): the car is 300 m from the valley, so he is never in the other shots
  { id: "spud2", character: "potatobrawl/spud", rig: "car", at: [0.55, 0.23], face: "camera", expr: "serene", follow: 0.25, shadowFall: 0.001, seed: 2.9 },
];

// ---------------------------------------------------------------- props
const MASK_UP = (x) => ({ x, y: r3(OH_Y + 0.07), z: 0.4 });
const anchor = (x, z = 0.4) => [x, r3(OH_Y - 0.01), z];
const SEATSPEC = { kind: "planeseat", w: 0.96, arms: "both", color: "#2f4d8c", cover: 0.34 };
// the port seats of rows 0-2 are real props: a camera that sits in a row looks through where they stand, so they park per shot
const FRONT_SEATS = ["seatA1", "seatW", "seatA2", "seatB2"];
const TRUNK = { x: -1.3, y: 2.56, z: 2.7 };               // Viking's suitcase, in the starboard bin over row 2
const props = [
  { id: "hall", kind: "cabinhall", x: 0, y: 0, z: HALL_Z0, clear: [0], omit: [[0, "A"], [0, "B"], [1, "A"], [1, "B"], [2, "A"], [2, "B"]] },
  { id: "smokeP", kind: "cabinsmoke", x: 0, y: 0, z: 0, scale: 0 },   // scale 0 = off: at fill 0 it still paints the frame
  { id: "eng", kind: "enginefire", x: 4.6, y: 1.45, z: 1.6, ...key("fire", 1) },
  { id: "seatA", ...SEATSPEC, x: AX, z: 0 }, { id: "seatB", ...SEATSPEC, x: BX, z: 0 },
  { id: "seatA1", ...SEATSPEC, x: AX, y: PARK, z: PITCH }, { id: "seatW", ...SEATSPEC, x: BX, y: PARK, z: PITCH },
  { id: "seatA2", ...SEATSPEC, x: AX, y: PARK, z: r3(2 * PITCH) }, { id: "seatB2", ...SEATSPEC, x: BX, y: PARK, z: r3(2 * PITCH) },
  { id: "belt", kind: "seatbelt", x: AX, z: 0, r: 0.4 },
  { id: "maskS", kind: "oxymask", ...MASK_UP(AX), anchor: anchor(AX) },
  { id: "maskV", kind: "oxymask", ...MASK_UP(BX), anchor: anchor(BX) },
  { id: "maskW", kind: "oxymask", ...MASK_UP(AX), z: r3(PITCH + 0.4), anchor: anchor(AX, r3(PITCH + 0.4)) },
  { id: "neck", kind: "neckmask", x: AX, y: PARK, z: 0.3 },
  { id: "phone", kind: "phone", x: r3(AX - 0.12), y: PARK, z: r3(PITCH - 0.42), rot: 20, tip: -80, scale: 1.7, case: "#2a2d36" },
  { id: "trunk", kind: "suitcase", ...TRUNK, tip: 90, color: "#7a4a25", rib: "#5c3518", scale: 1.5 },
  { id: "bag1", kind: "duffel", x: 1.5, y: 2.56, z: 0.4, color: "#3a8f6a" },
  { id: "bag2", kind: "suitcase", x: 1.6, y: 2.56, z: 1.6, tip: 90, color: "#6a4a8c" },
  { id: "bag3", kind: "backpack", x: 1.4, y: 2.56, z: 2.5, tip: 90, color: "#3b3f52" },
  // invisible carriers: a body that is not walking rides one (seats, the crawl, the throw, the slide, a drag through snow)
  { id: "spudC", kind: "carrier", x: AX, y: 0, z: 0.03 },
  { id: "vikC", kind: "carrier", x: BX, y: 0, z: 0.03 },
  { id: "wizC", kind: "carrier", x: AX, y: 0, z: PITCH },
  { id: "handC", kind: "carrier", x: 0, y: PARK, z: 0 },
  // the outside
  { id: "jet", kind: "jetwreck", x: 0, y: PARK - 30, z: 0, rot: -90, ...key("fire", 1), ...key("brk", 1) },
  { id: "plume", kind: "snowfront", run: 0.5, scale: 0.55, firs: true },
  { id: "slideP", kind: "evacslide", x: DOOR[0], y: PARK - 30, z: DOOR[2], rot: -90, h: DOOR[1], len: 5.0, ...key("inflate", 1) },
  { id: "blast", kind: "carburst", x: 0, y: 3, z: 0, at: T.boom, r: SAFE ? 11 : 16 },
  ...(SAFE ? [] : [{ id: "blast2", kind: "carburst", x: -15, y: 2, z: 7, at: r3(T.boom + 0.3), r: 9 }]),
  // the car shot
  { id: "bridge", kind: "bridgeend", x: CAR[0], y: CAR[1], z: CAR[2], at: r3(T.car - 0.3) },
  { id: "valley", kind: "stormsky", src: "assets/plates/valley-vista-sun.png", h: 170, x: CAR[0], y: r3(CAR[1] - 20), z: r3(CAR[2] - 90), glow: 1 },
  { id: "seat-drv", kind: "carseat", rig: "car", x: 0.55, y: 0.12, z: 0.2, color: "#59535f", trim: "#6e6875", width: 0.86 },
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.62, z: 0.7, tip: 34 },
  { id: "neck2", kind: "neckmask", rig: "car", x: 0.55, y: 0.68, z: 0.44, tip: -50 },
];
const P = Object.fromEntries(props.map((p) => [p.id, p]));
const rigs = [{ id: "car", kind: "hatchback", color: "#c8372d", pivot: [0, 0.5, 0], keys: [
  { at: 0, pos: [CAR[0], CAR[1] + 0.6, CAR[2] + 3.2], yaw: 0, pitch: 3, roll: 0 },
  { at: T.car, pos: [CAR[0], CAR[1] + 0.6, CAR[2] + 3.2], yaw: 0, pitch: 3, roll: 0 },
  { at: T.end, pos: [CAR[0] + 0.3, CAR[1] - 0.9, CAR[2] + 9.5], yaw: 3, pitch: 16, roll: -5 },
] }];

// ---------------------------------------------------------------- helpers
const both = (t, who, pose, dur, ease) => { for (const s of ["R", "L"]) c.arm(t, who, s, typeof pose === "function" ? pose(s) : pose, dur, ease); };
const shake = (t, amp, dur = 0.35) => c.at(t, { fx: "shake", amp, dur });
const cut = (t) => r3(t - 0.02);                           // a cut cheat lands a frame before its cut
const seatOn = (t, who, x, z, yaw = 0, y = SEAT) => { prop(cut(t), `${who}C`, { x, y: 0, z, rot: yaw }, 0, "linear"); A(cut(t), who, "ride", { prop: `${who}C`, off: [0, y, 0], yaw: 0, sit: true, dur: 0 }); };
const standOn = (t, who, x, z, yaw = 0, y = 0) => { prop(cut(t), `${who}C`, { x, y, z, rot: yaw }, 0, "linear"); A(cut(t), who, "ride", { prop: `${who}C`, off: [0, 0, 0], yaw: 0, dur: 0 }); };
const park = (t, ...ids) => { for (const id of ids) prop(cut(t), id, { y: id === "jet" || id === "slideP" ? PARK - 30 : PARK }, 0, "linear"); };
// the narrator (voice 1, the deep storyteller) and his subtitle chunks [[from, to, text], ...]
const SUBY = 1120;
const narr = (t, line, dur, chunks, y = SUBY) => {
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
  const n = chunks.reduce((k, x) => k + x.length, 0); let a = t;
  chunks.forEach((text, i) => { const b = i === chunks.length - 1 ? t + dur + 0.25 : a + (dur * text.length) / n; c.cap(r3(a), r3(b), text, Array.isArray(y) ? y[i] : y, false, SUB_STYLE); a = b; });
};
// an on-screen clock in the lower left corner, counting down one second per second from `from` (seconds)
const clock = (t0, t1, from) => { for (let k = 0; t0 + k < t1 - 1e-6; k++) { const s = Math.max(0, from - k); c.cap(r3(t0 + k), r3(Math.min(t1, t0 + k + 1)), `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, 1265, false, { x: 205, size: 92, kinetic: false }); } };
const num = (t, cam, p, text, o = {}) => c.at(t, { fx: "pop", text, xy: project(cam, p), size: 110, dur: 0.3, angle: 0, color: "#ffffff", ...o });

// ================================================================ 1 WAKE 0-3.0 (panel 01)
for (const w of ["spud", "vik"]) A(0, w, "ride", { prop: `${w}C`, off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
A(0, "wiz", "ride", { prop: "wizC", off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
both(0, "spud", "lap", 0); both(0, "vik", "lap", 0); both(0, "wiz", "lap", 0);
A(0, "wiz", "hide");                                       // the camera sits in his row until the count
A(0, "spud", "expr", { expr: "serene", dur: 0 }); A(0, "spud", "droop", { to: 0.6, dur: 0 });
prop(0, "eng", key("fire", 1), 0, "linear");   // a key in the spec does not start it: keys are set by a tween
sfx(0, "impact", { gain: 0.9, loud: true, reason: "frame 0: the bang that wakes him (the left engine blows)" });
sfx(0, "rumble", { gain: 0.3, dur: r3(T.plough - 0.05), reason: "the cabin's engine rumble bed, to the crash" });
sfx(0.05, "flamejet", { gain: 0.35, dur: 2.9, reason: "the engine burning outside his window" });
shake(0, 0.06, 0.45); shake(1.25, 0.035); shake(2.3, 0.04);
A(0.1, "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.08 }); A(0.1, "spud", "droop", { to: 0, dur: 0.1 });
A(0.1, "spud", "squash", { amount: 0.12, dur: 0.25 });
both(0.16, "spud", () => ({ o: [0.3, 0.6, 0.3] }), 0.22, "out");
A(0.45, "spud", "look", { to: [0.9, 0.15], dur: 0.14, blink: false });
c.at(0.5, { fx: "sweat", who: "spud", dur: 0.9, count: 4 });
A(1.55, "spud", "look", { to: [0, 0.05], dur: 0.16, blink: false }); A(1.6, "spud", "expr", { expr: "terrified", set: { open: 0.75 }, dur: 0.12 });
A(2.35, "spud", "look", { to: [0.9, 0.1], dur: 0.14, blink: false });
A(0, "vik", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0 }); A(0.2, "vik", "look", { to: [0.9, 0.2], dur: 0.2 });
narr(0.05, "You wake up mid plane crash. Here is how you live.", DUR.wake, ["You wake up", "mid plane crash.", "Here is how you live."], [1290, 1290, 1120]);
see(0, 1.2, ["spud.face", "eng"], "frame 0: his eyes snap open and the engine burns in his window");

// ================================================================ 2 MASK FIRST 3.0-8.0 (panel 02)
const FACE_S = [AX, 0.81, 0.45], FACE_V = [1.17, 0.82, 0.46];   // where a mask cup sits on each seated face (peek)
const HANG = 1.55;
prop(cut(T.mask), "hall", { z: 0 }, 0, "linear");
sfx(T.mask, "latch", { gain: 0.6, reason: "the mask doors drop open" });
prop(T.mask, "hall", key("masks", 1), 0.3, "out");
for (const id of ["maskS", "maskV"]) { prop(T.mask, id, { y: HANG }, 0.3, "out"); prop(T.mask + 0.3, id, { tilt: 9 }, 0.2, "out"); prop(T.mask + 0.5, id, { tilt: -6 }, 0.3); prop(T.mask + 0.8, id, { tilt: 0 }, 0.35); }
clock(r3(T.mask + 0.2), T.count, 30);
for (let k = 0; k < 6; k++) sfx(r3(T.mask + 0.2 + k), "timer-beep", { gain: 0.3, reason: "the 30 s clock ticks" });
both(T.mask - 0.3, "spud", "lap", 0.25);
// Viking helps the row in front first, goes dizzy and slumps
A(T.mask + 0.1, "vik", "look", { to: [0.2, 0.35], dur: 0.15, blink: false });
c.arm(T.mask + 0.25, "vik", "R", { world: [r3(BX - 0.3), 1.05, 0.9] }, 0.4, "out");
A(T.mask + 0.3, "vik", "expr", { expr: "kind", set: { open: 0.2 }, dur: 0.2 });
A(T.mask + 1.1, "vik", "expr", { expr: "dizzy", dur: 0.35 }); A(T.mask + 1.1, "vik", "lean", { to: 7, dur: 0.4 }); A(T.mask + 1.5, "vik", "lean", { to: -6, dur: 0.4 });
A(T.mask + 1.9, "vik", "expr", { expr: "serene", set: { open: 0.12 }, dur: 0.25 }); A(T.mask + 1.9, "vik", "lean", { to: -13, dur: 0.45, ease: "in" }); A(T.mask + 1.9, "vik", "pitch", { to: 10, dur: 0.45, ease: "in" });
c.arm(T.mask + 1.9, "vik", "R", "rest", 0.4);
// Spud: his own mask first
A(T.mask + 0.2, "spud", "look", { to: [0, 0.7], dur: 0.14, blink: false });
both(T.mask + 0.45, "spud", (s) => ({ world: [r3(AX + (s === "R" ? -0.1 : 0.1)), HANG, 0.42] }), 0.3, "out");
prop(T.mask + 0.85, "maskS", { x: FACE_S[0], y: FACE_S[1], z: FACE_S[2], tilt: 0 }, 0.3, "inOut");
both(T.mask + 0.85, "spud", (s) => ({ world: [r3(FACE_S[0] + (s === "R" ? -0.17 : 0.17)), r3(FACE_S[1] - 0.08), r3(FACE_S[2] - 0.02)] }), 0.3, "inOut");
A(T.mask + 0.9, "spud", "look", { to: [0, 0], dur: 0.2, blink: false }); A(T.mask + 0.9, "spud", "expr", { expr: "focused", dur: 0.2 });
A(T.mask + 1.2, "spud", "grab", { prop: "maskS", hand: "hat", keep: true });
A(T.mask + 1.3, "spud", "squash", { amount: 0.05, dur: 0.5 });
both(T.mask + 1.9, "spud", "lap", 0.35, "inOut");
// then the friend's
A(T.mask + 2.1, "spud", "look", { to: [-0.9, 0.1], dur: 0.15, blink: false }); A(T.mask + 2.25, "spud", "expr", { expr: "shocked", set: { open: 0 }, dur: 0.12 });
c.arm(T.mask + 2.45, "spud", "R", { world: [r3(BX + 0.12), HANG, 0.42] }, 0.4, "out");
prop(T.mask + 2.9, "maskV", { x: FACE_V[0], y: FACE_V[1], z: FACE_V[2], tilt: 0 }, 0.35, "inOut");
c.arm(T.mask + 2.9, "spud", "R", { world: [r3(FACE_V[0] + 0.16), r3(FACE_V[1] - 0.1), r3(FACE_V[2] + 0.02)] }, 0.35, "inOut");
A(T.mask + 3.3, "vik", "grab", { prop: "maskV", hand: "hat", keep: true });
c.arm(T.mask + 3.55, "spud", "R", "lap", 0.4, "inOut"); A(T.mask + 3.55, "spud", "expr", { expr: "focused", dur: 0.2 });
A(T.mask + 3.7, "vik", "lean", { to: 0, dur: 0.45 }); A(T.mask + 3.7, "vik", "pitch", { to: 0, dur: 0.45 }); c.arm(T.mask + 3.7, "vik", "L", "lap", 0.45);
A(T.mask + 3.95, "vik", "expr", { expr: "shocked", set: { open: 0 }, dur: 0.15 }); A(T.mask + 4.2, "vik", "look", { to: [0.8, 0], dur: 0.2 });
A(T.mask + 4.4, "spud", "look", { to: [0, 0.1], dur: 0.2 });
narr(4.3, "Mask first. Up here you have about thirty seconds before you pass out.", DUR.mask, ["Mask first.", "Up here you have about", "thirty seconds", "before you pass out."]);
see(T.mask + 0.9, T.mask + 1.9, ["spud.face", "maskS"], "his own mask goes on first");
see(T.mask + 1.9, T.mask + 3.2, ["vik.face"], "Viking, who helped others first, is out");

// ================================================================ 3 COUNT THE ROWS 8.0-11.5 (panel 03)
park(T.count, "seatA", "seatB");                           // the camera sits where their seat backs are
for (const id of FRONT_SEATS) prop(cut(T.count), id, { y: 0 }, 0, "linear");   // the rows ahead are back
A(cut(T.count), "wiz", "show"); seatOn(T.count, "wiz", AX, PITCH, 180, SEAT); prop(cut(T.count), "maskW", { y: HANG }, 0, "linear");
A(T.count, "spud", "look", { to: [-0.2, 0.2], dur: 0.15 });
c.arm(T.count + 0.3, "spud", "R", { world: [1.6, 1.45, 0.75] }, 0.35, "out"); A(T.count + 0.3, "spud", "grip", { side: "R", shape: "point", dur: 0.15 });
A(T.count + 0.2, "vik", "look", { to: [0, 0.2], dur: 0.2 });
for (let k = 1; k <= 7; k++) { const t = r3(T.count + 0.6 + 0.3 * k); num(t, CAM.count, [1.56, 1.72, rowZ(k)], String(k), { size: Math.round(150 - 12 * k) }); sfx(t, "tink", { gain: 0.3, reason: `he counts row ${k}` }); }
c.arm(T.count + 2.95, "spud", "R", "lap", 0.4, "inOut"); A(T.count + 2.95, "spud", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
narr(T.count + 0.1, "Count the rows to the exit. Seven.", DUR.count, ["Count the rows", "to the exit.", "Seven."]);

// ================================================================ 4 BRACE 11.5-15.0 (panel 04)
prop(cut(T.brace), "seatA", { y: 0 }, 0, "linear");        // his own seat is back; Viking's stays out: the camera looks from there
A(cut(T.brace), "vik", "hide"); A(cut(T.brace), "vik", "release", { prop: "maskV", to: [BX, r3(OH_Y + 0.07), 0.4], dur: 0 });
A(cut(T.brace), "spud", "release", { prop: "maskS", to: [AX, r3(OH_Y + 0.07), 0.4], dur: 0 });   // down here he needs no mask: it hangs round his neck from now on
prop(cut(T.brace), "neck", { x: AX, y: 0.52, z: 0.4, tip: -50 }, 0, "linear");
A(T.brace, "spud", "grab", { prop: "neck", hand: "hat", keep: true });
prop(T.brace - 0.3, "hall", key("view", 1), 0.3);
seatOn(T.brace, "wiz", AX, r3(PITCH + 0.1), -90, 0.44); park(T.brace, "seatW");   // he kneels on his seat facing the aisle, filming himself; the aisle seat of row 1 stands between the camera and him
prop(cut(T.brace), "phone", { x: r3(AX - 0.52), y: 1.5, z: r3(PITCH + 0.02), rot: 90, tip: 0 }, 0, "linear");
c.arm(cut(T.brace), "wiz", "R", { prop: "phone", grip: [0, 0.07, 0] }, 0); A(cut(T.brace), "wiz", "grip", { side: "R", shape: "hold", dur: 0 });
A(T.brace, "wiz", "expr", { expr: "happy", set: { open: 0.35 }, dur: 0 }); A(T.brace, "wiz", "look", { to: [0, 0.25], dur: 0, blink: false });
A(T.brace, "spud", "look", { to: [0, -0.3], dur: 0.15 }); A(T.brace, "spud", "expr", { expr: "focused", dur: 0.15 });
both(T.brace + 0.15, "spud", (s) => ({ o: [-0.02, 0.22, 0.3] }), 0.3, "inOut");
sfx(T.brace + 0.5, "click", { gain: 0.5, reason: "the belt pulled tight" });
A(T.brace + 0.5, "spud", "squash", { amount: 0.06, dur: 0.25 });
A(T.brace + 1.9, "spud", "pitch", { to: 48, dur: 0.5, ease: "inOut" });
both(T.brace + 1.9, "spud", (s) => ({ world: [r3(AX + (s === "R" ? -0.2 : 0.2)), 1.02, 0.84] }), 0.5, "inOut");
c.still(T.brace + 2.5, "spud", 1.8, 0.05);
shake(T.brace + 0.9, 0.03); shake(T.brace + 1.9, 0.045); shake(T.brace + 3.0, 0.06, 0.5); shake(T.brace + 3.9, 0.08, 0.45);
sfx(T.brace + 2.6, "windswell", { gain: 0.5, dur: 1.8, reason: "the treetops rushing past the windows" });
A(T.brace + 3.7, "wiz", "expr", { expr: "shocked", set: { open: 0.5 }, dur: 0.15 }); A(T.brace + 3.7, "wiz", "look", { to: [0.6, 0.2], dur: 0.12, blink: false });
narr(T.brace + 0.1, "Belt low and tight. Head down. Brace.", DUR.brace, ["Belt low and tight.", "Head down.", "Brace."], 1250);
see(T.brace + 2.5, T.brace + 4.2, ["spud", "wiz.face", "phone"], "the brace position, and the Wizard filming bolt upright");

// ================================================================ 5 THE PLOUGH 15.0-16.6 (panel 05)
const jetAt = (u) => { const q = ridePath(u); return { x: r3(q.at[0]), y: r3(q.at[1]), z: r3(q.at[2]), tip: r3(q.pitch) }; };
const U0 = 0.5, U1 = 0.76, PL = T.impact - T.plough;
prop(cut(T.plough), "jet", { ...jetAt(U0), ...key("brk", 1), ...key("fire", 1) }, 0, "linear"); prop(cut(T.plough), "plume", { run: U0 }, 0, "linear");
for (let k = 0; k < 4; k++) { const a = U0 + ((U1 - U0) * (k + 1)) / 4; prop(r3(T.plough + (PL * k) / 4), "jet", jetAt(a), r3(PL / 4), "linear"); prop(r3(T.plough + (PL * k) / 4), "plume", { run: r3(a) }, r3(PL / 4), "linear"); }
shake(T.plough, 0.05, 1.5);
sfx(T.plough, "slam", { gain: 0.95, loud: true, reason: "the belly hits the forest" });
sfx(T.plough + 0.05, "rumble", { gain: 0.8, dur: 3.6, reason: "the plane ploughing through snow and trees" });
sfx(T.plough + 0.5, "crumble", { gain: 0.6, reason: "trees snapping" }); sfx(T.plough + 1.0, "crumble", { gain: 0.6, reason: "trees snapping" });

// ================================================================ 6 IMPACT INSIDE 16.6-19.0 (panel 06)
prop(cut(T.impact), "maskW", { y: r3(OH_Y + 0.07) }, 0, "linear");
prop(T.impact + 0.05, "hall", key("bins", 1), 0.15, "out");
shake(T.impact, 0.1, 0.6); shake(T.impact + 0.75, 0.07, 0.4); shake(T.impact + 1.35, 0.04, 0.4);
sfx(T.impact, "impact", { gain: 0.9, loud: true, reason: "the cabin slams through the trees" });
sfx(T.impact + 0.08, "kenney/impact-plank-medium", { gain: 0.6, reason: "the bins burst open" });
c.drop(T.impact + 0.1, "bag1", { v: [-0.6, -0.5, 4.5], spin: [3, 1, 2] }); c.drop(T.impact + 0.16, "bag2", { v: [-0.9, -0.3, 5], spin: [2, 4, 1] }); c.drop(T.impact + 0.22, "bag3", { v: [-0.5, 0, 4], spin: [5, 1, 3] });
A(T.impact + 0.02, "spud", "squash", { amount: 0.14, dur: 0.3 }); A(T.impact + 0.77, "spud", "squash", { amount: 0.1, dur: 0.3 });
// the Wizard, upright and unbelted, goes over the seat in front; his phone flies
c.throw(T.impact + 0.04, "phone", { v: [-0.7, 2.4, 3.2], spin: [9, 3, 6] });
A(T.impact + 0.02, "wiz", "expr", { expr: "terrified", set: { open: 0.8 }, dur: 0.06 }); both(T.impact + 0.04, "wiz", () => ({ o: [0.36, 0.55, 0.3] }), 0.12, "out");
prop(T.impact + 0.04, "wizC", { z: r3(PITCH + 0.42) }, 0.16, "linear"); A(T.impact + 0.04, "wiz", "lean", { to: -32, dur: 0.16, ease: "linear" });
sfx(T.impact + 0.2, "thud-soft", { gain: 0.7, reason: "the Wizard slams into the seat in front" });
A(T.impact + 0.2, "wiz", "squash", { amount: 0.16, dur: 0.3 });
prop(T.impact + 0.22, "wizC", { z: r3(PITCH + 0.3) }, 0.4, "out"); A(T.impact + 0.22, "wiz", "lean", { to: 14, dur: 0.5, ease: "inOut" }); A(T.impact + 0.22, "wiz", "pitch", { to: 16, dur: 0.5, ease: "inOut" });
A(T.impact + 0.5, "wiz", "expr", { expr: "dizzy", dur: 0.2 }); both(T.impact + 0.5, "wiz", "rest", 0.3);
prop(T.impact + 1.2, "hall", key("lights", 0.15), 0.06); prop(T.impact + 1.3, "hall", key("lights", 0.8), 0.06); prop(T.impact + 1.42, "hall", key("lights", 0.2), 0.1);
prop(T.impact + 1.5, "hall", key("view", 2), 0.4);
A(T.impact + 1.6, "spud", "pitch", { to: 0, dur: 0.5, ease: "inOut" }); both(T.impact + 1.6, "spud", "lap", 0.5, "inOut");
A(T.impact + 1.9, "spud", "expr", { expr: "shocked", set: { open: 0.15 }, dur: 0.2 }); A(T.impact + 2.0, "spud", "look", { to: [0.7, 0.3], dur: 0.2 });
narr(T.impact + 0.6, "This is why you brace.", DUR.why, ["This is why you brace."], 1250);
see(T.impact, T.impact + 1.0, ["spud", "wiz"], "he is braced and unhurt; the Wizard flies");

// ================================================================ 7 LEAVE EVERYTHING 19.0-23.0 (panel 07)
park(T.smoke, "belt");
prop(cut(T.smoke), "seatB", { y: 0 }, 0, "linear"); prop(cut(T.smoke), "seatW", { y: 0 }, 0, "linear");
A(cut(T.smoke), "vik", "show");
standOn(T.smoke, "spud", 0.32, 0.9, 0); standOn(T.smoke, "vik", -0.3, 2.9, -55);
A(cut(T.smoke), "spud", "pitch", { to: 0, dur: 0 }); A(cut(T.smoke), "vik", "pitch", { to: 0, dur: 0 }); A(cut(T.smoke), "vik", "lean", { to: 0, dur: 0 });
prop(cut(T.smoke), "smokeP", { scale: 1, ...key("fill", 0.2), ...key("fire", 0.5) }, 0, "linear");
prop(T.smoke, "smokeP", { ...key("fill", 0.55), ...key("fire", 0.85) }, r3(T.crawl - T.smoke - 0.1), "linear");
sfx(T.smoke, "flamejet", { gain: 0.3, dur: r3(T.slide - T.smoke - 0.1), reason: "fire at the back of the cabin" });
clock(r3(T.smoke + 0.15), T.crawl, 90);
// Viking hauls his suitcase out of the bin and fills the aisle with it
both(cut(T.smoke), "vik", (s) => ({ world: [-0.95, 1.7, r3(2.9 + (s === "R" ? -0.26 : 0.26))] }), 0);
A(T.smoke, "vik", "expr", { expr: "focused", dur: 0 }); A(T.smoke, "vik", "look", { to: [-0.6, 0.7], dur: 0, blink: false });
prop(T.smoke + 0.3, "trunk", { x: -1.0, y: 1.95, z: 2.9, tip: 40 }, 0.35, "in"); prop(T.smoke + 0.65, "trunk", { x: -0.82, y: 0.78, z: 2.9, tip: 0 }, 0.4, "in");
both(T.smoke + 0.65, "vik", (s) => ({ world: [-0.82, 1.05, r3(2.9 + (s === "R" ? -0.32 : 0.32))] }), 0.4, "in");
A(T.smoke + 1.05, "vik", "squash", { amount: 0.1, dur: 0.3 }); sfx(T.smoke + 1.05, "thud-soft", { gain: 0.6, reason: "the suitcase lands in his arms" });
A(T.smoke + 1.4, "vik", "expr", { expr: "happy", set: { open: 0.15 }, dur: 0.2 }); A(T.smoke + 1.5, "vik", "look", { to: [0.5, 0], dur: 0.2 });
// Spud, stuck behind him, points past him at the exit
A(T.smoke, "spud", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0 }); A(T.smoke, "spud", "look", { to: [-0.35, 0.15], dur: 0, blink: false });
c.arm(T.smoke + 1.3, "spud", "R", { o: [0.22, 0.62, 0.42] }, 0.3, "out"); A(T.smoke + 1.3, "spud", "grip", { side: "R", shape: "point", dur: 0.15 });
A(T.smoke + 1.3, "spud", "expr", { expr: "angry", set: { open: 0.45 }, dur: 0.15 });
A(T.smoke + 2.2, "spud", "hop", { count: 2, height: 0.07, dur: 0.5 });
A(T.smoke + 3.0, "spud", "look", { to: [0, 0.8], dur: 0.15 }); A(T.smoke + 3.1, "spud", "expr", { expr: "shocked", set: { open: 0.1 }, dur: 0.15 });
c.arm(T.smoke + 3.3, "spud", "R", "rest", 0.3); A(T.smoke + 3.3, "spud", "crouch", { to: 0.6, dur: 0.4 }); A(T.smoke + 3.3, "spud", "pitch", { to: 35, dur: 0.45 });
narr(T.smoke + 0.15, "Ninety seconds to get out. Leave everything.", DUR.ninety, ["Ninety seconds", "to get out.", "Leave everything."]);
see(T.smoke + 1.0, T.smoke + 3.0, ["vik", "trunk", "spud.face"], "Viking and his suitcase fill the aisle; Spud is stuck behind him");

// ================================================================ 8 STAY LOW 23.0-27.0 (panel 08, then the reverse)
// a crawl: the body tipped forward on a carrier that slides along the aisle, the hands reaching ahead in turn
function crawl(who, t0, t1, x, z0, z1, { y = -0.05, tip = 38 } = {}) {
  prop(cut(t0), `${who}C`, { x, y: 0, z: z0, rot: 0 }, 0, "linear");
  A(cut(t0), who, "ride", { prop: `${who}C`, off: [0, y, 0], yaw: 0, dur: 0 });
  A(cut(t0), who, "pitch", { to: tip, dur: 0 }); A(cut(t0), who, "crouch", { to: 0, dur: 0 }); A(cut(t0), who, "lean", { to: 0, dur: 0 });
  prop(t0, `${who}C`, { z: z1 }, r3(t1 - t0), "linear");
  for (let t = t0, k = 0; t < t1 - 0.3; t += 0.42, k++) { c.arm(r3(t), who, k % 2 ? "L" : "R", { o: [0.12, 0.3, 0.52] }, 0.2, "out"); c.arm(r3(t + 0.21), who, k % 2 ? "L" : "R", { o: [0.14, 0.12, 0.2] }, 0.2, "in"); }
}
prop(cut(T.crawl), "smokeP", { ...key("fill", 1), ...key("fire", 1) }, 0, "linear");
crawl("spud", T.crawl, T.exit, 0.18, 5.2, 6.8);
crawl("vik", T.crawl, T.exit, -0.22, 3.2, 5.2);
crawl("wiz", T.crawl, T.exit, 0.15, 0.8, 2.8);
prop(cut(T.crawl), "trunk", { x: -0.22, y: 0.3, z: 2.1, tip: 90 }, 0, "linear"); prop(T.crawl, "trunk", { z: 4.1 }, r3(T.exit - T.crawl), "linear");
sfx(T.crawl, "scrape", { gain: 0.35, dur: 2.5, reason: "Viking drags the suitcase along the floor" });
A(T.crawl, "spud", "expr", { expr: "focused", dur: 0 }); A(T.crawl, "spud", "look", { to: [0, 0.4], dur: 0, blink: false });
A(T.crawl, "vik", "expr", { expr: "annoyed", dur: 0 }); A(T.crawl, "wiz", "expr", { expr: "dizzy", dur: 0 });
clock(r3(T.crawl + 0.05), T.exit, 50);
for (const [k, t] of [[4, T.crawl + 0.6], [5, T.crawl + 1.5], [6, T.crawl + 2.4]]) { num(r3(t), CAM.crawl, [0.55, 0.75, r3(rowZ(k) + 0.2)], String(k), { size: 120 + 14 * (k - 4) }); sfx(r3(t), "pat", { gain: 0.5, reason: `his hand finds seat ${k}` }); }
narr(T.crawl + 0.1, "Stay low. You cannot see. But you counted.", DUR.low, ["Stay low.", "You cannot see.", "But you counted."], [640, 640, 780]);
see(T.crawl + 0.4, T.exit - 0.2, ["spud.face"], "Spud crawls under the smoke, a hand on each seat");
// the reverse: the seventh seat, and the green sign comes out of the smoke
crawl("spud", T.exit, T.slide, 0.18, 8.9, 9.5);
for (const w of ["vik", "wiz"]) { A(cut(T.exit), w, "hide"); A(cut(T.slide), w, "show"); }   // behind the camera in the reverse
park(T.exit, "trunk");
prop(cut(T.exit), "hall", key("sign", 0.25), 0, "linear");
c.arm(T.exit + 0.25, "spud", "L", { world: [0.6, 0.55, 9.6] }, 0.2, "out");
num(r3(T.exit + 0.45), CAM.exit, [0.55, 0.95, 9.6], "7", { size: 190, dur: 0.9 }); sfx(T.exit + 0.45, "pat", { gain: 0.6, reason: "seat seven" });
prop(T.exit + 0.5, "hall", key("sign", 1), 0.35, "out"); sfx(T.exit + 0.55, "ding", { gain: 0.4, reason: "the EXIT sign shows through the smoke" });
prop(T.exit + 0.8, "hall", key("door", 1), 0.4, "out"); sfx(T.exit + 0.8, "doorslide", { gain: 0.5, reason: "the exit door opens" });
clock(r3(T.exit), T.slide, 47);
c.at(r3(T.slide - 0.1), { fx: "flash", peak: 0.7, dur: 0.2, sound: false });

// ================================================================ 9 DOWN THE SLIDE 27.0-29.4 (panel 09)
park(T.slide, "hall", "smokeP", "seatA", "seatB", ...FRONT_SEATS, "eng", "plume", "bag1", "bag2", "bag3", "phone");
prop(cut(T.slide), "smokeP", { scale: 0 }, 0, "linear");
prop(cut(T.slide), "jet", { x: 0, y: 0, z: 0, tip: 0, ...key("brk", 0), ...key("fire", 1) }, 0, "linear");
prop(cut(T.slide), "slideP", { y: DOOR[1], ...key("inflate", 1) }, 0, "linear");
sfx(T.slide, "windswell", { gain: 0.12, dur: r3(T.car - T.slide), reason: "the cold wind over the snow" });
sfx(T.slide, "flamejet", { gain: 0.4, dur: r3(T.boom - T.slide), reason: "the wreck burning" });
// Spud at the bottom, hauling the dazed Wizard away from the smoke: both hold a point that travels between them
const RUN0 = [-12.9, 8.9], RUN1 = [-15.6, 11.0], RUN_YAW = -52;
for (const w of ["spud", "wiz", "vik"]) { A(cut(T.slide), w, "pitch", { to: 0, dur: 0 }); A(cut(T.slide), w, "crouch", { to: 0, dur: 0 }); }
A(cut(T.slide), "spud", "ride", { prop: null, dur: 0 });
A(cut(T.slide), "spud", "move", { to: RUN0, dur: 0.01, steps: 0, ease: "linear" }); A(cut(T.slide), "spud", "turn", { to: RUN_YAW, dur: 0.01, ease: "linear" });
A(T.slide, "spud", "move", { to: RUN1, dur: r3(T.far - T.slide), ease: "linear" });
const drag = (t0, t1, a, b, lag = [1.0, -0.55]) => {
  prop(cut(t0), "wizC", { x: r3(a[0] + lag[0]), y: 0, z: r3(a[1] + lag[1]), rot: RUN_YAW }, 0, "linear"); prop(t0, "wizC", { x: r3(b[0] + lag[0]), z: r3(b[1] + lag[1]) }, r3(t1 - t0), "linear");
  prop(cut(t0), "handC", { x: r3(a[0] + lag[0] * 0.5), y: 0.5, z: r3(a[1] + lag[1] * 0.5) }, 0, "linear"); prop(t0, "handC", { x: r3(b[0] + lag[0] * 0.5), z: r3(b[1] + lag[1] * 0.5) }, r3(t1 - t0), "linear");
  A(cut(t0), "wiz", "ride", { prop: "wizC", off: [0, -0.12, 0], yaw: 0, dur: 0 }); A(cut(t0), "wiz", "pitch", { to: 28, dur: 0 });
  c.arm(cut(t0), "wiz", "R", { prop: "handC", grip: [0, 0, 0] }, 0); c.arm(cut(t0), "spud", "L", { prop: "handC", grip: [0, 0, 0] }, 0);
};
drag(T.slide, T.far, RUN0, RUN1);
A(T.slide, "spud", "expr", { expr: "angry", set: { open: 0.4 }, dur: 0 }); A(T.slide, "spud", "look", { to: [-0.6, 0.1], dur: 0, blink: false });
A(T.slide, "wiz", "expr", { expr: "dizzy", set: { open: 0.3 }, dur: 0 });
// Viking comes down the slide hugging the suitcase
const slideAt = (u) => [DOOR[0], r3(DOOR[1] * (1 - u)), r3(DOOR[2] + (SLIDE_END[2] - DOOR[2]) * u)];
const S0 = slideAt(0.08), S1 = slideAt(1);
prop(cut(T.slide), "vikC", { x: S0[0], y: S0[1], z: S0[2], rot: 0 }, 0, "linear");
A(cut(T.slide), "vik", "ride", { prop: "vikC", off: [0, 0.15, 0], yaw: 0, sit: true, dur: 0 });
prop(T.slide + 0.5, "vikC", { y: S1[1], z: S1[2] }, 1.0, "in");
prop(cut(T.slide), "trunk", { x: S0[0], y: r3(S0[1] + 0.72), z: r3(S0[2] + 0.42), tip: 0, rot: 0 }, 0, "linear"); prop(T.slide + 0.5, "trunk", { y: r3(S1[1] + 0.72), z: r3(S1[2] + 0.42) }, 1.0, "in");
both(cut(T.slide), "vik", (s) => ({ prop: "trunk", grip: [s === "R" ? -0.3 : 0.3, 0.3, 0.05] }), 0);
A(T.slide, "vik", "expr", { expr: "happy", set: { open: 0.3 }, dur: 0 });
sfx(T.slide + 0.5, "zip", { gain: 0.5, reason: "Viking down the slide" }); sfx(T.slide + 1.5, "thud-soft", { gain: 0.5, reason: "he lands in the snow" });
clock(r3(T.slide + 0.1), T.far, 20);
narr(T.slide + 0.15, "Do not stop. Upwind. Two hundred metres.", DUR.upwind, ["Do not stop.", "Upwind.", "Two hundred metres."], 640);
see(T.slide + 0.3, T.far - 0.2, ["spud.face", "wiz", "slideP"], "out of the door, down the slide, and he drags the Wizard away from the smoke");

// ================================================================ 10 / 11 THE BLAST 29.4-: two endings
park(T.far, "slideP");
prop(cut(T.boom), "blast", { on: 1 }, 0, "linear"); if (!SAFE) prop(cut(T.boom + 0.3), "blast2", { on: 1 }, 0, "linear");
sfx(T.boom, "impact", { gain: 1, loud: true, reason: "0:00: the wreck blows up" }); sfx(T.boom + 0.05, "rumble", { gain: 0.9, dur: 2.2, reason: "the blast rolling over the valley" });
c.at(T.boom, { fx: "flash", peak: 0.55, dur: 0.14, sound: false });
if (SAFE) {
  // A: far enough. They are still running when the clock runs out; the blast throws them into the snow, unhurt
  const A0 = [-88.5, 12.6], A1 = [-95.5, 12.6];
  A(cut(T.far), "spud", "move", { to: A0, dur: 0.01, steps: 0, ease: "linear" }); A(cut(T.far), "spud", "turn", { to: -90, dur: 0.01, ease: "linear" });
  A(T.far, "spud", "move", { to: A1, dur: r3(T.boom + 0.3 - T.far), ease: "linear" });
  drag(T.far, r3(T.boom + 0.3), A0, A1, [1.25, 0.95]); prop(cut(T.far), "wizC", { rot: -90 }, 0, "linear");
  prop(cut(T.far), "vikC", { x: -86.4, y: 0, z: 10.9, rot: -90 }, 0, "linear"); A(cut(T.far), "vik", "ride", { prop: "vikC", off: [0, 0, 0], yaw: 0, dur: 0 });
  prop(T.far, "vikC", { x: -93.4 }, r3(T.boom + 0.3 - T.far), "linear");
  prop(cut(T.far), "trunk", { x: -86.85, y: 0.55, z: 10.9, rot: -90, tip: 0 }, 0, "linear"); prop(T.far, "trunk", { x: -93.85 }, r3(T.boom + 0.3 - T.far), "linear");
  clock(T.far, r3(T.boom + 0.7), 1);
  shake(T.boom + 0.25, 0.09, 0.6);
  const D = r3(T.boom + 0.3);                                // the blast wave reaches them
  c.arm(D, "spud", "L", { o: [0.3, 0.5, 0.4] }, 0.2, "out"); c.arm(D, "spud", "R", { o: [0.3, 0.5, 0.4] }, 0.2, "out");
  A(D, "spud", "pitch", { to: 84, dur: 0.3, ease: "in" }); A(D, "spud", "move", { to: [-97.3, 12.6], y: -0.26, dur: 0.3, steps: 0, ease: "out" });
  A(D, "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.08 });
  prop(D, "wizC", { x: -96.2, y: -0.18 }, 0.3, "out"); A(D, "wiz", "pitch", { to: 80, dur: 0.3, ease: "in" }); both(D, "wiz", () => ({ o: [0.3, 0.5, 0.4] }), 0.2, "out");
  prop(D, "vikC", { x: -95.4, y: -0.3 }, 0.32, "out"); A(D, "vik", "pitch", { to: 82, dur: 0.32, ease: "in" }); prop(D, "trunk", { x: -96.3, y: 0.1, tip: 60 }, 0.32, "out");
  for (const [x, z] of [[-97.3, 12.6], [-96.2, 13.6], [-95.4, 10.9]]) act.landDust(c, r3(D + 0.28), [x, z], { color: "#f4f7fb", puffs: 10 });
  sfx(D + 0.28, "thud-soft", { gain: 0.6, reason: "they land face-first in the snow" });
  A(D + 1.0, "spud", "pitch", { to: 32, dur: 0.45, ease: "inOut" }); A(D + 1.0, "spud", "move", { to: [-97.3, 12.6], y: -0.06, dur: 0.45, steps: 0, ease: "inOut" }); A(D + 1.05, "spud", "look", { to: [0, 0.35], dur: 0.2 });
  A(D + 1.1, "spud", "expr", { expr: "shocked", set: { open: 0.25 }, dur: 0.25 });
  A(D + 1.7, "spud", "expr", { expr: "sad", set: { open: 0.12, curve: 0.15 }, dur: 0.3 }); A(D + 1.7, "spud", "droop", { to: 1, dur: 0.5 });
  A(T.car - 0.4, "spud", "expr", { expr: "serene", dur: 0.25 });
  narr(T.boom + 0.9, "That is why you are alive.", DUR.alive, ["That is why you are alive."], 900);
  see(D + 1.0, T.car - 0.1, ["spud.face", "blast"], "the wreck burns far behind him and he is alive");
} else {
  // B: he stops a short way off to look back. The clock runs out behind him
  const B0 = [-24.2, 8.5];
  A(cut(T.far), "spud", "move", { to: B0, dur: 0.01, steps: 0, ease: "linear" }); A(cut(T.far), "spud", "turn", { to: 40, dur: 0.01, ease: "linear" });
  c.arm(cut(T.far), "spud", "L", "rest", 0); c.arm(cut(T.far), "spud", "R", "rest", 0);
  A(T.far, "spud", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0 }); A(T.far, "spud", "look", { to: [0.5, 0.3], dur: 0, blink: false });
  // Viking and the Wizard keep going and dive
  prop(cut(T.far), "wizC", { x: -15, y: 0, z: 21, rot: -150 }, 0, "linear"); A(cut(T.far), "wiz", "ride", { prop: "wizC", off: [0, 0, 0], yaw: 0, dur: 0 }); A(cut(T.far), "wiz", "pitch", { to: 0, dur: 0 });
  prop(cut(T.far), "vikC", { x: -12.5, y: 0, z: 19, rot: -150 }, 0, "linear"); A(cut(T.far), "vik", "ride", { prop: "vikC", off: [0, 0, 0], yaw: 0, dur: 0 });
  prop(cut(T.far), "trunk", { x: -12.9, y: 0.55, z: 19.4, rot: -150, tip: 0 }, 0, "linear");
  for (const [w, to] of [["wiz", { x: -16.6, z: 23.6 }], ["vik", { x: -14.1, z: 21.6 }]]) { prop(T.far, `${w}C`, to, 1.0, "linear"); A(T.boom - 0.1, w, "pitch", { to: 80, dur: 0.3, ease: "in" }); prop(T.boom - 0.1, `${w}C`, { y: -0.25 }, 0.3, "in"); }
  prop(T.far, "trunk", { x: -14.5, z: 22.0 }, 1.0, "linear"); prop(T.boom - 0.1, "trunk", { y: 0.1, tip: 60 }, 0.3, "in");
  clock(T.far, r3(T.boom + 0.6), 1);
  shake(T.boom, 0.1, 0.9);
  A(T.boom + 0.04, "spud", "turn", { to: -75, dur: 0.22, ease: "out" }); A(T.boom + 0.04, "spud", "expr", { expr: "terrified", set: { open: 0.3 }, dur: 0.08 });
  A(T.boom + 0.3, "spud", "expr", { expr: "serene", set: { open: 0.35, curve: -0.5 }, dur: 0.12 }); A(T.boom + 0.3, "spud", "face", { brow: -0.7, dur: 0.12 });
  A(T.boom + 0.25, "spud", "droop", { to: 1, dur: 0.15 }); A(T.boom + 0.3, "spud", "lean", { to: 0, dur: 0.1 }); A(T.boom + 0.3, "spud", "pitch", { to: 14, dur: 0.2 });
  both(T.boom + 0.2, "spud", () => ({ o: [0.32, 0.3, 0.2] }), 0.2, "out");
  c.at(r3(T.boom + 0.3), { fx: "speedlines", dur: 1.2 });
  c.at(r3(T.car - 0.75), { fx: "flash", peak: 1, dur: 0.75, sound: false });
  narr(T.boom + 0.5, "You stopped too early.", DUR.early, ["You stopped too early."]);
  see(T.far, T.boom + 0.5, ["spud.face", "blast"], "he has stopped to look back, close to the wreck, as the clock runs out");
}

// ================================================================ 12 THE NEXT ONE (panel 12)
A(0, "spud2", "sit", { seat: "seat-drv", dur: 0.01, hands: "keep" });
A(0, "spud2", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "spud2", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "spud2", "R", { prop: "wheel", grip: "R" }, 0.01); c.arm(0, "spud2", "L", { prop: "wheel", grip: "L" }, 0.01);
A(0, "spud2", "expr", { expr: "serene", dur: 0 }); A(0, "spud2", "droop", { to: 0.8, dur: 0 });
A(T.car + 0.12, "spud2", "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0.07 }); A(T.car + 0.12, "spud2", "droop", { to: 0, dur: 0.1 });
A(T.car + 0.12, "spud2", "squash", { amount: 0.1, dur: 0.25 }); A(T.car + 0.5, "spud2", "look", { to: [0, -0.5], dur: 0.15, blink: false });
c.at(r3(T.car + 0.3), { fx: "sweat", who: "spud2", dur: 0.9, count: 4 });
sfx(T.car, "screech", { gain: 0.8, loud: true, reason: "the smash cut: tyres leaving the broken bridge" });
sfx(T.car + 0.05, "windswell", { gain: 0.6, dur: 1.7, reason: "the car in the air" });
narr(T.car + 0.2, "You wake up mid car crash.", DUR.car, ["You wake up", "mid car crash."], 1290);
see(T.car + 0.15, T.end, ["spud2.face", "wheel"], "the same eyes snap open at the wheel of a car in mid-air");

// ---------------------------------------------------------------- shots
const beats = c.beats([
  ["wake", 0, CAM.wake, "hook"],
  ["mask first", T.mask, CAM.masks],
  ["count the rows", T.count, CAM.count],
  ["brace", T.brace, CAM.brace],
  ["the plough", T.plough, CAM.plough, "reveal"],
  ["impact", T.impact, CAM.impact, "escalation"],
  ["leave everything", T.smoke, CAM.smoke],
  ["stay low", T.crawl, CAM.crawl],
  ["seven", T.exit, CAM.exit],
  ["the slide", T.slide, CAM.slide],
  [SAFE ? "far enough" : "too close", T.far, SAFE ? CAM.safe : CAM.close, "payoff"],
  ["the next one", T.car, CAM.car],
], T.end);

write(import.meta.url, {
  id: `wake-up-mid-plane-crash-${VARIANT.toLowerCase()}`,
  title: "You wake up mid plane crash",
  idea: `You wake up mid EP01 (pilot), ending ${VARIANT}: a narrated second-person survival story in a crashing airliner; ${SAFE ? "he gets far enough and lives" : "he stops to look back and the blast reaches him"}; he wakes up mid car crash`,
  format: "series: You wake up mid (narrator reads the title at 0.0 and leads every step; two on-screen clocks; ends in the next scenario)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "snowslope", dark: 0, para: 0, aperture: 0, focus: false, bloom: "emissive", lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.06, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["spud", "eng"], hint: 0, what: "Spud's eyes snap open: the engine outside his window is on fire" },
  rigs,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [],
  notes: "Generated by storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs. Spec: PANELS.md.",
});
