// Kit proof for the ancient aliens shared kit: every owner file together in the series' key scenes, built ONLY from
// ../aa-kit.mjs helpers. Not a clip; it is the look gate for Jonny (aa-proof-sheet.png) and the worked example for the four
// block threads. One place per shot, 1000 m apart.
//   node storyboards/series/ancient-aliens/kit/bench/make-aa-proof.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/kit/bench/aa-proof.json --stills <times> --out <dir>
//   node qa/contact.mjs <dir>/aa-proof-*.png --out storyboards/series/ancient-aliens/kit/bench/aa-proof-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { S, SET, SET_LATE, SET_NIGHT, SUN, CAST, VIEW, TOP, cam, far, gizaToday, giza2560, liftShip, site, host, hat, whiteCar, nightOver } from "../aa-kit.mjs";

const c = clip();
const O = (i) => [i * 1000, 0];
const P = { past: O(0), today: O(1), top: O(2), room: O(3), nile: O(4), dusk: O(5), night: O(6), home: O(7), tag: O(8), quarry: O(9) };
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const TOPY = 30;   // the real-scale working top stands this high in the proof

const cast = [
  // 1 the hook, 2560 BC: Spud in front, the crew at work behind him
  who("spud1", CAST.spud, P.past, -29.35, 208.0, 8), who("crew1", CAST.crew, P.past, -27.9, 203.0, -30), who("fore1", CAST.foreman, P.past, -27.0, 200.5, 150),
  // 2 today: tourists, the car, the camel
  who("spud2", CAST.spud, P.today, -0.1, 6.6, 0), who("chip2", CAST.chip, P.today, 1.5, 5.4, -20), who("wedge2", CAST.wedge, P.today, 2.2, 6.1, -35), who("mash2", CAST.mash, P.today, 1.2, 4.4, 160),
  // 3 the working top, real scale: a block comes down beside him
  who("spud3", CAST.spud, P.top, -1.3, 5.6, 10, { y: TOPY }), who("lift3", CAST.lifter, P.top, 2.6, 3.4, -40, { y: TOPY }), who("crew3", CAST.crew, P.top, -0.9, 1.2, 60, { y: TOPY }),
  // 4 the King's Chamber
  who("spud4", CAST.spud, P.room, 0.9, 0.5, 150),
  // 5 the Nile: two fishermen stare at the granite going by
  who("fishA", CAST.workerA, P.nile, 0, 1.1, 0), who("fishB", CAST.workerB, P.nile, 0, -1.1, 0),
  // 6 sunset
  who("spud6", CAST.spud, P.dusk, 92.0, 34.5, 80),
  // 7 night
  who("spud7", CAST.spud, P.night, -143.4, 219.6, 160),
  // 8 the ship goes home
  who("spud8", CAST.spud, P.home, -28.6, 208.5, 8),
  // 9 the tag
  who("spud9", CAST.spud, P.tag, -1.3, -1.7, 20), who("work9", CAST.workerA, P.tag, 0.75, -1.75, 200),
  // 10 the quarry
  who("fore10", CAST.foreman, P.quarry, 2.6, 8.4, -20), who("crew10", CAST.crew, P.quarry, -2.4, 8.0, 20),
];

const view = (o, v) => [o[0] + v.pos[0], o[1] + v.pos[2]];
const props = [
  // 1
  ...far("f1", view(P.past, VIEW.pastWide), { seed: 2 }), ...giza2560("g1", P.past),
  ...liftShip("s1", P.past, { top: TOP(), shipK: 2.5, block: { y: 14, k: 4 } }),
  { id: "workers1", kind: "potatocrowd", x: P.past[0] - 16, z: 172, who: "workers", n: 40, box: [20, 12], seed: 5, lookAt: [0, 14, 0] },
  { id: "aliens1", kind: "potatocrowd", x: P.past[0] - 38, z: 186, who: "aliens", n: 18, box: [10, 6], seed: 8, lookAt: [0, 14, 0] },
  { id: "rows1", kind: "blockrows", x: P.past[0] - 21, z: 176, rows: 2, cols: 5, seed: 3 },
  host("spud1"),
  // 2
  ...far("f2", [P.today[0], 12], { tracks: true, seed: 3 }), ...site("t2", P.today, { gap: 0 }),
  { id: "block2", kind: "limeblock", x: P.today[0] - 1.0, z: 3.4, look: "weathered", size: [1.3, 1.45, 1.3], seed: 9 },
  whiteCar("car2", P.today[0] + 2.2, 2.4, 78), { id: "camel2", kind: "camel", x: P.today[0] - 2.3, z: 5.4, rot: 55, chew: 0.5 },
  host("spud2"), hat("chip2", "chip"), hat("wedge2", "wedge", "#2a8f8a"), hat("mash2", "mash"),
  // 3
  ...far("f3", [P.top[0], 8], { seed: 4 }), { id: "top3", kind: "worktop", x: P.top[0], y: TOPY, z: 0, gap: [0.7, 2.0] },
  ...liftShip("s3", [P.top[0] + 0.7, 2.0], { top: TOPY, s: 1, beam: 0.5, block: { y: 2.4, k: 1 } }), host("spud3"),
  // 4
  { id: "kc4", kind: "kingschamber", x: P.room[0], y: 0, z: 0 }, host("spud4", 1),
  // 5
  { id: "f5-sky", kind: "aasky", x: P.nile[0], z: 14, time: "day" },
  { id: "nile5", kind: "nilewater", x: P.nile[0], y: 0, z: 0, size: [120, 120], reflect: [[P.nile[0], 1.6, 1.3, 5.2]], wake: [[P.nile[0], 2.45, 0.9], [P.nile[0], -2.45, 0.8]] },
  { id: "boat5", kind: "reedboat", x: P.nile[0], y: 0, z: 0, rot: 0, bob: 0.5 },
  { id: "cargo5", kind: "cargoship", x: P.nile[0] - 3, y: 11, z: -22, rot: 20 }, { id: "span5", kind: "granitespan", x: P.nile[0] - 3, y: 5.05, z: -22, rot: 20 },
  // 6
  ...far("f6", view(P.dusk, VIEW.sunset), { time: "sunset", sun: [264, 4], seed: 4 }), ...gizaToday("g6", P.dusk, { sunAz: SUN.sunset, haze: false }),
  { id: "block6", kind: "limeblock", x: P.dusk[0] + 91.2, z: 35.9, look: "weathered", seed: 4 }, { id: "camel6", kind: "camel", x: P.dusk[0] + 87, z: 36.4, rot: 100, lie: 1, grass: false },
  host("spud6"),
  // 7
  ...nightOver("n7", P.night), host("spud7"),
  // 8 the ship goes home: the finished pyramid in moonlight
  ...far("f8", view(P.home, VIEW.pastWide), { time: "night", stars: 5000, moon: [70, 30], seed: 2 }), ...giza2560("g8", P.home, { state: "finished", night: 0.72, sunAz: 70, valley: false }),
  ...liftShip("s8", P.home, { top: TOP(S, 1), hover: 70, beam: 0, lit: 1, block: null, shipK: 2.5 }), host("spud8"),
  // 9
  { id: "rel9", kind: "relievingchamber", x: P.tag[0], y: 0, z: 0 }, { id: "marks9", kind: "gangmarks", x: P.tag[0], y: 0.75, z: -2.611, paint: 0.7 },
  { id: "oil9", kind: "oillamp", x: P.tag[0] - 0.55, y: 0, z: -2.2, wall: 0.41 }, { id: "bowl9", kind: "paintbowl", x: P.tag[0] + 0.95, y: 0, z: -2.25 }, host("spud9", 1),
  // 10
  { id: "f10-sky", kind: "aasky", x: P.quarry[0], z: 12, time: "afternoon" },
  { id: "quarry10", kind: "aswanquarry", x: P.quarry[0], y: 0, z: 0 }, { id: "cut10", kind: "granitecutter", x: P.quarry[0], y: 0, z: 6 }, { id: "stone10", kind: "roughgranite", x: P.quarry[0] + 0.6, y: 0, z: 6 },
];

// params with no default are seeded at 0
c.prop(0, "s1-ship", { beam: 1, wobble: 0 }, 0); c.prop(0, "s3-ship", { beam: 0.5, wobble: 0 }, 0); c.prop(0, "s8-ship", { beam: 0, wobble: 0 }, 0);
c.prop(0, "s1-block", { dust: 0 }, 0); c.prop(0, "s3-block", { dust: 0 }, 0); c.prop(0, "block2", { dust: 0 }, 0); c.prop(0, "block6", { dust: 0 }, 0); c.prop(0, "t2-slot", { dust: 0 }, 0);
c.prop(0, "n7-stars", { show: 1 }, 0); c.prop(0, "n7-orion", { show: 1 }, 0); c.prop(0, "f8-stars", { show: 1 }, 0);
c.prop(0, "cargo5", { beam: 1, wobble: 0 }, 0); c.prop(0, "cut10", { slide: 1, cut: 0.5 }, 0); c.prop(0, "stone10", { cut: 0.5 }, 0);
c.A(0, "fishA", "ride", { prop: "boat5", off: [0, 0.12, 1.1], yaw: 180, sit: true, dur: 0 });
c.A(0, "fishB", "ride", { prop: "boat5", off: [0, 0.12, -1.1], yaw: 180, sit: true, dur: 0 });

const at = (o, pos, look, fov) => cam(o, { pos, look, fov });
const SHOT = {
  hook: [at(P.past, [-30, 0.9, 215], [0, 15.9, 0], 24), "2560 BC: the ship lowers a block (panels 01-03)"],
  today: [at(P.today, [0.3, 1.3, 14.5], [0.2, 2.0, 2], 50), "today: block, car, tourists, camel (panels 04-08)"],
  top: [at(P.top, [-3.4, TOPY + 0.6, 11.2], [0.3, TOPY + 3.4, 2], 70), "the working top: a block lands beside him (panel 09)"],
  room: [at(P.room, [5.0, 1.3, 2.5], [-3.0, 3.1, -0.7], 100), "the King's Chamber (panel 14)"],
  nile: [at(P.nile, [3.4, 1.5, 9.5], [-1.0, 3.6, -6], 58), "80 tonnes over the Nile (panel 17)"],
  quarry: [at(P.quarry, [1.4, 1.7, 16.5], [0.3, 2.0, 6], 56), "Aswan: the cutter (panel 16)"],
  sunset: [at(P.dusk, [100, 1.3, 35], [0, 12, 38], 32), "sunset: the low (panel 23)"],
  night: [at(P.night, [-150, 1.2, 232], [-56, 40, 56], 32), "Orion over the three pyramids (panels 26-27)"],
  home: [at(P.home, [-30, 0.9, 215], [0, 29, 0], 32), "the ship goes home (panels 30-32)"],
  tag: [at(P.tag, [1.2, 0.8, 1.2], [-0.2, 0.7, -2.6], 74), "the tag: the workers' marks (panels 33-36)"],
};
// one storyboard per light (aa-kit.mjs, LIGHT AND TIME OF DAY)
for (const [id, set, names] of [["aa-proof", SET, ["hook", "today", "top", "room", "nile", "quarry"]], ["aa-proof-late", SET_LATE, ["sunset"]], ["aa-proof-night", SET_NIGHT, ["night", "room", "home", "tag"]]]) {
  const k = clip(); k.items.push(...c.items);
  const shots = [];
  names.forEach((name, i) => { const T = r3(0.1 + i); shots.push([name, T, SHOT[name][0]]); k.cap(T, T + 0.9, SHOT[name][1], 1760, false, { kinetic: false, size: 36 }); });
  const END = r3(0.1 + names.length + 0.1);
  console.log(id, "stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
  write(import.meta.url, {
    id, title: "Ancient Aliens kit proof", idea: "Kit proof for the ancient aliens shared kit: all six owner files together in the key scenes, not a clip",
    fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
    set, music: false, sound: { auto: false },
    hook: { show: ["spud1"], hint: 0, what: "engine test" },
    cast, props, captions: k.captions, beats: k.beats(shots, END),
    notes: "Generated by storyboards/series/ancient-aliens/kit/bench/make-aa-proof.mjs (kit proof, no reviews).",
  });
}
