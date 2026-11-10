// Bench for the flood props (engine/page/props-flood.js, task T2 of storyboards/series/what-if/04-copy-money/BRIEF-T2.md):
// plain set with a red-brown floor, the window wall (tiles 2, 7.3 m wide) at z 0, a potato 2 m in front of it for scale and
// the money wave 2.2 m behind it. Not a clip. Two files: flood-props.json (the main bench) and flood-snow.json (snow on a dark set).
//   wall        wide (15 m back), square from 6 m at 1.7 m (fov 50), and 25 degrees off to the side
//   wave        three waves (front 0.2 level 0.3, front 0.5 level 0.7, front 0.8 level 1), three clocks each, the camera 6 m back
//               at 1.7 m, square on; the group x of each is shifted so the crest is in view (a bench trick, not a clip's place);
//               then a wave moving (front 0.40 to 0.70 in a second) with two stills 1/30 s apart, and one from 25 degrees off
//   noteflood   grow 0.5 and 1 at the foot of the wall
//   noterain    "iou" amount 0.5 and 1 over Reaper, "note"; snow in flood-snow.json
//   node storyboards/series/what-if/04-copy-money/bench/make-flood-props.mjs
//   node engine/render.mjs storyboards/series/what-if/04-copy-money/bench/flood-props.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const WALL = { id: "wall", kind: "windowwall", x: 0, z: 0, tiles: 2 };
const wave = (id, x, extra) => ({ id, kind: "moneywave", x, y: 0, z: -2.2, len: 16, h: 2.7, d: 2.5, front: 0, level: 1, clock: 0, ...extra });
const WAVES = [
  { id: "wA", x: 4.1, front: 0.2, level: 0.3, palm: [-3.5, 0.2] },
  { id: "wB", x: 0, front: 0.5, level: 0.7, palm: [1.0, 0.2] },
  { id: "wC", x: -4.3, front: 0.8, level: 1, palm: null },
];

function build(snow) {
  const c = clip(), { A } = c, SHOTS = [], stills = [];
  const props = snow ? [] : [WALL, ...WAVES.map((w) => wave(w.id, w.x, { palm: w.palm }))];
  if (!snow) {
    props.push({ id: "fl", kind: "noteflood", x: 0, y: 0, z: 0.03, w: 3.6, d: 2.2 });
    props.push({ id: "iou", kind: "noterain", x: 8, y: 0, z: 2, look: "iou", n: 60, top: 3.2, r: 0.9 });
    props.push({ id: "nte", kind: "noterain", x: 15, y: 0, z: 2, look: "note", n: 60, top: 3.2, r: 0.9 });
  } else {
    props.push({ id: "snow", kind: "noterain", x: 0, y: 0, z: 0, look: "snow", n: 300, r: 3, top: 3.2 });
  }
  let t = 0;
  const shot = (name, cam, label, setup, at = [0.5]) => { const t0 = t++; SHOTS.push([name, t0, cam, label]); setup?.(t0); at.forEach((a) => stills.push(r3(t0 + a))); return t0; };
  const hide = (t0, except) => WAVES.forEach((w) => { if (w.id !== except) c.prop(t0, w.id, { front: 0, clock: 0 }, 0, "linear"); });
  const CAM = { pos: [0, 1.7, 6], look: [0, 1.7, 0], fov: 50 };
  if (!snow) {
    shot("wall-wide", { pos: [0, 2.6, 15.5], look: [0, 2.4, 0], fov: 50 }, "wall: 2 tiles, 7.3 m wide (15.5 m back)", (t0) => hide(t0, null));
    shot("wall-front", CAM, "wall: square on from 6 m", (t0) => hide(t0, null));
    shot("wall-side", { pos: [6 * Math.sin(25 * Math.PI / 180), 1.7, 6 * Math.cos(25 * Math.PI / 180)], look: [0, 1.7, 0], fov: 50 }, "wall: 25 degrees off to the side", (t0) => hide(t0, null));
    for (const w of WAVES) for (const clk of [0, 0.5, 1.3]) {
      shot(`${w.id}-${clk}`, CAM, `wave front ${w.front} level ${w.level} clock ${clk}`, (t0) => { hide(t0, w.id); c.prop(t0, w.id, { front: w.front, level: w.level, clock: clk }, 0, "linear"); });
    }
    shot("wave-moving", CAM, "wave moving: front 0.40 to 0.70 in 1 s (stills 1/30 s apart)", (t0) => { hide(t0, "wB"); c.prop(t0, "wB", { front: 0.4, level: 0.7, clock: 3 }, 0, "linear"); c.prop(t0, "wB", { front: 0.7, level: 0.7, clock: 4 }, 1, "linear"); }, [0.4, r3(0.4 + 1 / 30)]);
    shot("wave-side", { pos: [6 * Math.sin(25 * Math.PI / 180), 1.7, 6 * Math.cos(25 * Math.PI / 180)], look: [0, 1.7, 0], fov: 50 }, "wave front 0.5 level 1, 25 degrees off", (t0) => { hide(t0, "wB"); c.prop(t0, "wB", { front: 0.5, level: 1, clock: 0.5 }, 0, "linear"); });
    shot("wave-wide", { pos: [0, 1.7, 12], look: [0, 1.6, 0], fov: 50 }, "wave front 0.5 level 1, wide camera 12 m", (t0) => { hide(t0, "wB"); c.prop(t0, "wB", { front: 0.5, level: 1, clock: 1.1 }, 0, "linear"); });
    shot("wave-low", { pos: [0.4, 1.2, 4.6], look: [0, 1.5, 0], fov: 50 }, "wave front 0.5 level 1, low camera 4.6 m", (t0) => { hide(t0, "wB"); c.prop(t0, "wB", { front: 0.5, level: 1, clock: 1.1 }, 0, "linear"); });
    for (const [g, clk] of [[0.5, 1.0], [1, 2.0]]) shot(`flood-${g}`, { pos: [0, 1.5, 5.2], look: [0, 0.3, 0.8], fov: 50 }, `noteflood grow ${g}`, (t0) => { hide(t0, null); c.prop(t0, "fl", { grow: g, clock: clk }, 0, "linear"); });
    for (const [am, clk] of [[0.5, 0.9], [1, 2.8]]) shot(`iou-${am}`, { pos: [8, 1.5, 6.2], look: [8, 1.2, 2], fov: 46 }, `noterain iou amount ${am} over Reaper`, (t0) => { c.prop(t0, "iou", { amount: am, clock: clk }, 0, "linear"); });
    shot("note-rain", { pos: [15, 1.5, 5.6], look: [15, 1.2, 2], fov: 46 }, "noterain note amount 1", (t0) => { c.prop(t0, "nte", { amount: 1, clock: 1.2 }, 0, "linear"); });
  } else {
    shot("snow-air", { pos: [0, 1.6, 6.5], look: [0, 1.5, 0], fov: 50 }, "snow on a dark set (n 300, r 3), clock 1", (t0) => c.prop(t0, "snow", { amount: 1, clock: 1 }, 0, "linear"));
    shot("snow-half", { pos: [0, 1.6, 6.5], look: [0, 1.5, 0], fov: 50 }, "snow amount 0.5, clock 2.4", (t0) => c.prop(t0, "snow", { amount: 0.5, clock: 2.4 }, 0, "linear"));
  }
  const cast = snow ? [] : [
    { id: "gsl", character: "never-has-money/gunslinger", at: [0.8, 2.0], face: 0, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "rea", character: "never-has-money/reaper", at: [8, 2.0], face: 0, expr: "kind", follow: 0.2, seed: 2.1 },
  ];
  const END = SHOTS.length;
  SHOTS.forEach(([, t0, , label]) => c.cap(t0, t0 + 1, label, 240, false, { kinetic: false }));
  console.log(snow ? "snow stills:" : "stills:", stills.join(","));
  console.log(SHOTS.map(([n, t0]) => `${n}@${t0 + 0.5}`).join(" "));
  write(import.meta.url, {
    id: snow ? "flood-snow" : "flood-props", title: "Flood props bench", idea: "Props bench for There's a catch EP04 (window wall, money wave, note flood, note rain), not a clip",
    fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
    set: snow ? { type: "plain", color: "#141824", floor: "#1c2030" } : { type: "plain", color: "#cfdde8", floor: "#8a4a38" }, music: false, sound: { auto: false },
    hook: { show: snow ? [] : ["gsl", "wall"], hint: 0, what: "engine test" },
    cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([name, t0, cam]) => [name, t0, cam]), END),
    notes: "Generated by storyboards/series/what-if/04-copy-money/bench/make-flood-props.mjs (props bench, no reviews).",
  });
}
build(false); build(true);
