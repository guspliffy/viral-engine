// WHAT IF YOU COULD READ MINDS? BUT THERE'S A CATCH. (There's a catch, episode 6). v5 (Jonny 12 Nov 2026 14:14 Berlin:
// "create the video" on the 15-panel Hold'em sheet board.png, after his notes on rough draft 1: 30-35 s, a clearer and
// more extreme casino, cards never shown to the camera in a hand (an over-the-shoulder close-up instead), gloves ON the
// felt, "You would hear everyone's mind." after the catch, a street scene, "It would never be quiet again." in bed;
// Texas Hold'em only, Spud's hand a low pair 3-3, Wedge's bluff 8-3). Opener type A: the all-in is running at frame 0.
// Brief + image prompt: /mnt/project-files/video-scripts/2026-11-08-what-if/06-read-minds-V5-HOLDEM-15-PANEL-IMAGE-PROMPT.md
// Panels: board.png + PANELS.md here. Places, cameras and reasons: NOTES.md here.
//   node storyboards/series/what-if/06-read-minds/make-read-minds.mjs            -> read-minds.json
//   ... --no-vo -> read-minds-no-vo.json: without the commentator (staging and drafts, no speech model)
//
// THE BRIEF
//   Joke:        Spud is about to lose everything at poker (a pair of threes against a huge all-in), and suddenly he can
//                read minds: every thought floats over its owner's head as a soap bubble with one small thing inside.
//                Wedge's bubble shows his real cards, 8 and 3: a bluff.
//   Consequence: the catch, shown: it does not switch off and it spreads: every guest, the whole casino, the street, the
//                city. When it matters most (Wedge bets his car keys) Spud cannot find Wedge's one thought among
//                hundreds, guesses, and loses everything: kings full against four aces (two in Wedge's hand, two on the board).
//   Ending:      night, a hotel room high above the city: Spud awake with a pillow pressed on his head while the city's
//                thoughts stream in through the window. It is never quiet again.
// HOLD'EM LOGIC: hand 1 board Ks 9h 5d Jc 2s; Spud 3c 3d (a pair of threes) beats Wedge 8c 3h (king high).
//                hand 2 board Ad Ac Kc 7h 2d; Wedge As Ah (four aces) beats Spud Ks Kh (kings full of aces).
// CARDS: a held hand faces its holder (the camera sees backs) except in the over-the-shoulder shot; cards on the felt
//        lie face down until a showdown turns them face up.
//
// WORLD (x right, z toward camera A; yaw 0 faces +z, 90 faces +x). CASINO: the poker table's middle at the origin, the
// hall (casinohall) round it; the four sit in an arc on the far side, a crowd of potato guests stands round the table.
// CITY: 1000 m along x. HOTEL: 2000 m along x. STREET: 3000 m along x.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "casino,mind,city,street").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...(final.wear && { wear: final.wear }), ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };   // params only the real pack knows

// ---------------------------------------------------------------- the beats (video s = story s: no ramps)
// 01 all-in | 02 the stare | 03 his cards (over the shoulder) | 04 the eyes | 05 Wedge's thought | 06 the call |
// 07 every head | 08 the mountain | 09 the catch | 10 the flood | 11 the keys | 12 four aces | 13 the street |
// 14 the city | 15 the hotel room
const STARE = 2.0, OTS = 3.5, READ = 5.0, POV = 6.5, CALL = 8.0, HEADS = 10.0, MOUNT = 12.0, CATCH = 14.0;
const FLOOD = 16.5, KEYS = 18.5, SHOW = 21.0, SLUMP = 22.7, STREET = 23.5, CITY = 26.5, NIGHT = 29.0, END = 32.6;
const DOWN = -60;   // parked under the floor
const CX = 1000, HX = 2000, SX = 3000;   // the city's, the hotel's and the street's x offsets
const BED = [-0.2, -1.25];    // the hotel bed's sitter spot in the room (props-nightcity.js HOTEL.bed)

const rad = (d) => (d * Math.PI) / 180;
const dirOf = (yaw) => [Math.sin(rad(yaw)), Math.cos(rad(yaw))], leftOf = (yaw) => [Math.cos(rad(yaw)), -Math.sin(rad(yaw))];
const P2 = ([x, z], yaw, f, s = 0) => { const d = dirOf(yaw), l = leftOf(yaw); return [r3(x + f * d[0] + s * l[0]), r3(z + f * d[1] + s * l[1])]; };
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });

// ---------------------------------------------------------------- places (the casino)
// A vertical frame is narrow, so the four sit in an arc on the far side of the table facing us: Wedge and Spud side by
// side, Chip small at the front left, Mash at the right on his phone. The felt a glove can reach is the band in front of
// each seat (the table is an oval 1.6 x 1.1, its felt inside the rail an oval 1.38 x 0.88).
const TW = 1.6, TD = 1.1, TH = 0.62;
const SEAT = { wdg: [-0.72, -1.01], spud: [0.49, -1.08], chip: [-1.2, 0.3], mash: [1.3, -0.52] };
const YAW = { wdg: 38, spud: -25, chip: 75, mash: -60 };
const CHAIR = { wdg: "chW", spud: "chS", chip: "chC", mash: "chM" };
const POT = [0, -0.1];                           // the pot in the middle of the felt
const HEAP = [-0.4, -0.3];                       // Wedge's own heap at frame 0 (with his gold watch), shoved into the pot
const SHOVE = [0.24, 0.12];
const MOUNT_AT = [0.58, 0.05];                   // Spud's chip mountain, on his left-front (screen right), clear of his face
const LAMP_Y = 2.65;
const KEYS_AT = [-0.3, -0.22];                   // where Wedge slams his car keys
const BOARD_Z = 0.2, BOARD_X = (i) => r3(-0.28 + i * 0.14);
const B1 = ["Ks", "9h", "5d", "Jc", "2s"], B2 = ["Ad", "Ac", "Kc", "7h", "2d"];
const SC = [[0.36, -0.33, 6], [0.48, -0.3, -4]];  // Spud's two cards on the felt in front of him
const WC = [[-0.5, -0.22, 10], [-0.38, -0.2, -2]];   // Wedge's two cards on the felt in front of him
const H = { spud: 0.88, wdg: 0.98, chip: 0.53, mash: 1.24 };
const bubbleOver = (who, up = 0.22, r = 0.2) => ({ x: SEAT[who][0], y: r3(0.42 + H[who] + up + r), z: SEAT[who][1] });
// the crowd packed round the table (panel 01), every one a potato in evening clothes, each turned to the table
const CROWD = [
  [-1.35, -1.9, 0.92, "tux"], [-0.1, -2.0, 0.95, "gown", "#7a1f3d"], [1.05, -1.95, 0.9, "tux"], [1.95, -1.35, 0.88, "gown", "#1f4f7a"],
  [-2.05, -1.15, 0.9, "gown", "#5a2a7a"], [-2.15, -0.05, 0.86, "tux"], [2.2, 0.25, 0.92, "tux"],
  [-1.8, 1.15, 0.9, "gown", "#2a6a4a"], [1.85, 1.2, 0.95, "tux"], [-0.75, -2.25, 0.85, "tux"], [0.5, -2.3, 0.9, "gown", "#8a5a1a"],
].map(([x, z, h, dress, color]) => ({ x, z, h, dress, color, rot: yawTo([x, z], [0, -0.2]) }));
const COBJ = ["coin", "crown", "heart", "shoe", "gift", "cake", "fish", "car", "clock", "burger", "cat"];
// background guests among the slot machines and at the roulette (hall: slots along x -6.5 and +6.5, roulette at [3.2, -8])
const GUESTS = [
  [-5.6, -4.2, 90, "tux"], [-5.6, -7.4, 90, "gown", "#7a1f3d"], [-5.6, -10.2, 90, "tux"],
  [5.6, -5.0, -90, "gown", "#1f4f7a"], [5.6, -9.6, -90, "tux"],
  [1.6, -4.6, -20, "tux"], [-1.0, -4.3, 15, "gown", "#5a2a7a"], [2.4, -6.6, -30, "tux"],
  [-0.2, -6.2, 5, "gown", "#2a6a4a"], [0.6, -8.0, -10, "tux"],
];
const GOBJ = ["shoe", "fish", "clock", "heart", "sandwich", "football", "coin", "crown", "gift", "cat"];

const cast = [
  { id: "wdg", character: "potatobrawl/wedge", at: SEAT.wdg, face: YAW.wdg, expr: "smug", follow: 0.3, seed: 2.1 },
  { id: "spud", character: "potatobrawl/spud", at: SEAT.spud, face: YAW.spud, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: SEAT.chip, face: YAW.chip, expr: "eager", follow: 0.3, seed: 4.4 },
  { id: "mash", character: "potatobrawl/mash", at: SEAT.mash, face: YAW.mash, expr: "deadpan", follow: 0.3, seed: 3.7 },
];

// ---------------------------------------------------------------- props
const NIL = { ...box(0.01, 0.01, 0.01), y: DOWN };
const chip = (id, at, n, color, show = n) => ph("casino", { id, kind: "chipstack", x: at[0], y: TH, z: at[1], n: show, color }, { ...box(0.09, 0.012 * n, 0.09), y: TH });
// a card lying on the felt (tip -90): flip 0 face down, flip 1 face up; scale 0.001 = not dealt yet
const card = (id, cd, x, z, rot, show) => ph("casino", { id, kind: "playcard", card: cd, x, y: r3(TH + 0.002), z, rot, tip: -90, scale: show ? 1 : 0.001 }, { ...box(0.11, 0.004, 0.155), y: DOWN });
const BOARD1 = B1.map((cd, i) => card(`b1${i}`, cd, BOARD_X(i), BOARD_Z, 0, true));
const BOARD2 = B2.map((cd, i) => card(`b2${i}`, cd, BOARD_X(i), BOARD_Z, 0, false));
const S1 = [["sC1", "3c"], ["sC2", "3d"]].map(([id, cd], i) => card(id, cd, SC[i][0], SC[i][1], SC[i][2], false));
const W1 = [["wC1", "8c"], ["wC2", "3h"]].map(([id, cd], i) => card(id, cd, WC[i][0], WC[i][1], WC[i][2], true));
const S2 = [["sK1", "Ks"], ["sK2", "Kh"]].map(([id, cd], i) => card(id, cd, SC[i][0], SC[i][1], SC[i][2], false));
const W2 = [["wA1", "As"], ["wA2", "Ah"]].map(([id, cd], i) => card(id, cd, WC[i][0], WC[i][1], WC[i][2], false));
const ALLCARDS = [...BOARD1, ...BOARD2, ...S1, ...W1, ...S2, ...W2];
// the street's passers-by (panel 13): [x, z from, z to, h, dress, color, object in the bubble]
const WALKERS = [
  [-3.4, -9.0, -2.0, 0.85, "coat", "#7a3b2a", "phone"], [3.5, 1.0, -5.5, 0.9, "hoodie", "#2e6b8a", "burger"],
  [-3.7, -2.5, 3.0, 0.8, "dress", "#8a2a5a", "heart"], [3.2, -12.0, -6.0, 0.95, "suit", "#333a4a", "coin"],
  [-1.3, -14.0, -9.5, 0.82, "coat", "#4a6a2a", "pizza"], [1.4, -4.5, -11.0, 0.9, "hoodie", "#a87a1a", "cat"],
  [-3.2, -16.0, -12.0, 0.88, "suit", "#2a2a2a", "clock"], [3.7, -18.0, -14.5, 0.86, "coat", "#5a3a7a", "gift"],
];
const props = [
  // ---- the casino (T1 props-casino.js)
  ph("casino", { id: "hall", kind: "casinohall", x: 0, y: 0, z: 0, w: 20, d: 24, h: 7.5, dim: 0 }, { ...box(20, 0.02, 24), y: -0.02, z: -6 }),
  ph("casino", { id: "lamp", kind: "pokerlamp", x: 0, y: 0, z: POT[1], dome: LAMP_Y }, { ...box(1.1, 0.4, 1.1), y: LAMP_Y }),
  ph("casino", { id: "table", kind: "pokertable", x: 0, y: 0, z: 0, w: TW, d: TD, h: TH }, box(TW, TH, TD)),
  ...Object.entries(CHAIR).map(([who, id]) => ({ id, kind: "sschair", x: SEAT[who][0], z: SEAT[who][1], rot: YAW[who], tip: 0 })),
  ...GUESTS.map(([x, z, rot, dress, color], i) => ph("casino", { id: `g${i}`, kind: "casinoguest", x, y: 0, z, rot, h: 0.9, dress, ...(color && { color }), sway: 1 }, box(0.7, 0.9, 0.6))),
  ...CROWD.map((g, i) => ph("casino", { id: `cr${i}`, kind: "casinoguest", x: g.x, y: 0, z: g.z, rot: g.rot, h: g.h, dress: g.dress, ...(g.color && { color: g.color }), sway: 1, cheer: 0 }, box(0.6, g.h, 0.5))),
  ph("casino", { id: "pot", kind: "chippile", x: POT[0], y: TH, z: POT[1], r: 0.26, amount: 0.45 }, { ...box(0.5, 0.15, 0.4), y: TH }),
  ph("casino", { id: "heap", kind: "chippile", x: HEAP[0], y: TH, z: HEAP[1], r: 0.15, amount: 1 }, { ...box(0.3, 0.15, 0.3), y: TH }),
  ph("street", { id: "watch", kind: "goldwatch", x: r3(HEAP[0] + 0.12), y: TH, z: r3(HEAP[1] + 0.13), rot: 30 }, { ...box(0.16, 0.02, 0.07), y: TH }),
  chip("sS1", [0.2, -0.36], 3, "#1e4fb5"),
  chip("sS2", [0.12, -0.3], 28, "#c62828", 0), chip("sS3", [0.26, -0.24], 28, "#2e7d32", 0), chip("sS4", [0.4, -0.26], 28, "#222", 0), chip("sS5", [0.2, -0.17], 24, "#1e4fb5", 0),
  ph("casino", { id: "mount", kind: "chipmountain", x: MOUNT_AT[0], y: TH, z: MOUNT_AT[1], w: 0.36, d: 0.3, h: 1.35, grow: 0, staged: "a tower of chips standing on the felt" }, { ...box(0.36, 0.01, 0.3), y: TH }),
  ...ALLCARDS,
  // Spud's two hole cards (3c 3d) held up in his left glove, their faces to HIM: the front cameras see the red backs
  ph("casino", { id: "sFan", kind: "cardfan", cards: ["3c", "3d"], back: true, x: 0, y: 0, z: 0, spread: 0.6, staged: "held up in his glove" }, box(0.15, 0.17, 0.02)),
  // Wedge's car keys (panel 11)
  ph("casino", { id: "keys", kind: "carkeys", x: KEYS_AT[0], y: TH, z: KEYS_AT[1], rot: 30, scale: 0.001 }, { ...box(0.1, 0.02, 0.05), y: DOWN }),
  // Mash's phone (he never looks up)
  { id: "mphone", kind: "phone", x: 0, y: 0, z: 0, scale: 1.6, case: "#3a7bd5" },
  // ---- the power (T2 props-mind.js)
  ph("mind", { id: "glow", kind: "eyeglow", wear: "spud", x: 0, y: 0.61, z: 0.36, gap: 0.2, ew: 0.08, eh: 0.095, on: 0, pulse: 0 }, NIL),
  ph("mind", { id: "bW", kind: "thoughtbubble", staged: "a thought floating over its owner", ...bubbleOver("wdg"), r: 0.2, obj: has("street") ? "cards83" : "cards27", pop: 0, still: true }, NIL),
  ph("mind", { id: "bC", kind: "thoughtbubble", staged: "a thought floating over its owner", ...bubbleOver("chip", 0.18, 0.17), x: -1.0, r: 0.17, obj: "pizza", pop: 0 }, NIL),
  ph("mind", { id: "bM", kind: "thoughtbubble", staged: "a thought floating over its owner", ...bubbleOver("mash", 0.12, 0.17), x: 1.08, r: 0.17, obj: "phone", pop: 0 }, NIL),
  ...GUESTS.map(([x, z], i) => ph("mind", { id: `gb${i}`, kind: "thoughtbubble", staged: "a thought floating over its owner", x, y: 1.8, z, r: 0.4, obj: GOBJ[i], pop: 0, seed: i }, NIL)),
  ...CROWD.map((g, i) => ph("mind", { id: `cb${i}`, kind: "thoughtbubble", staged: "a thought floating over its owner", x: g.x, y: r3(g.h + 0.42), z: g.z, r: 0.22, obj: COBJ[i], pop: 0, seed: 40 + i }, NIL)),
  ph("mind", { id: "fHall", kind: "bubblefield", staged: "thoughts floating in the air", x: 0, y: 1.3, z: -7.5, w: 14, h: 4, d: 11, n: 260, r: [0.12, 0.3], objs: 0.7, seed: 6, fill: 0, rise: 0 }, NIL),
  ph("mind", { id: "fNear", kind: "bubblefield", staged: "thoughts floating in the air", x: 0, y: 1.25, z: -0.8, w: 3.6, h: 1.8, d: 3.2, n: 150, r: [0.08, 0.2], objs: 0.75, seed: 9, fill: 0, rise: 0 }, NIL),
  ph("mind", { id: "fWdg", kind: "bubblefield", staged: "thoughts floating in the air", x: SEAT.wdg[0], y: 1.55, z: SEAT.wdg[1], w: 1.2, h: 1.0, d: 0.9, n: 70, r: [0.06, 0.13], objs: 0.85, seed: 13, fill: 0, rise: 0 }, NIL),
  // ---- the neon street at night (T4 props-neonstreet.js) with its thoughts
  ph("street", { id: "street", kind: "neonstreet", x: SX, y: 0, z: 0, len: 36 }, { ...box(10, 0.02, 36), x: SX, y: -0.02, z: -12 }),
  ...WALKERS.map(([x, z0, , h, dress, color], i) => ph("street", { id: `w${i}`, kind: "streetpotato", x: SX + x, y: 0, z: z0, rot: 0, h, dress, color, walk: 0, hat: i % 3 === 1 ? 1 : 0, bag: i % 4 === 2 ? 1 : 0 }, { ...box(0.5, h, 0.4), x: SX + x, z: z0 })),
  ...WALKERS.map(([x, z0, , h, , , obj], i) => ph("mind", { id: `wb${i}`, kind: "thoughtbubble", staged: "a thought floating over its owner", x: SX + x, y: r3(h + 0.4), z: z0, r: 0.2, obj, pop: 0, seed: 60 + i }, NIL)),
  ph("mind", { id: "fStreetL", kind: "bubblefield", staged: "thoughts floating in the air", x: SX - 4.2, y: 4.5, z: -12, w: 1.2, h: 7, d: 30, n: 120, r: [0.2, 0.45], objs: 0.7, seed: 51, fill: 0, rise: 0, glow: 1 }, NIL),
  ph("mind", { id: "fStreetR", kind: "bubblefield", staged: "thoughts floating in the air", x: SX + 4.2, y: 4.5, z: -12, w: 1.2, h: 7, d: 30, n: 120, r: [0.2, 0.45], objs: 0.7, seed: 53, fill: 0, rise: 0, glow: 1 }, NIL),
  ph("mind", { id: "fStreetU", kind: "bubblefield", staged: "thoughts floating in the air", x: SX, y: 2.6, z: -10, w: 7, h: 2.2, d: 24, n: 90, r: [0.12, 0.3], objs: 0.7, seed: 57, fill: 0, rise: 0, glow: 1 }, NIL),
  // ---- the city at night (T3 props-nightcity.js) with its thoughts
  ph("city", { id: "city", kind: "neoncity", x: CX, y: 0, z: 0, w: 120, d: 120, casino: [0, 0] }, { ...box(30, 14, 20), x: CX }),
  ph("mind", { id: "fCity", kind: "bubblefield", staged: "thoughts floating in the air", x: CX, y: 14, z: -25, w: 110, h: 28, d: 90, n: 600, r: [0.9, 2.4], objs: 0.6, seed: 21, fill: 0, rise: 0, glow: 1 }, NIL),
  // ---- the hotel room (T3) high above the city
  ph("city", { id: "room", kind: "hotelroom", x: HX, y: 0, z: 0, bed: 0 }, { ...box(4, 0.02, 4), x: HX, y: -0.02 }),
  ph("city", { id: "bed", kind: "hotelbed", x: HX + BED[0], y: 0, z: BED[1] }, { ...box(1.5, 0.5, 1.9), x: HX + BED[0], z: r3(BED[1] + 0.33) }),
  ph("city", { id: "sky", kind: "nightskyline", x: HX, y: -1, z: 13, w: 30, h: 14, r: 18 }, NIL),
  ph("city", { id: "pillow", kind: "hotelpillow", x: HX, y: DOWN, z: 0, scale: 1.3 }, { ...box(0.65, 0.15, 0.4), y: DOWN }),
  ph("mind", { id: "fRoom", kind: "bubblefield", staged: "thoughts floating in the air", x: HX + 0.2, y: 1.75, z: -0.9, w: 3.6, h: 1.2, d: 2.6, n: 110, r: [0.07, 0.17], objs: 0.7, seed: 31, fill: 0, rise: 0, glow: 1 }, NIL),
  ph("mind", { id: "fStream", kind: "bubblefield", staged: "thoughts floating in the air", x: HX + 0.5, y: 0.8, z: -5.5, w: 6, h: 2.5, d: 5, n: 160, r: [0.07, 0.16], objs: 0.6, seed: 37, fill: 0, rise: 0, pull: 0, to: [-0.7, 0.7, 4.3], glow: 1 }, NIL),
];

// params props3d.js propState has no default for jump on their first tween: seed them at 0
Pk("mind", 0, "glow", { pulse: 0 }); Pk("casino", 0, "hall", { dim: 0 });
for (const id of ["sS2", "sS3", "sS4", "sS5"]) Pk("casino", 0, id, { n: 0 });
for (const p of ALLCARDS) Pk("casino", 0, p.id, { flip: 1 });            // face up...
for (const id of ["sC1", "sC2", "wC1", "wC2", "sK1", "sK2", "wA1", "wA2"]) Pk("casino", 0, id, { flip: 0 });   // ...except the hole cards, face down
CROWD.forEach((g, i) => Pk("casino", 0, `cr${i}`, { cheer: 0 }));
WALKERS.forEach((w, i) => Pk("street", 0, `w${i}`, { walk: 0 }));

// ---------------------------------------------------------------- everyone seated at frame 0
for (const who of ["wdg", "spud", "chip", "mash"]) A(0, who, "sit", { seat: CHAIR[who], dur: 0.01, hands: "keep" });
// Mash never looks up: his phone in his left glove at chest height, its screen to him
const MPH_AT = (() => { const [x, z] = P2(SEAT.mash, YAW.mash, 0.36, 0.08); return [x, 0.86, z]; })();
const MPHONE = { id: "mphone", kind: "phone", ...grips.placeFor("phone", MPH_AT, 180 + YAW.mash), tip: -35, scale: 1.6, case: "#3a7bd5" };
props[props.findIndex((p) => p.id === "mphone")] = MPHONE;
const mph = grips.phone(c, "mash", MPHONE, { side: "L" });
c.arm(0, "mash", "L", { prop: "mphone", grip: mph.hands.L.grip, palm: true }, 0); A(0, "mash", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "mash", "grab", { prop: "mphone", hand: "L", grip: mph.hands.L.grip, dur: 0, pose: null });
look(0, "mash", [0.1, -0.55], 0.01); c.arm(0, "mash", "R", "lap", 0);
// a glove resting ON the felt (Jonny 12 Nov: never in it): a point above the table top in the table's own frame, palm down
const UP = 0.1;
const felt = (x, z, up = UP) => ({ prop: "table", grip: [r3(x), r3(TH + up), r3(z)], palm: [r3(x), r3(TH - 0.4), r3(z)] });
// Spud's two hole cards held up before his chest in his left glove, faces to him, backs to the front cameras
const SFAN_AT = (() => { const [x, z] = P2(SEAT.spud, YAW.spud, 0.4, 0.3); return [x, 0.72, z]; })();
P(0, "sFan", { x: SFAN_AT[0], y: SFAN_AT[1], z: SFAN_AT[2], rot: YAW.spud, tip: -15 });
c.arm(0, "spud", "L", { prop: "sFan", grip: [0, 0.03, -0.02], palm: true }, 0); A(0, "spud", "grip", { side: "L", shape: "hold", dur: 0 });
c.arm(0, "spud", "R", felt(0.14, -0.38), 0);
c.arm(0, "chip", "L", "lap", 0); c.arm(0, "chip", "R", "lap", 0);
const SUBY = 540;   // speech lettering in the upper third, never over a face (Jonny 12 Nov)
const say = (t, who, line, dur, tone, sub) => c.say(r3(t), who, line, dur, tone, { voice: false, sub, pos: SUBY });

// ================================================================= 01 ALL-IN (0-2.0): Wedge shoves a huge heap and his gold watch into the pot
// frame 0 is mid-shove: both his gloves behind the heap, the heap and the watch already sliding to the pot
const hb = (dx, dz) => felt(HEAP[0] + dx, HEAP[1] + dz);
c.arm(0, "wdg", "R", hb(-0.16, -0.02), 0); c.arm(0, "wdg", "L", hb(0.0, -0.17), 0);
c.arm(0.05, "wdg", "R", hb(-0.16 + SHOVE[0], -0.02 + SHOVE[1]), 0.8, "inOut"); c.arm(0.05, "wdg", "L", hb(SHOVE[0], -0.17 + SHOVE[1]), 0.8, "inOut");
P(0.05, "heap", { x: r3(HEAP[0] + SHOVE[0]), z: r3(HEAP[1] + SHOVE[1]) }, 0.8, "inOut");
Pk("street", 0.05, "watch", { x: r3(HEAP[0] + 0.12 + SHOVE[0]), z: r3(HEAP[1] + 0.13 + SHOVE[1]) }, 0.8, "inOut");
A(0, "wdg", "lean", { to: 6, dur: 0.01 }); A(0.95, "wdg", "lean", { to: 0, dur: 0.5 });
c.arm(1.05, "wdg", "R", "lap", 0.45, "inOut"); c.arm(1.1, "wdg", "L", "lap", 0.45, "inOut");
P(0.9, "heap", { scale: 0.001 }); Pk("casino", 0.86, "pot", { amount: 1 }, 0.14, "out"); P(0.9, "pot", { r: 0.3 });
sfx(0.05, "ai/bowl-scrape", { gain: 0.55, reason: "a heap of chips slid over the felt" }); sfx(0.88, "crumble", { gain: 0.4, reason: "the heap spills into the pot" });
CROWD.forEach((g, i) => Pk("casino", r3(0.3 + (i % 4) * 0.08), `cr${i}`, { cheer: 0.35 }, 0.25, "out"));   // the crowd gasps
CROWD.forEach((g, i) => Pk("casino", r3(1.2 + (i % 3) * 0.1), `cr${i}`, { cheer: 0 }, 0.4, "inOut"));
expr(0, "wdg", "smug", { lid: 0.45, curve: 0.45 }, 0.01); look(0, "wdg", [0.5, 0.0], 0.01);
expr(0, "spud", "shocked", { open: 0.4, eye: 1.2, brow: 0.4 }, 0.01); look(0, "spud", [-0.7, 0.0], 0.01);
A(0.3, "spud", "squash", { amount: 0.05, dur: 0.2 });
c.at(0.4, { fx: "sweat", who: "spud", dur: 1.4 });
look(0, "chip", [0.3, 0.1], 0.01); A(0.2, "chip", "hop", { count: 2, height: 0.05 });
see(0, STARE, ["wdg.face", "spud.face", "pot"], "frame 0: Wedge shoves a huge heap and his gold watch into the pot, the crowd round the table, Spud with three chips left");

// ================================================================= 02 THE STARE (2.0-3.5): he bluffs, Spud gulps
say(STARE + 0.1, "wdg", "trust me.", 0.6, "calm", "Trust me.");
expr(STARE, "wdg", "smug", { lid: 0.55, curve: 0.55, brow: -0.2 });
expr(r3(STARE + 0.6), "spud", "shocked", { open: 0.2, eye: 1.15, brow: 0.6, curve: -0.3 });
A(r3(STARE + 0.85), "spud", "squash", { amount: 0.06, dur: 0.18 }); sfx(r3(STARE + 0.87), "gulp", { gain: 0.6 });
see(STARE, OTS, ["wdg.face", "spud.face"], "Wedge leans in, smug: trust me; Spud gulps, sweating");

// ================================================================= 03 HIS CARDS (3.5-5.0): over his shoulder, a pair of threes
look(OTS, "spud", [0.15, -0.35], 0.25);   // he looks down at his cards
A(r3(OTS + 0.4), "spud", "squash", { amount: 0.04, dur: 0.25 });
see(OTS, READ, ["sFan"], "over Spud's shoulder: his two cards, the 3 of clubs and the 3 of diamonds; Wedge's heap past them");

// ================================================================= 04 THE EYES (5.0-6.5): his eyes glow
look(READ, "spud", [-0.6, 0.15], 0.2);
Pk("mind", r3(READ + 0.25), "glow", { on: 1, pulse: 1 }, 0.3, "out");
sfx(r3(READ + 0.22), "ai/magic-zap", { gain: 0.45, reason: "the power switches on: a soft magic shimmer, no ringing bell" });
expr(r3(READ + 0.2), "spud", "focused", { brow: -0.3, eye: 1.25 });
see(READ, POV, ["spud.face", "glow"], "Spud's eyes light up blue-white");

// ================================================================= 05 WEDGE'S THOUGHT (6.5-8.0): a bubble with his real cards, 8 and 3
Pk("mind", r3(POV - 0.02), "bW", { spin: 70 }); Pk("mind", r3(HEADS - 0.02), "bW", { spin: 15 });   // the cards turned to each camera
Pk("mind", r3(POV + 0.15), "bW", { pop: 1 }, 0.35, "back"); sfx(r3(POV + 0.17), "ringpop", { gain: 0.4, reason: "the thought bubble pops in over Wedge" });
expr(POV, "wdg", "smug", { lid: 0.5, curve: 0.6 });
see(POV, CALL, ["wdg.face", "bW"], "over Wedge's head a bubble: his real cards, the 8 and the 3, a bluff; Wedge still grins");

// ================================================================= 06 THE CALL (8.0-10.0): both hands face up, the pot raked in, the crowd cheers
// off screen (the POV shot): he lays his two cards face down on the felt under his glove...
P(r3(CALL - 0.45), "sFan", { scale: 0.001 }); for (const p of S1) P(r3(CALL - 0.45), p.id, { scale: 1 });
c.arm(r3(CALL - 0.45), "spud", "L", felt(SC[0][0] + 0.06, SC[0][1]), 0.3, "inOut");
// ...and on "Call!" his glove slaps down beside them and turns them face up
say(CALL + 0.05, "spud", "call!", 0.5, "excited", "Call!");
c.arm(r3(CALL + 0.02), "spud", "L", felt(SC[0][0] + 0.06, SC[0][1], 0.17), 0.1, "out"); c.arm(r3(CALL + 0.12), "spud", "L", felt(SC[0][0] + 0.12, SC[0][1] + 0.03), 0.1, "in");
Pk("casino", r3(CALL + 0.2), "sC1", { flip: 1 }, 0.18, "inOut"); Pk("casino", r3(CALL + 0.26), "sC2", { flip: 1 }, 0.18, "inOut");
sfx(r3(CALL + 0.22), "slap", { gain: 0.6 });
// Wedge has to show: his right glove turns his two cards over (8 and 3: king high)
c.arm(r3(CALL + 0.3), "wdg", "R", felt(WC[0][0] + 0.06, WC[0][1] + 0.02), 0.4, "inOut");
Pk("casino", r3(CALL + 0.7), "wC1", { flip: 1 }, 0.2, "inOut"); Pk("casino", r3(CALL + 0.78), "wC2", { flip: 1 }, 0.2, "inOut");
sfx(r3(CALL + 0.72), "papercut", { gain: 0.4, reason: "two cards turned over" });
c.arm(r3(CALL + 1.0), "wdg", "R", "lap", 0.35, "inOut");
// the rake: both gloves round the pot's two flanks, then back to him with it
c.arm(r3(CALL + 0.55), "spud", "L", felt(0.26, -0.06), 0.3, "inOut"); c.arm(r3(CALL + 0.55), "spud", "R", felt(-0.1, -0.12), 0.3, "inOut");
c.arm(r3(CALL + 0.95), "spud", "L", felt(0.36, -0.3), 0.6, "inOut"); c.arm(r3(CALL + 0.95), "spud", "R", felt(0.04, -0.34), 0.6, "inOut");
P(r3(CALL + 0.95), "pot", { x: 0.2, z: -0.27 }, 0.6, "inOut"); sfx(r3(CALL + 0.95), "ai/bowl-scrape", { gain: 0.5 });
expr(r3(CALL + 0.3), "spud", "delighted");
expr(r3(CALL + 0.75), "wdg", "shocked", { open: 0.9, eye: 1.4 }); A(r3(CALL + 0.8), "wdg", "lean", { to: -8, dur: 0.2 });
c.arm(r3(CALL + 0.35), "chip", "L", "up", 0.3, "back"); c.arm(r3(CALL + 0.35), "chip", "R", "up", 0.3, "back");
say(CALL + 1.0, "chip", "let's go!", 0.6, "excited", "Let's go!");
A(r3(CALL + 0.4), "chip", "hop", { count: 3, height: 0.07 });
CROWD.forEach((g, i) => Pk("casino", r3(CALL + 0.35 + (i % 4) * 0.06), `cr${i}`, { cheer: 1 }, 0.25, "back"));
CROWD.forEach((g, i) => Pk("casino", r3(CALL + 1.5 + (i % 3) * 0.1), `cr${i}`, { cheer: 0 }, 0.4, "inOut"));
sfx(r3(CALL + 0.4), "gasp", { gain: 0.5, reason: "the crowd round the table gasps at the call" }); sfx(r3(CALL + 0.5), "partyhorn", { gain: 0.25, reason: "a cheer at the table" });
see(CALL, HEADS, ["spud.face", "pot", "sC1", "wC1"], "Spud slaps his threes face up, Wedge has to show 8 and 3; Spud rakes the pot in, the crowd cheers");

// ================================================================= 07 EVERY HEAD (10.0-12.0): he reads the whole table, hand after hand
c.arm(r3(HEADS - 0.3), "chip", "L", "lap", 0.4, "inOut"); c.arm(r3(HEADS - 0.3), "chip", "R", "lap", 0.4, "inOut");
c.arm(r3(HEADS - 0.35), "spud", "L", felt(0.42, -0.36), 0.35, "inOut"); c.arm(r3(HEADS - 0.35), "spud", "R", felt(0.0, -0.4), 0.35, "inOut");
P(r3(HEADS - 0.03), "pot", { scale: 0.001 }); for (const p of [...S1, ...W1, ...BOARD1]) P(r3(HEADS - 0.03), p.id, { scale: 0.001 });
Pk("street", r3(HEADS - 0.03), "watch", { scale: 0.001 });
for (const id of ["sS1", "sS2", "sS3", "sS4", "sS5"]) Pk("casino", r3(HEADS - 0.03), id, { n: id === "sS1" ? 3 : id === "sS5" ? 24 : 28 }, 0.01);
Pk("mind", r3(HEADS + 0.2), "bC", { pop: 1 }, 0.3, "back"); Pk("mind", r3(HEADS + 0.45), "bM", { pop: 1 }, 0.3, "back");
sfx(r3(HEADS + 0.22), "ringpop", { gain: 0.35 }); sfx(r3(HEADS + 0.47), "ringpop", { gain: 0.35 });
expr(HEADS, "spud", "cocky", { curve: 0.6 }); look(HEADS, "spud", [-0.5, 0.35], 0.3);
expr(HEADS, "wdg", "annoyed"); expr(HEADS, "chip", "eager");
see(HEADS, MOUNT, ["spud.face", "bW", "bC", "bM"], "a bubble over every friend: cards, pizza, a phone; Spud grins behind stacks as tall as his chest");

// ================================================================= 08 THE MOUNTAIN (12.0-14.0): he wins everything
for (const id of ["sS1", "sS2", "sS3", "sS4", "sS5"]) P(r3(MOUNT - 0.03), id, { scale: 0.001 });
Pk("casino", r3(MOUNT - 0.03), "mount", { grow: 0.35 }); Pk("casino", MOUNT, "mount", { grow: 1 }, 1.2, "out");
sfx(MOUNT, "ai/bowl-scrape", { gain: 0.6, reason: "the chips piling up into a tower" }); sfx(r3(MOUNT + 0.6), "crumble", { gain: 0.3 });
c.arm(r3(MOUNT + 0.15), "spud", "L", "up", 0.35, "back"); c.arm(r3(MOUNT + 0.15), "spud", "R", "up", 0.35, "back");
expr(r3(MOUNT + 0.1), "spud", "delighted", { open: 0.6 }); look(MOUNT, "spud", [0, 0.6], 0.3);
for (const w of ["wdg", "chip"]) expr(r3(MOUNT + 0.2), w, "shocked", { open: 0.6 });
look(r3(MOUNT + 0.2), "mash", [0.3, 0.4], 0.25); expr(r3(MOUNT + 0.2), "mash", "shocked", { open: 0.3 });
CROWD.forEach((g, i) => Pk("casino", r3(MOUNT + 0.3 + (i % 4) * 0.07), `cr${i}`, { cheer: 0.7 }, 0.3, "back"));
CROWD.forEach((g, i) => Pk("casino", r3(CATCH - 0.4), `cr${i}`, { cheer: 0 }, 0.35, "inOut"));
see(MOUNT, CATCH, ["spud.face", "mount"], "a mountain of chips towers beside Spud, arms up; the crowd amazed");

// ================================================================= 09 THE CATCH (14.0-16.5): it does not switch off: every guest's mind
c.arm(r3(CATCH + 0.05), "spud", "R", felt(0.0, -0.4), 0.35, "inOut");
c.arm(r3(CATCH + 0.05), "spud", "L", { o: [0.02, 0.86, 0.14] }, 0.35, "inOut");   // a glove up at his temple
expr(r3(CATCH + 0.05), "spud", "focused", { curve: -0.2, brow: 0.3 });
look(r3(CATCH + 0.3), "spud", [0.4, 0.35], 0.3);
CROWD.forEach((g, i) => { Pk("mind", r3(CATCH + 0.3 + i * 0.1), `cb${i}`, { pop: 1 }, 0.3, "back"); });
GUESTS.forEach((g, i) => { Pk("mind", r3(CATCH + 0.9 + i * 0.1), `gb${i}`, { pop: 1 }, 0.3, "back"); });
for (let i = 0; i < 8; i++) sfx(r3(CATCH + 0.32 + i * 0.2), "ringpop", { gain: 0.25 });
Pk("mind", r3(CATCH + 1.2), "fHall", { fill: 0.4 }, 1.3, "inOut");
see(CATCH, FLOOD, ["spud.face", "cb1", "cb2"], "his smile gone: a bubble pops up over every guest, more and more");

// ================================================================= 10 THE FLOOD (16.5-18.5): the casino crammed with thoughts
Pk("mind", r3(FLOOD - 0.02), "fHall", { fill: 1 }); Pk("mind", r3(FLOOD - 0.02), "fNear", { fill: 0.7 }); Pk("mind", FLOOD, "fNear", { fill: 1 }, 0.8);
c.arm(r3(FLOOD - 0.02), "spud", "L", "hat", 0.01); c.arm(r3(FLOOD - 0.02), "spud", "R", "hat", 0.01);
expr(r3(FLOOD - 0.02), "spud", "terrified", { open: 0.3, eye: 0.6, squint: 0.8 }, 0.01);
say(FLOOD + 0.7, "spud", "too loud!", 0.7, "excited", "Too loud!");
sfx(FLOOD, "rumble", { gain: 0.5, reason: "a roar of thousands of thoughts at once" });
for (const w of ["wdg", "chip"]) expr(FLOOD, w, "shocked", { open: 0.4 });
see(FLOOD, KEYS, ["spud.face"], "the casino packed wall to wall with bubbles; Spud's gloves on his head, eyes squeezed shut");

// ================================================================= 11 THE KEYS (18.5-21.0): a new hand; Wedge bets his car keys; Spud can't find his thought
for (const p of [...BOARD2, ...S2, ...W2]) P(r3(KEYS - 0.03), p.id, { scale: 1 });
c.arm(r3(KEYS - 0.03), "spud", "L", felt(0.42, -0.36), 0.01); c.arm(r3(KEYS - 0.03), "spud", "R", felt(0.0, -0.4), 0.01);
expr(r3(KEYS - 0.03), "spud", "sad", { brow: 0.6 }, 0.01);
c.arm(r3(KEYS - 0.05), "wdg", "R", felt(KEYS_AT[0], KEYS_AT[1]), 0.2, "in");
P(r3(KEYS + 0.15), "keys", { scale: 1 }); sfx(r3(KEYS + 0.16), "slam", { gain: 0.7 });
c.arm(r3(KEYS + 0.5), "wdg", "R", "lap", 0.35, "inOut");
say(KEYS + 0.3, "wdg", "car keys. all in.", 0.8, "calm", "Car keys. All in.");
expr(r3(KEYS + 0.1), "wdg", "cocky", { curve: 0.6, lid: 0.4 }); look(r3(KEYS + 0.1), "wdg", [0.9, -0.2], 0.2);
Pk("mind", r3(KEYS + 0.3), "fWdg", { fill: 1 }, 0.5, "out"); Pk("mind", r3(SHOW - 0.03), "fWdg", { fill: 0 }); Pk("mind", r3(SHOW - 0.03), "fNear", { fill: 0 }); Pk("mind", r3(SLUMP - 0.03), "fNear", { fill: 0.8 });
// Spud searches the bubbles over Wedge: both gloves up, pushing them apart
c.arm(r3(KEYS + 0.8), "spud", "L", "up", 0.25, "inOut"); c.arm(r3(KEYS + 0.8), "spud", "R", { o: [0.1, 0.9, 0.3] }, 0.25, "inOut");
c.arm(r3(KEYS + 1.1), "spud", "L", { o: [0.2, 0.95, 0.25] }, 0.3, "inOut"); c.arm(r3(KEYS + 1.1), "spud", "R", { o: [0.06, 1.0, 0.18] }, 0.25, "inOut");
c.arm(r3(KEYS + 1.4), "spud", "L", "up", 0.25, "inOut"); c.arm(r3(KEYS + 1.4), "spud", "R", { o: [0.1, 0.9, 0.3] }, 0.25, "inOut");
look(r3(KEYS + 0.8), "spud", [-0.8, 0.5], 0.2); expr(r3(KEYS + 0.8), "spud", "terrified", { open: 0.5 });
say(KEYS + 1.2, "spud", "which one is yours?!", 0.8, "excited", "Which one is yours?!");
// he can't find it, so he guesses: all in, the whole mountain pushed to the middle
c.arm(r3(KEYS + 1.6), "spud", "L", felt(0.62, -0.1), 0.15, "in"); c.arm(r3(KEYS + 1.6), "spud", "R", felt(0.44, -0.12), 0.15, "in");
c.arm(r3(KEYS + 1.75), "spud", "L", felt(0.04, -0.21), 0.38, "inOut"); c.arm(r3(KEYS + 1.75), "spud", "R", felt(-0.14, -0.23), 0.38, "inOut");
P(r3(KEYS + 1.75), "mount", { x: 0.0, z: -0.06 }, 0.38, "inOut"); sfx(r3(KEYS + 1.75), "ai/bowl-scrape", { gain: 0.6 });
c.arm(r3(KEYS + 2.13), "spud", "L", "lap", 0.35, "inOut"); c.arm(r3(KEYS + 2.13), "spud", "R", "lap", 0.35, "inOut");
see(KEYS, SHOW, ["wdg.face", "spud.face", "keys"], "Wedge slams his car keys down; Spud pushes through the bubbles over Wedge's head, can't find his thought, pushes it all in");

// ================================================================= 12 FOUR ACES (21.0-23.5): the showdown from above; Wedge takes it all
Pk("casino", r3(SHOW + 0.25), "sK1", { flip: 1 }, 0.2, "inOut"); Pk("casino", r3(SHOW + 0.33), "sK2", { flip: 1 }, 0.2, "inOut");
sfx(r3(SHOW + 0.27), "papercut", { gain: 0.4, reason: "Spud turns his two kings" });
c.arm(r3(SHOW + 0.45), "wdg", "R", felt(WC[0][0] + 0.06, WC[0][1] + 0.02), 0.25, "inOut");
Pk("casino", r3(SHOW + 0.75), "wA1", { flip: 1 }, 0.2, "inOut"); Pk("casino", r3(SHOW + 0.85), "wA2", { flip: 1 }, 0.2, "inOut");
sfx(r3(SHOW + 0.77), "papercut", { gain: 0.5, reason: "Wedge turns his two aces" });
c.say(r3(SHOW + 1.0), "wdg", "four aces.", 0.7, "calm", { voice: false, sub: "Four aces.", pos: 1250 });   // low: the faces are at the top of this shot
expr(r3(SHOW + 0.8), "wdg", "smug", { curve: 0.7, lid: 0.5 });
// his left glove hooks the tower's near flank and drags it to his side
c.arm(r3(SHOW + 0.9), "wdg", "L", felt(0.02, 0.13), 0.3, "inOut"); c.arm(r3(SHOW + 1.2), "wdg", "L", felt(-0.1, 0.07), 0.55, "inOut");
P(r3(SHOW + 1.2), "mount", { x: -0.12, z: -0.12 }, 0.55, "inOut"); sfx(r3(SHOW + 1.2), "ai/bowl-scrape", { gain: 0.6 });
c.arm(r3(SHOW + 1.05), "wdg", "R", "lap", 0.5, "inOut");
act.defeated(c, SLUMP, "spud", { turn: -10, hold: 0.9 });
for (const w of ["chip", "mash"]) expr(r3(SHOW + 0.9), w, "shocked", { open: 0.5 });
CROWD.forEach((g, i) => Pk("casino", r3(SHOW + 0.9 + (i % 4) * 0.06), `cr${i}`, { cheer: 0.4 }, 0.25, "back"));
see(SHOW, SLUMP, ["sK1", "wA1", "b20", "mount"], "from above: four aces (two in Wedge's hand, two on the board) beat Spud's kings; Wedge drags the mountain away");
see(SLUMP, STREET, ["spud.face"], "Spud slumps, empty gloves, the bubbles still everywhere");

// ================================================================= 13 THE STREET (23.5-26.5): outside, every passer-by's mind
A(r3(STREET - 0.06), "spud", "stand", { dur: 0.01 });
for (const w of ["wdg", "chip", "mash"]) A(r3(STREET - 0.02), w, "hide");
const SWALK = [[SX + 0.15, -2.9], [SX + 0.05, -1.0]];
place(STREET, "spud", SWALK[0], 0);
A(r3(STREET + 0.05), "spud", "move", { to: SWALK[1], dur: 2.9, steps: 12 });
c.arm(r3(STREET - 0.02), "spud", "L", "hat", 0.01); c.arm(r3(STREET - 0.02), "spud", "R", "hat", 0.01);
expr(r3(STREET - 0.02), "spud", "terrified", { open: 0.2, eye: 1.3, curve: -0.3 }, 0.01);
look(r3(STREET + 0.4), "spud", [-0.6, 0.3], 0.3); look(r3(STREET + 1.3), "spud", [0.6, 0.35], 0.3); look(r3(STREET + 2.2), "spud", [0, 0.1], 0.3);
WALKERS.forEach(([x, z0, z1, h], i) => {
  const yaw = z1 > z0 ? 0 : 180, dist = Math.abs(z1 - z0), t0 = r3(STREET - 0.04), d = r3(CITY - STREET + 0.08);
  Pk("street", t0, `w${i}`, { rot: yaw });
  Pk("street", t0, `w${i}`, { z: z1, walk: r3(dist) }, d, "linear");
  Pk("mind", t0, `wb${i}`, { pop: 1 }); Pk("mind", t0, `wb${i}`, { z: z1 }, d, "linear");
});
for (const id of ["fStreetL", "fStreetR", "fStreetU"]) Pk("mind", r3(STREET - 0.02), id, { fill: 1 });
sfx(r3(STREET + 0.6), "horn", { gain: 0.3, reason: "a car horn in the busy street" }); sfx(r3(STREET + 0.2), "tyres", { dur: 2.5, gain: 0.2, reason: "traffic passing" });
see(STREET, CITY, ["spud.face", "wb1", "wb2"], "night: Spud walks down a busy neon street, gloves on his head; a bubble over every passer-by and in every window");

// ================================================================= 14 THE CITY (26.5-29.0): every roof, every window
Pk("mind", r3(CITY - 0.02), "fCity", { fill: 0.45 }); Pk("mind", CITY, "fCity", { fill: 1, rise: 6 }, 1.6, "in");
sfx(CITY, "windswell", { gain: 0.5, reason: "the sky over the city filling with thoughts" }); sfx(r3(CITY + 0.4), "ai/magic-zap", { gain: 0.3 });
see(CITY, NIGHT, ["fCity"], "the neon city from above: a glowing bubble over every roof and window, thousands");

// ================================================================= 15 THE HOTEL ROOM (29.0-32.6): it is never quiet again
place(NIGHT, "spud", [HX + BED[0], BED[1]], 0);
if (has("city")) A(r3(NIGHT - 0.01), "spud", "sit", { seat: "bed", height: 0.5, dur: 0.01, hands: "keep" });
const PILLOW_AT = [HX + BED[0], 1.4, r3(BED[1] - 0.02)];   // on his head: the mattress 0.5 + Spud 0.88 less the seat drop
P(r3(NIGHT - 0.03), "pillow", { x: PILLOW_AT[0], y: PILLOW_AT[1], z: PILLOW_AT[2], rot: 0 });
c.arm(r3(NIGHT - 0.03), "spud", "L", { prop: "pillow", grip: [0.24, 0.05, 0.0], palm: true }, 0.01); c.arm(r3(NIGHT - 0.03), "spud", "R", { prop: "pillow", grip: [-0.24, 0.05, 0.0], palm: true }, 0.01);
A(r3(NIGHT - 0.03), "spud", "grip", { side: "L", shape: "hold", dur: 0 }); A(r3(NIGHT - 0.03), "spud", "grip", { side: "R", shape: "hold", dur: 0 });
expr(r3(NIGHT - 0.02), "spud", "terrified", { open: 0.05, eye: 1.35, curve: -0.3 }, 0.01); look(r3(NIGHT - 0.02), "spud", [0, 0.1], 0.01);
Pk("mind", r3(NIGHT - 0.02), "fRoom", { fill: 0.6 }); Pk("mind", NIGHT, "fRoom", { fill: 1 }, 3.0, "linear");
Pk("mind", r3(NIGHT - 0.02), "fStream", { fill: 1, pull: 0 }); Pk("mind", NIGHT, "fStream", { pull: 1 }, 3.6, "linear");
sfx(NIGHT, "rumble", { dur: 3.6, gain: 0.25, reason: "the city's thoughts murmuring through the window" });
look(r3(NIGHT + 1.6), "spud", [0.3, 0.2], 0.3); A(r3(NIGHT + 1.7), "spud", "blink", { dur: 0.22 });
cap(r3(NIGHT + 2.05), END, "Would you still want it?", SUBY);
see(NIGHT, END, ["spud.face", "glow"], "night, a hotel room high above the city: Spud awake, pillow on his head, the thoughts streaming in");

// ---------------------------------------------------------------- shots (camera A looks -z from the front of the table)
const SPUD_HEAD = [SEAT.spud[0], 1.12, SEAT.spud[1]];
const OTS_POS = (() => { const [x, z] = P2(SEAT.spud, YAW.spud, -0.25, 0.55); return [x, 1.45, z]; })();
const SH = {
  allin:  { pos: [-0.5, 2.25, 3.1], look: [-0.15, 0.8, -0.5], fov: 54, to: { pos: [-0.42, 2.15, 2.8], look: [-0.15, 0.82, -0.5], fov: 54 }, dur: STARE, ease: "linear" },
  stare:  { pos: [-0.1, 1.35, 1.5], look: [-0.1, 1.1, -1.0], fov: 46, to: { pos: [-0.1, 1.32, 1.3], look: [-0.1, 1.1, -1.0], fov: 46 }, dur: r3(OTS - STARE), ease: "linear" },
  ots:    { pos: OTS_POS, look: [r3(SFAN_AT[0] - 0.12), 0.74, r3(SFAN_AT[2] + 0.12)], fov: 34, to: { pos: OTS_POS.map((v, i) => r3(v + [-0.02, -0.03, 0.05][i])), look: [r3(SFAN_AT[0] - 0.12), 0.74, r3(SFAN_AT[2] + 0.12)], fov: 31 }, dur: r3(READ - OTS), ease: "linear" },
  read:   { pos: [0.27, 1.12, 0.5], look: [0.35, 1.05, -1.0], fov: 40, to: { pos: [0.28, 1.1, 0.25], look: [0.35, 1.05, -1.0], fov: 40 }, dur: r3(POV - READ), ease: "in" },
  pov:    { pos: [0.5, 1.3, 0.25], look: [-0.66, 1.42, -0.97], fov: 55 },
  call:   { pos: [0.3, 1.8, 2.0], look: [0.15, 0.85, -0.6], fov: 56 },
  heads:  { pos: [0.0, 2.5, 4.4], look: [0.0, 1.35, -0.5], fov: 58 },
  mount:  { pos: [0.1, 0.95, 1.0], look: [0.35, 1.5, -0.8], fov: 58, to: { pos: [0.1, 0.9, 0.85], look: [0.35, 1.65, -0.8], fov: 60 }, dur: r3(CATCH - MOUNT), ease: "out" },
  catch:  { pos: [1.6, 1.7, 1.7], look: [-0.2, 1.3, -2.4], fov: 56, to: { pos: [1.9, 1.9, 2.3], look: [-0.4, 1.4, -3.0], fov: 60 }, dur: r3(FLOOD - CATCH), ease: "inOut" },
  flood:  { pos: [0.1, 1.3, 0.45], look: [0.22, 1.2, -1.0], fov: 52 },
  keys:   { pos: [0.0, 1.65, 1.9], look: [-0.1, 1.15, -0.85], fov: 52 },
  show:   { pos: [-0.08, 2.3, 0.8], look: [-0.08, TH, -0.2], fov: 56 },
  slump:  { pos: [0.4, 1.2, 0.7], look: [0.45, 0.95, -1.0], fov: 44 },
  street: { pos: [SX, 1.2, 1.9], look: [SX, 1.15, -8], fov: 52, to: { pos: [SX, 1.2, 1.5], look: [SX, 1.15, -8], fov: 52 }, dur: r3(CITY - STREET), ease: "linear" },
  city:   { pos: [CX, 40, 25], look: [CX, 10, -40], fov: 55, to: { pos: [CX, 44, 30], look: [CX, 10, -40], fov: 58 }, dur: r3(NIGHT - CITY), ease: "linear" },
  hotel:  { pos: [HX - 0.15, 1.75, 1.8], look: [HX - 0.2, 1.3, -1.3], fov: 52, to: { pos: [HX - 0.15, 1.7, 1.3], look: [HX - 0.2, 1.3, -1.3], fov: 52 }, dur: r3(END - NIGHT), ease: "linear" },
};
void SPUD_HEAD;
const CUTS = [
  ["01 all-in", 0, SH.allin, "hook"],
  ["02 the stare", STARE, SH.stare],
  ["03 his cards over his shoulder", OTS, SH.ots],
  ["04 the eyes glow", READ, SH.read],
  ["05 Wedge's thought", POV, SH.pov, "reveal"],
  ["06 the call", CALL, SH.call],
  ["07 every head", HEADS, SH.heads],
  ["08 the mountain", MOUNT, SH.mount],
  ["09 the catch", CATCH, SH.catch],
  ["10 the flood", FLOOD, SH.flood, "payoff"],
  ["11 the keys", KEYS, SH.keys],
  ["12 four aces", SHOW, SH.show],
  ["12 Spud slumps", SLUMP, SH.slump],
  ["13 the street", STREET, SH.street],
  ["14 the city", CITY, SH.city],
  ["15 the hotel room", NIGHT, SH.hotel, "reaction"],
];

// ---------------------------------------------------------------- the commentator (voice 1, "narrator"), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0, process.env.TITLE ?? "What if you could read minds?", 1, 2.0, NG],
  [r3(MOUNT + 0.35), "You'd never lose again.", 1, 1.5, NG],
  [r3(CATCH + 0.15), "But there's a catch.", 1, 1.1, NG],
  [r3(CATCH + 1.4), "You would hear everyone's mind.", 1, 1.7, NG],   // Jonny 12 Nov
  [r3(NIGHT + 0.3), "It would never be quiet again.", 1, 1.6, NG],     // Jonny 12 Nov
  [r3(NIGHT + 2.05), "Would you still want it?", 1, 1.33, NG],
];
for (const [t, line, take, , gain] of NARR) c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });

sfx(0, "ai/step-carpet", { gain: 0.001, reason: "placeholder so the sound pass knows the floor is carpet" });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);

const allowClip = [
  ...Object.entries(CHAIR).map(([who, ch]) => ({ who, with: ch, from: 0, to: STREET, reason: "seated in his chair" })),
  { who: "mash", with: "mphone", from: 0, to: STREET, reason: "his phone in his glove (he never looks up)" },
  { who: "spud", with: "sFan", from: 0, to: r3(CALL - 0.4), reason: "his two cards held up in his glove" },
  ...["heap", "watch", "pot"].map((id) => ({ who: "wdg", with: id, from: 0, to: 1.3, reason: "shoving his heap and watch into the pot" })),
  ...["pot", "sC1", "sC2"].map((id) => ({ who: "spud", with: id, from: r3(CALL - 0.5), to: HEADS, reason: "slapping his cards down and raking the loose chips in" })),
  ...["wC1", "wC2"].map((id) => ({ who: "wdg", with: id, from: CALL, to: HEADS, reason: "turning his two cards over" })),
  ...["wA1", "wA2"].map((id) => ({ who: "wdg", with: id, from: SHOW, to: STREET, reason: "turning his two aces over" })),
  { who: "wdg", with: "keys", from: KEYS, to: r3(KEYS + 0.6), reason: "slamming his keys on the felt" },
  { who: "spud", with: "mount", from: KEYS, to: SHOW, reason: "both gloves pushing the chip tower into the middle" },
  { who: "wdg", with: "mount", from: SHOW, to: STREET, reason: "his glove dragging the chip tower to his side" },
  { who: "spud", with: "bed", from: NIGHT, to: END, reason: "sitting up on the hotel bed" },
  { who: "spud", with: "pillow", from: NIGHT, to: END, reason: "the pillow pressed on his head with both gloves" },
  { who: "spud", with: "glow", from: 0, to: END, reason: "the glowing eyes are worn on his face" },
  ];

write(import.meta.url, {
  id: VO ? "read-minds" : "read-minds-no-vo",
  title: "What if you could read minds? But there's a catch.",
  idea: "There's a catch, episode 6: Spud can suddenly read minds at a casino poker table; he wins everything, then the power spreads to every guest, the street and the whole city, and he loses it all because he can't find the one thought that matters",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [470, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#2a1418", floor: "#5a1a1e", light: "warm", para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  // music that supports the story (Jonny 11 Nov): from 0.0, changes at the turn. Tense poker suspense under the game,
  // then a frantic orchestra from "But there's a catch" (recorded beds, never a synthesised style for danger: Jonny 12 Nov)
  music: { file: process.env.MUSIC ?? "ai/sos-tension/sos-tension-01.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, until: r3(CATCH + 0.1),
    then: { file: process.env.MUSIC2 ?? "ai/disaster/disaster-01.ogg", from: r3(CATCH + 0.1), gain: 0.7 } },
  sound: { sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "carpet", room: "party", guard: true },
  hook: { show: ["wdg", "spud", "pot"], hint: 0, what: "a poker all-in already running: Wedge shoves a huge heap and his gold watch into the pot, Spud with three chips left" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/06-read-minds/make-read-minds.mjs.",
});
