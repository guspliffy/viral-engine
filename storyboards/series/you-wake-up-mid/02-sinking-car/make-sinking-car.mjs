// You wake up mid, EP02 "mid sinking car" (12 Nov 2026). Jonny picked the scenario (16:02 Berlin), the 12-panel Codex
// sheet (board.png, "Build now" 16:40). Outline + facts: OUTLINE.md; panels by line and number: PANELS.md; the new looks
// (lake world above and below the water, cabin water, glass, burst): DESIGN.md (Fable 5.2); working memory: NOTES.md.
//
// Story chain: Spud wakes at the wheel as the car flies off the snapped bridge -> it hits the lake -> it floats, water
// comes in, a clock starts at 1:00 -> belt off -> Mash calls (no phone) -> Mash shoves his door (not the door: the water
// holds it) -> the window moves 2 cm and the electrics die -> Spud breaks the SIDE window with the headrest's prongs, the
// lake pours in -> the water reaches Chip's chest: the small one out first -> the car tilts nose down, Spud follows, drags
// Mash out by his hoodie -> they swim up while the car sinks away -> the shore, all alive: "One minute. That is all you
// get." -> his eyes close and open in a smoky bedroom: "You wake up mid house fire." (the series loop).
//
// World (DESIGN 1): x right, y up, z = the car's heading, metres; the lake surface is y 0, the impact point the origin; the
// near bridge stump's broken lip at z -14, deck top y 14; the shore (SHORE) about 34 m toward +x. The car is a rig
// ("hatchback", front +z, the driver at +x); the three inside it are rig cast (spud, mash, chip); outside the car the same
// three are world cast (spudW, mashW, chipW), swapped on cuts.
import { readFileSync } from "node:fs";
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";

const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 470 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;

const c = clip({ faces: FACES, lines: LINES }), { A, see, prop } = c;
// NOAI=1: leave out the T3 sounds (staging runs before they are generated and whitelisted)
const WL = readFileSync(new URL("../../../../assets/sfx/whitelist.json", import.meta.url), "utf8");   // a sound still being made (T4) is left out until it is whitelisted
const sfx = (t, name, o) => ((process.env.NOAI && name.startsWith("ai/")) || (name.startsWith("ai/") && !WL.includes(`"${name}"`)) ? null : c.sfx(t, name, o));
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- the timeline (s)
// Each narrator line as long as voice "narrator" reads it (VoxCPM2, measured 12 Nov in this container, out/speech).
const DUR = { wake: 3.11, belt: 2.09, phone: 0.93, door: 1.02, window: 1.99, small: 1.39, out: 0.48, leave: 0.79, up: 0.5, minute: 3.0, fire: 1.74 };
const T = {
  // OPENS ON THE CRASH (storytelling-study input 12 Nov: EP01's eyelid opening lost most viewers by 0:02; danger at
  // frame 0 held best). Panel order 03, 01, 02, 04... (asked Jonny; the panel-order cut is make-sinking-car.panel-order.mjs.bak)
  // Jonny 12 Nov 18:56 on draft 1: "the first second should be one see the car crashing over the bridge and then the
  // second scene the car flying" -> two outside shots before the eyelids.
  // Jonny 19:55 on draft 2: "the first scene should be 1st person perspective" -> 01 POV over the edge, then 03 outside.
  crash: 0,       // 01 first person at the wheel, his eyes snap open: the broken end rushes up, over the edge
  fly: 1.2,       // 03 wide: the car flying, nose dropping, into the lake
  lip: 0.9,       //    the front wheels leave the deck (10 m/s on the deck; a 14 m fall takes 1.69 s)
  hit: 2.59,      //    the impact
  face: 3.0,      // 02 his face at the wheel, after the impact
  cabin: 4.3,     // 04 inside: it floats, water at their feet, 1:00
  phone: 7.0,     // 05 Mash dials, Spud knocks the phone down
  door: 9.0,      // 06 Mash shoves his door
  button: 11.5,   // 07 the window button, the lights die, 0:40
  rest: 12.9,     // 08 he rips out the headrest
  burst: 13.8,    //    the side window bursts
  back: 16.0,     // 09 back seat: Chip, water to his chest
  out: 19.0,      // 10 underwater, outside: the car tilts, Chip kicks free, Spud squeezes out, 0:15
  drag: 21.5,     //    at the window from outside: Mash still at his door
  pull: 22.9,     //    Spud drags Mash out
  deep: 24.0,     // 11 underwater wide: the car sinks away, they kick up
  rise: 26.4,     //    looking up into the bright window
  surf: 27.0,     //    they burst through the surface, 0:00
  swim: 28.2,     //    they swim to the reeds
  shore: 30.0,    // 12 the shore, all three alive
  close: 33.55,   //    his eyes close
  fire: 34.0,     //    POV: a smoky bedroom, the alarm
};
T.end = T.fire;   // the burning house is its own clip (make-sinking-car-fire.mjs, set energyroom), joined after this one

// ---------------------------------------------------------------- the car (DESIGN 2 "The car's fall"; pitch = nose down, degrees)
const CARKEYS = [
  // on the deck (y 14) at 10 m/s, off the lip at z -14, then a free fall: y = 14 - 4.9 (t - lip)^2 (z slows to 8.3 m/s so it lands on the origin)
  [0, [0, 14.0, -23.0], 0], [T.lip, [0, 14.0, -14.0], 2], [1.2, [0, 13.56, -11.5], 7], [1.6, [0, 11.6, -8.2], 14],
  [2.0, [0, 8.07, -4.9], 22], [2.3, [0, 4.4, -2.4], 29], [T.hit, [0, -0.25, 0], 34],
  [2.93, [0, -1.0, 0.5], 18], [3.43, [0, -0.25, 0.8], -2], [3.9, [0, -0.55, 0.8], 4], [T.cabin, [0, -0.45, 0.8], 3],
  [7.0, [0, -0.7, 0.8], 5], [9.0, [0, -1.1, 0.8], 7], [11.5, [0, -1.3, 0.8], 9], [T.burst, [0, -1.47, 0.8], 10],
  [T.back, [0, -1.7, 0.8], 14], [T.out, [0, -2.2, 0.8], 25], [T.drag, [0, -3.2, 0.9], 35], [T.deep, [0, -5.0, 1.0], 40],
  [26.5, [0, -7.0, 1.1], 20], [T.end, [0, -7.0, 1.1], 20],
];
const PIVOT = [0, 0.5, 0];
const carAt = (t) => {   // the rig's pos and pitch at t (linear between keys, as the rig tween reads them in a fix round)
  let k = 0; while (k < CARKEYS.length - 2 && CARKEYS[k + 1][0] <= t) k++;
  const [t0, p0, a0] = CARKEYS[k], [t1, p1, a1] = CARKEYS[k + 1], u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  return { pos: p0.map((v, i) => v + (p1[i] - v) * u), pitch: a0 + (a1 - a0) * u };
};
// a point in the car's frame -> the world at t (pitch about x through the pivot, nose down)
const carToWorld = (t, [x, y, z]) => {
  const { pos, pitch } = carAt(t), p = rad(pitch), ry = y - PIVOT[1], rz = z - PIVOT[2];
  return [r3(pos[0] + x), r3(pos[1] + PIVOT[1] + ry * Math.cos(p) - rz * Math.sin(p)), r3(pos[2] + PIVOT[2] + ry * Math.sin(p) + rz * Math.cos(p))];
};
const rigs = [{ id: "car", kind: "hatchback", color: "#c8372d", pivot: PIVOT, keys: CARKEYS.map(([at, pos, pitch]) => ({ at, pos, yaw: 0, pitch, roll: 0 })) }];

// the lake surface is not drawn inside the car's footprint while it floats (set stormlake key "hole")
const HOLE = [[0, null], [r3(T.hit - 0.02), [0, 0.8, 0, 1.6, 1.0]], [T.drag, [0, 0.9, 0, 1.6, 1.0]], [r3(T.drag + 0.01), null]];

// ---------------------------------------------------------------- the cabin (friends-try-to 05's seat table)
const SEAT_Y = 0.06;
const SEATS = { drv: [0.55, 0.2, 0.06], pas: [-0.55, 0.2, 0.06], rl: [0.45, -0.98, 0.34], rr: [-0.45, -0.98, 0.34] };
const seatAt = (s) => [SEATS[s][0], r3(SEATS[s][1] + 0.03)];
const WIN = [0.6, 1.12, 0.05];          // the driver's window opening's middle (car frame); T2 reads the real opening
// the water inside, car-frame y at the cabin's middle (T2 measured: floor 0.36, front cushions 0.545, rear 0.825, sill 0.90, drawn to 1.94)
const LEVEL = [[T.cabin, 0.44], [7.0, 0.52], [9.0, 0.66], [11.5, 0.8], [T.burst, 0.9], [14.8, 1.02], [T.back, 1.1], [17.6, 1.2], [18.4, 1.55], [T.out, 1.94]];   // Chip's chest through 09

// ---------------------------------------------------------------- cameras (pos, look, fov), one per panel; rig ones in the car's frame
const CAM = {
  pov: { rig: "car", pos: [0.55, 1.3, 0.55], look: [0.25, 1.1, 8], fov: 70 },                                                // 01
  face: { rig: "car", pos: [0.55, 1.8, 2.95], look: [0.55, 1.25, 0.2], fov: 40, to: { pos: [0.55, 1.75, 2.7] }, dur: 1.25, ease: "out" },   // 02
  crash: { pos: [4.3, 15.3, -11.2], look: [0, 14.5, -18.5], fov: 48, to: { look: [-0.3, 13.6, -11.0] }, dur: 0.95, ease: "inOut" },   // on the deck by the broken end
  fall: { pos: [5, 2.5, 7.5], look: [0, 13.0, -10.5], fov: 55, to: { look: [0, 1.0, -0.5] }, dur: 1.4, ease: "inOut" },             // 03
  cabin: { rig: "car", pos: [0.05, 2.15, 3.3], look: [0.05, 1.0, -0.2], fov: 58 },                                                 // 04 through the windscreen
  phone: { rig: "car", pos: [0.05, 1.8, 3.0], look: [0.0, 1.2, 0.2], fov: 50 },                                               // 05
  door: { rig: "car", pos: [-2.3, 1.4, 0.35], look: [-0.4, 1.15, 0.25], fov: 42 }, // outside his window water halfway up the door,                                            // 06
  button: { rig: "car", pos: [1.0, 1.6, 2.4], look: [0.65, 1.0, 0.25], fov: 42 },                                            // 07
  burst: { rig: "car", pos: [2.4, 1.2, 0.5], look: [0.6, 1.15, 0.2], fov: 45 }, // outside, under the water: the side window bursts inward                                           // 08
  back: { rig: "car", pos: [-0.3, 1.45, -0.25], look: [0.45, 1.2, -0.98], fov: 60 }, // from the empty rear footwell                                              // 09
  out: { pos: [4.5, -1.4, 2.8], look: [1.2, -1.4, 1.0], fov: 55 },                                                           // 10
  drag: { pos: [4.2, -2.2, 3.2], look: [1.0, -2.5, 1.2], fov: 50 },
  pull: { pos: [4.5, -2.8, 4.0], look: [1.4, -3.0, 1.3], fov: 50 },
  deep: { pos: [5.0, -5.2, 4.5], look: [1.5, -2.5, 1.2], fov: 60 },                                                          // 11
  rise: { pos: [3.5, -3.4, 3.5], look: [1.9, -0.6, 1.0], fov: 60 },
  surf: { pos: [4.6, 0.5, 3.4], look: [2.0, 0.1, 0.4], fov: 40 },
  swim: { pos: [19.8, 1.0, 0.8], look: [22.8, 0.1, -3.6], fov: 45, to: { pos: [23.8, 1.0, 0.4], look: [26.8, 0.15, -4.4] }, dur: 1.8, ease: "inOut" },
  shore: { pos: [37.6, 2.4, -3.6], look: [34.4, 1.3, -6.0], fov: 45 },                                                       // 12
  close: { pos: [34.5, 2.3, -7.6], look: [34.5, 0.9, -5.4], fov: 38 },
};

// ---------------------------------------------------------------- cast
const inCar = (id, character, seat, o = {}) => ({ id, character, rig: "car", at: seatAt(seat), face: "camera", expr: "terrified", follow: 0.25, shadowFall: 0.001, ...o });
const SHORE = [34.5, 0.4, -6];   // DESIGN 1.1 (T1 exports STORMLAKE.SHORE; check after T1)
const cast = [
  inCar("spud", "potatobrawl/spud", "drv", { seed: 2.9 }),
  inCar("mash", "potatobrawl/mash", "pas", { seed: 5.6 }),
  inCar("chip", "potatobrawl/chip", "rl", { seed: 3.4 }),
  { id: "spudW", character: "potatobrawl/spud", at: [0.9, 0.1], face: 90, expr: "terrified", follow: 0.3, seed: 2.9 },
  { id: "mashW", character: "potatobrawl/mash", at: [0.9, -0.4], face: 90, expr: "terrified", follow: 0.3, seed: 5.6 },
  { id: "chipW", character: "potatobrawl/chip", at: [1.1, 0.5], face: 90, expr: "terrified", follow: 0.3, seed: 3.4 },
];

// ---------------------------------------------------------------- props
const props = [
  ...Object.entries(SEATS).map(([s, [x, z, dy]]) => ({ id: `seat-${s}`, kind: "carseat", rig: "car", x, y: SEAT_Y + dy, z, color: "#59535f", trim: "#6e6875", width: 0.86, ...(s === "drv" && { head: false }) })),
  { id: "wheel", kind: "steer", rig: "car", x: 0.55, y: 0.88, z: 0.63, tip: 34 },
  { id: "lids", staged: "a first-person overlay", kind: "eyelids", rig: "car", cam: { pos: CAM.pov.pos, look: CAM.pov.look, fov: CAM.pov.fov } },
  { id: "phone", staged: "in Mash's hand, then knocked into the water", kind: "phone", style: "iphone", rig: "car", x: -0.3, y: 1.0, z: 0.45, rot: -100, tip: -10, scale: 1.6 },
  // T2 (props-sinkcar.js, DESIGN 3): the water inside, the glass, the dash, the headrest, the beams
  { id: "water", kind: "cabinwater", rig: "car", x: 0, y: 0, z: 0, level: 0 },
  { id: "glass", kind: "carglass", rig: "car", x: 0, y: 0, z: 0, level: 0, t0: T.burst, pourEnd: 17.0 },
  { id: "dash", kind: "dashglow", rig: "car", x: 0, y: 0, z: 0 },
  // the driver's seat has no headrest of its own (head: false): this one stands in its place (seat y 0.12 + 0.42 + 0.92, z 0.2 - 0.53)
  { id: "rest", staged: "on the driver's seat, then in his hands", kind: "headrest", rig: "car", x: 0.55, y: 1.46, z: -0.33, color: "#59535f" },
  { id: "beams", kind: "headbeams", rig: "car", x: 0, y: 0, z: 0 },
  // the outside
  { id: "bridge", staged: "the near stump's broken lip (the set's own deck ends in a clean cut at z -17)", kind: "bridgeend", x: 0, y: 14, z: -14, len: 3, at: 0 },
  { id: "rain", staged: "rain", kind: "rainstreaks", x: 0, y: 6, z: 0, n: 160, box: [14, 14, 14], v: [1.9, -9, 0], len: 0.35, width: 0.02, opacity: 0.35 },
  { id: "spray", kind: "splash", x: 0, y: 0, z: 0.9, scale: 4.5 },
  { id: "bubW", kind: "lakebubbles", x: 0, y: 0, z: 0, mode: "stream", car: null, at: [0.99, 1.4, 0.2], rates: [[T.out, 45], [22, 45], [T.deep, 12], [26, 0]] },
  { id: "bubM", kind: "lakebubbles", x: 0, y: 0, z: 0, mode: "mouth", from: T.out, to: T.rise, at: [1.2, -1.5, 0.3] },
  { id: "foam", kind: "wakefoam", x: 1.4, y: 0, z: 1.0, r: 1.4 },
  // invisible carriers for the swimmers
  { id: "spudWC", kind: "carrier", x: 0.9, y: -2, z: 0.1 },
  { id: "mashWC", kind: "carrier", x: 0.9, y: -3, z: -0.4 },
  { id: "chipWC", kind: "carrier", x: 1.1, y: -1.4, z: 0.5 },
];

props.find((p) => p.id === "bubW").car = rigs[0];

// ---------------------------------------------------------------- helpers
const cut = (t) => r3(t - 0.02);                           // a cut cheat lands a frame before its cut
const set = (t, id, s) => prop(cut(t), id, s, 0, "linear");
const shake = (t, amp, dur = 0.35) => c.at(t, { fx: "shake", amp, dur });
const narr = (t, line, dur, chunks, y = LINES.pos, tail = 0.25) => {
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
  const n = chunks.reduce((k, x) => k + x.length, 0); let a = t;
  chunks.forEach((text, i) => { const b = i === chunks.length - 1 ? t + dur + tail : a + (dur * text.length) / n; c.cap(r3(a), r3(b), text, Array.isArray(y) ? y[i] : y, false, SUB_STYLE); a = b; });
};
// the clock: 1:00 at 4.5 s, 0:40 at 11.5, 0:15 at 19.0, 0:00 at 27.0 (the panels' readouts; it runs faster than real
// seconds: the minute is the expert's number, the clip shows it in 22.5 s)
const CLOCK = [[T.cabin, 60], [T.button, 40], [T.out, 15], [T.surf, 0]];
const clockAt = (s) => { for (let k = 0; k < CLOCK.length - 1; k++) { const [t0, v0] = CLOCK[k], [t1, v1] = CLOCK[k + 1]; if (s <= v0 && s >= v1) return t0 + ((v0 - s) / (v0 - v1)) * (t1 - t0); } return null; };
const CLOCK_Y = 1220, CLOCK_X = 205;   // inside the safe zone (y 210-1360)
for (let s = 60; s >= 0; s--) {
  const a = clockAt(s), b = s > 0 ? clockAt(s - 1) : T.shore;
  c.cap(r3(a), r3(b), `0:${String(s).padStart(2, "0")}`.replace("0:60", "1:00"), CLOCK_Y, false, { x: CLOCK_X, size: 92, kinetic: false });
}
const seatIn = (t, who, s) => A(t, who, "sit", { seat: `seat-${s}`, dur: 0.01, hands: "keep" });
const both = (t, who, pose, dur, ease) => { for (const s of ["R", "L"]) c.arm(t, who, s, typeof pose === "function" ? pose(s) : pose, dur || 0.01, ease); };

// ================================================================ the whole clip: rain, storm, the car's own keys
for (const w of ["spudW", "mashW", "chipW"]) A(0, w, "hide");
for (const [w, s] of [["spud", "drv"], ["mash", "pas"], ["chip", "rl"]]) seatIn(0, w, s);
A(0, "spud", "grab", { prop: "wheel", hand: "R", pose: null, grip: "R" }); A(0, "spud", "grab", { prop: "wheel", hand: "L", pose: null, grip: "L" });
c.arm(0, "spud", "R", { prop: "wheel", grip: "R" }, 0.01); c.arm(0, "spud", "L", { prop: "wheel", grip: "L" }, 0.01);
prop(0, "water", { level: 0, hiss: 0, dim: 0, agit: 0 }, 0, "linear"); prop(0, "glass", { level: 0, pour: 1, drop: 0 }, 0, "linear");
prop(0, "dash", { on: 1 }, 0, "linear");
prop(0, "beams", { lamps: 0.25 }, 0, "linear"); prop(T.fly, "beams", { lamps: 1 }, 0.01, "linear");   // dim in his own view, so the road and the drop read
sfx(0, "screech", { gain: 0.7, loud: true, reason: "frame 0: tyres leaving the broken bridge (EP01's last sound, the loop)" });
sfx(0, "ai/storm-lake", { gain: 0.3, dur: r3(T.cabin), reason: "rain and wind over the lake" });

// ================================================================ 01 THE BLINK 0-1.2: through his own eyelids at the wheel
const P0 = 0;
A(0, "spud", "pov", { on: true }); A(cut(T.fly), "spud", "pov", { on: false });
set(0, "lids", { open: 0 }); set(P0, "lids", { open: 0.15 }); prop(r3(P0 + 0.03), "lids", { open: 0.7 }, 0.15, "out"); prop(r3(P0 + 0.25), "lids", { open: 0.2 }, 0.08, "in"); prop(r3(P0 + 0.35), "lids", { open: 1 }, 0.25, "out");
A(0, "mash", "expr", { expr: "terrified", set: { open: 1 }, dur: 0 }); A(0, "mash", "look", { to: [0.4, -0.2], dur: 0, blink: false });
both(0, "mash", { o: [0.25, 0.85, 0.15] }, 0.01);
sfx(r3(P0 + 0.1), "gasp", { gain: 0.5, reason: "Mash screams (a sharp breath, no cartoon)" });
narr(0.05, "You wake up... mid car crash.", DUR.wake, ["You wake up...", "mid car crash."]);
see(0.2, T.fly, ["bridge"], "first person at the wheel: his eyes snap open as the car races over the snapped end of the bridge, Mash screams");

// ================================================================ 02 HIS FACE 1.2-2.45
A(T.face, "spud", "expr", { expr: "terrified", set: { open: 0.85 }, dur: 0 }); A(T.face, "spud", "droop", { to: 0.9, dur: 0 });   // the sprout whipped flat
A(T.face, "spud", "look", { to: [0, -0.3], dur: 0, blink: false });
see(r3(T.face + 0.1), T.cabin, ["spud.face", "wheel"], "his face at the wheel, eyes wide, the lake through the windscreen");

// ================================================================ 03 THE FALL 2.45-4.5 (outside)
prop(T.hit, "spray", { puff: 1 }, 0.9, "out");
prop(T.hit, "foam", { on: 1 }, 0.4, "out");
shake(T.hit, 0.05, 0.4);
sfx(T.hit, "ai/car-lake-impact", { gain: 1.0, loud: true, reason: "the car hits the lake nose first" });
see(r3(T.fly + 0.05), T.face, ["beams", "spray"], "the car flies nose down and hits the lake in a wall of spray");

// ================================================================ 04 INSIDE, IT FLOATS 4.5-7.0: water at their feet, 1:00
for (const id of ["water", "glass"]) {
  set(T.cabin, id, { level: LEVEL[0][1] });
  for (let k = 0; k < LEVEL.length - 1; k++) prop(LEVEL[k][0], id, { level: LEVEL[k + 1][1] }, r3(LEVEL[k + 1][0] - LEVEL[k][0]), "linear");
}
set(T.cabin, "water", { hiss: 1 });
sfx(T.cabin, "ai/car-waves", { gain: 0.6, dur: r3(T.burst - T.cabin), reason: "lake waves sloshing against and into the floating car (Jonny: a wave, not a flush or a sprinkle)" });
sfx(T.cabin, "ai/rain-car-roof", { gain: 0.3, dur: r3(T.out - T.cabin), reason: "rain drumming on the roof" });
for (const w of ["spud", "mash", "chip"]) { A(T.cabin, w, "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0 }); }
A(T.cabin, "spud", "look", { to: [0, -0.6], dur: 0, blink: false });
A(r3(T.cabin + 1.15), "spud", "release", { prop: "wheel", to: [0.55, 0.88, 0.63], dur: 0 });   // back on its column
c.arm(r3(T.cabin + 1.2), "spud", "R", { x: [-0.2, 0.38, 0.12] }, 0.3, "out");   // to the buckle at his right hip (pose x is body-local: +x his left)
A(r3(T.cabin + 1.9), "spud", "squash", { amount: 0.05, dur: 0.2 });
sfx(r3(T.cabin + 1.9), "ai/seatbelt-click", { gain: 0.5, reason: "his belt clicks open" });
A(T.cabin, "chip", "look", { to: [0, -0.4], dur: 0, blink: false });
narr(r3(T.cabin + 0.1), "One minute. Belt off.", DUR.belt, ["One minute.", "Belt off."]);
see(r3(T.cabin + 0.1), T.phone, ["spud.face", "mash.face", "chip.face", "water"], "inside: all three, water hissing in round their feet, the clock starts");

// ================================================================ 05 NO PHONE 7.0-9.0
c.arm(T.phone, "mash", "L", { o: [0.12, 0.78, 0.08] }, 0.25, "out");   // phone to his left ear, the side toward Spud
A(r3(T.phone + 0.25), "mash", "grab", { prop: "phone", hand: "L", pose: null });
A(T.phone, "mash", "expr", { expr: "terrified", set: { open: 0.4 }, dur: 0 }); A(T.phone, "mash", "look", { to: [0.2, 0.1], dur: 0, blink: false });
A(T.phone, "spud", "expr", { expr: "angry", set: { open: 0.6 }, dur: 0 }); A(T.phone, "spud", "look", { to: [-0.8, 0.1], dur: 0, blink: false });
c.arm(r3(T.phone + 0.45), "spud", "R", { x: [-0.75, 0.72, 0.3] }, 0.12, "out");   // the swipe at the phone, his right mitten (Mash is on his right)
A(r3(T.phone + 0.58), "mash", "release", {});
sfx(r3(T.phone + 0.57), "slap", { gain: 0.45, reason: "his mitten knocks the phone out of Mash's hand" });
c.drop?.(r3(T.phone + 0.6), "phone", { to: [-0.5, 0.5, 0.35] });
sfx(r3(T.phone + 0.95), "ai/drip", { gain: 0.4, reason: "the phone drops into the cabin water" });
narr(r3(T.phone + 0.55), "No phone.", DUR.phone, ["No phone."]);
see(r3(T.phone + 0.1), T.door, ["mash.face", "spud.face", "phone"], "Mash dials, Spud knocks the phone down");

// ================================================================ 06 NOT THE DOOR 9.0-11.5
A(T.door, "mash", "turn", { to: -70, dur: 0.25, ease: "out" });
both(T.door, "mash", (s) => ({ o: [s === "R" ? -0.05 : 0.25, 0.6, 0.35] }), 0.2, "out");
for (let k = 0; k < 3; k++) { A(r3(T.door + 0.35 + 0.6 * k), "mash", "lean", { to: 12, dur: 0.12 }); A(r3(T.door + 0.55 + 0.6 * k), "mash", "lean", { to: 0, dur: 0.2 }); sfx(r3(T.door + 0.45 + 0.6 * k), "ai/car-door-shove", { gain: 0.5, reason: "he shoves the stuck door" }); }
A(T.door, "mash", "expr", { expr: "terrified", set: { open: 0.2 }, dur: 0 });
narr(r3(T.door + 0.7), "Not the door.", DUR.door, ["Not the door."]);
see(r3(T.door + 0.2), T.button, ["mash.face", "glass"], "Mash shoves the door; it does not move, the lake halfway up outside");

// ================================================================ 07 WINDOW. NOW. 11.5-12.9: the glass moves 2 cm, the lights die
A(T.button, "spud", "expr", { expr: "focused", dur: 0 }); A(T.button, "spud", "look", { to: [0.8, -0.3], dur: 0, blink: false });
c.arm(T.button, "spud", "L", { x: [0.4, 0.3, 0.15] }, 0.2, "out");   // his left mitten on the door's window button (car x 0.97)
sfx(r3(T.button + 0.1), "click", { gain: 0.3, reason: "the window button" });
prop(r3(T.button + 0.1), "glass", { drop: 0.02 }, 0.3, "linear");
// the flicker (DESIGN 3.3 frame table: on until frame 359, off 360-362, 0.7 363-366, off 367-370, 0.45 371-372, off 373-377, 0.25 378, off from 379)
for (const [f, v] of [[360, 0], [363, 0.7], [367, 0], [371, 0.45], [373, 0], [378, 0.25], [379, 0]]) set(r3(f / 30 + 0.02), "dash", { on: v });
set(r3(379 / 30 + 0.02), "water", { dim: 1 });
narr(r3(T.button + 0.25), "Window. Now.", DUR.window, ["Window.", "Now."]);
see(r3(T.button + 0.1), T.rest, ["spud.R", "dash"], "the window moves 2 cm, then the dash lights flicker out");

// ================================================================ 08 THE HEADREST 12.9-16.0: the side window bursts, the lake pours in
A(T.rest, "spud", "turn", { to: 160, dur: 0.25, ease: "inOut" });
A(r3(T.rest + 0.25), "spud", "grab", { prop: "rest", hand: "R", pose: null }); A(r3(T.rest + 0.25), "spud", "grab", { prop: "rest", hand: "L", pose: null });
prop(r3(T.rest + 0.35), "rest", { y: 1.25, z: 0.0 }, 0.2, "out");
A(r3(T.rest + 0.55), "spud", "turn", { to: 70, dur: 0.25, ease: "inOut" });
prop(r3(T.rest + 0.6), "rest", { x: 0.5, y: 1.0, z: 0.05, rot: 90, tip: 0 }, 0.3, "inOut");
A(r3(T.burst - 0.12), "spud", "lean", { to: 14, dur: 0.12, ease: "in" });
prop(r3(T.burst - 0.12), "rest", { x: 0.6 }, 0.12, "in");
set(T.burst, "glass", { burst: 1 });   // the pour follows the prop's own schedule from t0 (pour 1 = as designed)
prop(T.burst, "water", { agit: 1 }, 0.1, "out"); prop(r3(T.burst + 1), "water", { agit: 0 }, 0.5, "inOut");
set(T.burst, "water", { hiss: 0 });
A(T.burst, "spud", "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0.08 }); A(r3(T.burst + 0.1), "spud", "lean", { to: -6, dur: 0.3, ease: "out" });
shake(T.burst, 0.03, 0.3);
sfx(T.burst, "ai/glass-shatter-car", { gain: 0.9, loud: true, reason: "the side window bursts under the prongs" });
sfx(r3(T.burst + 0.08), "ai/water-gush", { gain: 0.75, dur: 3.4, reason: "the lake pours in" });
see(r3(T.rest + 0.2), T.back, ["spud.face", "rest", "glass"], "he rips out the headrest and rams its prongs into the side window's corner: it bursts, the lake pours in");

// ================================================================ 09 SMALL ONES FIRST 16.0-19.0
A(cut(T.back), "spud", "release", { prop: "rest", to: [0.08, 0.62, 0.6], dur: 0 });   // the headrest dropped on the console behind the cut
A(cut(T.back), "spud", "turn", { to: 200, dur: 0.01 }); A(T.back, "spud", "expr", { expr: "focused", set: { open: 0.3 }, dur: 0 });
A(T.back, "chip", "expr", { expr: "terrified", set: { open: 0.4 }, dur: 0 }); A(T.back, "chip", "look", { to: [0.1, 0.2], dur: 0, blink: false });
both(r3(T.back + 0.2), "spud", (s) => ({ x: [s === "R" ? 0.32 : 0.55, 0.62, -0.75] }), 0.3, "out");   // both mittens to Chip's buckle
sfx(r3(T.back + 0.8), "ai/seatbelt-click", { gain: 0.5, reason: "Chip's belt open" });
narr(r3(T.back + 0.35), "Small ones first.", DUR.small, ["Small ones first."]);
see(r3(T.back + 0.1), T.out, ["chip.face", "spud.face", "water"], "the water at Chip's chest; Spud unclips him to get him out first");

// ================================================================ 10 OUT 19.0-21.5 (underwater, outside)
for (const w of ["spud", "chip"]) A(cut(T.out), w, "hide");
for (const w of ["spudW", "chipW"]) A(cut(T.out), w, "show");

// the driver's window at 19.0 is about (1.0, -1.16, 1.1) in the world (carToWorld(T.out, WIN)); a rider's carrier is at its feet
set(T.out, "spudWC", { x: 1.3, y: -1.9, z: 1.1, rot: 0 }); set(T.out, "chipWC", { x: 1.6, y: -1.5, z: 2.1 });
A(cut(T.out), "spudW", "ride", { prop: "spudWC", off: [0, 0, 0], yaw: 0, dur: 0 }); A(cut(T.out), "chipW", "ride", { prop: "chipWC", off: [0, 0, 0], yaw: 0, dur: 0 });
A(cut(T.out), "spudW", "pitch", { to: -20, dur: 0.01 }); A(cut(T.out), "chipW", "pitch", { to: -10, dur: 0.01 });
prop(T.out, "chipWC", { x: 2.2, y: -0.8, z: 2.4 }, 2.4, "out");
prop(T.out, "spudWC", { x: 1.7, y: -1.5 }, 1.2, "out");
for (const w of ["spudW", "chipW"]) { A(T.out, w, "expr", { expr: "focused", set: { open: 0 }, dur: 0 }); both(T.out, w, { o: [0.35, 0.9, 0.1] }, 0.01); }
for (let k = 0; k < 4; k++) { both(r3(T.out + 0.3 + 0.55 * k), "chipW", { o: [0.5, 0.55, 0.15] }, 0.25, "inOut"); both(r3(T.out + 0.58 + 0.55 * k), "chipW", { o: [0.3, 0.95, 0.1] }, 0.25, "inOut"); }
sfx(T.out, "ai/underwater-amb", { gain: 0.5, dur: r3(T.surf - T.out), reason: "underwater, muffled" });
sfx(r3(T.out + 0.05), "ai/bubbles-burst", { gain: 0.55, reason: "air bursting out of the car" });
narr(r3(T.out + 0.5), "Out.", DUR.out, ["Out."]);
see(r3(T.out + 0.1), T.drag, ["chipW.face", "spudW.face", "beams"], "underwater: the car tilts nose down, Chip kicks free, Spud squeezes out after him");

// ================================================================ 10b LEAVE IT 21.5-24.0: Mash still at his door; Spud drags him out
A(cut(T.drag), "mash", "turn", { to: -70, dur: 0.01 });
both(T.drag, "mash", (s) => ({ o: [s === "R" ? -0.05 : 0.25, 0.55, 0.35] }), 0.01);
A(T.drag, "mash", "expr", { expr: "terrified", set: { open: 0.1 }, dur: 0 });
set(T.drag, "spudWC", { x: 1.45, y: -2.6, z: 1.3 });   // the window at 21.5: about (1.0, -2.22, 1.29)
A(cut(T.drag), "spudW", "turn", { to: -90, dur: 0.01 }); A(cut(T.drag), "spudW", "pitch", { to: 0, dur: 0.01 });
c.arm(r3(T.drag + 0.5), "spudW", "R", { o: [0.1, 0.6, 0.55] }, 0.3, "out");
narr(r3(T.drag + 0.45), "Leave it!", DUR.leave, ["Leave it!"]);
// the pull: Mash comes out of the window (world Mash from here)
A(cut(T.pull), "mash", "hide"); A(cut(T.pull), "mashW", "show");
set(T.pull, "mashWC", { x: 1.3, y: -3.6, z: 1.37 }); set(T.pull, "spudWC", { x: 1.8, y: -3.0, z: 1.4 });   // the window at 22.9: about (1.0, -3.25, 1.37)
A(cut(T.pull), "mashW", "ride", { prop: "mashWC", off: [0, 0, 0], yaw: 0, dur: 0 }); A(cut(T.pull), "mashW", "pitch", { to: -30, dur: 0.01 });
prop(T.pull, "mashWC", { x: 1.8, y: -2.8 }, 1.1, "out");
prop(T.pull, "spudWC", { x: 2.2, y: -2.3 }, 1.1, "out");
A(T.pull, "mashW", "expr", { expr: "terrified", set: { open: 0 }, dur: 0 }); both(T.pull, "mashW", { o: [0.3, 0.9, 0.1] }, 0.01);
see(r3(T.drag + 0.1), T.deep, ["mash.face", "spudW.face", "mashW.face"], "Mash still pulls at his door; Spud drags him out of the window");

// ================================================================ 11 UP 24.0-26.4: the car sinks away, they kick up
for (const [w, x, y, z] of [["chipW", 2.6, -2.0, 2.2], ["spudW", 1.8, -2.3, 1.2], ["mashW", 1.1, -2.75, 0.4]]) {
  set(T.deep, `${w}C`, { x, y, z }); prop(T.deep, `${w}C`, { y: r3(y + 1.1) }, r3(T.rise - T.deep), "inOut");
  A(cut(T.deep), w, "pitch", { to: -10, dur: 0.01 });
  for (let k = 0; k < 4; k++) { both(r3(T.deep + 0.6 * k), w, { o: [0.5, 0.55, 0.15] }, 0.28, "inOut"); if (k < 3) both(r3(T.deep + 0.3 + 0.6 * k), w, { o: [0.3, 0.95, 0.1] }, 0.28, "inOut"); }   // ends well before the rise cheat (anime timing front-loads)
}
prop(25.0, "beams", { lamps: 0.2 }, 0.1, "linear"); prop(25.1, "beams", { lamps: 0.8 }, 0.1, "linear"); prop(25.4, "beams", { lamps: 0.2 }, 0.1, "linear"); prop(25.5, "beams", { lamps: 0.6 }, 0.1, "linear"); prop(26.5, "beams", { lamps: 0.15 }, 0.3, "linear");
narr(r3(T.deep + 0.5), "Up.", DUR.up, ["Up."]);
see(r3(T.deep + 0.1), T.rise, ["chipW", "spudW", "mashW", "beams"], "the car sinks away into the dark, lights fading; the three kick up to the light");
// looking up into the bright window
for (const [w, x, y, z] of [["chipW", 2.6, -1.1, 2.0], ["spudW", 1.9, -1.5, 1.0], ["mashW", 1.2, -1.85, 0.2]]) { set(T.rise, `${w}C`, { x, y, z }); prop(T.rise, `${w}C`, { y: r3(y + 0.4) }, 0.58, "in"); }
see(r3(T.rise + 0.05), T.surf, ["spudW", "chipW", "mashW"], "they rise into the bright ceiling");

// ================================================================ SURFACE 27.0-30.0
for (const [w, x, z, y] of [["chipW", 1.5, 1.0, -0.35], ["spudW", 2.1, 0.4, -0.85], ["mashW", 2.7, -0.2, -1.0]]) {   // y: the feet, so the heads clear the water
  set(T.surf, `${w}C`, { x, y: r3(y - 0.3), z }); prop(T.surf, `${w}C`, { y }, 0.25, "out");
  A(cut(T.surf), w, "pitch", { to: 0, dur: 0.01 }); A(T.surf, w, "expr", { expr: "shocked", set: { open: 0.9 }, dur: 0 });
}
sfx(T.surf, "ai/surface-gasp", { gain: 0.7, loud: true, reason: "they burst up, gasping" }); sfx(r3(T.surf + 0.25), "ai/surface-gasp", { gain: 0.5, reason: "the second one up" });
sfx(T.surf, "ai/storm-lake", { gain: 0.3, dur: r3(T.fire - T.surf), reason: "the storm over the lake again" });
// the swim: heads toward the reeds
for (const [w, dz] of [["chipW", 0.9], ["spudW", 0], ["mashW", -0.9]]) {
  set(T.swim, `${w}C`, { x: 21.5, y: { chipW: -0.4, spudW: -0.9, mashW: -1.05 }[w], z: r3(-3.5 + dz) }); prop(T.swim, `${w}C`, { x: 26.3, z: r3(-4.5 + dz) }, r3(T.shore - T.swim - 0.1), "linear");   // stays in the water: the waterline is x 30 + 5 sin(z/19), ~28.8 here
  A(cut(T.swim), w, "turn", { to: 80, dur: 0.01 }); A(cut(T.swim), w, "pitch", { to: 25, dur: 0.01 });
  // strokes end 0.2 s before the cut: an anime-timing front-loaded drawing must not reach the shore cheat at cut(T.shore)
  for (let k = 0; k < 3; k++) { c.arm(r3(T.swim + 0.6 * k), w, "R", { o: [0.2, 0.9, 0.5] }, 0.3, "inOut"); if (k < 2) c.arm(r3(T.swim + 0.3 + 0.6 * k), w, "L", { o: [0.2, 0.9, 0.5] }, 0.3, "inOut"); }
}
for (let k = 0; k < 5; k++) sfx(r3(T.swim + 0.35 * k), "ai/swim-splash", { gain: 0.35, reason: "swim strokes" });
see(r3(T.surf + 0.05), T.shore, ["spudW.face", "chipW.face", "mashW.face"], "they burst through the surface and swim for the reeds");

// ================================================================ 12 THE SHORE 30.0-33.55: all alive
for (const [w, dx, dz, yaw] of [["mashW", -0.9, 0.3, 200], ["chipW", 1.0, -0.4, 160], ["spudW", 0, 0, 180]]) {
  set(T.shore, `${w}C`, { x: r3(SHORE[0] + dx), y: SHORE[1], z: r3(SHORE[2] + dz), rot: yaw });
  A(cut(T.shore), w, "pitch", { to: w === "spudW" ? -55 : 0, dur: 0 }); A(cut(T.shore), w, "turn", { to: 0, dur: 0 });
}
// spudW: pitch -55 above = on his back on the slope of the bank, face up to the camera
both(cut(T.shore), "spudW", { o: [0.3, 0.12, 0.05] }, 0.01); both(cut(T.shore), "mashW", { o: [0.25, 0.25, 0.1] }, 0.01); both(cut(T.shore), "chipW", { o: [0.25, 0.25, 0.1] }, 0.01);   // arms down on the mud
A(T.shore, "spudW", "expr", { expr: "sad", set: { open: 0.3 }, dur: 0 }); A(T.shore, "spudW", "droop", { to: 1, dur: 0.6 });
A(T.shore, "mashW", "expr", { expr: "sad", set: { open: 0.4 }, dur: 0 }); A(T.shore, "chipW", "expr", { expr: "sad", set: { open: 0.4 }, dur: 0 });
for (const [t, w] of [[30.3, "mashW"], [30.9, "chipW"], [31.6, "mashW"]]) { A(t, w, "squash", { amount: 0.08, dur: 0.25 }); sfx(t, "ai/wet-cough", { gain: 0.45, reason: `${w} coughs up water` }); }
narr(r3(T.shore + 0.5), "One minute. That is all you get.", DUR.minute, ["One minute.", "That is all you get."]);
see(r3(T.shore + 0.1), T.close, ["spudW.face", "chipW.face", "mashW.face"], "on the muddy shore, all three alive");
// his eyes close
A(T.close, "spudW", "expr", { expr: "serene", set: { open: 0 }, dur: 0.35 });
see(r3(T.close + 0.05), T.fire, ["spudW.face"], "his eyes close");

// THE NEXT ONE (the burning house) is make-sinking-car-fire.mjs, joined after this clip.

// ---------------------------------------------------------------- shots
const beats = c.beats([
  ["the crash", 0, CAM.pov, "hook"],
  ["the fall", T.fly, CAM.fall, "reveal"],
  ["his face", T.face, CAM.face],
  ["it floats", T.cabin, CAM.cabin],
  ["no phone", T.phone, CAM.phone],
  ["not the door", T.door, CAM.door],
  ["window now", T.button, CAM.button],
  ["the burst", T.rest, CAM.burst, "escalation"],
  ["small ones first", T.back, CAM.back],
  ["out", T.out, CAM.out, "escalation"],
  ["leave it", T.drag, CAM.drag],
  ["the pull", T.pull, CAM.pull],
  ["up", T.deep, CAM.deep],
  ["the light", T.rise, CAM.rise],
  ["the surface", T.surf, CAM.surf],
  ["the swim", T.swim, CAM.swim],
  ["alive", T.shore, CAM.shore, "payoff"],
  ["eyes close", T.close, CAM.close],
], T.end);

// ---------------------------------------------------------------- check windows (only what a beat needs, or a shell the check boxes)
const WINDOWS = [
  ...["spud", "mash", "chip"].map((who) => ({ who, with: `seat-${{ spud: "drv", mash: "pas", chip: "rl" }[who]}`, from: 0, to: T.out, checks: ["clipping", "costume-in-prop", "arm-in-prop", "hand-in-prop"], reason: "they sit in the car seats" })),
  ...["spud", "mash", "chip"].map((who) => ({ who, with: "water", from: T.cabin, to: T.out, checks: ["clipping"], reason: "the water inside the car rises round them (the beat)" })),
  { who: "spud", with: "wheel", from: 0, to: T.cabin, checks: ["hand-in-prop"], reason: "both mittens on the wheel" },
  { who: "spudW", with: "mashW", from: T.pull, to: T.surf, checks: ["character-overlap"], reason: "he drags Mash up by the hoodie (the beat)" },
  { who: "spud", with: "rest", from: T.rest, to: T.back, checks: ["hand-in-prop"], reason: "he holds the headrest in both mittens (the beat)" },
];
write(import.meta.url, {
  id: "wake-up-mid-sinking-car",
  title: "You wake up mid sinking car",
  idea: "You wake up mid EP02: you wake up at the wheel of a car flying off a broken bridge into a stormy lake; belt off, no phone, not the door, break the side window, small ones first, out and up; on the shore he shuts his eyes and wakes up mid house fire",
  format: "series: You wake up mid (opens on a first-person blink; the narrator reads the title at 0.0 and then only short commands; on-screen clock; ends in the next scenario)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1440],   // narration in the upper third (Jonny 12 Nov), the clock lower left
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "stormlake", lip: false, under: "auto", hole: HOLE, shafts: [[T.out, [1.0, 0.2]], [T.deep, [1.6, 0.4]]], wipe: [[r3(T.surf - 0.04), 0], [T.surf, 1], [r3(T.surf + 0.033), 0.6], [r3(T.surf + 0.066), 0]], para: 0, aperture: 0, focus: false, bloom: "emissive", lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI },
  // Jonny liked disaster-04 on EP01 ("keep the music"); a dramatic scenario = recorded orchestra from 0.0 (12 Nov)
  music: { file: "ai/disaster/disaster-04.ogg", from: 0, skip: 1.698, until: T.end, lowCut: 150, gain: 0.55, duck: { db: -8, voice: -10 } },
  // realistic sounds only (Jonny 12 Nov 16:02): no signature jingles, no movement markers
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false },
  creative: { length: [T.end, T.end] },
  hook: { show: ["bridge", "beams"], hint: 0, what: "frame 0, first person at the wheel: his eyes snap open as the car races over the snapped end of a bridge, the storm lake 14 m below" },
  panels: { md: "storyboards/series/you-wake-up-mid/02-sinking-car/PANELS.md" },
  rigs,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: WINDOWS,
  notes: "Generated by storyboards/series/you-wake-up-mid/02-sinking-car/make-sinking-car.mjs. Spec: PANELS.md, DESIGN.md.",
});
