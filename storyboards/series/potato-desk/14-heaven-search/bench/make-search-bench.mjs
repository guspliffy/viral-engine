// Heaven search bench (25 Nov 2026): the new props of engine/page/props-heavensearch.js at their DESIGN sizes (../DESIGN.md section 2), on the heaven-steps top set
// (heaventerrace, pearlgate, cloudpodium, gaterays + sky colour). Not a clip, no cast. Station T's frame (origin = top edge of riser 100, y 0 = the terrace).
// One shot per beat (1.1 s each; the still is 0.4 s in); state changes are dur-0 `prop` steps at the start of the beat:
//   bar6 / bar1     F-BAR (238 px/m): the search screen, text 6 typed whole (type 1, cursor blinks) / text 1 half typed (type 0.5, cursor solid)
//   wideAlarm / wideOff   a wide look (149 px/m, wings in) at text 6 with the alarm outline / the screen on standby (on 0)
//   crack0 .25 .5 .85 1   the trapdoor from 20 deg above the floor at 700 px/m (the DESIGN's bench still), then `open` 1 (the terrace has hole [-0.20, -1.40, 0.52])
//   openHole        the open trapdoor from 36 deg up (T-DROP-like), open 1, crack 1
//   tab6 / tabTop   T-TAB: the gold tablet at row 6 on the podium (button beside it), then straight down on it; btn0 / btn1  F-BUTTON: the hell button press 0 / 1
//   cas0 / cas1 / casTop   the casserole on the terrace from the camera side, lid 0 / 1, then from above (lid 1)
//   node storyboards/series/potato-desk/14-heaven-search/bench/make-search-bench.mjs
//   node engine/render.mjs <this dir>/search-bench.json --stills beats --draft --safe --out <dir>   (the stills it prints)
//   node qa/contact.mjs <dir>/search-bench-*.png --cols 6 --out <this dir>/search-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const cam = (pos, look, fov = 30) => ({ pos, look, fov });
const T6 = "how to delete\nsearch history", T1 = "is it normal to talk\nto my plants";
const CAM = {
  bar: cam([-0.20, -1.00, 8.00], [-0.20, 3.82, -5.40], 31), wide: cam([-0.20, 1.50, 6.60], [-0.20, 4.60, -5.40], 55),
  gate: cam([-0.20, 1.75, 3.41], [-0.20, 0, -1.40], 30), hole: cam([1.30, 2.2, 1.20], [-0.20, 0, -1.40], 40),
  tab: cam([1.60, 2.45, -0.25], [1.00, 0.46, -0.80], 30), btn: cam([1.75, 1.25, 1.90], [1.20, 0.80, -1.00], 30),
  cas: cam([-1.60, 0.55, -1.75], [-1.60, 0.07, -1.00], 40), tabTop: cam([0.98, 1.60, -0.70], [0.98, 0.45, -0.78], 40), casTop: cam([-1.60, 0.75, -1.35], [-1.60, 0.07, -1.00], 40),
};
const PUFFS = [[-2.85, 0.55, -1.0, 0.55], [-3.0, 0.7, -2.0, 0.62], [-2.9, 0.5, -3.0, 0.5], [-2.75, 0.6, -3.9, 0.55], [-1.6, 0.65, -4.6, 0.6], [-0.3, 0.75, -4.75, 0.7], [0.9, 0.6, -4.6, 0.6], [2.0, 0.7, -4.7, 0.65], [3.0, 0.5, -4.4, 0.5]];
const props = [
  { id: "terrace", kind: "heaventerrace", x: 0, y: 0, z: 0, hole: [-0.20, -1.40, 0.52] },
  { id: "fog", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-2.6, 0.01, -4.3], [2.6, 0.09, -0.5]], n: 24, size: 1.6, color: "#f7fafc", a: 0.5, drift: [-0.03, 0] },
  ...PUFFS.map(([x, y, z, r], i) => ({ id: `puff${i}`, kind: "cloudpuff", x, y, z, r, seed: 20 + i })),
  { id: "gate", kind: "pearlgate", x: -0.20, y: 0, z: -2.30 },
  { id: "podium", kind: "cloudpodium", x: 1.05, y: 0, z: -0.80 },
  { id: "rays", kind: "gaterays", x: -0.20, y: 2.2, z: -6.0 },
  { id: "scr", kind: "searchscreen", x: -0.20, y: 4.64, z: -5.40, text: T6 },
  { id: "trap", kind: "gatetrap", x: -0.20, y: 0, z: -1.40 },
  { id: "tab", kind: "searchtablet", x: 0.98, y: 0.42, z: -0.78 },
  { id: "btn", kind: "hellbutton", x: 1.26, y: 0.42, z: -0.88 },
  { id: "cas", kind: "casserole", x: -1.60, y: 0, z: -1.00 },
  { id: "t100", kind: "stoneblock", x: 0.10, y: -0.22, z: -0.25, w: 2.4, h: 0.22, d: 0.5 },
  { id: "t99", kind: "stoneblock", x: 0.10, y: -0.44, z: 0.25, w: 2.4, h: 0.22, d: 0.5 },
];
const set = (t, id, s) => c.prop(t, id, s, 0);
// seeds at 0: on / alarm / crack / open / lid are known keys; type, row, press need a dur-0 seed to tween
set(0, "scr", { on: 1, type: 1, alarm: 0, text: T6 }); set(0, "tab", { row: 6 }); set(0, "btn", { press: 0 }); set(0, "cas", { lid: 0 });
set(0, "trap", { crack: 0, open: 0 });
const B = (i) => +(i * 1.1).toFixed(2);   // beat start
set(B(1), "scr", { type: 0.5, text: T1 });
set(B(2), "scr", { type: 1, text: T6, alarm: 1 });
set(B(3), "scr", { on: 0, alarm: 0 });
set(B(4), "scr", { on: 1 });
[0.25, 0.5, 0.85, 1].forEach((k, i) => set(B(5 + i), "trap", { crack: k }));
set(B(9), "trap", { crack: 1, open: 1 });
set(B(11), "trap", { crack: 0, open: 0 });
set(B(14), "btn", { press: 1 }); set(B(16), "cas", { lid: 1 });
const beats = [
  ["bar6", 0, CAM.bar], ["bar1", 1, CAM.bar], ["wideAlarm", 2, CAM.wide], ["wideOff", 3, CAM.wide],
  ["crack0", 4, CAM.gate], ["crack25", 5, CAM.gate], ["crack50", 6, CAM.gate], ["crack85", 7, CAM.gate], ["crack100", 8, CAM.gate], ["open1", 9, CAM.gate], ["openHole", 10, CAM.hole],
  ["tab6", 11, CAM.tab], ["tabTop", 12, CAM.tabTop], ["btn0", 13, CAM.btn], ["btn1", 14, CAM.btn], ["cas0", 15, CAM.cas], ["cas1", 16, CAM.cas], ["casTop", 17, CAM.casTop],
].map(([n, i, k]) => [n, B(i), k]);
const end = B(18);
const sb = {
  id: "search-bench", title: "Heaven search: new props bench", idea: "Engine look bench for searchscreen, gatetrap, searchtablet, casserole, hellbutton, not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#9fd0f0", floor: "none", para: 0, bloom: "emissive", lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats(beats, end),
  notes: "Generated by storyboards/series/potato-desk/14-heaven-search/bench/make-search-bench.mjs (engine bench, no cast).",
};
write(import.meta.url, sb);
console.log("stills at: " + beats.map(([, t]) => (t + 0.4).toFixed(1)).join(","));
