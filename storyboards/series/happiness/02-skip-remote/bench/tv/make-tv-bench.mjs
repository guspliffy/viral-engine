// Box TV + sideboard bench (task T9, engine/page/props-skiproom.js; DESIGN.md section 5): the dark TV of panel 11, the screen
// playing a single still, the same screen mid-atlas (both the `feed` tile index and the time-based spec.fps), and the glow on a
// potato 1.35 m away at screen left (panels 13-14). Not a clip.
//   node storyboards/series/happiness/02-skip-remote/bench/tv/make-tv-bench.mjs    -> tv-bench.json (beside this file)
//   flock /tmp/ve-render.lock node engine/render.mjs <that json> --stills 0.6,2.0,3.4,4.8,6.2,7.8,9.6 --draft --silent --out <dir>
//   node qa/contact.mjs <dir>/tv-bench-*.png --out storyboards/series/happiness/02-skip-remote/bench/tv/contact.png
// The test atlas (6 cols x 4 rows of 512 x 384, the tile number burned into each) and the single still are a crop of panel 16
// of skip-remote-sheet-2.png, its hue walked round: see make-atlas.sh beside this file.
import { clip, write } from "../../../../../lib/clip.mjs";
import { SIDEBOARD, BOXTV } from "../../../../../../engine/page/props-skiproom.js";

const c = clip(), { prop } = c;
const END = 10.4;
const DIR = "storyboards/series/happiness/02-skip-remote/bench/tv";
const TOP = SIDEBOARD.top;                       // 0.55: the sideboard's top = the TV's base
const SY = TOP + BOXTV.screenAt[1];              // 0.84: the screen's middle
const SZ = BOXTV.glowAt[2] - 0.06;               // 0.239: the glass at its apex

// the screen reads 540 px wide (DESIGN's panel 13) at fov 40 on a 1080 x 1920 frame: 1920 / (2 tan 20 d) x 0.52 m = 540 px -> d 2.54 m
const FRONT = (x, d = 2.54, fov = 40) => ({ pos: [x + BOXTV.screenAt[0], SY, SZ + d], look: [x + BOXTV.screenAt[0], SY, SZ], fov });

const X = { off: 0, still: 2.6, atlas: 5.2, fps: 7.8 };
const board = (id, x) => ({ id, kind: "sideboard", x, y: 0, z: 0 });
const tv = (id, x, screen, more = {}) => ({ id, kind: "boxtv", x, y: TOP, z: 0, ...(screen && { screen }), ...more });
const ATLAS = { src: `${DIR}/atlas-6x4.png`, cols: 6, rows: 4 };

const props = [
  board("bOff", X.off), tv("tvOff", X.off, ATLAS),                                   // stays dark: the panel 11 look
  board("bStill", X.still), tv("tvStill", X.still, { src: `${DIR}/still.png`, cols: 1, rows: 1 }),
  board("bAtlas", X.atlas), tv("tvAtlas", X.atlas, ATLAS, { castLight: 1 }),         // the `feed` tile index, and the glow on the cast
  board("bFps", X.fps), tv("tvFps", X.fps, ATLAS, { fps: 12, t0: 0 }),               // the time-based feed: 12 tiles a second
];
// `on` starts at 0 whatever the spec says (props3d.js propState), so every state is set by an action
for (const id of ["tvOff", "tvStill", "tvAtlas", "tvFps"]) prop(0, id, { on: 0, feed: 0 }, 0);
prop(2.6, "tvStill", { on: 1 }, 0.2); prop(2.6, "tvAtlas", { on: 1 }, 0.2); prop(2.6, "tvFps", { on: 1 }, 0.2);
prop(4.0, "tvAtlas", { feed: 23 }, 2.0, "linear");    // 12 tiles a second: at the 4.8 s still, feed 9.2 -> tile 9
prop(8.6, "tvAtlas", { on: 0 }, 0.2);                 // the same dark room without the TV: what the glow is worth

const cast = [
  // old Spud's place: 1.35 m from the screen at screen left (0.805 across, 1.10 back), turned to the TV
  { id: "spud", character: "potatobrawl/spud", at: [X.atlas + BOXTV.screenAt[0] - 0.805, SZ + 1.10], face: 144, expr: "kind", follow: 0.2, seed: 1.7 },
];

const shots = [
  ["TV off, 3/4: cabinet, sideboard, grain", 0, { pos: [1.5, 1.15, 2.3], look: [0.1, 0.5, 0], fov: 40 }],
  ["TV off, straight on (panel 11): dark glass, knobs, slats", 1.4, FRONT(X.off)],
  ["TV on, a single still (cols 1 rows 1), screen 540 px", 2.8, FRONT(X.still)],
  ["TV on, 6x4 atlas mid-feed (feed 9.2 -> tile 9)", 4.2, FRONT(X.atlas)],
  ["TV on, 6x4 atlas by spec.fps 12 (t 6.2 -> tile 2)", 5.6, FRONT(X.fps)],
  ["the glow on a potato 1.35 m away, the room at 0.08", 7.0, { pos: [6.52, 1.00, 0.33], look: [4.35, 0.55, 1.34], fov: 34 }],
  ["the same, the TV off: the room light alone", 8.8, { pos: [6.52, 1.00, 0.33], look: [4.35, 0.55, 1.34], fov: 34 }],
];

write(import.meta.url, {
  id: "tv-bench", title: "Box TV bench", idea: "Prop bench, not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, music: false, sound: { auto: false },
  set: { type: "plain", color: "#3b3a40", floor: "#4a4038", para: 0, cel: { at: 0.25 }, ink: true },
  notes: "Prop bench for engine/page/props-skiproom.js (no reviews).",
  hook: { show: [], hint: 0, what: "prop bench" },
  // the room goes out for the glow shot. (It darkens the set, not the cast: the drawn look shades a body by HOW lit it is,
  // not by how much light there is, so only the TV's castLight band changes a face. 7.80 s on against 9.60 s off.)
  fx: [{ do: "lights", at: 6.8, to: 0.08, dur: 0.2 }],
  cast, props, captions: c.captions, beats: c.beats(shots, END),
});
