// Hell Reviews set B bench (task T3, 19 Nov 2026): the hell resort lobby of engine/page/props-hellb.js at its DESIGN sizes
// (storyboards/series/potato-desk/09-hell-reviews/DESIGN.md sections 0, 3, 4). Not a clip, no cast. One shot per beat (1.1 s each, the still is 0.4 s in);
// the state changes are dur-0 `prop` steps at the start of the beat:
//   badC0 badL0 badR0     B-C / B-L / B-R, the "bad" room: no X, lava + glow, fries mound and plates, island outside, curtains closed
//   badC5 badL5 badR5     the same three with all five X, the duck melted to its puddle
//   badLopen              B-L with the curtains open (the sunny island in the top third of the glass)
//   tubBad buffBad        close looks (not rail cameras) at the lava tub and the fries buffet, bad state
//   fixC fixL fixR        the "fixed" room: all five X peeled (stickers on the floor), foam + duck on it, cake + treats, beach + sunset, lights on, cluster
//   tubFix buffFix        the same two closes, fixed
//   stickers              a low look at the five peeled X stickers lying under the board (z -0.85)
//   peel                  the board close, row 2 mid-curl (fall 1.3)
//   glass                 B-GLASS: from outside the window, curtains open
//   node storyboards/series/potato-desk/09-hell-reviews/bench/make-hellb-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/hellb-bench.json --draft --safe --out <dir> --stills 0.4,1.5,2.6,...   (beat start + 0.4: `--stills beats` picks other times)
//   node qa/contact.mjs <the stills in time order> --cols 4 --out <this dir>/hellb-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const rail = (x) => ({ pos: [x, 1.45, 10.4], look: [x, 1.45, 0], fov: 26 });
const B_C = rail(0), B_L = rail(-0.75), B_R = rail(0.75);
const B_GLASS = { pos: [-1.60, 0.62, -4.3], look: [-1.60, 0.50, -1.3], fov: 24 };
const B_BOARD = { pos: [0, 1.95, 5.0], look: [0, 1.80, -1.0], fov: 24 };
const C_FLOOR = { pos: [0, 2.2, 2.4], look: [0, 0.0, -0.85], fov: 30 };
const C_TUB = { pos: [-1.30, 1.0, 3.2], look: [-1.30, 0.15, 0.5], fov: 30 }, C_BUFFET = { pos: [1.63, 1.1, 3.5], look: [1.63, 0.35, 0.25], fov: 30 };
const props = [
  { id: "room", kind: "lobbyroom", x: 0, y: 0, z: 0 },
  { id: "win", kind: "curtainwindow", x: -1.60, y: 0, z: -1.30 },
  { id: "lights", kind: "partylights", x: 0, y: 0, z: 0 },
  { id: "tub", kind: "lavatub", x: -1.30, y: 0, z: 0.50, glow: 1 },
  { id: "duck", kind: "rubberduck", x: -1.30, y: 0.10, z: 0.50, yaw: 0 },
  { id: "speaker", kind: "speakerbox", x: -0.82, y: 0, z: -1.05 },
  { id: "balloon", kind: "balloon", x: -0.80, y: 0.56, z: -1.05 },
  { id: "board", kind: "perkboard", x: 0, y: 0, z: -1.00 },
  { id: "exit", kind: "exitdoor", x: 1.10, y: 0, z: -1.30 },
  { id: "exitsign", kind: "officesign", x: 1.10, y: 1.84, z: -1.27, w: 0.50, h: 0.20, frameW: 0.016, lines: [["EXIT", 0.12]], plate: "#1f7a3a", ink: "#f3ead2", frame: "#d9a93a" },
  { id: "table", kind: "buffettable", x: 1.63, y: 0, z: 0.25 },
  { id: "mound", kind: "friesmound", x: 1.63, y: 0.40, z: -0.02 },
  { id: "cake", kind: "cakestack", x: 1.63, y: 0.40, z: -0.02, scale: 0 },
  ...[0.30, 0.50, 0.70].map((z, i) => ({ id: `pf${i}`, kind: "buffetplate", food: "fries", x: 1.63, y: 0.40, z })),
  ...[["cupcake", 0.30], ["donut", 0.50], ["jelly", 0.70]].map(([food, z], i) => ({ id: `pt${i}`, kind: "buffetplate", food, x: 1.63, y: 0.40, z, scale: 0 })),
  { id: "mat", kind: "towelmat", x: 0.20, y: 0, z: 0.40 },
  { id: "island", kind: "heavenisland", x: -2.05, y: 1.62, z: -7.5 },
  { id: "rock", kind: "rockshaft", x: -2.2, y: 1.0, z: -9 },
  { id: "beach", kind: "beachview", x: -2.05, y: 1.05, z: -7.5, scale: 0 },
  { id: "sky", kind: "sunsetsky", x: -2.2, y: 1.0, z: -9, scale: 0 },
];
const set = (t, id, s) => c.prop(t, id, s, 0);
// the bad room's five X, the duck's puddle, the curtains
set(3.3, "board", { count: 5 }); set(3.3, "duck", { melt: 1 });
set(6.6, "win", { open: 1 });
// the fixed room (hidden by a poof in a clip; a bench just steps)
const FIX = 9.9;
set(FIX, "board", { fall: 5 }); set(FIX, "tub", { fix: 1 }); set(FIX, "duck", { melt: 0, y: 0.22 });
set(FIX, "mound", { scale: 0 }); set(FIX, "cake", { scale: 1 });
for (let i = 0; i < 3; i++) { set(FIX, `pf${i}`, { scale: 0 }); set(FIX, `pt${i}`, { scale: 1 }); }
set(FIX, "island", { scale: 0 }); set(FIX, "rock", { scale: 0 }); set(FIX, "beach", { scale: 1 }); set(FIX, "sky", { scale: 1 });
set(FIX, "lights", { on: 1 }); set(FIX, "room", { bright: 1 }); set(FIX, "balloon", { cluster: 1 }); set(FIX, "speaker", { pulse: 0.8 });
set(16.5, "board", { fall: 1.3 });

const end = 18.7;
const sb = {
  id: "hellb-bench", title: "Hell Reviews set B bench", idea: "Engine look bench for the hell resort lobby (task T3), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#2a2024", floor: "none", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats([
    ["badC0", 0, B_C], ["badL0", 1.1, B_L], ["badR0", 2.2, B_R],
    ["badC5", 3.3, B_C], ["badL5", 4.4, B_L], ["badR5", 5.5, B_R], ["badLopen", 6.6, B_L],
    ["tubBad", 7.7, C_TUB], ["buffBad", 8.8, C_BUFFET],
    ["fixC", 9.9, B_C], ["fixL", 11.0, B_L], ["fixR", 12.1, B_R],
    ["tubFix", 13.2, C_TUB], ["buffFix", 14.3, C_BUFFET],
    ["stickers", 15.4, C_FLOOR], ["peel", 16.5, B_BOARD], ["glass", 17.6, B_GLASS],
  ], end),
  notes: "Generated by storyboards/series/potato-desk/09-hell-reviews/bench/make-hellb-bench.mjs (engine bench, no reviews).",
};
write(import.meta.url, sb);
