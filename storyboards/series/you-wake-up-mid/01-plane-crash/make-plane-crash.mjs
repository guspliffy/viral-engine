// YOU WAKE UP MID, EP01: PLANE CRASH (pilot, 11 Nov 2026), from the clip template. v4 "10x": Jonny rejected the v3 cut
// ("more of an explainer and tends to be boring ... 10x more extreme") and approved 16 new panels the same day.
//   node storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs            -> wake-up-mid-plane-crash-a.json (safe)
//   VARIANT=B node storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs  -> wake-up-mid-plane-crash-b.json (he looked back)
// Target: /mnt/project-files/video-scripts/2026-11-11-you-wake-up-mid/01-mid-plane-crash-V4-10X-PANEL-PROMPT.md (outline v4)
// and the two sheets in panels-01-mid-plane-crash-v4/ (PANEL-NOTES.md there: where a drawing differs, the outline wins).
// PANELS.md beside this file has the shots and the departures; NOTES.md is the working memory.
//
// THE BRIEF
//   Story:       you wake up in an airliner falling out of a thunderstorm. Every scene is a bigger danger caused by the
//                one before: the engine blows, so it dives, so the tail tears off, so there is no air, so out of the
//                clouds a mountain, so a belly landing that rips a wing off and sledges to a cliff edge, so fire, smoke
//                and a hull that tips with every step, so out and run, so it goes over and blows up.
//   Wants:       Spud wants to live and does the right thing each time (belt, mask, brace, leave the bag, stay low, run).
//                The Wizard (no belt) and Viking (his suitcase) show what the wrong move costs.
//   Narrator:    voice 1 reads the title at 0.0, then only two to four words per scene. The picture leads.
//   Consequence: A: face down in the snow, alive. B: he stops to look back and the blast reaches him.
//   Ending:      he shuts his eyes and wakes up at the wheel of a car flying off a bridge (the series loop), through the
//                same blinking eyelids the clip opens with.
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { ridePath, slopeAt } from "../../../../engine/page/set-snowslope.js";

const VARIANT = process.env.VARIANT === "B" ? "B" : "A";
const SAFE = VARIANT === "A";
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1120 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- the timeline (s)
// Each narrator line is as long as voice 1 reads it (out/speech, measured 11 Nov).
const DUR = { wake: 2.35, belt: 1.49, mask: 3.38, brace: 2.35, why: 0.89, leave: 0.79, low: 1.15, run: 2.12, alive: 2.07, looked: 1.23, car: 2.65 };
const T = {
  face: 1.0,       // 02 his face, Viking screaming, the Wizard floating
  fall: 2.5,       // 03 outside: the plane falls through the storm
  tear: 4.8,       // 04 the tail tears off
  mask: 7.0,       // 05 no air: 0:15
  ridge: 10.5,     // 06 outside: out of the clouds, the mountain
  brace: 12.2,     // 07 head down
  slam: 14.7,      // 08 outside: belly first, a wing rips off, the cliff ahead
  impact: 16.5,    // 09 inside at the same moment
  edge: 18.3,      // 10 outside: it stops with its nose over the edge, 1:30
  trunk: 20.1,     // 11 Viking's suitcase tips the cabin
  crawl: 22.8,     // 12 under the smoke, 0:40
  door: 25.0,      // 13 the suitcase is kicked out of the door, the slide
  run: 27.2,       // 14 they run, the hull tips over
  boom: 29.4,      // 15 / 16 the two endings
};
T.lurch = r3(T.trunk + 1.05);
T.car = r3(T.boom + (SAFE ? 3.1 : 2.2));
T.wheel = r3(T.car + 0.55);   // the blink, then his face at the wheel
T.end = r3(T.car + 3.3);

// ---------------------------------------------------------------- the cabin (briefs/T1-cabin.md, T4-tear.md): x right, z = the nose
const AX = 2.09, BX = 1.03, PITCH = 1.35;                 // window seat A, aisle seat B (port side), the row pitch
const SEAT = 0.3;                                          // a sitter's body y on a seat (cushion top 0.42)
const OH_Y = 2.35;                                         // the bins' underside
const PARK = -40;                                          // a prop out of the shot (the cabin hangs 180 m over the valley: nothing shows)
const TEAR_Z = -2.0;                                       // the tail tears off behind row -1
// prop keys the builders chose (their usage headers): one place to rename them
const KEY = { view: "feed", lights: "level", masks: "drop", bins: "lid", door: "open", sign: "fill", fill: "fill", fire: "fire", brk: "broken", inflate: "on", tear: "tear", alarm: "alarm", tail: "torn", lids: "open" };
const key = (k, v) => ({ [KEY[k]]: v });

// ---------------------------------------------------------------- the outside (set snowslope, moved 150 m toward +x)
// The set's own origin (where the ride path ends) is at [OX, 0, 0]; the valley floor breaks off 14.5 m beyond it (the
// cliff), so the cabin at the world's origin hangs in the air 135 m out: nothing of the valley shows from inside it.
const OX = 150, CLIFF = -14.5;
const out = (x, y, z) => [r3(x + OX), r3(y), r3(z)];        // a point in the set's frame -> the world
const DOOR = out(-12, 1.475, 2.1);                         // the wreck's door sill (T3's WRECK.door turned into the world: nose -x, port +z)
const SLIDE_END = out(-12, 0, 7.1);
const SKY = [-300, 600, 0];                                // the storm the plane falls through, high over the far hills
const CAR = [-300, 80, 300];                               // the bridge's broken edge

// ---------------------------------------------------------------- cameras (pos, look, fov), one per panel
const CAM = {
  pov: { pos: [0.12, 1.2, -0.7], look: [0, 0.7, 9], fov: 62 },   // no roll: the eyelids prop needs a level, still camera                                                          // 01
  face: { pos: [1.4, 1.0, 2.75], look: [1.5, 1.2, 0], fov: 60, to: { pos: [1.42, 1.0, 2.5] }, dur: 1.5, ease: "out" },           // 02
  fall: { pos: [SKY[0] + 14, SKY[1] + 12, 75], look: [SKY[0], SKY[1] + 12, 0], fov: 40, roll: 7, to: { look: [SKY[0], SKY[1] - 14, 0], fov: 36, roll: -5 }, dur: 2.3, ease: "linear" },   // 03
  tear: { pos: [1.5, 1.5, 2.7], look: [1.62, 1.6, -2], fov: 66, roll: 5 },                                                    // 04
  masks: { pos: [1.5, 1.7, 3.3], look: [1.56, 0.8, 0.2], fov: 52 },                                                                 // 05
  ridge: { pos: out(286, slopeAt(286) + 16, 122), look: out(322, slopeAt(322) + 24, 34), fov: 40, to: { look: out(244, slopeAt(244) + 11, 34) }, dur: 1.7, ease: "linear" },   // 06
  brace: { pos: [1.6, 1.85, 2.7], look: [1.62, 0.72, -0.1], fov: 56 },                                                            // 07
  slam: { pos: out(45, 42, 62), look: out(100, slopeAt(100), 0), fov: 50, to: { look: out(2, 0, 0) }, dur: 1.8, ease: "linear" },   // 08
  impact: { pos: [1.2, 1.45, 2.9], look: [1.6, 1.15, -0.4], fov: 62 },                                                             // 09
  edge: { pos: out(-38, 6, 28), look: out(-10, 2, 0), fov: 45 },                                                                  // 10
  trunk: { pos: [0.39, 1.05, 3.5], look: [0.39, 0.9, 0.5], fov: 60, roll: 7 },                                                     // 11
  lurch: { pos: [0.39, 1.05, 3.5], look: [0.39, 0.9, 0.5], fov: 60, roll: 7, to: { roll: 15 }, dur: 0.45, ease: "out" },         // 11, the cabin tips
  crawl: { pos: [0, 0.3, 10.4], look: [0, 0.95, 5.4], fov: 40, roll: 6 },                                                         // 12
  door: { pos: out(-8.2, 1.9, 9.6), look: out(-12.3, 1.3, 2.6), fov: 50 },                                                         // 13
  run: { pos: out(-10.5, 0.8, 70), look: out(-10.5, 1.9, 30), fov: 40 },                                                           // 14
  safe: { pos: out(-10.3, 0.4, 71.6), look: out(-10.6, 1.9, 40), fov: 44 },                                                       // 15
  close: { pos: out(-10.4, 0.75, 24.9), look: out(-14, 3.4, 5), fov: 40 },                                                         // 16
  carpov: { rig: "car", pos: [0.55, 1.05, 0.5], look: [0.55, 0.7, 8], fov: 60 },                                                   // the blink at the wheel
  car: { rig: "car", pos: [0.9, 1.75, 5.2], look: [0.45, 1.2, 0.3], fov: 30 },                                                    // old panel 12
};

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [AX, 0.03], face: 0, expr: "terrified", follow: 0.3, seed: 2.9 },
  { id: "vik", character: "elevator/viking", at: [BX, 0.03], face: 0, expr: "terrified", follow: 0.3, seed: 3.3 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [AX, -PITCH], face: 0, expr: "terrified", follow: 0.3, seed: 2.6 },
  // the same Spud at the wheel of the car (the last shot): the car is far from the valley, so he is never in the other shots
  { id: "spud2", character: "potatobrawl/spud", rig: "car", at: [0.55, 0.23], face: "camera", expr: "serene", follow: 0.25, shadowFall: 0.001, seed: 2.9 },
];

// ---------------------------------------------------------------- props
const MASK_UP = (x) => ({ x, y: r3(OH_Y + 0.07), z: 0.4 });
const anchor = (x, z = 0.4) => [x, r3(OH_Y - 0.01), z];
const HANG = 1.55;
const SEATSPEC = { kind: "planeseat", w: 0.96, arms: "both", color: "#2f4d8c", cover: 0.34 };
// the port seats of rows 0-2 are real props: a camera that sits in a row looks through where they stand, so they park per shot
const FRONT_SEATS = ["seatA1", "seatW", "seatA2", "seatB2"];
const TRUNK = { x: -1.3, y: 2.56, z: 0.6 };               // Viking's suitcase, in the starboard bin over row 0
const STORM = "assets/plates/storm-sky-dive.png";
const props = [
  { id: "hall", kind: "cabinhall", x: 0, y: 0, z: 0, tearZ: TEAR_Z, omit: [[0, "A"], [0, "B"], [1, "A"], [1, "B"], [2, "A"], [2, "B"]] },
  { id: "holeSky", staged: "a sky card", kind: "stormsky", x: 0, y: -8, z: -46, src: STORM, h: 120, glow: 0 },   // the storm behind the hole
  { id: "holeBolt", staged: "lightning", kind: "skybolt", x: 5, y: 2, z: -40, h: 34, seed: 7, glow: 0 },
  { id: "smokeP", kind: "cabinsmoke", x: 0, y: 0, z: 0, z0: TEAR_Z, scale: 0 },   // scale 0 = off: at fill 0 it still paints the frame
  { id: "lids", staged: "a first-person overlay", kind: "eyelids", cam: { pos: CAM.pov.pos, look: CAM.pov.look, fov: CAM.pov.fov } },
  { id: "seatA", ...SEATSPEC, x: AX, z: 0 }, { id: "seatB", ...SEATSPEC, x: BX, z: 0 },
  { id: "seatA1", ...SEATSPEC, x: AX, z: PITCH }, { id: "seatW", ...SEATSPEC, x: BX, z: PITCH },
  { id: "seatA2", ...SEATSPEC, x: AX, z: r3(2 * PITCH) }, { id: "seatB2", ...SEATSPEC, x: BX, z: r3(2 * PITCH) },
  { id: "belt", staged: "worn on his lap", kind: "seatbelt", x: AX, z: 0, r: 0.4 },
  { id: "maskS", staged: "hangs from its hose", kind: "oxymask", ...MASK_UP(AX), y: HANG, anchor: anchor(AX) },
  { id: "maskV", staged: "hangs from its hose", kind: "oxymask", ...MASK_UP(BX), y: HANG, anchor: anchor(BX) },
  { id: "neck", staged: "worn round his neck", kind: "neckmask", x: AX, y: PARK, z: 0.3 },
  { id: "phone", staged: "floating in the falling cabin", kind: "phone", x: 0.35, y: 1.9, z: r3(-PITCH + 0.35), rot: 20, tip: -40, scale: 1.7, case: "#2a2d36" },
  { id: "trunk", staged: "in the overhead bin, then in his hands or thrown", kind: "suitcase", ...TRUNK, tip: 90, color: "#7a4a25", rib: "#5c3518", scale: 1.5 },
  { id: "bag1", staged: "in the overhead bin", kind: "duffel", x: 1.5, y: 2.56, z: 0.4, color: "#3a8f6a" },
  { id: "bag2", staged: "in the overhead bin", kind: "suitcase", x: 1.6, y: 2.56, z: 1.6, tip: 90, color: "#6a4a8c" },
  { id: "bag3", staged: "in the overhead bin", kind: "backpack", x: 1.4, y: 2.56, z: 2.5, tip: 90, color: "#3b3f52" },
  // what flies at him in the first second, and out of the hole when the tail goes
  { id: "fly1", staged: "thrown through the falling cabin", kind: "suitcase", x: 0.1, y: 0.9, z: 8.5, color: "#3b6ea8", rib: "#2a4f7a", scale: 1.4 },
  { id: "fly2", staged: "thrown through the falling cabin", kind: "duffel", x: -0.25, y: 1.6, z: 10, color: "#b0552f" },
  { id: "fly3", staged: "thrown through the falling cabin", kind: "backpack", x: 0.3, y: 0.5, z: 11, color: "#3b3f52" },
  { id: "fly4", staged: "thrown through the falling cabin", kind: "pillow", x: -0.1, y: 1.9, z: 6.5 },
  { id: "fly5", staged: "thrown through the falling cabin", kind: "magazine", x: 0.25, y: 1.4, z: 5 },
  // invisible carriers: a body that is not walking rides one (seats, floating, the crawl, the slide)
  { id: "spudC", kind: "carrier", x: AX, y: 0, z: 0.03 },
  { id: "vikC", kind: "carrier", x: BX, y: 0, z: 0.03 },
  { id: "wizC", kind: "carrier", x: 0.85, y: 0.9, z: -1.2 },
  // the outside: one airliner for every outside shot (falling, over the ridge, sledging, on the edge, going over)
  { id: "jet", staged: "an airliner in the air", kind: "jetwreck", x: SKY[0], y: SKY[1] + 24, z: 0, rot: 25, tip: 62, roll: -14 },
  { id: "sky2", staged: "a sky card", kind: "stormsky", x: SKY[0], y: SKY[1] - 10, z: -160, src: STORM, h: 320, glow: 0 },
  { id: "bolt2", staged: "lightning", kind: "skybolt", x: SKY[0] - 30, y: SKY[1] + 10, z: -120, h: 110, seed: 4, glow: 0 },
  { id: "rain", staged: "rain", kind: "rainstreaks", x: SKY[0] + 5, y: SKY[1], z: 40, n: 380, box: [40, 60, 30], v: [-8, 115, 0], len: 5.5, width: 0.05, opacity: 0.3 },
  { id: "cloudsNear", staged: "clouds", kind: "cloudrush", x: SKY[0] + 8, y: SKY[1] - 80, z: 45, n: 7, w: 44, h: 120, size: 13, seed: 8, color: "#2c2a4a", light: "#7d78a8", opacity: 0.7, order: 5, spread: 0.75 },
  { id: "cloudsRidge", staged: "clouds", kind: "cloudrush", ...xyz(out(318, slopeAt(318) + 52, 30)), n: 9, w: 90, h: 46, size: 26, seed: 5, color: "#4a4c66", light: "#9aa0c0", opacity: 0.9, order: 5 },
  { id: "plume", kind: "snowfront", x: OX, run: 0.25, scale: 0.55, firs: true },
  { id: "wing", staged: "torn off and thrown", kind: "wingchunk", x: OX, y: PARK - 60, z: 0 },
  { id: "rip", kind: "carburst", ...xyz(out(103, slopeAt(103) + 3, 9)), at: r3(T.slam + 0.3), r: 7 },
  { id: "slideP", kind: "evacslide", x: DOOR[0], y: PARK - 60, z: DOOR[2], rot: -90, h: DOOR[1], len: 5.0 },
  { id: "blast", kind: "carburst", ...xyz(out(-26, -6, 0)), at: T.boom, r: 30 },
  { id: "blast2", kind: "carburst", ...xyz(out(SAFE ? -20 : -15, 7, SAFE ? 3 : 9)), at: r3(T.boom + 0.3), r: SAFE ? 15 : 13 },
  // the car shot
  { id: "bridge", staged: "the bridge stands on its own pillars, off frame", kind: "bridgeend", x: CAR[0], y: CAR[1], z: CAR[2], at: r3(T.car - 0.3) },
  { id: "valley", staged: "a sky card", kind: "stormsky", src: "assets/plates/valley-vista-sun.png", h: 170, x: CAR[0], y: r3(CAR[1] - 20), z: r3(CAR[2] - 90), glow: 1 },
  { id: "seat-drv", kind: "carseat", rig: "car", x: 0.55, y: 0.12, z: 0.2, color: "#59535f", trim: "#6e6875", width: 0.86 },
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.62, z: 0.7, tip: 34 },
  { id: "neck2", staged: "worn round his neck", kind: "neckmask", rig: "car", x: 0.55, y: 0.68, z: 0.44, tip: -50 },
  { id: "lids2", staged: "a first-person overlay", kind: "eyelids", rig: "car", cam: { pos: CAM.carpov.pos, look: CAM.carpov.look, fov: CAM.carpov.fov } },
];
function xyz(p) { return { x: p[0], y: p[1], z: p[2] }; }
const rigs = [{ id: "car", kind: "hatchback", color: "#c8372d", pivot: [0, 0.5, 0], keys: [
  { at: 0, pos: [CAR[0], CAR[1] + 0.6, CAR[2] + 3.2], yaw: 0, pitch: 3, roll: 0 },
  { at: T.car, pos: [CAR[0], CAR[1] + 0.6, CAR[2] + 3.2], yaw: 0, pitch: 3, roll: 0 },
  { at: T.end, pos: [CAR[0] + 0.3, CAR[1] - 0.9, CAR[2] + 9.5], yaw: 3, pitch: 16, roll: -5 },
] }];

// ---------------------------------------------------------------- helpers
// (a "dur 0" pose change takes the action's default length and lands some frames into the new shot: a cut cheat is 0.01 s long)
const both = (t, who, pose, dur, ease) => { for (const s of ["R", "L"]) c.arm(t, who, s, typeof pose === "function" ? pose(s) : pose, dur || 0.01, ease); };
const WIDE = { o: [0.55, 0.5, 0.12] };                     // the Wizard's arms thrown wide: wider than his hat brim
const shake = (t, amp, dur = 0.35) => c.at(t, { fx: "shake", amp, dur });
const cut = (t) => r3(t - 0.02);                           // a cut cheat lands a frame before its cut
const set = (t, id, s) => prop(cut(t), id, s, 0, "linear");   // a prop jumps on a cut
const seatOn = (t, who, x, z, yaw = 0, y = SEAT) => { set(t, `${who}C`, { x, y: 0, z, rot: yaw }); A(cut(t), who, "ride", { prop: `${who}C`, off: [0, y, 0], yaw: 0, sit: true, dur: 0 }); };
const standOn = (t, who, x, z, yaw = 0, y = 0) => { set(t, `${who}C`, { x, y, z, rot: yaw }); A(cut(t), who, "ride", { prop: `${who}C`, off: [0, 0, 0], yaw: 0, dur: 0 }); };
const pose0 = (t, ...whos) => { for (const w of whos) { A(cut(t), w, "pitch", { to: 0, dur: 0.01 }); A(cut(t), w, "lean", { to: 0, dur: 0.01 }); A(cut(t), w, "crouch", { to: 0, dur: 0.01 }); } };
const park = (t, ...ids) => { for (const id of ids) set(t, id, { y: id === "jet" || id === "slideP" || id === "wing" ? PARK - 60 : PARK }); };
// thunder: the storm card and a bolt light up, the frame flashes, a crack and a roll
const thunder = (t, sky, bolt, gain = 0.8) => {
  for (const id of [sky, bolt]) { prop(t, id, { glow: 1 }, 0.04, "linear"); prop(r3(t + 0.08), id, { glow: 0.15 }, 0.1, "linear"); prop(r3(t + 0.2), id, { glow: 0.8 }, 0.04, "linear"); prop(r3(t + 0.28), id, { glow: 0 }, 0.3, "out"); }
  c.at(t, { fx: "flash", peak: 0.45, dur: 0.12, sound: false });
  sfx(t, "impact", { gain, loud: true, reason: "a thunderclap right outside" }); sfx(r3(t + 0.1), "rumble", { gain: 0.5, dur: 1.2, reason: "the thunder rolling" });
};
// the narrator (voice 1, the deep storyteller) and his subtitle chunks [text, ...]
const SUBY = 1120;
const narr = (t, line, dur, chunks, y = SUBY, tail = 0.25, x = null) => {
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
  const n = chunks.reduce((k, x) => k + x.length, 0); let a = t;
  chunks.forEach((text, i) => { const b = i === chunks.length - 1 ? t + dur + tail : a + (dur * text.length) / n; const xi = Array.isArray(x) ? x[i] : x; c.cap(r3(a), r3(b), text, Array.isArray(y) ? y[i] : y, false, xi == null ? SUB_STYLE : { ...SUB_STYLE, x: xi }); a = b; });
};
// an on-screen clock in the lower left corner, counting down one second per second from `from` (seconds)
const clock = (t0, t1, from, x = 205, y = 1130) => { for (let k = 0; t0 + k < t1 - 1e-6; k++) { const s = Math.max(0, from - k); c.cap(r3(t0 + k), r3(Math.min(t1, t0 + k + 1)), `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, y, false, { x, size: 92, kinetic: false }); } };
// a thing flying through the cabin: from where it is to `to` over [t0, t1], tumbling
const fling = (t0, t1, id, to, turns = [1, 1, 1]) => prop(t0, id, { x: to[0], y: to[1], z: to[2], rot: 360 * turns[0], tip: 360 * turns[1], roll: 360 * turns[2] }, r3(t1 - t0), "linear");

// ================================================================ the whole flight: light, alarm, storm
prop(0, "hall", { ...key("alarm", 1), ...key("view", 3), ...key("masks", 1), ...key("lights", 0.75) }, 0, "linear");
prop(0, "jet", { ...key("fire", 1), ...key("brk", 1) }, 0, "linear");   // a key in the spec does not start it: keys are set by a tween
for (const w of ["spud", "vik"]) A(0, w, "ride", { prop: `${w}C`, off: [0, SEAT, 0], yaw: 0, sit: true, dur: 0 });
A(0, "wiz", "ride", { prop: "wizC", off: [0, 0, 0], yaw: 0, dur: 0 });
sfx(0, "rumble", { gain: 0.4, dur: r3(T.slam), reason: "the airframe shaking, to the crash" });
sfx(0, "windswell", { gain: 0.3, dur: r3(T.tear), reason: "the dive" });
for (let t = 0.1; t < T.slam - 0.3; t += 0.5) if (!(t > T.fall && t < T.tear) && !(t > T.ridge && t < T.brace)) sfx(r3(t), "timer-beep", { gain: 0.22, reason: "the cabin alarm" });

// ================================================================ 01 THE BLINK 0-1.0 (panel 01): through his own eyelids
for (const w of ["spud", "vik", "wiz"]) A(0, w, "hide");   // first person: the camera stands in for his eyes, a little into the aisle
sfx(0, "impact", { gain: 0.9, loud: true, reason: "frame 0: the bang that wakes him (the left engine blows)" });
sfx(0.02, "scarestab", { gain: 0.5, reason: "frame 0: the sting under the title" });
shake(0, 0.07, 1.0);
prop(0, "lids", key("lids", 0.34), 0, "linear"); prop(0.02, "lids", key("lids", 0.62), 0.16, "out");
prop(0.3, "lids", key("lids", 0.06), 0.1, "in"); prop(0.42, "lids", key("lids", 1), 0.3, "out");
fling(0, 1.0, "fly1", [0.2, 1.1, -0.3], [0.6, 0.4, 0.2]);   // it fills the lens on the last frame before the cut and never passes through the camera (a one-frame dark pop on the first full render)
 fling(0.15, 1.0, "fly2", [-0.5, 1.45, -1.6], [0.4, 0.8, 0.5]);
fling(0.3, 1.0, "fly3", [0.5, 0.9, 1.2], [0.5, 0.3, 0.7]); fling(0, 0.7, "fly4", [-0.35, 1.5, -1.5], [1, 0.5, 0.3]); fling(0, 0.5, "fly5", [0.3, 1.25, -1.2], [1.5, 1, 0.6]);
sfx(0.5, "whoosh", { gain: 0.5, reason: "bags flying down the aisle at him" });
narr(0.05, "You wake up mid plane crash.", DUR.wake, ["You wake up", "mid plane crash."], [1210, 470], r3(T.fall - 0.03 - 0.05 - DUR.wake), [null, 655]);
{ const k = c.captions.find((q) => q.text === "You wake up"), m = c.captions.find((q) => q.text === "mid plane crash."); k.to = r3(T.face - 0.03); m.from = T.face; }   // one line per shot
see(0, 0.95, ["fly1"], "frame 0: through his eyelids, the cabin pointing down and a suitcase flying at him");

// ================================================================ 02 HIS FACE 1.0-2.5 (panel 02)
park(T.face, "lids", "fly1", "fly2", "fly3", "fly4", "fly5", ...FRONT_SEATS);   // the camera sits in the rows ahead
for (const w of ["spud", "vik", "wiz"]) A(cut(T.face), w, "show");
A(T.face, "spud", "expr", { expr: "terrified", set: { open: 0.9 }, dur: 0 }); A(T.face, "spud", "droop", { to: 1, dur: 0 }); A(T.face, "spud", "look", { to: [-0.4, 0.1], dur: 0, blink: false });
both(cut(T.face), "spud", (s) => ({ o: [s === "R" ? 0.05 : 0.16, 0.36, 0.3] }), 0);
A(T.face + 0.1, "spud", "squash", { amount: 0.1, dur: 0.3 }); c.at(T.face + 0.1, { fx: "sweat", who: "spud", dur: 1.2, count: 5 });
A(T.face + 0.5, "spud", "look", { to: [0.8, 0.2], dur: 0.12, blink: false }); A(T.face + 0.95, "spud", "look", { to: [-0.7, 0.5], dur: 0.12, blink: false });
A(T.face, "vik", "expr", { expr: "terrified", set: { open: 0.85 }, dur: 0 }); both(cut(T.face), "vik", () => ({ o: [0.26, 0.14, 0.36] }), 0);
A(T.face + 0.3, "vik", "lean", { to: 9, dur: 0.2 }); A(T.face + 0.7, "vik", "lean", { to: -8, dur: 0.25 }); A(T.face + 1.1, "vik", "lean", { to: 5, dur: 0.2 });
c.at(T.face + 0.2, { fx: "sweat", who: "vik", dur: 1.0, count: 4 });
// the Wizard, no belt: weightless off his seat behind them, his phone drifting away
A(0.2, "wiz", "expr", { expr: "terrified", set: { open: 0.7 }, dur: 0 }); both(0.2, "wiz", () => WIDE, 0.01);   // set while nobody sees him (first person)
A(0.2, "wiz", "pitch", { to: -14, dur: 0.01 }); A(0.2, "wiz", "lean", { to: 8, dur: 0.01 });
prop(T.face, "wizC", { y: 1.4, rot: 25 }, r3(T.fall - T.face), "linear");
prop(T.face, "phone", { y: 2.3, x: 0.1, rot: 200, tip: 60 }, 1.5, "linear");
for (const id of ["maskS", "maskV"]) { prop(T.face, id, { tilt: 12 }, 0.3, "out"); prop(T.face + 0.3, id, { tilt: -10 }, 0.4); prop(T.face + 0.7, id, { tilt: 8 }, 0.4); prop(T.face + 1.1, id, { tilt: -5 }, 0.4); }
shake(T.face, 0.05, 1.5);
thunder(T.face + 0.75, "holeSky", "holeBolt", 0.6);
see(T.face + 0.1, T.fall - 0.1, ["spud.face", "vik.face"], "his terror, Viking screaming beside him (the Wizard floating off his seat behind them)");

// ================================================================ 03 OUTSIDE: THE FALL 2.5-4.8 (panel 03)
const FALL = r3(T.tear - T.fall);
prop(T.fall, "jet", { y: SKY[1] - 22, rot: 40, tip: 74, roll: 12 }, FALL, "linear");
prop(T.fall, "cloudsNear", { y: SKY[1] + 60 }, FALL, "linear");
sfx(T.fall, "scarestab", { gain: 0.5, reason: "the cut outside: the whole plane, falling" });
sfx(T.fall, "flamejet", { gain: 0.5, dur: FALL, reason: "the burning engine" }); sfx(T.fall, "windswell", { gain: 0.6, dur: FALL, reason: "the plane dropping through the storm" });
thunder(T.fall + 0.45, "sky2", "bolt2"); thunder(T.fall + 1.6, "sky2", "bolt2", 0.6);
see(T.fall + 0.2, T.tear - 0.1, ["jet"], "the airliner, one engine a tail of fire, falling nose first through the thunderstorm");

// ================================================================ 04 THE TAIL TEARS OFF 4.8-7.0 (panel 04)
const RIP = r3(T.tear + 0.25);
seatOn(T.tear, "spud", AX, 0.03, 0);
set(T.tear, "wizC", { x: r3(AX - 0.45), y: 1.0, z: -1.45, rot: 0 }); A(T.fall + 0.5, "wiz", "pitch", { to: 10, dur: 0.01 }); A(T.fall + 0.5, "wiz", "lean", { to: 0, dur: 0.01 });   // (posed while the camera is outside)
park(T.tear, "phone"); for (const [id, x, z] of [["fly2", -1.2, -2.6], ["fly3", 1.4, -3.0], ["fly4", 0.2, -2.4], ["fly5", -0.4, -2.2]]) set(T.tear, id, { x, y: 0.9, z, rot: 0, tip: 0, roll: 0 });
// the bang
prop(RIP, "hall", key("tear", 1), 0, "linear"); prop(RIP, "hall", key("lights", 0.5), 0.1, "linear");
sfx(RIP, "slam", { gain: 1, loud: true, reason: "the tail tears off" }); sfx(r3(RIP + 0.03), "crumble", { gain: 0.7, reason: "metal ripping" });
sfx(r3(RIP + 0.05), "windswell", { gain: 0.85, dur: r3(T.slam - RIP), reason: "the open sky howling through the hole" });
c.at(RIP, { fx: "flash", peak: 0.6, dur: 0.14, sound: false }); shake(RIP, 0.13, 0.7); shake(RIP + 0.7, 0.06, 1.3);
for (const [id, to] of [["fly2", [-3, 2.5, -24]], ["fly3", [4, 4, -28]], ["fly4", [0.5, 5, -20]], ["fly5", [-1, 3, -18]]]) fling(RIP, r3(RIP + 0.7), id, to, [1, 2, 1]);
thunder(RIP + 0.9, "holeSky", "holeBolt", 0.5);
// the Wizard goes with the air; Spud, belted, twists round and catches him
const CATCH = { x: r3(AX - 0.45), y: 1.5, z: -1.25 }, HOLD = [0.36, 0.45, 1.12];   // HOLD: where their hands meet, from the Wizard's carrier (over the seat back)
A(RIP, "wiz", "pitch", { to: 24, dur: 0.25, ease: "in" }); prop(RIP, "wizC", { y: 1.8, z: -1.9 }, 0.3, "in");
A(RIP, "wiz", "expr", { expr: "terrified", set: { open: 1 }, dur: 0.06 });
c.arm(RIP, "wiz", "L", { prop: "wizC", grip: HOLD }, 0.15, "out"); c.arm(RIP, "wiz", "R", { o: [0.3, 0.75, 0.2] }, 0.15, "out");
prop(RIP, "spudC", { rot: -55 }, 0.22, "out"); A(RIP, "spud", "look", { to: [0.5, 0.7], dur: 0.12, blink: false });
A(RIP, "spud", "expr", { expr: "angry", set: { open: 0.05 }, dur: 0.1 });
c.arm(RIP, "spud", "R", { prop: "wizC", grip: HOLD }, 0.3, "out"); A(r3(RIP + 0.12), "spud", "grip", { side: "R", shape: "fist", dur: 0.1 });
c.arm(r3(RIP + 0.12), "spud", "L", { o: [0.2, 0.2, 0.25] }, 0.2, "out");
prop(r3(RIP + 0.3), "wizC", CATCH, 0.14, "out"); sfx(r3(RIP + 0.42), "slap", { gain: 0.6, reason: "his hand snaps shut on the cape" });
A(r3(RIP + 0.44), "spud", "squash", { amount: 0.1, dur: 0.3 });
for (let k = 0; k < 4; k++) { const t = r3(RIP + 0.5 + 0.38 * k); prop(t, "wizC", { y: r3(CATCH.y + (k % 2 ? -0.05 : 0.06)), z: r3(CATCH.z - (k % 2 ? 0.03 : 0.08)) }, 0.38, "inOut"); }
A(RIP + 0.1, "vik", "look", { to: [0.6, 0.6], dur: 0.12, blink: false }); A(RIP + 0.1, "vik", "lean", { to: 10, dur: 0.2 });
narr(r3(RIP + 0.4), "Belt. Tight.", DUR.belt, ["Belt.", "Tight."], 560, 0.04, 230);
see(r3(RIP + 0.5), T.mask - 0.1, ["spud.face", "wiz", "belt"], "the tail is gone: the unbelted Wizard flies at the hole and Spud, held by his belt, has him by the cape");

// ================================================================ 05 MASK 7.0-10.5 (panel 05)
const FACE_S = [AX, 0.81, 0.45], FACE_V = [1.17, 0.82, 0.46];   // where a mask cup sits on each seated face (peek)
set(T.mask, "spudC", { rot: 0 }); c.arm(cut(T.mask), "spud", "R", "lap", 0.01); c.arm(cut(T.mask), "spud", "L", "lap", 0.01); A(cut(T.mask), "spud", "grip", { side: "R", shape: "relaxed", dur: 0 });
set(T.mask, "maskS", { x: FACE_S[0], y: FACE_S[1], z: FACE_S[2], tilt: 0 }); A(T.mask, "spud", "grab", { prop: "maskS", hand: "hat", keep: true });
set(T.mask, "maskV", { tilt: 0 });
// the Wizard hangs on to the seat backs behind them, streaming toward the hole
set(T.mask, "wizC", { x: r3(AX - 0.5), y: 1.2, z: -0.95, rot: 0 }); A(cut(T.mask), "wiz", "pitch", { to: 35, dur: 0.01 });
both(cut(T.mask), "wiz", (s) => ({ world: [r3(AX - 0.5 + (s === "R" ? -0.24 : 0.24)), 1.62, -0.38] }), 0);
A(T.mask, "wiz", "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0 }); for (let k = 0; k < 9; k++) prop(r3(T.mask + 0.36 * k), "wizC", { y: k % 2 ? 1.13 : 1.26 }, 0.36, "inOut");
clock(r3(T.mask + 0.1), T.ridge, 15, 200, 250);
A(T.mask, "vik", "expr", { expr: "dizzy", dur: 0 }); A(T.mask, "vik", "lean", { to: 7, dur: 0.25 }); both(T.mask, "vik", () => ({ o: [0.03, 0.02, 0.32] }), 0.4, "inOut");
A(T.mask + 0.3, "vik", "lean", { to: 3, dur: 0.4 }); A(T.mask + 0.7, "vik", "expr", { expr: "serene", set: { open: 0.12 }, dur: 0.25 });
A(T.mask + 0.7, "vik", "lean", { to: 0, dur: 0.45, ease: "in" }); A(T.mask + 0.7, "vik", "pitch", { to: 15, dur: 0.45, ease: "in" });
A(T.mask, "spud", "expr", { expr: "focused", dur: 0 }); A(T.mask + 0.5, "spud", "look", { to: [-0.9, 0.1], dur: 0.15, blink: false }); A(T.mask + 0.7, "spud", "expr", { expr: "shocked", set: { open: 0 }, dur: 0.12 });
c.arm(T.mask + 1.0, "spud", "R", { world: [r3(BX + 0.2), r3(HANG + 0.04), 0.52] }, 0.3, "out");
prop(T.mask + 1.4, "maskV", { x: FACE_V[0], y: FACE_V[1], z: FACE_V[2], tilt: 0 }, 0.16, "in");
c.arm(T.mask + 1.4, "spud", "R", { world: [r3(FACE_V[0] + 0.2), r3(FACE_V[1] - 0.08), r3(FACE_V[2] + 0.16)] }, 0.16, "in");
sfx(T.mask + 1.56, "slap", { gain: 0.6, reason: "he slams the mask onto Viking's face" }); A(T.mask + 1.56, "vik", "squash", { amount: 0.12, dur: 0.3 });
A(T.mask + 1.6, "vik", "grab", { prop: "maskV", hand: "hat", keep: true });
c.arm(T.mask + 2.0, "spud", "R", { o: [0.08, 0.3, 0.42] }, 0.2, "inOut"); c.arm(T.mask + 2.2, "spud", "R", { o: [0.05, 0.05, 0.32] }, 0.3, "inOut"); A(T.mask + 2.0, "spud", "expr", { expr: "focused", dur: 0.2 });
A(T.mask + 2.3, "vik", "lean", { to: 0, dur: 0.35 }); A(T.mask + 2.3, "vik", "pitch", { to: 0, dur: 0.35 });
A(T.mask + 2.5, "vik", "expr", { expr: "shocked", set: { open: 0 }, dur: 0.12 }); sfx(T.mask + 2.5, "gasp", { gain: 0.6, reason: "Viking comes round" });
A(T.mask + 2.8, "vik", "look", { to: [0.8, 0], dur: 0.2 }); A(T.mask + 3.0, "spud", "look", { to: [0, 0.1], dur: 0.2 });
shake(T.mask, 0.035, 3.4);
narr(T.mask + 0.1, "Mask. Fifteen seconds.", DUR.mask, ["Mask.", "Fifteen seconds."], 1272, 0.0);
see(T.mask + 1.3, T.mask + 2.4, ["spud.face", "vik.face", "maskV"], "his own mask is on; he slams the second one onto Viking, who is passing out");

// ================================================================ 06 OUTSIDE: THE RIDGE 10.5-12.2 (panel 06)
const RIDGE = r3(T.brace - T.ridge);
const over = (x, h) => xyz(out(x, slopeAt(x) + h, 34));
set(T.ridge, "jet", { ...over(326, 27), rot: -90, tip: -4, roll: 9, ...key("tail", 1) });
prop(T.ridge, "jet", { ...over(238, 12), tip: -10, roll: -7 }, RIDGE, "linear");
sfx(T.ridge, "rocket", { gain: 0.6, reason: "the plane bursting out of the cloud, low over the trees" }); sfx(T.ridge, "flamejet", { gain: 0.4, dur: RIDGE, reason: "it is burning" });
sfx(T.ridge + 0.9, "crumble", { gain: 0.6, reason: "a wingtip through the treetops" });
for (const [t, x] of [[0.8, 270], [1.05, 258], [1.3, 246]]) act.landDust(c, r3(T.ridge + t), [r3(x + OX), 47], { color: "#f4f7fb", puffs: 9 });
see(T.ridge + 0.2, T.brace - 0.1, ["jet"], "no tail, on fire, out of the clouds: the mountain behind it, the treetops under its wing");

// ================================================================ 07 BRACE 12.2-14.7 (panel 07)
A(cut(T.brace), "vik", "release", { prop: "maskV", to: [BX, r3(OH_Y + 0.07), 0.4], dur: 0 });
A(cut(T.brace), "spud", "release", { prop: "maskS", to: [AX, r3(OH_Y + 0.07), 0.4], dur: 0 });   // down here he needs no mask: it hangs round his neck from now on
set(T.brace, "neck", { x: AX, y: 0.52, z: 0.4, tip: -50 }); A(T.brace, "spud", "grab", { prop: "neck", hand: "hat", keep: true });
prop(cut(T.brace), "hall", key("view", 1), 0, "linear");
set(T.brace, "wizC", { x: r3(AX - 0.5), y: 0.56, z: -1.2, rot: 0 }); A(cut(T.brace), "wiz", "pitch", { to: -10, dur: 0.01 });   // standing on his seat, clinging to their seat backs
both(cut(T.brace), "wiz", (s) => ({ world: [r3(AX - 0.5 + (s === "R" ? -0.5 : 0.5)), 1.62, -0.4] }), 0);
A(T.brace, "wiz", "expr", { expr: "terrified", set: { open: 0.95 }, dur: 0 }); A(T.brace, "wiz", "look", { to: [0, 0.5], dur: 0, blink: false });
A(T.brace, "spud", "look", { to: [0, -0.3], dur: 0.15 }); A(T.brace, "spud", "expr", { expr: "focused", dur: 0.15 });
both(T.brace + 0.1, "spud", () => ({ o: [-0.02, 0.22, 0.3] }), 0.2, "inOut"); sfx(T.brace + 0.3, "click", { gain: 0.5, reason: "the belt pulled tight" });
A(T.brace + 0.45, "spud", "pitch", { to: 48, dur: 0.4, ease: "inOut" }); both(T.brace + 0.45, "spud", (s) => ({ world: [r3(AX + (s === "R" ? -0.2 : 0.2)), 1.02, 0.84] }), 0.4, "inOut");
A(T.brace + 0.3, "vik", "look", { to: [0.9, -0.2], dur: 0.12 }); A(T.brace + 0.75, "vik", "pitch", { to: 44, dur: 0.4, ease: "inOut" }); A(T.brace + 0.75, "vik", "expr", { expr: "focused", dur: 0.2 });
both(T.brace + 0.75, "vik", (s) => ({ world: [r3(BX + (s === "R" ? -0.22 : 0.22)), 1.05, 0.84] }), 0.4, "inOut");
shake(T.brace, 0.04, 0.9); shake(T.brace + 0.9, 0.06, 0.8); shake(T.brace + 1.7, 0.09, 0.8);
narr(T.brace + 0.1, "Head down. Brace!", DUR.brace, ["Head down.", "Brace!"], 1272, r3(T.slam - 0.03 - T.brace - 0.1 - DUR.brace));
see(T.brace + 1.2, T.slam - 0.1, ["spud", "vik", "wiz.face"], "both folded down in the brace position; the Wizard upright and screaming; trees in every window");

// ================================================================ 08 OUTSIDE: THE SLAM 14.7-16.5 (panel 08)
const jetAt = (u) => { const q = ridePath(u); return { x: r3(q.at[0] + OX), y: r3(q.at[1]), z: r3(q.at[2]), tip: r3(q.pitch) }; };
const U0 = 0.25, U1 = 0.86, SL = r3(T.impact - T.slam), HIT = r3(T.slam + 0.3);
set(T.slam, "jet", { ...jetAt(U0 - 0.06), y: r3(jetAt(U0 - 0.06).y + 7), roll: 0, ...key("brk", 1), ...key("tail", 1), ...key("fire", 1) });
prop(T.slam, "jet", jetAt(U0), 0.3, "in");
for (let k = 0; k < 5; k++) { const a = U0 + ((U1 - U0) * (k + 1)) / 5, t = r3(HIT + ((SL - 0.3) * k) / 5), d = r3((SL - 0.3) / 5); prop(t, "jet", jetAt(a), d, "linear"); prop(t, "plume", { run: r3(a) }, d, "linear"); }
prop(HIT, "jet", key("brk", 0), 0, "linear");   // the left wing rips off
prop(cut(HIT), "rip", { on: 1 }, 0, "linear");
const W0 = out(103, slopeAt(103) + 3, 12);
set(HIT, "wing", { x: W0[0], y: W0[1], z: W0[2], rot: -90, tip: 0, roll: 0 }); prop(HIT, "wing", key("fire", 1), 0, "linear");
prop(HIT, "wing", { x: r3(W0[0] + 16), y: r3(W0[1] + 20), z: r3(W0[2] + 26), rot: 200, tip: 320, roll: 150 }, 1.4, "out");
shake(HIT, 0.1, 1.4);
sfx(HIT, "slam", { gain: 1, loud: true, reason: "the belly hits the mountain" }); sfx(r3(HIT + 0.05), "impact", { gain: 0.9, loud: true, reason: "the wing rips off in a fireball" });
sfx(r3(HIT + 0.05), "rumble", { gain: 0.85, dur: r3(T.edge - HIT + 0.5), reason: "the hull sledging down through snow and trees" });
sfx(r3(HIT + 0.5), "crumble", { gain: 0.6, reason: "trees snapping" }); sfx(r3(HIT + 1.0), "crumble", { gain: 0.6, reason: "trees snapping" });
see(HIT, T.impact - 0.1, ["jet"], "belly first into the slope, a wing torn off in fire, and the cliff edge waiting at the bottom");

// ================================================================ 09 IMPACT INSIDE 16.5-18.3 (panel 09)
park(T.impact, "holeSky", "holeBolt");
prop(cut(T.impact), "smokeP", { scale: 1, ...key("fill", 0.12), ...key("fire", 0.7) }, 0, "linear");   // snow and fire behind the hole now
prop(T.impact + 0.05, "hall", key("bins", 1), 0.15, "out");
shake(T.impact, 0.11, 0.7); shake(T.impact + 0.75, 0.07, 0.5); shake(T.impact + 1.3, 0.05, 0.5);
sfx(T.impact, "impact", { gain: 0.9, loud: true, reason: "the cabin slams down the mountain" });
sfx(T.impact + 0.08, "kenney/impact-plank-medium", { gain: 0.6, reason: "the bins burst open" });
c.drop(T.impact + 0.1, "bag1", { v: [-0.6, -0.5, 4.5], spin: [3, 1, 2] }); c.drop(T.impact + 0.16, "bag2", { v: [-0.9, -0.3, 5], spin: [2, 4, 1] }); c.drop(T.impact + 0.22, "bag3", { v: [-0.5, 0, 4], spin: [5, 1, 3] });
A(T.impact + 0.02, "spud", "squash", { amount: 0.14, dur: 0.3 }); A(T.impact + 0.77, "spud", "squash", { amount: 0.1, dur: 0.3 });
A(T.impact + 0.02, "vik", "squash", { amount: 0.14, dur: 0.3 }); A(T.impact + 0.77, "vik", "squash", { amount: 0.1, dur: 0.3 });
// the Wizard, upright and unbelted, is thrown the length of the cabin over their heads
both(T.impact + 0.02, "wiz", () => WIDE, 0.08, "out");
prop(T.impact + 0.04, "wizC", { x: 1.4, y: 1.7, z: -0.75 }, 0.1, "out"); prop(T.impact + 0.14, "wizC", { x: 1.0, y: 1.75, z: 0.9, rot: -30 }, 0.2, "linear"); A(T.impact + 0.04, "wiz", "pitch", { to: 150, dur: 0.3, ease: "linear" });
prop(T.impact + 0.34, "wizC", { x: 0.55, y: 1.5, z: 2.0 }, 0.14, "linear"); A(T.impact + 0.34, "wiz", "pitch", { to: 260, dur: 0.14, ease: "linear" });
prop(T.impact + 0.48, "wizC", { x: 0.3, y: 0.8, z: 4.6 }, 0.16, "linear");   // on past the camera, out of the shot
sfx(T.impact + 0.6, "thud-soft", { gain: 0.7, reason: "the Wizard lands somewhere up front" }); A(T.impact + 0.8, "wiz", "expr", { expr: "dizzy", dur: 0 });
prop(T.impact + 1.1, "hall", key("lights", 0.15), 0.06); prop(T.impact + 1.2, "hall", key("lights", 0.6), 0.06); prop(T.impact + 1.32, "hall", key("lights", 0.25), 0.1);
narr(T.impact + 0.7, "That is why.", DUR.why, ["That is why."], 700, r3(T.edge - 0.03 - T.impact - 0.7 - DUR.why), 620);
see(T.impact, T.impact + 0.5, ["spud", "vik", "wiz"], "braced and unhurt, while the Wizard pinballs through the cabin");

// ================================================================ 10 OUTSIDE: THE EDGE 18.3-20.1 (panel 10)
set(T.edge, "jet", { x: OX + 9, y: 0, z: 0, tip: 0, roll: 0, rot: -90, ...key("brk", 0), ...key("tail", 1), ...key("fire", 1) });
prop(T.edge, "jet", { x: OX }, 0.55, "out"); park(T.edge, "plume", "wing");
prop(T.edge + 0.55, "jet", { tip: 5 }, 0.5, "out"); prop(T.edge + 1.05, "jet", { tip: -1.5 }, 0.45, "inOut"); prop(T.edge + 1.5, "jet", { tip: 3.5 }, 0.4, "inOut");
sfx(T.edge + 0.55, "creak", { gain: 0.8, reason: "the hull rocks on the cliff edge" }); sfx(T.edge + 1.5, "creak", { gain: 0.7, reason: "and rocks again" });
sfx(T.edge + 0.6, "crumble", { gain: 0.5, reason: "snow and stones falling off the edge" });
sfx(T.edge, "flamejet", { gain: 0.35, dur: r3(T.boom - T.edge), reason: "the wreck burning" });
sfx(T.edge, "windswell", { gain: 0.1, dur: r3(T.car - T.edge), reason: "the cold wind over the snow" });
clock(r3(T.edge + 0.15), T.trunk, 90);
see(T.edge + 0.5, T.trunk - 0.1, ["jet"], "it has stopped with its nose out over the abyss, rocking, on fire");

// ================================================================ 11 LEAVE IT 20.1-22.8 (panel 11)
park(T.trunk, "belt");   // (rows 1 and 2 stay parked: the camera stands there, and Spud in front of his own seat)
prop(cut(T.trunk), "hall", { ...key("view", 2), ...key("lights", 0.35) }, 0, "linear");
standOn(T.trunk, "spud", 0.92, 0.72, 0); standOn(T.trunk, "vik", -0.14, 0.6, -75); pose0(T.trunk, "spud", "vik", "wiz");
both(cut(T.trunk), "spud", () => ({ o: [0.02, 0.02, 0.24] }), 0);   // hands in front of him: the aisle side is Viking's
prop(cut(T.trunk), "smokeP", { ...key("fill", 0.25), ...key("fire", 0.7) }, 0, "linear"); prop(T.trunk, "smokeP", { ...key("fill", 0.55), ...key("fire", 0.9) }, r3(T.crawl - T.trunk - 0.1), "linear");
clock(T.trunk, T.crawl, 88, 800, 400);
// the Wizard, dazed, on the floor behind Spud
set(T.trunk, "wizC", { x: 0.05, y: 0, z: 5.2, rot: 0 });   // up front where he landed, behind the camera A(cut(T.trunk), "wiz", "ride", { prop: "wizC", off: [0, -0.05, 0], yaw: 0, dur: 0 }); A(T.edge + 0.5, "wiz", "pitch", { to: 30, dur: 0.01 });
both(T.edge + 0.5, "wiz", () => ({ o: [0.14, 0.12, 0.2] }), 0);
// Viking hauls his suitcase out of the bin: the whole cabin tips toward the nose
both(cut(T.trunk), "vik", (s) => ({ world: [-0.95, 1.9, r3(0.6 + (s === "R" ? -0.26 : 0.26))] }), 0);
A(T.trunk, "vik", "expr", { expr: "focused", dur: 0 }); A(T.trunk, "vik", "look", { to: [-0.6, 0.7], dur: 0, blink: false });
const UP = [-0.14, 1.78, 0.65];   // the suitcase held over his head, on both palms
prop(T.trunk + 0.3, "trunk", { x: -0.85, y: 2.1, z: 0.6 }, 0.35, "in"); both(T.trunk + 0.3, "vik", (s) => ({ world: [-0.8, 1.9, r3(0.6 + (s === "R" ? -0.26 : 0.26))] }), 0.35, "in");
prop(T.trunk + 0.65, "trunk", { x: UP[0], y: UP[1], z: UP[2] }, 0.4, "out"); prop(T.trunk + 0.65, "vikC", { rot: -12 }, 0.4, "out");
both(T.trunk + 0.65, "vik", (s) => ({ world: [r3(UP[0] + (s === "R" ? -0.3 : 0.3)), r3(UP[1] - 0.3), UP[2]] }), 0.4, "out");
A(T.trunk + 0.7, "vik", "expr", { expr: "happy", set: { open: 0.5 }, dur: 0.15 }); A(T.trunk + 0.7, "vik", "look", { to: [0, 0.8], dur: 0.15, blink: false });
A(T.lurch, "vik", "squash", { amount: 0.1, dur: 0.3 }); sfx(T.lurch, "thud-soft", { gain: 0.6, reason: "the suitcase is out, over his head" });
sfx(T.lurch, "creak", { gain: 0.9, loud: true, reason: "his weight tips the hull further over the edge" }); shake(T.lurch, 0.09, 0.6);
// (no bags slide here: the aisle is one potato wide; the tilt, the shake and their lean carry the lurch)
A(T.lurch + 0.1, "vik", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.12 }); A(T.lurch + 0.1, "vik", "look", { to: [0.5, 0], dur: 0.15 });
A(T.lurch + 0.05, "vik", "lean", { to: -7, dur: 0.3 }); A(T.lurch + 0.05, "spud", "lean", { to: -7, dur: 0.3 });
// Spud, behind him: leave it!
A(T.trunk, "spud", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0 }); A(T.trunk, "spud", "look", { to: [-0.5, 0.25], dur: 0, blink: false });
c.arm(T.lurch + 0.15, "spud", "R", { o: [0.16, 0.5, 0.42] }, 0.45, "inOut"); A(T.lurch + 0.2, "spud", "grip", { side: "R", shape: "point", dur: 0.3 });
A(T.lurch + 0.2, "spud", "expr", { expr: "angry", set: { open: 0.9 }, dur: 0.1 }); A(T.lurch + 0.3, "spud", "hop", { count: 2, height: 0.07, dur: 0.5 });
c.arm(T.crawl - 0.6, "spud", "R", { o: [0.02, 0.02, 0.24] }, 0.5, "inOut"); A(T.crawl - 0.5, "spud", "crouch", { to: 0.6, dur: 0.4 }); A(T.crawl - 0.5, "spud", "pitch", { to: 35, dur: 0.4 });
narr(r3(T.lurch + 0.25), "Leave it!", DUR.leave, ["Leave it!"], 540, 0.25, 760);
see(T.trunk + 0.9, T.crawl - 0.3, ["vik", "trunk", "spud.face"], "Viking has his suitcase, the cabin lurches downhill, Spud screams at him");

// ================================================================ 12 STAY LOW 22.8-25.0 (panel 12)
// a crawl: the body tipped forward on a carrier that slides along the aisle, the hands reaching ahead in turn
function crawl(who, t0, t1, x, z0, z1, { y = -0.05, tip = 38 } = {}) {
  set(t0, `${who}C`, { x, y: 0, z: z0, rot: 0 });
  A(cut(t0), who, "ride", { prop: `${who}C`, off: [0, y, 0], yaw: 0, dur: 0 });
  A(cut(t0), who, "pitch", { to: tip, dur: 0.01 }); A(cut(t0), who, "crouch", { to: 0, dur: 0.01 }); A(cut(t0), who, "lean", { to: 0, dur: 0.01 });
  both(cut(t0), who, () => ({ o: [0.14, 0.12, 0.2] }), 0);
  prop(t0, `${who}C`, { z: z1 }, r3(t1 - t0), "linear");
  for (let t = t0, k = 0; t < t1 - 0.3; t += 0.42, k++) { c.arm(r3(t), who, k % 2 ? "L" : "R", { o: [0.12, 0.3, 0.52] }, 0.2, "out"); c.arm(r3(t + 0.21), who, k % 2 ? "L" : "R", { o: [0.14, 0.12, 0.2] }, 0.2, "in"); }
}
for (const id of FRONT_SEATS) set(T.crawl, id, { y: 0 });
prop(cut(T.crawl), "smokeP", { ...key("fill", 1), ...key("fire", 1) }, 0, "linear");
crawl("spud", T.crawl, T.door, 0.18, 5.4, 7.1); crawl("vik", T.crawl, T.door, -0.22, 3.2, 5.2); crawl("wiz", T.crawl, T.door, -0.12, 0.2, 2.2);
A(cut(T.crawl), "spud", "grip", { side: "R", shape: "relaxed", dur: 0 });
set(T.crawl, "trunk", { x: -0.22, y: 0.3, z: 2.1, tip: 90 }); prop(T.crawl, "trunk", { z: 4.1 }, r3(T.door - T.crawl), "linear");
sfx(T.crawl, "scrape", { gain: 0.35, dur: 2.0, reason: "Viking drags the suitcase along the floor" });
A(T.crawl, "spud", "expr", { expr: "focused", dur: 0 }); A(T.crawl, "spud", "look", { to: [0, 0.4], dur: 0, blink: false });
A(T.crawl, "vik", "expr", { expr: "focused", dur: 0 }); A(T.crawl, "vik", "look", { to: [0, 0.25], dur: 0, blink: false });
clock(r3(T.crawl + 0.05), T.door, 40, 205, 940);
shake(T.crawl + 0.9, 0.05, 0.4); sfx(T.crawl + 0.9, "creak", { gain: 0.7, reason: "the hull tips again" });
narr(T.crawl + 0.15, "Stay low.", DUR.low, ["Stay low."], 640);
see(T.crawl + 0.3, T.door - 0.2, ["spud.face"], "Spud crawls under the black smoke, fire along the ceiling behind him");

// ================================================================ 13 THE DOOR 25.0-27.2 (panel 13)
park(T.door, "hall", "smokeP", "seatA", "seatB", ...FRONT_SEATS, "bag1", "bag2", "bag3");
prop(cut(T.door), "smokeP", { scale: 0 }, 0, "linear");
set(T.door, "slideP", { y: DOOR[1], ...key("inflate", 1) });
prop(cut(T.door), "jet", { tip: 4 }, 0, "linear");
pose0(T.door, "spud", "vik", "wiz");
const KICK = r3(T.door + 0.6);
// the suitcase, jammed sideways in the door frame, is kicked out and goes over the edge
set(T.door, "trunk", { x: DOOR[0], y: r3(DOOR[1] + 0.75), z: r3(DOOR[2] + 0.12), rot: 0, tip: 0, roll: 38 });
for (const t of [0.12, 0.36]) { prop(r3(T.door + t), "trunk", { z: r3(DOOR[2] + 0.22) }, 0.06, "out"); prop(r3(T.door + t + 0.06), "trunk", { z: r3(DOOR[2] + 0.12) }, 0.1, "in"); sfx(r3(T.door + t), "thud-soft", { gain: 0.7, reason: "a kick against the jammed suitcase" }); }
sfx(KICK, "slam", { gain: 0.9, loud: true, reason: "Spud kicks it out with both feet" });
prop(KICK, "trunk", { x: r3(DOOR[0] - 5.5), y: 3.0, z: r3(DOOR[2] + 3.4), rot: 220, tip: 300, roll: 200 }, 0.45, "out");
prop(r3(KICK + 0.45), "trunk", { x: r3(DOOR[0] - 9), y: -30, z: r3(DOOR[2] + 5), rot: 500, tip: 700 }, 1.0, "in");
sfx(r3(KICK + 0.5), "whistle", { gain: 0.35, reason: "the suitcase falling into the abyss" });
// Spud comes out feet first and goes down the slide
const slideAt = (u) => [DOOR[0], r3(DOOR[1] * (1 - u)), r3(DOOR[2] + (SLIDE_END[2] - DOOR[2]) * u)];
const rideSlide = (who, t0, t1, off = 0.15) => { const a = slideAt(0.1), b = slideAt(1); prop(r3(t0 - 0.1), `${who}C`, { x: a[0], y: a[1], z: a[2] }, 0.1, "inOut"); prop(r3(t0 + 0.02), `${who}C`, { y: b[1], z: b[2] }, r3(t1 - t0), "linear"); A(t0, who, "ride", { prop: `${who}C`, off: [0, off, 0], yaw: 0, sit: true, dur: 0 }); sfx(t0, "zip", { gain: 0.5, reason: `${who} down the slide` }); };
const IN = (dz, dx = 0) => ({ x: r3(DOOR[0] + dx), y: r3(DOOR[1] + 0.02), z: r3(DOOR[2] - dz) });   // a place inside the hull, behind the door
set(T.door, "spudC", { ...IN(0.75), y: r3(DOOR[1] + 0.1), rot: 0 }); A(cut(T.door), "spud", "ride", { prop: "spudC", off: [0, 0.15, 0], yaw: 0, sit: true, dur: 0 });
both(cut(T.door), "spud", () => ({ o: [0.06, 0.3, 0.05] }), 0);
prop(KICK, "spudC", { z: r3(DOOR[2] + 0.45) }, 0.3, "out");
A(cut(T.door), "spud", "pitch", { to: -50, dur: 0.01 }); A(T.door, "spud", "expr", { expr: "angry", set: { open: 0.5 }, dur: 0 });
A(r3(KICK + 0.25), "spud", "pitch", { to: -12, dur: 0.3 }); rideSlide("spud", r3(KICK + 0.42), r3(KICK + 1.3));
prop(r3(KICK + 1.34), "spudC", { z: r3(SLIDE_END[2] + 1.4) }, 0.4, "out");
// Viking in the doorway, reaching after his suitcase; the Wizard shoves him down the slide
set(T.door, "vikC", { ...IN(1.7, 0.2), y: r3(DOOR[1] - 0.75), rot: -70 }); A(cut(T.door), "vik", "ride", { prop: "vikC", off: [0, 0, 0], yaw: 0, dur: 0 });
set(T.door, "wizC", { ...IN(2.7, -0.2), y: r3(DOOR[1] - 0.9), rot: 0 }); A(cut(T.door), "wiz", "ride", { prop: "wizC", off: [0, 0, 0], yaw: 0, dur: 0 });
both(cut(T.door), "vik", "rest", 0); both(cut(T.door), "wiz", "rest", 0);
prop(r3(KICK + 0.62), "vikC", { x: r3(DOOR[0] - 0.1), y: r3(DOOR[1] + 0.02), z: r3(DOOR[2] + 0.1) }, 0.22, "out");
A(r3(KICK + 0.5), "vik", "expr", { expr: "sad", set: { open: 0.7 }, dur: 0 }); c.arm(r3(KICK + 0.7), "vik", "R", { o: [0.2, 0.6, 0.5] }, 0.15, "out"); A(r3(KICK + 0.5), "vik", "look", { to: [0.2, -0.3], dur: 0, blink: false });
sfx(r3(KICK + 1.08), "slap", { gain: 0.5, reason: "the Wizard shoves him" }); prop(r3(KICK + 1.0), "vikC", { rot: 0 }, 0.15, "out");
rideSlide("vik", r3(KICK + 1.15), r3(KICK + 2.05));
prop(r3(KICK + 0.78), "wizC", { x: DOOR[0], z: r3(DOOR[2] - 0.78) }, 0.3, "inOut"); prop(r3(KICK + 1.27), "wizC", { y: r3(DOOR[1] + 0.02), z: r3(DOOR[2] + 0.1) }, 0.16, "out"); A(r3(KICK + 1.1), "wiz", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0 });
// (the Wizard is still in the doorway when we cut to the run: his first step onto the slide popped his feet a frame before the cut)
see(T.door + 0.4, r3(KICK + 0.9), ["trunk", "spud"], "the jammed suitcase is kicked out and drops into the abyss; Spud comes down the slide");

// ================================================================ 14 RUN 27.2-29.4 (panel 14)
park(T.run, "slideP", "trunk");
const LANE = { spud: -10.5, vik: -11.9, wiz: -9.2 }, RUN = { spud: [56, 66.6], vik: [54.6, 65.2], wiz: [55, 65.4] };
for (const w of ["spud", "vik", "wiz"]) {
  A(cut(T.run), w, "ride", { prop: null, dur: 0 }); pose0(T.run, w);
  A(cut(T.run), w, "move", { to: [r3(LANE[w] + OX), RUN[w][0]], dur: 0.01, steps: 0, ease: "linear" }); A(cut(T.run), w, "turn", { to: 0, dur: 0.01, ease: "linear" });
  A(T.run, w, "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0 }); A(T.run, w, "look", { to: [0, 0.1], dur: 0, blink: false });
}
for (const w of SAFE ? ["spud", "vik", "wiz"] : ["vik", "wiz"]) A(T.run, w, "move", { to: [r3(LANE[w] + OX), RUN[w][1]], dur: r3(T.boom + 0.3 - T.run), ease: "linear" });
// the hull tips over the edge behind them
prop(T.run, "jet", { tip: 16, x: OX - 4 }, 1.5, "in"); prop(T.run + 1.5, "jet", { tip: 62, x: OX - 17, y: -16 }, 0.6, "in"); prop(T.run + 2.1, "jet", { y: -90, x: OX - 24, tip: 85 }, 0.3, "linear");
sfx(T.run + 0.2, "creak", { gain: 0.9, loud: true, reason: "the hull going over" }); sfx(T.run + 1.5, "crumble", { gain: 0.8, reason: "the edge breaking away under it" });
clock(T.run, T.boom, 2, 205, 480);
narr(T.run, "Run. Do not look back.", DUR.run, ["Run.", "Do not look back."], 640, 0.02);
see(T.run + 0.3, T.boom - 0.1, ["spud.face", "jet"], "they run at us through the snow while the hull tips over the cliff behind them");

// ================================================================ 15 / 16 THE BLAST: two endings
prop(cut(T.boom), "blast", { on: 1 }, 0, "linear"); prop(cut(T.boom + 0.3), "blast2", { on: 1 }, 0, "linear");
sfx(T.boom, "impact", { gain: 1, loud: true, reason: "0:00: it blows up at the bottom of the cliff" }); sfx(T.boom + 0.05, "rumble", { gain: 0.9, dur: 2.2, reason: "the blast rolling up the mountain" });
c.at(T.boom, { fx: "flash", peak: 0.55, dur: 0.14, sound: false });
clock(T.boom, r3(T.boom + 0.8), 0, 205, 480);
if (SAFE) {
  // A: far enough. The blast wave throws them face first into the snow, unhurt
  shake(T.boom + 0.25, 0.09, 0.6);
  const D = r3(T.boom + 0.3), LAND = { spud: [-10.5, 67.3], vik: [-11.9, 65.9], wiz: [-9.1, 66.1] };
  for (const w of ["spud", "vik", "wiz"]) {
    both(r3(D - 0.1), w, () => ({ o: [0.3, 0.5, 0.4] }), 0.48, "inOut"); A(D, w, "pitch", { to: 84, dur: 0.4, ease: "in" });
    A(D, w, "move", { to: [r3(LAND[w][0] + OX), LAND[w][1]], y: -0.26, dur: 0.4, steps: 0, ease: "linear" });
    A(r3(D + 0.4), w, "move", { to: [r3(LAND[w][0] + OX), r3(LAND[w][1] + 0.22)], y: -0.26, dur: 0.35, steps: 0, ease: "out" });
    act.landDust(c, r3(D + 0.38), [r3(LAND[w][0] + OX), LAND[w][1]], { color: "#f4f7fb", puffs: 10 });
  }
  A(D, "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.08 });
  sfx(D + 0.38, "thud-soft", { gain: 0.6, reason: "they land face first in the snow" });
  A(D + 1.0, "spud", "pitch", { to: 32, dur: 0.45, ease: "inOut" }); A(D + 1.0, "spud", "move", { to: [r3(LAND.spud[0] + OX), r3(LAND.spud[1] + 0.22)], y: -0.06, dur: 0.45, steps: 0, ease: "inOut" }); A(D + 1.05, "spud", "look", { to: [0, 0.35], dur: 0.2 });
  A(D + 1.1, "spud", "expr", { expr: "shocked", set: { open: 0.25 }, dur: 0.25 });
  A(D + 1.7, "spud", "expr", { expr: "sad", set: { open: 0.12, curve: 0.15 }, dur: 0.3 }); A(D + 1.7, "spud", "droop", { to: 1, dur: 0.5 });
  A(T.car - 0.4, "spud", "expr", { expr: "serene", dur: 0.25 });
  narr(T.boom + 0.9, "That is why you are alive.", DUR.alive, ["That is why you are alive."], 640, 0.1);
  see(D + 1.0, T.car - 0.1, ["spud.face", "blast"], "the fireball rises out of the abyss far behind him and he is alive");
} else {
  // B: he stopped a short way from the edge and turned round to look
  const B0 = out(-11, 0, 22);
  A(cut(T.run), "spud", "move", { to: [B0[0], 40], dur: 0.01, steps: 0, ease: "linear" }); A(T.run, "spud", "move", { to: [B0[0], 44], dur: 0.9, ease: "out" });
  A(T.run + 0.9, "spud", "turn", { to: 185, dur: 0.6, ease: "inOut" }); A(T.run + 0.9, "spud", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.2 });
  A(cut(T.boom), "spud", "move", { to: [B0[0], B0[2]], dur: 0.01, steps: 0, ease: "linear" }); A(cut(T.boom), "spud", "turn", { to: 195, dur: 0.01, ease: "linear" });
  c.arm(cut(T.boom), "spud", "L", "rest", 0.01); c.arm(cut(T.boom), "spud", "R", "rest", 0.01);
  for (const w of ["vik", "wiz"]) { A(T.boom + 0.2, w, "pitch", { to: 80, dur: 0.3, ease: "in" }); }
  shake(T.boom, 0.1, 0.9);
  A(T.boom + 0.04, "spud", "turn", { to: 25, dur: 0.22, ease: "out" }); A(T.boom + 0.04, "spud", "expr", { expr: "terrified", set: { open: 0.3 }, dur: 0.08 });
  A(T.boom + 0.3, "spud", "expr", { expr: "serene", set: { open: 0.35, curve: -0.5 }, dur: 0.12 }); A(T.boom + 0.3, "spud", "face", { brow: -0.7, dur: 0.12 });
  A(T.boom + 0.25, "spud", "droop", { to: 1, dur: 0.15 }); A(T.boom + 0.3, "spud", "pitch", { to: 14, dur: 0.2 });
  both(T.boom + 0.2, "spud", () => ({ o: [0.32, 0.3, 0.2] }), 0.2, "out");
  c.at(r3(T.boom + 0.3), { fx: "speedlines", dur: 1.2 });
  c.at(r3(T.car - 0.75), { fx: "flash", peak: 1, dur: 0.75, sound: false });
  narr(T.boom + 0.5, "You looked back.", DUR.looked, ["You looked back."], 640);
  see(T.boom, T.boom + 0.5, ["spud.face", "blast2"], "he stopped to look back, close to the edge, and the blast reaches him");
}

// ================================================================ THE NEXT ONE (old panel 12), through the same eyelids
A(0, "spud2", "sit", { seat: "seat-drv", dur: 0.01, hands: "keep" });
A(0, "spud2", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "spud2", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "spud2", "R", { prop: "wheel", grip: "R" }, 0.01); c.arm(0, "spud2", "L", { prop: "wheel", grip: "L" }, 0.01);
A(0, "spud2", "expr", { expr: "serene", dur: 0 }); A(0, "spud2", "droop", { to: 0.8, dur: 0 });
prop(0, "lids2", key("lids", 1), 0, "linear");
A(cut(T.car), "spud2", "pov", { on: true }); A(cut(T.wheel), "spud2", "pov", { on: false });
// one slow opening, no second blink: over the bright sky a three-frame blink was six brightness jumps in a second (strobe fail on the first full render)
set(T.car, "lids2", key("lids", 0.2)); prop(T.car, "lids2", key("lids", 1), 0.5, "linear");
A(T.wheel, "spud2", "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0 }); A(T.wheel, "spud2", "droop", { to: 0, dur: 0 });
A(T.wheel + 0.05, "spud2", "squash", { amount: 0.1, dur: 0.25 }); A(T.wheel + 0.4, "spud2", "look", { to: [0, -0.5], dur: 0.15, blink: false });
c.at(r3(T.wheel + 0.2), { fx: "sweat", who: "spud2", dur: 0.9, count: 4 });
sfx(T.car, "screech", { gain: 0.8, loud: true, reason: "the smash cut: tyres leaving the broken bridge" });
sfx(T.car + 0.05, "windswell", { gain: 0.6, dur: 1.7, reason: "the car in the air" });
narr(T.car + 0.3, "You wake up mid car crash.", DUR.car, ["You wake up", "mid car crash."], 500);
see(T.wheel + 0.1, T.end, ["spud2.face", "wheel"], "the same eyes snap open at the wheel of a car in mid-air");

// ---------------------------------------------------------------- shots
const beats = c.beats([
  ["the blink", 0, CAM.pov, "hook"],
  ["his face", T.face, CAM.face],
  ["the fall", T.fall, CAM.fall, "reveal"],
  ["the tail tears off", T.tear, CAM.tear, "escalation"],
  ["mask", T.mask, CAM.masks],
  ["the ridge", T.ridge, CAM.ridge],
  ["brace", T.brace, CAM.brace],
  ["the slam", T.slam, CAM.slam, "escalation"],
  ["impact", T.impact, CAM.impact],
  ["the edge", T.edge, CAM.edge],
  ["leave it", T.trunk, CAM.trunk],
  ["the lurch", T.lurch, CAM.lurch],
  ["stay low", T.crawl, CAM.crawl],
  ["the door", T.door, CAM.door],
  ["run", T.run, CAM.run],
  [SAFE ? "alive" : "he looked back", T.boom, SAFE ? CAM.safe : CAM.close, "payoff"],
  ["the next blink", T.car, CAM.carpov],
  ["the next one", T.wheel, CAM.car],
], T.end);

// ---------------------------------------------------------------- check windows (only what a beat needs or a hollow shell the check boxes)
const WINDOWS = [
  ...["spud", "vik", "wiz"].map((who) => ({ who, with: "hall", from: 0, to: T.door, checks: ["clipping"], reason: "they are inside the cabin: the hall is a hollow shell round them and the check takes its box" })),
  { who: "spud", with: "belt", from: 0, to: T.trunk, checks: ["clipping"], reason: "he wears the seat belt (the beat: belt tight)" },
  { who: "spud", with: "seatA", from: 0, to: T.trunk, checks: ["clipping", "costume-in-prop", "arm-in-prop", "hand-in-prop"], reason: "he sits in this seat (on a carrier, so the seat can shake): body in the seat, forearms on its armrests" },
  { who: "vik", with: "seatB", from: 0, to: T.trunk, checks: ["clipping", "costume-in-prop", "arm-in-prop", "hand-in-prop"], reason: "he sits in this seat, wider than it: forearms on its armrests" },
  { who: "vik", with: "seatA", from: T.mask, to: T.ridge, checks: ["arm-in-prop", "hand-in-prop"], reason: "passed out, his elbow lies on the armrest the two seats share" },
  { who: "spud", from: r3(T.brace + 0.45), to: T.edge, checks: ["face-covered"], reason: "the brace position: both hands over his own head" },
  { who: "vik", from: r3(T.brace + 0.75), to: T.edge, checks: ["face-covered"], reason: "the brace position: both hands over his own head" },
  ...["spud", "vik", "wiz"].map((who) => ({ who, with: "jet", from: T.door, to: T.run, checks: ["clipping", "hand-in-prop", "arm-in-prop"], reason: "they come out of the wreck's door: inside the hull until then, the check takes the hull's box" })),
  { who: "vik", with: "trunk", from: r3(T.trunk + 0.3), to: T.crawl, checks: ["hand-in-prop"], reason: "he carries the suitcase over his head on both palms (the beat)" },
  { who: "vik", with: "wiz", from: T.door, to: r3(T.door + 1.5), checks: ["face-covered"], reason: "both wait inside the hull behind the door: the camera is outside" },
  ...["spud", "vik", "wiz"].map((who) => ({ who, with: "slideP", from: T.door, to: T.run, checks: ["clipping"], reason: "they ride down the slide (the contact the beat needs)" })),
];
const DARK = [[0, 0.75], [T.ridge, 0.75], [T.ridge, 0.5], [T.slam, 0.5], [T.slam, 0.35], [T.car, 0.35], [T.car, 0]];
write(import.meta.url, {
  id: `wake-up-mid-plane-crash-${VARIANT.toLowerCase()}`,
  title: "You wake up mid plane crash",
  idea: `You wake up mid EP01 (pilot, v4 10x), ending ${VARIANT}: you wake up in an airliner falling out of a thunderstorm; the tail tears off, it belly-lands on a mountain and stops on a cliff edge; ${SAFE ? "he gets out and far enough and lives" : "he stops to look back and the blast reaches him"}; he wakes up mid car crash`,
  format: "series: You wake up mid (opens on a first-person blink; the narrator reads the title at 0.0 and then only short commands; on-screen clocks; ends in the next scenario)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1360],   // the clocks sit top left where three bodies fill the lower frame (the app's safe zone starts at 210)
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "snowslope", cliff: { x: CLIFF }, at: [OX, 0, 0], dark: DARK, para: 0, aperture: 0, focus: false, bloom: "emissive", lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  music: { style: "danger", lowCut: 150, gain: 0.4, parts: [{ at: 0, part: "main" }, { at: r3(T.brace), part: "build" }, { at: r3(T.slam + 0.3), part: "drop" }, { at: r3(T.run), part: "build" }, { at: T.boom, part: "drop" }] },
  sound: { sfx: 0.65, ambience: 0.06, guard: true },
  creative: { length: [T.end, T.end] },
  hook: { show: ["fly1"], hint: 0, what: "through his own blinking eyelids: the cabin pointing down, alarm lights, bags flying at him" },
  rigs,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: WINDOWS,
  notes: "Generated by storyboards/series/you-wake-up-mid/01-plane-crash/make-plane-crash.mjs. Spec: PANELS.md.",
});
