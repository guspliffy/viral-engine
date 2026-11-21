// Krampus myth 01 "One night a year he checks your boots", Nick's things bench (task T-D): the kinds `goldenbook`, `nickcrook` and `nicksack` of
// engine/page/props-krampus-nick.js at their DESIGN sizes (DESIGN.md section D). Not a clip, no cast. One shot per beat (1.1 s each, the still is 0.4 s in):
//   closed, coverClose, medallion, spineBack    the book shut: front cover (frame, 4 bosses, medallion, scrolls); the cover and the boot medallion close; the spine with its 5 bands and the chain
//   openGlow, turnMid, pagesPlain, pagesLong    open 150 deg with the GOOD page glowing; a leaf turning (page 0.5); two ordinary pages (12 pictures each); the long spread
//   roll1, roll2, roll3, rollSide               the roll at 0.64 m, 1.76 m and the full 3.20 m crossing the apron and the lane ground; the same from the side
//   rowsA, rowsB, rowsC, coil                   the roll's 13 rows of 4 cartons, close, three stretches; the head: the coil shrinking to its spindle (run 0.9)
//   crook, crookHead, crookHand, crookPlanted   the crook whole, the volute (side), the worn grip zone and knops, planted with its snow collar
//   sackFull, sackEmpty                         the sack full (3 bulges, 5 coin edges, the mouth with 6 pieces, the cord) and slumped (full 0.4)
//   node storyboards/series/krampus-myth/01-boots/bench/make-nick-things-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/krampus-myth/01-boots/bench/nick-things-bench.json --stills <the times printed> --draft --safe --out /tmp/claude-0/bench-nickthings
//   node qa/contact.mjs /tmp/claude-0/bench-nickthings/nick-things-bench-*.png --out storyboards/series/krampus-myth/01-boots/bench/nick-things-sheet.png
import { clip, write, frame, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const props = [];
const add = (...p) => props.push(...p);
const BY = 0.30;   // the books float 0.30 above the floor
const bkC = { id: "bkC", kind: "goldenbook", x: 3, y: BY, z: 0 };
const bkO = { id: "bkO", kind: "goldenbook", x: 6, y: BY, z: 0, open: 1, glow: 1, spread: "good" };
const bkT = { id: "bkT", kind: "goldenbook", x: 9, y: BY, z: 0, open: 1, page: 0.5, spread: "plain" };
const bkP = { id: "bkP", kind: "goldenbook", x: 12, y: BY, z: 0, open: 1, spread: "plain" };
const RX = 20, AP = 0.16;   // the roll's book and the apron (a plinth 0.16 high: the step edge 1.0 m from the point under the book)
const bkL = { id: "bkL", kind: "goldenbook", x: RX, y: AP + 0.30 - 0.008, z: 0, open: 1, spread: "long", roll: [0, 1] };
const apron = { id: "apron", kind: "plinth", x: RX, y: 0, z: 0, w: 3.2, h: AP, d: 2.0 };
const ck = { id: "ck", kind: "nickcrook", x: 30, y: 0, z: 0 };
const ckP = { id: "ckP", kind: "nickcrook", x: 31.5, y: -0.10, z: 0, planted: true, tilt: -4 };
const skF = { id: "skF", kind: "nicksack", x: 36, y: 0, z: 0 };
const skE = { id: "skE", kind: "nicksack", x: 37, y: 0, z: 0, full: 0.4 };
add(bkC, bkO, bkT, bkP, bkL, apron, ck, ckP, skF, skE);

const T = (h, az, el, tx, ty, tz, fov = 24) => frame([tx, ty, tz], { az, el, h, fov });
const shots = [];
const S = (name, cam, acts) => shots.push([name, cam, acts || []]);
S("closed", T(0.62, 0, 6, bkC.x + 0.13, BY + 0.2, 0));
S("coverClose", T(0.50, 0, 2, bkC.x + 0.14, BY + 0.2, 0.04, 20));
S("medallion", T(0.20, 0, 2, bkC.x + 0.143, BY + 0.2, 0.04, 18));
S("spineBack", T(0.75, -75, 8, bkC.x - 0.01, BY + 0.14, 0, 22));
S("openGlow", T(1.30, 0, 8, bkO.x, BY + 0.2, 0, 24));
S("turnMid", T(1.30, 0, 14, bkT.x, BY + 0.2, 0, 24));
S("pagesPlain", T(0.5, 0, 6, bkP.x + 0.15, BY + 0.2, 0.0, 20));
S("pagesLong", T(1.30, 0, 8, RX, AP + 0.30 + 0.2, 0, 24), [[0, "bkL", { run: 0 }]]);
const rowT = (az, el, tz, h, tx = RX) => T(h, az, el, tx, AP + 0.04, tz, 24);
S("roll1", T(1.6, 0, 18, RX, AP + 0.15, 0.2, 26), [[0, "bkL", { run: 0.2 }]]);
S("roll2", T(5.2, 0, 52, RX, 0.1, 1.2, 30), [[0, "bkL", { run: 0.55 }]]);
S("roll3", T(6.4, 0, 56, RX, 0.1, 1.5, 30), [[0, "bkL", { run: 1 }]]);
S("rollSide", T(5.8, 90, 30, RX, 0.4, 1.4, 30), [[0, "bkL", { run: 1 }]]);
S("rowsA", rowT(0, 58, 0.6, 1.3), [[0, "bkL", { run: 0.55 }]]);
S("rowsB", rowT(0, 62, 2.3, 1.5), [[0, "bkL", { run: 1 }]]);
S("rowsC", rowT(0, 62, 3.3, 1.5), [[0, "bkL", { run: 1 }]]);
S("coil", rowT(0, 40, 3.2, 0.7), [[0, "bkL", { run: 0.93 }]]);
S("crook", T(1.7, 62, 4, ck.x, 0.75, 0.05, 24));
S("crookHead", T(0.36, 90, 4, ck.x, 1.33, 0.12, 20));
S("crookHand", T(0.6, 25, 6, ck.x, 0.78, 0.0, 18));
S("crookPlanted", T(1.7, 62, 4, ckP.x, 0.65, 0.05, 24));
S("sackFull", T(0.5, 0, 8, skF.x, 0.16, 0, 20));
S("sackEmpty", T(0.5, 0, 8, skE.x, 0.13, 0, 20));

const times = [];
shots.forEach(([name, cam, acts], k) => {
  const at = r3(k * 1.1);
  for (const [dt, id, set] of acts) c.prop(r3(at + dt), id, set, 0);
  times.push(r3(at + 0.4));
});
c.prop(0, "bkL", { run: 0 }, 0);
const end = r3(shots.length * 1.1 + 0.2);
const sb = {
  id: "nick-things-bench", title: "Krampus 01 Nick's things bench", idea: "Engine look bench for the golden book, the crook and the sack (task T-D), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#1d2744", floor: "#6a7186", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [], props, captions: c.captions, beats: c.beats(shots.map(([name, cam], k) => [name, r3(k * 1.1), cam]), end),
  notes: "Generated by storyboards/series/krampus-myth/01-boots/bench/make-nick-things-bench.mjs (engine bench).",
};
console.log("stills:", times.join(","));
write(import.meta.url, sb);
