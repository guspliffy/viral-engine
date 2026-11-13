// ANCIENT ALIENS EP01 "Who really built the pyramids?", BLOCK B (story 0:56-1:40, panels 13-18): clue 2 the granite, the ask.
// Built from the shared kit only (../../kit/aa-kit.mjs, BLOCKS.md). Story + lines: /mnt/project-files/videos/ancient-aliens/
// 01-pyramids/STORY.md (word for word). Panels: ancient-aliens-01-sheet-2.png 13-18 (PANELS.md here).
//   node storyboards/series/ancient-aliens/01-pyramids/block-b/make-block-b.mjs   -> aa01-block-b.json (one light: SET)
//
// THE CHAIN (cause and effect): the heaviest stones are inside (block A's turn), SO he climbs the gallery to the King's
// Chamber; the ceiling is granite beams of 80 t, SO he lays his palm on the granite: there is none at Giza, it comes from
// Aswan 800 km up the Nile (map); his touch takes us to 2560 BC: the alien cutter slices a beam dead straight at Aswan, SO
// it has to travel: a cargo ship carries it over the Nile past two fishermen (and Spud, in their boat); "copper saws and
// wooden boats... for eighty tonnes", SO he asks us: Aliens 1, Humans 2, and waits (the river runs on).
//
// PLACES (aa-kit: one origin per place, 1000 m apart; north -z, east +x). Light: SET for the whole block (BLOCKS.md).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { SET, CAST, host, hostSay, score, clueTag, lampClip } from "../../kit/aa-kit.mjs";

const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const O = (i) => [i * 1000, 0];
const P = { gal: O(0), room: O(1), map: O(2), quarry: O(3), nile: O(4) };
const SLOPE = Math.tan((26.3 * Math.PI) / 180);
const galY = (z) => r3(-z * SLOPE);

// spoken lengths (the render prints `speech: "..." lasts Xs spoken`; VoxCPM2, voice reaper)
// v2 tones (BLOCKS.md How we explain 6): the clue's reveal "excited", the ask "question"
const DUR = { beams: 4.43, nogranite: 2.33, aswan: 3.78, saws: 2.85, tonnes: 1.21, ask: 4.09, wait: 0.71 };

// TIMES (block clock; 0 = story 0:56). Slot 44.0 s. v2 (Jonny 13 Nov on block A: "pretty plain and boring" -> BLOCKS.md
// "How we explain"): a change at least every 3 s, every fact shown, numbers count, Spud acts, the others react. Cuts on tenths
// (exact frames).
const T = {
  gal: 0, room: 3.0, beams: 6.2, up: 6.0, nine: 9.0, palm: 11.6, face: 12.4, nogranite: 12.6, quarry: 21.0, look: 23.0, saws: 23.6,
  close: 25.8, nile: 27.6, boat: 29.7, tonnes: 30.2, ask: 33.8, end: 44.0,
};
T.map = r3(Math.round((T.nogranite + DUR.nogranite + 0.2) * 10) / 10); T.aswan = r3(T.map + 0.3);
T.askLine = r3(T.ask + 0.5); T.wait = r3(T.askLine + DUR.ask + 1.0);

// ---------------------------------------------------------------- cast (Spud is one actor who moves from place to place)
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.3, seed: 2.1, ...extra });
const SP = {
  gal: [0, -1.8, 180],                 // on the ramp, his back to us, climbing to -z
  room: [4.4, 0.6, -90],               // he walks in from the east end of the King's Chamber, facing west
  wall: [0.6, -2.15, 90],               // at the north wall (on his left), palm on the granite
  quarry: [1.05, 10.6, -25],           // in front of the cutter, watching it
};
const cast = [
  who("spud", CAST.spud, P.gal, SP.gal[0], SP.gal[1], SP.gal[2], { y: galY(SP.gal[1]) }),
  who("fore", CAST.foreman, P.quarry, -1.6, 9.25, 180),
  who("crew", CAST.crew, P.quarry, -2.6, 8.2, 150),
  who("fishA", CAST.workerA, P.nile, 0, 1.1, 0), who("fishB", CAST.workerB, P.nile, 0, 0, 0),
];

// ---------------------------------------------------------------- props
const props = [
  // P13 the Grand Gallery: a ramp (no stairs), corbelled walls, dark beyond: only his headlamp
  { id: "gal", kind: "grandgallery", x: P.gal[0], y: 0, z: 0, len: 24, slope: 26.3 },
  // P14-15 the King's Chamber: nine granite ceiling beams, the two site lamps, the sarcophagus at the west end
  { id: "kc", kind: "kingschamber", x: P.room[0], y: 0, z: 0 },
  // P15 b the map: Giza to Aswan, 800 km up the Nile (a painted card, block-b/nile-map.png, bench/make-nile-map.py)
  { id: "map", kind: "stormsky", x: P.map[0], y: 9.6, z: 0, src: "storyboards/series/ancient-aliens/01-pyramids/block-b/nile-map.png", h: 19.2 },
  // P16 Aswan, 2560 BC: the quarry, the cutter over a raw granite block
  { id: "q-sky", kind: "aasky", x: P.quarry[0], z: 12, time: "day" },
  { id: "quarry", kind: "aswanquarry", x: P.quarry[0], y: 0, z: 0 },
  { id: "cutter", kind: "granitecutter", x: P.quarry[0], y: 0, z: 6, slide: 1, pedestal: [-1.6, 0, 2.6] },
  { id: "stone", kind: "roughgranite", x: P.quarry[0] + 0.6, y: 0, z: 6 },
  // P17-18 the Nile: the reed boat (two fishermen and Spud), the cargo ship crossing with one granite beam
  { id: "n-sky", kind: "aasky", x: P.nile[0], z: 14, time: "day" },
  { id: "river", kind: "nilewater", x: P.nile[0], y: 0, z: 0, size: [120, 120], reflect: [[P.nile[0], 1.6, 1.3, 5.2]], wake: [[P.nile[0], 2.45, 0.9], [P.nile[0], -2.45, 0.8]] },
  { id: "boat", kind: "reedboat", x: P.nile[0], y: 0, z: 0, rot: 90, bob: 0.5 },
  { id: "cargo", kind: "cargoship", x: P.nile[0] - 9, y: 11, z: -20, rot: 0 },
  { id: "span", kind: "granitespan", x: P.nile[0] - 9, y: 5.05, z: -20, rot: 0 },
  host("spud", 1),
];
const STAGED = { gal: "the Grand Gallery set", kc: "the King's Chamber set", map: "a painted map card", quarry: "the Aswan quarry backdrop", river: "the Nile's surface", cargo: "the aliens' cargo ship in the sky", span: "the granite beam hanging under the ship" };

// ---------------------------------------------------------------- helpers
const look = (t, w, to, dur = 0.2) => A(t, w, "look", { to, dur, blink: false });
const arm = (t, w, side, pose, dur = 0.3, ease = "inOut") => A(t, w, "arm", { side, pose, dur, ease });
const prop = (t, id, set, dur = 0.3, ease = "inOut") => c.prop(t, id, set, dur, ease);
const TAKE = { saws: 2, tonnes: 2 };   // take 1 was heard as "copper sores" and "für 80 Tonnen"
const SUB = 470;                       // subtitles under the numbers (block A v2: numbers y 300, subtitles y 470)
const say = (t, line, key, tone = "calm") => {
  hostSay(c, t, "spud", line, DUR[key], tone, { pos: SUB });
  if (TAKE[key]) c.items[c.items.length - 1].take = TAKE[key];   // the say macro hostSay just wrote
};
// a number that counts up in 0.1 s steps, eased out, then holds (BLOCKS.md How we explain 5)
const count = (t0, t1, hold, to, fmt, { y = 300, size = 112, from = 0 } = {}) => {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const k = i / n, v = from + (to - from) * (1 - (1 - k) ** 3), a = r3(t0 + i * 0.1), b = i === n ? hold : r3(t0 + (i + 1) * 0.1);
    cap(a, b, fmt(Math.round(v)), y, false, { size, kinetic: false });
  }
};
const punch = (t0, t1, text, { y = 300, size = 112 } = {}) => cap(t0, t1, text, y, true, { size, kinetic: false });
// put Spud in a new place on a hard cut (0.02 s before it, so the first frame of the shot already has him there)
const place = (t, o, [x, z, face], y = 0) => {
  const t0 = r3(t - 0.02);
  A(t0, "spud", "move", { to: [r3(o[0] + x), r3(o[1] + z)], y, dur: 0.01, steps: 0, ease: "linear" });
  A(t0, "spud", "turn", { to: face, dur: 0.01, ease: "linear" });
  arm(t0, "spud", "R", "rest", 0.01); arm(t0, "spud", "L", "rest", 0.01); look(t0, "spud", [0, 0], 0.01);
};
// no automatic blink on the last frames before a cut (BLOCKS.md engine lessons)
const CUTS = () => [T.room, T.up, T.nine, T.palm, T.map, T.quarry, T.look, T.close, T.nile, T.boat, T.ask];
const land = (t, gain = 0.8) => { sfx(t, "thud", { gain, reason: "granite settles" }); sfx(t, "kenney/impact-mining", { gain: 0.5, reason: "the stone's knock (carries on a phone)" }); };

// seeds (params with no default start at 0)
prop(0, "cargo", { beam: 1, wobble: 0.6 }, 0); prop(0, "cutter", { slide: 1, cut: 0 }, 0); prop(0, "stone", { cut: 0 }, 0);
A(0, "fishA", "ride", { prop: "boat", off: [0, 0.12, 1.1], yaw: -90, sit: true, dur: 0 });
A(0, "fishB", "ride", { prop: "boat", off: [0, 0.12, 0], yaw: -90, sit: true, dur: 0 });
look(0, "fishA", [0.2, -0.1], 0); look(0, "fishB", [-0.2, -0.1], 0);
look(0, "fore", [0, -0.35], 0); arm(0, "fore", "R", { world: [r3(P.quarry[0] - 1.6), 0.6, 8.6] }, 0);   // palm on the control slab
clueTag(c, 0.3, T.ask, 2);

// ---------------------------------------------------------------- P13 the Grand Gallery 0-3.0: the camera starts on the corbelled
// roof 8.6 m up (the evidence), tilts down to him climbing; the slope is steep: he slips back a step, puffs, goes on
A(0.05, "spud", "move", { to: [P.gal[0], -2.6], y: galY(-2.6), dur: 1.2, steps: 3, ease: "linear" });
A(1.3, "spud", "move", { to: [P.gal[0], -2.25], y: galY(-2.25), dur: 0.25, steps: 0, ease: "out" });   // slips back
A(1.3, "spud", "expr", { expr: "shocked", dur: 0.12 }); arm(1.3, "spud", "R", { o: [0.25, 0.55, 0.2] }, 0.15); arm(1.3, "spud", "L", { o: [0.25, 0.55, 0.2] }, 0.15);
arm(1.75, "spud", "R", "rest", 0.3); arm(1.75, "spud", "L", "rest", 0.3); A(1.8, "spud", "expr", { expr: "focused", dur: 0.2 });
A(1.9, "spud", "move", { to: [P.gal[0], -4.0], y: galY(-4.0), dur: 1.05, steps: 3, ease: "linear" });
sfx(1.32, "step", { gain: 0.5, reason: "his foot slides on the polished ramp" });
see(0.2, 2.9, ["spud", "gal"], "P13: up the gallery; he slips back a step on the slope");

// ---------------------------------------------------------------- P14 the King's Chamber 3.0-11.6
// 3.0-6.0 the camera starts on the nine granite beams overhead, tilts down as he walks in from the east end
place(T.room, P.room, SP.room);
A(r3(T.room + 0.2), "spud", "move", { to: [r3(P.room[0] + 1.6), 0.4], dur: 1.7, steps: 4, ease: "out" });
look(r3(T.room + 2.0), "spud", [0, 0.9], 0.4);                     // he stops and looks up
A(r3(T.room + 2.3), "spud", "expr", { expr: "shocked", set: { open: 0.1 }, dur: 0.2 });
see(T.room, T.up, ["kc", "spud"], "P14: the granite ceiling first, then he walks in under it");
// 6.0-9.0 low beside him, past his upturned face to the beams; the voice; 80 t counts on "eighty tonnes"
say(T.beams, "The ceiling: granite beams. Up to eighty tonnes each.", "beams");
count(r3(T.beams + 2.3), r3(T.beams + 3.0), r3(T.nine - 0.05), 80, (v) => `${v} t`, { size: 124 });
see(T.up, T.nine, ["spud.face", "kc"], "P14 b: he looks up at the beams; 80 t counts up");
// 9.0-11.6 from the west end: all nine beams over him; a grain of dust trickles from beam 5's crack, he steps out from under it
punch(T.nine, r3(T.palm - 0.05), "80 t × 9", { size: 112 });
punch(r3(T.nine + 1.0), r3(T.palm - 0.05), "= 13 elephants each", { y: 1150, size: 64 });
look(r3(T.nine + 0.6), "spud", [0.2, 1.0], 0.2); A(r3(T.nine + 0.7), "spud", "expr", { expr: "terrified", dur: 0.15 });
A(r3(T.nine + 1.0), "spud", "move", { to: [r3(P.room[0] + 0.7), 1.1], dur: 0.5, steps: 2, ease: "out" });   // a quick sidestep
A(r3(T.nine + 1.7), "spud", "expr", { expr: "deadpan", dur: 0.2 }); look(r3(T.nine + 1.7), "spud", [0, 0.05], 0.25);
sfx(r3(T.nine + 0.6), "ai/screen-crack", { gain: 0.12, reason: "a grain of granite ticks down from the beam's hairline crack" });
see(T.nine, T.palm, ["spud.face", "kc"], "P14 c: nine beams over him; he steps out from under the cracked one");

// ---------------------------------------------------------------- P15 palm on the granite 11.6-map
// 11.6-12.4 close on the speckled granite, his palm comes in and lands flat (the evidence first); 12.4 back to him, the reveal
place(T.palm, P.room, SP.wall);
look(r3(T.palm + 0.05), "spud", [0.75, 0.1], 0.01);
arm(r3(T.palm + 0.1), "spud", "L", { world: [r3(P.room[0] + 0.72), 0.5, -2.585] }, 0.45, "out");   // his palm flat on the stone
sfx(r3(T.palm + 0.55), "step", { gain: 0.25, reason: "his palm pats the granite" });
look(r3(T.face + 0.05), "spud", [0, 0.05], 0.2);
say(T.nogranite, "There is no granite at Giza.", "nogranite", "excited");
c.macro(r3(T.nogranite + 0.4), "spud", "nod", { times: 1 });
see(T.face, T.map, ["spud.face"], "P15: his palm on the granite, the reveal to us");

// ---------------------------------------------------------------- P15 b the map: the camera runs the route Giza -> Aswan, km count
say(T.aswan, "It comes from Aswan, more than eight hundred kilometres up the Nile.", "aswan");
count(r3(T.aswan + 1.4), r3(T.aswan + 3.0), r3(T.quarry - 0.05), 800, (v) => `${v} km`, { size: 124 });
see(T.map, T.quarry, ["map"], "P15 b: the route on the map, Giza to Aswan, 800 km counting");

// ---------------------------------------------------------------- P16 Aswan, 2560 BC 21.0-27.6
// 21.0-23.0 close on the cut: the turquoise line, the hot spot, the dust (the evidence)
place(T.quarry, P.quarry, SP.quarry);
prop(r3(T.quarry - 0.1), "cutter", { cut: 1 }, 0.05, "linear");
prop(T.quarry, "stone", { cut: 1 }, 4.6, "inOut");
prop(r3(T.quarry + 4.8), "cutter", { cut: 0 }, 0.15, "linear");
sfx(T.quarry, "scrape", { gain: 0.24, dur: 4.6, reason: "the cutter grinds through the granite" });
sfx(T.quarry, "kenney/space-engine-low", { gain: 0.1, dur: 5.0, reason: "the cutter's low hum" });
land(r3(T.quarry + 4.65));
// 23.0-25.8 wide: he steps in to look at the cut; the foreman turns and waves him back; he steps back, then tells us
look(T.look, "spud", [-0.4, -0.1], 0.2);
A(r3(T.look + 0.1), "spud", "move", { to: [r3(P.quarry[0] + 0.75), 9.6], dur: 0.6, steps: 2, ease: "out" });
look(r3(T.look + 0.6), "fore", [0.6, 0], 0.2); A(r3(T.look + 0.7), "fore", "expr", { expr: "annoyed", dur: 0.15 });
arm(r3(T.look + 0.8), "fore", "L", "wave", 0.25);
arm(r3(T.look + 2.0), "fore", "L", "rest", 0.3); look(r3(T.look + 2.1), "fore", [0, -0.35], 0.3);
look(r3(T.look + 0.85), "spud", [-0.5, 0.15], 0.15); A(r3(T.look + 0.9), "spud", "expr", { expr: "sad", dur: 0.15 });
A(r3(T.look + 1.05), "spud", "move", { to: [r3(P.quarry[0] + 1.05), 10.6], dur: 0.5, steps: 2, ease: "out" });
look(r3(T.saws - 0.2), "spud", [0.3, 0.05], 0.2); A(r3(T.saws - 0.2), "spud", "expr", { expr: "deadpan", dur: 0.2 });
say(T.saws, "They tell you: copper saws and wooden boats...", "saws", "dry");
look(r3(T.look + 0.2), "crew", [0.5, 0], 0.3);                    // the crew alien copies his lean
see(T.look, T.close, ["spud.face", "fore.face", "cutter"], "P16: the foreman waves him off the cut");
// 25.8-27.6 close push on him, brow up at "boats..."
A(r3(T.close + 0.3), "spud", "face", { browL: 0.6, dur: 0.25 });
see(T.close, T.nile, ["spud.face"], "P16 b: his doubt, brow up");

// ---------------------------------------------------------------- P17 the Nile 27.6-33.8
// 27.6-29.7 low from the water up at the cargo ship carrying the beam overhead (the evidence); 80 t punches in
place(T.nile, P.nile, [0, 0, 0]);
A(r3(T.nile - 0.01), "spud", "ride", { prop: "boat", off: [0, 0.12, -1.1], yaw: -90, sit: true, dur: 0 });
prop(r3(T.nile - 0.02), "spud-lamp", { lit: 0 }, 0.01, "linear");
for (const id of ["cargo", "span"]) { prop(T.nile, id, { x: P.nile[0] - 0.5 }, r3(T.ask - T.nile), "linear"); prop(T.ask, id, { x: P.nile[0] + 3.5 }, r3(T.end - T.ask), "linear"); }
punch(r3(T.nile + 0.5), r3(T.boat - 0.05), "80 t", { size: 140 });
sfx(T.nile, "kenney/space-engine-low", { gain: 0.1, dur: r3(T.end - T.nile - 0.5), reason: "the cargo ship's low hum overhead" });
for (let t = T.nile; t < T.end - 0.5; t += 5.6) sfx(r3(t), "ai/car-waves", { gain: 0.16, dur: r3(Math.min(6, T.end - t)), reason: "the Nile lapping at the reed boat" });
see(T.nile, T.boat, ["span", "cargo"], "P17: 80 tonnes of granite going over");
// 29.7-33.8 the boat: the fishermen stare up, mouths open; Spud points up at it, then says it; fisherman A turns to him
look(r3(T.boat - 0.02), "fishA", [-0.3, 1.0], 0.01); look(r3(T.boat - 0.02), "fishB", [-0.1, 1.0], 0.01);
A(r3(T.boat - 0.02), "fishA", "expr", { expr: "shocked", dur: 0.01 }); A(r3(T.boat + 0.2), "fishB", "expr", { expr: "terrified", dur: 0.15 });
look(r3(T.boat - 0.02), "spud", [-0.2, 0.9], 0.01);
arm(r3(T.boat + 0.1), "spud", "R", "up", 0.3);
look(r3(T.tonnes - 0.2), "spud", [0.3, 0.1], 0.2); A(r3(T.tonnes - 0.2), "spud", "expr", { expr: "deadpan", dur: 0.2 });
say(T.tonnes, "For eighty tonnes.", "tonnes", "dry");
arm(r3(T.tonnes + 1.3), "spud", "R", "rest", 0.3);
look(r3(T.tonnes + 1.5), "fishA", [-0.8, 0], 0.2);               // fisherman A turns to look at the stranger in his boat
c.macro(r3(T.tonnes + 2.2), "spud", "shrug", { hold: 0.6 });
see(T.boat, T.ask, ["fishA.face", "fishB.face", "spud.face"], "P17 b: the fishermen stare up, he says it");

// ---------------------------------------------------------------- P18 the ask 33.8-44.0: Aliens 1, Humans 2; one finger, two fingers
look(r3(T.ask - 0.02), "spud", [0, 0], 0.01); A(r3(T.ask - 0.02), "spud", "expr", { expr: "deadpan", dur: 0.01 }); A(r3(T.ask - 0.02), "spud", "face", { lid: 0.3, dur: 0.01 });
say(T.askLine, "Aliens? Type one. Humans? Type two.", "ask", "question");
punch(r3(T.askLine + 0.9), T.end, "ALIENS = 1", { y: 250, size: 84 });
punch(r3(T.askLine + 3.1), T.end, "HUMANS = 2", { y: 345, size: 84 });
arm(r3(T.askLine + 0.8), "spud", "R", "up", 0.25); arm(r3(T.askLine + 2.2), "spud", "R", "rest", 0.25);
arm(r3(T.askLine + 3.0), "spud", "L", "up", 0.25); arm(r3(T.askLine + 4.4), "spud", "L", "rest", 0.25);
say(T.wait, "I'll wait.", "wait", "dry");
A(r3(T.wait + DUR.wait + 0.5), "spud", "face", { browL: 0.6, dur: 0.3 });
look(r3(T.wait + DUR.wait + 1.6), "spud", [-0.7, 0], 0.25); look(r3(T.wait + DUR.wait + 2.4), "spud", [0, 0], 0.2);   // a side glance at the ship, back to us
see(T.ask, T.end, ["spud.face"], "P18: the ask, one finger, two fingers, then he waits");

for (const t of CUTS()) for (const w of ["spud", "fishA", "fishB", "fore", "crew"]) A(r3(t - 0.35), w, "noblink", { dur: 0.33 });

// ---------------------------------------------------------------- shots: a move on every shot, a change at least every 3 s
const G = P.gal[0], R = P.room[0], M = P.map[0], Q = P.quarry[0], N = P.nile[0];
const mv = (pos, look, to, toLook, dur, fov = 50, ease = "inOut") => ({ pos, look, fov, to: { pos: to, look: toLook, fov }, dur: r3(dur - 0.05), ease });
const beats = c.beats([
  ["P13 the gallery: corbelled roof down to him", T.gal, mv([G + 0.2, 0.7, 0.6], [G, 7.5, -5], [G + 0.2, 1.4, 0.4], [G, 2.6, -6], T.room, 60), "hook"],
  ["P14 granite beams, then he walks in", T.room, mv([R - 2.4, 0.9, 1.6], [R - 1.0, 5.8, -0.6], [R - 2.4, 1.0, 1.6], [R + 1.8, 1.4, 0.2], T.up - T.room, 64)],
  ["P14 b past his face to the beams", T.up, mv([R + 0.1, 0.3, 0.95], [R + 1.6, 1.25, 0.35], [R + 0.25, 0.3, 0.9], [R + 1.6, 1.45, 0.3], T.nine - T.up, 72)],
  ["P14 c nine beams over him", T.nine, mv([R - 4.6, 1.7, 0.2], [R + 1.0, 2.6, 0.6], [R - 3.8, 1.5, 0.2], [R + 1.0, 2.3, 0.7], T.palm - T.nine, 72)],
  ["P15 palm on the granite, the reveal", T.palm, mv([R + 2.5, 0.85, -1.15], [R + 0.6, 0.72, -2.2], [R + 2.35, 0.86, -1.22], [R + 0.6, 0.72, -2.2], T.map - T.palm, 46)],
  ["P15 b Aswan, 800 km up the Nile", T.map, mv([M - 0.6, 13.6, 12], [M - 0.6, 13.6, 0], [M + 1.5, 4.9, 12], [M + 1.5, 4.9, 0], T.quarry - T.map, 44)],
  ["P16 the cut", T.quarry, mv([Q + 3.6, 2.2, 8.6], [Q + 1.4, 2.1, 6.0], [Q + 3.3, 2.15, 8.2], [Q + 1.4, 2.1, 6.0], T.look - T.quarry, 50)],
  ["P16 the foreman waves him off", T.look, mv([Q - 0.4, 1.5, 16.2], [Q - 0.4, 1.5, 7.5], [Q - 0.25, 1.4, 15.4], [Q - 0.3, 1.45, 7.5], T.close - T.look, 54)],
  ["P16 b his doubt", T.close, mv([Q + 1.4, 0.95, 13.2], [Q + 1.05, 0.75, 10.6], [Q + 1.3, 0.9, 12.6], [Q + 1.05, 0.75, 10.6], T.nile - T.close, 44)],
  ["P17 80 tonnes overhead", T.nile, mv([N + 2.5, 0.5, -6.0], [N - 8.0, 8.5, -20], [N + 2.5, 0.5, -6.0], [N - 5.5, 8.4, -20], T.boat - T.nile, 58)],
  ["P17 b the boat", T.boat, mv([N + 0.3, 1.25, 6.8], [N - 0.2, 2.9, -6], [N + 0.2, 1.2, 6.0], [N - 0.2, 2.7, -6], T.ask - T.boat, 60)],
  ["P18 the ask", T.ask, mv([N - 0.95, 1.0, 3.9], [N - 1.1, 1.5, 0], [N - 0.95, 1.0, 3.3], [N - 1.1, 1.45, 0], T.end - T.ask, 42), "payoff"],
], T.end);

const WORLD = ["gal", "kc", "map", "quarry", "river", "boat"];
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "aa01-block-b",
  title: "Ancient Aliens EP01 block B: the granite",
  idea: "Who really built the pyramids? Block B (0:56-1:40): the granite beams of the King's Chamber came 800 km from Aswan; the alien cutter slices one, a ship carries it over the Nile; Aliens 1, Humans 2",
  format: "series: Ancient Aliens (Spud hosts in Reaper's voice, 5 numbered clues, the sun as the clock); block B of four, joined later",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [200, 1440],   // speech in the upper third (Jonny 12 Nov), numbers above it, the counter top left
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false, animeTiming: true,
  set: { ...SET, aperture: 0, focus: false, bloom: "emissive", hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: score(56),   // the pilot's one score, block B's slice (kit aa-kit.mjs)
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, scenes: ["scifi"] },   // scifi: the aliens' ship and cutter hum
  creative: { length: [T.end, T.end] },
  hook: { show: ["spud"], hint: 0, what: "block B opens mid-film (after block A's walk into the dark): the gallery's corbelled roof, then he climbs" },
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible,
  allowClip: [
    ...lampClip(["spud"], T.end),
    { who: "spud-lamp", from: 0, to: T.end, checks: WORN, reason: "the headlamp band is worn on his head (built on his skin)" },
    { who: "boat", from: 0, to: T.end, checks: ["shell"], reason: "the fishermen and Spud sit on the reed boat's deck" },
    ...WORLD.map((w) => ({ who: w, from: 0, to: T.end, checks: WORN, reason: "the sets the cast stands in and on (gallery ramp, chamber, quarry, boat)" })),
    { who: "spud", with: "kc", from: T.palm, to: T.map, checks: ["reach", "hand-in-prop", "arm-in-prop"], reason: "P15: his palm flat on the granite wall" },
    { who: "fore", with: "cutter", from: 0, to: T.end, checks: ["reach", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "the foreman's palm on the cutter's control slab (his cuff touches it)" },
  ],
  notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-b/make-block-b.mjs (block B of four, v2 by kit/BLOCKS.md How we explain; music = the pilot score's slice).",
});
