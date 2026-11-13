// ANCIENT ALIENS EP01 "Who really built the pyramids?", BLOCK A (story 0:00-0:56): hook, contract, clue 1 the mountain,
// the turn into the dark. Panels 01-12 of ancient-aliens-01-sheet-1.png. One of four blocks (kit/BLOCKS.md), joined later.
// Story: /mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md. Built only from ../../kit/aa-kit.mjs.
//   node storyboards/series/ancient-aliens/01-pyramids/block-a/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/01-pyramids/block-a/make-block-a.mjs    -> aa-01-block-a.json
//
// v2 (Jonny 13 Nov 18:19 Berlin on the animatic: "we need some background music ... we must explain this in a more
// interesting way, right now it's pretty plain and boring"; 18:24 "sounds good to me" on the v2 plan): the pilot's score
// from 0.0, and BLOCKS.md "How we explain": every number is shown happening, Spud does something in every shot, numbers
// move, something changes every 3 s, the doubt reads as a question and the clue reveals excited.
//
// THE BRIEF
//   Stake + clock: "One block. Every two minutes." + "1 BLOCK = 2:00" in the first 2.5 s. Opener B (cold open, 2560 BC).
//   Chain: a block lands every two minutes (2560 BC) SO the pyramid climbs, thud by thud, to 2.3 million blocks; SNAP to
//          today: "they tell you humans built this" SO Spud sets the contract (five clues, answered when three stars rise
//          tonight: we see them rise); clue 1: a block is heavier than a car (the beam lifts both: the car flies, the block
//          barely leaves the ground) SO he lays his palm on it, and the touch takes him back: the same block comes down on
//          the same spot as a timer hits 0:00, the foreman waves him off; the mountain they made, 146 m, stood tallest for
//          almost 4,000 years; BUT the heaviest stones are inside, SO the headlamp clicks on and he walks into the dark.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { S, SET, CAST, VIEW, TOP, cam, far, gizaToday, giza2560, liftShip, site, host, hostSay, clueTag, score, lampClip, hat, whiteCar, nightOver } from "../../kit/aa-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const fr = (t) => r3(Math.round(t * 30) / 30);   // cut times on whole frames (a place one frame early shows otherwise)

// spoken lengths (measure-lines.mjs); a guess of 0.42 s a word until they are measured
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(l.split(/\s+/).length * 0.42)]));
const SUBY = 470;   // speech lettering in the upper third, under the number texts, never over a face (Jonny 12 Nov)
const TXT = 300, TXTS = { size: 96, kinetic: false };   // the number texts (read without English)
// hostSay (kit): the say MACRO in Reaper's voice (a plain c.say talk action is never voiced in a beat storyboard) + its subtitle
const say = (t, k) => { hostSay(c, r3(t), "spud", LINES[k], DUR[k], toneOf(k), { pos: SUBY }); return r3(t + DUR[k]); };
// a number that counts: from a to b over [t0, t1] in steps of 0.1 s (eased out), then holds to `hold`
const count = (t0, t1, hold, a, b, fmt, o = {}) => {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1);
    cap(ts, i === n ? hold : r3(ts + 0.1), fmt(i === n ? b : v), o.pos ?? TXT, false, { ...TXTS, ...o });
  }
};
const big = (v) => Math.round(v / 1000) * 1000;

const O = (i) => [i * 1000, 0];
const PL = { past: O(0), top: O(1), today: O(2), wide: O(3), foot: O(4), casing: O(5), up: O(6), high: O(7), door: O(8), night: O(9) };
const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, xz, yaw, y) => { A(r3(t - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const PARK = (k) => [-500 + k * 3, 0];
const park = (t, who, k) => place(t, who, PARK(k), 0, 0);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const PAVE = 0.12;   // a gizapavement's top
const DOWN = -400;   // a miniature put away under the ground, beyond the camera's 300 m

// ---------------------------------------------------------------- the beats (video s = story s)
const T = { p01: 0, p02: 1.3, land: 2.5, p03: 3.0, tl2: 4.0, tl3: 5.0, p04: 6.0, p06: 11.0, night: 12.3, close6: 14.6, p07: 18.0, p08: 21.0, touch: 25.4, p09: 27.0, land2: 32.0, p10: 36.0, p11: 39.2, p12: 46.0, click: 50.6, END: 56.0 };
const END = T.END;

// ---------------------------------------------------------------- the cast
const SP01 = at(PL.past, -29.35, 208.0);   // the hook spot, also panels 04 and 05 (same frame, two eras)
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
const CAR = at(PL.foot, 2.55, 2.9);
const CAMEL5 = at(PL.today, -27.5, 207.3);
const view = (o, v) => [r3(o[0] + v.pos[0]), r3(o[1] + v.pos[2])];
const C10 = [PL.up[0], 53];  // panel 10's camera spot
const BUILT = [0.2, 0.35, 0.5];   // the time-lapse (03): the pyramid at each jump cut
const props = [
  // 01 03 04  2560 BC: the half-built pyramid (and two earlier stages for the time-lapse), the ship lowering a block
  ...far("f1", view(PL.past, VIEW.pastWide), { seed: 2 }), ...giza2560("g1", PL.past),
  ...giza2560("g1a", PL.past, { built: BUILT[0], valley: false }), ...giza2560("g1b", PL.past, { built: BUILT[1], valley: false }),
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
  // 06  the three pyramids of today, the noon sun, tourists and couched camels; the night flash-forward at its own place
  ...far("f6", view(PL.wide, VIEW.todayWide), { tracks: true, seed: 5, sun: [37, 16] }), ...gizaToday("g6", PL.wide),
  { id: "tour6", kind: "potatocrowd", x: PL.wide[0] - 128, z: 176, who: "tourists", n: 24, box: [14, 8], seed: 9, lookAt: [-56, 20, 56] },
  { id: "camel6a", kind: "camel", x: PL.wide[0] - 136.5, z: 192.5, rot: -60, lie: 1, grass: false },
  { id: "camel6b", kind: "camel", x: PL.wide[0] - 133.0, z: 189.0, rot: -40, lie: 1, grass: false },
  ...nightOver("n6", PL.night, { belt: false }),
  // 07 08  today at the foot: the bottom courses, one big block, the tourists' white car, two beams for the weighing
  ...far("f7", [PL.foot[0], 12], { tracks: true, seed: 3 }), ...site("t7", PL.foot, { seed: 2 }),
  { id: "blk7", kind: "limeblock", x: BLK[0], y: PAVE, z: BLK[1], look: "weathered", size: [1.3, 1.5, 1.3], seed: 9 },
  { ...whiteCar("car7", CAR[0], CAR[1], 78), y: PAVE },
  ...liftShip("s8c", CAR, { top: PAVE, s: 1, beam: 0, block: null }), ...liftShip("s8b", BLK, { top: PAVE, s: 1, beam: 0, block: null }),
  // 09  2560 BC at the foot: white casing; the same block comes down in the beam onto the same spot
  ...far("f9", [PL.casing[0], 12], { seed: 6 }), ...site("t9", PL.casing, { era: "past", core: 3, seed: 2 }),
  ...liftShip("s9", BLK9, { top: PAVE, s: 1, beam: 0.65, block: { y: 7.5, k: 1, look: "core" } }),
  // 10  up today's face from behind him
  ...far("f10", C10, { tracks: true, seed: 7 }), ...gizaToday("g10", PL.up, { haze: false }),
  // 11  the finished white pyramid from high above, the ship crossing
  ...far("f11", view(PL.high, VIEW.finishedHigh), { seed: 8 }), ...giza2560("g11", PL.high, { state: "finished" }),
  { id: "workers11", kind: "potatocrowd", x: PL.high[0] + 2, z: 8, who: "workers", n: 40, box: [6, 2], seed: 11, h: r3(0.85 * S), lookAt: [0, 10, -8] },
  ...liftShip("s11", at(PL.high, -60, 10), { top: TOP(S, 1), hover: 16, beam: 0, lit: 0.4, block: null, shipK: 2.5 }),
  // 12  the robbers' tunnel from inside, the day outside the mouth
  ...far("f12", at(PL.door, 0, 12), { tracks: true, seed: 9 }),
  { id: "door12", kind: "pyramidentrance", x: PL.door[0], y: 0, z: 0 },
  host("spud"),
];
const prop = (id) => props.find((p) => p.id === id);
// things that hang in the air on purpose (preflight: prop-support)
for (const pr of props) if (/-(ship|block)$/.test(pr.id) || pr.id === "top2") pr.staged = pr.id === "top2" ? "the working top of the half-built pyramid, 30 m up (its courses are below the frame)" : pr.id.endsWith("ship") ? "the alien ring ship hovers over its work" : "a block carried in the ship's lift beam, then set down";
prop("car7").staged = "lifted by the beam for the weighing (08), then dropped back on its wheels";
prop("blk7").staged = "lifted a hand's width by the beam for the weighing (08), then dropped";
prop("s9-block").size = [1.3, 1.5, 1.3];   // the same block as panel 08 (bottom-course height)
// narrow columns beside the cast (BOARD: lift beam r 2.0; the default 3.5 swallows Spud and the whole frame)
for (const [id, r] of [["s2-ship", 1.1], ["s9-ship", 1.1], ["s8c-ship", 1.5], ["s8b-ship", 1.0]]) prop(id).beamR = r;
for (const id of ["g1a-pyr", "g1b-pyr"]) prop(id).y = DOWN;

// seed every param that is tweened later
for (const id of ["s1-ship", "s2-ship", "s9-ship", "s11-ship", "s8c-ship", "s8b-ship"]) P(0, id, { wobble: 0 });
P(0, "s1-ship", { beam: 1 }); P(0, "s2-ship", { beam: 0.5 }); P(0, "s9-ship", { beam: 0.65 }); P(0, "s11-ship", { beam: 0 }); P(0, "s8c-ship", { beam: 0 }); P(0, "s8b-ship", { beam: 0 });
for (const id of ["s1-block", "s2-block", "s9-block", "blk7"]) P(0, id, { dust: 0 });
P(0, "spud-lamp", { lit: 0 }); P(0, "n6-stars", { show: 1 }); P(0, "n6-orion", { show: 0 });
P(0, "camel5", { headY: 0, headP: 0 }); P(0, "camel6a", { lie: 1 });

// ================================================================= 01 HOOK (0-1.3): Spud in front, the ship lowers a block on the top
// Frame 0 (panel 01): Spud's face big, the half-built pyramid behind him, the ring ship over its top with a block in the
// beam, two aliens walking up to the site. He holds up one finger on "One block".
expr(0, "spud", "neutral", { brow: 0.15 }, 0.01); look(0, "spud", [0, 0.15], 0.01);
P(0, "s1-block", { y: r3(TOP() + 14 * S) }); P(0.02, "s1-block", { y: TOP() }, r3(T.land - 0.02), "inOut");
A(0.1, "crew", "move", { to: at(PL.past, -26.9, 199.6), dur: 1.4, stride: 0.6 });
A(0.25, "fore", "move", { to: at(PL.past, -25.9, 197.4), dur: 1.3, stride: 0.7 });
c.arm(0.3, "spud", "R", { o: [0.12, 0.92, 0.18] }, 0.3, "out"); A(0.3, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
say(0.3, "l1");
cap(0, T.land, "1 BLOCK = 2:00", TXT, false, TXTS);
see(0, T.p02, ["spud.face", "s1-ship", "s1-block"], "frame 0: Spud, the half-built pyramid, the ship lowering a block");
// 02 the landing (1.3-3.0), real scale: the block settles into its slot, stone thud, dust rolls out; two aliens guide it
c.arm(1.5, "spud", "R", "rest", 0.4, "inOut"); A(1.5, "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });   // off screen
P(T.p02 - 0.02, "s2-block", { y: r3(TOPY + 2.2) }, r3(T.land - T.p02 + 0.02), "out");
c.arm(0, "lift", "R", { o: [0.22, 0.45, 0.22] }, 0.01); c.arm(0, "lift", "L", { o: [0.22, 0.45, 0.22] }, 0.01);
c.arm(0, "crew2", "R", { o: [0.3, 0.38, 0.14] }, 0.01); c.arm(0, "crew2", "L", { o: [0.3, 0.38, 0.14] }, 0.01);
for (const w of ["lift", "crew2"]) { A(0, w, "grip", { side: "R", shape: "open", dur: 0.01 }); A(0, w, "grip", { side: "L", shape: "open", dur: 0.01 }); look(0, w, [0, 0.45], 0.01); }
P(r3(T.land - 0.25), "s2-block", { y: TOPY }, 0.25, "in");
P(T.land, "s2-block", { dust: 1 }, 1.2, "out");
for (const w of ["lift", "crew2"]) { c.arm(r3(T.land + 0.1), w, "R", "rest", 0.35, "out"); c.arm(r3(T.land + 0.12), w, "L", "rest", 0.35, "out"); look(T.land + 0.1, w, [0, -0.2], 0.2); }
A(T.land, "lift", "squash", { amount: 0.06, dur: 0.3 }); A(T.land, "crew2", "squash", { amount: 0.06, dur: 0.3 });
sfx(T.land, "thud", { gain: 0.95, loud: true, reason: "the block lands in its slot: stone on stone" });
sfx(r3(T.land + 0.02), "kenney/impact-mining", { gain: 0.45, reason: "grit under the block (the crack a phone speaker can carry)" });
see(T.p02, T.p03, ["s2-block", "lift.face", "crew2.face"], "the block comes down in the beam and lands, dust rolls out");

// ================================================================= 03 THE TIME-LAPSE (3.0-6.0): three jump cuts, thud, thud, thud
// The pyramid stands higher at each cut (built 0.2, 0.35, 0.5), a block lands on its top each time, the counter races;
// Spud watches from the foreground: standing, then squatting, then hands on hips (time passes).
park(T.p03, "crew", 0); park(T.p03, "fore", 1); park(T.p03, "lift", 2); park(T.p03, "crew2", 3);
const SP03 = at(PL.past, -29.0, 205.8);
place(T.p03, "spud", SP03, yawTo(SP03, PL.past)); look(T.p03, "spud", [0, 0.45], 0.01);
const PYR = ["g1a-pyr", "g1b-pyr", "g1-pyr"];
[T.p03, T.tl2, T.tl3].forEach((t, i) => {
  PYR.forEach((id, j) => P(r3(t - 0.02), id, { y: j === i ? 0 : DOWN }));
  const top = TOP(S, BUILT[i]);
  P(r3(t - 0.02), "s1-ship", { y: r3(top + 40 * S) });
  P(r3(t - 0.02), "s1-block", { y: r3(top + 8 * S) }); P(t, "s1-block", { y: top }, 0.55, "in");
  sfx(r3(t + 0.55), "thud", { gain: 0.6, reason: "the far block lands on the growing pyramid" });
});
A(r3(T.tl2 - 0.02), "spud", "crouch", { to: 0.6, dur: 0.01 });
A(r3(T.tl3 - 0.02), "spud", "crouch", { to: 0, dur: 0.01 });
c.arm(r3(T.tl3 - 0.02), "spud", "R", "hips", 0.01); c.arm(r3(T.tl3 - 0.02), "spud", "L", "hips", 0.01);
say(3.15, "l2");
count(3.1, 3.9, T.tl2, 0, 600000, (v) => big(v).toLocaleString("en-US"));
count(T.tl2, 4.9, T.tl3, 600000, 1400000, (v) => big(v).toLocaleString("en-US"));
count(T.tl3, 5.6, T.p04, 1400000, 2300000, (v) => big(v).toLocaleString("en-US"));
see(T.p03, T.p04, ["s1-ship", "g1-pyr", "spud"], "the time-lapse: the pyramid climbs at each cut, a block lands each time");

// ================================================================= 04 HE POINTS (6.0-snap), 05 SNAP TO TODAY (snap-11.0), same frame
place(T.p04, "spud", SP01, 8);
c.arm(r3(T.p04 - 0.02), "spud", "R", "rest", 0.01); c.arm(r3(T.p04 - 0.02), "spud", "L", "rest", 0.01);
look(T.p04, "spud", [0, 0.1], 0.01); expr(T.p04, "spud", "neutral", { brow: 0.3 }, 0.01);
c.arm(6.25, "spud", "R", { o: [0.3, 0.82, -0.05] }, 0.35, "out");   // thumb over his shoulder at the site behind him
A(6.25, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
const l3 = say(6.3, "l3");
expr(r3(l3 - 0.6), "spud", "neutral", { brow: 0.7, lid: 0.3 }, 0.2);   // one brow up on "humans"
const SNAP = fr(Math.max(8.7, l3 + 0.15));   // a cut on a time r3 rounds UP past its frame (8.767 > 263/30) lands one frame late
for (const [w, xz, f] of [["chip", at(PL.today, -31.4, 204.6), 170], ["wedge", at(PL.today, -32.4, 203.6), 160], ["mash", at(PL.today, -30.7, 203.0), 185]]) place(SNAP, w, xz, f);
place(SNAP, "spud", at(PL.today, -29.35, 208.0), 8);
A(SNAP, "chip", "look", { to: [0, 0.4], dur: 0.01 }); c.arm(r3(SNAP + 0.3), "chip", "R", "point", 0.4, "out");   // a tourist points up
// the camel's head comes round and down to sniff the leaf on Spud's head; he leans away, eyes on it, then back to us
P(r3(SNAP + 0.5), "camel5", { headY: 0.55, headP: 0.45 }, 0.8, "inOut");
look(r3(SNAP + 0.9), "spud", [0.55, 0.3], 0.18);
c.arm(r3(SNAP + 0.6), "spud", "R", "rest", 0.45, "inOut"); A(r3(SNAP + 0.6), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
A(r3(SNAP + 1.0), "spud", "turn", { to: -6, dur: 0.35, ease: "inOut" }); expr(r3(SNAP + 1.0), "spud", "neutral", { lid: 0.4, brow: 0.2 }, 0.2);
P(r3(T.p06 - 0.9), "camel5", { headY: 0.1, headP: 0 }, 0.7, "inOut");
look(r3(T.p06 - 0.7), "spud", [0, 0.1], 0.2);
see(SNAP, T.p06, ["spud.face", "camel5", "g5-giza"], "the same frame today: weathered pyramid, tourists, the camel sniffing his leaf");

// ================================================================= 06 THE CONTRACT (11.0-18.0): five clues, the stars of tonight
const SP06 = at(PL.wide, -145.0, 203.2);
place(T.p06, "spud", SP06, yawTo(SP06, at(PL.wide, -56, 56)));
place(T.p06, "chip", at(PL.wide, -142.5, 199.9), 155); place(T.p06, "wedge", at(PL.wide, -147.6, 199.2), 205); place(T.p06, "mash", at(PL.wide, -141.2, 196.9), 165);
look(T.p06, "spud", [0, 0.3], 0.01);
c.arm(T.p06, "chip", "R", "rest", 0.01); A(T.p06, "chip", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
const l4 = say(11.3, "l4");
c.arm(11.35, "spud", "R", "up", 0.3, "out"); A(11.35, "spud", "grip", { side: "R", shape: "open", dur: 0.2 });   // five fingers up
cap(11.3, T.night, "5 CLUES", TXT, false, { ...TXTS, size: 110 });
c.arm(r3(T.night - 0.02), "spud", "R", "rest", 0.01); A(r3(T.night - 0.02), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
// the flash-forward: tonight, Orion's Belt rises over the three pyramids (no cast in the shot)
P(T.night, "n6-orion", { show: 1 }, 1.4, "out");
P(T.night, "n6-orion", { y: 66 }); P(r3(T.night + 0.02), "n6-orion", { y: 80 }, 2.2, "out");
cap(r3(T.night + 0.5), T.close6, "☆ ☆ ☆", TXT, false, { ...TXTS, size: 110 });
// back in the day: he has turned round to us, pyramids behind him; a camel gets up behind him on "who really built them"
const SPC = SP06, CAMC = [r3(SPC[0] - 1.86), r3(SPC[1] + 3.09)];
place(T.close6, "spud", SPC, yawTo(SPC, CAMC)); look(T.close6, "spud", [0, 0.05], 0.01);
expr(T.close6, "spud", "neutral", { brow: 0.3 }, 0.01);
expr(r3(l4 - 0.5), "spud", "neutral", { brow: 0.75, lid: 0.3 }, 0.2);
P(r3(l4 + 0.1), "camel6a", { lie: 0 }, 1.0, "inOut");
A(17.2, "spud", "noblink", { dur: 0.8 });   // no blink on the last frames before the cut (pops 17.97)
see(T.p06, T.night, ["g6-giza", "spud", "f6-sky"], "the three pyramids of today at noon, Spud's five fingers up");
see(T.night, T.close6, ["n6-orion", "n6-giza"], "tonight: Orion's Belt rises over the three pyramids");
see(T.close6, T.p07, ["spud.face", "g6-giza"], "Spud to us, the pyramids behind him");

// ================================================================= 07 CLUE 1 (18.0-21.0): start on the wall, crane down to him
park(T.p07, "chip", 4); park(T.p07, "wedge", 5); park(T.p07, "mash", 6);
const W0 = at(PL.foot, -2.7, 4.75), W1 = at(PL.foot, 0.42, 4.55);
place(T.p07, "spud", W0, 90, PAVE); look(T.p07, "spud", [-0.3, 0.25], 0.01);
A(r3(T.p07 + 0.6), "spud", "move", { to: W1, dur: 2.2, stride: 0.75, ease: "inOut" });
look(r3(T.p07 + 1.3), "spud", [-0.6, 0.5], 0.25);   // up at the block as he passes it
clueTag(c, T.p07, END, 1);
const l5a = say(18.6, "l5a");
count(19.0, 20.2, T.p08, 0, 2300000, (v) => big(v).toLocaleString("en-US"));
see(r3(T.p07 + 1.5), T.p08, ["spud", "blk7"], "the crane down the wall finds Spud passing a block taller than he is");

// ================================================================= 08 HEAVIER THAN A CAR (21.0-27.0): the beam weighs them
// Two beams switch on over the car and the block; the car floats up light, the block barely leaves the ground and drags
// its beam; both drop: the car bounces on its wheels, the block slams down in dust. Then his palm on the stone.
A(T.p08 - 0.6, "spud", "turn", { to: 10, dur: 0.45, ease: "inOut" });
look(T.p08, "spud", [0, 0.1], 0.01);
P(21.15, "s8c-ship", { beam: 0.6 }, 0.35, "out"); P(21.25, "s8b-ship", { beam: 0.6 }, 0.35, "out");
sfx(21.15, "kenney/space-engine-low", { gain: 0.1, dur: 3.1, reason: "the ship's low hum far over the two beams" });
const l5b = say(21.5, "l5b");
P(22.0, "car7", { y: 1.3 }, 0.9, "out"); P(22.9, "car7", { y: 1.1 }, 0.5, "inOut"); P(23.4, "car7", { y: 1.22 }, 0.5, "inOut");   // it bobs, light
P(22.3, "blk7", { y: 0.3 }, 1.0, "inOut"); P(23.3, "blk7", { y: 0.24 }, 0.6, "inOut");   // heavy: a hand's width
P(22.3, "s8b-ship", { wobble: 1 }, 0.4, "out");
look(22.2, "spud", [0.55, 0.65], 0.2); expr(22.3, "spud", "surprised", { open: 0.15 }, 0.15);
look(23.0, "spud", [-0.55, 0.2], 0.2); expr(23.1, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.2);
cap(22.4, 25.3, "1.2 t", TXT, false, { ...TXTS, size: 76, x: 770 });
cap(23.0, 25.3, "2.5 t", TXT, false, { ...TXTS, size: 124, x: 300 });
P(24.0, "s8c-ship", { beam: 0 }, 0.15, "in"); P(24.05, "s8b-ship", { beam: 0, wobble: 0 }, 0.15, "in");
P(24.0, "car7", { y: PAVE }, 0.38, "in"); P(24.38, "car7", { y: 0.22 }, 0.12, "out"); P(24.5, "car7", { y: PAVE }, 0.14, "in");
P(24.05, "blk7", { y: PAVE }, 0.2, "in"); P(24.25, "blk7", { dust: 1 }, 1.2, "out");
sfx(24.38, "ai/car-door-shove", { gain: 0.45, reason: "the car lands on its springs" });
sfx(24.25, "thud", { gain: 1, loud: true, reason: "the block slams back down" });
sfx(24.27, "kenney/impact-mining", { gain: 0.5, reason: "grit under the block" });
A(24.27, "spud", "squash", { amount: 0.06, dur: 0.25 });
A(T.touch, "spud", "turn", { to: -55, dur: 0.4, ease: "inOut" });
look(T.touch, "spud", [-0.5, 0.15], 0.2);
// palm flat on the block's east face (block-local: the face at x +0.65); the palm faces a point inside the stone
c.arm(r3(T.touch + 0.25), "spud", "R", { prop: "blk7", grip: [0.66, 0.85, 0.25], palm: [0.26, 0.85, 0.25] }, 0.45, "inOut");
A(r3(T.touch + 0.25), "spud", "grip", { side: "R", shape: "flat", dur: 0.3 });
expr(r3(T.touch + 0.8), "spud", "neutral", { lid: 0.35, brow: 0.2 }, 0.3);
sfx(r3(T.touch + 0.7), "cloth", { gain: 0.25, reason: "his glove on the stone" });
see(T.p08, T.p09, ["spud.face", "blk7", "car7"], "the beams weigh car and block: the car flies up, the block barely moves; his palm on the stone");

// ================================================================= 09 THE TOUCH TAKES HIM BACK (27.0-36.0), same frame, 2560 BC
// The block he touched comes down in the beam onto its spot; he shakes his head (no cranes, no steel); the foreman walks in
// and waves him off the landing; the timer hits 0:00 as it lands and the dust rolls over Spud.
place(T.p09, "spud", at(PL.casing, W1[0] - PL.foot[0], W1[1] - PL.foot[1]), 10, PAVE);
c.arm(T.p09, "spud", "R", { o: [0.05, 0.5, 0.28] }, 0.01); A(T.p09, "spud", "grip", { side: "R", shape: "flat", dur: 0.01 });   // his palm in the air where the stone was
look(T.p09, "spud", [-0.4, 0.2], 0.01);
c.arm(r3(T.p09 + 0.4), "spud", "R", "rest", 0.45, "inOut"); A(r3(T.p09 + 0.4), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
P(T.p09, "s9-block", { y: r3(PAVE + 7.5) }); P(r3(T.p09 + 0.02), "s9-block", { y: r3(PAVE + 1.6) }, r3(T.land2 - T.p09 - 0.55), "inOut");
P(r3(T.land2 - 0.5), "s9-block", { y: PAVE }, 0.5, "in");
sfx(T.p09, "kenney/space-engine-low", { gain: 0.1, dur: r3(T.p10 - T.p09 - 0.3), reason: "the ship's low hum far over him" });
const l6 = say(27.4, "l6");
look(27.45, "spud", [0, 0.1], 0.15);
A(27.6, "spud", "turn", { to: -8, dur: 0.22, ease: "inOut" }); A(27.85, "spud", "turn", { to: 26, dur: 0.28, ease: "inOut" }); A(28.15, "spud", "turn", { to: 10, dur: 0.22, ease: "inOut" });   // no, no
const F0 = at(PL.casing, 3.4, 5.3), F1 = at(PL.casing, 1.85, 5.0), SP9b = at(PL.casing, 0.9, 5.2);
place(T.p09, "fore", F0, -90);
look(28.3, "fore", [-0.4, 0.1], 0.13);
A(28.4, "fore", "move", { to: F1, dur: 0.9, stride: 0.5, ease: "inOut" });
c.arm(29.2, "fore", "L", "wave", 0.3, "out"); c.arm(30.1, "fore", "L", "rest", 0.4, "inOut");   // waves him back
look(29.2, "spud", [0.55, 0.1], 0.15); expr(29.3, "spud", "neutral", { brow: 0.5 }, 0.15);
A(29.55, "spud", "move", { to: SP9b, dur: 0.6, stride: 0.4, ease: "inOut" });
look(30.4, "spud", [-0.3, 0.6], 0.2); look(30.5, "fore", [-0.5, 0.6], 0.2);
cap(28.0, 29.0, "0:04", TXT, false, TXTS);
for (let s = 3; s >= 0; s--) cap(r3(T.land2 - s), s === 0 ? r3(T.land2 + 0.6) : r3(T.land2 - s + 1), `0:0${s}`, TXT, false, { ...TXTS, size: s === 0 ? 124 : 96 });
P(T.land2, "s9-block", { dust: 1 }, 1.2, "out");
sfx(T.land2, "thud", { gain: 1, loud: true, reason: "the block lands beside him" });
sfx(r3(T.land2 + 0.02), "kenney/impact-mining", { gain: 0.5, reason: "grit under the block" });
A(T.land2, "spud", "squash", { amount: 0.05, dur: 0.25 }); A(T.land2, "fore", "squash", { amount: 0.05, dur: 0.25 });
expr(r3(T.land2 + 0.15), "spud", "neutral", { lid: 0.7 }, 0.1);   // eyes squeezed in the dust
look(r3(T.land2 + 1.2), "spud", [0, 0.1], 0.2); expr(r3(T.land2 + 1.2), "spud", "neutral", { brow: 0.7, lid: 0.3 }, 0.2);   // then to us, one brow up
cap(r3(T.land2 + 0.6), r3(T.p10 - 0.4), "1 BLOCK = 2:00", TXT, false, TXTS);
see(T.p09, T.p10, ["spud.face", "s9-block", "fore"], "2560 BC: the same block comes down, the foreman waves Spud off, it lands at 0:00");

// ================================================================= 10 THE MOUNTAIN (36.0-39.2): the camera climbs the face, a metre counter
park(T.p10, "fore", 7);
const SP10 = [PL.up[0], 50.4];
place(T.p10, "spud", SP10, 180); look(T.p10, "spud", [0, 0.5], 0.01);
look(36.6, "spud", [0, 0.95], 1.2);
A(36.6, "spud", "pitch", { to: -12, dur: 1.6, ease: "inOut" });   // leaning back further and further
A(38.5, "spud", "move", { to: [SP10[0], 50.75], dur: 0.35, stride: 0.3, ease: "out" });   // a step back to keep his balance
A(38.6, "spud", "pitch", { to: 0, dur: 0.4, ease: "inOut" });
say(36.3, "l7a");
count(36.5, 38.5, T.p11, 0, 146, (v) => `${Math.round(v)} m`, { size: 110 });
see(T.p10, T.p11, ["spud", "g10-giza"], "the camera climbs the stepped face from Spud to the top, 0 to 146 m");

// ================================================================= 11 TALLEST FOR 3,800 YEARS (39.2-46.0): orbit + a year counter
say(r3(T.p11 + 0.15), "l7b");
count(39.5, 43.6, 43.7, -2560, 1311, (v) => { const y = Math.round(v); return y < 0 ? `${-y} BC` : `${Math.max(1, y)} AD`; });
cap(43.7, T.p12, "#1 · 3,800 YEARS", TXT, false, { ...TXTS, size: 84 });
// the ship stays off the gold tip: it drifts away over the west tombs, climbing (kit thread 13 Nov)
P(T.p11, "s11-ship", { x: r3(PL.high[0] - 48), y: 40, z: 18 }); P(r3(T.p11 + 0.02), "s11-ship", { x: r3(PL.high[0] - 78), y: 52, z: -30 }, r3(T.p12 - T.p11 - 0.05), "linear");
sfx(T.p11, "kenney/space-engine-low", { gain: 0.08, dur: r3(T.p12 - T.p11 - 0.2), reason: "the ship's hum, far" });
see(T.p11, T.p12, ["g11-pyr", "s11-ship"], "the finished white pyramid, the camera circling, the ship crossing");

// ================================================================= 12 THE TURN (46.0-56.0): the tunnel mouth, the lamp clicks on, into the dark
const SP12 = at(PL.door, 0, -0.55), IN12 = at(PL.door, 0, -4.4);
place(T.p12, "spud", SP12, 180);
look(T.p12, "spud", [0, 0.1], 0.01); expr(T.p12, "spud", "neutral", { brow: 0.3 }, 0.01);
A(T.p12, "spud", "pitch", { to: 0, dur: 0.01 });
const l8 = say(46.5, "l8");
look(r3(l8 + 0.2), "spud", [0, 0.05], 0.2);
P(T.click, "spud-lamp", { lit: 1 }, 0.06);
sfx(T.click, "latch-click", { gain: 0.6, reason: "the headlamp clicks on" });
look(r3(T.click + 0.4), "spud", [0, -0.05], 0.15);
A(r3(T.click + 0.55), "spud", "move", { to: IN12, dur: 3.4, stride: 0.6, ease: "inOut" });
expr(r3(T.click + 0.3), "spud", "focused", { brow: 0.5 }, 0.2);
see(T.p12, END, ["spud.face", "door12"], "the tunnel mouth: the lamp clicks on and he walks in toward us, into the dark");

// wind far under every outdoor shot (Jonny 9 Nov: ~0.06)
for (const [a, b] of [[0, T.p02], [T.p03, T.night], [T.close6, T.p11], [T.p12, END]]) for (let t = a; t < b - 0.3; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain: 0.06, dur: r3(Math.min(6, b - t)), reason: "far desert wind under the scene" });

// ---------------------------------------------------------------- shots (a push or a move on every one: something changes every 3 s)
const C01 = cam(PL.past, { pos: [-30, 0.9, 215], look: [0, 15.9, 0], fov: 24 });
const same = (from, to, v) => ({ ...v, pos: [r3(v.pos[0] - from[0] + to[0]), v.pos[1], r3(v.pos[2] - from[1] + to[1])], look: [r3(v.look[0] - from[0] + to[0]), v.look[1], r3(v.look[2] - from[1] + to[1])], ...(v.to && { to: { pos: [r3(v.to.pos[0] - from[0] + to[0]), v.to.pos[1], r3(v.to.pos[2] - from[1] + to[1])] } }) });
const push = (v, d, dur, dy = 0) => { const dx = v.look[0] - v.pos[0], dz = v.look[2] - v.pos[2], n = Math.hypot(dx, dz); return { ...v, to: { pos: [r3(v.pos[0] + (dx / n) * d), r3(v.pos[1] + dy), r3(v.pos[2] + (dz / n) * d)] }, dur }; };
const C03 = (k) => cam(PL.past, { pos: [-30.6 + 0.25 * k, 1.5, 214.5 - 0.6 * k], look: [0, 12, 0], fov: 32 });
const C06 = cam(PL.wide, { pos: [-150, 1.5, 211.5], look: [-56, 24, 56], fov: 34 });
const C08 = cam(PL.foot, { pos: [0.55, 1.0, 14.5], look: [0.55, 1.15, 3.4], fov: 40 });
const SHOTS = [
  ["01 hook", T.p01, push(C01, 0.6, 1.3), "hook"],
  ["02 the landing", T.p02, push(cam(PL.top, { pos: [0.7, TOPY + 1.5, 9.8], look: [0.7, TOPY + 1.1, 2.0], fov: 46 }), 1.0, 1.7)],
  ["03 time-lapse 1", T.p03, C03(0)],
  ["03 time-lapse 2", T.tl2, C03(1)],
  ["03 time-lapse 3", T.tl3, push(C03(2), 0.4, 1.0)],
  ["04 he points", T.p04, push(C01, 0.9, r3(SNAP - T.p04))],
  ["05 today", SNAP, same(PL.past, PL.today, push(C01, 0.9, r3(T.p06 - SNAP))), "reveal"],
  ["06 five clues", T.p06, push(C06, 0.9, r3(T.night - T.p06))],
  ["06 tonight", T.night, { ...cam(PL.night, { pos: [-150, 1.2, 232], look: [-56, 36, 56], fov: 32 }), to: { pos: [PL.night[0] - 150, 1.2, 232], look: [PL.night[0] - 56, 44, 56] }, dur: r3(T.close6 - T.night) }],
  ["06 who built them", T.close6, push({ pos: [CAMC[0], 0.75, CAMC[1]], look: [PL.wide[0] - 56, 24, 56], fov: 34 }, 0.8, r3(T.p07 - T.close6))],
  ["07 clue 1", T.p07, { ...cam(PL.foot, { pos: [-2.4, 5.5, 9.0], look: [-0.6, 5.0, 0], fov: 46 }), to: { pos: [PL.foot[0] - 2.6, 0.95, 9.4], look: [PL.foot[0] - 0.4, 1.0, 4.0] }, dur: 2.2 }],
  ["08 heavier than a car", T.p08, push(C08, 0.9, r3(T.p09 - T.p08))],
  ["09 2560 BC", T.p09, same(PL.foot, PL.casing, push(C08, 1.2, r3(T.p10 - T.p09))), "reveal"],
  ["10 the mountain", T.p10, { pos: [C10[0], 0.45, C10[1]], look: [PL.up[0], 0.7, 40], fov: 58, to: { pos: [C10[0], 5.5, C10[1] + 1], look: [PL.up[0], 25, 0] }, dur: 2.6 }],
  ["11 tallest", T.p11, { ...cam(PL.high, VIEW.finishedHigh), to: { pos: [r3(PL.high[0] + VIEW.finishedHighEnd.pos[0]), VIEW.finishedHighEnd.pos[1], VIEW.finishedHighEnd.pos[2]] }, dur: r3(T.p12 - T.p11) }],   // kit 3d1a66b: the whole complex, the gold tip, sky on top
  ["12 into the dark", T.p12, { pos: [PL.door[0], 1.0, -6.3], look: [PL.door[0], 0.85, 0], fov: 56, to: { pos: [PL.door[0], 1.0, -6.75] }, dur: 9.6 }],
];
const beats = c.beats(SHOTS, END);

write(import.meta.url, {
  id: "aa-01-block-a",
  title: "Who really built the pyramids? (block A)",
  idea: "Ancient aliens EP01 block A (0:00-0:56): a block lands every two minutes in 2560 BC and the pyramid climbs; snap to today; Spud's contract (five clues, answered when three stars rise tonight); clue 1: the beam weighs a car and a block, his touch takes him back as the same block lands; 146 m, tallest for 3,800 years; the headlamp clicks on and he walks into the dark",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [200, 1360],
  castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
  set: SET, music: score(0),
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
  notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-a/make-block-a.mjs (v2). Block A of four (kit/BLOCKS.md); music = the pilot score's first 56 s (kit score(0)).",
});
