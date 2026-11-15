// ANCIENT ALIENS EP03 "Where did Atlantis go?", BLOCK D (story 2:34-3:24, TikTok part 4): clue 4 Helike, the low, midnight,
// the city leaves, the cost, the tag. Panels 37-48 of ancient-aliens-03-sheet-4.png. Story: /mnt/project-files/videos/
// ancient-aliens/03-atlantis/STORY.md. Brief: ../kit/BLOCKS.md. Notes: NOTES.md next to this file.
//   node storyboards/series/ancient-aliens/03-atlantis/block-d/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/03-atlantis/block-d/make-block-d.mjs    -> aa03-d-wide.json (+ --tall after Jonny's OK)
//
// THE LOOK (Jonny 15 Nov, "All 3D like Stonehenge"): every place Spud or Plato is in is real 3D built from the plate
// (block-local kinds in engine/page/props-at-d-*.js); only the two maps are flat paper (plates on the plain set).
// Emotion map (STORY.md): chills at Helike, impossibility at the outline, loneliness at the low (music out), awe at the
// lift-off, loss at the empty seat, a smile at the tag.
//
// Chain (but / therefore): a Greek city DID sink in one night (hook) -> therefore clue 4: Helike, 373 BC -> but Plato was
// alive then -> but Atlantis was bigger than Libya and Asia, nothing sinks that in a day -> therefore the low: four clues, no
// city, almost midnight -> he dives, the clock hits 00:00 -> therefore the city rises: it didn't sink, it left -> but one
// seat is free and he stays: somebody had to tell you (the cost) -> but in Athens Plato winks.
// Part 4 (tall): the block's first shot IS its hook (STORY.md part hooks row 4: "373 BC. A city sank overnight.", text
// "373 BC"), so the tall cut has no extra hook shot (H 0) and stands alone from frame 0.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, FAR, PLACE, AT_NIGHT, hostSay, clueTag, atlantisClock, count, score, host, lampClip, CAST } from "../kit/at-kit.mjs";
import { LINES, SUBS, toneOf } from "./lines.mjs";

const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l.split(/\s+/).length * 0.42)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const T0 = 154;   // story time of the block's first frame
const TALL = process.argv.includes("--tall");

// ---------------------------------------------------------------- places (BLOCKS.md / director: D owns PLACE 30-33)
const O = { helike: PLACE(30), room: PLACE(31), hatch: PLACE(32), city: PLACE(33), night: PLACE(35) };
// props-at-d-ship.js header: Spud in the storm swell 2950 m out, 38 deg from +z toward +x (panel 42); the night sea of 41 and 46 is its own
// place (the storm sky reaches 12 km), Spud 4042 m from the far ring's ground point
const pol = (r, deg, y) => [r3(r * Math.sin(deg * Math.PI / 180)), y, r3(r * Math.cos(deg * Math.PI / 180))];
const STORM_XZ = [r3(O.city[0] + pol(2950, 38)[0]), r3(O.city[1] + pol(2950, 38)[2])], NIGHT_XZ = [O.night[0] + 22, O.night[1] - 4042];
// the two maps are flat paper on the plain set (set-plate.js), hung at the world origin (no 3D place there)
const MAP38 = "assets/plates/at-d-greece-map.png", MAP40 = "assets/plates/at-d-world-map.png";
const PL = { src: MAP38, z: -2.2, center: [0, 1.6], height: 3.2, depth: false, motion: false, dust: 0, tint: "#ffffff" };
const MAPPX = [1536, 1024];
const mapCam = (cx, cy, vw, F) => {   // looks straight at plate pixel (cx, cy); the window is vw plate px wide (wide) / tall
  const k = PL.height / MAPPX[1], X = (cx - MAPPX[0] / 2) * k, Y = 1.6 - (cy - MAPPX[1] / 2) * k, dist = 3.4;
  const vh = F.key === "wide" ? vw * k * 9 / 16 : vw * k * 16 / 9;
  return { pos: [r3(X), r3(Y), r3(-2.2 + dist)], look: [r3(X), r3(Y), -2.2], fov: r3(2 * Math.atan(vh / 2 / dist) * 180 / Math.PI) };
};
// map pixels (plate 38 Greece; plate 40 the Atlantic, Europe and North Africa, 15 Nov)
const HELIKE = [560, 428], ATHENS = [870, 478];
const ISLE = [180, 60, 680, 860];   // plate 40 (director, 15 Nov): Plato's 3,000 x 3,800 km, its shore ~600 km west of Gibraltar (1011, 518)

const at = (pos, look, fov) => ({ pos, look, fov });
// the hatch crew (props-at-d-hatch.js header): seats on r 5.15 / 6.7 facing the hatch axis; S3 (5.15, 0 deg) is THE EMPTY SEAT
const DEG = Math.PI / 180, polar = (r, d) => [r * Math.cos(d * DEG), r * Math.sin(d * DEG)];
const faceTo = (x, z) => r3((((Math.atan2(-x, -z) / DEG) % 360) + 360) % 360);
const CREW_SEATS = { cA: [5.15, -32], cB: [5.15, -16], cC: [5.15, 16], cD: [6.7, -34], cE: [6.7, 30] };
const HATCH_SEATED = Object.entries(CREW_SEATS).map(([id, [r, d]]) => { const [x, z] = polar(r, d); return [id, faceTo(x, z)]; });
function HATCH_CREW() {
  const o = PLACE(32), crew = Object.entries(CREW_SEATS).map(([id, [r, d]], i) => { const [x, z] = polar(r, d); return { id, character: CAST.crew, at: [r3(o[0] + x), r3(o[1] + z)], face: faceTo(x, z), expr: "kind", follow: 0.2, seed: 3.2 + i }; });
  const [fx, fz] = polar(5.7, 52);
  return [...crew, { id: "foreman", character: CAST.foreman, at: [r3(o[0] + fx), r3(o[1] + fz)], face: faceTo(fx, fz), expr: "kind", follow: 0.2, seed: 3.1 }];
}
const rel = (o, v) => ({ pos: [r3(o[0] + v.pos[0]), r3(v.pos[1]), r3(o[1] + v.pos[2])], look: [r3(o[0] + v.look[0]), r3(v.look[1]), r3(o[1] + v.look[2])], fov: v.fov, ...(v.near && { near: v.near }) });
const pick = (F, v) => v[F.key] ?? v;
const mv = (F, o, a, b, dur, ease = "inOut") => { const A = rel(o, pick(F, a)), B = rel(o, pick(F, b)); return { ...A, to: { pos: B.pos, look: B.look, fov: B.fov }, dur, ease }; };

function build(F) {
  const H = 0, c = clip({ faces: "strong" }), { A, sfx, cap } = c;
  const PR = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t + H), id, set, dur, ease);
  const set0 = (t, id, s) => c.prop(r3(t - 0.02), id, s, 0, "linear");
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const say = (t, k, next, o = {}) => { const hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - DUR[k] - 0.05))); hostSay(c, F, r3(t), o.who ?? "spud", LINES[k], DUR[k], toneOf(k), { hold, ...(SUBS[k] && { sub: SUBS[k] }) }); return r3(t + DUR[k]); };
  const NUM_Y = F.key === "wide" ? 330 : 660;   // counters and big texts sit under the subtitle, never on it (EP02 lesson)
  const big = (t0, t1, text, o = {}) => cap(r3(t0), r3(t1), text, o.y ?? NUM_Y, false, { size: F.numSize, kinetic: false, ...o });

  // each actor is shown only in its own shots (a body at another place never enters a check's projection, EP02 lesson)
  const only = (id, spans) => { A(0, id, "hide"); for (const [a, b] of spans) { A(r3(a), id, "show"); if (b < END) A(r3(b), id, "hide"); } };
  // ---------------------------------------------------------------- the beats (block time; story = 154 + t)
  const T = { hook: 0, map1: 4.4, shore: 7.0, room: 10.9, map2: 13.4, low: 19.1, dive: 24.3, storm: 25.1, rise: 27.3, under: 31.0,
    hatch: 34.3, far: 40.2, tag: 44.2, block: 47.5, END: 50.0 };
  const END = T.END;
  only("spudK", [[0, T.map1]]); only("spudW", [[T.room, T.map2]]); only("spudS", [[T.low, T.storm], [T.far, T.tag]]); only("spudC", [[T.storm, T.rise]]);
  only("spudB", [[T.hatch, T.far]]); only("spudT", [[T.block, END]]); only("plato", [[T.room, T.map2], [T.tag, END]]);
  for (const id of ["foreman", "cA", "cB", "cC", "cD", "cE"]) only(id, [[T.hatch, T.far]]);
  // the city kinds share their params by place (props-at-d-ship.js): seed lightning on sea, storm, hull and whirl together, rise on city + hull
  const CITY = ["cityS", "cityStorm", "hull", "whirl"];
  const bolt = (t, v, dur = 0.01) => CITY.forEach((id) => PR(t, id, { lightning: v }, dur));
  const riseTo = (t, v, dur = 0.01, ease = "linear") => ["city", "hull"].forEach((id) => PR(t, id, { rise: v }, dur, ease));
  set0(0.02, "city", { rise: 0, sea: 1, lightning: 0.3 }); set0(0.02, "hull", { rise: 0, falls: 0.3, beam: 0, lit: 0.6 }); bolt(0.02, 0.3); set0(0.02, "whirl", { spin: 0, calm: 0, show: 1 });
  set0(0.02, "ring", { shrink: 0 }); set0(0.02, "nightS", { calm: 0.4 });

  // ---------------------------------------------------------------- cast: one actor per place (hidden elsewhere by the cut)
  const cast = [
    { id: "spudK", character: CAST.spud, at: [O.helike[0], O.helike[1]], face: 340, expr: "neutral", follow: 0.2, seed: 2.1 },          // Helike knoll
    { id: "spudW", character: CAST.spud, at: [O.room[0] - 0.7, O.room[1] - 2.25], y: 0.62, face: 0, expr: "neutral", follow: 0.2, seed: 2.2 },      // at the window, outside
    { id: "plato", character: "ancient-aliens/plato", at: [O.room[0] + 0.66, O.room[1] - 1.35], face: 0, expr: "kind", follow: 0.2, seed: 4.1 },
    { id: "spudS", character: CAST.spud, at: NIGHT_XZ, y: -0.5, face: 0, expr: "neutral", follow: 0.2, seed: 2.3 },   // in the night sea (41, 46)
    { id: "spudC", character: CAST.spud, at: STORM_XZ, y: -0.5, face: 218, expr: "neutral", follow: 0.2, seed: 2.6 },   // in the storm swell (42)
    { id: "spudB", character: CAST.spud, at: [O.hatch[0] - 2.2, O.hatch[1]], face: 321, expr: "neutral", follow: 0.2, seed: 2.4 },          // in the beam (flies)
    ...HATCH_CREW(),
    { id: "spudT", character: CAST.spud, at: [O.room[0] + 0.25, O.room[1] + 9], face: 0, expr: "neutral", follow: 0.2, seed: 2.5 },   // the tag, in front of the desk
  ];
  const props = [
    ...["spudK", "spudW", "spudS", "spudC", "spudB", "spudT"].map((w) => ({ ...host(w, w === "spudS" || w === "spudC" ? 1 : 0), id: `${w}-lamp` })),   // the lamp shines only in the sea (41, 42, 46)
    // HELIKE (panel 37): kind of builder D1, origin = Spud's spot on the knoll
    { id: "helike", kind: "helike", x: O.helike[0], y: 0, z: O.helike[1], flood: 0, staged: "Helike, 373 BC, a full moon: the sea rises over the roofs" },
    // PLATO'S ROOM (panels 39, 47-48): kinds of builder D2, origin = the room's floor centre
    { id: "room", kind: "platoroom", x: O.room[0], y: 0, z: O.room[1], occ: [[0.66, 1.35, -1.3, 0.3]], staged: "Plato's room in Athens at night, the bronze lamp" },
    { id: "chair", kind: "klismos", x: O.room[0] + 0.66, y: 0, z: O.room[1] - 1.35, rot: 0 },
    // THE CITY AT MIDNIGHT (panels 41-44, 46): the kit city at night + builder D3's hull, falls, beam, whirlpool, storm sky
    { id: "city", kind: "atlantis", x: O.city[0], y: 0, z: O.city[1], light: "night", sea: 1, flood: false, mountains: false },
    { id: "hull", kind: "shiphull", x: O.city[0], z: O.city[1] },
    { id: "cityS", kind: "shipsea", x: O.city[0], z: O.city[1], calmAt: [r3(STORM_XZ[0] - O.city[0]), r3(STORM_XZ[1] - O.city[1]), 26] },
    { id: "cityStorm", kind: "shipstorm", x: O.city[0], z: O.city[1] },
    { id: "whirl", kind: "shipwhirl", x: O.city[0], z: O.city[1] },
    // THE NIGHT SEA (41, 46): stars, the calm swell, the far ring (the city, gone up)
    { id: "stars", kind: "shipstars", x: NIGHT_XZ[0], z: NIGHT_XZ[1], reach: 8500 },   // centred on Spud, inside far 9000 (a 12 km dome 4 km off-centre got cut by the far plane: hard-edged Milky Way in 41)
    { id: "nightS", kind: "shipsea", x: O.night[0], z: O.night[1], grade: "night", whirl: false, stars: 1, calmAt: [22, -4042, 24] },
    { id: "ring", kind: "shipring", x: O.night[0], z: O.night[1] - 9000, y: -6000 },
    // THE HATCH (panel 45): builder D4's `hatchhall`, origin = deck level at the hatch axis; the kit sea (night) at y -9 under it
    { id: "hatch", kind: "hatchhall", x: O.hatch[0], y: 0, z: O.hatch[1], lit: 1, beam: 1 },
    { id: "hatchsea", kind: "sea", x: O.hatch[0], z: O.hatch[1], y: -9, grade: "night", horizon: true, calm: [0, 0, 18], foam: [[-2.2, 0, 2.7, 0.7]], mist: [-2.2, 0, 5], mistA: 0.22, swell: 0.35, reach: 9000 },
  ];
  const D = (o) => props.push(o);   // builder kinds appended in PLACES below once their headers are in

  // ================================================================= 37 HOOK (0-4.4): Helike, the sea over the roofs
  look(0, "spudK", [0.4, -0.15], 0.01); expr(0, "spudK", "neutral", { brow: 0.7, lid: 0.2 }, 0.01);
  set0(0.02, "helike", { flood: 0.25 }); PR(0.1, "helike", { flood: 0.85 }, 4.2, "inOut");
  c.at(0.05, { fx: "shake", amp: 0.5, dur: 0.6 });
  say(0.2, "d1", T.map1);
  big(0, T.map1 - 0.05, "373 BC");
  A(1.9, "spudK", "turn", { to: 320, dur: 0.6, ease: "inOut" }); look(2.0, "spudK", [0.1, 0.05], 0.3);
  sfx(0, "ai/storm-wind", { gain: 0.07, dur: T.map1, reason: "night wind on the knoll" });
  sfx(0, "ai/water-gush", { gain: 0.32, dur: T.map1, reason: "the sea pouring between the houses" });
  sfx(0.05, "ai/thunder", { gain: 0.28, reason: "the earthquake's deep rumble (no lightning: the ground)" });

  // ================================================================= 38 CLUE 4 (4.4-7.0): the Gulf of Corinth, Helike and Athens
  clueTag(c, F, T.map1, END, 4);
  say(T.map1 + 0.1, "d2a", T.shore);
  // the map marks: the two dots (Helike, Athens) pop in one after the other (maproute with no line: dots only)
  D({ id: "dots38", kind: "maproute", plate: PL, x: 0, y: 0, z: 0, dotsAt: [HELIKE, ATHENS], dots: 0, draw: 0 });
  PR(T.map1 + 0.5, "dots38", { dots: 0.5 }, 0.3, "out"); PR(T.map1 + 1.6, "dots38", { dots: 1 }, 0.3, "out");

  // ================================================================= 37b BY MORNING IT WAS GONE (7.0-10.9): along the shore
  set0(T.shore, "helike", { flood: 0.85 }); PR(T.shore + 0.1, "helike", { flood: 1 }, 3.4, "out");
  say(T.shore + 0.15, "d2b", T.room);
  sfx(T.shore, "ai/water-gush", { gain: 0.4, dur: r3(T.room - T.shore), reason: "the sea between the house walls, up to the roofs" });

  // ================================================================= 39 PLATO WAS ALIVE (10.9-13.4): Spud at the window, Plato writing
  A(T.room - 0.02, "plato", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
  c.arm(T.room, "plato", "R", { o: [-0.2, 0.283, 0.68] }, 0.01); c.arm(T.room, "plato", "L", { o: [-0.12, 0.283, 0.5] }, 0.01);
  look(T.room, "plato", [0, -0.4], 0.01);
  for (let k = 0; k < 4; k++) c.arm(r3(T.room + 0.3 + k * 0.45), "plato", "R", { o: [r3(-0.2 + (k % 2) * 0.06), 0.283, 0.68] }, 0.4, "inOut");   // he writes
  look(T.room, "spudW", [0.5, -0.3], 0.01); expr(T.room, "spudW", "neutral", { brow: 0.5 }, 0.01);
  say(T.room + 0.25, "d2c", T.map2);
  look(T.room + 1.4, "spudW", [0, 0.05], 0.25); expr(T.room + 1.4, "spudW", "surprised", { open: 0.2 }, 0.2);   // to us: he was ALIVE
  sfx(T.room, "ai/storm-wind", { gain: 0.03, dur: r3(T.map2 - T.room), reason: "a quiet night outside the window" });

  // ================================================================= 40 BIGGER THAN LIBYA AND ASIA (13.4-19.1): the outline
  PR(T.map2 - 0.02, "dots38", { dots: 0 });   // the Greece dots ride the paper: off before the plate swaps
  D({ id: "isle", kind: "mapoutline", plate: PL, x: 0, y: 0, z: 0, box: ISLE, draw: 0, fillP: 0 });
  PR(T.map2 + 0.3, "isle", { draw: 1 }, 1.5, "inOut"); PR(T.map2 + 1.9, "isle", { fillP: 1 }, 1.0, "out");
  const d3a = say(T.map2 + 0.2, "d3a", T.map2 + 3.75);
  say(r3(T.map2 + 3.75), "d3b", T.low);
  big(r3(T.map2 + 3.75), T.low - 0.05, "1 DAY?");

  // ================================================================= 41 THE LOW (19.1-24.3): only his head and the headlamp in the black sea
  const swim = (t, y, dur = 0.01, ease) => A(r3(t), "spudS", "fly", { to: { x: NIGHT_XZ[0], y, z: NIGHT_XZ[1] }, dur, ...(ease && { ease }) });
  swim(T.low - 0.04, -0.5);
  A(r3(T.low - 0.02), "spudS", "turn", { to: 25, dur: 0.01 });
  look(T.low, "spudS", [0.3, -0.05], 0.01); expr(T.low, "spudS", "neutral", { brow: 0.3, lid: 0.45 }, 0.01);
  say(T.low + 0.3, "d4", T.dive);
  look(T.low + 2.6, "spudS", [0, 0.05], 0.4);
  sfx(T.low, "ai/car-waves", { gain: 0.18, dur: r3(T.dive - T.low), reason: "the swell, nothing else: the music is out (the low)" });

  // ================================================================= DIVE (24.3-25.1): he ducks under; the clock hits 00:00
  swim(T.dive + 0.1, -2.4, 0.5, "in");
  sfx(T.dive + 0.2, "ai/swim-splash", { gain: 0.45, reason: "he dives" });

  // ================================================================= 42 MIDNIGHT (25.1-27.3): the city in the storm, lightning
  bolt(T.storm, 1); bolt(T.storm + 0.07, 0.3); bolt(T.storm + 1.4, 1); bolt(T.storm + 1.47, 0.3);
  look(T.storm, "spudC", [0, 0.25], 0.01); expr(T.storm, "spudC", "surprised", { open: 0.25 }, 0.01);
  sfx(T.storm, "ai/thunder", { gain: 0.5, reason: "lightning over the city: midnight" });
  sfx(T.storm, "ai/storm-lake", { gain: 0.3, dur: r3(T.under - T.storm), reason: "storm, rain and swell" });

  // ================================================================= 43 THE RISE (27.3-31.0): the rings lift out of the sea, falls, beam (no voice)
  riseTo(T.rise + 0.2, 0.6, 3.6, "inOut"); PR(T.rise + 0.2, "hull", { falls: 1, lit: 0.9 }, 1.0, "out"); PR(T.rise + 1.6, "hull", { beam: 1 }, 1.2, "out");
  PR(T.rise + 1.6, "whirl", { spin: 1 }, r3(T.hatch - T.rise - 1.6)); bolt(T.rise + 2.2, 1); bolt(T.rise + 2.27, 0.3);
  sfx(T.rise, "kenney/space-engine-low", { gain: 0.3, dur: r3(T.under - T.rise + 3), reason: "a deep physical hum: the ship wakes" });
  sfx(T.rise + 0.4, "ai/water-gush", { gain: 0.55, dur: 3.3, reason: "the sea pouring off the rim" });

  // ================================================================= 44 IT DIDN'T SINK. IT LEFT. (31.0-34.3): under the hull
  PR(T.under, "hull", { falls: 0.6, lit: 1 }, 3.0, "inOut");
  say(T.under + 0.3, "d5a", T.under + 2.3);
  say(r3(T.under + 2.3), "d5b", T.hatch);
  sfx(T.under, "ai/water-gush", { gain: 0.35, dur: r3(T.hatch - T.under), reason: "water sheets off the hull" });

  // ================================================================= 45 ONE SEAT LEFT (34.3-40.2): the foreman waves, he rises, stops, stays
  const lift = (t, x, y, dur = 0.01, ease) => A(r3(t), "spudB", "fly", { to: { x: r3(O.hatch[0] + x), y, z: O.hatch[1] }, dur, ...(ease && { ease }) });
  lift(T.hatch - 0.04, -2.2, -6.2); set0(T.hatch, "hatch", { beam: 0.6 });
  for (const [id, f] of HATCH_SEATED) A(r3(T.hatch - 0.04), id, "sit", { seat: "none", rot: f, height: 0.45, dur: 0.01, hands: "lap" });
  look(T.hatch, "spudB", [0.2, 0.6], 0.01); expr(T.hatch, "spudB", "neutral", { brow: 0.5 }, 0.01);
  look(T.hatch, "foreman", [-0.4, -0.5], 0.01);
  A(T.hatch + 0.1, "foreman", "grip", { side: "R", shape: "open", dur: 0.2 });
  for (let k = 0; k < 4; k++) { c.arm(r3(T.hatch + 0.05 + k * 0.6), "foreman", "R", "wave", 0.25); c.arm(r3(T.hatch + 0.35 + k * 0.6), "foreman", "R", { o: [0.25, 1.0, 0.1] }, 0.25); }   // waves Spud in (bench pattern)
  lift(T.hatch + 1.7, -2.2, -3.4, 1.8, "inOut");                               // he floats up the beam ...
  look(T.hatch + 3.4, "spudB", [0, 0.05], 0.35); expr(T.hatch + 3.4, "spudB", "neutral", { brow: 0.75, lid: 0.3 }, 0.3);   // ... stops, looks at us
  say(T.hatch + 3.7, "d6", T.far);
  lift(T.hatch + 5.5, -4.8, -3.5, 0.3, "out"); lift(T.hatch + 5.8, -4.8, -9.6, 0.4, "in");   // steps out of the beam and drops
  sfx(T.hatch + 6.05, "ai/swim-splash", { gain: 0.5, reason: "he drops into the sea" });
  sfx(T.hatch, "kenney/space-engine-low", { gain: 0.25, dur: r3(T.far - T.hatch), reason: "the ship's hum overhead" });

  // ================================================================= 46 CASE CLOSED (40.2-44.2): the city rises into the stars; he stays
  set0(T.far, "ring", { y: 1500, shrink: 0 }); PR(T.far + 0.3, "ring", { shrink: 0.85 }, r3(T.tag - T.far - 0.3), "in"); PR(T.far, "nightS", { calm: 1 }, r3(T.tag - T.far));
  set0(T.low, "ring", { y: -6000 });
  swim(T.far - 0.04, -0.5);   // back up from the dive of 41
  look(T.far, "spudS", [0, 0.3], 0.01); expr(T.far, "spudS", "neutral", { brow: 0.4, lid: 0.35 }, 0.01);
  look(T.far + 1.0, "spudS", [0, 0.05], 0.4);
  say(T.far + 1.2, "d7", T.tag);
  cap(r3(T.far + 2.0), r3(T.tag - 0.05), "Follow for the next case", F.key === "wide" ? 940 : 1500, false, { size: F.key === "wide" ? 44 : 52, kinetic: false });   // the follow ask (on test, text only)
  sfx(T.far, "ai/car-waves", { gain: 0.14, dur: r3(T.tag - T.far), reason: "the sea calming" });

  // ================================================================= 47-48 TAG (44.2-50): Plato winks; Spud blocks the scroll
  A(T.tag - 0.02, "plato", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
  c.arm(T.tag, "plato", "R", { o: [-0.2, 0.283, 0.68] }, 0.01); look(T.tag, "plato", [0, -0.4], 0.01);
  c.arm(T.tag + 0.3, "plato", "R", { o: [-0.14, 0.283, 0.68] }, 0.35, "inOut");
  look(T.tag + 0.8, "plato", [0, 0.05], 0.3);                                         // he looks up at us
  c.arm(T.tag + 1.3, "plato", "R", { o: [-0.37, 0.4, 0.56], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } }, 0.35, "out");
  A(T.tag + 1.3, "plato", "grip", { side: "R", shape: "point", dur: 0.2 });
  A(T.tag + 1.6, "plato", "face", { lidL: 1, browL: -0.45, cornerL: 0.5, lidR: 0.15, browR: 0.35, dur: 0.12 });   // the wink (his left eye)
  A(r3(T.block - 0.03), "spudT", "move", { to: [r3(O.room[0] + 0.25), r3(O.room[1] - 0.05)], dur: 0.01, steps: 0, ease: "linear", sync: true });   // waits behind the camera (its lamp too) until the cut
  look(T.block, "spudT", [0, 0.05], 0.01); expr(T.block, "spudT", "surprised", { open: 0.35 }, 0.01);
  c.arm(T.block + 0.05, "spudT", "R", { o: [0.45, 0.55, 0.2] }, 0.25, "out"); c.arm(T.block + 0.05, "spudT", "L", { o: [0.45, 0.55, 0.2] }, 0.25, "out");
  say(T.block + 0.3, "d8");
  expr(r3(T.block + 1.8), "spudT", "neutral", { brow: 0.6, lid: 0.25 }, 0.2);
  A(r3(END - 0.6), "spudT", "noblink", { dur: 0.6 });

  // the clock (it hits 00:00 at story 178 = block 24.0, as he dives), off over the maps
  for (const [a, b] of [[0, T.map1], [T.shore, T.map2], [T.low, T.tag]]) atlantisClock(c, F, T0, a, b);

  // ---------------------------------------------------------------- shots (a push or a move on every one)
  const V = SHOTS_OF(F);
  const SHOTS = [
    ["37 Helike floods", T.hook, mv(F, O.helike, V.k0, V.k1, T.map1), "hook"],
    ["38 clue four: the Gulf of Corinth", T.map1, { ...mapCam(700, 450, 980, F), to: mapCam(680, 450, 860, F), dur: r3(T.shore - T.map1), ease: "inOut" }],
    ["37b along the shore", T.shore, mv(F, O.helike, V.s0, V.s1, r3(T.room - T.shore))],
    ["39 Plato was alive", T.room, mv(F, O.room, V.w0, V.w1, r3(T.map2 - T.room)), "reveal"],
    ["40 bigger than Libya and Asia", T.map2, { ...mapCam(800, 520, 1536, F), to: mapCam(760, 500, 1380, F), dur: r3(T.low - T.map2), ease: "inOut" }],
    ["41 the low", T.low, mv(F, NIGHT_XZ, V.l0, V.l1, r3(T.dive - T.low))],
    ["dive", T.dive, mv(F, NIGHT_XZ, V.l1, V.l2, r3(T.storm - T.dive))],
    ["42 midnight: the city in the storm", T.storm, mv(F, O.city, V.c0, V.c1, r3(T.rise - T.storm))],
    ["43 the city rises", T.rise, mv(F, O.city, V.r0, V.r1, r3(T.under - T.rise)), "reveal"],
    ["44 under the hull", T.under, mv(F, O.city, V.u0, V.u1, r3(T.hatch - T.under))],
    ["45a one seat left", T.hatch, mv(F, O.hatch, V.e0, V.e1, 1.6)],
    ["45 he stays", r3(T.hatch + 1.6), mv(F, O.hatch, V.h0, V.h1, r3(T.far - T.hatch - 1.6))],
    ["46 case closed", T.far, mv(F, NIGHT_XZ, V.f0, V.f1, r3(T.tag - T.far))],
    ["47 Plato winks", T.tag, mv(F, O.room, V.p0, V.p1, r3(T.block - T.tag))],
    ["48 nobody saw that", T.block, mv(F, O.room, V.b0, V.b1, r3(END - T.block))],
  ];
  // the far ring of 46 (builder D3) and the 41/46 sea and sky, the hull, the hatch hall: PLACES (filled from their headers)
  PLACES(F, D, PR, set0, T);

  const spuds = ["spudK", "spudW", "spudS", "spudC", "spudB", "spudT"];
  return {
    set: { ...AT_NIGHT, aperture: 0, focus: false,
      plate: PL, ...(MAP40 !== MAP38 && { plate: { ...PL, swaps: [{ at: T.map2, src: MAP40 }] } }) },
    music: score(T0),
    captionBand: F.key === "wide" ? [30, 490] : [200, 820],
    hook: { show: ["spudK"], hint: 0, what: "Helike, 373 BC, at night: the sea rises over the roofs, Spud on the knoll; '373 BC' on screen" },
    creative: { length: [END, END] },
    cast, props, captions: c.captions, beats: c.beats(SHOTS, END), visible: c.visible,
    allowClip: [
      ...lampClip(spuds, END),
      { who: "plato", with: "chair", from: 0, to: END, reason: "Plato sits on his chair at the desk (panels 39, 47)" },
    ],
    end: END,
  };
}

// ---------------------------------------------------------------- cameras, relative to each place's origin (from the builders' headers)
function SHOTS_OF(F) {
  return {
    // Helike: origin = Spud's spot on the knoll; town on -z below
    // (props-at-d-helike.js header cameras: wide panel 37, tall part-4 frame 0, the low view over the flooded streets)
    k0: { wide: at([1.2, 2.4, 6.4], [8.5, -3.9, -80], 34), tall: at([3, 4.2, 9], [8, -5.5, -60], 54) },
    k1: { wide: at([1.1, 2.3, 5.6], [8.5, -3.9, -80], 33), tall: at([2.8, 4.0, 8.2], [8, -5.5, -60], 52) },
    s0: { wide: at([-4, 2.6, -36], [30, -3.6, -80], 38), tall: at([-4, 2.6, -36], [30, -3.6, -80], 58) },
    s1: { wide: at([-2, 2.4, -40], [30, -3.6, -80], 37), tall: at([-2, 2.4, -40], [30, -3.6, -80], 57) },
    // Plato's room: origin = floor centre, back wall z -1.6, window centre x -0.7 sill 0.95
    // (props-at-d-room.js header cameras 39 / 47 / 48)
    w0: { wide: at([0.05, 1.30, 2.00], [0.0, 1.20, -1.60], 38), tall: at([0.05, 1.30, 2.6], [-0.1, 1.15, -1.60], 60) },
    w1: { wide: at([0.03, 1.28, 1.80], [-0.02, 1.20, -1.60], 37), tall: at([0.03, 1.28, 2.4], [-0.1, 1.15, -1.60], 59) },
    p0: { wide: at([0.62, 1.30, 1.15], [0.58, 1.22, -1.50], 26), tall: at([0.62, 1.30, 1.5], [0.6, 1.2, -1.50], 44) },
    p1: { wide: at([0.62, 1.29, 1.0], [0.58, 1.22, -1.50], 25), tall: at([0.62, 1.29, 1.35], [0.6, 1.2, -1.50], 43) },
    b0: { wide: at([0.30, 1.20, 2.30], [0.40, 1.10, -1.50], 33), tall: at([0.30, 1.20, 2.7], [0.40, 1.05, -1.50], 52) },
    b1: { wide: at([0.30, 1.18, 2.15], [0.40, 1.10, -1.50], 32), tall: at([0.30, 1.18, 2.55], [0.40, 1.05, -1.50], 51) },
    // the night sea (41, 46), relative to Spud's spot: 41 looks toward the empty sky (the ring is not there yet)
    l0: { wide: at([1.4, 0.35, 2.6], [-0.4, 0.3, -2], 36), tall: at([1.0, 0.35, 2.8], [-0.2, 0.35, -2], 58) },
    l1: { wide: at([1.25, 0.32, 2.3], [-0.4, 0.3, -2], 35), tall: at([0.9, 0.32, 2.5], [-0.2, 0.35, -2], 57) },
    l2: { wide: at([1.2, 0.3, 2.1], [-0.4, -0.2, -2], 35), tall: at([0.9, 0.3, 2.3], [-0.2, -0.1, -2], 57) },
    // the city (origin = citadel centre; props-at-d-ship.js header cameras 42, 43, 44)
    c0: { wide: { ...at(pol(2962, 38.2, 2.1), pol(2497, 33, 52), 50), near: 0.3 }, tall: { ...at(pol(2962, 38.2, 2.1), pol(2497, 35, 70), 70), near: 0.3 } },
    c1: { wide: { ...at(pol(2958, 38.1, 2.0), pol(2497, 33, 56), 48), near: 0.3 }, tall: { ...at(pol(2958, 38.1, 2.0), pol(2497, 35, 74), 68), near: 0.3 } },
    r0: { wide: { ...at([200, 900, 6500], [0, 520, 0], 38), near: 5 }, tall: { ...at([200, 900, 6500], [0, 560, 0], 62), near: 5 } },
    r1: { wide: { ...at([190, 880, 6200], [0, 600, 0], 38), near: 5 }, tall: { ...at([190, 880, 6200], [0, 640, 0], 62), near: 5 } },
    u0: { wide: { ...at([-150, 8, 700], [400, 235, -900], 60), near: 1 }, tall: { ...at([-150, 8, 700], [300, 300, -900], 80), near: 1 } },
    u1: { wide: { ...at([-130, 9, 620], [400, 240, -900], 58), near: 1 }, tall: { ...at([-130, 9, 620], [300, 305, -900], 78), near: 1 } },
    // the hatch (origin = deck level at the hatch axis)
    e0: { wide: at([-0.2, 1.3, -0.9], [4.6, 0.8, 1.6], 50), tall: at([-0.2, 1.3, -0.9], [4.6, 0.8, 1.6], 70) },
    e1: { wide: at([-0.1, 1.3, -0.7], [4.6, 0.8, 1.6], 48), tall: at([-0.1, 1.3, -0.7], [4.6, 0.8, 1.6], 68) },
    h0: { wide: at([-6.0, -4.6, 3.0], [1.5, 0.6, -0.4], 56), tall: at([1.2, -8.2, 7.4], [-1.3, 0.2, -0.4], 56) },
    h1: { wide: at([-5.7, -4.3, 2.8], [1.5, 0.8, -0.4], 54), tall: at([1.1, -7.8, 7.0], [-1.3, 0.4, -0.4], 55) },
    f0: { wide: { ...at([2, 1.1, 12], [-22, 640, -4958], 32), near: 0.3 }, tall: { ...at([1.5, 1.1, 12], [-22, 900, -4958], 56), near: 0.3 } },
    f1: { wide: { ...at([2, 1.05, 10.5], [-22, 660, -4958], 31), near: 0.3 }, tall: { ...at([1.5, 1.05, 10.5], [-22, 920, -4958], 55), near: 0.3 } },
  };
}

// ---------------------------------------------------------------- the builders' kinds (wired from their usage headers)
function PLACES(F, D, PR, set0, T) {
  // filled when D1-D4 report (helike + platoroom + klismos are already in the props list above)
}

for (const F of TALL ? [FRAME.wide, FRAME.tall] : [FRAME.wide]) {
  const { end, ...b } = build(F);
  write(import.meta.url, {
    id: `aa03-d-${F.key}`, title: "Where did Atlantis go? (block D)",
    idea: "Ancient aliens EP03 block D (2:34-3:24): Helike sank in one night in 373 BC while Plato was alive; Atlantis was far bigger, nothing sinks that in a day; the low at midnight; the ring city rises out of the sea as a ship ('It didn't sink. It left.'); one seat left, Spud stays ('Somebody had to tell you.'); 'Case closed.'; Plato winks",
    format: "series: Ancient aliens (Spud hosts with Reaper's voice, four numbered clues, the alien answer is the premise, the tag winks at the real one); EP03 block D of four, joined later",
    ...F.sb(FAR.city), fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false, animeTiming: true,
    sound: { signature: false, sfx: 0.65, ambience: 0.06, guard: true, scenes: ["scifi"] },
    ...b,
    notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-d/make-block-d.mjs. Block D of four; music = the EP03 score from story 154 s (kit score(154)). Places: real 3D (props-at-d-*.js), maps flat.",
  });
  console.log(`aa03-d-${F.key}: ${end} s`);
}
