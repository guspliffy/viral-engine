// Bench for the library props (engine/page/props-whatif-library.js, task T1 of storyboards/series/what-if/02-library/
// BRIEF-T1.md): one group per camera on a plain floor, 7 m apart so each camera sees only its own group. Not a clip.
// Daylight comes from the left (the look's key light). Potatoes beside the clock and the cart are the scale.
//   longclock   ticks [1, 1.5, 2, 2.4]: stills 1.0 (pendulum at the + end, minute hand 12:41), 1.25 (mid-swing), 1.5 (the
//               - end, 12:42); then a close on the dial of a second clock (ticks shifted +3.3 s)
//   quietsign   swing 0 and swing 70
//   bookcart    10 libbooks standing on the top tray (top face y 0.44), Reaper beside it
//   brasslamp   swing 0 and swing 25
//   orbstand    on a 0.95 m table: glow 1 and, beside it, glow 0.25
//   libpage     flat and bend 1
//   dayfloor    7 x 7 m of the stone floor with the two window patches, seen from above at 45 degrees
//   node storyboards/series/what-if/02-library/bench/make-library-props.mjs
//   node engine/render.mjs storyboards/series/what-if/02-library/bench/library-props.json --layout
//   node engine/render.mjs storyboards/series/what-if/02-library/bench/library-props.json --stills <times> --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const END = 18;
const GX = { clock: -21, close: -14, sign: -7, cart: 0, lamp: 7, orb: 14, page: 21, floor: 28 };
// when each camera starts (s)
const T = { clock: 0, close: 3.0, sign: 6.0, cart: 8.0, lamp: 10.0, orb: 12.0, page: 14.0, floor: 16.0 };
const TK = [1, 1.5, 2, 2.4], TK2 = TK.map((t) => r3(t + 3.3));

const props = [
  { id: "clk", kind: "longclock", x: GX.clock, z: 0, ticks: TK },
  { id: "clk2", kind: "longclock", x: GX.close, z: 0, ticks: TK2 },
  { id: "signA", kind: "quietsign", x: GX.sign - 0.75, y: 2.6, z: 0, staged: "hung from the ceiling" },
  { id: "signB", kind: "quietsign", x: GX.sign + 0.75, y: 2.6, z: 0, staged: "hung from the ceiling" },
  { id: "cart", kind: "bookcart", x: GX.cart, z: 0 },
  { id: "lampA", kind: "brasslamp", x: GX.lamp - 0.6, y: 2.7, z: 0, staged: "hung from the ceiling" },
  { id: "lampB", kind: "brasslamp", x: GX.lamp + 0.6, y: 2.7, z: 0, staged: "hung from the ceiling" },
  { id: "table", kind: "libdesk", x: GX.orb, z: 0, h: 0.95, w: 1.0, d: 0.5, seed: 4 },
  { id: "orbA", kind: "orbstand", x: GX.orb - 0.22, y: 0.962, z: 0.05, glow: 1 },
  { id: "orbB", kind: "orbstand", x: GX.orb + 0.22, y: 0.962, z: 0.05, glow: 0.25 },
  { id: "dfloor", kind: "dayfloor", x: GX.floor, z: 0, w: 7, d: 7, seed: 7 },
  { id: "pageA", kind: "libpage", x: GX.page - 0.25, y: 1.1, z: 0, staged: "a loose page held up in the air" },
  { id: "pageB", kind: "libpage", x: GX.page + 0.25, y: 1.1, z: 0, rot: 40, staged: "a loose page held up in the air" },
];
// the books: two rows at x +-0.13 (each book's x origin is its left edge, 0.085 left of its middle), five along z at 0.07;
// standing books are centred on their origin, so y = tray top 0.44 + h/2
let n = 0;
for (const rx of [-0.13, 0.13]) for (let k = -2; k <= 2; k++) {
  const id = `cb${n}`;
  props.push({ id, kind: "libbook", x: r3(GX.cart + rx - 0.085), y: 0.56, z: r3(k * 0.07), rot: 0, w: 0.17, h: 0.24, t: 0.04, seed: 11 + n, stand: 1 });
  c.prop(0, id, { stand: 1 }, 0, "linear"); n++;
}
for (const id of ["clk", "clk2"]) { c.prop(0, id, { clock: 0 }, 0, "linear"); c.prop(0, id, { clock: END }, END, "linear"); }
c.prop(0, "signA", { swing: 0 }, 0, "linear"); c.prop(0, "signB", { swing: 70 }, 0, "linear");
c.prop(0, "lampA", { swing: 0 }, 0, "linear"); c.prop(0, "lampB", { swing: 25 }, 0, "linear");
c.prop(0, "pageA", { bend: 0 }, 0, "linear"); c.prop(0, "pageB", { bend: 1 }, 0, "linear");

const cast = [
  { id: "sor", character: "potatobrawl/sorcerer", at: [GX.clock + 0.9, 0.05], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
  { id: "rea", character: "potatobrawl/reaper", at: [GX.cart + 1.2, 0.2], face: -20, expr: "kind", follow: 0.2, seed: 1.4 },
];

const SHOTS = [
  ["clock", T.clock, { pos: [GX.clock + 0.3, 1.2, 6.2], look: [GX.clock + 0.3, 1.0, 0], fov: 38 }, "longclock ticks 1 / 1.5 / 2 / 2.4, a potato beside it"],
  ["dial", T.close, { pos: [GX.close + 0.05, 1.7, 2.1], look: [GX.close, 1.6, 0], fov: 38 }, "longclock close: dial, minute hand one notch per tick, pendulum"],
  ["sign", T.sign, { pos: [GX.sign, 1.7, 7.2], look: [GX.sign, 1.7, 0], fov: 40 }, "quietsign: swing 0 | swing 70"],
  ["cart", T.cart, { pos: [GX.cart + 0.3, 1.1, 4.4], look: [GX.cart + 0.3, 0.55, 0], fov: 38 }, "bookcart with 10 libbooks on the top tray"],
  ["lamps", T.lamp, { pos: [GX.lamp + 0.2, 1.8, 7.0], look: [GX.lamp + 0.2, 1.7, 0], fov: 40 }, "brasslamp: swing 0 | swing 25"],
  ["orb", T.orb, { pos: [GX.orb, 1.2, 1.9], look: [GX.orb, 1.1, 0], fov: 36 }, "orbstand on a 0.95 m table: glow 1 | glow 0.25"],
  ["page", T.page, { pos: [GX.page, 1.1, 2.4], look: [GX.page, 1.1, 0], fov: 36 }, "libpage: flat | bend 1"],
  ["floor", T.floor, { pos: [GX.floor - 1.4, 10, 10], look: [GX.floor - 1.4, 0, 0], fov: 40 }, "dayfloor: pale tiles and two window patches"],
];
console.log("stills:", [1.0, 1.25, 1.5, 4.3, 4.8, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5].join(","));

write(import.meta.url, {
  id: "library-props", title: "Library props bench", idea: "Props bench for What if EP02 (longclock, quietsign, bookcart, brasslamp, orbstand, libpage), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#cfe0ee", floor: "#b8a27e" }, music: false, sound: { auto: false },
  hook: { show: ["sor", "clk"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, s]) => [n, t, s]), END),
  notes: "Generated by storyboards/series/what-if/02-library/bench/make-library-props.mjs (props bench, no reviews).",
});
