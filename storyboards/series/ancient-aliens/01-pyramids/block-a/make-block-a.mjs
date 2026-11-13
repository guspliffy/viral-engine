// ANCIENT ALIENS EP01 "Who really built the pyramids?", BLOCK A (story 0:00-0:56): hook, contract, clue 1 the mountain,
// the turn into the dark. Panels 01-12 of ancient-aliens-01-sheet-1.png. One of four blocks built at the same time
// (kit/BLOCKS.md); the join pass concatenates A-D on hard cuts and lays ONE orchestra bed, so music is false here.
// Story: /mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md. Built only from ../../kit/aa-kit.mjs.
//   node storyboards/series/ancient-aliens/01-pyramids/block-a/measure-lines.mjs   -> lines.json (spoken lengths, once)
//   node storyboards/series/ancient-aliens/01-pyramids/block-a/make-block-a.mjs    -> aa-01-block-a.json
//
// THE BRIEF
//   Stake + clock: "One block. Every two minutes." + "1 BLOCK = 2:00" in the first 2.5 s. Opener B (cold open, 2560 BC).
//   Chain: a block lands every two minutes (2560 BC) SO the site grows to 2.3 million blocks; SNAP to today: "they tell
//          you humans built this" SO Spud sets the contract (five clues, answered when three stars rise tonight); clue 1:
//          the blocks are heavier than a car SO he lays his palm on one, and the touch takes him back: the same block
//          comes down in the beam on the same spot, the timer hits 0:00 as it lands; the mountain they made stood tallest
//          for almost 4,000 years; BUT the heaviest stones are inside, SO the headlamp clicks on and he walks into the dark.
//
// PLACES (aa-kit.mjs: one origin per place, 1000 m apart). x east, z south, the camera mostly looks north.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { S, SET, SUN, CAST, VIEW, TOP, cam, far, gizaToday, giza2560, liftShip, site, host, hat, whiteCar, hostSay, lampClip } from "../../kit/aa-kit.mjs";
import { LINES, TONE } from "./lines.mjs";

const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);

// spoken lengths (measure-lines.mjs); a guess of 0.42 s a word until they are measured
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(l.split(/\s+/).length * 0.42)]));
const SUBY = 470;   // speech lettering in the upper third, under the number texts, never over a face (Jonny 12 Nov)
const TXT = 300, TXTS = { size: 92, kinetic: false };   // the number texts (read without English)
// hostSay (kit): the say MACRO in Reaper's voice (a plain c.say talk action is never voiced in a beat storyboard) + its subtitle
const say = (t, k) => { hostSay(c, r3(t), "spud", LINES[k], DUR[k], TONE, { pos: SUBY }); return r3(t + DUR[k]); };

const O = (i) => [i * 1000, 0];
const PL = { past: O(0), top: O(1), today: O(2), wide: O(3), foot: O(4), casing: O(5), up: O(6), high: O(7), door: O(8) };
const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, xz, yaw, y) => { A(r3(t - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const PARK = (k) => [-500 + k * 3, 0];
const park = (t, who, k) => place(t, who, PARK(k), 0, 0);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const PAVE = 0.12;   // a gizapavement's top

// ---------------------------------------------------------------- the beats (video s = story s)
const T = {
  p01: 0, land: 2.5, p02: 1.3, p03: 3.0, p04: 6.0, snap: 8.767, p06: 11.0, p07: 18.0, p08: 21.9, touch: 25.4, p09: 27.0,
  land2: 32.0, p10: 36.0, p11: 39.2, p12: 46.0, click: 50.6, END: 56.0,
};
const END = T.END;

// ---------------------------------------------------------------- the cast
const SP01 = at(PL.past, -29.35, 208.0);   // the hook spot (proof's camera), also panels 04 and 05 (same frame, two eras)
const cast = [
  { id: "spud", character: CAST.spud, at: SP01, face: 8, expr: "neutral", follow: 0.2, seed: 2.1 },
  { id: "crew", character: CAST.crew, at: at(PL.past, -27.6, 203.4), face: 170, expr: "kind", follow: 0.2, seed: 3.3 },
  { id: "fore", character: CAST.foreman, at: at(PL.past, -26.5, 201.0), face: 175, expr: "kind", follow: 0.2, seed: 4.1 },
  { id: "lift", character: CAST.lifter, at: at(PL.top, 1.95, 2.25), face: -90, y: 30, expr: "focused", follow: 0.2, seed: 5.2 },
  { id: "crew2", character: CAST.crew, at: at(PL.top, -0.5, 2.25), face: 90, y: 30, expr: "focused", follow: 0.2, seed: 6.4 },
  { id: "chip", character: CAST.chip, at: at(PL.today, -31.4, 204.6), face: 170, expr: "happy", follow: 0.2, seed: 7.7 },
  { id: "wedge", character: CAST.wedge, at: at(PL.today, -32.4, 203.6), face: 160, expr: "kind", follow: 0.2, seed: 8.2 },
  { id: "mash", character: CAST.mash, at: at(PL.today, -30.7, 203.0), face: 185, expr: "happy", follow: 0.2, seed: 9.9 },
];

// ---------------------------------------------------------------- props
const TOPY = 30;            // the real-scale working top (panel 02)
const BLK = at(PL.foot, -0.6, 3.4), BLK9 = at(PL.casing, -0.6, 3.4);   // the block he touches; the same spot in 2560 BC
const CAMEL5 = at(PL.today, -27.5, 207.3);
const view = (o, v) => [r3(o[0] + v.pos[0]), r3(o[1] + v.pos[2])];
const C10 = [PL.up[0], 53];  // panel 10's camera spot
const props = [
  // 01 03 04  2560 BC: the half-built pyramid, the ship lowering a block, workers and crew on the site
  ...far("f1", view(PL.past, VIEW.pastWide), { seed: 2 }), ...giza2560("g1", PL.past),
  ...liftShip("s1", PL.past, { top: TOP(), shipK: 2.5, block: { y: 14, k: 4 } }),
  { id: "workers1", kind: "potatocrowd", x: PL.past[0] - 16, z: 172, who: "workers", n: 40, box: [20, 12], seed: 5, lookAt: [0, 14, 0] },
  { id: "aliens1", kind: "potatocrowd", x: PL.past[0] - 38, z: 186, who: "aliens", n: 18, box: [10, 6], seed: 8, lookAt: [0, 14, 0] },
  { id: "rows1", kind: "blockrows", x: PL.past[0] - 21, z: 176, rows: 2, cols: 5, seed: 3 },
  // 02  the working top, real scale: a block comes down in the beam into its slot
  ...far("f2", [PL.top[0], 8], { seed: 4 }), { id: "top2", kind: "worktop", x: PL.top[0], y: TOPY, z: 0, gap: [0.7, 2.0] },
  ...liftShip("s2", at(PL.top, 0.7, 2.0), { top: TOPY, s: 1, beam: 0.5, block: { y: 5.5, k: 1 } }),
  // 05  today, the same frame: the weathered pyramids, tourists, a camel chewing beside him
  ...far("f5", view(PL.today, VIEW.pastWide), { tracks: true, seed: 3 }), ...gizaToday("g5", PL.today),
  { id: "tour5", kind: "potatocrowd", x: PL.today[0] - 18, z: 178, who: "tourists", n: 30, box: [18, 10], seed: 6, lookAt: [0, 14, 0] },
  { id: "camel5", kind: "camel", x: CAMEL5[0], z: CAMEL5[1], rot: -75, chew: 0.6 },
  hat("chip", "chip"), hat("wedge", "wedge", "#2a8f8a"), hat("mash", "mash"),
  // 06  the three pyramids of today, the noon sun, tourists and couched camels
  ...far("f6", view(PL.wide, VIEW.todayWide), { tracks: true, seed: 5, sun: [37, 16] }), ...gizaToday("g6", PL.wide),
  { id: "tour6", kind: "potatocrowd", x: PL.wide[0] - 128, z: 176, who: "tourists", n: 24, box: [14, 8], seed: 9, lookAt: [-56, 20, 56] },
  { id: "camel6a", kind: "camel", x: PL.wide[0] - 136.5, z: 192.5, rot: -60, lie: 1, grass: false },
  { id: "camel6b", kind: "camel", x: PL.wide[0] - 133.0, z: 189.0, rot: -40, lie: 1, grass: false },
  // 07 08  today at the foot: the bottom courses, one big block, the tourists' white car
  ...far("f7", [PL.foot[0], 12], { tracks: true, seed: 3 }), ...site("t7", PL.foot, { seed: 2 }),
  { id: "blk7", kind: "limeblock", x: BLK[0], y: PAVE, z: BLK[1], look: "weathered", size: [1.3, 1.5, 1.3], seed: 9 },
  { ...whiteCar("car7", PL.foot[0] + 2.55, 2.9, 78), y: PAVE },
  // 09  2560 BC at the foot: white casing; the same block comes down in the beam onto the same spot
  ...far("f9", [PL.casing[0], 12], { seed: 6 }), ...site("t9", PL.casing, { era: "past", core: 3, seed: 2 }),
  ...liftShip("s9", BLK9, { top: PAVE, s: 1, beam: 0.8, block: { y: 7.5, k: 1, look: "core" } }),
  // 10  looking up today's face from behind him
  ...far("f10", C10, { tracks: true, seed: 7 }), ...gizaToday("g10", PL.up, { haze: false }),
  // 11  the finished white pyramid from high above, the ship crossing
  ...far("f11", view(PL.high, VIEW.finishedHigh), { seed: 8 }), ...giza2560("g11", PL.high, { state: "finished" }),
  ...liftShip("s11", at(PL.high, -60, 10), { top: TOP(S, 1), hover: 16, beam: 0, lit: 0.4, block: null, shipK: 2.5 }),
  // 12  the robbers' tunnel from inside, the day outside the mouth
  ...far("f12", at(PL.door, 0, 12), { tracks: true, seed: 9 }),
  { id: "door12", kind: "pyramidentrance", x: PL.door[0], y: 0, z: 0 },
  host("spud"),
];
// things that hang in the air on purpose (preflight: prop-support)
for (const pr of props) if (/-(ship|block)$/.test(pr.id) || pr.id === "top2") pr.staged = pr.id === "top2" ? "the working top of the half-built pyramid, 30 m up (its courses are below the frame)" : pr.id.endsWith("ship") ? "the alien ring ship hovers over its work" : "a block carried in the ship's lift beam, then set down";
// the block in panel 09 has its own size: the same block as panel 08 (bottom-course height)
props.find((p) => p.id === "s9-block").size = [1.3, 1.5, 1.3];
// a narrow column beside the cast (BOARD: lift beam r 2.0; the default 3.5 swallows Spud and the whole frame)
for (const id of ["s2-ship", "s9-ship"]) props.find((p) => p.id === id).beamR = 1.1;

// seed every param that is tweened later
for (const id of ["s1-ship", "s11-ship"]) P(0, id, { wobble: 0 });
P(0, "s1-ship", { beam: 1 }); P(0, "s2-ship", { beam: 0.5, wobble: 0 }); P(0, "s9-ship", { beam: 0.8, wobble: 0 }); P(0, "s11-ship", { beam: 0 });
for (const id of ["s1-block", "s2-block", "s9-block", "blk7"]) P(0, id, { dust: 0 });
P(0, "spud-lamp", { lit: 0 });

// ================================================================= 01 HOOK (0-1.3): Spud in front, the ship lowers a block on the top
// Frame 0 (panel 01): Spud's face big, the half-built pyramid behind him, the ring ship over its top with a block in the
// beam, two aliens walking up to the site. The far block comes down the same 2.5 s as the real-scale one in 02.
expr(0, "spud", "neutral", { brow: 0.15 }, 0.01); look(0, "spud", [0, 0.15], 0.01);
P(0, "s1-block", { y: r3(TOP() + 14 * S) }); P(0.02, "s1-block", { y: TOP() }, r3(T.land - 0.02), "inOut");
A(0.1, "crew", "move", { to: at(PL.past, -26.9, 199.6), dur: 1.4, stride: 0.6 });
A(0.25, "fore", "move", { to: at(PL.past, -25.9, 197.4), dur: 1.3, stride: 0.7 });
const l1 = say(0.3, "l1");
cap(0, T.land, "1 BLOCK = 2:00", TXT, false, TXTS);
see(0, T.p02, ["spud.face", "s1-ship", "s1-block"], "frame 0: Spud, the half-built pyramid, the ship lowering a block");
// 02 the landing (1.3-3.0), real scale: the block settles into its slot, stone thud, dust rolls out; two aliens guide it
P(T.p02 - 0.02, "s2-block", { y: r3(TOPY + 2.2) }, r3(T.land - T.p02 + 0.02), "out");
c.arm(0, "lift", "R", { o: [0.22, 0.45, 0.22] }, 0.01); c.arm(0, "lift", "L", { o: [0.22, 0.45, 0.22] }, 0.01);
c.arm(0, "crew2", "R", { o: [0.3, 0.38, 0.14] }, 0.01); c.arm(0, "crew2", "L", { o: [0.3, 0.38, 0.14] }, 0.01);
for (const w of ["lift", "crew2"]) { A(0, w, "grip", { side: "R", shape: "open", dur: 0.01 }); A(0, w, "grip", { side: "L", shape: "open", dur: 0.01 }); look(0, w, [0, 0.45], 0.01); }
P(r3(T.land - 0.25), "s2-block", { y: TOPY }, 0.25, "in");
P(T.land, "s2-block", { dust: 1 }, 1.2, "out");
for (const w of ["lift", "crew2"]) { c.arm(r3(T.land + 0.1), w, "R", "rest", 0.35, "out"); c.arm(r3(T.land + 0.12), w, "L", "rest", 0.35, "out"); look(T.land + 0.1, w, [0, -0.2], 0.2); }
A(T.land, "lift", "squash", { amount: 0.06, dur: 0.3 }); A(T.land, "crew2", "squash", { amount: 0.06, dur: 0.3 });
sfx(T.land, "thud", { gain: 0.95, loud: true, reason: "the block lands in its slot: stone on stone" });
sfx(r3(T.land + 0.02), "kenney/impact-mining", { gain: 0.35, reason: "grit under the block" });
see(T.p02, T.p03, ["s2-block", "lift.face", "crew2.face"], "the block comes down in the beam and lands, dust rolls out");

// ================================================================= 03 THE SITE (3.0-6.0): wide from behind Spud, the counter runs
park(T.p03, "crew", 0); park(T.p03, "fore", 1); park(T.p03, "lift", 2); park(T.p03, "crew2", 3);
const SP03 = at(PL.past, -29.0, 205.8);
place(T.p03, "spud", SP03, yawTo(SP03, PL.past));
look(T.p03, "spud", [0, 0.35], 0.01);
const l2 = say(3.15, "l2");
// the counter: 0 -> 2,300,000 over 2.4 s, eased out, a step every 0.1 s
for (let i = 0; i <= 24; i++) {
  const t0 = r3(3.3 + i * 0.1), v = i === 24 ? 2300000 : Math.round((2300000 * (1 - Math.pow(1 - i / 24, 3))) / 1000) * 1000;
  cap(t0, i === 24 ? T.p04 : r3(t0 + 0.1), v.toLocaleString("en-US"), TXT, false, TXTS);
}
see(T.p03, T.p04, ["s1-ship", "workers1", "spud"], "the whole site: ship, pyramid, workers, Spud from behind");

// ================================================================= 04 HE POINTS (6.0-8.75), 05 SNAP TO TODAY (8.75-11.0), same frame
place(T.p04, "spud", SP01, 8);
look(T.p04, "spud", [0, 0.1], 0.01); expr(T.p04, "spud", "neutral", { brow: 0.3 }, 0.01);
c.arm(6.25, "spud", "R", { o: [0.3, 0.82, -0.05] }, 0.35, "out");   // thumb over his shoulder at the site behind him
A(6.25, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
const l3 = say(6.3, "l3");
// the snap: everything around him is today; he is in the same pose, still pointing
for (const [w, xz, f] of [["chip", at(PL.today, -31.4, 204.6), 170], ["wedge", at(PL.today, -32.4, 203.6), 160], ["mash", at(PL.today, -30.7, 203.0), 185]]) place(T.snap, w, xz, f);
place(T.snap, "spud", at(PL.today, -29.35, 208.0), 8);
A(T.snap, "chip", "look", { to: [0, 0.4], dur: 0.01 }); c.arm(r3(T.snap + 0.3), "chip", "R", "point", 0.4, "out");   // a tourist points up at the pyramid
look(r3(T.snap + 0.5), "spud", [0.5, 0.25], 0.18);                 // eyes to the camel
c.arm(r3(T.snap + 0.6), "spud", "R", "rest", 0.45, "inOut"); A(r3(T.snap + 0.6), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
look(r3(T.snap + 1.5), "spud", [0, 0.1], 0.2); expr(r3(T.snap + 1.5), "spud", "neutral", { brow: 0.4, lid: 0.25 }, 0.2);   // back to us, flat
see(T.snap, T.p06, ["spud.face", "camel5", "g5-giza"], "the same frame today: the weathered pyramid, tourists, a camel chewing beside him");

// ================================================================= 06 THE CONTRACT (11.0-18.0): the three pyramids at noon
const SP06 = at(PL.wide, -145.0, 203.2);
place(T.p06, "spud", SP06, yawTo(SP06, at(PL.wide, -56, 56)));
place(T.p06, "chip", at(PL.wide, -142.5, 199.9), 155); place(T.p06, "wedge", at(PL.wide, -147.6, 199.2), 205); place(T.p06, "mash", at(PL.wide, -141.2, 196.9), 165);
look(T.p06, "spud", [0, 0.3], 0.01);
c.arm(T.p06, "chip", "R", "rest", 0.01); A(T.p06, "chip", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
const l4 = say(11.3, "l4");
cap(11.3, 14.2, "5 CLUES", TXT, false, TXTS);
cap(14.2, r3(T.p07), "☆ ☆ ☆  TONIGHT", TXT, false, TXTS);
A(r3(l4 - 2.4), "spud", "turn", { to: 160, dur: 0.6, ease: "inOut" });   // on "you'll know who really built them" he half turns to us
look(r3(l4 - 2.2), "spud", [0.2, 0.1], 0.2);
see(T.p06, T.p07, ["g6-giza", "spud", "f6-sky"], "the three pyramids of today at noon, Spud among the tourists");

// ================================================================= 07 CLUE 1 (18.0-21.9): he walks past one block taller than him
park(T.p07, "chip", 4); park(T.p07, "wedge", 5); park(T.p07, "mash", 6);
const W0 = at(PL.foot, -3.0, 4.75), W1 = at(PL.foot, 0.42, 4.55);
place(T.p07, "spud", W0, 90, PAVE);
look(T.p07, "spud", [-0.3, 0.25], 0.01);
A(r3(T.p07 + 0.2), "spud", "move", { to: W1, dur: 2.6, stride: 0.75, ease: "inOut" });
look(r3(T.p07 + 1.2), "spud", [-0.6, 0.45], 0.25);   // up at the block as he passes it
cap(T.p07, END, "CLUE 1/5", 232, false, { size: 46, kinetic: false, x: 800 });
const l5a = say(18.4, "l5a");
cap(18.4, T.p08, "2,300,000", TXT, false, TXTS);
see(T.p07, T.p08, ["spud", "blk7"], "Spud walks past a block taller than he is");
// 08 (21.9-27.0) front: block, Spud, car side by side; "heavier than a car"; then his palm flat on the block
A(21.0, "spud", "turn", { to: 10, dur: 0.5, ease: "inOut" });
look(T.p08, "spud", [0, 0.1], 0.01);
const l5b = say(22.1, "l5b");
cap(22.1, T.p09, "1 BLOCK ≈ 2.5 t", TXT, false, TXTS);
look(r3(l5b - 0.9), "spud", [0.6, 0], 0.2);   // a glance at the car
look(r3(l5b + 0.2), "spud", [0, 0.1], 0.2);
A(T.touch, "spud", "turn", { to: -55, dur: 0.4, ease: "inOut" });
look(T.touch, "spud", [-0.5, 0.15], 0.2);
// palm flat on the block's east face (block-local: the face at x +0.65); the palm faces a point inside the stone
c.arm(r3(T.touch + 0.25), "spud", "R", { prop: "blk7", grip: [0.66, 0.85, 0.25], palm: [0.26, 0.85, 0.25] }, 0.45, "inOut");
A(r3(T.touch + 0.25), "spud", "grip", { side: "R", shape: "flat", dur: 0.3 });
expr(r3(T.touch + 0.8), "spud", "neutral", { lid: 0.35, brow: 0.2 }, 0.3);
sfx(r3(T.touch + 0.7), "cloth", { gain: 0.25, reason: "his glove on the stone" });
see(T.p08, T.p09, ["spud.face", "blk7", "car7"], "block, Spud and the car side by side; his palm flat on the stone");

// ================================================================= 09 THE TOUCH TAKES HIM BACK (27.0-36.0), same frame, 2560 BC
// The block he touched is not there yet: it comes down in the beam onto the same spot; the timer hits 0:00 as it lands.
place(T.p09, "spud", at(PL.casing, W1[0] - PL.foot[0], W1[1] - PL.foot[1]), -55, PAVE);
c.arm(T.p09, "spud", "R", { o: [0.05, 0.5, 0.28] }, 0.01);   // his palm in the air where the stone was
A(T.p09, "spud", "grip", { side: "R", shape: "flat", dur: 0.01 });
look(T.p09, "spud", [-0.5, 0.15], 0.01);
c.arm(r3(T.p09 + 0.5), "spud", "R", "rest", 0.5, "inOut"); A(r3(T.p09 + 0.5), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
A(r3(T.p09 + 0.5), "spud", "turn", { to: 10, dur: 0.5, ease: "inOut" });
look(r3(T.p09 + 0.7), "spud", [-0.25, 0.75], 0.3);   // up into the beam
P(T.p09, "s9-block", { y: r3(PAVE + 7.5) }); P(r3(T.p09 + 0.02), "s9-block", { y: r3(PAVE + 1.6) }, r3(T.land2 - T.p09 - 0.55), "inOut");
P(r3(T.land2 - 0.5), "s9-block", { y: PAVE }, 0.5, "in");
sfx(T.p09, "kenney/space-engine-low", { gain: 0.1, dur: r3(T.p10 - T.p09 - 0.3), reason: "the ship's low hum far over him" });
const l6 = say(27.4, "l6");
look(r3(l6 - 1.6), "spud", [0, 0.1], 0.25);   // "And every two minutes..." to us
for (let s = 4; s >= 0; s--) cap(r3(T.land2 - s), s === 0 ? r3(T.land2 + 0.6) : r3(T.land2 - s + 1), `0:0${s}`, TXT, false, TXTS);
P(T.land2, "s9-block", { dust: 1 }, 1.2, "out");
sfx(T.land2, "thud", { gain: 1, loud: true, reason: "the block lands beside him" });
sfx(r3(T.land2 + 0.02), "kenney/impact-mining", { gain: 0.4, reason: "grit under the block" });
A(T.land2, "spud", "squash", { amount: 0.04, dur: 0.25 });   // the ground shakes; he does not flinch
cap(r3(T.land2 + 0.6), r3(T.p10 - 0.4), "1 BLOCK = 2:00", TXT, false, TXTS);
expr(r3(T.land2 + 0.6), "spud", "neutral", { brow: 0.55, lid: 0.3 }, 0.2);   // deadpan, one brow up
see(T.p09, T.p10, ["spud.face", "s9-block"], "2560 BC: the same block comes down in the beam onto the same spot and lands");

// ================================================================= 10 THE MOUNTAIN (36.0-40.6): up the face from behind him
const SP10 = [PL.up[0], 50.4];
place(T.p10, "spud", SP10, 180);
look(T.p10, "spud", [0, 0.9], 0.01);
const l7a = say(36.3, "l7a");
cap(36.5, T.p11, "146 m", TXT, false, TXTS);
see(T.p10, T.p11, ["spud", "g10-giza"], "the stepped face rising over him to the top");
// 11 (40.6-46.0) the finished white pyramid from high above, the ship crossing it
const l7b = say(r3(T.p11 + 0.15), "l7b");
cap(r3(T.p11 + 0.15), T.p12, "3,800 YEARS", TXT, false, TXTS);
P(T.p11, "s11-ship", { x: r3(PL.high[0] - 60) }); P(r3(T.p11 + 0.02), "s11-ship", { x: r3(PL.high[0] + 20) }, r3(T.p12 - T.p11 - 0.05), "linear");
sfx(T.p11, "kenney/space-engine-low", { gain: 0.08, dur: r3(T.p12 - T.p11 - 0.2), reason: "the ship's hum, far" });
see(T.p11, T.p12, ["g11-pyr", "s11-ship"], "the finished white pyramid, the ship crossing over it");

// ================================================================= 12 THE TURN (46.0-56.0): the tunnel mouth, the lamp clicks on, into the dark
const SP12 = at(PL.door, 0, -0.55), IN12 = at(PL.door, 0, -4.4);
place(T.p12, "spud", SP12, 180);
look(T.p12, "spud", [0, 0.1], 0.01); expr(T.p12, "spud", "neutral", { brow: 0.3 }, 0.01);
const l8 = say(46.5, "l8");
look(r3(l8 + 0.2), "spud", [0, 0.05], 0.2);
P(T.click, "spud-lamp", { lit: 1 }, 0.06);
sfx(T.click, "latch-click", { gain: 0.6, reason: "the headlamp clicks on" });
look(r3(T.click + 0.4), "spud", [0, -0.05], 0.15); A(r3(T.click + 0.55), "spud", "move", { to: IN12, dur: 3.4, stride: 0.6, ease: "inOut" });
expr(r3(T.click + 0.3), "spud", "focused", { brow: 0.5 }, 0.2);
see(T.p12, END, ["spud.face", "door12"], "the tunnel mouth: the lamp clicks on and he walks in toward us, into the dark");

// wind far under every outdoor shot (Jonny 9 Nov: ~0.06)
for (const [a, b] of [[0, T.p02], [T.p03, T.p11], [T.p12, END]]) for (let t = a; t < b - 0.3; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain: 0.06, dur: r3(Math.min(6, b - t)), reason: "far desert wind under the scene" });

// ---------------------------------------------------------------- shots
const CAM = {
  p01: cam(PL.past, { pos: [-30, 0.9, 215], look: [0, 15.9, 0], fov: 24 }),
  p02: cam(PL.top, { pos: [0.7, TOPY + 1.5, 9.8], look: [0.7, TOPY + 1.1, 2.0], fov: 46 }),
  p03: cam(PL.past, { pos: [-30.6, 1.5, 214.5], look: [0, 12, 0], fov: 32 }),
  p10: { pos: [C10[0], 0.55, C10[1]], look: [PL.up[0], 18, 0], fov: 58 },
  p11: cam(PL.high, { pos: [-62, 82, 150], look: [8, 6, -12], fov: 34 }),
  p06: cam(PL.wide, { pos: [-150, 1.5, 211.5], look: [-56, 24, 56], fov: 34 }),
  p07: cam(PL.foot, { pos: [-2.6, 0.95, 9.4], look: [-0.4, 1.0, 4.0], fov: 46 }),
  p08: cam(PL.foot, { pos: [0.55, 1.0, 14.5], look: [0.55, 1.15, 3.4], fov: 40 }),
  p12: { pos: [PL.door[0], 1.0, -6.3], look: [PL.door[0], 0.85, 0], fov: 56 },
};
const same = (o, from, to, v) => ({ pos: [r3(v.pos[0] - from[0] + to[0]), v.pos[1], r3(v.pos[2] - from[1] + to[1])], look: [r3(v.look[0] - from[0] + to[0]), v.look[1], r3(v.look[2] - from[1] + to[1])], fov: v.fov });
const SHOTS = [
  ["01 hook", T.p01, CAM.p01, "hook"],
  ["02 the landing", T.p02, CAM.p02],
  ["03 the site", T.p03, CAM.p03],
  ["04 he points", T.p04, { ...CAM.p01, to: { pos: [r3(CAM.p01.pos[0] + 0.15), 0.9, r3(CAM.p01.pos[2] - 0.7)] }, dur: 2.6 }],
  ["05 today", T.snap, same(0, PL.past, PL.today, CAM.p01), "reveal"],
  ["06 the contract", T.p06, { ...CAM.p06, to: { pos: [CAM.p06.pos[0] + 0.6, 1.5, r3(CAM.p06.pos[2] - 1.2)] }, dur: 6.8 }],
  ["07 clue 1", T.p07, CAM.p07],
  ["08 heavier than a car", T.p08, CAM.p08],
  ["09 2560 BC", T.p09, same(0, PL.foot, PL.casing, CAM.p08), "reveal"],
  ["10 the mountain", T.p10, { ...CAM.p10, to: { pos: [C10[0], 0.55, r3(C10[1] + 1.2)] }, dur: 4.4 }],
  ["11 tallest", T.p11, CAM.p11],
  ["12 into the dark", T.p12, { ...CAM.p12, to: { pos: [PL.door[0], 1.0, -6.75] }, dur: 9.6 }],
];
const beats = c.beats(SHOTS, END);

write(import.meta.url, {
  id: "aa-01-block-a",
  title: "Who really built the pyramids? (block A)",
  idea: "Ancient aliens EP01 block A (0:00-0:56): a block lands every two minutes in 2560 BC; snap to today; Spud's contract (five clues, answered when three stars rise tonight); clue 1 the mountain: blocks heavier than a car, his touch takes him back as the same block lands; 146 m, tallest for almost 4,000 years; the headlamp clicks on and he walks into the dark",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [200, 1360],
  castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
  set: SET, music: false,
  sound: { scenes: ["scifi"], signature: false, sfx: 0.65, ambience: 0.06, surface: "concrete", room: "open", guard: true },
  hook: { show: ["spud", "s1-ship", "s1-block"], hint: 0, what: "2560 BC: Spud in front of the half-built Great Pyramid, a ring ship lowering a block onto its top" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "blk7", from: T.touch, to: T.p09, reason: "his palm flat on the block's face" },
    // the kit's far ground disc (gizaplateau) is scenery the cast stands on; worn kit props sit on their wearer
    ...["spud", "crew", "fore", "chip", "wedge", "mash"].flatMap((who) => ["f1-ground", "f5-ground", "f6-ground", "f2-ground", "f7-ground", "f9-ground", "f10-ground", "f12-ground"].map((g) => ({ who, with: g, from: 0, to: END, reason: "standing on the kit's far ground disc (gizaplateau, scenery)" }))),
    ...lampClip(["spud"], END),
    ...["chip", "wedge", "mash"].map((who) => ({ who, with: `${who}-hat`, from: 0, to: END, reason: "the straw hat he wears (kit hat())" })),
    { who: "spud", with: "door12", from: T.p12, to: END, reason: "standing and walking inside the tunnel (pyramidentrance is a closed shell around him)" },
  ],
  notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-a/make-block-a.mjs. Block A of four (kit/BLOCKS.md); music false, one bed at the join.",
});
