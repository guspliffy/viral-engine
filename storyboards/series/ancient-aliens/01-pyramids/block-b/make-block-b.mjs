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
import { SET, CAST, HOST_VOICE, host } from "../../kit/aa-kit.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false, pos: 430, style: { size: 62, kinetic: true } } }), { A, sfx, cap, see } = c;
const O = (i) => [i * 1000, 0];
const P = { gal: O(0), room: O(1), map: O(2), quarry: O(3), nile: O(4) };
const SLOPE = Math.tan((26.3 * Math.PI) / 180);
const galY = (z) => r3(-z * SLOPE);

// spoken lengths (the render prints `speech: "..." lasts Xs spoken`; VoxCPM2, voice reaper)
const DUR = { beams: 4.43, nogranite: 3.43, aswan: 3.78, saws: 2.85, tonnes: 1.21, ask: 4.77, wait: 0.71 };

// TIMES (block clock; 0 = story 0:56). Slot 44.0 s.
const T = {
  gal: 0, room: 4.6, beams: 6.0, palm: 11.6, nogranite: 12.1, map: 15.65, quarry: 21.0, saws: 23.5, nile: 27.6, tonnes: 30.0,
  ask: 33.8, end: 44.0,
};
T.aswan = r3(T.map + 0.3); T.askLine = r3(T.ask + 0.5); T.wait = r3(T.askLine + DUR.ask + 1.0);

// ---------------------------------------------------------------- cast (Spud is one actor who moves from place to place)
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.3, seed: 2.1, ...extra });
const SP = {
  gal: [0, -1.2, 180],                 // on the ramp, his back to us, climbing to -z
  room: [0.9, 0.25, -90],              // the middle of the King's Chamber, facing west (the sarcophagus end)
  wall: [0.6, -2.0, 90],               // at the north wall (on his left), palm on the granite
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
// the say MACRO (not c.say's talk action): only a say macro gets the real voice in a beat storyboard (engine/voice/speech.mjs
// withSpeech); its caption is the speech lettering, upper third (Jonny 12 Nov)
const TAKE = { saws: 2, tonnes: 2 };   // take 1 was heard as "copper sores" and "für 80 Tonnen"
const say = (t, line, key, tone = "calm") => c.at(t, { macro: "say", who: "spud", line, tone, dur: DUR[key], voice: HOST_VOICE, pos: 430, ...(TAKE[key] && { take: TAKE[key] }) });
// put Spud in a new place on a hard cut (0.02 s before it, so the first frame of the shot already has him there)
const place = (t, o, [x, z, face], y = 0) => {
  const t0 = r3(t - 0.02);
  A(t0, "spud", "move", { to: [r3(o[0] + x), r3(o[1] + z)], y, dur: 0.01, steps: 0, ease: "linear" });
  A(t0, "spud", "turn", { to: face, dur: 0.01, ease: "linear" });
  arm(t0, "spud", "R", "rest", 0.01); arm(t0, "spud", "L", "rest", 0.01); look(t0, "spud", [0, 0], 0.01);
};
const counter = (from, to) => cap(from, to, "CLUE 2/5", 236, false, { x: 250, size: 52, kinetic: false });

// seeds (params with no default start at 0)
prop(0, "cargo", { beam: 1, wobble: 0.6 }, 0); prop(0, "cutter", { slide: 1, cut: 0 }, 0); prop(0, "stone", { cut: 0 }, 0);
A(0, "fishA", "ride", { prop: "boat", off: [0, 0.12, 1.1], yaw: -90, sit: true, dur: 0 });
A(0, "fishB", "ride", { prop: "boat", off: [0, 0.12, 0], yaw: -90, sit: true, dur: 0 });
look(0, "fishA", [0.2, -0.1], 0); look(0, "fishB", [-0.2, -0.1], 0);
look(0, "fore", [0, -0.35], 0); arm(0, "fore", "R", { world: [r3(P.quarry[0] - 1.6), 0.6, 8.6] }, 0);   // palm on the control slab

// ---------------------------------------------------------------- P13 the Grand Gallery 0-4.6: he climbs into the dark
counter(0.3, T.ask);
A(0.05, "spud", "move", { to: [P.gal[0], -4.2], y: galY(-4.2), dur: 4.4, steps: 7, ease: "linear" });
look(0.1, "spud", [0, 0.35], 0.4);
see(0.2, 4.4, ["spud", "gal"], "P13: he climbs the ramp up the gallery, only his headlamp lights it");

// ---------------------------------------------------------------- P14 the King's Chamber 4.6-11.6: granite beams, 80 t
place(T.room, P.room, SP.room);
look(r3(T.room + 0.3), "spud", [0, 0.2], 0.3);
look(r3(T.beams - 0.4), "spud", [0, 0.95], 0.5);                // he looks up at the ceiling
say(T.beams, "The ceiling: granite beams. Up to eighty tonnes each.", "beams");
cap(r3(T.beams + 2.0), r3(T.palm - 0.05), "80 t = 13 elephants", 1150, false, { x: 490, size: 70, kinetic: false });
see(T.room, T.palm, ["spud", "kc"], "P14: the room of granite, the nine beams overhead");

// ---------------------------------------------------------------- P15 palm on the granite 11.6-15.0
place(T.palm, P.room, SP.wall);
look(r3(T.palm + 0.05), "spud", [0.75, 0.1], 0.01);   // at the wall (right on screen)
arm(r3(T.palm + 0.2), "spud", "L", { world: [r3(P.room[0] + 0.72), 0.5, -2.585] }, 0.5, "out");   // his palm flat on the stone
say(T.nogranite, "There is no granite at Giza.", "nogranite");
A(r3(T.nogranite + DUR.nogranite + 0.1), "spud", "look", { to: [0, 0.05], dur: 0.25, blink: false });   // to us
see(T.palm, T.map, ["spud.face", "kc"], "P15: his palm flat on the granite wall");

// ---------------------------------------------------------------- P15 b the map 15.0-21.6: Aswan, 800 km up the Nile
say(T.aswan, "It comes from Aswan, more than eight hundred kilometres up the Nile.", "aswan");
see(T.map, T.quarry, ["map"], "P15 b: the route on the map, Giza to Aswan");

// ---------------------------------------------------------------- P16 Aswan, 2560 BC 21.6-27.6: the cutter slices dead straight
place(T.quarry, P.quarry, SP.quarry);
look(r3(T.quarry + 0.05), "spud", [-0.5, 0.05], 0.01);
prop(r3(T.quarry + 0.2), "cutter", { cut: 1 }, 0.1, "linear");
prop(r3(T.quarry + 0.3), "stone", { cut: 1 }, 4.4, "inOut");
prop(r3(T.quarry + 4.8), "cutter", { cut: 0 }, 0.15, "linear");
sfx(r3(T.quarry + 0.2), "scrape", { gain: 0.22, dur: 4.6, reason: "the cutter grinds through the granite" });
sfx(r3(T.quarry + 0.1), "kenney/space-engine-low", { gain: 0.12, dur: 5.6, reason: "the cutter's low physical hum" });
sfx(r3(T.quarry + 4.9), "thud", { gain: 0.85, reason: "the cut half settles 2 cm" });
look(r3(T.saws - 0.3), "spud", [0.5, 0.1], 0.3);
say(T.saws, "They tell you: copper saws and wooden boats...", "saws", "dry");
see(T.quarry, T.nile, ["spud.face", "cutter", "stone", "fore"], "P16: the alien cutter slices the beam dead straight, he watches, then tells us");

// ---------------------------------------------------------------- P17 the Nile 27.6-33.6: 80 t over the river
place(T.nile, P.nile, [0, 0, 0]);
A(r3(T.nile - 0.01), "spud", "ride", { prop: "boat", off: [0, 0.12, -1.1], yaw: -90, sit: true, dur: 0 });
prop(r3(T.nile - 0.02), "spud-lamp", { lit: 0 }, 0.01, "linear");
for (const id of ["cargo", "span"]) { prop(T.nile, id, { x: P.nile[0] - 0.5 }, r3(T.ask - T.nile), "linear"); prop(T.ask, id, { x: P.nile[0] + 3.5 }, r3(T.end - T.ask), "linear"); }   // slow, over the boat in P17, behind him in P18
look(T.nile, "fishA", [-0.3, 1.0], 0.3); look(r3(T.nile + 0.15), "fishB", [-0.1, 1.0], 0.3);
A(r3(T.nile + 0.4), "fishA", "expr", { expr: "shocked", dur: 0.2 }); A(r3(T.nile + 0.55), "fishB", "expr", { expr: "terrified", dur: 0.2 });
look(r3(T.nile + 0.1), "spud", [-0.2, 0.8], 0.3);
look(r3(T.tonnes - 0.4), "spud", [0.5, 0.1], 0.3);
say(T.tonnes, "For eighty tonnes.", "tonnes", "dry");
for (let t = T.nile; t < T.end - 0.5; t += 5.6) sfx(r3(t), "ai/car-waves", { gain: 0.16, dur: r3(Math.min(6, T.end - t)), reason: "the Nile lapping at the reed boat" });
sfx(r3(T.nile), "kenney/space-engine-low", { gain: 0.08, dur: r3(T.end - T.nile - 0.5), reason: "the cargo ship's low hum overhead" });
see(T.nile, T.ask, ["fishA.face", "fishB.face", "span", "cargo"], "P17: two fishermen stare up at the granite going by");

// ---------------------------------------------------------------- P18 the ask 33.6-44.0: Aliens 1, Humans 2
cap(r3(T.ask + 0.2), T.end, "ALIENS 1 · HUMANS 2", 236, false, { size: 64, kinetic: false });
look(r3(T.ask - 0.02), "spud", [0, 0], 0.01); A(r3(T.ask - 0.02), "spud", "expr", { expr: "deadpan", dur: 0.01 }); A(r3(T.ask - 0.02), "spud", "face", { lid: 0.3, dur: 0.01 });
say(T.askLine, "Aliens? Type one. Humans? Type two.", "ask", "dry");
say(T.wait, "I'll wait.", "wait", "dry");
A(r3(T.wait + DUR.wait + 0.6), "spud", "face", { browL: 0.6, dur: 0.3 });
A(r3(T.wait + DUR.wait + 0.6), "spud", "still", { dur: r3(T.end - T.wait - DUR.wait - 0.7), idle: 0.2 });
see(T.ask, T.end, ["spud.face"], "P18: close on him, the ask, then he waits");

// ---------------------------------------------------------------- shots (one per panel)
const G = P.gal[0], R = P.room[0], M = P.map[0], Q = P.quarry[0], N = P.nile[0];
const beats = c.beats([
  ["P13 the Grand Gallery", T.gal, { pos: [G + 0.3, 0.95, 1.0], look: [G, 2.6, -7], fov: 58, to: { pos: [G + 0.2, 1.95, -1.2], look: [G, 4.0, -9], fov: 58 }, dur: T.room - 0.05, ease: "inOut" }, "hook"],
  ["P14 the King's Chamber", T.room, { pos: [R + 4.9, 1.5, 0.15], look: [R - 4, 2.0, 0], fov: 74, to: { pos: [R + 4.9, 1.3, 0.15], look: [R - 2, 4.6, 0], fov: 74 }, dur: 5.0, ease: "inOut" }],
  ["P15 palm on the granite", T.palm, { pos: [R + 2.5, 0.85, -1.15], look: [R + 0.6, 0.72, -2.2], fov: 46 }],
  ["P15 b Aswan, 800 km up the Nile", T.map, { pos: [M - 0.6, 13.6, 12], look: [M - 0.6, 13.6, 0], fov: 44, to: { pos: [M + 1.5, 4.9, 12], look: [M + 1.5, 4.9, 0], fov: 44 }, dur: r3(T.quarry - T.map - 0.05), ease: "inOut" }],
  ["P16 Aswan 2560 BC: the cutter", T.quarry, { pos: [Q + 0.1, 1.5, 16.5], look: [Q + 0.1, 1.8, 7], fov: 54, to: { pos: [Q + 0.9, 1.25, 14.2], look: [Q + 0.8, 1.5, 8], fov: 54 }, dur: r3(T.nile - T.quarry), ease: "inOut" }],
  ["P17 80 tonnes over the Nile", T.nile, { pos: [N + 0.3, 1.25, 6.8], look: [N - 0.2, 2.9, -6], fov: 60 }],
  ["P18 the ask", T.ask, { pos: [N - 0.95, 1.0, 3.6], look: [N - 1.1, 1.5, 0], fov: 42 }, "payoff"],
], T.end);

const WORLD = ["gal", "kc", "map", "quarry", "river", "boat"];
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
write(import.meta.url, {
  id: "aa01-block-b",
  title: "Ancient Aliens EP01 block B: the granite",
  idea: "Who really built the pyramids? Block B (0:56-1:40): the granite beams of the King's Chamber came 800 km from Aswan; the alien cutter slices one, a ship carries it over the Nile; Aliens 1, Humans 2",
  format: "series: Ancient Aliens (Spud hosts in Reaper's voice, 5 numbered clues, the sun as the clock); block B of four, joined later",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [200, 1440],   // speech in the upper third (Jonny 12 Nov), the counter top left, the numbers low
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false, animeTiming: true,
  set: { ...SET, aperture: 0, focus: false, bloom: "emissive", hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false,   // the join pass lays ONE orchestra bed over the whole film (BLOCKS.md)
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, scenes: ["scifi"] },   // scifi: the aliens' ship and cutter hum
  creative: { length: [T.end, T.end] },
  hook: { show: ["spud"], hint: 0, what: "block B opens mid-film (after block A's walk into the dark): he climbs the Grand Gallery" },
  cast, props: props.map((q) => (STAGED[q.id] ? { ...q, staged: STAGED[q.id] } : q)), captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud-lamp", from: 0, to: T.end, checks: WORN, reason: "the headlamp band is worn on his head (built on his skin)" },
    { who: "boat", from: 0, to: T.end, checks: ["shell"], reason: "the fishermen and Spud sit on the reed boat's deck" },
    ...WORLD.map((w) => ({ who: w, from: 0, to: T.end, checks: WORN, reason: "the sets the cast stands in and on (gallery ramp, chamber, quarry, boat)" })),
    { who: "spud", with: "kc", from: T.palm, to: T.map, checks: ["reach", "hand-in-prop", "arm-in-prop"], reason: "P15: his palm flat on the granite wall" },
    { who: "fore", with: "cutter", from: 0, to: T.end, checks: ["reach", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "the foreman's palm on the cutter's control slab (his cuff touches it)" },
  ],
  notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-b/make-block-b.mjs (block B of four; music false; kit: ../../kit).",
});
