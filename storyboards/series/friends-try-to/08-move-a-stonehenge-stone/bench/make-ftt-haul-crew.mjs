// Proof bench for the haulcrew kind (engine/page/props-ftt-haul.js), TALL frame (1080 x 1920). Not a clip: one beat per still.
// The crew (spec n 250) hauls the sledge: grow 0.16 = 40 figures, grow 1 = 250. Cameras: side = 6 m from the near file at 1.5 m looking at the first
// rows; high = 40 m up behind the sledge looking along the whole line; low = 1.1 m, beside the near file at the sledge's front looking along the line.
// Set frame (DESIGN 1): s forward, r right, world x = o.x + 124 - s, z = o.z - r; haulcrew is placed at s 2.5 (the sledge's front bar), rot 180.
//   node storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/make-ftt-haul-crew.mjs      (prints the still times)
//   node engine/render.mjs storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/ftt-haul-crew.json --stills <times> --draft --safe --out out/ftt-haul-crew
//   node qa/contact.mjs out/ftt-haul-crew/ftt-haul-crew-*.png --out storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/ftt-haul-crew-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { plain, SH_A, FRAME, CAST } from "../../../ancient-aliens/02-stonehenge/kit/sh-kit.mjs";

const F = FRAME.tall, o = [0, 0], c = clip();
const W = (s, r) => [r3(o[0] + 124 - s), r3(o[1] - r)];
const cam = (p, l, fov) => ({ pos: [W(p[0], p[2])[0], p[1], W(p[0], p[2])[1]], look: [W(l[0], l[2])[0], l[1], W(l[0], l[2])[1]], fov });
const G = W(0, 0), at = (id, kind, s, y, r, extra = {}) => { const [x, z] = W(s, r); return { id, kind, x, y, z, rot: 180, ...extra }; };

const land = plain("p", o, { era: "new", T: 25 }).filter((p) => !/-(henge|avenue)$/.test(p.id)).map((p) => (p.kind === "salisburyplain" ? { ...p, trees: false, ditch: false } : p));
const SUN = { sunAz: 20.5, sunEl: 11, sunColor: "#fff3c4" };
const STONE = { id: "stone", kind: "fallensarsen", x: G[0], y: 0.84, z: G[1], rot: 0, size: [4.25, 2.1, 1.1], look: "new", pieces: 1, sink: 0, seed: 3, fringe: false, ...SUN, staged: "it lies on the sledge's deck (SOLID)" };
const LASH = { id: "lash", kind: "haullash", x: G[0], y: 0.84, z: G[1], rot: 0, size: [4.25, 2.1, 1.1], seed: 1, staged: "the lashing rides the stone" };
const props = [
  ...land, STONE, LASH, at("sledge", "haulsledge", 0, 0, 0, { staged: "it rides on the rail tops (the rails are scenery, not solid)" }), at("rails", "haulrails", 0, 0, 0),
  at("crew", "haulcrew", 2.5, 0, 0, { n: 250, staged: "250 far potatoes in two files on two ropes from the sledge's front bar; grow shows round(250 * grow) of them, nearest rows first" }),
];
const SP = (id, s, r, toward) => { const [x, z] = W(s, r), [tx, tz] = W(...toward); return { id, character: CAST.spud, at: [x, z], face: Math.round((Math.atan2(tx - x, tz - z) * 180) / Math.PI), expr: "kind", follow: 0.2, seed: 2.1 }; };
const cast = [SP("spudA", -6, -4.2, [14, 0])];

let T = 0;
const state = (o2 = {}) => { const { grow = 1, heave = 1, walk = 0 } = o2; c.prop(T, "crew", { grow, heave, walk }, 0); };
const G40 = 0.16, G250 = 1;
const CAM = {
  side: cam([9.0, 1.5, 8.0], [10.5, 0.7, 0], 42), sideFar: cam([60, 1.5, 8.0], [62, 0.7, 0], 42),
  high40: cam([-14, 40, 0], [14, 0, 0], 50), high250: cam([-14, 40, 0], [70, 0, 0], 50),
  low: cam([3.0, 1.1, -4.2], [22, 0.7, -1.2], 40), low250: cam([3.0, 1.1, -4.2], [70, 0.7, -1.2], 30),
};
const SHOTS = [
  ["A40", { grow: G40 }, CAM.side, "A40 grow 0.16 (40), 6 m to the side at 1.5 m, first rows, straining"],
  ["A250", { grow: G250 }, CAM.side, "A250 grow 1 (250), same camera"],
  ["W40", { grow: G40, walk: 1 }, CAM.side, "W40 grow 0.16 walk 1 (stepping)"],
  ["S40", { grow: G40, heave: 0 }, CAM.side, "S40 grow 0.16 heave 0 (standing)"],
  ["H40", { grow: G40 }, CAM.high40, "H40 grow 0.16, 40 m up, the line"],
  ["H250", { grow: G250 }, CAM.high250, "H250 grow 1, 40 m up, the whole line"],
  ["L40", { grow: G40 }, CAM.low, "L40 grow 0.16, low beside the line looking along it"],
  ["L250", { grow: G250, walk: 1 }, CAM.low250, "L250 grow 1 walking, low beside the line, long lens"],
  ["F250", { grow: G250 }, CAM.sideFar, "F250 the far end of the 250 line, from the side"],
];
const shots = [], names = [];
SHOTS.forEach(([name, st, cm, label], i) => { T = r3(0.1 + i); state(st); shots.push([name, T, cm]); names.push(name); c.cap(T, r3(T + 0.9), label, 330, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", names.join(","));

write(import.meta.url, {
  id: "ftt-haul-crew", title: "Friends try to 08: haulcrew bench", idea: "Props bench for the haulcrew kind, not a clip", ...F.sb,
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: SH_A, music: false, sound: { auto: false }, hook: { show: ["spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END), allowClip: [],
  notes: "Generated by storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/make-ftt-haul-crew.mjs (props bench, no reviews).",
});
