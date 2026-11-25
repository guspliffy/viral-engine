// Norse myth 01 small props bench (task T-F, 22 Nov 2026): kinds norsecup, norsesheet, norsetest, norsebud, norsesip
// (engine/page/props-norse-items.js, DESIGN.md section F1). Not a clip, no story. One shot per beat (1.2 s each, the still is 0.6 s in):
//   cup:   cup0 front, empty | cupq 3/4 | cupband the carved band close (10 crossings) | cuptop from above, filled | cupgold gold water
//          cuppour tipped 55 degrees, pouring | cuphold the stream frozen (hold 1) | cupshake shaken, 2 drops over the rim | cupdrip 3 drops from the foot
//   sheet: sh0 the ball (open 0) | sh35 open 0.35 | sh65 open 0.65 (panel 04) | sh100 flat but creased | shback the blank back
//   test:  test the hero sheet (the strip, ring, arrow, "?") | testclose the strip close | testwrite write 0.8 | desk the class desk sheet (marks 0.3, write 0.3)
//   bud:   bud0 | bud25 stretching | bud34 the squash | bud60 the crumbs | budpalm on a flat palm (trembling)
//   sip:   Chip with sip0 flow 0.15, sip1 flow 0.35, sip2 flow 0.5, sipglow glow 1 (the edge glow, veins, motes), sipboth flow 0.4 + glow 1
// Usage: node storyboards/series/norse-myth/01-wednesday/bench/make-items-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/items-bench.json --stills <times printed> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/items-bench-*.png --out <this dir>/items-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const ONLY = process.argv.slice(2);
const shots = [];
let T = 0;
const cam = (x, y, z, lx, ly, lz, fov) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
const beat = (name, camera, acts = () => {}) => { if (ONLY.length && !ONLY.includes(name)) return; acts(T); shots.push([name, T, camera]); T += 1.2; };
const P = (t, id, set) => c.prop(t, id, set, 0);
const CUP = [-3, 0, 0], SHEET = [-1.2, 0, 0], TEST = [0, 0, 0], DESK = [1.2, 0, 0], BUD = [2.4, 0, 0], CHIP = [4.5, 0];
const CC = (x = CUP[0], y = 0.045, d = 0.42, fov = 30) => cam(x, y + 0.01, d, x, y, 0, fov);

// the cup (the big texture is built once)
beat("cup0", CC(), (t) => P(t, "cup", { fill: 0, rot: 0, tip: 0, pour: 0, hold: 0, shake: 0, drip: 0, gold: 0 }));
beat("cupq", CC(), (t) => P(t, "cup", { rot: 140 }));
beat("cupband", CC(CUP[0], 0.056, 0.26, 26), (t) => P(t, "cup", { rot: 0 }));
beat("cuptop", cam(CUP[0], 0.42, 0.16, CUP[0], 0.04, 0, 30), (t) => P(t, "cup", { fill: 1, rot: 0 }));
beat("cupgold", cam(CUP[0], 0.42, 0.16, CUP[0], 0.04, 0, 30), (t) => P(t, "cup", { gold: 1 }));
beat("cuppour", cam(CUP[0] + 0.05, 0.06, 0.55, CUP[0] + 0.05, 0.05, 0, 28), (t) => P(t, "cup", { gold: 0, rot: 90, tip: 52, pour: 1, y: 0.02 }));
beat("cuphold", cam(CUP[0] + 0.05, 0.06, 0.55, CUP[0] + 0.05, 0.05, 0, 28), (t) => P(t, "cup", { hold: 1 }));
beat("cupshake", CC(CUP[0], 0.07, 0.4, 30), (t) => P(t, "cup", { rot: 0, tip: 0, pour: 0, hold: 0, y: 0, shake: 1 }));
beat("cupdrip", CC(CUP[0], -0.06, 0.45, 32), (t) => P(t, "cup", { shake: 0, fill: 0, drip: 1, y: 0.1 }));
// the crumpled sheet
const SC = (d = 1.25, y = 0.15, fov = 30) => cam(SHEET[0], y, d, SHEET[0], y, 0, fov);
beat("sh0", cam(SHEET[0], 0.04, 0.3, SHEET[0], 0.035, 0, 30), (t) => P(t, "sheet", { open: 0 }));
beat("sh35", SC(), (t) => P(t, "sheet", { open: 0.35 }));
beat("sh65", SC(), (t) => P(t, "sheet", { open: 0.65 }));
beat("sh100", SC(), (t) => P(t, "sheet", { open: 1 }));
beat("sh65q", SC(), (t) => P(t, "sheet", { open: 0.65, rot: 35 }));
beat("shback", SC(), (t) => P(t, "sheet", { open: 0.65, rot: 180 }));
// the test sheets
const TC = (x = TEST[0], y = 0.16, d = 1.25, fov = 30) => cam(x, y, d, x, y, 0, fov);
beat("test", TC(), (t) => P(t, "test", { write: 0 }));
beat("testclose", cam(TEST[0], 0.235, 0.3, TEST[0], 0.235, 0, 26));
beat("testwrite", cam(TEST[0], 0.215, 0.3, TEST[0], 0.215, 0, 26), (t) => P(t, "test", { write: 0.8 }));
beat("desk", TC(DESK[0]), (t) => P(t, "desk", { write: 0.3 }));
// the plucked eye
const BC = (y = 0.006, d = 0.12, fov = 24) => cam(BUD[0], y + 0.02, d, BUD[0], y, 0, fov);
beat("bud0", BC(), (t) => P(t, "bud", { pop: 0, tremble: 0 }));
beat("bud25", BC(), (t) => P(t, "bud", { pop: 0.25 }));
beat("bud34", BC(), (t) => P(t, "bud", { pop: 0.34 }));
beat("bud60", BC(0.02, 0.2, 26), (t) => P(t, "bud", { pop: 0.6 }));
beat("budpalm", BC(0.006, 0.12, 24), (t) => P(t, "bud", { pop: 0, tremble: 1 }));
// the sip light on Chip
const CAMS = cam(CHIP[0], 0.5, 2.8, CHIP[0], 0.46, 0, 28);
beat("sip0", CAMS, (t) => { P(t, "sip", { flow: 0.15, glow: 0 }); });
beat("sip1", CAMS, (t) => P(t, "sip", { flow: 0.35 }));
beat("sip2", CAMS, (t) => P(t, "sip", { flow: 0.5 }));
beat("sipglow", CAMS, (t) => P(t, "sip", { flow: 0, glow: 1 }));
beat("sipboth", CAMS, (t) => P(t, "sip", { flow: 0.4, glow: 1 }));

const END = T + 1.2;
const stills = shots.map(([n, t]) => Math.round((t + 0.6) * 100) / 100);
console.log("stills:", stills.join(","));
write(import.meta.url, {
  id: "items-bench", title: "Norse myth 01 small props bench", idea: "Bench for the cup, sheets, bud and sip light (task T-F), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#8a93a6", floor: "#59606e", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["chip"], hint: 0, what: "engine test" },
  cast: [{ id: "chip", character: "norse-myth/chip-buds", at: CHIP, face: 0, expr: "kind", follow: 0, seed: 1.3 }],
  props: [
    { id: "cup", kind: "norsecup", x: CUP[0], y: 0, z: 0 },
    { id: "sheet", kind: "norsesheet", x: SHEET[0], y: 0, z: 0 },
    { id: "test", kind: "norsetest", x: TEST[0], y: 0, z: 0 },
    { id: "desk", kind: "norsetest", x: DESK[0], y: 0, z: 0, marks: 0.3, seed: 4 },
    { id: "bud", kind: "norsebud", x: BUD[0], y: 0, z: 0 },
    { id: "sip", kind: "norsesip", x: CHIP[0], y: 0, z: 0 },
  ],
  captions: c.captions,
  beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-items-bench.mjs (small props bench, no story).",
});
