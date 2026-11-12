// WHAT IF YOU COULD READ MINDS? BUT THERE'S A CATCH. (There's a catch, episode 6; Jonny 12 Nov 2026: "read minds ... put
// this to the first place", the poker all-in opening, "the poker game should be in a casino", then "Go, build from these"
// on the 12-panel casino sheet board.png). Opener type A: the all-in is already running at frame 0.
// Brief + image prompt: /mnt/project-files/video-scripts/2026-11-08-what-if/06-read-minds-V2-POKER-12-PANEL-IMAGE-PROMPT.md
// Panels: board.png + PANELS.md here. Places, cameras and reasons: NOTES.md here.
//   node storyboards/series/what-if/06-read-minds/make-read-minds.mjs            -> read-minds.json
//   ... --no-vo -> read-minds-no-vo.json: without the commentator (staging and drafts, no speech model)
//
// THE BRIEF
//   Joke:        Spud is about to lose everything at poker, and suddenly he can read minds: every thought floats over its
//                owner's head as a soap bubble with one small thing inside. Wedge's bubble says 2 and 7: a bluff.
//   Wants:       Spud wants to win; Wedge ("trust me") wants Spud to fold.
//   Consequence: the catch, shown: it does not switch off and it spreads: every guest, then the whole city. When it
//                matters most (Wedge bets his car keys) Spud cannot find Wedge's one thought among thousands, guesses,
//                and loses everything to four aces.
//   Ending:      night, a hotel room high above the city: Spud sits awake with a pillow pressed on his head while the
//                city's thoughts stream in through the window. It is never quiet again.
//   Callback:    frame 0 is an all-in he is about to lose; the last all-in he loses with all the power in the world.
// The power: Spud's eyes glow blue-white (eyeglow), a soft magic shimmer ("ai/magic-zap" low), the bubble pops in.
//
// WORLD (x right, z toward camera A; yaw 0 faces +z, 90 faces +x). CASINO: the poker table's middle at the origin, the
// hall (casinohall) behind it to z -18; Wedge on the left side, Spud on the right side, Chip and Mash at the back.
// CITY (panel 08): the same world 1000 m along x. HOTEL (panel 12): 2000 m along x.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "casino,mind,city").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...(final.wear && { wear: final.wear }), ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };   // params only the real pack knows

// ---------------------------------------------------------------- the beats (video s = story s: no ramps)
// 01 all-in | 02 the stare (two singles) | 03 the read | 04 the call | 05 every head | 06 the mountain | 07 the spread |
// 08 the city | 09 the flood | 10 the keys | 11 four aces | 12 the hotel room
const STARE = 1.6, STARE2 = 2.3, READ = 3.0, READW = 3.7, CALL = 4.7, HEADS = 6.5, MOUNT = 8.1, SPREAD = 9.9;
const CITY = 11.9, FLOOD = 13.3, KEYS = 14.9, ACES = 16.9, NIGHT = 18.9, END = 21.9;
const DOWN = -60;   // parked under the floor
const CX = 1000, HX = 2000;   // the city's and the hotel's x offsets
const BED = [-0.2, -1.25];    // the hotel bed's sitter spot in the room (props-nightcity.js HOTEL.bed)

const rad = (d) => (d * Math.PI) / 180;
const dirOf = (yaw) => [Math.sin(rad(yaw)), Math.cos(rad(yaw))], leftOf = (yaw) => [Math.cos(rad(yaw)), -Math.sin(rad(yaw))];
const P2 = ([x, z], yaw, f, s = 0) => { const d = dirOf(yaw), l = leftOf(yaw); return [r3(x + f * d[0] + s * l[0]), r3(z + f * d[1] + s * l[1])]; };
const place = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });

// ---------------------------------------------------------------- places (the casino)
const TW = 1.9, TD = 1.15, TH = 0.62;            // the poker table: oval 1.9 x 1.15, felt at 0.62
// seats: 0.5 m beyond the rim (Share or Steal's proven reach), the two players on the long sides turned toward the
// camera so both faces read 3/4; the two watchers at the back facing us
const SEAT = { wdg: [-1.45, -0.25], spud: [1.45, -0.25], chip: [-0.55, -1.08], mash: [0.6, -1.08] };
const YAW = { wdg: 58, spud: -58, chip: 12, mash: -12 };
const CHAIR = { wdg: "chW", spud: "chS", chip: "chC", mash: "chM" };
const POT = [0, -0.12];                          // the pot in the middle of the felt
const W_STACK = [-0.62, -0.2], S_STACK = [0.66, -0.12];   // each player's chips on the felt in front of him
const MOUNT_AT = [0.5, -0.12];                   // Spud's chip mountain (its near side is toward his seat)
const LAMP_Y = 2.65;
const headTop = (who, h) => [SEAT[who][0], r3(0.3 + h + 0.05), SEAT[who][1]];
const H = { spud: 0.88, wdg: 0.98, chip: 0.53, mash: 1.24 };
const bubbleOver = (who, up = 0.28, r = 0.2) => { const [x, y, z] = headTop(who, H[who]); return { x, y: r3(y + up + r), z }; };
// background guests among the slot machines and at the roulette (hall: slots along x -6.5 and +6.5, roulette at [3.2, -8])
const GUESTS = [
  [-5.6, -4.2, 90, "tux"], [-5.6, -7.4, 90, "gown", "#7a1f3d"], [-5.6, -10.2, 90, "tux"],
  [5.6, -5.0, -90, "gown", "#1f4f7a"], [5.6, -9.6, -90, "tux"],
  [2.4, -7.2, 60, "tux"], [3.9, -6.9, -20, "gown", "#5a2a7a"], [3.0, -9.2, 170, "tux"],
  [-1.8, -11.5, 20, "gown", "#2a6a4a"], [0.9, -12.6, -15, "tux"],
];
const GOBJ = ["shoe", "fish", "clock", "heart", "sandwich", "football", "coin", "crown", "gift", "cat"];

const cast = [
  { id: "wdg", character: "potatobrawl/wedge", at: SEAT.wdg, face: YAW.wdg, expr: "smug", follow: 0.3, seed: 2.1 },
  { id: "spud", character: "potatobrawl/spud", at: SEAT.spud, face: YAW.spud, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: SEAT.chip, face: YAW.chip, expr: "eager", follow: 0.3, seed: 4.4 },
  { id: "mash", character: "potatobrawl/mash", at: SEAT.mash, face: YAW.mash, expr: "deadpan", follow: 0.3, seed: 3.7 },
];

// ---------------------------------------------------------------- props
const chip = (id, at, n, color, show = n) => ph("casino", { id, kind: "chipstack", x: at[0], y: TH, z: at[1], n: show, color, nMax: n }, { ...box(0.09, 0.012 * n, 0.09), y: TH });
const props = [
  // ---- the casino (T1 props-casino.js)
  ph("casino", { id: "hall", kind: "casinohall", x: 0, y: 0, z: 0, w: 20, d: 24, h: 7.5, dim: 0 }, { ...box(20, 0.02, 24), y: -0.02, z: -6 }),
  ph("casino", { id: "lamp", kind: "pokerlamp", x: 0, y: 0, z: POT[1], dome: LAMP_Y }, { ...box(1.1, 0.4, 1.1), y: LAMP_Y }),
  ph("casino", { id: "table", kind: "pokertable", x: 0, y: 0, z: 0, w: TW, d: TD, h: TH }, box(TW, TH, TD)),
  ...Object.entries(CHAIR).map(([who, id]) => ({ id, kind: "sschair", x: SEAT[who][0], z: SEAT[who][1], rot: YAW[who], tip: 0 })),
  ...GUESTS.map(([x, z, rot, dress, color], i) => ph("casino", { id: `g${i}`, kind: "casinoguest", x, y: 0, z, rot, h: 0.9, dress, ...(color && { color }), sway: 1 }, box(0.7, 0.9, 0.6))),
  ph("casino", { id: "pot", kind: "chippile", x: POT[0], y: TH, z: POT[1], r: 0.36, amount: 0.55 }, { ...box(0.6, 0.15, 0.5), y: TH }),
  chip("wS1", W_STACK, 14, "#222"), chip("wS2", [W_STACK[0] + 0.1, W_STACK[1] + 0.07], 12, "#c62828"),
  chip("sS1", S_STACK, 3, "#1e4fb5"),
  chip("sS2", [S_STACK[0] - 0.02, S_STACK[1] + 0.12], 12, "#c62828", 0), chip("sS3", [S_STACK[0] + 0.1, S_STACK[1] - 0.06], 12, "#2e7d32", 0),
  chip("sS4", [S_STACK[0] - 0.1, S_STACK[1] - 0.08], 12, "#222", 0),
  ph("casino", { id: "mount", kind: "chipmountain", x: MOUNT_AT[0], y: TH, z: MOUNT_AT[1], w: 0.8, d: 0.55, h: 1.45, grow: 0 }, { ...box(0.8, 0.01, 0.55), y: TH }),
  // Spud's two hole cards: backs out, held to his chest; after the call, face up on the felt
  ph("casino", { id: "sFan", kind: "cardfan", cards: ["Kh", "Kc"], back: true, x: 0, y: 0, z: 0, scale: 1, spread: 0.6 }, box(0.15, 0.17, 0.02)),
  ...[["sC1", "Kh", -0.07], ["sC2", "Kc", 0.07]].map(([id, card, dx]) => ph("casino", { id, kind: "playcard", card, x: r3(S_STACK[0] - 0.25 + dx), y: TH + 0.002, z: r3(S_STACK[1] + 0.2), tip: -90, flip: 1, scale: 0.001 }, { ...box(0.11, 0.004, 0.155), y: DOWN })),
  // Wedge's car keys (panel 10) and his four aces (panel 11)
  ph("casino", { id: "keys", kind: "carkeys", x: -0.5, y: TH, z: 0.15, rot: 30, scale: 0.001 }, { ...box(0.1, 0.02, 0.05), y: DOWN }),
  ph("casino", { id: "aces", kind: "cardfan", cards: ["As", "Ah", "Ad", "Ac"], x: 0, y: DOWN, z: 0, scale: 1.25, spread: 0 }, { ...box(0.2, 0.2, 0.02), y: DOWN }),
  // Mash's phone (he never looks up)
  { id: "mphone", kind: "phone", x: 0, y: 0, z: 0, scale: 1.6, case: "#3a7bd5" },
  // ---- the power (T2 props-mind.js)
  ph("mind", { id: "glow", kind: "eyeglow", wear: "spud", x: 0, y: 0.61, z: 0.36, gap: 0.2, ew: 0.08, eh: 0.095, on: 0, pulse: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "bW", kind: "thoughtbubble", ...bubbleOver("wdg"), r: 0.2, obj: "cards27", pop: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "bC", kind: "thoughtbubble", ...bubbleOver("chip", 0.22, 0.17), r: 0.17, obj: "pizza", pop: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "bM", kind: "thoughtbubble", ...bubbleOver("mash", 0.22, 0.17), r: 0.17, obj: "phone", pop: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ...GUESTS.map(([x, z], i) => ph("mind", { id: `gb${i}`, kind: "thoughtbubble", x, y: 1.55, z, r: 0.24, obj: GOBJ[i], pop: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN })),
  ph("mind", { id: "fHall", kind: "bubblefield", x: 0, y: 1.3, z: -7, w: 14, h: 4, d: 12, n: 260, r: [0.12, 0.3], objs: 0.7, seed: 6, fill: 0, rise: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "fNear", kind: "bubblefield", x: 0, y: 1.05, z: 0.2, w: 4.2, h: 1.9, d: 3.2, n: 150, r: [0.08, 0.2], objs: 0.75, seed: 9, fill: 0, rise: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "fWdg", kind: "bubblefield", x: SEAT.wdg[0] + 0.15, y: 1.38, z: SEAT.wdg[1], w: 1.3, h: 1.1, d: 0.9, n: 70, r: [0.06, 0.13], objs: 0.85, seed: 13, fill: 0, rise: 0 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  // ---- the city at night (T3 props-nightcity.js) with its thoughts
  ph("city", { id: "city", kind: "neoncity", x: CX, y: 0, z: 0, w: 120, d: 120, casino: [0, 0] }, { ...box(30, 14, 20), x: CX }),
  ph("mind", { id: "fCity", kind: "bubblefield", x: CX, y: 14, z: -25, w: 110, h: 28, d: 90, n: 600, r: [0.9, 2.4], objs: 0.6, seed: 21, fill: 0, rise: 0, glow: 1 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  // ---- the hotel room (T3) high above the city
  ph("city", { id: "room", kind: "hotelroom", x: HX, y: 0, z: 0, bed: 0 }, { ...box(4, 0.02, 4), x: HX, y: -0.02 }),
  ph("city", { id: "bed", kind: "hotelbed", x: HX + BED[0], y: 0, z: BED[1] }, { ...box(1.5, 0.5, 1.9), x: HX + BED[0], z: r3(BED[1] + 0.33) }),
  ph("city", { id: "sky", kind: "nightskyline", x: HX, y: -1, z: 13, w: 30, h: 14, r: 18 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("city", { id: "pillow", kind: "hotelpillow", x: HX, y: DOWN, z: 0 }, { ...box(0.5, 0.12, 0.3), y: DOWN }),
  ph("mind", { id: "fRoom", kind: "bubblefield", x: HX + 0.2, y: 1.75, z: -0.9, w: 3.6, h: 1.2, d: 2.6, n: 110, r: [0.07, 0.17], objs: 0.7, seed: 31, fill: 0, rise: 0, glow: 1 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
  ph("mind", { id: "fStream", kind: "bubblefield", x: HX + 0.5, y: 0.8, z: -5.5, w: 6, h: 2.5, d: 5, n: 160, r: [0.07, 0.16], objs: 0.6, seed: 37, fill: 0, rise: 0, pull: 0, to: [-0.7, 0.7, 4.3], glow: 1 }, { ...box(0.01, 0.01, 0.01), y: DOWN }),
];

// ---------------------------------------------------------------- everyone seated at frame 0
for (const who of ["wdg", "spud", "chip", "mash"]) A(0, who, "sit", { seat: CHAIR[who], dur: 0.01, hands: "keep" });
// Mash never looks up: his phone in his left glove at chest height, its screen to him
const MPH_AT = (() => { const [x, z] = P2(SEAT.mash, YAW.mash, 0.36, 0.08); return [x, 0.86, z]; })();
const MPHONE = { id: "mphone", kind: "phone", ...grips.placeFor("phone", MPH_AT, 180 + YAW.mash), tip: -35, scale: 1.6, case: "#3a7bd5" };
props[props.findIndex((p) => p.id === "mphone")] = MPHONE;
const mph = grips.phone(c, "mash", MPHONE, { side: "L" });
c.arm(0, "mash", "L", { prop: "mphone", grip: mph.hands.L.grip, palm: true }, 0); A(0, "mash", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "mash", "grab", { prop: "mphone", hand: "L", grip: mph.hands.L.grip, dur: 0, pose: null });
look(0, "mash", [0.1, -0.55], 0.01);
// hands on the felt: a point on the table top in the table's own frame (it stands at the origin, rot 0), palm down
const felt = (x, z, up = 0.035) => ({ prop: "table", grip: [r3(x), r3(TH + up), r3(z)], palm: [r3(x), r3(TH - 0.4), r3(z)] });
// Spud's two hole cards held to his chest in his camera-side glove (his left: he faces -x and toward us)
const SFAN_AT = (() => { const [x, z] = P2(SEAT.spud, YAW.spud, 0.3, 0.12); return [x, 0.9, z]; })();
P(0, "sFan", { x: SFAN_AT[0], y: SFAN_AT[1], z: SFAN_AT[2], rot: 180 + YAW.spud });
c.arm(0, "spud", "L", { prop: "sFan", grip: [0, 0.03, -0.02], palm: true }, 0); A(0, "spud", "grip", { side: "L", shape: "hold", dur: 0 });
c.arm(0, "spud", "R", felt(0.88, -0.05), 0);
c.arm(0, "chip", "L", "lap", 0); c.arm(0, "chip", "R", "lap", 0);

// params props3d.js propState has no default for jump on their first tween: seed them at 0
Pk("mind", 0, "glow", { pulse: 0 }); Pk("casino", 0, "hall", { dim: 0 });
for (const id of ["sS2", "sS3", "sS4"]) Pk("casino", 0, id, { n: 0 });
Pk("casino", 0, "sC1", { flip: 1 }); Pk("casino", 0, "sC2", { flip: 1 });   // face-up cards (playcard flip has no spec default)

// ================================================================= 01 ALL-IN (0-1.6): Wedge shoves every chip into the pot
// frame 0 is mid-shove: both his gloves behind his two stacks, the stacks already moving to the pot
c.arm(0, "wdg", "R", felt(W_STACK[0] - 0.04, W_STACK[1] - 0.08), 0); c.arm(0, "wdg", "L", felt(W_STACK[0] + 0.02, W_STACK[1] + 0.13), 0);
c.arm(0.05, "wdg", "R", felt(-0.3, -0.16), 0.75, "inOut"); c.arm(0.05, "wdg", "L", felt(-0.24, 0.02), 0.75, "inOut");
P(0, "wS1", { x: r3(W_STACK[0]) }); P(0.05, "wS1", { x: -0.22 }, 0.75, "inOut");
P(0, "wS2", { x: r3(W_STACK[0] + 0.1) }); P(0.05, "wS2", { x: -0.16 }, 0.75, "inOut");
A(0, "wdg", "lean", { to: 14, dur: 0.01 }); A(0.9, "wdg", "lean", { to: 0, dur: 0.5 });
c.arm(1.0, "wdg", "R", "lap", 0.45, "inOut"); c.arm(1.05, "wdg", "L", "hips", 0.45, "inOut");
P(0.85, "wS1", { scale: 0.001 }); P(0.85, "wS2", { scale: 0.001 }); Pk("casino", 0.8, "pot", { amount: 1 }, 0.12, "out");
sfx(0.05, "ai/bowl-scrape", { gain: 0.5, reason: "two tall stacks of chips slid over the felt" }); sfx(0.82, "crumble", { gain: 0.35, reason: "the stacks topple into the pot" });
expr(0, "wdg", "smug", { lid: 0.45, curve: 0.45 }, 0.01); look(0, "wdg", [0.9, 0.05], 0.01);
expr(0, "spud", "shocked", { open: 0.4, eye: 1.2, brow: 0.4 }, 0.01); look(0, "spud", [-0.9, -0.15], 0.01);
A(0.3, "spud", "squash", { amount: 0.05, dur: 0.2 });
c.at(0.4, { fx: "sweat", who: "spud", dur: 1.2 });
look(0, "chip", [-0.35, -0.1], 0.01); A(0.2, "chip", "hop", { count: 2, height: 0.05 });
see(0, STARE, ["wdg.face", "spud.face", "pot"], "frame 0: Wedge shoves every chip into the pot, Spud with three chips left");

// ================================================================= 02 THE STARE (1.6-3.0): two singles, he bluffs, Spud gulps
c.say(r3(STARE + 0.1), "wdg", "trust me.", 0.6, "calm", { voice: false, sub: "Trust me." });
expr(STARE, "wdg", "smug", { lid: 0.55, curve: 0.55, brow: -0.2 });
expr(STARE2, "spud", "shocked", { open: 0.2, eye: 1.15, brow: 0.6, curve: -0.3 });
A(r3(STARE2 + 0.2), "spud", "squash", { amount: 0.06, dur: 0.18 }); sfx(r3(STARE2 + 0.22), "gulp", { gain: 0.6 });
A(r3(STARE2 + 0.1), "spud", "droop", { to: 0, dur: 0.01 });
see(STARE, STARE2, ["wdg.face"], "Wedge stares him down, smug: trust me");
see(STARE2, READ, ["spud.face"], "Spud gulps, three chips left");

// ================================================================= 03 THE READ (3.0-4.7): his eyes glow, a bubble over Wedge
Pk("mind", r3(READ + 0.15), "glow", { on: 1, pulse: 1 }, 0.25, "out");
sfx(r3(READ + 0.12), "ai/magic-zap", { gain: 0.45, reason: "the power switches on: a soft magic shimmer, no ringing bell" });
expr(r3(READ + 0.1), "spud", "focused", { brow: -0.3, eye: 1.25 });
Pk("mind", r3(READW + 0.1), "bW", { pop: 1 }, 0.35, "back"); sfx(r3(READW + 0.12), "ringpop", { gain: 0.4, reason: "the thought bubble pops in over Wedge" });
look(READW, "wdg", [0.9, 0.05], 0.01);
see(READ, READW, ["spud.face", "glow"], "Spud's eyes light up blue-white");
see(READW, CALL, ["wdg.face", "bW"], "over Wedge's head a bubble: the 2 and the 7, a bluff; Wedge still grins");

// ================================================================= 04 THE CALL (4.7-6.5): his cards on the felt, the pot raked in
c.say(r3(CALL + 0.05), "spud", "call!", 0.5, "excited", { voice: false, sub: "Call!" });
c.arm(CALL, "spud", "L", felt(0.5, 0.12, 0.06), 0.25, "in");
P(r3(CALL + 0.24), "sFan", { scale: 0.001 }); P(r3(CALL + 0.24), "sC1", { scale: 1 }); P(r3(CALL + 0.24), "sC2", { scale: 1 });
sfx(r3(CALL + 0.25), "slap", { gain: 0.6 });
// the rake: both gloves out to the pot's far side, then back to him with the pot
c.arm(r3(CALL + 0.45), "spud", "L", felt(0.08, 0.1), 0.3, "inOut"); c.arm(r3(CALL + 0.45), "spud", "R", felt(0.12, -0.35), 0.3, "inOut");
c.arm(r3(CALL + 0.85), "spud", "L", felt(0.55, 0.1), 0.6, "inOut"); c.arm(r3(CALL + 0.85), "spud", "R", felt(0.6, -0.35), 0.6, "inOut");
P(r3(CALL + 0.85), "pot", { x: 0.42 }, 0.6, "inOut"); sfx(r3(CALL + 0.85), "ai/bowl-scrape", { gain: 0.5 });
expr(r3(CALL + 0.3), "spud", "delighted");
expr(r3(CALL + 0.28), "wdg", "shocked", { open: 0.9, eye: 1.4 }); A(r3(CALL + 0.3), "wdg", "lean", { to: -8, dur: 0.2 });
c.arm(r3(CALL + 0.35), "chip", "L", "up", 0.3, "back"); c.arm(r3(CALL + 0.35), "chip", "R", "up", 0.3, "back");
c.say(r3(CALL + 0.7), "chip", "let's go!", 0.6, "excited", { voice: false, sub: "Let's go!" });
A(r3(CALL + 0.4), "chip", "hop", { count: 3, height: 0.07 });
see(CALL, HEADS, ["spud.face", "wdg.face", "pot"], "Spud calls, slaps his cards down and rakes the pot in; Wedge's jaw drops");

// ================================================================= 05 EVERY HEAD (6.5-8.1): he reads the whole table
c.arm(r3(HEADS - 0.3), "chip", "L", "lap", 0.4, "inOut"); c.arm(r3(HEADS - 0.3), "chip", "R", "lap", 0.4, "inOut");
c.arm(r3(HEADS - 0.4), "spud", "L", felt(0.72, 0.1), 0.4, "inOut"); c.arm(r3(HEADS - 0.4), "spud", "R", felt(0.78, -0.3), 0.4, "inOut");
P(r3(HEADS - 0.05), "pot", { scale: 0.001 });
for (const [i, id] of ["sS2", "sS3", "sS4"].entries()) Pk("casino", r3(HEADS - 0.05 + i * 0.02), id, { n: 12 }, 0.01);
Pk("casino", HEADS, "sS1", { n: 12 }, 0.01);
Pk("mind", r3(HEADS + 0.2), "bC", { pop: 1 }, 0.3, "back"); Pk("mind", r3(HEADS + 0.45), "bM", { pop: 1 }, 0.3, "back");
sfx(r3(HEADS + 0.22), "ringpop", { gain: 0.35 }); sfx(r3(HEADS + 0.47), "ringpop", { gain: 0.35 });
expr(HEADS, "spud", "cocky", { curve: 0.6 }); look(HEADS, "spud", [-0.5, 0.35], 0.3);
expr(HEADS, "wdg", "annoyed"); expr(HEADS, "chip", "eager");
see(HEADS, MOUNT, ["spud.face", "bW", "bC", "bM"], "a bubble over every friend: cards, pizza, a phone; Spud grins behind his stacks");

// ================================================================= 06 THE MOUNTAIN (8.1-9.9): he wins everything
for (const id of ["sS1", "sS2", "sS3", "sS4"]) P(r3(MOUNT - 0.03), id, { scale: 0.001 });
Pk("casino", r3(MOUNT - 0.03), "mount", { grow: 0.35 }); P(MOUNT, "mount", { grow: 1 }, 1.2, "out");
if (!has("casino")) P(MOUNT, "mount", { h: 1.45 }, 1.2, "out");
sfx(MOUNT, "ai/bowl-scrape", { gain: 0.6, reason: "the chips piling up into a tower" }); sfx(r3(MOUNT + 0.6), "crumble", { gain: 0.3 });
c.arm(r3(MOUNT + 0.15), "spud", "L", "up", 0.35, "back"); c.arm(r3(MOUNT + 0.15), "spud", "R", "up", 0.35, "back");
expr(r3(MOUNT + 0.1), "spud", "delighted", { open: 0.6 }); look(MOUNT, "spud", [0, 0.6], 0.3);
for (const w of ["wdg", "chip"]) { expr(r3(MOUNT + 0.2), w, "shocked", { open: 0.6 }); }
look(r3(MOUNT + 0.2), "mash", [0.3, 0.4], 0.25); expr(r3(MOUNT + 0.2), "mash", "shocked", { open: 0.3 });
see(MOUNT, SPREAD, ["spud.face", "mount"], "a mountain of chips towers over Spud, arms up; the others have nothing");

// ================================================================= 07 THE SPREAD (9.9-11.9): it does not switch off
c.arm(r3(SPREAD + 0.05), "spud", "R", "lap", 0.35, "inOut");
c.arm(r3(SPREAD + 0.05), "spud", "L", { o: [-0.02, 0.86, 0.14] }, 0.35, "inOut");   // a glove up at his temple
expr(r3(SPREAD + 0.05), "spud", "focused", { curve: -0.2, brow: 0.3 });
look(r3(SPREAD + 0.3), "spud", [-0.4, 0.35], 0.3);
GUESTS.forEach((g, i) => { Pk("mind", r3(SPREAD + 0.35 + i * 0.12), `gb${i}`, { pop: 1 }, 0.3, "back"); });
for (let i = 0; i < 6; i++) sfx(r3(SPREAD + 0.37 + i * 0.22), "ringpop", { gain: 0.25 });
Pk("mind", r3(SPREAD + 0.6), "fHall", { fill: 0.35 }, 1.3, "inOut");
see(SPREAD, CITY, ["spud.face", "gb0", "gb5"], "his smile gone: a bubble over every guest on the casino floor, more and more");

// ================================================================= 08 THE CITY (11.9-13.3): every roof, every window
Pk("mind", r3(CITY - 0.02), "fCity", { fill: 0.25 }); Pk("mind", CITY, "fCity", { fill: 1, rise: 6 }, 1.4, "in");
sfx(CITY, "windswell", { gain: 0.5, reason: "the sky over the city filling with thoughts" }); sfx(r3(CITY + 0.4), "ai/magic-zap", { gain: 0.3 });
see(CITY, FLOOD, ["fCity"], "the neon city at night: a glowing bubble over every roof and window, thousands");

// ================================================================= 09 THE FLOOD (13.3-14.9): the casino crammed with thoughts
Pk("mind", r3(FLOOD - 0.02), "fHall", { fill: 1 }); Pk("mind", r3(FLOOD - 0.02), "fNear", { fill: 0.8 }); Pk("mind", FLOOD, "fNear", { fill: 1 }, 0.8);
c.arm(r3(FLOOD - 0.02), "spud", "L", "cheeks", 0.01); c.arm(r3(FLOOD - 0.02), "spud", "R", "cheeks", 0.01);
expr(r3(FLOOD - 0.02), "spud", "terrified", { open: 0.3, eye: 0.6, squint: 0.8 }, 0.01);
c.say(r3(FLOOD + 0.35), "spud", "too loud!", 0.7, "excited", { voice: false, sub: "Too loud!" });
sfx(FLOOD, "rumble", { gain: 0.5, reason: "a roar of thousands of thoughts at once" });
for (const w of ["wdg", "chip"]) expr(FLOOD, w, "shocked", { open: 0.4 });
see(FLOOD, KEYS, ["spud.face", "fNear"], "the casino packed wall to wall with bubbles; Spud's gloves on his head");

// ================================================================= 10 THE KEYS (14.9-16.9): Wedge bets his car keys; Spud can't find his thought
c.arm(r3(KEYS - 0.2), "spud", "L", "lap", 0.2); c.arm(r3(KEYS - 0.2), "spud", "R", "lap", 0.2);
c.arm(r3(KEYS - 0.05), "wdg", "L", felt(-0.5, 0.15, 0.06), 0.2, "in");
P(r3(KEYS + 0.15), "keys", { scale: 1 }); sfx(r3(KEYS + 0.16), "slam", { gain: 0.7 }); c.at(r3(KEYS + 0.16), { fx: "impact", at: [-0.5, TH + 0.05, 0.15], dur: 0.25 });
c.arm(r3(KEYS + 0.45), "wdg", "L", "hips", 0.35, "inOut");
c.say(r3(KEYS + 0.3), "wdg", "car keys. all in.", 0.8, "calm", { voice: false, sub: "Car keys. All in." });
expr(r3(KEYS + 0.1), "wdg", "cocky", { curve: 0.6, lid: 0.4 });
Pk("mind", r3(KEYS + 0.3), "fWdg", { fill: 1 }, 0.5, "out");
// Spud searches the hundreds of bubbles over Wedge: up on his feet, both gloves swatting them apart
A(r3(KEYS + 0.55), "spud", "stand", { dur: 0.35 });
c.arm(r3(KEYS + 0.8), "spud", "L", "up", 0.25, "inOut"); c.arm(r3(KEYS + 0.8), "spud", "R", { o: [0.25, 0.85, 0.3] }, 0.25, "inOut");
c.arm(r3(KEYS + 1.1), "spud", "L", { o: [0.25, 0.85, 0.3] }, 0.25, "inOut"); c.arm(r3(KEYS + 1.1), "spud", "R", "up", 0.25, "inOut");
look(r3(KEYS + 0.8), "spud", [-0.9, 0.45], 0.2); expr(r3(KEYS + 0.8), "spud", "terrified", { open: 0.5 });
c.say(r3(KEYS + 1.0), "spud", "which one is yours?!", 0.8, "excited", { voice: false, sub: "Which one is yours?!" });
// he can't find it, so he guesses: all in, the whole mountain pushed to the middle
c.arm(r3(KEYS + 1.55), "spud", "L", felt(0.98, 0.12), 0.2, "in"); c.arm(r3(KEYS + 1.55), "spud", "R", felt(0.98, -0.32), 0.2, "in");
P(r3(KEYS + 1.6), "mount", { x: 0.05 }, 0.35, "inOut"); sfx(r3(KEYS + 1.6), "ai/bowl-scrape", { gain: 0.6 });
see(KEYS, ACES, ["wdg.face", "spud.face", "keys"], "Wedge slams his car keys down; Spud stands, swatting through the bubbles over Wedge's head, then pushes it all in");

// ================================================================= 11 FOUR ACES (16.9-18.9): Wedge wins it all
const ACES_AT = (() => { const [x, z] = P2(SEAT.wdg, YAW.wdg, 0.42, 0.16); return [x, 1.05, z]; })();
P(r3(ACES - 0.03), "aces", { x: ACES_AT[0], y: ACES_AT[1], z: ACES_AT[2], rot: 0, spread: 0 });
c.arm(r3(ACES - 0.03), "wdg", "L", { prop: "aces", grip: [0, 0.03, -0.02], palm: true }, 0.01); A(r3(ACES - 0.03), "wdg", "grip", { side: "L", shape: "hold", dur: 0 });
Pk("casino", r3(ACES + 0.1), "aces", { spread: 1 }, 0.35, "out"); sfx(r3(ACES + 0.1), "papercut", { gain: 0.5, reason: "four cards fanned out" });
c.say(r3(ACES + 0.3), "wdg", "four aces.", 0.7, "calm", { voice: false, sub: "Four aces." });
expr(r3(ACES + 0.05), "wdg", "smug", { curve: 0.7, lid: 0.5 });
// he sweeps the whole mountain to his side with his right arm
c.arm(r3(ACES + 0.9), "wdg", "R", felt(0.12, -0.3), 0.3, "inOut"); c.arm(r3(ACES + 1.25), "wdg", "R", felt(-0.62, -0.2), 0.55, "inOut");
P(r3(ACES + 1.25), "mount", { x: -0.48 }, 0.55, "inOut"); sfx(r3(ACES + 1.25), "ai/bowl-scrape", { gain: 0.6 });
// Spud sinks back into his chair, empty-handed, the bubbles still everywhere
A(r3(ACES + 0.4), "spud", "sit", { seat: "chS", dur: 0.4, hands: "keep" });
c.arm(r3(ACES + 0.5), "spud", "L", "lap", 0.35, "inOut"); c.arm(r3(ACES + 0.5), "spud", "R", "lap", 0.35, "inOut");
act.defeated(c, r3(ACES + 0.9), "spud", { turn: -10, hold: 1.0 });
for (const w of ["chip", "mash"]) expr(r3(ACES + 0.3), w, "shocked", { open: 0.5 });
see(ACES, NIGHT, ["wdg.face", "aces", "spud.face"], "Wedge fans four aces at us and sweeps the mountain away; Spud slumps, empty gloves");

// ================================================================= 12 THE HOTEL ROOM (18.9-21.9): it is never quiet again
A(r3(NIGHT - 0.06), "spud", "stand", { dur: 0.01 });
place(NIGHT, "spud", [HX + BED[0], BED[1]], 0);
if (has("city")) A(r3(NIGHT - 0.01), "spud", "sit", { seat: "bed", height: 0.5, dur: 0.01, hands: "keep" });
for (const w of ["wdg", "chip", "mash"]) A(r3(NIGHT - 0.02), w, "hide");
P(r3(NIGHT - 0.02), "glow", { on: 1, pulse: 1 });
const PILLOW_AT = [HX + BED[0], 1.36, BED[1]];   // on his head: the mattress 0.5 + Spud 0.88 less the seat drop
P(r3(NIGHT - 0.03), "pillow", { x: PILLOW_AT[0], y: PILLOW_AT[1], z: PILLOW_AT[2], rot: 0 });
c.arm(r3(NIGHT - 0.03), "spud", "L", { prop: "pillow", grip: [-0.22, 0.0, 0.0], palm: true }, 0.01); c.arm(r3(NIGHT - 0.03), "spud", "R", { prop: "pillow", grip: [0.22, 0.0, 0.0], palm: true }, 0.01);
A(r3(NIGHT - 0.03), "spud", "grip", { side: "L", shape: "hold", dur: 0 }); A(r3(NIGHT - 0.03), "spud", "grip", { side: "R", shape: "hold", dur: 0 });
expr(r3(NIGHT - 0.02), "spud", "terrified", { open: 0.05, eye: 1.35, curve: -0.3 }, 0.01); look(r3(NIGHT - 0.02), "spud", [0, 0.1], 0.01);
Pk("mind", r3(NIGHT - 0.02), "fRoom", { fill: 0.6 }); Pk("mind", NIGHT, "fRoom", { fill: 1 }, 2.5, "linear");
Pk("mind", r3(NIGHT - 0.02), "fStream", { fill: 1, pull: 0 }); Pk("mind", NIGHT, "fStream", { pull: 1 }, 3.0, "linear");
sfx(NIGHT, "rumble", { dur: 3, gain: 0.25, reason: "the city's thoughts murmuring through the window" });
look(r3(NIGHT + 1.4), "spud", [0.3, 0.2], 0.3); A(r3(NIGHT + 1.5), "spud", "blink", { dur: 0.22 });
cap(r3(NIGHT + 1.1), END, "Would you still want it?", 920);
see(NIGHT, END, ["spud.face", "glow"], "night, a hotel room high above the city: Spud awake, pillow on his head, the thoughts streaming in");

// ---------------------------------------------------------------- shots (camera A looks -z from the front of the table)
const SH = {
  allin:  { pos: [0.15, 1.5, 3.5], look: [0, 0.85, -0.45], fov: 42, to: { pos: [0.1, 1.45, 3.15], look: [0, 0.88, -0.45], fov: 42 }, dur: STARE, ease: "linear" },
  wdgS:   { pos: [-0.35, 1.2, 1.25], look: [-1.42, 1.05, -0.3], fov: 40 },
  spudS:  { pos: [0.35, 1.2, 1.25], look: [1.42, 1.0, -0.3], fov: 40, to: { pos: [0.45, 1.18, 1.0], look: [1.42, 1.02, -0.3], fov: 40 }, dur: r3(READ - STARE2), ease: "linear" },
  read:   { pos: [0.55, 1.15, 0.85], look: [1.42, 1.08, -0.3], fov: 38, to: { pos: [0.7, 1.12, 0.62], look: [1.42, 1.08, -0.3], fov: 38 }, dur: r3(READW - READ), ease: "in" },
  pov:    { pos: [1.05, 1.32, 0.15], look: [-1.42, 1.55, -0.3], fov: 44 },
  call:   { pos: [0.85, 1.4, 2.8], look: [0.15, 0.85, -0.35], fov: 48 },
  heads:  { pos: [0, 1.75, 3.4], look: [0, 1.25, -0.6], fov: 52 },
  // 06 (panel): over the backs of Wedge and Mash across the table at Spud, the mountain towering over him
  mount:  { pos: [-2.55, 1.25, 0.55], look: [0.9, 1.35, -0.3], fov: 52, to: { pos: [-2.4, 1.15, 0.5], look: [0.9, 1.55, -0.3], fov: 54 }, dur: r3(SPREAD - MOUNT), ease: "out" },
  // 07 (panel): Spud alone, face to us, the casino floor and its guests behind him (the camera stands where Wedge looks from)
  spread: { pos: [-0.15, 1.3, 0.8], look: [1.6, 1.45, -0.55], fov: 56, to: { pos: [-0.35, 1.38, 0.95], look: [1.8, 1.6, -0.8], fov: 60 }, dur: r3(CITY - SPREAD), ease: "linear" },
  city:   { pos: [CX, 40, 25], look: [CX, 10, -40], fov: 55, to: { pos: [CX, 41, 21], look: [CX, 11, -40], fov: 55 }, dur: r3(FLOOD - CITY), ease: "linear" },
  flood:  { pos: [0.05, 1.22, 0.65], look: [1.5, 1.08, -0.3], fov: 52 },
  keys:   { pos: [0.1, 1.55, 3.1], look: [0, 1.0, -0.4], fov: 50 },
  aces:   { pos: [-0.25, 1.35, 2.5], look: [-0.55, 0.98, -0.4], fov: 52 },
  hotel:  { pos: [HX - 0.1, 1.35, 2.3], look: [HX + 0.05, 1.15, -1.5], fov: 52, to: { pos: [HX - 0.15, 1.3, 1.7], look: [HX + 0.0, 1.15, -1.5], fov: 52 }, dur: r3(END - NIGHT), ease: "linear" },
};
const CUTS = [
  ["01 all-in", 0, SH.allin, "hook"],
  ["02 Wedge stares", STARE, SH.wdgS],
  ["02 Spud gulps", STARE2, SH.spudS],
  ["03 the eyes glow", READ, SH.read],
  ["03 the bubble over Wedge", READW, SH.pov, "reveal"],
  ["04 the call", CALL, SH.call],
  ["05 every head", HEADS, SH.heads],
  ["06 the mountain", MOUNT, SH.mount],
  ["07 the spread", SPREAD, SH.spread],
  ["08 the city", CITY, SH.city],
  ["09 the flood", FLOOD, SH.flood, "payoff"],
  ["10 the keys", KEYS, SH.keys],
  ["11 four aces", ACES, SH.aces],
  ["12 the hotel room", NIGHT, SH.hotel, "reaction"],
];

// ---------------------------------------------------------------- the commentator (voice 1, "narrator"), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0, process.env.TITLE ?? "What if you could read minds?", 1, 2.0, NG],
  [r3(MOUNT + 0.35), "You'd never lose again.", 1, 1.5, NG],
  [r3(SPREAD + 0.3), "But there's a catch.", 1, 1.1, NG],   // the catch itself is SHOWN (the spread, the flood, the lost hand): no line explains it
  [r3(NIGHT + 1.1), "Would you still want it?", 1, 1.33, NG],
];
for (const [t, line, take, , gain] of NARR) c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });

// the casino's room tone under the game
sfx(0, "ai/step-carpet", { gain: 0.001, reason: "placeholder so the sound pass knows the floor is carpet" });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);

const allowClip = [
  ...Object.entries(CHAIR).map(([who, ch]) => ({ who, with: ch, from: 0, to: NIGHT, reason: "seated in his chair" })),
  { who: "mash", with: "mphone", from: 0, to: NIGHT, reason: "his phone in his glove (he never looks up)" },
  { who: "spud", with: "sFan", from: 0, to: r3(CALL + 0.3), reason: "his two cards held to his chest" },
  { who: "wdg", with: "aces", from: ACES, to: NIGHT, reason: "four aces fanned in his glove" },
  { who: "spud", with: "bed", from: NIGHT, to: END, reason: "sitting up on the hotel bed" },
  { who: "spud", with: "pillow", from: NIGHT, to: END, reason: "the pillow pressed on his head with both gloves" },
  { who: "spud", with: "glow", from: 0, to: END, reason: "the glowing eyes are worn on his face" },
];

write(import.meta.url, {
  id: VO ? "read-minds" : "read-minds-no-vo",
  title: "What if you could read minds? But there's a catch.",
  idea: "There's a catch, episode 6: Spud can suddenly read minds at a casino poker table; he wins everything, then the power spreads to the whole city and he loses it all because he can't find the one thought that matters",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [470, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#2a1418", floor: "#5a1a1e", light: "warm", para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  // music that supports the story (Jonny 11 Nov): from 0.0, changes at the turn. Tense poker suspense under the game,
  // then a frantic orchestra from "But there's a catch" (recorded beds, never a synthesised style for danger: Jonny 12 Nov)
  music: { file: process.env.MUSIC ?? "ai/sos-tension/sos-tension-01.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, until: r3(SPREAD + 0.25),
    then: { file: process.env.MUSIC2 ?? "ai/disaster/disaster-01.ogg", from: r3(SPREAD + 0.25), gain: 0.7 } },
  sound: { sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "carpet", room: "room", guard: true },
  hook: { show: ["wdg", "spud", "pot"], hint: 0, what: "a poker all-in already running: Wedge shoves every chip into the pot, Spud with three chips left" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/06-read-minds/make-read-minds.mjs.",
});
