// COUNTRY VS COUNTRY 02 "Waiting at a red light: Germany vs America" (Jonny 27 Nov 2026: "lets do a traffic light germany vs usa
// video"; hook H1 + ending E1 picked 21:46 Berlin; panel sheet approved with "go" 22:18).
// Panel sheet: traffic-sheet-1.png beside this file. Design (sizes, marks, cameras): DESIGN.md (Fable). Lines: lines.mjs (x1.15).
// "You" situation: nobody says the hero's name. English only, no lettering in the picture (subtitles stay).
//   node storyboards/series/country-vs-country/02-traffic-light/make-traffic.mjs -> traffic.json
//
// Hook pattern (Jonny 25 Nov): power word + the rule as a command ("DON'T. You. DARE.") -> the short question ("Who's even
// WATCHING?!") -> the rule ("Red means STAND. Forever.") -> both streets escalate -> the answer: EVERYONE was watching.
// Chain: your bus waits across the road and leaves in one minute, so you want to cross; the man is red, so a retiree in a
// window forbids it, so you look for the reason (no cars, no children), so a kid appears and waits too; the clock runs, so
// you lean, so binoculars glint across the street (tease 1); so you slide a toe off the kerb, so every curtain twitches
// (tease 2) and the fine comes; so you wait; so the light turns green just as the bus leaves without you, so every window
// opens and the whole street slow-claps: "Good." Cut. America in between: you press the button, nothing; cars turn right
// on red past you, a jaywalker strolls across eating a burger, the button only says "Wait.", so you just walk and make it.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : t, ...rest);
const F2 = (t) => Math.ceil((Math.round(t * 15) * 2 / 30) * 1000 - 1e-6) / 1000;

// measured spoken lengths (voice probe cvc02-voice-probe.json, 27 Nov 2026), in LINES order (line 9: take 2, re-measure)
const DUR = [1.81, 1.12, 2.91, 1.67, 1.32, 0.90, 2.71, 0.95, 1.21, 1.77, 0.67, 0.84, 1.15, 2.14, 0.84, 0.64, 0.73, 0.98, 0.73,
  1.51, 0.69, 1.91, 0.98, 2.89, 0.74, 0.65];
DUR[9] = 0.69;   // "Morning!" take 2 (preflight 27 Nov)
DUR.push(1.6, 2.25, 1.22, 2.86);   // lines 26-29 (preflight 28 Nov)
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- marks (DESIGN §2-3: x right, z toward us; pavements y 0.10)
const AWAY = -60, PV = 0.10;
const DE = { K: [-9.25, -0.10], S11: [-8.60, -0.10], S12: [-7.36, -0.10], T: [-9.45, 0.72], NP: [-9.15, 1.10], RW: [-14.28, 0.675] };
const US = { HU: [16.78, -0.10], CJ0: [9.2, 1.9], CJ: [12.2, 1.5], CJ1: [17.4, 0.9], W10: [7.10, -0.10], B18a: [7.10, -0.50], B18b: [7.10, -2.15], B18c: [7.90, -2.15] };
const BUSDE = [-4.20, -4.40], BUSUS = [8.60, -4.10];

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: DE.K, y: PV, face: 90, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "spudus", character: "potatobrawl/spud", at: US.HU, y: PV, face: -90, expr: "focused", follow: 0.3, seed: 1.9 },
  { id: "retiree", character: "potatobrawl/retiree", at: DE.RW, y: 1.66, face: 90, expr: "angry", follow: 0.3, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: [-3.78, -2.45], face: 0, expr: "deadpan", follow: 0.2, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: [14.55, 4.0], face: 180, expr: "happy", follow: 0.3, seed: 5.2 },
  { id: "chip", character: "potatobrawl/chip", at: US.CJ0, face: 110, expr: "happy", follow: 0.3, seed: 6.6 },
  { id: "kid", character: "potatobrawl/tot-kid", at: DE.T, y: PV, face: 100, expr: "stern", follow: 0.1, seed: 8.1 },
  { id: "button", character: "potatobrawl/spud", at: [30, 30], face: 0, expr: "kind" },   // the push button's voice: parked off set, never seen
];

// ---------------------------------------------------------------- props (DESIGN §2-8)
const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const FLOORY = (f) => r3(1.45 + 1.15 * (f - 1)), COLZ = (col) => r3(7.425 - 1.35 * col);
const CROWD = [   // DESIGN §5: [floor, column, look]
  [1, 4, { hair: "bun", glasses: 1, color: "#b98aa0", h: 0.88 }], [1, 6, { hat: 3, capColor: "#5f6b78", glasses: 1, color: "#7f8f6a", h: 0.92 }],
  [1, 7, { hat: 3, capColor: "#75695a", color: "#9aa7b5", h: 0.90 }], [2, 4, { hat: 3, capColor: "#4f5a52", color: "#c9a66b", h: 0.92 }],
  [2, 5, { hair: "bun", glasses: 1, color: "#8c6f8a", h: 0.86 }], [2, 6, { hat: 3, capColor: "#6b6257", glasses: 1, color: "#d6c39c", h: 0.90 }],
  [2, 7, { hair: "tufts", glasses: 1, color: "#7a8fa0", h: 0.88 }], [3, 4, { hair: "bun", color: "#a8504a", h: 0.86 }],
  [3, 5, { hat: 3, capColor: "#5a4030", glasses: 1, color: "#8fa08a", h: 0.92 }], [3, 6, { hat: 3, capColor: "#75695a", color: "#b9b4aa", h: 0.90 }],
  [3, 7, { hair: "bun", glasses: 1, color: "#c8a0a8", h: 0.88 }],
];
const props = [
  { id: "sky", staged: "the morning sky", kind: "shsky", ...at3(0, 0, 0), time: "a" },
  // German street
  { id: "flatsL", staged: "the retiree's block across the road", kind: "altbau", ...at3(-14.0, 0, 0), rot: 90, look: "rose", d: 1.2, watch: [-9.25, 0.77, -0.10],
    solo: "1-5", soloOpen: 0.6, soloBlow: 0.6, part: 0, peek: 0, open: 0, from: 5, skip: ["1-5", "1-6"] },
  { id: "flatsR", staged: "the far block behind you", kind: "altbau", ...at3(-0.6, 0, 0), rot: -90, look: "butter", d: 0.6, back: "none", solo: "1-4", soloPart: 0, part: 0, peek: 0, open: 0 },
  { id: "forecourt", staged: "the forecourt pavement", kind: "flagway", ...at3(-11.5, 0, 0), w: 22, d: 5.0, h: 0.10, rot: 90 },
  { id: "kerbK", staged: "the kerb you wait on", kind: "kerb", ...at3(-9.0, 0, 0), x0: -11, x1: 11, h: 0.10, seed: 3, rot: 90 },
  { id: "roadde", staged: "the narrow cobbled road", kind: "street", ...at3(-7.7, 0, 0), w: 2.6, d: 22, slope: 0, rot: 90 },
  { id: "island", staged: "the bus island", kind: "flagway", ...at3(-5.8, 0, 0), w: 22, d: 1.2, h: 0.10, rot: 90 },
  { id: "buslane", staged: "the bus lane", kind: "street", ...at3(-4.1, 0, 0), w: 2.2, d: 22, slope: 0, rot: 90 },
  { id: "farpave", staged: "the far pavement", kind: "flagway", ...at3(-1.8, 0, 0), w: 22, d: 2.4, h: 0.10, rot: 90 },
  { id: "barsde", staged: "white bars across the road", kind: "crossbars", ...at3(-8.83, 0.004, -0.10), n: 4, w: 0.34, len: 2.0, pitch: 0.65, axis: "x" },
  { id: "pedde", staged: "the pedestrian light at the kerb", kind: "pedlight", ...at3(DE.NP[0], PV, DE.NP[1]), face: 90, go: 0 },
  { id: "busde", staged: "your bus waits at the island", kind: "citybus", ...at3(BUSDE[0], 0, BUSDE[1]), look: "de", open: 1, len: 0, blink: 0 },
  { id: "shelter", staged: "on the island", kind: "busshelter", ...at3(-5.80, PV, -4.70), w: 1.8, d: 0.8, h: 1.9, lit: 0, rot: 90 },
  { id: "lamp1", staged: "on the forecourt", kind: "streetlamp", ...at3(-10.2, PV, 3.6), h: 2.6, lit: 0 },
  { id: "lamp2", staged: "on the forecourt", kind: "streetlamp", ...at3(-10.2, PV, -4.4), h: 2.6, lit: 0 },
  { id: "tree1", staged: "on the far pavement", kind: "tree", ...at3(-1.8, PV, 6.2), scale: 1.3 },
  { id: "tree2", staged: "on the far pavement", kind: "tree", ...at3(-1.8, PV, -6.6), scale: 1.3 },
  { id: "flagde", staged: "hangs from the balcony", kind: "miniflag", flag: "de", ...at3(-13.45, 2.05, -0.675), scale: 2.7, tip: 35, rot: 90 },
  { id: "w1box", staged: "the retiree's flower box", kind: "flowerbox", ...at3(-13.92, 1.73, 0.675), w: 0.90, rot: 90, flower: "#d8352b" },
  { id: "watcher", staged: "behind the lace across the street", kind: "streetpotato", ...at3(-0.22, 1.45, 2.025), rot: -90, h: 0.90, hat: 3, capColor: "#4f5a52",
    dress: "cardigan", color: "#6f6457", raise: 1, clapHz: 0, feet: false, skin: "#f9b75c", brow: "#b9b4aa" },
  { id: "binos", staged: "held up by the watcher", kind: "binoculars", ...at3(-0.40, 1.99, 2.025), rot: -90, glint: 0 },
  ...CROWD.map(([f, col, look], i) => ({ id: `old${i}`, staged: "an old neighbour in a window (hidden until the payoff)", kind: "streetpotato",
    ...at3(f === 1 && col === 6 ? -13.75 : -14.22, AWAY, COLZ(col)), rot: 90, dress: "cardigan", skin: "#f9b75c", brow: "#b9b4aa", angry: 0, clapHz: 0, raise: 0, lean: 0, feet: false, ...look })),
  // American street
  { id: "usroad", staged: "the wide road, plaza and pavements", kind: "usroad", ...at3(0, 0, 0) },
  { id: "barsus", staged: "white bars across the wide road", kind: "crossbars", ...at3(7.81, 0.004, -0.10), n: 10, w: 0.42, len: 2.0, pitch: 0.84, axis: "x" },
  { id: "pole", staged: "the button pole at the kerb", kind: "uspedpole", ...at3(16.14, PV, -0.10), face: 135, hand: 1, press: 0, talk: 0 },
  { id: "span", staged: "the span wire over the road", kind: "spanwire", ...at3(0, 0, 2.1), sag: 0.22 },
  ...[[12.6, 4.48], [11.0, 4.44], [9.4, 4.48]].map(([x, y], i) => ({ id: `sig${i}`, staged: "hangs on the span wire", kind: "trafficlight", ...at3(x, y, 2.1), hang: true, housing: "#e8b923", scale: 0.75, go: 1, rot: 135 })),
  { id: "busus", staged: "the other bus waits at the far pavement", kind: "citybus", ...at3(BUSUS[0], 0, BUSUS[1]), look: "us", open: 1, len: 0 },
  { id: "busdriver", staged: "drives the American bus", kind: "streetpotato", ...at3(9.02, 0.66, -2.15), h: 0.9, coat: "#2b3f8a", rot: 0 },
  { id: "stopsign", staged: "on the far pavement", kind: "busstopsign", ...at3(7.30, PV, 3.4), rot: 90 },
  { id: "flagus", staged: "on its tall pole by the road", kind: "miniflag", flag: "us", ...at3(7.25, PV, 5.2), scale: 4, poleH: 5.0, rot: 90 },
  { id: "cardW", staged: "the diner and gas station far behind", kind: "usbackdrop", ...at3(1.2, 0, 1), view: "w" },
  { id: "cardN", staged: "the road running on", kind: "usbackdrop", ...at3(13, 0, 26), view: "n" },
  { id: "cardE", staged: "the store row behind you", kind: "usbackdrop", ...at3(23, 0, 1), view: "e" },
  { id: "pickup", staged: "Mash's truck turns right on red", kind: "pickup", ...at3(14.95, 0, 4.0), rot: 180, len: 0, bend: 15, bump: 0 },
  { id: "q1", staged: "a car waiting", kind: "citycar", ...at3(12.6, AWAY, 7.4), rot: 180, scale: 0.8, color: "#9aa3a8" },
  { id: "q2", staged: "a car driving past", kind: "citycar", ...at3(14.95, 0, 14), rot: 180, scale: 0.8, color: "#3f8fd0" },
  { id: "q3", staged: "a car driving past", kind: "citycar", ...at3(14.95, 0, 14), rot: 180, scale: 0.8, color: "#e6dcc8" },
  { id: "ustree1", staged: "by the apron", kind: "tree", ...at3(4.2, 0, -6.0), scale: 1.4 },
  { id: "ustree2", staged: "by the apron", kind: "tree", ...at3(3.6, 0, 12.5), scale: 1.4 },
  { id: "uslamp1", staged: "on the plaza", kind: "streetlamp", ...at3(17.0, PV, 4.6), h: 3.4, lit: 0 },
  { id: "uslamp2", staged: "on the plaza", kind: "streetlamp", ...at3(20.5, PV, -6.0), h: 3.4, lit: 0 },
  { id: "cone", staged: "on the plaza", kind: "trafficcone", ...at3(18.9, PV, 2.2) },
  // worn
  { id: "cap", staged: "worn", kind: "tweedcap", wear: "retiree", color: "#75695a", fit: { H: 0.69, W: 0.74, D: 0.68, taper: 0.02, legH: 0.14 } },
  { id: "burger", staged: "worn: in Chip's left hand", kind: "wrapburger", wear: "chip", x: 0.20, y: 0.30, z: 0.26, wrap: 0.35, scale: 0.75 },
];

// ---------------------------------------------------------------- helpers
const SUB = 470;
const CAPTEXT = { 0: "*DON'T.* You. *DARE.*", 1: "Who's even *WATCHING?!*", 2: "Red means *STAND.* Forever.", 6: "Think. Of. *The children.*",
  14: "I *SEE* you.", 16: "*Wait.*", 18: "*Wait.*", 19: "*Five.* Euros.", 24: "*Too late.*", 25: "*Good.*" };
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  if (who !== "button") A(r3(T[i] - 0.05), who, "expr", { set: { open: 0.1 }, dur: 0.05 });   // preflight: an open mouth can't talk
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2, set) => A(t, who, "expr", { expr: e, dur, ...(set && { set }) });
const place = (t, who, to, yaw, y = 0) => {
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const P = (t, id, set, dur = 0, ease = "linear") => c.prop(t, id, set, dur, ease);
const press = (t, side = "R") => {   // a fist on the button: the dome sinks with it
  arm(t, "spudus", side, { o: [0.05, 0.55, 0.48] }, 0.08, "out");   // the button: 0.56 in front, 0.62 up grip(t, "spudus", side, "fist", 0.05);
  P(r3(t + 0.08), "pole", { press: 1 }, 0.04); P(r3(t + 0.16), "pole", { press: 0 }, 0.06);
  sfx(r3(t + 0.08), "click", { gain: 0.35 });
  arm(r3(t + 0.12), "spudus", side, { o: [0.20, 0.45, 0.30] }, 0.08, "in");
};
const tapWatch = (t, n = 2) => { for (let k = 0; k < n; k++) { arm(r3(t + k * 0.33), "wedge", "R", { o: [0.05, 0.52, 0.32] }, 0.15, "out"); arm(r3(t + k * 0.33 + 0.16), "wedge", "R", { o: [0.10, 0.58, 0.34] }, 0.15, "in"); } arm(r3(t + n * 0.33 + 0.1), "wedge", "R", WHEEL, 0.25); };
const WHEEL = { o: [-0.273, 0.322, 0.453] };

// ---------------------------------------------------------------- cameras (DESIGN §0): every shot pushes in, linear
const CAM = {
  1: { pos: [-2.2, 0.60, 0.10], look: [-9.25, 1.33, 0.10], fov: 34, push: [-2.5, 0.60, 0.10] },
  2: { pos: [-11.0, 0.70, -0.5], look: [-13.9, 2.05, 0.675], fov: 34, push: [-11.15, 0.70, -0.45] },
  3: { pos: [19.8, 0.95, -2.8], look: [12.5, 1.51, 1.4], fov: 32, push: [19.5, 0.95, -2.65] },
  4: { pos: [-3.6, 0.60, 0.25], look: [-9.25, 1.26, 0.25], fov: 34, push: [-3.9, 0.60, 0.25] },
  5: { pos: [-5.9, 1.30, 1.6], look: [-3.78, 1.38, -2.15], fov: 34, push: [-5.75, 1.30, 1.35] },
  6: { pos: [19.8, 0.95, -2.8], look: [12.3, 1.45, 1.2], fov: 32, push: [19.5, 0.95, -2.65] },
  7: { pos: [-6.6, 0.95, 2.6], look: [-0.6, 2.08, 2.025], fov: 28, push: [-6.2, 0.95, 2.55] },
  8: { pos: [17.5, 0.72, -3.6], look: [16.5, 0.89, -0.10], fov: 30, push: [17.45, 0.72, -3.3] },
  9: { pos: [-1.0, 0.25, -0.10], look: [-9.25, 2.66, -0.10], fov: 38, push: [-1.3, 0.25, -0.10] },
  10: { pos: [10.6, 1.05, -10.5], look: [10.6, 0.92, 0], fov: 44, push: [10.6, 1.05, -9.9] },
  11: { pos: [-3.2, 0.60, 0.28], look: [-9.25, 1.31, 0.28], fov: 34, push: [-3.5, 0.60, 0.28] },
  12: { pos: [-1.0, 0.25, -0.10], look: [-7.36, 2.13, -0.10], fov: 38, push: [-1.0, 0.32, -0.10] },
  13: { pos: [-5.2, 0.72, 1.2], look: [-9.25, 1.00, -0.10], fov: 26, push: [-4.95, 0.72, 1.12] },
  14: { pos: [-8.9, 1.55, -1.3], look: [-13.9, 2.07, 0.675], fov: 24, push: [-9.2, 1.55, -1.18] },
  15: { pos: [14.0, 0.72, -3.4], look: [16.78, 1.00, -0.10], fov: 26, push: [14.2, 0.72, -3.15] },
  16: { pos: [-13.0, 1.05, 0.6], look: [-5.31, 1.46, -1.61], fov: 34, push: [-12.7, 1.05, 0.5] },
  17: { pos: [15.6, 0.60, -1.9], look: [12.2, 0.72, 1.5], fov: 26, push: [15.35, 0.60, -1.65] },
  18: { pos: [5.9, 1.00, -5.4], look: [7.1, 1.00, -1.2], fov: 32, push: [5.95, 1.00, -5.1] },
  19: { pos: [11.2, 1.25, -2.6], look: [12.45, 1.25, 2.4], fov: 30, push: [11.3, 1.25, -2.3] },   // T2: at y 1.0 only his forehead showed over the hood,
};
const US_CAMS = new Set([3, 6, 8, 10, 15, 17, 18, 19]);
const GRADE = { de: { s: 1.00, w: -0.15, c: 1.04 }, us: { s: 1.16, w: 0.35, c: 1.00 } };
const shots = [], grade = [];
const shot = (name, t, k, kind) => {
  const at = F2(t), { push, ...cam } = CAM[k];
  shots.push([name, at, { ...cam, push }, kind].filter((v) => v !== undefined)); CUTS.add(at);
  grade.push([at, GRADE[US_CAMS.has(k) ? "us" : "de"]]);
  return at;
};

// ---------------------------------------------------------------- frame 0
A(0, "kid", "hide"); A(0, "wedge", "noblink"); A(0, "kid", "noblink"); A(0, "button", "noblink"); A(0, "chip", "noblink");
A(0, "wedge", "ride", { prop: "busde", off: [0.42, 0.54, 1.95], sit: true, dur: 0.01 });
A(0, "mash", "ride", { prop: "pickup", off: [0.40, 0.30, 0.20], sit: true, dur: 0.01 });
A(0, "wedge", "face", { lid: 0, dur: 0.01 });
arm(0, "wedge", "both", { o: [-0.273, 0.322, 0.453] }, 0.01); grip(0, "wedge", "both", "hold", 0.01);   // hands on the wheel (T2 header)
arm(0, "mash", "both", { o: [0.18, 0.50, 0.40] }, 0.01); grip(0, "mash", "both", "hold", 0.01);
A(0, "retiree", "pitch", { to: 22, dur: 0.01 });   // leaning out over the sill
for (const id of ["flatsL", "flatsR"]) P(0, id, { part: 0, peek: 0, open: 0 });
P(0, "flatsL", { soloOpen: 0.6, soloBlow: 0.6 }); P(0.03, "flatsL", { soloOpen: 1 }, 0.13, "out");
P(0, "flatsR", { soloPart: 0 }); P(0, "binos", { glint: 0 }); P(0, "pedde", { go: 0 }); P(0, "pole", { press: 0, talk: 0, hand: 1 });
P(0, "busde", { open: 1, len: 0, blink: 0 }); P(0, "busus", { open: 1 }); P(0, "pickup", { len: 0, bend: 15, bump: 0 });
for (let i = 0; i < CROWD.length; i++) P(0, `old${i}`, { lean: 0, clapHz: 0 });
expr(0, "spud", "shocked", 0.01, { open: 0.1 }); look(0, "spud", [-0.3, 0.5], 0.01);
A(0, "spud", "lean", { to: -6, dur: 0.01 });   // caught mid-step, one foot off the stone (draft: a lean, no leg key)
expr(0, "retiree", "angry", 0.01, { open: 0.2 }); look(0, "retiree", [0.3, -0.6], 0.01);
arm(0, "retiree", "R", "point", 0.01); grip(0, "retiree", "R", "point", 0.01);
arm(0, "spudus", "R", { o: [0.20, 0.45, 0.30] }, 0.01);

// ================================================================ 1 THE HOOK (01, 13, 02)
let t;
const S1 = shot("de-wide", 0, 1, "hook");
sfx(0.0, "slam", { gain: 0.5 });   // the window bangs open
// re-hook (Jonny 27 Nov, "hookloops and rehooks"): a flash of the ending in the hook shot, every lace on the block twitches once
P(2.2, "flatsL", { part: 0.25 }, 0.1, "out"); P(2.55, "flatsL", { part: 0 }, 0.15, "in"); sfx(2.2, "leafrustle", { gain: 0.25 });
t = say(0, 0.12);   // DON'T. You. DARE.
see(0, t, ["spud.face", "retiree.face", "pedde"], "frame 0: you mid-step on an empty street, the red man, a retiree bangs his window open");
const S2 = shot("hero-de", r3(t + 0.04), 13);
A(S2, "spud", "lean", { to: 0, dur: 0.2 });
look(S2, "spud", [-0.6, 0.2], 0.15); look(r3(S2 + 0.5), "spud", [0.6, 0.2], 0.2);
t = say(1, r3(S2 + 0.08));   // Who's even WATCHING?!
see(S2, t, ["spud.face"], "the question: who is watching, on a street with nobody in it");
const S3 = shot("window-low", r3(t + 0.06), 2);
look(S3, "retiree", [0.2, -0.5], 0.01);
t = say(2, r3(S3 + 0.08));   // Red means STAND. Forever.
see(S3, t, ["retiree.face"], "the rule, from the window");
const S4 = shot("bus-across", r3(t + 0.06), 16);
const S5 = shot("wedge", r3(S4 + 0.9), 5);
tapWatch(r3(S5 + 0.15));
t = say(3, r3(S5 + 0.1));   // Bus leaves in one minute.
t = say(26, r3(t + 0.25));   // This bus is NEVER late.
see(S4, t, ["wedge.face", "busde"], "the stake: your bus waits across the road, one minute");

// ================================================================ 2 AMERICA: the button and right on red (03)
const S6 = shot("us-button", r3(t + 0.08), 3);
press(r3(S6 + 0.1)); press(r3(S6 + 0.5));
t = say(4, r3(S6 + 0.15));   // Come on... come on.
const PU = r3(t - 0.6);   // the pickup rolls through the frame, 1.8 s
P(PU, "pickup", { z: -7, len: 11, bend: 0 }, 7.9, "linear");
sfx(PU, "tyres", { gain: 0.35 });
arm(r3(PU + 0.4), "mash", "R", "wave", 0.2);
t = say(5, r3(PU + 0.7));   // Right on red, hon!
A(r3(PU + 0.6), "spudus", "lean", { to: 8, dur: 0.15 }); A(r3(PU + 1.4), "spudus", "lean", { to: 0, dur: 0.3 });
t = r3(Math.max(t, PU + 1.9));
see(S6, t, ["spudus", "pole", "pickup", "mash.face"], "you press, nothing; a pickup turns right on red past your nose");

// ================================================================ 3 THE CHILDREN (14, 13, 04)
const S7 = shot("retiree", r3(t + 0.06), 14);
arm(S7, "retiree", "R", { o: [0.12, 0.70, 0.30] }, 0.01); grip(S7, "retiree", "R", "point", 0.01);
for (let k = 0; k < 3; k++) arm(r3(S7 + 0.4 + k * 0.7), "retiree", "R", { o: [k % 2 ? 0.20 : 0.06, 0.72, 0.30] }, 0.3);   // the wagging finger
t = say(6, r3(S7 + 0.1));   // Think. Of. The children.
see(S7, t, ["retiree.face"], "the lecture: think of the children");
const S8 = shot("hero-arms", r3(t + 0.06), 13);
arm(S8, "spud", "both", "shrug", 0.2); look(S8, "spud", [-0.5, 0.1], 0.1); look(r3(S8 + 0.4), "spud", [0.5, 0.1], 0.15);
t = say(7, r3(S8 + 0.1));   // There ARE no children!
const S8b = shot("always", r3(t + 0.06), 14);
t = say(27, r3(S8b + 0.1));   // There are ALWAYS children.
place(r3(t + 0.04), "kid", DE.T, 100, PV); A(r3(t + 0.04), "kid", "show");
const S9 = shot("kerb-two", r3(t + 0.06), 4);
arm(S9, "spud", "both", "rest", 0.3); look(S9, "spud", [-0.6, -0.7], 0.2); expr(S9, "spud", "shocked", 0.15);
look(S9, "kid", [0.6, 0.6], 0.01); A(S9, "kid", "face", { lid: 0.25, dur: 0.01 });
t = say(8, r3(S9 + 0.25));   // ...Where did YOU come from?
t = r3(t + 0.35);
see(S9, t, ["spud.face", "kid.face", "retiree"], "a tiny kid has appeared beside you, staring, waiting too");

// ================================================================ 4 AMERICA: the jaywalker (06, 15, 17)
const S10 = shot("us-jaywalk", r3(t + 0.04), 6);
A(r3(S10 - 0.5), "chip", "move", { to: US.CJ, dur: 4.3, ease: "linear" });
A(S10, "spudus", "turn", { to: -75, dur: 0.2 }); arm(r3(S10 + 0.6), "spudus", "R", { o: [0.10, 0.80, 0.40] }, 0.25);
arm(S10, "chip", "L", { o: [0.20, 0.40, 0.26] }, 0.01); grip(S10, "chip", "L", "hold", 0.01);
arm(r3(S10 + 0.3), "chip", "R", "wave", 0.25);
t = say(9, r3(S10 + 0.5));   // Morning!
see(S10, t, ["chip.face", "burger", "spudus"], "a jaywalker strolls across mid-road eating a burger");
const S11 = shot("hero-us", r3(t + 0.05), 15);
A(S11, "spudus", "turn", { to: -150, dur: 0.01 }); expr(S11, "spudus", "shocked", 0.1);
t = say(10, r3(S11 + 0.1));   // It's RED!
const S12 = shot("chip", r3(t + 0.06), 17);
arm(S12, "chip", "R", "shrug", 0.2);
t = say(11, r3(S12 + 0.1));   // It's a suggestion.
A(r3(t + 0.1), "chip", "move", { to: US.CJ1, dur: 6.4, ease: "linear" });
t = say(28, r3(t + 0.35));   // Nobody walks here, man.
t = r3(t + 0.25);
see(S11, t, ["chip.face", "spudus.face"], "red is a suggestion here");

// ================================================================ 5 THIRTY SECONDS + BINOCULARS (05, 13, 07)
const S13 = shot("wedge-30", r3(t + 0.04), 5);
tapWatch(r3(S13 + 0.1));
t = say(12, r3(S13 + 0.12));   // Thirty seconds.
const S14 = shot("lean", r3(t + 0.08), 13);
A(S14, "spud", "pitch", { to: 14, dur: 0.6 }); look(S14, "spud", [-0.7, 0.0], 0.3);
t = say(13, r3(S14 + 0.3));   // Okay. Nobody's looking...
const S15 = shot("binoculars", r3(t + 0.04), 7);
P(S15, "flatsR", { soloPart: 1 }, 0.15, "out");
t = say(14, r3(S15 + 0.3));   // I SEE you.
P(r3(T[14] + 0.15), "binos", { glint: 1 }, 0.13, "out"); P(r3(T[14] + 0.28), "binos", { glint: 0 }, 0.13, "in");
t = r3(t + 0.3);
see(S15, t, ["watcher", "binos"], "tease 1: binoculars glint behind the lace across the street");

// ================================================================ 6 AMERICA: WAIT. (08, 15)
const S16 = shot("us-fists", r3(t + 0.04), 8);
A(S16, "spudus", "turn", { to: -110, dur: 0.01 }); expr(S16, "spudus", "angry", 0.01);
for (let k = 0; k < 6; k++) press(r3(S16 + 0.05 + k * 0.2), k % 2 ? "L" : "R");
t = say(15, r3(S16 + 0.1));   // Come ON!
const W1 = r3(S16 + 1.35);
P(W1, "pole", { talk: 1 }, 0.03); t = say(16, W1); P(t, "pole", { talk: 0 }, 0.05);   // Wait.
see(S16, t, ["spudus.face", "pole"], "you hammer the button; it says: Wait.");
const S17 = shot("hero-us-2", r3(t + 0.08), 15);
A(S17, "spudus", "turn", { to: -150, dur: 0.01 });
t = say(17, r3(S17 + 0.08));   // I AM waiting!
const S18 = shot("us-fists-2", r3(t + 0.06), 8);
A(S18, "spudus", "turn", { to: -110, dur: 0.01 }); expr(S18, "spudus", "deadpan", 0.01);
P(r3(S18 + 0.2), "pole", { talk: 1 }, 0.03); t = say(18, r3(S18 + 0.2)); P(t, "pole", { talk: 0 }, 0.05);   // Wait.
t = r3(t + 0.3);
see(S17, t, ["spudus.face", "pole"], "the button does nothing but say Wait.");

// ================================================================ 7 FIVE EUROS (09, 14)
const S19 = shot("de-peak", r3(t + 0.04), 9);
A(S19, "spud", "move", { to: [-9.20, -0.10], dur: 0.25, y: PV });   // the toe slides past the kerb edge
P(r3(S19 + 0.15), "flatsL", { part: 1 }, 0.13, "out"); P(r3(S19 + 0.3), "flatsL", { peek: 1 }, 0.2, "out");
sfx(r3(S19 + 0.15), "leafrustle", { gain: 0.4 });
const S20 = shot("retiree-five", r3(S19 + 0.9), 14);
arm(S20, "retiree", "R", { o: [0.10, 0.75, 0.30] }, 0.1); grip(S20, "retiree", "R", "open", 0.05);
A(S20, "spud", "move", { to: DE.K, dur: 0.3, y: PV });
t = say(19, r3(S20 + 0.1));   // Five. Euros.
arm(r3(t + 0.1), "retiree", "R", "point", 0.2); grip(r3(t + 0.1), "retiree", "R", "point", 0.1);
t = say(29, r3(t + 0.25));   // And I'm telling your MOTHER.
see(S19, t, ["spud", "flatsL", "retiree.face"], "tease 2: your toe slides off the kerb, every curtain on the street twitches; the fine");

// ================================================================ 8 AMERICA: YOU JUST WALK (19, 10, 18)
P(r3(t - 0.5), "pickup", { x: 12.40, z: 3.25, len: 12, rot: 180, bend: 0 }, 0.01);   // stopped at P2 for you
for (const [id, x, z] of [["q1", 12.6, 7.4], ["q2", 14.95, 2.6], ["q3", 14.95, 6.2]]) P(r3(t - 0.5), id, { x, y: 0, z }, 0.01);
const S21 = shot("mash-stop", r3(t + 0.06), 19);
arm(S21, "mash", "L", "wave", 0.2); arm(r3(S21 + 0.35), "mash", "L", { o: [0.40, 0.55, 0.30] }, 0.25);
t = say(20, r3(S21 + 0.1));   // Go ahead, hon!
const S22 = shot("us-wide", r3(t + 0.08), 10);
place(S22, "spudus", [10.9, -0.10], -135, 0);
A(S22, "spudus", "move", { to: [9.3, -0.10], dur: 1.6, ease: "linear" });
const S23 = shot("board", r3(S22 + 1.6), 18);
place(S23, "spudus", US.B18a, 180, PV);
A(S23, "spudus", "move", { to: US.B18b, dur: 1.4, ease: "linear", y: PV });
A(r3(S23 + 1.0), "spudus", "turn", { to: 135, dur: 0.3 });
t = say(21, r3(S23 + 0.9));   // ...Huh. Made it.
A(r3(t - 0.4), "spudus", "turn", { to: 90, dur: 0.2 });
A(r3(t - 0.2), "spudus", "move", { to: US.B18c, dur: 0.4, y: 0.36 });
t = r3(t + 0.35);
see(S21, t, ["mash.face", "spudus"], "in America you just walk; the cars wait; you make your bus");

// ================================================================ 9 TEN SECONDS + COME ON (05, 13)
const S24 = shot("wedge-10", r3(t + 0.04), 5);
tapWatch(r3(S24 + 0.1));
t = say(22, r3(S24 + 0.1));   // Ten seconds.
const S25 = shot("come-on", r3(t + 0.06), 13);
A(S25, "spud", "pitch", { to: 0, dur: 0.01 }); look(S25, "spud", [-0.2, 0.7], 0.2); expr(S25, "spud", "focused", 0.1);
t = say(23, r3(S25 + 0.15));   // Come on, come on, come on...
see(S24, t, ["wedge.face", "spud.face"], "the clock runs down, you stare at the red man");

// ================================================================ 10 GREEN. TOO LATE. GOOD. (05, 11, 16, 14, 12)
const S26 = shot("too-late", r3(t + 0.04), 5);
t = say(24, r3(S26 + 0.05));   // Too late.
const S27 = shot("green", r3(S26 + 0.75), 11);
P(r3(S27 - 0.02), "pedde", { go: 1 });
expr(r3(S27 + 0.1), "spud", "happy", 0.1);
A(r3(S27 + 0.35), "spud", "move", { to: DE.S11, dur: 0.5, y: 0 });
const S28 = shot("bus-leaves", r3(S27 + 1.0), 16);
P(S28, "busde", { open: 0 }, 0.33, "inOut"); sfx(S28, "hiss", { gain: 0.4 });
P(r3(S28 + 0.4), "busde", { z: 9, len: 13.4, blink: 1 }, 2.4, "in");
arm(r3(S28 + 0.8), "spud", "R", { o: [0.20, 0.70, 0.40] }, 0.3);
expr(r3(S28 + 0.5), "spud", "sad", 0.2);
const S29 = shot("good", r3(S28 + 1.9), 14);
A(S29, "wedge", "hide"); P(r3(S29 - 0.02), "busde", { y: AWAY });   // the bus has left the street
place(S29, "spud", DE.S12, 90, 0); arm(S29, "spud", "both", "rest", 0.01); A(S29, "spud", "droop", { to: 1, dur: 0.01 });
place(S29, "kid", [-7.40, 0.80], 100, 0);
arm(S29, "retiree", "both", { o: [0.08, 0.50, 0.30] }, 0.2);
t = say(25, r3(S29 + 0.1));   // Good.
arm(r3(T[25] + 0.3), "retiree", "both", { o: [0.0, 0.50, 0.32] }, 0.12, "out"); sfx(r3(T[25] + 0.42), "pat", { gain: 0.5 });
const S30 = shot("payoff", r3(t + 0.35), 12);
P(S30, "flatsL", { open: 1 }, 0.67, "linear");
CROWD.forEach(([f, col], i) => {
  const k = Math.abs(col - 5), tOpen = r3(S30 + 0.067 * k);
  P(r3(S30 - 0.02), `old${i}`, { y: FLOORY(f) }, 0);
  P(r3(tOpen + 0.13), `old${i}`, { lean: 1 }, 0.3, "out");
  P(r3(tOpen + 0.13), `old${i}`, { clapHz: 1 }, 0);
});
look(S30, "spud", [0, 0.1], 0.2); look(S30, "kid", [0.3, 0.3], 0.2);
for (let k = 0; k < 2; k++) { arm(r3(S30 + 0.5 + k), "retiree", "both", { o: [0.08, 0.50, 0.30] }, 0.3); arm(r3(S30 + 0.9 + k), "retiree", "both", { o: [0.0, 0.50, 0.32] }, 0.1, "out"); sfx(r3(S30 + 1.0 + k), "pat", { gain: 0.6 }); }
const END = F2(S30 + 2.4);
see(S30, END, ["spud.face", "kid", "flatsL", "retiree"], "the answer: the whole street was watching, and slow-claps you");

// blinks between the lines (no blink on a line; Wedge and the kid never blink)
act.blinksAt(c, "spud", [6.0, 20.0, 34.0]);
act.blinksAt(c, "spudus", [14.0, 30.0]);
act.blinksAt(c, "mash", [12.0]);
act.blinksAt(c, "retiree", [10.0, 26.0]);

// a caption ends where the next one starts
{ const cs = [...c.captions].sort((x, y) => x.from - y.from); for (let k = 0; k + 1 < cs.length; k++) if (cs[k].to > cs[k + 1].from - 0.02) cs[k].to = r3(cs[k + 1].from - 0.02); }
for (let i = 0; i < shots.length; i++) {
  const [, at, cam] = shots[i], len = r3((shots[i + 1]?.[1] ?? END) - at), { push, ...rest } = cam;
  shots[i][2] = { ...rest, to: { pos: push }, dur: len, ease: "linear" };
}
const beats = c.beats(shots, END);

write(import.meta.url, {
  id: "traffic",
  title: "Waiting at a red light: Germany vs America",
  idea: "Country vs Country 02: your bus waits across an empty street. In Germany the man is red, a retiree in a window forbids you to cross, a kid appears and waits too, binoculars glint, every curtain twitches when your toe slips, the light turns green as the bus leaves, and the whole street slow-claps. In America cars turn right on red past you, a jaywalker strolls by with a burger, the button only says Wait, so you just walk and make your bus.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [290, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  animeTiming: true,
  set: { type: "plain", color: "#a9d4f2", floor: "none", light: "sun", para: 0, aperture: 0, shadow: { size: 20 },
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade,
  music: { style: "bounce", lowCut: 150, gain: 0.26 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "street" },
  creative: { length: [55, 90] },
  hook: { show: ["spud", "retiree", "pedde"], hint: 0, what: "an empty street, the red man, you mid-step; a retiree bangs his window open: DON'T. You. DARE." },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "retiree", with: "flatsL", from: 0, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "he leans out of his own open window over the sill (DESIGN §2 RW); rough draft" },
    { who: "retiree", with: "cap", from: 0, to: END, checks: ["clipping"], reason: "the cap is worn on his head" },
    { who: "wedge", with: "busde", from: 0, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "he sits in the driver's seat inside the bus cab (DESIGN §8); rough draft" },
    { who: "mash", with: "pickup", from: 0, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "he sits in the pickup's cab, an arm out of the open window (DESIGN §8); rough draft" },
    { who: "chip", with: "burger", from: 0, to: END, checks: ["hand-in-prop", "arm-in-prop"], reason: "the burger is worn in his hand (rough draft, no grip polish)" },
    { who: "spudus", with: "pole", from: 0, to: END, checks: ["hand-in-prop", "arm-in-prop"], reason: "his fists press the button (contact by design)" },
    { who: "spudus", from: S16, to: r3(S18 + 1.2), checks: ["face-covered"], reason: "he hammers a button at his own eye height (DESIGN §7: centre 0.62 up); the face shows between the blows (rough draft, judge in the strip)" },
    { who: "spudus", with: "busus", from: S23, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "he steps up into the bus door, a hand on the door frame (4 cm)" },
    { who: "wedge", with: "busde", from: S28, to: END, checks: ["shell"], reason: "the driver rides his own bus as it pulls out; at speed the seat lags the shell a frame (rough draft; the bus is hidden after it leaves cam 16)" },
  ],
  notes: "Generated by storyboards/series/country-vs-country/02-traffic-light/make-traffic.mjs. Rough draft: staging only, no hand polish.",
});
