// Bench for the EP08 props (engine/page/props-pauseyou.js, task T2 of storyboards/series/what-if/08-pause-you/): one group per
// camera on a plain floor, 7 m apart so each camera sees only its own group. Not a clip. Stills only.
//   remote   the Wizard (notyet/wizard-nostaff) holds the magicremote in his LEFT glove (grips.phone, the lying hold), press 1 + lit 1
//   buttons  two remotes lying on a table: press 0 / lit 0 and press 1 / lit 1 (the button, the pause bars, the lens, the band)
//   ray      pauseray out to a bounce point and back (via), rise 1, glint 1, hit 1 on a potato's chest, medium-wide (3.5 m, fov 48)
//   rise     the same ray at rise 0.3, 0.6 and 0.85 (the head blob travelling, the bounce reached first)
//   halves   two cookiehalf (L 52 % and R 48 %) fitted together, a third at cut 1 with 7 crumbs, a whole chunkcookie beside them
//   node storyboards/series/what-if/08-pause-you/bench/make-pauseyou-props.mjs
//   node engine/render.mjs storyboards/series/what-if/08-pause-you/bench/pauseyou-props.json --layout
//   node engine/render.mjs storyboards/series/what-if/08-pause-you/bench/pauseyou-props.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const GX = { remote: -14, buttons: -7, ray: 0, rise: 7, halves: 14 };
const T = { remote: 0, buttons: 3.4, ray: 5.4, rise: 7.4, halves: 9.4, cut: 11.4 }, END = 13.4;
const TABLE_H = 0.36;
// the cookie halves' offsets in the whole cookie's frame (props-pauseyou.js COOKIEHALF, rounded), the cookie scale
const HALF = { L: [-0.0305, 0, -0.0003], R: [0.0331, 0, 0.0003] }, K = 1.25;

// ---- remote: the Wizard's left glove, lying hold, lifted to the chest; button + lens lit at the still (t 1.7)
const SPOT = [GX.remote + 0.02, 0.5, 0.44], HELD = [GX.remote + 0.02, 0.52, 0.4];   // already up at the chest: no table to reach into
const REMOTE = { id: "remote", kind: "magicremote", ...grips.placeFor("magicremote", SPOT, 0), scale: 1, staged: "held in the Wizard's left glove from the start" };
const h = grips.phone(c, "wiz", REMOTE, { side: "L" });
A(0, "wiz", "noblink");
A(0, "rea", "noblink");
A(0, "wiz", "look", { to: [0.1, -0.8], dur: 0.01, blink: false });
A(0, "rea", "look", { to: [0, 0], dur: 0.01, blink: false });
c.prop(0, "remote", { press: 0, lit: 0 }, 0, "linear");
let t = h.take(0.3);
t = h.carry(t + 0.05, HELD, 0.45);
c.prop(t + 0.1, "remote", { press: 1, lit: 1 }, 0.1, "out");
const REMOTE_STILL = r3(t + 0.35);

// ---- ray: out to the bounce point, back to the chest; the potato stands where it lands
const O = [GX.ray - 0.5, 0.7, 0.42];
const VIA = [0.8, -0.056, 0], TO = [0.0, -0.11, 0];   // DESIGN 2: remote-to-tray 0.80, return leg lands 0.11 below the lens
const RAYP = { id: "ray", kind: "pauseray", x: O[0], y: O[1], z: O[2], to: TO, via: VIA, glow: 1, staged: "a light ray, stands on nothing" };
c.prop(0, "ray", { rise: 1, glint: 1, hit: 1 }, 0, "linear");

// ---- rise: the same ray at three heads
const RISES = [0.3, 0.6, 0.85].map((k, i) => ({ id: `rise${i}`, kind: "pauseray", x: GX.rise - 0.5, y: 1.0 - i * 0.4, z: 0.42, to: TO, via: VIA, glow: 1, staged: "a light ray, stands on nothing" }));
RISES.forEach((r, i) => c.prop(0, r.id, { rise: [0.3, 0.6, 0.85][i], glint: i > 0 ? 1 : 0, hit: 0 }, 0, "linear"));

// ---- halves
const HC = [GX.halves - 0.14, TABLE_H + 0.013 * K, 0.4], H2 = [GX.halves + 3.6, TABLE_H + 0.013 * K, 0.4];   // the cut half stands 3.6 m on, for its own camera
const half = (id, side, at, o = {}) => ({ id, kind: "cookiehalf", side, x: r3(at[0]), y: r3(at[1]), z: r3(at[2]), scale: K, ...o });
const fit = (side) => { const a = HALF[side]; return half(`h${side}`, side, [HC[0] + a[0] * K, HC[1], HC[2] + a[2] * K], { rot: side === "R" ? 180 : 0 }); };
c.prop(0, "hcut", { cut: 1, crumbs: 1 }, 0, "linear");
A(11.5, "rea", "noblink");

const props = [
  { id: "tableB", kind: "coffeetable", x: GX.buttons, z: 0.5, h: TABLE_H, w: 1.3, d: 0.5 },
  { id: "tableH", kind: "coffeetable", x: GX.halves, z: 0.4, h: TABLE_H, w: 1.3, d: 0.6 },
  { id: "tableC", kind: "coffeetable", x: H2[0], z: 0.4, h: TABLE_H, w: 1.3, d: 0.6 },
  REMOTE,
  { id: "rA", kind: "magicremote", x: GX.buttons - 0.2, y: TABLE_H + 0.02, z: 0.5, rot: 90, press: 0, lit: 0 },
  { id: "rB", kind: "magicremote", x: GX.buttons + 0.2, y: TABLE_H + 0.02, z: 0.5, rot: 90, press: 1, lit: 1 },
  RAYP, ...RISES,
  fit("L"), fit("R"),
  half("hcut", "L", H2, { cut: 1, crumbs: 1 }),
  { id: "whole", kind: "chunkcookie", x: GX.halves + 0.19, y: TABLE_H + 0.013 * K, z: 0.4, scale: K },
];

const cast = [
  { id: "wiz", character: "notyet/wizard-nostaff", at: [GX.remote, -0.25], face: 0, expr: "smug", follow: 0.2, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: [GX.ray - 0.5, 0.0], face: 0, expr: "kind", follow: 0.2, seed: 1.4 },
];

const SHOTS = [
  ["remote", T.remote, { pos: [GX.remote + 0.75, 1.05, 2.3], look: [GX.remote + 0.05, 0.55, 0.3], fov: 30 }, "magicremote in the Wizard's left glove, press 1 + lit 1"],
  ["buttons", T.buttons, { pos: [GX.buttons, 1.5, 2.8], look: [GX.buttons, 0.4, 0.5], fov: 42 }, "magicremote: press 0 lit 0 | press 1 lit 1"],
  ["ray", T.ray, { pos: [GX.ray - 0.1, 0.8, 4.0], look: [GX.ray - 0.1, 0.6, 0], fov: 48 }, "pauseray via a bounce: rise 1, glint 1, hit 1 (medium-wide, fov 48)"],
  ["rise", T.rise, { pos: [GX.rise - 0.1, 0.7, 4.0], look: [GX.rise - 0.1, 0.55, 0], fov: 48 }, "pauseray rise 0.3 (top) | 0.6 | 0.85: the head blob travelling"],
  ["halves", T.halves, { pos: [GX.halves + 0.03, 1.2, 1.9], look: [GX.halves + 0.03, 0.37, 0.4], fov: 30 }, "cookiehalf L + R fitted | chunkcookie"],
  ["cut", T.cut, { pos: [H2[0] + 0.05, 1.05, 1.6], look: [H2[0] + 0.05, 0.37, 0.4], fov: 30 }, "cookiehalf L cut 1 with 7 crumbs"],
];
for (const [n, t0, , label] of SHOTS) if (n !== "remote") c.cap(t0, t0 + 1, label, 240, false, { kinetic: false });   // the remote shot is all Wizard: no caption fits clear of him
console.log("stills:", [REMOTE_STILL, T.buttons + 0.5, T.ray + 0.5, T.rise + 0.5, T.halves + 0.5, T.cut + 0.5].join(","));

write(import.meta.url, {
  id: "pauseyou-props", title: "Pause you props bench", idea: "Props bench for There's a catch EP08 (magicremote, pauseray, cookiehalf), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#c9d4df", floor: "#a8967a" }, music: false, sound: { auto: false },
  hook: { show: ["wiz", "remote"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t0, s]) => [n, t0, s]), END),
  notes: "Generated by storyboards/series/what-if/08-pause-you/bench/make-pauseyou-props.mjs (props bench, no reviews).",
});
