// YOUR BROKE FRIEND CAN COPY MONEY. THERE'S A CATCH. (There's a catch, episode 4, the series that was "What if";
// Jonny's go 10 Nov 2026: "lets build the next what if episode with the new workflow ... 03-copy-money-EXTREME-v2.md").
// Brief: /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (+ 00-SERIES-FORMAT.md,
// 00-RENAME-THERES-A-CATCH.md). Jonny's panel sheet was drawn for v1: its panels 01-03 are the target for the diner,
// the cast and frame 0 (PANELS.md here); 04-08 follow the v2 script's panel table.
//   node storyboards/series/what-if/04-copy-money/make-copy-money.mjs -> copy-money.json
//   ... --no-vo -> copy-money-no-vo.json: without the commentator (no speech model needed: staging and drafts)
//
// THE BRIEF
//   Joke:        Gunslinger never has money: one coin and a moth. Now he can copy it: one coin, then a hundred wallets
//                that pay back every IOU he ever wrote, then every dollar in the city: a wave of banknotes rolls down
//                the street, he buys the diner and sits on a throne of cash. "Everything's on me. Forever."
//   Wants:       Gunslinger wants to be the one who pays, for once and for ever.
//   Consequence: money only works while it's rare: the price board flips past billions until its flaps blow off, and
//                a wheelbarrow of cash doesn't buy one milkshake.
//   Ending:      night, snow, the diner dark: he burns bundles of his money in a barrel to keep warm. Reaper hands
//                him one coffee. The wink: "Next time's on me."
//   Callback:    frame 0 Reaper reaches for his wallet to pay for him again; the last frame Reaper has paid again.
// The power: the word "COPY!", the sound (a cash-register ka-ching) and the look (a gold shimmer round the thing and an
// exact copy popping out beside it with a little bounce), the same every time.
//
// THE CLOCKS: two speed ramps: the opening under the spoken title (story 0-0.6 over OPEN_VIDEO s) and the 10x (the
// slap, the sign, the bow: story 9.4-10.0 over 1.6 s). Every time below is story time; VT() gives video time.
//
// WORLD (x right, z toward the main camera): the Never Has Money diner seen from the customers' side (Jonny's panels):
// the kitchen wall behind the counter man at z -2.7, the counter along x at z 0, the window wall behind the main
// camera at z +4 (shown only in the reverse shots, 8.3-12.8). The night ending stands 40 m to the right (x 40).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { BRIM } from "../../never-has-money/pocket-pat.mjs";
import { wink } from "../../never-has-money/wink.mjs";
import { holdsOf, renderTime, storyTime } from "../../../../engine/shared/holds.js";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builders' props: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "money,flood,twist,night").split(",").filter(Boolean));   // the prop packs that exist; a missing pack gets stand-ins
const ph = (pack, final, stand) => (READY.has(pack) ? final : { id: final.id, x: final.x, y: final.y, z: final.z, ...(final.rot != null && { rot: final.rot }), ...(final.wear && { wear: final.wear }), ...stand });

// ---------------------------------------------------------------- the clocks
const TITLE = "Your broke friend can copy money. There's a catch.", TITLE_TAKE = 3, TITLE_LEN = 3.5;   // the read: take 3, 3.72 s file, last word ends 3.36 s (Whisper: word for word)
const OPEN_VIDEO = r3(Math.ceil((TITLE_LEN + 0.25) * 30) / 30);
const OPEN_SLOW = { at: 0, len: 0.6, rate: r3(0.45 / (OPEN_VIDEO - 0.15)), in: 0, out: 0.3 };
const FREEZE = 10.6, HOLD = 1.0;
const SLOW = { at: 10.0, len: 0.6, rate: 0.26, in: 0.25, out: 0.25 };   // 0.6 s of story in 48 frames
const CLOCK = holdsOf({ fps: 30, fx: [...(VO ? [{ do: "ramp", ...OPEN_SLOW }] : []), { do: "ramp", ...SLOW }] });
const VT = (story) => r3(renderTime(CLOCK, story)), ST = (video) => r3(storyTime(CLOCK, video));
const rad = (d) => (d * Math.PI) / 180;
// a point in front of someone at `at` facing `yaw` (0 = to the main camera, 90 = to +x): fwd ahead, side to their right
const front = (at, yaw, fwd, side, y) => [r3(at[0] + Math.sin(rad(yaw)) * fwd - Math.cos(rad(yaw)) * side), r3(y), r3(at[1] + Math.cos(rad(yaw)) * fwd + Math.sin(rad(yaw)) * side)];
const setup = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0 }); if (yaw != null) A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01 }); };
const hide = (t, who) => A(r3(t), who, "hide", { dur: 0 });
const show = (t, who) => A(r3(t), who, "show", { dur: 0 });

// ---------------------------------------------------------------- the scenes (hard cuts), story time
const SNAP1 = 0.9, COPY1 = 0.93;             // the cut to the medium on him; "COPY!": two coins
const VICTIM = 1.55;                         // Reaper, wallet half out, frozen
const DEMO1 = 2.5;                           // he pays with the two coins; the bite
const DEMO2 = 4.0, COPY2 = 4.5, FLING = 5.15, READ = 5.9;   // a hundred wallets; the IOUs rain on Reaper; he reads one
const DEMO3 = 7.5, WAVE = 8.3, SLAP_CUT = 9.85, SLAP = 10.15;  // COPY x3; the reverse wide; the slap (inside the slow motion)
const SNAP2 = 10.6, SIT = 10.85;             // the throne (video 11.6)
const TWIST = 12.4, BLOW = 13.7, BARROW = 14.0, SHAKE = 14.5;   // the board runs away (its own shot); the wheelbarrow tipped; the head shake
const NIGHT = 15.1, REA_IN = 16.9, QUESTION = 18.4, HAND = 18.7, WINK = 19.9;   // the fact (3.3 s to read); Reaper walks in; the coffee; the wink
const END = 21.05;

// ---------------------------------------------------------------- places (a potato is about 0.9 m wide and 1.1 m tall)
const CH = 0.38, CX = 1.7, CW = 3.2;         // the counter: top, middle, width (x 0.1 .. 3.3), z -0.3 .. 0.3
const TOP = r3(CH + 0.004);
const GSL0 = [-0.65, 0.2], GSL0_YAW = 30;     // beside the counter's left end, open to us (panel 01)
const SAM_A = [1.15, -0.95], SAM_A_YAW = -25; // behind the counter, turned to him
const REA0 = [0.95, 2.4], REA0_YAW = -14;     // in front, right (panel 01)
const WIZ0 = [-1.95, -1.3], WIZ0_YAW = 60;    // by the window in the back corner (out of frame 0)
const BILL = [0.36, 0.1];                     // the bill slip on the counter's corner
const BOARD = [0.7, 1.72, -1.6];             // the flip board hangs over the back counter (its bottom edge)
// demo 3 and the throne play at the counter's left end, in front of the window wall (the left wall, x -2.4): he
// stays where he is, the friends go to the glass, the throne stacks up behind him
const WALL_X = -2.4;
const GSL_C = [-0.36, 0.2], THRONE = [-1.7, 0.55];
const GLASS = { sam: [-1.75, -0.8], wiz: [-1.85, 0.25], rea: [-1.9, 1.25] };    // everyone but him runs to the window
const SAM_BOW = [-1.6, -0.95], SAM_BOW_YAW = 53;     // he turns from the glass and bows to the new owner
const WIZ_R = [-1.95, -0.7], REA_R = [-1.95, 1.8], THK = 1.25;                    // either side of the throne (the throne 1.25 x: its back stands over his hat)
const OFF = { wiz: [3.3, 1.5], rea: [3.6, 2.7] };                              // out of the twist's frame
// the twist: he wheels the barrow to the counter's left end
const BARROW1 = [-0.5, 0.1], BK = 0.85, GSL_T = [-1.5, 0.1], GSL_T_YAW = 60, SAM_T = [0.62, -0.78], SAM_B = [0.7, -1.1];   // the barrow at the counter's end (it points +x), him at its handles; the counter man at the till, and under the board
const SHK = 0.8;   // the one milkshake, in the counter man's glove
const GSL1 = [-0.45, 0.1], GSL1_YAW = 35;                 // demo 1 and 2: one step toward the counter's corner, 3/4 to us
const SAM_PAY = [0.45, -0.76], SAM_PAY_YAW = -30;         // demo 1: the counter man at the counter's corner, across from him
// the night ending, 40 m to the right
const NX = 40, GSL_N = [NX, 0.5], GSL_N_YAW = -50, GSL_N2 = 15, BARREL = [NX - 0.85, 0.5], BARK = 0.75, REA_N0 = [NX + 2.9, 0.7], REA_N = [NX + 1.05, 0.6], REA_N_YAW = -40;

const cast = [
  { id: "gsl", character: "never-has-money/gunslinger", at: GSL0, face: GSL0_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: REA0, face: REA0_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM_A, face: SAM_A_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "wiz", character: "never-has-money/wizard", at: WIZ0, face: WIZ0_YAW, expr: "kind", follow: 0.3, seed: 2.6 },
];

// ---------------------------------------------------------------- props
const WK = 1.5, W = 0.12 * WK;                 // the wallet drawn 1.5x (frame 0 has to read "empty wallet" at phone size); its half width
const rotY = ([x, y, z], d) => { const a = rad(d); return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
const body = (at, yaw) => (p) => { const q = rotY(p, yaw); return [r3(at[0] + q[0]), r3(q[1]), r3(at[1] + q[2])]; };
const G0 = body(GSL0, GSL0_YAW);
const HOLSTER = G0([-0.46, 0.28, -0.08]);      // his right hip (pocket-pat.mjs)
const WGRIP = [r3(-W - 0.035), 0, 0];          // the wallet's back half's outer edge
const WHOLD = G0([-0.1, 0.5, 0.42]);           // the open wallet in front of his right chest
const COIN_UP = G0([0.36, 0.5, 0.4]);          // the one coin held up in his left pinch, beside his chest
const HAS_COIN = READY.has("money");
// the coin: the real one has its origin at its centre (r 0.085); the stand-in button stands on its bottom
const COINK = HAS_COIN ? { kind: "coin", scale: 1, len: -0.1417, lo: 0.53, hi: -0.5 } : { kind: "button", scale: 2.4, len: 0.0267, lo: 0.12, hi: 0.92 };   // lo, hi: where a glove pinches it (grips.thin `from`): its bottom rim, its top rim
const CK = COINK.scale;
const COIN = (id, p) => (HAS_COIN ? { id, kind: "coin", x: p[0], y: p[1], z: p[2], rot: GSL0_YAW, shine: 0 } : { id, kind: "button", x: p[0], y: p[1], z: p[2], rot: GSL0_YAW, color: "#f2c23a", scale: CK });
const BRK = 1.5, BUK = 0.8;   // the brick of the slap is big; the bundle for the fire is small
const BRICK = (id, p, o = {}) => ph("money", { id, kind: "cashbrick", x: p[0], y: p[1], z: p[2], squash: 0, ...o }, { kind: "crate", size: 0.2 });
const props = [
  { id: "floor", kind: "checkerfloor", x: 1.0, z: 1.0, w: 10, d: 9, tile: 0.32 },
  { id: "counter", kind: "dinercounter", x: CX, z: 0, w: CW, d: 0.6, h: CH, rot: 180 },
  { id: "lamp1", kind: "pendant", staged: "hangs from the ceiling on its cord", x: 0.0, y: 2.45, z: -0.1, len: 1.6 },
  { id: "lamp2", kind: "pendant", staged: "hangs from the ceiling on its cord", x: 2.6, y: 2.45, z: -0.1, len: 1.6 },
  { id: "bill", kind: "receipt", x: BILL[0], y: TOP, z: BILL[1], rot: 20 },
  { id: "cond", kind: "condiments", x: 2.2, y: CH, z: -0.12, rot: 188 },
  { id: "jar", kind: "tipjar", x: 1.75, y: CH, z: -0.14 },
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, y0: 0.4, y1: 0.07, rx: 0.44, rz: 0.39, arc: 130 },
  { id: "hat", kind: "paperhat", wear: "sam", x: 0, y: 1.02, z: 0.02, scale: 1.0 },
  // his wallet (the series prop) and the moth
  { id: "wallet", kind: "wallet", x: HOLSTER[0], y: HOLSTER[1], z: HOLSTER[2], rot: r3(GSL0_YAW + 90), open: 0, scale: WK, staged: "in his holster (a pocket on his right hip)" },
  { id: "moth", kind: "mott", wear: "gsl", x: 0, y: 0.6, z: 0.5, r: 0.045, scale: 0.001, open: 0, flap: 0, bob: 0, hope: 0.6, lookX: 0, lookY: 0,
    palette: { fluff: "#f4ead2", collar: "#e9dcbc", wing: "#f3e2c4", band: "201,162,122", rose: "#c9a27a", blush: "#efc9b4", dust: "#e9dcc4" },
    staged: "a moth: it flies, then sits on his hat brim (worn)" },
  // Reaper's own wallet, half out of his robe
  { id: "rwal", kind: "wallet", ...(() => { const p = front(REA0, REA0_YAW, 0.46, 0.14, 0.5); return { x: p[0], y: p[1], z: p[2] }; })(), rot: REA0_YAW, open: 0, scale: WK },
  COIN("coin1", COIN_UP), { ...COIN("coin2", COIN_UP), scale: 0.001, staged: "the copy: it pops out of the shimmer beside the first coin" },
  // the flip price board over the back counter
  ph("twist", { id: "board", kind: "flipboard", x: BOARD[0], y: BOARD[1], z: BOARD[2], w: 1.3, h: 0.62, drop: BOARD[1], stage: 0, blow: 0, clock: 0, staged: "the price board hangs on the kitchen wall" }, { kind: "sign", text: "4.50", y: BOARD[1] - 0.55 }),
  // demo 2: the hundred wallets in his arms; the IOU notes
  ph("money", { id: "heap", kind: "walletheap", ...(() => { const q = front(GSL1, 30, 0.42, 0, 0.34); return { x: q[0], y: q[1], z: q[2] }; })(), rot: 30, n: 0, count: 100, spill: 0, wobble: 0, floor: 0.34, staged: "the copies: a hundred wallets pop into his arms" }, { kind: "coins", scale: 0.001 }),
  ph("flood", { id: "ious", kind: "noterain", x: REA0[0], y: 0, z: REA0[1], look: "iou", n: 60, r: 0.9, top: 3.2, clock: 0, amount: 0 }, { kind: "leaves", scale: 0.001 }),
  { id: "iou", kind: "iounote", x: REA0[0], y: -2, z: REA0[1], rot: REA0_YAW, ink: 1 },
  // demo 3: the bricks of cash, the throne, the window wall and the wave
  BRICK("brick", [0.3, -2, 0.0], { scale: BRK }),
  ph("money", { id: "throne", kind: "cashthrone", x: THRONE[0], y: 0, z: THRONE[1], rot: 90, scale: THK, w: 1.25, d: 1.0, seat: 0.42, back: 1.7, build: 0 }, { kind: "crate", size: 0.42, scale: 0.001 }),
  ph("flood", { id: "wall", kind: "windowwall", x: WALL_X, y: 0, z: 0.2, rot: 90, h: 8, cy: 1.61, tiles: 2 }, { kind: "crate", size: 0.01 }),
  ph("flood", { id: "wave", kind: "moneywave", x: WALL_X - 2.2, y: 0, z: 0.2, rot: 90, len: 16, h: 3.3, d: 2.5, front: 0, level: 0, clock: 0 }, { kind: "crate", size: 0.01 }),
  ph("flood", { id: "spill", kind: "noteflood", x: WALL_X + 0.1, y: 0, z: 0.2, rot: 90, w: 3.6, d: 2.2, grow: 0, clock: 0 }, { kind: "crate", size: 0.01 }),
  ph("twist", { id: "dsign", kind: "dinersign", x: WALL_X - 0.45, y: 1.6, z: -0.45, rot: 90, w: 1.0, h: 0.7, flip: 0, lit: 1, staged: "the diner's sign on its pole outside the window" }, { kind: "crate", size: 0.01 }),
  // the twist: the wheelbarrow of cash and what it tips onto the counter
  ph("twist", { id: "barrow", kind: "wheelbarrow", x: BARROW1[0], y: -3, z: BARROW1[1], rot: 0, scale: BK, load: 1, dump: 0, staged: "wheeled in while the camera is on the price board" }, { kind: "crate", size: 0.7 }),
  ph("money", { id: "pile", kind: "cashheap", x: 0.33, y: CH, z: 0.05, w: 0.44, d: 0.45, h: 0.36, grow: 0 }, { kind: "coins", scale: 0.001 }),
  { id: "shake1", kind: "milkshake", x: SAM_T[0], y: -2, z: SAM_T[1], rot: 0, scale: SHK },
  // the night ending
  ph("night", { id: "barrel", kind: "oilbarrel", x: BARREL[0], y: 0, z: BARREL[1], scale: BARK, fire: 1, feed: 0, glow: 1, clock: 0 }, { kind: "crate", size: 0.62 }),
  ph("night", { id: "front", kind: "dinerfront", x: r3(BARREL[0] + 0.5), y: 0, z: r3(BARREL[1] - 2.4), w: 9, d: 9, flicker: 0 }, { kind: "crate", size: 0.01 }),
  BRICK("bundle", [GSL_N[0], -2, GSL_N[1]], { scale: BUK }),
  ph("flood", { id: "snow", kind: "noterain", x: NX + 0.3, y: 0, z: 1.5, look: "snow", n: 400, r: 5, top: 5, clock: 0, amount: 1 }, { kind: "crate", size: 0.01, y: -3 }),
  { id: "cup", kind: "papercup", x: REA_N0[0], y: -2, z: REA_N0[1], scale: 1.5 },
];
const P = (t, id, set, dur = 0, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
// params the engine has no default for jump on their first tween: seed them at 0 (props-money.js, props-flood.js headers)
const SEEDS = { money: { coin1: { shine: 0, flat: 0 }, coin2: { shine: 0, flat: 0 }, heap: { n: 0 }, throne: { build: 0 }, pile: { grow: 0 } },
  twist: { board: { stage: 0, blow: 0 }, barrow: { dump: 0 }, dsign: { flip: 0 } },
  night: { barrel: { fire: 1, clock: 0 }, front: { flicker: 0 } },
  flood: { ious: { amount: 0, clock: 0 }, wave: { front: 0, clock: 0 }, spill: { grow: 0, clock: 0 }, snow: { amount: 1, clock: 0 } } };

// the power, the same every time: "COPY!" (a text pop, his shout), the ka-ching, a gold shimmer on the thing
function power(t, on, { big = 1, pos = 600, size = 96, say = true } = {}) {
  if (say) c.say(t, "gsl", "COPY!", 0.3, "excited", { voice: false, sub: false });
  cap(t, r3(t + 0.5), "COPY!", pos, true, { size });
  sfx(r3(t + 0.02), "ding", { gain: Math.min(1.3, 0.8 * big), loud: big > 1.2, reason: "the power: the cash-register ka-ching" });
  c.at(r3(t + 0.02), { fx: "sparkle", on, dur: 0.45, color: "#ffd75a" });
}

// ================================================================ 1 FRAME 0: CAN'T PAY AGAIN? 0-0.9 (panel 01)
// He holds his open wallet in his right glove: empty, the moth flying out; his whole fortune, one coin, pinched in
// his left. The counter man's palm is out. Reaper, in front, is already reaching for his own wallet with a sigh.
c.arm(0, "gsl", "R", { prop: "wallet", grip: WGRIP }, 0.01); A(0, "gsl", "grip", { side: "R", shape: "pinch", dur: 0.01 });
A(0, "gsl", "grab", { prop: "wallet", hand: "R", grip: WGRIP, dur: 0, pose: null });
c.arm(0, "gsl", "R", { prop: "wallet", grip: WGRIP, at: WHOLD }, 0.01);
P(0, "wallet", { rot: GSL0_YAW, tip: -40, open: 1 });
// a coin pinched from frame 0 (the thin hold's pinch, storyboards/lib/grips.mjs thin: grip, shape and point)
const CGRIP = [0, r3(COINK.lo * COINK.len * CK), 0], PINCH = { shape: "tip", set: { roll: 30, lean: 30, thin: 0.006 } };
for (const [pack, ids] of Object.entries(SEEDS)) if (READY.has(pack)) for (const [id, set] of Object.entries(ids)) P(0, id, set);
const pinch0 = (t, who, side, id) => { c.arm(t, who, side, { prop: id, grip: CGRIP, point: "pinch" }, 0.01); A(t, who, "grip", { side, ...PINCH, dur: 0.01 }); A(t, who, "grab", { prop: id, hand: side, grip: CGRIP, dur: 0, pose: null, point: "pinch" }); };
pinch0(0, "gsl", "L", "coin1");
c.arm(0, "gsl", "L", { prop: "coin1", grip: CGRIP, point: "pinch", at: COIN_UP }, 0.01);
A(0, "gsl", "look", { to: [0.3, 0.2], dur: 0.01, blink: false });
A(0, "gsl", "expr", { expr: "eager", set: { curve: 0.5, open: 0.25 }, dur: 0.01 });
// the moth: out of the wallet, round his face, onto the hat brim
const M = (t, p, set = {}, dur = 0.07, ease = "inOut") => c.prop(r3(t), "moth", { x: p[0], y: p[1], z: p[2], ...set }, dur, ease);
M(0, [-0.1, 0.56, 0.44], { scale: 1, open: 1, flap: 1, bob: 0.6 }, 0);
M(0.02, [-0.2, 0.86, 0.62], { bank: -20 }, 0.2, "out"); M(0.22, [-0.4, 1.02, 0.5], { bank: -30 }, 0.15); M(0.37, [0.0, 1.14, 0.62], { bank: 10 }, 0.15);
M(0.52, [BRIM[0] + 0.06, BRIM[1] + 0.1, BRIM[2] + 0.12], { bank: 25 }, 0.12); M(0.64, BRIM, { bank: 0, bob: 0 }, 0.1, "out");
P(0.76, "moth", { open: 0, flap: 0 }, 0.12, "inOut");
sfx(0, "wings", { gain: 0.16, dur: 0.6, reason: "frame 0: the moth's wing-buzz as it flutters out of his empty wallet" });
// the counter man: palm out, flat
c.arm(0, "sam", "L", { o: [0.1, 0.5, 0.64] }, 0.01); A(0, "sam", "grip", { side: "L", shape: "flat", set: { up: 1 }, dur: 0.01 });
A(0, "sam", "look", { to: [-0.55, 0.0], dur: 0.01, blink: false }); A(0, "sam", "face", { lid: 0.4, dur: 0.01 });
// Reaper: the sigh, his wallet coming out
c.arm(0, "rea", "R", { prop: "rwal", grip: WGRIP }, 0.01); A(0, "rea", "grip", { side: "R", shape: "pinch", dur: 0.01 });
A(0, "rea", "grab", { prop: "rwal", hand: "R", grip: WGRIP, dur: 0, pose: null });
A(0, "rea", "look", { to: [-0.5, 0.25], dur: 0.01, blink: false }); A(0, "rea", "face", { lid: 0.5, dur: 0.01 });
c.macro(0.05, "rea", "sigh");
sfx(0.05, "groan", { gain: 0.3, reason: "Reaper's sigh: here we go again" });
cap(0, r3(SNAP1 - 0.02), "Can't pay again?", 480);
if (VO) c.at(OPEN_SLOW.at, { fx: "ramp", ...OPEN_SLOW });
// he looks at the coin; the wallet snaps shut and goes back in the holster (the reverse of the series' quick-draw)
A(0.5, "gsl", "look", { to: [-0.35, 0.3], dur: 0.12, blink: false });
P(0.62, "wallet", { open: 0 }, 0.06, "inOut");
c.arm(0.64, "gsl", "R", { prop: "wallet", grip: WGRIP, at: HOLSTER }, 0.17, "inOut"); P(0.64, "wallet", { rot: r3(GSL0_YAW + 90), tip: 0 }, 0.17, "inOut");
A(0.82, "gsl", "release", { prop: "wallet", to: HOLSTER, dur: 0.03 });
A(0.84, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.06 });
see(0, SNAP1, ["gsl.face", "sam.face", "rea.face", "wallet", "coin1", "board"], "frame 0: the broke friend, his empty wallet and one coin, the palm out, Reaper about to pay again");

// ================================================================ 2 SNAP 1: COPY! 0.9-1.55 (panel 02)
power(COPY1, "coin1", { pos: 520 });
const C2 = G0([-0.34, 0.52, 0.4]);             // where the copy pops out, beside the first (panel 02: a coin in each glove)
P(COPY1 + 0.02, "coin2", { x: C2[0], y: r3(C2[1] + 0.1), z: C2[2], scale: CK * 1.25 }, 0.07, "out"); P(COPY1 + 0.09, "coin2", { y: C2[1], scale: CK }, 0.1, "settle");
c.arm(COPY1 + 0.04, "gsl", "R", { prop: "coin2", grip: CGRIP, point: "pinch" }, 0.2, "out"); A(COPY1 + 0.12, "gsl", "grip", { side: "R", ...PINCH, dur: 0.1 });
A(COPY1 + 0.26, "gsl", "grab", { prop: "coin2", hand: "R", grip: CGRIP, dur: 0, pose: null, point: "pinch" });
c.arm(COPY1 + 0.27, "gsl", "R", { prop: "coin2", grip: CGRIP, point: "pinch", at: C2 }, 0.01);
if (HAS_COIN) { P(COPY1, "coin1", { shine: 1 }, 0.08, "out"); P(COPY1 + 0.1, "coin2", { shine: 1 }, 0.05); P(COPY1 + 0.5, "coin1", { shine: 0 }, 0.3); P(COPY1 + 0.5, "coin2", { shine: 0 }, 0.3); }
A(COPY1 + 0.04, "gsl", "expr", { expr: "shocked", set: { open: 0.5, eye: 1.25, curve: 0.3 }, dur: 0.1 });
A(COPY1 + 0.03, "gsl", "look", { to: [0.0, 0.25], dur: 0.08, blink: false });
A(COPY1 + 0.35, "gsl", "expr", { expr: "delighted", set: { open: 0.6, curve: 1 }, dur: 0.15 });
see(r3(COPY1 + 0.12), VICTIM, ["gsl.face", "coin1", "coin2"], "panel 02: two coins, his eyes wide");

// ================================================================ 3 THE VICTIM 1.55-2.5
A(DEMO1 - 0.5, "sam", "move", { to: SAM_PAY, dur: 0.4, ease: "inOut", steps: 2 }); A(DEMO1 - 0.5, "sam", "turn", { to: SAM_PAY_YAW, dur: 0.4 }); c.arm(DEMO1 - 0.5, "sam", "L", "rest", 0.3, "inOut"); A(DEMO1 - 0.5, "sam", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(VICTIM - 0.02, "rea", "look", { to: [-0.45, 0.3], dur: 0.01, blink: false });
act.shock(c, r3(VICTIM + 0.05), "rea", { open: 0.3, eye: 1.2, hold: 0.7 });
c.still(r3(VICTIM + 0.1), "rea", 0.7, 0);
see(r3(VICTIM + 0.05), DEMO1, ["rea.face", "rwal"], "the victim: Reaper frozen, his wallet half out");

// ================================================================ 4 DEMO 1: HE PAYS 2.5-4.0 (v1 panel 03)
// one step to the counter's corner; he holds one coin out, the counter man takes it from his glove and bites it
const PASS = [0.12, 0.62, -0.12];                                   // where the coin changes hands, over the counter's corner
const MOUTH = front(SAM_PAY, SAM_PAY_YAW, 0.47, 0, 0.5);           // in front of the counter man's mouth
A(DEMO1 - 0.5, "gsl", "move", { to: GSL1, dur: 0.4, ease: "inOut", steps: 1 }); A(DEMO1 - 0.5, "gsl", "turn", { to: GSL1_YAW, dur: 0.4 });
A(DEMO1 - 0.05, "gsl", "expr", { expr: "cocky", set: { curve: 0.8, open: 0.3 }, dur: 0.15 }); A(DEMO1 - 0.05, "gsl", "look", { to: [0.6, 0.0], dur: 0.12, blink: false });
c.arm(DEMO1 - 0.15, "gsl", "L", { prop: "coin1", grip: CGRIP, point: "pinch", at: PASS }, 0.4, "inOut");
A(DEMO1 - 0.1, "sam", "look", { to: [-0.5, 0.0], dur: 0.15, blink: false });
const scoin = grips.thin(c, "sam", { id: "coin1", kind: COINK.kind, scale: CK, x: PASS[0], y: PASS[1], z: PASS[2], rot: GSL0_YAW }, { side: "R", from: COINK.hi, roll: 30 });
const tTake = scoin.takeFrom(r3(DEMO1 + 0.25), PASS, { reach: 0.28, settle: 0.16 });      // his fingers close at about 2.95
A(r3(tTake - 0.02), "gsl", "grip", { side: "L", shape: "open", dur: 0.12 }); c.arm(r3(tTake + 0.02), "gsl", "L", "hips", 0.35, "inOut");
A(r3(tTake), "gsl", "look", { to: [0.05, 0.05], dur: 0.15, blink: false });               // to us: paid, for once
const tBite = scoin.carry(r3(tTake + 0.02), MOUTH, 0.3, "inOut");
A(r3(tBite - 0.25), "sam", "look", { to: [0.1, -0.2], dur: 0.15, blink: false }); A(r3(tBite - 0.05), "sam", "expr", { expr: "focused", set: { open: 0.3 }, dur: 0.08 });
A(tBite, "sam", "squash", { amount: 0.03, dur: 0.08 }); A(r3(tBite + 0.02), "sam", "face", { open: 0, dur: 0.05 });
sfx(r3(tBite + 0.02), "tink", { gain: 0.6, reason: "the counter man bites the coin: it is real" });
A(r3(tBite + 0.15), "sam", "expr", { expr: "shocked", set: { eye: 1.2, open: 0.15, curve: 0.1 }, dur: 0.12 });
A(r3(tBite + 0.18), "sam", "look", { to: [-0.5, 0.05], dur: 0.12, blink: false });
see(r3(DEMO1 + 0.1), r3(tTake), ["gsl.face", "sam.face", "coin1"], "panel 03: he holds the coin out over the counter's corner");
see(r3(tBite - 0.05), DEMO2, ["sam.face", "coin1"], "demo 1: the counter man bites the coin");
// both coins are pocketed at the cut
for (const [who, id] of [["sam", "coin1"], ["gsl", "coin2"]]) { A(DEMO2 - 0.03, who, "release", { prop: id, dur: 0 }); P(DEMO2 - 0.02, id, { scale: 0.001, y: -2 }); }
c.arm(DEMO2 - 0.02, "sam", "R", "rest", 0.01); A(DEMO2 - 0.02, "sam", "grip", { side: "R", shape: "relaxed", dur: 0.01 }); A(DEMO2 - 0.02, "sam", "expr", { expr: "deadpan", dur: 0.01 });

// ================================================================ 5 DEMO 2: OWE EVERYONE? 4.0-7.5 (v2 panel 03)
// his wallet out again; "COPY!": a hundred wallets pop into his arms. He flings them: his old IOUs rain down on Reaper,
// who catches one, reads it, and slides his own wallet away.
cap(DEMO2, r3(COPY2 - 0.05), "Owe everyone?", 470);
const G1 = body(GSL1, 30), WHOLD1 = G1([-0.12, 0.52, 0.44]);
A(DEMO2 - 0.02, "gsl", "turn", { to: 30, dur: 0.01 }); c.arm(DEMO2 - 0.02, "gsl", "L", "rest", 0.01); A(DEMO2 - 0.02, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
P(DEMO2 - 0.02, "wallet", { x: WHOLD1[0], y: WHOLD1[1], z: WHOLD1[2], rot: 30, tip: -20, open: 0 });
A(DEMO2 - 0.02, "gsl", "grip", { side: "R", shape: "pinch", dur: 0.01 }); c.arm(DEMO2 - 0.02, "gsl", "R", { prop: "wallet", grip: WGRIP }, 0.01);
A(DEMO2 - 0.01, "gsl", "grab", { prop: "wallet", hand: "R", grip: WGRIP, dur: 0, pose: null }); c.arm(DEMO2, "gsl", "R", { prop: "wallet", grip: WGRIP, at: WHOLD1 }, 0.01);
A(DEMO2, "gsl", "look", { to: [0.3, -0.1], dur: 0.1, blink: false }); A(DEMO2, "gsl", "expr", { expr: "eager", set: { curve: 0.7, open: 0.3 }, dur: 0.1 });
A(DEMO2, "sam", "turn", { to: -20, dur: 0.3 });
power(COPY2, "wallet", { big: 1.15, pos: 620 });
// the wallet vanishes into the heap; his arms go under it
A(COPY2 + 0.05, "gsl", "release", { prop: "wallet", dur: 0 }); P(COPY2 + 0.06, "wallet", { scale: 0.001, y: -2 });
P(COPY2 + 0.03, "heap", { n: 1 }, 0.45, "out"); sfx(r3(COPY2 + 0.06), "pop", { gain: 0.5, reason: "a hundred wallets pop into his arms" });
for (const side of ["L", "R"]) { c.arm(COPY2 + 0.04, "gsl", side, "hold", 0.18, "out"); A(COPY2 + 0.04, "gsl", "grip", { side, shape: "carry", dur: 0.12 }); }
A(COPY2 + 0.1, "gsl", "lean", { to: -7, dur: 0.3, ease: "settle" }); A(COPY2 + 0.1, "gsl", "expr", { expr: "delighted", set: { open: 0.7, curve: 1 }, dur: 0.15 });
P(COPY2 + 0.5, "heap", { wobble: 4 }, 0.15, "inOut"); P(COPY2 + 0.65, "heap", { wobble: -3 }, FLING - COPY2 - 0.65, "inOut");
A(COPY2 + 0.3, "rea", "look", { to: [-0.5, 0.35], dur: 0.15, blink: false }); act.shock(c, r3(COPY2 + 0.35), "rea", { open: 0.3, eye: 1.2, hold: 0.5 });
see(r3(COPY2 + 0.45), FLING, ["gsl.face", "heap", "rea"], "v2 panel 03: a hundred wallets in his arms");
// the fling: up and out toward Reaper
A(FLING - 0.12, "gsl", "lean", { to: -12, dur: 0.12, ease: "in" }); A(FLING, "gsl", "lean", { to: 6, dur: 0.15, ease: "out" }); A(FLING + 0.3, "gsl", "lean", { to: 0, dur: 0.3, ease: "inOut" });
for (const side of ["L", "R"]) { c.arm(FLING - 0.02, "gsl", side, "up", 0.16, "out"); A(FLING, "gsl", "grip", { side, shape: "open", dur: 0.1 }); c.arm(FLING + 0.5, "gsl", side, "hips", 0.35, "inOut"); }
P(FLING, "heap", { spill: 1 }, 0.6, "out"); sfx(FLING, "whoosh", { gain: 0.45, reason: "he flings the wallets" });
P(FLING, "ious", { clock: 0 }, 0); P(FLING, "ious", { clock: r3(DEMO3 - FLING) }, r3(DEMO3 - FLING), "linear"); P(FLING + 0.05, "ious", { amount: 1 }, 0.4, "out");
sfx(r3(FLING + 0.25), "flutter", { gain: 0.3, dur: 1.2, reason: "the IOU notes flutter down on Reaper" });
A(FLING + 0.25, "rea", "look", { to: [0.0, 0.7], dur: 0.2, blink: false }); A(FLING + 0.3, "rea", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.15 }, dur: 0.15 });
A(FLING + 0.3, "gsl", "expr", { expr: "cocky", set: { curve: 0.9, open: 0.4 }, dur: 0.15 }); A(FLING + 0.3, "gsl", "look", { to: [0.5, -0.2], dur: 0.15, blink: false });
// the read: one IOU in his left glove (taken out of the air at the cut), his own wallet still in his right
const R0 = body(REA0, REA0_YAW), IOU_AT = R0([0.22, 0.34, 0.5]), RWAL_AWAY = R0([-0.3, 0.3, 0.2]);
const riou = grips.thin(c, "rea", { id: "iou", kind: "iounote", x: IOU_AT[0], y: IOU_AT[1], z: IOU_AT[2], rot: REA0_YAW }, { side: "L", from: 0.2, roll: 20 });
P(READ - 0.06, "iou", { x: IOU_AT[0], y: IOU_AT[1], z: IOU_AT[2], rot: REA0_YAW, tip: -20 });
riou.secure(riou.approach(r3(READ - 0.05), 0.01), 0.01);
riou.carry(r3(READ + 0.1), R0([0.2, 0.38, 0.52]), 0.25);
A(READ - 0.02, "rea", "look", { to: [0.2, -0.35], dur: 0.01, blink: false }); A(READ - 0.02, "rea", "expr", { expr: "deadpan", set: { open: 0.05 }, dur: 0.01 });
A(READ + 0.45, "rea", "look", { to: [0.05, -0.35], dur: 0.35, blink: false });                     // his eyes run along the line
act.shock(c, r3(READ + 0.85), "rea", { open: 0.25, eye: 1.2, hold: 0.4 });
A(READ + 0.95, "rea", "look", { to: [-0.5, 0.25], dur: 0.15, blink: false });                      // up at him: paid back?
// his own wallet goes back in his robe
c.arm(READ + 1.05, "rea", "R", { prop: "rwal", grip: WGRIP, at: RWAL_AWAY }, 0.3, "inOut");
A(READ + 1.36, "rea", "release", { prop: "rwal", dur: 0 }); P(READ + 1.37, "rwal", { scale: 0.001 }, 0.04);
A(READ + 1.38, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.15 }); c.arm(READ + 1.4, "rea", "R", "rest", 0.3, "inOut");
A(READ + 1.3, "rea", "expr", { expr: "kind", set: { curve: 0.5, open: 0.05 }, dur: 0.2 });
see(r3(READ + 0.3), DEMO3, ["rea.face", "iou"], "Reaper reads one of the old IOUs: paid back; his own wallet goes away");
// the IOU and the fallen wallets are gone when we come back to the room
A(DEMO3 - 0.03, "rea", "release", { prop: "iou", dur: 0 }); P(DEMO3 - 0.02, "iou", { y: -2 }); c.arm(DEMO3 - 0.02, "rea", "L", "rest", 0.01); A(DEMO3 - 0.02, "rea", "grip", { side: "L", shape: "relaxed", dur: 0.01 });

// ================================================================ 6 DEMO 3: WANT IT ALL? 7.5-10.6 (v2 panels 04, 05)
cap(DEMO3, r3(DEMO3 + 0.22), "Want it all?", 470);
A(DEMO3 - 0.02, "gsl", "turn", { to: 20, dur: 0.01 }); A(DEMO3 - 0.02, "gsl", "look", { to: [0.05, 0.05], dur: 0.01, blink: false }); A(DEMO3 - 0.02, "gsl", "expr", { expr: "evil", set: { curve: 0.9, open: 0.3 }, dur: 0.01 });
for (const [i, t] of [DEMO3 + 0.25, DEMO3 + 0.47, DEMO3 + 0.69].entries()) {
  power(t, "gsl", { big: 1 + 0.2 * i, pos: 560 + 90 * i, size: 96 + 16 * i, say: i === 0 });
  A(t, "gsl", "squash", { amount: 0.03 + 0.01 * i, dur: 0.1 });
}
for (const side of ["L", "R"]) c.arm(DEMO3 + 0.2, "gsl", side, "up", 0.5, "out");
A(DEMO3 + 0.6, "gsl", "expr", { expr: "delighted", set: { open: 0.8, curve: 1 }, dur: 0.12 });
sfx(r3(DEMO3 + 0.75), "rumble", { gain: 0.5, dur: 2.0, reason: "the wave of money coming down the street" });
see(r3(DEMO3 + 0.1), WAVE, ["gsl.face"], "COPY! COPY! COPY!: his arms go up");
// everyone but him runs to the glass (the wave shot is what they see; he stays at the counter, out of its frame)
setup(WAVE, "gsl", [1.3, 1.7], 80); for (const who of ["sam", "wiz", "rea"]) setup(WAVE, who, GLASS[who], -90);   // he stays by the counter, out of the wave shot's frame
for (const side of ["L", "R"]) c.arm(WAVE - 0.02, "gsl", side, "rest", 0.01);
P(WAVE - 0.03, "heap", { y: -4 });
for (const who of ["wiz", "rea", "sam"]) { A(WAVE - 0.02, who, "look", { to: [0.0, 0.45], dur: 0.01, blink: false }); A(WAVE - 0.02, who, "expr", { expr: "shocked", set: { open: 0.4, eye: 1.2 }, dur: 0.01 }); }
for (const side of ["L", "R"]) { c.arm(WAVE - 0.02, "wiz", side, "cheeks", 0.01); c.arm(WAVE + 0.5, "wiz", side, "up", 0.3, "out"); }
A(WAVE + 0.55, "wiz", "hop", { count: 2, height: 0.12, dur: 0.6 });
P(WAVE - 0.2, "wave", { clock: 0 }); P(WAVE - 0.2, "wave", { clock: r3(NIGHT - WAVE + 0.2) }, r3(NIGHT - WAVE + 0.2));
P(WAVE - 0.2, "wave", { front: 1 }, 1.9, "inOut"); P(WAVE + 0.3, "wave", { level: 1 }, 1.7, "inOut");
P(WAVE + 0.5, "spill", { clock: 0 }); P(WAVE + 0.5, "spill", { clock: r3(NIGHT - WAVE) }, r3(NIGHT - WAVE)); P(WAVE + 0.5, "spill", { grow: 1 }, 2.4, "out");
sfx(r3(WAVE + 0.1), "waves", { gain: 0.5, dur: 2.2, reason: "the wave of banknotes rolls past the windows" });
see(r3(WAVE + 0.3), SLAP_CUT, ["wave", "wiz", "sam"], "v2 panel 04: the wave of banknotes rolls down the street outside the windows; the friends at the glass");
// the counter man turns from the glass, sees who owns the place now, and bows
A(SLAP_CUT - 0.45, "sam", "move", { to: SAM_BOW, dur: 0.4, ease: "inOut", steps: 1 }); A(SLAP_CUT - 0.45, "sam", "turn", { to: SAM_BOW_YAW, dur: 0.4 });
A(SLAP_CUT - 0.1, "sam", "look", { to: [0.3, 0.0], dur: 0.1, blink: false });
// the slap: a brick of cash, his right glove flat on top of it, high over his head at the cut, down onto the counter's end
const BTOP = [0, r3(0.11 * BRK), 0], BUTOP = [0, r3(0.11 * BUK), 0], BRICK_UP = [GSL_C[0] + 0.28, 1.12, GSL_C[1] + 0.3], BRICK_DOWN = [0.26, TOP, 0.2];
setup(SLAP_CUT - 0.03, "gsl", GSL_C, 80);
P(SLAP_CUT - 0.04, "brick", { x: BRICK_UP[0], y: BRICK_UP[1], z: BRICK_UP[2], rot: 90 });
A(SLAP_CUT - 0.04, "gsl", "grip", { side: "R", shape: "flat", dur: 0.01 }); c.arm(SLAP_CUT - 0.04, "gsl", "R", { prop: "brick", grip: BTOP }, 0.01);
A(SLAP_CUT - 0.02, "gsl", "grab", { prop: "brick", hand: "R", grip: BTOP, dur: 0, pose: null }); c.arm(SLAP_CUT - 0.01, "gsl", "R", { prop: "brick", grip: BTOP, at: BRICK_UP }, 0.01);
c.arm(SLAP_CUT - 0.04, "gsl", "L", "hips", 0.01);
A(SLAP_CUT - 0.02, "gsl", "look", { to: [0.05, 0.0], dur: 0.01, blink: false }); A(SLAP_CUT - 0.02, "gsl", "expr", { expr: "evil", set: { curve: 1, open: 0.45 }, dur: 0.01 });
c.arm(SLOW.at, "gsl", "R", { prop: "brick", grip: BTOP, at: BRICK_DOWN }, r3(SLAP - SLOW.at), "in");
A(SLOW.at, "gsl", "lean", { to: 5, dur: r3(SLAP - SLOW.at), ease: "in" });
c.at(SLAP, { fx: "shake", dur: 0.2, amp: 0.025 }); sfx(SLAP, "slam", { gain: 0.9, loud: true, reason: "the 10x: the brick of cash slapped on the counter" });
if (READY.has("money")) { P(SLAP, "brick", { squash: 1 }, 0.04, "out"); P(SLAP + 0.04, "brick", { squash: 0 }, 0.12, "settle"); }
A(SLAP + 0.03, "gsl", "look", { to: [0.35, 0.05], dur: 0.12, blink: false }); A(SLAP + 0.05, "gsl", "expr", { expr: "smug", set: { curve: 0.9 }, dur: 0.12 });
P(SLAP + 0.03, "dsign", { flip: 1 }, 0.35, "settle"); sfx(r3(SLAP + 0.05), "seatclack", { gain: 0.4, reason: "the diner's sign flips to his hat" });
A(SLAP + 0.08, "sam", "pitch", { to: 30, dur: 0.3, ease: "inOut" });
see(SLAP, FREEZE, ["gsl.face", "brick", "wave", "dsign", "sam"], "v2 panel 05 (the cover): the slap, the wave at its peak, the sign now his, the counter man's bow");
c.at(SLOW.at, { fx: "ramp", ...SLOW });

// ================================================================ 7 SNAP 2: THE THRONE 10.6-12.4 (v2 panel 06)
P(SNAP2 - 0.02, "brick", { y: -2 });
P(SNAP2 + 0.02, "throne", { build: 1, ...(!READY.has("money") && { scale: 1 }) }, 0.3, "out"); sfx(r3(SNAP2 + 0.04), "plunk", { gain: 0.5, reason: "the throne of cash stacks up behind him" });
A(SNAP2 - 0.02, "sam", "pitch", { to: 0, dur: 0.01 }); setup(SNAP2, "sam", [0.9, -1.15], -40); setup(SNAP2, "wiz", [-2.0, -1.5], 90); setup(SNAP2, "rea", [-2.0, 2.45], 90);   // the counter man back behind his counter (out of this frame); Wizard runs in from the right edge   // back behind his counter, out of this frame
A(SNAP2 - 0.02, "gsl", "release", { prop: "brick", dur: 0 }); A(SNAP2 - 0.02, "gsl", "lean", { to: 0, dur: 0.01 });
A(SNAP2, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.1 }); c.arm(SNAP2, "gsl", "R", "rest", 0.2, "inOut"); c.arm(SNAP2, "gsl", "L", "rest", 0.2, "inOut");
A(SNAP2, "gsl", "turn", { to: 90, dur: 0.15 });
A(SIT - 0.25, "gsl", "move", { to: [r3(THRONE[0] + 1.0), THRONE[1]], dur: 0.25, ease: "out", steps: 1 });
A(SIT, "gsl", "sit", { seat: "throne", dur: 0.2 }); sfx(r3(SIT + 0.15), "ai/cushion-poof", { gain: 0.4, reason: "he drops back onto the throne of cash" });
for (const side of ["L", "R"]) c.arm(SIT + 0.15, "gsl", side, "up", 0.3, "settle");
A(SIT + 0.1, "gsl", "expr", { expr: "delighted", set: { open: 0.7, curve: 1 }, dur: 0.12 }); A(SIT + 0.1, "gsl", "look", { to: [0.05, 0.05], dur: 0.1, blink: false });
c.say(r3(SIT + 0.15), "gsl", "everything's on me. forever.", 0.95, "excited", { voice: false, sub: "Everything's on me. Forever.", pos: 1250 });
// the friends turn from the glass and run to him once he is down: arms up, a hop
for (const [i, [who, to, yaw]] of [["wiz", WIZ_R, 75], ["rea", REA_R, 105]].entries()) {
  A(SNAP2 - 0.02, who, "turn", { to: 90, dur: 0.01 }); A(SNAP2 - 0.02, who, "expr", { expr: "delighted", set: { open: 0.6, curve: 1 }, dur: 0.01 }); A(SNAP2 - 0.02, who, "look", { to: [0.05, 0.1], dur: 0.01, blink: false });
  for (const side of ["L", "R"]) c.arm(SNAP2 - 0.02, who, side, "rest", 0.01);
  A(r3(SIT + 0.05), who, "move", { to, dur: 0.45, ease: "out", steps: 3 }); A(r3(SIT + 0.05), who, "turn", { to: yaw, dur: 0.4 });
  for (const side of ["L", "R"]) c.arm(r3(SIT + 0.5 + 0.06 * i), who, side, "up", 0.25, "out");
  A(r3(SIT + 0.6 + 0.08 * i), who, "hop", { count: 2, height: 0.12, dur: 0.6 });
}
see(r3(SIT + 0.55), TWIST, ["gsl.face", "wiz.face", "rea.face", "throne"], "v2 panel 06: on his throne of cash, the friends cheering");

// ================================================================ 8 THE TWIST 12.4-15.1 (v2 panel 07)
// the price board, on its own shot: 4.50, 450, 45,000, 4,500,000, 4.5 BILLION, out of digits, the flaps blow off
setup(TWIST, "sam", SAM_B, 10); A(TWIST - 0.02, "sam", "look", { to: [0.05, 0.0], dur: 0.01, blink: false }); A(TWIST - 0.02, "sam", "expr", { expr: "deadpan", dur: 0.01 });
A(TWIST + 0.2, "sam", "turn", { to: 165, dur: 0.3, ease: "inOut" }); A(TWIST + 0.3, "sam", "look", { to: [0.0, 0.8], dur: 0.15, blink: false });
A(BLOW + 0.06, "sam", "turn", { to: 15, dur: 0.2, ease: "out" }); A(BLOW + 0.1, "sam", "look", { to: [0.05, 0.1], dur: 0.1, blink: false });
P(TWIST, "board", { clock: 0 }); P(TWIST, "board", { clock: r3(NIGHT - TWIST) }, r3(NIGHT - TWIST));
P(TWIST + 0.1, "board", { stage: 5 }, r3(BLOW - TWIST - 0.1), "in"); P(BLOW, "board", { blow: 1 }, 0.9, "out");
for (let i = 0, t = TWIST + 0.1, gap = 0.2; t < BLOW; i++, t += gap, gap = Math.max(0.045, gap * 0.86)) sfx(r3(t), "click", { gain: r3(Math.min(0.6, 0.25 + 0.02 * i)), reason: "the flip board's flaps clatter, faster and faster" });
sfx(BLOW, "flutter", { gain: 0.5, dur: 0.7, reason: "the flaps blow off the board" }); sfx(BLOW, "pop", { gain: 0.55, reason: "the board gives up" });
A(TWIST + 0.6, "sam", "expr", { expr: "shocked", set: { open: 0.4, eye: 1.25 }, dur: 0.2 }); A(BLOW, "sam", "squash", { amount: 0.05, dur: 0.12 });
see(r3(TWIST + 0.15), BARROW, ["board"], "the price board runs away and its flaps blow off");
// meanwhile (off screen) the throne has gone into a wheelbarrow: he tips it out on the counter for ONE milkshake
A(BARROW - 0.04, "gsl", "stand", { dur: 0.01 }); setup(BARROW, "gsl", GSL_T, GSL_T_YAW);
for (const who of ["wiz", "rea"]) { setup(BARROW, who, OFF[who], -60); for (const side of ["L", "R"]) c.arm(BARROW - 0.02, who, side, "rest", 0.01); }
P(BARROW - 0.02, "throne", { build: 0, ...(!READY.has("money") && { scale: 0.001 }) });
P(BARROW - 0.02, "barrow", { y: 0 }); P(BARROW - 0.02, "brick", { y: -2 });
setup(BARROW, "sam", SAM_T, -25); A(BARROW - 0.02, "sam", "look", { to: [-0.5, -0.1], dur: 0.01, blink: false }); A(BARROW - 0.02, "sam", "expr", { expr: "deadpan", dur: 0.01 });
// his gloves on the handles; the handles rise as it tips (hand points: props-twist.js header)
const HANDLE = (dump, sz) => { const a = 0.4957 * dump, x = -0.662 - 0.42, y = 0.486 - 0.15; return [r3(BARROW1[0] + BK * (0.42 + x * Math.cos(a) + y * Math.sin(a))), r3(BK * (0.15 - x * Math.sin(a) + y * Math.cos(a))), r3(BARROW1[1] + BK * 0.207 * sz)]; };
const DUMP = [0, 0.1, 0.35, 0.65, 0.9, 1], DUMP_AT = BARROW + 0.05, DUMP_STEP = 0.07;   // the tip, eased by hand so the gloves stay on the handles
for (const [side, sz] of [["L", -1], ["R", 1]]) { A(BARROW - 0.04, "gsl", "grip", { side, shape: "fist", dur: 0.01 }); c.arm(BARROW - 0.04, "gsl", side, { world: HANDLE(0, sz) }, 0.01); }
for (let i = 1; i < DUMP.length; i++) {
  const t = r3(DUMP_AT + DUMP_STEP * (i - 1));
  P(t, "barrow", { dump: DUMP[i] }, DUMP_STEP);
  for (const [side, sz] of [["L", -1], ["R", 1]]) c.arm(t, "gsl", side, { world: HANDLE(DUMP[i], sz) }, DUMP_STEP, "linear");
}
A(BARROW - 0.02, "gsl", "expr", { expr: "eager", set: { curve: 0.8, open: 0.4 }, dur: 0.01 }); A(BARROW - 0.02, "gsl", "look", { to: [0.5, 0.0], dur: 0.01, blink: false });
P(BARROW + 0.2, "pile", { grow: 1 }, 0.4, "out");
sfx(r3(BARROW + 0.12), "leafrustle", { gain: 0.55, dur: 0.6, reason: "a wheelbarrow of banknotes slides out onto the counter" });
// the counter man looks at the heap, at him, shakes his head, and slides the milkshake back
const ST0 = body(SAM_T, -25), MILK0 = ST0([-0.34, 0.8, 0.5]), MILK1 = ST0([-0.16, 0.5, 0.47]);   // held out toward him over the counter; pulled back to his chest
const smilk = grips.mug(c, "sam", { id: "shake1", kind: "milkshake", scale: SHK, x: MILK0[0], y: MILK0[1], z: MILK0[2], rot: 0 }, { side: "R" });
P(BARROW - 0.05, "shake1", { x: MILK0[0], y: MILK0[1], z: MILK0[2] }); smilk.secure(smilk.approach(r3(BARROW - 0.04), 0.01), 0.01);
A(BARROW + 0.3, "sam", "look", { to: [-0.3, -0.35], dur: 0.12, blink: false }); A(SHAKE - 0.08, "sam", "look", { to: [-0.55, 0.0], dur: 0.1, blink: false });
for (const [i, to] of [-37, -13, -35, -15, -25].entries()) A(r3(SHAKE + 0.11 * i), "sam", "turn", { to, dur: 0.11, ease: "inOut" });
smilk.carry(r3(SHAKE + 0.12), MILK1, 0.35, "inOut");
A(SHAKE + 0.25, "gsl", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.2, curve: -0.2 }, dur: 0.15 });
see(r3(BARROW + 0.4), NIGHT, ["gsl.face", "sam.face", "barrow", "pile", "shake1"], "v2 panel 07: a wheelbarrow of cash for one milkshake; the counter man shakes his head and slides it back");

// ================================================================ 9 NIGHT 15.1-END (v2 panel 08)
// hard cut: night, snow, the diner dark. He warms his gloves over a barrel of burning banknotes and feeds it a bundle.
const GN = body(GSL_N, GSL_N_YAW), GN2 = body(GSL_N, GSL_N2), toLocal = (w, yaw) => { const q = rotY([w[0] - GSL_N[0], w[1], w[2] - GSL_N[1]], -yaw); return [r3(q[0]), r3(q[1]), r3(q[2])]; };
const RIM = r3(0.86 * BARK), FIRE = [BARREL[0], RIM, BARREL[1]];
// his gloves beside the flames: the left one (nearer us) lower, the right one higher, so both show
const WARM = { L: [r3(BARREL[0] + 0.33), r3(RIM - 0.12), r3(BARREL[1] + 0.16)], R: [r3(BARREL[0] + 0.31), r3(RIM + 0.1), r3(BARREL[1] - 0.12)] };
A(NIGHT - 0.03, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.01 }); A(NIGHT - 0.03, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
setup(NIGHT, "gsl", GSL_N, GSL_N_YAW); setup(NIGHT, "rea", REA_N0, -80); setup(NIGHT, "sam", [NX + 8, -6], 0); setup(NIGHT, "wiz", [NX + 9, -6], 0);
hide(NIGHT - 0.02, "sam"); hide(NIGHT - 0.02, "wiz");
A(NIGHT - 0.02, "gsl", "expr", { expr: "sad", set: { curve: -0.4, open: 0.05 }, dur: 0.01 }); A(NIGHT - 0.02, "gsl", "look", { to: [-0.4, -0.25], dur: 0.01, blink: false });
A(NIGHT - 0.02, "gsl", "grip", { side: "L", shape: "open", dur: 0.01 }); c.arm(NIGHT - 0.02, "gsl", "L", { world: WARM.L }, 0.01);
// the bundle in his right glove goes into the fire
const BUN0 = GN([-0.26, 0.55, 0.44]), BUN1 = [r3(BARREL[0] + 0.3), r3(RIM + 0.3), r3(BARREL[1] - 0.05)];
P(NIGHT - 0.03, "bundle", { x: BUN0[0], y: BUN0[1], z: BUN0[2], rot: 60 });
A(NIGHT - 0.02, "gsl", "grip", { side: "R", shape: "flat", dur: 0.01 }); c.arm(NIGHT - 0.02, "gsl", "R", { prop: "bundle", grip: BUTOP }, 0.01);
A(NIGHT - 0.01, "gsl", "grab", { prop: "bundle", hand: "R", grip: BUTOP, dur: 0, pose: null }); c.arm(NIGHT, "gsl", "R", { prop: "bundle", grip: BUTOP, at: BUN0 }, 0.01);
c.arm(NIGHT + 0.5, "gsl", "R", { prop: "bundle", grip: BUTOP, at: BUN1 }, 0.35, "inOut");
A(NIGHT + 0.87, "gsl", "release", { prop: "bundle", dur: 0 }); c.throw(r3(NIGHT + 0.87), "bundle", { to: [FIRE[0], r3(RIM - 0.1), FIRE[2]], in: 0.2, spin: [1, 0, 0.5] });
P(NIGHT + 1.07, "bundle", { scale: 0.001 }, 0.04); P(NIGHT + 1.05, "barrel", { feed: 1 }, 0.12, "out"); P(NIGHT + 1.2, "barrel", { feed: 0 }, 0.6, "inOut");
sfx(r3(NIGHT + 1.05), "ai/flare", { gain: 0.4, reason: "a bundle of banknotes flares up in the barrel" });
A(NIGHT + 0.9, "gsl", "grip", { side: "R", shape: "open", dur: 0.15 }); c.arm(NIGHT + 0.92, "gsl", "R", { world: WARM.R }, 0.35, "inOut");
for (const t of [1.5, 1.72, 2.6, 2.82]) A(r3(NIGHT + t), "gsl", "squash", { amount: 0.018, dur: 0.1 });   // a shiver
cap(NIGHT, r3(QUESTION - 0.03), "The catch: in November 1923, one loaf of bread in Germany cost 200 billion marks.", 470, false, { kinetic: false });
P(NIGHT, "barrel", { clock: 0 }); P(NIGHT, "barrel", { clock: r3(END - NIGHT) }, r3(END - NIGHT));
// the dead sign (his hat) buzzes once and gives up
for (const [t, v, d] of [[0.5, 1, 0.05], [0.62, 0.15, 0.05], [0.74, 0.8, 0.04], [0.86, 0, 0.25]]) P(NIGHT + t, "front", { flicker: v }, d);
sfx(r3(NIGHT + 0.5), "lampbuzz", { gain: 0.14, dur: 0.4, reason: "the dead diner sign buzzes once and gives up" });
P(NIGHT, "snow", { clock: 0 }); P(NIGHT, "snow", { clock: r3(END - NIGHT) }, r3(END - NIGHT));
sfx(NIGHT, "ridewind", { gain: 0.06, dur: r3(END - NIGHT), reason: "a low cold wind outside the dark diner (far under the mix)" });
for (const t of [0.3, 1.6, 2.5, 3.6, 4.7]) sfx(r3(NIGHT + t), "crinkle", { gain: 0.16, reason: "the barrel fire crackles" });
see(r3(NIGHT + 0.2), REA_IN, ["gsl.face", "barrel"], "v2 panel 08: night, snow, he burns his money to keep warm");
// Reaper walks in with one paper cup of coffee
const CUP = { id: "cup", kind: "papercup", scale: 1.5 }, RN0 = body(REA_N0, -80), CUP0 = RN0([-0.24, 0.42, 0.42]), HANDOUT = [NX + 0.52, 0.5, 0.74];
const rcup = grips.mug(c, "rea", { ...CUP, x: CUP0[0], y: CUP0[1], z: CUP0[2], rot: 0 }, { side: "R" });
P(NIGHT - 0.03, "cup", { x: CUP0[0], y: CUP0[1], z: CUP0[2] }); rcup.secure(rcup.approach(r3(NIGHT - 0.02), 0.01), 0.01);
const CUP1 = body(REA_N, REA_N_YAW)([-0.24, 0.42, 0.42]);
// he hears the steps, lets the fire be and turns to him
for (const side of ["L", "R"]) { c.arm(REA_IN + 0.75, "gsl", side, "rest", 0.35, "inOut"); A(REA_IN + 0.75, "gsl", "grip", { side, shape: "relaxed", dur: 0.2 }); }
A(REA_IN + 0.8, "gsl", "turn", { to: GSL_N2, dur: 0.45, ease: "inOut" });
A(REA_IN, "rea", "move", { to: REA_N, dur: 1.0, ease: "inOut", steps: 4 }); A(REA_IN + 0.3, "rea", "turn", { to: REA_N_YAW, dur: 0.6 }); rcup.carry(REA_IN, CUP1, 1.0, "inOut");
A(REA_IN - 0.02, "rea", "expr", { expr: "deadpan", set: { curve: 0.1 }, dur: 0.01 }); A(REA_IN - 0.02, "rea", "look", { to: [-0.5, 0.0], dur: 0.01, blink: false });
A(REA_IN + 0.9, "gsl", "look", { to: [0.5, 0.05], dur: 0.2, blink: false }); A(REA_IN + 1.0, "gsl", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.1, curve: 0 }, dur: 0.2 });
// the closing question; the moth flutters up out of the fire to his hat
cap(QUESTION, r3(END - 0.03), "Would you still want it?", 470);
const MB = toLocal([FIRE[0], r3(RIM + 0.15), FIRE[2]], GSL_N2);
const M9 = (t, q, set = {}, dur = 0.1, ease = "inOut") => c.prop(r3(t), "moth", { x: q[0], y: q[1], z: q[2], ...set }, dur, ease);
M9(NIGHT - 0.03, MB, { scale: 0.001, open: 0, flap: 0 }, 0);
M9(QUESTION + 0.05, MB, { scale: 1, open: 1, flap: 1, bob: 0.5 }, 0.05); M9(QUESTION + 0.1, [r3(MB[0] * 0.6), 1.4, r3(MB[2] * 0.6 + 0.1)], { bank: 20 }, 0.3, "out");
M9(QUESTION + 0.4, [BRIM[0] + 0.15, BRIM[1] + 0.2, BRIM[2] + 0.2], { bank: -15 }, 0.3); M9(QUESTION + 0.7, BRIM, { bank: 0, bob: 0 }, 0.2, "out");
P(QUESTION + 0.92, "moth", { open: 0, flap: 0 }, 0.12, "inOut");
sfx(r3(QUESTION + 0.05), "wings", { gain: 0.14, dur: 0.8, reason: "the moth flutters up out of the fire" });
// the coffee: Reaper holds it out, he takes it in his left glove
rcup.carry(HAND, HANDOUT, 0.3, "inOut");
const gcup = grips.mug(c, "gsl", { ...CUP, x: HANDOUT[0], y: HANDOUT[1], z: HANDOUT[2], rot: 0 }, { side: "L" });
const tCup = gcup.takeFrom(r3(HAND + 0.3), HANDOUT, { reach: 0.3, settle: 0.2 });
rcup.handOff(r3(tCup - 0.02));
gcup.carry(r3(tCup + 0.05), GN2([0.3, 0.44, 0.42]), 0.3, "inOut");
A(HAND + 0.3, "gsl", "look", { to: [0.4, -0.3], dur: 0.15, blink: false }); A(tCup, "gsl", "expr", { expr: "kind", set: { curve: 0.5, open: 0.1 }, dur: 0.2 });
A(tCup, "gsl", "look", { to: [0.6, 0.05], dur: 0.15, blink: false }); 
A(r3(tCup + 0.1), "rea", "expr", { expr: "kind", set: { curve: 0.35 }, dur: 0.25 });
wink(c, { who: "gsl", t: WINK, until: END, sub: "Next time's on me.", line: "next time's on me.", pos: 1250,
  react: (t) => { A(t, "rea", "look", { to: [-0.4, 0.3], dur: 0.2, blink: false }); A(r3(t + 0.2), "rea", "expr", { expr: "deadpan", set: { curve: 0.25, open: 0 }, dur: 0.2 }); } });
see(r3(REA_IN + 0.6), QUESTION, ["rea", "cup", "gsl.face"], "Reaper walks up with one coffee");
see(r3(tCup), r3(END - 0.05), ["gsl.face", "rea.face", "cup", "moth"], "the coffee from Reaper, the wink");

// ---------------------------------------------------------------- shots
const SH = {
  wide: { pos: [0.9, 2.3, 6.3], look: [0.2, 0.78, 0], fov: 40, ...(VO && { to: { pos: [0.9, 2.3, 6.3], look: [0.2, 0.78, 0], fov: 37.5 }, dur: 0.6, ease: "inOut" }) },
  coins: { pos: [-0.15, 0.95, 4.0], look: [-0.58, 0.7, 0.2], fov: 28 },
  victim: { pos: [0.8, 0.95, 6.3], look: [0.92, 0.66, 2.4], fov: 28 },
  pay: { pos: [0.3, 1.05, 5.3], look: [0.05, 0.7, -0.3], fov: 36 },
  heap: { pos: [0.9, 2.2, 6.1], look: [0.2, 0.8, 0.3], fov: 40 },
  read: { pos: [1.1, 1.0, 6.2], look: [0.95, 0.7, 2.4], fov: 28 },
  all: { pos: [0.3, 1.0, 4.6], look: [-0.45, 0.82, 0.1], fov: 32 },
  wave: { pos: [1.9, 1.3, 0.25], look: [WALL_X, 1.7, 0.25], fov: 56 },
  slap: { pos: [2.8, 2.2, 0.3], look: [-0.8, 0.6, -0.1], fov: 44 },
  throne: { pos: [4.25, 1.35, 0.55], look: [-1.7, 1.05, 0.55], fov: 52 },
  board: { pos: [0.6, 1.0, 2.7], look: [0.7, 1.4, -1.6], fov: 36 },
  barrow: { pos: [-0.45, 1.55, 5.5], look: [-0.45, 0.95, 0], fov: 54 },
  night: { pos: [NX + 0.1, 1.7, 6.6], look: [NX + 0.1, 1.25, 0.5], fov: 48 },
  two: { pos: [NX + 0.45, 1.15, 4.6], look: [NX + 0.45, 0.85, 0.5], fov: 46 },
};
const CUTS = [
  ["frame 0: can't pay again?", 0, SH.wide, "hook"],
  ["snap 1: COPY! two coins", SNAP1, SH.coins],
  ["victim: Reaper, wallet half out", VICTIM, SH.victim, "reaction"],
  ["demo 1: he pays", DEMO1, SH.pay],
  ["demo 2: a hundred wallets", DEMO2, SH.heap],
  ["demo 2: Reaper reads an IOU", READ, SH.read, "reaction"],
  ["demo 3: COPY! COPY! COPY!", DEMO3, SH.all],
  ["demo 3: the wave", WAVE, SH.wave, "reveal"],
  ["demo 3: the slap (slow motion)", SLAP_CUT, SH.slap],
  ["snap 2: the throne", SNAP2, SH.throne],
  ["twist: the board runs away", TWIST, SH.board, "payoff"],
  ["twist: a wheelbarrow for one milkshake", BARROW, SH.barrow, "reaction"],
  ["night: the catch", NIGHT, SH.night, "reaction"],
  ["would you still want it? (push in)", QUESTION, { ...SH.night, to: SH.two, dur: 1.3, ease: "inOut" }, "reaction"],
];

// ---------------------------------------------------------------- the commentator (voice 1, "narrator"), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  // [story s, line, take, spoken s (video), subtitle until (story) | false, gain]
  [0, TITLE, TITLE_TAKE, TITLE_LEN, false, NG],                                   // the spoken title over the opening slow motion; subtitled in parts below
  [r3(DEMO1 + 0.5), "One coin.", 1, 0.97, false, NG],                              // after the coins land, before the bite's tink
  [r3(READ - 0.15), "Every debt he ever had.", 3, 1.74, false, NG],                 // Reaper reads the old IOU
  [r3(WAVE + 0.02), "Every dollar in the city.", 1, 1.9, false, NG],               // the wave rolls past the windows
  [r3(Math.max(SLOW.at, ST(VT(WAVE + 0.02) + 1.9 + 0.08))), "Sounds perfect, right?", 3, 1.56, false, NG],                         // over the slow-motion slap (the series' line and read)
  [r3(TWIST + 0.05), "But money only works while it's rare.", 2, 2.26, false, NG],  // the board starts to run
  [r3(QUESTION + 0.02), "Would you still want it?", 2, 1.33, false, NG],            // the closing question (its caption is on screen)
];
for (const [t, line, take, len, until, gain] of NARR) {
  c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });
  if (!until && VT(t) + len > VT(END) - 0.3) throw new Error(`"${line}" runs to the end`);
}
for (let i = 1; i < NARR.length; i++) if (VT(NARR[i - 1][0]) + NARR[i - 1][3] > VT(NARR[i][0]) - 0.05) throw new Error(`"${NARR[i - 1][1]}" runs into "${NARR[i][1]}"`);

if (process.env.TIMES) console.log(Object.entries({ SNAP1, VICTIM, DEMO1, DEMO2, COPY2, FLING, READ, DEMO3, WAVE, SLAP_CUT, SLAP, SNAP2, SIT, TWIST, BLOW, BARROW, SHAKE, NIGHT, REA_IN, QUESTION, HAND, WINK, END }).map(([k, v]) => `${k} ${v}=${VT(v)}`).join("  "));
const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);

const allowClip = [
  { who: "sam", with: "apron", from: 0, to: END, reason: "the counter man's apron (worn)" },
  { who: "sam", with: "hat", from: 0, to: END, reason: "the counter man's paper hat (worn)" },
  { who: "gsl", with: "moth", from: 0, to: END, reason: "the moth flies round him and sits on his hat brim (worn)" },
  { who: "gsl", with: "wallet", from: 0, to: END, reason: "his wallet: in his glove, then in the holster on his hip" },
];
for (const w of allowClip) { w.from = VT(w.from); w.to = VT(w.to); }

write(import.meta.url, {
  id: VO ? "copy-money" : "copy-money-no-vo",
  title: TITLE,
  idea: "There's a catch, episode 4: the friend who never has money can copy it: one coin, a hundred wallets, every dollar in the city; then prices explode and he burns his money to keep warm",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [470, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#c9473f", floor: "#e9e2d6", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/diner-kitchen.png", z: -2.7, center: [0.35, 2.1], height: 8.2, depth: false, motion: false, dust: 6 },
    plates: [
      ...(READY.has("flood") ? [] : [{ src: "assets/plates/diner-sunny.png", z: 0.2, center: [WALL_X, 1.61], height: 8, turn: 90 }]),
      ...(READY.has("night") ? [] : [{ src: "assets/environments/bryant-park-winter-village/paint.png", z: -4.5, center: [NX + 0.2, 2.6], height: 9.5 }]),
    ],
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true, nightSet: "#7c7fa8" },
  sky: [[0, 0], [r3(NIGHT - 0.03), 0], [r3(NIGHT - 0.02), 1]],
  music: { style: "bounce", key: 10, lowCut: 150, gain: 0.28, parts: [
    { at: 0, part: "main" }, { at: DEMO3, part: "build" }, { at: SLAP, part: "drop" }, { at: r3(TWIST - 0.05), part: "stop" }, { at: BARROW, part: "hush" }, { at: NIGHT, part: "musicbox" }] },
  sound: { sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "wood", room: "room", guard: true },
  hook: { show: ["gsl", "sam", "rea", "wallet", "coin1"], hint: 0, what: "Gunslinger shows his empty wallet and his one coin, the moth flying out; the counter man's palm is out; Reaper reaches for his own wallet. The narrator: 'Your broke friend can copy money. There's a catch.'" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/04-copy-money/make-copy-money.mjs.",
});
