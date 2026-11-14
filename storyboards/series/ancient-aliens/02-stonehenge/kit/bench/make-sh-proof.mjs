// Kit proof for the Stonehenge kit: the four owner files together in the film's key scenes, built ONLY from ../sh-kit.mjs
// helpers, in BOTH frames. Not a clip: it is the look gate for Jonny (sh-proof-wide-sheet.png, sh-proof-tall-sheet.png)
// and the worked example for the four block threads. One place per origin, 2000 m apart (PLACE(i)); one storyboard per light and frame.
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-proof.mjs          (prints the still times)
//   node engine/render.mjs storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-proof-a-wide.json --stills <times> --draft --out out/sh-proof
//   node qa/contact.mjs out/sh-proof/sh-proof-*-wide-*.png --out storyboards/series/ancient-aliens/02-stonehenge/kit/bench/sh-proof-wide-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { FRAME, SET_OF, sunAt, CAST, VIEW, shot, plain, today, past, visitors, winter, sheep, liftStone, ringShip, RING_SHIP, stoneAt, wales, mapBoard, MAP_VIEW, page, PAGE_VIEW, haul, host, sunsetClock, clueTag, lampClip, PLACE } from "../sh-kit.mjs";

const O = PLACE;
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const at = (pos, look, fov) => ({ pos, look, fov });

// ---- the places: [story time T, origin, cast, props] ----
const P = {};
// 1 today, part A: the ruin, the visitors behind their rope, the sheep
{ const o = O(0), T = 25; P.today = { T, o, cast: [who("spud1", CAST.spud, o, -1.2, 58.5, 5), who("chip1", CAST.chip, o, 4.6, 44, 170), who("wedge1", CAST.wedge, o, 5.8, 44.6, 190), who("mash1", CAST.mash, o, 7.0, 43.8, 200)],
  props: [...today("t1", o, { T, rope: true }), sheep("sheep1", o[0] + 0.6, 58.9, -60, { chew: 0.5 }), host("spud1"), ...winter("chip1", "chip"), ...winter("wedge1", "wedge", "#2f6fb0", "#e0b030"), ...winter("mash1", "mash", "#e0b030", "#c23b3b")] }; }
// 2 the build, 2500 BC: the ring half up, a ship lowers the next upright, the crew
{ const o = O(1), T = 25, [sx, sz, yaw] = stoneAt(o, 22); P.build = { T, o, cast: [who("spud2", CAST.spud, o, -1.4, 58.5, 5), who("fore2", CAST.foreman, o, 3.2, 52, 160), who("crew2", CAST.crew, o, -5.5, 49, 30)],
  props: [...past("b2", o, { T, built: 0.58, gapUprights: [22] }), ...liftStone("l2", [sx, sz], { yaw, h: 7, under: 1.2 }), host("spud2")] }; }
// 3 2500 BC finished, part C: from above; the grooves being cut
{ const o = O(2), T = 125; P.done = { T, o, cast: [who("spud3", CAST.spud, o, 2.0, 24, 180)], props: [...past("d3", o, { T, grooves: "cut" }), host("spud3")] }; }
// 3b the plant (panel 31): the ring ship hovers right above the stone ring, the same size
{ const o = O(12), T = 128; P.plant = { T, o, cast: [who("spud3b", CAST.spud, o, -1.2, 40, 175)], props: [...past("d3b", o, { T }), ...ringShip("r3b", o, { hover: 16 }), host("spud3b")] }; }
// 4 the slope (panels 29-30)
{ const o = O(3), T = 125; P.slope = { T, o, cast: [who("spud4", CAST.spud, o, 0, 15.5, 90, { y: 4.9 })], props: [...past("s4", o, { T, slope: 1.2 }), host("spud4")] }; }
// 5 the sunset today: the sun at the edge of Stone 56
{ const o = O(4), T = 178; P.low = { T, o, cast: [who("spud5", CAST.spud, o, -2.4, 31, 175)], props: [...today("t5", o, { T }), sheep("sheep5", o[0] - 3.6, 31.4, 160, { lie: 1 }), host("spud5")] }; }
// 6 the sunset 2500 BC: the sun in the slit, the red shaft
{ const o = O(5), T = 180; P.slit = { T, o, cast: [who("spud6", CAST.spud, o, -2.4, 31, 175)], props: [...past("p6", o, { T }), { id: "shaft6", kind: "sunshaft", x: o[0], z: o[1], show: 1 }, host("spud6")] }; }
// 7 parked: ring on ring, dusk
{ const o = O(6), T = 192; P.parked = { T, o, cast: [who("spud7", CAST.spud, o, -1.2, 58.5, 5), who("crew7", CAST.crew, o, ...stoneAt([0, 0], 2).slice(0, 2), 0, { y: 4.9 })], props: [...past("p7", o, { T, dusk: 0.5 }), ...ringShip("r7", o, { parked: true, lit: 0.8 }), host("spud7")] }; }
// 8 the tag: twenty workers drag a stone past behind him
{ const o = O(7), T = 202; P.tag = { T, o, cast: [who("spud8", CAST.spud, o, -1.0, 57, 10)], props: [...today("t8", o, { T, dusk: 1 }), ...haul("h8", [o[0], o[1] + 40], 0.5), host("spud8")] }; }
// 9 the map, 10 the parchment, 11 Wales, 12 the joint
{ const o = O(8); P.map = { T: 60, o, cast: [], props: [...mapBoard("m9", o, { woods: 1, wales: 1, scotland: 1 })] }; }
{ const o = O(9); P.page = { T: 160, o, cast: [], props: [...page("g10", o, 3)] }; }
{ const o = O(10); P.wales = { T: 70, o, cast: [], props: [...wales("w11", o, { out: 1 }), { id: "cargo11", kind: "cargoship", x: o[0] - 6, y: 10.5, z: o[1] + 4, rot: 30, staged: "it flies" }, { id: "blue11", kind: "bluestone", x: o[0] - 6, y: 6.2, z: o[1] + 4, rot: 30, staged: "it hangs under the cargo ship" }] }; }
{ const o = O(11), T = 105; P.joint = { T, o, cast: [who("spud12", CAST.spud, o, 2.2, 1.6, -30)], props: [...plain("j12", o, { era: "new", T }), { id: "up12", kind: "sarsen", x: o[0], y: 0, z: o[1], look: "new" }, { id: "top12", kind: "toplintel", x: o[0] + 1.6, y: 4.75, z: o[1], look: "new", staged: "it hangs in the beam over its knobs" }, host("spud12")] }; }

// ---- the shots: [place, camera pair, caption] ----
const SHOT = {
  today: ["today", VIEW.axis, "today: the ruin, visitors, the sheep (panels 04-06)"],
  inside: ["today", VIEW.inside, "today, inside: Stone 56, the Altar Stone (panels 18-19)"],
  build: ["build", VIEW.axis, "2500 BC: a ship lowers the next stone (panels 01-03, 11)"],
  high: ["done", VIEW.high, "2500 BC from above: ring and horseshoe (panel 28)"],
  plant: ["plant", { wide: at([0, 1.2, 52], [0, 12, 0], 40), tall: at([0, 1.2, 60], [0, 16, 0], 58) }, "the ship right above the ring, the same size (panel 31)"],
  top: ["done", VIEW.top, "straight down: the line of clue 4 (panels 32-33)"],
  avenue: ["done", VIEW.avenue, "the grooves under the line (panels 34-36)"],
  slope: ["slope", VIEW.slope, "the ground slopes, the ring does not (panels 29-30)"],
  low: ["low", VIEW.axisLong, "today: the sun touches the tallest stone (panels 40-41)"],
  slit: ["slit", VIEW.axisLong, "2500 BC: the sun in the slit, the shaft (panel 42)"],
  parked: ["parked", VIEW.axis, "ring on ring: the parking space (panels 44-46)"],
  tag: ["tag", { wide: at([0, 1.2, 62], [0, 2.4, 30], 34), tall: at([0, 1.2, 63], [0, 3.6, 30], 52) }, "the tag: the haul team behind him (panels 47-48)"],
  map: ["map", MAP_VIEW.south, "the map: 25 and 240 km (panels 10, 15)"],
  mapN: ["map", MAP_VIEW.north, "the map: 750 km up the island (panel 20)"],
  page: ["page", PAGE_VIEW, "the oldest picture (panels 37-39)"],
  wales: ["wales", { wide: at([10, 2.2, 26], [-2, 5, 0], 40), tall: at([6, 2.2, 28], [-3, 7, 0], 58) }, "Wales: the crag, the cargo ship (panels 16-17)"],
  joint: ["joint", { wide: at([3.4, 3.6, 5.2], [0.6, 4.3, 0], 40), tall: at([2.4, 3.4, 5.6], [0.4, 4.2, 0], 50) }, "knobs and holes (panels 25-27)"],
};
// one storyboard per light and frame
const SETS = [["a", 25, ["today", "inside", "build", "map", "mapN", "wales"]], ["c", 125, ["high", "plant", "top", "avenue", "slope", "joint"]], ["d", 175, ["low", "slit", "page"]], ["dusk", 195, ["parked", "tag"]]];
for (const F of [FRAME.wide, FRAME.tall]) for (const [name, T, names] of SETS) {
  const c = clip(), shots = [], places = [...new Set(names.map((n) => SHOT[n][0]))].map((p) => P[p]);
  const cast = places.flatMap((p) => p.cast), props = places.flatMap((p) => p.props);
  // params with no default are seeded at 0
  for (const p of props) { if (p.kind === "ringship" || p.kind === "cargoship") c.prop(0, p.id, { beam: p.beam ?? 0, wobble: 0 }, 0); if (p.kind === "granitecutter") c.prop(0, p.id, { slide: 1, cut: 0.5 }, 0); }
  names.forEach((n, i) => { const t = r3(0.1 + i), [pl, v, text] = SHOT[n]; shots.push([n, t, shot(F, P[pl].o, v)]); c.cap(t, t + 0.9, text, F.key === "wide" ? 880 : 330, false, { kinetic: false, size: 30 }); });
  const END = r3(0.1 + names.length + 0.1);
  sunsetClock(c, F, 150, 0, END); clueTag(c, F, 0, END, 3);
  const id = `sh-proof-${name}-${F.key}`, lamps = cast.filter((a) => a.character === CAST.spud).map((a) => a.id);
  console.log(id, "stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
  write(import.meta.url, {
    id, title: "Stonehenge kit proof", idea: "Kit proof for the Stonehenge kit: the four owner files together in the key scenes, not a clip", ...F.sb,
    fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
    set: SET_OF(T), music: false, sound: { auto: false },
    hook: { show: lamps.slice(0, 1), hint: 0, what: "engine test" },
    cast, props, captions: c.captions, beats: c.beats(shots, END), allowClip: [...lampClip(lamps, END), ...cast.filter((x) => x.id === "crew7").map((x) => ({ who: x.id, with: "r7-ship", from: 0, to: END, reason: "the crew stands on the parked ship's hull (the ship's box holds him)" }))],
    notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-proof.mjs (kit proof, no reviews).",
  });
}
