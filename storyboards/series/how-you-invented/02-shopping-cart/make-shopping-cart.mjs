// How you invented 02 "The shopping cart" (vertical, ~66 s). Jonny's picks in the thread "Make shopping cart invention video"
// (27 Nov 2026 21:48 Berlin "go"): M1 Mash's rule "Drop it... and it's MINE.", H1 the orange caught mid-air + "How do you beat
// him?", E1 your coin slips, Mash catches it and rolls off, L2 ~70 s planned. Panel sheet shopping-cart-panels-v1.png ("go" 22:18
// Berlin), every number DESIGN.md (creative director) + section 8 (two re-hooks). Spud = "you", never named. Jonny asleep from
// 23:55 Berlin: "do the next choices yourself" (the rough draft goes on to Sol without his story check).
//
// THE BRIEF
//   Joke:        every way you carry your shopping, Mash ends up with it; your one perfect lock gets beaten by Mash's own rule.
//   Wants:       you want to get your shopping home without Mash stealing it.
//   Consequence: buried under tins, a basket on your foot, launched downhill into a hay cart, flipped into the basket, the cart stolen.
//   Ending:      the coin lock works; your coin slips, Mash catches it: "Drop it... and it's MINE." He rolls off. Hard cut.
//   Callback:    the catch of frame 0 (the orange) comes back as the last catch (the coin); Mash's stolen pile on the bench grows.
//
//   node storyboards/series/how-you-invented/02-shopping-cart/make-shopping-cart.mjs   -> shopping-cart.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { NARRATOR, LINES } from "./lines.mjs";
import { readFileSync } from "node:fs";

const LEN = JSON.parse(readFileSync(new URL("./lines.json", import.meta.url), "utf8"));
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const P = (t, id, set, dur = 0, ease = "linear") => c.prop(r3(t), id, set, r3(dur), ease);
const expr = (t, who, e, set, dur = 0.2) => A(r3(t), who, "expr", { ...(e && { expr: e }), ...(set && { set }), dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const face = (t, who, set, dur = 0.01) => A(r3(t), who, "face", { ...set, dur });
const turn = (t, who, to, dur = 0.01) => A(r3(t), who, "turn", { to, dur, ease: "linear" });
const place = (t, who, [x, z], yaw, y) => { A(r3(t), who, "move", { to: [x, z], ...(y != null && { y }), dur: 0.01, ease: "linear", sync: true }); turn(t, who, yaw); };
const arms = (t, who, pose, dur = 0, ease) => { for (const s of ["R", "L"]) c.arm(r3(t), who, s, pose, dur, ease); };
const grip = (t, who, side, shape, dur = 0.1) => A(r3(t), who, "grip", { side, shape, dur });
const END = 66.1;

// ---------------------------------------------------------------- the cut list (DESIGN 0 and 5)
const push = (pos, look, fov, to, dur, ease = "inOut") => ({ pos, look, fov, to: { pos: to.pos ?? pos, look: to.look ?? look, fov: to.fov ?? fov }, dur, ease });
const SHOTS = [
  ["C01 the catch", 0.0, push([-3.35, 1.35, 5.60], [-3.50, 0.62, 1.20], 40, { pos: [-3.33, 1.25, 5.10] }, 2.4)],
  ["C02 the worst friend", 2.4, push([-3.05, 1.20, 4.60], [-3.15, 0.78, 1.30], 44, { pos: [-3.07, 1.15, 4.15] }, 5.0)],
  ["C03 the tower", 7.4, push([-3.10, 0.45, 5.60], [-3.15, 1.25, 2.20], 50, { pos: [-3.10, 0.42, 5.20] }, 3.6)],
  ["C04 the heap", 11.0, push([-3.20, 1.55, 6.30], [-3.45, 1.00, 2.70], 44, { pos: [-3.25, 1.45, 5.80] }, 4.2)],
  ["C05 the basket", 15.2, push([-3.25, 1.05, 5.70], [-3.40, 0.60, 2.70], 42, { fov: 38 }, 4.1)],
  ["C06 the foot", 19.3, push([-2.75, 1.45, 6.60], [-2.95, 0.55, 2.30], 48, { pos: [-2.80, 1.35, 6.10] }, 4.7)],
  ["C07a the wheels (insert)", 24.0, push([-2.20, 0.40, 4.70], [-3.02, 0.24, 2.45], 34, { fov: 31 }, 1.6)],
  ["C07b the push", 25.6, push([-0.45, 1.45, 5.80], [-2.10, 0.85, 2.30], 44, { look: [-1.85, 0.85, 2.40] }, 3.4)],
  ["C08a the hill", 29.0, push([2.35, 3.60, 4.20], [1.85, -2.20, -9.00], 50, {}, 3.0)],
  ["C08b the reverse", 32.0, push([60.25, 2.82, -11.12], [60.00, 3.65, -13.64], 46, { pos: [60.25, 0.89, -3.36], look: [60.00, 1.72, -5.88] }, 1.2, "linear")],
  ["C09 the hay cart", 33.2, push([60.25, 1.30, 6.40], [60.05, 1.15, 1.10], 50, { pos: [60.22, 1.28, 5.90] }, 4.4)],
  ["C10a the brake (insert)", 37.6, push([2.60, 0.50, 5.95], [1.47, 0.16, 4.50], 36, { fov: 33 }, 1.9)],
  ["C10b the flip", 39.5, push([0.80, 1.35, 6.40], [1.25, 0.70, 3.60], 44, { pos: [0.85, 1.25, 3.40], look: [1.25, 0.75, 0.55] }, 1.4)],
  ["C11 the theft", 44.2, push([0.95, 1.60, 5.15], [-0.14, 0.97, -0.72], 56, { fov: 52 }, 6.6)],
  ["C12a the row", 50.8, push([2.05, 1.50, 6.60], [-2.20, 0.60, 1.20], 46, { pos: [1.95, 1.45, 6.20], look: [0.45, 0.40, 2.20] }, 1.6)],
  ["C12b the lock", 53.2, push([1.55, 1.05, 5.60], [0.62, 0.55, 3.50], 34, { fov: 31 }, 3.8)],
  ["C13 no coin", 57.0, push([2.30, 1.30, 1.20], [1.05, 0.72, 3.00], 42, { pos: [2.20, 1.28, 1.40] }, 4.4)],
  ["C14 the coin up", 61.4, push([-0.25, 0.88, 6.45], [-0.50, 0.88, 4.10], 34, { fov: 32 }, 2.7)],
  ["C15a the last catch", 64.1, push([0.05, 0.40, 6.55], [0.05, 0.70, 4.30], 40, { pos: [0.05, 0.40, 6.25] }, 1.0)],
  ["C15b his coin (insert)", 65.1, push([1.45, 0.95, 4.60], [0.78, 0.52, 2.90], 32, {}, 0.4)],
  ["C15c mine", 65.5, push([-0.75, 1.70, 7.30], [1.00, 0.60, -2.00], 50, {}, 0.6)],
];
const CUTS = SHOTS.map(([, t]) => t).filter((t) => t > 0);
const cutOf = (name) => SHOTS.find(([n]) => n.startsWith(name))[1];
const before = (name) => r3(cutOf(name) - 0.02);

// ---------------------------------------------------------------- lines (measured, x1.15) and captions (upper third, word by word)
const SUB = 330, LEAD = 0.12;
const START = [0.05, 2.60, 7.60, 12.60, 15.40, 20.80, 25.80, 29.60, 37.75, 41.40, 44.40, 47.40, 51.00, 59.45, 61.70, 64.35];
const CAPPOS = { "...You carry nothing.": 250 };   // C04: Mash's crown reaches y 485 (DESIGN 7)
LINES.forEach(([kind, who, line, tone, o = {}], i) => {
  const t = START[i], d = LEN[line]; if (!d) throw new Error(`no measured length for "${line}"`);
  if (kind === "narr") c.at(t, { macro: "narrate", line, voice: NARRATOR, ...(o.take && { take: o.take }), dur: d, caption: false, pos: SUB, gain: 4.0 });
  else c.macro(t, who, "say", { line, tone, ...o, dur: d, caption: false, gain: 7 });   // cast lines at narrator level (ep 1 lesson)
  const next = START[i + 1] ?? END;
  const end = Math.min(r3(t + d + 0.3), r3(next - LEAD - 0.02), r3(END - 0.01));
  const t0 = CUTS.find((k) => k > t - LEAD - 0.01 && k <= t) ?? Math.max(0, r3(t - LEAD));
  const parts = line.length > 40 && /[.?!] /.test(line) ? line.split(/(?<=[.?!]) /) : [line];
  const said = (txt, k0) => ({ said: line.split(/\s+/).slice(k0, k0 + txt.split(/\s+/).length).join(" ") });
  const pos = CAPPOS[line] ?? SUB;
  if (parts.length === 1) { cap(t0, end, line, pos, false, { ...said(line, 0), across: true }); return; }
  const words = line.split(/\s+/).length, k1 = parts[0].split(/\s+/).length, mid = r3(t0 + d * (k1 / words));
  cap(t0, mid, parts[0], pos, false, { ...said(parts[0], 0), across: true });
  cap(mid, end, parts.slice(1).join(" "), pos, false, { ...said(parts.slice(1).join(" "), k1), across: true });
});

// ---------------------------------------------------------------- the sets and the props (DESIGN 1, 2)
const FOOT = (x, y, z) => [r3(61.85 - x), r3(y + 5.32), r3(-23.35 - z)];   // a top point -> the same point on the foot instance
const ROW = (n) => [0.95, r3(0.75 + 0.62 * (n - 1))];
const TOWER0 = { id: "tower", kind: "foodtower", n: 14, sway: 0, fall: 0, hole: 0.10, ...grips.placeFor("foodtower", [-3.55, 0.16, 1.90], 15) };
const ORANGE = { id: "orange", kind: "snackfruit", fruit: "orange", bite: 0, x: -3.22, y: 0.34, z: 1.70, scale: 0 };
const APPLE = { id: "apple", kind: "snackfruit", fruit: "apple", bite: 0, x: -3.50, y: 0.70, z: 2.80, scale: 0 };
const COINS = { id: "coinS", kind: "coin", scale: 0, shine: 0, x: -0.25, y: 1.02, z: 4.30, staged: "in Spud's glove" };
const props = [
  { id: "top", kind: "hillstreet", x: 0, y: 0, z: 0 },
  { id: "foot", kind: "hillstreet", x: 61.85, y: 5.32, z: -23.35, rot: 180, scale: 0, staged: "the same street seen from its foot, only in C08b and C09" },
  { id: "front", kind: "grocerfront", x: -2.75, y: 0, z: 0.90 },
  { id: "stall", kind: "woodcounter", x: 0.05, y: 0, z: 1.70, rot: 40 },
  { id: "hayT", kind: "haycart", x: 2.65, y: -5.32, z: -24.35, staged: "far below at the foot of the hill (C08a)" },
  { id: "hayF", kind: "haycart", x: 59.20, y: 0, z: 1.00, scale: 0, dent: 0, burst: -1, rock: 0 },
  { id: "pile", kind: "foodpile", x: -2.35, y: 0.30, z: 1.16, grow: 0, staged: "on the bench's left half" },
  { id: "orangeC", kind: "catchdrop", item: "orange", from: [-3.70, 0.72, 1.95], to: [-3.22, 0.38, 1.70], hop: 0.06, drop: 0, x: 0, y: 0, z: 0 },
  { id: "coinC", kind: "catchdrop", item: "coin", from: [-0.25, 1.12, 4.30], to: [-0.18, 0.14, 4.35], drop: 0, x: 0, y: 0, z: 0, scale: 0 },
  TOWER0, ORANGE, APPLE, COINS,
  { id: "bask", kind: "wickerbasket", x: -3.09, y: 0, z: 2.91, rot: 0, fill: 1, snap: 0, spill: 0, spillTo: [-2.95, 2.55], scale: 0 },
  { id: "bask2", kind: "wickerbasket", stub: 1, fill: 1, x: -2.75, y: 0.34, z: 2.50, rot: 70, scale: 0, staged: "set onto the chair's seat (C07a)" },
  { id: "cart", kind: "chaircart", brake: true, stepZ: -0.52, basket: 0, fill: 1, x: -2.75, y: 0, z: 2.25, rot: 70, scale: 0 },
  { id: "cartF", kind: "chaircart", stepZ: -0.52, basket: 1, fill: 0.2, x: 58.6, y: 0.24, z: 2.2, rot: 30, tilt: 90, scale: 0, staged: "on its side against the hay cart's wheel" },
  { id: "rain", kind: "foodrain", mode: "up", ride: ["cart", "seat"], fly: 0, scale: 0 },
  { id: "rainD", kind: "foodrain", mode: "down", to: [60.464, 0.41, 1.279], rain: 0, x: 0, y: 0, z: 0, scale: 0 },
  { id: "sack", kind: "hoodsack", wear: "mash", fill: 0, x: 0, y: 0, z: 0, scale: 0 },
  ...[1, 2, 3, 4, 5].map((n) => ({ id: `r${n}`, kind: "chaircart", lock: true, brake: true, stepZ: -0.52, fill: 0, x: ROW(n)[0], y: 0, z: ROW(n)[1], rot: 180, scale: 0 })),
  ...[1, 2, 3, 4, 5].map((n) => ({ id: `ch${n}`, kind: "lockchain", chair: n, sag: 0.03, ring: n === 1, pop: 0, taut: 0, x: 0, y: 0, z: 0, scale: 0, staged: "hangs between two chairs (no ground support)" })),
  { id: "cart6", kind: "chaircart", lock: true, stepZ: -0.52, fill: 0, x: 2.30, y: 0, z: 0.40, rot: 180, scale: 0, staged: "Mash's cart (chair 4) on the hill" },
  { id: "coinM", kind: "coin", scale: 0, shine: 0, x: 0.78, y: 0.62, z: 2.86, staged: "the coin going into chair 4's slot" },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-3.90, 1.45], face: 15, expr: "shocked", follow: 0, seed: 2.9 },
  { id: "mash", character: "potatobrawl/mash", at: [-2.95, 1.37], face: -35, expr: "smug", follow: 0, seed: 1.1 },
  { id: "boss", character: "always-orders-potatoes/viking", at: [-0.53, 1.40], face: 40, expr: "kind", follow: 0, seed: 4.1 },
];
// seed every key the engine does not hold, once at frame 0
for (const [id, set] of [["cart", { spin: 0, brake: 0, jolt: 0 }], ["cartF", { spin: 0 }], ["hayF", { dent: 0, burst: -1, rock: 0 }],
  ["tower", { sway: 0, fall: 0 }], ["bask", { snap: 0, spill: 0 }], ["orangeC", { drop: 0 }], ["coinC", { drop: 0 }], ["pile", { grow: 0 }],
  ...[1, 2, 3, 4, 5].map((n) => [`r${n}`, { brake: 0, spin: 0 }]), ...[1, 2, 3, 4, 5].map((n) => [`ch${n}`, { pop: 0, taut: 0 }]),
  ["rain", { fly: 0 }], ["rainD", { rain: 0 }], ["sack", { fill: 0 }], ["cart6", { spin: 0 }]]) P(0, id, set);
A(0, "boss", "hide", {}); A(0, "mash", "noblink", { dur: 0 });
const pileTo = (t, g) => P(t, "pile", { grow: g }, 0.13, "linear");

// a chair cart rolling: position keys (every 0.2 s) and wheel spin with the distance (0.377 m a turn)
const roll = (id, t0, t1, at, { every = 0.2, rot } = {}) => {
  let prev = at(t0), turns = 0;
  P(t0, id, { x: prev[0], y: prev[1], z: prev[2] });
  for (let t = t0 + every; t < t1 + 1e-6; t = r3(t + every)) {
    const p = at(Math.min(t, t1)), d = Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
    turns += d / 0.377; prev = p;
    P(r3(t - every), id, { x: p[0], y: p[1], z: p[2], spin: r3(turns), ...(rot != null && { rot }) }, every, "linear");
  }
};
const slopeY = (z) => (z < 0 ? r3(0.2493 * z) : 0);
const C14 = Math.cos((14 * Math.PI) / 180);

// ================================================================ C01 0-2.4: the catch. Mash: "Drop it... and it's MINE."
const AHEAD = (x, z, yaw, d) => [r3(x + d * Math.sin((yaw * Math.PI) / 180)), r3(z + d * Math.cos((yaw * Math.PI) / 180))];
const armfulAt = (x, z, yaw) => { const [ax, az] = AHEAD(x, z, yaw, 0.42); return [ax, 0.16, az]; };
const ht = grips.box(c, "spud", { ...TOWER0, ...grips.placeFor("foodtower", armfulAt(-3.90, 1.45, 15), 15) }, { gap: 0.04 });
P(0, "tower", grips.placeFor("foodtower", armfulAt(-3.90, 1.45, 15), 15));
let th = ht.take(0, { reach: 0.005, settle: 0.005 });
A(0.02, "spud", "move", { to: [-3.85, 1.55], dur: 0.48, ease: "out" });
ht.carry(0.02, armfulAt(-3.85, 1.55, 15), 0.48, "out");
for (const [t, a] of [[0.5, 5], [0.75, -5], [1.0, 5], [1.25, -5], [1.5, 0]]) A(t, "spud", "lean", { to: a, dur: 0.25, ease: "inOut" });
expr(0.45, "spud", "shocked", { open: 0.1 }, 0.1); look(0.45, "spud", [0.5, 0.1], 0.1);
A(0, "mash", "crouch", { to: 0.15, dur: 0 }); A(0, "mash", "lean", { to: 15, dur: 0 });
c.arm(0, "mash", "R", { prop: "orangeC", grip: [-3.22, 0.38, 1.70] }, 0.01); grip(0, "mash", "R", "cup", 0.01);
P(0, "orangeC", { drop: 0.40 }, 0.40, "linear"); grip(0.36, "mash", "R", "hold", 0.06);
sfx(0.40, "ai/fingertip-catch", { gain: 0.8, reason: "Mash's glove snaps shut on the orange" });
expr(0.4, "mash", "smug", { lid: 0.42 }, 0.15);
A(0.6, "mash", "crouch", { to: 0, dur: 0.4 }); A(0.6, "mash", "lean", { to: 0, dur: 0.4 }); c.arm(0.6, "mash", "R", { o: [0.25, 0.40, 0.25] }, 0.4, "out");
P(0.6, "orangeC", { scale: 0 }); P(0.6, "orange", { scale: 1 });   // the catch prop becomes the held fruit (same spot, same frame)
const hf = grips.mug(c, "mash", ORANGE, { side: "R" });
hf.take(0.6, { reach: 0.005, settle: 0.005 });
for (const k of [1.55, 1.95, 2.3]) sfx(k, "step", { gain: 0.35, reason: "your stagger under the armful" });
see(0.1, 2.3, ["mash.face", "spud.face", "orangeC"], "the catch: Drop it... and it's MINE");

// ================================================================ C02 2.4-7.4: "Mash is the WORST friend in the village. How do you beat him?"
place(before("C02"), "spud", [-3.62, 2.05], 40); ht.carry(before("C02"), armfulAt(-3.62, 2.05, 40), 0.01);
place(before("C02"), "mash", [-2.95, 1.37], -25);
expr(before("C02"), "spud", "annoyed", { brows: -0.4 }, 0.01); look(before("C02"), "spud", [0.6, 0.15], 0.01);
hf.carry(before("C02"), [-3.05, 0.50, 1.62], 0.01);
hf.carry(2.7, [-3.04, 0.62, 1.60], 0.3, "inOut");   // to his mouth
A(3.0, "mash", "squash", { amount: 0.03, dur: 0.15 });
P(3.0, "orange", { bite: 1 }, 0.1); sfx(3.0, "ai/pot-bite", { gain: 0.6, reason: "Mash bites the whole orange" });
for (let t = 3.2; t < 4.9; t = r3(t + 0.5)) { A(t, "mash", "squash", { amount: 0.03, dur: 0.25 }); A(r3(t + 0.25), "mash", "squash", { amount: 0, dur: 0.25 }); }
face(3.0, "mash", { lid: 0.5 }, 0.3);
hf.release(4.95, { rest: false, back: 0.01 }); P(5.0, "orange", { scale: 0 }); c.arm(5.0, "mash", "L", { o: [0.45, 0.35, 0.10] }, 0.2, "out"); c.arm(5.25, "mash", "L", "rest", 0.4);
pileTo(5.2, 1); expr(5.4, "spud", "angry", null, 0.2);
c.arm(5.0, "mash", "R", "rest", 0.4);
see(2.6, 7.3, ["mash.face", "spud.face", "pile"], "the worst friend: how do you beat him?");

// ================================================================ C03 7.4-11.0: "You carry more." the tower
place(before("C03"), "spud", [-3.55, 2.65], 10); ht.carry(before("C03"), armfulAt(-3.55, 2.65, 10), 0.01);
expr(before("C03"), "spud", "focused", null, 0.01);
P(7.5, "tower", { n: 64 }, 1.2, "linear"); A(7.5, "spud", "squash", { amount: -0.05, dur: 0.4 });
for (const [t, s] of [[8.6, 6], [9.2, -8], [9.8, 14], [10.4, 14]]) P(t, "tower", { sway: s }, 0.55, "inOut");
expr(10.5, "spud", "shocked", { open: 0.3 }, 0.1); look(10.5, "spud", [0.2, 0.9], 0.1);
look(7.6, "mash", [-0.2, 0.6], 1.0);
ht.release(10.68, { rest: false, back: 0.01, to: armfulAt(-3.55, 2.65, 10) });
P(10.70, "tower", { fall: 1.5 }, 1.5, "linear");
sfx(10.72, "hit-metal", { gain: 0.6, reason: "the first tins hit the cobbles" });
sfx(10.85, "hit-metal", { gain: 0.6, reason: "the tower comes down" });
sfx(9.6, "creak", { gain: 0.45, reason: "the tower of tins creaks as it sways" }); sfx(10.2, "creak", { gain: 0.5, reason: "it leans further" });
see(7.5, 10.9, ["spud.face", "tower"], "the stack grows taller than him and sways");

// ================================================================ C04 11.0-15.2: "...You carry nothing." the heap
P(before("C04"), "tower", { y: 0, x: -3.45, z: 2.70, rot: 0 });
A(before("C04"), "spud", "noblink", { dur: 0 }); place(before("C04"), "spud", [-3.40, 2.95], 0); A(before("C04"), "spud", "crouch", { to: 0.35, dur: 0.01 });
A(11.0, "spud", "droop", { to: 0.3, dur: 0.01 }); A(11.6, "spud", "droop", { to: 0, dur: 0.15, ease: "back" });
c.arm(before("C04"), "spud", "R", "rest", 0.01);
c.arm(11.9, "spud", "L", { o: [0.55, 0.45, 0.05] }, 0.15, "out"); grip(11.9, "spud", "L", "open");
for (const [t, k] of [[12.05, 0.55], [12.3, 0.48], [12.55, 0.55], [12.8, 0.48], [13.05, 0.55]]) c.arm(t, "spud", "L", { o: [k, 0.45, 0.05] }, 0.25, "inOut");
A(before("C04"), "mash", "ride", { prop: "tower", off: [-0.05, 0.50, -0.10], sit: true, yaw: 8, dur: 0.01 });
expr(before("C04"), "mash", "serene", null, 0.01); pileTo(before("C04"), 2);
P(before("C04"), "apple", { scale: 1 });
const ha = grips.mug(c, "mash", APPLE, { side: "R" });
ha.take(before("C04"), { reach: 0.005, settle: 0.005 });
ha.carry(12.0, [-3.42, 1.12, 2.92], 0.3, "inOut"); P(12.3, "apple", { bite: 1 }, 0.1); sfx(12.3, "ai/crunch", { gain: 0.5, reason: "Mash bites the apple on top of the heap" });
see(11.2, 15.1, ["mash.face", "tower"], "you carry nothing: Mash on top of your heap");

// ================================================================ C05 15.2-19.3: "A basket. Everything in one place." the snap
ha.release(before("C05"), { rest: false, back: 0.01 }); P(before("C05"), "apple", { scale: 0 }); P(before("C05"), "tower", { scale: 0 });
A(before("C05"), "mash", "ride", { prop: null }); place(before("C05"), "mash", [-2.75, 2.25], -30, 0); A(before("C05"), "mash", "hide", {});
A(before("C05"), "spud", "crouch", { to: 0, dur: 0.01 }); place(before("C05"), "spud", [-3.60, 2.55], 55);
expr(before("C05"), "spud", "eager", null, 0.01); c.arm(before("C05"), "spud", "L", "rest", 0.01);
P(before("C05"), "bask", { scale: 1 });
for (const [s, dx] of [["R", 0.03], ["L", -0.03]]) c.arm(15.6, "spud", s, { prop: "bask", grip: [dx, 0.42, 0] }, 0.4, "inOut");
grip(15.9, "spud", "R", "fist"); grip(15.9, "spud", "L", "fist");
P(16.6, "bask", { y: 0.12 }, 1.2, "inOut"); A(16.6, "spud", "lean", { to: -12, dur: 1.0 }); A(16.6, "spud", "squash", { amount: -0.06, dur: 0.6 });
face(16.8, "spud", { lid: 0.7, open: 0.2 }, 0.3);
for (let t = 17.8; t < 19.05; t = r3(t + 0.125)) A(t, "spud", "lean", { to: t * 8 % 2 < 1 ? -11 : -13, dur: 0.06 });
sfx(18.3, "creak", { gain: 0.5, reason: "the willow handle creaks under the load" });
P(19.10, "bask", { snap: 1 }, 1.0, "linear"); sfx(19.12, "ai/branch-snap", { gain: 0.8, reason: "the basket's handle snaps" });
P(19.18, "bask", { y: 0 }, 0.1, "in");
for (const s of ["R", "L"]) c.arm(19.18, "spud", s, { o: [0.30, 0.55, 0.20] }, 0.12, "out");
see(15.3, 19.2, ["spud.face", "bask"], "the heave and the snap");

// ================================================================ C06 19.3-24.0: "Including your foot." the hops
P(before("C06"), "bask", { x: -3.05, y: 0.20, z: 2.95, rot: 90, tip: 90, spill: 0 });
P(19.45, "bask", { spill: 2.0 }, 2.0, "linear");
place(before("C06"), "spud", [-3.60, 2.55], 20); A(before("C06"), "spud", "lean", { to: 0, dur: 0.01 }); A(before("C06"), "spud", "squash", { amount: 0.10, dur: 0.01 });
expr(before("C06"), "spud", "shocked", { open: 0.1 }, 0.01);
sfx(19.32, "thud", { gain: 1.0, reason: "the basket lands on his boot" });
A(19.4, "spud", "squash", { amount: 0.04, dur: 0.2 }); face(19.5, "spud", { lid: 0.75 }, 0.15);
arms(19.45, "spud", { o: [0.10, 0.30, 0.30] }, 0.2);
A(19.55, "spud", "hop", { count: 5, height: 0.12, dur: 2.0, quiet: true });
for (let k = 0; k < 5; k++) sfx(r3(19.95 + k * 0.4), "land", { gain: 0.35, reason: "a hop on one boot" });
A(before("C06"), "mash", "show", {}); arms(before("C06"), "mash", "rest", 0.01); place(before("C06"), "mash", [-2.75, 2.25], -30); expr(before("C06"), "mash", "delighted", null, 0.01);
A(20.4, "mash", "crouch", { to: 0.30, dur: 0.4 }); for (const s of ["R", "L"]) { c.arm(20.4, "mash", s, { prop: "top", grip: [s === "R" ? -3.02 : -2.86, 0.09, 2.58] }, 0.4); grip(20.6, "mash", s, "cup"); }
A(21.4, "mash", "crouch", { to: 0, dur: 0.4 }); arms(21.4, "mash", "rest", 0.4);
pileTo(23.2, 3); look(21.8, "spud", [0.6, 0], 0.2); expr(22.2, "spud", "annoyed", null, 0.2);
see(19.4, 23.9, ["spud.face", "mash.face", "bask"], "the foot and the scoop");

// ================================================================ C07a 24.0-25.6: the wheels (insert)
A(before("C07a"), "mash", "hide", {}); P(before("C07a"), "bask", { scale: 0 });
P(before("C07a"), "cart", { scale: 1, x: -2.75, y: 0, z: 2.50, rot: 70, basket: 0 }); P(before("C07a"), "bask2", { scale: 1, y: 0.34 });
P(24.4, "bask2", { y: 0.24 }, 0.17, "settle"); sfx(24.45, "put-down", { gain: 0.5, reason: "the basket settles on the chair's seat" });
P(24.9, "cart", { spin: 1.5 }, 0.7, "out"); sfx(24.9, "plank-rattle", { gain: 0.3, dur: 0.6, reason: "a wooden wheel spins" });
place(before("C07a"), "spud", [-3.24, 2.32], 70);

// ================================================================ C07b 25.6-29.0: "So you give it wheels." the push
P(before("C07b"), "bask2", { scale: 0 }); P(before("C07b"), "cart", { basket: 1, spin: 0 });
A(before("C07b"), "mash", "show", {}); place(before("C07b"), "mash", [-1.72, 1.19], 20);
A(before("C07b"), "mash", "ride", { prop: "front", off: [1.03, 0.30, 0.29], sit: true, yaw: 20, dur: 0.01 }); expr(before("C07b"), "mash", "annoyed", null, 0.01);
arms(before("C07b"), "spud", { o: [-0.21, 0.364, 0.32] }, 0.01); expr(before("C07b"), "spud", "smug", null, 0.01);
A(25.6, "spud", "move", { to: [-1.94, 2.79], dur: 2.8, ease: "linear" });
roll("cart", 25.6, 28.4, (t) => { const u = (t - 25.6) / 2.8; return [r3(-2.75 + 1.30 * u), 0, r3(2.50 + 0.47 * u)]; });
face(26.4, "spud", { lid: 1 }, 0.15); A(26.4, "spud", "lean", { to: -6, dur: 0.3 });
P(27.6, "cart", { jolt: 1 }, 0.3); look(25.6, "mash", [-0.5, 0], 2.8);
sfx(25.7, "plank-rattle", { gain: 0.35, dur: 2.7, reason: "wooden wheels rattle on the cobbles" });
see(25.7, 28.9, ["spud.face", "cart"], "so you give it wheels");

// ================================================================ C08a 29.0-32.0: "The village is on a hill." the drop
A(before("C08a"), "mash", "ride", { prop: null }); A(before("C08a"), "mash", "hide", {});
P(before("C08a"), "cart", { x: 1.85, y: 0, z: 0.45, rot: 180, tip: 0, spin: 0, jolt: 0 });
A(before("C08a"), "spud", "ride", { prop: "cart", off: [0, 0.10, -0.52], yaw: 0, dur: 0.01 });
arms(before("C08a"), "spud", { o: [-0.21, 0.364, 0.32] }, 0.01);
const sDown = (t) => { const u = t - 29.0; return 0.3 * u + 0.867 * u * u; };
const hillAt = (t) => { const s = sDown(t), z = s <= 0.45 ? r3(0.45 - s) : r3(-(s - 0.45) * C14); return [1.85, slopeY(z), z]; };
roll("cart", 29.0, 32.0, hillAt, { every: 0.15 });
P(29.1, "cart", { tip: 14 }, 0.2, "in");
A(29.25, "spud", "ride", { prop: "cart", off: [0, 0.42, -0.80], yaw: 0, dur: 0.2 }); A(29.25, "spud", "pitch", { to: 50, dur: 0.2 });
expr(29.25, "spud", "terrified", { open: 0.6 }, 0.1);
P(29.6, "rain", { scale: 1 }); P(29.6, "rain", { fly: 2.4 }, 2.4, "linear");
sfx(29.1, "plank-rattle", { gain: 0.6, dur: 2.9, reason: "the cart races down the cobbles" });
see(29.2, 31.9, ["cart", "top"], "the street falls away: the village is on a hill");

// ================================================================ C08b 32.0-33.2: the reverse, his face
P(before("C08b"), "foot", { scale: 1 }); P(before("C08b"), "hayF", { scale: 1 });
const fp = (d) => FOOT(1.85, 0.2493 * (-21.35 + d * C14), -21.35 + d * C14);
P(before("C08b"), "cart", { tip: 14, rot: 0, ...(([x, y, z]) => ({ x, y, z }))(fp(12)) });
roll("cart", 32.0, 33.18, (t) => fp(12 - 8 * (t - 32.0) / 1.18), { every: 0.12 });
A(before("C08b"), "spud", "pitch", { to: 50, dur: 0.01 });
P(before("C08b"), "rain", { fly: 0.6 }); P(32.0, "rain", { fly: 1.8 }, 1.2, "linear");
see(32.05, 33.15, ["spud.face"], "his scream on the way down");

// ================================================================ C09 33.2-37.6: the hay cart, the food rains into Mash's hood
A(before("C09"), "spud", "ride", { prop: null }); P(before("C09"), "rain", { scale: 0 });
P(before("C09"), "cart", { scale: 0 }); P(before("C09"), "cartF", { scale: 1 }); P(33.2, "cartF", { spin: 1.5 }, 1.3, "out");
place(before("C09"), "spud", [59.55, 1.00], 0, 0.35); A(before("C09"), "spud", "pitch", { to: 180, dur: 0.01 });
P(33.2, "hayF", { dent: 1 }, 0.05, "out"); P(33.2, "hayF", { burst: 1.3 }, 1.3, "linear"); P(33.2, "hayF", { rock: 1 }); P(33.3, "hayF", { rock: 0 }, 1.2, "out");
sfx(33.2, "cloth", { gain: 0.8, reason: "he lands head first in the hay" }); sfx(33.22, "thud", { gain: 1.0, reason: "the hay cart rocks" });
arms(before("C09"), "spud", "up", 0.01); for (let k = 0; k < 4; k++) A(r3(33.3 + k * 0.28), "spud", "lean", { to: k % 2 ? 6 : -6, dur: 0.14 });
A(34.5, "spud", "lean", { to: 0, dur: 0.3 });
A(before("C09"), "mash", "show", {}); place(before("C09"), "mash", [61.00, 1.45], -30); expr(before("C09"), "mash", "delighted", null, 0.01); look(before("C09"), "mash", [0, 0.8], 0.01);
P(before("C09"), "sack", { scale: 1 });
c.arm(before("C09"), "mash", "R", { x: [-0.55, 0.182, 0.284] }, 0.01); c.arm(before("C09"), "mash", "L", "hips", 0.01);
P(before("C09"), "rainD", { scale: 1 }); P(33.8, "rainD", { rain: 3.4 }, 3.4, "linear"); P(34.6, "sack", { fill: 1 }, 2.4, "linear");
for (let k = 0; k < 5; k++) { A(r3(34.6 + k * 0.5), "mash", "squash", { amount: 0.03, dur: 0.08 }); A(r3(34.7 + k * 0.5), "mash", "squash", { amount: 0, dur: 0.15 }); }
sfx(33.4, "plank-rattle", { gain: 0.35, dur: 1.2, reason: "the wheel of the toppled chair spins on" }); sfx(34.0, "cloth", { gain: 0.4, reason: "hay settles round him" });
sfx(34.6, "ai/fingertip-catch", { gain: 0.4, reason: "the first apple drops into Mash's hood" });
c.fx = [{ do: "shake", at: 33.2, dur: 0.2, amp: 0.03 }];
see(33.3, 37.5, ["mash.face", "sack", "hayF"], "you in the hay, your food in Mash's hood");

// ================================================================ C10a 37.6-39.5: "Wheels need a brake." (insert)
P(before("C10a"), "foot", { scale: 0 }); P(before("C10a"), "hayF", { scale: 0 }); P(before("C10a"), "cartF", { scale: 0 }); P(before("C10a"), "rainD", { scale: 0 });
P(before("C10a"), "sack", { scale: 0 }); A(before("C10a"), "mash", "hide", {}); place(before("C10a"), "mash", [-1.72, 1.19], 20);
pileTo(before("C10a"), 4);
P(before("C10a"), "cart", { scale: 1, x: 1.25, y: 0, z: 4.20, rot: 180, tip: 0, spin: 0, brake: 0, basket: 1, fill: 0.8 });
A(before("C10a"), "spud", "pitch", { to: 0, dur: 0.01 }); place(before("C10a"), "spud", [0.62, 4.80], 115, 0);
P(37.6, "cart", { spin: 1.9 }, 1.0, "linear"); P(38.6, "cart", { brake: 1 }, 0.1, "out"); P(38.6, "cart", { spin: 2.1 }, 0.1, "out");
c.arm(38.45, "spud", "R", { prop: "cart", grip: [0.24, 0.33, -0.50] }, 0.15, "in"); grip(38.45, "spud", "R", "flat");
c.arm(39.1, "spud", "R", "rest", 0.3);
sfx(38.62, "screech", { gain: 0.4, reason: "the brake block bites the wheel" });

// ================================================================ C10b 39.5-44.2: "It works... for about four seconds." the flip
P(before("C10b"), "cart", { brake: 0, spin: 0, z: 4.60 });
A(before("C10b"), "spud", "ride", { prop: "cart", off: [0, 0.10, -0.52], yaw: 0, dur: 0.01 });
arms(before("C10b"), "spud", { o: [-0.21, 0.364, 0.32] }, 0.01); A(before("C10b"), "spud", "lean", { to: -5, dur: 0.01 }); expr(before("C10b"), "spud", "smug", null, 0.01);
roll("cart", 39.5, 40.9, (t) => [1.25, 0, r3(4.60 - 2.9 * (t - 39.5))], { every: 0.2 });
P(40.9, "cart", { brake: 1 }, 0.067, "out"); P(40.95, "cart", { tip: -6 }, 0.12, "out"); P(41.07, "cart", { tip: 0 }, 0.2, "settle"); P(40.95, "cart", { jolt: 1 }, 0.3);
sfx(40.9, "screech", { gain: 0.7, reason: "he stamps on the brake: dead stop" });
A(40.93, "spud", "ride", { prop: "cart", off: [0, 0.95, -0.15], yaw: 0, dur: 0.16, ease: "linear" }); A(40.93, "spud", "pitch", { to: 90, dur: 0.16, ease: "linear" });
A(41.09, "spud", "ride", { prop: "cart", off: [0, 0.40, 0.03], yaw: 0, dur: 0.16, ease: "linear" }); A(41.09, "spud", "pitch", { to: 180, dur: 0.16, ease: "linear" });
arms(41.0, "spud", { o: [0.45, 0.55, 0.05] }, 0.15); sfx(41.25, "cloth", { gain: 0.6, reason: "he lands upside down in the basket" });
expr(41.3, "spud", "dizzy", null, 0.1); A(41.3, "spud", "squash", { amount: 0.06, dur: 0.1 }); A(41.45, "spud", "squash", { amount: 0, dur: 0.2 });
c.arm(42.3, "spud", "L", { o: [0.38, 0.80, 0.10] }, 0.25, "out"); grip(42.3, "spud", "L", "thumb");
see(40.8, 44.1, ["spud.face", "cart"], "the dead stop and the flip: it works");

// ================================================================ C11 44.2-50.8: "Mash doesn't steal snacks anymore." "He steals the whole cart."
A(before("C11"), "spud", "ride", { prop: null }); A(before("C11"), "spud", "pitch", { to: 0, dur: 0.01 }); place(before("C11"), "spud", [0.50, 2.27], -140, 0);
arms(before("C11"), "spud", "rest", 0.01); expr(before("C11"), "spud", "happy", null, 0.01);
c.arm(45.0, "spud", "R", { o: [0.15, 0.55, 0.45] }, 0.3, "out"); c.arm(46.6, "spud", "R", "rest", 0.3);
A(before("C11"), "boss", "show", {}); expr(before("C11"), "boss", "kind", null, 0.01);
c.arm(45.1, "boss", "R", { o: [0.20, 0.45, 0.40] }, 0.3, "out"); expr(47.6, "boss", "shocked", null, 0.15); c.arm(47.6, "boss", "L", "point", 0.25, "out");
P(before("C11"), "cart", { x: 1.20, y: 0, z: 1.45, rot: 180, tip: 0, spin: 0, brake: 0, fill: 1 });
A(before("C11"), "mash", "show", {}); A(before("C11"), "mash", "ride", { prop: "cart", off: [0, 0.32, 0.02], sit: true, yaw: 180, dur: 0.01 });
expr(before("C11"), "mash", "happy", null, 0.01); c.arm(before("C11"), "mash", "L", "rest", 0.01);
const theftAt = (t) => { if (t < 45.2) return [1.20, 0, r3(1.45 - 1.45 * (t - 44.2))]; const s = 0.45 * (t - 45.2) ** 2, z = r3(-s * C14); return [1.20, slopeY(z), z]; };
roll("cart", 44.2, 50.78, theftAt, { every: 0.2 }); P(45.1, "cart", { tip: 14 }, 0.2, "in");
c.arm(45.4, "mash", "R", "wave", 0.3); sfx(44.3, "plank-rattle", { gain: 0.4, dur: 6.4, reason: "the cart rolls off with Mash in it" });
A(49.9, "spud", "turn", { to: 10, dur: 0.2, ease: "out" }); expr(49.9, "spud", "shocked", { open: 0.3 }, 0.12); arms(49.9, "spud", "rest", 0.2);
see(44.3, 50.7, ["boss.face", "mash.face", "spud"], "the theft behind your back");

// ================================================================ C12a 50.8-53.2 / C12b 53.2-57.0: "So you lock them up. Only a coin opens one."
A(before("C12a"), "boss", "hide", {}); A(before("C12a"), "mash", "ride", { prop: null }); A(before("C12a"), "mash", "hide", {}); P(before("C12a"), "cart", { scale: 0 });
pileTo(before("C12a"), 5);
for (let n = 1; n <= 5; n++) { P(before("C12a"), `r${n}`, { scale: 1 }); P(before("C12a"), `ch${n}`, { scale: 1 }); }
place(before("C12a"), "spud", [0.22, 3.50], 30); expr(before("C12a"), "spud", "eager", null, 0.01);
P(before("C12a"), "coinS", { scale: 0.6 });
const hc = grips.thin(c, "spud", COINS, { side: "R" });
const COIN_HAND = [0.45, 0.45, 3.86];
P(before("C12a"), "coinS", { x: COIN_HAND[0], y: COIN_HAND[1], z: COIN_HAND[2] }); hc.take(before("C12a"), { reach: 0.005, settle: 0.005 });
c.arm(52.2, "spud", "L", { prop: "r5", grip: [-0.17, 0.56, -0.20] }, 0.25, "out"); c.arm(52.7, "spud", "L", "rest", 0.3);
hc.carry(54.6, [0.78, 0.58, 3.48], 0.5, "inOut"); hc.carry(55.2, [0.78, 0.52, 3.48], 0.4, "in");
sfx(55.6, "put-down-metal", { gain: 0.8, reason: "the coin slides into the lock" });
P(55.75, `ch5`, { pop: 2.0 }, 2.0, "linear"); sfx(55.75, "latch-click", { gain: 1.0, reason: "the lock lets the chain go" });
hc.carry(56.2, [0.60, 0.40, 3.80], 0.3, "out"); expr(56.3, "spud", "happy", { curve: 0.6 }, 0.15);
see(51.0, 56.9, ["ch5", "spud.face"], "the coin opens the lock");

// ================================================================ C13 57.0-61.4: "And Mash NEVER has a coin." tugs and the empty pocket
hc.release(56.95, { rest: false, back: 0.01, to: [0.60, 0.40, 3.80] }); P(before("C13"), "coinS", { scale: 0 });
P(before("C13"), "r5", { x: -1.25, z: 4.20 }); P(before("C13"), "ch5", { scale: 0 });
place(before("C13"), "spud", [-0.60, 4.10], 150); arms(56.985, "spud", "hips", 0.01); expr(before("C13"), "spud", "smug", null, 0.01);
A(before("C13"), "mash", "show", {}); place(before("C13"), "mash", [0.95, 3.28], 180); expr(before("C13"), "mash", "angry", null, 0.01);
c.arm(before("C13"), "mash", "R", { prop: "r4", grip: [-0.17, 0.56, -0.20] }, 0.01); c.arm(before("C13"), "mash", "L", { prop: "r4", grip: [0.17, 0.56, -0.20] }, 0.01);
for (let k = 0; k < 3; k++) {
  const t = r3(57.2 + k * 0.55);
  A(t, "mash", "lean", { to: -14, dur: 0.17, ease: "out" }); A(r3(t + 0.17), "mash", "lean", { to: 0, dur: 0.23, ease: "inOut" });
  P(t, "ch4", { taut: 1 }, 0.1, "out"); P(r3(t + 0.17), "ch4", { taut: 0 }, 0.23); P(t, "r4", { z: 2.64 }, 0.1); P(r3(t + 0.17), "r4", { z: 2.61 }, 0.2);
  sfx(r3(t + 0.08), "kenney/metal-latch", { gain: 0.4, reason: "the chain snaps straight" });
}
face(57.2, "mash", { lid: 0.75 }, 0.1);
arms(59.0, "mash", "rest", 0.3); expr(59.0, "mash", "annoyed", null, 0.2);
for (let k = 0; k < 3; k++) { c.arm(r3(59.4 + k * 0.3), "mash", "L", { o: [0.30, 0.30, 0.20] }, 0.12); c.arm(r3(59.52 + k * 0.3), "mash", "L", { o: [0.32, 0.36, 0.22] }, 0.12); }
look(60.4, "mash", [0, -0.6], 0.2); expr(60.6, "mash", "deadpan", null, 0.2);
see(57.1, 61.3, ["mash.face", "ch4"], "Mash can't get a cart: he never has a coin");

// ================================================================ C14 61.4-64.1: "You've invented the shopping cart." the coin slips
A(before("C14"), "mash", "hide", {}); arms(before("C14"), "mash", "rest", 0.01);
place(before("C14"), "spud", [-0.60, 4.10], 0); expr(before("C14"), "spud", "delighted", null, 0.01); A(before("C14"), "spud", "noblink", { dur: 0 });
c.arm(before("C14"), "spud", "R", "hips", 0.01);
P(before("C14"), "coinS", { scale: 0.6 });
const hc2 = grips.thin(c, "spud", { ...COINS, scale: 0.6 }, { side: "L" });
P(before("C14"), "coinS", { x: -0.25, y: 1.02, z: 4.30 }); hc2.take(before("C14"), { reach: 0.005, settle: 0.005 });
hc2.release(63.78, { rest: false, back: 0.01 }); P(63.80, "coinS", { scale: 0 }); P(63.80, "coinC", { scale: 1 });
P(63.80, "coinC", { drop: 0.30 }, 0.30, "linear"); grip(63.8, "spud", "L", "open"); face(63.8, "spud", { eye: 1.2 }, 0.1); look(63.8, "spud", [0.2, -0.8], 0.3);
see(61.5, 64.0, ["spud.face", "coinS"], "the proud coin, then it slips");

// ================================================================ C15a 64.1-65.1 / C15b 65.1-65.5 / C15c 65.5-66.1: Mash: "Drop it... and it's MINE."
A(before("C15a"), "mash", "show", {}); place(before("C15a"), "mash", [0.38, 4.20], -35);
A(before("C15a"), "mash", "crouch", { to: 0.35, dur: 0.01 }); A(before("C15a"), "mash", "lean", { to: 20, dur: 0.01 }); expr(before("C15a"), "mash", "smug", { lid: 0.42 }, 0.01);
c.arm(before("C15a"), "mash", "L", { prop: "coinC", grip: [-0.18, 0.14, 4.35] }, 0.01); grip(before("C15a"), "mash", "L", "cup", 0.01);
P(64.1, "coinC", { drop: 0.447 }, 0.147, "linear"); grip(64.21, "mash", "L", "hold", 0.05); sfx(64.25, "ai/fingertip-catch", { gain: 0.9, reason: "Mash catches your coin" });
// C15b: his coin goes into chair 4's slot, the chain pops
P(before("C15b"), "coinC", { scale: 0 }); arms(before("C15b"), "mash", "rest", 0.01); P(before("C15b"), "coinM", { scale: 0.6, x: 0.78, y: 0.62, z: 2.86 });
P(65.15, "coinM", { y: 0.52 }, 0.1, "in"); P(65.22, "ch4", { pop: 0.9 }, 0.9, "linear"); sfx(65.22, "latch-click", { gain: 0.8, reason: "Mash's coin opens the next cart" });
// C15c: Mash rolls away in chair 4, waving; your face drops
P(before("C15c"), "coinM", { scale: 0 }); P(before("C15c"), "r4", { scale: 0 }); P(before("C15c"), "cart6", { scale: 1, fill: 0 });
A(before("C15c"), "mash", "crouch", { to: 0, dur: 0.01 }); A(before("C15c"), "mash", "lean", { to: 0, dur: 0.01 });
A(before("C15c"), "mash", "ride", { prop: "cart6", off: [0, 0.32, 0.02], sit: true, yaw: 180, dur: 0.01 });
c.arm(before("C15c"), "mash", "R", "up", 0.01); c.arm(before("C15c"), "mash", "L", "wave", 0.01);
roll("cart6", 65.48, 66.1, (t) => { const s = 2 + 6.5 * (t - 65.48), z = r3(-s * C14); return [2.30, slopeY(z), z]; }, { every: 0.1 }); P(before("C15c"), "cart6", { tip: 14 });
place(before("C15c"), "spud", [-0.60, 4.10], -15); A(before("C15c"), "spud", "noblink", { dur: 0 }); expr(before("C15c"), "spud", "shocked", { open: 0.3 }, 0.01);
expr(65.6, "spud", "deadpan", { open: 0.3 }, 0.3); look(65.5, "spud", [0.9, 0], 0.01); arms(before("C15c"), "spud", "rest", 0.01);
see(64.15, 66.05, ["mash.face", "coinC"], "Drop it... and it's MINE: the flip");

// ---------------------------------------------------------------- beats and the storyboard
const beats = c.beats(SHOTS, END);
const SB = {
  id: "shopping-cart", title: "How you invented the shopping cart",
  idea: "How you invented X 02: Mash's rule 'Drop it... and it's MINE'. You try to get your shopping home: a tower of tins buries you, the basket handle snaps on your foot, the basket on a wheeled chair races down the hill into a hay cart, a brake flips you into the basket, Mash steals the whole cart, so you chain the carts with coin locks. Your coin slips, Mash catches it: 'Drop it... and it's MINE.'",
  format: "How you invented X (vertical, ~66 s)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic", captionLead: LEAD,
  captionBand: [210, 640],
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true,
  set: { type: "plain", color: "#9fd0ef", floor: "none", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade: [[0, { tint: "#fff1d6", s: 1.05 }]],
  music: { file: "ai/sneaky/sneaky-01.ogg", from: 0, gain: 0.45, lowCut: 120, until: 50.8, then: { file: "ai/hero-bed/hero-bed-01.ogg", from: 50.8, gain: 0.4 } },
  sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["mash", "spud", "orangeC"], hint: 0, what: "you stagger out of the shop with your arms full, an orange falls, Mash catches it mid-air: 'Drop it... and it's MINE.'" },
  fx: c.fx || [],
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "tower", from: 0, to: 11.0, checks: ["hand-in-prop", "arm-in-prop", "clipping", "shell"], reason: "the box hold: both gloves on the ends of the armful, the stack growing out of his arms" },
    { who: "spud", with: "tower", from: 11.0, to: 15.2, checks: ["clipping", "shell", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "he is buried under the heap: only his leaf and one waving glove stick out (DESIGN 3, C04)" },
    { who: "mash", with: "tower", from: 11.0, to: 15.2, checks: ["clipping", "shell", "costume-in-prop"], reason: "Mash sits sunk 0.12 into the top of the heap" },
    { who: "spud", with: "bask", from: 15.2, to: 19.5, checks: ["hand-in-prop", "arm-in-prop"], reason: "both fists round the basket's arch handle" },
    { who: "spud", with: "cart", from: 25.6, to: 44.2, checks: ["hand-in-prop", "arm-in-prop", "clipping", "shell"], reason: "gloves on the rail; he rides behind it, then flips into its basket" },
    { who: "mash", with: "cart", from: 44.2, to: 50.8, checks: ["clipping", "shell", "costume-in-prop"], reason: "Mash sits backwards in the cart's basket" },
    { who: "mash", with: "cart6", from: 65.5, to: END, checks: ["clipping", "shell", "costume-in-prop"], reason: "Mash sits backwards in the cart's basket" },
    { who: "spud", with: "hayF", from: 33.2, to: 37.6, checks: ["clipping", "shell", "costume-in-prop"], reason: "he lands head first in the hay: buried to the waist" },
    { who: "mash", with: "sack", from: 33.2, to: 37.6, checks: ["clipping", "shell", "costume-in-prop", "hand-in-prop"], reason: "his own hood held out as a sack (a worn prop)" },
    { who: "mash", with: "front", from: 25.6, to: 29.0, checks: ["clipping", "shell"], reason: "he sits on the bench, part of the shop front" },
    { who: "mash", with: "r4", from: 57.0, to: 61.4, checks: ["hand-in-prop", "arm-in-prop"], reason: "both gloves on chair 4's rail as he tugs" },
    { who: "spud", with: "r5", from: 50.8, to: 57.0, checks: ["hand-in-prop", "arm-in-prop"], reason: "his glove pats the rail, the coin goes into the lock" },
    { who: "spud", with: "apple", from: 11.0, to: 15.2, checks: ["clipping", "shell"], reason: "the apple Mash eats on the heap sits over the buried Spud" },
    { who: "mash", with: "spud", from: 11.0, to: 15.2, checks: ["character-overlap", "reach"], maxReach: 0.25, reason: "Mash sits on the heap right over the buried Spud (DESIGN 3, C04)" },
    { who: "spud", with: "hayF", from: 33.2, to: 37.6, checks: ["hand-in-prop", "arm-in-prop"], reason: "upside down in the hay: his arms are buried in it" },
    { who: "spud", with: "foot", from: 33.2, to: 37.6, checks: ["hand-in-prop", "arm-in-prop"], reason: "upside down in the hay cart: his hanging gloves brush the street under it" },
    { who: "spud", with: "tower", from: 7.4, to: 11.0, checks: ["face-hidden"], reason: "panel 03: the stack rises out of his arms in front of him from a low lens; his eyes come back as it sways" },
    { who: "mash", with: "orange", from: 0.6, to: 5.0, checks: ["hand-in-prop", "clipping"], reason: "he eats the orange whole (mug hold at his mouth)" },
    { who: "mash", with: "apple", from: 11.0, to: 15.2, checks: ["hand-in-prop", "clipping"], reason: "he bites the apple" },
  ],
  captionOverBody: { reason: "the tower in C03 and Mash's crown in C04 and C13 reach into the caption band: the line sits over a crown or the stack, never on an eye" },
  notes: "Generated by storyboards/series/how-you-invented/02-shopping-cart/make-shopping-cart.mjs.",
};
write(import.meta.url, SB);
