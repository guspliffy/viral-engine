// COUNTRY VS COUNTRY 01 "Paying at the supermarket: Germany vs America" (Jonny 26 Nov 2026: idea 3 picked 14:39 Berlin,
// hook H1 + ending E2 + "in the german line a retiree sighing all the time because it's too slow", 14:43).
// Panel sheet (approved 15:11): checkout-sheet-1.png beside this file. Design (sizes, marks, cameras): DESIGN.md (Fable).
// Lines: lines.mjs (voices x1.15). "You" situation: nobody says the hero's name. English only, no lettering in the picture.
//   node storyboards/series/country-vs-country/01-checkout/make-checkout.mjs -> checkout.json
//
// Hook pattern (Jonny 25 Nov): power words + the rule as a command ("Don't. Stop. Packing. Nobody survives this line.")
// -> the short question ("Survives... WHAT?") -> both lanes escalate (belt faster / one item per bag) -> the answer:
// nobody lets you pay ("Cash. Only." / "Card only."). Plants: the card in his teeth (DE) and the cash roll in his hand
// (US) from the first shot of each lane; teases: the retiree's "A card. Tsk." and Mash's "Is that... paper money?".
// Chain: the German belt is fast, so goods fly at you, so you pack in a panic, so the retiree sighs at how slow you are,
// so the belt speeds up, so the scanner sparks; the American bagger is slow, so every item gets its own bag, so the bags
// pile to the ceiling; so both totals come at once, so you pay with what you brought, so each lane refuses it, so you
// stand there with full arms; so the sighing retiree pays in cents, one by one, and the cashier who rushed you smiles:
// "Take your time." End on that line.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
const CUTS = new Set();
const SHAKES = [], SPLIT = {}, SOLO = { on: false };
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : t, ...rest);
const F2 = (t) => Math.ceil((Math.round(t * 15) * 2 / 30) * 1000 - 1e-6) / 1000;

// measured spoken lengths (voice probe cvc01-voice-probe.json, 26 Nov 2026), in LINES order
const DUR = [2.00, 1.68, 2.21, 1.09, 0.76, 0.38, 0.70, 1.02, 1.28, 2.75, 3.39, 1.78, 0.90, 1.66, 1.20, 1.33, 0.96, 1.30, 1.64, 2.10, 1.34, 0.70, 3.54, 0.89, 1.38, 0.71, 0.33, 1.86];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- marks (DESIGN §2-4; x right, z toward us)
const AWAY = -60;
const DE = { H: [-3.00, 1.00], H5: [-2.20, 1.40], H9: [-2.45, 1.25], OUT: [-3.30, 1.60], W: [-1.30, -0.05], W12: [-1.42, 0.35],
  R1: [-3.40, -0.30], R5: [-3.05, 0.15], R7: [-3.38, 0.25], R12: [-2.50, 1.12], RS: [-2.60, 0.62], HS: [-3.10, 1.10] };   // HS: you, just before the shove   // RS: his shoulder at your right side (Sol r1: the shove was hidden)
const US = { HU: [1.30, 0.85], H6: [1.36, -0.20], H8: [1.12, 0.95], H10: [1.45, 1.30], H10F: [1.88, 1.55], M: [2.62, 0.30], M8: [2.20, 1.45], M10: [2.80, -0.40] };   // M10: behind the till's line from cam 10 (stills 2: the till hid his face)
const S11 = [0, 3.15];
const PLAT = 0.20;   // Wedge stands on the lane's platform
const PARK = { spud: [-30, 8], spudus: [-34, 8], retiree: [-38, 8] };

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: DE.H, face: 55, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "spudus", character: "potatobrawl/spud", at: US.HU, face: 80, expr: "kind", follow: 0.3, seed: 1.9 },
  { id: "wedge", character: "potatobrawl/wedge", at: DE.W, y: PLAT, face: -65, expr: "deadpan", follow: 0.2, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: US.M, face: -60, expr: "happy", follow: 0.3, seed: 5.2 },
  { id: "retiree", character: "potatobrawl/retiree", at: DE.R1, face: 20, expr: "annoyed", follow: 0.3, seed: 4.4 },
];

// ---------------------------------------------------------------- props (DESIGN §1-3, §7)
const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const BELT_GOODS = ["tin", "yogurtcup", "loaf", "milkcarton", "cheesewedge", "tin", "yogurtcup", "milkcarton", "loaf"];
const BELT_X = -1.95, BELT_Y = 0.46;
const goodZ = (i) => r3(-2.90 + i * 0.36);
const props = [
  { id: "hallde", staged: "the German hall's shell", kind: "shophall", ...at3(-2.2, 0, 0), look: "de", x0: -4.4, x1: 0 },
  { id: "hallus", staged: "the American hall's shell", kind: "shophall", ...at3(2.2, 0, 0), look: "us", x0: 0, x1: 4.4 },
  { id: "lanede", staged: "stands on the floor", kind: "discountlane", ...at3(-2.00, 0, 0), speed: 0.5, len: 0, glow: 0 },
  { id: "laneus", staged: "stands on the floor", kind: "baglane", ...at3(2.00, 0, 0) },
  { id: "flagde", staged: "on the till post", kind: "miniflag", flag: "de", ...at3(-1.70, 0.66, -0.62), scale: 1.7 },   // Jonny 26 Nov: flags more visible
  { id: "bannerde", staged: "hangs from the ceiling over the lane", kind: "miniflag", flag: "de", ...at3(-1.40, 2.05, -1.60), scale: 5 },
  { id: "flagus", staged: "on the till pedestal", kind: "miniflag", flag: "us", ...at3(3.00, 0.66, 1.00), scale: 1.4 },   // Sol r1: it sat on the right edge (at 2.90 it covered Mash in cam 10)   // right of the till: at 1.7 on the till it covered Mash's face (cams 03, 10)
  { id: "bannerus", staged: "hangs from the ceiling over the lane", kind: "miniflag", flag: "us", ...at3(3.20, 1.50, -0.90), scale: 5 },   // Sol r1: a sliver at the top, the bag mountain covered it
  ...[0, 1, 2].map((i) => ({ id: `rackb${i}`, staged: "against the back wall", kind: "stockrack", ...at3(-3.675 + 1.35 * i, 0, -3.95), seed: 11 + i })),
  ...[0, 1, 2, 3].map((i) => ({ id: `rackl${i}`, staged: "against the left wall", kind: "stockrack", ...at3(-4.05, 0, -3.325 + 1.35 * i), rot: 90, seed: 21 + i })),
  ...[0, 1, 2].map((i) => ({ id: `racks${i}`, staged: "against the seam wall", kind: "stockrack", ...at3(-0.29, 0, -3.425 + 1.35 * i), rot: -90, seed: 51 + i })),
  ...[0, 1, 2, 3].map((i) => ({ id: `candy${i}`, staged: "against the seam wall", kind: "candyrack", ...at3(0.22, 0, -3.4 + 1.2 * i), rot: 90, seed: 31 + i })),
  ...[0, 1, 2].map((i) => ({ id: `candyb${i}`, staged: "against the back wall", kind: "candyrack", ...at3(1.05 + 1.2 * i, 0, -4.02), tiers: 8, h: 2.4, seed: 41 + i })),
  { id: "gum", staged: "against the counter's customer side", kind: "candyrack", ...at3(1.61, 0, -2.25), rot: -90, scale: 0.6, seed: 5 },
  ...[1.1, 2.7].flatMap((x, i) => [-2.8, -1.2, 0.4].flatMap((z, j) => [
    { id: `pend${i}${j}`, staged: "hangs on its cord from the ceiling", kind: "pendant", ...at3(x, 2.6, z), len: 0.8, r: 0.16 },
    { id: `pool${i}${j}`, staged: "light on the floor", kind: "lightpool", ...at3(x, 0.01, z), color: "#ffd9a0", w: 1.2, d: 0.8 }])),
  // belt goods ride the belt (tweened with its `len`), then fly to his armful (physics)
  ...BELT_GOODS.map((k, i) => ({ id: `g${i}`, staged: "rides the belt, then thrown to his arms", kind: k, ...at3(BELT_X, BELT_Y, goodZ(i)), ...(k === "tin" && { scale: 1.4 }) })),
  // worn hand props (body frame: x his left, y up from his body's bottom, z his front), hands posed on them
  { id: "teeth", staged: "worn: the card between his teeth", kind: "bankcard", wear: "spud", x: 0, y: 0.52, z: 0.48, rot: 0, tip: -12, scale: 1.8 },   // Sol r1: a blue bank card, the same one everywhere
  { id: "armful", staged: "worn: the goods in both arms", kind: "groceryarmful", wear: "spud", x: 0, y: 0.12, z: 0.44, n: 2 },
  { id: "eggs", staged: "worn: on his flat left palm", kind: "eggcarton", wear: "spud", x: 0.28, y: AWAY, z: 0.34, rattle: 0, scale: 1.5 },
  { id: "eggfly", staged: "thrown off the belt onto his palm", kind: "eggcarton", ...at3(-1.95, AWAY, 0.10), rattle: 0, scale: 1.5 },
  { id: "card", staged: "worn: held out in his right hand", kind: "bankcard", wear: "spud", x: -0.20, y: AWAY, z: 0.56, scale: 1.9, rot: 180 },
  { id: "cash", staged: "worn: the cash roll in his hand", kind: "cashroll", wear: "spudus", x: -0.24, y: 0.24, z: 0.30, scale: 1.4 },
  { id: "grape", staged: "worn: pinched in his right hand", kind: "grape", wear: "mash", x: -0.30, y: 0.62, z: 0.30, scale: 1.8 },   // Sol r1: lost against his glove
  { id: "apron", staged: "worn", kind: "apron", wear: "mash", color: "#3f8a3a", bib: { top: 0.60, w: 0.24 }, straps: true },
  { id: "cap", staged: "worn", kind: "tweedcap", wear: "retiree", color: "#75695a", fit: { H: 0.69, W: 0.74, D: 0.68, taper: 0.02, legH: 0.14 } },
  { id: "purse", staged: "worn: tucked in his crossed arms", kind: "pouch", wear: "retiree", x: 0.10, y: 0.30, z: 0.32, scale: 0.8 },
  { id: "tote", staged: "stands on the floor", kind: "shopbag", ...at3(-2.40, 0, 1.48), w: 0.34, h: 0.30, d: 0.16, color: "#e6dcc3", rope: "#e6dcc3" },
  { id: "coins", staged: "on the packing shelf", kind: "centrow", ...at3(-1.93, AWAY, 0.75), count: 0, scale: 1.05 },   // at the shelf's front corner, in his reach
  // the US bags: one, ten (a row), a mountain
  ...Array.from({ length: 10 }, (_, i) => ({ id: `bag${i}`, staged: "stands on the bagging top", kind: "paperbag", ...at3(2.06, AWAY, r3(0.72 - 0.27 * i)), rot: ((i * 37) % 17) - 8 })),
  ...["grape", "apple", "loaf", "egg", "milkcarton", "cheesewedge", "tin", "yogurtcup", "cinnabun", "candy"].map((k, i) => ({ id: `bi${i}`, staged: "stands in its bag", kind: k, ...at3(2.06, AWAY, r3(0.72 - 0.27 * i)), ...(k === "loaf" && { tip: 90 }), ...(k === "candy" && { scale: 2 }), ...(k === "tin" && { scale: 1.4 }) })),
  { id: "heap", staged: "the bag mountain, grows from the floor", kind: "bagheap", ...at3(1.86, 0, -1.22), grow: 0, pocket: { x: 1.25, z: 0.95, r: 0.50, h: 0.50 } },
  // queue shoppers
  { id: "q2", staged: "stands in the queue", kind: "streetpotato", ...at3(-2.80, 0, -1.95), coat: "#5f6b78", h: 0.95, hat: 1, rot: 15 },
  { id: "q3", staged: "stands in the queue", kind: "streetpotato", ...at3(-3.15, 0, -2.75), coat: "#6b6257", h: 1.05, rot: 15 },
  { id: "u1", staged: "stands in the queue", kind: "streetpotato", ...at3(0.85, 0, -0.70), coat: "#e0473a", h: 0.90, rot: 60 },
  // the seam's starers (panel 11), shown on that cut only
  ...[[-0.24, 1.55, 1.05, "#5f6b78"], [-0.84, 1.55, 0.95, "#6b6257"], [-0.50, 1.00, 1.10, "#4f5a52"], [-0.86, 1.00, 1.00, "#7a6f66"],
    [0.58, 2.10, 0.85, "#e0473a"], [0.24, 1.55, 1.05, "#3f8fd0"], [0.84, 1.55, 0.95, "#ffcf2e"], [0.50, 1.00, 1.10, "#2b3f8a"], [0.86, 1.00, 1.00, "#f29bb5"]]
    .map(([x, z, h, coat], i) => ({ id: `st${i}`, staged: "stares from the exit zone (panel 11)", kind: "streetpotato", ...at3(x, AWAY, z), h, coat, skin: "#f9b75c", angry: x < 0 ? 0.45 : 0.30,
      rot: r3(Math.atan2(S11[0] - x, S11[1] - z) * 180 / Math.PI) })),
];

// ---------------------------------------------------------------- helpers
const SUB = 470;
const CAPTEXT = { 0: "*Don't.* Stop. *Packing.*", 1: "*Nobody* survives this line.", 2: "Survives... *WHAT?*", 4: "For *each* grape?", 13: "*TOO. SLOW.*",
  15: "Is that... *paper money?*", 18: "*Cash.* Only.", 19: "Oh, hon... *Card only.*", 23: "*Take your time.*" };
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const step = (t, who, to, dur, o = {}) => A(t, who, "move", { to, dur, ...o });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2, set) => A(t, who, "expr", { expr: e, dur, ...(set && { set }) });
const FOLD = { o: [-0.06, 0.36, 0.24] }, CARRY = { o: [0.18, 0.30, 0.34] }, DOWN = { o: [0.26, 0.18, 0.06] };
const place = (t, who, to, yaw, y = 0) => {
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const wear = (t, id, set) => c.prop(r3(t - 0.02), id, set, 0);
const hideProp = (t, id) => wear(t, id, { y: AWAY });

// Wedge's scanning sweep: the right hand over the glass, n Hz, from t for dur (a beep on every pass)
const scan = (t0, dur, hz, beepGain = 0.35) => {
  const half = r3(0.5 / hz);
  for (let k = 0, t = t0; t < t0 + dur; k++, t = r3(t + half)) {
    arm(t, "wedge", "R", { o: [k % 2 ? 0.30 : 0.10, 0.40, 0.42] }, r3(half * 0.9), "inOut");
    if (k % 2 === 0) sfx(r3(t + half * 0.5), "timer-beep", { gain: beepGain });
  }
};
// the belt rolls: len grows by speed x time
let LEN = 0, LAST = 0, SPEED = 0.5;
const belt = (t, speed) => { LEN = r3(LEN + SPEED * (t - LAST)); LAST = t; SPEED = speed; c.prop(t, "lanede", { speed, len: LEN }, 0, "linear"); };
const beltRoll = (t1) => { const len = r3(LEN + SPEED * (t1 - LAST)); c.prop(LAST, "lanede", { len }, r3(t1 - LAST), "linear"); LEN = len; LAST = t1; };
// body frame (x his left, z his front) -> world, for a mark and a yaw (yaw 0 faces +z; his left is then +x)
const world = (at, yaw, [bx, by, bz]) => { const q = yaw * Math.PI / 180, f = [Math.sin(q), Math.cos(q)], l = [Math.cos(q), -Math.sin(q)]; return [r3(at[0] + bx * l[0] + bz * f[0]), r3(by), r3(at[1] + bx * l[1] + bz * f[1])]; };
// one good off the belt's end: it rides the last 0.5 m of the belt, then flies on a LOW tweened arc (under his face: Sol r1, a
// can crossed it) into his armful, which grows; or (toArmful false) a physics throw to the floor in front of him. Each fling is
// its own prop (draft 2 reused nine physics bodies, so goods kept tumbling through later shots: Sol r1 items 3 and 5).
let NF = 0, ARMN = 2;
const ARMFUL_AT = world(DE.H, 55, [0, 0.40, 0.44]);
const fling = (t, flight = 0.3, toArmful = true, to = [-2.30, 0.04, 1.75]) => {
  const k = BELT_GOODS[NF % BELT_GOODS.length], id = `f${NF++}`;
  props.push({ id, staged: toArmful ? "thrown off the belt into his armful" : "thrown off the belt to the floor", kind: k, ...at3(BELT_X, AWAY, -0.40), ...(k === "tin" && { scale: 1.4 }) });
  const t0 = r3(Math.max(0.03, t - 0.35));
  wear(t0, id, { y: BELT_Y, z: -0.40 });
  c.prop(t0, id, { z: 0.10 }, r3(t - t0), "linear");
  if (toArmful) {
    const [ax, ay, az] = ARMFUL_AT, h = r3(flight / 2);
    c.prop(t, id, { x: r3((BELT_X + ax) / 2), y: 0.62, z: r3((0.10 + az) / 2), rot: 150 }, h, "out");
    c.prop(r3(t + h), id, { x: ax, y: ay, z: az, rot: 300 }, h, "in");
    hideProp(r3(t + flight + 0.02), id);
    ARMN = Math.min(6, ARMN + 1);
    c.prop(r3(t + flight), "armful", { n: ARMN }, 0.1, "out");
    sfx(r3(t + flight), "ai-package/box-set-down", { gain: 0.3 });
  } else {
    c.throw(t, id, { to, in: flight, spin: [3, 1, 0.5] });
    sfx(r3(t + flight), "ai-package/box-set-down", { gain: 0.25 });
  }
};
const sigh = (t, gain = 0.7) => { sfx(t, "ai-package/flat-exhale", { gain }); A(t, "retiree", "squash", { amount: -0.03, dur: 0.33 }); A(r3(t + 0.33), "retiree", "squash", { amount: 0, dur: 0.6 }); };
const tapWatch = (t) => { for (let k = 0; k < 3; k++) { arm(r3(t + k * 0.33), "retiree", "R", { o: [0.10, 0.36, 0.30] }, 0.15, "out"); arm(r3(t + k * 0.33 + 0.16), "retiree", "R", { o: [0.12, 0.40, 0.30] }, 0.15, "in"); }  };

// ---------------------------------------------------------------- cameras (DESIGN §0): every shot pushes in, linear
const CAM = {
  1: { pos: [-2.85, 1.15, 7.2], look: [-2.45, 1.05, 0], fov: 34, push: [-2.82, 1.14, 6.6] },
  2: { pos: [-2.45, 0.62, 2.55], look: [-1.40, 1.12, 0], fov: 40, push: [-2.38, 0.63, 2.38] },
  3: { pos: [1.85, 1.05, 5.4], look: [2.25, 0.98, 0.4], fov: 32, push: [1.88, 1.05, 5.0] },   // stills 2: Mash was cut by the right edge
  4: { pos: [-2.80, 1.00, 5.2], look: [-2.10, 0.92, 0], fov: 34, push: [-2.76, 1.00, 4.8] },
  5: { pos: [-2.90, 0.80, 4.9], look: [-2.94, 0.72, 0.3], fov: 24, push: [-2.90, 0.80, 4.5] },
  6: { pos: [2.02, 2.20, 3.30], look: [2.04, 0.46, -0.60], fov: 36, push: [2.02, 2.05, 2.9] },
  7: { pos: [-2.65, 1.25, 7.0], look: [-2.40, 0.95, 0.2], fov: 36, push: [-2.63, 1.22, 6.5] },
  8: { pos: [1.85, 1.35, 7.6], look: [1.70, 1.35, 0], fov: 34, push: [1.83, 1.33, 7.0] },
  9: { pos: [-2.45, 0.95, 5.0], look: [-1.80, 1.05, 0], fov: 22, push: [-2.41, 0.95, 4.65] },
  10: { pos: [1.80, 0.95, 5.2], look: [2.64, 1.02, -0.4], fov: 22, push: [1.84, 0.95, 4.85] },   // stills 2: Mash was cut by the right edge
  11: { pos: [0, 2.15, 8.2], look: [0, 0.95, 2.4], fov: 24, push: [0, 2.08, 7.8] },
  12: { pos: [-2.15, 1.75, 5.4], look: [-2.15, 0.95, 0.45], fov: 36, push: [-2.15, 1.68, 5.0] },   // stills 2: the retiree (R12 moved left) was out of frame
  13: { pos: [-2.20, 0.72, 5.6], look: [-2.60, 0.90, 1.3], fov: 24, push: [-2.23, 0.73, 5.25] },
  14: { pos: [-3.75, 0.74, 3.6], look: [-3.46, 0.80, -0.3], fov: 33, push: [-3.75, 0.74, 3.3] },   // stills 2: Spud (H moved left) covered the retiree; Sol r1: his far lens and hand were cut by the right edge
  15: { pos: [1.40, 0.72, 4.6], look: [1.60, 0.76, -0.2], fov: 24, push: [1.42, 0.72, 4.25] },
  17: { pos: [-1.05, 1.05, 4.1], look: [-2.95, 0.78, 0.75], fov: 32, push: [-1.10, 1.04, 3.85] },   // Sol r1: the shove from the side, both bodies in the clear
  16: { pos: [-1.70, 1.60, 1.72], look: [-2.08, 0.50, 0.80], fov: 30, push: [-1.71, 1.55, 1.60] },   // Sol r1: the coins insert (tray + his fingertip)
};
const LANE = (k) => ({ 3: "us", 6: "us", 8: "us", 10: "us", 15: "us", 11: "seam" }[k] ?? "de");
const GRADE = { de: { s: 0.98, w: -0.45, c: 1.06 }, us: { s: 1.16, w: 0.50, c: 1.00 }, seam: { s: 1.16, w: 0.50, c: 1.00 } };
const shots = [], grade = [], splits = [];
const shot = (name, t, k, kind) => {
  const at = F2(t), { push, ...cam } = CAM[k];
  shots.push([name, at, { ...cam, push }, kind].filter((v) => v !== undefined)); CUTS.add(at);
  grade.push([at, GRADE[LANE(k)]]);
  // the retiree's reaction shots (cam 14) are his alone: you step out of the line of sight (gate: his eyes were behind you)
  // Sol r2: the queue extras touched his cap: they step out of his close-ups too
  if (k === 14 && !SOLO.on) { c.A(r3(at - 0.02), "spud", "hide"); for (const q of ["q2", "q3"]) c.prop(r3(at - 0.02), q, { y: AWAY }, 0); SOLO.on = true; }
  else if (k !== 14 && SOLO.on) { c.A(r3(at - 0.02), "spud", "show"); for (const q of ["q2", "q3"]) c.prop(r3(at - 0.02), q, { y: 0 }, 0); SOLO.on = false; }
  return at;
};

// ---------------------------------------------------------------- frame 0
A(0, "spudus", "hide"); place(0.02, "spudus", PARK.spudus, 0);
for (const id of ["eggs", "card"]) hideProp(0.02, id);
arm(0, "spud", "both", CARRY, 0.01); grip(0, "spud", "both", "hold", 0.01);
expr(0, "spud", "shocked", 0.01, { open: 0.08 });
expr(0, "mash", "happy", 0.01, { open: 0.05 });
look(0, "spud", [0.7, -0.1], 0.01);
look(0, "wedge", [-0.8, -0.2], 0.01); A(0, "wedge", "face", { lid: 0, dur: 0.01 });
A(0, "wedge", "noblink");   // Sol r1: he blinked at 0.7, 15, 29, 44, 51 s; the cashier never blinks
for (const s of ["R", "L"]) arm(0, "retiree", s, FOLD, 0.01);
look(0, "retiree", [0.6, -0.1], 0.01);
arm(0, "mash", "R", { o: [-0.10, 0.62, 0.30] }, 0.01); grip(0, "mash", "R", "pinch", 0.01);
look(0, "mash", [-0.6, 0], 0.01);
arm(0, "spudus", "R", { o: [-0.24, 0.30, 0.30] }, 0.01); grip(0, "spudus", "R", "hold", 0.01);
belt(0, 0.9);
for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) c.prop(0, `pool${i}${j}`, { on: 0.45 }, 0, "linear");

// ================================================================ 1 THE HOOK: the German line (01, 02, 13)
let t;
const S1 = shot("de-wide", 0, 1, "hook");
scan(0, 3.8, 4);
fling(0.08, 0.28); fling(0.62, 0.28); fling(1.18, 0.28);   // Sol r1: start on the action
t = say(0, 0.1);   // Don't. Stop. Packing.
see(0, 1.6, ["spud.face", "wedge.face", "retiree", "lanede"], "frame 0: goods fly off a fast belt at you, a stern cashier, a retiree behind");
const S2 = shot("wedge-low", r3(t + 0.02), 2);
arm(S2, "wedge", "L", { o: [0.20, 0.55, 0.45] }, 0.2, "out"); grip(S2, "wedge", "L", "point", 0.1);
t = say(1, r3(S2 + 0.08));   // Nobody survives this line.
see(S2, t, ["wedge.face"], "the threat: nobody survives this line");
const S3 = shot("hero-de", r3(t + 0.04), 13);   // Sol r1: cut on "line"; no fling here (a carton clipped through the armful)
arm(S3, "wedge", "L", DOWN, 0.2);
t = say(2, r3(S3 + 0.1));   // Survives... WHAT?
for (let k = 0; k < 3; k++) wear(r3(T[2] + 0.35 * k), "teeth", { tip: k % 2 ? -10 : -28 });
see(S3, t, ["spud.face", "teeth"], "his question, the card in his teeth (plant)");

// ================================================================ 2 THE AMERICAN LINE (03)
const S4 = shot("us-med", r3(t + 0.08), 3);
place(S4, "spudus", US.HU, 80); A(r3(S4 - 0.02), "spudus", "show");
expr(S4, "spudus", "kind", 0.01); look(S4, "spudus", [0.6, 0.1], 0.01);
showBag(S4, 0, false);
t = say(3, r3(S4 + 0.12));   // Paper or plastic?
arm(r3(t + 0.05), "mash", "R", { o: [-0.12, 0.72, 0.28] }, 0.25);
t = say(4, r3(t + 0.12));   // For each grape?
expr(r3(T[4] + 0.2), "spudus", "deadpan", 0.2);
// Sol r1: show the grape go over the bag's rim and the next one come up in a clear second pinch
arm(r3(t + 0.1), "mash", "R", { o: [-0.20, 0.50, 0.36] }, 0.45);   // down into bag 1
const DROP = r3(t + 0.55);
hideProp(DROP, "grape"); wear(DROP, "bi0", { y: 0.56 }); sfx(DROP, "kenney/book-place", { gain: 0.25 });
arm(r3(DROP + 0.05), "mash", "R", { o: [-0.12, 0.72, 0.28] }, 0.35, "out");   // and the next grape up
wear(r3(DROP + 0.25), "grape", { y: 0.62 });
showBag(r3(DROP + 0.1), 1, false);
t = say(24, r3(DROP + 0.3));   // And grape number two!
A(r3(T[24] + 0.3), "spudus", "face", { lid: 0.45, dur: 0.3 });
see(S4, t, ["mash.face", "grape", "cash"], "one grape held up over one bag; you with a cash roll (plant)");
function showBag(tt, i, withItem = true) { wear(tt, `bag${i}`, { y: 0.46 }); if (withItem) wear(tt, `bi${i}`, { y: 0.46 + 0.10 }); }

// ================================================================ 3 THE SIGH + FASTER (14, 02, 04)
const S5 = shot("retiree", r3(t + 0.12), 14);
look(S5, "retiree", [0.5, 0.0], 0.01); expr(S5, "retiree", "annoyed", 0.01);
sigh(r3(S5 + 0.05));
t = say(5, r3(S5 + 0.1));   // Hhhhhhh.
t = r3(t + 0.25);
see(S5, t, ["retiree.face"], "the retiree sighs at how slow you are");
const S6 = shot("faster", t, 2);
t = say(6, r3(S6 + 0.08));   // Faster.
belt(r3(T[6] + 0.3), 1.6);
scan(r3(T[6] + 0.2), 0.7, 5);
const S7 = shot("eggs", r3(t + 0.12), 13);   // Sol r2: the catch in the close-up (cam 04 had you cut by the edge)
// Sol r1: the eggs fly off the belt and LAND on his flat palm, on their own (the other goods come after the catch)
arm(S7, "spud", "L", { o: [0.22, 0.52, 0.40] }, 0.01); grip(S7, "spud", "L", "flat", 0.01);
const PALM = world(DE.H, 55, [0.22, 0.54, 0.40]), EGG = r3(S7 + 0.1), LAND = r3(EGG + 0.32);
wear(EGG, "eggfly", { x: BELT_X, y: BELT_Y, z: 0.10 });
c.prop(EGG, "eggfly", { x: r3((BELT_X + PALM[0]) / 2), y: 0.66, z: r3((0.10 + PALM[2]) / 2), rot: 120 }, 0.16, "out");
c.prop(r3(EGG + 0.16), "eggfly", { x: PALM[0], y: PALM[1], z: PALM[2], rot: 55 }, 0.16, "in");
hideProp(LAND, "eggfly"); wear(LAND, "eggs", { y: 0.54, x: 0.22, z: 0.40, rattle: 0 });
sfx(LAND, "ai-package/box-set-down", { gain: 0.35 });
c.prop(LAND, "eggs", { rattle: 1 }, 0.3, "out");
expr(r3(LAND - 0.1), "spud", "terrified", 0.15, { open: 0.1 });
t = say(7, r3(LAND - 0.05));   // Not the eggs!
// Sol r2: nothing else flies while the eggs land (a milk carton read as the eggs)
scan(S7, r3(t - S7), 5, 0.3);
t = r3(Math.max(t, LAND + 0.97));
see(S7, t, ["spud.face", "eggs", "wedge.face"], "he catches the eggs one-handed, the belt a blur");

// ================================================================ 4 TEN BAGS (06, 15)
const S8 = shot("ten-bags", r3(t + 0.1), 6);
hideProp(S8, "eggs");
place(S8, "spudus", US.H6, 75); A(S8, "spudus", "pitch", { to: 8, dur: 0.01 });
arm(S8, "spudus", "both", FOLD, 0.01); A(S8, "spudus", "face", { lid: 0.5, dur: 0.01 });
hideProp(S8, "cash");
hideProp(S8, "grape");
for (let i = 0; i < 6; i++) showBag(S8, i);
hideProp(S8, "bi1");
place(S8, "mash", US.M, -60); A(S8, "mash", "pitch", { to: 25, dur: 0.01 });
arm(S8, "mash", "L", { o: [0.05, 0.75, 0.25] }, 0.01); arm(S8, "mash", "R", DOWN, 0.01); grip(S8, "mash", "R", "relaxed", 0.01);   // draft 1: his grape arm stayed up by his head
for (let i = 6; i < 10; i++) { showBag(r3(S8 + 0.3 + (i - 6) * 0.35), i); sfx(r3(S8 + 0.3 + (i - 6) * 0.35), "kenney/book-place", { gain: 0.3 }); }
t = say(8, r3(S8 + 0.15));   // So... how's your mom?
t = r3(Math.max(t, S8 + 1.4));
see(S8, t, ["mash.face", "spudus.face", "bag0", "bag9"], "ten bags, one thing in each, and small talk");
const S9 = shot("hero-us", r3(t + 0.05), 15);
A(S9, "spudus", "turn", { to: 25, dur: 0.01 });   // face 3/4 to the lens (DESIGN cam 15)
expr(S9, "spudus", "annoyed", 0.01);
t = say(9, r3(S9 + 0.08));   // Please. Just. Bag.
c.prop(r3(S9 - 0.02), "heap", { grow: 0.25 }, 0);   // Sol r2: the bags popped in behind you mid-shot
see(S9, t, ["spudus.face"], "please, just bag");

// ================================================================ 5 THE RETIREE + THE CARD (05, 13, 14)
const S10 = shot("sigh-ots", r3(t + 0.1), 5);
place(S10, "spud", DE.H5, 200); hideProp(S10, "armful"); hideProp(S10, "teeth"); hideProp(S10, "tote"); A(r3(S10 - 0.02), "spud", "hide"); for (const q of ["q2", "q3"]) hideProp(S10, q);   // Sol r2: your sleeve and the queue crowded his watch: his shot alone
place(S10, "retiree", DE.R5, 10); A(S10, "retiree", "pitch", { to: 12, dur: 0.01 });
arm(S10, "retiree", "L", { o: [-0.04, 0.46, 0.36] }, 0.01);   // Sol r1: the watch wrist in front of his own chest, clear of your cuff
sigh(r3(S10 + 0.05), 0.9);
t = say(10, r3(S10 + 0.08));   // Hhhhhhhhh. Too slow.
tapWatch(r3(T[10] + 0.3));   // Sol r2: tap inside the breath
see(S10, t, ["retiree.face"], "he sighs and taps his watch: too slow");
const S11a = shot("card-tease", r3(t + 0.1), 13);
A(r3(S11a - 0.02), "spud", "show"); for (const q of ["q2", "q3"]) wear(S11a, q, { y: 0 });
place(S11a, "spud", DE.H, 55); wear(S11a, "armful", { y: 0.12 }); wear(S11a, "teeth", { y: 0.52 }); wear(S11a, "tote", { y: 0 }); arm(S11a, "spud", "both", CARRY, 0.01);
const S11b = shot("tsk", r3(S11a + 0.45), 14);
place(S11b, "retiree", DE.R1, 20); A(S11b, "retiree", "pitch", { to: 0, dur: 0.01 });
for (const s of ["R", "L"]) arm(S11b, "retiree", s, FOLD, 0.01);
look(S11b, "retiree", [0.6, 0.0], 0.01); expr(S11b, "retiree", "stern", 0.01);
t = say(11, r3(S11b + 0.08));   // A card. Pah.
for (let k = 0; k < 3; k++) A(r3(T[11] + 0.9 + k * 0.25), "retiree", "turn", { to: k % 2 ? 32 : 8, dur: 0.2 });
see(S11b, t, ["retiree.face"], "tease 1: he spots the card and shakes his head");

// ================================================================ 6 THE PEAK, BOTH LANES (07, 14, 08)
const S12 = shot("de-peak", r3(t + 0.1), 7);
place(S12, "retiree", DE.R7, 30);
belt(S12, 2.4);
scan(S12, 2.6, 6, 0.4);
c.prop(S12, "lanede", { glow: 1.6 }, 0.2);
// Sol r1: a clear spark at the scanner on each scan (a flare on the glass + a shake)
for (let k = 0; k < 3; k++) { const ts = r3(S12 + 0.3 + k * 0.25); SHAKES.push({ do: "shake", at: ts, dur: 0.067, amp: 0.03 }); SHAKES.push({ do: "glint", at: ts, dur: 0.3, pos: [-1.97, 0.52, 0.22], size: 0.2 }); sfx(ts, "timer-beep", { gain: 0.5 }); }
for (let k = 0; k < 5; k++) fling(r3(S12 + 0.1 + k * 0.32), k < 2 ? 0.2 : 0.35, k < 2, [r3(-2.45 + k * 0.08), 0.04, r3(1.65 + (k % 2) * 0.12)]);
expr(S12, "spud", "terrified", 0.01, { open: 0.2 });
t = say(12, r3(S12 + 0.5));   // Use your feet.
A(r3(T[12] + 0.3), "spud", "tap", { side: "R", count: 2, every: 0.24, lift: 2.0 });   // Sol r1: one visible foot on "feet"
t = r3(t + 0.35);
see(S12, t, ["spud.face", "wedge.face", "retiree.face", "lanede"], "the peak: sparks, goods flying, he packs with his feet");
const S13 = shot("too-slow", t, 14);
place(S13, "retiree", DE.R1, 20); expr(S13, "retiree", "angry", 0.01);
sigh(r3(S13 + 0.05), 1.0);
t = say(13, r3(S13 + 0.12));   // TOO. SLOW.
see(S13, t, ["retiree.face"], "TOO. SLOW.");
const S14 = shot("us-peak", r3(t + 0.03), 8);
c.prop(r3(S14 - 0.02), "heap", { grow: 1 }, 0);
for (let i = 0; i < 10; i++) { hideProp(S14, `bag${i}`); hideProp(S14, `bi${i}`); }
place(S14, "spudus", US.H8, 10); A(S14, "spudus", "pitch", { to: 0, dur: 0.01 });
arm(S14, "spudus", "both", DOWN, 0.01); expr(S14, "spudus", "deadpan", 0.01);
place(S14, "mash", US.M8, -35); A(S14, "mash", "pitch", { to: 0, dur: 0.01 }); arm(S14, "mash", "R", DOWN, 0.01);
arm(r3(S14 + 0.3), "mash", "L", { o: [0.35, 0.55, 0.40] }, 0.35); grip(r3(S14 + 0.3), "mash", "L", "open", 0.2);
t = say(14, r3(S14 + 0.3));   // Need help to your car, hon?
t = r3(t + 0.2);
see(S14, t, ["spudus.face", "mash.face", "heap"], "the bags reach the ceiling: need help to your car?");

// ================================================================ 7 THE TOTALS, back to back (09, 08); then the cash (10)
// Sol r1: the price comes before the cash offer, and the two totals sit together
const S16 = shot("total-de", t, 9);
place(S16, "spud", DE.H9, 135); hideProp(S16, "armful"); hideProp(S16, "teeth"); hideProp(S16, "tote");
place(S16, "wedge", DE.W, -65, PLAT);
arm(S16, "wedge", "R", DOWN, 0.01);
t = say(16, r3(S16 + 0.1));   // Twelve forty.
wear(r3(t + 0.05), "card", { y: 0.56 });
arm(r3(t), "spud", "R", { o: [-0.20, 0.46, 0.50] }, 0.25, "out");
const S17 = shot("total-us", r3(t + 0.4), 8);
expr(S17, "mash", "happy", 0.01, { open: 0.05 }); place(S17, "mash", US.M8, -35); arm(S17, "mash", "both", DOWN, 0.01); A(S17, "mash", "pitch", { to: 0, dur: 0.01 });
place(S17, "spudus", US.H8, 10); hideProp(S17, "cash");
t = say(17, r3(S17 + 0.08));   // Three hundred twelve forty!
expr(r3(T[17] + 0.6), "spudus", "shocked", 0.15, { open: 0.3 });
const S15 = shot("paper-money", r3(t + 0.1), 10);
// Sol r1: your hand and the cash roll are IN the close-up (foreground left), before he asks
place(S15, "spudus", US.H10F, 150); wear(S15, "cash", { y: 0.64, x: -0.27, z: 0.50, edge: 2.6 });
arm(S15, "spudus", "R", { o: [-0.27, 0.72, 0.50] }, 0.01);
place(S15, "mash", US.M10, -35); arm(S15, "mash", "both", DOWN, 0.01); arm(S15, "mash", "R", { o: [0.14, 0.16, -0.02] }, 0.01); grip(S15, "mash", "both", "relaxed", 0.01); A(S15, "mash", "pitch", { to: 4, dur: 0.01 });
expr(r3(S15 + 0.15), "mash", "shocked", 0.2, { open: 0.1 });
t = say(15, r3(S15 + 0.2));   // Is that... paper money?
t = say(25, r3(t + 0.12));   // It's money.
expr(r3(t + 0.05), "mash", "happy", 0.25, { open: 0.05 });
t = say(26, r3(t + 0.15));   // Cute.
see(S15, t, ["mash.face", "cash"], "tease 2: he stares at your cash like a fossil");

// ================================================================ 8 NOBODY LETS YOU PAY, side by side (09, 10, 11)
const S18 = shot("cash-only", r3(t + 0.1), 9);
place(S18, "spud", DE.H9, 135); wear(S18, "card", { y: 0.56 }); arm(S18, "spud", "R", { o: [-0.20, 0.46, 0.50] }, 0.01);
A(S18, "wedge", "face", { lid: 0, dur: 0.01 }); expr(S18, "wedge", "stern", 0.01);
look(S18, "wedge", [-0.3, -0.4], 0.01);
t = say(27, r3(S18 + 0.15));   // What. Is. This?
t = say(18, r3(t + 0.25));   // Cash. Only.
see(S18, t, ["wedge.face", "card"], "the German answer: cash only");
// (Sol r1: the retiree's gasp cut, so "Cash. Only." and "Card only." sit together)
const S20 = shot("card-only", r3(t + 0.08), 10);
place(S20, "spudus", US.H10F, 150); wear(S20, "cash", { y: 0.64 }); arm(S20, "spudus", "R", { o: [-0.27, 0.72, 0.50] }, 0.01);
place(S20, "mash", US.M10, -35); arm(S20, "mash", "both", DOWN, 0.01); arm(S20, "mash", "R", { o: [0.14, 0.16, -0.02] }, 0.01); A(S20, "mash", "pitch", { to: 4, dur: 0.01 }); expr(S20, "mash", "sad", 0.01);
t = say(19, r3(S20 + 0.1));   // Oh, hon... Card only.
see(S20, t, ["mash.face", "cash"], "the American answer: card only");
const S21 = shot("seam", r3(t + 0.1), 11);
SPLIT.from = S21;
for (const p of props.filter((p) => p.id.startsWith("st"))) wear(S21, p.id, { y: 0 });
place(S21, "retiree", [-0.58, 2.10], 172); for (const s of ["R", "L"]) arm(S21, "retiree", s, FOLD, 0.01);
expr(S21, "retiree", "annoyed", 0.01);
place(S21, "spud", S11, 0); wear(S21, "armful", { y: 0.12, n: 6 }); hideProp(S21, "card");
arm(S21, "spud", "R", { o: [0.02, 0.13, 0.44] }, 0.01); arm(S21, "spud", "L", { o: [0.30, 0.34, 0.30] }, 0.01); grip(S21, "spud", "L", "open", 0.01);   // Sol r2: one forearm across under the armful, the other hand free for the plea   // Sol r1: forearms UNDER the armful (it floated against his sweater)
expr(S21, "spud", "sad", 0.01); look(S21, "spud", [0, -0.5], 0.01);
look(r3(S21 + 0.8), "spud", [0, 0.05], 0.3);
t = say(20, r3(S21 + 0.1));   // I just want to go home.
t = r3(t + 0.1);
SPLIT.to = t;
see(S21, t, ["spud.face", "st0", "st5"], "both lines stare at you: nobody lets you pay");

// ================================================================ 9 THE TAG: CENTS (01, 16, 12)
const S22 = shot("move", t, 17);
for (const p of props.filter((p) => p.id.startsWith("st"))) hideProp(S22, p.id);
place(S22, "spud", DE.HS, -10); place(S22, "retiree", [-2.85, -0.10], 20);   // side camera: his face clear of you and your armful wear(S22, "tote", { y: 0 });   // Sol r1: the tote is back beside you
arm(S22, "spud", "both", CARRY, 0.01); expr(S22, "spud", "sad", 0.01);
place(S22, "wedge", DE.W, -65, PLAT); expr(S22, "wedge", "deadpan", 0.01);
belt(S22, 0);
for (const g of ["g7", "g8"]) hideProp(S22, g);   // the last belt goods have reached the glass: off before the pay
t = say(21, r3(S22 + 0.1));   // Move.
// Sol r1: the shove reads: he comes round your RIGHT side (in the clear, not behind you), his shoulder meets yours, then you slide out
step(r3(T[21] + 0.05), "retiree", DE.RS, 0.45); turn(r3(T[21] + 0.3), "retiree", -32, 0.2);
const HIT = r3(T[21] + 0.5);
A(HIT, "spud", "squash", { amount: 0.06, dur: 0.15 }); A(HIT, "retiree", "pitch", { to: 6, dur: 0.12 });
sfx(HIT, "pat", { gain: 0.4 });
step(r3(HIT + 0.02), "spud", DE.OUT, 0.45);
step(r3(HIT + 0.2), "retiree", DE.R12, 0.35); turn(r3(HIT + 0.12), "retiree", 75, 0.5); A(r3(HIT + 0.15), "retiree", "pitch", { to: 0, dur: 0.2 });
t = r3(HIT + 0.4);   // cut on the slide (his step to the tray is behind the cut)
see(S22, t, ["retiree", "spud"], "the retiree shoulders you aside");
// Sol r1: cut in on the tray; each count is a fingertip down, a coin, the finger up
const S23 = shot("coins", t, 16);
place(S23, "retiree", DE.R12, 144); place(S23, "wedge", DE.W12, -40, PLAT); A(S23, "wedge", "pitch", { to: 10, dur: 0.01 });
wear(S23, "coins", { y: 0.46, count: 0 });
wear(S23, "purse", { y: AWAY }); hideProp(S23, "q2"); hideProp(S23, "q3");   // the queue extras sat right behind the tray in the insert
expr(S23, "wedge", "deadpan", 0.01); look(S23, "wedge", [-0.4, -0.5], 0.01);
look(S23, "retiree", [0.3, -0.7], 0.01); expr(S23, "retiree", "focused", 0.01);
arm(S23, "retiree", "R", { o: [-0.02, 0.64, 0.44] }, 0.01); A(S23, "retiree", "pitch", { to: 8, dur: 0.01 }); grip(S23, "retiree", "R", "pinch", 0.01);   // Sol r2: a coin between his fingertips, not a pointing finger
t = say(22, r3(S23 + 0.15));   // One cent. Two cent. Three cent...
for (let k = 0; k < 3; k++) {
  const tc = r3(T[22] + 0.1 + k * 1.15);
  arm(tc, "retiree", "R", { o: [r3(-0.02 - k * 0.049), 0.56, r3(0.46 + k * 0.035)] }, 0.18, "in");
  c.prop(r3(tc + 0.18), "coins", { count: k + 1 }, 0.1); sfx(r3(tc + 0.18), "coins", { gain: 0.4 });
  arm(r3(tc + 0.4), "retiree", "R", { o: [r3(-0.02 - k * 0.049), 0.64, r3(0.44 + k * 0.035)] }, 0.25, "out");
}
const S24 = shot("take-your-time", r3(t - 0.15), 12);
const SMILE = r3(S24 + 0.1);
expr(SMILE, "wedge", "happy", 0.3, { open: 0.05 });
t = say(23, r3(SMILE + 0.2));   // Take your time.
// Sol r2: no fourth coin (it appeared with no hand)
const END = F2(t + 0.45);
see(S24, END, ["wedge.face", "coins"], "he pays in cents and the cashier who rushed you smiles: take your time");

// blinks between the lines (no blink on a line)
act.blinksAt(c, "spud", [4.0, 15.0, 30.0]);
act.blinksAt(c, "spudus", [9.0, 22.0]);
act.blinksAt(c, "mash", [8.0, 21.0, 40.0]);
act.blinksAt(c, "retiree", [12.0, 26.0]);

// the belt rolls to the end
beltRoll(END);
// a caption ends where the next one starts
{ const cs = [...c.captions].sort((x, y) => x.from - y.from); for (let k = 0; k + 1 < cs.length; k++) if (cs[k].to > cs[k + 1].from - 0.02) cs[k].to = r3(cs[k + 1].from - 0.02); }
for (let i = 0; i < shots.length; i++) {
  const [, at, cam] = shots[i], len = r3((shots[i + 1]?.[1] ?? END) - at), { push, ...rest } = cam;
  shots[i][2] = { ...rest, to: { pos: push }, dur: len, ease: "linear" };
}
const beats = c.beats(shots, END);

write(import.meta.url, {
  id: "checkout",
  title: "Paying at the supermarket: Germany vs America",
  idea: "Country vs Country 01: you pay at a German checkout (a cashier who never blinks, a belt that throws your shopping at you, a retiree sighing behind you) and at an American one (one item per bag, small talk, a mountain of bags); you pay with what you brought, a card in Germany and cash in America, and neither lane takes it. The retiree pays in cents and the cashier who rushed you smiles.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [290, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#dfe5e8", floor: "none", light: "soft", para: 0, aperture: 0, shadow: { size: 5 },
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, split: { from: SPLIT.from, to: SPLIT.to, x: 540, soft: 6, s: 0.98, w: -0.45 },
  music: { style: "bounce", lowCut: 150, gain: 0.26 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [55, 90] },
  hook: { show: ["spud", "wedge", "lanede"], hint: 0, what: "goods fly off a fast German checkout belt at you; the cashier: Don't. Stop. Packing. Nobody survives this line." },
  fx: SHAKES, cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wedge", with: "lanede", from: 0, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "the cashier stands on the lane's own platform behind the till and sweeps his hand over the scanner glass (DESIGN §2); rough draft" },
    { who: "wedge", with: "g7", from: 1.3, to: 2.2, checks: ["hand-in-prop"], reason: "his scanning hand brushes the tin as it passes the glass (2 cm, a scan)" },
    { who: "retiree", with: "spud", from: r3(HIT - 0.15), to: r3(HIT + 0.15), maxReach: 0.08, checks: ["character-overlap", "clipping", "reach"], reason: "the shove: his shoulder meets yours (Sol r1 asked for visible contact), 3 cm for two frames" },
    { who: "spud", with: "retiree", from: r3(HIT - 0.15), to: r3(HIT + 0.15), maxReach: 0.08, checks: ["character-overlap", "clipping", "reach"], reason: "the shove: your arm meets his shoulder (6 cm, five frames)" },
    { who: "retiree", with: "lanede", from: r3(HIT - 0.1), to: r3(HIT + 0.55), checks: ["costume-in-prop"], reason: "his cardigan brushes the packing shelf's end as he shoves past (6 cm, two frames)" },
    { who: "spud", with: "purse", from: r3(HIT - 0.1), to: r3(HIT + 0.15), checks: ["costume-in-prop", "arm-in-prop"], reason: "the shove: the purse in his folded arms touches your sweater" },
    { who: "retiree", with: "lanede", from: 44.9, to: END, checks: ["hand-in-prop"], reason: "his hand rests on the packing shelf's edge while he places the coins (Sol r2: the hand must reach the tray); 5-6 cm, the glove's pad on the steel" },
    { who: "retiree", with: "coins", from: 44.9, to: END, checks: ["hand-in-prop"], reason: "his fingertips set each coin on the pay tray (3-4 cm into the tray's lip)" },
    { who: "mash", with: "grape", from: 6.2, to: 10.8, checks: ["costume-in-prop"], reason: "the big grape hangs from his pinch against his hoodie cuff (3 cm)" },
    { who: "mash", with: "apron", from: 0, to: END, checks: ["clipping"], reason: "the apron is worn on his body (DESIGN §6)" },
    { who: "retiree", with: "cap", from: 0, to: END, checks: ["clipping"], reason: "the cap is worn on his head (DESIGN §5)" },
    { who: "spudus", with: "laneus", from: 0, to: END, checks: ["clipping", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "his forearms rest folded on the counter edge (panel 6, DESIGN §3 H6); rough draft" },
    { who: "spudus", with: "cash", from: 0, to: END, checks: ["hand-in-prop", "arm-in-prop"], reason: "the cash roll is worn in his closed hand (rough draft, no grip polish)" },
    { who: "spud", with: "card", from: 0, to: END, checks: ["hand-in-prop"], reason: "the card is worn in his hand (rough draft, no grip polish)" },
  ],
  notes: "Generated by storyboards/series/country-vs-country/01-checkout/make-checkout.mjs. Rough draft: staging only, no hand polish.",
});
